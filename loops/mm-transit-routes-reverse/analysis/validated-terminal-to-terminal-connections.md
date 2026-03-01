# Terminal-to-Terminal Connections — Metro Manila

**Aspect**: Wave 2 Validation — Terminal-to-terminal connections
**Date analyzed**: 2026-03-01
**Method**: Synthesis from all terminal analyses (cubao, pasay-edsa, monumento, sm-north-edsa, fairview, baclaran, other-major-terminals), rail feeder analyses, corridor validations, EDSA Busway system, P2P operators, and UV Express routes.
**Input files**: All terminal `analysis/*.md` files, `analysis/validated-rail-to-road-transfer-mapping.md`, `analysis/edsa-busway-system.md`, `analysis/p2p-bus-operators.md`, `analysis/validated-*-corridor.md`

---

## Terminal Network Overview

Metro Manila's major terminal network forms a web anchored on three linear spines running north–south, connected by east–west transfer points and the circular EDSA highway.

### The Three Backbone Spines

| Spine | Route | Mode |
|-------|-------|------|
| **EDSA BRT + Rail** | Monumento ↔ SM North EDSA ↔ Cubao ↔ Ortigas ↔ Pasay/Taft ↔ PITX | EDSA Carousel + MRT-3 |
| **LRT-1 (Taft Ave)** | FPJ/Roosevelt ↔ Monumento ↔ Blumentritt ↔ Central (Lawton) ↔ Gil Puyat ↔ EDSA ↔ Baclaran ↔ PITX ↔ Dr. Santos | LRT-1 |
| **Rizal Ave (jeepney)** | Divisoria ↔ Sta. Cruz ↔ Blumentritt ↔ Monumento | Jeepney |

### The Three Cross-Lines

| Cross-Line | Route | Mode |
|------------|-------|------|
| **LRT-2** | Recto ↔ Cubao ↔ Santolan ↔ Marikina-Pasig ↔ Antipolo | LRT-2 |
| **Ortigas/C5** | Cubao ↔ Ortigas ↔ BGC ↔ FTI ↔ Alabang | Jeepney/UV/P2P |
| **Taft Ave (jeepney)** | Divisoria ↔ Quiapo ↔ Lawton ↔ Libertad ↔ Baclaran | Jeepney |

---

## Major Terminal Inventory

| Terminal ID | Name / Location | Rail Access | EDSA Carousel | Key Modes |
|-------------|-----------------|-------------|---------------|-----------|
| **MON** | Monumento, Caloocan | LRT-1 Monumento | Yes (north terminus) | Jeepney, City Bus, Provincial Bus, EDSA Carousel |
| **SNN** | SM North EDSA / North Avenue, QC | MRT-3 North Ave | Yes | Jeepney, UV Express, P2P, City Bus |
| **CUB** | Cubao, QC | LRT-2 + MRT-3 | Yes | Provincial Bus, P2P, Jeepney, UV Express, City Bus |
| **ORT** | Ortigas Center, Mandaluyong/Pasig | MRT-3 Ortigas | Yes | UV Express, City Bus, P2P |
| **PSY** | Pasay Rotonda / MRT Taft, Pasay | LRT-1 EDSA + MRT-3 Taft | Yes (near south terminus) | Provincial Bus, UV Express, Jeepney |
| **BCL** | Baclaran, Pasay/Parañaque | LRT-1 Baclaran | No (1 km) | Jeepney, UV Express, City Bus |
| **PIX** | PITX, Parañaque | LRT-1 PITX | Yes (south terminus) | Provincial Bus, Jeepney, UV Express |
| **LAW** | Lawton / Central Terminal, Manila | LRT-1 Central | No | Bus (southbound Laguna/Cavite), Jeepney, Pasig River Ferry |
| **BUN** | Buendia Terminal, Pasay/Makati | LRT-1 Gil Puyat | No | Provincial Bus (JAC/JAM/DLTB), UV Express |
| **DIV** | Divisoria, Tondo | LRT-2 Recto (1 km) | No | Jeepney |
| **QUI** | Quiapo, Manila | LRT-1 Carriedo (1 km) | No | Jeepney, City Bus |
| **BGC** | BGC / Market! Market!, Taguig | None | No | BGC Bus, P2P, UV Express |
| **ALA** | Alabang, Muntinlupa | None | No | UV Express, P2P, City Bus, Provincial Bus |
| **SAN** | Santolan, Pasig | LRT-2 Santolan | No | Jeepney (Rizal Province), UV Express |
| **FAI** | Fairview, QC | None | No | Jeepney, UV Express, P2P |
| **FVW_ALT** | Robinsons Novaliches (Fairview area) | None | No | P2P (RRCG to Ayala), P2P (HM to Makati) |

