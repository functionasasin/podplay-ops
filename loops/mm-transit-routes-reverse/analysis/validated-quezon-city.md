# Quezon City — Validated Routes

**Analysis date**: 2026-02-28
**Aspect**: Wave 2 — By NCR City/Municipality: Quezon City
**Scope**: All transit routes within, through, or terminating in Quezon City (QC)
**Sources cross-referenced**: validated-commonwealth-avenue-corridor, validated-edsa-corridor, validated-espana-quezon-avenue-corridor, validated-aurora-boulevard-corridor, validated-marcos-highway-corridor, validated-c5-corridor, qcitybus-routes, sm-north-edsa-terminal-routes, cubao-terminal-routes, fairview-terminal-routes, mrt3-feeder-routes, lrt2-feeder-routes, university-shuttles-routes, ltfrb-jeepney-routes, ltfrb-bus-routes, ltfrb-uv-express-routes, ltfrb-modernization-routes, city-bus-operators, p2p-routes, osm-transit-relations, sakay-ph, moovit, pinoycommute, komyut, transit-blogs

---

## Geographic Overview

**Quezon City** is the most populous LGU in the Philippines (~3.0M people, 161.1 km²) and the largest city by area in Metro Manila. It occupies the northeastern and northcentral portion of NCR, bordered by Caloocan (northwest), Manila and San Juan (southwest), Marikina (east), and Rizal Province (northeast). Despite its size, QC has no light rail within its city limits — it is served exclusively by:

- **MRT-3 (EDSA Carousel)**: runs along EDSA on QC's western edge
- **LRT-2 (Purple Line)**: enters QC from Manila along Aurora Blvd and terminates at Santolan (shared with Marikina)
- **Road-based transit**: the dominant mode — city buses, QCityBus, jeepneys, UV Express, P2P

### Rail Stations Within QC

| Station | Line | Location |
|---------|------|----------|
| North Avenue | MRT-3 | EDSA / North Ave, Diliman |
| Quezon Avenue | MRT-3 | EDSA / Quezon Ave, Eton Centris |
| GMA-Kamuning | MRT-3 | EDSA / Timog Ave / Kamuning |
| Araneta-Cubao | MRT-3 | EDSA / Aurora Blvd, Cubao |
| Gilmore | LRT-2 | Aurora Blvd / Gilmore Ave |
| Betty Go-Belmonte | LRT-2 | Aurora Blvd / 15th Ave |
| Araneta-Cubao | LRT-2 | Aurora Blvd / P. Tuazon (shared with MRT-3 hub) |
| Anonas | LRT-2 | Aurora Blvd / Anonas Road |
| Katipunan | LRT-2 | Katipunan Ave / Aurora Blvd |
| Santolan | LRT-2 | Marcos Highway / EDSA Ext (shared with Marikina) |

### District Clusters

QC's transit geography divides into six functional zones:

| Zone | Key Areas | Primary Transit Corridors |
|------|-----------|--------------------------|
| **EDSA/Cubao hub** | Cubao, Araneta Center, Murphy | EDSA, Aurora Blvd, EDSA Carousel |
| **University Belt North** | Diliman (UP), Katipunan, Ateneo, Miriam | Katipunan Ave, C.P. Garcia, Commonwealth |
| **Quezon Ave / Timog** | Eton Centris, Tomas Morato, Timog, GMA | EDSA, Quezon Ave, Timog Ave |
| **Commonwealth/Batasan** | Ever Gotesco, IBP Road, Batasan Hills | Commonwealth Ave (R-7) |
| **Fairview/Novaliches** | SM Fairview, Lagro, Quirino Hwy, Novaliches | Quirino Hwy, Regalado Hwy, Commonwealth |
| **East QC** | Eastwood, Libis, Project 2/3/4/6/8, Project areas | C5 / E. Rodriguez Jr., Katipunan extension |

---

## Zone 1: EDSA / Cubao Hub

Cubao is the premier transit hub of Quezon City, combining MRT-3 Araneta-Cubao, LRT-2 Araneta-Cubao, and multi-modal road terminals.

### City Buses (HIGH confidence)

