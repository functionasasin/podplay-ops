# Spec: Test Plan — Instagram DM Support

**Aspect**: `spec-test-plan`
**Wave**: 4 — Integration, Phasing & Synthesis
**Date**: 2026-03-01
**Input files**:
- All Wave 1 audit files (`analysis/audit/`)
- All Wave 2-3 spec files (`analysis/spec/`)
- `analysis/spec/phase-plan.md` — phased file manifest
- Codebase reads:
  - `apps/backend/tests/conftest.py` — existing fixture patterns
  - `apps/backend/tests/temporal/activity/test_ingest_single_message_activity.py` — activity test pattern
  - `apps/context-engine/app/tests_v2/mcp/tools/cheerful/test_tools.py` — CE tool test pattern

---

## Files

### New Files — Backend (pytest)

| Action | Path | Purpose |
|--------|------|---------|
| CREATE | `apps/backend/tests/factories/ig_dm.py` | Test data factories: webhook payloads, message fixtures, account fixtures |
| CREATE | `apps/backend/tests/fixtures/webhook_simulator.py` | HMAC-signing helper to build valid Meta webhook POST requests |
| CREATE | `apps/backend/tests/api/test_ig_dm_webhook.py` | Webhook handler unit + integration tests |
| CREATE | `apps/backend/tests/api/test_ig_dm_account.py` | IG DM account route tests |
| CREATE | `apps/backend/tests/api/test_ig_dm_thread.py` | DM thread + reply route tests |
| CREATE | `apps/backend/tests/repositories/test_ig_igsid_cache.py` | `IgIsidCacheRepository` unit tests |
| CREATE | `apps/backend/tests/repositories/test_campaign_creator_ig_dm.py` | New `CampaignCreatorRepository` methods |
| CREATE | `apps/backend/tests/services/test_meta_graph_service.py` | `MetaGraphService` unit tests (mocked HTTP) |
| CREATE | `apps/backend/tests/services/test_ig_dm_service.py` | `IgDmService.get_user_info_by_igsid` + error hierarchy |
| CREATE | `apps/backend/tests/temporal/activity/test_ig_dm_ingest_activity.py` | Dedup check, store message, state insert activities |
| CREATE | `apps/backend/tests/temporal/activity/test_ig_dm_media_download_activity.py` | Media download: success, expired URL, failed URL |
| CREATE | `apps/backend/tests/temporal/activity/test_ig_igsid_resolution_activity.py` | Full IGSID resolution pipeline |
| CREATE | `apps/backend/tests/temporal/activity/test_ig_dm_send_reply_activity.py` | Window check + Meta send activities |
| CREATE | `apps/backend/tests/temporal/workflow/test_ig_dm_ingest_workflow.py` | Ingest workflow step-by-step (using Temporal test env) |
| CREATE | `apps/backend/tests/temporal/workflow/test_ig_igsid_resolution_workflow.py` | Resolution workflow (retry isolation) |
| CREATE | `apps/backend/tests/temporal/workflow/test_ig_dm_send_reply_workflow.py` | Send reply workflow + 24h enforcement |
| CREATE | `apps/backend/tests/temporal/workflow/test_coordinator_ig_dm_branch.py` | `ThreadProcessingCoordinatorWorkflow` IG DM branching |
| CREATE | `apps/backend/tests/services/ai/test_ig_dm_loader.py` | DM context XML generation |
| CREATE | `apps/backend/tests/services/ai/test_ig_dm_drafting.py` | Prompt routing logic (base / RAG / window-reopener) |
| CREATE | `apps/backend/tests/integration/test_ig_dm_ingest_pipeline.py` | End-to-end: webhook POST → message stored → state created |
| CREATE | `apps/backend/tests/integration/test_ig_dm_send_reply_pipeline.py` | End-to-end: POST /reply → workflow → Meta API mock → state updated |

### New Files — Context Engine (pytest)

| Action | Path | Purpose |
|--------|------|---------|
| CREATE | `apps/context-engine/app/tests_v2/mcp/tools/cheerful/test_ig_dm_tools.py` | ToolDef structure, parameter schemas, 24h enforcement |
| CREATE | `apps/context-engine/app/tests_v2/mcp/tools/cheerful/test_ig_dm_api.py` | HTTP client functions (mocked httpx) |
| CREATE | `apps/context-engine/app/tests_v2/integration/test_ig_dm_flow.py` | CE tool call → mocked backend → Slack output format |

### Modified Files

| Action | Path | What Changes |
|--------|------|-------------|
| MODIFY | `apps/backend/tests/conftest.py` | Add `test_ig_dm_account` fixture (parallel to `test_gmail_account`, `test_smtp_account`) |

---

## 1. Shared Fixtures

### 1.1 `apps/backend/tests/conftest.py` — New Fixtures

```python
@pytest.fixture
def test_ig_dm_account(test_user_id: uuid.UUID, test_db_connection) -> UserIgDmAccount:
    """Create a test IG DM account in the database.

    Parallel to test_gmail_account and test_smtp_account.
    Provides a connected Instagram Business Account for ingest/send tests.
    """
    # Ensures test_user_id exists in auth.users
    # Creates UserIgDmAccount with:
    #   instagram_business_account_id = "17841400000000000"  (fake IGBA)
    #   facebook_page_id = "111222333444555"
    #   page_name = "Test Brand"
    #   access_token = crypto_service.encrypt("test_page_access_token")
    #   user_access_token = crypto_service.encrypt("test_user_access_token")
    #   user_token_expires_at = now() + 60 days
    #   is_active = True

@pytest.fixture
def test_ig_dm_campaign_creator(
    test_ig_dm_account: UserIgDmAccount,
    test_campaign: Campaign,
) -> CampaignCreator:
    """Create a campaign_creator row with Instagram handle for resolution tests.

    social_media_handles = [{"platform": "instagram", "handle": "testcreator"}]
    ig_igsid = NULL (unresolved — test can set after resolution)
    """

@pytest.fixture
def meta_webhook_app_secret() -> str:
    """Fixed app secret for HMAC test signing.

    Must match the META_APP_SECRET setting override in webhook tests.
    """
    return "test_app_secret_32_chars_padding_"
```

### 1.2 `apps/backend/tests/factories/ig_dm.py` — Test Data Factories

