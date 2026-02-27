# Other Academic Papers — Analysis

**Aspect**: Other academic papers — Google Scholar search for "Metro Manila jeepney routes" and "Metro Manila bus routes"
**Wave**: 1 (Data Source Research)
**Retrieved**: 2026-02-27
**Verdict**: MEDIUM VALUE — several papers yield unique aggregate statistics not captured in prior aspects; no paper publishes a GTFS-extractable route database; most operationally significant source is the EASTS 2015 passenger demand study (677 PUJ routes, 82 PUB routes, route length statistics)

---

## Scope

This aspect covers academic papers **not already analyzed** in the `dlsu-ateneo-ust-research.md` or `up-ncts.md` aspects. It covers:
- Papers from other institutions (non-DLSU/Ateneo/UST/UP-NCTS)
- Policy/transport journals (ScienceDirect, ResearchGate, EASTS, etc.)
- Think-tank and NGO research reports with academic-grade methodology
- Aggregated Google Scholar results for Metro Manila jeepney/bus keywords

---

## Key Papers Found

### 1. "Some Observations of PUV Routes in Metro Manila Based on LTFRB Records" (2006)
- **Authors**: Unknown (likely LTFRB-affiliated researcher — paper appears in ResearchGate pre-2010 transport literature)
- **Publication**: ResearchGate (pre-journal technical report)
- **URL**: https://www.researchgate.net/publication/353071762_SOME_OBSERVATIONS_OF_THE_PUBLIC_UTILITY_VEHICLE_PUV_ROUTES_IN_METRO_MANILA_BASED_ON_LTFRB_RECORDS
- **Dataset**: LTFRB official franchise records as of **May 2006**
- **Route counts**:
  - **820 PUJ routes** with existing franchises
  - **60 PUB routes** with existing franchises
  - 3 of 60 PUB routes confirmed NOT operating at time of study
  - No route survey conducted to validate which of 820 PUJ routes were active
- **Key findings**:
  - Route names copied verbatim from LTFRB Board Decision at time of franchise approval — inconsistent formatting required "cleansing"
  - Study investigated "duplicate routes" (parallel routes serving same corridor) as input to rationalization
  - Variables analyzed: route length, geographic characteristics of route endpoints
  - No geometry published; no stop lists; no fare data
- **GTFS value**: LOW for direct extraction (2006 data, pre-modernization); HIGH as historical baseline for identifying routes that may still exist
- **Confidence**: HIGH for aggregate count; LOW for individual route validity (2006 data)

---

### 2. "Understanding Passenger Demand Across Metro Manila" (EASTS 2015)
- **Authors**: Unspecified (EASTS Conference Vol. 10)
- **Publication**: Eastern Asia Society for Transportation Studies, Proceedings Vol. 10 (2015)
- **URL**: https://easts.info/on-line/proceedings/vol10/pdf/1427.pdf
- **Dataset**: Survey-based OD demand study (data from MUCEP 2012–2015 era)
- **Critical route statistics**:

  | Metric | PUJ (Jeepney) | PUB (Bus) |
  |--------|--------------|-----------|
  | Route count | **677** | **82** |
  | Average route length | **10.9 km** | **36.7 km** |
  | Min route length | ~1 km (Ortigas–Robinsons Galleria) | — |
  | Max route length | ~47 km (Jala Jala–Cainta) | — |
  | Total network distance (one direction) | **7,347 km** | — |
  | Daily ridership | **~8.96M passengers** | — |

- **Ridership distribution**: 65% of all PUJ passengers (5.824M) carried on just 20% of PUJ routes; top 3% of routes carry 20% of passengers
- **Key context**: "Metro Manila has four urban rail systems (LRT-1, LRT-2, MRT-3, PNR). Road-based transit dominated by PUB, PUJ, and AUV (Asian Utility Vehicles)"
- **Geographic insight**: "Despite emergence of Makati, Ortigas, Fort Bonifacio, Manila City still attracts HIGH proportion of public transport journeys" — suggests Manila-CBD routes remain dominant
- **Modal share** (from same period): Jeepney 36.3% of public transport modal share; Bus 14.4%; Rail 11.2%
- **GTFS value**: MEDIUM — route count and length statistics useful for validating Wave 2 compilation; no route names or geometry published
- **Confidence**: HIGH (survey-based, published academic methodology)

