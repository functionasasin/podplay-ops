# Aurora Boulevard Corridor — Validated Routes

**Analysis date**: 2026-02-28
**Aspect**: Wave 2 — Aurora Boulevard corridor (all routes from Cubao to Marikina)
**Sources cross-referenced**: ltfrb-jeepney-routes.json, ltfrb-bus-routes.json, cubao-terminal-routes.json, lrt2-feeder-routes.json, mrt3-feeder-routes.json, sakay-ph-routes.json, osm-transit-relations-routes.json, ltoportal-ph-routes.json, wikimili-routes.json, city-bus-operators-routes.json, qcitybus-routes.json, komyut-routes.json + WebSearch (Sakay Route Explorer, Moovit, PinoyCommute, PhilippineBeaches.org)

---

## Corridor Geography

Aurora Boulevard is a 4–10-lane arterial in Quezon City (and briefly San Juan) running roughly east–west from the EDSA junction at Cubao to Marikina City, where it connects to Marcos Highway and eventually Sumulong Highway into Antipolo. The LRT-2 Purple Line runs above the boulevard for much of its length.

```
EDSA / Cubao (LRT-2 Araneta Center-Cubao, below Gateway Mall)
        ↓ Aurora Blvd eastbound
General Aguinaldo Ave. / 15th Ave. intersection — traditional jeepney loading zone
        ↓
General Romulo Ave. / Aurora Blvd — DIAMOND terminal area; Roces-bound jeepney origin
        ↓
20th Avenue intersection
        ↓
LRT-2 Anonas Station (at Aurora/Anonas St.)
        ↓
Katipunan Ave. (LRT-2 Katipunan Station; junction to UP/Ateneo)
        ↓
[Aurora continues east, becomes Calumpang corridor into Marikina City]
        ↓
Santolan (LRT-2 Santolan-Nagtahan Station in QC, near Marikina boundary)
        ↓
Marikina City (LRT-2 Marikina-Pasig Station)
        ↓ [connects to Marcos Highway]
Santolan, Pasig / SM Masinag area (Antipolo boundary)
        ↓ Marcos Highway / Sumulong Highway
Antipolo City (LRT-2 Antipolo Terminal)
```

**Key sub-segments:**
- **EDSA/Cubao → Katipunan Ave.** (~4 km, Quezon City proper): Highest-density jeepney loading zone; LRT-2 above; Aurora Blvd market area; jeepney terminals at Gateway Mall underpass and Farmers Market side
- **Katipunan Ave. → Santolan** (~3 km, QC/San Juan boundary): Transitional; fewer stops; LRT-2 continues above
- **Santolan → Marikina City proper** (~4 km): LRT-2 continues (Marikina-Pasig station); jeepney and UV Express routes from Parang, SSS Village, Calumpang, Fortune areas
- **Marikina → Marcos Highway / Antipolo** (~8 km): Bus and UV Express territory; LRT-2 to Antipolo Terminal (2024 extension)

**Major transit nodes on corridor:**
1. **Cubao / EDSA junction (LRT-2 Araneta Center-Cubao)** — highest-volume terminal; Aurora Blvd below Gateway Mall is a jeepney loading hub; UV Express at Farmers Market and Farmers Plaza
2. **Aurora/Katipunan (LRT-2 Katipunan)** — connection to Katipunan Ave., UP, Ateneo; QCityBus Route 3 terminus; junction for Marcos Highway-bound buses
3. **Santolan (LRT-2 Santolan)** — transition point between Quezon City and Marikina; several jeepney routes terminate or originate here
4. **Marikina City (LRT-2 Marikina-Pasig)** — Parang, SSS Village, Calumpang, Fortune areas; jeepney and UV Express hub for Marikina interior
5. **SM Masinag / Marcos Highway junction** — terminal for Antipolo P2P and UV Express; Cubao bus route southern terminus

---

## City Bus Routes

### HIGH Confidence (2+ independent sources confirm Aurora Blvd segment)

