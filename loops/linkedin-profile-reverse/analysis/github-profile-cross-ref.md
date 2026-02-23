# GitHub Profile Cross-Reference — clsandoval

**Aspect**: github-profile-cross-ref (Wave 1)
**Analyzed**: 2026-02-23
**Source**: `../../loops/github-profile-reverse/analysis/` — 6 files read
**Files read**: profile-snapshot.md, repo-inventory.md, repo-clustering.md, signal-vs-noise.md, monorepo-deep-scan.md, repo-readme-scan.md (5 read directly; repo-readme-scan absent from reads but referenced in clustering)

---

## Summary

The github-profile-reverse loop (4 of 12 aspects analyzed as of 2026-02-23) has produced high-quality thematic clustering, signal/noise scoring, and a deep monorepo audit. The core finding: **the GitHub profile currently projects "student who forks things" but the actual work is "builder of dangerous autonomous systems across 5 domains."** The delta is enormous. Everything that matters is invisible. LinkedIn faces the same problem with extra stakes — LinkedIn is where investors, operators, and collaborators find you, and it has been untouched for 3 years.

---

## Thematic Clusters (for LinkedIn Experience + About framing)

The 32 repos + monorepo internals + 2 private org products cluster into 8 groups. Only 5 matter for LinkedIn:

### Cluster 1: Autonomous Agent Infrastructure — **PRIMARY IDENTITY**

| What exists | Where |
|-------------|-------|
| Ralph loops: frontier-driven analysis + dev agents running in CI every 30 min | monorepo (public) |
| OpenClaw Telegram bot: entity extraction → auto-commit to git | monorepo (public) |
| Decision Orchestrator: Discord-based org OS, Claude Agent SDK, custom MCP server, 420 commits, 36K LOC | pymc-labs org (private) |
| Cheerful: email automation SaaS, Claude Agent SDK, Temporal.io, 580 commits, 13K LOC | nuts-and-bolts-ai org (private) |
| Anime recap engine: autonomous spec generation from video analysis | monorepo (public) |

**LinkedIn implications:**
- This cluster is the career headline, not a bullet point
- The two private org repos have 1,000+ combined commits — production-grade work that must be surfaced explicitly in experience entries
- Ralph loops is genuinely novel: "a generalized framework where analysis agents produce specs and building agents execute them, running every 30 minutes unattended"
- "Agent infrastructure" is more specific and impressive than "AI engineering"

### Cluster 2: Computer Vision Pipeline — **SHOWCASE PROJECT**

| What exists | Where |
|-------------|-------|
| YOLO fine-tuned on Philippine license plates | yolos-lph (public) |
| LPRnet-keras: license plate recognition, 4 stars, published paper citation | LPRnet-keras (public) |
| Google Coral TPU edge deployment | coral_tpu (public) |
| Co-authored IEEE paper at TENCON 2022 | input/publications.md |

**LinkedIn implications:**
- This is a complete detect → recognize → deploy pipeline — NOT three separate projects
- The IEEE publication elevates it from "repo" to "research that shipped"
- Philippine license plates = real-world application with local knowledge, not a tutorial
- The Coral TPU deployment shows hardware-level depth (rare among ML engineers)
- Frame as one cohesive project: "End-to-end license plate recognition pipeline: detection (YOLO), recognition (custom CNN), edge deployment (Google Coral TPU)"

### Cluster 3: Game AI & Reinforcement Learning — **RANGE PROOF**

| What exists | Where |
|-------------|-------|
| AlphaZero for Connect 4: self-play RL, MCTS, neural network evaluation | alpha-zero-c4 (public) |
| Bazaar Coach: CV screenshot + knowledge base + strategy analysis | monorepo/projects/bazaar-coach |
| Super Auto Pets ecosystem (fork activity, likely training code) | sapai-* repos |
| Dota 2 data scrapers | herald-scraper-bot, match-scraper |

**LinkedIn implications:**
- alpha-zero-c4 proves algorithmic depth (MCTS, self-play, neural nets) — not just "uses ML libraries"
- Bazaar Coach shows CV + domain knowledge integration applied to games
- "Applied MCTS and self-play reinforcement learning to game AI" is a resume line that clears a bar
- This cluster validates range without diluting primary identity

