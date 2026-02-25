# MMDA Traffic Engineering — Bus Route Assignments, EDSA Busway, Traffic Management

**Source type**: Government / Multi-agency
**Retrieved**: 2026-02-25
**Confidence**: High (EDSA Carousel); Medium (city bus route list); Low (stop coordinates)

---

## Summary

MMDA's traffic engineering role is primarily **enforcement and traffic management**, not franchising. Route franchises belong to LTFRB. However, MMDA is the operational co-administrator of the EDSA Busway (EDSA Carousel) alongside DOTr, and it sets bus lane rules, stop designations, and dispatch protocols along EDSA and other major corridors.

Key data assets from this source:
- Complete EDSA Carousel stop list (northbound + southbound)
- Pre-pandemic EDSA bus segregation scheme (Bus A/B/C classification)
- Bus Monitoring and Dispatching System (BMDS) framework
- City bus route list (68 routes as of Nov 2024)
- QCityBus routes (Quezon City LGU-operated)

---

## EDSA Carousel (Route E) — Full Stop List

### System Overview
- **Corridor**: EDSA (Epifanio de los Santos Avenue), 28 km
- **Termini**: Monumento (Caloocan City) ↔ PITX (Parañaque City)
- **Operations**: 24/7; PITX↔Monumento reduced frequency midnight–4 AM; Taft↔Monumento runs 24h at full headways
- **Operators**: ~87 operators, 751 authorized buses (only ~322 active daily as of 2024 data)
- **Daily ridership**: ~172,000–300,000 passengers (sources vary; 63M total in 2024)
- **Fare**: ₱15 base (first 5 km) + ₱2.65/km thereafter; max ₱75.50 (Monumento–PITX); 20% discount SC/PWD/students
- **Payment**: Cash onboard with conductor (GCash also accepted as of Dec 2025); beep card not accepted on Carousel

### Northbound Stops: PITX → Monumento (23 stops)

| # | Stop Name | City/Municipality | Platform | Rail Connections |
|---|-----------|-------------------|----------|-----------------|
| 1 | PITX Terminal | Parañaque | Terminal | LRT-1 Asia World–PITX |
| 2 | City of Dreams | Parañaque | Curbside | — |
| 3 | DFA (Diosdado Macapagal Blvd) | Pasay | Curbside | — |
| 4 | SM Mall of Asia | Pasay | Curbside | — |
| 5 | Roxas Boulevard (Eastbound) | Pasay | Curbside | — |
| 6 | Taft/EDSA (MRT Taft Ave) | Pasay | Median | LRT-1 EDSA, MRT-3 Taft Ave |
| 7 | One Ayala / Ayala (Northbound) | Makati | Curbside | MRT-3 Ayala |
| 8 | Buendia | Makati | Median | MRT-3 Buendia (nearby) |
| 9 | Guadalupe | Makati | Median | MRT-3 Guadalupe |
| 10 | Ortigas | Mandaluyong/Pasig | Median | MRT-3 Ortigas |
| 11 | Santolan–Annapolis | San Juan | Median | MRT-3 Santolan–Annapolis |
| 12 | Main Avenue (Cubao) | Quezon City | Median | — |
| 13 | Nepa Q-Mart / Kamuning | Quezon City | Median | MRT-3 Kamuning (nearby) |
| 14 | Quezon Avenue | Quezon City | Median | MRT-3 Quezon Avenue |
| 15 | Philam | Quezon City | Median | — |
| 16 | North Avenue | Quezon City | Median | MRT-3 North Avenue |
| 17 | SM North EDSA | Quezon City | Median | — |
| 18 | Fernando Poe Jr. / Roosevelt | Quezon City | Median | LRT-1 Fernando Poe Jr. |
| 19 | Kaingin Road | Quezon City | Median | — |
| 20 | Balintawak | Quezon City | Median | LRT-1 Balintawak |
| 21 | Bagong Barrio | Caloocan | Median | — |
| 22 | MCU / Monumento | Caloocan | Median | LRT-1 Monumento |

**Note**: Source discrepancy — some sources list 19 stops, others 23. The 23-stop count (from TopGear.com.ph 2025) appears to include Philam, SM North EDSA, Kaingin, and One Ayala as distinct from the earlier 19-stop list. The 23-stop count is treated as authoritative.

### Southbound Stops: Monumento → PITX (24 stops)

