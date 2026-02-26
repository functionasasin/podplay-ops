# Asian Development Bank — Manila Public Transport Projects

**Source type**: International Development Organization
**Retrieved**: 2026-02-26
**Coverage**: Aggregate statistics, policy reform context, and rail corridor data; no route-level database

---

## Summary

The Asian Development Bank is Metro Manila's largest multilateral infrastructure financier but is **not a route data source**. ADB funds capital projects (rail lines, BRT reform, fleet renewal) and produces policy studies; it does not publish route names, stops, or schedules. Its value for GTFS work falls into two categories:

1. **Historical statistics** confirming pre-pandemic and post-rationalization route counts
2. **Rail corridor geometry** for projects ADB is financing (NSCR/SCRP, MRT-4)

The ADB Transport Sector Assessment contains the most widely-cited aggregate figures for Metro Manila's pre-pandemic transit network. Their urban transport profile (via the Asian Transport Observatory) provides the clearest single-document summary of the current state as of December 2024.

**GTFS value: LOW for direct route extraction / MEDIUM for rail corridor planning and route count cross-reference**

---

## Key Route Statistics (ADB-sourced)

### Pre-Pandemic Baseline (ADB Transport Sector Assessment, ~2012–2016 data)

| Mode | Count | Notes |
|------|-------|-------|
| Bus companies | 433 | Operating in Metro Manila |
| Bus routes | 805 | Total routes served by those companies |
| Jeepney routes (Metro Manila) | 785 | As of assessment period |
| Jeepney units (Metro Manila) | ~75,000 | Franchised units pre-pandemic |
| Bus companies with 100+ units | 7 | Highly fragmented sector |

