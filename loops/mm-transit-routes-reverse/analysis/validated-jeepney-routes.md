# Validated Jeepney Routes — Metro Manila Master List

**Aspect**: All jeepney routes — deduplicated master list, confidence scores, gap analysis
**Wave**: 2 (Cross-Reference & Validation)
**Date**: 2026-03-01
**Input files**: 38 raw JSON sources containing jeepney-mode routes

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Raw jeepney route entries (all sources) | 663 |
| **Deduplicated canonical routes** | **609** |
| High confidence (2+ sources or authoritative single) | 216 (35%) |
| Medium confidence | 348 (57%) |
| Low confidence | 45 (7%) |
| Routes with geometry available | 22 (4%) |
| Routes confirmed by 2+ independent sources | 49 |
| Routes confirmed by 3+ sources | 4 |
| Modern PUJ (electric/euro 6) routes | ~105 (tagged) |
| LTFRB official franchise entries | 96 |
| Cross-boundary routes (NCR + province) | 67 |

**Deduplication method**: Grouped first by `route_id` (canonical), then by normalized route name for unnamed/no-ID entries. Source priority: LTFRB > OSM > Sakay.ph > Komyut > JICA > academic/community.

---

## Source Contribution Breakdown

| Source | Jeepney Routes |
|--------|---------------|
| LTFRB franchise database | 96 |
| Other major terminals (Divisoria, Quiapo, Lawton, etc.) | 42 |
| LTFRB modernization program | 35 |
| MRT-3 feeder routes | 33 |
| LRT-2 feeder routes | 31 |
| Validated corridor files (reprocessed) | ~130 |
| Baclaran terminal | 25 |
| Cubao terminal | 23 |
| LRT-1 feeder routes | 23 |
| Pasay/EDSA terminal | 22 |
| Sakay.ph | 18 |
| Fairview terminal | 17 |
| Academic sources (DLSU/JICA/OSM) | ~25 |
| Community (Facebook/Reddit/YouTube) | ~15 |

---

## Confidence Score Distribution

### High Confidence (216 routes, 35%)
Routes with 2+ independent source confirmations, or from authoritative sources (LTFRB franchise DB, OSM with geometry, Sakay.ph with confirmed URL).

**Top multi-source confirmed routes:**

| Route | Sources | Notes |
|-------|---------|-------|
| Munoz – Remedios | 4 | Multiple terminal + feeder sources |
| Baclaran–NAIA/Baltao | 3 | OSM + terminal + LTFRB |
| Recto – Roxas District | 3 | Feeder routes + terminal |
| Antipolo – EDSA/Shaw Blvd (T290) | 3 | OSM T290 (16.3 km) + Sakay + corridor |
| Baclaran–Blumentritt via Mabini, Sta. Cruz | 2 | OSM Relation 11541968 + terminal |
| Baclaran–Zapote (Las Piñas) | 2 | Terminal + corridor |
| Baclaran–SM Mall of Asia via Coastal Road | 2 | Corridor + terminal |
| Alabang–Baclaran via Coastal Road | 2 | Southern MM + terminal |
| Guadalupe (ABC) – Taguig | 2 | BGC/Taguig + Makati validated |
| Ayala – Guadalupe (Ibabaw) | 2 | Makati validated + Mandaluyong |

### Medium Confidence (348 routes, 57%)
Single authoritative source (LTFRB franchise DB alone, Sakay URL confirmed, terminal documentation) or 2 lower-quality sources.

### Low Confidence (45 routes, 7%)
Single community source, academic approximation, or JICA historical data (pre-2022).

**Major low-confidence sources:**
- DLSU/Ateneo/UST academic papers (Routes 201, 302, 305, 311, 414 — route number only, no stop detail)
- JICA historical routes (JICA-JPN-001 through JICA-JPN-280) — 2014 survey data, many superseded by rationalization
- Fairview terminal estimates where Sakay URL unconfirmed

---

## Geographic Coverage by City

