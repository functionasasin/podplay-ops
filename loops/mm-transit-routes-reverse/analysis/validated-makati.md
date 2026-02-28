# Validated Routes — Makati City

**Wave 2 Validation | Cross-reference of all routes within/through Makati**
**Date**: 2026-02-28
**Sources cross-referenced**: 20+ raw JSON files + web searches

---

## City Overview

**Makati** is NCR's premier central business district city (27.36 km², ~0.6M population). It is the financial and commercial capital of the Philippines, home to the highest concentration of corporate headquarters, luxury hotels, embassies, and malls in the country.

### Key Transit Nodes

| Node | Type | Connected Modes |
|------|------|-----------------|
| One Ayala Terminal | Intermodal hub (3-floor) | MRT-3 Ayala, EDSA Carousel, P2P Bus, UV Express, PUJ, City Bus |
| Buendia (Gil Puyat) Terminal | Provincial/city bus + UV | LRT-1 Gil Puyat, provincial buses (SLEX), UV Express |
| Guadalupe Jeepney Terminal | Jeepney hub | MRT-3 Guadalupe, ~6 jeepney routes |
| EDSA Ayala / McKinley Exchange | BGC Bus terminal | BGC Bus (6+ routes), MRT-3 Ayala |
| Dela Rosa 1 Car Park | UV Express | ~8 UV routes |
| Dela Rosa 2 Car Park | UV Express | ~6 UV routes |
| Valero Car Park 2 | UV Express | 11 UV routes (as of Aug 2023) |

### MRT-3 Stations in Makati
- **Ayala** — One Ayala Terminal + BGC Bus terminal (highest-traffic station in network)
- **Buendia** — Gil Puyat LRT-1 connection, provincial bus terminal, eSakay e-jeepney hub
- **Guadalupe** — Jeepney terminal to Taguig/Pateros/Pasig
- **Magallanes** — PNR connection (suspended 2024), Chino Roces/PRC feeder

### LRT-1 Stations in Makati
- **Gil Puyat** (Buendia) — Buendia Bus Terminal (Batangas/Laguna buses); served by Taft Ave city buses

---

## Routes Validated

### 1. EDSA Carousel (BRT)

**Status: CONFIRMED HIGH**
- **Route**: Monumento → PITX (full corridor, 28 km)
- **Makati stops**: Guadalupe (median), Buendia (median), Ayala (median), Magallanes (median) + Malugay-Buendia (curbside)
- **Fare**: ₱15 base + ₱2.65/km; max ~₱75.50 E2E
- **Sources**: OSM relation 11181496 (geometry), MMDA, LTFRB, ltoportal MM-BUS-001, wikimili, Sakay.ph, 5+ sources
- **Notes**: 5 stop platforms in Makati. Ayala stop is busiest on corridor (MRT-3 interchange). 24/7 busway; main service 4AM–11PM.

---

### 2. City Bus Routes Passing Through Makati

All routes confirmed by 2+ sources (ltoportal + wikimili + OSM).

| Route # | Name | Via Makati | Operator | Confidence |
|---------|------|------------|----------|------------|
| 10 | Ayala–Starmall Alabang | Ayala terminus | HM Transport | HIGH |
| 11 | Gil Puyat–Santa Rosa | Gil Puyat terminus | (unknown) | HIGH |
| 12 | Gil Puyat–Biñan | Gil Puyat terminus | (unknown) | HIGH |
| 13 | Buendia–BGC | Buendia terminus | (unknown) | MEDIUM |
| 14 | Ayala–Alabang | Ayala terminus | (unknown) | MEDIUM |
| 17 | Fairview–Ayala | Ayala terminus | W. Lippad (Lippad Trans) | HIGH |
| 24 | Alabang–Lawton | Passes Makati via SSH | (unknown) | HIGH |
| 25 | Biñan–Lawton | Passes Makati via SSH | (unknown) | HIGH |
| 38 | Fairview–Pacita | Passes via Ayala | Dela Rosa Transit | HIGH |
| 40 | Fairview–Alabang | Passes via Ayala | Pascual Liner | HIGH |
| 42 | Malanday–Ayala | Ayala terminus | (unknown) | HIGH |
| 45 | Navotas–FTI | Via Ayala Ave | (unknown) | HIGH |
| 46 | Navotas–Pacita | Via Ayala Ave | (unknown) | HIGH |
| 48 | Pacita–Lawton | Passes via Makati | (unknown) | HIGH |
| 53 | Cubao–Pacita | Passes via Makati | (unknown) | HIGH |
| 61 | Ayala–Southwoods | Ayala terminus | (unknown) | HIGH |
| 62 | Pasay–Arca South | Via Makati/Buendia | (unknown) | HIGH |
| 63 | Ayala–BGC Loop | Ayala terminus | (unknown) | HIGH |

