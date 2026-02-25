# LTFRB Fare Matrices — Metro Manila Transit

**Source type**: Official government fare orders, news reports, FOI data
**Retrieved**: 2026-02-25
**Confidence**: High (rates confirmed by multiple authoritative sources)

---

## Summary

LTFRB sets fare rates via memorandum circulars, distinguishing by vehicle type (traditional vs modern), route category (city vs provincial), and service class (ordinary vs air-conditioned). Fares are distance-based for most modes; P2P buses use flat fares. Mandatory 20% discounts apply to senior citizens, PWDs, and students across all modes.

The most recent broad fare adjustment was a ₱1 provisional increase for jeepneys effective **October 8, 2023** (MC No. 2023-038). As of mid-2024, LTFRB declared "no basis" for further hikes despite ongoing transport group petitions.

---

## 1. Public Utility Jeepney (PUJ)

| Vehicle Type | First 4 km (Minimum) | Per Succeeding km |
|---|---|---|
| Traditional PUJ | ₱13.00 | ₱1.80 |
| Modern PUJ | ₱15.00 | ₱2.20 |

**Effective date**: October 8, 2023 (provisional, via LTFRB MC 2023-038)
**Previous rates**: Traditional ₱12 / Modern ₱14 (since 2022)
**Status as of 2024–2025**: Rates remain unchanged. Pending petitions from PASANG MASDA/ALTODAP/ACTO seek an additional ₱2 increase (Traditional to ₱15, Modern to ₱17 minimum). LTFRB said no basis to implement as of May 2024. Petition for ₱15 minimum still under review as of Feb 2025.

**Notes**:
- Historical minimum was ₱9 (traditional) / ₱11 (modern) at start of PUVMP in 2017
- Rate applies nationwide — no NCR-specific surcharge
- Modern PUJ distinction matters for GTFS: two fare schemas exist

---

## 2. Public Utility Bus (PUB) — City Routes

| Bus Type | Minimum Fare (First 5 km) | Per Succeeding km |
|---|---|---|
| Ordinary City Bus | ₱13.00 | ₱2.25 |
| Air-conditioned City Bus | ₱15.00 | ₱2.65 |

**Notes**:
- City bus minimum covers first **5 km** (vs 4 km for jeepneys)
- Air-conditioned city buses dominate NCR (most remaining city buses are AC after modernization)
- Last comprehensive update: 2022

### EDSA Carousel BRT (Special Case)

The EDSA Busway Carousel is an air-conditioned city bus route with its own published fare matrix:

| Parameter | Value |
|---|---|
| Minimum fare (first ~4 km) | ₱15.00 |
| Per km rate | ₱2.65 |
| Maximum fare (Monumento ↔ PITX) | ₱75.50 (southbound) / ₱73.00 (northbound) |
| Route length | 28 km |
| Total stops | 22 southbound / 19 northbound |
| Discounted minimum | ₱12.00 (SC/PWD/students) |

**Selected stop-to-stop fares (southbound, Monumento → PITX)**:

| Stop | Fare from Origin |
|---|---|
| Monumento (MCU) | origin |
| Bagong Barrio | ₱15.00 |
| North Avenue | ₱15.75 |
| Quezon Avenue | ₱19.25 |
| Kamuning | ~₱22 |
| Nepa Q-Mart | ~₱25 |
| Ortigas | ₱36.50 |
| Guadalupe | ~₱43 |
| Buendia | ₱48.00 |
| Ayala (One Ayala) | ~₱52 |
| Tramo/Taft | ~₱62 |
| PITX | ₱75.50 |

**Selected stop-to-stop fares (northbound, PITX → Monumento)**:

| Stop | Fare from Origin |
|---|---|
| PITX / DFA | ₱15.00 |
| Ayala (MRT-3 Ayala) | ₱24.00 |
| Ortigas | ₱38.00 |
| Monumento | ₱73.00 |

**Operating parameters (2024 data)**:
- Hours: 24/7 (peak service 4:00 AM–11:00 PM)
- Ridership: 177,000 daily average; 63,022,953 annual (2024)
- Fleet: 751 authorized buses, 87 operators
- Operators: Mega Manila Consortium Corporation, ES Transport and Partners Consortium
- Oversight: DOTr + MMDA

**EDSA Carousel stop list (northbound, PITX → Monumento)**:
1. PITX (City of Dreams, Parañaque)
2. DFA, Diosdado Macapagal Blvd., Pasay
3. Roxas Blvd Eastbound
4. Taft Median Bus Stop (Eastbound), EDSA
5. MRT-3 Ayala Station, EDSA
6. Buendia Median Stop
7. Guadalupe Median Stop
8. Ortigas Median Stop
9. MRT Santolan-Annapolis Median Stop
10. Main Ave. Median Stop
11. Nepa Q-Mart Median Stop
12. Kamuning Median Stop
13. Quezon Ave. Median Stop
14. Philam
15. North Avenue Median Stop
16. Munoz Median Stop
17. Balintawak LRT-1, EDSA, Quezon City
18. Bagong Barrio, Caloocan Median Stop
19. MCU Median Stop, EDSA, Monumento

