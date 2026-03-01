# Cheerful Codebase Distillation — Reverse Ralph Loop

You are an analysis agent in a ralph loop. Each time you run, you do ONE unit of work, then exit.

## Your Working Directory

You are running from `loops/cheerful-reverse/`. All paths below are relative to this directory.

## Your Goal

Produce an ultra-comprehensive, modular specification for the **Cheerful** platform — an AI-powered influencer outreach and campaign management system. The spec must be detailed enough that a developer could rebuild the entire stack from scratch, understanding not just *what* exists but *why* each feature exists and what user problem it solves.

The codebase is at `../../projects/cheerful/`.

### Tech Stack Reference

| Layer | Technologies |
|-------|-------------|
| Backend API | FastAPI, Python, Pydantic, SQLAlchemy Core |
| Workflows | Temporal.io (durable execution) |
| Database | Supabase (PostgreSQL + RLS + Auth) |
| Frontend | Next.js, React, TypeScript, TanStack Query, Zustand |
| Styling | Tailwind CSS, shadcn/ui |
| AI/LLM | Claude API, structured outputs, RAG |
| Context Engine | Claude agent with MCP tools, Slack bot |
| External Services | Gmail API, SMTP, Apify, Shopify, YouTube, Slack, PostHog |
| Deployment | Fly.io (backend), Vercel (frontend), Docker (local dev) |

### Output

Modular spec files in `analysis/synthesis/`:
- One spec per domain (data model, backend API, workflows, webapp, context engine, integrations, infra)
- A complete user stories index that maps every feature back to user intent
- Each spec must be implementation-ready: a developer reads it and knows exactly what to build

## What To Do This Iteration

1. **Read the frontier**: Open `frontier/aspects.md`
2. **Find the first unchecked `- [ ]` aspect** in dependency order (Wave 1 before Wave 2 before Wave 3)
   - If ALL aspects are checked `- [x]`: write convergence summary to `status/converged.txt` and exit
3. **Analyze that ONE aspect** using the appropriate method (see below)
4. **Write findings** to `analysis/{aspect-name}.md`
5. **Update the frontier**:
   - Mark the aspect as `- [x]`
   - Update Statistics (increment Analyzed, decrement Pending, update Convergence %)
   - If you discovered new aspects, add them to the appropriate Wave
   - Add a row to `frontier/analysis-log.md`
6. **Commit**: `git add -A && git commit -m "loop(cheerful-reverse): {aspect-name}"`
7. **Exit**

## Analysis Methods

### Wave 1: Layer-by-Layer Extraction

For each layer/domain aspect, read the relevant source code and produce a structured analysis. Every finding must include file paths and line references.

#### `supabase-schema`
1. Read all migration files in `../../projects/cheerful/supabase/migrations/` (chronologically)
2. Read seed data in `../../projects/cheerful/supabase/seeds/`
3. Produce: complete ER diagram (text), table-by-table spec (columns, types, constraints, indexes, foreign keys), RLS policy summary, trigger/function inventory

#### `backend-api-surface`
1. Read all route files in `../../projects/cheerful/apps/backend/src/api/route/`
2. Read `../../projects/cheerful/apps/backend/src/api/router.py` for route registration
3. Read API model files in `../../projects/cheerful/apps/backend/src/models/api/`
4. Produce: every endpoint (method, path, auth, request body, response shape, purpose), grouped by domain

#### `backend-services`
1. Read all service files in `../../projects/cheerful/apps/backend/src/services/`
2. Read repository files in `../../projects/cheerful/apps/backend/src/repositories/`
3. Produce: service inventory (what each does, which repos it uses, which routes call it), domain groupings, key business logic documented with examples

#### `temporal-workflows`
1. Read all workflow files in `../../projects/cheerful/apps/backend/src/temporal/workflow/`
2. Read `../../projects/cheerful/apps/backend/src/temporal/worker.py` for registration
3. Produce: workflow catalog (trigger, purpose, activity sequence, error handling, retry policy), dependency graph between workflows

#### `temporal-activities`
1. Read all activity files in `../../projects/cheerful/apps/backend/src/temporal/activity/`
2. Cross-reference with workflow files to understand which workflows use which activities
3. Produce: activity inventory grouped by domain, input/output types, side effects, which workflows invoke each

#### `ai-features`
1. Read all files in `../../projects/cheerful/apps/backend/src/services/ai/features/`
2. Read `../../projects/cheerful/apps/backend/src/services/ai/llm.py` and `rag.py`
3. Read LLM model schemas in `../../projects/cheerful/apps/backend/src/models/llm/`
4. Produce: AI feature catalog (purpose, prompt strategy, structured output schema, where invoked), RAG architecture

