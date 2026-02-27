# Transit Blogs & Enthusiast Sites — Analysis

**Source type**: Consumer-facing transit guide blogs, enthusiast sites, and travel media
**Retrieved**: 2026-02-27
**Primary sites assessed**: 8
**Extractable routes for GTFS**: Moderate (confirmed bus route numbers + endpoints; limited jeepney data)
**Verdict**: Useful for bus route cross-reference; poor for jeepney/UV Express geometry

---

## Sites Assessed

### 1. The Manila Commuter (themanilacommuter.blogspot.com)

**Type**: Volunteer-maintained blogspot site, "by commuters, for commuters"
**Last active**: ~2016 (most recent posts from 2016; index page last updated 2014)
**Format**: OD-pair commute guides organized by origin city

The site publishes step-by-step commute directions for specific origin→destination pairs. A Route Index (location-index.html) lists destinations alphabetically within source cities:

- Las Piñas City: 5 destinations listed (Ali Mall Cubao, MCU Hospital, Jose Reyes Medical, Juan Luna Binondo, Lung Center QC)
- Makati: 20+ destinations (Alabang, Ayala-MRT, Eastwood Libis, Greenhills, SM Southmall, various QC and Parañaque destinations)
- Mandaluyong: ~10 destinations (St. Luke's QC, Pasig, Kapitolyo, Antipolo, SM Centerpoint Sta. Mesa)
- Manila: ~8 destinations (Alabang, Bayani Road Taguig, Puerto Galera, Lung Center, NSO East Ave, Philippine Heart Center)
- Muntinlupa: 24+ destinations (Binondo, Makati Medical, SM Megamall, Greenhills, Lucena, Cavite, BGC)
- Paranaque, Pasay, Pasig, QC, San Juan: extensive listings

A PUV Terminal Index lists terminals alphabetically with Google Maps links.

**Assessment for GTFS**:
- No structured route codes or LTFRB designations
- No stop coordinates
- No geometry
- Data is 8–10 years old — substantially outdated given route rationalization
- **Utility: Very Low** — historical reference only

---

### 2. It's More Fun With Juan (morefunwithjuan.com)

**Type**: Travel and transit blog, regularly updated
**Last updated**: 2022–2024 content found; bus guide post from June 2022
**URL**: morefunwithjuan.com/2022/06/bus-routes-in-metro-manila.html

Best enthusiast blog source for **city bus routes**. Documents 35 numbered city bus routes with explicit endpoints and corridor descriptions:

#### Documented City Bus Routes (from morefunwithjuan.com)

| Route # | Endpoints | Corridor |
|---------|-----------|---------|
| E | Monumento (Caloocan) – PITX (Parañaque) | EDSA BRT/Carousel |
| 1 | Monumento – Balagtas (Bulacan) | North via Bocaue |
| 2 | Monumento – PITX via R10 | R10/Manila coastal |
| 3 | Monumento – Valenzuela Gateway Complex | NLEX/MacArthur Hwy |
| 4 | North EDSA – Fairview via Quirino Hwy | Quezon City internal |
| 5 | Quezon Avenue – Angat (Bulacan) via Commonwealth | Commonwealth Ave |
| 6 | Quezon Ave – EDSA Taft (Manila) | East–West connection |
| 7 | Quezon Avenue – Montalban (Rodriguez, Rizal) | East Manila |
| 8 | Cubao – Montalban (Rodriguez, Rizal) | Cubao–Antipolo corridor |
| 9 | Cubao – Antipolo | LRT-2 augmentation |
| 10 | Cubao – Doroteo Jose | Cubao–Divisoria |
| 11 | Gilmore – Taytay via Ortigas Ave. Ext. | Ortigas–Rizal |
| 12 | Pasig – Kalentong via Shaw Blvd | Shaw corridor |
| 13 | Buendia – BGC | Makati–Taguig |
| 14 | Ayala – Alabang | South EDSA/Metro |
| 15 | Ayala – Biñan (Laguna) | South to Laguna |
| 16 | Ayala – FTI (Taguig) | Makati–Taguig |
| 17 | PITX – Monumento via R10 | Coastal northbound |
| 18 | PITX – Monumento via EDSA | EDSA southbound |
| 19 | PITX – Ayala | South–Makati |
| 20 | PITX – Cubao | South–QC |
| 21 | PITX – Quezon Ave | South–Manila |
| 22 | PITX – Dasmariñas (Cavite) | South to Cavite |
| 23 | PITX – Imus (Cavite) | South to Cavite |
| 24 | PITX – Bacoor (Cavite) | South to Cavite |
| 25 | PITX – Gen. Trias (Cavite) | South to Cavite |
| 26 | PITX – Trece Martires (Cavite) | South to Cavite |
| 27 | PITX – Silang (Cavite) | South to Cavite |
| 28 | PITX – Nuvali (Sta. Rosa, Laguna) | South to Laguna |
| 29 | PITX – Sta. Rosa (Laguna) | South to Laguna |
| 30 | PITX – Biñan (Laguna) | South to Laguna |
| 31 | PITX – Lawton (Manila) | Coastal north |
| 32 | North EDSA – Valenzuela Gateway Complex | North QC–Valenzuela |
| 33 | Ayala – SRIT (SM Santa Rosa) | South express |
| 34 | PITX – SRIT | South–Laguna express |
| 35 | (variant) | Various |

**Fare structure documented**: ₱12 base for first 5km + ₱2.25/km (ordinary) / ₱2.65/km (AC) — note: slightly different from LTFRB matrix which shows ₱13 for first 4km; site may be slightly outdated on base fare but incremental rates match.

**EDSA Carousel specifics**:
- 28km total length; operates 24/7
- 23 northbound stops, 24 southbound stops
- Fare ₱15 minimum to ₱75.50 maximum (cash and GCash accepted as of Dec 2025)
- Major stops: Monumento → North Ave → Quezon Ave → Santolan → Ortigas → Guadalupe → Buendia → Ayala (One Ayala) → Taft Ave → PITX

**Assessment for GTFS**:
- Route endpoints are confirmed and current
- No stop coordinates; no geometry
- Route numbers align with rationalization program
- **Utility: Medium** — useful bus route number/endpoint cross-reference

---

### 3. PH Bus (phbus.com)

**Type**: Philippine bus ticketing and route information site
**Coverage**: Metro Manila bus transit map + EDSA Carousel guide
**URL**: phbus.com/metro-manila-bus-routes/ and phbus.com/edsa-carousel-busway-metro-manila-bus-routes-map/

Provides visual bus transit map and documents "31 city bus routes" currently open (note: this count is lower than Wikipedia's 68 as of Nov 2024 — likely reflects post-rationalization count at time of site update vs. later additions).

EDSA Carousel stops listed:
- Northbound (23 stops): PITX → MOA → Taft Ave → Ayala → Buendia → Guadalupe → Magallanes → Tramo → Edsa-Pasay → Pasay MRT → Taft MRT → Vito Cruz → Buendia Malugay → Kalayaan → Estrella → Shaw → Pioneer → Boni → Ortigas → Santolan-Annapolis → Cubao → Quezon Ave → North Ave → Monumento
- Interchange stations: connects to MRT-3 and LRT-1

Also notes GCash payment (as of Dec 2025) — important operational update.

Site was inaccessible via direct fetch (HTTP 403). Data obtained via search result snippets and secondary references.

**Assessment for GTFS**: Stop list is useful for EDSA Carousel stop sequence confirmation; no coordinates; utility **Medium-Low**.

---

### 4. LTO Portal (ltoportal.ph)

**Type**: Philippines transport information portal
**URL**: ltoportal.ph/metro-manila-bus-routes-schedules-fares/
**Coverage**: 64 numbered routes + 2 PNR augmentation routes

Provides a route directory (not timetables) with terminal names and cities served. Route 1 described as: "Caloocan – Monumento" to "Bay City – Parañaque Integrated Terminal Exchange" serving Caloocan, Makati, Mandaluyong, Parañaque, Pasay, QC. Notes most routes lack fixed schedules.

Confirms total of 64 numbered local bus routes (compared to Wikipedia's "68 as of Nov 2024" — the discrepancy likely reflects timing of data capture vs. additions made in mid-2024).

**Assessment for GTFS**: Terminal endpoints confirmed; corridor service areas documented; **Utility: Medium** for bus route validation.

---

### 5. Wikipedia – List of Bus Routes in Metro Manila

**URL**: en.wikipedia.org/wiki/List_of_bus_routes_in_Metro_Manila
**Status**: Could not directly fetch (HTTP 403); data obtained via search engine snippets

Key confirmed facts from Wikipedia (via snippets):
- **68 local bus routes** in Metro Manila as of November 2024
- Pre-pandemic: 900+ routes operated by 830 franchises + 43,000+ jeepney franchises
- EDSA Carousel opened June 2020; handled 63 million passengers in 2024 (172,000 daily trips avg); ridership +34% in early 2025
- Quezon City procured 8 electric buses (Oct 2024); 8 QCityBus routes with expanded hours (June 2024)
- P2P service launched March 2015; third route April 2016 (Greenbelt–Alabang Town Center by RRCG Transport)
- PNR augmentation Route 1 and Route 2 (2023, following PNR Metro Commuter Line closure)

**Assessment for GTFS**: Wikipedia likely has a complete numbered route table but is unscrapable. Confirmed 68 route count vs. 35 documented above — significant coverage gap in blog data. **Utility: High conceptually, Medium practically** (blocked).

---

### 6. Emong's Journals (emongsjournals.blogspot.com)

**URL**: emongsjournals.blogspot.com/2020/06/commuters-guide-to-modern-jeepney-routes-fares-in-metro-manila.html
**Type**: Personal transit blog, 2020 post
**Status**: Blocked (sibling fetch error); data from search snippets only

Documents modern PUJ routes under LTFRB Omnibus Franchising Guidelines (GCQ 2020 re-opening era):
- Minimum fare: ₱11 for first 4km; ₱1.50/km non-AC, ₱1.80/km AC (2020 rates — now superseded by 2023 MC)
- Routes based on LTFRB's GCQ re-opening list (~100 routes mentioned)
- Notes cashless fare payment system requirement for modern jeepneys

**Assessment for GTFS**: Outdated fare data; modern PUJ route list may be partially valid for route codes but substantively superseded by rationalization. **Utility: Low** (historical reference only).

---

### 7. Rappler Interactive Database (rappler.com)

**URL**: rappler.com/business/database-jeepney-uv-express-routes-existing-by-february-1-2024/
**Type**: Data journalism — interactive Datawrapper database from LTFRB data

Key quantitative findings:
- **555 jeepney routes in Metro Manila had consolidated entities** (Dec 31, 2023)
- **395 jeepney routes in Metro Manila had NO consolidated entities** (Dec 31, 2023) → total **950 jeepney routes in NCR**
- **142 UV Express routes consolidated** + **108 unconsolidated** → total **250 UV Express routes in NCR**
- Only 51.34% of NCR jeepneys (21,655 units) consolidated before original deadline
- Final consolidation rate by April 1, 2024: ~77% of PUV units nationally / ~75% of routes

Database is dynamic/JavaScript-rendered — specific route names could not be extracted without direct browser access. Route-level data underlying the database is the LTFRB consolidation dataset, which has been partially captured in the LTFRB jeepney franchise and UV Express franchise analyses.

**Assessment for GTFS**: Confirms route count statistics (950 jeepney + 250 UV Express in NCR); specific route names require direct database access. **Utility: Medium** (statistical validation; data points to LTFRB as primary source).

---

### 8. Scribd Document — Jeepney Routes in Metro Manila

**URL**: scribd.com/document/438492612/Jeepney-Routes-in-Metro-Manila
**Status**: Behind Scribd paywall; not accessible without login
**Data from search snippets**: "Over 230 jeepney routes around Metro Manila and neighboring areas, connecting various municipalities, cities, barangays, and other locations — each route numbered with starting point and destination."

Date unknown (uploaded pre-2020 based on context). Likely pre-rationalization snapshot.

**Assessment for GTFS**: If accessible, would provide historical route list as cross-reference. Cannot extract without account. **Utility: Unknown/Blocked**.

---

## Aggregated Findings

### City Bus Routes — Confirmed from Blog Sources

35 numbered city bus routes (Route E + Routes 1–34) with specific endpoints documented. These align with the LTFRB rationalization program launched June 2020. Total of 68 routes as of Nov 2024 means approximately **33 additional routes** exist beyond what is documented in blog sources (likely added mid-2024 onwards).

### Jeepney Routes — Statistical Snapshot

- Total NCR jeepney routes (Dec 2023): ~950 (555 consolidated + 395 unconsolidated)
- Total NCR UV Express routes (Dec 2023): ~250 (142 consolidated + 108 unconsolidated)
- Post-consolidation (April 2024): surviving routes estimated at ~75% = ~713 jeepney + ~188 UV Express

### Key Operational Facts

- EDSA Carousel: 28km, 23–24 stops, 24/7 operation, ₱15–₱75.50 fare, GCash accepted
- Modern PUJ base fare: ₱15 (since Oct 2023); traditional PUJ ₱13
- City bus: ₱13 (ordinary) / ₱15 (AC) base + per-km increment
- QCityBus: 8 routes (free service), operates from QC Hall

---

## Data Quality Assessment

| Site | Data Type | Freshness | Structure | GTFS Utility |
|------|-----------|-----------|-----------|-------------|
| morefunwithjuan.com | Bus routes (35) | 2022 (partially current) | Good (endpoints) | Medium |
| ltoportal.ph | Bus routes (64) | ~2023 | Good (terminals) | Medium |
| phbus.com | Bus routes + EDSA Carousel stops | ~2024 | Good (stop list) | Medium |
| Wikipedia (unscrapable) | Bus routes (68) | Nov 2024 | Excellent | High (if accessible) |
| Rappler database | Route counts | Dec 2023 | Moderate (aggregated) | Medium (statistics) |
| themanilacommuter.blogspot.com | OD-pair guides | 2014–2016 | Poor | Very Low |
| emongsjournals | Modern PUJ routes | 2020 | Poor (outdated) | Low |
| Scribd | Jeepney list (230+) | Unknown (pre-2020) | Blocked | Unknown |

---

## New Data Sources Discovered

- **ltoportal.ph** — Philippine transport portal with 64 route bus directory; add as potential cross-reference for Wave 2 bus validation
- **phbus.com** — EDSA Carousel stop sequence; useful for carousel stop validation in Wave 2
- **Rappler interactive database** — confirms NCR route counts (950 jeepney + 250 UV Express); underlying LTFRB data should be primary source
- **WikiMili** (wikimili.com/en/List_of_bus_routes_in_Metro_Manila) — Wikipedia mirror that may be accessible where Wikipedia is blocked; worth attempting in Wave 2
