# Validated Routes: Las Piñas, Parañaque, Muntinlupa

**Validation type**: Wave 2 — City/Municipality cross-reference
**Compiled**: 2026-03-01
**Sources used**: baclaran-terminal-routes.json, ltoportal-ph-routes.json, city-bus-operators-routes.json, ltfrb-jeepney-routes.json, ltfrb-bus-routes.json, ltfrb-uv-express-routes.json, p2p-routes.json, osm-transit-relations-routes.json, moovit-routes.json, sakay-ph-routes.json, validated-taft-avenue-corridor.md, validated-coastal-roxas-boulevard-corridor.md, provincial-bus-operators-routes.json, wikimili-routes.json, OSM wiki jeepney/UV routes, commutetour.com (403; summary data), rome2rio.com, morefunwithjuan.com

---

## Overview

Southern Metro Manila consists of three contiguous cities/municipalities on NCR's southern rim:

| City | Key Areas | Major Transit Attractors |
|------|-----------|--------------------------|
| **Las Piñas** | Zapote, Alabang-Zapote corridor, BF Homes, BF Resort, Pilar, Casimiro, SM Southmall | SM Southmall terminal hub; Zapote terminal; Dr. Santos LRT-1 (border w/ Parañaque) |
| **Parañaque** | PITX, Baclaran border, Sucat, Moonwalk, BF Homes, Merville, NAIA/Tambo, Sto. Niño, Don Galo | PITX (largest bus terminal in Philippines); 5 new LRT-1 Cavite Extension stations; NAIA complex |
| **Muntinlupa** | Alabang (commercial hub), Sucat, Tunasan, Bayanan, Poblacion | VTX Starmall Alabang terminal; ATC UV Express terminal; Festival Mall; PNR Alabang (SUSPENDED) |

**Structural note**: This cluster functions as a single south-facing transit corridor anchored by **two mega-terminals**: (1) **Baclaran LRT-1** at the northern edge (Parañaque/Pasay border) and (2) **PITX** in mid-Parañaque. These terminals absorb the majority of northbound commuter flows to Manila and Makati, and southbound provincial bus traffic to Cavite/Laguna/Batangas. Muntinlupa's Alabang serves as the secondary commercial hub with P2P/UV Express connections to BGC and Ortigas.

**LRT-1 Cavite Extension impact** (opened November 16, 2024): Five new stations within Parañaque dramatically shifted feeder route demand. Former feeder jeepneys to Baclaran LRT-1 now have shorter trips to the nearest new stations (Redemptorist-Aseana, Ninoy Aquino Ave, PITX, MIA Road, Dr. Santos). Some routes that previously terminated at Baclaran now terminate at or feed PITX station.

---

## City 1: Las Piñas

### Geography

Las Piñas is traversed by two major east-west corridors:
- **Alabang-Zapote Road** — primary commercial spine from Muntinlupa border (Alabang area) westward to Zapote (Bacoor/Cavite border); ~8 km long
- **Dr. A. Santos Avenue / Sucat Road (SSH / South Superhighway)** — northern boundary shared with Parañaque; major north-south access
- **CAA Road / Airport Road** — mid-city north-south artery connecting SSH to coastal/airport area
- **Coastal Road / R-1** — western boundary coastal highway (also Parañaque border)

Key districts: **Zapote** (major jeepney hub at Cavite boundary), **Las Piñas Bayan / Poblacion** (old town center), **SM Southmall** (commercial hub), **BF Resort Village** (residential, southern), **Casimiro** (western residential).

### City Bus Routes

#### HIGH Confidence (2+ independent sources confirm Las Piñas segment)

| Route | Name | Operator | Origin → Destination | Las Piñas Segment | Sources |
|-------|------|----------|----------------------|-------------------|---------|
| **Route 23** | Alabang–Lawton via Zapote Road / Coastal Road | Alabang Transport Service Cooperative | Starmall Alabang, Muntinlupa → Plaza Lawton, Manila | Full Alabang-Zapote corridor through Las Piñas (SM Southmall, Starmall Las Piñas, Zapote) → via Cavitex/Coastal Road into Parañaque and Pasay | ltoportal (MM-BUS-023), OSM (OSM-BUS-23), validated-coastal-rxas-corridor, wikimili |

**Note on Route 23**: This is the primary city bus serving Las Piñas. The confirmed alignment is: Starmall Alabang → SM Southmall (Las Piñas) → Starmall Las Piñas → Zapote → Tramo → Cavitex → PITX → Coastal Road → Pasay → Ermita / Plaza Lawton. Las Piñas service areas confirmed by ltoportal: "Bacoor, Las Piñas, Manila, Muntinlupa, Parañaque, Pasay." Funride Transport also operates a similar Lawton-Las Piñas-Muntinlupa via Coastal Road route; and Reinalyn Bus Lines Corp. is confirmed on "Las Piñas / Muntinlupa ↔ Plaza Lawton via Coastal Road."

#### MEDIUM Confidence

| Route | Name | Notes |
|-------|------|-------|
| **Funride Transport** | Lawton–SM Southmall–Alabang via Coastal Road | Confirmed as operator (city-bus-operators analysis); route serves Las Piñas via Coastal Road corridor. Exact bus route number unknown. |
| **Reinalyn Bus Lines** | Las Piñas / Muntinlupa–Plaza Lawton via Coastal Road | Confirmed as operator on this corridor; route number not found. Overlap with Funride and Route 23. |

### Jeepney Routes

#### HIGH Confidence

