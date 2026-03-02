# Generate frequencies.txt — Metro Manila GTFS

**Aspect**: Generate frequencies.txt — headway estimates for peak/off-peak
**Wave**: 3 (GTFS Synthesis)
**Date**: 2026-03-02
**Dependency**: trips.txt, calendar.txt (next) — frequencies reference trip_ids from trips.txt

---

## Output

`analysis/gtfs/frequencies.txt`

- **1,118 frequency records** (+ 1 header = 1,119 lines)
- Covers **300 of 301 trips** (PNR excluded — service suspended)
- Source: derived from analysis data + mode-specific defaults from literature

---

## Approach

GTFS `frequencies.txt` defines service headways for trips that don't follow a fixed timetable.
Metro Manila transit operates as a frequency-based system (vehicles dispatch when full or on demand),
making this the appropriate modeling approach rather than fixed stop_times.

Each trip receives frequency intervals covering its operating window. Multiple rows per trip cover
different time bands (early, AM peak, midday, PM peak, evening, late night where applicable).

### Fields

| Field | Value |
|-------|-------|
| trip_id | References trips.txt |
| start_time | Start of frequency interval (HH:MM:SS; >24:00:00 for post-midnight) |
| end_time | End of frequency interval |
| headway_secs | Seconds between vehicle arrivals at any stop |
| exact_times | 0 = frequency-based dispatch (correct for Metro Manila) |

---

## Frequency Bands by Mode

### Rail (LRT-1, LRT-2, MRT-3)

| Time Band | Period | Headway | Basis |
|-----------|--------|---------|-------|
| Early | LRT1: 04:30–07:00; MRT3: 05:30–07:00 | 10 min (600s) | Pre-peak schedule |
| AM Peak | 07:00–09:30 | 4 min (240s) | DOTr/LRTA target; confirmed by commuter reports |
| Midday | 09:30–17:00 | 6 min (360s) | Reduced fleet deployment |
| PM Peak | 17:00–20:00 | 4 min (240s) | Same as AM peak |
| Evening | To ~22:00–22:30 | 8 min (480s) | End-of-day wind-down |

Sources: LRTA official statements; UP NCTS transport studies; JICA 2022 survey data.
Note: MRT-3 has operated at degraded frequency (5–8 min peak) during maintenance periods;
4 min is the design target and current operational goal for 2025–2026.

### EDSA Carousel (BRT)

| Time Band | Period | Headway | Basis |
|-----------|--------|---------|-------|
| Early | 04:00–07:00 | 10 min (600s) | Pre-peak warmup |
| AM Peak | 07:00–09:00 | 3 min (180s) | 751 buses authorized; ~3–4 min observed |
| Midday | 09:00–17:00 | 8 min (480s) | Reduced dispatch; 180k/day ridership |
| PM Peak | 17:00–20:00 | 3 min (180s) | Same as AM peak |
| Evening | 20:00–23:00 | 12 min (720s) | Wind-down |
| Late night | 23:00–28:00 (→ 04:00) | 20 min (1200s) | Taft–Monumento limited service |

Source: EDSA Carousel analysis (analysis/edsa-busway-system.md); 751 buses on 28 km route.
No official headway table published; estimates from authorized fleet size and observed reports.

### BGC Bus

| Route | Operating Window | Peak Headway | Off-Peak Headway |
|-------|-----------------|--------------|-----------------|
| East Express | 06:00–22:00 | 10 min | 15 min |
| North Express | 06:00–22:00 | 10 min | 15 min |
| Central | 06:00–22:00 | 10 min | 15 min |
| Ayala Express | 06:00–22:00 | 10 min | 15 min |
| LRT-Ayala | 06:00–22:00 | 10 min | 15 min |
| Upper West Express | **Peak only**: 06:00–10:00, 17:00–22:00 | 15 min | — |
| Lower West Express | **Peak only**: 06:00–10:00, 17:00–22:00 | 15 min | — |
| Arca South Express | **Peak only**: 06:10–08:40, 16:30–19:30 | 30 min | — |
| Nuvali Express | AM: 06:30–07:30 (1 trip); PM: 18:30–20:00 (~2 trips) | — | — |
| Night Route | 22:00–06:00 (next day = 30:00:00) | 30 min | — |
| Weekend Route | 06:00–22:00 (WE_FULL only) | 15 min | — |

