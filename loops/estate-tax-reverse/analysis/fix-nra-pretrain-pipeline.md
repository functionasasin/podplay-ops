# Analysis: Fix — NRA Pre-TRAIN Pipeline Bug

**Aspect**: fix-nra-pretrain-pipeline
**Wave**: 5 — Fix-It (from spec-review)
**Date Analyzed**: 2026-02-25
**Depends On**: computation-pipeline.md, nonresident-deductions.md, deductions-pre-train-diffs.md, spec-draft (estate-tax-engine-spec.md Section 16)

---

## Summary

The spec (Section 16) had a pipeline bug for non-resident alien (NRA) decedents under the pre-TRAIN deduction rules (`deductionRules = PRE_TRAIN`). Phases 5–6 called `computeFuneralExpenses` and `computeJudicialAdminExpenses` for ALL estates, including NRAs. This produced non-proportional funeral and judicial deduction amounts for NRAs, overstating their deductions. The bug also propagated into Phase 7 (ELIT ratio for vanishing deduction) and Phase 10 (`assembleOrdinaryDeductions`).

Additionally, `assembleOrdinaryDeductions` had no pseudocode in the spec, leaving its NRA handling ambiguous.

Three changes were made to `docs/plans/estate-tax-engine-spec.md` Section 16.

---

## Legal Basis

**NIRC Sec. 86(B)(2)** (applicable to NRAs):

> "In the case of a non-resident who is not a citizen of the Philippines, by deducting from the value of his gross estate situated in the Philippines [...] an amount equal to the proportion of the deductions specified in paragraphs (1) and (3) of Subsection (A) of this Section [...] which the value of his gross estate situated in the Philippines bears to his entire gross estate wherever situated."

- **Paragraph (1)** = ELIT (5A–5D), and by the same proportional formula:
- **Paragraph (3)** = transfers for public use

For **pre-TRAIN NRAs**, funeral expenses and judicial/admin expenses were deductible under the OLD NIRC. They are included in the **proportional ELIT** formula via `computeNRAELIT`. The proportional amounts are stored in `elitResult.funeral` and `elitResult.judicial`.

The WRONG approach (old spec) computed full non-proportional amounts via `computeFuneralExpenses` and `computeJudicialAdminExpenses`, then added them to Schedule 5. This produced:

```
// Example: NRA with actual funeral expenses ₱400,000, proportional factor 0.25
// WRONG (old spec):
funeralDeduction = computeFuneralExpenses(₱400,000, ₱8,000,000, PRE_TRAIN)
// = min(₱400,000, ₱8,000,000 × 0.05) = min(₱400,000, ₱400,000) = ₱400,000   ← WRONG

// CORRECT:
elitResult.funeral = factor × worldwide_funeral = 0.25 × ₱400,000 = ₱100,000  ← correct
```

Overstatement: **₱300,000** in this example (3× the correct amount).

---

## Bug Description

### Root Cause

`computeNRAELIT` (Section 15 of spec) already computes proportional funeral and judicial for pre-TRAIN NRAs and stores them in `elitResult.funeral` and `elitResult.judicial`. But the old Phase 5–6 code called the citizen/resident functions unconditionally:

```pseudocode
// OLD Phase 5 — no NRA guard (WRONG):
funeralDeduction = computeFuneralExpenses(input.funeralExpenses, grossEstate.total.total, deductionRules)

// OLD Phase 6 — no NRA guard (WRONG):
judicialDeduction = computeJudicialAdminExpenses(input.judicialAdminExpenses, deductionRules)
```

This produced BOTH:
- Correct proportional amounts in `elitResult.funeral` / `elitResult.judicial` (from Phase 4)
- Additional incorrect full/capped amounts in `funeralDeduction` / `judicialDeduction` (from Phases 5–6)

### Propagation to Phase 7 (Vanishing Ratio)

