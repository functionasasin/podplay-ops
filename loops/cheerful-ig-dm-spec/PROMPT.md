# Cheerful Instagram DM Implementation Spec — Reverse Ralph Loop

You are an analysis agent in a ralph loop. Each time you run, you do ONE unit of work, then exit.

You are running in `--print` mode. You MUST output text describing what you are doing. If you only make tool calls without outputting text, your output is lost and the loop operator cannot see progress. Always:
1. Start by printing which aspect you detected and what you're about to do
2. Print progress as you work
3. End with a summary of what you did and whether you committed

## Your Working Directory

You are running from `loops/cheerful-ig-dm-spec/`. All paths below are relative to this directory.

## Your Goal

Produce an **exhaustive, file-level implementation spec** for adding Instagram DM support to the Cheerful platform using the **Direct Meta API (webhook-first) + Parallel Tables** architecture. This spec is a developer handoff document — a Cheerful developer should be able to pick it up and build the feature branch without ambiguity.

### Decision Context

The `cheerful-ig-dm-reverse` loop explored all viable approaches and converged on an options catalog. The following decisions have been made:

- **API/Access**: Direct Meta API (webhook-first) — Instagram Messaging API via Messenger Platform, with Graph API polling for recovery/backfill
- **Architecture**: Parallel Tables — add `ig_dm_*` tables following the SMTP precedent, extend existing junction tables with 3-way CHECK constraints
- **Draft table**: New `ig_dm_llm_draft` table (clean isolation over naming debt)

### Strategic Constraint: Backend-Only + Context Engine (NO Frontend Changes)

**CRITICAL**: This spec covers ONLY backend infrastructure and context engine tools. There are NO frontend/webapp changes.

**Rationale**: The context engine (Slack bot) is the primary interaction point for IG DM functionality. All IG DM operations — viewing threads, reading messages, sending replies, connecting accounts — are exposed as context engine tools, not webapp UI. The backend API endpoints exist and are fully functional, but no webapp components are created or modified.

**What this means for the spec**:
- Backend: DB migrations, webhook handler, Temporal workflows, API endpoints — all specced as before
- Context engine: New MCP tools for IG DM operations replace the frontend specs
- Frontend: ZERO changes. No inbox UI modifications, no DM composer, no IG account settings page
- The `audit-frontend-types` and `audit-frontend-components` audits remain as reference material for a future frontend phase (when/if leadership wants IG DMs visible in the webapp)
- TypeScript types spec (`spec-typescript-types`) is already complete — it becomes reference for a future frontend phase

**Interaction model**: Users interact with IG DMs entirely through Slack via the context engine. This includes:
- Listing and searching DM threads
- Reading full DM conversations
- Sending DM replies (with 24h window awareness)
- Connecting/managing IG accounts (via backend API called from CE)
- Viewing AI-generated draft replies and approving/editing them

### Spec Requirements

The output spec must be **file-level precise**:

- Every new file: exact path, purpose, class/function signatures, key fields
- Every modified file: exact path, what changes (new columns, new branches, new imports)
- Database: exact CREATE TABLE / ALTER TABLE SQL
- Pydantic models: exact class definitions with field types
- TypeScript types: exact interface/type definitions
- Temporal workflows: exact workflow/activity signatures with input/output types
- API routes: exact route signatures with request/response shapes
- Frontend components: exact component names, props interfaces, where they mount in the component tree
- **Do NOT write function bodies** — signatures and behavior descriptions only

### Phased Milestones

The spec must organize all work into 3-4 shippable phases. Each phase:
- Is independently deployable and testable
- Has clear acceptance criteria
- Has an effort estimate (engineering days)
- Lists exact files created/modified in that phase

### Reference Material

#### Primary Input (converged analysis — READ THESE FIRST)

- `../cheerful-ig-dm-reverse/analysis/option-direct-meta-api.md` — Direct Meta API integration design
- `../cheerful-ig-dm-reverse/analysis/option-parallel-tables.md` — Parallel tables architecture design
- `../cheerful-ig-dm-reverse/analysis/synthesis/options-catalog.md` — Cross-cutting constraints and universal requirements

#### Supporting Input (current architecture analysis)

