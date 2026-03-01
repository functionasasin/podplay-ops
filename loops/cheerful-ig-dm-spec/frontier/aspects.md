# Frontier — Cheerful Instagram DM Implementation Spec

> **Strategic constraint**: Backend-only + Context Engine. NO frontend/webapp changes.
> The context engine (Slack bot) is the sole interaction point for IG DM functionality.
> Frontend specs are cut. CE tool specs replace them.

## Statistics

| Metric | Value |
|--------|-------|
| Total aspects | 24 |
| Analyzed | 15 |
| Pending | 9 |
| Convergence | 63% |

---

## Wave 1: Codebase Audit

- [x] `audit-db-schemas` — Read all migrations for thread/campaign/creator tables: exact columns, CHECK constraints, GmailThreadStatus enum, triggers, RLS
- [x] `audit-backend-services` — Read Gmail/SMTP/thread services: exact class names, method signatures, Candidate object, DI patterns
- [x] `audit-temporal-workflows` — Read all workflow/activity files: exact names, branching logic, input/output types, coordinator elif pattern
- [x] `audit-api-routes` — Read all relevant FastAPI routers: exact route paths, methods, request/response models, auth patterns
- [x] `audit-frontend-types` — *(Reference only — no frontend changes planned)* Read TypeScript types: GmailThread, GmailMessage, API client functions, TanStack Query hooks
- [x] `audit-frontend-components` — *(Reference only — no frontend changes planned)* Read inbox components: mail list, mail display, reply composer, account settings, email-hardcoded logic
- [x] `audit-ai-drafting` — Read LLM/drafting services: exact methods, Langfuse prompt names, RAG tables, thread context XML generation

## Wave 2: Schema & Interface Design

- [x] `spec-db-migrations` — Exact CREATE TABLE / ALTER TABLE SQL for 6 new tables + 4 modified tables, indexes, triggers, RLS policies
- [x] `spec-pydantic-models` — Exact Pydantic model classes: IG DM entities, webhook payloads, modified Candidate, DTOs
- [x] `spec-typescript-types` — *(Reference only — for future frontend phase)* Exact TypeScript types: IgDmThread, IgDmMessage, channel discriminator, API client functions, TanStack hooks
- [x] `spec-api-contracts` — Exact route signatures: webhook endpoints, IG account CRUD, DM thread queries, reply endpoint
- [x] `spec-temporal-interfaces` — Exact workflow/activity signatures: ingest, sync, send-reply, reconciliation, initial-sync, modified coordinator
- [x] `spec-meta-oauth` — Exact OAuth flow: login URL, callback, token exchange/storage/refresh, webhook subscription setup

## Wave 3: Component Implementation Specs (Backend + Context Engine)

- [x] `spec-webhook-handler` — FastAPI webhook endpoint: verification, HMAC validation, payload parsing, BackgroundTask dispatch
- [x] `spec-ingest-workflow` — IgDmIngestWorkflow: dedup, media download, store, thread match, state transition, IGSID trigger
- [ ] `spec-creator-resolution` — IGSID->creator matching: cache, Graph API fallback, GIN index lookup, campaign disambiguation
- [ ] `spec-send-reply` — IgDmSendReplyWorkflow: 24h window check, Meta send API, state update, error handling
- [ ] `spec-ce-ig-dm-tools` — 8 context engine MCP tools: list/get/search DM threads, send reply, approve draft, connect/list IG accounts, campaign DM summary
- [ ] `spec-ce-ig-dm-notifications` — Proactive Slack notifications: new inbound DM, 24h window expiring, AI draft ready, creator matched, window expired
- [ ] `spec-ai-drafting` — 9 Langfuse prompts, ig_dm_reply_examples RAG table, DM context XML, window-reopener prompt

## Wave 4: Integration, Phasing & Synthesis

- [ ] `spec-phase-plan` — 3-4 shippable phases (backend infra → backend features → CE tools → polish): exact file lists, acceptance criteria, effort estimates
- [ ] `spec-test-plan` — Unit/integration/E2E test strategy, webhook simulator, CE tool tests, test data factories, exact test file paths
- [ ] `spec-migration-safety` — Backward compat, CHECK expansion safety, feature flag gating, rollback SQL, zero-downtime plan
- [ ] `synthesis-implementation-spec` — Master handoff doc: TOC, architecture diagram (Meta → webhook → Temporal → DB → API → CE/Slack), file manifest by phase, env vars, Meta app checklist
