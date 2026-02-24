# Analysis: regime-detection

**Aspect**: regime-detection
**Wave**: 5 — Synthesis
**Date Analyzed**: 2026-02-24
**Depends On**: All Wave 1–4 analysis files (this is the first Wave 5 synthesis aspect)

---

## Purpose

This document defines the complete decision tree for auto-detecting which of the three tax regimes applies to a given estate, based solely on the decedent's date of death and user-provided estate status flags. The regime detection step is the first step of every computation run; its output drives all downstream computation branching.

---

## Legal Basis

Three bodies of law define the three regimes:

| Regime | Legal Basis | Key Date |
|--------|-------------|----------|
| **TRAIN** | RA 10963 (TRAIN Law), amending NIRC Sec. 84, effective January 1, 2018 | `dateOfDeath >= 2018-01-01` |
| **PRE_TRAIN** | NIRC Sec. 84 as originally enacted by RA 8424 (Tax Reform Act of 1997) | `dateOfDeath < 2018-01-01` (default) |
| **AMNESTY** | RA 11213 (Tax Amnesty Act), as amended by RA 11569 and RA 11956 | Deaths on/before `2022-05-31`, unpaid estate tax, user elects amnesty |

The TRAIN Law (RA 10963) became effective January 1, 2018. Any decedent who died on or after January 1, 2018 is subject to TRAIN-era rules by operation of law. Any decedent who died before January 1, 2018 is subject to the pre-TRAIN graduated rate schedule.

RA 11956 (August 5, 2023) expanded the amnesty coverage to include deaths through May 31, 2022, meaning some TRAIN-era deaths (2018 through May 31, 2022) also qualify for amnesty — though for those estates, the base tax is identical under both paths (amnesty benefit for TRAIN-era deaths is surcharge/interest waiver only).

---

## Two Orthogonal Concepts

The regime detection output produces TWO independent flags that drive different downstream branches:

### 1. `regime` — Controls the tax rate function

| `regime` | Rate Applied |
|----------|-------------|
| `"TRAIN"` | Flat 6% (0.06) on net taxable estate |
| `"PRE_TRAIN"` | Graduated 0%–20% per bracket schedule |
| `"AMNESTY"` | Flat 6% (0.06) on amnesty tax base; minimum ₱5,000 |

### 2. `deductionRules` — Controls deduction amounts and available deduction types

| `deductionRules` | Standard Deduction | Family Home Cap | Funeral Expenses | Judicial/Admin |
|------------------|-------------------|-----------------|-----------------|----------------|
| `"TRAIN"` | ₱5,000,000 (citizens/residents) | ₱10,000,000 | NOT deductible | NOT deductible |
| `"PRE_TRAIN"` | ₱1,000,000 (citizens/residents) | ₱1,000,000 | Deductible: min(actual, 5%×GE) | Deductible: actual, no cap |

In both cases, NRA standard deduction is ₱500,000 (unchanged across all regimes).

The amnesty regime always uses `deductionRules` derived from the date of death:
- Deaths before 2018-01-01 → `deductionRules = "PRE_TRAIN"`
- Deaths 2018-01-01 through 2022-05-31 → `deductionRules = "TRAIN"`

**Critical implementation note**: `regime` and `deductionRules` are independent. For AMNESTY estates where `dateOfDeath < 2018-01-01`, the regime is `"AMNESTY"` but `deductionRules` is `"PRE_TRAIN"`. All deduction computation functions must accept `deductionRules` as a parameter (separate from `regime`) to handle this.

---

## Key Constants

```pseudocode
// Regime boundary dates (inclusive on the stated side)
TRAIN_EFFECTIVE_DATE     = Date(2018, 1, 1)   // dateOfDeath >= this → TRAIN era
AMNESTY_COVERAGE_CUTOFF  = Date(2022, 5, 31)  // dateOfDeath <= this → eligible for amnesty
PRE_TRAIN_CUTOFF         = Date(2018, 1, 1)   // dateOfDeath < this → pre-TRAIN deduction rules within amnesty

// Amnesty constants (see amnesty-computation.md)
AMNESTY_RATE             = 0.06
AMNESTY_MINIMUM          = 5_000

// Pre-TRAIN rate constants (see tax-rate-pre-train.md)
PRE_TRAIN_EXEMPTION_THRESHOLD = 200_000  // NTE ≤ ₱200K → ₱0 tax
PRE_TRAIN_CROSSOVER_NTE       = 1_250_000  // NTE above this → amnesty base tax is lower

// Standard deduction amounts (see deduction-standard.md)
STANDARD_DEDUCTION_TRAIN_CITIZEN   = 5_000_000
STANDARD_DEDUCTION_TRAIN_NRA       = 500_000
STANDARD_DEDUCTION_PRE_TRAIN_CITIZEN = 1_000_000
STANDARD_DEDUCTION_PRE_TRAIN_NRA   = 500_000    // Same as TRAIN

// Family home caps (see deduction-family-home.md)
FAMILY_HOME_CAP_TRAIN     = 10_000_000
FAMILY_HOME_CAP_PRE_TRAIN = 1_000_000
```

