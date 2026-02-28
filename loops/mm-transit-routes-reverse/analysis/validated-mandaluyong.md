# Mandaluyong — Cross-Reference & Validation

**Analysis date:** 2026-02-28
**Aspect:** Wave 2 — Mandaluyong City
**Scope:** All routes within/through Mandaluyong City (NCR), including all modes

---

## City Geography

Mandaluyong City (10.87 km², ~350,000 pop.) is the geographically smallest NCR city and sits at the structural center of Metro Manila — bounded by San Juan to the north, Pasig to the east, Makati to the south, and Manila to the west.

**Key roads (west to east / north to south):**
- **EDSA (C-4):** Western edge; carries MRT-3, EDSA Carousel, and city buses. Three MRT-3 stations inside Mandaluyong: Boni, Shaw Blvd, and Ortigas (shared with Pasig on EDSA/Ortigas Ave).
- **Shaw Boulevard:** Main east–west thoroughfare. Western Shaw (Kalentong/JRC area) is the Manila boundary; EDSA Central Terminal at the EDSA/Shaw intersection is the primary jeepney hub; eastern Shaw continues into Pasig.
- **Boni Avenue:** Major east–west corridor south of Shaw. Runs from EDSA-Boni intersection eastward through Maysilo Circle (City Hall complex) to Barangka Drive / Pasig River boundary.
- **Ortigas Avenue:** Passes through southern Mandaluyong at the Mandaluyong/Pasig border (Ortigas Center is on the Pasig side, but the MRT-3 Ortigas station is addressed to Mandaluyong).
- **J.P. Rizal Street:** North–south local road in southern Mandaluyong connecting Shaw Blvd to the Haig/Vergara area.
- **Martinez Street (C-3 Road):** Secondary north–south axis.
- **Daang Bakal / New Panaderos Extension:** Eastern Mandaluyong, runs along old railway corridor near JRU area.

**Transit hubs:**
1. **EDSA Central Terminal (Shaw/EDSA intersection):** Two jeepney sub-terminals (Greenfield District exit: Rizal Province; Main Terminal: short-haul + Taguig/Pateros); UV Express terminal; Starmall EDSA-Shaw P2P terminal (RRCG).
2. **Boni/Pinatubo Terminal (EDSA-Boni area):** Jeepney terminus for 3 Sakay-confirmed routes.
3. **SM Megamall / Ortigas Center:** On Mandaluyong/Pasig boundary (Pasig-addressed); but UV Express and P2P buses at this hub serve Mandaluyong.

**Barangays:** 27 barangays, divided into two political districts. Interior barangays (Wack-Wack, Highway Hills, Addition Hills, Plainview, etc.) are predominantly served by tricycles and pedicabs rather than PUJ routes, per official city transport profile.

---

## Sources Consulted

| Source File | Relevance |
|---|---|
| validated-shaw-boulevard-corridor.md | 16 routes with Mandaluyong O/D or stops |
| validated-edsa-corridor.md | EDSA Carousel + P2P + city buses through Mandaluyong |
| validated-ortigas-avenue-corridor.md | Ortigas Center routes (Mandaluyong/Pasig boundary) |
| mrt3-feeder-routes.json | Boni Station (F01–F02) and Ortigas/Shaw feeders |
| ltfrb-jeepney-routes.json | T3182, MODERN-005/006/009 |
| ltfrb-modernization-routes.json | MPUJ-007, MPUJ-010, MPUJ-011 |
| sakay-ph-routes.json | MPUJ_825, PUJ_273, MPUJ_826, LTFRB_PUJ1001 |
| ltfrb-uv-express-routes.json | 8 UV Express routes terminating at EDSA Central/Shaw |
| p2p-routes.json | P2P-RRCG-002, P2P-MEX-002 |
| validated-pasig-routes.json | Cross-reference Shaw/Ortigas corridor Mandaluyong |
| validated-taguig-bgc-routes.json | T266 AFP/PNP → Guadalupe/EDSA Central |
| moovit-routes.json | Daang Bakal–Arayat intra-Mandaluyong jeepney |
| mandaluyong.gov.ph/profile/transportation/ | Official city transport profile |
| Web searches (Moovit, Wikipedia, Sakay) | Additional intra-city and Boni Ave route details |

