# OpenStreetMap — Stop/Station Nodes (bus_stop, platform, stop_position)

**Source type**: Open community mapping project — node-level stop data
**Retrieved**: 2026-02-26
**Coverage**: Bus stops well-named; rail stations inconsistently tagged; 4,048+ total nodes

---

## Summary

OSM contains **4,048 unique transit stop nodes** in the NCR bounding box (14.35–14.87°N, 120.78–121.21°E), making it the largest publicly available stop coordinate database for Metro Manila. The naming rate is very high (**97%** for highway=bus_stop), though tagging consistency has significant issues: LTFRB network variants, sparse route_ref associations, and inconsistent rail station tagging.

For GTFS stops.txt generation, the recommended approach is to **extract stop nodes from route relation members** (already linked to specific routes) rather than querying standalone stop nodes, which avoids the network tag inconsistency problem.

---

## Stop Node Counts

| Tag Combination | Count | Notes |
|-----------------|-------|-------|
| `highway=bus_stop` | **3,109** | Primary tagging for bus stops; 97% named |
| `public_transport=platform` | **3,196** | Overlaps heavily with bus_stop; includes ways (shelters) |
| `public_transport=stop_position` | **705** | Carriageway/track positions; mix of bus and rail |
| Union (all three) | **~4,048** | Unique nodes after deduplication |
| `railway=station` + `railway=halt` | **47** | Mix of active PNR + planned subway |
| `station=subway` | **25** | Planned Metro Manila Subway + Manila MRT (future) |
| `railway=stop` | **141** | LRT/MRT/PNR track stop positions |
| `highway=bus_stop` with `route_ref` tag | **182** | 5.8% of bus stops explicitly link to route codes |
| `network=LRT/MRT/LRTA/MRTC` | **15** | Very sparse rail network tagging |

---

## Bus Stop Coverage

### Naming Quality

- **3,007 of 3,109** highway=bus_stop nodes have a `name=` tag (97%)
- Names follow Filipino naming conventions: intersection-based ("Quezon Avenue & Lung Center"), landmark-based ("SM City North EDSA"), or functional ("HM Transport Cubao")
- Geographic distribution covers all NCR cities — Quezon City, Manila, Makati, Taguig, Mandaluyong, Pasig, Caloocan, Valenzuela, Las Piñas, Parañaque, Muntinlupa, Marikina, and southern Metro Manila

### Network Tag Distribution

Significant inconsistency in LTFRB network tagging across the 3,109 bus_stop nodes (sample of 80 named stops):

| network= value | % of sample | Notes |
|----------------|-------------|-------|
| `(no tag)` | 51% | No network attribution |
| `LTFRB–National Capital Region` | 19% | Hyphen variant |
| `LTFRB PUB` | 14% | Mode-specific |
| `LTFRB National Capital Region` | 9% | Dash-free variant |
| `LTFRB PUJ` | 2.5% | Mode-specific |
| Others (`local`, `PUB;PUJ`, etc.) | 4.5% | Mixed/non-standard |

**Issue**: At least 4 different values are used for effectively the same network. No single consistent network tag exists. GTFS extraction should use all variants, not filter by one.

### Route-Stop Associations (route_ref)

Only **182 of 3,109 bus_stop nodes** (5.8%) have `route_ref` tags linking them explicitly to route numbers. These are concentrated at major terminals and transfer hubs:

Key examples:
| Stop | route_ref | Location |
|------|-----------|----------|
| Araneta - Cubao | 51;53;61;61C;61E;61N | Cubao, QC |
| Alabang Viaduct | 10;15;24;46;60;61;61N | Muntinlupa |
| VTX | 10;15;24;36;40;46;59;BA;PNR-1 | Alabang |
| Palar-Blueboz | 15;16;36;39;41;50;57;58;61;61C;61E | Fort Bonifacio |
| Congressional Ave & Mindanao Ave | 18;QC4 | Quezon City |
| Philippine Medical Association | 18;32;QC4 | EDSA/Quezon Ave |
| Quezon Ave & Lung Center | 5;6;7;T392 | Quezon City |

The sparse route_ref tagging means most stop-to-route linking must be inferred from route relations (where stops are listed as members).

