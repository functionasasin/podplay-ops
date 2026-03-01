# Spec: Instagram DM Webhook Handler

**Aspect**: `spec-webhook-handler`
**Wave**: 3 — Component Implementation Specs
**Date**: 2026-03-01
**Input files**:
- `analysis/spec/api-contracts.md` — webhook route contract (`GET /webhooks/instagram/`, `POST /webhooks/instagram/`)
- `analysis/spec/pydantic-models.md` — `MetaWebhookPayload`, `MetaWebhookEntry`, `MetaWebhookMessaging`, `MetaWebhookMessage` models
- `analysis/spec/temporal-interfaces.md` — `IgDmIngestWorkflow` (trigger target), `init_temporal_client`, `TEMPORAL_TASK_QUEUE`
- `analysis/spec/meta-oauth.md` — env vars `META_WEBHOOK_VERIFY_TOKEN`, `META_APP_SECRET`
- `analysis/audit/api-routes.md` — Slack webhook pattern (HMAC verification, BackgroundTask dispatch, immediate-200 requirement)
- Codebase reads: `apps/backend/main.py`, `apps/backend/src/api/route/slack.py` (HMAC pattern), `apps/backend/src/core/config/definition.py` (Settings class)

---

## Files

### New Files

| Action | Path | Purpose |
|--------|------|---------|
| CREATE | `apps/backend/src/api/route/ig_dm_webhook.py` | FastAPI router: GET verification + POST event receipt |

### Modified Files

| Action | Path | What Changes |
|--------|------|-------------|
| MODIFY | `apps/backend/main.py` | Mount `ig_dm_webhook_router` at `/webhooks` (app-level, NOT under `/api`) |
| MODIFY | `apps/backend/src/core/config/definition.py` | Add `META_APP_SECRET`, `META_WEBHOOK_VERIFY_TOKEN`, `ENABLE_IG_DM` to `Settings` |

---

## 1. Settings Changes

**File**: `apps/backend/src/core/config/definition.py`

Add the following fields to the `Settings` class (after `SLACK_DIGEST_SIGNING_SECRET`):

```python
# Meta / Instagram DM integration
META_APP_SECRET: str | None = None
# App Secret from Meta Developer Dashboard (used for X-Hub-Signature-256 verification)
META_WEBHOOK_VERIFY_TOKEN: str | None = None
# Arbitrary secret token configured in Meta webhook subscription (hub.verify_token check)
ENABLE_IG_DM: bool = False
# Feature flag: gates all IG DM webhook processing, API routes, and CE tools
```

**Behavior**: All three fields are `None` / `False` by default. Without `ENABLE_IG_DM=true`, the webhook handler returns `{"ok": True}` immediately on POST without processing. Prevents accidental processing if the feature is deployed before configuration is complete.

---

## 2. Main App Changes

**File**: `apps/backend/main.py`

### Import addition (after existing `api_router` import)

```python
from src.api.route.ig_dm_webhook import ig_dm_webhook_router
```

### Router mounting (after `app.include_router(api_router, prefix="/api")`)

```python
# Meta webhook must be mounted at app level (not under /api) for clean public URL
# Final URL: POST https://{backend_domain}/webhooks/instagram/
app.include_router(ig_dm_webhook_router, prefix="/webhooks")
```

**Reason**: Meta's developer portal webhook configuration accepts a single fixed HTTPS URL. The clean `/webhooks/instagram/` path (without `/api/`) is conventional and separates it from the authenticated API surface. The existing Slack webhook is under `/api/slack/` because it's internal tooling; Meta is an external partner requiring a dedicated URL.

---

## 3. Webhook Router

**File**: `apps/backend/src/api/route/ig_dm_webhook.py`

### 3.1 Module-level setup