---

## Master Decision Tree (Pseudocode)

```pseudocode
// ─────────────────────────────────────────────────────────────────────────────
// REGIME DETECTION — Entry Point
//
// Inputs:
//   decedent.dateOfDeath          : Date (YYYY-MM-DD, required)
//   estate.taxFullyPaidBeforeMay2022 : boolean — user declares if estate tax fully paid
//   userElectsAmnesty             : boolean — user explicitly requests amnesty computation
//   [amnesty exclusion flags]     : see checkAmnestyEligibility() below
//
// Outputs:
//   result.regime              : "TRAIN" | "PRE_TRAIN" | "AMNESTY"
//   result.deductionRules      : "TRAIN" | "PRE_TRAIN"
//   result.track               : "TRACK_A" | "TRACK_B" | null  (null for non-amnesty)
//   result.displayDualPath     : boolean — show pre-TRAIN vs. amnesty comparison?
//   result.amnestyEligibility  : eligibility result object | null
//   result.warnings            : string[]  — messages to display to user
// ─────────────────────────────────────────────────────────────────────────────

function detectRegime(decedent, estate, userElectsAmnesty):
  warnings = []

  // ─── BRANCH A: TRAIN-Era Death (Jan 1, 2018 onward) ────────────────────────

  if decedent.dateOfDeath >= TRAIN_EFFECTIVE_DATE:

    // Sub-branch A1: After amnesty coverage cutoff — TRAIN only, no amnesty
    if decedent.dateOfDeath > AMNESTY_COVERAGE_CUTOFF:
      if userElectsAmnesty:
        warnings.append(
          "Estate tax amnesty (RA 11213) is not available for decedents who died " +
          "after May 31, 2022. The regular TRAIN-era estate tax rules apply."
        )
      return {
        regime:             "TRAIN",
        deductionRules:     "TRAIN",
        track:              null,
        displayDualPath:    false,
        amnestyEligibility: null,
        warnings:           warnings
      }

    // Sub-branch A2: 2018-01-01 ≤ dateOfDeath ≤ 2022-05-31
    // Both TRAIN and amnesty (RA 11956) are available, but base tax is IDENTICAL
    // under both paths. Amnesty benefit = surcharge/interest waiver only.

    if userElectsAmnesty:
      eligibility = checkAmnestyEligibility(decedent, estate, true)
      if eligibility.eligible:
        warnings.append(
          "For estates of decedents who died between January 1, 2018 and May 31, 2022, " +
          "the estate tax amnesty rate (6%) is identical to the regular TRAIN estate tax " +
          "rate (6%), and the same deduction rules (TRAIN) apply. The base tax computed " +
          "under both paths is the same. The primary benefit of the amnesty for this " +
          "estate was the waiver of accrued surcharges and interest — which this engine " +
          "does not compute. The amnesty filing window closed June 14, 2025."
        )
        return {
          regime:             "AMNESTY",
          deductionRules:     "TRAIN",    // TRAIN-era death → TRAIN deduction rules
          track:              eligibility.track,
          displayDualPath:    false,       // Both paths produce same result; no comparison needed
          amnestyEligibility: eligibility,
          warnings:           warnings
        }
      else:
        // Failed eligibility check (e.g., PCGG, pending court case, tax already paid)
        warnings.append(
          "This estate does not qualify for the estate tax amnesty: " +
          describeIneligibilityReason(eligibility.reason) +
          " The regular TRAIN estate tax rules apply."
        )
        return {
          regime:             "TRAIN",
          deductionRules:     "TRAIN",
          track:              null,
          displayDualPath:    false,
          amnestyEligibility: eligibility,
          warnings:           warnings
        }
    else:
      // User did not elect amnesty — use regular TRAIN
      // Proactively inform about amnesty option if estate qualifies
      if not estate.taxFullyPaidBeforeMay2022:
        warnings.append(
          "NOTE: This estate's decedent died between January 1, 2018 and May 31, 2022 " +
          "and may have been eligible for the estate tax amnesty under RA 11956. " +
          "For this date range, the amnesty and regular TRAIN estate tax produce the " +
          "same base tax. The amnesty filing window closed June 14, 2025."
        )
      return {
        regime:             "TRAIN",
        deductionRules:     "TRAIN",
        track:              null,
        displayDualPath:    false,
        amnestyEligibility: null,
        warnings:           warnings
      }


  // ─── BRANCH B: Pre-TRAIN Death (before Jan 1, 2018) ────────────────────────
  // Default regime: PRE_TRAIN (graduated rates)
  // Amnesty available if eligible and elected

  // Sub-branch B1: User does not elect amnesty → use regular pre-TRAIN
  if not userElectsAmnesty:
    // Auto-suggest amnesty if the estate might benefit (NTE likely > ₱1,250,000)
    // Note: NTE is not yet computed at this stage; suggestion is proactive
    if not estate.taxFullyPaidBeforeMay2022:
      warnings.append(
        "NOTE: If this estate has unpaid estate tax, the estate tax amnesty " +
        "(RA 11213, as amended by RA 11956) may have been available for estates " +
        "of decedents who died before January 1, 2018. For estates with net taxable " +
        "estate above ₱1,250,000, the amnesty flat rate (6%) produces a lower base " +
        "tax than the regular pre-TRAIN graduated schedule. The filing window closed " +
        "June 14, 2025. Select 'Compute Amnesty Path' to see the amnesty computation."
      )
    return {
      regime:             "PRE_TRAIN",
      deductionRules:     "PRE_TRAIN",
      track:              null,
      displayDualPath:    false,
      amnestyEligibility: null,
      warnings:           warnings
    }

  // Sub-branch B2: User elects amnesty → run eligibility check
  eligibility = checkAmnestyEligibility(decedent, estate, true)

  if not eligibility.eligible:
    // Ineligible — cannot use amnesty; fall back to pre-TRAIN regular
    warnings.append(
      "This estate does not qualify for the estate tax amnesty: " +
      describeIneligibilityReason(eligibility.reason) +
      " The regular pre-TRAIN graduated estate tax applies."
    )
    return {
      regime:             "PRE_TRAIN",
      deductionRules:     "PRE_TRAIN",
      track:              null,
      displayDualPath:    false,
      amnestyEligibility: eligibility,
      warnings:           warnings
    }

  // Sub-branch B3: Eligible for amnesty — select amnesty and compute dual-path comparison
  // The engine computes BOTH paths for comparison (see amnesty-vs-regular.md)
  warnings.append(
    "⚠ AMNESTY FILING WINDOW CLOSED: The estate tax amnesty under RA 11213 " +
    "(as amended by RA 11956) had a filing deadline of June 14, 2025. " +
    "This computation is for HISTORICAL REFERENCE ONLY. Actual availment is " +
    "no longer possible unless Congress enacts a further extension."
  )
  return {
    regime:             "AMNESTY",
    deductionRules:     "PRE_TRAIN",  // Pre-2018 death → pre-TRAIN deduction rules
    track:              eligibility.track,
    displayDualPath:    true,          // Show amnesty vs. pre-TRAIN comparison
    amnestyEligibility: eligibility,
    warnings:           warnings
  }
```