---

## Rail Transit in Mandaluyong

### MRT-3 (Metro Rail Transit Line 3)
- **Stations in Mandaluyong:** Boni Avenue, Shaw Boulevard, Ortigas Center (boundary with Pasig)
- **Mode:** Heavy rail (elevated)
- **Hours:** 5:00 AM – 10:00 PM (extended to 11:00 PM on select days)
- **Frequency:** Peak ~3–4 min; off-peak ~5–8 min
- **Fare:** ₱13–₱28 (distance-based, from Taft Ave to North Ave)
- **Confidence:** HIGH (multiple sources)

### EDSA Carousel (passes through Mandaluyong)
- **Mandaluyong stops:** Boni (between Guadalupe and Ortigas) and Ortigas (Mandaluyong/Pasig boundary)
- The Carousel does **not** stop at Shaw Blvd station — a documented service gap
- For full Carousel data, see validated-edsa-corridor.md

---

## Confirmed Routes (HIGH Confidence — 2+ independent sources)

### P2P Premium Bus Routes

| Route ID | Name | Origin | Destination | Fare | Frequency | Confidence | Sources |
|---|---|---|---|---|---|---|---|
| P2P-RRCG-002 | Starmall EDSA Shaw–Alabang Town Center | Starmall EDSA-Shaw, Mandaluyong | Alabang Town Center, Muntinlupa | ₱140 (₱112 disc.) | 30+ trips/day weekdays 6:30AM–10PM; 9 trips Sat; limited Sun | **HIGH** | p2p-routes.json, validated-edsa-corridor, validated-shaw-blvd, RRCG operator confirmed |

**Note:** The Starmall EDSA-Shaw terminal also serves as an intermediate stop for:
- RRCG Robinsons Cainta–Greenbelt 5 (₱90/₱72) — also stops here
- RRCG SM Masinag–SM Megamall–One Ayala (₱140/₱112) — also stops here

### City Bus Routes (through Mandaluyong)

| Route ID | Name | Key Mandaluyong Segment | Confidence | Sources |
|---|---|---|---|---|
| Route E (Carousel) | EDSA Carousel | Boni stop + Ortigas stop (2 stops) | HIGH | edsa-busway, mmda, ltfrb-bus, osm |
| Route 12 | Kalentong–Pasig via Shaw Blvd | Origin at Kalentong (western Mandaluyong/Manila boundary) | MEDIUM | ltfrb-bus, transit-blogs; no operator confirmed |

**Note on through-city buses on EDSA:** Multiple city buses pass through Mandaluyong on EDSA without stopping (MMBC Baclaran–Fairview, MALTC Montalban–Baclaran, RRCG/HM city buses). These are documented in validated-edsa-corridor.md and not repeated here.

### UV Express Routes (EDSA Central Terminal, Mandaluyong)

The EDSA Central (Starmall EDSA-Shaw) UV Express terminal serves as the western terminus for multiple Rizal Province UV Express routes. Five routes have HIGH confidence from multiple sources.

| Route ID | Name | Origin | Destination | Fare | Confidence | Sources |
|---|---|---|---|---|---|---|
| UVE-N64 | Pasig City – EDSA Central | Pasig City | EDSA Central (Starmall), Mandaluyong | ~₱30–40 | HIGH | ltfrb-uv-express, Moovit, LTFRB DB |
| UVE-C68 | Robinson's Cainta – EDSA Central | Robinsons Place Cainta, Rizal | EDSA Central (Starmall), Mandaluyong | ~₱40–60 | HIGH | ltfrb-uv-express, validated-marcos-highway |
| UVE-RIZ-04 / MH-UV-007 | Antipolo – EDSA Shaw Blvd. (Wack-Wack) | Antipolo City, Rizal | EDSA Shaw Blvd. (Wack-Wack), Mandaluyong | ~₱40–80+ | HIGH | ltfrb-uv-express, validated-marcos-highway (HIGH), Moovit |
| UVE-RIZ-06 | Taytay – EDSA Central | Taytay, Rizal | EDSA Central (Starmall), Mandaluyong | ~₱40–60 | HIGH | ltfrb-uv-express, validated-shaw-blvd (Taytay UV Express listed), LTFRB DB |
| UVE-RIZ-09 | Binangonan – EDSA Central | Binangonan, Rizal | EDSA Central (Starmall), Mandaluyong | ~₱50–80 | HIGH | ltfrb-uv-express, LTFRB DB, validated-shaw-blvd |

