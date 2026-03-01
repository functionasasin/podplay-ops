# Email Domain — Tool Specifications

**Domain**: Email
**Spec file**: `specs/email.md`
**Wave 2 status**: Tool design complete
**Wave 3 status**: Thread Listing + Thread Operations + Attachments complete (7/24 tools fully specified)

---

## Table of Contents

1. [Thread Listing & Filtering](#thread-listing--filtering) (1 new + 3 existing = 4 tools)
2. [Thread Operations](#thread-operations) (2 tools)
3. [Attachments](#attachments) (1 tool)
4. [Draft Management](#draft-management) (3 tools)
5. [Email Sending](#email-sending) (1 tool)
6. [Scheduled Email Dispatch](#scheduled-email-dispatch) (4 tools)
7. [Email Signatures](#email-signatures) (6 tools)
8. [Bulk Draft Edit](#bulk-draft-edit) (1 tool)
9. [AI Email Improvement](#ai-email-improvement) (1 tool)
10. [Thread Summary](#thread-summary) (1 tool)

**Total**: 24 tools (3 existing + 21 new)

> **Note**: Email signatures are managed via `/email-signatures` backend routes (this spec). The campaigns domain (`specs/campaigns.md`) also has 3 campaign-scoped signature convenience tools that map to proposed new campaign-oriented service routes. These are parallel interfaces to the same underlying signature data — the forward loop may consolidate or keep both.

> **Note on SMTP/Gmail dual-provider**: All thread operations auto-detect Gmail vs SMTP threads. Thread IDs starting with `<` and ending with `>` are SMTP; bare hex strings (e.g., `18f3a2b4c5d6e7f8`) are Gmail. Tools accepting `thread_id` must support both formats. The backend's `_is_smtp_thread_id()` handles routing internally.

---

## Thread Listing & Filtering

### `cheerful_search_emails`

**Status**: EXISTS — verified against source, corrections noted

**Purpose**: Full-text search within campaign email threads by query string. Searches across both Gmail and SMTP threads, merging results sorted by latest date.

**Maps to**: `GET /api/service/threads/search`

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated (searches only user's campaigns). **SECURITY NOTE (existing gap)**: The current service route does NOT validate `user_id` — the parameter is sent by the CE API client but the FastAPI endpoint does not declare it, so it is silently ignored. Any caller with a valid service API key can search any campaign. The new service route MUST accept and enforce `user_id` scoping.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | string (uuid) | yes | — | Campaign UUID to search within |
| query | string | yes | — | Full-text search query. Searches sender email, recipient emails, subject, and body text. Plain text matching (no operators like AND/OR/quotes — uses SQL `ILIKE` with `%query%` pattern) |
| direction | string | no | null | Filter by message direction. One of: `"INBOUND"`, `"OUTBOUND"` (uppercase). Case-sensitive — the service route passes this directly to the repository |
| limit | integer | no | 20 | Max results. Range: 1-50. Validated via `le=50` on the service route |

**Parameter Validation Rules**:
- `campaign_id` must be a valid UUID: FastAPI raises 422 if not parseable
- `query` is required (no default): FastAPI raises 422 if missing
- `limit` must be ≤ 50: FastAPI raises 422 `"ensure this value is less than or equal to 50"`

**Return Schema** — Array of `ThreadSearchResult`:

```json
[
  {
    "gmail_thread_id": "string — Gmail thread hex ID or SMTP angle-bracket ID (e.g., '18f3a2b4c5d6e7f8' or '<msg-id@smtp.example.com>')",
    "subject": "string — Email subject line",
    "sender_email": "string — Sender email address",
    "recipient_emails": ["string — Array of recipient email addresses"],
    "direction": "string — 'inbound' or 'outbound' (lowercase, from GmailMessageDirection enum)",
    "message_count": "integer — Number of messages in the thread",
    "latest_date": "datetime — ISO 8601 timestamp of the most recent message",
    "matched_snippet": "string — Text snippet containing the search match"
  }
]
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Missing campaign_id | "field required" | 422 |
| Missing query | "field required" | 422 |
| Invalid campaign_id format | "value is not a valid uuid" | 422 |
| limit > 50 | "ensure this value is less than or equal to 50" | 422 |
| Service API error | ToolError: "Email search failed ({status}): {body}" | varies |

**Pagination**: Not paginated — returns up to `limit` results (max 50). Combined Gmail + SMTP results are sorted by `latest_date DESC` and trimmed to `limit`.

**Example Request**:
```
cheerful_search_emails(campaign_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890", query="discount code", direction="INBOUND", limit=10)
```

**Example Response** (realistic data):
```json
[
  {
    "gmail_thread_id": "18f3a2b4c5d6e7f8",
    "subject": "Re: Collaboration opportunity — discount code request",
    "sender_email": "creator@example.com",
    "recipient_emails": ["brand@company.com"],
    "direction": "inbound",
    "message_count": 4,
    "latest_date": "2026-02-28T14:30:00Z",
    "matched_snippet": "...I'd love to get a discount code for my followers. Could you send one..."
  },
  {
    "gmail_thread_id": "<msg-123@smtp.example.com>",
    "subject": "Discount code for February campaign",
    "sender_email": "outreach@company.com",
    "recipient_emails": ["influencer@example.com"],
    "direction": "outbound",
    "message_count": 1,
    "latest_date": "2026-02-27T09:15:00Z",
    "matched_snippet": "Here is your unique discount code: CREATOR20..."
  }
]
```

**Slack Formatting Notes**:
- Present as a numbered list: `1. [Subject] — from [sender] ([direction], [message_count] msgs, [date])`
- Truncate subject to 60 chars
- Include `matched_snippet` as a quote block under each result if space permits
- For empty results: "No matching threads found. Try broader search terms."

**Edge Cases**:
- Empty results: Returns empty array `[]`, not an error
- SMTP threads mixed with Gmail threads: Both are returned in the same array, distinguished by thread ID format
- Very long matched_snippet: The backend truncates snippets at the repository level
- Campaign with no threads: Returns empty array
- Direction filter is case-sensitive: "INBOUND" works, "inbound" does not match the service route expectation (the service route passes the string directly to the repository which expects uppercase)

**Source Code Audit Notes** (for w3-existing-tools-audit):
- The CE tool `SearchEmailsInput.direction` is described as "INBOUND or OUTBOUND" — this matches the service route
- The CE tool default `limit=20` matches the service route default
- The CE formatter `_fmt_thread_summary` maps `thread.get("sender")` but the actual response field is `sender_email` — potential data loss in formatting
- The CE formatter also maps `thread.get("snippet")` but the actual field is `matched_snippet` — potential data loss
- The CE formatter maps `thread.get("recipient")` but the actual field is `recipient_emails` (array) — potential data loss

---

### `cheerful_get_thread`

**Status**: EXISTS — verified against source, corrections noted

**Purpose**: Fetch a full email thread with all messages. Returns the complete conversation including sender/recipient details and body text. Auto-detects Gmail vs SMTP threads.

**Maps to**: `GET /api/service/threads/{gmail_thread_id}`

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. **SECURITY NOTE (existing gap)**: The current service route does NOT validate `user_id` — the endpoint function signature is `def get_thread(gmail_thread_id: str)` with no `user_id` parameter. Any caller with a valid service API key can read any thread by ID. The new service route MUST accept and enforce `user_id` scoping.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| gmail_thread_id | string | yes | — | Thread ID. Supports both Gmail hex format (e.g., `18f3a2b4c5d6e7f8`) and SMTP angle-bracket format (e.g., `<msg-id@smtp.example.com>`). The backend auto-detects via `_is_smtp_thread_id()` |

**Parameter Validation Rules**:
- `gmail_thread_id` must be a non-empty string: passed as a path parameter

**Return Schema** — `ThreadDetailResponse`:

```json
{
  "gmail_thread_id": "string — The thread ID (same as input)",
  "messages": [
    {
      "gmail_message_id": "string — Gmail message ID (hex) or SMTP message-ID header",
      "direction": "string — 'inbound' or 'outbound' (lowercase, from GmailMessageDirection)",
      "sender_email": "string — Sender email address",
      "recipient_emails": ["string — Array of recipient email addresses"],
      "subject": "string — Email subject line (empty string if null in DB)",
      "body_text": "string — Plain text email body (empty string if null in DB)",
      "internal_date": "datetime — ISO 8601 timestamp when the message was received/sent"
    }
  ]
}
```

**Fields NOT included in service response** (available in main API `GmailMessageResponse` but missing from service `ThreadMessage`):
- `id` (database UUID) — not in service model
- `cc_emails` — not in service model
- `body_html` — not in service model
- `labels` — not in service model
- Thread-level metadata: `status`, `flags`, `campaign_id`, `preferences__is_hidden`, `gifting_status`, `paid_promotion_status` — not in service model

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Thread not found | ToolError: "Thread '{gmail_thread_id}' not found" | 404 |
| Service API error | ToolError: "Failed to get thread ({status}): {body}" | varies |

**Pagination**: Not paginated — returns all messages in the thread.

**Example Request**:
```
cheerful_get_thread(gmail_thread_id="18f3a2b4c5d6e7f8")
```

**Example Response** (realistic data):
```json
{
  "gmail_thread_id": "18f3a2b4c5d6e7f8",
  "messages": [
    {
      "gmail_message_id": "18f3a2b4c5d6e7f8",
      "direction": "outbound",
      "sender_email": "brand@company.com",
      "recipient_emails": ["creator@example.com"],
      "subject": "Collaboration opportunity with BrandX",
      "body_text": "Hi Sarah,\n\nWe love your content and would like to send you some products...",
      "internal_date": "2026-02-25T10:00:00Z"
    },
    {
      "gmail_message_id": "18f4b3c5d6e7f809",
      "direction": "inbound",
      "sender_email": "creator@example.com",
      "recipient_emails": ["brand@company.com"],
      "subject": "Re: Collaboration opportunity with BrandX",
      "body_text": "Hi! I'd love to try your products. What size should I pick?",
      "internal_date": "2026-02-26T15:30:00Z"
    }
  ]
}
```

**Slack Formatting Notes**:
- Present thread subject as a header, then each message as a block
- Format: `[direction arrow ← or →] [sender] — [date]\n[body text truncated to 3000 chars]`
- The CE formatter already truncates body text to 3000 chars with "... [truncated]" suffix
- For SMTP threads, the message ID will be in angle-bracket format

**Edge Cases**:
- Thread with no messages: Returns `{"gmail_thread_id": "...", "messages": []}` (empty array)
- SMTP thread: Auto-detected, queries SMTP tables. SMTP message IDs use `message_id_header` format
- Very long email bodies: The backend does not truncate; the CE formatter truncates at 3000 chars
- Thread that exists in both Gmail and SMTP: Impossible — each thread ID belongs to one provider

**Source Code Audit Notes** (for w3-existing-tools-audit):
- The CE formatter `_fmt_thread_detail` maps `thread.get("subject")` from the response — but `subject` is NOT a top-level field on `ThreadDetailResponse`. It's only on individual `ThreadMessage` objects. The formatter falls back to "No subject". To get the subject, it should read `thread["messages"][0]["subject"]` if messages exist.
- The CE formatter maps `message.get("from")` and `message.get("to")` — but the actual fields are `sender_email` and `recipient_emails`. This means from/to are always empty strings in the formatted output.
- The CE formatter maps `message.get("body_text")` — this matches the actual field name.

---

### `cheerful_find_similar_emails`

**Status**: EXISTS — verified against source, corrections noted

**Purpose**: Semantic similarity search via pgvector RAG. Finds email reply examples with similar meaning to a query string or reference thread. Uses OpenAI text-embedding-3-small (1536 dimensions) for embedding, then cosine similarity search against the `email_reply_example` table.

**Maps to**: `GET /api/service/rag/similar`

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. **SECURITY NOTE (existing gap)**: The current service route does NOT validate `user_id` — the endpoint accepts `campaign_id`, `query`, `thread_id`, `limit`, `min_similarity` only. Any caller with a valid service API key can search any campaign's reply examples. The new service route MUST accept and enforce `user_id` scoping.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | string (uuid) | yes | — | Campaign UUID to search within. Only reply examples from this campaign are searched |
| query | string | no | null | Natural language query describing the email pattern to find. Mutually exclusive with `thread_id` — at least one must be provided |
| thread_id | string | no | null | Reference thread ID to find similar threads. The last 5 messages' body text (up to 4000 chars total) is embedded and used as the search vector. Mutually exclusive with `query` — at least one must be provided |
| limit | integer | no | 5 | Max results. Range: 1-10. Validated via `le=10` on the service route |
| min_similarity | float | no | 0.3 | Minimum cosine similarity threshold. Range: 0.0-1.0. Results below this threshold are excluded |

**Parameter Validation Rules**:
- At least one of `query` or `thread_id` is required: CE client raises `ToolError("Either query or thread_id is required for similarity search")` pre-request; service route raises 422 `"Either 'query' or 'thread_id' must be provided"` if both are null
- `limit` must be ≤ 10: FastAPI raises 422 if exceeded
- If `thread_id` references a thread with no messages or only whitespace body text: returns empty array (no error)

**Return Schema** — Array of `SimilarEmailResult`:

```json
[
  {
    "thread_id": "string — Thread ID of the similar email (Gmail hex or SMTP angle-bracket)",
    "campaign_id": "string — Campaign UUID the reply example belongs to",
    "thread_summary": "string — AI-generated summary of the thread conversation",
    "inbound_email_text": "string — The inbound email text that was replied to",
    "sent_reply_text": "string — The actual reply that was sent",
    "sanitized_reply_text": "string | null — Sanitized/cleaned version of the reply (null if not available)",
    "similarity": "float — Cosine similarity score (0.0 to 1.0, higher is more similar)"
  }
]
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Neither query nor thread_id provided | ToolError: "Either query or thread_id is required for similarity search" | N/A (pre-request) |
| Neither query nor thread_id (at service level) | "Either 'query' or 'thread_id' must be provided" | 422 |
| Invalid campaign_id format | "value is not a valid uuid" | 422 |
| limit > 10 | "ensure this value is less than or equal to 10" | 422 |
| Service API error | ToolError: "Similarity search failed ({status}): {body}" | varies |

**Pagination**: Not paginated — returns up to `limit` results (max 10).

**Example Request**:
```
cheerful_find_similar_emails(campaign_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890", query="creator asking about product sizing", limit=3, min_similarity=0.5)
```

**Example Response** (realistic data):
```json
[
  {
    "thread_id": "18f1a2b3c4d5e6f7",
    "campaign_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "thread_summary": "Creator asked about available sizes for the winter collection. Brand provided size chart and offered to send both S and M.",
    "inbound_email_text": "Hi! I'm interested in the collab but I'm not sure which size to pick. Do you have a size chart?",
    "sent_reply_text": "Great question! Here's our size chart: [link]. If you're between sizes, I'd recommend going with M. I can send both S and M if you'd like to try both!",
    "sanitized_reply_text": "Here's our size chart. If you're between sizes, I'd recommend going with M. I can send both sizes if you'd like to try both!",
    "similarity": 0.847
  }
]
```

**Slack Formatting Notes**:
- Present each result with similarity score as a percentage: `87% similar`
- Show the thread_summary as the main description
- Show sent_reply_text (or sanitized_reply_text if available) as an example reply in a quote block
- Truncate reply text to 2000 chars (the CE formatter already does this)
- For empty results: "No similar emails found. Try a different query or lower min_similarity."

**Edge Cases**:
- No reply examples in campaign: Returns empty array
- Thread with only whitespace body text: Returns empty array (no embedding generated)
- Very high min_similarity (e.g., 0.99): May return empty array — no exact matches
- SMTP thread as reference: Supported — auto-detected via `_is_smtp_thread_id()`
- The embedding service uses the last 5 messages' body_text concatenated, trimmed to 4000 chars

**Source Code Audit Notes** (for w3-existing-tools-audit):
- The CE formatter `_fmt_similar_email` maps `result.get("summary")` — but the actual field is `thread_summary`. This means summary is always empty in formatted output.
- The CE formatter maps `result.get("reply_text")` — but the actual fields are `sent_reply_text` and `sanitized_reply_text`. Reply text is always empty in formatted output.
- The CE formatter maps `result.get("subject")` — but there is no `subject` field on `SimilarEmailResult`. Subject is always empty.
- The CE formatter maps `result.get("thread_id")` correctly for the ID attribute.
- The CE formatter maps `result.get("similarity")` correctly for the score.
- **These formatting bugs mean the existing tool returns mostly empty XML tags** — a critical issue for the w3-existing-tools-audit to address.

---

### `cheerful_list_threads`

**Status**: NEW — full OpenAPI-level spec

**Purpose**: List email threads with comprehensive filtering by status, direction, campaign, account, and search text. The primary inbox view endpoint with full filter support. Merges Gmail and SMTP threads, sorted by most recent first.

**Maps to**: `GET /api/service/threads` (new service route needed; mirrors main route: `GET /threads/`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated — returns only threads from user's owned Gmail/SMTP accounts OR campaigns the user is assigned to as a team member. The backend uses `CampaignMemberAssignmentRepository` to determine assigned campaigns for team members.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | string (uuid) | no | null | Filter to a single campaign. Mutually exclusive with `campaign_ids` — use one or neither |
| campaign_ids | string[] (uuid[]) | no | null | Filter to multiple campaigns. Mutually exclusive with `campaign_id` |
| status_filter | string[] (enum[]) | no | null | Filter by thread status. Each value must be one of the `GmailThreadStatus` enum values: `"READY_FOR_ATTACHMENT_EXTRACTION"`, `"READY_FOR_CAMPAIGN_ASSOCIATION"`, `"READY_FOR_RESPONSE_DRAFT"`, `"WAITING_FOR_DRAFT_REVIEW"`, `"WAITING_FOR_INBOUND"`, `"IGNORE"`, `"DONE"`, `"NOT_LATEST"`. Multiple values = OR filter (thread matches if status is ANY of the provided values) |
| direction_filter | string (enum) | no | null | Filter by latest message direction. One of: `"inbound"`, `"outbound"` (lowercase — uses `GmailMessageDirection` StrEnum) |
| gmail_account_ids | string[] (uuid[]) | no | null | Filter by Gmail account UUIDs. Only threads from these accounts are returned |
| smtp_account_ids | string[] (uuid[]) | no | null | Filter by SMTP account UUIDs. Only threads from these accounts are returned |
| show_hidden | boolean | no | false | When `false` (default), hidden/archived threads are excluded. When `true`, both hidden and visible threads are included |
| search | string | no | null | Free-text search across sender email, recipient email, and subject. Uses SQL `ILIKE` matching |
| participant_email | string | no | null | Filter to threads where this email address appears as either sender or recipient in any message |
| include_messages | boolean | no | false | When `false` (default), returns `ThreadSummary[]` (lightweight). When `true`, returns `ThreadWithMessages[]` with full message bodies, attachments, and draft injection |
| limit | integer | no | 50 | Results per page. Range: 1-100. Validated via `ge=1, le=100` |
| offset | integer | no | 0 | Pagination offset for result page. Validated via `ge=0` |

**Parameter Validation Rules**:
- `limit` must be 1-100: FastAPI raises 422 if out of range
- `offset` must be ≥ 0: FastAPI raises 422 if negative
- `status_filter` values must be valid `GmailThreadStatus` enum values: FastAPI raises 422 for invalid enum values
- `direction_filter` must be `"inbound"` or `"outbound"`: FastAPI raises 422 for invalid enum values
- All UUID parameters must be valid UUID format: FastAPI raises 422 if not parseable

**Return Schema (when `include_messages=false`)** — Array of `ThreadSummary`:

```json
[
  {
    "gmail_thread_id": "string — Gmail thread hex ID or SMTP angle-bracket ID",
    "gmail_thread_state_id": "string (uuid) — Current thread state UUID. Used as version anchor for draft operations",
    "status": "string — GmailThreadStatus enum value (one of the 8 values listed above)",
    "latest_internal_date": "datetime — ISO 8601 timestamp of the most recent message",
    "latest_direction": "string — 'inbound' or 'outbound' (GmailMessageDirection enum). The direction of the most recent message",
    "snippet": "string — First ~150 characters of the latest message body_text",
    "sender_email": "string — Email address of the latest message sender",
    "subject": "string | null — Email subject line. Null if no subject",
    "campaign_id": "string (uuid) | null — Associated campaign UUID. Null if thread is not yet associated with a campaign",
    "preferences__is_hidden": "boolean — Whether the thread is hidden/archived by this user",
    "gifting_status": "string | null — Creator's gifting pipeline status from campaign_creator table. Null if no creator match or not a gifting campaign",
    "paid_promotion_status": "string | null — Creator's paid promotion pipeline status. Null if no creator match or not a paid promotion campaign",
    "flags": {
      "wants_paid": "boolean — AI-detected flag: creator expressed interest in paid promotion. Default: false",
      "wants_paid_reason": "string | null — AI explanation for why wants_paid was set. Null if wants_paid is false",
      "has_question": "boolean — AI-detected flag: creator asked a question requiring response. Default: false",
      "has_question_reason": "string | null — AI explanation for the detected question. Null if has_question is false",
      "has_issue": "boolean — AI-detected flag: creator raised an issue or complaint. Default: false",
      "has_issue_reason": "string | null — AI explanation for the detected issue. Null if has_issue is false"
    }
  }
]
```

**Return Schema (when `include_messages=true`)** — Array of `ThreadWithMessages`:

All `ThreadSummary` fields above, PLUS:

```json
[
  {
    "...all ThreadSummary fields...",
    "sender_name": "string — Parsed display name from the sender email (e.g., 'Sarah Johnson' from 'Sarah Johnson <sarah@example.com>')",
    "account_email": "string — The Gmail/SMTP account email this thread belongs to (the user's connected account)",
    "is_unread": "boolean — Whether any message in the thread has the UNREAD label (Gmail) or unread flag (SMTP)",
    "labels": ["string — Aggregated Gmail labels from all messages in the thread (e.g., 'INBOX', 'UNREAD', 'IMPORTANT')"],
    "messages": [
      {
        "id": "string — Gmail message ID (hex string for Gmail, message-ID header for SMTP). Used for frontend display, NOT for database lookups",
        "db_message_id": "string (uuid) | null — Database message UUID. Use this for attachment lookups with cheerful_list_message_attachments. Null for injected draft messages",
        "thread_id": "string — Parent thread ID (same as gmail_thread_id)",
        "sender_name": "string — Parsed display name of the sender",
        "sender_email": "string — Sender email address",
        "recipient_emails": ["string — Array of recipient (To) email addresses"],
        "cc_emails": ["string — Array of CC email addresses"],
        "subject": "string | null — Message subject. Null if no subject",
        "body_text": "string | null — Plain text body. Null if message has no text part",
        "body_html": "string | null — HTML body. Null if message has no HTML part",
        "date": "datetime — ISO 8601 message date",
        "labels": ["string — Gmail labels for this message (e.g., 'SENT', 'INBOX')"],
        "is_read": "boolean — Whether the message has been read (derived from absence of UNREAD label)",
        "is_draft": "boolean — True if this is an injected draft message (not yet sent). Draft messages are virtual — they represent the current draft state appended to the thread",
        "message_id_header": "string | null — RFC 822 Message-ID header value. Used for email threading (In-Reply-To, References). Null for some older messages",
        "attachments": [
          {
            "id": "string (uuid) — Attachment UUID. Use with cheerful_list_message_attachments or download endpoint",
            "gmail_message_id": "string (uuid) — Parent message database UUID",
            "filename": "string | null — Original filename. Null for inline attachments without filenames",
            "mime_type": "string — MIME type (e.g., 'image/jpeg', 'application/pdf')",
            "size": "integer — File size in bytes"
          }
        ],
        "alternative_drafts": "array | null — Only present on draft messages where source='llm'. Array of alternative draft options generated by the AI. Each element is a dict with draft_body_text and draft_subject. Null for non-draft messages and human-edited drafts"
      }
    ]
  }
]
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Invalid UUID format (campaign_id, etc.) | "value is not a valid uuid" | 422 |
| Invalid status_filter value | "value is not a valid enumeration member" | 422 |
| Invalid direction_filter value | "value is not a valid enumeration member" | 422 |
| limit out of range | "ensure this value is greater than or equal to 1" / "ensure this value is less than or equal to 100" | 422 |
| offset negative | "ensure this value is greater than or equal to 0" | 422 |
| Service API error | ToolError with status code and truncated body | varies |

**Pagination**:
- Default limit: 50, max limit: 100
- Offset-based pagination
- Response does NOT include a `total` count — the backend returns only the result array
- To determine if more results exist: if `len(results) == limit`, there are likely more pages
- Results are sorted by `latest_internal_date DESC` (most recent first) after merging Gmail and SMTP threads

**Example Request**:
```
cheerful_list_threads(campaign_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890", status_filter=["WAITING_FOR_DRAFT_REVIEW"], direction_filter="inbound", limit=20, offset=0)
```

**Example Response** (ThreadSummary mode, `include_messages=false`):
```json
[
  {
    "gmail_thread_id": "18f3a2b4c5d6e7f8",
    "gmail_thread_state_id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
    "status": "WAITING_FOR_DRAFT_REVIEW",
    "latest_internal_date": "2026-02-28T14:30:00Z",
    "latest_direction": "inbound",
    "snippet": "Hi! I'd love to try your products. What size should I pick? I usually wear...",
    "sender_email": "creator@example.com",
    "subject": "Re: Collaboration opportunity with BrandX",
    "campaign_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "preferences__is_hidden": false,
    "gifting_status": "INTERESTED",
    "paid_promotion_status": null,
    "flags": {
      "wants_paid": false,
      "wants_paid_reason": null,
      "has_question": true,
      "has_question_reason": "Creator asked about product sizing",
      "has_issue": false,
      "has_issue_reason": null
    }
  }
]
```

**Slack Formatting Notes**:
- Present as a summary list: `[status emoji] [Subject] — [sender_email] ([direction] [date])`
- Status emoji mapping: `WAITING_FOR_DRAFT_REVIEW` → "📝", `WAITING_FOR_INBOUND` → "⏳", `READY_FOR_RESPONSE_DRAFT` → "🤖", `DONE` → "✅", `IGNORE` → "🚫"
- Show flag indicators: `[❓ question]` `[💰 wants paid]` `[⚠️ issue]`
- For large result sets (>10), summarize first: "Found 23 threads: 15 awaiting review, 5 waiting for reply, 3 done" then show the first page
- If `include_messages=true`, format each thread with its messages nested below

**Edge Cases**:
- No threads match filters: Returns empty array `[]`
- User has no Gmail/SMTP accounts: Returns empty array
- Team member: Only sees threads from campaigns they are assigned to (not all campaigns of the account owner)
- Both `campaign_id` and `campaign_ids` provided: Backend behavior depends on implementation — prefer using one or the other
- `show_hidden=true`: Returns ALL threads including hidden ones; `preferences__is_hidden` field indicates which are hidden
- Threads without campaign association: `campaign_id` will be null; `gifting_status` and `paid_promotion_status` will also be null
- Draft injection (when `include_messages=true`): If a thread has an active draft (LLM or human), a virtual draft message is appended to the messages array with `is_draft=true`
- The backend fetches both Gmail and SMTP threads, merges them, and sorts — this means a single response may contain threads from both providers

---

## Thread Operations

### `cheerful_hide_thread`

**Status**: NEW — full OpenAPI-level spec

**Purpose**: Hide (archive) an email thread. The thread will be excluded from default inbox views (where `show_hidden=false`). The thread continues to be ingested and synced — hiding only affects display. Supports both Gmail and SMTP threads.

**Maps to**: `PATCH /api/service/threads/{thread_id}/hide` (new service route needed; mirrors main route: `PATCH /threads/{gmail_thread_id}/hide`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-only — the backend gets or creates a `gmail_thread_user_preferences` record scoped to `(user_id, gmail_account_id/smtp_account_id, gmail_thread_id)`. The unique constraint on this triple ensures user-scoped isolation.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| thread_id | string | yes | — | Thread ID. Supports Gmail hex format (e.g., `18f3a2b4c5d6e7f8`) and SMTP angle-bracket format (e.g., `<msg-id@smtp.example.com>`). The backend auto-detects via `_is_smtp_thread_id()` |

**Parameter Validation Rules**:
- `thread_id` must be a non-empty string: passed as path parameter
- Thread must exist in the user's Gmail or SMTP accounts: 404 if not found

**Return Schema** — `ThreadHideResponse`:

```json
{
  "message": "string — Confirmation message: 'Thread hidden successfully'",
  "is_hidden": "boolean — Always true for hide operation"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Thread not found | "Thread not found" | 404 |
| User does not own thread (thread belongs to another user's account) | "Thread not found" (same as not found — no information leakage) | 404 |
| Service API error | ToolError with status code and truncated body | varies |

**Side Effects**:
- Sets `is_hidden=True` in `gmail_thread_user_preferences` table
- If no preferences record exists yet for this (user, account, thread) triple, creates one
- Thread continues to be synced by the ingestion pipeline — hiding does NOT stop Gmail/SMTP sync
- Thread is excluded from `cheerful_list_threads` results when `show_hidden=false` (default)
- Thread is excluded from automated workflow processing (drafts, follow-ups)

**Example Request**:
```
cheerful_hide_thread(thread_id="18f3a2b4c5d6e7f8")
```

**Example Response**:
```json
{
  "message": "Thread hidden successfully",
  "is_hidden": true
}
```

**Slack Formatting Notes**:
- Agent should confirm: "Thread hidden. It won't appear in your inbox but will continue syncing. Use unhide to restore it."
- If the agent has context about the thread (from a prior `cheerful_get_thread` or `cheerful_list_threads` call), include the subject and sender: "Hidden thread 'Re: Collaboration with BrandX' from creator@example.com"

**Edge Cases**:
- Already hidden thread: Operation is idempotent — sets `is_hidden=True` again, returns success
- SMTP thread: Supported — same behavior as Gmail threads
- Thread preferences record doesn't exist yet: Created automatically with `is_hidden=True`

---

### `cheerful_unhide_thread`

**Status**: NEW — full OpenAPI-level spec

**Purpose**: Unhide (restore) an archived email thread. This is NOT just a flag toggle — it triggers a full thread reprocessing pipeline that picks up any messages that arrived while the thread was hidden, and generates new AI drafts if needed.

**Maps to**: `PATCH /api/service/threads/{thread_id}/unhide` (new service route needed; mirrors main route: `PATCH /threads/{gmail_thread_id}/unhide`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-only — same scoping as `cheerful_hide_thread`.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| thread_id | string | yes | — | Thread ID. Supports Gmail hex format and SMTP angle-bracket format |
| campaign_id | string (uuid) | no | null | Force association with this specific campaign. If omitted, the backend auto-detects the campaign from the thread's existing association or sender/recipient matching. NOTE: This is sent as a JSON body parameter (not query param) to the backend endpoint |

**Parameter Validation Rules**:
- `thread_id` must be a non-empty string: passed as path parameter
- Thread must exist and be owned by the user: 404 if not found
- `campaign_id` (if provided) must be a valid UUID and must exist: 404 if campaign not found

**Return Schema** — `ThreadHideResponse`:

```json
{
  "message": "string — Confirmation message: 'Thread unhidden successfully'",
  "is_hidden": "boolean — Always false for unhide operation"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Thread not found | "Thread not found" | 404 |
| User does not own thread | "Thread not found" (same — no information leakage) | 404 |
| Campaign not found (if campaign_id provided) | "Campaign not found" | 404 |
| Unexpected reprocessing failure | "Internal server error" | 500 |
| Service API error | ToolError with status code and truncated body | varies |

**Side Effects** (critical — this is NOT just a flag toggle):
1. **Sets `is_hidden=False`** in `gmail_thread_user_preferences` table
2. **Syncs thread state for missed messages**: Calls `idempotent_batch_insert_latest_state` to check if new messages arrived while the thread was hidden. If new messages exist, creates a new `GmailThreadState` record for the latest message
3. **Resets state if no new messages**: If no new messages arrived, resets the existing thread state's status to `READY_FOR_ATTACHMENT_EXTRACTION` (the pipeline entry state)
4. **Spawns reprocessing workflow**: Starts a `ThreadProcessingCoordinatorWorkflow` Temporal workflow with:
   - `force_reply=True` — ensures a new AI draft is generated even if conditions might otherwise skip it
   - `force_campaign_id=campaign_id` (if provided) — overrides automatic campaign detection
5. **Campaign association**: If `campaign_id` is provided, the thread is force-associated with that campaign during reprocessing

**Example Request**:
```
cheerful_unhide_thread(thread_id="18f3a2b4c5d6e7f8", campaign_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890")
```

**Example Response**:
```json
{
  "message": "Thread unhidden successfully",
  "is_hidden": false
}
```

**Slack Formatting Notes**:
- Agent should warn: "Thread restored and reprocessing started. This may generate new AI drafts for any messages that arrived while the thread was hidden."
- If `campaign_id` was provided: "Thread restored and force-associated with campaign '[campaign name]'. Reprocessing started."
- If the thread had messages arrive while hidden, mention: "X new messages detected since the thread was hidden."

**Edge Cases**:
- Already visible thread: Operation is idempotent — re-triggers reprocessing pipeline (which is intentional — allows manual re-trigger of draft generation)
- Thread was hidden for a long time with many new messages: All new messages are picked up; only the latest triggers a new thread state
- Campaign doesn't exist: 404 before any state changes occur (no partial updates)
- Reprocessing failure: The workflow is async (Temporal) — the API returns success immediately. Workflow failures are handled by Temporal's retry mechanism, not surfaced to the caller
- SMTP thread: Supported — same behavior as Gmail threads

---

## Attachments

### `cheerful_list_message_attachments`

**Status**: NEW — full OpenAPI-level spec

**Purpose**: List attachment metadata for a specific email message. Returns filenames, MIME types, and sizes without downloading the actual binary content. The CE operates in Slack (text-only), so this tool returns metadata for the agent to describe to the user.

**Maps to**: `GET /api/service/messages/{message_id}/attachments` (new service route needed; mirrors main route: `GET /messages/{gmail_message_id}/attachments`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner or assigned team member — the backend checks ownership via the message → thread → account → user_id chain, and also checks team member assignment via thread → campaign → campaign_member_assignment.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| message_id | string (uuid) | yes | — | Database message UUID. This is the `db_message_id` field from `MessageInThread` (when using `cheerful_list_threads` with `include_messages=true`), or the `id` field from `GmailMessageResponse` (when using `cheerful_get_thread`). NOTE: This is the database UUID, NOT the Gmail message ID string |

**Parameter Validation Rules**:
- `message_id` must be a valid UUID format: FastAPI raises 422 if not parseable
- Message must exist: 404 if not found in either Gmail or SMTP tables
- User must own the message (or be an assigned team member): 403 if access denied

**Return Schema** — Array of `AttachmentMetadata`:

```json
[
  {
    "id": "string (uuid) — Attachment UUID. Can be used to construct a download URL (though download is not a CE tool)",
    "filename": "string | null — Original filename of the attachment (e.g., 'product-photo.jpg'). Null for inline attachments without explicit filenames",
    "mime_type": "string — MIME type of the attachment (e.g., 'image/jpeg', 'application/pdf', 'text/csv')",
    "size": "integer — File size in bytes"
  }
]
```

**Important: The `AttachmentMetadata` return model does NOT include `gmail_message_id`** — it only has `id`, `filename`, `mime_type`, `size`. This differs from `AttachmentInMessage` (embedded in `MessageInThread` responses from `cheerful_list_threads`), which does include `gmail_message_id`.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Invalid message_id format | "value is not a valid uuid" | 422 |
| Message not found | "Message not found" | 404 |
| User does not own message | "Access denied" | 403 |
| Service API error | ToolError with status code and truncated body | varies |

**Pagination**: Not paginated — returns all attachments for the message (typically 0-10 attachments per message).

**Example Request**:
```
cheerful_list_message_attachments(message_id="c3d4e5f6-a7b8-9012-cdef-345678901234")
```

**Example Response** (realistic data):
```json
[
  {
    "id": "d4e5f6a7-b8c9-0123-defa-456789012345",
    "filename": "product-lineup-spring2026.jpg",
    "mime_type": "image/jpeg",
    "size": 245760
  },
  {
    "id": "e5f6a7b8-c9d0-1234-efab-567890123456",
    "filename": "collaboration-agreement.pdf",
    "mime_type": "application/pdf",
    "size": 102400
  },
  {
    "id": "f6a7b8c9-d0e1-2345-fabc-678901234567",
    "filename": null,
    "mime_type": "image/png",
    "size": 15360
  }
]
```

**Slack Formatting Notes**:
- Present attachments as a bulleted list: `• product-lineup-spring2026.jpg (JPEG, 240 KB)`
- Format sizes human-readably: bytes → KB (÷1024) → MB (÷1024²)
- For null filenames: `• [unnamed attachment] (PNG, 15 KB)`
- If no attachments: "This message has no attachments."
- Mention that attachment download is not available through the context engine: "I can describe the attachments but can't download or display them directly."

**Edge Cases**:
- Message with no attachments: Returns empty array `[]`
- SMTP message: The backend tries Gmail tables first, then falls back to SMTP. SMTP attachment indexing is not yet implemented, so SMTP messages always return empty array `[]`
- Inline images (embedded in HTML body): May appear as attachments with null filename and `image/*` MIME type
- Very large attachments: Size is reported accurately; no truncation
- Attachment data is also available inline: When using `cheerful_list_threads` with `include_messages=true`, each `MessageInThread` includes an `attachments` field with `AttachmentInMessage` objects (which include `gmail_message_id`). This standalone tool is useful when you only need attachment info for a specific message without loading the full thread.
- The binary download endpoint (`GET /messages/{id}/attachments/{attachment_id}/download`) exists but is NOT exposed as a CE tool — it returns raw binary with `Content-Disposition: attachment` header, which is incompatible with the text-only Slack interface

---

## Draft Management

### `cheerful_get_thread_draft`

**Status**: NEW

**Purpose**: Get the current email draft for a thread. Returns either the user-edited (human) draft or the LLM-generated draft, with human drafts taking priority.

**Maps to**: `GET /api/service/threads/{thread_id}/draft` (new service route needed; main route: `GET /threads/{gmail_thread_id}/draft`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner or assigned team member (via thread → campaign access check).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| thread_id | string | yes | — | Thread ID (Gmail hex or SMTP angle-bracket format) |

**Returns**: `DraftResponse` object:
- gmail_thread_state_id: uuid (used as version anchor for create/update operations)
- internal_date: datetime
- draft_subject: string (nullable)
- draft_body_text: string (nullable)
- source: string — "human" (user-edited draft) or "llm" (AI-generated draft)
- alternative_drafts: list (nullable — only present when source="llm"; array of alternative draft options)

**Error responses**: Thread not found (404), access denied (403), no draft exists (404 — thread has no draft yet).

**Notes**:
- The `gmail_thread_state_id` is critical — it must be passed back to create/update calls as a version anchor
- Human drafts always take precedence over LLM drafts
- Alternative drafts are only available on LLM-generated drafts (the AI may produce multiple options)

**Slack formatting notes**: Agent should show draft text, indicate source ("AI draft" vs "your draft"), and if alternatives exist, offer to show them.

---

### `cheerful_create_thread_draft`

**Status**: NEW

**Purpose**: Create a new email draft for a thread. Anchored to a specific thread state to prevent race conditions when new messages arrive.

**Maps to**: `POST /api/service/threads/{thread_id}/draft` (new service route needed; main route: `POST /threads/{gmail_thread_id}/draft`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner or assigned team member (via thread → campaign access check).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| thread_id | string | yes | — | Thread ID (Gmail hex or SMTP angle-bracket format) |
| gmail_thread_state_id | uuid | yes | — | Thread state ID (version anchor — obtain from `cheerful_get_thread_draft` or `cheerful_list_threads` response) |
| draft_subject | string | no | null | Email subject line |
| draft_body_text | string | no | null | Email body text |

**Returns**: `DraftResponse` (same schema as `cheerful_get_thread_draft`). Source will be "human".

**Error responses**:
- Thread not found (404)
- Access denied (403)
- Version mismatch (409): `{"error": "version_mismatch", "message": "Thread state updated. Please refresh.", "latest_gmail_thread_state_id": "uuid", "latest_internal_date": "ISO datetime"}` — occurs when a new message arrived since the state ID was obtained. The tool must re-fetch the thread state and retry.

**Notes**:
- Creating a human draft supersedes any existing LLM-generated draft
- The 409 version mismatch is a critical race condition handler — the agent should automatically re-fetch and retry

**Slack formatting notes**: Agent should confirm the draft was saved and show a preview snippet.

---

### `cheerful_update_thread_draft`

**Status**: NEW

**Purpose**: Update an existing email draft. Supports partial updates — only provided fields are changed.

**Maps to**: `PUT /api/service/threads/{thread_id}/draft` (new service route needed; main route: `PUT /threads/{gmail_thread_id}/draft`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner or assigned team member.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| thread_id | string | yes | — | Thread ID (Gmail hex or SMTP angle-bracket format) |
| gmail_thread_state_id | uuid | yes | — | Thread state ID (version anchor) |
| draft_subject | string | no | — | New subject (omit to keep existing) |
| draft_body_text | string | no | — | New body text (omit to keep existing) |

**Returns**: `DraftResponse` (updated draft).

**Error responses**: Same as `cheerful_create_thread_draft` including 409 version mismatch.

**Notes**: If updating an LLM draft, the source changes to "human" and alternative_drafts are cleared.

---

## Email Sending

### `cheerful_send_email`

**Status**: NEW

**Purpose**: Send an email from a user's connected account. Supports both new emails and replies to existing threads. Auto-detects Gmail vs SMTP account.

**Maps to**: `POST /api/service/emails/send` (new service route needed; main route: `POST /emails/send`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission:
- Account owner: can send freely
- Team member: must be assigned to a campaign AND the thread must belong to that campaign (checked via `can_send_via_campaign_assignment` and `can_access_thread`)

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| account_email | string | yes | — | Sender account email address. Backend auto-detects Gmail vs SMTP account |
| to | string[] | yes | — | Recipient email addresses (at least one required) |
| subject | string | yes | — | Email subject line |
| cc | string[] | no | null | CC email addresses |
| body_html | string | no | null | HTML email body |
| body_text | string | no | null | Plain text email body. At least one of body_html or body_text required |
| thread_id | string | no | null | Thread ID for replies (Gmail hex or SMTP angle-bracket format) |
| in_reply_to | string | no | null | Message-ID header of the message being replied to |
| references | string | no | null | References header for email threading |
| gmail_thread_state_id | uuid | no | null | Thread state ID for tracking state transitions after send |
| smtp_thread_state_id | uuid | no | null | SMTP thread state ID for tracking |

**Parameter validation rules**:
- `to` must contain at least one email: `"At least one recipient is required"`
- At least one of `body_html` or `body_text` must be provided: `"Either body_html or body_text must be provided"`

**Returns**: `SendEmailResponse`:
- message_id: string (the email Message-ID)
- thread_id: string (the thread this message belongs to)
- sent_at: datetime

**Error responses**:
- User not resolved: ToolError "Could not resolve Cheerful user..."
- Not authorized to send from account (403): "Not authorized to send from this account"
- Not authorized for thread (403): "Not authorized to send on this thread" (team member not assigned to campaign)
- Account not found (404): Gmail/SMTP account not found for the given email address
- Validation errors (422): missing recipients, missing body

**Side effects**:
- Thread state updated to `NOT_LATEST` (prevents follow-up scheduling on old state)
- Gmail sync detects the outbound message and creates a fresh `GmailThreadState`
- `ThreadProcessingCoordinator` workflow handles `WAITING_FOR_INBOUND` transition

**Slack formatting notes**: Agent should confirm send with "Sent to [recipient] from [sender] at [time]" and summarize subject.

---

## Scheduled Email Dispatch

### `cheerful_schedule_email`

**Status**: NEW

**Purpose**: Schedule an email to be sent at a specific future time. Supports timezone-aware scheduling.

**Maps to**: `POST /api/service/emails/scheduled` (new service route needed; main route: `POST /emails/scheduled`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated (owner of the sending account).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| gmail_account_id | uuid | no | — | Gmail account to send from (mutually exclusive with smtp_account_id — exactly one required) |
| smtp_account_id | uuid | no | — | SMTP account to send from (mutually exclusive with gmail_account_id — exactly one required) |
| recipient_email | string | yes | — | Recipient email address |
| subject | string | yes | — | Email subject line |
| dispatch_at | datetime | yes | — | Scheduled send time (must be timezone-aware, must be in the future) |
| recipient_name | string | no | null | Recipient display name |
| cc_emails | string[] | no | null | CC email addresses |
| bcc_emails | string[] | no | null | BCC email addresses |
| body_text | string | no | null | Plain text body. At least one of body_text or body_html required |
| body_html | string | no | null | HTML body. At least one of body_text or body_html required |
| in_reply_to_message_id | string | no | null | Message-ID header for threading |
| references_header | string | no | null | References header for threading |
| gmail_thread_id | string | no | null | Thread ID for reply threading |
| user_timezone | string | no | "UTC" | IANA timezone for dispatch_at interpretation. Validated via ZoneInfo |

**Parameter validation rules**:
- Exactly one of `gmail_account_id` or `smtp_account_id`: `"Exactly one of gmail_account_id or smtp_account_id is required"` (400)
- At least one of `body_text` or `body_html`: `"At least one of body_text or body_html is required"` (422)
- `dispatch_at` must be timezone-aware: `"dispatch_at must be timezone-aware"`
- `dispatch_at` must be in the future: `"dispatch_at must be in the future"`
- `user_timezone` must be valid IANA timezone: `"Invalid timezone: {value}"`

**Returns**: `ScheduleEmailResponse`:
- id: uuid (dispatch ID)
- dispatch_at: datetime
- status: string ("pending")

**Slack formatting notes**: Agent should confirm with "Email to [recipient] scheduled for [time] ([timezone])".

---

### `cheerful_list_scheduled_emails`

**Status**: NEW

**Purpose**: List all scheduled (pending) emails for the current user.

**Maps to**: `GET /api/service/emails/scheduled` (new service route needed; main route: `GET /emails/scheduled`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated (user sees only their own scheduled emails).

**Parameters**: None (user-scoped via injected context).

**Returns**: `ScheduledEmailListResponse`:
- emails: array of `ScheduleEmailResponse` objects:
  - id: uuid
  - dispatch_at: datetime
  - status: string
  - recipient_email: string (nullable)
  - subject: string (nullable)

**Slack formatting notes**: Agent should present as a table: subject, recipient, scheduled time, status.

---

### `cheerful_cancel_scheduled_email`

**Status**: NEW

**Purpose**: Cancel a pending scheduled email. Only works on emails with "pending" status.

**Maps to**: `DELETE /api/service/emails/scheduled/{dispatch_id}` (new service route needed; main route: `DELETE /emails/scheduled/{dispatch_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only (dispatch must belong to user).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| dispatch_id | uuid | yes | — | Scheduled email dispatch ID |

**Returns**: `{ status: "cancelled", id: "uuid" }`

**Error responses**:
- Dispatch not found (404): "Scheduled email not found"
- Not authorized (403): "Not authorized to cancel this email"
- Already sent/cancelled (409): "Email has already been sent or cancelled"
- Race condition (409): "Email could not be cancelled (may have been sent)"

**Notes**: Only emails in "pending" status can be cancelled. Emails in "processing", "sent", "failed", or "cancelled" status cannot be cancelled.

---

### `cheerful_reschedule_email`

**Status**: NEW

**Purpose**: Change the dispatch time of a pending scheduled email.

**Maps to**: `PATCH /api/service/emails/scheduled/{dispatch_id}/reschedule` (new service route needed; main route: `PATCH /emails/scheduled/{dispatch_id}/reschedule`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only (dispatch must belong to user).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| dispatch_id | uuid | yes | — | Scheduled email dispatch ID |
| dispatch_at | datetime | yes | — | New scheduled send time (must be timezone-aware, must be in the future) |

**Returns**: `{ status: "rescheduled", id: "uuid", dispatch_at: "ISO datetime" }`

**Error responses**: Same as `cheerful_cancel_scheduled_email` (404, 403, 409).

**Parameter validation rules**: Same `dispatch_at` rules as `cheerful_schedule_email` (timezone-aware, future).

---

## Email Signatures

> **Cross-reference**: The campaigns domain (`specs/campaigns.md`) has 3 campaign-oriented signature tools (`cheerful_get_campaign_signature`, `cheerful_update_campaign_signature`, `cheerful_list_campaign_signatures`) that map to proposed campaign-specific service routes. This section covers the full CRUD via the actual `/email-signatures` backend routes, which serve both user-level and campaign-specific signatures.

### `cheerful_list_email_signatures`

**Status**: NEW

**Purpose**: List all email signatures belonging to the current user, optionally filtered by campaign.

**Maps to**: `GET /api/service/email-signatures` (new service route needed; main route: `GET /email-signatures`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated (user sees only their own signatures).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | no | — | Filter to signatures for a specific campaign. Omit to get all user signatures |

**Returns**: `EmailSignatureListResponse`:
- signatures: array of `EmailSignatureResponse` objects:
  - id: uuid
  - user_id: uuid
  - name: string
  - content: string (HTML)
  - is_default: boolean
  - campaign_id: uuid (nullable — null for user-level signatures)
  - campaign_name: string (nullable — populated via join)
  - is_enabled: boolean
  - created_at: datetime
  - updated_at: datetime

**Slack formatting notes**: Agent should list signatures with name, type (user-level vs campaign-specific), and default/enabled status.

---

### `cheerful_get_email_signatures_for_reply`

**Status**: NEW

**Purpose**: Get the appropriate signatures for composing a reply — returns both user-level signatures and the campaign-specific signature (if any). Designed for the reply composer dropdown.

**Maps to**: `GET /api/service/email-signatures/for-reply` (new service route needed; main route: `GET /email-signatures/for-reply`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | no | — | Campaign ID to include campaign-specific signature |

**Returns**: `SignaturesForReplyResponse`:
- user_signatures: EmailSignatureResponse[] (user-level signatures, campaign_id is null)
- campaign_signature: EmailSignatureResponse (nullable — the campaign-specific signature if it exists and is enabled)

**Slack formatting notes**: Agent should present the recommended signature (default user signature or campaign signature) and note alternatives are available.

---

### `cheerful_create_email_signature`

**Status**: NEW

**Purpose**: Create a new email signature. Can be user-level (no campaign_id) or campaign-specific (with campaign_id).

**Maps to**: `POST /api/service/email-signatures` (new service route needed; main route: `POST /email-signatures`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated for user-level signatures; campaign owner for campaign-specific signatures.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| name | string | yes | — | Signature display name |
| content | string | yes | — | HTML signature content. Max 10,000 characters. Server-side sanitized via `sanitize_signature_html()` |
| is_default | boolean | no | false | Set as default user-level signature. Only applies to user-level signatures (campaign signatures forced to false) |
| campaign_id | uuid | no | null | Campaign ID — omit for user-level signature, set for campaign-specific |
| is_enabled | boolean | no | false | Enable for automated emails. Only applies to campaign-specific signatures |

**Returns**: `EmailSignatureResponse` (201 Created).

**Side effects**: Setting `is_default=true` on a user-level signature clears `is_default` on all other user-level signatures.

**Error responses**:
- Content exceeds 10,000 chars (422)
- Campaign not found (404)
- Not campaign owner (403) — for campaign-specific signatures

---

### `cheerful_get_email_signature`

**Status**: NEW

**Purpose**: Get a single email signature by ID.

**Maps to**: `GET /api/service/email-signatures/{signature_id}` (new service route needed; main route: `GET /email-signatures/{signature_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only (user must own the signature).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| signature_id | uuid | yes | — | Signature ID |

**Returns**: `EmailSignatureResponse`.

**Error responses**: Signature not found (404), access denied (403).

---

### `cheerful_update_email_signature`

**Status**: NEW

**Purpose**: Update an existing email signature. Partial update — only provided fields are changed.

**Maps to**: `PATCH /api/service/email-signatures/{signature_id}` (new service route needed; main route: `PATCH /email-signatures/{signature_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| signature_id | uuid | yes | — | Signature ID |
| name | string | no | — | New name (omit to keep existing) |
| content | string | no | — | New HTML content (omit to keep existing). Max 10,000 characters |
| is_default | boolean | no | — | Set/unset as default |
| is_enabled | boolean | no | — | Enable/disable for automated emails |

**Returns**: `EmailSignatureResponse` (updated).

**Error responses**: Signature not found (404), access denied (403), content exceeds 10,000 chars (422).

**Side effects**: Setting `is_default=true` clears `is_default` on all other user-level signatures.

---

### `cheerful_delete_email_signature`

**Status**: NEW

**Purpose**: Delete an email signature.

**Maps to**: `DELETE /api/service/email-signatures/{signature_id}` (new service route needed; main route: `DELETE /email-signatures/{signature_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| signature_id | uuid | yes | — | Signature ID |

**Returns**: 204 No Content (success confirmation).

**Error responses**: Signature not found (404), access denied (403).

---

## Bulk Draft Edit

### `cheerful_bulk_edit_drafts`

**Status**: NEW

**Purpose**: Batch edit all AI-generated drafts in a campaign using a natural language instruction. Starts an async Temporal workflow that rewrites matching drafts.

**Maps to**: `POST /api/service/bulk-draft-edit` (new service route needed; main route: `POST /bulk-draft-edit`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: campaign owner-only.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign ID |
| edit_instruction | string | yes | — | Natural language edit instruction (e.g., "make all drafts shorter and more casual") |
| exclude_thread_ids | string[] | no | [] | Thread IDs to skip (exclude from bulk edit) |
| save_as_rule | boolean | no | false | Save this edit instruction as a permanent campaign rule |
| rule_text | string | no | null | Human-readable rule text (used if save_as_rule=true) |

**Returns**: `BulkDraftEditResponse`:
- workflow_id: string (Temporal workflow ID for tracking)
- message: string ("Bulk draft edit started")

**Error responses**:
- Campaign not found (404)
- Not campaign owner (403): "Not authorized for this campaign"

**Side effects**: Starts a Temporal `BulkDraftEditWorkflow` with 5-minute execution timeout. The workflow rewrites all matching drafts using the AI edit instruction. If `save_as_rule=true`, the instruction is saved as a campaign rule for future drafts.

**Slack formatting notes**: Agent should confirm the bulk edit started and provide the workflow_id. The user can check back later — there's no polling endpoint for bulk edit progress (it's fire-and-forget).

---

## AI Email Improvement

### `cheerful_improve_email_content`

**Status**: NEW

**Purpose**: Apply AI-powered text improvements to email content. Supports shortening, expanding, tone adjustment, and custom instructions.

**Maps to**: Implementation TBD — the frontend uses Next.js API routes (`POST /api/improve-email-content-stream-send-textbox`) that proxy to Claude via SSE streaming. The context engine may implement this natively using its own Claude instance rather than calling a backend endpoint.

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| content | string | yes | — | The email text to improve |
| action | enum | yes | — | One of: "shorten", "expand", "friendly", "professional", "casual". Or a custom instruction string prefixed with "custom:" (e.g., "custom:add a call to action") |

**Action descriptions**:
- `shorten` — Make the email shorter and more concise
- `expand` — Make the email longer with more detail
- `friendly` — Adjust to a friendlier, warmer tone
- `professional` — Adjust to a more formal, professional tone
- `casual` — Adjust to a more casual, conversational tone
- `custom:[instruction]` — Apply a custom instruction

**Returns**: `{ improved_content: string }`

**Notes**:
- The frontend uses SSE streaming for real-time token display. The CE tool returns the complete improved text (no streaming).
- The frontend also has `classify-edit` and `rules-suggestion` endpoints that analyze edits for potential campaign rule creation. These are follow-up actions, not primary tools — the agent can suggest rule creation after observing a pattern of similar edits.
- If implemented natively, the CE uses its own Claude instance with the campaign's LLM config (agent_name, rules, goal, FAQs, sample_emails) as context.

**Slack formatting notes**: Agent should show the improved text and ask if the user wants to apply it to the draft.

---

## Thread Summary

### `cheerful_get_thread_summary`

**Status**: NEW — needs source code verification in Wave 3

**Purpose**: Get an AI-generated summary of an email thread conversation. Summarizes key points, decisions, and action items from the thread.

**Maps to**: `GET /api/service/threads/{thread_id}/summary` (new service route needed; referenced in spec-backend-api.md — needs source verification; may be a Next.js route)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner or assigned team member (via thread → campaign access check).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| thread_id | string | yes | — | Thread ID (Gmail hex or SMTP angle-bracket format) |

**Returns**: `{ summary: string }` — AI-generated summary text.

**Notes**:
- If this endpoint doesn't exist in the backend, the CE can implement it natively: fetch thread via `cheerful_get_thread`, then summarize using its own Claude instance.
- May implement caching: if the thread hasn't changed since the last summary, return cached version.
- Wave 3 must verify whether this is a backend endpoint or webapp-only route.

**Slack formatting notes**: Agent should present the summary directly in the conversation.

---

## Summary

### New Service Routes Required

All email domain write operations need new `/api/service/*` endpoints (the existing service routes are read-only):

| # | New Service Route | Method | CE Tool |
|---|-------------------|--------|---------|
| 1 | `GET /api/service/threads` | GET | `cheerful_list_threads` |
| 2 | `PATCH /api/service/threads/{id}/hide` | PATCH | `cheerful_hide_thread` |
| 3 | `PATCH /api/service/threads/{id}/unhide` | PATCH | `cheerful_unhide_thread` |
| 4 | `GET /api/service/messages/{id}/attachments` | GET | `cheerful_list_message_attachments` |
| 5 | `GET /api/service/threads/{id}/draft` | GET | `cheerful_get_thread_draft` |
| 6 | `POST /api/service/threads/{id}/draft` | POST | `cheerful_create_thread_draft` |
| 7 | `PUT /api/service/threads/{id}/draft` | PUT | `cheerful_update_thread_draft` |
| 8 | `POST /api/service/emails/send` | POST | `cheerful_send_email` |
| 9 | `POST /api/service/emails/scheduled` | POST | `cheerful_schedule_email` |
| 10 | `GET /api/service/emails/scheduled` | GET | `cheerful_list_scheduled_emails` |
| 11 | `DELETE /api/service/emails/scheduled/{id}` | DELETE | `cheerful_cancel_scheduled_email` |
| 12 | `PATCH /api/service/emails/scheduled/{id}/reschedule` | PATCH | `cheerful_reschedule_email` |
| 13 | `GET /api/service/email-signatures` | GET | `cheerful_list_email_signatures` |
| 14 | `GET /api/service/email-signatures/for-reply` | GET | `cheerful_get_email_signatures_for_reply` |
| 15 | `POST /api/service/email-signatures` | POST | `cheerful_create_email_signature` |
| 16 | `GET /api/service/email-signatures/{id}` | GET | `cheerful_get_email_signature` |
| 17 | `PATCH /api/service/email-signatures/{id}` | PATCH | `cheerful_update_email_signature` |
| 18 | `DELETE /api/service/email-signatures/{id}` | DELETE | `cheerful_delete_email_signature` |
| 19 | `POST /api/service/bulk-draft-edit` | POST | `cheerful_bulk_edit_drafts` |

> Routes 20-21 (`cheerful_improve_email_content`, `cheerful_get_thread_summary`) may be implemented CE-natively rather than via backend service routes.

### Key Enums

| Enum | Values | Source |
|------|--------|--------|
| GmailThreadStatus | READY_FOR_ATTACHMENT_EXTRACTION, READY_FOR_CAMPAIGN_ASSOCIATION, READY_FOR_RESPONSE_DRAFT, WAITING_FOR_DRAFT_REVIEW, WAITING_FOR_INBOUND, IGNORE, DONE, NOT_LATEST | `gmail_thread_state.py` |
| GmailMessageDirection | inbound, outbound | `gmail_message.py` |
| EmailDispatchStatus | pending, processing, sent, failed, cancelled | `email_dispatch_queue.py` |
| DraftSource | human, llm | `draft.py` |
| CheerifyAction | shorten, expand, friendly, professional, casual, custom:[instruction] | webapp API routes |

### Domain Statistics

| Sub-domain | Existing | New | Total |
|-----------|----------|-----|-------|
| Thread Listing & Filtering | 3 | 1 | 4 |
| Thread Operations | 0 | 2 | 2 |
| Attachments | 0 | 1 | 1 |
| Draft Management | 0 | 3 | 3 |
| Email Sending | 0 | 1 | 1 |
| Scheduled Email Dispatch | 0 | 4 | 4 |
| Email Signatures | 0 | 6 | 6 |
| Bulk Draft Edit | 0 | 1 | 1 |
| AI Email Improvement | 0 | 1 | 1 |
| Thread Summary | 0 | 1 | 1 |
| **TOTAL** | **3** | **21** | **24** |
