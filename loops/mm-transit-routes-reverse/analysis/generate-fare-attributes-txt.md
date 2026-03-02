# GTFS fare_attributes.txt and fare_rules.txt — Generation Notes

**Aspect**: Wave 3 GTFS Synthesis — fare_attributes.txt and fare_rules.txt
**Date**: 2026-03-02
**Sources**: `ltfrb-fare-matrices.md`, `validated-fare-integration-analysis.md`, `p2p-bus-operators.md`, `routes.txt`

---

## Summary

Generated `fare_attributes.txt` (82 rows, 41 fare IDs + 41 discounted variants) and `fare_rules.txt` (858 rows, one per route in routes.txt). All Metro Manila modes are represented.

**Key finding**: Metro Manila has **no fare integration** — every boarding triggers a new minimum fare. `transfers=0` is correct for all modes. Discounted fares (20% for land transport, 50% for rail SC/PWD/Student) are included in `fare_attributes.txt` as parallel entries with `_DISC` suffix, but are **not linked in `fare_rules.txt`** since they require manual ID verification and are not automatically applied at point of payment.

---

## Fare Structure by Mode

### Rail (LRT-1, LRT-2, MRT-3)

| fare_id | Price (PHP) | Payment | Notes |
|---------|------------|---------|-------|
| LRT1 | ₱13.00 | Pre-board (Beep card gate) | Min fare; actual fare is distance-based up to ~₱56 E2E |
| LRT1_DISC | ₱6.50 | Pre-board (white/yellow Beep) | 50% SC/PWD/Student via special Beep card (as of Jul/Sep 2025) |
| LRT2 | ₱13.00 | Pre-board | Max ~₱35 Recto–Antipolo |
| LRT2_DISC | ₱6.50 | Pre-board | 50% discount |
| MRT3 | ₱13.00 | Pre-board | Max ~₱28 North Ave–Taft |
| MRT3_DISC | ₱6.50 | Pre-board | 50% discount |
| PNR_MIN | ₱15.00 | Pre-board | SUSPENDED; placeholder for NSCR resumption |

**payment_method=1** (pre-board) for all rail: Beep card tap before turnstile is mandatory.

### EDSA Busway Carousel (BRT)

| fare_id | Price (PHP) | Notes |
|---------|------------|-------|
| EDSA_CAR | ₱15.00 | Min fare; max ₱75.50 (Monumento↔PITX southbound) |
| EDSA_CAR_DISC | ₱12.00 | 20% SC/PWD/Student per RA 9994/10754/11314 |

**payment_method=0** (on board): cash, Beep card, GCash (Dec 2025 QR rollout on 226/751 buses).

### Public Utility Jeepney (PUJ)

| fare_id | Price (PHP) | Applicable Routes | Notes |
|---------|------------|------------------|-------|
| JEEP_TRAD | ₱13.00 | 477 routes (yellow FDB913) | Min fare (first 4 km); ₱1.80/km after — LTFRB MC 2023-038 |
| JEEP_TRAD_DISC | ₱10.40 | — | 20% manual discount |
| JEEP_MOD | ₱15.00 | 126 routes (orange F47920 / gold C8A200) | Min fare (first 4 km); ₱2.20/km after |
| JEEP_MOD_DISC | ₱12.00 | — | 20% manual discount |

**Route color mapping used**: FDB913 (yellow) → JEEP_TRAD; F47920 (orange) or C8A200 (gold) → JEEP_MOD.

**Known flat fares (representative, not modeled as individual GTFS fare_ids)**:
- BF Parañaque–Ayala: ₱40 → JEEP_TRAD used as base
- Pembo–Ayala: ₱8 (short loop — well within JEEP_TRAD)
- Marikina River Bank–Galleria: ₱14 (short; Makati Loop E-Jeep charges ₱14 flat → mapped JEEP_MOD)
- SM Fairview–TM Kalaw: ₱43 (UV Express, not jeepney)

### City Bus (PUB)

| fare_id | Price (PHP) | Applicable Routes | Notes |
|---------|------------|------------------|-------|
| BUS_ORD | ₱13.00 | (documented; few remaining ordinary buses in NCR) | Min 5 km; ₱2.25/km after |
| BUS_ORD_DISC | ₱10.40 | — | 20% discount |
| BUS_AC | ₱15.00 | 76 routes (LTFRB_BUS + GETPH + MMBC + MALTC + JACLN) | Min 5 km; ₱2.65/km after — dominates NCR fleet |
| BUS_AC_DISC | ₱12.00 | — | 20% discount |

**76 routes assigned BUS_AC** includes: 67 LTFRB_BUS numbered routes (2–68, PNR1/2), 2 MMBC city bus routes, 2 MALTC routes, 1 JACLN route, 4 GETPH Love Bus routes. This also includes P2P-ML-001, P2P-ML-002, and P2P-NDL-001 which are nominally P2P routes but have LTFRB_BUS agency — they are assigned BUS_AC as conservative placeholder.

### UV Express (UVE)

| fare_id | Price (PHP) | Applicable Routes | Notes |
|---------|------------|------------------|-------|
| UV_BASE | ₱13.00 | 114 routes | Base fare (first 4 km); ₱1.80/km after; in practice flat fares per route |
| UV_BASE_DISC | ₱9.60 | — | Per LTFRB UVE Fare Guide Nov 2024 |

**Actual route flat fares** (from ltfrb-fare-matrices.md) vary widely (₱8 to ₱57 documented). UV_BASE (₱13) represents the minimum fare. Routing engines should note the actual flat fare is higher for longer UV Express routes.

### BGC Bus

