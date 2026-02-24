# Analysis: Pre-TRAIN Deduction Differences

**Aspect**: deductions-pre-train-diffs
**Wave**: 3 — Pre-TRAIN Rule Extraction
**Date Analyzed**: 2026-02-24
**Legal Sources**: `input/legal-sources/pre-train-rates.md`, `input/legal-sources/nirc-title-iii.md`
**Cross-references**: `analysis/deduction-elit.md`, `analysis/deduction-standard.md`, `analysis/deduction-family-home.md`, `analysis/deduction-medical.md`

---

## Purpose

This aspect documents every deduction rule that **differs** between the pre-TRAIN regime (deaths before January 1, 2018) and the TRAIN-era regime (deaths on or after January 1, 2018). It provides the complete pre-TRAIN deduction pipeline for the computation engine, clearly marking which items are exclusive to pre-TRAIN, which have different amounts, and which are identical across regimes.

---

## Summary of Differences

| Deduction Item | Pre-TRAIN (death < 2018-01-01) | TRAIN-Era (death ≥ 2018-01-01) | Regime-Specific? |
|---|---|---|---|
| **Funeral Expenses** | **Deductible** (lower of actual or 5% of gross estate) | **NOT deductible** | **PRE-TRAIN ONLY** |
| **Judicial/Admin Expenses** | **Deductible** (actual, no cap) | **NOT deductible** | **PRE-TRAIN ONLY** |
| **Standard Deduction** | **₱1,000,000** (citizens/residents) | **₱5,000,000** (citizens/residents) | Different amounts |
| **Family Home Cap** | **₱1,000,000** | **₱10,000,000** | Different caps |
| Medical Expenses | ₱500,000 cap, 1-year window, official receipts | Same | **IDENTICAL** |
| Claims Against Estate | Fully deductible (documented) | Same | **IDENTICAL** |
| Claims vs. Insolvent | Uncollectible portion, cross-referenced | Same | **IDENTICAL** |
| Unpaid Mortgages/Taxes | Fully deductible | Same | **IDENTICAL** |
| Casualty Losses | Net of insurance, during settlement | Same | **IDENTICAL** |
| Vanishing Deduction | 100%/80%/60%/40%/20% table | Same | **IDENTICAL** |
| Transfers for Public Use | Bequest to government (public use) | Same | **IDENTICAL** |
| RA 4917 Benefits | Employer death benefits | Same | **IDENTICAL** |
| Surviving Spouse Share | 50% of net conjugal/communal | Same | **IDENTICAL** |
| NRA Standard Deduction | ₱500,000 | ₱500,000 | **IDENTICAL** |

---

## Pre-TRAIN-Only Deduction 1: Funeral Expenses

### Legal Basis

**NIRC Section 86(A)(1) (pre-TRAIN)** — Expenses, Losses, Indebtedness, and Taxes:

> "Funeral expenses to the extent of ₱200,000 or 5% of the gross estate, whichever is lower."

**Note on cap**: The primary source (`pre-train-rates.md`) states the rule as "lower of actual or 5% of gross estate" with no stated separate peso cap in some texts. The "₱200,000 or 5% of gross estate" formulation is widely cited in Philippine tax commentaries for the original RA 8424 provision. Some sources omit the ₱200,000 absolute ceiling, relying solely on the 5% limit. The most conservative and commonly accepted formulation is:

> **Deductible amount = min(actual funeral expenses, 5% × gross estate)**

There is no separately-stated ₱200,000 monetary ceiling in the NIRC text; the 5% of gross estate acts as the ceiling. For small estates (gross estate ≤ ₱4,000,000), the 5% limit is ≤ ₱200,000 — the ₱200,000 figure appears in older BIR forms as a practical ceiling for small-estate cases where actual expenses are the binding constraint.

**TRAIN Removal**: RA 10963 (TRAIN Law, effective January 1, 2018) deleted funeral expenses from the list of deductible items. The NIRC text post-TRAIN under Sec. 86(A)(1) makes no mention of funeral expenses.

### What Constitutes Funeral Expenses

Qualifying funeral expenses include:
- Embalming and preparation of the remains
- Casket, urn, or cremation services
- Burial plot or columbarium niche (purchase cost)
- Hearse and transportation of remains
- Funeral service fees (funeral parlor)
- Obituary publication costs
- Repast/interment reception (a debated item — some BIR rulings allow, some limit)
- Flowers for the funeral

