# Spec: API Contracts — Instagram DM Support

**Aspect**: `spec-api-contracts`
**Wave**: 2 — Schema & Interface Design
**Date**: 2026-03-01
**Input files**:
- `analysis/audit/api-routes.md` — exact current API patterns, auth, routing
- `analysis/audit/backend-services.md` — service patterns, DI, credential flow
- `analysis/spec/db-migrations.md` — new tables, modified tables
- `analysis/spec/pydantic-models.md` — all request/response models
- `../cheerful-ig-dm-reverse/analysis/option-direct-meta-api.md` — webhook/API design
- `../cheerful-ig-dm-reverse/analysis/meta-instagram-messaging-api.md` — Meta API capabilities
- `../cheerful-ig-dm-reverse/analysis/meta-webhooks-realtime.md` — webhook payload shapes
- Codebase reads: `main.py`, `router.py`, `slack.py`, `smtp_account.py`, `service.py`

---

## Files

### New Files

| Action | Path |
|--------|------|
| CREATE | `apps/backend/src/api/route/ig_dm_webhook.py` |
| CREATE | `apps/backend/src/api/route/ig_dm_account.py` |
| CREATE | `apps/backend/src/api/route/ig_dm_thread.py` |

### Modified Files

| Action | Path | What Changes |
|--------|------|-------------|
| MODIFY | `apps/backend/src/api/router.py` | Import and mount `ig_dm_account_router`, `ig_dm_thread_router` |
| MODIFY | `apps/backend/main.py` | Import and mount `ig_dm_webhook_router` at `/webhooks` (app-level, NOT under `/api`) |
| MODIFY | `apps/backend/src/api/route/service.py` | Add 4 new service-to-service routes for IG DM data (context engine access) |

---

## Route Mounting

### `main.py` Changes

The webhook handler is mounted directly on the app (not under `/api`) to give a clean public URL for Meta's developer portal configuration.

```python
# In main.py, after existing `app.include_router(api_router, prefix="/api")`:

from src.api.route.ig_dm_webhook import router as ig_dm_webhook_router

app.include_router(ig_dm_webhook_router, prefix="/webhooks")
```

This produces:
- `GET /webhooks/instagram/` — Meta webhook verification
- `POST /webhooks/instagram/` — Meta webhook event receipt

### `router.py` Changes

IG DM account and thread routes mount under `/api` via the existing `api_router`:

```python
# In router.py, add imports:
from src.api.route.ig_dm_account import router as ig_dm_account_router
from src.api.route.ig_dm_thread import router as ig_dm_thread_router

# Add inclusions (following SMTP/shopify pattern with /v1 prefix):
api_router.include_router(
    ig_dm_account_router, prefix="/v1", tags=["ig-dm-accounts"]
)
api_router.include_router(ig_dm_thread_router)
```

This produces:
- `/api/v1/ig-dm-accounts/*` — account CRUD
- `/api/ig-dm/threads/*` — thread/message/draft/reply routes

---

## Route Overview

| # | Method | URL | Auth | File | Purpose |
|---|--------|-----|------|------|---------|
| 1 | GET | `/webhooks/instagram/` | None (Meta hub.challenge) | `ig_dm_webhook.py` | Webhook verification |
| 2 | POST | `/webhooks/instagram/` | HMAC-SHA256 (X-Hub-Signature-256) | `ig_dm_webhook.py` | Webhook event receipt |
| 3 | POST | `/api/v1/ig-dm-accounts` | Bearer JWT | `ig_dm_account.py` | Connect IG account (OAuth callback) |
| 4 | GET | `/api/v1/ig-dm-accounts` | Bearer JWT | `ig_dm_account.py` | List user's IG accounts |
| 5 | GET | `/api/v1/ig-dm-accounts/{id}` | Bearer JWT | `ig_dm_account.py` | Get single IG account |
| 6 | PATCH | `/api/v1/ig-dm-accounts/{id}` | Bearer JWT | `ig_dm_account.py` | Update IG account |
| 7 | DELETE | `/api/v1/ig-dm-accounts/{id}` | Bearer JWT | `ig_dm_account.py` | Disconnect IG account |
| 8 | GET | `/api/ig-dm/threads` | Bearer JWT | `ig_dm_thread.py` | List DM threads |
| 9 | GET | `/api/ig-dm/threads/{ig_conversation_id}/messages` | Bearer JWT | `ig_dm_thread.py` | List messages in thread |
| 10 | POST | `/api/ig-dm/threads/{ig_conversation_id}/reply` | Bearer JWT | `ig_dm_thread.py` | Send DM reply |
| 11 | GET | `/api/ig-dm/threads/{ig_conversation_id}/draft` | Bearer JWT | `ig_dm_thread.py` | Get DM draft |
| 12 | POST | `/api/ig-dm/threads/{ig_conversation_id}/draft` | Bearer JWT | `ig_dm_thread.py` | Create DM draft |
| 13 | PUT | `/api/ig-dm/threads/{ig_conversation_id}/draft` | Bearer JWT | `ig_dm_thread.py` | Update DM draft |
| 14 | GET | `/api/service/ig-dm/threads/search` | X-Service-Api-Key | `service.py` | Search DM threads (CE) |
| 15 | GET | `/api/service/ig-dm/threads/{ig_conversation_id}` | X-Service-Api-Key | `service.py` | Get DM thread detail (CE) |
| 16 | GET | `/api/service/ig-dm/accounts` | X-Service-Api-Key | `service.py` | List IG accounts for user (CE) |
| 17 | POST | `/api/service/ig-dm/threads/{ig_conversation_id}/reply` | X-Service-Api-Key | `service.py` | Send DM reply (CE) |

