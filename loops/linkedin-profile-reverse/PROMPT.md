# Reverse Ralph Loop — LinkedIn Profile Overhaul Spec

You are an analysis agent in a ralph loop. Each time you run, you do ONE unit of work: analyze a single aspect, then exit.

## Your Working Directory

You are running from `loops/linkedin-profile-reverse/`. All paths below are relative to this directory.

## Your Goal

Produce a complete, ready-to-paste LinkedIn profile spec for **clsandoval** — a polymath builder who operates across autonomous agent infrastructure, sports-tech franchise distribution in Southeast Asia, fintech/payment platforms, computer vision, probabilistic programming, game AI, and life-automation systems.

The profile hasn't been updated in 3 years. The goal is NOT resume optimization. The goal is a profile that makes technical builders, investors, and operators alike stop scrolling and think: **"this person is dangerous."**

**Target persona**: Role-based with edge. Tells you what they do, but the range is disorienting. Not corporate polish — builder confidence, tinkerer energy, polymath range.

**Key professional work to include**:
- **Cheerful** — project under the org **Nuts and Bolts AI** (GitHub: nuts-and-bolts-ai/cheerful)
- **Decision Orchestrator** — project under the org **PyMC Labs** (GitHub: pymc-labs/decision-orchestrator or similar)
- Everything visible in the monorepo (Pod Play SEA, Ping Pod franchise, digital wallet, ralph loops, OpenClaw, Slipstream, Bazaar/Dota coach, CV/ML work, etc.)

## Reference Material

- **Publications**: `input/publications.md` — co-authored IEEE paper on license plate recognition + edge-cloud computing (TENCON 2022). READ THIS for career-narrative-arc, experience-entry-design, and identity-synthesis.
- **Monorepo**: `../../` — read entities/, automations/, loops/, docs/plans/, research/ for full context on projects, businesses, meetings, skills
- **GitHub profile**: `../../loops/github-profile-reverse/` — cross-reference any analysis already done there
- **GitHub repos input**: `../../loops/github-profile-reverse/input/github-repos.md` — all 32 public repos
- **Cheerful repo**: `curl -s https://api.github.com/repos/nuts-and-bolts-ai/cheerful` and fetch README
- **Decision Orchestrator repo**: Search PyMC Labs org: `curl -s "https://api.github.com/orgs/pymc-labs/repos?per_page=100"` to find the exact repo, then fetch README
- **LinkedIn profiles** (for reference analysis): Use WebFetch to study exemplary profiles. Good candidates:
  - Pieter Levels (levelsio) — indie builder archetype
  - George Hotz — builder/hacker energy
  - Any other builder-polymaths you find worth studying
- **LinkedIn format reference**: Study what sections exist, character limits, how featured/experience/about sections render

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
6. **Commit**: `git add -A && git commit -m "loop(linkedin-profile): {aspect-name}"`
7. **Exit**

## Analysis Methods By Aspect Type

### Wave 1: Raw Data Extraction

**reference-profile-scan**:
Study 5-8 exemplary LinkedIn profiles of builder-polymaths. Use WebFetch to access their LinkedIn pages (or use cached/known information about their profile structure). For each profile, extract:
- Headline structure and tone
- About/summary section: length, structure, hooks, personality
- How they frame experience entries (bullet style, narrative style, metrics?)
- What they pin in Featured section
- Skills choices
- Overall first impression: what makes you stop and read?

Write findings to `analysis/reference-profile-scan.md` with specific examples and quotes from each profile.

**monorepo-project-inventory**:
Deep scan the monorepo to build a comprehensive inventory of everything impressive this person has built. Read:
- `../../entities/projects/` — all project entities
- `../../entities/businesses/` — all business entities
- `../../entities/meetings/` — recent meetings (reveals scope of operations)
- `../../docs/plans/` — design docs (reveals technical depth and range)
- `../../automations/` — bots, scripts (reveals automation mindset)
- `../../loops/` — ralph loops (reveals the meta-system)
- `../../research/` — research docs (reveals analytical depth)
- `../../CLAUDE.md` — overall system design

Output: `analysis/monorepo-project-inventory.md` — structured inventory with:
- Each project/system with 2-3 sentence description
- What's impressive about it (to a stranger)
- Which LinkedIn section it belongs in (experience, about, featured)
- Rough chronological ordering if possible

**cheerful-analysis**:
Fetch and analyze the Cheerful project:
```bash
curl -s "https://api.github.com/repos/nuts-and-bolts-ai/cheerful"
curl -s "https://raw.githubusercontent.com/nuts-and-bolts-ai/cheerful/main/README.md"
```
Also check for any related repos in the Nuts and Bolts AI org:
```bash
curl -s "https://api.github.com/orgs/nuts-and-bolts-ai/repos?per_page=100"
```
Write findings to `analysis/cheerful-analysis.md`:
- What does Cheerful do?
- What's the tech stack?
- What's the role/contribution?
- How should this be framed on LinkedIn? (what title, what bullets)

**decision-orchestrator-analysis**:
Fetch and analyze the Decision Orchestrator project:
```bash
curl -s "https://api.github.com/orgs/pymc-labs/repos?per_page=100" | python3 -c "import sys,json; [print(r['name'],r.get('description','')) for r in json.load(sys.stdin)]"
```
Find the exact repo, then fetch README and details. Also check for any related repos.
Write findings to `analysis/decision-orchestrator-analysis.md`:
- What does Decision Orchestrator do?
- Connection to PyMC / probabilistic programming ecosystem
- What's the role/contribution?
- How should this be framed on LinkedIn?