**Does NOT include**:
- Post-burial repast expenses beyond the initial interment
- Memorial masses after burial (these are ongoing religious expenses, not funeral expenses)
- Medical expenses prior to death (separate deduction item)
- Monument / tomb / mausoleum construction (capital expenditure; questionable deductibility)

### Rule (Pseudocode)

```
// Applicable ONLY when regime == "pre_TRAIN"
// i.e., decedent.dateOfDeath < 2018-01-01

function computeFuneralExpenseDeduction(actual_expenses, gross_estate_total, regime):

  if regime != "pre_TRAIN":
    return 0  // Not deductible under TRAIN or amnesty

  // Deductible amount = lower of actual expenses or 5% of gross estate
  limit_pct = gross_estate_total * 0.05
  deductible = min(actual_expenses, limit_pct)

  return deductible

// Input fields required (pre-TRAIN estates only):
input.funeralExpenses = {
  actualAmount:    number,   // Total actual funeral expenses (peso amount)
  receiptsProvided: boolean  // Whether receipts are available (documentation)
}

// Output:
deductions.funeralExpenses = computeFuneralExpenseDeduction(
  input.funeralExpenses.actualAmount,
  grossEstate.total.total,   // Item 34, Column C
  regime
)
```

### Important: Gross Estate at Time of Funeral Deduction Computation

The 5% is computed against the **gross estate total** (Item 34, Column C) — the total before any deductions are applied. This creates a circular dependency risk in the computation if the engine processes deductions before finalizing Item 34. The engine must finalize all gross estate items first (Item 34), then compute the 5% limit for funeral expenses.

```
// Correct order of operations:
Step 1: Compute Item 34 (gross estate total) — ALL gross estate items
Step 2: Compute funeral expense deduction limit = Item 34 × 0.05
Step 3: Apply funeral deduction = min(actual, limit)
Step 4: Compute remaining ordinary deductions
Step 5: Sum all ordinary deductions → Item 35
```

### Form Mapping (Pre-TRAIN Form 1801, June 2006 revision)

Pre-TRAIN Form 1801 (June 2006) had a dedicated line for funeral expenses in Schedule 5 (Ordinary Deductions). The TRAIN-era form (January 2018 revision) removed this line entirely.

For the engine's pre-TRAIN computation output, the funeral expense deduction is placed in the ordinary deductions section, before the subtotal:

| Pre-TRAIN Computation Field | Description | Formula |
|---|---|---|
| `preTrainComputation.funeralExpenses` | Funeral expense deduction | `min(actual, grossTotal × 0.05)` |
| Ordinary Deductions subtotal | Includes funeralExpenses | Sum of all ordinary deduction items |

**Engine output label**: "Funeral Expenses (Pre-TRAIN)" — clearly labeled as a pre-TRAIN item so the output does not confuse TRAIN-era users.

### Column Structure (Exclusive vs. Conjugal)

Funeral expenses are shared conjugal/communal obligations in most cases (burial is paid from community funds). However, they can be exclusive property obligations in some situations (e.g., a pre-marital life insurance payout used for funeral expenses, or a bachelor decedent with only exclusive property).

The engine should allow the user to classify funeral expenses as exclusive or conjugal:

```
input.funeralExpenses.ownership = "exclusive" | "conjugal"
// Default if unknown: "conjugal" (most common for married decedents)

if input.funeralExpenses.ownership == "exclusive":
  preTrainComputation.funeralExpenses.exclusive = deductible
  preTrainComputation.funeralExpenses.conjugal  = 0
elif input.funeralExpenses.ownership == "conjugal":
  preTrainComputation.funeralExpenses.exclusive = 0
  preTrainComputation.funeralExpenses.conjugal  = deductible
```

---

## Pre-TRAIN-Only Deduction 2: Judicial and Administrative Expenses

### Legal Basis

**NIRC Section 86(A)(1) (pre-TRAIN)** — Expenses, Losses, Indebtedness, and Taxes:

> "Judicial expenses of the testate or intestate proceedings."

This provision encompassed ALL expenses incurred in settling the estate through judicial (court-supervised) or extrajudicial (non-court) proceedings.

**TRAIN Removal**: RA 10963 removed judicial and administrative expenses from the deductible items effective January 1, 2018.

### What Constitutes Judicial/Administrative Expenses

