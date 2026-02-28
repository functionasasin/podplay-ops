# Audit: API Routes

**Source files read (all under `projects/cheerful/apps/backend/`):**
- `main.py` — app entrypoint, router mounting
- `src/api/router.py` — top-level router aggregation
- `src/api/route/gmail_message.py` — thread & message endpoints
- `src/api/route/draft.py` — draft management
- `src/api/route/email.py` — email send endpoint
- `src/api/route/email_dispatch.py` — scheduled email dispatch
- `src/api/route/smtp_account.py` — SMTP account CRUD
- `src/api/route/slack.py` — Slack webhook (pattern reference for external webhooks)
- `src/api/route/user.py` — Gmail account listing, user settings
- `src/api/route/email_signature.py` — email signature CRUD
- `src/api/route/service.py` — service-to-service routes
- `src/api/dependencies/auth.py` — authentication dependencies
- `src/api/dependencies/service_auth.py` — service API key auth
- `src/models/api/gmail_message.py` — thread/message response models
- `src/models/api/smtp_account.py` — SMTP account request/response models
- `src/models/api/draft.py` — draft request/response models
- `src/models/api/user.py` — user/account response models

---

## 1. Application URL Structure

**Main app** (`main.py` line 52):
```python
app.include_router(api_router, prefix="/api")
```

All routes are mounted under `/api`. No API versioning at the app level — some individual routers add `/v1` themselves.

**Router prefixes** (from `router.py`):
| Router | prefix in router.py | prefix in router file | Final URL base |
|--------|--------------------|-----------------------|----------------|
| `gmail_message_router` | (none) | `/threads` | `/api/threads` |
| `message_router` | (none) | `/messages` | `/api/messages` |
| `draft_router` | (none) | `/threads` | `/api/threads` (same prefix as gmail_message, different tags) |
| `email_router` | (none) | `/emails` | `/api/emails` |
| `email_dispatch_router` | (none) | `/emails/scheduled` | `/api/emails/scheduled` |
| `user_router` | (none) | `/user` | `/api/user` |
| `slack_router` | (none) | `/slack` | `/api/slack` |
| `smtp_account_router` | `/v1` | `/smtp-accounts` | `/api/v1/smtp-accounts` |
| `service_router` | (none) | `/service` | `/api/service` |
| `email_signature_router` | (none) | `/email-signatures` | `/api/email-signatures` |
| `campaign_router` | (none) | `/campaigns` | `/api/campaigns` |

---

## 2. Authentication Patterns

### 2.1 Standard User Auth (`get_current_user`)

Defined in `src/api/dependencies/auth.py`.

```python
# Returns dict:
{
    "user_id": str,   # UUID string — call uuid.UUID(current_user["user_id"]) to convert
    "email": str,
    "role": str,
    "payload": dict   # Full decoded JWT payload
}
```

**Mechanism:**
- HTTP Bearer token via `HTTPBearer()` security scheme
- Supabase JWT verification (HS256 or ES256 depending on key type)
- PyJWKClient for ES256 (newer Supabase CLI), shared secret for HS256 (production)
- `leeway=60` seconds for clock skew
- Optional impersonation via `x-impersonate-user` header (dev only)

**Pattern in every authenticated route:**
```python
current_user: dict = Depends(get_current_user)
user_id = uuid.UUID(current_user["user_id"])
```

### 2.2 Optional User Auth (`get_optional_user`)

Returns `Dict[str, Any] | None` — does not raise if token absent. Used for mixed public/private endpoints.

### 2.3 Service-to-Service Auth (`verify_service_api_key`)

Defined in `src/api/dependencies/service_auth.py`.

```python
x_service_api_key: str = Header(alias="X-Service-Api-Key")
# Compares against settings.SERVICE_API_KEY
```

Used on the `/api/service/` router with router-level dependency injection:
```python
router = APIRouter(
    prefix="/service",
    dependencies=[Depends(verify_service_api_key)],
)
```

### 2.4 Webhook Auth (Slack pattern reference)

