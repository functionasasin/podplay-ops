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