| City | Total Routes | High | Medium | Low | Coverage Assessment |
|------|-------------|------|--------|-----|---------------------|
| Manila (city) | 153 | 61 | 87 | 5 | **Strong** — Divisoria, Quiapo, Recto hubs well documented |
| Quezon City | 102 | 40 | 57 | 5 | **Good** — Cubao, Fairview, Commonwealth corridors covered |
| Pasay | 77 | 31 | 41 | 5 | **Good** — EDSA/Taft/Baclaran terminus well documented |
| Caloocan | 66 | 27 | 33 | 6 | **Good** — Monumento and MacArthur corridors documented |
| Mandaluyong | 48 | 14 | 29 | 5 | **Good** — Shaw/EDSA covered, Wack-Wack area lighter |
| Parañaque | 43 | 19 | 22 | 2 | **Adequate** — Baclaran/PITX well covered, inner barangays sparse |
| Pasig | 38 | 6 | 31 | 1 | **Adequate** — Ortigas area OK, eastern Pasig (Rosario, Floodway) sparse |
| Taguig | 33 | 12 | 19 | 2 | **Adequate** — BGC/Hagonoy covered; western Taguig sparser |
| Makati | 30 | 7 | 22 | 1 | **Moderate** — Ayala/CBD covered; residential barangays thin |
| Marikina | 25 | 12 | 13 | 0 | **Adequate** — Aurora Blvd and Marcos Hwy routes documented |
| Valenzuela | 15 | 7 | 8 | 0 | **Moderate** — MacArthur Hwy covered; industrial Valenzuela sparse |
| Muntinlupa | 14 | 8 | 5 | 1 | **Moderate** — Alabang hub documented; Sucat/Bicutan thinner |
| Malabon | 13 | 7 | 6 | 0 | **Moderate** — Divisoria corridor OK; Malabon proper sparse |
| Navotas | 13 | 8 | 5 | 0 | **Moderate** — M. Naval/Divisoria corridor documented |
| Las Piñas | 8 | 1 | 5 | 2 | **Weak** — Only Zapote–Baclaran, BF Homes area; Pamplona, Pulang Lupa underdocumented |
| Pateros | 8 | 4 | 4 | 0 | **Moderate** — Small city, main routes covered |
| San Juan | 6 | 1 | 5 | 0 | **Weak** — Heavily pass-through; Cubao–San Juan and EDSA routes captured but internal routes missing |

---

## Terminal Hub Coverage

| Terminal | Jeepney Routes Documented |
|----------|--------------------------|
| Cubao / Araneta / Gateway | 75 |
| Divisoria | 46 |
| Baclaran / LRT-1 Terminus | 46 |
| Quiapo / LRT Carriedo | 36 |
| Monumento / Victory Liner | 36 |
| Fairview (SM Fairview area) | 27 |
| Alabang | 21 |
| PITX (Parañaque Integrated Terminal) | 14 |
| SM North EDSA | 8 |

---

## Modern PUJ Routes

Approximately 105 routes in the canonical list are tagged as modern PUJ (electric or Euro 6 modern jeepneys) from the LTFRB modernization program. Key examples:

| Route | Operator / Notes |
|-------|-----------------|
| Novaliches – Malinta (Valenzuela) | Consolidated modernization route |
| Bagumbayan Taguig – Pasig | Modern PUJ replacing traditional |
| Fort Bonifacio Gate 3 – Guadalupe/Market Market | BGC inner-loop modernized |
| EDSA Buendia – Mandaluyong City Hall | Short cross-city connector |
| Pandacan – Leon Guinto | Manila inner-city modern route |
| Quezon Ave – LRT 5th Avenue Station | Rail feeder modern jeep |
| Cubao (Diamond) – Roces Super Palengke | Short QC modernized route |
| SM Fairview – Commonwealth via Regalado | Commonwealth corridor modern PUJ |
| Divisoria – Gasak (Caloocan) | Caloocan modernized corridor |
| Punta – Quiapo | Manila inner modernized |

---

## Geometry Availability

Only 22 of 609 routes (3.6%) have any geometry source:

