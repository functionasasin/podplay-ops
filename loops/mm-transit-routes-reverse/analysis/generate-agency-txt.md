# GTFS Wave 3 — Generate agency.txt

**Aspect**: Generate agency.txt — list all operators/agencies
**Date**: 2026-03-01
**Input files**: city-bus-operators.md, p2p-bus-operators.md, provincial-bus-operators.md, bgc-bus-system.md, university-shuttles.md, edsa-busway-system.md, ltfrb-modernization-program.md, ltfrb-uv-express-franchise-database.md, validated-fare-integration-analysis.md
**Output**: analysis/gtfs/agency.txt

---

## Summary

Generated **61 agency entries** across 7 operator categories covering all publicly documented transit service providers operating in Metro Manila as of March 2026. This file is the foundation for `routes.txt`, as every route must reference a valid `agency_id`.

---

## Agency Categories

### 1. Rail Operators (4 agencies)

| agency_id | Operator | Lines | Notes |
|-----------|---------|-------|-------|
| LRMC | Light Rail Manila Corporation | LRT-1 | Ayala/Metro Pacific concession holder since 2015 |
| LRTA | Light Rail Transit Authority | LRT-2 | Government-operated; LRT-1 concession grantor |
| MRT3 | Metro Rail Transit Line 3 (DOTr) | MRT-3 | DOTr took over from MRTC in 2019; Sumitomo maintenance |
| PNR | Philippine National Railways | PNR | Suspended Jun 2023 for NSCR construction; ~2028–2029 return |

**Note on LRT-1 agency split**: LRMC is the operator passengers see (branding, ticketing, staff); LRTA is the infrastructure owner. For GTFS, LRMC handles the LRT-1 service. LRTA's agency_id is retained for LRT-2 routes which it operates directly.

**Note on PNR**: Included for completeness and future GTFS updates. No active service as of March 2026; all PNR-augmentation bus routes are operated by HM Transport (HMTRANS agency_id).

---

### 2. BRT / Busway (3 agencies)

| agency_id | Operator | Service | Notes |
|-----------|---------|---------|-------|
| EDSACAR | EDSA Carousel (Busway Route 1) | EDSA Busway, 28 km, 24 stops | Passenger-facing brand; both consortia operate it |
| ESTC | ES Transport and Partners Consortium | EDSA Carousel + city bus routes | Co-operator of EDSA Carousel; 87 total operator license holders |
| MMTC | Mega Manila Consortium Corporation | EDSA Carousel + Route 43 | Co-operator of EDSA Carousel; Route 43 (PITX–NAIA) |

**EDSA Carousel agency treatment**: Since passengers board without distinguishing between the two consortia, `EDSACAR` is the primary agency_id for EDSA Carousel routes in routes.txt. `ESTC` and `MMTC` are listed separately for their non-Carousel routes (city bus franchises operated independently).

---

### 3. Specialized / LGU-Operated Systems (3 agencies)

| agency_id | Operator | Service | Fare | Notes |
|-----------|---------|---------|------|-------|
| BGCBUS | Bonifacio Transport Corporation | BGC Bus (8+ routes within BGC/Makati) | ₱13–90 | Not LTFRB-franchised; private estate transport |
| QCITYBUS | Quezon City TTMD | QCity Bus (8 routes, free) | FREE | Permanent per QC Ordinance SP-3184 S-2023 |
| GETPH | Global Electric Transport Philippines | Love Bus (2 routes, 2025 launch) + COMET Bus | Free (peak) / fee | DOTr-partnered electric bus program |

---

### 4. City Bus Operators — LTFRB-Franchised (22 agencies)

All operate rationalized numbered routes (MC 2020-019 and subsequent board resolutions). Operators documented from city-bus-operators.md analysis:

| agency_id | Operator | Primary Routes | Status |
|-----------|---------|----------------|--------|
| HMTRANS | HM Transport Inc. | Route 10, Route 18/NAIA Loop, PNR-AUG 1 & 2 | Active |
| MMBC | Metro Manila Bus Co. (JAC Group) | Baclaran–SM Fairview (EDSA + Quiapo variants) | Active |
| RRCG | RRCG Transport System (Southern Carrier) | Manila–Taytay/Cainta via Ortigas; P2P also | Active |
| KTI | Kellen Transport Incorporated | Baclaran–San Jose del Monte, Bulacan; EDSA Carousel | Active |
| ESE | Earth Star Express | SM Fairview–Alabang; EDSA Carousel (ES Consortium) | Active |
| JAYROSS | Jayross Lucky Seven Tours | Baclaran/Alabang–SM Fairview; Grotto/Tungko variants | Active |
| FVBUS | Fairview Bus Inc. | Baclaran–SM Fairview | Active |
| FERMINA | Fermina Express | Baclaran–SM Fairview (Ayala); Lagro–NAIA | Active |
| FUNRIDE | Funride Transport | Lawton–SM Southmall via Coastal Road | Active |
| GASAT | Gasat Express | Alabang–SM Fairview (full EDSA) | Active |
| GLINER | G Liner (De Guia Enterprises Inc.) | Taytay/Cainta–Quiapo via Manila East Road | Active |
| GRLINE | Greenline Express | Baclaran–SM Fairview | Active |
| ROVT | ROV Transport | Navotas–Baclaran via EDSA Ayala | Active |
| ROVAL | Roval Transport Corp. | Novaliches–PITX (Route 7 per OSM) | Active |
| RGSML | Regal Starliner (formerly ALTRANSCO) | Silang/Tagaytay/Mendez–PITX; Alabang–Lawton | Active |
| RNLB | Reinalyn Bus Lines Corp. | Las Piñas/Muntinlupa–Lawton via Coastal Road | Active |
| MALTC | Marikina Auto Line Transport Corporation | Montalban/San Mateo–Baclaran; Navotas–Baclaran | **Reportedly INACTIVE Jun 2025** |
| ALTSCOOP | Alabang Transport Service Cooperative | Route 5 (North Luzon Express Terminal–PITX) | Active (OSM) |
| LIPPAD | Lippad Trans | Route 17 (Fairview–Ayala per OSM; 374 vehicles) | Active (OSM) |
| ESTC | ES Transport Consortium | (see BRT section) | Active |
| MMTC | Mega Manila Transport Consortium | (see BRT section) | Active |
| LTFRB_BUS | Various operators — Routes 31–68 | Routes 31–68 where operator not identified | Catch-all |

---

### 5. P2P Bus Operators (12 agencies)

All operate premium Point-to-Point services under DOTr/LTFRB franchise:

| agency_id | Operator | Key Corridors | Payment | Status |
|-----------|---------|---------------|---------|--------|
| RRCG | RRCG Transport System | Makati–Alabang, Makati–Antipolo, Makati–Fairview | Beep, Cash | Active (also city bus) |
| HMTRANS | HM Transport Inc. | BGC–Alabang, BGC–South Station | Cash | Active (also city bus) |
| TASTRANS | TAS Trans (HM affiliate) | Glorietta–Nuvali, Glorietta–Calamba | Cash | Active |
| UBEX | UBE Express (Air Freight 2100) | NAIA T3 to multiple Metro Manila + Laguna/Cavite | Beep, Cash | Active |
| DNS | Delta Neosolutions | UP Town Center–One Ayala; Antipolo–One Ayala | TRIPKO card, Cash | Active |
| METROE | MetroExpress Connect Inc. | Vista Mall Taguig–Makati; Bacoor–Alabang | Cash | Active |
| SRTX | Saint Rose Transit | Calamba–Makati, Calamba–BGC, Calamba–Lawton | Cash | Active |
| AMBLK | Alabang Metrolink Bus Corp. | Dasmariñas–Cubao; Alabang–BGC via C-5 | Cash | Active |
| PGTS | Precious Grace Transport Services | SM North/Trinoma–Bulacan (multiple munis); Eastwood–Makati | Cash | Active |
| SAGTXP2P | San Agustin Transport Service (P2P) | Circuit Makati–Cavite destinations | Cash | Active |
| ALPSBUS | ALPS The Bus Inc. (JAC Group) | Batangas–BGC–Megamall; intra-Metro P2P overlay | Cash | Active |
| GNST | Genesis Transport (Clark P2P) | Cubao/Trinoma–Clark; NAIA T3–Clark | Cash | Active (also provincial) |