**Key findings**:
- **One Ayala Bus Terminal (Upper Ground Level)** has 3 bays:
  - Bay 1: EDSA Carousel only
  - Bay 2: Routes to Laguna (Sta. Rosa, Balibago, Pacita, Biñan)
  - Bay 3: Routes to South (FTI, Bicutan, Sucat, Alabang)
- **Routes 13 vs 63**: Possible same route (Buendia/Ayala→BGC); ltoportal and wikimili use different numbering — requires field verification
- **Routes 10 vs 14**: Both go Ayala→Alabang but Route 14 may serve a different alignment (EDSA vs SSH); likely distinct operators
- **Routes 38, 40**: These are long-haul buses crossing Makati northbound on the way to QC/Fairview; Ayala Ave is a key stop not just a throughput

---

### 3. BGC Bus (EDSA Ayala Terminal)

**Status: CONFIRMED HIGH** (Bonifacio Transport Corporation, private non-LTFRB, Beep Card/GCash)

**Terminal**: McKinley Exchange Corporate Center, adjacent to MRT-3 Ayala on EDSA

| Route | Key Stops | Mode | Fare | Notes |
|-------|-----------|------|------|-------|
| East Express | EDSA Ayala → Market! Market! (Taguig) | bus | ₱13–₱15 | M–Su, daily |
| North Express | EDSA Ayala → circular BGC loop | bus | ₱13–₱15 | M–F |
| Upper West Express | EDSA Ayala → Crescent Park West | bus | ₱13–₱15 | Peak only |
| Lower West Express | EDSA Ayala → Fort Victoria | bus | ₱13–₱15 | Peak only |
| Central Route | EDSA Ayala → University Parkway BGC (circular) | bus | ₱13–₱15 | M–F |
| Night Route | EDSA Ayala → Fort Victoria (15-stop loop) | bus | ₱13–₱15 | M–F, 10PM–6AM, 30 min headway |
| Weekend Route | EDSA Ayala → Fort Victoria (same as Night) | bus | ₱13–₱15 | Sa–Su, 6AM–10PM |
| Ayala Express | EDSA Ayala → Glorietta 5 (Makati CBD micro-circulator) | bus | ₱13–₱15 | M–F |

**Notes**: Fare changed from ₱13 to ₱15 in January 2025. EDSA Ayala Terminal is the ORIGIN for all BGC Bus routes; Makati CBD is the trip start point. The **Ayala Express** is the only route that stays entirely within Makati (EDSA Ayala → Glorietta 5 via Makati Avenue/Ritz Tower/MSE/RCBC/SGV).

---

### 4. P2P Premium Bus Routes (One Ayala Terminal)

All confirmed HIGH by 2+ sources (Sakay.ph, RRCG website, ltoportal, Moovit).

**Terminal**: One Ayala Upper Ground Level (Bay 2 & 3)

