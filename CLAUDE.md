# Monorepo - Personal Knowledge Base

## Purpose

This repository is a centralized dumping ground for everything across my life and work. The primary goal is to provide **at-a-glance status** of projects, meetings, and ongoing work. It's an **ingestion and convergent organization system** - I dump information here continuously, and automated loops progressively organize it.

## What Goes Here

- **Automation**: Automated loops, webhooks, scripts, bots
- **Meeting Trackers**: Notes and trackers from meetings across all businesses I'm part of
- **Work Context**: What I'm currently working on, project status, priorities
- **Research**: Trip planning, event research, things I'm looking into
- **Data**: Snow data, metrics, any data I want to track
- **Anything else**: If I need to remember it or reference it later, it goes here

## How This Works

### The Loop Model

A CI/cron job runs Claude Code periodically to organize content. The key principles:

1. **Incremental organization** - Each run does a little bit of work, not everything
2. **Convergence** - The system should stabilize over time
3. **Change detection** - If nothing has changed since last run, or max iterations reached, stop
4. **Progressive refinement** - More dumps = more updates = better organization

### On Each Loop Run
- Check what's new or changed since last run
- Do a small amount of organization work
- Update status summaries and cross-references
- Track iteration count and changes made
- Exit early if converged (no changes) or max iterations hit

### On Manual Retrieval (when I ask for something)
- Search across all content to find relevant information
- Synthesize answers from multiple sources if needed
- Provide context about when/where information came from
- Surface related information I might also want

## Structure

```
/monorepo
├── claude.md           # This file - repo context for Claude
├── automations/        # Webhooks, loops, scripts, bots
├── meetings/           # Meeting notes and trackers by business/project
├── projects/           # Active work and project context
├── research/           # Trip planning, event research, explorations
├── data/               # Snow data, metrics, tracked information
└── inbox/              # Quick dumps before organizing
```

## Notes

- Just dump into `/inbox` or relevant directories - don't worry about perfect organization
- The loop will progressively organize and refine
- Cross-reference liberally - information often relates across categories
- Status summaries should bubble up to make "at a glance" review easy
