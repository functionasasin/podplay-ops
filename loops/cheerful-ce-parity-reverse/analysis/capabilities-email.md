# Email — Capability Extraction

**Aspect**: w1-email
**Sources**: `spec-backend-api.md` (Domains 6-10), `spec-webapp.md` (Mail Inbox), actual source code (`gmail_message.py`, `draft.py`, `email.py`, `email_dispatch.py`, `email_signature.py`, `bulk_draft_edit.py`, `service.py`)

---

## Existing Context Engine Tools

| Tool | Description | Service Endpoint | Coverage |
|------|-------------|------------------|----------|
| `cheerful_search_emails` | Full-text search within campaign threads | `GET /api/service/threads/search` | READ only — searches by query, campaign_id, direction. Returns ThreadSearchResult[] |
| `cheerful_get_thread` | Fetch full email thread with all messages | `GET /api/service/threads/{gmail_thread_id}` | READ only — returns ThreadDetailResponse with messages. No flags, no draft, no status |
| `cheerful_find_similar_emails` | Semantic similarity search via pgvector RAG | `GET /api/service/rag/similar` | READ only — returns SimilarEmailResult[] with similarity scores and reply text |

**Gap**: 3 of the 7 existing tools are email-domain. All are read-only. No thread listing (with filters), no status mutations, no draft management, no email sending, no scheduling, no signatures, no bulk edits, no hide/unhide. The service endpoints (`/api/service/*`) currently only expose 3 read endpoints for the email domain.

---

## GmailThreadStatus Enum (verified from `src/models/database/gmail_thread_state.py`)

| Enum Value | String | Purpose |
|------------|--------|---------|
| `READY_FOR_ATTACHMENT_EXTRACTION` | `READY_FOR_ATTACHMENT_EXTRACTION` | Initial state — processing pipeline entry |
| `READY_FOR_CAMPAIGN_ASSOCIATION` | `READY_FOR_CAMPAIGN_ASSOCIATION` | Ready to match thread to campaign |
| `READY_FOR_RESPONSE_DRAFT` | `READY_FOR_RESPONSE_DRAFT` | Ready for AI draft generation |
| `WAITING_FOR_DRAFT_REVIEW` | `WAITING_FOR_DRAFT_REVIEW` | AI draft generated, awaiting human review |
| `WAITING_FOR_INBOUND` | `WAITING_FOR_INBOUND` | Reply sent, waiting for creator response |
| `IGNORE` | `IGNORE` | Terminal — thread ignored/archived |
| `DONE` | `DONE` | Terminal — thread complete |
| `NOT_LATEST` | `NOT_LATEST` | Terminal — superseded by newer state |

## GmailMessageDirection Enum (verified from `src/models/database/gmail_message.py`)

| Enum Value | String |
|------------|--------|
| `INBOUND` | `inbound` |
| `OUTBOUND` | `outbound` |

## EmailDispatchStatus Enum (verified from `src/models/database/email_dispatch_queue.py`)

| Enum Value | String |
|------------|--------|
| `PENDING` | `pending` |
| `PROCESSING` | `processing` |
| `SENT` | `sent` |
| `FAILED` | `failed` |
| `CANCELLED` | `cancelled` |

---

## Frontend/Backend Capabilities (Not Yet in Context Engine)

### Thread Listing & Filtering (Domain 6 — `gmail_message.py`)

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 1 | List threads with filters | `/threads/` | GET | status_filter[] (GmailThreadStatus[]), direction_filter (INBOUND/OUTBOUND), campaign_id (uuid), campaign_ids[] (uuid[]), gmail_account_ids[] (uuid[]), smtp_account_ids[] (uuid[]), show_hidden (bool, default false), limit (int, default 50, max 100), offset (int, default 0), search (string — sender/recipient/subject), participant_email (string), include_messages (bool, default false) | `ThreadSummary[]` when include_messages=false; `ThreadWithMessages[]` when include_messages=true |
| 2 | Get thread messages | `/threads/{gmail_thread_id}` | GET | gmail_thread_id (string — supports both Gmail hex IDs and SMTP angle-bracket IDs) | `GmailMessageResponse[]` — full message bodies, labels, direction |

