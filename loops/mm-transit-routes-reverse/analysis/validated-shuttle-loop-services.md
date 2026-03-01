# Validated Shuttle/Loop Services — Metro Manila

**Aspect**: All shuttle/loop services — BGC, Makati, campus shuttles
**Wave**: 2 (Cross-Reference & Validation)
**Date**: 2026-03-01
**Sources cross-referenced**: bgc-bus-routes.json, bgc-bus-system.md, makati-loop-shuttle-routes.json, makati-loop-shuttle.md, university-shuttles-routes.json, university-shuttles.md, qcitybus-routes.json, qcitybus-routes.md, validated-taguig-bgc.md, validated-makati.md, validated-quezon-city.md, sakay-ph-routes.json, moovit-routes.json, google-maps-routes.json, transit-blogs-routes.json

---

## Summary

This validation covers **four distinct shuttle/loop service categories** in Metro Manila:

1. **BGC Bus System** — 11 routes, private estate transport (Bonifacio Transport Corp.)
2. **Makati Loop** — 2 routes (1 e-jeepney + 1 PUJ loop), LTFRB-franchised
3. **University Campus Shuttles** — 5–6 LTFRB-franchised UP routes + excluded private shuttles
4. **QCityBus** — 8 free government bus routes (Quezon City LGU)

**Total confirmed routes for GTFS inclusion**: 27 routes
**Excluded from GTFS** (private/restricted): 2 routes (Ateneo e-jeepney, DLSU Arrows Express)

---

## Part 1: BGC Bus System

**Operator**: Bonifacio Transport Corporation (subsidiary of Fort Bonifacio Development Corp. / Ayala Corp.)
**Regulatory status**: NOT LTFRB-franchised — private estate transport
**Fare system**: Cashless only (Beep Card or GCash); ₱13–15 standard, ₱25 Arca South, ₱90 Nuvali
**App**: BGC Bus official iOS/Android app provides real-time tracking

### Confirmed Routes (High Confidence)

| Route ID | Route Name | Origin | Destination | Schedule | Fare |
|----------|-----------|--------|-------------|----------|------|
| BGC-EAST-EXPRESS | East Express | EDSA Ayala (Makati) | Market! Market! (Taguig) | Mon–Sun 6AM–10PM | ₱13–15 |
| BGC-NORTH-EXPRESS | North Express | EDSA Ayala | EDSA Ayala (circular) | Mon–Fri 6AM–10PM | ₱13–15 |
| BGC-UPPER-WEST-EXPRESS | Upper West Express | EDSA Ayala | Crescent Park West | Mon–Fri peak only | ₱13–15 |
| BGC-LOWER-WEST-EXPRESS | Lower West Express | EDSA Ayala | Fort Victoria | Mon–Fri peak only | ₱13–15 |
| BGC-CENTRAL | Central Route | Market! Market! | Market! Market! (circular) | Mon–Fri 6AM–10PM | ₱13–15 |
| BGC-NIGHT | Night Route | EDSA Ayala | Fort Victoria | Mon–Fri 10PM–6AM | ₱13–15 |
| BGC-WEEKEND | Weekend Route | EDSA Ayala | Fort Victoria | Sat–Sun 6AM–10PM | ₱13–15 |
| BGC-ARCA-SOUTH-EXPRESS | Arca South Express | Arca South (Taguig) | One Parkade (BGC) | Mon–Fri peak only | ₱25 |
| BGC-AYALA-EXPRESS | Ayala Express | EDSA Ayala | Glorietta 5 (Makati) | Mon–Fri 6AM–10PM | ₱13–15 |

**Confidence**: HIGH — 5+ sources agree on route names, endpoints, and stops as of January 2025.

### Confirmed Routes (Medium Confidence)

| Route ID | Route Name | Notes |
|----------|-----------|-------|
| BGC-NUVALI-EXPRESS | Nuvali Express (Nuvali → Market! Market!) | Very limited frequency (1 AM + 2 PM departures); crosses provincial boundary to Laguna; ₱90 |