**Terminal note:** The "EDSA Shaw Blvd. (Wack-Wack)" UV Express terminal referenced for Antipolo routes may be a separate UV Express unloading zone near the Wack-Wack area along EDSA (north of the Shaw Blvd intersection), distinct from the main EDSA Central Starmall terminal at Shaw/EDSA. LTFRB data lists both termini; field verification needed.

### Jeepney Routes

| Route ID | Name | Origin | Destination | Key Stops | Fare | Hours | Confidence | Sources |
|---|---|---|---|---|---|---|---|---|
| DOTR:R_SAKAY_MPUJ_825 | Boni/Pinatubo – Stop & Shop | Arayat St., Mandaluyong | Ramon Magsaysay Blvd./Altura Intersection, Manila | Boni/Pinatubo area → Manila | ₱13 min | 4AM–10PM daily | **HIGH** | Sakay live (MPUJ confirmed), ltfrb-modernization (MPUJ-007/cross-reference) |
| DOTR:R_SAKAY_2018_PUJ_273 | Boni/Pinatubo – Kalentong/JRC | Boni/Pinatubo, Mandaluyong | Kalentong/JRC (Manila boundary) | Maysilo Circle/Boni, Boni/Sto. Rosario (City Medical Center), Boni/Primo Cruz, Boni/F. Ortigas, Boni/A.T. Reyes | ₱13 min | Regular service | **HIGH** | Sakay (route code confirmed), Moovit (cross-reference with Maysilo stop) |
| DOTR:R_SAKAY_MPUJ_826 | Boni Robinsons Complex – Kalentong | Reliance St. / Robinsons Complex, Mandaluyong | New Panaderos Extension / 34 Rte. Rev. G. Aglipay Intersection, Mandaluyong | Boni Ave near Pulog, RTU (Basilan/Boni Ave), Mandaluyong City Medical Center (Boni/Sto. Rosario), Boni/Primo Cruz, Boni/F. Ortigas, Boni/A.T. Reyes | ₱13 min | 4AM–10PM daily | **HIGH** | Sakay (MPUJ code confirmed), web research (Moovit, Mandaluyong transport overview) |
| PUJ_916 / T279 | EDSA/Shaw Central – Tipas/Pateros via San Joaquin | EDSA Central Jeepney Terminal, Mandaluyong | M. Almeda, Pateros (via Tipas, Taguig) | Shaw Blvd → Kapitolyo/Capitol Commons → C5 Bagong Ilog → Pasig Rotonda → Pasig Simbahan → San Joaquin → A. Luna → M. Almeda Pateros | ₱13 min | 4AM–10PM | **HIGH** | Sakay live (DOTR:R_SAKAY_PUJ_916), LTFRB T279, validated-shaw-blvd |
| PUJ_923 | EDSA/Shaw Central – Morong, Rizal | EDSA Central Terminal, Mandaluyong | Morong, Rizal | Shaw Blvd → Pasig → Ortigas Ave Extension → Rizal Province → Morong | ₱13–60+ | 4AM–10PM | **HIGH** | Sakay live (DOTR:R_SAKAY_PUJ_923), LTFRB DB |

---

## Medium-Confidence Routes (single source or partial corroboration)

### Jeepney Routes