---

## Subroutine: checkAmnestyEligibility

This function is defined in full in `analysis/amnesty-eligibility.md`. Summary for reference:

```pseudocode
function checkAmnestyEligibility(decedent, estate, userElectsAmnesty):
  // Returns: { eligible: boolean, reason: string, track: "TRACK_A"|"TRACK_B" }

  if not userElectsAmnesty:
    return { eligible: false, reason: "USER_NOT_ELECTED" }

  if decedent.dateOfDeath > Date(2022, 5, 31):
    return { eligible: false, reason: "DEATH_AFTER_COVERAGE_CUTOFF" }

  if estate.taxFullyPaidBeforeMay2022:
    return { eligible: false, reason: "TAX_ALREADY_PAID" }

  // Six categorical exclusions from RA 11213 Sec. 9:
  if decedent.subjectToPCGGJurisdiction:
    return { eligible: false, reason: "PCGG_EXCLUSION" }
  if estate.hasRA3019Violations:
    return { eligible: false, reason: "RA3019_EXCLUSION" }
  if estate.hasRA9160Violations:
    return { eligible: false, reason: "RA9160_EXCLUSION" }
  if estate.hasPendingCourtCasePreAmnestyAct:  // Filed before Feb 14, 2019
    return { eligible: false, reason: "PENDING_COURT_CASE_EXCLUSION" }
  if estate.hasUnexplainedWealthCases:
    return { eligible: false, reason: "UNEXPLAINED_WEALTH_EXCLUSION" }
  if estate.hasPendingRPCFelonies:
    return { eligible: false, reason: "RPC_FELONY_EXCLUSION" }

  track = estate.priorReturnFiled ? "TRACK_B" : "TRACK_A"
  return { eligible: true, reason: "ELIGIBLE", track: track }
```

---

