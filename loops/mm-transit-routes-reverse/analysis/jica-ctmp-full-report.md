# JICA CTMP Full Report — Analysis

**Aspect**: JICA CTMP full report (openjicareport.jica.go.jp/pdf/12374831.pdf) — 5-Year Traffic Management Plan approved Nov 2022; contains bus stop relocation data, 209 traffic bottlenecks, 42 major congestion points; may have bus corridor geometry
**Date analyzed**: 2026-02-27
**Method**: WebFetch (direct PDF) + WebSearch (secondary sources) + WebFetch (press releases, news articles)

---

## Source Identification

**Primary document**:
- **Title**: *The Project for Comprehensive Traffic Management Plan (CTMP) for Metro Manila — Final Report*
- **PDF**: https://openjicareport.jica.go.jp/pdf/12374831.pdf
- **Published**: November 2022
- **Commissioned by**: JICA (Japan International Cooperation Agency)
- **Implementing agency**: MMDA (Metro Manila Development Authority) + 17 LGUs
- **Project period**: 2019–2022

**Technical report series** (related document set 12374856):
- Technical Report No. 1: Case Studies on Selected Intersections (12374856_01.pdf)
- Technical Report No. 11: EDSA Busway U-Turn (12374856_09.pdf)
- Technical Report No. 12: Bike Lane Case Study

---

## Extraction Status

**CRITICAL LIMITATION: ALL JICA Open Report PDFs in this series are binary-encoded and not text-extractable.**

- 12374831.pdf (Main CTMP report): binary/image PDF — WebFetch returned raw binary data
- 12374856_01.pdf (Tech Report No. 1): same encoding failure
- 12374856_09.pdf (Tech Report No. 11): same encoding failure
- FOI portal version (foi.gov.ph/agencies/mmda/comprehensive-traffic-management-plan-for-metro-manila/): HTTP 403 Forbidden
- PCO article (pco.gov.ph): HTTP 403 Forbidden
- JICA Philippines press releases: one returned readable content, limited route detail

This is the same systemic encoding issue found with 12369815.pdf (JICA 2022 survey) and 12374856_09.pdf. The JICA Open Report portal delivers these documents as scanned-image PDFs, not OCR-indexed text.

**Routes extracted from the report itself: 0**

All findings below come from secondary sources: JICA press releases, Philippine news coverage (Philstar, Manila Bulletin), academic references, and cross-references to the EDSA Busway U-turn Technical Report abstract indexed by search engines.

---

## What the CTMP Is (and Is Not)

The CTMP is a **traffic management and engineering plan**, not a transit route inventory. Its primary focus is:

1. Identifying traffic bottlenecks on Metro Manila's road network
2. Developing signal timing improvements at priority intersections
3. Piloting traffic management interventions (intersection geometry, bus stop relocation, pavement markings)
4. Producing a 5-year implementation roadmap for MMDA and LGUs
5. Building institutional capacity in evidence-based traffic management

**It is NOT**: a route enumeration document, a GTFS dataset, a bus schedule, or a stop inventory.

However, it contains transit-relevant data as a byproduct: bus volumes at key corridors, bus stop relocation documentation, and EDSA Busway operational analysis (Technical Report 11).

---

## Key Quantitative Findings (from secondary sources)

### Bottleneck Classification
| Category | Count |
|----------|-------|
| Total traffic bottlenecks identified (evidence-based) | 209 |
| Major priority intersections (urgent improvement) | 42 |
| Road segments in action plan | 64 |
| Areas in action plan | 7 |
| Case study intersections (detailed engineering study) | 3 |

### 5-Year Action Plan Structure
- **12 strategies** covering traffic management interventions
- **10 projects** expected to achieve the action plan's mobility vision
- **Duration**: 2023–2027 (MMDA implementation, post-JICA project completion)

### EDSA Busway Corridor Data (from Tech Report 11 abstract)

This is the highest-value transit data found from the CTMP series:

| Location | Date | Observation |
|----------|------|-------------|
| EDSA–QC Academy (U-turn slot) | 30 June 2021 | Traffic count 06:00–20:00 |
| EDSA–Dario Bridge (U-turn slot) | 29 June 2021 | Traffic count 06:00–20:00 |
| EDSA–A de Jesus (U-turn slot) | 5 August 2021 | Traffic count 06:00–20:00 |
| EDSA bus lane (PM peak) | PM peak | 212 buses/hour (one bus every ~17 seconds) |

### Vehicle Composition at Case Study Intersections

**EDSA–Shaw Boulevard** (from indexed report content):
| Period | Private cars | Motorcycles | Buses |
|--------|-------------|-------------|-------|
| AM peak | 55% | 32% | 6% |
| PM peak | 60% | 24% | 7% |

---

## Case Study Intersections (Detailed Engineering Study)

Three intersections received full PDCA-cycle treatment from 2019–2020:

### 1. Roxas Boulevard – MIA Road Intersection
- Located at the junction of Roxas Blvd (Manila Bay coastal road) and the road to Ninoy Aquino International Airport
- Bottleneck classification: major priority
- Engineering study focus: intersection geometry, signal timing, pavement markings

### 2. EDSA – Taft Avenue Intersection
- Located in Pasay/Manila (near MRT-3 Taft Station, LRT-1 Edsa Station)
- One of the highest-volume transit transfer points in Metro Manila
- Major bus routes: EDSA Carousel (south terminus area), city buses via Taft Ave
- Engineering study focus: intersection geometry, bus-lane interaction

