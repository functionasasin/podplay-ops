# Signal vs Noise — clsandoval

**Aspect**: signal-vs-noise (Wave 2)
**Analyzed**: 2026-02-23
**Depends on**: repo-inventory, repo-readme-scan, repo-clustering, profile-snapshot
**Method**: Scored every repo on 4 dimensions (0-3 each, max 12). Verdict: SHOWCASE (8+), KEEP (4-7), ARCHIVE (0-3).

---

## Summary

Of 32 repos, **5 are SHOWCASE** (pin-worthy, narrative-carrying), **8 are KEEP** (worth having visible with updates), and **19 are ARCHIVE** (noise that dilutes the signal). The profile is currently 59% noise by repo count. Archiving 19 repos and showcasing 5 would flip the signal-to-noise ratio from ~1:4 to ~1:0 (pure signal). The single biggest lever is archiving the 16 forks — only 2 have any case for keeping.

---

## Scoring Rubric

| Dimension | 0 | 1 | 2 | 3 |
|-----------|---|---|---|---|
| **Originality** | Fork with no changes | Fork with minor changes OR generic project | Original but common (scraper, template) | Original, novel concept or approach |
| **Activity** | No commits in 2+ years | Last commit 1-2 years ago | Active in last year | Active in last 3 months |
| **Story Value** | Actively confusing or harmful | No narrative contribution | Supports a cluster/story | Defines a narrative pillar |
| **README Quality** | Template/misleading | Missing entirely | Exists but minimal | Good — explains what, why, how |

---

## All 32 Repos — Scored

### Original Repos (16)

| # | Repo | Orig | Act | Story | README | **Total** | **Verdict** |
|---|------|------|-----|-------|--------|-----------|-------------|
| 1 | **monorepo** | 3 | 3 | 3 | 0 | **9** | **SHOWCASE** |
| 2 | **slipstream** | 3 | 2 | 2 | 2 | **9** | **SHOWCASE** |
| 3 | **LPRnet-keras** | 3 | 1 | 3 | 3 | **10** | **SHOWCASE** |
| 4 | **alpha-zero-c4** | 3 | 0 | 3 | 1 | **7** | **KEEP** → SHOWCASE with README fix |
| 5 | **coral_tpu** | 3 | 0 | 2 | 2 | **7** | **KEEP** |
| 6 | **yolos-lph** | 3 | 0 | 2 | 0 | **5** | **KEEP** |
| 7 | herald-scraper-bot | 2 | 1 | 1 | 0 | **4** | **KEEP** (borderline) |
| 8 | course-scrape-tool | 2 | 0 | 1 | 1 | **4** | **KEEP** (borderline) |
| 9 | market-viz-agent | 2 | 0 | 1 | 0* | **3** | **ARCHIVE** |
| 10 | succession-ph | 2 | 0 | 0 | 0 | **2** | **ARCHIVE** |
| 11 | macromap | 2 | 0 | 0 | 0 | **2** | **ARCHIVE** |
| 12 | match-scraper | 2 | 0 | 1 | 0 | **3** | **ARCHIVE** |
| 13 | second-brain | 2 | 0 | 0 | 0 | **2** | **ARCHIVE** |
| 14 | clsandoval.github.io | 1 | 0 | 0 | 0 | **1** | **ARCHIVE** |
| 15 | ocaml-probset | 2 | 0 | 0 | 1 | **3** | **ARCHIVE** |
| 16 | cs_21_project | 2 | 0 | 0 | 0 | **2** | **ARCHIVE** |

*market-viz-agent's README is a template — scored 0 because it's actively misleading (worse than missing).

### Forked Repos (16)

