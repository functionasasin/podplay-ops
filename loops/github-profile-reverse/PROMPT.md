# Reverse Ralph Loop — GitHub Profile Audit & Spec

You are an analysis agent in a ralph loop. Each time you run, you do ONE unit of work: analyze a single aspect of a GitHub profile, then exit.

## Your Working Directory

You are running from `loops/github-profile-reverse/`. All paths below are relative to this directory.

## Your Goal

Analyze the GitHub profile of `clsandoval` to extract a complete "profile spec" — a concrete, actionable document that a forward ralph can execute to transform the profile from a scattered collection of repos into a curated presence that screams **"builder / tinkerer / this person is dangerous."**

The profile should tell the story of someone who:
- Builds autonomous agent infrastructure (ralph loops, self-organizing knowledge systems)
- Ships real things across domains (ML/CV, Bayesian stats, web apps, game AI, hardware+AI)
- Treats their entire life as a system to be engineered (monorepo-as-life-OS)
- Has deep range — not a specialist, a polymath builder

## Reference Material

- **Repo inventory**: `input/github-repos.md` (all 32 public repos with metadata)
- **Private work context**: `input/private-work-context.md` (two major private repos under org accounts — READ THIS for narrative-gaps, identity-synthesis, and profile-spec)
- **Private repos (cloned locally)**: `input/decision-orchestrator/` and `input/cheerful/` — scan these directly for deep analysis. These are gitignored and won't be committed.
- **Monorepo codebase**: `../../` (the actual monorepo — read entities/, automations/, loops/, docs/ for context)
- **GitHub API**: `curl -s https://api.github.com/users/clsandoval/repos?per_page=100` (live data, 60 req/hr unauthenticated)
- **Individual repo API**: `curl -s https://api.github.com/repos/clsandoval/{repo}`
- **README fetching**: `curl -s https://raw.githubusercontent.com/clsandoval/{repo}/main/README.md`

## What To Do This Iteration

1. **Read the frontier**: Open `frontier/aspects.md`
2. **Find the first unchecked `- [ ]` aspect** in dependency order (Wave 1 before Wave 2 before Wave 3)
   - If Wave 2 aspects depend on Wave 1 data that doesn't exist yet, skip to another Wave 1 aspect
   - If ALL aspects are checked `- [x]`: write "CONVERGED" to `status/converged.txt` and exit
3. **Analyze that ONE aspect** using the appropriate method (see below)
4. **Write findings** to `analysis/{aspect-name}.md`
5. **Update the frontier**:
   - Mark the aspect as `- [x]` in `frontier/aspects.md`
   - Update the Statistics section (increment Analyzed, decrement Pending, update Convergence %)
   - If you discovered new aspects worth analyzing, add them to the "Discovered Aspects" section, then move them to the appropriate Wave in "Pending Aspects"
   - Add a row to `frontier/analysis-log.md`
6. **Commit**: `git add -A && git commit -m "loop(github-profile): {aspect-name}"`
7. **Exit**

## Analysis Methods By Aspect Type

### Wave 1: Raw Data Extraction

**repo-inventory**:
Read `input/github-repos.md` for the pre-seeded snapshot. Optionally enrich with live GitHub API data:
```bash
curl -s "https://api.github.com/users/clsandoval/repos?per_page=100&sort=updated" > raw/repos.json
```
For each repo, extract: name, description, language, stars, forks, is_fork, created_at, updated_at, topics.
Write a structured inventory to `analysis/repo-inventory.md` with a table of ALL repos including:
- Original vs fork
- Has README (yes/no)
- Has description (yes/no)
- Last activity (date)
- Primary language
- Stars

**profile-snapshot**:
Capture the current state of the GitHub profile. Use:
```bash
curl -s "https://api.github.com/users/clsandoval" > raw/profile.json
```
Document in `analysis/profile-snapshot.md`:
- Bio / company / location / blog (or lack thereof)
- Current pinned repos (if any)
- Contribution activity level
- Profile README existence (check if `clsandoval/clsandoval` repo exists)
- Overall first impression: what story does this profile tell a stranger?

