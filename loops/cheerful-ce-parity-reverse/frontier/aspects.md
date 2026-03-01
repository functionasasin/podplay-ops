# Frontier — Cheerful Context Engine Parity

## Statistics

- **Total Aspects**: 36
- **Analyzed**: 3
- **Pending**: 33
- **Convergence**: 8%

---

## Wave 1: Capability Extraction (8 aspects)

Read existing cheerful-reverse specs + verify against source code. Produce raw capability lists per domain.

- [x] **w1-campaigns** — Extract all campaign capabilities: CRUD, wizard steps (0-7), products, senders, recipients (single/bulk/CSV/sheet), outbox, launch, draft saving. Sources: `spec-backend-api.md` (Domain 1-2), `spec-webapp.md` (Campaign Wizard), backend routes `campaigns.py`, `campaign_draft.py`, `campaign_launch.py`
- [x] **w1-email** — Extract all email/thread capabilities: thread listing with all filter params, thread detail, status marking (all statuses), draft CRUD, AI draft generation, draft sending, follow-up management. Sources: `spec-backend-api.md` (Domain 6-10), `spec-webapp.md` (Inbox UI), backend routes `gmail_message.py`, `draft.py`, `email.py`, `email_dispatch.py`, `email_signature.py`, `bulk_draft_edit.py`
- [x] **w1-creators** — Extract all creator capabilities: in-campaign listing with filters, cross-campaign search, full profile with enrichment data, enrichment status polling, email override, bulk operations, notes history. Sources: `spec-backend-api.md` (Domain 5), existing CE tools in `mcp/tools/cheerful/tools.py`. Also discovered: creator lists (11 endpoints), creator posts/content verification (4 endpoints), creator search/discovery via Influencer Club (4 endpoints)
- [ ] **w1-integrations** — Extract all integration capabilities: Gmail OAuth connect/disconnect/list, Google Sheets tab listing/validation, Shopify token validation/product listing, Slack channel config, integration status checking. Sources: `spec-integrations.md`, `spec-backend-api.md` (Domain 8), backend routes `integrations.py`, `google_sheets.py`, `shopify.py`
- [ ] **w1-users-team** — Extract all user/team capabilities: user profile (get/update), Gmail account management, onboarding status, team CRUD, member invitations, campaign assignments, permission model. Sources: `spec-backend-api.md` (Additional Endpoints), `spec-webapp.md` (Settings, Team), backend routes `users.py`, `teams.py`
- [ ] **w1-analytics** — Extract all analytics/dashboard capabilities: campaign metrics (creator count, response rate, emails sent, opt-in rate), active campaigns table, follow-up statistics, gifting/paid pipeline, per-campaign stats. Sources: `spec-webapp.md` (Dashboard), backend routes `analytics.py`, `dashboard.py`
- [ ] **w1-search** — Extract all search/discovery capabilities: AI creator search (Apify/YouTube), semantic email search (pgvector), full-text email search, creator profile lookup. Sources: `spec-backend-api.md`, existing CE tools, backend routes `creators.py`, `search.py`
- [ ] **w1-workflows** — Extract all workflow/automation capabilities: workflow CRUD per campaign, workflow execution history, Temporal workflow triggering, campaign lifecycle state machine, follow-up scheduling. Sources: `spec-workflows.md`, `spec-backend-api.md` (Domain 3-4), backend routes `workflows.py`

## Wave 2: Tool Design (8 aspects)

Take Wave 1 capability lists and design tool signatures per domain. **Every tool is user-scoped via `RequestContext` injection (not a tool param). Document the permission model (owner-only, assigned-member, or authenticated) for each tool.**

- [ ] **w2-campaigns** — Design all campaign tools: names, parameters, return types, API mappings. Group CRUD ops, wizard steps, and bulk ops into individual tools. Document permission model: which ops are owner-only vs assigned-member. Write skeleton definitions to `specs/campaigns.md`
- [ ] **w2-email** — Design all email tools: thread listing with all filter combos, status mutations, draft lifecycle, AI generation, sending. All scoped to `user_id` via campaign access. Write skeleton definitions to `specs/email.md`
- [ ] **w2-creators** — Design all creator tools: extend existing 3 tools + add enrichment, notes, bulk ops. All scoped to `user_id`. Write skeleton definitions to `specs/creators.md`
- [ ] **w2-integrations** — Design all integration tools: OAuth flows, config, validation, status. Integration tools are owner-only (Gmail tokens, Shopify keys are per-user). Write skeleton definitions to `specs/integrations.md`
- [ ] **w2-users-team** — Design all user/team tools: profile, accounts, team management, permissions. Note: profile tools are self-only; team admin tools are owner-only. Write skeleton definitions to `specs/users-and-team.md`
- [ ] **w2-analytics** — Design all analytics tools: dashboard data, campaign metrics, reporting queries. All scoped to `user_id`'s campaigns. Write skeleton definitions to `specs/analytics.md`
- [ ] **w2-search** — Design all search/discovery tools: extend existing search + add AI discovery. Search scoped to `user_id`'s campaigns/threads. Write skeleton definitions to `specs/search-and-discovery.md`
- [ ] **w2-workflows** — Design all workflow tools: automation CRUD, execution history, lifecycle triggers. Scoped to `user_id` via campaign ownership. Write skeleton definitions to `specs/workflows.md`

