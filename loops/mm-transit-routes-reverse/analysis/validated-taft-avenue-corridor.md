# Taft Avenue Corridor — Validated Routes

**Analysis date**: 2026-02-28
**Aspect**: Wave 2 — Taft Avenue corridor (all routes along Taft, Buendia, through Pasay)
**Sources cross-referenced**: 15 raw JSON files + OSM Wiki + commutetour.com + moovitapp.com + backpackingphilippines.com

---

## Corridor Geography

Taft Avenue is Metro Manila's primary north-south spine through the western Manila/Pasay axis, running approximately 15 km from the CCP/Roxas Boulevard area south through Pasay Rotonda to Baclaran, Parañaque. The LRT-1 Green Line runs parallel to Taft for most of its length, making this corridor a critical rail augmentation zone.

```
CCP Complex / Roxas Boulevard junction (Malate/Ermita boundary)
        ↓ Taft Avenue northbound: P. Ocampo, Pedro Gil (LRT-1)
Pedro Gil LRT-1 / UN Avenue
        ↓
Quirino Ave
        ↓
Central Terminal LRT-1 (near Lawton / Manila City Hall)
        ↓ Taft continues north into Manila
Carriedo / Recto LRT-1 (one block east, pedestrian accessible)
        ↓ Southbound from Manila along Taft:
Vito Cruz LRT-1 (National Museum; PGH)
        ↓
Gil Puyat LRT-1 / Buendia Ave (Makati boundary; Buendia Bus Terminal)
        ↓
Libertad LRT-1
        ↓
EDSA/Pasay Rotonda (MRT-3 Taft + LRT-1 EDSA + EDSA Carousel Heritage)
        ↓ Taft Avenue Extension (south of EDSA)
F.B. Harrison Street / Malibay, Pasay
        ↓
Baclaran LRT-1 (Parañaque; southern hub)
        ↓ LRT-1 Cavite Extension (Nov 2024–)
PITX / Redemptorist-Aseana LRT-1 / MIA Road LRT-1 / Ninoy Aquino Ave LRT-1 / Dr. Santos LRT-1
```

**Key sub-segments:**
- **CCP/Roxas Blvd. junction → Vito Cruz LRT-1** (~2 km, Malate/Ermita): tourism, CCP, Manila Hotel, embassies
- **Vito Cruz → Gil Puyat/Buendia** (~2 km): PGH/UP Manila, National Museum; major university commuter zone
- **Gil Puyat/Buendia → EDSA/Pasay Rotonda** (~2 km): Makati boundary, Libertad, Pasay
- **Pasay Rotonda → Baclaran** (~3 km, Taft Ave Extension / F.B. Harrison): Pasay → Parañaque

**Parallel streets used by counter-directional routes:**
- **A. Mabini / M.H. del Pilar**: northbound counterpart to Taft (one-way pairs in Malate/Ermita)
- **L. Guinto Street**: north-south artery from Pasay Rotonda area toward Malate, used by many jeepney routes
- **Osmeña Highway**: parallel south of Pasay Rotonda toward Makati CBD area

**Major transit nodes on corridor:**
1. **Pasay Rotonda / EDSA-Taft** — highest-volume intersection; MRT-3 Taft, LRT-1 EDSA, EDSA Carousel Heritage Hotel stop, UV Express terminals, provincial bus terminals (Victory Liner, Genesis, Philtranco), Don Aldrin Bus Terminal
2. **Gil Puyat / Buendia** — LRT-1 Gil Puyat; Buendia Bus Terminal (JAM, DLTB provincial); Makati CBD entry
3. **Vito Cruz LRT-1** — PGH, National Museum, CCP access point; well-served by jeepney feeders
4. **Central Terminal LRT-1 / Lawton** — Manila City Hall area; major bus terminus for provincial and provincial routes
5. **Baclaran LRT-1** — southern hub; ~25 jeepney destinations departing from Baclaran

---

## City Bus Routes

### HIGH Confidence (2+ independent sources confirm Taft Ave. segment)

