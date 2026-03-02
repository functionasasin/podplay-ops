# GTFS Validation Report

**Validated:** 2026-03-02
**Feed:** Metro Manila Transit Routes GTFS (mm-transit-routes-reverse loop)
**Method:** Manual structural validation against GTFS Reference Specification (https://gtfs.org/schedule/reference/)

---

## File Inventory

| File | Lines (incl. header) | Status |
|------|---------------------|--------|
| agency.txt | 63 | ✅ Present |
| routes.txt | 859 | ✅ Present |
| trips.txt | 302 | ✅ Present |
| stop_times.txt | 794 (after dedup fix) | ✅ Present |
| stops.txt | 254 (after fix) | ✅ Present |
| shapes.txt | 1,010 | ✅ Present |
| calendar.txt | 3 | ✅ Present |
| fare_attributes.txt | 83 | ✅ Present |
| fare_rules.txt | 859 | ✅ Present |
| frequencies.txt | 1,119 | ✅ Present |

All 10 required/conditionally-required files are present.

---

## Field Headers Validated

All files have valid GTFS field headers:

- `agency.txt`: agency_id, agency_name, agency_url, agency_timezone, agency_lang, agency_phone, agency_fare_url, agency_email ✅
- `routes.txt`: route_id, agency_id, route_short_name, route_long_name, route_type, route_desc, route_color, route_text_color ✅
- `trips.txt`: route_id, service_id, trip_id, trip_headsign, direction_id, shape_id, wheelchair_accessible ✅
- `stop_times.txt`: trip_id, arrival_time, departure_time, stop_id, stop_sequence, pickup_type, drop_off_type ✅
- `stops.txt`: stop_id, stop_code, stop_name, stop_desc, stop_lat, stop_lon, zone_id, location_type, parent_station ✅
- `shapes.txt`: shape_id, shape_pt_lat, shape_pt_lon, shape_pt_sequence, shape_dist_traveled ✅
- `calendar.txt`: service_id, monday–sunday, start_date, end_date ✅
- `fare_attributes.txt`: fare_id, price, currency_type, payment_method, transfers, agency_id, transfer_duration ✅
- `fare_rules.txt`: fare_id, route_id, origin_id, destination_id, contains_id ✅
- `frequencies.txt`: trip_id, start_time, end_time, headway_secs, exact_times ✅

---

## Cross-Reference Integrity

### PASS — No Broken Foreign Keys

| Check | Result |
|-------|--------|
| routes.txt → agency.txt (agency_id) | ✅ All valid |
| trips.txt → routes.txt (route_id) | ✅ All valid |
| trips.txt → calendar.txt (service_id) | ✅ All valid (WD_FULL, WE_FULL) |
| stop_times.txt → trips.txt (trip_id) | ✅ All valid |
| fare_rules.txt → fare_attributes.txt (fare_id) | ✅ All valid |
| fare_rules.txt → routes.txt (route_id) | ✅ All valid |
| frequencies.txt → trips.txt (trip_id) | ✅ All valid |

### FIXED — Issues Corrected During Validation

**Issue 1: Duplicate stop_times rows (6 rows removed)**
Three UV Express trips had their stop_times block duplicated verbatim:
- `UVE-MAK-02_T1_OB` — 2×2 stops → 2 stops (fixed)
- `UVE-TAG-07_T1_OB` — 2×2 stops → 2 stops (fixed)
- `UVE-TAG-08_T1_OB` — 2×2 stops → 2 stops (fixed)

Root cause: Copy-paste duplication during stop_times generation.

**Issue 2: Missing stop definition — BGC-MOA-TERMINAL**
`BGC-WEEKEND_T1_OB` referenced `BGC-MOA-TERMINAL` in stop_times.txt but this stop was absent from stops.txt.
**Fix:** Added `BGC-MOA-TERMINAL` to stops.txt at coordinates 14.5353, 120.9832 (SM Mall of Asia, Pasay).

**Issue 3: Duplicate arrival times for stop_sequence 1–2 in IB trips**
Four inbound template trips had their second stop (seq=2) erroneously sharing the same arrival time as the first stop (seq=1):

| Trip | Stop seq 2 | Wrong time | Corrected to |
|------|-----------|-----------|-------------|
| LRT1_T1_IB | LRT1-BALINTAWAK | 05:05:00 | 05:07:30 |
| LRT2_T1_IB | LRT2-SANTOLAN | 05:05:00 | 05:09:00 |
| MRT3_T1_IB | MRT3-MAGALLANES | 05:05:00 | 05:07:00 |
| EDSA-CAROUSEL_T1_IB | EDSA-MONUMENTO | 05:00:00 | 05:04:00 |

Correction methodology: Used the outbound trip travel times between corresponding station pairs to derive correct IB travel times.

---

## Known Structural Issues (Not Fixed — By Design)

### 1. Routes Without Trips: 561 of 858 routes (65%)

858 routes are defined in routes.txt but only 297 have corresponding trip records in trips.txt. The remaining 561 routes will not be usable by GTFS routing engines (OpenTripPlanner, Valhalla, etc.) as the spec requires trips to be associated with routes.

**Why this happened:** routes.txt was built comprehensively from all validated sources (Wave 1–2 analysis), while trips.txt was generated for a representative subset (Wave 3 synthesis). The gap is not a GTFS spec violation per se — routes.txt can contain route definitions — but routing engines will silently ignore route-only entries.

**Routes without trips, by category:**

| Category | Count | Examples |
|----------|-------|---------|
| BLUM-* jeepney routes (Blumentritt corridor) | ~15 | BLUM-BACLARAN-LG, BLUM-MCU-RECTO |
| DIV-* jeepney routes (Divisoria corridor) | ~10 | DIV-TMKALAW, DIV-MALINTA |
| DOTR:R_SAKAY_* (Sakay/DOTr MPUJ routes) | ~10 | DOTR:R_SAKAY_MPUJ_1031 |
| JEEP-* (various jeepney routes) | ~20 | JEEP-ORTIGAS-ANGONO, JEEP-MarketMarket-Pasig |
| Bus routes 201, 302, 305, 311, 414 | 5 | (likely inactive or unverified routes) |
| Numbered JICA routes | 2 | JICA-JPN-001, JICA-JPN-002 |
| Miscellaneous (CUBAO-*, CCP-*, HULO-*) | ~10 | CUBAO-DIVISORIA-AURORA |

**Recommendation for next iteration:** Generate minimal trip entries for all routes (2 stops, no shape) so routing engines can at least represent them.

### 2. Trips Without shape_id: 53 of 301 trips (18%)

shape_id is optional in GTFS. These 53 trips will have no shape geometry in routing engines (typically shown as straight lines between stops). All affected trips have valid stop_times with at least 2 stops, so they are still routable.

**Affected trip groups:**
- BGC-LRT-AYALA_T1_OB (minor BGC internal route)
- DOTR:R_SAKAY_PUJ_* (legacy Sakay jeepney routes — no geometry source)
- T-series trips (T403, T414–416, T428–431, T436–438 — Baclaran-area jeepneys)
- BACLARAN-* jeepney routes (no geometry available)
- cubao-*-mpuj (Cubao modern PUJ routes — geometry pending)
- UP shuttle routes (UP-IKOT, UP-TOKI, UP-KATIPUNAN, UP-PHILCOA, UP-SM-NORTH)
- BUS-66, BUS-67, BUS-68 (LTFRB stub routes — unknown endpoint)

### 3. P2P_BASE and P2P_BASE_DISC Fares Without agency_id

Two fare entries have empty agency_id (rows 82–83 of fare_attributes.txt). GTFS allows agency_id to be empty when there is only one agency; with multiple agencies present, this is ambiguous. Used as a catch-all P2P fare for unspecified operators.

**Recommendation:** Assign to LTFRB_BUS as default operator, or remove and map affected routes to specific P2P fare entries.

### 4. Out-of-NCR Stop (P2P-NUVALI-TERMINAL)

Stop `P2P-NUVALI-TERMINAL` at 14.2150, 121.1420 is in Laguna (Nuvali, Sta. Rosa), outside Metro Manila bounds. This is **correct and expected** — the GTFS feed intentionally includes P2P route endpoints in nearby provinces (Laguna, Cavite, Bulacan, Rizal) to support end-to-end routing. Not an error.

---

## Data Quality Summary

### Stop Coverage
- **253 stops** defined (after fix)
- Rail stations: 25 (LRT-1 Cavite Ext.) + 24 (LRT-1 original) + 13 (LRT-2) + 13 (MRT-3) = 75 rail stops
- EDSA Carousel: 22 bus stops
- BGC Bus: ~20 internal stops
- Major terminals: ~30 city terminal stops
- City landmarks/endpoints: ~20 stops
- UV Express / P2P endpoints: ~60 stops

### Shape Coverage
- **1,010 shape points** across all shape files
- Shapes available for: LRT-1, LRT-2, MRT-3, EDSA Carousel, all BGC Bus routes, major numbered bus routes (2-3 points per route — straight-line approximation for road routes)
- Missing shapes: jeepney routes, UP shuttles, stub routes

### Confidence Distribution (across all routes.txt entries)
Based on confidence field in raw source data:
- High confidence: ~35% (rail lines, EDSA Carousel, BGC Bus, numbered city buses with official sources)
- Medium confidence: ~45% (P2P buses, UV Express routes with multiple source confirmation)
- Low confidence: ~20% (informal jeepney routes from single sources, stub routes)

---

## GTFS Spec Compliance Summary

| Requirement | Status |
|-------------|--------|
| Required files present | ✅ All 10 present |
| agency_id uniqueness | ✅ No duplicates |
| route_id uniqueness | ✅ No duplicates |
| trip_id uniqueness | ✅ No duplicates |
| stop_id uniqueness | ✅ No duplicates |
| stop_times.stop_sequence unique per trip | ✅ Fixed (removed 6 dups) |
| stop_times arrival ≤ departure per row | ✅ Valid |
| stop_times non-decreasing within trip | ✅ Fixed (4 IB trip time errors corrected) |
| All trip_ids in stop_times exist in trips | ✅ Valid |
| All stop_ids in stop_times exist in stops | ✅ Fixed (added BGC-MOA-TERMINAL) |
| All service_ids in trips exist in calendar | ✅ Valid |
| All shape_ids in trips exist in shapes | ✅ Valid (53 trips have no shape_id — permitted) |
| All agency_ids in routes exist in agency | ✅ Valid |
| All fare_ids in fare_rules exist in fare_attributes | ✅ Valid |
| Coordinates within plausible bounds | ✅ (1 out-of-NCR stop is intentional) |

---

## Recommendations for Field Validation

1. **Verify LRT-1 Cavite Extension stops**: Stations LRT1-21 through LRT1-25 were opened 2024–2025; confirm exact coordinates and station names against LRMC official data.
2. **Verify EDSA Carousel stop coordinates**: 22 stops were estimated from common knowledge; should be verified against SafeTravelPH GPS data or MMDA official bus stop markers.
3. **Add trip records for 561 route-only entries**: Minimum viable: 2-stop stub trips with endpoint stops to make routes discoverable in routing engines.
4. **Obtain jeepney route shapes from OSM**: Many jeepney routes have OSM relations (e.g., Cubao-Fairview, Cubao-Divisoria); extract WKT from OSM to populate missing shapes.
5. **Verify P2P fares**: Current P2P fares from 2024–2025 sources; some operators (RRCG, HM Transport) may have changed pricing.
6. **BUS-66, BUS-67, BUS-68**: LTFRB stub routes with unknown endpoints. Should be investigated or removed from the feed.
