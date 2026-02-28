# Validated Routes: Taguig / BGC

**Validation type**: Wave 2 — City/Municipality cross-reference
**Retrieved/compiled**: 2026-02-28
**Sources used**: bgc-bus-routes.json, ltfrb-jeepney-routes.json, ltfrb-bus-routes.json, ltfrb-uv-express-routes.json, p2p-routes.json, city-bus-operators-routes.json, osm-transit-relations-routes.json, mrt3-feeder-routes.json, moovit-routes.json, wikimili-routes.json, dotr-routes.json, ltfrb-modernization-routes.json, ltfrb-rationalization-routes.json, pnr-feeder-routes.json, pasay-edsa-terminal-routes.json, provincial-bus-operators-routes.json, transit-blogs-routes.json, reddit-philippines-routes.json, tumi-datahub-routes.json, OSM wiki jeepney list, taguigeno.com (blocked), commutetour.com (blocked)

---

## Overview

Taguig City in southern NCR is the home of **Bonifacio Global City (BGC)**, one of Metro Manila's major CBDs and the dominant transit attractor in the area. Transit in Taguig divides into three geographic sub-zones:

1. **BGC / Fort Bonifacio** — high-density CBD with private BGC Bus network + LTFRB city buses
2. **FTI / East Service Road / Signal Village** — industrial/residential corridor along East Service Road and PNR line
3. **Bicutan / Lower Taguig / Hagonoy / Ususan** — southern Taguig residential, served mostly by jeepneys + PNR (suspended)

Key structural note: **PNR service to FTI Station is suspended as of 2024** due to North–South Commuter Railway (NSCR) construction above the PNR tracks. The NSCR will have a future FTI station and Senate station within Taguig (~2028–2030 expected).

---

## Section 1: BGC Bus System (Private)

**Operator**: Bonifacio Transport Corporation (Ayala Corp subsidiary)
**Status**: All 10–11 routes confirmed across 4+ sources. NOT LTFRB-franchised; operates as private estate transport. Cashless (Beep Card / GCash). Updated January 2025.

| Route | Origin → Destination | Key Stops | Fare | Schedule | Confidence |
|-------|----------------------|-----------|------|----------|-----------|
| East Express | EDSA Ayala → Market! Market! | Point-to-point | ₱13–15 | Mon–Sun 6AM–10PM | High |
| North Express | EDSA Ayala → loop N.BGC → EDSA Ayala | Arya Residences, NutriAsia, HSBC, BGC Turf, Globe Tower, BGC Arts Center | ₱13–15 | Mon–Fri 6AM–10PM | High |
| Upper West Express | EDSA Ayala → Crescent Park West | Bonifacio Stopover, Crescent Park West | ₱13–15 | Mon–Fri 6–10AM & 5–10PM (peak) | High |
| Lower West Express | EDSA Ayala → Fort Victoria | McKinley Pkwy, RCBC, Net One, Fort Victoria | ₱13–15 | Mon–Fri 6–10AM & 5–10PM (peak) | High |
| Central Route | Market! Market! → circular → Market! Market! | NutriAsia, RCBC, Net One, Bonifacio Stopover, Crescent Park West, Globe Tower, One Parkade, University Parkway | ₱13–15 | Mon–Fri 6AM–10PM | High |
| Night Route | EDSA Ayala → Fort Victoria | ~15 stops spanning full BGC; 30-min headways | ₱13–15 | Mon–Fri 10PM–6AM | High |
| Weekend Route | EDSA Ayala → Fort Victoria | Same pattern as Night Route | ₱13–15 | Sat–Sun 6AM–10PM | High |
| Arca South Express | Arca South → One Parkade | Market! Market!, NutriAsia, RCBC, Net One, Bonifacio Stopover, Crescent Park West, HSBC, Globe Tower | ₱25 | Mon–Fri peak only (6:10–8:40AM, 4:30–7:30PM) | High |
| Nuvali Express | Nuvali (Laguna) → Market! Market! | Nuvali, Market! Market! | ₱72–90 | Mon–Fri; 1 AM trip, 2 PM trips | Medium |
| Ayala Express | EDSA Ayala → Glorietta 5 | Ritz Tower, MSE, PBCom, RCBC Plaza, Columns, City Gate, Security Bank, SGV, Glorietta 5 | ₱13–15 | Mon–Fri 6AM–10PM | High |
| LRT-Ayala Route | LRT-1 Gil Puyat (Pasay) → BGC area | Buendia Bus Terminal, Arellano Univ, ALPS Terminal, One Ayala | ₱13–15 | Mon–Fri (hours unconfirmed) | Low |

