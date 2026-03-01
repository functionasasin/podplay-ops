# Email Domain — Tool Specifications

**Domain**: Email
**Spec file**: `specs/email.md`
**Wave 2 status**: Tool design complete
**Wave 3 status**: Pending (full OpenAPI-level specs)

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

**Status**: EXISTS

**Purpose**: Full-text search within campaign email threads by query string.

**Maps to**: `GET /api/service/threads/search`

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated (searches only user's campaigns).

**Current parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign to search within |
| query | string | yes | — | Full-text search query |
| direction | enum | no | — | One of: "inbound", "outbound". Filter by message direction |
| limit | integer | no | 10 | Max results. Range: 1-50 |

**Returns**: Array of `ThreadSearchResult` objects (gmail_thread_id, snippet, subject, sender_email, latest_date, direction, campaign_id).

**Existing tool audit notes** (for Wave 3):
- Verify exact return schema against current service endpoint
- Check if search query supports operators (AND, OR, quotes)
- Security note from w1-search: service endpoint may lack user_id ownership validation — needs verification

---

### `cheerful_get_thread`

**Status**: EXISTS

**Purpose**: Fetch a full email thread with all messages, including sender/recipient details and body content.

**Maps to**: `GET /api/service/threads/{gmail_thread_id}`

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated (user must own the thread or be assigned to the campaign it belongs to).

**Current parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| gmail_thread_id | string | yes | — | Thread ID (Gmail hex or SMTP angle-bracket format) |

**Returns**: `ThreadDetailResponse` with thread metadata and array of `GmailMessageResponse` objects (id, gmail_message_id, gmail_thread_id, direction, sender_email, recipient_emails, cc_emails, subject, body_text, body_html, internal_date, labels).

**Existing tool audit notes** (for Wave 3):
- Current response may not include: thread status, flags (wants_paid, has_question, has_issue), draft info, attachment metadata
- Verify whether `ThreadDetailResponse` includes `ThreadFlags`, `DraftResponse`, `preferences__is_hidden`
- The main API thread listing includes these fields — service route may be a subset

---

### `cheerful_find_similar_emails`

**Status**: EXISTS

**Purpose**: Semantic similarity search via pgvector RAG. Finds emails with similar meaning to a query string or reference thread.

**Maps to**: `GET /api/service/rag/similar`

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated (scoped to user's campaigns).

**Current parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign to search within |
| query | string | no | — | Natural language query (mutually exclusive with thread_id) |
| thread_id | string | no | — | Reference thread ID to find similar threads (mutually exclusive with query) |
| limit | integer | no | 5 | Max results. Range: 1-20 |
| min_similarity | float | no | 0.3 | Minimum cosine similarity threshold. Range: 0.0-1.0 |

**Returns**: Array of `SimilarEmailResult` objects (gmail_thread_id, similarity_score, snippet, reply_text, subject, campaign_id).

**Existing tool audit notes** (for Wave 3):
- Uses OpenAI text-embedding-3-small (1536 dimensions)
- Verify exact parameter names in service route (query vs search_query)
- Security note from w1-search: service endpoint may lack user_id ownership validation — needs verification

---

### `cheerful_list_threads`

**Status**: NEW

**Purpose**: List email threads with comprehensive filtering by status, direction, campaign, account, and search text. The primary inbox view endpoint with full filter support.

**Maps to**: `GET /api/service/threads` (new service route needed; main route: `GET /threads/`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated (returns only threads from user's campaigns or assigned campaigns).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | no | — | Filter to a single campaign |
| campaign_ids | uuid[] | no | — | Filter to multiple campaigns |
| status_filter | string[] | no | — | Filter by thread status. Values: "READY_FOR_ATTACHMENT_EXTRACTION", "READY_FOR_CAMPAIGN_ASSOCIATION", "READY_FOR_RESPONSE_DRAFT", "WAITING_FOR_DRAFT_REVIEW", "WAITING_FOR_INBOUND", "IGNORE", "DONE", "NOT_LATEST" |
| direction_filter | enum | no | — | One of: "inbound", "outbound". Filter by latest message direction |
| gmail_account_ids | uuid[] | no | — | Filter by Gmail account IDs |
| smtp_account_ids | uuid[] | no | — | Filter by SMTP account IDs |
| show_hidden | boolean | no | false | Include hidden/archived threads |
| search | string | no | — | Text search across sender, recipient, and subject |
| participant_email | string | no | — | Filter to threads involving this email address |
| include_messages | boolean | no | false | Include full message bodies (returns `ThreadWithMessages[]` instead of `ThreadSummary[]`) |
| limit | integer | no | 50 | Results per page. Max: 100 |
| offset | integer | no | 0 | Pagination offset |

**Returns (when include_messages=false)**: Array of `ThreadSummary` objects:
- gmail_thread_id: string
- gmail_thread_state_id: uuid
- status: GmailThreadStatus enum
- latest_internal_date: datetime
- latest_direction: string (nullable)
- snippet: string (first 150 chars)
- sender_email: string
- subject: string (nullable)
- campaign_id: uuid (nullable)
- preferences__is_hidden: boolean
- gifting_status: string (nullable)
- paid_promotion_status: string (nullable)
- flags: ThreadFlags (wants_paid, has_question, has_issue — each with bool + reason string)

**Returns (when include_messages=true)**: Array of `ThreadWithMessages` — extends ThreadSummary with:
- sender_name: string
- account_email: string
- is_unread: boolean
- labels: string[]
- messages: MessageInThread[] (id, thread_id, sender_name, sender_email, recipient_emails, cc_emails, subject, body_text, body_html, date, labels, is_read, is_draft, message_id_header, alternative_drafts, attachments)

**Service route changes needed**: New `GET /api/service/threads` accepting all filter params with `user_id` query param for ownership scoping.

**Slack formatting notes**: Agent should present as a summary list showing: subject (truncated), sender, status badge, and date. For large result sets, summarize counts by status (e.g., "23 threads: 15 awaiting review, 5 waiting for reply, 3 done").

---

## Thread Operations

### `cheerful_hide_thread`

**Status**: NEW

**Purpose**: Hide (archive) an email thread. The thread will be excluded from default inbox views.

**Maps to**: `PATCH /api/service/threads/{thread_id}/hide` (new service route needed; main route: `PATCH /threads/{gmail_thread_id}/hide`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner (user must own the thread, verified via thread state user_id). Supports both Gmail and SMTP threads.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| thread_id | string | yes | — | Thread ID (Gmail hex or SMTP angle-bracket format) |

**Returns**: `{ message: "Thread hidden successfully", is_hidden: true }`

**Error responses**: Thread not found (404), user does not own thread (403).

**Slack formatting notes**: Agent should confirm with thread subject/sender context.

---

### `cheerful_unhide_thread`

**Status**: NEW

**Purpose**: Unhide (restore) an archived email thread. Reprocesses the thread through the full pipeline, picking up any messages that arrived while hidden.

**Maps to**: `PATCH /api/service/threads/{thread_id}/unhide` (new service route needed; main route: `PATCH /threads/{gmail_thread_id}/unhide`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner (user must own the thread).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| thread_id | string | yes | — | Thread ID (Gmail hex or SMTP angle-bracket format) |
| campaign_id | uuid | no | — | Force association with this campaign (otherwise auto-detected) |

**Returns**: `{ message: "Thread unhidden successfully", is_hidden: false }`

**Error responses**: Thread not found (404), user does not own thread (403).

**Side effects** (critical — not just a flag toggle):
1. Sets `is_hidden=false` in `gmail_thread_preferences`
2. Creates new thread state if messages arrived while hidden (via `idempotent_batch_insert_latest_state`)
3. If no new messages, resets existing state status to `READY_FOR_ATTACHMENT_EXTRACTION`
4. Spawns `ThreadProcessingCoordinatorWorkflow` Temporal workflow to reprocess the thread
5. If `campaign_id` provided, forces campaign association

**Slack formatting notes**: Agent should warn user that unhiding triggers reprocessing, which may generate new AI drafts.

---

## Attachments

### `cheerful_list_message_attachments`

**Status**: NEW

**Purpose**: List attachment metadata for a specific email message. Returns filenames, MIME types, and sizes without downloading the actual content.

**Maps to**: `GET /api/service/messages/{message_id}/attachments` (new service route needed; main route: `GET /messages/{gmail_message_id}/attachments`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner or assigned team member (via thread → campaign ownership check).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| message_id | uuid | yes | — | Database message UUID (from the `id` field in `GmailMessageResponse`) |

**Returns**: Array of `AttachmentMetadata` objects:
- id: uuid
- gmail_message_id: uuid
- filename: string
- mime_type: string
- size: integer (bytes)

**Notes**:
- SMTP messages return an empty list (attachment indexing not yet implemented for SMTP)
- The binary download endpoint (`GET /messages/{id}/attachments/{attachment_id}/download`) returns raw file content. Since the CE operates in Slack (text-only), this tool returns metadata only. The agent should describe attachments to the user rather than attempting download.
- Attachment data is also included inline in `cheerful_get_thread` responses (via `attachments` field on each message). This tool is useful for targeted queries without loading full thread content.

**Slack formatting notes**: Agent should list attachments as: `filename (type, size KB/MB)`.

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
