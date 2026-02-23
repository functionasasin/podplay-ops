# Career Narrative Arc — clsandoval

**Aspect**: career-narrative-arc (Wave 2)
**Analyzed**: 2026-02-23
**Source files**: monorepo-project-inventory.md, cheerful-analysis.md, decision-orchestrator-analysis.md, input/publications.md, github-profile-cross-ref.md, reference-formula-extraction.md
**Purpose**: Map the chronological arc, identify the narrative through-line, and determine how to frame each chapter on LinkedIn

---

## The Full Arc (Chronological)

### Phase 1: CV Research + Hardware Edge (2021–2022)

**What happened:**
- University ML/CV coursework → custom Keras implementations (LPRnet-keras, 4 stars — the earliest public proof)
- Domain-specific model fine-tuning: YOLO adapted for Philippine license plates (yolos-lph) — real-world data, not CIFAR
- Edge deployment on Google Coral TPU (coral_tpu) — model quantization, hardware-constrained inference, the physical layer
- Co-authored IEEE TENCON 2022 paper: "Enhancing Real-Time License Plate Recognition Through Edge-Cloud Computing" (Hong Kong, Nov 2022)

**The IEEE paper as the arc's origin point:**
The paper is titled *Edge-Cloud Computing*. This is not incidental. It describes a pipeline: capture at the edge → process in the cloud → return results. The edge device (Coral TPU) handles real-time detection; the cloud handles recognition and logging. It's a detect → classify → route → execute pipeline — the same architecture that appears in every project that follows.

The paper also establishes a worldview: latency matters, hardware matters, the physical and digital layers need to be designed together. This is not a pure software engineer. It's someone who shipped to hardware from the beginning.

**Narrative value:**
- "I started in computer vision — specifically real-world license plate recognition pipelines that had to work on embedded hardware."
- The IEEE paper is the single cleanest credential for academic rigor. It was peer-reviewed, presented internationally, and the code lives in public repos.
- Frame this not as "I did ML research" but as "I built an end-to-end pipeline from camera → detection → recognition → edge deployment → cloud aggregation — then published it."

---

### Phase 2: Algorithmic Depth — Game AI + Reinforcement Learning (2022–2023)

**What happened:**
- AlphaZero for Connect 4 in PureBasic (alpha-zero-c4) — full MCTS + neural network policy/value heads, implemented from scratch in an unusual language
- Super Auto Pets AI ecosystem (sapai forks + sapai-gym) — applying RL to a card/creature game
- Dota 2 data scrapers (herald-scraper-bot, match-scraper) — building data pipelines feeding ML analysis

**What this phase says:**
After the CV pipeline shipped and published, the interest moved from perception (what is this?) to decision-making (what should I do?). AlphaZero is specifically about *policy* — given a game state, what move maximizes expected value? This is the Bayesian/probabilistic worldview beginning to emerge: not just "classify inputs" but "make optimal decisions under uncertainty."

The PureBasic language choice for AlphaZero is worth noting. This is not "I ran the tutorial." PureBasic is a compiled, low-level language with almost no ML ecosystem. Implementing AlphaZero here means implementing the algorithm, not using a framework.

**Narrative value:**
- This phase doesn't need prominent LinkedIn placement — it's background that explains the probabilistic worldview
- The thread: Phase 1 asks "what is this?" (classification). Phase 2 asks "what do I do with it?" (decision-making). This leads directly to PyMC Labs.
- Good for an About section clause: "game AI and reinforcement learning" as context for the decision-intelligence worldview

---

### Phase 3: Applied AI + Production Transition (2023–2024)

**What happened:**
- RAG from scratch, StreamRAG, market-viz-agent — building applied AI systems, not just studying algorithms
- zenml fork, tinygrad fork — production MLOps thinking, and going below-framework (tinygrad = ML without PyTorch)
- Academic website cleanup (succession-ph) — signals transition from student identity to professional identity
- The private org work (Decision Orchestrator, Cheerful) begins — this is where the career goes private

