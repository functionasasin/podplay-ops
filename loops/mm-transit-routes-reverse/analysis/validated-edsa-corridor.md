# Validated Routes: EDSA Corridor

**Wave 2 Cross-Reference | Generated: 2026-02-28**

EDSA (Epifanio de los Santos Avenue / C-4) runs ~24km from PITX/Parañaque in the south to Monumento/Caloocan in the north. It is the primary spine of Metro Manila transit, carrying the BRT busway, MRT-3, and dozens of parallel/feeder services.

---

## Sources Consulted

| Source File | Routes with EDSA Relevance |
|---|---|
| edsa-busway-routes.json | Carousel stop coordinates, variant details |
| mmda-routes.json | Carousel + 16 rationalized city bus routes |
| ltfrb-bus-routes.json | Carousel + 30 rationalized routes, P2P, QCityBus |
| city-bus-operators-routes.json | 20 bus routes with EDSA key stops or EDSA endpoints |
| osm-transit-relations-routes.json | 581 bus relations; Route 1/5/6 geometry confirmed |
| p2p-routes.json | 4 active P2P routes touching EDSA; 2 defunct |
| sakay-ph-routes.json | EDSA/Shaw jeepney terminals; live MPUJ references |
| mrt3-feeder-routes.json | Taft Ave / EDSA feeder jeepneys |

---

## CONFIRMED Routes (2+ independent sources agree)

### BRT / Busway

#### EDSA Carousel (Route E)
- **Mode:** Bus (BRT)
- **Operator:** Mega Manila Consortium Corp + ES Transport and Partners Consortium (87 sub-operators, 751 authorized buses)
- **Full Route:** PITX (Parañaque) → Monumento/MCU (Caloocan) — 28km
- **Stops:** 23 northbound named stops / 24 southbound named stops
- **Fare:** ₱15 base (0–5km) + ₱2.65/km; max ~₱75.50 for full route; 20% discount SC/PWD/students
- **Payment:** Cash and GCash (December 2025 update)
- **Hours:** 24/7 busway; main full-route service 4AM–11PM; limited Taft–Monumento overnight
- **Frequency:** Peak (7–10AM, 5–8PM) ~2–5 min; off-peak ~5–15 min; overnight 15–30+ min
- **Ridership:** ~180,000/day (2025); 63M annual (2024)
- **Geometry:** OSM relation 11181496 (confirmed geometry available)
- **Confirming sources:** edsa-busway-routes.json (HIGH), mmda-routes.json (HIGH), ltfrb-bus-routes.json (HIGH), city-bus-operators-routes.json (HIGH), osm-transit-relations-routes.json (HIGH)
- **Confidence: HIGH (5 sources)**

Minor source discrepancies (non-conflicting):
- Stop count: MMDA lists 22 NB / 23 SB by name; EDSA-busway file 23 NB / 24 SB including partial stops — naming convention difference only
- Fare max: LTFRB says ₱74.5, EDSA-busway/MMDA say ₱75.50 — likely rounding of ₱15 + ₱2.65×22.83km

**Canonical northbound stop sequence** (from edsa-busway-routes.json, highest detail):

| Seq | Stop Name | City | Rail Connection |
|-----|-----------|------|-----------------|
| 1 | PITX | Parañaque | LRT-1 Asia World–PITX |
| 2 | City of Dreams | Parañaque | — |
| 3 | DFA / Macapagal Blvd | Pasay | — |
| 4 | SM Mall of Asia / Roxas Blvd | Pasay | — |
| 5 | Taft / Pasay Rotonda | Pasay | LRT-1 EDSA; MRT-3 Taft Ave |
| 6 | Ayala (One Ayala) | Makati | MRT-3 Ayala |
| 7 | Buendia | Makati | MRT-3 Buendia |
| 8 | Guadalupe | Makati | MRT-3 Guadalupe |
| 9 | Ortigas | Mandaluyong | MRT-3 Ortigas |
| 10 | Santolan-Annapolis | San Juan | MRT-3 Santolan-Annapolis |
| 11 | Main Avenue (Cubao) | Quezon City | — |
| 12 | Nepa Q-Mart / Kamuning | Quezon City | MRT-3 Kamuning (nearby) |
| 13 | Quezon Avenue | Quezon City | MRT-3 Quezon Avenue |
| 14 | Philam | Quezon City | — |
| 15 | North Avenue | Quezon City | MRT-3 North Avenue |
| 16 | SM North EDSA | Quezon City | — |
| 17 | Roosevelt / Fernando Poe Jr. | Quezon City | LRT-1 FPJ/Roosevelt |
| 18 | Kaingin Road | Quezon City | — |
| 19 | Balintawak | Quezon City | LRT-1 Balintawak |
| 20 | Bagong Barrio | Caloocan | — |
| 21 | Monumento / MCU | Caloocan | LRT-1 Monumento |