**ThreadSummary fields** (verified from `src/models/api/gmail_message.py`):
- gmail_thread_id: string
- gmail_thread_state_id: UUID
- status: GmailThreadStatus
- latest_internal_date: datetime
- latest_direction: string (nullable)
- snippet: string (first 150 chars of body_text)
- sender_email: string
- subject: string (nullable)
- campaign_id: UUID (nullable)
- preferences__is_hidden: bool
- gifting_status: string (nullable)
- paid_promotion_status: string (nullable)
- flags: ThreadFlags

**ThreadWithMessages additional fields**:
- sender_name: string
- account_email: string
- is_unread: bool
- labels: string[]
- messages: MessageInThread[]

**MessageInThread fields**:
- id: string
- db_message_id: UUID (nullable)
- thread_id: string
- sender_name: string
- sender_email: string
- recipient_emails: string[]
- cc_emails: string[]
- subject: string (nullable)
- body_text: string (nullable)
- body_html: string (nullable)
- date: datetime
- labels: string[]
- is_read: bool
- is_draft: bool
- message_id_header: string (nullable)
- alternative_drafts: list (nullable — only on LLM draft messages)
- attachments: AttachmentInMessage[]

**AttachmentInMessage fields**:
- id: UUID
- gmail_message_id: UUID
- filename: string
- mime_type: string
- size: int

**ThreadFlags fields**:
- wants_paid: bool (default false)
- wants_paid_reason: string (nullable)
- has_question: bool (default false)
- has_question_reason: string (nullable)
- has_issue: bool (default false)
- has_issue_reason: string (nullable)

**GmailMessageResponse fields**:
- id: UUID
- gmail_message_id: string
- gmail_thread_id: string
- direction: string
- sender_email: string
- recipient_emails: string[]
- cc_emails: string[]
- subject: string (nullable)
- body_text: string (nullable)
- body_html: string (nullable)
- internal_date: datetime
- labels: string[]

**Note on SMTP support**: Thread IDs that start with `<` and end with `>` (angle-bracket format) are SMTP threads. The system auto-detects and queries the SMTP tables accordingly. Gmail thread IDs are bare hex strings (e.g., `18f3a2b4c5d6e7f8`).

---

### Thread Operations (Domain 6 — `gmail_message.py`)

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 3 | Hide thread (archive) | `/threads/{gmail_thread_id}/hide` | PATCH | gmail_thread_id | `{message: "Thread hidden successfully", is_hidden: true}` |
| 4 | Unhide thread (restore) | `/threads/{gmail_thread_id}/unhide` | PATCH | gmail_thread_id, campaign_id (uuid, optional — in request body) | `{message: "Thread unhidden successfully", is_hidden: false}`. Side effects: syncs thread state, spawns ThreadProcessingCoordinator Temporal workflow |

**ThreadHideResponse fields**:
- message: string
- is_hidden: bool

**Hide/unhide authorization**: User must own the thread (verified via thread state user_id). Supports both Gmail and SMTP threads.

**Unhide side effects** (critical — not just a flag toggle):
1. Sets `is_hidden=false` in `gmail_thread_preferences`
2. Creates new thread state if messages arrived while hidden (via `idempotent_batch_insert_latest_state`)
3. If no new messages, resets existing state status to `READY_FOR_ATTACHMENT_EXTRACTION`
4. Spawns `ThreadProcessingCoordinatorWorkflow` to reprocess the thread through the full pipeline
5. If `campaign_id` provided, forces association with that campaign

---

### Attachments (Domain 6 — `gmail_message.py`)

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 5 | Get message attachments | `/messages/{gmail_message_id}/attachments` | GET | gmail_message_id (UUID) | `AttachmentMetadata[]`. SMTP messages return empty list (no attachment indexing yet) |
| 6 | Download attachment | `/messages/{gmail_message_id}/attachments/{attachment_id}/download` | GET | gmail_message_id (UUID), attachment_id (UUID) | Binary content with `Content-Disposition: attachment; filename="..."` header and correct `Content-Type` |