| Route | Name | Origin → Destination | Key QC Stops | Source |
|-------|------|----------------------|--------------|--------|
| **EDSA Carousel BRT** | Monumento–PITX | Monumento → PITX | North Ave, Quezon Ave, Kamuning (via MRT), Cubao Nepa Q-Mart, Cubao Main Ave | edsa-busway; OSM |
| **Route 51** | VGC–Cubao | Valenzuela GC → Cubao | Talipapa, Tandang Sora, Congressional, Culiat, Capitol Hills, UP Town, Ateneo, Katipunan, Proj 2/3, **Cubao/Araneta** (terminus) | cubao-terminal; city-bus-operators |
| **Route 53** | Cubao–Pacita | **Cubao (Araneta Bus Port)** → Pacita, Laguna | EDSA corridor south | cubao-terminal; city-bus-operators |

### QCityBus (FREE — QC Government, HIGH confidence)

| Route | Name | Origin | Destination | Freq (peak) |
|-------|------|---------|-------------|-------------|
| **QCB-1** | QC Hall–Cubao | QC Hall (NHA) | **Cubao Araneta** | 15 min |

Key QCB-1 stops: QC Hall Gate 3 (Kalayaan/NHA) → Kalayaan/Masigla → Kalayaan/Kamias → Barangay Silangan Hall → 15th Ave/Aurora → Cubao/Araneta City.

### Modern Jeepney (Cubao Terminal, MEDIUM confidence)

From cubao-terminal-routes and ltfrb-modernization:

| Route | Origin | Destination | Mode | Confidence |
|-------|---------|-------------|------|------------|
| Cubao–SM Fairview MPUJ | Cubao (Times Square Ave) | SM Fairview | Modern PUJ | MEDIUM |
| Cubao–Novaliches MPUJ | Cubao (Times Square Ave) | Novaliches | Modern PUJ | MEDIUM |
| Cubao–Eastwood MPUJ | Cubao (G. Romulo) | Eastwood/Libis | Modern PUJ | MEDIUM |
| Cubao–Sta. Lucia MPUJ | Cubao (Araneta) | Sta. Lucia/Rosario, Pasig | Modern PUJ | HIGH (Sakay DOTR:R_SAKAY_MPUJ_909) |
| Cubao–Project 4 MPUJ | Cubao (Times Square) | Project 4 | Modern PUJ | MEDIUM |
| Cubao–Roces Ave MPUJ | Cubao (Times Square) | Roces Ave | Modern PUJ | MEDIUM |
| Cubao–Lagro | Cubao | Lagro | Traditional/Modern PUJ | MEDIUM |
| Cubao–Litex | Cubao | Litex | Traditional PUJ | MEDIUM |
| Cubao–Philcoa | Cubao (G. Romulo) | Philcoa (UP area) | Traditional PUJ | MEDIUM |
| Cubao–Camp Crame | Cubao | Camp Crame | Traditional PUJ | MEDIUM |

### Traditional Jeepney (Cubao, MEDIUM confidence)

| Route | Origin | Destination | Key Street |
|-------|---------|-------------|------------|
| Cubao–Divisoria | Aurora Blvd below LRT-2 Cubao | Divisoria, Manila | Aurora Blvd |
| Cubao–Quiapo | Aurora Blvd below LRT-2 Cubao | Quiapo, Manila | Aurora Blvd |
| Cubao–Marikina | Aurora Blvd below LRT-2 Cubao | Marikina | Aurora Blvd |
| Quiapo–Project 2&3 | Quiapo | Project 2&3 (Kamias Rd) | España/Quezon Ave/E. Rodriguez |
| Quiapo–Project 4/Cubao | Quiapo | Cubao MRT/LRT hub | España/Quezon Ave full corridor |

### UV Express (Cubao Hub, MEDIUM confidence)