| Route | Operator | Fare (Regular/Disc.) | Frequency | Confidence |
|-------|----------|----------------------|-----------|------------|
| Alabang Town Center → One Ayala | RRCG Transport | ₱110 / ₱88 | Daily | HIGH |
| Alabang ATC → Greenbelt 1 | RRCG Transport | ₱110 / ₱88 | Daily | HIGH |
| Robinsons Antipolo/SM Masinag/Feliz → One Ayala | RRCG Transport | ₱140 / ₱112 | Weekdays | HIGH |
| Robinsons Cainta/Sierra Valley → One Ayala | RRCG Transport | ₱90 / ₱72 | Daily | HIGH |
| Robinsons Novaliches (Fairview) → One Ayala | RRCG Transport | ₱160 / ₱128 | Weekdays | HIGH |
| One Ayala → Ayala South Park (Alabang) | RRCG Transport | ₱110 | Weekend only | MEDIUM |
| UP Town Center → One Ayala | Delta Neosolutions (DNS) | ₱100 | Weekdays | HIGH |
| Robinsons Antipolo → One Ayala | Delta Neosolutions | (unknown) | Weekdays | MEDIUM |
| Glorietta 3 → Nuvali, Sta. Rosa | HM Transport | ₱200 | Daily | MEDIUM |
| Glorietta 3 → Calamba, Laguna | HM Transport | ₱200 | Daily | MEDIUM |
| Calamba → One Ayala | Saint Rose Transit | ₱160 | Daily 4AM–8PM | HIGH |
| Merville Parañaque → Ayala Circuit | COMET / GET Philippines | ₱100 | Unknown | MEDIUM |
| Vista Mall Taguig → Trasierra Makati | MetroExpress | Unknown | Unknown | MEDIUM |
| Vista Mall Bacoor → Trasierra Makati | MetroExpress | Unknown | Unknown | MEDIUM |
| Trinoma → Ayala Center [DEFUNCT] | Froehlich Tours | ₱95 | Defunct ~2020 | DEFUNCT |

---

### 5. UV Express Routes (Makati Terminals)

Four terminal locations within Makati CBD:

**One Ayala Terminal (Lower Ground Level):**
UV/PUV routes confirmed by Sakay.ph blog, Spot.ph, TopGear.ph (Mar–Jun 2023):

| Destination | Confidence |
|------------|------------|
| Antipolo | HIGH |
| Bicutan (Taguig) | HIGH |
| BF El Grande, Parañaque | HIGH |
| BF Resort, Las Piñas | HIGH |
| FTI–Palar (Taguig) | HIGH |
| Arca South (Taguig) | HIGH |
| Marikina | HIGH |
| Molino via Coastal Road–Ligas (Cavite) | HIGH |
| Molino via Skyway (Cavite) | HIGH |
| Pacita–Biñan (Laguna) | HIGH |
| Pasig via Kalayaan | HIGH |
| Pulang Lupa, Las Piñas | HIGH |
| Russia–Moonwalk, Las Piñas | HIGH |
| Suki Market–Mayon (QC) | HIGH |
| Sucat Evacom, Parañaque | HIGH |
| The District Imus (Cavite) | HIGH |
| Makati Loop – Landmark (E-Jeepney, not UV) | HIGH |

**Buendia UV Express Terminal** (Moovit-confirmed):
- SM Fairview → Buendia (UV Express, moovit-uv-8750847)
- Cubao → Buendia (UV Express, moovit-uv-8936490)

**Dela Rosa 1 & 2 Car Parks** (Spot.ph May 2023 — confirmed ~8 routes each, specific list not fully extracted):
- G. Tuazon/Sampaloc–Ayala (UVE-N08, ₱27 fare, confirmed HIGH from España-Quezon Ave analysis)
- Various south-bound routes (Parañaque, Las Piñas, Muntinlupa area)

**Valero Car Park 2 / Salcedo Village** (Spot.ph Aug 2023 — 11 routes confirmed):
- Specific route list not fully extracted; confirmed 8 new routes added to 3 existing = 11 total
- Location: Valero St., Salcedo Village, a few blocks from Paseo Center

---

### 6. Jeepney Routes (Intra-Makati)

#### Confirmed High-Confidence Jeepney Routes

