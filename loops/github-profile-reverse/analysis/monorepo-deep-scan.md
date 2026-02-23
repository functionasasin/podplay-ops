# Monorepo Deep Scan

## Summary

The monorepo is a comprehensive personal operating system containing 1,034 structured entities, 4 autonomous analysis/development loops, an always-on Telegram bot, 8,500+ lines of technical specs, and a CI/CD pipeline that runs autonomous research every 30 minutes. None of this is visible from the public GitHub profile — it represents 3-6 months of serious engineering work that is completely hidden.

## Key Systems

### 1. Ralph Loops — Autonomous Analysis & Development Infrastructure

A generalized framework for turning ideas into executable specifications through repeated Claude Code invocations, with CI/CD integration.

**Active Loops (4 total):**

| Loop | Status | Description |
|------|--------|-------------|
| anime-recap-reverse | CONVERGED (22 iterations) | Reverse-engineered a 75-min anime recap video into 50+ quantitative parameters and a 2,652-line software spec |
| anime-recap-forward | ACTIVE (stage 2) | Building the anime recap engine from the spec, stage-by-stage with test-first approach |
| github-profile-reverse | ACTIVE (2/12 aspects) | This loop — auditing GitHub profile for "dangerous builder" persona spec |
| linkedin-profile-reverse | ACTIVE (3+ aspects) | Mining monorepo + private work for LinkedIn profile overhaul |

**Architecture:**
- **Reverse Ralph** (analysis agent) → produces executable spec
- **Forward Ralph** (development agent) → builds from spec
- Frontier-driven execution: one aspect per iteration, dependency ordering (Wave 1→2→3)
- File-based convergence detection (`status/converged.txt` stops CI automatically)
- CI workflow discovers active loops from `loops/_registry.yaml`, runs them concurrently via GitHub Actions matrix strategy

**Key Insight:** This is a meta-system — a generalized framework for autonomous research + development that could apply to any software project. It's not visible in any public repo.

### 2. Entity-First Knowledge Graph — 1,034 Structured Entities

A queryable, relationship-aware database for everything in life. NOT note-taking — a structured knowledge graph with typed entities and standardized frontmatter.

**Entity Breakdown:**

| Type | Count | Examples |
|------|-------|---------|
| Places | 983 | Restaurants, hotels, ski resorts, attractions across Japan, Thailand, Philippines, USA, Europe, UAE |
| Trips | 21 | Planned/past journeys with location links, costs, dates, action items |
| People | 17 | Team members, investors, collaborators with last-contact dates, relationships |
| Projects | 4 | Pod Play SEA, Digital Wallet, Ping Pod Asia Franchise, Anime Highlight Generator |
| Businesses | 4 | Pod Play, Magpie, Ping Pod, Central Group |
| Meetings | 4 | Logged conversations with attendees, decisions, action items |
| Activities | 1 | Organized activity type |

**Features:**
- Wikilink relationships enable queries like "all meetings involving Carlos" or "restaurants near this trip location"
- 8 Dataview-powered dashboards for real-time querying
- Git is the database — every entity update is a commit, no external DB
- Dual write paths: OpenClaw bot (always-on) + ingestion loop (periodic)

**Key Insight:** Most people use 5 separate tools (CRM, Notion, Google Maps, calendar, Slack). This fuses them into one queryable system with relationships.

### 3. OpenClaw Telegram Bot — Always-On Entity Ingestion

An always-on AI assistant deployed on Fly.io that lives in Telegram.

**Skills (4):**
1. **monorepo-ingest** — Parse text → identify entity type → create/update entity files → auto-commit
2. **email-ingest** — Pull Outlook emails (2x daily) → extract person/meeting/action-item entities → persist
3. **git-sync** — Keep local clone in sync with remote (every 15 minutes)
4. **podplay-briefing** — Daily morning status report (cron-triggered)

**Architecture:** Telegram interface → Claude API → entity extraction → git commit → push to monorepo

**Key Insight:** This is NOT a chatbot. It's a specialized entity-extraction + knowledge-base-update engine that auto-commits to git. Nobody does this.

### 4. Anime Recap Engine — Research-Level Video Analysis

Reverse-engineered a 75-minute anime recap video through 13 analysis passes:
- narration-transcript, scene-boundaries, audio-profile, audio-layers (Demucs separation)
- anime-dialogue-moments, music-patterns, pacing-metrics, clip-duration-stats
- narration-style, script-structure, hook-pattern, transition-phrases, scene-type-distribution

**Output:** 2,652-line specification with 7 pipeline stages, 50+ quantitative parameters, and 79 pass/36 fail validation criteria.