**EDSA Carousel stop list (southbound, Monumento → PITX)**:
1. MCU Median Stop, EDSA, Monumento
2. Bagong Barrio, Caloocan Median Stop
3. Kaingin Road Bus Stop, EDSA
4. Munoz Median Stop
5. North Avenue Median Stop
6. Philam Median Stop
7. Quezon Ave. Median Stop
8. Kamuning Median Stop
9. Nepa Q-Mart Median Stop
10. Main Ave. Median Stop
11. MRT Santolan-Annapolis Median Stop
12. Ortigas Median Stop
13. Guadalupe Median Stop
14. Buendia Median Stop
15. One Ayala Terminal
16. Tramo Carousel Station
17. Taft Median Bus Stop (Westbound), EDSA
18. Roxas Blvd Westbound
19. SM Mall of Asia, Pasay City
20. DFA – Office of Consular Affairs
21. Ayala Malls By the Bay Terminal
22. PITX

---

## 3. Public Utility Bus (PUB) — Provincial Routes (NCR Segments)

| Bus Type | Minimum Fare | Per Succeeding km |
|---|---|---|
| Ordinary Provincial Bus | ₱11.00 | ₱1.90 |
| Deluxe Provincial Bus | n/a | ₱2.10 |
| Super Deluxe Provincial Bus | n/a | ₱2.35 |
| Luxury Provincial Bus | n/a | ₱2.90 |

**Notes**:
- Provincial buses passing through NCR charge per-km from point of boarding, not from terminal of origin
- Relevant for commuters boarding at Cubao, Pasay, NLET (North Luzon Expressway Terminal) en route to provinces — GTFS should capture NCR boarding points and fares for in-NCR segments

---

## 4. UV Express (UVE)

### Regulatory Rate Structure (LTFRB UV Express Fare Guide, November 2024)

| Fare Component | Rate |
|---|---|
| Base fare (first 4 km) | ₱13.00 |
| Per succeeding km | ₱1.80 |
| Effective per-km rate | ~₱2.40/km (traditional UVE) |
| Discounted base fare (SC/PWD/student) | ₱9.60 |
| Discounted per km | ₱1.44 |

**Note**: In practice, UV Express routes operate with LTFRB-approved flat fares per route, derived from distance calculation at the time of franchise approval. These flat fares are route-specific and rarely change independently.

### Sample Route-Specific Flat Fares (NCR)

| Route | Approx. Fare |
|---|---|
| SM Fairview – TM Kalaw via Commonwealth | ₱43 |
| Ayala – G. Tuazon | ₱27 |
| Brgy. Fortune (Marikina) – Cubao, QC | ₱21 |
| Lagro – TM Kalaw | ₱50 |
| SM North CIT – TM Kalaw | ₱21 |
| Tandang Sora (Visayas Ave.) – TM Kalaw | ₱32 |
| Malabon – Cubao | ₱30 |
| Malabon – Ayala | ₱44 |
| Cubao – Padilla via Marcos Highway | ₱35 |
| Novaliches – Cubao Farmers' Market | ₱37 |
| Ayala – Suki Market (Mayon) | ₱26 |
| Pembo (Staff House) – Ayala | ₱8 |
| Sto. Niño (Marikina) – Ayala | ₱38 |
| BF Parañaque – Ayala Center | ₱40 |
| Pasig – Ayala Center | ₱16 |
| SM South Mall – Quiapo | ₱57 |
| Lagro – Quiapo via Sauyo | ₱46 |
| Lagro – SM North EDSA | ₱26 |
| Novaliches – Monumento | ₱24 |
| Robinson's Novaliches – Vito Cruz | ₱47 |
| Robinson's Novaliches – Buendia | ₱55 |
| San Bartolome – MRT North Ave. | ₱15 |
| Sucat (Parañaque) – Lawton (Park N Ride) | ₱40 |
| Pasig – SM Megamall via Robinson's Galleria | ₱18 |
| Trinoma Mall – Robinson's Novaliches via Commonwealth | ₱24 |
| Marikina River Bank – Robinson's Galleria | ₱14 |

---

## 5. Premium Point-to-Point (P2P) Bus

P2P buses charge flat fares per route regardless of boarding point. No per-km structure applies.

### HM Transport Inc.