```python
"""Factory functions for Instagram DM test data."""

import hashlib
import hmac
import json
import time
import uuid


def make_meta_webhook_payload(
    ig_business_account_id: str = "17841400000000000",
    sender_igsid: str = "17841400123456789",
    recipient_igsid: str = "17841400000000000",
    mid: str | None = None,
    body_text: str = "Hello! I'm interested in your campaign.",
    is_echo: bool = False,
    timestamp_ms: int | None = None,
    message_type: str = "text",
    image_url: str | None = None,
) -> dict:
    """Build a valid Meta webhook payload dict for testing.

    Produces the exact JSON structure Meta sends to POST /webhooks/instagram/.
    All fields match the MetaWebhookPayload Pydantic model.
    """

def make_ig_dm_ingest_input(
    ig_dm_account_id: uuid.UUID | None = None,
    user_id: uuid.UUID | None = None,
    mid: str | None = None,
    ig_conversation_id: str = "17841400000000001",
    sender_igsid: str = "17841400123456789",
    recipient_igsid: str = "17841400000000000",
    body_text: str = "Hello! Interested in your campaign.",
    is_echo: bool = False,
    sent_at_ms: int | None = None,
    media_original_urls: list[str] | None = None,
) -> IgDmIngestInput:
    """Build an IgDmIngestInput with sensible defaults."""

def make_ig_igsid_cache_row(
    igsid: str = "17841400123456789",
    username: str = "testcreator",
    display_name: str | None = "Test Creator",
) -> dict:
    """Dict matching ig_igsid_cache schema for direct DB insertion in tests."""

def make_graph_api_user_response(
    igsid: str = "17841400123456789",
    username: str = "testcreator",
    name: str = "Test Creator",
) -> dict:
    """Mock response from Meta Graph API GET /{igsid}?fields=name,username."""

def make_meta_send_message_response(
    recipient_id: str = "17841400123456789",
    message_id: str | None = None,
) -> dict:
    """Mock response from Meta POST /{ig_business_account_id}/messages."""
```

### 1.3 `apps/backend/tests/fixtures/webhook_simulator.py` — HMAC Signing Helper

```python
"""Webhook simulator: build valid and invalid Meta webhook requests."""

import hashlib
import hmac
import json


def build_webhook_request(
    payload: dict,
    app_secret: str,
    path: str = "/webhooks/instagram/",
) -> tuple[bytes, dict]:
    """Compute HMAC-SHA256 over the JSON body and return (body_bytes, headers).

    Returns:
        body_bytes: JSON-encoded payload as bytes.
        headers: dict with "X-Hub-Signature-256": "sha256=<digest>".

    Usage in test:
        body, headers = build_webhook_request(payload, app_secret)
        response = client.post("/webhooks/instagram/", content=body, headers=headers)
    """

def build_invalid_signature_headers(payload: dict) -> tuple[bytes, dict]:
    """Return (body_bytes, headers) with a deliberately wrong signature for rejection tests."""

def build_hub_challenge_params(
    verify_token: str = "test_verify_token",
    challenge: str = "challenge_12345",
    mode: str = "subscribe",
) -> dict:
    """Query params for GET /webhooks/instagram/ verification."""
```

---

## 2. Webhook Handler Tests

**File**: `apps/backend/tests/api/test_ig_dm_webhook.py`

Fixtures used: `api_client`, `meta_webhook_app_secret`, `mock_temporal_client`

Settings override: `settings.META_APP_SECRET = meta_webhook_app_secret`, `settings.META_WEBHOOK_VERIFY_TOKEN = "test_verify_token"`, `settings.ENABLE_IG_DM = True`

### 2.1 Unit: `_verify_meta_signature`

```python
class TestVerifyMetaSignature:
    def test_valid_signature_returns_true(self)
    def test_wrong_secret_returns_false(self)
    def test_missing_sha256_prefix_returns_false(self)
    def test_empty_signature_returns_false(self)
    def test_sha1_only_header_returns_false(self)
    def test_empty_body_valid_signature_returns_true(self)
    def test_none_app_secret_returns_false(self)
```

### 2.2 GET /webhooks/instagram/ — Verification

```python
class TestWebhookVerification:
    def test_valid_token_returns_challenge(self, api_client)
    # Assert: status=200, body=b"challenge_12345", content-type=text/plain

    def test_wrong_verify_token_returns_403(self, api_client)
    # Assert: status=403

    def test_missing_hub_mode_returns_422(self, api_client)
    # Assert: status=422 (FastAPI validation)

    def test_non_subscribe_mode_returns_403(self, api_client)
    # Assert: status=403

    def test_missing_app_secret_configured_returns_500(self, api_client)
    # Settings override: META_WEBHOOK_VERIFY_TOKEN=None
    # Assert: status=500
```

### 2.3 POST /webhooks/instagram/ — Event Receipt

```python
class TestWebhookReceipt:
    def test_valid_payload_returns_200(
        self, api_client, mock_temporal_client, meta_webhook_app_secret
    )
    # Build valid webhook payload + HMAC signature
    # Assert: status=200, body={"ok": True}
    # Assert: mock_temporal_client.start_workflow called once with IgDmIngestWorkflow

    def test_invalid_signature_returns_403(self, api_client)
    # Assert: status=403, mock_temporal_client.start_workflow NOT called

    def test_ig_dm_disabled_returns_200_no_dispatch(
        self, api_client, mock_temporal_client, meta_webhook_app_secret
    )
    # Settings override: ENABLE_IG_DM=False
    # Assert: status=200, mock_temporal_client.start_workflow NOT called

    def test_non_instagram_object_returns_200_no_dispatch(
        self, api_client, mock_temporal_client, meta_webhook_app_secret
    )
    # Payload with object="page" instead of "instagram"
    # Assert: status=200, start_workflow NOT called

    def test_malformed_json_returns_400(self, api_client, meta_webhook_app_secret)
    # Send bytes that are not valid JSON but with correct HMAC
    # Assert: status=400

    def test_delivery_receipt_event_not_dispatched(
        self, api_client, mock_temporal_client, meta_webhook_app_secret
    )
    # Payload with messaging[0].delivery (no .message field)
    # Assert: start_workflow NOT called (delivery receipts filtered)

    def test_echo_message_dispatched(
        self, api_client, mock_temporal_client, meta_webhook_app_secret
    )
    # Payload with message.is_echo=True
    # Assert: start_workflow called (echoes are processed)

    def test_batched_payload_dispatches_multiple_workflows(
        self, api_client, mock_temporal_client, meta_webhook_app_secret
    )
    # Payload with 3 message events in entries/messaging
    # Assert: start_workflow called 3 times, workflow IDs all different

    def test_workflow_id_uses_mid_for_idempotency(
        self, api_client, mock_temporal_client, meta_webhook_app_secret
    )
    # Assert: workflow ID = "ig-dm-ingest-{mid}" from the payload

    def test_no_account_for_entry_id_skips_entry(
        self, api_client, mock_temporal_client, meta_webhook_app_secret
    )
    # Payload with an ig_business_account_id not in user_ig_dm_account
    # Assert: start_workflow NOT called, status=200

    def test_unknown_meta_app_secret_returns_403(self, api_client)
    # Settings override: META_APP_SECRET=None
    # Assert: status=403
```

