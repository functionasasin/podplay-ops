#!/usr/bin/env python3
"""
Extract place visits from Google Timeline data.

Reads Timeline.json and extracts all visit segments, grouping them by placeId.
Skips INFERRED_HOME and INFERRED_WORK semantic types as noise.

Output: data/places_extracted.json
"""

import json
import re
from pathlib import Path
from collections import defaultdict


# Semantic types to skip (home/work noise)
SKIP_SEMANTIC_TYPES = {"INFERRED_HOME", "INFERRED_WORK"}


def parse_latlng(latlng_str: str) -> list[float] | None:
    """
    Parse a latLng string like "36.97°, 138.83°" into [lat, lng].

    Returns None if parsing fails.
    """
    if not latlng_str:
        return None

    # Pattern matches numbers with optional negative sign and degree symbol
    pattern = r"(-?\d+\.?\d*)\s*°?\s*,\s*(-?\d+\.?\d*)\s*°?"
    match = re.match(pattern, latlng_str.strip())

    if match:
        lat = float(match.group(1))
        lng = float(match.group(2))
        return [lat, lng]

    return None


def extract_date(timestamp: str) -> str:
    """Extract date (YYYY-MM-DD) from ISO timestamp."""
    # Handle timestamps like "2024-09-09T09:47:28.000+08:00"
    return timestamp[:10]


def process_timeline(input_path: Path) -> dict:
    """
    Process Timeline.json and extract place visits.

    Returns a dict with:
    - places: list of place objects with visits
    - summary: statistics about the extraction
    """
    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    segments = data.get("semanticSegments", [])

    # Group visits by placeId
    places_map: dict[str, dict] = defaultdict(lambda: {
        "placeId": None,
        "coordinates": None,
        "semanticTypes": set(),
        "visits": []
    })

    skipped_count = 0
    processed_count = 0
    all_dates = []

    for segment in segments:
        # Skip non-visit segments (e.g., timelinePath segments)
        if "visit" not in segment:
            continue

        visit = segment["visit"]
        top_candidate = visit.get("topCandidate", {})
        semantic_type = top_candidate.get("semanticType")

        # Skip home/work noise
        if semantic_type in SKIP_SEMANTIC_TYPES:
            skipped_count += 1
            continue

        place_id = top_candidate.get("placeId")
        if not place_id:
            continue

        processed_count += 1

        # Parse location
        place_location = top_candidate.get("placeLocation", {})
        latlng_str = place_location.get("latLng", "")
        coordinates = parse_latlng(latlng_str)

        # Extract visit times
        start_time = segment.get("startTime", "")
        end_time = segment.get("endTime", "")
        visit_date = extract_date(start_time) if start_time else None

        if visit_date:
            all_dates.append(visit_date)

        # Add to place
        place = places_map[place_id]
        place["placeId"] = place_id

        # Update coordinates (use first non-null)
        if coordinates and not place["coordinates"]:
            place["coordinates"] = coordinates

        # Track semantic types seen for this place
        if semantic_type:
            place["semanticTypes"].add(semantic_type)

        # Add visit record
        place["visits"].append({
            "date": visit_date,
            "startTime": start_time,
            "endTime": end_time
        })

    # Convert to output format
    places_list = []
    for place_id, place_data in places_map.items():
        places_list.append({
            "placeId": place_data["placeId"],
            "coordinates": place_data["coordinates"],
            "semanticTypes": sorted(place_data["semanticTypes"]),
            "visits": sorted(place_data["visits"], key=lambda v: v["startTime"]),
            "visitCount": len(place_data["visits"])
        })

    # Sort by visit count (most visited first)
    places_list.sort(key=lambda p: -p["visitCount"])

    # Calculate date range
    date_range = {}
    if all_dates:
        all_dates.sort()
        date_range = {
            "start": all_dates[0],
            "end": all_dates[-1]
        }

    return {
        "places": places_list,
        "summary": {
            "totalVisits": processed_count,
            "skippedVisits": skipped_count,
            "uniquePlaces": len(places_list),
            "dateRange": date_range
        }
    }


def main():
    """Main entry point."""
    # Determine paths relative to script location
    script_dir = Path(__file__).parent
    repo_root = script_dir.parent

    input_path = repo_root / "data" / "Timeline.json"
    output_path = repo_root / "data" / "places_extracted.json"

    if not input_path.exists():
        print(f"Error: Input file not found: {input_path}")
        return 1

    print(f"Processing: {input_path}")

    result = process_timeline(input_path)

    # Write output
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"Output written to: {output_path}")
    print(f"\nSummary:")
    print(f"  Total visits processed: {result['summary']['totalVisits']}")
    print(f"  Visits skipped (home/work): {result['summary']['skippedVisits']}")
    print(f"  Unique places: {result['summary']['uniquePlaces']}")
    print(f"  Date range: {result['summary']['dateRange'].get('start', 'N/A')} to {result['summary']['dateRange'].get('end', 'N/A')}")

    # Show top 10 most visited places
    print(f"\nTop 10 most visited places:")
    for i, place in enumerate(result["places"][:10], 1):
        coords = place["coordinates"]
        coords_str = f"[{coords[0]:.4f}, {coords[1]:.4f}]" if coords else "[no coords]"
        types = ", ".join(place["semanticTypes"]) or "none"
        print(f"  {i}. {place['placeId'][:30]}... - {place['visitCount']} visits {coords_str} ({types})")

    return 0


if __name__ == "__main__":
    exit(main())
