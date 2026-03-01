# Caloocan — Cross-Reference & Validation

**Analysis date:** 2026-02-28
**Aspect:** Wave 2 — Caloocan City
**Scope:** All routes within/through Caloocan City (NCR), including all modes

---

## City Geography

Caloocan (official: City of Caloocan) is Metro Manila's fourth most populous city with **1,712,945 residents (2024 census)** and a total area of **53.33 km²**. Crucially, Caloocan is **geographically non-contiguous** — it exists in two separate sections divided by Quezon City territory:

### South Caloocan (~25 km²)
The older, denser urban core. Bounded by Manila (south), Malabon (west), Navotas (northwest), and Quezon City (east).

**Key roads:**
- **EDSA (C-4):** Western spine through South Caloocan; carries EDSA Carousel BRT, MRT-3 (no stations in Caloocan proper, terminates at North Ave QC)
- **Rizal Avenue Extension / A. Bonifacio Avenue:** Historic N–S arterial from Manila → Monumento → MacArthur Hwy
- **MacArthur Highway:** Heads northwest from Monumento toward Valenzuela and Bulacan
- **Samson Road:** East–west connector; Monumento to Malabon
- **5th Avenue / C-3 Road:** N–S secondary road
- **Sangandaan Road:** Internal Caloocan hub road

**Key nodes:** Monumento Circle, Sangandaan, MCU (Manila Central University), Grace Park, Bagong Barrio (on EDSA), 5th Avenue LRT station area

### North Caloocan (~49 km²)
Separate territory bounded by Bulacan (north/west), Quezon City/Novaliches (east/south). **No rail access.** Former home of Barangay 176/Bagong Silang — the most populous barangay in the Philippines before being split into six sub-barangays (176-A through 176-F) in 2024. Key areas: Bagong Silang, Camarin, Deparo, Tala, Zabarte.

**Key roads in North Caloocan:**
- **Quirino Highway:** Connects to QC Novaliches area; primary east–west corridor
- **Camarin Road:** N–S road through Camarin to Bagong Silang
- **Zabarte Road:** Connects Bagong Silang to Quirino Highway / QC boundary
- **Langit Road:** Internal Bagong Silang road; Bagong Silang terminal vicinity
- **Susano Road:** East–west between Camarin and Deparo
- **Maligaya Drive:** Connects Bagong Silang to EDSA/QC boundary

---

## Rail Transit in Caloocan

### LRT-1 (Green Line) — South Caloocan
| Station | LRT-1 No. | Address | Notes |
|---------|-----------|---------|-------|
| Monumento | Station 23 | A. Bonifacio Ave, Rizal Ave Ext, Caloocan | Northern terminus of LRT-1 (pre-Cavite Ext era); adjacent to SM City Grand Central; major multi-modal hub |
| 5th Avenue | Station 22 | 5th Avenue / C-3 Road, Caloocan | Intermediate station; limited feeder documentation |

**Confidence:** HIGH (LRT-1 official schedule + LRTA)

### EDSA Carousel BRT — South Caloocan
| Stop | Position | Notes |
|------|----------|-------|
| Bagong Barrio | Stop #20 (NB) | Between Kaingin Road (QC) and Monumento |
| Monumento/MCU | Stop #21 (NB) | Northern terminal of Carousel; 24/7; adjacent to LRT-1 Monumento |

**Confidence:** HIGH (EDSA busway data, MMDA, OSM relation 11181496)

**No rail in North Caloocan.** Nearest rail from Bagong Silang is MRT-3 North Ave (~12 km by road).

---

## Sources Consulted

| Source File | Relevance |
|---|---|
| monumento-terminal.md | Comprehensive terminal inventory, bus/jeepney routes at Monumento hub |
| validated-rizal-avenue-marikina-corridor.md | Caloocan T-series jeepney routes on Rizal Ave + MacArthur Hwy corridor |
| validated-edsa-corridor.md | EDSA Carousel stops in Caloocan; city buses on EDSA |
| validated-commonwealth-avenue-corridor.md | Routes from North QC into Caloocan boundary |
| sm-north-edsa-terminal.md | UV Express at CIT terminal (Caloocan UV Express routes terminate here) |
| lrt1-feeder-routes.md | Monumento and 5th Ave station feeders |
| ltoportal-ph-bus-routes.md | Official numbered bus routes 1–65 with Caloocan terminals/service areas |
| fairview-terminal.md | Routes to/from Fairview serving northern QC–Caloocan boundary |
| WebSearch: Moovit, Sakay, MoreFunWithJuan | North Caloocan jeepney and UV Express routes; Bagong Silang routes |

