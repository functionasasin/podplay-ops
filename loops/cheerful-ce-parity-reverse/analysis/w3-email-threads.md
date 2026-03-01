# w3-email-threads — Analysis Notes

**Aspect**: w3-email-threads
**Date**: 2026-03-01
**Sources verified**: `gmail_message.py` (routes), `models/api/gmail_message.py` (Pydantic), `models/api/gmail_thread_preferences.py`, `models/database/gmail_thread_state.py`, `models/database/gmail_message.py`, `models/database/thread_flag.py`, `models/database/gmail_thread_preferences.py`, `service.py` (service routes), `tools.py` (CE tools), `api.py` (CE API client)

---

## Key Findings from Source Code Verification

### 1. Security Gap in Existing Service Routes (CONFIRMED)

The w1-search analysis flagged that service endpoints may lack `user_id` ownership validation. **This is confirmed**:

- `GET /api/service/threads/search` — accepts `campaign_id`, `query`, `direction`, `limit` only. **No `user_id` parameter.** The CE API client sends `user_id` as a query param but the FastAPI endpoint definition doesn't declare it, so it's silently ignored.
- `GET /api/service/threads/{gmail_thread_id}` — accepts only the path param. **No `user_id` parameter.** Same issue.
- `GET /api/service/rag/similar` — accepts `campaign_id`, `query`, `thread_id`, `limit`, `min_similarity`. **No `user_id` parameter.**

**Impact**: Any caller with a valid service API key can search/read threads from ANY campaign, regardless of ownership. The thread search only scopes by `campaign_id`, and anyone who guesses a campaign UUID can access its threads.

**New service routes must fix this**: The proposed `GET /api/service/threads` (for `cheerful_list_threads`) MUST accept `user_id` and scope all queries to that user's owned/assigned campaigns.

### 2. Model Corrections

**AttachmentMetadata** (standalone endpoint response): Only has `id`, `filename` (nullable!), `mime_type`, `size`. Does NOT have `gmail_message_id`.

**AttachmentInMessage** (embedded in message): Has `id`, `gmail_message_id`, `filename` (nullable!), `mime_type`, `size`.

**ThreadSummary.latest_direction**: Typed as `GmailMessageDirection` (the StrEnum), not `string`. However, since GmailMessageDirection is a StrEnum, it serializes to "inbound" or "outbound" strings.

### 3. ThreadSearchResult Actual Schema (Service Route)

From `models/api/service.py`:
```python
class ThreadSearchResult(BaseModel):
    gmail_thread_id: str
    subject: str
    sender_email: str
    recipient_emails: list[str]
    direction: str
    message_count: int
    latest_date: datetime
    matched_snippet: str
```

The Wave 2 spec listed `ThreadSearchResult` as having `snippet` — the actual field is `matched_snippet`. It also includes `recipient_emails` and `message_count` which were not documented.

### 4. ThreadDetailResponse Actual Schema (Service Route)

From `models/api/service.py`:
```python
class ThreadDetailResponse(BaseModel):
    gmail_thread_id: str
    messages: list[ThreadMessage]

class ThreadMessage(BaseModel):
    gmail_message_id: str
    direction: str
    sender_email: str
    recipient_emails: list[str]
    subject: str
    body_text: str
    internal_date: datetime
```

The service `ThreadDetailResponse` is MINIMAL — just thread ID + messages array. No status, no flags, no campaign_id, no draft info. It's a different model from the main API's `list[GmailMessageResponse]` response (which has `id` (uuid), `cc_emails`, `body_html`, `labels` — none of which are in the service model).

**The existing `cheerful_get_thread` tool returns less data than the main API endpoint.** Missing from the service response:
- `id` (database UUID)
- `cc_emails`
- `body_html`
- `labels`
- Thread-level metadata (status, flags, campaign_id, hidden status)

### 5. SimilarEmailResult Actual Schema (Service Route)

From `models/api/service.py`:
```python
class SimilarEmailResult(BaseModel):
    thread_id: str
    campaign_id: str
    thread_summary: str
    inbound_email_text: str
    sent_reply_text: str
    sanitized_reply_text: str | None
    similarity: float
```