| Route | Regular Fare | Discounted Fare |
|---|---|---|
| BGC (Market! Market!) – Alabang Town Center | ₱120 | ₱100 |
| BGC (Market! Market!) – South Station (Alabang/Muntinlupa) | ₱100 | ₱80 |
| BGC – Calamba | ₱100 | ₱80 |

**Operating days**: Monday–Saturday (some routes Monday–Friday)
**Hours**: Approximately 5:30 AM–7:30 PM (varies by route)

### Froehlich Tours

| Route | Regular Fare (Weekday) | Regular Fare (Weekend) | Discounted |
|---|---|---|---|
| Trinoma – Ayala Center | ₱95 | ₱75 | ₱70 (wkday) / ₱60 (wkend) |
| SM North – Megamall | ₱65 | ₱50 | ₱50 (wkday) / ₱40 (wkend) |
| Skyliner (Saturday only) | ₱100 | ₱100 | ₱80 |

### Other P2P Operators (UBE Express, RRCG/Genesis, DNS)
- Fares typically range ₱50–₱200 depending on route distance
- Most routes serve CBDs (BGC, Ayala, Ortigas, Cubao) to suburban/provincial origins
- Full fare list requires direct operator inquiry or Sakay.ph P2P explorer

---

## 6. Mandatory Fare Discount Framework

### Legal Basis

| Beneficiary | Republic Act | Discount |
|---|---|---|
| Senior Citizens (60+) | RA 9994 (Expanded Senior Citizens Act) | 20% |
| Persons with Disabilities | RA 10754 (Expanded Magna Carta for PWDs) | 20% |
| Students (enrolled Filipino citizens) | RA 11314 (Student Fare Discount Act) | 20% |

### Coverage
- All LTFRB-regulated land transport: jeepney, bus, UV Express, P2P, taxi, TNVS
- All year round including weekends, holidays, semestral breaks (per RA 11314)
- Rail: LRT-1, LRT-2, MRT-3, PNR (via DOTr Legal Service)
- Sea/air: via MARINA/CAB respectively

### Practical Rates (Applied to Current Fares)

| Mode | Regular Min | Discounted Min |
|---|---|---|
| Traditional jeepney | ₱13.00 | ₱10.40 |
| Modern jeepney | ₱15.00 | ₱12.00 |
| Ordinary city bus | ₱13.00 | ₱10.40 |
| AC city bus (incl. EDSA Carousel) | ₱15.00 | ₱12.00 |
| UV Express | ₱13.00 | ₱9.60 (confirmed by LTFRB UVE guide) |

### Cost-Bearing (as of April 7, 2025)
- LTFRB MC 2025-010: Discount cost is the **operator's responsibility**, not the driver's
- This applies to all LTFRB-franchised PUVs including ride-hailing operators

---

## Data Quality Assessment

| Aspect | Quality | Notes |
|---|---|---|
| Jeepney fares | High | Confirmed by multiple government and news sources; Oct 2023 increase well-documented |
| City bus fares | High | Last updated 2022; EDSA Carousel has detailed published matrix |
| Provincial bus fares | Medium | General rates known; NCR-segment calculation method less documented |
| UV Express fares | Medium | Regulatory rate known; individual route flat fares from community/blog sources, may be outdated |
| P2P fares | Medium | Major operators documented; smaller operators (UBE, others) need direct verification |
| Discount framework | High | Three clear Republic Acts; LTFRB enforcement circulars documented |

---

## GTFS Fare Implementation Notes

1. **Jeepney GTFS fare rule**: `fare_attribute` = distance-based; `fare_rule` = per route group (traditional vs modern)
2. **City bus**: Distance-based; EDSA Carousel needs stop-pair fare table (24×24 matrix available from published fares)
3. **UV Express**: Best represented as flat fares per route (`fare_rules.txt` route_id match)
4. **P2P**: Flat fare per route; origin/destination pairs where applicable
5. **Discounts**: Represent as separate `fare_attributes` entries with `price` = 80% of regular; or apply post-processing

## Key Sources

- LTFRB fare-rates page: ltfrb.gov.ph/fare-rates/ (403 blocked; data extracted via news/FOI)
- LTFRB UV Express Fare Guide PDF (November 2024): ltfrb.gov.ph/wp-content/uploads/2024/11/UVE-Fare-Guide.pdf
- PNA report on Oct 2023 provisional hike: pna.gov.ph/articles/1211067
- EDSA Carousel fare matrix: edsacarousel.com/bus-fare/
- P2P fares: spot.ph, moneymax.ph, 4all.casa
- UV Express route fares: thepoortraveler.net/uv-express-routes-manila/
- Student Fare Discount Act: RA 11314, elibrary.judiciary.gov.ph