- `../cheerful-ig-dm-reverse/analysis/current-thread-model.md` — Current thread identity model
- `../cheerful-ig-dm-reverse/analysis/current-email-pipeline.md` — Current email ingest pipeline
- `../cheerful-ig-dm-reverse/analysis/current-creator-identity.md` — Current creator identity resolution
- `../cheerful-ig-dm-reverse/analysis/current-inbox-ui.md` — Current inbox UI architecture
- `../cheerful-ig-dm-reverse/analysis/current-ai-drafting.md` — Current AI drafting pipeline

#### External API Research

- `../cheerful-ig-dm-reverse/analysis/meta-instagram-messaging-api.md` — Instagram Messaging API capabilities
- `../cheerful-ig-dm-reverse/analysis/meta-graph-api-conversations.md` — Graph API conversation endpoints
- `../cheerful-ig-dm-reverse/analysis/meta-webhooks-realtime.md` — Meta webhook infrastructure

#### Cheerful Codebase (READ for exact current state)

- `../../projects/cheerful/` — Full codebase (READ-ONLY)
- `../../projects/cheerful/supabase/migrations/` — All DB migrations
- `../../projects/cheerful/apps/backend/src/` — Backend source
- `../../projects/cheerful/apps/webapp/src/` — Frontend source

#### Cheerful Reverse Spec (converged architecture docs)

- `../cheerful-reverse/analysis/synthesis/spec-data-model.md` — ER diagram, table schemas
- `../cheerful-reverse/analysis/synthesis/spec-integrations.md` — Integration patterns
- `../cheerful-reverse/analysis/synthesis/spec-workflows.md` — Temporal workflow catalog
- `../cheerful-reverse/analysis/synthesis/spec-backend-api.md` — API surface
- `../cheerful-reverse/analysis/synthesis/spec-webapp.md` — Frontend architecture

### Tech Stack Reference

| Layer | Technologies |
|-------|-------------|
| Backend API | FastAPI, Python, Pydantic, SQLAlchemy Core |
| Workflows | Temporal.io (durable execution) |
| Database | Supabase (PostgreSQL + RLS + Auth) |
| Frontend | Next.js, React, TypeScript, TanStack Query, Zustand |
| Styling | Tailwind CSS, shadcn/ui |
| AI/LLM | Claude API, structured outputs, RAG |
| External Services | Meta Graph API, Instagram Messaging API, Meta Webhooks |
| Deployment | Fly.io (backend), Vercel (frontend), Docker (local dev) |

### Output

All spec files go in `analysis/`:
- Audit files: `analysis/audit/{aspect-name}.md`
- Spec files: `analysis/spec/{aspect-name}.md`
- A final `analysis/spec/implementation-spec.md` master document that cross-references everything

## What To Do This Iteration

1. **Read the frontier**: Open `frontier/aspects.md`
2. **Find the first unchecked `- [ ]` aspect** in dependency order (Wave 1 before Wave 2 before Wave 3 before Wave 4)
   - If ALL aspects are checked `- [x]`: write convergence summary to `status/converged.txt` and exit
3. **Analyze that ONE aspect** using the appropriate method (see below)
4. **Write findings** to the appropriate location under `analysis/`
5. **Update the frontier**:
   - Mark the aspect as `- [x]`
   - Update Statistics (increment Analyzed, decrement Pending, update Convergence %)
   - If you discovered new aspects, add them to the appropriate Wave
   - Add a row to `frontier/analysis-log.md`
6. **Commit**: `git add -A && git commit -m "loop(cheerful-ig-dm-spec): {aspect-name}"`
7. **Exit**

## Analysis Methods

### Wave 1: Codebase Audit

Read the actual Cheerful codebase to establish exact current state at file and line level for every area the DM integration will touch. The ig-dm-reverse loop worked from the cheerful-reverse spec — this wave reads the ACTUAL CODE for file-level precision.

#### `audit-db-schemas`