---

## Terminal-to-Terminal Transfer Matrix

### EDSA Corridor Connections (Primary Spine)

These connections use the EDSA Carousel BRT, MRT-3, or both. The Carousel runs 24/7.

#### MON ↔ SNN (Monumento ↔ SM North EDSA)

| Option | Mode | Fare | Travel Time | Notes |
|--------|------|------|-------------|-------|
| **Primary** | EDSA Carousel | ₱15 | 10–15 min | Direct BRT, 24/7 |
| Alternative | Jeepney via EDSA | ₱13 | 15–25 min | Slower but cheap; frequent |
| Alternative | City Bus via EDSA | ₱13–₱20 | 20–30 min | Many operators |

#### MON ↔ CUB (Monumento ↔ Cubao)

| Option | Mode | Fare | Travel Time | Notes |
|--------|------|------|-------------|-------|
| **Primary** | EDSA Carousel (direct) | ₱15–₱25 | 25–45 min | BRT stops at Cubao; 24/7 |
| Alternative | EDSA Carousel + MRT-3 | ₱15 + ₱13 | 30–40 min | Carousel to North Ave, MRT south 1 stop to Cubao |
| Alternative | City bus via EDSA | ₱25–₱40 | 45–75 min | No fixed schedule; overcrowding likely |

#### SNN ↔ CUB (SM North EDSA ↔ Cubao)

| Option | Mode | Fare | Travel Time | Notes |
|--------|------|------|-------------|-------|
| **Primary** | MRT-3 | ₱13 | 5–8 min | 1 stop (North Ave → Cubao); fastest |
| Alternative | EDSA Carousel | ₱15 | 10–15 min | Slightly longer but Carousel has dedicated lane |

#### CUB ↔ ORT (Cubao ↔ Ortigas)

| Option | Mode | Fare | Travel Time | Notes |
|--------|------|------|-------------|-------|
| **Primary** | MRT-3 | ₱15 | 8–12 min | 3 stops (Cubao → Santolan-Annapolis → Shaw → Ortigas); fastest |
| Alternative | EDSA Carousel | ₱20 | 15–25 min | Stops at Ortigas median |
| Alternative | Jeepney via Ortigas Ave | ₱13 | 25–45 min | From Cubao terminal toward Pasig |

#### CUB ↔ PSY (Cubao ↔ Pasay Rotonda)

| Option | Mode | Fare | Travel Time | Notes |
|--------|------|------|-------------|-------|
| **Primary** | MRT-3 | ₱28 | 20–25 min | Full MRT-3 end-to-end; fastest at off-peak |
| Alternative | EDSA Carousel | ₱39–₱50 | 45–75 min | Direct BRT; more predictable travel time than MRT at peak |
| Alternative | City bus via EDSA | ₱25–₱35 | 60–90 min | No dedicated lane; traffic-dependent |

#### PSY ↔ PIX (Pasay Rotonda ↔ PITX)

| Option | Mode | Fare | Travel Time | Notes |
|--------|------|------|-------------|-------|
| **Primary** | EDSA Carousel | ₱15 | 10–15 min | Direct; PITX is Carousel south terminus |
| Alternative | LRT-1 (EDSA → PITX) | ₱15–₱25 | 10–20 min | 3 stops (EDSA → Baclaran → Redemptorist → Ninoy Aquino → MIA → PITX = 4 stops from EDSA Stn) |

Note: PITX is accessible both from the LRT-1 PITX Station (walk ~300m) and the EDSA Carousel south terminus.

#### MON ↔ PSY (Monumento ↔ Pasay Rotonda)

| Option | Mode | Fare | Travel Time | Notes |
|--------|------|------|-------------|-------|
| **Primary** | EDSA Carousel end-to-end | ₱74.50 | 75–120 min | BRT full EDSA run; 24/7 |
| Alternative | City bus via EDSA | ₱35–₱55 | 90–150 min | EDSA traffic-dependent |
| Best practice | EDSA Carousel + MRT-3 | ₱15 + ₱28 | 50–80 min | Carousel to Cubao, MRT south to Taft; fastest off-peak |

