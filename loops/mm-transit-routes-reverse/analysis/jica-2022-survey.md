# JICA 2022 Data Collection Survey — Analysis

**Aspect**: JICA 2022 data collection survey — improving road-based public transportation in Metro Manila
**Date analyzed**: 2026-02-27
**Method**: WebSearch + WebFetch (multiple attempts)

---

## Source Identification

**Full title**: *Data Collection Survey on Improving Road-Based Public Transport System in Metro Manila, Republic of the Philippines: Final Report*
**Published**: April 2022
**Consultants**: ALMEC Corporation and Oriental Consultants Global Co., Ltd. (same pair as the 2014 Dream Plan and 2019 GCR Follow-Up)
**Commissioned by**: JICA (Japan International Cooperation Agency)
**PDF**: https://openjicareport.jica.go.jp/pdf/12369815.pdf
**Document ID**: 12369815

---

## Extraction Status

**CRITICAL LIMITATION: PDF is binary-encoded and not text-extractable.**

The PDF exceeds 10MB and is compressed in a format that prevents text extraction via WebFetch. All major JICA Open Report PDFs from this era (12374831, 12374856_09, 12369815) share this binary encoding. This is a systemic limitation — not specific to this report.

**Routes extracted from the report itself: 0**

All findings below are synthesized from:
1. Secondary sources that cite or reference the 2022 survey
2. The 2019 GCR Follow-Up Survey (ALMEC, same consultants) — treated as baseline
3. JICA/DOTr press releases about the follow-up 2024 project
4. Philippine Daily Inquirer and Manila Bulletin coverage of the 2024 signing ceremony

---

## What the Survey Is (and Is Not)

This is a **policy diagnostic and data baseline survey**, NOT a route inventory. It does not enumerate individual routes with stop lists, GPS coordinates, or GTFS-compatible data. The purpose was to:

1. Assess the current state of Metro Manila's road-based public transport system
2. Identify systemic problems with the PUVMP implementation
3. Provide evidence base for future technical cooperation
4. Feed into route rationalization policy formulation

**It is not a source of route-level GTFS data.**

---

## Survey Focus Areas (from Secondary Sources)

The survey examined the following problem areas, which explains what data was collected:

1. **Franchising policies** — How LTFRB issues, renews, and regulates franchises; dysfunction in franchise verification
2. **Public transport network development** — How routes are planned (or not planned) relative to demand
3. **Transport supply-demand rationalization** — Excess vehicle numbers on many routes (oversupply)
4. **Overlapping routes** — Redundant routes competing on the same corridors; confirmed as a major inefficiency
5. **Service competition** — Boundary system incentivizing racing behavior; negative effects on safety and scheduling
6. **Operating rules** — Role of driver cooperatives; compliance with route consolidation requirements
7. **Colorum vehicles** — Prevalence of illegal PUVs operating without franchise
8. **Role of public agencies** — LTFRB, MMDA, DOTr coordination failures

---

## Key Statistics Referenced in Secondary Sources

These figures appear in sources that reference the broader JICA survey series (MUCEP 2015, GCR Follow-Up 2019, and the 2022 survey):

| Metric | Value | Period |
|--------|-------|--------|
| Intra-city bus routes (Metro Manila) | ~73 | ~2022 baseline |
| Bus routes serving EDSA | ~33 | ~2022 baseline |
| Intra-city jeepney routes | 640+ | ~2022 baseline |
| AUV/UV Express routes (intra-Metro Manila) | ~130 | ~2022 baseline |
| Pre-rationalization routes (total) | 900+ | Pre-2020 |
| Bus franchises (pre-rationalization) | 830 | Pre-2020 |
| Jeepney franchises (pre-rationalization) | 43,000+ | Pre-2020 |
| Daily passenger jeepneys on NCR roads | 95,659 | 2023 (MMDA) |
| Traffic cost per day (Metro Manila) | PHP 3.5B | 2017 (JICA) |
| Projected traffic cost by 2035 (no intervention) | PHP 5.4B | JICA projection |

**Note on 73 bus routes / 640 jeepney routes**: These figures appear in multiple sources referencing the JICA survey series but do NOT break down individual routes. The 73-bus figure is consistent with the 68 LTFRB-published routes as of Nov 2024 (difference likely due to QCityBus + EDSA Carousel counting conventions).

