# Monorepo Project Inventory — clsandoval

**Analyzed:** 2026-02-23
**Method:** Deep scan of entities/, automations/, loops/, docs/plans/, research/ + cross-reference with github-profile-reverse analysis + private work context
**Purpose:** Complete inventory of everything impressive this person has built, for LinkedIn profile construction

---

## Summary Stats

| Category | Count |
|----------|-------|
| Active projects (entity files) | 4 |
| Business entities | 4 |
| Private org repos (PyMC Labs + Nuts and Bolts AI) | 2 |
| Public repos (original) | 16 |
| Automation systems | 3+ |
| Ralph loops running | 3+ |

**Key finding:** The most impressive work (Decision Orchestrator, Cheerful) is completely invisible from public GitHub. The monorepo and its associated loops reveal both the operational scale (Southeast Asia franchise distribution, fintech partnerships) and the engineering depth (agentic loop patterns, autonomous CI pipelines). This is a massive gap between public signal and actual output.

---

## Part 1: Private Professional Work

### Decision Orchestrator — PyMC Labs
**LinkedIn section:** Experience (primary)

Discord-based organizational OS for coordinating AI agents and workflows across teams. Think: Slack bot that understands your workflows, routes tasks intelligently, and connects to 50+ integrations — but built on the Claude Agent SDK with a custom MCP tool registry, not a third-party glue layer.

**Role:** Core maintainer / architect. ~420 commits (2nd largest contributor).

**Scale:** ~285 Python files, ~36,400 LOC, 24 direct dependencies, 5+ database tables.

**Tech stack:**
- Python 3.12+, discord.py, Claude Agent SDK, Composio (50+ integrations)
- Custom MCP tool registry with `@tool` decorator, context injection, scope-based credential gating
- Supabase (PostgreSQL), SQLAlchemy 2.0, FastAPI for webhooks
- Langfuse observability, Fly.io deployment
- FCIS (Functional Core, Imperative Shell) architecture

**What was built:**
- Workflow-based orchestration: database-driven workflows scoped to Discord servers/channels
- Intelligent message routing: classifier → workflow selection → tool assembly
- Custom MCP server (not FastMCP) with context injection and scope-based access control
- Thread session persistence across Claude, Langfuse, and database layers
- Multi-platform integrations: Toggl, Google Workspace, Xero, Bluedot, Onyx RAG, GitHub, Fly.io
- Discord archive sync to Supabase Storage
- Shared client library package (orchestrator-clients)

**What's impressive:** Production-grade agent infrastructure. Not a proof-of-concept — it has real database tables, CI/CD, migrations, and multi-contributor review history. MCP protocol expertise is rare; building a *custom* MCP server (not consuming one) is rarer.

**LinkedIn framing:**
- Title: "AI Agent Infrastructure Engineer" or "Core Engineer, Decision Orchestrator"
- Company: PyMC Labs
- Bullets: custom MCP server, 36K+ LOC, multi-platform orchestration, FCIS architecture, Langfuse observability

---

### Cheerful — Nuts and Bolts AI
**LinkedIn section:** Experience (primary)

Full-stack email automation platform for influencer marketing campaigns. Search creators, AI-draft personalized outreach via Claude, execute campaigns through Gmail at scale. Three apps: backend API, web app, and a Slack-based Context Engine for team operations.

**Role:** Core maintainer. ~580 commits (2nd largest out of 5 contributors).

**Scale:** 2,170 source files, ~13,100 LOC, 5,570 total commits across the project.

**Tech stack:**
- Backend: Python, FastAPI, Temporal.io (durable workflows), Claude SDK + Agent SDK, Gmail API, Composio, Supabase, Langfuse
- Frontend: Next.js 16+, React 19, TanStack Query, Zustand, Tailwind + Radix/shadcn
- Context Engine (Slack bot): Slack Bolt, Claude Agent SDK, Onyx RAG, MCP servers

**What was built:**
- Campaign management system: create, review, execute influencer outreach at scale
- Creator search + enrichment: waterfall pipeline for bio/website crawling
- AI-powered personalized email drafting via Claude
- Gmail OAuth integration: multi-account management, email threading
- Temporal-based durable workflow execution for campaign pipelines
- Slack bot (Context Engine): AI assistant with MCP tool orchestration for team ops
- Multi-step campaign wizard with email preview + review workflow

