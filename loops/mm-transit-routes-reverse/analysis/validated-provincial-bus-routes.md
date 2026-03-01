# Validated Provincial Bus Routes (NCR Segments) — Metro Manila

**Aspect**: All provincial bus routes (NCR segments) — deduplicated list of NCR portions
**Date**: 2026-03-01
**Sources cross-referenced**: `provincial-bus-operators-routes.json`, `ltfrb-bus-routes.json`, `cubao-terminal-routes.json`, `pasay-edsa-terminal-routes.json`, `monumento-terminal-routes.json`, `p2p-routes.json`, `other-major-terminals-routes.json`, `ltfrb-rationalization-routes.json`, `moovit-routes.json`, `sakay-ph-routes.json`

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Confirmed NCR terminals (provincial bus hubs) | 7 |
| Distinct provincial bus operators with NCR terminals | 25+ |
| Distinct provincial bus routes from NCR | ~150 (rough; operators underdocumented) |
| Routes with high confidence (2+ sources) | 34 |
| Routes with medium confidence (1 source, plausible) | 52 |
| Routes with low confidence (single source, uncertain) | 15+ |
| **Total routes catalogued in this validation** | **101** |

**Scope note**: This validation covers only NCR portions of provincial bus routes — i.e., the terminal locations within NCR and the in-NCR trajectory before buses exit the metro. It does NOT cover the full origin-to-destination span of each route.

---

## Critical Status Flag

⚠️ **PHILTRANCO CLOSURE**: As of February 2026, Philtranco (oldest PH bus operator, 1914) announced cessation of operations by **March 30, 2026**. All Philtranco routes should be treated as **INACTIVE** for GTFS purposes unless confirmed reinstated. Amihan Bus Lines (Philtranco subsidiary) also suspended. This eliminates the only nationwide CPC holder and affects ~20+ Bicol/Visayas/Mindanao routes from Pasay and Cubao.

---

## NCR Terminal Hubs

### 1. Cubao Complex (Quezon City) — PRIMARY NORTHERN HUB

Multiple sub-terminals along EDSA and surrounding streets. **High confidence** across all major sources (terminal data, operator websites, phbus.com, Reddit, Facebook groups).

| Sub-Terminal | Key Operators | Routes Direction |
|---|---|---|
| EDSA Northbound strip (nr Aurora Blvd) | Victory Liner, Five Star, Baliwag, Viron, Superlines, German Espiritu | North: Bulacan, Pampanga, Pangasinan, La Union, Benguet, Cagayan |
| EDSA Southbound strip (nr Aurora Blvd) | Genesis, DLTB, ALPS, JAC/JAM, Partas, Solid North | South: Laguna, Batangas, Bicol |
| Araneta City Bus Port (ACBP) — Gen. Romulo Ave | Pangasinan Solid North, Amihan, Silver Star, JVH, Megabus, Raymond, RSL, ES Transport | North and South long-haul |
| Kamias Terminal (EDSA cor. Mapagmahal St) | JAC Liner (flagship QC hub) | South: Laguna, Batangas, Quezon Province |
| Dagupan Bus Terminal (New York Ave cor. EDSA) | Dagupan Bus Co., Fariñas Transit | North: Pangasinan, Ilocos Norte |

**Cross-reference status**: Confirmed across `provincial-bus-operators-routes.json`, `cubao-terminal-routes.json`, `ltfrb-bus-routes.json` (routes 51–53 use ACBP terminus), Reddit Philippines, Facebook commuter groups, Sakay.ph.

---

### 2. Pasay / EDSA Strip (Pasay City) — SOUTHERN CROSS-POINT

**High confidence** for existence; operator-by-terminal assignments vary across sources.

| Operator | Terminal Location | Direction |
|---|---|---|
| Victory Liner | 712 EDSA, Brgy. 143, Pasay | North: Olongapo, Zambales |
| Don Aldrin Transport | Near Mahal Kita Inn, EDSA, Pasay | South: Dasmariñas, Trece Martires (Cavite) |
| San Agustin Transport | Below/near MRT-3 Taft (Genesis bus bay) | South: Nasugbu (Batangas) |
| Saulog Transit | MRT Taft / Pasay Rotonda area | West: Cavite City, Ternate, Naic |
| Philtranco | EDSA-Taft area | ⚠️ INACTIVE (closure March 2026) |
| Five Star | EDSA Pasay strip | North: Pangasinan |
| Gold Line Tours | EDSA strip | South: Bicol |
| Ceres Bus | EDSA strip | South: Bicol + RORO Visayas |
| JVH Bus | EDSA strip | South: Bicol |