**The transition:**
This is the bridge phase. The pattern moves from algorithms → products. From "can I implement this?" to "can I ship this in production?" The RAG work and market-viz-agent show applied product thinking (not just model training). The zenml and tinygrad forks show both production MLOps discipline and low-level curiosity maintained simultaneously.

**Narrative value:**
- This phase mostly implies. It doesn't need its own LinkedIn section.
- The important inflection: "from research → production" is often framed in profiles as a resume gap. Here it's better framed as the natural progression: "the CV pipeline was the research phase; when I understood the fundamentals, I moved to team-scale production systems."

---

### Phase 4: Production AI Orchestration — PyMC Labs + Nuts and Bolts AI (2024–present)

**What happened:**

**Decision Orchestrator (PyMC Labs):**
- Discord-based organizational OS for AI agent coordination
- 420 commits, ~36K LOC, custom MCP tool server (protocol-level, not FastMCP wrapper)
- FCIS architecture, workflow-as-data, scope-based credential gating
- Multi-platform integrations: Toggl, Xero, Google Workspace, GitHub, Fly.io
- Built inside one of the most respected orgs in probabilistic programming (PyMC)

**Cheerful (Nuts and Bolts AI):**
- Full-stack influencer marketing platform: creator search → AI-personalized email drafting → Gmail at scale
- 580 commits, 3 apps (FastAPI backend + Next.js/React 19 webapp + Slack Context Engine)
- Temporal.io durable workflows — crash-resilient campaign pipelines
- MCP tool orchestration in the Slack bot (again: building MCP, not consuming it)

**The pattern that emerges across both:**
Both platforms are the same architecture in different domains:
- **Input**: Discord message (DO) / Creator list (Cheerful)
- **Classify**: Intent routing (DO) / Campaign type (Cheerful)
- **Route**: Workflow selection + tool assembly (DO) / Temporal workflow execution (Cheerful)
- **Execute**: Claude agents + multi-service integrations (both)
- **Persist**: Supabase + Langfuse (both)

This is the CV/edge pipeline pattern, scaled to production team infrastructure.

**The probabilistic worldview connection:**
PyMC Labs is not a random employer. It's the product arm of the PyMC project — Bayesian statistics, probabilistic programming, uncertainty quantification. Building an *organizational OS* for a team of probabilistic programming experts means the system's requirements are set by people who think formally about uncertainty and decision-making. The Decision Orchestrator doesn't just route tasks — it makes decisions about which workflow to invoke, which tools to assemble. It's applying decision theory at the infrastructure level.

**Narrative value:**
- These are the two primary LinkedIn experience entries. They're production-grade, team-scale, with real architectural decisions.
- The institutional names (PyMC Labs, Nuts and Bolts AI) are verifiable and give the work credibility that "side project" doesn't.
- Key framing: **"Production AI orchestration infrastructure — different domains, same architectural DNA."**
- The probabilistic connection lifts this above "I work with AI" to "I bring a specific worldview (Bayesian reasoning + decision theory) to agent infrastructure."

---

### Phase 5: Southeast Asia Operator (2025–present)