From `slack.py` lines 29-54:
- HMAC-SHA256 signature verification (`X-Slack-Signature` header)
- Timestamp comparison: reject requests >5 minutes old (`X-Slack-Request-Timestamp`)
- `hmac.compare_digest()` for constant-time comparison
- `sig_basestring = f"v0:{timestamp}:{body.decode()}"`
- Return `{"ok": True}` on success (Slack requirement: fast 200 response)
- Use `BackgroundTasks` for slow processing after returning 200

**Meta webhook pattern will be analogous:** `X-Hub-Signature-256` header, `sha256=` prefix, same timing check, same immediate-200 requirement.

---

## 3. Thread/Message Routes (Gmail)

**Router:** `src/api/route/gmail_message.py`
**Prefix:** `/api/threads`

### `GET /api/threads/`

**File:** `gmail_message.py` lines 115–489
**Auth:** `get_current_user`
**Response:** `list[ThreadSummary] | list[ThreadWithMessages]`

Query parameters:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status_filter` | `list[GmailThreadStatus] \| None` | None | Filter by thread status |
| `direction_filter` | `GmailMessageDirection \| None` | None | INBOUND or OUTBOUND |
| `campaign_id` | `uuid.UUID \| None` | None | Filter by single campaign |
| `campaign_ids` | `list[uuid.UUID] \| None` | None | Filter by multiple campaigns |
| `gmail_account_ids` | `list[uuid.UUID] \| None` | None | Filter by Gmail accounts |
| `show_hidden` | `bool` | False | Include hidden threads |
| `limit` | `int` | 50 (max 100) | Pagination |
| `offset` | `int` | 0 | Pagination |
| `search` | `str \| None` | None | Search in sender/recipient/subject |
| `include_messages` | `bool` | False | Include full messages (returns ThreadWithMessages) |
| `include_uncategorized` | `bool` | False | Include no-campaign threads |
| `only_uncategorized` | `bool` | False | Show only no-campaign threads |

**Authorization note:** Returns only threads from campaigns user owns OR is assigned to via team assignments.

### `GET /api/threads/{gmail_thread_id}`

**File:** `gmail_message.py` lines 492–527
**Auth:** `get_current_user`
**Response:** `list[GmailMessageResponse]`
**Path param:** `gmail_thread_id: str` (Gmail string ID, not UUID)

Returns all messages in thread ordered by `internal_date`. Supports cross-user access for assigned campaign threads.

### `PATCH /api/threads/{gmail_thread_id}/hide`

**File:** `gmail_message.py` lines 530–574
**Auth:** `get_current_user`
**Response:** `ThreadHideResponse`

### `PATCH /api/threads/{gmail_thread_id}/unhide`

**File:** `gmail_message.py` lines 577–764
**Auth:** `get_current_user`
**Body:** `campaign_id: uuid.UUID | None` (embedded, optional)
**Response:** `ThreadHideResponse`

On unhide: sets preference → syncs state → spawns `ThreadProcessingCoordinatorWorkflow` via Temporal.

---

## 4. Message-Specific Routes

**Router:** `src/api/route/gmail_message.py` (separate `message_router`)
**Prefix:** `/api/messages`

### `GET /api/messages/{gmail_message_id}/attachments`

**File:** `gmail_message.py` lines 771–813
**Auth:** `get_current_user`
**Path param:** `gmail_message_id: uuid.UUID`
**Response:** `list[AttachmentMetadata]`

### `GET /api/messages/{gmail_message_id}/attachments/{attachment_id}/download`

**File:** `gmail_message.py` lines 816–878
**Auth:** `get_current_user`
**Response:** `Response` (binary content with appropriate Content-Type and Content-Disposition)

Downloads from Supabase Storage, extracts attachment by `mime_part_index`.

---

## 5. Draft Routes

**Router:** `src/api/route/draft.py`
**Prefix:** `/api/threads` (same prefix as gmail_message, different tags)

### `GET /api/threads/{gmail_thread_id}/draft`

**File:** `draft.py` lines 23–75
**Auth:** `get_current_user`
**Response:** `DraftResponse`

UI draft takes precedence over LLM draft. Returns 404 if no draft.

### `POST /api/threads/{gmail_thread_id}/draft`

**File:** `draft.py` lines 78–144
**Auth:** `get_current_user`
**Body:** `DraftCreateRequest`
**Response:** `DraftResponse` (201)

Race condition: if `gmail_thread_state_id` not found → 409 with `{"error": "version_mismatch", "latest_gmail_thread_state_id": ..., "latest_internal_date": ...}`.

### `PUT /api/threads/{gmail_thread_id}/draft`

**File:** `draft.py` lines 147–230
**Auth:** `get_current_user`
**Body:** `DraftUpdateRequest`
**Response:** `DraftResponse`

Partial update — merges with existing draft, optional fields.

---

## 6. Email Send Route

**Router:** `src/api/route/email.py`
**Prefix:** `/api/emails`

### `POST /api/emails/send`

**File:** `email.py` lines 182–258
**Auth:** `get_current_user`
**Body:** `SendEmailRequest`
**Response:** `SendEmailResponse`

```python
class SendEmailRequest(BaseModel):
    account_email: str          # Identifies which account to send from
    to: list[EmailStr]
    cc: list[EmailStr] | None = None
    subject: str
    body_html: str | None = None
    body_text: str | None = None
    thread_id: str | None = None        # Gmail thread ID for threading
    in_reply_to: str | None = None      # RFC 822 In-Reply-To header
    references: str | None = None       # RFC 822 References header
    gmail_thread_state_id: UUID | None = None   # For state update
    smtp_thread_state_id: UUID | None = None    # For state update
