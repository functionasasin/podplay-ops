# Metro Manila Transit Routes — Frontier

## Statistics
- Total aspects: 91
- Analyzed: 74
- Pending: 17
- Convergence: 81%

---

## Wave 1: Data Source Research

### Official Government Sources
- [x] LTFRB franchise database — jeepney route franchises, route designations, operator names
- [x] LTFRB franchise database — bus route franchises, provincial and city bus operators
- [x] LTFRB franchise database — UV Express route franchises and operator lists
- [x] LTFRB fare matrices — current fare tables for jeepney, bus, UV Express by route type
- [x] DOTr (Department of Transportation) — published transit plans, route maps, modernization data
- [x] MMDA traffic engineering — bus route assignments, EDSA Busway routes, traffic management data
- [x] EDSA Busway system — all carousel routes, stops, schedules, fare structure
- [x] LTFRB modernization program — modern jeepney routes, consolidated routes, new franchises
- [x] LTO/LTFRB route rationalization studies — planned vs actual route changes
- [x] Congress/Senate transportation committee — hearing transcripts on route changes, published reports
- [x] Philippine Statistics Authority — transport sector data, commuter surveys

### Transit App & Platform Data
- [x] Sakay.ph — all routes in their database, route shapes, coverage assessment
- [x] Google Maps transit layer — Manila routes available in Google Transit, GTFS feeds already submitted
- [x] Moovit Manila — routes, user-contributed data, coverage
- [x] Transit app — Manila coverage, real-time data availability
- [x] Apple Maps transit — Manila routes available
- [x] Grab transport — GrabBus routes, Grab shuttle routes if any
- [x] Chalo app Metro Manila — real-time GPS bus/jeepney tracking, route database underlying live tracking system
- [x] Komyut app (github.com/vrymel/komyut) — open-source Filipino route planner, extract jeepney route dataset from GitHub repo
- [x] Komyut AI app (komyut-app.vercel.app) — separate AI-powered Metro Manila transit planner (different from vrymel/komyut); assess route coverage and data extractability

- [x] PinoyCommute.com — static route guide claiming current 2025 fares and terminal info for jeepneys, buses, MRT, LRT; may have structured route listings worth extracting

### Open Data & Mapping Projects
- [x] OpenStreetMap — transit relations for NCR, bus routes, jeepney routes tagged
- [x] OpenStreetMap — stop/station nodes tagged as bus_stop, platform, etc.
- [x] Mapillary/KartaView — street-level imagery of route signage and terminals
- [x] Open Transit Data initiatives — any GTFS feeds published for Manila
- [x] TUMI Datahub Manila GTFS — DOTr/LRTA/LTFRB/MRTC/PNR-affiliated GTFS dataset (hub.tumidata.org/dataset/gtfs-manila)
- [x] SafeTravelPH — crowdsourced bus operational data, GPS stop coordinates, EDSA Carousel research
- [x] Citizen mapping projects — community-driven route mapping efforts (OpenRouteService, etc.)

### Academic & International Organization Studies
- [x] JICA Metro Manila transport studies — MMUTIS, Dream Plan, route surveys
- [x] World Bank Manila transport projects — route data from feasibility studies
- [x] Asian Development Bank — Manila public transport improvement projects, route data
- [x] UP NCTS (National Center for Transportation Studies) — academic papers on Manila routes
- [x] DLSU/Ateneo/UST transport research — thesis papers on jeepney/bus routes
- [x] Other academic papers — Google Scholar search for "Metro Manila jeepney routes" and "Metro Manila bus routes"
- [x] JICA 2022 data collection survey — improving road-based public transportation in Metro Manila (most recent comprehensive official survey)

- [x] JICA CTMP full report (openjicareport.jica.go.jp/pdf/12374831.pdf) — 5-Year Traffic Management Plan approved Nov 2022; contains bus stop relocation data, 209 traffic bottlenecks, 42 major congestion points; may have bus corridor geometry
- [x] FOI portal MMDA CTMP document (foi.gov.ph/agencies/mmda) — FOI-accessible version of CTMP; potentially HTML or non-binary format of bus stop and corridor data
- [x] JICA-DOTr 2024 TCP outputs — "Capacity Development of PUV in Metro Manila" deliverables (route rationalization plans, intermodal hub designs); expected 2025–2027; check DOTr and JICA Philippines for any interim releases

### Terminal & Operator Sources
- [x] Cubao terminal complex — all routes departing from Araneta, Ali Mall area, Gateway
- [x] Pasay/EDSA terminal — all routes from Pasay rotonda, MRT Taft area
- [x] Monumento terminal area — all routes from Monumento, Victory Liner, etc.
- [x] SM North EDSA terminal — all jeepney/bus routes from SM North transport hub
- [x] Fairview terminal area — all routes originating from Fairview
- [x] Baclaran terminal area — all routes from Baclaran, LRT-1 terminus
- [x] Other major terminals — Divisoria, Quiapo, Lawton, Santa Cruz, Blumentritt
- [x] Provincial bus operators — Victory Liner, Philtranco, DLTB, JAM, Five Star, Genesis, etc.
- [x] P2P bus operators — HM Transport, Froehlich, Rrcg, other premium bus services
- [x] City bus operators — list and routes for each (e.g., Herrera Transport, RRCG, etc.)

