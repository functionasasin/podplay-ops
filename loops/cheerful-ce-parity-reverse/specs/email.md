# Email Domain — Tool Specifications

**Domain**: Email
**Spec file**: `specs/email.md`
**Wave 2 status**: Tool design complete
**Wave 3 status**: ALL 24 tools fully specified (w3-email-threads: 7/24 tools; w3-email-drafts: remaining 17/24 tools)

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

**Purpose**: Get the current email draft for a thread. Returns either the user-edited (human) draft or the LLM-generated draft, with human drafts taking priority. Returns 404 if no draft exists yet.

**Maps to**: `GET /api/service/threads/{thread_id}/draft` (new service route needed; verified main route: `GET /threads/{gmail_thread_id}/draft` in `route/draft.py`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: **owner-only** — verified in source: `thread_state.user_id != user_id` raises 403. Team members cannot read drafts for threads they didn't create.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| thread_id | string | yes | — | Thread ID. Gmail threads: bare hex string (e.g., `18f3a2b4c5d6e7f8`). SMTP threads: angle-bracket Message-ID format (e.g., `<abc123@mail.domain.com>`). Auto-detected via `_is_smtp_thread_id()` which checks for `<` prefix and `>` suffix |

**Parameter Validation Rules**:
- `thread_id` must correspond to an existing thread state in the DB — 404 if not found
- Thread state must be owned by the resolved user — 403 if `thread_state.user_id != user_id`

**Return Schema**:
```json
{
  "gmail_thread_state_id": "uuid — Current thread state UUID. MUST be passed back to create/update operations as version anchor to prevent race conditions",
  "internal_date": "datetime (ISO 8601) — Timestamp of the latest message in this thread state",
  "draft_subject": "string | null — Subject line of the draft",
  "draft_body_text": "string | null — Plain text body of the draft",
  "source": "string — 'human' if this is a user-edited draft (from gmail_thread_ui_draft table), 'llm' if AI-generated (from gmail_thread_llm_draft table). Human drafts always take precedence.",
  "alternative_drafts": "array | null — Only present when source='llm'. Array of {draft_subject: string|null, draft_body_text: string|null} objects. Null for human drafts. Null for LLM drafts that have no alternatives."
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Thread not found (no state exists) | HTTPException: "Thread not found" | 404 |
| User does not own thread | HTTPException: "Not authorized" | 403 |
| No draft exists for latest thread state | HTTPException: "No draft found" | 404 |

**Priority Logic** (from source `draft.py`):
1. Fetch latest thread state for `thread_id` (dispatches to Gmail or SMTP repo based on ID format)
2. Check `gmail_thread_ui_draft` table for a human draft on that state → return if found with `source="human"`
3. Check `gmail_thread_llm_draft` table for an AI draft on that state → return if found with `source="llm"`
4. Neither found → raise 404 "No draft found"

**Example Request**:
```
cheerful_get_thread_draft(thread_id="18f3a2b4c5d6e7f8")
```

**Example Response (human draft)**:
```json
{
  "gmail_thread_state_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "internal_date": "2026-01-15T14:23:00Z",
  "draft_subject": "Re: Partnership Opportunity",
  "draft_body_text": "Hi Sarah,\n\nThank you for your interest! We'd love to send you our winter collection to review. I'll DM you our address form shortly.\n\nBest,\nAlex",
  "source": "human",
  "alternative_drafts": null
}
```

**Example Response (LLM draft with alternatives)**:
```json
{
  "gmail_thread_state_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "internal_date": "2026-01-15T14:23:00Z",
  "draft_subject": "Re: Your Winter Collection Inquiry",
  "draft_body_text": "Hi Sarah,\n\nThank you so much for reaching out! We'd love to collaborate and gift you our new winter line.\n\nWarmly,\nAlex",
  "source": "llm",
  "alternative_drafts": [
    {
      "draft_subject": "Re: Collaboration Follow-up",
      "draft_body_text": "Hi Sarah,\n\nGreat to hear from you! Our winter collection would be perfect for your audience. Would love to send some pieces your way.\n\nBest,\nAlex"
    }
  ]
}
```

**Slack Formatting Notes**:
- Prefix with "🤖 AI draft:" if `source='llm'`, "📝 Your draft:" if `source='human'`
- Show draft body in a quoted block (using `>` prefix in Slack markdown)
- If `alternative_drafts` is non-null and non-empty: append "There are N alternative drafts available. Reply 'show alternatives' to see them."
- Show `internal_date` as relative time: "Thread last updated 2 hours ago"
- Show `draft_subject` only if it differs from the known thread subject

**Edge Cases**:
- SMTP thread: dispatch to `SmtpThreadStateRepository` + `get_by_smtp_thread_state_id_optional()` — logic otherwise identical
- LLM draft with no alternatives: `alternative_drafts` is null (not `[]`)
- Thread is in `READY_FOR_RESPONSE_DRAFT` status: LLM hasn't run yet → 404 "No draft found" is expected
- Thread has a human draft from a previous state AND LLM draft for current state: only the LATEST state is consulted — the human draft from the old state is ignored

---

### `cheerful_create_thread_draft`

**Status**: NEW

**Purpose**: Create a new human email draft for a thread. Anchored to a specific thread state to prevent race conditions when new messages arrive. Uses upsert semantics — if a human draft already exists for this state, it is overwritten (last write wins).

**Maps to**: `POST /api/service/threads/{thread_id}/draft` (new service route needed; verified main route: `POST /threads/{gmail_thread_id}/draft` in `route/draft.py`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: **owner-only** — verified in source: `thread_state.user_id != user_id` raises 403.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| thread_id | string | yes | — | Thread ID (Gmail hex or SMTP angle-bracket format) |
| gmail_thread_state_id | uuid | yes | — | Thread state UUID used as version anchor. CRITICAL: obtain this from the `gmail_thread_state_id` field of `cheerful_get_thread_draft` or `cheerful_list_threads` response. If a new message arrives, this ID becomes stale → triggers 409 |
| draft_subject | string | yes | — | Email subject line. Required (use empty string `""` to create a draft with no subject) |
| draft_body_text | string | yes | — | Email body as plain text. Required (use empty string `""` to create a draft with no body) |

**Parameter Validation Rules**:
- `gmail_thread_state_id` must match a real state record for `thread_id` — if state not found: 409 with latest state info
- `gmail_thread_state_id` must belong to `thread_id` — if mismatch: 400 "State ID doesn't match thread"
- Thread state must be owned by resolved user — if not: 403 "Not authorized"

**Return Schema**: Same as `cheerful_get_thread_draft`. `source` is always `"human"`. `alternative_drafts` is always `null`.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| User does not own thread state | HTTPException: "Not authorized" | 403 |
| State ID not found (race: new message arrived) | HTTPException 409: `{"error": "version_mismatch", "message": "Thread state updated. Please refresh.", "latest_gmail_thread_state_id": "<uuid or null>", "latest_internal_date": "<ISO datetime or null>"}` | 409 |
| State ID doesn't match thread_id | HTTPException: "State ID doesn't match thread" | 400 |

**Side Effects**:
- Stores draft in `gmail_thread_ui_draft` table with upsert semantics (keyed on state_id — concurrent edits on same state use last-write-wins)
- Does NOT delete the LLM draft from `gmail_thread_llm_draft` — both coexist, but `cheerful_get_thread_draft` always returns human draft first

**Example Request**:
```
cheerful_create_thread_draft(
  thread_id="18f3a2b4c5d6e7f8",
  gmail_thread_state_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  draft_subject="Re: Partnership Opportunity",
  draft_body_text="Hi Sarah,\n\nThanks for reaching out! We'd love to send you our new collection to review. I'll share our address form shortly.\n\nBest,\nAlex"
)
```

**Example Response**:
```json
{
  "gmail_thread_state_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "internal_date": "2026-01-15T14:23:00Z",
  "draft_subject": "Re: Partnership Opportunity",
  "draft_body_text": "Hi Sarah,\n\nThanks for reaching out! We'd love to send you our new collection to review. I'll share our address form shortly.\n\nBest,\nAlex",
  "source": "human",
  "alternative_drafts": null
}
```

**Example 409 Response Body**:
```json
{
  "error": "version_mismatch",
  "message": "Thread state updated. Please refresh.",
  "latest_gmail_thread_state_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "latest_internal_date": "2026-01-15T15:45:00Z"
}
```

**Slack Formatting Notes**:
- On success: "✅ Draft saved. Preview:\n> [first 200 chars of draft_body_text]"
- On 409: "⚠️ A new message arrived on this thread since you last looked. Refreshing state and retrying..." — then auto-retry using `latest_gmail_thread_state_id` from error response
- If `latest_gmail_thread_state_id` is null in 409 (thread deleted): "⚠️ Thread no longer exists."

**Edge Cases**:
- SMTP thread: `gmail_thread_state_id` parameter maps to `smtp_thread_state_id` internally; `gmail_account_id` lookup falls back to `smtp_account_id`; tool parameter name is unchanged
- `latest_gmail_thread_state_id` in 409 may be null if no thread state exists at all (thread deleted)
- If creating when only an LLM draft exists: human draft is stored separately; LLM draft remains but is shadowed

---

### `cheerful_update_thread_draft`

**Status**: NEW

**Purpose**: Update an existing email draft with partial field changes. Omitted fields retain their current values by merging with the existing draft. Uses the same version-anchoring mechanism as create.

**Maps to**: `PUT /api/service/threads/{thread_id}/draft` (new service route needed; verified main route: `PUT /threads/{gmail_thread_id}/draft` in `route/draft.py`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: **owner-only** — verified from source: `thread_state.user_id != user_id` raises 403.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| thread_id | string | yes | — | Thread ID (Gmail hex or SMTP angle-bracket format) |
| gmail_thread_state_id | uuid | yes | — | Thread state UUID (version anchor — same semantics as create) |
| draft_subject | string | no | — | New subject. Omit to retain existing subject. Provide empty string `""` to clear subject |
| draft_body_text | string | no | — | New body text. Omit to retain existing body. Provide empty string `""` to clear body |

**Parameter Validation Rules**:
- Same race condition validation as `cheerful_create_thread_draft` (state must exist and match thread)
- Thread state must be owned by the resolved user — 403 if not

**Merge Logic** (from source `route/draft.py:257-266`):
- Reads existing `gmail_thread_ui_draft` for this `gmail_thread_state_id`
- For `draft_subject`: if provided (non-None) → use provided value; if omitted (None) → use existing subject (or `""` if no draft)
- For `draft_body_text`: if provided (non-None) → use provided value; if omitted (None) → use existing body (or `""` if no draft)
- Result is upserted as a human draft (same upsert logic as create)

**Return Schema**: Same as `cheerful_get_thread_draft`. `source` is always `"human"`. `alternative_drafts` is always `null`.

**Error Responses**: Same as `cheerful_create_thread_draft` — see that section for the full error table including 409 version_mismatch format.

**Side Effects**: If the thread only had an LLM draft (no human draft), this update creates a new human draft with the provided values; the LLM draft remains in the database but is now shadowed.

**Example Request** (update body only, keep existing subject):
```
cheerful_update_thread_draft(
  thread_id="18f3a2b4c5d6e7f8",
  gmail_thread_state_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  draft_body_text="Hi Sarah,\n\nLove your content! We'd love to gift you our winter collection — would that work for you?\n\nWarmly,\nAlex"
)
```

**Example Response** (subject retained from existing draft):
```json
{
  "gmail_thread_state_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "internal_date": "2026-01-15T14:23:00Z",
  "draft_subject": "Re: Partnership Opportunity",
  "draft_body_text": "Hi Sarah,\n\nLove your content! We'd love to gift you our winter collection — would that work for you?\n\nWarmly,\nAlex",
  "source": "human",
  "alternative_drafts": null
}
```

**Slack Formatting Notes**:
- On success: "✅ Draft updated. Current version:\n> [first 200 chars of body]"
- Same 409 auto-retry logic as `cheerful_create_thread_draft`
- If only subject was updated: "✅ Subject updated to: [new subject]"

**Edge Cases**:
- Providing `draft_subject=null` explicitly (not omitting it): behavior is same as providing `None` in Python — treated as "omit" (retain existing). This is because `DraftUpdateRequest` has `draft_subject: str | None = None`.
- If no existing draft for state: merge reads empty strings as fallbacks, so the result is the provided values or `""` for unprovided fields
- After an update, if the user then re-fetches via `cheerful_get_thread_draft`, the result will always have `source="human"` regardless of whether an LLM draft also exists

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

**Parameter Validation Rules**:
- `to` must contain at least one email address: error `"At least one recipient is required"` (422)
- At least one of `body_html` or `body_text` must be provided: error `"Either body_html or body_text must be provided"` (validated in `model_post_init`)
- `account_email` must match an existing Gmail or SMTP account owned by (or accessible to) the user

**Return Schema**:
```json
{
  "message_id": "string — The Gmail/SMTP Message-ID of the sent message. For Gmail this is the thread_id; for SMTP it is the SMTP message_id_header",
  "thread_id": "string — The Gmail thread ID or SMTP thread ID this message belongs to. For new emails: same as message_id. For replies: the original thread_id",
  "sent_at": "datetime (ISO 8601) — Timestamp when the email was sent (UTC)"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| `to` is empty | "At least one recipient is required" | 422 |
| Neither body_html nor body_text provided | "Either body_html or body_text must be provided" | 422 |
| Account not found for account_email | "Account not found: {account_email}" | 404 |
| User doesn't own Gmail account and not assigned to campaign | "Not authorized to send from this account" | 403 |
| User not assigned to thread's campaign | "Not authorized to send on this thread" | 403 |
| Gmail/SMTP send failure | "Failed to send email" | 500 |

**Permission Model** (from source `route/email.py`):
- **Account owner**: no additional checks — can send freely
- **Team member via campaign assignment**: must pass both `can_send_via_campaign_assignment(user_id, account_id)` AND (if `thread_id` provided) `can_access_thread(user_id, thread_id)` — otherwise 403

**Side Effects**:
- If `gmail_thread_state_id` provided: updates that Gmail thread state to `NOT_LATEST` status (prevents stale automated follow-up scheduling)
- If `smtp_thread_state_id` provided: updates that SMTP thread state to `NOT_LATEST` status
- Gmail sync will detect the outbound message → creates a fresh `GmailThreadState`
- The `ThreadProcessingCoordinator` workflow handles `WAITING_FOR_INBOUND` transition for the new state

**Example Request** (reply to existing Gmail thread):
```
cheerful_send_email(
  account_email="alex@brand.com",
  to=["sarah@creator.com"],
  subject="Re: Partnership Opportunity",
  body_text="Hi Sarah,\n\nExcited to work together! Here's the address form: [link]\n\nBest,\nAlex",
  thread_id="18f3a2b4c5d6e7f8",
  in_reply_to="<abc123@mail.gmail.com>",
  references="<abc123@mail.gmail.com>",
  gmail_thread_state_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
)
```

**Example Response**:
```json
{
  "message_id": "18f3a2b4c5d6e7f8",
  "thread_id": "18f3a2b4c5d6e7f8",
  "sent_at": "2026-01-15T15:30:00Z"
}
```

**Slack Formatting Notes**:
- On success: "✅ Email sent to sarah@creator.com from alex@brand.com at 3:30 PM UTC\nSubject: Re: Partnership Opportunity"
- If `thread_id` provided: "📧 Reply sent in thread"
- If new email (no `thread_id`): "📧 New email sent"

**Edge Cases**:
- Gmail send: display name from SendAs settings is automatically applied (fetched via `service.list_send_as()`)
- SMTP send: display_name from `UserSmtpAccount.display_name` is used
- For SMTP threads, `thread_id` should be the SMTP email_thread_id (angle-bracket format); if not provided for a reply, thread is treated as a new email

---

## Scheduled Email Dispatch

### `cheerful_schedule_email`

**Status**: NEW

**Purpose**: Schedule an email to be sent at a specific future time. Supports timezone-aware scheduling. Verifies account ownership before creating the dispatch queue entry.

**Maps to**: `POST /api/service/emails/scheduled` (new service route needed; verified main route: `POST /emails/scheduled` in `route/email_dispatch.py`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: **owner-only** — user must own the Gmail or SMTP account specified (verified via DB lookup with `user_id` match).

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| gmail_account_id | uuid | no | — | Gmail account UUID to send from. Mutually exclusive with `smtp_account_id` — exactly one required |
| smtp_account_id | uuid | no | — | SMTP account UUID to send from. Mutually exclusive with `gmail_account_id` — exactly one required |
| recipient_email | string (EmailStr) | yes | — | Recipient email address. Validated as valid email format |
| subject | string | yes | — | Email subject line |
| dispatch_at | datetime | yes | — | Scheduled send time. Must be timezone-aware (include UTC offset or Z suffix). Must be in the future relative to UTC now |
| recipient_name | string | no | null | Recipient display name for To: header |
| cc_emails | string[] (EmailStr[]) | no | null | CC email addresses. Each validated as valid email |
| bcc_emails | string[] (EmailStr[]) | no | null | BCC email addresses. Each validated as valid email |
| body_text | string | no | null | Plain text email body. At least one of `body_text` or `body_html` required |
| body_html | string | no | null | HTML email body. At least one of `body_text` or `body_html` required |
| in_reply_to_message_id | string | no | null | Value of the Message-ID header of the email being replied to (for threading) |
| references_header | string | no | null | Full References header string for email threading |
| gmail_thread_id | string | no | null | Gmail thread ID for reply threading (ensures Gmail groups messages in the same thread) |
| user_timezone | string | no | `"UTC"` | IANA timezone string for `dispatch_at` interpretation (e.g., `"America/New_York"`, `"Europe/London"`). Validated via `ZoneInfo(v)` |

**Parameter Validation Rules**:
- Exactly one of `gmail_account_id` or `smtp_account_id` must be provided — error: `"Exactly one of gmail_account_id or smtp_account_id is required"` (400)
- At least one of `body_text` or `body_html` must be provided — error: `"At least one of body_text or body_html is required"` (422)
- `dispatch_at` must be timezone-aware — error: `"dispatch_at must be timezone-aware"` (422)
- `dispatch_at` must be strictly in the future (`> datetime.now(UTC)`) — error: `"dispatch_at must be in the future"` (422)
- `user_timezone` must be a valid IANA timezone string — error: `"Invalid timezone: {value}"` (422)
- Gmail or SMTP account must exist AND be owned by the user — error: `"Gmail account not found or not owned by user"` or `"SMTP account not found or not owned by user"` (403)

**Return Schema**:
```json
{
  "id": "uuid — Dispatch queue entry ID (use for cancel/reschedule operations)",
  "dispatch_at": "datetime (ISO 8601) — Scheduled send time as stored",
  "status": "string — Always 'pending' on creation"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Both or neither account_id provided | "Exactly one of gmail_account_id or smtp_account_id is required" | 400 |
| Neither body_text nor body_html | "At least one of body_text or body_html is required" | 422 |
| dispatch_at is not timezone-aware | "dispatch_at must be timezone-aware" | 422 |
| dispatch_at is in the past | "dispatch_at must be in the future" | 422 |
| Invalid user_timezone | "Invalid timezone: {value}" | 422 |
| Gmail account not found or not owned | "Gmail account not found or not owned by user" | 403 |
| SMTP account not found or not owned | "SMTP account not found or not owned by user" | 403 |

**Example Request**:
```
cheerful_schedule_email(
  gmail_account_id="c3d4e5f6-a7b8-9012-cdef-g12345678901",
  recipient_email="sarah@creator.com",
  subject="Following up on our collab",
  body_text="Hi Sarah,\n\nJust checking in — did you get a chance to try the products?\n\nBest,\nAlex",
  dispatch_at="2026-01-20T09:00:00-05:00",
  user_timezone="America/New_York",
  gmail_thread_id="18f3a2b4c5d6e7f8",
  in_reply_to_message_id="<abc123@mail.gmail.com>"
)
```

**Example Response**:
```json
{
  "id": "d4e5f6a7-b8c9-0123-def0-g12345678902",
  "dispatch_at": "2026-01-20T14:00:00Z",
  "status": "pending"
}
```

**Slack Formatting Notes**:
- On success: "📅 Email to sarah@creator.com scheduled for January 20 at 9:00 AM Eastern (2:00 PM UTC)"
- Include the dispatch `id` in case the user wants to cancel: "(ID: d4e5f6a7... — say 'cancel' to cancel this)"
- Convert `dispatch_at` from UTC to user's local time for display using `user_timezone`

**Edge Cases**:
- `dispatch_at` at exactly `datetime.now(UTC)`: rejected as not strictly in the future
- Email system polls the `email_dispatch_queue` table and dispatches when `dispatch_at` is reached — typically within 1 minute

---

### `cheerful_list_scheduled_emails`

**Status**: NEW

**Purpose**: List all scheduled (pending) emails for the current user. Only returns emails with `status="pending"` — sent, failed, and cancelled dispatches are excluded.

**Maps to**: `GET /api/service/emails/scheduled` (new service route needed; verified main route: `GET /emails/scheduled` in `route/email_dispatch.py`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated (user sees only their own scheduled emails).

**Parameters** (user-facing — `user_id` is injected, not listed here): None.

**Return Schema**:
```json
{
  "emails": [
    {
      "id": "uuid — Dispatch queue entry ID (use for cancel/reschedule)",
      "dispatch_at": "datetime (ISO 8601) — Scheduled send time",
      "status": "string — 'pending' (only pending emails are returned by this endpoint)",
      "recipient_email": "string | null — Recipient email address",
      "subject": "string | null — Email subject line"
    }
  ]
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |

**Example Request**:
```
cheerful_list_scheduled_emails()
```

**Example Response**:
```json
{
  "emails": [
    {
      "id": "d4e5f6a7-b8c9-0123-def0-g12345678902",
      "dispatch_at": "2026-01-20T14:00:00Z",
      "status": "pending",
      "recipient_email": "sarah@creator.com",
      "subject": "Following up on our collab"
    },
    {
      "id": "e5f6a7b8-c9d0-1234-ef01-h23456789012",
      "dispatch_at": "2026-01-22T16:00:00Z",
      "status": "pending",
      "recipient_email": "mike@influencer.com",
      "subject": "Partnership opportunity"
    }
  ]
}
```

**Slack Formatting Notes**:
- Present as a numbered list: "📅 Scheduled emails:\n1. sarah@creator.com — 'Following up...' — Jan 20 at 9 AM ET\n2. mike@influencer.com — 'Partnership...' — Jan 22 at 11 AM ET"
- If empty: "No scheduled emails pending."
- Note: only `pending` emails are shown — previously sent/cancelled dispatches are not listed

---

### `cheerful_cancel_scheduled_email`

**Status**: NEW

**Purpose**: Cancel a pending scheduled email. Only emails in `"pending"` status can be cancelled. Includes race condition handling for emails being dispatched concurrently.

**Maps to**: `DELETE /api/service/emails/scheduled/{dispatch_id}` (new service route needed; verified main route: `DELETE /emails/scheduled/{dispatch_id}` in `route/email_dispatch.py`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: **owner-only** — verified: `dispatch.user_id != user_id` raises 403.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| dispatch_id | uuid | yes | — | Scheduled email dispatch ID (obtained from `cheerful_schedule_email` or `cheerful_list_scheduled_emails`) |

**Parameter Validation Rules**:
- `dispatch_id` must exist in the DB — 404 if not found
- Dispatch must be owned by the resolved user — 403 if not
- Dispatch must be in `"pending"` status — 409 if already sent, cancelled, processing, or failed

**Return Schema**:
```json
{
  "status": "string — 'cancelled'",
  "id": "string (uuid) — The cancelled dispatch ID"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Dispatch not found | "Scheduled email not found" | 404 |
| User does not own dispatch | "Not authorized to cancel this email" | 403 |
| Not in pending status | "Email has already been sent or cancelled" | 409 |
| Race condition (status changed between check and cancel) | "Email could not be cancelled (may have been sent)" | 409 |

**Example Request**:
```
cheerful_cancel_scheduled_email(dispatch_id="d4e5f6a7-b8c9-0123-def0-g12345678902")
```

**Example Response**:
```json
{
  "status": "cancelled",
  "id": "d4e5f6a7-b8c9-0123-def0-g12345678902"
}
```

**Slack Formatting Notes**:
- On success: "✅ Scheduled email to sarah@creator.com has been cancelled."
- On 409 race condition: "⚠️ Could not cancel — the email may have already been sent. Check your sent emails."

**Edge Cases**:
- Emails in `"processing"` status cannot be cancelled (dispatch worker has already picked it up)
- Emails in `"sent"`, `"failed"`, or `"cancelled"` status return 409 (not 404)

---

### `cheerful_reschedule_email`

**Status**: NEW

**Purpose**: Change the dispatch time of a pending scheduled email to a new future time. Includes race condition handling.

**Maps to**: `PATCH /api/service/emails/scheduled/{dispatch_id}/reschedule` (new service route needed; verified main route: `PATCH /emails/scheduled/{dispatch_id}/reschedule` in `route/email_dispatch.py`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: **owner-only** — verified: `dispatch.user_id != user_id` raises 403.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| dispatch_id | uuid | yes | — | Scheduled email dispatch ID |
| dispatch_at | datetime | yes | — | New scheduled send time. Must be timezone-aware. Must be strictly in the future relative to UTC now |

**Parameter Validation Rules**:
- `dispatch_id` must exist — 404 if not found
- Dispatch must be owned by user — 403 if not
- Dispatch must be in `"pending"` status — 409 if not
- `dispatch_at` must be timezone-aware — error: `"dispatch_at must be timezone-aware"` (422)
- `dispatch_at` must be in the future — error: `"dispatch_at must be in the future"` (422)

**Return Schema**:
```json
{
  "status": "string — 'rescheduled'",
  "id": "string (uuid) — The rescheduled dispatch ID",
  "dispatch_at": "string (ISO 8601 datetime) — New scheduled send time"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Dispatch not found | "Scheduled email not found" | 404 |
| User does not own dispatch | "Not authorized to reschedule this email" | 403 |
| Not in pending status | "Email has already been sent or cancelled" | 409 |
| Race condition | "Email could not be rescheduled (may have been sent)" | 409 |
| dispatch_at not timezone-aware | "dispatch_at must be timezone-aware" | 422 |
| dispatch_at in the past | "dispatch_at must be in the future" | 422 |

**Example Request**:
```
cheerful_reschedule_email(
  dispatch_id="d4e5f6a7-b8c9-0123-def0-g12345678902",
  dispatch_at="2026-01-21T14:00:00Z"
)
```

**Example Response**:
```json
{
  "status": "rescheduled",
  "id": "d4e5f6a7-b8c9-0123-def0-g12345678902",
  "dispatch_at": "2026-01-21T14:00:00+00:00"
}
```

**Slack Formatting Notes**:
- On success: "📅 Email rescheduled to January 21 at 2:00 PM UTC"

---

## Email Signatures

> **Cross-reference**: The campaigns domain (`specs/campaigns.md`) has 3 campaign-oriented signature tools (`cheerful_get_campaign_signature`, `cheerful_update_campaign_signature`, `cheerful_list_campaign_signatures`) that map to proposed campaign-specific service routes. This section covers the full CRUD via the actual `/email-signatures` backend routes (verified: `route/email_signature.py`), which serve both user-level and campaign-specific signatures.

> **Shared `EmailSignatureResponse` schema** (all GET/create/update operations return this structure):
> ```json
> {
>   "id": "uuid",
>   "user_id": "uuid — Owner of this signature",
>   "name": "string — Display name for this signature (1-255 chars)",
>   "content": "string — HTML signature content (1-10,000 chars; server-side sanitized via sanitize_signature_html())",
>   "is_default": "boolean — True if this is the user's default signature. Only one user-level signature can be default at a time. Always false for campaign signatures",
>   "campaign_id": "uuid | null — null for user-level signatures, UUID for campaign-specific signatures",
>   "campaign_name": "string | null — Campaign name, populated via JOIN when campaign_id is set. Null for user-level signatures",
>   "is_enabled": "boolean — For campaign signatures: if true, auto-appended to AI-generated outbound emails for this campaign. Always false for user-level signatures",
>   "created_at": "datetime (ISO 8601)",
>   "updated_at": "datetime (ISO 8601)"
> }
> ```

### `cheerful_list_email_signatures`

**Status**: NEW

**Purpose**: List all email signatures belonging to the current user. When `campaign_id` is provided, returns user-level signatures PLUS the specified campaign's signature (if it exists). When `campaign_id` is omitted, returns all user signatures (user-level and all campaign-specific ones).

**Maps to**: `GET /api/service/email-signatures` (new service route needed; verified main route: `GET /email-signatures` in `route/email_signature.py`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated (user sees only signatures they own).

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | no | null | When provided: returns user-level signatures + the signature for this specific campaign (uses `get_signatures_for_manual_reply(user_id, campaign_id)`). When omitted: returns ALL user signatures via `get_all_for_user(user_id)` |

**Parameter Validation Rules**: None beyond auth — if `campaign_id` is provided but user doesn't own it, the campaign signature simply won't be included.

**Return Schema**:
```json
{
  "signatures": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "string",
      "content": "string (HTML)",
      "is_default": "boolean",
      "campaign_id": "uuid | null",
      "campaign_name": "string | null",
      "is_enabled": "boolean",
      "created_at": "datetime",
      "updated_at": "datetime"
    }
  ]
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |

**Example Request**:
```
cheerful_list_email_signatures(campaign_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890")
```

**Example Response**:
```json
{
  "signatures": [
    {
      "id": "s1a2b3c4-d5e6-7890-abcd-ef1234567891",
      "user_id": "u1a2b3c4-d5e6-7890-abcd-ef1234567892",
      "name": "Default",
      "content": "<p>Best,<br>Alex<br>Brand Manager</p>",
      "is_default": true,
      "campaign_id": null,
      "campaign_name": null,
      "is_enabled": false,
      "created_at": "2026-01-01T10:00:00Z",
      "updated_at": "2026-01-10T15:00:00Z"
    },
    {
      "id": "s2a2b3c4-d5e6-7890-abcd-ef1234567893",
      "user_id": "u1a2b3c4-d5e6-7890-abcd-ef1234567892",
      "name": "Winter Campaign",
      "content": "<p>Warmly,<br>Alex | Winter Collection 2026</p>",
      "is_default": false,
      "campaign_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "campaign_name": "Winter Gifting 2026",
      "is_enabled": true,
      "created_at": "2026-01-05T12:00:00Z",
      "updated_at": "2026-01-05T12:00:00Z"
    }
  ]
}
```

**Slack Formatting Notes**:
- List each signature: "📝 [name] — [user-level | Campaign: campaign_name] — [default: ✓/✗] [auto-append: ✓/✗]"
- Highlight the default signature and any enabled campaign signatures

---

### `cheerful_get_email_signatures_for_reply`

**Status**: NEW

**Purpose**: Get the appropriate signatures for composing a reply — returns user-level signatures grouped separately from the campaign-specific signature. Designed for the reply composer.

**Maps to**: `GET /api/service/email-signatures/for-reply` (new service route needed; verified main route: `GET /email-signatures/for-reply` in `route/email_signature.py`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | no | null | When provided: returns user-level signatures + campaign-specific signature (if any). When omitted: returns only user-level signatures with `campaign_signature: null` |

**Return Schema**:
```json
{
  "user_signatures": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "string",
      "content": "string (HTML)",
      "is_default": "boolean",
      "campaign_id": "null — always null (these are user-level signatures)",
      "campaign_name": "null — always null",
      "is_enabled": "false — always false for user-level signatures",
      "created_at": "datetime",
      "updated_at": "datetime"
    }
  ],
  "campaign_signature": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "string",
    "content": "string (HTML)",
    "is_default": "false — always false for campaign signatures",
    "campaign_id": "uuid — the campaign this signature belongs to",
    "campaign_name": "string | null — campaign name",
    "is_enabled": "boolean",
    "created_at": "datetime",
    "updated_at": "datetime"
  }
}
```

> Note: `campaign_signature` is `null` if no campaign_id was provided, or if the campaign has no associated signature.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |

**Example Request**:
```
cheerful_get_email_signatures_for_reply(campaign_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890")
```

**Example Response**:
```json
{
  "user_signatures": [
    {
      "id": "s1a2b3c4-d5e6-7890-abcd-ef1234567891",
      "user_id": "u1a2b3c4-d5e6-7890-abcd-ef1234567892",
      "name": "Default",
      "content": "<p>Best,<br>Alex</p>",
      "is_default": true,
      "campaign_id": null,
      "campaign_name": null,
      "is_enabled": false,
      "created_at": "2026-01-01T10:00:00Z",
      "updated_at": "2026-01-10T15:00:00Z"
    }
  ],
  "campaign_signature": {
    "id": "s2a2b3c4-d5e6-7890-abcd-ef1234567893",
    "user_id": "u1a2b3c4-d5e6-7890-abcd-ef1234567892",
    "name": "Winter Campaign",
    "content": "<p>Warmly,<br>Alex | Winter Collection 2026</p>",
    "is_default": false,
    "campaign_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "campaign_name": "Winter Gifting 2026",
    "is_enabled": true,
    "created_at": "2026-01-05T12:00:00Z",
    "updated_at": "2026-01-05T12:00:00Z"
  }
}
```

**Slack Formatting Notes**:
- Suggest the recommended signature: campaign signature if it exists and is enabled, otherwise the default user signature
- "📝 Suggested signature: [name] — [preview of first 50 chars of content]"
- "N other signatures available. Say 'list signatures' to see all."

---

### `cheerful_create_email_signature`

**Status**: NEW

**Purpose**: Create a new email signature. Can be user-level (no `campaign_id`) or campaign-specific (with `campaign_id`). Content is automatically sanitized server-side.

**Maps to**: `POST /api/service/email-signatures` (new service route needed; verified main route: `POST /email-signatures` in `route/email_signature.py`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated for user-level signatures; **campaign owner-only** for campaign-specific signatures (checked: `campaign.user_id != user_id` returns 404 "Campaign not found" — intentionally opaque).

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| name | string | yes | — | Signature display name. Min 1 char, max 255 chars |
| content | string | yes | — | HTML signature content. Min 1 char, max 10,000 chars. Sanitized server-side via `sanitize_signature_html()` to strip unsafe tags/attributes |
| is_default | boolean | no | `false` | Set this as the default user-level signature. Ignored (forced to `false`) for campaign-specific signatures |
| campaign_id | uuid | no | `null` | Omit for user-level signature; provide to create a campaign-specific signature |
| is_enabled | boolean | no | `false` | For campaign-specific signatures: if `true`, auto-appended to AI-generated outbound campaign emails. Ignored for user-level signatures (forced to `false` in DB) |

**Parameter Validation Rules**:
- `name` must be 1-255 chars (Pydantic `Field(min_length=1, max_length=255)`)
- `content` must be 1-10,000 chars — if `> 10,000`: error `"Signature content exceeds maximum length of 10,000 characters"` (400, from `validate_signature_length()`)
- If `campaign_id` provided: campaign must exist and user must own it — error returns 404 "Campaign not found" (opaque 404 even for unauthorized access)

**Return Schema**: `EmailSignatureResponse` (see shared schema at top of Email Signatures section). HTTP 201 Created.

**Side Effects**:
- If `is_default=true` and this is a user-level signature (no `campaign_id`): calls `repo.clear_default_for_user(user_id)` to set `is_default=false` on all other user-level signatures first
- Content is sanitized via `sanitize_signature_html()` before storage (strips dangerous HTML)

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| `content` > 10,000 chars | "Signature content exceeds maximum length of 10,000 characters" | 400 |
| `campaign_id` provided but campaign not found or user doesn't own it | "Campaign not found" | 404 |

**Example Request** (campaign-specific, auto-append enabled):
```
cheerful_create_email_signature(
  name="Winter Campaign 2026",
  content="<p>Warmly,<br>Alex<br>Brand Manager | Winter Collection</p>",
  campaign_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  is_enabled=true
)
```

**Example Response**:
```json
{
  "id": "s3a2b3c4-d5e6-7890-abcd-ef1234567894",
  "user_id": "u1a2b3c4-d5e6-7890-abcd-ef1234567892",
  "name": "Winter Campaign 2026",
  "content": "<p>Warmly,<br>Alex<br>Brand Manager | Winter Collection</p>",
  "is_default": false,
  "campaign_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "campaign_name": "Winter Gifting 2026",
  "is_enabled": true,
  "created_at": "2026-01-15T10:00:00Z",
  "updated_at": "2026-01-15T10:00:00Z"
}
```

**Slack Formatting Notes**:
- On success: "✅ Signature '[name]' created. [Campaign-specific for: campaign_name | User-level default: ✓/✗]"

---

### `cheerful_get_email_signature`

**Status**: NEW

**Purpose**: Get a single email signature by ID.

**Maps to**: `GET /api/service/email-signatures/{signature_id}` (new service route needed; verified main route: `GET /email-signatures/{signature_id}` in `route/email_signature.py`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: **owner-only** — verified: `signature.user_id != user_id` raises 403.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| signature_id | uuid | yes | — | Signature UUID |

**Return Schema**: `EmailSignatureResponse` (see shared schema at top of Email Signatures section).

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Signature not found | "Signature not found" | 404 |
| User does not own signature | "Not authorized to access this signature" | 403 |

**Example Request**:
```
cheerful_get_email_signature(signature_id="s1a2b3c4-d5e6-7890-abcd-ef1234567891")
```

**Example Response**: (see `EmailSignatureResponse` shared schema above with realistic values)

---

### `cheerful_update_email_signature`

**Status**: NEW

**Purpose**: Update an existing email signature. Partial update — only provided fields are changed; omitted fields retain current values.

**Maps to**: `PATCH /api/service/email-signatures/{signature_id}` (new service route needed; verified main route: `PATCH /email-signatures/{signature_id}` in `route/email_signature.py`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: **owner-only** — verified: `signature.user_id != user_id` raises 403.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| signature_id | uuid | yes | — | Signature UUID |
| name | string | no | — | New display name. Min 1 char, max 255 chars. Omit to retain current |
| content | string | no | — | New HTML content. Min 1 char, max 10,000 chars. Sanitized via `sanitize_signature_html()`. Omit to retain current |
| is_default | boolean | no | — | Set/unset as default. Omit to retain current. Setting to `true` clears default on all other user-level signatures |
| is_enabled | boolean | no | — | Enable/disable auto-append for campaign signatures. Omit to retain current |

**Parameter Validation Rules**:
- `content` if provided must be 1-10,000 chars — error: `"Signature content exceeds maximum length"` (400)

**Return Schema**: `EmailSignatureResponse` (updated values). HTTP 200.

**Side Effects**:
- If `is_default=true`: calls `repo.clear_default_for_user(user_id)` before setting new default

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Signature not found | "Signature not found" | 404 |
| User does not own signature | "Not authorized to update this signature" | 403 |
| `content` > 10,000 chars | "Signature content exceeds maximum length" | 400 |

**Example Request**:
```
cheerful_update_email_signature(
  signature_id="s1a2b3c4-d5e6-7890-abcd-ef1234567891",
  content="<p>Best,<br>Alex<br>Head of Brand Partnerships</p>",
  is_default=true
)
```

**Example Response**: Updated `EmailSignatureResponse` with new content and `is_default: true`.

**Slack Formatting Notes**:
- On success: "✅ Signature '[name]' updated."
- If `is_default` was set to true: "✅ '[name]' is now your default signature."

---

### `cheerful_delete_email_signature`

**Status**: NEW

**Purpose**: Permanently delete an email signature. Cannot be undone.

**Maps to**: `DELETE /api/service/email-signatures/{signature_id}` (new service route needed; verified main route: `DELETE /email-signatures/{signature_id}` in `route/email_signature.py`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: **owner-only** — verified: `signature.user_id != user_id` raises 403.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| signature_id | uuid | yes | — | Signature UUID to delete |

**Return Schema**: HTTP 204 No Content (empty response body on success).

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Signature not found | "Signature not found" | 404 |
| User does not own signature | "Not authorized to delete this signature" | 403 |

**Example Request**:
```
cheerful_delete_email_signature(signature_id="s1a2b3c4-d5e6-7890-abcd-ef1234567891")
```

**Example Response**: HTTP 204 (no body).

**Slack Formatting Notes**:
- On success: "🗑️ Signature '[name]' deleted."
- Agent should confirm with the user before deleting: "Are you sure you want to delete the '[name]' signature? This cannot be undone."

**Edge Cases**:
- Deleting the default signature: no automatic reassignment of default — other signatures retain their `is_default=false` value
- Deleting a campaign signature while it's `is_enabled=true`: the signature is deleted; campaigns will no longer auto-append it

---

## Bulk Draft Edit

### `cheerful_bulk_edit_drafts`

**Status**: NEW

**Purpose**: Batch edit all AI-generated drafts in a campaign using a natural language instruction. Starts an async Temporal workflow that rewrites matching drafts. Only LLM-generated drafts are affected — human-edited drafts are skipped by default.

**Maps to**: `POST /api/service/bulk-draft-edit` (new service route needed; verified main route: `POST /bulk-draft-edit` in `route/bulk_draft_edit.py`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: **campaign owner-only** — verified: `campaign.user_id != user_id` raises 403.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign UUID to bulk-edit drafts for |
| edit_instruction | string | yes | — | Natural language instruction for rewriting drafts (e.g., `"make all drafts shorter and more casual"`, `"add urgency — mention limited stock"`) |
| exclude_thread_ids | string[] | no | `[]` | List of thread IDs to exclude from the bulk edit. Threads in this list are skipped |
| save_as_rule | boolean | no | `false` | If `true`, the `edit_instruction` is also saved as a permanent campaign rule for future AI draft generation |
| rule_text | string | no | `null` | Human-readable rule text to save when `save_as_rule=true`. If `null` when `save_as_rule=true`, the `edit_instruction` text is used as the rule |

**Parameter Validation Rules**:
- `campaign_id` must exist and be owned by the user — 404 "Campaign not found" if not found, 403 "Not authorized for this campaign" if not owned

**Return Schema**:
```json
{
  "workflow_id": "string — Temporal workflow ID (format: 'bulk-draft-edit-{campaign_id}-{timestamp}'). Not used for polling (no polling endpoint exists)",
  "message": "string — Always: 'Bulk draft edit started'"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Campaign not found | "Campaign not found" | 404 |
| User does not own campaign | "Not authorized for this campaign" | 403 |

**Side Effects**:
- Starts a Temporal `BulkDraftEditWorkflow` (5-minute execution timeout)
- The workflow iterates over all threads in the campaign that have LLM drafts (not human drafts) and applies `edit_instruction` via AI rewriting
- Threads in `exclude_thread_ids` are skipped
- If `save_as_rule=true`: appends the rule to `campaign.rules_for_llm` field (same format as existing rules)
- No polling endpoint exists — the workflow runs asynchronously. Fire-and-forget from the caller's perspective.

**Example Request**:
```
cheerful_bulk_edit_drafts(
  campaign_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  edit_instruction="Make all drafts shorter and end with a question to encourage a reply",
  save_as_rule=true,
  rule_text="Keep emails concise and end with an open question"
)
```

**Example Response**:
```json
{
  "workflow_id": "bulk-draft-edit-a1b2c3d4-e5f6-7890-abcd-ef1234567890-1705334400",
  "message": "Bulk draft edit started"
}
```

**Slack Formatting Notes**:
- "🔄 Bulk draft edit started for [campaign_name]. All AI-generated drafts will be rewritten with: '[edit_instruction]'"
- If `save_as_rule=true`: "📋 Rule also saved: '[rule_text]'"
- "This runs in the background — check back in a few minutes to see the updated drafts."
- No way to track progress or cancel once started

**Edge Cases**:
- Human-edited drafts (`source="human"`) are NOT affected — the bulk edit only rewrites LLM-generated drafts
- If all threads in the campaign have human drafts, the workflow runs but effectively makes no changes
- The 5-minute workflow timeout means campaigns with >100 threads may not complete all rewrites

---

## AI Email Improvement

### `cheerful_improve_email_content`

**Status**: NEW — **CE-native implementation** (verified: no backend endpoint exists)

**Purpose**: Apply AI-powered text improvements to email body content using predefined or custom instructions. Supports shortening, expanding, tone adjustment, and arbitrary custom instructions.

**Maps to**: **CE-native** — implemented using the CE's own AI model. The frontend uses `POST /api/improve-email-content-stream-send-textbox` (webapp Next.js route at `app/api/improve-email-content-stream-send-textbox/route.ts`) which calls OpenAI directly with SSE streaming. The CE tool implements the equivalent logic synchronously using its own Claude instance without streaming.

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| content | string | yes | — | The email body text to improve. Passed as plain text (HTML stripped before processing — the frontend converts HTML to plain text via `getTextContent()`) |
| action | string (enum or custom) | yes | — | Improvement type. One of the named actions: `"shorten"`, `"expand"`, `"friendly"`, `"professional"`, `"casual"`. Or a custom instruction prefixed with `"custom:"` (e.g., `"custom:add a call to action at the end"`) |
| subject | string | no | `""` | Email subject line for context (helps AI preserve subject relevance in improvements) |
| campaign_type | string | no | `"gifting"` | Campaign type for AI context. One of: `"gifting"`, `"paid_promotion"`. Affects AI system prompt context |
| campaign_goal | string | no | `""` | Campaign goal text for AI context |
| campaign_rules | string | no | `""` | Campaign rules (from `campaign.rules_for_llm`) for AI context — helps preserve merge tags and follow campaign guidelines |
| merge_tags | string[] | no | `[]` | List of merge tag headers (e.g., `["first_name", "product_name"]`). Used to preserve `{merge_tag}` placeholders in the improved text |

**Action Descriptions and Instructions** (exact text used as AI instructions, from source):
- `"shorten"` → `"Make this email 30-40% shorter while keeping ALL key points. Remove redundancy and be more concise. Copy the same format and sender name."`
- `"expand"` → `"Add more detail and context to this email. Expand on key points and add relevant information. Make it 30-40% longer. Copy the same sender name."`
- `"friendly"` → `"Make this email more casual, friendly, and warm. Use conversational language and show genuine enthusiasm. Copy the same sender name."`
- `"professional"` → `"Make this email more formal and professional. Use business language and maintain a respectful, corporate tone. Copy the same sender name."`
- `"casual"` → `"Make this email more casual and relaxed. Use everyday language, contractions, and a laid-back tone while remaining professional. Copy the same sender name."`
- `"custom:[instruction]"` → The text after `"custom:"` is used directly as the AI instruction

**Parameter Validation Rules**:
- `action` must be one of `"shorten"`, `"expand"`, `"friendly"`, `"professional"`, `"casual"`, or start with `"custom:"` — unknown actions default to "Improve this email to be more effective."
- `content` must be non-empty (empty content is a no-op — tool may refuse or return content unchanged)

**Return Schema**:
```json
{
  "improved_content": "string — The AI-improved email body text (plain text, not HTML). Merge tags are preserved exactly as they appeared in the original content (CE must enforce this). Never uses hyphens or em dashes. Ends with a simple closing without placeholder signatures."
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| AI model error | ToolError: "Failed to improve email content" | N/A (CE-internal) |

**CE Implementation Notes**:
- **AI critical rules** (must be enforced in CE implementation, from webapp source):
  1. MERGE TAG PRESERVATION: Extract all `{merge_tag}` patterns from `content`; they MUST appear verbatim in the output
  2. FORMATTING: Maintain paragraph structure with double newlines between paragraphs
  3. PLACEHOLDER RULES: Do NOT add `[Your Name]`, `[Company]`, or similar bracketed placeholders
  4. STYLE: NEVER use hyphens or em dashes. End with simple closings like "Best," or "Thanks,"
  5. OUTPUT FORMAT: Return ONLY the improved body text — no explanations, no JSON, no commentary
- The frontend proxies to an OpenAI endpoint (`gpt-4.1-mini`) with SSE streaming. CE uses Claude synchronously.
- Custom analytics tracking (saving to `campaign_rule_suggestion_analytics` table) is a frontend-only concern — CE does not implement this

**Related Webapp Routes** (not CE tools — context only):
- `POST /api/rules-suggestion` — After a user edits a draft, webapp suggests rules to add to the campaign. CE agents can replicate this by asking "Want to save this edit as a campaign rule?" after applying an improvement.
- `PUT /api/rules-suggestion` — Accepts and saves a rule suggestion to `campaign.rules_for_llm`. CE agents use `cheerful_update_campaign` for this instead.

**Example Request**:
```
cheerful_improve_email_content(
  content="Hi Sarah,\n\nWe would like to offer you a partnership opportunity with our brand. We sell skincare products. Please let us know if you are interested.\n\nBest,\nAlex",
  action="friendly",
  subject="Partnership Opportunity"
)
```

**Example Response**:
```json
{
  "improved_content": "Hi Sarah,\n\nI'd love to chat about partnering with us — we're a skincare brand and your content is such a perfect fit! Would you be open to hearing more?\n\nWarmly,\nAlex"
}
```

**Slack Formatting Notes**:
- Show the improved text in a code block or formatted quote
- Ask: "Does this look good? Reply 'apply' to save it as your draft, or 'undo' to revert."
- If the user has made multiple improvements in sequence: track the pre-improvement version so the agent can undo the last step
- After applying an improvement: offer "Want to save this style as a campaign rule so future drafts match? (e.g., 'Always use a warm, friendly tone')"

**Edge Cases**:
- `action="custom:some instruction"`: the CE splits on the first `:` to extract the instruction (`"some instruction"`)
- If the content contains HTML entities: strip HTML tags and decode entities before passing to AI
- If `merge_tags` is empty but content contains `{tags}`: CE should auto-detect `{lowercase_word}` patterns and instruct AI to preserve them

---

## Thread Summary

### `cheerful_get_thread_summary`

**Status**: NEW — **CE-native implementation** (verified: no backend endpoint exists; no webapp summary route for threads)

**Purpose**: Get an AI-generated summary of an email thread conversation. Summarizes the conversation context, key points, creator's tone/intent, and any next steps or decisions made. Implemented natively in the CE by fetching the thread and running Claude summarization.

**Maps to**: **CE-native** — no backend endpoint. The CE calls `cheerful_get_thread(thread_id)` internally to get all messages, then summarizes using its own Claude instance. (Note: `POST /api/campaigns/{id}/generate-summary` exists in webapp but is a campaign-level aggregate summary, not a thread summary — different tool.)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only (enforced via the internal `cheerful_get_thread` call which checks thread ownership).

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| thread_id | string | yes | — | Thread ID (Gmail hex or SMTP angle-bracket format) |

**Return Schema**:
```json
{
  "thread_id": "string — The thread ID that was summarized",
  "summary": "string — AI-generated summary of the thread. Plain text, 2-5 sentences. Covers: what was discussed, creator's interest level, any commitments made, what needs to happen next",
  "message_count": "integer — Number of messages in the thread that were summarized",
  "latest_message_date": "datetime (ISO 8601) | null — Timestamp of the most recent message in the thread"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Thread not found | Propagated from `cheerful_get_thread` — "Thread not found" | 404 |
| User does not own thread | Propagated from `cheerful_get_thread` — "Not authorized" | 403 |
| Thread has no messages | ToolError: "Thread has no messages to summarize" | N/A (CE-internal) |

**CE Implementation Notes**:
- Call `cheerful_get_thread(thread_id)` first to fetch messages with permission checks enforced
- Build a conversation text from all messages (direction, sender, date, body)
- Truncate individual message bodies to 1,500 chars to avoid token limits (same as webapp `formatThreadConversation()`)
- Strip quoted-reply headers (e.g., "On [date], [name] wrote:") from message bodies before summarizing
- Summarization prompt focus: creator's interest level (enthusiastic/neutral/declining), any explicit commitments or questions, what the sender's last action was, what next step is needed
- No caching required (the CE context window persists within a Slack conversation)

**Example Request**:
```
cheerful_get_thread_summary(thread_id="18f3a2b4c5d6e7f8")
```

**Example Response**:
```json
{
  "thread_id": "18f3a2b4c5d6e7f8",
  "summary": "You reached out to Sarah (sarah@creator.com) about your winter gifting campaign on Jan 10. She replied positively on Jan 12 saying she loves your brand and would be interested in receiving products. You sent her an address form on Jan 14 but haven't received a response yet. Next step: follow up on the address form.",
  "message_count": 3,
  "latest_message_date": "2026-01-14T16:00:00Z"
}
```

**Slack Formatting Notes**:
- Present summary as a short paragraph directly in the conversation
- Append the message count and last activity: "_(3 messages, last: Jan 14)_"
- If the summary indicates a next step, offer to take action: "Want me to draft a follow-up email?"

**Edge Cases**:
- Thread with a single outbound message and no replies: summary focuses on what was sent
- Very long threads (50+ messages): truncate to last 20 messages for summarization (most recent context is most relevant)
- SMTP threads: same behavior — `cheerful_get_thread` handles SMTP routing transparently

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
