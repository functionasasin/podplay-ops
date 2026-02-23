# LinkedIn Profile Spec — Synthesis Notes

## What Was Synthesized

All 10 analysis files from Wave 1 and Wave 2 were read and integrated into a single actionable specification at `../../docs/plans/linkedin-profile-spec.md`.

## Key Synthesis Decisions

### Headline
Went with Option A from identity-synthesis: "AI Agent Infrastructure Engineer | PyMC Labs · Nuts and Bolts AI | Deploying sports-tech franchise across Southeast Asia" (120 chars). Balances SEO (first 40 chars are the searchable payload) with institutional credibility (two named orgs) and cognitive dissonance (franchise detail). Option B (more personality, "I build...") provided as alternate.

### About Section
Used the 6-block structure from identity-synthesis verbatim (~1,730 chars). The hook (277 chars) lands before LinkedIn's "See more" cutoff on desktop (~300 chars) and communicates the core dissonance even on mobile truncation (~140-200 chars). Every named entity (PyMC Labs, IEEE TENCON, Central Group, Temporal.io) is verification bait — rewards readers who check.

### Experience Entry Ordering
Followed career-narrative-arc and experience-entry-design recommendations:
1. Pod Play SEA (leads — most disorienting for an AI engineer profile)
2. PyMC Labs (deepest technical signal — custom MCP server, 36K LOC)
3. Nuts and Bolts AI (full-stack range proof — 3 apps, Temporal.io, React 19)
4. Independent Research (origin story — IEEE paper, AlphaZero, grounds the arc)

This ordering maximizes cognitive dissonance. A reader going top-to-bottom experiences escalating surprise.

### Bundling Decisions
- Digital Wallet → bundled into Pod Play SEA entry (same operation)
- Ping Pod franchise → bundled into Pod Play SEA entry (operationally inseparable)
- Ralph loops, OpenClaw, anime engine → About section (personality layer, not separate entries)
- Slipstream → Featured section (range signal, not an experience entry)
- Game AI (AlphaZero, SAP, Dota) → bundled into Independent entry as depth signal

### Featured Section
4 items in priority order:
1. IEEE TENCON 2022 paper (hero — institutional credibility)
2. LPRnet-keras repo (most-starred, has README)
3. Slipstream (range signal — AI + physical training)
4. GitHub profile (activity graph, org affiliations visible)

Followed reference-formula-extraction guidance: live products/links > claimed expertise. Each featured item is verifiable.

### Skills Strategy
40 skills across 5 tiers. Top 3 pinned: AI Agent Infrastructure, Python, Machine Learning. Ordered by impressiveness and searchability, not alphabetical. Tier structure ensures the most differentiated skills (MCP, Temporal.io, Probabilistic Programming) appear early.

### What's NOT in the Spec (By Design)
- No "Open to Work" signals
- No LinkedIn Learning badges
- No buzzword skills without shipped proof
- No corporate language anywhere
- No recommendations section strategy (let it accrue naturally)
- No posting strategy (out of scope — profile spec only)

## Format Compliance
All text fits within LinkedIn limits per linkedin-format-research:
- Headline: 120 chars (limit: 220)
- About: ~1,730 chars (limit: 2,600)
- Experience descriptions: all under 2,000 chars
- Skills: 40 items (limit: 50)

## Output Location
`../../docs/plans/linkedin-profile-spec.md` — complete, ready-to-paste specification with execution checklist.