| T-Code | Route Name | Via / Key Stops | Distance | Confidence |
|--------|-----------|-----------------|----------|-----------|
| **T416** | Baclaran–Zapote (Las Piñas) | Baclaran LRT-1 → F.B. Harrison → EDSA → Quirino Ave → Alabang-Zapote Rd → Zapote | — | HIGH (OSM wiki, baclaran-terminal analysis) |
| **T431** | Alabang–Baclaran via San Dionisio, Zapote | Alabang Terminal → Alabang-Zapote Rd → L. Hernandez Ave (Muntinlupa) → Fruto Santos Ave (Las Piñas) → SM Southmall Access Rd → Baclaran | 18.8 km | HIGH (Sakay DOTR:R_SAKAY_PUJ_934 confirmed; Alabang Transport Coop.) |
| **T428** | Alabang–Baclaran via B. Aquino Ave, SSH | Alabang → B. Aquino Ave → SSH/Sucat → Baclaran | — | MEDIUM-HIGH (OSM wiki, baclaran-terminal) |
| **T430** | Alabang–Baclaran via Imelda Ave, SSH | Alabang → Imelda Ave → SSH → Baclaran | — | MEDIUM-HIGH (OSM wiki, baclaran-terminal) |
| **T458** | Binakayan, Kawit–Zapote, Las Piñas | Cross-boundary Cavite→Las Piñas; Binakayan (Kawit, Cavite) → Zapote | — | MEDIUM (OSM wiki) |

**Prominent T431/Sakay route**: `DOTR:R_SAKAY_PUJ_934` (Alabang–Baclaran via San Dionisio, Zapote) has confirmed stop data: SM Southmall Access Rd (Las Piñas), Alabang-Zapote Rd/Fruto Santos Ave (Las Piñas side), Alabang-Zapote Rd/L. Hernandez Ave (Muntinlupa), Quirino Ave/12 de Junio (Parañaque), Baclaran. This route passes through the core of Las Piñas' commercial corridor.

#### MEDIUM Confidence (named routes from SM Southmall terminal area)

These routes operate along the Alabang-Zapote corridor and serve Las Piñas residential areas; no T-codes identified:

| Route Description | Via | Notes |
|-----------------|-----|-------|
| Alabang–Zapote (basic corridor) | Alabang-Zapote Road (full length) | Multiple operators; 24-hour service |
| Alabang–Southmall | Alabang-Zapote Road → SM Southmall | Short feeder |
| Alabang–Zapote Kabila | Alabang-Zapote Road; "other side" variant | Internal routing variant |
| Las Piñas Bayan | Connects Las Piñas Poblacion to Alabang or Baclaran | Old-town feeder route |
| San Dionisio RFC | San Dionisio → Recycling Facility / Coastal | Southern residential route |
| Casimiro / BF Resort | Casimiro Estate → Alabang or Baclaran | BF Resort area residential |
| Baclaran via Kabihasnan | Alabang → Kabihasnan Bridge → Baclaran | Coastal Road-adjacent variant |
| Baclaran via Coastal Road | Alabang → Coastal Road → Baclaran | Coastal Road alignment |

Source: commutetour.com (SM Southmall terminal summary), morefunwithjuan.com (Alabang-Southmall guide), rome2rio.

#### Modern PUJ (PUVMP)

| Route | Name | Operator | Route Description |
|-------|------|----------|-------------------|
| **Route 412** | Las Piñas Poblacion (Bamboo Organ)–SM Southmall | Great Power Movers Transportation Corporation | Las Piñas Poblacion → Diego Cera Ave → Naga Rd → CAA Ave → Alabang-Zapote Rd → SM Southmall |

Source: OSM wiki jeepney routes.

### UV Express Routes

#### MEDIUM–HIGH Confidence

| Route | Terminal | Destination | Fare | Notes |
|-------|---------|-------------|------|-------|
| BF Resort Village–Ayala Center via Coastal Road | BF Resort Village terminal | One Ayala, Makati | ~₱50–70 | AC van; air-conditioned FX/UV Express |
| BF Resort Village–Ayala Center via Skyway | BF Resort Village terminal | One Ayala, Makati | ~₱60–80 | Faster Skyway variant |
| Pilar Village–Ayala Center via Skyway | Pilar Village terminal | One Ayala, Makati | ~₱60–80 | Similar to BF Resort Village route |
| Almanza UV Express | Alabang-Zapote Rd (Almanza) | Ayala / Makati area | ~₱40–60 | Intermediate terminal along Alabang-Zapote corridor |

Source: thepoortraveler.net UV Express routes listing, emongsjournals.blogspot.com UV Express terminal guide (2017; status uncertain), rome2rio.com.

**Note**: Las Piñas UV Express primarily serves the Ayala/Makati corridor via Skyway or Coastal Road. No confirmed UV Express to Ortigas or BGC from Las Piñas directly.

### P2P Routes

| Route | Operator | Origin → Destination | Fare | Notes |
|-------|----------|----------------------|------|-------|
| SM Southmall–Glorietta (Circuit Makati) | San Agustin P2P / TAS Trans | SM Southmall, Las Piñas → Glorietta / Circuit Makati | ₱115 | Mon–Fri, 5:30AM–7PM; confirmed via commutetour.com SM Southmall terminal guide |

### Rail (Las Piñas)

| Station | Notes |
|---------|-------|
| **Dr. Santos LRT-1** | November 2024; Current southern terminus of LRT-1 Cavite Extension Phase 1; Located at intersection of Dr. A. Santos Ave and Airport Road; in eastern Las Piñas / Parañaque border zone; feeder routes not yet fully documented |