### Cluster 4: Bayesian / Probabilistic Programming — **DEPTH SIGNAL**

| What exists | Where |
|-------------|-------|
| Decision Orchestrator built inside pymc-labs org | private |
| agent-skills fork: Claude/Cursor skills for probabilistic programming | public |
| 42 gists (Feb 2026): Media Mix Modeling, decision orchestration, PostHog analytics | GitHub gists |
| Active PyMC ecosystem involvement (forks: pymc-model-interactivity, pymc-extras, pytensor-workshop-demo) | public |

**LinkedIn implications:**
- The fact that the employer IS pymc-labs must appear on LinkedIn — it's the strongest institutional credential in the probabilistic programming space
- The intersection of Bayesian statistics + AI agents is rare and valuable
- Frame as: "Built decision orchestration infrastructure inside the PyMC Labs ecosystem"
- Media Mix Modeling gists suggest applied marketing science depth

### Cluster 5: Life-as-System Automation — **PERSONALITY LAYER**

| What exists | Where |
|-------------|-------|
| Monorepo: 1,034 entities, knowledge graph, CI-driven self-organization | public |
| OpenClaw bot: Telegram → entity extraction → git commit → push | monorepo |
| Slipstream: AI swim coach for endless pool | public |
| Ralph loops: automated research/spec system running in CI | monorepo |

**LinkedIn implications:**
- "Treats entire life as a system to be engineered" is the memorable angle
- This is what differentiates "impressive engineer" from "this person is different"
- NOT a separate experience entry — woven through the About section voice
- Slipstream (AI swim coach) is the quotable hook: specific, weird, shows range

---

## Identity Synthesis Findings from GitHub Analysis

### The Primary Identity (from repo-clustering.md)

> "Builds autonomous agent infrastructure — from personal bots to production multi-agent platforms to self-running CI loops."

This person doesn't just use agents. They build the infrastructure that makes agents work at scale. That's a meaningful distinction in 2026.

### Cross-Cluster Patterns (critical for LinkedIn narrative coherence)

**Pattern 1: "Agent Everything"**
Agents appear in every strong cluster:
- CV pipeline: could be agent-orchestrated (detect → recognize → deploy)
- Game AI: Bazaar Coach uses agents for strategy analysis
- Bayesian: agent-skills for probabilistic programming
- Life OS: monorepo is an agent-managed knowledge system
- Conclusion: The person doesn't "also build agents" — they think in agents.

**Pattern 2: "Detection → Recognition → Action"**
The same pipeline pattern recurs across domains:
- CV: Detect plates → Recognize characters → Deploy to edge
- Game AI: Capture screenshot → Analyze state → Recommend action
- Life OS: Ingest text → Extract entities → Organize knowledge
- Agents: Classify input → Route to workflow → Execute tools
This is a systems thinker who sees the same architecture everywhere.

**Pattern 3: "Spec-First Discipline"**
Across every project: specification before implementation.
- Anime recap engine: 2,652-line spec across 13 analysis passes
- Ralph loops: formal frontier/aspect system with convergence detection
- Slipstream: extensive design docs
- Decision-orchestrator: FCIS architecture, formal patterns
- Bazaar Coach: POC design, EV engine design
At personal-project scale, this is engineering maturity that reads as unusual.

**Narrative thread these patterns suggest:**
> "Systems architect who applies the same analytical discipline — spec-first, pipeline-thinking, agent-native — to every domain they enter. The range is the point: the same patterns work for license plate recognition, game strategy AI, email automation, and Bayesian inference."

---

## Narrative Gaps (What's Currently Invisible)

From signal-vs-noise.md and profile-snapshot.md:

| Invisible asset | Why it matters for LinkedIn |
|-----------------|----------------------------|
| 1,000+ commits across 2 private org repos | Production credibility — not toy projects |
| PyMC Labs employment | The single most impressive institutional credential |
| Nuts and Bolts AI / Cheerful | Real SaaS product with Temporal.io, Claude Agent SDK |
| Ralph loop framework (autonomous CI research) | Genuinely novel — no one else does this |
| 8,500+ lines of technical specs in one month | Spec-first discipline is a differentiator |
| Business operations (Pod Play, Digital Wallet, Ping Pod) | Operator credibility, not just builder credibility |
| IEEE TENCON 2022 publication | Research credibility |
| 42 GitHub gists with technical content | Applied Bayesian + MLOps depth |

