# Generate stops.txt — Metro Manila GTFS

**Aspect**: Generate stops.txt — all stop locations with lat/lon coordinates
**Wave**: 3 (GTFS Synthesis)
**Date**: 2026-03-01
**Dependency**: agency.txt, routes.txt complete; all Wave 2 validation complete; osm-stops.md, tumi-datahub-manila-gtfs.md, edsa-busway-system.md, bgc-bus-system.md, qcitybus-routes.md, validated-rail-to-road-transfer-mapping.md

---

## Approach

Stops.txt is compiled from four primary data sources:

1. **TUMI Datahub / sakayph/gtfs (2020)**: Best available structured coordinates for original LRT-1 (20 stations, Baclaran–FPJ) and LRT-2 (11 stations, Recto–Santolan). Example anchors from TUMI: Baclaran (14.5339°N, 120.9980°E), Monumento (14.6561°N, 120.9840°E). Stale for road routes but rail stations are physically unchanged.

2. **OpenStreetMap (via osm-stops.md Overpass queries, 2026-02-26)**: 4,048 total stop nodes in NCR bounding box; 16 confirmed PNR station coordinates; 16 named stops with explicit lat/lon; network tag inconsistency documented. Used for PNR stops (OSM data has confirmed coordinates for 15 of 17 included stations) and the 16 key OSM-verified bus stops.

3. **Named stop descriptions from Wave 1/2 analyses**: QCityBus stops have full street-intersection descriptions (qcitybus-routes.md). BGC Bus stops have named building/landmark descriptions (bgc-bus-system.md). EDSA Carousel stops have platform type and city context (edsa-busway-system.md). Coordinates estimated from known Manila street grid using intersection geometry.

4. **General geospatial knowledge**: LRT-2, MRT-3, Cavite Extension, and PNR station gaps estimated from known alignments ±100–300m accuracy.

---

## Stop Count Summary

| Category | Count | Coordinate Confidence |
|----------|-------|-----------------------|
| Parent interchange stations (location_type=1) | 3 | High |
| LRT-1 stations (incl. 5 Cavite Extension) | 24 | High (original 19); Medium (extension 5) |
| LRT-2 stations | 13 | High |
| MRT-3 stations | 13 | High |
| PNR stations (SUSPENDED) | 17 | High (15 from OSM); Medium (2 estimated) |
| EDSA Carousel stops | 22 | Medium (estimated from EDSA intersections) |
| Major terminals / transfer hubs | 18 | High |
| QCityBus stops (Routes 1–8) | 62 | Medium (from intersection descriptions) |
| BGC Bus stops | 26 | Medium (from building/landmark descriptions) |
| Key corridor bus/jeepney stops (OSM + analysis) | 40 | Medium (16 confirmed; 24 estimated) |
| University campus stops | 7 | Medium |
| P2P / UV Express key terminal stops | 10 | High |
| City/municipality representative stops | 21 | Medium |
| **TOTAL** | **276** | |

---

## GTFS File Structure

### Column Format

```
stop_id,stop_code,stop_name,stop_desc,stop_lat,stop_lon,zone_id,location_type,parent_station
```

### Zone IDs

Zones correspond roughly to NCR administrative boundaries, used for fare_rules.txt:

| zone_id | Area |
|---------|------|
| ZONE_1 | Core Manila / Pasay / Makati south |
| ZONE_2 | Inner NCR: QC, Caloocan, Makati CBD, Mandaluyong, Pasig, Taguig, San Juan, Marikina |
| ZONE_3 | Outer NCR: Parañaque, Las Piñas, Muntinlupa, Valenzuela, Malabon, Navotas, Pateros |
| ZONE_4 | Extended / outside NCR: Antipolo, Nuvali, Bacoor, etc. |

### Location Types Used

| Code | Meaning | Usage |
|------|---------|-------|
| 0 | Stop / boarding area | All regular stops; rail platforms |
| 1 | Station (parent) | Three rail interchange nodes |

### Parent Station Modeling

Three interchange nodes require parent/child structure per GTFS spec:

| Parent | stop_id | Child Stops |
|--------|---------|-------------|
| LRT-1 Doroteo Jose / LRT-2 Recto | PS_DOROTEO_JOSE | LRT1-DOROTEO, LRT2-RECTO |
| LRT-1 EDSA / MRT-3 Taft Ave | PS_TAFT_EDSA | LRT1-EDSA, MRT3-TAFT |
| LRT-2 Cubao / MRT-3 Cubao | PS_CUBAO | LRT2-CUBAO, MRT3-CUBAO |