Old Phase 7:
```pseudocode
elitForVanishingRatio = elitTotal
if deductionRules == PRE_TRAIN:
  elitForVanishingRatio += funeralDeduction.total + judicialDeduction.total   // WRONG for NRAs
```

For NRAs, this used non-proportional amounts, inflating the `ELIT/GE` ratio in the vanishing deduction formula:
```
VD_ratio = (GE − elitForVanishingRatio) / GE
```
A larger numerator subtraction → smaller ratio → smaller vanishing deduction (second-order error, partially offsetting but directionally wrong).

### Phase 10 — No Pseudocode for `assembleOrdinaryDeductions`

Without pseudocode, `assembleOrdinaryDeductions` left NRA handling ambiguous:
- Should 5G/5H come from `elitResult.funeral/judicial`?
- Or from `funeralDeduction/judicialDeduction`?
- Or both (double-counted)?

---

## Fix Applied

Three changes made to `docs/plans/estate-tax-engine-spec.md` Section 16:

### Change 1 — Phase 5: Add NRA Guard

```pseudocode
// NEW Phase 5:
funeralDeduction = { exclusive: 0, conjugal: 0, total: 0 }
if not input.decedent.isNonResidentAlien:
  funeralDeduction = computeFuneralExpenses(input.funeralExpenses, grossEstate.total.total, deductionRules)
```

For NRAs: `funeralDeduction` is always zero. The proportional amount from `elitResult.funeral` is used in Phase 10 (`assembleOrdinaryDeductions`) and Phase 7 (ratio) instead.

### Change 2 — Phase 6: Add NRA Guard

```pseudocode
// NEW Phase 6:
judicialDeduction = { exclusive: 0, conjugal: 0, total: 0 }
if not input.decedent.isNonResidentAlien:
  judicialDeduction = computeJudicialAdminExpenses(input.judicialAdminExpenses, deductionRules)
```

### Change 3 — Phase 7: Fix NRA Vanishing Ratio

```pseudocode
// NEW Phase 7:
elitForVanishingRatio = elitTotal   // 5A–5D (proportional for NRAs)
if deductionRules == PRE_TRAIN:
  if input.decedent.isNonResidentAlien:
    // NRA: proportional funeral + judicial in elitResult (not in funeralDeduction/judicialDeduction)
    elitForVanishingRatio += elitResult.funeral + elitResult.judicial
  else:
    elitForVanishingRatio += funeralDeduction.total + judicialDeduction.total
```

### Change 4 — Phase 10: Add `assembleOrdinaryDeductions` Pseudocode

```pseudocode
function assembleOrdinaryDeductions(elitResult, vanishingDeduction, publicTransfers,
                                    funeralDeduction, judicialDeduction,
                                    isNRA) → OrdinaryDeductionsResult:
  // For NRAs, 5G/5H come from elitResult (proportional amounts from computeNRAELIT)
  // For citizens/residents, 5G/5H come from funeralDeduction / judicialDeduction
  line5G = isNRA
    ? { exclusive: 0, conjugal: 0, total: elitResult.funeral }
    : funeralDeduction
  line5H = isNRA
    ? { exclusive: 0, conjugal: 0, total: elitResult.judicial }
    : judicialDeduction
  all = [
    elitResult.claimsAgainstEstate,   // 5A
    elitResult.claimsVsInsolvent,     // 5B
    elitResult.unpaidMortgages,       // 5C
    elitResult.casualtyLosses,        // 5D
    vanishingDeduction,               // 5E
    publicTransfers,                  // 5F
    line5G,                           // 5G
    line5H                            // 5H
  ]
  A = sum(all.map(x => x.exclusive))
  B = sum(all.map(x => x.conjugal))
  return {
    schedule5: { line5A, line5B, line5C, line5D, line5E, line5F, line5G, line5H },
    total: { exclusive: A, conjugal: B, total: A + B }
  }

// Call site (in pipeline):
ordinaryDeductions = assembleOrdinaryDeductions(
  elitResult, vanishingDeduction, publicTransfers,
  funeralDeduction, judicialDeduction,
  input.decedent.isNonResidentAlien
)
```

