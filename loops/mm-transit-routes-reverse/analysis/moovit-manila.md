# Moovit Manila — Route Data & Coverage Assessment

**Source type**: Transit app (crowdsourced + agency GTFS)
**Retrieved**: 2026-02-26
**Data URL**: https://moovitapp.com/index/en/public_transit-Manila-1022

---

## Summary

Moovit is a mass-market transit app that combines crowdsourced route data from its global editor community (~170,000 editors worldwide) with official GTFS feeds submitted by agencies. In Metro Manila, Moovit aggregates data across all transit modes under the LTFRB umbrella agency (ID: 9969) and separate agencies for rail (LRTA, MRTC, PNR) and specialized services (BGC Bus, P2P, UV Express).

**Key figures (from Moovit platform, as of 2025–2026)**:
- LTFRB: **888 routes**, **4,840 stops** (all modes combined under one agency)
- BGC Bus: **5 routes**, **17 stops**
- LRTA: **2 train lines**, **33 stations**
- Geographic range: North Santa Maria (Bulacan) to South Silang (Cavite) — extends well beyond NCR

**Critical note on "888 routes"**: Wikipedia (Nov 2024) documents only 68 active local bus franchises. The 888 figure almost certainly aggregates jeepneys (JEEP), UV Express (UV), city buses (BUS), modern PUJ, and possibly P2P under the LTFRB agency umbrella — it is NOT 888 bus-only routes. This number is plausible given the 955 consolidated jeepney routes + 250 UV Express + 68 buses.

---

## Data Collection Methodology

Moovit uses three data layers:

1. **Official GTFS feeds** — agencies that publish GTFS (primarily rail: LRTA, MRTC, PNR)
2. **Agency data partnerships** — LTFRB route data ingested directly or via partners
3. **Crowdsourced community editors** — 170,000 global editors who map and update routes; Manila has active contributors

Routes appear on Moovit's web interface with stop-by-stop lists, trip durations, and in some cases real-time tracking. The app claims real-time location data for LTFRB buses.

**Data currency**: Described as "real-time updates" — routes are updated continuously by community editors and agency integrations. However, no independent verification of update lag is available.

---

## Coverage by Mode

### Jeepney (JEEP)

Moovit lists jeepney routes as "JEEP" type under the LTFRB agency. Routes have stop-level data with street-intersection stops. Sample routes from Moovit's web pages:

| Origin | Destination | Stops | Est. Time |
|--------|-------------|-------|-----------|
| Community Centre, San Isidro Labrador, QC | Globo De Oro, Manila | 16 | ~18 min |
| Quezon Avenue, QC | Pan-Philippine Highway, 978 | 16 | ~16 min |
| Kalayaan Ave / Elliptical Rd Intersection, QC | Commonwealth Avenue, QC | 34 | ~48 min |
| Moriones / Sta. Maria Intersection, Manila | Del Pan Flyover, Manila | N/A | N/A |
| Daang Bakal / New Panaderos Extension Intersection, Mandaluyong | Arayat, Mandaluyong | N/A | N/A |
| Makati Ave / Ayala Avenue Intersection, Makati | Dr. Jose P. Rizal Ave, Makati | N/A | N/A |
| Zapote / Kalayaan Ave, Makati | Makati Ave / A. Arnaiz Ave, Makati | N/A | N/A |
| Gen. B. G. Molina St, Marikina | Aurora Blvd / General Aguinaldo Ave Intersection, QC | N/A | N/A |

**Shortest documented route**: 1 km, 2 stops (E. Abello / Ortigas Ave Intersection, Pasig → Ortigas Ave, QC)

Jeepney route names are NOT labeled with LTFRB T-codes on Moovit — they use street intersection descriptions as both route name and stop name. This makes cross-referencing with LTFRB franchises difficult.

### Bus (BUS)