```python
"""Instagram DM webhook handler.

Two endpoints:
  GET  /webhooks/instagram/ — Meta one-time endpoint verification (hub challenge)
  POST /webhooks/instagram/ — Meta real-time event delivery (message webhooks)

Security model:
  - GET: secret token comparison (META_WEBHOOK_VERIFY_TOKEN)
  - POST: HMAC-SHA256 body signature (X-Hub-Signature-256 / META_APP_SECRET)

Meta requirement: POST handler MUST return HTTP 200 within 20 seconds or Meta
retries (up to 3x). All processing is dispatched via BackgroundTask (same pattern
as Slack webhook in slack.py).
"""

import hashlib
import hmac
import json
import uuid

import structlog
from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, Request, Response
from fastapi.responses import PlainTextResponse

from src.core.config import settings
from src.models.meta.webhook import MetaWebhookPayload, MetaWebhookMessaging

log = structlog.get_logger()

router = APIRouter(prefix="/instagram", tags=["ig-dm-webhook"])
ig_dm_webhook_router = router  # alias for import in main.py
```

### 3.2 Private helper: `_verify_meta_signature`

```python
def _verify_meta_signature(body: bytes, signature_header: str) -> bool:
    """Verify X-Hub-Signature-256 HMAC-SHA256 signature from Meta.

    Meta sends: X-Hub-Signature-256: sha256=<hex-digest>
    We compute: HMAC-SHA256(app_secret, body) and compare.

    Args:
        body: Raw request body bytes (must be read before parsing JSON).
        signature_header: Value of the X-Hub-Signature-256 header.

    Returns:
        True if signature is valid. False if:
        - META_APP_SECRET is not configured
        - Header is missing or malformed (no "sha256=" prefix)
        - Computed digest does not match
    """
```

**Implementation notes** (not bodies — behavior description):
- `settings.META_APP_SECRET` must be non-None; return `False` if absent
- Split `signature_header` on `"="` with `maxsplit=1` to extract the hex digest; return `False` if malformed
- Compute `hmac.new(app_secret.encode(), body, hashlib.sha256).hexdigest()`
- Compare via `hmac.compare_digest(computed, received)` (constant-time — prevents timing attacks)
- No timestamp comparison needed (Meta does not send a timestamp header for DM webhooks, unlike Slack)

### 3.3 Private helper: `_dispatch_ig_dm_events`

```python
async def _dispatch_ig_dm_events(payload: MetaWebhookPayload) -> None:
    """Dispatch each message event from a Meta webhook payload to Temporal.

    Called as a BackgroundTask from receive_webhook. Handles batched payloads
    (Meta may batch multiple entries or multiple messaging events per delivery).

    For each entry.messaging item that is a message (not a delivery/read receipt):
      1. Look up UserIgDmAccount by entry.id (ig_business_account_id)
      2. Build IgDmIngestInput from the messaging event fields
      3. Start IgDmIngestWorkflow with idempotency key = mid

    Args:
        payload: Parsed MetaWebhookPayload (already validated by Pydantic).
    """
```

**Implementation notes**:
- Import pattern (lazy imports inside the function body, matching `slack.py` and `gmail_message.py` pattern):
  ```python
  from temporalio.common import WorkflowIDReusePolicy
  from src.temporal.client import init_temporal_client
  from src.temporal.config import TEMPORAL_TASK_QUEUE
  from src.temporal.workflow.ig_dm_ingest_workflow import IgDmIngestWorkflow
  from src.models.temporal.ig_dm_ingest import IgDmIngestInput
  from src.core.database import get_db_session_context
  ```
- **DB lookup pattern**: Use `get_db_session_context()` context manager to fetch `UserIgDmAccount` by `instagram_business_account_id = entry.id`. If no account found (webhook for an unregistered account), log a warning and skip that entry.
- **`ENABLE_IG_DM` gate**: If `not settings.ENABLE_IG_DM`, log info and return early without processing. This is the primary feature flag guard point.
- **Idempotency**: Workflow ID = `f"ig-dm-ingest-{mid}"`. Reuse policy = `WorkflowIDReusePolicy.ALLOW_DUPLICATE_FAILED_ONLY` — ensures exactly-once ingest for each `mid`.
- **Message-only filter**: Skip `messaging` events where `event.message is None` (these are delivery receipts, read receipts, or postbacks — not message content). Check `event.message is not None`.
- **Echo filter**: Process echo events (`is_echo=True`) — outbound echoes are stored as `OUTBOUND` direction messages in `ig_dm_message`. Do NOT skip them.
- **Temporal call**: `await client.start_workflow(IgDmIngestWorkflow.run, ingest_input, id=workflow_id, task_queue=TEMPORAL_TASK_QUEUE, id_reuse_policy=WorkflowIDReusePolicy.ALLOW_DUPLICATE_FAILED_ONLY)`
- **Error handling**: Catch all exceptions per entry/messaging item, log with `structlog` (include `mid`, `ig_business_account_id`), continue to next item. Do NOT raise — a partial failure should not block processing of other events in the batch.

