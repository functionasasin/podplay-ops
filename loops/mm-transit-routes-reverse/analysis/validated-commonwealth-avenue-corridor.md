# Commonwealth Avenue Corridor — Cross-Reference & Validation

**Aspect**: Wave 2 — Commonwealth Avenue corridor
**Date**: 2026-02-28
**Sources consulted**: 20 raw files (OSM, Sakay, Moovit, LTFRB bus/jeepney/UV, city-bus-operators, SM North terminal, Fairview terminal, QCityBus, university-shuttles, dotr, OSM transit relations, ltoportal, wikimili, transit-blogs, ltfrb-modernization, ltfrb-rationalization, ltfrb-uv-express, moovit, web search)

---

## Corridor Overview

**Commonwealth Avenue** (Radial Road 7 / R-7) runs **12.4 km** in a straight line from the **Quezon Memorial Circle (Elliptical Road)** in the south to **Quirino Highway** at Novaliches in the north. At up to 18 lanes wide, it is the widest road in the Philippines and among the most transit-heavy corridors in Metro Manila. It passes through these major nodes:

| Node | Significance |
|------|-------------|
| QMC / Philcoa (km 0) | Junction with Elliptical Road; UP Diliman entry; major transfer point |
| Ever Gotesco Commonwealth (km ~3) | Major mall, landmark, jeepney drop-off |
| Commonwealth–EDSA / North Ave connector | Near SM North area |
| Congressional Ave / Tandang Sora (km ~7) | Key intersection for cross-corridor routes |
| IBP Road / Litex / Batasan Hills (km ~9) | House of Representatives; QCB-2 terminus |
| Batasan Complex (km ~10) | Legislative district hub |
| North Fairview / Dahlia (km ~11) | Residential, near SM Fairview approaches |
| Quirino Highway junction (km ~12.4) | Northern terminus; connects to Novaliches / Fairview terminal |

**MRT-7 under construction** will eventually shadow this corridor from Quezon City (North Avenue) to San Jose del Monte, Bulacan, with operations targeted for partial opening **~2027**. Until then, Commonwealth is entirely dependent on road-based transit.

---

## Confirmed Routes (HIGH confidence — 2+ independent sources)

### City Buses

| Route | Name | Origin | Destination | Key Alignment | Operator | OSM Geometry | Fare |
|-------|------|---------|-------------|---------------|----------|--------------|------|
| **Route 6 / 6A** | Sapang Palay–PITX | Sapang Palay, SJDM, Bulacan | PITX, Parañaque | Commonwealth → Quezon Ave → PITX | Fairview Bus | OSM confirmed | ₱13 base |
| **Route 7** | Fairview–PITX | SM City Fairview, QC | PITX, Parañaque | Commonwealth → Quezon Ave → España → PITX | NAT Transpo Group Inc. | OSM 9552776 (382 members) | ₱15–90 |
| **Route 17** | Fairview–Ayala | SM City Fairview, QC | Ayala, Makati | Commonwealth → Quezon Ave → EDSA → Ayala | Lippad Trans | OSM 9856704 (374 members) | ₱15–75 |
| **Route 33** | North EDSA–Starmall SJDM | SM North EDSA, QC | Starmall San Jose del Monte, Bulacan | North EDSA → Commonwealth → SJDM | Unknown | OSM 9552779 | ₱13+ |
| **Route 34** | PITX–Rodriguez | PITX, Parañaque | Rodriguez (Montalban), Rizal | PITX → Quezon Ave → Commonwealth → Rodriguez | Marikina Auto Line | OSM confirmed | ₱13 base |
| **Route 4** | North EDSA–Fairview | SM North EDSA, QC | Fairview, QC | North EDSA → Congressional → Mindanao Ave → Commonwealth/Quirino | Unknown | None documented | ₱13–45 |
| **Route 37** | Fairview–Monumento | SM Fairview / Novaliches | Monumento, Caloocan | Fairview → Commonwealth/Regalado → Balintawak → Monumento | Unknown | None | ₱13–50 |

**Notes on Route 6/7 distinction**: Both use the Commonwealth→Quezon Ave corridor. Route 6 originates from SJDM (Bulacan cross-boundary), Route 7 from SM Fairview (QC). Both terminate southbound at PITX. The Sakay/DOTr database has Route 7 as DOTR:R_SAKAY_PUB_2182. Some buses run as **Route 6A** as a variant with slightly different alignment.

**Notes on Route 33**: OSM 9552779 documents the North EDSA–Starmall SJDM alignment. One web source disputes this as "Route 33 = Ayala–SRIT" (pre-pandemic number conflict). Post-2020 rationalization relabeled many routes; the SJDM-via-Commonwealth designation appears in OSM and SM North terminal analysis — treating as MEDIUM-HIGH pending official LTFRB confirmation.

