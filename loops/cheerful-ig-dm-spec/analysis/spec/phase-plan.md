# Spec: Implementation Phase Plan — Instagram DM Support

**Aspect**: `spec-phase-plan`
**Wave**: 4 — Integration, Phasing & Synthesis
**Date**: 2026-03-01
**Input files**:
- `analysis/spec/db-migrations.md` — migration SQL
- `analysis/spec/meta-oauth.md` — OAuth flow + MetaGraphService
- `analysis/spec/webhook-handler.md` — webhook handler
- `analysis/spec/ingest-workflow.md` — IgDmIngestWorkflow
- `analysis/spec/creator-resolution.md` — IGSID resolution
- `analysis/spec/pydantic-models.md` — all new/modified models
- `analysis/spec/api-contracts.md` — all 17 routes
- `analysis/spec/temporal-interfaces.md` — all workflow/activity signatures
- `analysis/spec/send-reply.md` — IgDmSendReplyWorkflow
- `analysis/spec/ai-drafting.md` — AI drafting pipeline
- `analysis/spec/ce-ig-dm-tools.md` — 8 CE tools
- `analysis/spec/ce-ig-dm-notifications.md` — Slack notifications
- `analysis/spec/typescript-types.md` — frontend types (reference only)

---

## Overview

The implementation is structured into **4 phases**. Each phase is independently deployable and testable. All phases are gated by the `ENABLE_IG_DM` feature flag.

| Phase | Theme | Files Created | Files Modified | Effort (days) |
|-------|-------|--------------|----------------|---------------|
| 1 | DB + Webhook Ingest + OAuth | 23 | 12 | 8–10 |
| 2 | API Surface + Send Reply + AI Drafting | 17 | 9 | 8–10 |
| 3 | Context Engine + Slack Notifications | 4 | 9 | 5–7 |
| 4 | Polish (optional) | 0 | varies | 3–4 |
| **Total** | | **44** | **30** | **24–31** |

> **No frontend/webapp changes** in any phase. The context engine (Slack bot) is the sole interaction layer.

### Pre-Phase: Meta App Configuration

Before any code, complete these in the Meta Developer Portal. This is the **critical path item** — Instagram Messaging API permissions require App Review (2–4 weeks).

**Meta App checklist:**
- [ ] Create Meta App (type: Business)
- [ ] Add Instagram product: enable Messenger + Instagram Graph API
- [ ] Set valid OAuth redirect URI: `https://{backend-domain}/api/v1/ig-dm-accounts` (callback endpoint)
- [ ] Set webhook URL: `https://{backend-domain}/webhooks/instagram/`
- [ ] Set webhook verify token (must match `META_WEBHOOK_VERIFY_TOKEN` env var)
- [ ] Subscribe to webhook fields: `messages`, `messaging_postbacks`, `message_deliveries`, `message_reads`
- [ ] Request Advanced Access for:
  - `instagram_manage_messages` — read/send DMs
  - `instagram_basic` — profile info
  - `pages_messaging` — page-level send
  - `pages_manage_metadata` — subscribe webhook to page
  - `pages_read_engagement` — read page data
  - `business_management` — required for Business Login
- [ ] Submit for App Review (allow 2–4 weeks)
- [ ] Set `instagram_business_account` on App Dashboard after approval

**Start App Review immediately** — all other work can proceed in parallel in sandbox/dev mode using your own test Instagram account.

---

## Schema Discrepancies to Resolve Before Phase 1

Two spec files add items not in `spec-db-migrations.md`. Resolve before running the migration:

1. **`ig_dm_oauth_state` table** (`spec-meta-oauth.md`) — CSRF state table for OAuth flow. Add to migration:
   ```sql
   CREATE TABLE ig_dm_oauth_state (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
     state TEXT NOT NULL UNIQUE,
     redirect_uri TEXT,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '10 minutes')
   );
   CREATE INDEX ig_dm_oauth_state_state_idx ON ig_dm_oauth_state(state);
   ```

2. **Additional `user_ig_dm_account` columns** (`spec-meta-oauth.md`) — `user_access_token TEXT` and `user_token_expires_at TIMESTAMPTZ` needed for 60-day user token refresh. Add to `user_ig_dm_account` CREATE TABLE in migration.

3. **`window_expiry_notified_at TIMESTAMPTZ` on `ig_dm_thread_state`** (`spec-ce-ig-dm-notifications.md`) — needed for deduplicating expiry alerts. Add this column to `ig_dm_thread_state` CREATE TABLE in the Phase 1 migration (cheaper than a separate Phase 3 migration).

---

## Phase 1: DB Foundation + Webhook Ingest + Meta OAuth

**Theme**: Backend infrastructure. Webhooks received, messages persisted, threads created, IGSID resolved, IG account OAuth connected.

**Effort**: 8–10 engineering days

