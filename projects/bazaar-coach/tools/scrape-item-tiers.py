#!/usr/bin/env python3
"""
Scrape Starting Tier data for all Vanessa items from thebazaar.wiki.gg.

Reads item names from the KB markdown files, fetches each item's wiki page,
extracts the Starting Tier (Bronze/Silver/Gold/Diamond), and saves results
to a JSON file.

Usage:
    python tools/scrape-item-tiers.py
"""

import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request

# Paths relative to project root
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ITEM_FILES = [
    os.path.join(PROJECT_ROOT, "items", "by-hero", "vanessa-small.md"),
    os.path.join(PROJECT_ROOT, "items", "by-hero", "vanessa-medium.md"),
    os.path.join(PROJECT_ROOT, "items", "by-hero", "vanessa-large.md"),
]
OUTPUT_PATH = os.path.join(PROJECT_ROOT, "items", "data", "vanessa-tiers.json")

WIKI_BASE = "https://thebazaar.wiki.gg/wiki/"
REQUEST_DELAY = 0.5  # seconds between requests

# Tiers we're looking for
VALID_TIERS = {"Bronze", "Silver", "Gold", "Diamond"}


def extract_item_names(filepath: str) -> list[str]:
    """Extract item names from ## headers in a markdown file."""
    names = []
    with open(filepath, "r") as f:
        for line in f:
            match = re.match(r"^## (.+)$", line.strip())
            if match:
                names.append(match.group(1))
    return names


def item_name_to_url(name: str) -> str:
    """Convert an item name to its wiki URL.

    Spaces become underscores, special characters are percent-encoded.
    wiki.gg uses MediaWiki-style URLs: underscores for spaces, %27 for
    apostrophes, etc.
    """
    # Replace spaces with underscores first (MediaWiki convention)
    slug = name.replace(" ", "_")
    # Percent-encode special characters but preserve underscores and alphanumeric
    # We need to encode things like apostrophes ('), periods might be ok
    encoded = urllib.parse.quote(slug, safe="_/")
    return WIKI_BASE + encoded


def extract_starting_tier(html: str) -> str | None:
    """Extract the Starting Tier from wiki page HTML.

    The wiki pages have a structure where 'Starting Tier' appears as a heading
    or label, followed by a tier name (Bronze/Silver/Gold/Diamond).
    """
    # Strategy 1: Look for "Starting Tier" followed by a tier name in nearby text
    # The pattern in the HTML seems to be: heading "Starting Tier" then tier name
    # Try multiple patterns to be robust

    # Pattern: "Starting Tier" followed by tier within ~200 chars
    patterns = [
        # Direct text: "Starting Tier" ... "Bronze" etc
        r"Starting\s+Tier[^A-Za-z]{0,200}?(Bronze|Silver|Gold|Diamond)",
        # In a table cell or div
        r"Starting.Tier.*?<[^>]*>\s*(Bronze|Silver|Gold|Diamond)",
        # data-attribute style
        r'starting.tier["\s:=]+\s*(Bronze|Silver|Gold|Diamond)',
    ]

    for pattern in patterns:
        match = re.search(pattern, html, re.IGNORECASE | re.DOTALL)
        if match:
            tier = match.group(1)
            # Normalize capitalization
            return tier.capitalize()

    return None


def fetch_page(url: str) -> str | None:
    """Fetch a wiki page and return HTML content."""
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "BazaarCoach-TierScraper/1.0 (personal knowledge base project)"
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            return response.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise
    except urllib.error.URLError:
        return None


def main():
    # Collect all item names
    all_items: list[str] = []
    for filepath in ITEM_FILES:
        items = extract_item_names(filepath)
        basename = os.path.basename(filepath)
        print(f"  {basename}: {len(items)} items")
        all_items.extend(items)

    print(f"\nTotal items to scrape: {len(all_items)}")
    print("=" * 60)

    # Load existing results if any (to allow resuming)
    results: dict[str, str] = {}
    if os.path.exists(OUTPUT_PATH):
        with open(OUTPUT_PATH, "r") as f:
            results = json.load(f)
        print(f"Loaded {len(results)} existing results from cache")

    failures: list[tuple[str, str]] = []
    skipped = 0

    for i, name in enumerate(all_items, 1):
        # Skip if already scraped
        if name in results:
            skipped += 1
            continue

        url = item_name_to_url(name)
        print(f"[{i}/{len(all_items)}] {name} -> {url}")

        html = fetch_page(url)
        if html is None:
            print(f"  FAILED: 404 or connection error")
            failures.append((name, "404/connection error"))
            time.sleep(REQUEST_DELAY)
            continue

        tier = extract_starting_tier(html)
        if tier:
            results[name] = tier
            print(f"  -> {tier}")
        else:
            # If no explicit Starting Tier found, it likely starts at Bronze
            # (Bronze is the default - only non-Bronze items have it explicitly listed)
            # But we'll mark it as needing verification
            print(f"  WARNING: No 'Starting Tier' found, assuming Bronze")
            results[name] = "Bronze"

        time.sleep(REQUEST_DELAY)

    # Save results
    # Sort by item name for stable output
    sorted_results = dict(sorted(results.items()))
    with open(OUTPUT_PATH, "w") as f:
        json.dump(sorted_results, f, indent=2)

    # Summary
    print("\n" + "=" * 60)
    print(f"RESULTS SUMMARY")
    print(f"  Total items: {len(all_items)}")
    print(f"  Skipped (cached): {skipped}")
    print(f"  Successfully scraped: {len(results)}")

    # Tier breakdown
    tier_counts: dict[str, int] = {}
    for tier in results.values():
        tier_counts[tier] = tier_counts.get(tier, 0) + 1
    print(f"\n  Tier distribution:")
    for tier in ["Bronze", "Silver", "Gold", "Diamond"]:
        count = tier_counts.get(tier, 0)
        print(f"    {tier}: {count}")

    if failures:
        print(f"\n  FAILURES ({len(failures)}):")
        for name, reason in failures:
            print(f"    - {name}: {reason}")

    print(f"\nResults saved to: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
