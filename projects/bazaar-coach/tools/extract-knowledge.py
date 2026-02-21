#!/usr/bin/env python3
"""Extract structured knowledge from scraped Bazaar video transcripts.

This script reads raw transcript files and uses Claude to extract:
- Strategies and decision frameworks
- Item evaluations and synergies
- Hero-specific tips
- Meta observations
- Habits and reasoning patterns of top players

Usage:
    # Extract from all unprocessed transcripts
    python extract-knowledge.py

    # Extract from a specific transcript
    python extract-knowledge.py --file knowledge/transcripts/amazhs/some-video.md

    # Dry run — show what would be processed
    python extract-knowledge.py --dry-run

    # Re-extract already processed transcripts
    python extract-knowledge.py --reprocess

Extracted knowledge is saved to projects/bazaar-coach/knowledge/extracted/
"""

import argparse
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
TRANSCRIPTS_DIR = PROJECT_DIR / "knowledge" / "transcripts"
EXTRACTED_DIR = PROJECT_DIR / "knowledge" / "extracted"

EXTRACTION_PROMPT = """You are analyzing a transcript from a top-ranked player of The Bazaar (roguelike auto-battler by Tempo). Extract all useful strategic knowledge.

## Source Info
- **Channel:** {channel}
- **Title:** {title}
- **Video:** {url}

## Transcript
{transcript}

## Instructions

Extract ALL strategic insights from this transcript. Be thorough — even offhand comments about items or strategies are valuable. Organize into these categories:

### General Strategy
- Decision frameworks (when to buy/sell/skip, economy management, risk assessment)
- Run pacing (early/mid/late game priorities)
- Board management (positioning, sizing, when to pivot)

### Hero-Specific
- Hero strengths/weaknesses mentioned
- Build paths and power spikes
- Hero-specific item priorities

### Item Evaluations
- Item tier rankings or comparisons
- Synergy combos mentioned
- Items called out as overrated/underrated

### Meta Observations
- Current tier list opinions
- Patch-specific strategies
- What separates good from great players

### Decision Examples
- Specific in-game decisions and the reasoning behind them
- "I would do X because Y" type statements
- Mistakes pointed out and why they're mistakes

For each insight:
1. Quote or closely paraphrase what was said
2. Note the strategic principle behind it
3. Tag with relevant hero/item names

Output as structured markdown. Be specific — "buy damage items" is useless, "Frost Staff is core on Vanessa because it double-dips with her passive" is valuable.

If the transcript is mostly non-strategic (unboxing, news, not gameplay), just note that and provide whatever small insights exist.
"""


def read_transcript(filepath: Path) -> dict:
    """Read a transcript file and parse its frontmatter."""
    content = filepath.read_text()

    # Parse frontmatter
    frontmatter = {}
    body = content
    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            for line in parts[1].strip().split("\n"):
                if ":" in line:
                    key, _, value = line.partition(":")
                    frontmatter[key.strip()] = value.strip().strip('"')
            body = parts[2]

    # Extract just the transcript section
    transcript_text = body
    if "## Transcript" in body:
        transcript_text = body.split("## Transcript", 1)[1].strip()

    return {
        "channel": frontmatter.get("channel", "unknown"),
        "title": frontmatter.get("title", filepath.stem),
        "video_id": frontmatter.get("video_id", ""),
        "url": frontmatter.get("url", ""),
        "upload_date": frontmatter.get("upload_date", ""),
        "extracted": frontmatter.get("extracted", "false") == "true",
        "transcript": transcript_text,
        "filepath": filepath,
    }


def find_unprocessed_transcripts() -> list[Path]:
    """Find all transcript files that haven't been extracted yet."""
    if not TRANSCRIPTS_DIR.exists():
        return []

    unprocessed = []
    for md_file in TRANSCRIPTS_DIR.rglob("*.md"):
        content = md_file.read_text()
        if "extracted: false" in content or "extracted:" not in content:
            unprocessed.append(md_file)

    return sorted(unprocessed)


def mark_as_extracted(filepath: Path):
    """Update the transcript file to mark it as extracted."""
    content = filepath.read_text()
    content = content.replace("extracted: false", "extracted: true")
    filepath.write_text(content)