**What happened:**
- Master distribution + franchise rights for Pod Play (booking software) and Ping Pod (table tennis venues) across Southeast Asia
- Philippines first (Tela Park, Las Piñas — installation in progress)
- Singapore EDB support for regional HQ candidacy
- Thailand: Central Group deal (one of Asia's largest conglomerates) for Thailand master franchisee
- Indonesia: separate arrangement
- Digital wallet: stored-value platform built on Stripe + Magpie (Philippine fintech licensed partner); GCash + credit card support; float economics at scale
- Training trip: Jersey City NJ, March 2026 for hardware/integration training

**The pivot:**
This is the most disorienting chapter in the arc. By 2024-2025, the profile already shows: ML research → game AI → production AI platforms at two respected orgs. Then, simultaneously: franchise distribution across 4 countries + fintech payments infrastructure.

Most engineers who do impressive technical work never operate a business. Most operators who build regional franchise networks don't build custom MCP servers. The combination is the cognitive dissonance the reference-formula-extraction identified as the "dangerous" element.

**The technical continuity:**
The Pod Play SEA work is not a departure from the technical arc — it's the arc applied to a new domain. The venue deployment involves:
- Hybrid cloud + on-premises architecture (Mac Mini relay nodes with cameras/iPads at each venue)
- Payment integration (Magpie → GCash → digital wallet → Stripe)
- Revenue model architecture (70/30 splits, withholding tax planning, float economics)
- Regional franchise deal structuring (country fees, per-store fees, conglomerate partners)

This is not "I helped a friend's business." This is: spec the architecture → build the financial model → negotiate the franchise deal → deploy the hardware → integrate the payments.

**Narrative value:**
- This is the "disorienting credential" — the one that makes the reader pause and re-read
- Frame as: operator + technologist simultaneously, not sequentially
- The Central Group deal is the verifiable depth anchor: Central Group is one of the 5 largest conglomerates in Asia. A technical builder structuring a franchise deal with them is not a normal resume entry.
- The digital wallet shows fintech thinking: regulatory awareness, float economics, Stripe iteration (at UI iteration 3 = production friction has been encountered and solved)

---

### Phase 6: Systems That Build Systems (2026–present)

**What happened:**
- Ralph loop framework: generalized agentic loop pattern running in GitHub Actions CI
  - Reverse loop: analysis agents run until frontier exhaustion, produce spec
  - Forward loop: development agents run until convergence, commit code
  - Registry: _registry.yaml for loop orchestration, scheduling, status tracking
  - Currently active: anime-recap engine, github-profile-reverse, linkedin-profile-reverse (this loop)
- OpenClaw bot: Telegram → entity extraction → auto-commit to git monorepo (always-on Fly.io)
- Anime Highlight Generator: autonomous video engine being built by a ralph loop (CI runs Claude Code, which writes and commits the next stage)
- Monorepo / Life-OS: entity-first knowledge graph with 8 entity types, Dataview dashboards, multi-path automated ingestion

**The meta-arc:**
This is the arc's destination (so far). The pattern that began with "build a pipeline for license plate recognition" has now abstracted to "build pipelines that build pipelines." The ralph loop framework is a convergent development system — CI runs analysis agents that produce specs, then runs development agents that implement specs stage-by-stage until convergence. The human writes the initial spec; everything after is autonomous.

This is genuinely unusual. Most people who work with LLMs use them for assistance (autocomplete, Q&A). This is using them as the execution layer of an autonomous development system. The distinction is not semantic — it changes what gets built and how fast.

**Narrative value:**
- This phase is the "forward motion" signal — shows the person is still actively building, not having built
- The ralph loop pattern is hard to explain briefly but the concrete example makes it immediate: "I'm running a CI job right now that analyzes reference videos, extracts formulas, and is autonomously building a video engine — without me watching"
- The anime recap engine is the perfect Featured section link: it's weird, specific, demonstrates the whole pattern concretely
- The monorepo / OpenClaw / Life-OS is best woven into About section voice (personality layer), not a standalone experience entry

---

## The Through-Line

Across all six phases, one pattern:

**Every domain is an instance of the same architecture:**

```
INPUT → DETECT/CLASSIFY → ROUTE → EXECUTE → PERSIST
```

| Domain | Input | Detect/Classify | Route | Execute | Persist |
|--------|-------|-----------------|-------|---------|---------|
| License plate CV | Camera frame | YOLO detect → LPRnet recognize | Edge vs cloud | Output license data | Database |
| Game AI (AlphaZero) | Game state | MCTS + policy network | Best move selection | Self-play execution | Replay buffer |
| Decision Orchestrator | Discord message | Intent classifier | Workflow selection | Claude + MCP tools | Supabase + Langfuse |
| Cheerful | Creator list | Profile enrichment pipeline | Campaign workflow | Gmail + Claude drafting | Supabase + Langfuse |
| Pod Play SEA | Venue booking | Payment routing | GCash / card / wallet | Transaction execute | Magpie + Stripe |
| Ralph loops | Reference material | Aspect analysis | Frontier selection | Agent builds artifact | Git commit |
| OpenClaw | Telegram message | Entity extraction | Domain tagger | Entity file commit | Git monorepo |
| Life-OS | Inbox dump | Claude classification | Entity matching | File write | Obsidian / YAML |

The range is real, but it's not random. Every domain applies the same systems-thinking: specify the input, build the detection layer, design the routing logic, implement the execution pipeline, persist the output. The domains vary. The shape of the solution doesn't.

**One sentence:**
> "Systems architect who applies the same pipeline thinking — spec first, route intelligently, execute autonomously — to every domain they enter."

**The short version (for About section hook):**
> "I build autonomous pipelines. Earlier: computer vision on embedded hardware. Then: AI orchestration infrastructure for teams. Now: CI agents that build the next pipeline while I sleep."

---

## The Narrative Thread That Connects Everything

### Thread 1: From Perception to Decision to Autonomy

Phase 1 (CV): "What is this?" — perception/classification problems
Phase 2 (Game AI): "What should I do?" — decision-making under uncertainty
Phase 3 (Applied AI): "How do I ship this?" — production system thinking
Phase 4 (DO + Cheerful): "How do I orchestrate multiple agents + tools?" — multi-agent coordination
Phase 5 (SEA ops): "How do I apply all of this to a real business?" — full-stack operator
Phase 6 (Ralph loops): "How do I make the system build itself?" — autonomy as the meta-layer

This is a coherent intellectual journey. Not scattered. An arc. Each phase asks the harder question implied by the previous answer.

### Thread 2: Probabilistic Worldview Running Underneath

The PyMC Labs affiliation is not an employer coincidence. Bayesian reasoning (prior beliefs + evidence → posterior inference → optimal decision) is the worldview that connects CV (probabilistic object detection), game AI (MCTS + value estimation), and agent orchestration (workflow routing as probabilistic intent classification).

The probabilistic worldview shows up everywhere without being labeled:
- LPR pipeline: confidence thresholds and edge-cloud routing based on confidence
- AlphaZero: value network predicts expected game outcomes (probabilistic evaluation)
- Decision Orchestrator: intent classifier routes based on probability distribution over workflows
- Digital wallet: float economics are expected value calculations

**For LinkedIn:** The PyMC Labs affiliation is the depth anchor. "I work in the probabilistic programming ecosystem" implies the worldview without requiring a statistics lecture in the About section.

### Thread 3: Shipped to Hardware, Ran in Production, Negotiated with Conglomerates

Most ML engineers stay in Jupyter notebooks. Some ship to production software. Fewer deploy to physical hardware. Very few also negotiate franchise deals with Asia's largest conglomerates.

The arc doesn't show generalism — it shows escalating stakes. Each phase went real-er:
- Research paper → academic peer review → Hong Kong conference
- Production AI platform → team-scale → 36K LOC Python codebase
- Edge hardware deployment → Coral TPU → physical venue installations
- Regional business → franchise distribution → Central Group Thailand deal

**For LinkedIn:** This is the "dangerous" element. Not that the person is an expert in everything — that the stakes have been real at every level.

---

## Approximate Timeline (for LinkedIn Date Ranges)

| Period | Activity | Certainty |
|--------|----------|-----------|
| 2021-2022 | CV/ML work, University | High (repos dated, paper Nov 2022) |
| Nov 2022 | IEEE TENCON paper presented | Exact date known |
| 2022-2023 | Game AI exploration, algorithmic depth | Medium (repo dates) |
| 2023-2024 | Applied AI transition, RAG/agents | Medium (repo dates) |
| Mid 2024 | Nuts and Bolts AI / Cheerful begins | Medium (org created May 2024) |
| 2024 | PyMC Labs / Decision Orchestrator | Medium (active engagement 2024+) |
| Late 2024/2025 | Pod Play SEA operations begin | Medium (entities show 2025 activity) |
| 2025-2026 | Digital wallet, Central Group deal, Magpie | High (entities have 2025-2026 dates) |
| 2026 | Ralph loops, anime-recap, OpenClaw, monorepo | High (commit timestamps) |

**For LinkedIn:** Show months where known; use years where not. The experience entries that matter most (DO, Cheerful, Pod Play SEA) all have approximate start dates available. Don't invent precision — "2024 – Present" is fine.

---

## Which Chapters Become LinkedIn Experience Entries

| Chapter | LinkedIn treatment |
|---------|--------------------|
| IEEE TENCON + CV pipeline | Education section OR Publications section OR single bullet in experience; NOT a separate experience entry (pre-professional) |
| Game AI / Algorithmic work | Background in About section only; not an experience entry |
| Decision Orchestrator — PyMC Labs | **Primary experience entry #1**: "AI Infrastructure Engineer, PyMC Labs" |
| Cheerful — Nuts and Bolts AI | **Primary experience entry #2**: "Full-Stack AI Engineer, Nuts and Bolts AI" |
| Pod Play SEA + Digital Wallet + Ping Pod | **Primary experience entry #3**: "Head of Southeast Asia Distribution / Operator, Pod Play" or similar |
| Ralph loops + OpenClaw + Life-OS | **About section** (personality layer + forward motion signal); optionally a "Personal Projects" or "Independent" entry |
| Slipstream + Bazaar Coach | Featured section links only; not experience entries |

**Order on LinkedIn** (most recent first):
1. Pod Play SEA / Ping Pod (current, 2025–present) — shows operator + technologist simultaneously
2. Decision Orchestrator / PyMC Labs (2024–present) — agent infrastructure + probabilistic worldview
3. Cheerful / Nuts and Bolts AI (2024–present) — full-stack AI product engineering
4. IEEE TENCON 2022 + CV pipeline — publication + research origin story (Education or Publications, not Experience)

---

## The Narrative Sentence for Every Section

**Headline (the disorienting combination):**
> "Building autonomous AI systems and running a franchise distribution network across Southeast Asia — simultaneously."

**About section hook (first 2 lines):**
> "I build autonomous pipelines. The most recent ones don't need me to run — CI agents analyze reference material, write specs, and build the next system every 30 minutes."

**The thread sentence (About section, block 3):**
> "The same architecture shows up everywhere I work: classify the input, select the right workflow, route to the right tools, execute to completion, persist the result. I've applied this to license plate recognition, organizational AI infrastructure, email automation platforms, and franchise distribution across Southeast Asia."

**Forward motion signal (About section, block 5):**
> "Right now: a CI pipeline is autonomously building a video engine — analyzing reference footage, extracting the formula, building stage by stage. I'll ship it when it converges."

---

## Key Decisions for experience-entry-design

1. **Don't separate Cheerful and Decision Orchestrator chronologically.** They overlap. Run them as parallel experience entries (2024–present for both).

2. **Pod Play SEA is the lead experience, not the punchline.** It's the most disorienting — put it first (most recent). The reader sees "SEA franchise distribution" and thinks "why is this in the middle?" Then sees the AI infrastructure below it. That ordering creates the intended cognitive dissonance.

3. **The IEEE paper goes in the Education or Publications section**, not experience. University context makes the research legible. An "experience" entry for a co-authored paper reads as padded.

4. **Ralph loops becomes a compact "Independent Projects" entry or woven into the About**. It's too novel to leave out entirely, but too meta to be a first-read experience entry. It works best as the "what I'm building now" signal in About, with an optional single-line independent entry for context.

5. **The through-line goes in the About section**, not in any individual experience entry. Experience entries prove depth. The About section proves pattern. Both are required.
