# Shaw Boulevard Corridor — Cross-Reference & Validation

**Analysis date:** 2026-02-28
**Aspect:** Wave 2 — Shaw Boulevard corridor
**Scope:** All routes using any segment of Shaw Boulevard, from Kalentong (Mandaluyong/Manila boundary) to C-5 (Pasig), including the EDSA Central Terminal hub and MRT-3 Shaw Boulevard Station feeders

---

## Corridor Geography

Shaw Boulevard (formerly Jose Rizal Boulevard / Pasig Boulevard; colloquially "Crossing") is a 4–8 lane highway connecting **Mandaluyong City** and **Pasig City**.

**West terminus:** Kalentong Street / Sevilla Bridge (crosses San Juan River; boundary of Mandaluyong and Manila)
**EDSA Intersection:** The defining node of the corridor. MRT-3 Shaw Blvd Station sits directly above; Starmall EDSA-Shaw and Shangri-La Plaza flank the intersection. EDSA Central Jeepney Terminal is the primary road-based hub.
**East section (Pasig):** Shaw Blvd becomes a dual six-lane carriageway east of EDSA, passing Greenfield District, Pioneer St, Caruncho Ave / Market Ave junction, Capitol Commons / Kapitolyo, San Miguel Ave, Doña Julia Vargas Ave, Meralco Ave flyover, eventually narrowing and connecting to C-5 / Pasig Boulevard at the eastern boundary.

**Total corridor length (Kalentong → C-5):** ~6.5 km within NCR

**Key cross-streets and landmarks (west to east):**
1. Kalentong Street / Sevilla Bridge — western gateway into Manila
2. General Kalentong Street junction (Mandaluyong interior)
3. Boni Avenue area (Mandaluyong, approaching EDSA)
4. **EDSA intersection** — MRT-3 Shaw Station, EDSA Central Terminal, Starmall EDSA-Shaw
5. Greenfield District (east of EDSA, Mandaluyong/Pasig border area)
6. Pioneer Street junction (Pasig)
7. Caruncho Ave / Market Ave intersection (Pasig)
8. Kapitolyo / Capitol Commons (Pasig)
9. San Miguel Avenue junction (Pasig)
10. Doña Julia Vargas Avenue / Meralco Ave flyover (Pasig; connects to Ortigas Center)
11. C-5 / Pasig Boulevard (eastern terminus)

**Sister corridor:** Ortigas Avenue runs parallel to and south of Shaw Blvd through Pasig (see `validated-ortigas-avenue-corridor.md`). The two corridors share some eastern destinations and compete for Rizal province traffic.

---

## Two Jeepney Terminals at MRT Shaw Station

There are **two distinct jeepney/UV Express terminals** near MRT-3 Shaw Blvd Station, both documented in field sources:

**Terminal 1: Greenfield District Terminal (Northbound exit)**
- Location: ~15–20 m from MRT Shaw northbound exit
- Size: Small (2–3 vehicles per route); longer wait times
- Destinations served: Antipolo, Baytown, Binangonan, Cainta-Parola, Floodway, Morong, Pasig Palengke, Shopwise, Tanay, Tektite (Ortigas), Teresa, Tiendesitas, Ugong, Ynares Center Antipolo

**Terminal 2: Main EDSA Central Terminal (Southbound exit)**
- Location: ~20 m from MRT Shaw southbound exit; larger complex along Shaw Blvd
- Size: Larger; more frequent departures
- Destinations served: Antipolo Simbahan (Ynares Center), Ugong-Tektite (San Miguel Ave/Ortigas), DEPED, Meralco Ave, Pasig Palengke, Tiendesitas, Ynares Sports Complex Pasig
- Also serves: Pateros, Tipas (Taguig), San Joaquin (Pasig), Morong (Rizal), Binangonan, Teresa

**Source:** directionsonweb.blogspot.com (2017, field-verified terminal mapping); corroborated by Wikipedia (Shaw Blvd Station article), Sakay live explorer routes, Moovit.

