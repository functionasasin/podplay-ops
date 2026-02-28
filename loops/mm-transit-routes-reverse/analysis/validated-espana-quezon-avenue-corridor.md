# España–Quezon Avenue Corridor — Validated Routes

**Analysis date**: 2026-02-28
**Aspect**: Wave 2 — España-Quezon Avenue corridor (University Belt axis)
**Sources cross-referenced**: 14 raw JSON files + OSM Wiki + Moovit + commutetour.com

---

## Corridor Geography

The España–Quezon Avenue corridor is Metro Manila's primary University Belt transit axis, spanning roughly 10 km:

```
Elliptical Rd / Quezon Memorial Circle
        ↓ Quezon Avenue (6.1 km, 6–14 lanes)
Welcome Rotonda (Quezon City / Manila boundary)
        ↓ España Boulevard (~3.5 km)
Lerma Street
        ↓ Quezon Boulevard
Quiapo Church / Quezon Bridge
```

**Key sub-segments:**
- **Quezon Avenue proper**: QMC/Elliptical Rd → Welcome Rotonda (QC side, ~6.1 km)
- **Welcome Rotonda**: Major junction where Quezon Ave meets España Blvd (and E. Rodriguez Sr. Ave)
- **España Boulevard**: Welcome Rotonda → Quezon Blvd/Lerma (Sampaloc, Manila side, ~3.5 km)
  - Key intersections: P. Noval (UST), Lacson Ave, Dapitan (UST Medical), G. Tuazon, Morayta, M. dela Fuente
- **University Belt pocket**: España–Lacson–Morayta–Legarda grid (UST, FEU, UE, San Sebastian, CEU, San Beda)

**Major transit nodes on corridor:**
1. **Quezon Ave / CIT Terminal** (near EDSA/MRT-3 Quezon Avenue station) — northern city bus terminal
2. **Welcome Rotonda** — high-volume jeepney/bus transfer point; QCityBus origin
3. **España / Morayta footbridge** — de facto Fairview-bound bus loading zone
4. **España / UST Gates** — student boarding hub
5. **España / Bambang** — LRT-1 Bambang station proximity (~5 min walk)
6. **Quiapo Church / Quezon Blvd** — southern terminus hub for jeepneys and buses

---

## City Bus Routes (Confirmed)

### HIGH Confidence

| Route | Name | Operator | Origin → Destination | Via España/QAve? | OSM Relation |
|-------|------|----------|----------------------|------------------|--------------|
| Route 6/6A | Sapang Palay–PITX | Fairview Bus (FBMC) | Sapang Palay, Bulacan → PITX, Parañaque | **Yes** — España Blvd, Lerma, Quezon Blvd | OSM 9552776 (per Commonwealth analysis) |
| Route 7 | Fairview–PITX | Roval Transport (NAT Transpo) | SM Fairview, QC → PITX, Parañaque | **Yes** — España Blvd, Lerma, Quezon Blvd | OSM 9856704 |
| Route 17 | Fairview–Ayala | W. Lippad (Lippad Trans) | SM City Fairview → Buendia MRT / Ayala Ave | **Yes** — España Blvd, Lerma, Quezon Blvd | OSM 9856704 area |
| Route 34 | PITX–Rodriguez | Marikina Auto Line | PITX → Rodriguez, Rizal | **Yes** — Quezon Ave, Elliptical Rd | Confirmed |

**Key finding:** Routes 6/6A, 7, 17, and 34 all share the España Blvd–Lerma–Quezon Blvd segment when traveling inbound (southbound toward Quiapo/Manila). This creates a very high bus frequency on España Blvd during peak hours: estimated **3–6 min headways** combined across all routes.

**Route 6 vs Route 7 distinction** (contested): Both use the same España corridor but diverge at northern terminus — Route 6/6A originates from Sapang Palay/Norzagaray (Bulacan), Route 7 from SM City Fairview. Some operator data conflates these as variants. LTFRB treats them as distinct franchises.

### MEDIUM Confidence

| Route | Name | Key Info |
|-------|------|----------|
| Route 3 | Antipolo–Quiapo | Passes through España Blvd en route to Quiapo; some variants documented |
| Route 5 | Quezon Ave–Angat | Originates at Quezon Ave terminal; northern endpoint in Bulacan |
| Baclaran–SM Fairview | MMBC/city bus | Via Quiapo; some variants use España segment |

---

## QCityBus Routes (Confirmed, Zero-Fare)

| Route | Name | Corridor Relevance |
|-------|------|--------------------|
| **QC3** | Welcome Rotonda–Aurora-Katipunan | **Starts at Welcome Rotonda** (España/QAve junction); connects to LRT-2 Katipunan; 8 confirmed stops along E. Rodriguez |
| **QC6** | QC Hall–Gilmore (via Quezon Ave) | Uses Quezon Avenue segment; stops at Quezon Ave/PCMC, Quezon Ave/EDSA, Quezon Ave/Delta |

QCityBus Route 3 is particularly significant: it provides **free** connection from the España/Welcome Rotonda junction to LRT-2 Katipunan, serving students and commuters from the University Belt seeking rail access.