---

## Worked Example: NRA Pre-TRAIN, Funeral Expense

**Scenario**: NRA decedent, date of death 2015-06-01 (PRE_TRAIN deductionRules). PH gross estate ₱10M, worldwide gross estate ₱40M. Worldwide funeral expenses ₱400,000.

```
proportional_factor = 10,000,000 / 40,000,000 = 0.25

Phase 4 — computeNRAELIT:
  elitResult.funeral = 0.25 × ₱400,000 = ₱100,000   // correct proportional funeral

Phase 5 (OLD — wrong):
  funeralDeduction = computeFuneralExpenses(₱400,000, ₱10,000,000, PRE_TRAIN)
                   = min(₱400,000, ₱10,000,000 × 0.05)
                   = min(₱400,000, ₱500,000)
                   = ₱400,000   ← 4× the correct proportional amount

Phase 5 (NEW — correct):
  funeralDeduction = { total: 0 }   // NRA guard

Phase 10 assembleOrdinaryDeductions (NEW):
  line5G = { total: elitResult.funeral } = { total: ₱100,000 }   // correct
```

**Impact**: Old spec overstated NRA funeral deduction by ₱300,000 in this example. For larger estates or higher-deduction scenarios, the overstatement scales with the estate.

---

## `elitResult` Field Contract for NRA Path

After `computeNRAELIT` (Phase 4, NRA path), `elitResult` contains:

| Field | Value |
|-------|-------|
| `claimsAgainstEstate` | `factor × W.claimsAgainstEstate` |
| `claimsVsInsolvent` | `factor × W.claimsVsInsolvent` |
| `unpaidMortgages` | `factor × W.unpaidMortgages` |
| `casualtyLosses` | `factor × W.casualtyLosses` |
| `funeral` | `(deductionRules == PRE_TRAIN) ? factor × W.funeralExpenses : 0` |
| `judicial` | `(deductionRules == PRE_TRAIN) ? factor × W.judicialAdminExpenses : 0` |
| `proportionalFactor` | `PH_gross_estate / worldwide_gross_estate` |

For citizens/residents (non-NRA path), `elitResult` does NOT have `funeral` or `judicial` fields — those are computed separately in Phases 5–6.

---

## Conditions

| Condition | Behavior |
|-----------|----------|
| `isNRA == false`, `deductionRules == TRAIN` | Phase 5 returns zero (TRAIN guard in `computeFuneralExpenses`); Phase 6 returns zero (TRAIN guard in `computeJudicialAdminExpenses`) |
| `isNRA == false`, `deductionRules == PRE_TRAIN` | Phase 5 computes `min(actual, 5% × GE)`; Phase 6 computes actual judicial expenses |
| `isNRA == true`, `deductionRules == TRAIN` | Phase 5–6 skipped (NRA guard returns zero); `elitResult.funeral = 0`, `elitResult.judicial = 0` |
| `isNRA == true`, `deductionRules == PRE_TRAIN` | Phase 5–6 skipped; `elitResult.funeral = factor × worldwide_funeral`, `elitResult.judicial = factor × worldwide_judicial` |

---

## Form 1801 Mapping

Schedule 5, lines 5G and 5H:
- For **citizens/residents**: values from `funeralDeduction` (5G) and `judicialDeduction` (5H)
- For **NRAs**: values from `elitResult.funeral` (5G) and `elitResult.judicial` (5H)
- Form 1801 presentation is identical; the source of the values differs

---

## Edge Cases