**All of these are LinkedIn Experience or About section material.** None of them appear on the current profile.

---

## Signal vs Noise Verdicts (applicable to LinkedIn decisions)

From signal-vs-noise.md:

| Verdict | Count | Most relevant for LinkedIn |
|---------|-------|---------------------------|
| SHOWCASE | 5 (3 confirmed + 2 conditional) | monorepo, LPRnet-keras, slipstream, alpha-zero-c4, coral_tpu |
| KEEP | 8 | yolos-lph, agent-skills fork |
| ARCHIVE | 19 | All 14 low-signal forks + 5 stale/confusing originals |

**LinkedIn implication**: Don't use GitHub repos as LinkedIn "evidence" for coursework, empty forks, or mystery projects. When linking in Featured, only link repos that are SHOWCASE-tier. Don't link to alpha-zero-c4 until it has a real README.

---

## First Impression Gap

From profile-snapshot.md:

**What the profile currently says:**
> "Student or recent grad who did some Jupyter notebooks and forked a lot of repos. Probably learning ML. Nothing notable here."

**What the profile should say:**
> "Builds autonomous agent systems, does serious Bayesian statistics, ships across ML/CV/web/hardware/game-AI, and treats their entire life as a system to be engineered."

The LinkedIn profile faces the same gap but with 3 years of additional inactivity on top. Unlike GitHub (which shows activity graph and repo dates), LinkedIn will show stale roles unless actively updated. The inactivity is more visible and more damaging on LinkedIn.

---

## Key Numbers for LinkedIn (sourced from GitHub analysis)

| Metric | Value | LinkedIn framing |
|--------|-------|-----------------|
| Private org commits | 1,000+ combined | "Production-grade" qualifier |
| Cheerful LOC | 13K | Full-stack SaaS scale |
| Decision-orchestrator LOC | 36K | Enterprise-grade infrastructure |
| Monorepo entities | 1,034 | Scope of personal OS system |
| Ralph loop specs | 8,500+ lines | Spec-first methodology signal |
| Active CI loops | Every 30 min | "Autonomous" is not a buzzword here |
| IEEE paper co-authorship | TENCON 2022 | Academic publication |
| Repos that matter | ~13 of 32 | 59% noise by repo count |

---

## Spec Implications for LinkedIn

### 1. Experience Entry Framing
Do NOT list GitHub repos as evidence on LinkedIn. Instead, frame by organization and role:
- **Nuts and Bolts AI** → "Built Cheerful, an email automation SaaS" (don't say "I forked repos")
- **PyMC Labs** → "Built decision orchestration infrastructure" (organization name is the credential)
- **Independent** → "Developed ralph loop framework: autonomous analysis + development agents"

### 2. About Section Thread
The cross-cluster patterns ("Agent Everything", "Spec-First", "Detection → Action") give the About section a coherent through-line without requiring it to list every project. Use the pattern, not the inventory.

### 3. Range Without Scattering
The GitHub clustering analysis solves the polymath problem: show 3-4 domains explicitly (agents, CV, game AI, Bayesian), with the rest implied. Don't try to list 8 domains — pick the 3 that form the story.

### 4. Featured Section
LinkedIn Featured should link to:
- IEEE TENCON 2022 paper (institutional credibility)
- GitHub.com/clsandoval/monorepo (once it has a README)
- GitHub.com/clsandoval/LPRnet-keras (already has good README)
- GitHub.com/clsandoval (profile, once profile README exists)

### 5. Tone Calibration
The GitHub analysis describes the ideal profile voice as:
> "Builder who ships autonomous systems across every domain they touch"
NOT: "Student who experiments"
NOT: "ML engineer with interests in..."
The LinkedIn tone should match: builder confidence, tinkerer energy, polymath range — but professional enough that a VC doesn't back out.