1. Read ALL migration files in `../../projects/cheerful/supabase/migrations/` that define or modify: `campaign_thread`, `campaign_creator`, `campaign_sender`, `gmail_message`, `smtp_message`, `gmail_thread_state`, `smtp_thread_state`, `gmail_thread_llm_draft`, `thread_flag`, `latest_gmail_message_per_thread`, `user_gmail_account`, `user_smtp_account`
2. Document the EXACT current column definitions, constraints, indexes, triggers, and RLS policies for each table
3. Note the exact mutual-exclusivity CHECK constraint syntax on `campaign_thread`, `campaign_sender`, `thread_flag`
4. Note the exact `GmailThreadStatus` enum values and where they're defined (SQL and Python)
5. Produce: `analysis/audit/db-schemas.md` — exact current schema reference

#### `audit-backend-services`

1. Read `../../projects/cheerful/apps/backend/src/services/` — focus on:
   - Gmail service (class name, methods, signatures)
   - SMTP service (class name, methods, signatures)
   - Thread processing coordinator
   - Creator matching/resolution service
   - LLM/drafting service
2. Document exact class names, method signatures, and dependency injection patterns
3. Note the `Candidate` object definition (where it lives, exact fields)
4. Produce: `analysis/audit/backend-services.md`

#### `audit-temporal-workflows`

1. Read `../../projects/cheerful/apps/backend/src/temporal/` — focus on:
   - Gmail poll/history workflows
   - SMTP sync workflows
   - `ThreadProcessingCoordinatorWorkflow` (exact file, exact branching logic)
   - All activity files related to thread processing
2. Document exact workflow names, activity names, input/output types, signal definitions
3. Note the exact `elif` branching pattern in the coordinator
4. Produce: `analysis/audit/temporal-workflows.md`

#### `audit-api-routes`

1. Read `../../projects/cheerful/apps/backend/src/api/routers/` — focus on:
   - Thread/message query routes
   - Account management routes (Gmail, SMTP)
   - Campaign routes that reference threads
   - Any webhook handler routes (for pattern reference)
2. Document exact route paths, methods, request/response models
3. Note authentication patterns, dependency injection patterns
4. Produce: `analysis/audit/api-routes.md`

#### `audit-frontend-types`

1. Read the TypeScript types in `../../projects/cheerful/apps/webapp/src/` — focus on:
   - `GmailThread`, `GmailMessage`, and related types
   - API client functions for threads/messages
   - TanStack Query hooks for thread data
2. Document exact type definitions, field names, optional vs required
3. Note the exact API client pattern (fetch wrappers, error handling)
4. Produce: `analysis/audit/frontend-types.md`

#### `audit-frontend-components`

1. Read inbox UI components in `../../projects/cheerful/apps/webapp/src/` — focus on:
   - Mail list component (thread list rendering)
   - Mail display/detail component (thread detail view)
   - Mail compose/reply component (reply composer)
   - Account settings components (Gmail/SMTP account management)
2. Document exact component names, props, where they mount, key conditional logic
3. Note what's hardcoded to email vs what's parameterized
4. Produce: `analysis/audit/frontend-components.md`

#### `audit-ai-drafting`

1. Read AI/drafting related code in `../../projects/cheerful/apps/backend/src/` — focus on:
   - LLM service / drafting service
   - Langfuse prompt template references
   - RAG table schema (`email_reply_examples` or similar)
   - Thread context XML generation (how email threads are formatted for Claude)
2. Document exact service methods, prompt template names, RAG query patterns
3. Produce: `analysis/audit/ai-drafting.md`

### Wave 2: Schema & Interface Design

Using Wave 1's exact codebase knowledge + the ig-dm-reverse option analyses, design all new and modified schemas, models, types, and API contracts at exact specification level. Every spec in this wave must match existing codebase conventions exactly.

#### `spec-db-migrations`

