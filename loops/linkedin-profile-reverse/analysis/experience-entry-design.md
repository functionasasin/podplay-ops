# Experience Entry Design — LinkedIn Profile

**Aspect**: experience-entry-design (Wave 2)
**Analyzed**: 2026-02-23
**Source files**: All Wave 1 analysis (monorepo-project-inventory, cheerful-analysis, decision-orchestrator-analysis, github-profile-cross-ref, linkedin-format-research, reference-profile-scan) + Wave 2 (career-narrative-arc, reference-formula-extraction) + input/publications.md
**Purpose**: Design every LinkedIn experience entry with exact titles, companies, dates, locations, and bullet points — ready to paste

---

## Design Principles (from prior analysis)

1. **Experience Description limit**: 2,000 chars per entry. First 3-4 lines visible before "See more."
2. **Experience Title limit**: 100 chars.
3. **Builder framing**: Active verbs tied to specific outputs, not processes. Ownership is explicit. Numbers are specific and verifiable.
4. **Ordering**: Most recent first. Pod Play SEA leads (the disorienting credential), then the AI infrastructure work.
5. **Technical specificity as proof**: For private repos, specific phrasing ("custom MCP server with scope-based credential gating") is the evidence — you can't fake it without having built it.
6. **The IEEE paper goes in Publications section**, not Experience.
7. **Ralph loops / OpenClaw / Life-OS go in the About section**, not Experience — they're personality + forward motion, not job entries.

---

## Entry Count Decision

**4 entries total:**

| # | Entry | Why it exists separately |
|---|-------|------------------------|
| 1 | Pod Play SEA / Ping Pod | Current operator role. Most disorienting credential. Leads profile. |
| 2 | PyMC Labs — Decision Orchestrator | Primary AI infrastructure role. Institutional credibility (PyMC brand). |
| 3 | Nuts and Bolts AI — Cheerful | Full-stack product engineering. Different domain, same architectural DNA. |
| 4 | Independent — ML/CV Research + Early Projects | Anchors the origin story. IEEE paper connection. Keeps the "started from research" narrative visible. |

