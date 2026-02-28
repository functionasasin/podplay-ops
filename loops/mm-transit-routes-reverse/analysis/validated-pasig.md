# Validated Routes — Pasig City

**Wave 2 Validation | Cross-reference of all routes within/through Pasig City**
**Date**: 2026-02-28
**Sources cross-referenced**: validated-shaw-boulevard-corridor.md, validated-ortigas-avenue-corridor.md, validated-c5-corridor.md, validated-aurora-boulevard-corridor.md, web research (Sakay.ph, Moovit, LTFRB DB, MMDA, PNA), ltoportal-ph-routes.json, osm-transit-relations-routes.json

---

## City Overview

**Pasig City** is an urbanized city in NCR (47.7 km², ~762K population as of 2020). It occupies a strategic mid-eastern position in Metro Manila, bounded by Mandaluyong (west), Quezon City (northwest), Marikina (north), Rizal province (east), Taguig (south), and Pateros (southwest).

Pasig is a major **transit hub city**: most eastbound routes from the Ortigas CBD and many Rizal province routes terminate or pass through it. Its main jeepney terminal (Pasig Mega Market / Caruncho Ave) is one of the largest in the metro.

### Key Transit Nodes

| Node | Type | Connected Modes |
|------|------|-----------------|
| Pasig Mega Market Terminal (Caruncho Ave / Market Ave) | Primary jeepney terminal | Jeepney, UV Express (central Pasig hub) |
| SM Megamall UV Express Terminal | UV Express hub | UV Express (Rizal province, south metro) |
| Ortigas Center UV Express Terminal (near MRT-3 Ortigas) | UV Express | UV Express (Paranaque, Marikina, Ortigas) |
| Ortigas-Antipolo UV Terminal (near Julia Vargas/ADB Ave) | UV Express | UV Express (Antipolo, Taytay direction) |
| EDSA Central Terminal (Shaw Blvd, Mandaluyong side) | Jeepney hub serving Pasig routes | Jeepney (to Tipas, Ugong, San Joaquin, Morong, Binangonan) |
| San Joaquin Terminal (San Bernardo St) | South Pasig jeepney | Jeepney (to Bagumbayan Taguig, Quiapo, Pateros) |
| Buting Terminal (Kalayaan/C5) | Jeepney | Jeepney (to Guadalupe Makati, BGC) |
| Pinagbuhatan Ferry Station (Eusebio Ave) | Water transport | Pasig River Ferry (eastern terminus) |

### MRT-3 Stations Serving Pasig
- **Ortigas** — On EDSA at Ortigas Ave junction (boundary with Mandaluyong). SM Megamall and Robinsons Galleria are on the Pasig/Mandaluyong side. Major UV Express and P2P interchange.
- **Shaw Blvd** — On EDSA at Shaw Blvd (Mandaluyong side, but serves Pasig eastern routes). EDSA Central Jeepney Terminal is the primary jeepney hub feeding Pasig interior.

### Key Roads Through Pasig

| Road | Orientation | Key Areas Served |
|------|-------------|-----------------|
| Shaw Blvd | E–W (north Pasig) | Greenfield, Pioneer, Caruncho, Kapitolyo, San Miguel Ave, Meralco Ave flyover |
| Ortigas Ave | E–W (mid Pasig) | Ortigas Center, Tiendesitas/Frontera Verde, Ugong, Rosario, Cainta border |
| C5 / E. Rodriguez Jr. Ave | N–S (west Pasig) | Libis/Eastwood → Ortigas Ave → Kalayaan/BGC border |
| C. Raymundo Ave | N–S (central Pasig) | Connects Shaw Blvd → Pasig Mega Market → Ortigas Ave Extension area |
| Dr. Sixto Antonio Ave | E–W (east Pasig) | Maybunga → east side of Pasig City → Taytay border |
| San Joaquin Street / Pasig Blvd | E–W (south Pasig) | Pasig Simbahan → San Joaquin → Pateros/Taguig boundary |
| Julia Vargas Ave / ADB Ave | E–W (Ortigas Center) | Ortigas CBD core; ADB headquarters area |
| Meralco Ave | N–S (Ortigas Center) | Connects Shaw Blvd–Ortigas Ave through Ortigas Center |

---

## Routes Validated

### 1. EDSA Carousel (BRT)