| # | Stop Name | City/Municipality | Platform | Rail Connections |
|---|-----------|-------------------|----------|-----------------|
| 1 | MCU / Monumento | Caloocan | Median | LRT-1 Monumento |
| 2 | Bagong Barrio | Caloocan | Median | — |
| 3 | Balintawak | Quezon City | Median | LRT-1 Balintawak |
| 4 | Kaingin Road | Quezon City | Median | — |
| 5 | Fernando Poe Jr. / Roosevelt | Quezon City | Median | LRT-1 Fernando Poe Jr. |
| 6 | SM North EDSA | Quezon City | Median | — |
| 7 | North Avenue | Quezon City | Median | MRT-3 North Avenue |
| 8 | Philam | Quezon City | Median | — |
| 9 | Quezon Avenue | Quezon City | Median | MRT-3 Quezon Avenue |
| 10 | Nepa Q-Mart / Kamuning | Quezon City | Median | MRT-3 Kamuning (nearby) |
| 11 | Main Avenue (Cubao) | Quezon City | Median | — |
| 12 | Santolan–Annapolis | San Juan | Median | MRT-3 Santolan–Annapolis |
| 13 | Ortigas | Mandaluyong/Pasig | Median | MRT-3 Ortigas |
| 14 | Guadalupe | Makati | Median | MRT-3 Guadalupe |
| 15 | Buendia | Makati | Median | MRT-3 Buendia (nearby) |
| 16 | One Ayala Terminal | Makati | Indoor terminal | MRT-3 Ayala |
| 17 | Tramo Carousel Station | Pasay | Median | — |
| 18 | Taft/EDSA | Pasay | Median | LRT-1 EDSA, MRT-3 Taft Ave |
| 19 | Roxas Boulevard (Westbound) | Pasay | Curbside | — |
| 20 | SM Mall of Asia | Pasay | Curbside | — |
| 21 | DFA / Consular Affairs | Pasay | Curbside | — |
| 22 | Ayala Malls By the Bay / ASEANA | Parañaque | Curbside | — |
| 23 | City of Dreams | Parañaque | Curbside | — |
| 24 | PITX Terminal | Parañaque | Terminal | LRT-1 Asia World–PITX |

**Southbound-only stops**: Tramo Carousel Station, Ayala Malls By the Bay/ASEANA — these do not appear in northbound list.
**Key stop note**: No stops at Magallanes, Boni, or Shaw Boulevard despite MRT-3 stations there — passengers must use MRT-3 for those.

### Accessibility
Stations with elevators/escalators: Monumento, Bagong Barrio, Balintawak, SM North EDSA, Philam, Guadalupe, One Ayala
Stations with free WiFi (as of Jan 2026): 18 stops (DICT/DOTr program)

### Upcoming Stations (by 2026)
- Two new stops at PITX
- New stop in Cubao
- Renovations at: Monumento, Bagong Barrio, North Avenue, Guadalupe

---

## Pre-Pandemic EDSA Bus Segregation Scheme (MMDA, 2012)

Before the Carousel, MMDA classified EDSA buses into three types:
- **Type A**: EDSA-Alabang route; exclusive A-designated stops
- **Type B**: EDSA-Baclaran route; exclusive B-designated stops
- **Type C**: All others; can use any of 15 designated EDSA bus stops

This scheme was superseded by the EDSA Carousel in 2020 but explains historical route designation logic.

**Legal basis**: MMDA Resolution No. 03-28 (September 17, 2003) — EDSA Organized Bus Route Project

---

## Bus Monitoring and Dispatching System (BMDS)

MMDA/DOTr implemented BMDS for EDSA Carousel operations:
- **Color-coded dispatch cards** assigned at terminals and control stations
- **FIFO dispatch protocol**: buses dispatched sequentially by order of arrival
- **Timer-controlled headways**: pre-set gap between dispatches
- **Surveillance**: 166 CCTV cameras (21 with AI) from Monumento to Roxas Blvd — monitors loading times and driver violations
- **Enforcement**: Bus lane violations tracked and penalized

---

## City Bus Routes (LTFRB/MMDA Co-Administered)

As of November 2024: **68 local bus routes** + Route E (EDSA Carousel)

Derived from the 2020 Bus Rationalization Program, then expanded by:
- LTFRB MC No. 67 (Aug 2022): reopened 32 pre-pandemic routes
- LTFRB MC No. 74 (Sep 2022): approved 20 additional franchises
- LTFRB Board Resolutions 55 & 57 (Aug 2023): further modifications

### Known Numbered Routes (partial — 30 of 68 confirmed)

| Route | Name / Endpoints | Notes |
|-------|-----------------|-------|
| Route E | EDSA Carousel: Monumento ↔ PITX | BRT/Busway; 24/7 |
| Route 1 | Monumento – Balagtas (Bulacan) | EDSA corridor |
| Route 2 | Monumento – PITX | Parallel to Carousel? |
| Route 3 | Monumento – Valenzuela Gateway Complex | North extension |
| Route 4 | North EDSA – Fairview | QC loop |
| Route 5 | Quezon Avenue – LIFT (Angat?) | QC northeast |
| Route 6 | Quezon Avenue – EDSA Taft | Cross-city |
| Route 7 | Quezon Avenue – Montalban (Rodriguez) | NE Rizal |
| Route 8 | Cubao – Montalban | NE Rizal via Cubao |
| Route 9 | Cubao – Antipolo | Augments LRT-2 extension |
| Route 11 | Gilmore – Taytay | Eastern corridor |
| Route 12 | Pasig – Taytay ("Pasig Tale") | Pasig–Rizal |
| Route 13 | Buendia – BGC | Makati–Taguig |
| Route 14 | Ayala – Alabang | South corridor |
| Route 15 | Ayala – Biñan (Laguna) | South extended |
| Route 16 | Ayala – FTI Complex | Taguig |
| Route 17–30 | PITX – NAIA Loop + Cavite destinations | South/Southwest (NAIC, Tres Martires, Dasmariñas, Cavite City) |
| PNR Route 1 | Alabang – Divisoria | PNR augmentation (bus) |
| PNR Route 2 | FTI – Divisoria | PNR augmentation (bus) |

