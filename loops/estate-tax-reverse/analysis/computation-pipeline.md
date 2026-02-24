# Analysis: Computation Pipeline (End-to-End, All Three Regimes)

**Aspect**: computation-pipeline
**Wave**: 5 — Synthesis
**Date Analyzed**: 2026-02-24
**Depends On**: ALL Wave 1–4 analysis files (full synthesis)

---

## Purpose

This document is the **master computation graph** for the Philippine estate tax engine. It defines the exact order of operations from raw user inputs through every intermediate value to the final tax due, for all three regimes. A developer can implement the full engine by reading this document plus the individual analysis files it references for each step.

---

## Engine Architecture Overview

The engine is a pure function: given inputs describing the decedent, assets, and deductions, it returns a deterministic computation result. No valuation logic is included — the user provides all FMV figures.

```
Inputs (user-provided)
    │
    ▼
┌─────────────────────────────┐
│  Phase 0: Input Validation  │  ERR_* codes if invalid
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│  Phase 1: Regime Detection  │  regime, deductionRules, track, displayDualPath
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│  Phase 2: Sec. 87 Exclusions│  Remove exempt assets from gross estate
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│  Phase 3: Gross Estate      │  Items 29–34 (A/B/C columns)
│  (Items 29–34)              │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│  Phase 4: Ordinary          │  Schedule 5 (5A–5F, plus 5G/5H for pre-TRAIN)
│  Deductions (Item 35)       │  CRITICAL: funeral limit computed after Item 34
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│  Phase 5: Estate After Ord. │  Item 36 = max(0, Item34 − Item35), per column
│  Deductions (Item 36)       │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│  Phase 6: Special           │  Schedule 6 (6A standard, 6B family home,
│  Deductions (Item 37)       │  6C medical, 6D RA4917)
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│  Phase 7: Net Estate        │  Item 38 = max(0, Item36.C − Item37)
│  (Item 38)                  │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│  Phase 8: Surviving Spouse  │  Item 39 = (Item34.B − community obligations) × 0.50
│  Share (Item 39)            │  Uses GROSS Column B, not Item36.B
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│  Phase 9: Net Taxable       │  Item 40 = max(0, Item38 − Item39)
│  Estate (Item 40)           │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│  Phase 10: Amnesty Track    │  AMNESTY only: select base = NTE or (NTE − prior declared)
│  Selection (if applicable)  │  Regular regimes: skip this phase
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│  Phase 11: Tax Rate         │  TRAIN: flat 6%   PRE_TRAIN: graduated 0–20%
│  Application (Item 42)      │  AMNESTY: 6% × base, min ₱5,000
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│  Phase 12: Foreign Tax      │  Item 43: citizens/residents only; not available
│  Credit (Item 43)           │  under amnesty
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│  Phase 13: Net Estate Tax   │  Item 44 = max(0, Item42 − Item43)
│  Due (Item 44 / Item 20)    │  This is the engine's primary output
└─────────────────────────────┘
    │
    ▼
Output: ComputationResult object
    + Explainer section (plain-English, see explainer-format.md)
    + Dual-path comparison (if displayDualPath = true)
```

---

## Master Computation Function

```pseudocode
// ─────────────────────────────────────────────────────────────────────────────
// TOP-LEVEL ENGINE ENTRY POINT
//
// Input:  EstateTaxInput (all user-provided fields — see Input Contract below)
// Output: EstateTaxResult (all intermediate values + final tax due)
// ─────────────────────────────────────────────────────────────────────────────

function computeEstateTax(input: EstateTaxInput): EstateTaxResult

  // ─── Phase 0: Input Validation ────────────────────────────────────────────
  errors = validateInputs(input)
  if errors is not empty:
    return { valid: false, errors: errors }

  // ─── Phase 1: Regime Detection ────────────────────────────────────────────
  // See analysis/regime-detection.md for full decision tree.
  // Produces: regime, deductionRules, track, displayDualPath, warnings
  regime_result = detectRegime(input.decedent, input.estate, input.userElectsAmnesty)
  // regime_result.regime        : "TRAIN" | "PRE_TRAIN" | "AMNESTY"
  // regime_result.deductionRules: "TRAIN" | "PRE_TRAIN"
  // regime_result.track         : "TRACK_A" | "TRACK_B" | null
  // regime_result.displayDualPath: boolean

  // ─── Phase 1a: Dual-Path Comparison (Amnesty vs. Pre-TRAIN) ──────────────
  // Only when user elected amnesty for a pre-2018 estate.
  // Run BOTH pipelines; display comparison to user.
  dualPathResult = null
  if regime_result.displayDualPath:
    preTrainResult = runPreTrainPipeline(input, "PRE_TRAIN", "PRE_TRAIN")
    amnestyResult  = runAmnestyCitizenPipeline(input, regime_result)
    dualPathResult = buildDualPathComparison(preTrainResult, amnestyResult)
    // See analysis/amnesty-vs-regular.md for crossover logic
    // Engine outputs BOTH; user sees amnesty is better if NTE > ₱1,250,000

  // ─── Phase 2: Route to Correct Pipeline ───────────────────────────────────
  if regime_result.regime == "TRAIN":
    result = runTrainPipeline(input, regime_result)

  elif regime_result.regime == "PRE_TRAIN":
    result = runPreTrainPipeline(input, "PRE_TRAIN", "PRE_TRAIN")

  elif regime_result.regime == "AMNESTY":
    result = runAmnestyPipeline(input, regime_result)

  // ─── Phase 13: Attach Metadata ────────────────────────────────────────────
  result.regime          = regime_result.regime
  result.deductionRules  = regime_result.deductionRules
  result.warnings        = regime_result.warnings
  result.dualPathResult  = dualPathResult
  result.valid           = true

  return result
```

---

## Phase 0: Input Validation

Run before any computation. Return all validation errors together (not fail-fast).

```pseudocode
function validateInputs(input):
  errors = []

  // Required always:
  if input.decedent.dateOfDeath is null:
    errors.append({ field: "dateOfDeath", code: "ERR_DATE_REQUIRED",
      message: "Date of death is required." })
  elif input.decedent.dateOfDeath > TODAY:
    errors.append({ field: "dateOfDeath", code: "ERR_DATE_FUTURE",
      message: "Date of death cannot be in the future." })
  elif input.decedent.dateOfDeath < Date(1901, 1, 1):
    errors.append({ field: "dateOfDeath", code: "ERR_DATE_IMPLAUSIBLE",
      message: "Date of death appears implausible. Please verify." })

  if input.decedent.residencyStatus not in ("citizen", "residentAlien", "nonResidentAlien"):
    errors.append({ field: "residencyStatus", code: "ERR_RESIDENCY_REQUIRED",
      message: "Decedent's residency status is required." })

  if input.assets is empty or null:
    errors.append({ field: "assets", code: "ERR_NO_ASSETS",
      message: "At least one asset must be entered." })

  for asset in input.assets:
    if asset.fmv < 0:
      errors.append({ field: "asset.fmv", assetId: asset.id, code: "ERR_NEGATIVE_FMV",
        message: "Fair market value cannot be negative." })

  // Conditional: Track B amnesty
  if input.userElectsAmnesty and input.estate.priorReturnFiled:
    if input.estate.previouslyDeclaredNetEstate is null:
      errors.append({ field: "previouslyDeclaredNetEstate", code: "ERR_TRACK_B_MISSING",
        message: "For Track B amnesty, enter the net estate amount from the prior return." })
    elif input.estate.previouslyDeclaredNetEstate < 0:
      errors.append({ field: "previouslyDeclaredNetEstate", code: "ERR_PRIOR_NEGATIVE",
        message: "Previously declared net estate cannot be negative." })

  // NRA validation
  if input.decedent.residencyStatus == "nonResidentAlien":
    if input.decedent.totalWorldwideGrossEstate is null:
      errors.append({ field: "totalWorldwideGrossEstate", code: "ERR_WORLDWIDE_REQUIRED",
        message: "For non-resident aliens, total worldwide gross estate is required for deduction computation." })
    elif input.decedent.totalWorldwideGrossEstate < sum(asset.fmv for asset in input.assets):
      errors.append({ field: "totalWorldwideGrossEstate", code: "ERR_WORLDWIDE_LT_PH",
        message: "Total worldwide gross estate cannot be less than Philippine gross estate." })

  return errors
```