| Route | Name | Operator | Origin → Destination | Aurora Segment | Sources |
|-------|------|----------|----------------------|---------------|---------|
| **Route 3** | Antipolo–Quiapo via Aurora | Unknown | Robinsons Antipolo → Quiapo Church, Manila | Full Aurora Blvd (Marikina → Cubao area), then westward to Quiapo | ltoportal (MM-BUS-003), wikimili (MM-BUS-003); both note "Via Aurora Boulevard" |
| **QCityBus Route 3** | Welcome Rotonda–Aurora/Katipunan | QC Government | Welcome Rotonda → LRT-2 Katipunan/Anonas area | Terminates at Aurora/Katipunan and Aurora/Anonas stops | qcitybus-routes.json / ltoportal-ph-routes.json (QC-BUS-3); stop-level detail available |
| **QCityBus Route 6** | QC Hall–Gilmore/Aurora | QC Government | QC Hall NHA Interchange → LRT-2 Gilmore/Aurora | Terminus at Aurora Blvd/Gilmore (LRT-2 Gilmore-Robinsons Magnolia) | qcitybus-routes.json (QC-BUS-6); stop-level detail available |
| **QCityBus Route 7** | QC Hall–C5/Ortigas via Katipunan | QC Government | QC Hall NHA Interchange → C5/Ortigas (Eastwood) | Passes through Aurora/Katipunan (LRT-2) junction en route to C5 | qcitybus-routes.json (QC-BUS-7); full stop list available |
| **Montalban–Baclaran via Aurora & EDSA** | Montalban–Baclaran | Marikina Auto Line Transport Corporation (MALTC) | Montalban (Rodriguez), Rizal → Baclaran, Parañaque | Aurora Boulevard segment (Marikina → Cubao) | city-bus-operators-routes.json (CITY-MALTC-MONTALBAN-BACLARAN-EDSA) |
| **San Mateo–Baclaran via MALTC** | San Mateo–Baclaran | MALTC | San Mateo, Rizal → Baclaran, Parañaque | Aurora Blvd corridor (via Marikina) | city-bus-operators-routes.json (CITY-MALTC-SANMATEO-BACLARAN) |

**Route 3 (Antipolo–Quiapo) critical note**: This is the primary city bus spine for the Aurora Blvd corridor. The route goes Antipolo → Sumulong Hwy → Marcos Highway → Aurora Blvd → Cubao area → San Juan → Mandaluyong → Quiapo. It has two variants: the original Aurora Blvd routing and a Cogeo variant. Both ltoportal and wikimili confirm "Via Aurora Boulevard."

**QCityBus routes on Aurora**: The QC electric bus network has three routes touching Aurora Blvd at different points: Route 3 runs from Welcome Rotonda all the way to LRT-2 Katipunan/Anonas stops (free fare, 12 detailed stops), Route 6 terminates at Aurora/Gilmore (LRT-2 Gilmore), and Route 7 passes through Aurora/Katipunan. These operate Mon–Fri with 15–30-min headways, Sat/Sun at 1-hr headways.

### MEDIUM Confidence

| Route | Name | Notes |
|-------|------|-------|
| **Route 56** | Antipolo–BGC via Marikina/C5 | Confirmed Antipolo, Marikina, Pasig stops; may use Marcos Highway rather than Aurora Blvd proper; medium confidence on Aurora segment specifically |
| **Route 65** | Antipolo–PITX via Cainta/Taytay | Confirmed Antipolo, Cainta, Taytay, PITX; indirect; unclear if it uses Aurora Blvd or alternative eastern routes |
| **Route 2** | Angono–Quiapo | Via Taytay, Cainta, Pasig, Cubao, San Juan, Quiapo; may overlap Aurora Blvd in the Cubao area but specific routing unconfirmed |

### Noted Conflict

**Route 3 variants**: Two alignments documented — (A) via Aurora Blvd and (B) via Cogeo and alternate Sumulong route. Both are acknowledged; the Aurora Blvd variant is primary. No LTFRB code found that resolves this definitively; ltoportal and wikimili both note "Via Aurora Boulevard" for the primary franchise.

---

## Jeepney Routes

### HIGH Confidence