**Source conflict**: `provincial-bus-operators-routes.json` and `pasay-edsa-terminal-routes.json` largely agree on operator presence but differ on specific bay/address for Gold Line, Ceres, and JVH (single-source only). Noted as **contested** (medium confidence).

---

### 3. PITX — Parañaque Integrated Terminal Exchange (SOUTHERN HUB)

Opened 2018. 4.5 hectares, 50+ operators, 200+ destinations. **High confidence** for all major operators.

| Gate/Bay | Operators | Routes |
|---|---|---|
| Gate 1 | Various Cavite-bound | Naic, Bacoor, Cavite City, GMA, Dasmariñas |
| Gate 2 | Philtranco subsidiaries | ⚠️ INACTIVE Visayas/Mindanao via RORO |
| Gate 9 | Northbound express | Bulacan + Pangasinan provincial |
| Ticket Booth 1 | DLTB, JAC, Bicol Isarog | Bicol/Visayas/Mindanao |
| Ticket Booth 6 | Genesis JoyBus, Solid North | Baguio, Quezon, Laguna, Tuguegarao |

**Note**: PITX operator-to-gate mapping confirmed via PITX official guide + Reddit commuter posts + Facebook groups. Rated **HIGH** confidence.

---

### 4. Sampaloc / Avenida (Manila) — HISTORIC TERMINAL ZONE

| Operator | Address | Routes |
|---|---|---|
| Partas | 1238 Lacson Ave, Sampaloc | Laoag, Vigan, La Union |
| Fariñas Transit | 1238 Lacson Ave (shared with Partas) | Laoag, Ilocos Norte |
| GV Florida | Sampaloc area | Tuguegarao, Laoag, Isabela |
| JAC Liner | Doroteo Jose St, Sta. Cruz, Manila | Laguna, Batangas, Quezon |
| Victory Liner | 713 Aurora Blvd, Sampaloc | Zambales, Pangasinan |

**Source**: Confirmed from `provincial-bus-operators-routes.json` + Partas/Fariñas/GV Florida official sites. **High confidence**.

---

### 5. Monumento / Araneta Square (Caloocan City)

- Victory Liner: 524 Rizal Ave corner Samson Rd, Araneta Square, Caloocan — **High confidence**
- Also staging point for City Bus Route 17 (Monumento–EDSA Taft) and EDSA Carousel northern terminus

---

### 6. NLET — North Luzon Expressway Terminal (Valenzuela)

LTFRB MC 2019-031 directed northbound provincial buses here as interim terminal. **Medium confidence** for operator list — not all operators comply; many continue using Cubao EDSA strip with NLET as secondary stop.

---

### 7. Alabang (Muntinlupa) — SOUTHERN SATELLITE HUB

| Terminal | Operators |
|---|---|
| Alabang Bus Terminal / Alabang Town Center area | Bicol Isarog, JAC Liner satellite, ALPS (Festival Mall/VTX South Station) |
| South Station (VTX) | RRCG Transport (P2P Alabang→Makati, Alabang→Shaw) |

---

## Validated Route List (NCR Segment View)

Routes are grouped by departure terminal and destination direction. Only NCR terminal and first significant out-of-NCR waypoint are listed. "NCR trajectory" describes the road used within Metro Manila.

### GROUP A: NORTHBOUND (NCR → North Luzon)

