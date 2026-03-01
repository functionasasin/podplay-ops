# Implementation Spec: Instagram DM Support for Cheerful

**Aspect**: `synthesis-implementation-spec`
**Wave**: 4 — Integration, Phasing & Synthesis
**Date**: 2026-03-01
**Status**: FINAL — Developer Handoff Document

---

## Read This First

This document is the master handoff for adding Instagram DM support to the Cheerful platform. It synthesizes 23 prior spec files into a single developer entry point.

**Strategic constraints**:
- **Backend-only + Context Engine** — zero frontend/webapp changes. All IG DM operations are performed via Slack using the Context Engine (8 MCP tools). The webapp inbox UI is unchanged.
- **Parallel Tables** architecture — new `ig_dm_*` tables following the SMTP precedent. No changes to the existing Gmail or SMTP pipelines.
- **Direct Meta API** — Instagram Messaging API via Messenger Platform (webhook-first), with Graph API polling for recovery/reconciliation.
- **Feature flag gated** — `ENABLE_IG_DM=true|false` gates all new routes, CE tools, and workflows. Safe to merge to main with flag off.

**Start here, in order**:
1. Read this document in full (~15 min)
2. Submit Meta App Review immediately (2–7 week wait — critical path)
3. Begin Phase 1 implementation (DB + webhook ingest + OAuth)
4. Proceed to Phase 2 (API + send reply + AI drafting)
5. Deploy Phase 3 (CE tools + Slack notifications)

---

## Table of Contents

