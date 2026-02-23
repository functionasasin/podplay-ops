# Repo README Scan — clsandoval

**Aspect**: repo-readme-scan (Wave 1)
**Analyzed**: 2026-02-23
**Method**: Fetched READMEs via `raw.githubusercontent.com` for all 16 original repos (checked both `main` and `master` branches). Cross-referenced with GitHub API metadata for descriptions.

---

## Summary

7 of 16 original repos have READMEs. Of those 7, only **2 are genuinely good** (LPRnet-keras, coral_tpu). The rest range from template boilerplate (market-viz-agent) to one-liners (alpha-zero-c4, course-scrape-tool). 9 repos have zero README — including **monorepo**, the single most impressive project on the entire profile. The README situation is a disaster for first impressions.

---

## Detailed Assessment: Repos WITH READMEs (7)

### 1. LPRnet-keras — GOOD
**Quality: 8/10**
- Paper citation, architecture diagram, synthetic plate samples, training instructions
- Explains modifications from original paper (depthwise separable convolutions, global context)
- Links to related work (Coral TPU compiler compatibility)
- "Looking forward" section shows active thinking
- **This is what a good repo README looks like.** It tells you what it is, why it matters, and how to use it.
- **Issue**: Slightly dated (references future work that's years old now)

### 2. coral_tpu — DECENT
**Quality: 6/10**
- Explains purpose (compile TF/Keras models to Edge TPU format)
- Lists tested models with TPU/CPU op mapping numbers (concrete, specific)
- Short but functional — tells you what it does and what it supports
- **Issue**: No installation instructions, no usage examples beyond config reference, no images

### 3. slipstream — DECENT (but pre-implementation)
**Quality: 5/10**
- Clear one-liner: "Local AI swim coach for an endless pool"
- Links to extensive design docs in `thoughts/` directory
- Shows planning rigor (technical spec, user journey, implementation plan, project structure)
- **Issue**: Says "Phase: Planning / Pre-implementation" — reads as vaporware to a stranger. The 39 commits and design doc depth are invisible from the README alone. No screenshots, no tech stack mentioned.

### 4. ocaml-probset — FUNCTIONAL (coursework)
**Quality: 4/10**
- Explains what it does: OCaml → Python transpiler for Church numerals
- Lists supported functions (Golomb, list reversal)
- Uses LaTeX equation rendering
- **Issue**: Clearly academic/coursework. The concept (transpiling Church numerals) is genuinely interesting but the README undersells it.

### 5. alpha-zero-c4 — MINIMAL
**Quality: 2/10**
- One line: "An implementation of alphazero specifically for connect 4."
- No architecture explanation, no training details, no results, no usage
- **Issue**: AlphaZero implementations are genuinely impressive and this one is completely unexplained. This repo has story value if the README told you anything about the approach, training results, or game play strength.

### 6. course-scrape-tool — MINIMAL
**Quality: 2/10**
- One line: "get free ppts and lecture notes from top universities"
- No usage instructions, no supported sites, no examples
- **Issue**: The concept is fun (scraping university lectures) but zero detail makes it look like abandoned junk.

### 7. market-viz-agent — TEMPLATE BOILERPLATE
**Quality: 1/10**
- **This is the Chainlit OpenAI Assistant template README, not original content.** It says "You can deploy your OpenAI assistant with Chainlit using this template."
- References OpenAI API keys, Literal AI, Deploy to Render
- The repo name suggests a market visualization agent, but the README describes a generic chatbot template
- **Issue**: Actively misleading. A stranger would think this person copy-pasted a template and didn't even update the README. This is worse than having no README.

---

## Detailed Assessment: Repos WITHOUT READMEs (9)

### 8. monorepo — CRITICAL GAP
**Description**: "monorepo of my life"
- **This is the single most impressive project on the profile** — 1,034 entities in a knowledge graph, 4 ralph loops, OpenClaw Telegram bot on Fly.io, anime recap engine, CI/CD automation. 155+ commits.
- Has NO README. A stranger sees "monorepo of my life" and a list of folders. Completely opaque.
- **Priority: HIGHEST.** Even a 10-line README would dramatically change the profile's first impression.

### 9. yolos-lph — HIGH-VALUE GAP
**Description**: "yolos trained on Philippine license plates"
- YOLO object detection fine-tuned for a specific domain (PH license plates)
- Connects to the LPRnet-keras / coral_tpu ecosystem — this is part of a coherent CV pipeline
- No README means this connection is invisible
- **Priority: HIGH.** Short README explaining the pipeline (detection → recognition → edge deployment) would tie 3 repos together.

### 10. herald-scraper-bot — MODERATE GAP
**Description**: "Automated scraping of herald matches"
- "Herald" refers to a Dota 2 rank. Scrapes match data for analysis.
- Pairs with `match-scraper` (also Dota 2 match scraping)
- No README. The description is cryptic to non-Dota players.
- **Priority: MODERATE.** Fun project but not central to the "dangerous builder" narrative.

### 11. match-scraper — LOW PRIORITY
**Description**: "match scraping for dota 2"
- Simple scraper, 19 KB. Likely a data pipeline utility.
- **Priority: LOW.** Could be archived or kept with a one-line README.

### 12. succession-ph — MYSTERY
**Description**: "monorepo" (misleading — this is NOT the main monorepo)
- TypeScript, 681 KB. No README, description just says "monorepo."
- Appears to be a Philippine succession law application?
- **Priority: MODERATE.** Either needs a real description or should be archived. Current state is confusing.

### 13. macromap — MYSTERY
**Description**: None
- TypeScript, 1.1 MB. Zero description, zero README.
- Name suggests macroeconomic visualization/mapping?
- **Priority: MODERATE.** Needs investigation — could be interesting or could be junk.

### 14. second-brain — PROBABLY OBSOLETE
**Description**: None
- TypeScript, 13 MB. No description, no README.
- Likely an earlier attempt at what became the monorepo's knowledge system.
- **Priority: LOW.** Probably should be archived since monorepo supersedes it.

### 15. clsandoval.github.io — TEMPLATE SHELL
**Description**: "Github Pages template for academic personal websites..."
- 60 MB, al-folio academic template. Homepage: clsandoval.github.io
- No README, but the real question is: is the actual website up-to-date?
- **Priority: LOW for README, but HIGH for profile strategy** — if the website is stale/broken, it's actively harmful as the only link on the profile.

### 16. cs_21_project — COURSEWORK NOISE
**Description**: "CS 21 Course Final Project"
- SystemVerilog, 315 KB. No README.
- **Priority: NONE.** Should be archived. Adds noise with zero signal.

---

## README Quality Distribution

| Quality Tier | Count | Repos |
|-------------|-------|-------|
| **Good** (7-10) | 1 | LPRnet-keras |
| **Decent** (5-6) | 2 | coral_tpu, slipstream |
| **Minimal** (2-4) | 2 | alpha-zero-c4, course-scrape-tool, ocaml-probset |
| **Template/Misleading** (0-1) | 1 | market-viz-agent |
| **Missing** | 9 | monorepo, yolos-lph, herald-scraper-bot, match-scraper, succession-ph, macromap, second-brain, clsandoval.github.io, cs_21_project |

---

## README Needs Priority Matrix

| Priority | Repo | Action | Effort |
|----------|------|--------|--------|
| **P0 — Critical** | monorepo | Write comprehensive README showcasing life-OS, entity graph, ralph loops, OpenClaw bot, CI automation | High (but highest ROI) |
| **P1 — High** | yolos-lph | Write README connecting to LPRnet/coral_tpu pipeline story | Medium |
| **P1 — High** | alpha-zero-c4 | Expand from 1-line to real README (architecture, results, how to play) | Medium |
| **P2 — Medium** | slipstream | Add tech stack, screenshots/diagrams, remove "pre-implementation" feel | Low |
| **P2 — Medium** | succession-ph | Fix description (not "monorepo"), add README or archive | Low |
| **P2 — Medium** | macromap | Add description + README, or archive if abandoned | Low |
| **P3 — Low** | market-viz-agent | Replace template README with actual project description, or archive | Low |
| **P3 — Low** | herald-scraper-bot | Add brief README explaining the Dota 2 context | Low |
| **Archive** | second-brain | Archive (superseded by monorepo) | None |
| **Archive** | cs_21_project | Archive (coursework noise) | None |
| **Evaluate** | clsandoval.github.io | Check if website is current; archive or update | Low |
| **Keep as-is** | LPRnet-keras | Already good | None |
| **Keep as-is** | coral_tpu | Already decent | None |
| **Keep as-is** | course-scrape-tool | Minor utility, one-liner is fine | None |
| **Keep as-is** | ocaml-probset | Coursework, may archive anyway | None |
| **Keep as-is** | match-scraper | Minor utility, may archive | None |

---

## Key Findings for Spec

1. **The #1 project (monorepo) is completely invisible.** No README on a repo with 1,000+ entities, multiple autonomous loops, a deployed Telegram bot, and CI/CD automation. This is the single highest-leverage change available.

2. **The CV pipeline story is fragmented.** LPRnet-keras (recognition) + yolos-lph (detection) + coral_tpu (edge deployment) form a coherent pipeline from detection → recognition → hardware deployment. But without READMEs on yolos-lph, and without cross-references between the three, this narrative is invisible.

3. **market-viz-agent's README is actively harmful.** It's a template README that makes the profile look copy-paste lazy. Either replace it with real content or archive the repo.

4. **Two mystery repos (macromap, succession-ph) need investigation.** They might be interesting or they might be noise — can't tell without reading the code. The forward ralph should investigate before deciding archive vs keep.

5. **alpha-zero-c4 is undersold.** An AlphaZero implementation for Connect 4 is genuinely cool — self-play reinforcement learning, MCTS, neural network evaluation. The one-line README completely wastes this.

6. **slipstream reads as vaporware.** The README says "pre-implementation" but there are 39 commits and extensive design docs. Needs to convey the ambition and rigor without the "hasn't started" vibe.
