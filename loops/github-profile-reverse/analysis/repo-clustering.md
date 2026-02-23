# Repo Clustering — clsandoval

**Aspect**: repo-clustering (Wave 2)
**Analyzed**: 2026-02-23
**Depends on**: repo-inventory, monorepo-deep-scan, repo-readme-scan, profile-snapshot
**Method**: Thematic clustering of all 32 public repos + monorepo sub-projects + private org work. Each cluster assessed for signal strength and narrative fit.

---

## Summary

The 32 public repos + monorepo internals + 2 private org products cluster into 8 thematic groups. Three clusters are **dominant narrative pillars** (Autonomous Agent Infrastructure, Computer Vision Pipeline, Game AI). Two are **strong supporting signals** (Bayesian/Probabilistic, Life-as-System Automation). Three are **noise or weak signal** (Web Apps, Data Scraping, Learning/Coursework). The profile's biggest problem isn't lack of work — it's that the strongest clusters are either invisible (agent infra hidden in monorepo + private orgs) or fragmented (CV pipeline split across 3 repos with no connecting thread).

---

## Cluster 1: Autonomous Agent Infrastructure

**Signal Strength: DOMINANT (10/10)** — This is the #1 narrative pillar

| Source | Repo/Project | Type | Key Detail |
|--------|-------------|------|------------|
| Public | monorepo | Original | Ralph loops (4 active), OpenClaw Telegram bot (Fly.io), CI-driven autonomous execution every 30min |
| Public | market-viz-agent | Original | Chainlit + OpenAI conversational agent (minimal, 2 commits) |
| Fork | maestro | Fork | Agent orchestration framework (recently active Feb 2026) |
| Fork | agent-skills | Fork | Claude/Cursor skills for probabilistic programming |
| Private | decision-orchestrator | pymc-labs org | Discord-based org OS: Claude Agent SDK, custom MCP server, 420 commits, 36K LOC |
| Private | cheerful | nuts-and-bolts-ai org | Email automation SaaS: Claude Agent SDK, Temporal.io, 580 commits, 13K LOC |

**What's here**: A progression from simple agents (market-viz-agent) → agent orchestration frameworks (maestro fork) → production agent infrastructure (decision-orchestrator, cheerful) → meta-agent systems (ralph loops that run agents autonomously in CI). This is the most impressive cluster by far.

**Visibility**: **Almost entirely invisible.** The monorepo's agent work has no README. The two private org repos (1,000+ combined commits) don't show on the public profile at all. market-viz-agent has a misleading template README. Only the maestro and agent-skills forks hint at agent work, and forks are weak signals.

**Narrative value**: This cluster alone could carry the profile. "Builds autonomous agent infrastructure" — from personal bots to production multi-agent platforms to self-running CI loops. The ralph loop framework (analysis agents → specs → building agents → shipping) is genuinely novel.

**Spec implications**:
- monorepo README must lead with the agent/automation story
- Profile README should name-drop decision-orchestrator and cheerful by org (pymc-labs, nuts-and-bolts-ai)
- market-viz-agent: archive or rewrite README (currently harmful)
- Pin the monorepo; it's the anchor for this cluster

---

## Cluster 2: Computer Vision Pipeline

**Signal Strength: STRONG (8/10)** — Coherent pipeline story, well-evidenced

| Source | Repo/Project | Type | Key Detail |
|--------|-------------|------|------------|
| Public | yolos-lph | Original | YOLO fine-tuned on Philippine license plates (detection) |
| Public | LPRnet-keras | Original | License plate recognition network, 4 stars (recognition) |
| Public | coral_tpu | Original | Edge AI model compilation for Google Coral TPU (deployment) |
| Fork | object-detection-in-keras | Fork | General object detection (learning material) |

**What's here**: A complete CV pipeline — **detect** license plates (YOLO) → **recognize** characters (LPRnet) → **deploy** to edge hardware (Coral TPU). Three repos that form one coherent story when connected. LPRnet-keras is the only starred repo on the entire profile (4 stars) and has the best README.

**Visibility**: **Fragmented.** LPRnet-keras has a good README and is somewhat visible. yolos-lph has no README. coral_tpu has a decent README. But there's no cross-linking — a stranger would never realize these three repos form a pipeline. The object-detection-in-keras fork is noise.

**Narrative value**: "Built a complete license plate recognition pipeline from detection through recognition to edge hardware deployment." This is concrete, specific, and impressive. The fact that it targets Philippine license plates adds personality — not a tutorial, a real-world application.