| Route | Origin | Destination | Fare | Notes |
|-------|---------|-------------|------|-------|
| Cubao–Novaliches | Farmers Plaza Jollibee (Gen. Roxas) | Novaliches | ₱35–50 | 24/7 operation |
| Cubao–Buendia | Cubao UV Terminal | Buendia, Makati | ₱35–50 | Confirmed Moovit |
| Cubao–Antipolo | Farmers Plaza Jollibee | Antipolo | ₱35–50 | 5AM–11PM |
| Cubao–Deparo | Farmers Plaza | Deparo, Caloocan | ₱35–50 | ~12 min trip |
| Cubao–Montalban | Below LRT-2 Cubao | Rodriguez, Rizal | ₱35–50 | 24/7 |
| Cubao–Cogeo | Below LRT-2 Cubao | Cogeo, Antipolo | ₱35–50 | — |
| Cubao–Parang | Below LRT-2 Cubao | Parang, Marikina | ₱35–50 | — |

### P2P (Cubao, HIGH confidence)

| Route | Origin | Destination | Fare |
|-------|---------|-------------|------|
| UBE Express Cubao–NAIA | Araneta City Bus Port | NAIA T3 | ₱200 flat |

---

## Zone 2: University Belt North (Diliman / Katipunan)

UP Diliman campus (492 ha) is among the largest transit-service areas in QC. All campus routes are LTFRB-franchised and open to the public.

### UP Diliman Campus Routes (HIGH confidence — Sakay confirmed)

| Route | Name | Type | Stops | Fare | Freq |
|-------|------|------|-------|------|------|
| **UP-Ikot** | Campus Loop (CCW) | Modern PUJ | CHK → Fine Arts → Dorms → MSI → EEEI → NIGS → Law → Asian Ctr → Ilang-Ilang → SC → Area 2 → Kalayaan → Alumni → CSWCD → CHK | ₱13 | High (class hours) |
| **UP-Toki** | Campus Loop (CW) | Traditional PUJ | CHK → CSWCD → Music → Quezon Hall → CAL → Freshie Walk → Eng'g → Molave → Area 2 → SC → UHS → Law → Educ → CHE → Bio/Chem → NIP → Math → OUR → NIGS → EEEI → MSI → Arki → Fine Arts → CHK | ₱13 | 5AM–5PM school days |
| **UP-Katipunan** | UP→LRT-2 Katipunan | Traditional PUJ | CHK → Katipunan Ave (LRT-2 Katipunan) | ₱8.50 | Frequent peak hours |
| **UP-Philcoa** | UP→Commonwealth | Traditional PUJ | CHK → Philcoa (Commonwealth Ave) | ₱6.50 | Frequent class hours |
| **UP-SM North** | UP→SM North / MRT QA | Traditional PUJ | CHK → SM North EDSA / Trinoma / MRT-3 QA | ₱10.50 | Regular school hours |

**Source**: university-shuttles-routes.json; Sakay DOTR:R_SAKAY_PUJ_2156 (Ikot); lrt2-feeder-routes.json (Katipunan section); mrt3-feeder-routes.json.

**Validation status**: HIGH confidence. All five routes confirmed in Sakay.ph and/or LTFRB franchise data. Ikot restored September 2022; Toki re-launched February 5, 2024.

### Ateneo de Manila E-Jeepney (LOW public-transit value)

- Two internal lines (A & B) within campus only, NOT LTFRB franchised.
- Free but campus-internal; not included in GTFS feed.

### City Bus Route 51 (HIGH confidence — passes through)

Route 51 (VGC–Cubao) uses **Katipunan Ave** as a key alignment segment: UP Town Center → Ateneo → Katipunan → Project 2/3 → Cubao. Confirmed in cubao-terminal-routes and city-bus-operators.

### LRT-2 Katipunan Station Feeders (HIGH confidence)

From lrt2-feeder-routes:
- UP-Katipunan jeepney (UP campus → Katipunan Ave)
- QCityBus QCB-3 terminates at LRT-2 Katipunan (Welcome Rotonda → Aurora/Katipunan)
- QCityBus QCB-7 passes through LRT-2 Katipunan (QC Hall → Eastwood via Katipunan)

---

## Zone 3: Quezon Avenue / Timog / GMA-Kamuning

This zone encompasses the MRT-3 Quezon Avenue and GMA-Kamuning stations, the Tomas Morato entertainment district, Timog Avenue, and the Eton Centris development.

### QCityBus (HIGH confidence)