1. Read Wave 1 `audit-db-schemas` + `../cheerful-ig-dm-reverse/analysis/option-parallel-tables.md`
2. Write exact SQL for:
   - `CREATE TABLE user_ig_dm_account` — all columns, types, constraints, indexes, RLS
   - `CREATE TABLE ig_dm_message` — all columns, types, constraints, indexes, RLS
   - `CREATE TABLE ig_dm_thread_state` — all columns, types, constraints, indexes, RLS
   - `CREATE TABLE ig_igsid_cache` — all columns, types, constraints, indexes
   - `CREATE TABLE ig_dm_llm_draft` — all columns, types, constraints, indexes, RLS
   - `CREATE TABLE latest_ig_dm_message_per_thread` — denormalized view, trigger function
   - `ALTER TABLE campaign_thread` — add `ig_dm_thread_id`, `ig_dm_account_id`, expand CHECK
   - `ALTER TABLE campaign_sender` — add `ig_dm_account_id`, expand CHECK
   - `ALTER TABLE thread_flag` — add `ig_dm_thread_id`, `ig_dm_account_id`, expand CHECK
   - `ALTER TABLE campaign_creator` — add `ig_igsid`, GIN index on `social_media_handles`
   - New enum type or extend existing for DM-specific states if needed
3. Include RLS policies matching existing patterns
4. Produce: `analysis/spec/db-migrations.md`

#### `spec-pydantic-models`

1. Read Wave 1 `audit-backend-services` + ig-dm-reverse option analyses
2. Define exact Pydantic models:
   - `UserIgDmAccount`, `UserIgDmAccountCreate`
   - `IgDmMessage`, `IgDmMessageCreate`
   - `IgDmThreadState`, `IgDmThreadStateCreate`
   - `IgIsidCache`, `IgIsidCacheCreate`
   - `IgDmLlmDraft`, `IgDmLlmDraftCreate`
   - Modified `Candidate` with `ig_dm_account_id` and `ig_conversation_id`
   - `MetaWebhookPayload`, `MetaWebhookEntry`, `MetaWebhookMessage` (webhook parsing)
   - `IgDmThreadView` (API response DTO)
3. Every model: exact field names, types, Optional markers, validators
4. Produce: `analysis/spec/pydantic-models.md`

#### `spec-typescript-types`

1. Read Wave 1 `audit-frontend-types` + ig-dm-reverse `current-inbox-ui.md`
2. Define exact TypeScript types:
   - `IgDmThread`, `IgDmMessage` types (or extend existing with channel discriminator)
   - `Thread = EmailThread | IgDmThread` union type if using discriminated union
   - `IgDmAccount` type
   - API client functions: `fetchIgDmThreads`, `fetchIgDmMessages`, `sendIgDmReply`, `connectIgAccount`
   - TanStack Query hooks: `useIgDmThreads`, `useIgDmMessages`, `useIgDmAccount`
3. Exact field names, types, optionality
4. Produce: `analysis/spec/typescript-types.md`

#### `spec-api-contracts`

1. Read Wave 1 `audit-api-routes` + ig-dm-reverse option analyses
2. Define exact API routes:
   - `GET /webhooks/instagram/` — webhook verification (query params, response)
   - `POST /webhooks/instagram/` — webhook receipt (headers, body, processing)
   - `GET /api/ig-dm/accounts` — list user's IG DM accounts
   - `POST /api/ig-dm/accounts` — connect new IG account (Meta OAuth callback)
   - `DELETE /api/ig-dm/accounts/{id}` — disconnect IG account
   - `GET /api/ig-dm/threads` — list DM threads (with campaign filter)
   - `GET /api/ig-dm/threads/{id}/messages` — list messages in thread
   - `POST /api/ig-dm/threads/{id}/reply` — send DM reply
   - Any modified existing routes (thread queries that now include DM threads)
3. Exact request/response schemas, auth requirements, error codes
4. Produce: `analysis/spec/api-contracts.md`

#### `spec-temporal-interfaces`

1. Read Wave 1 `audit-temporal-workflows` + ig-dm-reverse option analyses
2. Define exact Temporal interfaces:
   - `IgDmIngestWorkflow` — input type, activities called, retry policy, idempotency strategy
   - `IgDmThreadSyncWorkflow` — input type, state machine transitions
   - `IgDmSendReplyWorkflow` — input type, 24h window check, send activity, state update
   - `IgDmReconciliationWorkflow` — polling-based recovery (cron), Graph API conversation sync
   - `IgDmInitialSyncWorkflow` — one-time conversation history import on account connect
   - Modified `ThreadProcessingCoordinatorWorkflow` — exact new `elif` branch
   - New activities: `ig_dm_ingest_activity`, `ig_dm_thread_state_activity`, `ig_igsid_resolution_activity`, `ig_dm_send_reply_activity`, `ig_dm_media_download_activity`