---

## Confirmed Routes by Mode

### City Bus Routes

| Route ID | Name | Origin | Destination | Key Stops | Fare | Confidence | Sources |
|----------|------|--------|-------------|-----------|------|------------|---------|
| Route 12 | Pasig–Kalentong via Shaw Blvd | Pasig City | Kalentong, Mandaluyong/Manila | Pasig → Shaw Blvd → Mandaluyong → Kalentong | ₱13 base | Medium | transit-blogs-enthusiast-sites (MC 2020-019 route list); Wikipedia |

**Note on Route 12:** Listed in the MC 2020-019 Metro Manila Bus Rationalization route table under the "Shaw corridor" category. However, current operation is **not confirmed by an independent source**. This is the only city bus route explicitly routed along Shaw Boulevard in official rationalization documents. Kalentong is on the western edge of Mandaluyong at the border with Manila (near Blumentritt/Santa Mesa). Shaw Blvd's westernmost section terminates at Kalentong, so this alignment is geographically plausible. **Confidence: Medium (single official source — rationalization list; no operator or OSM geometry identified).**

---

### Jeepney Routes

#### Eastern Shaw (EDSA Central Terminal → Pasig/Rizal)

| Route ID | Name | Origin | Destination | Key Stops | Fare | Confidence | Sources |
|----------|------|--------|-------------|-----------|------|------------|---------|
| PUJ_916 / T279 | EDSA/Shaw Central – Tipas (Taguig) via San Joaquin | EDSA Central Jeepney Terminal, Mandaluyong | M. Almeda, Pateros (via Tipas) | Shaw Blvd → Kapitolyo/Capitol Commons → C5 Bagong Ilog → Pasig Rotonda → Pasig Simbahan → San Joaquin → A. Luna St → M. Almeda, Pateros | ₱13 min | **High** | Sakay live explorer (DOTR:R_SAKAY_PUJ_916), LTFRB T279, web research |
| PUJ_923 | EDSA/Shaw Central – Morong, Rizal | EDSA Central Terminal, Mandaluyong | Morong, Rizal | Shaw Blvd → Pasig → Ortigas Ave Extension → Rizal Province → Morong | ₱13–60+ | **High** | Sakay live explorer (DOTR:R_SAKAY_PUJ_923), LTFRB DB |
| T276 | EDSA/Shaw Blvd – E. Rodriguez Ave / Brgy. Ugong, Vargas Ave | EDSA / Shaw Blvd | E. Rodriguez Ave / Vargas Ave, Pasig | Shaw Blvd east → Pasig interior | ₱13 | Medium | LTFRB jeepney DB, Moovit |
| T277 | EDSA/Shaw Blvd – E. Rodriguez / Ortigas Ave | EDSA / Shaw Blvd | E. Rodriguez / Ortigas Ave intersection | Shaw Blvd → Pasig → E. Rodriguez / Ortigas | ₱13 | Medium | LTFRB jeepney DB, Sakay, validated-ortigas-corridor |
| T278 | EDSA/Shaw Blvd – E.R./Ort (variant) | EDSA / Shaw Blvd | E. Rodriguez / Ortigas Ave | Shaw Blvd → Pasig → E. Rodriguez | ₱13 | Low | LTFRB jeepney DB (likely alignment variant of T277) |
| T290 | Antipolo – EDSA/Shaw Blvd | Antipolo, Rizal | EDSA / Shaw Blvd, Mandaluyong | Antipolo → Ortigas Ave → Meralco Ave → Textile Road → EDSA/Shaw | ₱13–40 | Medium | OSM code T290 (16.3 km); Moovit reverse direction |
| — | Shaw Blvd – Binangonan via Rizal Province | Shaw Blvd, Mandaluyong | Quezon Ext., Binangonan, Rizal | Shaw Blvd → Pasig → Ortigas Ave Extension → Rizal Province → Binangonan | ₱13–65+ | Medium | Moovit (103 stops, ~144 min) |
| — | EDSA/Shaw – Teresa via Rizal Province | EDSA/Shaw Blvd intersection | Quezon Ave, Teresa, Rizal | Shaw Blvd → Pasig → Ortigas Ave Extension → Rizal → Teresa | ₱13–80+ | Medium | Moovit (122 stops, ~118 min; 6AM–midnight) |

