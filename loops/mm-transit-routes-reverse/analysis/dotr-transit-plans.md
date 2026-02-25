# DOTr (Department of Transportation) — Transit Plans & Modernization Data

**Aspect**: DOTr (Department of Transportation) — published transit plans, route maps, modernization data
**Retrieved**: 2026-02-25
**Sources**: DOTr official website (blocked 403), Philippine News Agency, GMA News, Wikipedia, MMDA press releases, PMC research database, TUMI Datahub, SafeTravelPH, web searches

---

## Summary

The DOTr is the **policy and planning authority** for public transportation in the Philippines. It does not directly franchise routes (that is LTFRB's role), but it commissions route rationalization studies, launches transit programs, and operates the EDSA Busway infrastructure. DOTr does **not publish structured route data or a GTFS feed** — its website returns HTTP 403. Structured route data flows downstream to LTFRB memorandum circulars.

Key DOTr data value: program documents and commissioned studies that establish the approved route network.

---

## Data Availability Assessment

| Resource | Access | Data Quality |
|----------|--------|-------------|
| dotr.gov.ph website | **Blocked (HTTP 403)** | N/A |
| DOTr Memorandum Circulars | Available via dotr.gov.ph/memorandum-circulars/ (blocked) | N/A — would contain planning documents |
| TUMI Datahub Manila GTFS | Partial timeout on access | DOTr-affiliated dataset — needs investigation |
| Press releases / PNA/PIA | Accessible | Low route specificity, policy-level |
| Philippine Social Science Data Portal | Accessible | Transport statistics, not route geometry |
| LTFRB FOI portal (DOTr-supervised) | Accessible | Most specific data source downstream |

**Assessment**: DOTr's direct data contribution is low for our purposes. Route-level data is held by LTFRB. However, DOTr-commissioned studies (MUCEP) and DOTr-operated systems (EDSA Busway) contain useful route network data.

---

## Key Programs & Their Route Data Implications

### 1. Metro Manila Bus Rationalization Program (June 2020)

Launched by DOTr in coordination with LTFRB as a COVID-era overhaul of Manila's bus network. Pre-pandemic Manila had 830+ bus franchises and 900+ routes with severe overlap. The rationalization collapsed this to **31 initial routes** via LTFRB MC 2020-019.

**Route data implications**:
- Established the numbered bus route system still in use today (Route 1, Route 2, etc.)
- Replaced geographic chaos with structured network
- Route details are captured in LTFRB memorandum circulars (analyzed in `ltfrb-bus-franchise-database.md`)

### 2. EDSA Busway / EDSA Carousel (Ongoing DOTr Operation)

DOTr owns and manages the EDSA Busway infrastructure. The EDSA Carousel is operated by private bus companies franchised by LTFRB but over DOTr's dedicated corridor.

**Route specifics**:
- **Corridor**: EDSA (C-4 Road), innermost median lane, concrete barrier-separated
- **Total length**: ~28 km
- **Terminal north**: Monumento (MCU), Caloocan
- **Terminal south**: PITX (Parañaque Integrated Terminal Exchange), Parañaque
- **Mixed-traffic sections**: One Ayala → Tramo (southbound), Roxas Blvd → MOA (southbound), MOA → PITX (southbound), PITX → Roxas Blvd (northbound), Taft → Ayala (northbound)
- **Active stations (24 as of March 13, 2025)**:
  - PITX, SM MOA, Heritage Hotel/Roxas Blvd, Tramo, MRT Taft/Pasay Rotonda, Ayala (One Ayala SB median NB), Buendia, Guadalupe, Shaw, Ortigas, Santolan, Nepa Q-Mart/Kamuning, Main Ave/Cubao, Quezon Avenue, EDSA-Philam (new 2024), North Avenue/Trinoma, Roosevelt, Muñoz, Balintawak/Cloverleaf, Bagong Barrio, MCU/Monumento
- **Ridership**: 177,000 passengers/day (2024 avg); 63M annual (2024); 66.7M annual (2025)
- **Operators**: 87 operators, 751 authorized buses
- **Fare**: ₱15 base (first 5 km) + ₱2.65/km; max ₱75.50 end-to-end; 20% discount SC/PWD/students
- **Hours**: PITX–Monumento 04:00–23:00; Taft–MCU 24 hrs; limited overnight midnight–04:00
- **Smart Traffic Surveillance**: 166 CCTV cameras (21 AI-enabled) along full route

**2024 infrastructure updates**: New Philam and Kamuning stations inaugurated July 2024; enhanced stations at Guadalupe, Santolan, Balintawak, Bagong Barrio, Monumento, Ayala, Buendia, Kaingin, Nepa Q-Mart, Quezon Avenue, Roosevelt, Roxas Blvd, Tramo; SM North EDSA busway concourse (first of three concourse projects).

**Planned changes**: DOTr studying privatization of operations and maintenance (on hold pending station rehab). DOTr/ADB feasibility study underway for España Blvd and Quezon Ave busways.

### 3. PUV Modernization Program (PUVMP) / PTMP Route Rationalization

DOTr issued **Department Order 2017-011** (Omnibus Franchising Guidelines) launching the PUVMP. Now in Route Rationalization phase (as of May 2024).

**Route data implications**:
- DOTr commissioned the **MUCEP Route Rationalization Study** for Greater Manila Area (NCR + Bulacan, Laguna, Cavite, Rizal provinces)
- Study awarded to Transport and Traffic Planners Inc (TTPI)
- **Status as of 2023: Not yet completed** — a key gap
- LGUs required to create Local Public Transport Route Plans (LPTRPs); only 9.82% of Philippines' 1,600 LGUs have completed these
- DOTr targets 50% of jeepney routes rationalized by end of 2025, 100% by end of 2026

**Key consolidation data (NCR)**:
- Only 40% of NCR transport operators consolidated
- Only 28.8% of NCR routes operated by consolidated entities
- NCR had 580 modern units as of 2020 (highest nationally)
- Nationwide: 74.32% of 9,522 routes consolidated; 2,445 routes unconsolidated

### 4. New Routes from MC 2022-083 (DOTr-directed route openings)

Six new routes approved December 26, 2022, in response to passenger demand identified through DOTr/LTFRB monitoring:

| Route | From | To | Via |
|-------|------|----|-----|
| New 1 | Antipolo | McKinley Hill | C-5 / FVR Road |
| New 2 | Antipolo | McKinley Hill | C-6 |
| New 3 | McKinley Hill | Southwoods Mall Transport Terminal | — |
| New 4 | Ayala | Southwoods Mall Transport Terminal | — |
| New 5 | Alabang (SST) | Naic | Governor's Drive |
| New 6 | Cubao | Dasmariñas | Governor's Drive |

These are open-application routes (any consolidated operator with new units can apply).

### 5. PNR Augmentation Routes (2023)

In June 2023, DOTr/LTFRB announced new bus routes to serve passengers displaced by PNR suspension ahead of NSCR construction:
- **Alabang–Divisoria** (formerly served by PNR)
- **FTI–Divisoria** (formerly served by PNR)

These are documented in OSM and the LTFRB bus database.

### 6. Rail Infrastructure Pipeline (Route Network Implications)

These future rail lines will generate significant new feeder route demand:

| Project | Route | Length | Status |
|---------|-------|--------|--------|
| MRT-7 | San Jose del Monte, Bulacan → North Triangle (QC) | 22 km, 14 stations | Under construction, 2027 target |
| MRT-4 | Ortigas → Taytay, Rizal | ~10 stations | Construction 2026 |
| Metro Manila Subway | North Ave → NAIA | 36 km | Partial ops target 2025–2026 |
| NSCR | Clark, Pampanga → Calamba, Laguna | — | Under construction |
| LRT-1 Cavite Extension | FPJ → Bacoor | — | Under construction |

---

## TUMI Datahub Manila GTFS

A Manila GTFS dataset exists on the TUMI Datahub (hub.tumidata.org/dataset/gtfs-manila), produced under collaboration of:
- Manila Light Rail Transit Authority (LRTA)
- LTFRB
- Manila Metro Rail Transit Corporation (MRTC)
- MARINA
- Philippine National Railways (PNR)
- Fort Bus

**Status**: Access timed out during this session. This is a priority source for Wave 1 investigation — contains validated GTFS for rail + possibly bus routes. Should be added as a separate Wave 1 aspect.

---

## Published Route Data from DOTr-Affiliated Releases

From OSM Wiki (Metro Manila/Bus routes) and phbus.com aggregations of official data:

- **64 bus routes** mapped in OSM as of early 2026
- Operators include: **Mega Manila Consortium**, **Metro Link Group**, QCityBus (Quezon City LGU), Global Electric Transport (Love Bus)
- DOTr-contracted specialized services:
  - **BGC Bus**: 4 routes (Central, Arca South Express, Ayala Ave Express, East Express) — see also BGC Bus aspect
  - **QCityBus**: 8 free routes within Quezon City (Cubao, Litex, Quirino Highway corridors)
  - **Love Bus**: 2 free electric routes (VGC-Batasan, VGC-Fairview)

---

## Key Gaps Identified

1. **DOTr MUCEP Route Rationalization Study** not yet completed — when published, will be the most comprehensive official route plan for Metro Manila. Monitor at dotr.gov.ph.
2. **DOTr/LTFRB franchise database** not accessible online — requires eFOI to LTFRB-NCR.
3. **TUMI Datahub GTFS** not accessed — high priority for next investigation.
4. **España/Quezon Ave busway** routes do not yet exist (feasibility study phase).
5. DOTr does not publish a GTFS or structured open data portal for road-based transit.

---

## Data Quality Assessment

- **Overall DOTr data quality**: Low (website blocked, no open data portal)
- **Most useful DOTr-related sources**: LTFRB MCs (downstream of DOTr policy), TUMI GTFS dataset, Wikipedia bus route list, MMDA press releases
- **Uniquely DOTr data**: EDSA Carousel infrastructure specs, MUCEP study progress, modernization program statistics
- **For route building**: DOTr policy sets the framework, LTFRB has the actual route records

---

## Newly Identified Data Sources

The following sources were discovered and should be added to the frontier:

1. **TUMI Datahub Manila GTFS** — DOTr-affiliated GTFS dataset (timed out, needs retry)
2. **SafeTravelPH crowdsourcing** — mobile app collecting bus operational data on EDSA Carousel and other routes; published research papers with GPS stop coordinates
