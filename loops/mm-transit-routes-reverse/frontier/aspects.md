# Metro Manila Transit Routes — Frontier

## Statistics
- Total aspects: 82
- Analyzed: 15
- Pending: 67
- Convergence: 18%

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
- [ ] Apple Maps transit — Manila routes available
- [ ] Grab transport — GrabBus routes, Grab shuttle routes if any
- [ ] Chalo app Metro Manila — real-time GPS bus/jeepney tracking, route database underlying live tracking system
- [ ] Komyut app (github.com/vrymel/komyut) — open-source Filipino route planner, extract jeepney route dataset from GitHub repo

### Open Data & Mapping Projects
- [ ] OpenStreetMap — transit relations for NCR, bus routes, jeepney routes tagged
- [ ] OpenStreetMap — stop/station nodes tagged as bus_stop, platform, etc.
- [ ] Mapillary/KartaView — street-level imagery of route signage and terminals
- [ ] Open Transit Data initiatives — any GTFS feeds published for Manila
- [ ] TUMI Datahub Manila GTFS — DOTr/LRTA/LTFRB/MRTC/PNR-affiliated GTFS dataset (hub.tumidata.org/dataset/gtfs-manila)
- [ ] SafeTravelPH — crowdsourced bus operational data, GPS stop coordinates, EDSA Carousel research
- [ ] Citizen mapping projects — community-driven route mapping efforts (OpenRouteService, etc.)

### Academic & International Organization Studies
- [ ] JICA Metro Manila transport studies — MMUTIS, Dream Plan, route surveys
- [ ] World Bank Manila transport projects — route data from feasibility studies
- [ ] Asian Development Bank — Manila public transport improvement projects, route data
- [ ] UP NCTS (National Center for Transportation Studies) — academic papers on Manila routes
- [ ] DLSU/Ateneo/UST transport research — thesis papers on jeepney/bus routes
- [ ] Other academic papers — Google Scholar search for "Metro Manila jeepney routes" and "Metro Manila bus routes"

### Terminal & Operator Sources
- [ ] Cubao terminal complex — all routes departing from Araneta, Ali Mall area, Gateway
- [ ] Pasay/EDSA terminal — all routes from Pasay rotonda, MRT Taft area
- [ ] Monumento terminal area — all routes from Monumento, Victory Liner, etc.
- [ ] SM North EDSA terminal — all jeepney/bus routes from SM North transport hub
- [ ] Fairview terminal area — all routes originating from Fairview
- [ ] Baclaran terminal area — all routes from Baclaran, LRT-1 terminus
- [ ] Other major terminals — Divisoria, Quiapo, Lawton, Santa Cruz, Blumentritt
- [ ] Provincial bus operators — Victory Liner, Philtranco, DLTB, JAM, Five Star, Genesis, etc.
- [ ] P2P bus operators — HM Transport, Froehlich, Rrcg, other premium bus services
- [ ] City bus operators — list and routes for each (e.g., Herrera Transport, RRCG, etc.)

### Community & Social Sources
- [ ] Facebook commuter groups — PH Commuters, Manila Commuters, area-specific groups
- [ ] Reddit r/Philippines — transit route discussions, commuter advice threads
- [ ] Twitter/X — #ManilaCommute, transit-related accounts, LTFRB announcements
- [ ] Transit blogs and enthusiast sites — PinoyCommuter, commute guides, route blogs
- [ ] YouTube — jeepney/bus route documentation videos, commuter vlogs with route info
- [ ] Waze community — traffic and route data contributed by Manila drivers

### Specialized Data
- [ ] PNR commuter rail — feeder routes to/from PNR stations
- [ ] LRT-1 feeder routes — jeepney/bus routes connecting to each LRT-1 station
- [ ] LRT-2 feeder routes — jeepney/bus routes connecting to each LRT-2 station
- [ ] MRT-3 feeder routes — jeepney/bus routes connecting to each MRT-3 station
- [ ] BGC Bus system — all BGC bus routes, stops, schedules
- [ ] Makati Loop shuttle — routes and stops if still operating
- [ ] University shuttle services — UP Ikot, DLSU shuttle, and other campus loops that serve as public transit

---

## Wave 2: Cross-Reference & Validation

### By Major Corridor
- [ ] EDSA corridor — all routes using any segment of EDSA, cross-referenced across sources
- [ ] C5 corridor — all routes along C5, including partial-overlap routes
- [ ] Commonwealth Avenue corridor — all routes from Quezon Ave to Fairview
- [ ] España-Quezon Avenue corridor — all routes along this University Belt axis
- [ ] Taft Avenue corridor — all routes along Taft, Buendia, through Pasay
- [ ] Aurora Boulevard corridor — all routes along Aurora from Cubao to Marikina
- [ ] Marcos Highway corridor — all routes from Masinag to Cubao/Santolan
- [ ] Ortigas Avenue corridor — all routes from Pasig to Manila via Ortigas
- [ ] Shaw Boulevard corridor — all routes along Shaw from Mandaluyong to Pasig
- [ ] Rizal Avenue/Marikina corridor — routes through Caloocan, Malabon, into Marikina
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