**Qualifying expenses include**:
- Attorney's fees for estate settlement legal proceedings
- Court filing fees and other court costs
- Executor's/administrator's commission or fees
- Accountant's fees for preparation of estate tax returns and accountings
- Appraisal fees (for valuing estate assets for settlement purposes)
- Notarial fees for estate documents
- Publication costs for legal notices (e.g., notice to creditors)
- Clerk of court fees, sheriff's fees
- Bond premiums (surety bonds for administrator/executor)
- Cost of obtaining documents (title transfers, certified copies of records)

**Does NOT include**:
- Ongoing business operating expenses of estate-owned businesses
- Personal expenses of heirs
- Expenses unrelated to estate settlement
- Funeral expenses (separate deduction item)

**No monetary cap**: Judicial/administrative expenses are deductible at their full actual amount. There is no percentage limit or peso cap. However, expenses must be reasonable and actually incurred in connection with estate settlement.

### Rule (Pseudocode)

```
// Applicable ONLY when regime == "pre_TRAIN"
// i.e., decedent.dateOfDeath < 2018-01-01

function computeJudicialAdminExpenseDeduction(expenses, regime):

  if regime != "pre_TRAIN":
    return 0  // Not deductible under TRAIN or amnesty

  total = 0
  for each expense in expenses:
    // Validate: expense is related to estate settlement
    // Engine relies on user attestation; no algorithmic verification possible
    validate:
      expense.relatedToEstatSettlement = true  // user-affirmed
      expense.amount > 0

    total += expense.amount

  return total

// Input fields required (pre-TRAIN estates only):
input.judicialAdminExpenses: array of {
  description: string,   // e.g., "Attorney's fees — Atty. Juan Cruz"
  amount:      number,   // Peso amount
  dateIncurred: date,    // Date of expense
  relatedToEstateSettlement: boolean  // User-affirmed
}

// Output:
deductions.judicialAdminExpenses = computeJudicialAdminExpenseDeduction(
  input.judicialAdminExpenses,
  regime
)
```

### Timing: Expenses Incurred During Settlement

Unlike casualty losses (which must have already occurred by filing time), judicial/administrative expenses may be partially prospective. Expenses actually incurred up to the **date of filing the estate tax return** are deductible. BIR practice allows estimates of ongoing legal fees when the proceedings are still active, but the amount must be reasonable and based on actual engagement terms (retainer agreement, court schedule).

**Engine rule**: Accept user-provided amounts for judicial/administrative expenses. The engine does not compute these; the user provides the total.

### Column Structure

Judicial/administrative expenses are typically conjugal/communal obligations for married decedents. Same logic as funeral expenses:

```
input.judicialAdminExpenses.ownership = "exclusive" | "conjugal"
// Default if unknown: "conjugal"
```

### Form Mapping

Same position as funeral expenses: included in Schedule 5 Ordinary Deductions of the pre-TRAIN Form 1801.

| Pre-TRAIN Computation Field | Description | Formula |
|---|---|---|
| `preTrainComputation.judicialAdminExpenses` | Judicial/admin expense deduction | Sum of qualifying actual expenses |

---

## Deductions with Different Amounts (Cross-References)

### Standard Deduction — Amount Differs

Full rule documented in `analysis/deduction-standard.md`. Summary for engine branching:

```
// In pre-TRAIN computation:
if decedent.isNonResidentAlien:
  standardDeduction = 500_000       // Same as TRAIN
else:
  standardDeduction = 1_000_000     // PRE-TRAIN amount (vs. ₱5M in TRAIN)
```

### Family Home Deduction — Cap Differs

Full rule documented in `analysis/deduction-family-home.md`. Summary for engine branching:

```
// In pre-TRAIN computation:
if family_home.ownership == "exclusive":
  applicable_fmv = family_home.fmv
elif family_home.ownership in ("conjugal", "communal"):
  applicable_fmv = family_home.fmv * 0.5

cap = 1_000_000  // PRE-TRAIN cap (vs. ₱10M in TRAIN)
family_home_deduction = min(applicable_fmv, cap)
```

---

## Complete Pre-TRAIN Ordinary Deduction Pipeline

The full set of ordinary deductions (Schedule 5 equivalent) for pre-TRAIN estates:

