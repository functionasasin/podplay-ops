# Analysis: correction-amnesty-deductions

**Aspect**: correction-amnesty-deductions
**Wave**: 2 (Corrections)
**Date Analyzed**: 2026-02-24
**Corrects**: `analysis/deductions-pre-train-diffs.md`
**Legal Sources**: `input/legal-sources/amnesty-provisions.md`, RA 11213 Sec. 3, RA 11213 Sec. 5

---

## Summary

`deductions-pre-train-diffs.md` contained two errors in its engine branching pseudocode:

1. **`getOrdinaryDeductionItems`**: Returned `common` (no funeral, no judicial/admin) for the amnesty path — incorrectly treating amnesty identically to TRAIN-era for all deduction items. For pre-2018 amnesty deaths (`deductionRules == "PRE_TRAIN"`), the full pre-TRAIN deduction set (including funeral and judicial/admin) must be included.

2. **`getSpecialDeductionAmounts`**: Did not accept a `deductionRules` parameter, causing TRAIN-era amnesty estates (2018–2022 deaths covered by RA 11956) to receive pre-TRAIN special deduction amounts (₱1M standard, ₱1M family home cap) rather than TRAIN amounts (₱5M standard, ₱10M family home cap).

Both errors have been corrected in `deductions-pre-train-diffs.md`. This correction file documents the legal basis, the specific code changes, and the computed impact.

---

## Legal Basis for Correction

**RA 11213, Section 3 (definition of "net estate")**:

> "Net estate" means the gross estate minus allowable deductions under the National Internal Revenue Code (NIRC) of 1997, as amended, for deaths occurring on or after January 1, 2018, or **under the NIRC as it existed at the time of death**, for deaths occurring before January 1, 2018.

The critical phrase is "**allowable deductions under the NIRC as it existed at the time of death**." For decedents who died before January 1, 2018, the NIRC in force at the time of death was the pre-TRAIN NIRC (RA 8424 as originally enacted). Under that law:

- **Funeral expenses** were deductible under Sec. 86(A)(1) (lower of actual or 5% of gross estate).
- **Judicial and administrative expenses** were deductible under Sec. 86(A)(1) (actual, no cap).

These deductions existed "under the NIRC at the time of death" for pre-2018 decedents. Therefore, the amnesty computation for pre-2018 deaths **must include funeral and judicial/admin expenses** in the ordinary deductions (full-deduction-set interpretation).

**Additional corroboration**: The worked computation example in `input/legal-sources/amnesty-provisions.md` explicitly includes funeral expenses in the amnesty deduction stack for a 2012 death. This confirms BIR's own published example treats funeral expenses as allowable under amnesty for pre-2018 deaths.

**RA 11956 (coverage expansion)**: RA 11956 expanded amnesty coverage to include estates of decedents who died between January 1, 2018 and May 31, 2022. For these TRAIN-era amnesty deaths, the deduction rules at the time of death are the TRAIN rules (no funeral, no judicial/admin; ₱5M standard deduction; ₱10M family home cap). The `getSpecialDeductionAmounts` function failed to handle this case correctly.

---

## Error 1: `getOrdinaryDeductionItems` — Wrong Amnesty Branch

### Before (Incorrect)

```pseudocode
function getOrdinaryDeductionItems(regime):
  common = [
    "claimsAgainstEstate",
    "claimsVsInsolvent",
    "unpaidMortgagesAndTaxes",
    "casualtyLosses",
    "vanishingDeduction",
    "transfersPublicUse"
  ]

  if regime == "pre_TRAIN":
    return common + ["funeralExpenses", "judicialAdminExpenses"]
  else:
    // TRAIN or amnesty: no funeral/judicial   ← INCORRECT for pre-2018 amnesty deaths
    return common
```

**Error**: The `else` branch groups TRAIN and amnesty together, returning `common` for both. Pre-2018 amnesty deaths should include funeral and judicial/admin expenses.

### After (Corrected)

```pseudocode
function getOrdinaryDeductionItems(regime, deductionRules):
  // deductionRules: "PRE_TRAIN" | "TRAIN"
  //   - For regime == "pre_TRAIN":   always "PRE_TRAIN"
  //   - For regime == "amnesty":     determined by date of death
  //       pre-2018 deaths    → "PRE_TRAIN"
  //       2018-2022 deaths   → "TRAIN"  (RA 11956 expansion)
  //   - For regime == "TRAIN":       always "TRAIN"

  common = [
    "claimsAgainstEstate",
    "claimsVsInsolvent",
    "unpaidMortgagesAndTaxes",
    "casualtyLosses",
    "vanishingDeduction",
    "transfersPublicUse"
  ]

  if (regime == "pre_TRAIN") OR (regime == "amnesty" AND deductionRules == "PRE_TRAIN"):
    // Pre-TRAIN path, OR pre-2018 amnesty death:
    // RA 11213 Sec. 3: "allowable deductions under the NIRC at the time of death"
    // For pre-2018 deaths, funeral and judicial/admin were allowable.
    return common + ["funeralExpenses", "judicialAdminExpenses"]

  else:
    // TRAIN-era regular computation, OR amnesty with TRAIN deduction rules (2018-2022 deaths):
    // Funeral and judicial/admin not allowable under TRAIN-era NIRC.
    return common
```

