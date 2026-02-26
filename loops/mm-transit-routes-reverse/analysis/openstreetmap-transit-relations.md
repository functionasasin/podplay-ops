# OpenStreetMap — Transit Relations for NCR (Bus Routes, Jeepney Routes)

**Source type**: Open community mapping project
**Retrieved**: 2026-02-26
**Coverage**: Bus routes well-mapped with geometry; jeepney routes mostly catalogued without geometry

---

## Summary

OpenStreetMap (OSM) is the **best publicly available source** for bus route geometry in Metro Manila. The OSM Philippines/Metro Manila mapping community has closely tracked the post-pandemic bus rationalization program, tagging route relations that align with LTFRB official designations. Bus route shapes (way members forming `type=route` relations) are extractable via Overpass API or Geofabrik PBF download.

However, jeepney/UV Express routes tell a different story: while the OSM Wiki catalogs 400+ T-series and 100+ modern jeepney routes in text/table form, only **~23 route relations** have been geometrically mapped in the NCR bounding box. Jeepney geometry in OSM is a critical gap.

---

## Overpass API Query Results

Bounding box used: `14.35°N, 120.78°E → 14.87°N, 121.21°E` (covers all NCR + buffer)

| Query | Count |
|-------|-------|
| `route=bus` + `network~LTFRB` | **581** relations |
| `route=share_taxi` (jeepney/UV Express) | **23** relations |

**Important caveat on bus count**: The 581 relations include **route_master** relations, directional variants (outbound/inbound), and nightly variants (N suffix). A single route like Route 6 may generate 3+ relations (route_master + inbound + outbound + nightly). Unique route count is approximately **100–130 distinct service patterns** across ~64 regular routes + P2P + BGC + QCityBus + PNR Augmentation + Love Bus.

---

## Bus Route Coverage (OSM Wiki)

### Regular City Bus Routes (Routes 1–64)

OSM documents 64 numbered city bus routes. Notable gaps in numbering (36, 47, 49–51, 60–61) align with routes not launched or cancelled after the 2020 rationalization. All are tagged `network=LTFRB PUB`.

Key documented routes:

| Ref | Endpoints | Operator |
|-----|-----------|----------|
| 1 | Bonifacio Monument → SM MOA → PITX (EDSA Carousel) | Jell Transport |
| 2 | Angono → Quiapo via Ortigas | De Guia Enterprises |
| 3 | Antipolo → Quiapo via Cubao | Jayross Lucky Seven Tours |
| 4 | PITX → Upper McKinley via Kalayaan | Green Frog |
| 5 | NLET → PITX | Alabang Transport Service Coop |
| 6 | Sapang Palay → PITX via Quezon Avenue | Fairview Bus |
| 7 | Fairview → PITX | Roval Transport |
| 8 | Angat → Divisoria | Sta. Monica Transport Coop |
| 9 | Angat → Monumento | Nuestra Señora del Carmen Trans |
| 10 | Ayala → Starmall Alabang | HM Transport |
| 11 | Pasay → Balibago | BBL Trans |
| 12 | Ayala → Biñan | JAC Liner |
| 13 | Bagong Silang → Santa Cruz via Malinta | Bagong Silang Transport Coop |
| 14 | Balagtas → PITX | Malanday Metro Link |
| 15 | BGC → Alabang | HM Transport |
| 16 | Eastwood Libis → Marriott via Acropolis | Citylink Coach Services |
| 17 | Fairview → Ayala via Quezon Avenue | W. Lippad |
| 18 | PITX → North EDSA via NAIA, McKinley, C-5 | Baclaran Metro Link |
| 19 | Norzagaray → Santa Cruz via Marilao | Santrans |
| 20 | Sapang Palay → Santa Cruz via Malinta | Earth Star Transport |
| 21 | Sapang Palay → Santa Cruz via Santa Maria | ES Transport |
| 22 | Santa Maria → PITX via Road 10 | Bovjen Transport Services |
| 23 | Plaza Lawton → Alabang via Coastal | Alabang Transport Service Coop |
| 24 | Plaza Lawton → Alabang via SLEx | Saint Rose Transit |
| 25 | Plaza Lawton → Biñan via SLEx | JAM Transit |
| 26 | PITX → Cavite City | Saulog Transit |
| 27 | PITX → Dasmariñas | San Agustin |
| 28 | PITX → Naic | Saulog Transit |
| 29 | PITX → Silang | Jasper Jean Liner |
| 30 | PITX → Balibago | Cher Transport |
| 31 | PITX → Trece Martires | Don Aldrin Transport |
| 32 | PITX → General Mariano Alvarez | Phil. Tourister Inc. |
| 33 | North EDSA → Starmall SJDM | Pascual Liner |
| 34 | PITX → Rodriguez via Quezon Avenue | Marikina Auto Line |
| 37 | Fairview → Monumento via VGC | Valenzuela Transport Coop |
| 38 | Pacita Complex → Fairview via Ayala | Dela Rosa Transit |
| 39 | Pacita → Fairview via C-5, Ayala | Worthy Transport |
| 40 | Fairview → Alabang (South Station) via C-5 | Pascual Liner |
| 41 | Fairview → FTI via C-5 | CEM Transport |
| 42 | Ayala → Malanday via C-5 | Nicholas Albert Transport |
| 43 | NAIA Loop | Mega Manila Transport Consortium |
| 44 | Alabang → Navotas via Sucat, Roxas Blvd | Alabang Metro Link |
| 45 | FTI → Navotas via Ayala Avenue | Alabang Metro Link |
| 46 | Pacita → Navotas via Ayala | Cher Transport |
| 48 | Pacita → Lawton via Ayala | Dela Rosa Transit |
| 52 | VGC → PITX via NLEX, A. Bonifacio | Multiple operators |
| 53 | PITX → Lancaster New City | Jasper Jean Liner |
| 54 | Navotas → Pandacan | Pandacan Transport Coop |
| 55 | Antipolo → McKinley Hill | RRCG Transport |
| 56 | McKinley Hill → Southwoods | — |
| 57 | Ayala → Southwoods | — |
| 58 | Alabang → Naic via Governor's Drive | Alabang Metro Link |
| 59 | Cubao → Dasmariñas | — |
| 62 | Pasay → Arca South | BGC Bus |
| 63 | BGC Loop | BGC Bus |
| 64 | Santa Maria → North EDSA via A. Bonifacio, Quezon Ave | Multiple operators |