---

## Confirmed Routes — HIGH Confidence (2+ independent sources)

### BRT / City Bus Routes

| Route ID | Name | Origin | Destination | Key Caloocan Stops/Segment | Fare | Hours | Confidence | Sources |
|---|---|---|---|---|---|---|---|---|
| Route 1 / EDSA Carousel | EDSA Carousel | Monumento, Caloocan | PITX, Parañaque | Monumento/MCU terminal → Bagong Barrio → (exits Caloocan south) | ₱15 min / ₱74.50 max E2E | 24/7 | **HIGH** | edsa-busway, mmda, LTFRB, OSM |
| Route 9 | Angat–Monumento | Angat Public Market, Bulacan | Monumento, Caloocan | Bocaue → Caloocan → Monumento terminal | ₱15 base + ₱2.65/km | 4AM–10PM | **HIGH** | ltoportal, monumento-terminal, ltfrb-bus |
| Route 13 | Bagong Silang–Sta. Cruz via Malinta Exit | Bagong Silang (Old Zabarte area), Caloocan | Avenida Bus Terminal, Santa Cruz, Manila | Zabarte Rd → Camarin Rd → Quirino Hwy → Del Monte Ave → Sta. Cruz | ₱15 base + ₱2.65/km | 6AM–11PM | **HIGH** | ltoportal, Sakay (DOTR:R_SAKAY_PUB_2170), LTFRB_PUB1137 |
| Route 37 | Fairview–Monumento via VGC | Robinsons Novaliches (Fairview), QC | Monumento, Caloocan | Quirino Hwy → Caloocan boundary → Monumento terminal | ₱15 base + ₱2.65/km | 4AM–10PM | **HIGH** | ltoportal, OSM Relation 15019302, monumento-terminal |

**Route 13 key stops (Bagong Silang → Sta. Cruz):**
Old Zabarte (Caloocan) → National Center for Mental Health/Camarin → Zabarte Rd/Camarin Rd Int. → Bestlink Institute (Quirino Hwy) → Novaliches SDA Church → Del Monte Ave/A. Bonifacio Int. (QC) → Gen. Concepcion/Laong Laan Int. → T. Mapua/D. Jose Int. (Manila terminus)

**Operator note (Route 13):** Operated by **Bagong Silang Transport Service and Multipurpose Cooperative (BSTSMC)**. Sakay lists it as LTFRB_PUB1137 / DOTR:R_SAKAY_PUB_2170. Service area: Caloocan, Manila, Quezon City, Valenzuela.

**Route 37 note:** OSM Relation 15019302 confirmed as "City Bus Route 37: Fairview → Monumento via VGC" — passes through Valenzuela Gateway Complex (VGC) en route to Monumento. VGC–Monumento segment runs from ~4:30 AM to 8:00 PM (ES Transport/VTSC schedule from VGC). Caloocan is the southern terminus; Fairview is the QC-side origin.

### Jeepney Routes — South Caloocan (Multiple Sources)

| Route ID | Name | Origin | Destination | Key Stops | Fare | Confidence | Sources |
|---|---|---|---|---|---|---|---|---|
| T104 | Malabon–Monumento via Letre | Malabon Central Market | Monumento Circle, Caloocan | Letre Road | ₱13 | **HIGH** | LTFRB MC 2020-029, monumento-terminal, LRT-1 feeders |
| T115 | Malabon–Monumento via Acacia | Malabon Central Market | Monumento Circle, Caloocan | Acacia Road | ₱13 | **HIGH** | LTFRB MC 2020-029, monumento-terminal |
| T107 | Monumento–Navotas via Letre | Monumento Circle, Caloocan | Navotas City | Letre Road, Malabon | ₱13 | **HIGH** | LTFRB MC 2020-029, monumento-terminal, LRT-1 feeders |
| T106 | MCU–Sangandaan | Manila Central University, Caloocan | Sangandaan, Caloocan | — (intra-South Caloocan) | ₱13 | **HIGH** | LTFRB MC 2020-029 Annex A |
| T112 | Monumento–Paco, Obando | Monumento Circle, Caloocan | Paco Market, Obando, Bulacan | M.H. del Pilar St | ₱13 | **HIGH** | LTFRB MC 2020-029, monumento-terminal |
| T109 | Novaliches–Rizal Ave via A. Bonifacio | Novaliches, QC | Rizal Ave, Caloocan/Manila boundary | A. Bonifacio Ave | ₱13 | **HIGH** | LTFRB MC 2020-029 (passes through South Caloocan) |
| BLUM-NOVALICHES-MODERN | Novaliches–Balintawak–Blumentritt (Modern PUJ) | Novaliches, QC | Blumentritt, Manila | Balintawak, A. Bonifacio Ave, South Caloocan | ₱15 base | **HIGH** | PNA news (15 units), Nova-Blumentritt Coop confirmed |
| JEEP-MONUMENTO-PASAY | Monumento–P. Villanueva, Pasay | Monumento, Caloocan | P. Villanueva, Pasay | Rizal Ave Ext, Blumentritt, Divisoria, Recto, Quiapo, Paco (~52 stops, ~66 min) | ₱13–40 | **HIGH** | Monumento terminal, Moovit (52 stops) |
| JEEP-ANTONIO-RIVERA-MONUMENTO | Antonio Rivera–Monumento | Antonio Rivera, Manila | Monumento, Caloocan | Rizal Avenue (~29 stops, ~31 min) | ₱13 | **HIGH** | Monumento terminal, Moovit |

