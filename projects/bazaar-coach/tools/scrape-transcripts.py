#!/usr/bin/env python3
"""Scrape YouTube video transcripts for The Bazaar content creators.

Usage:
    # Scrape all channels in the default list
    python scrape-transcripts.py

    # Scrape a specific channel
    python scrape-transcripts.py --channel "https://www.youtube.com/@ChannelName"

    # Scrape a specific video
    python scrape-transcripts.py --video "https://www.youtube.com/watch?v=VIDEO_ID"

    # Scrape a playlist
    python scrape-transcripts.py --playlist "https://www.youtube.com/playlist?list=PLAYLIST_ID"

    # Limit number of videos per channel
    python scrape-transcripts.py --max-videos 10

    # Filter by keyword in title (only scrape videos mentioning these terms)
    python scrape-transcripts.py --filter "vanessa,pygmalien,dooley"

Transcripts are saved to projects/bazaar-coach/knowledge/transcripts/
"""

import argparse
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

try:
    from youtube_transcript_api import YouTubeTranscriptApi
except ImportError:
    print("ERROR: youtube-transcript-api not installed. Run: pip install youtube-transcript-api")
    sys.exit(1)


SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
TRANSCRIPTS_DIR = PROJECT_DIR / "knowledge" / "transcripts"
CHANNELS_FILE = PROJECT_DIR / "knowledge" / "channels.json"

# Default channels to scrape — top Bazaar content creators
DEFAULT_CHANNELS = [
    {
        "name": "Kripparrian",
        "url": "https://www.youtube.com/@Kripparrian",
        "notes": "Top ranked player, tier lists, meta analysis"
    },
    {
        "name": "Rhapsody",
        "url": "https://www.youtube.com/@RhapsodyPlays",
        "notes": "Meta-breaking strategies, analytical breakdowns"
    },
    {
        "name": "Shurkou",
        "url": "https://www.youtube.com/@shurkoubazaar",
        "notes": "PvP strategies, leaderboard climbs, 10-win guides"
    },
    {
        "name": "BuffWolf",
        "url": "https://www.youtube.com/@BuffwolfGaming",
        "notes": "Patch note deep dives, balance analysis"
    },
    {
        "name": "Northernlion",
        "url": "https://www.youtube.com/@Northernlion",
        "notes": "Popular streamer, strategic commentary"
    },
    {
        "name": "BudgetBrew",
        "url": "https://www.youtube.com/@BudgetBrewBazaar",
        "notes": "Budget builds, educational content"
    },
    {
        "name": "SuperAutoGaming",
        "url": "https://www.youtube.com/@SuperAutoGaming",
        "notes": "Auto-battler specialist"
    },
    {
        "name": "Nidhogg",
        "url": "https://www.youtube.com/@Nidhogg369",
        "notes": "Competitive Bazaar content"
    },
    {
        "name": "ItsBen321",
        "url": "https://www.youtube.com/@ItsBen321",
        "notes": "Bazaar guides and gameplay"
    },
    {
        "name": "Retromation",
        "url": "https://www.youtube.com/@Retromation",
        "notes": "Roguelike specialist, strategy breakdowns"
    },
]