| Route ID | Name | Origin | Destination | Key Stops | Fare | Confidence | Sources |
|---|---|---|---|---|---|---|---|
| Moovit 7637818 | Paltok/Ramon Magsaysay Blvd. – Boni Ave./EDSA | Paltok/Ramon Magsaysay Blvd Intersection, Manila | Boni Ave/EDSA Intersection, Mandaluyong | 22 stops, 35 min; crosses Manila–Mandaluyong boundary via Sta. Mesa | ₱13 min | Medium | Moovit (22 stops, 6AM–midnight); likely same corridor as PUJ_273 reverse but different terminus |
| Moovit 7638054 | Daang Bakal/New Panaderos Extension – Arayat (Mandaluyong) | Daang Bakal/New Panaderos Extension, Mandaluyong | Arayat, Mandaluyong | Intra-Mandaluyong (eastern sector near JRU campus) | ₱13 min | Medium | Moovit (confirmed operational, 6AM–midnight); reverse of MPUJ_825 partial segment |
| Moovit 7638188 | Arayat – New Panaderos Extension (Mandaluyong) | Arayat, Mandaluyong | New Panaderos Extension / 34 Rte. Rev. G. Aglipay Intersection, Mandaluyong | Reverse of above, intra-Mandaluyong loop | ₱13 min | Medium | Moovit |
| Moovit 7637758 | J.P. Rizal – Shaw Blvd (Mandaluyong) | J.P. Rizal, Mandaluyong | Shaw Blvd., Mandaluyong | 5 stops, 6AM–midnight; short intra-Mandaluyong route, south Mandaluyong to Shaw | ₱13 min | Medium | Moovit (5 stops, daily) |
| Moovit 7637758-reverse | Haig – J.P. Rizal (Mandaluyong) | Haig, Mandaluyong | J.P. Rizal, Mandaluyong | 6 stops, ~10 min; reverse direction of above | ₱13 min | Medium | Moovit |
| Moovit 7638065 | Alchan – Jose Rizal University (JRU) | Alchan, Mandaluyong (Barangka Ilaya) | JRU, J. Fabella St., Mandaluyong | 20 stops, 31 min; intra-Mandaluyong covering eastern sector | ₱13 min | Medium | Moovit (20 stops, 6AM–midnight) |
| Moovit 7638065-rev | JRU – Alchan (Mandaluyong) | JRU, J. Fabella St., Mandaluyong | Alchan, Mandaluyong | 20 stops, 29 min; reverse direction | ₱13 min | Medium | Moovit |
| Moovit 7638311 | Daang Bakal/New Panaderos Extension – Alchan | Daang Bakal/New Panaderos Extension, Mandaluyong | Alchan, Mandaluyong | 19 stops, 26 min; intra-Mandaluyong | ₱13 min | Medium | Moovit |
| Moovit 7637768 | MRT-3 Boni/EDSA-Pinatubo – Daang Bakal/New Panaderos Extension | MRT-3 Boni Ave Station/EDSA-Pinatubo, Mandaluyong | Daang Bakal/New Panaderos Extension, Mandaluyong | 10 stops, 18 min; south-to-east Mandaluyong connector | ₱13 min | Medium | Moovit (10 stops, 2 directions) |
| Moovit 7637796 | Shaw Blvd. – Sierra Madre/Sultan, Makati City | Shaw Blvd., Mandaluyong | Sierra Madre/Sultan, Makati City | Shaw Blvd west → J.P. Rizal Extension → Makati (Comembo/Guadalupe area) | ₱13 min | Medium | Moovit (operational daily) |
| MODERN-009 / MPUJ-007 | EDSA Buendia – Mandaluyong City Hall | EDSA Buendia, Makati | Mandaluyong City Hall, Maysilo Circle | Jupiter, Rockwell (Makati) → Mandaluyong City Hall | ₱13 min | Medium | ltfrb-jeepney (MODERN-009), ltfrb-modernization (MPUJ-007); also referenced in eSakay e-jeepney routing |
| MRT3-BUE-F04 | eSakay E-Jeepney – Circuit Makati/Mandaluyong City Hall | EDSA Buendia MRT area | Circuit Makati / Mandaluyong City Hall | Buendia MRT → Circuit Makati → Mandaluyong City Hall | ₱9 flat | Regular | Medium | mrt3-feeder-routes.json; Makati Loop analysis |
| T276 | EDSA/Shaw Blvd – E. Rodriguez/Brgy. Ugong, Vargas Ave. | EDSA/Shaw Blvd, Mandaluyong | E. Rodriguez Ave/Vargas Ave, Brgy. Ugong, Pasig | Shaw Blvd east into Pasig | ₱13 | Medium | ltfrb-jeepney, validated-shaw-blvd |
| T277 | EDSA/Shaw Blvd – E. Rodriguez/Ortigas Ave. | EDSA/Shaw Blvd, Mandaluyong | E. Rodriguez/Ortigas Ave junction, Pasig | Shaw Blvd east → Ortigas area | ₱13 | Medium | ltfrb-jeepney, Sakay ref, validated-ortigas-corridor |
| T290 | Antipolo – EDSA/Shaw Blvd | Antipolo, Rizal | EDSA/Shaw Blvd, Mandaluyong | Antipolo → Ortigas Ave → Meralco Ave → Shaw | ₱13–35 | Medium | OSM T290 code, Moovit; validated-shaw-blvd |
| SHAW-WEST-BONI-KALENTONG | Boni (Robinsons Complex) – Kalentong/JRC, Manila | Boni Ave/Robinsons Complex, Mandaluyong | Kalentong/JRC, Manila | Shaw Blvd west → Kalentong → Manila | ₱13 | Medium | Wikipedia (Shaw Blvd article); no LTFRB code |
| SHAW-WEST-PASIG-QUIAPO | Pasig (TP) – Quiapo via Sta. Mesa (Shaw west) | Pasig City terminal area | Quiapo (Echague), Manila | Pasig → Shaw Blvd → Kalentong → Sta. Mesa → Quiapo | ₱13+ | Medium | Wikipedia; no LTFRB code; passes through western Mandaluyong |
| MRT3-GUA-F02 | T266: AFP/PNP Taguig – Guadalupe (ABC) / EDSA Central | AFP/PNP Housing Area, Taguig | EDSA Central Jeepney Terminal, Mandaluyong / Guadalupe MRT | AFP Taguig → M. Asuncion → Guadalupe MRT → EDSA Central | ₱13 | Medium | mrt3-feeder-routes.json |
| SHAW-MAYFLOWER-PIONEER | Mayflower (Mandaluyong) – Pioneer (Pasig) | Mayflower, Mandaluyong | Pioneer, Pasig City | Short Shaw Blvd segment; 4 min ride | ₱13 | Medium | Rome2rio; validated-shaw-blvd |
| UVE-PAS-03 | Santolan (Pasig) – SM Megamall | Santolan, Pasig | SM Megamall, Pasig/Mandaluyong border | ~30 min | ~₱30 | Medium | ltfrb-uv-express, validated-pasig |
| UVE-RIZ-11 | Tanay – EDSA Shaw Blvd. | Tanay, Rizal | EDSA Shaw Blvd., Mandaluyong | Long-haul Rizal Province route | ~₱50–80+ | Medium | ltfrb-uv-express, MH-UV-010 |