### UV Express Routes — LTFRB-coded

| Route ID | Name | Origin | Destination | Fare | Confidence | Sources |
|---|---|---|---|---|---|---|
| N27 | Deparo–SM North EDSA/C.I.T. | Deparo Road UV Terminal, North Caloocan | SM North EDSA/CIT, Quezon City | ~₱20–30 | **HIGH** | LTFRB route code confirmed; Moovit listed; SM North EDSA terminal data |
| N28 | Deparo–Blumentritt | Deparo Road UV Terminal, North Caloocan | Blumentritt, Manila | ~₱25–35 | **HIGH** | LTFRB route code confirmed (N28 designation in source); Moovit listed |

---

## Medium-Confidence Routes (single strong source or partial corroboration)

### City Bus Routes (Pass-through or uncertain terminal status)

| Route ID | Name | Caloocan Segment | Confidence | Sources |
|---|---|---|---|---|
| Route 6/6A | Sapang Palay / Norzagaray–PITX | Passes through South Caloocan (A. Bonifacio Ave / Balintawak area) en route from Bulacan → Manila | MEDIUM | ltoportal; service area includes "Caloocan" |
| Route 8 | Angat Public Market–Divisoria, Tondo | Passes through South Caloocan on MacArthur Hwy | MEDIUM | ltoportal (service area: Caloocan, Manila, QC) |
| Route 14 | Balagtas–PITX via Bay City | Passes through Caloocan and Malabon (MacArthur Hwy/Monumento area) | MEDIUM | ltoportal (service area: Caloocan, Malabon, Valenzuela) |
| Route 19 | Norzagaray–Sta. Cruz Avenida | Passes through South Caloocan via QC | MEDIUM | ltoportal (service area mentions QC; Caloocan corridor implied) |
| Route 33 | SJDM–SM North EDSA via Mindanao Ave | Passes through North Caloocan/QC boundary (Mindanao Ave edge) | MEDIUM | ltoportal (service area: Caloocan, QC, SJDM), sm-north-terminal |
| Route 35 | Balagtas–NAIA Terminals | Passes through Caloocan, Malabon, Navotas | MEDIUM | ltoportal (service area: Caloocan, Malabon, Navotas, Valenzuela) |
| Route 42 | Malanday, Valenzuela–Ayala Makati | Passes through Caloocan and Malabon | MEDIUM | ltoportal (service area: Caloocan, Malabon) |
| Route 49 | SJDM–NAIA Terminals | Passes through Caloocan en route from SJDM | MEDIUM | ltoportal (service area: Caloocan, Manila, QC) |
| BSTSMC-NAIA | Bagong Silang–NAIA via Maligaya Park, EDSA | Green Construction Supply, Langit Road, Caloocan → NAIA T1 | MEDIUM | Sakay LTFRB_PUB1140; no number confirmed |
| BUS-SANGANDAAN-MONUMENTO-MALINTA | Route connecting Monumento to Valenzuela via MacArthur Hwy with Malinta / VGC | Monumento → MacArthur Hwy → Caloocan → Valenzuela | MEDIUM | monumento-terminal (Routes 1, 3 old designations), VGC terminal data |

### Jeepney Routes — South Caloocan

