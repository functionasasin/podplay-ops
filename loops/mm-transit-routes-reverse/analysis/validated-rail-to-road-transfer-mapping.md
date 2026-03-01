# Rail-to-Road Transfer Mapping — Every LRT/MRT/PNR Station

**Aspect**: Wave 2 Validation — Rail-to-road transfer mapping
**Date analyzed**: 2026-03-01
**Method**: Synthesis of existing Wave 1 feeder analyses (lrt1-feeder-routes.md, lrt2-feeder-routes.md, mrt3-feeder-routes.md, pnr-feeder-routes.md) plus cross-reference with corridor validation files.
**Input files**: `raw/lrt1-feeder-routes.json`, `raw/lrt2-feeder-routes.json`, `raw/mrt3-feeder-routes.json`, `raw/pnr-feeder-routes.json`

---

## Summary Statistics

| Line | Stations | Major Hubs (≥5 documented feeders) | Low Coverage (≤2 documented feeders) |
|------|----------|-------------------------------------|---------------------------------------|
| LRT-1 | 25 | 8 (Monumento, Doroteo Jose, Central, Vito Cruz, Gil Puyat, EDSA, Baclaran, PITX) | 7 (FPJ/Balintawak, 5th Ave, R. Papa, Abad Santos, Carriedo, Ninoy Aquino, Dr. Santos) |
| LRT-2 | 13 | 7 (Antipolo, Marikina-Pasig, Santolan, Katipunan, Cubao, Pureza, Legarda, Recto) | 2 (Anonas, V. Mapa) |
| MRT-3 | 13 | 9 (Taft, Ayala, Buendia, Guadalupe, Santolan-Annapolis, Cubao, GMA-Kamuning, Quezon Ave, North Ave) | 2 (Boni, Shaw Blvd) |
| PNR | ~18 stations (SUSPENDED since March 28, 2024) | — | — |
| **TOTAL active stations** | **51** | **24 major hubs** | **11 low-coverage** |

---

## Rail-to-Rail Interchange Nodes

These are the critical points where two or more rail lines cross. They carry the highest transfer volumes.

| Interchange | Lines | Transfer Method | Distance | Status |
|-------------|-------|-----------------|----------|--------|
| **Doroteo Jose / Recto** | LRT-1 ↔ LRT-2 | Elevated walkway, covered | ~113–200 m | **Active** |
| **Taft Avenue / EDSA** | LRT-1 ↔ MRT-3 | Elevated footbridge + Metro Point Mall | ~400 m | **Active** |
| **Araneta Center–Cubao** | LRT-2 ↔ MRT-3 | Gateway Mall → Farmer's Plaza walkway | ~400 m covered | **Active** |
| Blumentritt | LRT-1 ↔ PNR | Street-level crossing | ~50 m | PNR SUSPENDED |
| Gil Puyat / Buendia | LRT-1 ↔ PNR Dela Rosa | Street walk | ~500 m | PNR SUSPENDED |
| Vito Cruz | LRT-1 ↔ PNR Vito Cruz | Street walk | ~1,084 m | PNR SUSPENDED |
| EDSA/Pasay | MRT-3 Taft ↔ PNR EDSA | Street walk | ~200 m | PNR SUSPENDED |

**Key finding**: Only 3 active rail-to-rail interchanges exist. The fourth (PNR) network is entirely suspended and will not return until NSCR opens (~2028–2029).

---

## LRT-1 Station Transfer Map (25 Stations, North to South)

### Tier 1: Major Intermodal Hubs