### P2P Routes

| Route ID | Name | Origin | Destination | Fare | Confidence | Sources |
|---|---|---|---|---|---|---|
| P2P-MEX-002 | Vista Mall Taguig – Starmall EDSA Shaw | Vista Mall, Taguig | Starmall EDSA Shaw, Mandaluyong | Unknown | Medium | p2p-routes.json, moovit-p2p-8477054; no fare or operator details confirmed |

---

## Low-Confidence Routes (single source, unverified)

| Route ID | Name | Origin | Destination | Confidence | Sources |
|---|---|---|---|---|---|
| LTFRB_PUJ1001 | Hulo – P. Victorino/Kalentong | Hulo, Mandaluyong | P. Victorino/Kalentong | Low | sakay-ph-routes.json only; Sakay listed but no detail |
| T278 | EDSA/Shaw – E.R./Ortigas (variant) | EDSA/Shaw Blvd | E. Rodriguez/Ortigas | Low | ltfrb-jeepney only; likely alignment variant of T277 |
| T235 | EDSA Shaw – Ortigas Complex (short CBD connector) | EDSA/Shaw | Ortigas Complex | Low | OSM only (low detail) |
| MRT3-BONI-F01 | Mandaluyong – RTU via Boni Ave. | EDSA Boni MRT | Rizal Technological University | Low | mrt3-feeder only; likely subsumed by MPUJ_826 which explicitly stops at RTU |