#### Intra-Pasig (Short Shaw Corridor)

| Route ID | Name | Origin | Destination | Key Stops | Headway | Confidence | Sources |
|----------|------|--------|-------------|-----------|---------|------------|---------|
| — | Shaw Blvd – San Miguel Ave (Pasig) | Shaw Blvd, Mandaluyong/Pasig | San Miguel Ave, Pasig City | Shaw → Pioneer → Kapitolyo → San Miguel Ave | ~15 min | Medium | LTFRB (Moovit/Rome2rio), ~8 min journey |
| — | Shaw Blvd – Meralco Ave/Doña Julia Vargas, Pasig | Shaw Blvd | Meralco Ave Flyover / Doña Julia Vargas, Pasig | Shaw → Pasig interior → Meralco Ave flyover | ~5 min | Medium | LTFRB (Moovit), ~5 min journey |
| — | Shaw Blvd – Caruncho Ave / Market Ave, Pasig | Shaw Blvd / A. Luna St | Caruncho Ave / Market Ave, Pasig | Shaw → BDO/Danny Floro → Shaw/Pioneer → Caruncho Ave | Regular | Medium | Moovit (6AM–11PM) |
| — | Mayflower (Mandaluyong) – Pioneer (Pasig) | Mayflower, Mandaluyong | Pioneer, Pasig City | Shaw Blvd (short segment) | ~5 min | Medium | Rome2rio, ~4 min journey |
| — | Shaw Blvd (short, Mandaluyong) | Shaw Blvd, Mandaluyong | EDSA / Shaw Blvd intersection | 10 stops, western Mandaluyong segment | Regular | Medium | Moovit (~16 min) |
| — | Firefly/Green Meadows Ave – Shaw Blvd | Firefly/Green Meadows Ave, Pasig | Shaw Blvd, Mandaluyong/Pasig | Eastern Shaw/Pasig area | Regular | Low | Moovit only |

#### Western Shaw (Mandaluyong → Manila)

| Route ID | Name | Origin | Destination | Key Stops | Confidence | Sources |
|----------|------|--------|-------------|-----------|------------|---------|
| — | Boni (Robinsons Complex) – Kalentong / JRC | Boni Ave / Robinsons Complex, Mandaluyong | Kalentong / JRC, Manila | Shaw Blvd west → Kalentong → Manila | Medium | Wikipedia (Shaw Blvd article) |
| — | Hulo – P. Victorino / Kalentong | Hulo, Mandaluyong | P. Victorino / Kalentong, Manila | Hulo → Shaw Blvd west → Kalentong | Medium | Wikipedia |
| — | Punta – Quiapo (Barbosa) via Sta. Mesa | Punta (Manila/Pasig area) | Quiapo, Manila | Shaw Blvd west → Kalentong → Sta. Mesa → Quiapo | Medium | Wikipedia |
| — | Divisoria – Punta via Sta. Mesa | Divisoria, Manila | Punta | Divisoria → Sta. Mesa → Shaw Blvd area | Medium | Wikipedia |
| — | Pasig (TP) – Quiapo (Echague) via Sta. Mesa, C. Palanca | Pasig terminal | Quiapo (Echague), Manila | Pasig → Shaw Blvd → Sta. Mesa → Quiapo | Medium | Wikipedia |

**Note on "TP":** "TP" in Filipino jeepney signage typically means "terminal" (also "talipapa" or a named transport terminal). "Pasig (TP)" likely refers to the Pasig City public market / terminal area near Caruncho Ave.

---

### UV Express Routes

