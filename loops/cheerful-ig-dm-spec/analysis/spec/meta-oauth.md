# Spec: Meta OAuth — Instagram DM Account Connection

**Aspect**: `spec-meta-oauth`
**Wave**: 2 — Schema & Interface Design
**Date**: 2026-03-01
**Input files**:
- `../cheerful-ig-dm-reverse/analysis/meta-instagram-messaging-api.md` — OAuth requirements, permissions, App Review
- `../cheerful-ig-dm-reverse/analysis/meta-webhooks-realtime.md` — Webhook subscription setup, page subscription API
- `analysis/spec/db-migrations.md` — `user_ig_dm_account` table (token storage schema)
- `analysis/audit/api-routes.md` — existing OAuth patterns (Gmail account read-only, SMTP credential write)
- `analysis/audit/backend-services.md` — `crypto_service` (AES-256-CBC token encryption pattern)
- `analysis/spec/api-contracts.md` — OAuth callback route, account management routes
- Web search: Meta Developer docs 2025/2026 (verified Facebook Login flow for Instagram Messaging API)

---

## Files

### New Files

| Action | Path | Purpose |
|--------|------|---------|
| CREATE | `apps/backend/src/services/external/meta_graph.py` | MetaGraphService — token exchange, Graph API calls, webhook subscription |
| CREATE | `apps/backend/src/temporal/workflows/ig_dm_token_refresh_workflow.py` | Cron workflow for user token refresh |
| CREATE | `apps/backend/src/temporal/activities/ig_dm_token_refresh_activities.py` | Token refresh activities |

### Modified Files

| Action | Path | What Changes |
|--------|------|-------------|
| MODIFY | `apps/backend/src/core/config/definition.py` | Add 3 new Meta env vars to `Settings` class |
| MODIFY | `apps/backend/src/api/route/ig_dm_account.py` | OAuth callback endpoint (referenced in `spec-api-contracts`) |
| MODIFY | `apps/backend/src/temporal/worker.py` | Register `IgDmTokenRefreshWorkflow` and its activities |

---

## 1. Meta App Configuration Requirements

### 1.1 App Type

- **Type**: Business App (not Consumer or None)
- Created at: `https://developers.facebook.com/apps/`
- Products to add: **Instagram** (adds Messenger Platform for Instagram DM capability)
- **NOT** "Instagram API with Instagram Login" (new 2024 path) — that path's DM webhook support is unconfirmed

### 1.2 Required Permissions

| Permission | Access Level | Purpose | App Review Required? |
|------------|-------------|---------|----------------------|
| `instagram_basic` | Standard | Read basic Instagram profile info | No |
| `instagram_manage_messages` | **Advanced Access** | Read/write Instagram DMs | **Yes** |
| `pages_manage_metadata` | Advanced Access | Subscribe page to webhooks | Yes |
| `pages_show_list` | Advanced Access | List user's connected Facebook Pages | Yes |
| `pages_messaging` | Advanced Access | Send messages on behalf of page | Yes |
| `business_management` | Advanced Access | Resolve IGSID → profile info | Yes |

### 1.3 App Review Requirements

All Advanced Access permissions require Meta App Review before production use. Review takes **2–7 business days** (up to 10 for complex cases).

**Required materials per permission**:
1. Screencast video demonstrating how each permission is used in the Cheerful UI/CE
2. Written description of why the permission is necessary
3. Privacy policy at a publicly accessible HTTPS URL (must load quickly)
4. App must be in **Live Mode** (not Development Mode)

**Development/testing without App Review**: During Development Mode, all features work but ONLY for accounts explicitly added as App Roles (Admin, Developer, or Tester) in the Meta Developer Dashboard.

### 1.4 Webhook Configuration (App-Level)