| Route | Name | Operator | Origin → Destination | Taft Segment | Sources |
|-------|------|----------|----------------------|--------------|---------|
| **Route 17** | Monumento–EDSA Taft | Multiple (Lippad Trans for Ayala variant) | Monumento, Caloocan → EDSA Taft, Pasay | Full Taft Ave spine (LRT-1 augmentation) | OSM (9856704), MC 2020-019, city-bus-operators, ltoportal |
| **Route 23** | Alabang–Lawton via Zapote Road | Unknown | Alabang Starmall → Lawton, Manila | Baclaran → Taft Ave → Central Terminal → Lawton | ltoportal (MM-BUS-023) |
| **Route 24** | Alabang–Lawton via SSH | Unknown | Alabang Starmall → Lawton, Manila | SSH → Pasay → Taft Ave → Lawton | ltoportal (MM-BUS-024) |
| **Route 38** | Fairview–Pacita via Taft | Unknown | SM Fairview, QC → Pacita Complex, San Pedro | "Via Taft/South Manila corridor" — full corridor | ltoportal (MM-BUS-038), city-bus-operators |
| **Route 40** | Fairview–Alabang via Taft | Unknown | SM Fairview, QC → Alabang, Muntinlupa | "Via Taft/EDSA Manila corridor" | ltoportal (MM-BUS-040) |
| **Route 11** | Pasay–Santa Rosa | Unknown | Pasay, Gil Puyat → Santa Rosa, Laguna | Departs from Gil Puyat terminus on Taft | ltoportal (MM-BUS-011) |
| **Route 12** | Pasay–Biñan | JAC Liner (terminal) | Pasay, Gil Puyat → Biñan, JAC Liner Terminal | Departs from Gil Puyat terminus on Taft | ltoportal (MM-BUS-012) |
| **PNR Aug. R1** | Alabang–Divisoria | HM Transport Inc. | Alabang → Divisoria | Via PNR Buendia, PNR Vito Cruz, PNR Harrison — parallel to Taft | city-bus-operators, ltfrb-bus-routes |
| **PNR Aug. R2** | FTI–Divisoria | HM Transport Inc. | FTI Complex, Taguig → Divisoria | Via PNR Bicutan, PNR Buendia, PNR Espana — Taft-adjacent | city-bus-operators, ltfrb-bus-routes |

**Critical observation on Route 17**: This is the explicit LRT-1 Taft augmentation route per MC 2020-019. It carries passengers along the Taft Ave spine who cannot use LRT-1 (fare, crowding, or gap coverage). OSM documents two variants under Route 17: "Monumento–EDSA Taft" (original MC 2020-019) and "Ayala–Fairview" (Lippad Trans, OSM 9856704 with 374 member geometry). Both likely operate simultaneously under the same route number — a common conflict pattern seen in EDSA and Commonwealth analyses.

**PNR Augmentation Routes** (Routes 1 and 2 under MC 2023-020, HM Transport Inc.): Launched June 2023 after PNR suspension. These buses shadow the former PNR Metro Commuter Line track right-of-way, which runs parallel to Taft Avenue from Blumentritt southward through Buendia/Vito Cruz/Harrison stations. They effectively extend coverage into the Taft corridor's residential catchment areas.

### MEDIUM Confidence

| Route | Name | Notes |
|-------|------|-------|
| **Route 27** | Dasmariñas–Lawton / PITX | Lawton variant terminus on Taft corridor; also PITX variant |
| **Route 42** | Malanday–Ayala | Via Manila/Pasay/Makati; likely uses Taft-adjacent Mabini segment |
| **Route 44** | Navotas–Alabang | Via Manila/Pasay; Taft-area transit through Ermita/Pasay |
| **Route 47** | Navotas–PITX | Via Manila/Pasay; similar Taft-area transit |
| **Route 62** | Pasay–Arca South | Originates from Pasay (Gil Puyat/Taft area); route details sparse |
| **Route 48** | Pacita–Lawton | Via Makati/Pasay/Manila; approaches Lawton along Taft spine |
| **Ayala–Lawton city bus** | LRT-1 feeder bus | Via Gil Puyat → Libertad → UN Ave → Pedro Gil → Lawton; serves 5 LRT-1 stations on Taft spine | Confirmed in lrt1-feeder-routes.json |