### Special Service Routes

**P2P Routes (20+ documented)**:
| Code | Endpoints | Operator |
|------|-----------|----------|
| BA | Alabang → Bacoor | MetroExpress Connect |
| DA | Alabang → Dasmariñas | MetroExpress Connect |
| BM | Makati → Bacoor | MetroExpress Connect |
| — | BGC → Alabang Town Center | HM Transport |
| — | BGC → Calamba | HM Transport |
| — | BGC → PITX | Delta Neosolutions |
| — | Diliman → Balagtas | HM Transport |
| — | Diliman → Clark | Genesis Transport |
| — | One Ayala → SM Masinag | RRCG Transport |
| — | Greenbelt → Alabang Town Center | RRCG Transport |
| — | One Ayala → TriNoma | Fröhlich Tours |

**BGC Bus Routes** (`network=BGC Bus`):
- AS: Arca South Express
- AX: Ayala Avenue Express
- C: Central Route
- EX: East Express

**QCityBus Routes** (`network=QCityBus`, zero-fare):
- QC1: Cubao Route
- QC2: Litex Route
- QC3: Welcome Rotonda Route
- QC4: General Luis Route
- QC5: Quirino Highway Route
- QC6: Gilmore Route
- QC7: Ortigas Route
- QC8: Muñoz Route

**PNR Augmentation** (rail replacement bus):
- PNR-1: Alabang–Divisoria (HM Transport)
- PNR-2: FTI–Divisoria (HM Transport)

**Love Bus** (electric, zero-fare):
- L1: VGC–Batasan (Global Electric Transport)
- L2: VGC–Fairview (Global Electric Transport)

---

## Jeepney & UV Express Coverage (OSM Wiki)

The OSM wiki documents ~400+ T-series routes (T1xx–T4xx) plus ~100 modern numbered routes in tabular format. Each table entry includes: route code, name/endpoints, distance (km), and operator name.

Coverage by series:
- **T1xx–T2xx**: Camanava (Caloocan, Malabon, Navotas, Valenzuela), Bulacan, Metro Manila north
- **T3xx**: Central Manila, Quezon City, Makati, Mandaluyong, Pasay
- **T4xx**: Southern Metro Manila, Cavite, Laguna fringe
- **Modern numbered** (1xx, 2xx, 3xx, 400s): Post-consolidation routes under cooperatives

**Critical finding**: Of the 400+ T-series routes documented in the wiki, only **~23 have actual geometric route relations** mapped in OSM. The wiki page explicitly notes: *"Only a few stops are marked, some are also served by buses, and names or locations may only be known by word of mouth."*