**Longest documented route**: Maria, 9583 → Vfr Phase 2 Elementary School, City of San Jose Del Monte (Norzagaray) — 58+ km, 188 stops. This is a provincial extension, not a pure NCR route.

Sample bus route: Carlos Palanca Sr, Manila → Beata, Manila (limited details available from web scrape; dynamic content required).

Bus routes appear to use the rationalized numbered system consistent with LTFRB findings.

### UV Express (UV)

Moovit tracks UV Express as a separate mode labeled "UV" or "uv". Well-documented routes found:

| Route | Notes |
|-------|-------|
| FTI Taguig → Ayala UV Express Terminal | Agency ID: 1450948 |
| BF Parañaque UV Express Terminal → Ayala UV Express Terminal | Agency ID: 1450948 |
| Cubao UV Express → Buendia UV Express Terminal | Key EDSA-crossing route |
| SM Fairview → Buendia UV Express Terminal | North QC to Makati |
| Market Market UV Express → Mall of Asia | Taguig to Pasay |
| Festival Mall / Alabang → Mall of Asia | South Metro to Pasay |
| Pasig → Ayala Center | East Metro to Makati |
| Makati UV Express Terminal → Ayala UV Express Terminal | Short Makati internal route |
| Bagong Silang → SM North / CIT | North QC route |
| Brgy. Fortune (Marikina City) → Cubao | East Manila route |
| Las Piñas-Muntinlupa v. Susana Heights Lower Bicutan → SM Makati | South Metro to Makati |
| Ever Gotesco → SM North / CIT | North Manila to QC |

UV Express agency on Moovit is listed with a different agency ID (1450948) separate from LTFRB's main ID (9969). This suggests Moovit may separately categorize UV Express from jeepney/bus.

**UV Express stop**: Market Market UV Express stop is documented (stop_37013535) suggesting individual stop nodes exist for UV terminals.

### P2P Premium Bus (P2P)

Moovit tracks P2P as a distinct mode labeled "P2P". Documented routes:

| Route | Notes |
|-------|-------|
| Vista Mall Taguig → EDSA Starmall UV Express | Weekdays operational |
| Alabang Town Center → Greenbelt 1 | South Metro to Makati |
| Ayala Malls South Park → Greenbelt 5 | South Metro to Makati |
| Vista Mall Daang Hari Bacoor → Starmall Alabang | Bacoor Cavite to Alabang |

P2P routes appear on a separate agency (ID: 1441963) from LTFRB's main jeepney/bus agency. Consistent with Sakay.ph's separate P2P dataset.

### BGC Bus

5 routes, 17 stops, operating within Makati City and BGC area. This is consistent with the known BGC Bus Consortium routes (previously analyzed under MMDA/EDSA Busway context).

### Rail (Train)

- LRTA: 2 lines (LRT-1, LRT-2), 33 stations total — consistent with known data
- MRT-3: 13 stations (MRTC agency)
- PNR: Listed as separate agency

Rail data is sourced from official GTFS submissions — highest confidence.

---

## Data Quality Assessment

### Strengths

1. **Comprehensive mode coverage**: All major modes represented (jeepney, bus, UV Express, P2P, BGC, rail)
2. **Stop-level granularity**: Individual stops with names (street intersections), estimated travel times between stops
3. **Continuous updates**: Crowdsourced editors update routes as service changes occur
4. **Real-time integration**: GPS tracking data from bus operators (where available) enriches stop timing estimates
5. **Large user base**: 1.5M+ Manila users generating passive GPS traces that validate route paths

### Weaknesses