```

```python
class SendEmailResponse(BaseModel):
    message_id: str
    thread_id: str
    sent_at: datetime
```

Routes to Gmail or SMTP based on `account_email` lookup. Updates thread state to `NOT_LATEST` after sending.

---

## 7. Scheduled Email Routes

**Router:** `src/api/route/email_dispatch.py`
**Prefix:** `/api/emails/scheduled`

### `POST /api/emails/scheduled` → 201

**Body:** `ScheduleEmailRequest` — includes `gmail_account_id | smtp_account_id`, recipient, content, `dispatch_at: datetime` (must be future + timezone-aware)

### `GET /api/emails/scheduled`

**Response:** `ScheduledEmailListResponse`

### `DELETE /api/emails/scheduled/{dispatch_id}`

Cancels pending scheduled email. Returns 409 if already sent.

### `PATCH /api/emails/scheduled/{dispatch_id}/reschedule`

**Body:** `RescheduleRequest` with new `dispatch_at`.

---

## 8. SMTP Account Routes

**Router:** `src/api/route/smtp_account.py`
**Prefix:** `/api/v1/smtp-accounts`
**Auth:** `get_current_user` on all routes

### `POST /api/v1/smtp-accounts` → 201

**Body:** `SmtpAccountCreateRequest`
**Response:** `SmtpAccountResponse`
Re-activates soft-deleted account if email matches. 409 on duplicate active.

### `POST /api/v1/smtp-accounts/bulk`

**Body:** `BulkSmtpImportRequest` — list of accounts (max 100), Gmail or custom provider
**Response:** `BulkSmtpImportResponse` with per-account results (created/skipped/error)
Verifies IMAP credentials in parallel via `ThreadPoolExecutor` before saving.

### `GET /api/v1/smtp-accounts`

**Response:** `list[SmtpAccountResponse]`

### `GET /api/v1/smtp-accounts/{account_id}`

**Response:** `SmtpAccountResponse`. Returns 403 if not owned.

### `PATCH /api/v1/smtp-accounts/{account_id}`

**Body:** `SmtpAccountUpdateRequest` (all fields optional)
**Response:** `SmtpAccountResponse`

### `DELETE /api/v1/smtp-accounts/{account_id}` → 204

Hard delete.

---

## 9. User / Gmail Account Routes

**Router:** `src/api/route/user.py`
**Prefix:** `/api/user`
**Auth:** `get_current_user` on all routes

### `GET /api/user/settings`

**Response:** `UserSettingResponse` — creates default settings if none exist

### `PUT /api/user/settings`

Placeholder for future settings update.

### `GET /api/user/gmail-accounts`

**Response:** `list[UserGmailAccountResponse]` — read-only, refresh_token excluded

```python
class UserGmailAccountResponse(BaseModel):
    id: uuid.UUID
    gmail_email: str
    sync_in_progress: bool
    is_active: bool
    created_at: datetime
