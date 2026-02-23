# monorepo

A personal operating system disguised as a git repo. Everything I need to remember, track, plan, or automate lives here — organized into a 1,036-entity knowledge graph that keeps getting smarter on its own.

Two systems write to it continuously:

1. **OpenClaw** — an always-on Telegram bot (Fly.io). I message it with meeting notes, decisions, random updates. It extracts entities, commits them back, pushes.
2. **Ralph loops** — autonomous Claude Code jobs that run on 30-minute crons. Reverse loops analyze a problem into a spec. Forward loops build the spec into code. 7 loops total, 4 active right now.

Both write paths converge on the same `entities/` directory. The repo is the single source of truth. There is no database.

## what's in here

```
entities/           1,036 typed entities (people, places, businesses, trips, meetings, projects, ideas)
dashboards/         8 Dataview dashboards — at-a-glance views for each entity type
loops/              7 ralph loops (3 active, 3 converged, 1 forward-building a Rust engine)
automations/        OpenClaw bot, ingestion scripts, anime recap engine
research/           30 deep research docs
docs/plans/         specs produced by reverse ralph loops
inbox/              raw dumps waiting for the ingestion loop to organize
data/               snow data, metrics, anything tracked
```

## how ralph loops work

A **reverse loop** takes a messy problem and progressively extracts a structured spec:
- Each iteration picks one unchecked aspect from a frontier file
- Analyzes it (web research, code analysis, document extraction)
- Writes findings, updates the frontier, commits, exits
- Repeats on a cron until all aspects converge

A **forward loop** takes a converged spec and builds it stage by stage:
- TDD: writes tests from the spec first, then implements until they pass
- Each stage has its own test filter — the loop runner checks convergence automatically
- Stage N must pass before Stage N+1 begins

Example: the `inheritance-reverse` loop extracted Philippine succession law into a 2,500-line deterministic engine spec (15 testate scenarios, 15 intestate scenarios, 23 test vectors). The `inheritance-rust-forward` loop is now building it in Rust, 12 stages deep.

## the knowledge graph

Every entity is a markdown file with YAML frontmatter:

```yaml
---
type: person
name: John Doe
businesses: [[Blue Bottle Shibuya]]
locations: [[Tokyo]]
last_contact: 2026-01-15
tags: [designer, friend]
---
```

Cross-references use `[[wikilinks]]`. Dataview queries power the dashboards. The entity types: person, place, business, trip, meeting, project, idea, event.

983 of the 1,036 entities are places — most were batch-extracted from trip research. The rest are people, businesses, trips, projects, meetings, and ideas that accumulate as I dump info into the system.

## the bot

OpenClaw runs on Fly.io, always listening on Telegram. I send it anything:
- "Had a meeting with Carlos about the wallet launch" — extracts person + meeting + project entities
- "We're going with Stripe for payments" — logs decision, updates project entity
- Paste a transcript — extracts everything, links entities, commits

It reads `entities/` for context before writing, so it gets smarter as the graph grows.

## active loops

| Loop | Type | What it's doing |
|------|------|-----------------|
| `anime-recap-forward` | forward | Building an anime recap video engine from spec — 7 pipeline stages |
| `linkedin-profile-reverse` | reverse | Mining work history into a LinkedIn profile spec |
| `estate-tax-reverse` | reverse | Extracting PH estate tax rules into a computation engine spec |
| `inheritance-rust-forward` | forward | Building the PH inheritance distribution engine in Rust — 12 TDD stages |

## 281 commits and counting

This repo has been running since early 2026. Bot commits are prefixed with `bot:`, loop commits with `loop(<name>):` or `forward:`. Human commits are everything else.
