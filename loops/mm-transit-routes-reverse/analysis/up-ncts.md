# UP NCTS — National Center for Transportation Studies

**Source type**: Academic institution
**Retrieved**: 2026-02-27
**Direct routes extracted**: 0 new (all referenced data captured in prior aspects)
**GTFS value**: LOW for direct route extraction / HIGH for statistical cross-reference and methodology validation

---

## Overview

The **National Center for Transportation Studies (NCTS)** at the University of the Philippines Diliman is the Philippines' premier academic institution for transportation research. It is the secretariat for the **Transportation Science Society of the Philippines (TSSP)**, which holds annual conferences and publishes the *Philippine Transportation Journal*.

NCTS is a **policy analysis and methodology institution** — it does not publish open route databases. Their research references LTFRB and DOTC as the primary route data holders. The most operationally relevant NCTS output is the Mega Manila Public Transportation Planning Support System (2009–2012), which contained an updated route database but was never released publicly.

---

## Data Availability Assessment

| Resource | Accessible? | Route Data? | Notes |
|----------|-------------|-------------|-------|
| TSSP conference proceedings (PDFs) | Partially | Indirect only | PDFs are binary-encoded; text extraction fails |
| ncts.upd.edu.ph/publications_rp/ | Yes (listing) | No direct routes | Lists papers; links to compressed PDFs |
| SERP-P PIDS portal | Yes | No direct routes | Institutional catalog only |
| Mega Manila PTPSS (2012) | No | YES — but unpublished | DOTC client; not released as open data |
| DOTC PTIS GTFS (pre-2015) | Indirect | Yes | Absorbed into Sakay.ph / TUMI Datahub (already analyzed) |

---

## Key Research Projects with Route Relevance

### 1. Mega Manila Public Transportation Planning Support System (2009–2012)
- **Client**: Department of Transportation and Communications (DOTC)
- **Duration**: June 2009 – June 2012
- **Output**: Updated database of bus, jeepney, and UV Express routes for Metro Manila and surrounding cities ("Mega Manila")
- **Key statistics documented**:
  - 1,122 operators and 12,595 buses operating within/from Metro Manila
  - Average operator has franchise for ~11 buses
  - 47 routes passed through EDSA before the Carousel was established
  - Bus routes defined along main thoroughfares (EDSA); jeepneys on secondary roads
  - Route criteria: passenger demand, road hierarchy, traffic capacity, ≤13% ROI cap
- **Availability**: Report is a DOTC deliverable; not released as open data. Referenced in blog/academic sources (d0ctrine.com, CUTS-CCIER) but PDF is not publicly indexed.
- **GTFS value**: HIGH — this is the most comprehensive historical route database for Metro Manila, but it predates COVID rationalization (2020) and PUV modernization consolidation (2023–2024).

### 2. OpenTripPlanner Implementation for Metro Manila (2014–2015)
- **Authors**: Narboneta & Teknomo (UP NCTS)
- **Publications**: TSSP 2014, JURP 2015
- **Key finding**: Confirmed that GTFS + OSM data can be used to power an OpenTripPlanner routing engine for Metro Manila including jeepney routes.
- **Data source used**: DOTC Public Transit Information Service (PTIS) GTFS feed — the same dataset later released as sakayph/gtfs (already analyzed, 2020 frozen version).
- **Critical note**: Google Maps only covered buses/MRT/LRT at the time — jeepneys were not included. OpenTripPlanner was modified to handle local transport modes.
- **Current relevance**: Confirms osmtogtfs + OpenTripPlanner is a viable Wave 3 synthesis pipeline.

### 3. LPTRP Manual Development (March–April 2017)
- **Client**: Department of Transportation (DOTr)
- **Collaborators**: TSSP, NCTS, other universities
- **Output**: Local Public Transport Route Plan (LPTRP) manual — a methodology framework, not a route list
- **Key methodology facts**:
  - Fleet Size = f(Passenger Volume, Average Travel Speed, cycle time)
  - EDSA analysis found 75% oversupply of buses before rationalization
  - Metro Manila LPTRP scope: 16 cities + Pateros + MUCEP fringe areas (Bulacan, Rizal, Laguna, Cavite)
  - LPTRPs must be revised at least once every 3 years
  - As of 2024, only 139 of 1,575 LGUs had approved LPTRPs (8.8%)
- **GTFS value**: Provides methodological basis for frequency/fleet estimates in Wave 3.

### 4. EDSA Busway Policy Research (2021–2025)
- **Principal researchers**: Tiglao, Sanciangco, Tacderas, Tolentino, Gaspay
- **Publication venues**: Research in Transportation Economics (Elsevier), TSSP proceedings
- **Key papers**:
  - "Public Transport Crowdsourcing and Collaborative Governance for BRT in Transition" (EASTS 2021)
  - "Reforms in Metro Manila's bus transport system hastened by the Covid-19 pandemic: A policy capacity analysis of the EDSA busway" (RTE 2023, PMC10277182)
  - "Digitally enabled collaborative governance for sustaining bus reforms on the EDSA Busway in Metro Manila" (RTE 2025)
- **Route data**: Focused on EDSA Carousel only; does not publish stop coordinates or route lists. Data from SafeTravelPH telemetry and LTFRB policy documents.
- **Key stat**: LTFRB organized Metro Manila bus routes into 31 routes when GCQ took effect (2020); grew to 68 by Nov 2024.