**Status: CONFIRMED HIGH**
- **Route**: Monumento (Caloocan) ↔ PITX (Parañaque), 28 km
- **Pasig stops**: Ortigas Station (on EDSA at Ortigas Ave junction; nearest SM Megamall / Robinsons Galleria)
- **Fare**: ₱33 (PITX–Ortigas segment); full E2E ~₱75.50
- **Sources**: MMDA, EDSA Carousel official, validated-edsa-corridor.md, ltoportal MM-BUS-001
- **Notes**: The Ortigas Station serves the Ortigas Center CBD on the Pasig/Mandaluyong EDSA border. 4AM–11PM daily. BEEP card or cash.

---

### 2. City Bus Routes Through Pasig

| Route | Name | Origin | Destination | Key Pasig Stops | Fare | Confidence | Sources |
|-------|------|--------|-------------|-----------------|------|------------|---------|
| Route 2 | Angono–Quiapo via Ortigas Ave | SM Center Angono, Rizal | Quiapo Church, Manila | SM East Ortigas (Cainta–Pasig border), Rosario/C. Raymundo area, Tiendesitas/Frontera Verde (C5), Meralco overpass, Robinsons Galleria footbridge | ₱15 base + ₱2.65/km | **HIGH** | OSM rel. 11480588, ltoportal.ph, wikimili, Sakay.ph, Google Maps |
| Route 11 | Gilmore–Taytay | Gilmore, San Juan/QC | Taytay, Rizal | Passes through east Pasig via Ortigas Ave Extension | Distance-based | **MEDIUM** | ltfrb-bus-routes, ltfrb-rationalization (may be consolidated into Route 2) |
| Route 12 (a) | Pasig–Kalentong via Shaw Blvd | Pasig City | Kalentong, Manila | Pasig Market area, Shaw Blvd, Pioneer | ₱13 base | **MEDIUM** | MC 2020-019 bus rationalization list, transit-blogs; no independent operator confirmation |
| Route 12 (b) | Pasig–Taytay | Pasig City Hall | Taytay, Rizal | Pasig → C. Raymundo → Rosario → Cainta → Taytay | Distance-based | **MEDIUM** | ltfrb-rationalization, MMDA, transit-blogs (may be consolidated into Route 2) |
| Route 36 | Fairview–Alabang via C5 | Fairview, QC | Alabang, Muntinlupa | C5 corridor through Pasig (Ortigas Ave junction, Kalayaan/Bagong Ilog area) | Distance-based | **HIGH** | ltoportal-ph, wikimili, validated-c5-corridor.md |
| Route 38/39 | Pacita–Fairview via C5 | Pacita Complex, Laguna | Fairview, QC | C5 through west Pasig | Distance-based | **HIGH** | OSM relation, ltoportal-ph, OSM Wiki (Worthy Transport), validated-c5-corridor.md |
| Route 40 | Fairview–Alabang via C5 | Fairview, QC | Alabang, Muntinlupa | C5 through Pasig | Distance-based | **HIGH** | OSM relation, wikimili, validated-c5-corridor.md |
| Route 41 | Fairview–FTI via C5 | Fairview, QC | FTI, Taguig | C5 through Pasig (Eastwood, Libis, Ortigas Ave junction) | Distance-based | **HIGH** | ltoportal-ph, wikimili, validated-c5-corridor.md |

**Contested:** Routes 11 and 12 appear to be pre-rationalization designations that may have been merged into Route 2 under MC 2020-019. Field reports suggest they may still operate as short-turn services. See `validated-ortigas-avenue-corridor.md` for details.

---

### 3. Jeepney Routes

#### 3A. Confirmed (HIGH confidence — 2+ independent sources)

