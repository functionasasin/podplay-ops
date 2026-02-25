# Analysis: spec-review

**Aspect**: spec-review
**Wave**: 5 — Synthesis (final gate)
**Date Analyzed**: 2026-02-25
**Reviews**: `docs/plans/estate-tax-engine-spec.md`
**All analysis files read**: 36 of 36

---

## Review Methodology

Reviewed the spec by asking: **"Could a developer with no Philippine tax knowledge build the entire engine from this spec alone?"**

Checked each dimension of the spec-review checklist:

1. Every NIRC section (84–97) represented across all three regimes
2. Every computation has exact pseudocode
3. All edge cases representable by spec rules
4. All Form 1801 fields covered
5. Every test vector computable from spec alone
6. Explainer template covers all three regimes and all deduction types
7. All four documented corrections applied
8. No assumed context

---

## Overall Verdict: FAIL — Two Issues Require Fix

The spec covers approximately 95% of the required ground and correctly incorporates all four documented corrections. However, two issues prevent it from meeting the "self-contained implementable spec" standard:

1. **CRITICAL: NRA pre-TRAIN pipeline bug** — The computation pipeline incorrectly computes funeral and judicial/admin expenses for pre-TRAIN NRAs. Fix required before the spec can be implemented correctly.

2. **MINOR: TV-02 inline computation discrepancy** — The spec includes a self-contradictory inline computation for TV-02 that a developer could implement incorrectly. Fix required for documentation clarity.

After these two issues are fixed, the spec passes.

---

## Issue 1 (CRITICAL): NRA Pre-TRAIN Pipeline Bug

### What the spec says

The spec defines `computeNRAELIT` (Section 15) as returning proportional funeral and judicial expenses for pre-TRAIN NRAs:

```pseudocode
// Section 15 — computeNRAELIT
funeral    = (deductionRules == PRE_TRAIN) ? factor * W.funeralExpenses : 0
judicial   = (deductionRules == PRE_TRAIN) ? factor * W.judicialAdminExpenses : 0

return { claimsAgainstEstate, claimsVsInsolvent, unpaidMortgages,
         casualtyLosses, funeral, judicial, proportionalFactor }
```

Simultaneously, the pipeline (Section 16) invokes the citizen/resident funeral/judicial functions for ALL estates (no NRA branch check):

```pseudocode
// Phase 5 (Section 16) — called without NRA check
funeralDeduction = computeFuneralExpenses(input.funeralExpenses,
                     grossEstate.total.total, deductionRules)

// Phase 6 — called without NRA check
judicialDeduction = computeJudicialAdminExpenses(input.judicialAdminExpenses,
                      deductionRules)

// Phase 7 — adds non-proportional funeral/judicial to vanishing ratio
elitForVanishingRatio = elitTotal
if deductionRules == PRE_TRAIN:
    elitForVanishingRatio += funeralDeduction.total + judicialDeduction.total
```

### Why this is wrong for pre-TRAIN NRAs

For a pre-TRAIN NRA (death before 2018, `isNonResidentAlien = true`, `deductionRules = PRE_TRAIN`):

1. **Phase 4** correctly computes proportional funeral/judicial via `computeNRAELIT`, storing them in `elitResult.funeral` and `elitResult.judicial`.

2. **Phase 5** then also calls `computeFuneralExpenses(input.funeralExpenses, ...)` using the **citizen-style input** `FuneralExpenses.actualAmount` and applying the non-proportional `min(actual, 5% × GE)` formula. For NRAs, `input.funeralExpenses` is the wrong input — NRA funeral comes from `input.decedent.totalWorldwideELIT.funeralExpenses`. The result is a **non-proportional** funeral figure.

3. **Phase 7** adds this non-proportional `funeralDeduction.total` to `elitForVanishingRatio` — the ratio denominator for the vanishing deduction. This makes the vanishing ratio wrong for pre-TRAIN NRAs.

4. **Phase 10** passes the non-proportional `funeralDeduction` to `assembleOrdinaryDeductions`, producing the wrong Schedule 5G amount.