1. **Data not exportable**: Moovit does not offer a public GTFS feed for Manila. All data is locked inside their platform — no bulk download, no API for route geometry.
2. **Route naming inconsistency**: JEEP routes use street intersection descriptions, not LTFRB T-codes. Cross-referencing requires manual matching.
3. **Agency lumping**: 888 routes under LTFRB conflates jeepney, UV Express, bus, modern PUJ — total count per mode is not directly readable.
4. **Stop coordinate quality**: Crowdsourced stops are approximate — may be offset from actual boarding points, especially for flag-stop jeepneys.
5. **Dynamic content barrier**: Route details (stop lists, coordinates) are rendered by JavaScript — not accessible via static web scraping. Full data requires API access or the app.
6. **Provincial route inclusion**: The geographic range extends to Bulacan/Cavite/Rizal, including non-NCR segments in route counts.

### Confidence Assessment

| Mode | Coverage | Accuracy | Usability |
|------|----------|----------|-----------|
| Rail (LRT-1/2, MRT-3, PNR) | Complete | High | High (GTFS source) |
| BGC Bus | Complete (5 routes) | High | High |
| P2P | Partial (4-6 routes documented) | Medium | Medium |
| UV Express | Substantial (12+ routes) | Medium | Low (no export) |
| City Bus | Partial (~68 routes possible) | Medium | Low (no export) |
| Jeepney | Extensive (800+ claimed) | Low-Medium | Low (no export, no T-codes) |

---

## Comparison with Previous Sources

| Aspect | Moovit | Sakay.ph (frozen 2020) | LTFRB official |
|--------|--------|------------------------|----------------|
| Jeepney routes | 800+? (estimated, under 888 total) | 296 (Jun 2020 snapshot) | ~955 consolidated |
| City bus routes | ~68 (within 888) | ~20 | 68 confirmed |
| UV Express | 12+ documented, more in app | Not in frozen GTFS | ~250 |
| P2P | 4-6 documented | 11 static + 17+ live | ~15-20 |
| BGC Bus | 5 | Not covered | 5 |
| Rail | Complete | Complete | Official GTFS |
| Data format | Proprietary (no export) | GTFS (frozen) | No public release |

**Key gap**: Moovit likely has the most comprehensive current route database for Manila, but it is entirely proprietary. The frozen Sakay.ph GTFS is the only open-access dataset with actual stop coordinates and shapes.

---

## Unique Data Points (Not Found in Prior Sources)

1. **Longest NCR-adjacent bus route**: 58+ km, 188 stops (Maria → San Jose del Monte/Norzagaray)
2. **Shortest documented route**: 1 km, 2 stops (Ortigas Ave area, Pasig-QC border)
3. **UV Express agency ID** on Moovit: 1450948 (separate from LTFRB 9969) — suggests Moovit treats UV Express as a distinct operator category
4. **P2P agency ID** on Moovit: 1441963
5. **Stop node IDs**: stop_37013535 = Market Market UV Express Terminal (these IDs could be queried if API access is obtained)

---

## Gaps and Limitations for GTFS Build

1. **No geometry available without API access** — Moovit's route shapes cannot be extracted via public web
2. **No fare data per route** — Moovit displays fares in-app but not on public web pages
3. **No frequency/headway data** — schedule hours noted (06:00-00:00) but headways not documented
4. **Route IDs not LTFRB-aligned** — Moovit uses internal numeric IDs (e.g., 7637826), not LTFRB T-codes or N-codes

---

## Recommendations

1. **Do not attempt Moovit web scraping** for this GTFS build — dynamic content renders route data inaccessible without a browser/API.
2. **Use Moovit as a validation tool** — confirm whether specific LTFRB routes appear in Moovit app (qualitative check, not data extraction).
3. **The 888-route claim is the best evidence** that Moovit's crowdsourced database covers nearly all active NCR routes — this validates that OpenStreetMap and other open sources are unlikely to have complete coverage.
4. **Pursue API access separately** if the GTFS build needs Moovit data — their Transit Data Manager product offers agency partnerships but requires commercial engagement.

---

## New Frontier Aspects to Add

None identified — Moovit's data is proprietary and cannot be extracted. The TUMI Datahub and SafeTravelPH aspects (already in frontier from DOTr analysis) remain the best paths to open data.