```
// Pre-TRAIN ordinary deductions — all items:

// 5A — Claims Against the Estate (same as TRAIN)
preTrainOrdinary.claimsAgainstEstate = computeClaimsAgainstEstate(input.claimsAgainstEstate)

// 5B — Claims vs. Insolvent Persons (same as TRAIN)
preTrainOrdinary.claimsVsInsolvent = computeClaimsVsInsolvent(input.claimsVsInsolvent)

// 5C — Unpaid Mortgages and Taxes (same as TRAIN)
preTrainOrdinary.unpaidMortgagesAndTaxes = computeUnpaidMortgages(input.unpaidMortgages)
                                         + computeUnpaidTaxes(input.unpaidTaxes)

// 5D — Casualty Losses (same as TRAIN)
preTrainOrdinary.casualtyLosses = computeCasualtyLosses(input.casualtyLosses)

// 5E — Vanishing Deduction (same as TRAIN)
preTrainOrdinary.vanishingDeduction = computeVanishingDeduction(...)

// 5F — Transfers for Public Use (same as TRAIN; proportional for NRAs)
preTrainOrdinary.transfersPublicUse = computeTransfersPublicUse(...)

// PRE-TRAIN ONLY: Funeral Expenses
preTrainOrdinary.funeralExpenses = computeFuneralExpenseDeduction(
  input.funeralExpenses.actualAmount,
  grossEstate.total.total,    // Item 34 — MUST be computed first
  "pre_TRAIN"
)

// PRE-TRAIN ONLY: Judicial/Administrative Expenses
preTrainOrdinary.judicialAdminExpenses = computeJudicialAdminExpenseDeduction(
  input.judicialAdminExpenses,
  "pre_TRAIN"
)

// Total pre-TRAIN ordinary deductions (Item 35 equivalent):
preTrainOrdinary.total = {
  exclusive: sum of all exclusive components,
  conjugal:  sum of all conjugal components,
  total:     exclusive + conjugal
}
```

## Complete Pre-TRAIN Special Deduction Pipeline

The special deductions (Schedule 6 equivalent) for pre-TRAIN estates:

```
// Pre-TRAIN special deductions:

// 6A — Standard Deduction (DIFFERENT AMOUNT from TRAIN)
preTrainSpecial.standardDeduction = 1_000_000   // citizens/residents
                                  = 500_000     // NRAs (same as TRAIN)

// 6B — Family Home Deduction (DIFFERENT CAP from TRAIN)
preTrainSpecial.familyHomeDeduction = min(applicable_fmv, 1_000_000)  // cap = ₱1M

// 6C — Medical Expenses (SAME as TRAIN)
preTrainSpecial.medicalExpenses = min(qualifying_expenses, 500_000)

// 6D — RA 4917 Benefits (SAME as TRAIN)
preTrainSpecial.ra4917Benefits = input.ra4917Benefits

// Total pre-TRAIN special deductions (Item 37 equivalent):
preTrainSpecial.total = standardDeduction + familyHomeDeduction + medicalExpenses + ra4917Benefits
```

---

## Complete Pre-TRAIN Computation Sequence (Items 34–44)

```
// ---- GROSS ESTATE ----
// Items 29–34: Computed using same rules as TRAIN (worldwide for citizens/residents;
//              PH-situs only for NRAs). See gross-estate-citizens.md / gross-estate-nonresident.md
item34 = grossEstate.total.total   // Sum of Items 29+30+31+32+33

// ---- ORDINARY DEDUCTIONS ----
// Pre-TRAIN adds funeral + judicial/admin to the TRAIN-era ELIT items
// Compute funeral expense limit using item34 BEFORE ordinary deductions:
funeralLimit = item34 * 0.05
funeralDeduction = min(input.funeralExpenses.actualAmount, funeralLimit)

item35 = preTrainOrdinary.total   // Includes funeral + judicial/admin (extra pre-TRAIN items)

item36 = max(0, item34 - item35)  // Estate after ordinary deductions (floored at 0)

// ---- SPECIAL DEDUCTIONS ----
item37A = preTrainSpecial.standardDeduction   // ₱1M (citizens/residents) or ₱500K (NRAs)
item37B = preTrainSpecial.familyHomeDeduction // min(applicable_fmv, ₱1M)
item37C = preTrainSpecial.medicalExpenses     // min(qualifying_expenses, ₱500K)
item37D = preTrainSpecial.ra4917Benefits      // Actual amount
item37  = item37A + item37B + item37C + item37D

item38 = max(0, item36 - item37)  // Net estate (floored at 0)

// ---- SURVIVING SPOUSE SHARE ----
item39 = survivingSpouseShare   // 50% of net conjugal/communal (same as TRAIN)
                                 // See surviving-spouse-share.md

item40 = max(0, item38 - item39)  // Net taxable estate

// ---- TAX COMPUTATION ----
// DIFFERENT from TRAIN: apply graduated schedule, not flat 6%
item42 = computePreTrainEstateTax(item40)   // See tax-rate-pre-train.md
         // Returns 0 if item40 <= ₱200,000
         // Otherwise: bracket computation

item43 = foreignTaxCredit   // Same credit rules as TRAIN (citizens/residents only)
item44 = max(0, item42 - item43)   // Net estate tax due
```