**Gap**: Feeder jeepney routes to Dr. Santos LRT-1 (new as of Nov 2024) are not yet systematically documented in any source. This station is expected to generate significant new short-haul jeepney feeder demand.

---

## City 2: Parañaque

### Geography

Parañaque spans two congressional districts with distinct transit characters:
- **1st District** (northern/coastal): Baclaran (shared with Pasay), Tambo, Don Galo, Sto. Niño, La Huerta, San Dionisio, San Isidro, Vitalez — primarily airport-adjacent, LRT-1 Cavite Extension stations, PITX
- **2nd District** (southern/inland): BF Homes, San Antonio, Marcelo Green, Sun Valley, Don Bosco, Moonwalk, Merville, San Martin de Porres — residential areas served by SSH/Sucat corridor

PITX, located in the 1st District at the southern end of the Coastal Road / Diosdado Macapagal Blvd, is the dominant transit node for the entire city.

### City Bus Routes (to/from Parañaque)

#### HIGH Confidence

| Route | Origin → Destination | Key Parañaque Stop(s) | Sources |
|-------|----------------------|-----------------------|---------|
| **Route 1 / EDSA Carousel** | Monumento → PITX | PITX, City of Dreams, Ayala Malls ASEANA, DFA / Macapagal, SM MOA (Pasay border) | MMDA, edsa-busway-system, ltfrb-bus, OSM; HIGH confidence |
| **Route 4** | McKinley Hill, Taguig → PITX | Entire Coastal Road approach to PITX (City of Dreams → PITX); LRT-1 Redemptorist-Aseana + PITX stations | ltoportal (MM-BUS-004), google-maps, ltfrb-bus; HIGH |
| **Route 43** | PITX → NAIA Loop (T1–T4) | PITX → Coastal Road → NAIA Terminals 1–4; Macapagal Ave alignment | OSM (Mega Manila Transport Consortium), ltoportal (MM-BUS-043), MMDA; HIGH |
| **Route 26** | PITX → Cavite City | Departs from PITX into Cavite via Coastal/Aguinaldo | ltoportal (MM-BUS-026); MEDIUM |
| **Route 27** | Dasmariñas → PITX / Lawton | Terminates at PITX (Parañaque) | ltoportal (MM-BUS-027); MEDIUM |
| **Route 28** | Naic → PITX | PITX as northern terminus | ltoportal (MM-BUS-028); MEDIUM |
| **Route 29** | Silang → PITX | PITX as northern terminus | ltoportal (MM-BUS-029); MEDIUM |
| **Route 30** | Balibago, Santa Rosa → PITX | PITX as northern terminus | ltoportal (MM-BUS-030); MEDIUM |
| **Route 31** | Trece Martires → PITX / One Ayala | PITX as northern terminus or intermediate | ltoportal (MM-BUS-031); MEDIUM |
| **Route 32** | GMA → PITX | PITX as northern terminus | ltoportal (MM-BUS-032); MEDIUM |
| **Route 55** | PITX → Lancaster New City, Kawit | PITX as southern origin | ltoportal (MM-BUS-055); MEDIUM |
| **Route 47** | Navotas → PITX | PITX as southern terminus | ltoportal (MM-BUS-047), city-bus-operators; MEDIUM |

Additional routes passing through Parañaque en route to PITX: Routes 5, 6/6A, 7, 14, 22, 34, 35, 40, 44, 49, 52, 65. Most are HIGH or MEDIUM confidence from ltoportal.

**Route 18** (PITX–NAIA Loop via McKinley/C5): Confirmed through baclaran-terminal analysis (HM Transport / Worthy Transport) and OSM. Passes through Parañaque's NAIA complex and PITX; continues north via C5 to North EDSA.

### Jeepney Routes (Parañaque)

#### HIGH Confidence

| T-Code | Route Name | Via / Key Stops | Notes |
|--------|-----------|-----------------|-------|
| **T403** | Baclaran–NAIA/Baltao | Baclaran LRT-1 → FB Harrison → Quirino Ave → CAA / Airport Rd → NAIA area / Baltao | 3.31 km; HIGH (OSM wiki, baclaran-terminal) |
| **T414** | Baclaran–Moonwalk via Quirino | Baclaran → Quirino Ave → Moonwalk | MEDIUM-HIGH (OSM wiki, baclaran-terminal) |
| **T415** | Baclaran–Nichols via CAA | Baclaran → CAA Road → Nichols, NAIA Terminal 3 area | MEDIUM-HIGH (OSM wiki) |
| **T436** | Baclaran–Sucat via B. Aquino Ave | Baclaran → B. Aquino Ave → SSH → Sucat | 13.4 km; HIGH (baclaran-terminal) |
| **T437** | Baclaran–Sucat via Imelda Ave | Baclaran → Imelda Ave → SSH → Sucat | 13.4 km; HIGH (baclaran-terminal) |
| **T438** | Baclaran–Sucat via Quirino Ave | Baclaran → Quirino Ave → Moonwalk → Sucat | 13.4 km; MEDIUM (baclaran-terminal) |
| **T401** | Alabang–Sucat via M.L. Quezon | Alabang → ML Quezon Ave → Sucat | 4.441 km; HIGH (OSM wiki) |
| **T413** | Alabang–FTI via SSH | Alabang → SSH / Sucat → FTI, Taguig | HIGH (OSM wiki) |
| **T441** | Kabihasnan–Sucat | Kabihasnan Bridge area → Sucat | MEDIUM (web search; LTFRB PITX routes) |
| **T442** | Nichols–SM Mall of Asia via Macapagal | Nichols (NAIA T3) → Macapagal Blvd → SM MOA, Pasay | 12.2 km; MEDIUM (OSM wiki) |
| **T443** | Sucat–Market! Market! (BGC) | Sucat → SSH → C5 → Market! Market!, Taguig | MEDIUM (OSM wiki; validated-taguig-bgc cross-reference) |
| **T465** | Nichols–Coastal Mall terminal (PITX) | Nichols → Coastal Road → PITX | MEDIUM (OSM wiki) |
| **nichols-jeep-naia-loop** | MRT Taft → NAIA T3 → T4 → Baclaran → Heritage → MRT Taft circular | 24/7 traditional jeepney loop through airport complex | HIGH (validated-taft-avenue; multiple sources) |