| Route ID | Name | Origin | Destination | Fare | Confidence | Sources |
|----------|------|--------|-------------|------|------------|---------|
| — | Taytay – EDSA Central | Taytay, Rizal | EDSA Central (Shaw/EDSA), Mandaluyong | ₱40–60 | Medium | LTFRB UV Express DB, validated-ortigas-corridor |
| — | Antipolo – EDSA Central (various) | Antipolo, Rizal | EDSA Central Terminal | ₱40–80+ | Medium | directionsonweb (terminal listing), Wikipedia Shaw Blvd Station |
| — | Cainta – EDSA Central | Cainta, Rizal | EDSA Central Terminal | ₱25–40 | Medium | directionsonweb (terminal listing), Moovit |

**Note on EDSA Central UV Express:** Multiple Rizal province UV Express routes terminate at EDSA Central (Shaw/EDSA intersection). Individual route IDs are not publicly itemized in LTFRB sources; the terminal is documented but route-level data is aggregate. The directionsonweb terminal survey (field-documented) lists Antipolo, Cainta, and Taytay as destinations, with additional services to Binangonan and Teresa implied by jeepney data.

---

### P2P Premium Bus Routes

| Route ID | Name | Origin | Destination | Fare | Frequency | Confidence | Sources |
|----------|------|--------|-------------|------|-----------|------------|---------|
| P2P-RRCG-002 | Starmall EDSA Shaw – Alabang Town Center | Starmall EDSA-Shaw, Mandaluyong | Alabang Town Center, Muntinlupa | ₱140 (₱112 discounted) | 30+ trips/day weekdays 6:30AM–10PM; 9 trips Saturday; limited Sunday | **High** | p2p-routes.json, validated-edsa-corridor, RRCG operator confirmed |
| P2P-MEX-002 | Vista Mall Taguig – Starmall EDSA Shaw | Vista Mall Taguig | Starmall EDSA-Shaw, Mandaluyong | TBD | Weekdays | Medium | p2p-routes.json; via C-5 (MetroExpress Connect Inc.) |

**RRCG P2P note:** The Starmall EDSA-Shaw terminal also serves as an intermediate stop for RRCG's Robinsons Cainta–Greenbelt 5 route (₱90/₱72) and SM Megamall–One Ayala route (₱140/₱112), both of which pass through the EDSA/Shaw area. The Starmall EDSA-Shaw departure point is the primary RRCG terminal on this corridor.

---

## Cross-Reference Analysis

### Confirmed Routes (2+ independent sources)

| Route | Sources | Status |
|-------|---------|--------|
| PUJ_916 / T279: EDSA/Shaw Central – Tipas/Pateros via San Joaquin | Sakay live explorer (HIGH), LTFRB T279, web research (stop-level data) | **Confirmed** |
| PUJ_923: EDSA/Shaw Central – Morong | Sakay live explorer (HIGH), LTFRB franchise DB | **Confirmed** |
| P2P RRCG: Starmall EDSA-Shaw – Alabang Town Center | p2p-routes.json (HIGH), validated-edsa-corridor (HIGH), RRCG operator | **Confirmed** |
| Shaw Blvd → San Miguel Ave / Meralco Ave jeepneys | LTFRB, Moovit, Rome2rio (multiple independent queries) | **Confirmed** |
| Eastern Shaw jeepney terminal (Antipolo, Rizal Province destinations) | directionsonweb field survey, Wikipedia Shaw Blvd Station article, Moovit | **Confirmed** |
| T277: EDSA/Shaw – E. Rodriguez/Ortigas Ave | LTFRB jeepney DB, Sakay reference, validated-ortigas-corridor | **Confirmed** |
| T290: Antipolo – EDSA/Shaw | OSM T290 code, Moovit reverse-direction listing | **Confirmed** |

### Route Deduplication Decisions