---

## Love Bus (Electric Minibus, Zero-Fare, QC-operated)

| Route | Name | Corridor Stops |
|-------|------|----------------|
| **L2** | VGC–Fairview | España Blvd / M. dela Fuente St, **España Blvd / Lacson Ave** (FEU/UST), Universidad de Santo Tomas gate |

**Note:** Love Bus L2 is the **only route with confirmed GPS stop coordinates at UST gates** (from OSM Wiki data). It provides zero-fare electric bus service from Valenzuela Government Center through the University Belt to Fairview. As of QC Gov't October 2024 announcement, 8 new electric buses were procured; Love Bus continuity confirmed.

---

## Jeepney Routes

### HIGH Confidence

| Route ID | Name | Key Stops on Corridor |
|----------|------|----------------------|
| T3167 / MODERN-011 | Quezon Ave.–LRT 5th Ave. | **Quezon Ave.** → Gregorio Araneta Ave → 5th Ave. Caloocan |
| T3169 | Recto–Roxas District | via **Quezon Ave.**, **España Ave.** |
| T3119 | Munoz–Remedios | via **España Blvd**, Quiapo, L. Guinto |
| T311 | Balic-balic–España/M. dela Fuente | **España Blvd** terminus; via Vicente Cruz, G. Tuazon |
| T2120 | Litex–TM Kalaw | via Commonwealth → Elliptical → **Quezon Ave.** → **España Blvd** (13.9 km, A. Roces TSC) |
| QUIAPO-PROJ23 | Quiapo–Project 2&3 | **España (UST)** → **Quezon Ave (Welcome Rotonda)** → E. Rodriguez → Kamuning |
| QUIAPO-PROJ4-CUBAO | Quiapo–Project 4/Cubao | **España** → **Quezon Ave** → E. Rodriguez → Cubao |
| QUIAPO-FAIRVIEW | Quiapo–Fairview | **España** → **Quezon Ave** → Commonwealth → SM Fairview |
| BLUM-ESPANA-RIZALAV | España–Blumentritt | **España Blvd** at Blumentritt Rd corner → Laon Laan → Retiro → Chinese General Hospital |
| T3194 | Roosevelt Ave–Quiapo | Roosevelt Ave → Quezon Blvd → **Quiapo** |
| QUIAPO-DAPITAN | Quiapo–Dapitan | Quezon Blvd → **Dapitan Arcade, Sampaloc** (UST Medical area) |

### MEDIUM Confidence

| Route ID | Name | Key Stops |
|----------|------|-----------|
| T334 | Lealtad–Quiapo | Via Sampaloc interior streets |
| T338 | North Harbor–Quiapo | Via Evangelista to Quiapo |
| T348 | Arroceros–Cubao | via **España** (OSM Wiki listed) |
| T367 | Arroceros–Project 8 | via **España** (OSM Wiki listed) |
| T384 | España–Project 2&3 | via Timog (inner Quezon City) |
| T3228 | Cubao–Recto | via **España** |
| QUIAPO-BLUMENTRITT | Quiapo–Blumentritt/Dimasalang | via Quezon Blvd, Dimasalang |
| DIV-MURPHY | Divisoria–Murphy | via Legarda, Lerma, Aurora |

**Orphan/unverified:** T333 (Lardizabal–Rizal Ave via M. dela Fuente), BLUM-IDREYS-CAMPA (Blumentritt–Delos Reyes/P. Campa via Dimasalang) — single-source mentions only.

---

## UV Express Routes

### HIGH Confidence

| Route ID | Name | Via España/Sampaloc? | Fare |
|----------|------|----------------------|------|
| UVE-N08 | G. Tuazon–Ayala | **Yes** — origin at G. Tuazon (Sampaloc), via España Blvd, Taft Ave | ~₱55 |
| UVE-MAK-01 | Ayala–G. Tuazon | Reverse of UVE-N08 | ~₱55 |
| UVE-C65 | Calumpit–CIT Quezon Ave | Terminates at **Quezon Ave CIT** (near EDSA) | varies |

### MEDIUM Confidence

| Route ID | Name | Notes |
|----------|------|-------|
| UVE-MAK-04 | Ayala–Suki Market (Mayon St.) | Terminates in Sampaloc (Mayon St.) |
| Marilao–Quezon Ave MRT | Marilao, Bulacan–Quezon Ave | ₱44 fare; terminates at MRT-3 Quezon Ave station |
| UVE-BUL-06 | Malolos–Quezon Avenue | NLEX → Quezon Ave terminal |

**Note on UV Express loading:** Per LTFRB 2022 rules, UV Express routes allow loading/unloading within 1 km of terminals only. The G. Tuazon terminal is within the España Blvd corridor (~200m from España/G. Tuazon intersection).

---

## Rail Integration