---

## 3. Ingest Activity Tests

**File**: `apps/backend/tests/temporal/activity/test_ig_dm_ingest_activity.py`

Fixtures used: `test_ig_dm_account`, `test_db_connection`

```python
class TestIgDmDedupCheckActivity:
    def test_returns_false_for_new_mid(self, test_ig_dm_account, test_db_connection)
    # No rows in ig_dm_message
    # Assert: ig_dm_dedup_check_activity(account_id, "mid_new") == False

    def test_returns_true_for_existing_mid(self, test_ig_dm_account, test_db_connection)
    # Pre-insert ig_dm_message row with (account_id, mid)
    # Assert: ig_dm_dedup_check_activity(account_id, "mid_existing") == True

    def test_scoped_by_account_id(self, test_db_connection)
    # Two different accounts, same MID
    # Assert: returns True only for the matching account


class TestIgDmStoreMessageActivity:
    def test_stores_new_inbound_message(self, test_ig_dm_account, test_db_connection)
    # Call ig_dm_store_message_activity with new mid
    # Assert: row inserted, result.was_duplicate=False, result.ig_dm_message_id is UUID

    def test_dedup_on_conflict_returns_existing_id(
        self, test_ig_dm_account, test_db_connection
    )
    # Insert same MID twice
    # Assert: second call result.was_duplicate=True, same ig_dm_message_id returned

    def test_sent_at_ms_converted_to_utc_datetime(
        self, test_ig_dm_account, test_db_connection
    )
    # sent_at_ms = 1704067200000  (2024-01-01T00:00:00Z in ms)
    # Assert: ig_dm_message.sent_at == datetime(2024, 1, 1, tzinfo=UTC)

    def test_sender_username_initially_null(self, test_ig_dm_account, test_db_connection)
    # Assert: ig_dm_message.sender_username IS NULL after initial store

    def test_echo_message_direction_outbound(self, test_ig_dm_account, test_db_connection)
    # is_echo=True in params
    # Assert: ig_dm_message.direction == "OUTBOUND", is_echo == True

    def test_inbound_message_direction(self, test_ig_dm_account, test_db_connection)
    # is_echo=False
    # Assert: ig_dm_message.direction == "INBOUND"


class TestBatchInsertIgDmStateAndGetCandidateActivity:
    def test_inserts_state_row_and_returns_candidate(
        self, test_ig_dm_account, test_db_connection
    )
    # Assert: ig_dm_thread_state row created, candidate.ig_dm_account_id set

    def test_window_expires_at_is_24h_after_sent_at(
        self, test_ig_dm_account, test_db_connection
    )
    # sent_at = datetime(2024, 1, 1, tzinfo=UTC)
    # Assert: window_expires_at == datetime(2024, 1, 2, tzinfo=UTC)

    def test_status_is_ready_for_campaign_association(
        self, test_ig_dm_account, test_db_connection
    )
    # Assert: ig_dm_thread_state.status == "READY_FOR_CAMPAIGN_ASSOCIATION"

    def test_duplicate_state_returns_none_candidate(
        self, test_ig_dm_account, test_db_connection
    )
    # Insert twice with same (user_id, account_id, conversation_id, sent_at)
    # Assert: second call returns None (no coordinator spawn needed)

    def test_candidate_has_ig_fields_set(self, test_ig_dm_account, test_db_connection)
    # Assert: candidate.ig_dm_account_id == account.id
    # Assert: candidate.ig_conversation_id == params.ig_conversation_id
    # Assert: candidate.gmail_account_id is None
    # Assert: candidate.smtp_account_id is None
```

---

## 4. IGSID Resolution Tests

**File**: `apps/backend/tests/temporal/activity/test_ig_igsid_resolution_activity.py`

Fixtures used: `test_ig_dm_account`, `test_ig_dm_campaign_creator`, `test_db_connection`

```python
class TestIgIgsidResolutionActivity:
    def test_cache_hit_returns_without_api_call(
        self, test_ig_dm_account, test_db_connection
    )
    # Pre-populate ig_igsid_cache with fresh row (resolved_at = now())
    # Patch IgDmService.get_user_info_by_igsid to raise if called
    # Assert: result.was_cache_hit=True, no Graph API call

    def test_cache_miss_calls_graph_api(self, test_ig_dm_account, test_db_connection)
    # Empty cache
    # Mock Graph API response: {"id": "123", "username": "testcreator", "name": "Test"}
    # Assert: result.username == "testcreator", was_cache_hit=False

    def test_cache_populates_after_api_call(
        self, test_ig_dm_account, test_db_connection
    )
    # After API call, assert ig_igsid_cache row exists with correct username

    def test_stale_cache_re_resolves(self, test_ig_dm_account, test_db_connection)
    # Pre-populate cache with resolved_at = 8 days ago (beyond 7-day TTL)
    # Assert: Graph API is called, cache updated with fresh resolved_at

    def test_igsid_direct_match_finds_campaign_creator(
        self,
        test_ig_dm_account,
        test_ig_dm_campaign_creator,
        test_db_connection,
    )
    # Set test_ig_dm_campaign_creator.ig_igsid = sender_igsid
    # Assert: result.campaign_creator_id == test_ig_dm_campaign_creator.id
    # Assert: result.match_method == "igsid_direct"

    def test_gin_handle_match_finds_campaign_creator(
        self,
        test_ig_dm_account,
        test_ig_dm_campaign_creator,
        test_db_connection,
    )
    # test_ig_dm_campaign_creator has social_media_handles with "testcreator"
    # ig_igsid_cache returns username="testcreator"
    # Assert: result.campaign_creator_id set, match_method="handle_gin"

    def test_write_through_cache_sets_ig_igsid_on_creator(
        self,
        test_ig_dm_account,
        test_ig_dm_campaign_creator,
        test_db_connection,
    )
    # After GIN match, assert campaign_creator.ig_igsid updated in DB

    def test_no_match_returns_none_campaign_creator_id(
        self, test_ig_dm_account, test_db_connection
    )
    # No campaign_creator rows for this user
    # Assert: result.campaign_creator_id is None, match_method is None

    def test_ambiguous_match_picks_newest_campaign(
        self,
        test_ig_dm_account,
        test_db_connection,
    )
    # Two campaign_creator rows for same handle, different campaigns
    # Assert: result.was_ambiguous=True
    # Assert: result.campaign_creator_id is from the most recently created campaign

    def test_rate_limit_raises_meta_api_rate_limit_error(
        self, test_ig_dm_account, test_db_connection
    )
    # Mock Graph API to return 429
    # Assert: raises MetaApiRateLimitError (non-retryable)

    def test_not_found_raises_meta_api_not_found_error(
        self, test_ig_dm_account, test_db_connection
    )
    # Mock Graph API to return 404
    # Assert: raises MetaApiNotFoundError

    def test_sender_username_backfill_updates_all_null_rows(
        self, test_ig_dm_account, test_db_connection
    )
    # Pre-insert 3 ig_dm_message rows with sender_igsid=X, sender_username=NULL
    # Run resolution, username resolved to "testcreator"
    # Assert: all 3 rows have sender_username="testcreator"
```