**Spec implications**:
- yolos-lph needs a README that references LPRnet-keras and coral_tpu
- All three should have descriptions mentioning "PH license plate pipeline"
- Pin LPRnet-keras (it has stars and the best README)
- Archive object-detection-in-keras fork (pure noise)

---

## Cluster 3: Game AI & Reinforcement Learning

**Signal Strength: STRONG (7/10)** — Shows range and depth, multiple approaches

| Source | Repo/Project | Type | Key Detail |
|--------|-------------|------|------------|
| Public | alpha-zero-c4 | Original | AlphaZero implementation for Connect 4 (self-play RL + MCTS + neural net) |
| Fork | sapai-gym | Fork | OpenAI Gym environment for Super Auto Pets |
| Fork | super-auto-ai | Fork | Super Auto Pets AI |
| Fork | sapai | Fork | Super Auto Pets RL engine |
| Fork | alpha-zero-general | Fork | General AlphaZero implementation (base for alpha-zero-c4) |
| Monorepo | Bazaar Coach | Sub-project | Game AI coaching system: CV (screenshot) + knowledge base + strategy analysis |

**What's here**: Two distinct game AI efforts — (1) AlphaZero for Connect 4 (deep RL, MCTS, neural networks) and (2) Super Auto Pets AI ecosystem (RL environment + training + AI play). Plus the Bazaar Coach in the monorepo, which combines CV + game knowledge + strategy. Three different games, three different approaches to game AI.