### Community & Social Sources
- [x] Facebook commuter groups — PH Commuters, Manila Commuters, area-specific groups
- [x] Reddit r/Philippines — transit route discussions, commuter advice threads
- [x] Twitter/X — #ManilaCommute, transit-related accounts, LTFRB announcements
- [x] Transit blogs and enthusiast sites — PinoyCommuter, commute guides, route blogs
- [x] YouTube — jeepney/bus route documentation videos, commuter vlogs with route info
- [x] Waze community — traffic and route data contributed by Manila drivers
- [x] ltoportal.ph bus route directory — 64 numbered city bus routes with terminal names and service areas; cross-reference with Wikipedia for missing routes 36–68
- [x] WikiMili Metro Manila bus routes — Wikipedia mirror (wikimili.com/en/List_of_bus_routes_in_Metro_Manila); may be accessible where Wikipedia is blocked; extract full 68-route table
- [x] QCityBus routes — all 8 Quezon City Government electric bus routes, stops, and schedules

### Specialized Data
- [x] PNR commuter rail — feeder routes to/from PNR stations
- [x] LRT-1 feeder routes — jeepney/bus routes connecting to each LRT-1 station
- [x] LRT-2 feeder routes — jeepney/bus routes connecting to each LRT-2 station
- [x] MRT-3 feeder routes — jeepney/bus routes connecting to each MRT-3 station
- [x] BGC Bus system — all BGC bus routes, stops, schedules
- [x] Makati Loop shuttle — routes and stops if still operating
- [x] University shuttle services — UP Ikot, DLSU shuttle, and other campus loops that serve as public transit

---

## Wave 2: Cross-Reference & Validation

### By Major Corridor
- [x] EDSA corridor — all routes using any segment of EDSA, cross-referenced across sources
- [x] C5 corridor — all routes along C5, including partial-overlap routes
- [x] Commonwealth Avenue corridor — all routes from Quezon Ave to Fairview
- [x] España-Quezon Avenue corridor — all routes along this University Belt axis
- [x] Taft Avenue corridor — all routes along Taft, Buendia, through Pasay
- [x] Aurora Boulevard corridor — all routes along Aurora from Cubao to Marikina
- [x] Marcos Highway corridor — all routes from Masinag to Cubao/Santolan
- [x] Ortigas Avenue corridor — all routes from Pasig to Manila via Ortigas
- [x] Shaw Boulevard corridor — all routes along Shaw from Mandaluyong to Pasig
- [x] Rizal Avenue/Marikina corridor — routes through Caloocan, Malabon, into Marikina
- [ ] Coastal/Roxas Boulevard corridor — all routes along Manila Bay coast

### By NCR City/Municipality
- [ ] Manila (city proper) — validate all routes within/through Manila
- [ ] Quezon City — validate all routes within/through QC
- [ ] Makati — validate all routes within/through Makati
- [ ] Pasig — validate all routes within/through Pasig
- [ ] Taguig/BGC — validate all routes within/through Taguig
- [ ] Mandaluyong — validate all routes within/through Mandaluyong
- [ ] Caloocan — validate all routes within/through Caloocan
- [ ] Las Piñas, Parañaque, Muntinlupa — validate southern Metro Manila routes
- [ ] Marikina, San Juan, Pasay, Malabon, Navotas, Valenzuela, Pateros — remaining cities

### By Mode Validation
- [ ] All jeepney routes — deduplicated master list, confidence scores, gap analysis
- [ ] All city bus routes — deduplicated master list, confidence scores, gap analysis
- [ ] All provincial bus routes (NCR segments) — deduplicated list of NCR portions
- [ ] All UV Express routes — deduplicated master list
- [ ] All P2P premium bus routes — deduplicated master list
- [ ] All shuttle/loop services — BGC, Makati, campus shuttles

### Transfer Points
- [ ] Rail-to-road transfer mapping — every LRT/MRT/PNR station with connecting jeepney/bus routes
- [ ] Terminal-to-terminal connections — how to transfer between major terminals
- [ ] Fare integration analysis — where transfers require separate fares vs integrated payment

---

## Wave 3: GTFS Synthesis

- [ ] Generate agency.txt — list all operators/agencies
- [ ] Generate routes.txt — all validated routes with type, color codes, names
- [ ] Generate stops.txt — all stop locations with lat/lon coordinates
- [ ] Generate stop_times.txt — estimated arrival/departure times per stop
- [ ] Generate shapes.txt — route geometry from best available sources
- [ ] Generate trips.txt — trip patterns for each route
- [ ] Generate fare_attributes.txt and fare_rules.txt — fare structure per route/mode
- [ ] Generate frequencies.txt — headway estimates for peak/off-peak
- [ ] Generate calendar.txt — service patterns (weekday vs weekend vs holiday)
- [ ] GTFS validation — run against GTFS specification, fix errors
- [ ] Coverage quality report — stats on routes mapped, confidence distribution, known gaps
- [ ] Final convergence summary — what's complete, what needs field validation, recommended next steps