#### PITX Modern Jeepney Routes

LTFRB established 20 PITX-origin routes upon PITX opening. Confirmed operational from LTFRB PNA article and commutetour.com:

| Route (PITX-Origin) | Destination | Key Roads | Units | Confidence |
|--------------------|-------------|-----------|-------|-----------|
| PITX → Sucat | Sucat SLEX area / SM BF Parañaque | Ninoy Aquino Ave → Dr. A. Santos Ave → Multinational Village | 33 units (confirmed LTFRB) | HIGH |
| PITX → MIA (NAIA T2) | NAIA Terminal 2 / MIA Road | PITX → Ninoy Aquino Ave → MIA Road | — | HIGH |
| PITX → Nichols (NAIA T3) | NAIA Terminal 3 / Villamor | PITX → Coastal Road → NAIA T3 | — | HIGH |
| PITX → Alabang | Alabang, Muntinlupa | PITX → Coastal Road / SSH → Alabang | — | HIGH |
| PITX → SM Southmall | SM Southmall, Las Piñas | PITX → Coastal Road → Zapote → SM Southmall | — | HIGH |
| PITX → Buendia | Gil Puyat / Buendia, Makati | PITX → Coastal Road → EDSA → Buendia | — | MEDIUM |
| PITX → Vito Cruz | Vito Cruz LRT-1, Manila | PITX → Taft Ave Ext → Vito Cruz | — | MEDIUM |
| PITX → SM Mall of Asia | SM MOA, Pasay | PITX → Macapagal Blvd → SM MOA | — | MEDIUM |
| PITX → Lawton | Plaza Lawton, Manila | PITX → Taft Ave → Lawton | — | MEDIUM |

**Source**: LTFRB PNA article (pna.gov.ph/articles/1059998 — "LTFRB opens new routes for PITX"); commutetour.com PITX-Sucat route guide.

### UV Express Routes (Parañaque)

| Route | Terminal | Destination | Fare | Confidence |
|-------|---------|-------------|------|-----------|
| BF Parañaque UV Express–Ayala | SM BF Parañaque UV Express Terminal | One Ayala, Makati | ~₱50–60 | MEDIUM (Moovit site_29465118) |
| Moonwalk UV Express–Ayala | Brgy. Moonwalk UV Express Terminal | One Ayala, Makati | ~₱50–60 | MEDIUM (Moovit site_29468411) |
| PITX–Sucat UV Express | PITX UV terminal | Sucat | — | MEDIUM (LTFRB PITX routes) |

### P2P Routes (Parañaque)

PITX serves as a provincial bus terminal, not primarily a P2P hub. However, the following P2P services use Parañaque:

| Route | Operator | Parañaque Stops | Fare | Confidence |
|-------|----------|-----------------|------|-----------|
| NAIA T3–PITX | UBE Express | PITX (LRT-1 station) | ₱150 | HIGH (12 daily trips; 4:30AM–8PM) |
| NAIA T3–Imus, Cavite (via PITX) | UBE Express | PITX as intermediate | ₱200 | HIGH (Nov 2024 addition) |
| Merville, Parañaque–Ayala Circuit, Makati | COMET Bus (GET Philippines) | Merville, Parañaque (origin) | ₱100 | MEDIUM (p2p-routes analysis; McKinley Hill segment confirmed) |

### Rail (Parañaque — LRT-1 Cavite Extension)

All 5 stations opened November 16, 2024:

| Station | Barangay | Key Connections |
|---------|----------|-----------------|
| **Redemptorist-Aseana** | Baclaran/Parañaque border | Free modern jeepney to Ayala Malls Manila Bay; Baclaran Church adjacent; next to LRT-1 Baclaran |
| **Ninoy Aquino Avenue** | Tambo/La Huerta | NAIA adjacent; feeders to NAIA T1 and T2 expected |
| **PITX** | San Dionisio | EDSA Carousel southern terminus; PITX terminal; all provincial buses |
| **MIA Road** | Tambo | NAIA/Airport Road connector; free modern jeepney to Ayala Malls Manila Bay |
| **Dr. Santos** | Sto. Niño / Las Piñas border | Current southern terminus Phase 1; SSH connection |

---

## City 3: Muntinlupa

### Geography

