#!/usr/bin/env python3
"""
Create place entity markdown files from extracted places data.

Reads places_extracted.json and trip files to:
1. Match place visits to trip date ranges
2. Create markdown entity files for trip-correlated places and frequent local places
3. Link places to trips via frontmatter and wikilinks

Output: entities/places/{sanitized-place-id}.md
"""

import json
import re
import yaml
from pathlib import Path
from datetime import date
from dataclasses import dataclass, field
from typing import Any


@dataclass
class Trip:
    """Represents a trip with date range."""
    name: str
    start: date
    end: date
    file_path: Path


@dataclass
class Place:
    """Represents a place with visits."""
    place_id: str
    coordinates: list[float] | None
    semantic_types: list[str]
    visits: list[dict]
    visit_count: int

    # Computed after trip matching
    visit_dates: list[str] = field(default_factory=list)
    matched_trips: list[str] = field(default_factory=list)
    is_trip_place: bool = False
    location_info: dict = field(default_factory=dict)


def parse_trip_frontmatter(file_path: Path) -> Trip | None:
    """
    Parse a trip markdown file and extract the trip info.

    Returns None if parsing fails or dates are missing.
    """
    content = file_path.read_text(encoding="utf-8")

    # Extract YAML frontmatter
    if not content.startswith("---"):
        return None

    parts = content.split("---", 2)
    if len(parts) < 3:
        return None

    try:
        frontmatter = yaml.safe_load(parts[1])
    except yaml.YAMLError:
        return None

    if not frontmatter:
        return None

    # Get required fields
    name = frontmatter.get("name")
    dates = frontmatter.get("dates", {})
    start_str = dates.get("start")
    end_str = dates.get("end")

    if not name or not start_str or not end_str:
        return None

    # Parse dates
    try:
        if isinstance(start_str, date):
            start = start_str
        else:
            start = date.fromisoformat(str(start_str))

        if isinstance(end_str, date):
            end = end_str
        else:
            end = date.fromisoformat(str(end_str))
    except ValueError:
        return None

    return Trip(name=name, start=start, end=end, file_path=file_path)


def load_trips(trips_dir: Path) -> list[Trip]:
    """Load all trip files and parse their date ranges."""
    trips = []

    for trip_file in trips_dir.glob("*.md"):
        trip = parse_trip_frontmatter(trip_file)
        if trip:
            trips.append(trip)

    # Sort by start date
    trips.sort(key=lambda t: t.start)
    return trips


def load_geocode_cache(cache_path: Path) -> dict:
    """Load the geocode cache for location name lookups."""
    if not cache_path.exists():
        return {}

    with open(cache_path, "r", encoding="utf-8") as f:
        return json.load(f)


def make_geocode_key(coordinates: list[float]) -> str:
    """Create a geocode cache key from coordinates."""
    if not coordinates or len(coordinates) < 2:
        return ""
    lat, lng = coordinates
    return f"{lat}\u00b0, {lng}\u00b0"


def lookup_location(coordinates: list[float], geocode_cache: dict) -> dict:
    """
    Look up location info from geocode cache.

    Returns dict with city, country, display if found.
    """
    key = make_geocode_key(coordinates)
    if key and key in geocode_cache:
        info = geocode_cache[key]
        # Skip error entries
        if "error" not in info:
            return info
    return {}


def match_visit_to_trips(visit_date_str: str, trips: list[Trip]) -> list[str]:
    """
    Find which trips a visit date falls within.

    Returns list of trip names.
    """
    if not visit_date_str:
        return []

    try:
        visit_date = date.fromisoformat(visit_date_str)
    except ValueError:
        return []

    matched = []
    for trip in trips:
        if trip.start <= visit_date <= trip.end:
            matched.append(trip.name)

    return matched


def sanitize_place_id(place_id: str) -> str:
    """
    Sanitize a place ID for use as a filename.

    Removes/replaces special characters that are invalid in filenames.
    """
    # Replace problematic characters with underscores
    sanitized = re.sub(r'[<>:"/\\|?*]', '_', place_id)
    # Collapse multiple underscores
    sanitized = re.sub(r'_+', '_', sanitized)
    # Remove leading/trailing underscores
    sanitized = sanitized.strip('_')
    # Limit length (some placeIds are very long)
    if len(sanitized) > 100:
        sanitized = sanitized[:100]
    return sanitized