| Route ID | Name | Origin | Destination | Key Pasig Stops | Fare | Sources |
|----------|------|--------|-------------|-----------------|------|---------|
| PUJ_916 / T279 | EDSA/Shaw Central – Tipas via San Joaquin | EDSA Central Terminal, Mandaluyong | M. Almeda, Pateros | Shaw Blvd → Kapitolyo/Capitol Commons → C5 Bagong Ilog → Pasig Rotonda → Pasig Simbahan → San Joaquin → Pateros | ₱13 min | Sakay.ph (DOTR:R_SAKAY_PUJ_916), LTFRB DB T279, Shaw corridor analysis |
| MPUJ_909 | Cubao – Sta. Lucia (Pasig) via C5 | Gen. Romulo Ave, Cubao, QC | Sta. Lucia area (SM East Ortigas / Cainta border) | Eastwood City → Bridgetown → C5 → Ortigas Ave/C. Raymundo area → SM East Ortigas | ₱13 min | Sakay.ph (DOTR:R_SAKAY_MPUJ_909), OSM |
| PUJ_924 | Cubao – Rosario (Pasig) via Santolan | Gen. Romulo Ave, Cubao, QC | Ortigas Ave, Rosario, Pasig | LRT-2 Santolan → Ortigas Ave Extension → Rosario/Cainta-Pasig border | ₱13 min | Sakay.ph (DOTR:R_SAKAY_PUJ_924), LTFRB DB |
| PUJ_923 | EDSA/Shaw Central – Morong via Ortigas | EDSA Central Terminal, Mandaluyong | Morong, Rizal | Shaw Blvd → Pasig interior → Ortigas Ave Extension → Rizal Province | ₱13–65+ | Sakay.ph (DOTR:R_SAKAY_PUJ_923), LTFRB DB |
| — | Shaw Blvd – Binangonan via Pasig/Rizal | Shaw Blvd, Mandaluyong | Binangonan, Rizal | Shaw → Pasig Market area → Ortigas Ave Extension → Binangonan | ₱13–65+ | Moovit (103 stops, ~144 min), transit sources |

#### 3B. Medium Confidence Routes

| Route ID | Name | Origin | Destination | Key Pasig Stops | Fare | Sources |
|----------|------|--------|-------------|-----------------|------|---------|
| T276 | EDSA/Shaw – E. Rodriguez Ave / Ugong-Vargas Ave | EDSA/Shaw Blvd | E. Rodriguez Ave / Vargas Ave, Pasig | Shaw → Pasig interior → Ugong/Tiendesitas area | ₱13 | LTFRB DB, Moovit |
| T277 | EDSA/Shaw – E. Rodriguez / Ortigas Ave | EDSA/Shaw Blvd | E. Rodriguez / Ortigas Ave junction | Shaw → Julia Vargas → San Miguel Ave → ADB → Meralco Ave → C5 | ₱13 | LTFRB DB, Sakay.ph, validated-shaw-blvd, validated-ortigas-ave |
| T278 | EDSA/Shaw – E. Rodriguez/Ort (variant) | EDSA/Shaw Blvd | E. Rodriguez / Ortigas Ave | Likely alignment variant of T277 | ₱13 | LTFRB DB only |
| T290 | Antipolo – EDSA/Shaw Blvd | Antipolo, Rizal | EDSA/Shaw | Antipolo → Ortigas Ave → Meralco Ave → Shaw/EDSA; reverses through Pasig | ₱13–40 | OSM (T290, 16.3 km), Moovit |
| T235 | EDSA/Shaw – Ortigas Complex (short) | EDSA/Shaw, Mandaluyong | Ortigas Center (Pasig) | CBD connector: Shaw → Ortigas Center only | ₱12 | OSM (low detail) |
| — | Pasig (TP/Market) – Quiapo via Shaw Blvd | Pasig Market terminal | Quiapo, Manila | Pasig Market → Shaw Blvd → Pioneer → Mandaluyong → Santa Mesa → Quiapo | ₱13–30 | transit-blogs, Komyut data; older route (pre-consolidation) |
| — | N. Domingo (San Juan) – Ortigas Ave / Dr. Sixto Antonio | N. Domingo, San Juan | Ortigas Ave / Dr. Sixto Antonio, Pasig | San Juan → Ortigas Ave entry into Pasig | ₱12+ | Moovit (24 stops, ~36 min) |
| — | Ortigas Ave – EDSA/United Intersection | Ortigas Ave, Pasig | EDSA/United, Mandaluyong | Short Ortigas Ave run to EDSA | ₱12–20 | Moovit (38 stops, ~46 min) |
| — | Market Market (BGC) – Pasig Market via Buting/C5 | Market Market, Taguig | Pasig Market (Caruncho Ave) | C5 → Kalayaan/Buting → Shaw/Pasig Blvd → Caruncho Ave | ₱13–25 | Web research, transit-blogs, facebook-commuter-groups |
| T325 | Guadalupe – Buting / E. Rembo via Kalayaan | Guadalupe Market, Makati | Barangay Buting, Pasig (near C5) | Kalayaan Ave → BGC north edge → Buting C5 | ₱13 | LTFRB DB (T325), validated-c5-corridor |