### 5. Dashboard Camera-Aided UV Express Data Collection (2019)
- **Authors**: Aranas & Regidor (TSSP 2019)
- **Topic**: Passenger load profile and travel time data collection for UV Express using dashcam
- **Data**: Methodology paper, no route list published

### 6. Risk/ESG Approach to Jeepney Modernization Barriers (2025)
- **Authors**: Tacderas, Sanciangco, Tiglao
- **Topic**: Barriers to modernization and cooperative formation for Philippine jeepney sector
- **Route data**: None — policy analysis

---

## TSSP Recent Proceedings (Route-Adjacent Papers)

### TSSP 2024 (30th Annual Conference)
| Paper | Authors | Metro Manila Route Relevance |
|-------|---------|------------------------------|
| TSSP2024-13: First- and Last-Mile Options of LRT/MRT Users | Dimla, Hong, Pelias, Fillone | Uses LRT/MRT network; identifies feeder modes |
| TSSP2024-26: Mode Choice on Roxas Boulevard | Multiple | Identifies jeepney as dominant short-trip mode on Roxas Blvd |
| TSSP2024-32: Motorcycle Taxis Viability | Latonero, Kamid, Regidor | Competing informal mode; no route data |
| TSSP2024-09: Senior Citizen Mobility in QC | Lelis, De Guzman, Regidor | References QCityBus 8 routes |

### TSSP 2023
| Paper | Authors | Metro Manila Route Relevance |
|-------|---------|------------------------------|
| TSSP2023-05/Vol7-No1: EDSA Busway Telematics | Sanciangco et al | 47 pre-Carousel routes through EDSA; 533 buses/47 operators (Apr 2023) |

---

## Aggregate Route Statistics from NCTS Sources

These statistics cross-validate totals from other aspects:

| Period | Jeepney Routes | Bus Routes | UV Express Routes | P2P Routes | Source |
|--------|---------------|------------|-------------------|------------|--------|
| Pre-COVID (~2019) | 900+ routes, 43,000+ franchises | 830 bus companies | 6,500 UV Express units | ~34 | JICA/NCTS cross-ref |
| COVID restart (Jun 2020) | 48 modern PUJ routes / 865 units | 35 routes / 4,499 buses | 118 routes / 6,755 units | 34 routes / 387 buses | LTFRB/NCTS |
| Nov 2020 | +16 traditional jeepney routes / 816 units | - | - | - | LTFRB |
| Dec 2023 | ~950 routes (555 TSE / 395 not) | ~68 local routes | ~250 (142/108 consolidated) | ~20+ | LTFRB/Congress |
| Nov 2024 | ~950+ | 68 local routes | ~250 | ~20+ | TSSP 2024 context |

---

## Data Quality Assessment

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Coverage | Low | No open route database; research papers only |
| Accuracy | High | When data is published, it's cross-validated against LTFRB |
| Currency | Medium | Most papers reference 2020–2024 data |
| Extractability | Very Low | PDFs are binary-encoded; text extraction fails consistently |
| GTFS readiness | None | No GTFS output; methodology papers only |

---

## Key Conclusion

UP NCTS does **not** publish an open route database. However, it is valuable as:
1. **Statistical validator**: Cross-references LTFRB totals from multiple time periods
2. **Methodology source**: LPTRP fleet sizing, GTFS pipeline feasibility (OTP), data collection methods
3. **Policy context**: Route rationalization history, EDSA Carousel governance
4. **Data pointer**: All referenced route data traces back to LTFRB (CPUVMS) and Sakay.ph (both already analyzed)

The **Mega Manila PTPSS (2012)** is the most important unpublished dataset — a comprehensive route database across all modes that predates COVID rationalization. It would be worth a direct contact request to UP NCTS (ncts.library.updiliman@up.edu.ph) for access to this report's route appendices.

No new aspects need to be added from this source — all referenced data sources (SafeTravelPH, OSM, JICA, Sakay.ph, TUMI Datahub) have already been analyzed.

---

## Sources

- [UP NCTS Research Papers](https://ncts.upd.edu.ph/publications_rp/research-papers/)
- [UP NCTS Research Projects](https://ncts.upd.edu.ph/research/)
- [TSSP 30th Annual Conference (2024)](https://ncts.upd.edu.ph/tssp/archives/2923)
- [TSSP 31st Annual Conference (2025)](https://ncts.upd.edu.ph/tssp/archives/3229)
- [SERP-P UP NCTS Publications](https://serp-p.pids.gov.ph/institution/public/view-publication?slug=up-national-center-for-transportation-studies)
- [Gaspay et al (2023) — EDSA Busway Reform (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10277182/)
- [d0ctrine.com — Mega Manila PTPSS summary](https://d0ctrine.com/2013/01/03/rationalizing-public-transport-in-the-philippines/)
- [TSSP2023-05/Vol7-No1 Sanciangco et al](https://ncts.upd.edu.ph/tssp/wp-content/uploads/2024/07/TSSP2023-Vol7-No1_01-Sanciangco-and-Others.pdf)
- [NCTS LPTRP presentation](https://ncts.upd.edu.ph/tssp/wp-content/uploads/2021/11/Joemier-PontaweLPTRP_RTD-TSSP.pdf)