---

## 1. Webhook Verification — `GET /webhooks/instagram/`

**File**: `apps/backend/src/api/route/ig_dm_webhook.py`
**Auth**: None (public endpoint for Meta's verification challenge)

### Signature

```python
from fastapi import APIRouter, Query, Response

router = APIRouter(prefix="/instagram", tags=["ig-dm-webhook"])


@router.get("/")
async def verify_webhook(
    hub_mode: str = Query(alias="hub.mode"),
    hub_verify_token: str = Query(alias="hub.verify_token"),
    hub_challenge: str = Query(alias="hub.challenge"),
) -> Response:
    """Meta webhook verification endpoint.

    Meta sends a GET request with hub.mode=subscribe, hub.verify_token=(our token),
    and hub.challenge=(random string). Return the challenge as plain text if valid.

    Behavior:
    - Compare hub_verify_token against settings.INSTAGRAM_WEBHOOK_VERIFY_TOKEN
    - If match: return hub_challenge as text/plain with 200
    - If mismatch: return 403
    """
```

### Request

| Parameter | Source | Type | Required |
|-----------|--------|------|----------|
| `hub.mode` | query | `str` | Yes |
| `hub.verify_token` | query | `str` | Yes |
| `hub.challenge` | query | `str` | Yes |

### Response

| Status | Content-Type | Body |
|--------|-------------|------|
| 200 | `text/plain` | Echo of `hub.challenge` value |
| 403 | `application/json` | `{"detail": "Invalid verify token"}` |

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` | Shared secret set in Meta App → Webhooks configuration. Arbitrary string. |

---

## 2. Webhook Event Receipt — `POST /webhooks/instagram/`

**File**: `apps/backend/src/api/route/ig_dm_webhook.py`
**Auth**: HMAC-SHA256 via `X-Hub-Signature-256` header

### Signature

```python
from fastapi import BackgroundTasks, HTTPException, Request

from src.models.meta.webhook import MetaWebhookPayload


@router.post("/")
async def receive_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
) -> dict:
    """Receive Meta webhook event. MUST return 200 immediately.

    Behavior:
    1. Read raw request body bytes
    2. Verify X-Hub-Signature-256 HMAC-SHA256 signature
       - signature format: "sha256={hex_digest}"
       - key: settings.INSTAGRAM_APP_SECRET
       - If invalid: return 200 anyway (Meta retries on non-200; log the failure)
    3. Parse JSON body into MetaWebhookPayload
    4. For each entry in payload.entry:
       a. For each messaging event in entry.messaging:
          - Skip if event.message is None (delivery/read receipts, not messages)
          - Look up UserIgDmAccount by entry.id (= instagram_business_account_id)
          - If no matching account found: log warning and skip
          - If ENABLE_IG_DM feature flag is disabled: log and skip
          b. Add BackgroundTask: dispatch_ig_dm_ingest(event, account)
    5. Return {"ok": True} immediately (before background tasks run)

    Background task dispatch_ig_dm_ingest:
    - Constructs IgDmIngestInput from webhook event
    - Starts IgDmIngestWorkflow via Temporal client
    - Workflow ID: f"ig-dm-ingest-{account.id}-{event.message.mid}"
       (idempotent — duplicate starts are no-ops)
    """
```

### Request

| Header | Value |
|--------|-------|
| `X-Hub-Signature-256` | `sha256={HMAC-SHA256 hex digest of body using INSTAGRAM_APP_SECRET}` |
| `Content-Type` | `application/json` |

Body: `MetaWebhookPayload` (see `spec-pydantic-models.md §6`)

### Response

| Status | Body |
|--------|------|
| 200 | `{"ok": true}` |

**Critical**: ALWAYS return 200, even if signature verification fails or parsing errors occur. Meta retries on non-200 responses with exponential backoff, which can cause duplicate processing storms. Log failures for alerting, but never return 4xx/5xx.

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `INSTAGRAM_APP_SECRET` | Meta App Secret (from Meta App Dashboard → Settings → Basic). Used for HMAC-SHA256 signature verification. |
| `ENABLE_IG_DM` | Feature flag. When `"false"` (default), webhook events are logged but not processed. |

### HMAC Verification Pattern

Follows the existing Slack pattern (`slack.py:29-54`) adapted for Meta's format:

```python
import hashlib
import hmac

def _verify_meta_signature(body: bytes, signature_header: str | None) -> bool:
    """Verify X-Hub-Signature-256 from Meta webhook.

    Args:
        body: Raw request body bytes.
        signature_header: Value of X-Hub-Signature-256 header (format: "sha256=<hex>").

    Returns:
        True if signature is valid, False otherwise.
    """
    # signature_header format: "sha256={hex_digest}"
    # Extract hex digest after "sha256=" prefix
    # Compute: hmac.new(settings.INSTAGRAM_APP_SECRET.encode(), body, hashlib.sha256).hexdigest()
    # Compare with hmac.compare_digest() (constant-time)
```

---

## 3. Connect IG Account — `POST /api/v1/ig-dm-accounts`

**File**: `apps/backend/src/api/route/ig_dm_account.py`
**Auth**: `get_current_user` (Bearer JWT)
**Status**: `201 Created`

### Signature

```python
from fastapi import APIRouter, Depends, HTTPException, status

from src.api.dependencies.auth import get_current_user
from src.models.api.ig_dm_account import IgDmAccountConnectRequest, IgDmAccountResponse

router = APIRouter(prefix="/ig-dm-accounts", tags=["ig-dm-accounts"])


