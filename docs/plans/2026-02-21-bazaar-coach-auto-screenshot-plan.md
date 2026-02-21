# Bazaar Coach Auto-Screenshot Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Capture The Bazaar game window on demand when the user asks for coaching, so Claude can read game state visually without manual input.

**Architecture:** A one-shot Python script captures The Bazaar window via `win32gui`/`PrintWindow` and saves it to `.screenshots/latest.png`. A Claude Code skill runs this script, reads the image, and proceeds with coaching.

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

### Task 2: Create the one-shot capture script

**Files:**
- Create: `projects/bazaar-coach/tools/screen-capture.py`

**Step 1: Write the capture script**

```python
"""
Bazaar Coach Screen Capture

Finds The Bazaar game window and captures it once.
Saves to .screenshots/latest.png and exits.

Usage:
    python screen-capture.py                    # Default window title
    python screen-capture.py --title "Notepad"  # Custom window title
"""

import argparse
import ctypes
import sys
from pathlib import Path

try:
    import win32gui
    import win32ui
    from PIL import Image
except ImportError as e:
    print(f"Missing dependency: {e}")
    print("Run: pip install -r requirements.txt")
    sys.exit(1)


SCREENSHOTS_DIR = Path(__file__).parent.parent / ".screenshots"
OUTPUT_PATH = SCREENSHOTS_DIR / "latest.png"


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
        left, top, right, bottom = win32gui.GetClientRect(hwnd)
        width = right - left
        height = bottom - top

        if width <= 0 or height <= 0:
            return None

        hwnd_dc = win32gui.GetDC(hwnd)
        mfc_dc = win32ui.CreateDCFromHandle(hwnd_dc)
        save_dc = mfc_dc.CreateCompatibleDC()

        bitmap = win32ui.CreateBitmap()
        bitmap.CreateCompatibleBitmap(mfc_dc, width, height)
        save_dc.SelectObject(bitmap)

        # PrintWindow with PW_RENDERFULLCONTENT for reliable capture
        ctypes.windll.user32.PrintWindow(hwnd, save_dc.GetSafeHdc(), 3)

        bmpinfo = bitmap.GetInfo()
        bmpstr = bitmap.GetBitmapBits(True)
        img = Image.frombuffer(
            "RGB",
            (bmpinfo["bmWidth"], bmpinfo["bmHeight"]),
            bmpstr, "raw", "BGRX", 0, 1,
        )

        win32gui.DeleteObject(bitmap.GetHandle())
        save_dc.DeleteDC()
        mfc_dc.DeleteDC()
        win32gui.ReleaseDC(hwnd, hwnd_dc)

        return img
    except Exception as e:
        print(f"Capture error: {e}", file=sys.stderr)
        return None


def main():
    parser = argparse.ArgumentParser(description="Capture The Bazaar game window")
    parser.add_argument("--title", type=str, default="The Bazaar",
                        help="Window title to search for (default: 'The Bazaar')")
    args = parser.parse_args()

    hwnd = find_window(args.title)
    if hwnd is None:
        print(f"Window '{args.title}' not found.", file=sys.stderr)
        sys.exit(1)

    img = capture_window(hwnd)
    if img is None:
        print("Failed to capture window.", file=sys.stderr)
        sys.exit(1)

    SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    img.save(OUTPUT_PATH)
    print(OUTPUT_PATH)


if __name__ == "__main__":
    main()
```

On success, the script prints the output path to stdout and exits 0. On failure, it prints an error to stderr and exits 1.

**Step 2: Test with a known window**

Open Notepad. Run:
```bash
cd projects/bazaar-coach && python tools/screen-capture.py --title "Notepad"
```
Expected: Prints path to `.screenshots/latest.png`. Verify the PNG contains the Notepad window.

**Step 3: Test window-not-found case**

Run: `cd projects/bazaar-coach && python tools/screen-capture.py --title "NonexistentApp123"`
Expected: Prints error, exits with code 1.

**Step 4: Commit**