---

### 6. Provincial Bus Operators with NCR Presence (17 agencies)

All hold provincial CPCs from LTFRB; included for their NCR terminal operations and in-city stop pairs:

| agency_id | Operator | NCR Terminals | Direction | Status |
|-----------|---------|---------------|-----------|--------|
| VICT | Victory Liner Inc. | Cubao, Monumento, Pasay, Sampaloc | North (Zambales, Pangasinan, La Union, Cagayan) | Active |
| FVSB | Five Star Bus Company | Cubao, Avenida, Pasay | North (Pangasinan, Nueva Ecija, Cagayan) | Active |
| GNST | Genesis Transport | Cubao, Trinoma, PITX | North (Bataan, Baguio, Aurora) + South (Cavite) | Active |
| PRTS | Partas Transportation Co. | Cubao, Sampaloc, Pasay | North (Ilocos, Cagayan, Cordillera) | Active |
| FRNS | Fariñas Transit | Sampaloc, Cubao (Dagupan Terminal) | North (Ilocos Norte) | Active |
| GVFL | GV Florida Bus | Sampaloc, Cubao, Pasay | North (Cagayan, Ilocos, Isabela) | Active |
| BLWG | Baliwag Transit Inc. | Cubao, Caloocan (Gracepark) | North (Bulacan, Nueva Ecija) | Active |
| SLNTH | Solid North Transit Inc. | Cubao EDSA, PITX | North (Pangasinan, Baguio) | Active |
| JACLN | JAC Liner Inc. | Cubao Kamias, Avenida, Buendia, One Ayala | South (Laguna, Batangas, Quezon) | Active |
| DLTB | DLTB Co. | PITX, Cubao, Pasay, Buendia | South + Long (Batangas→Bicol→Visayas) | Active |
| PHLTR | Philtranco | Pasay, Cubao | South-Long (Bicol, Visayas, Mindanao) | **⚠️ Announced closure Mar 30, 2026** |
| BIST | Bicol Isarog Transport System | PITX, Alabang, Cubao | South (Bicol, Leyte) | Active |
| CODA | Coda Lines | Cubao (HM Transport terminal) | North-Mountain (Cordillera) | Active |
| SAUL | Saulog Transit Inc. | Pasay Rotonda, PITX | West (Cavite, Olongapo) | Active |
| DALDR | Don Aldrin Transport | Pasay EDSA strip | South (Dasma, Trece Martires) | Active |
| GRME | German Espiritu Bus | Cubao EDSA | North-near (Bulacan) | Active |
| SLVST | Silver Star Shuttle and Tours | Cubao ACBP | South (Samar, Leyte, Bohol via RORO) | Active |
| SAGTXPROV | San Agustin Transport (Nasugbu) | Pasay EDSA strip | South (Nasugbu, Batangas) | Active |

---

### 7. Jeepney / Cooperative / Catch-All (4 agencies)

| agency_id | Description | Notes |
|-----------|------------|-------|
| UPIKOT | Maroon Riders / North UP Campus Transport Cooperative | Operates UP Ikot (CCW) and Toki (CW) loops + UP external routes; LTFRB-franchised PUJ |
| SETSCO | Senate Employees Transport Service Cooperative | First modern PUJ operator since Jun 2018; CCP–PICC–MOA–PITX and Senate–GSIS routes |
| LTFRB_PUJ | Various LTFRB-franchised PUJ Operators | Catch-all for all jeepney routes where specific TSE/operator is not individually identified |
| LTFRB_UV | Various LTFRB-franchised UV Express Operators | Catch-all for ~250 UV Express N/C-coded routes where operator is not specified |

---

## Design Decisions

### Agency URL for operators without official websites
The GTFS specification requires `agency_url` for all agencies. Many smaller operators (KTI, JAYROSS, MALTC, etc.) do not have documented official websites. The fallback `https://www.ltfrb.gov.ph` is used as the regulatory body responsible for their franchise. This is clearly non-ideal but technically valid. **Future improvement**: direct operator website URLs should replace LTFRB fallbacks.