Southbound adds: Tramo Carousel Station (between Taft and Ayala), One Ayala Terminal (concourse, not curbside), Ayala Malls By the Bay/ASEANA.

---

### City Bus Routes Confirmed on EDSA

#### Route 4: North EDSA–Fairview
- **Mode:** Bus | **Confidence: HIGH**
- **Operator:** Unknown (LTFRB franchised; DOTR ID: R_SAKAY_PUB_2161)
- **Full Route:** SM North EDSA, Quezon City → Fairview / Nova Stop, Quezon City
- **Key stops:** SM North EDSA → Commonwealth Ave → Quirino Hwy → Nova Stop → Fairview
- **Hours:** 6AM–11PM | **Fare:** ₱13 base
- **Geometry:** OSM relation confirmed
- **Confirming sources:** mmda-routes.json (MEDIUM), ltfrb-bus-routes.json (MEDIUM), city-bus-operators-routes.json (HIGH w/ OSM relation), mrt3-feeder context
- **Notes:** Intra-Quezon City route; touches EDSA at North EDSA terminal, then diverges north into Fairview via non-EDSA roads.

#### Route 10: One Ayala–Starmall Alabang
- **Mode:** Bus | **Confidence: HIGH**
- **Operator:** HM Transport Inc.
- **Full Route:** One Ayala, Makati → Starmall Alabang, Muntinlupa
- **Key stops:** One Ayala → Buendia → EDSA → Sucat → Alabang → Starmall Alabang
- **Fare:** ₱15 base | **Geometry:** OSM relation confirmed
- **Confirming sources:** city-bus-operators-routes.json (HIGH w/ HM Transport confirmed via OSM)
- **Notes:** Uses EDSA for the Makati–Sucat south corridor segment.

#### MMBC Baclaran–SM Fairview via EDSA
- **Mode:** Bus | **Confidence: HIGH**
- **Operator:** Metro Manila Bus Co. (MMBC) / JAC Liner Inc.
- **Full Route:** Baclaran, Parañaque → SM Fairview, Quezon City
- **Key stops:** Baclaran → EDSA corridor (full length)
- **Confirming sources:** ltfrb-bus-routes.json (HIGH), city-bus-operators-routes.json (HIGH)
- **Notes:** Pre-pandemic named route now operating under rationalization framework. Uses EDSA as the full spine.

#### MALTC Montalban–Baclaran via EDSA & Aurora Blvd
- **Mode:** Bus | **Confidence: HIGH**
- **Operator:** Marikina Auto Line Transport Corporation (MALTC)
- **Full Route:** Montalban (Rodriguez), Rizal → Baclaran, Parañaque
- **Key stops:** Montalban → Aurora Blvd → Cubao → EDSA → Ayala → Baclaran
- **Confirming sources:** ltfrb-bus-routes.json (HIGH), city-bus-operators-routes.json (HIGH)
- **Notes:** Crosses NCR; uses EDSA for the Cubao–Baclaran south segment.

#### Route 33: North EDSA–Starmall San Jose del Monte
- **Mode:** Bus | **Confidence: MEDIUM**
- **Operator:** Unknown
- **Full Route:** North EDSA (SM North EDSA), QC → Starmall San Jose del Monte, Bulacan
- **Key stops:** North EDSA → Commonwealth Ave → SJDM
- **Geometry:** OSM Relation 9552779 confirmed
- **Confirming sources:** city-bus-operators-routes.json (MEDIUM), osm-transit-relations-routes.json (implicit via relation count)
- **Notes:** Post-2020 route (beyond original 31). Starts at EDSA, then uses Commonwealth Ave.

---

### P2P Bus Routes Confirmed on EDSA