**Source conflicts**: Route count varies (8–11) across sources. Jan 2025 restructuring consolidated some routes; "North Route" (from North Station) may now be the "North Express" (from EDSA Ayala). Fare discrepancy ₱13 (pre-2025) vs ₱15 (2025 current) across sources — ₱15 is the current standard.

**GTFS note**: ~25 unique named stops across all routes. GPS coordinates not publicly available. No geometry. Frequency unknown except Night Route (30-min headway).

---

## Section 2: LTFRB City Bus Routes (to/from Taguig)

All routes are LTFRB-franchised. Confidence varies — route endpoints confirmed across multiple sources but specific stop sequences and current operational status (post-modernization) may have changed.

| Route | Origin → Destination | Via | Sources | Confidence |
|-------|----------------------|-----|---------|-----------|
| Route 13 (Buendia–BGC) | Buendia (Gil Puyat Ave), Makati | → BGC (Taguig) | ltfrb-bus, city-bus-operators, mmda, transit-blogs, ltfrb-rationalization | **High** |
| Route 16 (Ayala Ave–FTI) | Ayala Ave, Makati | → FTI (Food Terminal Inc.), Taguig | ltfrb-bus, mmda | **Medium** |
| Route 19 (North EDSA–BGC) | North EDSA, QC | → BGC, Taguig | ltfrb-bus, city-bus-operators | **Medium** |
| Route 25 (BGC–Alabang) | BGC, Taguig | → Alabang, Muntinlupa | ltfrb-bus | **Medium** |
| Route 4 (McKinley Hill–PITX) | Venice Grand Canal Mall / McKinley Hill, Taguig | → PITX, Parañaque | ltoportal-ph, google-maps | **High** |
| Route 45 (Navotas–FTI) | Navotas Terminal, Navotas | → FTI Complex, Taguig | city-bus-operators | **Low** |
| Route 55 (Antipolo–McKinley Hill) | Antipolo, Rizal | → McKinley Hill, Taguig | osm-transit | **High** |
| Route 15 (BGC–Alabang) | BGC, Taguig | → Alabang, Muntinlupa | osm-transit, ltfrb-bus | **High** |
| SM North–BGC–Venice–PITX | SM North EDSA, QC | → PITX via BGC, Venice | wikimili | **High** |
| Fairview–FTI via C5/Eastwood/Market!/UP Town | Robinsons Novaliches, QC | → Arca South via C5 corridor | wikimili | **High** |
| FTI–Navotas via Ayala Ave | Navotas City Terminal | → Arca South | wikimili | **Medium** |
| Antipolo–BGC via C5 & Marcos Hwy | Robinsons Antipolo | → Venice Grand Canal Mall (BGC) | wikimili | **High** |
| Antipolo–BGC via C6 | Robinsons Antipolo | → Venice Grand Canal Mall (BGC) | wikimili | **High** |
| BGC–Alabang/Pacita/Balibago | Market! Market! (BGC) | → Vista Terminal Exch / Pacita Complex / Santa Rosa | wikimili | **High** |
| Pasay–Arca South | LRT-1 Gil Puyat Station, Pasay | → Arca South | wikimili | **High** |
| Ayala–BGC Loop | RCBC Plaza, Makati | → Market! Market! (loop) | wikimili | **High** |
| PNR Augmentation Route 2 (FTI–Divisoria) | FTI Complex, Taguig | → Divisoria, Manila via East Service Road | pnr-feeder, osm-transit, dotr, mmda, city-bus-operators, ltfrb-rationalization | **High** |
| McKinley Hill–Southwoods Mall | McKinley Hill, Taguig | → Southwoods Mall, Biñan/Carmona | dotr, ltfrb-rationalization | **Medium** |
| McKinley Hill–Bay City (PITX) | Venice Grand Canal Mall, Taguig | → PITX, Parañaque | google-maps | **Medium** |
| PITX–North EDSA via McKinley/C5 | PITX, Parañaque | → North EDSA via Upper McKinley | baclaran-terminal | **Medium** |