---

## Phase 2: Section 87 Exempt Transfer Exclusions

Run BEFORE populating gross estate. Assets flagged as Sec. 87 exempt are excluded entirely — they never appear in Items 29–34.

```pseudocode
// See analysis/exemptions.md for full conditions.
// Four categories of exempt transfers:
//   (a) Personal usufruct — rights that extinguish at death by merger with naked ownership
//       Excluded condition: usufruct is for the lifetime of decedent (not fixed-term)
//       Fixed-term usufruct remaining at death → INCLUDE at Sec. 88(A) actuarial value
//
//   (b) Transmission from fiduciary heir to fideicommissary
//       The pass-through estate is excluded from BOTH the fiduciary's and fideicommissary's
//       gross estate (it is not doubled-taxed)
//
//   (c) Fideicommissary transmission to surviving fideicommissary
//       Same as (b) — excluded from gross estate
//
//   (d) Bequests to private qualifying charitable/religious/educational institutions
//       Conditions: no income inures to private individuals + admin expenses ≤ 30%
//       Foreign charitable institutions do NOT qualify under Sec. 87(d)
//       GOCCs: use Sec. 86(A)(3) deduction instead (government transfer deduction, not Sec. 87)
//       Partial bequests (e.g., 40% of property to charity): allocate qualifying fraction to Sec. 87;
//       remaining fraction enters gross estate normally

// Engine contract:
for asset in input.assets:
  asset.sec87Exclusion = determineSec87Exclusion(asset)
  // Returns: null | { category: "a"|"b"|"c"|"d", basisExplainer: string }

qualifyingAssets = [a for a in input.assets where a.sec87Exclusion == null]
excludedAssets   = [a for a in input.assets where a.sec87Exclusion != null]

// Excluded assets produce a separate "Sec. 87 Exemptions Summary" output section.
// They do NOT appear in any Schedule or Item 29–34.
// Regime-invariant: same rule for TRAIN, pre-TRAIN, and amnesty.
```

---

## Phase 3: Gross Estate (Items 29–34)