| # | Repo | Orig | Act | Story | README | **Total** | **Verdict** |
|---|------|------|-----|-------|--------|-----------|-------------|
| 17 | maestro | 0 | 2 | 1 | — | **3** | **ARCHIVE** |
| 18 | agent-skills | 1 | 1 | 2 | — | **4** | **KEEP** |
| 19 | pymc-model-interactivity | 0 | 1 | 1 | — | **2** | **ARCHIVE** |
| 20 | pymc-extras | 0 | 1 | 1 | — | **2** | **ARCHIVE** |
| 21 | marimo | 0 | 0 | 0 | — | **0** | **ARCHIVE** |
| 22 | pytensor-workshop-demo | 0 | 1 | 1 | — | **2** | **ARCHIVE** |
| 23 | rag-from-scratch | 0 | 0 | 0 | — | **0** | **ARCHIVE** |
| 24 | ivy | 0 | 0 | 0 | — | **0** | **ARCHIVE** |
| 25 | StreamRAG | 0 | 0 | 0 | — | **0** | **ARCHIVE** |
| 26 | tinygrad | 0 | 0 | 0 | — | **0** | **ARCHIVE** |
| 27 | zenml | 0 | 0 | 0 | — | **0** | **ARCHIVE** |
| 28 | sapai-gym | 0 | 0 | 1 | — | **1** | **ARCHIVE** |
| 29 | super-auto-ai | 0 | 0 | 1 | — | **1** | **ARCHIVE** |
| 30 | sapai | 0 | 0 | 1 | — | **1** | **ARCHIVE** |
| 31 | alpha-zero-general | 0 | 0 | 1 | — | **1** | **ARCHIVE** |
| 32 | object-detection-in-keras | 0 | 0 | 0 | — | **0** | **ARCHIVE** |

Note: Fork README quality is scored "—" (not applicable) because fork READMEs belong to upstream projects, not the user.

---

## Verdict Distribution

| Verdict | Count | Repos |
|---------|-------|-------|
| **SHOWCASE** (8+) | 3 (+2 conditional) | monorepo (9), slipstream (9), LPRnet-keras (10). *alpha-zero-c4 (7) and coral_tpu (7) reach SHOWCASE with README improvements.* |
| **KEEP** (4-7) | 8 | alpha-zero-c4 (7), coral_tpu (7), yolos-lph (5), herald-scraper-bot (4), course-scrape-tool (4), agent-skills fork (4) |
| **ARCHIVE** (0-3) | 19 | market-viz-agent (3), succession-ph (2), macromap (2), match-scraper (3), second-brain (2), clsandoval.github.io (1), ocaml-probset (3), cs_21_project (2), + all 14 remaining forks (0-3) |

---

## Detailed Scoring Rationale

### SHOWCASE Repos

**monorepo (9/12)** — Originality:3 (life-OS with autonomous loops — no one does this), Activity:3 (daily commits, CI loops running), Story:3 (defines two narrative pillars: agent infra + life automation), README:0 (missing — the single biggest ROI fix on the profile).
- **Action**: Write comprehensive README. Pin slot #1. Lead description: "Life operating system — autonomous agent loops, 1,000+ entity knowledge graph, Telegram bot, CI-driven self-organization."

**slipstream (9/12)** — Originality:3 (AI swim coach is delightfully specific and novel), Activity:2 (39 commits, last Jan 2026), Story:2 (supports "life as engineering" narrative, shows spec-first discipline), README:2 (exists, decent, but reads as vaporware).
- **Action**: Update README to remove "pre-implementation" framing. Add tech stack. Pin slot #4 or #5.

**LPRnet-keras (10/12)** — Originality:3 (custom architecture modifications to published paper), Activity:1 (last updated Feb 2025, but a mature project), Story:3 (anchor of the CV pipeline story, only starred repo), README:3 (genuinely good — paper citation, architecture diagram, training details).
- **Action**: Pin slot #2. Update description to reference the full pipeline. Minor README refresh (remove stale "looking forward" section).

### Conditional SHOWCASE (KEEP → SHOWCASE with work)