### EDSA Busway Stops

**Zero** bus_stop nodes are tagged with `network=EDSA Carousel` or similar. EDSA Busway stations (22–24 stops) are in OSM but tagged inconsistently — some as `highway=bus_stop` with generic LTFRB network tags, some as platforms within route relations. No authoritative EDSA Carousel stop coordinate file exists in OSM at node level.

For EDSA Carousel stops, cross-reference the stop list from `analysis/edsa-busway-system.md` with known OSM landmark nodes near EDSA to approximate coordinates.

---

## Rail Station Coverage

### Active Rail Systems (PNR)

The 47 `railway=station/halt` nodes include **approximately 16 PNR stations**:

| Station | Lat | Lon | Notes |
|---------|-----|-----|-------|
| Governor Pascual | 14.67034 | 120.97273 | Northern terminus area |
| Asistio (10th) Avenue | 14.65186 | 120.97484 | Caloocan area |
| Caloocan | 14.65692 | 120.97388 | PNR Caloocan |
| Caloocan PNR Station | 14.65872 | 120.97382 | Duplicate node |
| C-3 Road | 14.64459 | 120.97628 | PNR, operator tagged |
| Blumentritt | 14.62263 | 120.98346 | No operator tag |
| Laon Laan | 14.61762 | 120.99162 | net=PNR Metro Commuter |
| España | ~14.61 | ~120.99 | Via stop_position |
| Pandacan | 14.59049 | 121.00894 | Confirmed PNR |
| Santa Mesa | 14.60075 | 121.01034 | No operator tag |
| Paco | 14.57904 | 120.99917 | PNR (duplicate node) |
| San Andres | 14.57315 | 120.99955 | PNR |
| Vito Cruz | 14.56692 | 121.00284 | PNR |
| EDSA | 14.54125 | 121.01675 | PNR EDSA |
| Nichols | 14.52351 | 121.02630 | PNR |
| Sucat | 14.45233 | 121.05093 | PNR |
| Alabang | 14.41719 | 121.04770 | net=PNR Metro South Commuter |

**Caveat**: Several duplicate nodes exist for the same station (e.g., two "Paco" nodes at nearly identical coordinates). These must be deduplicated.

### Planned Future Systems (NOT for current GTFS)

The remaining station nodes are for planned/under-construction systems — **include in GTFS only after lines open**:

| System | Nodes | Status |
|--------|-------|--------|
| Metro Manila Subway (MMS) | ~10 nodes | Under construction, opening ~2028 |
| North-South Commuter Railway (NSCR) | ~3 nodes (FTI, Bicutan, Sanate-DepEd) | Under construction |
| Manila MRT (future expansion) | 10 nodes (Korea Railroad Corp) | Planned, no construction start |

### Operating Rail (LRT-1, LRT-2, MRT-3)

**Critical finding**: LRT-1 (20 stations), LRT-2 (13 stations), and MRT-3 (13 stations) are **NOT consistently tagged** at node level with their network names.

- Only **15 nodes** have `network` matching LRT|MRT|LRTA|MRTC — mostly for "Manila MRT" (future) and 2 LRT-1 FPJ station stops
- The 141 `railway=stop` nodes include LRT/MRT stop track positions but without systematic network tagging
- LRT/MRT stations are mapped as nodes within their route relations, making them accessible via relation member queries only

**Best source for LRT-1, LRT-2, MRT-3 stop coordinates**: TUMI Datahub GTFS (hub.tumidata.org/dataset/gtfs-manila) — cited in earlier analyses as containing LRTA/MRTC stop coordinates. This should be confirmed in the TUMI Datahub aspect.

---

## Data Quality Assessment

| Metric | Rating | Detail |
|--------|--------|--------|
| Bus stop naming | **HIGH** (97%) | 3,007/3,109 named |
| Geographic coverage | **HIGH** | Nodes found in all NCR cities |
| Network tag consistency | **LOW** | 4+ LTFRB variants; 51% untagged |
| Route-stop linking | **LOW** (6%) | Only 182/3,109 have route_ref |
| EDSA Carousel stops | **LOW** | No specific Carousel tagging |
| PNR station coverage | **MEDIUM** | ~16 stations mapped; some duplicates |
| LRT-1/2 station nodes | **LOW** | Not systematically tagged at node level |
| MRT-3 station nodes | **LOW** | Same issue; use relation members |
| Planned system stations | N/A | Exclude from current GTFS |
| Stop spatial accuracy | **MEDIUM** | Community-verified at 400–500m spacing |