**AttachmentMetadata fields** (from `src/models/api/gmail_message.py`):
- id: UUID
- gmail_message_id: UUID
- filename: string
- mime_type: string
- size: int

---

### Draft Management (Domain 7 — `draft.py`)

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 7 | Get thread draft | `/threads/{gmail_thread_id}/draft` | GET | gmail_thread_id | DraftResponse — UI draft takes precedence over LLM draft |
| 8 | Create thread draft | `/threads/{gmail_thread_id}/draft` | POST | gmail_thread_id, DraftCreateRequest body | DraftResponse (201) or 409 on version mismatch |
| 9 | Update thread draft | `/threads/{gmail_thread_id}/draft` | PUT | gmail_thread_id, DraftUpdateRequest body (partial fields) | DraftResponse or 409 on version mismatch |

**DraftCreateRequest fields** (verified from `src/models/api/draft.py`):
- gmail_thread_state_id: UUID (required — race condition anchor)
- draft_subject: string (nullable)
- draft_body_text: string (nullable)

**DraftUpdateRequest fields** (verified from `src/models/api/draft.py`):
- gmail_thread_state_id: UUID (required — race condition anchor)
- draft_subject: string (nullable — omit to keep existing)
- draft_body_text: string (nullable — omit to keep existing)

**DraftResponse fields** (verified from `src/models/api/draft.py`):
- gmail_thread_state_id: UUID
- internal_date: datetime
- draft_subject: string (nullable)
- draft_body_text: string (nullable)
- source: string — "human" (UI draft) or "llm" (LLM-generated draft)
- alternative_drafts: list (nullable — only present when source="llm")

**Draft priority**: UI drafts (human edits) always take precedence over LLM-generated drafts. When a user creates/updates a draft, it becomes a "human" source and supersedes any LLM draft.

**Version mismatch handling (409)**:
- Occurs when `gmail_thread_state_id` points to a state that no longer exists (new message arrived, creating a new state)
- Response body: `{"error": "version_mismatch", "message": "Thread state updated. Please refresh.", "latest_gmail_thread_state_id": "uuid", "latest_internal_date": "ISO datetime"}`
- Client must re-fetch thread state and retry with the new `gmail_thread_state_id`

**SMTP support**: Drafts work for both Gmail and SMTP threads. The system auto-detects via `_is_smtp_thread_id()` and uses the appropriate repository.

---

### Email Sending (Domain 8 — `email.py`)

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 10 | Send email | `/emails/send` | POST | SendEmailRequest body | SendEmailResponse |

**SendEmailRequest fields** (verified from `email.py`):
- account_email: string (required — sender account email address. Backend auto-detects Gmail vs SMTP account)
- to: EmailStr[] (required — at least one recipient)
- cc: EmailStr[] (nullable)
- subject: string (required)
- body_html: string (nullable)
- body_text: string (nullable)
- thread_id: string (nullable — for replies, the Gmail/SMTP thread ID)
- in_reply_to: string (nullable — Message-ID header of the message being replied to)
- references: string (nullable — References header for threading)
- gmail_thread_state_id: UUID (nullable — for tracking state transitions after send)
- smtp_thread_state_id: UUID (nullable — for SMTP thread state tracking)

**Validation rules**:
- `to` list must not be empty: `ValueError("At least one recipient is required")`
- At least one of `body_html` or `body_text` must be provided: `ValueError("Either body_html or body_text must be provided")`

**SendEmailResponse fields** (verified from `email.py`):
- message_id: string
- thread_id: string
- sent_at: datetime

**Authorization model**:
- Account owner: can send freely
- Team member (assigned to campaign): checks `can_send_via_campaign_assignment(user_id, account_id)` AND `can_access_thread(user_id, thread_id)`
- Non-owner, non-assigned: 403 "Not authorized to send from this account"
- Thread not in assigned campaign: 403 "Not authorized to send on this thread"

