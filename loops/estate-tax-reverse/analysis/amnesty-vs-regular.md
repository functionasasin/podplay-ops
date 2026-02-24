# Analysis: amnesty-vs-regular

**Aspect**: amnesty-vs-regular
**Wave**: 4 — Estate Tax Amnesty Rule Extraction
**Date Analyzed**: 2026-02-24
**Legal Sources**: `input/legal-sources/amnesty-provisions.md`, `input/legal-sources/nirc-title-iii.md`, `input/legal-sources/pre-train-rates.md`
**Depends On**: `analysis/amnesty-eligibility.md`, `analysis/amnesty-computation.md`, `analysis/pre-train-computation-flow.md`, `analysis/tax-rate-pre-train.md`

---

## Purpose

This document defines the complete decision logic for choosing between:

1. **Regular pre-TRAIN path** — graduated rate (0%–20%), full deduction set at 2017-era amounts
2. **Estate tax amnesty path** — flat 6% on amnesty base (Track A or Track B), minimum ₱5,000, same deduction set as regular pre-TRAIN, but surcharges/interest waived

This decision only arises for estates where `decedent.dateOfDeath < 2018-01-01`. For deaths on or after January 1, 2018, the regime is always TRAIN (with optional amnesty overlay for 2018–2022 deaths per RA 11956 — but amnesty and TRAIN produce identical base tax for those estates).

---

## Legal Basis

**RA 11213, Section 4** (as amended by RA 11956): Estate tax amnesty covers decedents who died on or before May 31, 2022, with unpaid or unsettled estate taxes. Amnesty is **voluntary** — it is an election by the taxpayer, not an automatic override.

**NIRC Sec. 84** (pre-TRAIN): Graduated rate applies as the default regime for pre-2018 deaths that do not elect amnesty.

**RA 11213, Section 9**: Categorical exclusions — certain estates are ineligible for amnesty regardless of election.

**RA 11956, Section 1**: Extended amnesty filing deadline to June 14, 2025. The window is now **closed** (as of February 2026). Engine computes historical amounts for reference only.

---

## Master Decision Tree

```pseudocode
// ─────────────────────────────────────────────────────────────────────────────
// AMNESTY vs. REGULAR DECISION TREE
// Called with: decedent.dateOfDeath, estate, userElectsAmnesty
// Returns: regime string "TRAIN" | "PRE_TRAIN" | "AMNESTY"
// ─────────────────────────────────────────────────────────────────────────────

function selectRegime(decedent, estate, userElectsAmnesty):

  // ─── BRANCH 1: TRAIN Era Deaths (Jan 1, 2018 onward) ──────────────────────
  // These estates use TRAIN regime by default (flat 6%).
  // RA 11956 also made 2018–2022 deaths eligible for amnesty,
  // but base tax is identical — amnesty benefit is surcharge/interest waiver only.

  if decedent.dateOfDeath >= DATE("2018-01-01"):

    if decedent.dateOfDeath > DATE("2022-05-31"):
      // After RA 11956 coverage cutoff — TRAIN only, no amnesty available
      return "TRAIN"

    // 2018-01-01 ≤ dateOfDeath ≤ 2022-05-31
    // Amnesty available under RA 11956 but produces SAME base tax as TRAIN
    if userElectsAmnesty:
      eligibility = checkAmnestyEligibility(decedent, estate, userElectsAmnesty)
      if eligibility.eligible:
        // Display equivalence notice (defined below) — base tax is identical
        return "AMNESTY"
      else:
        return "TRAIN"   // Ineligible for amnesty; fall back to TRAIN
    else:
      return "TRAIN"

  // ─── BRANCH 2: Pre-TRAIN Deaths (before Jan 1, 2018) ─────────────────────
  // These estates use pre-TRAIN graduated rate by default.
  // Amnesty is available if eligible and elected.

  // Step A: Does the user elect amnesty?
  if not userElectsAmnesty:
    return "PRE_TRAIN"    // Default — graduated rate, full pre-TRAIN deductions

  // Step B: Run eligibility check
  eligibility = checkAmnestyEligibility(decedent, estate, userElectsAmnesty)

  if not eligibility.eligible:
    // One or more exclusions apply — cannot use amnesty
    // Fall back to pre-TRAIN regular computation
    displayIneligibilityReason(eligibility.reason)
    return "PRE_TRAIN"

  // Step C: Eligible for amnesty — run both computations for comparison
  return "AMNESTY"

// ─────────────────────────────────────────────────────────────────────────────
// NOTE: For PRE-TRAIN deaths, the engine SHOULD compute both paths
// (regular pre-TRAIN and amnesty) and present a comparison to the user,
// even after the user has elected one path. This enables informed decisions
// about the relative benefit. See "Dual-Path Comparison" section below.
// ─────────────────────────────────────────────────────────────────────────────
```