@router.post(
    "",
    response_model=IgDmAccountResponse,
    status_code=status.HTTP_201_CREATED,
)
async def connect_ig_dm_account(
    request: IgDmAccountConnectRequest,
    current_user: dict = Depends(get_current_user),
) -> IgDmAccountResponse:
    """Complete Meta OAuth flow and connect an Instagram Business Account.

    Behavior:
    1. Extract user_id from current_user
    2. Exchange authorization code for short-lived user access token
       - POST https://graph.facebook.com/v21.0/oauth/access_token
         ?client_id={INSTAGRAM_APP_ID}
         &client_secret={INSTAGRAM_APP_SECRET}
         &redirect_uri={request.redirect_uri}
         &code={request.code}
    3. Exchange short-lived token for long-lived user token
       - GET https://graph.facebook.com/v21.0/oauth/access_token
         ?grant_type=fb_exchange_token
         &client_id={INSTAGRAM_APP_ID}
         &client_secret={INSTAGRAM_APP_SECRET}
         &fb_exchange_token={short_lived_token}
    4. Get user's Facebook Pages
       - GET https://graph.facebook.com/v21.0/me/accounts?access_token={long_lived_token}
    5. For each Page, get the linked Instagram Business Account
       - GET https://graph.facebook.com/v21.0/{page_id}
         ?fields=instagram_business_account
         &access_token={page_access_token}
    6. Get the Page Access Token (permanent, no expiry when using long-lived user token)
       - page_access_token from step 4 response
    7. Get IG account metadata
       - GET https://graph.facebook.com/v21.0/{ig_business_account_id}
         ?fields=username
         &access_token={page_access_token}
    8. Check for duplicate: uq_user_ig_dm_account(user_id, instagram_business_account_id)
       - If active duplicate exists: return 409
       - If inactive duplicate exists: reactivate with new tokens (SMTP pattern)
    9. Store in user_ig_dm_account table
    10. Start IgDmInitialSyncWorkflow via Temporal (one-time historical import)
    11. Subscribe to webhooks for this page
        - POST https://graph.facebook.com/v21.0/{page_id}/subscribed_apps
          ?subscribed_fields=messages
          &access_token={page_access_token}
    12. Return IgDmAccountResponse (excludes access_token)
    """
```

### Request Body

```python
class IgDmAccountConnectRequest(BaseModel):
    code: str
    # Authorization code from Meta OAuth redirect
    redirect_uri: str
    # Must match the redirect_uri used in the initial OAuth URL
```

### Response (201)

```python
class IgDmAccountResponse(BaseModel):
    id: uuid.UUID
    instagram_business_account_id: str
    facebook_page_id: str
    ig_username: str
    token_type: str
    access_token_expires_at: datetime
    webhook_subscribed: bool
    webhook_subscribed_at: datetime | None
    initial_sync_completed: bool
    is_active: bool
    last_verified_at: datetime | None
    verification_error: str | None
    created_at: datetime
```

### Error Responses

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Invalid authorization code / Meta API error | `{"detail": "Failed to exchange authorization code: {meta_error}"}` |
| 409 | IG account already connected (active) | `{"detail": "Instagram account @{username} is already connected"}` |
| 422 | Missing required fields | Standard Pydantic validation error |

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `INSTAGRAM_APP_ID` | Meta App ID (from Meta App Dashboard) |
| `INSTAGRAM_APP_SECRET` | Meta App Secret (also used for webhook HMAC) |

---

## 4. List IG Accounts — `GET /api/v1/ig-dm-accounts`

**File**: `apps/backend/src/api/route/ig_dm_account.py`
**Auth**: `get_current_user`

### Signature

```python
@router.get("", response_model=list[IgDmAccountResponse])
async def list_ig_dm_accounts(
    current_user: dict = Depends(get_current_user),
) -> list[IgDmAccountResponse]:
    """List all connected Instagram DM accounts for the authenticated user.

    Behavior:
    1. Extract user_id from current_user
    2. Query user_ig_dm_account WHERE user_id = :user_id AND is_active = TRUE
    3. Return list of IgDmAccountResponse
    """
```

### Response (200)

```json
[
  {
    "id": "uuid",
    "instagram_business_account_id": "17841400000123456",
    "facebook_page_id": "123456789",
    "ig_username": "brandname",
    "token_type": "page",
    "access_token_expires_at": "2026-04-30T00:00:00Z",
    "webhook_subscribed": true,
    "webhook_subscribed_at": "2026-03-01T00:00:00Z",
    "initial_sync_completed": true,
    "is_active": true,
    "last_verified_at": "2026-03-01T12:00:00Z",
    "verification_error": null,
    "created_at": "2026-03-01T00:00:00Z"
  }
]
```

---

## 5. Get IG Account — `GET /api/v1/ig-dm-accounts/{account_id}`

**File**: `apps/backend/src/api/route/ig_dm_account.py`
**Auth**: `get_current_user`

### Signature

```python
@router.get("/{account_id}", response_model=IgDmAccountResponse)
async def get_ig_dm_account(
    account_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
) -> IgDmAccountResponse:
    """Get a specific IG DM account. Returns 404 if not found, 403 if not owned.

    Behavior:
    - Same ownership check as SMTP pattern (smtp_account.py:514-538)
    """