---

### LRT-1 Spine Connections

These connections use LRT-1 as the primary mode.

#### MON ↔ LAW (Monumento ↔ Lawton/Central Terminal)

| Option | Mode | Fare | Travel Time | Notes |
|--------|------|------|-------------|-------|
| **Primary** | LRT-1 southbound | ₱25–₱35 | 20–30 min | Monumento → Central Terminal (~9 stops via Abad Santos, Blumentritt, Bambang, Doroteo Jose, Carriedo) |
| Alternative | Jeepney via Rizal Ave | ₱13 | 45–60 min | Monumento → Divisoria → Lawton area |

#### MON ↔ BUN (Monumento ↔ Buendia Terminal)

| Option | Mode | Fare | Travel Time | Notes |
|--------|------|------|-------------|-------|
| **Primary** | LRT-1 southbound | ₱35–₱43 | 30–40 min | Monumento → Gil Puyat (~14 stops) |
| Alternative | EDSA Carousel + MRT-3 | ₱15 + ₱28 | 45–65 min | EDSA Carousel (or MRT) from Monumento/SNN area to Taft, then walk to Buendia |

#### MON ↔ BCL (Monumento ↔ Baclaran)

| Option | Mode | Fare | Travel Time | Notes |
|--------|------|------|-------------|-------|
| **Primary** | LRT-1 southbound | ₱35–₱43 | 35–50 min | Monumento → Baclaran (~16 stops) |
| Alternative | Jeepney then LRT-1 | ~₱13 + ₱25 | 45–70 min | Jeepney to Rizal Ave/Divisoria + LRT south |

#### LAW ↔ BUN (Lawton ↔ Buendia)

| Option | Mode | Fare | Travel Time | Notes |
|--------|------|------|-------------|-------|
| **Primary** | LRT-1 southbound | ₱15–₱25 | 8–12 min | Central Terminal → Gil Puyat (3 stops: UN Ave, Pedro Gil, Quirino, Vito Cruz, Gil Puyat = 4 stops) |
| Alternative | City bus via Taft Ave | ₱13–₱15 | 15–25 min | Slower but no fare gates |

Note: Many JAM/DLTB/JAC provincial bus passengers use this connection to transfer between Lawton (Cavite-bound) and Buendia (Laguna/Quezon-bound).

#### LAW ↔ BCL (Lawton ↔ Baclaran)

| Option | Mode | Fare | Travel Time | Notes |
|--------|------|------|-------------|-------|
| **Primary** | LRT-1 southbound | ₱25–₱30 | 15–20 min | Central → EDSA → Baclaran (6 stops) |
| Alternative | Jeepney via Taft/L. Guinto | ₱13 | 30–45 min | Blumentritt–Baclaran via Mabini/L. Guinto route |

#### BCL ↔ PIX (Baclaran ↔ PITX)

| Option | Mode | Fare | Travel Time | Notes |
|--------|------|------|-------------|-------|
| **Primary** | LRT-1 southbound | ₱15–₱20 | 10–15 min | Baclaran → Redemptorist → Ninoy Aquino → MIA Road → PITX (4 stops, opened Nov 2024) |
| Alternative | Jeepney along Roxas Blvd/MIA Road | ₱13 | 20–35 min | Slower; no dedicated lane |

---

### Inner Manila Jeepney Connections (Historic Core)

These connections are served exclusively or primarily by jeepneys. No rail reaches these nodes directly.

#### DIV ↔ QUI (Divisoria ↔ Quiapo)

| Option | Mode | Fare | Travel Time | Notes |
|--------|------|------|-------------|-------|
| **Primary** | Walk / E-trike | ₱0–₱15 | 10–20 min | ~1.5 km; direct via CM Recto / Quezon Blvd |
| Alternative | Jeepney via CM Recto | ₱13 | 10–20 min | Quiapo–Divisoria–North Harbor route |

#### DIV ↔ LAW (Divisoria ↔ Lawton)

| Option | Mode | Fare | Travel Time | Notes |
|--------|------|------|-------------|-------|
| **Primary** | Jeepney (multiple routes) | ₱13 | 20–30 min | Via Jones Bridge / Quezon Bridge; Divisoria–TM Kalaw route |
| Alternative | LRT-1 via Recto | ₱13 + ₱13 | 25–35 min | Walk to Doroteo Jose/Recto, LRT south to Central; overkill for this short trip |

