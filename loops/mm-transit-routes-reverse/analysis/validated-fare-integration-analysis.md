# Fare Integration Analysis — Metro Manila Transit

**Aspect**: Wave 2 Validation — Fare integration analysis (where transfers require separate fares vs integrated payment)
**Date analyzed**: 2026-03-01
**Method**: Synthesis of ltfrb-fare-matrices.md, edsa-busway-system.md, p2p-bus-operators.md, validated-rail-to-road-transfer-mapping.md; supplemented by web research on AFCS status, Beep card coverage, and 2025 payment reforms.

---

## Executive Summary

**Metro Manila has no fare integration across modes.** Every transfer between a rail line and a bus/jeepney — or between two rail lines — requires a separate fare payment. The Beep card creates a *common payment medium* for rail, EDSA Carousel, and select modern PUVs, but does not reduce the fare charged; no transfer discount or combined-journey pricing exists.

2025 saw significant payment system improvements (GCash on MRT-3 and EDSA Busway, student 50% discount Beep cards), but these expand payment method choice, not fare integration. As of March 2026, the overarching AFCS framework is in flux: the original AF Payments concession expired in 2025 without a confirmed replacement, leaving the system operational but transitionally uncertain.

---

## 1. Rail-to-Rail Transfers: Separate Fares, Shared Card

### Active Rail-to-Rail Interchange Points

| Interchange | Lines | Physical Connection | Min Transfer Time | Fare Treatment |
|-------------|-------|---------------------|-------------------|----------------|
| **Doroteo Jose ↔ Recto** | LRT-1 ↔ LRT-2 | Covered elevated walkway (~113 m) | ~3 min | **Separate fares** — two Beep card taps |
| **Taft/EDSA ↔ Taft Ave** | LRT-1 ↔ MRT-3 | Footbridge + Metro Point Mall (~400 m) | ~5 min | **Separate fares** — two Beep card taps |
| **Araneta-Cubao LRT-2 ↔ MRT-3** | LRT-2 ↔ MRT-3 | Gateway/Farmer's Plaza walkway (~400 m) | ~8 min | **Separate fares** — two Beep card taps |

**Key finding**: The Beep card (AF Payments Inc.) is accepted at all three rail systems, so the *medium* is shared but the *fare* is not. Exiting LRT-1 at Doroteo Jose triggers a fare deduction; boarding LRT-2 at Recto triggers another. No transit authority has implemented a rail-to-rail transfer discount as of 2026.

### Rail Fare Ranges (2025–2026)

| Line | Minimum Fare | Maximum Fare (E2E) | Discounted Min (50%)* |
|------|-----------|--------------------|----------------------|
| LRT-1 | ₱13 | ~₱56 | ₱10 |
| LRT-2 | ₱13 | ~₱35 | ₱8 |
| MRT-3 | ₱13 | ~₱28 | ₱6 |

*50% student discount via white Beep card; effective June–September 2025. Senior citizen/PWD also 50% as of July 2025 (formerly 20%). Traditional 20% SC/PWD/student discount under RA 9994/10754/11314 superseded for rail by the new 50% scheme.

---

## 2. Rail-to-BRT Transfer: Separate Fare, Shared Card (Partially)

| Transfer | Mode Pair | Beep Card Accepted? | GCash Accepted? | Fare |
|----------|-----------|---------------------|-----------------|------|
| Any MRT-3 station → EDSA Carousel at same stop | MRT-3 → BRT | Beep: **YES** | GCash: **YES** (Dec 2025) | **Separate fare** — ₱15–₱74.50 on Carousel |
| LRT-1 EDSA ↔ EDSA Carousel (Taft/Pasay Rotonda) | LRT-1 → BRT | Beep: **YES** | GCash: **YES** | **Separate fare** |
| LRT-1 PITX ↔ EDSA Carousel south terminus | LRT-1 ↔ BRT | Beep: **YES** | GCash: **YES** | **Separate fare** |

