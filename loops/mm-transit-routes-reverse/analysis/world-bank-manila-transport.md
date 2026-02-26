# World Bank Manila Transport Projects

**Source type**: International Organization / Feasibility Studies
**Retrieved**: 2026-02-26
**Coverage**: Policy/planning documents; one BRT corridor studied in depth; foundational GTFS infrastructure support; no live route database

---

## Summary

The World Bank has engaged Metro Manila transport through three distinct phases: (1) a foundational GTFS data infrastructure project (2012–2015) that seeded what became Sakay.ph and the LTFRB GTFS effort; (2) several urban transport improvement loans targeting traffic management and NMT access; and (3) the ill-fated Metro Manila BRT Line 1 project (approved 2017, cancelled ~2022). None of these projects produced a publicly accessible machine-readable route database, but the BRT project documents reveal detailed corridor geography for the España–Quezon Avenue alignment.

**GTFS value: LOW for direct route extraction / MEDIUM for corridor geometry and policy context**

---

## Project 1: World Bank GTFS/Open Data Initiative (2012–2015)

**Project focus**: Setting up Manila's first GTFS database
**Funding**: World Bank + AusAid
**Partners**: DOTC (now DOTr), ITP, UP-NCTS, OpenPlans, TranzMate
**Status**: Completed; output feeds into LTFRB CPUVMS and seeded Sakay.ph/Google Maps

### What Was Built

- A web-based interface for DOTC/LTFRB staff to enter and maintain GTFS data without programming skills
- Initial GTFS feeds for LRT-1, LRT-2, MRT-3, PNR (delivered by EACOMM to Google Maps in 2012)
- Bus/jeepney route data input workflows using GTFS standard
- Bus Management Information System (BMIS) and Central Public Utility Vehicle Monitoring System (CPUVMS) — both used GTFS heavily for route/path definition

### Significance

This initiative is the **ancestor of the current LTFRB GTFS effort** and the reason Manila has any GTFS data at all. The TUMI Datahub GTFS-Manila dataset (already analyzed) is the direct descendant. No separate dataset from this 2012–2015 phase is publicly accessible; the data was absorbed into LTFRB systems.

### Data Accessibility

- **No standalone dataset**: The World Bank blog (2012) announced the initiative but provided no download link
- The original GTFS Data Exchange repository (gtfs-data-exchange.com) has since been shut down
- Surviving artifacts: LTFRB GTFS uploads to TUMI Datahub; Sakay.ph route database (separately analyzed)

---

## Project 2: Metro Manila Urban Transport Improvement Project (MMURTRIP)

**World Bank Project ID**: Not recovered (pre-2010 era)
**Focus**: Short-term corridor improvements and LRT station access

### Key Corridors Studied

MMURTRIP prepared short-term transport improvement schemes on:
- **LRT Line 2 corridor** (Recto–Santolan)
- **EDSA corridor** (bus operations, junction improvements)
- **C-5 corridor** (capacity and operations)
- **Southern Luzon Expressway (SLE) corridor**
- **Marikina Valley area**
- **Manila Port access** (truck routing around Intramuros)

### Route Policy Relevance

- Identified EDSA as requiring bus priority treatment → contributed to eventual EDSA Busway
- Recommended NMT improvements (sidewalks, pedestrian crossings) at LRT-2 stations
- MMDA institutional capacity built through MMURTRIP → traffic signal management

### Data Accessibility