**Post-send side effects**:
- Thread state updated to `NOT_LATEST` (prevents follow-up scheduling on the old state)
- Gmail sync will detect the new outbound message and create a fresh GmailThreadState
- ThreadProcessingCoordinator workflow handles the proper `WAITING_FOR_INBOUND` transition

---

### Scheduled Email Dispatch (Domain 9 — `email_dispatch.py`)

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 11 | Schedule email | `/emails/scheduled` | POST | ScheduleEmailRequest body | ScheduleEmailResponse (201) |
| 12 | List scheduled emails | `/emails/scheduled` | GET | (none — user-scoped) | ScheduledEmailListResponse |
| 13 | Cancel scheduled email | `/emails/scheduled/{dispatch_id}` | DELETE | dispatch_id (UUID) | `{status: "cancelled", id: "uuid"}` |
| 14 | Reschedule email | `/emails/scheduled/{dispatch_id}/reschedule` | PATCH | dispatch_id (UUID), RescheduleRequest body | `{status: "rescheduled", id: "uuid", dispatch_at: "ISO datetime"}` |

**ScheduleEmailRequest fields** (verified from `email_dispatch.py`):
- gmail_account_id: UUID (nullable — mutually exclusive with smtp_account_id)
- smtp_account_id: UUID (nullable — mutually exclusive with gmail_account_id)
- recipient_email: EmailStr (required)
- recipient_name: string (nullable)
- cc_emails: EmailStr[] (nullable)
- bcc_emails: EmailStr[] (nullable)
- subject: string (required)
- body_text: string (nullable)
- body_html: string (nullable)
- in_reply_to_message_id: string (nullable)
- references_header: string (nullable)
- gmail_thread_id: string (nullable)
- dispatch_at: datetime (required — must be timezone-aware, must be in the future)
- user_timezone: string (default "UTC" — validated via `ZoneInfo`)

**Validation rules**:
- Exactly one of `gmail_account_id` or `smtp_account_id` required: 400 "Exactly one of gmail_account_id or smtp_account_id is required"
- At least one of `body_text` or `body_html` required: 422 "At least one of body_text or body_html is required"
- `dispatch_at` must be timezone-aware: `ValueError("dispatch_at must be timezone-aware")`
- `dispatch_at` must be in the future: `ValueError("dispatch_at must be in the future")`
- `user_timezone` must be valid: `ValueError(f"Invalid timezone: {v}")`

**ScheduleEmailResponse fields**:
- id: UUID
- dispatch_at: datetime
- status: string
- recipient_email: string (nullable — present in list response)
- subject: string (nullable — present in list response)

**ScheduledEmailListResponse fields**:
- emails: ScheduleEmailResponse[]

**RescheduleRequest fields**:
- dispatch_at: datetime (required — must be timezone-aware, must be in the future)

**Cancel/reschedule authorization**:
- User must own the dispatch (verified via `dispatch.user_id != current_user_id`)
- Dispatch must be in `PENDING` status
- 404: "Scheduled email not found"
- 403: "Not authorized to cancel this email" / "Not authorized to reschedule this email"
- 409: "Email has already been sent or cancelled" (status check) or "Email could not be cancelled (may have been sent)" (race condition)

---

### Email Signatures (Domain 10 — `email_signature.py`)

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 15 | List signatures | `/email-signatures` | GET | campaign_id (UUID, optional — filter by campaign) | EmailSignatureListResponse |
| 16 | Get signatures for reply | `/email-signatures/for-reply` | GET | campaign_id (UUID, optional) | SignaturesForReplyResponse |
| 17 | Create signature | `/email-signatures` | POST | EmailSignatureCreateRequest body | EmailSignatureResponse (201) |
| 18 | Get signature | `/email-signatures/{signature_id}` | GET | signature_id (UUID) | EmailSignatureResponse |
| 19 | Update signature | `/email-signatures/{signature_id}` | PATCH | signature_id (UUID), EmailSignatureUpdateRequest body | EmailSignatureResponse |
| 20 | Delete signature | `/email-signatures/{signature_id}` | DELETE | signature_id (UUID) | 204 No Content |