**Notable**: The EDSA Carousel historically was cash-only. GCash Scan to Pay via QR (SoundPay device on bus) launched December 2025 across 226 buses; Beep card tap has been accepted for some time. Full rollout expected across all 751 authorized buses in 2026.

---

## 3. Rail/BRT-to-Jeepney Transfer: Always Separate, Usually Cash

| Transfer Type | Beep Accepted? | GCash Accepted? | Cash Required? | Notes |
|---------------|---------------|-----------------|----------------|-------|
| Rail → Traditional Jeepney | NO | NO | YES | Cash only; no electronic payment on traditional PUJs |
| Rail → Modern Jeepney (PUVMP-compliant) | Partial | Partial | Often YES | Some modern jeepneys have AFCS terminals; acceptance inconsistent |
| Rail → UV Express | NO | NO | YES | Cash only (flat fare collected by conductor) |
| Rail → City Bus | NO (most) | NO (most) | YES | Some city buses accept Beep; most do not; no conductor-based AFCS widely deployed |
| Rail → P2P Bus | Varies | Varies | Often YES | Beep: some operators (UBE Express, RRCG); TRIPKO: DNS; GCash: COMET Bus; Cash: all |

**Key finding**: No rail-to-road fare discount or transfer pricing exists. Rail exit and jeepney boarding are fully independent commercial transactions.

---

## 4. Payment Method Matrix by Mode

| Mode | Cash | Beep Card | GCash QR | EMV Card/NFC | Proprietary Card | Notes |
|------|------|-----------|----------|--------------|-----------------|-------|
| LRT-1 | YES (ticket) | **YES** | Planned 2026 | Planned 2026 | — | RCBC partnership for EMV rollout |
| LRT-2 | YES (ticket) | **YES** | Planned 2026 | Planned 2026 | — | Same RCBC partnership |
| MRT-3 | YES (ticket) | **YES** | **YES** (Jul 2025) | **YES** (Jul 2025) | — | First mode with full open-loop payment |
| EDSA Carousel | YES | **YES** | **YES** (Dec 2025) | Planned | — | GCash on 226/751 buses as of Dec 2025 |
| Traditional Jeepney | YES | NO | NO | NO | — | Cash only; fare paid to driver |
| Modern Jeepney | YES | Partial | Partial | NO | — | AFCS terminals installed in some; enforcement inconsistent |
| UV Express | YES | NO | NO | NO | — | Cash (flat fare), collected by driver/conductor |
| City Bus (ordinary) | YES | Rarely | NO | NO | — | Conductor-collected cash; Beep terminals rare |
| P2P Bus — RRCG | YES | **YES** | NO | NO | — | Beep card accepted |
| P2P Bus — UBE Express | YES | **YES** | NO | NO | — | Beep card accepted at NAIA T3 |
| P2P Bus — DNS | YES | NO | NO | NO | TRIPKO | Proprietary QR card; booth at One Ayala |
| P2P Bus — COMET | YES | NO | **YES** | NO | GETPass | Cashless-first; GETPass app + GCash |
| P2P Bus — HM Transport | YES | NO | NO | NO | — | Cash only |
| P2P Bus — Saint Rose | YES | NO | NO | NO | — | Cash only |
| P2P Bus — MetroExpress | YES | NO | NO | NO | — | Cash only |
| BGC Bus | YES | NO | NO | NO | — | Cash only; flat fare ₱12–₱30 |
| QCityBus | — | — | — | — | — | **FREE** — no fare collected |
| Makati Loop / E-Jeep | — | — | — | — | — | **FREE** — no fare collected |
| UP Ikot / Campus loops | — | — | — | — | — | **FREE** — no fare collected |

---

## 5. Discount/Concessionary Card Systems

### 5a. Beep Card Tiers (Post-2025)

| Card Type | Color | Eligible Group | Discount on Rail | Cost | Notes |
|-----------|-------|---------------|------------------|------|-------|
| Standard Beep | Blue/Regular | General public | None (full fare) | ₱150 (card + ₱100 load) | |
| Student Beep | White | Students K-postgrad | **50% on LRT/MRT** | ₱30 (issuance fee) | Launched Sep 2025; valid until 2028 |
| Concessionary (SC/PWD) | Yellow/Special | Senior 60+, PWD | **50% on LRT/MRT** (upgraded from 20%) | Free (government-issued) | Upgraded Jul 2025 |