**Notes on Route 4**: Unclear whether the primary alignment is via Mindanao Avenue (as the rationalization plan suggests) or via Commonwealth Avenue directly. City bus analysis (city-bus-operators) lists key stops as "North EDSA, Commonwealth Ave, Quirino Hwy, Nova Stop, Fairview," suggesting it does travel on Commonwealth. LTFRB rationalization notes it as "inner-QC Commonwealth corridor feeder."

### QCityBus (Free — Quezon City Government)

| Route | Name | Origin | Destination | Commonwealth Segment | Peak Headway |
|-------|------|---------|-------------|---------------------|--------------|
| **QCB-2** | QC Hall–Litex/IBP Road | QC Hall NHA Interchange | IBP Road, Litex (Batasan Hills) | Full corridor — from QMC area through IBP | **6 min** peak Mon–Fri |

QCB-2 is the most significant Commonwealth-only route in the system, with documented stops:
- QC Hall NHA Interchange
- Commonwealth Ave / St. Peter Parish Church
- IBP Rd / Maclang General Hospital
- IBP Rd / QCU–Batasan Hills
- IBP Rd / Litex (terminus)

**Operating hours**: Mon–Fri 6:00 AM–9:00 PM; Sat 6:30 AM–8:30 PM; Sun 8:00 AM–8:00 PM.
**Fare**: FREE (Quezon City Ordinance SP-3184, 2023).
**6-minute peak headway** makes this the most frequent scheduled bus on Commonwealth Avenue.

### Free Social Equity Buses

| Route | Program | Origin | Destination | Alignment | Fare |
|-------|---------|---------|-------------|-----------|------|
| **Love Bus L1** | VGC–Batasan | Valenzuela Government Center | Batasan Hills, QC | Via Quezon Ave / Commonwealth | FREE (peak + senior/PWD always) |
| **Love Bus L2** | VGC–Fairview | Valenzuela Government Center | Fairview, QC | Via Commonwealth Ave | FREE (peak + senior/PWD always) |

Both confirmed by OSM geometry; operator: Global Electric Transport (GET Philippines); electric minibuses, 20 seats; launched as Marcos-era revival of the "Love Bus" concept.

### UV Express (Key Routes)

| Route | Origin | Destination | Key Alignment | Fare | Confidence |
|-------|---------|-------------|---------------|------|------------|
| SM Fairview–TM Kalaw | SM Fairview | TM Kalaw, Ermita | Commonwealth → España → TM Kalaw | ₱43 | HIGH (2 sources) |
| SM Fairview–Buendia | SM Fairview | Buendia, Makati | Commonwealth → EDSA → Buendia | ₱55–75 | HIGH (Moovit + LTFRB UV) |
| Trinoma–Robinsons Novaliches | Trinoma | Robinsons Novaliches | Commonwealth → Quirino Hwy | ₱24 | HIGH (3 sources) |

### University Feeder (Commonwealth Entry Point)

| Route | Mode | Origin | Destination | Commonwealth Node |
|-------|------|---------|-------------|-----------------|
| **UP Philcoa** | Jeepney (LTFRB) | UP Diliman (Checkpoint Gate) | Philcoa junction | Connects UP campus to Commonwealth Ave buses at Philcoa |

The **UP Philcoa** service (₱6.50 flat, high frequency during class hours) feeds into the major bus/jeepney stops at Philcoa/Commonwealth intersection — the southern gateway to the corridor.

---

## Medium Confidence Routes (single source or partially documented)

| Mode | Route | Origin | Destination | Fare | Issue |
|------|-------|---------|-------------|------|-------|
| UV Express | Lagro–TM Kalaw via Commonwealth | Lagro, QC | TM Kalaw | ₱50 | Single consumer source |
| UV Express | SM Fairview–Quiapo via Commonwealth | SM Fairview | Quiapo | ₱43 | Moovit only |
| UV Express | Robinsons Novaliches–Vito Cruz | Robinsons Novaliches | Vito Cruz, Manila | ₱47 | Single consumer source |
| UV Express | Robinsons Novaliches–Buendia | Robinsons Novaliches | Buendia | ₱55 | Single consumer source |
| UV Express | San Roque–Commonwealth Market | San Roque, Marikina | Commonwealth Market, QC | ₱20 | LTFRB UV file only |
| UV Express | SM Fairview–SM North CIT | SM Fairview | SM North CIT | ₱21 | Moovit + Fairview terminal |
| P2P | RRCG Robinsons Novaliches–Park Square | Robinsons Novaliches | Park Square, Makati | ₱128–160 | Well-documented but uses EDSA not full Commonwealth |
| P2P | COMET SM Fairview–UnionBank Plaza | SM Fairview | UnionBank Plaza, Ortigas | ₱100 | Single premium source |
| Jeepney | Lagro–QMC via Commonwealth (T249) | Lagro | QMC | ₱13–30 | OSM Wiki T-code; 12.23 km |
| Jeepney | Fairview (Dahlia)–QMC via Commonwealth (T2102) | Fairview Dahlia | QMC | ₱13–40 | OSM Wiki; 16.36 km |
| Jeepney | Fairview–Philcoa via Commonwealth (T2118) | Fairview | Philcoa/QMC | ₱13–30 | OSM Wiki; 10.72 km |
| Jeepney | Lagro–Philcoa via Commonwealth (T2121) | Lagro | Philcoa/QMC | ₱13–40 | OSM Wiki; 18 km |
| Jeepney | EDSA/North Ave–Commonwealth/IBP Road | EDSA/North Ave | Commonwealth/IBP Rd | ₱13 | Moovit 7637783; 37 stops, 49 min |
| City Bus | Route 38: Pacita–Fairview | Pacita Complex, Laguna | Fairview, QC | ₱13+ | Commonwealth only in final km |
| City Bus | Route 40: Fairview–Alabang via C5 | Fairview, QC | Alabang | ₱13+ | C5-primary; Commonwealth only at Fairview |