| Route | Name | Key Segment | Freq (peak) |
|-------|------|-------------|-------------|
| **QCB-6** | QC Hall–Gilmore | Quezon Ave (QC Hall → EDSA → Examiner → Delta → Gilmore) | 20 min |
| **QCB-3** | Welcome Rotonda–Aurora Katipunan | E. Rodriguez Sr. Ave / Kamuning Rd / Aurora | 20 min |

### MRT-3 GMA-Kamuning Feeders (MEDIUM–HIGH confidence)

| Route | Name | Key Stops | Source |
|-------|------|-----------|--------|
| España Rotonda–Proj. 2&3 via Timog | Jeepney | España Rotonda → Kamias/GMA-Kamuning → Timog/Tomas Morato | mrt3-feeder |
| Cubao via Timog | Jeepney | GMA-Kamuning → Ybardolaza → Cubao | mrt3-feeder |

**Note**: Kamuning EDSA Carousel stop (opened July 15, 2024) is accessible **only through the MRT station** — no street-level stop.

### MRT-3 Quezon Avenue Feeders (MEDIUM confidence)

| Route | Name | Notes |
|-------|------|-------|
| Eton Centris–Fairview jeepneys | Fairview-bound jeepneys | ~15 min headway from Eton Centris terminal |
| UP Diliman internal route to QA MRT | UP-SM North route also passes MRT QA | Confirmed in mrt3-feeder |

### UV Express at Quezon Ave / CIT (HIGH confidence)

| Route | Origin | Destination | Fare |
|-------|---------|-------------|------|
| Calumpit–CIT Quezon Ave | Calumpit, Bulacan | CIT, Quezon Avenue | — |
| Malolos–Quezon Ave | Malolos, Bulacan | Quezon Ave (CIT area) | — |
| Marilao–Quezon Ave MRT | Marilao, Bulacan | MRT-3 Quezon Ave Station | ₱44 |

CIT (Central Integrated Terminal) is the Bulacan UV Express terminus on Quezon Avenue near MRT-3.

### JAM Liner / JAC Liner (MEDIUM confidence)

JAM Liner terminal near EDSA-East Ave/Timog junction serves as departure point for Quezon Province / Laguna / Batangas provincial buses. Docs: mrt3-feeder (MRT3-GMA-F04).

---

## Zone 4: Commonwealth Avenue / Batasan Hills

Commonwealth Ave (R-7) runs 12.4 km from QMC to Quirino Hwy through central-northern QC. Fully validated in validated-commonwealth-avenue-corridor.md.

### City Buses (HIGH confidence — OSM + 2 sources)

| Route | Name | Direction through QC | OSM Geometry |
|-------|------|----------------------|--------------|
| **Route 6 / 6A** | Sapang Palay–PITX | SJDM → Commonwealth → Quezon Ave → PITX | OSM relation 9552776 |
| **Route 7** | Fairview–PITX | Fairview → Commonwealth → Quezon Ave → PITX | OSM relation 9552776 |
| **Route 17** | Fairview–Ayala | Fairview → Commonwealth → Quezon Ave → EDSA → Ayala | OSM relation 9856704 |
| **Route 33** | North EDSA–Starmall SJDM | North EDSA → Commonwealth → SJDM | OSM 9552779 |
| **Route 34** | PITX–Rodriguez | PITX → Quezon Ave → Commonwealth → Rodriguez | OSM confirmed |
| **Route 37** | Fairview–Monumento | Fairview → Commonwealth → Balintawak → Monumento | Medium (no OSM) |

### QCityBus (HIGH confidence)

| Route | Key Commonwealth Alignment |
|-------|---------------------------|
| **QCB-2** | QC Hall → Commonwealth → IBP Rd/Litex (Batasan Hills) — 6 min peak headway |

### Free Social Equity Buses (HIGH confidence)

| Route | Origin | Destination | Commonwealth Segment |
|-------|---------|-------------|---------------------|
| **Love Bus L1** | Valenzuela GC | Batasan Hills, QC | Via Quezon Ave / Commonwealth |
| **Love Bus L2** | Valenzuela GC | Fairview, QC | Via Commonwealth Ave |

### Key Jeepney Routes (Commonwealth — MEDIUM confidence)