**Visibility**: **Severely undersold.** alpha-zero-c4 has a one-line README. The SAP forks are just forks with unknown contribution level. Bazaar Coach is buried inside the monorepo. A stranger sees "PureBasic" as the language for alpha-zero-c4 (which is a GitHub language detection bug — it's likely Python/C++) and moves on.

**Narrative value**: "Built AlphaZero from scratch, trained game AI agents, automated game coaching with computer vision." This shows algorithmic depth (MCTS, self-play RL, neural network evaluation) and the playful tinkerer energy of applying serious techniques to games.

**Spec implications**:
- alpha-zero-c4 needs a real README (architecture, training details, results)
- Fork audit needed on SAP repos to determine if meaningful work was done
- Consider mentioning Bazaar Coach in monorepo README or profile README
- Pin alpha-zero-c4 if README is improved (strong story value)

---

## Cluster 4: Bayesian / Probabilistic Programming

**Signal Strength: MODERATE-STRONG (6/10)** — Mostly visible through forks and private work

| Source | Repo/Project | Type | Key Detail |
|--------|-------------|------|------------|
| Fork | pymc-model-interactivity | Fork | Bayesian modeling + marimo reactive notebooks |
| Fork | pymc-extras | Fork | PyMC ecosystem extensions |
| Fork | agent-skills | Fork | Skills for probabilistic programming with Claude/Cursor |
| Fork | pytensor-workshop-demo | Fork | Workshop demo (conference participation?) |
| Fork | marimo | Fork | Reactive Python notebook framework |
| Private | decision-orchestrator | pymc-labs org | The employer IS pymc-labs — direct ecosystem involvement |
| Gists | Media Mix Modeling | Gists | Comprehensive MMM synthesis guides (Feb 2026) |

**What's here**: Active involvement in the PyMC/Bayesian ecosystem — not just using it, but maintaining agent tools for it and working at pymc-labs. The gists reveal serious applied work (Media Mix Modeling). The marimo fork suggests exploring better tooling for interactive Bayesian analysis.

**Visibility**: **Partially visible but indirect.** The forks exist but don't show contributions. The pymc-labs employment connection is completely invisible. The gists are hidden. A stranger might notice the PyMC forks and think "this person is interested in Bayesian stats" but wouldn't know the depth.

**Narrative value**: "Works in the PyMC ecosystem, builds agent tooling for probabilistic programming." This is a strong differentiator — the intersection of Bayesian statistics and AI agents is a niche very few people occupy.

**Spec implications**:
- Profile README should mention pymc-labs connection
- agent-skills fork is the most narrative-relevant (skills for probabilistic programming)
- Fork audit needed to see if pymc-model-interactivity has meaningful commits
- Bayesian work supports the "polymath" angle — not just ML, but mathematical statistics

---

## Cluster 5: Life-as-System Automation

**Signal Strength: MODERATE (6/10)** — Unique, personality-defining

| Source | Repo/Project | Type | Key Detail |
|--------|-------------|------|------------|
| Public | monorepo | Original | "monorepo of my life" — 1,034 entities, knowledge graph, Telegram bot, CI loops |
| Public | slipstream | Original | AI swim coach for endless pool, 39 commits, extensive design docs |
| Public | second-brain | Original | TypeScript, likely predecessor to monorepo (obsolete) |

**What's here**: A consistent pattern of engineering personal life systems. The monorepo is a full personal OS (knowledge graph + bot + automation). Slipstream applies AI to a specific personal need (swim coaching). second-brain was an earlier attempt at the same impulse.

**Visibility**: **monorepo is invisible** (no README), **slipstream reads as vaporware** ("pre-implementation" in README despite 39 commits), **second-brain is obsolete noise**.

**Narrative value**: "Treats their entire life as a system to be engineered." This is the personality-defining cluster. It's what makes the profile memorable vs. just another ML engineer. The monorepo-as-life-OS concept is genuinely novel.

**Spec implications**:
- This cluster overlaps heavily with Cluster 1 (the monorepo is both agent infra AND life automation)
- slipstream README needs a tone shift (from "planning" to "building")
- second-brain should be archived
- The "life as system" angle should appear in the profile README's voice/personality

---

## Cluster 6: Web Applications

**Signal Strength: WEAK (3/10)** — Scattered, no visible output

| Source | Repo/Project | Type | Key Detail |
|--------|-------------|------|------------|
| Public | succession-ph | Original | TypeScript, PH succession law app?, misleading description |
| Public | macromap | Original | TypeScript, 1.1MB, zero description |
| Public | clsandoval.github.io | Original | Academic website (al-folio template), likely stale |
| Private | cheerful (frontend) | nuts-and-bolts-ai org | Next.js 16+, React 19, TanStack Query, shadcn — serious frontend |

**What's here**: Three public web projects that are mysteries or stale, contrasted with serious full-stack frontend work hidden in the private cheerful repo. The public repos add zero signal.

**Visibility**: **Counterproductive.** succession-ph's description says "monorepo" (confusing). macromap has nothing. The personal site may be stale. Meanwhile, the real frontend skill is locked in private repos.

**Narrative value**: Low for public repos. High for the private work (Next.js, React 19 — cutting-edge frontend). The web apps cluster doesn't support the "dangerous builder" narrative unless the private work is surfaced.

**Spec implications**:
- succession-ph and macromap need investigation — archive if not interesting
- clsandoval.github.io needs assessment — is the site live and current?
- Don't emphasize web apps in profile narrative; let the agent/ML/CV clusters dominate
- Frontend skill signal comes from mentioning cheerful (nuts-and-bolts-ai) in profile

---

## Cluster 7: Data Engineering / Scraping

**Signal Strength: WEAK (2/10)** — Utility scripts, not narrative-worthy

| Source | Repo/Project | Type | Key Detail |
|--------|-------------|------|------------|
| Public | herald-scraper-bot | Original | Dota 2 herald match scraper |
| Public | match-scraper | Original | Dota 2 match data scraper |
| Public | course-scrape-tool | Original | University lecture PPT scraper |

**What's here**: Three small scraping utilities. Two are Dota 2 related (feeding into game analysis), one scrapes university lectures.

**Visibility**: Visible but unimpressive. These look like hobby scripts.

**Narrative value**: Very low. Scraping is a commodity skill. These repos add clutter without adding story. The Dota 2 scrapers mildly support the game AI cluster (data feeding into analysis), but that connection isn't visible.

**Spec implications**:
- Consider archiving all three (noise reduction)
- Or keep herald-scraper-bot if it connects to a Dota AI analysis story
- course-scrape-tool is mildly fun but doesn't support the narrative

---

## Cluster 8: Learning / Coursework / Exploration

**Signal Strength: NOISE (1/10)** — Should be invisible

| Source | Repo/Project | Type | Key Detail |
|--------|-------------|------|------------|
| Public | ocaml-probset | Original | OCaml problem set (coursework) |
| Public | cs_21_project | Original | SystemVerilog final project (coursework) |
| Fork | rag-from-scratch | Fork | RAG tutorial clone |
| Fork | ivy | Fork | ML framework (just exploring) |
| Fork | tinygrad | Fork | geohot's tinygrad (just exploring) |
| Fork | zenml | Fork | MLOps framework (just exploring) |
| Fork | StreamRAG | Fork | Video streaming agent (just exploring) |

**What's here**: University coursework from 2021 and various fork-and-forget exploration of ML tools. Zero original contribution visible.

**Visibility**: **Actively harmful.** cs_21_project and ocaml-probset are auto-pinned by GitHub, making the profile look like a student's. The forks add to the "forks stuff and doesn't follow through" impression.

**Narrative value**: Negative. Every one of these repos dilutes the signal from the strong clusters.

**Spec implications**:
- Archive all coursework repos (cs_21_project, ocaml-probset)
- Archive all empty exploration forks (rag-from-scratch, ivy, tinygrad, zenml, StreamRAG)
- This is the single biggest noise-reduction opportunity

---

## Cluster Signal Strength Rankings

| Rank | Cluster | Score | Role in Profile |
|------|---------|-------|-----------------|
| 1 | Autonomous Agent Infrastructure | 10/10 | **Primary identity** — leads the profile |
| 2 | Computer Vision Pipeline | 8/10 | **Showcase project** — concrete, complete, visual |
| 3 | Game AI & Reinforcement Learning | 7/10 | **Range proof** — "applies serious ML to fun problems" |
| 4 | Bayesian / Probabilistic Programming | 6/10 | **Depth signal** — mathematical rigor, ecosystem involvement |
| 5 | Life-as-System Automation | 6/10 | **Personality** — "treats life as engineering problem" |
| 6 | Web Applications | 3/10 | **Hidden via private work** — don't emphasize publicly |
| 7 | Data Scraping | 2/10 | **Archive candidates** — noise |
| 8 | Learning / Coursework | 1/10 | **Archive immediately** — actively harmful |

---

## Cross-Cluster Patterns

### 1. The "Agent Everything" Thread

Agents appear in almost every strong cluster:
- **Agent infra**: ralph loops, OpenClaw bot, decision-orchestrator, cheerful
- **CV pipeline**: could be agent-orchestrated (detection → recognition → deployment)
- **Game AI**: Bazaar Coach uses agents for strategy analysis
- **Bayesian**: agent-skills for probabilistic programming
- **Life automation**: monorepo is an agent-managed knowledge system

This person doesn't just build agents — they apply agent thinking to every domain.

### 2. The "Detection → Recognition → Action" Pattern

Multiple clusters follow the same pipeline:
- CV: Detect plates → Recognize characters → Deploy to edge
- Game AI: Capture screenshot → Analyze state → Recommend action
- Life OS: Ingest information → Extract entities → Organize into knowledge graph
- Agents: Classify input → Route to workflow → Execute tools

This is a systems thinker who sees the same pattern everywhere and builds it.

### 3. The "Spec-First" Discipline

Across clusters, there's a consistent pattern of specification before implementation:
- Anime recap engine: 2,652-line spec before building
- Ralph loops: formal frontier/aspect system with convergence detection
- Slipstream: extensive design docs before code
- Decision-orchestrator: FCIS architecture, formal patterns
- Bazaar Coach: POC design, EV engine design

This is unusual at personal-project scale and signals engineering maturity.

### 4. Range Without Dilution

The clusters span: AI/agents, computer vision, Bayesian statistics, game theory/RL, hardware/edge computing, web development, data engineering. But each cluster has **depth** — not just "tried it once" but "built a complete system." Range + depth = polymath builder.

---

## Spec Implications Summary

### Narrative Structure (for profile README and pin selection)
1. **Lead with agents** — autonomous systems, ralph loops, production AI infrastructure
2. **Show the CV pipeline** — concrete, complete, visual proof of shipping
3. **Flash the range** — game AI (AlphaZero), Bayesian stats (PyMC), edge hardware (Coral TPU)
4. **Surface private work** — pymc-labs + nuts-and-bolts-ai = production credibility
5. **Let life-as-system be the personality** — monorepo-as-OS, AI swim coach, "everything is a system"

### Noise Reduction (archive candidates)
- **High confidence archive**: cs_21_project, ocaml-probset, rag-from-scratch, ivy, tinygrad, zenml, StreamRAG, object-detection-in-keras, second-brain
- **Investigate then likely archive**: succession-ph, macromap, market-viz-agent
- **Consider archiving**: match-scraper, course-scrape-tool, herald-scraper-bot

### Pin Strategy (6 slots)
Based on cluster strength, ideal pins should cover:
1. monorepo (Cluster 1+5: agent infra + life OS)
2. LPRnet-keras (Cluster 2: CV — only starred repo, best README)
3. alpha-zero-c4 (Cluster 3: game AI — if README improved)
4. slipstream (Cluster 5: life automation — if README improved)
5. coral_tpu (Cluster 2+9: hardware + edge AI)
6. yolos-lph (Cluster 2: completes CV pipeline) OR one of the PyMC forks if meaningful contributions found

---

## Discovered Aspects

None — the planned aspects cover everything needed. The fork-audit (Wave 2) will resolve the "meaningful contributions?" questions for PyMC and SAP forks.