| Route ID | Name | Origin | Destination | Key Stops | Fare | Confidence | Sources |
|---|---|---|---|---|---|---|---|---|
| T121 | Polo–Sangandaan | Polo, Valenzuela | Sangandaan, Caloocan | Tenejeros | ₱13 | MEDIUM | LTFRB MC 2020-029 |
| T171 | Monumento–Sto. Niño | Monumento Circle, Caloocan | Sto. Niño, Caloocan | (intra-Caloocan, MacArthur Hwy) | ₱13 | MEDIUM | LTFRB source + monumento-terminal (single primary source) |
| JEEP-514-MONUMENTO-VITO-CRUZ | Monumento–Vito Cruz (old Route 514) | Monumento, Caloocan | Vito Cruz, Malate | Rizal Ave, Mabini | ₱13 | MEDIUM | Community route lists (pre-PUVMP code; operational status unverified) |
| STACRU-VALENZUELA-MACARTHUR | Valenzuela–Plaza Sta. Cruz via MacArthur Hwy | Valenzuela City | Plaza Sta. Cruz, Manila | MacArthur Highway, Rizal Ave, through Caloocan | ₱13 | MEDIUM | Moovit confirmed |
| T3157 | Malinta–Recto via F. Huertas, Oroquieta | Malinta, Valenzuela | CM Recto Ave, Manila | MacArthur Hwy (through Caloocan) | ₱13 | MEDIUM | Sakay T-code confirmed (passes through South Caloocan) |
| T3158 | Malinta–Sta. Cruz via F. Huertas, Oroquieta | Malinta, Valenzuela | Sta. Cruz, Manila | MacArthur Hwy (through Caloocan) | ₱13 | MEDIUM | Sakay T-code confirmed (passes through South Caloocan) |
| MALABON-NAVOTAS-T105 | Malabon–Navotas | Malabon | Navotas | (west of Caloocan; connects to Monumento routes) | ₱13 | MEDIUM | LTFRB MC reference only |

### Jeepney Routes — North Caloocan (Bagong Silang, Camarin, Deparo)

All of the following are Moovit-confirmed or search-confirmed but without LTFRB franchise codes individually verified:

| Route Name | Origin / Area | Destination / Area | Corridor | Frequency | Confidence |
|---|---|---|---|---|---|
| T174: Novaliches–Camarin Extended Bagong Silang | Novaliches, QC | Bagong Silang, Caloocan | Quirino Hwy / Camarin Rd | — | MEDIUM |
| Novaliches–Bagong Silang Kaliwa Ph5 | Novaliches, QC | Bagong Silang Ph5 Kaliwa | — | — | MEDIUM |
| Novaliches–Bagong Silang Kanan Ph9 | Novaliches, QC | Bagong Silang Ph9 Kanan | — | — | MEDIUM |
| Bagong Silang–Novaliches (TP) via Susano | Bagong Silang, Caloocan | Novaliches Terminal, QC | Susano Road | — | MEDIUM |
| Novaliches–Tala via Camarin, Susano Rd. | Novaliches Terminal, QC | Tala, Caloocan | Susano Rd / Camarin | — | MEDIUM |
| Nova–Camarin | Novaliches, QC | Camarin, Caloocan | — | — | MEDIUM |
| Nova–Deparo | Novaliches Terminal, QC | Deparo, Caloocan | — | — | MEDIUM |
| Novaliches (TP)–Brgy. Deparo | Novaliches Terminal, QC | Deparo Barangay, Caloocan | — | — | MEDIUM |
| Novaliches–Shelterville via Camarin Rd., Bagong Silang | Novaliches, QC | Shelterville, Caloocan | Camarin Rd, Bagong Silang | 12AM–11PM | MEDIUM |
| Bagong Silang–Robinsons Fairview via Zabarte Rd. | Bagong Silang, Caloocan | Robinsons Novaliches / Fairview | Zabarte Road | — | MEDIUM |
| Balintawak–Camarin via Susano | Balintawak, QC | Camarin, Caloocan | Susano Road | — | MEDIUM |
| Camarin–Novaliches Bayan | Camarin, Caloocan | Novaliches town center, QC | — | — | MEDIUM |
| Bagong Silang–SM Fairview via Maligaya | Bagong Silang, Caloocan | SM City Fairview, QC | Maligaya Drive | — | MEDIUM |
| Ramirez/Quirino Hwy → Camarin Rd Int. | Quirino Hwy / Ramirez, Caloocan | San Vicente/Camarin Rd Int., Caloocan | Quirino Hwy | ~5 min headway | MEDIUM |
| Langit Road–Quirino Hwy Jeep | Kalayaan Elementary School, Langit Road | Ramirez / Quirino Hwy, Caloocan | Langit Road | — | MEDIUM |
| Sto. Niño Parish/Old Zabarte–Commonwealth Ave (QC) | Sto. Niño Parish, Old Zabarte, Caloocan | Philippine Coconut Authority, Commonwealth Ave, QC | — | ~15 min | MEDIUM |
| National Mental Hospital–Camarin | National Mental Hospital, Barugo, Caloocan | Camarin Road, Caloocan | (intra-North Caloocan) | ~5 min | MEDIUM |