| EC | Scenario | Expected Behavior |
|----|----------|------------------|
| EC-01 | NRA, TRAIN regime, funeral input provided | `funeralDeduction = 0`; `elitResult.funeral = 0`; warn user funeral not deductible (TRAIN) |
| EC-02 | NRA, PRE_TRAIN, `W.funeralExpenses = 0` | `elitResult.funeral = 0`; Schedule 5G = ₱0 |
| EC-03 | NRA, PRE_TRAIN, proportional factor = 1.0 (all assets in PH) | `elitResult.funeral = W.funeralExpenses` (no reduction) |
| EC-04 | NRA, PRE_TRAIN, vanishing deduction claimed | `elitForVanishingRatio` correctly includes `elitResult.funeral + elitResult.judicial`; ratio computed correctly |
| EC-05 | Citizen/resident, PRE_TRAIN, `isNonResidentAlien = false` | Phases 5–6 execute normally; `assembleOrdinaryDeductions` uses `funeralDeduction` and `judicialDeduction` |
| EC-06 | NRA, PRE_TRAIN, `totalWorldwideELIT.funeralExpenses` not provided | Default to 0; no funeral deduction on Schedule 5G |
| EC-07 | NRA, PRE_TRAIN, funeral 5% cap would apply if citizen | Cap does NOT apply to NRA path; proportional factor is the only reduction |

**Note on EC-07**: For citizens, funeral is capped at `min(actual, 5% × GE)`. For NRAs, there is no cap — the proportional formula applies directly to the worldwide funeral amount. The 5% cap is a domestic rule in `computeFuneralExpenses`, which is not called for NRAs.

---

## Test Implications

| ID | Test | Expected |
|----|------|---------|
| TI-01 | NRA, PRE_TRAIN, funeral ₱400K worldwide, factor 0.25 → Schedule 5G | ₱100,000 |
| TI-02 | NRA, PRE_TRAIN, funeral ₱400K worldwide, factor 0.25 → vanishing ratio ELIT | includes `₱100,000` from `elitResult.funeral` |
| TI-03 | NRA, TRAIN, funeral ₱400K provided → Schedule 5G | ₱0 (TRAIN removes funeral for all) |
| TI-04 | Citizen, PRE_TRAIN, funeral ₱400K, GE ₱8M → Schedule 5G | `min(400K, 8M×0.05) = min(400K, 400K) = ₱400,000` |
| TI-05 | Citizen, PRE_TRAIN, funeral ₱600K, GE ₱8M → Schedule 5G | `min(600K, 400K) = ₱400,000` (cap applies) |
| TI-06 | NRA, PRE_TRAIN, funeral ₱600K worldwide, GE ₱8M PH, GE ₱32M worldwide | factor = 0.25; `elitResult.funeral = 0.25 × 600K = ₱150,000`; no 5% cap applied |
| TI-07 | `assembleOrdinaryDeductions(isNRA=true)` with `elitResult.funeral=₱100K` | `line5G.total = ₱100,000` (from elitResult, not funeralDeduction) |
| TI-08 | `assembleOrdinaryDeductions(isNRA=false)` with `funeralDeduction.total=₱400K` | `line5G = funeralDeduction` (from Phase 5 computation) |

---

## Summary of Changes to Spec

| Section | Change |
|---------|--------|
| Section 16, Phase 5 | Added NRA guard: `funeralDeduction = 0` for NRAs; comment explaining why |
| Section 16, Phase 6 | Added NRA guard: `judicialDeduction = 0` for NRAs; comment explaining why |
| Section 16, Phase 7 | Split `elitForVanishingRatio` update: NRA path uses `elitResult.funeral + elitResult.judicial`; citizen path uses `funeralDeduction.total + judicialDeduction.total` |
| Section 16, Phase 10 | Added full pseudocode for `assembleOrdinaryDeductions`; added `isNRA` parameter; NRA path sources 5G/5H from `elitResult`; citizen path sources 5G/5H from `funeralDeduction`/`judicialDeduction` |
| Section 16, Critical Ordering Dependencies | Clarified NRA 5G/5H ordering (computed in Phase 4, not Phase 5–6); clarified NRA vanishing ratio uses `elitResult.funeral + elitResult.judicial` |