```bash
git add projects/bazaar-coach/tools/screen-capture.py
git commit -m "bazaar-coach: add one-shot window capture script"
```

---

### Task 3: Add .gitignore for screenshots

**Files:**
- Create: `projects/bazaar-coach/.gitignore`

**Step 1: Create .gitignore**

```
.screenshots/
```

**Step 2: Verify**

Run: `cd projects/bazaar-coach && mkdir -p .screenshots && touch .screenshots/test.png && git status`
Expected: `.screenshots/` does NOT appear in untracked files

**Step 3: Clean up and commit**

```bash
rm -rf projects/bazaar-coach/.screenshots/test.png
git add projects/bazaar-coach/.gitignore
git commit -m "bazaar-coach: gitignore screenshot output directory"
```

---

### Task 4: Create the game-state skill

**Files:**
- Create: `projects/bazaar-coach/.claude/skills/game-state/SKILL.md`

**Step 1: Write the skill**

```markdown
---
name: game-state
description: Capture and read the current game screen before making any recommendation. Invoke automatically when user asks for advice.
user-invocable: true
disable-model-invocation: false
---

# Game State from Screenshot

Capture The Bazaar's game window and analyze the current board state.

## Steps

1. **Capture the screen** — Run the capture script:
   ```
   python projects/bazaar-coach/tools/screen-capture.py
   ```
   - If it fails with "Window not found", tell the user The Bazaar needs to be open
   - The script saves to `projects/bazaar-coach/.screenshots/latest.png`

2. **Read the screenshot** — Use the Read tool on `projects/bazaar-coach/.screenshots/latest.png`
   - Claude's vision will see the game state in the image

3. **Extract game state** using the current-state skill's framework:
   - All board items (names, types, sizes, tiers, cooldowns)
   - Weapons vs non-weapons, aquatic items, friends, status effects
   - Stash/backpack contents
   - Active skills and enchantments
   - Key stats: Gold, income, prestige, day/hour, HP, regen
   - What the board needs: primary engine, weakest slot, highest marginal impact

4. **Give recommendations** — Proceed with the coaching advice the user asked for.

## Important

- ALWAYS capture a fresh screenshot before giving advice — don't rely on stale state
- If the user just wants to chat about strategy without needing current state, skip the capture
- The capture script finds The Bazaar window wherever it is on screen
```

**Step 2: Commit**

```bash
git add projects/bazaar-coach/.claude/skills/game-state/SKILL.md
git commit -m "bazaar-coach: add game-state skill for on-demand screenshot capture"
```

---

### Task 5: Update CLAUDE.md to reference the screenshot workflow

**Files:**
- Modify: `projects/bazaar-coach/CLAUDE.md`

**Step 1: Add screenshot section after line 8 (after "## How This Works" section, before "## When You Receive a Screenshot")**

Insert before the "## When You Receive a Screenshot" heading:

```markdown
## Auto-Screenshot Capture

When the user asks for advice, **capture a fresh screenshot first** by invoking the `game-state` skill. This runs a script that finds The Bazaar's window and captures it — no need to ask the user for a screenshot.

If The Bazaar isn't open (capture fails), fall back to asking the user for a screenshot or description.

```

**Step 2: Commit**

```bash
git add projects/bazaar-coach/CLAUDE.md
git commit -m "bazaar-coach: document auto-screenshot capture in CLAUDE.md"
```

---

### Task 6: End-to-end manual test

**No files to create — verification only.**

**Step 1: Test capture with a known window**

Open Notepad. In the bazaar-coach project:
```bash
python tools/screen-capture.py --title "Notepad"
```
Verify `.screenshots/latest.png` exists and contains Notepad.

**Step 2: Test the skill flow**

In a Claude Code session in the bazaar-coach project, ask "what should I buy?" and verify Claude:
- Runs the capture script
- Reads the resulting screenshot
- Analyzes the game state from the image

**Step 3: Test failure case**

Close Notepad/The Bazaar. Ask for advice again. Verify Claude reports the window wasn't found and asks for a manual screenshot.