### UV Express Routes (non-coded)

| Route Name | Origin | Destination | Fare | Confidence | Sources |
|---|---|---|---|---|---|
| Bagong Silang–SM North/C.I.T. | Bagong Silang, Caloocan | SM North EDSA/CIT, QC | ~₱20–35 | MEDIUM | Moovit listed; search results |
| Deparo–SM North/C.I.T. (non-coded) | Deparo, Caloocan | SM North EDSA/CIT | ~₱20–30 | MEDIUM | Moovit listed |
| Deparo–Fairview (Robinsons) | Deparo, Caloocan | Robinsons Novaliches/Fairview | ~₱20–30 | MEDIUM | Search results |
| Deparo–Cubao | Deparo, Caloocan | Cubao, QC | ~₱25–40 | MEDIUM | Search results |
| Monumento→Deparo Road UV Terminal | Monumento Circle, Caloocan | Deparo Road UV Terminal, Caloocan | ~₱15–20 | MEDIUM | SM North terminal data |
| Novaliches Terminal–MRT North EDSA/CIT | Novaliches Terminal, QC | MRT-3 North Ave / CIT | ~₱15–25 | MEDIUM | Moovit UV route listing |

---

## Low-Confidence / Orphan Routes

| Route ID | Name | Notes | Source |
|---|---|---|---|
| Route 20 / 21 Caloocan variant | Sapang Palay–Sta. Cruz (via Caloocan) | These Bulacan→Manila routes pass through Caloocan but the route was documented as primarily a QC/SJDM route; Caloocan segment is unclear | ltoportal |
| MCU–Recto via F. Huertas, Oroquieta | MCU Caloocan → CM Recto, Manila | Single source; plausible Rizal Ave connector through South Caloocan | other-major-terminals |
| Sangandaan–Valenzuela connector | Sangandaan → Polo, Valenzuela | T121 documented but operational status uncertain | LTFRB MC only |
| EDSA–Monumento short-hop jeepney | Bagong Barrio/EDSA area → Monumento | Likely informal short-hop; not documented in any source | — |

---

## Cross-Reference & Deduplication

### Confirmed Multi-Source Matches

| Route | Sources Agreement | Decision |
|---|---|---|
| EDSA Carousel (Route 1) as Monumento terminus | edsa-busway, MMDA, ltoportal, OSM | **CONFIRMED.** Monumento/MCU is northern terminal; "Bagong Barrio" is a separate intermediate stop in Caloocan before Monumento. These are two distinct stops, not duplicates. |
| T104 vs T115 (both Malabon–Monumento) | LTFRB MC 2020-029, monumento-terminal; confirmed distinct alignments | **Two distinct routes.** T104 = Letre Road; T115 = Acacia Road. Not duplicates. |
| Route 37 (Fairview–Monumento) vs Route 3 old (Monumento–VGC) | OSM Relation 15019302 = "Route 37: Fairview→Monumento via VGC"; monumento-terminal data cited old "Route 3: Monumento–VGC" | **Resolution:** Route 3 (old) has been renumbered/replaced by Route 37 under rationalization. The OSM relation and ltoportal both confirm current route number is 37. "Route 3: Monumento–VGC" should be flagged as pre-rationalization numbering. |
| N27/N28 vs non-coded Deparo UV Express | LTFRB N-code confirmed; also listed without code in other sources | **SAME ROUTES.** N27 = Deparo–SM North C.I.T.; N28 = Deparo–Blumentritt. The non-coded "Deparo–SM North" Moovit listings are the same routes under their LTFRB designations. |
| Route 9 (Angat–Monumento) vs Route 22 (old Monumento–Angat via NLEX) | ltoportal shows Route 9 as Angat→Monumento; monumento-terminal analysis cited "Route 22 (Monumento–Angat, Bonifacio Market/5th Ave)" | **Conflict: Route number discrepancy.** ltoportal/wikimili (authoritative): Route 9 = Angat→Monumento. The "Route 22" cited in monumento-terminal.md likely refers to a pre-rationalization number, or Route 22 is a different Bulacan route (Monumento–Angat via NLEX/Bocaue exit variant). **Resolution:** Use Route 9 as canonical for Angat–Monumento via MacArthur Hwy. Flag Route 22 reference in monumento-terminal.md as potentially pre-rationalization or a variant route (NLEX vs MacArthur Hwy). |