| Route | Geometry Source |
|-------|----------------|
| T378: Baclaran–Blumentritt via Mabini/Sta. Cruz | OSM Relation 11541968 (136 members) |
| Antipolo – EDSA/Shaw Blvd (T290) | OSM T290 (16.3 km) |
| SM Fairview–Commonwealth (Modern PUJ) | Sakay Route Explorer polyline |
| Bagong Silang–SM Fairview | Sakay Route Explorer polyline |
| Norzagaray–SM Fairview (cross-boundary) | Sakay Route Explorer polyline |
| Hulo – P. Victorino/Kalentong | sakayph/gtfs shapes.txt |
| A. Bonifacio – A. Mabini via 10th Ave | sakayph/gtfs shapes.txt |
| A. Bonifacio – E. Rodriguez via D. Tuazon | sakayph/gtfs shapes.txt |
| A. Luna – Libertad | sakayph/gtfs shapes.txt |
| EDSA/Shaw Central – Tipas (Taguig) | Sakay.ph polyline |
| Cubao – Sta. Lucia (Pasig) via C5 | Sakay.ph polyline |
| Cubao – Rosario (Pasig) via Santolan | Sakay.ph polyline |
| EDSA/Shaw Central – Morong, Rizal | Sakay.ph polyline |
| SM North EDSA–Katipunan via Tandang Sora | OSM relation 4515958 (marked disused) |
| LTFRB bulk set (349–600+ routes) | Sakay.ph simplified polylines (low detail) |

**The extreme geometry gap (96.4% without shape data) is the primary obstacle to GTFS synthesis.**

---

## Cross-Boundary Routes (NCR + Province)

67 routes extend beyond Metro Manila into adjacent provinces:

| Province | Route Count | Key Examples |
|----------|------------|-------------|
| Rizal | ~25 | Antipolo–EDSA/Shaw, Montalban/Rodriguez–Cubao, Angono–Cubao |
| Cavite | ~20 | Bacoor–Baclaran, Dasmariñas–Baclaran via Coastal, Las Piñas–Cavite City |
| Bulacan | ~15 | Muzon (San Jose del Monte)–Cubao, Norzagaray–SM Fairview |
| Laguna | ~7 | Biñan/Sta. Rosa–Alabang, Calamba–Baclaran via Coastal |

Cross-boundary routes are documented but **LTFRB NCR jurisdiction ends at city limits** — provincial portions may have separate franchise holders.

---

## Gap Analysis

### Known Coverage Gaps

**1. Las Piñas internal routes**
- Only 8 routes documented (primarily Zapote–Baclaran corridor)
- Missing: Pamplona–Baclaran, Pulang Lupa–Alabang, BF Homes internal loops
- Confidence: Low on existing, many routes likely missing entirely

**2. San Juan internal routes**
- San Juan is mostly served by pass-through routes (EDSA, Shaw, Ortigas)
- Internal barangay-level routes (Pinaglabanan, Little Baguio, Hemady) not documented
- Only 6 routes captured vs estimated 15–20 actual routes

**3. Makati residential routes**
- Ayala CBD and Guadalupe documented; Rizal Ave, Olympia, Poblacion, Palanan barangay routes sparse
- Many short loops likely replaced by jeepney modernization consolidation

**4. Eastern Pasig (Rosario, Floodway, Palatiw)**
- Ortigas Avenue and C5 corridor covered; Eastern Pasig access routes thin
- Estimated 8–12 missing routes to Angono/Taytay area

**5. Valenzuela industrial zone**
- MacArthur Highway corridor documented; MWSS/Maysan/Karuhatan industrial feeder routes missing
- Some routes may have been discontinued under COVID-era rationalization

**6. Caloocan southern (Samson area)**
- Monumento and MacArthur corridor strong; C-3 Road / Samson Road routes sparse
- EDSA Caloocan exits (EDSA/Camarin, EDSA/A. Mabini) thinner than expected

**7. University Belt (near-complete but uncertain)**
- España, Recto, Quiapo routes documented but some Campus-to-Campus micro-routes (FEU/CEU/MLQU loops) likely missing

**8. Geometry data**
- Only 22/609 routes (3.6%) have geometry — this is the critical gap for GTFS synthesis
- Most Sakay.ph shapes are simplified polylines without per-stop coordinates
- No geometry at all for Fairview, Valenzuela, Malabon, Navotas corridors

