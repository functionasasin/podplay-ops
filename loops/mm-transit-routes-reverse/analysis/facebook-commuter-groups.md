# Facebook Commuter Groups — Analysis

**Aspect**: Facebook commuter groups — PH Commuters, Manila Commuters, area-specific groups
**Date**: 2026-02-27
**Method**: Web search + targeted fetch attempts

---

## Executive Summary

Facebook commuter groups in the Philippines are **inaccessible to automated web research**. Group content is private/semi-private and not indexed by search engines. This aspect produced **zero extractable route records** via web search. However, research confirmed the groups' existence and characterized what types of route data they contain. The most actionable finding is a Scribd document (Roger Abesamis, "Jeepney Routes in Metro Manila") purportedly listing 230+ routes — this is not fetchable via web but is a candidate for manual retrieval.

---

## Platform-by-Platform Assessment

### 1. Facebook Groups

**Groups confirmed to exist (via news/blog references):**
- "Metro Manila Commuters" — general commuter Q&A
- "Traffic Updates" — real-time detour and route change alerts
- "Metro Manila Traffic Watchers" — MMDA-adjacent community monitoring
- "PH Commuters" — national-scope commute advice
- Area-specific groups for QC, BGC, Makati, Pasig (names not confirmed but referenced generically)
- LTFRB Official Facebook Page — official announcements on route changes, consolidation deadlines
- Sakay.ph Facebook Page (`fb.com/sakaydotph`) — community engagement around app routes
- DOTr Philippines — policy and project announcements
- Commute Pilipinas — advocacy group, occasionally shares route impact analysis

**Data accessibility**: **None via web search.** Facebook does not allow search engine indexing of group content. Even public pages yield only metadata, not post content, through web fetching.

**What these groups contain (qualitative):**
- User-reported route detours during construction, flooding, or MMDA operations
- Crowd-sourced answers to "how do I get from X to Y" questions
- First-hand reports of route changes after LTFRB franchise consolidation
- Terminal-specific advice (e.g., "jeepneys going to Divisoria line up at Gate 4")
- Real-time reports of colorum crackdowns affecting specific routes
- Anecdotal confirmation or denial of online route information

**GTFS value**: Low for geometry, medium for terminal/stop location validation, high for detecting post-2024 route changes that aren't reflected in official sources.

---

### 2. Reddit (r/Philippines, r/phcommuting, r/manila)

**Subreddits identified:**
- `r/phcommuting` — dedicated transit sub, active as of 2024
- `r/Philippines` — general, commute questions common
- `r/manila` — Manila-specific

**Data accessibility**: Reddit blocks web fetching from automated agents. Search engine indexing of Reddit exists but did not return specific route data posts.

**What these subreddits contain (qualitative):**
- "How do I get from [X] to [Y]?" threads with community answers
- Route changes after jeepney consolidation (April 2024 deadline)
- Complaints about specific routes that were phased out
- Tips for using Sakay.ph, Moovit, etc.
- Discussion of LTFRB policies and their on-the-ground effects

**GTFS value**: Low for new routes, medium as a secondary validation source for unusual routes.

---

### 3. Twitter/X (#ManilaCommute, LTFRB)

**Accounts identified:**
- `@LTFRBOfficial` — posts route announcements, franchise actions
- `@DOTrPH` — policy and project updates
- `@sakayph` — transit tips, route changes
- `@MMDATraffic` — real-time traffic, enforcement actions

**Hashtags**: `#ManilaCommute`, `#LTFRB`, `#PUVMPUpdate`, `#ManilaTraffic`

**Data accessibility**: Twitter does not index content for web search. LTFRB announcements on Twitter mirror their press releases (already captured via PNA/Rappler searches in other aspects).

**Key route-relevant tweets (found via news citations):**
- LTFRB tweeted the list of unconsolidated routes as of December 31, 2023 (mirroring the Rappler database)
- MMDA tweets about EDSA Busway enforcement — no new route data beyond what's in MMDA analysis

**GTFS value**: Negligible — all substantive announcements appear in news articles more accessibly.

---

### 4. YouTube / TikTok

**Content creators identified:**
- `@themanilacommuter` (TikTok) — jeepney tutorial content, procedural how-to, not route documentation
- "Commute PH", "Manila Commuter Life", "Pinoy Commuter Vlogs" — generic search suggestions, not confirmed channels with structured route data

