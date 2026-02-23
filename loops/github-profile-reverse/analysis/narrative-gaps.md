# Narrative Gaps — clsandoval

**Aspect**: narrative-gaps (Wave 2)
**Analyzed**: 2026-02-23
**Depends on**: monorepo-deep-scan, repo-clustering, signal-vs-noise, fork-audit, profile-snapshot, private-work-context
**Method**: Cross-reference all Wave 1 data and private work context. Identify complete invisibility zones, capability deltas, and surface-area recommendations.

---

## Summary

The gap between "what clsandoval has built" and "what their GitHub profile shows" is not a gap — it's a canyon. The public profile reads as a student's portfolio from 2021 (two auto-pinned coursework repos, zero bio, 14 empty forks). The actual reality is a principal engineer with 1,000+ commits on two production AI products, an autonomous CI-driven loop system, a 1,034-entity life-OS with an always-on Telegram bot, and research-grade video analysis work. Every impressive thing is hidden, and every unimpressive thing is visible. This is a near-total inversion of signal.

---

## Section 1: Invisibility Zones — What Doesn't Appear At All

These are capabilities and projects that have **zero visible surface area** on the public GitHub profile.

### 1A. Production AI Infrastructure (Private Org Work)

**decision-orchestrator @ pymc-labs**
- 420 commits, 2nd largest contributor, ~36,400 LOC, 285 Python files
- Discord-based organizational OS: multi-agent orchestration, workflow routing, scope-based access control
- Claude Agent SDK + custom MCP server (not FastMCP — built from scratch with `@tool` decorator pattern)
- 10+ platform integrations: Toggl, Google Workspace, Xero, Bluedot, Onyx RAG, GitHub, Fly.io
- Architecture: FCIS (Functional Core, Imperative Shell), Langfuse observability, Supabase
- **Visibility**: Zero. Not a single byte shows on the profile.
- **Why it matters**: This is principal-engineer-level work on a production AI system used by a real company's team operations.

**cheerful @ nuts-and-bolts-ai**
- 580 commits, 2nd largest contributor (out of 5) on 5,570-total-commit repo
- Full-stack email automation SaaS: Next.js 16+/React 19 frontend + FastAPI backend + Temporal.io durable workflows
- AI-powered influencer campaign management: creator search, personalized email drafting, Gmail OAuth, campaign execution
- Slack Context Engine: Claude Agent SDK + MCP + Onyx RAG for team operations
- **Visibility**: Zero. No mention anywhere.
- **Why it matters**: Full-stack product engineering, AI-native product development, production SaaS at startup scale.

**Combined signal**: 1,000+ commits across two production AI products. Core maintainer / architect role. Claude Agent SDK + MCP expertise across multiple contexts. This is the most important invisible work on the entire profile.

---

### 1B. Ralph Loops — Autonomous Research/Development Framework

The ralph loop system is a genuinely novel piece of infrastructure:
- **Reverse ralph**: Analysis agents decompose problems into Wave 1→2→3 aspects, producing executable specs
- **Forward ralph**: Development agents execute specs stage-by-stage with test-first discipline
- **CI/CD integration**: GitHub Actions runs loops every 30 minutes, detects convergence, creates issues, runs concurrent loops via matrix strategy
- **Active loops**: 4 running simultaneously (anime-recap-reverse CONVERGED at 22 iterations, anime-recap-forward in Stage 2, github-profile-reverse active, linkedin-profile-reverse active)
- **Output**: 2,652-line spec from video analysis, 755-line forward ralph implementation, 768-line loop registry spec

**Visibility**: Zero. The monorepo exists as a public repo but has no README, so a visitor sees "monorepo" with 0 description and doesn't know what's inside.

**Why it matters**: Generalized autonomous research + development agent framework, running in production CI on a personal project — this is infrastructure-as-methodology, not just a hobby script. It's the kind of thing senior ML infra engineers would find genuinely impressive.

---

### 1C. OpenClaw Telegram Bot

- Always-on entity ingestion engine deployed on Fly.io
- 4 skills: monorepo-ingest, email-ingest (pulls Outlook 2x/day), git-sync (15-min cron), podplay-briefing (daily morning report)
- Architecture: Telegram → Claude API → entity extraction → git commit → push
- This is NOT a chatbot. It's a purpose-built entity-extraction pipeline with auto-commit capability.

**Visibility**: Zero from the profile.

**Why it matters**: Production deployment of a multi-skill AI agent for personal use. Shows the "ship it to prod" mentality applied to personal infrastructure.