---

## Engine Branching Logic

The engine switches deduction rules based on `decedent.dateOfDeath`:

```
function getOrdinaryDeductionItems(regime):
  // Items common to all regimes:
  common = [
    "claimsAgainstEstate",      // 5A
    "claimsVsInsolvent",        // 5B
    "unpaidMortgagesAndTaxes",  // 5C
    "casualtyLosses",           // 5D
    "vanishingDeduction",       // 5E
    "transfersPublicUse"        // 5F
  ]

  if regime == "pre_TRAIN":
    // Add pre-TRAIN-only items
    return common + ["funeralExpenses", "judicialAdminExpenses"]
  else:
    // TRAIN or amnesty: no funeral/judicial
    return common

function getSpecialDeductionAmounts(decedent, regime):
  amounts = {}

  // Standard deduction
  if decedent.isNonResidentAlien:
    amounts.standardDeduction = 500_000
  elif regime == "TRAIN":
    amounts.standardDeduction = 5_000_000
  else:  // pre_TRAIN or amnesty (pre-2018 death)
    amounts.standardDeduction = 1_000_000

  // Family home cap
  if regime == "TRAIN":
    amounts.familyHomeCap = 10_000_000
  else:  // pre_TRAIN or amnesty
    amounts.familyHomeCap = 1_000_000

  // Medical expenses cap: same across all regimes
  amounts.medicalExpensesCap = 500_000

  return amounts
```

---

## Conditions

| Item | Pre-TRAIN Condition | Notes |
|------|---------------------|-------|
| Funeral Expenses | Date of death before January 1, 2018 | Deductible at lower of actual or 5% of gross estate |
| Funeral Expenses | No separate ₱200,000 floor stated in NIRC | Limit is purely 5% of gross estate |
| Funeral Expenses | Documentation: receipts preferred but not explicitly required in statute | BIR practice: itemized list with amounts; official receipts preferred |
| Judicial/Admin | Date of death before January 1, 2018 | No cap; actual expenses |
| Judicial/Admin | Expenses incurred during estate settlement (up to filing date) | Must be related to estate settlement |
| Judicial/Admin | User attestation that expenses are estate-related | Engine cannot verify |

---

## Edge Cases

### 1. Gross Estate = ₱0 at Time of Funeral Deduction Computation

If the gross estate total (Item 34) is somehow ₱0, the 5% funeral expense limit = ₱0, and funeral deduction = ₱0 regardless of actual expenses. This is a corner case for very small or completely depleted estates.

```
gross_estate = 0
funeral_limit = 0 * 0.05 = 0
funeral_deduction = min(actual, 0) = 0
```

### 2. Actual Funeral Expenses Exceed 5% Limit

A large estate (₱20M gross) with ₱2M in actual funeral expenses:
```
funeral_limit = 20_000_000 * 0.05 = 1_000_000
funeral_deduction = min(2_000_000, 1_000_000) = 1_000_000
```
The excess ₱1M provides no tax benefit. The engine should display both the actual amount and the deductible amount to the user.

### 3. Actual Funeral Expenses Below 5% Limit

A small estate (₱2M gross) with ₱50,000 in actual funeral expenses:
```
funeral_limit = 2_000_000 * 0.05 = 100_000
funeral_deduction = min(50_000, 100_000) = 50_000
```
Actual expenses are the binding constraint; full amount is deductible.

### 4. Judicial Expenses Incurred After Filing

If judicial proceedings extend beyond the estate tax filing date, only expenses actually incurred up to the filing date are deductible. Future litigation costs cannot be deducted on the estate tax return.

### 5. Pre-TRAIN Estate With Zero Judicial Expenses (Extrajudicial Settlement)