---

## When Amnesty Is Better (Quantitative Analysis)

For pre-2018 deaths where the estate is eligible, amnesty produces a **lower base tax** whenever:

```
amnestyTax < regularPreTrainTax

where:
  amnestyTax        = max(5_000, amnestyTaxBase × 0.06)
  regularPreTrainTax = computePreTrainGraduatedTax(netTaxableEstate_regular)
```

Because the two paths use the same deduction rules, `netTaxableEstate` is identical (assuming full-deduction-set interpretation of amnesty). Therefore the comparison reduces to the **rate structures**:

### Rate Comparison: Pre-TRAIN Graduated vs. Amnesty Flat 6%

| Net Taxable Estate (NTE) | Pre-TRAIN Tax | Amnesty Tax (6%) | Which Is Lower? |
|---|---|---|---|
| ≤ ₱200,000 | ₱0 | max(₱5,000, NTE × 6%) | **Pre-TRAIN** (₱0 vs ≥ ₱5,000) |
| ₱200,001 – ₱500,000 | (NTE − 200K) × 5% | NTE × 6% | **Depends** — see crossover below |
| ₱500,001 – ₱2,000,000 | 15,000 + (NTE − 500K) × 8% | NTE × 6% | **Depends** — see crossover below |
| ₱2,000,001 – ₱5,000,000 | 135,000 + (NTE − 2M) × 11% | NTE × 6% | **Pre-TRAIN often lower** at lower end; higher at top |
| ₱5,000,001 – ₱10,000,000 | 465,000 + (NTE − 5M) × 15% | NTE × 6% | **Amnesty lower** throughout |
| > ₱10,000,000 | 1,215,000 + (NTE − 10M) × 20% | NTE × 6% | **Amnesty lower** throughout |

### Crossover Points (Where Amnesty Equals Pre-TRAIN)

**Bracket 1** (₱200K–₱500K): Solve `(NTE − 200K) × 0.05 = NTE × 0.06`
```
0.05 × NTE − 10,000 = 0.06 × NTE
-10,000 = 0.01 × NTE
NTE = -1,000,000  (no positive solution)
```
Result: In this bracket, amnesty is ALWAYS higher than pre-TRAIN graduated tax (6% > 5%). Pre-TRAIN is always better for NTE between ₱200K–₱500K.

**Bracket 2** (₱500K–₱2M): Solve `15,000 + (NTE − 500K) × 0.08 = NTE × 0.06`
```
15,000 + 0.08 × NTE − 40,000 = 0.06 × NTE
-25,000 = -0.02 × NTE
NTE = 1,250,000  ← crossover point
```
Result: For NTE between ₱500K–₱1,250,000 → Pre-TRAIN is lower (8% marginal but lower effective rate). For NTE between ₱1,250,001–₱2,000,000 → Amnesty is lower.

