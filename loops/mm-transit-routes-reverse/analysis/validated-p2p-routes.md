# Validated Routes: All P2P Premium Bus Routes — Master List

**Validation type**: Wave 2 — Mode cross-reference and deduplication
**Compiled**: 2026-03-01
**Sources used**: p2p-routes.json (primary), sakay-ph-routes.json (Sakay p2p-gtfs + live Route Explorer),
moovit-routes.json, p2p-bus-operators.md, validated-taguig-bgc.md, validated-southern-metro-manila.md,
validated-makati.md, validated-quezon-city.md, transit-blogs-routes.json, facebook-commuter-groups-routes.json

---

## Overview

Metro Manila's Premium Point-to-Point (P2P) Bus Service launched March 2015 (initially "Express
Connect") under LTFRB and DOTr. As of early 2026, approximately **20–25 actively operating P2P routes**
serve NCR and Greater Manila Area (GMA). Peak count was ~31 routes (2018–2019); COVID and Froehlich's
closure in 2020 contracted this to ~15; recovery since 2022 has brought the network back to ~20–25.

**Key characteristics**:
- Fixed departure schedules; not on-demand
- 2–5 stops total per route
- AC coaches; many have Wi-Fi and restrooms
- Flat-rate fares (₱50–₱300 intra-NCR/GMA; higher for Laguna/Cavite/Pampanga)
- 20% SC/PWD/student discount (RA 9994/10754/11314)
- Payment: Beep Card, GCash, TRIPKO, GETPass (operator-dependent), cash

---

## Deduplication Notes

Several routes appear in multiple sources with minor naming or fare discrepancies:
- **Alabang Town Center ↔ One Ayala**: P2P-RRCG-001 (p2p-routes.json) = P2P_ALAMKT_1 (Sakay p2p-gtfs)
  = moovit-p2p-alabang-greenbelt1. These are the same route; Greenbelt/One Ayala terminal shifted
  post-2022. **Canonical terminal: One Ayala.**
- **Ayala South Park ↔ One Ayala**: P2P-RRCG-006 (p2p-routes.json) = moovit-p2p-south-park-greenbelt5.
  Same RRCG weekend route. **Canonical: ATC route (daily) + SouthPark variant (weekend).**
- **Vista Mall Taguig → EDSA Starmall Shaw**: moovit-p2p-8477054 = P2P-MEX-002 (p2p-routes.json).
  Operator: moovit says "UV Express" mode but this is MetroExpress Connect P2P. Same route.
- **Vista Mall Daang Hari/Bacoor → Starmall Alabang**: Sakay P2P_BCRALA_1 = P2P-MEX-003. Same route.
- **NAIA shuttle loop (T1-T2-T4-T3)**: P2P-UBE-001 listed as "p2p" but is a fixed-route shuttle,
  not a true P2P commuter route. Retained as P2P for GTFS purposes.
- **Robinsons Novaliches (Fairview) → One Ayala**: RRCG in p2p-routes.json; Sakay P2P_FRVMKT_1 notes
  "LINGKODPINOY" as operator but same Fairview–Makati corridor. **Conflict: operator name discrepancy.**
  RRCG is the confirmed current operator per p2p-bus-operators.md (multiple sources). LINGKODPINOY
  may be historical or a sub-contractor. **Resolution: RRCG; LINGKODPINOY flagged as possibly defunct.**

---

## Master Validated Route List

### CONFIRMED (2+ independent sources agree)