**alpha-zero-c4 (7/12)** — Originality:3 (AlphaZero implementation from scratch for Connect 4), Activity:0 (last commit Jan 2023), Story:3 (proves algorithmic depth — self-play RL, MCTS, neural nets), README:1 (one-liner, completely wastes the project's story value).
- **Action**: Write real README explaining architecture, training approach, results. Reaches SHOWCASE (10/12) with a good README. Pin slot #3.

**coral_tpu (7/12)** — Originality:3 (edge AI deployment — rare to see someone go to hardware), Activity:0 (last commit May 2022), Story:2 (completes the CV pipeline story: detection → recognition → edge deployment), README:2 (decent, lists tested models with op mapping).
- **Action**: Update description to connect to LPRnet/yolos pipeline. Pin slot #5 or #6.

### KEEP Repos

**yolos-lph (5/12)** — Originality:3, Activity:0, Story:2, README:0. The YOLO detection piece of the CV pipeline. Needs a README to connect the dots.
- **Action**: Write short README referencing LPRnet-keras and coral_tpu. Update description. Keep visible.

**herald-scraper-bot (4/12)** — Originality:2, Activity:1, Story:1, README:0. Dota 2 match scraper. Mildly interesting but doesn't carry narrative weight.
- **Action**: Add one-line README. Update description. Borderline — could archive without loss.

**course-scrape-tool (4/12)** — Originality:2, Activity:0, Story:1, README:1. University lecture scraper. Fun concept, minimal execution.
- **Action**: Keep as-is or archive. Doesn't hurt but doesn't help.

**agent-skills fork (4/12)** — Originality:1 (fork, but Claude/Cursor skills for probabilistic programming is a niche intersection), Activity:1, Story:2 (supports Bayesian + agents crossover narrative). The only fork worth keeping.
- **Action**: Keep visible. Supports the Bayesian + agents narrative. Fork audit will determine if there are meaningful commits.

### ARCHIVE Repos — Full List

#### Original repos to archive (7):

| Repo | Score | Reason |
|------|-------|--------|
| market-viz-agent | 3 | 2 commits, template README that's actively misleading, generic OpenAI chatbot |
| succession-ph | 2 | Mystery project, misleading "monorepo" description, no README, 5 months stale |
| macromap | 2 | Zero description, zero README, 8 months stale, unknown purpose |
| match-scraper | 3 | Simple Dota 2 scraper, redundant with herald-scraper-bot, no README |
| second-brain | 2 | Superseded by monorepo, no description, no README, 5 months stale |
| ocaml-probset | 3 | Coursework from 2021, academic exercise, doesn't support "builder" narrative |
| cs_21_project | 2 | SystemVerilog coursework from 2021, currently auto-pinned by GitHub (harmful) |

Note on **clsandoval.github.io** (score 1): This is the personal website. Archiving removes it from the repo list but doesn't take down the site. However, if the site is stale, archiving the repo signals "I've moved on." Recommend archiving unless the site is being actively maintained.

#### Forks to archive (14):

| Repo | Score | Reason |
|------|-------|--------|
| maestro | 3 | Agent orchestration fork — recently active but fork audit needed. Likely no meaningful changes beyond upstream. |
| pymc-model-interactivity | 2 | PyMC fork, likely just a clone for local testing |
| pymc-extras | 2 | PyMC fork, likely just a clone |
| marimo | 0 | Reactive notebook framework — just cloned, no contributions |
| pytensor-workshop-demo | 2 | Workshop demo — fork for conference participation, not original work |
| rag-from-scratch | 0 | Tutorial clone, zero activity after fork |
| ivy | 0 | Major ML framework, just exploring, no contributions |
| StreamRAG | 0 | Video streaming agent, just exploring |
| tinygrad | 0 | geohot's project, just exploring |
| zenml | 0 | MLOps framework, just exploring |
| sapai-gym | 1 | Super Auto Pets gym env — might have contributions, fork audit pending |
| super-auto-ai | 1 | Super Auto Pets AI — might have contributions, fork audit pending |
| sapai | 1 | Super Auto Pets engine — might have contributions, fork audit pending |
| alpha-zero-general | 1 | AlphaZero base implementation — likely cloned to build alpha-zero-c4 |
| object-detection-in-keras | 0 | CV tutorial, pure noise |

Note: The SAP forks (sapai-gym, super-auto-ai, sapai) and maestro might be upgraded to KEEP if the fork-audit reveals meaningful commits. But the default assumption for forks with no visible contributions is ARCHIVE.

---

## Impact Analysis

### Before vs After

| Metric | Current | After Archiving |
|--------|---------|-----------------|
| Total visible repos | 32 | 13 |
| Original repos | 16 | 9 |
| Forks | 16 | 1-2 |
| Signal-to-noise ratio | ~25% signal | ~85% signal |
| Auto-pin quality | Catastrophic (coursework + empty forks) | Strong (monorepo, LPRnet, alpha-zero) |

### Noise Reduction Impact

Archiving 19 repos:
- **Removes 2 coursework repos** currently auto-pinned (cs_21_project, ocaml-probset) — instant profile improvement
- **Removes 14 empty forks** that create "forks stuff and doesn't follow through" impression
- **Removes 3 mystery/stale originals** (succession-ph, macromap, second-brain) that add confusion
- **Removes market-viz-agent** whose template README is actively harmful

### Showcase Enhancement Impact

Improving 5 SHOWCASE repos:
- monorepo gets a README → transforms from "?" to "#1 project on profile"
- alpha-zero-c4 gets a README → goes from invisible to impressive
- slipstream gets README update → goes from vaporware to ambitious
- LPRnet-keras gets description update → becomes pipeline anchor
- coral_tpu gets description update → connects to pipeline

### Net Effect

A stranger visiting the profile after these changes sees:
- **13 repos** (not 32) — every one meaningful
- **6 curated pins** telling a coherent story
- **Bio** explaining who this person is
- **Profile README** with personality and depth
- **Narrative clusters visible**: agent infra, CV pipeline, game AI, life automation

Instead of: "Student who forks stuff"
They see: "Builder who ships autonomous systems across every domain they touch"

---

## Spec Implications

### For profile-spec (Wave 3):

1. **Archive list**: 19 repos (7 original + 12 forks). Fork audit may save 1-4 forks → adjust accordingly.
2. **Pin order**: monorepo → LPRnet-keras → alpha-zero-c4 → slipstream → coral_tpu → yolos-lph (or agent-skills if fork has meaningful work)
3. **Description rewrites needed**: All 13 surviving repos need punchy descriptions
4. **Topic tags needed**: All 13 surviving repos have zero topics — add relevant tags
5. **README work**: 3 repos need new READMEs (monorepo, alpha-zero-c4, yolos-lph), 1 needs rewrite (slipstream)
6. **The biggest single improvement is the noise reduction** — archiving 19 repos changes the profile's signal instantly, even before any READMEs are written

### For fork-audit (next aspect):

The following forks have non-zero story value and need audit before final archive decision:
- maestro (agent orchestration — recently active)
- agent-skills (probabilistic programming skills — unique intersection)
- sapai-gym, super-auto-ai, sapai (game AI ecosystem — may have training code)
- alpha-zero-general (base for alpha-zero-c4 — may have modifications)

All others are confirmed archive with high confidence.

---

## Scoring Notes

- **README quality for forks is N/A**: Fork READMEs come from upstream. A fork's README tells you about the upstream project, not the user's work. This means forks start at a maximum of 9/12, making SHOWCASE (8+) nearly impossible for forks — which is correct behavior (forks rarely deserve showcase status).
- **"Activity" measures visible public commits**, not private work. The monorepo gets Activity:3 because of visible daily commits, even though most impressive work happens in private repos.
- **"Story value" is assessed in context of the full profile narrative** ("dangerous builder/tinkerer"), not in isolation. A repo might be a fine project but score low on story value if it doesn't support the narrative (e.g., course-scrape-tool).
- **alpha-zero-c4 gets Story:3 despite low activity** because AlphaZero implementations are genuinely impressive and the "game AI" narrative pillar needs it. Story value is about what a project says about the builder, not how recently they touched it.
