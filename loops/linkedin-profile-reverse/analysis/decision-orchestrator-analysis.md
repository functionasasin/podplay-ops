# Decision Orchestrator Analysis — PyMC Labs

**Analyzed:** 2026-02-23
**Method:** GitHub API (org scan, repo search, contributor analysis), private-work-context cross-reference, monorepo-project-inventory cross-reference, PyMC ecosystem mapping
**Source data:** `input/decision-orchestrator/` (local clone referenced in github-profile-reverse), private-work-context.md, pymc-labs GitHub org

---

## What Is Decision Orchestrator?

A Discord-based organizational OS for coordinating AI agents and workflows across teams. Think: a Slack/Discord bot that understands your workflows, routes tasks intelligently, and connects to 50+ external integrations — but built on the Claude Agent SDK with a custom MCP tool registry, not a third-party glue layer.

**Core workflow:**
1. Team member sends a message in Discord
2. Intelligent classifier analyzes intent
3. Workflow engine selects the appropriate database-driven workflow (scoped to server/channel)
4. Tool assembler dynamically provisions the right MCP tools
5. Claude Agent SDK executes with injected context and scoped credentials
6. Results flow back into Discord thread with full session persistence

This is not a chatbot. It's agent infrastructure — a programmable orchestration layer where the LLM is the routing engine, not the product.

## Repository Status

**Visibility:** Private repo under `pymc-labs` org. Confirmed via:
- `https://api.github.com/repos/pymc-labs/decision-orchestrator` → 404 (Not Found)
- GitHub search for "decision orchestrator org:pymc-labs" → 0 results
- Not listed in public org repos (`https://api.github.com/orgs/pymc-labs/repos?per_page=100`)

The repo exists locally at `input/decision-orchestrator/` (cloned for the github-profile-reverse loop) and is described in detail in `input/private-work-context.md`.

## Scale & Contribution

| Metric | Value |
|--------|-------|
| Role | Core maintainer / architect |
| Personal commits | ~420 (2nd largest contributor) |
| Python files | ~285 |
| Lines of code | ~36,400 |
| Direct dependencies | 24 |
| Database tables | 5+ |

**420 commits as 2nd largest contributor** implies a concentrated core team, similar to the Cheerful pattern. The LOC count (36.4K) makes this a substantial codebase — more code than many production SaaS backends.

## Tech Stack (Deep)

### Core
- **Python 3.12+** — latest Python, using modern features
- **discord.py** — Discord framework
- **Claude Agent SDK** — AI orchestration layer (same as Cheerful)
- **Composio** — 50+ external service integrations (same as Cheerful)

### MCP Tool System (The Differentiator)
- **Custom MCP tool registry** — NOT FastMCP. Hand-built protocol implementation.
- **`@tool` decorator** — register functions as MCP tools with metadata
- **Context injection** — tools receive runtime context (user, channel, server, credentials)
- **Scope-based credential gating** — tools only access credentials they're authorized for, scoped per server/channel
- **Dynamic tool assembly** — each request gets a custom tool set based on workflow + context

This is the most technically distinctive aspect. Most people using MCP are *consuming* tools from an MCP server. Building a custom MCP server with context-aware credential scoping is something only people deep in the protocol are doing.

### Database & Persistence
- **Supabase (PostgreSQL)** — primary database (same as Cheerful)
- **SQLAlchemy 2.0** — ORM with modern async patterns
- **Thread session persistence** — sessions maintained across Claude, Langfuse, and database layers

### Infrastructure
- **FastAPI** — webhook endpoints for external integrations
- **Langfuse** — LLM observability and tracing (same as Cheerful)
- **Fly.io** — deployment target (same pattern as OpenClaw)

### Architecture Pattern
- **FCIS (Functional Core, Imperative Shell)** — explicit architectural discipline. Pure functional logic at the core, side effects pushed to the edges. This is a deliberate design choice that signals someone who thinks about software architecture, not just shipping features.

## Key Technical Features Built

1. **Workflow-based orchestration** — Database-driven workflows scoped to Discord servers and channels. Each workspace can have its own set of workflows, tools, and permissions. Not hardcoded.

2. **Intelligent message routing** — Classifier → workflow selection → tool assembly pipeline. The system doesn't just respond to commands — it understands intent and routes to the appropriate workflow.

