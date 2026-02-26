# JICA Metro Manila Transport Studies

**Source type**: Academic / International Organization
**Retrieved**: 2026-02-26
**Coverage**: Aggregate statistics and policy context; no machine-readable route database

---

## Summary

JICA has produced four major Metro Manila transport studies spanning 1996–2019. These studies are primarily policy-planning documents with embedded route surveys, not route databases. The full route lists are locked inside PDF technical reports that are binary-encoded at openjicareport.jica.go.jp and cannot be programmatically extracted. The studies are valuable for:

1. **Historical scale references** (fleet counts, route counts, franchise numbers)
2. **Corridor policy** (EDSA as designated bus-only corridor; jeepneys limited there)
3. **Rationalization context** (which routes were targeted for consolidation)
4. **OD demand data** (not publicly released but methodology documented)

**GTFS value: LOW for direct route extraction / HIGH for gap analysis context**

---

## Study 1: MMUTIS — Metro Manila Urban Transportation Integration Study (1999)

**Period**: March 1996 – March 1999
**Consortium**: ALMEC Corporation, Pacific Consultants International, Yachiyo Engineering
**Commissioning agencies**: DOTC, MMDA, DPWH, NEDA, PNP-NCR, HUDCC, UP-NCTS, EMB
**Documents**: openjicareport.jica.go.jp (SSF JR 99-036, series 11580446–11580553)

### Key Findings

- **501 routes observed** in Metro Manila at time of survey
  - LTFRB had registered **536 routes** as of July 1995 — a discrepancy of 35 routes
  - Unclear whether gap reflects colorum reduction or franchise count change
- **Jeepney fleet**: ~58,000 operators, 59,576 franchises, 89,304 units
- **Bus fleet**: ~10,000 active units, 1,016 franchises
- **Survey coverage**: Bus/Jeepney/Tricycle Terminal Surveys; Road Inventory Survey; Willingness-to-Pay Survey; Water Transport Survey; Traffic Accident Survey; UVVRP Survey
- **Chapter 20** of Technical Report No. 1 is dedicated to Jeepney Routes — contains the actual route list but is not web-extractable from the JICA PDF portal (binary-encoded)
- MMUTIS found routes financially viable only under narrow congestion conditions

### Limitations for GTFS

- 1999 data; pre-MRT-3 (opened 2000), pre-LRT-1 Extension
- Significant restructuring since then (modernization program, rationalization)
- PDF not extractable; no machine-readable route data recoverable

---

## Study 2: MUCEP — MMUTIS Update and Capacity Enhancement Project (2014–2015)

**Period**: 2014–2015
**Commissioned**: DOTC/LTFRB to TTPI (Transport Training and Planning Institute)
**Status**: NOT publicly released — COA flagged ₱45M study as uncompleted as of 2024

### Structure

- **Part 1**: Public transportation policy options
- **Part 2**: Fare-setting for city bus and jeepney
- **Part 3**: Franchise evaluation

### Key Findings

- MUCEP database updated the MMUTIS 1999 OD matrix with new traffic surveys
- Evaluated large-scale projects at macro level; did not address short-distance paratransit
- Established the MUCEP 2015 database as the baseline for subsequent studies
- Route rationalization recommendations were produced but the final report was never published (COA audit finding)

### Implications

- The ₱45M MUCEP study represents the biggest single data gap in Metro Manila transit planning
- Without it, the definitive rationalized route list does not publicly exist
- This explains why NCR has no finalized public jeepney/UV Express route plan as of 2026

---

## Study 3: Dream Plan — Roadmap for Transport Infrastructure Development (2014)

**Formal title**: Roadmap for Transport Infrastructure Development for Metro Manila and Its Surrounding Areas (Region III and Region IV-A)
**Period**: 2013–2014
**Approved**: September 2014 (President Aquino)
**Cost estimate**: $57.3 billion through 2030

### Route/Fleet Data Referenced

- **2007 survey**: 48,366 public utility jeepneys on ~600 routes nationwide; 61% serving the Greater Capital Region
- **Pre-rationalization totals**: 900+ public transport routes, 830 bus franchises, 43,000+ jeepney franchises
- **Fleet estimates**: ~5,000 intracity buses, ~55,000 jeepneys, 6,483 UVs
- The extreme deregulation (oversupply + redundant overlapping routes) was identified as the root cause of congestion

### Transport Network Recommendations Affecting Routes

- **EDSA designated bus corridor**: Jeepney services along EDSA alignment limited to a small number; bus/BRT primary
- **Feeder role for paratransit**: Buses and jeepneys recommended as feeder services to rail once rail is operational
- **Route rationalization**: Called for supply-demand rationalization, including express/limited-stop service types
- **"Ladder form" structure**: Reorienting backbone to axial north-south connectivity, bypassing central Manila bottlenecks

### Infrastructure Milestones (for context, not routes)

- ~504 km of intercity/urban expressways
- ~137 km of other roads
- ~318 km of railways (MRT-7, Metro Manila Subway, LRT-1 Extension, etc.)
- 20–30% implementation achieved as of 2024

---

## Study 4: GCR Follow-Up Survey (2019)

**Formal title**: Follow-Up Survey on Roadmap for Transport Infrastructure Development for Greater Capital Region
**Period**: March 28, 2017 – August 2019
**Consortium**: ALMEC Corporation
**Documents**: openjicareport.jica.go.jp (JR 19-003, series 1000041638)