- Most bus companies own 10+ units; most jeepney operators own 1 unit
- Source: [ADB Philippines Transport Sector Assessment](https://www.adb.org/sites/default/files/institutional-document/33700/files/philippines-transport-assessment.pdf)

### Post-Rationalization State (ADB/ATO Urban Transport Profile, December 2024)

| Mode | Count | Notes |
|------|-------|-------|
| Local bus routes | 68 | Franchised active routes as of November 2024 |
| Jeepney routes | ~950 | 555 with TSE / 395 without (see LTFRB analysis) |
| UV Express routes | ~250 | 142 consolidated / 108 unconsolidated |
| Jeepney units (Metro Manila) | ~75,000 | Still cited; unclear how many operational |
| EDSA Carousel daily riders | 180,000–390,000 | Varies by source/year cited |

- Source: [ATO Metro Manila Urban Transport Profile, December 2024](https://asiantransportobservatory.org/documents/262/Metro_Manila_transport_sector_profile.pdf) (PDF is image-encoded, not extractable)
- Metro Manila population cited: **24.4 million** (NCR + adjacent areas)
- City congestion ranking: **5th worst globally** out of 387 cities with 5M+ population

---

## ADB Projects with Transport Route Implications

### 1. Metro Manila Transport Project, Phase 1 (Project 51117-002)

- **Scope**: Improve EDSA corridor — MRT-3, buses, pedestrian facilities
- **Indicative loan**: $500 million (not yet disbursed as of 2026)
- **Route relevance**:
  - EDSA is the corridor where all rationalized bus routes converge
  - Project includes "bus stop and station infrastructure program"
  - Provincial buses to be redirected to terminal interchange facilities (reducing through-EDSA running)
  - City bus fleet renewal and performance-based franchising
  - MRT-3 capacity increase (additional rolling stock)
- **EDSA corridor data cited in project**:
  - Traffic volume: 166,000 two-way PCU/day at Guadalupe Bridge
  - Operates at/near capacity for 16+ hours/day (V/C ratio 0.8–1.1)
  - Congestion cost: ₱2.4 billion/day
  - Bus reform output: Supply-demand matching via performance-based franchising (not specific route list)
- **GTFS value**: None directly; project documents describe reform intent, not route details
- **Source**: [ADB Project 51117-002](https://www.adb.org/projects/51117-002/main)

### 2. South Commuter Railway Project (NSCR SCRP)

- **Route**: Blumentritt Station (Manila) → Calamba, Laguna
- **Length**: 54.6 km (part of the larger 163-km NSCR system)
- **Stations**: 18 stations along the corridor
- **Financing**: Up to $4.3 billion ADB multitranche (largest single infra deal in PH-ADB history)
  - Tranche 1: $1.75B (2022)
  - Tranche 2: $1.75B (2024)
  - Tranche 3: $800M (planned 2026)
- **Connections**: All existing LRT/MRT lines in Metro Manila; tunnel connection to future Metro Manila Subway
- **Travel time reduction**: Manila→Calamba from 2.5h by road to ~1h by rail
- **GTFS relevance**: This corridor will need feeder bus/jeepney route integration at 18 stations; no feeder route list published yet
- **Source**: [ADB SCRP project page](https://www.adb.org/countries/philippines/south-commuter-railway-project)

### 3. Manila Metro Rail Transit Line 4 (Project 53172-001)

- **Route**: Eastern Metro Manila (Taytay, Rizal → Ortigas/MRT-3 connection area)
- **Length**: ~13.4 km
- **Stations**: 10 stations
- **Type**: Fully elevated railway; intermodal integration with MRT-3 and Metro Manila Subway
- **Travel time**: Taytay→Ortigas from 1–3h by road to <30 min by rail
- **Feeder routes noted**: "bus feeder routes and jeepney lines" mentioned as integration requirement but not listed
- **GTFS relevance**: Will create new transfer nodes requiring Marcos Highway corridor feeder route mapping
- **Source**: [ADB MRT-4 project page](https://www.adb.org/projects/53172-001/main)

### 4. MRT-3 Rehabilitation via PPP (2024)

- **Scope**: ADB as transaction advisor for DOTr on private operator procurement for MRT-3 rehab
- **Corridor**: 17 km along EDSA, 13 stations (Taft Avenue to North Avenue)
- **GTFS relevance**: MRT-3 stations are already transfer nodes with many bus/jeepney routes; rehab will not change routes but will affect capacity/reliability
- **Source**: [ADB PPP advisory announcement](https://www.adb.org/news/adb-supports-efficient-transport-philippines-through-ppp-advisories)

---

## EDSA Busway Policy Context (ADB-Adjacent)

ADB's Metro Manila Transport Project informed the policy environment that led to the EDSA Carousel, though ADB did not directly operate the program. Key data:

- LTFRB MC 2020-019 reorganized Metro Manila bus routes into **31 rationalized routes**
- Route E (EDSA Carousel) was designated as the loop/BRT service
- Two consortia awarded Special Permits: **ES Transport and Partners Consortium** and **Mega Manila Consortium Corporation**
- Authorized fleet: 550 buses; actual deployment ~284 low-floor units at launch (51.6% of requirement)
- Travel time improvements from 2020→2022:
  - Northbound (Roxas→Monumento): 1:47:42 → 0:58:25 (-46%)
  - Southbound (Monumento→Roxas): 2:31:04 → 0:58:29 (-61%)
  - Average speed: 9–13 kph → 23–24 kph
- Ridership: 41k/day (Jun 2020) → 129k/day avg (2021) → 389,579/day avg (2022) → 180k/day (2025)
- Source: [PMC EDSA Busway Policy Study](https://pmc.ncbi.nlm.nih.gov/articles/PMC10277182/)

---

## Data Gaps and Limitations

1. **No route database published**: ADB does not maintain a GTFS feed or route list for Metro Manila
2. **PDF documents are image-encoded**: Most ADB technical annexes are scanned/image PDFs, not extractable
3. **Project 51117-002 still in preparation**: The $500M EDSA loan has not been disbursed; no route reform has been implemented under it
4. **Route rationalization incomplete**: The DOTr-commissioned route rationalization study (mentioned in ADB documents) was not completed as of 2023 (COA-flagged ₱45M contract)
5. **ATO urban profile (Dec 2024)**: Published but PDF is image-only, statistics extractable only from search snippets
6. **Rail station feeder routes**: ADB's railway projects (NSCR, MRT-4) acknowledge feeder route needs but no specific feeder route lists are documented

---

## Useful ADB-Cited Statistics for GTFS Work

| Metric | Value | Source | Year |
|--------|-------|--------|------|
| Total NCR bus routes (pre-pandemic) | 805 | ADB Transport Assessment | ~2014 |
| Total NCR jeepney routes (pre-pandemic) | 785 | ADB Transport Assessment | ~2014 |
| Active local bus routes | 68 | ATO Profile / LTFRB | Nov 2024 |
| EDSA V/C ratio | 0.8–1.1 | ADB 51117 TA | 2018 |
| EDSA peak hours at capacity | 16+ hours/day | ADB 51117 TA | 2018 |
| NSCR SCRP stations | 18 | ADB project page | 2024 |
| MRT-4 stations | 10 | ADB project page | 2024 |
| MRT-3 stations | 13 | ADB project page | 2024 |
| Metro Manila population | 24.4 million | ATO Profile | Dec 2024 |
| Global congestion rank | 5th worst | ATO Profile | Dec 2024 |

---

## Conclusion

ADB is a policy and infrastructure funder, not a route data keeper. For GTFS purposes:
- Use ADB statistics to **cross-check route counts** from other sources
- Use ADB railway project data to **define rail corridors** for NSCR and MRT-4
- Do not expect route-level bus/jeepney data from ADB publications
- The EDSA Carousel data in this analysis supplements the dedicated EDSA Busway analysis