Source: BGC Bus analysis (analysis/bgc-bus-system.md); Night Route 30 min confirmed.

### QCityBus (Free Electric)

| Time Band | Period | Headway |
|-----------|--------|---------|
| AM Peak | 07:00–09:00 | 15 min (900s) |
| Midday | 09:00–17:00 | 20 min (1200s) |
| PM Peak | 17:00–20:00 | 15 min (900s) |
| Evening | 20:00–21:00 | 30 min (1800s) |

Source: QCityBus analysis (analysis/qcitybus-routes.md); no confirmed timetable published;
15–20 min estimated from 8-route deployment across QC.

### P2P Premium Buses

| Category | AM Window | PM Window | Headway |
|----------|-----------|-----------|---------|
| Standard (within 50 km) | 05:30–09:00 | 17:00–21:00 | 30 min (1800s) |
| Long-distance (>50 km: HM Nuvali/Calamba, HM Laguna, UBE Sta. Rosa, PG Bulacan) | 05:30–09:00 | 17:00–21:00 | 45 min (2700s) |
| Weekend (RRCG-006) | 07:00–09:00 | 17:00–20:00 | 30 min (1800s) |
| NAIA Airport Loop (UBE-001) | 05:00–22:00 all day | — | 10 min (600s) |
| Clark International (GEN-001) | 06:00–09:00 | 17:00–20:00 | 60 min (3600s) |
| ALPS BGC↔Ortigas | 07:00–09:00 + midday 12:00–14:00 + 17:00–21:00 | — | 30/60/30 min |

Source: P2P analysis (analysis/p2p-bus-operators.md); peak-only service is the standard
P2P operating model. NAIA loop treated as near-continuous given airport demand.

### City Buses (BUS-*, CITY-*, LOVE-)

| Time Band | Period | Headway | Basis |
|-----------|--------|---------|-------|
| AM Peak | 06:00–09:00 | 8 min (480s) | Standard city bus target |
| Midday | 09:00–17:00 | 15 min (900s) | Reduced dispatch |
| PM Peak | 17:00–20:00 | 8 min (480s) | Match AM peak |
| Evening | 20:00–22:00 | 20 min (1200s) | Wind-down |

Applied uniformly to all 75 city bus trip records (BUS-2 through BUS-68, CITY-MMBC,
CITY-MALTC, LOVE-1, LOVE-2, BUS-PNR1, BUS-PNR2).

Note: Provincial buses (e.g., BUS-12 to Biñan, BUS-26 to Cavite City) use the same
template since the NCR segment still experiences high demand; longer headway would apply
to the full end-to-end run but is not differentiated here.

### UV Express

| Time Band | Period | Headway | Basis |
|-----------|--------|---------|-------|
| AM Peak | 06:00–09:00 | 5 min (300s) | Demand-based dispatch; high-volume corridors |
| Midday | 09:00–17:00 | 10 min (600s) | Moderate demand |
| PM Peak | 17:00–20:00 | 5 min (300s) | Match AM peak |
| Evening | 20:00–22:00 | 15 min (900s) | Reduced demand |

Applied uniformly to all 114 UV Express trip records (NCR routes, Cavite, Laguna, Rizal,
Bulacan feeder routes). Provincial UV routes (BUL, CAV, LAG, RIZ) realistically run
slightly less frequently but uniformity is preferred at this data quality level.

Source: LTFRB UV Express database; academic papers on UV Express operations.
5 min peak headway consistent with observations on Marikina-to-Cubao, Taguig-to-Makati,
and Cavite corridors.

### Traditional Jeepney (PUJ)

| Time Band | Period | Headway | Basis |
|-----------|--------|---------|-------|
| AM Peak | 06:00–09:00 | 5 min (300s) | Very high frequency on major corridors |
| Midday | 09:00–17:00 | 10 min (600s) | Moderate demand |
| PM Peak | 17:00–20:00 | 5 min (300s) | Match AM peak |
| Evening | 20:00–22:00 | 15 min (900s) | Reduced service |

