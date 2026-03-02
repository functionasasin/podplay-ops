# Generate trips.txt — Metro Manila GTFS

**Aspect**: Generate trips.txt — trip patterns for each route
**Wave**: 3 (GTFS Synthesis)
**Date**: 2026-03-02
**Dependency**: agency.txt, routes.txt, stops.txt, stop_times.txt, shapes.txt complete

---

## Output

`analysis/gtfs/trips.txt`

- **301 trip records** (+ 1 header = 302 lines)
- Generated programmatically from trip_ids in `stop_times.txt` and route metadata from `routes.txt`

---

## Approach

### Trip ID Source

All trip_ids were extracted from `stop_times.txt` (the already-generated file). This ensures
100% referential integrity between stop_times.txt and trips.txt — every trip_id referenced
in stop_times.txt is present in trips.txt.

### Trip ID Convention

The stop_times.txt generation established this pattern:
- `{route_id}_T1_OB` — outbound trip (direction_id = 0), toward named destination
- `{route_id}_T1_IB` — inbound trip (direction_id = 1), return toward origin

Only 8 routes have both OB and IB trip records (the 4 rail lines + EDSA Carousel,
each bidirectional). All other routes have OB-only representation in stop_times.txt
(terminal-to-terminal Tier 3 approach).

---

## Field Derivation

### route_id
Extracted from trip_id by stripping `_T1_OB` or `_T1_IB` suffix.

### service_id
| Value | Criteria | Count |
|-------|----------|-------|
| WD_FULL | All regular routes (Monday–Saturday operation) | 299 |
| WE_FULL | Routes containing "Weekend" in long_name (BGC Weekend, P2P-RRCG-006) | 2 |

Note: PNR is SUSPENDED but retains WD_FULL to indicate intended weekday service pattern;
its stop_times.txt entries are marked separately.

### trip_headsign
Extracted using the following priority:
1. **Hardcoded overrides** for routes whose names don't contain parseable origin–destination separators (LRT-1, LRT-2, MRT-3, PNR, EDSA Carousel, NAIA Loop)
2. **Em-dash splitting** on route_long_name: `origin – destination` → headsign = destination (OB) or origin (IB)
3. **Bidirectional arrow splitting** on `↔`: extracts appropriate endpoint
4. **Fallback**: full route_long_name

Hardcoded headsigns for key routes:

| Route | OB Headsign | IB Headsign |
|-------|-------------|-------------|
| LRT1 | FPJ / Congress | PITX / Cavite Ext. |
| LRT2 | Antipolo | Recto |
| MRT3 | Taft Avenue / EDSA | North Avenue |
| PNR | FTI / Muntinlupa (SUSPENDED) | Tutuban (SUSPENDED) |
| EDSA-CAROUSEL | SM North EDSA / Fairview | PITX / MOA |
| P2P-UBE-001 | NAIA Airport Loop (T1→T2→T4→T3) | — |

### direction_id
- 0 = Outbound (OB trips — all 297 non-bidirectional trips)
- 1 = Inbound (IB trips — LRT1, LRT2, MRT3, EDSA-CAROUSEL only)

### shape_id
Derived using formula: `SHP_` + `route_id.upper().replace("-","_").replace(".","_").replace(":","_")`
then validated against shape_id values present in shapes.txt.

Special override:
- `EDSA-CAROUSEL` → `SHP_EDSA_CAR` (abbreviated form used in shapes.txt)

| Coverage | Count |
|----------|-------|
| Trips with shape_id | 248/301 (82%) |
| Trips without shape_id (jeepney T-routes, some QCB, DOTR routes) | 53/301 (18%) |

### wheelchair_accessible
| Value | Meaning | Count |
|-------|---------|-------|
| 1 | Accessible (rail, modern bus, P2P, BGC Bus, QCityBus, Love Bus, modern PUJ) | 151 |
| 2 | Not accessible (UV Express vans, traditional jeepney routes) | 118 |
| 0 | Unknown (older city bus routes, Sakay-sourced routes without classification) | 32 |

---

## Trip Distribution by Mode

| Mode | Trips | Directions | Service |
|------|-------|------------|---------|
| Rail (LRT1, LRT2, MRT3) | 6 | OB+IB | WD_FULL |
| PNR (suspended) | 1 | OB only | WD_FULL |
| EDSA Carousel | 2 | OB+IB | WD_FULL |
| BGC Bus | 11 | OB only | WD_FULL (10) + WE_FULL (1) |
| QCityBus | 8 | OB only | WD_FULL |
| City Bus (BUS-*, CITY-*, LOVE-) | ~78 | OB only | WD_FULL |
| P2P Premium Bus | 36 | OB only | WD_FULL (35) + WE_FULL (1) |
| UV Express | 114 | OB only | WD_FULL |
| Jeepney / PUJ (selected) | ~55 | OB only | WD_FULL |
| **Total** | **301** | | |

---

## Known Limitations

1. **One trip per route per direction**: Each route has exactly one representative trip.
   Real service runs multiple trips per day — `frequencies.txt` (next aspect) will define
   headways to allow routing engines to extrapolate the full timetable.

2. **Inbound trips missing for most routes**: Only rail lines and EDSA Carousel have IB
   trips in stop_times.txt. All other routes are OB-only. Routing engines using
   `frequencies.txt` will handle reverse-direction requests by reversing the stop sequence.

3. **All-day service model**: `WD_FULL` represents the full operating window for each route.
   Routes that run peak-only (e.g., some P2P) or limited hours should ideally be
   `WD_PEAK`. This refinement requires per-route schedule data not yet captured.

4. **DOTR-coded jeepney routes** (e.g., `DOTR:R_SAKAY_PUJ_934`): shape_ids are blank
   because the colon in the route_id creates `SHP_DOTR:R_SAKAY_...` which wasn't
   pre-computed in shapes.txt. These routes have no geometry currently.

---

## How trips.txt Relates to Remaining Files

- **frequencies.txt** (next): References trip_ids here to define service headways
- **calendar.txt** (after): Defines which calendar dates each service_id is active
  - `WD_FULL` → Monday–Saturday
  - `WE_FULL` → Sunday only
- **fare_attributes.txt / fare_rules.txt**: Links fare pricing to these trips via route_id

---

## Output File

See `analysis/gtfs/trips.txt` — 301 trip records, 302 lines including header.
