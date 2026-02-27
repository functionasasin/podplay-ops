# DLSU / Ateneo / UST Transport Research — Analysis

**Aspect**: DLSU/Ateneo/UST transport research — thesis papers on jeepney/bus routes
**Wave**: 1 (Data Source Research)
**Retrieved**: 2026-02-27
**Verdict**: LOW VALUE for direct route extraction; HIGH VALUE for methodology validation and aggregate cross-reference

---

## Summary

Research output from De La Salle University (DLSU), Ateneo de Manila University, and University of Santo Tomas (UST) covers jeepney/bus policy, demand modeling, service contracting, and route planning — but rarely publishes raw route lists or geometry. The most operationally useful finding is 6 specific jeepney route codes from Fillone et al.'s service contracting AVL study. No institution has published a GTFS-compatible route database.

---

## De La Salle University (DLSU)

### Key Researcher: Prof. Alexis M. Fillone
Professor, Civil Engineering Department; PhD in Urban and Regional Planning (UP Diliman); MSc Transportation Engineering (AIT Bangkok). Metro Manila's most prolific academic transport researcher for operational jeepney/bus data.

### Papers with Route-Level Data

#### 1. Service Contracting as COVID-19 Policy Response (2022)
- **Publication**: *Research in Transportation Business & Management* (PMC8828415)
- **Route data**: AVL data from smartphone app (Sakay Mobility Philippines Corp) collected on **6 jeepney routes** during service contracting (Nov 2020 – Jun 2021)
- **Route codes documented**:
  | Code | Operator |
  |------|----------|
  | 311 | PM Jeepney Drivers and Operators Services Inc. |
  | 414 | Saint Rose Transit |
  | T403 | San Dionisio Transport Service Cooperative |
  | 302 | A. Roces Transport Service Cooperative |
  | 201 | Taguig Transport Service Cooperative |
  | 305 | Malabon Jeepney Transport Service Cooperative (MAJETSCO) |
- **No origin-destination pairs or stop data** provided in the paper
- **Key operational finding**: Route compliance (GPS trip vs prescribed alignment) was the critical metric; non-compliant trips went unpaid

#### 2. Transforming the Public Transport Sector — Service Contracts Program Evaluation (2025)
- **Publication**: *Transportation Research Procedia* 82, pp. 890–907 (joint Ateneo/DLSU)
- **Route data**: 20 jeepney routes under service contracting — 10 gross-cost, 10 net-cost
- **Route codes**: Not individually listed in accessible abstract/excerpt
- **Key finding**: Gross-cost SC → more km-run, shorter headway, more arrivals; but mixed performance metrics
- **GTFS note**: Paper confirms DOTr digitized franchise/route alignment data into GTFS format for SC program compliance monitoring — this internal LTFRB CPUVMS dataset is NOT publicly released but confirms GTFS-format data exists in government systems

#### 3. Long-Term Service Contracts for Informal PT Reform (Case Studies on Transport Policy)
- Sunio, Mateo-Babiano, Rivera, Mariano, Fillone
- Policy framing; no route-level data

### Theses (ANiMO Repository)

| Title | Author | Year | Route Data |
|-------|--------|------|------------|
| Public Transport Demand Modeling for Metro Manila | Sean Johnlee Q. Ting | 2015 | None — aggregate MLR/ANN demand modeling |
| PUJ Demand and Supply Analysis: Baguio City | Lovely L. Rañosa | 2017 | Baguio only (irrelevant) |
| Viability of Abolishing the Boundary System in PUJs | H.A. Dimagiba | ~2019 | None — policy/legal |
| Base Fare Optimization for Traditional Jeepneys | Abellar & Timario | 2025 | None — optimization model |
| Environmental Benefits Analysis of Jeepney PM | J.S. Garcia | 2019 | None — emissions only |
| Strategic Route Planning of Truck Traffic in Metro Manila | Riches S. Bacero | 2022 | Truck routes, not PUV |

**Verdict**: No DLSU thesis yields extractable PUV route data for Metro Manila. The ANiMO repository (animorepository.dlsu.edu.ph) would require manual search for any route-specific civil engineering capstone projects.

---

## Ateneo de Manila University

### Key Researcher: Kardi Teknomo (DISCS Dept)

#### Narboneta & Teknomo (2016) — Multimodal Route Planner Study
- **Publication**: *Asian Transport Studies* Vol. 4, pp. 460–477; also JURP 2015 (UP conference)
- **Department**: Information Systems and Computer Science, School of Science and Engineering, Ateneo de Manila
- **Route data methodology**: Used LTFRB-published GTFS (the 2013 Philippine Transit App Challenge dataset) + OSM for Metro Manila. Inputted into OpenTripPlanner.
- **Key GTFS classification**: Jeepney = `BUS_MISCELLANEOUS`; Bus = `BUS_UNSCHEDULED`; LRT = `RAIL`; MRT = `URBANRAIL_METRO`; Marina = `FERRY`; PNR = `RAIL_LD`
- **Critical finding**: "Google Transit only incorporates buses, MRT, LRT1, and LRT2 — jeepneys, the main transportation mode, are NOT included"
- **No new routes added**: Used existing LTFRB GTFS dataset, already analyzed under TUMI Datahub aspect
- This paper is the foundational reference for why Manila's GTFS has a jeepney gap

