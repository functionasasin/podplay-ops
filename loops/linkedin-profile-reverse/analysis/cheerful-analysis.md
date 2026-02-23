# Cheerful Analysis — Nuts and Bolts AI

**Analyzed:** 2026-02-23
**Method:** GitHub API (org scan), private-work-context cross-reference, monorepo-project-inventory cross-reference
**Source data:** `input/cheerful/` (local clone referenced in github-profile-reverse), private-work-context.md, nuts-and-bolts-ai GitHub org

---

## What Is Cheerful?

Full-stack email automation platform for influencer marketing campaigns. The product workflow:

1. **Search creators** — waterfall enrichment pipeline crawls bios and websites to build creator profiles
2. **AI-draft personalized outreach** — Claude generates tailored emails per creator, not mail-merge templates
3. **Execute campaigns at scale** — Gmail OAuth integration handles multi-account sending, threading, and tracking

Three distinct applications in one repo:
- **Backend API** — Python/FastAPI, the core campaign engine
- **Web App** — Next.js 16+ / React 19 frontend, campaign management UI with multi-step wizard
- **Context Engine** — Slack bot for team operations, built on Claude Agent SDK + MCP tool orchestration + Onyx RAG

## What Does Nuts and Bolts AI Do?

GitHub org profile: **"AI tools & systems experts."** Created May 2024. Only one public repo (claude-setup — a structured Claude Code workflow for feature development). The real product work (Cheerful) is private.

The org appears to be a small consultancy or product studio focused on AI-native tooling. The claude-setup repo is itself interesting — it's a 6-step numbered workflow for going from idea to shipped code, suggesting the team has a codified development methodology around Claude Code.

## Scale & Contribution

| Metric | Value |
|--------|-------|
| Role | Core maintainer (2nd largest contributor out of 5) |
| Personal commits | ~580 |
| Total project commits | ~5,570 |
| Source files | 2,170 |
| LOC | ~13,100 |
| Apps | 3 (backend, webapp, context-engine) |

**580 commits out of 5,570 total = ~10.4% of all commits**, but as 2nd largest contributor out of 5, this implies a concentrated core team where the top 2 contributors do the majority of the work.

## Tech Stack (Deep)

### Backend
- **Python** — core language
- **FastAPI** — API framework
- **Temporal.io** — durable workflow orchestration (not just async queues — workflows survive crashes, handle retries, maintain state across failures)
- **Claude SDK + Agent SDK** — AI orchestration layer for email personalization
- **Gmail API** — OAuth multi-account management, email threading
- **Composio** — integration framework (50+ external service connectors)
- **Supabase** — PostgreSQL database
- **Langfuse** — LLM observability and tracing

### Frontend
- **Next.js 16+** — bleeding-edge framework version
- **React 19** — latest React with server components, concurrent features
- **TanStack Query** — server state management
- **Zustand** — client state management
- **Tailwind + Radix/shadcn** — UI component system

### Context Engine (Slack Bot)
- **Slack Bolt** — Slack app framework
- **Claude Agent SDK** — AI reasoning layer
- **Onyx RAG** — retrieval-augmented generation for team context
- **MCP servers** — tool orchestration for team operations

### Infrastructure
- **Supabase** (managed Postgres + storage)
- **Langfuse** (LLM observability)
- Deployment target not specified in available context (likely Fly.io or similar given org patterns)

## Key Technical Features Built

1. **Campaign management system** — full CRUD + workflow for influencer outreach campaigns
2. **Creator search & enrichment** — waterfall pipeline: multi-source bio crawling, website parsing, profile building
3. **AI-powered personalized email drafting** — Claude generates individualized emails (not templates with variable insertion)
4. **Gmail OAuth integration** — multi-account management, email threading and tracking
5. **Temporal-based durable workflows** — campaign execution pipelines that survive failures and retry intelligently
6. **Slack Context Engine** — team AI assistant with MCP tool orchestration for operational support
7. **Multi-step campaign wizard** — frontend UX with email preview and review workflow before send

## What's Impressive (To a LinkedIn Viewer)

### For Technical Builders
- **Temporal.io for workflow orchestration** — this is a serious production choice. Temporal is what companies like Stripe and Netflix use for durable workflows. Using it means understanding workflow-as-code patterns, activity retries, saga patterns, and state persistence. This is not "I used a task queue."
- **React 19 + Next.js 16** — bleeding-edge frontend. React 19 server components are barely stable. Running this in production shows frontend depth, not just backend-focused AI work.
- **MCP servers in the Context Engine** — building MCP tool orchestration (not consuming it) for a Slack bot is the kind of thing only people deep in the agent infra space are doing right now.
- **Three apps, one product** — backend + webapp + Slack bot as a cohesive product shows full-stack range and product architecture skills.

