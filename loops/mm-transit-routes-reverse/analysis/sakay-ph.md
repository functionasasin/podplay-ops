# Sakay.ph — Route Database Analysis

**Source type**: Transit app / open data platform
**Retrieved**: 2026-02-25
**Coverage**: Metro Manila (NCR), some fringe areas (Bulacan, Laguna, Rizal, Cavite)

---

## Overview

Sakay.ph is the most comprehensive and longest-running transit direction app for Metro Manila, equivalent to Google Maps for jeepneys, buses, and trains. It was originally built for the Philippine Transit App Challenge (pre-2015) and has since become the de facto open transit data steward for the NCR.

Two distinct data tiers exist:
1. **GitHub GTFS feed** (`sakayph/gtfs`, `sakayph/p2p-gtfs`) — static, frozen as of ~2020, publicly available as raw files
2. **Live Route Explorer** (`explore.sakay.ph`) — actively maintained, blocks automated access (HTTP 403), accessed only via app or web browser

---

## Dataset 1: sakayph/gtfs (GitHub, Static)

**URL**: https://github.com/sakayph/gtfs
**Last update on Transitland**: 2020-07-28 (feed dated through June 30, 2020)
**Format**: Full GTFS with all standard files

### Files present
`agency.txt`, `stops.txt`, `routes.txt`, `trips.txt`, `stop_times.txt`, `calendar.txt`, `frequencies.txt`, `shapes.txt`, `feed_info.txt`

### Agencies (6)
| agency_id | Name |
|-----------|------|
| LRTA | Manila Light Rail Transit Authority |
| LTFRB | LTFRB |
| MRTC | Manila Metro Rail Transit Corporation |
| MARINA | Maritime Industry Authority |
| PNR | Philippine National Railways |
| FORT | The Fort Bus (BGC) |

### Routes: ~296–349 (counts vary by fetch method)
- **LRTA**: 2 routes (LRT-1 Baclaran–Roosevelt, LRT-2 Recto–Santolan)
- **LTFRB**: ~294–347 routes (jeepney PUJ + bus PUB)
  - PUJ route IDs: `LTFRB_PUJ1001` through at least `LTFRB_PUJ1xxx`
  - PUB route IDs: `LTFRB_PUB1001` through at least `LTFRB_PUB1xxx`
  - Each bidirectional route is two separate entries (e.g., PUJ1001 and PUJ1002 for same corridor, opposite directions)

### Stops: 2,078
- Geographic bounding box: 14.534°N–14.824°N, 120.901°E–121.086°E
- Coverage: Manila, QC, Makati, Pasay, Caloocan, Valenzuela, Malabon, Mandaluyong + fringe (Bocaue/Santa Maria, Bulacan)

### Route naming convention (old GitHub data)
LTFRB "T-code" naming: `"ORIGIN - DESTINATION via ROAD"` in all caps
Examples:
- `HULO - P. VICTORINO/KALENTONG`
- `A. BONIFACIO - A. MABINI VIA 10TH AVENUE`
- `ALABANG - BACLARAN VIA SAN DIONISIO, ZAPOTE`
- `MONUMENTO-NAIA VIA EDSA COASTAL RD`
- `BACLARAN-MALANDAY VIA EDSA`
- `BACLARAN-NAVOTAS TERMINAL VIA EDSA`
- `ALABANG (STARMALL) LAGRO` (bus)

### Critical limitation
This dataset is **~6 years outdated** (June 2020). It predates:
- Most modern jeepney (MPUJ) consolidation
- 2020–2024 route rationalization (68 bus routes vs 830+ pre-pandemic)
- QCityBus system
- EDSA Busway expansion
- P2P route changes (Froehlich closure, new operators)

---

## Dataset 2: sakayph/p2p-gtfs (GitHub, Static)

**URL**: https://github.com/sakayph/p2p-gtfs
**Status**: Partially outdated (Froehlich franchise expired 2020; MetroExpress may be inactive)
**Routes**: 11

