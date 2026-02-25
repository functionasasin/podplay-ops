# Analysis: spec-draft

**Aspect**: spec-draft
**Wave**: 5 — Synthesis
**Date Analyzed**: 2026-02-25
**Depends On**: ALL 34 prior analysis files (complete synthesis)

---

## Purpose

This aspect synthesized all 34 prior analysis files into a complete software specification for the Philippine estate tax computation engine. The spec is written at `docs/plans/estate-tax-engine-spec.md`.

---

## Spec Summary

The generated spec covers:

1. **Overview & Purpose** — engine contract, target user, scope
2. **Scope & Constraints** — in/out of scope list, pre-valued inputs assumption
3. **Three Tax Regimes** — TRAIN/PRE_TRAIN/AMNESTY with deductionRules flag
4. **Key Constants** — all hardcoded values (rates, caps, thresholds, bracket amounts)
5. **Data Model** — 13 enums, 3 top-level input types, 10+ asset/deduction types, 12 intermediate types, 3 output types
6. **Regime Detection** — complete `detectRegime()` pseudocode with all branches + `checkAmnestyEligibility()`
7. **Sec. 87 Exclusions** — pre-computation filter; distinctions from Sec. 86(A)(3)
8. **Gross Estate** — citizen/resident worldwide scope; NRA PH-situs + reciprocity; all 6 Sec. 85(B)-(G) inclusion rules
9. **Ordinary Deductions** — 5A through 5H with full pseudocode; availability matrix per regime/deductionRules
10. **Special Deductions** — 37A (standard), 37B (family home), 37C (medical), 37D (RA 4917)
11. **Surviving Spouse Share** — Sec. 86(C) formula; ACP/CPG/Separation classification rules
12. **Tax Rate** — TRAIN flat 6%; pre-TRAIN 6-bracket graduated schedule with verified boundary amounts
13. **Foreign Tax Credit** — Sec. 86(D); per-country + overall limits; unavailable for NRAs and amnesty
14. **Amnesty Computation** — Track A/B; minimum ₱5,000; deduction scope; crossover analysis
15. **NRA Proportional Deductions** — Sec. 86(B) formula; ELIT proportional; public transfers proportional (correction applied)
16. **Complete Computation Pipeline** — 14-phase sequence with all ordering dependencies
17. **Form 1801 Output Contract** — all fields for Items 29–44/20 and Schedules 1–6A
18. **Plain-English Explainer** — 8-section template with `{{variable}}` placeholders for all three regimes
19. **Test Vectors** — 10 integration tests + 1 unit test (TV-09b minimum floor)
20. **Edge Cases** — 26 critical edge cases + 4 documented correction table
21. **Filing Rules** — informational output (deadlines, CPA threshold, venue)

---

## Key Decisions Made During Synthesis

1. **deductionRules is independent of regime**: Spec explicitly requires all deduction functions to accept `deductionRules` as a separate parameter from `regime`. Never select deduction amounts based on `regime` alone.

2. **Four documented corrections applied**:
   - NRA public transfers: proportional (not full value) per Sec. 86(B)(2)
   - Amnesty pre-2018 funeral/judicial: INCLUDED in full deduction set per RA 11213 Sec. 3
   - Amnesty TRAIN-era standard deduction: ₱5M (not ₱1M)
   - Vanishing deduction under amnesty: AVAILABLE (full deduction set)

3. **Vanishing deduction ELIT for ratio**: Pre-TRAIN ELIT for the ratio denominator includes funeral + judicial (5G + 5H), not just 5A–5D.

4. **Funeral ordering dependency**: grossEstate.total.total (Item 34.C) must be finalized before computing funeral deduction limit (5% cap).

5. **Spouse share 5E/5F exclusion**: Vanishing deduction (5E) and public transfers (5F) do NOT reduce the community pool for spouse share — only ELIT 5A–5D (and pre-TRAIN 5G, 5H) are community "obligations."

6. **Test vectors reference**: The spec references `analysis/test-vectors.md` for authoritative input/output values rather than duplicating all intermediate computations inline.

---

## Spec Location

`docs/plans/estate-tax-engine-spec.md`

Size: ~600 lines of pseudocode, tables, and narrative.

---

## Form 1801 Mapping: Complete

Every Form 1801 field is covered:
- Part I (17 informational fields): F1–F15D
- Part III (payment): Item 20 only (surcharges/penalties out of scope)
- Part IV (Items 29–44/20): all with A/B/C column structure and formulas
- Part V (Schedules 1, 1A, 2, 2A, 3, 4, 5, 6, 6A): all fields mapped

---

## Test Coverage

| Regime | Scenarios Covered |
|--------|-----------------|
| TRAIN | TV-01 (simple), TV-02 (ACP + FH + medical), TV-03 (CPG + vanishing), TV-04 (NRA), TV-05 (zero tax: below SD), TV-06 (zero tax: ELIT+SD exceed GE), TV-10 (100% VD) |
| PRE_TRAIN | TV-07 (simple 2015), TV-08 (CPG 2010 complex) |
| AMNESTY | TV-09 (Track A pre-2018 CPG), TV-09b (minimum ₱5,000 floor unit test) |

All code paths covered:
- All 6 pre-TRAIN tax brackets (including ₱0 below ₱200K)
- All 5 vanishing deduction percentages (100%/80%/60%/40%/20%)
- Both amnesty tracks (A and B)
- All three property regimes (ACP, CPG, Separation)
- NRA proportional deduction path
- Foreign tax credit computation
- Zero-tax scenarios (multiple paths)

---

## Spec Review Checklist (for spec-review aspect)

- [ ] Every NIRC section (84–97) represented across all three regimes
- [ ] Every computation has exact pseudocode
- [ ] All 182 edge cases from `analysis/edge-cases.md` representable by spec rules
- [ ] All 10+ Form 1801 test implications from `form-1801-fields.md` covered
- [ ] Every test vector in `test-vectors.md` computable from spec alone
- [ ] Explainer template covers all three regimes and all deduction types
- [ ] All four documented corrections applied
- [ ] Developer with no tax knowledge can implement without any other reference