| Station | City | Key Jeepney/Bus Routes | Rail Transfer | Confidence |
|---------|------|------------------------|---------------|------------|
| **Monumento** | Caloocan | Malabon via Letre; Navotas City Hall via M. Naval; Valenzuela via MacArthur Hwy; Victory Liner/First NLT/RJ Express (provincial) | — | High |
| **Doroteo Jose** | Manila | QC via Rizal Ave; Malabon via MacArthur Hwy; Bataan Transit/Genesis/Phil. Rabbit (northern Luzon); provincial bus terminals (Bataan, Genesis) within walking distance | **LRT-2 Recto** (~113 m walkway) | High |
| **Central Terminal** | Manila | Quiapo–Pier; Divisoria–Lawton; Cubao–Lawton; Baclaran–Lawton via MOA; UST/Dapitan–Lawton; Blumentritt–Lawton; Dasmariñas Bayan–Lawton; Manuela/Alabang–Lawton; Ayala–Lawton; Pasig River Ferry at Lawton | — | High |
| **Vito Cruz** | Manila | CCP Complex–Taft via Vito Cruz; Monumento–Vito Cruz via Rizal/Mabini; Route 309 Nichols–Vito Cruz; T3111 Kamuning–Vito Cruz; Osmeña Hwy buses | — | High |
| **Gil Puyat (Buendia)** | Pasay | Buendia (Crispa)–PRC via P. Tamo; JAM/DLTB (Batangas, Laguna, Lucena, Quezon); Buendia UV Express terminal | — | High |
| **EDSA/Taft** | Pasay | EDSA Carousel (Monumento↔PITX, ₱15–₱74.50); Makati/Taguig/Parañaque jeepneys; Victory Liner/Philtranco terminals | **MRT-3 Taft Ave** (footbridge + Metro Point) | High |
| **Baclaran** | Pasay/Parañaque | Alabang, Blumentritt, Dapitan, Divisoria, Dasmariñas, Imus, Sucat, Zapote, MOA, NAIA (taxis) jeepneys; Baclaran–Sucat (via Parañaque); Sucat–Lawton via MOA | — | High |
| **PITX** | Parañaque | EDSA Carousel south terminus; UBE Express (NAIA T1/2/3/4); PUJs + modern jeepneys to Parañaque/Pasay/Las Piñas; provincial buses (Bicol, Batangas, Laguna, Baguio, W. Mindoro) | — | High |

### Tier 2: Documented Stations (3–5 feeder routes)

| Station | City | Key Feeder Routes | Confidence |
|---------|------|-------------------|------------|
| **Balintawak** | QC | Balintawak Bus Terminal (~160 m); NLEX-bound provincial buses | Medium |
| **Bambang** | Manila | UST/hospital corridor buses; Jose Reyes Memorial/San Lazaro Hospital buses | Medium |
| **Carriedo** | Manila | Quiapo market jeepneys; Chinatown/Binondo access; informal jeepney/FX services | Medium |
| **UN Avenue** | Manila | DLSU/CSB buses/jeepneys; Intramuros/Rizal Park; tourist corridor buses | Medium |
| **Pedro Gil** | Manila | PGH hospital workers buses; Robinsons Place Manila; Malate/Paco/Ermita jeepneys | Medium |
| **Quirino** | Manila | Malate interior jeepneys via San Andres/Adriatico; Manila Zoo; Korea Town corridor | Medium |
| **Libertad** | Pasay | Arnaiz Ave jeepneys to Makati CBD; Divisoria–Libertad via L. Guinto; Baclaran–Blumentritt via L. Guinto; Dapitan–Pasay RTDA | High |
| **Redemptorist-Aseana** | Parañaque | Free modern jeepney to Ayala Malls Manila Bay (9am–9pm, every 30 min) | High |
| **MIA Road** | Parañaque | Roxas Blvd buses/jeepneys; Baclaran–Sucat via Parañaque; free modern jeepney to Ayala Malls MB | High |
| **Ninoy Aquino Ave** | Parañaque | BF Parañaque/SM BF/Multinational Village jeepneys | Low |
| **Dr. Santos** | Parañaque | Makati/Taguig/southern Parañaque/Muntinlupa jeepneys; SM City Sucat (~5-min walk) | Medium |

### Tier 3: Minimal Documentation (≤2 routes, sparse data)

| Station | City | Available Info | Confidence |
|---------|------|----------------|------------|
| **FPJ/Roosevelt** | QC | EDSA buses/jeepneys (general); Congressional Ave/FPJ Ave jeepneys | Medium |
| **5th Avenue** | Caloocan | General Caloocan interior jeepneys and buses | Low |
| **R. Papa** | Manila | La Loma Cemetery access; interior Tondo/Caloocan jeepneys | Low |
| **Abad Santos** | Manila | Inner Tondo/Santa Cruz jeepneys; tricycles for last-mile | Medium |
| **Blumentritt** | Manila | SM San Lazaro; Manila North Cemetery; Sampaloc/Tondo/Santa Cruz interior | Medium |