def extract_video_id(url: str) -> str | None:
    """Extract video ID from various YouTube URL formats."""
    patterns = [
        r'(?:v=|/v/|youtu\.be/)([a-zA-Z0-9_-]{11})',
        r'(?:embed/)([a-zA-Z0-9_-]{11})',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def get_channel_videos(channel_url: str, max_videos: int = 50) -> list[dict]:
    """Get list of videos from a YouTube channel using yt-dlp."""
    print(f"  Fetching video list from {channel_url}...")

    # Use yt-dlp to get video metadata without downloading
    cmd = [
        "yt-dlp",
        "--flat-playlist",
        "--dump-json",
        "--no-download",
        "--playlist-end", str(max_videos),
        f"{channel_url}/videos",
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        if result.returncode != 0:
            print(f"  WARNING: yt-dlp failed: {result.stderr[:200]}")
            return []

        videos = []
        for line in result.stdout.strip().split("\n"):
            if not line:
                continue
            try:
                data = json.loads(line)
                videos.append({
                    "id": data.get("id", ""),
                    "title": data.get("title", "Unknown"),
                    "url": data.get("url", f"https://www.youtube.com/watch?v={data.get('id', '')}"),
                    "duration": data.get("duration"),
                    "view_count": data.get("view_count"),
                    "upload_date": data.get("upload_date"),
                })
            except json.JSONDecodeError:
                continue

        print(f"  Found {len(videos)} videos")
        return videos

    except subprocess.TimeoutExpired:
        print("  WARNING: yt-dlp timed out")
        return []


def get_playlist_videos(playlist_url: str, max_videos: int = 50) -> list[dict]:
    """Get list of videos from a YouTube playlist using yt-dlp."""
    print(f"  Fetching playlist from {playlist_url}...")

    cmd = [
        "yt-dlp",
        "--flat-playlist",
        "--dump-json",
        "--no-download",
        "--playlist-end", str(max_videos),
        playlist_url,
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        if result.returncode != 0:
            print(f"  WARNING: yt-dlp failed: {result.stderr[:200]}")
            return []

        videos = []
        for line in result.stdout.strip().split("\n"):
            if not line:
                continue
            try:
                data = json.loads(line)
                videos.append({
                    "id": data.get("id", ""),
                    "title": data.get("title", "Unknown"),
                    "url": data.get("url", f"https://www.youtube.com/watch?v={data.get('id', '')}"),
                    "duration": data.get("duration"),
                    "view_count": data.get("view_count"),
                    "upload_date": data.get("upload_date"),
                })
            except json.JSONDecodeError:
                continue

        print(f"  Found {len(videos)} videos")
        return videos

    except subprocess.TimeoutExpired:
        print("  WARNING: yt-dlp timed out")
        return []


def fetch_transcript(video_id: str) -> str | None:
    """Fetch transcript for a single video.

    Tries youtube-transcript-api first, falls back to yt-dlp subtitle download.
    """
    # Method 1: youtube-transcript-api (v1.x API)
    transcript = _fetch_via_api(video_id)
    if transcript:
        return transcript

    # Method 2: yt-dlp subtitle download
    transcript = _fetch_via_ytdlp(video_id)
    if transcript:
        return transcript

    return None


def _fetch_via_api(video_id: str) -> str | None:
    """Fetch transcript using youtube-transcript-api v1.x."""
    try:
        api = YouTubeTranscriptApi()
        result = api.fetch(video_id, languages=["en"])

        lines = []
        for snippet in result:
            text = snippet.text if hasattr(snippet, "text") else str(snippet)
            lines.append(text)

        return " ".join(lines) if lines else None

    except Exception as e:
        error_msg = str(e)
        if any(kw in error_msg.lower() for kw in ["disabled", "no transcript", "not translatable"]):
            return None
        if "ipblocked" in error_msg.lower() or "blocked" in error_msg.lower():
            print(f"    IP blocked by YouTube — trying yt-dlp fallback...")
            return None
        print(f"    API error: {error_msg[:100]}")
        return None


def _fetch_via_ytdlp(video_id: str) -> str | None:
    """Fetch transcript using yt-dlp as fallback."""
    import tempfile

    with tempfile.TemporaryDirectory() as tmpdir:
        url = f"https://www.youtube.com/watch?v={video_id}"
        cmd = [
            "yt-dlp",
            "--write-auto-sub",
            "--sub-lang", "en",
            "--skip-download",
            "--sub-format", "vtt",
            "-o", f"{tmpdir}/%(id)s.%(ext)s",
            url,
        ]

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            if result.returncode != 0:
                return None

            # Find the subtitle file
            sub_files = list(Path(tmpdir).glob("*.vtt")) + list(Path(tmpdir).glob("*.srt"))
            if not sub_files:
                return None

            raw = sub_files[0].read_text()
            # Strip VTT/SRT formatting — extract just the text
            lines = []
            for line in raw.split("\n"):
                line = line.strip()
                # Skip timestamps, headers, empty lines
                if not line or "-->" in line or line.startswith("WEBVTT") or line.startswith("Kind:") or line.startswith("Language:") or re.match(r'^\d+$', line):
                    continue
                # Remove inline tags like <c> </c> <00:00:01.234>
                line = re.sub(r'<[^>]+>', '', line)
                if line:
                    lines.append(line)

            # Deduplicate consecutive identical lines (VTT often repeats)
            deduped = []
            for line in lines:
                if not deduped or line != deduped[-1]:
                    deduped.append(line)

            return " ".join(deduped) if deduped else None

        except (subprocess.TimeoutExpired, FileNotFoundError):
            return None


def slugify(text: str) -> str:
    """Convert text to a filesystem-safe slug."""
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_]+', '-', text)
    text = re.sub(r'-+', '-', text)
    return text.strip('-')[:80]


def save_transcript(channel_name: str, video: dict, transcript: str):
    """Save transcript as a markdown file with frontmatter."""
    channel_dir = TRANSCRIPTS_DIR / slugify(channel_name)
    channel_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{slugify(video['title'])}.md"
    filepath = channel_dir / filename

    # Format upload date if available
    upload_date = video.get("upload_date", "")
    if upload_date and len(upload_date) == 8:
        upload_date = f"{upload_date[:4]}-{upload_date[4:6]}-{upload_date[6:8]}"

    escaped_title = video['title'].replace('"', "'")

    frontmatter = f"""---
type: transcript
source: youtube
channel: {channel_name}
title: "{escaped_title}"
video_id: {video['id']}
url: https://www.youtube.com/watch?v={video['id']}
upload_date: {upload_date}
duration: {video.get('duration', '')}
view_count: {video.get('view_count', '')}
scraped_date: {time.strftime('%Y-%m-%d')}
extracted: false
---

# {video['title']}

**Channel:** {channel_name}
**URL:** https://www.youtube.com/watch?v={video['id']}
**Date:** {upload_date}

## Transcript

{transcript}
"""

    filepath.write_text(frontmatter)
    return filepath


def filter_bazaar_videos(videos: list[dict], keywords: list[str] | None = None) -> list[dict]:
    """Filter videos to only Bazaar-related content."""
    bazaar_keywords = [
        "bazaar", "the bazaar", "vanessa", "pygmalien", "dooley",
        "stelle", "mak", "jules", "tempo", "auto-battler", "autobattler",
        "common", "uncommon", "legendary", "prestige", "enchant",
    ]

    if keywords:
        bazaar_keywords.extend([k.strip().lower() for k in keywords])

    filtered = []
    for video in videos:
        title = video.get("title", "").lower()
        if any(kw in title for kw in bazaar_keywords):
            filtered.append(video)

    return filtered


def scrape_channel(channel: dict, max_videos: int, title_filter: list[str] | None, skip_existing: bool = True):
    """Scrape transcripts from a single channel."""
    name = channel["name"]
    url = channel["url"]
    print(f"\n{'='*60}")
    print(f"Channel: {name}")
    print(f"URL: {url}")
    print(f"{'='*60}")

    videos = get_channel_videos(url, max_videos=max_videos * 3)  # fetch extra since we filter

    if not videos:
        print(f"  No videos found for {name}")
        return 0

    # Filter to bazaar-related videos
    bazaar_videos = filter_bazaar_videos(videos, title_filter)
    print(f"  {len(bazaar_videos)} Bazaar-related videos (out of {len(videos)} total)")

    if not bazaar_videos:
        print(f"  No Bazaar videos found. Try without filtering or check channel URL.")
        return 0

    # Limit to max_videos
    bazaar_videos = bazaar_videos[:max_videos]

    scraped = 0
    for i, video in enumerate(bazaar_videos, 1):
        video_id = video["id"]
        title = video["title"]

        # Check if already scraped
        if skip_existing:
            channel_dir = TRANSCRIPTS_DIR / slugify(name)
            expected_file = channel_dir / f"{slugify(title)}.md"
            if expected_file.exists():
                print(f"  [{i}/{len(bazaar_videos)}] SKIP (exists): {title}")
                continue

        print(f"  [{i}/{len(bazaar_videos)}] Fetching: {title}")

        transcript = fetch_transcript(video_id)
        if transcript:
            filepath = save_transcript(name, video, transcript)
            print(f"    Saved: {filepath.relative_to(PROJECT_DIR)}")
            scraped += 1
        else:
            print(f"    No transcript available")

        # Rate limiting
        time.sleep(0.5)

    return scraped


def scrape_single_video(url: str):
    """Scrape transcript from a single video URL."""
    video_id = extract_video_id(url)
    if not video_id:
        print(f"ERROR: Could not extract video ID from: {url}")
        return

    print(f"Fetching video metadata for {video_id}...")

    # Get video metadata
    cmd = ["yt-dlp", "--dump-json", "--no-download", url]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        if result.returncode != 0:
            print(f"WARNING: Could not get metadata, using defaults")
            video = {"id": video_id, "title": video_id}
        else:
            data = json.loads(result.stdout)
            video = {
                "id": video_id,
                "title": data.get("title", video_id),
                "duration": data.get("duration"),
                "view_count": data.get("view_count"),
                "upload_date": data.get("upload_date"),
            }
            channel_name = data.get("channel", data.get("uploader", "unknown"))
    except Exception:
        video = {"id": video_id, "title": video_id}
        channel_name = "unknown"

    print(f"Fetching transcript for: {video['title']}")
    transcript = fetch_transcript(video_id)

    if transcript:
        filepath = save_transcript(channel_name, video, transcript)
        print(f"Saved: {filepath}")
    else:
        print("No transcript available for this video")


def load_channels() -> list[dict]:
    """Load channel list from channels.json, falling back to defaults."""
    if CHANNELS_FILE.exists():
        with open(CHANNELS_FILE) as f:
            return json.load(f)
    return DEFAULT_CHANNELS


def save_default_channels():
    """Save the default channel list to channels.json for editing."""
    CHANNELS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CHANNELS_FILE, "w") as f:
        json.dump(DEFAULT_CHANNELS, f, indent=2)
    print(f"Saved default channel list to {CHANNELS_FILE}")


def main():
    parser = argparse.ArgumentParser(description="Scrape YouTube transcripts for The Bazaar")
    parser.add_argument("--channel", help="Scrape a specific channel URL")
    parser.add_argument("--video", help="Scrape a single video URL")
    parser.add_argument("--playlist", help="Scrape a playlist URL")
    parser.add_argument("--max-videos", type=int, default=20, help="Max videos per channel (default: 20)")
    parser.add_argument("--filter", help="Comma-separated keywords to filter video titles")
    parser.add_argument("--no-filter", action="store_true", help="Don't filter by Bazaar keywords (scrape all)")
    parser.add_argument("--init-channels", action="store_true", help="Save default channels.json for editing")
    parser.add_argument("--no-skip", action="store_true", help="Re-scrape even if transcript file exists")

    args = parser.parse_args()

    TRANSCRIPTS_DIR.mkdir(parents=True, exist_ok=True)

    if args.init_channels:
        save_default_channels()
        return

    title_filter = args.filter.split(",") if args.filter else None

    # Single video mode
    if args.video:
        scrape_single_video(args.video)
        return

    # Playlist mode
    if args.playlist:
        videos = get_playlist_videos(args.playlist, max_videos=args.max_videos)
        if not videos:
            print("No videos found in playlist")
            return
        scraped = 0
        for i, video in enumerate(videos, 1):
            print(f"  [{i}/{len(videos)}] Fetching: {video['title']}")
            transcript = fetch_transcript(video["id"])
            if transcript:
                filepath = save_transcript("playlist", video, transcript)
                print(f"    Saved: {filepath.relative_to(PROJECT_DIR)}")
                scraped += 1
            else:
                print(f"    No transcript available")
            time.sleep(0.5)
        print(f"\nDone! Scraped {scraped}/{len(videos)} transcripts")
        return

    # Single channel mode
    if args.channel:
        channel = {"name": "custom", "url": args.channel}
        # Try to extract channel name from URL
        match = re.search(r'@([\w-]+)', args.channel)
        if match:
            channel["name"] = match.group(1)
        scrape_channel(channel, args.max_videos, title_filter, skip_existing=not args.no_skip)
        return

    # Default: scrape all configured channels
    channels = load_channels()
    print(f"Scraping {len(channels)} channels...")

    total_scraped = 0
    for channel in channels:
        count = scrape_channel(channel, args.max_videos, title_filter, skip_existing=not args.no_skip)
        total_scraped += count

    print(f"\n{'='*60}")
    print(f"Done! Scraped {total_scraped} new transcripts total")
    print(f"Transcripts saved to: {TRANSCRIPTS_DIR}")


if __name__ == "__main__":
    main()