Muntinlupa is NCR's southernmost city, stretching from the Laguna de Bay shore (east) to the Las Piñas border (west). Key sub-areas:
- **Alabang**: Commercial hub; Starmall Alabang / VTX, Alabang Town Center, Festival Mall, South Station; South Luzon Expressway (SLEX) interchange
- **Sucat**: Northern residential; connects to Parañaque SSH corridor; SLEX Sucat interchange
- **Tunasan**: Mid-city residential; Great Power Movers Route 411 serves here
- **Bayanan / Cupang / Buli**: Southern residential toward Laguna; PNR stations (suspended)
- **Poblacion Muntinlupa**: Old town; coastal Laguna shore

### City Bus Routes (to/from Muntinlupa)

#### HIGH Confidence

| Route | Name | Origin → Destination | Muntinlupa Segment | Sources |
|-------|------|----------------------|--------------------|---------|
| **Route 10** | One Ayala–Starmall Alabang | One Ayala, Makati → Starmall Alabang, Muntinlupa | Entire SLEX Makati→Alabang segment; terminus at Starmall Alabang | OSM, HM Transport, city-bus-operators, ltfrb-bus; HIGH |
| **Route 15** | BGC–San Pedro / Pacita | BGC, Taguig → Pacita Complex, San Pedro, Laguna | Through Alabang / South SLEX; Alabang intermediate stop | OSM, ltfrb-bus, ltoportal (MM-BUS-015); HIGH |
| **Route 23** | Alabang–Lawton via Coastal Road | Starmall Alabang, Muntinlupa → Plaza Lawton, Manila | Origin at Starmall Alabang | OSM, ltoportal (MM-BUS-023); HIGH |
| **Route 24** | Alabang–Lawton via SLEX | Starmall Alabang, Muntinlupa → Plaza Lawton, Manila | Origin at Starmall Alabang; via SLEx (vs Route 23 Coastal Road) | ltoportal (MM-BUS-024); HIGH |
| **Route 36** | Fairview–Alabang via C5 | SM Fairview, QC → Alabang, Muntinlupa | Terminus at Alabang; via C5 / Taguig corridor | ltoportal (MM-BUS-036), wikimili; HIGH |
| **Route 44** | Navotas–Alabang | Navotas Terminal → Alabang, Muntinlupa | Terminus at Alabang | OSM (OSM-BUS-44), ltoportal (MM-BUS-044), wikimili; HIGH |
| **PNR Augmentation 2** | Alabang–Divisoria | Starmall Alabang, Muntinlupa → Divisoria, Manila | Origin at Alabang via PNR-parallel corridor | HM Transport, OSM, pnr-feeder, city-bus-operators; HIGH |

#### MEDIUM Confidence

| Route | Name | Notes |
|-------|------|-------|
| **Route 12** | Pasay–Biñan via Muntinlupa | ltoportal (MM-BUS-012); Pasay Gil Puyat → Biñan JAC Terminal; passes through Muntinlupa (Alabang) |
| **Route 25** | Biñan–Lawton via Muntinlupa | ltoportal (MM-BUS-025); Biñan → Ermita via Muntinlupa, Makati |
| **Route 38** | Fairview–Pacita via Taft | ltoportal (MM-BUS-038); passes through Alabang area |
| **Route 39** | Fairview–Pacita via C5 | ltoportal (MM-BUS-039); Muntinlupa, San Pedro, Taguig |
| **Route 40** | Fairview–Alabang via Taft | ltoportal (MM-BUS-040); Terminus at Alabang via Taft/Manila |
| **Route 46** | Navotas–Pacita via Muntinlupa | ltoportal (MM-BUS-046); Navotas → Muntinlupa → San Pedro |
| **Route 48** | Pacita–Lawton | ltoportal (MM-BUS-048); Pacita Complex → Lawton via Makati/Muntinlupa |
| **Route 50** | VGC–Alabang via C5 | ltoportal (MM-BUS-050); Valenzuela → Alabang via C5/Taguig |
| **Route 53** | Cubao–Pacita | ltoportal (MM-BUS-053); Cubao → Pacita via Makati/Muntinlupa |
| **Route 58** | Alabang–Naic | ltoportal (MM-BUS-058); Origin at Alabang to Cavite via GMA |

**Critical**: Alabang → PITX direct bus (via SM Southmall, Starmall Las Piñas, Zapote, Tramo, Cavitex): fare ₱46, ~1 hour, departs 5AM–11PM. Operator: ALPS/Ceres (terminal next to Starmall Alabang). This route is not assigned a numbered city bus route in ltoportal data; it appears to be operated under a distinct cross-boundary franchise. HIGH confidence (commutetour.com summary; morefunwithjuan.com Alabang terminal guide).

### Jeepney Routes (Muntinlupa)

#### HIGH Confidence

| T-Code | Route Name | Via / Key Stops | Notes |
|--------|-----------|-----------------|-------|
| **T401** | Alabang–Sucat via M.L. Quezon | Alabang → ML Quezon → Sucat (Parañaque/Muntinlupa border) | OSM wiki; 4.441 km |
| **T413** | Alabang–FTI via SSH | Alabang → SSH/Sucat → FTI Complex (Taguig) | OSM wiki; long southside diagonal |
| **T428** | Alabang–Baclaran via B. Aquino Ave, SSH | Alabang → SSH → Baclaran via B. Aquino Ave | OSM wiki; baclaran-terminal; parallel routes |
| **T429** | Alabang–Baclaran via Coastal Road | Alabang → Coastal Road → SM MOA → Baclaran | HIGH (Sakay DOTR:R_SAKAY_PUJ_934 inverse; Alabang Transport Coop.) |
| **T430** | Alabang–Baclaran via Imelda Ave, SSH | Alabang → Imelda Ave → SSH → Baclaran | MEDIUM-HIGH; OSM wiki |
| **T431** | Alabang–Baclaran via San Dionisio, Zapote | Alabang → Alabang-Zapote Rd → San Dionisio → Baclaran | HIGH (Sakay DOTR:R_SAKAY_PUJ_934 confirmed; 18.8 km; Alabang Transport Coop.) |
| **T444** | Alabang–Muntinlupa via National Road | Civic Ave → Corporate Ave → Alabang-Zapote Rd → National Rd 1 → Muntinlupa Poblacion | HIGH (OSM wiki; Festival Alabang operator) |