### Repository Tests

**File**: `apps/backend/tests/repositories/test_ig_igsid_cache.py`

```python
class TestIgIsidCacheRepository:
    def test_get_by_igsid_returns_none_on_miss(self, test_db_connection)
    def test_get_by_igsid_returns_row_on_hit(self, test_db_connection)
    def test_get_by_igsid_returns_none_for_stale_cache(self, test_db_connection)
    # resolved_at = 8 days ago
    # Assert: returns None (TTL expired)
    def test_get_by_igsid_updates_last_seen_at(self, test_db_connection)
    # Assert: last_seen_at updated to approximately now()
    def test_upsert_inserts_new_row(self, test_db_connection)
    def test_upsert_updates_existing_row(self, test_db_connection)
    # Insert row, upsert with new username
    # Assert: single row with updated username, resolved_at refreshed
```

**File**: `apps/backend/tests/repositories/test_campaign_creator_ig_dm.py`

```python
class TestCampaignCreatorIgDmMethods:
    def test_find_by_ig_igsid_returns_matching_creator(
        self, test_ig_dm_campaign_creator, test_db_connection
    )
    def test_find_by_ig_igsid_returns_none_for_unknown_igsid(
        self, test_db_connection
    )
    def test_find_by_ig_igsid_scoped_by_user_id(self, test_db_connection)
    # Two users, same IGSID on different campaign_creator rows
    # Assert: returns only the row matching the queried user_id
    def test_find_by_instagram_handle_gin_query(
        self,
        test_ig_dm_campaign_creator,
        test_db_connection,
    )
    # social_media_handles = [{"platform": "instagram", "handle": "testcreator"}]
    # Assert: find_by_instagram_handle("testcreator", user_id) returns [creator]
    def test_find_by_instagram_handle_no_match(self, test_db_connection)
    def test_find_by_instagram_handle_multiple_matches(self, test_db_connection)
    # Assert: returns list of 2+
    def test_update_ig_igsid_sets_column(
        self, test_ig_dm_campaign_creator, test_db_connection
    )
    # Assert: campaign_creator.ig_igsid == igsid after update
```

---

## 5. Media Download Tests

**File**: `apps/backend/tests/temporal/activity/test_ig_dm_media_download_activity.py`

```python
class TestIgDmMediaDownloadActivity:
    def test_downloads_image_to_supabase_storage(
        self, test_ig_dm_account, test_db_connection
    )
    # Mock httpx.AsyncClient: GET returns 200 + bytes
    # Mock Supabase storage upload
    # Assert: result.media_storage_paths has 1 entry
    # Assert: path format = "ig-dm/{account_id}/{conversation_id}/{mid}/0"

    def test_expired_url_returns_failed_url_not_exception(
        self, test_ig_dm_account, test_db_connection
    )
    # Mock httpx.AsyncClient: GET returns 403
    # Assert: result.failed_urls = [url], result.media_storage_paths = []

    def test_multiple_urls_partial_failure(
        self, test_ig_dm_account, test_db_connection
    )
    # 3 URLs: first succeeds, second returns 410, third succeeds
    # Assert: len(result.media_storage_paths) == 2, len(result.failed_urls) == 1

    def test_requires_bearer_auth_header(self, test_ig_dm_account, test_db_connection)
    # Capture request headers in mock
    # Assert: Authorization: Bearer test_page_access_token
```

---

## 6. Send Reply Tests

**File**: `apps/backend/tests/temporal/activity/test_ig_dm_send_reply_activity.py`

```python
class TestIgDmCheckReplyWindowActivity:
    def test_open_window_returns_ok(self, test_ig_dm_account, test_db_connection)
    # ig_dm_thread_state.window_expires_at = now() + 12h
    # Assert: result.window_open=True, result.seconds_remaining > 0

    def test_expired_window_raises_application_error(
        self, test_ig_dm_account, test_db_connection
    )
    # ig_dm_thread_state.window_expires_at = now() - 1h
    # Assert: raises ApplicationError("WINDOW_EXPIRED", non_retryable=True)

    def test_null_window_raises_application_error(
        self, test_ig_dm_account, test_db_connection
    )
    # window_expires_at is NULL (e.g., outbound echo state)
    # Assert: raises ApplicationError("WINDOW_EXPIRED")


class TestIgDmSendReplyActivity:
    def test_sends_text_message_successfully(
        self, test_ig_dm_account, test_db_connection
    )
    # Mock IgDmService.send_message to return meta_send_message_response()
    # Assert: result.mid set, result.success=True

    def test_sends_image_message_with_url(
        self, test_ig_dm_account, test_db_connection
    )
    # message_type=IMAGE, media_url="https://example.com/photo.jpg"
    # Assert: IgDmService.send_message called with correct message type

    def test_text_too_long_raises_before_api_call(
        self, test_ig_dm_account, test_db_connection
    )
    # message_text = "x" * 1001  (exceeds 1000 char limit)
    # Assert: raises ValueError or ApplicationError WITHOUT calling Meta API

    def test_meta_api_error_propagates(
        self, test_ig_dm_account, test_db_connection
    )
    # Mock IgDmService.send_message to raise MetaApiError
    # Assert: ApplicationError raised (Temporal-retryable)

    def test_rate_limit_error_is_non_retryable(
        self, test_ig_dm_account, test_db_connection
    )
    # Mock to raise MetaApiRateLimitError
    # Assert: ApplicationError with non_retryable=True
```

---

## 7. Workflow Tests

### 7.1 Ingest Workflow

**File**: `apps/backend/tests/temporal/workflow/test_ig_dm_ingest_workflow.py`

These tests use Temporal's Python test environment (`temporalio.testing.WorkflowEnvironment`), matching the pattern in `tests/temporal/workflow/test_semi_automated_workflow_logic.py`.