#### QUI ↔ BCL (Quiapo ↔ Baclaran)

| Option | Mode | Fare | Travel Time | Notes |
|--------|------|------|-------------|-------|
| **Primary** | Jeepney via L. Guinto/Taft | ₱13 | 30–50 min | Blumentritt–Baclaran via L. Guinto; Quiapo is en route |
| Alternative | Jeepney Blumentritt–Pasay RTDA | ₱13 | 35–55 min | Alternative Mabini routing; Baclaran accessible from Pasay RTDA area |

#### MON ↔ DIV (Monumento ↔ Divisoria)

| Option | Mode | Fare | Travel Time | Notes |
|--------|------|------|-------------|-------|
| **Primary** | Jeepney via Rizal Ave | ₱13 | 25–40 min | Direct Monumento–Divisoria route; frequent, high-volume |
| Alternative | LRT-1 southbound to Doroteo Jose | ₱15–₱20 | 20–30 min | Walk ~1 km from Doroteo Jose to Divisoria market |

---

### East–West Cross-Terminal Connections

#### CUB ↔ BGC (Cubao ↔ BGC / Market! Market!)

| Option | Mode | Fare | Travel Time | Notes |
|--------|------|------|-------------|-------|
| **Primary** | MRT-3 to Ayala + BGC Bus | ₱28 + ₱30 | 35–55 min | MRT Cubao → Ayala (5 stops), then BGC Bus any route from EDSA Terminal; most reliable |
| Alternative | Jeepney Cubao→Ortigas + UV Ortigas→BGC | ₱13 + ₱40–₱60 | 50–80 min | Via C5/Ortigas; slower but avoids MRT crowds |
| Alternative | UV Express Cubao → Sierra Valley + jeepney | ₱45 + ₱20 | 60–90 min | Via Ortigas Ext; not recommended for BGC specifically |

#### CUB ↔ ALA (Cubao ↔ Alabang)

| Option | Mode | Fare | Travel Time | Notes |
|--------|------|------|-------------|-------|
| **Primary** | MRT-3 to Taft + UV Express Alabang | ₱28 + ₱80–₱100 | 60–90 min | MRT Cubao → Taft, UV from Savemore/Metropoint; fastest combination |
| Alternative | EDSA Carousel to Taft + UV Express | ₱50 + ₱80–₱100 | 90–120 min | Carousel can be slow; longer total |
| Alternative | City bus end-to-end via EDSA | ₱50–₱75 | 120–180 min | Single-seat ride but very long in traffic |

#### BGC ↔ ALA (BGC ↔ Alabang)

| Option | Mode | Fare | Travel Time | Notes |
|--------|------|------|-------------|-------|
| **Primary** | P2P HM Transport (Market! Market! ↔ ATC Alabang) | ₱120 | 30–60 min | Mon–Fri 5:30AM–7:30PM; direct premium coach |
| Alternative | P2P HM (Market! Market! ↔ South Station Muntinlupa) | ₱100 | 25–50 min | Mon–Sat; partial alternative |
| Alternative | P2P RRCG (One Ayala ↔ ATC) | ₱110 | 30–60 min | Makati origin; BGC riders take BGC Bus to One Ayala first |

#### ORT ↔ BGC (Ortigas ↔ BGC)

| Option | Mode | Fare | Travel Time | Notes |
|--------|------|------|-------------|-------|
| **Primary** | Jeepney or UV Express via C5 | ₱13–₱40 | 20–35 min | Multiple routes along C5 toward BGC gate |
| Alternative | EDSA Carousel to Ayala + BGC Bus | ₱25 + ₱30 | 45–60 min | More reliable but circuitous |

#### SAN ↔ CUB (Santolan LRT-2 ↔ Cubao)

| Option | Mode | Fare | Travel Time | Notes |
|--------|------|------|-------------|-------|
| **Primary** | LRT-2 westbound | ₱15–₱25 | 20–30 min | Santolan → Cubao (multiple stops); primary Rizal corridor link |
| Alternative | Jeepney via Aurora Blvd | ₱13 | 40–60 min | Cainta → Cubao jeepney; longer but cheaper |

#### FAI ↔ SNN (Fairview ↔ SM North EDSA)