Items 29–34 use a three-column structure throughout:
- **Column A**: Exclusive property (decedent's alone)
- **Column B**: Conjugal/community property (shared; spouse's 50% removed at Item 39)
- **Column C**: Total (A + B)

Column B always contains **full FMV** of the conjugal asset. The spouse's 50% is removed at Item 39 (surviving spouse share), NOT by entering half the FMV in Column B.

```pseudocode
// ─── SCOPE: Citizens and Resident Aliens ────────────────────────────────────
// Worldwide assets — all assets regardless of location.
// Regime-invariant (Sec. 85 unchanged by TRAIN).

// ─── SCOPE: Non-Resident Aliens ─────────────────────────────────────────────
// PH-situs assets ONLY.
// Intangible personal property excluded if reciprocity applies (user-declared boolean).
// See analysis/gross-estate-nonresident.md for situs rules by asset type.

// Item 29: Real Property (Sec. 85(A))
// Excludes family home (reported separately at Item 30)
Item29 = {
  A: sum(asset.fmv for exclusive real property assets, excluding family home),
  B: sum(asset.fmv for conjugal real property assets, excluding family home),
  C: Item29.A + Item29.B
}

// Item 30: Family Home (Sec. 85(A) + Sec. 86(A)(5))
// At most ONE property may be designated as the family home.
// NRA: Item30 = { A:0, B:0, C:0 } (family home deduction unavailable to NRAs)
Item30 = {
  A: fmv of exclusive family home (0 if no exclusive family home),
  B: FULL FMV of conjugal family home (NOT halved here; halving at Item37B deduction),
  C: Item30.A + Item30.B
}

// Item 31: Personal Property — Tangible and Intangible (Sec. 85(A))
// Includes: cash, bank deposits, vehicles, jewelry, stocks, bonds, receivables
// NRA + reciprocity: intangible personal property of NRA with reciprocity exemption = 0
Item31 = {
  A: sum(exclusive personal property),
  B: sum(conjugal personal property),
  C: Item31.A + Item31.B
}

// Item 32: Taxable Transfers (Sec. 85(B)–(G)) — Schedule 3
// Six inclusion rules. All regime-invariant. See analysis/gross-estate-inclusions.md.
// (B) Transfers in contemplation of death: FMV at death; 3-year presumption of contemplation
// (C) Revocable transfers: power retained at death OR relinquished ≤3 years before death
// (D) General power of appointment exercised by will (always) or by deed ≤3 years before death
// (E) Life insurance: estate-designated or revocably-designated beneficiary → included;
//     irrevocably-designated non-estate beneficiary → excluded
// (F) Retroactivity clause only (no computation impact)
// (G) Insufficient consideration: included amount = max(0, fmvAtDeath − consideration received)
Item32 = {
  A: sum(exclusive taxable transfers),
  B: sum(conjugal taxable transfers),
  C: Item32.A + Item32.B
}

// Item 33: Business Interests (Sec. 85(A))
// Partnerships, corporations, etc. FMV floored at 0 (business cannot have negative FMV in GE).
Item33 = {
  A: max(0, sum(exclusive business interests)),
  B: max(0, sum(conjugal business interests)),
  C: Item33.A + Item33.B
}

// Item 34: Total Gross Estate
Item34 = {
  A: Item29.A + Item30.A + Item31.A + Item32.A + Item33.A,
  B: Item29.B + Item30.B + Item31.B + Item32.B + Item33.B,
  C: Item34.A + Item34.B
}
// Item34.C is the reference gross estate used for:
//   - Pre-TRAIN funeral expense limit (Item34.C × 0.05)
//   - NRA proportional deduction factor denominator (totalWorldwideGrossEstate)
//   - Vanishing deduction ratio (Item34.C − ELIT) / Item34.C
//   - NRA: proportional_factor = Item34.C / decedent.totalWorldwideGrossEstate
```

---

## Phase 4: Ordinary Deductions (Item 35 / Schedule 5)

**Critical ordering constraint**: Funeral expense deduction (pre-TRAIN only) depends on Item34.C. Gross estate (Phase 3) MUST be fully computed before this phase begins.

### Sub-items (all regimes share 5A–5F; pre-TRAIN adds 5G and 5H):

```pseudocode
// ── 5A: Claims Against the Estate ────────────────────────────────────────────
// See analysis/deduction-elit.md.
// Conditions: notarized debt instrument; pre-existing personal obligation at time of death;
//   contracted bona fide for adequate consideration; legitimate creditor.
// TRAIN removes funeral/judicial from ELIT — they are NOT sub-items of 5A.
// Conjugal mortgage: full outstanding balance in Column B (not halved).
Schedule5A = {
  A: sum(exclusive claims against estate),
  B: sum(conjugal claims against estate),
  C: Schedule5A.A + Schedule5A.B
}

// ── 5B: Claims vs. Insolvent Persons ─────────────────────────────────────────
// Condition: receivable must FIRST appear in gross estate (Item 31/Schedule 2).
//   Only the uncollectible portion is deductible.
Schedule5B = {
  A: sum(exclusive uncollectible receivables from insolvent debtors),
  B: sum(conjugal uncollectible receivables from insolvent debtors),
  C: Schedule5B.A + Schedule5B.B
}

// ── 5C: Unpaid Mortgages and Accrued Taxes ───────────────────────────────────
// Mortgages: outstanding balance on mortgaged property that IS in the gross estate.
//   Full balance in column matching the property column. (Conjugal mortgage = full in Col B.)
//   Schedule 6A handles the Column A/B split internally for Form purposes.
// Taxes: taxes accrued up to date of death only. Estate tax itself is NOT deductible here.
Schedule5C = {
  A: exclusive unpaid mortgages + exclusive accrued taxes,
  B: conjugal unpaid mortgages + conjugal accrued taxes,
  C: Schedule5C.A + Schedule5C.B
}

// ── 5D: Casualty Losses ──────────────────────────────────────────────────────
// Conditions: loss arose AFTER death, DURING settlement, from qualifying event
//   (fire, storm, shipwreck, robbery, embezzlement, theft); net of insurance recovery;
//   not already deducted in income tax return.
Schedule5D = {
  A: net exclusive casualty losses (after insurance),
  B: net conjugal casualty losses (after insurance),
  C: Schedule5D.A + Schedule5D.B
}

// ── 5E: Vanishing Deduction ──────────────────────────────────────────────────
// See analysis/deduction-vanishing.md. Same formula across TRAIN and pre-TRAIN.
// NOT available under amnesty path.
// Conditions: prior property within 5 years; prior estate or donor's tax was paid;
//   property identifiable and still in gross estate.
//
// Step 1: IV = min(FMV at prior transfer, FMV at decedent's death)
// Step 2: NV = max(0, IV − unpaid mortgage on prior property at decedent's death)
// Step 3: ELIT_total = Schedule5A.C + Schedule5B.C + Schedule5C.C + Schedule5D.C
//                     (+ Schedule5G.C + Schedule5H.C for pre-TRAIN)
//         ratio = max(0, (Item34.C − ELIT_total) / Item34.C)
//         If Item34.C == 0: ratio = 0
// Step 4: years = years_since_prior_transfer (fractional years, compare to 1/2/3/4/5)
//         pct lookup table:
//           0 < years ≤ 1: 1.00  (100%)
//           1 < years ≤ 2: 0.80  ( 80%)
//           2 < years ≤ 3: 0.60  ( 60%)
//           3 < years ≤ 4: 0.40  ( 40%)
//           4 < years ≤ 5: 0.20  ( 20%)
//           years > 5:     0.00  (  0% — no deduction)
// Step 5: VD = pct × NV × ratio
//
// NRA: same formula; PH-situs prior property only; uses proportional ELIT in ratio.
// Regime == "AMNESTY": Skip — vanishing deduction not available under amnesty.

if regime_result.regime != "AMNESTY" and input.vanishingDeductionProperty != null:
  Schedule5E = computeVanishingDeduction(input.vanishingDeductionProperty, Item34, Schedule5A,
                 Schedule5B, Schedule5C, Schedule5D, deductionRules)
else:
  Schedule5E = { A: 0, B: 0, C: 0 }

// ── 5F: Transfers for Public Use ─────────────────────────────────────────────
// See analysis/deduction-public-transfers.md and correction-nra-public-transfers.md.
// Citizens/Residents: full FMV of bequest to PH national govt or LGU for exclusively public use.
//   No cap. Regime-invariant (TRAIN did NOT amend this provision).
//   NOT available under amnesty path.
// NRA: PROPORTIONAL — proportional_factor × FMV of bequest to PH government.
//   (Sec. 86(B)(2) explicitly applies proportional formula to both ELIT (par.1) and
//    public transfers (par.3); this is not full-value for NRAs.)

if regime_result.regime == "AMNESTY":
  Schedule5F = { A: 0, B: 0, C: 0 }
elif decedent.residencyStatus == "nonResidentAlien":
  Schedule5F = { A: 0, B: 0,
    C: proportional_factor × input.totalWorldwidePublicTransfers }
  // Note: NRA property is PH-situs by definition, but deduction is proportional
else:
  Schedule5F = {
    A: sum(exclusive bequests to PH government for public use),
    B: sum(conjugal bequests to PH government for public use),
    C: Schedule5F.A + Schedule5F.B
  }

// ── 5G: Funeral Expenses (PRE-TRAIN ONLY) ────────────────────────────────────
// See analysis/deductions-pre-train-diffs.md and correction-amnesty-deductions.md.
// Active when: deductionRules == "PRE_TRAIN"
//   (includes: regime=="PRE_TRAIN" AND regime=="AMNESTY" with dateOfDeath < 2018-01-01)
// TRAIN path: Schedule5G = { A:0, B:0, C:0 }; not collected; display "N/A (TRAIN)"
//
// Formula: min(input.funeralExpenses.actualAmount, Item34.C × 0.05)
// Ownership: user tags as exclusive or conjugal (default: conjugal for married decedents)

if deductionRules == "PRE_TRAIN":
  funeralLimit = Item34.C × 0.05
  funeralDeduction = min(input.funeralExpenses.actualAmount, funeralLimit)
  Schedule5G = {
    A: funeralDeduction if input.funeralExpenses.ownership == "exclusive" else 0,
    B: funeralDeduction if input.funeralExpenses.ownership == "conjugal"  else 0,
    C: funeralDeduction
  }
else:
  Schedule5G = { A: 0, B: 0, C: 0 }

// ── 5H: Judicial and Administrative Expenses (PRE-TRAIN ONLY) ────────────────
// Active when: deductionRules == "PRE_TRAIN"
// TRAIN path: Schedule5H = { A:0, B:0, C:0 }; not collected; display "N/A (TRAIN)"
// No cap; actual expenses related to estate settlement.

if deductionRules == "PRE_TRAIN":
  judicialTotal = sum(e.amount for e in input.judicialAdminExpenses
                      where e.relatedToEstateSettlement == true)
  // Each expense item tagged as exclusive or conjugal by user
  Schedule5H = {
    A: sum of exclusive judicial/admin items,
    B: sum of conjugal judicial/admin items,
    C: judicialTotal
  }
else:
  Schedule5H = { A: 0, B: 0, C: 0 }

// ── NRA Special Case: All ELIT items are proportional ────────────────────────
// For NRAs, replace the above Schedule5A–5H column values with proportional amounts.
// proportional_factor = Item34.C / decedent.totalWorldwideGrossEstate
// See analysis/nonresident-deductions.md for full NRA deduction computation.
// Each worldwide ELIT amount × proportional_factor = PH deduction amount.

// ── Item 35: Total Ordinary Deductions ───────────────────────────────────────
Item35 = {
  A: Schedule5A.A + Schedule5B.A + Schedule5C.A + Schedule5D.A
     + Schedule5E.A + Schedule5F.A + Schedule5G.A + Schedule5H.A,
  B: Schedule5A.B + Schedule5B.B + Schedule5C.B + Schedule5D.B
     + Schedule5E.B + Schedule5F.B + Schedule5G.B + Schedule5H.B,
  C: Item35.A + Item35.B
}
```

---

## Phase 5: Estate After Ordinary Deductions (Item 36)

```pseudocode
// Per-column floor at 0 (each column independently floored)
Item36 = {
  A: max(0, Item34.A - Item35.A),
  B: max(0, Item34.B - Item35.B),
  C: Item36.A + Item36.B
}
// Note: Item36.C is NOT necessarily Item34.C - Item35.C due to per-column flooring.
// Edge case: If Col A deductions exceed Col A assets, Col A = 0 but Col B unaffected.
```

---

## Phase 6: Special Deductions (Item 37 / Schedule 6)

Special deductions are a **single aggregate value** with NO Column A/B split. They reduce the combined Item36.C.

```pseudocode
// ── 6A: Standard Deduction ───────────────────────────────────────────────────
// See analysis/deduction-standard.md.
// No documentation required. Automatic.
// NRA: ₱500,000 regardless of regime.

if decedent.residencyStatus == "nonResidentAlien":
  Item37A = 500_000
elif deductionRules == "TRAIN":
  Item37A = 5_000_000     // Citizens and resident aliens, TRAIN era
else:  // deductionRules == "PRE_TRAIN"
  Item37A = 1_000_000     // Citizens and resident aliens, pre-TRAIN

// ── 6B: Family Home ──────────────────────────────────────────────────────────
// See analysis/deduction-family-home.md.
// NRA: not available (Item37B = 0 for NRAs)
// Single/widowed: always exclusive → applicable_fmv = familyHome.fmv; cap applies
// Married (ACP/CPG): decedent's share is 50% of FMV; cap applies to that half

if decedent.residencyStatus == "nonResidentAlien" or not input.hasQualifyingFamilyHome:
  Item37B = 0
else:
  familyHomeCap = (10_000_000 if deductionRules == "TRAIN" else 1_000_000)

  if input.familyHome.ownership == "exclusive":
    applicable_fmv = input.familyHome.fmv
  else:  // conjugal/communal
    applicable_fmv = input.familyHome.fmv × 0.50   // decedent's 50% share only

  Item37B = min(applicable_fmv, familyHomeCap)

// Conditions (checked before computing Item37B):
// - Must be decedent's actual residence at time of death (barangay certification required)
// - At most one property
// - Citizens and resident aliens only

// ── 6C: Medical Expenses ─────────────────────────────────────────────────────
// See analysis/deduction-medical.md.
// NRA: not available (Item37C = 0 for NRAs)
// TRAIN and pre-TRAIN: same ₱500,000 cap (not changed by TRAIN)
// Amnesty path: available (deductions at time of death)

if decedent.residencyStatus == "nonResidentAlien":
  Item37C = 0
else:
  qualifying = sum(e.amount for e in input.medicalExpenses
                   where e.incurredWithin1YearBeforeDeath == true
                   and   e.hasOfficialReceipt == true)
  Item37C = min(qualifying, 500_000)

// ── 6D: RA 4917 Benefits ──────────────────────────────────────────────────────
// See analysis/deduction-ra4917.md.
// NRA: not available (Item37D = 0 for NRAs)
// No monetary cap. Conditions: private employer (not GSIS/government); BIR-approved Tax
// Qualified Plan; payment triggered by death.
// Pass-through: same amount appears in gross estate (Schedule 2, Col A) AND here as deduction.
// Net effect on taxable estate = zero.

if decedent.residencyStatus == "nonResidentAlien":
  Item37D = 0
else:
  Item37D = input.ra4917BenefitsAmount  // 0 if no such benefit

// ── Item 37: Total Special Deductions ────────────────────────────────────────
Item37 = Item37A + Item37B + Item37C + Item37D
```

---

## Phase 7: Net Estate (Item 38)

```pseudocode
// Special deductions reduce the combined total (Column C of Item 36)
// No per-column subtraction here — Item37 is a single aggregate
Item38 = max(0, Item36.C - Item37)
```

---

## Phase 8: Surviving Spouse Share (Item 39)

See `analysis/surviving-spouse-share.md` for full details. Regime-invariant (Sec. 86(C) unchanged by TRAIN).

```pseudocode
// Community obligations: Column B of ELIT items 5A–5D only.
// Pre-TRAIN additionally includes Column B of 5G (funeral) and 5H (judicial/admin).
// Vanishing deduction (5E) and public transfers (5F) do NOT reduce the community pool.
// Uses GROSS Column B assets (Item34.B), not the post-deduction Item36.B.

if decedent.maritalStatus in ("single", "widowed") OR input.propertyRegime == "SEPARATION":
  Item39 = 0

else:  // Married with ACP or CPG
  total_community_assets = Item34.B   // Full gross Column B

  community_obligations = Schedule5A.B + Schedule5B.B + Schedule5C.B + Schedule5D.B
  if deductionRules == "PRE_TRAIN":
    community_obligations += Schedule5G.B + Schedule5H.B  // Funeral + judicial for pre-TRAIN

  // Vanishing (5E.B) and public transfers (5F.B) excluded from obligations formula

  net_community = max(0, total_community_assets - community_obligations)
  Item39 = net_community × 0.50

// Note: Item39 can exceed Item38. The floor is at Item40, not Item39.
```

---

## Phase 9: Net Taxable Estate (Item 40)

```pseudocode
Item40 = max(0, Item38 - Item39)
// Item40 is the base for tax rate application in TRAIN and pre-TRAIN regimes.
// For amnesty, Item40 feeds into Track A/B selection before rate application.
```

---

## Phase 10: Amnesty Track Selection (AMNESTY regime only)

Skip this phase for TRAIN and PRE_TRAIN regimes.

```pseudocode
// Only when regime_result.regime == "AMNESTY"
// See analysis/amnesty-computation.md for full details.

if regime_result.track == "TRACK_A":
  // No prior return filed. Full net taxable estate is the amnesty base.
  amnestyTaxBase = Item40

elif regime_result.track == "TRACK_B":
  // Prior return was filed. Only the undeclared portion is taxed under amnesty.
  netUndeclaredEstate = Item40 - input.estate.previouslyDeclaredNetEstate
  amnestyTaxBase = max(0, netUndeclaredEstate)
  // If currently computed NTE ≤ previously declared: amnestyTaxBase = 0 → minimum ₱5,000 applies
```

---

## Phase 11: Tax Rate Application (Item 42)

```pseudocode
// ── TRAIN Regime ──────────────────────────────────────────────────────────────
// See analysis/tax-rate-train.md.
// Flat rate. No brackets. No exemption threshold.

if regime_result.regime == "TRAIN":
  Item42 = Item40 × 0.06
  taxRateDescription = "Flat 6% (TRAIN Law, RA 10963)"

// ── PRE_TRAIN Regime ──────────────────────────────────────────────────────────
// See analysis/tax-rate-pre-train.md.
// Graduated schedule with ₱200,000 zero-tax floor.
// Four hardcoded bracket base amounts: ₱15,000; ₱135,000; ₱465,000; ₱1,215,000.

elif regime_result.regime == "PRE_TRAIN":
  function computeGraduatedTax(nte):
    if nte <= 200_000:                return 0
    if nte <= 500_000:                return (nte - 200_000) × 0.05
    if nte <= 2_000_000:              return 15_000 + (nte - 500_000) × 0.08
    if nte <= 5_000_000:              return 135_000 + (nte - 2_000_000) × 0.11
    if nte <= 10_000_000:             return 465_000 + (nte - 5_000_000) × 0.15
    else:                             return 1_215_000 + (nte - 10_000_000) × 0.20

  Item42 = computeGraduatedTax(Item40)
  taxRateDescription = describeBracket(Item40)  // e.g., "8% bracket (₱500K–₱2M)"

// ── AMNESTY Regime ────────────────────────────────────────────────────────────
// See analysis/amnesty-computation.md.
// Flat 6% on amnesty tax base; minimum ₱5,000 always applies.
// NO foreign tax credit available.

elif regime_result.regime == "AMNESTY":
  computedAmnestyTax = amnestyTaxBase × 0.06
  Item42 = max(5_000, computedAmnestyTax)
  minimumApplied = (computedAmnestyTax < 5_000)
  taxRateDescription = "6% on amnesty tax base (RA 11213, as amended by RA 11956)"
  // Display: if minimumApplied, explain ₱5,000 minimum payment rule
```

---

## Phase 12: Foreign Tax Credit (Item 43)

See `analysis/tax-credits.md`.

```pseudocode
// Available: TRAIN and PRE_TRAIN regimes, citizens and resident aliens ONLY
// NOT available: NRAs (any regime), AMNESTY regime (any decedent type)

if regime_result.regime == "AMNESTY" OR decedent.residencyStatus == "nonResidentAlien":
  Item43 = 0

elif input.foreignTaxCredits is empty:
  Item43 = 0

else:
  // Compute per-country credit limits, then apply overall cap
  total_credited = 0
  for each country in input.foreignTaxCredits:
    per_country_limit = Item42 × (country.foreignEstateValue / Item40)
    // If Item40 == 0, per_country_limit = 0
    credit_for_country = min(country.foreignTaxPaid, per_country_limit)
    total_credited += credit_for_country

  // Overall limit: total credit cannot exceed PH estate tax due
  Item43 = min(total_credited, Item42)

// Notes:
// - Currency conversion is the user's responsibility; engine accepts PHP-equivalent amounts
// - If foreign estate value > Item40, validation error (see Phase 0)
// - Per-country limit applies individually; overall limit caps the sum
```

---

## Phase 13: Net Estate Tax Due (Item 44 / Item 20)

```pseudocode
Item44 = max(0, Item42 - Item43)
// This is the engine's primary output — the amount due to the BIR.
// For AMNESTY regime: Item43 = 0 always, so Item44 = Item42 = max(5000, computedTax)

// "Item 20" is the BIR Form 1801 line label for this same value.
// Form labeling: Item44 is labeled as both "Item 44" in Part IV and "Item 20" in Part V summary.
```

---

## Complete Order of Operations

The following strict sequence must be respected. Dependencies flow downward.

```
1.  Validate all inputs (Phase 0)
2.  Detect regime (Phase 1): sets regime, deductionRules, track, displayDualPath
3.  Apply Sec. 87 exemptions (Phase 2): excludes assets before GE computation
4.  Compute Item 29 (real property, excluding family home)
5.  Compute Item 30 (family home: full FMV in appropriate column)
6.  Compute Item 31 (personal property: tangible + intangible)
7.  Compute Item 32 (taxable transfers, Schedule 3)
8.  Compute Item 33 (business interests: floored at 0)
9.  Compute Item 34 (total gross estate: sum of Items 29–33)  ← FINALIZE BEFORE STEP 10
10. Compute funeral expense limit = Item34.C × 0.05 (pre-TRAIN only)
11. Compute Schedule 5G — funeral deduction (pre-TRAIN only)
12. Compute Schedule 5H — judicial/admin deduction (pre-TRAIN only)
13. Compute NRA proportional factor = Item34.C / totalWorldwideGrossEstate (NRA only)
14. Compute Schedule 5A (claims against estate)
15. Compute Schedule 5B (claims vs. insolvent)
16. Compute Schedule 5C (unpaid mortgages + taxes)
17. Compute Schedule 5D (casualty losses)
18. Compute ELIT total (5A.C + 5B.C + 5C.C + 5D.C [+ 5G.C + 5H.C for pre-TRAIN])
19. Compute Schedule 5E (vanishing deduction — uses ELIT total for ratio)
20. Compute Schedule 5F (transfers for public use; proportional for NRA)
21. Compute Item 35 (sum of all Schedule 5 items)
22. Compute Item 36 (per-column: max(0, Item34 − Item35))
23. Compute Item 37A (standard deduction: branches on deductionRules + residency)
24. Compute Item 37B (family home deduction: branches on deductionRules; excludes NRA)
25. Compute Item 37C (medical expenses: cap ₱500K; excludes NRA)
26. Compute Item 37D (RA 4917 benefits; excludes NRA)
27. Compute Item 37 (sum of 37A–37D)
28. Compute Item 38 = max(0, Item36.C − Item37)
29. Compute Item 39 (surviving spouse share: branches on marital status + property regime)
    - Uses Item34.B (gross community assets), NOT Item36.B (post-deduction)
    - Community obligations from Schedule 5A–5D columns B only
    - Pre-TRAIN: also subtract Schedule 5G.B + 5H.B from community obligations
30. Compute Item 40 = max(0, Item38 − Item39)
31. [AMNESTY ONLY] Compute amnestyTaxBase from track (Track A = Item40; Track B = max(0, Item40 − previouslyDeclared))
32. Apply tax rate → Item 42
    - TRAIN: Item42 = Item40 × 0.06
    - PRE_TRAIN: Item42 = computeGraduatedTax(Item40)
    - AMNESTY: Item42 = max(5000, amnestyTaxBase × 0.06)
33. Compute foreign tax credit → Item 43 (0 for NRA and AMNESTY)
34. Compute Item 44 = max(0, Item42 − Item43)
```

**Key dependencies that must not be reordered**:
- Step 9 (Item34) before Step 10 (funeral limit)
- Step 18 (ELIT total) before Step 19 (vanishing deduction ratio)
- Step 22 (Item36) before Step 27 (Item37 uses Item36.C as check)
- Step 28 (Item38) before Step 29 (spouse share uses Item34.B, not Item38, but Item38 feeds Item40)
- Step 30 (Item40) before Step 31–34

---

## Regime-Specific Pipeline Summaries

### TRAIN Pipeline

```
Phase 0: Validate → Phase 1: regime=TRAIN, deductionRules=TRAIN
→ Phase 2: Sec.87 exclusions
→ Phase 3: Items 29–34 (worldwide scope for citizen/resident; PH-situs for NRA)
→ Phase 4: 5A+5B+5C+5D (no funeral/judicial) + 5E (vanishing) + 5F (public transfers) = Item35
→ Phase 5: Item36 = max(0, Item34 − Item35) per column
→ Phase 6: Item37A=₱5M (or ₱500K NRA) + Item37B=min(FMV×0.5,₱10M) + Item37C=min(med,₱500K) + Item37D=RA4917
→ Phase 7: Item38 = max(0, Item36.C − Item37)
→ Phase 8: Item39 = (Item34.B − [5A+5B+5C+5D].B) × 0.50
→ Phase 9: Item40 = max(0, Item38 − Item39)
→ Phase 11: Item42 = Item40 × 0.06
→ Phase 12: Item43 = foreign tax credit (0 for NRA)
→ Phase 13: Item44 = max(0, Item42 − Item43)
Output: BIR Form 1801 (January 2018 revision)
```

### PRE_TRAIN Pipeline

```
Phase 0: Validate → Phase 1: regime=PRE_TRAIN, deductionRules=PRE_TRAIN
→ Phase 2: Sec.87 exclusions
→ Phase 3: Items 29–34 (same as TRAIN)
→ Phase 4: 5A+5B+5C+5D + 5E (vanishing) + 5F (public transfers)
           + 5G=min(funeral, Item34.C×0.05)  ← COMPUTED AFTER Item34
           + 5H=actual judicial/admin
           = Item35
→ Phase 5: Item36 = max(0, Item34 − Item35) per column
→ Phase 6: Item37A=₱1M (or ₱500K NRA) + Item37B=min(FMV×0.5,₱1M) + Item37C=min(med,₱500K) + Item37D=RA4917
→ Phase 7: Item38 = max(0, Item36.C − Item37)
→ Phase 8: Item39 = (Item34.B − [5A+5B+5C+5D+5G+5H].B) × 0.50
→ Phase 9: Item40 = max(0, Item38 − Item39)
→ Phase 11: Item42 = computeGraduatedTax(Item40) [0% / 5% / 8% / 11% / 15% / 20%]
→ Phase 12: Item43 = foreign tax credit (0 for NRA)
→ Phase 13: Item44 = max(0, Item42 − Item43)
Output: BIR Form 1801 (June 2006 revision) — labeled "PRE-TRAIN ESTATE TAX COMPUTATION"
```

### AMNESTY Pipeline

```
Phase 0: Validate → Phase 1: regime=AMNESTY, deductionRules="TRAIN"|"PRE_TRAIN", track=A|B
→ Phase 2: Sec.87 exclusions
→ Phase 3: Items 29–34 (same structure; scope by residency)
→ Phase 4: Deductions per deductionRules:
           if deductionRules=TRAIN: same as TRAIN pipeline (no 5G/5H, 5E=0 always)
           if deductionRules=PRE_TRAIN: adds 5G+5H, but 5E=0 (vanishing not available under amnesty)
           5F: NOT available under amnesty (government transfers not deductible)
           = Item35
→ Phase 5: Item36 = max(0, Item34 − Item35) per column
→ Phase 6: Special deductions per deductionRules:
           TRAIN: Item37A=₱5M; Item37B cap=₱10M
           PRE_TRAIN: Item37A=₱1M; Item37B cap=₱1M
           Item37C=min(med,₱500K); Item37D=RA4917 (both per deductionRules)
→ Phase 7: Item38 = max(0, Item36.C − Item37)
→ Phase 8: Item39 = (Item34.B − community obligations) × 0.50
           community obligations per deductionRules (includes 5G/5H.B if PRE_TRAIN)
→ Phase 9: Item40 = max(0, Item38 − Item39)
→ Phase 10: amnestyTaxBase = Item40 (Track A) OR max(0, Item40 − previouslyDeclared) (Track B)
→ Phase 11: Item42 = max(5_000, amnestyTaxBase × 0.06)
→ Phase 12: Item43 = 0 (always; no foreign tax credit under amnesty)
→ Phase 13: Item44 = Item42 (= max(5_000, amnestyTaxBase × 0.06))
Output: ETAR + APF — labeled "ESTATE TAX AMNESTY COMPUTATION (RA 11213 as amended)"
        + mandatory notice: "Filing window closed June 14, 2025"
```

---

## Dual-Path Comparison (When displayDualPath = true)

When a pre-2018 estate elects amnesty and passes eligibility, the engine runs BOTH the amnesty and pre-TRAIN pipelines and displays a comparison.

```pseudocode
if regime_result.displayDualPath:
  // Run pre-TRAIN pipeline on same inputs
  preTrainResult = runPreTrainPipeline(input, "PRE_TRAIN", "PRE_TRAIN")
  // Run amnesty pipeline on same inputs
  amnestyResult  = runAmnestyPipeline(input, regime_result)

  // Crossover: amnesty produces lower base tax when NTE > ₱1,250,000
  // (Derived algebraically from 5% bracket: see analysis/amnesty-vs-regular.md)
  CROSSOVER_NTE = 1_250_000
  amnestyBetter = (preTrainResult.Item40 > CROSSOVER_NTE)

  dualPathComparison = {
    preTrainNTE:         preTrainResult.Item40,
    preTrainTaxDue:      preTrainResult.Item44,
    amnestyNTE:          amnestyResult.Item40,
    amnestyTaxBase:      amnestyResult.amnestyTaxBase,
    amnestyTaxDue:       amnestyResult.Item44,
    lowerTaxPath:        ("AMNESTY" if amnestyBetter else "PRE_TRAIN"),
    taxSavings:          abs(amnestyResult.Item44 − preTrainResult.Item44),
    note: "The amnesty filing window closed June 14, 2025. This comparison is for " +
          "historical reference only. Additionally, the amnesty waived accrued " +
          "surcharges and penalties, which this engine does not compute."
  }
```

---

## Cross-Regime Comparison Table

| Computation Step | TRAIN | PRE_TRAIN | AMNESTY (pre-2018 death) |
|-----------------|-------|-----------|--------------------------|
| Gross estate scope (citizen) | Worldwide | Worldwide | Worldwide |
| Gross estate scope (NRA) | PH-situs | PH-situs | PH-situs |
| Sec. 87 exemptions | Yes | Yes | Yes |
| Funeral expenses (5G) | NO | Yes: min(actual, 5%×GE) | Yes (if deductionRules=PRE_TRAIN) |
| Judicial/admin (5H) | NO | Yes: actual | Yes (if deductionRules=PRE_TRAIN) |
| Vanishing deduction (5E) | Yes | Yes | **NO** |
| Public transfers (5F) | Yes (full / proportional for NRA) | Yes | **NO** |
| Standard deduction (citizen) | ₱5,000,000 | ₱1,000,000 | ₱1M (pre-2018) / ₱5M (2018–2022) |
| Standard deduction (NRA) | ₱500,000 | ₱500,000 | ₱500,000 |
| Family home cap | ₱10,000,000 | ₱1,000,000 | ₱1M (pre-2018) / ₱10M (2018–2022) |
| Medical expenses (6C) | ₱500,000 cap | ₱500,000 cap | ₱500,000 cap |
| RA 4917 (6D) | Yes | Yes | Yes |
| Surviving spouse share | Yes (Sec. 86C) | Yes (Sec. 86C) | Yes (Sec. 86C) |
| Spouse obligations include funeral/judicial | NO | YES | YES (if pre-2018) |
| Tax rate | Flat 6% | Graduated 0–20% | Flat 6% on base; min ₱5,000 |
| Zero-tax threshold | None | NTE ≤ ₱200,000 | None (min ₱5,000 always) |
| Foreign tax credit | Yes (citizen/resident) | Yes (citizen/resident) | **NO** |
| Track A/B selection | N/A | N/A | Yes (Track A or B) |
| Output form | Form 1801 (Jan 2018) | Form 1801 (Jun 2006) | ETAR + APF |

---

## Input Contract

All inputs required by the engine, grouped by when they are collected:

### Always Required

| Field | Type | Notes |
|-------|------|-------|
| `decedent.dateOfDeath` | Date (YYYY-MM-DD) | Primary regime-detection input |
| `decedent.residencyStatus` | `"citizen"` \| `"residentAlien"` \| `"nonResidentAlien"` | Scope of gross estate |
| `decedent.maritalStatus` | `"single"` \| `"married"` \| `"widowed"` | Drives spouse share |
| `input.propertyRegime` | `"ACP"` \| `"CPG"` \| `"SEPARATION"` | Required if married |
| `userElectsAmnesty` | boolean | User explicitly requests amnesty path |
| `input.assets[]` | Array of Asset | See Asset type below |

### Asset Fields (Each Asset)

| Field | Type | Notes |
|-------|------|-------|
| `asset.id` | string | Unique identifier |
| `asset.type` | `"realProperty"` \| `"familyHome"` \| `"personalProperty"` \| `"taxableTransfer"` \| `"businessInterest"` | Maps to Items 29–33 |
| `asset.fmv` | Decimal ≥ 0 | User-provided fair market value (pre-valued) |
| `asset.ownership` | `"exclusive"` \| `"conjugal"` | Column A vs. Column B |
| `asset.sec87Exclusion` | `null` \| `"a"` \| `"b"` \| `"c"` \| `"d"` | Sec. 87 exempt category |
| `asset.isNRASitusPhilippines` | boolean | NRA only: whether PH-situs |
| `asset.reciprocityExemption` | boolean | NRA intangibles only: applies reciprocity |

### Required if Married

| Field | Type | Notes |
|-------|------|-------|
| `input.familyHome.fmv` | Decimal ≥ 0 | Required if any asset tagged familyHome |
| `input.familyHome.ownership` | `"exclusive"` \| `"conjugal"` | |

### Required if Pre-TRAIN (deductionRules = "PRE_TRAIN")

| Field | Type | Notes |
|-------|------|-------|
| `input.funeralExpenses.actualAmount` | Decimal ≥ 0 | Actual total funeral expenses incurred |
| `input.funeralExpenses.ownership` | `"exclusive"` \| `"conjugal"` | Column assignment |
| `input.judicialAdminExpenses[]` | Array of {amount, ownership, description} | Per-item |

### Required if Amnesty Elected

| Field | Type | Notes |
|-------|------|-------|
| `estate.taxFullyPaidBeforeMay2022` | boolean | True → amnesty unavailable |
| `estate.priorReturnFiled` | boolean | True → Track B |
| `estate.previouslyDeclaredNetEstate` | Decimal ≥ 0 | Required if priorReturnFiled=true |
| `decedent.subjectToPCGGJurisdiction` | boolean | Exclusion check |
| `estate.hasRA3019Violations` | boolean | Exclusion check |
| `estate.hasRA9160Violations` | boolean | Exclusion check |
| `estate.hasPendingCourtCasePreAmnestyAct` | boolean | Court case filed before Feb 14, 2019 |
| `estate.hasUnexplainedWealthCases` | boolean | Exclusion check |
| `estate.hasPendingRPCFelonies` | boolean | Exclusion check |

### Required if NRA

| Field | Type | Notes |
|-------|------|-------|
| `decedent.totalWorldwideGrossEstate` | Decimal ≥ 0 | Must be ≥ PH gross estate |
| `decedent.totalWorldwideELIT.claimsAgainstEstate` | Decimal ≥ 0 | Worldwide 5A for proportional formula |
| `decedent.totalWorldwideELIT.claimsVsInsolvent` | Decimal ≥ 0 | Worldwide 5B |
| `decedent.totalWorldwideELIT.unpaidMortgages` | Decimal ≥ 0 | Worldwide 5C |
| `decedent.totalWorldwideELIT.casualtyLosses` | Decimal ≥ 0 | Worldwide 5D |
| `decedent.totalWorldwideELIT.funeralExpenses` | Decimal ≥ 0 | PRE-TRAIN + NRA only |
| `decedent.totalWorldwideELIT.judicialAdminExpenses` | Decimal ≥ 0 | PRE-TRAIN + NRA only |
| `decedent.totalWorldwidePublicTransfers` | Decimal ≥ 0 | For Sec. 86(B)(2) proportional formula |
| `decedent.reciprocityExemptionApplies` | boolean | Excludes NRA intangibles |

### Optional (Deduction-Specific)

| Field | Type | Notes |
|-------|------|-------|
| `input.medicalExpenses[]` | Array of {amount, date, hasReceipt} | Qualifying if within 1 year, with OR |
| `input.ra4917BenefitsAmount` | Decimal ≥ 0 | From employer TQP; also in gross estate |
| `input.vanishingDeductionProperty` | Object (see deduction-vanishing.md) | If applicable |
| `input.claimsAgainstEstate[]` | Array of {amount, ownership, description} | 5A |
| `input.claimsVsInsolventPersons[]` | Array of {amount, ownership, grossEstateItem} | 5B |
| `input.unpaidMortgages[]` | Array of {amount, ownership, mortgagedAsset} | 5C |
| `input.casualtyLosses[]` | Array of {amount, ownership, insuranceRecovery} | 5D |
| `input.bequestsToGovernment[]` | Array of {amount, ownership, recipient} | 5F |
| `input.foreignTaxCredits[]` | Array of {country, foreignTaxPaid, foreignEstateValue} | 5-7D/Item43 |

---

## Output Contract

The engine returns a `ComputationResult` object with all intermediate values:

```pseudocode
ComputationResult = {
  valid:          boolean,
  errors:         ValidationError[],         // Non-empty if valid=false

  // ── Regime Information ─────────────────────────────────────────────────────
  regime:         "TRAIN" | "PRE_TRAIN" | "AMNESTY",
  deductionRules: "TRAIN" | "PRE_TRAIN",
  track:          "TRACK_A" | "TRACK_B" | null,
  warnings:       string[],

  // ── Sec. 87 Exclusions ────────────────────────────────────────────────────
  sec87Exclusions: [{ assetId, category, basisExplainer }],

  // ── Gross Estate (Items 29–34) ────────────────────────────────────────────
  grossEstate: {
    realProperty:       { A, B, C },   // Item 29
    familyHome:         { A, B, C },   // Item 30
    personalProperty:   { A, B, C },   // Item 31
    taxableTransfers:   { A, B, C },   // Item 32
    businessInterests:  { A, B, C },   // Item 33
    total:              { A, B, C },   // Item 34
  },

  // ── Ordinary Deductions (Item 35 / Schedule 5) ───────────────────────────
  ordinaryDeductions: {
    claimsAgainstEstate:     { A, B, C },   // 5A
    claimsVsInsolvent:       { A, B, C },   // 5B
    unpaidMortgages:         { A, B, C },   // 5C
    casualtyLosses:          { A, B, C },   // 5D
    vanishingDeduction:      { A, B, C },   // 5E (0 for amnesty)
    transfersForPublicUse:   { A, B, C },   // 5F (0 for amnesty)
    funeralExpenses:         { A, B, C },   // 5G (0 for TRAIN deductionRules)
    judicialAdminExpenses:   { A, B, C },   // 5H (0 for TRAIN deductionRules)
    total:                   { A, B, C },   // Item 35
  },

  // ── Post-Ordinary Deduction Estate (Item 36) ─────────────────────────────
  afterOrdinaryDeductions: { A, B, C },     // Item 36

  // ── Special Deductions (Item 37 / Schedule 6) ────────────────────────────
  specialDeductions: {
    standardDeduction:    Decimal,   // Item 37A
    familyHome:           Decimal,   // Item 37B
    medicalExpenses:      Decimal,   // Item 37C
    ra4917Benefits:       Decimal,   // Item 37D
    total:                Decimal,   // Item 37
  },

  // ── Net Estate Through Tax (Items 38–44) ─────────────────────────────────
  netEstate:              Decimal,   // Item 38
  survivingSpouseShare:   Decimal,   // Item 39
  netTaxableEstate:       Decimal,   // Item 40

  // ── Tax Computation ───────────────────────────────────────────────────────
  taxComputation: {
    // TRAIN:
    taxRate:             0.06,
    estateTaxDue:        Decimal,    // Item 42

    // PRE_TRAIN additional fields:
    bracketDescription:  string,     // e.g., "8% bracket (₱500K–₱2M)"
    fixedAmount:         Decimal,    // e.g., 15_000
    excessAmount:        Decimal,    // nte − bracket floor
    marginalRate:        Decimal,    // e.g., 0.08
    effectiveRate:       Decimal,    // Item42 / Item40

    // AMNESTY additional fields:
    amnestyTaxBase:      Decimal,    // Before minimum floor
    computedAmnestyTax:  Decimal,    // Before max(5000, ...)
    minimumApplied:      boolean,    // true if 5000 minimum applies
  },

  foreignTaxCredit:       Decimal,   // Item 43
  netEstateTaxDue:        Decimal,   // Item 44 = Item 20

  // ── Dual-Path Comparison (when applicable) ───────────────────────────────
  dualPathComparison: DualPathResult | null,

  // ── Output Form Label ─────────────────────────────────────────────────────
  outputFormLabel:        string,    // e.g., "BIR Form 1801 (January 2018)"
}
```

---

## Form 1801 Field Mapping

| Engine Field | Form 1801 Item | Schedule | Notes |
|-------------|----------------|----------|-------|
| `grossEstate.realProperty.{A,B,C}` | Item 29 | Schedule 1 | |
| `grossEstate.familyHome.{A,B,C}` | Item 30 | Schedule 1A | |
| `grossEstate.personalProperty.{A,B,C}` | Item 31 | Schedules 2 + 2A | |
| `grossEstate.taxableTransfers.{A,B,C}` | Item 32 | Schedule 3 | |
| `grossEstate.businessInterests.{A,B,C}` | Item 33 | Schedule 4 | |
| `grossEstate.total.{A,B,C}` | Item 34 | — | Sum of Items 29–33 |
| `ordinaryDeductions.total.{A,B,C}` | Item 35 | Schedule 5 | |
| `afterOrdinaryDeductions.{A,B,C}` | Item 36 | — | max(0, Item34 − Item35) per col |
| `specialDeductions.standardDeduction` | Item 37A | Schedule 6 line A | |
| `specialDeductions.familyHome` | Item 37B | Schedule 6 line B | |
| `specialDeductions.medicalExpenses` | Item 37C | Schedule 6 line C | |
| `specialDeductions.ra4917Benefits` | Item 37D | Schedule 6 line D | |
| `specialDeductions.total` | Item 37 | — | Sum of 37A–37D |
| `netEstate` | Item 38 | — | max(0, Item36.C − Item37) |
| `survivingSpouseShare` | Item 39 | Schedule 6A | |
| `netTaxableEstate` | Item 40 | — | max(0, Item38 − Item39) |
| `taxComputation.estateTaxDue` | Item 42 | — | Rate × Item40 (or graduated) |
| `foreignTaxCredit` | Item 43 | — | Per-country and overall limits |
| `netEstateTaxDue` | Item 44 / Item 20 | — | max(0, Item42 − Item43) |

For amnesty: these items map to corresponding ETAR fields, not Form 1801 items.
For pre-TRAIN: same logical items but labeled with Jun 2006 form revision numbers.

---

## Edge Cases for the Pipeline

### EC-CP-01: Deductions Exceed Gross Estate (Zero Tax — No Minimum for TRAIN/PRE_TRAIN)

```
Item34.C = ₱2,000,000
Item37A  = ₱5,000,000  (standard deduction, TRAIN)
→ Item38 = max(0, ₱2,000,000 − ₱5,000,000) = 0
→ Item40 = 0
→ Item42 = 0 × 0.06 = 0
→ Item44 = 0
// No minimum tax under TRAIN or PRE_TRAIN regular rules.
// Amnesty: minimum ₱5,000 would apply even when Item40 = 0.
```

### EC-CP-02: Surviving Spouse Share Exceeds Net Estate

```
Item38 = ₱1,000,000
Item39 = ₱1,500,000  (large conjugal estate relative to deductions)
→ Item40 = max(0, ₱1,000,000 − ₱1,500,000) = 0
→ Item42 = 0
→ Item44 = 0
// Spouse share is NOT capped at Item38. Item40 is floored at 0.
```

### EC-CP-03: All Deductions in Column A, All Assets in Column B

```
// Possible in CPG if all exclusive claims were personal debts of decedent
Item34 = { A: 0, B: 5_000_000, C: 5_000_000 }
Item35 = { A: 2_000_000, B: 0, C: 2_000_000 }
Item36 = { A: max(0, 0 − 2_000_000) = 0,  // col A floored at 0
           B: max(0, 5_000_000 − 0) = 5_000_000,
           C: 0 + 5_000_000 = 5_000_000 }
// Note: Item36.C ≠ Item34.C − Item35.C = 3_000_000 due to per-column flooring.
// The ₱2M of Column A deductions that "can't be used" are simply lost — cannot shift to Col B.
```

### EC-CP-04: NRA with No PH-Situs Assets

```
Item34.C = 0  (no PH-situs assets after Sec. 87 + reciprocity exclusions)
→ proportional_factor = 0 / totalWorldwideGE = 0
→ All deductions = 0
→ Item35.C = 0; Item36.C = 0; Item37 applies → Item38 = 0 (standard deduction doesn't help)
→ Item40 = 0; Item42 = 0; Item44 = 0
// No estate tax due. Filing may still be required for registrable property.
```

### EC-CP-05: Amnesty Track B — Previously Declared Exceeds Current NTE

```
previouslyDeclaredNetEstate = ₱3,000,000
Item40 (current) = ₱2,500,000  // Due to different asset valuations
amnestyTaxBase = max(0, ₱2,500,000 − ₱3,000,000) = 0
amnestyTaxDue  = max(5_000, 0 × 0.06) = 5_000  // Minimum applies
// Engine displays: "Previously declared net estate exceeds current computed net taxable
// estate. Amnesty tax base = ₱0. Minimum payment of ₱5,000 applies."
```

### EC-CP-06: RA 4917 Pass-Through

```
// RA 4917 benefit = ₱800,000
// Both gross estate and special deduction contain ₱800,000:
Item31.A += 800_000                 // Appears in Schedule 2, Column A (personal property)
Item37D   = 800_000                 // Deducted in Schedule 6D
// Net effect on Item38: zero. But both values must appear in the computation.
```

### EC-CP-07: Vanishing Deduction with Pre-TRAIN ELIT in Ratio

```
// Pre-TRAIN estate with funeral deduction: funeral reduces the ratio
ELIT_total = 5A.C + 5B.C + 5C.C + 5D.C + 5G.C + 5H.C
ratio = (Item34.C − ELIT_total) / Item34.C
// Larger ELIT (including funeral/judicial) → smaller ratio → smaller vanishing deduction.
// This is correct: higher deductions from property → smaller benefit of vanishing deduction.
```

### EC-CP-08: Foreign Tax Credit Exactly Equal to PH Estate Tax

```
Item42 = ₱100,000
foreignTaxCredited = ₱100,000 (per-country limit ≥ ₱100,000)
Item43 = min(₱100,000, ₱100,000) = ₱100,000
Item44 = max(0, ₱100,000 − ₱100,000) = 0
// Zero net estate tax due. Filing still required.
```

---

## Test Implications

| Test ID | Scenario | Regime | Key Verification |
|---------|----------|--------|-----------------|
| CP-01 | Single citizen, basic assets, TRAIN | TRAIN | Items 29–44 all correct; Item37A=₱5M |
| CP-02 | Married ACP, family home, medical, TRAIN | TRAIN | Item37B=min(FMV×0.5,₱10M); Item39 formula |
| CP-03 | Pre-TRAIN CPG, funeral + judicial, grad rate | PRE_TRAIN | 5G capped at 5%×GE; Item39 includes 5G.B+5H.B |
| CP-04 | NRA TRAIN, proportional ELIT | TRAIN | proportional_factor; Item37A=₱500K; Item43=0 |
| CP-05 | Deductions exceed GE, TRAIN (zero tax) | TRAIN | Item44=0; no minimum |
| CP-06 | Amnesty Track A, pre-2018, pre-TRAIN deductions | AMNESTY | Item42=max(5000,NTE×0.06); 5E=0; 5F=0 |
| CP-07 | Amnesty Track B, prior declared > current NTE | AMNESTY | amnestyBase=0; Item44=5000 |
| CP-08 | NTE exactly ₱200,000 (pre-TRAIN zero floor) | PRE_TRAIN | Item42=0 |
| CP-09 | Col A deductions exceed Col A assets | TRAIN | Item36.A=0; Item36.B unaffected |
| CP-10 | RA 4917 pass-through | TRAIN | 800K in Item31.A and Item37D; net effect zero |
| CP-11 | Pre-TRAIN NRA with funeral/judicial | PRE_TRAIN | 5G+5H both proportional |
| CP-12 | Spouse share > Net Estate (Item40=0) | PRE_TRAIN | Item40=max(0,...) floor; not capped at Item38 |

---

## Relationship to Other Aspects

- **regime-detection.md**: Phase 1 of this pipeline — provides `regime`, `deductionRules`, `track`
- **gross-estate-citizens.md**, **gross-estate-nonresident.md**: Phase 3 detail for Items 29–34
- **gross-estate-inclusions.md**: Item 32 (Schedule 3) — taxable transfers rules
- **exemptions.md**: Phase 2 (Sec. 87 pre-computation exclusions)
- **deduction-elit.md**: Schedule 5A–5D rules
- **deduction-vanishing.md**: Schedule 5E (5-step formula)
- **deduction-public-transfers.md** + **correction-nra-public-transfers.md**: Schedule 5F
- **deductions-pre-train-diffs.md** + **correction-amnesty-deductions.md**: Schedules 5G, 5H; branching on deductionRules
- **deduction-standard.md**: Item 37A amounts by regime/residency
- **deduction-family-home.md**: Item 37B computation + cap by regime
- **deduction-medical.md**: Item 37C
- **deduction-ra4917.md**: Item 37D pass-through
- **surviving-spouse-share.md**: Item 39 — regime-invariant formula
- **nonresident-deductions.md**: NRA proportional formula — overrides all Schedule 5 amounts for NRAs
- **tax-rate-train.md**: Phase 11 TRAIN branch
- **tax-rate-pre-train.md**: Phase 11 PRE_TRAIN branch (graduated function)
- **amnesty-computation.md**: Phases 10–11 AMNESTY branch (track selection, min ₱5,000)
- **amnesty-vs-regular.md**: Dual-path comparison logic + crossover NTE
- **tax-credits.md**: Phase 12 (Item 43)
- **pre-train-computation-flow.md**: Full pre-TRAIN pipeline was synthesized here
- **property-regime-acp.md**, **property-regime-cpg.md**, **property-regime-separation.md**: Column A/B asset classification rules driving all Schedule 5 column assignments
- **form-1801-fields.md**: Output field mapping (engine output → form fields)
- **data-model.md** (next): Formal type definitions for all input/output objects referenced here
- **test-vectors.md** (next): Concrete test cases implementing the CP-* test IDs above

---

## Summary for Developer

The engine is a **14-step linear pipeline** with one routing decision (regime) and one conditional loop (dual-path). The shared structure across all three regimes is:

```
Phase 0: Validate → Phase 1: Detect regime → Phase 2: Sec.87 exclusions
→ Phase 3: Gross estate (Items 29–34)
→ Phase 4: Ordinary deductions (Item 35)  ← deductionRules controls 5G/5H/5E/5F availability
→ Phase 5: Item 36
→ Phase 6: Special deductions (Item 37)   ← deductionRules controls standard deduction/family home cap
→ Phase 7: Item 38
→ Phase 8: Surviving spouse share (Item 39)
→ Phase 9: Item 40
→ Phase 10: AMNESTY ONLY: track selection → amnestyTaxBase
→ Phase 11: Tax rate → Item 42            ← regime controls flat/graduated/amnesty rate
→ Phase 12: Foreign tax credit → Item 43  ← 0 for NRA and amnesty
→ Phase 13: Item 44 (output)
```

**Three pairs of parameters drive all branching**:
1. `regime` = `"TRAIN"` | `"PRE_TRAIN"` | `"AMNESTY"` → controls Phase 11 (rate function), Phase 12 (credit availability), output form label
2. `deductionRules` = `"TRAIN"` | `"PRE_TRAIN"` → controls Phase 4 (5G/5H/5E/5F) and Phase 6 (standard deduction, family home cap)
3. `decedent.residencyStatus` = `"citizen"` | `"residentAlien"` | `"nonResidentAlien"` → controls gross estate scope (worldwide vs. PH-situs), replaces all deductions with proportional formula for NRAs, suppresses family home + medical + RA4917 for NRAs, suppresses foreign tax credit for NRAs

All other logic — the vanishing deduction formula, the surviving spouse formula, the Sec. 87 exclusions, the RA 4917 pass-through, the per-column asset/deduction structure — is **identical across all three regimes and both residency types**.
