# SafeTravelPH — Analysis

**Aspect**: SafeTravelPH — crowdsourced bus operational data, GPS stop coordinates, EDSA Carousel research
**Date**: 2026-02-26
**Method**: Web search + WebFetch (site is Wix-based, JS-heavy; article bodies not extractable directly)

---

## Source Overview

**SafeTravelPH** (SafeTravel PH Mobility Innovations Organization, Inc.) is a University of the Philippines–affiliated crowdsourcing and analytics platform founded in 2020 as part of the UP COVID-19 Pandemic Response Team. The platform's core product is the **SafeTravelPH app** and the **BEAMS (Bus Efficiency and Analytics Monitoring System)** analytics backend.

- **Institutional home**: UP National College of Public Administration and Governance (NCPAG); partner of UP NCTS
- **Lead researcher**: Dr. Noriel Christopher C. Tiglao (holds patent for the app under UP Diliman)
- **Website**: https://www.safetravelph.org
- **Open Data Inventory**: https://www.safetravelph.org/data-inventory
- **License**: Open Database License (ODbLv1)

---

## What the Platform Captures

The SafeTravelPH app collects operational (not planning) data. It is **not a route database** — it documents how existing routes perform in the field.

| Data Type | Detail |
|-----------|--------|
| GPS vehicle location | ~1 sample/second when connectivity is good |
| Boarding/alighting events | Driver taps button per passenger |
| Bus occupancy | Derived from cumulative boarding/alighting |
| Arrival time at stops | Timestamped per stop |
| Average operating speed | Computed from GPS track |
| Dwell time at stops | Duration bus sits at each stop |
| OBD data (optional) | Engine RPM, speed, fuel level via on-board diagnostics |

**Known data quality issues:**
- GPS accuracy degrades near tall buildings (EDSA building canyon)
- Occupancy data depends on driver compliance with boarding/alighting buttons
- Data gaps when phone battery dies or connectivity drops
- Low GPS compliance rate noted in published studies

---

## EDSA Busway / Carousel Deployment (Primary NCR Dataset)

SafeTravelPH's most significant Metro Manila deployment was the **EDSA Busway study**, July 11–28, 2023. 74 devices were deployed; 68 were active at peak.

**Key data collected:**
- GPS tracks for buses on the EDSA Carousel
- Boarding/alighting counts at each of 21 stops
- Dwell times, operating speeds, headways
- Precise GPS coordinates of all 21 stops (mapped during field surveys using the app)
- OBD data from participating buses

This data was used to build a **microsimulation model in AIMSUN** to evaluate travel time, delay, and environmental impact under various traffic scenarios.

---

## EDSA Carousel Route Data (Extracted from Public Sources)

The EDSA Carousel (Route 1) is Metro Manila's primary BRT-style service. Stop data extracted from TopGear PH and Philippine Beaches:

**Endpoints:** Monumento (Caloocan) ↔ PITX (Parañaque Integrated Terminal Exchange, Pasay)
**Length:** ~28 km
**Operation:** 24/7 (most buses 4 AM–11 PM; reduced late-night service midnight–4 AM)
**Payment:** Cash; GCash accepted as of December 2025; Beep Card accepted

### Southbound Stops (Monumento → PITX): 24 stops
1. Monumento
2. Bagong Barrio
3. Balintawak (LRT-1 interchange)
4. Kaingin
5. Fernando Poe Jr./Roosevelt (LRT-1 interchange)
6. SM North EDSA
7. North Avenue (MRT-3 interchange)
8. Philam QC
9. Quezon Avenue
10. Kamuning (MRT-3 interchange)
11. Nepa Q-Mart
12. Main Avenue
13. Santolan-Annapolis (MRT-3 interchange)
14. Ortigas (MRT-3 interchange)
15. Guadalupe (MRT-3 interchange)
16. Buendia (MRT-3 interchange)
17. One Ayala (MRT-3 interchange)
18. Tramo
19. Taft Avenue (MRT-3 interchange)
20. Roxas Boulevard
21. SM Mall of Asia
22. DFA
23. Ayala Malls/ASEANA
24. PITX (LRT-1 interchange)

### Northbound Stops (PITX → Monumento): 23 stops
1. PITX (LRT-1 interchange)
2. City of Dreams
3. DFA
4. SM Mall of Asia
5. Roxas Boulevard
6. Taft Avenue (MRT-3 interchange)
7. One Ayala (MRT-3 interchange)
8. Buendia
9. Guadalupe (MRT-3 interchange)
10. Ortigas (MRT-3 interchange)
11. Santolan-Annapolis (MRT-3 interchange)
12. Main Avenue
13. Nepa Q-Mart
14. Kamuning (MRT-3 interchange)
15. Quezon Avenue
16. Philam QC
17. North Avenue (MRT-3 interchange)
18. SM North EDSA
19. Fernando Poe Jr./Roosevelt (LRT-1 interchange)
20. Kaingin
21. Balintawak (LRT-1 interchange)
22. Bagong Barrio
23. Monumento

**Note**: Northbound has one fewer stop (no Tramo stop; southbound One Ayala is at a different location). Most stops are on EDSA median islands accessed via footbridges. Stations at Monumento, Bagong Barrio, Balintawak, SM North EDSA, Philam, Guadalupe, and One Ayala have elevators/escalators.

### Fare Structure
| Category | Minimum Fare | End-to-End |
|----------|-------------|-----------|
| Regular | PHP 15.00 | PHP 74.50 |
| Discounted (Students/Seniors/PWD) | PHP 12.00 | ~PHP 59.60 |

- Distance-based fare; rounded to nearest PHP 0.25
- 20% discount for students, senior citizens, and PWDs

---