---

### 3. "Metro Manila's Transport Chaos" — IBON Foundation (2024)
- **Authors**: IBON Foundation Research Team
- **Publication**: IBON Transport Series No. 1 (April 2024)
- **URL**: https://www.ibon.org/wp-content/uploads/2024/04/ts1-mmtc.pdf
- **Fleet statistics (Greater Capital Region, ~2024)**:
  - **~55,000 jeepneys** (traditional + modern combined)
  - **~5,000 intracity buses**
  - **6,483 UV Express units**
  - Other modes: school buses, AUVs, tricycles
- **COVID collapse (2019→2021)**:
  - Jeepney units: **↓46%** (removed from road)
  - UV Express units: **↓64%**
  - Motorcycle traffic: ↑ from 1M to 1.4M vehicles
- **Service Contracting Program (SCP)**:
  - Launched Oct 2020 (peak lockdown)
  - Funded from GAA 2021 + 2022
  - Paid per maximum trips/week (not per passenger)
  - No route data published in SCP documentation
- **Data quality critique**: "Latest available transport statistics from JICA MMUTIS (1999), MUCEP (2015), Dream Plan (2014/2019), and JICA 2022 data collection survey — LTFRB reporting and consolidation of statistics remains weak"
- **Key finding for GTFS**: The JICA 2022 data collection survey on improving road-based public transportation in Metro Manila is a **significant recent source** not yet analyzed — adds as new frontier aspect
- **GTFS value**: LOW for route extraction; HIGH for fleet size validation in Wave 3 frequency estimation
- **Confidence**: HIGH (think-tank, referenced from LTFRB/DOTr official data)

---

### 4. "Formalising the Jeepney Industry in the Philippines" (ScienceDirect 2020)
- **Authors**: Multiple (policy analysis study)
- **Publication**: *Case Studies on Transport Policy*, 2020 (ScienceDirect)
- **URL**: https://www.sciencedirect.com/science/article/abs/pii/S0739885920300287
- **Content**: Qualitative/thematic analysis of PUVMP stakeholder perspectives
- **Route data**: NONE — policy/social science study only
- **GTFS value**: NONE
- **Key quote (context)**: "PUVMP is transformational large-scale initiative covering new policies for land-based public transport modes in which majority are jeepneys"

---

### 5. "Modernising the 'King of the Road': Pathways for Just Transitions for the Filipino Jeepney" (ScienceDirect 2023)
- **Authors**: Multiple
- **Publication**: *Sustainability*, November 2023 (ScienceDirect)
- **URL**: https://www.sciencedirect.com/science/article/pii/S2664328623001092
- **Content**: Stakeholder interviews on PUVMP — government agencies, private sector, civil society
- **Route data**: NONE — policy/equity analysis
- **GTFS value**: NONE
- **Key finding**: "Programme largely seen as means to phase out Filipino cultural icon, anti-poor measure, and corporate capture of public transport sector" — confirms ongoing route disruption making historical databases unreliable

---

### 6. "Reforms in Metro Manila's Bus Transport System Hastened by COVID-19" (ScienceDirect/PMC 2023)
- **Authors**: Gaspay, Sanciangco, Tiglao et al. (UP NCTS)
- **Publication**: *Research in Transportation Economics*, 2023; PMC10277182
- **URL**: https://pmc.ncbi.nlm.nih.gov/articles/PMC10277182/
- **Note**: Authors are UP NCTS researchers — this paper already partially covered in `up-ncts.md` but not fully documented
- **Route data (UNIQUE to this paper)**:
  - During GCQ lockdown, government restructured Metro Manila bus routes into **31 new bus routes**
  - EDSA Carousel = "Route E" — dedicated busway on EDSA, operated by **2 newly-consolidated bus consortia**
  - The 31 routes covered routes from Angat/Balagtas (north) to Biñan, Laguna (south) and Cavite (west)
  - Pre-pandemic: **47 routes passed through EDSA** (confirmed)
  - Post-rationalization: Routes grew from 31 → 68 by Nov 2024 as demand returned
