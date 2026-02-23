# Profile Snapshot — clsandoval

**Source**: GitHub API + profile page scrape
**Captured**: 2026-02-23
**Method**: `https://api.github.com/users/clsandoval` + WebFetch of github.com/clsandoval + public events API

---

## Profile Fields

| Field | Value | Assessment |
|-------|-------|------------|
| **Name** | Carlos Sandoval | Set ✓ |
| **Bio** | *(empty)* | **CRITICAL GAP** — first thing visitors read |
| **Company** | *(empty)* | Missing signal |
| **Location** | *(empty)* | Missing signal |
| **Blog/Website** | *(empty)* | Missing signal (clsandoval.github.io exists but not linked) |
| **Twitter** | *(empty)* | No social links |
| **Email** | *(not public)* | Not shown |
| **Hireable** | *(not set)* | Neutral |

**Verdict**: The profile is a ghost. No bio, no location, no links, no social presence. A stranger sees "Carlos Sandoval" and 32 repos — nothing else.

---

## Profile README

**Does `clsandoval/clsandoval` repo exist?** **NO** (404)

There is no profile README. The profile page shows zero introductory content. This is the single highest-impact thing to fix — a profile README is the first thing anyone sees when they visit github.com/clsandoval.

---

## Pinned Repos

**Are repos explicitly pinned?** No — GitHub is auto-selecting "Popular repositories" based on its own algorithm.

**Auto-selected "Popular" repos shown on profile:**

| Repo | Language | Fork? | Story Value |
|------|----------|-------|-------------|
| LPRnet-keras | Jupyter Notebook | No | Medium — CV work, only starred repo (4 stars) |
| cs_21_project | SystemVerilog | No | **Low** — coursework from 2021 |
| ocaml-probset | OCaml | No | **Low** — coursework from 2021 |
| object-detection-in-keras | Python | **Yes** | **Low** — fork, no contributions |
| alpha-zero-general | Jupyter Notebook | **Yes** | **Low** — fork, no contributions |
| sapai | Python | **Yes** | **Low** — fork |

**Verdict**: The auto-selected pins are **catastrophic**. 3 of 6 are forks with no visible contributions. 2 are coursework from 4+ years ago. The only decent one (LPRnet-keras) is old and niche. None of the actual impressive work (monorepo, slipstream, yolos-lph, coral_tpu, alpha-zero-c4) is shown. GitHub's algorithm is actively working against this profile.

---

## Contribution Activity

### Recent Public Events (last 30 days)

The public events API shows:
- **Feb 22-23, 2026**: Intense burst of activity — 10+ push events, multiple PRs and branch creates/deletes, all on `clsandoval/monorepo`
- **Feb 21-22, 2026**: More monorepo pushes + branch cleanup (11 delete events — cleaning up merged PR branches)
- Pattern: All recent public activity is on the monorepo

### Activity Assessment

| Signal | Detail |
|--------|--------|
| **Currently active?** | **Yes** — multiple pushes today (2026-02-23) |
| **Activity concentration** | 100% on monorepo in last 30 days |
| **Activity pattern** | Bursts of commits, PRs, branch management — suggests CI/automation loops running |
| **Other recent repos** | maestro fork (Feb 14), pymc forks (Jan 26-28), agent-skills (Jan 21), slipstream (Jan 14) |
| **Contribution graph** | Not directly visible via API, but event frequency suggests moderate-to-high recent activity |

### Activity Timeline (from repo data)

| Period | Focus |
|--------|-------|
| **2026 Jan-Feb** | Monorepo (life-OS), Bayesian/PyMC ecosystem, agent skills, slipstream |
| **2025 H2** | Web apps (succession-ph, macromap), second-brain, personal site |
| **2025 H1** | LPRnet-keras updates, market-viz-agent |
| **2024** | Learning/exploring (RAG, course tools, StreamRAG, ivy) |
| **2023** | CV projects (yolos-lph), tinygrad, MLOps (zenml) |
| **2022** | Game AI deep dive (SAP ecosystem, alpha-zero-c4), hardware (coral_tpu) |
| **2021** | University coursework, early CV work (LPRnet) |

---

## Achievements & Social

| Metric | Value |
|--------|-------|
| **Followers** | 3 |
| **Following** | 0 |
| **Public gists** | 42 |
| **Stars given** | Visible (starred repos include voicetree, pymc-marketing, MIUI-Debloater, detextify, magi) |
| **Achievements** | Pair Extraordinaire ×3, Pull Shark ×3, YOLO ×1, Quickdraw ×1 |

**Gist activity** (recent): PostHog integration notes, media mix modeling guides, OpenClaw decision orchestrator — suggests active technical writing/exploration that's invisible from the main profile.

**Starred repos** suggest interests in: multi-agent orchestration (voicetree), Bayesian marketing (pymc-marketing), manga AI (magi), image processing (detextify).

---

## First Impression Assessment

### What a stranger sees in 10 seconds:

1. **Name**: Carlos Sandoval — fine
2. **Bio**: Nothing — no context on who this person is or what they do
3. **Pinned repos**: Two coursework projects and three empty forks — suggests a student who hasn't done much since school
4. **Repo count**: 32 repos, but half are forks — looks like someone who forks things and doesn't follow through
5. **Stars**: Basically zero social proof (1 repo with 4 stars)
6. **Activity**: Green squares exist but no narrative around them

### What the profile is currently saying:

> "This is a student or recent grad who did some Jupyter notebooks and forked a lot of repos. Probably learning ML. Nothing notable here."

### What the profile SHOULD be saying:

> "This person builds autonomous agent systems, does serious Bayesian statistics, ships across ML/CV/web/hardware/game-AI, and treats their entire life as a system to be engineered. They're dangerous."

### The Gap

The delta between reality and perception is **enormous**:
- The monorepo contains a Telegram bot, CI-driven autonomous loops, an entity-based knowledge graph, and self-organizing automation — completely invisible
- Slipstream (AI swim coach) has 39 commits and design docs — buried
- YOLO fine-tuned on Philippine license plates, AlphaZero for Connect 4, edge AI on Coral TPU — all hidden behind missing READMEs and bad auto-pins
- 42 gists with real technical content — invisible
- Active daily contribution — masked by the terrible first impression

---

## Spec Implications

1. **Create `clsandoval/clsandoval` repo** — Profile README is the #1 priority. This single change would transform the profile.
2. **Set bio** — One punchy line (max 160 chars) that signals "builder, not student"
3. **Pin 6 repos manually** — Replace the catastrophic auto-selection with curated showcase
4. **Add location/blog/social links** — Fill the empty metadata fields
5. **Fix the "Popular repos" fallback** — Even after pinning, the underlying repos need READMEs and descriptions so they hold up under inspection
6. **Consider linking gists** — 42 gists is unusual; some may be worth surfacing
7. **Leverage achievements** — "Pair Extraordinaire ×3" suggests collaborative work; "Pull Shark ×3" suggests active PRs. These are subtle positive signals that will show better once the profile has actual content around them.