---

### 1D. The 1,034-Entity Knowledge Graph

- 983 places, 21 trips, 17 people, 4 projects, 4 businesses, 4 meetings, 1 activity
- Typed entities with standardized frontmatter, wikilink relationships, 8 Dataview dashboards
- Git as database: every entity update is a commit, no external DB dependency
- Dual write paths: bot (real-time) + ingestion loop (periodic)

**Visibility**: Zero. The monorepo README doesn't exist, so the knowledge graph system is invisible.

**Why it matters**: This is a production personal CRM + trip planner + project tracker + meeting logger, all unified in a queryable system. Most engineers use 5+ separate tools; this fuses them. The architecture is genuinely interesting (git as database, dual write paths, type-safe frontmatter).

---

### 1E. Anime Recap Engine — Research-Level Video Analysis

- 13 analysis passes on a 75-min anime video: narration-transcript, scene-boundaries, audio-profile, Demucs audio separation, clip stats, pacing metrics, script structure, hook patterns, etc.
- Output: 2,652-line spec with 7 pipeline stages, 50+ quantitative parameters, 79 pass/36 fail validation criteria
- Forward engine scaffolded: CLI stages (ingest, script, match, narrate, moments, mix, render, validate), Stage 1 tests passing

**Visibility**: Zero from the public profile.

**Why it matters**: Formalizing aesthetic intuitions into mathematical specifications is research-level work. Few engineers would approach "reverse-engineer this video" with this level of rigor. The spec-first approach followed by test-driven implementation shows engineering discipline at personal-project scale.

---

### 1F. Bazaar Coach — Game AI Coaching System

- 10 subdirectories: brainstorms, heroes, items, mechanics, meta, skills, knowledge, strategy, tools
- Combines CV (screenshot capture) + game knowledge base + strategy analysis + agent orchestration
- EV engine design, POC design, custom CLAUDE.md system prompt (13,143 bytes)

**Visibility**: Zero. Buried inside the monorepo.

**Why it matters**: Extends the game AI cluster (alpha-zero-c4 is visible) with a real-time coaching system that demonstrates CV + agent orchestration together. Connects to the "agents applied everywhere" pattern.

---

### 1G. 42 Gists with Professional-Grade Technical Content

Recent gists (Feb 2026):
- Media Mix Modeling synthesis guides (×2) — professional-grade Bayesian applied marketing analysis
- OpenClaw-style Scheduled Queries for Decision Orchestrator — agent orchestration design
- PostHog Integration Status Check — product analytics proficiency
- Setup guides, technical walkthroughs