The `computeNRAELIT` funeral/judicial fields in `elitResult` are never used in the pipeline — they are computed and then ignored.

### Concrete impact

NRA decedent, died 2015, PH estate ₱5M, worldwide estate ₱20M (factor = 0.25):
- Worldwide funeral expenses: ₱400,000
- Correct proportional deduction (5G): 0.25 × ₱400,000 = **₱100,000**
- Non-proportional citizen formula: min(₱400K, 5% × ₱5M) = min(₱400K, ₱250K) = **₱250,000**
- Overstatement: ₱150,000 → understates net taxable estate → understates tax

### Affected cases

- Any NRA decedent with `dateOfDeath < 2018-01-01` (regime=PRE_TRAIN, deductionRules=PRE_TRAIN)
- Any NRA decedent in AMNESTY regime with `dateOfDeath < 2018-01-01` (deductionRules=PRE_TRAIN)

### Root cause

Two design tensions merged incorrectly:
- The original `nonresident-deductions.md` analysis defined `computeNRA_ELIT` to return only 5A–5D (not funeral/judicial). The spec's synthesized `computeNRAELIT` added funeral/judicial to the return — correctly — but the pipeline was not updated to skip the separate Phases 5-6 for NRAs.
- `assembleOrdinaryDeductions` has no pseudocode in the spec, leaving ambiguous whether it uses `elitResult.funeral` or the separate `funeralDeduction`.

### Fix required (spec addition)

Add NRA branch to Phases 5 and 6 of the pipeline:

```pseudocode
// Phase 5: Funeral Expenses (5G)
if input.decedent.isNonResidentAlien:
    // NRA: proportional funeral already computed in elitResult.funeral (Phase 4)
    funeralDeduction = { exclusive: 0, conjugal: elitResult.funeral, total: elitResult.funeral }
else:
    funeralDeduction = computeFuneralExpenses(input.funeralExpenses,
                         grossEstate.total.total, deductionRules)

// Phase 6: Judicial/Admin Expenses (5H)
if input.decedent.isNonResidentAlien:
    // NRA: proportional judicial already computed in elitResult.judicial (Phase 4)
    judicialDeduction = { exclusive: 0, conjugal: elitResult.judicial, total: elitResult.judicial }
else:
    judicialDeduction = computeJudicialAdminExpenses(input.judicialAdminExpenses, deductionRules)
```

Also add pseudocode for `assembleOrdinaryDeductions` to make the function explicit:

```pseudocode
function assembleOrdinaryDeductions(elitResult, vanishingDeduction,
                                    publicTransfers, funeralDeduction,
                                    judicialDeduction) → OrdinaryDeductionsResult:
  return {
    claimsAgainstEstate:     elitResult.claimsAgainstEstate,
    claimsVsInsolvent:       elitResult.claimsVsInsolvent,
    unpaidMortgagesAndTaxes: elitResult.unpaidMortgagesAndTaxes,
    casualtyLosses:          elitResult.casualtyLosses,
    vanishingDeduction:      vanishingDeduction,
    transfersPublicUse:      publicTransfers,
    funeralExpenses:         funeralDeduction,    // 0 for TRAIN; from elitResult.funeral for NRA PRE_TRAIN
    judicialAdminExpenses:   judicialDeduction,   // 0 for TRAIN; from elitResult.judicial for NRA PRE_TRAIN
    total:                   sum_of_all_above
  }
```

---

## Issue 2 (MINOR): TV-02 Inline Computation Discrepancy

### What the spec says

Section 19, TV-02 inline attempt shows:

```
Item 40 (NTE): ₱950,000
Item 42 tax: ₱950,000 × 0.06 = ₱57,000
```

But the same section then self-corrects:

> "Wait — let me recalculate... The test-vectors.md showed ₱1,850,000 NTE and ₱111,000 tax."

Then it shows a second, different inline calculation ending with ₱1,450,000 NTE / ₱87,000 tax.

Then defers: "Developers should run the computation engine against the test vectors file at `loops/estate-tax-reverse/analysis/test-vectors.md` for the authoritative input/output values."