---

## GTFS Extraction Strategy

### Recommended: Extract via Route Relations

Do NOT query bus_stop nodes in isolation for GTFS stops.txt. Instead:

1. **For each bus route relation** (extracted in transit-relations aspect):
   - Read `stop_position` and `platform` members
   - These are already linked to the route — no route_ref guessing needed
   - Extract lat/lon, name, and any ref tags
2. **Use `osmtogtfs`** (Python tool) or `pyosmium` to automate this from the Geofabrik PBF
3. **Deduplicate**: Multiple routes share stops — group by node ID

### Node Query Strategy (Alternative)

If using standalone node queries for stops.txt:
- Query union of all network tag variants:
  `["network"~"LTFRB|BGC Bus|QCityBus|PNR"]`
- Include unnamed stops (51% of well-named nodes already there)
- EDSA Corridor: estimate stop positions from route relations + street intersection coordinates

### Rail Stops

- **PNR**: Use station nodes from railway=station query; deduplicate
- **LRT-1/2, MRT-3**: Query TUMI Datahub GTFS (previously identified as best source)
- **Planned systems**: Skip for current GTFS; note in calendar.txt or as separate agency

---

## Representative Named Stop Coordinates

Key stops with confirmed lat/lon from Overpass query (2026-02-26):

| Stop Name | Lat | Lon | Network |
|-----------|-----|-----|---------|
| Araneta Center-Cubao | 14.61993 | 121.05104 | LTFRB PUB |
| SM Mall of Asia | 14.53560 | 120.98350 | LTFRB PUB |
| SM City North EDSA | 14.65604 | 121.02811 | (untagged) |
| SM City Fairview | 14.73513 | 121.05716 | LTFRB–NCR |
| Lawton | 14.59312 | 120.98015 | (untagged) |
| Gil Puyat / Buendia | 14.55238 | 121.02336 | (untagged) |
| Roosevelt | 14.65766 | 121.01969 | LTFRB PUB |
| Monumento/Bagong Barrio | 14.65732 | 120.99786 | (untagged) |
| Ortigas/Greenhills | 14.60062 | 121.04868 | LTFRB PUB |
| Alabang Town Center | 14.42479 | 121.03127 | (untagged) |
| Quezon Ave & Lung Center | 14.64925 | 121.04618 | LTFRB–NCR |
| Fort Victoria (BGC) | 14.54757 | 121.04598 | (BGC) |
| Congressional Ave & Mindanao Ave | 14.66877 | 121.03499 | LTFRB PUB;QCityBus |
| Bayani Interchange | 14.51902 | 121.05161 | (untagged) |
| Malanday | 14.71724 | 120.95716 | (untagged) |
| Malinta (Valenzuela) | 14.69292 | 120.96704 | Valenzuela TMD |

---

## Key Gaps

1. **LRT-1, LRT-2, MRT-3 station nodes**: Not systematically tagged with network names; use TUMI Datahub GTFS instead
2. **EDSA Carousel-specific stops**: No Carousel-tagged stop nodes; estimate from route relations + EDSA stop list
3. **Jeepney stops**: Only ~23 jeepney route relations exist (from transit-relations aspect), and their stop members are sparse — most jeepney stop positions are unnamed nodes
4. **route_ref coverage**: Only 182 stops (6%) explicitly link to route codes; the remaining 95% require relation-member inference
5. **Network tag cleanup**: 4+ LTFRB network tag variants need normalization in GTFS pipeline
6. **Duplicate station nodes**: At least 2–3 PNR stations have duplicate nodes at similar coordinates

---

## Data Freshness

- Overpass API timestamp: 2026-02-26T16:05:04Z
- OSM Philippines base data is continuously updated by community contributors
- Bus stop nodes for post-2020 rationalized routes are likely current (edit history shows 2023–2024 edits synced with LTFRB naming)