**What's impressive:** Full-stack product engineering across 3 distinct apps. Temporal.io for durable workflows (not just async queues) shows production thinking — workflows survive crashes, handle retries, maintain state. React 19 + Next.js 16 is bleeding edge frontend.

**LinkedIn framing:**
- Title: "Full-Stack Engineer" or "Core Engineer, Cheerful"
- Company: Nuts and Bolts AI
- Bullets: React 19/Next.js, Temporal.io durable workflows, Gmail at scale, Claude Agent SDK orchestration, 5-person team

---

## Part 2: Active Projects (Entity Files)

### Pod Play Southeast Asia — Master Distribution / Franchise
**Entity file:** `entities/projects/pod-play-sea.md`
**LinkedIn section:** Experience (current/primary)

Master distribution and franchise operation for Pod Play (booking platform) and Ping Pod (table tennis venues) across Southeast Asia. Philippines first, then Singapore, Thailand, Indonesia.

**What this actually involves:**
- Hybrid cloud + on-premises deployment: cloud admin/APIs + local Mac Mini relay nodes with cameras/iPads at each venue
- Payment integration: Magpie partnership for GCash + credit card; building digital wallet with strategic float advantages
- Revenue model architecture: 70/30 upcharge split above $50 baseline, 17% withholding tax planning
- Regional franchise deals: Central Group (Thailand, one of Asia's largest conglomerates), Singapore EDB support for HQ candidacy
- First venue: Tela Park, Las Piñas — site survey done, installation in progress
- Training trip: Jersey City NJ, March 2026 for hardware/integration training

**What's impressive:** This is not a tech side project. It's operating a franchise distribution business across 4+ countries with real venue hardware, real fintech partnerships, and real enterprise partners (Central Group). The person is simultaneously the operator, the technologist, and the BD person.

**LinkedIn framing:**
- Title: "Head of Southeast Asia Distribution" or "Co-founder / SEA Operations"
- Company: Pod Play SEA / Ping Pod
- Bullets: master distribution rights across 4 countries, Magpie fintech partnership, Central Group Thailand deal, hybrid cloud + on-premises architecture at venues

---

### Digital Wallet — Pod Play Payments Platform
**Entity file:** `entities/projects/digital-wallet.md`
**LinkedIn section:** Experience (bundled with Pod Play SEA or separate)

Stored-value payment platform built on top of Pod Play's booking system, in partnership with Magpie (Philippines fintech). Cross-venue credit ecosystem designed for float advantages at scale.

**Architecture:**
- Stripe Payment Elements (3rd UI iteration)
- Supports credit system + direct booking + merchant product catalog (court bookings, coaching sessions, merchandise, F&B)
- Cost advantage: wallet-to-wallet ~1.5% vs direct credit card ~3.5% per transaction
- Regulatory: Magpie holds Philippines licenses; technology replicable across Asian markets with local partners
- Settlement: manual withdrawal or auto-daily to bank account, with reconciliation before availability

**Negotiation position:** Targeting 80/20 economics; working toward ~50/50 with Magpie.

**What's impressive:** Building a payment platform from scratch in a regulated market (Philippines). Understanding the regulatory layer (Magpie license structure), the float economics, and the product-market fit all simultaneously. Stripe integration at iteration 3 means real production friction has been encountered and solved.

**LinkedIn framing:** Bundle with Pod Play SEA experience entry. One bullet on digital wallet + Magpie partnership.

---

### Anime Highlight Generator — Autonomous Video Engine
**Entity file:** `entities/projects/anime-highlight-generator.md`
**LinkedIn section:** Featured (demonstrates agentic loop pattern at its most impressive) / About

Autonomous video engine that creates 30-60 minute anime highlight/recap videos with natural AI narration. Modeled after JarAnime channel. Built entirely using a two-phase ralph loop: reverse loop first extracts the formula from reference videos, forward loop builds the engine stage-by-stage via CI.

**Tech stack:** FFmpeg, OpenAI Whisper, PySceneDetect, Demucs (audio separation), MoviePy, ElevenLabs TTS, Claude API.

**Status:** Reverse loop converged (2026-02-22). Forward loop active (Stage 2 in progress as of 2026-02-23).

**What's impressive:** The project itself is technically interesting. But the meta-story is more impressive: this is an *autonomous pipeline building a pipeline*. The forward ralph loop is a CI job that runs Claude Code to build the next stage of the video engine, commits the result, and repeats. Human wrote the spec; CI builds it. This is a concrete demo of agentic development at the system level, not just prompt engineering.

**LinkedIn framing:**
- Use in About section as a concrete example of the agentic loop pattern
- Feature in Featured section as a link to the repo/design doc

---

### Ping Pod Asia Franchise Distribution
**Entity file:** `entities/projects/ping-pod-asia-franchise.md`
**LinkedIn section:** Bundle with Pod Play SEA (same operator, same distribution deal)

Master franchise distribution for Ping Pod across Asia. Ping Pod requires Pod Play software, so every franchise deal = both business lines.

**Business model:**
- Country fee: $100K
- Per-store fee: $28K
- Year 1 target: 10 stores; Year 2: 30 stores
- Key deal: Central Group (Thailand's richest/second-richest family conglomerate) interested in Thailand master franchisee role
- Lock-in advantage: Ping Pod operationally requires Pod Play — software and venue can't be separated

**What's impressive:** Structuring a franchise deal with a multi-billion dollar conglomerate (Central Group) as a distribution entity. Understanding the lock-in dynamics between software and physical franchise.

---

## Part 3: Automation Systems

### OpenClaw Bot (Fly.io + Telegram)
**Location:** `automations/openclaw/`
**LinkedIn section:** About (demonstrates always-on personal automation mindset)

Always-on Telegram bot that manages the monorepo as persistent state. When you message it with updates, meeting transcripts, decisions, or random info, it extracts entities and commits them back to git. No separate database — the monorepo IS the state layer.

**Infrastructure:**
- Hosted on Fly.io, uses persistent volumes for git clone
- Multi-channel ingestion: Telegram (real-time), Outlook IMAP (9am + 6pm daily), git-sync cron (15-min)
- Skills architecture: 4 modular skills (monorepo-ingest, email-ingest, git-sync, podplay-briefing)
- Bot commits prefixed `bot:` for clear git history
- Domain tagger: auto-classifies across consulting, family business, personal domains

**What's impressive:** Treating a personal knowledge base as a git-driven system with a Telegram interface is an unusual design choice. The OpenClaw pattern (bot as write interface + git as storage) is genuinely interesting architecture. It's also self-referential: the monorepo being used to build OpenClaw is what OpenClaw manages.

---

### Ralph Loop Pattern + Registry
**Location:** `loops/`, `docs/plans/`
**LinkedIn section:** About / Featured

Generalized agentic loop framework for autonomous research and development. The pattern: any idea becomes a spec via reverse loop analysis, then a CI-driven forward loop builds it stage-by-stage until convergence.

**Pattern components:**
- **Reverse ralph:** Analyzes reference material → extracts formula → outputs specification via frontier-driven iteration
- **Forward ralph:** Builds from spec → stage-by-stage development with convergence criteria
- **Registry:** `_registry.yaml` for loop orchestration, GitHub Actions scheduling, status tracking
- **Convergence detection:** Frontier exhaustion, discovery rate collapse, self-review pass
- **Atomic git history:** Each iteration = one commit, resumable on failure

**Currently active loops:**
- `anime-recap` — building video engine
- `github-profile-reverse` — analyzing and rebuilding GitHub profile
- `linkedin-profile-reverse` — this loop, analyzing LinkedIn profile

**What's impressive:** The ralph loop pattern is the most sophisticated thing in the monorepo. It's a system for converting unstructured ambition into structured deliverables using AI as the execution layer. The design is self-consistent (the pattern is also used to analyze the pattern), convergence-stable, and token-efficient. Any VC or senior engineer who understands agentic development would recognize this immediately.

---

### Life-OS / Monorepo Knowledge Graph
**Location:** `entities/`, `CLAUDE.md`, `dashboards/`
**LinkedIn section:** About (as context for how everything connects)

Entity-first personal knowledge graph where everything — people, places, businesses, trips, meetings, projects, ideas — becomes a typed entity with YAML frontmatter and wikilink relationships. Obsidian vault + Dataview dashboards + automated ingestion.

**Architecture:**
- 8 entity types with standardized schemas
- Multiple write paths: OpenClaw bot (Telegram), email ingestion, git-sync cron
- Dataview queries for at-a-glance dashboards across all domains
- Convergent organization: dumps go to inbox/, automation extracts and categorizes

**What's impressive:** Most people use Notion or Obsidian as a capture dump. This person designed the schema, built the ingestion pipeline, and wrote the automation. The system is also meta-aware (there's a CLAUDE.md that instructs Claude on how to use the repo — meaning the system teaches the AI system how to work within it).

---

## Part 4: Public GitHub Projects (Notable)

### LPRnet-keras — License Plate Recognition
**Repo:** `clsandoval/LPRnet-keras`
**Only starred repo (4 stars)**

License plate recognition (LPR) implemented in Keras. The original and most-noticed public work. 4-year-old project that still gets occasional attention — suggests it filled a genuine gap in available CV implementations at the time.

**LinkedIn framing:** Computer vision work, early ML. Background signal, not foreground.

---

### yolos-lph — YOLO Fine-Tuned for Philippine License Plates
**Repo:** `clsandoval/yolos-lph`

YOLO object detection model fine-tuned specifically on Philippine license plate data. Domain-specific ML adaptation work — shows understanding of transfer learning, dataset annotation, and deployment in constrained environments.

**What's impressive:** Taking a general model and making it work on a specific, underrepresented dataset (Philippine LPs) requires real ML engineering (data collection, annotation pipeline, fine-tuning, validation). Not tutorial-following.

---

### alpha-zero-c4 — AlphaZero for Connect 4
**Repo:** `clsandoval/alpha-zero-c4`

AlphaZero implementation for Connect 4 in PureBasic. The language choice alone is unusual — PureBasic is a compiled, low-level language almost nobody uses for ML. This suggests either performance experimentation or deep dive into the algorithm itself at a level below Python abstraction.

**What's impressive:** Implementing AlphaZero at a low level (not just running the existing codebase) demonstrates genuine algorithmic understanding of MCTS + neural network policy/value heads.

---

### coral_tpu — Edge AI on Google Coral TPU
**Repo:** `clsandoval/coral_tpu`

Inference on Google Coral TPU hardware. Edge AI deployment at the physical level — demonstrates understanding of model quantization, TPU-specific model formats, and hardware-constrained inference.

---

### Slipstream — AI Swim Coach for Endless Pool
**Repo:** `clsandoval/slipstream`
**LinkedIn section:** Featured (personal project, shows range)

Real-time AI coaching system for swim training in endless pools. Python (86.5%) + TypeScript (11.3%). 39 commits, comprehensive design docs including tech spec, user journey, and implementation plan with 9-branch parallel strategy.

**What's impressive:** Applying real-time AI coaching to a niche physical training context (endless pool, not a standard pool environment). The design docs show serious product thinking: user journey, hardware integration, parallel implementation branches.

---

### agent-skills — Skills Library for Claude/Cursor/Copilot
**Repo:** fork of MIT-licensed agent-skills
**Focus:** PyMC + marimo integration

Skills library for AI coding assistants (Claude Code, Cursor, GitHub Copilot) with specific focus on probabilistic programming (PyMC) and reactive notebooks (marimo). Shows deep engagement with the probabilistic programming ecosystem, not surface-level.

---

## Part 5: Implied Skills + Domain Knowledge

Beyond individual projects, the inventory reveals:

**Probabilistic Programming + Bayesian Methods:**
- PyMC Labs affiliation (Decision Orchestrator)
- pymc-extras, pymc-model-interactivity forks (active engagement with ecosystem)
- agent-skills fork focused on PyMC
- pytensor-workshop-demo (likely participated in PyMC workshop)
- This is a deep stack, not surface-level familiarity

**Game AI + Reinforcement Learning:**
- alpha-zero-c4 (AlphaZero from scratch)
- sapai ecosystem (multiple forks: sapai, sapai-gym, super-auto-ai)
- alpha-zero-general fork (base algorithm reference)
- herald-scraper-bot + match-scraper (Dota 2 data pipelines — likely feeding ML analysis)
- Dota coach / Bazaar coach mentioned in project context

**Computer Vision:**
- LPRnet-keras (license plate recognition, Keras/TF)
- yolos-lph (YOLO fine-tuning on domain-specific data)
- coral_tpu (edge inference on Google Coral hardware)
- object-detection-in-keras fork (foundational CV learning)

**Southeast Asia Operator:**
- Philippines operations (venue deployment, Magpie payments, GCash integration)
- Singapore (EDB support, HQ candidacy)
- Thailand (Central Group franchise deal)
- Indonesia (separate arrangement)
- Regional fintech / regulatory awareness (per-country licensing, withholding tax)

**Life Automation Systems:**
- OpenClaw bot (Telegram → git)
- Multi-domain email ingestion (Gmail, Outlook, OAuth, IMAP)
- Calendar sync (Google Calendar, Zoom, Meet)
- Cron orchestration + GitHub Actions CI
- Entity-first knowledge graph (self-designed schema)

---

## Part 6: Chronological Arc (for career narrative)

| Period | Focus | Signals |
|--------|-------|---------|
| **2021** | University ML/CV + coursework | LPRnet-keras, OCaml problem sets, SystemVerilog — learning the fundamentals |
| **2022** | Game AI + edge AI + early infra | AlphaZero C4, SAP game AI ecosystem, Coral TPU, Dota scraping — deep algorithmic exploration |
| **2023** | CV specialization + MLOps | YOLO Philippine plates, tinygrad fork, zenml, herald-scraper — production ML thinking |
| **2024** | Applied AI + RAG + agents | market-viz-agent, RAG-from-scratch, StreamRAG, course tools — applied AI product building |
| **2024-2025** | Private org work begins | Cheerful (Nuts and Bolts AI), Decision Orchestrator (PyMC Labs) — production team-scale engineering |
| **2025** | Life-OS + new products | second-brain, succession-ph, macromap, macromap, academic site cleanup — product diversification |
| **2025-2026** | Southeast Asia operations | Pod Play SEA, Ping Pod franchise, Magpie digital wallet — real-world operator |
| **2026** | Agentic loops + monorepo | Slipstream, monorepo, anime-recap engine, ralph loop pattern, OpenClaw — systems-level automation |

---

## LinkedIn Section Assignment Summary

| Project/System | Section | Priority |
|----------------|---------|----------|
| Decision Orchestrator (PyMC Labs) | Experience | High (production, team-scale, MCP) |
| Cheerful (Nuts and Bolts AI) | Experience | High (full-stack, Temporal, Claude SDK) |
| Pod Play SEA + Digital Wallet | Experience | High (operator, fintech, regional) |
| Ralph Loop Pattern | About / Featured | High (meta-system, impressive concept) |
| Anime Highlight Generator | Featured | High (concrete demo of ralph loop) |
| OpenClaw Bot | About | Medium (signals automation mindset) |
| Monorepo / Life-OS | About | Medium (context for everything else) |
| Slipstream | Featured | Medium (personal project range) |
| LPRnet-keras | Experience or Skills | Low-Medium (dated but has stars) |
| yolos-lph + coral_tpu | Skills / Background | Low (signal CV depth without needing to feature) |
| alpha-zero-c4 | About / Skills | Low (interesting detail, not lead) |
| Bayesian/PyMC ecosystem | Skills | High (differentiator in AI space) |
| Game AI (SAP, AlphaZero) | Skills / Background | Low (interesting detail) |

---

## Critical Observations for Profile Writers

1. **The invisible work is the best work.** Decision Orchestrator (36K LOC, team-scale, custom MCP server) and Cheerful (2,170 files, Temporal, React 19) are completely invisible from public GitHub. The entire public profile shows only the learning phase, not the production phase.

2. **Three distinct identities to reconcile:**
   - **Technical builder** (agentic loops, MCP, Temporal, custom ML)
   - **SEA operator** (franchise distribution, fintech, regional business)
   - **Life-automation engineer** (entity knowledge graph, OpenClaw, ralph loops)
   These are not obviously the same person. The profile needs a through-line.

3. **Probabilistic programming is a differentiator.** Bayesian ML / PyMC expertise is rare in the agent/LLM space. It's not just a skill — it's a worldview about uncertainty and inference. This should be surfaced explicitly, not buried in skills.

4. **The ralph loop is a portfolio piece, not just a project.** The fact that this LinkedIn profile analysis is itself a ralph loop is a concrete demonstration of the concept. The profile could reference this recursively.

5. **The range is the story.** CV → game AI → probabilistic programming → LLM agents → fintech → franchise distribution → life automation. No obvious "lane." The thread is: "I go deep wherever it gets interesting." The profile should lean into this, not apologize for it.