**Contested**: Route 15 (BGC–Alabang) and Route 25 (BGC–Alabang) may refer to the same corridor. OSM and LTFRB databases use different numbering. Route 15 (OSM, confirmed) likely supersedes Route 25 numbering. Monitor for reconciliation in GTFS synthesis.

**Gap**: Route 16 (Ayala–FTI) appears in LTFRB database and MMDA data but detailed stop sequence and current operator not confirmed.

---

## Section 3: P2P Premium Bus Routes (Taguig)

All routes LTFRB-franchised as P2P. Fares typically ₱65–₱140 range for intracity routes.

| Route | Origin → Destination | Operator | Fare | Confidence |
|-------|----------------------|----------|------|-----------|
| BGC Market! Market! → Alabang Town Center | Market! Market!, Taguig → ATC, Muntinlupa | HM Transport | ~₱65–80 | **High** |
| BGC Market! Market! → South Station Muntinlupa | Market! Market!, Taguig → South Station | HM Transport | ~₱65–80 | **High** |
| Calamba → BGC Market! Market! | Calamba, Laguna → Market! Market! | various | ~₱130–150 | **High** |
| Vista Mall Taguig → Trasierra, Makati | Vista Mall Taguig → Trasierra, Makati | Genesis | ~₱65 | **Medium** |
| Vista Mall Taguig → Starmall EDSA Shaw | Vista Mall Taguig → Starmall Shaw, Mandaluyong | RRCG | ~₱80–100 | **Medium** |
| SM Lipa/Batangas City → Market! Market! → SM Megamall | Batangas City Grand Terminal → SM Megamall via BGC | ALPS Bus | ₱200–250 | **Medium** |
| ALPS Bus Market Market → Makati/Alabang | Market! Market! → Alabang via SLEX/ACTEX | ALPS Bus | varies | **Medium** |

**Note**: Vista Mall Taguig (on Gen. Santos Ave/C6 corridor, Lower Bicutan area) is emerging as a second Taguig P2P hub alongside Market! Market!. The One Ayala → Vista Mall Taguig route (Genesis Transport, weekdays) confirms this.

---

## Section 4: UV Express Routes (Taguig)

| Route | Origin → Destination | Fare | Confidence |
|-------|----------------------|------|-----------|
| FTI (DBP Ave) → Ayala UV Express Terminal | FTI, Taguig → Ayala, Makati | ~₱40–50 | **Medium** |
| Palar → SM Makati | Palar area, Taguig → SM Makati | ₱12 | **Medium** |
| Lower Bicutan → SM Makati | Lower Bicutan, Taguig → SM Makati | ₱24 | **Medium** |
| SM Bicutan → Ayala Center | SM Bicutan (Taguig/Parañaque border) → Ayala Center | ~₱35 | **Low** |
| Rosario (Pasig) → McKinley Hills | Rosario, Pasig → McKinley Hills, Taguig | ₱15 | **Medium** |
| Market Market → Rosario via C5 | Market! Market!, Taguig → Rosario, Pasig | ₱16 | **Medium** |
| Market Market → Pasig via San Joaquin | Market! Market! → Pasig via San Joaquin | ~₱20 | **Medium** |
| Market Market UV Express → Mall of Asia | Market! Market! → MOA, Pasay | ~₱25–35 | **Medium** |

**Note**: UV Express vans from One Ayala Terminal (Makati) serve destinations within Taguig including FTI, Palar, Bicutan, and Arca South — schedule typically starts 3PM onwards.

---

## Section 5: Jeepney Routes (Taguig)

Sources: OSM wiki (T-series = traditional; numbered = modern/PUVMP), ltfrb-jeepney-routes.json, mrt3-feeder-routes.json, moovit data