```python
class TestIgDmIngestWorkflow:
    def test_happy_path_runs_all_steps(
        self, test_ig_dm_account, test_db_connection
    )
    # Mock all activities to return success
    # Assert: workflow completes, IgDmIngestResult.was_duplicate=False
    # Assert: ig_dm_message stored, ig_dm_thread_state created, coordinator spawned

    def test_duplicate_mid_exits_early_at_dedup_check(
        self, test_ig_dm_account, test_db_connection
    )
    # ig_dm_dedup_check_activity returns True
    # Assert: workflow returns immediately, was_duplicate=True
    # Assert: media download NOT called, store NOT called

    def test_duplicate_at_store_step_returns_early(
        self, test_ig_dm_account, test_db_connection
    )
    # dedup check returns False (race window), store returns was_duplicate=True
    # Assert: state insert NOT called, coordinator NOT spawned

    def test_echo_message_skips_steps_4_to_6(
        self, test_ig_dm_account, test_db_connection
    )
    # params.is_echo=True
    # Assert: message stored (Step 3 executes)
    # Assert: state insert NOT called (Step 4 skipped)
    # Assert: IGSID resolution NOT started (Step 5 skipped)
    # Assert: coordinator NOT spawned (Step 6 skipped)

    def test_media_download_skipped_for_text_message(
        self, test_ig_dm_account, test_db_connection
    )
    # params.media_original_urls=None
    # Assert: ig_dm_media_download_activity NOT called

    def test_media_download_called_for_image_message(
        self, test_ig_dm_account, test_db_connection
    )
    # params.media_original_urls=["https://cdn.meta.com/photo.jpg"]
    # Assert: ig_dm_media_download_activity called once

    def test_null_candidate_skips_coordinator_spawn(
        self, test_ig_dm_account, test_db_connection
    )
    # batch_insert_state_activity returns None (duplicate state)
    # Assert: start_child_workflow for coordinator NOT called

    def test_igsid_resolution_launched_as_fire_and_forget(
        self, test_ig_dm_account, test_db_connection
    )
    # Assert: IgIsidResolutionWorkflow launched with parent_close_policy=ABANDON
```

### 7.2 Send Reply Workflow

**File**: `apps/backend/tests/temporal/workflow/test_ig_dm_send_reply_workflow.py`

```python
class TestIgDmSendReplyWorkflow:
    def test_happy_path_sends_and_advances_state(
        self, test_ig_dm_account, test_db_connection
    )
    # Mock window check: open
    # Mock Meta send: success + mid="mid_reply_001"
    # Assert: outbound ig_dm_message row stored
    # Assert: state advanced to WAITING_FOR_INBOUND

    def test_expired_window_fails_workflow(
        self, test_ig_dm_account, test_db_connection
    )
    # Mock window check: raises ApplicationError("WINDOW_EXPIRED")
    # Assert: workflow fails with WINDOW_EXPIRED reason
    # Assert: no ig_dm_message row inserted (no send attempted)

    def test_meta_api_failure_retries(
        self, test_ig_dm_account, test_db_connection
    )
    # Mock Meta send: first call raises MetaApiError, second call succeeds
    # Assert: workflow eventually completes on retry
    # Assert: only one outbound ig_dm_message row stored (ON CONFLICT guards)

    def test_workflow_id_uses_unique_uuid(self)
    # Assert: each workflow start generates a unique ID (not content-based)
    # Verifies that repeat send attempts are not rejected by ALLOW_DUPLICATE_FAILED_ONLY
```

### 7.3 Coordinator IG DM Branch

**File**: `apps/backend/tests/temporal/workflow/test_coordinator_ig_dm_branch.py`

Tests focus on the `is_ig_dm` discriminator behavior, parallel to existing tests in `test_semi_automated_workflow_logic.py` for Gmail.

```python
class TestCoordinatorIgDmBranch:
    def test_ig_dm_candidate_sets_is_ig_dm_flag(self)
    # Candidate with ig_dm_account_id set, gmail/smtp = None
    # Assert: is_ig_dm == True, is_smtp == False

    def test_gmail_only_steps_skipped_for_ig_dm(self)
    # Assert: ensure_complete_thread_ingested_activity NOT called
    # Assert: ThreadAttachmentExtractWorkflow NOT spawned

    def test_domain_classify_skipped_for_ig_dm(self)
    # In READY_FOR_RESPONSE_DRAFT path
    # Assert: check_domain_and_classify_activity NOT called
    # Assert: domain_behavior defaults to None

    def test_draft_dispatched_to_ig_dm_workflow(self)
    # Assert: IgDmThreadResponseDraftWorkflow used (not email draft variant)

    def test_email_activities_unaffected_for_gmail_candidate(self)
    # Candidate with gmail_account_id set
    # Assert: existing Gmail path is unchanged (regression guard)

    def test_email_activities_unaffected_for_smtp_candidate(self)
    # Candidate with smtp_account_id set
    # Assert: existing SMTP path is unchanged (regression guard)
```

---

## 8. API Route Tests

**File**: `apps/backend/tests/api/test_ig_dm_thread.py`

Fixtures used: `api_client`, `api_mock_auth_user`, `test_ig_dm_account`, `test_db_connection`, `mock_temporal_client`

```python
class TestIgDmThreadListRoute:
    def test_list_returns_paginated_threads(
        self, api_client, api_mock_auth_user, test_ig_dm_account, test_db_connection
    )
    # Pre-insert campaign_thread rows with ig_dm_thread_id set
    # GET /api/ig-dm/threads
    # Assert: status=200, body has "threads" list, "next_cursor"

    def test_list_filtered_by_campaign_id(self, ...)
    # Query param: ?campaign_id=UUID
    # Assert: only threads matching campaign returned

    def test_list_includes_window_status(self, ...)
    # Thread state with window_expires_at in the future
    # Assert: response includes "window_open": true, "window_expires_at"

    def test_list_unauthorized_returns_401(self, api_client)
    # No auth header
    # Assert: status=401


class TestIgDmReplyRoute:
    def test_reply_within_window_starts_workflow(
        self, api_client, api_mock_auth_user, test_ig_dm_account, test_db_connection, mock_temporal_client
    )
    # ig_dm_thread_state.window_expires_at = now() + 12h
    # POST /api/ig-dm/threads/{id}/reply {"message_text": "Hi!"}
    # Assert: status=200, mock_temporal_client.execute_workflow called

    def test_reply_outside_window_returns_409(
        self, api_client, api_mock_auth_user, test_ig_dm_account, test_db_connection
    )
    # ig_dm_thread_state.window_expires_at = now() - 1h
    # Assert: status=409, body {"error": "dm_window_expired"}

    def test_reply_too_long_returns_422(
        self, api_client, api_mock_auth_user, test_ig_dm_account, test_db_connection
    )
    # message_text = "x" * 1001
    # Assert: status=422

    def test_reply_requires_auth(self, api_client)
    # Assert: status=401


class TestIgDmDraftRoutes:
    def test_get_draft_returns_latest_draft(
        self, api_client, api_mock_auth_user, test_ig_dm_account, test_db_connection
    )
    # Pre-insert ig_dm_llm_draft row
    # GET /api/ig-dm/threads/{id}/draft
    # Assert: status=200, body includes "body_text", "status": "pending"

    def test_get_draft_returns_404_when_no_draft(
        self, api_client, api_mock_auth_user, test_ig_dm_account, test_db_connection
    )
    # Assert: status=404

    def test_approve_draft_triggers_send_workflow(
        self, api_client, api_mock_auth_user, test_ig_dm_account, test_db_connection, mock_temporal_client
    )
    # POST /api/ig-dm/threads/{id}/draft with {"action": "approve"}
    # Assert: status=200, IgDmSendReplyWorkflow started
    # Assert: draft status updated to "approved"
```