**Dependencies**: Meta App created (sandbox access sufficient); Supabase project accessible.

### Phase 1 New Files (23 files)

| Path | Purpose | Spec Reference |
|------|---------|----------------|
| `projects/cheerful/supabase/migrations/20260228000000_ig_dm_support.sql` | All DB changes: 6 new tables + 1 CSRF table + 4 ALTER TABLEs + indexes + triggers + RLS | `spec-db-migrations.md` |
| `apps/backend/src/models/database/user_ig_dm_account.py` | SQLAlchemy ORM: `UserIgDmAccount` | `spec-pydantic-models.md` |
| `apps/backend/src/models/database/ig_dm_message.py` | SQLAlchemy ORM: `IgDmMessage` + `IgDmMessageType` StrEnum | `spec-pydantic-models.md` |
| `apps/backend/src/models/database/ig_dm_thread_state.py` | SQLAlchemy ORM: `IgDmThreadState` + `LatestIgDmMessagePerThread` | `spec-pydantic-models.md` |
| `apps/backend/src/models/meta/__init__.py` | Module init for meta models package | `spec-pydantic-models.md` |
| `apps/backend/src/models/meta/webhook.py` | Pydantic: `MetaWebhookSender`, `MetaWebhookRecipient`, `MetaWebhookMessage`, `MetaWebhookMessaging`, `MetaWebhookEntry`, `MetaWebhookPayload` | `spec-pydantic-models.md` |
| `apps/backend/src/models/temporal/ig_dm_ingest.py` | Pydantic: `IgDmIngestInput`, `IgDmIngestResult`, `IgDmInitialSyncInput`, `IgDmTokenRefreshInput` | `spec-pydantic-models.md`, `spec-temporal-interfaces.md` |
| `apps/backend/src/models/temporal/ig_igsid_resolution.py` | Pydantic: `IgIsidResolutionInput`, `IgIdentityResult` | `spec-creator-resolution.md` |
| `apps/backend/src/services/external/meta_graph.py` | `MetaGraphService`: token exchange (code→short→long→page), webhook subscribe/unsubscribe, send DM, IGSID resolution, page listing | `spec-meta-oauth.md` |
| `apps/backend/src/services/external/ig_dm.py` | `IgDmService`: `get_user_info_by_igsid()`, `MetaApiError` hierarchy (`MetaApiRateLimitError`, `MetaApiNotFoundError`, `MetaApiInvalidError`) | `spec-creator-resolution.md` |
| `apps/backend/src/api/route/ig_dm_webhook.py` | FastAPI router: `GET /webhooks/instagram/` (hub.challenge) + `POST /webhooks/instagram/` (HMAC verify → BackgroundTask) | `spec-webhook-handler.md`, `spec-api-contracts.md` |
| `apps/backend/src/api/route/ig_dm_account.py` | FastAPI router: `POST /api/v1/ig-dm-accounts` (OAuth callback) + `GET` (list) + `GET /{id}` + `PATCH /{id}` + `DELETE /{id}` | `spec-api-contracts.md` |
| `apps/backend/src/repositories/ig_igsid_cache.py` | `IgIsidCacheRepository`: `get_by_igsid()` (7-day TTL check + `last_seen_at` update), `upsert()` | `spec-creator-resolution.md` |
| `apps/backend/src/temporal/workflow/ig_dm_ingest_workflow.py` | `IgDmIngestWorkflow`: 6-step per-message pipeline (dedup → media → store → state → IGSID resolve → coordinator) | `spec-ingest-workflow.md` |
| `apps/backend/src/temporal/workflow/ig_igsid_resolution_workflow.py` | `IgIsidResolutionWorkflow`: thin wrapper with `ALLOW_DUPLICATE_FAILED_ONLY` per IGSID; non-retryable error types | `spec-creator-resolution.md`, `spec-ingest-workflow.md` |
| `apps/backend/src/temporal/workflow/ig_dm_initial_sync_workflow.py` | `IgDmInitialSyncWorkflow`: one-time paginated Graph API conversation import on account connect | `spec-temporal-interfaces.md` |
| `apps/backend/src/temporal/workflow/ig_dm_token_refresh_workflow.py` | `IgDmTokenRefreshWorkflow`: daily cron (6AM UTC), refresh user tokens expiring within 7 days | `spec-meta-oauth.md`, `spec-temporal-interfaces.md` |
| `apps/backend/src/temporal/activity/ig_dm_ingest_activity.py` | Activities: `ig_dm_check_duplicate_activity`, `ig_dm_store_message_activity`, `ig_dm_insert_thread_state_activity`, `ig_dm_build_candidate_activity` | `spec-ingest-workflow.md` |
| `apps/backend/src/temporal/activity/ig_dm_media_download_activity.py` | Activity: `ig_dm_download_media_activity` — authenticated Meta CDN fetch → Supabase Storage; non-fatal on URL expiry | `spec-ingest-workflow.md` |
| `apps/backend/src/temporal/activity/ig_igsid_resolution_activity.py` | Activities: `ig_igsid_resolution_activity` (cache → Graph API → upsert → GIN match → disambiguate), `ig_dm_update_sender_username_activity` | `spec-creator-resolution.md` |
| `apps/backend/src/temporal/activity/ig_dm_thread_state_activity.py` | Activities: state read/write helpers for IG DM thread state repository | `spec-temporal-interfaces.md` |
| `apps/backend/src/temporal/activity/ig_dm_token_refresh_activities.py` | Activities: `ig_dm_refresh_user_token_activity`, `ig_dm_deactivate_account_activity` (on error code 190) | `spec-meta-oauth.md` |
| `apps/backend/src/temporal/activity/ig_dm_account_activity.py` | Activities: `ig_dm_subscribe_webhook_activity`, `ig_dm_start_initial_sync_activity` | `spec-temporal-interfaces.md` |