In Meta Developer Dashboard → App → Webhooks → Add Product:
1. Select object type: **Instagram**
2. Callback URL: `https://{CHEERFUL_BACKEND_URL}/webhooks/instagram/`
3. Verify Token: value of `META_WEBHOOK_VERIFY_TOKEN` env var
4. Field subscriptions to enable:
   - `messages` — **Required** (inbound DMs, story replies, deletions)
   - `message_echoes` — **Required** (track outbound messages sent via API)
   - `message_deliveries` — Optional (delivery receipts for analytics)
   - `message_reads` — Optional (read receipts for analytics)

**Page-level subscription** (programmatic, after each OAuth connect): See Section 5.

---

## 2. Environment Variables

Three new variables added to `Settings` class in `apps/backend/src/core/config/definition.py`:

```python
# Meta / Instagram DM integration
META_APP_ID: str | None = None                 # Meta App ID (numeric string)
META_APP_SECRET: str | None = None             # Meta App Secret (hex string)
META_WEBHOOK_VERIFY_TOKEN: str | None = None   # Arbitrary string; set in Meta dashboard + env
```

**Usage**:
- `META_APP_ID` + `META_APP_SECRET` → OAuth token exchange, Graph API app-level calls
- `META_APP_SECRET` → HMAC-SHA256 webhook signature verification (X-Hub-Signature-256)
- `META_WEBHOOK_VERIFY_TOKEN` → webhook endpoint verification (GET challenge)

**Gating**: All Meta-related code checks `settings.META_APP_ID is not None` before executing. Combined with `ENABLE_IG_DM` feature flag (see `spec-migration-safety`).

---

## 3. OAuth Flow Design

### 3.1 Authentication Method: Facebook Login (Messenger Platform)

Cheerful uses **Facebook Login** (not "Business Login / Instagram OAuth"). This is required because:
1. The Instagram Messaging API is built on the Messenger Platform
2. Messenger Platform requires a **Facebook Page linked to the Instagram Professional Account**
3. Messaging API calls use **Page Access Tokens**, not Instagram User Access Tokens

### 3.2 Complete OAuth Flow (6 Steps)

```
Step 1: Build authorization URL (client-side or CE tool)
Step 2: User grants permissions in Meta dialog
Step 3: Meta redirects to backend callback with authorization code
Step 4: Backend exchanges code → short-lived user token (~1 hour)
Step 5: Backend exchanges short-lived → long-lived user token (60 days)
Step 6: Backend fetches permanent Page Access Token via long-lived user token
Step 7: Backend subscribes page to Instagram webhooks
Step 8: Backend creates user_ig_dm_account record (encrypted token)
Step 9: Backend starts IgDmInitialSyncWorkflow (conversation history backfill)
```

### 3.3 Step 1: Authorization URL Construction

**URL**: `https://www.facebook.com/v21.0/dialog/oauth`

**Query parameters**:
```
client_id      = {META_APP_ID}
redirect_uri   = https://{CHEERFUL_BACKEND_URL}/api/v1/ig-dm-accounts/callback
response_type  = code
scope          = instagram_basic,instagram_manage_messages,pages_manage_metadata,pages_show_list,pages_messaging,business_management
state          = {csrf_token}   # Random UUID, stored in session for CSRF validation
```

**Who constructs this URL**:
- The CE tool `cheerful_connect_ig_account` calls `GET /api/v1/ig-dm-accounts/oauth-url` to get this URL
- The backend generates the URL with a signed `state` (HMAC of `user_id + nonce`, or a UUID stored in Supabase with TTL)
- The CE tool returns the URL to the Slack user to open in their browser

**`GET /api/v1/ig-dm-accounts/oauth-url` route**:
```python
@router.get("/oauth-url")
async def get_oauth_url(
    current_user: dict = Depends(get_current_user),
) -> IgDmOAuthUrlResponse:
    # Returns: IgDmOAuthUrlResponse(oauth_url: str, state: str)
    # Stores state -> user_id mapping in ig_dm_oauth_state table (or Redis) with 10-min TTL
```

### 3.4 Step 3: OAuth Callback Handler

**Route**: `POST /api/v1/ig-dm-accounts` (referenced in `spec-api-contracts`)

