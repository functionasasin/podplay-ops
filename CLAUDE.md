# Monorepo - Personal Knowledge Base

## Purpose

This repository is a centralized dumping ground for everything across my life and work. The primary goal is to provide **at-a-glance status** of projects, meetings, and ongoing work. It's an **ingestion and convergent organization system** - I dump information here continuously, and automated loops progressively organize it into a structured knowledge graph.

## What Goes Here

- **Entities**: People, places, businesses, trips, meetings, projects, ideas, events
- **Automation**: Automated loops, webhooks, scripts, bots
- **Research**: Trip planning, event research, things I'm looking into
- **Data**: Snow data, metrics, any data I want to track
- **Anything else**: If I need to remember it or reference it later, it goes here

## Entity-First Knowledge Graph

Everything becomes a typed entity with standardized frontmatter. This enables:
- **Easy capture**: Dump info anywhere, automation organizes into entities
- **Smart synthesis**: When planning, pull together existing knowledge + templates + external research
- **At-a-glance views**: Dataview dashboards for people, places, upcoming trips
- **Rich relationships**: Who (participation), where (location), when (temporal) links

### Entity Types

| Type | Purpose |
|------|---------|
| Person | Someone you know or want to know |
| Place | Location (city, neighborhood, spot) |
| Business | Company, restaurant, shop, coworking |
| Trip | Planned or past journey |
| Meeting | Conversation with date/attendees |
| Project | Work or personal initiative |
| Idea | Half-baked thought that might become something |
| Event | Conference, concert, time-bound happening |

### Status Values

| Entity | Statuses |
|--------|----------|
| Trip | idea, planning, booked, active, completed |
| Project | idea, active, paused, completed |
| Idea | seed, exploring, ready, shelved |
| Event | interested, attending, attended, skipped |

## Structure

```
/monorepo
├── CLAUDE.md             # This file - repo context for Claude
├── entities/             # Canonical entity files (Obsidian vault root)
│   ├── people/           # Person entities
│   ├── places/           # Place entities
│   ├── businesses/       # Business entities
│   ├── trips/            # Trip entities
│   ├── meetings/         # Meeting entities
│   ├── projects/         # Project entities
│   ├── ideas/            # Idea entities
│   └── events/           # Event entities
├── dashboards/           # Dataview-powered overview pages
├── inbox/                # Quick dumps before organizing
├── research/             # Deep research docs (entities extracted from here)
├── trips/                # Legacy trip docs (source material)
├── automations/          # Webhooks, loops, scripts, bots
├── data/                 # Snow data, metrics, tracked information
└── docs/plans/           # Design docs and planning
```

## How This Works

### The Ingestion Loop

A CI/cron job runs Claude Code periodically to organize content:

1. **Entity extraction** - Read raw content from inbox/, identify entities
2. **Match or create** - Fuzzy match against existing entities, create new ones, flag uncertain matches for review
3. **Create relationships** - Link entities together (person ↔ business ↔ place)
4. **Update source** - Add backlinks to original notes

### Loop Principles

- **Incremental organization** - Each run does a little bit of work, not everything
- **Convergence** - The system should stabilize over time
- **Change detection** - If nothing has changed since last run, or max iterations reached, stop
- **Progressive refinement** - More dumps = more updates = better organization

### On Manual Retrieval

When I ask for something:
- Search across all entities and content
- Synthesize answers from multiple sources
- Provide context about when/where information came from
- Surface related entities I might also want

### Synthesis for Planning

When a new Idea or Trip is created:
1. Pull existing knowledge (related people, places, businesses, past research)
2. Generate template sections (logistics, accommodations, activities)
3. Optionally enrich with external research

## Entity Frontmatter

Each entity has YAML frontmatter. See `docs/plans/2026-01-19-entity-first-knowledge-graph.md` for full schemas.

Example Person:
```yaml
---
type: person
name: John Doe
aliases: [Johnny]
businesses: [[Blue Bottle Shibuya]]
locations: [[Tokyo]]
last_contact: 2026-01-15
tags: [designer, friend]
---
```

## Notes

- Just dump into `/inbox` - the loop will extract entities
- Each entity gets one canonical file in `entities/<type>/`
- Cross-reference using `[[wikilinks]]`
- Dashboards provide at-a-glance views via Dataview queries
- Uncertain entity matches go to `inbox/_review.md` for manual resolution