**T279 = PUJ_916:** LTFRB code T279 (EDSA/Shaw Central–Pateros) and Sakay code PUJ_916 (EDSA/Shaw Central–Tipas via San Joaquin → M. Almeda Pateros) describe the same physical route. Tipas (Taguig) is the intermediate stop; Pateros is the final destination. **Resolution:** Treat as one route; use PUJ_916 as canonical ID due to higher data confidence with stop-level detail. Retain T279 as alternate LTFRB designation.

**T277 vs T278:** Both listed in LTFRB database as going EDSA/Shaw → E. Rodriguez/Ortigas Ave. T278 label ("E.R. Ort") is an abbreviated version of T277's destination. Likely represent very minor alignment variations (different sub-streets on the Pasig end). **Resolution:** Treat T277 as primary; T278 as alignment variant. Collapse to one route in GTFS with note.

**Binangonan and Teresa long-haul jeepneys:** The 103-stop Binangonan jeepney and 122-stop Teresa jeepney departing from Shaw Blvd likely use the Ortigas Ave Extension as their main Pasig–Rizal routing, joining the EDSA/Shaw terminal as their western terminus. These are the same routes documented in the EDSA/Shaw terminal survey as "Binangonan" and "Teresa" destinations.

**Western Shaw jeepneys (Kalentong/JRC, Hulo, Punta, Divisoria routes):** Wikipedia lists these as running on the western section of Shaw Blvd (Mandaluyong → Manila side). These appear to be traditional PUJ routes using Kalentong/Shaw Blvd to cross from Manila (Quiapo, Sta. Mesa, JRC area) into Mandaluyong. No LTFRB franchise codes identified — likely covered under the broad Manila-Mandaluyong PUJ franchises documented in the LTFRB jeepney DB but not individually coded in available sources.

### Contested Routes

1. **Route 12 (Pasig–Kalentong via Shaw Blvd):** Listed in transit blogs' rationalization route table under "Shaw corridor" — but no operator, OSM relation, or field confirmation found. May be a proposed designation that was never operationalized, or may operate informally. The pre-rationalization Route 12 (Pasig–Taytay via Ortigas Ave) is the Ortigas corridor route of the same number — creating a numbering conflict. **Resolution:** Flag as unconfirmed; track separately from Ortigas corridor Route 12. Needs operator confirmation or field verification.

2. **P2P-MEX-002 (Vista Mall Taguig → Starmall EDSA Shaw):** Single-source (p2p-routes.json). No fare data, no schedule confirmation, no operator details beyond "MetroExpress Connect Inc." **Resolution:** Keep as low-medium confidence until corroborated.

### Orphan Routes (single source)

- Firefly/Green Meadows Ave – Shaw Blvd jeepney: Moovit only
- Western Shaw jeepneys (Boni–Kalentong, Hulo–Kalentong, etc.): Wikipedia only (no franchise codes)
- Binangonan long-haul jeepney (103 stops): Moovit only — likely real but not corroborated independently

---

## Coverage Gaps

1. **No confirmed city bus on Shaw Blvd core:** Beyond the unconfirmed Route 12, no city bus route is documented as running the Shaw Blvd Mandaluyong–Pasig corridor. Commuters must rely on jeepneys for local Shaw trips. The EDSA Carousel does not stop at Shaw Blvd MRT station.

2. **EDSA Carousel gap at Shaw:** MRT-3 Shaw Station is one of the busiest stations without an EDSA Carousel stop. Passengers must board the MRT or walk to EDSA stops at Ortigas (north) or Boni (south) for BRT access.

3. **UV Express terminal routes not individually documented:** The EDSA Central UV Express terminal dispatches multiple Rizal Province routes but individual route IDs, stop sequences, and fares are not captured in any source — only aggregate terminal descriptions.

4. **Western Shaw jeepney franchise codes missing:** Routes running the Mandaluyong–Kalentong–Manila western segment of Shaw Blvd lack confirmed LTFRB franchise codes in available data.