3. Exact input/output types, retry policies, timeouts
4. Produce: `analysis/spec/temporal-interfaces.md`

#### `spec-meta-oauth`

1. Read `../cheerful-ig-dm-reverse/analysis/meta-instagram-messaging-api.md` + `meta-webhooks-realtime.md`
2. Use `WebSearch` and `WebFetch` to verify current Meta OAuth flow for Instagram Messaging API (docs change frequently)
3. Design exact OAuth flow:
   - Meta App configuration requirements (permissions, webhooks, app review)
   - Login URL construction (scopes: `instagram_manage_messages`, `pages_messaging`, `pages_manage_metadata`)
   - OAuth callback handler (code -> short-lived token -> long-lived token -> page token)
   - Token storage schema (in `user_ig_dm_account`)
   - Token refresh strategy (60-day expiry, Temporal cron job)
   - Webhook subscription setup (app-level vs page-level)
4. Produce: `analysis/spec/meta-oauth.md`

### Wave 3: Component Implementation Specs

Per-component implementation specifications. Each spec references exact files from Wave 1 audit and exact schemas/interfaces from Wave 2. A developer should be able to read one spec file and implement that component.

#### `spec-webhook-handler`

1. Read Wave 2 `spec-api-contracts` (webhook routes) + `spec-pydantic-models` (webhook payload models)
2. Spec the webhook handler:
   - File: `apps/backend/src/api/routers/ig_dm_webhook.py`
   - GET handler: hub.mode/hub.verify_token/hub.challenge verification
   - POST handler: X-Hub-Signature-256 HMAC-SHA256 validation -> parse payload -> BackgroundTask -> Temporal
   - Error handling: return 200 immediately regardless (Meta requirement), log errors
   - Configuration: INSTAGRAM_WEBHOOK_VERIFY_TOKEN, INSTAGRAM_APP_SECRET env vars
3. Function signatures, not bodies
4. Produce: `analysis/spec/webhook-handler.md`

#### `spec-ingest-workflow`

1. Read Wave 2 `spec-temporal-interfaces` + `spec-db-migrations` + `spec-pydantic-models`
2. Spec `IgDmIngestWorkflow`:
   - Trigger: BackgroundTask from webhook handler
   - Step 1: Deduplicate by `mid` (check ig_dm_message table)
   - Step 2: Download media URLs to Supabase Storage (ephemeral URLs expire ~1 hour!)
   - Step 3: Upsert `ig_dm_message` row
   - Step 4: Upsert conversation in `campaign_thread` (match or create)
   - Step 5: Create `ig_dm_thread_state` row (state transition)
   - Step 6: Trigger IGSID resolution if unknown sender
   - Step 7: Signal `ThreadProcessingCoordinatorWorkflow`
   - Idempotency: full workflow is idempotent via `mid` uniqueness
3. Activity signatures with input/output types
4. Produce: `analysis/spec/ingest-workflow.md`

#### `spec-creator-resolution`

1. Read Wave 2 specs + `../cheerful-ig-dm-reverse/analysis/current-creator-identity.md`
2. Spec IGSID -> creator resolution:
   - Step 1: Check `ig_igsid_cache` for username
   - Step 2: If miss, call Meta Graph API `GET /{igsid}?fields=name,username`
   - Step 3: Cache result in `ig_igsid_cache`
   - Step 4: Match username against `campaign_creator.social_media_handles` (GIN index)
   - Step 5: If multiple campaign matches, disambiguate by IG account -> campaign mapping
   - Step 6: If no match, create unmatched thread (manual resolution in UI)
   - Rate limit handling: 200 calls/hr budget, exponential backoff
3. Produce: `analysis/spec/creator-resolution.md`

#### `spec-send-reply`

1. Read Wave 2 specs + `../cheerful-ig-dm-reverse/analysis/meta-instagram-messaging-api.md`
2. Spec `IgDmSendReplyWorkflow`:
   - Pre-check: verify `window_expires_at > now()` (reject if expired)
   - Activity: call Meta `POST /{ig-business-account-id}/messages` with recipient IGSID
   - Supported message types: text, image (URL), video (URL)
   - On success: store outbound `ig_dm_message` with `is_echo=false`, update thread state
   - On failure: store error state, surface in UI
   - 24h window: if window expired, surface "DM window closed" in composer