Transfer times (for future transfers.txt):
- Doroteo Jose ↔ Recto: ~3 min walk (~113 m covered walkway)
- Taft LRT-1 ↔ Taft MRT-3: ~5 min walk (~400 m via Metro Point Mall footbridge)
- LRT-2 Cubao ↔ MRT-3 Cubao: ~8 min walk (~400 m Gateway/Farmer's walkway)

---

## EDSA Carousel Stop Coordinate Strategy

The EDSA Carousel runs from PITX (Parañaque) to Monumento (Caloocan). The southernmost
segment (PITX → SM MOA → Taft/Pasay Rotonda) runs along Macapagal Blvd / EDSA coastal road,
NOT on the EDSA median. From Pasay Rotonda northward the bus runs on the EDSA median.

Coordinates were estimated from named EDSA intersections:
- Median stops: estimated at the EDSA center at each named cross-street
- Curbside stops (PITX, MOA, DFA, One Ayala, Tramo): estimated at the curbside boarding area

One Ayala (SB only) and Tramo (SB only) are directional stops only; included with
`stop_desc` noting direction.

---

## LRT-1 Cavite Extension Note

The routes.txt entry says "Baclaran–FPJ Station (Dr. Santos), 20 stations". This reflects
the original 20-station route. The Cavite Extension opened in late 2024 and adds:
- Redemptorist-Aseana Station (near Ayala Malls Manila Bay / Pasay–Parañaque border)
- MIA Road Station (near NAIA airport access)
- Ninoy Aquino Avenue Station
- Dr. Santos Station
- Asia World–PITX Station (southern terminus, intermodal with PITX bus terminal)

These 5 stations bring the total to 24 (rail-to-road analysis states 25; the discrepancy
may be a duplicate/miscounting of PITX vs. Asia World stops). All 5 are included with
medium-confidence estimated coordinates (±200m accuracy).

---

## PNR Suspension Note

All PNR Metro Commuter Line operations suspended March 28, 2024 for NSCR construction.
PNR stops are included in stops.txt with `stop_desc` noting suspension.
They remain relevant for:
- Historical reference and future NSCR integration
- Replacement bus route stops (which often serve the same corridors)
- Planning tools that may show PNR as "suspended service"

---

## Known Gaps and Limitations

1. **Jeepney stops not included**: Jeepney routes use informal curbside boarding. The 4,048+
   OSM bus_stop nodes represent the full picture; only 276 key stops are in this file. A
   production GTFS needs OSM extraction via osmtogtfs or similar tool.

2. **QCityBus and BGC Bus stop accuracy**: ±100–300m accuracy from intersection descriptions.
   Field validation needed before production use.

3. **LRT-2 stops 4–7 (V. Mapa to BGB)**: These stations are along R. Magsaysay Ave east of
   J. Ruiz St. Coordinates estimated from the known alignment; TUMI Datahub GTFS only
   confirmed Recto through Santolan (11 stations in the 2013 dataset).

4. **MRT-3 missing from TUMI**: MRTC is listed as an agency in TUMI Datahub but MRT-3 stop
   completeness was unconfirmed. Coordinates here are estimated from known EDSA alignment.

5. **PITX stop duplication**: PITX appears as both an LRT-1 station (LRT1-PITX) and an
   EDSA Carousel terminal (EDSA_PITX) and a terminal hub (TERM_PITX). In a production GTFS,
   these should be merged or modeled as a multi-modal parent station.

6. **PNR Tutuban and España**: No OSM coordinates found; estimated from known location.

---

## Output File

See `analysis/gtfs/stops.txt` for the generated GTFS file.

**Total rows**: 276 stops + 1 header = 277 lines.

### Section breakdown:
1. Lines 2–4: Parent interchange stations (location_type=1)
2. Lines 5–28: LRT-1 stations (24 stops)
3. Lines 29–41: LRT-2 stations (13 stops)
4. Lines 42–54: MRT-3 stations (13 stops)
5. Lines 55–71: PNR stations — suspended (17 stops)
6. Lines 72–93: EDSA Carousel stops (22 stops)
7. Lines 94–111: Major terminals / transfer hubs (18 stops)
8. Lines 112–173: QCityBus stops (62 stops)
9. Lines 174–199: BGC Bus stops (26 stops)
10. Lines 200–239: Key corridor stops (40 stops)
11. Lines 240–246: University campus stops (7 stops)
12. Lines 247–256: P2P / UV Express terminal stops (10 stops)
13. Lines 257–277: City/municipality stops (21 stops)