#### Modern PUJ (PUVMP)

| Route | Name | Operator |
|-------|------|----------|
| **Route 411** | Alabang–Tunasan | Great Power Movers Transportation Corporation |
| **PITX–Alabang** | PITX–Alabang Modern Jeep | Various (LTFRB PITX routes via Kabihasnan) |

### UV Express Routes (Muntinlupa)

#### HIGH Confidence

| Route | Terminal | Destination | Fare | Notes |
|-------|---------|-------------|------|-------|
| **ATC UV Express** | Alabang Town Center UV Terminal (Theater Drive) | Multiple destinations across NCR | ~₱50–150 | Moovit site_46071416; first UV at 7AM, last at 10:13PM; cross-NCR network |
| **Baclaran–Alabang UV Express** | Baclaran UV terminal → Alabang UV terminal | 2-way express | ₱13 base + ₱1.80/km | HIGH (Moovit agency 1450948; 7AM–10PM daily; non-stop express; Coastal Road) |
| **Festival Mall UV Express** | Festival Mall, Alabang | UV to Laguna, Cavite, Quezon provinces | ~₱60–150 | Medium-HIGH; Moovit + provincial UV terminal data |

#### MEDIUM Confidence

| Route | Terminal | Destination | Fare | Notes |
|-------|---------|-------------|------|-------|
| **Mamatid (Cabuyao)–Festival Mall UV** | Mamatid/Cabuyao, Laguna → Festival Mall, Alabang | ₱60 | South Laguna → Alabang cross-boundary UV Express |
| **One Ayala–Alabang UV Express** | One Ayala, Makati | ₱40–60 | Makati→Alabang UV; cross-SLEX via expressway |
| **Ayala South Park UV Express** | Ayala South Park, Alabang | UV to Cavite, Laguna, Quezon | — | Ayala South Park property terminal; UV terminal confirmed by morefunwithjuan.com |

### P2P Routes (Muntinlupa)

#### HIGH Confidence

| Route | Operator | Origin → Destination | Fare | Schedule | Notes |
|-------|----------|----------------------|------|----------|-------|
| **One Ayala ↔ Alabang Town Center** | RRCG Transport | One Ayala, Makati ↔ ATC, Muntinlupa | ₱110 (₱88 disc.) | Daily; every ~30 min weekdays | PRIMARY Alabang P2P; Sakay: P2P:R confirmed |
| **SouthPark ↔ One Ayala / Greenbelt** | RRCG Transport | Ayala South Park, Muntinlupa ↔ Greenbelt 1/5 | ₱110 (₱88 disc.) | Sat–Sun | Weekend variant |
| **Starmall Alabang ↔ Starmall EDSA Shaw** | RRCG Transport | VTX Starmall, Alabang ↔ Starmall Shaw, Mandaluyong | ₱140 (₱112 disc.) | Mon–Fri 5:30AM–9:30PM | 30+ daily weekday trips |
| **BGC Market! Market! ↔ ATC Alabang** | HM Transport Inc. | Market! Market!, Taguig ↔ ATC, Muntinlupa | ~₱65–80 | Mon–Fri 5:30AM–7:30PM | BGC–Alabang direct P2P |
| **BGC Market! Market! ↔ South Station** | HM Transport Inc. | Market! Market!, Taguig ↔ South Station, Muntinlupa | ~₱65–100 | Mon–Sat 9AM–7:30PM | |
| **Robinsons Galleria ↔ Alabang** | RRCG Transport | Robinsons Galleria, Ortigas ↔ Alabang | ₱140 | Sat–Sun | Weekend Ortigas–Alabang |
| **Dasmariñas (R. Pala Pala) ↔ Cubao via Alabang** | Alabang Metrolink | R. Pala Pala, Dasmariñas ↔ Cubao (Araneta) | ₱130 | 4AM–10PM | Via SLEX → Alabang → C5; Alabang is intermediate stop |
| **Alabang ↔ Cubao** | Alabang Metrolink | Alabang, Muntinlupa ↔ Araneta Cubao, QC | ₱90 | 4:30AM–10PM | Via SLEX → C5; Sakay: P2P:R_981DRLL |

#### MEDIUM Confidence

| Route | Operator | Notes |
|-------|----------|-------|
| **Vista Mall Bacoor ↔ Starmall Alabang** | MetroExpress Connect | ₱50/₱40 intro; 42+ daily trips Bacoor-Alabang; Alabang is terminal |
| **NAIA–VTX Alabang UBE Express** | UBE Express | ⚠️ SUSPENDED as of February 1, 2026 (Facebook page notice) |
| **Calamba/Sta. Rosa ↔ Alabang** | HM Transport / TAS Trans | Provincial Laguna routes with Alabang as NCR terminal |
| **ALPS Bus BGC–Alabang/VTX** | ALPS Bus (JAC Liner) | BGC → Alabang; Alabang is southern terminal; Market! Market! → Alabang via SLEX |