| Route ID | Route Name | Operator | Mode | Origin | Destination | Fare (Reg.) | Fare (Disc.) | Confidence | Sources |
|----------|-----------|----------|------|--------|-------------|-------------|--------------|-----------|---------|
| P2P-RRCG-001 | One Ayala Makati ↔ Alabang Town Center | RRCG Transport | p2p | One Ayala, Makati | Alabang Town Center, Muntinlupa | ₱110 | ₱88 | **HIGH** | p2p-routes, sakay-p2p-gtfs, moovit, validated-southern-mm, p2p-bus-operators |
| P2P-RRCG-002 | Starmall EDSA Shaw ↔ Alabang Town Center | RRCG Transport | p2p | Starmall EDSA-Shaw, Mandaluyong | Alabang Town Center, Muntinlupa | ₱140 | ₱112 | **HIGH** | p2p-routes, p2p-bus-operators, sakay-live, validated-southern-mm |
| P2P-RRCG-003 | Robinsons Antipolo/SM Masinag ↔ One Ayala Makati | RRCG Transport | p2p | Robinsons Antipolo / SM Masinag / Ayala Malls Feliz | One Ayala, Makati | ₱140 | ₱112 | **HIGH** | p2p-routes, sakay-live (P2P:R_IBMR9U4), p2p-bus-operators, validated-makati |
| P2P-RRCG-004 | Cainta/Sierra Valley ↔ One Ayala Makati | RRCG Transport | p2p | Sierra Valley / Robinsons Cainta | One Ayala, Makati | ₱90 | ₱72 | **HIGH** | p2p-routes, p2p-bus-operators, facebook-commuter-groups |
| P2P-RRCG-005 | Fairview (Robinsons Novaliches) ↔ One Ayala Makati | RRCG Transport | p2p | Robinsons Novaliches, Fairview, QC | One Ayala, Makati | ₱160 | ₱128 | **HIGH** | p2p-routes, sakay-p2p-gtfs (P2P_FRVMKT_1; operator conflict noted), validated-quezon-city |
| P2P-RRCG-006 | One Ayala Makati ↔ Ayala South Park (weekend) | RRCG Transport | p2p | One Ayala, Makati | Ayala South Park, Alabang | ₱110 | ₱88 | **HIGH** | p2p-routes, moovit (moovit-p2p-south-park-greenbelt5), p2p-bus-operators |
| P2P-HM-001 | BGC Market! Market! ↔ Alabang Town Center | HM Transport Inc. | p2p | Market! Market!, BGC, Taguig | Alabang Town Center, Muntinlupa | ₱120 | ₱100 | **HIGH** | p2p-routes, sakay-live (P2P:R_ORTMKT_1 area), validated-taguig-bgc, validated-southern-mm |
| P2P-HM-002 | BGC Market! Market! ↔ South Station Muntinlupa | HM Transport Inc. | p2p | Market! Market!, BGC | South Station, Muntinlupa | ₱100 | ₱80 | **HIGH** | p2p-routes, p2p-bus-operators, validated-taguig-bgc |
| P2P-UBE-001 | NAIA Shuttle Loop (T1–T2–T4–T3) | UBE Express (Air Freight 2100) | p2p | NAIA Terminal 1 | NAIA Terminal 3 | ₱50 | — | **HIGH** | p2p-routes, sakay-live (P2P_LIVE_UBE_NAIA), p2p-bus-operators, transit-blogs |
| P2P-UBE-002 | NAIA T3 ↔ PITX | UBE Express | p2p | NAIA Terminal 3, Pasay | PITX, Parañaque | ₱150 | — | **HIGH** | p2p-routes, p2p-bus-operators, validated-southern-mm |
| P2P-UBE-003 | NAIA T3 ↔ Victory Liner Pasay | UBE Express | p2p | NAIA Terminal 3, Pasay | Victory Liner Terminal, Pasay | ₱150 | — | **HIGH** | p2p-routes, p2p-bus-operators, transit-blogs |
| P2P-UBE-004 | NAIA T3 ↔ Robinsons Place Manila | UBE Express | p2p | NAIA Terminal 3, Pasay | Robinsons Place Manila, Ermita | ₱150 | — | **HIGH** | p2p-routes, p2p-bus-operators |
| P2P-UBE-005 | NAIA T3 ↔ Araneta City Cubao | UBE Express | p2p | NAIA Terminal 3, Pasay | Araneta City, Cubao, QC | ₱200 | — | **HIGH** | p2p-routes, p2p-bus-operators, validated-quezon-city |
| P2P-UBE-006 | NAIA T3 ↔ The District Imus, Cavite | UBE Express | p2p | NAIA Terminal 3, Pasay | The District Imus, Cavite | ₱200 | — | **HIGH** | p2p-routes, p2p-bus-operators (added Nov 2024) |
| P2P-UBE-007 | NAIA T3 ↔ Robinsons Sta. Rosa, Laguna | UBE Express | p2p | NAIA Terminal 3, Pasay | Robinsons Sta. Rosa, Laguna | ₱300 | — | **HIGH** | p2p-routes, p2p-bus-operators, transit-blogs |
| P2P-DNS-001 | UP Town Center ↔ One Ayala Makati | Delta Neosolutions (DNS) | p2p | UP Town Center, QC | One Ayala, Makati | ₱100 | — | **HIGH** | p2p-routes, sakay-live (P2P:R_3126KJ3), p2p-bus-operators, validated-quezon-city |
| P2P-SRT-001 | Calamba ↔ Makati (One Ayala) | Saint Rose Transit (Calamba P2P Inc.) | p2p | Calamba, Laguna | One Ayala / Glorietta, Makati | ₱160 | — | **HIGH** | p2p-routes, sakay-live (P2P_LIVE_HM_CAL1), p2p-bus-operators |
| P2P-SRT-002 | Calamba ↔ BGC Market! Market! | Saint Rose Transit | p2p | Calamba, Laguna | Market! Market!, BGC | ₱180 | — | **HIGH** | p2p-routes, sakay-live (P2P_LIVE_HM_CAL2), p2p-bus-operators |
| P2P-SRT-003 | Calamba ↔ Lawton | Saint Rose Transit | p2p | Calamba, Laguna | Lawton, Ermita, Manila | ₱180 | — | **HIGH** | p2p-routes, p2p-bus-operators, validated-manila-city-proper |
| P2P-ML-001 | Dasmariñas ↔ Cubao | Alabang Metrolink Bus Corp | p2p | Robinsons Dasmariñas Pala Pala, Cavite | Araneta City, Cubao, QC | ₱130 | — | **HIGH** | p2p-routes, sakay-live (P2P:R_981DRLL-DAS), p2p-bus-operators |
| P2P-ML-002 | Alabang ↔ Cubao | Alabang Metrolink Bus Corp | p2p | Starmall Alabang, Muntinlupa | Araneta City, Cubao, QC | ₱90 | — | **HIGH** | p2p-routes, sakay-live (P2P:R_981DRLL), p2p-bus-operators, validated-quezon-city |
| P2P-MEX-003 | Vista Mall Daang Hari Bacoor ↔ Starmall Alabang | MetroExpress Connect Inc. | p2p | Vista Mall Daang Hari, Bacoor, Cavite | Starmall Alabang (VTX), Muntinlupa | ₱50 (intro) | ₱40 | **HIGH** | p2p-routes, sakay-p2p-gtfs (P2P_BCRALA_1), moovit (moovit-p2p-daang-hari-starmall) |
| P2P-PG-001 | SM North EDSA/Trinoma ↔ Bulacan (8 routes) | Precious Grace Transport Services | p2p | SM North EDSA / Trinoma, QC | Bocaue/Caypombo/Malolos/Pandi/Balagtas/Plaridel (var.) | ₱70–₱100 | — | **HIGH** | p2p-routes, p2p-bus-operators, validated-quezon-city |