#### 3C. Low Confidence Routes (single source or legacy designations)

| Route ID | Name | Origin | Destination | Notes |
|----------|------|--------|-------------|-------|
| Old 569 | Pasig TP – Quiapo via C. Palanca / Sta. Mesa | Pasig Market | Quiapo | Legacy route; may be absorbed by modernized PUJ or reduced service |
| Old 573 | Pasig TP – Taytay via Sixto Antonio | Pasig Market | Taytay | Via Dr. Sixto Antonio Ave through Maybunga |
| Old 574 | Pasig TP – Taytay via C. Raymundo | Pasig Market | Taytay | Via C. Raymundo Ave (north-south Pasig artery) |
| Old 575 | Pasig TP – Ugong via E. Rodriguez | Pasig Market | Ugong Norte, Pasig | Short intra-Pasig route to Tiendesitas area |
| 2018_PUJ_342 | Cubao–Rosario–Sta. Lucia (combined variant) | Cubao, QC | Sta. Lucia / SM East Ortigas | Sakay ID suggests combined route variant of PUJ_909 + PUJ_924 |
| — | EDSA/Pioneer – Pateros via south Pasig | EDSA/Pioneer | Pateros | South Pasig connector; low data |
| — | Marikina – Pateros via San Joaquin, Pasig | Marikina | Pateros | Passes through central Pasig; mentioned in blog sources |

---

### 4. UV Express Routes

| Name | Origin | Destination | Fare | Confidence | Terminal / Notes |
|------|--------|-------------|------|------------|------------------|
| Angono / Binangonan – SM Megamall | Angono / Binangonan, Rizal | SM Megamall UV Terminal, Ortigas | ₱55 | MEDIUM | SM Megamall basement terminal; operates ~2PM–9PM |
| Pasig Palengke – SM Megamall | Pasig Market area | SM Megamall UV Terminal | ₱25 | MEDIUM | Short route; SM Megamall terminal |
| San Joaquin (Pasig) – SM Megamall | San Joaquin, Pasig | SM Megamall UV Terminal | ₱30 | MEDIUM | SM Megamall terminal |
| Taytay – SM Megamall | Taytay, Rizal | SM Megamall UV Terminal | ₱30 | MEDIUM | SM Megamall terminal |
| Fairview – SM Megamall | Fairview, QC | SM Megamall UV Terminal | ₱100 | MEDIUM | SM Megamall terminal; long-haul route |
| Betterliving (Parañaque) – Ortigas Center | Betterliving, Parañaque | Ortigas Center UV Express Terminal (near MRT-3 Ortigas) | ~₱40–50 | MEDIUM | 7AM–10:07PM; ~280m from MRT Ortigas |
| Sto. Niño (Marikina) – Ortigas Center | Sto. Niño, Marikina | Ortigas Center, Pasig | ₱24 | MEDIUM | Confirmed LTFRB UV Express DB; validated-ortigas-avenue-corridor |
| Antipolo – Ortigas / Shaw area (UV) | Antipolo, Rizal | Ortigas / Shaw Blvd, Pasig | ~₱40–60 | MEDIUM | Ortigas-Antipolo UV Terminal (Julia Vargas/ADB area) |
| Pasig – Ayala Center Makati | Pasig Market area | Ayala Center, Makati | ₱38–45 | MEDIUM | Via Megamall; 7AM–10PM |
| Pasig – Greenhills | Pasig Market area | Greenhills, San Juan | ₱25–30 | MEDIUM | Short UV Express connector |
| Pasig – Quiapo UV Express | Pasig Market area | Quiapo, Manila | ₱25 | MEDIUM | UV van option from central Pasig |
| Comembo (Makati) – SM Megamall | Comembo, Makati | SM Megamall, Ortigas | ₱25 | LOW | Single community source |

**UV Express Terminal Note:** There are **two distinct UV Express terminals** near the Ortigas Center MRT-3 station: (1) Ortigas Center UV Express Terminal (~280m from MRT-3 Ortigas station, serving Betterliving–Ortigas), and (2) Ortigas-Antipolo UV Terminal (~793m away, near Julia Vargas/ADB Ave, serving Antipolo and deeper Rizal routes). Both are within Pasig City proper.