### Contested/Ambiguous Routes

1. **"Route 17: Monumento–EDSA Taft" vs ltoportal Route 17 (Fairview–Ayala):** The monumento-terminal.md and validated-rizal-avenue-marikina-corridor.md both cite "Route 17: Monumento–EDSA Taft" using Araneta Square Mall / Samson Rd as origin. However, ltoportal.ph (the Wikipedia-sourced master list) identifies Route 17 as "Fairview, SM → Ayala, Makati CBD." These cannot be the same route. **Resolution:** The "Monumento–EDSA Taft" route is likely the pre-rationalization Route 17 designation; under current rationalization (MC 2020-019), the Monumento–Pasay/Taft corridor may be covered by a different numbered route not yet identified in our data, or may still operate informally without a post-2020 number. Flag this as a conflict requiring resolution before GTFS synthesis. The Rizal Avenue corridor jeepney (Monumento–Pasay via Rizal Ave) remains documented at HIGH confidence regardless of bus route numbering.

2. **North Caloocan jeepney naming conventions:** The many Bagong Silang–Novaliches jeepney routes (Kaliwa Ph5, Kanan Ph9, via Susano, etc.) appear to be sub-variants of the same corridor rather than distinct LTFRB franchises. Field verification needed to determine if these are separate franchise codes or informal phase/variant names of the same franchise (T174 or similar).

---

## Transit Hubs in Caloocan

### South Caloocan Hubs

**1. Monumento Circle** (Primary hub, HIGH-documented)
- LRT-1 Monumento Station, EDSA Carousel terminal, Victory Liner provincial terminal
- Jeepney terminals on Rizal Ave Ext (→Manila), MacArthur Hwy (→Bulacan/Valenzuela), Samson Rd (→Malabon/Navotas)
- Bus terminals: Araneta Square Mall (Samson Rd) for city buses; Bonifacio Market for MacArthur buses
- Provincial buses: Victory Liner (Olongapo, Baguio, Dagupan, Pampanga), First North Luzon Transit, RJ Express

**2. Sangandaan** (Intermediate hub, MEDIUM-documented)
- Multiple jeepney routes converge; MCU is nearby
- T106 (MCU–Sangandaan) terminates here
- No specific stop-level or frequency data available

**3. 5th Avenue / C-3 LRT Area** (LOW-documented)
- LRT-1 5th Avenue Station in this area
- Informal jeepney stops; no coded routes documented

### North Caloocan Hubs

**4. Bagong Silang Terminal** (MEDIUM-documented)
- Near Langit Road / Old Zabarte; served by BUS (Route 13 BSTSMC), UV Express (Bagong Silang–SM North), and multiple jeepneys
- No GPS coordinates confirmed for terminal; inferred from Moovit stop data
- Operated by LTFRB/UV Express (per Moovit site description)

**5. Deparo Road UV Express Terminal** (MEDIUM-documented)
- Serves N27 (Deparo–SM North CIT), N28 (Deparo–Blumentritt), and non-coded UV variants
- Key interchange for North Caloocan to central Manila / QC

---

## Coverage Gaps

1. **No rail in North Caloocan:** Bagong Silang (pop. ~900,000+, largest concentration in North Caloocan) has zero rail access. The nearest MRT-3 station (North Avenue, QC) is ~12 km by road. Transit reliance is entirely on buses (Route 13) and UV Express, creating significant transit equity gap.

2. **Route 13 (Bagong Silang–Sta. Cruz) is the sole confirmed direct bus from North Caloocan to Manila.** LTFRB_PUB1140 (Bagong Silang–NAIA via Maligaya/EDSA) is the only other documented long-haul bus, but with only one operator (BSTSMC). This corridor is severely underserved given the population density.