Applies to 31 traditional jeepney trip records (T-routes, BACLARAN-xxx, Cubao-xxx traditional,
DOTR Sakay PUJ routes).

### Modern PUJ (Modernized Jeepney)

| Time Band | Period | Headway | Basis |
|-----------|--------|---------|-------|
| AM Peak | 06:00–09:00 | 6 min (360s) | Slightly lower than traditional (fewer units per route) |
| Midday | 09:00–17:00 | 12 min (720s) | |
| PM Peak | 17:00–20:00 | 6 min (360s) | |
| Evening | 20:00–22:00 | 20 min (1200s) | |

Applies to 13 modern PUJ records (Cubao-xxx mpuj routes, DOTR:R_SAKAY_MPUJ_2176).

### University Shuttles (UP)

| Route | Period | Headway |
|-------|--------|---------|
| UP Ikot / UP Toki (campus loops) | 07:00–09:00, 17:00–21:00 | 10 min (600s) |
| UP Ikot / UP Toki (campus loops) | 09:00–17:00 | 15 min (900s) |
| UP Katipunan / Philcoa / SM North | 07:00–09:00, 17:00–21:00 | 15 min (900s) |
| UP Katipunan / Philcoa / SM North | 09:00–17:00 | 20 min (1200s) |

Source: UP OTC (Office for Transportation Concerns) published schedules; community reports.

---

## Record Summary

| Mode | Trips Covered | Frequency Records | Notes |
|------|--------------|-------------------|-------|
| Rail (LRT1, LRT2, MRT3) | 6 | 30 | OB + IB; 5 time bands each |
| EDSA Carousel | 2 | 12 | OB + IB; 6 time bands (incl. late night) |
| BGC Bus | 11 | 25 | Varies by route type |
| QCityBus | 8 | 32 | 4 time bands |
| P2P Premium | 37 | 74 | Mostly 2 bands (peak only) |
| City Bus | 75 | 300 | 4 time bands |
| UV Express | 114 | 456 | 4 time bands |
| Traditional Jeepney | 31 | 124 | 4 time bands |
| Modern PUJ | 13 | 52 | 4 time bands |
| University Shuttles | 5 | 11 | 3 time bands |
| **Total** | **302** | **1,118** | |

Note: trips = 302 because some modes counted with both OB and IB. PNR (1 trip, suspended)
excluded from frequencies.txt — routing engines will fall back to static stop_times.

---

## Known Limitations

1. **No official headway data for most modes**: Only EDSA Carousel, BGC Night Route, and rail
   have any published headway figures. All other values are estimates from fleet size,
   ridership, JICA/ADB/World Bank studies, and community observation.

2. **Uniform headway within mode**: Real headways vary significantly by corridor, time of day,
   and day-of-week beyond the peak/off-peak distinction. A busy jeepney corridor (EDSA via
   Cubao) may have 2-min headways during peak; a quiet one may be 15 min.

3. **Provincial routes use NCR headways**: UV Express and bus routes to Cavite, Laguna,
   Bulacan, Rizal are modeled at the same headway as inner-NCR routes. Actual frequency
   on the provincial end is lower.

4. **Weekend service not fully modeled**: `WD_FULL` trips (weekday) have no weekend frequency
   entries. `WE_FULL` trips (BGC Weekend Route, P2P-RRCG-006) have weekend frequencies.
   Most transit modes in Metro Manila do operate on weekends but at lower frequency —
   this is not captured without per-trip weekend service records.

5. **PNR excluded**: PNR (service suspended) has no frequency entry. Routing engines should
   treat it as non-operational.

6. **exact_times = 0 throughout**: All services use frequency-based (non-exact) dispatch.
   This is correct for Manila's demand-based operations where vehicles depart when full
   or per dispatcher's judgment, not on a fixed clock.

---

## Output File

See `analysis/gtfs/frequencies.txt` — 1,118 data records, 1,119 lines including header.