| fare_id | Price (PHP) | Routes | Notes |
|---------|------------|--------|-------|
| BGC_MIN | ₱12.00 | 12 routes (BGC-*) | Flat fare ₱12–₱30; ₱12 is minimum |
| BGC_DISC | ₱9.60 | — | 20% discount |

### Free Services

| fare_id | Price (PHP) | Routes | Notes |
|---------|------------|--------|-------|
| FREE | ₱0.00 | 14 routes | QCityBus (8), UP Ikot/Toki/campus (5), LRT1-FEEDER-REDEMPTORIST-AYALAMB (1 free shuttle) |

`transfers=''` (empty/unlimited) for FREE since no fare applies at any transfer.

### Premium P2P Buses

Individual fare IDs created for 29 P2P routes with verified fares:

| Operator | Routes | Fare Range | fare_id Pattern |
|----------|--------|-----------|----------------|
| RRCG Transport | 7 routes | ₱90–₱160 | P2P_RRCG_001–007 |
| HM Transport | 4 routes | ₱100–₱200 | P2P_HM_001–004 |
| UBE Express | 7 routes | ₱50–₱300 | P2P_UBE_001–007 |
| Delta Neosolutions | 2 routes | ₱100 | P2P_DNS_001–002 |
| MetroExpress | 4 routes | ₱50–₱100 | P2P_MEX_001–004 |
| Saint Rose Transit | 3 routes | ₱200 | P2P_SRT_001–003 |
| COMET Bus (GETPH) | 2 routes | ₱100 | P2P_COMET_001–002 |

**P2P_BASE** (₱100 placeholder) used for 5 routes with unverified fares: BUS-10 (HMTRANS Ayala–Alabang), P2P-PG-001 (PGTS SM North↔Bulacan ₱70), P2P-SAT-001 (San Agustin Cavite, varies), P2P-GEN-001 (Genesis Clark ₱280), P2P-ALPS-001 (ALPS Batangas–BGC ₱250–380). Note: ₱100 significantly underestimates Genesis (₱280) and ALPS (₱250–380) fares — update when confirmed.

---

## Discount Framework in GTFS

Metro Manila uses **two discount tiers** as of 2025–2026:

| Mode | Discount | Basis |
|------|---------|-------|
| LRT-1, LRT-2, MRT-3 | **50%** | White (Student) / Yellow (SC/PWD) Beep card; automatic at gate |
| All other LTFRB-regulated modes | **20%** | Show government ID to conductor/driver; manual adjustment |

**Implementation choice**: Discounted fare_ids (`_DISC` suffix) are included in `fare_attributes.txt` for reference but are NOT added to `fare_rules.txt`. Rationale: GTFS fare_rules matching selects the lowest-priced applicable fare for a journey — adding _DISC rows for every route would cause all journeys to show the discounted price regardless of rider type. Routing engines requiring concessionary fare modeling should apply a 50% multiplier for rail or 80% multiplier for road modes at the journey-computation layer.

---

## fare_rules.txt Assignment Summary

| Fare Group | Routes | Notes |
|-----------|--------|-------|
| JEEP_TRAD | 477 | Yellow-route LTFRB_PUJ |
| JEEP_MOD | 126 | Orange/gold-route LTFRB_PUJ |
| UV_BASE | 114 | All LTFRB_UV |
| BUS_AC | 76 | LTFRB_BUS + GETPH + others |
| FREE | 14 | QCityBus + UP campus + 1 free shuttle |
| BGC_MIN | 12 | All BGCBUS routes |
| P2P routes | 39 | 29 specific + 5 P2P_BASE + 5 others from RRCG/HMTRANS/DNS defaults |
| Rail/BRT | 4 | LRT1, LRT2, MRT3, EDSA_CAR |
| PNR | 1 | Suspended placeholder |
| **TOTAL** | **858** | One row per route_id |

---

## Known Limitations

1. **Distance-based fares not modeled**: GTFS v1 doesn't natively support per-km fare computation. All fares represent minimum (boarding) amounts. Journeys longer than the base distance incur higher actual fares not reflected in the GTFS.

2. **UV Express flat fares**: In practice each UV route has an LTFRB-approved flat fare. Only ~25 route-specific flat fares are documented (from ltfrb-fare-matrices.md). All 114 UV routes use UV_BASE (₱13) as placeholder — actual average is closer to ₱25–₱40.

3. **BGC Bus progressive pricing**: BGC Bus charges ₱12–₱30 depending on distance within BGC. Only minimum modeled.

4. **P2P_BASE underestimates**: Genesis Clark (₱280) and ALPS Batangas (₱250–380) routes are grossly underestimated by P2P_BASE (₱100). Update on confirmation.

5. **PNR suspended**: `PNR_MIN` is a placeholder; when NSCR opens, fare structure will differ significantly.

6. **EDSA Carousel full matrix**: A 22×22 stop-pair fare table exists (from edsacarousel.com). GTFS v1 `fare_rules.txt` can model origin/destination pairs using zone IDs, but this requires stops.txt to have zone_id populated. Not implemented in this pass; the minimum fare (₱15) is used.

---

## Sources

- `analysis/ltfrb-fare-matrices.md` — fare rates for all modes (LTFRB MC 2023-038, UVE Fare Guide Nov 2024)
- `analysis/validated-fare-integration-analysis.md` — transfer rules, payment methods, discount framework
- `analysis/p2p-bus-operators.md` — P2P operator-specific fares
- `analysis/gtfs/routes.txt` — 858 routes; agency_id and route_color used for fare assignment
- `analysis/makati-loop-shuttle.md` — Makati E-Jeep ₱14 flat fare (mapped to JEEP_MOD)