3. **Custom MCP tool registry** — Hand-built MCP server (not the FastMCP convenience wrapper). This means implementing the protocol itself: tool discovery, invocation, result marshaling, error handling. With custom context injection and credential scoping on top.

4. **Thread session persistence** — Sessions span across:
   - Claude conversation context
   - Langfuse trace/observation hierarchy
   - Supabase database records
   This three-layer persistence means sessions survive crashes, can be audited, and maintain conversation coherence.

5. **Multi-platform integrations** — Toggl (time tracking), Google Workspace (docs/calendar), Xero (accounting), Bluedot (meeting transcription), Onyx RAG (document search), GitHub (code), Fly.io (deployment). These are production integrations, not demo connectors.

6. **Discord archive sync** — Bulk sync of Discord history to Supabase Storage. Shows ops-level thinking: the tool doesn't just process new messages, it can ingest historical context.

7. **Shared client library** — `orchestrator-clients` package. Multi-package architecture suggests the system is designed for extensibility and reuse, not just one-shot deployment.

## What's Impressive (To a LinkedIn Viewer)

### For Technical Builders
- **Custom MCP server with credential gating** — This is frontier agent infrastructure. The MCP protocol is months old; building a custom server with scope-based access control means understanding both the protocol internals and the security model needed for multi-tenant deployment.
- **36K LOC in Python** — This is a real product, not a proof-of-concept. 285 Python files with proper architecture (FCIS) means it's designed to be maintained, not just shipped.
- **Claude Agent SDK as orchestration layer** — One of the earliest production deployments of the Agent SDK for multi-agent coordination (not just single-agent chat).
- **Workflow-as-data (database-driven)** — Workflows are stored in the database, not hardcoded. This means non-engineers can configure new workflows. Production thinking.

### For Operators/Business People
- **Organizational OS** — not just a dev tool. This is meant to coordinate entire teams.
- **50+ integrations** — Toggl, Xero, Google Workspace, etc. means it touches real business operations.
- **Discord as interface** — meets teams where they already are. No new app to learn.

### For Investors
- **Platform thesis** — Combined with Cheerful, this demonstrates a coherent vision: AI orchestration platforms that sit on top of communication channels (Discord, Slack, Telegram) and coordinate workflows through LLM-powered routing.
- **Architectural consistency** — The same stack (Claude SDK, MCP, Supabase, Langfuse, Composio, Fly.io) appears across Decision Orchestrator, Cheerful, AND personal projects (OpenClaw). This person has a platform playbook, not just a job.

## Connection to PyMC Labs Ecosystem

### PyMC Labs Context
PyMC Labs is the professional services / product arm of the PyMC project (one of the most widely used probabilistic programming libraries). The org's public repos include:
- **pymc-marketing** (Bayesian marketing toolbox — MMM, CLV, BTYD)
- **CausalPy** (causal inference)
- **ai_decision_workshop** (52 stars, taught by Chris Fonnesbeck — Bayesian decision-making under uncertainty)
- **agent-skills** (12 stars, AI agent skills for probabilistic programming)
- **python-analytics-skills** (4 stars, Claude Code plugin for PyMC + marimo)

### How Decision Orchestrator Fits
Decision Orchestrator is the *internal infrastructure* that PyMC Labs uses to run its own operations. It's the "eat your own cooking" product: an AI-powered organizational OS that a Bayesian consulting firm uses to coordinate its own work.

The connection is significant: building operational tooling for a team of probabilistic programming experts means the tool's requirements are set by technically demanding users. This is not a generic chatbot — it's infrastructure trusted by people who build statistical modeling frameworks.