**EmailSignatureCreateRequest fields** (verified from `src/models/api/email_signature.py`):
- name: string (required)
- content: string (required — HTML content, max 10,000 characters, sanitized server-side)
- is_default: bool (default false — only applies to user-level signatures)
- campaign_id: UUID (nullable — omit for user-level, set for campaign-specific)
- is_enabled: bool (default false — only applies to campaign signatures)

**EmailSignatureUpdateRequest fields**:
- name: string (nullable — omit to keep)
- content: string (nullable — omit to keep)
- is_default: bool (nullable)
- is_enabled: bool (nullable)

**EmailSignatureResponse fields**:
- id: UUID
- user_id: UUID
- name: string
- content: string (HTML)
- is_default: bool
- campaign_id: UUID (nullable)
- campaign_name: string (nullable — populated via join)
- is_enabled: bool
- created_at: datetime
- updated_at: datetime

**EmailSignatureListResponse fields**:
- signatures: EmailSignatureResponse[]

**SignaturesForReplyResponse fields**:
- user_signatures: EmailSignatureResponse[] (campaign_id is null)
- campaign_signature: EmailSignatureResponse (nullable — the campaign-specific signature if exists)

**Signature behavior notes**:
- When setting `is_default=true` for a user-level signature, all other user-level signatures have `is_default` cleared
- Campaign signatures cannot be default (forced to `is_default=false`)
- Campaign signatures: `is_enabled` controls whether they're used in automated emails
- Content is sanitized via `sanitize_signature_html()` and validated via `validate_signature_length()` (max 10,000 chars)
- Creating a campaign signature requires campaign ownership (verified via `campaign.user_id != user_id`)

---

### Bulk Draft Editing (Domain — `bulk_draft_edit.py`)

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 21 | Start bulk draft edit | `/bulk-draft-edit` | POST | BulkDraftEditRequest body | BulkDraftEditResponse |

**BulkDraftEditRequest fields** (verified from `bulk_draft_edit.py`):
- campaign_id: UUID (required)
- edit_instruction: string (required — natural language edit instruction)
- exclude_thread_ids: string[] (default empty — thread IDs to skip)
- save_as_rule: bool (default false — save edit as a permanent rule)
- rule_text: string (nullable — human-readable rule text if save_as_rule=true)

**BulkDraftEditResponse fields**:
- workflow_id: string (Temporal workflow ID)
- message: string ("Bulk draft edit started")

**Authorization**: Campaign owner only (verified via `campaign.user_id != user_id`). 403 "Not authorized for this campaign".

**Side effects**: Starts a Temporal `BulkDraftEditWorkflow` with 5-minute execution timeout. The workflow rewrites all matching drafts in the campaign using the AI edit instruction.

---

### AI Email Improvement — "Cheerify" (Frontend → Next.js API → Backend)

| # | Action | Backend/Frontend Endpoint | Method | Key Parameters | Returns |
|---|--------|--------------------------|--------|----------------|---------|
| 22 | Improve email content | `POST /api/improve-email-content-stream-send-textbox` | POST | action (shorten, expand, friendly, professional, casual, custom:[feedback]), email content | SSE stream with improved text tokens |
| 23 | Classify edit for bulk | `POST /api/classify-edit` | POST | original text, edited text, cheerify actions used | `{shouldOffer: bool, affected_count: int}` |
| 24 | Get rule suggestions | `POST /api/rules-suggestion` | POST | original text, edited text, cheerify actions | Rule suggestions (1-3) |

**Cheerify actions** (verified from webapp spec):
- `shorten` — Make email shorter
- `expand` — Make email longer
- `friendly` — Friendlier tone
- `professional` — More formal
- `casual` — More casual
- `custom:[feedback]` — Custom instruction from user

**Note**: These are Next.js API routes that proxy to Claude. They may need dedicated backend service endpoints for the context engine to use, OR the context engine can implement AI email improvement directly using its own Claude instance.

---

### Thread Summary (AI-generated — referenced in spec)

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 25 | Get thread summary | `/threads/{gmail_thread_id}/summary` | GET | gmail_thread_id | AI-generated summary (cached if thread unchanged) |