Many estates are settled extrajudicially (by agreement among heirs, no court involvement). In that case, `input.judicialAdminExpenses = []` and `deductions.judicialAdminExpenses = 0`. Only notary and document-processing fees would qualify. This is valid — the deduction is simply ₱0 if no qualifying expenses were incurred.

### 6. Funeral Expenses on TRAIN-Era Estate (User Error)

If a user provides funeral expense data for a TRAIN-era estate (death ≥ 2018-01-01), the engine must:
1. Zero out the deduction: `deductions.funeralExpenses = 0`
2. Display an explicit warning: "Funeral expenses are not deductible under TRAIN Law (RA 10963) for deaths on or after January 1, 2018."
3. Do NOT silently drop the input — the user must be informed.

### 7. Judicial Expenses on TRAIN-Era Estate (User Error)

Same handling as funeral expenses on TRAIN estate. Zero out + warning.

### 8. Family Home FMV ₱2M (Pre-TRAIN, Exclusive): Full FMV Exceeds Pre-TRAIN Cap

```
fmv = 2_000_000
cap = 1_000_000  // pre-TRAIN cap
ownership = "exclusive"
applicable_fmv = 2_000_000
family_home_deduction = min(2_000_000, 1_000_000) = 1_000_000
```
The remaining ₱1M of family home value stays in the taxable estate.

### 9. Pre-TRAIN Standard Deduction Applied to Small Estate

Estate with gross ₱800K after ordinary deductions (Item 36 = ₱800K). Standard deduction = ₱1M. Net estate = max(0, ₱800K − ₱1M) = ₱0. Tax = ₱0. The pre-TRAIN standard deduction is large enough to zero out many small estates.

### 10. Funeral Expenses + Judicial Expenses Combined

An estate with:
- Actual funeral expenses: ₱300,000
- 5% of gross estate: ₱250,000 → funeral deduction = ₱250,000
- Judicial/admin expenses: ₱150,000

```
ordinary_deductions += ₱250,000  // funeral (capped)
ordinary_deductions += ₱150,000  // judicial (full)
```
Both are separate line items in ordinary deductions. Total additional pre-TRAIN-only deductions: ₱400,000.

### 11. NRA and Pre-TRAIN Deductions

For non-resident alien decedents under pre-TRAIN:
- Standard deduction: ₱500,000 (same as TRAIN; no change)
- Family home: ₱0 (NRAs ineligible — same as TRAIN)
- Funeral expenses: Proportional deduction applies (per Sec. 86(B); same proportional formula as for ELIT items)
- Judicial/admin expenses: Proportional deduction applies

The Sec. 86(B) proportional formula (see `analysis/nonresident-deductions.md`) applies to ALL ordinary deductions for NRAs, including the pre-TRAIN-only items.

### 12. Pre-TRAIN vs. TRAIN Comparison for Same Facts

Example: Death in 2010 (pre-TRAIN) vs. hypothetical death in 2020 (TRAIN) with identical assets.

**Pre-TRAIN**:
- Additional deductions available: funeral (min(actual, 5%×GE)) + judicial (actual)
- Lower standard deduction: ₱1M vs. ₱5M (₱4M less benefit)
- Lower family home cap: ₱1M vs. ₱10M
- Net effect: Pre-TRAIN deductions are typically LOWER than TRAIN deductions
  (the additional funeral/judicial items rarely exceed the ₱4M gap in standard deductions)
- Higher effective tax: Larger net taxable estate, BUT lower rate schedule (graduated, not flat 6%)
  — the interaction creates different results depending on estate size

---

## Test Implications

| Test ID | Scenario | Expected Behavior |
|---------|----------|-------------------|
| PTD-01 | Pre-TRAIN: funeral expenses below 5% limit | Deduction = actual amount |
| PTD-02 | Pre-TRAIN: funeral expenses exceed 5% limit | Deduction = 5% of gross estate; show both amounts to user |
| PTD-03 | Pre-TRAIN: zero funeral expenses (no expenses incurred) | funeralDeduction = ₱0; valid |
| PTD-04 | Pre-TRAIN: judicial expenses present | Deduction = actual total |
| PTD-05 | Pre-TRAIN: no judicial expenses (extrajudicial settlement) | judicialDeduction = ₱0; valid |
| PTD-06 | TRAIN: funeral expenses entered by user | Engine zeros to ₱0 and displays warning |
| PTD-07 | TRAIN: judicial expenses entered by user | Engine zeros to ₱0 and displays warning |
| PTD-08 | Pre-TRAIN: standard deduction = ₱1M (not ₱5M) | Confirm Item 37A = ₱1,000,000 |
| PTD-09 | Pre-TRAIN: family home FMV ₱2M, exclusive → cap = ₱1M | Deduction = ₱1,000,000 |
| PTD-10 | Pre-TRAIN: family home FMV ₱800K, exclusive → below cap | Deduction = ₱800,000 |
| PTD-11 | Pre-TRAIN: NRA — funeral expenses proportional | Apply Sec. 86(B) proportional formula |
| PTD-12 | Commentary Sample 5 verification | Gross ₱8M CPG, debts ₱400K, funeral ₱350K, family home ₱1M, standard ₱1M → net taxable ₱1.45M → tax ₱91,000 (see tax-rate-pre-train.md PT-05/PT-13) |