---

### 5. P2P Premium Bus Routes

| Route | Origin | Destination | Key Pasig Stop | Fare | Confidence | Sources |
|-------|--------|-------------|----------------|------|------------|---------|
| Alabang Town Center – Greenhills via SM Megamall | Alabang Town Center, Muntinlupa | Greenhills, San Juan | SM Megamall, Robinsons Galleria (drop-off/pick-up) | ₱80 regular / ₱64 discounted | **HIGH** | Sakay.ph (P2P:R_4PYOM40), RRCG Transport website, validated-c5-corridor |
| Alabang Starmall – Starmall Shaw/EDSA | Alabang (Starmall), Muntinlupa | Starmall EDSA-Shaw, Mandaluyong | Shaw Blvd / Pasig-Mandaluyong boundary | ₱140 regular / ₱112 discounted | MEDIUM | RRCG Transport, LTFRB P2P DB |
| ALPS Bus: SM Megamall – Batangas City | SM Megamall UV Terminal, Pasig | Batangas City | SM Megamall (Pasig origin) | ₱250 | MEDIUM | SM Megamall terminal confirmed; More Fun With Juan, ALPS Bus schedules |
| ALPS Bus: SM Megamall – Batangas Pier | SM Megamall UV Terminal, Pasig | Batangas Pier | SM Megamall (Pasig origin) | ₱268 | MEDIUM | More Fun With Juan, ALPS Bus schedules |
| ALPS Bus: SM Megamall – Lipa City | SM Megamall UV Terminal, Pasig | Lipa City, Batangas | SM Megamall (Pasig origin) | ₱200 | MEDIUM | More Fun With Juan, ALPS Bus schedules |
| Metro Express: Vista Mall (Taguig) – Starmall Shaw | Vista Mall, Taguig | Starmall Shaw Blvd, Mandaluyong | Shaw Blvd terminal (Pasig border) | ₱70 | MEDIUM | Metro Express schedule, Web research |

**Contested — Estancia/Capitol Commons P2P:** Community sources indicate interest in a Estancia Mall (Capitol Commons, Kapitolyo, Pasig) P2P terminal, but no confirmed dedicated P2P terminal exists at this location as of 2025. NAIA–Ayala Malls Manila Bay UBE Express P2P was temporarily suspended. Estancia is served via nearby EDSA/Shaw corridor connections.

---

### 6. Pasig River Ferry (MMDA Water Transport)

**Status: CONFIRMED HIGH**
- **Operator**: MMDA | **Fare**: Free (as of 2025)
- **Pasig City Stations**:
  1. **Pinagbuhatan** — Eusebio Ave, Pinagbuhatan (near C6 Bridge / Coast Guard Station) — **Eastern terminus of the route**
  2. **San Joaquin** — San Bernardo St, San Joaquin (near Bambang Bridge)
  3. **Maybunga** — Dr. Sixto Antonio Ave (beside Maybunga Barangay Hall)
  4. **Kalawaan** — R. Castillo St., Kalawaan (connects to south Pasig / near Pasig River)
- **Downstream route**: Pinagbuhatan → San Joaquin → Maybunga → Kalawaan → Guadalupe (Makati) → Valenzuela → Hulo → Lambingan → Sta. Ana → PUP → Lawton → Quinta → Escolta (Manila)
- **Key departure times** (Pinagbuhatan): 7:00AM, 7:30AM, 8:30AM, 9:30AM, 11:00AM, 12:30PM, 2:00PM, 4:00PM
- **Sources**: MMDA official, Top Gear PH (2025 guide), MMDA Pasig River Ferry Service page, Pinagbuhatan station confirmed
- **Notes**: Pasig City has the most stations (4) of any municipality on the route, reflecting its extensive riverfront. Schedules loosely observed; trips may cancel in heavy rain.

---

### 7. Modernized PUJ (E-Jeepney / Modern Jeepney)

**Status: EMERGING — MEDIUM confidence**
- **e-J01 electric jeepney** launched in Pasig City in December 2024 by LCS Group in collaboration with EMON and KATECH (Korea)
- **₱160,000 government subsidy** per unit available under PUV Modernization Program
- Operates on LTFRB-franchised routes (same routes as traditional jeepneys but under consolidated transport cooperatives)
- **Sources**: Manila Bulletin (December 2024), DOTr PUV Modernization data, dotr-routes.json
- **Confidence**: MEDIUM — launch confirmed but full deployment and route details not yet systematically published