**Note**: This endpoint is referenced in `spec-backend-api.md` but needs source code verification. May be a Next.js route rather than a backend endpoint.

---

## Service Endpoint Coverage for Context Engine

The context engine currently calls 3 service endpoints:

| Service Endpoint | CE Tool | Parameters |
|-----------------|---------|------------|
| `GET /api/service/threads/search` | `cheerful_search_emails` | user_id, campaign_id, query, direction, limit |
| `GET /api/service/threads/{gmail_thread_id}` | `cheerful_get_thread` | user_id |
| `GET /api/service/rag/similar` | `cheerful_find_similar_emails` | user_id, campaign_id, query/thread_id, limit, min_similarity |

**New service endpoints needed for write operations**: The existing `/api/service/*` routes are all read-only GETs. To support email domain parity, new service endpoints must be created (or existing JWT-authenticated endpoints must get service-auth alternatives) for:

1. Thread listing with full filter support
2. Thread hide/unhide
3. Draft get/create/update
4. Email send
5. Scheduled email CRUD
6. Signature CRUD
7. Bulk draft edit
8. Attachment listing

---

## Summary

**Total email-domain capabilities identified: 25**

| Sub-domain | Count | Existing CE Tools | Gap |
|-----------|-------|-------------------|-----|
| Thread Listing & Filtering | 2 | 1 (search only, no listing) | 1 new tool (list with filters) |
| Thread Detail | 0 | 1 (get_thread exists) | Enhanced — needs flags, draft, status in response |
| Thread Operations (hide/unhide) | 2 | 0 | 2 new tools |
| Attachments | 2 | 0 | 2 new tools |
| Draft Management | 3 | 0 | 3 new tools |
| Email Sending | 1 | 0 | 1 new tool |
| Scheduled Email Dispatch | 4 | 0 | 4 new tools |
| Email Signatures | 6 | 0 | 6 new tools |
| Bulk Draft Edit | 1 | 0 | 1 new tool |
| AI Email Improvement | 3 | 0 | 3 new tools (may be handled by CE's own Claude) |
| Thread Summary | 1 | 0 | 1 new tool (needs source verification) |
| Semantic Search | 0 | 1 (find_similar exists) | Already covered |
| **TOTAL** | **25** | **3** | **~22 new tools** |

### Discovered Aspects Not in Original Frontier

During source code analysis, the following were found:

1. **SMTP thread support** — All thread operations auto-detect Gmail vs SMTP threads via `_is_smtp_thread_id()`. Thread IDs starting with `<` and ending with `>` are SMTP. This dual-provider support must be documented in every tool that accepts a `gmail_thread_id` parameter.

2. **Thread flags (wants_paid, has_question, has_issue)** — AI-detected flags on threads. The `ThreadFlags` model includes both boolean flags and reason strings. These are read during thread listing but there's a `PATCH /threads/{gmail_thread_id}/flags` endpoint referenced in the spec that needs source verification for write support.

3. **Draft version mismatch (409 conflict)** — Critical race condition handling. Drafts are anchored to a `gmail_thread_state_id`. If a new message arrives (creating a new state), the old state ID becomes invalid. Tools must handle this gracefully.

4. **Alternative drafts** — LLM-generated drafts can have `alternative_drafts` (multiple draft options). Only LLM drafts have this field; UI (human) drafts do not.

5. **Attachment download** — Returns binary content from Supabase Storage. This is a non-JSON response. The context engine tool would need to handle this differently (perhaps returning a download URL or describing the attachment metadata instead).

6. **Cheerify/AI email improvement** — These are Next.js API routes, not backend endpoints. The context engine would need either dedicated service endpoints OR could use its own Claude instance to provide similar AI editing capabilities.

7. **Email send dual-path** — The webapp has two send paths: owner uses Next.js route → Gmail API directly; team member uses `POST /emails/send` via backend. The context engine should always use the backend endpoint (via service auth).

8. **Rule suggestion system** — After editing and sending, the system suggests campaign rules based on the edit pattern. This is a frontend-initiated flow but could be exposed as a tool.