### Orphan Routes (Single Source, Low Confidence)

Routes that appear in only one community/academic source with no cross-validation:
- Route numbers 201, 302, 305, 311, 414 from DLSU thesis (route numbers only, no endpoint detail)
- JICA 2014 historical routes (JICA-JPN series) — many likely rationalized out of existence
- Some Fairview terminal routes where Sakay URL unconfirmed

---

## Confidence Score Summary

### Method
- **High**: 2+ independent sources agree on origin/destination, OR single authoritative source (LTFRB franchise DB with route code, OSM with geometry, Sakay.ph with confirmed route URL)
- **Medium**: Single authoritative source (terminal documentation, LTFRB moderniazation list) without cross-validation; OR 2 community sources agree
- **Low**: Single community source (Facebook/Reddit), JICA historical, academic route number without detail

### Result
- 35% high confidence — reliable for routing
- 57% medium confidence — usable with caveats
- 7% low confidence — needs field validation before use

---

## Deduplicated Master Route List (High Confidence Sample)

The full 609-route canonical list is in `raw/canonical-jeepney-routes.json`.

Below is a representative sample of high-confidence routes by area:

### Manila
- Baclaran–Divisoria via Taft (DOTR:R_SAKAY_PUJ_1607)
- Baclaran–Blumentritt via Mabini & Santa Cruz (T378, OSM confirmed)
- Recto–Roxas District (3 sources)
- Munoz–Remedios (4 sources)
- Punta–Quiapo (Barbosa) (2 sources)

### Quezon City
- SM Fairview–Commonwealth via Regalado (modern PUJ, geometry)
- Bagong Silang–SM Fairview (Sakay confirmed)
- Cubao–Roces Super Palengke (modernization route)
- Quezon Ave–LRT 5th Avenue Station (rail feeder modern)

### Mandaluyong / Shaw
- Antipolo–EDSA/Shaw Blvd (T290, OSM + Sakay + corridor, 16.3 km)
- EDSA/Shaw Central–Tipas, Taguig (Sakay geometry)
- EDSA Buendia–Mandaluyong City Hall (modernization)
- Ayala–Guadalupe (Ibabaw) (2 sources)

### Southern Metro Manila
- Alabang–Baclaran via Coastal Road (2 sources)
- Baclaran–SM Mall of Asia via Coastal Road (2 sources)
- Baclaran–Sucat/SSH via Benigno Aquino Avenue (2 sources)
- Alabang–Carmona (Sakay geometry, cross-boundary)

### Northern Metro Manila
- Monumento–Valenzuela via MacArthur Highway (LTFRB)
- Navotas–Divisoria via Monumento, Rizal Ave (LTFRB)
- Divisoria–Gasak, Caloocan (modernization)
- Malabon–Divisoria (Rizal Ave corridor)

---

## Recommendations for GTFS Synthesis

1. **Prioritize 216 high-confidence routes** for Wave 3 GTFS generation — these can be synthesized from stop data and road network geometry
2. **Flag 45 low-confidence routes** as `confidence_level=low` in GTFS notes; exclude from default routing unless validated
3. **Geometry gap is critical**: Need to use OSM road network to estimate shapes for ~587 routes without polyline data
4. **Modern PUJ routes** (~105) should use separate `route_type` or color coding in GTFS to distinguish from traditional jeepneys
5. **Cross-boundary routes** (67): Document only the NCR portion for GTFS; add note about provincial extension
6. **Orphan low-confidence routes**: Consider a separate `provisional` GTFS feed rather than including in main validated feed
7. **Las Piñas and San Juan** need dedicated research pass (Wave 1 additions) if complete coverage required

---

## Files

- `raw/canonical-jeepney-routes.json` — 609-route deduplicated master list with source tracking
- Related analysis: `analysis/validated-manila-city-proper.md`, `analysis/validated-quezon-city.md`, etc. (by-city validations)
- Related analysis: `analysis/validated-edsa-corridor.md`, etc. (by-corridor validations)
