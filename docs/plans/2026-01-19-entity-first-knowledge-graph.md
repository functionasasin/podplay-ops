# Entity-First Knowledge Graph Design

## Overview

Transform the monorepo into an entity-first knowledge graph where everything becomes a typed entity (Person, Place, Business, Trip, Meeting, Project, Idea, Event) with standardized frontmatter. The ingestion loop extracts entities from raw dumps, creates/updates their pages, and links them. This enables powerful synthesis and Obsidian-native browsing.

## Goals

1. **Easy capture** - Dump info anywhere, let automation organize it into entities
2. **Smart synthesis** - When planning (new trip, idea), pull together existing knowledge + generate templates + optionally enrich with external research
3. **At-a-glance views** - Obsidian vault with Dataview dashboards for people, places, upcoming trips/events
4. **Rich relationships** - Participation (who), location (where), temporal (when) links between all entities

## Entity Types

Eight core entity types:

| Type | Purpose | Key Relationships |
|------|---------|-------------------|
| Person | Someone you know or want to know | businesses, locations, met_through |
| Place | Location (city, neighborhood, spot) | parent hierarchy, coordinates |
| Business | Company, restaurant, shop, coworking | location, people, category |
| Trip | Planned or past journey | destinations, people, dates, status |
| Meeting | Conversation with date/attendees | attendees, location, project |
| Project | Work or personal initiative | people, places, related entities |
| Idea | Half-baked thought that might become something | related_places, related_people |
| Event | Conference, concert, time-bound happening | location, dates, related trips |

## Folder Structure

```
/monorepo
├── entities/
│   ├── people/
│   ├── places/
│   ├── businesses/
│   ├── trips/
│   ├── meetings/
│   ├── projects/
│   ├── ideas/
│   └── events/
├── dashboards/           # Dataview-powered overview pages
├── inbox/                # Raw dumps go here
├── research/             # Stays as-is, entities extracted from here
├── trips/                # Existing trip docs (source material)
├── automations/          # Loop scripts, webhooks
├── docs/plans/           # Design docs like this one
└── CLAUDE.md             # Repo context
```

## Entity Schemas

### Person
```yaml
---
type: person
name: John Doe
aliases: [Johnny, JD]
businesses: [[Blue Bottle Shibuya]]
locations: [[Tokyo]]
met_through: [[Japan 2026]]
last_contact: 2026-01-15
tags: [designer, friend]
---
```

### Place
```yaml
---
type: place
name: Tokyo
parent: [[Japan]]
coordinates: [35.6762, 139.6503]
tags: [city, visited]
---
```

### Business
```yaml
---
type: business
name: Blue Bottle Shibuya
category: cafe
location: [[Shibuya]], [[Tokyo]]
people: [[John Doe]]
tags: [coffee, design-spot]
---
```

### Trip
```yaml
---
type: trip
name: Japan 2026
status: planning
dates: [2026-03-01, 2026-03-15]
destinations: [[Tokyo]], [[Kyoto]]
people: [[John Doe]]
tags: [vacation, solo]
---
```

### Meeting
```yaml
---
type: meeting
date: 2026-01-15
attendees: [[John Doe]], [[Jane Smith]]
location: [[Blue Bottle Shibuya]]
project: [[Knowledge Base System]]
tags: [coffee-chat, planning]
---
```

### Project
```yaml
---
type: project
name: Knowledge Base System
status: active
start_date: 2026-01-10
people: [[John Doe]]
places: [[Tokyo]]
related: [[Japan 2026]]
tags: [personal, automation]
---
```

### Idea
```yaml
---
type: idea
name: Diving Indonesia
status: seed
related_places: [[Bali]], [[Komodo]]
related_people: [[Jane Smith]]
tags: [travel, diving, someday]
---
```

### Event
```yaml
---
type: event
name: Tokyo Design Week 2026
dates: [2026-10-15, 2026-10-22]
location: [[Tokyo]]
status: interested
related: [[Japan 2026]]
tags: [design, conference]
---
```

## Ingestion Loop

### Step 1: Entity Extraction
The loop reads raw content from `inbox/` and other directories, identifying entities:
```
"Had coffee with John at Blue Bottle in Shibuya.
He mentioned Tokyo Design Week might be worth checking out."
```
→ Extracts: Person(John), Business(Blue Bottle), Place(Shibuya), Event(Tokyo Design Week)

### Step 2: Match or Create
For each extracted entity:
- Fuzzy match against existing entities (John = John Doe?)
- If confident match → update that entity's file
- If new → create new entity file with extracted info
- If uncertain → flag for manual review in `inbox/_review.md`

### Step 3: Create Relationships
- Creates Meeting entity for the coffee chat
- Links John ↔ Blue Bottle ↔ Shibuya
- Links Tokyo Design Week → mentioned_by: John

### Step 4: Update Source
- Adds backlinks to the original note
- Optionally moves processed content out of inbox

### Trigger Options
- CI/cron runs periodically (current loop model)
- Git hook on commit
- Manual `/organize` command

## Synthesis for Planning

When you create a new Idea or Trip with minimal info, the synthesis loop:

1. **Pulls existing knowledge:**
   - People connected to relevant places/topics
   - Businesses you've saved in those locations
   - Past research or notes mentioning these places

2. **Generates template sections:**
   ```markdown
   ## Logistics
   - Visa: (to research)
   - Flights: (to research)

   ## Accommodations
   - (to research)

   ## Coworking/Remote Work
   - [[Dojo Bali]] - saved 2025-06, tagged #coworking

   ## People
   - [[Jane Smith]] - mentioned diving in Komodo
   ```

3. **Optionally enriches externally:** (future phase)
   - Fetches relevant external info
   - Adds as research notes linked to the idea

## Obsidian Integration

### Dashboards

`dashboards/people.md`:
```dataview
TABLE
  businesses as "Works At",
  last_contact as "Last Contact",
  locations as "Based In"
FROM "entities/people"
SORT last_contact DESC
```

`dashboards/upcoming.md`:
```dataview
TABLE
  dates as "When",
  destinations as "Where",
  status as "Status"
FROM "entities/trips" OR "entities/events"
WHERE dates[0] >= date(today)
SORT dates[0] ASC
```

### Graph View
Obsidian's native graph shows clusters naturally - trips connected to places, connected to businesses, connected to people.

### Backlinks
Each entity page shows auto-generated backlinks revealing all connections.

## Status Values

Consistent status vocabulary across entity types:

| Entity | Statuses |
|--------|----------|
| Trip | idea, planning, booked, active, completed |
| Project | idea, active, paused, completed |
| Idea | seed, exploring, ready, shelved |
| Event | interested, attending, attended, skipped |

## Implementation Phases

1. **Phase 1**: Create folder structure, entity templates, dashboards
2. **Phase 2**: Migrate existing content (trips/, research/) into entities
3. **Phase 3**: Build ingestion loop for inbox processing
4. **Phase 4**: Add synthesis capabilities for new ideas/trips
5. **Phase 5**: External enrichment integration
