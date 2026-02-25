# Philippine Statistics Authority — Transport Sector Data

**Source type**: Government statistics agency
**Analyzed**: 2026-02-25
**Aspect**: Wave 1 — Official Government Sources

---

## Summary Assessment

PSA is **not a primary source for route-level transit data**. It compiles administrative data from LTO and LTFRB rather than conducting original transport surveys. There is no dedicated commuter OD survey or household travel survey from PSA. For GTFS building purposes, PSA data provides useful context (fleet counts, vehicle registration totals) but zero route geometry, stop locations, or schedules.

**GTFS utility: Low** — useful for validating mode totals and fare policy context; not useful for route or stop data.

---

## Available Datasets

### 1. Philippine Statistical Yearbook (PSY) — Chapter 13: Transportation and Communication

Published annually. Most recent: **2023 PSY**.

- **Table 13.3**: Motor vehicles registered by type, 2015–2021
- **Table 13.4**: Private motor vehicles by type, status, and region, 2020–2021
- **Table 13.5**: Motor vehicles by type, fuel used, and region, 2020–2021
- **Table 13.20**: Road traffic accidents in Metro Manila, 2011–2022
- URL: `https://psa.gov.ph/philippine-statistical-yearbook`
- Format: PDF + XLSX per table

**Useful for**: Verifying approximate PUV fleet sizes nationally and in NCR; confirming vehicle type proportions.

### 2. Compendium of Philippine Environment Statistics (CPES) — Component 5

- **Table 5.8.2**: Registered vehicles by region, type, and registration type
- 2023 total: 14.27 million nationally (up from 13.83M in 2022)
- Of these, 93% private, ~6.2% for-hire (the "for-hire" segment includes jeepney, bus, UV Express, taxi)
- NCR is the highest-vehicle-count region
- URL: `https://psa.gov.ph/statistics/environment-statistics`

### 3. PSA OpenSTAT

- URL: `https://openstat.psa.gov.ph/`
- Transport metadata: `https://openstat.psa.gov.ph/Metadata/Transport`
- Gross Value Added for Transport and Storage sector (quarterly/annual, 2000–2024)
- Granularity: **national economic aggregates only** — not useful for route mapping

### 4. PSA iSTAT (via LTO administrative records)

- Regional Statistics Service Office portal for LTO-sourced data
- Contains vehicle registration statistics from LTO admin records
- NCR-specific breakdowns may require FOI request
- URL: `https://rssocar.psa.gov.ph/content/istat-lto`

### 5. FIES (Family Income and Expenditure Survey)

- Conducted every 3 years (shifting to biennial from 2025)
- Transport is ~7.2% of national household budget
- Provides **regional-level expenditure data** (including NCR) but NOT mode choice, trip patterns, or routes
- PSADA microdata portal: `https://psada.psa.gov.ph/catalog/FIES/about`
- **Utility**: Confirms households spend a significant portion on transport; supports fare sensitivity analysis. No route data.

---

## Fleet Count Data (Cross-Referenced)

From PSA/LTO compiled data and LTFRB operational figures:

| Mode | National | NCR Estimate | Source |
|------|----------|--------------|--------|
| PUJ (traditional) | ~270,000 franchised | ~75,000 | LTFRB/MMDA |
| PUJ (modern) | ~160,000 met PUVMP | varies | LTFRB Apr 2024 |
| City bus (PUB) | ~3,000 units | ~2,500 | LTFRB 2021 |
| UV Express | ~6,000+ in NCR | ~6,000 | LTFRB estimate |
| Taxi | data in PSY Table 13.4 | — | PSA/LTO |

MMDA also tracked jeepney volume decline: **193,221 (2013) → 95,659 (2023)** — a 50% reduction over 10 years, consistent with PUVMP phase-out of traditional units.

---

## What PSA Does NOT Have

1. **No commuter OD survey** — PSA does not operate a household travel survey. The first DOTr-sponsored survey (for the Active Transport Strategic Master Plan) began in 2025 and only covers ~2,900 households, mostly in Manila.

2. **No route-level ridership data** — Route ridership for jeepney/bus is not collected or published by PSA. LTFRB holds franchise data but has denied some FOI requests for it.

3. **No stop-level data** — PSA has no stop locations, coordinates, or service patterns.

4. **No frequency/schedule data** — PSA has no operational schedule data for any transit mode.

---

## Existing OD Survey Data (not from PSA)

The best available OD data for Metro Manila came from **JICA**, not PSA:

| Study | Year | Key Data |
|-------|------|----------|
| MMUTIS | 1999 | First comprehensive OD matrices for Metro Manila |
| MUCEP | 2015 | Updated OD matrices, Greater Manila Area; mode split by jeepney/bus/car/motorcycle |
| JICA GCR Follow-up | 2019 | Updated corridor demand estimates |

Raw GIS/tabular data from these studies is **not publicly downloadable** — contact JICA Philippines Office, DOTr, MMDA, or UP-NCTS for access.

- MUCEP report: `https://openjicareport.jica.go.jp/pdf/12247664.pdf`
- GCR Follow-up: `https://openjicareport.jica.go.ph/pdf/1000041638_03.pdf`

---

## Useful Derived Statistics for GTFS Context

From MMDA and rail operators (compiled via PSA press releases and FOI data):

| Metric | Value | Year |
|--------|-------|------|
| Metro Manila AADT | 3,634,233 vehicles/day | 2023 |
| EDSA daily volume | 400,000+ vehicles | 2023 |
| MRT-3 daily riders | 357,198 | 2023 |
| LRT-1 annual riders | 78.5M | 2022 |
| LRT-2 annual riders | 31.6M | 2022 |
| EDSA Carousel daily riders | 389,579 | 2022 |

MMDA AADT report (2013–2023): `https://cpbrd.congress.gov.ph/wp-content/uploads/2024/10/FF2024-38-Metro-Manila-Annual-Average-Daily-Traffic.pdf`

---

## Key Finding: Data Vacuum

PSA's lack of a dedicated household travel survey is an **acknowledged gap** in Philippine transport planning. The route rationalization program (LTFRB) and the PUVMP consolidation (DOTr) both proceeded without comprehensive baseline OD data. This explains why the MUCEP study (commissioned 2015, never fully published) and LTFRB's own route planning remain incomplete.

For the GTFS project, PSA data is useful only for:
- Validating approximate fleet size counts per mode
- Providing fare/expenditure context
- Confirming that no authoritative route-level dataset exists from this agency

---

## Data Quality Assessment

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Route data | None | Not collected |
| Stop data | None | Not collected |
| Fleet counts | Medium | 2–3 year lag; LTO admin data has registration gaps |
| Fare data | Low | Only expenditure aggregates, not fare structures |
| Frequency | None | Not collected |
| Geometry | None | Not collected |
| Overall GTFS utility | Very Low | Context only |

---

## Action Items / Follow-ups

- The **PSA Table 5.8.2 Excel file** (NCR vehicle registration by type) is worth downloading for fleet validation — URL: `https://psa.gov.ph/system/files/enrad/Table%205.8.2%20Number%20of%20Registered%20Vehicles%20by%20Region,%20Type%20of%20Motor%20Vehicle,%20and%20Type%20of%20Registration,.xlsx`
- **FIES microdata via PSADA** could support fare sensitivity analysis if needed
- **JICA MUCEP 2015** is the best existing OD dataset — should be a separate Wave 1 aspect (already included under "JICA Metro Manila transport studies")
- **LTO FOI** for 2023–2024 motor vehicle registration by region: `https://www.foi.gov.ph/agencies/lto/motor-vehicle-registration-data-by-region-for-the-years-2023-and-2024/`
