# Waze Community — Analysis

**Aspect**: Waze community — traffic and route data contributed by Manila drivers
**Date**: 2026-02-28
**Method**: Web search + fetch attempts (MMDA, Waze for Cities, Philippines Wazeopedia)

---

## Executive Summary

Waze is a **car navigation and traffic reporting app**, not a public transit platform. It produces **zero extractable transit route records** for jeepneys, buses, or UV Express. Its primary value to this GTFS project is indirect: the MMDA–Waze Connected Citizens Program (CCP) provides road-speed and hazard data useful for traffic pattern modeling, and Waze's crowd-maintained road network geometry partially overlaps with OSM (which is already a primary source). The Philippines Waze editor community is active (~500k+ edits by top editors) and does map bus/jeepney terminal locations as Places of Interest (POIs), but no route structure, stop sequences, or schedules are encoded.

**Routes extracted: 0**

---

## Platform Assessment

### 1. Waze Core App — Metro Manila Coverage

- **Users**: ~1 million Waze users in Metro Manila (Waze's own figure at CCP launch; current figure likely higher)
- **Road network**: High coverage. Active Philippine editor community maintains all major NCR roads, flyovers, one-ways, tollways, and restricted zones (number coding, truck bans)
- **Transit layer**: **None.** Waze has no public transit mode in the Philippines or anywhere globally. Users cannot plan jeepney or bus trips inside Waze.
- **Transit POIs**: Some bus and jeepney terminals appear as searchable Places of Interest on Waze's live map (e.g., "Pacita Complex Jeepney and Bus Stop", "SM Jeepney Bus Terminal"), added by community map editors. These are terminal-level point locations with no route metadata.

**GTFS value**: Zero for routes, stops, or schedules. Terminal POI coordinates are single points only.

---

### 2. MMDA–Waze Connected Citizens Program (CCP)

**Partnership established**: 2016 (Philippines' first CCP partner)
**Current program name**: Waze for Cities

**Two-way data exchange structure:**

| Direction | Data Type |
|-----------|-----------|
| MMDA → Waze | Road closures, construction sites, accidents, floods, major event alerts (mall sales, processions, extreme weather) |
| Waze → MMDA | Real-time anonymized vehicle speeds, crowdsourced incident reports (hazards, potholes, accidents) on virtually every NCR street |

**Scale**: MMDA previously monitored traffic via ~150+ fixed CCTV cameras. The CCP expanded this to near-complete street coverage in NCR, 24/7. MMDA selected up to 25 priority monitoring routes including the Mabuhay Lanes.

**Data Science integration**: MMDA engaged Thinking Machines Data Science (a Manila-based firm) to analyze and integrate Waze data into transport policy. The initial output was a 24-hour holiday traffic timelapse showing busiest corridors and peak hours.

**What this data contains:**
- Anonymized speed observations on every NCR street segment, continuously updated
- Incident type, location, and timestamp data
- Traffic congestion heat maps by time of day and day of week

**What this data does NOT contain:**
- Vehicle type identification (cannot distinguish buses from cars from motorcycles)
- Route designations (no T-code or route names)
- Stop locations
- Passenger counts or load factors
- Any public transit layer

**Data accessibility**: The MMDA-facing Waze for Cities dashboard is a government partner tool — not publicly accessible. MMDA does not publish Waze data feeds. Historical analysis required a formal MMDA–Waze data sharing agreement, not a public API.

**GTFS value**: Zero for route structure. Potentially useful as a secondary input for frequency/headway estimation (high speed = low congestion = higher frequency viable) but this is speculative without direct access.

---

### 3. Waze Philippines Editor Community

**Community infrastructure:**
- **Wazeopedia Philippines**: `wazeopedia.waze.com/wiki/Philippines/Main_Page` (redirects to `waze.com/wiki/Philippines/`)
- **Community forum**: `waze.com/discuss/c/editors/philippines/`
- **Community site**: `sites.google.com/view/wazephilippines/`

**Activity level**: High. One top Filipino editor (Alvin Magno, Level 6) accumulated 500,000+ edits since 2012. Philippines-specific features successfully lobbied for include number coding restrictions and motorcycle lane support.

**Editing scope:**
- Road network: All NCR roads, one-ways, turn restrictions, speed limits, road types
- Places of Interest: Bus/jeepney terminals as point locations (no route data attached)
- Country-specific policies: Philippines Places Policy (harmonization spreadsheet governs categories/naming)

**Transit-relevant edits community members make:**
- Adding/correcting terminal POIs (name, category, entry point)
- Marking bus lanes and restricted zones on EDSA and other corridors
- Flagging route changes caused by construction or disaster events

**What editors do NOT do in Waze:**
- Draw jeepney route paths
- Define stop sequences
- Record route codes or LTFRB franchise numbers
- Associate routes with terminals

**GTFS value**: Zero for route data. POI placement for ~50–100 major terminals could serve as a cross-reference for terminal coordinates in Wave 3, but OSM already covers these with better metadata.

---

### 4. Waze for Cities Public Data Program

Waze offers government partners **BigQuery access** to analyze up to 1 TB/month of Waze data for free. This includes:
- Historical congestion events
- Pothole and road hazard locations
- Crash incident data
- Speed profile analysis

**Philippines access**: Only MMDA is a confirmed partner. LGUs (QC, Manila, Makati) may have separate agreements — not confirmed.

**Transit routing relevance**: Road-speed profiles from this program could theoretically inform GTFS `frequencies.txt` headway estimates by modeling realistic travel times per corridor. However:
1. Direct access requires government partner credentials
2. The data does not identify transit vehicles separately
3. OSM + Google Maps Directions API provides adequate travel-time estimation for Wave 3 without this data

---

## Comparison with Other Sources

| Source | Route Data | Geometry | Stop Coords | Real-Time | Publicly Accessible |
|--------|-----------|----------|-------------|-----------|---------------------|
| Waze (core app) | None | Road network | Terminal POIs only | Yes | No export |
| Waze CCP/MMDA | None | Road speeds | None | Yes | MMDA only (restricted) |
| Waze editor community | None | Road network | Terminal POIs only | No | No export |
| OpenStreetMap | 581 relations | Route shapes | 4,048 stops | No (static) | Full public export |
| Sakay.ph GTFS (2020) | 349 routes | shapes.txt | 2,078 stops | No | Public GitHub |

OpenStreetMap strictly dominates Waze for all GTFS construction purposes.

---

## Key Numbers Confirmed

From the MMDA–Waze partnership:
- **~1 million** Waze users in Metro Manila (as of 2016 CCP launch; likely 2–3M by 2025)
- MMDA monitored **150+ camera points** before CCP → expanded to near-complete NCR coverage after
- **1 TB/month** BigQuery tier available to Waze for Cities partners at no cost

---

## Recommendations

1. **Do not use Waze as a transit data source.** No route data exists anywhere in the Waze ecosystem for Metro Manila jeepneys, buses, or UV Express.

2. **Waze terminal POIs are marginal.** The Philippines community has mapped some bus/jeepney terminals as POIs, but these are redundant with OSM terminal nodes which carry better metadata (LTFRB codes, operator names, route_ref tags).

3. **MMDA–Waze CCP data inaccessible.** The speed and incident data from the CCP partnership requires government partner credentials. MMDA has not published any derived datasets from this program.

4. **Road geometry is better from OSM.** Waze's crowd-maintained road network is high quality for NCR but OSM provides the same coverage with full public export capability (Geofabrik PBF, Overpass API).

5. **No new frontier aspects.** Waze does not reference any transit-specific data repositories, third-party feeds, or parallel community efforts that would generate useful route data.

---

## Routes Extracted

**0 routes** added to raw JSON. Waze contains no public transit route data for Metro Manila.

See `raw/waze-community-routes.json` for the minimal record confirming zero extraction.
