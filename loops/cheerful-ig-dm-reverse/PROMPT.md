# Cheerful Instagram DM Integration — Reverse Ralph Loop

You are an analysis agent in a ralph loop. Each time you run, you do ONE unit of work, then exit.

## Your Working Directory

You are running from `loops/cheerful-ig-dm-reverse/`. All paths below are relative to this directory.

## Your Goal

Produce an exhaustive **options catalog** for adding Instagram DM support to the Cheerful platform. The focus is **inbound-first**: capturing creator DM replies and mapping them to the existing thread/campaign/creator model. Outreach still happens via email.

The catalog must explore every viable approach at both the **design level** (data model, thread mapping, channel abstraction patterns) and **implementation abstraction level** (specific APIs, webhook configurations, auth flows, third-party services). For each approach, document trade-offs, constraints, effort estimates, and compatibility with Cheerful's existing architecture.

**Do NOT pick a winner.** The output is a comprehensive options catalog that enumerates all approaches with honest pros/cons.

### Reference Material

- **Cheerful codebase**: `../../projects/cheerful/`
- **Cheerful reverse spec** (converged): `../cheerful-reverse/analysis/` — especially:
  - `synthesis/spec-data-model.md` — current ER diagram, thread tables, event-sourced state
  - `synthesis/spec-integrations.md` — Gmail/SMTP pipeline, external services
  - `synthesis/spec-backend-api.md` — API surface
  - `synthesis/spec-workflows.md` — Temporal workflow patterns
  - `synthesis/spec-webapp.md` — frontend architecture, mail inbox UI

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

### Key Architecture Context

Cheerful currently has a **dual-path email system**:
- **Gmail path**: `user_gmail_account` → `gmail_message` → `gmail_thread_state` (append-only)
- **SMTP path**: `user_smtp_account` → `smtp_message` → `smtp_thread_state` (append-only)
- Threads are linked to campaigns via `campaign_thread`
- Creators are global entities mapped to campaigns via `campaign_creator`
- Thread state is event-sourced (append-only rows, latest = current state)
- Trigger-maintained denormalization for latest message per thread

Instagram DMs would be a **third channel** alongside Gmail/SMTP.

### Output

An options catalog in `analysis/synthesis/`:
- One file per major topic area (API options, architecture patterns, data model approaches, etc.)
- A final `options-catalog.md` that cross-references everything into a comparison matrix
- Each option must include: description, how it works, constraints/limitations, effort estimate (relative), compatibility with existing architecture, risks

## What To Do This Iteration

1. **Read the frontier**: Open `frontier/aspects.md`
2. **Find the first unchecked `- [ ]` aspect** in dependency order (Wave 1 before Wave 2 before Wave 3 before Wave 4)
   - If ALL aspects are checked `- [x]`: write convergence summary to `status/converged.txt` and exit
3. **Analyze that ONE aspect** using the appropriate method (see below)
4. **Write findings** to `analysis/{aspect-name}.md`
5. **Update the frontier**:
   - Mark the aspect as `- [x]`
   - Update Statistics (increment Analyzed, decrement Pending, update Convergence %)
   - If you discovered new aspects, add them to the appropriate Wave
   - Add a row to `frontier/analysis-log.md`
6. **Commit**: `git add -A && git commit -m "loop(cheerful-ig-dm-reverse): {aspect-name}"`
7. **Exit**

## Analysis Methods

### Wave 1: External Landscape — Instagram DM Access Methods

Research every way to programmatically access Instagram DMs. For each approach, document: authentication requirements, capabilities (read/write/webhooks), rate limits, approval process, cost, and constraints.

#### `meta-instagram-messaging-api`
1. Research the Instagram Messaging API (part of Messenger Platform)
2. Document: supported message types, webhook events (`messages`, `messaging_postbacks`), thread model, 24-hour messaging window rules
3. Note: Instagram Professional accounts (Business/Creator) requirements
4. Document the app review process and required permissions (`instagram_manage_messages`, `pages_messaging`)
5. Produce: complete API capability map with constraints