This means OSM is **not a usable geometry source** for jeepney routes — only a useful catalog for names and operators.

---

## OSM Tagging Conventions

| Tag | Value (bus) | Value (jeepney) |
|-----|-------------|-----------------|
| `type` | `route` | `route` |
| `route` | `bus` | `share_taxi` |
| `network` | `LTFRB PUB` | `LTFRB PUJ` |
| `ref` | Route number (1, 2, ..., QC1, PNR-1) | T-code (T104, T215) |
| `operator` | Company name | Cooperative (if consolidated) |
| Nightly variant | `ref=XN` (N suffix) | — |
| Stop spacing | 400–500 m | 200 m (busy), 400 m (residential) |

---

## Stop Coverage

- **Bus stops**: Tagged as `public_transport=stop_position` or `public_transport=platform` at 400–500 m intervals along mapped routes. Many bus stops at major intersections have named nodes with lat/lon.
- **Jeepney stops**: Sparse. Named stops exist at terminals and rail transfer points; most intermediate stops are unnamed nodes on route relations or absent entirely.
- **No official stop coordinates file**: OSM is the best source for lat/lon of bus stops in NCR, but systematic extraction has not been done publicly.

---

## Alignment with LTFRB Official Data

OSM relation histories (e.g., relation 11181496 for Route 1/EDSA Busway) show edits such as:
- *"renaming city bus routes following updated route names per LTFRB GTFS"*
- Batch cleanup of Routes 1, 3, 4, 5–10, 19, 20, 22
- Deactivation of pre-pandemic jeepney routes post-ECQ

This confirms that active OSM contributors are syncing with official LTFRB data, making OSM bus data a reliable secondary source cross-checked against government records.

---

## Data Extraction Methods

To use OSM data as a GTFS source:

1. **Overpass API** — Query route relations directly:
   - Bus: `rel["type"="route"]["route"="bus"]["network"~"LTFRB"](14.35,120.78,14.87,121.21)`
   - Returns JSON with way members (geometry) and tags (name, ref, operator)

2. **Geofabrik PBF download** — Download Philippines PBF, filter for NCR transit relations:
   - File: `https://download.geofabrik.de/asia/philippines-latest.osm.pbf`
   - Filter with `osmfilter` for `type=route` + `network~LTFRB`

3. **osmtogtfs** — Python tool that converts OSM route relations → GTFS format:
   - Generates stops.txt, routes.txt, shapes.txt from OSM data
   - Used by OpenTripPlanner communities for informal transit

4. **TUMI Datahub Manila GTFS** — A previous operator has likely already done this extraction (to be confirmed in the TUMI aspect)

---

## Data Quality Assessment

| Aspect | Rating | Notes |
|--------|--------|-------|
| Bus route names & endpoints | HIGH | LTFRB-aligned, actively maintained |
| Bus route geometry (shapes) | HIGH | Way members form complete route shapes |
| Bus stop coordinates | MEDIUM | Present for key stops; gaps in outer areas |
| Jeepney route names | MEDIUM | 400+ catalogued in wiki tables |
| Jeepney route geometry | VERY LOW | Only ~23 of 400+ mapped with shapes |
| UV Express geometry | VERY LOW | Subsumed under jeepney; similarly sparse |
| Fare data | NONE | Not stored in OSM |
| Frequency/schedule data | NONE | Not stored in OSM |
| Last major update | ~2024 | LTFRB GTFS sync visible in edit history |

---

## Key Gaps Identified

1. **Jeepney geometry**: 400+ routes listed, only ~23 mapped — the single largest gap in OSM for this project
2. **UV Express geometry**: Minimal OSM mapping; routes mostly known by name only
3. **Stop coordinates for jeepney terminals**: Major terminals (Cubao, Pasay, Monumento, Divisoria, Baclaran) likely have nodes but intermediate stops are absent
4. **Fare data**: Completely absent from OSM (by design; must come from LTFRB)
5. **Frequencies**: Not in OSM

---

## Recommendations

- **Use OSM bus route relations** as the primary geometry source for the 64+ city bus routes — highest quality freely available data
- **Do NOT rely on OSM for jeepney geometry** — supplement with future Mapillary/KartaView imagery analysis or ground-truth field collection
- **Extract via Overpass API** or Geofabrik PBF for GTFS shape generation
- **Cross-reference OSM bus stop nodes** with EDSA Carousel stop list from our EDSA Busway analysis to get lat/lon for the 22-24 Carousel stops
- **OSM jeepney wiki tables** are useful for building routes.txt entries (names, operators, T-codes) even without geometry
