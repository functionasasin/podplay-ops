# Timeline.json - Places & Activities Ingestion Plan

## Status: ✅ All Phases Complete

### Completed
- ✅ **970 place entities** created in `entities/places/`
  - 794 trip-correlated places
  - 176 frequent local places (2+ visits)
- ✅ **Skiing activity log** created: `entities/activities/2025-01-skiing-niigata.md`
  - 22 sessions, 8 ski days, 307km, ~37 hours
- ✅ **8 trip files updated** with activity summaries (train, ferry, cycling, skiing)

### ✅ Place Enrichment Complete
**964/970 places enriched** with names, categories, addresses, ratings
- 6 places not found in Google Places API
- Cache: `data/places_api_cache.json`

---

## Source Data

From `/data/Timeline.json`:
- **3,265 visits processed** (skipped 442 home/work)
- **1,262 unique places** identified
- **Special activities**: skiing, ferry, cycling, train, etc.

## Part 1: Places Extraction

### Data Structure

```json
{
  "visit": {
    "topCandidate": {
      "placeId": "ChIJ...",
      "semanticType": "UNKNOWN",
      "placeLocation": { "latLng": "36.97°, 138.83°" }
    }
  }
}
```

### What to Extract

Extract ALL place visits - restaurants, coffee shops, bars, clubs, shops, attractions, hotels, etc.

**Skip only:**
- INFERRED_HOME (404 visits) - home location noise
- INFERRED_WORK (38 visits) - work location noise

### Extraction Strategy

#### Phase 1: Trip-Correlated Places
For each trip's date range, extract all visits that occurred during that trip:
```python
for trip in trips:
    visits_during_trip = [v for v in visits
        if trip.start <= v.date <= trip.end
        and v.semanticType not in ['INFERRED_HOME', 'INFERRED_WORK']]
```

This captures everything visited during a trip - restaurants, cafes, shops, attractions.

#### Phase 2: Frequent Places (Non-Trip)
Extract places visited 2+ times outside of trips (excluding home/work):
```bash
jq '[.semanticSegments[] | select(.visit) | select(.visit.topCandidate.semanticType != "INFERRED_HOME" and .visit.topCandidate.semanticType != "INFERRED_WORK") | .visit.topCandidate.placeId] | group_by(.) | map({placeId: .[0], count: length}) | sort_by(-.count)'
```

### Place Resolution

**Option A: Google Places API** (requires API key)
```python
# Resolve placeId to name/address/type
response = places.get(place_id=placeId)
# Returns: name, formatted_address, types (restaurant, cafe, etc.), rating
```

**Option B: Coordinate-based naming**
- Reverse geocode coordinates to neighborhood/city
- Use as fallback when no API key

### Output: Place Entities

```yaml
---
type: place
name: Some Restaurant
location:
  city: Tokyo
  country: Japan
  coordinates: [35.68, 139.76]
placeId: ChIJ...
category: restaurant
visits:
  - 2025-01-19
  - 2025-01-20
trips: [[Japan 2025]]
source: timeline-ingestion
---
```

### Linking to Trips

Each place entity should reference the trip(s) during which it was visited:
1. Match visit dates to trip date ranges
2. Add `trips: [[Trip Name]]` to frontmatter
3. Add `## Places Visited` section to trip files with backlinks

---

## Part 2: Activities Extraction

### Notable Activity Types

| Type | Count | Notes |
|------|-------|-------|
| SKIING | 35 | Nozawa Onsen, Jan 2025 |
| IN_FERRY | 8 | Island trips (Boracay? Siargao?) |
| CYCLING | 44 | Bike trips/rentals |
| IN_TRAIN | 58 | Train travel (Japan shinkansen?) |
| IN_SUBWAY | 38 | Metro usage |
| HIKING | ? | Check if exists |

### Extraction Commands

```bash
# Get all skiing activities
jq '[.semanticSegments[] | select(.activity.topCandidate.type == "SKIING") | {date: .startTime, duration: (.endTime, .startTime), start: .startLocation, end: .endLocation}]' Timeline.json

# Get all ferry trips
jq '[.semanticSegments[] | select(.activity.topCandidate.type == "IN_FERRY")]' Timeline.json

# Summary of all activity types
jq '[.semanticSegments[] | select(.activity) | .activity.topCandidate.type] | group_by(.) | map({type: .[0], count: length}) | sort_by(-.count)' Timeline.json
```

### Skiing Log Structure

Create a skiing activity log linked to the January 2025 Japan trip:

**Location:** Minami-Uonuma (南魚沼市), Niigata Prefecture - ski resort area

```yaml
---
type: activity-log
activity: skiing
trip: [[Japan 2025]]
location: Minami-Uonuma, Niigata
dates:
  start: 2025-01-20
  end: 2025-01-23
sessions: 35
source: timeline-ingestion
---

# Skiing Log - Niigata 2025

## Sessions

| Date | Sessions | Notes |
|------|----------|-------|
| 2025-01-20 | ... | |
| 2025-01-21 | ... | |
| 2025-01-22 | ... | |
| 2025-01-23 | ... | |
```

### Ferry/Island Trips

Cross-reference ferry activities with domestic trips:
- Boracay requires ferry from Caticlan
- Siargao might have ferry segments
- Could indicate day trips to nearby islands

---

## Implementation Steps

### Phase 1: Places ✅ DONE
1. ✅ Extract visits with coordinates and dates → `automations/extract_places.py`
2. ✅ Group by placeId to get unique places → `data/places_extracted.json`
3. ⏳ Resolve place names (needs API key) → `automations/enrich_places.py`
4. ✅ Match to trips by date range → `automations/create_place_entities.py`
5. ✅ Create Place entities → `entities/places/` (970 files)

### Phase 2: Skiing Log ✅ DONE
1. ✅ Extract all SKIING activities (22 sessions during Japan 2025)
2. ✅ Group by date to get daily sessions
3. ✅ Calculate durations (~37h total, 307km)
4. ✅ Create activity log → `entities/activities/2025-01-skiing-niigata.md`

### Phase 3: Other Activities ✅ DONE
1. ✅ Extract ferry, train, cycling activities
2. ✅ Cross-reference with trips
3. ✅ Add notable activities to 8 trip files

### Phase 4: Place Enrichment ⏳ PENDING
1. Get Google Places API key
2. Run `python automations/enrich_places.py`
3. Script will add: name, category, address, rating to each place

---

## Dependencies

- Existing trip entities (done ✓)
- Google Places API key (optional, for place name resolution)
- Geocode cache from trip extraction (done ✓)

## Output Files

| Type | Location | Example |
|------|----------|---------|
| Places | `entities/places/` | `tokyo-ramen-shop.md` |
| Activity Logs | `entities/activities/` | `2025-01-skiing-niigata.md` |
| Updated Trips | `entities/trips/` | Add `## Places Visited` sections |

## Notes

- Skip INFERRED_HOME and INFERRED_WORK visits only
- Extract ALL other places (restaurants, cafes, bars, shops, attractions, etc.)
- Link every place to its corresponding trip(s)
- Skiing data can feed into snow tracking system
- Google Places API recommended for proper place names and categories