3. **Sangandaan area underdocumented:** Sangandaan is a known internal Caloocan transfer node (T106 terminus) but specific routes, frequencies, and stop locations are unknown. No Moovit or Sakay data found.

4. **5th Avenue LRT-1 station feeders:** Only general mention found ("jeepneys available below station, feeder to Tondo/Caloocan interior"). No specific route codes documented. This is a data gap given its position on LRT-1.

5. **Route 17 numbering conflict (Monumento–EDSA Taft):** A city bus route connecting Monumento to the EDSA Taft/Pasay area via Rizal Avenue is operationally described in multiple sources (monumento-terminal, LRT-1 feeders, Rizal Ave corridor) but its current post-rationalization route number is unresolved. Likely exists but number unclear.

6. **No jeepney GPS stop coordinates in Caloocan:** All South Caloocan jeepney stops are name-only references. North Caloocan jeepney stops are even less documented.

7. **North Caloocan intra-city circulation incomplete:** The Bagong Silang–Camarin jeepney (~5 min frequency per Moovit) is the best-documented intra-North Caloocan route. Routes within the Tala, Phase 3–9 subdivisions, and Deparo interior remain largely undocumented.

8. **EDSA Carousel does not serve North Caloocan:** Monumento/MCU is the northern terminus. Bagong Silang residents must take a jeepney or UV Express to reach the Carousel, adding transfers and cost.

9. **MacArthur Highway jeepney route codes mostly unknown:** Major through-routes to Bulacan (Bocaue, Marilao, Meycauayan, Malinta, Karuhatan) depart Monumento but lack LTFRB T-codes in available sources.

10. **Night service gap in North Caloocan:** Route 13 runs 6AM–11PM. No documented 24-hour service. The population (~900K+) has no confirmed transit after 11PM except informal tricycles.

---

## Frequency Estimates

| Route | Peak Headway | Off-Peak Headway | Source |
|---|---|---|---|
| LRT-1 (Monumento/5th Ave) | ~2–3 min | ~4–6 min | LRTA official |
| EDSA Carousel (Monumento terminus) | ~2–5 min | ~5–15 min | edsa-busway-routes.json |
| Route 13: Bagong Silang–Sta. Cruz | ~15–30 min (estimate) | ~30–45 min (estimate) | BSTSMC single operator; only estimate |
| T104/T115 (Malabon–Monumento) | ~10 min | ~15–20 min | Moovit (T107 Navotas = ~5 min; Malabon routes comparable) |
| T107 (Monumento–Navotas) | ~5 min | ~10–15 min | LRT-1 feeders confirmed "every 5 min" |
| Jeepney: Monumento–Pasay (Rizal Ave) | ~5–10 min | ~10 min | Moovit Monumento stop data |
| N27: Deparo–SM North CIT | ~15–30 min | ~30 min+ | UV Express standard estimate |
| MacArthur Hwy jeepney (Bocaue) | ~10 min | ~15–20 min | Moovit Bocaue route frequency (confirmed) |
| Bagong Silang–Camarin intra-jeepney | ~5 min | ~5–10 min | Moovit: "every five minutes" confirmed |
| Victory Liner (Monumento terminus) | Scheduled departures | ~1–2 hrs between trips | victoryliner.com |

---

## Statistics

| Category | Count |
|---|---|
| Routes confirmed HIGH (2+ sources) | 15 (Route 1/Carousel, Route 9, Route 13, Route 37, T104, T115, T107, T106, T112, T109, Novaliches Modern PUJ, Monumento–Pasay jeepney, Antonio Rivera–Monumento, N27, N28) |
| Routes confirmed MEDIUM (1 strong source + context) | 30+ |
| Routes LOW/orphan (single source, unverified) | 4 |
| Routes with OSM geometry | 3 (EDSA Carousel, Route 37 OSM Rel 15019302, Route 33 OSM 9552779) |
| City bus routes with Caloocan terminals | 4 (Routes 1, 9, 13, 37) |
| City bus routes passing through Caloocan | 8+ (Routes 6/6A, 8, 14, 19, 33, 35, 42, 49) |
| Jeepney routes documented | ~35 |
| UV Express routes documented | 7 (N27, N28 + 5 non-coded) |
| Known transit gaps | 10 |
| GPS stop coordinates confirmed | 0 |

---

## Key Findings

1. **Caloocan's bifurcation is its defining transit challenge.** South and North Caloocan are separated by ~8 km of Quezon City territory. There is no direct intra-Caloocan transit link — residents of Bagong Silang (North) must travel through QC to reach Monumento (South). This is the city's most fundamental transit structural problem.