### Updated Fleet Data

| Mode | Count (2019 estimate) |
|------|----------------------|
| Intracity buses | ~5,000 |
| Jeepneys | ~55,000 (GCR) |
| Utility vehicles (UV Express) | ~6,483 |
| Taxis | ~16,701 |
| TNVS (Grab, etc.) | ~18,813 |
| Motorcycles for hire | ~45,000 |

*Note: LTFRB weak in statistics reporting; these are estimates from earlier studies.*

### Traffic Changes Documented

- Jeepney numbers decreased **46%** from peak
- UV Express decreased **64%** (from ~72,000 to ~26,000)
- Motorcycle traffic increased from 1 million to 1.4 million
- Car traffic decreased 8.3% but still accounts for **44% of traffic**

### Policy Implications

- MUCEP database (2015) was updated with this study's traffic surveys
- Confirmed that lack of inter-agency coherence worsened congestion
- Recommended integrating PNR modernization with bus/jeepney feeder routes
- Five growth center clusters proposed to reduce central Manila bottlenecks

---

## Indirect Route Data: Third-Party Compilation

The website pdfcoffee.com hosts a document titled "Jeepney Routes in Metro Manila" (Scribd ID: 438492612) which contains **665+ numbered jeepney routes** in the format:

> Route {N}: {Origin} - {Destination} via {Key Streets}

**Sample routes extracted**:

| Route # | Origin | Destination | Via |
|---------|--------|-------------|-----|
| 1 | A. Bonifacio | A. Mabini | 10th Avenue |
| 2 | A. Bonifacio | E. Rodriguez | D. Tuazon |
| 8 | Alabang | Baclaran | Ninoy Aquino Ave. |
| 44 | Antipolo | Cubao | Marcos Highway |
| 227 | Cubao | Quiapo | Sta. Mesa, C. Palanca |
| 280 | Divisoria | Pasay RTDA | L. Guinto |
| 405 | Kawit (Cavite) | Zapote (Las Piñas) | — |
| 644 | Tagaytay City | Zapote (Las Piñas) | — |

**Assessment**: This document's origin is unclear — likely compiled from LTFRB franchise lists or MMUTIS appendices. Routes extend beyond Metro Manila into Central Luzon and CALABARZON. The numbering system does not match the T-series codes used in LTFRB's current database. Routes with large ridership are flagged in the original document. **Confidence: low** — route codes do not correspond to current LTFRB designations; likely pre-rationalization historical data.

---

## Data Quality Assessment

| Attribute | Assessment |
|-----------|------------|
| Currency | LOW — most recent study is 2019; data referenced is from 2007–2015 surveys |
| Completeness | MEDIUM — aggregate counts are reliable; route-level detail locked in PDFs |
| Accuracy | HIGH for macro statistics; unknown for specific route geometries |
| Extractability | VERY LOW — all PDFs are binary-encoded; no API; no CSV/JSON exports |
| GTFS utility | LOW direct / HIGH indirect (gap analysis, rationalization context) |

---

## Recommendations for GTFS Build

1. **Do not attempt to extract** specific routes from JICA PDFs — binary encoding prevents automated extraction and manual extraction of 501+ routes is out of scope.
2. **Use aggregate statistics** from JICA to validate completeness: the GTFS feed should approach ~500–600 jeepney routes, ~68 city bus routes, ~250 UV Express routes.
3. **Apply EDSA corridor policy**: JICA studies confirm jeepney routes along EDSA are officially limited — OSM/LTFRB data on this is correct.
4. **Note the MUCEP data vacuum**: The unreleased ₱45M study means no authoritative rationalized route list exists; build from OSM + LTFRB + community sources instead.
5. **Feeder route logic**: JICA explicitly recommends rail-feeder roles for jeepneys/buses — use this as a framework for connecting rail stations to road routes in Wave 2/3.
6. **Third-party compiled list** (665+ routes, Scribd/pdfcoffee): May contain historical route data worth cross-referencing against current T-series codes, but confidence is low without provenance.

---

## Source Documents

- MMUTIS Technical Reports: [openjicareport.jica.go.jp](https://openjicareport.jica.go.jp/pdf/11580479_01.pdf) (SSF JR 99-036)
- MMUTIS Final Report: [openjicareport.jica.go.jp](https://openjicareport.jica.go.jp/pdf/11580453_05.pdf)
- Dream Plan (2014): [openjicareport.jica.go.jp](https://openjicareport.jica.go.jp/pdf/12149654.pdf)
- GCR Follow-Up Survey (2019): [openjicareport.jica.go.jp](https://openjicareport.jica.go.jp/pdf/1000041638_01.pdf)
- Jeepney Routes compiled list: [pdfcoffee.com](https://pdfcoffee.com/jeepney-routes-in-metro-manila-pdf-free.html)
- Metro Manila Dream Plan — Wikipedia: [en.wikipedia.org/wiki/Metro_Manila_Dream_Plan](https://en.wikipedia.org/wiki/Metro_Manila_Dream_Plan)
- Transportation in Metro Manila — Wikipedia: [en.wikipedia.org/wiki/Transportation_in_Metro_Manila](https://en.wikipedia.org/wiki/Transportation_in_Metro_Manila)