### MEDIUM CONFIDENCE (single strong source or minor conflict)

| Route ID | Route Name | Operator | Fare | Confidence | Issue |
|----------|-----------|----------|------|-----------|-------|
| P2P-HM-003 | One Ayala/Glorietta ↔ Nuvali, Sta. Rosa | HM Transport / TAS Trans | ₱200 | **MEDIUM** | Exact operator split (HM vs TAS Trans) unconfirmed; Saint Rose Transit also serves Sta. Rosa corridor |
| P2P-HM-004 | Glorietta 3 ↔ Calamba | HM Transport | ₱200 est. | **MEDIUM** | May overlap with SRT-001; distinct origin/terminus confirmed but fare unverified |
| P2P-DNS-002 | Robinsons Antipolo ↔ One Ayala Makati | Delta Neosolutions | unconfirmed | **MEDIUM** | Sakay ID P2P:R_CQ76B22 confirmed; fare not public. Overlaps RRCG-003 (same corridor, different operator) |
| P2P-MEX-001 | Vista Mall Taguig ↔ Trasierra, Makati | MetroExpress Connect | ~₱100 | **MEDIUM** | Validated-taguig-bgc attributes to Genesis; p2p-bus-operators to MetroExpress. **Operator conflict.** |
| P2P-MEX-002 | Vista Mall Taguig ↔ Starmall EDSA Shaw | MetroExpress Connect | ~₱100 | **MEDIUM** | Moovit confirms route; operator listed as "UV Express" mode (misclassified). Confirmed as P2P. |
| P2P-MEX-004 | Vista Mall Bacoor ↔ Trasierra, Makati | MetroExpress Connect | varies | **MEDIUM** | Confirmed via CAVITEX; fare not public |
| P2P-COMET-001 | SM Fairview ↔ UnionBank Plaza Ortigas | COMET Bus / GET Philippines | ₱100 | **MEDIUM** | Electric bus; confirmed in Fairview terminal analysis; exact Sakay route ID not captured |
| P2P-COMET-002 | Merville, Parañaque ↔ Ayala Circuit, Makati | COMET Bus / GET Philippines | ₱100 | **MEDIUM** | Validated-southern-mm confirms; McKinley Hill intermediate stop possible but unconfirmed |
| P2P-ALPS-001 | SM Lipa/Batangas City ↔ Market! Market! ↔ SM Megamall Ortigas | Alps the Bus Inc. | ₱250–₱380 | **MEDIUM** | Provincial route with NCR P2P stops. Intra-NCR fares (Batangas→BGC, BGC→Megamall leg) unclear |
| P2P-GEN-001 | Cubao/Trinoma ↔ Clark International Airport | Genesis Transport | ₱280 | **MEDIUM** | Confirmed Mon–Fri; NAIA T3 variant also exists. Drops at SM North EDSA northbound |
| P2P-NDL-001 | Alabang ↔ Lawton | N. Dela Rosa Liner | ₱100 | **MEDIUM** | Confirmed in Lawton terminal analysis; semi-express format |
| P2P-SAT-001 | Circuit Makati ↔ Cavite destinations (Las Piñas, Imus) | San Agustin Transport | ₱115 | **MEDIUM** | SM Southmall–Glorietta route confirmed in validated-southern-mm; multiple Cavite sub-routes |
| P2P-RRCG-007 | One Ayala ↔ Katipunan, QC | RRCG Transport | unconfirmed | **MEDIUM** | Mentioned in p2p-bus-operators route table; fare unverified; single mention |