**Actual URL**: `GET /api/v1/ig-dm-accounts/callback` — receives Meta's redirect with `code` and `state`

```python
@router.get("/callback")
async def oauth_callback(
    code: str = Query(...),
    state: str = Query(...),
    error: str | None = Query(default=None),
    error_description: str | None = Query(default=None),
) -> IgDmAccountResponse:
    # 1. Validate state (CSRF check: look up state -> user_id in DB)
    # 2. If error param present → raise HTTPException(400, detail=error_description)
    # 3. Exchange code for short-lived user token (Step 4)
    # 4. Exchange short-lived for long-lived user token (Step 5)
    # 5. List user's pages to find IG-linked page (Step 6a)
    # 6. Fetch page access token (Step 6b)
    # 7. Fetch Instagram Business Account ID via page token (Step 6c)
    # 8. Subscribe page to webhooks (Step 7)
    # 9. Create user_ig_dm_account row (Step 8)
    # 10. Start IgDmInitialSyncWorkflow (Step 9)
    # 11. Redirect to success URL or return IgDmAccountResponse
```

**Note**: This is a `GET` endpoint (Meta redirects via browser GET). It is mounted under the account router but behaves like an OAuth callback, not a REST create endpoint.

### 3.5 Step 4: Short-Lived User Token Exchange

```
POST https://graph.facebook.com/v21.0/oauth/access_token
  client_id={META_APP_ID}
  client_secret={META_APP_SECRET}
  redirect_uri={CALLBACK_URL}
  code={authorization_code}
```

**Response**:
```json
{
  "access_token": "EAAb...short_lived",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### 3.6 Step 5: Long-Lived User Token Exchange

```
GET https://graph.facebook.com/v21.0/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id={META_APP_ID}
  &client_secret={META_APP_SECRET}
  &fb_exchange_token={SHORT_LIVED_USER_TOKEN}
```

**Response**:
```json
{
  "access_token": "EAAb...long_lived",
  "token_type": "bearer",
  "expires_in": 5184000
}
```
`expires_in` ≈ 60 days (5,184,000 seconds).

### 3.7 Step 6: Fetch Permanent Page Access Token

**Step 6a**: List user's Facebook Pages to find one linked to an Instagram Professional account:

```
GET https://graph.facebook.com/v21.0/me/accounts
  ?access_token={LONG_LIVED_USER_TOKEN}
  &fields=id,name,instagram_business_account
```

**Response**:
```json
{
  "data": [
    {
      "id": "{facebook_page_id}",
      "name": "Brand Name",
      "instagram_business_account": {
        "id": "{instagram_business_account_id}"
      },
      "access_token": "{page_access_token_short}"
    }
  ]
}
```

**Step 6b**: Fetch long-lived (non-expiring) page token:

```
GET https://graph.facebook.com/v21.0/{facebook_page_id}
  ?fields=access_token
  &access_token={LONG_LIVED_USER_TOKEN}
```

**Response**:
```json
{
  "access_token": "EAAb...permanent_page_token",
  "id": "{facebook_page_id}"
}
```

**Token lifecycle**: Page access tokens obtained via this exchange from a long-lived user token are **non-expiring** (permanent) as long as the user does not revoke app permissions. Store with `access_token_expires_at` set to `NULL` or far future (e.g., 2099-01-01).

**Step 6c**: Fetch Instagram username for the account:

```
GET https://graph.facebook.com/v21.0/{instagram_business_account_id}
  ?fields=name,username
  &access_token={permanent_page_token}
```

### 3.8 Step 7: Per-Page Webhook Subscription

After getting the permanent page token, subscribe the page to receive Instagram webhook events:

```
POST https://graph.facebook.com/v21.0/{facebook_page_id}/subscribed_apps
  ?access_token={permanent_page_token}
  &subscribed_fields=messages,message_echoes,messaging_postbacks
