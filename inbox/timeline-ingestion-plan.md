# Timeline.json Ingestion Plan

## Source File
- `/data/Timeline.json` - 240MB Google Timeline export
- Contains 10,737 semantic segments

## Data Structure

```
Timeline.json
├── semanticSegments[]     # 10,737 entries
│   ├── visits (3,707)     # Place visits with placeId, coordinates
│   └── activities (2,934) # Movement between places
├── userLocationProfile
│   ├── frequentPlaces[]   # HOME, WORK, other frequent spots
│   └── frequentTrips[]    # Commute patterns
└── rawSignals[]           # Raw location pings (probably skip)
```

## Extractable Entities

### 1. Trips (High Value)
Identify distinct trips by analyzing flight segments and location clusters away from home.

**Flight segments found**: 46 total
- Sept 2024: Manila → Dubai → Johannesburg → Dubai → Manila
- Oct 2024: Manila → Singapore, likely Paris trip (searched addresses in Paris)
- Jan 2025: Japan (skiing in Nozawa Onsen area)

**Approach**:
1. Extract all FLYING activities with start/end coordinates
2. Reverse geocode coordinates to city names
3. Group consecutive flights into trip itineraries
4. Cross-reference with visit segments to identify accommodation stays

### 2. Places (Medium Value)
3,707 place visits with Google Place IDs.

**Breakdown**:
- 3,236 UNKNOWN (generic visits)
- 404 INFERRED_HOME
- 38 INFERRED_WORK
- 29 SEARCHED_ADDRESS (intentional destinations)

**Approach**:
1. Extract unique placeIds (dedupe)
2. Use Google Places API to resolve placeIds to names/addresses
3. Filter to significant places (visited multiple times or SEARCHED_ADDRESS)
4. Create Place entities for notable locations

### 3. Activities (Low-Medium Value)
Special activities worth noting:

| Type | Count | Notes |
|------|-------|-------|
| SKIING | 35 | Nozawa Onsen, Jan 2025 |
| IN_FERRY | 8 | Could indicate island trips |
| CYCLING | 44 | Possible bike trips |
| IN_TRAIN | 58 | Train travel segments |
| IN_SUBWAY | 38 | Metro usage |

## Implementation Steps

### Phase 1: Extract Trips
```bash
# Extract all flights with coordinates and dates
jq '[.semanticSegments[] | select(has("activity")) | select(.activity.topCandidate.type == "FLYING")]' Timeline.json > flights.json

# Group by date proximity to identify trip boundaries
# Reverse geocode start/end coordinates
```

Output: Create Trip entities in `entities/trips/`

### Phase 2: Resolve Place Names
```bash
# Get unique place IDs
jq '[.semanticSegments[] | select(has("visit")) | .visit.topCandidate.placeId] | unique' Timeline.json > place_ids.json

# Use Google Places API (needs API key) or manual lookup for top places
```

### Phase 3: Extract Notable Visits
For each identified trip, extract visits that occurred during that trip's date range.

### Phase 4: Create Skiing/Activity Logs
Extract skiing segments with dates for snow data tracking.

## Dependencies
- Google Places API key (optional, for place name resolution)
- Reverse geocoding service (for flight endpoints)

## Expected Output

### Trip Entities
```yaml
---
type: trip
name: South Africa 2024
status: completed
dates:
  start: 2024-09-19
  end: 2024-09-30
locations: [[Dubai], [Johannesburg]]
activities: [layover, safari?]
---
```

### Place Entities
```yaml
---
type: place
name: Nozawa Onsen
country: Japan
coordinates: [36.97, 138.83]
visits:
  - 2025-01-20
tags: [ski-resort, onsen]
---
```

## Notes
- Skip rawSignals (too granular, just GPS pings)
- Skip INFERRED_HOME/WORK visits (noise)
- Focus on SEARCHED_ADDRESS and trip-related visits
- Skiing data could feed into snow tracking in `/data/`