---

## LRT-2 Station Transfer Map (13 Stations, East to West)

### Tier 1: Major Intermodal Hubs

| Station | City | Key Feeder Routes | Rail Transfer | Confidence |
|---------|------|-------------------|---------------|------------|
| **Antipolo** | Antipolo, Rizal | Cogeo↔Antipolo; Cubao↔Antipolo long-distance jeepney; Bagong Nayon, Buso Buso, Marikina feeders; QCityBus Route 3 (free) | — | High |
| **Marikina-Pasig** | Marikina/Pasig | T238 Cainta→Cubao; T247 Cogeo→Cubao; T239 Cubao→Taytay; T261 Marikina-Pasig via Dela Paz; T242 Calumpang→LRT Katipunan; QCityBus Route 3 (Sta. Lucia stop) | — | High |
| **Santolan** | Pasig | BFCT East Metro Manila Terminal; Cainta→Cubao; Calumpang→Cubao; Antipolo→General Romulo/Aurora Blvd; Rizal Province feeders (Taytay, Angono, Binangonan) | — | High |
| **Katipunan** | QC | UP Katipunan jeepney (into campus); Ikot, Toki, Katipunan, SM North, Philcoa, MRT campus routes; QCityBus Routes 3 and 7 | — | High |
| **Araneta Center–Cubao** | QC | All Cubao terminal routes (Victory Liner, Genesis, RRCG, etc.); UBE Express P2P (NAIA); QCityBus Routes 1, 2, 5; UV Express to Rizal/Marikina | **MRT-3 Cubao** (~400 m Gateway Mall walkway) | High |
| **Pureza** | Manila | Murphy↔North Harbor via Divisoria; Quiapo Barbosa→Santol; Punta→Quiapo; Divisoria→Punta; PUP student routes (walk ~1.5 km or tricycle) | — | High |
| **Legarda** | Manila | Proj. 2&3→Recto; Divisoria→Murphy via Legarda; Lacson→UST; UV Express on Recto; University Belt corridor buses | — | High |
| **Recto** | Manila | Murphy→North Harbor; Blumentritt→Pasay RTDA; Cubao→Divisoria via R. Magsaysay; Gastambide→Divisoria; Navotas→Divisoria via Monumento; T3169 Recto→Roxas via España; T3119 Munoz→Remedios; T3114 Divisoria→Navotas | **LRT-1 Doroteo Jose** (~113 m covered walkway) | High |

### Tier 2: Documented Stations

| Station | City | Key Feeder Routes | Confidence |
|---------|------|-------------------|------------|
| **Betty Go-Belmonte** | QC | Murphy→North Harbor; Divisoria→Sta. Mesa; Cubao (Arayat)→V. Luna | Medium |
| **Gilmore** | QC | Calumpang→Stop & Shop; Project 4→Stop & Shop; Cubao/Eastwood/Divisoria jeepneys | Medium |
| **J. Ruiz** | San Juan | Murphy→North Harbor; SSS Village→Stop & Shop; Divisoria→Murphy; Divisoria→Sta. Mesa | Medium |
| **Anonas** | QC | Buses on Anonas St. (24/7); QCityBus Route 3; Future Metro Manila Subway Station 4 | Medium |

### Tier 3: Minimal Documentation

| Station | City | Available Info | Confidence |
|---------|------|----------------|------------|
| **V. Mapa** | Manila | Magsaysay Blvd corridor jeepneys; tricycles to Santa Mesa interior | Low |

---

## MRT-3 Station Transfer Map (13 Stations, South to North)

### Tier 1: Major Intermodal Hubs