### Phase 1 Modified Files (12 files)

| Path | What Changes | Spec Reference |
|------|-------------|----------------|
| `apps/backend/src/core/config/definition.py` | Add `META_APP_ID`, `META_APP_SECRET`, `META_WEBHOOK_VERIFY_TOKEN`, `ENABLE_IG_DM`, `IG_DM_NOTIFICATION_CHANNEL`, `IG_DM_NOTIFICATION_BOT_TOKEN` (6 new env vars) | `spec-webhook-handler.md`, `spec-meta-oauth.md` |
| `apps/backend/main.py` | Import and mount `ig_dm_webhook_router` at `/webhooks` (app-level, NOT under `/api`) | `spec-api-contracts.md` |
| `apps/backend/src/api/router.py` | Import and mount `ig_dm_account_router` under `/api/v1` with tag `"ig-dm-accounts"` | `spec-api-contracts.md` |
| `apps/backend/src/models/database/account_type.py` | Add `INSTAGRAM_DM = "instagram_dm"` to `AccountType` StrEnum | `spec-pydantic-models.md` |
| `apps/backend/src/models/temporal/gmail_thread_state.py` | Extend `Candidate` with `ig_dm_account_id: UUID \| None`, `ig_conversation_id: str \| None`, `state__window_expires_at: datetime \| None`, `state__latest_ig_dm_message_id: UUID \| None`; extend `UpdateStateStatusParams` with `ig_dm_account_id: UUID \| None` | `spec-pydantic-models.md` |
| `apps/backend/src/temporal/workflow/__init__.py` | Add `IgDmIngestWorkflow`, `IgIsidResolutionWorkflow`, `IgDmInitialSyncWorkflow`, `IgDmTokenRefreshWorkflow` to `__all__` | `spec-temporal-interfaces.md` |
| `apps/backend/src/temporal/activity/__init__.py` | Add all Phase 1 activity functions to `__all__` | `spec-temporal-interfaces.md` |
| `apps/backend/src/temporal/search_attributes.py` | Add `IG_DM_ACCOUNT_ID_KEY`, `IG_CONVERSATION_ID_KEY`, `build_search_attributes_for_ig_dm_candidate()` | `spec-temporal-interfaces.md` |
| `apps/backend/src/temporal/worker.py` | Register Phase 1 workflows + activities with Temporal worker | `spec-temporal-interfaces.md` |
| `apps/backend/src/repositories/campaign_creator.py` | Add `find_by_ig_igsid(igsid, user_id)` (O(1) PK), `find_by_instagram_handle(username, user_id)` (GIN @> containment), `update_ig_igsid(campaign_creator_id, igsid)` | `spec-creator-resolution.md` |
| `apps/backend/src/temporal/workflow/thread_processing_coordinator_workflow.py` | Add `is_ig_dm = candidate.ig_dm_account_id is not None` discriminator branch (Phase 1 stub: state transition only, no draft — full branch in Phase 2) | `spec-ingest-workflow.md` |
| `apps/backend/src/temporal/activity/gmail_thread_state.py` | Extend `update_state_status_activity` to dispatch to `IgDmThreadStateRepository` when `ig_dm_account_id` is set | `spec-ingest-workflow.md` |

### Phase 1 Acceptance Criteria