### 3.4 Route: `GET /webhooks/instagram/` — Webhook Verification

```python
@router.get("/")
async def verify_webhook(
    hub_mode: str = Query(alias="hub.mode"),
    hub_verify_token: str = Query(alias="hub.verify_token"),
    hub_challenge: str = Query(alias="hub.challenge"),
) -> Response:
    """Handle Meta one-time webhook endpoint verification.

    Meta calls this endpoint when a webhook subscription is being registered or
    updated in the Meta Developer Dashboard. The server must respond with HTTP 200
    and the raw hub.challenge string as plain text.

    Args:
        hub_mode: Must equal "subscribe" (Meta always sends "subscribe").
        hub_verify_token: Must match META_WEBHOOK_VERIFY_TOKEN env var.
        hub_challenge: Arbitrary string from Meta; must be echoed back verbatim.

    Returns:
        PlainTextResponse(hub_challenge, status_code=200) on success.
        HTTPException(403) if hub_mode != "subscribe" or verify_token mismatch.
    """
```

**Implementation notes**:
- `if hub_mode != "subscribe"`: raise `HTTPException(status_code=403, detail="Invalid hub.mode")`
- `if not settings.META_WEBHOOK_VERIFY_TOKEN`: raise `HTTPException(status_code=500, detail="Webhook verify token not configured")`
- `if hub_verify_token != settings.META_WEBHOOK_VERIFY_TOKEN`: raise `HTTPException(status_code=403, detail="Invalid verify token")`
- Return `PlainTextResponse(hub_challenge)` — Meta requires exactly the challenge string, nothing more, as `text/plain`
- Log: `log.info("meta_webhook_verified")` on success

### 3.5 Route: `POST /webhooks/instagram/` — Event Receipt

```python
@router.post("/")
async def receive_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
) -> dict:
    """Handle Meta real-time Instagram DM webhook event delivery.

    Meta posts all Instagram messaging events here (messages, echoes, deliveries,
    reads, etc.). The handler MUST return HTTP 200 within 20 seconds or Meta
    considers the delivery a failure and retries (up to 3 times with exponential
    backoff).

    Processing is dispatched via BackgroundTask (same pattern as Slack webhook).
    Temporal workflow handles deduplication — this handler is intentionally
    stateless and fast.

    Security:
        Verifies X-Hub-Signature-256 HMAC-SHA256 before any processing.
        Returns 403 on invalid signature (do NOT return 200 for invalid payloads —
        that would be a security vulnerability accepting spoofed events).

    Args:
        request: Raw FastAPI request (body read as bytes for HMAC verification).
        background_tasks: FastAPI BackgroundTasks for async Temporal dispatch.

    Returns:
        {"ok": True} — always, as long as signature is valid.
    """
```

**Implementation notes** (step by step):

1. **Read raw body bytes** (must happen before any parsing):
   ```python
   body = await request.body()
   ```

2. **HMAC-SHA256 signature verification**:
   ```python
   signature = request.headers.get("X-Hub-Signature-256", "")
   if not _verify_meta_signature(body, signature):
       raise HTTPException(status_code=403, detail="Invalid signature")
   ```
   - If `META_APP_SECRET` is not configured: log warning, raise 403 (not 200). Do not silently accept.

3. **Parse JSON body** (after verification):
   ```python
   try:
       data = json.loads(body)
       payload = MetaWebhookPayload.model_validate(data)
   except Exception as exc:
       log.warning("meta_webhook_parse_error", error=str(exc))
       raise HTTPException(status_code=400, detail="Invalid payload")
   ```