### SINGLE SOURCE / LOW CONFIDENCE

| Route ID | Route Name | Operator | Notes |
|----------|-----------|----------|-------|
| P2P-HM-005 | Robinsons Novaliches ↔ Glorietta 3 | HM Transport | Mentioned in p2p-bus-operators.md; not confirmed in Sakay or other aggregators; exact fare ~₱100 |
| P2P-MEX-005 | Vista Mall Dasmariñas ↔ Trasierra, Makati | MetroExpress Connect | Single mention; Dasmariñas is outside NCR; CAVITEX routing assumed |
| P2P-PG-002 | Eastwood ↔ Makati CBD | Precious Grace / Riding Public First | Mentioned in p2p-bus-operators; fare ~₱100; overlap with DNS Antipolo–Makati |
| P2P-PG-003 | SM North EDSA ↔ Primark Mall, Bulacan | Precious Grace | No fare info; status uncertain |

### SUSPENDED / DEFUNCT

| Route ID | Route Name | Operator | Status | Notes |
|----------|-----------|----------|--------|-------|
| P2P-UBE-S01 | NAIA T3 ↔ Ayala Malls Manila Bay | UBE Express | **SUSPENDED** | Suspended as of 2025 |
| P2P-UBE-S02 | NAIA T3 ↔ One Ayala Makati | UBE Express | **SUSPENDED** | Suspended as of 2025 |
| P2P-UBE-S03 | NAIA T3 ↔ Robinsons Galleria | UBE Express | **SUSPENDED** | Suspended Dec 13, 2024 |
| P2P-UBE-S04 | NAIA T3 ↔ Vista Terminal Exchange Alabang | UBE Express | **SUSPENDED** | Suspended |
| P2P-DEFUNCT-FRO-001 | SM North EDSA ↔ SM Megamall | Froehlich/Froelich Tours | **DEFUNCT** | Franchise expired ~2020 (Wirecard scandal); ₱65/₱50 historical fare |
| P2P-DEFUNCT-FRO-002 | Trinoma ↔ Ayala Center Makati | Froehlich/Froelich Tours | **DEFUNCT** | Franchise expired ~2020; ₱95/₱75 historical fare |

---

## Fare Summary by Corridor (Validated)