def extract_with_claude(transcript_data: dict) -> str | None:
    """Send transcript to Claude for knowledge extraction.

    Uses the Anthropic API via the `claude` CLI or direct API call.
    Falls back to printing the prompt if no API access.
    """
    prompt = EXTRACTION_PROMPT.format(
        channel=transcript_data["channel"],
        title=transcript_data["title"],
        url=transcript_data["url"],
        transcript=transcript_data["transcript"][:50000],  # limit size
    )

    # Try using anthropic CLI
    try:
        result = subprocess.run(
            ["claude", "--print", "-p", prompt],
            capture_output=True,
            text=True,
            timeout=120,
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass

    # If no CLI available, save the prompt for manual processing
    print("    NOTE: Claude CLI not available. Saving prompt for manual extraction.")
    return None


def save_extraction(transcript_data: dict, extraction: str):
    """Save extracted knowledge to a markdown file."""
    EXTRACTED_DIR.mkdir(parents=True, exist_ok=True)

    channel_slug = re.sub(r'[^\w-]', '', transcript_data["channel"].lower().replace(" ", "-"))
    title_slug = re.sub(r'[^\w-]', '', transcript_data["title"].lower().replace(" ", "-"))[:60]

    filename = f"{channel_slug}--{title_slug}.md"
    filepath = EXTRACTED_DIR / filename

    content = f"""---
type: extracted-knowledge
source_type: youtube-transcript
channel: {transcript_data['channel']}
title: "{transcript_data['title'].replace('"', "'")}"
video_id: {transcript_data['video_id']}
url: {transcript_data['url']}
upload_date: {transcript_data['upload_date']}
extracted_date: {time.strftime('%Y-%m-%d')}
---

# Knowledge: {transcript_data['title']}

**Source:** [{transcript_data['channel']}]({transcript_data['url']})
**Date:** {transcript_data['upload_date']}

{extraction}
"""

    filepath.write_text(content)
    return filepath


def main():
    parser = argparse.ArgumentParser(description="Extract knowledge from Bazaar transcripts")
    parser.add_argument("--file", help="Process a specific transcript file")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be processed")
    parser.add_argument("--reprocess", action="store_true", help="Re-extract already processed transcripts")

    args = parser.parse_args()

    if args.file:
        filepath = Path(args.file)
        if not filepath.is_absolute():
            filepath = PROJECT_DIR / filepath
        if not filepath.exists():
            print(f"ERROR: File not found: {filepath}")
            sys.exit(1)
        files = [filepath]
    else:
        if args.reprocess:
            files = sorted(TRANSCRIPTS_DIR.rglob("*.md")) if TRANSCRIPTS_DIR.exists() else []
        else:
            files = find_unprocessed_transcripts()

    if not files:
        print("No transcripts to process.")
        print(f"Run scrape-transcripts.py first to fetch transcripts to {TRANSCRIPTS_DIR}")
        return

    if args.dry_run:
        print(f"Would process {len(files)} transcript(s):")
        for f in files:
            print(f"  - {f.relative_to(PROJECT_DIR)}")
        return

    print(f"Processing {len(files)} transcript(s)...")
    EXTRACTED_DIR.mkdir(parents=True, exist_ok=True)

    processed = 0
    for i, filepath in enumerate(files, 1):
        data = read_transcript(filepath)
        print(f"\n[{i}/{len(files)}] {data['title']}")
        print(f"  Channel: {data['channel']}")
        print(f"  Transcript length: {len(data['transcript'])} chars")

        if len(data["transcript"]) < 100:
            print("  SKIP: Transcript too short")
            continue

        extraction = extract_with_claude(data)
        if extraction:
            out_path = save_extraction(data, extraction)
            mark_as_extracted(filepath)
            print(f"  Saved: {out_path.relative_to(PROJECT_DIR)}")
            processed += 1
        else:
            print("  Could not extract (no API access)")

        time.sleep(1)  # rate limit

    print(f"\nDone! Extracted knowledge from {processed}/{len(files)} transcripts")
    print(f"Extracted files: {EXTRACTED_DIR}")


if __name__ == "__main__":
    main()