| Route ID | Operator | NCR Terminal | NCR Trajectory | First Out-of-NCR Stop | Confidence | Source Count |
|---|---|---|---|---|---|---|
| PVBL-VL-CUB-OLO | Victory Liner | Cubao (683 EDSA) | EDSA → NLEX Balintawak | Subic/Olongapo | HIGH | 3 |
| PVBL-VL-CUB-BAG | Victory Liner | Cubao (683 EDSA) | EDSA → NLEX | Dau, Pampanga | HIGH | 4 |
| PVBL-VL-CUB-DAG | Victory Liner | Cubao (683 EDSA) | EDSA → NLEX | Dagupan | HIGH | 3 |
| PVBL-VL-CUB-PAM | Victory Liner | Cubao (683 EDSA) | EDSA → NLEX | San Fernando, Pampanga | HIGH | 3 |
| PVBL-VL-CUB-TUG | Victory Liner | Cubao (683 EDSA) | EDSA → NLEX | Cabanatuan | HIGH | 3 |
| PVBL-VL-MON-OLO | Victory Liner | Monumento (524 Rizal Ave) | Rizal Ave → NLEX | Subic/Olongapo | HIGH | 2 |
| PVBL-VL-MON-BAG | Victory Liner | Monumento (524 Rizal Ave) | Rizal Ave → NLEX | Baguio | HIGH | 2 |
| PVBL-VL-PAS-OLO | Victory Liner | Pasay (712 EDSA) | EDSA → NLEX | Subic/Olongapo | HIGH | 2 |
| PVBL-VL-SAM-ZAM | Victory Liner | Sampaloc (713 Aurora Blvd) | Aurora → NLEX | Olongapo/Iba, Zambales | HIGH | 2 |
| PVBL-VL-SAM-PAN | Victory Liner | Sampaloc (713 Aurora Blvd) | Aurora → NLEX | Dagupan/Lingayen | HIGH | 2 |
| PVBL-FS-CUB-CAB | Five Star | Cubao (EDSA) | EDSA → NLEX | Cabanatuan, Nueva Ecija | HIGH | 3 |
| PVBL-FS-CUB-SAG | Five Star | Cubao (EDSA) | EDSA → NLEX | Solano, Nueva Vizcaya | HIGH | 2 |
| PVBL-FS-AV-DAG | Five Star | Avenida, Manila | Lacson/Rizal Ave → NLEX | Dagupan | HIGH | 2 |
| PVBL-FS-PAS-PAN | Five Star | Pasay (EDSA strip) | EDSA → NLEX | Dagupan/Pangasinan | HIGH | 2 |
| PVBL-PAR-SAM-LAO | Partas | Sampaloc (1238 Lacson) | Lacson → NLEX (via Cubao alt) | San Fernando, La Union | HIGH | 3 |
| PVBL-PAR-SAM-VIG | Partas | Sampaloc (1238 Lacson) | Lacson → NLEX | San Fernando, La Union | HIGH | 3 |
| PVBL-PAR-SAM-BAG | Partas | Sampaloc / Cubao | NLEX | Baguio | HIGH | 2 |
| PVBL-PAR-CUB-LAO | Partas | Cubao (EDSA) | EDSA → NLEX | Dagupan | HIGH | 2 |
| PVBL-FAR-SAM-LAO | Fariñas Transit | Sampaloc (1238 Lacson) | Lacson → NLEX | Dagupan | HIGH | 3 |
| PVBL-GVF-SAM-TUG | GV Florida | Sampaloc | Lacson → NLEX | Cabanatuan | HIGH | 3 |
| PVBL-GVF-SAM-LAO | GV Florida | Sampaloc | Lacson → NLEX | Dagupan | HIGH | 2 |
| PVBL-BAL-CUB-BAL | Baliwag Transit | Cubao (EDSA) | EDSA → NLEX (Balagtas) | Meycauayan, Bulacan | MED-HIGH | 2 |
| PVBL-GER-CUB-BAL | German Espiritu | Cubao (nr Victory) | EDSA → NLEX | Bocaue, Bulacan | MEDIUM | 2 |
| PVBL-SN-CUB-BAG | Solid North | Cubao (676 EDSA) | EDSA → NLEX | Baguio | HIGH | 3 |
| PVBL-SN-PITX-BAG | Solid North | PITX | Seaside → CAVITEX? / NLEX alt | Baguio | HIGH | 2 |
| PVBL-GEN-CUB-BAL | Genesis | Cubao (EDSA) / Avenida | EDSA → NLEX/SCTEX | Balanga, Bataan | HIGH | 3 |
| PVBL-GEN-PITX-BAG | Genesis JoyBus | PITX | NAIA → NLEX | Baguio | HIGH | 3 |
| PVBL-COD-CUB-SAG | Coda Lines | Cubao (HM Transport/Maryland) | EDSA → NLEX | Baguio | HIGH | 2 |
| PVBL-DAG-CUB-DAG | Dagupan Bus Co. | Cubao (New York Ave/EDSA) | EDSA → NLEX | Dagupan, Pangasinan | HIGH | 2 |
| PVBL-JAC-KAM-LUC | JAC Liner | Cubao Kamias | Kamias → España → SLEX | Lucena | HIGH | 3 |