- **GTFS value**: MEDIUM — confirms bus route restructuring history; 31-route COVID-era list is the baseline for current 68-route system

---

### 7. "JeePS: Designing a Realtime Public Transportation Tracking System" (Springer 2024)
- **Authors**: Ragunton, Pacaldo, Addawe (UP Diliman Computer Science)
- **Publication**: NiDS 2024, Lecture Notes in Networks and Systems vol. 1170, Springer
- **URL**: https://link.springer.com/chapter/10.1007/978-3-031-73344-4_35
- **Note**: Already noted in `dlsu-ateneo-ust-research.md` — documenting here for completeness
- **Route data**: Implied internal route database for GPS tracking — not published
- **System capabilities**: GPS tracking, fare matrix, route info, passenger demand system
- **GTFS value**: LOW (prototype system, no open data export)

---

### 8. "Urban Transport Profile — Metro Manila, Philippines" (Asian Transport Observatory, Dec 2024)
- **Authors**: Asian Transport Observatory (ATO)
- **Publication**: ATO Document No. 262, December 2024
- **URL**: https://asiantransportobservatory.org/documents/262/Metro_Manila_transport_sector_profile.pdf
- **Key statistics**:
  - Only **3 km of rapid transit per million people** (very low density)
  - Infrastructure "remains inadequate compared to population density"
  - Cites need for investment in expanding metro network and improving bus services
- **Route data**: None — sector profile document with high-level statistics
- **GTFS value**: LOW for route extraction; MEDIUM for infrastructure gap analysis

---

### 9. "Commuter Satisfaction in Metro Manila" (IIARI Social Sciences Review 2025)
- **Authors**: Multiple (IIARI research team)
- **Publication**: *International Review of Social Sciences Research* Vol. 5 Issue 1 (March 2025)
- **URL**: https://iiari.org/wp-content/uploads/irssr.v5.1.2572.pdf
- **Content**: Survey of post-pandemic commuter satisfaction, challenges (congestion, inconsistent loading areas), service quality
- **Route data**: NONE
- **Relevant finding**: "Inconsistent loading areas" confirms that fixed-stop GTFS stop placement remains a core challenge for jeepney routes — stop locations are variable and driver-discretionary

---

### 10. "A Study of Metro Manila's Public Transportation Sector: Implementing a Multimodal Public Transportation Route Planner" (Narboneta & Teknomo 2016)
- **Publication**: Asian Transport Studies Vol. 4, pp. 460–477
- **Note**: Documented in `dlsu-ateneo-ust-research.md` — noting here for a UNIQUE data point not captured before:
- **LTFRB raw data structure (2013 PTIS GTFS)**: Bus data contained ~**1,100 routes** (only case numbers, operator names, route names — no path geometry). Jeepney data contained in **516 individual Excel files** (each file: route name, landmark stops, distance from origin, fares) — geometry NOT included in Excel files.
- This confirms: LTFRB has stop/landmark data for jeepneys in non-geographic Excel format — 516 routes with landmark lists that could be geocoded against known POIs.

---

## Aggregate Statistics Cross-Reference

| Source | Year | PUJ Routes | PUB Routes | UV Express | Notes |
|--------|------|-----------|-----------|------------|-------|
| LTFRB records (2006 paper) | 2006 | 820 | 60 | — | Franchise records; not all active |
| EASTS demand study | 2015 | 677 | 82 | — | Survey-based; operationally verified |
| JICA MUCEP | 2015 | 676+ | 82 | — | Cross-validates EASTS |
| Pre-COVID (multiple sources) | 2019 | 900+ | 830 companies | 6,000+ units | Peak franchise count |
| COVID restart (LTFRB) | Jun 2020 | 48 modern | 35 | 118 | Drastically reduced |
| Post-consolidation (LTFRB) | Dec 2023 | ~950 total | 68 local | ~250 | UP NCTS / Congress confirmed |