def generate_place_entity(place: Place) -> str:
    """Generate markdown content for a place entity."""
    # Build frontmatter
    frontmatter: dict[str, Any] = {
        "type": "place",
        "placeId": place.place_id,
    }

    if place.coordinates:
        frontmatter["coordinates"] = place.coordinates

    if place.location_info:
        if place.location_info.get("city"):
            frontmatter["city"] = place.location_info["city"]
        if place.location_info.get("country"):
            frontmatter["country"] = place.location_info["country"]
        if place.location_info.get("display"):
            frontmatter["displayName"] = place.location_info["display"]

    # Add unique visit dates (sorted)
    unique_dates = sorted(set(place.visit_dates))
    if unique_dates:
        frontmatter["visits"] = unique_dates

    # Add matched trips
    if place.matched_trips:
        frontmatter["trips"] = sorted(set(place.matched_trips))

    frontmatter["visitCount"] = place.visit_count
    frontmatter["isTripPlace"] = place.is_trip_place
    frontmatter["source"] = "timeline-ingestion"

    # Determine display name for heading
    if place.location_info.get("display"):
        display_name = place.location_info["display"]
    elif place.location_info.get("city"):
        city = place.location_info["city"]
        country = place.location_info.get("country", "")
        display_name = f"{city}, {country}" if country else city
    else:
        display_name = place.place_id

    # Build markdown content
    lines = [
        "---",
        yaml.dump(frontmatter, default_flow_style=False, allow_unicode=True, sort_keys=False).strip(),
        "---",
        "",
        f"# {display_name}",
        "",
        f"Visited {place.visit_count} time{'s' if place.visit_count != 1 else ''}.",
        "",
    ]

    # Add trips section if there are matched trips
    if place.matched_trips:
        lines.append("## Trips")
        lines.append("")
        for trip_name in sorted(set(place.matched_trips)):
            lines.append(f"- [[{trip_name}]]")
        lines.append("")

    # Add semantic types if interesting
    interesting_types = [t for t in place.semantic_types if t != "UNKNOWN"]
    if interesting_types:
        lines.append("## Categories")
        lines.append("")
        for t in interesting_types:
            lines.append(f"- {t}")
        lines.append("")

    return "\n".join(lines)


def process_places(
    places_data: dict,
    trips: list[Trip],
    geocode_cache: dict
) -> list[Place]:
    """
    Process places and match them to trips.

    Returns list of Place objects that should become entities.
    """
    result = []

    for place_data in places_data.get("places", []):
        place_id = place_data.get("placeId")
        if not place_id:
            continue

        coordinates = place_data.get("coordinates")
        visit_count = place_data.get("visitCount", 0)
        visits = place_data.get("visits", [])
        semantic_types = place_data.get("semanticTypes", [])

        # Look up location info
        location_info = lookup_location(coordinates, geocode_cache)

        # Extract visit dates and match to trips
        visit_dates = []
        matched_trips = []

        for visit in visits:
            visit_date = visit.get("date")
            if visit_date:
                visit_dates.append(visit_date)
                trip_matches = match_visit_to_trips(visit_date, trips)
                matched_trips.extend(trip_matches)

        is_trip_place = len(matched_trips) > 0

        # Criteria for creating an entity:
        # 1. Place has 2+ visits, OR
        # 2. Place falls within a trip date range (is_trip_place)
        if visit_count >= 2 or is_trip_place:
            place = Place(
                place_id=place_id,
                coordinates=coordinates,
                semantic_types=semantic_types,
                visits=visits,
                visit_count=visit_count,
                visit_dates=visit_dates,
                matched_trips=matched_trips,
                is_trip_place=is_trip_place,
                location_info=location_info,
            )
            result.append(place)

    return result


def main():
    """Main entry point."""
    # Determine paths relative to script location
    script_dir = Path(__file__).parent
    repo_root = script_dir.parent

    places_path = repo_root / "data" / "places_extracted.json"
    geocode_path = repo_root / "data" / "geocode_cache.json"
    trips_dir = repo_root / "entities" / "trips"
    places_output_dir = repo_root / "entities" / "places"

    # Validate inputs
    if not places_path.exists():
        print(f"Error: Places file not found: {places_path}")
        return 1

    if not trips_dir.exists():
        print(f"Error: Trips directory not found: {trips_dir}")
        return 1

    # Ensure output directory exists
    places_output_dir.mkdir(parents=True, exist_ok=True)

    print(f"Loading places from: {places_path}")
    with open(places_path, "r", encoding="utf-8") as f:
        places_data = json.load(f)

    print(f"Loading trips from: {trips_dir}")
    trips = load_trips(trips_dir)
    print(f"  Found {len(trips)} trips")
    for trip in trips:
        print(f"    - {trip.name}: {trip.start} to {trip.end}")

    print(f"Loading geocode cache from: {geocode_path}")
    geocode_cache = load_geocode_cache(geocode_path)
    print(f"  Found {len(geocode_cache)} cached locations")

    # Process places
    print("\nProcessing places...")
    places = process_places(places_data, trips, geocode_cache)

    # Statistics
    trip_places = [p for p in places if p.is_trip_place]
    frequent_places = [p for p in places if not p.is_trip_place]

    print(f"\nPlaces to create:")
    print(f"  Trip-correlated places: {len(trip_places)}")
    print(f"  Frequent local places (2+ visits, not during trips): {len(frequent_places)}")
    print(f"  Total: {len(places)}")

    # Write entity files
    print(f"\nWriting entity files to: {places_output_dir}")
    created_count = 0

    for place in places:
        filename = sanitize_place_id(place.place_id) + ".md"
        output_path = places_output_dir / filename

        content = generate_place_entity(place)
        output_path.write_text(content, encoding="utf-8")
        created_count += 1

    print(f"\nCreated {created_count} place entity files")

    # Show some examples
    print("\nExample trip-correlated places:")
    for place in trip_places[:5]:
        loc = place.location_info.get("display", place.place_id[:40])
        trips_str = ", ".join(place.matched_trips[:3])
        print(f"  - {loc[:60]} -> {trips_str}")

    print("\nExample frequent local places:")
    for place in frequent_places[:5]:
        loc = place.location_info.get("display", place.place_id[:40])
        print(f"  - {loc[:60]} ({place.visit_count} visits)")

    return 0


if __name__ == "__main__":
    exit(main())
