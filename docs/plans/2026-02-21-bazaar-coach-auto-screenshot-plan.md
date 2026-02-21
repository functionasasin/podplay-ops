# Bazaar Coach Auto-Screenshot Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Auto-capture The Bazaar game window at intervals so Claude can read game state from screenshots without manual input.

**Architecture:** A Python script uses `win32gui`/`win32ui` to find and capture The Bazaar's window every 15s, saving timestamped PNGs. A cursor file tracks what Claude has already seen. A Claude Code skill reads new screenshots automatically when the user asks for coaching.

**Tech Stack:** Python 3, pywin32, Pillow

---

### Task 1: Create tools directory and dependencies

**Files:**
- Create: `projects/bazaar-coach/tools/requirements.txt`

**Step 1: Create requirements.txt**

```txt
pywin32>=306
Pillow>=10.0
```

**Step 2: Install dependencies**

Run: `pip install -r projects/bazaar-coach/tools/requirements.txt`
Expected: Successfully installed pywin32 and Pillow

**Step 3: Commit**

```bash
git add projects/bazaar-coach/tools/requirements.txt
git commit -m "bazaar-coach: add screen capture dependencies"
```

---

### Task 2: Create the screen capture script

**Files:**
- Create: `projects/bazaar-coach/tools/screen-capture.py`

**Step 1: Write the capture script**

```python
"""
Bazaar Coach Screen Capture

Finds The Bazaar game window and captures it at regular intervals.
Screenshots are saved as timestamped PNGs for Claude to read.

Usage:
    python screen-capture.py              # Default 15s interval
    python screen-capture.py --interval 10  # Custom interval
    python screen-capture.py --title "The Bazaar"  # Custom window title
"""

import argparse
import ctypes
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

try:
    import win32gui
    import win32ui
    import win32con
    from PIL import Image
except ImportError as e:
    print(f"Missing dependency: {e}")
    print("Run: pip install -r requirements.txt")
    sys.exit(1)


SCREENSHOTS_DIR = Path(__file__).parent.parent / ".screenshots"


def find_window(title_pattern: str) -> int | None:
    """Find a window whose title contains the given pattern (case-insensitive)."""
    result = []
    pattern_lower = title_pattern.lower()

    def enum_callback(hwnd, _):
        if win32gui.IsWindowVisible(hwnd):
            title = win32gui.GetWindowText(hwnd)
            if pattern_lower in title.lower():
                result.append(hwnd)

    win32gui.EnumWindows(enum_callback, None)
    return result[0] if result else None


def capture_window(hwnd: int) -> Image.Image | None:
    """Capture the contents of a window by its handle."""
    try:
        # Get window dimensions
        left, top, right, bottom = win32gui.GetClientRect(hwnd)
        width = right - left
        height = bottom - top

        if width <= 0 or height <= 0:
            return None

        # Set up device contexts
        hwnd_dc = win32gui.GetDC(hwnd)
        mfc_dc = win32ui.CreateDCFromHandle(hwnd_dc)
        save_dc = mfc_dc.CreateCompatibleDC()

        # Create bitmap
        bitmap = win32ui.CreateBitmap()
        bitmap.CreateCompatibleBitmap(mfc_dc, width, height)
        save_dc.SelectObject(bitmap)

        # Use PrintWindow for reliable capture (works even if partially occluded)
        ctypes.windll.user32.PrintWindow(hwnd, save_dc.GetSafeHdc(), 3)

        # Convert to PIL Image
        bmpinfo = bitmap.GetInfo()
        bmpstr = bitmap.GetBitmapBits(True)
        img = Image.frombuffer(
            "RGB",
            (bmpinfo["bmWidth"], bmpinfo["bmHeight"]),
            bmpstr, "raw", "BGRX", 0, 1,
        )

        # Cleanup
        win32gui.DeleteObject(bitmap.GetHandle())
        save_dc.DeleteDC()
        mfc_dc.DeleteDC()
        win32gui.ReleaseDC(hwnd, hwnd_dc)

        return img
    except Exception as e:
        print(f"  Capture error: {e}")
        return None


def timestamp() -> str:
    """ISO-like timestamp safe for filenames."""
    return datetime.now().strftime("%Y-%m-%dT%H-%M-%S")


def run(interval: int, title_pattern: str):
    """Main capture loop."""
    SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Bazaar Coach Screen Capture")
    print(f"  Window pattern: '{title_pattern}'")
    print(f"  Interval: {interval}s")
    print(f"  Output: {SCREENSHOTS_DIR}")
    print(f"  Press Ctrl+C to stop\n")

    frame = 0
    while True:
        hwnd = find_window(title_pattern)
        if hwnd is None:
            now = datetime.now().strftime("%H:%M:%S")
            print(f"  [{now}] Waiting for '{title_pattern}' window...")
            time.sleep(3)
            continue

        img = capture_window(hwnd)
        if img is None:
            time.sleep(interval)
            continue

        frame += 1
        ts = timestamp()
        filepath = SCREENSHOTS_DIR / f"capture-{ts}.png"
        img.save(filepath)

        now = datetime.now().strftime("%H:%M:%S")
        print(f"  [{now}] Captured frame {frame} -> {filepath.name}")

        time.sleep(interval)


def main():
    parser = argparse.ArgumentParser(description="Capture The Bazaar game window")
    parser.add_argument("--interval", type=int, default=15, help="Seconds between captures (default: 15)")
    parser.add_argument("--title", type=str, default="The Bazaar", help="Window title to search for (default: 'The Bazaar')")
    args = parser.parse_args()

    try:
        run(args.interval, args.title)
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
```