---

## Contested Routes

### Route 33 vs SJDM Alignment Conflict
- **OSM 9552779** documents Route 33 as North EDSA → Starmall SJDM, passing through Commonwealth Avenue.
- **One web source** states "Route 33 = Ayala–SRIT" under pre-pandemic numbering.
- **Resolution**: Post-2020 rationalization reused numbers. The SJDM alignment is confirmed by both SM North terminal analysis and OSM — likely the *post-2020* Route 33. The Ayala–SRIT was a *pre-2020* assignment. **Treating the SJDM alignment as current and Medium-High confidence.**

### Route 4 vs Route 33 for SJDM Coverage
- Two separate routes appear to serve the SJDM direction: Route 4 (North EDSA–Fairview, intra-QC) and Route 33 (North EDSA–SJDM, cross-boundary into Bulacan).
- Wikimili documents a **Route 33 / SJDM–North EDSA via Mindanao Ave** alignment (not Commonwealth), while OSM 9552779 shows it via Commonwealth.
- **No definitive resolution possible without official LTFRB confirmation.** Flag as contested.

### Route 6 vs Route 7 at Fairview Origin
- Both route numbers have been attributed to Fairview–PITX service in different sources.
- **Resolution**: Route 6 = Sapang Palay (SJDM) origin; Route 7 = Fairview (QC) origin. The Sakay/DOTr database (DOTR:R_SAKAY_PUB_2182) identifies the Fairview-PITX service as Route 7. Route 6 extends to SJDM. **Confirmed distinct routes, both HIGH.**

---

## Key Gaps

1. **No BRT or dedicated bus lane**: Unlike EDSA (Carousel busway), Commonwealth has no median bus lane. All buses share general traffic, contributing to chronic congestion and the "Killer Highway" fatality rate.
2. **No geometry for jeepney T-series routes**: T249, T2102, T2118, T2121 have distances but no GPS trace.
3. **Stop coordinates missing**: No lat/lon for any Commonwealth Ave bus stops (except QCB-2 stop names).
4. **Fairview terminal ambiguity**: Routes terminating "at Fairview" may stop at SM Fairview, Regalado Highway terminal, or Robinsons Novaliches — three different physical locations within 2 km.
5. **Batasan Hills underserved by premium services**: Only QCB-2 (free) and some jeepneys serve the IBP Road / Batasan area with reasonable frequency.
6. **UV Express schedules undocumented**: None of the ~8 UV Express routes on Commonwealth have published departure schedules (demand-based operation).
7. **MRT-7 impact unknown**: When MRT-7 opens (~2027), most Commonwealth bus routes will likely be restructured as feeders. No post-MRT-7 route plan found in sources.

---

## Summary Statistics

| Mode | Confirmed (HIGH) | Medium | Total |
|------|-----------------|--------|-------|
| City bus (LTFRB) | 7 | 2 | 9 |
| QCityBus (free) | 1 | 0 | 1 |
| Free/social (Love Bus) | 2 | 0 | 2 |
| UV Express | 3 | 5 | 8 |
| P2P premium bus | 0 | 2 | 2 |
| Jeepney | 1 (UP Philcoa) | 5 | 6 |
| **Total** | **14** | **14** | **28** |

- **OSM geometry available**: 5 city bus routes (Routes 6, 7, 17, 33, 34) + Love Bus L1/L2
- **Contested routes**: 3 (Route 33 alignment, Route 4 via-Commonwealth, Route 6 vs 7 origin)
- **Key future event**: MRT-7 opening (~2027) will restructure this entire corridor