```

### Error Responses

| Status | Condition |
|--------|-----------|
| 404 | `{"detail": "IG DM account not found"}` |
| 403 | `{"detail": "Not authorized to access this IG DM account"}` |

---

## 6. Update IG Account — `PATCH /api/v1/ig-dm-accounts/{account_id}`

**File**: `apps/backend/src/api/route/ig_dm_account.py`
**Auth**: `get_current_user`

### Signature

```python
@router.patch("/{account_id}", response_model=IgDmAccountResponse)
async def update_ig_dm_account(
    account_id: uuid.UUID,
    request: IgDmAccountUpdateRequest,
    current_user: dict = Depends(get_current_user),
) -> IgDmAccountResponse:
    """Update IG DM account settings (currently only deactivation).

    Behavior:
    - Ownership check (same as SMTP pattern)
    - Apply IgDmAccountUpdateRequest fields (is_active)
    - If deactivating: unsubscribe webhooks for the page
    - Commit and return updated account
    """
```

### Request Body

```python
class IgDmAccountUpdateRequest(BaseModel):
    is_active: bool | None = None
```

---

## 7. Delete IG Account — `DELETE /api/v1/ig-dm-accounts/{account_id}`

**File**: `apps/backend/src/api/route/ig_dm_account.py`
**Auth**: `get_current_user`
**Status**: `204 No Content`

### Signature

```python
@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ig_dm_account(
    account_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
) -> None:
    """Disconnect an IG DM account. Hard delete (same as SMTP pattern).

    Behavior:
    1. Ownership check
    2. Unsubscribe webhooks for the page
       - DELETE https://graph.facebook.com/v21.0/{page_id}/subscribed_apps
         ?access_token={page_access_token}
    3. Delete the user_ig_dm_account row (CASCADE deletes ig_dm_message,
       ig_dm_thread_state, ig_dm_llm_draft, latest_ig_dm_message_per_thread)
    4. Remove campaign_sender rows referencing this ig_dm_account_id
    5. Nullify campaign_thread.ig_dm_account_id / ig_dm_thread_id for affected threads
    """
```

### Error Responses

| Status | Condition |
|--------|-----------|
| 404 | `{"detail": "IG DM account not found"}` |
| 403 | `{"detail": "Not authorized to delete this IG DM account"}` |

---

## 8. List DM Threads — `GET /api/ig-dm/threads`

**File**: `apps/backend/src/api/route/ig_dm_thread.py`
**Auth**: `get_current_user`

### Signature

```python
from fastapi import APIRouter, Depends, Query

from src.models.api.ig_dm_message import IgDmThreadSummary
from src.models.database.gmail_thread_state import GmailThreadStatus
from src.models.database.gmail_message import GmailMessageDirection

router = APIRouter(prefix="/ig-dm", tags=["ig-dm-threads"])


@router.get("/threads", response_model=list[IgDmThreadSummary])
async def list_ig_dm_threads(
    current_user: dict = Depends(get_current_user),
    status_filter: list[GmailThreadStatus] | None = Query(None),
    direction_filter: GmailMessageDirection | None = Query(None),
    campaign_id: uuid.UUID | None = Query(None),
    campaign_ids: list[uuid.UUID] | None = Query(None),
    ig_dm_account_ids: list[uuid.UUID] | None = Query(None),
    show_hidden: bool = Query(False),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    search: str | None = Query(None),
    include_uncategorized: bool = Query(False),
    only_uncategorized: bool = Query(False),
) -> list[IgDmThreadSummary]:
    """List IG DM threads for the authenticated user.

    Follows the same query pattern as GET /api/threads (gmail_message.py:115-489)
    but queries ig_dm_thread_state, latest_ig_dm_message_per_thread, campaign_thread,
    and campaign_creator.

    Behavior:
    1. Extract user_id from current_user
    2. Query latest ig_dm_thread_state per conversation (MAX(latest_internal_date))
    3. Join latest_ig_dm_message_per_thread for snippet/direction
    4. Join campaign_thread WHERE ig_dm_thread_id IS NOT NULL for campaign_id
    5. Apply filters (status_filter, direction_filter, campaign_id, etc.)
    6. If search: filter by ig_igsid_cache.username ILIKE or ig_dm_message.body_text ILIKE
    7. Authorization: only threads from IG accounts owned by user OR
       campaigns user is assigned to (can_access_campaign)
    8. Order by latest_message_sent_at DESC
    9. Apply LIMIT/OFFSET pagination
    10. Enrich with campaign_creator fields (gifting_status, paid_promotion_status)
        via ig_igsid_cache.username → campaign_creator.social_media_handles join
    """
```

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status_filter` | `list[GmailThreadStatus] \| None` | None | Filter by thread status |
| `direction_filter` | `GmailMessageDirection \| None` | None | INBOUND or OUTBOUND |
| `campaign_id` | `uuid.UUID \| None` | None | Filter by single campaign |
| `campaign_ids` | `list[uuid.UUID] \| None` | None | Filter by multiple campaigns |
| `ig_dm_account_ids` | `list[uuid.UUID] \| None` | None | Filter by IG DM accounts |
| `show_hidden` | `bool` | False | Include hidden threads |
| `limit` | `int` | 50 (max 100) | Pagination |
| `offset` | `int` | 0 | Pagination |
| `search` | `str \| None` | None | Search in sender username / message text |
| `include_uncategorized` | `bool` | False | Include threads without campaign |
| `only_uncategorized` | `bool` | False | Only show threads without campaign |

### Response (200)

```json
[
  {
    "ig_conversation_id": "t_10158012345678901",
    "ig_dm_thread_state_id": "uuid",
    "ig_dm_account_id": "uuid",
    "status": "WAITING_FOR_DRAFT_REVIEW",
    "latest_message_sent_at": "2026-03-01T15:30:00Z",
    "latest_direction": "INBOUND",
    "snippet": "Hi! I'd love to collaborate on your campaign...",
    "sender_igsid": "17841400000123456",
    "sender_username": "janedoe_creator",
    "campaign_id": "uuid-or-null",
    "window_expires_at": "2026-03-02T15:30:00Z",
    "gifting_status": "pending",
    "paid_promotion_status": null
  }
]
```