**Step 2: Test that the script starts and waits for a window**

Run: `cd projects/bazaar-coach && python tools/screen-capture.py --interval 5`
Expected: Prints header and "Waiting for 'The Bazaar' window..." (Ctrl+C to stop)

**Step 3: Test with a known window to verify capture works**

Run: `cd projects/bazaar-coach && python tools/screen-capture.py --title "Notepad" --interval 3`
Expected: If Notepad is open, captures frames. Verify `.screenshots/capture-*.png` files are created and contain the Notepad window content.

**Step 4: Commit**

```bash
git add projects/bazaar-coach/tools/screen-capture.py
git commit -m "bazaar-coach: add window-aware screen capture script"
```

---

### Task 3: Add .gitignore for screenshots

**Files:**
- Create: `projects/bazaar-coach/.gitignore`

**Step 1: Create .gitignore**

```
.screenshots/
```

**Step 2: Verify screenshots dir won't be tracked**

Run: `cd projects/bazaar-coach && mkdir -p .screenshots && touch .screenshots/test.png && git status`
Expected: `.screenshots/` does NOT appear in untracked files

**Step 3: Clean up and commit**

```bash
rm -rf projects/bazaar-coach/.screenshots/test.png
git add projects/bazaar-coach/.gitignore
git commit -m "bazaar-coach: gitignore screenshot output directory"
```

---

### Task 4: Create the game-state skill with auto-screenshot reading

**Files:**
- Create: `projects/bazaar-coach/.claude/skills/game-state/SKILL.md`