### 3. EDSA – Shaw Boulevard
- Located in Mandaluyong (near MRT-3 Shaw Station)
- Context: "surrounded by malls and business establishments; considered one of the busiest intersections in Metro Manila"
- Bus boarding: northbound buses board in front of EDSA Central Mall; southbound buses board in front of Starmall (near PUJ terminal)
- Buses may be boarded at median boarding/alighting bays near intersection
- Engineering study focus: underpass interaction (Shaw Blvd underpass exists for through traffic; buses use at-grade lane)

---

## Pilot Projects Documented

The CTMP implemented pilot traffic management projects with the following measures:

1. **Signal retiming** — adjustment of signal cycle times at congested intersections
2. **Intersection geometry modification** — channelization, lane reconfiguration
3. **Pavement marking adjustments** — revised lane markings, stop lines
4. **Traffic sign installation** — standardized signage
5. **Bus stop relocation** — moving bus stops to improve traffic flow at key intersections

**Note on bus stop relocation**: This is confirmed as a CTMP pilot measure. However, the specific locations where bus stops were relocated are NOT published in any accessible secondary source. The full locations presumably appear in the binary-encoded Technical Reports. This represents a gap — the CTMP did move bus stops but we cannot confirm which stops were moved without accessing the original PDF.

---

## Transit Corridor Data (Indirect)

While the CTMP does not enumerate routes, it confirms the following key transit corridors as significant enough to warrant engineering case studies:

| Corridor | Evidence of Significance |
|----------|------------------------|
| EDSA (full length) | Primary case study; busway tech report; 212 buses/hour peak; 209 bottlenecks concentrated here |
| Taft Avenue | Case study intersection (EDSA-Taft) |
| Roxas Boulevard | Case study intersection (Roxas-MIA Road) |
| Shaw Boulevard | Case study intersection (EDSA-Shaw) |

The 64 road segments and 7 areas in the action plan imply additional corridors (Commonwealth, C5, Quezon Avenue, Ortigas, Aurora Blvd are likely) but specific names are not published in accessible sources.

---

## FOI Status

The FOI portal (foi.gov.ph/agencies/mmda) lists the CTMP as a FOI-accessible document. Direct fetch returned HTTP 403. However:

1. A formal FOI request to MMDA could yield an HTML-formatted or accessible PDF version
2. The FOI listing confirms the document is categorized as publicly releasable
3. This is worth pursuing if the next iteration of this loop needs corridor geometry

---

## GTFS Value Assessment

| Data Type | Availability | Value for GTFS |
|-----------|-------------|----------------|
| Route list (names/OD pairs) | NOT published | None |
| Bus stop coordinates | NOT published (stop relocation documented but locations unreleased) | None direct |
| Route geometry | NOT published | None |
| Fare data | NOT relevant to CTMP | None |
| Frequency/headway data | Partial: EDSA 212 buses/hr PM peak | LOW (already better documented via EDSA Busway analysis) |
| Key corridor confirmation | Confirmed: EDSA, Taft, Roxas, Shaw | MEDIUM (validates Wave 2 corridor priorities) |
| Intersection bottleneck data | 42 major intersections, 64 road segments, 7 areas | MEDIUM (useful for Wave 3 stop placement accuracy) |
| Bus stop relocation events | Confirmed occurred, locations not released | LOW |

**Overall GTFS value: LOW–MEDIUM (corridor confirmation + EDSA operational data only)**

The CTMP is not a route database. Its primary GTFS contribution is:
1. **Confirming EDSA as the dominant bus corridor** with 212 buses/hour at PM peak
2. **Identifying three key bus-interaction intersections** for Wave 2/3 stop placement
3. **Noting EDSA U-turn slot locations** (QC Academy, Dario Bridge, A de Jesus) as operational waypoints

---

## Relationship to Other Aspects

- **jica-2022-survey.md**: The 2022 survey and the CTMP ran in parallel (both JICA-funded, 2019–2022). The CTMP focuses on traffic management engineering; the 2022 survey focuses on route policy and PUVMP issues. Different scope, different outputs.
- **edsa-busway-system.md**: The CTMP Technical Report 11 (EDSA Busway U-Turn) is a detailed operational study of EDSA Busway; stop list and geometry are better sourced from MMDA Regulation and the EDSA Busway aspect analysis.
- **mmda-traffic-engineering.md**: MMDA is the implementing agency for the 5-Year Action Plan. The CTMP's 12 strategies are now MMDA's operational mandate (2023–2027).
- **jica-ctmp-doi-report**: The follow-on TCP ("MMITS" — Intelligent Transportation Systems for Metro Manila) was signed February 21, 2025 as a 3-year project focused on V2X, smart poles, and integrated traffic data management.

---

## Key Insight

The CTMP confirms what the JICA 2022 survey also confirmed: **there is no published, comprehensive, georeferenced database of Metro Manila bus routes and stops in any government source**. The CTMP identifies where buses are problematic (at 42 priority intersections) but does not map where buses go.

The most actionable finding from this aspect is the **EDSA U-turn slot survey** (three named locations) and the **EDSA bus lane volume** (212 buses/hr PM peak), both of which validate the EDSA Busway analysis. The bus stop relocation pilot data would be valuable but is inaccessible without a formal FOI request.

---

## New Frontier Aspects Discovered

None. The JICA-DOTr 2024 TCP and the FOI CTMP document were already added as frontier aspects from the jica-2022-survey analysis.

---

## Raw Data

0 routes extracted. No raw JSON file created — CTMP contains no route-level data.