---

## 9. Get DM Thread Messages — `GET /api/ig-dm/threads/{ig_conversation_id}/messages`

**File**: `apps/backend/src/api/route/ig_dm_thread.py`
**Auth**: `get_current_user`

### Signature

```python
from src.models.api.ig_dm_message import IgDmThreadView


@router.get(
    "/threads/{ig_conversation_id}/messages",
    response_model=IgDmThreadView,
)
async def get_ig_dm_thread_messages(
    ig_conversation_id: str,
    ig_dm_account_id: uuid.UUID = Query(..., description="IG DM account UUID"),
    current_user: dict = Depends(get_current_user),
) -> IgDmThreadView:
    """Get full DM thread with all messages.

    Requires ig_dm_account_id as query param because ig_conversation_id is only
    unique within an account (not globally).

    Behavior:
    1. Verify user owns ig_dm_account_id
    2. Query ig_dm_message WHERE ig_dm_account_id = :id
       AND ig_conversation_id = :conv_id ORDER BY sent_at ASC
    3. Query latest ig_dm_thread_state for status/window info
    4. Query ig_dm_llm_draft for current state (if available)
    5. Join campaign_thread for campaign_id
    6. Return IgDmThreadView with messages, status, draft, window state
    """
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `ig_conversation_id` | `str` | Meta conversation ID (e.g. `"t_10158012345678901"`) |

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ig_dm_account_id` | `uuid.UUID` | Yes | IG DM account that owns this conversation |

### Response (200)

Full `IgDmThreadView` (see `spec-pydantic-models.md §8`):

```json
{
  "ig_conversation_id": "t_10158012345678901",
  "ig_dm_thread_state_id": "uuid",
  "ig_dm_account_id": "uuid",
  "ig_username": "brandname",
  "status": "WAITING_FOR_DRAFT_REVIEW",
  "latest_message_sent_at": "2026-03-01T15:30:00Z",
  "latest_direction": "INBOUND",
  "snippet": "Hi! I'd love to collaborate...",
  "sender_igsid": "17841400000123456",
  "sender_username": "janedoe_creator",
  "campaign_id": "uuid",
  "window_expires_at": "2026-03-02T15:30:00Z",
  "window_is_active": true,
  "messages": [
    {
      "id": "uuid",
      "mid": "mid.1234567890",
      "ig_conversation_id": "t_10158012345678901",
      "sender_igsid": "17841400000123456",
      "sender_username": "janedoe_creator",
      "recipient_igsid": "17841400000654321",
      "direction": "INBOUND",
      "is_echo": false,
      "body_text": "Hi! I'd love to collaborate on your campaign...",
      "message_type": "text",
      "media_storage_paths": null,
      "media_original_urls": null,
      "sent_at": "2026-03-01T15:30:00Z",
      "received_at": "2026-03-01T15:30:02Z",
      "reply_to_mid": null
    }
  ],
  "llm_draft": "Thanks for reaching out! We'd love to have you...",
  "gifting_status": "pending",
  "paid_promotion_status": null
}
```

### Error Responses

| Status | Condition |
|--------|-----------|
| 404 | `{"detail": "DM thread not found"}` |
| 403 | `{"detail": "Not authorized to access this DM thread"}` |

---

## 10. Send DM Reply — `POST /api/ig-dm/threads/{ig_conversation_id}/reply`

**File**: `apps/backend/src/api/route/ig_dm_thread.py`
**Auth**: `get_current_user`

### Signature

```python
from src.models.api.ig_dm_message import IgDmReplyRequest, IgDmReplyResponse


@router.post(
    "/threads/{ig_conversation_id}/reply",
    response_model=IgDmReplyResponse,
)
async def send_ig_dm_reply(
    ig_conversation_id: str,
    request: IgDmReplyRequest,
    ig_dm_account_id: uuid.UUID = Query(..., description="IG DM account UUID"),
    current_user: dict = Depends(get_current_user),
) -> IgDmReplyResponse:
    """Send a DM reply in an existing conversation.

    Behavior:
    1. Verify user owns ig_dm_account_id
    2. Validate: at least one of message_text or media_url must be provided
    3. Look up latest ig_dm_thread_state for this conversation
    4. Check 24h window: if window_expires_at <= now(), return 409
       (window expired — cannot send)
    5. Look up recipient_igsid from the conversation (the other party's IGSID)
    6. Start IgDmSendReplyWorkflow via Temporal
       - Workflow ID: f"ig-dm-reply-{ig_dm_account_id}-{ig_conversation_id}-{uuid4()}"
    7. Await workflow result (synchronous for UX — user sees send confirmation)
    8. Return IgDmReplyResponse with sent_mid and stored_message_id
    """
```

### Request Body

```python
class IgDmReplyRequest(BaseModel):
    message_text: str | None = None
    # At least one of message_text or media_url required
    media_url: str | None = None
    # Supabase Storage URL for image/video to send
```

### Response (200)

```json
{
  "sent_mid": "mid.0987654321",
  "stored_message_id": "uuid"
}
```

### Error Responses