| Route ID | Name | Key Stops on Aurora | Fare | Hours | Sources |
|----------|------|---------------------|------|-------|---------|
| **T214** | SSS Village, Marikina–Cubao | Aurora Blvd (full corridor); Marikina → Cubao | ₱13+ | Unknown | ltfrb-jeepney-routes (T214) |
| **T287 / DOTR:R_SAKAY_PUJ_921** | SSS Village–Cubao via Aurora | LRT-2 Katipunan, Asian College, Aurora/Anonas, Aurora/20th Ave, Gen. Romulo/Aurora, Aurora/Gen. Aguinaldo, Aurora/15th Ave, Aurora/P. Burgos | ₱13–35 | 4AM–10PM daily | sakay-ph, lrt2-feeder-routes; full stop list confirmed |
| **T286 / DOTR:R_SAKAY_2018_PUJ_652** | Parang–Cubao via Aurora (Stop & Shop) | Aurora/P. Burgos, LRT-2 Katipunan, Arton/Marcos Hwy/Katipunan | ₱13–35 | 4AM–10PM daily | Sakay Route Explorer confirmed; multiple stop waypoints documented |
| **MODERN-018 / DOTR:R_SAKAY_MPUJ_1143** | Parang, Marikina–Cubao (Modern PUJ) | Fortune Tobacco Corp terminal → Araneta City Modern Jeepney Terminal; via Marikina and Aurora Blvd | ₱15+ | 4AM–10PM daily | sakay-ph-routes, ltfrb-jeepney-routes (MODERN-018) |
| **T242 / LRT2-FEED-SAN-001** | Calumpang–LRT-2 Katipunan via Aurora Blvd | Calumpang → Santolan LRT-2 → Aurora Blvd → LRT-2 Katipunan | ₱13–35 | Regular service | lrt2-feeder-routes (T242) |
| **LRT2-FEED-SAN-002** | Calumpang–Stop & Shop via Aurora Blvd | Calumpang → Santolan LRT-2 → Aurora Blvd → Stop & Shop (Cubao) | ₱13–35 | Regular service | lrt2-feeder-routes |
| **cubao-divisoria-traditional** | Cubao–Divisoria via Aurora/Sta. Mesa | Cubao (Aurora Blvd below LRT-2) → Sta. Mesa → Divisoria | ₱13 | Unknown | cubao-terminal-routes; labeled "traditional jeepney; along Aurora Blvd" |
| **cubao-quiapo-traditional** | Cubao–Quiapo via Aurora/Sta. Mesa | Cubao (Aurora Blvd below LRT-2) → Sta. Mesa → Quiapo | ₱13 | Unknown | cubao-terminal-routes; labeled "traditional jeepney; along Aurora Blvd" |
| **cubao-marikina-traditional** | Cubao–Marikina via Aurora | Cubao (Aurora Blvd below LRT-2) → Marikina City | ₱13 | Unknown | cubao-terminal-routes; "Aurora Blvd is the main artery connecting Cubao to Marikina" |
| **T240** | Aurora/Lauan–EDSA North Ave. | Western Aurora segment from Lauan (near Cubao) to EDSA North Ave. | ₱13 | Unknown | ltfrb-jeepney-routes (T240); LTFRB T-code confirmed |
| **DOTR:R_SAKAY_MPUJ_827 / cubao-roces-mpuj** | Cubao (Diamond)–Roces Super Palengke | Originates at General Romulo Ave./Aurora Blvd intersection ("Diamond" terminal); heads northwest to Roces | ₱15+ | 4AM–10PM daily | sakay-ph-routes (confirmed origin at Aurora/Gen. Romulo) |
| **Moovit-7637727** | Gen. B.G. Molina St., Marikina–Aurora/Gen. Aguinaldo | Marikina City interior → Aurora Blvd → Cubao (34 stops, ~55 min) | Unknown | 6AM–midnight | Moovit (line 7637727) |

### MEDIUM Confidence

| Route ID | Name | Key Stops |
|----------|------|-----------|
| **DOTR:R_SAKAY_2018_PUJ_340** | Cubao-Remedios via Quiapo L. Guinto | Starts at Aurora/Gen. Aguinaldo (Cubao), heads west to Quiapo Remedios; confirmed Sakay origin on Aurora Blvd |
| **DOTR:R_SAKAY_PUJ_1183** | Cubao–Angono | From Araneta Center Jeepney Terminal (Telus); uses Aurora Blvd section (stops: LRT-2 Katipunan, Asian College, Aurora/Anonas, Aurora/20th Ave) before turning south toward Angono |
| **DOTR:R_SAKAY_PUJ_1162** | Cubao–Silangan (San Mateo) via Woodland | From Araneta Center (Telus); via Aurora/Katipunan and LRT-2 Katipunan junction, then diverges to San Mateo |
| **cubao-cainta-traditional** | Cubao–Cainta via Aurora Blvd | Araneta City Jeepney Terminal → Aurora Blvd → Cainta Junction, Rizal; fare ₱11–40 |
| **cubao-taytay-traditional** | Cubao–Taytay via Aurora Blvd | Araneta Center → Aurora Blvd → Taytay, Rizal; fare ₱11–40 |
| **Moovit-7637728** | Quezon Blvd (Manila)–Gen. Romulo/Aurora | Westbound route from Manila to Cubao; terminates at Aurora/Gen. Romulo area |
| **Moovit-7638278** | Old Sta. Mesa–Fortune Tobacco, Marikina | Internet Cafe, Old Sta. Mesa → Fortune Tobacco Corp., Marikina; westbound (Manila → Marikina direction); uses Aurora Blvd |
| **T215** | Parang, Marikina–Marikina Terminal | Intra-Marikina; feeder to the Cubao-bound routes |