| Route ID | Operator | Route |
|----------|----------|-------|
| P2P_ORTMKT_1 | ROBINSONS | Ortigas → Makati |
| P2P_NEDMKT_1 | FROEHLICH | North EDSA → Makati *(defunct)* |
| P2P_NEDORT_1 | FROEHLICH | North EDSA → Ortigas *(defunct)* |
| P2P_ALAMKT_1 | RRCG | Alabang → Makati |
| P2P_ALAMKT_2 | RRCG | Alabang → Makati (variant) |
| P2P_ALAFRT_1 | ROBINSONS | Alabang Town Center → Market Market |
| P2P_FRVMKT_1 | LINGKODPINOY | Fairview → Makati |
| P2P_BCRALA_1 | METROEXPRESS | Vista Mall → Starmall Alabang |
| P2P_DASALA_1 | METROEXPRESS | Central Mall Dasmariñas → Starmall Alabang |
| P2P_NVLMKT_1 | TASTRANS | Solenad Nuvali → Glorietta |
| P2P_WEEKEND | FROEHLICH | EDSA Weekend Loop *(defunct)* |

---

## Dataset 3: Live Route Explorer (explore.sakay.ph)

**URL**: https://explore.sakay.ph/jeeps (jeepney), /p2p (P2P), /buses (bus)
**Access**: Blocked to automated scraping (HTTP 403)
**Status**: Actively maintained, incorporates DOTr/LTFRB data + crowdsourcing

### Route ID scheme (live/current)
- Traditional jeepney: `DOTR:R_SAKAY_PUJ_XXX` (numbers confirmed up to ~1080+)
- Modern jeepney: `DOTR:R_SAKAY_MPUJ_XXX` (numbers confirmed up to at least **2192**)
- P2P: `P2P:R_XXXXXXXX` (hash-based IDs)

The MPUJ numbering alone indicates **well over 1,000 modern jeepney route entries** in the live system, substantially more than the ~35 documented during 2020.

### Modern jeepney (MPUJ) characteristics (confirmed from live explorer)
- Operating hours: 04:00 AM – 10:00 PM, Mondays to Sundays
- Base fare: PHP 15.00 / first 4 km; PHP 2.20/km succeeding (consistent with LTFRB MC 2023-038)
- Routes confirmed active:
  - Cubao (Diamond) – Roces/Super Palengke (`DOTR:R_SAKAY_MPUJ_827`)
  - Parang, Marikina – Cubao (`DOTR:R_SAKAY_MPUJ_1143`)
  - QMC Loop (`DOTR:R_SAKAY_MPUJ_848`) — Araneta City terminal loop
  - Cubao – Silangan, San Mateo, Rizal (`DOTR:R_SAKAY_MPUJ_1144`)
  - EDSA/Shaw Central – Morong (`DOTR:R_SAKAY_PUJ_923`) — old PUJ code
  - EDSA/Shaw Central – Tipas (Taguig) via San Joaquin (`DOTR:R_SAKAY_PUJ_916`)
  - Muzon Central Terminal, SJDM, Bulacan – Cubao (`DOTR:R_SAKAY_MPUJ_2192`)
  - Boni/Pinatubo – Stop & Shop (`DOTR:R_SAKAY_MPUJ_825`)
  - Roces – Cubao (`DOTR:R_SAKAY_MPUJ_2188`)
  - Punta – Quiapo via Sta. Mesa (`DOTR:R_SAKAY_MPUJ_1031`)