4. **Object type check**:
   ```python
   if payload.object != "instagram":
       log.info("meta_webhook_non_instagram_object", object=payload.object)
       return {"ok": True}  # Acknowledge but don't process non-IG objects
   ```

5. **Feature flag check** (fast path — before BackgroundTask):
   ```python
   if not settings.ENABLE_IG_DM:
       log.info("meta_webhook_ig_dm_disabled")
       return {"ok": True}
   ```

6. **Dispatch to BackgroundTask**:
   ```python
   background_tasks.add_task(_dispatch_ig_dm_events, payload)
   ```
   - `_dispatch_ig_dm_events` is a sync or async function; FastAPI handles both in BackgroundTasks

7. **Return immediately**:
   ```python
   return {"ok": True}
   ```
   - Meta requires 200 response within ~20 seconds. This handler completes in <10ms.

---

## 4. Environment Variables

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `META_APP_SECRET` | `str \| None` | Yes (for production) | Meta App Secret for HMAC-SHA256 verification. Found in Meta Developer Dashboard → App → Settings → Basic → App Secret. |
| `META_WEBHOOK_VERIFY_TOKEN` | `str \| None` | Yes (for webhook registration) | Arbitrary secret token set in Meta webhook subscription configuration. Must match what is entered in Meta Developer Dashboard. |
| `ENABLE_IG_DM` | `bool` | No (default `False`) | Feature flag. Set to `True` once DB migrations are applied and verified. Gates ALL IG DM processing. |

---

## 5. Error Handling Matrix

| Scenario | Response | Behavior |
|----------|----------|----------|
| Valid signature, valid payload | `200 {"ok": True}` | BackgroundTask dispatched |
| Invalid / missing signature | `403` | No processing; logged |
| Malformed JSON body | `400` | Logged; no processing |
| `payload.object != "instagram"` | `200 {"ok": True}` | Logged; ignored |
| `ENABLE_IG_DM = False` | `200 {"ok": True}` | Logged; no dispatch |
| No `META_APP_SECRET` configured | `403` | Warning logged |
| No `META_WEBHOOK_VERIFY_TOKEN` (GET) | `500` | Config error |
| hub.mode != "subscribe" (GET) | `403` | Invalid request |
| hub.verify_token mismatch (GET) | `403` | Security rejection |
| Background dispatch error | `200 {"ok": True}` | Error logged internally; Meta sees success |
| No `UserIgDmAccount` for entry.id | (background, per entry) | Warning logged; entry skipped; other entries processed |
| Temporal `start_workflow` failure | (background, per mid) | Error logged; mid-level failure; other mids processed |

**Critical rule**: Once the HMAC signature is verified, the POST handler must return 200 regardless of downstream errors. Meta's retry mechanism will resend events if it receives non-200. Since Temporal handles idempotency via `mid`, a failed Temporal start is recoverable via manual reprocessing or the reconciliation workflow — not via 4xx/5xx responses that trigger retries.

---

## 6. Logging

All log events use `structlog` (`log = structlog.get_logger()`), consistent with the rest of the codebase.

| Event key | Level | Fields | When |
|-----------|-------|--------|------|
| `meta_webhook_verified` | `info` | — | Successful GET verification |
| `meta_webhook_received` | `info` | `entry_count`, `total_messages` | Successful POST receipt |
| `meta_webhook_ig_dm_disabled` | `info` | — | `ENABLE_IG_DM=False` |
| `meta_webhook_non_instagram_object` | `info` | `object` | object != "instagram" |
| `meta_webhook_parse_error` | `warning` | `error` | JSON/Pydantic parse failure |
| `meta_webhook_sig_verification_failed` | `warning` | `header_present` | HMAC mismatch |
| `meta_webhook_dispatch_started` | `info` | `mid`, `ig_business_account_id`, `workflow_id` | Per message, before Temporal start |
| `meta_webhook_dispatch_error` | `error` | `mid`, `ig_business_account_id`, `error` | Per-message Temporal start failure |
| `meta_webhook_no_account` | `warning` | `ig_business_account_id` | No `UserIgDmAccount` found for entry.id |
| `meta_webhook_skipped_non_message` | `debug` | `sender_igsid`, `event_type` | Delivery/read receipts skipped |