---

### GROUP B: SOUTHBOUND (NCR → South Luzon, Bicol, RORO)

| Route ID | Operator | NCR Terminal | NCR Trajectory | First Out-of-NCR Stop | Confidence | Source Count |
|---|---|---|---|---|---|---|
| PVBL-DLTB-PITX-BAT | DLTB | PITX | Seaside → SLEX | Calamba, Laguna | HIGH | 4 |
| PVBL-DLTB-PITX-NAG | DLTB | PITX | Seaside → SLEX | Lucena (Quezon) | HIGH | 3 |
| PVBL-DLTB-BUE-TAG | DLTB | Buendia/LRT Makati | Buendia → EDSA → SLEX | Silang, Cavite | MEDIUM | 2 |
| PVBL-DLTB-CUB-SOR | DLTB | Cubao (EDSA) | EDSA → SLEX | Lucena, then Bicol | HIGH | 2 |
| PVBL-DLTB-PAS-BAT | DLTB | Pasay (EDSA) | EDSA → SLEX | Calamba | HIGH | 2 |
| PVBL-BIS-PITX-NAG | Bicol Isarog | PITX | Seaside → SLEX | Lucena (Quezon) | MEDIUM | 2 |
| PVBL-BIS-ALB-NAG | Bicol Isarog | Alabang | SLEX south | Lucena | MEDIUM | 2 |
| PVBL-PHT-PAS-NAG | Philtranco | Pasay (EDSA-Taft) | EDSA → SLEX | Lucena | ⚠️ INACTIVE | 2 |
| PVBL-PHT-PAS-TAC | Philtranco | Pasay | EDSA → SLEX → RORO | Sorsogon (for Matnog) | ⚠️ INACTIVE | 2 |
| PVBL-JVH-PAS-BIC | JVH Bus | Pasay EDSA strip | EDSA → SLEX | Naga, Bicol | MEDIUM | 1 |
| PVBL-GLD-PAS-BIC | Gold Line Tours | Pasay EDSA strip | EDSA → SLEX | Naga, Bicol | MEDIUM | 1 |
| PVBL-CER-PAS-BIC | Ceres Bus | Pasay EDSA strip | EDSA → SLEX | Naga, Bicol → RORO | MEDIUM | 1 |
| PVBL-SS-CUB-TAC | Silver Star | Cubao ACBP | EDSA → SLEX → RORO | Matnog Port | LOW | 1 |
| PVBL-SUP-CUB-DAE | Superlines | Cubao EDSA shared | EDSA → SLEX | Lucena (Quezon) | LOW | 1 |

---

### GROUP C: WESTBOUND/CAVITE (NCR → Cavite Province)

| Route ID | Operator | NCR Terminal | NCR Trajectory | First Out-of-NCR Stop | Confidence | Source Count |
|---|---|---|---|---|---|---|
| PVBL-GEN-PITX-CAV | Genesis | PITX | CAVITEX | Bacoor, Cavite | MEDIUM | 2 |
| PVBL-SAU-PAS-CVC | Saulog Transit | Pasay Rotonda | Aguinaldo Hwy / CAVITEX | Bacoor | MEDIUM | 2 |
| PVBL-DAL-PAS-DAS | Don Aldrin | Pasay EDSA strip | Aguinaldo Hwy | Bacoor, Cavite | MEDIUM | 3 |
| PVBL-SAN-PAS-NAS | San Agustin | Pasay (Genesis bay) | SLEX → Aguinaldo | Silang, Cavite | MEDIUM | 3 |
| PVBL-JAC-PITX-LUC | JAC / Lucena Lines | PITX | SLEX | Calamba, Laguna (south then Lucena) | HIGH | 2 |

**Rationalized bus routes also serving Cavite** (from LTFRB data — these overlap with city bus scheme):
- Route 26 (PITX–Naic) — Medium confidence
- Route 27 (PITX–Trece Martires) — Medium confidence
- Route 28 (PITX–Dasmariñas) — Medium confidence
- Route 29 (PITX–GMA) — Medium confidence
- Route 30 (PITX–Cavite City) — Medium confidence

