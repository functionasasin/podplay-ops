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


def capture_window(hwnd: int, force_width: int = 0, force_height: int = 0) -> Image.Image | None:
    """Capture the window's screen region for accurate results with GPU-rendered apps."""
    try:
        # Use GetWindowRect to find the window position, then capture a fixed region
        left, top, right, bottom = win32gui.GetWindowRect(hwnd)
        width = force_width if force_width > 0 else right - left
        height = force_height if force_height > 0 else bottom - top

        if width <= 0 or height <= 0:
            return None

        # Capture from the desktop DC (screen) at the window's position
        desktop_dc = win32gui.GetDC(0)
        mfc_dc = win32ui.CreateDCFromHandle(desktop_dc)
        save_dc = mfc_dc.CreateCompatibleDC()

        bitmap = win32ui.CreateBitmap()
        bitmap.CreateCompatibleBitmap(mfc_dc, width, height)
        save_dc.SelectObject(bitmap)

        # BitBlt from screen at the window's position
        save_dc.BitBlt((0, 0), (width, height), mfc_dc, (left, top), 0x00CC0020)  # SRCCOPY

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
        win32gui.ReleaseDC(0, desktop_dc)

        return img
    except Exception as e:
        print(f"Capture error: {e}", file=sys.stderr)
        return None


def main():
    parser = argparse.ArgumentParser(description="Capture The Bazaar game window")
    parser.add_argument("--title", type=str, default="The Bazaar",
                        help="Window title to search for (default: 'The Bazaar')")
    parser.add_argument("--width", type=int, default=1280,
                        help="Capture width in pixels (default: 1280)")
    parser.add_argument("--height", type=int, default=800,
                        help="Capture height in pixels (default: 800)")
    args = parser.parse_args()

    hwnd = find_window(args.title)
    if hwnd is None:
        print(f"Window '{args.title}' not found.", file=sys.stderr)
        sys.exit(1)

    img = capture_window(hwnd, args.width, args.height)
    if img is None:
        print("Failed to capture window.", file=sys.stderr)
        sys.exit(1)

    SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    img.save(OUTPUT_PATH)
    print(OUTPUT_PATH)


if __name__ == "__main__":
    main()