**Bracket 3** (₱2M–₱5M): Solve `135,000 + (NTE − 2M) × 0.11 = NTE × 0.06`
```
135,000 + 0.11 × NTE − 220,000 = 0.06 × NTE
-85,000 = -0.05 × NTE
NTE = 1,700,000  ← this falls below ₱2M — means no crossover in bracket 3
```
Result: At NTE = ₱2M (bracket 3 start), pre-TRAIN tax = ₱135,000; amnesty = ₱120,000. Amnesty is **always lower** in the ₱2M–₱5M bracket. (Crossover point at ₱1.7M is in bracket 2, already covered.)

**Brackets 4 & 5** (₱5M–₱10M and >₱10M): Since the 15% and 20% marginal rates always exceed 6%, amnesty is definitively lower at these levels.

### Crossover Summary Table

```
NTE Range              | Better Path        | Notes
------------------------|--------------------|-----------------------------------------
≤ ₱200,000             | Pre-TRAIN (₱0 tax) | Amnesty minimum ₱5,000 always applies
₱200,001 – ₱500,000    | Pre-TRAIN          | 5% marginal rate < 6% flat
₱500,001 – ₱1,250,000  | Pre-TRAIN          | 8% marginal but lower effective rate
₱1,250,001 – ₱1,999,999| Amnesty            | 6% flat < effective pre-TRAIN rate
₱2,000,000+            | Amnesty            | Always: pre-TRAIN effective rate > 6%
```

**Key takeaway**: The amnesty break-even point is **₱1,250,000** net taxable estate. Estates with NTE above ₱1,250,000 pay less base tax via amnesty; estates below ₱1,250,000 pay less (or zero) via the regular pre-TRAIN graduated path.

**Caveat — surcharges and interest**: This analysis is base-tax-only. The amnesty also waives all accrued surcharges (25% or 50%) and interest (20% or 12% per annum). For late estates with many years of unpaid interest, amnesty may be economically superior even when the base tax is higher. The engine does NOT compute surcharges/interest, so it cannot present the full economic comparison. Engine must display this caveat.

---

## Dual-Path Comparison Output

When the user's estate is eligible for amnesty (pre-2018 death, estate unpaid, no exclusions), the engine should compute both paths and present a comparison — even if the user has already elected one:

```pseudocode
function computeDualPathComparison(decedent, estate, inputs):
  // Always compute both for eligible pre-2018 estates

  regularResult = computePreTrainEstateTax(decedent, inputs)
  //   regularResult.netTaxableEstate = Item 40
  //   regularResult.estateTaxDue    = Item 42 (graduated)

  amnestyResult = computeAmnestyEstateTax(decedent, estate, inputs)
  //   amnestyResult.netTaxableEstate = Item 40 (same for same deductions)
  //   amnestyResult.amnestyTaxDue   = max(5_000, amnestyBase × 0.06)

  baseTaxDifference = regularResult.estateTaxDue - amnestyResult.amnestyTaxDue
  // Positive: amnesty saves money on base tax
  // Negative: regular pre-TRAIN saves money on base tax

  return {
    regularPath: regularResult,
    amnestyPath: amnestyResult,
    baseTaxDifference: baseTaxDifference,
    amnestyIsBetterOnBaseTax: (baseTaxDifference > 0),
    caveat: "This comparison is for base tax only. The amnesty also waives all " +
            "accrued surcharges and interest on the unpaid estate tax. " +
            "For estates with long-outstanding obligations, the economic benefit " +
            "of the amnesty may significantly exceed the base tax difference. " +
            "Consult a tax professional for a complete analysis."
  }
```

---

## User-Facing Decision Guidance

The engine's explainer section must present the following guidance when a pre-2018 eligible estate is detected:

```
ESTATE TAX PATH OPTIONS FOR THIS ESTATE
─────────────────────────────────────────

This estate may use EITHER of two computation paths:

┌─────────────────────────────────────────────────────────────────┐
│ PATH 1: Regular Pre-TRAIN Estate Tax                            │
│                                                                 │
│ Tax rate:   Graduated 0%–20% (see bracket table)                │
│ Your tax:   ₱[regularResult.estateTaxDue]                       │
│                                                                 │
│ When to use: If your estate is current on tax (no late          │
│   filing penalties), or if the estate was originally due        │
│   less than ~₱1,250,000 in net taxable estate.                  │
│                                                                 │
│ NOTE: If filed late, surcharges (25%–50%) and interest          │
│   (12%–20% per year) apply on TOP of this base tax.            │
│   Those amounts are not computed here.                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ PATH 2: Estate Tax Amnesty (RA 11213, as amended)               │
│                                                                 │
│ Tax rate:   Flat 6% on amnesty base                             │
│ Your tax:   ₱[amnestyResult.amnestyTaxDue]                      │
│ Track:      [TRACK_A or TRACK_B]                                │
│                                                                 │
│ Benefits:                                                       │
│   ✓ All accrued surcharges WAIVED                               │
│   ✓ All accrued interest WAIVED                                 │
│   ✓ Immunity from civil and criminal prosecution                │
│                                                                 │
│ ⚠ IMPORTANT: The filing window closed June 14, 2025.           │
│   Amnesty is no longer available without a new law.             │
│   This computation is for HISTORICAL REFERENCE ONLY.            │
└─────────────────────────────────────────────────────────────────┘

WHICH IS LOWER (base tax only)?
  [If amnestyIsBetterOnBaseTax]: PATH 2 (Amnesty) saves ₱[baseTaxDifference] in base tax.
  [If not amnestyIsBetterOnBaseTax]: PATH 1 (Regular) saves ₱[|baseTaxDifference|] in base tax.

⚠ This comparison covers BASE TAX ONLY. For estates with unpaid taxes from
  many years ago, the waiver of surcharges and interest under amnesty may
  result in far greater total savings than the base tax difference shown above.
  Please consult a licensed tax practitioner for a complete evaluation.
```

---

## Decision Conditions: When Each Path Is Definitively Better

### Always Use Regular Pre-TRAIN When:

1. **Net taxable estate ≤ ₱200,000**: Regular tax = ₱0; amnesty minimum = ₱5,000. Amnesty is strictly worse on base tax.

2. **Estate is already fully paid**: Amnesty condition requires tax "unpaid or unsettled." A fully paid estate cannot use amnesty.

3. **Categorical exclusion applies**: PCGG, RA 3019, RA 9160, pre-enactment court case, unexplained wealth, RPC felony. Amnesty is legally unavailable.

4. **Net taxable estate ₱200K–₱1,250,000** AND **estate is not late / has no penalty exposure**: Regular pre-TRAIN graduated rates are lower in this range; amnesty provides no additional benefit if there are no surcharges to waive.

5. **User does not elect amnesty**: Engine defaults to pre-TRAIN. No amnesty computation is run.

### Always Use Amnesty When:

1. **Net taxable estate > ₱1,250,000** AND estate is eligible: Base tax is lower under amnesty. Plus surcharge/interest waiver. (Filing window is now closed — historical computation only.)

2. **Estate has been unpaid for many years**: Even if base tax is slightly higher under amnesty (NTE ₱200K–₱1,250K range), the surcharge and interest waiver may produce massive total savings.

3. **Track B situations**: If a prior return was filed and some estate was declared, only the undeclared portion is subject to amnesty tax. This can produce a dramatically lower effective obligation compared to a full graduated-rate assessment on the entire estate.

### Ambiguous / Case-by-Case:

1. **NTE exactly at or near ₱1,250,000**: The two paths produce nearly identical base tax. Decision depends entirely on surcharge/interest exposure.

2. **Track B with small undeclared portion**: If the previously declared estate is large relative to the current estimate, the Track B amnesty base may be very small (possibly triggering only the ₱5,000 minimum). This is almost always better than regular pre-TRAIN on the full estate.

---

## Engine Behavior: Auto-Suggestion Logic