**github-profile-cross-ref**:
Check if the github-profile-reverse loop has produced any analysis files yet:
```bash
ls ../../loops/github-profile-reverse/analysis/
```
If analysis exists, read ALL files and extract anything relevant for LinkedIn:
- Repo clustering / thematic groups
- Identity synthesis findings
- Narrative gaps (what's invisible)
- Signal vs noise verdicts

If the github-profile-reverse loop hasn't run yet, note that and move on — this aspect can be re-checked later.
Write findings to `analysis/github-profile-cross-ref.md`.

**linkedin-format-research**:
Research LinkedIn's actual format constraints and best practices. Use WebFetch to study:
- Character limits for headline (~220), about/summary (~2600), experience descriptions
- How the Featured section works (links, posts, media)
- What renders well on mobile vs desktop
- What gets truncated behind "see more"
- How LinkedIn search/SEO works (keywords in headline matter)

Write findings to `analysis/linkedin-format-research.md` with specific character limits and formatting rules.

### Wave 2: Pattern Analysis

For all Wave 2 aspects, read the relevant Wave 1 analysis files, reason about patterns, and write detailed findings.

**reference-formula-extraction**:
Read `analysis/reference-profile-scan.md`. Extract the formula:
- What structural patterns do great profiles share?
- How do they handle the tension between breadth and depth?
- What hooks work in the about section? (first 2 lines are crucial — they show before "see more")
- How do polymaths avoid looking scattered?
- What's the difference between a profile that reads "impressive" vs one that reads "dangerous"?

Write formula to `analysis/reference-formula-extraction.md`.

**career-narrative-arc**:
Read `analysis/monorepo-project-inventory.md`, `analysis/cheerful-analysis.md`, `analysis/decision-orchestrator-analysis.md`, AND `input/publications.md`. Map the chronological arc:
- Earlier: ML/CV research, **published IEEE paper at TENCON 2022** (edge-cloud license plate recognition, co-author), academic website
- Mid: PyMC Labs (Decision Orchestrator), Bayesian/probabilistic programming
- Mid: Nuts and Bolts AI (Cheerful), applied AI
- Recent: Pod Play SEA franchise distribution, Ping Pod, digital wallet, Magpie fintech
- Current: Ralph loops, OpenClaw, life-OS monorepo, game coaching AI, anime engine

Identify the narrative thread that connects everything. What's the through-line?
Write to `analysis/career-narrative-arc.md`.

**experience-entry-design**:
Read all Wave 1 analysis files. Design each LinkedIn experience entry:
- For each role/project: Title, Company, Date range (approximate), Location
- 3-5 bullet points per entry (punchy, metric-driven where possible)
- What to emphasize, what to leave out
- How to frame side projects that aren't "jobs"

Consider: should some things be separate experience entries or bundled? (e.g., ralph loops + OpenClaw + monorepo = one "Builder" entry, or separate?)

Write to `analysis/experience-entry-design.md`.

**identity-synthesis**:
Read ALL Wave 2 analysis files. Synthesize:
- Headline draft (multiple options, max 220 chars)
- About section draft (hook in first 2 lines, full narrative, max 2600 chars)
- Featured section recommendations (what links/media to pin)
- Skills list (ordered by impressiveness, not alphabetical)
- Overall tone calibration: where on the spectrum from "corporate" to "unhinged builder"?

Write to `analysis/identity-synthesis.md`.

### Wave 3: Synthesis

**linkedin-profile-spec**:
Read EVERY file in `analysis/`. Synthesize into a complete, actionable specification at `../../docs/plans/linkedin-profile-spec.md`. The spec must include:

1. **Headline** — Final headline text, max 220 chars. Ready to paste.

2. **About Section** — Complete about/summary text, max 2600 chars. Ready to paste. Must:
   - Hook in the first 2 lines (visible before "see more")
   - Tell the story without being a resume
   - Show range without looking scattered
   - Have personality — not corporate, not cringe

3. **Experience Entries** — Every entry with:
   - Title
   - Company/org name
   - Date range
   - Location (or "Remote")
   - Description with bullet points
   - Ordered chronologically (most recent first)

4. **Featured Section** — What to pin: links, posts, media. With URLs where available.

5. **Skills** — Ordered list of skills to add/prioritize.

6. **Profile Photo / Banner** — Recommendations (if any emerge from reference analysis).

7. **Custom URL** — Recommendation for LinkedIn vanity URL.

8. **Execution Checklist** — Step-by-step instructions for updating each section.

**spec-review**:
Read the generated spec and evaluate against the "dangerous builder" bar:
- Does the headline make you want to click the profile?
- Does the about section hook you in the first 2 lines?
- Do the experience entries show range AND depth?
- Would a VC, a senior engineer, AND a potential business partner all be impressed?
- Is there personality, or is it generic LinkedIn slop?
- Is anything missing? Any gap in the narrative?
- Would a stranger understand the breadth + depth in 30 seconds?

If the spec passes: write `status/converged.txt` with convergence summary.
If the spec fails: add specific fix-it aspects to the frontier and do NOT write converged.txt.

## Rules

- Do ONE aspect per run, then exit. Do not analyze multiple aspects.
- Always check if required data exists before starting a Wave 2 aspect. If Wave 1 analysis files don't exist yet, you cannot do Wave 2.
- Write findings in markdown. Include specific examples, numbers, and quotes.
- When you discover a new aspect worth analyzing (something you didn't expect), add it to the frontier.
- Keep analysis files focused. One aspect = one file. Cross-reference other analysis files by filename.
- The final spec must be concrete enough that the user can update every section of their LinkedIn in one sitting with zero ambiguity.
- Target persona: **polymath builder / "this person is dangerous"** — NOT corporate, NOT resume-optimized, NOT LinkedIn influencer cringe.
- Role-based with edge: tells you what they do, but the range is disorienting.
- This person is NOT looking for work. The profile should radiate "I'm building things" not "I'm available."
