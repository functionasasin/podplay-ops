# TUMI Datahub Manila GTFS

**Aspect**: TUMI Datahub Manila GTFS — DOTr/LRTA/LTFRB/MRTC/PNR-affiliated GTFS dataset
**Source URL**: https://hub.tumidata.org/dataset/gtfs-manila
**Retrieved**: 2026-02-26
**Method**: Web search + GitHub file inspection of sakayph/gtfs and sakayph/p2p-gtfs

---

## Summary

The TUMI Datahub Manila GTFS is the most complete **publicly downloadable** GTFS feed for Metro Manila. It is a validated mirror of the **sakayph/gtfs** GitHub repository, which itself originated from the Philippine Transit App Challenge (2013, organized by DOTC/World Bank/MMUTIP). The dataset was last updated around June 2020 and is now **over 5 years stale**, but it represents the best available structured baseline for Wave 3 GTFS synthesis.

**Critical finding**: This dataset has already been analyzed in depth under the `open-transit-data-initiatives` aspect. This dedicated aspect documents the full content breakdown and GTFS synthesis suitability assessment.

---

## Dataset Provenance

| Field | Value |
|-------|-------|
| Publisher | Sakay.ph (via sakayph/gtfs GitHub) |
| TUMI Host | hub.tumidata.org/dataset/gtfs-manila |
| Transitland ID | f-wdw-manila |
| Download URL | hub.tumidata.org/dataset/.../download/manila.zip |
| No auth required | Yes (public, free download) |
| License | Not clearly stated; original DOTC data (government, likely public domain) |
| Validator | Canonical GTFS Schedule Validator (MobilityData) — passes |
| Origin event | Philippine Transit App Challenge 2013 (first in SE Asia) |
| Funder | World Bank MMUTIP ($60M urban transport loan) |

### Feed Version History (via Transitland)

| Version Hash | Fetched | Service Period |
|---|---|---|
| 70efd19a88 | July 28, 2020 | Jun 17, 2013 – Jun 30, 2020 |
| 10257e026b | March 17, 2017 | Jun 17, 2013 – Jun 30, 2020 |
| 830e5ec1c7 | March 13, 2017 | Feb 21, 2014 – Mar 21, 2014 |

The most recent fetched version is **July 2020**. Service dates are expired (all end June 2020). No updates have been committed since then.

---

## GTFS File Contents

### agency.txt — 6 Agencies

| Agency ID | Name | Website |
|---|---|---|
| LRTA | Manila Light Rail Transit Authority | lrta.gov.ph |
| LTFRB | Land Transportation Franchising and Regulatory Board | ltfrb.gov.ph |
| MRTC | Manila Metro Rail Transit Corporation | dotcmrt3.gov.ph |
| MARINA | Maritime Industry Authority | marina.gov.ph |
| PNR | Philippine National Railways | pnr.gov.ph |
| FORT | The Fort Bus | bgcbus.com |

**Note on MARINA**: Inclusion of maritime authority is unusual. Likely represents the Pasig River Ferry Service or Manila Bay ferry routes that existed pre-2020.

### routes.txt — 600+ Entries

Route type breakdown:
- **LRTA** (route_type=2, Light Rail): 2 routes
  - LRT-1: Baclaran–Roosevelt (20 stations)
  - LRT-2: Recto–Santolan (11 stations)
- **LTFRB** (route_type=3, Bus): 600+ entries (mix of PUJ jeepney and PUB city bus)
- **MRTC** (MRT-3): Likely present but not confirmed in sampled data
- **PNR**: Commuter rail routes
- **FORT**: BGC Bus routes
- **MARINA**: Ferry routes (likely Pasig River Ferry / Manila Bay)