**Why NOT more entries:**
- Ralph loops, OpenClaw, anime engine → About section (personality, forward motion). Creating separate experience entries for personal automation projects reads as padding.
- Digital wallet → Bundle with Pod Play SEA (it's the same operation, same context).
- Ping Pod franchise → Bundle with Pod Play SEA (operationally inseparable — Ping Pod requires Pod Play software).
- Slipstream, Bazaar Coach → Featured section links, not Experience. They're showcase personal projects, not roles.

**Why NOT fewer entries:**
- Separating PyMC Labs and Nuts and Bolts AI is important because they're different organizations with different products. Bundling them would obscure the fact that this person builds production platforms for multiple teams, not one.
- The early ML/CV entry anchors the research origin and connects to the IEEE paper. Without it, the profile starts at "2024" and looks like someone who appeared out of nowhere.

---

## Entry 1: Pod Play SEA / Ping Pod

**Title**: Head of Southeast Asia Distribution
**Company**: Pod Play / Ping Pod
**Date range**: 2025 – Present
**Location**: Manila, Philippines (or "Philippines · Southeast Asia")

### Description (first paragraph — visible before "See more")

Master distributor for Pod Play (venue booking platform) and Ping Pod (table tennis franchise) across Southeast Asia — Philippines, Singapore, Thailand, Indonesia. Building the technical infrastructure, payment systems, and franchise deals simultaneously.

### Bullet points

- Secured master distribution rights across 4 countries; structuring franchise deals including Central Group (Thailand) — one of Asia's largest conglomerates
- Architected digital wallet / stored-value payment platform with Magpie (Philippine fintech partner): GCash + credit card support, Stripe Payment Elements, float economics at scale
- Deploying hybrid cloud + on-premises venue infrastructure: cloud admin APIs + local Mac Mini relay nodes with cameras and iPads per venue
- Designed revenue model architecture: 70/30 upcharge split, cross-venue credit ecosystem, per-country regulatory compliance (withholding tax, fintech licensing)
- First venue (Tela Park, Las Piñas) in active deployment; hardware/integration training at Ping Pod HQ (Jersey City, NJ) scheduled March 2026

### Character count check

Opening paragraph: ~285 chars ✓ (fits in "See more" preview)
Full description with bullets: ~920 chars ✓ (well under 2,000 limit)

### What this entry signals

To a **technical builder**: "This person deploys to physical hardware with payment integration — not just SaaS."
To an **investor/operator**: "This person runs real franchise operations with real conglomerate partners across multiple countries."
To **both**: The cognitive dissonance. This appears first, ABOVE the AI infrastructure entries. The reader expects a tech profile; they see franchise distribution. Then they scroll down and see 36K LOC codebases. That ordering is deliberate.

### What to emphasize
- Central Group deal (verifiable, impressive partner)
- "4 countries" (scale)
- Digital wallet + Magpie (fintech depth)
- Hybrid cloud + on-premises (technical credibility in operator context)

### What to leave out
- Specific revenue projections or financial terms (NDA territory)
- Pod Play vs Ping Pod relationship details (confusing to outsiders — keep it simple)
- Detailed Stripe iteration history (plumbing)

---

## Entry 2: PyMC Labs — Decision Orchestrator

**Title**: AI Infrastructure Engineer
**Company**: PyMC Labs
**Date range**: 2024 – Present
**Location**: Remote

### Description (first paragraph — visible before "See more")

Core engineer on Decision Orchestrator — a Discord-based organizational OS that coordinates AI agents and workflows for teams through intelligent message routing, dynamic tool assembly, and a custom MCP tool server built at the protocol level.

### Bullet points

- Architected custom MCP tool server with context injection and scope-based credential gating — protocol-level implementation, not a FastMCP wrapper
- Built workflow-as-data orchestration engine: database-driven workflows scoped per Discord server/channel with intelligent classifier-based routing
- Implemented thread session persistence across Claude Agent SDK, Langfuse observability, and Supabase — sessions survive crashes, enable full audit trails
- Integrated 50+ external services (Toggl, Xero, Google Workspace, GitHub, Fly.io) via Composio for end-to-end team operations
- 420+ commits as core maintainer; ~36K LOC across 285 Python files; FCIS (Functional Core, Imperative Shell) architecture

### Character count check

Opening paragraph: ~273 chars ✓ (fits in "See more" preview)
Full description with bullets: ~870 chars ✓ (under 2,000 limit)

### What this entry signals

To a **technical builder**: "Custom MCP server at the protocol level" is a frontier signal. Most people consume MCP tools; building the server with credential scoping is rare. The 36K LOC and FCIS callout signals someone who thinks about architecture, not just shipping.
To an **investor**: "PyMC Labs" is a recognized brand in statistical computing. The combination of Bayesian org + agent infrastructure is unusual and investable.
To **everyone**: The specificity is the proof. "Scope-based credential gating" and "FCIS architecture" can't be written by someone who didn't build this.

### What to emphasize
1. **Custom MCP server** — the headline tech signal. This is frontier work.
2. **PyMC Labs** — the institutional credibility anchor.
3. **36K LOC, 420+ commits** — scale proof. Not a toy.
4. **FCIS architecture** — design discipline.
5. **Workflow-as-data** — product thinking beyond engineering.

### What to leave out
- Specific Discord server names or team details (privacy)
- Composio implementation details (it's a dependency)
- Supabase schema specifics
- Contributor rankings vs teammates

---

## Entry 3: Nuts and Bolts AI — Cheerful

**Title**: Full-Stack AI Engineer
**Company**: Nuts and Bolts AI
**Date range**: 2024 – Present
**Location**: Remote

### Description (first paragraph — visible before "See more")

Core engineer on Cheerful — an AI-native influencer marketing platform that finds creators, drafts personalized outreach via Claude, and executes campaigns through Gmail at scale. Three distinct applications: FastAPI backend, Next.js/React 19 webapp, and Slack-based Context Engine.

### Bullet points

- Built 3-app product architecture (backend API, campaign webapp, Slack Context Engine) with 4 other engineers; 580+ commits as 2nd largest contributor
- Architected campaign execution on Temporal.io durable workflows — crash-resilient pipelines with intelligent retry, saga patterns, and state persistence
- Implemented AI-personalized email drafting via Claude Agent SDK — each email individually crafted per creator profile, not template-filled
- Built Slack Context Engine with custom MCP tool orchestration and Onyx RAG for team operations and knowledge retrieval
- Frontend on React 19 + Next.js 16 with TanStack Query, Zustand, shadcn/ui — bleeding-edge stack shipped to production

### Character count check

Opening paragraph: ~303 chars (slightly over mobile truncation — still works for desktop "See more")
Full description with bullets: ~900 chars ✓ (under 2,000 limit)

### What this entry signals

To a **technical builder**: Temporal.io is a serious production choice (Stripe/Netflix-tier workflow orchestration). React 19 in production is bleeding-edge. Three apps in one product = full-stack range beyond "I do backend."
To an **operator/business person**: "Influencer marketing platform" connects to a $21B+ industry. Real product, real market.
To **investors**: Combined with Entry 2, the pattern is clear — this person builds production AI orchestration platforms. Different domains (marketing vs organizational ops), same architectural DNA (Claude SDK + MCP + Supabase + Langfuse).

### What to emphasize
1. **Temporal.io durable workflows** — differentiation signal. Very few engineers at any level use Temporal in production.
2. **3 apps, 1 product** — architectural range.
3. **Claude Agent SDK + MCP** — connects to Decision Orchestrator entry, establishing consistent platform thesis.
4. **580 commits, 2nd contributor / 5-person team** — velocity + ownership.
5. **React 19 + Next.js 16** — frontend isn't an afterthought.

### What to leave out
- Campaign metrics, creator counts, email volumes (NDA / private company)
- Specific client or brand names
- Composio dependency details
- Internal team dynamics

---

## Entry 4: Independent — ML/CV Research + Early Projects

**Title**: ML/CV Researcher & Engineer
**Company**: Independent
**Date range**: 2021 – 2024
**Location**: Philippines

### Description (first paragraph — visible before "See more")

Computer vision research and applied ML, from university through independent work. Built end-to-end license plate recognition pipeline: detection (YOLO fine-tuned on Philippine plates), recognition (custom CNN in Keras), and edge deployment (Google Coral TPU). Co-authored IEEE paper at TENCON 2022.

### Bullet points

- Co-authored "Enhancing Real-Time License Plate Recognition Through Edge-Cloud Computing" — presented at IEEE TENCON 2022 (Hong Kong)
- Built LPRnet-keras: Keras implementation of license plate recognition — most-starred public repo; filled a gap in available CV implementations
- Fine-tuned YOLO on Philippine license plate dataset (yolos-lph) — real-world domain-specific model adaptation, not tutorial work
- Deployed inference on Google Coral TPU: model quantization, hardware-constrained execution, edge-cloud pipeline architecture
- Implemented AlphaZero for Connect 4 from scratch in PureBasic — full MCTS + neural network policy/value heads at a level below Python abstractions

### Character count check

Opening paragraph: ~298 chars ✓ (fits in "See more" preview)
Full description with bullets: ~830 chars ✓ (under 2,000 limit)

### What this entry signals

To a **technical builder**: The CV pipeline is end-to-end (detect → recognize → deploy to edge hardware). The Coral TPU deployment shows you understand model quantization and physical hardware constraints. AlphaZero in PureBasic shows algorithmic depth beyond "I use PyTorch."
To **anyone reading the arc**: This is the origin. Published research → production platforms → franchise operator. The trajectory makes sense when you see where it started.

### What to emphasize
1. **IEEE TENCON 2022** — peer-reviewed, international conference. Academic rigor credential.
2. **End-to-end pipeline** — not three separate repos; one coherent system from camera to edge.
3. **Philippine license plates** — real-world, underrepresented dataset. Not MNIST/CIFAR.
4. **Coral TPU** — hardware deployment is rare among ML engineers.
5. **AlphaZero from scratch** — algorithmic depth, not library usage.

### What to leave out
- University name or coursework details (unless clsandoval wants to add Education section separately)
- RAG-from-scratch, StreamRAG, market-viz-agent (transitional work, not distinctive enough for a bullet)
- Super Auto Pets / Dota scrapers (interesting but diluting for this entry)
- Fork activity (noise)

---

## Bundling Decisions — Full Rationale

### What was bundled INTO existing entries:

| Item | Bundled into | Rationale |
|------|-------------|-----------|
| Digital Wallet | Pod Play SEA (Entry 1) | Same operation, same business context. Separate entry would over-fragment. |
| Ping Pod franchise | Pod Play SEA (Entry 1) | Operationally inseparable — Ping Pod requires Pod Play software. |
| AlphaZero / game AI | Independent (Entry 4) | Shows algorithmic depth without needing its own entry. One bullet. |
| Coral TPU edge deployment | Independent (Entry 4) | Part of the CV pipeline narrative. One bullet. |

### What was kept OUT of Experience entirely:

| Item | Where it goes instead | Rationale |
|------|----------------------|-----------|
| Ralph loops framework | About section | Too meta for a job entry. Works as "forward motion" signal in About. |
| OpenClaw bot | About section | Personal automation. Personality layer, not professional entry. |
| Anime Highlight Generator | Featured section (link) | Concrete demo of ralph loop pattern. Best as a Featured link. |
| Slipstream (swim coach) | Featured section (link) | Personal project showing range. Not an employment entry. |
| Bazaar Coach / Dota work | Omit or skills | Too niche to warrant mention. Game AI covered by AlphaZero bullet. |
| Monorepo / Life-OS | About section | Meta-system that contextualizes everything. Personality, not role. |
| agent-skills fork | Skills section | Contributes to PyMC ecosystem depth signal. |

---

## How the Entries Work Together

Reading top-to-bottom, the experience section tells this story:

**Entry 1 (Pod Play SEA)**: "Wait — this person runs a franchise across 4 countries with a Central Group deal? And there's a digital wallet?"

↓ Cognitive dissonance — the reader expected a tech profile ↓

**Entry 2 (PyMC Labs)**: "Oh — they ALSO build production AI infrastructure. Custom MCP server. 36K LOC. For a Bayesian AI consulting firm."

↓ Now the reader is trying to reconcile the operator and the builder ↓

**Entry 3 (Nuts and Bolts AI)**: "AND a separate full-stack SaaS platform? Temporal.io? React 19? 3 apps? Same architectural DNA as Entry 2?"

↓ Pattern recognition: this is a platform builder, not a one-project person ↓

**Entry 4 (Independent / ML-CV)**: "Started with published IEEE research and edge hardware deployment. OK — the whole arc makes sense now. Research → production → operations."

The ordering is designed to maximize the "dangerous" impression: start with the disorienting credential, then reveal the technical depth, then show the breadth, then ground it in the research origin.

---

## Parallel Timeline Note

Entries 1, 2, and 3 overlap chronologically (all 2024/2025–present). This is intentional and accurate. LinkedIn displays overlapping entries with a small visual cue. The overlap itself signals high output — this person runs 3 substantial projects simultaneously.

---

## Cross-Reference with Other Sections

| LinkedIn Section | Content Source | Entry that connects |
|-----------------|---------------|-------------------|
| Publications | IEEE TENCON 2022 paper | Entry 4 (mentions it as a bullet) |
| Featured | Anime engine repo, IEEE paper, LPRnet-keras, Slipstream | Entry 4 (origin), About (forward motion) |
| About | Ralph loops, OpenClaw, Life-OS, through-line narrative | All entries (About provides the thread that connects them) |
| Skills | Python, TypeScript, React, FastAPI, Temporal.io, MCP, Claude SDK, PyMC, Bayesian ML, Computer Vision, Edge Computing, Franchise Operations | All entries |

---

## Alternative Titles Considered (and why rejected)

### Pod Play SEA
- "Co-founder" → implies equity position that may not be accurate
- "CEO" → too corporate for builder profile
- "Managing Director" → corporate
- **"Head of Southeast Asia Distribution"** ✓ — specific, operational, implies scope without overclaiming

### PyMC Labs
- "Software Engineer" → too generic, doesn't signal agent infrastructure
- "AI Agent Infrastructure Engineer" → accurate but 37 chars — viable
- "AI Engineer" → too broad
- **"AI Infrastructure Engineer"** ✓ — clean, accurate, searchable. The "agent" specificity lives in the bullets.

### Nuts and Bolts AI
- "Software Engineer" → generic
- "AI Platform Engineer" → accurate but less searchable
- "Core Engineer" → too vague
- **"Full-Stack AI Engineer"** ✓ — combines full-stack range + AI domain. The "full-stack" qualifier is earned (3 apps: backend, frontend, Slack bot).

### Independent
- "Freelance ML Engineer" → implies for-hire, not builder
- "Researcher" → too narrow
- **"ML/CV Researcher & Engineer"** ✓ — covers both the published research and the engineering implementation. The "&" signals both identities.

---

## Experience Descriptions — Character Count Summary

| Entry | Opening paragraph | Full with bullets | Under 2,000 limit? |
|-------|------------------|-------------------|---------------------|
| Pod Play SEA | ~285 chars | ~920 chars | ✓ |
| PyMC Labs | ~273 chars | ~870 chars | ✓ |
| Nuts and Bolts AI | ~303 chars | ~900 chars | ✓ |
| Independent / ML-CV | ~298 chars | ~830 chars | ✓ |

All entries are well under the 2,000 char limit, leaving room for expansion if needed during the spec-writing phase. The opening paragraphs all fit within the ~300 char "See more" preview window.

---

## Key Decision for identity-synthesis

The experience entries establish **depth per domain**. The About section must establish **the thread that connects them**. Without the About, these 4 entries look like 4 different people. With the About's through-line narrative (same pipeline architecture across every domain), they look like one dangerous person.