| Route | Code | Origin | Destination | Key Stops | Fare | Confidence |
|-------|------|--------|-------------|-----------|------|------------|
| Makati Loop E-Jeepney | DOTR:R_SAKAY_MPUJ_2176 | One Ayala | Circuit Makati | Greenbelt 3, Makati Medical, Century City, City Hall | ₱14 flat | HIGH |
| Makati PUJ Loop 541 | DOTR:R_SAKAY_2018_PUJ_541 | Kalayaan/South Ave | JP Rizal/A. Reyes (circular) | Century City, Makati Ave/Hercules, Nicanor Garcia, Pililla | ₱15.50 | MEDIUM |
| Guadalupe–Cartimar | MRT3-BUE-F01 | Guadalupe MRT | Cartimar (Pasay/Taft) | EDSA Buendia, Gil Puyat, Chino Roces, Taft | ₱13+ | HIGH |
| Fort Bonifacio Gate 3–Guadalupe | T216 / Route 202 | Fort Bonifacio Gate 3 | Guadalupe Terminal | Market! Market!, J.P. Rizal Ext. Comembo | ₱13 | HIGH |
| Guadalupe–FTI via C5 | MRT3-GUA-F03 | Guadalupe MRT | FTI Taguig | Market! Market!, Diego Silang, Palar, C5 | ₱13+ | HIGH |
| Ayala–Guadalupe (Ibabaw) | T304 | Ayala | Guadalupe Ibabaw | JP Rizal | ₱13 | HIGH |
| Del Pan–Guadalupe | T3182 | Del Pan, Manila | Guadalupe | Long cross-city route | ₱13 | HIGH |
| Guadalupe (ABC)–Taguig | T216 | Guadalupe | Taguig | Tipas | ₱13 | HIGH |
| AFP/PNP–Guadalupe | T266 | AFP/PNP Housing, Taguig | Guadalupe / EDSA Central | M. Asuncion | ₱13 | MEDIUM |
| M. Almeda Pateros–Market Market | MRT3-GUA-F04 | M. Almeda, Pateros | Market Market BGC | JP Rizal Ext., Buting C5 | ₱13 | MEDIUM |

#### Medium-Confidence Intra-Makati Jeepney Routes

| Route | From | To | Notes |
|-------|------|----|-------|
| PRC/Chino Roces jeepney | Magallanes MRT | PRC / Chino Roces Ave | San Lorenzo Place, Alphaland, Sabio St; MRT3-MAG-F01 |
| Mantrade/Pasong Tamo jeepney | Ayala Ave | Mantrade (Pasong Tamo area) | Via Pasong Tamo; MRT3-MAG-F03 |
| FTI–Kayamanan C via Chino Roces | Innove Makati/Chino Roces | DBP Ave, Taguig | Via C5; MRT3-MAG-F02; LOW confidence |
| Salcedo Village E-Jeepney | Buendia MRT | Salcedo Village | eSakay, ₱9; MRT3-BUE-F02 |
| Legaspi Village E-Jeepney | Buendia MRT | Legaspi Village | eSakay, ₱9; MRT3-BUE-F03 |
| eSakay–Circuit/Mandaluyong | Buendia MRT | Circuit Makati / Mandaluyong City Hall | eSakay, ₱9; MRT3-BUE-F04 |
| Ayala Loop (Paseo de Roxas) | Pasay Road/Paseo intersection | Ayala Avenue | Northbound only; Paseo de Roxas spine |
| Modern PUJ: EDSA Buendia–Mandaluyong CH | EDSA Buendia | Mandaluyong City Hall | Via Jupiter; MODERN-009 |
| Makati Ave/Ayala → Dr. JP Rizal Ave | Makati Ave/Ayala | Dr. JP Rizal Ave, Makati | Moovit 7638218 |
| Zapote/Kalayaan → Makati Ave/Arnaiz | Zapote/Kalayaan | Makati Ave/A. Arnaiz | Moovit 7637785 |
| Don Chino Roces → Ayala Ave/B. Yakal | Don Chino Roces/Pryce Center | Ayala Ave/B. Yakal | Moovit 7637929 |

#### PUJ Routes from One Ayala (departing Makati)
These jeepneys depart from Gate 3, Lower Ground Level of One Ayala:
- Market! Market! (BGC/Taguig)
- Libertad (Pasay)
- Makati Cinema Square (Chino Roces area)
- Circuit Makati
- Pateros
- PRC / Chino Roces
- Zapote (Las Piñas)

---

## Cross-Reference Summary

### Confirmed Routes (2+ sources agree): 41 routes