1. **Webhook verification**: `GET /webhooks/instagram/?hub.mode=subscribe&hub.verify_token={token}&hub.challenge={n}` returns `{n}` as plaintext
2. **Webhook security**: `POST /webhooks/instagram/` with invalid `X-Hub-Signature-256` returns 403
3. **Inbound DM stored**: Posting a valid Meta webhook payload results in an `ig_dm_message` row in the DB within 5 seconds
4. **Thread state created**: An `ig_dm_thread_state` row is created with status `READY_FOR_CAMPAIGN_ASSOCIATION` and correct `window_expires_at = sent_at + 24h`
5. **Deduplication**: Re-sending the same webhook payload (same `mid`) results in exactly one `ig_dm_message` row (idempotent)
6. **IGSID resolution**: Sender IGSID is resolved to username via Graph API; result cached in `ig_igsid_cache`; `ig_dm_message.sender_username` backfilled
7. **Creator matching**: If `sender_username` matches a `social_media_handles` entry in `campaign_creator`, the IGSID is stored in `campaign_creator.ig_igsid` (write-through cache)
8. **OAuth flow**: Visiting the Meta OAuth URL, granting permissions, and completing the redirect results in a `user_ig_dm_account` row with valid `access_token` and `facebook_page_id`
9. **Webhook subscription**: After OAuth, the connected Facebook Page is subscribed to Instagram webhook fields
10. **Feature flag**: With `ENABLE_IG_DM=false`, webhook POST returns 200 with no-op (no DB writes, no Temporal starts)
11. **Email/SMTP unchanged**: All existing Gmail and SMTP workflow paths are unaffected — coordinator `is_smtp` branch is untouched

---

## Phase 2: API Surface + Send Reply + AI Drafting

**Theme**: Backend feature-complete. Full REST API for IG DMs; AI drafts generated and stored; replies sendable via API endpoint.

**Effort**: 8–10 engineering days

**Dependencies**: Phase 1 complete and deployed; Langfuse prompts created in Langfuse UI (see below).

### Langfuse Prompts (Manual Pre-Work — Create in UI Before Coding)

Create these 9 prompt templates in the Langfuse dashboard before implementing `ig_dm_drafting.py`:

| Prompt Name | Purpose |
|-------------|---------|
| `drafting/ig-dm-drafting-paid-promotion` | Base draft prompt for paid promotion campaigns |
| `drafting/ig-dm-drafting-gifting` | Base draft prompt for gifting campaigns |
| `drafting/ig-dm-drafting-sales` | Base draft prompt for sales campaigns |
| `drafting/ig-dm-drafting-general` | Base draft prompt for general campaigns |
| `drafting/ig-dm-drafting-v1-rag-paid-promotion` | RAG-augmented draft prompt for paid promotion |
| `drafting/ig-dm-drafting-v1-rag-gifting` | RAG-augmented draft prompt for gifting |
| `drafting/ig-dm-drafting-v1-rag-sales` | RAG-augmented draft prompt for sales |
| `drafting/ig-dm-drafting-v1-rag-general` | RAG-augmented draft prompt for general |
| `drafting/ig-dm-window-reopener` | Special prompt when 24h window expires in < 2h |

Key differences from email prompts: "1-4 sentences, plain text only, no markdown, no email greetings/sign-offs", window awareness, DM tone guidelines. See `spec-ai-drafting.md` for full system prompt specs.

### Phase 2 New Files (17 files)