### Orphan Route (Low Confidence)

| Route ID | Route Name | Issue |
|----------|-----------|-------|
| BGC-LRT-AYALA | LRT-Ayala Route (Gil Puyat → BGC) | Single source (taguigeno.com Jan 2025); stops within BGC not confirmed; may be renamed or relabeled route |

### Cross-Source Conflicts

| Issue | Resolution |
|-------|-----------|
| Route count: "8" vs "10" vs "11" | January 2025 restructuring retired some older routes; 8 daily-operated + Night + Weekend + Arca South + Ayala Express = 11 distinct route IDs but ~8–9 in daily operation |
| ₱13 (2023) vs ₱15 (2025) | Fare raised January 1, 2025; ₱15 is current for most routes |
| "North Route" (10 stops from North Station) vs "North Express" (8 stops from EDSA Ayala) | Renamed/consolidated; North Station no longer listed as primary terminus |
| Upper/Lower West: peak-only vs all-day | Peak-only confirmed by majority of sources; all-day claim from one source may be outdated |

### BGC Bus GTFS Notes

- **Agency**: Bonifacio Transport Corporation (distinct from LTFRB agencies)
- **Route type**: GTFS type 3 (Bus)
- **Frequency data**: Only Night Route confirmed at 30-min headways; all others unknown
- **Stop coordinates**: Not publicly available — must be geolocated from named landmarks
- ~25 unique stop names across all routes; all are named commercial buildings, malls, or towers

---

## Part 2: Makati Loop Shuttle

### Route 1: Makati Loop E-Jeepney ("Love Bus") — CONFIRMED HIGH

- **Route ID**: DOTR:R_SAKAY_MPUJ_2176
- **Mode**: E-jeepney (modern PUJ)
- **Launched**: May 24, 2023; franchised by LTFRB + Ayala Land Inc.
- **Origin**: One Ayala (ground floor, in front of Lawson) — EDSA/Ayala Ave
- **Destination**: Circuit Makati (Gallery Drive / Circuit Lane, Kalayaan Ave)
- **Stops**: One Ayala → Greenbelt 3 → St. Andrew Parish → Ayala Triangle Gardens → Makati Medical Center → Century City Mall → Makati City Hall → Circuit Makati
- **Fare**: ₱14 flat (cash only)
- **Schedule**: Mon–Fri 6AM–10PM; Sat–Sun 8:30AM–12MN
- **Confidence**: HIGH — corroborated by Sakay.ph, TopGear, Spot.ph, KMC Solutions (May 2025)
- **Status**: Active as of May 2025
- **GTFS inclusion**: YES — LTFRB-franchised, public transit

**Conflict**: One May 2025 source lists hours as 5AM–10PM daily (may reflect updated schedule); 6AM start remains more widely cited.

**Cross-reference from validated-makati.md**: Confirmed as active; "Love Bus" livery described as light blue; flagged as having limited fleet causing long waits.

### Route 2: Makati PUJ Loop (Route 541) — CONFIRMED MEDIUM

- **Route ID**: DOTR:R_SAKAY_2018_PUJ_541
- **Mode**: Traditional jeepney (PUJ)
- **Corridor**: Kalayaan Ave → Makati Ave → JP Rizal Ave → Nicanor Garcia St (circular)
- **Stops**: 10 stops within southern Makati CBD / Poblacion-adjacent area
- **Fare**: ₱15.50 (LTFRB Service Contracting rate per Sakay.ph)
- **Confidence**: MEDIUM — Sakay.ph listing only; no secondary source corroboration
- **GTFS inclusion**: YES — LTFRB-franchised; borderline (Sakay.ph-only), but officially listed

---

## Part 3: University Campus Shuttles

### Routes for GTFS Inclusion (LTFRB-Franchised, Public Access)