### Catch-all agency entries
Three catch-all entries (`LTFRB_PUJ`, `LTFRB_UV`, `LTFRB_BUS`) are included for routes where the operator TSE is not publicly documented:
- ~250 UV Express N/C-coded routes have consolidation data but operator names are not publicly listed
- Jeepney routes: hundreds of TSEs exist (97% consolidation rate in NCR as of early 2026) but full TSE-to-route mapping is unavailable without LTFRB eFOI
- City bus Routes 31–68: LTFRB Board Resolutions 55 & 57 (Aug 2023) added these routes but operator names are not in a consolidated public source

### EDSA Carousel dual consortium
Two consortia (ESTC, MMTC) jointly operate the EDSA Carousel brand. From a passenger perspective, these are indistinguishable. `EDSACAR` is the passenger-facing agency for the Carousel route in routes.txt; `ESTC` and `MMTC` are listed for their non-Carousel franchises (Route 43 under MMTC; other city bus routes under ES Consortium members).

### PNR and Philtranco status
- **PNR**: Included with clear "suspended" note. Routes will be marked inactive; preserves framework for NSCR relaunch (~2028–2029).
- **Philtranco**: Included with ⚠️ warning. Announced closure March 30, 2026. Routes using `PHLTR` agency_id should be flagged for verification before any GTFS publication.
- **MALTC**: Included with "reported inactive Jun 2025" note; routes should be marked inactive.

---

## Agency Count Summary

| Category | Count |
|----------|-------|
| Rail | 4 |
| BRT / Busway | 3 |
| Specialized / LGU | 3 |
| City Bus (LTFRB-franchised) | 22 |
| P2P | 12 |
| Provincial (NCR-terminal) | 18 |
| Jeepney / Cooperative / Catch-all | 4 |
| **Total** | **61** (some operators appear in multiple categories and are counted once) |

**Adjusted for overlaps**: RRCG and HMTRANS and GNST each appear in both city-bus/P2P and provincial categories but have a single `agency_id` each. Net unique agencies: **61 rows** in agency.txt.

---

## Known Gaps

1. **Individual TSE names for jeepney routes**: The 97% consolidation rate means almost all NCR jeepney routes have a named cooperative, but the full TSE-to-route database is not public. eFOI request to LTFRB NCR would yield 200–400 additional TSE operator entries.

2. **Individual UV Express operator names**: No public database of UV Express TSEs by route code exists; catch-all `LTFRB_UV` is the only practical approach with current data.

3. **EDSA Carousel sub-operators**: 87 operators hold licenses to operate EDSA Carousel buses; only the two consortia are the contract holders. Individual sub-operators (Earth Star Express, Kellen Transport, etc.) are already listed separately under city bus.

4. **BGC Bus URL**: Bonifacio Transport Corporation's official public website was not confirmed during analysis. `https://www.ltfrb.gov.ph` used as fallback; BGC Bus is not LTFRB-regulated but this is the best available URL.

5. **GET Philippines (Love Bus/COMET) URL**: Official website not confirmed from analysis data. `https://www.ltfrb.gov.ph` used as fallback.

6. **Philtranco post-March 2026 status**: Announced closure; confirmation needed before any routing engine use of PHLTR routes.

---

## Sources

- `analysis/city-bus-operators.md` — all city bus operator profiles
- `analysis/p2p-bus-operators.md` — all P2P operator profiles and contact details
- `analysis/provincial-bus-operators.md` — provincial operator profiles
- `analysis/bgc-bus-system.md` — BGC Bus operator identity
- `analysis/university-shuttles.md` — UP Ikot/Toki cooperative identity
- `analysis/edsa-busway-system.md` — EDSA Carousel consortium names
- `analysis/ltfrb-modernization-program.md` — SETSCO first modern PUJ, cooperative framework
- `analysis/ltfrb-uv-express-franchise-database.md` — UV Express route codes, no operator names
- `analysis/validated-fare-integration-analysis.md` — payment method per operator (P2P section)