| Path | Purpose | Spec Reference |
|------|---------|----------------|
| `apps/backend/src/api/route/ig_dm_thread.py` | FastAPI router: routes 8–13 (`GET /api/ig-dm/threads`, `GET /{id}/messages`, `POST /{id}/reply`, `GET /{id}/draft`, `POST /{id}/draft`, `PUT /{id}/draft`) | `spec-api-contracts.md` |
| `apps/backend/src/models/api/ig_dm_account.py` | Pydantic: `IgDmAccountResponse`, `IgDmConnectRequest`, `IgDmAccountListResponse`, `IgDmAccountUpdateRequest` | `spec-pydantic-models.md` |
| `apps/backend/src/models/api/ig_dm_message.py` | Pydantic: `IgDmMessageResponse`, `IgDmThreadSummary`, `IgDmThreadView`, `IgDmReplyRequest`, `IgDmReplyResponse`, `IgDmDraftResponse`, `IgDmDraftCreateRequest`, `IgDmDraftUpdateRequest` | `spec-pydantic-models.md`, `spec-api-contracts.md` |
| `apps/backend/src/models/database/ig_dm_llm_draft.py` | SQLAlchemy ORM: `IgDmLlmDraft` | `spec-pydantic-models.md` |
| `apps/backend/src/models/llm/ig_dm_draft.py` | Pydantic LLM output: `IgDmDraftResult(body_text: str)` (no subject field) | `spec-ai-drafting.md` |
| `apps/backend/src/models/temporal/ig_dm_send_reply.py` | Pydantic: `IgDmSendReplyActivityInput`, `IgDmWindowCheckResult`, `IgDmSendReplyResult` | `spec-send-reply.md`, `spec-temporal-interfaces.md` |
| `apps/backend/src/models/temporal/ig_dm_reply_example.py` | Pydantic: RAG ingestion models (`IgDmReplyExample`, `IgDmIngestReplyExamplesInput`) | `spec-ai-drafting.md` |
| `apps/backend/src/services/ai/ig_dm_loader.py` | `IgDmLoaderService`: `convert_thread_to_xml()` — DM thread → `<ig_dm_thread>` XML (no subject/to/cc, has from_handle, media_type, channel, window_expires_at attrs) | `spec-ai-drafting.md` |
| `apps/backend/src/services/ai/features/ig_dm_drafting.py` | `generate_ig_dm_draft()`: routing logic (window-reopener if < 2h, RAG if >= 3 examples, base otherwise), `IG_DM_DRAFT_PROMPT_MAP`, `IG_DM_RAG_PROMPT_MAP` | `spec-ai-drafting.md` |
| `apps/backend/src/repositories/ig_dm_reply_example.py` | `IgDmReplyExampleRepository`: `search_similar()` (pgvector cosine, HNSW, campaign-scoped), `insert()` (upsert on unique constraint) | `spec-ai-drafting.md` |
| `apps/backend/src/temporal/workflow/ig_dm_send_reply_workflow.py` | `IgDmSendReplyWorkflow`: window re-check → Meta API send → store outbound `ig_dm_message` → advance state to `WAITING_FOR_INBOUND` | `spec-send-reply.md` |
| `apps/backend/src/temporal/workflow/ig_dm_reconciliation_workflow.py` | `IgDmReconciliationWorkflow`: cron every 30 min, Graph API polling recovery, window expiry detection (stores results for Phase 3 notifications) | `spec-temporal-interfaces.md` |
| `apps/backend/src/temporal/workflow/ig_dm_thread_response_draft_workflow.py` | `IgDmThreadResponseDraftWorkflow`: IG DM variant — no Gmail upload, writes to `ig_dm_llm_draft` | `spec-ai-drafting.md` |
| `apps/backend/src/temporal/activity/ig_dm_send_reply_activity.py` | Activities: `ig_dm_check_reply_window_activity`, `ig_dm_send_reply_activity` (calls Meta `POST /{ig_business_account_id}/messages`) | `spec-send-reply.md` |
| `apps/backend/src/temporal/activity/ig_dm_thread_response_draft_activity.py` | Activities: `ig_dm_generate_draft_activity` (calls `generate_ig_dm_draft()`), `ig_dm_save_draft_to_db_activity` | `spec-ai-drafting.md` |
| `apps/backend/src/temporal/activity/ig_dm_llm_draft.py` | Activity: `maybe_get_draft_by_ig_dm_thread_state_id_activity` | `spec-ai-drafting.md` |
| `apps/backend/src/temporal/activity/ingest_ig_dm_reply_examples_activity.py` | Activity: RAG ingestion pipeline — batch embed + upsert `ig_dm_reply_example` rows | `spec-ai-drafting.md` |

### Phase 2 Modified Files (9 files)

| Path | What Changes | Spec Reference |
|------|-------------|----------------|
| `apps/backend/src/api/router.py` | Mount `ig_dm_thread_router` (produces `/api/ig-dm/threads/*`) | `spec-api-contracts.md` |
| `apps/backend/src/services/external/ig_dm.py` | Add `IgDmService.send_message(ig_business_account_id, recipient_igsid, message_type, text, media_url)` | `spec-send-reply.md` |
| `apps/backend/src/services/ai/rag.py` | Add `IgDmRagService` class, `format_ig_dm_rag_examples_xml()` (uses `<their_dm>` tag vs `<their_email>`) | `spec-ai-drafting.md` |
| `apps/backend/src/temporal/workflow/__init__.py` | Add `IgDmSendReplyWorkflow`, `IgDmReconciliationWorkflow`, `IgDmThreadResponseDraftWorkflow` to `__all__` | `spec-temporal-interfaces.md` |
| `apps/backend/src/temporal/activity/__init__.py` | Add Phase 2 activity functions to `__all__` | `spec-temporal-interfaces.md` |
| `apps/backend/src/temporal/workflow/thread_processing_coordinator_workflow.py` | **Complete** IG DM branch: add 24h window check (skip draft if window closed), call `IgDmThreadResponseDraftWorkflow`, call `ig_dm_save_draft_to_db_activity` instead of Gmail upload | `spec-ingest-workflow.md`, `spec-ai-drafting.md` |
| `apps/backend/src/temporal/workflow/thread_response_draft_workflow.py` | Add `is_ig_dm` branch: dispatch to `ig_dm_generate_draft_activity` + `ig_dm_save_draft_to_db_activity` (no Gmail upload step) | `spec-ai-drafting.md`, `spec-temporal-interfaces.md` |
| `apps/backend/src/temporal/activity/gmail_thread_llm_draft.py` | Extend `maybe_get_draft_by_thread_state_id_activity` and `maybe_get_draft_by_thread_id_activity` to dispatch to `IgDmLlmDraftRepository` when `ig_dm_account_id` is set | `spec-temporal-interfaces.md` |
| `apps/backend/src/temporal/worker.py` | Register Phase 2 workflows + activities with Temporal worker | `spec-temporal-interfaces.md` |