---

## 7. Dependency Graph

```
main.py
└── ig_dm_webhook_router (prefix="/webhooks")
    ├── GET /webhooks/instagram/
    │   └── settings.META_WEBHOOK_VERIFY_TOKEN
    └── POST /webhooks/instagram/
        ├── settings.META_APP_SECRET  (signature verification)
        ├── settings.ENABLE_IG_DM    (feature gate)
        └── BackgroundTask: _dispatch_ig_dm_events(payload)
            ├── get_db_session_context()  (UserIgDmAccount lookup)
            ├── init_temporal_client()    (Temporal connection)
            └── IgDmIngestWorkflow.run    (per message, per mid)
```

---

## 8. Cross-references

- **Triggered workflow**: See `analysis/spec/ingest-workflow.md` — `IgDmIngestWorkflow` input shape, dedup strategy, downstream actions
- **Payload models**: See `analysis/spec/pydantic-models.md §6` — `MetaWebhookPayload`, `MetaWebhookEntry`, `MetaWebhookMessaging`, `MetaWebhookMessage`
- **DB lookup (UserIgDmAccount)**: See `analysis/spec/db-migrations.md §1` — `user_ig_dm_account` table, `instagram_business_account_id` unique constraint
- **Account connection / token storage**: See `analysis/spec/meta-oauth.md` — how accounts are connected before webhooks fire
- **Temporal client pattern**: See `apps/backend/src/temporal/client.py` — `init_temporal_client()` (existing codebase)
- **Settings pattern**: See `analysis/audit/api-routes.md §13.8` — `settings.X` access pattern

---

## 9. Security Considerations

### 9.1 Signature Verification is Mandatory

Meta's `X-Hub-Signature-256` header uses HMAC-SHA256 with the **App Secret** (not the Verify Token). Without verification, any HTTP client could post fake message events to the endpoint. The handler returns `403` (not `200`) on invalid signatures — unlike Slack where returning `200` is sometimes done to avoid retries. For Meta, rejected deliveries are logged in the Meta Developer Dashboard and can be replayed manually.

### 9.2 Constant-Time Comparison

Use `hmac.compare_digest()` for the digest comparison to prevent timing-oracle attacks.

### 9.3 Body Read Before Parsing

The raw body bytes must be captured **before** `await request.json()` or Pydantic parsing. FastAPI/Starlette buffers the body once; re-reading is possible via `request.body()` which is cached after the first read.

### 9.4 Verify Token is NOT the App Secret

- `META_WEBHOOK_VERIFY_TOKEN` — used only for the one-time GET verification when registering the webhook subscription. Can be any arbitrary secret string.
- `META_APP_SECRET` — used for every POST's HMAC-SHA256 body signature. This is the Meta App's secret key (32-character hex string from Meta Developer Dashboard).

Do not confuse the two. Using the wrong value for either check will silently fail verification.

### 9.5 Replay Attack Protection

Meta does not include a timestamp in webhook POST headers (unlike Slack's `X-Slack-Request-Timestamp`). Replay protection is handled at the application layer: `IgDmIngestWorkflow` uses `mid` (Meta's globally unique message ID) as an idempotency key via the `UNIQUE(ig_dm_account_id, mid)` constraint and `WorkflowIDReusePolicy.ALLOW_DUPLICATE_FAILED_ONLY`.

---

## 10. Testing Considerations

- **Unit test `_verify_meta_signature`**: Test valid signature, missing header, wrong secret, empty body, sha1-only header (no sha256 prefix).
- **Integration test `GET /webhooks/instagram/`**: Valid token → 200 + challenge; wrong token → 403; missing params → 422.
- **Integration test `POST /webhooks/instagram/`**: Valid payload + valid sig → 200; valid payload + invalid sig → 403; ENABLE_IG_DM=False → 200 no dispatch; non-instagram object → 200 no dispatch.
- **Mock `_dispatch_ig_dm_events`**: Verify BackgroundTask is added with correct payload; do not actually call Temporal in unit tests.
- Test file: `apps/backend/tests/api/test_ig_dm_webhook.py` (to be detailed in `spec-test-plan.md`)