---

## 9. AI Drafting Tests

**File**: `apps/backend/tests/services/ai/test_ig_dm_loader.py`

```python
class TestIgDmLoaderService:
    def test_convert_thread_to_xml_basic_structure(self)
    # Provide list of IgDmMessage objects
    # Assert: output is <ig_dm_thread> ... </ig_dm_thread>
    # Assert: includes <from_handle>, <channel>, <window_expires_at>

    def test_xml_omits_email_fields(self)
    # Assert: no <subject>, no <to>, no <cc> in output

    def test_inbound_messages_labeled_correctly(self)
    # direction=INBOUND → <their_dm> tags

    def test_outbound_messages_labeled_correctly(self)
    # direction=OUTBOUND → <our_dm> tags

    def test_media_message_includes_media_type(self)
    # message_type=IMAGE
    # Assert: <media_type>image</media_type> in output

    def test_window_expiry_included_when_near(self)
    # window_expires_at = now() + 1.5 hours
    # Assert: <window_expires_at> included with ISO8601 value
```

**File**: `apps/backend/tests/services/ai/test_ig_dm_drafting.py`

```python
class TestIgDmDraftingPromptRouting:
    def test_routes_to_window_reopener_when_less_than_2h(self)
    # window_expires_at = now() + 1.5h
    # Assert: prompt_key = "drafting/ig-dm-window-reopener"

    def test_routes_to_rag_prompt_with_3_or_more_examples(self)
    # Mock IgDmReplyExampleRepository.search_similar to return 3 examples
    # window_expires_at = now() + 12h
    # Assert: prompt_key uses RAG variant (e.g. "drafting/ig-dm-drafting-v1-rag-general")

    def test_routes_to_base_prompt_with_fewer_than_3_examples(self)
    # Mock search_similar to return 2 examples
    # Assert: prompt_key uses base variant (e.g. "drafting/ig-dm-drafting-general")

    def test_campaign_type_selects_correct_prompt(self)
    # campaign.campaign_type="paid_promotion" → "drafting/ig-dm-drafting-paid-promotion"
    # campaign.campaign_type="gifting"        → "drafting/ig-dm-drafting-gifting"
    # campaign.campaign_type="sales"          → "drafting/ig-dm-drafting-sales"
    # default                                 → "drafting/ig-dm-drafting-general"
```

---

## 10. Context Engine Tool Tests

**File**: `apps/context-engine/app/tests_v2/mcp/tools/cheerful/test_ig_dm_tools.py`

```python
class TestIgDmToolDefs:
    def test_all_8_tools_are_exported_from_init(self)
    # from src_v2.mcp.tools.cheerful import (
    #     cheerful_list_ig_dm_threads, cheerful_get_ig_dm_thread,
    #     cheerful_send_ig_dm_reply, cheerful_approve_ig_dm_draft,
    #     cheerful_search_ig_dms, cheerful_connect_ig_account,
    #     cheerful_list_ig_accounts, cheerful_ig_dm_campaign_summary,
    # )
    # Assert: all are ToolDef instances

    def test_all_tools_in_catalog(self)
    # Import ALL_TOOLS from catalog
    # Assert: all 8 IG DM tool names present

    def test_list_threads_tool_has_required_parameters(self)
    # cheerful_list_ig_dm_threads.params: campaign_id (optional), status (optional)
    # Assert: parameter schema has campaign_id and status fields

    def test_send_reply_tool_has_message_and_thread_params(self)
    # Assert: thread_id (required), message_text (required) in params

    def test_approve_draft_tool_has_optional_edited_text(self)
    # Assert: thread_id (required), edited_text (optional) in params

    def test_tools_tagged_with_cheerful_platform(self)
    # Assert: all 8 tools have Platform.CHEERFUL tag

    def test_write_tools_tagged_with_write_action(self)
    # send_reply, approve_draft, connect_ig_account
    # Assert: tagged with Action.WRITE

    def test_read_tools_tagged_with_read_action(self)
    # list_ig_dm_threads, get_ig_dm_thread, search_ig_dms,
    # list_ig_accounts, ig_dm_campaign_summary
    # Assert: tagged with Action.READ


class TestCheerfulSendIgDmReplyTool:
    def test_24h_window_expired_raises_tool_error(self)
    # Mock backend API to return {"error": "dm_window_expired"} with 409
    # Assert: ToolError raised with human-readable message about DM window

    def test_success_returns_confirmation_message(self)
    # Mock backend API to return 200 with send confirmation
    # Assert: result string contains confirmation text

    def test_message_too_long_raises_tool_error(self)
    # message_text = "x" * 1001
    # Assert: ToolError raised WITHOUT calling backend

    def test_backend_error_raises_tool_error(self)
    # Mock httpx to raise httpx.HTTPStatusError (500)
    # Assert: ToolError raised


class TestCheerfulConnectIgAccountTool:
    def test_returns_oauth_url(self)
    # Mock backend GET /api/service/ig-dm/oauth-url → {"oauth_url": "https://..."}
    # Assert: result string contains the OAuth URL

    def test_includes_instruction_to_complete_in_browser(self)
    # Assert: result message mentions browser/link


class TestCheerfulListIgDmThreadsTool:
    def test_formats_threads_with_window_indicator(self)
    # Mock backend response: thread with window_expires_at = now() + 2h
    # Assert: output includes "⏰" or similar 24h indicator

    def test_formats_expired_window_correctly(self)
    # thread.window_open = False
    # Assert: output shows window closed state

    def test_empty_thread_list_returns_message(self)
    # Mock backend returns {"threads": []}
    # Assert: tool returns "No DM threads found" or similar
```

**File**: `apps/context-engine/app/tests_v2/mcp/tools/cheerful/test_ig_dm_api.py`

