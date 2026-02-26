# Citizen Mapping Projects — Community-Driven Route Mapping Efforts

**Source type**: Community / Open Data
**Retrieved**: 2026-02-26
**Routes extracted**: 0 new routes (data audit / ecosystem survey; all route data already captured from OSM and Sakay aspects)

---

## Summary

"OpenRouteService" as a standalone citizen mapping project for Metro Manila does **not exist** — ORS is a general-purpose open routing engine (Heidelberg Institute for Geoinformation Technology) that can consume OSM data but has no Manila transit deployment. This aspect covers the broader ecosystem of citizen and community mapping projects.

The Metro Manila citizen mapping ecosystem has **three active pillars**:
1. **OpenStreetMap Philippines community** — volunteer route tagging + geometry
2. **Sakay.ph ecosystem** — crowdsourced route database, GPS-logged data
3. **Academic prototypes** — CommYouTer, Routie, OpenTripPlanner/Metro Manila implementations

None of these produce independent route lists not already captured in the OSM or Sakay aspects. This aspect confirms coverage completeness and identifies known community tracking tools.

---

## 1. OpenStreetMap Philippines (OSMPH) Community

### Status: ACTIVE — most important citizen effort for route geometry

**Organization**: Volunteer community, no formal employer. GitHub: [github.com/OSMPH](https://github.com/OSMPH) (21 repositories).

**Key initiatives**:
- **Philippines/Public transportation wiki** — defines tagging conventions for all modes (train, bus, jeepney, UV Express, ferry). Used as the authoritative tagging standard by all OSM contributors mapping Philippine transit.
- **Metro Manila/Jeepney and UV Express routes wiki** — documents all T1xx–T4xx series jeepney routes + modern jeepney routes + N/C-series UV Express routes with endpoints, key streets, and operators. Serves as the human-readable companion to OSM relation data.
- **OSMPH/papercut_fix GitHub issue #75** (opened Oct 17, 2020 by TagaSanPedroAko) — active tracking issue for mapping rationalized traditional jeepney and UV routes around the Greater Manila Area. Status: most routes show `[ ]` unchecked (geometry not yet in OSM); ~30 routes checked as complete. Route count: 80+ T1xx, 75+ T2xx, 100+ T3xx/T3xxx, 40+ T4xx, 60+ UV Express C/N codes.
- **Metro Manila/Bus routes wiki** — corresponding bus route table (assessed in OSM-transit-relations aspect).

**Tagging conventions confirmed**:
- Stop spacing: 200m minimum (busy), 400m (residential)
- `network=PUJ` for modern and traditional jeepneys in NCR + Bulacan + Cavite + Rizal
- `network=LTFRB–National Capital Region` (newer tag, still being rolled out)
- `operator=*` only on consolidated/franchised routes with TSC operator

**Kaart Ground Survey 2024/2025**: Professional crowd contributors from Kaart (a US-based pro-mapping firm) have been running ground surveys in Manila tagged `#kaart-613`, `#kaart-609`, `#kaart-589`. Activities include: road geometry, turn restrictions, service ways, ref tags, building offsets. Kaart's work improves the road network underlying all OSM transit routing but does not appear to include dedicated transit relation updates (that remains volunteer-driven).

**State of the Map 2025**: Global OSM conference hosted in Manila, Philippines, **October 3–5, 2025** — first global SotM in Southeast Asia. Venue: University of the Philippines Diliman. This milestone will likely accelerate jeepney route mapping in the lead-up to and following the event.

**Data quality assessment**:
- City bus routes: GOOD geometry (assessed in OSM aspect: 64+ regular routes, full relations with stop members)
- Jeepney routes: POOR geometry (only ~23 of 400+ routes have route relations with shapes in OSM; wiki tables have text descriptions without coordinates)
- UV Express routes: VERY POOR geometry (< 10 relations with shapes)

---

## 2. Sakay.ph Crowdsourced Database

### Status: HISTORICAL (frozen Jun 2020 for GTFS); ACTIVE for live app

Already assessed in detail in `analysis/sakay-ph.md`. Key citizen-mapping dimension:

**Origin story**: Data collection methodology was GPS-journaling — DOTC engaged students to ride jeepneys with smartphones logging routes, then compiled all data. Sakay adopted this dataset as its initial GTFS feed (Philippines Transit App Challenge, 2013).

**Crowdsourced moderation**: Live Sakay.ph app (post-2020) uses crowdsourced user reports to self-moderate route information. Route changes, closures, and new routes are surfaced through user submissions. This crowdsourcing mechanism keeps the live app more current than the frozen GTFS feed, but produces no exportable structured data.

**GTFS freeze**: The public GTFS at `sakayph/gtfs` (GitHub) has not been updated since June 2020. All post-2020 modern PUJ routes, UV Express consolidation, and rationalization changes are reflected only in the live app, not in downloadable data.

---

## 3. Academic & Research Prototypes

### CommYouTer (IEEE, circa 2013–2014)
- Android app for **transit journaling** via GPS + accelerometer
- Automated transfer detection differentiates walking from riding
- Crowdsources real-time traffic conditions
- Modified RAPTOR algorithm for traffic-sensitive routing
- Tested in Metro Manila (headway-based, non-scheduled transit)
- Published in IEEE HNICEM 2013 (DOI: ieeexplore.ieee.org/document/6878754)
- **Status**: Research prototype only; no public deployment, no route database output

### OpenTripPlanner / Metro Manila (Narboneta & Teknomo, UP NCTS, 2014–2015)
- Combined GTFS data (from DOTC/LTFRB public release) + OSM road network
- Validated GTFS data via crowd-source survey AND personal researcher validation
- Modified OTP to include Philippine local transit modes
- Published: TSSP 2014 Annual Conference + JURP Vol. 2 (UP School of Urban and Regional Planning)
- **Status**: Academic implementation; not publicly hosted; GTFS data used was the 2013-era feed
- **Relevance**: Confirmed feasibility of OTP+GTFS+OSM for Manila; methodology reusable for Wave 3

### Routie (Mapua University, 2024)
- Research prototype from School of Information Technology, Mapua University
- Presented at ICIIT '24 (9th International Conference on Intelligent Information Technology)
- Deliberately excludes ride-hailing (Grab/Angkas); focuses on buses, jeepneys, tricycles, trains
- "Route Suggestions" feature: detailed transit mode info, estimated cost and travel time
- 50-participant user study — positive evaluation on pragmatic qualities; hedonic aspects need improvement
- **Status**: Research prototype; no public app, no route database output

### Rush PH (2025)
- Web app: `rush-ph.netlify.app`
- **Crowdsourced train tracking** only (LRT-1, LRT-2, MRT-3)
- Developer: Joshua Bumanlag (PLM graduate, iOS developer at ING)
- No bus/jeepney route data; trains only
- **Relevance**: 0 (rail data better sourced from TUMI/Sakay GTFS)

---

## 4. SRDP Consulting Transit Map (JICA, 2004)

- Pilot project by SRDP Consulting in partnership with **JICA** (Japan International Cooperation Agency)
- Produced a Metro Manila Transit Map in 2004
- GIS database development, field data gathering, aerial/satellite imagery analysis
- **Status**: 22 years old — completely superseded by PUVMP route rationalization. No public download. Historical artifact only.

---

## 5. World Bank GTFS Initiative (2012–2013)

- World Bank + AusAid supported DOTC/LTFRB to create first Metro Manila GTFS database
- Resulted in the original sakayph/gtfs dataset (Philippine Transit App Challenge 2013)
- Also created a web-based GTFS update interface for transport agencies
- Funding: MMUTIP (Manila Metropolitan Urban Transport Integration Program, $60M World Bank loan)
- **Status**: Produced the foundational dataset, now frozen. The web update interface is not publicly maintained.

---

## 6. What's NOT a Citizen Mapping Project

- **OpenRouteService**: General routing engine (Germany-based), no Manila transit deployment
- **Waze**: Navigation app; Waze community maps road incidents and closures, not transit routes. Road data does flow back to OSM but with no transit relation tagging.
- **MetroDreamin'**: Fantasy/proposal transit maps (user-created future rail maps), not real route data
- **Scribblemaps / ArcGIS Maps**: Consumer mapping tools; individual user uploads, no systematic route database

---

## Data Availability Assessment

| Project | Extractable Route Data | Geometry | Stops | Last Updated |
|---------|----------------------|----------|-------|--------------|
| OSM Philippines community | Yes (via Overpass) | City buses only | Partial | Ongoing (daily) |
| OSMPH/papercut_fix #75 tracking | Text list only (wiki) | No | No | 2020–2024 |
| Sakay.ph GTFS (frozen) | Yes (GitHub) | Yes | 2,078 stops | Jun 2020 |
| Sakay.ph live app | No public export | No | No | Ongoing |
| CommYouTer | No (academic only) | N/A | N/A | 2013 |
| OTP/Metro Manila | No (academic only) | N/A | N/A | 2014–2015 |
| Routie | No (research prototype) | N/A | N/A | 2024 |
| SRDP/JICA 2004 | No (proprietary, old) | N/A | N/A | 2004 |

---

## Key Findings

1. **No new route data**: All extractable citizen-mapping route data has already been captured via the OSM aspect (OSM transit relations) and Sakay aspect (frozen GTFS + p2p-gtfs).

2. **Geometry gap is the main problem**: The citizen mapping community has documented jeepney route names/endpoints in wiki tables (400+ routes) but has only mapped ~23 of these with actual OSM geometry. This 94% geometry gap is the primary obstacle to GTFS synthesis for jeepney routes.

3. **OSMPH/papercut_fix #75** is the best ongoing tracker for which jeepney routes have been mapped into OSM. Recommend checking this issue during Wave 3 to identify which T-series routes have relations with shapes.

4. **SotM 2025 in Manila** (Oct 3–5) may produce new jeepney route relations as the community mobilizes for the conference. Worth monitoring after that date.

5. **Academic GPS journaling** (CommYouTer methodology) is the theoretically correct approach to collecting jeepney geometry from scratch, but no current project applies this at scale in Metro Manila.

6. **Sakay.ph live app** is the best-maintained citizen route database but is not exportable. The frozen 2020 GTFS is all that's publicly available.

---

## Recommendations for Wave 3

- Use OSM city bus route relations (via osmtogtfs or Geofabrik PBF) for bus route geometry — this is the best available geometry source confirmed across all Wave 1 aspects.
- For jeepney geometry, interpolate paths using OSM road network + known stop locations + OSMPH wiki route descriptions (key street sequences).
- Do NOT rely on any citizen mapping project for GPS-accurate jeepney stop coordinates — these must be inferred or estimated.
- Monitor OSMPH/papercut_fix #75 before Wave 3 commit to catch any recent mapping additions.