**monorepo-deep-scan**:
Read the actual monorepo to understand what impressive work is hidden inside. Scan:
- `../../automations/` — What bots/automation exist? (OpenClaw Telegram bot, etc.)
- `../../loops/` — What ralph loops exist? Read the registry, read PROMPT.md files
- `../../entities/` — How many entities? What types? How sophisticated is the knowledge graph?
- `../../docs/plans/` — What specs/plans exist?
- `../../.github/workflows/` — What CI/CD automation exists?
- `../../CLAUDE.md` — What does the system design look like?

Write findings to `analysis/monorepo-deep-scan.md` focusing on:
- What would impress a technical person if they could see inside
- What capabilities are completely invisible from the GitHub profile
- Specific numbers (entity count, commit count, loop iterations, etc.)

**repo-readme-scan**:
For each ORIGINAL (non-fork) repo, fetch and evaluate its README:
```bash
for repo in monorepo slipstream market-viz-agent herald-scraper-bot yolos-lph LPRnet-keras succession-ph macromap course-scrape-tool alpha-zero-c4 match-scraper coral_tpu clsandoval.github.io second-brain; do
  echo "=== $repo ===" >> raw/readmes.txt
  curl -s "https://raw.githubusercontent.com/clsandoval/$repo/main/README.md" >> raw/readmes.txt 2>&1
  echo -e "\n\n" >> raw/readmes.txt
done
```
Write assessment to `analysis/repo-readme-scan.md`:
- Which repos have good READMEs vs none vs template junk
- Which repos need READMEs written
- Which repos have misleading/stale descriptions

### Wave 2: Pattern Analysis

For all Wave 2 aspects, read the relevant Wave 1 analysis files, reason about patterns, and write detailed findings to `analysis/{aspect-name}.md`.

Each analysis file MUST include:
- **Summary**: 2-3 sentence overview
- **Data**: Specific repos, numbers, examples
- **Patterns**: What's consistent/repeatable
- **Spec Implications**: Concrete actions for the forward ralph

**repo-clustering**:
Read `analysis/repo-inventory.md`. Cluster repos into thematic groups:
- AI/ML Infrastructure (agents, orchestration, skills)
- Computer Vision (license plates, YOLO, object detection)
- Bayesian / Probabilistic Programming (PyMC, PyTensor, marimo)
- Game AI (Super Auto Pets, Alpha Zero, Connect 4)
- Web Apps (succession-ph, macromap, second-brain)
- Data Engineering / Scraping (herald, course-scrape, match-scraper)
- Life Automation (monorepo, slipstream)
- Hardware + Edge (coral_tpu)

For each cluster: how many repos, how strong is the signal, does it support the "dangerous builder" narrative?

**signal-vs-noise**:
Read `analysis/repo-inventory.md` and `analysis/repo-readme-scan.md`. For EVERY repo, assign a verdict:

| Verdict | Criteria | Action |
|---------|----------|--------|
| **SHOWCASE** | Original, impressive, tells a story | Pin, write/improve README, add topics |
| **KEEP** | Original or meaningful fork, worth having visible | Update description, add topics |
| **ARCHIVE** | Fork with no contributions, stale, duplicate, noise | Archive (make invisible) |

Score each repo on: Originality (0-3), Activity (0-3), Story value (0-3), README quality (0-3).
Total score determines verdict: 8+ = SHOWCASE, 4-7 = KEEP, 0-3 = ARCHIVE.

**fork-audit**:
Read `analysis/repo-inventory.md`. For each forked repo, determine:
- Did the user make meaningful commits beyond the fork?
- Is it an active contribution to upstream?
- Does it demonstrate a skill or interest worth showcasing?
- Or is it just a clone with no added value?

Use the GitHub API to check:
```bash
curl -s "https://api.github.com/repos/clsandoval/{repo}/commits?author=clsandoval&per_page=5"
```

Verdict for each fork: KEEP (meaningful work), ARCHIVE (just a clone), SHOWCASE (substantial modification).