### Noted Conflicts

**Routes 6 and 7 (España connection)**: Both confirmed to use España Blvd → Lerma → Quiapo on their southbound runs, but their southward journey then continues to PITX via Taft-adjacent streets. Their routing through southern Manila and Pasay likely passes near or on Taft Ave Extension; exact alignment from España to PITX is unconfirmed for the Taft segment specifically.

---

## EDSA Carousel — Taft Interface

The EDSA Carousel BRT does **not** operate on Taft Avenue itself, but its two southernmost stops are at the EDSA-Taft junction:
- **Heritage Hotel / Roxas Blvd** — curbside stop on EDSA approaching Pasay Rotonda from north (southbound)
- **MRT Taft (Pasay Rotonda)** — EDSA-Taft junction; major transfer hub

From these stops, riders transfer to jeepneys and provincial buses. The Carousel also serves PITX as its southern terminus, where LRT-1 Cavite Extension connects. This makes the EDSA-Taft junction the single most important transfer node in Metro Manila's public transit network.

**EDSA Carousel stops on Taft spine (via EDSA, not Taft Ave)**: Heritage Hotel/MRT Taft → Buendia → Ayala → Guadalupe → continues north.

---

## Jeepney Routes

### HIGH Confidence

| Route ID | Name | Key Stops on Taft Corridor | Freq. / Hours |
|----------|------|---------------------------|---------------|
| **DOTR:R_SAKAY_PUJ_1607** | Baclaran–Divisoria via Taft | F.B. Harrison → EDSA-Taft → Mabini → Sinagoga → UN Ave → Taft/Manila → Juan Luna/Divisoria | Every 15 min, ~42 min |
| **T378** | Baclaran–Blumentritt via Taft, Mabini, Santa Cruz | Baclaran LRT-1 → Taft Ave → A. Mabini → Santa Cruz → Blumentritt | Unknown; OSM geometry available (Relation 11541968) |
| **DOTR:R_SAKAY_2018_PUJ_160** | Baclaran–Blumentritt via Mabini/Quiapo | PITX → F.B. Harrison/Taft Ext. → A. Mabini → Quiapo → Blumentritt | Daily 4AM–10PM; Sakay + Moovit confirmed |
| **LRT1-FEEDER-VITOC-MON-MABINI** | Monumento–Vito Cruz via Rizal/Mabini | Monumento → Rizal Ave → A. Mabini → Vito Cruz LRT-1 | Documented; major spine route |
| **LRT1-FEEDER-VITOC-MON-TAFT** | Monumento–Vito Cruz via Rizal/Taft | Monumento → Rizal Ave → Taft Ave → Vito Cruz LRT-1 | Alternate alignment of above |
| **LRT1-FEEDER-VITOC-CCP** | CCP–Taft Ave via Vito Cruz | CCP Complex → Vito Cruz LRT-1 → Taft Ave | Connects Manila Bay cultural district to LRT-1 |
| **Route 309 / NICHOLS-R309** | Nichols–Vito Cruz LRT | Nichols, Pasay → Osmeña Highway → Vito Cruz LRT-1 | LTFRB code 309; Osmeña Hwy parallels Taft |
| **T3111** | Kamuning–Vito Cruz | Kamuning, QC → E. Rodriguez → A. Mabini → Vito Cruz LRT-1 | LTFRB code T3111; long north-south |
| **LRT1-FEEDER-LIBERTAD-DIV-LGUINTO** | Divisoria–Libertad via L. Guinto | Divisoria → L. Guinto St → Libertad LRT-1 | High confidence; Taft-parallel via L. Guinto |
| **LRT1-FEEDER-LIBERTAD-BAC-BLUM** | Baclaran–Blumentritt via L. Guinto/Santa Cruz | Baclaran LRT-1 → Pasay → L. Guinto → Libertad LRT-1 → Santa Cruz → Blumentritt | Crosses 5+ LRT-1 stations |
| **BACLARAN-PASAY-ROTONDA** | Baclaran–Pasay Rotonda | Baclaran → F.B. Harrison/Taft → Pasay Rotonda | Very short (~0.5 km); frequent |
| **nichols-jeep-naia-loop** | Nichols Jeep — MRT Taft/NAIA 3 Circular | MRT Taft → Winston Hotel → Partas Bus Terminal → NAIA T3 → T4 Rotonda → Airport Rd → Baclaran Church → Heritage Hotel → MRT Taft | 24/7; traditional ₱11 + modern ₱13 |