| Station | City | Key Feeder Routes | Rail Transfer | Confidence |
|---------|------|-------------------|---------------|------------|
| **Taft Avenue** | Pasay | EDSA Carousel south; Dapitan/Blumentritt/Baclaran→Pasay RTDA via L. Guinto; Divisoria–Pasay RTDA; Alabang (Starmall) jeepneys; Bicutan/FTI via C5; Victory Liner/Philtranco/Five Star/Genesis/JAM terminals | **LRT-1 EDSA** (footbridge + Metro Point) | High |
| **Ayala** | Makati | BGC Bus EDSA Terminal (all BGC routes); EDSA Carousel; One Ayala transport hub (buses, UV Express); Makati CBD internal e-jeepneys; Route 5 (Malanday–Ayala) | — | High |
| **Buendia** | Makati | Guadalupe–Cartimar via Gil Puyat; SM Cybertwo jeepneys; Salcedo E-Jeep; Legaspi E-Jeep; eSakay to Circuit/Mandaluyong City Hall; EDSA Carousel | — | High |
| **Guadalupe** | Makati | Route 202: Fort Bonifacio Gate 3–Market Market; T266 AFP/PNP Taguig–Guadalupe; FTI–Kayamanan C via C5; M. Almeda Pateros routes; Pasig River Ferry (dock) | — | High |
| **Santolan-Annapolis** | QC | Annapolis–Greenhills jeepney (q15 min); Gate 5–Greenhills loop; Camp Aguinaldo–Greenhills; San Juan–Greenhills–Robinsons Galleria–Rosario; EDSA Carousel; Greenhills Wilson E-Trike (Dec 2024) | — | High |
| **Araneta Center–Cubao** | QC | All Cubao terminal routes; Araneta Center Bus Terminal (Central/Northern Luzon); UBE Express P2P; QCityBus Routes 1, 2, 5; EDSA Carousel; UV Express to Rizal/Marikina | **LRT-2 Cubao** (~400 m Gateway/Farmer's walkway) | High |
| **GMA–Kamuning** | QC | EDSA Carousel Kamuning stop (exclusive to MRT users, July 2024); Timog Ave jeepneys; España Rotonda–Proj. 2&3; JAM Liner and JAC Liner terminals (Southern Luzon) | — | High |
| **Quezon Avenue** | QC | EDSA Carousel; Eton Centris jeepney terminal (Fairview); Quezon Ave jeepneys (Manila/España, QC interior); UP Diliman "MRT" campus route | — | High |
| **North Avenue** | QC | EDSA Carousel north terminus; SM North EDSA Terminal (Fairview, Novaliches, Bulacan); Marcos Ave–Quirino Hi-way via T. Sora; Lagro–Rizal Ave; buses to Commonwealth/Bulacan | — | High |

### Tier 2: Documented Stations

| Station | City | Key Feeder Routes | Confidence |
|---------|------|-------------------|------------|
| **Magallanes** | Makati | PRC sign jeepneys; FTI–Kayamanan C via Chino Roces; Ayala–Mantrade via Pasong Tamo; Pio del Pilar/Kayamanan-C/San Lorenzo/Taguig destination jeepneys | Medium |
| **Ortigas** | Mandaluyong/Pasig | EDSA Carousel; Ortigas Ave jeepneys east (Pasig, Cainta, Taytay) and west; city buses; UV Express from Ortigas CBD | Medium |
| **Shaw Boulevard** | Mandaluyong | Shaw Blvd jeepneys to Pasig (from Parklea Centre exit only); Shangri-La Plaza (direct connection) | Medium |

### Tier 3: Minimal Documentation

| Station | City | Available Info | Confidence |
|---------|------|----------------|------------|
| **Boni** | Mandaluyong | RTU jeepney; Kapitolyo (Pasig) jeepneys via Boni Ave. | Low |

---

## PNR Station Map (SUSPENDED — Historical Record)

**Status**: All Metro Manila PNR operations suspended March 28, 2024 for NSCR construction. Expected reopening as NSCR: ~2028–2029.

### Active Replacement Routes (LTFRB MC 2023-020)

| Route | Mode | Units | Corridor Served |
|-------|------|-------|-----------------|
| FTI–Divisoria via East Service Road | Public Bus | 30 | FTI, Nichols, EDSA, Buendia/Dela Rosa, Vito Cruz, Paco |
| Alabang (Starmall)–Divisoria via SLEX | Public Bus | 25 | Alabang, Sucat, Bicutan — full south corridor |
| Malabon–Divisoria | Modern Jeepney (MPUJ) | 5 | Gov. Pascual, Sangandaan, Asistio north section |

### Historical Station-to-Road Connections (Pre-March 2024)

| PNR Station | City | Historical Feeder Routes | Nearest Active Rail |
|-------------|------|--------------------------|---------------------|
| Tutuban | Manila (Tondo) | Divisoria/Abad Santos jeepneys; LRT-1 Bambang (~14-min walk) | LRT-1 Bambang |
| Blumentritt | Manila | — | LRT-1 Blumentritt (direct, now sole rail here) |
| España | Manila | T3169 Recto–Roxas via España; Florida Bus/Sampaloc Bus Terminal/Victory Liner Sampaloc; University Belt routes | LRT-2 Recto (~1 km walk) |
| Vito Cruz | Manila | CCP–Taft; Monumento–Vito Cruz; Route 309 Nichols–Vito Cruz; T3111 Kamuning–Vito Cruz; Osmeña Hwy buses | LRT-1 Vito Cruz (~1 km walk) |
| Dela Rosa (Buendia) | Makati | Buendia buses/jeepneys; Taft Ave corridor | LRT-1 Gil Puyat (~500 m) |
| FTI | Taguig | Route 410 Guadalupe–FTI; Guadalupe–FTI via JP Rizal C5; East Service Road jeepneys; Bicutan UV Express terminal | MRT-3 Guadalupe (via jeepney) |
| Bicutan | Parañaque | Lower Bicutan jeepneys; SLEX buses; Bicutan UV Express Terminal (~602 m) | — |
| Alabang | Muntinlupa | Alabang–Zapote Rd; Manila South Rd; SLEX service road jeepneys; UV Express; P2P; SM Southmall | — |

---

## Key Transfer Corridors and Patterns

### 1. EDSA Carousel Integration with Rail

The EDSA Carousel BRT (₱15–₱74.50) intersects with rail at:
- **North Ave MRT-3** (north terminus)
- **GMA-Kamuning MRT-3** (Kamuning stop, exclusive July 2024)
- **Quezon Ave MRT-3** (Quezon Ave stop)
- **Santolan-Annapolis MRT-3** (Santolan stop)
- **Ortigas MRT-3** (Ortigas stop)
- **Buendia MRT-3** (Buendia stop)
- **Ayala MRT-3** (One Ayala side)
- **Taft Avenue MRT-3 / EDSA LRT-1** (south interchange)
- **PITX LRT-1** (southern terminus)

The Carousel effectively turns MRT-3 into a 2-seat ride to PITX for passengers boarding at northern stations.

### 2. Cubao Multi-Rail Hub

Araneta Center–Cubao is the most complex multimodal node in Metro Manila:
- **LRT-2 + MRT-3** interchange (covered walkway)
- **EDSA Carousel** stop
- **Araneta Center Bus Terminal** (provincial buses, Northern/Central Luzon)
- **Dozens of jeepney routes** to all Metro Manila cities
- **UBE Express P2P** to NAIA terminals
- **QCityBus Routes 1, 2, 5** (free)
- **UV Express** to Rizal Province, Marikina, Montalban

### 3. Recto-Doroteo Jose Hub

The LRT-1/LRT-2 interchange at Recto/Doroteo Jose serves:
- **Provincial buses**: Bataan Transit, Genesis, Philippine Rabbit (northern Luzon provincial), all within walking distance of Doroteo Jose
- **University Belt jeepneys**: Multiple routes to Sampaloc, UST, España corridor
- **Divisoria corridor**: Multiple jeepney routes to Divisoria/Binondo
- **Quiapo**: Short walk (~0.5 km via Evangelista St. from Recto)
- **Aurora Blvd corridor**: Murphy–North Harbor routes cross Legarda/Recto area

### 4. Taft-EDSA / Pasay Rotonda Hub

The LRT-1/MRT-3 interchange at Pasay:
- Most provincial bus terminals in Metro Manila concentrated within ~500 m: Victory Liner (NLEX), Philtranco (Visayas/Mindanao), Five Star (Northern Luzon), Genesis (Bataan/La Union), JAM/DLTB (Southern Luzon)
- EDSA Carousel southbound terminus before PITX
- All southbound EDSA jeepneys (Makati, Taguig, Parañaque, Muntinlupa)
- UBE Express to NAIA (~₱150) from Victory Liner Pasay

### 5. Katipunan Station — University Micro-Hub

LRT-2 Katipunan is unique as the hub for an internal campus transport network:
- 6 UP Diliman campus routes (Ikot, Toki, Katipunan, SM North, Philcoa, MRT-labeled)
- QCityBus Routes 3 and 7 (free)
- Ateneo de Manila walkable across Katipunan Ave. (no jeepney needed)
- Miriam College via UP Katipunan jeepney inside campus

### 6. Lawton / Central Terminal Hub

LRT-1 Central Terminal (Manila) is the transfer point for:
- **Pasig River Ferry** (Lawton dock) — waterway connection to Marikina/Pasig
- 12+ documented jeepney routes radiating to all Manila districts
- Multiple city bus routes (Dasmariñas Bayan, Alabang, Ayala-bound)
- Makati, Parañaque, Muntinlupa (long-haul south) and Caloocan, QC (north)

---

## EDSA Carousel Station co-location at MRT-3

| MRT-3 Station | Carousel Co-location | Notes |
|---------------|---------------------|-------|
| Taft Avenue | Yes (south terminus) | Full stop |
| Magallanes | No | — |
| Ayala | Yes (adjacent, One Ayala side) | Not inside station |
| Buendia | Yes | Full stop |
| Guadalupe | No | — |
| Boni | No | — |
| Shaw Boulevard | No | — |
| Ortigas | Yes | Full stop |
| Santolan-Annapolis | Yes | Full stop |
| Araneta-Cubao | Yes | Full stop |
| GMA-Kamuning | Yes (exclusive, July 2024) | Only via MRT station |
| Quezon Avenue | Yes | Full stop |
| North Avenue | Yes (north terminus) | Full stop |

**EDSA Carousel serves 7 of 13 MRT-3 stations** (plus 2 LRT-1 stations: EDSA and PITX).

---

## Fare Integration Analysis

**No fare integration** exists across rail lines. All transfers require a new fare:

| Transfer | Payment |
|----------|---------|
| LRT-1 ↔ LRT-2 (Doroteo Jose/Recto) | Two separate beep card taps (₱13–₱35 LRT-2; ₱13–₱30 LRT-1) |
| LRT-1 ↔ MRT-3 (Taft-EDSA) | Two separate beep card taps (₱13–₱28 MRT-3) |
| LRT-2 ↔ MRT-3 (Cubao) | Two separate beep card taps |
| Rail → EDSA Carousel | New beep card tap (₱15–₱74.50) |
| Rail → Jeepney | New payment (₱13 minimum jeepney) |

**Beep card** works across LRT-1, LRT-2, MRT-3, and EDSA Carousel (different fare gates, shared card). No rail–road integration.

---

## Conflict Notes

1. **PNR Blumentritt Transfer (LRT-1)**: Still listed on older maps and apps as an active rail-to-rail connection. **Confirmed suspended March 2024** — not operational and should NOT be included in active GTFS.

2. **MRT-3 Ayala EDSA Carousel**: The Carousel stop is at "One Ayala" side, not inside the MRT station. Requires crossing EDSA (overhead bridge) to access. Treated as adjacent, not co-located, in this analysis.

3. **Free Modern Jeepney at Redemptorist-Aseana / MIA Road**: Described as a "temporary promotion." Operationally may have ceased or changed by 2026. Confidence: **Medium** (operational status unconfirmed).

4. **Cubao Walkway Length**: Sources cite ~400 m (Gateway → Farmer's Plaza) for the LRT-2/MRT-3 Cubao transfer. This is a long covered walk, particularly for elderly/PWD passengers, and is not a true same-platform interchange.

---

## Gaps and Unknown Stations

### Stations with Insufficient Feeder Documentation

| Station (Line) | Gap |
|----------------|-----|
| 5th Avenue (LRT-1) | No specific feeder route codes; general Caloocan description only |
| R. Papa (LRT-1) | No route codes; general La Loma/Tondo description only |
| Ninoy Aquino Ave (LRT-1) | Almost no feeder data; new station (opened Nov 2024) |
| V. Mapa (LRT-2) | Only general corridor description; no route codes |
| Boni (MRT-3) | Only 2 routes documented; no headway or frequency data |

### Known Coverage Blind Spots

1. **Caloocan interior** (5th Ave, R. Papa stations): Routes within Caloocan's narrow streets and barangays poorly mapped
2. **New Cavite Extension stations** (Ninoy Aquino Ave, Dr. Santos): Opened November 2024; almost no secondary source documentation yet
3. **Pasig River Ferry integration**: Lawton (LRT-1 Central) and PUP (LRT-2 Pureza area) have ferry access but ferry operational status in 2026 is unconfirmed
4. **PNR replacement routes**: Official 3-route LTFRB replacement documented; actual ridership uptake and augmented routes not tracked

---

## GTFS Implications

### Stop Modeling
- All 51 active rail stations should be modeled as **major stops** in `stops.txt` with their GPS coordinates (available from TUMI Datahub GTFS for LRTA/MRTC)
- Interchange points (Doroteo Jose/Recto, Taft/EDSA, Cubao) need **parent station** modeling with separate stop IDs for each rail line platform
- PITX and Lawton should model as **multi-modal stops** with child stops for each mode

### Transfer Rules
- `transfers.txt` in GTFS should encode the rail-to-rail transfers:
  - Doroteo Jose ↔ Recto: `transfer_type=2`, `min_transfer_time=180` (3 min walk)
  - Taft (LRT-1) ↔ Taft (MRT-3): `transfer_type=2`, `min_transfer_time=300` (5 min walk)
  - LRT-2 Cubao ↔ MRT-3 Cubao: `transfer_type=2`, `min_transfer_time=480` (8 min walk, longer)
- Feeder bus/jeepney routes that terminate at rail stations should use those stops as shared stop IDs

### Priority Routes for GTFS Stops Placement

The following feeder routes have enough detail for stop placement:
1. **EDSA Carousel** — all 18 stops already in TUMI Datahub GTFS
2. **Monumento feeders** (Malabon via Letre, Navotas City Hall, Valenzuela via MacArthur Hwy)
3. **Vito Cruz feeders** (Route 309 Nichols–Vito Cruz; T3111 Kamuning–Vito Cruz)
4. **Cubao/Araneta complex** — stop coordinates from existing analysis
5. **LRT-2 Katipunan UP campus routes** (Ikot, Toki, Katipunan, SM North, Philcoa, MRT) — well-documented, unique micro-transit layer
6. **Guadalupe–FTI Route 202** — well-documented with stop sequences

---

## Overall Confidence Assessment

| Category | Confidence | Notes |
|----------|------------|-------|
| Rail-to-rail interchanges (active) | **High** | 3 interchanges; distances and methods confirmed |
| LRT-1 Tier 1 hub feeders (8 stations) | **High** | Multiple corroborating sources |
| LRT-2 Tier 1 hub feeders (8 stations) | **High** | Multiple corroborating sources |
| MRT-3 Tier 1 hub feeders (9 stations) | **High** | Multiple corroborating sources |
| EDSA Carousel co-location | **High** | Official DOTr/MMDA data |
| Mid-corridor feeder routes | **Medium** | Single or partial sources |
| Low-coverage stations (11) | **Low** | Insufficient documentation |
| PNR active status | **High** (suspended) | Confirmed March 28, 2024 suspension |
| PNR replacement routes | **High** | Official LTFRB MC 2023-020 |
| New Cavite Extension stations | **Low–Medium** | Only opened November 2024 |

---

## Sources

- `analysis/lrt1-feeder-routes.md` — LRT-1 station-by-station feeder inventory (2026-02-28)
- `analysis/lrt2-feeder-routes.md` — LRT-2 station-by-station feeder inventory (2026-02-28)
- `analysis/mrt3-feeder-routes.md` — MRT-3 station-by-station feeder inventory (2026-02-28)
- `analysis/pnr-feeder-routes.md` — PNR feeder routes and replacement services (2026-02-28)
- `analysis/cubao-terminal.md` — Full Cubao terminal route inventory
- `analysis/baclaran-terminal.md` — Full Baclaran terminal route inventory
- `analysis/edsa-busway-system.md` — EDSA Carousel full documentation
- `analysis/bgc-bus-system.md` — BGC Bus routes (feeders to Guadalupe, Ayala MRT-3)
- `analysis/validated-edsa-corridor.md` — EDSA corridor cross-reference
- `analysis/tumi-datahub-manila-gtfs.md` — Existing GTFS coordinates for rail stations