```

### `GET /api/user/connected-accounts`

**Response:** `list[ConnectedAccountResponse]` — unified Gmail + SMTP list

Query params: `account_type: str | None` ("gmail" or "smtp"), `active_only: bool = True`

```python
class ConnectedAccountResponse(BaseModel):
    id: uuid.UUID
    email: str
    account_type: AccountType  # "gmail" or "smtp"
    display_name: str | None
    is_active: bool
```

**Note:** Gmail accounts are READ-ONLY from the API — they're created via Google OAuth (managed externally, not via REST endpoint). This is a critical pattern difference from SMTP. IG DM accounts will similarly be created via Meta OAuth callback, not via a direct POST request body.

---

## 10. Slack Webhook Routes (Pattern Reference)

**Router:** `src/api/route/slack.py`
**Prefix:** `/api/slack`

### `POST /api/slack/interactions` (no auth — external webhook)

**File:** `slack.py` lines 471–517

Pattern:
1. Reads raw body bytes: `body = await request.body()`
2. HMAC-SHA256 signature verification via `X-Slack-Signature` / `X-Slack-Request-Timestamp`
3. Timestamp check: reject if >5 minutes old
4. Parse form-encoded body: `payload = json.loads(form_data.get("payload", "{}"))`
5. **Use `BackgroundTasks` for slow operations** — returns `{"ok": True}` immediately
6. Background tasks receive function args (not coroutines) because they run in a threadpool

```python
@router.post("/interactions")
async def slack_interactions(request: Request, background_tasks: BackgroundTasks):
    body = await request.body()
    # ... verify signature ...
    background_tasks.add_task(handle_order_approval, ...)
    return {"ok": True}
```

### `POST /api/slack/digest/{campaign_id}` (requires user auth)

Triggers Slack digest Temporal workflow. Returns `{"ok": True, "workflow_id": handle.id}`.

---

## 11. Service-to-Service Routes

**Router:** `src/api/route/service.py`
**Prefix:** `/api/service`
**Auth:** `X-Service-Api-Key` header (router-level dependency)

Key routes:
- `GET /api/service/campaigns?user_id={uuid}` — list campaigns for user
- `GET /api/service/threads?...` — thread search for RAG context
- `GET /api/service/similar-emails?...` — embedding similarity search

---

## 12. Email Signature Routes

**Router:** `src/api/route/email_signature.py`
**Prefix:** `/api/email-signatures`
**Auth:** `get_current_user`

Standard CRUD: `GET /`, `POST /`, `GET /{id}`, `PATCH /{id}`, `DELETE /{id}`

---

## 13. Key Patterns for IG DM Implementation

### 13.1 Webhook Handler Pattern (from Slack)

```python
router = APIRouter(prefix="/webhooks/instagram", tags=["ig-dm-webhook"])

@router.get("/")  # Meta webhook verification
async def verify_webhook(
    hub_mode: str = Query(alias="hub.mode"),
    hub_verify_token: str = Query(alias="hub.verify_token"),
    hub_challenge: str = Query(alias="hub.challenge"),
) -> Response:
    # return hub_challenge as plain text if valid

@router.post("/")  # Meta webhook events (no auth)
async def receive_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
) -> dict:
    # 1. Read body bytes
    # 2. Verify X-Hub-Signature-256 HMAC-SHA256
    # 3. Parse JSON body
    # 4. background_tasks.add_task(dispatch_to_temporal, payload)
    # 5. return {"ok": True}  # MUST return 200 immediately