| Option | Mode | Fare | Travel Time | Notes |
|--------|------|------|-------------|-------|
| **Primary** | Jeepney via Commonwealth | ₱13 | 20–35 min | Direct from Fairview terminal area toward Quezon Ave / North EDSA |
| Alternative | QCityBus Route 1 (free) | ₱0 | 30–45 min | Free QC electric bus; limited schedule; Cubao to SM Fairview |
| Alternative | UV Express Fairview → Cubao → MRT | ₱25–₱35 + ₱13 | 40–60 min | If going SM North EDSA specifically |

---

### Southern Terminal Connections

#### BCL ↔ ALA (Baclaran ↔ Alabang)

| Option | Mode | Fare | Travel Time | Notes |
|--------|------|------|-------------|-------|
| **Primary** | UV Express (Baclaran terminal) | ₱80–₱100 | 40–60 min | Daily 7AM–10PM; direct Baclaran–Alabang via Coastal Road / SLEX |
| Alternative | LRT-1 to PITX + UV/Bus south | ₱20 + ₱50–₱80 | 50–75 min | More walking; involves PITX transfer |

#### PIX ↔ ALA (PITX ↔ Alabang)

| Option | Mode | Fare | Travel Time | Notes |
|--------|------|------|-------------|-------|
| **Primary** | Provincial/City Bus via SLEX | ₱50–₱100 | 30–50 min | Various Bicol, Batangas, Laguna-bound buses stop at both |
| Alternative | UV Express or van | ₱80–₱120 | 25–45 min | Faster; fewer stops |

#### LAW ↔ PIX (Lawton ↔ PITX)

| Option | Mode | Fare | Travel Time | Notes |
|--------|------|------|-------------|-------|
| **Primary** | LRT-1 end-to-end (southbound) | ₱35–₱43 | 40–55 min | Central Terminal (Lawton) → Dr. Santos end, exit at PITX Station; ~18 stops |
| Alternative | City bus / van via EDSA + coastal | ₱25–₱50 | 60–90 min | Traffic-dependent |

Note: Lawton–PITX is a critical connection for provincial bus passengers: arrive at Lawton from Laguna/Cavite → go south on LRT-1 to PITX → board Bicol/Batangas bus.

---

### Multi-Hop Example Itineraries

The following represent commonly needed cross-terminal journeys that require 2 or more transfers:

#### FAI → ALA (Fairview → Alabang) — Long Cross-City

**Recommended route**:
1. Jeepney/QCityBus Fairview → SM North EDSA (₱0–₱13, 20–35 min)
2. EDSA Carousel or MRT-3 SM North EDSA → Pasay Taft (₱28–₱50, 35–60 min)
3. UV Express Pasay/Metropoint → Alabang (₱80–₱100, 40–60 min)

**Total**: ~₱108–₱163, ~95–155 min, 2 transfers
**Conflict note**: No direct Fairview → Alabang service confirmed in any source. This is the most reliable 3-leg path.

#### MON → BGC (Monumento → BGC)

**Recommended route**:
1. EDSA Carousel Monumento → Ayala EDSA Terminal (₱50–₱60, 50–80 min)
2. BGC Bus from Ayala EDSA Terminal → BGC destination (₱30–₱80, 15–30 min)

**Total**: ~₱80–₱140, 65–110 min, 1 transfer
**Alternative**: MRT-3 North Ave → Ayala (₱28, 20 min) + BGC Bus; faster but requires walking to MRT from Monumento (~10 min).

#### QUI → BGC (Quiapo → BGC)

**Recommended route**:
1. Jeepney Quiapo → Gil Puyat/Buendia (via L. Guinto, ₱13, 20–30 min)
2. Jeepney or UV Express Buendia → BGC (via C5 or McKinley, ₱13–₱40, 20–30 min)

**Total**: ~₱26–₱53, 40–60 min, 1 transfer
**Alternative**: LRT-1 from Carriedo → Gil Puyat (₱15, 12 min) then UV Express/jeepney to BGC.

#### SAN → PIX (Santolan LRT-2 ↔ PITX)

This is a notoriously difficult cross-city journey (east Rizal to south Parañaque).

**Option A (fastest)**:
1. LRT-2 Santolan → Cubao (₱20, 20 min)
2. MRT-3 Cubao → Taft (₱28, 20 min)
3. LRT-1 EDSA → PITX (₱20, 15 min)

**Total**: ~₱68, ~55–80 min, 2 transfers
**Option B (slower, cheaper)**:
1. LRT-2 Santolan → Recto (₱20, 30 min)
2. LRT-1 Doroteo Jose → PITX (₱43, 40 min)