| Route ID | Name | Distance |
|----------|------|----------|
| T249 | Lagro–QMC via Commonwealth | 12.23 km |
| T2102 | Fairview (Dahlia)–QMC via Commonwealth | 16.36 km |
| T2118 | Fairview–Philcoa/QMC | 10.72 km |
| T2121 | Lagro–Philcoa/QMC | 18 km |
| T2137 | Fairview (Dahlia)–Pier South | Long haul, LOW confidence |
| T2120 | Litex–TM Kalaw via Commonwealth / España | HIGH (OSM Wiki; A. Roces Transport SC) |

### QCityBus Batasan/Congressional Routes

| Route | Name | Key Route |
|-------|------|-----------|
| **QCB-4** | QC Hall–General Luis (Novaliches) | QC Hall → North Ave → Mindanao Ave → Quirino Hwy → General Luis Ave |
| **QCB-5** | QC Hall–Mindanao Ave via Visayas Ave | QC Hall → Visayas Ave → Congressional Ave → Mindanao Ave |
| **QCB-8** | QC Hall–Muñoz (loop) | QC Hall → North Ave → SM North → Congressional/Muñoz → QC Hall |

---

## Zone 5: Fairview / Novaliches / Lagro

Northern QC, anchored by SM City Fairview on Regalado Highway and Quirino Highway.

### City Buses (HIGH confidence)

| Route | Origin | Destination | Fare Range |
|-------|---------|-------------|------------|
| Route 7 (DOTR:R_SAKAY_PUB_2182) | **SM City Fairview** | PITX | ₱15–90 |
| Route 17 (OSM 9856704) | **SM City Fairview** | Ayala, Makati | ₱15–75 |

### P2P Buses (HIGH confidence — operator confirmed)

| Route | Origin | Destination | Fare |
|-------|---------|-------------|------|
| RRCG Robinsons Novaliches–Park Square | Robinsons Novaliches | Park Square, Makati | ₱160 (₱128 discounted) |
| RRCG One Ayala–SM Fairview | One Ayala, Makati | SM Fairview | ₱160 (₱128 discounted) |
| COMET SM Fairview–UnionBank Plaza | SM Fairview | UnionBank Plaza, Ortigas | ₱100 (GETPass) |
| Froelich Trinoma–Ayala | Trinoma | Ayala/Park Square, Makati | ₱75–95 |
| Froelich SM North–SM Megamall | SM North EDSA | SM Megamall | ₱50–65 |
| Precious Grace Bulacan lines (×4) | Bocaue / Caypombo / Malolos / Sta. Clara | SM North EDSA / Trinoma | ₱70+ |

### UV Express (HIGH–MEDIUM confidence)

| Route | Origin | Destination | Fare |
|-------|---------|-------------|------|
| SM Fairview–Buendia | SM Fairview | Buendia UV Terminal | ₱75 |
| SM Fairview–Quiapo via Commonwealth | SM Fairview | Quiapo / TM Kalaw | ₱43–50 |
| Trinoma–Robinsons Novaliches | Trinoma | Robinsons Novaliches | ₱24 |
| SM Fairview–SM North CIT | SM Fairview | SM North CIT | ₱21 |
| Lagro–TM Kalaw | Lagro | TM Kalaw, Manila | ₱50 |
| SM Fairview–Cubao | SM Fairview | Cubao | — |

### Modern Jeepney (HIGH confidence — Sakay confirmed)

| Route | Sakay ID | Description |
|-------|----------|-------------|
| SM Fairview–Commonwealth | DOTR:R_SAKAY_MPUJ_1125 | Modern PUJ; 4AM–10PM; fare ₱15 base + ₱2.20/km |
| Lagro–Cubao via Kalayaan (Route 215) | OSM route 215 | Medium confidence; Mindanao Ave corridor |
| Cubao–SM Fairview MPUJ | cubao-terminal | Modern PUJ via 1-TEAM aggregator |

### Traditional Jeepney (MEDIUM confidence — OSM Wiki T-series)