## Subroutine: describeIneligibilityReason

```pseudocode
function describeIneligibilityReason(reason):
  switch reason:
    case "TAX_ALREADY_PAID":
      return "the estate tax has already been fully paid (amnesty covers only unpaid or unsettled taxes)"
    case "PCGG_EXCLUSION":
      return "the decedent's assets are under PCGG jurisdiction (RA 11213 Sec. 9)"
    case "RA3019_EXCLUSION":
      return "there are pending violations under the Anti-Graft and Corrupt Practices Act (RA 3019)"
    case "RA9160_EXCLUSION":
      return "there are pending violations under the Anti-Money Laundering Act (RA 9160)"
    case "PENDING_COURT_CASE_EXCLUSION":
      return "a court case against the estate was filed before February 14, 2019 (the RA 11213 enactment date)"
    case "UNEXPLAINED_WEALTH_EXCLUSION":
      return "there are pending unexplained wealth proceedings under RA 1379"
    case "RPC_FELONY_EXCLUSION":
      return "there are pending felony cases under the Revised Penal Code"
    default:
      return "an exclusion condition applies"
```

---

## Complete Regime–DeductionRules Matrix

All four valid combinations and what they mean:

| `regime` | `deductionRules` | When This Occurs | Tax Rate | Output Form |
|----------|-----------------|-----------------|----------|-------------|
| `"TRAIN"` | `"TRAIN"` | `dateOfDeath >= 2018-01-01`, no amnesty | Flat 6% | BIR Form 1801 (Jan 2018) |
| `"PRE_TRAIN"` | `"PRE_TRAIN"` | `dateOfDeath < 2018-01-01`, no amnesty | Graduated 0%–20% | BIR Form 1801 (Jun 2006) |
| `"AMNESTY"` | `"TRAIN"` | `2018-01-01 ≤ dateOfDeath ≤ 2022-05-31`, amnesty elected, eligible | Flat 6% (= regular TRAIN; base tax identical) | ETAR + APF |
| `"AMNESTY"` | `"PRE_TRAIN"` | `dateOfDeath < 2018-01-01`, amnesty elected, eligible | Flat 6% on amnesty base (min ₱5,000) | ETAR + APF |

The combination `"TRAIN"` with `deductionRules = "PRE_TRAIN"` and `"PRE_TRAIN"` with `deductionRules = "TRAIN"` are **invalid** and must never occur. Regime detection guarantees this.

---

## Required Inputs for Regime Detection

These inputs must be collected before regime detection can run:

| Input Field | Type | Required | Source | Notes |
|-------------|------|----------|--------|-------|
| `decedent.dateOfDeath` | Date (YYYY-MM-DD) | Always | User | Primary branching criterion; must be validated as a real calendar date |
| `userElectsAmnesty` | boolean | Always | User | Engine defaults to `false`; user must affirmatively request amnesty path |
| `estate.taxFullyPaidBeforeMay2022` | boolean | If `dateOfDeath ≤ 2022-05-31` | User declares | Only relevant for amnesty eligibility; `true` means amnesty unavailable |
| `estate.priorReturnFiled` | boolean | If amnesty elected | User declares | Determines Track A vs. Track B |
| `estate.previouslyDeclaredNetEstate` | number (₱) | If `priorReturnFiled = true` | User provides from prior return | Track B computation base |
| `decedent.subjectToPCGGJurisdiction` | boolean | If amnesty elected | User declares | RA 11213 Sec. 9 exclusion |
| `estate.hasRA3019Violations` | boolean | If amnesty elected | User declares | RA 11213 Sec. 9 exclusion |
| `estate.hasRA9160Violations` | boolean | If amnesty elected | User declares | RA 11213 Sec. 9 exclusion |
| `estate.hasPendingCourtCasePreAmnestyAct` | boolean | If amnesty elected | User declares | Court case filed before Feb 14, 2019 |
| `estate.hasUnexplainedWealthCases` | boolean | If amnesty elected | User declares | RA 1379 proceedings |
| `estate.hasPendingRPCFelonies` | boolean | If amnesty elected | User declares | Revised Penal Code felony cases |

**Implementation note**: The exclusion flags (`hasRA3019Violations`, etc.) need only be collected if the user elects amnesty. The engine may display them as a single "any exclusions?" screen shown only when `userElectsAmnesty = true`.

---

## Downstream Effects of Regime Detection Output

Every downstream computation function must accept `regime` and `deductionRules` as parameters. The following table shows which functions branch on which flag:

### Functions that branch on `regime`:

| Function | `"TRAIN"` | `"PRE_TRAIN"` | `"AMNESTY"` |
|----------|-----------|--------------|------------|
| `applyTaxRate(netTaxableEstate)` | `× 0.06` (flat) | `computeGraduatedTax(...)` | `max(5000, amnestyBase × 0.06)` |
| `getAmnestyBase(track, ...)` | N/A | N/A | Track A: full NTE; Track B: NTE − previouslyDeclared |
| `allowForeignTaxCredit()` | `true` | `true` | `false` |
| `getOutputForm()` | Form 1801 (Jan 2018) | Form 1801 (Jun 2006) | ETAR + APF |
| `showFilingWindowClosedNotice()` | `false` | `false` | `true` |
| `computeDualPathComparison()` | N/A | N/A | `true` if `displayDualPath` |

### Functions that branch on `deductionRules`:

| Function | `"TRAIN"` | `"PRE_TRAIN"` |
|----------|-----------|--------------|
| `getStandardDeductionAmount(decedent)` | ₱5,000,000 (citizen/resident); ₱500,000 (NRA) | ₱1,000,000 (citizen/resident); ₱500,000 (NRA) |
| `getFamilyHomeCap()` | ₱10,000,000 | ₱1,000,000 |
| `funeralExpensesDeductible()` | `false` | `true` |
| `judicialAdminExpensesDeductible()` | `false` | `true` |
| `computeFuneralExpenseDeduction(actual, GE)` | `0` | `min(actual, 0.05 × GE)` |
| `computeJudicialAdminExpenseDeduction(actual)` | `0` | `actual` |

**Ordering rule**: `deductionRules` controls deduction amounts; `regime` controls rate functions. A developer must check `deductionRules` (not `regime`) when selecting deduction amounts.

---

## Computation Pipeline Selection

Based on the regime detection output, the engine routes to one of three computation pipelines:

### Pipeline 1: TRAIN (`regime = "TRAIN"`)

```
detectRegime() → regime="TRAIN", deductionRules="TRAIN"
    ↓
computeGrossEstate(decedent, assets, deductionRules="TRAIN")
    ↓
computeOrdinaryDeductions(decedent, inputs, deductionRules="TRAIN")
    [5A claims, 5B insolvent, 5C mortgages/taxes, 5D casualties, 5E vanishing, 5F public transfers]
    [NO funeral, NO judicial/admin]
    ↓
computeSpecialDeductions(decedent, inputs, deductionRules="TRAIN")
    [Standard ₱5M / ₱500K NRA, family home cap ₱10M, medical ₱500K, RA4917]
    ↓
computeSurvivingSpouseShare(...)
    ↓
applyTaxRate(netTaxableEstate, regime="TRAIN")
    → estateTaxDue = netTaxableEstate × 0.06
    ↓
applyForeignTaxCredit(...)
    ↓
output → Form 1801 (Jan 2018 revision), Items 29–44
```

### Pipeline 2: PRE_TRAIN (`regime = "PRE_TRAIN"`)

```
detectRegime() → regime="PRE_TRAIN", deductionRules="PRE_TRAIN"
    ↓
computeGrossEstate(decedent, assets, deductionRules="PRE_TRAIN")   [same structure]
    ↓
computeOrdinaryDeductions(decedent, inputs, deductionRules="PRE_TRAIN")
    [5A claims, 5B insolvent, 5C mortgages/taxes, 5D casualties, 5E vanishing, 5F public transfers]
    [+ funeral expenses: min(actual, 0.05 × GE.total)]   ← ORDER MATTERS: GE must be finalized first
    [+ judicial/admin expenses: actual, no cap]
    ↓
computeSpecialDeductions(decedent, inputs, deductionRules="PRE_TRAIN")
    [Standard ₱1M / ₱500K NRA, family home cap ₱1M, medical ₱500K, RA4917]
    ↓
computeSurvivingSpouseShare(...)
    ↓
applyTaxRate(netTaxableEstate, regime="PRE_TRAIN")
    → estateTaxDue = computeGraduatedTax(netTaxableEstate)  // see tax-rate-pre-train.md
    ↓
applyForeignTaxCredit(...)
    ↓
output → Form 1801 (Jun 2006 revision) labeled "PRE-TRAIN ESTATE TAX"
```

### Pipeline 3: AMNESTY (`regime = "AMNESTY"`)