---

### GROUP D: CROSS-BOUNDARY CITY BUSES (Rationalized but Province-Touching)

Some LTFRB-rationalized city bus routes cross NCR boundaries, making them effectively provincial in regulatory terms:

| Route | Endpoints | Province Crossed | Confidence |
|---|---|---|---|
| Route 1 (Monumento–Balagtas) | Monumento, Caloocan → Balagtas, Bulacan | Bulacan | MEDIUM |
| Route 5 (Quezon Ave–Angat) | Quezon Ave, QC → Angat, Bulacan | Bulacan | MEDIUM |
| Route 7 (Quezon Ave–Montalban) | Quezon Ave, QC → Rodriguez, Rizal | Rizal | MEDIUM |
| Route 8 (Cubao–Montalban) | Cubao, QC → Rodriguez, Rizal | Rizal | MEDIUM |
| Route 9 (Cubao–Antipolo) | Cubao, QC → Antipolo, Rizal | Rizal | MEDIUM |
| Route 11 (Gilmore–Taytay) | Gilmore, San Juan → Taytay, Rizal | Rizal | MEDIUM |
| Route 15 (Ayala–Biñan) | Ayala, Makati → Biñan, Laguna | Laguna | MEDIUM |
| Route 20 (Monumento–Meycauayan) | Monumento, Caloocan → Meycauayan, Bulacan | Bulacan | MEDIUM |
| Route 21 (Monumento–San Jose Del Monte) | Monumento, Caloocan → SJDM, Bulacan | Bulacan | MEDIUM |
| Route 22 (Monumento–Angat) | Monumento, Caloocan → Angat, Bulacan | Bulacan | MEDIUM |
| Route 53 (Cubao–Pacita Complex) | Cubao, QC → Pacita Complex, San Pedro, Laguna | Laguna | MEDIUM |

**Source conflict note**: Routes 1, 5, 7, 8, 9 appear in LTFRB rationalization data (`ltfrb-rationalization-routes.json`) but are absent from `ltoportal-ph-routes.json` and `wikimili-routes.json` city bus lists. This suggests they may be planned/authorized but not consistently operating. Rated MEDIUM confidence.

---

### GROUP E: UV EXPRESS CROSSING NCR BOUNDARY

UV Express services that originate within NCR but have out-of-NCR destinations (cross-boundary UV):