| Status | Condition | Body |
|--------|-----------|------|
| 409 | 24h messaging window expired | `{"detail": "DM window expired", "window_expires_at": "2026-03-01T15:30:00Z"}` |
| 422 | Neither message_text nor media_url provided | `{"detail": "At least one of message_text or media_url is required"}` |
| 404 | Thread not found | `{"detail": "DM thread not found"}` |
| 403 | Not authorized | `{"detail": "Not authorized to reply in this DM thread"}` |
| 502 | Meta API send failure | `{"detail": "Failed to send DM: {meta_error_message}"}` |

---

## 11. Get DM Draft — `GET /api/ig-dm/threads/{ig_conversation_id}/draft`

**File**: `apps/backend/src/api/route/ig_dm_thread.py`
**Auth**: `get_current_user`

### Signature

```python
from src.models.api.ig_dm_message import IgDmDraftResponse


@router.get(
    "/threads/{ig_conversation_id}/draft",
    response_model=IgDmDraftResponse,
)
async def get_ig_dm_draft(
    ig_conversation_id: str,
    ig_dm_account_id: uuid.UUID = Query(..., description="IG DM account UUID"),
    current_user: dict = Depends(get_current_user),
) -> IgDmDraftResponse:
    """Get the AI draft for a DM thread (if available).

    Behavior:
    1. Verify user owns ig_dm_account_id
    2. Look up latest ig_dm_thread_state for conversation
    3. Query ig_dm_llm_draft WHERE ig_dm_thread_state_id = latest state ID
    4. If no draft: return 404
    5. Return IgDmDraftResponse
    """
```

### Response (200)

```python
class IgDmDraftResponse(BaseModel):
    ig_dm_thread_state_id: uuid.UUID
    ig_conversation_id: str
    draft_body_text: str
    source: Literal["llm"] = "llm"
    # DM drafts are always LLM-generated (no "human" UI draft for DMs in MVP)
    created_at: datetime
```

**Note**: This is a NEW model not yet in `spec-pydantic-models.md`. Add to `apps/backend/src/models/api/ig_dm_message.py`:

```python
class IgDmDraftResponse(BaseModel):
    ig_dm_thread_state_id: uuid.UUID
    ig_conversation_id: str
    draft_body_text: str
    source: Literal["llm"] = "llm"
    created_at: datetime
```

### Error Responses

| Status | Condition |
|--------|-----------|
| 404 | `{"detail": "No draft available for this thread"}` |
| 403 | `{"detail": "Not authorized to access this DM thread"}` |

---

## 12. Create DM Draft — `POST /api/ig-dm/threads/{ig_conversation_id}/draft`

**File**: `apps/backend/src/api/route/ig_dm_thread.py`
**Auth**: `get_current_user`
**Status**: `201 Created`

### Signature

```python
@router.post(
    "/threads/{ig_conversation_id}/draft",
    response_model=IgDmDraftResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_ig_dm_draft(
    ig_conversation_id: str,
    request: IgDmDraftCreateRequest,
    ig_dm_account_id: uuid.UUID = Query(..., description="IG DM account UUID"),
    current_user: dict = Depends(get_current_user),
) -> IgDmDraftResponse:
    """Manually create a draft for a DM thread.

    This is primarily used by the context engine to store an edited draft
    before approving it. AI drafts are created by the coordinator workflow,
    not this endpoint.

    Behavior:
    1. Verify user owns ig_dm_account_id
    2. Look up latest ig_dm_thread_state
    3. Validate ig_dm_thread_state_id in request matches current state
       - If mismatch: return 409 (same race condition handling as email draft.py:78-144)
    4. Insert ig_dm_llm_draft row
    5. Return IgDmDraftResponse with 201
    """
```

### Request Body

```python
class IgDmDraftCreateRequest(BaseModel):
    ig_dm_thread_state_id: uuid.UUID
    # Must match the current (latest) ig_dm_thread_state.id — race condition guard
    draft_body_text: str
```

**Note**: Add `IgDmDraftCreateRequest` to `apps/backend/src/models/api/ig_dm_message.py`.

### Error Responses

| Status | Condition | Body |
|--------|-----------|------|
| 409 | Thread state version mismatch | `{"error": "version_mismatch", "latest_ig_dm_thread_state_id": "uuid", "latest_internal_date": "datetime"}` |
| 404 | Thread not found | `{"detail": "DM thread not found"}` |

---

## 13. Update DM Draft — `PUT /api/ig-dm/threads/{ig_conversation_id}/draft`

**File**: `apps/backend/src/api/route/ig_dm_thread.py`
**Auth**: `get_current_user`

### Signature

```python
@router.put(
    "/threads/{ig_conversation_id}/draft",
    response_model=IgDmDraftResponse,
)
async def update_ig_dm_draft(
    ig_conversation_id: str,
    request: IgDmDraftUpdateRequest,
    ig_dm_account_id: uuid.UUID = Query(..., description="IG DM account UUID"),
    current_user: dict = Depends(get_current_user),
) -> IgDmDraftResponse:
    """Update an existing DM draft.

    Behavior:
    1. Verify user owns ig_dm_account_id
    2. Look up existing ig_dm_llm_draft for latest state
    3. If no draft exists: return 404
    4. Update draft_body_text
    5. Return updated IgDmDraftResponse
    """
```

### Request Body

```python
class IgDmDraftUpdateRequest(BaseModel):
    draft_body_text: str
```

**Note**: Add `IgDmDraftUpdateRequest` to `apps/backend/src/models/api/ig_dm_message.py`.

---

## 14–17. Service-to-Service Routes (Context Engine Access)

**File**: `apps/backend/src/api/route/service.py` (existing file, add routes)
**Auth**: `X-Service-Api-Key` header (router-level dependency, already applied)