The engine should proactively advise the user when amnesty would produce a lower base tax, even if the user has not elected it:

```pseudocode
function suggestAmnestyIfBeneficial(decedent, estate, regularResult):
  // Only for pre-2018 deaths with unpaid/unsettled estate

  if decedent.dateOfDeath >= DATE("2018-01-01"):
    return   // No suggestion needed for TRAIN-era (rates identical)

  if estate.taxFullyPaidBeforeMay2022:
    return   // Already paid; amnesty unavailable

  if hasCategorialExclusions(estate):
    return   // Excluded; no suggestion

  // Estimate amnesty tax using same deduction set (quick estimate)
  estimatedAmnestyTax = max(5_000, regularResult.netTaxableEstate × 0.06)

  if estimatedAmnestyTax < regularResult.estateTaxDue:
    displayNotice(
      "NOTICE: Based on this estate's net taxable estate of " +
      formatCurrency(regularResult.netTaxableEstate) + ", the estate tax amnesty " +
      "rate (6%) would produce a LOWER base tax of " +
      formatCurrency(estimatedAmnestyTax) + " vs. the regular pre-TRAIN rate of " +
      formatCurrency(regularResult.estateTaxDue) + ". " +
      "The amnesty also waives all accrued surcharges and interest. " +
      "⚠ Note: The amnesty filing window closed June 14, 2025. " +
      "This comparison is for historical and planning reference only. " +
      "Select 'Compute Amnesty Path' to see the full amnesty calculation."
    )
  else:
    // Regular pre-TRAIN is cheaper (NTE ≤ ₱1,250,000 range)
    // Still show amnesty option if estate is late (surcharges may apply)
    if estate.isLate:
      displayNotice(
        "NOTE: For this estate size, the regular pre-TRAIN graduated rate " +
        "produces a lower base tax than amnesty. However, if the estate has " +
        "accrued surcharges and interest (due to late filing), the amnesty's " +
        "waiver of those amounts may still make it economically advantageous. " +
        "Consult a tax professional for a full evaluation."
      )
```

---

## Track B Decision Nuance

When amnesty Track B is available (prior return was filed), the comparison is more complex because the amnesty base is **only the undeclared portion**, not the full net taxable estate:

```pseudocode
// Track B comparison
amnestyTaxBase_B       = max(0, netTaxableEstate - previouslyDeclaredNetEstate)
amnestyTax_B           = max(5_000, amnestyTaxBase_B × 0.06)

// Regular pre-TRAIN taxes the ENTIRE net taxable estate (no credit for prior declaration)
// unless the prior return was filed AND tax was partially paid (then prior payments apply separately)
regularTax_full        = computePreTrainGraduatedTax(netTaxableEstate)

// If prior tax was partially paid, remaining unpaid amount under regular path:
//   regularTax_full − priorPayments + accrued surcharges + interest
// Engine does NOT compute surcharges and interest, so it cannot present the full comparison.
// It presents: amnestyTax_B vs. regularTax_full (with caveat).

baseTaxDifference_B    = regularTax_full - amnestyTax_B

// Track B almost always produces a lower amnesty tax because:
//   (a) Only undeclared portion is taxed (smaller base)
//   (b) Flat 6% vs. graduated rates
//   (c) Plus surcharge/interest waiver on the entire estate (declared + undeclared)
```

**Key implication**: For Track B estates, the amnesty is almost always economically superior to the regular pre-TRAIN path, even for small NTE values where the flat rate would otherwise be disadvantageous. The engine should note this prominently.

---

## Interaction with Deduction Interpretation

The amnesty-vs-regular comparison assumes the **same deduction set** for both paths (full pre-TRAIN deductions including funeral and judicial/admin). This produces identical net taxable estates for both paths, making the comparison a pure rate comparison.