```
detectRegime() → regime="AMNESTY", deductionRules="TRAIN"|"PRE_TRAIN", track="TRACK_A"|"TRACK_B"
    ↓
computeGrossEstate(decedent, assets, deductionRules)   [same structure as TRAIN/PRE_TRAIN]
    ↓
computeOrdinaryDeductions(decedent, inputs, deductionRules)   [branches on deductionRules]
    ↓
computeSpecialDeductions(decedent, inputs, deductionRules)    [branches on deductionRules]
    ↓
computeSurvivingSpouseShare(...)
    ↓
selectAmnestyBase(track, netTaxableEstate, estate.previouslyDeclaredNetEstate)
    → TRACK_A: amnestyBase = netTaxableEstate
    → TRACK_B: amnestyBase = max(0, netTaxableEstate − estate.previouslyDeclaredNetEstate)
    ↓
applyTaxRate(amnestyBase, regime="AMNESTY")
    → computedTax = amnestyBase × 0.06
    → amnestyTaxDue = max(5_000, computedTax)
    ↓
// NO foreign tax credit — amnesty has no credit line
    ↓
output → ETAR (Estate Tax Amnesty Return) + APF
         + display: filing window closed notice

If displayDualPath = true:
    ALSO run Pipeline 2 (pre-TRAIN) on same inputs → compute preTRAINResult
    Display amnesty-vs-regular comparison table (see amnesty-vs-regular.md)
```

---

## Visual Decision Tree

```
                    decedent.dateOfDeath
                           │
           ┌───────────────┼───────────────────────┐
           │                                        │
    < 2018-01-01                           ≥ 2018-01-01
    (PRE-TRAIN ERA)                        (TRAIN ERA)
           │                                        │
           │                          ┌─────────────┼─────────────┐
           │                          │                            │
           │                   ≤ 2022-05-31                  > 2022-05-31
           │                 (RA 11956 window)                 (TRAIN only)
           │                          │                            │
           │               userElectsAmnesty?              REGIME = TRAIN
           │                ┌─────────┴─────────┐          deductionRules = TRAIN
           │               YES                  NO
           │                │                   │
           │         checkEligibility()    REGIME = TRAIN
           │          ┌─────┴──────┐       deductionRules = TRAIN
           │       eligible     ineligible     (+ note: amnesty
           │          │             │           produces same tax)
           │    REGIME = AMNESTY  REGIME = TRAIN
           │    deductionRules = TRAIN (!)
           │    (rates identical;         │
           │     note displayed)         │
           │                             │
    userElectsAmnesty?
       ┌───┴───┐
      YES      NO
       │        │
  checkEligibility()   REGIME = PRE_TRAIN
   ┌───┴───┐           deductionRules = PRE_TRAIN
eligible  ineligible    (+ suggestion if
   │          │          estate unpaid)
REGIME =   REGIME =
AMNESTY    PRE_TRAIN
deductionRules=PRE_TRAIN
track = A or B
displayDualPath = true
```

---

## Regime Detection: Error Cases

The following inputs are invalid and must produce error responses (not regime detection results):