The spec shows THREE different answers for TV-02: ₱57K, ₱87K, and ₱111K. The authoritative answer (from test-vectors.md) is ₱111K with NTE ₱1,850,000.

### Why this matters

A developer who reads the spec would encounter contradictory numbers for the same test vector. They cannot implement the test without reading the external file. The spec's self-stated goal is to be self-contained.

### Fix required

Replace the confused TV-02 section with the correct values from `test-vectors.md TV-02`:
- Gross estate: Real (excl) ₱5M + Family home (excl) ₱4M + Cash (conj) ₱3M + Jewelry (conj) ₱1M = ₱13M
- Claims against estate (conjugal 5A): ₱500K
- Standard deduction 37A: ₱5M; Family home 37B: ₱4M (exclusive); Medical 37C: ₱500K (capped)
- Item 38: ₱12.5M − ₱9.5M = ₱3,000,000
- Spouse share: (₱4M − ₱500K) × 0.5 = ₱1,750,000
- Item 40 NTE: ₱3M − ₱1.75M = **₱1,250,000** — wait, this matches the crossover threshold
- Defers to test-vectors.md for the precise inputs; the inline attempt should be removed entirely and replaced with "see analysis/test-vectors.md TV-02 for authoritative values"

---

## What PASSES

The spec correctly handles the following (no fix required):

### NIRC Coverage
| Section | Coverage |
|---------|---------|
| Sec. 84 (tax rate) | ✓ TRAIN flat 6% (Sec 12.1); pre-TRAIN graduated 0–20% (Sec 12.2) |
| Sec. 85 (gross estate inclusions) | ✓ Citizens/NRA worldwide/PH scope (Sec 8); all 6 inclusion rules 85(B)–(G) (Sec 8.3) |
| Sec. 86(A)(1) ELIT | ✓ Five sub-items 5A–5H with pseudocode (Sec 9.2–9.9); pre-TRAIN funeral/judicial included |
| Sec. 86(A)(2) Vanishing deduction | ✓ Full 5-step formula with 5 percentage tiers (Sec 9.6) |
| Sec. 86(A)(3) Public transfers | ✓ With NRA proportional correction applied (Sec 9.7) |
| Sec. 86(A)(4) Standard deduction | ✓ Three amounts: ₱5M / ₱1M / ₱500K driven by deductionRules (Sec 10.1) |
| Sec. 86(A)(5) Family home | ✓ Conjugal halving; cap by deductionRules; barangay cert (Sec 10.2) |
| Sec. 86(A)(6) Medical | ✓ ₱500K cap; 1-year window; NRA exclusion (Sec 10.3) |
| Sec. 86(A)(7) RA 4917 | ✓ Pass-through deduction; NRA exclusion (Sec 10.4) |
| Sec. 86(A)(9) Surviving spouse | ✓ 50% of net conjugal; ACP/CPG/Separation rules (Sec 11) |
| Sec. 86(B) NRA deductions | ✓ Proportional ELIT; ₱500K standard; no FH/medical/RA4917/FTC (Sec 15) |
| Sec. 86(C) Spouse share | ✓ Same formula for NRA PH-situs conjugal (Sec 11) |
| Sec. 86(D) Foreign tax credit | ✓ Per-country + overall limits; NRA exclusion; amnesty exclusion (Sec 13) |
| Sec. 87 Exemptions | ✓ Four types; pre-computation exclusion; distinctions from 86(A)(3) (Sec 7) |
| Sec. 88 Usufruct valuation | ✓ Noted: out of scope (user provides FMV); fixed-term usufruct noted |
| Sec. 90 Filing rules | ✓ 1-year / 6-month deadlines; CPA threshold; venue (Sec 21) |

### Four Corrections Applied
| Correction | Status |
|-----------|--------|
| NRA public transfers: proportional, not full value | ✓ Sec. 9.7 correctly applies proportional factor for NRAs |
| Amnesty pre-2018 funeral/judicial: INCLUDED | ✓ Sec. 9.1 availability table; Sec. 14.2 specifies full deduction set |
| Amnesty TRAIN-era standard deduction: ₱5M (not ₱1M) | ✓ Sec. 10.1 uses deductionRules not regime |
| Vanishing deduction under amnesty: AVAILABLE | ✓ Sec. 9.1 table; Sec. 9.6 availability note |