### For Operators/Business People
- **Email automation at scale** — this is a real business problem (influencer marketing is a $21B+ industry)
- **AI-native product** — not bolted-on AI, but AI as the core product differentiator (personalized drafting)
- **Team of 5** — small team shipping a multi-app product = high leverage per person

### For Investors
- **1,000+ combined commits** (with Decision Orchestrator) across two production AI platforms
- **Consistent architecture choices** — Langfuse, Supabase, Claude SDK, Composio appear across both Cheerful and Decision Orchestrator, suggesting a coherent platform thesis
- **Product-market alignment** — influencer marketing + AI personalization is a fundable vertical

## Connection to Other Work

| Related Work | Connection |
|-------------|-----------|
| Decision Orchestrator (PyMC Labs) | Same architectural DNA: Claude Agent SDK, MCP tools, Supabase, Langfuse, Composio. Both are "AI orchestration" but for different domains. |
| claude-setup (public repo) | The development methodology used to build Cheerful — codified Claude Code workflow |
| OpenClaw bot | Similar pattern: AI agent as interface (Telegram for OpenClaw, Slack for Context Engine, Discord for Decision Orchestrator) |
| Ralph loop pattern | Cheerful's campaign workflow (search → draft → review → execute) mirrors the loop pattern (analyze → write → review → iterate) |

## How To Frame on LinkedIn

### Title Options
- **Full-Stack Engineer** — accurate but generic
- **Core Engineer, Cheerful** — specific but means nothing to outsiders
- **AI Platform Engineer** — maps to industry role, accurate
- **Full-Stack AI Engineer** — combines range + domain

**Recommended:** "Full-Stack AI Engineer" or "AI Platform Engineer" — because the Temporal/MCP/Agent SDK depth goes beyond typical "full-stack" work, and the AI-native product design goes beyond typical "AI Engineer" roles.

### Company
- **Nuts and Bolts AI** (matches GitHub org name)
- Subtitle/description: "AI tools & systems experts" (from org profile)

### Suggested Experience Entry

**Full-Stack AI Engineer**
Nuts and Bolts AI
[Date range: ~mid-2024 to present based on org creation May 2024]
Remote

Core engineer on Cheerful — an AI-native influencer marketing platform that finds creators, drafts personalized outreach via Claude, and executes campaigns through Gmail at scale.

- Built 3-app product (FastAPI backend, Next.js/React 19 webapp, Slack Context Engine) with 4 other engineers; 580+ commits as 2nd largest contributor
- Architected campaign execution on Temporal.io durable workflows — crash-resilient pipelines with intelligent retry and state persistence
- Implemented AI-personalized email drafting via Claude Agent SDK — each email individually crafted, not template-filled
- Built Slack-based Context Engine with custom MCP tool orchestration and Onyx RAG for team operations
- Frontend on React 19 + Next.js 16 with TanStack Query, Zustand, shadcn/ui — bleeding-edge stack in production

### What to Emphasize
1. **Temporal.io** — this is a differentiation signal. Very few people at this level use Temporal in production.
2. **Three apps, one product** — shows architectural range
3. **Claude Agent SDK + MCP** — connects to Decision Orchestrator work, shows a consistent agent infrastructure thesis
4. **580 commits / 2nd contributor** — velocity + ownership signal

### What to Leave Out
- Specific campaign metrics (likely NDA territory and the platform is private)
- Creator counts or email volumes (same NDA concern)
- Composio details (infrastructure plumbing, not impressive standalone)
- Specific client names (if any)

---

## Key Takeaway for Profile Writers

Cheerful proves **full-stack product engineering at the AI-native level**. It's not a side project or a proof-of-concept — it's a multi-app platform with 5,570 commits from a 5-person team. The tech choices (Temporal, React 19, MCP, Claude Agent SDK) are consistently forward-leaning.

Combined with Decision Orchestrator, the pattern becomes clear: **clsandoval builds production AI orchestration systems**. Different domains (marketing automation vs organizational OS), same architectural DNA (Claude SDK + MCP + Supabase + Langfuse). This is someone who has a platform thesis, not just a job.
