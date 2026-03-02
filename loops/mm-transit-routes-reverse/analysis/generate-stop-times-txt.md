# Generate stop_times.txt — Metro Manila GTFS

**Aspect**: Generate stop_times.txt — estimated arrival/departure times per stop
**Wave**: 3 (GTFS Synthesis)
**Date**: 2026-03-02
**Dependency**: agency.txt, routes.txt, stops.txt complete

---

## Approach

stop_times.txt links trips to stop sequences with timing. For Metro Manila's mixed-service
environment (~865 routes), three tiers of detail are applied:

### Tier 1 — Full Stop Sequences (Rail + BRT)

Routes with fixed schedules and all stops in stops.txt:
- **LRT-1**: 20 stations, Baclaran → FPJ (2 directions, ~43 min each)
- **LRT-2**: 13 stations, Recto → Antipolo (2 directions, ~34 min each)
- **MRT-3**: 13 stations, North Avenue → Taft (2 directions, ~32 min each)
- **PNR**: 17 stations, Tutuban → Muntinlupa (2 directions, ~90 min, SUSPENDED)
- **EDSA Carousel**: 20–22 stops, PITX → Fairview (2 directions, ~115 min NB, ~120 min SB)

### Tier 2 — Representative Sequences (BGC Bus, QCityBus)

Routes where key intermediate stops exist in stops.txt:
- **BGC Bus** (11 routes): 3–5 stops per direction using BGC stop nodes
- **QCityBus** (8 routes): 3–4 stops per direction using QCityBus stop nodes

### Tier 3 — Terminal-to-Terminal (All Other Routes)

For routes where only terminal stops are in stops.txt:
- 2 stops per direction: origin terminal → destination terminal
- Estimated travel time based on route type and known corridor distances
- Applies to: P2P (36 routes), City Bus BUS-* (73 routes), UV Express (114 routes),
  selected jeepney routes (~60 routes), shuttles/loops (10 routes)

---

## Timing Methodology

### Rail — Station-to-Station Timing

Based on known service parameters:
- **LRT-1**: Average ~2 min/station, ~30s dwell, total ~43 min (Baclaran–FPJ)
  - Slower segment: Monumento–Balintawak–FPJ (longer interstation)
- **LRT-2**: Average ~2.5 min/station, total ~34 min (Recto–Antipolo)
  - Longer gaps: Cubao–Anonas, Santolan–Antipolo (extended to surface)
- **MRT-3**: Average ~2.5 min/station, total ~32 min (North Ave–Taft)
  - Longer gap: GMA-Kamuning–Cubao (long interstation)
- **PNR**: Average ~4–5 min/station, total ~90 min (Tutuban–Muntinlupa)
  - Includes stop at all 17 NCR stations; SUSPENDED service

### EDSA Carousel — Stop-to-Stop Timing

- PITX to Taft/Pasay via Macapagal Blvd: ~20 min for 3 stops (curbside, no median lane)
- Taft to SM North via EDSA median: ~48 min for 14 stops (dedicated busway)
- SM North to Fairview extension: ~37 min for 3 stops (beyond standard service)
- Total NB: ~105 min; SB: ~120 min (Fairview → PITX)
- Southbound includes 2 additional stops: One Ayala (SB only) and Tramo (SB only)

### Bus/UV/Jeepney — Terminal-to-Terminal Travel Time Estimates

| Route Type | Distance Category | Estimated Time |
|------------|------------------|----------------|
| P2P (highway) | Short (<30km NCR) | 40–50 min |
| P2P (highway) | Long (>30km, provincial) | 60–90 min |
| City Bus | Inner NCR (<15km) | 40–50 min |
| City Bus | Medium NCR (15–25km) | 55–70 min |
| City Bus | Long NCR or cross-NCR | 75–100 min |
| UV Express | Short (<20km) | 30–40 min |
| UV Express | Medium (20–35km) | 45–55 min |
| UV Express | Long (>35km, provincial) | 60–75 min |
| Jeepney | Typical urban route | 25–45 min |
| BGC Bus | Within BGC (short) | 5–20 min |
| BGC Bus | To external terminal | 30–60 min |
| QCityBus | Within QC | 15–30 min |

---

## Trip ID Convention

All trip IDs follow: `{route_id}_WD_1` (direction 1) and `{route_id}_WD_2` (direction 2)

- Direction 1 = Outbound (toward named destination in route_long_name)
- Direction 2 = Return (back to named origin)
- `WD` = Weekday; weekend variants will be defined when calendar.txt is generated
- All representative trips use 06:00:00 as departure from first stop
- Times represent a single "template trip"; frequencies.txt will define headways

---

## PNR Stop Sequence Note

PNR stop coordinates in stops.txt have known accuracy issues (generated from OSM with
some coordinate uncertainty). The sequence used in stop_times.txt is based on the known
PNR Metro Commuter Line routing Tutuban → Muntinlupa, ordered to best match known PNR
alignment. All stops marked SUSPENDED.

---

## EDSA Carousel Stop Ordering

Stops are listed in geographic order for each direction:

**Northbound (PITX → Fairview)**: Skips EDSA-ONE-AYALA-SB and EDSA-TRAMO-SB
(southbound-only stops). Sequence: PITX → DFA → SM MOA → Taft/Pasay →
Magallanes → Ayala → Buendia → Guadalupe → Boni → Shaw → Ortigas →
Santolan → Cubao → Kamuning → Quezon Ave → TriNoma → SM North →
Monumento → Balintawak → Fairview

**Southbound (Fairview → PITX)**: Includes SB-only stops. Sequence adds
One Ayala (SB) between Buendia and Ayala, and Tramo (SB) between Magallanes and Taft.

---

## Coverage Statistics

| Category | Routes Covered | Stops per Trip (avg) | Rows in File |
|----------|---------------|----------------------|--------------|
| Rail (LRT1, LRT2, MRT3, PNR) | 4 routes × 2 dirs | 14 avg | 160 |
| EDSA Carousel | 1 route × 2 dirs | 21 avg | 42 |
| BGC Bus | 11 routes × 2 dirs | 4 avg | 88 |
| QCityBus | 8 routes × 2 dirs | 3.5 avg | 56 |
| P2P Bus | 36 routes × 2 dirs | 2 | 144 |
| City Bus (BUS-*) | 73 routes × 2 dirs | 2 | 292 |
| UV Express | 114 routes × 2 dirs | 2 | 456 |
| Jeepney / PUJ (selected) | 55 routes × 2 dirs | 2 | 220 |
| Shuttles / Loops / Other | 16 routes × 2 dirs | 2 | 64 |
| **TOTAL** | **~318 routes** | | **~1,522 rows** |

### Known Gaps

1. **Jeepney intermediate stops**: ~600 jeepney routes have NO intermediate stop data in
   stops.txt. Terminal-to-terminal only in this file. Field survey required for full data.
2. **Bus intermediate stops**: City bus routes only have terminal stops here. Official
   LTFRB route sheets or OSM bus_stop extraction needed for intermediate data.
3. **EDSA Carousel stop coordinates**: Estimated from EDSA intersections, ±50–150m
   accuracy. Exact platform locations need field verification.
4. **PNR coordinate uncertainty**: Stop coordinates in stops.txt for PNR have known
   inaccuracies. Service is SUSPENDED; included for historical reference.

---

## Output File

See `analysis/gtfs/stop_times.txt` for the generated GTFS file.

**Total rows**: ~1,522 stop_time entries + 1 header = ~1,523 lines.