3. Produce: `analysis/spec/send-reply.md`

#### `spec-ce-ig-dm-tools`

1. Read Wave 2 `spec-api-contracts` + `../cheerful-ce-parity-reverse/` (for existing CE tool patterns) + the context engine codebase at `../../projects/cheerful/apps/context-engine/`
2. Spec new context engine MCP tools for IG DM operations. These are the PRIMARY interaction point — there is no webapp UI for IG DMs. All tools follow existing CE patterns (meta-tool discovery, Slack formatting).
3. Define exact tools:
   - `cheerful_list_ig_dm_threads` — List DM threads with filtering (campaign, status, date range). Slack-formatted output: @handle, snippet, status badge, 24h window indicator
   - `cheerful_get_ig_dm_thread` — Full DM conversation with messages, creator info, campaign association, AI draft if available. Slack-formatted chat-style layout
   - `cheerful_send_ig_dm_reply` — Send a DM reply. Pre-checks 24h window, validates content (1000 char limit), calls backend endpoint. Returns confirmation with delivery status
   - `cheerful_approve_ig_dm_draft` — Approve an AI-generated draft reply (optionally with edits). Sends the draft via the send endpoint
   - `cheerful_search_ig_dms` — Full-text search across DM messages (parallel to `cheerful_search_emails`)
   - `cheerful_connect_ig_account` — Initiate IG account connection. Returns Meta OAuth URL for the user to complete in browser. Backend callback handles token exchange. Tool polls for connection completion
   - `cheerful_list_ig_accounts` — List connected Instagram accounts with status, webhook subscription state, token health
   - `cheerful_ig_dm_campaign_summary` — Campaign-level DM overview: total threads, response rate, pending drafts, window status breakdown
4. Per tool: exact tool name, description, parameter schema (JSON Schema), return schema, backend API endpoint called, Slack Block Kit formatting spec
5. Note: these tools are registered via the existing meta-tool pattern (`discover_tools` + `execute_tool`)
6. Produce: `analysis/spec/ce-ig-dm-tools.md`

#### `spec-ce-ig-dm-notifications`