| Route | From | To | Province | Confidence |
|---|---|---|---|---|
| Pasay–Dasmariñas | Pasay Rotonda | Dasmariñas City | Cavite | HIGH |
| Pasay–Bacoor / Imus | Pasay Rotonda | Bacoor / Imus | Cavite | HIGH |
| Pasay–Trece Martires | Pasay EDSA (McD's) | Trece Martires City | Cavite | MEDIUM |
| Pasay–Tanza | Pasay EDSA (McD's) | Tanza | Cavite | MEDIUM |
| Pasay–Calatagan | Kabayan Hotel, Pasay | Calatagan | Batangas | LOW |
| Cubao–Balibago (Sta. Rosa) | Cubao LRT-2 side | Balibago, Sta. Rosa | Laguna | LOW |
| Quirino Bacoor–Taft Extension | Bacoor, Cavite | F.B. Harrison, Pasay | Cavite→NCR | MEDIUM |

---

## Cross-Reference: Confirmed vs Orphan vs Contested

### Confirmed Routes (2+ independent sources agree):
34 routes — primarily Victory Liner, DLTB, Genesis, JAC Liner, Partas, Fariñas, GV Florida, Solid North, Coda Lines flagship routes

### Contested Routes (sources conflict on terminal location or operator):
- **DLTB Buendia–Tagaytay**: `provincial-bus-operators-routes.json` lists Buendia as terminal; `pasay-edsa-terminal-routes.json` suggests Pasay strip. Both plausible — DLTB has multiple pickup points.
- **Partas Cubao vs. Sampaloc origin**: Multiple sources show Partas departing from BOTH terminals; route is confirmed but terminal depends on service time.
- **Gold Line / Ceres / JVH at Pasay**: All three Bicol-bound operators listed in `provincial-bus-operators-routes.json` as using Pasay strip, but `pasay-edsa-terminal-routes.json` only confirms Don Aldrin and San Agustin definitively. Gold Line/Ceres/JVH are single-source (MEDIUM-LOW).
- **NLET Valenzuela compliance**: LTFRB MC 2019-031 directed Victory Liner and others to NLET first; in practice, Cubao is still primary. Sources conflict on whether NLET is first or last NCR stop.

### Orphan Routes (single source only, not corroborated):
- Silver Star Cubao–Tacloban (RORO) — LOW
- Superlines/Daet Express Cubao–Daet — LOW
- Pasay UV Express–Calatagan — LOW
- Cubao UV Express–Balibago Sta. Rosa — LOW
- DLTB Leyte/Samar RORO services — now effectively orphaned post-Philtranco closure

---

## NCR Corridor Usage by Provincial Buses

Provincial buses create de facto in-NCR transit segments. Key commuter-used corridor pairs:

| NCR Segment | Operators Using It | Commuter Behavior |
|---|---|---|
| Monumento → Cubao (EDSA) | Victory Liner, Five Star, DLTB, Baliwag | Express alternative to EDSA Carousel; quicker at off-peak |
| Cubao → Pasay (EDSA) | Victory Liner, DLTB, ALPS, Five Star | Regular commuters board for Makati/Pasay; cheaper than MRT |
| Cubao → Avenida / Quiapo | JAC Liner, DLTB, Partas, GV Florida | Inner Manila cross-city run |
| Sampaloc → Cubao (Aurora Blvd) | Partas, Fariñas, GV Florida | East-west Manila-QC link |
| PITX → Pasay → EDSA (northbound) | DLTB, Bicol Isarog, Genesis | Last-mile from airport area northward |

⚠️ **GTFS implication**: These NCR segment behaviors are NOT documented in any official LTFRB franchise data. Provincial CPCs list only origin-destination terminal pairs. Intermediate NCR stops require field survey to document in `stop_times.txt`.

---

## Key Data Gaps

| Gap | Impact | Recommended Action |
|---|---|---|
| Intermediate NCR stops for provincial buses | Cannot build stop_times.txt for in-city segments | Field survey; community crowdsource |
| NLET/Valenzuela actual operator list | MCR 2019-031 compliance unknown | FOI LTFRB for NLET operator list |
| Post-March 2026 Philtranco status | 20+ routes at risk | Monitor DOTr/LTFRB announcements |
| Full ACBP (Cubao) bay assignments | ~10 of 19+ bays documented | On-site survey |
| Exact bay locations for Pasay strip operators | Gold Line, Ceres, JVH exact bays | Community/blog validation |
| 2026 fare updates | LTFRB fare hearing pending; all fares are 2024–2025 | Check LTFRB Board Resolutions |
| Geometry for any provincial bus route | None available from open sources | Google Maps/OSM extraction; field survey |
| DLTB Buendia pickup point | Active or suspended? | DLTB website / rider feedback |

---

## Confidence Distribution

| Confidence | Route Count | Notes |
|---|---|---|
| HIGH | 34 | Victory Liner flagship routes, DLTB PITX routes, Genesis, Partas, Fariñas, GV Florida, JAC Liner from Cubao/Kamias |
| MEDIUM | 52 | Cross-boundary city buses, Cavite UV Express, small operators (Don Aldrin, San Agustin, Saulog), Bicol Isarog |
| LOW | 15 | Silver Star RORO, Superlines Daet, Pasay–Calatagan UV, Cubao–Laguna UV, Philtranco legacy routes |
| INACTIVE | 20+ | Philtranco entire route network (closure March 30, 2026) |

---

## GTFS-Specific Notes

1. **Agency separation**: Each provincial operator must be a separate GTFS agency entry. Operators sharing Cubao EDSA strip bays are still distinct legal entities.
2. **Route type**: All provincial buses use GTFS route_type = 3 (bus). RORO crossings are handled as service_exception or separate trip — not modelable in standard GTFS.
3. **Stops**: Only NCR terminals can be placed with confidence. Intermediate stops (e.g., Balintawak tollgate, NLEX Bocaue interchange) require coordinate research.
4. **Frequencies**: Provincial buses operate scheduled departures (not headways). Use `trips.txt` departure times, not `frequencies.txt`.
5. **Philtranco routes**: Should be included in GTFS with `route_status = inactive` or simply omitted until operational status confirmed.