### Phase 2 Acceptance Criteria

1. **Thread listing**: `GET /api/ig-dm/threads` (JWT auth) returns paginated `IgDmThreadSummary` list with creator info, latest message snippet, status, window status
2. **Message listing**: `GET /api/ig-dm/threads/{id}/messages` returns all messages with direction, body, media attachments, sender handle
3. **Draft generated**: Within 30 seconds of an inbound DM being processed in Phase 1, `GET /api/ig-dm/threads/{id}/draft` returns an AI-generated draft
4. **Draft routing**: With < 2h window remaining, `drafting/ig-dm-window-reopener` prompt is used; with >= 3 RAG examples, RAG prompt variant is used
5. **Send reply**: `POST /api/ig-dm/threads/{id}/reply` with `{"message_text": "Hi!"}` successfully calls Meta API and stores outbound `ig_dm_message` row
6. **24h window enforcement**: `POST /api/ig-dm/threads/{id}/reply` on a thread with expired window returns HTTP 409 with `{"error": "dm_window_expired"}`
7. **Echo idempotency**: Meta webhook echo (delivered after our send) does not create a duplicate `ig_dm_message` row
8. **Draft lifecycle**: Draft status transitions `pending → approved → sent` when a draft is approved and the reply is sent
9. **Reconciliation**: `IgDmReconciliationWorkflow` cron fires every 30 min; Graph API polling recovers any missed messages from the last 30-minute window
10. **Message types**: Text (max 1000 chars), image URL, and video URL all send successfully via the reply endpoint

---

## Phase 3: Context Engine Tools + Slack Notifications

**Theme**: Interaction layer. All 8 CE tools functional via Slack; proactive Slack notifications firing for key IG DM events.

**Effort**: 5–7 engineering days

**Dependencies**: Phase 2 complete and deployed.

### Phase 3 New Files (4 files)

| Path | Purpose | Spec Reference |
|------|---------|----------------|
| `apps/context-engine/app/src_v2/mcp/tools/cheerful/ig_dm_api.py` | HTTP client functions: `search_ig_dm_threads()`, `get_ig_dm_thread()`, `list_ig_dm_accounts()`, `send_ig_dm_reply()`, `get_meta_oauth_url()`, `get_ig_dm_campaign_summary()` | `spec-ce-ig-dm-tools.md` |
| `apps/context-engine/app/src_v2/mcp/tools/cheerful/ig_dm_tools.py` | 8 `@tool` decorated functions: `cheerful_list_ig_dm_threads`, `cheerful_get_ig_dm_thread`, `cheerful_send_ig_dm_reply`, `cheerful_approve_ig_dm_draft`, `cheerful_search_ig_dms`, `cheerful_connect_ig_account`, `cheerful_list_ig_accounts`, `cheerful_ig_dm_campaign_summary` | `spec-ce-ig-dm-tools.md` |
| `apps/backend/src/temporal/activity/ig_dm_notify_activity.py` | Activities: `ig_dm_post_new_inbound_notification_activity`, `ig_dm_post_draft_ready_notification_activity`, `ig_dm_post_creator_matched_notification_activity`, `ig_dm_post_window_alert_notification_activity` (covers both expiring + expired) | `spec-ce-ig-dm-notifications.md` |
| `apps/backend/src/models/temporal/ig_dm_notify.py` | Pydantic: `IgDmNotifyInput`, `IgDmNotifyResult`, `IgDmExpiryNotifyInput`, `IgDmFetchExpiryCandidatesInput`, `IgDmNotificationType` StrEnum | `spec-ce-ig-dm-notifications.md` |

### Phase 3 Modified Files (9 files)