```

**Response**:
```json
{ "success": true }
```

**When this runs**: During the OAuth callback handler (synchronously, before returning success).

**On disconnect** (`DELETE /api/v1/ig-dm-accounts/{id}`): Unsubscribe via:
```
DELETE https://graph.facebook.com/v21.0/{facebook_page_id}/subscribed_apps
  ?access_token={permanent_page_token}
```

---

## 4. Token Storage Schema

Tokens are stored in `user_ig_dm_account` (defined in `spec-db-migrations.md`). Key token fields:

```sql
access_token             TEXT NOT NULL,          -- encrypted via crypto_service (AES-256-CBC)
access_token_expires_at  TIMESTAMPTZ NOT NULL,   -- NULL means permanent; store 2099-01-01 for permanent page tokens
token_type               TEXT NOT NULL DEFAULT 'page',  -- always 'page' for production

-- Also store the long-lived user token for refresh capability
user_access_token        TEXT,                   -- encrypted; needed to re-fetch page token if revoked
user_token_expires_at    TIMESTAMPTZ,            -- 60-day expiry for long-lived user tokens
```

**Token encryption**: Use existing `crypto_service.encrypt(token)` before writing to DB. Decrypt with `crypto_service.decrypt(encrypted_token)` before API calls. Pattern matches `GmailService.for_user()` which decrypts `account.refresh_token`.

**`user_access_token` field** is not currently in the `spec-db-migrations` schema — add it as an additional column. This enables token revocation recovery without requiring full re-auth.

---

## 5. `MetaGraphService` — Class Specification

**File**: `apps/backend/src/services/external/meta_graph.py`

```python
class MetaGraphService:
    """Service for Meta Graph API calls: token exchange, page operations, user resolution."""

    BASE_URL: ClassVar[str] = "https://graph.facebook.com/v21.0"

    def __init__(self, app_id: str, app_secret: str):
        # Store app_id, app_secret
        # Initialize httpx.AsyncClient

    @classmethod
    def from_settings(cls) -> "MetaGraphService":
        # Construct from settings.META_APP_ID, settings.META_APP_SECRET
        # Raises ValueError if META_APP_ID or META_APP_SECRET is None

    async def exchange_code_for_short_lived_token(
        self,
        code: str,
        redirect_uri: str,
    ) -> str:
        # POST /oauth/access_token
        # Returns: short-lived user access token string
        # Raises: MetaOAuthError on non-200 response

    async def exchange_for_long_lived_user_token(
        self,
        short_lived_token: str,
    ) -> tuple[str, datetime]:
        # GET /oauth/access_token?grant_type=fb_exchange_token
        # Returns: (long_lived_token: str, expires_at: datetime)
        # Raises: MetaOAuthError

    async def get_pages_with_instagram_accounts(
        self,
        user_token: str,
    ) -> list[dict]:
        # GET /me/accounts?fields=id,name,instagram_business_account,access_token
        # Returns: list of page dicts with instagram_business_account nested

    async def get_permanent_page_token(
        self,
        page_id: str,
        long_lived_user_token: str,
    ) -> str:
        # GET /{page_id}?fields=access_token
        # Returns: permanent page access token string
        # Raises: MetaOAuthError

    async def get_instagram_account_info(
        self,
        ig_business_account_id: str,
        page_token: str,
    ) -> dict:
        # GET /{ig_business_account_id}?fields=name,username
        # Returns: {"id": str, "name": str, "username": str}

    async def subscribe_page_to_webhooks(
        self,
        page_id: str,
        page_token: str,
        fields: list[str] | None = None,
    ) -> bool:
        # POST /{page_id}/subscribed_apps
        # fields defaults to ["messages", "message_echoes", "messaging_postbacks"]
        # Returns: True on success
        # Raises: MetaGraphError on failure

    async def unsubscribe_page_from_webhooks(
        self,
        page_id: str,
        page_token: str,
    ) -> bool:
        # DELETE /{page_id}/subscribed_apps
        # Returns: True on success

    async def refresh_user_token(
        self,
        long_lived_user_token: str,
    ) -> tuple[str, datetime]:
        # GET /oauth/access_token?grant_type=fb_exchange_token (same endpoint as initial exchange)
        # Long-lived user tokens can be refreshed when they are > 24h old and < 60 days old
        # Returns: (new_long_lived_token: str, new_expires_at: datetime)

    async def get_igsid_profile(
        self,
        igsid: str,
        page_token: str,
    ) -> dict:
        # GET /{igsid}?fields=name,username,profile_pic
        # Returns: {"id": str, "name": str | None, "username": str | None, "profile_pic": str | None}
        # Used by creator resolution (spec-creator-resolution)

    async def send_dm(
        self,
        ig_business_account_id: str,
        recipient_igsid: str,
        message_text: str,
        page_token: str,
    ) -> str:
        # POST /{ig_business_account_id}/messages
        # payload: {"recipient": {"id": recipient_igsid}, "message": {"text": message_text}}
        # Returns: message_id (mid) of sent message
        # Raises: MetaMessagingError (wraps Meta error codes)

    async def verify_page_token(
        self,
        page_token: str,
    ) -> bool:
        # GET /me?access_token={page_token}
        # Returns True if token valid, False if expired/revoked
        # Used by health check in IgDmTokenRefreshWorkflow