**Discrepancy note**: Earlier analysis of this same dataset cited 349 routes total (Sakay.ph aspect, entry #12) and 296–349 routes. The raw GitHub routes.txt appears to show 600+ row entries, which may count directional variants (northbound/southbound) as separate routes, inflating the count. True distinct routes likely 349–450 range.

### stops.txt — 1,816 Stops

- Geographic bounding box: **14.53–14.82°N, 120.90–121.09°E** (covers full NCR)
- First 20 stops are LRT-1 stations (Baclaran through Roosevelt) with precise coordinates
- Example: Baclaran LRT (14.5339°N, 120.9980°E), Monumento LRT (14.6561°N, 120.9840°E)
- City bus stops present at ~400–500m spacing along major corridors
- Jeepney-specific stops: minimal (informal/curbside stops not well represented)

### Other Files

| File | Status |
|------|--------|
| shapes.txt | Present — route geometry for LRT lines confirmed; bus route geometry likely basic (straight-line or simplified polylines) |
| stop_times.txt | Present — estimated schedule data, likely static/idealized |
| frequencies.txt | Present — headway estimates for peak/off-peak |
| calendar.txt | Present — weekday/weekend/holiday service patterns |
| feed_info.txt | Minimal — publisher=Sakay.ph, lang=en; no version date recorded |

---

## P2P GTFS — Separate Repository (sakayph/p2p-gtfs)

A companion repository exists specifically for premium point-to-point bus routes:

**URL**: github.com/sakayph/p2p-gtfs
**Commits**: 72 on master branch
**Data source**: Philippine government P2P bus announcements + operator Facebook pages (2016)

### 11 P2P Routes Documented

| Route ID | Short Name | Origin → Destination |
|---|---|---|
| P2P_ORTMKT_1 | Ortigas–Makati | Robinson's Galleria → Glorietta 3 |
| P2P_NEDMKT_1 | North EDSA–Makati | Trinoma → Glorietta 5 |
| P2P_NEDORT_1 | North EDSA–Ortigas | SM North EDSA → SM Megamall |
| P2P_ALAMKT_1 | Alabang–Makati | Alabang Town Center → Greenbelt 1 |
| P2P_ALAMKT_2 | Alabang–Makati (alt) | Ayala South Park → Greenbelt 5 |
| P2P_ALAFRT_1 | Alabang–Market Market | Alabang Town Center → Market Market |
| P2P_FRVMKT_1 | Fairview–Makati | Robinson's Novaliches → Glorietta 3 |
| P2P_BCRALA_1 | Bacoor–Alabang | Vista Mall Daang Hari → Starmall Alabang |
| P2P_DASALA_1 | Dasmariñas–Alabang | Central Mall Dasmariñas → Starmall Alabang |
| P2P_NVLMKT_1 | Nuvali–Makati | Solenad Nuvali → Glorietta |
| P2P_WEEKEND | EDSA Weekend Loop | Glorietta 5 → SM Megamall → Trinoma → SM North |

All type=3 (bus). Includes fare_attributes.txt and fare_rules.txt (flat fares). Contains frequencies.txt. **At least 3 of these routes are confirmed defunct as of 2026** (Froehlich routes; Froehlich ceased operations).

---

## Data Quality Assessment

### What's Good
- **Complete GTFS structure**: All required and most optional files present
- **Validated**: Passes Canonical GTFS Schedule Validator
- **Rail data**: LRT-1, LRT-2 stop coordinates are precise and current (stations haven't changed)
- **Freely downloadable**: No registration, no API key, no paywall
- **Baseline coverage**: 349–600 route entries covering major LTFRB-franchised routes as of 2020
- **Stop coordinates**: 1,816 stops with lat/lon, usable as seed data for Wave 3

### What's Outdated / Missing (Critical Gaps)

| Gap | Impact |
|-----|--------|
| Service period expired June 2020 | Calendar data invalid; must regenerate |
| No modern PUJ (MPUJ) routes | ~555 consolidated modern jeepney routes entirely missing |
| No UV Express consolidation data | ~250 UV Express routes not reflected post-2020 |
| No post-2020 bus route changes | 68 current city bus routes ≠ pre-pandemic routes |
| P2P routes are 2016 vintage | Multiple operators defunct; 20+ new P2P routes not included |
| MRT-3 data needs verification | MRTC agency listed but data completeness unknown |
| MARINA/ferry data stale | Pasig River Ferry Service has changed significantly |
| No BGC Bus expanded network | Fort Bus routes may be outdated (BGC Bus expanded post-2020) |
| Jeepney stop coverage minimal | Curbside stops not mapped; route geometries simplified |

### Confidence: **MEDIUM for rail** / **LOW for road routes** as of 2026

---

## Relationship to Other Sources

This dataset is the **same underlying data** as:
- `sakay.ph` (live app uses a more updated internal version)
- `open-transit-data-initiatives` (noted as GTFS feed #2 in that analysis)
- Transitland `f-wdw-manila` (API-accessible mirror)

It is **not the same** as:
- LTFRB CPUVMS (internal government GTFS, covers all 950+ jeepney routes, not public)
- EACOMM/Google Maps GTFS (proprietary, ~20-30 city buses, current)

---

## Recommended Use in Wave 3

1. **Download** from TUMI Datahub or clone sakayph/gtfs GitHub — no auth required
2. **Use agency.txt as-is** — add modern operators (UBE Express, HM Transport, RRCG, etc.)
3. **Use stops.txt as seed** — rail station coordinates are accurate; bus stops need QA
4. **Use shapes.txt for LRT-1/LRT-2 geometry** — these are still valid
5. **Do NOT use calendar.txt or stop_times.txt as-is** — expired; must regenerate from current operator data
6. **Extend routes.txt** with 555 modern PUJ routes, 250 UV Express routes, updated city bus routes, current P2P routes
7. **MRT-3 routes**: Use this dataset's MRTC data as baseline, validate against current MRT-3 station list

The TUMI Datahub GTFS is best understood as a **structural skeleton** for Wave 3 — the file format, agency structure, and stop coordinate methodology are sound, but the route content needs substantial updates to reflect post-2020 changes.

---

## Access Instructions

```bash
# Direct download (no auth)
wget "https://hub.tumidata.org/dataset/5dc13962-f732-4a74-959a-dbe44d21ce5e/resource/37dda9a8-b5b6-4b39-a1df-3069fb43e753/download/manila.zip"

# Or clone from GitHub
git clone https://github.com/sakayph/gtfs
git clone https://github.com/sakayph/p2p-gtfs

# Transitland REST API
curl "https://transit.land/api/v2/feeds/f-wdw-manila" -H "apikey: YOUR_KEY"
```

---

## Sources

- [TUMI Datahub — GTFS: Manila](https://hub.tumidata.org/dataset/gtfs-manila)
- [sakayph/gtfs GitHub](https://github.com/sakayph/gtfs)
- [sakayph/p2p-gtfs GitHub](https://github.com/sakayph/p2p-gtfs)
- [Transitland feed f-wdw-manila](https://www.transit.land/feeds/f-wdw-manila)