**Critical limitation**: The 50% student and SC/PWD discounts apply **only to rail** (LRT-1, LRT-2, MRT-3). No automatic discount is applied when using Beep on EDSA Carousel, jeepneys, or buses — those modes continue to honor the 20% discount under RA 9994/10754/11314, but it's manually claimed (show ID) rather than card-automated.

### 5b. Mode-Specific Discounts (Non-Card Based)

| Mode | SC/PWD Discount | Student Discount | How Claimed |
|------|----------------|-----------------|-------------|
| Rail (LRT/MRT) | **50%** (as of Jul 2025) | **50%** (as of Jun 2025) | White/Yellow Beep card (automatic) |
| EDSA Carousel | 20% | 20% | Show government ID to conductor |
| Jeepney (traditional) | 20% | 20% | Show ID; driver manually adjusts change |
| Jeepney (modern) | 20% | 20% | Show ID or AFCS card (inconsistent) |
| UV Express | 20% | 20% | Show ID to driver/conductor |
| City Bus | 20% | 20% | Show ID to conductor |
| P2P Bus | 20% | 20% | Show ID at boarding |
| BGC Bus | 20% | 20% | Show ID; from ₱12 min fare |

---

## 6. AFCS Fragmentation and the 2025 Transition

### The 20+ Provider Problem

As of 2025, Metro Manila's cashless public transport ecosystem has **20+ non-interoperable AFCS providers**. Each modern jeepney cooperative or bus company chooses its own payment terminal vendor. The DOTr published AFC National Standards (NS) to work toward interoperability, but implementation is voluntary and slow.

### AF Payments Inc. Concession Expiry

The AFCS concession held by AF Payments Inc. (Ayala + Metro Pacific) expired in 2025. The Commission on Audit's 2024 performance audit confirmed: "The DOTr is not yet prepared to fully assume the operation of the AFCS program, and identification of a suitable alternative concessionaire has been hampered by lack of preparedness." As of March 2026, the Beep card system remains operationally active, but the institutional future is unresolved.

### EMV Open-Loop Pilot (2025–2026)

The DOTr-Landbank EMV contactless pilot launched at PITX tests whether bank-issued EMV cards (credit/debit) and NFC smartphones can be used as transit media without a stored-value card. If successful and scaled:
- Commuters could potentially use a single bank card across rail and buses
- Still would not reduce the fare charged at each boarding — no fare integration

---

## 7. Where Fare Integration Genuinely Exists (Rare Cases)

| Scenario | Integration Type | Detail |
|----------|-----------------|--------|
| Free shuttle networks | **Full integration** | QCityBus (free, 8 routes), UP campus routes (free), Makati E-Jeep (free) — no fare charged at all, making "integration" irrelevant |
| BGC Bus internal network | **Partial** | Single flat fare ₱12–₱30 regardless of distance within BGC; but no discount on connecting to MRT-3 Ayala at system exit |
| EDSA Carousel + MRT-3 shared stop | **Physical** | Co-located stops allow easy transfer, but fare is charged twice |
| LRT-2 Antipolo ↔ QCityBus Route 3 | **Physical** | QCityBus free feeder at Antipolo; no fare on QCityBus leg but full LRT-2 fare if continuing by rail |

**Conclusion**: True fare integration (where a transfer discount or unified fare applies) exists **only in free-service networks**. No Metro Manila transit route offers a discounted combined fare for multimodal journeys.

---

## 8. Planned and Announced Integration (Not Yet Implemented)