---

## Defunct / Suspended Routes

| Route | Operator | Status |
|---|---|---|
| SM North EDSA–SM Megamall (P2P) | Froehlich Tours | DEFUNCT ~2020 (Wirecard scandal); Megamall is on Mandaluyong/Pasig boundary |
| Trinoma–Ayala Center (P2P) | Froehlich Tours | DEFUNCT ~2020; used EDSA through Mandaluyong |
| EDSA Carousel at Shaw Blvd stop | N/A | NOT DEFUNCT — Shaw Blvd MRT Station simply never had a Carousel stop; no BRT service at Shaw despite high MRT ridership |

---

## Cross-Reference & Deduplication Analysis

### Confirmed Multi-Source Matches

| Route | Sources Agreement | Decision |
|---|---|---|
| MPUJ_825 (Boni/Pinatubo → Stop & Shop) | Sakay code confirmed; route referenced in ltfrb-modernization MPUJ-007 (same Boni→Manila corridor) | **Treat as one route.** MPUJ_825 is canonical Sakay ID. MPUJ-007 in modernization file refers to same route with Mandaluyong City Hall as endpoint note — may be slight alignment difference. Flag for field verification. |
| PUJ_273 (Boni/Pinatubo → Kalentong/JRC) vs MPUJ_826 (Boni Robinsons → Kalentong) | Both Sakay-confirmed; both use Boni Ave with almost identical stops (RTU, City Medical Center, Boni/Primo Cruz) | **Treat as two distinct routes.** PUJ_273 is the traditional jeepney franchise; MPUJ_826 is its modern PUJ replacement with a slightly different western terminal (Robinsons Complex vs Pinatubo terminal). Both may co-exist during transition. |
| PUJ_916 / T279 | Sakay live (DOTR:R_SAKAY_PUJ_916) = LTFRB T279 | **Same route.** PUJ_916 is canonical Sakay ID; T279 is the LTFRB franchise code. |
| EDSA Buendia → Mandaluyong City Hall (MODERN-009 / MPUJ-007) vs eSakay E-Jeepney (MRT3-BUE-F04) | Both serve Buendia → Mandaluyong City Hall corridor | **Likely two different vehicles/operators on same corridor.** MODERN-009/MPUJ-007 is an LTFRB-franchised modern PUJ; MRT3-BUE-F04 is the eSakay e-jeepney (Meralco subsidiary, distinct fleet). The eSakay route extends to Circuit Makati; the MPUJ route may terminate at Mandaluyong City Hall only. Track separately. |

### Contested/Ambiguous Routes

1. **"Paltok/Magsaysay Blvd. → Boni Ave./EDSA" (Moovit 7637818) vs PUJ_273 (Boni/Pinatubo → Kalentong/JRC):** These appear to be related but distinct. PUJ_273 goes from Boni/Pinatubo area to Kalentong/JRC in Manila, passing through Maysilo Circle. Moovit 7637818 starts from Paltok/Ramon Magsaysay Blvd. (Manila) and terminates at Boni Ave./EDSA (Mandaluyong) — a different Manila endpoint (Paltok vs Kalentong/JRC is not the same location). However, they share overlapping segments of Boni Ave. **Resolution:** Treat as distinct routes; Moovit 7637818 may represent the reverse-direction view of a route that extends beyond the Boni/EDSA terminus. Field verification needed.

