# Frontier — Cheerful Instagram DM Implementation Spec

## Statistics

| Metric | Value |
|--------|-------|
| Total aspects | 25 |
| Analyzed | 10 |
| Pending | 15 |
| Convergence | 40% |

---

## Wave 1: Codebase Audit

- [x] `audit-db-schemas` — Read all migrations for thread/campaign/creator tables: exact columns, CHECK constraints, GmailThreadStatus enum, triggers, RLS
- [x] `audit-backend-services` — Read Gmail/SMTP/thread services: exact class names, method signatures, Candidate object, DI patterns
- [x] `audit-temporal-workflows` — Read all workflow/activity files: exact names, branching logic, input/output types, coordinator elif pattern
- [x] `audit-api-routes` — Read all relevant FastAPI routers: exact route paths, methods, request/response models, auth patterns
- [x] `audit-frontend-types` — Read TypeScript types: GmailThread, GmailMessage, API client functions, TanStack Query hooks
- [x] `audit-frontend-components` — Read inbox components: mail list, mail display, reply composer, account settings, email-hardcoded logic
- [x] `audit-ai-drafting` — Read LLM/drafting services: exact methods, Langfuse prompt names, RAG tables, thread context XML generation

## Wave 2: Schema & Interface Design

- [x] `spec-db-migrations` — Exact CREATE TABLE / ALTER TABLE SQL for 6 new tables + 4 modified tables, indexes, triggers, RLS policies
- [x] `spec-pydantic-models` — Exact Pydantic model classes: IG DM entities, webhook payloads, modified Candidate, DTOs
- [x] `spec-typescript-types` — Exact TypeScript types: IgDmThread, IgDmMessage, channel discriminator, API client functions, TanStack hooks
- [ ] `spec-api-contracts` — Exact route signatures: webhook endpoints, IG account CRUD, DM thread queries, reply endpoint
- [ ] `spec-temporal-interfaces` — Exact workflow/activity signatures: ingest, sync, send-reply, reconciliation, initial-sync, modified coordinator
- [ ] `spec-meta-oauth` — Exact OAuth flow: login URL, callback, token exchange/storage/refresh, webhook subscription setup

## Wave 3: Component Implementation Specs

- [ ] `spec-webhook-handler` — FastAPI webhook endpoint: verification, HMAC validation, payload parsing, BackgroundTask dispatch
- [ ] `spec-ingest-workflow` — IgDmIngestWorkflow: dedup, media download, store, thread match, state transition, IGSID trigger
- [ ] `spec-creator-resolution` — IGSID->creator matching: cache, Graph API fallback, GIN index lookup, campaign disambiguation
- [ ] `spec-send-reply` — IgDmSendReplyWorkflow: 24h window check, Meta send API, state update, error handling
- [ ] `spec-inbox-ui` — Thread list (channel badge, @handle), thread detail (chat bubbles, media), sidebar filter, routing
- [ ] `spec-dm-composer` — DmComposer component: plain-text, char count, media upload, 24h window indicator, disabled state
- [ ] `spec-ig-account-settings` — Connect flow (Meta OAuth popup), account list, disconnect, per-campaign assignment
- [ ] `spec-ai-drafting` — 9 Langfuse prompts, ig_dm_reply_examples RAG table, DM context XML, window-reopener prompt

## Wave 4: Integration, Phasing & Synthesis

- [ ] `spec-phase-plan` — 3-4 shippable phases: exact file lists, acceptance criteria, effort estimates, dependency graph
- [ ] `spec-test-plan` — Unit/integration/E2E test strategy, webhook simulator, test data factories, exact test file paths
- [ ] `spec-migration-safety` — Backward compat, CHECK expansion safety, feature flag gating, rollback SQL, zero-downtime plan
- [ ] `synthesis-implementation-spec` — Master handoff doc: TOC, architecture diagram, file manifest by phase, env vars, Meta app checklist, developer quickstart