2. **Monumento is Metro Manila's premier northern hub.** LRT-1 terminus, EDSA Carousel BRT terminus, Victory Liner, and multiple jeepney/bus corridors converge here. The hub is well-documented (HIGH confidence). The southern EDSA entry point into Caloocan (Bagong Barrio stop) is documented but understudied relative to Monumento.

3. **North Caloocan (~900K population) has one confirmed city bus (Route 13).** Bagong Silang Transport Service Coop (BSTSMC) operates this single backbone route (Bagong Silang–Sta. Cruz via Malinta Exit). This extreme underservice of a near-million person area is one of NCR's most significant transit equity gaps.

4. **The Deparo UV Express terminal anchors North Caloocan.** LTFRB-coded N27 (Deparo–SM North) and N28 (Deparo–Blumentritt) are the primary documented UV Express routes from North Caloocan. These bypass the Bagong Silang core, suggesting further distribution via jeepney is required for final-mile access.

5. **MacArthur Highway is the commercial transit backbone of South Caloocan.** Multiple jeepney routes from Bulacan municipalities (Bocaue, Marilao, Meycauayan, Malinta, Karuhatan) use MacArthur Hwy to reach Monumento. City buses (Routes 9, 14, 35) parallel these routes.

6. **Route numbering conflict (Route 17) needs resolution.** The Monumento–EDSA Taft city bus is documented across multiple analysis files as "Route 17" (from pre-rationalization era sources), but the current LTFRB/Wikipedia master list assigns Route 17 to Fairview→Ayala. The rationalized route number for Monumento–EDSA Taft (if still operating as a separate bus route) is unknown.

7. **North Caloocan jeepney network exists but is lightly documented.** Moovit and community searches reveal 15+ jeepney route variants serving Bagong Silang, Camarin, Deparo, and Tala — mostly Novaliches-adjacent routes. Frequency data is minimal; LTFRB franchise codes are mostly missing. The National Mental Hospital/Barugo → Camarin intra-jeepney (5-min frequency) is the best-documented internal route.

8. **Victory Liner's Monumento terminal provides Caloocan's provincial bus service.** Olongapo, Baguio, Dagupan, and Pampanga routes provide access to North Luzon from Caloocan. This is the primary provincial connectivity for Caloocan-adjacent Bulacan residents using the MacArthur Hwy.

---

## Sources

- [morefunwithjuan.com – Monumento Jeepney Routes (2024)](https://www.morefunwithjuan.com/2024/03/monumento-jeepney-routes.html)
- [ltoportal.ph – Metro Manila City Bus Guide: Routes, Schedules, and Fares](https://ltoportal.ph/metro-manila-bus-routes-schedules-fares/)
- [wikimili.com – List of bus routes in Metro Manila](https://wikimili.com/en/List_of_bus_routes_in_Metro_Manila)
- [Sakay Route Explorer – Bagong Silang–Sta. Cruz (DOTR:R_SAKAY_PUB_2170)](https://explore.sakay.ph/routes/DOTR:R_SAKAY_PUB_2170)
- [Moovit – Camarin Road stop](https://moovitapp.com/index/en/public_transit-Camarin_Road_Caloocan_City-Manila-stop_3639760-1022)
- [Moovit – Deparo Road stop](https://moovitapp.com/index/en/public_transit-Deparo_Rd_Caloocan_City_Philippines-Manila-site_29500180-1022)
- [Moovit – Bagong Silang Terminal](https://moovitapp.com/index/en/public_transit-Bagong_Silang_Terminal-Manila-site_45535463-1022)
- [OSM Relation 15019302 – City Bus Route 37: Fairview → Monumento via VGC](https://www.openstreetmap.org/relation/15019302)
- [rome2rio – Caloocan City to Bagong Silang](https://www.rome2rio.com/s/Caloocan-City/Bagong-Silang)
- [morefunwithjuan.com – Route 3 Monumento–VGC](https://www.morefunwithjuan.com/p/city-bus-route-3-monumento-vgc.html)
- [ph.commutetour.com – Monumento Terminal Bus Schedule](https://ph.commutetour.com/ph/terminal/monumento-gracepark-caloocan/)
- Previous analysis files: monumento-terminal.md, validated-rizal-avenue-marikina-corridor.md, validated-edsa-corridor.md, lrt1-feeder-routes.md