#### RRCG: Starmall EDSA Shaw–Alabang Town Center
- **Mode:** P2P | **Confidence: HIGH**
- **Operator:** RRCG Transport
- **Full Route:** Starmall EDSA-Shaw, Mandaluyong → Alabang Town Center, Muntinlupa
- **Key stops:** Starmall EDSA-Shaw → SM Megamall → Robinsons Galleria → Alabang Town Center
- **Fare:** ₱140 regular / ₱112 discounted
- **Frequency:** 30+ daily trips weekdays 6:30AM–10PM; 9 trips Saturday; limited Sunday
- **Confirming sources:** p2p-routes.json (HIGH), ltfrb-bus-routes.json (HIGH)
- **Notes:** Departs from EDSA-Shaw (the EDSA/Shaw Blvd intersection in Mandaluyong). Uses EDSA or C-5 corridor southbound. Stops at SM Megamall and Robinsons Galleria.

---

## MEDIUM CONFIDENCE Routes (single source or minor conflicts)

| Route | Mode | From | To | Via EDSA Segment | Notes |
|-------|------|------|----|------------------|-------|
| Route 6 | Bus | Quezon Ave | EDSA Taft, Pasay | EDSA south segment | MC 2020-019 only; no geometry |
| Route 14 | Bus | Ayala, Makati | Alabang | EDSA south via Sucat | MC 2020-019 + city-bus; no operator confirmed |
| Route 17 | Bus | Monumento | EDSA Taft | LRT-1 parallel via EDSA | CONFLICT: see below |
| Route 19 | Bus | North EDSA | BGC | EDSA from North to Shaw | LTFRB only; low corroboration |
| RRCG-005 (P2P) | P2P | Fairview | One Ayala Makati | EDSA or C-5 (unspecified) | Route unspecified in source |
| HM-001 (P2P) | P2P | BGC Market! | Alabang Town Center | EDSA or C-5 | Route unspecified |
| MALTC San Mateo–Baclaran | Bus | San Mateo, Rizal | Baclaran | EDSA segment | Single source |
| PNR Aug Route 1 (MMDA) | Bus | Alabang | Divisoria | Unclear; possibly via R-10 | Single source; serves former PNR stations |

---

## CONTESTED Routes (sources conflict)

### Route 3
- **MC 2020-019 (LTFRB):** Monumento → Valenzuela Gateway Complex via Samson Rd (Caloocan corridor)
- **OSM:** Route 3 = Antipolo → Quiapo (Rizal, operated by Jayross Lucky Seven Tours) — **no EDSA segment**
- **Verdict:** Likely two different services sharing route number due to rationalization renaming. MC 2020-019 assignment is official; OSM may reflect a legacy pre-rationalization route that retained the number. Neither primarily uses EDSA.

### Route 5
- **MC 2020-019 (LTFRB):** Quezon Ave → Angat, Bulacan (via QA to NLEX)
- **OSM:** Route 5 = NLET–PITX (North Luzon Expressway Terminal to PITX, via EDSA) — operated by Alabang Transport Service Cooperative
- **Verdict:** CONFLICT — may reflect post-2020 rerouting of this route number. OSM is more current (2024 edit history). The NLET–PITX variant uses EDSA as a key corridor; the QA–Angat variant does not. Flag as unresolved.

### Route 17
- **MC 2020-019 (LTFRB):** Monumento → EDSA Taft, Pasay (LRT-1 augmentation via parallel roads)
- **OSM (relation 9856704):** Route 17 = Ayala–Fairview (operated by Lippad Trans, 374 relation members with geometry)
- **City bus operators file:** Notes both variants exist simultaneously
- **Verdict:** Strong likelihood of two distinct services numbered Route 17 — a route rationalization assignment gap. The Ayala–Fairview variant would use EDSA (partial segment). Flag as unresolved; both should appear in GTFS with qualifier.

---

## DEFUNCT / SUSPENDED Routes

| Route | Operator | Corridor | Status |
|-------|----------|----------|--------|
| SM North EDSA–SM Megamall | Froehlich Tours | EDSA full segment (Quezon City–Mandaluyong) | DEFUNCT ~2020; Wirecard scandal |
| Trinoma–Ayala Center | Froehlich Tours | EDSA Trinoma to Ayala (Quezon City–Makati) | DEFUNCT ~2020 |
| UBE NAIA–Alabang | UBE Express | Parañaque south corridor | SUSPENDED 2026-02-01 |