| Path | What Changes | Spec Reference |
|------|-------------|----------------|
| `apps/context-engine/app/src_v2/mcp/tools/cheerful/__init__.py` | Export all 8 new tool functions | `spec-ce-ig-dm-tools.md` |
| `apps/context-engine/app/src_v2/mcp/catalog.py` | Add 8 tools to `ALL_TOOLS` with `Platform.CHEERFUL`, `Action.READ` or `Action.WRITE` tags | `spec-ce-ig-dm-tools.md` |
| `apps/backend/src/services/external/slack_service.py` | Add 5 Block Kit builder methods: `build_ig_dm_new_inbound_blocks()`, `build_ig_dm_draft_ready_blocks()`, `build_ig_dm_creator_matched_blocks()`, `build_ig_dm_window_expiring_blocks()`, `build_ig_dm_window_expired_blocks()` | `spec-ce-ig-dm-notifications.md` |
| `apps/backend/src/temporal/activity/__init__.py` | Add notify activity functions to `__all__` | `spec-ce-ig-dm-notifications.md` |
| `apps/backend/src/temporal/workflow/ig_dm_ingest_workflow.py` | Add Step 7: fire-and-forget `ig_dm_post_new_inbound_notification_activity` after coordinator spawn | `spec-ce-ig-dm-notifications.md` |
| `apps/backend/src/temporal/workflow/thread_processing_coordinator_workflow.py` | Add fire-and-forget `ig_dm_post_draft_ready_notification_activity` in IG DM branch after draft saved | `spec-ce-ig-dm-notifications.md` |
| `apps/backend/src/temporal/workflow/ig_igsid_resolution_workflow.py` | Add fire-and-forget `ig_dm_post_creator_matched_notification_activity` when `was_newly_matched=True` | `spec-ce-ig-dm-notifications.md` |
| `apps/backend/src/temporal/workflow/ig_dm_reconciliation_workflow.py` | Add `ig_dm_post_window_alert_notification_activity` for threads with `window_expires_at BETWEEN now AND now+2h` and `window_expiry_notified_at IS NULL`; also fires for expired threads | `spec-ce-ig-dm-notifications.md` |
| `apps/backend/src/api/route/service.py` | Add 6 service routes: `GET /api/service/ig-dm/threads/search`, `GET /api/service/ig-dm/threads/{id}`, `GET /api/service/ig-dm/accounts`, `POST /api/service/ig-dm/threads/{id}/reply`, `GET /api/service/ig-dm/oauth-url`, `GET /api/service/ig-dm/campaigns/{id}/summary` | `spec-api-contracts.md`, `spec-ce-ig-dm-tools.md` |

### Phase 3 Acceptance Criteria

1. **List threads**: `@Cheerful cheerful_list_ig_dm_threads campaign_id=abc` in Slack returns formatted thread list with @handle, snippet, status badge, window indicator
2. **Get thread**: `@Cheerful cheerful_get_ig_dm_thread {id}` returns full conversation chat-style, creator info, AI draft preview
3. **Send reply**: `@Cheerful cheerful_send_ig_dm_reply {id} "Great! Let's connect"` sends the DM and confirms delivery in Slack
4. **24h enforcement**: Attempting to send on expired thread returns Slack error: "⏰ DM window has closed for this creator. You can no longer reply via DM."
5. **Approve draft**: `@Cheerful cheerful_approve_ig_dm_draft {id}` sends the AI draft and updates draft status to `sent`
6. **Connect account**: `@Cheerful cheerful_connect_ig_account` returns OAuth URL; completing the OAuth flow connects the account
7. **New inbound notification**: When a creator sends an IG DM, Slack posts to `IG_DM_NOTIFICATION_CHANNEL` within 10 seconds
8. **Draft ready notification**: When AI draft is generated, Slack posts notification with draft preview and approve button
9. **Window expiring alert**: When a thread has < 2h window remaining (no reply sent), Slack posts alert with time remaining
10. **Best-effort notifications**: `SlackApiError` in notification activities does not cause workflow failure or retry storm

---

## Phase 4: Polish (Optional)

**Theme**: Edge case coverage, operational hardening, error state visibility.

**Effort**: 3–4 engineering days

**Dependencies**: Phase 3 complete.

### Phase 4 Work Items

These are improvements that are not blocking for initial production usage but should be addressed before scaling:

| Item | Files | Priority |
|------|-------|----------|
| Media handling edge cases: retry on CDN expiry with 1-hour freshness check; alert when media unavailable | `ig_dm_media_download_activity.py` | High |
| Rate limit budget tracking: 200 IGSID calls/hr cap via Redis counter; backoff queue when near limit | `ig_dm.py`, `ig_igsid_resolution_activity.py` | High |
| Reconciliation gap detection: compare Graph API conversation list vs DB on account reconnect; fill gaps | `ig_dm_reconciliation_workflow.py`, `ig_dm_initial_sync_workflow.py` | Medium |
| Multi-account disambiguation display: surface `was_ambiguous=True` threads in CE tool output with disambiguation hint | `ig_dm_tools.py`, `ig_dm_api.py` | Medium |
| Token health monitoring: alert when `user_token_expires_at` < 7 days and refresh fails | `ig_dm_token_refresh_activities.py`, `slack_service.py` | Medium |
| Webhook subscription health check: periodic verify that page webhook subscription is active; resubscribe if dropped | `ig_dm_reconciliation_workflow.py`, `ig_dm_account_activity.py` | Medium |
| Story reply handling: `IgDmMessageType.story_reply` has special display rules (story may be deleted by time of reply); surface in CE | `ig_dm_tools.py` | Low |
| `HUMAN_AGENT` 7-day window: opt-in to extended 7-day reply window via Human Agent tag; gated by separate Meta permission | `ig_dm_send_reply_activity.py`, `ig_dm_thread.py` | Low |
| TypeScript frontend types: activate `spec/typescript-types.md` specs — 5 new webapp files + 2 modified; required for future webapp inbox UI phase | `apps/webapp/app/utils/ig-dm-types.ts`, `apps/webapp/lib/ig-dm-adapters.ts`, `apps/webapp/lib/ig-dm-api-client.ts`, `apps/webapp/app/(mail)/mail/hooks/use-ig-dm-queries.ts`, `apps/webapp/app/(mail)/mail/hooks/use-ig-dm-account.ts` | Deferred |