| Route ID | Name |
|----------|------|
| T118 | SM Fairview–Lagro loop |
| T125 | Capitol Park Homes II–SM Fairview |
| T161 | Bagong Silang–SM Fairview via Maligaya |
| T166 | Kiko Camarin–SM Fairview via Maligaya |
| T172 | H. dela Costa II–SM Fairview via Quirino Hwy |
| T179 | Bagong Silang–SM Fairview (6.4 km) |
| T180 | Bagong Silang–SM Fairview via Zabarte (8.39 km) |
| T249 | Lagro–QMC via Commonwealth (12.23 km) |
| T2121 | Lagro–Philcoa/QMC (18 km) |

### Cross-Boundary (Bulacan–QC)

| Route | Origin | QC Entry | Notes |
|-------|---------|----------|-------|
| Norzagaray–SM Fairview (Sakay PUJ_1992) | Norzagaray, Bulacan | Quirino Hwy, Caloocan | HIGH; via Bigte, SJDM, Quirino Hwy |
| Bagong Silang–SM Fairview (PUJ_1173) | Sto. Niño Parish, Caloocan | Regalado/SM Fairview terminal | HIGH; traditional PUJ |

---

## Zone 6: East QC (C5 / Eastwood / Project Areas)

Eastern QC is served primarily via the C5 corridor and Katipunan extension, validated in validated-c5-corridor.md.

### QCityBus (HIGH confidence)

| Route | Name | Key East QC Stops |
|-------|------|-------------------|
| **QCB-7** | QC Hall–C5/Ortigas Ave Extension | C.P. Garcia → Katipunan → Ateneo → LRT-2 Katipunan → Quirino Memorial → Boni Serrano → **Eastwood City** → C5/Ortigas Ave |

### Modern Jeepney (MEDIUM confidence)

| Route | Notes |
|-------|-------|
| Cubao–Eastwood/Libis MPUJ | 1-TEAM aggregator; traditional jeepneys also operated historically |
| Cubao–Sta. Lucia/Rosario | Sakay DOTR:R_SAKAY_MPUJ_909; HIGH |

### City Bus Route 51 (HIGH confidence — partial QC segment)

Route 51 passes through UP Town Center → Ateneo → Katipunan → Project 2 → Project 3 → Cubao. Covers eastern QC Katipunan corridor.

---

## Consolidated Validation: Source Agreement

### Routes Confirmed by 3+ Independent Sources

| Route | Sources Confirming |
|-------|-------------------|
| EDSA Carousel BRT | edsa-busway, OSM, Sakay, MMDA, Google Maps |
| QCityBus 1–8 | QC Government, ltoportal, city-bus-operators, OSM |
| Route 7 Fairview–PITX | OSM relation, Sakay, Fairview terminal, SM North analysis |
| Route 17 Fairview–Ayala | OSM relation, Sakay, Fairview terminal, transit-blogs |
| UP Ikot/Toki | Sakay DOTR:R_SAKAY_PUJ_2156, LTFRB, OSM, university-shuttles |
| RRCG Robinsons Novaliches–Park Square | RRCG operator site, p2p-routes, Sakay |
| SM Fairview–Buendia UV | Moovit, ltfrb-uv-express, Fairview terminal analysis |

### Contested Routes

| Route | Conflict | Resolution |
|-------|----------|------------|
| Route 4 (North EDSA–Fairview) | Some sources say via Mindanao Ave, others via Commonwealth directly | Treat as operating via both with route variants; MEDIUM confidence |
| Route 6 vs 6A | SJDM vs Norzagaray origin; identical QC segment | Documented both; same alignment within QC |
| Route 33 alignment | One source says Ayala–SRIT (pre-pandemic number); OSM says North EDSA–SJDM | Post-rationalization SJDM designation followed; pre-pandemic numbers unreliable |
| Froelich Tour fares | P2P fare data from 2018–2019; current rates unverified | Flag as outdated; note original source date |

### Known Gaps (No Data Found)

1. **Congressional Ave intra-QC jeepneys** — routes between Congressional Ave, Batasan Hills, and inner-QC barangays poorly documented
2. **Visayas Ave corridor** — internal QC routes along Visayas Ave (served partially by QCB-5 but jeepney network unknown)
3. **N. Domingo / 15th Ave** — lateral E-W QC routes between MRT corridor and Aurora Blvd
4. **Katipunan intra-corridor** — jeepneys running short segments within Katipunan Ave (Ateneo-Miriam-UP belt)
5. **Project Areas feeder network** — Project 2, 3, 4, 6, 8 internal jeepney grid mostly undocumented beyond terminal stops
6. **Novaliches interior** — barangay-level routes within Novaliches district
7. **East Ave corridor** — jeepneys along East Avenue (hospital belt) north of EDSA