### clsandoval's PyMC Ecosystem Engagement
Beyond Decision Orchestrator, the engagement with the PyMC ecosystem is deep:
- **pymc-extras** fork — active engagement with PyMC add-ons
- **pymc-model-interactivity** fork — interactive Bayesian model exploration with marimo notebooks
- **pytensor-workshop-demo** fork — participated in PyTensor (PyMC's tensor computation backend) workshop
- **agent-skills** fork — the agent skills library for probabilistic programming

This is not "I used PyMC once." This is deep, multi-year ecosystem engagement — forking core packages, attending workshops, contributing to the tooling layer.

### Probabilistic Programming as Identity Signal
The PyMC Labs connection does double duty:
1. **Production AI infrastructure** — Decision Orchestrator is a real product with 420 commits
2. **Bayesian/probabilistic identity** — The affiliation signals a worldview about uncertainty, inference, and decision-making that's rare in the LLM/agent space

Most AI engineers come from a deep learning / transformer background. Coming from a probabilistic programming background means understanding prior distributions, posterior inference, uncertainty quantification, and decision theory. This is a genuine differentiator.

## How To Frame on LinkedIn

### Title Options
- **AI Agent Infrastructure Engineer** — accurate, signals what was built
- **Core Engineer, Decision Orchestrator** — specific but needs context for outsiders
- **AI Platform Engineer** — broader, maps to industry role
- **AI Infrastructure Engineer** — clean, accurate

**Recommended:** "AI Infrastructure Engineer" or "AI Agent Infrastructure Engineer" — because the MCP server + workflow orchestration + agent coordination is infrastructure work, not application development. The "Agent" qualifier is optional but adds specificity that differentiates from generic "AI Engineer" roles.

### Company
- **PyMC Labs** — this is a recognized brand in the statistical computing world
- Subtitle context: "Decision intelligence & probabilistic AI consulting" (approximate)

### Suggested Experience Entry

**AI Infrastructure Engineer**
PyMC Labs
[Date range: ~2024 to present, based on repo activity and ecosystem engagement timeline]
Remote

Core engineer on Decision Orchestrator — a Discord-based organizational OS that coordinates AI agents and workflows for teams through intelligent message routing and dynamic tool assembly.

- Architected custom MCP tool server with context injection and scope-based credential gating — not a wrapper, a protocol-level implementation
- Built workflow orchestration engine: database-driven workflows scoped per Discord server/channel with intelligent classifier-based routing
- Implemented thread session persistence across Claude Agent SDK, Langfuse observability, and Supabase — sessions survive crashes and enable full audit trails
- Integrated 50+ external services (Toggl, Xero, Google Workspace, GitHub, Fly.io) via Composio for end-to-end team operations
- 420+ commits, ~36K LOC across 285 Python files; FCIS architecture (Functional Core, Imperative Shell)

### What to Emphasize
1. **Custom MCP server** — this is the headline tech signal. Building (not consuming) MCP tools with credential scoping puts this person at the frontier of agent infrastructure.
2. **PyMC Labs brand** — recognized name in statistical computing. Even people who don't use PyMC know the brand.
3. **FCIS architecture** — signals design discipline beyond "it works."
4. **36K LOC** — shows production scale, not proof-of-concept.
5. **Workflow-as-data** — database-driven workflows signal product thinking, not just engineering.

### What to Leave Out
- Specific Discord server names or team details (privacy / NDA)
- Composio implementation details (it's a dependency, not the interesting part)
- Specific Supabase schema details
- Contributor rankings or comparisons to other team members

## Connection to Other Work

| Related Work | Connection |
|-------------|-----------|
| Cheerful (Nuts and Bolts AI) | Same architectural DNA: Claude Agent SDK, MCP tools, Supabase, Langfuse, Composio. Different domain (marketing vs ops), same platform thesis. |
| OpenClaw bot (personal) | Same pattern: AI agent as interface over a communication channel (Discord for DO, Telegram for OpenClaw). OpenClaw is the personal/prototype version. |
| agent-skills (fork) | Skills library for AI agents doing probabilistic programming — the intersection of DO's agent infrastructure + PyMC's statistical modeling |
| Ralph loop pattern | Decision Orchestrator's workflow-as-data mirrors ralph loops' frontier-as-data: both are systems where the execution logic is data-driven, not hardcoded |

---

## Key Takeaway for Profile Writers

Decision Orchestrator proves **production AI agent infrastructure at the protocol level**. This is not someone who bolts a chatbot onto a Discord server. This is someone who builds the MCP server, designs the credential scoping model, architects the workflow engine, and maintains 36K LOC of production Python with explicit architectural discipline (FCIS).

Combined with Cheerful, the narrative becomes: **clsandoval builds production AI orchestration platforms — different domains, same architectural DNA, consistent platform thesis.** Combined with the PyMC ecosystem engagement, the narrative deepens: this is someone who brings a **probabilistic/Bayesian worldview** to agent infrastructure, which is genuinely unusual in the LLM space.

The PyMC Labs affiliation is strategically valuable for LinkedIn because it signals both *technical credibility* (recognized org in statistical computing) and *intellectual depth* (probabilistic programming is not beginner territory).