| Station | Line | Distance from Corridor | Connecting Routes |
|---------|------|-----------------------|-------------------|
| **Bambang** | LRT-1 | ~5 min walk from España/Bambang | Gateway to España Blvd; feeder jeepneys to UST |
| **Legarda** | LRT-2 | on Legarda St (parallel to España) | Serves UE, San Sebastian, CEU, San Beda |
| **Recto** | LRT-1 + LRT-2 | southern end at Quiapo | Major interchange; Morayta walkable |
| **Quezon Ave MRT** | MRT-3 | northern end (Quezon Ave/EDSA) | Northern CIT terminal connection |
| **España (PNR)** | PNR (suspended) | España Blvd | PNR suspended in Manila (2023); historically augmentation bus Route served PNR España stop |

**LRT-2 Legarda** is the most important rail node for the University Belt: students from UE, San Sebastian, CEU, San Beda, La Consolacion, and Holy Spirit use it to access corridor. UST is ~1.5 km west of Legarda station (walkable or short jeep ride).

---

## Contested Routes / Conflicts

| Conflict | Details | Resolution |
|----------|---------|------------|
| **Route 6 vs 6A** | Some sources list as separate routes (different northern origins: Sapang Palay vs Norzagaray), others as single route with two variants | Treat as same franchise with variant northern terminus; both serve España-Quezon Ave segment identically |
| **Route 6 vs Route 7 España segment** | Both use España Blvd–Lerma–Quezon Blvd; some operator maps show both using same stops | Confirmed both serve the same España corridor segment; different termini only |
| **Love Bus continuity** | Some 2023 sources suggest Love Bus routes were discontinued post-pandemic; but QC Gov't confirmed new electric bus procurement Oct 2024 | Love Bus L2 confirmed operational as of 2024; flag for field verification |
| **T3169 Recto–Roxas District routing** | Unclear whether route takes Quezon Ave → España or goes via Lerma directly | Single source; low confidence on exact alignment |

---

## Key Gaps

1. **No dedicated busway on España Blvd**: Unlike EDSA Carousel, España has no dedicated bus lane. Buses share mixed traffic, causing major bottlenecks near UST and Quiapo.
2. **No consolidated terminal at España/Welcome Rotonda**: Buses stop informally at España/Morayta footbridge area for passenger loading. No official designated terminal data.
3. **Missing stop GPS coordinates**: For all jeepney routes on España/Lacson/Morayta grid, no GPS stop data available in any source.
4. **G. Tuazon UV Express terminal coordinates**: Terminal location confirmed at G. Tuazon St., Sampaloc but exact GPS unknown.
5. **Route 5 (Quezon Ave–Angat)**: Sparse stop data; no confirmed stops between Quezon Ave and Angat; possibly low-frequency route.
6. **Mendiola–España connector**: Mendiola St (near San Beda, PLM, PGH) connects to España/Lacson; no mapped jeepney route specifically covers this street, though walking is common.

---

## Summary Statistics

| Mode | Confirmed Routes (HIGH) | Confirmed Routes (MEDIUM) | Orphan/Unverified |
|------|------------------------|--------------------------|-------------------|
| City Bus | 4 | 3 | 0 |
| QCityBus | 2 | 0 | 0 |
| Love Bus | 1 | 0 | 0 |
| Jeepney | 11 | 8 | 2 |
| UV Express | 3 | 3 | 0 |
| **Total** | **21** | **14** | **2** |

**Total routes identified**: 37 (21 confirmed + 14 medium + 2 orphan)

---

## Sources

- `raw/city-bus-operators-routes.json` — Routes 5, 6, 7, 17, 34, QC3 confirmed
- `raw/ltoportal-ph-routes.json` — Routes 6, 7, 17, 34 high-confidence
- `raw/wikimili-routes.json` — Routes 17, 34, 49 (Quezon Ave)
- `raw/osm-transit-relations-routes.json` — Routes 3, 6, 17, 34, QC3, Love Bus L1/L2
- `raw/ltfrb-jeepney-routes.json` — T3167, T3169, T3119, MODERN-011
- `raw/ltfrb-bus-routes.json` — Routes 5, 6, 7, QC3
- `raw/ltfrb-uv-express-routes.json` — UVE-N08, UVE-C65, UVE-MAK-01/04, UVE-BUL-06
- `raw/other-major-terminals-routes.json` — T3119, T3194, QUIAPO-PROJ23, QUIAPO-PROJ4-CUBAO, QUIAPO-FAIRVIEW, BLUM-ESPANA-RIZALAV, QUIAPO-DAPITAN, DIV-MURPHY
- `raw/lrt1-feeder-routes.json` — LRT-1 Bambang feeders, Central Station feeders from UST/Dapitan
- `raw/university-shuttles-routes.json` — UP-SM-NORTH (via MRT Quezon Ave)
- `wiki.openstreetmap.org/wiki/Metro_Manila/Bus_routes` — Routes 6, 7, 17, 34 with España Blvd stop sequences; Love Bus L2 UST stops
- `wiki.openstreetmap.org/wiki/Metro_Manila/Jeepney_and_UV_Express_routes` — T311, T348, T367, T384, T2120, T3228
- Moovit search results — T3169 Recto-Roxas District; Quezon Ave–Pan-Philippine jeepney
- Search: commutetour.com/buendia-to-espana — bus routing via España