If the user elects the **narrow interpretation** of amnesty deductions (standard + spouse share only):
- The amnesty path will have a **higher net taxable estate** than the regular pre-TRAIN path
- This increases the amnesty tax base and may shift the crossover point significantly
- The engine must recompute the crossover point dynamically when the narrow interpretation is selected
- Display warning: "Using the narrow deduction interpretation under amnesty increases the amnesty tax base. The crossover point where amnesty is more favorable has shifted to approximately ₱[recalculated_crossover] net taxable estate."

---

## Form 1801 Mapping

This aspect defines **decision logic**, not direct Form 1801 fields. No Form 1801 fields are mapped here. However, the output of this decision informs:

- Which computation pipeline is executed (regular pre-TRAIN → Form 1801 pre-TRAIN revision, or amnesty → ETAR)
- Which output template is rendered (comparison table, single-path output, or dual-path output)
- Which regime label is shown throughout output ("PRE-TRAIN ESTATE TAX" vs. "ESTATE TAX AMNESTY (RA 11213)")

---

## Edge Cases

### EC-AVR-01: NTE Exactly at ₱1,250,000 Crossover

```
NTE = ₱1,250,000

Regular pre-TRAIN:
  = 15,000 + (1,250,000 − 500,000) × 0.08
  = 15,000 + 60,000
  = ₱75,000

Amnesty:
  = max(5,000, 1,250,000 × 0.06)
  = max(5,000, 75,000)
  = ₱75,000

Difference: ₱0 — both paths produce identical base tax at exactly ₱1,250,000.
Engine display: "Both paths produce the same base tax of ₱75,000.
The amnesty path also waives all accrued surcharges and interest."
```

### EC-AVR-02: NTE ≤ ₱200,000 — Regular Pre-TRAIN is Definitively Better

```
NTE = ₱150,000
Regular pre-TRAIN: ₱0 (below ₱200K exemption threshold)
Amnesty: max(₱5,000, ₱150,000 × 0.06) = max(₱5,000, ₱9,000) = ₱9,000

Engine must strongly advise against amnesty election:
"For this estate, regular pre-TRAIN results in ₱0 estate tax (net taxable estate
is below the ₱200,000 exemption threshold). The amnesty path results in a minimum
payment of ₱9,000. The regular pre-TRAIN path is definitively better for base tax."

Note: even if the estate has surcharges (25–50% of ₱0 = ₱0), amnesty offers no benefit here.
```

### EC-AVR-03: Track B — Small Undeclared Estate

```
NTE_current = ₱3,000,000
PreviouslyDeclaredNetEstate = ₱2,800,000

Amnesty Track B base = max(0, ₱3,000,000 − ₱2,800,000) = ₱200,000
Amnesty Track B tax = max(₱5,000, ₱200,000 × 0.06) = max(₱5,000, ₱12,000) = ₱12,000

Regular pre-TRAIN on full estate:
  = 135,000 + (3,000,000 − 2,000,000) × 0.11
  = 135,000 + 110,000
  = ₱245,000

Amnesty saves ₱233,000 on base tax. Almost certainly better when considering
surcharges/interest on ₱245,000 over multiple years.
```

### EC-AVR-04: Estate Ineligible for Amnesty (PCGG)

```
Decedent died 2010, estate unpaid.
User elects amnesty.
decedent.subjectToPCGGJurisdiction = true

Engine response:
  "This estate is ineligible for the estate tax amnesty under RA 11213 Section 9
  (PCGG exclusion). The regular pre-TRAIN graduated rate applies."

Regime: PRE_TRAIN (forced)
```

### EC-AVR-05: Amnesty for TRAIN-Era Death (2018–2022) — Rate Parity