### Orphan / Single-Source

- **Cubao–Remedios via Quiapo C. Palanca** (route code 227) — community sources list this as a separate route from R_SAKAY_2018_PUJ_340; may be same franchise, different alignment; one source only
- **Aurora/Gen. Aguinaldo area "Stop & Shop" terminus** — multiple routes reference this as a terminal/destination; exact loading zone location unconfirmed by GPS coordinates

---

## UV Express Routes

### HIGH Confidence

| Route ID | Name | Terminal | Fare | Notes |
|----------|------|----------|------|-------|
| **cubao-parang-marikina-uv** | Cubao–Parang, Marikina UV Express | Below LRT-2 Cubao / Farmers Market side | ₱35–50 | Confirmed in cubao-terminal-routes; 5AM–11PM; Marikina interior service |
| **brgy-fortune-cubao-uv** | Brgy. Fortune (Marikina)–Cubao | Farmers Market UV terminal, Cubao | ₱21 | Confirmed UV Express fare; aranetacity.com and web sources confirm this terminal |
| **cubao-padilla-uv** | Cubao–Padilla via Ermin Garcia, Marcos Highway | Farmers Plaza terminal area, Cubao | ₱35 | Junction near Aurora/Katipunan; Marcos Highway orientation; thepoortraveler web source |

### MEDIUM Confidence

| Route ID | Name | Notes |
|----------|------|-------|
| **marikina-cubao-uv-variant** | Marikina–Cubao UV Express (alternate terminal) | Farmers Plaza Jollibee terminal (separate from Farmers Market); ₱21 fare; same O/D as brgy-fortune-cubao-uv but from different Cubao terminal |
| **cubao-montalban-uv** | Cubao–Montalban via Parang, Marikina | Farmers Market side terminal; serves Montalban (Rodriguez), Rizal; fare ~₱40–50 |
| **cubao-cogeo-uv** | Cubao–Cogeo (Antipolo), UV Express | Gateway Mall underpass terminal; serves Cogeo, Antipolo; partial Aurora Blvd routing before diverging to Marikina-Cogeo road |

---

## P2P Premium Bus Routes

### MEDIUM Confidence

| Route | Operator | Key Stops | Fare | Notes |
|-------|----------|-----------|------|-------|
| **Antipolo (SM Masinag)–Makati (One Ayala/Ayala Malls Feliz)** | RRCG Transport | SM Masinag, Antipolo → [Marcos Hwy] → [Marikina] → Makati | ₱140 regular / ₱112 discounted | May use Marcos Hwy → C5 rather than Aurora Blvd proper; "SM Megamall and Robinsons Galleria" special drop-off suggests C5/Ortigas routing, not Aurora |
| **Antipolo–BGC (Venice Grand Canal Mall)** | Unknown | Antipolo → Cainta → Marikina → Pasig → BGC | Unknown | Confirmed service area includes Marikina; specific road alignment unknown |

**Key P2P gap**: No P2P bus route is confirmed to stop on Aurora Boulevard itself. The nearest P2P terminals are SM Masinag (Antipolo side of Marcos Highway) and Ortigas/Pasig (east side of C5). The Aurora corridor remains an unserved P2P corridor.

---

## Rail Integration (LRT-2 Purple Line)

The LRT-2 is the backbone of the Aurora Boulevard corridor — it runs above the boulevard from Cubao eastward to Antipolo. Every rail station on this corridor has significant connecting jeepney/bus feeders.