## Wave 3: Full OpenAPI-Level Specs (12 aspects)

Flesh each tool to exhaustive detail. Verify every parameter, type, and enum against actual source code.

- [ ] **w3-campaigns-crud** — Full specs for campaign create/read/update/delete tools. Verify all Pydantic models, enum values, validation rules against `projects/cheerful/apps/backend/src/api/route/campaigns.py`
- [ ] **w3-campaigns-wizard** — Full specs for campaign wizard tools: draft save/load, product management, sender management, email sequence config. Verify against `campaign_draft.py`, `campaign_launch.py`
- [ ] **w3-campaigns-recipients** — Full specs for recipient tools: single add, bulk upsert, CSV upload, Google Sheet import, outbox population. Verify against recipient-related routes
- [ ] **w3-email-threads** — Full specs for thread listing (all filter params, pagination), thread detail, status marking (all status values). Verify against `threads.py`
- [ ] **w3-email-drafts** — Full specs for draft CRUD, AI draft generation (tone, style, reply examples), draft sending. Verify against `gmail.py`, draft routes
- [ ] **w3-creators-full** — Full specs for all creator tools: listing with filters, cross-campaign search, enrichment, email override, profile detail. Verify against creator routes + existing CE tool implementations
- [ ] **w3-integrations-full** — Full specs for all integration tools: Gmail OAuth, Sheets, Shopify, Slack. Verify actual OAuth flows and validation endpoints
- [ ] **w3-users-team-full** — Full specs for user profile, Gmail account management, team CRUD, member management, permissions. Verify against user/team routes
- [ ] **w3-analytics-full** — Full specs for all analytics tools: dashboard queries, campaign metrics, pipeline stats. Verify against analytics routes and actual SQL queries
- [ ] **w3-search-full** — Full specs for AI creator discovery and semantic search tools. Verify against search routes, Apify integration, pgvector queries
- [ ] **w3-workflows-full** — Full specs for workflow CRUD, execution history, lifecycle triggers. Verify against workflow routes and Temporal activity definitions
- [ ] **w3-existing-tools-audit** — Audit all 7 existing Cheerful CE tools against actual implementation. Document any parameter mismatches, missing fields, or needed corrections. Verify against `mcp/tools/cheerful/tools.py`

## Wave 4: Cross-Domain Synthesis (8 aspects)

Shared schemas, conventions, parity matrix, and completeness audit.

- [ ] **w4-shared-schemas** — Define all shared types used across domains: Campaign, Thread, Creator, EmailMessage, Draft, Workflow, User, Team. Write to `specs/shared-conventions.md`
- [ ] **w4-auth-model** — Document the full per-user authentication model as it actually works in the codebase. **CE identity injection**: `RequestContext` created in `entrypoints/slack/handlers.py` with `cheerful_user_id` from hardcoded `SLACK_USER_MAPPING` in `constants.py` → threaded through execution pipeline → every tool calls `_resolve_user_id(request_context)` → `user_id` sent as query param to `/api/service/*` routes. **Frontend**: Supabase Auth login (email/password + Google OAuth), middleware route protection, session cookies. **Backend two-path auth**: JWT validation (`get_current_user`) for webapp requests, `X-Service-Api-Key` (`verify_service_api_key`) for CE/service requests. **Permission tiers**: owner-only (campaign CRUD, launch, integrations), assigned-member (view/edit campaign data via `campaign_member_assignment`), authenticated (own profile/settings). **RLS defense-in-depth**: DB-level row isolation, `SECURITY DEFINER` functions (`is_campaign_owner`, `can_access_campaign`), credential isolation (team members cannot SELECT `user_gmail_account`/`user_smtp_account`). Reference: `tools.py`, `api.py`, `constants.py`, `handlers.py`, `auth-permissions.md` from cheerful-reverse, `auth.py`, `service_auth.py`, `middleware.ts`
- [ ] **w4-error-conventions** — Standard error handling: error response format, retry logic, how tools surface errors to Claude agent. Common error patterns across all tools
- [ ] **w4-pagination-conventions** — Standard pagination: limit/offset patterns, default/max values, how paginated results should be presented in Slack threads
- [ ] **w4-parity-matrix** — Build the complete parity matrix: every frontend page, every user action, mapped to a context engine tool. Flag any gaps. Write to `specs/parity-matrix.md`
- [ ] **w4-readme-index** — Write `specs/README.md` with complete tool index: every tool name, domain, one-line description, status (exists/new)
- [ ] **w4-slack-formatting-guide** — Cross-cutting guide for how tools should format responses for Slack: tables, thread summaries, campaign reports, creator profiles. Consistent UX patterns
- [ ] **w4-completeness-audit** — Final audit: read every spec file, verify no TODOs/TBDs/placeholders, verify every tool has all required sections, verify parity matrix has no gaps. If gaps found, add new aspects and DO NOT converge