| Route ID | Route Name | Mode | Direction | Stops | Fare | Confidence |
|----------|-----------|------|-----------|-------|------|------------|
| UP-IKOT (DOTR:R_SAKAY_PUJ_2156) | UP Ikot | Jeepney | CCW loop (within UP Diliman) | ~27 stops | ₱13 | HIGH |
| UP-TOKI | UP Toki | Jeepney | CW loop (within UP Diliman) | ~33 stops | ₱13 | HIGH |
| UP-KATIPUNAN | UP-Katipunan | Jeepney | CHK ↔ Katipunan / LRT-2 | 4 stops | ₱8.50 | HIGH |
| UP-PHILCOA | UP-Philcoa | Jeepney | CHK ↔ Philcoa (Commonwealth Ave) | 2 stops | ₱6.50 | HIGH |
| UP-SM-NORTH | UP-SM North / UP-Pantranco | Jeepney | CHK ↔ SM North EDSA / MRT-3 QA | 4 stops | ₱10.50 | MEDIUM |

**Operator**: Maroon Riders Transport Cooperative / North UP Campus Transport Cooperative (LTFRB-franchised)
**Key note**: UP Toki restored February 5, 2024 after sustained community advocacy. Both Ikot and Toki run simultaneously as counterclockwise/clockwise complements.

**Cross-reference**: validated-quezon-city.md confirms all UP routes as active LTFRB routes within QC.

**Possible duplication note**: Some sources list "UP-SM North" and "UP-MRT (to QA Station)" as separate routes; treated here as one cluster pending field verification.

### Excluded from GTFS

| Route | Reason |
|-------|--------|
| Ateneo de Manila E-Jeepney (Lines A & B) | Private university service; NOT LTFRB-franchised; campus-internal only; ~10 e-jeepneys, free, ~25 trips/day per line. Does not extend to public road network. |
| DLSU Arrows Express | Strictly restricted to DLSU students/staff with advance booking; inter-campus Manila↔Laguna; not public transit. |

---

## Part 4: QCityBus (Quezon City Free Bus)

**Operator**: Quezon City Government / TTMD
**Fare**: ₱0 (free) — permanent via Ordinance SP-3184, S-2023
**Fleet**: ~100 buses; 6 electric buses on Route 1 (deployed Jan 2, 2025)
**Ridership**: 41M+ since 2020 (as of October 2025)
**Features**: AC, WiFi, no standing, daily except holidays

All 8 routes confirmed HIGH confidence (official ordinance + TopGear Dec 2024 guide + QC government advisories).

| Route | Name | Key Corridor | Peak Headway | Operating Hours |
|-------|------|-------------|-------------|----------------|
| QCB-1 | QC Hall–Cubao | Kalayaan → Aurora → Cubao | 15 min | 6AM–9PM (M–F) |
| QCB-2 | QC Hall–Litex/IBP | QC Hall → Commonwealth → IBP Rd | 6 min | 6AM–9PM (M–F) |
| QCB-3 | Welcome Rotonda–Aurora Katipunan | E. Rodriguez → Kamias → Aurora | 20 min | 6:40AM–7PM (M–F) |
| QCB-4 | QC Hall–General Luis (Novaliches) | QC Hall → North Ave → Mindanao → Quirino | 15 min | 5:15AM–9PM (M–F) |
| QCB-5 | QC Hall–Mindanao Ave (via Visayas) | QC Hall → Visayas → Congressional → Mindanao | 15 min | 6AM–9PM (M–F) |
| QCB-6 | QC Hall–Gilmore | QC Hall → Quezon Ave → E. Rodriguez → Aurora | 20 min | 6AM–9PM (M–F) |
| QCB-7 | QC Hall–C5/Ortigas (Eastwood) | QC Hall → Katipunan → Aurora → E. Rodriguez Jr. → C5 | 20 min | 6:40AM–9PM (M–F) |
| QCB-8 | QC Hall–Muñoz (via North Ave) | QC Hall → North Ave → SM North → Muñoz | 15 min | 6AM–9PM (M–F) |

**Note**: QCityBus was previously captured in the all-city-bus-routes validation. Included here for completeness in the shuttle/loop inventory since it operates as a city-funded circulator network distinct from LTFRB-franchised commercial bus operators.