### P2P routes (live, as of 2023–2024)
Currently active P2P routes confirmed from the live platform:
- Cubao – NAIA (UBE Express)
- Dasmarinas – Cubao (Metro Link)
- Eastwood – Makati CBD (Precious Grace Transport Services)
- Glorietta 3 – Calamba (HM Transport Inc.)
- Las Piñas – Makati (San Agustin Transport Service)
- Lawton – Crossing Calamba (HM Transport Inc.)
- Market Market – Calamba (HM Transport Inc.)
- Market Market – SM Calamba (HM Transport Inc., Saturdays)
- Market Market – Balibago (Froehlich Tours) — *franchise status uncertain post-2020*
- Nuvali – Makati (N. Dela Rosa Liner Inc., weekdays)
- Makati – Nuvali (N. Dela Rosa Liner Inc., Saturdays)
- One Ayala – Circuit Makati
- One Ayala – Robinsons Antipolo (Delta Neosolutions)
- One Ayala – Robinsons Novaliches (HM Transport + Robinsons Malls)
- One Ayala – SM Masinag (RRCG Transport)
- Cubao – Baguio (Genesis Deluxe)
- Cubao – Baguio (Joybus Premier)

### Additional modes covered (live app only)
- Pasig River Ferry
- Libreng Sakay (free government service contracting routes)
- QCity Bus (Quezon City free bus system, 8 routes)
- MRT-3, LRT-1, LRT-2, PNR (rail)
- UV Express

---

## Data Quality Assessment

| Dimension | GitHub GTFS (2020) | Live Explorer (2024–2026) |
|-----------|-------------------|--------------------------|
| Completeness | ~296 routes | Unknown total, likely 1,000+ |
| Accuracy | Low (outdated) | Moderate-high |
| Freshness | Frozen Jun 2020 | ~1-month lag for new routes |
| Geometry/shapes | Yes (shapes.txt) | Yes (via app) |
| Stop coordinates | 2,078 stops with lat/lon | More stops, not extractable |
| Automated access | Full (raw GitHub) | Blocked (HTTP 403) |
| Fare data | Outdated fares | Current LTFRB fares |
| Frequency data | Yes (frequencies.txt) | Yes |

### Key data quality challenges (from Sakay.ph CTO statements)
- ~1 month required to fully process and verify new route data
- Government agencies provide Excel/CSV (origin-destination only), not geospatial
- GPS data from operators lacks vehicle identification
- Route changes sometimes announced 3 days before implementation
- De facto data steward role without sustainable funding
- "Everyone wants transport data, but almost no one wants to pay for it"

---

## What Sakay.ph Does NOT Cover
- Real-time vehicle positions (EDSA Busway GPS is separate: tracker.sakay.ph)
- Traditional jeepney real-time tracking (pilot with LTFRB for some routes)
- Provincial bus segments beyond NCR (through routes, not covered)
- Informal/unregistered routes
- City/barangay shuttle services (most)
- Tricycle routes

---

## Implications for This GTFS Project

### High value (use now)
1. **sakayph/gtfs shapes.txt** — The shape geometries for ~296 routes are available even if outdated. Many corridors are unchanged since 2020 and the geometry is still valid.
2. **sakayph/gtfs stops.txt** — 2,078 stop locations with lat/lon are a solid foundation; many stops remain in the same physical location.
3. **P2P route list** — Provides a baseline list of P2P operators and corridors, even if some are defunct.

### Medium value (use with caution)
4. **sakayph/gtfs routes.txt** — Route names/codes need mapping to current LTFRB T-codes and DOTR route IDs. Many traditional jeepney routes have been consolidated or renumbered.
5. **Live explorer route names** — Confirms currently active routes but can't be bulk-extracted.

### Gaps exposed
- No UV Express geometry in GitHub GTFS (not covered as a separate mode)
- Modern jeepney routes (MPUJ_800–2192) are entirely absent from the old GitHub data
- P2P GTFS has 3 defunct Froehlich routes that need removing

---

## New Aspects to Add

None — Transitland and TUMI Datahub are already in the aspects list and reference this same underlying dataset.

---

## Confidence: MEDIUM

The GitHub GTFS is the best available open geometry source for pre-2020 routes. The live platform has significantly more current data but is inaccessible for automated extraction. The MPUJ numbering gap (MPUJ_827 to MPUJ_2192 spanning routes not in GitHub) represents a critical data gap for modern jeepney routes.