| # | Section |
|---|---------|
| 1 | [Architecture Overview](#1-architecture-overview) |
| 2 | [Database Changes Summary](#2-database-changes-summary) |
| 3 | [Environment Variables](#3-environment-variables) |
| 4 | [Meta App Configuration Checklist](#4-meta-app-configuration-checklist) |
| 5 | [Implementation Phases](#5-implementation-phases) |
| 6 | [Complete File Manifest](#6-complete-file-manifest) |
| 7 | [Component Spec Index](#7-component-spec-index) |
| 8 | [Developer Quick-Reference](#8-developer-quick-reference) |

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           INBOUND DM FLOW                                │
│                                                                          │
│  Instagram User                                                          │
│       │ sends DM                                                         │
│       ▼                                                                  │
│  Meta Platform ──────webhook (HTTPS POST)──────────────────────────────► │
│                                                         Cheerful Backend │
│                                               GET /webhooks/instagram/   │
│                                              POST /webhooks/instagram/   │
│                                                       │                  │
│                                            HMAC-SHA256 verify            │
│                                                       │                  │
│                                            BackgroundTask dispatch       │
│                                                       │                  │
│                                                       ▼                  │
│                                           Temporal: IgDmIngestWorkflow   │
│                                    ┌──────────────────────────────────┐  │
│                                    │ 1. Dedup by mid                  │  │
│                                    │ 2. Download media → Supabase     │  │
│                                    │ 3. Store ig_dm_message           │  │
│                                    │ 4. Create ig_dm_thread_state     │  │
│                                    │ 5. Spawn IgIsidResolutionWorkflow│  │
│                                    │ 6. Spawn Coordinator Workflow    │  │
│                                    │ 7. Post Slack notification       │  │
│                                    └──────────────────────────────────┘  │
│                                                       │                  │
│                                              ThreadProcessingCoordinator  │
│                                    ┌──────────────────────────────────┐  │
│                                    │ is_ig_dm branch:                 │  │
│                                    │ - Campaign association           │  │
│                                    │ - 24h window check               │  │
│                                    │ - AI draft generation            │  │
│                                    │ - Save to ig_dm_llm_draft        │  │
│                                    │ - Post draft-ready notification  │  │
│                                    └──────────────────────────────────┘  │
│                                                       │                  │
│                                                  Supabase DB             │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                       REPLY FLOW (via Context Engine)                    │
│                                                                          │
│  Human (in Slack)                                                        │
│       │ @Cheerful cheerful_send_ig_dm_reply {id} "Great, let's connect!" │
│       ▼                                                                  │
│  Context Engine (Slack Bot)                                              │
│       │                                                                  │
│       ▼ X-Service-Api-Key                                                │
│  Backend: POST /api/service/ig-dm/threads/{id}/reply                    │
│       │                                                                  │
│       ▼                                                                  │
│  Temporal: IgDmSendReplyWorkflow                                        │
│       │ 1. Re-check 24h window (reject if expired)                      │
│       │ 2. Call Meta POST /{ig_business_account_id}/messages             │
│       │ 3. Store outbound ig_dm_message                                  │
│       │ 4. Update state → WAITING_FOR_INBOUND                           │
│       ▼                                                                  │
│  Meta Platform → Instagram User receives DM                              │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                      PROACTIVE NOTIFICATIONS                              │
│                                                                          │
│  Temporal workflows fire-and-forget:                                     │
│  - IgDmIngestWorkflow       → NEW_INBOUND notification                  │
│  - Coordinator Workflow     → DRAFT_READY notification                  │
│  - IgIsidResolutionWorkflow → CREATOR_MATCHED notification              │
│  - ReconciliationWorkflow   → WINDOW_EXPIRING / WINDOW_EXPIRED alerts   │
│                                                                          │
│  Backend SlackService → Slack Channel (IG_DM_NOTIFICATION_CHANNEL)      │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                       RECOVERY / RECONCILIATION                          │
│                                                                          │
│  IgDmReconciliationWorkflow (cron every 30 min)                         │
│       │                                                                  │
│       ├── Graph API: GET /{ig_account}/conversations?since=last_cursor   │
│       │   → fills gaps missed by webhooks                               │
│       │                                                                  │
│       └── Expiry scan: ig_dm_thread_state WHERE window_expires_at       │
│           BETWEEN now AND now+2h AND window_expiry_notified_at IS NULL  │
│           → WINDOW_EXPIRING notifications                               │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Changes Summary

**Migration file**: `projects/cheerful/supabase/migrations/20260228000000_ig_dm_support.sql`

Full spec: [`analysis/spec/db-migrations.md`](db-migrations.md)

### New Tables (7)

| Table | Purpose | Rows represent | RLS |
|-------|---------|---------------|-----|
| `user_ig_dm_account` | Credentials + webhook state per connected IG Business Account | One OAuth-connected Instagram account | Owner CRUD |
| `ig_dm_message` | Individual DM messages (inbound + outbound) | One message with `mid` unique per account | Owner SELECT |
| `ig_dm_thread_state` | Append-only state machine for DM conversations | One state transition event | Owner SELECT |
| `ig_igsid_cache` | Shared IGSID → @username resolution cache | One resolved identity | None (system cache) |
| `latest_ig_dm_message_per_thread` | Denormalized latest-message per conversation | One row per (account, conversation) | Owner SELECT via account JOIN |
| `ig_dm_llm_draft` | AI-generated draft replies | One draft per thread state version | Owner SELECT |
| `ig_dm_oauth_state` | CSRF state for Meta OAuth flow (10-min TTL) | One in-flight OAuth request | None |

### Modified Tables (4)

| Table | New Columns | Constraint Change |
|-------|------------|-------------------|
| `campaign_sender` | `ig_dm_account_id UUID` | 2-way CHECK → 3-way mutual exclusivity |
| `campaign_thread` | `ig_dm_thread_id TEXT`, `ig_dm_account_id UUID` | 2-way CHECK → 3-way + subsidiary account CHECK |
| `thread_flag` | `ig_dm_thread_id TEXT`, `ig_dm_account_id UUID` | 2-way CHECK → 3-way + subsidiary account CHECK |
| `campaign_creator` | `ig_igsid TEXT` | GIN index added on `social_media_handles` JSONB |

### Schema Discrepancies (Resolved Before Running Migration)

Three items identified in [`spec-phase-plan.md`](phase-plan.md) that must be added to the migration before running:

1. **`ig_dm_oauth_state` table** — CSRF state for OAuth (see migration file Section 11 addendum)
2. **`user_ig_dm_account.user_access_token` + `user_token_expires_at`** — Required for 60-day user token refresh (`IgDmTokenRefreshWorkflow`)
3. **`ig_dm_thread_state.window_expiry_notified_at TIMESTAMPTZ`** — Deduplication for expiry alert notifications

All three must be added to `20260228000000_ig_dm_support.sql` before the migration runs. Do not create a separate migration for these.

### Zero-Risk Migration

All operations are either:
- New tables (purely additive)
- `ADD COLUMN IF NOT EXISTS` with nullable columns (instant catalog update, no table rewrite)
- CHECK constraint expansion where existing rows trivially satisfy the new 3-way expression (new columns default to NULL → existing Gmail/SMTP rows satisfy the first two branches)

See [`analysis/spec/migration-safety.md`](migration-safety.md) for full rollback SQL and zero-downtime deployment sequence.

---

## 3. Environment Variables

All new environment variables introduced across phases. Add to `.env`, Fly.io secrets, and Vercel env.

| Variable | Phase | Required | Description |
|----------|-------|----------|-------------|
| `META_APP_ID` | 1 | Yes | Meta App ID from `developers.facebook.com/apps/` |
| `META_APP_SECRET` | 1 | Yes | Meta App Secret — used for HMAC webhook verification (X-Hub-Signature-256) and token exchange |
| `META_WEBHOOK_VERIFY_TOKEN` | 1 | Yes | Arbitrary secret string for Meta `hub.challenge` webhook verification. Must match webhook config in Meta dashboard |
| `ENABLE_IG_DM` | 1 | Yes | Feature flag. Set `false` in production until Phase 1 is fully verified. Set `true` to enable all IG DM routes, CE tools, and workflows |
| `IG_DM_NOTIFICATION_CHANNEL` | 3 | If notifications enabled | Slack channel ID (e.g. `C0123ABCDE`) for IG DM event notifications (new inbound, draft ready, expiry alerts) |
| `IG_DM_NOTIFICATION_BOT_TOKEN` | 3 | If notifications enabled | Slack bot OAuth token with `chat:write` scope. May reuse `SLACK_DIGEST_BOT_TOKEN` if that bot has access to the target channel |

**Env var naming note**: `spec-api-contracts.md` (written earlier) used `INSTAGRAM_APP_ID` / `INSTAGRAM_APP_SECRET`. The canonical names are `META_APP_ID` / `META_APP_SECRET` (per `spec-meta-oauth.md` and `spec-webhook-handler.md`). Use the `META_` prefix throughout.

---

## 4. Meta App Configuration Checklist

Complete this **before starting Phase 1 implementation**. App Review takes 2–7 weeks — it is the critical path.

Full spec: [`analysis/spec/meta-oauth.md`](meta-oauth.md)

### Step 1: Create the App

- [ ] Go to `https://developers.facebook.com/apps/` → Create App
- [ ] Select App type: **Business**
- [ ] Add products: **Instagram** (adds Messenger Platform for DM capability)
- [ ] ⚠️ Do NOT use "Instagram API with Instagram Login" — use the legacy Messenger Platform path

### Step 2: Configure Webhook (App-Level)

- [ ] Navigate to: App → Products → Webhooks → Add Subscription → Instagram
- [ ] Callback URL: `https://{CHEERFUL_BACKEND_URL}/webhooks/instagram/`
- [ ] Verify Token: set to the value you'll use for `META_WEBHOOK_VERIFY_TOKEN`
- [ ] Subscribe to fields: `messages`, `message_echoes`
- [ ] Optional: `message_deliveries`, `message_reads`
- [ ] ⚠️ The webhook GET verification endpoint must be live before this step works

### Step 3: Configure OAuth Redirect URI

- [ ] Navigate to: App → Facebook Login → Settings → Valid OAuth Redirect URIs
- [ ] Add: `https://{CHEERFUL_BACKEND_URL}/api/v1/ig-dm-accounts`

### Step 4: Request Advanced Access Permissions

- [ ] `instagram_manage_messages` — read/send DMs (Advanced Access, App Review required)
- [ ] `pages_manage_metadata` — subscribe page to webhooks (Advanced Access)
- [ ] `pages_show_list` — list Facebook Pages (Advanced Access)
- [ ] `pages_messaging` — send on behalf of page (Advanced Access)
- [ ] `business_management` — IGSID → profile resolution (Advanced Access)
- [ ] `instagram_basic` — basic profile (Standard, no review needed)

### Step 5: Submit App Review

- [ ] Switch app to **Live Mode** (required before submitting)
- [ ] Upload screencast video for each Advanced Access permission showing Cheerful's usage
- [ ] Write privacy policy at publicly accessible HTTPS URL
- [ ] Submit review — **allow 2–7 business days**

### Step 6: Development/Testing Without App Review

While waiting for App Review:
- [ ] Add your Instagram test accounts as **App Testers** in Meta Developer Dashboard
- [ ] Use **Development Mode** — all features work but only for accounts with App Roles (Admin, Developer, Tester)
- [ ] Run full Phase 1–3 implementation using test accounts

### Step 7: After App Review Approval

- [ ] Set `META_APP_ID` and `META_APP_SECRET` in all environments
- [ ] Verify webhook endpoint responds to `GET /webhooks/instagram/` with `hub.challenge`
- [ ] Set `ENABLE_IG_DM=true` to enable routes
- [ ] Run smoke tests against production Meta webhook

---

## 5. Implementation Phases

Summary of 4 phases. Full detail in [`analysis/spec/phase-plan.md`](phase-plan.md).

| Phase | Theme | New Files | Modified Files | Effort |
|-------|-------|-----------|----------------|--------|
| 1 | DB + Webhook Ingest + Meta OAuth | 23 | 12 | 8–10 days |
| 2 | API Surface + Send Reply + AI Drafting | 17 | 9 | 8–10 days |
| 3 | CE Tools + Slack Notifications | 4 | 9 | 5–7 days |
| 4 | Polish (optional) | 0 | varies | 3–4 days |
| **Total** | | **44** | **30** | **24–31 days** |

### Phase 1: DB Foundation + Webhook Ingest + Meta OAuth

**Acceptance criteria (abbreviated)**:
- Webhook GET verification returns `hub.challenge`
- POST with invalid signature → 403; valid → 200 + async processing
- Inbound DM produces `ig_dm_message` row within 5 seconds
- `ig_dm_thread_state` created with `window_expires_at = sent_at + 24h`
- Duplicate webhook (same `mid`) produces exactly one row (idempotent)
- IGSID resolved to `@username`, cached in `ig_igsid_cache`
- Meta OAuth flow produces `user_ig_dm_account` row with valid `access_token`
- With `ENABLE_IG_DM=false`, all IG DM routes return 503; webhook POST returns 200 no-op

**Key pre-work**: Create 9 Langfuse prompt templates in Langfuse UI (can be empty stubs for Phase 1).

### Phase 2: API Surface + Send Reply + AI Drafting

**Dependencies**: Phase 1 deployed; Langfuse prompts created (see list in [`spec-phase-plan.md`](phase-plan.md)).

**Acceptance criteria (abbreviated)**:
- `GET /api/ig-dm/threads` returns paginated thread list with creator info
- `POST /api/ig-dm/threads/{id}/reply` sends DM and stores outbound message
- 24h window enforcement: expired thread reply → HTTP 409
- AI draft generated within 30s of inbound DM processing
- Window-reopener prompt used when < 2h remaining
- RAG prompt variant used when >= 3 examples available

### Phase 3: Context Engine Tools + Slack Notifications

**Dependencies**: Phase 2 deployed.

**Acceptance criteria (abbreviated)**:
- All 8 CE tools functional via Slack (`@Cheerful cheerful_list_ig_dm_threads`, etc.)
- New inbound DM → Slack notification within 10 seconds
- AI draft ready → Slack notification with approve button
- Window expiring alert fires when < 2h remaining with no reply sent
- `SlackApiError` in notifications never causes workflow failure

### Phase 4: Polish (Optional)

Non-blocking improvements: media retry logic, rate limit budget tracking, reconciliation gap detection, multi-account disambiguation display, token health monitoring, webhook subscription health check, story reply display, HUMAN_AGENT 7-day window opt-in. See [`spec-phase-plan.md`](phase-plan.md) for full item list.

**Deferred**: TypeScript frontend types (`spec/typescript-types.md`) are reference material for a future webapp inbox UI phase — not part of any current phase.

---

## 6. Complete File Manifest

All paths relative to `projects/cheerful/`.

### Phase 1 — New Files (23)

| Path | Purpose |
|------|---------|
| `supabase/migrations/20260228000000_ig_dm_support.sql` | All DB changes (7 new tables + 4 ALTER TABLEs + indexes + triggers + RLS) |
| `apps/backend/src/models/database/user_ig_dm_account.py` | SQLAlchemy ORM: `UserIgDmAccount` |
| `apps/backend/src/models/database/ig_dm_message.py` | SQLAlchemy ORM: `IgDmMessage` + `IgDmMessageType` StrEnum |
| `apps/backend/src/models/database/ig_dm_thread_state.py` | SQLAlchemy ORM: `IgDmThreadState`, `LatestIgDmMessagePerThread`, `IgDmLlmDraft` |
| `apps/backend/src/models/meta/__init__.py` | Meta models package init |
| `apps/backend/src/models/meta/webhook.py` | Pydantic: `MetaWebhookPayload`, `MetaWebhookEntry`, `MetaWebhookMessaging`, `MetaWebhookMessage`, `MetaWebhookSender`, `MetaWebhookRecipient` |
| `apps/backend/src/models/temporal/ig_dm_ingest.py` | Pydantic: `IgDmIngestInput`, `IgDmIngestResult`, `IgDmInitialSyncInput`, `IgDmTokenRefreshInput` |
| `apps/backend/src/models/temporal/ig_igsid_resolution.py` | Pydantic: `IgIsidResolutionInput`, `IgIdentityResult` |
| `apps/backend/src/services/external/meta_graph.py` | `MetaGraphService`: token exchange, webhook subscribe, send DM, IGSID resolution, page listing |
| `apps/backend/src/services/external/ig_dm.py` | `IgDmService`: `get_user_info_by_igsid()`, Meta API error hierarchy |
| `apps/backend/src/api/route/ig_dm_webhook.py` | FastAPI router: `GET /webhooks/instagram/` + `POST /webhooks/instagram/` |
| `apps/backend/src/api/route/ig_dm_account.py` | FastAPI router: IG DM account CRUD (5 routes) |
| `apps/backend/src/repositories/ig_igsid_cache.py` | `IgIsidCacheRepository`: `get_by_igsid()` (7-day TTL), `upsert()` |
| `apps/backend/src/temporal/workflow/ig_dm_ingest_workflow.py` | `IgDmIngestWorkflow`: 6-step per-message pipeline |
| `apps/backend/src/temporal/workflow/ig_igsid_resolution_workflow.py` | `IgIsidResolutionWorkflow`: thin wrapper with ALLOW_DUPLICATE_FAILED_ONLY |
| `apps/backend/src/temporal/workflow/ig_dm_initial_sync_workflow.py` | `IgDmInitialSyncWorkflow`: one-time paginated conversation import on account connect |
| `apps/backend/src/temporal/workflow/ig_dm_token_refresh_workflow.py` | `IgDmTokenRefreshWorkflow`: daily cron, refresh 60-day user tokens |
| `apps/backend/src/temporal/activity/ig_dm_ingest_activity.py` | Activities: `ig_dm_check_duplicate_activity`, `ig_dm_store_message_activity`, `ig_dm_insert_thread_state_activity`, `ig_dm_build_candidate_activity` |
| `apps/backend/src/temporal/activity/ig_dm_media_download_activity.py` | Activity: `ig_dm_download_media_activity` (Meta CDN → Supabase Storage) |
| `apps/backend/src/temporal/activity/ig_igsid_resolution_activity.py` | Activities: `ig_igsid_resolution_activity`, `ig_dm_update_sender_username_activity` |
| `apps/backend/src/temporal/activity/ig_dm_thread_state_activity.py` | State read/write activities for `IgDmThreadStateRepository` |
| `apps/backend/src/temporal/activity/ig_dm_token_refresh_activities.py` | Activities: `ig_dm_refresh_user_token_activity`, `ig_dm_deactivate_account_activity` |
| `apps/backend/src/temporal/activity/ig_dm_account_activity.py` | Activities: `ig_dm_subscribe_webhook_activity`, `ig_dm_start_initial_sync_activity` |

### Phase 1 — Modified Files (12)

| Path | What Changes |
|------|-------------|
| `apps/backend/src/core/config/definition.py` | Add `META_APP_ID`, `META_APP_SECRET`, `META_WEBHOOK_VERIFY_TOKEN`, `ENABLE_IG_DM`, `IG_DM_NOTIFICATION_CHANNEL`, `IG_DM_NOTIFICATION_BOT_TOKEN` |
| `apps/backend/main.py` | Mount `ig_dm_webhook_router` at `/webhooks` (app-level, not under `/api`) |
| `apps/backend/src/api/router.py` | Mount `ig_dm_account_router` under `/api/v1` |
| `apps/backend/src/models/database/account_type.py` | Add `INSTAGRAM_DM = "instagram_dm"` to `AccountType` StrEnum |
| `apps/backend/src/models/temporal/gmail_thread_state.py` | Extend `Candidate` with `ig_dm_account_id`, `ig_conversation_id`, `state__window_expires_at`, `state__latest_ig_dm_message_id`; extend `UpdateStateStatusParams` with `ig_dm_account_id` |
| `apps/backend/src/temporal/workflow/__init__.py` | Add Phase 1 workflows to `__all__` |
| `apps/backend/src/temporal/activity/__init__.py` | Add Phase 1 activity functions to `__all__` |
| `apps/backend/src/temporal/search_attributes.py` | Add `IG_DM_ACCOUNT_ID_KEY`, `IG_CONVERSATION_ID_KEY`, `build_search_attributes_for_ig_dm_candidate()` |
| `apps/backend/src/temporal/worker.py` | Register Phase 1 workflows + activities |
| `apps/backend/src/repositories/campaign_creator.py` | Add `find_by_ig_igsid()`, `find_by_instagram_handle()` (GIN @>), `update_ig_igsid()` |
| `apps/backend/src/temporal/workflow/thread_processing_coordinator_workflow.py` | Add `is_ig_dm` branch stub (Phase 1: state transition only; full draft logic in Phase 2) |
| `apps/backend/src/temporal/activity/gmail_thread_state.py` | Extend `update_state_status_activity` to dispatch to `IgDmThreadStateRepository` when `ig_dm_account_id` is set |

### Phase 2 — New Files (17)

| Path | Purpose |
|------|---------|
| `apps/backend/src/api/route/ig_dm_thread.py` | FastAPI router: DM thread CRUD + reply + draft (6 routes) |
| `apps/backend/src/models/api/ig_dm_account.py` | Pydantic API models: `IgDmAccountResponse`, `IgDmConnectRequest`, `IgDmAccountListResponse`, `IgDmAccountUpdateRequest` |
| `apps/backend/src/models/api/ig_dm_message.py` | Pydantic API models: `IgDmMessageResponse`, `IgDmThreadSummary`, `IgDmThreadView`, `IgDmReplyRequest`, `IgDmReplyResponse`, `IgDmDraftResponse`, `IgDmDraftCreateRequest`, `IgDmDraftUpdateRequest` |
| `apps/backend/src/models/database/ig_dm_llm_draft.py` | SQLAlchemy ORM: `IgDmLlmDraft` |
| `apps/backend/src/models/llm/ig_dm_draft.py` | Pydantic LLM output: `IgDmDraftResult(body_text: str)` (no subject field) |
| `apps/backend/src/models/temporal/ig_dm_send_reply.py` | Pydantic: `IgDmSendReplyActivityInput`, `IgDmWindowCheckResult`, `IgDmSendReplyResult` |
| `apps/backend/src/models/temporal/ig_dm_reply_example.py` | Pydantic: RAG ingestion models (`IgDmReplyExample`, `IgDmIngestReplyExamplesInput`) |
| `apps/backend/src/services/ai/ig_dm_loader.py` | `IgDmLoaderService`: `convert_thread_to_xml()` — produces `<ig_dm_thread>` XML (no subject/to/cc, adds `from_handle`, `media_type`, `window_expires_at`) |
| `apps/backend/src/services/ai/features/ig_dm_drafting.py` | `generate_ig_dm_draft()`: routes to window-reopener (< 2h), RAG (>= 3 examples), or base prompt; `IG_DM_DRAFT_PROMPT_MAP`, `IG_DM_RAG_PROMPT_MAP` |
| `apps/backend/src/repositories/ig_dm_reply_example.py` | `IgDmReplyExampleRepository`: `search_similar()` (pgvector cosine, campaign-scoped), `insert()` |
| `apps/backend/src/temporal/workflow/ig_dm_send_reply_workflow.py` | `IgDmSendReplyWorkflow`: window check → Meta API → store outbound → advance state to WAITING_FOR_INBOUND |
| `apps/backend/src/temporal/workflow/ig_dm_reconciliation_workflow.py` | `IgDmReconciliationWorkflow`: cron every 30 min, Graph API polling recovery + window expiry detection |
| `apps/backend/src/temporal/workflow/ig_dm_thread_response_draft_workflow.py` | `IgDmThreadResponseDraftWorkflow`: IG DM variant (no Gmail upload, writes to `ig_dm_llm_draft`) |
| `apps/backend/src/temporal/activity/ig_dm_send_reply_activity.py` | Activities: `ig_dm_check_reply_window_activity`, `ig_dm_send_reply_activity` |
| `apps/backend/src/temporal/activity/ig_dm_thread_response_draft_activity.py` | Activities: `ig_dm_generate_draft_activity`, `ig_dm_save_draft_to_db_activity` |
| `apps/backend/src/temporal/activity/ig_dm_llm_draft.py` | Activity: `maybe_get_draft_by_ig_dm_thread_state_id_activity` |
| `apps/backend/src/temporal/activity/ingest_ig_dm_reply_examples_activity.py` | Activity: RAG ingestion pipeline — batch embed + upsert `ig_dm_reply_example` rows |

### Phase 2 — Modified Files (9)

| Path | What Changes |
|------|-------------|
| `apps/backend/src/api/router.py` | Mount `ig_dm_thread_router` (produces `/api/ig-dm/threads/*`) |
| `apps/backend/src/services/external/ig_dm.py` | Add `IgDmService.send_message()` |
| `apps/backend/src/services/ai/rag.py` | Add `IgDmRagService` class + `format_ig_dm_rag_examples_xml()` (uses `<their_dm>` tag) |
| `apps/backend/src/temporal/workflow/__init__.py` | Add Phase 2 workflows |
| `apps/backend/src/temporal/activity/__init__.py` | Add Phase 2 activity functions |
| `apps/backend/src/temporal/workflow/thread_processing_coordinator_workflow.py` | **Complete** IG DM branch: 24h window check, AI draft call, `ig_dm_save_draft_to_db_activity` |
| `apps/backend/src/temporal/workflow/thread_response_draft_workflow.py` | Add `is_ig_dm` branch dispatching to IG DM draft activities |
| `apps/backend/src/temporal/activity/gmail_thread_llm_draft.py` | Extend draft lookup activities to dispatch to `IgDmLlmDraftRepository` when `ig_dm_account_id` is set |
| `apps/backend/src/temporal/worker.py` | Register Phase 2 workflows + activities |

### Phase 3 — New Files (4)

| Path | Purpose |
|------|---------|
| `apps/context-engine/app/src_v2/mcp/tools/cheerful/ig_dm_api.py` | HTTP client: 6 async functions calling `/api/service/ig-dm/*` |
| `apps/context-engine/app/src_v2/mcp/tools/cheerful/ig_dm_tools.py` | 8 `@tool` decorated IG DM MCP tools |
| `apps/backend/src/temporal/activity/ig_dm_notify_activity.py` | Activities: 4 notification activities calling `SlackService` |
| `apps/backend/src/models/temporal/ig_dm_notify.py` | Pydantic: `IgDmNotifyInput`, `IgDmNotifyResult`, `IgDmExpiryNotifyInput`, `IgDmNotificationType` StrEnum |

### Phase 3 — Modified Files (9)

| Path | What Changes |
|------|-------------|
| `apps/context-engine/app/src_v2/mcp/tools/cheerful/__init__.py` | Export 8 new tool functions |
| `apps/context-engine/app/src_v2/mcp/catalog.py` | Add 8 tools to `ALL_TOOLS` |
| `apps/backend/src/services/external/slack_service.py` | Add 5 Block Kit builder methods for IG DM notifications |
| `apps/backend/src/temporal/activity/__init__.py` | Add notify activity functions |
| `apps/backend/src/temporal/workflow/ig_dm_ingest_workflow.py` | Add Step 7: fire-and-forget `ig_dm_post_new_inbound_notification_activity` |
| `apps/backend/src/temporal/workflow/thread_processing_coordinator_workflow.py` | Add fire-and-forget `ig_dm_post_draft_ready_notification_activity` in IG DM branch |
| `apps/backend/src/temporal/workflow/ig_igsid_resolution_workflow.py` | Add `ig_dm_post_creator_matched_notification_activity` when `was_newly_matched=True` |
| `apps/backend/src/temporal/workflow/ig_dm_reconciliation_workflow.py` | Add `ig_dm_post_window_alert_notification_activity` for expiring/expired threads |
| `apps/backend/src/api/route/service.py` | Add 6 service routes: search, get, list-accounts, reply, oauth-url, campaign-summary |

---

## 7. Component Spec Index

Every component has a dedicated spec file with exact signatures, SQL, types, and behavior descriptions. A developer should be able to read one spec file and implement that component.

### Audit Files (Wave 1 — Current Codebase Baseline)

| Aspect | File | What it covers |
|--------|------|---------------|
| DB schemas | [`analysis/audit/db-schemas.md`](../audit/db-schemas.md) | Exact current columns, CHECK constraints, indexes, triggers, RLS for all 13 relevant tables |
| Backend services | [`analysis/audit/backend-services.md`](../audit/backend-services.md) | `GmailService`, `SmtpEmailService`, `LlmService`, `RagService`, `EmbeddingService`, `Candidate` model, DI patterns |
| Temporal workflows | [`analysis/audit/temporal-workflows.md`](../audit/temporal-workflows.md) | 25 workflows, 67 activities, coordinator `elif` branching pattern |
| API routes | [`analysis/audit/api-routes.md`](../audit/api-routes.md) | All 17 current routers, auth patterns, SMTP account CRUD as IG DM template |
| Frontend types | [`analysis/audit/frontend-types.md`](../audit/frontend-types.md) | *(Reference only)* TypeScript type system, hooks, API client patterns |
| Frontend components | [`analysis/audit/frontend-components.md`](../audit/frontend-components.md) | *(Reference only)* Inbox components, email-hardcoded elements inventory |
| AI drafting | [`analysis/audit/ai-drafting.md`](../audit/ai-drafting.md) | 13 Langfuse prompts, RAG table, `EmailLoaderService`, LLM output models |

### Spec Files (Wave 2 — Schema & Interface Design)

| Aspect | File | What it covers |
|--------|------|---------------|
| DB migrations | [`analysis/spec/db-migrations.md`](db-migrations.md) | Exact `CREATE TABLE` / `ALTER TABLE` SQL for all 7 new tables + 4 modifications, indexes, triggers, RLS |
| Pydantic models | [`analysis/spec/pydantic-models.md`](pydantic-models.md) | Exact Pydantic and SQLAlchemy class definitions: 8 new files, 3 modified files |
| TypeScript types | [`analysis/spec/typescript-types.md`](typescript-types.md) | *(Future frontend phase)* `IgDmThread`, `IgDmMessage`, `Channel` discriminator, hooks |
| API contracts | [`analysis/spec/api-contracts.md`](api-contracts.md) | All 17 new routes: exact paths, request/response schemas, auth, status codes |
| Temporal interfaces | [`analysis/spec/temporal-interfaces.md`](temporal-interfaces.md) | 5 new workflows, ~18 new activities, all input/output types, retry policies |
| Meta OAuth | [`analysis/spec/meta-oauth.md`](meta-oauth.md) | Facebook Login flow, token exchange, `MetaGraphService`, token refresh cron |

### Spec Files (Wave 3 — Component Implementation)

| Aspect | File | What it covers |
|--------|------|---------------|
| Webhook handler | [`analysis/spec/webhook-handler.md`](webhook-handler.md) | `ig_dm_webhook.py`: GET hub.challenge, POST HMAC-SHA256, BackgroundTask dispatch |
| Ingest workflow | [`analysis/spec/ingest-workflow.md`](ingest-workflow.md) | `IgDmIngestWorkflow` 6-step pipeline: dedup → media → store → state → IGSID → coordinator |
| Creator resolution | [`analysis/spec/creator-resolution.md`](creator-resolution.md) | IGSID → @username → `campaign_creator` matching, cache strategy, GIN index queries |
| Send reply | [`analysis/spec/send-reply.md`](send-reply.md) | `IgDmSendReplyWorkflow`: 24h window enforcement, Meta API call, error matrix |
| CE IG DM tools | [`analysis/spec/ce-ig-dm-tools.md`](ce-ig-dm-tools.md) | 8 MCP tools: exact tool names, parameter schemas, return schemas, Slack Block Kit formatting |
| CE notifications | [`analysis/spec/ce-ig-dm-notifications.md`](ce-ig-dm-notifications.md) | 5 Slack notification types: Block Kit structures, workflow trigger points, dedup logic |
| AI drafting | [`analysis/spec/ai-drafting.md`](ai-drafting.md) | 9 Langfuse prompts, `IgDmLoaderService`, `IgDmRagService`, DM context XML format |

### Spec Files (Wave 4 — Integration & Synthesis)

| Aspect | File | What it covers |
|--------|------|---------------|
| Phase plan | [`analysis/spec/phase-plan.md`](phase-plan.md) | 4 phases: exact file lists, acceptance criteria, effort estimates, Langfuse prompt list |
| Test plan | [`analysis/spec/test-plan.md`](test-plan.md) | 24 test files, 100+ test functions, fixtures, E2E scenarios |
| Migration safety | [`analysis/spec/migration-safety.md`](migration-safety.md) | Risk matrix, CHECK constraint proof, feature flag, rollback SQL, zero-downtime sequence |

---

## 8. Developer Quick-Reference

### Key Patterns to Follow

**Creating a new IG DM account service** follows `user_smtp_account` + `SmtpEmailService` pattern:
- Account stored in `user_ig_dm_account` (not `user_smtp_account`)
- Credentials accessed via `for_user(user_id, db)` classmethod factory
- See `apps/backend/src/services/email/smtp_email_service.py` as template

**Webhook handler** follows `apps/backend/src/api/route/slack.py` pattern:
- HMAC-SHA256 verify → immediate 200 → BackgroundTask
- Key difference: verify token ≠ app secret (Meta uses two separate secrets)
- Always return 200 once signature verified (prevents Meta retry storm)

**Temporal coordinator branching** — the `ThreadProcessingCoordinatorWorkflow` uses discriminator pattern:
```python
# Existing (do not change):
is_smtp = candidate.smtp_account_id is not None

# Add after is_smtp check (Phase 1 stub, Phase 2 complete):
is_ig_dm = candidate.ig_dm_account_id is not None
```

**24h messaging window** is the key IG DM constraint with no email parallel:
- `window_expires_at = sent_at + INTERVAL '24 hours'` stored on `ig_dm_thread_state`
- Enforced at API route level (409 response) AND in `IgDmSendReplyWorkflow` (double enforcement)
- AI drafting skips if window closed; window-reopener prompt fires if < 2h remaining
- `window_expires_at = NULL` after we send a reply (thread enters `WAITING_FOR_INBOUND`)

**IGSID ≠ Instagram handle** — never conflate these:
- `sender_igsid`: opaque numeric string from Meta (e.g. `"17841400123456"`) — stable identity
- `sender_username`: `@handle` resolved via Graph API → cached in `ig_igsid_cache`
- Resolution is async (fire-and-forget `IgIsidResolutionWorkflow`); thread processing does not block on it

**Conversation ID scoping**: `ig_conversation_id` from Meta is unique within an account, NOT globally unique. Always use `(ig_dm_account_id, ig_conversation_id)` as the composite key.

### Langfuse Prompts to Create (Before Phase 2)

Create these 9 templates in Langfuse UI before implementing `ig_dm_drafting.py`:

| Prompt Name | Purpose |
|-------------|---------|
| `drafting/ig-dm-drafting-paid-promotion` | Base draft: paid promotion campaign |
| `drafting/ig-dm-drafting-gifting` | Base draft: gifting campaign |
| `drafting/ig-dm-drafting-sales` | Base draft: sales campaign |
| `drafting/ig-dm-drafting-general` | Base draft: general campaign |
| `drafting/ig-dm-drafting-v1-rag-paid-promotion` | RAG-augmented: paid promotion |
| `drafting/ig-dm-drafting-v1-rag-gifting` | RAG-augmented: gifting |
| `drafting/ig-dm-drafting-v1-rag-sales` | RAG-augmented: sales |
| `drafting/ig-dm-drafting-v1-rag-general` | RAG-augmented: general |
| `drafting/ig-dm-window-reopener` | Special: 24h window expiring in < 2h |

Key tone difference from email prompts: **"1-4 sentences, plain text only, no markdown, no email greetings or sign-offs"**.

### 8 Context Engine Tools Summary

All tools in `apps/context-engine/app/src_v2/mcp/tools/cheerful/ig_dm_tools.py`:

| Tool | Action | Backend Endpoint |
|------|--------|-----------------|
| `cheerful_list_ig_dm_threads` | READ | `GET /api/service/ig-dm/threads/search` |
| `cheerful_get_ig_dm_thread` | READ | `GET /api/service/ig-dm/threads/{id}` |
| `cheerful_send_ig_dm_reply` | WRITE | `POST /api/service/ig-dm/threads/{id}/reply` |
| `cheerful_approve_ig_dm_draft` | WRITE | `GET` then `POST /api/service/ig-dm/threads/{id}/reply` |
| `cheerful_search_ig_dms` | READ | `GET /api/service/ig-dm/threads/search` |
| `cheerful_connect_ig_account` | WRITE | `GET /api/service/ig-dm/oauth-url` |
| `cheerful_list_ig_accounts` | READ | `GET /api/service/ig-dm/accounts` |
| `cheerful_ig_dm_campaign_summary` | READ | `GET /api/service/ig-dm/campaigns/{id}/summary` |

### Feature Flag Behavior

`ENABLE_IG_DM` env var (set in `definition.py` → `require_ig_dm_enabled()` FastAPI dependency):

| Endpoint | `ENABLE_IG_DM=false` behavior |
|----------|-------------------------------|
| `GET /webhooks/instagram/` | Returns hub.challenge (**NOT gated** — Meta requires live verification endpoint) |
| `POST /webhooks/instagram/` | Returns 200 no-op (HMAC verified but no DB writes, no Temporal starts) |
| All `/api/v1/ig-dm-accounts/*` | Returns HTTP 503 |
| All `/api/ig-dm/threads/*` | Returns HTTP 503 |
| All `/api/service/ig-dm/*` | Returns HTTP 503 |
| CE tools | Return `ToolError`: "IG DM feature is not enabled" |

### Rollback (if migration must be reverted)

See [`analysis/spec/migration-safety.md`](migration-safety.md) for exact `DROP TABLE` and `ALTER TABLE` rollback SQL. The rollback is:
1. Set `ENABLE_IG_DM=false` (immediate, no downtime)
2. Drop 7 new tables (in reverse FK order)
3. Revert 3 CHECK constraints to 2-way on `campaign_sender`, `campaign_thread`, `thread_flag`
4. Drop 2 new columns from `campaign_thread`, `thread_flag`
5. Drop 1 new column from `campaign_sender`
6. Drop 1 new column + GIN index from `campaign_creator`

All existing Gmail and SMTP code paths are unaffected by any IG DM changes.

---

*This document was generated by the `cheerful-ig-dm-spec` reverse ralph loop.*
*All 23 prior spec files are cross-referenced in Section 7.*
*Start with [Phase 1](phase-plan.md#phase-1-db-foundation--webhook-ingest--meta-oauth) and submit Meta App Review today.*