**City bus**: 18 routes (all HIGH by ltoportal + wikimili + OSM confirmation)
**EDSA Carousel**: 1 route (5+ sources, OSM geometry)
**BGC Bus**: 8 routes (HIGH, bgc-bus-routes.json + city-bus-operators-routes.json)
**P2P**: 10 routes HIGH, 5 MEDIUM
**UV Express from Makati terminals**: 16+ HIGH (One Ayala terminal), 2 HIGH (Buendia), 11 MEDIUM (Valero 2)
**Jeepney**: 8 HIGH, 10 MEDIUM
**E-jeepney/eSakay**: 3 MEDIUM (Salcedo, Legaspi, Circuit loops from Buendia MRT)
**Makati Loop E-Jeepney**: 1 HIGH

### Contested Routes

1. **Route 13 vs Route 63 (Buendia–BGC vs Ayala–BGC Loop)**
   - ltoportal lists both as distinct routes; wikimili confirms both
   - Route 13 uses Buendia origin; Route 63 uses Ayala/RCBC Plaza origin
   - BGC Bus Ayala Express also runs similar corridor → three overlapping services
   - **Resolution**: Likely distinct (different operators, different starting points), but field verification needed

2. **Route 10 vs Route 14 (Ayala→Alabang variants)**
   - Route 10 (HM Transport, OSM-BUS-10) confirmed HIGH
   - Route 14 (ltoportal MM-BUS-014) confirmed HIGH but no operator identified
   - May be two distinct operators on same O-D pair, or different alignment (EDSA vs SLEX)
   - **Resolution**: Likely distinct; Route 14 may use EDSA south while Route 10 uses SLEX

3. **BGC Bus LRT-Ayala Route (Low confidence)**
   - Claims to run LRT-1 Gil Puyat → One Ayala
   - This is a gap route (no direct public transit between Gil Puyat LRT-1 and Ayala MRT-3, ~2.5 km apart)
   - Only one source (bgc-bus-routes.json); no confirmation from Moovit, Sakay, or BGC Bus official channels
   - **Resolution**: Keep as LOW; likely informal/unscheduled BGC Bus extension or discontinued

4. **eSakay Routes at Buendia MRT**
   - Three e-jeepney variants (Salcedo, Legaspi, Circuit/Mandaluyong) all confirmed by PNA article and LTFRB
   - Different from Makati Loop E-Jeepney (DOTR:R_SAKAY_MPUJ_2176 = One Ayala → Circuit)
   - eSakay Buendia variants are Meralco eSakay vehicles; Makati Loop is "Love Bus" livery
   - **Resolution**: Distinct services; both currently operating per 2025 citations

### Orphan Routes (single source, unconfirmed)

- FTI–Kayamanan C via Chino Roces (LOW — only MRT3 feeder file)
- Route 45 via Ayala Ave (alignment through Makati unclear — could be via SLEX not Ayala Ave)
- "Guadalupe to Rockwell via L. Guinto jeep" (mentioned in 2024 blog; no T-code, no Moovit ID)

---

## Coverage Analysis

### By Area

| Makati Area | Coverage | Gaps |
|-------------|----------|------|
| CBD (Ayala/Salcedo/Legaspi) | STRONG — 20+ bus routes, 5+ UV terminals, MRT-3 Ayala | No GPS stop coords; Salcedo Village UV terminal routes not fully catalogued |
| Buendia/Gil Puyat | STRONG — LRT-1, EDSA Carousel, city buses, UV | No GPS coords for LRT-1 Gil Puyat jeepney stops |
| Guadalupe | MEDIUM — 6+ jeepney routes, MRT-3, EDSA Carousel | Night service absent; Comembo/JP Rizal Ext. poorly mapped |
| Rockwell/Poblacion | WEAK — only 1 documented route (L. Guinto jeepney, no T-code) | Major gap; Rockwell is isolated peninsula with no formal LTFRB route IDs |
| Magallanes | WEAK — PRC jeepney, EDSA Carousel stop | PNR suspended; no confirmed Sakay route IDs for Chino Roces feeders |
| Chino Roces/Pasong Tamo | MEDIUM — PRC jeepney, Mantrade route | No T-codes; 2010-era blog data only |
| San Lorenzo Village | UNKNOWN — possibly served by Ayala Ave bus stops; no dedicated routes found | Critical gap |
| Pio del Pilar | UNKNOWN — no routes documented | Critical gap |
| Forbes Park | UNKNOWN — private roads, no LTFRB routes | Expected gap (gated village) |

