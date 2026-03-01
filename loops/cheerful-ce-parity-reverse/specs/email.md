# Email Domain — Tool Specifications

**Domain**: Email
**Spec file**: `specs/email.md`
**Wave 2 status**: Tool design complete
**Wave 3 status**: All 24 tools fully specified with OpenAPI-level detail

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

**Status**: NEW — full OpenAPI-level spec

**Purpose**: Get the current email draft for a thread. Returns either the user-edited (human) draft or the LLM-generated draft, with human drafts always taking priority. If both exist, only the human draft is returned.

**Maps to**: `GET /api/service/threads/{thread_id}/draft` (new service route needed; mirrors main route: `GET /threads/{gmail_thread_id}/draft`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-only — the backend checks `thread_state.user_id != user_id` and returns 403 if they don't match. No team member assignment check exists on draft endpoints.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| thread_id | string | yes | — | Thread ID. Supports Gmail hex format (e.g., `18f3a2b4c5d6e7f8`) and SMTP angle-bracket format (e.g., `<msg-id@smtp.example.com>`). The backend auto-detects via `_is_smtp_thread_id()` |

**Parameter Validation Rules**:
- `thread_id` must be a non-empty string: passed as path parameter to the backend endpoint
- Thread must exist (has at least one `GmailThreadState` or `SmtpThreadState` record): 404 "Thread not found" if not found

**Return Schema** — `DraftResponse`:

```json
{
  "gmail_thread_state_id": "string (uuid) — Current thread state UUID. CRITICAL: This is the version anchor. Must be passed back to create/update calls to prevent race conditions when new messages arrive",
  "internal_date": "datetime — ISO 8601 timestamp of the thread state's latest message. For display and debugging",
  "draft_subject": "string | null — Draft email subject line. Null if no subject was set",
  "draft_body_text": "string | null — Draft email body in plain text. Null if no body was set",
  "source": "string — One of: 'human' (user-edited draft via UI or CE), 'llm' (AI-generated draft from the response drafting pipeline). Human drafts always take precedence over LLM drafts",
  "alternative_drafts": "array | null — Only present when source='llm'. Array of alternative draft options generated by the AI. Each element is an object with 'subject' (string) and 'body_text' (string) keys. Null for human drafts and when no alternatives were generated. Typically 0-3 alternatives"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Thread not found (no state exists) | "Thread not found" | 404 |
| User does not own thread | "Not authorized" | 403 |
| No draft exists (thread exists but has no human or LLM draft for current state) | "No draft found" | 404 |
| Service API error | ToolError with status code and truncated body | varies |

**Pagination**: Not applicable — returns a single draft object.

**Example Request**:
```
cheerful_get_thread_draft(thread_id="18f3a2b4c5d6e7f8")
```

**Example Response** (LLM-generated draft with alternatives):
```json
{
  "gmail_thread_state_id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
  "internal_date": "2026-02-28T14:30:00Z",
  "draft_subject": "Re: Collaboration opportunity with BrandX",
  "draft_body_text": "Hi Sarah!\n\nThanks so much for your interest in collaborating with us! We'd love to send you our Spring collection.\n\nFor sizing, I'd recommend going with a Medium based on your measurements. I can also include a Small if you'd like to compare.\n\nLet me know your shipping address and I'll get everything sent out this week!\n\nBest,\nEmily",
  "source": "llm",
  "alternative_drafts": [
    {
      "subject": "Re: Collaboration opportunity with BrandX",
      "body_text": "Hey Sarah,\n\nSo excited you want to work with us! Based on your profile, I think a Medium would be perfect. I'll send both S and M so you can pick your favorite.\n\nJust drop me your address and we'll ship right away!\n\nCheers,\nEmily"
    }
  ]
}
```

**Example Response** (human-edited draft, no alternatives):
```json
{
  "gmail_thread_state_id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
  "internal_date": "2026-02-28T14:30:00Z",
  "draft_subject": "Re: Collaboration opportunity with BrandX",
  "draft_body_text": "Hi Sarah!\n\nThanks for reaching out! I checked with our warehouse and we have both S and M available. I'll send both — keep whichever fits best!\n\nPlease send your shipping address and I'll have it out tomorrow.\n\nBest,\nEmily",
  "source": "human",
  "alternative_drafts": null
}
```

**Slack Formatting Notes**:
- Show the draft source prominently: "AI-generated draft" or "Your draft" (for human)
- Display the draft body text in a quote block
- If `source="llm"` and `alternative_drafts` is not null/empty, mention: "There are [N] alternative draft(s) available. Would you like to see them?"
- If showing alternatives, present each as a numbered option: "Option 1: [truncated preview]", "Option 2: [truncated preview]"
- Always include the `gmail_thread_state_id` in agent context (don't display to user) — needed for create/update operations

**Edge Cases**:
- Thread has no draft at all: Returns 404 "No draft found". Expected for new threads not yet processed by the AI drafting pipeline, or threads where the user hasn't created a draft
- Thread has both human and LLM draft: Only the human draft is returned (human takes precedence at the application level — both records exist in the DB)
- Thread state changed (new message arrived): The returned `gmail_thread_state_id` reflects the current (latest) state. If the user got a draft earlier with a different state ID, they should use the new one for subsequent operations
- SMTP thread: Fully supported. The backend auto-detects via `_is_smtp_thread_id()` and queries the appropriate `SmtpThreadState` and draft repositories
- Alternative drafts structure: Each alternative is a `dict` with `subject` (string) and `body_text` (string) keys. The number of alternatives varies (typically 0-3)

---

### `cheerful_create_thread_draft`

**Status**: NEW — full OpenAPI-level spec

**Purpose**: Create a new email draft for a thread. The draft is anchored to a specific thread state via `gmail_thread_state_id` to prevent race conditions — if a new message arrives between reading the thread and creating the draft, the create call will fail with a 409 version mismatch, forcing the caller to re-fetch the current state.

**Maps to**: `POST /api/service/threads/{thread_id}/draft` (new service route needed; mirrors main route: `POST /threads/{gmail_thread_id}/draft`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-only — the backend checks `thread_state.user_id != user_id` and returns 403 if they don't match.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| thread_id | string | yes | — | Thread ID. Supports Gmail hex format and SMTP angle-bracket format |
| gmail_thread_state_id | string (uuid) | yes | — | Thread state UUID (version anchor). Obtain from `cheerful_get_thread_draft`, `cheerful_list_threads`, or `cheerful_get_thread` response. Must be the ID of the CURRENT (latest) thread state |
| draft_subject | string | yes | — | Email subject line. Required field in `DraftCreateRequest` (type `str`, NOT `Optional[str]`). Pass empty string `""` to create a draft with no subject |
| draft_body_text | string | yes | — | Email body text in plain text. Required field in `DraftCreateRequest` (type `str`, NOT `Optional[str]`). Pass empty string `""` to create a draft with no body |

**Parameter Validation Rules**:
- `thread_id` must be a non-empty string: passed as path parameter
- `gmail_thread_state_id` must be a valid UUID: FastAPI raises 422 if not parseable
- `draft_subject` is required (type `str`, not `Optional[str]`): FastAPI raises 422 `"field required"` if missing
- `draft_body_text` is required (type `str`, not `Optional[str]`): FastAPI raises 422 `"field required"` if missing
- The state ID must belong to the same thread as `thread_id`: 400 `"State ID doesn't match thread"` if mismatch

**Return Schema** — `DraftResponse` (same as `cheerful_get_thread_draft`):

```json
{
  "gmail_thread_state_id": "string (uuid) — The thread state UUID this draft is anchored to",
  "internal_date": "datetime — ISO 8601 timestamp of the thread state",
  "draft_subject": "string | null — The saved draft subject",
  "draft_body_text": "string | null — The saved draft body text",
  "source": "string — Always 'human' for created drafts (UI/CE drafts are always human source)",
  "alternative_drafts": "null — Always null for human-created drafts"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Missing required field (draft_subject or draft_body_text) | "field required" or "value_error.missing" | 422 |
| Invalid UUID format | "value is not a valid uuid" | 422 |
| Thread state not found (version mismatch — new message arrived) | `{"error": "version_mismatch", "message": "Thread state updated. Please refresh.", "latest_gmail_thread_state_id": "uuid-or-null", "latest_internal_date": "ISO-datetime-or-null"}` | 409 |
| State ID doesn't match thread (state belongs to different thread) | "State ID doesn't match thread" | 400 |
| User does not own thread | "Not authorized" | 403 |
| Service API error | ToolError with status code and truncated body | varies |

**Side Effects**:
- Creates (or upserts) a UI draft record in the database. If a human draft already exists for this thread state, it is overwritten (last write wins for concurrent edits)
- The new human draft supersedes any existing LLM-generated draft for display purposes — subsequent calls to `cheerful_get_thread_draft` will return this human draft instead of the LLM draft
- The LLM draft is NOT deleted — it remains in the database and could be restored if the human draft is deleted

**Example Request**:
```
cheerful_create_thread_draft(
  thread_id="18f3a2b4c5d6e7f8",
  gmail_thread_state_id="b2c3d4e5-f6a7-8901-bcde-f23456789012",
  draft_subject="Re: Collaboration opportunity with BrandX",
  draft_body_text="Hi Sarah!\n\nThanks for your interest! I'll send you both S and M sizes. Please share your shipping address.\n\nBest,\nEmily"
)
```

**Example Response**:
```json
{
  "gmail_thread_state_id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
  "internal_date": "2026-02-28T14:30:00Z",
  "draft_subject": "Re: Collaboration opportunity with BrandX",
  "draft_body_text": "Hi Sarah!\n\nThanks for your interest! I'll send you both S and M sizes. Please share your shipping address.\n\nBest,\nEmily",
  "source": "human",
  "alternative_drafts": null
}
```

**Slack Formatting Notes**:
- Confirm: "Draft saved for thread '[subject]'. Here's what I saved:" followed by draft body in a quote block
- If the agent needs to auto-retry on 409: "A new message arrived in the thread. Let me refresh and save the draft again."
- If draft was created to replace an LLM draft: "Draft saved (replaced AI-generated draft)"

**Edge Cases**:
- Version mismatch (409): The most common error. Agent should handle gracefully by re-fetching the thread state (via `cheerful_get_thread_draft` or `cheerful_list_threads`) and retrying with the new `gmail_thread_state_id`. The 409 response includes `latest_gmail_thread_state_id` for convenience
- Concurrent edits: If two users (or the user + LLM pipeline) create drafts simultaneously for the same state, the last write wins. No conflict detection beyond the version mismatch check
- Empty subject/body: Valid — creates a draft with empty content. Pass `""` (empty string) since both fields are required
- SMTP thread: Fully supported. The backend stores SMTP drafts using `smtp_thread_state_id` internally but accepts `gmail_thread_state_id` as the parameter name (the field is reused for both providers)
- Re-creating a draft on the same state: Upserts — overwrites the existing draft for this state
- Thread with no prior state: The `gmail_thread_state_id` must reference a valid state record; if the thread has never been processed, there will be no state to reference and the 409 error fires

---

### `cheerful_update_thread_draft`

**Status**: NEW — full OpenAPI-level spec

**Purpose**: Update an existing email draft with partial fields. Only provided fields are changed — omitted fields retain their current values (merged with existing draft). Uses the same version-anchor mechanism as create to prevent race conditions.

**Maps to**: `PUT /api/service/threads/{thread_id}/draft` (new service route needed; mirrors main route: `PUT /threads/{gmail_thread_id}/draft`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-only — the backend checks `thread_state.user_id != user_id` and returns 403.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| thread_id | string | yes | — | Thread ID. Supports Gmail hex format and SMTP angle-bracket format |
| gmail_thread_state_id | string (uuid) | yes | — | Thread state UUID (version anchor). Must match the current thread state |
| draft_subject | string | no | null | New subject line. Pass `null` or omit to keep existing subject. Pass empty string `""` to clear the subject |
| draft_body_text | string | no | null | New body text. Pass `null` or omit to keep existing body. Pass empty string `""` to clear the body |

**Parameter Validation Rules**:
- `thread_id` must be a non-empty string: passed as path parameter
- `gmail_thread_state_id` must be a valid UUID: FastAPI raises 422 if not parseable
- `draft_subject` is `Optional[str]` with default `None`: omit to keep existing value
- `draft_body_text` is `Optional[str]` with default `None`: omit to keep existing value
- The state ID must belong to the same thread as `thread_id`: 400 `"State ID doesn't match thread"` if mismatch

**Return Schema** — `DraftResponse` (same as `cheerful_get_thread_draft`):

```json
{
  "gmail_thread_state_id": "string (uuid)",
  "internal_date": "datetime",
  "draft_subject": "string | null — The updated subject (merged: new value if provided, else kept from existing draft, else empty string)",
  "draft_body_text": "string | null — The updated body text (same merge behavior)",
  "source": "string — Always 'human' for updated drafts",
  "alternative_drafts": "null — Always null for human drafts"
}
```

**Error Responses**: Same as `cheerful_create_thread_draft`:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Invalid UUID format | "value is not a valid uuid" | 422 |
| Thread state not found (version mismatch) | `{"error": "version_mismatch", "message": "Thread state updated. Please refresh.", "latest_gmail_thread_state_id": "...", "latest_internal_date": "..."}` | 409 |
| State ID doesn't match thread | "State ID doesn't match thread" | 400 |
| User does not own thread | "Not authorized" | 403 |
| Service API error | ToolError with status code and truncated body | varies |

**Merge Behavior** (critical implementation detail from `draft.py` lines 256-266):
1. Backend fetches the existing draft for the given `gmail_thread_state_id`
2. For each optional field (`draft_subject`, `draft_body_text`):
   - If the request value is not `None` → use the request value
   - If the request value is `None` AND existing draft exists → use the existing draft's value
   - If the request value is `None` AND no existing draft → use empty string `""`
3. Backend upserts the merged values (same upsert as create — last write wins)

**Example Request** (update only body, keep existing subject):
```
cheerful_update_thread_draft(
  thread_id="18f3a2b4c5d6e7f8",
  gmail_thread_state_id="b2c3d4e5-f6a7-8901-bcde-f23456789012",
  draft_body_text="Hi Sarah!\n\nUpdated: I'll send you sizes S, M, and L so you have options. Please share your shipping address when you're ready.\n\nBest,\nEmily"
)
```

**Example Response**:
```json
{
  "gmail_thread_state_id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
  "internal_date": "2026-02-28T14:30:00Z",
  "draft_subject": "Re: Collaboration opportunity with BrandX",
  "draft_body_text": "Hi Sarah!\n\nUpdated: I'll send you sizes S, M, and L so you have options. Please share your shipping address when you're ready.\n\nBest,\nEmily",
  "source": "human",
  "alternative_drafts": null
}
```

**Slack Formatting Notes**:
- Confirm: "Draft updated. Here's the current version:" followed by the full draft in a quote block
- Highlight what changed if possible (the agent can diff against the previous version from context)
- If version mismatch: Same handling as create — auto-refresh and retry

**Edge Cases**:
- No existing draft for this state: Effectively creates a new draft with the provided fields (and empty string for omitted fields)
- Updating an LLM draft: The source changes from "llm" to "human" and `alternative_drafts` is cleared. This is a one-way transformation — the LLM draft record still exists in the DB but will no longer be returned by `cheerful_get_thread_draft`
- Providing both fields as null: The update proceeds but is effectively a no-op (keeps existing values or uses empty strings)
- Version mismatch (409): Same as create — re-fetch state and retry
- SMTP thread: Fully supported
- After update, `db.flush()` and `db.refresh(draft)` are called to ensure the returned DraftResponse reflects the persisted state

---

## Email Sending

### `cheerful_send_email`

**Status**: NEW — full OpenAPI-level spec

**Purpose**: Send an email from a user's connected Gmail or SMTP account. Supports both new emails and replies to existing threads. The backend auto-detects whether the account is Gmail or SMTP based on the `account_email` address and routes the send accordingly.

**Maps to**: `POST /api/service/emails/send` (new service route needed; mirrors main route: `POST /emails/send`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: dual-tier authorization:
- **Account owner**: Can send freely from any of their connected accounts
- **Team member (non-owner)**: Must be assigned to a campaign (checked via `can_send_via_campaign_assignment` for Gmail or `can_send_via_campaign_assignment_smtp` for SMTP) AND the thread must belong to an assigned campaign (checked via `can_access_thread`). Both checks must pass.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| account_email | string | yes | — | Sender account email address. The backend looks up this email in both `user_gmail_account` and `user_smtp_account` tables to determine the account type. Must match an active connected account |
| to | string[] (email[]) | yes | — | Recipient email addresses. Must contain at least one valid email address. Validated via Pydantic `EmailStr` |
| subject | string | yes | — | Email subject line |
| cc | string[] (email[]) | no | null | CC email addresses. Validated via Pydantic `EmailStr` |
| body_html | string | no | null | HTML email body. At least one of `body_html` or `body_text` must be provided |
| body_text | string | no | null | Plain text email body. At least one of `body_html` or `body_text` must be provided |
| thread_id | string | no | null | Thread ID for replies (Gmail hex or SMTP angle-bracket format). When provided, the email is sent as a reply in this thread |
| in_reply_to | string | no | null | RFC 822 Message-ID header of the message being replied to. Used for proper email threading |
| references | string | no | null | RFC 822 References header for email threading. Contains space-separated Message-IDs |
| gmail_thread_state_id | string (uuid) | no | null | Gmail thread state UUID. When provided, the backend transitions this state to NOT_LATEST after sending (prevents stale follow-up scheduling) |
| smtp_thread_state_id | string (uuid) | no | null | SMTP thread state UUID. Same purpose as `gmail_thread_state_id` but for SMTP threads |

**Parameter Validation Rules** (from `SendEmailRequest` Pydantic model in `email.py`):
- `to` must contain at least one email: `ValueError("At least one recipient is required")` — validated via `@field_validator("to")`
- At least one of `body_html` or `body_text` must be provided: `ValueError("Either body_html or body_text must be provided")` — validated via `model_post_init`
- `account_email` must match a connected Gmail or SMTP account: 404 if no match found

**Return Schema** — `SendEmailResponse`:

```json
{
  "message_id": "string — The email Message-ID (for Gmail: same as thread_id; for SMTP: the SMTP message-ID header value)",
  "thread_id": "string — The thread ID this message belongs to (for Gmail: the Gmail thread ID; for SMTP: the request's thread_id or the message_id if no thread_id was provided)",
  "sent_at": "datetime — ISO 8601 UTC timestamp of when the email was sent (server-side timestamp, not relay timestamp)"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Empty `to` list | "At least one recipient is required" | 422 |
| Missing body (both null) | "Either body_html or body_text must be provided" | 422 |
| Account not found | "Account not found: {account_email}" | 404 |
| Non-owner, no campaign assignment for account | "Not authorized to send from this account" | 403 |
| Non-owner, thread not in assigned campaign | "Not authorized to send on this thread" | 403 |
| Send failure (Gmail API or SMTP error) | "Failed to send email" | 500 |
| Service API error | ToolError with status code and truncated body | varies |

**Side Effects**:
1. **Thread state transition**: If `gmail_thread_state_id` or `smtp_thread_state_id` is provided, that state's status is updated to `NOT_LATEST` (a terminal state). This prevents the old state from being picked up by the automated follow-up scheduling system (`batch_get_ready_for_follow_up_ids`)
2. **Gmail sync pickup**: For Gmail accounts, the outbound message will be detected by the Gmail sync pipeline, which creates a fresh `GmailThreadState`. The `ThreadProcessingCoordinatorWorkflow` then handles the proper `WAITING_FOR_INBOUND` transition and follow-up scheduling
3. **Display name**: For Gmail, the backend looks up the sender's display name from Gmail SendAs settings. For SMTP, it uses the `display_name` field from the `UserSmtpAccount` record
4. **First recipient only**: The backend sends to `request.to[0]` as the primary recipient (not all recipients in the `to` list). CC is passed through. This is a current implementation limitation

**Example Request** (reply to existing thread):
```
cheerful_send_email(
  account_email="emily@brand.com",
  to=["sarah@creator.com"],
  subject="Re: Collaboration opportunity with BrandX",
  body_text="Hi Sarah!\n\nI'll send you sizes S, M, and L. Please share your shipping address.\n\nBest,\nEmily",
  thread_id="18f3a2b4c5d6e7f8",
  in_reply_to="<msg-abc123@mail.gmail.com>",
  references="<msg-abc123@mail.gmail.com>",
  gmail_thread_state_id="b2c3d4e5-f6a7-8901-bcde-f23456789012"
)
```

**Example Response**:
```json
{
  "message_id": "18f5c4d3e2f1a0b9",
  "thread_id": "18f3a2b4c5d6e7f8",
  "sent_at": "2026-03-01T10:15:30Z"
}
```

**Example Request** (new email, not a reply):
```
cheerful_send_email(
  account_email="emily@brand.com",
  to=["newcreator@example.com"],
  subject="Partnership opportunity with BrandX",
  body_html="<p>Hi!</p><p>We'd love to send you some products...</p>",
  body_text="Hi!\n\nWe'd love to send you some products..."
)
```

**Slack Formatting Notes**:
- Confirm: "Email sent to [recipient] from [sender] at [time]"
- Include subject: "Subject: [subject]"
- For replies: "Reply sent in thread '[subject]'"
- If the agent composed the email from a draft: "Draft sent successfully. Thread state updated."

**Edge Cases**:
- Gmail vs SMTP auto-detection: The backend checks `user_gmail_account` first, then `user_smtp_account`. If the same email exists in both (shouldn't happen), Gmail takes precedence
- Both `body_html` and `body_text` provided: Both are sent. Gmail uses multipart/alternative; SMTP sends both parts
- Thread ID without `in_reply_to`/`references`: The email is threaded by Gmail's internal threading (subject matching) but may not show as a proper reply in other email clients
- State transition race: If the thread state was already changed to `NOT_LATEST` by another action, the update is idempotent
- SMTP send failure: Returns 500 "Failed to send email". The SMTP connection error is logged but not surfaced in the error detail
- Team member access: The assignment check is two-phase — first verifies the team member can use the account (via any campaign that uses that account), then verifies the specific thread belongs to one of their assigned campaigns

---

## Scheduled Email Dispatch

### `cheerful_schedule_email`

**Status**: NEW — full OpenAPI-level spec

**Purpose**: Schedule an email to be sent at a specific future time. Supports timezone-aware scheduling. Creates an `EmailDispatchQueue` record that a Temporal workflow picks up at the scheduled time.

**Maps to**: `POST /api/service/emails/scheduled` (new service route needed; mirrors main route: `POST /emails/scheduled`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-only — the backend verifies that the Gmail or SMTP account belongs to the user (via direct `user_id` match on the account record).

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| gmail_account_id | string (uuid) | conditional | — | Gmail account UUID to send from. Mutually exclusive with `smtp_account_id` — exactly one of the two must be provided |
| smtp_account_id | string (uuid) | conditional | — | SMTP account UUID to send from. Mutually exclusive with `gmail_account_id` — exactly one of the two must be provided |
| recipient_email | string (email) | yes | — | Recipient email address. Validated via Pydantic `EmailStr` |
| subject | string | yes | — | Email subject line |
| dispatch_at | datetime | yes | — | Scheduled send time. MUST be timezone-aware (include timezone offset). MUST be in the future (after `datetime.now(UTC)` at time of request). ISO 8601 format (e.g., `"2026-03-02T09:00:00-05:00"`) |
| recipient_name | string | no | null | Recipient display name |
| cc_emails | string[] (email[]) | no | null | CC email addresses. Each validated via Pydantic `EmailStr` |
| bcc_emails | string[] (email[]) | no | null | BCC email addresses. Each validated via Pydantic `EmailStr` |
| body_text | string | no | null | Plain text email body. At least one of `body_text` or `body_html` must be provided |
| body_html | string | no | null | HTML email body. At least one of `body_text` or `body_html` must be provided |
| in_reply_to_message_id | string | no | null | Message-ID header for reply threading |
| references_header | string | no | null | References header for reply threading |
| gmail_thread_id | string | no | null | Thread ID for reply threading |
| user_timezone | string | no | "UTC" | IANA timezone string (e.g., `"America/New_York"`, `"Europe/London"`, `"Asia/Tokyo"`). Validated via Python `ZoneInfo`. Stored with the dispatch for display purposes |

**Parameter Validation Rules** (from `ScheduleEmailRequest` in `email_dispatch.py`):
- Exactly one of `gmail_account_id` or `smtp_account_id` must be provided (XOR check via `bool(gmail_account_id) ^ bool(smtp_account_id)`): 400 `"Exactly one of gmail_account_id or smtp_account_id is required"`
- At least one of `body_text` or `body_html` must be provided: 422 `"At least one of body_text or body_html is required"`
- `dispatch_at` must include timezone info: `ValueError("dispatch_at must be timezone-aware")`
- `dispatch_at` must be in the future: `ValueError("dispatch_at must be in the future")`
- `user_timezone` must be a valid IANA timezone: `ValueError("Invalid timezone: {value}")`
- Account must exist and belong to the user: 403 `"Gmail account not found or not owned by user"` or `"SMTP account not found or not owned by user"`

**Return Schema** — `ScheduleEmailResponse` (HTTP 201 Created):

```json
{
  "id": "string (uuid) — Dispatch queue record UUID. Use this ID for cancel/reschedule operations",
  "dispatch_at": "datetime — The confirmed scheduled send time (same as request value)",
  "status": "string — Always 'pending' for newly created dispatches"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Both or neither account IDs provided | "Exactly one of gmail_account_id or smtp_account_id is required" | 400 |
| Missing body (both null) | "At least one of body_text or body_html is required" | 422 |
| dispatch_at not timezone-aware | "dispatch_at must be timezone-aware" | 422 |
| dispatch_at in the past | "dispatch_at must be in the future" | 422 |
| Invalid timezone | "Invalid timezone: {value}" | 422 |
| Gmail account not found/not owned | "Gmail account not found or not owned by user" | 403 |
| SMTP account not found/not owned | "SMTP account not found or not owned by user" | 403 |
| Service API error | ToolError with status code and truncated body | varies |

**Pagination**: Not applicable — creates a single dispatch record.

**Example Request**:
```
cheerful_schedule_email(
  gmail_account_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  recipient_email="sarah@creator.com",
  recipient_name="Sarah Johnson",
  subject="Quick follow-up on our collaboration",
  body_text="Hi Sarah,\n\nJust wanted to check in — did you receive the products we sent last week?\n\nBest,\nEmily",
  dispatch_at="2026-03-03T09:00:00-05:00",
  user_timezone="America/New_York"
)
```

**Example Response**:
```json
{
  "id": "c3d4e5f6-a7b8-9012-cdef-345678901234",
  "dispatch_at": "2026-03-03T14:00:00+00:00",
  "status": "pending"
}
```

**Slack Formatting Notes**:
- Confirm: "Email to [recipient_name] ([recipient_email]) scheduled for [time] [timezone]"
- Show dispatch ID for reference: "Dispatch ID: [id] — use this to cancel or reschedule"

**Edge Cases**:
- `dispatch_at` exactly at current time: Rejected — must be strictly in the future
- Very far future (e.g., 1 year): Accepted — no upper bound on scheduling
- Invalid IANA timezone (e.g., "US/Eastern" vs "America/New_York"): Both are valid IANA zones; "US/Eastern" is a legacy alias that `ZoneInfo` accepts
- Scheduling a reply (`gmail_thread_id` + `in_reply_to_message_id`): The dispatch worker will thread the email correctly when it sends at the scheduled time

---

### `cheerful_list_scheduled_emails`

**Status**: NEW — full OpenAPI-level spec

**Purpose**: List all pending scheduled emails for the current user. Returns only emails with `PENDING` status (not sent, failed, or cancelled).

**Maps to**: `GET /api/service/emails/scheduled` (new service route needed; mirrors main route: `GET /emails/scheduled`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated — user sees only their own scheduled emails (filtered by `dispatch.user_id`).

**Parameters**: None (user-scoped via injected `RequestContext`).

**Return Schema** — `ScheduledEmailListResponse`:

```json
{
  "emails": [
    {
      "id": "string (uuid) — Dispatch queue record UUID",
      "dispatch_at": "datetime — Scheduled send time",
      "status": "string — Always 'pending' (only pending dispatches are returned by this endpoint)",
      "recipient_email": "string — Recipient email address",
      "subject": "string — Email subject line"
    }
  ]
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Service API error | ToolError with status code and truncated body | varies |

**Pagination**: Not paginated — returns all pending dispatches for the user. Typically a small number (0-20).

**Example Request**:
```
cheerful_list_scheduled_emails()
```

**Example Response**:
```json
{
  "emails": [
    {
      "id": "c3d4e5f6-a7b8-9012-cdef-345678901234",
      "dispatch_at": "2026-03-03T14:00:00+00:00",
      "status": "pending",
      "recipient_email": "sarah@creator.com",
      "subject": "Quick follow-up on our collaboration"
    },
    {
      "id": "d4e5f6a7-b8c9-0123-defa-456789012345",
      "dispatch_at": "2026-03-04T10:00:00+00:00",
      "status": "pending",
      "recipient_email": "mike@influencer.com",
      "subject": "Product shipment update"
    }
  ]
}
```

**Slack Formatting Notes**:
- Present as a numbered table: `[#] | [Recipient] | [Subject] | [Scheduled Time]`
- Format dispatch_at in the user's timezone if known
- If no pending emails: "You have no scheduled emails pending."
- Mention that dispatch IDs can be used to cancel or reschedule

**Edge Cases**:
- No pending emails: Returns `{"emails": []}` (empty array)
- Recently sent emails: Not included — only `PENDING` status dispatches appear
- Cancelled emails: Not included

---

### `cheerful_cancel_scheduled_email`

**Status**: NEW — full OpenAPI-level spec

**Purpose**: Cancel a pending scheduled email. Only works on emails with `PENDING` status. Sets the status to `CANCELLED` with reason "Cancelled by user".

**Maps to**: `DELETE /api/service/emails/scheduled/{dispatch_id}` (new service route needed; mirrors main route: `DELETE /emails/scheduled/{dispatch_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-only — the backend checks `dispatch.user_id != current_user_id` and returns 403 if they don't match.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| dispatch_id | string (uuid) | yes | — | Scheduled email dispatch UUID. Obtain from `cheerful_list_scheduled_emails` or `cheerful_schedule_email` response |

**Parameter Validation Rules**:
- `dispatch_id` must be a valid UUID: FastAPI raises 422 if not parseable
- Dispatch must exist: 404 if not found
- User must own the dispatch: 403 if not authorized
- Dispatch must be in `PENDING` status: 409 if already sent or cancelled

**Return Schema**:

```json
{
  "status": "string — Always 'cancelled'",
  "id": "string — The dispatch UUID (as string)"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Invalid UUID format | "value is not a valid uuid" | 422 |
| Dispatch not found | "Scheduled email not found" | 404 |
| User does not own dispatch | "Not authorized to cancel this email" | 403 |
| Already sent or cancelled (status check) | "Email has already been sent or cancelled" | 409 |
| Race condition (status changed between check and update) | "Email could not be cancelled (may have been sent)" | 409 |
| Service API error | ToolError with status code and truncated body | varies |

**Example Request**:
```
cheerful_cancel_scheduled_email(dispatch_id="c3d4e5f6-a7b8-9012-cdef-345678901234")
```

**Example Response**:
```json
{
  "status": "cancelled",
  "id": "c3d4e5f6-a7b8-9012-cdef-345678901234"
}
```

**Slack Formatting Notes**:
- Confirm: "Scheduled email cancelled. It will not be sent."
- If the agent has context about the email: "Cancelled scheduled email to [recipient] ([subject])"

**Edge Cases**:
- Dispatch in `PROCESSING` status (currently being sent): Returns 409 "Email has already been sent or cancelled" — the status check treats any non-PENDING status as non-cancellable
- Dispatch in `FAILED` status: Returns 409 — failed dispatches cannot be "cancelled"
- Race condition: If the dispatch transitions from PENDING to PROCESSING between the status check and the cancellation update, the `repo.cancel()` method returns `False` and the endpoint returns 409 "Email could not be cancelled (may have been sent)"
- Cancellation reason: The backend passes `reason="Cancelled by user"` to the repository cancel method

---

### `cheerful_reschedule_email`

**Status**: NEW — full OpenAPI-level spec

**Purpose**: Change the dispatch time of a pending scheduled email. Only works on emails with `PENDING` status.

**Maps to**: `PATCH /api/service/emails/scheduled/{dispatch_id}/reschedule` (new service route needed; mirrors main route: `PATCH /emails/scheduled/{dispatch_id}/reschedule`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-only — the backend checks `dispatch.user_id != current_user_id`.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| dispatch_id | string (uuid) | yes | — | Scheduled email dispatch UUID |
| dispatch_at | datetime | yes | — | New scheduled send time. MUST be timezone-aware. MUST be in the future. ISO 8601 format |

**Parameter Validation Rules** (from `RescheduleRequest` in `email_dispatch.py`):
- `dispatch_id` must be a valid UUID: FastAPI raises 422 if not parseable
- `dispatch_at` must include timezone info: `ValueError("dispatch_at must be timezone-aware")`
- `dispatch_at` must be in the future: `ValueError("dispatch_at must be in the future")`
- Dispatch must exist: 404 if not found
- User must own the dispatch: 403 if not authorized
- Dispatch must be in `PENDING` status: 409 if already sent or cancelled

**Return Schema**:

```json
{
  "status": "string — Always 'rescheduled'",
  "id": "string — The dispatch UUID (as string)",
  "dispatch_at": "string — The new dispatch time in ISO 8601 format"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Invalid UUID format | "value is not a valid uuid" | 422 |
| dispatch_at not timezone-aware | "dispatch_at must be timezone-aware" | 422 |
| dispatch_at in the past | "dispatch_at must be in the future" | 422 |
| Dispatch not found | "Scheduled email not found" | 404 |
| User does not own dispatch | "Not authorized to reschedule this email" | 403 |
| Already sent or cancelled | "Email has already been sent or cancelled" | 409 |
| Race condition (status changed between check and update) | "Email could not be rescheduled (may have been sent)" | 409 |
| Service API error | ToolError with status code and truncated body | varies |

**Example Request**:
```
cheerful_reschedule_email(
  dispatch_id="c3d4e5f6-a7b8-9012-cdef-345678901234",
  dispatch_at="2026-03-05T09:00:00-05:00"
)
```

**Example Response**:
```json
{
  "status": "rescheduled",
  "id": "c3d4e5f6-a7b8-9012-cdef-345678901234",
  "dispatch_at": "2026-03-05T14:00:00+00:00"
}
```

**Slack Formatting Notes**:
- Confirm: "Email rescheduled to [new time]"
- Show previous time if known from context: "Email rescheduled from [old time] to [new time]"

**Edge Cases**:
- Same as `cheerful_cancel_scheduled_email` for status and race condition handling
- Rescheduling to a time very close to now (e.g., 30 seconds from now): Accepted if still in the future at validation time, but the dispatch worker may not pick it up in time
- Multiple reschedules: Each reschedule simply updates the `dispatch_at` field — no limit on how many times an email can be rescheduled

---

## Email Signatures

> **Cross-reference**: The campaigns domain (`specs/campaigns.md`) has 3 campaign-oriented signature tools (`cheerful_get_campaign_signature`, `cheerful_update_campaign_signature`, `cheerful_list_campaign_signatures`) that map to proposed campaign-specific service routes. This section covers the full CRUD via the actual `/email-signatures` backend routes, which serve both user-level and campaign-specific signatures.

### `cheerful_list_email_signatures`

**Status**: NEW — full OpenAPI-level spec

**Purpose**: List all email signatures belonging to the current user, optionally filtered by campaign. Returns both user-level (reusable) and campaign-specific signatures.

**Maps to**: `GET /api/service/email-signatures` (new service route needed; mirrors main route: `GET /email-signatures`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated — user sees only their own signatures.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | string (uuid) | no | null | Filter to signatures for a specific campaign. When provided: returns user-level signatures PLUS that campaign's specific signature. When omitted: returns ALL user signatures (user-level + all campaign-specific) |

**Parameter Validation Rules**:
- `campaign_id` (if provided) must be a valid UUID: FastAPI raises 422 if not parseable

**Return Schema** — `EmailSignatureListResponse`:

```json
{
  "signatures": [
    {
      "id": "string (uuid) — Signature UUID",
      "user_id": "string (uuid) — Owner user UUID",
      "name": "string — Signature display name (1-255 characters)",
      "content": "string — HTML signature content (sanitized, max 10,000 characters)",
      "is_default": "boolean — Whether this is the default user-level signature. Only one user-level signature can be default at a time. Campaign signatures are always false",
      "campaign_id": "string (uuid) | null — Campaign UUID if this is a campaign-specific signature. Null for user-level signatures",
      "campaign_name": "string | null — Campaign name (populated via database join when campaign_id is set). Null for user-level signatures",
      "is_enabled": "boolean — For campaign signatures: whether auto-append is enabled for automated emails. For user-level signatures: always false",
      "created_at": "datetime — ISO 8601 creation timestamp",
      "updated_at": "datetime — ISO 8601 last update timestamp"
    }
  ]
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Invalid campaign_id format | "value is not a valid uuid" | 422 |
| Service API error | ToolError with status code and truncated body | varies |

**Pagination**: Not paginated — returns all matching signatures. Typically a small number (1-10).

**Example Request**:
```
cheerful_list_email_signatures(campaign_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890")
```

**Example Response**:
```json
{
  "signatures": [
    {
      "id": "f1a2b3c4-d5e6-7890-abcd-ef1234567890",
      "user_id": "u1a2b3c4-d5e6-7890-abcd-ef1234567890",
      "name": "Emily — Default",
      "content": "<p>Best regards,<br>Emily Chen<br>Brand Partnerships @ BrandX</p>",
      "is_default": true,
      "campaign_id": null,
      "campaign_name": null,
      "is_enabled": false,
      "created_at": "2026-01-15T10:00:00Z",
      "updated_at": "2026-02-20T14:30:00Z"
    },
    {
      "id": "f2b3c4d5-e6f7-8901-bcde-f23456789012",
      "user_id": "u1a2b3c4-d5e6-7890-abcd-ef1234567890",
      "name": "Spring Campaign Signature",
      "content": "<p>Emily Chen<br>Spring Collection Team<br><a href='https://brandx.com/spring'>brandx.com/spring</a></p>",
      "is_default": false,
      "campaign_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "campaign_name": "Spring 2026 Creator Campaign",
      "is_enabled": true,
      "created_at": "2026-02-01T09:00:00Z",
      "updated_at": "2026-02-01T09:00:00Z"
    }
  ]
}
```

**Slack Formatting Notes**:
- Present as a list: `[name] — [type: "User-level" or "Campaign: [campaign_name]"] [default badge] [enabled badge]`
- Mark default signature: "(default)"
- Mark enabled campaign signatures: "(auto-append enabled)"
- If no signatures: "You haven't created any email signatures yet."

**Edge Cases**:
- No signatures: Returns `{"signatures": []}` (empty array)
- Campaign with no campaign-specific signature: Returns only user-level signatures when filtered by that campaign
- Deleted signatures: Not returned (soft-deleted in database via repository `delete` method)

---

### `cheerful_get_email_signatures_for_reply`

**Status**: NEW — full OpenAPI-level spec

**Purpose**: Get the appropriate signatures for composing a reply — returns user-level signatures separated from the campaign-specific signature. Designed for the reply composer dropdown where the user picks which signature to append.

**Maps to**: `GET /api/service/email-signatures/for-reply` (new service route needed; mirrors main route: `GET /email-signatures/for-reply`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | string (uuid) | no | null | Campaign context for the reply. When provided, includes the campaign-specific signature (if one exists and is enabled) |

**Return Schema** — `SignaturesForReplyResponse`:

```json
{
  "user_signatures": [
    {
      "id": "string (uuid)",
      "user_id": "string (uuid)",
      "name": "string",
      "content": "string (HTML)",
      "is_default": "boolean",
      "campaign_id": "null — Always null for user-level signatures",
      "campaign_name": "null",
      "is_enabled": "boolean",
      "created_at": "datetime",
      "updated_at": "datetime"
    }
  ],
  "campaign_signature": "EmailSignatureResponse | null — The campaign-specific signature if it exists in the filtered results. Null if no campaign_id provided, or if the campaign has no signature"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Invalid campaign_id format | "value is not a valid uuid" | 422 |
| Service API error | ToolError with status code and truncated body | varies |

**Example Request**:
```
cheerful_get_email_signatures_for_reply(campaign_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890")
```

**Example Response**:
```json
{
  "user_signatures": [
    {
      "id": "f1a2b3c4-d5e6-7890-abcd-ef1234567890",
      "user_id": "u1a2b3c4-d5e6-7890-abcd-ef1234567890",
      "name": "Emily — Default",
      "content": "<p>Best regards,<br>Emily Chen<br>Brand Partnerships @ BrandX</p>",
      "is_default": true,
      "campaign_id": null,
      "campaign_name": null,
      "is_enabled": false,
      "created_at": "2026-01-15T10:00:00Z",
      "updated_at": "2026-02-20T14:30:00Z"
    }
  ],
  "campaign_signature": {
    "id": "f2b3c4d5-e6f7-8901-bcde-f23456789012",
    "user_id": "u1a2b3c4-d5e6-7890-abcd-ef1234567890",
    "name": "Spring Campaign Signature",
    "content": "<p>Emily Chen<br>Spring Collection Team</p>",
    "is_default": false,
    "campaign_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "campaign_name": "Spring 2026 Creator Campaign",
    "is_enabled": true,
    "created_at": "2026-02-01T09:00:00Z",
    "updated_at": "2026-02-01T09:00:00Z"
  }
}
```

**Slack Formatting Notes**:
- Present the recommended signature (campaign signature if exists and enabled, else default user signature)
- Mention alternatives: "Using campaign signature 'Spring Campaign Signature'. You also have 1 user-level signature available."

**Edge Cases**:
- No campaign_id provided: `campaign_signature` is null; only `user_signatures` are populated
- Campaign has no signature: `campaign_signature` is null
- No signatures at all: `user_signatures` is empty array, `campaign_signature` is null

---

### `cheerful_create_email_signature`

**Status**: NEW — full OpenAPI-level spec

**Purpose**: Create a new email signature. Can be user-level (reusable across campaigns) or campaign-specific (tied to one campaign). HTML content is sanitized server-side.

**Maps to**: `POST /api/service/email-signatures` (new service route needed; mirrors main route: `POST /email-signatures`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated for user-level signatures; campaign owner for campaign-specific signatures (backend checks `campaign.user_id != user_id` and returns 404 "Campaign not found" if not owned).

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| name | string | yes | — | Signature display name. Min length: 1 character. Max length: 255 characters |
| content | string | yes | — | HTML signature content. Min length: 1 character. Max length: 10,000 characters. Server-side sanitized via `sanitize_signature_html()` (strips dangerous tags/attributes while preserving formatting) |
| is_default | boolean | no | false | Set as default user-level signature. Only applies to user-level signatures — campaign signatures are forced to `false` regardless of this parameter. When set to `true`, all other user-level signatures have `is_default` cleared |
| campaign_id | string (uuid) | no | null | Campaign UUID. Omit for user-level signature, provide for campaign-specific signature. The campaign must be owned by the user |
| is_enabled | boolean | no | false | Enable auto-append for automated emails. Only applies to campaign-specific signatures — user-level signatures are forced to `false` regardless of this parameter |

**Parameter Validation Rules** (from `EmailSignatureCreateRequest` Pydantic model):
- `name` min_length=1, max_length=255: FastAPI raises 422 if violated
- `content` min_length=1, max_length=10000: FastAPI raises 422 if violated
- Content is additionally validated via `validate_signature_length()`: 400 `"Signature content exceeds maximum length of 10,000 characters"` (this is a server-side check in addition to the Pydantic constraint)
- `campaign_id` (if provided) must be a valid UUID: 422 if not parseable
- Campaign must exist and be owned by user: 404 `"Campaign not found"` if not owned

**Return Schema** — `EmailSignatureResponse` (HTTP 201 Created): Same schema as in `cheerful_list_email_signatures`.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Name empty or too long | "ensure this value has at least 1 characters" / "ensure this value has at most 255 characters" | 422 |
| Content empty or too long | "ensure this value has at least 1 characters" / "ensure this value has at most 10000 characters" | 422 |
| Content exceeds length (server check) | "Signature content exceeds maximum length of 10,000 characters" | 400 |
| Campaign not found or not owned | "Campaign not found" | 404 |
| Service API error | ToolError with status code and truncated body | varies |

**Side Effects**:
- If `is_default=true` for a user-level signature: All other user-level signatures for this user have `is_default` set to `false` via `repo.clear_default_for_user(user_id)`
- If `campaign_id` is set: `is_default` is forced to `false` (campaign signatures cannot be default)
- If `campaign_id` is not set: `is_enabled` is forced to `false` (user-level signatures don't have auto-append)
- Content is sanitized via `sanitize_signature_html()` before storage

**Example Request**:
```
cheerful_create_email_signature(
  name="Emily — Spring Campaign",
  content="<p>Best,<br>Emily Chen<br>Spring Collection Team @ BrandX</p>",
  campaign_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  is_enabled=true
)
```

**Example Response**:
```json
{
  "id": "f3c4d5e6-a7b8-9012-cdef-345678901234",
  "user_id": "u1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "name": "Emily — Spring Campaign",
  "content": "<p>Best,<br>Emily Chen<br>Spring Collection Team @ BrandX</p>",
  "is_default": false,
  "campaign_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "campaign_name": "Spring 2026 Creator Campaign",
  "is_enabled": true,
  "created_at": "2026-03-01T10:00:00Z",
  "updated_at": "2026-03-01T10:00:00Z"
}
```

**Slack Formatting Notes**:
- Confirm: "Signature '[name]' created" with type indicator: "(user-level, default)" or "(campaign: [campaign_name], auto-append enabled)"

**Edge Cases**:
- Campaign signature already exists for this campaign: The backend does not enforce uniqueness — multiple campaign signatures can exist, but only the first one found by the reply endpoint is used
- HTML content with script tags: Stripped by `sanitize_signature_html()`. The saved content may differ from the input
- Setting `is_default=true` for a campaign signature: `is_default` is silently forced to `false`

---

### `cheerful_get_email_signature`

**Status**: NEW — full OpenAPI-level spec

**Purpose**: Get a single email signature by ID.

**Maps to**: `GET /api/service/email-signatures/{signature_id}` (new service route needed; mirrors main route: `GET /email-signatures/{signature_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-only — the backend checks `signature.user_id != user_id`.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| signature_id | string (uuid) | yes | — | Signature UUID |

**Parameter Validation Rules**:
- `signature_id` must be a valid UUID: FastAPI raises 422 if not parseable

**Return Schema** — `EmailSignatureResponse`: Same schema as in `cheerful_list_email_signatures`.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Invalid UUID format | "value is not a valid uuid" | 422 |
| Signature not found | "Signature not found" | 404 |
| User does not own signature | "Not authorized to access this signature" | 403 |
| Service API error | ToolError with status code and truncated body | varies |

**Example Request**:
```
cheerful_get_email_signature(signature_id="f1a2b3c4-d5e6-7890-abcd-ef1234567890")
```

**Example Response**:
```json
{
  "id": "f1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "user_id": "u1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "name": "Emily — Default",
  "content": "<p>Best regards,<br>Emily Chen<br>Brand Partnerships @ BrandX</p>",
  "is_default": true,
  "campaign_id": null,
  "campaign_name": null,
  "is_enabled": false,
  "created_at": "2026-01-15T10:00:00Z",
  "updated_at": "2026-02-20T14:30:00Z"
}
```

**Slack Formatting Notes**:
- Display signature name, content preview (first 200 chars of HTML stripped to text), and metadata

**Edge Cases**:
- Deleted signature: Returns 404 "Signature not found" (soft delete)

---

### `cheerful_update_email_signature`

**Status**: NEW — full OpenAPI-level spec

**Purpose**: Update an existing email signature. Partial update — only provided fields are changed.

**Maps to**: `PATCH /api/service/email-signatures/{signature_id}` (new service route needed; mirrors main route: `PATCH /email-signatures/{signature_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-only — the backend checks `signature.user_id != user_id`.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| signature_id | string (uuid) | yes | — | Signature UUID |
| name | string | no | — | New name. Min length: 1, max length: 255. Omit to keep existing |
| content | string | no | — | New HTML content. Min length: 1, max length: 10,000. Omit to keep existing. Sanitized server-side |
| is_default | boolean | no | — | Set/unset as default. When `true`, clears `is_default` on all other user-level signatures |
| is_enabled | boolean | no | — | Enable/disable auto-append for campaign signatures |

**Parameter Validation Rules** (from `EmailSignatureUpdateRequest`):
- `name` (if provided) min_length=1, max_length=255: FastAPI raises 422 if violated
- `content` (if provided) min_length=1, max_length=10000: FastAPI raises 422 if violated
- Content (if provided) is validated via `validate_signature_length()`: 400 `"Signature content exceeds maximum length"` and sanitized via `sanitize_signature_html()`

**Return Schema** — `EmailSignatureResponse` (updated): Same schema as in `cheerful_list_email_signatures`.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Invalid UUID format | "value is not a valid uuid" | 422 |
| Signature not found | "Signature not found" | 404 |
| User does not own signature | "Not authorized to update this signature" | 403 |
| Name too short/long | "ensure this value has at least 1 characters" / "ensure this value has at most 255 characters" | 422 |
| Content too long (server check) | "Signature content exceeds maximum length" | 400 |
| Service API error | ToolError with status code and truncated body | varies |

**Side Effects**:
- If `is_default=true`: All other user-level signatures for this user have `is_default` cleared
- Content is re-sanitized if updated

**Example Request**:
```
cheerful_update_email_signature(
  signature_id="f1a2b3c4-d5e6-7890-abcd-ef1234567890",
  content="<p>Cheers,<br>Emily Chen<br>Senior Brand Partnerships @ BrandX</p>"
)
```

**Example Response**:
```json
{
  "id": "f1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "user_id": "u1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "name": "Emily — Default",
  "content": "<p>Cheers,<br>Emily Chen<br>Senior Brand Partnerships @ BrandX</p>",
  "is_default": true,
  "campaign_id": null,
  "campaign_name": null,
  "is_enabled": false,
  "created_at": "2026-01-15T10:00:00Z",
  "updated_at": "2026-03-01T09:45:00Z"
}
```

**Slack Formatting Notes**:
- Confirm: "Signature '[name]' updated"

**Edge Cases**:
- No fields provided: The update succeeds but nothing changes (empty PATCH)
- Setting `is_default=true` on a campaign signature: The backend sets `is_default` regardless of signature type (no guard). This is a minor inconsistency — create guards against it but update does not

---

### `cheerful_delete_email_signature`

**Status**: NEW — full OpenAPI-level spec

**Purpose**: Delete an email signature.

**Maps to**: `DELETE /api/service/email-signatures/{signature_id}` (new service route needed; mirrors main route: `DELETE /email-signatures/{signature_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-only — the backend checks `signature.user_id != user_id`.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| signature_id | string (uuid) | yes | — | Signature UUID |

**Parameter Validation Rules**:
- `signature_id` must be a valid UUID: FastAPI raises 422 if not parseable

**Return Schema**: HTTP 204 No Content — no response body.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Invalid UUID format | "value is not a valid uuid" | 422 |
| Signature not found | "Signature not found" | 404 |
| User does not own signature | "Not authorized to delete this signature" | 403 |
| Service API error | ToolError with status code and truncated body | varies |

**Example Request**:
```
cheerful_delete_email_signature(signature_id="f2b3c4d5-e6f7-8901-bcde-f23456789012")
```

**Example Response**:
```
HTTP 204 No Content — empty response body
```

**Slack Formatting Notes**:
- Confirm: "Signature deleted."
- If the agent has context: "Signature '[name]' deleted."

**Edge Cases**:
- Deleting the default signature: The signature is deleted. No other signature is automatically promoted to default — the user must manually set a new default
- Deleting a campaign signature: The campaign reverts to using no signature for automated emails (or falls back to the user's default, depending on the email sending implementation)
- Database cascade: The `EmailSignature` table has `cascade delete` on both `user_id` and `campaign_id` foreign keys — if the user or campaign is deleted, all their signatures are automatically deleted

---

## Bulk Draft Edit

### `cheerful_bulk_edit_drafts`

**Status**: NEW — full OpenAPI-level spec

**Purpose**: Batch edit all AI-generated drafts in a campaign using a natural language instruction. Starts an asynchronous Temporal workflow that rewrites matching drafts. Optionally saves the edit instruction as a permanent campaign rule for future AI draft generation.

**Maps to**: `POST /api/service/bulk-draft-edit` (new service route needed; mirrors main route: `POST /bulk-draft-edit`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: campaign owner-only — the backend checks `str(campaign.user_id) != str(user_id)` and returns 403.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | string (uuid) | yes | — | Campaign UUID. User must own this campaign |
| edit_instruction | string | yes | — | Natural language instruction for how to edit the drafts. Examples: "make all drafts shorter and more casual", "add a PS asking about their shipping address", "remove any mentions of pricing" |
| exclude_thread_ids | string[] | no | [] (empty) | Thread IDs to skip (exclude from the bulk edit). Useful when the user has already manually edited certain threads and doesn't want them overwritten |
| save_as_rule | boolean | no | false | When `true`, saves the edit instruction as a permanent campaign rule. Future AI-generated drafts will follow this rule |
| rule_text | string | no | null | Human-readable rule text to save. Only used when `save_as_rule=true`. If omitted when `save_as_rule=true`, the `edit_instruction` is used as the rule text |

**Parameter Validation Rules**:
- `campaign_id` must be a valid UUID: FastAPI raises 422 if not parseable
- `edit_instruction` is required: FastAPI raises 422 if missing
- Campaign must exist and be owned by user: 403 `"Not authorized for this campaign"`

**Return Schema** — `BulkDraftEditResponse`:

```json
{
  "workflow_id": "string — Temporal workflow ID for tracking. Format: 'bulk-draft-edit-{campaign_id}-{random_8_hex_chars}' (e.g., 'bulk-draft-edit-a1b2c3d4-e5f6-7890-abcd-ef1234567890-3f8a2b1c')",
  "message": "string — Always 'Bulk draft edit started'"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Missing campaign_id or edit_instruction | "field required" | 422 |
| Invalid UUID format | "value is not a valid uuid" | 422 |
| Campaign not found or not owned | "Not authorized for this campaign" | 403 |
| Temporal client connection failure | Internal server error | 500 |
| Service API error | ToolError with status code and truncated body | varies |

**Side Effects**:
- Starts a Temporal `BulkDraftEditWorkflow` with:
  - Execution timeout: 5 minutes
  - ID reuse policy: `ALLOW_DUPLICATE` (allows re-running the same campaign with different instructions)
  - Workflow ID pattern: `bulk-draft-edit-{campaign_id}-{uuid4_hex[:8]}`
- The workflow rewrites all matching LLM-generated drafts in the campaign using the AI edit instruction
- If `save_as_rule=true`, the instruction is saved as a campaign rule that affects all future AI-generated drafts

**Example Request**:
```
cheerful_bulk_edit_drafts(
  campaign_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  edit_instruction="Make all drafts more casual and add a PS asking about their sizing preferences",
  exclude_thread_ids=["18f3a2b4c5d6e7f8"],
  save_as_rule=true,
  rule_text="Always use a casual tone and ask about sizing preferences in a PS"
)
```

**Example Response**:
```json
{
  "workflow_id": "bulk-draft-edit-a1b2c3d4-e5f6-7890-abcd-ef1234567890-3f8a2b1c",
  "message": "Bulk draft edit started"
}
```

**Slack Formatting Notes**:
- Confirm: "Bulk draft edit started for campaign '[campaign name]'. Editing all drafts with instruction: '[edit_instruction]'"
- If threads excluded: "Skipping [N] thread(s) you've manually edited"
- If rule saved: "This instruction has also been saved as a campaign rule for future drafts"
- Note that this is async: "The edits are being applied in the background. This may take a few minutes for campaigns with many drafts."
- There is no polling endpoint for bulk edit progress — the operation is fire-and-forget from the API's perspective

**Edge Cases**:
- Campaign with no drafts: The workflow starts but finds no drafts to edit. Completes quickly with no changes
- Campaign with only human-edited drafts: The workflow may skip these (depends on implementation of the BulkDraftEditWorkflow — needs verification)
- Temporal unavailable: Returns 500 — the workflow cannot be started. The campaign data is not affected
- Very long edit instruction: No explicit length limit in the Pydantic model. The AI model's context window is the practical limit
- Running multiple bulk edits simultaneously: Allowed (ID reuse policy is `ALLOW_DUPLICATE`). Each gets a unique workflow ID. They may conflict if editing the same drafts

---

## AI Email Improvement

### `cheerful_improve_email_content`

**Status**: NEW — full OpenAPI-level spec

**Purpose**: Apply AI-powered text improvements to email content. Supports preset actions (shorten, expand, tone adjustment) and custom instructions. The frontend uses OpenAI GPT-4.1-mini via SSE streaming; the context engine implements this natively using its own AI capabilities rather than calling a backend endpoint.

**Maps to**: CE-native implementation (no backend service route). The frontend equivalent is `POST /api/improve-email-content-stream-send-textbox` (Next.js API route using OpenAI GPT-4.1-mini with SSE streaming), but the CE implements this capability directly.

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| content | string | yes | — | The email text to improve. Plain text format |
| action | string (enum) | yes | — | The improvement action. One of the preset actions or a custom instruction prefixed with `"custom:"` |

**Action Values** (verified from `improve-email-content-stream-send-textbox/route.ts` and `cheerify-menu.tsx`):

| Action | Description | Frontend Label | Frontend Instruction |
|--------|-------------|---------------|---------------------|
| `shorten` | Make the email 30-40% shorter while keeping all key points. Remove redundancy | "Make Shorter" (Scissors icon) | "Make this email 30-40% shorter while keeping ALL key points. Remove redundancy and be more concise. Copy the same format and sender name." |
| `expand` | Add more detail and context, making the email 30-40% longer | "Add Detail" (FileText icon) | "Add more detail and context to this email. Expand on key points and add relevant information. Make it 30-40% longer. Copy the same sender name." |
| `friendly` | Adjust to a friendlier, warmer, conversational tone with genuine enthusiasm | "More Friendly" (Smile icon) | "Make this email more casual, friendly, and warm. Use conversational language and show genuine enthusiasm. Copy the same sender name." |
| `professional` | Adjust to a more formal, business-appropriate tone | "More Formal" (Briefcase icon) | "Make this email more formal and professional. Use business language and maintain a respectful, corporate tone. Copy the same sender name." |
| `casual` | Adjust to a relaxed, everyday tone with contractions | "More Casual" (Coffee icon) | "Make this email more casual and relaxed. Use everyday language, contractions, and a laid-back tone while remaining professional. Copy the same sender name." |
| `custom:[instruction]` | Apply a custom user instruction | User types in "How should I revise this?" input (Wand2 icon) | The user's exact instruction text |

**Parameter Validation Rules**:
- `content` is required and must be non-empty
- `action` must be one of the 5 preset values or start with `"custom:"`
- For custom actions: the instruction text after `"custom:"` must be non-empty

**Return Schema**:

```json
{
  "improved_content": "string — The improved email text. Complete replacement text, not a diff"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Missing content | ToolError: "Content is required" | N/A |
| Missing or invalid action | ToolError: "Invalid action" | N/A |
| AI generation failure | ToolError: "Failed to improve email content" | N/A |

**Implementation Notes**:
- The CE implements this natively using Claude (not calling the frontend's OpenAI endpoint)
- The frontend uses GPT-4.1-mini with temperature 0.7 and a system prompt focused on influencer outreach email editing
- The frontend has 3 variants of this route: non-streaming (gpt-4-1106-preview), streaming (GPT-4.1-mini with merge tag preservation), and streaming for the send textbox (GPT-4.1-mini basic). The CE should implement the basic version
- The frontend also tracks custom instructions in `campaign_rule_suggestion_analytics` for analytics — the CE version does not need to replicate this

**Related Frontend Features NOT Exposed as Separate CE Tools**:
- **Edit classification** (`POST /api/classify-edit`): Analyzes whether a manual edit should be offered as a campaign rule. Uses OpenAI to classify the edit and counts pending drafts in the same campaign. The CE agent can provide similar functionality conversationally
- **Rule suggestion** (`POST /api/rules-suggestion`): Generates 1-3 rule suggestions based on edit patterns. Uses a mapping of Cheerify actions to hardcoded rule text (`CHEERIFY_RULE_MAPPINGS` in `lib/cheerify-rule-mappings.ts`). For pure Cheerify edits, returns predefined rules; for mixed operations, uses GPT-4.1 with the conversation thread as context. The CE agent can suggest rules conversationally when it observes repeated edit patterns
- **Cheerify Rule Mappings**: `shorten` → "Keep email responses concise and under 150 words...", `expand` → "Provide comprehensive details and context...", `friendly` → "Use warm, casual language with conversational tone...", `professional` → "Maintain formal business language...", `casual` → "Adopt relaxed, conversational language...", `custom` → "Apply specific user feedback and preferences..."

**Example Request**:
```
cheerful_improve_email_content(
  content="Hi Sarah, I wanted to reach out to you regarding a potential collaboration opportunity with our brand BrandX. We have been following your content creation journey for some time now and we believe that your aesthetic and audience alignment would make for an excellent partnership. We would like to discuss the possibility of sending you some of our Spring 2026 collection items for you to feature in your content.",
  action="shorten"
)
```

**Example Response**:
```json
{
  "improved_content": "Hi Sarah,\n\nWe love your content and think you'd be a great fit for BrandX! We'd love to send you pieces from our Spring 2026 collection to feature.\n\nInterested? Let me know and I'll share more details.\n\nBest,\n[sender name]"
}
```

**Slack Formatting Notes**:
- Show the improved text in a quote block
- Ask the user if they want to: (1) apply this to the draft, (2) try a different action, (3) provide custom instructions
- If the user requests multiple improvements in sequence, track the operations for potential rule suggestion

**Edge Cases**:
- Very short content (1-2 words): The AI may expand even for "shorten" action, or return the content unchanged
- Content with merge tags (`{product_name}`, `{name}`, etc.): The frontend's streaming variant preserves merge tags. The CE implementation should also preserve any `{placeholder}` patterns
- Custom instruction contradicts content: The AI follows the instruction as best it can
- Empty improved_content in response: Should not happen — treat as an error

---

## Thread Summary

### `cheerful_get_thread_summary`

**Status**: NEW — full OpenAPI-level spec

**Purpose**: Get an AI-generated summary of an email thread conversation. Summarizes the conversation stage, key topics, and relationship/tone between parties.

**Maps to**: CE-native implementation (no backend service route). The backend has a `ThreadSummarizer` class (`services/ai/thread_summarizer.py`) that is used internally for RAG context — it is NOT exposed as an API endpoint. The CE implements this by: (1) fetching the thread via `cheerful_get_thread`, then (2) summarizing using its own Claude instance.

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated (the underlying `cheerful_get_thread` call enforces access control).

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| thread_id | string | yes | — | Thread ID (Gmail hex or SMTP angle-bracket format) |

**Parameter Validation Rules**:
- `thread_id` must be a non-empty string
- Thread must exist and be accessible to the user (enforced by the underlying `cheerful_get_thread` call)

**Return Schema**:

```json
{
  "summary": "string — AI-generated summary in 1-3 sentences. Covers conversation stage (initial outreach, negotiation, follow-up, etc.), key topics (campaign details, payment, content submission, etc.), and relationship/tone between parties"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Thread not found | ToolError: "Thread not found" (from underlying cheerful_get_thread) | 404 |
| Thread has no messages | ToolError: "Thread has no messages to summarize" | N/A |
| AI generation failure | ToolError: "Failed to generate thread summary" | N/A |

**Implementation Details**:
- The backend's `ThreadSummarizer` uses Claude Haiku (claude-haiku-4-5-20251001) with max_tokens=200
- Its prompt focuses on: conversation stage, key topics discussed, relationship/tone between parties
- The CE can replicate this behavior or use a richer summarization since it has access to Claude directly
- The backend class has both single-thread `summarize()` and batch `summarize_batch()` methods — the CE tool implements single-thread only
- No caching is implemented — each call generates a fresh summary

**Example Request**:
```
cheerful_get_thread_summary(thread_id="18f3a2b4c5d6e7f8")
```

**Example Response**:
```json
{
  "summary": "This is a follow-up conversation about a gifting collaboration. The brand sent an initial outreach, and the creator responded positively asking about product sizing. The tone is friendly and enthusiastic, with the creator showing genuine interest in the partnership."
}
```

**Slack Formatting Notes**:
- Present the summary directly in the conversation
- If the user asks for more detail, offer to show the full thread via `cheerful_get_thread`

**Edge Cases**:
- Thread with only one message: Summary describes the single message's intent and tone
- Very long thread (50+ messages): The backend's `ThreadSummarizer` takes raw thread context as input. The CE should truncate to the last N messages (e.g., last 10) to fit within context limits
- Thread with no text content (only attachments): Summary notes that the conversation is primarily attachment-based
- SMTP thread: Fully supported via the underlying `cheerful_get_thread` call

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

> Routes 20-21 (`cheerful_improve_email_content`, `cheerful_get_thread_summary`) are implemented CE-natively rather than via backend service routes.

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

### Key Corrections from Wave 2 Skeletons (discovered during source code verification)

1. **Draft auth is owner-only, NOT "owner or assigned team member"**: The actual code in `draft.py` only checks `thread_state.user_id != user_id` — there is no `CampaignMemberAssignmentRepository` check. Team members cannot access draft endpoints.
2. **`DraftCreateRequest.draft_subject` and `draft_body_text` are REQUIRED strings**: The Wave 2 skeleton incorrectly listed these as `no | null`. The Pydantic model defines them as `str` (not `Optional[str]`), making them mandatory.
3. **400 "State ID doesn't match thread" error**: Not documented in the Wave 2 skeleton. The backend validates that the provided `gmail_thread_state_id` actually belongs to the thread specified in the URL path.
4. **Email send uses first recipient only**: `send_via_gmail()` and `send_via_smtp()` both send to `request.to[0]` only, not to all recipients in the `to` list. CC is passed through.
5. **Thread summary has NO backend API endpoint**: The `ThreadSummarizer` is an internal service class for RAG context, not an API route. The CE must implement summarization natively.
6. **AI email improvement is frontend-only**: The `improve-email-content` routes are Next.js API routes using OpenAI, not backend endpoints. The CE implements this natively.