**What these channels contain:**
- How-to-ride videos (fare passing, "para po", etc.)
- General commute advice for tourists and new residents
- Occasional route-specific content ("How to get from QC to Makati by jeepney")
- No systematic route documentation (no channel documents all routes)

**GTFS value**: Very low for systematic route data. Individual videos may contain stop-level detail for specific routes but would require manual watching of hundreds of videos to extract useful data.

---

### 5. Waze Community

**Context**: MMDA has a Waze Connected Citizens Program partnership. MMDA provides road closure/incident data to Waze; Waze provides crowd-sourced traffic speed data to MMDA.

**What Waze contains relevant to transit:**
- Road network geometry (useful for estimating jeepney route paths)
- Traffic pattern data (useful for frequency/headway modeling)
- Hazard and closure reports (useful for route validation)

**What Waze does NOT contain:**
- Jeepney routes, stops, or schedules
- Bus route designations
- Any public transit layer for Manila

**GTFS value**: Zero for route data. Road geometry is better sourced from OSM. Traffic pattern data (if obtainable) would help model peak/off-peak headways.

---

## Key Statistical Data Confirmed via Social/News Sources

These numbers (from LTFRB social media announcements covered by news sites) corroborate other aspects:

| Metric | Value | Source |
|--------|-------|---------|
| Daily jeepney commuters (NCR) | ~9 million | General media consensus |
| Rush hours | 7–9 AM, 5–8 PM weekdays | General media consensus |
| NCR jeepney routes (consolidated) | 555 | LTFRB, Dec 2023 |
| NCR jeepney routes (no TSE) | 310–395 | LTFRB, Dec 2023 |
| NCR UV Express routes (consolidated) | 142 | LTFRB, Dec 2023 |
| NCR UV Express routes (unconsolidated) | 76–108 | LTFRB, Dec 2023 |
| National consolidation rate (by units) | 78.33% | LTFRB, April 23, 2024 |
| National routes with TSE | 7,019 | LTFRB, April 23, 2024 |
| NCR city bus routes | 68 | LTFRB, November 2024 |
| Jeepney phase-out deadline | August 31, 2025 | DOTr, July 2025 |

---

## Noteworthy Community-Adjacent Data Source

**Scribd document**: "Jeepney Routes in Metro Manila" by Roger Abesamis
- URL: `scribd.com/document/438492612/Jeepney-Routes-in-Metro-Manila`
- Claims: 230+ numbered jeepney routes with starting point and destination
- Status: **Not fetchable** — Scribd paywall blocks content extraction
- Estimated age: Published before 2020 (legacy data, pre-consolidation)
- Action: Manual retrieval via Scribd subscription or Google cache could yield 230 route origin-destination pairs

---

## Data Quality Assessment

| Platform | Route Data | Geometry | Fares | Stops | Currency |
|----------|-----------|----------|-------|-------|---------|
| Facebook Groups | Anecdotal | None | None | Anecdotal | Real-time |
| Reddit | Anecdotal | None | None | Anecdotal | 1–3 months lag |
| Twitter/X | Announcement-level | None | None | None | Real-time |
| YouTube/TikTok | Procedural only | None | None | None | Varies |
| Waze | None | Road only | None | None | Real-time |
| Scribd (Abesamis) | 230+ O-D pairs | None | None | None | Pre-2020 |

---

## Recommendations

1. **Skip Facebook/Reddit/Twitter for automated extraction** — content is inaccessible and lower-quality than official sources already analyzed.

2. **Manual Scribd retrieval** — the Abesamis document is the one community source worth manual retrieval. 230 O-D pairs pre-2020 would validate our existing jeepney route dataset. Flag for field-validation phase.

3. **LTFRB social media as announcement feed** — official LTFRB/DOTr Facebook/Twitter provide useful press releases but these are fully captured by PNA/Rappler/GMA News web search. No marginal value in monitoring separately.

4. **Field validation gap** — social groups are where ground-truth updates live (route phaseouts, terminal changes, new modern PUJ routes not in LTFRB database). This analysis loop cannot access them; they should inform a future field validation phase.

---

## Routes Extracted

**0 routes** added to raw JSON. No structured route data was retrievable from any social/community source via automated web research.

See other Wave 1 aspects for the actual route corpus.