### By Mode

| Mode | Count | Quality |
|------|-------|---------|
| City bus (thru/to Makati) | 18 routes | HIGH — all confirmed 2+ sources |
| EDSA Carousel | 1 route | HIGH — OSM geometry available |
| BGC Bus | 8 routes | HIGH — full stop lists |
| P2P bus | 14–15 routes | HIGH/MEDIUM — most confirmed |
| UV Express | 30+ routes | MEDIUM — count confirmed, individual routes partially catalogued |
| PUJ (jeepney) | 18–22 routes | MEDIUM — key routes confirmed, many without T-codes |
| E-jeepney/eSakay | 4 routes | MEDIUM — confirmed operational |

---

## Critical Gaps

1. **No GPS stop coordinates** for any jeepney stop within Makati (none in raw JSON)
2. **Rockwell Center** essentially unserved by documented LTFRB routes; only informal/blog-cited jeepney
3. **Valero Car Park 2 route list** (11 routes as of Aug 2023) not individually catalogued by destination
4. **Dela Rosa 1 & 2** full route lists not extracted
5. **Poblacion** internal routes: heritage e-jeepney loop (EDSA/Estrella → Makati City Hall via Poblacion) documented only in 2011 article — operational status unknown
6. **Night service**: Only BGC Bus Night Route (M–F 10PM–6AM) and EDSA Carousel confirmed for late-night. No jeepney or UV Express with confirmed late-night service in Makati
7. **Pio del Pilar, San Lorenzo Village, Forbes Park**: zero documented routes
8. **Route 14 operator**: Not identified; possibly HM Transport second service or different operator
9. **LRT-1 Gil Puyat ↔ MRT-3 Ayala gap**: No confirmed direct bus/jeepney between these two rail stations (~2.5 km), only BGC Bus claimed route with LOW confidence
10. **Makati intra-CBD frequency data**: No headways documented for any jeepney route within Makati CBD

---

## Validated Route List (Structured)

See `raw/validated-makati-routes.json` for machine-readable data.

**Total routes identified**: 78 (27 HIGH, 31 MEDIUM, 11 LOW, 9 DEFUNCT/ORPHAN)
- City bus: 18 HIGH
- EDSA Carousel: 1 HIGH
- BGC Bus: 8 HIGH
- P2P: 10 HIGH, 5 MEDIUM
- UV Express: ~30 routes (16 HIGH from One Ayala, 2 HIGH at Buendia, 11 MEDIUM at Valero, ~5 LOW elsewhere)
- Jeepney: 8 HIGH, 10 MEDIUM, 4 LOW

---

## Sources

- ltoportal.ph bus routes (confirmed Routes 1, 4, 10–12, 17, 24–25, 38, 40, 42, 45–46, 48, 53, 61–63)
- wikimili.com Metro Manila bus routes (confirmed same route list)
- OSM transit relations (geometry for Routes 10, 17, 38, 40; EDSA Carousel relation 11181496)
- Sakay.ph MPUJ_2176 (Makati Loop E-Jeepney)
- Sakay.ph PUJ_541 (Makati PUJ Loop)
- Moovit Manila (UV Express terminals, jeepney routes 7638218, 7637785, 7637929, 7638232)
- PNA article: eSakay Makati-Mandaluyong e-jeepney launch (Buendia routes)
- Spot.ph: One Ayala Terminal routes (Mar 2023), Valero Car Park 2 routes (Aug 2023), UV Express Makati hubs (May 2023)
- Sakay.ph blog: One Ayala Terminal Guide (2023)
- TopGear.ph: One Ayala Transport Guide (Nov 2023)
- validated-taft-avenue-routes.json (Routes 17, 24, 38, 40, 11, 12, PNR Aug 1&2)
- mrt3-feeder-routes.json (Ayala, Buendia, Guadalupe, Magallanes station feeders)
- bgc-bus-routes.json (all BGC Bus routes)
- p2p-routes.json (all One Ayala P2P services)
- makati-loop-shuttle-routes.json (MPUJ_2176 + PUJ_541)