#### `webapp-routing`
1. Read all `page.tsx` and `layout.tsx` files under `../../projects/cheerful/apps/webapp/app/`
2. Read `../../projects/cheerful/apps/webapp/components/app-sidebar.tsx` for navigation
3. Produce: complete route map (path → page → purpose), navigation structure, layout hierarchy, auth gates

#### `webapp-campaign-wizard`
1. Read all files in `../../projects/cheerful/apps/webapp/components/campaigns/new-campaign/`
2. Read `../../projects/cheerful/apps/webapp/stores/campaign-wizard-store.ts`
3. Read campaign hooks in `../../projects/cheerful/apps/webapp/hooks/`
4. Produce: step-by-step wizard spec (each step's fields, validation, state management, API calls), wizard state machine, conditional logic

#### `webapp-mail-inbox`
1. Read all files under `../../projects/cheerful/apps/webapp/app/(mail)/mail/`
2. Read email-related components and editors in `../../projects/cheerful/apps/webapp/components/ui/`
3. Produce: inbox UI spec (thread list, thread detail, compose/reply, draft management), real-time update mechanism, thread state display

#### `webapp-state-stores`
1. Read all store files in `../../projects/cheerful/apps/webapp/stores/`
2. Read all hook files in `../../projects/cheerful/apps/webapp/hooks/`
3. Produce: state architecture (what lives in Zustand vs server state vs URL state), store schemas, hook inventory with purposes

#### `context-engine-core`
1. Read `../../projects/cheerful/apps/context-engine/CLAUDE.md` and `../../projects/cheerful/apps/context-engine/COOKBOOK.md`
2. Read all core modules in `../../projects/cheerful/apps/context-engine/app/src_v2/core/`
3. Read entrypoints in `../../projects/cheerful/apps/context-engine/app/src_v2/entrypoints/`
4. Produce: context engine architecture (routing, chunking, selection, history), Slack bot spec, prompt templates

#### `context-engine-mcp-tools`
1. Read all tool packages in `../../projects/cheerful/apps/context-engine/app/src_v2/mcp/tools/`
2. Read `../../projects/cheerful/apps/context-engine/app/src_v2/mcp/registry.py` and `catalog.py`
3. Produce: MCP tool catalog (each tool's purpose, available operations, input/output types), tool registration architecture

#### `infra-deploy`
1. Read `../../projects/cheerful/infra/` — dev, stg, prd configs
2. Read Fly.io configs: `../../projects/cheerful/apps/backend/fly.prd.toml`, `fly.stg.toml`
3. Read `../../projects/cheerful/apps/webapp/vercel.json`
4. Read Docker configs and scripts
5. Produce: deployment topology (what runs where), environment management, secret handling, CI/CD pipeline, local dev setup

### Wave 2: Cross-Cutting Analysis

Read ALL Wave 1 analysis files in `analysis/` before starting any Wave 2 aspect. Wave 2 synthesizes patterns across layers.

#### `user-journeys`
1. Read all Wave 1 analysis files
2. Trace every distinct user journey end-to-end:
   - **For each journey**: persona, goal, trigger, step-by-step flow (which UI → which API → which service → which workflow → which DB operations), success criteria
3. Produce: complete user journey catalog, organized by persona (brand manager, campaign operator, team admin)

#### `data-flow-map`
1. Read all Wave 1 analysis files
2. For each major data entity (campaign, creator, thread, email, product): trace the full lifecycle from creation → processing → storage → display → archival
3. Produce: data flow diagrams (text), entity lifecycle documentation, event/trigger chains

#### `integration-points`
1. Read all Wave 1 analysis files, especially `ai-features`, `context-engine-mcp-tools`, and `backend-services`
2. For each external integration (Gmail, SMTP, Shopify, YouTube, Slack, Apify, Firecrawl, PostHog, Composio): document what it does, why it's needed, how it's configured, error handling
3. Produce: integration catalog with purpose, auth method, data exchanged, failure modes

#### `auth-permissions`
1. Read Wave 1 `supabase-schema` analysis (RLS policies)
2. Read auth-related code in backend and webapp
3. Produce: auth architecture (Supabase Auth flow), team/user model, RLS policy inventory, permission matrix (who can do what)

#### `campaign-lifecycle`
1. Read Wave 1 analyses for `temporal-workflows`, `webapp-campaign-wizard`, `backend-api-surface`
2. Trace the complete campaign lifecycle: creation → configuration → launch → outreach → thread processing → follow-ups → post tracking → reporting
3. Produce: campaign state machine, stage-by-stage documentation with all branching paths

#### `ai-orchestration`
1. Read Wave 1 analyses for `ai-features`, `context-engine-core`, `context-engine-mcp-tools`
2. Map every place Claude/AI is used across the entire stack
3. Produce: AI usage map (feature, model, prompt strategy, structured output, purpose), how context engine orchestrates multi-tool workflows

### Wave 3: Synthesis

Read ALL Wave 1 and Wave 2 analysis files before starting any Wave 3 aspect. Synthesis produces implementation-ready spec documents.

For each synthesis aspect, write to `analysis/synthesis/{spec-name}.md`.

#### `spec-data-model`
Synthesize `supabase-schema` + `data-flow-map` + `auth-permissions` into a canonical data model spec:
- Complete ER diagram
- Table-by-table specification with column purposes (not just types)
- Relationship documentation with cardinality and business rules
- Index strategy with rationale
- RLS policy spec

#### `spec-backend-api`
Synthesize `backend-api-surface` + `backend-services` + `auth-permissions` into an API contract spec:
- Endpoint catalog with full request/response schemas
- Authentication/authorization requirements per endpoint
- Error responses and status codes
- Rate limiting and pagination patterns

#### `spec-workflows`
Synthesize `temporal-workflows` + `temporal-activities` + `campaign-lifecycle` into a workflow orchestration spec:
- Workflow catalog with trigger conditions and activity sequences
- Activity specifications with idempotency and retry behavior
- Workflow interaction patterns (parent/child, signals, queries)
- Error handling and compensation logic

#### `spec-webapp`
Synthesize `webapp-routing` + `webapp-campaign-wizard` + `webapp-mail-inbox` + `webapp-state-stores` + `user-journeys` into a frontend architecture spec:
- Route map with page purposes
- Component hierarchy with prop interfaces
- State management architecture
- Campaign wizard step-by-step specification
- Mail inbox interaction specification

#### `spec-context-engine`
Synthesize `context-engine-core` + `context-engine-mcp-tools` + `ai-orchestration` into a context engine spec:
- Architecture overview (routing, chunking, selection)
- MCP tool specifications with input/output contracts
- Slack bot interaction patterns
- Prompt template library

#### `spec-integrations`
Synthesize `integration-points` + `ai-orchestration` into an external integrations spec:
- Integration catalog with auth, data flow, and failure handling
- Gmail/SMTP email pipeline specification
- Social platform integration specs (YouTube, Shopify)
- Analytics pipeline specification (PostHog, Mixpanel)

#### `spec-infra`
Synthesize `infra-deploy` into an infrastructure & deployment spec:
- Service topology diagram
- Environment configuration (dev/stg/prd)
- Deployment procedures per service
- Secret management
- Monitoring and observability setup

#### `spec-user-stories`
Synthesize `user-journeys` + ALL other Wave 2/3 analyses into a complete user stories index:
- Organized by persona and epic
- Each story: "As a [persona], I want to [action] so that [outcome]"
- Acceptance criteria referencing specific spec sections
- Feature-to-story traceability matrix (every feature maps to at least one story)
- Priority/complexity annotations based on codebase evidence

### Wave 4: Production Data Analysis

Wave 4 queries the **live production Supabase database** to understand how features are actually used. Read ALL Wave 1–3 analysis files before starting any Wave 4 aspect — you need the schema and feature context to write meaningful queries.

**Database access:** The environment variable `CHEERFUL_DATABASE_URL` contains a direct PostgreSQL connection string to the production Supabase database (read-only). Use `psql` to run queries:

```bash
psql "$CHEERFUL_DATABASE_URL" -c "SELECT ..."
```

**Query guidelines:**
- Always use `LIMIT` on exploratory queries to avoid pulling too much data.
- For counts and aggregates, no limit needed.
- Never run INSERT, UPDATE, DELETE, or DDL statements. Read-only queries only.
- Include the exact SQL query in your analysis output so findings are reproducible.
- When timestamps exist, bucket by week/month to show trends over time.
- Cross-reference findings with Wave 1–3 analysis to explain what the numbers mean.

#### `usage-data-landscape`
1. For every table documented in `analysis/supabase-schema.md`, run: `SELECT count(*) FROM {table}` and `SELECT min(created_at), max(created_at) FROM {table}` (where created_at exists)
2. Identify the biggest tables, empty tables, and most recently active tables
3. Produce: data landscape overview — which parts of the system have real data, what's dormant, data growth patterns

#### `usage-campaign-patterns`
1. Query `campaign` table: count by status, count by automation_level, distribution of creator counts per campaign
2. Query `campaign_sender`, `campaign_recipient`: average senders/recipients per campaign
3. Query `campaign_product`: how many campaigns use product associations
4. Query `campaign_outbox_queue` and `campaign_follow_up_outbox_queue`: outreach volume, follow-up usage
5. Produce: campaign usage profile — how campaigns are configured, typical sizes, which automation levels are actually used

#### `usage-email-activity`
1. Query `gmail_message` / `smtp_message`: total volumes, inbound vs outbound, messages per week/month trend
2. Query `gmail_thread_state` / `smtp_thread_state`: thread counts by status, threads per campaign
3. Query `gmail_thread_llm_draft`: AI draft volumes, drafts per thread
4. Query `gmail_thread_ui_draft`: manual draft volumes, compare to AI drafts
5. Query `email_dispatch_queue`: dispatch volumes, queue patterns
6. Produce: email pipeline health — volumes, AI vs manual drafting ratio, thread processing throughput

#### `usage-creator-pipeline`
1. Query `creator`: total creators, creators with vs without enrichment
2. Query `creator_enrichment_attempt`: enrichment attempts, success/failure rates by source
3. Query `campaign_creator`: creators per campaign, overlap across campaigns
4. Query `creator_list` / `creator_list_item`: list sizes, how many lists per user
5. Query `campaign_lookalike_suggestion`: lookalike feature usage
6. Produce: creator pipeline funnel — discovery → enrichment → outreach → response rates

#### `usage-ai-effectiveness`
1. Query `gmail_thread_llm_draft`: total drafts generated, drafts per campaign, drafts over time trend
2. Cross-reference with `gmail_message` (outbound): estimate how many AI drafts were actually sent vs discarded
3. Query `campaign_rule_suggestion_analytics`: rule suggestion usage, acceptance rates
4. Query `email_reply_example`: how many campaigns use reply examples for style training
5. Produce: AI feature adoption — which AI features are used, draft approval rate, style training adoption

#### `usage-user-engagement`
1. Query `auth.users` (if accessible) or `user_setting` / `user_onboarding`: total users, onboarding completion rate
2. Query `user_gmail_account` / `user_smtp_account`: email account connections per user
3. Query `team` / `team_member`: team sizes, teams per user
4. Query `campaign_member_assignment`: campaign sharing patterns
5. Query `email_signature`: signature usage
6. Produce: user adoption profile — how many users, team structures, feature discovery patterns

#### `usage-workflow-health`
1. Query `campaign_workflow`: workflow types registered, workflows per campaign
2. Query `campaign_workflow_execution`: execution counts, statuses, execution frequency over time
3. Query `discord_workflow` / `discord_workflow_execution`: Discord subsystem usage (if any)
4. Produce: workflow execution profile — which workflows run most, success rates, automation coverage

#### `synthesis-usage-report`
1. Read ALL `analysis/usage-*.md` files
2. Cross-reference with Wave 3 synthesis specs to identify: features that are heavily used vs dormant, surprising usage patterns, potential product insights
3. Produce: executive usage report — feature adoption matrix, key metrics, what the data says about which features matter most, recommendations for what to prioritize in a rebuild

## Rules

- Do ONE aspect per run, then exit.
- Check dependencies before starting an aspect. All Wave 1 aspects must complete before Wave 2. All Wave 2 before Wave 3. All Wave 3 before Wave 4.
- Write findings in markdown with specific file paths and line references.
- Every feature documented must explain its PURPOSE — what user problem it solves, not just what it does technically.
- When you discover a subsystem, pattern, or concern not covered by existing aspects, add a new aspect to the appropriate Wave.
- Keep analysis files focused. One aspect = one file.
- Do NOT modify any files in `../../projects/cheerful/`. The codebase is read-only.
- Do NOT run any write operations (INSERT, UPDATE, DELETE, DDL) against the database. Read-only queries only.
- For large source files (>500 lines), document the key sections with line ranges rather than trying to capture every detail.
- Prefer concrete examples over abstract descriptions. Show sample payloads, state transitions, and decision trees.
- When documenting AI features, include the prompt strategy and structured output schema — these are as important as the code.
- For Wave 4 data queries, always include the exact SQL in your output so findings are reproducible.