These routes enable the context engine to access IG DM data. They follow the exact same pattern as existing service routes (`/service/threads/search`, `/service/threads/{id}`, etc.) and are added to the existing `service.py` router.

### 14. Search DM Threads — `GET /api/service/ig-dm/threads/search`

```python
from src.models.api.service import (
    ServiceIgDmThreadSearchResult,  # NEW model
)


@router.get(
    "/ig-dm/threads/search",
    response_model=list[ServiceIgDmThreadSearchResult],
)
def search_ig_dm_threads(
    campaign_id: uuid.UUID = Query(..., description="Campaign UUID"),
    query: str = Query(..., description="Search text"),
    limit: int = Query(20, le=50, description="Max results"),
) -> list[ServiceIgDmThreadSearchResult]:
    """Full-text search across IG DM messages in a campaign.

    Behavior:
    1. Query ig_dm_message + campaign_thread WHERE campaign_thread.campaign_id = :campaign_id
    2. Filter by body_text ILIKE %:query% OR ig_igsid_cache.username ILIKE %:query%
    3. Group by ig_conversation_id, order by latest sent_at DESC
    4. Return list of ServiceIgDmThreadSearchResult
    """
```

### Response Model (NEW — add to `src/models/api/service.py`)

```python
class ServiceIgDmThreadSearchResult(BaseModel):
    ig_conversation_id: str
    ig_dm_account_id: str
    sender_igsid: str
    sender_username: str | None
    campaign_id: str
    latest_message_text: str | None
    latest_date: str  # ISO 8601
    message_count: int
    status: str
    window_expires_at: str | None  # ISO 8601 or None
```

---

### 15. Get DM Thread Detail — `GET /api/service/ig-dm/threads/{ig_conversation_id}`

```python
from src.models.api.service import ServiceIgDmThreadDetailResponse  # NEW


@router.get(
    "/ig-dm/threads/{ig_conversation_id}",
    response_model=ServiceIgDmThreadDetailResponse,
)
def get_ig_dm_thread(
    ig_conversation_id: str,
    ig_dm_account_id: uuid.UUID = Query(..., description="IG DM account UUID"),
) -> ServiceIgDmThreadDetailResponse:
    """Get full IG DM thread with all messages (for context engine).

    Behavior:
    1. Query ig_dm_message WHERE ig_dm_account_id = :id
       AND ig_conversation_id = :conv_id ORDER BY sent_at ASC
    2. Query ig_dm_thread_state for current status and window info
    3. Query ig_dm_llm_draft for current draft (if any)
    4. Query campaign_thread for campaign_id
    5. Return ServiceIgDmThreadDetailResponse
    """
```

### Response Model (NEW — add to `src/models/api/service.py`)

```python
class ServiceIgDmMessage(BaseModel):
    mid: str
    direction: str
    sender_igsid: str
    sender_username: str | None
    body_text: str | None
    message_type: str
    sent_at: str  # ISO 8601
    is_echo: bool


class ServiceIgDmThreadDetailResponse(BaseModel):
    ig_conversation_id: str
    ig_dm_account_id: str
    status: str
    window_expires_at: str | None
    window_is_active: bool
    campaign_id: str | None
    sender_igsid: str
    sender_username: str | None
    messages: list[ServiceIgDmMessage]
    llm_draft: str | None
```

---

### 16. List IG Accounts (CE) — `GET /api/service/ig-dm/accounts`

```python
@router.get(
    "/ig-dm/accounts",
    response_model=list[ServiceIgDmAccountResponse],
)
def list_ig_dm_accounts_for_user(
    user_id: uuid.UUID = Query(..., description="Cheerful user ID"),
) -> list[ServiceIgDmAccountResponse]:
    """List connected IG DM accounts for a user (for context engine).

    Behavior:
    1. Query user_ig_dm_account WHERE user_id = :user_id
    2. Return list with account health info (excludes access_token)
    """
```

### Response Model (NEW — add to `src/models/api/service.py`)

```python
class ServiceIgDmAccountResponse(BaseModel):
    id: str
    instagram_business_account_id: str
    ig_username: str
    is_active: bool
    webhook_subscribed: bool
    initial_sync_completed: bool
    access_token_expires_at: str  # ISO 8601
    last_verified_at: str | None
    verification_error: str | None
```

---

### 17. Send DM Reply (CE) — `POST /api/service/ig-dm/threads/{ig_conversation_id}/reply`

```python
from src.models.api.service import ServiceIgDmReplyRequest, ServiceIgDmReplyResponse  # NEW


@router.post(
    "/ig-dm/threads/{ig_conversation_id}/reply",
    response_model=ServiceIgDmReplyResponse,
)
def send_ig_dm_reply_service(
    ig_conversation_id: str,
    request: ServiceIgDmReplyRequest,
) -> ServiceIgDmReplyResponse:
    """Send a DM reply (for context engine).

    Unlike user routes, service routes accept user_id in the request body
    (the CE acts on behalf of a user via the service API key).

    Behavior:
    1. Verify user owns ig_dm_account_id
    2. Check 24h window (same as route #10)
    3. Start IgDmSendReplyWorkflow and await result
    4. Return ServiceIgDmReplyResponse
    """
```

### Request/Response Models (NEW — add to `src/models/api/service.py`)

```python
class ServiceIgDmReplyRequest(BaseModel):
    ig_dm_account_id: str
    user_id: str
    message_text: str | None = None
    media_url: str | None = None


class ServiceIgDmReplyResponse(BaseModel):
    sent_mid: str
    stored_message_id: str
    ig_conversation_id: str
```

---

## Database Session Pattern

