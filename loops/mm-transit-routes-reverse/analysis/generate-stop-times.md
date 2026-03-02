# Generate stop_times.txt — Analysis

**Aspect**: Generate stop_times.txt — estimated arrival/departure times per stop
**Wave**: 3 (GTFS Synthesis)
**Date**: 2026-03-02
**Status**: Complete

---

## Output

File: `analysis/gtfs/stop_times.txt`
- **799 stop_time rows** across **301 trips**
- Header: `trip_id, arrival_time, departure_time, stop_id, stop_sequence, pickup_type, drop_off_type`

---

## Methodology

### Trip ID Convention

All trip IDs follow: `{route_id}_T1_OB` (outbound) or `{route_id}_T1_IB` (inbound).
These are **representative template trips** — one per direction per route.
When `frequencies.txt` is added, these templates become valid scheduled trips at the defined headways.
When `trips.txt` is generated, these same IDs must be used.

### Service Coverage by Mode

| Mode | Routes | Stop Detail Level | Notes |
|------|--------|-------------------|-------|
| LRT-1 | 1 (both directions) | Full 25-stop sequence | Includes Cavite Extension stations |
| LRT-2 | 1 (both directions) | Full 13-stop sequence | Recto–Antipolo |
| MRT-3 | 1 (both directions) | Full 13-stop sequence | North Ave–Taft |
| EDSA Carousel | 1 (both directions) | Full 22-stop sequence | PITX–Fairview |
| BGC Bus | 11 routes | 3–5 stops per trip | Internal BGC stops + connectors |
| City buses | ~30 routes | 2–4 stops per trip | Origin + key intermediate + destination |
| QCityBus | 8 routes | 2–3 stops per trip | Free QC Government service |
| P2P buses | ~35 routes | 2–3 stops per trip | Express (faster times used) |
| UV Express | ~80 routes | 2–3 stops per trip | Endpoint-only where data limited |
| Jeepneys (PUJ) | ~50 routes | 2 stops per trip (endpoints) | Insufficient intermediate data |
| UP shuttles | 5 routes | 2 stops per trip | Campus loops |

---

## Travel Time Estimates

### Rail (LRT/MRT)
- **Basis**: Known approximate total journey times from LRTA/MRT3 published data
- **LRT-1**: ~65 min PITX to FPJ (25 stations); ~2.5 min per station interval + 30s dwell
- **LRT-2**: ~35 min Recto to Antipolo (13 stations); ~2.5–4 min per station interval + 30s dwell
- **MRT-3**: ~28 min North Ave to Taft (13 stations); ~2 min per station interval + 30s dwell
- **Confidence**: High — cross-referenced against published schedules and travel accounts

### EDSA Carousel
- **Basis**: DOTr/MMDA published data; ~28km route; average speed ~18 km/h (median busway)
- **Total trip time**: ~93 min PITX to Fairview (22 stops)
- **Per-stop interval**: 3–8 min depending on corridor density
- **Confidence**: Medium — actual times vary significantly with traffic in mixed sections

### Road-based (Bus, UV Express, Jeepney)
- **Basis**: Estimated from route length, typical Metro Manila speeds, known travel forums
- **Short routes** (<15 km): 20–45 min
- **Medium routes** (15–30 km): 40–75 min
- **Long routes** (>30 km): 60–120 min
- **P2P/UV Express**: Faster (use expressways) — reduce by 20–30%
- **Confidence**: Low to medium — Metro Manila traffic highly variable (peak 2–4× off-peak)

---

## Key Limitations

1. **Intermediate stops**: Most jeepney and bus routes have only origin/destination stops.
   Full stop sequences require field data or GPS traces — not available from desk research.

2. **Direction asymmetry**: Only outbound trips have full sequences for rail/carousel.
   Inbound trips use reversed stop order with same timing — adequate for routing engines.

3. **No time-of-day variation**: These are representative base trips; frequency-based
   replication in `frequencies.txt` will handle peak vs. off-peak differences.

4. **PNR excluded**: PNR is marked SUSPENDED in stops.txt — no stop_times generated.

5. **Missing routes**: Approximately 500 routes in `routes.txt` lack sufficient stop data
   for even endpoint-level stop_times. These are:
   - ~400 additional jeepney routes in Sakay/DOTr database not yet mapped to stops.txt
   - These require a future iteration adding more stop nodes + stop_times rows

6. **Dwell time**: Fixed at 30s for intermediate stops, 60s at origin terminals.
   Rail actual dwell is ~20–30s; bus terminals vary from 2–15 min depending on schedule.

---

## Next Steps

- `trips.txt` must use the same trip IDs defined here
- `frequencies.txt` will add headways so routing engines replicate trips correctly
- A future iteration should expand stop_times to cover the remaining ~500 jeepney routes
  by adding intermediate stop nodes for major corridors (Taft, EDSA, Commonwealth, etc.)

---

## Files Written

- `analysis/gtfs/stop_times.txt` — 799 rows, 301 trips, GTFS-compliant CSV
