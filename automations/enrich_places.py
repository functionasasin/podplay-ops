#!/usr/bin/env python3
"""
Enrich place entities with Google Places API data.

Looks up each placeId to get:
- Name
- Category (restaurant, bar, cafe, hotel, etc.)
- Address
- Rating
- Website

Usage:
    export GOOGLE_PLACES_API_KEY="your-api-key"
    python enrich_places.py

Or:
    python enrich_places.py --api-key="your-api-key"

The script caches results to avoid re-fetching.
"""

import json
import os
import re
import sys
import time
import argparse
from pathlib import Path
from typing import Any
import urllib.request
import urllib.parse

# Category mappings from Google Places types to our categories
CATEGORY_MAP = {
    # Food & Drink
    "restaurant": "restaurant",
    "food": "restaurant",
    "meal_delivery": "restaurant",
    "meal_takeaway": "restaurant",
    "bakery": "bakery",
    "cafe": "cafe",
    "coffee_shop": "cafe",
    "bar": "bar",
    "night_club": "bar",
    "liquor_store": "bar",

    # Accommodation
    "lodging": "hotel",
    "hotel": "hotel",
    "motel": "hotel",
    "resort": "hotel",
    "hostel": "hotel",
    "guest_house": "hotel",
    "ryokan": "hotel",

    # Shopping
    "shopping_mall": "shopping",
    "department_store": "shopping",
    "clothing_store": "shopping",
    "shoe_store": "shopping",
    "jewelry_store": "shopping",
    "convenience_store": "convenience",
    "supermarket": "supermarket",
    "grocery_or_supermarket": "supermarket",
    "drugstore": "pharmacy",
    "pharmacy": "pharmacy",

    # Transport
    "airport": "transport",
    "train_station": "transport",
    "subway_station": "transport",
    "bus_station": "transport",
    "transit_station": "transport",
    "light_rail_station": "transport",

    # Attractions & Entertainment
    "tourist_attraction": "attraction",
    "museum": "museum",
    "art_gallery": "museum",
    "amusement_park": "attraction",
    "aquarium": "attraction",
    "zoo": "attraction",
    "park": "park",
    "natural_feature": "nature",
    "campground": "nature",
    "movie_theater": "entertainment",
    "casino": "entertainment",
    "bowling_alley": "entertainment",
    "stadium": "entertainment",
    "gym": "fitness",
    "spa": "wellness",

    # Services
    "bank": "services",
    "atm": "services",
    "post_office": "services",
    "laundry": "services",
    "hair_care": "services",
    "beauty_salon": "services",

    # Religious
    "church": "religious",
    "temple": "religious",
    "mosque": "religious",
    "synagogue": "religious",
    "hindu_temple": "religious",

    # Other
    "gas_station": "gas_station",
    "car_rental": "car_rental",
    "parking": "parking",
    "hospital": "medical",
    "doctor": "medical",
    "dentist": "medical",
}


def get_category(types: list[str]) -> str:
    """Determine the best category from Google Places types."""
    for t in types:
        if t in CATEGORY_MAP:
            return CATEGORY_MAP[t]

    # Default category based on common patterns
    if any("store" in t for t in types):
        return "shopping"
    if any("restaurant" in t or "food" in t for t in types):
        return "restaurant"

    return "place"


def lookup_place(place_id: str, api_key: str) -> dict | None:
    """
    Look up a place using Google Places API (New).

    Returns place details or None if lookup fails.
    """
    base_url = "https://places.googleapis.com/v1/places/"

    # Fields to request
    fields = [
        "displayName",
        "formattedAddress",
        "types",
        "rating",
        "userRatingCount",
        "websiteUri",
        "primaryType",
        "primaryTypeDisplayName",
    ]

    url = f"{base_url}{place_id}"

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": ",".join(fields),
    }

    try:
        request = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(request, timeout=10) as response:
            data = json.loads(response.read().decode())
            return data
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None  # Place not found
        print(f"  HTTP error {e.code} for {place_id}")
        return None
    except Exception as e:
        print(f"  Error looking up {place_id}: {e}")
        return None


def load_cache(cache_path: Path) -> dict:
    """Load the places cache."""
    if cache_path.exists():
        with open(cache_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_cache(cache: dict, cache_path: Path):
    """Save the places cache."""
    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2, ensure_ascii=False)


def parse_place_entity(file_path: Path) -> dict | None:
    """Parse a place entity markdown file."""
    content = file_path.read_text(encoding="utf-8")

    # Extract frontmatter
    match = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
    if not match:
        return None

    import yaml
    frontmatter = yaml.safe_load(match.group(1))

    return {
        "frontmatter": frontmatter,
        "content": content,
        "file_path": file_path,
    }