| Invalid Input | Error | Engine Response |
|---------------|-------|-----------------|
| `dateOfDeath` is null or not provided | `ERR_DATE_REQUIRED` | "Date of death is required. Please enter the decedent's date of death to proceed." |
| `dateOfDeath` is in the future | `ERR_DATE_FUTURE` | "Date of death cannot be in the future. Please verify the date entered." |
| `dateOfDeath` before 1901-01-01 | `ERR_DATE_IMPLAUSIBLE` | "Date of death appears implausible. Please verify." (Philippine estate tax law's NIRC dates from 1939.) |
| `estate.previouslyDeclaredNetEstate` not provided when `priorReturnFiled = true` and Track B selected | `ERR_TRACK_B_MISSING_INPUT` | "For Track B amnesty (prior return filed), please enter the net estate amount from the prior estate tax return." |
| `estate.previouslyDeclaredNetEstate` is negative | `ERR_PRIOR_DECLARED_NEGATIVE` | "Previously declared net estate cannot be negative." |

---

## Edge Cases

### EC-RD-01: Date of death exactly Jan 1, 2018 (TRAIN boundary)

```
dateOfDeath = 2018-01-01
Result: regime = "TRAIN", deductionRules = "TRAIN"
```
The TRAIN Law is effective January 1, 2018. A death on exactly January 1, 2018 falls under TRAIN. The comparison is `>=` not `>`.

### EC-RD-02: Date of death Dec 31, 2017 (last pre-TRAIN day)

```
dateOfDeath = 2017-12-31
Result: regime = "PRE_TRAIN", deductionRules = "PRE_TRAIN"
```
One day before TRAIN effective date → graduated rate schedule applies.

### EC-RD-03: Date of death May 31, 2022 (last day of amnesty coverage)

```
dateOfDeath = 2022-05-31, userElectsAmnesty = true, eligible = true
Result: regime = "AMNESTY", deductionRules = "TRAIN", track = "TRACK_A"|"TRACK_B"
```
The AMNESTY_COVERAGE_CUTOFF is inclusive: deaths on or before May 31, 2022 are covered.

### EC-RD-04: Date of death June 1, 2022 (one day after amnesty coverage cutoff)

```
dateOfDeath = 2022-06-01, userElectsAmnesty = true
Result: regime = "TRAIN", deductionRules = "TRAIN"
Warning: "Estate tax amnesty is not available for decedents who died after May 31, 2022."
```

### EC-RD-05: Pre-2018 death, amnesty elected, PCGG estate

```
dateOfDeath = 2010-06-15, userElectsAmnesty = true
decedent.subjectToPCGGJurisdiction = true
Result: regime = "PRE_TRAIN", deductionRules = "PRE_TRAIN"
Warning: "This estate does not qualify for the estate tax amnesty: the decedent's assets are under PCGG jurisdiction."
```

### EC-RD-06: Pre-2018 death, tax already paid, user asks about amnesty

```
dateOfDeath = 2015-03-10, estate.taxFullyPaidBeforeMay2022 = true
userElectsAmnesty = true
Result: regime = "PRE_TRAIN", deductionRules = "PRE_TRAIN"
Reason: TAX_ALREADY_PAID — fully paid estates are ineligible for amnesty
```

### EC-RD-07: Pre-2018 death, prior return filed, Track B

```
dateOfDeath = 2013-08-20, estate.priorReturnFiled = true
estate.previouslyDeclaredNetEstate = 2_000_000
userElectsAmnesty = true, eligible = true
Result: regime = "AMNESTY", deductionRules = "PRE_TRAIN", track = "TRACK_B"
displayDualPath = true  // Both amnesty and pre-TRAIN results shown for comparison
```

### EC-RD-08: Pre-2018 death, NTE likely < ₱1,250,000 (amnesty not beneficial)

```
dateOfDeath = 2016-05-01, estate.taxFullyPaidBeforeMay2022 = false
userElectsAmnesty = false
Result: regime = "PRE_TRAIN", deductionRules = "PRE_TRAIN"
Warning: "If this estate has unpaid estate tax, the amnesty may have been available..."
(The engine cannot determine NTE at regime-detection time; it only proactively suggests)
```

### EC-RD-09: TRAIN-era death (2020), user does not elect amnesty

```
dateOfDeath = 2020-09-15, userElectsAmnesty = false
estate.taxFullyPaidBeforeMay2022 = false
Result: regime = "TRAIN", deductionRules = "TRAIN"
Warning: "Decedent died between January 1, 2018 and May 31, 2022 — amnesty may have been available,
         but base tax is identical to regular TRAIN (rate parity). Filing window closed June 14, 2025."
```

### EC-RD-10: Pre-2018 death, court case filed January 15, 2019 (before RA 11213 enacted Feb 14, 2019)

```
dateOfDeath = 2012-04-10, userElectsAmnesty = true
estate.hasPendingCourtCasePreAmnestyAct = true  // Case filed Jan 15, 2019 < Feb 14, 2019
Result: regime = "PRE_TRAIN", deductionRules = "PRE_TRAIN"
Reason: PENDING_COURT_CASE_EXCLUSION
```

### EC-RD-11: Non-resident alien (NRA) decedent — regime detection unchanged

```
decedent.isNonResidentAlien = true, dateOfDeath = 2019-05-01
Result: regime = "TRAIN", deductionRules = "TRAIN"
```
NRA status does NOT affect regime selection. Regime is determined solely by date of death. NRA status affects gross estate scope (PH-situs only), deduction amounts (₱500K standard deduction, proportional ELIT, no family home), and credit availability (no foreign tax credit) — all handled by downstream deduction functions, not by regime detection.

### EC-RD-12: Multiple decedents (married couple, both died pre-2018)

Each decedent's estate is a **separate regime detection call** and a separate estate tax computation. The engine handles each independently. A married couple scenario where both died before 2018 will produce two separate PRE_TRAIN (or AMNESTY) computations. Assets shared between the two estates (e.g., conjugal property with complex cross-ownership) require user guidance on allocation but remain separate computations.

---

## Form 1801 Mapping

Regime detection does not produce Form 1801 fields directly. It is a pre-computation routing step. However, the regime detection output controls which form version the engine labels its output with:

| `regime` | Output Form Label |
|----------|------------------|
| `"TRAIN"` | BIR Form 1801 (January 2018 revision) |
| `"PRE_TRAIN"` | BIR Form 1801 (June 2006 revision) — labeled "PRE-TRAIN ESTATE TAX COMPUTATION" |
| `"AMNESTY"` | Estate Tax Amnesty Return (ETAR) + Acceptance Payment Form (APF) — labeled "ESTATE TAX AMNESTY COMPUTATION (RA 11213, as amended by RA 11956)" |

---

## Test Implications

| Test ID | Scenario | Expected `regime` | Expected `deductionRules` | Expected `track` | Expected `displayDualPath` |
|---------|----------|------------------|--------------------------|-----------------|--------------------------|
| T-RD-01 | Death 2023-01-01, no amnesty | TRAIN | TRAIN | null | false |
| T-RD-02 | Death 2018-01-01 (boundary), no amnesty | TRAIN | TRAIN | null | false |
| T-RD-03 | Death 2017-12-31 (one day pre-TRAIN), no amnesty | PRE_TRAIN | PRE_TRAIN | null | false |
| T-RD-04 | Death 2020-06-01, amnesty elected, eligible (Track A) | AMNESTY | TRAIN | TRACK_A | false |
| T-RD-05 | Death 2022-05-31 (cutoff boundary), amnesty elected, eligible | AMNESTY | TRAIN | TRACK_A | false |
| T-RD-06 | Death 2022-06-01 (day after cutoff), amnesty elected | TRAIN | TRAIN | null | false |
| T-RD-07 | Death 2015-07-04, amnesty elected, eligible, prior return filed | AMNESTY | PRE_TRAIN | TRACK_B | true |
| T-RD-08 | Death 2015-07-04, amnesty elected, eligible, no prior return | AMNESTY | PRE_TRAIN | TRACK_A | true |
| T-RD-09 | Death 2015-07-04, amnesty elected, PCGG exclusion | PRE_TRAIN | PRE_TRAIN | null | false |
| T-RD-10 | Death 2015-07-04, tax fully paid before May 2022, amnesty elected | PRE_TRAIN | PRE_TRAIN | null | false |
| T-RD-11 | Death 2015-07-04, no amnesty election | PRE_TRAIN | PRE_TRAIN | null | false |
| T-RD-12 | Death 2010-01-01, amnesty elected, RA3019 violation | PRE_TRAIN | PRE_TRAIN | null | false |
| T-RD-13 | Death 2010-01-01, amnesty elected, court case filed Jan 15 2019 | PRE_TRAIN | PRE_TRAIN | null | false |
| T-RD-14 | Death 2010-01-01, amnesty elected, court case filed Feb 20 2019 (after enactment) | AMNESTY | PRE_TRAIN | TRACK_A | true |
| T-RD-15 | NRA decedent, death 2021-03-10, no amnesty | TRAIN | TRAIN | null | false |

---

## Relationship to Other Aspects

- **amnesty-eligibility.md**: The `checkAmnestyEligibility()` function defined there is the core subroutine called by regime detection for all amnesty-election paths.
- **amnesty-vs-regular.md**: When `displayDualPath = true`, the engine runs both amnesty and pre-TRAIN computations and presents the comparison defined in that file.
- **computation-pipeline.md** (Wave 5, next): Uses the regime detection output as input to route the full computation pipeline.
- **data-model.md** (Wave 5): The `RegimeDetectionResult` type (with fields `regime`, `deductionRules`, `track`, `displayDualPath`, `warnings`) must be formally defined.
- **deductions-pre-train-diffs.md**: All deduction functions must accept `deductionRules` (not just `regime`) to correctly handle the `AMNESTY + PRE_TRAIN` combination.
- **correction-amnesty-deductions.md**: The `getOrdinaryDeductionItems(regime, deductionRules)` corrected signature reflects this two-parameter pattern.

---

## Summary

Regime detection is a pure routing function with no computation logic. It takes the decedent's date of death and a few user flags as input, and outputs two independent flags (`regime` and `deductionRules`) plus metadata for display.

**The fundamental rule**:
- `regime` is determined by date of death (TRAIN vs. PRE_TRAIN boundary = January 1, 2018) with optional amnesty override (user election + eligibility check).
- `deductionRules` within amnesty is determined solely by date of death (pre-2018 → PRE_TRAIN deduction rules; 2018+ → TRAIN deduction rules).
- These two flags are **independent** and must be passed separately to all downstream functions.

Key constants a developer must hardcode:
```
TRAIN_EFFECTIVE_DATE     = Date(2018, 1, 1)    // Inclusive: deaths ON this date → TRAIN
AMNESTY_COVERAGE_CUTOFF  = Date(2022, 5, 31)   // Inclusive: deaths ON this date → eligible
PRE_TRAIN_CROSSOVER_NTE  = 1_250_000           // Amnesty produces lower base tax above this
AMNESTY_MINIMUM          = 5_000               // Always applies to amnesty path
PRE_TRAIN_EXEMPTION      = 200_000             // Pre-TRAIN zero-tax threshold
```

The only user action that can change the regime from the date-of-death default is explicitly electing the amnesty path (`userElectsAmnesty = true`) — and only if the eligibility check passes. The engine never auto-selects amnesty; it is always a user election with full disclosure that the filing window is closed.