### deductionRules Pattern
✓ Spec explicitly requires all deduction functions to accept `deductionRules` as independent of `regime` (Sec. 3 and throughout). The regime detection function correctly outputs both `regime` and `deductionRules`. All four combinations are covered.

### Form 1801 Output Contract
✓ All 14 Part IV items (29–44/20) with formulas. All 9 schedules. 10 validation rules. Three output format variants (TRAIN, pre-TRAIN, ETAR).

### Explainer Template
✓ 8 sections covering all three regimes. `{{variable}}` placeholders for every computed value. Property regime narratives for ACP/CPG/Separation/single. Amnesty window closure notice.

### Test Vectors
✓ 10 integration tests + 1 unit test. All three regimes covered (7 TRAIN, 2 pre-TRAIN, 2 amnesty). All code paths: 6 pre-TRAIN brackets; all 5 VD percentages; both amnesty tracks; all property regimes; NRA path; FTC; zero-tax scenarios.

### Edge Cases
✓ 26 critical edge cases in the spec's edge case table (Sec 20). 4 documented corrections. Full 182-item catalog in analysis/edge-cases.md.

---

## Minor Documentation Observations (No Fix Required)

These are low-priority observations that do not affect correctness:

1. **Section 9.6 vanishing comment**: The function comment says "NOT including 5G funeral" then the next line says "Note: For pre-TRAIN, ELIT for the ratio DOES include funeral + judicial (5G + 5H)." The comment is contradictory but the actual pipeline (Phase 7) is correct. A developer would be confused by the comment but the pipeline handles it. (Low priority — fix in a future editing pass.)

2. **`FuneralExpenses` input type**: Has no `ownership` field. Section 9.8 defaults to Column B for married estates with an implementor note. Works correctly but requires implementor judgment. (Low priority — no fix needed; default is defensible.)

3. **`USER_NOT_ELECTED` enum value**: Present in `AmnestyIneligibilityReason` but never generated by `checkAmnestyEligibility` (the function is only called when `userElectsAmnesty = true`). Harmless dead code. (Low priority — remove in cleanup.)

4. **Test vectors reference external file**: TV-02, TV-03, TV-04, TV-08, TV-09 defer to `analysis/test-vectors.md` for authoritative values. This was an intentional design decision to avoid spec bloat. Acceptable as long as the external file is bundled with the spec. (Noted, not a blocking issue.)

5. **Form 1801 Part I fields F3 and F5**: Not listed in Sec 17 (jumps F2 → F4 → F6). These may be administrative or display fields not relevant to computation. Non-blocking since the spec covers all computation items.

---

## Fix-It Aspects Added to Frontier

Two new aspects added to Wave 5:

- `fix-nra-pretrain-pipeline` — Fix the pipeline Phases 5-6 NRA branch; add `assembleOrdinaryDeductions` pseudocode; fix Phase 7 `elitForVanishingRatio` for NRAs
- `fix-tv02-inline` — Remove the contradictory TV-02 inline computation from Section 19; replace with correct values or a clean deferral to test-vectors.md

**`status/converged.txt` is NOT written.** The spec will be re-reviewed after the two fix-it aspects are complete.

---

## Summary

| Dimension | Result |
|-----------|--------|
| NIRC sections 84–97 | ✓ Pass |
| Pseudocode completeness | ⚠ Mostly pass; NRA pipeline has bug |
| Four corrections applied | ✓ Pass |
| Form 1801 output contract | ✓ Pass |
| Test vectors | ⚠ TV-02 inline contradictory |
| Explainer format | ✓ Pass |
| Edge cases | ✓ Pass |
| deductionRules pattern | ✓ Pass |
| Self-contained | ⚠ NRA pre-TRAIN pipeline gap; TV-02 defers to external file |
| **Overall** | **FAIL — 2 fix-it aspects added** |