- World Bank project documents: [documents.worldbank.org](https://documents.worldbank.org/en/publication/documents-reports/documentdetail/985841468763226236/philippines-metro-manila-urban-transport-integration-project)
- No route-level data extractable from available text; environmental assessment PDFs are binary-encoded

---

## Project 3: Metro Manila BRT Line 1 (P132401) — Most Data-Rich Source

**World Bank Project ID**: P132401
**Approved**: March 2017
**Cancelled**: ~2022 (full undisbursed loan balance cancelled)
**Total cost**: $109.4 million ($64.6M World Bank + CTF, $44.8M Philippine government)
**Implementing agency**: National BRT Program Management Office (DoTr)
**Reason for cancellation**: Inexperienced implementing agency, procurement failures, COVID-19, lack of political will

### Corridor: España–Quezon Avenue (BRT Line 1)

**Length**: ~13 km
**Alignment**: Manila City Hall → España Blvd → Quezon Avenue → Philcoa (QC)
**Station count**: 16 stations planned

**Named stations (partial, from ESIA documents)**:

| Station | Location | Notes |
|---------|----------|-------|
| Philcoa | Northern terminus, near Commonwealth Ave | Quezon City |
| (unnamed) | Quezon Memorial Circle area | Transfer node |
| (unnamed) | Quezon Ave segment | — |
| Bronx | Northbound station | España area |
| Atherton | Northbound station | España area |
| Don Fabian | Northbound station | — |
| LRT Central | Southbound station | LRT-1/2 interchange area |
| Banaue | Near National Orthopedic Hospital | — |
| Manila City Hall | Southwestern terminus | Connects to LRT-1 Central |

*Note: Full 16-station list was not recoverable from web-accessible document text; BRT Line 1 was never built so no operational data exists.*

### Strategic BRT Network (Planned, Never Built)

| BRT Line | Corridor | Status |
|----------|----------|--------|
| BRT 1 | Quezon Ave – España Blvd (Manila CH to Philcoa) | Cancelled 2022 |
| BRT 2 | EDSA | Superseded by EDSA Busway Carousel |
| BRT 3 | C-5 Road | Never advanced |

### Performance Projections (for reference)

- Daily ridership target: ~300,000 commuters
- Travel time Manila City Hall → Quezon Memorial Circle: 2h → 43 min
- Fleet: 167 high-quality A/C buses
- Station infrastructure: level boarding, off-board fare payment, weather protection

### Feeder Route Implications

The ESIA explicitly states that "BRT services would be supplemented by jeepneys operating in a feeder mode" to provide lateral access. Jeepney routes overlapping the BRT corridor were designated for relocation or modification. This means:
- Jeepney routes along España Blvd and Quezon Avenue were identified as conflicting with BRT alignment
- Feeder jeepney routes to BRT stations were planned but never specified publicly

### Rail Connections at BRT Stations

| BRT Station | Rail Connection |
|-------------|----------------|
| Manila City Hall | LRT-1 (Central/United Nations stop) |
| LRT Central Station | LRT-1, LRT-2 interchange |
| Philcoa terminus | Originally planned MRT-7 terminus area |

---

## Project 4: 2012 World Bank Urban Transport Project (P088751 / Related)

**Focus**: Quality of life improvements, traffic management, NMT access to new LRT stations
**Key activities**:
- Traffic management improvements near LRT stations
- Road frontage controls, pedestrian circulation
- Street lighting and road safety
- Transfer point improvements between road-based transit and rail

### Route Policy Context

The World Bank noted that ~50,000 registered PUJs (jeepneys) and ~3,000 PUBs (city buses) carried the majority of Metro Manila public transport users at project inception. No specific routes were mapped as part of this project.

---

## Overall Data Quality Assessment

| Attribute | Assessment |
|-----------|------------|
| Currency | MEDIUM — BRT documents are 2017; cancellation confirmed ~2022; GTFS initiative predates current route network |
| Route coverage | VERY LOW — no machine-readable route list; only BRT corridor geometry is recoverable |
| Corridor geometry | MEDIUM — España–Quezon Avenue alignment well documented at policy level (not GTFS-ready) |
| Stop locations | LOW — 8/16 BRT stations partially named; coordinates not recoverable from web text |
| Extractability | VERY LOW — all PDFs binary-encoded; no API or CSV exports |
| GTFS utility | LOW direct / MEDIUM indirect (España-Quezon corridor geometry; feeder route policy framing) |

---

## Key Insights for GTFS Build

1. **BRT corridor = existing jeepney/bus corridor**: The España–Quezon Avenue alignment (Manila City Hall to Philcoa, ~13 km) carries heavy jeepney and bus traffic that the BRT was intended to replace/supplement. This corridor should appear in OSM, LTFRB, and community data as a major route axis.

2. **EDSA Busway partly fulfills BRT 2**: The EDSA Busway Carousel (already analyzed) effectively replaced the planned BRT 2 along EDSA. Cross-reference confirmed.

3. **Feeder route gaps**: JICA and World Bank both identify feeder roles for jeepneys at major transfer nodes. Wave 2 validation of rail-feeder routes (LRT/MRT stations) should prioritize BRT Line 1 station areas: Philcoa, QMC, Quezon Ave, España, Lacson, Recto/Manila CH.

4. **No standalone World Bank dataset**: The World Bank's 2012 GTFS seeding effort produced no accessible public dataset. All surviving data is in LTFRB/TUMI/Sakay.ph (already analyzed).

5. **Bus Rationalization 2020**: While not a World Bank product, the June 2020 Metro Manila Bus Rationalization (31 rationalized routes issued under LTFRB MC 2020-019) reshaped the bus network in the same era as BRT cancellation. The World Bank loan drawdown was slow enough that the COVID restructuring outpaced it.

---

## Source Documents

- World Bank BRT Press Release (2017): [worldbank.org](https://www.worldbank.org/en/news/press-release/2017/03/16/philippines-first-metro-manila-bus-rapid-transit-line-to-benefit-thousands-of-commuters-daily)
- Metro Manila BRT Line 1 ISDS (P132401, 2015): [documents1.worldbank.org](https://documents1.worldbank.org/curated/en/435191468298463125/pdf/ISDS-Print-P132401-03-20-2015-1426838539594.pdf)
- BRT Environmental & Social Impact Assessment (2017): [documents1.worldbank.org](https://documents1.worldbank.org/curated/en/782651487713095546/pdf/ESIA-Executive-Summary-02152017.pdf)
- BRT Environmental Assessment Text (P132401): [documents1.worldbank.org](https://documents1.worldbank.org/curated/en/725931468295541905/txt/SFG1038-REVISED-EA-P132401-PUBLIC-Disclosed-1-17-2017.txt)
- CIF Project Appraisal Document (Metro Manila BRT Line 1): [cif.org](https://www.cif.org/sites/default/files/meeting-documents/mm_brt1_-_p132401_pad_manila_brt_dec_15_fin.pdf)
- World Bank Open Data + Urban Transport blog (2012): [blogs.worldbank.org](https://blogs.worldbank.org/en/transport/open-data-urban-transport)
- MMUTRIP Environmental Assessment: [documents.worldbank.org](https://documents.worldbank.org/en/publication/documents-reports/documentdetail/985841468763226236/philippines-metro-manila-urban-transport-integration-project)
- Inquirer: PH Shelves BRT Project: [business.inquirer.net](https://business.inquirer.net/351700/ph-shelves-crucial-metro-manila-bus-rapid-transit-project)
- IBON Metro Manila Transport Chaos (2024): [ibon.org](https://www.ibon.org/wp-content/uploads/2024/04/ts1-mmtc.pdf)
- Wikipedia — Transportation in Metro Manila: [en.wikipedia.org](https://en.wikipedia.org/wiki/Transportation_in_Metro_Manila)