class MetaOAuthError(Exception):
    """Raised on OAuth token exchange errors."""
    def __init__(self, message: str, error_code: int | None = None):
        ...


class MetaGraphError(Exception):
    """Raised on Graph API call failures (non-token-exchange)."""
    def __init__(self, message: str, error_code: int | None = None, error_subcode: int | None = None):
        ...


class MetaMessagingError(MetaGraphError):
    """Raised when a DM send fails (e.g., window expired, user blocked)."""
    ...
```

---

## 6. OAuth State Management

To prevent CSRF attacks, the `state` parameter in the OAuth flow must be validated.

### 6.1 State Storage

A lightweight approach using a new DB table (or Supabase's existing infra):

```sql
-- Ephemeral table for OAuth state (small, short-lived)
CREATE TABLE ig_dm_oauth_state (
    state        TEXT PRIMARY KEY,              -- random UUID
    user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at   TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '10 minutes'
);

-- Auto-cleanup index
CREATE INDEX idx_ig_dm_oauth_state_expires ON ig_dm_oauth_state (expires_at);
```

### 6.2 State Lifecycle

1. `GET /api/v1/ig-dm-accounts/oauth-url`: Generate UUID state, insert into `ig_dm_oauth_state`, return in `IgDmOAuthUrlResponse`
2. `GET /api/v1/ig-dm-accounts/callback`: Look up `state` in `ig_dm_oauth_state`, validate `user_id` matches JWT, delete the row
3. Cleanup: Background task (or Temporal cron) deletes expired rows daily

---

## 7. Token Refresh Strategy

### 7.1 Token Expiry Analysis

| Token Type | Expiry | Action |
|------------|--------|--------|
| Short-lived user token | ~1 hour | Used only during OAuth callback; never stored |
| Long-lived user token | 60 days | Stored in `user_ig_dm_account.user_access_token`; refresh via cron |
| Permanent page token | Non-expiring | Stored in `user_ig_dm_account.access_token`; only expires if user revokes |

**Primary risk**: User revokes app permissions on Meta — this invalidates all tokens. This is caught at next verification/API call.

### 7.2 `IgDmTokenRefreshWorkflow`

**File**: `apps/backend/src/temporal/workflows/ig_dm_token_refresh_workflow.py`

```python
@workflow.defn(name="IgDmTokenRefreshWorkflow")
class IgDmTokenRefreshWorkflow:
    """Cron workflow to refresh long-lived user tokens and verify page token health."""

    @workflow.run
    async def run(self) -> dict:
        # 1. Activity: fetch all user_ig_dm_account rows where:
        #    - is_active = TRUE
        #    - user_token_expires_at < NOW() + INTERVAL '7 days'
        # 2. For each account:
        #    a. Activity: call MetaGraphService.refresh_user_token(encrypted_user_token)
        #    b. Activity: re-fetch permanent page token using new user token
        #    c. Activity: update user_ig_dm_account row (new tokens + expires_at)
        #    d. Activity: call MetaGraphService.verify_page_token(page_token)
        #    e. If verify fails: set is_active=FALSE, verification_error=message
        # 3. Return summary: {refreshed: int, failed: int, verified: int}