This skill replaces the manual screenshot workflow. When invoked, it:
1. Reads `.screenshots/cursor.json` to find when Claude last looked
2. Finds all `capture-*.png` files newer than the cursor
3. Caps at 10 most recent
4. Reads them with the Read tool (Claude's vision handles PNG)
5. Updates the cursor
6. Deletes old screenshots (before cursor)

**Step 1: Write the skill**

```markdown
---
name: game-state
description: Automatically read recent game screenshots and analyze board state. Use this before any coaching recommendation. Invoke automatically when user asks for advice.
user-invocable: true
disable-model-invocation: false
---

# Game State from Screenshots

Read the latest screenshots captured by the screen capture script to understand the current game state.

## Prerequisites

The screen capture script must be running in a background terminal:
```
python projects/bazaar-coach/tools/screen-capture.py
```

## Steps

1. **Read the cursor file** at `projects/bazaar-coach/.screenshots/cursor.json`
   - If it doesn't exist, this is the first read — treat all screenshots as new
   - The file contains: `{"last_read": "2026-02-21T15-32-01"}`

2. **List screenshot files** with Glob: `projects/bazaar-coach/.screenshots/capture-*.png`
   - Filter to only files with timestamps AFTER `last_read` from cursor
   - The timestamp is embedded in the filename: `capture-YYYY-MM-DDTHH-MM-SS.png`
   - If more than 10 new screenshots, take only the 10 most recent (by filename sort)
   - If zero new screenshots, tell the user no new captures are available

3. **Read the screenshots** using the Read tool on each PNG file (newest last)
   - Claude's vision will see the game state in each image
   - Note changes between frames (new items bought, battles fought, gold spent)

4. **Update the cursor** — Write `cursor.json` with the timestamp of the newest screenshot read:
   ```json
   {"last_read": "2026-02-21T15-47-16"}
   ```

5. **Clean up old screenshots** — Use Bash to delete all `capture-*.png` files with timestamps before the new cursor value. Keep the ones at or after the cursor.

6. **Synthesize the game state** using the current-state skill's framework:
   - List all board items (names, types, sizes, tiers, cooldowns)
   - Count weapons vs non-weapons, aquatic items, friends, status effects
   - List stash/backpack contents
   - Note active skills and enchantments
   - Key stats: Gold, income, prestige, day/hour, HP, regen
   - Identify what the board needs (primary engine, weakest slot, highest marginal impact)

7. **Proceed with coaching** — Now give the user the recommendation they asked for, informed by the visual game state.

## Important

- ALWAYS read screenshots before giving advice — don't ask the user to describe their board
- If the capture script isn't running (no .screenshots dir or no files), tell the user to start it
- The screen capture script finds The Bazaar window automatically — it handles window movement
- Screenshots are taken every 15 seconds by default
```

**Step 2: Verify the skill file is well-formed**

Run: `cd projects/bazaar-coach && cat .claude/skills/game-state/SKILL.md | head -5`
Expected: Shows the YAML frontmatter header

**Step 3: Commit**

```bash
git add projects/bazaar-coach/.claude/skills/game-state/SKILL.md
git commit -m "bazaar-coach: add game-state skill for auto-screenshot reading"
```

---

### Task 5: Update CLAUDE.md to reference auto-screenshot workflow

**Files:**
- Modify: `projects/bazaar-coach/CLAUDE.md`

**Step 1: Add screenshot workflow section to CLAUDE.md**

After the existing "## When You Receive a Screenshot" section, add a new section that tells Claude about the auto-screenshot system. The key change: Claude should check for recent screenshots FIRST before asking the user for a screenshot.

Add this section after line 9 (before the numbered steps):

```markdown
## Auto-Screenshot System

A background script captures The Bazaar's game window every 15 seconds. Before asking the user for a screenshot or game state description, **always check for recent captures first** by invoking the `game-state` skill.

**Setup:** User runs `python tools/screen-capture.py` in a background terminal.

**Workflow:** When the user asks for advice, the game-state skill reads all screenshots captured since the last coaching question (up to 10), extracts the game state visually, then proceeds with recommendations.

If no screenshots are available (script not running), fall back to asking the user for a screenshot or description.

```

**Step 2: Commit**

```bash
git add projects/bazaar-coach/CLAUDE.md
git commit -m "bazaar-coach: document auto-screenshot workflow in CLAUDE.md"
```

---

### Task 6: End-to-end manual test

**No files to create — this is a verification task.**

**Step 1: Start the capture script with a test window**

Open Notepad (or any window). Run:
```bash
cd projects/bazaar-coach && python tools/screen-capture.py --title "Notepad" --interval 5
```
Wait for 3-4 captures.

**Step 2: Verify screenshots exist**

Run: `ls projects/bazaar-coach/.screenshots/capture-*.png`
Expected: 3-4 timestamped PNG files

**Step 3: Verify the game-state skill can read them**

In a separate Claude Code session in the bazaar-coach project, ask for coaching. Verify Claude:
- Finds and reads the screenshot files
- Creates/updates `cursor.json`
- Cleans up old screenshots after reading

**Step 4: Verify cursor works across asks**

Wait for more captures, then ask again. Verify Claude only reads the NEW screenshots (after the cursor).

**Step 5: Stop capture script (Ctrl+C), verify clean exit**