---

## Form 1801 Mapping (Pre-TRAIN)

The pre-TRAIN engine output must map to **BIR Form 1801 (June 2006 revision)** field positions, which differ from the January 2018 (TRAIN-era) revision. However, the engine uses named fields in its output rather than hard-coded form line numbers. The named fields for the pre-TRAIN-only items are:

| Engine Field | Pre-TRAIN Form 1801 Location | Description |
|---|---|---|
| `preTrainComputation.funeralExpenses` | Schedule 5, Line for Funeral Expenses | Lower of actual or 5% × gross estate |
| `preTrainComputation.judicialAdminExpenses` | Schedule 5, Line for Judicial/Admin | Actual expenses, no cap |
| `preTrainComputation.standardDeduction` | Schedule 6, Line for Standard Deduction | ₱1,000,000 (citizens/residents) |
| `preTrainComputation.familyHomeDeduction` | Schedule 6, Line for Family Home | min(applicable_fmv, ₱1,000,000) |
| `preTrainComputation.medicalExpenses` | Schedule 6, Line for Medical Expenses | min(qualifying, ₱500,000) — same as TRAIN |
| `preTrainComputation.ordinaryDeductionsTotal` | Item 35 equivalent | Sum including funeral + judicial |
| `preTrainComputation.specialDeductionsTotal` | Item 37 equivalent | Standard + family home + medical + RA4917 |
| `preTrainComputation.netTaxableEstate` | Item 40 equivalent | Input to graduated rate schedule |

---

## Relationship to Other Aspects

- **tax-rate-pre-train**: Applies the graduated rate schedule to the `net_taxable_estate` produced by this deduction pipeline. This aspect feeds that computation.
- **pre-train-computation-flow**: Synthesizes this aspect with tax-rate-pre-train into a complete end-to-end computation flow.
- **deduction-elit** (TRAIN): Documents the TRAIN-era ELIT rules (which are identical for items that persist into pre-TRAIN).
- **deduction-standard**: Full standard deduction rules including the pre-TRAIN ₱1M amount.
- **deduction-family-home**: Full family home rules including the pre-TRAIN ₱1M cap.
- **nonresident-deductions**: Documents the Sec. 86(B) proportional deduction formula for NRAs (applies to funeral/judicial expenses under pre-TRAIN for NRA decedents).
- **amnesty-computation**: The amnesty path does NOT include funeral expenses or judicial/admin expenses as deductions — even though these estates died pre-2018 and would have qualified for these deductions under the regular pre-TRAIN rules. The amnesty law restricts deductions to a more limited set. This distinction is critical.

---

## Summary

Two deductions exist exclusively in the pre-TRAIN regime:

1. **Funeral Expenses**: `min(actual, gross_estate × 0.05)` — removed by TRAIN effective January 1, 2018
2. **Judicial/Administrative Expenses**: full actual amount, no cap — removed by TRAIN effective January 1, 2018

Two deductions exist in both regimes but with different amounts:
- **Standard Deduction**: ₱1M (pre-TRAIN) vs. ₱5M (TRAIN) for citizens/residents
- **Family Home Cap**: ₱1M (pre-TRAIN) vs. ₱10M (TRAIN)

All other deductions (medical expenses, ELIT items, vanishing deduction, transfers for public use, RA 4917, surviving spouse share) are **identical** between pre-TRAIN and TRAIN regimes.

The engine must implement conditional branching at the deduction computation stage, selecting the appropriate deduction set and amounts based on `decedent.dateOfDeath`. The gross estate computation rules (Sec. 85) are identical across both regimes.