---

## Error 2: `getSpecialDeductionAmounts` — Missing `deductionRules` Parameter

### Before (Incorrect)

```pseudocode
function getSpecialDeductionAmounts(decedent, regime):
  amounts = {}

  if decedent.isNonResidentAlien:
    amounts.standardDeduction = 500_000
  elif regime == "TRAIN":
    amounts.standardDeduction = 5_000_000
  else:  // pre_TRAIN or amnesty (pre-2018 death)  ← INCOMPLETE: misses TRAIN-era amnesty deaths
    amounts.standardDeduction = 1_000_000

  if regime == "TRAIN":
    amounts.familyHomeCap = 10_000_000
  else:  // pre_TRAIN or amnesty   ← INCORRECT: amnesty 2018-2022 deaths should use ₱10M cap
    amounts.familyHomeCap = 1_000_000

  amounts.medicalExpensesCap = 500_000
  return amounts
```

**Error**: For TRAIN-era amnesty estates (2018–2022 deaths), `regime == "amnesty"` and the function falls into the `else` branch, applying:
- Standard deduction: ₱1,000,000 (should be ₱5,000,000)
- Family home cap: ₱1,000,000 (should be ₱10,000,000)

### After (Corrected)

```pseudocode
function getSpecialDeductionAmounts(decedent, regime, deductionRules):
  // deductionRules: "PRE_TRAIN" | "TRAIN" — same semantics as getOrdinaryDeductionItems

  amounts = {}

  // Standard deduction
  if decedent.isNonResidentAlien:
    amounts.standardDeduction = 500_000  // ₱500K for NRAs, unchanged across all regimes

  elif (regime == "TRAIN") OR (regime == "amnesty" AND deductionRules == "TRAIN"):
    // Regular TRAIN, or amnesty covering TRAIN-era deaths (2018–2022, per RA 11956)
    amounts.standardDeduction = 5_000_000

  else:
    // Pre-TRAIN regular, or amnesty covering pre-2018 deaths
    amounts.standardDeduction = 1_000_000

  // Family home cap
  if (regime == "TRAIN") OR (regime == "amnesty" AND deductionRules == "TRAIN"):
    amounts.familyHomeCap = 10_000_000
  else:
    // Pre-TRAIN, or amnesty with pre-TRAIN deduction rules
    amounts.familyHomeCap = 1_000_000

  // Medical expenses cap — identical across all regimes and deductionRules values
  amounts.medicalExpensesCap = 500_000

  return amounts
```

---

## Error 3: Individual Computation Function Guards

The standalone deduction functions also had guards that would incorrectly zero out the deduction for the amnesty path:

### `computeFuneralExpenseDeduction` — Before (Incorrect)

```pseudocode
function computeFuneralExpenseDeduction(actual_expenses, gross_estate, regime):
  if regime != "pre_TRAIN":
    return 0  // Not deductible under TRAIN or amnesty   ← INCORRECT for pre-2018 amnesty
  ...
```

### `computeFuneralExpenseDeduction` — After (Corrected)

```pseudocode
function computeFuneralExpenseDeduction(actual_expenses, gross_estate, regime, deductionRules):
  // Not deductible under TRAIN-era, or under amnesty for 2018-2022 deaths
  if NOT ((regime == "pre_TRAIN") OR (regime == "amnesty" AND deductionRules == "PRE_TRAIN")):
    return 0

  limit_pct  = gross_estate * 0.05
  deductible = min(actual_expenses, limit_pct)
  return deductible
```

### `computeJudicialAdminExpenseDeduction` — Before (Incorrect)

```pseudocode
function computeJudicialAdminExpenseDeduction(expenses, regime):
  if regime != "pre_TRAIN":
    return 0  // Not deductible under TRAIN or amnesty   ← INCORRECT for pre-2018 amnesty
  ...
```

### `computeJudicialAdminExpenseDeduction` — After (Corrected)