---

### 8. Pasig City LGU — Libreng Sakay (Free Shuttle)

**Status: CONFIRMED MEDIUM — Contingency service only**
- Deployed during transport strikes (March 2023, July 2023) and special events; not a regular daily service
- Over **40 city buses and commuter trucks** deployed on:
  1. Pasig Mega Market ↔ Shaw Boulevard
  2. Pasig Mega Market ↔ Ligaya via Dr. Sixto Antonio Ave
  3. Pasig Mega Market → Kalawaan → San Joaquin → Pasig Mega Market (loop)
  4. Pasig Mega Market ↔ Ligaya via C. Raymundo Ave
  5. Pasig Mega Market → Dr. Sixto Antonio → Rosario → C. Raymundo → Pasig Mega Market (loop)
- **Hours** (during deployment): 5AM–10AM / 11AM–2PM / 3PM–9PM
- **Sources**: Philippine News Agency, Pasig City LGU Facebook/website, Sakay.ph tracker (during strike events)

---

## Gaps and Issues

### 1. Intra-Pasig Route Coverage
South and east barangays (Pinagbuhatan, Maybunga, Manggahan, Santa Lucia) are served by the Pasig River Ferry at the riverfront, but overland connections from Pasig Market to these areas rely on legacy jeepney routes (Old 573, 574, 575) that may have reduced frequency under PUV consolidation. Current operating status of these older intra-Pasig routes is uncertain.

### 2. Ortigas Center North Side Routing
The northern portion of Ortigas Center (along ADB Ave, Julia Vargas Ave) relies on short jeepney routes (T235, T276, T277) that connect to Shaw Blvd and EDSA. These CBD-internal connectors have low documentation and may have been absorbed into modernized routes.

### 3. Pasig–Taguig Southern Corridor
South Pasig (Buting, Kalawaan, Bagong Ilog) connects to Taguig via Kalayaan Ave and C5. Route T325 (Guadalupe–Buting via Kalayaan) is the key confirmed link, but the full inventory of south Pasig jeepneys is incomplete. The Bagumbayan Taguig – Pasig TP route (Old 571) is referenced in single sources only.

### 4. Marikina–Pasig Connection
Routes from Marikina to Pasig (via San Joaquin) and Marikina to Pateros (via Pasig) are mentioned in transit blogs but lack LTFRB route IDs or Sakay.ph confirmation. These should be validated in the upcoming Marikina city analysis.

### 5. Estancia Mall / Capitol Commons
Despite being a large mixed-use development in Kapitolyo, Estancia Mall does not appear to have a confirmed P2P bus terminal. This is a gap relative to comparable nodes like SM Megamall or Robinsons Galleria.

---

## Summary Statistics

| Mode | # Routes Confirmed (High+Medium) | # Contested/Uncertain | Coverage Gaps |
|------|-----------------------------------|------------------------|---------------|
| City Bus | 8 (3 HIGH, 5 MEDIUM) | 2 (Routes 11 & 12 consolidation) | East Pasig bus service thin |
| Jeepney | 5 HIGH, 10 MEDIUM | 7 legacy routes (LOW) | Intra-Pasig south/east coverage |
| UV Express | 12 MEDIUM | 1 LOW | Ortigas Center internal gaps |
| P2P Bus | 1 HIGH, 5 MEDIUM | 1 (Estancia P2P unconfirmed) | No dedicated Estancia/Kapitolyo P2P |
| Water (Ferry) | 4 stations CONFIRMED HIGH | 0 | Irregular schedule |
| LGU Shuttle | CONFIRMED MEDIUM | — | Contingency only, not daily |

**Overall assessment**: Pasig City is well-served by through-routes on its major corridors (Shaw Blvd, Ortigas Ave, C5) and has a robust UV Express network at the Ortigas Center. The Pasig River Ferry provides unique water-transport coverage with 4 stations. Gaps exist in intra-city coverage (south and east barangays) and in low-frequency CBD connectors within the Ortigas Center complex. The PUV Modernization Program is actively changing the jeepney fleet but route consolidations are not yet fully documented.