```

### 13.2 Account Management Pattern (from SMTP)

IG DM accounts should follow the SMTP pattern closely:
```
POST   /api/v1/ig-dm-accounts          → 201 (OAuth callback creates account)
GET    /api/v1/ig-dm-accounts          → list[IgDmAccountResponse]
GET    /api/v1/ig-dm-accounts/{id}     → IgDmAccountResponse
DELETE /api/v1/ig-dm-accounts/{id}     → 204
```

But unlike SMTP (credentials in request body), IG DM uses OAuth — the create endpoint receives an `authorization_code` from Meta's OAuth flow and exchanges it for tokens server-side.

### 13.3 Thread Query Pattern (IG DM threads in existing inbox)

IG DM threads should be surfaced through the **existing** `GET /api/threads/` endpoint with a new `channel` filter parameter rather than a separate endpoint. This follows the design decision of a unified inbox.

Alternatively — and this is important to spec in Wave 2 — a separate `GET /api/ig-dm/threads/` endpoint may be cleaner for the MVP to avoid modifying the hot path of the existing thread query.

### 13.4 Reply Route Pattern (from email send)

Email send uses `POST /api/emails/send` with `account_email` to identify the account. For IG DM:
```
POST /api/v1/ig-dm/threads/{ig_dm_thread_id}/reply
Body: { ig_dm_account_id: uuid.UUID, message_text: str, media_url?: str }
```

### 13.5 Draft Pattern for IG DM

IG DM drafts should follow the same nested structure:
```
GET  /api/ig-dm/threads/{id}/draft
POST /api/ig-dm/threads/{id}/draft
PUT  /api/ig-dm/threads/{id}/draft
```

### 13.6 User ID Extraction

All routes: `user_id = uuid.UUID(current_user["user_id"])` — consistent, never deviate.

### 13.7 Database Session Pattern

All routes use context manager:
```python
with get_db_session_context() as db:
    repo = SomeRepository(db)
    result = repo.some_method(...)
    db.commit()  # explicit commit when writing
```

### 13.8 Error Patterns

- 404: `HTTPException(status_code=404, detail="Resource not found")`
- 403: `HTTPException(status_code=403, detail="Not authorized")`
- 409: `HTTPException(status_code=409, detail={...})` — with structured body for race conditions
- 201: `status_code=status.HTTP_201_CREATED` on create routes

---

## 14. Model Schemas

### `ThreadSummary` (existing, `/api/threads/` list view)

```python
class ThreadSummary(BaseModel):
    gmail_thread_id: str
    gmail_thread_state_id: uuid.UUID
    status: GmailThreadStatus
    latest_internal_date: datetime
    latest_direction: GmailMessageDirection
    snippet: str  # ~150 chars of body_text
    sender_email: str
    subject: str | None
    campaign_id: uuid.UUID | None
    preferences__is_hidden: bool
    gifting_status: str | None = None
    paid_promotion_status: str | None = None
    flags: ThreadFlags
```

**IG DM parallel model** will need: `ig_dm_thread_id: str`, `ig_conversation_id: str`, `sender_igsid: str`, `sender_username: str | None`, NO `subject`, NO `snippet` (or DM message text), `window_expires_at: datetime | None`.

### `ThreadWithMessages` (existing, `include_messages=true`)

Contains `messages: list[MessageInThread]` with full body content.

### `MessageInThread` (existing)

```python
class MessageInThread(BaseModel):
    id: str           # Gmail message ID
    db_message_id: uuid.UUID | None
    thread_id: str
    sender_name: str
    sender_email: str
    recipient_emails: list[str]
    cc_emails: list[str]
    subject: str | None
    body_text: str | None
    body_html: str | None
    date: datetime
    labels: list[str]
    is_read: bool
    is_draft: bool
    message_id_header: str | None = None
    attachments: list[AttachmentInMessage] = []
