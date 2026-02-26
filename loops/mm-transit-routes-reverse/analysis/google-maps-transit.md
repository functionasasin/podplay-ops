# Google Maps Transit Layer — Metro Manila

**Aspect**: Google Maps transit layer — Manila routes available in Google Transit, GTFS feeds already submitted
**Date analyzed**: 2026-02-26
**Method**: Web search + page fetches (EACOMM blog, TUMI Datahub, transit guides)

---

## Summary

Google Maps has **partial** transit coverage for Metro Manila via a GTFS feed maintained by **EACOMM Corporation** (Quezon City-based IT contractor). Coverage launched in 2012 with rail lines only, then expanded to ~40+ bus routes in 2013. As of 2025–2026, Google Maps shows: all 4 rail lines, ~20 intra-NCR bus routes, ~20+ intercity bus routes, and 3 ferry routes. **Jeepney, UV Express, modern jeepney, and P2P bus routes are not in Google Maps transit layer.**

---

## Data Provider

**EACOMM Corporation** is Google's contracted GTFS data provider for the Philippines. EACOMM:
- Was commissioned by Google to build the initial Metro Manila GTFS feed (launched July 2012)
- Built feeds for LRT-1, LRT-2, MRT-3, PNR (all 4 rail lines)
- Expanded to bus and ferry data (announced July 2013)
- Continuously maintains and updates the feed through COVID-19 and route changes
- Also built GTFS for Singapore, Jakarta, Bangkok, and Queensland (Australia)
- Developed prototype Bus Management Information System (BMIS) for DOTr 2014–2017
- Works alongside DOTr's Central Public Utility Vehicle Monitoring System (CPUVMS)

EACOMM does not publish its GTFS feed publicly — it is submitted directly to Google Transit and is proprietary.

---

## What's Available in Google Maps (Metro Manila)

### Rail Lines (complete, 4/4)
| Route | Stations | Status in Google Maps |
|-------|----------|----------------------|
| LRT-1 | Baclaran–Roosevelt (now Fernando Poe Jr.) | ✅ Complete |
| LRT-2 | Recto–Antipolo | ✅ Complete |
| MRT-3 | Taft–North EDSA | ✅ Complete |
| PNR Commuter | Tutuban–Calamba (NCR segment) | ✅ Complete |

Google Maps shows stations, transfer points, travel times, and fare estimates for all 4 rail lines. Example: LRT-2 → MRT-3 → PNR, Marikina to Alabang, ~1 hour, ~₱34.

### City Bus Routes (~20+ of 68 franchised routes)
Google Maps includes a subset of LTFRB-franchised city bus routes. Based on known route examples in EACOMM's data from 2013–2023, coverage includes routes along major corridors (EDSA, Taft, Quezon Ave, Aurora Blvd) but the **full list of 68 routes is NOT covered**. Specific routes confirmed or documented in related sources:
- EDSA Carousel (BRT, likely included)
- Caloocan (Monumento)–Bay City (PITX)
- McKinley Hill–Bay City (PITX)
- Novaliches (SM Fairview)–Bay City (PITX)
- Angono–Quiapo
- Antipolo–Quiapo
- Pasay (Gil Puyat)–Santa Rosa

**Coverage gap**: Only ~20 of 68 local bus routes appear in Google Maps transit layer. Routes added after 2023 rationalization are likely missing or delayed.

### Intercity Bus Routes (~20+ routes)
Routes from Manila terminals to provinces — operators including Victory Liner, Genesis, DLTB, JAM Transit, Five Star, Philtranco. Terminal hubs: Cubao (ARANETA), Pasay, Buendia, NLET. Destinations include Baguio, Batangas, Legazpi, Iloilo (via ferry), etc. ~20+ routes documented; full list not published.

### Ferry Routes (3 routes)
3 intercity RoRo/ferry routes from Manila. These are intercity (e.g., Manila–Cebu area), not the Pasig River Ferry. Specific routes not published.