**narrative-gaps**:
Read `analysis/monorepo-deep-scan.md`, `analysis/repo-clustering.md`, AND `input/private-work-context.md`. Identify:
- What skills/projects are completely invisible from the profile?
- What would make someone say "holy shit" if they could see it?
- What's the delta between "what this person has built" and "what their GitHub shows"?
- **Private org work**: Two major products (decision-orchestrator @ pymc-labs, cheerful @ nuts-and-bolts-ai) with 1,000+ commits — Claude Agent SDK, custom MCP servers, full-stack product eng. This work is NOT classified and should be referenced in the profile narrative (company names, role, tech — just not the code itself).
- Specific recommendations: should any monorepo sub-projects become standalone repos?
- Should the profile README surface hidden work (including private org contributions)?

**identity-synthesis**:
Read ALL Wave 2 analysis files AND `input/private-work-context.md`. Synthesize into a cohesive identity:
- One-line bio draft (max 160 chars)
- 3-5 bullet narrative ("This person builds X, ships Y, automates Z")
- Primary archetype: what's the memorable label? ("autonomous systems builder"? "AI polymath"? "the guy who ralph-loops everything"?)
- What to emphasize vs downplay
- Factor in private work: core maintainer on two production AI products (agent orchestration + email automation SaaS) — this is a massive signal that the public profile completely misses
- Tone: builder confidence, not corporate polish. Tinkerer energy, not resume optimization.

### Wave 3: Synthesis

**profile-spec**:
Read EVERY file in `analysis/`. Synthesize into a complete, actionable specification at `../../docs/plans/github-profile-spec.md`. The spec must include:

1. **Profile README** — Complete markdown content for the `clsandoval/clsandoval` repo README.md. Not a template. The actual final content, ready to commit. Must include:
   - A hook (who is this person, in one punchy line)
   - What I build / what I'm into (2-4 lines, not a resume)
   - Featured projects with one-line descriptions (3-5 projects) — include private org work by name (pymc-labs, nuts-and-bolts-ai) since it's not classified
   - Current obsessions / rabbit holes
   - How to reach me (optional, if relevant)
   - NO badges, NO GitHub stats widgets, NO "visitor count" cringe. Clean, text-forward, personality.

2. **Pin List** — Exactly 6 repos to pin, ordered. With justification for each.

3. **Archive List** — Every repo to archive, with one-line reason each.

4. **Description Updates** — New `description` string for every repo that's being kept. Must be punchy, not generic.

5. **Topic Tags** — New `topics` array for every repo being kept.

6. **Bio Update** — One-line bio for the GitHub profile.

7. **Execution Script** — A bash script using GitHub API (`curl` or `gh`) that executes ALL changes:
   - Archive repos
   - Update descriptions
   - Update topics
   - Create `clsandoval/clsandoval` repo if it doesn't exist
   - Push the profile README
   - Note: pinning repos requires GraphQL API

**spec-review**:
Read the generated spec and ask: "If I showed this profile to a senior engineer or VC, would they think 'this person is dangerous'?" Check for:
- Does the README have personality or is it generic?
- Are the pins telling the right story?
- Are we archiving enough noise?
- Are descriptions punchy or boring?
- Is anything missing?
- Would a stranger understand the breadth + depth in 30 seconds?

If the spec passes: write `status/converged.txt` with convergence summary.
If the spec fails: add specific fix-it aspects to the frontier and do NOT write converged.txt.

## Rules

- Do ONE aspect per run, then exit. Do not analyze multiple aspects.
- Always check if required data exists before starting a Wave 2 aspect. If `analysis/repo-inventory.md` doesn't exist yet, you cannot do `repo-clustering`.
- Write findings in markdown. Include specific repos, numbers, and examples.
- When you discover a new aspect worth analyzing (something you didn't expect), add it to the frontier.
- Keep analysis files focused. One aspect = one file. Cross-reference other analysis files by filename.
- The final spec must be concrete enough that a fresh Claude Code session (or a forward ralph) can execute every change with zero ambiguity.
- Target persona: **builder / tinkerer / "this person is dangerous"** — NOT corporate, NOT resume-optimized, NOT cringe.
- When evaluating repos, read the actual code/README when possible, don't just go by metadata.