**Visibility**: Gists are obscure (most visitors don't click the gist tab). 42 gists is an unusually high count for someone with 0 followers — this content just sits there untouched.

**Why it matters**: Bayesian + marketing analytics (Media Mix Modeling) at professional level is a high-signal differentiator. The agent orchestration gist reveals architectural thinking on decision-orchestrator without exposing the private codebase.

---

### 1H. OSS Contributions to ivy/unifyai

- 5 merged PRs to ivy (16k+ star ML framework): implemented `torch.affine_grid`, fixed paddle activation decorator bugs
- Demonstrates ability to navigate large production codebases and ship production-quality contributions

**Visibility**: The ivy fork exists but is archived-by-verdict. The contribution itself lives on upstream and doesn't appear on the profile.

**Why it matters**: Merged contributions to a 16k-star repo is a meaningful signal. Worth one line in the profile README.

---

## Section 2: Capability Delta — Reality vs. Perception

| Capability | Reality | Profile Shows | Gap |
|------------|---------|---------------|-----|
| Agent infrastructure | 2 production AI systems (1K+ commits), 4 active autonomous loops, always-on bot | Nothing | **TOTAL INVISIBILITY** |
| MCP expertise | Built custom MCP servers in 2 separate projects | Nothing | **TOTAL INVISIBILITY** |
| Full-stack product eng | Next.js 16+/React 19 + FastAPI + Temporal.io at production SaaS scale | Nothing | **TOTAL INVISIBILITY** |
| Workflow orchestration | Temporal.io durable workflows in production | Nothing | **TOTAL INVISIBILITY** |
| Spec-first discipline | 8,500+ lines of specs, 15 design docs, 2,652-line video spec | Nothing | **TOTAL INVISIBILITY** |
| Bayesian statistics | Works at pymc-labs, MMM analysis, agent-skills for probabilistic programming | 5 zero-commit PyMC forks | **ALMOST INVISIBLE** |
| Life-as-system engineering | 1,034-entity graph, Telegram bot, CI-driven self-organization | monorepo repo with no README | **INVISIBLE** |
| CV/ML | LPRnet-keras (4 stars), YOLO fine-tune, edge deployment | LPRnet-keras + buried repos | **PARTIALLY VISIBLE** |
| Game AI | AlphaZero from scratch, Bazaar Coach (CV + agents + strategy) | alpha-zero-c4 (1-line README) | **BARELY VISIBLE** |
| OSS contributions | 5 merged PRs to ivy (16k+ star repo) | Fork exists but adds noise | **INVISIBLE** |
| Professional role | 2nd-largest contributor at pymc-labs + nuts-and-bolts-ai | Nothing | **TOTAL INVISIBILITY** |

**The central problem**: The private org work (decision-orchestrator + cheerful) represents the bulk of the professional credibility — and it's completely invisible. The monorepo represents the most interesting personal infrastructure — and it's completely invisible. The profile is showing 100% of the noise and 0% of the signal.

---

## Section 3: Monorepo Sub-Projects → Standalone Repos

Should any monorepo sub-projects become standalone repos? Analysis:

### Strong Case: NO (keep in monorepo)

**OpenClaw bot** (`automations/openclaw/`):
- Tightly coupled to monorepo via git writes
- The "always-on entity ingestion into a git-based KB" is the story; without the monorepo context it's just a bot
- Better surfaced via monorepo README than extracted

**Anime recap engine** (`automations/anime-recap-engine/`):
- Currently in active development (forward ralph Stage 2)
- Extracting now would be premature; wait for convergence
- Could become a separate repo once Stage 7 (full pipeline) is complete

**Bazaar Coach** (`projects/bazaar-coach/`):
- Embedded in monorepo by design; uses monorepo's knowledge graph
- Better surfaced via monorepo README mention than extracted

**Ralph loop system** (spread across `loops/`, `.github/workflows/`, `docs/plans/`):
- Could be interesting as a standalone "ralph" framework repo
- But not yet: the framework is still evolving across 4 active loops. Extract once it stabilizes.

### Moderate Case: MAYBE (worth considering)

**ralph-loops framework**: If/when the ralph framework stabilizes across many loops, a standalone `ralph` or `agentloops` repo with the pattern documented could be a strong showcase. Not yet.

**anime-recap engine**: Once the forward ralph converges (all 7 stages passing), this 2,652-line spec → working video pipeline is a compelling standalone project.

### Recommendation
**No extraction now.** The monorepo is the vehicle — a strong monorepo README that links to internal sub-projects is the right move. The profile README can point into the monorepo with specific paths (e.g., "See `automations/anime-recap-engine/`").

---

## Section 4: Profile README Surface Area for Hidden Work

The profile README (`clsandoval/clsandoval`) is the right place to surface everything invisible. Here's what must appear there:

### Must Surface (by category)

**Private org work (name-drop by company):**
- pymc-labs: Discord-based org OS, Claude Agent SDK, custom MCP infrastructure, workflow orchestration
- nuts-and-bolts-ai: Email automation SaaS, full-stack (Next.js/FastAPI/Temporal), AI-powered campaign management
- Why: The code is private but the company name and role are not classified. This is standard LinkedIn/resume territory.

**Ralph loop framework:**
- "autonomous research/dev agent loops running in CI every 30 minutes"
- Link to the monorepo's loops/ directory
- The github-profile-reverse loop itself (meta: this README was partly generated by an agent) could be a personality moment

**OpenClaw bot + knowledge graph:**
- "Telegram bot that ingests natural language and commits entity updates to git"
- "1,034-entity personal knowledge graph (CRM + trip planner + KB in one system)"

**Anime recap engine:**
- "Reverse-engineered a 75-min video into a 2,652-line spec with 50+ quantitative parameters"
- Shows research discipline and the range of what the ralph framework can do

**OSS contributions:**
- ivy/unifyai merged PRs (5 PRs, `torch.affine_grid` implementation)
- sapai upstream bug fixes (minor, but shows cross-project contribution awareness)

**Bayesian/pymc-labs context:**
- Explicit mention of role at pymc-labs as signal of ecosystem depth (not just using PyMC, working on it professionally)

---

## Section 5: Specific Recommendations

### 1. Create `clsandoval/clsandoval` Profile README — Priority #1

Nothing else matters as much as this. A blank profile page is a rejection letter. The profile README is the only place to surface:
- Who you are (not a student — a builder with production AI work)
- Private org work (by company name)
- Monorepo internals (ralph loops, OpenClaw, knowledge graph)
- Range across domains (CV, game AI, Bayesian, hardware)
- Tone: tinkerer energy, builder confidence, NOT corporate resume

### 2. Set Bio — Priority #2

Currently empty. One punchy line, max 160 chars. Should establish identity immediately. Candidates:
- "builder of autonomous systems — agent infra, CV pipelines, game AI, life-as-OS"
- "building production AI infrastructure @ pymc-labs + nuts-and-bolts-ai | automating everything else"

### 3. Archive 20 Repos — Priority #3

The noise reduction immediately changes the perception. Coursework pinned by GitHub's algorithm is the most urgent fix. Auto-archiving the coursework repos forces GitHub to show better repos in the "Popular" section even before manual pinning is set.

### 4. Write monorepo README — Priority #4

The monorepo has the most invisible impressive work (ralph loops, OpenClaw, knowledge graph, CI automation). A README here transforms a blank repo into a compelling showcase. Key elements:
- What is this? (personal OS, not just notes)
- What lives here? (1,034 entities, 4 active loops, always-on bot)
- How does it work? (dual write paths, CI-driven loop system)
- Link to key sub-directories (loops/, automations/, entities/)

### 5. Write alpha-zero-c4 README — Priority #5

This repo needs almost no code changes — just a README explaining what AlphaZero is, what the implementation does, and what the results were. This transforms it from a mystery PureBasic(?) repo to a compelling showcase of algorithmic depth.

### 6. Pin 6 Repos Manually — Priority #6

Once the monorepo README exists and cs_21_project/ocaml-probset are archived, manual pinning locks in the right story.

### 7. Surface Gists — Priority #7

The 42 gists represent a shadow portfolio. The MMM guides and agent orchestration gists are professional-grade. Consider:
- Linking the top 2-3 gists from the profile README
- Adding the gist URL to the bio or website field

---

## Section 6: What Would Make Someone Say "Holy Shit"

In priority order, here's the work that would cause a technical person or VC to stop and pay attention:

1. **The ralph loop system** — An autonomous research-and-development agent framework running every 30 minutes in CI, decomposing problems into aspects, detecting convergence, running concurrent analysis agents. This is infrastructure-as-methodology. Almost nobody does this.

2. **decision-orchestrator @ pymc-labs** — A production Discord-based org OS with custom MCP server, 10+ integrations, intelligent message routing, and FCIS architecture. 420 commits, 36K LOC. This is principal engineer work.

3. **cheerful @ nuts-and-bolts-ai** — Full-stack AI SaaS (React 19 + Temporal.io + Claude SDK) for influencer marketing automation. 580 commits. This shows product engineering beyond weekend prototypes.

4. **Anime recap engine** — Formalizing a 75-min video into a 2,652-line executable specification with 50+ quantitative parameters. Reverse-engineering aesthetics into math. This is unusual.

5. **The entity-first knowledge graph** — 1,034 typed entities with git as the database, two write paths, and 8 Dataview dashboards. Not notes. A queryable life-OS.

6. **LPRnet + YOLO + Coral TPU pipeline** — A complete license plate recognition pipeline from detection through recognition to edge hardware deployment. Rare to see someone ship to actual hardware.

None of these are visible on the current profile.

---

## Spec Implications

1. **Profile README is non-negotiable** — It's the only place to surface private org work, monorepo internals, and OSS contributions. Nothing else replaces it.

2. **Mention pymc-labs and nuts-and-bolts-ai by name** — The code is private but the role is not. These company mentions provide the professional credibility signal that makes everything else believable.

3. **Lead with the ralph loop system** — It's the most novel work and completely unique to this person. It also creates a meta-moment (this profile spec was generated by an agent loop — build that in).

4. **Don't just describe projects — establish the pattern** — "I apply agent thinking to everything: CV pipelines, game coaching, Bayesian analysis, personal OS" is more powerful than listing projects individually.

5. **Surface ivy/unifyai OSS contributions** — One line about 5 merged PRs to a 16k-star repo is worth more than 16 empty fork repos.

6. **No monorepo sub-project extractions yet** — The ralph framework and anime engine need to mature before standalone extraction makes sense.

7. **Gists → link in README** — The MMM synthesis and agent orchestration gists are worth surfacing directly.

8. **The "forks to explore, builds originals" pattern** — This is actually a positive personality trait worth one sentence in the README: "fork to understand, build to ship."
