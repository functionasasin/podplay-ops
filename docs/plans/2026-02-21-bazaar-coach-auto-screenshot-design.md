# Bazaar Coach Auto-Screenshot System

**Date:** 2026-02-21
**Status:** Approved (revised)
**Project:** projects/bazaar-coach

## Problem

Manually describing game state or pasting screenshots into Claude Code every time you want coaching advice is tedious and breaks flow.

## Solution

A capture script that the game-state skill invokes on demand — when you ask for advice, Claude captures a screenshot of The Bazaar window right then, reads it, and gives recommendations. No background process, no intervals, no cleanup.

## Architecture

### Component 1: Screen Capture Script

**File:** `projects/bazaar-coach/tools/screen-capture.py`

- Uses `win32gui` to find The Bazaar window by title
- Captures that window's contents **once** and saves to a known path
- Exits immediately after capture (not a loop)
- Called by the game-state skill via Bash

**Dependencies:** `pywin32`, `Pillow` (in `tools/requirements.txt`)

### Component 2: Claude Code Skill

**File:** `projects/bazaar-coach/.claude/skills/game-state/SKILL.md`

When user asks for coaching advice:
1. Run `python tools/screen-capture.py` to capture the current game window
2. Read the output screenshot with Claude's vision
3. Extract game state and give recommendations

No cursor, no rolling buffer, no cleanup needed. One screenshot per ask, overwritten each time.

## File Structure

```
projects/bazaar-coach/
├── tools/
│   ├── screen-capture.py      # One-shot capture script
│   └── requirements.txt       # pywin32, Pillow
├── .screenshots/              # Gitignored
│   └── latest.png             # Overwritten each capture
└── .claude/skills/
    └── game-state/SKILL.md    # Skill that captures + reads on demand
```

## User Workflow

1. Play The Bazaar normally
2. In Claude Code terminal, ask: "what should I buy?" / "analyze my board"
3. Claude captures a screenshot, reads it, gives recommendations
4. No background process to manage

## Design Decisions

- **On-demand** over interval: simpler, no background process, captures exactly when needed
- **Window-aware capture** over fixed-region: handles window movement/resizing
- **Single overwrite** over timestamped files: only need current state, no cleanup needed