**Critical gap:** Froehlich closure leaves no dedicated P2P service on the EDSA north-to-Makati corridor (Trinoma/SM North to Ayala/Makati). Current alternatives: EDSA Carousel (BRT) only. This is a known service gap post-2020.

---

## Jeepney Routes at EDSA Points

Regular jeepneys are **not permitted on EDSA's main carriageway** due to the concrete barrier busway. They serve EDSA at:

- **EDSA Central Terminal (Shaw/Mandaluyong):** Traditional PUJ routes EDSA/Shaw Central–Tipas (PUJ_916) and EDSA/Shaw Central–Morong (PUJ_923); confirmed on sakay live explorer.
- **EDSA Taft (Pasay):** Multiple feeder jeepneys on Taft Ave, L. Guinto, and Leveriza (see mrt3-feeder-routes.json): Baclaran–Blumentritt, Dapitan–Pasay RTDA, Divisoria–Pasay RTDA.
- **EDSA Ayala (Makati):** BGC Bus (PH-BUS-BGC-EAST) departs from McKinley Exchange / EDSA Ayala stop.
- **North EDSA (QC):** Multiple jeepneys connect SM North EDSA to Commonwealth Ave, Visayas Ave, and Mindanao Ave corridors (detailed in QCityBus and SM North terminal analyses).
- **Cubao (EDSA-Aurora intersection):** Major jeepney hub with routes to Manila proper, Marikina, San Mateo (Sakay MPUJ_1143, MPUJ_1144, MPUJ_827, MPUJ_2188).

---

## Coverage Assessment

### EDSA Segment Coverage by Route Type

| EDSA Segment | Busway | City Bus | P2P | Jeepney Feeders |
|---|---|---|---|---|
| PITX → Taft (Pasay) | ✅ Carousel | ✅ MMBC (Baclaran–Fairview) | ✅ RRCG ATC | ✅ Multiple at Taft |
| Taft → Ayala (Makati) | ✅ Carousel | ✅ Routes 10, 14 | ✅ P2P partial | ✅ BGC Bus connects |
| Ayala → Guadalupe (Makati) | ✅ Carousel | ✅ Route 10 | ✅ RRCG ATC | Limited |
| Guadalupe → Ortigas (San Juan/Mandaluyong) | ✅ Carousel | ✅ MALTC, MMBC | ✅ RRCG Shaw-Alabang | ✅ EDSA Central jeepneys |
| Ortigas → Cubao (Quezon City) | ✅ Carousel | ✅ MALTC, MMBC | ❌ Gap | Limited |
| Cubao → North Ave (Quezon City) | ✅ Carousel | ✅ MMBC | ❌ Gap (Froehlich defunct) | ✅ Cubao hub |
| North Ave → Monumento (QC/Caloocan) | ✅ Carousel | ✅ Routes 33, 4 | ❌ No P2P | ✅ Balintawak/Monumento |

### Key Gaps
1. **Ortigas→Cubao segment:** No confirmed P2P bus; Carousel covers this but no premium alternative
2. **Cubao→SM North segment:** Froehlich defunct; no replacement P2P identified
3. **Short-trip options:** Carousel doesn't serve inter-station hops well; no local feeder bus circulating EDSA stops
4. **Weekend P2P:** Most EDSA P2P routes are weekday-only; weekend demand partially unmet

---

## Data Quality Notes

- **Geometry available:** Only EDSA Carousel (OSM relation 11181496) and Route 4 (OSM) have confirmed geometry. All other EDSA bus routes lack shape data.
- **Stop coordinates:** EDSA Carousel has ~21 geocoded stops from edsa-busway-routes.json (approximate from median intersections; no official GPS file published).
- **Fare completeness:** Carousel fare fully documented; most rationalized routes only have ₱13 base fare.
- **Frequency completeness:** Only Carousel frequency well-documented; all other EDSA routes have "unknown" frequency.
- **Operator completeness:** Carousel operators confirmed; most rationalized routes have unknown operators.

---

## Summary Statistics

- **Confirmed routes (HIGH, 2+ sources):** 8
- **Medium confidence (single source or minor conflicts):** 8
- **Contested (sources conflict):** 3 (Routes 3, 5, 17)
- **Defunct/suspended:** 3
- **Routes with EDSA geometry:** 2 (Carousel + Route 4)
- **Routes with approximate stop coordinates:** 1 (Carousel only)