### Confirmed Routes (2+ sources)

| Route ID | Route Name | Key Stops | Confidence |
|----------|-----------|-----------|-----------|
| T2136 / 202 | Fort Bonifacio Gate 3 → Guadalupe Market (ABC) | Gate 3 → McKinley Pkwy → Market! Market! → ABC Guadalupe | **High** |
| T313 / 313 | Guadalupe–FTI via J.P. Rizal Extension | Guadalupe MRT → JP Rizal Ext → C5 → Palar → Diego Silang → FTI Tenement | **High** |
| 201 | Bagumbayan, Taguig → Pasig via San Joaquin | Bagumbayan → San Joaquin → Pasig | **High** |
| T216 | Guadalupe ABC → Taguig via Tipas | Guadalupe → Tipas → Taguig | **Medium** |
| T225 | Pateros → Market Market | Pateros → JP Rizal Ave Ext → Kalayaan Ave → C.P. Garcia Ave → Market! Market! | **High** |
| T227 / T266 | AFP/PNP Housing (Taguig) → Guadalupe via Bayani Road | AFP/PNP area → Bayani Rd → BGC → Guadalupe | **Medium** |
| T218 | Pasig → Taguig via Maestrang Pinang, Tipas | Pasig → Maestrang Pinang → Tipas → Taguig | **Medium** |
| T263 | Pasig → Taguig via Pateros | Pasig → Pateros → Taguig | **Medium** |
| T264 | Pasig Market → Taguig via Bagong Calzada | Pasig Market → Bagong Calzada → Taguig | **Medium** |
| T267 | Lower Bicutan → Pasig via Taguig | Lower Bicutan → Manuel L. Quezon Ave → [Taguig] → Pasig | **Medium** |
| — | FTI/Kayamanan-C → Guadalupe via C5 | FTI (Tenement) → C5 → Guadalupe (MRT) | **High** |
| — | M. Almeda, Pateros → Market Market C-5 Driveway | Pateros → C5 → Market! Market! (BGC) | **Medium** |
| — | Pasay Rotonda → Signal Village | Pasay → Signal Village, Taguig | **Low** |
| — | Pasay Rotonda → FTI | Pasay → FTI, Taguig | **Medium** |
| — | Sucat → Market! Market! via SLEX/FTI/C5 | Sucat Interchange → Bicutan Interchange → FTI/Arca South → Tenement → C5 → McKinley Hill → Market! Market! | **Medium** |

### Single-Source Routes (unconfirmed)
- T213: Ayala–Pateros via J.P. Rizal (passes through Taguig) — OSM only, low confidence
- Cubao → BGC via Guadalupe (jeepney transfer) — Reddit thread, community knowledge, low confidence as direct route

---

## Section 6: Coverage Gaps and Observations

### Gap 1: Internal Taguig Barangay Connectivity
Jeepney routes serving the interior barangays of Taguig — **Pembo, South Signal Village, Central Signal Village, North Signal Village, Ususan, Katuparan, Hagonoy** — are poorly documented in publicly available sources. Moovit shows some stops exist but individual route details are unextractable. These areas depend on jeepneys running along:
- **East Service Road** (FTI area)
- **Manuel L. Quezon Ave** (Bicutan corridor)
- **C6 Road / Gen. Santos Ave** (Lower Bicutan, Hagonoy, Ususan)
- **Bayani Road** (Signal Village, McKinley Hill corridor)

Field validation needed for these sub-city routes.

### Gap 2: PNR Suspension Impact
PNR Metro Commuter service through Taguig (FTI station, Bicutan station) has been **suspended since 2024** for NSCR construction. Bus augmentation routes (PNR Augmentation Route 2: FTI–Divisoria) continue to operate. Commuters in eastern Taguig now rely entirely on road-based transport.

### Gap 3: Arca South Connectivity
Arca South (south Taguig, near C6/South Luzon Expressway) has the BGC Bus Arca South Express, but LTFRB-franchised jeepney/bus coverage to this development is not well documented. Sucat → Market! Market! route appears to pass through, but stops within Arca South development are unclear.