## Open Data Inventory — Available NCR Datasets

Based on search results describing the SafeTravelPH data inventory:

| Dataset | Coverage | Data Types | Period |
|---------|----------|-----------|--------|
| EDSA Busway | EDSA Carousel, Metro Manila | Trips, boarding/alighting, ridership tracks, OBD data | 2023 |
| Manila City Electric Tricycle | Manila City | Trips, boarding/alighting, ridership tracks | Unknown |
| Iloilo City PUV City Routes | Iloilo City | Trips, boarding/alighting, **GTFS draft**, ridership tracks | 2024–2025 |
| Baguio & Iloilo Electric PUV | Baguio, Iloilo | Trips, boarding/alighting, Pre/Post-Trip Power Recording | Unknown |
| Bacolod City PUV | Bacolod City | Boarding/alighting per area, actual loading/unloading locations | 2023 |

**Critical finding for this GTFS project**: The EDSA Busway dataset does NOT include a GTFS file or route shapes — it's operational telemetry. A GTFS draft exists only for Iloilo City. The GPS stop coordinates collected during the EDSA study are embedded in the academic papers/microsimulation models, not published as a standalone dataset.

---

## Data Accessibility

- **Download or API**: Datasets are available via the open data inventory page (ODbLv1 license)
- **Wix-based website**: The data inventory page renders via JavaScript; direct scraping is not feasible
- **Contact required**: Some datasets may require a data-sharing request form
- **Academic papers**: Substantial methodology detail published in Philippine Transportation Journal (ncts.upd.edu.ph/tssp) and Research in Transportation Economics

---

## Key Research Publications

1. Tiglao et al. (2021) — "Public Transport Innovations in the Time of Covid-19: Crowdsourcing and Bus Telematics for Promoting Fuel Efficiency and Eco-Driving Practices on the EDSA Busway" [TSSP Vol 4 No. 1]
2. Sanciangco et al. (2023) — Philippine Transportation Journal Vol 7 No. 1 [includes EDSA Busway simulation data]
3. Ollero, Vergel, Tiglao (2024) — "A Microsimulation Model of An Exclusive Bus Lane: The Case of EDSA Busway" [TSSP 2024]
4. Tiglao et al. (2025) — "Digitally enabled collaborative governance for sustaining bus reforms on the EDSA Busway in Metro Manila" [Research in Transportation Economics]

---

## Data Quality Assessment

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Currency | High | EDSA study was July 2023; carousel has 21 stops as of August 2023 (matches current) |
| Completeness | Low (for GTFS) | Only covers EDSA Carousel operationally; no other NCR routes |
| Accuracy | Medium | GPS data limited by connectivity and compliance issues |
| Accessibility | Medium | Open license but JS-heavy website; may require direct contact |

---

## Contribution to GTFS Build

**What SafeTravelPH provides for this project:**
- Confirms EDSA Carousel stop list (21 stops bidirectional, slightly asymmetric)
- Confirms fare structure (PHP 15 minimum, PHP 74.50 end-to-end, distance-based)
- Confirms 24/7 operation with reduced late-night service
- GPS coordinates for stops exist in the 2023 dataset (not publicly downloadable yet)
- Ridership/frequency data for EDSA Carousel (usable to estimate headways)

**What SafeTravelPH does NOT provide:**
- Jeepney route data for Metro Manila
- City bus routes beyond EDSA Carousel
- UV Express routes
- P2P bus routes

**Recommended action**: Contact SafeTravelPH directly (safetravelph.org/data-inventory) to request EDSA Busway GPS stop coordinate data under ODbL for GTFS stop generation. The data exists and is licensed openly.

---

## Sources

- [SafeTravelPH Open Data Inventory](https://www.safetravelph.org/data-inventory)
- [EDSA Busway Efficiency Assessment (SafeTravelPH)](https://www.safetravelph.org/post/assessing-the-network-efficiency-of-the-edsa-busway)
- [EASTS 2021 Conference Paper — Crowdsourcing & EDSA Busway](https://easts.info/on-line/proceedings/vol.13/pdf/PP3045_R1_F.pdf)
- [TSSP 2021 Vol 4 No. 1 — Tiglao et al.](https://ncts.upd.edu.ph/tssp/wp-content/uploads/2022/02/TSSP-2021-Vol4-No1-05-Tiglao-Tiglao-and-Cruz_F.pdf)
- [TSSP 2023 Vol 7 No. 1 — Sanciangco et al.](https://ncts.upd.edu.ph/tssp/wp-content/uploads/2024/07/TSSP2023-Vol7-No1_01-Sanciangco-and-Others.pdf)
- [TSSP 2024 — Microsimulation Model of EDSA Busway (Ollero et al.)](https://ncts.upd.edu.ph/tssp/wp-content/uploads/2025/01/TSSP2024-Vol7-No2_01-Ollero-Vergel-and-Tiglao.pdf)
- [ScienceDirect — Digitally enabled collaborative governance (2025)](https://www.sciencedirect.com/science/article/abs/pii/S0739885925001167)
- [TopGear PH — EDSA Busway 2025 Guide](https://www.topgear.com.ph/mobility/edsa-busway-2025-guide-stops-fares-and-commuter-tips-a4682-20251022-lfrm)
- [Philippine Beaches — EDSA Carousel Guide](https://www.philippinebeaches.org/edsa-carousel-busway-guide-metro-manila/)
- [EDSA Carousel PH — Route Map](https://edsacarousel.ph/route-map/)
- [UP OVPAA — SafeTravelPH Research Overview](https://ovpaa.up.edu.ph/research/research-investigates-how-crowdsourcing-digital-co-production-and-collaborative-governance-can-modernize-local-public-transport-services/)