#### Mode Choice Behavior — Katipunan Corridor (2005)
- **Publication**: *Eastern Asia Society for Transportation Studies* Vol. 5, pp. 1116–1131
- **Study area**: Katipunan Road corridor (Ateneo de Manila + Miriam College)
- **Route data**: None — behavioral survey only. Mode statistics: 38.7% of Metro Manila trips by jeepney, 16.6% by bus.
- **Key behavioral finding**: Most-used combination for long-distance trips = jeepney–jeepney–walk

#### Sunio et al. (2025) — Service Contracting Program Evaluation
- Joint Ateneo/DLSU paper (see DLSU section above)

#### Ateneo School of Government — Land-Based Transport Governance (2014)
- Romero S., Guillen D., Cordova L., Gatarin G.
- Policy governance study; no route data

---

## University of Santo Tomas (UST)

### Research Found
- **PUVMP Employment Impact Study** — Business Economics Department (Malasique, Rubio, Rosete), JIEMAR journal
  - Analyzes employment impact of PUV modernization
  - No route data — policy/labor economics focus
  - UST is not a transit engineering research hub; no transport engineering department equivalent to DLSU Civil Engineering

### UST Repository
- UST Miguel de Benavides Library (lib.ust.edu.ph) not fully indexed by search engines
- No transport-engineering theses surfaced in open web search

---

## Other Notable Academic Papers (Adjacent Institutions)

### Soriano, Dailisan & Lim (2024) — UP Diliman / ETH Zürich
- **Publication**: *Proceedings of the Samahang Pisika ng Pilipinas* SPP-2024-2B-05
- **Method**: Metropolis-Hastings algorithm to model OD pairs weighted by residential/commercial POIs; Dijkstra's for routing through street networks
- **Key finding**: Metro Manila PT journeys take ~5× longer than car; route lengths ~3× longer
- **GTFS value**: LOW — no route database output; analytical study only

### JeePS System (Ragunton, Pacaldo, Addawe — UP Diliman, 2024)
- **Publication**: *NiDS 2024*, Lecture Notes in Networks and Systems vol. 1170, Springer
- **System**: Web + mobile app for GPS tracking of jeepneys + passenger demand
- **Route database**: Implied but not published
- **GTFS value**: LOW — prototype app; no exported data

---

## Data Quality Assessment

| Dimension | Score |
|-----------|-------|
| Route names/IDs | LOW — only 6 codes from Fillone AVL study |
| Origin/destination pairs | NONE found |
| Stop coordinates | NONE found |
| Route geometry | NONE found |
| Fare data | NONE (separate aspect) |
| Frequency data | LOW — SC study gives headway stats but not route-level |
| Recency | MEDIUM — Fillone 2022/2025; most theses older |

---

## Key Takeaways for GTFS Synthesis

1. **6 route codes documented**: 311, 414, T403, 302, 201, 305 — these are SC-monitored routes with AVL data, but no published geometry
2. **Government has internal GTFS**: The SC program forced DOTr/LTFRB to digitize route alignment data into GTFS format for compliance monitoring — confirming the data exists in LTFRB CPUVMS but is NOT publicly released
3. **Narboneta/Teknomo pipeline confirmed**: OTP + OSM + LTFRB GTFS is a proven, published stack for Metro Manila routing (used since 2014-2016)
4. **Jeepney GTFS gap is structural**: Informality (no fixed stops, schedule deviation, no timetables) is the root cause, not just data unavailability
5. **Contact for access**: ncts.library.updiliman@up.edu.ph (UP NCTS library) may have Mega Manila PTPSS dataset; Fillone at DLSU may share SC route lists on request

---

## New Frontier Aspects Discovered
None — all relevant leads (Sakay, OSM, LTFRB, TUMI Datahub) already in frontier.

---

## Sources
- [Fillone SC study (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC8828415/)
- [Fillone 2025 SC evaluation (ScienceDirect)](https://www.sciencedirect.com/science/article/pii/S2352146524004022)
- [Narboneta & Teknomo 2016 (J-STAGE)](https://www.jstage.jst.go.jp/article/eastsats/4/2/4_460/_article)
- [DLSU ANiMO Repository](https://animorepository.dlsu.edu.ph/)
- [Ateneo Archīum (Sunio 2025)](https://archium.ateneo.edu/cgi/viewcontent.cgi?article=1438&context=discs-faculty-pubs)
- [SPP 2024 travel efficiency paper](https://proceedings.spp-online.org/article/view/SPP-2024-2B-05)
- [JeePS Springer 2024](https://link.springer.com/chapter/10.1007/978-3-031-73344-4_35)
- [UST PUVMP study (JIEMAR)](https://jiemar.org/index.php/jiemar/article/view/250)