2. **Intra-Mandaluyong Moovit routes (7638054, 7638311, 7637758, 7638065, 7637768):** These five Moovit routes cover the interior of Mandaluyong — Daang Bakal, New Panaderos Extension, Arayat St., JRU, Alchan, J.P. Rizal, Haig. They form a network of short-haul routes in eastern/southern Mandaluyong that are not individually coded in LTFRB franchise databases. **Resolution:** Accept as real operational routes based on Moovit documentation; assign provisional IDs; flag as needing T-code or franchise verification. They likely correspond to traditional jeepney franchises that have not been individually catalogued in Wave 1 data sources.

3. **HULO / KALENTONG routes:** Sakay LTFRB_PUJ1001 (Hulo → P. Victorino/Kalentong) and the Wikipedia-cited "Hulo – P. Victorino/Kalentong" and "Kalentong JRC – P. Victorino via P. Cruz" are likely the same route in different directions. This serves the Hulo barangay area (northern Mandaluyong near the Pasig River boundary) toward Manila. **Resolution:** Treat as single route; use Hulo → Kalentong/JRC as the canonical direction.

### Orphan Routes (single source)

- Moovit 7638065 (Alchan–JRU, 20 stops): Moovit only; no LTFRB code found, but plausible given Alchan and JRU are both in Mandaluyong
- Moovit 7637796 (Shaw Blvd → Sierra Madre/Sultan, Makati): Moovit only; extends Shaw Blvd westward into Makati's Comembo/J.P. Rizal area
- P2P-MEX-002 (Vista Mall Taguig → Starmall EDSA Shaw): Single source (p2p-routes.json); no operator confirmation

---

## Coverage Gaps

1. **No EDSA Carousel stop at Shaw Blvd:** The busiest MRT-3 station in Mandaluyong (Shaw) has no BRT equivalent. Commuters must use MRT-3 or walk to Ortigas/Boni Carousel stops. This is Mandaluyong's most significant transit gap.

2. **Boni Station feeder network is weak:** MRT-3 Boni Station has only 2–3 documented jeepney routes (lowest of any Mandaluyong MRT station). The Boni Ave jeepney network is documented along the road but connecting directly to the MRT station is less clear.

3. **Interior barangay coverage is tricycle-only:** Barangays in the interior (Wack-Wack, Highway Hills, Addition Hills, Vergara/Highway Hills Subd., Plainview, Daang Bakal interior) are served by tricycles and pedicabs. No LTFRB jeepney routes penetrate these areas. Interior access requires walking to main roads (Boni Ave, Shaw Blvd).

4. **Mandaluyong City Hall area (Maysilo Circle):** Despite being a major landmark, Maysilo Circle has limited documented service: PUJ_273 stops there (Maysilo Circle/Boni Ave), and the eSakay E-Jeepney from Buendia extends here. No high-frequency bus service to City Hall.

5. **EDSA Central UV Express routes not individually itemized:** Multiple Rizal Province UV Express routes terminate at EDSA Central but their individual LTFRB route IDs are not publicly listed. Only 5 of ~8–10 UV routes at this terminal are documented (Pasig City, Cainta, Antipolo, Taytay, Binangonan; Tanay is medium confidence; Morong and Angono not confirmed as UV Express).

6. **J.P. Rizal St. corridor:** The J.P. Rizal Street running south through Mandaluyong (Haig–Vergara area) toward the Makati/Mandaluyong border is served by only a 5–6 stop jeepney per Moovit data. This is insufficient for the corridor density.

7. **No P2P routes from Mandaluyong northward:** All P2P buses originate from or pass through the EDSA-Shaw terminal heading SOUTH (Alabang, Makati). No P2P connecting Mandaluyong to Fairview, Novaliches, or QC interior has been documented.

8. **Weekend transit gaps:** P2P RRCG drops from 30+ daily trips to 9 on Saturday, limited Sunday service. UV Express frequency on weekends unknown. Moovit-documented intra-Mandaluyong jeepneys (6AM–midnight) may have lower frequency on weekends but no data available.

9. **No GPS stop coordinates** for any Mandaluyong jeepney stop. All GTFS stop positions will require estimation.

---

## Frequency Estimates