The Wave 2 spec listed fields as `gmail_thread_id`, `similarity_score`, `snippet`, `reply_text`, `subject`, `campaign_id`. The actual field names are different:
- `thread_id` (not `gmail_thread_id`)
- `similarity` (not `similarity_score`)
- `thread_summary` (not `snippet`)
- `inbound_email_text` + `sent_reply_text` + `sanitized_reply_text` (not `reply_text`)
- No `subject` field

### 6. Existing CE Tool Parameter Discrepancies

**`cheerful_search_emails`**:
- CE tool `direction` described as "INBOUND or OUTBOUND" (uppercase) — matches the service route's `direction: str | None` which also documents "INBOUND or OUTBOUND"
- CE tool `limit` default is 20 (matches service route), max 50 (matches `le=50`)
- Wave 2 spec incorrectly listed default as 10

**`cheerful_find_similar_emails`**:
- CE tool `limit` max is 10 (matches service route `le=10`)
- Wave 2 spec incorrectly listed range as "1-20"

### 7. Thread Listing Backend Behavior Details

The `list_threads` function in `gmail_message.py`:
- Queries both Gmail threads (via `GmailThreadStateRepository`) and SMTP threads (via `SmtpThreadStateRepository`)
- Merges results and sorts by `latest_internal_date DESC`
- Applies pagination (`limit`/`offset`) after merge
- Team-based authorization: if user is not the account owner, uses `CampaignMemberAssignmentRepository` to filter to only assigned campaigns
- Batch-fetches creator statuses (gifting_status, paid_promotion_status) from `campaign_creator` table
- Batch-fetches thread flags from `thread_flag` table
- When `include_messages=True`: batch-fetches all messages, attachments, and both LLM + UI drafts; injects draft message as a virtual message in the thread
- Does NOT return a `total` count — just the array

### 8. Hide/Unhide Implementation Details

**Hide** (`gmail_message.py:hide_thread`):
- Gets or creates `GmailThreadUserPreferences` record for (user_id, thread_id)
- Sets `is_hidden = True`
- Returns `ThreadHideResponse(message="Thread hidden successfully", is_hidden=True)`
- Error: 404 if thread not found (no preferences record and no thread state exists)

**Unhide** (`gmail_message.py:unhide_thread`):
- Gets `GmailThreadUserPreferences` record
- Sets `is_hidden = False`
- `campaign_id` is a Body parameter (not query): `campaign_id: uuid.UUID | None = Body(None, embed=True)`
- Syncs thread state: calls `idempotent_batch_insert_latest_state` to pick up messages that arrived while hidden
- If no new messages, resets existing state to `READY_FOR_ATTACHMENT_EXTRACTION`
- Spawns `ThreadProcessingCoordinatorWorkflow` Temporal workflow with `force_reply=True` and optional `force_campaign_id`
- Returns `ThreadHideResponse(message="Thread unhidden successfully", is_hidden=False)`
- Errors: 404 (thread not found), 404 (campaign not found if campaign_id provided), 500 on unexpected failure

### 9. Attachment Listing Implementation

- Path parameter is `gmail_message_id: uuid.UUID` (the database UUID, NOT the Gmail message ID string)
- Tries Gmail first (queries `gmail_message_attachment` table)
- If no Gmail message found, falls back to SMTP (queries `smtp_message` table)
- SMTP returns empty list (attachment indexing not yet implemented)
- 404 if message not found in either provider
- 403 if user doesn't own the message (checked via thread → account → user_id chain)

### 10. GmailThreadUserPreferences Additional Fields

The database model reveals additional fields that could become tool parameters in the future:
- `is_pinned: bool | None` — pin thread to top
- `custom_label: str | None` — user-defined label
- `notes: str | None` — user notes on thread

Currently only `is_hidden` is exposed via API routes. Pin, label, and notes are DB-ready but have no endpoints.

---

## Tools Fully Specified in This Iteration

1. `cheerful_list_threads` — NEW, full OpenAPI spec written
2. `cheerful_hide_thread` — NEW, full OpenAPI spec written
3. `cheerful_unhide_thread` — NEW, full OpenAPI spec written
4. `cheerful_list_message_attachments` — NEW, full OpenAPI spec written

Existing tools (search_emails, get_thread, find_similar_emails) updated with verified return schemas and audit notes for w3-existing-tools-audit.