```
Death: March 15, 2021
NTE = ₱8,000,000

Regular TRAIN: ₱8,000,000 × 0.06 = ₱480,000
Amnesty (TRAIN rules, RA 11956): ₱8,000,000 × 0.06 = ₱480,000
Difference: ₱0

Engine display (mandatory):
"For estates of decedents who died after January 1, 2018, the amnesty tax rate
(6%) is identical to the regular TRAIN estate tax rate (6%), and the same
deduction rules apply. The base tax is identical under both paths. The primary
benefit of the estate tax amnesty for this estate was the waiver of accrued
surcharges and interest on any late-filed or unpaid estate tax obligations —
which this engine does not compute. If the estate has no penalty exposure,
or if the amnesty window (closed June 14, 2025) cannot be accessed, the
regular TRAIN computation is the appropriate path."
```

### EC-AVR-06: NTE ₱1,000,000 — Regular Pre-TRAIN Is Still Better

```
NTE = ₱1,000,000

Regular pre-TRAIN:
  = 15,000 + (1,000,000 − 500,000) × 0.08
  = 15,000 + 40,000
  = ₱55,000

Amnesty:
  = max(5,000, 1,000,000 × 0.06) = ₱60,000

Regular saves ₱5,000. However, if estate has been unpaid for 10 years:
  Surcharges on ₱55,000 × 25% = ₱13,750
  Interest on ₱55,000 × 12% × 10 years = ₱66,000
  Total exposure (regular): ₱55,000 + ₱13,750 + ₱66,000 ≈ ₱134,750

Under amnesty: ₱60,000 (all surcharges/interest waived)
Amnesty total savings: ₱74,750

This illustrates why surcharge/interest waiver dominates for long-outstanding estates
even when base tax favors the regular path.
```

### EC-AVR-07: Estate With Very High Funeral Expenses (Crossover Sensitivity)

```
Gross Estate: ₱12,000,000
Funeral actual: ₱600,000 (= 5% × ₱12M → full amount deductible)
Judicial/admin: ₱200,000
Standard deduction: ₱1,000,000
(No other deductions; no surviving spouse)

Total deductions: ₱600K + ₱200K + ₱1M = ₱1,800,000
NTE = ₱12,000,000 − ₱1,800,000 = ₱10,200,000

Regular pre-TRAIN:
  = 1,215,000 + (10,200,000 − 10,000,000) × 0.20
  = 1,215,000 + 40,000
  = ₱1,255,000

Amnesty:
  = max(5,000, 10,200,000 × 0.06) = ₱612,000

Amnesty saves ₱643,000 — definitively better.
(Large estate > ₱10M is always better under amnesty.)
```

### EC-AVR-08: Filing Window Closed — Historical Computation Only

All amnesty computations include the mandatory notice:

```
"⚠ IMPORTANT — AMNESTY FILING WINDOW CLOSED

The estate tax amnesty under RA 11213 (as amended by RA 11956) had a filing
deadline of June 14, 2025. As of today, the filing window is CLOSED.

This amnesty tax computation is provided for HISTORICAL REFERENCE AND PLANNING
PURPOSES ONLY. Actual availment of the estate tax amnesty is no longer possible
unless Congress enacts a further extension.

If you need to settle an estate with unpaid pre-2022 estate taxes, please consult
a licensed tax attorney or enrolled agent regarding current options for payment
under the regular estate tax rules."
```

---

## Test Implications