| Route | Peak Headway | Off-Peak Headway | Source |
|---|---|---|---|
| MRT-3 (Boni/Shaw/Ortigas) | ~3–4 min | ~5–8 min | MRT-3 official schedule |
| EDSA Carousel (Boni + Ortigas stops) | ~3–5 min | ~10–15 min | edsa-busway-routes.json |
| PUJ_916 (Shaw–Tipas/Pateros) | ~5–10 min | ~10–15 min | Sakay operational hours estimate |
| PUJ_923 (Shaw–Morong) | ~15–30 min | ~30–60 min | Long-haul estimate |
| MPUJ_825 (Boni/Pinatubo → Stop & Shop) | ~5–10 min | ~10–20 min | Standard modern PUJ estimate |
| PUJ_273 / MPUJ_826 (Boni → Kalentong) | ~5–10 min | ~15–20 min | Standard PUJ estimate |
| Intra-Mandaluyong jeepneys (Moovit) | ~10–15 min | ~15–30 min | Estimate based on route length and standard PUJ pattern |
| P2P RRCG (Shaw–Alabang) | ~30 min avg | Scheduled departures | p2p-routes.json; 30+ daily trips |
| UV Express (EDSA Central terminal) | ~15–30 min | ~30–60 min | Standard UV Express estimate |

---

## Statistics

- **Confirmed routes (HIGH, 2+ sources):** 11 (MRT-3, Carousel, 1 P2P, Route 12, 5 UV Express, 5 jeepney)
- **Medium-confidence routes:** 22
- **Low-confidence routes:** 4
- **Defunct/suspended:** 2 (Froehlich P2P routes)
- **Coverage gaps identified:** 9
- **Routes with geometry (OSM):** 1 (EDSA Carousel via validated-edsa-corridor)
- **Routes with GPS stop coordinates:** 0 (none confirmed for Mandaluyong specifically)

---

## Key Findings

1. **EDSA Central Terminal (Shaw/EDSA) is Mandaluyong's transit core.** This one intersection hosts: two jeepney sub-terminals, a UV Express terminal, Starmall EDSA-Shaw P2P terminal, and MRT-3 Shaw Station. Virtually all through-city transit touches this node.

2. **Boni Avenue is Mandaluyong's internal transit spine.** Three Sakay-confirmed PUJ routes (PUJ_273, MPUJ_825, MPUJ_826) run along Boni Ave from EDSA-Boni eastward through Maysilo Circle to Barangka, with stops at RTU, Mandaluyong City Medical Center, and multiple barangay crossings. This is the city's most documented local route corridor.

3. **Mandaluyong's interior relies on tricycles.** The city government explicitly states tricycles/pedicabs serve interior roads. LTFRB jeepney routes are inter-city connections rather than intra-city circulators — confirmed by the city's 27 barangays having no documented dedicated PUJ service.

4. **The EDSA Carousel gap at Shaw Blvd is Mandaluyong's most significant transit deficiency.** Despite Shaw MRT being one of MRT-3's busiest stations, there is no Carousel BRT stop, leaving EDSA connectivity entirely reliant on MRT-3 or walking to Boni or Ortigas Carousel stops.

5. **UV Express is the dominant provincial connector.** Five HIGH-confidence UV Express routes from Pasig, Cainta, Antipolo, Taytay, and Binangonan terminate at EDSA Central — the primary mode for Rizal Province commuters entering Mandaluyong.

6. **Intra-Mandaluyong jeepney network is weakly documented.** Moovit reveals 5+ short-haul routes in eastern Mandaluyong (Daang Bakal–Arayat, Alchan–JRU, J.P. Rizal–Shaw, etc.) with no LTFRB franchise codes. These fill the gap between tricycle service and the main Boni/Shaw corridors, but are insufficiently documented for GTFS synthesis.

7. **P2P penetration is South-bound only.** RRCG's Starmall EDSA-Shaw terminal is a southbound hub (to Alabang), with the Vista Mall Taguig route also arriving from the south. No P2P bus connects Mandaluyong northward to Quezon City or Fairview, and the Froehlich closure (SM North→Megamall) left a gap that hasn't been filled.