5. **Kapitolyo area penetration:** Kapitolyo (Pasig) is a dense residential/commercial area just south of Shaw Blvd. The main Shaw–Pasig jeepneys serve the northern edge (San Miguel Ave, Doña Julia Vargas) but Kapitolyo's interior streets (Brixton, Honradez, etc.) appear to have no documented jeepney service beyond tricycles.

6. **Night service:** PUJ_916 and PUJ_923 run 4AM–10PM per Sakay; western Shaw routes have no documented evening cutoff. Route 12 (if operating) has unknown hours. EDSA Central terminal closure time undocumented.

7. **Weekend service reduction:** P2P RRCG Saturday service drops from 30+ daily trips to 9; Sunday schedule "limited." No frequency data for weekend jeepney headways on Shaw.

---

## Frequency Estimates

| Route | Peak Headway | Off-Peak Headway | Source |
|-------|-------------|-----------------|--------|
| PUJ_916 (Shaw–Tipas/Pateros) | ~5–10 min | ~10–15 min | Standard PUJ frequency; Sakay operational hours |
| PUJ_923 (Shaw–Morong) | ~15–30 min | ~30–60 min | Long-haul route; lower frequency standard |
| Shaw–San Miguel Ave jeepney | ~5 min | ~15 min | Rome2rio frequency data |
| Shaw–Meralco Ave jeepney | ~5 min | ~10 min | Moovit (fastest Shaw-Pasig connector) |
| P2P RRCG Shaw–Alabang | ~30 min | Scheduled departures | p2p-routes.json |
| Western Shaw jeepneys | ~5–10 min | ~10–20 min | Standard PUJ frequency estimate |
| Long-haul Rizal jeepneys (Binangonan, Teresa) | ~15–30 min | ~30–60 min | Standard long-haul pattern |

---

## Statistics

- **Confirmed routes (2+ sources):** 7
- **Medium-confidence routes:** 14
- **Low-confidence routes:** 3
- **Gaps identified:** 7
- **Primary sources:** Sakay live explorer (PUJ codes), LTFRB jeepney franchise DB, directionsonweb.blogspot.com (terminal field survey), Wikipedia (Shaw Blvd article), Moovit, Rome2rio, OSM, p2p-routes.json, transit-blogs-enthusiast-sites.md

---

## Key Findings

1. **EDSA Central Terminal is the heart of the corridor.** The Shaw/EDSA intersection hosts two jeepney terminals (Greenfield District exit and Main Terminal southbound exit) handling all Rizal Province eastbound traffic. Routes to Antipolo, Binangonan, Morong, Teresa, Cainta, Taytay, and Pateros all originate here.

2. **PUJ_916 (Shaw–Tipas/Pateros via San Joaquin) is the best-documented Shaw route** — the only one with Sakay live data (HIGH confidence) and stop-level detail. It routes south from Shaw through Kapitolyo/Capitol Commons, crosses C-5 via Bagong Ilog, passes Pasig Rotonda and Pasig Cathedral, then follows San Joaquin to Pateros.

3. **Short intra-Pasig jeepneys are the corridor's workhorse.** Routes to San Miguel Ave (~5 min, q5 min) and Meralco Ave (~5 min, q5 min) provide fast, high-frequency coverage for the Shaw–Pasig interior segment. No competing bus service.

4. **P2P buses use Shaw/EDSA as a key node.** Starmall EDSA-Shaw is RRCG's primary terminal for the southbound Alabang Town Center P2P route, and it serves as a hub stop for Robinsons Cainta–Greenbelt 5 and SM Masinag–One Ayala services.

5. **The western Shaw segment (Mandaluyong → Kalentong → Manila) is data-poor.** Wikipedia references multiple jeepney routes on this segment but none have LTFRB codes, stop sequences, or confirmed frequencies. This section likely feeds into the Quiapo/Sta. Mesa jeepney network.

6. **No EDSA Carousel service at Shaw** creates a service gap. Shaw Blvd MRT Station is the 7th busiest MRT-3 station by access but has no BRT equivalent, leaving EDSA connectivity dependent on MRT-3 alone at this node.