```

**Schedule**: Cron expression `"0 6 * * *"` (run daily at 6 AM UTC). Registered in the Temporal worker as a scheduled workflow.

**File**: `apps/backend/src/temporal/activities/ig_dm_token_refresh_activities.py`

```python
@activity.defn(name="fetch_accounts_needing_refresh")
async def fetch_accounts_needing_refresh() -> list[dict]:
    # Returns list of {account_id: uuid, user_access_token_encrypted: str, user_token_expires_at: datetime}

@activity.defn(name="refresh_ig_dm_user_token")
async def refresh_ig_dm_user_token(
    account_id: str,   # UUID as string (Temporal serialization)
    encrypted_user_token: str,
) -> dict:
    # Returns: {new_user_token_encrypted: str, new_expires_at: str (ISO)}

@activity.defn(name="refresh_ig_dm_page_token")
async def refresh_ig_dm_page_token(
    account_id: str,
    facebook_page_id: str,
    encrypted_new_user_token: str,
) -> dict:
    # Returns: {new_page_token_encrypted: str}

@activity.defn(name="update_ig_dm_account_tokens")
async def update_ig_dm_account_tokens(
    account_id: str,
    new_user_token_encrypted: str,
    new_user_token_expires_at: str,  # ISO datetime string
    new_page_token_encrypted: str,
) -> None:
    # Updates user_ig_dm_account row in DB

@activity.defn(name="verify_ig_dm_page_token_health")
async def verify_ig_dm_page_token_health(
    account_id: str,
    page_token_encrypted: str,
) -> bool:
    # Returns True if token valid, False if revoked
    # On failure: updates is_active=FALSE, verification_error in DB
```

---

## 8. App-Level Webhook Subscription (One-Time Dashboard Setup)

Unlike page-level subscriptions (which happen programmatically per account connect), the app-level webhook subscription is configured ONCE in the Meta Developer Dashboard:

1. Go to: Meta Developer Dashboard → Your App → Add Products → Webhooks
2. Select object: **Instagram**
3. Enter callback URL: `https://api.cheerful.app/webhooks/instagram/`
4. Enter verify token: value of `META_WEBHOOK_VERIFY_TOKEN` env var
5. Click "Verify and Save" — this triggers the GET hub.challenge verification
6. Enable fields: `messages`, `message_echoes`, `messaging_postbacks`
7. Click "Subscribe"

This is a **one-time action per Meta App deployment**, not per user account. All connected Instagram accounts (all pages) receive events at this single endpoint, differentiated by `entry[].id` (the Instagram Business Account ID).

---

## 9. Error Handling & Edge Cases

### 9.1 User Declines Permissions

If user declines authorization: Meta redirects to callback URL with `error=access_denied`. Handler must return HTTP 400 or redirect to failure URL with descriptive message.

### 9.2 Multiple Pages Found

If `GET /me/accounts` returns multiple pages with linked Instagram accounts, the handler must:
1. If exactly 1 page has an Instagram Business Account → use it automatically
2. If 0 pages have Instagram Business Accounts → return error: "No Instagram Business Account linked to any Facebook Page"
3. If > 1 pages have Instagram Business Accounts → **not yet supported in MVP**; return error asking user to manage page links before reconnecting

### 9.3 Account Already Connected

If `user_id + instagram_business_account_id` already exists in `user_ig_dm_account`:
- If `is_active = TRUE` → return 409 with `{"error": "already_connected", "account_id": uuid}`
- If `is_active = FALSE` → reactivate: update tokens, set `is_active = TRUE`