| Corridor | Range | Active Operators | Confidence |
|----------|-------|-----------------|-----------|
| Makati CBD ↔ Alabang | ₱110–₱120 | RRCG (ATC, SouthPark), HM Transport (ATC, South Station) | HIGH |
| Makati CBD ↔ Antipolo/Cainta/Masinag/Sierra Valley | ₱90–₱140 | RRCG, DNS | HIGH |
| Makati CBD ↔ Fairview/Novaliches QC | ₱160 | RRCG | HIGH |
| Makati CBD ↔ Calamba, Laguna | ₱160–₱200 | Saint Rose Transit, HM Transport | HIGH |
| BGC (Taguig) ↔ Alabang | ₱100–₱120 | HM Transport (2 routes) | HIGH |
| BGC ↔ Calamba | ₱180 | Saint Rose Transit | HIGH |
| Mandaluyong (EDSA Shaw) ↔ Alabang | ₱140 | RRCG | HIGH |
| NAIA Terminal 3 ↔ Metro Manila | ₱50–₱200 | UBE Express (7 active routes) | HIGH |
| NAIA Terminal 3 ↔ Laguna/Cavite | ₱200–₱300 | UBE Express | HIGH |
| Quezon City (UP Town) ↔ Makati | ₱100 | Delta Neosolutions | HIGH |
| QC (SM North/Trinoma) ↔ Bulacan | ₱70–₱100 | Precious Grace Transport | HIGH |
| Cavite (Bacoor) ↔ Alabang | ₱50 (intro) | MetroExpress Connect | HIGH |
| Cavite (Dasmariñas/NAIA) ↔ Metro Manila | ₱130–₱200 | Alabang Metrolink, UBE Express | HIGH |
| Alabang ↔ Cubao QC | ₱90 | Alabang Metrolink | HIGH |
| Dasmariñas ↔ Cubao QC | ₱130 | Alabang Metrolink | HIGH |
| Taguig (Vista Mall) ↔ Makati/Mandaluyong | ~₱100 | MetroExpress Connect | MEDIUM |
| Laguna (Sta. Rosa/Nuvali) ↔ Makati/BGC | ₱200 | HM/TAS Trans, BGC Bus | MEDIUM |
| NCR ↔ Clark/Pampanga | ₱280 | Genesis Transport | MEDIUM |
| Fairview/Parañaque ↔ Ortigas | ₱100 | COMET Bus / GET Philippines | MEDIUM |
| Batangas ↔ BGC/Ortigas | ₱250–₱380 | Alps the Bus | MEDIUM |

---

## Cross-Source Conflict Analysis

| Conflict | Source A | Source B | Resolution |
|---------|---------|---------|-----------|
| Fairview → Makati operator | RRCG (p2p-routes.json, p2p-bus-operators.md) | LINGKODPINOY (sakay-p2p-gtfs P2P_FRVMKT_1, frozen Jun 2020) | **RRCG is current** — Sakay p2p-gtfs is frozen at Jun 2020 and outdated. LINGKODPINOY appears historical. |
| Vista Mall Taguig → Trasierra operator | MetroExpress Connect (p2p-routes.json) | Genesis Transport (validated-taguig-bgc.md) | **Unresolved** — both are plausible Vista Mall Corridor operators. Flag for field validation. |
| P2P-DNS-002 Antipolo ↔ Makati vs P2P-RRCG-003 | Delta Neosolutions (Sakay) | RRCG (p2p-routes.json) | **Both are active** — different operators, same Antipolo–Makati corridor. Route IDs P2P:R_CQ76B22 (DNS) and P2P:R_IBMR9U4 (RRCG). Confirmed parallel services. |
| HM Transport fare at BGC–Alabang | ₱120 (p2p-routes.json) | ~₱65–80 (validated-taguig-bgc.md) | **₱120 is regular fare from official source** — ₱65–80 range may reflect older or intermediate fare. Use ₱120. |
| Vista Mall Taguig → EDSA Starmall mode | "p2p" (p2p-routes.json) | "uv_express" (moovit) | **P2P is correct** — MetroExpress is a licensed P2P operator. Moovit mis-tagged the mode. |

---

## Gap Analysis

### Coverage Gaps

1. **Northern QC → CBD P2P**: Froehlich's closure eliminated direct P2P from SM North/Trinoma area to
   Makati/Ortigas. RRCG-005 covers Fairview→Makati and Precious Grace covers Trinoma→Bulacan, but
   **no active P2P connects SM North EDSA / Trinoma directly to BGC or Ortigas**. This is a structural
   gap since 2020.

2. **Mandaluyong / San Juan → Any P2P**: No P2P routes originate from or terminate in Mandaluyong or
   San Juan (EDSA Shaw terminal serves Shaw, not Shaw-originating routes). Gap identified.

3. **Valenzuela / Malabon / Navotas → CBD**: No P2P routes documented for these northern Manila Bay
   cities. Commuters rely entirely on regular buses and jeepneys to EDSA.

4. **Eastbound P2P from Manila**: No P2P routes serve Manila (Ermita/Malate) eastward to Ortigas or
   BGC. Lawton terminal is westward-facing (to provincial Laguna).

5. **Post-Froehlich north corridor**: The Trinoma–Ayala Center route (₱95) was the most useful direct
   P2P in Metro Manila; its absence continues to force EDSA Carousel + jeepney transfers.