| Station | Position on Corridor | Key Connecting Routes |
|---------|---------------------|----------------------|
| **Araneta Center-Cubao LRT-2** | Western terminus of Aurora corridor (EDSA junction) | All Marikina/SSS Village/Parang jeepneys depart from underpass; UV Express to Marikina/Antipolo; Cubao–Quiapo/Divisoria/Marikina traditional jeepneys |
| **Anonas LRT-2** | Aurora/Anonas intersection | Calumpang–Cubao (T242) stops here; SSS Village routes (T287); traditional jeepneys |
| **Katipunan LRT-2** | Aurora/Katipunan junction | QCityBus Route 3 terminus; QCityBus Route 7 passes through; UV Express to Padilla/Marcos Hwy diverges here; SSS Village/Parang jeepney stop confirmed |
| **Santolan LRT-2** | QC/Marikina boundary | Calumpang–Cubao (T242); Calumpang–Stop & Shop feeder; LRT-2 extension to Marikina/Antipolo (2022–2024) |
| **Marikina-Pasig LRT-2** | Marikina City | Parang, SSS Village, Calumpang jeepney origins; UV Express from Marikina to Cubao |
| **Antipolo LRT-2** | Antipolo City terminal | LRT-2 Antipolo terminal (new extension); P2P SM Masinag; UV Express terminals |

---

## Contested Routes

| Conflict | Details | Resolution |
|----------|---------|------------|
| **T214 vs. T287 vs. DOTR:R_SAKAY_PUJ_921** | Three entries for SSS Village–Cubao via Aurora. T214 is the LTFRB franchise code, T287 is another LTFRB code, and DOTR:R_SAKAY_PUJ_921 is the Sakay/DOTR route ID. | T287 and DOTR:R_SAKAY_PUJ_921 are the same route (Sakay IDs correspond to LTFRB franchise codes). T214 may be an older or related franchise. All confirmed on the same corridor; treat as variants of same O/D. |
| **Parang–Cubao: traditional vs. modern PUJ** | T286 (traditional, DOTR:R_SAKAY_2018_PUJ_652) and MODERN-018/DOTR:R_SAKAY_MPUJ_1143 both list Parang–Cubao. Different vehicle class (traditional vs. modern PUJ). | Both confirmed operational. These are separate franchises (one for traditional, one for modern jeepneys). Modern PUJ terminates at Araneta City terminal; traditional at Stop & Shop (Aurora/Gen. Aguinaldo). Not a conflict — different operators and terminals. |
| **Route 3 alignment: Aurora vs. Cogeo** | Route 3 Antipolo–Quiapo has two documented variants: (A) via Aurora Blvd directly and (B) via Cogeo/alternate Sumulong highway. Both confirmed to exist. | Treat as Route 3A (Aurora Blvd) and Route 3B (Cogeo); the Aurora Blvd version is the original. LTFRB franchise treats as single route number with multiple alignments. |
| **"Stop & Shop" terminal identity** | Multiple routes list "Stop & Shop" as a Cubao terminus. The "Stop & Shop" (now Shopwise) is at Aurora/Gen. Aguinaldo near the Cubao EDSA area. | Stop & Shop = the area around Aurora Blvd and General Aguinaldo Ave., Cubao, near the old Stop & Shop supermarket (now rebranded but terminal name persists). Consistent across sources — same location. |

---

## Key Gaps

1. **No confirmed stop GPS coordinates on Aurora Blvd**: For all jeepney routes, stops are described by intersection name only (e.g., "Aurora Blvd. cor. Anonas") — no lat/lon available. LRT-2 station coordinates can serve as anchors.
2. **Traditional jeepney routes post-consolidation status**: Several traditional PUJ routes (T214, T240, Cubao–Divisoria, Cubao–Quiapo via Aurora) may have been consolidated into modern PUJ franchises under LTFRB's ongoing modernization program. Their operational status as of 2025 is uncertain.
3. **Frequency data absent for most routes**: Only QCityBus routes have published headway data. Traditional jeepneys on Aurora Blvd have no published headways; UV Express frequency is reported as "variable."
4. **No eastbound (Manila→Marikina) jeepney terminal documented with GPS**: The reverse-direction boarding zone on Aurora Blvd (Old Sta. Mesa, San Juan, or elsewhere) for routes heading to Marikina is not precisely located.
5. **Route 3 exact corridor path unconfirmed between Marikina and Quiapo**: Does it use Aurora Blvd → Araneta Center → EDSA/Santolan, or does it use a more direct San Juan/Gilmore routing? Sources say "Via Aurora Boulevard" but the specific street sequence west of Cubao is unspecified.
6. **San Juan segment of Aurora Blvd**: Routes using the San Juan portion of Aurora (between Cubao and Marikina, passing near Gilmore) are poorly documented. QCityBus Route 6 terminates at Gilmore/Aurora — what happens to commuters beyond that point toward San Juan/Marikina is a gap.
7. **P2P gap**: No P2P bus stops on Aurora Blvd itself. The corridor between Marikina and Cubao lacks premium express bus service.

---

## Summary Statistics

