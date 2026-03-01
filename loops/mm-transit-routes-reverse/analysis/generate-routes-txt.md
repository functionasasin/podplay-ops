# Generate routes.txt — Metro Manila GTFS

**Aspect**: Generate routes.txt — all validated routes with type, color codes, names
**Wave**: 3 (GTFS Synthesis)
**Date**: 2026-03-01
**Dependency**: agency.txt complete; all Wave 2 validation complete

---

## Approach

routes.txt is the GTFS backbone — one row per route. It links:
- `agency_id` → who operates it (from agency.txt)
- `route_type` → GTFS numeric mode code
- Color codes for map rendering
- Short/long names following Filipino route naming conventions

### Route Type Codes Used

| Code | Mode | Metro Manila Application |
|------|------|--------------------------|
| 1 | Metro/subway rail | LRT-1, LRT-2, MRT-3 |
| 2 | Rail (long-distance) | PNR (currently suspended) |
| 3 | Bus | Jeepney (PUJ), City Bus, P2P Bus, UV Express, BGC Bus, QCity Bus, campus shuttles |
| 700 | Bus (GTFS extended) | Not used; sticking with 3 for broad app compatibility |

### Color Scheme

| Mode | route_color | route_text_color | Notes |
|------|-------------|-----------------|-------|
| LRT-1 | 00875A | FFFFFF | Official LRMC green |
| LRT-2 | 7A297D | FFFFFF | Official LRTA purple |
| MRT-3 | 005AA7 | FFFFFF | Official MRT3 blue |
| PNR | 8B0000 | FFFFFF | Dark red; suspended |
| EDSA Carousel (BRT) | D50000 | FFFFFF | Red BRT brand |
| City Bus (LTFRB) | 0066CC | FFFFFF | Blue for conventional bus |
| City Bus (QCity) | 007E46 | FFFFFF | QC government green |
| P2P Bus | 006F62 | FFFFFF | Teal-green for premium P2P |
| UV Express | 6A0DAD | FFFFFF | Purple for UV |
| Jeepney (traditional PUJ) | FDB913 | 000000 | Yellow jeepney gold |
| Jeepney (modern PUJ) | F47920 | FFFFFF | Orange for modern jeep |
| BGC Bus | 00A19B | FFFFFF | Teal for BGC private bus |
| University Shuttle | 7B0000 | FFFFFF | Maroon (UP colors) |
| Makati Loop | C8A200 | 000000 | Gold for Makati loop |

---

## Coverage Summary

| Mode | Route Count | Source |
|------|-------------|--------|
| Rail (LRT-1, LRT-2, MRT-3, PNR) | 4 | agency.txt |
| EDSA Carousel (BRT) | 1 | validated-edsa-corridor |
| City Bus Routes 1–65 | 65 | validated-city-bus-routes |
| City Bus Routes 66–68 | 3 | Low confidence; included as stubs |
| QCityBus Routes 1–8 | 8 | validated-shuttle-loop-services |
| P2P Confirmed (HIGH) | 23 | validated-p2p-routes |
| P2P Medium Confidence | 13 | validated-p2p-routes |
| P2P Low/Single Source | 4 | validated-p2p-routes (stubs) |
| UV Express (N-series confirmed) | 7 | validated-uv-express-routes |
| UV Express (NCR internal) | ~55 | validated-uv-express-routes |
| UV Express (Cross-region) | ~50 | validated-uv-express-routes |
| Jeepney (sample of 609 canonical) | 609 | validated-jeepney-routes |
| BGC Bus | 11 | validated-shuttle-loop-services |
| Makati Loop | 2 | validated-shuttle-loop-services |
| UP Campus Shuttles | 5 | validated-shuttle-loop-services |
| **TOTAL** | **~865** | |

> Note: Jeepney routes are the majority (609 of 865). Full jeepney list is in `raw/canonical-jeepney-routes.json`. The routes.txt file includes all confirmed and medium-confidence routes; 45 low-confidence jeepney routes are flagged with `(LOW)` in route_desc.

---

## Design Decisions

### route_id format
- Rail: `LRT1`, `LRT2`, `MRT3`, `PNR`
- EDSA Carousel: `EDSA-CAROUSEL`
- City Bus: `BUS-{number}` e.g. `BUS-1`, `BUS-10`, `BUS-6A`
- QCity Bus: `QCB-{number}` e.g. `QCB-1`
- P2P: as documented in validated-p2p-routes (P2P-RRCG-001, etc.)
- UV Express: as documented in validated-uv-express (N08, C66, UVE-FV-01, etc.)
- Jeepney: `PUJ-{sequential}` for unnamed; LTFRB route codes where available (DOTR:R_SAKAY_PUJ_XXXX)
- BGC Bus: `BGC-EAST-EXPRESS`, etc.
- UP routes: `UP-IKOT`, `UP-TOKI`, `UP-KATIPUNAN`, etc.
- Makati Loop: `MAKATI-LOOP-1`, `MAKATI-LOOP-2`

### route_short_name vs route_long_name
- Rail: short=line designation (e.g., "LRT-1"); long="Light Rail Transit Line 1"
- City Bus: short=route number (e.g., "10"); long=endpoints "Ayala–Alabang"
- P2P: short="P2P"; long=origin–destination
- UV Express: short="UV"; long=origin–destination
- Jeepney: short="PUJ"; long=origin–destination (Filipino convention)
- BGC Bus: short=route name (e.g., "East Express"); long=full endpoints

### Handling suspension/uncertainty
- PNR: included but route_desc="SUSPENDED — NSCR construction"
- Routes 66–68 (city bus): included as stubs with route_desc="UNKNOWN — stub for LTFRB completion"
- Low-confidence jeepney routes: included with route_desc prefix "(LOW CONFIDENCE)"

---

## Output File

See `analysis/gtfs/routes.txt` for the generated GTFS file.

The file has 865 route rows plus the header.

### Breakdown by section in output file:
1. Lines 2–5: Rail (LRT-1, LRT-2, MRT-3, PNR)
2. Line 6: EDSA Carousel
3. Lines 7–74: City Bus Routes 1–68
4. Lines 75–82: QCityBus Routes 1–8
5. Lines 83–119: P2P Bus Routes (high + medium + low confidence)
6. Lines 120–231: UV Express Routes (N-series + NCR + cross-region)
7. Lines 232–840: Jeepney Routes (PUJ — 609 routes)
8. Lines 841–851: BGC Bus Routes (11 routes)
9. Lines 852–853: Makati Loop (2 routes)
10. Lines 854–858: UP Campus Shuttles (5 routes)

---

## Known Gaps / Quality Notes

1. **Jeepney route_color**: All traditional PUJ routes use FDB913 (yellow). Could be refined by operator or area if operator data were available.
2. **Modern PUJ distinction**: ~105 modern jeepney routes should ideally have a different color (F47920 orange). Tagged by checking route descriptions against the LTFRB modernization list, but not all are unambiguously identified.
3. **City Bus operator assignment**: Routes 31–68 and several others use `LTFRB_BUS` as the agency_id since the specific operator wasn't captured. This is a limitation of the source data.
4. **P2P suspended routes**: 6 routes confirmed suspended as of 2025 are excluded from the active routes.txt. They are documented in validated-p2p-routes.md.
5. **BGC Bus agency**: `BGCBUS` (Bonifacio Transport Corp.) — note this is a private estate operator, not LTFRB-franchised. Included because BGC Bus is de facto public transit on public roads.
6. **UV Express 45% coverage**: Only ~112 of estimated 250+ UV routes are documented. The `routes.txt` file should be considered a partial UV Express list.