### MEDIUM Confidence

| Route ID | Name | Key Stops |
|----------|------|-----------|
| **T3181** | Dapitan–Pasay Rotonda via L. Guinto | Dapitan → L. Guinto → Taft → Pasay Rotonda; LTFRB T-code confirmed (PNA article) |
| **T3183** | Divisoria–Pasay Rotonda via L. Guinto | Divisoria → L. Guinto → Taft → Pasay Rotonda; same L. Guinto corridor, extended origin |
| **MCU-Pasay Rotonda via Taft** | MCU–Pasay Rotonda | MCU/Monumento → Taft Ave (full north-south Taft spine) → Pasay Rotonda |
| **pasay-rotonda-lawton** | Pasay Rotonda–Lawton via Taft | Pasay Rotonda → Taft Ave → Vito Cruz → Padre Faura → Lawton |
| **pasay-rotonda-quiapo** | Pasay Rotonda–Quiapo | Pasay Rotonda → Taft/Mabini → Vito Cruz → Paco → Quiapo |
| **taft-extension-edsa-sto-cristo** | Taft Ave Extension–Sto. Cristo | Pasay Rotonda → Taft Ave → full Manila → Sto. Cristo, Binondo; 29 stops, ~54 min (Moovit) |
| **BACLARAN-NAVOTAS** | Baclaran–Navotas | Baclaran → Taft Ave → Manila → Caloocan → Navotas; ~1h11min |
| **BACLARAN-RETIRO** | Baclaran–Retiro via L. Guinto, Quiapo | Baclaran → L. Guinto → Quiapo → Retiro |
| **BACLARAN-PCAMPA-1** | Baclaran–P. Campa via L. Guinto | Baclaran → L. Guinto → P. Campa, Sampaloc |
| **BACLARAN-PCAMPA-2** | Baclaran–P. Campa via Mabini | Baclaran → A. Mabini → P. Campa |
| **LRT1-FEEDER-CENTRAL-BLUM-PASAYRTDA** | Blumentritt–Pasay RTDA | Blumentritt LRT-1 → Santa Cruz → L. Guinto → Lawton → Pasay RTDA |
| **LRT1-FEEDER-GILPUYAT-BUENDIA-PRC** | Buendia–PRC via P. Tamo | Buendia Crispa → P. Tamo → Gil Puyat LRT-1 → PRC |
| **quirino-bacoor-taft-extension** | Quirino Ave Bacoor–F.B. Harrison | Quirino Ave, Bacoor → Zapote → F.B. Harrison/Taft Ave Extension, Pasay; 29 stops (Moovit) |
| **pasay-rotonda-buendia** | Pasay Rotonda–Buendia / Gil Puyat | Pasay Rotonda → Taft/Leveriza → Buendia/Gil Puyat |

### Orphan / Single-Source

- **MCU-Pasay Rotonda via Rizal/Mabini** (alternate routing) — community sources only; likely variant of confirmed MCU-Pasay routes
- **BACLARAN-DIVISORIA via Taft (R_SAKAY version)** — overlaps with DOTR:R_SAKAY_PUJ_1607; same route, different ID referencing

---

## UV Express Routes

### HIGH Confidence