**Total**: ~₱63, ~75–90 min, 1 transfer (walk at Recto/Doroteo Jose)

#### DIV → ALA (Divisoria → Alabang)

**Recommended route**:
1. Jeepney Divisoria → Pasay RTDA (via L. Guinto, ₱13, 40–55 min)
2. UV Express Pasay/EDSA Taft area → Alabang (₱80–₱100, 40–60 min)

**Total**: ~₱93–₱113, 80–115 min, 1 transfer
**Alternative**: Walk/e-trike to LRT-1 Doroteo Jose → full LRT-1 south to PITX → bus south; slightly more reliable but longer.

---

## Transfer Point Characteristics

For each major interchange, the following summarizes the transfer experience relevant to routing and GTFS `transfers.txt`:

| Transfer Point | Modes Connecting | Walk Distance | Covered? | Min Transfer Time | Notes |
|----------------|-----------------|---------------|----------|------------------|-------|
| Doroteo Jose / Recto (LRT-1 ↔ LRT-2) | LRT-1 ↔ LRT-2 | ~113–200 m | Yes (elevated walkway) | 3–4 min | Active; most accessible rail interchange |
| Taft / EDSA (LRT-1 ↔ MRT-3) | LRT-1 ↔ MRT-3 | ~400 m | Partial (Metro Point Mall) | 5–8 min | Active; long walk for PWD/elderly |
| Araneta Cubao (LRT-2 ↔ MRT-3) | LRT-2 ↔ MRT-3 | ~400 m (Gateway→Farmer's) | Yes (mall walkway) | 7–10 min | Active; long but comfortable |
| EDSA Carousel ↔ MRT-3 (any shared stop) | BRT ↔ MRT | 0–100 m | Partial | 3–7 min | At North Ave, Cubao, Ortigas, Santolan, Taft; varies by station |
| PITX Multi-Modal (LRT-1 + Carousel + buses) | LRT-1 ↔ BRT ↔ Bus | <300 m (within PITX complex) | Yes | 5–10 min | New Nov 2024; best-designed hub in NCR |
| Cubao / Araneta Bus Terminal (MRT-3 ↔ Provincial Buses) | MRT-3 ↔ Bus | 50–400 m | No (open air) | 5–15 min | Depends on specific bus company terminal location |
| Pasay Rotonda (MRT-3 Taft ↔ Provincial Buses) | MRT-3 ↔ Bus | 100–500 m | No | 5–15 min | Bus terminals scattered along EDSA strip |
| Baclaran (LRT-1 ↔ UV Express/Jeepney) | LRT-1 ↔ Road | 50–200 m | No | 3–8 min | Exit station; terminal zones nearby |
| Lawton (LRT-1 ↔ Southbound Bus) | LRT-1 ↔ Bus | ~600–800 m | No | 8–15 min | LRT Central → walk to Lawton terminal; long |
| Gil Puyat/Buendia (LRT-1 ↔ Provincial Bus) | LRT-1 ↔ Bus | ~300 m | No | 5–10 min | JAC/JAM/DLTB terminals on Buendia St. |

---

## Directional Flow Patterns

### North–South (Daily Commuter Flow)
- **Morning inbound (north→center/south)**: Monumento / Fairview → Cubao → Ortigas/Makati/BGC
- **Primary path**: Jeepney/bus to EDSA Carousel or MRT-3, south to destination
- **Evening outbound (south→north)**: Makati/BGC → Cubao → SM North → Monumento/Fairview
- **Key bottleneck**: MRT-3 at Cubao–Ayala segment; EDSA Carousel headways during peak

### East–West (Cross-City)
- **Rizal Province → EDSA**: Via LRT-2 (Santolan/Antipolo → Cubao)
- **BGC/Taguig → Makati/Manila**: Via BGC Bus or UV Express on C5
- **NAIA (airport) → anywhere**: UBE Express P2P (to Cubao, One Ayala, BGC) or jeepney to Baclaran/PITX + LRT north

### Provincial Buses → Inner Metro
- **Northern Luzon arrivals** land at Cubao (EDSA terminal cluster) or Monumento (Victory Liner)
- **Southern Luzon arrivals** land at Pasay/EDSA (JAM, JAC, DLTB, Genesis, Ceres), Buendia (JAC/JAM south), or Lawton (Cavite near-province)
- **Visayas/Mindanao arrivals** (RoRo) land primarily at Pasay/EDSA (Philtranco)
- **Batangas arrivals**: Pasay (ALPS, JAM, DLTB, Genesis) or Buendia (JAC)

---

## Structural Gaps Identified

### 1. No Direct Fairview–South Connection
Fairview has no direct service to Pasay, Alabang, or PITX. Commuters must come back to EDSA (SM North or Cubao) before going south. This creates a 90–150 min minimum journey for Fairview → Alabang. No P2P or UV Express covers this gap in full.

### 2. No Direct Monumento–BGC / Monumento–Makati CBD
Despite being the two largest population catchment areas in NCR, Monumento and Makati/BGC have no direct route. All connections require EDSA Carousel/MRT through Cubao or the Pasay area. EDSA construction disruptions compound this.

### 3. Quiapo/Divisoria Isolation from South
The inner Manila jeepney hubs (Quiapo, Divisoria) have no direct connection to Alabang, BGC, or Parañaque. All paths require at minimum 1 rail or BRT leg plus a UV Express or P2P leg. Journey time minimum ~90 min.

### 4. Inner Manila–Rizal Province Gap
No direct route from Divisoria/Quiapo/Lawton to Cainta, Taytay, Antipolo. Must transfer via Cubao or Santolan (LRT-2). Combined journey time 60–90 min.

### 5. PITX–Eastern NCR Gap
PITX (Parañaque) has no direct service to Marikina, Pasig, or Santolan. All connections require going north on LRT-1 to transfer to LRT-2 or MRT-3. Minimum 3 transfers for PITX → Marikina.

### 6. BGC–Northern NCR Gap
BGC Bus routes terminate at Ayala/EDSA or Cubao. No BGC Bus extends to SM North EDSA, Fairview, or Monumento. BGC → Monumento requires EDSA Carousel (one way from Ayala area) plus city bus, or MRT + Carousel: minimum 2 transfers.

### 7. Lawton Ferry Operational Status (Unconfirmed 2026)
The Pasig River Ferry at Lawton could connect to Pasig/Marikina terminal nodes but its 2026 operational status is unconfirmed. If operational, it provides a unique direct waterway connection from Lawton to Pinagbuhatan (Pasig) and Marikina—eliminating 2 bus transfers for that corridor.

---

## GTFS Implications

### `transfers.txt` Entries Required

The following transfers should be encoded with minimum_transfer_time values:

```
from_stop_id,to_stop_id,transfer_type,min_transfer_time
LRT1_DOROTEO_JOSE,LRT2_RECTO,2,240
LRT2_RECTO,LRT1_DOROTEO_JOSE,2,240
LRT1_EDSA,MRT3_TAFT,2,300
MRT3_TAFT,LRT1_EDSA,2,300
LRT2_CUBAO,MRT3_CUBAO,2,480
MRT3_CUBAO,LRT2_CUBAO,2,480
EDSA_CAROUSEL_NORTH_AVE,MRT3_NORTH_AVE,2,180
MRT3_NORTH_AVE,EDSA_CAROUSEL_NORTH_AVE,2,180
EDSA_CAROUSEL_CUBAO,MRT3_CUBAO,2,180
MRT3_CUBAO,EDSA_CAROUSEL_CUBAO,2,180
EDSA_CAROUSEL_ORTIGAS,MRT3_ORTIGAS,2,180
EDSA_CAROUSEL_TAFT,MRT3_TAFT,2,300
```

### Major Terminal Stops (Multi-Modal Parent Stations)

These hubs should be modeled in `stops.txt` as parent stops with child stops for each mode:

| Hub | Approx. Coordinates | Child Stop Count |
|-----|---------------------|-----------------|
| Cubao / Araneta Center | 14.6237°N, 121.0527°E | 5 (LRT-2, MRT-3, EDSA Carousel, Provincial Bus, Jeepney) |
| Pasay Rotonda | 14.5504°N, 121.0019°E | 4 (LRT-1 EDSA, MRT-3 Taft, EDSA Carousel, Provincial Bus) |
| PITX | 14.5015°N, 121.0005°E (approx.) | 4 (LRT-1, EDSA Carousel, Provincial Bus, Jeepney) |
| Monumento | 14.6553°N, 120.9841°E | 3 (LRT-1, EDSA Carousel, Jeepney/Bus) |
| SM North EDSA | 14.6573°N, 121.0316°E | 3 (MRT-3, EDSA Carousel, Jeepney/UV Express) |
| Lawton / Central Terminal | 14.5910°N, 120.9760°E | 3 (LRT-1, Bus, Pasig Ferry—if operational) |
| Doroteo Jose / Recto | 14.6023°N, 120.9838°E | 2 (LRT-1, LRT-2) |
| Taft/EDSA | 14.5504°N, 121.0019°E | 2 (LRT-1, MRT-3) |

---

## Conflict Notes

1. **PITX as Carousel terminus vs. EDSA Carousel north**: The EDSA Carousel route is labeled Monumento ↔ PITX, but some sources describe a Phase 2 extension to Dr. Santos. As of 2026-03-01, the confirmed south terminus is PITX Station, co-located with LRT-1 PITX Station. Dr. Santos extension not confirmed operational.

2. **Lawton Terminal co-location**: The "Lawton terminal" is functionally split — the main post-pandemic bus staging area is at the **Philippine Postal Corporation** (Liwasang Bonifacio), not the old Park N Ride. Some apps still route commuters to the old location. This creates confusion for routing engines.

3. **UV Express Baclaran–Alabang hours**: Documented as 7AM–10PM daily, but some community sources report irregular operations and that many units now terminate at PITX instead of Baclaran. This may mean the effective connection hub for Alabang UV Express has shifted from Baclaran to PITX (post-LRT extension Nov 2024).

4. **BGC Bus fare ambiguity**: BGC Bus routes publish ₱11 as minimum fare in some sources and ₱30–₱80 in others. The ₱11 rate was the old pre-pandemic promotional fare; current (2025+) fares are higher. RRCG P2P fares (₱60 to ₱140) are the more reliable cross-reference.

---

## Confidence Assessment

| Connection Pair | Confidence | Basis |
|-----------------|------------|-------|
| EDSA Corridor (MON↔SNN↔CUB↔ORT↔PSY↔PIX) | **High** | EDSA Carousel + MRT-3 documented extensively |
| LRT-1 Spine (MON↔LAW↔BUN↔BCL↔PIX) | **High** | Official LRT-1 fare matrix; confirmed stations |
| Cubao ↔ Taft (MRT-3) | **High** | MRT-3 confirmed; single-seat transfer |
| BCL ↔ ALA (UV Express) | **High** | Multiple corroborating sources; Moovit + Sakay |
| BGC ↔ ALA (P2P HM Transport) | **High** | Official HM Transport schedule confirmed |
| CUB ↔ BGC (MRT + BGC Bus) | **High** | Both services confirmed individually |
| FAI → ALA (3-leg) | **Medium** | Assembled from confirmed legs; no end-to-end confirmation |
| LAW ↔ ALA (via LRT-1 + bus) | **Medium** | Walk distance at Lawton unconfirmed |
| DIV → BGC (2-leg) | **Medium** | Assembled; jeepney routing via Pasay confirmed |
| SAN → PIX (3-leg via rail) | **Medium** | Rail fares confirmed; transfer times estimated |
| Pasig River Ferry (LAW connections) | **Low** | 2026 operational status unconfirmed |

---

## Sources

- `analysis/validated-rail-to-road-transfer-mapping.md` — Rail station transfers, Carousel co-locations
- `analysis/cubao-terminal.md` — Cubao terminal layout, provincial bus operators, P2P
- `analysis/pasay-edsa-terminal.md` — Pasay Rotonda terminal inventory, UV Express to Cavite
- `analysis/monumento-terminal.md` — Monumento area terminals, Victory Liner, EDSA Carousel north
- `analysis/sm-north-edsa-terminal.md` — SM North EDSA terminal, Carousel concourse, P2P Bulacan
- `analysis/baclaran-terminal.md` — Baclaran area, UV Express Alabang, LRT extension info
- `analysis/other-major-terminals.md` — Divisoria, Quiapo, Lawton, Sta. Cruz, Blumentritt
- `analysis/fairview-terminal.md` — Fairview terminal, QCityBus Route 1
- `analysis/p2p-bus-operators.md` — RRCG, HM Transport, UBE Express route details
- `analysis/edsa-busway-system.md` — EDSA Carousel full route, stops, fare table
- `analysis/validated-edsa-corridor.md`, `analysis/validated-taft-avenue-corridor.md` — Corridor cross-references
- `analysis/bgc-bus-system.md` — BGC Bus routes and terminals