| Initiative | Status | Expected Impact |
|-----------|--------|----------------|
| LRT-1/LRT-2 GCash/EMV acceptance | Planned (RCBC partnership announced 2025) | Payment method expansion; no fare reduction |
| AFCS National Standards for modern jeepneys | DOTr drafted; voluntary adoption | Long-term Beep card acceptance on jeepneys possible |
| Philippine Automatic Fare Collection System (PAFCS) | Procurement/planning stage; P4.5B budget proposed | Metro Manila City Bus AFCS + Central Clearing System |
| PNR → NSCR reopening (~2028–2029) | Under construction | Will need new AFCS; likely Beep-compatible |
| Interoperable digital wallet expansion on EDSA Carousel | GCash active Dec 2025; others announced for 2026 | More payment options; no fare discount |
| Transfer discount (hypothetical) | Not announced | No DOTr/LTFRB policy toward this as of March 2026 |

---

## 9. GTFS Implications

### fare_attributes.txt Schema

Each mode group needs its own `fare_id` in the GTFS feed. No shared fare or transfer-discount fare exists.

| fare_id | price | currency | payment_method | transfers | transfer_duration |
|---------|-------|----------|---------------|-----------|-------------------|
| JEP_TRAD | 13.00 | PHP | 0 (on board) | 0 | — |
| JEP_MOD | 15.00 | PHP | 0 | 0 | — |
| BUS_ORD | 13.00 | PHP | 0 | 0 | — |
| BUS_AC | 15.00 | PHP | 0 | 0 | — |
| EDSA_CAR | 15.00 | PHP | 0 | 0 | — |
| LRT1 | 13.00 | PHP | 1 (pre-board Beep) | 0 | — |
| LRT2 | 13.00 | PHP | 1 | 0 | — |
| MRT3 | 13.00 | PHP | 1 | 0 | — |
| P2P_FLAT | varies | PHP | 0 or 1 | 0 | — |
| UV_FLAT | varies | PHP | 0 | 0 | — |
| FREE | 0.00 | PHP | 0 | unlimited | — |

**Note**: `transfers=0` for all modes means GTFS models no transfer pricing — each boarding is a separate commercial transaction, which is accurate for Metro Manila.

### transfers.txt for Physical Connections

Even without fare integration, `transfers.txt` captures the physical transfer allowance:

| from_stop_id | to_stop_id | transfer_type | min_transfer_time |
|-------------|-----------|--------------|-------------------|
| LRT1_DOROTEO_JOSE | LRT2_RECTO | 2 | 180 |
| LRT1_TAFT | MRT3_TAFT | 2 | 300 |
| LRT2_CUBAO | MRT3_CUBAO | 2 | 480 |
| MRT3_NORTH_AVE | EDSA_CAR_NORTH_AVE | 2 | 60 |
| MRT3_ORTIGAS | EDSA_CAR_ORTIGAS | 2 | 60 |
| MRT3_GUADALUPE | EDSA_CAR_GUADALUPE | 2 | 60 |
| MRT3_BUENDIA | EDSA_CAR_BUENDIA | 2 | 60 |
| MRT3_AYALA | EDSA_CAR_ONE_AYALA | 2 | 120 |
| MRT3_TAFT | EDSA_CAR_TAFT | 2 | 60 |
| LRT1_PITX | EDSA_CAR_PITX | 2 | 120 |

### Student/SC/PWD Discount Handling

GTFS has no native concessionary fare mechanism per rider-class that dynamically applies to multiple routes. Options:
1. **Separate fare_id per discount** (JEP_TRAD_SC, LRT1_STUDENT, etc.) — verbose but standard
2. **Post-processing layer** in routing engine — multiply applicable fares by 0.5 or 0.8 based on rider profile
3. **Ignore discounts in GTFS** — document in fare quality report only

**Recommended**: For the rail modes (LRT-1/2, MRT-3), add a parallel fare entry with `_DISC` suffix at 50% of regular fares, referencing the same route_id in `fare_rules.txt`. For all other modes, add `_DISC` at 80% (20% discount). Mark all discounted fare_ids with `payment_method=0` (agent/conductor applies).

---

## 10. Conflict Notes