```python
class TestIgDmApiClientFunctions:
    def test_search_ig_dm_threads_calls_correct_endpoint(self)
    # Mock httpx; assert GET /api/service/ig-dm/threads/search with correct params

    def test_get_ig_dm_thread_calls_correct_endpoint(self)
    # Assert: GET /api/service/ig-dm/threads/{thread_id}

    def test_send_ig_dm_reply_calls_correct_endpoint(self)
    # Assert: POST /api/service/ig-dm/threads/{thread_id}/reply

    def test_list_ig_accounts_calls_correct_endpoint(self)
    # Assert: GET /api/service/ig-dm/accounts

    def test_get_meta_oauth_url_calls_correct_endpoint(self)
    # Assert: GET /api/service/ig-dm/oauth-url

    def test_requests_include_service_api_key_header(self)
    # All functions: assert X-Service-Api-Key header present

    def test_404_raises_http_status_error(self)
    # Mock httpx: 404 response
    # Assert: raises httpx.HTTPStatusError
```

---

## 11. Integration Tests

### 11.1 Webhook → DB Pipeline

**File**: `apps/backend/tests/integration/test_ig_dm_ingest_pipeline.py`

These tests exercise the full path from webhook POST to DB state, using real DB but mocked Temporal and Meta API.

```python
@pytest.mark.integration
class TestIgDmIngestPipeline:
    def test_valid_webhook_results_in_message_stored(
        self, api_client, test_ig_dm_account, test_db_connection, mock_temporal_client
    )
    # 1. POST to /webhooks/instagram/ with valid payload + signature
    # 2. Trigger BackgroundTask manually (call _dispatch_ig_dm_events directly)
    # 3. Call ig_dm_store_message_activity directly
    # Assert: ig_dm_message row in DB

    def test_dedup_exactly_once_on_repeated_webhook(
        self, api_client, test_ig_dm_account, test_db_connection, mock_temporal_client
    )
    # POST same payload twice
    # Assert: exactly one ig_dm_message row for the mid

    def test_state_created_after_ingest(
        self, test_ig_dm_account, test_db_connection
    )
    # Run all ingest activities in sequence (direct calls, no Temporal)
    # Assert: ig_dm_thread_state row exists with READY_FOR_CAMPAIGN_ASSOCIATION

    def test_window_expires_at_24h_from_sent_at(
        self, test_ig_dm_account, test_db_connection
    )
    # sent_at_ms = now() - 1000
    # Run ingest activities
    # Assert: window_expires_at ≈ sent_at + 24h (within 1 second)

    def test_feature_flag_disabled_no_state_created(
        self, api_client, test_ig_dm_account, test_db_connection
    )
    # ENABLE_IG_DM=False
    # POST valid webhook
    # Assert: no ig_dm_message, no ig_dm_thread_state rows
```

### 11.2 Send Reply Pipeline

**File**: `apps/backend/tests/integration/test_ig_dm_send_reply_pipeline.py`

```python
@pytest.mark.integration
class TestIgDmSendReplyPipeline:
    def test_successful_reply_stores_outbound_message(
        self, api_client, api_mock_auth_user, test_ig_dm_account, test_db_connection
    )
    # Setup: campaign_thread + ig_dm_thread_state (window open)
    # Mock: IgDmService.send_message → success response with new mid
    # POST /api/ig-dm/threads/{id}/reply {"message_text": "Hi there!"}
    # Assert: ig_dm_message row with direction=OUTBOUND, is_echo=False

    def test_send_reply_advances_state_to_waiting_for_inbound(
        self, api_client, api_mock_auth_user, test_ig_dm_account, test_db_connection
    )
    # After send, assert ig_dm_thread_state.status == WAITING_FOR_INBOUND

    def test_expired_window_rejected_at_route_level(
        self, api_client, api_mock_auth_user, test_ig_dm_account, test_db_connection
    )
    # Setup: window_expires_at = now() - 1h
    # POST /api/ig-dm/threads/{id}/reply
    # Assert: status=409, NO Meta API call made

    def test_echo_webhook_after_send_does_not_duplicate(
        self, api_client, test_ig_dm_account, test_db_connection, mock_temporal_client
    )
    # Step 1: Send reply → store outbound message with mid="mid_reply_123"
    # Step 2: Receive echo webhook with same mid="mid_reply_123"
    # Assert: exactly one ig_dm_message row for mid_reply_123
```

### 11.3 Context Engine E2E

**File**: `apps/context-engine/app/tests_v2/integration/test_ig_dm_flow.py`

```python
@pytest.mark.integration
class TestIgDmContextEngineFlow:
    def test_list_threads_formats_for_slack(self)
    # Mock backend service route to return sample thread list
    # Call cheerful_list_ig_dm_threads ToolDef.execute(context, params)
    # Assert: result is non-empty string with @handle, status, snippet

    def test_get_thread_shows_chat_style_layout(self)
    # Mock backend: thread with 3 messages (2 inbound, 1 outbound)
    # Assert: result contains message bodies in chronological order
    # Assert: includes window status and AI draft if available

    def test_send_reply_confirms_delivery(self)
    # Mock backend: POST /reply → success
    # Assert: result includes confirmation message

    def test_window_expired_send_returns_slack_error(self)
    # Mock backend: POST /reply → 409 dm_window_expired
    # Assert: ToolError raised with message about DM window

    def test_approve_draft_sends_via_reply_endpoint(self)
    # Mock backend: GET /draft → draft body; POST /reply → success
    # Assert: edited_text=None → original draft body sent
    # Assert: edited_text="Custom" → custom text sent
```

---

## 12. E2E Scenario Descriptions

These scenarios are documented for manual / staging validation. They are NOT automated in CI (require real Meta sandbox account and live Temporal).

| Scenario | Steps | Expected Result |
|----------|-------|-----------------|
| **Account connect** | 1. `@Cheerful cheerful_connect_ig_account` in Slack<br>2. Click OAuth URL<br>3. Grant permissions | `user_ig_dm_account` row created; page subscribed to webhook fields |
| **Receive inbound DM** | 1. Send DM to connected IG account from test creator account<br>2. Wait <5 sec | `ig_dm_message` row created; `ig_dm_thread_state` created; Slack notification posted |
| **AI draft generated** | After inbound DM received | `ig_dm_llm_draft` row created within 30 sec; Slack draft notification posted with preview |
| **View thread via CE** | `@Cheerful cheerful_get_ig_dm_thread {id}` | Full conversation displayed; creator info if matched; draft preview shown |
| **Approve draft** | `@Cheerful cheerful_approve_ig_dm_draft {id}` | DM sent to creator; outbound `ig_dm_message` stored; Slack confirms delivery |
| **Send custom reply** | `@Cheerful cheerful_send_ig_dm_reply {id} "Custom message"` | DM sent; state advances to WAITING_FOR_INBOUND |
| **24h window expiry** | Receive DM; wait 22+ hours without responding | Slack expiry alert posted; subsequent `cheerful_send_ig_dm_reply` returns window-closed error |
| **Creator not matched** | Send DM from creator with no social_media_handles | Thread created as unmatched; Slack new-DM notification with "(creator not matched)" |
| **Duplicate webhook** | Re-POST same webhook payload | Exactly 1 `ig_dm_message` row; no duplicate state; no duplicate workflow |