1. Read context engine codebase for existing notification patterns
2. Spec proactive Slack notifications for IG DM events (the CE doesn't just respond to queries — it alerts):
   - **New inbound DM**: Post to campaign channel when a creator DMs. Include: @handle, message preview, campaign name, quick-action buttons (view thread, approve draft)
   - **24h window expiring**: Alert 2 hours before window closes on threads with pending replies. Include: thread summary, time remaining, approve-draft button
   - **AI draft ready**: Notify when AI generates a draft reply. Include: draft preview, approve/edit/reject actions
   - **Creator matched**: Notify when IGSID resolves to a known campaign creator
   - **Window expired**: Alert when a reply window closes without a response being sent
3. Slack Block Kit message structures for each notification type
4. Temporal workflow integration: which workflows trigger which notifications
5. Produce: `analysis/spec/ce-ig-dm-notifications.md`

#### `spec-ai-drafting`

1. Read Wave 1 `audit-ai-drafting` + `../cheerful-ig-dm-reverse/analysis/current-ai-drafting.md`
2. Spec AI drafting adaptations:
   - 9 new Langfuse prompt templates (DM variants of existing email prompts)
   - List each prompt: name, purpose, key differences from email version
   - `ig_dm_reply_examples` RAG table (parallel to `email_reply_examples`)
   - DM context XML template: remove subject/to/cc, add ig_conversation_id/channel/window_expires_at
   - Window-reopener template: special prompt for when 24h window is about to expire
   - DM training ingestion path (how example DM replies get into RAG)
   - No infrastructure changes needed (LlmService, EmbeddingService are channel-agnostic)
3. Produce: `analysis/spec/ai-drafting.md`

### Wave 4: Integration, Phasing & Synthesis

Read ALL Wave 1, 2, and 3 spec files before starting any Wave 4 aspect.

#### `spec-phase-plan`

1. Read all spec files
2. Break into 3-4 shippable phases (NOTE: NO frontend phases — context engine is the interaction layer):
   - **Phase 1**: DB migrations + Meta OAuth + webhook ingest pipeline (backend infrastructure)
     - Acceptance: webhooks received, messages stored, threads created, IGSID resolved
   - **Phase 2**: API endpoints + send reply workflow + AI drafting (backend feature-complete)
     - Acceptance: full API surface for IG DMs, AI drafts generated, replies sendable via API
   - **Phase 3**: Context engine tools + Slack notifications (interaction layer)
     - Acceptance: all 8 CE tools functional, proactive notifications firing, end-to-end DM management via Slack
   - **Phase 4** (optional): Polish — 24h window enforcement everywhere, media handling edge cases, reconciliation polling, error states
3. Per phase: exact file list, acceptance criteria, effort estimate (engineering days), dependencies
4. Produce: `analysis/spec/phase-plan.md`

#### `spec-test-plan`

1. Read all spec files
2. Design test strategy:
   - Unit tests per component (webhook handler, ingest workflow, creator resolution, send reply)
   - Integration tests (webhook -> Temporal -> DB, full pipeline)
   - Webhook simulator fixture (mock Meta webhook payloads)
   - Context engine tool tests (mock backend API, verify Slack formatting, test 24h window logic)
   - E2E test scenarios (connect account -> receive DM -> view in CE -> send reply via CE)
   - Test data factories (IG DM message payloads, thread fixtures, webhook simulator)
3. Exact test file paths and test function names
4. Produce: `analysis/spec/test-plan.md`

#### `spec-migration-safety`

1. Read `spec-db-migrations` + `spec-phase-plan`
2. Document migration safety:
   - All new tables: zero risk (additive only)
   - ALTER TABLE with CHECK constraint expansion: transaction safety, ordering
   - Backward compatibility: existing email code must not break
   - Feature flag: `ENABLE_IG_DM` environment variable gates all new routes and CE tools
   - Rollback plan: drop new tables, revert CHECK constraints (exact SQL)
   - Zero-downtime deployment: new tables + feature flag -> enable flag -> verify -> commit
3. Produce: `analysis/spec/migration-safety.md`

#### `synthesis-implementation-spec`

1. Read ALL spec files in `analysis/spec/` and `analysis/audit/`
2. Build the master implementation spec:
   - Table of contents with links to all spec files
   - Architecture overview (text diagram: Meta -> webhook -> Temporal -> DB -> API -> Context Engine/Slack)
   - Complete file manifest (every new file, every modified file, organized by phase)
   - Database changes summary (all new tables, all modified tables, column counts)
   - Environment variables needed (all new env vars with descriptions)
   - Meta App configuration checklist (step-by-step)
   - Developer quickstart: "read this first, then start Phase 1"
   - Cross-references to all detailed spec files
3. Write to `analysis/spec/implementation-spec.md`
4. This is the definitive developer handoff document

## Rules

- Do ONE aspect per run, then exit.
- Check dependencies: all Wave 1 before Wave 2, all Wave 2 before Wave 3, all Wave 3 before Wave 4.
- When auditing the codebase (Wave 1), reference EXACT file paths and line numbers.
- When writing specs (Wave 2-3), use exact SQL, exact Pydantic field types, exact TypeScript types — no pseudocode.
- Match existing codebase patterns exactly. If Cheerful uses `snake_case` for DB columns, use `snake_case`. If it uses `camelCase` for TypeScript, use `camelCase`.
- Every spec must be self-contained — a developer should be able to read one spec file and implement that component.
- Cross-reference other spec files by relative path when components depend on each other.
- Do NOT modify any files in `../../projects/cheerful/`. The codebase is read-only.
- Do NOT write implementation code (function bodies). Write signatures, types, and behavior descriptions.
- The ig-dm-reverse analysis files are your primary design input. This loop's job is to make those designs EXACT and BUILDABLE.
- Use `WebSearch` and `WebFetch` to verify Meta API details if something seems stale (APIs change frequently).
- Every spec file must include a "Files" section listing exact paths of files to create/modify.