**Gaps in this dataset**: Routes 10, 18–29 endpoints unknown from public sources; Route 10 appears to be missing or renumbered.

### QCityBus (Quezon City LGU Free Routes)

Operator: Quezon City Government (free, subsidized)
Frequency: Daily except holidays
As of late 2024: **8 active routes**, 7 originating at QC Hall

| Route | Endpoints |
|-------|-----------|
| QC 1 | QC Hall – Litex |
| QC 2 | QC Hall – Batasan Hills |
| QC 3 | Welcome Rotonda – Aurora–Katipunan |
| QC 4–8 | QC Hall – northern districts (details TBC) |

---

## Operators

- **EDSA Carousel**: Mega Manila Consortium Corporation + ES Transport and Partners Consortium (two main consortia from 2021 consolidation of ~150 operators)
- **City bus routes**: ~122 bus companies operate on EDSA; franchised cooperatives and individual operators under LTFRB
- **Provincial buses** using NCR: Genesis, DLTB, Victory Liner, Philtranco, JAM, Five Star (terminals: Cubao, NLET, Pasay, Buendia)

---

## MMDA Role vs. LTFRB/DOTr

| Function | Agency |
|----------|--------|
| Route franchising | LTFRB |
| Fare setting | LTFRB/DOTr |
| Bus lane designation on EDSA | MMDA |
| Stop placement on EDSA | MMDA/DOTr |
| Dispatch management (BMDS) | MMDA/DOTr |
| CCTV enforcement | MMDA |
| Traffic coding (general) | MMDA |
| Busway physical infrastructure | DPWH |

---

## Data Quality Assessment

| Data Type | Quality | Notes |
|-----------|---------|-------|
| EDSA Carousel stop names | High | Consistent across 3+ sources |
| EDSA Carousel stop GPS coords | Not available | Must derive from maps |
| City bus route endpoints (30 routes) | Medium | Partial list; endpoints approximate |
| City bus stop-level data | Low | No stop lists published |
| Fare structure | High | Official LTFRB rates confirmed |
| Frequency/headway | Medium | Peak/off-peak distinction made; exact headways not published |
| BMDS operational data | Low | Described but data not publicly released |

---

## Gaps and Flags

1. **Routes 17–30+ endpoints**: Known only as "PITX/Cavite destinations" — need Sakay/OSM cross-reference
2. **EDSA Carousel GPS stop coordinates**: No official published coordinates; will need OSM or Google Maps extraction
3. **Routes 31–68**: Unknown from this source; likely suburban/provincial extensions added 2022–2023
4. **MMDA bus route data portal**: No public open data API or dataset found — MMDA website has limited machine-readable data
5. **Former Type A/B/C routes**: Historical pre-pandemic routes partially restored — need LTFRB bus franchise analysis (already done in prior run)

---

## Sources

- TopGear.com.ph EDSA Busway 2025 Guide: https://www.topgear.com.ph/mobility/edsa-busway-2025-guide-stops-fares-and-commuter-tips-a4682-20251022-lfrm
- edsacarousel.ph route map: https://edsacarousel.ph/route-map/
- edsacarousel.com: https://edsacarousel.com/
- MMDA Resolution No. 03-28 (2003): https://mmda.gov.ph/13-legal-matters/mmc-resolutions/88-mmda-resolution-no-03-28.html
- UP NCTS EDSA Bus Segregation study: https://ncts.upd.edu.ph/tssp/wp-content/uploads/2019/09/TSSP2019-10_Examining-the-MMDA-Bus-Segregation-Scheme-in-EDSA.pdf
- PCO MMDA/DOTr Busway upgrade announcement: https://pco.gov.ph/other_releases/dotr-mmda-inaugurate-new-and-improved-edsa-busway-stations-and-smart-traffic-surveillance-system/
- phbus.com Metro Manila bus routes: https://phbus.com/metro-manila-bus-routes/
- ltoportal.ph Metro Manila bus guide: https://ltoportal.ph/metro-manila-bus-routes-schedules-fares/
- OpenStreetMap Wiki MM bus routes: https://wiki.openstreetmap.org/wiki/Metro_Manila/Bus_routes