---

## Environment Variables Summary

All new environment variables introduced across phases:

| Variable | Phase | Required | Description |
|----------|-------|----------|-------------|
| `META_APP_ID` | 1 | Yes | Meta App ID from developer portal |
| `META_APP_SECRET` | 1 | Yes | Meta App Secret (used for HMAC webhook verification + token exchange) |
| `META_WEBHOOK_VERIFY_TOKEN` | 1 | Yes | Arbitrary secret string for Meta hub.challenge verification |
| `ENABLE_IG_DM` | 1 | Yes | Feature flag (`true`/`false`); all IG DM routes + workflows gate on this |
| `IG_DM_NOTIFICATION_CHANNEL` | 3 | If notifications enabled | Slack channel ID for IG DM event notifications |
| `IG_DM_NOTIFICATION_BOT_TOKEN` | 3 | If notifications enabled | Slack bot token with `chat:write` scope (may reuse `SLACK_DIGEST_BOT_TOKEN`) |

---

## Total File Manifest by Layer

### Backend (Python) — 39 new files, 26 modified files

**New files:**
- 1 SQL migration
- 6 SQLAlchemy ORM model files
- 2 Pydantic meta (webhook) model files
- 8 Pydantic temporal model files (ingest, resolution, send-reply, reply-example, notify, send-reply-models)
- 2 Pydantic API model files (account, message/thread/draft)
- 1 Pydantic LLM output model file
- 1 Meta Graph service file
- 1 IgDm service file
- 2 AI service files (loader, drafting features)
- 2 API route files (webhook, account, thread)
- 1 IGSID cache repository file
- 1 IG DM reply example repository file
- 8 Temporal workflow files
- 9 Temporal activity files

**Modified files** (across all phases): `config/definition.py`, `main.py`, `router.py`, `account_type.py`, `gmail_thread_state.py`, `workflow/__init__.py`, `activity/__init__.py`, `search_attributes.py`, `worker.py`, `campaign_creator.py`, `thread_processing_coordinator_workflow.py`, `gmail_thread_state.py` (activity), `service.py`, `ig_dm.py`, `rag.py`, `thread_response_draft_workflow.py`, `gmail_thread_llm_draft.py`, `slack_service.py`, `ig_dm_ingest_workflow.py`, `ig_igsid_resolution_workflow.py`, `ig_dm_reconciliation_workflow.py`

### Context Engine (Python) — 2 new files, 2 modified files

**New**: `ig_dm_api.py`, `ig_dm_tools.py`
**Modified**: `cheerful/__init__.py`, `catalog.py`

### Database — 1 migration file, 7 new tables, 4 modified tables

**New tables**: `user_ig_dm_account`, `ig_dm_message`, `ig_igsid_cache`, `ig_dm_thread_state`, `latest_ig_dm_message_per_thread`, `ig_dm_llm_draft`, `ig_dm_oauth_state`
**Modified tables**: `campaign_sender` (3-way CHECK), `campaign_thread` (3-way CHECK + new cols), `thread_flag` (3-way CHECK + new cols), `campaign_creator` (`ig_igsid` + GIN index)

### Langfuse — 9 prompts (created in UI, not code)

### Frontend (TypeScript) — Deferred to Phase 4 / Future Sprint

5 new files + 2 modified files from `spec-typescript-types.md` are reference material for a future webapp inbox UI phase.

---

## Cross-Reference Index

| Component | Spec File |
|-----------|-----------|
| DB schema (SQL) | `analysis/spec/db-migrations.md` |
| Pydantic + ORM models | `analysis/spec/pydantic-models.md` |
| API routes (all 17) | `analysis/spec/api-contracts.md` |
| Temporal workflows + activities | `analysis/spec/temporal-interfaces.md` |
| Meta OAuth flow | `analysis/spec/meta-oauth.md` |
| Webhook handler | `analysis/spec/webhook-handler.md` |
| Ingest workflow (6 steps) | `analysis/spec/ingest-workflow.md` |
| IGSID resolution | `analysis/spec/creator-resolution.md` |
| Send reply workflow | `analysis/spec/send-reply.md` |
| AI drafting pipeline | `analysis/spec/ai-drafting.md` |
| Context engine tools (8) | `analysis/spec/ce-ig-dm-tools.md` |
| Slack notifications (5 types) | `analysis/spec/ce-ig-dm-notifications.md` |
| TypeScript types (future) | `analysis/spec/typescript-types.md` |