```

**IG DM parallel model** will need: `mid: str` (Meta message ID), NO `subject`, NO `body_html`, `media_url: str | None`, `media_type: str | None` ("image", "video", "audio"), `is_echo: bool` (outbound = True).

### `DraftResponse` (existing)

```python
class DraftResponse(BaseModel):
    gmail_thread_state_id: uuid.UUID
    internal_date: datetime
    draft_subject: str | None
    draft_body_text: str | None
    source: Literal["human", "llm"]
```

**IG DM draft** won't have `draft_subject`. Add `ig_dm_thread_state_id: uuid.UUID`, remove `draft_subject`.

---

## 15. Missing Route Areas (Gap Analysis for IG DM)

The following routes do NOT currently exist and must be created for IG DM:

| Route | Purpose |
|-------|---------|
| `GET /webhooks/instagram/` | Meta webhook verification |
| `POST /webhooks/instagram/` | Meta webhook event receipt |
| `POST /api/v1/ig-dm-accounts` | Connect IG account (Meta OAuth callback handler) |
| `GET /api/v1/ig-dm-accounts` | List connected IG accounts |
| `DELETE /api/v1/ig-dm-accounts/{id}` | Disconnect IG account |
| `GET /api/ig-dm/threads/` | List IG DM threads |
| `GET /api/ig-dm/threads/{id}/messages` | List messages in DM thread |
| `POST /api/ig-dm/threads/{id}/reply` | Send DM reply |
| `GET /api/ig-dm/threads/{id}/draft` | Get DM draft |
| `POST /api/ig-dm/threads/{id}/draft` | Create/update DM draft |
| `PUT /api/ig-dm/threads/{id}/draft` | Update DM draft |

**Webhook routes** are mounted separately from `api_router` or as a sub-router without `/api` prefix (to keep the URL clean as `https://domain.com/webhooks/instagram/`). The existing Slack webhook is under `/api/slack/` which is fine for internal use. For Meta, the webhook URL must be configured in Meta's developer portal — using `/webhooks/instagram/` as a clean path is conventional.

**Decision for spec:** Webhook routes should be mounted directly on the app (not under `api_router`):
```python
app.include_router(ig_dm_webhook_router, prefix="/webhooks")
```

This gives `POST /webhooks/instagram/` as the Meta callback URL.

---

## Files

### Files Audited

- `projects/cheerful/apps/backend/main.py`
- `projects/cheerful/apps/backend/src/api/router.py`
- `projects/cheerful/apps/backend/src/api/route/gmail_message.py`
- `projects/cheerful/apps/backend/src/api/route/draft.py`
- `projects/cheerful/apps/backend/src/api/route/email.py`
- `projects/cheerful/apps/backend/src/api/route/email_dispatch.py`
- `projects/cheerful/apps/backend/src/api/route/smtp_account.py`
- `projects/cheerful/apps/backend/src/api/route/slack.py`
- `projects/cheerful/apps/backend/src/api/route/user.py`
- `projects/cheerful/apps/backend/src/api/route/email_signature.py`
- `projects/cheerful/apps/backend/src/api/route/service.py`
- `projects/cheerful/apps/backend/src/api/dependencies/auth.py`
- `projects/cheerful/apps/backend/src/api/dependencies/service_auth.py`
- `projects/cheerful/apps/backend/src/models/api/gmail_message.py`
- `projects/cheerful/apps/backend/src/models/api/smtp_account.py`
- `projects/cheerful/apps/backend/src/models/api/draft.py`
- `projects/cheerful/apps/backend/src/models/api/user.py`

### Files to Create (IG DM — future phases)

- `apps/backend/src/api/route/ig_dm_webhook.py` — Meta webhook handler
- `apps/backend/src/api/route/ig_dm_account.py` — IG DM account CRUD
- `apps/backend/src/api/route/ig_dm_thread.py` — IG DM thread/message/draft/reply routes
- `apps/backend/src/models/api/ig_dm_account.py` — Pydantic API models for IG DM accounts
- `apps/backend/src/models/api/ig_dm_thread.py` — Pydantic API models for IG DM threads/messages
- `apps/backend/src/models/api/ig_dm_draft.py` — Pydantic API models for IG DM drafts