**Forward engine scaffolded** in `automations/anime-recap-engine/` with CLI stages: ingest, script, match, narrate, moments, mix, render, validate. Stage 1 tests passing.

**Key Insight:** Formalizing intuitions from a video into a mathematical specification that any developer or AI could execute. Research-level video analysis + software architecture discipline.

### 5. Design Documents — 15 Deep Technical Plans (8,500+ lines)

All from Feb 2026:

| Spec | Lines | Domain |
|------|-------|--------|
| anime-recap-engine-spec.md | 2,652 | Video processing pipeline |
| anime-highlight-engine-spec.md | 1,206 | Alternate anime pipeline |
| forward-ralph-implementation.md | 755 | Development agent pattern |
| ralph-loop-registry-implementation.md | 768 | Autonomous loop CI/CD |
| bazaar-ev-engine-design.md | 690 | Game AI coaching |
| reverse-ralph-loop-design.md + impl | 933 | Analysis loop pattern |
| entity-first-knowledge-graph.md | 262 | Personal OS design |
| forward-ralph-loop-design.md | 264 | Dev agent architecture |
| ralph-loop-registry-design.md | 193 | Loop system design |
| bazaar-coach-* (3 docs) | 504 | Game AI POC + screenshots |
| dota-coach-design.md | 121 | Game AI coaching |

**Key Insight:** Spec-first development at personal-project scale. Most engineers wing it. This person writes detailed specifications before building.

### 6. Bazaar Coach — Game AI Coaching System

A complete game AI coaching system in `projects/bazaar-coach/`:
- 10 subdirectories: brainstorms, heroes, items, mechanics, meta, skills, knowledge, strategy, tools
- Custom CLAUDE.md system prompt (13,143 bytes)
- POC design, EV engine design, auto-screenshot automation
- Integrates computer vision (screenshot capture) + game knowledge base + strategy analysis

### 7. CI/CD Automation

`.github/workflows/ralph-loops.yml` (152 lines):
- **Discover phase** — Parses `loops/_registry.yaml`, emits JSON matrix of active loops
- **Run phase** — Runs each loop in parallel via matrix strategy, 35-min timeout
- **Commit phase** — Auto-commits loop output (atomic per iteration)
- **Convergence phase** — Detects convergence markers, creates GitHub issues, updates registry
- **Manual override** — `workflow_dispatch` for on-demand loop execution

Triggers: Every 30 minutes via cron + manual dispatch.

### 8. Active Business/Tech Projects

| Project | Domain | Key Detail |
|---------|--------|------------|
| Pod Play Southeast Asia | Sports franchise | Multi-country ops, 5-person team, Singapore HQ planning |
| Digital Wallet | Fintech | Stored-value wallet on booking system, Stripe + Magpie API, cross-venue credits |
| Anime Highlight Generator | ML/CV | Being reverse-engineered into spec via ralph loop |
| Ping Pod Asia Franchise | Sports franchise | Distribution operations |

## What Would Impress a Technical Person

1. **Autonomous loops running in CI** — A generalized framework where analysis agents produce specs and building agents execute them, running every 30 minutes unattended
2. **1,034-entity knowledge graph** — Not notes. A typed, relationship-aware, queryable database for an entire life
3. **Always-on Telegram bot** that extracts entities from natural language and auto-commits to git
4. **Research-level video analysis** formalized into a 2,652-line executable specification with 50+ quantitative parameters
5. **8,500+ lines of specs written in one month** — Spec-first development discipline at personal-project scale
6. **Simultaneous operation across domains** — Sports franchises, fintech, video analysis, game AI, autonomous agents, knowledge systems

## Capabilities Completely Invisible from GitHub Profile

- Ralph loops (autonomous research/development framework)
- Entity-first knowledge graph (1,034 entities)
- OpenClaw bot (always-on entity ingestion)
- Anime recap engine (reverse-engineered video analysis pipeline)
- All 15 design documents
- Bazaar Coach game AI system
- CI/CD automation for autonomous loops
- Business operations (Pod Play, Digital Wallet, Ping Pod)
- Private org work (pymc-labs decision-orchestrator, nuts-and-bolts-ai cheerful)

## Numbers

| Metric | Value |
|--------|-------|
| Total entities | 1,034 |
| Active ralph loops | 4 (2 converged) |
| Lines of technical specs | 8,500+ |
| Bot skills | 4 |
| Design documents | 15 |
| Active projects | 4 |
| Git commits | 189 |
| CI trigger frequency | Every 30 minutes |
| Private org products | 2 (1,000+ commits combined) |