### Gap 4: Vista Mall Taguig Hub (Emerging)
Vista Mall Taguig on Gen. Santos Ave (Lower Bicutan) is appearing as a secondary transit hub with P2P routes (Trasierra Makati, Starmall Shaw, One Ayala). This is post-2023 and not in older data sources.

### Gap 5: Route 16 (Ayala–FTI) Operator Unknown
Route 16 appears in LTFRB and MMDA databases but the current operator and stop sequence post-PUVMP consolidation is not confirmed. May be operated under modernized PUJ franchise.

---

## Section 7: Cross-Source Conflict Notes

| Conflict | Details | Resolution |
|---------|---------|-----------|
| BGC Bus route count | 8 (most sources) vs 10 (CashMart) vs 11 (this analysis) | 10–11 distinct routes identified; "8 routes" label likely reflects Jan 2025 consolidated public-facing count, but LRT-Ayala and Weekend routes exist separately |
| Route 15 vs Route 25 (BGC–Alabang) | Both appear in sources; may be same corridor different numbering | Route 15 confirmed in OSM (high confidence); Route 25 from LTFRB list. Treat as same route, use Route 15 designation |
| BGC Bus fare ₱13 vs ₱15 | Pre-2025 vs 2025 fares | Current (2025) fare is ₱15 for standard routes |
| Route 45 (Navotas–FTI) | Only in ltoportal and city-bus-operators; not in OSM or LTFRB bus routes | Low confidence; flag as unconfirmed. FTI is far from Navotas but plausible via C5/Coastal Road corridor |

---

## Section 8: Confidence Summary

| Confidence | Count | Examples |
|-----------|-------|---------|
| High | 28 routes | BGC Bus (most), City Bus Route 13/4/15/55, P2P HM/Calamba, Jeepney T225/T313/202/313 |
| Medium | 22 routes | UV Express (most), City Bus Route 16/19/25, P2P Vista Mall, Jeepney T216/T218/T263/T264 |
| Low | 4 routes | BGC Bus LRT-Ayala, Route 45, Pasay–Signal Village, T213 |

**Total validated routes for Taguig/BGC**: 54 routes across all modes

---

## Section 9: GTFS Implications

### Agencies required
- Bonifacio Transport Corporation (BGC Bus) — private, no LTFRB franchise
- LTFRB-registered city bus operators (Route 13, 16, 19, 25, etc.)
- HM Transport (P2P)
- Genesis Transport (P2P Vista Mall)
- RRCG (P2P Shaw)
- ALPS Bus (Batangas intercity, stops at BGC)

### Major stops requiring GPS coordinates
- Market! Market! Terminal (BGC, Taguig) — primary hub
- Arca South Terminal (south Taguig)
- Vista Mall Taguig Terminal (Gen. Santos Ave, Lower Bicutan)
- FTI Complex (DBP Ave, Taguig)
- BGC Bus: EDSA Ayala Terminal at McKinley Exchange Corporate Center
- Named BGC Bus stops (~25 unique locations within BGC)
- Signal Village / FTI junction (East Service Road)

### Shape data availability
- **BGC Bus routes**: No public shape data. Geometry must be estimated from road network (McKinley Pkwy, Bayani Rd, 5th Ave, etc.)
- **City bus routes via C5, EDSA, McKinley**: Road-following geometry possible from OSM road network
- **OSM transit relations**: Routes 15, 55 have OSM relation data; check for geometry nodes

---

## Sources

- bgc-bus-system.md (analysis from bgc-bus-routes.json)
- OSM Wiki: [Metro Manila/Jeepney and UV Express routes](https://wiki.openstreetmap.org/wiki/Metro_Manila/Jeepney_and_UV_Express_routes)
- Raw data files: city-bus-operators-routes.json, ltfrb-bus-routes.json, ltfrb-jeepney-routes.json, ltfrb-uv-express-routes.json, p2p-routes.json, mrt3-feeder-routes.json, moovit-routes.json, wikimili-routes.json, dotr-routes.json, tumi-datahub-routes.json, osm-transit-relations-routes.json
- Search: taguigeno.com (content blocked), commutetour.com (403), moovitapp.com, thepoortraveler.net UV Express routes