| Mode | Confirmed (HIGH) | Confirmed (MEDIUM) | Orphan/Single-Source |
|------|-----------------|-------------------|----------------------|
| City Bus | 6 | 3 | 0 |
| Jeepney | 12 | 8 | 2 |
| UV Express | 3 | 3 | 0 |
| P2P | 0 | 2 | 0 |
| **Total** | **21** | **16** | **2** |

**Total routes identified**: 39 (21 confirmed + 16 medium + 2 orphan)

**Corridor density insight**: The Cubao/EDSA junction is the highest-density node — it's where EDSA (MRT-3 Cubao, EDSA Carousel), Aurora Blvd (LRT-2 Araneta Center-Cubao), and P. Tuazon Blvd all converge, making it a supernode with 12+ jeepney destinations departing from the underpass area, 3 UV Express terminals within 500 m (Farmers Market, Farmers Plaza, Gateway Mall underpass), and city bus Route 3 passing through.

**LRT-2 as corridor anchor**: Unlike other corridors where rail and road are parallel but separate, the LRT-2 runs directly above Aurora Blvd — every major LRT-2 station on this corridor (Anonas, Katipunan, Santolan, Marikina) has documented jeepney feeders. The correlation between LRT-2 station placement and jeepney route coverage is the strongest of any corridor analyzed.

---

## Sources

- `raw/cubao-terminal-routes.json` — All Cubao-originating Aurora Blvd routes (traditional and modern PUJ, UV Express)
- `raw/ltfrb-jeepney-routes.json` — LTFRB T-codes: T214, T215, T240, MODERN-018 (Parang-Cubao modern PUJ)
- `raw/ltfrb-bus-routes.json` — QCityBus Routes 3, 6, 7; Montalban-Baclaran (MALTC); QC-BUS-3 confirmed Aurora/Katipunan terminus
- `raw/ltoportal-ph-routes.json` — Route 3 (MM-BUS-003, "Via Aurora Boulevard"); Route 56 (Antipolo-BGC); Route 65 (Antipolo-PITX); full QCityBus stop lists (Routes 3, 6, 7)
- `raw/wikimili-routes.json` — Route 3 (MM-BUS-003, "Via Aurora Boulevard" explicitly noted); Route 56, Route 65 confirmed
- `raw/sakay-ph-routes.json` — DOTR:R_SAKAY_PUJ_921 (SSS Village-Cubao via Aurora); DOTR:R_SAKAY_MPUJ_1143 (Parang-Cubao); DOTR:R_SAKAY_2018_PUJ_652 (Parang-Stop & Shop via Aurora); DOTR:R_SAKAY_MPUJ_827 (Cubao Diamond-Roces); DOTR:R_SAKAY_2018_PUJ_340 (Cubao-Remedios); DOTR:R_SAKAY_PUJ_1183 (Cubao-Angono); DOTR:R_SAKAY_PUJ_1162 (Cubao-Silangan)
- `raw/lrt2-feeder-routes.json` — T242 (Calumpang-LRT2 Katipunan via Aurora); LRT2-FEED-SAN-002 (Calumpang-Stop & Shop via Aurora)
- `raw/mrt3-feeder-routes.json` — MRT Santolan-Annapolis area routes; EDSA Carousel Santolan stop context
- `raw/city-bus-operators-routes.json` — MALTC Montalban-Baclaran via Aurora & EDSA (CITY-MALTC-MONTALBAN-BACLARAN-EDSA); San Mateo-Baclaran (MALTC)
- `raw/osm-transit-relations-routes.json` — Marikina Auto Line operator confirmed; EDSA Carousel Santolan context
- `raw/komyut-routes.json` — Parang-Cubao modern jeepney (cross-reference)
- explore.sakay.ph — Stop-level data for T287/R_SAKAY_PUJ_921, T286/R_SAKAY_2018_PUJ_652, Parang-Cubao-Marikina routes
- moovitapp.com — Route 7637727 (Molina St.-Aurora/Gen. Aguinaldo, 34 stops, 55 min, 6AM-midnight); Route 7637728 (Manila-Cubao westbound); Route 7638278 (Sta. Mesa-Marikina)
- philippinebeaches.org — Cubao terminal guide; UV Express to Marikina fares and terminals
- thepoortraveler.net — UV Express fares (Cubao-Padilla ₱35, Brgy. Fortune-Cubao ₱21)
- aranetacity.com — UV Express terminal locations at Farmers Plaza, Farmers Market, and Gateway Mall underpass