```pseudocode
function computeJudicialAdminExpenseDeduction(expenses, regime, deductionRules):
  if NOT ((regime == "pre_TRAIN") OR (regime == "amnesty" AND deductionRules == "PRE_TRAIN")):
    return 0

  total = 0
  for each expense in expenses:
    validate:
      expense.relatedToEstateSettlement = true
      expense.amount > 0
    total += expense.amount
  return total
```

---

## `deductionRules` Parameter: Where It Comes From

The `deductionRules` value is set by the regime detection and eligibility layers:

```pseudocode
// Set by amnesty-eligibility.md when regime == "amnesty":
if decedent.dateOfDeath < 2018-01-01:
  eligibility.deductionRules = "PRE_TRAIN"
elif decedent.dateOfDeath <= 2022-05-31:
  eligibility.deductionRules = "TRAIN"

// For non-amnesty regimes:
if regime == "TRAIN":
  deductionRules = "TRAIN"
elif regime == "pre_TRAIN":
  deductionRules = "PRE_TRAIN"

// Then passed through to all branching functions:
getOrdinaryDeductionItems(regime, deductionRules)
getSpecialDeductionAmounts(decedent, regime, deductionRules)
computeFuneralExpenseDeduction(..., regime, deductionRules)
computeJudicialAdminExpenseDeduction(..., regime, deductionRules)
```

This means `regime` and `deductionRules` carry overlapping information for non-amnesty estates, but both are required for full amnesty coverage:

| `regime` | `deductionRules` | Funeral/Judicial? | Standard Deduction | Family Home Cap |
|---|---|---|---|---|
| `"TRAIN"` | `"TRAIN"` | No | ₱5,000,000 | ₱10,000,000 |
| `"pre_TRAIN"` | `"PRE_TRAIN"` | Yes | ₱1,000,000 | ₱1,000,000 |
| `"amnesty"` | `"PRE_TRAIN"` | Yes | ₱1,000,000 | ₱1,000,000 |
| `"amnesty"` | `"TRAIN"` | No | ₱5,000,000 | ₱10,000,000 |

---

## Impact on Computed Tax

### Impact of Error 1 (funeral/judicial excluded from pre-2018 amnesty)

Using Example 1 from `amnesty-computation.md`: Filipino citizen, died 2012, gross estate ₱8M, claims ₱400K, funeral expenses ₱300K (actual < ₱400K limit), judicial/admin ₱100K.

| | Incorrect (no funeral/judicial) | Correct (full pre-TRAIN set) |
|---|---|---|
| Ordinary deductions | ₱400,000 | ₱800,000 |
| Net estate after ordinary | ₱7,600,000 | ₱7,200,000 |
| Standard deduction (pre-TRAIN) | ₱1,000,000 | ₱1,000,000 |
| Family home deduction | ₱1,000,000 | ₱1,000,000 |
| Net estate (Item 38) | ₱5,600,000 | ₱5,200,000 |
| Net taxable estate (no spouse) | ₱5,600,000 | ₱5,200,000 |
| Amnesty tax (6%) | ₱336,000 | ₱312,000 |
| **Overstatement** | **₱24,000** | — |

The incorrect code overstates the amnesty tax by ₱24,000 in this example (7.7% overstatement). For estates with large funeral or judicial expense deductions, the overstatement grows proportionally.

### Impact of Error 2 (wrong standard deduction and family home cap for TRAIN-era amnesty)

For a TRAIN-era amnesty estate (death: 2021, citizen/resident, gross estate ₱12M, no spouse, no other deductions):

| | Incorrect (₱1M standard) | Correct (₱5M standard) |
|---|---|---|
| Standard deduction | ₱1,000,000 | ₱5,000,000 |
| Net taxable estate | ₱11,000,000 | ₱7,000,000 |
| Amnesty tax (6%) | ₱660,000 | ₱420,000 |
| **Overstatement** | **₱240,000** | — |

The incorrect code overstates the amnesty tax by ₱240,000 in this example (57% overstatement) — a serious error for TRAIN-era amnesty estates.

---

## Consistency Check with `amnesty-computation.md`

The `computeAmnestyDeductionsPreTRAIN` function in `amnesty-computation.md` already implements the correct behavior — it directly computes funeral and judicial/admin expenses without passing through `getOrdinaryDeductionItems`:

```pseudocode
// From amnesty-computation.md (already correct):
function computeAmnestyDeductionsPreTRAIN(decedent, grossEstate, input):
  ...
  // PRE-TRAIN ONLY: Funeral Expenses
  funeralLimit          = grossEstate.total * 0.05
  d.funeralExpenses     = min(input.funeralExpenses.actualAmount, funeralLimit)

  // PRE-TRAIN ONLY: Judicial/Administrative Expenses
  d.judicialAdminExpenses = sum(expense.amount for expense in input.judicialAdminExpenses)
  ...
```