---

## Survey's Direct Outcome: 2024 JICA-DOTr Technical Cooperation Project

The 2022 survey's most concrete product was serving as evidence base for the **"Capacity Development of Public Utility Vehicles (PUV) in Metro Manila and its Adjoining Areas"** project:

- **Signed**: July 17, 2024 (DOTr, San Juan City)
- **Duration**: 3 years (2024–2027)
- **Type**: Technical Cooperation Project (TCP)
- **Partners**: JICA + DOTr
- **Transport Secretary**: Jaime Bautista (at signing)

**Project components:**
1. Effective route planning (addressing overlapping routes)
2. Development of intermodal transport hubs
3. Improving convenience of fixed-route PUVs
4. Consolidation support for jeepney cooperatives
5. Financing and vehicle acquisition review
6. Communication and social component

**Quote from Sec. Bautista**: *"There really are a lot of issues [in the modernization program]… Rationalization is one issue."*

This 2024 project is now the live active successor to the 2022 survey. **Any data products from this TCP (2024–2027) would be the most current route rationalization data available.**

---

## CTMP Connection

The JICA Comprehensive Traffic Management Plan (CTMP) for Metro Manila ran parallel to the 2022 road-based PT survey:
- **Period**: 2019–2022
- **Output**: 5-Year Action Plan (approved November 2022 by MMDA and 17 LGUs)
- **Identified**: 209 traffic bottlenecks; 42 classified as major
- **Bus-relevant actions**: Bus stop relocation, signal retiming at bus corridors
- **PDF**: https://openjicareport.jica.go.jp/pdf/12374831.pdf (binary-encoded, not fetched)
- **Also hosted at**: https://www.foi.gov.ph/agencies/mmda/comprehensive-traffic-management-plan-for-metro-manila/

The CTMP Technical Report No. 11 specifically covered the EDSA Busway (2022), with GPS coordinates of 21 EDSA Carousel stops collected (noted in SafeTravelPH aspect analysis). This is the most actionable JICA 2022 transit asset.

---

## GTFS Value Assessment

| Data Type | Availability | Value |
|-----------|-------------|-------|
| Route list (names/OD pairs) | NOT published | None |
| Stop coordinates | NOT published | None |
| Route geometry | NOT published | None |
| Fare data | NOT published | None (LTFRB matrices already documented) |
| Frequency/headway data | NOT published | None |
| Aggregate statistics | Available in secondary sources | MEDIUM (cross-validation only) |
| Policy context | Available | HIGH (explains data gaps) |

**Overall GTFS value: LOW (direct) / MEDIUM (context and gap explanation)**

---

## Key Insight: Why This Report Matters Despite 0 Routes Extracted

This survey is important NOT for its route data (which it doesn't publish) but because it CONFIRMS the structural reason the NCR route database is incomplete:

> The survey found that LTFRB's franchising database is incomplete and unverifiable, colorum vehicles are widespread, the ₱45M route rationalization study (MUCEP) was never completed, and no agency has a comprehensive georeferenced map of all active PUV routes. The 2022 survey was supposed to start fixing this — and the 2024 TCP is the follow-up action.

**Until the 2024 TCP produces outputs (expected 2025–2027), no comprehensive official route database exists.** This is the gap this loop is trying to partially fill from open sources.

---

## New Frontier Aspects Discovered

1. **JICA CTMP full report (openjicareport.jica.go.jp/pdf/12374831.pdf)** — 5-Year Traffic Management Plan, approved Nov 2022; contains bus stop relocation data and traffic bottleneck maps; worth attempting fetch
2. **JICA-DOTr 2024 TCP outputs** — "Capacity Development of PUV in Metro Manila" project deliverables (route rationalization plans, intermodal hub designs); expected 2025–2027; monitor DOTr and JICA Philippines for releases
3. **FOI portal MMDA CTMP document** (foi.gov.ph) — FOI-accessible version of CTMP; may have HTML or non-binary version of bus corridor data

---

## Raw Data

0 routes extracted. See `raw/jica-2022-routes.json` for schema-compliant empty output with metadata.