---

## Route Summary by Mode

### By Mode and Confidence

| Mode | High Conf | Medium Conf | Low Conf | Total |
|------|-----------|-------------|----------|-------|
| City Bus | 11 | 5 | 1 | 17 |
| QCityBus (Free) | 8 | 0 | 0 | 8 |
| Modern Jeepney | 4 | 12 | 0 | 16 |
| Traditional Jeepney | 8 | 22 | 3 | 33 |
| UV Express | 6 | 6 | 2 | 14 |
| P2P | 9 | 4 | 1 | 14 |
| University Shuttle | 5 | 1 | 0 | 6 |
| **TOTAL** | **51** | **50** | **7** | **108** |

### Coverage Assessment

| Zone | Coverage Level | Key Gap |
|------|---------------|---------|
| EDSA/Cubao Hub | ✅ Good | Some intra-Cubao feeders missing |
| Diliman/Katipunan | ✅ Good | UP campus fully documented; lateral QC routes missing |
| Quezon Ave/Timog | ✅ Moderate | Tomas Morato internal routes not fully documented |
| Commonwealth/Batasan | ✅ Good | Congressional Ave feeder network gap |
| Fairview/Novaliches | ✅ Good | Novaliches interior barangay routes missing |
| East QC | ⚠️ Partial | Eastwood/Libis area covered; eastern Project areas sparse |

---

## Key Findings

1. **QCityBus is the most structured QC-specific service**: All 8 routes have full stop lists, headways, and operating hours. Zero fare. Fleet modernizing with electric buses (Route 1 as of Jan 2025). Coverage radiates from QC Hall in all directions.

2. **Cubao remains the dominant transit hub**: Combines MRT-3 + LRT-2 rail stations, UV Express, modern and traditional jeepney terminals, P2P bus port, and EDSA Carousel access. The Araneta City Bus Port for UBE Express and city buses makes Cubao the most intermodal node in QC.

3. **Commonwealth Avenue is a full-length bus corridor**: Routes 6, 7, 17, 33, and 34 all use Commonwealth. With MRT-7 under construction (targeted ~2027), this corridor will remain road-dependent through 2027.

4. **UP Diliman campus routes are the only LTFRB-franchised campus transit open to the public**: Ikot, Toki, Katipunan, Philcoa, and SM North routes all freely accessible. Sakay-confirmed. Critically links UP campus to LRT-2 Katipunan and MRT-3 corridor.

5. **P2P market is strong in Fairview/Novaliches corridor**: RRCG and Froelich Tours both serve this corridor with premium buses to Makati and Ortigas. Fare range ₱75–160 vs ₱43–75 for UV Express vs ₱15–90 for city bus — significant mode choice based on time/cost preference.

6. **Critical gap: East QC jeepney grid**: The Project areas (2, 3, 4, 6, 8), N. Domingo, 15th Ave, and Congressional Ave feeder networks are not systematically documented in any Wave 1 source. This represents the largest data gap for QC.

---

## Recommendations for GTFS

- **QCityBus routes 1–8**: Include with high confidence. Use stops from JSON; estimate geometry from road network.
- **UP Campus routes (Ikot/Toki/Philcoa/Katipunan/SM North)**: Include. Ikot/Toki have Sakay geometry available.
- **EDSA Carousel QC stops**: Already in EDSA validated file. Cross-reference: 6 QC stops (North Ave, Quezon Ave, Kamuning, Araneta-Cubao, plus Cubao Main Ave, Cubao Nepa Q-Mart).
- **City Buses 6/7/17/33/34**: Include with OSM geometry where available.
- **P2P routes**: Include RRCG and Froelich with schedule data from operator sites.
- **UV Express QC-origin routes**: Include Fairview–Buendia, Fairview–TM Kalaw, Trinoma–Novaliches with documented fares.
- **Defer**: Congressional Ave feeders, Project area jeepney grid, East Ave corridor — insufficient data for GTFS without field validation.