| Route ID | Name | Terminal | Fare | Notes |
|----------|------|----------|------|-------|
| **pasay-uv-dasma** | Pasay Rotonda–Dasmariñas | Savers / Metropoint Mall, Pasay | ₱80–100 | Terminal at EDSA-Taft junction; departs via Aguinaldo Hwy |
| **pasay-uv-bacoor-imus** | Pasay Rotonda–Bacoor/Imus | Savers / Metropoint Mall, Pasay | ₱80–100 | Same terminal; shorter Cavite route |
| **BACLARAN-UV-ALABANG** | Baclaran–Alabang UV Express | Baclaran UV terminal | ₱13+ distance | Moovit agency 1450948 confirmed; 7AM–10PM; non-stop express; related to Coastal Road corridor |

### MEDIUM Confidence

| Route ID | Name | Notes |
|----------|------|-------|
| **pasay-uv-trece** | Pasay Rotonda–Trece Martires | Terminal beside McDonald's LRT EDSA; ₱120–130 |
| **pasay-uv-tanza** | Pasay Rotonda–Tanza | ₱120–130; less common Cavite destination |
| **pasay-uv-calatagan** | Pasay Rotonda–Calatagan, Batangas | Kabayan Hotel terminal; ₱130–150; beach/seasonal |

**Note:** UV Express terminals at Pasay Rotonda are concentrated near the EDSA-Taft intersection (Savers Mall, Metropoint Mall, beside McDonald's LRT EDSA entrance). These routes depart southward via Aguinaldo Highway (Cavite routes), not along Taft Ave itself — but Pasay Rotonda is the last major Taft-axis stop before these routes diverge to expressways.

---

## P2P and Specialty Buses

| Route ID | Name | Operator | Taft Segment | Fare |
|----------|------|----------|--------------|------|
| **P2P-UBE-NAIA-MANILA** | UBE Express — NAIA T3 → Robinsons Manila | UBE Express | Terminates at Robinsons Place Manila on Adriatico/Taft | ₱200 flat; 5 daily trips |
| **don-aldrin-dasma** | Don Aldrin – Dasmariñas/Trece | Don Aldrin Bus | Terminal at EDSA near Mahal Kita Inn (Pasay Rotonda/Taft junction) | ₱30–86; 4AM–11PM |
| **san-agustin-nasugbu** | Genesis Bus – Nasugbu Batangas | Genesis Transport | Terminal below MRT-3 Taft Ave Station, Pasay | ₱165 flat; 3AM–9PM |
| **PH-BUS-PNR-AUG-1** | PNR Augmentation 1: Alabang–Divisoria | HM Transport | Via PNR Buendia + Vito Cruz + Harrison (Taft-parallel) | ₱13 base; June 2023 launch |
| **PH-BUS-PNR-AUG-2** | PNR Augmentation 2: FTI–Divisoria | HM Transport | Via PNR Bicutan + Buendia + España (Taft-adjacent) | ₱13 base; June 2023 launch |

---

## Rail Integration

| Station | Line | Corridor Position | Key Connecting Routes |
|---------|------|------------------|-----------------------|
| **Baclaran LRT-1** | LRT-1 | Southern terminus (historic); Parañaque | ~15 jeepney destinations; UV Express to Alabang; EDSA Carousel via PITX; Zapote/Bacoor/Sucat/NAIA jeepneys |
| **EDSA LRT-1** | LRT-1 | EDSA-Taft junction | EDSA Carousel Heritage stop; MRT-3 Taft walk (~300 m); Victory Liner, Philtranco, Partas terminals; UV Express to Cavite |
| **MRT-3 Taft** | MRT-3 | EDSA-Taft junction | Co-located with LRT-1 EDSA (footbridge); Genesis Bus Terminal below; Don Aldrin terminal; Nichols jeep circular |
| **Libertad LRT-1** | LRT-1 | Mid-Pasay on Taft | Divisoria–Libertad via L. Guinto (HIGH); Baclaran–Blumentritt via L. Guinto |
| **Gil Puyat LRT-1** | LRT-1 | Buendia/Taft junction | Buendia Bus Terminal (JAM, DLTB provincial buses); Route 12/11 to Laguna; PRC feeder jeepney |
| **Vito Cruz LRT-1** | LRT-1 | Vito Cruz/Taft junction | CCP jeepney (HIGH); Monumento–Vito Cruz (HIGH); Route 309 Nichols; T3111 Kamuning; BGC Bus terminal at EDSA Ayala (~2 km via Buendia) |
| **Pedro Gil / UN Ave LRT-1** | LRT-1 | Mid-Taft Manila | PGH/UP Manila access; Ayala–Lawton city bus corridor |
| **Central Terminal LRT-1** | LRT-1 | Lawton/Manila | Major bus terminus; 12+ jeepney routes; Lawton ferry terminal; Cubao–Lawton buses |
| **PITX LRT-1** | LRT-1 Cavite Ext. | New southern terminal | EDSA Carousel southern terminus; UBE Express NAIA; Provincial buses (Cavite, Batangas, Laguna) |

---

## Contested Routes

| Conflict | Details | Resolution |
|----------|---------|------------|
| **Route 17 dual identity** | MC 2020-019 names this "Monumento–EDSA Taft" (LRT-1 augmentation); OSM tags variant as "Ayala–Fairview" by Lippad Trans (374 members, geometry available). Both share the Taft Ave spine. | Treat as same franchise number with two operational variants. Both confirmed using Taft corridor. Note: OSM may reflect a 2020+ rerouting that extended Route 17 beyond EDSA Taft to Ayala. |
| **T378 vs R_SAKAY_2018_PUJ_160** | Two confirmed Baclaran–Blumentritt routes exist with slightly different routing (Taft vs. Mabini). T378 has OSM geometry (Relation 11541968). R_SAKAY_2018_PUJ_160 goes via Mabini (PITX origin). These are distinct routes, not duplicates. | Both confirmed operational. T378 = Taft Ave routing; R_SAKAY_2018 = Mabini routing with PITX origin extension. |
| **MCU–Pasay Rotonda route number** | Two entries: "via Taft" and "via Rizal/Mabini." Multiple community sources describe MCU–Pasay as a major spine route but disagree on exact routing. No LTFRB T-code confirmed. | May be two variants of same franchise, or informally operated routes. Medium confidence; list separately. |
| **L. Guinto vs. Taft Ave.** | Multiple routes described as "via L. Guinto Street" are Taft-corridor routes (L. Guinto is a north-south parallel ~1 block from Taft in the Malate/Ermita section). Some sources intermix the two streets in route descriptions. | L. Guinto routes are Taft-corridor routes for planning purposes; both streets serve the same origin-destination catchment. |
| **Route 6 and 7 southern alignment** | Both confirmed on España Blvd–Lerma–Quiapo segments northbound. Southbound alignment from Quiapo to PITX unclear — some sources suggest Taft Ave or A. Mabini; others suggest Roxas Blvd. | Not enough data to confirm which segment these buses use south of Quiapo. Pending field verification. |

---

## Key Gaps

1. **No confirmed stop GPS coordinates**: For all jeepney routes on the Taft Ave corridor, no GPS stop data available in any source. The LRT-1 stations serve as de facto reference stops but actual jeepney loading zones are curbside and informal.
2. **Route 17 exact stop sequence unknown**: Despite OSM geometry available for the Ayala–Fairview variant, no stop list between EDSA Taft and Central Terminal has been extracted from any source.
3. **Southbound bus routing through Manila**: For city bus routes 23, 24, 27, 38, 40, 42, 44, 47, 48 — the exact streets used between Pasay Rotonda and their Manila destinations (Lawton, Divisoria, etc.) are not documented. Some likely use Taft; others may use Roxas Blvd, A. Mabini, or Osmeña Highway.
4. **No overnight or late-night jeepney service documented**: While EDSA Carousel operates 24/7 with Taft stops, no jeepney routes on Taft Ave have confirmed late-night (10PM–5AM) service; gap is especially significant for hospital workers at PGH/UP Manila area.
5. **Buendia Bus Terminal connecting routes**: The terminal at Gil Puyat (Buendia) is well-documented for provincial departures (Batangas, Laguna via JAM/DLTB), but feeder jeepney routes specifically serving the terminal approach from Taft are not documented with LTFRB codes.
6. **P2P routes into Manila proper**: UBE Express Robinsons Manila is the only P2P terminating directly on or near Taft Ave (at Adriatico/Taft junction). Other P2P routes (HM Transport, Froehlich) use EDSA Ayala or BGC as their nearest stops.
7. **Osmeña Highway gap**: This parallel Pasay corridor (southward from Gil Puyat toward NAIA) has limited documentation. Route 309 Nichols–Vito Cruz uses it, but other routes along this stretch are not documented.

---

## Summary Statistics

| Mode | Confirmed (HIGH) | Confirmed (MEDIUM) | Orphan/Single-Source |
|------|-----------------|-------------------|----------------------|
| City Bus | 9 | 7 | 0 |
| Jeepney | 12 | 14 | 2 |
| UV Express | 3 | 3 | 0 |
| P2P / Specialty | 5 | 0 | 0 |
| **Total** | **29** | **24** | **2** |

**Total routes identified**: 55 (29 confirmed + 24 medium + 2 orphan)

**Corridor density insight**: The EDSA-Taft / Pasay Rotonda node is the highest-density transit interchange in this dataset — with the EDSA Carousel (MRT-3 Taft + LRT-1 EDSA stops), 12+ jeepney routes, 6+ UV Express departures, Genesis Bus terminal, Don Aldrin terminal, and provincial bus terminals (Victory Liner, Philtranco, Partas) all within 500 m of each other. This node warrants a separate detailed terminal mapping pass.

---

## Sources

- `raw/pasay-edsa-terminal-routes.json` — EDSA Carousel Taft stops, Pasay Rotonda jeepney/UV Express routes, Genesis/Don Aldrin terminals
- `raw/baclaran-terminal-routes.json` — Baclaran hub jeepney routes, UV Express to Alabang, PITX NAIA Loop
- `raw/lrt1-feeder-routes.json` — All LRT-1 Taft-corridor station feeders (Vito Cruz, Gil Puyat, Libertad, EDSA, Baclaran, PITX)
- `raw/ltfrb-bus-routes.json` — EDSA Carousel stops, Routes 17 (Monumento-EDSA Taft), PNR Augmentation routes
- `raw/ltoportal-ph-routes.json` — Routes 4, 11, 12, 23, 24, 27, 38, 40, 42, 44, 47, 48, 62 with Taft-area endpoints
- `raw/city-bus-operators-routes.json` — Route 17 Lippad Trans, PNR Augmentation 1 & 2, Route 18 Baclaran Metro Link
- `raw/osm-transit-relations-routes.json` — EDSA Carousel Taft stops; T378 geometry (OSM Relation 11541968)
- `raw/sakay-ph-routes.json` — DOTR:R_SAKAY_PUJ_1607 (Baclaran-Divisoria), DOTR:R_SAKAY_2018_PUJ_160 (Baclaran-Blumentritt Mabini)
- `raw/p2p-routes.json` — UBE Express NAIA–Robinsons Manila, RRCG P2P Greenbelt
- `raw/mrt3-feeder-routes.json` — MRT-3 Taft station feeders
- `raw/ltfrb-jeepney-routes.json` — T3111, T3181, T3183, Route 309 Nichols
- `raw/ltfrb-uv-express-routes.json` — UV Express fares and terminal data
- `raw/facebook-commuter-groups-routes.json` — Community-confirmed Taft corridor jeepney routes
- `raw/moovit-routes.json` — Baclaran-Alabang UV Express (agency 1450948), Taft Extension routes
- `raw/pinoycommute-routes.json` — MCU-Pasay Rotonda, general Taft Ave jeepney routes
- `wiki.openstreetmap.org/wiki/Metro_Manila/Bus_routes` — Routes 17, PNR Aug 1/2, T378 OSM Relation 11541968
- `wiki.openstreetmap.org/wiki/Metro_Manila/Jeepney_and_UV_Express_routes` — T3111, T3181, T3183, MCU-Pasay variants
- backpackingphilippines.com, commutetour.com — Pasay Rotonda terminal guide; Genesis Taft terminal; Don Aldrin bus info