The `deductions-pre-train-diffs.md` routing functions (`getOrdinaryDeductionItems`, `getSpecialDeductionAmounts`) are used by the engine's UI layer (to determine which input fields to show the user) and by the `pre-train-computation-flow.md` pipeline. The corrections ensure the routing layer matches the computation layer already implemented in `amnesty-computation.md`.

---

## Incorrect Relationship Note Corrected

`deductions-pre-train-diffs.md` previously stated in its "Relationship to Other Aspects" section:

> **amnesty-computation**: The amnesty path does NOT include funeral expenses or judicial/admin expenses as deductions — even though these estates died pre-2018 and would have qualified for these deductions under the regular pre-TRAIN rules. The amnesty law restricts deductions to a more limited set. This distinction is critical.

This was incorrect. The corrected note reads:

> **amnesty-computation**: For pre-2018 amnesty deaths (`deductionRules == "PRE_TRAIN"`), the full pre-TRAIN deduction set applies — including funeral expenses and judicial/admin expenses (RA 11213 Sec. 3: "allowable deductions under the NIRC at the time of death"). For TRAIN-era amnesty deaths (2018–2022, `deductionRules == "TRAIN"`), TRAIN deduction rules apply (no funeral, no judicial/admin). The `getOrdinaryDeductionItems` and `getSpecialDeductionAmounts` functions accept a `deductionRules` parameter to handle all four regime/deductionRules combinations correctly. See `analysis/correction-amnesty-deductions.md`.

---

## Test Implications

| Test ID | Scenario | Expected Result |
|---|---|---|
| COR-AD-01 | Pre-2018 amnesty death, funeral ₱300K, judicial ₱100K, gross ₱8M | Both deductions included; amnesty tax = ₱312,000 (not ₱336,000) |
| COR-AD-02 | Pre-2018 amnesty death, no funeral or judicial expenses | Deduction items present but = ₱0; same result as before correction |
| COR-AD-03 | TRAIN-era amnesty death (2021), citizen, gross ₱12M, no other deductions | Standard deduction = ₱5M (not ₱1M); amnesty tax = ₱420,000 (not ₱660,000) |
| COR-AD-04 | TRAIN-era amnesty death (2021), funeral expenses entered | Engine zeros funeral to ₱0 with warning (not deductible under TRAIN rules) |
| COR-AD-05 | TRAIN-era amnesty death (2020), family home FMV ₱8M | Family home cap = ₱10M (not ₱1M); deduction = ₱4M (conjugal, ½ of ₱8M) |
| COR-AD-06 | Pre-2018 amnesty death, family home FMV ₱3M exclusive | Family home cap = ₱1M (pre-TRAIN); deduction = ₱1M (not ₱3M) |
| COR-AD-07 | `getOrdinaryDeductionItems("amnesty", "PRE_TRAIN")` | Returns common + ["funeralExpenses", "judicialAdminExpenses"] |
| COR-AD-08 | `getOrdinaryDeductionItems("amnesty", "TRAIN")` | Returns common only (no funeral/judicial) |
| COR-AD-09 | `getSpecialDeductionAmounts(citizen, "amnesty", "TRAIN")` | standardDeduction = ₱5,000,000; familyHomeCap = ₱10,000,000 |
| COR-AD-10 | `getSpecialDeductionAmounts(citizen, "amnesty", "PRE_TRAIN")` | standardDeduction = ₱1,000,000; familyHomeCap = ₱1,000,000 |

---

## Summary

Three functions in `deductions-pre-train-diffs.md` were corrected:

1. **`getOrdinaryDeductionItems(regime, deductionRules)`**: Now correctly includes `["funeralExpenses", "judicialAdminExpenses"]` when `regime == "amnesty" AND deductionRules == "PRE_TRAIN"`.

2. **`getSpecialDeductionAmounts(decedent, regime, deductionRules)`**: Now correctly applies TRAIN special deduction amounts (₱5M standard, ₱10M family home cap) when `regime == "amnesty" AND deductionRules == "TRAIN"`.

3. **`computeFuneralExpenseDeduction` and `computeJudicialAdminExpenseDeduction`**: Guard conditions updated to accept amnesty + PRE_TRAIN path.

The corrections do not change non-amnesty computations. Pre-TRAIN regular estates and TRAIN regular estates remain unaffected. The `amnesty-computation.md` computation functions were already correct; these corrections align the routing/branching layer with the computation layer.
