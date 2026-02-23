# Private Work Context

These are private repos under org accounts that don't show on the public GitHub profile.
The code isn't classified — the user wants this work factored into the profile narrative.

Cloned locally at `input/decision-orchestrator/` and `input/cheerful/` for deep scanning.

---

## decision-orchestrator — pymc-labs org

**What**: Discord-based organizational OS for coordinating AI agents and workflows across teams. Like OpenClaw but for teams/orgs — less bloat, Claude Agent SDK with custom MCP server, better security.

**Role**: Core maintainer / architect. 420 commits (2nd largest contributor).

**Tech stack**:
- Python 3.12+, discord.py, Claude Agent SDK, Composio (50+ integrations)
- Custom MCP tool registry with `@tool` decorator, context injection, credential gating
- Supabase (PostgreSQL), SQLAlchemy 2.0, FastAPI for webhooks
- Langfuse observability, Fly.io deployment
- FCIS (Functional Core, Imperative Shell) architecture

**Key features built**:
- Workflow-based orchestration: database-driven workflows scoped to Discord servers/channels
- Intelligent message routing via classifier → workflow selection → tool assembly
- Custom MCP tool registry (not FastMCP) with context injection and scope-based access control
- Thread session persistence across Claude, Langfuse, and database
- Multi-platform integrations: Toggl, Google Workspace, Xero, Bluedot, Onyx RAG, GitHub, Fly.io
- Discord archive sync to Supabase Storage
- Shared client library package (orchestrator-clients)

**Scale**: ~285 Python files, ~36,400 LOC, 24 direct dependencies, 5+ database tables

**What this signals**: Production-grade agent infrastructure, MCP protocol expertise, team-scale orchestration, security-conscious design (credential gating, scope-based access)

---

## cheerful — nuts-and-bolts-ai org

**What**: Email automation platform for influencer marketing campaigns. Full-stack product: search for creators, AI-draft personalized emails, execute campaigns via Gmail at scale.

**Role**: Core maintainer. 580 commits (2nd largest contributor out of 5).

**Tech stack**:
- Backend: Python, FastAPI, Temporal.io (durable workflows), Claude SDK + Agent SDK, Gmail API, Composio, Supabase, Langfuse
- Frontend: Next.js 16+, React 19, TanStack Query, Zustand, Tailwind + Radix/shadcn
- Context Engine (Slack bot): Slack Bolt, Claude Agent SDK, Onyx RAG, MCP servers

**Key features built**:
- Campaign management: create, review, execute influencer outreach campaigns
- Creator search & enrichment: waterfall pipeline for bio/website crawling
- AI-powered email drafting with personalization via Claude
- Gmail OAuth integration: account management, email threading
- Temporal-based durable workflow execution for campaign pipelines
- Slack bot (Context Engine): AI assistant with MCP tool orchestration for team ops
- Multi-step campaign wizard with email preview and review

**Scale**: 2,170 source files, ~13,100 LOC, 5,570 total commits, 3 major apps (backend, webapp, context-engine)

**What this signals**: Full-stack product engineering, AI-native product development, workflow orchestration (Temporal), real-world email/marketing automation at scale, frontend proficiency (React 19, Next.js)

---

## Combined narrative impact

These two projects show:
1. **Production AI infrastructure** — not hobby projects, real products with real users
2. **Claude Agent SDK expertise** — both use it as the core orchestration layer
3. **MCP protocol depth** — custom MCP servers in both, not just consuming tools
4. **Full-stack range** — backend (Python/FastAPI), frontend (Next.js/React), infra (Fly.io, Temporal, Supabase)
5. **Team-scale engineering** — multi-contributor repos with proper architecture, CI/CD, migrations
6. **Consistent patterns** — Langfuse observability, Supabase, Claude SDK, Composio across both projects
7. **Builder velocity** — 1,000+ combined commits from clsandoval across both repos