#### `meta-graph-api-conversations`
1. Research the Instagram Graph API conversation endpoints (`/conversations`, `/messages`)
2. Document: what's available vs deprecated, differences from Messenger Platform approach
3. Note: relationship between Facebook Page, Instagram Professional Account, and API access
4. Produce: capability comparison with Messaging API approach

#### `meta-webhooks-realtime`
1. Research Meta webhook infrastructure for Instagram messaging
2. Document: webhook event types, delivery guarantees, verification flow, payload format
3. Document: webhook subscription setup, test mode, production requirements
4. Produce: webhook architecture requirements

#### `third-party-manychat`
1. Research ManyChat's Instagram DM API/integration capabilities
2. Document: what they expose (API, webhooks, export), pricing, limitations
3. Evaluate: can ManyChat act as a proxy/relay for DMs into Cheerful?
4. Produce: ManyChat as intermediary — capabilities and constraints

#### `third-party-messagebird-bird`
1. Research MessageBird (now Bird) Instagram channel support
2. Document: API capabilities, webhook support, pricing model
3. Evaluate: suitability as DM relay/proxy
4. Produce: Bird as intermediary assessment

#### `third-party-composio`
1. Research Composio's Instagram integration (Cheerful already uses Composio for some workflows)
2. Document: Instagram DM actions/triggers available, limitations
3. Evaluate: leverage existing Composio integration vs new direct integration
4. Produce: Composio path assessment

#### `third-party-others`
1. Research other potential intermediaries: Sendbird, Twilio, Zendesk, Intercom Instagram integrations
2. For each: brief capability assessment for DM relay use case
3. Produce: survey of other third-party options

#### `unofficial-approaches`
1. Research unofficial/scraping approaches (Apify Instagram actors, browser automation)
2. Document: capabilities, reliability, TOS risks, rate limits
3. Note: Cheerful already uses Apify for Instagram profile scraping
4. Produce: unofficial approach risk/capability assessment

### Wave 2: Internal Landscape — Cheerful's Current Architecture

Analyze Cheerful's existing thread/email/creator architecture to understand what "adding a DM channel" requires. Read the cheerful-reverse spec files and the actual codebase.

#### `current-thread-model`
1. Read `../cheerful-reverse/analysis/synthesis/spec-data-model.md`
2. Read the actual thread-related tables in `../../projects/cheerful/supabase/migrations/`
3. Document: thread identity model (how threads are keyed — gmail_thread_id, email_thread_id), thread state machine, how threads link to campaigns and creators
4. Identify: what's Gmail/SMTP-specific vs what's channel-agnostic in the current model
5. Produce: thread model analysis with abstraction opportunities

#### `current-email-pipeline`
1. Read `../cheerful-reverse/analysis/synthesis/spec-integrations.md` (Gmail/SMTP sections)
2. Read `../cheerful-reverse/analysis/synthesis/spec-workflows.md` (email-related workflows)
3. Document: the inbound email processing pipeline end-to-end (receive → parse → match thread → update state → trigger AI draft)
4. Identify: which pipeline stages are email-specific vs channel-agnostic
5. Produce: email pipeline analysis with abstraction boundaries

#### `current-creator-identity`
1. Read `../cheerful-reverse/analysis/synthesis/spec-data-model.md` (creator tables)
2. Read creator-related services in `../../projects/cheerful/apps/backend/src/services/`
3. Document: how creators are identified (email, social handles, enrichment), how they're linked to threads
4. Identify: does Cheerful already store Instagram handles for creators? How would DM sender → creator matching work?
5. Produce: creator identity resolution analysis for Instagram

#### `current-inbox-ui`
1. Read `../cheerful-reverse/analysis/synthesis/spec-webapp.md` (mail inbox section)
2. Document: how the inbox UI renders threads, what's hardcoded to email vs what's abstract
3. Identify: UI changes needed to display DM threads alongside email threads
4. Produce: inbox UI abstraction analysis