| Test ID | Scenario | Expected Regime | Expected Comparison Output |
|---|---|---|---|
| T-AVR-01 | Pre-2018 death, NTE = ₱100,000, user does not elect amnesty | PRE_TRAIN | No amnesty comparison shown |
| T-AVR-02 | Pre-2018 death, NTE = ₱100,000, user elects amnesty, eligible | AMNESTY | Warning: regular = ₱0, amnesty = min ₱5,000; "regular is definitively better" |
| T-AVR-03 | Pre-2018 death, NTE = ₱1,250,000, eligible | Both computed | Crossover: both ₱75,000; amnesty note about surcharge waiver |
| T-AVR-04 | Pre-2018 death, NTE = ₱3,000,000, eligible, Track A | Both computed | Amnesty lower (₱180,000 vs ₱245,000) |
| T-AVR-05 | Pre-2018 death, NTE = ₱3,000,000, Track B, previously declared ₱2,800,000 | AMNESTY | Track B base ₱200,000; amnesty ₱12,000 vs. regular ₱245,000 |
| T-AVR-06 | Pre-2018 death, PCGG exclusion, user elects amnesty | PRE_TRAIN | Ineligibility notice; forced PRE_TRAIN regime |
| T-AVR-07 | TRAIN-era death (2021), NTE = ₱8,000,000, user elects amnesty | AMNESTY | Rate parity notice; base tax identical ₱480,000 |
| T-AVR-08 | Post-May 2022 death, user asks about amnesty | TRAIN | "Not eligible: dateOfDeath after coverage cutoff" |
| T-AVR-09 | Pre-2018 death, NTE = ₱500,000, no elections | PRE_TRAIN | Auto-suggestion: amnesty would cost ₱30,000 vs. regular ₱15,000; regular better |
| T-AVR-10 | Pre-2018 death, NTE = ₱5,000,000, no elections | PRE_TRAIN | Auto-suggestion: amnesty ₱300,000 vs. regular ₱465,000; amnesty better; equivalence caveat shown |
| T-AVR-11 | Narrow interpretation elected, NTE ₱2,000,000 (regular) → higher NTE under narrow | AMNESTY | Crossover point recalculated and displayed |
| T-AVR-12 | Pre-2018 death, NTE exactly ₱200,000 | PRE_TRAIN | Regular tax = ₱0 (at threshold); amnesty = ₱12,000; regular definitively better |

---

## Relationship to Other Aspects

- **amnesty-eligibility.md**: Provides the `checkAmnestyEligibility()` function consumed by the decision tree. Must run before the comparison is presented.
- **amnesty-computation.md**: Provides `computeAmnestyEstateTax()` for the amnesty path computation.
- **pre-train-computation-flow.md**: Provides `computePreTrainEstateTax()` for the regular path.
- **tax-rate-pre-train.md**: Provides the graduated rate schedule used in the crossover analysis.
- **deductions-pre-train-diffs.md**: Pre-TRAIN-only deductions affect the NTE for both paths equally (under full-deduction interpretation), but differ if narrow amnesty interpretation is selected.
- **regime-detection.md** (Wave 5): Incorporates this decision tree into the master regime selector.
- **computation-pipeline.md** (Wave 5): Must implement the dual-path comparison as a distinct output mode alongside single-path computations.
- **explainer-format.md** (Wave 5): Must include the comparison table and path-selection guidance as a required section in the explainer output.
- **test-vectors.md** (Wave 5): T-AVR-01 through T-AVR-12 feed directly into the test vectors aspect.

---

## Summary for Developer

The amnesty-vs-regular decision has three distinct outputs:

1. **Regime selection**: `"TRAIN"`, `"PRE_TRAIN"`, or `"AMNESTY"` — determines which computation pipeline runs.

2. **Dual-path comparison**: For eligible pre-2018 estates, always compute both paths and show a side-by-side comparison with the crossover explanation. This is a UI requirement, not just a computation requirement.

3. **Auto-suggestion**: If the user has not elected amnesty but amnesty would produce a lower base tax (NTE > ₱1,250,000), proactively display a notice. For lower NTE ranges, still offer to compute amnesty if the estate is late (surcharge waiver may dominate).

Key constants to hardcode:
```
CROSSOVER_NTE = 1_250_000     // NTE where amnesty and pre-TRAIN produce equal base tax
AMNESTY_RATE  = 0.06          // Flat 6%
AMNESTY_MIN   = 5_000         // ₱5,000 minimum (always applies to amnesty)
PRE_TRAIN_EXEMPTION = 200_000 // ₱200K zero-tax floor (pre-TRAIN only)
```

The filing window notice (CLOSED as of June 14, 2025) must appear on every amnesty-related output screen and computation result.