### NOT in Google Maps Transit
| Mode | Status | Reason |
|------|--------|--------|
| Jeepney (traditional) | ❌ Not available | GTFS incompatible with informal hailing; no fixed stops in LTFRB data |
| Modern jeepney (MPUJ) | ❌ Not available | Same as above; CPUVMS routes in LTFRB GTFS are not pushed to Google |
| UV Express | ❌ Not available | Point-to-point without intermediate stops difficult to model |
| P2P Premium Bus | ❓ Unknown | Possibly some included as intercity bus routes |
| Pasig River Ferry | ❌ Not available | Not in EACOMM feed as of 2023 |
| BGC Bus | ❓ Unknown | May be included as city bus route |

---

## TUMI Datahub GTFS Manila Dataset

A separate, independently published GTFS dataset exists at **hub.tumidata.org/dataset/gtfs-manila**:
- **Agencies**: Manila Light Rail Transit Authority (LRTA), LTFRB, Manila Metro Rail Transit Corporation (MRTC), MARINA, Philippine National Railways (PNR), Fort Bus
- **Download**: `hub.tumidata.org/dataset/5dc13962-f732-4a74-959a-dbe44d21ce5e/resource/37dda9a8-b5b6-4b39-a1df-3069fb43e753/download/manila.zip`
- **Validation**: Passed Canonical GTFS Schedule Validator (MobilityData)
- **Coverage**: Primarily rail + Fort Bus; jeepney not included
- **Data age**: Unknown — may be outdated; license information possibly outdated
- **Useful for**: Rail stop coordinates, agency IDs, route IDs for LRTA/MRTC/PNR

This dataset is separate from the EACOMM/Google feed and is the most publicly accessible official GTFS file.

---

## LTFRB CPUVMS GTFS

The DOTr/LTFRB's **Central Public Utility Vehicle Monitoring System (CPUVMS)** launched in 2021 is:
- Plotting ALL PUV route types in GTFS internally (jeepney, bus, UV Express, etc.)
- Using GPS from franchised vehicles to track real-time positions
- Building toward a GTFS-RT (Realtime) feed based on live GPS data
- **Not publishing GTFS data publicly** as of 2025–2026

EACOMM works with CPUVMS data to update Google Maps feed, but jeepney routes have not been pushed through to Google Maps due to structural challenges (informal stops, hailing-based boarding).

---

## Data Quality Assessment

| Aspect | Assessment |
|--------|------------|
| Rail data | High confidence, complete, regularly updated |
| City bus data | Medium confidence, ~30% of routes covered, may lag behind route changes |
| Intercity bus data | Medium confidence, major operators covered, smaller operators missing |
| Jeepney data | Not in Google Maps — zero coverage |
| UV Express data | Not in Google Maps — zero coverage |
| Geometry | Available for rail (exact), likely estimated for bus |
| Stop coordinates | Rail stops precise; bus stops approximate/terminal-only |
| Fares | Shown for rail; limited/no fare data for bus as of 2013 announcement |
| Frequency/schedules | Rail schedules available; bus frequency estimates only |

**Overall usefulness for this GTFS project**: Medium-low. Google Maps has the 4 rail lines well-covered (which we can use for rail stop coordinates). For bus routes, it provides partial coverage of ~20 routes. No jeepney or UV Express data.

---

## Actionable Data for GTFS Build

1. **Rail stop coordinates**: The TUMI Datahub GTFS (manila.zip) contains lat/lon for all LRT-1, LRT-2, MRT-3, and PNR stops — usable directly.
2. **Bus route list subset**: ~20 LTFRB bus routes are in Google Maps; endpoints and stops can be extracted via Google Maps API (transit route queries).
3. **Route shapes**: Google Maps/EACOMM has bus route shapes for their ~20 routes — not publicly extractable but documented via Sakay.ph gtfs (overlapping coverage).
4. **Gap**: The 48 remaining bus routes, all jeepney routes, and UV Express routes must come from other sources (Sakay.ph, OSM, LTFRB, community data).

---

## Key Sources

- EACOMM blog: https://eacomm.com/blog/metro-manila-transit-data-in-google-maps/
- EACOMM GTFS blog: https://eacomm.com/blog/gtfs-protocol-simplified-mobility-with-it/
- TUMI Datahub Manila GTFS: https://hub.tumidata.org/dataset/gtfs-manila
- Google Transit Partners: https://support.google.com/transitpartners/answer/1111481
- PH transit GTFS technical discussion: https://pleasantprogrammer.com/posts/jeepney-and-bus-routes.html