#### `current-ai-drafting`
1. Read `../cheerful-reverse/analysis/synthesis/spec-integrations.md` (Claude API section)
2. Read `../cheerful-reverse/analysis/ai-features.md`
3. Document: how AI drafts are generated for email replies, what context is used
4. Identify: what changes for DM drafts (shorter format, different tone, no subject line, media support)
5. Produce: AI drafting adaptation analysis

### Wave 3: Options Cross-Product

For each viable API approach from Wave 1, combined with architectural insights from Wave 2, document the full integration path. Each option should be a complete, self-contained design.

#### `option-direct-meta-api`
1. Read Wave 1 `meta-instagram-messaging-api` + `meta-webhooks-realtime` + all Wave 2 analyses
2. Design the full integration: auth flow, webhook handler, message ingestion, thread mapping, creator resolution, data model changes, UI changes
3. Document: end-to-end architecture, effort estimate, constraints, risks
4. Produce: complete option writeup

#### `option-graph-api-polling`
1. Read Wave 1 `meta-graph-api-conversations` + all Wave 2 analyses
2. Design: polling-based approach (if viable given API constraints)
3. Document: polling architecture, sync strategy, trade-offs vs webhooks
4. Produce: complete option writeup (or document why this approach is not viable)

#### `option-composio-relay`
1. Read Wave 1 `third-party-composio` + all Wave 2 analyses
2. Design: using Composio as the DM bridge, leveraging existing integration
3. Document: what Composio handles vs what Cheerful handles, data flow, limitations
4. Produce: complete option writeup

#### `option-third-party-relay`
1. Read Wave 1 third-party analyses + all Wave 2 analyses
2. For the most promising third-party (from Wave 1 findings): design the full relay architecture
3. Document: vendor dependency trade-offs, cost analysis, integration complexity
4. Produce: complete option writeup

#### `option-channel-abstraction`
1. Read all Wave 2 analyses
2. Design a generic channel abstraction layer that unifies email (Gmail/SMTP) and Instagram DMs under one model
3. Document: abstract interfaces, concrete implementations, migration strategy for existing email tables
4. This is an ARCHITECTURE PATTERN option, not an API choice — it can be combined with any Wave 3 API option
5. Produce: channel abstraction architecture

#### `option-parallel-tables`
1. Read all Wave 2 analyses
2. Design the "third path" approach: add `ig_dm_*` tables mirroring the Gmail/SMTP pattern
3. Document: new tables, minimal changes to existing code, trade-offs vs abstraction
4. This is an ARCHITECTURE PATTERN option, not an API choice
5. Produce: parallel tables architecture

### Wave 4: Synthesis

Read ALL Wave 1, 2, and 3 analysis files before starting any Wave 4 aspect.

#### `synthesis-options-catalog`
1. Read every analysis file
2. Build the master options catalog:
   - **API/Access options**: each approach with capability matrix
   - **Architecture options**: each pattern with trade-off matrix
   - **Combination matrix**: which API options work with which architecture patterns
   - **Constraint summary**: 24-hour windows, approval processes, rate limits, cost
   - **Effort estimates**: relative sizing for each combination
   - **Risk register**: per-option risks and mitigations
3. Write to `analysis/synthesis/options-catalog.md`
4. Produce: the definitive options reference document

## Rules

- Do ONE aspect per run, then exit.
- Check dependencies: all Wave 1 before Wave 2, all Wave 2 before Wave 3, all Wave 3 before Wave 4.
- Write findings in markdown with specifics — API endpoint URLs, payload examples, code references.
- When researching APIs, use `WebSearch` and `WebFetch` to get current documentation. APIs change frequently.
- When analyzing Cheerful code, reference specific file paths and line numbers.
- When you discover a new viable approach not covered by existing aspects, add it to the appropriate Wave.
- Keep analysis files focused. One aspect = one file.
- Do NOT modify any files in `../../projects/cheerful/`. The codebase is read-only.
- Do NOT pick a "recommended" option. Present all options neutrally with honest trade-offs.
- For third-party services, include pricing information where available.
- Every option must assess compatibility with Cheerful's existing Temporal workflow patterns and event-sourced thread model.