1. **EDSA Carousel Beep card acceptance**: Multiple sources (ltfrb-fare-matrices.md analysis #4, edsa-busway-system.md) stated "cash only as of 2025." The December 2025 GCash rollout contradicts this for the Scan-to-Pay equipped buses. Status: **Beep accepted** (long-standing), **GCash newly added Dec 2025** on subset of buses. Not a conflict but a temporal update.

2. **Student/SC/PWD discount on rail**: Earlier analysis cited 20% discount (RA 9994/10754/11314). This is accurate for *land transport* modes. For rail specifically, the Marcos administration unilaterally raised it to **50%** effective June–July 2025. This creates a mode-dependent discount split: 50% on rail, 20% everywhere else. Note in GTFS discounted fares.

3. **AFCS concession status**: Beep cards remain functional as of 2026 but the AF Payments Inc. concession formally expired. COA flagged DOTr unpreparedness. Operationally the system works; institutionally, the future is uncertain. Mark confidence as **Medium** for long-term Beep card stability.

---

## 11. Summary Gap Analysis

| Transfer Scenario | Fare Integration? | Payment Convenience | Notes |
|-------------------|------------------|--------------------|----|
| LRT ↔ LRT | None (separate fares) | High (same Beep card) | Common medium, separate tolls |
| LRT ↔ MRT | None | High (same Beep card) | Same as above |
| Rail ↔ EDSA Carousel | None | High (Beep card, GCash) | GCash added Dec 2025 |
| Rail ↔ Modern Jeepney | None | Medium (Beep partial) | Depends on jeepney AFCS terminal |
| Rail ↔ Traditional Jeepney | None | Low (cash only) | No cashless option |
| Rail ↔ P2P Bus | None | Low-Medium (varies by operator) | Beep at RRCG/UBE; cash at most |
| Rail ↔ City Bus | None | Low | Cash predominantly |
| Rail ↔ Free Services | N/A | N/A | Free routes need no fare handling |
| Two jeepney routes | None | Low (cash) | No combined fare; each trip separate |

**Bottom line**: Metro Manila commuters pay a new minimum fare at every boarding, for every mode. A 3-vehicle commute (jeepney + MRT + EDSA Carousel) triggers three separate fares, none discounted for the transfer. This is the baseline assumption for all GTFS fare modeling.

---

## Sources

- `analysis/ltfrb-fare-matrices.md` — fare rate tables for all modes
- `analysis/edsa-busway-system.md` — EDSA Carousel payment status
- `analysis/p2p-bus-operators.md` — per-operator payment method data
- `analysis/validated-rail-to-road-transfer-mapping.md` — transfer infrastructure and fare notes
- [Beep card Wikipedia](https://en.wikipedia.org/wiki/Beep_(smart_card)) — Beep card network overview
- [COA AFCS Performance Audit 2024](https://www.coa.gov.ph/reports/performance-audit-reports/2024-2/automatic-fare-collection-system-afcs-project/) — AFCS concession expiry issues
- [Manila Times, Dec 2025](https://www.manilatimes.net/2025/12/17/tmt-newswire/commuters-can-now-scan-to-pay-via-qr-for-rides-at-edsa-busway/2245231) — EDSA Busway GCash QR launch
- [DOTr MRT-3 cashless Jul 2025 (Manila Bulletin)](https://mb.com.ph/2025/07/25/dotr-claims-world-first-as-mrt-3-rolls-out-all-inclusive-cashless-payment) — MRT-3 open-loop launch
- [Tribune, Sep 2025](https://tribune.net.ph/2025/09/20/marcos-launches-50-discount-beep-cards-for-students-on-lrt-mrt) — Student Beep card launch
- [PNA, 2025](https://www.pna.gov.ph/articles/1257064) — DepEd 50% discount duration (until 2028)
- [AFCS Blog state of fare collection 2025](https://afcsblog.ingonoka.com/post/afcs-ph-why-so-hard/state-of-fare-collection-2025/) — Fragmentation overview
- [BusinessWorld Apr 2023](https://www.bworldonline.com/economy/2023/04/25/519176/automated-fare-collection-system-launch-plan-geared-towards-expanding-consumer-choice/) — AFCS National Standards