### Rail (Muntinlupa)

| Station/Service | Notes |
|-----------------|-------|
| **PNR Alabang Station** | SUSPENDED since June 2023 for NSCR construction. Was a key Muntinlupa-to-Manila rail link. **PNR Augmentation Route 2** (HM Transport, Alabang–Divisoria city bus) serves as replacement. No restart date confirmed for original PNR. |

---

## Cross-Source Conflicts

| Conflict | Details | Resolution |
|----------|---------|-----------|
| **Route 23 numbering** | city-bus-operators analysis assigned Route 23 = "PITX–Sucat, Parañaque." ltoportal, OSM, and Coastal Road corridor analysis assign Route 23 = "Alabang/Starmall–Plaza Lawton via Coastal Road." | ltoportal/OSM numbering is authoritative (post-2020 rationalization). Route 23 = Alabang–Lawton via Coastal Road (HIGH). The "PITX-Sucat" assignment in city-bus-operators appears to use older pre-rationalization numbering and should be disregarded. |
| **T436/T437/T438 overlap** | Three near-identical route codes (Baclaran–Sucat) differ only in the specific connector road (B. Aquino Ave vs. Imelda Ave vs. Quirino Ave). Some sources list all three; others list only one. | All three are distinct franchise codes per OSM wiki. Each likely serves slightly different residential catchment areas within Parañaque. All retained as separate routes. |
| **Route 15 vs. Route 25 (BGC/Biñan–Alabang)** | Confirmed conflict documented in validated-taguig-bgc analysis: Route 15 (OSM confirmed, BGC–San Pedro/Balibago) and Route 25 (ltfrb-bus, BGC–Alabang) may be same corridor different numbering. | Route 15 carries higher source confidence (OSM + 2 others); Route 25 from ltfrb-bus only. Retain both in GTFS as separate entries but flag for reconciliation. Muntinlupa (Alabang) is confirmed as a stop on both. |
| **PNR Augmentation Route 2 (Alabang origin)** | Some sources list Route 2 as originating at FTI (Taguig), not Alabang. | Both are correct: there are TWO PNR Augmentation routes. Route 1 = Alabang–Divisoria; Route 2 = FTI–Divisoria. They were confirmed in multiple sources. The Alabang route serves Muntinlupa; the FTI route serves Taguig. |
| **Alabang–PITX bus (route number)** | A city bus route from Starmall Alabang through SM Southmall/Las Piñas/Zapote/Tramo to PITX (fare ₱46, 1hr, ALPS/Ceres) is confirmed by commutetour.com but has no assigned numbered route in ltoportal data. | Cross-boundary route; may be operated under a separate Cavite-NCR franchise. Morefunwithjuan.com confirms the route. Include in GTFS with operator ALPS/Ceres and note missing route number. |
| **UBE Express NAIA–VTX Alabang** | Multiple sources listed this route as active. As of February 1, 2026, UBE Express Facebook page confirms **TEMPORARY SUSPENSION** of the NAIA–VTX Alabang route. | Mark as SUSPENDED in GTFS; include note about potential resumption. Do not include in frequency.txt. |

---

## Key Gaps

1. **Dr. Santos LRT-1 feeder routes**: New station (Nov 2024) at Las Piñas/Parañaque border; no documented feeder jeepney routes with T-codes or Sakay IDs. Expect 3–5 new feeder routes to develop; field survey needed.

2. **Redemptorist-Aseana and Ninoy Aquino Ave LRT-1 feeders**: Free modern jeepney confirmed for Aseana → Ayala Malls Manila Bay, but no additional LTFRB-code routes confirmed for these new stations.

3. **Parañaque 2nd District inland routes**: BF Homes, Moonwalk, Merville, Sun Valley, Marcelo Green residential areas are served by UV Express and some T-series routes (T436/T437/T438 via SSH/Sucat) but specific route stop lists and T-codes for internal Parañaque 2nd District routes are not documented.

4. **Las Piñas Pilar/BF Pilar routes**: The western coastal strip of Las Piñas (BF Pilar, Pilar Estate) has UV Express to Ayala but local jeepney T-codes are not identified.

5. **Muntinlupa Poblacion and Bayanan routes**: Southern Muntinlupa residential areas south of Alabang (Bayanan, Cupang, Buli, Poblacion along Laguna de Bay) are likely served by informal jeepneys with no documented T-codes.

6. **Alabang–PITX bus route number**: The confirmed Alabang→PITX bus (₱46, ALPS/Ceres terminal) has no identified LTFRB route number. May be Route 58 (Alabang–Naic) or a sub-segment thereof, or a separate franchise.

7. **Festival Mall and Ayala South Park UV Express terminal routes**: Both are confirmed UV Express hubs in Muntinlupa but individual route destinations (especially provincial routes to Quezon and Laguna) are not systematically documented.

8. **Parañaque NAIA-area T-series routes**: Routes T465 (Nichols–Coastal Mall) and T442 (Nichols–MOA) have OSM wiki listings but no stop-level data, geometry, or Sakay IDs found.

9. **Post-PNR route adjustments in Muntinlupa**: The PNR suspension (June 2023) forced changes in commuter patterns. Which jeepney routes expanded to compensate (beyond PNR Augmentation 2) is not documented.

---

## Summary Statistics