All new routes use the existing `get_db_session_context()` pattern:

```python
from src.core.database import get_db_session_context

with get_db_session_context() as db:
    repo = SomeRepository(db)
    result = repo.some_method(...)
    db.commit()  # explicit commit when writing
```

This is consistent with all existing routes (confirmed in `audit-api-routes.md §13.7`).

---

## Authentication Summary

| Route Group | Auth Mechanism | Notes |
|-------------|---------------|-------|
| Webhook (`/webhooks/instagram/`) | HMAC-SHA256 or none | GET has no auth; POST uses X-Hub-Signature-256 |
| User routes (`/api/v1/ig-dm-accounts/*`, `/api/ig-dm/*`) | Bearer JWT via `get_current_user` | Standard Supabase JWT |
| Service routes (`/api/service/ig-dm/*`) | `X-Service-Api-Key` header | Same key as existing service routes |

---

## Environment Variables (All New)

| Variable | Used By | Description |
|----------|---------|-------------|
| `INSTAGRAM_APP_ID` | OAuth flow (route #3) | Meta App ID from Meta App Dashboard |
| `INSTAGRAM_APP_SECRET` | Webhook HMAC (route #2), OAuth (route #3) | Meta App Secret |
| `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` | Webhook verification (route #1) | Arbitrary shared secret |
| `ENABLE_IG_DM` | All IG DM routes | Feature flag: `"true"` to enable, `"false"` (default) to disable |

---

## Feature Flag Gating

When `ENABLE_IG_DM` is not `"true"`:
- Webhook handler: accepts events, logs them, does NOT process (returns 200)
- User routes: return `503 Service Unavailable` with `{"detail": "IG DM feature is not enabled"}`
- Service routes: return `503 Service Unavailable`

Implementation pattern:

```python
from src.core.config import settings


def _check_ig_dm_enabled():
    """Raise 503 if IG DM feature is disabled."""
    if not getattr(settings, "ENABLE_IG_DM", False):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="IG DM feature is not enabled",
        )
```

---

## Additional Pydantic Models Discovered

The following models are needed by this spec but were not in `spec-pydantic-models.md`. They must be added:

### In `apps/backend/src/models/api/ig_dm_message.py`

```python
class IgDmDraftResponse(BaseModel):
    ig_dm_thread_state_id: uuid.UUID
    ig_conversation_id: str
    draft_body_text: str
    source: Literal["llm"] = "llm"
    created_at: datetime


class IgDmDraftCreateRequest(BaseModel):
    ig_dm_thread_state_id: uuid.UUID
    draft_body_text: str


class IgDmDraftUpdateRequest(BaseModel):
    draft_body_text: str
```

### In `apps/backend/src/models/api/service.py`

```python
class ServiceIgDmThreadSearchResult(BaseModel):
    ig_conversation_id: str
    ig_dm_account_id: str
    sender_igsid: str
    sender_username: str | None
    campaign_id: str
    latest_message_text: str | None
    latest_date: str
    message_count: int
    status: str
    window_expires_at: str | None


class ServiceIgDmMessage(BaseModel):
    mid: str
    direction: str
    sender_igsid: str
    sender_username: str | None
    body_text: str | None
    message_type: str
    sent_at: str
    is_echo: bool


class ServiceIgDmThreadDetailResponse(BaseModel):
    ig_conversation_id: str
    ig_dm_account_id: str
    status: str
    window_expires_at: str | None
    window_is_active: bool
    campaign_id: str | None
    sender_igsid: str
    sender_username: str | None
    messages: list[ServiceIgDmMessage]
    llm_draft: str | None


class ServiceIgDmAccountResponse(BaseModel):
    id: str
    instagram_business_account_id: str
    ig_username: str
    is_active: bool
    webhook_subscribed: bool
    initial_sync_completed: bool
    access_token_expires_at: str
    last_verified_at: str | None
    verification_error: str | None


class ServiceIgDmReplyRequest(BaseModel):
    ig_dm_account_id: str
    user_id: str
    message_text: str | None = None
    media_url: str | None = None


class ServiceIgDmReplyResponse(BaseModel):
    sent_mid: str
    stored_message_id: str
    ig_conversation_id: str
```

---

## Files Summary

### New Files

| File | Routes | Purpose |
|------|--------|---------|
| `apps/backend/src/api/route/ig_dm_webhook.py` | #1, #2 | Webhook verification + event receipt |
| `apps/backend/src/api/route/ig_dm_account.py` | #3, #4, #5, #6, #7 | IG account CRUD (OAuth connect, list, get, update, delete) |
| `apps/backend/src/api/route/ig_dm_thread.py` | #8, #9, #10, #11, #12, #13 | Thread list, messages, reply, draft CRUD |

### Modified Files

| File | Change |
|------|--------|
| `apps/backend/main.py` | Mount `ig_dm_webhook_router` at `/webhooks` (1 line) |
| `apps/backend/src/api/router.py` | Mount `ig_dm_account_router` with `/v1` prefix, mount `ig_dm_thread_router` (2-3 lines) |
| `apps/backend/src/api/route/service.py` | Add routes #14, #15, #16, #17 (4 new endpoints) |
| `apps/backend/src/models/api/ig_dm_message.py` | Add `IgDmDraftResponse`, `IgDmDraftCreateRequest`, `IgDmDraftUpdateRequest` |
| `apps/backend/src/models/api/service.py` | Add 6 new service response/request models |
| `apps/backend/src/core/config.py` | Add `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `INSTAGRAM_WEBHOOK_VERIFY_TOKEN`, `ENABLE_IG_DM` settings |
