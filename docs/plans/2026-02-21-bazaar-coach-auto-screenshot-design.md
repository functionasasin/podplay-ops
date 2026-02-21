# Bazaar Coach Auto-Screenshot System

**Date:** 2026-02-21
**Status:** Approved
**Project:** projects/bazaar-coach

## Problem

Manually describing game state or pasting screenshots into Claude Code every time you want coaching advice is tedious and breaks flow. The Bazaar moves fast — you need advice quickly without stopping to capture and share your screen.

## Solution

A window-aware screenshot capture script that runs in the background, continuously saving timestamped screenshots of The Bazaar's game window. A Claude Code skill automatically reads all screenshots captured since the last coaching question, giving Claude a timeline of recent game events.

## Architecture

### Component 1: Screen Capture Script

**File:** `projects/bazaar-coach/tools/screen-capture.py`

- Uses `win32gui` to find The Bazaar window by title (configurable pattern)
- Captures the window's contents every **15 seconds** (configurable via CLI arg)
- Saves timestamped PNGs to `projects/bazaar-coach/.screenshots/`
  - Filename format: `capture-2026-02-21T15-32-01.png`
- Prints status line to stdout (e.g. `[15:32:01] Captured frame 47`)
- If window not found, waits and retries (doesn't crash)
- Exits cleanly on Ctrl+C

**Dependencies:** `pywin32`, `Pillow` (in `tools/requirements.txt`)

### Component 2: Cursor Tracking

**File:** `projects/bazaar-coach/.screenshots/cursor.json`

```json
{"last_read": "2026-02-21T15:32:01"}
```

- Tracks when Claude last read screenshots
- Updated each time the skill reads screenshots
- Used to determine which screenshots are "new" since last coaching interaction

### Component 3: Claude Code Skill Integration

**File:** `projects/bazaar-coach/.claude/skills/game-state/SKILL.md`

When user asks for coaching advice:
1. Read all screenshots with timestamps **after** `cursor.json`'s `last_read`
2. Cap at **10 most recent** screenshots (covers ~2.5 min at 15s intervals)
3. If more than 10 exist since last read, take the 10 most recent
4. Pass screenshots through Claude's vision to extract game state
5. Feed extracted state into existing coaching analysis framework
6. Update cursor to current timestamp
7. Clean up screenshots before the cursor

### Lifecycle & Cleanup

- Old screenshots (before cursor) are deleted on each read
- `.screenshots/` directory is `.gitignore`d — no game images in the repo
- Capture script is the only manual step: start it in a background terminal

## File Structure

```
projects/bazaar-coach/
├── tools/
│   ├── screen-capture.py      # Capture script
│   └── requirements.txt       # pywin32, Pillow
├── .screenshots/              # Gitignored, ephemeral
│   ├── cursor.json            # Read cursor
│   └── capture-*.png          # Timestamped screenshots
└── .claude/skills/
    └── game-state/SKILL.md    # Skill that auto-reads screenshots on ask
```

## User Workflow

1. Start capture: `python tools/screen-capture.py` (background terminal)
2. Play The Bazaar normally
3. In Claude Code terminal, just ask: "what should I buy?" / "analyze my board"
4. Claude reads recent screenshots, extracts state, gives recommendations
5. No manual screenshotting or game state description needed

## Design Decisions

- **Window-aware capture** over fixed-region: handles window movement/resizing
- **Timeline (since last ask)** over single snapshot: Claude sees game progression
- **Cap at 10 frames** over unlimited: prevents token waste on redundant frames
- **Cursor-based cleanup** over rolling buffer: aligns cleanup with actual usage pattern
- **Timestamped files** over numbered: unambiguous ordering, easy cursor comparison