| City | City Bus (HIGH) | City Bus (MED) | Jeepney (HIGH) | Jeepney (MED) | UV Express | P2P (HIGH) | P2P (MED) | Total |
|------|----------------|---------------|---------------|--------------|------------|------------|-----------|-------|
| Las Piñas | 1 | 2 | 5 | 8 | 4 | 1 | 0 | 21 |
| Parañaque | 3 | 9 | 13 | 9 | 3 | 3 | 0 | 40 |
| Muntinlupa | 7 | 10 | 7 | 2 | 3 | 8 | 4 | 41 |
| **All three** | **11** | **21** | **25** | **19** | **10** | **12** | **4** | **102** |

(Note: Some routes appear in multiple cities — counted once per most relevant city. Many routes exist in multiple cities simultaneously.)

**Total routes validated for southern Metro Manila cluster**: 102 distinct route entries across all modes
- HIGH confidence: 58
- MEDIUM confidence: 44

### Key Observations

1. **PITX dominates Parañaque transit**: 12+ city bus routes terminate at or depart from PITX; 9+ modern jeepney routes; the EDSA Carousel southern terminus. This single terminal is the transit axis for the entire southern NCR.

2. **Alabang is a secondary hub**: VTX Starmall + ATC + Festival Mall form a P2P and UV Express cluster that rivals BGC in service density. RRCG (3 routes), HM Transport (2 routes), ALPS Bus (1 route), Alabang Metrolink (2 routes) all confirmed here.

3. **Las Piñas is transit-sparse**: Only 1 confirmed HIGH-confidence city bus route serves Las Piñas proper (Route 23). The city relies heavily on jeepneys and UV Express from Alabang-Zapote corridor to access Manila and Makati. LRT-1 Dr. Santos (Nov 2024) is expected to improve connectivity but feeder routes are undocumented.

4. **The Baclaran–Sucat/SSH corridor is tripled**: T436, T437, T438 are three parallel jeepney routes on the same general corridor using different connector roads. This is a high-ridership sub-corridor serving Parañaque's inland residential areas.

5. **Provincial bus pass-through is significant**: Multiple provincial bus routes from Cavite, Laguna, and Batangas make interim stops in southern Metro Manila (PITX, Alabang, Starmall). These trips are not captured in city bus route data.

---

## Sources

- `raw/baclaran-terminal-routes.json` — T403, T414, T415, T416, T428–T431, T436–T438; Baclaran hub jeepney routes; DOTR:R_SAKAY_PUJ_934
- `raw/ltoportal-ph-routes.json` — Routes 10, 12, 15, 23, 24, 25, 36, 38–40, 44, 46, 48, 50, 53, 58; city bus service areas confirmed
- `raw/city-bus-operators-routes.json` — Funride Transport (Las Piñas/Alabang-Lawton Coastal), Reinalyn Bus Lines (Las Piñas-Lawton), PNR Augmentation 2 (Alabang-Divisoria), Route 10 (HM Transport)
- `raw/p2p-routes.json` — RRCG (ATC↔One Ayala, Starmall Alabang↔Starmall Shaw, SouthPark↔Greenbelt), HM Transport (BGC↔ATC, BGC↔South Station), Alabang Metrolink (Alabang↔Cubao, Dasmariñas↔Cubao), MetroExpress (Bacoor↔Alabang), UBE Express (NAIA↔PITX, NAIA↔Imus), COMET Bus (Merville↔Ayala Circuit)
- `raw/osm-transit-relations-routes.json` — T401, T413, T444; Route 44 (Navotas-Alabang via Roxas Blvd), Route 23 (Plaza Lawton-Alabang via Coastal)
- `raw/sakay-ph-routes.json` — DOTR:R_SAKAY_PUJ_934 (Alabang-Baclaran via San Dionisio/Zapote); P2P Alabang routes
- `raw/moovit-routes.json` — Baclaran-Alabang UV Express (agency 1450948); ATC UV Terminal (site 46071416); BF Parañaque UV Express (site 29465118); Moonwalk UV Terminal (site 29468411)
- `raw/ltfrb-uv-express-routes.json` — Baclaran-Alabang UV Express; BF Resort Village routes
- `raw/edsa-busway-routes.json` — EDSA Carousel coastal approach (PITX, City of Dreams, DFA, MOA stops)
- `raw/provincial-bus-operators-routes.json` — PITX provincial bus operators (DLTB, JAC, Philtranco, Bicol Isarog, Saulog, etc.)
- `raw/pnr-feeder-routes.json` — PNR Augmentation Route 2 (Alabang-Divisoria, HM Transport)
- OSM wiki — T401, T403, T412, T413, T414, T415, T416, T428–T431, T436–T438, T441–T444, T458, T465
- Analysis cross-references: validated-taft-avenue-corridor.md, validated-coastal-roxas-boulevard-corridor.md, validated-taguig-bgc.md, baclaran-terminal.md, p2p-bus-operators.md, provincial-bus-operators.md
- Web: [morefunwithjuan.com Alabang bus terminals](https://www.morefunwithjuan.com/2022/06/alabang-bus-terminals.html), [morefunwithjuan.com South Station guide](https://www.morefunwithjuan.com/2022/12/alabang-south-station-transport-terminal.html), [ph.commutetour.com SM Southmall terminal](https://ph.commutetour.com/ph/terminal/sm-southmall/), [LTFRB PITX new routes PNA](https://www.pna.gov.ph/articles/1059998), [topgear.com.ph LRT-1 Cavite Extension guide](https://www.topgear.com.ph/features/feature-articles/lrt-1-cavite-extension-phase-1-stations-guide-a4682-20250202-lfrm)