**Key insight**: The 2015 EASTS study (677 routes) and the 2006 franchise study (820) differ significantly — 143 fewer operating routes by 2015, confirming natural attrition. Pre-COVID growth back to 900+ reflects informal expansion. Post-COVID rationalization shrank to 48 modern routes, then expanded to 950+ by consolidation counting.

---

## Key Data Points for GTFS Synthesis

1. **Average PUJ route length**: 10.9 km — useful for estimating trip duration and frequency
2. **Total PUJ network distance**: 7,347 km (one direction) — baseline for coverage assessment
3. **Short PUJ routes**: as short as 1 km (Ortigas–Robinsons Galleria intra-CBD)
4. **Long PUJ routes**: as long as 47 km (Jala Jala–Cainta — extends to Rizal province)
5. **PUB average length**: 36.7 km — 3× longer than PUJ; confirms bus = inter-district, jeepney = intra-district
6. **516 LTFRB Excel files**: Jeepney route data exists in landmark-based format (distance from origin, fares) — could be geocoded for Wave 3 stop estimation
7. **JICA 2022 survey**: Most recent comprehensive route data collection — must investigate as a new source

---

## Data Quality Assessment

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Route names | LOW | No new route names extracted |
| Origin/destination | LOW | Only 2 examples (Ortigas–Galleria, Jala Jala–Cainta) |
| Stop coordinates | NONE | No stop data in any paper |
| Route geometry | NONE | No geometry in any paper |
| Fleet statistics | HIGH | IBON 2024 confirms 55k jeepneys, 5k buses, 6.5k UV Express |
| Route length stats | HIGH | EASTS 2015: 10.9km avg PUJ, 36.7km avg PUB |
| Ridership | HIGH | EASTS 2015: 8.96M pax/day on PUJ |
| Recency | MEDIUM | Most useful data from 2015–2016; IBON 2024 is recent |

---

## New Frontier Aspects Discovered

1. **JICA 2022 data collection survey on improving road-based public transportation in Metro Manila** — the most recent comprehensive official route survey; not yet analyzed; add as Wave 1 aspect under Academic & International Organization Studies

---

## Sources

- [ResearchGate — Some Observations of PUV Routes in Metro Manila](https://www.researchgate.net/publication/353071762_SOME_OBSERVATIONS_OF_THE_PUBLIC_UTILITY_VEHICLE_PUV_ROUTES_IN_METRO_MANILA_BASED_ON_LTFRB_RECORDS)
- [EASTS 2015 — Understanding Passenger Demand Across Metro Manila](https://easts.info/on-line/proceedings/vol10/pdf/1427.pdf)
- [IBON Foundation — Metro Manila's Transport Chaos (2024 PDF)](https://www.ibon.org/wp-content/uploads/2024/04/ts1-mmtc.pdf)
- [ScienceDirect — Formalising the Jeepney Industry (2020)](https://www.sciencedirect.com/science/article/abs/pii/S0739885920300287)
- [ScienceDirect — Modernising the King of the Road (2023)](https://www.sciencedirect.com/science/article/pii/S2664328623001092)
- [PMC — EDSA Busway Reform (Gaspay et al 2023)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10277182/)
- [Springer — JeePS Real-Time Transit Tracking (2024)](https://link.springer.com/chapter/10.1007/978-3-031-73344-4_35)
- [Asian Transport Observatory — Metro Manila Urban Transport Profile (Dec 2024)](https://asiantransportobservatory.org/documents/262/Metro_Manila_transport_sector_profile.pdf)
- [IIARI — Commuter Satisfaction Review (2025)](https://iiari.org/wp-content/uploads/irssr.v5.1.2572.pdf)
- [ResearchGate — Multimodal Route Planner Study (Narboneta & Teknomo 2016)](https://www.researchgate.net/publication/317646479_A_Study_of_Metro_Manila's_Public_Transportation_Sector_Implementing_a_Multimodal_Public_Transportation_Route_Planner)