**GTFS implications**: Route 8 has asymmetric stop lists (outbound/inbound differ near SM North). All routes need GPS stop coordinates derived from street addresses.

---

## Deduplication Results

### Confirmed Routes (2+ sources)
- BGC Bus East Express, North Express, Central Route, Night Route, Weekend Route, Arca South Express, Ayala Express, Upper West Express, Lower West Express (9 routes) — BGC data + transit blogs + Moovit
- Makati Loop E-Jeepney (Love Bus) — Sakay.ph + TopGear + Spot.ph + KMC May 2025
- UP Ikot — Sakay.ph + Moovit + UP official page + validated-quezon-city
- UP Toki — Sakay.ph + UP OVCCA memorandum + validated-quezon-city
- UP-Katipunan, UP-Philcoa, UP-SM North — validated-quezon-city + multiple secondary sources
- QCityBus Routes 1–8 — QC government ordinance + advisory + TopGear Dec 2024

### Orphan Routes (single source only)
- BGC-LRT-AYALA (taguigeno.com only)
- BGC-NUVALI-EXPRESS (limited docs; medium confidence)
- Makati PUJ Loop 541 (Sakay.ph only)
- UP-SM North vs UP-MRT distinction (unresolved; possibly same route)

### Contested Routes
- BGC North Route (10 stops from North Station) vs North Express (8 stops from EDSA Ayala): **Resolution** — North Express is the current configuration; North Route is the legacy name for what was a different service pattern. Both may have existed simultaneously in 2023; current standard is North Express.

---

## Coverage Gaps

1. **No government shuttles for southern Metro Manila**: Makati LGU's "Makati Loop" is limited to 4km of CBD. No equivalent LGU shuttle found for Pasay, Parañaque, Las Piñas, or Muntinlupa.
2. **Mandaluyong Loop**: No dedicated intra-Mandaluyong shuttle documented. Shaw/EDSA-Boni jeepneys serve the area but no loop service.
3. **BGC stop coordinates**: No GPS coordinates publicly available for any BGC Bus stop. Must be derived from building names.
4. **Makati Loop operator**: Franchise holder for DOTR:R_SAKAY_MPUJ_2176 not confirmed by name (Ayala Land is the partnership entity, not the operator).
5. **Arca South feeder**: Beyond BGC Bus Arca South Express (peak only, Mon–Fri), no other documented transit for Arca South development.
6. **UP Diliman night service**: Ikot operates to ~9PM, Toki to ~5PM. Night access gap (9PM–midnight) on campus identified.
7. **Intramuros/BGC loop shuttles**: No permanent intra-Intramuros shuttle documented (Kalesa exists as tourism vehicle, not commuter transit).

---

## GTFS Summary

### Agencies to Create
| Agency | Notes |
|--------|-------|
| Bonifacio Transport Corporation | BGC Bus (private estate) |
| LTFRB/DOTr | For all LTFRB-franchised routes (UP shuttles, Makati Loop) |
| Quezon City Government / TTMD | QCityBus |

### Route Counts for GTFS
| Category | Routes | Mode | GTFS Type |
|----------|--------|------|-----------|
| BGC Bus (standard) | 9 confirmed + 1 medium + 1 low | Bus | 3 |
| Makati Loop E-Jeepney | 1 | Jeepney | 3 |
| Makati PUJ Loop 541 | 1 | Jeepney | 3 |
| UP Campus Shuttles (LTFRB) | 5 | Jeepney | 3 |
| QCityBus | 8 | Bus | 3 |
| **Total** | **25 confirmed + 2 borderline** | | |

### Stop Coordinate Needs
- BGC Bus: ~25 unique named stops (commercial buildings — coordinate derivable from Google Maps)
- Makati Loop: ~8 stops + 10 PUJ stops
- UP campus: ~30 stops within UP Diliman (OSM has partial campus road coverage)
- QCityBus: ~60+ intersection/landmark stops (derivable from stop names)