def generate_enriched_entity(place_data: dict, api_data: dict, original: dict) -> str:
    """Generate enriched markdown content for a place entity."""
    import yaml

    fm = original["frontmatter"].copy()

    # Add enriched data
    if api_data.get("displayName"):
        fm["name"] = api_data["displayName"].get("text", "")

    if api_data.get("formattedAddress"):
        fm["address"] = api_data["formattedAddress"]

    if api_data.get("types"):
        fm["category"] = get_category(api_data["types"])
        fm["googleTypes"] = api_data["types"][:5]  # Keep top 5 types

    if api_data.get("primaryType"):
        fm["primaryType"] = api_data["primaryType"]

    if api_data.get("rating"):
        fm["rating"] = api_data["rating"]
        fm["ratingCount"] = api_data.get("userRatingCount", 0)

    if api_data.get("websiteUri"):
        fm["website"] = api_data["websiteUri"]

    fm["enriched"] = True

    # Generate display name
    name = fm.get("name", fm.get("placeId", "Unknown Place"))
    category = fm.get("category", "place")

    # Build markdown
    lines = [
        "---",
        yaml.dump(fm, default_flow_style=False, allow_unicode=True, sort_keys=False).strip(),
        "---",
        "",
        f"# {name}",
        "",
    ]

    # Category emoji
    emoji_map = {
        "restaurant": "🍽️",
        "cafe": "☕",
        "bar": "🍺",
        "hotel": "🏨",
        "shopping": "🛍️",
        "attraction": "🎡",
        "museum": "🏛️",
        "park": "🌳",
        "transport": "🚉",
        "convenience": "🏪",
        "supermarket": "🛒",
    }
    emoji = emoji_map.get(category, "📍")

    lines.append(f"**{emoji} {category.title()}**")
    lines.append("")

    if fm.get("address"):
        lines.append(f"📍 {fm['address']}")
        lines.append("")

    if fm.get("rating"):
        stars = "⭐" * int(fm["rating"])
        lines.append(f"Rating: {fm['rating']}/5 {stars} ({fm.get('ratingCount', 0)} reviews)")
        lines.append("")

    if fm.get("website"):
        lines.append(f"🌐 [{fm['website']}]({fm['website']})")
        lines.append("")

    # Visit info
    visit_count = fm.get("visitCount", 0)
    lines.append(f"Visited {visit_count} time{'s' if visit_count != 1 else ''}.")
    lines.append("")

    # Trips
    trips = fm.get("trips", [])
    if trips:
        lines.append("## Trips")
        lines.append("")
        for trip in trips:
            lines.append(f"- [[{trip}]]")
        lines.append("")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Enrich place entities with Google Places API")
    parser.add_argument("--api-key", help="Google Places API key")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of places to process (0 = all)")
    parser.add_argument("--min-visits", type=int, default=1, help="Only enrich places with at least N visits")
    parser.add_argument("--dry-run", action="store_true", help="Don't write changes, just show what would happen")
    args = parser.parse_args()

    # Get API key
    api_key = args.api_key or os.environ.get("GOOGLE_PLACES_API_KEY")
    if not api_key:
        print("Error: No API key provided.")
        print("Set GOOGLE_PLACES_API_KEY environment variable or use --api-key")
        return 1

    # Paths
    script_dir = Path(__file__).parent
    repo_root = script_dir.parent
    places_dir = repo_root / "entities" / "places"
    cache_path = repo_root / "data" / "places_api_cache.json"

    if not places_dir.exists():
        print(f"Error: Places directory not found: {places_dir}")
        return 1

    # Load cache
    cache = load_cache(cache_path)
    print(f"Loaded {len(cache)} cached place lookups")

    # Get all place files
    place_files = sorted(places_dir.glob("*.md"))
    print(f"Found {len(place_files)} place entity files")

    # Process places
    processed = 0
    enriched = 0
    skipped = 0
    errors = 0

    for i, place_file in enumerate(place_files):
        if args.limit and processed >= args.limit:
            break

        # Parse the entity
        entity = parse_place_entity(place_file)
        if not entity:
            continue

        fm = entity["frontmatter"]
        place_id = fm.get("placeId")
        visit_count = fm.get("visitCount", 0)

        # Skip if already enriched
        if fm.get("enriched"):
            skipped += 1
            continue

        # Skip if below visit threshold
        if visit_count < args.min_visits:
            skipped += 1
            continue

        processed += 1

        # Check cache
        if place_id in cache:
            api_data = cache[place_id]
            print(f"[{processed}] {place_id[:20]}... (cached)")
        else:
            # Look up place
            print(f"[{processed}] Looking up {place_id[:30]}...")
            api_data = lookup_place(place_id, api_key)

            # Cache result (even if None, to avoid re-fetching)
            cache[place_id] = api_data

            # Rate limit
            time.sleep(0.1)

        if api_data:
            name = api_data.get("displayName", {}).get("text", "Unknown")
            category = get_category(api_data.get("types", []))
            print(f"    → {name} ({category})")

            if not args.dry_run:
                # Generate and write enriched content
                new_content = generate_enriched_entity(fm, api_data, entity)
                place_file.write_text(new_content, encoding="utf-8")

            enriched += 1
        else:
            print(f"    → Not found or error")
            errors += 1

        # Save cache periodically
        if processed % 50 == 0:
            save_cache(cache, cache_path)

    # Final cache save
    save_cache(cache, cache_path)

    print(f"\nSummary:")
    print(f"  Processed: {processed}")
    print(f"  Enriched: {enriched}")
    print(f"  Skipped: {skipped}")
    print(f"  Errors/Not found: {errors}")
    print(f"  Cache size: {len(cache)}")

    if args.dry_run:
        print("\n(Dry run - no files were modified)")

    return 0


if __name__ == "__main__":
    import yaml  # Ensure yaml is available
    sys.exit(main())