### 9.4 App Review Not Yet Complete (Development Mode)

In development mode, only App Role users can test. The backend behaves identically — the restriction is enforced by Meta, not Cheerful. No special handling needed; failed OAuth will return error which surfaces to CE user.

### 9.5 Token Revocation Detection

When any Meta API call returns error code `190` (Invalid OAuth access token):
1. Set `user_ig_dm_account.is_active = FALSE`
2. Set `user_ig_dm_account.verification_error = "Token revoked by user"`
3. Surface in `cheerful_list_ig_accounts` CE tool as "disconnected" status
4. Send Slack notification to the connected user (via CE notification system)

Meta error code `190` subcodes:
- `460`: Password changed
- `463`: Session expired (user logged out)
- `467`: Invalid/expired token
- `468`: App permission revoked

---

## 10. Meta API Version Pinning

All Graph API calls use version **v21.0** (current stable as of 2026-03-01). Pinned in `MetaGraphService.BASE_URL`. When upgrading, update only this constant.

**Version deprecation**: Meta deprecates API versions with ~2 years notice. Subscribe to Meta Developer News for deprecation announcements.

---

## 11. Security Checklist

| Requirement | Implementation |
|-------------|----------------|
| Tokens never logged | `crypto_service.encrypt()` before any log/DB write |
| Tokens encrypted at rest | AES-256-CBC via `crypto_service` (same as Gmail refresh tokens) |
| CSRF protection | State parameter validated against DB-stored UUID |
| Webhook HMAC validation | X-Hub-Signature-256 HMAC-SHA256, `hmac.compare_digest()` |
| Timing attack resistance | `hmac.compare_digest()` for all secret comparisons |
| Token rotation | Long-lived user tokens refreshed weekly via Temporal cron |
| Revocation detection | Error code 190 triggers immediate deactivation |
| Minimal permissions | Request only 6 required scopes, not `instagram_manage_comments` etc. |

---

## 12. OAuth URL Response Model

**File**: `apps/backend/src/models/api/ig_dm_account.py` (referenced in `spec-api-contracts`)

```python
class IgDmOAuthUrlResponse(BaseModel):
    oauth_url: str        # Full Meta authorization URL to open in browser
    state: str            # State UUID (for CE tool to display or track)
    expires_in: int = 600 # Seconds until state expires (10 minutes)
```

---

## 13. Developer Quickstart: Connecting First IG Account

1. Set env vars: `META_APP_ID`, `META_APP_SECRET`, `META_WEBHOOK_VERIFY_TOKEN`
2. Add yourself as App Role Tester in Meta Developer Dashboard
3. Link your Instagram Business account to a Facebook Page (Meta-side requirement)
4. Start Cheerful backend locally with ngrok for HTTPS tunnel
5. Configure webhook callback URL in Meta dashboard to ngrok URL
6. Use CE tool `cheerful_connect_ig_account` to get OAuth URL, open in browser
7. Complete Meta authorization flow
8. Verify `user_ig_dm_account` row created in DB
9. Send yourself a DM on Instagram
10. Verify webhook fires and `ig_dm_message` row created

---

## Cross-References

- `analysis/spec/db-migrations.md` — `user_ig_dm_account` and `ig_dm_oauth_state` table definitions
- `analysis/spec/api-contracts.md` — Route signatures for OAuth URL, callback, account CRUD
- `analysis/spec/pydantic-models.md` — `UserIgDmAccount`, `IgDmOAuthUrlResponse` models
- `analysis/spec/webhook-handler.md` — Webhook GET verification endpoint that uses `META_WEBHOOK_VERIFY_TOKEN`
- `analysis/spec/ce-ig-dm-tools.md` — `cheerful_connect_ig_account` tool that initiates OAuth flow
- `analysis/spec/temporal-interfaces.md` — `IgDmInitialSyncWorkflow` triggered at end of OAuth callback