6. **UBE Express route suspension**: Four routes suspended (Ayala Manila Bay, One Ayala, Galleria,
   Vista Alabang). One Ayala suspension notably creates airport-to-Makati CBD gap (NAIA T3 → Makati
   now requires transfer). May resume — monitor.

### Data Gaps (missing information)

- **LTFRB franchise codes**: No official P2P franchise certificate numbers found publicly for any
  operator (P2P routes use different LTFRB designation from numbered city bus routes)
- **GPS coordinates**: P2P stops are named landmarks (malls, terminals); no authoritative lat/lon
  published; must be derived from OSM POI nodes in GTFS synthesis
- **Geometry**: No route shapes from any P2P operator; road-following geometry must be estimated
- **Weekend schedules**: Weekend service varies significantly; Precious Grace and DNS weekday-only;
  RRCG and HM have reduced weekend schedules not fully documented

---

## GTFS Synthesis Implications

### Agencies Required for P2P
1. RRCG Transport (Southern Carrier Co.)
2. HM Transport Inc.
3. UBE Express (Air Freight 2100 Inc.)
4. Delta Neosolutions Inc. (DNS)
5. MetroExpress Connect Inc.
6. Saint Rose Transit (Calamba P2P Inc.)
7. Alabang Metrolink Bus Corp (Metro Link)
8. Precious Grace Transport Services
9. COMET Bus / Global Electric Transport (GET Philippines)
10. Alps the Bus Inc. (for NCR P2P segments)
11. Genesis Transport (Clark route)
12. N. Dela Rosa Liner (Lawton–Alabang)
13. San Agustin Transport Service (Circuit Makati)

### Key Terminal Nodes for stops.txt
- One Ayala Terminal, Makati (14.557°N 121.018°E approx.)
- Alabang Town Center Bus Bay, Muntinlupa (~14.4231°N 121.0396°E)
- Ayala South Park Terminal, Alabang (~14.413°N 121.036°E)
- Market! Market! Bus Terminal, BGC Taguig (~14.5514°N 121.0530°E)
- NAIA Terminal 3 Arrivals Bay 12, Pasay (~14.5086°N 121.0197°E)
- PITX Ground Floor, Parañaque (~14.513°N 120.994°E)
- Starmall EDSA-Shaw Bus Bay, Mandaluyong (~14.5786°N 121.0537°E)
- SM North EDSA Bus Terminal, QC (~14.6565°N 121.0322°E)
- Araneta City / Farmers Plaza Terminal, Cubao QC (~14.6179°N 121.0499°E)
- UP Town Center, QC (~14.6434°N 121.0746°E)
- Calamba Crossing Terminal, Laguna (~14.2104°N 121.1647°E)
- Robinsons Antipolo, Antipolo Rizal (~14.6258°N 121.1255°E)
- SM Masinag / Ayala Malls Feliz, Antipolo-Pasig border (~14.5979°N 121.1071°E)
- Robinsons Novaliches / Fairview, QC (~14.7180°N 121.0498°E)
- Vista Mall Taguig, Gen. Santos Ave (~14.5047°N 121.0432°E approx.)

### Route Count Summary
- **Active, HIGH confidence**: 22 routes
- **Active, MEDIUM confidence**: 13 routes
- **Suspended (recoverable)**: 4 routes
- **Defunct**: 2 routes (Froehlich)
- **Total documented**: 41 distinct P2P routes ever operated (NCR/GMA)

---

## Sources

- `raw/p2p-routes.json` — primary structured P2P dataset (34 route records)
- `analysis/p2p-bus-operators.md` — operator profiles and fare tables
- `raw/sakay-ph-routes.json` — Sakay p2p-gtfs GitHub (frozen Jun 2020, 11 routes) and live Route
  Explorer route IDs (P2P:R_xxx format); notes on LINGKODPINOY as historical operator
- `raw/moovit-routes.json` — 4 P2P routes from Moovit web scrape; operator mode conflict identified
- `analysis/validated-taguig-bgc.md` — P2P Section 3 (operator conflict for Vista Mall Taguig noted)
- `analysis/validated-southern-metro-manila.md` — P2P sections for Las Piñas, Parañaque, Muntinlupa
- `analysis/validated-makati.md` — Makati P2P terminal and route context
- `analysis/validated-quezon-city.md` — QC P2P routes (DNS, Precious Grace, RRCG Fairview)
- `analysis/validated-manila-city-proper.md` — Lawton terminal (SRT-003, NDL-001)