---

## 13. Test Data Summary

### Meta Webhook Payload Variants (from `tests/factories/ig_dm.py`)

| Factory call | Purpose |
|-------------|---------|
| `make_meta_webhook_payload()` | Standard inbound text DM |
| `make_meta_webhook_payload(is_echo=True)` | Outbound echo message |
| `make_meta_webhook_payload(message_type="image", image_url="...")` | Image DM |
| `make_meta_webhook_payload(body_text=None)` | Story mention (no body) |
| `make_meta_webhook_payload(body_text="x"*1001)` | Edge: very long message |
| `build_invalid_signature_headers(payload)` | Security rejection test |
| Multi-entry payload (3 entries) | Batch delivery test |

### DB Fixture Variants

| Fixture | What it creates |
|---------|----------------|
| `test_ig_dm_account` | `UserIgDmAccount` + `auth.users` row |
| `test_ig_dm_campaign_creator` | `CampaignCreator` with IG handle in `social_media_handles` |
| Inline in test | `ig_dm_thread_state` with open window |
| Inline in test | `ig_dm_thread_state` with expired window |
| Inline in test | `ig_dm_llm_draft` with `status=pending` |
| Inline in test | `ig_igsid_cache` row (fresh / stale) |

---

## 14. Regression Guards (Existing Functionality)

Specific tests to ensure IG DM changes do not break existing Gmail/SMTP flows:

**File**: `apps/backend/tests/temporal/workflow/test_coordinator_ig_dm_branch.py` — see §7.3 above. These tests explicitly assert Gmail/SMTP candidates take the unchanged email path.

Additionally, the following **existing tests** serve as regression guards and should not require modification:

| Existing Test File | Regression It Guards |
|-------------------|---------------------|
| `tests/temporal/activity/test_ingest_single_message_activity.py` | Gmail ingest unchanged |
| `tests/temporal/activity/test_gmail_thread_llm_draft_activity.py` | Gmail draft activities unchanged |
| `tests/temporal/workflow/test_semi_automated_workflow_logic.py` | Gmail coordinator flow unchanged |
| `tests/temporal/workflow/test_process_account_messages_workflow.py` | Gmail poll/history unchanged |

If any of these fail after IG DM changes are merged, it indicates a regression in the `update_state_status_activity` dispatch or `thread_processing_coordinator_workflow.py` branching.

---

## 15. Test Configuration

### Backend pytest configuration

**File**: `apps/backend/pyproject.toml` (existing, no changes needed)

Markers to add under `[tool.pytest.ini_options]`:
```toml
[tool.pytest.ini_options]
markers = [
    "integration: tests that require live DB (existing)",
    "e2e: scenarios requiring real Meta API (manual only)",
]
```

### Running Tests by Phase

```bash
# Phase 1 tests (DB + webhook + ingest)
pytest tests/api/test_ig_dm_webhook.py
pytest tests/repositories/test_ig_igsid_cache.py
pytest tests/repositories/test_campaign_creator_ig_dm.py
pytest tests/temporal/activity/test_ig_dm_ingest_activity.py
pytest tests/temporal/activity/test_ig_dm_media_download_activity.py
pytest tests/temporal/activity/test_ig_igsid_resolution_activity.py
pytest tests/temporal/workflow/test_ig_dm_ingest_workflow.py

# Phase 2 tests (API + send reply + AI drafting)
pytest tests/api/test_ig_dm_thread.py
pytest tests/temporal/activity/test_ig_dm_send_reply_activity.py
pytest tests/temporal/workflow/test_ig_dm_send_reply_workflow.py
pytest tests/temporal/workflow/test_coordinator_ig_dm_branch.py
pytest tests/services/ai/test_ig_dm_loader.py
pytest tests/services/ai/test_ig_dm_drafting.py

# Phase 3 tests (context engine)
pytest apps/context-engine/app/tests_v2/mcp/tools/cheerful/test_ig_dm_tools.py
pytest apps/context-engine/app/tests_v2/mcp/tools/cheerful/test_ig_dm_api.py

# Integration tests (all phases)
pytest -m integration tests/integration/test_ig_dm_ingest_pipeline.py
pytest -m integration tests/integration/test_ig_dm_send_reply_pipeline.py
pytest -m integration apps/context-engine/app/tests_v2/integration/test_ig_dm_flow.py

# Regression guards (run before merging any IG DM PR)
pytest tests/temporal/activity/test_ingest_single_message_activity.py
pytest tests/temporal/workflow/test_semi_automated_workflow_logic.py
```

---

## 16. Test Coverage Targets

| Component | Unit | Integration | Notes |
|-----------|------|-------------|-------|
| Webhook handler (`_verify_meta_signature` + routes) | 13 tests | 3 integration tests | Critical security path — full coverage |
| Ingest activities (dedup, store, state) | 14 tests | Part of pipeline test | All dedup branches covered |
| IGSID resolution activity + repository | 12 tests | — | All match methods + error cases |
| Media download activity | 4 tests | — | Expired URL non-fatal |
| Send reply activity + window check | 8 tests | Part of pipeline test | 24h enforcement critical |
| Ingest workflow (steps 1-6) | 8 workflow tests | Pipeline test | Echo gate, null candidate gate |
| Send reply workflow | 4 workflow tests | Pipeline test | Idempotency via mid |
| Coordinator IG DM branch | 6 tests | — | Regression guards included |
| AI drafting prompt routing | 4 tests | — | All 3 routing scenarios |
| CE tools (8 tools) | 15 tool tests | 5 E2E tests | 24h window enforcement |
| CE API client | 6 tests | — | Headers + endpoint paths |
| Regression guards (existing) | Existing (unchanged) | — | Run in PR check |

---

## Cross-References

| Topic | Reference |
|-------|-----------|
| Webhook handler implementation | `analysis/spec/webhook-handler.md` |
| Ingest workflow step-by-step | `analysis/spec/ingest-workflow.md` |
| Creator resolution pipeline | `analysis/spec/creator-resolution.md` |
| Send reply workflow | `analysis/spec/send-reply.md` |
| AI drafting prompt routing | `analysis/spec/ai-drafting.md` |
| CE tools implementation | `analysis/spec/ce-ig-dm-tools.md` |
| DB schemas (for fixture setup) | `analysis/spec/db-migrations.md` |
| Pydantic models (for factory typing) | `analysis/spec/pydantic-models.md` |
| Phase deliverables (what to test in each phase) | `analysis/spec/phase-plan.md` |
| Migration safety (rollback scenarios) | `analysis/spec/migration-safety.md` (next aspect) |
