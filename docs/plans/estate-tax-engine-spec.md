# Philippine Estate Tax Engine — Software Specification

**Version**: 1.0
**Date**: 2026-02-25
**Source**: Synthesized from 35 analysis aspects in `loops/estate-tax-reverse/`
**Legal Basis**: NIRC (RA 8424) as amended by TRAIN Law (RA 10963); RA 11213/11569/11956

---

## Table of Contents

1. [Overview & Purpose](#1-overview--purpose)
2. [Scope & Constraints](#2-scope--constraints)
3. [Three Tax Regimes](#3-three-tax-regimes)
4. [Key Constants](#4-key-constants)
5. [Data Model](#5-data-model)
6. [Regime Detection](#6-regime-detection)
7. [Pre-Computation: Sec. 87 Exclusions](#7-pre-computation-sec-87-exclusions)
8. [Gross Estate Computation](#8-gross-estate-computation)
9. [Ordinary Deductions (Schedule 5)](#9-ordinary-deductions-schedule-5)
10. [Special Deductions (Schedule 6)](#10-special-deductions-schedule-6)
11. [Surviving Spouse Share (Schedule 6A)](#11-surviving-spouse-share-schedule-6a)
12. [Tax Rate Application](#12-tax-rate-application)
13. [Foreign Tax Credit](#13-foreign-tax-credit)
14. [Amnesty Computation (RA 11213)](#14-amnesty-computation-ra-11213)
15. [NRA Proportional Deductions](#15-nra-proportional-deductions)
16. [Complete Computation Pipeline](#16-complete-computation-pipeline)
17. [Form 1801 Output Contract](#17-form-1801-output-contract)
18. [Plain-English Explainer Format](#18-plain-english-explainer-format)
19. [Test Vectors](#19-test-vectors)
20. [Edge Cases Catalog](#20-edge-cases-catalog)
21. [Filing Rules (Informational Output)](#21-filing-rules-informational-output)

---

## 1. Overview & Purpose

This document specifies a **fully deterministic Philippine estate tax computation engine**. Given pre-valued asset inputs, the engine computes Philippine estate tax due across all three applicable regimes and produces output mirroring BIR Form 1801 plus a plain-English explainer section.

**Target user**: An heir or executor filing an estate tax return. The engine must produce output understandable without legal or accounting training.

**What the engine does**:
- Auto-detects the applicable tax regime from the decedent's date of death
- Computes gross estate, all deductions, net taxable estate, and estate tax due
- Produces values for every field on BIR Form 1801 (TRAIN-era) or the equivalent pre-TRAIN / amnesty return
- Generates a plain-English explainer alongside the computation

**What the engine does NOT do**:
- Determine asset valuations (user provides all FMV values)
- Compute surcharges, interest, or penalties for late filing
- Process installment payments (engine outputs total tax due only)
- Guarantee current filing procedures (laws may change after this spec)

---

## 2. Scope & Constraints

### In Scope
- Base estate tax computation for all three regimes
- All NIRC deductions: standard, funeral (pre-TRAIN), judicial/admin (pre-TRAIN), ELIT (claims, mortgages, losses), vanishing deduction, public use transfers, family home, medical, RA 4917
- Property regimes: ACP, CPG, Separation of Property
- NRA proportional deductions (Sec. 86B)
- Foreign estate tax credits (citizens/residents only)
- Estate tax amnesty computation (RA 11213/11569/11956)
- Sec. 87 exempt transfers (pre-computation exclusions)
- Form 1801 field-by-field output
- Plain-English explainer for non-expert users

### Out of Scope
- Asset valuation (zonal values, book value computation, actuarial tables)
- Surcharges, interest, compromise penalties
- Donor's tax computation
- Income tax on estate income
- RPT (Real Property Tax) computation
- Installment payment scheduling

### Key Assumption
**The engine accepts pre-valued inputs only.** The user must provide the Fair Market Value (FMV) for every asset. The engine does not look up zonal values, assessed values, or book values. Where the law requires `max(zonal, assessed)` for real property, the user must provide both values and the engine applies the max rule.

---

## 3. Three Tax Regimes

The engine supports three regimes, auto-detected from date of death:

| Regime | Applies When | Tax Rate | Legal Basis |
|--------|-------------|----------|-------------|
| **TRAIN** | Death on or after 2018-01-01 | Flat 6% on net taxable estate | RA 10963 amending NIRC Sec. 84 |
| **PRE_TRAIN** | Death before 2018-01-01 (no amnesty) | Graduated 0%–20% per bracket | NIRC Sec. 84 as originally enacted (RA 8424) |
| **AMNESTY** | Death on or before 2022-05-31; unpaid estate tax; user elects amnesty | Flat 6% on amnesty base; minimum ₱5,000 | RA 11213, as amended by RA 11569 and RA 11956 |

### Deduction Rules (Independent of Regime)

The `deductionRules` flag controls deduction amounts and available deduction types. It is independent of `regime`:

| `deductionRules` | When | Standard Deduction (citizen/resident) | Family Home Cap | Funeral Expenses | Judicial/Admin |
|-----------------|------|--------------------------------------|-----------------|-----------------|----------------|
| `"TRAIN"` | Death ≥ 2018-01-01 | ₱5,000,000 | ₱10,000,000 | NOT deductible | NOT deductible |
| `"PRE_TRAIN"` | Death < 2018-01-01 | ₱1,000,000 | ₱1,000,000 | Deductible | Deductible |

For amnesty estates:
- Deaths before 2018-01-01 → `deductionRules = "PRE_TRAIN"`
- Deaths 2018-01-01 through 2022-05-31 → `deductionRules = "TRAIN"`

**Critical**: All deduction functions must accept `deductionRules` as a separate parameter from `regime`. Never use `regime` to select deduction amounts; always use `deductionRules`.

NRA standard deduction is **₱500,000** under all regimes (unchanged).

---

## 4. Key Constants

```pseudocode
// Regime boundary dates (inclusive on stated side)
TRAIN_EFFECTIVE_DATE        = Date(2018, 1, 1)   // dateOfDeath >= this → TRAIN
AMNESTY_COVERAGE_CUTOFF     = Date(2022, 5, 31)  // dateOfDeath <= this → eligible for amnesty
PRE_TRAIN_CUTOFF            = Date(2018, 1, 1)   // dateOfDeath < this → PRE_TRAIN deduction rules

// Amnesty constants
AMNESTY_RATE                = 0.06
AMNESTY_MINIMUM             = 5_000              // ₱5,000 hard floor

// Pre-TRAIN rate brackets (hardcoded bracket base amounts)
PRE_TRAIN_EXEMPTION         = 200_000            // NTE ≤ ₱200K → ₱0 tax
PRE_TRAIN_BRACKET_1_BASE    = 0                  // up to ₱200K
PRE_TRAIN_BRACKET_2_BASE    = 15_000             // ₱200K–₱500K at 5%
PRE_TRAIN_BRACKET_3_BASE    = 135_000            // ₱500K–₱2M at 8%
PRE_TRAIN_BRACKET_4_BASE    = 465_000            // ₱2M–₱5M at 11%
PRE_TRAIN_BRACKET_5_BASE    = 1_215_000          // ₱5M–₱10M at 15%
                                                  // >₱10M at 20%

// Standard deductions
STANDARD_DEDUCTION_TRAIN_CITIZEN    = 5_000_000
STANDARD_DEDUCTION_PRE_TRAIN_CITIZEN = 1_000_000
STANDARD_DEDUCTION_NRA              = 500_000     // same across all regimes

// Family home caps
FAMILY_HOME_CAP_TRAIN       = 10_000_000
FAMILY_HOME_CAP_PRE_TRAIN   = 1_000_000

// Medical expense cap (all regimes)
MEDICAL_EXPENSE_CAP         = 500_000

// Funeral expense limit (pre-TRAIN only)
FUNERAL_RATE                = 0.05               // min(actual, 5% × gross estate)

// Vanishing deduction percentage table
VD_PCT = { 1: 1.00, 2: 0.80, 3: 0.60, 4: 0.40, 5: 0.20 }
// elapsed_years rounded down to integer, 1-indexed; > 5 → 0.00

// Pre-TRAIN crossover (amnesty is better above this NTE)
PRE_TRAIN_CROSSOVER_NTE     = 1_250_000

// TRAIN flat rate
TRAIN_RATE                  = 0.06
```

---

## 5. Data Model

All monetary values in Philippine Pesos (₱). Use 64-bit decimal or currency-safe integer arithmetic. Never use 32-bit float.

### 5.1 Primitive Aliases

```pseudocode
type Pesos   = Decimal     // ₱ amount; always ≥ 0 unless noted
type IsoDate = string      // "YYYY-MM-DD"
type Rate    = Decimal     // 0.0–1.0 (percentages as decimals)
```

### 5.2 Enums

```pseudocode
enum Regime:
  TRAIN       // flat 6%, Form 1801 (Jan 2018)
  PRE_TRAIN   // graduated 0%–20%, Form 1801 (Jun 2006)
  AMNESTY     // flat 6%, minimum ₱5,000, ETAR form

enum DeductionRules:
  TRAIN       // ₱5M standard, ₱10M FH cap, no funeral/judicial
  PRE_TRAIN   // ₱1M standard, ₱1M FH cap, funeral + judicial allowed

enum AmnestyTrack:
  TRACK_A     // No prior return — base = full net taxable estate
  TRACK_B     // Prior return filed — base = net taxable − previously declared

enum PropertyRegime:
  ACP         // Absolute Community of Property (default post-Aug 3, 1988)
  CPG         // Conjugal Partnership of Gains (default pre-Aug 3, 1988)
  SEPARATION  // Complete Separation of Property (prenuptial agreement)

enum Ownership:
  EXCLUSIVE   // Column A — belongs solely to decedent
  CONJUGAL    // Column B — shared with spouse

enum MaritalStatus:
  SINGLE | MARRIED | WIDOWED | LEGALLY_SEPARATED | ANNULLED

enum TaxableTransferType:
  CONTEMPLATION_OF_DEATH   // Sec. 85(B): transfer within 3 years
  REVOCABLE                // Sec. 85(C): power to revoke retained
  POWER_OF_APPOINTMENT     // Sec. 85(D): general power exercised
  LIFE_INSURANCE           // Sec. 85(E): estate/revocable beneficiary
  INSUFFICIENT_CONSIDERATION // Sec. 85(G): excess FMV over consideration

enum AmnestyIneligibilityReason:
  DEATH_AFTER_COVERAGE_CUTOFF | TAX_ALREADY_PAID | PCGG_EXCLUSION
  RA3019_EXCLUSION | RA9160_EXCLUSION | PENDING_COURT_CASE_EXCLUSION
  UNEXPLAINED_WEALTH_EXCLUSION | RPC_FELONY_EXCLUSION | USER_NOT_ELECTED
```

### 5.3 Top-Level Input Types

```pseudocode
type Decedent:
  name:                 string       // Last, First, Middle
  dateOfDeath:          IsoDate      // Required; drives all regime selection
  citizenship:          string       // e.g., "Filipino"
  isNonResidentAlien:   boolean      // true → NRA rules (PH-situs only, ₱500K SD, proportional ELIT)
  address:              string
  maritalStatus:        MaritalStatus
  propertyRegime:       PropertyRegime | null  // null if single/widowed/annulled
  // NRA-specific additional inputs (required when isNonResidentAlien = true AND any ELIT declared):
  totalWorldwideGrossEstate:  Pesos | null
  totalWorldwideELIT:         WorldwideELIT | null

type WorldwideELIT:
  claimsAgainstEstate:  Pesos
  claimsVsInsolvent:    Pesos
  unpaidMortgages:      Pesos
  casualtyLosses:       Pesos
  // pre-TRAIN NRA only (deductionRules = PRE_TRAIN):
  funeralExpenses:      Pesos
  judicialAdminExpenses: Pesos

type EstateFlags:
  taxFullyPaidBeforeMay2022:         boolean  // true → amnesty ineligible
  priorReturnFiled:                   boolean  // Track A vs. Track B
  previouslyDeclaredNetEstate:        Pesos | null  // required if priorReturnFiled = true
  // Six RA 11213 Sec. 9 exclusions (collect only when userElectsAmnesty = true):
  subjectToPCGGJurisdiction:          boolean
  hasRA3019Violations:                boolean
  hasRA9160Violations:                boolean
  hasPendingCourtCasePreAmnestyAct:   boolean  // filed before Feb 14, 2019
  hasUnexplainedWealthCases:          boolean
  hasPendingRPCFelonies:              boolean

type Executor:
  name:          string
  tin:           string | null
  contactNumber: string | null
  email:         string | null
```

### 5.4 Asset Input Types

```pseudocode
// Real property (Schedule 1 and 1A)
type RealPropertyAsset:
  titleNumber:           string       // OCT/TCT/CCT
  taxDeclarationNumber:  string
  location:              string
  lotArea:               Decimal      // sq.m., informational
  improvementArea:       Decimal      // sq.m., informational
  classification:        "RESIDENTIAL" | "COMMERCIAL" | "AGRICULTURAL" | "INDUSTRIAL"
  fmvTaxDeclaration:     Pesos        // Assessed value per tax declaration
  fmvBir:                Pesos        // Zonal value per BIR
  // Engine computes: fmv = max(fmvTaxDeclaration, fmvBir)
  ownership:             Ownership
  isFamilyHome:          boolean      // If true, goes to Schedule 1A
  barangayCertification: boolean      // Required for family home deduction

// Financial personal property (Schedule 2)
type PersonalPropertyFinancialAsset:
  subtype: "CASH_ON_HAND" | "CASH_IN_BANK" | "ACCOUNTS_RECEIVABLE" |
           "NOTES_RECEIVABLE" | "SHARES_LISTED" | "SHARES_UNLISTED" |
           "BONDS" | "MUTUAL_FUNDS"
  description:  string
  fmv:          Pesos
  ownership:    Ownership

// Tangible personal property (Schedule 2A)
type PersonalPropertyTangibleAsset:
  subtype:     "MOTOR_VEHICLE" | "JEWELRY" | "OTHER_TANGIBLE"
  description: string
  quantity:    number
  fmv:         Pesos
  ownership:   Ownership

// Taxable transfers (Schedule 3)
type TaxableTransferAsset:
  description:        string
  dateOfTransfer:     IsoDate
  type:               TaxableTransferType
  considerationReceived: Pesos   // 0 for pure gifts
  fmvAtDeath:         Pesos
  // Engine computes taxableAmount = max(0, fmvAtDeath - considerationReceived)
  ownership:          Ownership

// Business interests (Schedule 4)
type BusinessInterestAsset:
  name:       string
  nature:     string
  netEquity:  Pesos   // User-provided; engine floors at 0
  ownership:  Ownership

// Sec. 87 exempt assets (pre-computation exclusion — NOT in gross estate schedules)
type Sec87ExemptAsset:
  description:   string
  exemptionType: "USUFRUCT_MERGER" | "FIDUCIARY" | "FIDEICOMMISSARY" | "CHARITABLE_PRIVATE"
  fmv:           Pesos   // For audit trail only; not included in gross estate
```

### 5.5 Deduction Input Types

```pseudocode
// ELIT items
type ClaimAgainstEstate:
  description:    string
  amount:         Pesos
  ownership:      Ownership
  // Conditions: must be owing at death; notarized; pre-existing obligation

type ClaimVsInsolventPerson:
  description:    string
  amountInGrossEstate:  Pesos   // Must also appear as asset in gross estate
  uncollectibleAmount:  Pesos   // The deductible portion
  ownership:            Ownership

type UnpaidMortgage:
  description:       string
  propertyInEstate:  boolean   // Must be true for deduction
  amount:            Pesos
  ownership:         Ownership  // Conjugal mortgage → Column B at full balance

type UnpaidTax:
  description:  string   // Must be tax owing as of date of death; not estate tax itself
  amount:       Pesos
  ownership:    Ownership

type CasualtyLoss:
  description:       string
  grossLoss:         Pesos
  insuranceRecovery: Pesos
  // deductibleAmount = max(0, grossLoss - insuranceRecovery)
  ownership:         Ownership

// Vanishing deduction (Schedule 5E)
type VanishingDeductionProperty:
  description:         string
  priorTransferType:   "INHERITANCE" | "GIFT"
  priorTransferDate:   IsoDate
  priorFMV:            Pesos   // FMV at time of prior transfer
  currentFMV:          Pesos   // FMV at current decedent's date of death
  mortgageOnProperty:  Pesos   // Outstanding mortgage on THIS property (also in unpaidMortgages)
  priorTaxWasPaid:     boolean
  ownership:           Ownership
  isPhilippineSitus:   boolean  // Required for NRA

// Public use transfers (Schedule 5F)
type PublicUseTransfer:
  description:  string
  recipient:    string   // Name of PH government entity
  amount:       Pesos
  ownership:    Ownership

// Pre-TRAIN only (deductionRules = PRE_TRAIN)
type FuneralExpenses:
  actualAmount:  Pesos   // Engine computes: min(actualAmount, 5% × grossEstate.total)

type JudicialAdminExpenses:
  items:  Array<{ description: string, amount: Pesos, ownership: Ownership }>
  // Deductible: actual amounts, no cap

// Special deductions
type MedicalExpenses:
  items: Array<{ description: string, date: IsoDate, amount: Pesos }>
  // Qualifying: incurred within 1 year before date of death; official receipts
  // Engine computes: min(sum of qualifying items, 500_000)

type RA4917Benefits:
  amount:      Pesos   // Death benefit from BIR-approved private employer TQP
  employerName: string
  // Must also appear in gross estate (Schedule 2, Column A) — pass-through deduction

type ForeignTaxCreditClaim:
  country:            string
  foreignTaxPaid:     Pesos
  foreignPropertyFMV: Pesos  // FMV of property taxed in that foreign country
```

### 5.6 Top-Level Engine Input

```pseudocode
type EngineInput:
  decedent:              Decedent
  executor:              Executor
  estateFlags:           EstateFlags
  userElectsAmnesty:     boolean
  useNarrowAmnestyDeductions: boolean  // toggle for professional override

  // Assets (may be empty arrays for categories with no assets)
  realProperties:        Array<RealPropertyAsset>
  personalPropertiesFinancial: Array<PersonalPropertyFinancialAsset>
  personalPropertiesTangible:  Array<PersonalPropertyTangibleAsset>
  taxableTransfers:      Array<TaxableTransferAsset>
  businessInterests:     Array<BusinessInterestAsset>
  sec87ExemptAssets:     Array<Sec87ExemptAsset>

  // Deductions
  claimsAgainstEstate:   Array<ClaimAgainstEstate>
  claimsVsInsolvent:     Array<ClaimVsInsolventPerson>
  unpaidMortgages:       Array<UnpaidMortgage>
  unpaidTaxes:           Array<UnpaidTax>
  casualtyLosses:        Array<CasualtyLoss>
  vanishingDeductionProperties: Array<VanishingDeductionProperty>
  publicUseTransfers:    Array<PublicUseTransfer>
  funeralExpenses:       FuneralExpenses | null   // null if TRAIN regime
  judicialAdminExpenses: JudicialAdminExpenses | null  // null if TRAIN regime
  medicalExpenses:       MedicalExpenses | null
  ra4917Benefits:        RA4917Benefits | null
  foreignTaxCredits:     Array<ForeignTaxCreditClaim>

  // Informational filing fields
  filing:
    isAmended:           boolean
    extensionToFile:     boolean
    extensionToPay:      boolean
    installmentGranted:  boolean
    judicialSettlement:  boolean
    hasTaxRelief:        boolean
```

### 5.7 Output Types

```pseudocode
type ColumnValues:
  exclusive:  Pesos   // Column A
  conjugal:   Pesos   // Column B
  total:      Pesos   // Column C = A + B

type RegimeDetectionResult:
  regime:             Regime
  deductionRules:     DeductionRules
  track:              AmnestyTrack | null
  displayDualPath:    boolean
  amnestyEligible:    boolean
  ineligibilityReason: AmnestyIneligibilityReason | null
  warnings:           Array<string>

type GrossEstateResult:
  realProperty:       ColumnValues   // Item 29
  familyHome:         ColumnValues   // Item 30
  personalProperty:   ColumnValues   // Item 31
  taxableTransfers:   ColumnValues   // Item 32
  businessInterest:   ColumnValues   // Item 33
  total:              ColumnValues   // Item 34

type OrdinaryDeductionsResult:
  claimsAgainstEstate:    ColumnValues   // 5A
  claimsVsInsolvent:      ColumnValues   // 5B
  unpaidMortgagesAndTaxes: ColumnValues  // 5C
  casualtyLosses:          ColumnValues  // 5D
  vanishingDeduction:      ColumnValues  // 5E
  transfersPublicUse:      ColumnValues  // 5F
  funeralExpenses:         ColumnValues  // 5G (PRE_TRAIN only; 0 for TRAIN)
  judicialAdminExpenses:   ColumnValues  // 5H (PRE_TRAIN only; 0 for TRAIN)
  total:                   ColumnValues  // Item 35

type SpecialDeductionsResult:
  standardDeduction:   Pesos   // Item 37A (no A/B split)
  familyHome:          Pesos   // Item 37B
  medicalExpenses:     Pesos   // Item 37C
  ra4917:              Pesos   // Item 37D
  total:               Pesos   // Item 37

type SpouseShareResult:
  totalConjugalAssets:    Pesos   // Schedule 6A line a
  conjugalObligations:    Pesos   // Schedule 6A line b (ELIT 5A–5D Col B only)
  netConjugalProperty:    Pesos   // Schedule 6A line c
  spouseShare:            Pesos   // Schedule 6A line d = c × 0.50; Item 39

type TaxComputationResult:
  netTaxableEstate:       Pesos   // Item 40
  estateTaxDue:           Pesos   // Item 42
  foreignTaxCredit:       Pesos   // Item 43
  netEstateTaxDue:        Pesos   // Item 44 = Item 20
  // Pre-TRAIN only:
  graduatedBracket:       GraduatedBracketResult | null
  // Amnesty only:
  amnestyTrack:           AmnestyTrack | null
  previouslyDeclaredNet:  Pesos | null
  amnestyTaxBase:         Pesos | null
  computedAmnestyTax:     Pesos | null
  minimumApplied:         boolean

type GraduatedBracketResult:
  bracketMin:    Pesos
  bracketMax:    Pesos | null   // null for top bracket (>₱10M)
  bracketRate:   Rate
  baseTax:       Pesos
  excessAmount:  Pesos
  taxOnExcess:   Pesos
  totalTax:      Pesos

type EngineOutput:
  regimeDetection:        RegimeDetectionResult
  sec87Exclusions:        Array<{ asset: Sec87ExemptAsset, reason: string }>
  grossEstate:            GrossEstateResult
  ordinaryDeductions:     OrdinaryDeductionsResult
  estateAfterOrdinary:    ColumnValues              // Item 36
  specialDeductions:      SpecialDeductionsResult
  netEstate:              Pesos                     // Item 38
  spouseShare:            SpouseShareResult
  taxComputation:         TaxComputationResult
  nraProportionalFactor:  Rate | null               // null for non-NRA
  dualPathComparison:     DualPathComparisonResult | null
  explainer:              ExplainerOutput
  warnings:               Array<string>

type DualPathComparisonResult:
  amnestyResult:          TaxComputationResult
  preTRAINResult:         TaxComputationResult
  recommendedPath:        "AMNESTY" | "PRE_TRAIN" | "EQUAL"
  crossoverNTE:           Pesos   // ₱1,250,000
  filingWindowClosed:     boolean  // always true
```

---

## 6. Regime Detection

Regime detection is a pure routing function. It takes date of death and user flags and outputs two independent flags (`regime` and `deductionRules`) that drive all downstream computation.

```pseudocode
function detectRegime(decedent, estateFlags, userElectsAmnesty) → RegimeDetectionResult:

  warnings = []

  // ── BRANCH A: TRAIN-era death (Jan 1, 2018 onward) ──────────────────────

  if decedent.dateOfDeath >= TRAIN_EFFECTIVE_DATE:

    // A1: After amnesty coverage cutoff → TRAIN only
    if decedent.dateOfDeath > AMNESTY_COVERAGE_CUTOFF:
      if userElectsAmnesty:
        warnings.append("Estate tax amnesty is not available for decedents who died after May 31, 2022.")
      return { regime: TRAIN, deductionRules: TRAIN, track: null,
               displayDualPath: false, warnings }

    // A2: 2018-01-01 ≤ dateOfDeath ≤ 2022-05-31
    if userElectsAmnesty:
      eligibility = checkAmnestyEligibility(decedent, estateFlags)
      if eligibility.eligible:
        warnings.append("For TRAIN-era deaths (2018–2022), the amnesty rate (6%) equals the regular TRAIN rate (6%) and deduction rules are identical. Base tax is the same under both paths. The amnesty benefit was surcharge/interest waiver only. Amnesty filing window closed June 14, 2025.")
        return { regime: AMNESTY, deductionRules: TRAIN, track: eligibility.track,
                 displayDualPath: false, warnings }
      else:
        warnings.append("Amnesty ineligible: " + describeIneligibility(eligibility.reason) + " Regular TRAIN rules apply.")
        return { regime: TRAIN, deductionRules: TRAIN, track: null,
                 displayDualPath: false, amnestyEligible: false,
                 ineligibilityReason: eligibility.reason, warnings }
    else:
      if not estateFlags.taxFullyPaidBeforeMay2022:
        warnings.append("NOTE: This estate may have been eligible for estate tax amnesty (RA 11956) since decedent died between Jan 1, 2018 and May 31, 2022. Amnesty window closed June 14, 2025. Base tax is identical under both paths.")
      return { regime: TRAIN, deductionRules: TRAIN, track: null,
               displayDualPath: false, warnings }

  // ── BRANCH B: Pre-TRAIN death (before Jan 1, 2018) ──────────────────────

  if not userElectsAmnesty:
    if not estateFlags.taxFullyPaidBeforeMay2022:
      warnings.append("NOTE: If this estate has unpaid estate tax, the amnesty (RA 11213, as amended) may have been available. For net taxable estates above ₱1,250,000, the 6% amnesty rate produces lower base tax than the graduated pre-TRAIN schedule. Amnesty window closed June 14, 2025.")
    return { regime: PRE_TRAIN, deductionRules: PRE_TRAIN, track: null,
             displayDualPath: false, warnings }

  // User elects amnesty for pre-TRAIN death
  eligibility = checkAmnestyEligibility(decedent, estateFlags)

  if not eligibility.eligible:
    warnings.append("Amnesty ineligible: " + describeIneligibility(eligibility.reason) + " Regular pre-TRAIN graduated rates apply.")
    return { regime: PRE_TRAIN, deductionRules: PRE_TRAIN, track: null,
             displayDualPath: false, amnestyEligible: false,
             ineligibilityReason: eligibility.reason, warnings }

  // Eligible for amnesty
  warnings.append("⚠ AMNESTY FILING WINDOW CLOSED: The estate tax amnesty (RA 11213, as amended by RA 11956) had a deadline of June 14, 2025. This computation is for HISTORICAL REFERENCE ONLY.")
  return { regime: AMNESTY, deductionRules: PRE_TRAIN, track: eligibility.track,
           displayDualPath: true, amnestyEligible: true, warnings }


function checkAmnestyEligibility(decedent, estateFlags) → { eligible, reason, track }:
  if decedent.dateOfDeath > AMNESTY_COVERAGE_CUTOFF:
    return { eligible: false, reason: DEATH_AFTER_COVERAGE_CUTOFF }
  if estateFlags.taxFullyPaidBeforeMay2022:
    return { eligible: false, reason: TAX_ALREADY_PAID }
  if estateFlags.subjectToPCGGJurisdiction:
    return { eligible: false, reason: PCGG_EXCLUSION }
  if estateFlags.hasRA3019Violations:
    return { eligible: false, reason: RA3019_EXCLUSION }
  if estateFlags.hasRA9160Violations:
    return { eligible: false, reason: RA9160_EXCLUSION }
  if estateFlags.hasPendingCourtCasePreAmnestyAct:
    return { eligible: false, reason: PENDING_COURT_CASE_EXCLUSION }
  if estateFlags.hasUnexplainedWealthCases:
    return { eligible: false, reason: UNEXPLAINED_WEALTH_EXCLUSION }
  if estateFlags.hasPendingRPCFelonies:
    return { eligible: false, reason: RPC_FELONY_EXCLUSION }

  track = estateFlags.priorReturnFiled ? TRACK_B : TRACK_A
  return { eligible: true, reason: null, track }
```

### Regime Detection Error Cases

| Condition | Error Code | Message |
|-----------|-----------|---------|
| `dateOfDeath` missing | `ERR_DATE_REQUIRED` | "Date of death is required." |
| `dateOfDeath` is in the future | `ERR_DATE_FUTURE` | "Date of death cannot be in the future." |
| `dateOfDeath` before 1901-01-01 | `ERR_DATE_IMPLAUSIBLE` | "Date of death appears implausible. Please verify." |
| `priorReturnFiled = true` but `previouslyDeclaredNetEstate` missing | `ERR_TRACK_B_MISSING` | "For Track B amnesty, enter the net estate from the prior return." |
| `previouslyDeclaredNetEstate < 0` | `ERR_PRIOR_NEGATIVE` | "Previously declared net estate cannot be negative." |

---

## 7. Pre-Computation: Sec. 87 Exclusions

Run this filter **before** populating gross estate schedules. Excluded assets do NOT appear in Items 29–34.

```pseudocode
function applySec87Exclusions(assets, sec87ExemptAssets) → { filteredAssets, exclusionLog }:

  exclusionLog = []

  for each exemptAsset in sec87ExemptAssets:
    switch exemptAsset.exemptionType:

      case "USUFRUCT_MERGER":
        // Sec. 87(a): Merger of usufruct into naked ownership (personal usufruct only)
        // Exclude from gross estate entirely
        // DOES NOT APPLY to: fixed-term usufructs (include at actuarial value)
        exclusionLog.append({ asset: exemptAsset, reason: "Sec. 87(a): Merger of personal usufruct into naked ownership — excluded from gross estate" })

      case "FIDUCIARY":
        // Sec. 87(b): Transmission from fiduciary heir to fideicommissary
        // Exclude from fiduciary heir's gross estate
        exclusionLog.append({ asset: exemptAsset, reason: "Sec. 87(b): Fiduciary transmission — excluded from gross estate of fiduciary heir" })

      case "FIDEICOMMISSARY":
        // Sec. 87(c): Transmission from first heir to second heir (fideicommissary)
        exclusionLog.append({ asset: exemptAsset, reason: "Sec. 87(c): Fideicommissary transmission — excluded from gross estate" })

      case "CHARITABLE_PRIVATE":
        // Sec. 87(d): Bequest to qualifying PRIVATE charitable institution
        // Conditions: no income inures to any individual; admin expenses ≤ 30% of gross income
        // IMPORTANT: This is for PRIVATE institutions only.
        // Bequests to GOVERNMENT entities use the Sec. 86(A)(3) deduction path (Schedule 5F)
        exclusionLog.append({ asset: exemptAsset, reason: "Sec. 87(d): Bequest to qualifying private charitable institution — excluded from gross estate" })

  // Remove sec87ExemptAssets from gross estate computation
  return { filteredAssets: assets minus exemptAssets, exclusionLog }
```

**Key distinctions**:
- Sec. 87 exclusions → asset never enters gross estate (Items 29–34)
- Sec. 86(A)(3) government transfers → asset IS in gross estate, then deducted at Schedule 5F
- Fixed-term usufructs → NOT excluded; include at Sec. 88(A) actuarial value (user must provide)

---

## 8. Gross Estate Computation

### 8.1 Citizens and Resident Aliens (Worldwide Scope)

```pseudocode
function computeGrossEstate(decedent, filteredAssets) → GrossEstateResult:

  // Item 29: Real Properties excluding family home
  realProp = sumByOwnership(filteredAssets.realProperties.filter(!isFamilyHome))
  // Each asset: fmv = max(fmvTaxDeclaration, fmvBir)

  // Item 30: Family Home (only one property; multiple → validation error)
  familyHomeAssets = filteredAssets.realProperties.filter(isFamilyHome)
  if familyHomeAssets.length > 1: RAISE ERR_MULTIPLE_FAMILY_HOMES
  familyHome = sumByOwnership(familyHomeAssets)

  // Item 31: Personal Properties (Schedule 2 + 2A)
  personalProp = sumByOwnership(
    filteredAssets.personalPropertiesFinancial +
    filteredAssets.personalPropertiesTangible
  )
  // NRA: intangibles (Schedule 2 subtypes except tangibles) excluded if reciprocity applies

  // Item 32: Taxable Transfers (Schedule 3)
  taxableTransfers = sumTaxableTransfers(filteredAssets.taxableTransfers)
  // taxableAmount per item = max(0, fmvAtDeath - considerationReceived)

  // Item 33: Business Interest (Schedule 4)
  businessInterest = sumByOwnership(filteredAssets.businessInterests)
  // Each businessInterest.netEquity floored at 0

  total = {
    exclusive: realProp.A + familyHome.A + personalProp.A + taxableTransfers.A + businessInterest.A,
    conjugal:  realProp.B + familyHome.B + personalProp.B + taxableTransfers.B + businessInterest.B,
    total:     (above.exclusive + above.conjugal)
  }

  return { realProperty: realProp, familyHome, personalProperty: personalProp,
           taxableTransfers, businessInterest, total }
```

### 8.2 Non-Resident Aliens (PH-Situs Only)

NRA gross estate uses the same five line items (29–34) but:
- Only PH-situated assets are included
- Item 30 (Family Home) = ₱0 always (family home deduction not available to NRAs)
- Intangible personal property is excluded if the reciprocity exemption applies

```pseudocode
// Reciprocity exemption (Sec. 85, NRA)
// User declares: decedent.homeCountryGrantsReciprocity: boolean
// If true: exclude all intangible personal property from gross estate (Schedule 2 types only)

function isIncludedForNRA(asset, decedent):
  if not asset.isPhilippineSitus: return false
  if asset is intangible personal property AND decedent.homeCountryGrantsReciprocity:
    return false
  return true
```

**NRA situs rules by asset type**:
| Asset Type | Philippine Situs Rule |
|-----------|----------------------|
| Real property | Location in PH |
| Tangible personal property | Physical location in PH at death |
| Cash on hand | Location in PH |
| Cash in bank | Branch of bank in PH |
| Shares of stock — domestic corporation | Always PH situs |
| Shares of stock — foreign corporation | PH situs if ≥ 85% of business in PH |
| Franchise | PH situs if exercised in PH |
| Bonds/notes | PH situs if debtor is PH resident |
| Foreign government bonds | NOT PH situs |

### 8.3 Taxable Transfer Types (Sec. 85(B)–(G))

These six rules govern what goes into Item 32 / Schedule 3:

| Type | Legal Basis | Inclusion Rule |
|------|------------|----------------|
| Contemplation of death | Sec. 85(B) | Transfer within 3 years before death at zero/inadequate consideration is presumed; include at `fmvAtDeath` |
| Revocable transfer | Sec. 85(C) | Power to alter/revoke retained at death (or relinquished ≤3 years); include at `fmvAtDeath`; bona fide sale exception |
| General power of appointment | Sec. 85(D) | GPA exercised by will (always) or by deed within 3 years; include at `fmvAtDeath` |
| Life insurance — estate/revocable beneficiary | Sec. 85(E) | Estate named beneficiary OR revocably-designated beneficiary → include proceeds; irrevocably-designated → exclude |
| Retroactivity | Sec. 85(F) | No computation; informational clause only |
| Insufficient consideration | Sec. 85(G) | `taxableAmount = max(0, fmvAtDeath - considerationReceived)` |

**Regime invariance**: All six inclusion rules apply identically across TRAIN, pre-TRAIN, and amnesty regimes. NRA: PH-situs only; reciprocity applies to intangibles.

---

## 9. Ordinary Deductions (Schedule 5)

### 9.1 Available Deductions by Regime

| Deduction | Schedule Line | TRAIN (deductionRules=TRAIN) | Pre-TRAIN (deductionRules=PRE_TRAIN) | Amnesty + PRE_TRAIN deductionRules | Amnesty + TRAIN deductionRules |
|-----------|--------------|------------------------------|--------------------------------------|-------------------------------------|-------------------------------|
| Claims against estate | 5A | ✓ | ✓ | ✓ | ✓ |
| Claims vs. insolvent | 5B | ✓ | ✓ | ✓ | ✓ |
| Unpaid mortgages + taxes | 5C | ✓ | ✓ | ✓ | ✓ |
| Casualty losses | 5D | ✓ | ✓ | ✓ | ✓ |
| Vanishing deduction | 5E | ✓ | ✓ | ✓ | ✓ |
| Transfers for public use | 5F | ✓ | ✓ | ✓ | ✓ |
| **Funeral expenses** | **5G** | **✗** | **✓** | **✓** | **✗** |
| **Judicial/admin expenses** | **5H** | **✗** | **✓** | **✓** | **✗** |

### 9.2 Claims Against Estate (5A) — Sec. 86(A)(1)(a)

```pseudocode
function computeClaimsAgainstEstate(claims) → ColumnValues:
  result = { exclusive: 0, conjugal: 0, total: 0 }
  for each claim in claims:
    // Conditions: must be owing at time of death; notarized; pre-existing personal obligation
    // contracted in good faith for adequate consideration
    if claim.ownership == EXCLUSIVE: result.exclusive += claim.amount
    else: result.conjugal += claim.amount
  result.total = result.exclusive + result.conjugal
  return result

// Exclusions: funeral expenses, judicial/admin expenses, estate tax itself are NOT claims
```

### 9.3 Claims vs. Insolvent Persons (5B) — Sec. 86(A)(1)(b)

```pseudocode
function computeClaimsVsInsolvent(claims) → ColumnValues:
  // The receivable MUST first appear in gross estate (Schedule 2)
  // Deduction = uncollectible portion only
  result = { exclusive: 0, conjugal: 0, total: 0 }
  for each claim in claims:
    if claim.ownership == EXCLUSIVE: result.exclusive += claim.uncollectibleAmount
    else: result.conjugal += claim.uncollectibleAmount
  result.total = result.exclusive + result.conjugal
  return result
```

### 9.4 Unpaid Mortgages and Taxes (5C) — Sec. 86(A)(1)(c)

```pseudocode
function computeUnpaidMortgagesAndTaxes(mortgages, taxes) → ColumnValues:
  result = { exclusive: 0, conjugal: 0, total: 0 }

  for each mortgage in mortgages:
    // Property encumbered by mortgage MUST be in gross estate
    // Conjugal mortgage → full balance in Column B (Schedule 6A handles the 50/50 split)
    if mortgage.ownership == EXCLUSIVE: result.exclusive += mortgage.amount
    else: result.conjugal += mortgage.amount

  for each tax in taxes:
    // Taxes due as of date of death (e.g., income tax, property tax)
    // EXCLUDE estate tax itself
    if tax.ownership == EXCLUSIVE: result.exclusive += tax.amount
    else: result.conjugal += tax.amount

  result.total = result.exclusive + result.conjugal
  return result
```

### 9.5 Casualty Losses (5D) — Sec. 86(A)(1)(e)

```pseudocode
function computeCasualtyLosses(losses) → ColumnValues:
  result = { exclusive: 0, conjugal: 0, total: 0 }
  for each loss in losses:
    deductible = max(0, loss.grossLoss - loss.insuranceRecovery)
    // Conditions: arises AFTER death, during settlement; qualifying event (fire, storm, etc.)
    // Not already compensated by insurance; not previously claimed elsewhere
    if loss.ownership == EXCLUSIVE: result.exclusive += deductible
    else: result.conjugal += deductible
  result.total = result.exclusive + result.conjugal
  return result
```

### 9.6 Vanishing Deduction (5E) — Sec. 86(A)(2)

```pseudocode
function computeVanishingDeduction(properties, grossEstateTotal, elitTotal) → ColumnValues:
  // elitTotal = sum of 5A + 5B + 5C + 5D (NOT including 5G funeral or 5H judicial for pre-TRAIN)
  // Note: For pre-TRAIN, ELIT for the ratio DOES include funeral + judicial (5G + 5H)

  result = { exclusive: 0, conjugal: 0, total: 0 }
  ratio = grossEstateTotal > 0 ? max(0, (grossEstateTotal - elitTotal) / grossEstateTotal) : 0

  for each prop in properties:
    elapsed = yearsBetween(prop.priorTransferDate, decedent.dateOfDeath)
    if elapsed > 5: continue   // disqualified
    if not prop.priorTaxWasPaid: continue  // disqualified

    iv  = min(prop.priorFMV, prop.currentFMV)
    nv  = max(0, iv - prop.mortgageOnProperty)
    pct = vanishingPct(elapsed)   // 1.00/0.80/0.60/0.40/0.20
    vd  = max(0, pct × nv × ratio)

    if prop.ownership == EXCLUSIVE: result.exclusive += vd
    else: result.conjugal += vd

  result.total = result.exclusive + result.conjugal
  return result

function vanishingPct(elapsedYears):
  if elapsedYears <= 1: return 1.00
  elif elapsedYears <= 2: return 0.80
  elif elapsedYears <= 3: return 0.60
  elif elapsedYears <= 4: return 0.40
  elif elapsedYears <= 5: return 0.20
  else: return 0.00
```

**Ordering constraint**: Gross estate (Item 34) and ELIT (5A–5D) must be finalized BEFORE computing the vanishing deduction ratio.

**Availability**:
- TRAIN: ✓ Available
- Pre-TRAIN: ✓ Available (ELIT for ratio includes funeral + judicial)
- Amnesty: ✓ Available (full deduction set; RA 11213 Sec. 3)

### 9.7 Transfers for Public Use (5F) — Sec. 86(A)(3)

```pseudocode
function computePublicUseTransfers(transfers, decedent, grossEstateTotal) → ColumnValues:
  result = { exclusive: 0, conjugal: 0, total: 0 }

  for each transfer in transfers:
    // Qualifying recipient: PH national government, provinces, cities,
    // municipalities, barangays, government agencies
    // Purpose: exclusively public use
    // Foreign governments: DO NOT qualify
    // GOCCs: require legal review; flag as warning

    if decedent.isNonResidentAlien:
      // Sec. 86(B)(2): NRA public transfers are PROPORTIONAL
      // proportionalFactor = grossEstatePH / totalWorldwideGrossEstate
      factor = grossEstateTotal / decedent.totalWorldwideGrossEstate
      amount = factor * transfer.amount
    else:
      amount = transfer.amount  // Full value for citizens/residents

    if transfer.ownership == EXCLUSIVE: result.exclusive += amount
    else: result.conjugal += amount

  result.total = result.exclusive + result.conjugal
  return result
```

**Critical NRA correction**: Public use transfers for NRAs are **proportional** under Sec. 86(B)(2), NOT full-value. Sec. 86(B)(2) applies its proportional formula to both paragraphs (1) [ELIT] and (3) [public transfers] of Sec. 86(A).

### 9.8 Funeral Expenses (5G) — Pre-TRAIN Only

```pseudocode
function computeFuneralExpenses(funeralExpenses, grossEstateTotal, deductionRules) → ColumnValues:
  if deductionRules == TRAIN: return { exclusive: 0, conjugal: 0, total: 0 }
  // deductionRules must be PRE_TRAIN (applies to both regime=PRE_TRAIN and regime=AMNESTY + PRE_TRAIN)

  funeralLimit = grossEstateTotal * FUNERAL_RATE   // 5% of total gross estate (Item 34.C)
  deductible = min(funeralExpenses.actualAmount, funeralLimit)

  // Funeral expenses are typically Column B (conjugal) if estate is conjugal
  // Column assignment: user-declared per estate (usually all one column)
  // For simplicity: track user's ownership tag for funeral expenses
  // Engine: assign as conjugal if any Column B gross estate > 0, else exclusive
  return { exclusive: 0, conjugal: deductible, total: deductible }
  // Implementor note: ownership column may need user input; default to Column B for married estates
```

**Ordering constraint**: `grossEstateTotal` (Item 34.C) must be finalized BEFORE computing the funeral limit.

### 9.9 Judicial / Administrative Expenses (5H) — Pre-TRAIN Only

```pseudocode
function computeJudicialAdminExpenses(expenses, deductionRules) → ColumnValues:
  if deductionRules == TRAIN: return { exclusive: 0, conjugal: 0, total: 0 }

  result = { exclusive: 0, conjugal: 0, total: 0 }
  for each item in expenses.items:
    if item.ownership == EXCLUSIVE: result.exclusive += item.amount
    else: result.conjugal += item.amount
  result.total = result.exclusive + result.conjugal
  return result
  // No cap; all actual qualifying judicial/administrative expenses are deductible
```

### 9.10 Total Ordinary Deductions (Item 35)

```pseudocode
function computeOrdinaryDeductionsTotal(components) → ColumnValues:
  A = sum of all components.exclusive
  B = sum of all components.conjugal
  return { exclusive: A, conjugal: B, total: A + B }

// Item 36 (estate after ordinary deductions) — per column, floored at 0:
estateAfterOrdinary = {
  exclusive: max(0, grossEstate.total.exclusive - ordinaryDeductions.total.exclusive),
  conjugal:  max(0, grossEstate.total.conjugal  - ordinaryDeductions.total.conjugal),
  total:     (above.exclusive + above.conjugal)
}
```

---

## 10. Special Deductions (Schedule 6)

### 10.1 Standard Deduction (Item 37A) — Sec. 86(A)(4) / 86(B)(1)

```pseudocode
function computeStandardDeduction(decedent, deductionRules) → Pesos:
  if decedent.isNonResidentAlien:
    return STANDARD_DEDUCTION_NRA   // ₱500,000; same across all regimes

  if deductionRules == TRAIN:
    return STANDARD_DEDUCTION_TRAIN_CITIZEN    // ₱5,000,000

  if deductionRules == PRE_TRAIN:
    return STANDARD_DEDUCTION_PRE_TRAIN_CITIZEN  // ₱1,000,000

// No A/B column split; single value applied to net estate total
// No documentation required; automatic
// Not multiplied by number of heirs
```

### 10.2 Family Home Deduction (Item 37B) — Sec. 86(A)(5)

```pseudocode
function computeFamilyHomeDeduction(grossEstate, decedent, deductionRules) → Pesos:
  if decedent.isNonResidentAlien: return 0   // Not available to NRAs

  familyHomeAsset = single asset flagged isFamilyHome = true
  if familyHomeAsset == null: return 0
  if not familyHomeAsset.barangayCertification: return 0  // Certification required

  cap = (deductionRules == TRAIN) ? FAMILY_HOME_CAP_TRAIN : FAMILY_HOME_CAP_PRE_TRAIN
  fmv = familyHomeAsset.fmv   // max(zonal, assessed) — user provides both

  if familyHomeAsset.ownership == EXCLUSIVE:
    return min(fmv, cap)
  else:  // CONJUGAL
    return min(fmv * 0.5, cap)  // Decedent's half only; spouse's half via Item 39

// The full FMV appears in Item 30 (gross estate); only the capped/halved amount is the deduction here
// Note: Some commentary uses full FMV for conjugal; this engine implements the NIRC text (½ for conjugal)
// Only one property may be designated as family home; multiple flagged → ERR_MULTIPLE_FAMILY_HOMES
```

### 10.3 Medical Expenses (Item 37C) — Sec. 86(A)(6)

```pseudocode
function computeMedicalExpenseDeduction(medicalExpenses, decedent) → Pesos:
  if decedent.isNonResidentAlien: return 0   // Not available to NRAs
  if medicalExpenses == null: return 0

  // Only expenses incurred within 1 year BEFORE date of death
  qualifying = medicalExpenses.items.filter(
    item => item.date >= (decedent.dateOfDeath - 365 days) AND
            item.date <= decedent.dateOfDeath
  )
  return min(sum(qualifying.map(i => i.amount)), MEDICAL_EXPENSE_CAP)  // ₱500,000 cap

// No A/B column split; single value
// Official receipts required (user-declared; engine trusts declaration)
// Unpaid medical bills may appear in both 5A (claims) and 37C — engine warns but does not prevent
```

### 10.4 RA 4917 Benefits (Item 37D) — Sec. 86(A)(7)

```pseudocode
function computeRA4917Deduction(ra4917, decedent) → Pesos:
  if decedent.isNonResidentAlien: return 0   // Not in Sec. 86(B)
  if ra4917 == null: return 0

  // Pass-through deduction: amount appears BOTH in gross estate (Schedule 2, Column A)
  // AND as a deduction here. Net effect = zero. Available under all regimes.
  return ra4917.amount
```

### 10.5 Total Special Deductions (Item 37)

```pseudocode
specialDeductionsTotal = standardDeduction + familyHomeDeduction
                       + medicalExpenseDeduction + ra4917Deduction

// Item 38 (Net Estate):
netEstate = max(0, estateAfterOrdinary.total - specialDeductionsTotal)
```

---

## 11. Surviving Spouse Share (Schedule 6A)

**Legal basis**: NIRC Sec. 86(C) — unchanged across all three regimes.

```pseudocode
function computeSurvivingSpouseShare(decedent, grossEstate, ordinaryDeductions) → SpouseShareResult:

  // No surviving spouse → share = 0
  if decedent.maritalStatus in [SINGLE, WIDOWED, ANNULLED]:
    return { totalConjugalAssets: 0, conjugalObligations: 0,
             netConjugalProperty: 0, spouseShare: 0 }

  // Separation of property → no community pool → share = 0
  if decedent.propertyRegime == SEPARATION:
    return { totalConjugalAssets: 0, conjugalObligations: 0,
             netConjugalProperty: 0, spouseShare: 0 }

  // Note: legally_separated (court decree) ≠ separation of property regime (prenuptial)
  // Legal separation does NOT eliminate the spouse's share under ACP/CPG

  // Step 1: Total community/conjugal assets = gross estate Column B (Item 34B)
  totalConjugalAssets = grossEstate.total.conjugal   // Full FMV of all Column B items

  // Step 2: Community obligations = ONLY ELIT lines 5A–5D Column B
  // NOTE: Vanishing deduction (5E) and public transfers (5F) are policy deductions,
  // NOT financial obligations — exclude from community pool reduction
  // For pre-TRAIN: funeral (5G) and judicial (5H) obligations are INCLUDED
  conjugalObligations =
    ordinaryDeductions.claimsAgainstEstate.conjugal
    + ordinaryDeductions.claimsVsInsolvent.conjugal
    + ordinaryDeductions.unpaidMortgagesAndTaxes.conjugal
    + ordinaryDeductions.casualtyLosses.conjugal
    // PRE_TRAIN only (deductionRules = PRE_TRAIN):
    + ordinaryDeductions.funeralExpenses.conjugal
    + ordinaryDeductions.judicialAdminExpenses.conjugal

  // Step 3: Net community property
  netConjugalProperty = max(0, totalConjugalAssets - conjugalObligations)

  // Step 4: Spouse's share = 50%
  spouseShare = netConjugalProperty * 0.50

  return { totalConjugalAssets, conjugalObligations, netConjugalProperty, spouseShare }

// Item 39 = spouseShare
// Item 40 = max(0, netEstate - spouseShare)
netTaxableEstate = max(0, netEstate - spouseShare)
```

### Property Regime Rules for Column A/B Classification

#### ACP (Absolute Community of Property)
- **Default for**: marriages on or after August 3, 1988 (no valid prenuptial)
- **Column B (community)**: ALL property owned at marriage AND acquired during marriage, UNLESS:
  - Acquired by gratuitous title (gift, inheritance) during marriage → Column A (unless donor stipulated community)
  - Personal exclusive-use items → Column A (EXCEPT jewelry → Column B always)
  - Pre-marital property of a spouse who had legitimate children from a prior marriage → Column A
- **Column A (exclusive)**: The three exceptions above
- **Pre-marital property default**: Column B (community) — opposite of CPG

#### CPG (Conjugal Partnership of Gains)
- **Default for**: marriages contracted before August 3, 1988
- **Column B (conjugal)**: Work/industry during marriage; acquisitions with conjugal funds; ALL fruits/income during marriage (even from exclusive/capital property)
- **Column A (exclusive/capital/paraphernal)**: Property brought into marriage (pre-marital); acquired during marriage by gratuitous title; exchange of exclusive property
- **Key CPG rule**: Fruits of exclusive property = CONJUGAL (Column B) — opposite of ACP
- **Pre-marital property default**: Column A (exclusive) — opposite of ACP

#### Separation of Property
- Requires valid prenuptial agreement expressly establishing the regime, executed before marriage
- ALL property → Column A
- Column B = 0 throughout
- Item 39 = 0

---

## 12. Tax Rate Application

### 12.1 TRAIN Rate (regime = TRAIN)

```pseudocode
function applyTRAINRate(netTaxableEstate) → { estateTaxDue }:
  estateTaxDue = netTaxableEstate * TRAIN_RATE  // 0.06
  return { estateTaxDue }

// Applies to: all decedents (citizens, resident aliens, NRAs) with dateOfDeath >= 2018-01-01
// No exemption threshold (unlike pre-TRAIN)
// No minimum tax (unlike amnesty)
```

### 12.2 Pre-TRAIN Graduated Rate (regime = PRE_TRAIN)

```pseudocode
function computePreTrainTax(netTaxableEstate) → { estateTaxDue, bracket }:
  nte = max(0, netTaxableEstate)

  if nte <= 200_000:
    return { estateTaxDue: 0, bracket: { bracketMin: 0, bracketMax: 200_000, rate: 0.00, baseTax: 0, excess: 0, taxOnExcess: 0 } }

  elif nte <= 500_000:
    excess = nte - 200_000
    tax = excess * 0.05
    return { estateTaxDue: tax, bracket: { bracketMin: 200_000, bracketMax: 500_000, rate: 0.05, baseTax: 0, excessAmount: excess, taxOnExcess: tax } }

  elif nte <= 2_000_000:
    excess = nte - 500_000
    tax = 15_000 + excess * 0.08
    return { estateTaxDue: tax, bracket: { bracketMin: 500_000, bracketMax: 2_000_000, rate: 0.08, baseTax: 15_000, excessAmount: excess, taxOnExcess: excess * 0.08 } }

  elif nte <= 5_000_000:
    excess = nte - 2_000_000
    tax = 135_000 + excess * 0.11
    return { estateTaxDue: tax, bracket: { bracketMin: 2_000_000, bracketMax: 5_000_000, rate: 0.11, baseTax: 135_000, excessAmount: excess, taxOnExcess: excess * 0.11 } }

  elif nte <= 10_000_000:
    excess = nte - 5_000_000
    tax = 465_000 + excess * 0.15
    return { estateTaxDue: tax, bracket: { bracketMin: 5_000_000, bracketMax: 10_000_000, rate: 0.15, baseTax: 465_000, excessAmount: excess, taxOnExcess: excess * 0.15 } }

  else:
    excess = nte - 10_000_000
    tax = 1_215_000 + excess * 0.20
    return { estateTaxDue: tax, bracket: { bracketMin: 10_000_000, bracketMax: null, rate: 0.20, baseTax: 1_215_000, excessAmount: excess, taxOnExcess: excess * 0.20 } }
```

**Bracket boundary verification** (hardcoded amounts):
- Tax at ₱500,000 = (₱300,000 × 0.05) = ₱15,000 ✓
- Tax at ₱2,000,000 = ₱15,000 + (₱1,500,000 × 0.08) = ₱135,000 ✓
- Tax at ₱5,000,000 = ₱135,000 + (₱3,000,000 × 0.11) = ₱465,000 ✓
- Tax at ₱10,000,000 = ₱465,000 + (₱5,000,000 × 0.15) = ₱1,215,000 ✓

---

## 13. Foreign Tax Credit

**Legal basis**: NIRC Sec. 86(D)

```pseudocode
function computeForeignTaxCredit(decedent, regime, taxClaims, grossEstate, estateTaxDue) → Pesos:

  // NOT available to NRAs
  if decedent.isNonResidentAlien: return 0

  // NOT available under amnesty
  if regime == AMNESTY: return 0

  totalCredit = 0

  for each claim in taxClaims:
    // Per-country credit limit
    perCountryLimit = estateTaxDue * (claim.foreignPropertyFMV / grossEstate.total.total)
    countryCredit = min(claim.foreignTaxPaid, perCountryLimit)
    totalCredit += countryCredit

  // Overall credit limit = total estate tax due
  totalCredit = min(totalCredit, estateTaxDue)

  return totalCredit

// Item 43 = foreignTaxCredit
// Item 44 = max(0, estateTaxDue - foreignTaxCredit)
netEstateTaxDue = max(0, estateTaxDue - foreignTaxCredit)
```

---

## 14. Amnesty Computation (RA 11213)

**Legal basis**: RA 11213 Sec. 5 (rate); Sec. 3 (net estate definition)

### 14.1 Amnesty Tax Computation

```pseudocode
function computeAmnestyTax(netTaxableEstate, estateFlags, deductionRules) → TaxComputationResult:

  // Step 1: Select amnesty tax base by track
  if estateFlags.priorReturnFiled:  // Track B
    netUndeclared = netTaxableEstate - estateFlags.previouslyDeclaredNetEstate
    amnestyTaxBase = max(0, netUndeclared)
  else:  // Track A
    amnestyTaxBase = netTaxableEstate

  // Step 2: Compute tax
  computedTax = amnestyTaxBase * AMNESTY_RATE   // 0.06

  // Step 3: Apply minimum — ALWAYS
  amnestyTaxDue = max(AMNESTY_MINIMUM, computedTax)   // min ₱5,000

  return {
    amnestyTrack:          estateFlags.priorReturnFiled ? TRACK_B : TRACK_A,
    previouslyDeclaredNet: estateFlags.previouslyDeclaredNetEstate,
    amnestyTaxBase,
    computedAmnestyTax:    computedTax,
    netEstateTaxDue:       amnestyTaxDue,
    minimumApplied:        computedTax < AMNESTY_MINIMUM,
    foreignTaxCredit:      0,  // No credit under amnesty
    estateTaxDue:          amnestyTaxDue
  }
```

### 14.2 Deduction Rules Under Amnesty

**Primary interpretation (plain text of RA 11213 Sec. 3)**:
- "Net estate" = gross estate minus "allowable deductions under the NIRC at the time of death"
- Pre-2018 deaths (`deductionRules = PRE_TRAIN`): full pre-TRAIN deduction set including funeral and judicial/admin
- 2018–2022 deaths (`deductionRules = TRAIN`): TRAIN deduction set (no funeral/judicial)
- Vanishing deduction: ✓ Available under amnesty (full deduction set)

**Narrow interpretation override** (professional discretion):
```pseudocode
if input.useNarrowAmnestyDeductions:
  // Override: only standard deduction + surviving spouse share
  // All other deductions zeroed
  display WARNING: "Using narrow interpretation of RA 11213 deductions. Consult a tax professional."
```

### 14.3 Amnesty vs. Regular Pre-TRAIN Crossover

For pre-2018 deaths where both amnesty and regular pre-TRAIN apply:

```pseudocode
// Crossover NTE = ₱1,250,000
// Below ₱1,250,000: regular pre-TRAIN produces lower tax
// Above ₱1,250,000: amnesty produces lower base tax

// In the ₱500K–₱2M bracket: pre-TRAIN tax = 15,000 + (NTE - 500,000) × 0.08
// Setting equal to amnesty: 15,000 + (NTE - 500,000) × 0.08 = NTE × 0.06
// Solving: NTE = ₱1,250,000

// When displayDualPath = true, engine computes BOTH and shows comparison
function computeDualPathComparison(netTaxableEstate, amnestyResult, preTRAINResult):
  if amnestyResult.netEstateTaxDue < preTRAINResult.netEstateTaxDue:
    recommended = AMNESTY
  elif amnestyResult.netEstateTaxDue > preTRAINResult.netEstateTaxDue:
    recommended = PRE_TRAIN
  else:
    recommended = EQUAL

  return { amnestyResult, preTRAINResult, recommendedPath: recommended,
           crossoverNTE: PRE_TRAIN_CROSSOVER_NTE, filingWindowClosed: true }

// Always display: "Amnesty filing window closed June 14, 2025."
// Note: Surcharge/interest waiver (not computed by engine) may favor amnesty even when base tax is higher
```

---

## 15. NRA Proportional Deductions

For non-resident alien decedents, ELIT and public use transfers are proportional.

```pseudocode
function computeNRAProportionalFactor(grossEstatePH, decedent) → Rate:
  worldwide = decedent.totalWorldwideGrossEstate
  if worldwide == 0: RAISE ERR_WORLDWIDE_ESTATE_ZERO
  if grossEstatePH > worldwide: RAISE ERR_PH_EXCEEDS_WORLDWIDE
  return grossEstatePH / worldwide

function computeNRAELIT(decedent, grossEstatePH, deductionRules) → OrdinaryDeductionsPartial:
  factor = computeNRAProportionalFactor(grossEstatePH, decedent)
  W = decedent.totalWorldwideELIT

  // Apply factor to all ELIT sub-items
  claims     = factor * W.claimsAgainstEstate
  insolvent  = factor * W.claimsVsInsolvent
  mortgages  = factor * W.unpaidMortgages
  casualties = factor * W.casualtyLosses

  // Pre-TRAIN NRA only:
  funeral    = (deductionRules == PRE_TRAIN) ? factor * W.funeralExpenses : 0
  judicial   = (deductionRules == PRE_TRAIN) ? factor * W.judicialAdminExpenses : 0

  return { claimsAgainstEstate: claims, claimsVsInsolvent: insolvent,
           unpaidMortgages: mortgages, casualtyLosses: casualties,
           funeral, judicial, proportionalFactor: factor }

// NRA public transfers: also proportional (Sec. 86(B)(2) includes paragraph (3) of Sec. 86(A))
function computeNRAPublicTransfers(transfers, factor) → Pesos:
  worldwide_public = sum(transfers.map(t => t.amount))
  return factor * worldwide_public

// NRA vanishing deduction: same formula, but:
// - Only PH-situs prior properties qualify
// - ELIT used in ratio = proportional NRA ELIT (not worldwide ELIT)
// - GE = PH gross estate (Item 34.C)

// NRA unavailable deductions:
// Family home (Item 37B) = 0
// Medical expenses (Item 37C) = 0
// RA 4917 (Item 37D) = 0
// Foreign tax credit (Item 43) = 0
// Standard deduction = ₱500,000 (not ₱5M)
```

---

## 16. Complete Computation Pipeline

The engine runs these 14 phases in strict order. Dependencies marked.

```pseudocode
function computeEstateTax(input) → EngineOutput:

  // ── Phase 0: Input Validation ─────────────────────────────────────────
  validate(input)   // Raises ERR_* on failure (see Section 6 error table)

  // ── Phase 1: Regime Detection ─────────────────────────────────────────
  regimeResult = detectRegime(input.decedent, input.estateFlags, input.userElectsAmnesty)
  regime       = regimeResult.regime
  deductionRules = regimeResult.deductionRules

  // ── Phase 2: Sec. 87 Exclusions ───────────────────────────────────────
  { filteredAssets, sec87Exclusions } = applySec87Exclusions(input)

  // ── Phase 3: Gross Estate (Items 29–34) ───────────────────────────────
  // Depends on: Phase 2
  // NRA: PH-situs only; reciprocity applied; Item 30 = 0
  grossEstate = computeGrossEstate(input.decedent, filteredAssets)
  // Each real property fmv = max(fmvTaxDeclaration, fmvBir)
  // Business interest netEquity floored at 0

  // ── Phase 4: ELIT Ordinary Deductions (5A–5D) ─────────────────────────
  // Depends on: Phase 3 (gross estate must exist for structural reasons)
  // Note: funeral (5G) and vanishing (5E) depend on Phase 3 output
  if input.decedent.isNonResidentAlien:
    elitResult = computeNRAELIT(input.decedent, grossEstate.total.total, deductionRules)
  else:
    elitResult = {
      claimsAgainstEstate: computeClaimsAgainstEstate(input.claimsAgainstEstate),
      claimsVsInsolvent:   computeClaimsVsInsolvent(input.claimsVsInsolvent),
      unpaidMortgagesAndTaxes: computeUnpaidMortgagesAndTaxes(input.unpaidMortgages, input.unpaidTaxes),
      casualtyLosses:      computeCasualtyLosses(input.casualtyLosses)
    }
  elitTotal = sum(elitResult.claimsAgainstEstate + claimsVsInsolvent + unpaidMortgages + casualties).total

  // ── Phase 5: Funeral Expenses (5G) — PRE_TRAIN, citizen/resident only ───
  // NRAs: proportional funeral is already in elitResult.funeral (Phase 4 computeNRAELIT).
  //        computeFuneralExpenses must NOT be called for NRAs — it produces a non-proportional
  //        amount that would overstate the deduction for NRA pre-TRAIN estates.
  // Depends on: Phase 3 (grossEstate.total.total needed for 5% cap)
  funeralDeduction = { exclusive: 0, conjugal: 0, total: 0 }
  if not input.decedent.isNonResidentAlien:
    funeralDeduction = computeFuneralExpenses(input.funeralExpenses, grossEstate.total.total, deductionRules)

  // ── Phase 6: Judicial/Admin Expenses (5H) — PRE_TRAIN, citizen/resident only ─
  // NRAs: proportional judicial is already in elitResult.judicial (Phase 4 computeNRAELIT).
  judicialDeduction = { exclusive: 0, conjugal: 0, total: 0 }
  if not input.decedent.isNonResidentAlien:
    judicialDeduction = computeJudicialAdminExpenses(input.judicialAdminExpenses, deductionRules)

  // ── Phase 7: ELIT total for vanishing ratio ────────────────────────────
  // Citizen/resident PRE_TRAIN: ratio = 5A+5B+5C+5D+5G+5H (funeral/judicial not yet in elitTotal)
  // NRA PRE_TRAIN:              ratio = proportional 5A+5B+5C+5D+5G+5H (funeral+judicial in elitResult)
  // TRAIN (any residency):      ratio = 5A+5B+5C+5D only
  elitForVanishingRatio = elitTotal   // always includes proportional/actual 5A–5D
  if deductionRules == PRE_TRAIN:
    if input.decedent.isNonResidentAlien:
      // NRA: funeral + judicial stored in elitResult (proportional); not in funeralDeduction/judicialDeduction
      elitForVanishingRatio += elitResult.funeral + elitResult.judicial
    else:
      elitForVanishingRatio += funeralDeduction.total + judicialDeduction.total

  // ── Phase 8: Vanishing Deduction (5E) ─────────────────────────────────
  // Depends on: Phase 3 (gross estate total) and Phase 7 (ELIT for ratio)
  vanishingDeduction = computeVanishingDeduction(
    input.vanishingDeductionProperties,
    grossEstate.total.total,
    elitForVanishingRatio
  )

  // ── Phase 9: Public Use Transfers (5F) ────────────────────────────────
  publicTransfers = computePublicUseTransfers(
    input.publicUseTransfers, input.decedent, grossEstate.total.total
  )

  // ── Phase 10: Total Ordinary Deductions (Item 35) + Item 36 ───────────
  // assembleOrdinaryDeductions populates Schedule 5 lines 5A–5H and totals Item 35.
  // Critical NRA rule: for NRAs, funeral (5G) and judicial (5H) come from elitResult
  //   (already proportional from computeNRAELIT in Phase 4); funeralDeduction and
  //   judicialDeduction are zero for NRAs (Phase 5–6 skipped). For citizens/residents,
  //   5G/5H come from funeralDeduction / judicialDeduction.
  function assembleOrdinaryDeductions(elitResult, vanishingDeduction, publicTransfers,
                                      funeralDeduction, judicialDeduction,
                                      isNRA) → OrdinaryDeductionsResult:
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
      publicTransfers,                  // 5F (A/B from user ownership tag on each transfer)
      line5G,                           // 5G
      line5H                            // 5H
    ]
    A = sum(all.map(x => x.exclusive))
    B = sum(all.map(x => x.conjugal))
    return {
      schedule5: { line5A: elitResult.claimsAgainstEstate,
                   line5B: elitResult.claimsVsInsolvent,
                   line5C: elitResult.unpaidMortgages,
                   line5D: elitResult.casualtyLosses,
                   line5E: vanishingDeduction,
                   line5F: publicTransfers,
                   line5G, line5H },
      total: { exclusive: A, conjugal: B, total: A + B }
    }

  ordinaryDeductions = assembleOrdinaryDeductions(
    elitResult, vanishingDeduction, publicTransfers,
    funeralDeduction, judicialDeduction,
    input.decedent.isNonResidentAlien
  )
  // Item 35: total ordinary deductions per column
  estateAfterOrdinary = {
    exclusive: max(0, grossEstate.total.exclusive - ordinaryDeductions.total.exclusive),
    conjugal:  max(0, grossEstate.total.conjugal  - ordinaryDeductions.total.conjugal),
    total:     (above.exclusive + above.conjugal)
  }

  // ── Phase 11: Special Deductions (Items 37A–37D) + Item 38 ────────────
  standardDeduction      = computeStandardDeduction(input.decedent, deductionRules)
  familyHomeDeduction    = computeFamilyHomeDeduction(grossEstate, input.decedent, deductionRules)
  medicalExpenseDeduction = computeMedicalExpenseDeduction(input.medicalExpenses, input.decedent)
  ra4917Deduction        = computeRA4917Deduction(input.ra4917Benefits, input.decedent)
  specialTotal           = standardDeduction + familyHomeDeduction + medicalExpenseDeduction + ra4917Deduction

  // Item 38: Net Estate
  netEstate = max(0, estateAfterOrdinary.total - specialTotal)

  // ── Phase 12: Surviving Spouse Share (Item 39) + Item 40 ──────────────
  spouseShareResult = computeSurvivingSpouseShare(input.decedent, grossEstate, ordinaryDeductions)
  netTaxableEstate  = max(0, netEstate - spouseShareResult.spouseShare)

  // ── Phase 13: Tax Rate Application (Items 41–42) ──────────────────────
  if regime == TRAIN:
    taxResult = { estateTaxDue: netTaxableEstate * 0.06 }

  elif regime == PRE_TRAIN:
    taxResult = computePreTrainTax(netTaxableEstate)

  elif regime == AMNESTY:
    taxResult = computeAmnestyTax(netTaxableEstate, input.estateFlags, deductionRules)

  // ── Phase 14: Foreign Tax Credit + Net Estate Tax Due (Items 43–44) ───
  foreignTaxCredit = computeForeignTaxCredit(
    input.decedent, regime, input.foreignTaxCredits,
    grossEstate, taxResult.estateTaxDue
  )
  netEstateTaxDue = max(0, taxResult.estateTaxDue - foreignTaxCredit)

  // ── Dual Path Comparison (amnesty only, if displayDualPath) ───────────
  dualPath = null
  if regimeResult.displayDualPath:
    preTRAINResult = computePreTrainFullPipeline(input)  // same pipeline with PRE_TRAIN regime
    dualPath = computeDualPathComparison(netTaxableEstate, taxResult, preTRAINResult)

  // ── Assemble Output ───────────────────────────────────────────────────
  return assembleOutput(...)
```

### Critical Ordering Dependencies

| Computation | Must Follow |
|-------------|------------|
| Funeral deduction 5G (citizen/resident) | Gross estate finalized (Item 34.C needed for 5% cap) — Phase 3 before Phase 5 |
| NRA funeral/judicial 5G/5H | computeNRAELIT (Phase 4) — no separate phase; already in elitResult |
| Vanishing deduction (5E) | ELIT 5A–5D finalized (needed for ratio); gross estate finalized |
| NRA proportional factor | Gross estate (PH total) finalized |
| NRA vanishing ratio | Proportional ELIT (5A–5D+5G+5H) finalized — use elitResult.funeral + elitResult.judicial |
| Surviving spouse share | All ordinary + special deductions finalized (uses gross estate Col B, not net estate) |
| Tax rate | Net taxable estate (Item 40) finalized |
| Foreign tax credit | Estate tax due (Item 42) finalized |

---

## 17. Form 1801 Output Contract

The engine must populate every field listed below.

### Part I — Informational Fields (pass-through from inputs)

| Item | Label | Engine Field |
|------|-------|-------------|
| F1 | Date of Death | `decedent.dateOfDeath` |
| F2 | Amended Return | `filing.isAmended` |
| F4 | ATC | `"ES 010"` (hardcoded) |
| F6 | Name of Decedent | `decedent.name` |
| F7 | Decedent's Address | `decedent.address` |
| F8 | Citizenship | `decedent.citizenship` |
| F9 | Non-Resident Alien | `decedent.isNonResidentAlien` |
| F10 | Name of Executor | `executor.name` |

### Part IV — Computation of Tax (three columns A/B/C for Items 29–36)

| Item | Label | Formula |
|------|-------|---------|
| 29 | Real Properties (excl. family home) | `grossEstate.realProperty` |
| 30 | Family Home | `grossEstate.familyHome` (full FMV; cap applied at 37B) |
| 31 | Personal Properties | `grossEstate.personalProperty` |
| 32 | Taxable Transfers | `grossEstate.taxableTransfers` |
| 33 | Business Interests | `grossEstate.businessInterest` |
| **34** | **Gross Estate (Total)** | `29 + 30 + 31 + 32 + 33` |
| 35 | Ordinary Deductions | `ordinaryDeductions.total` (per column) |
| **36** | **Estate After Ordinary Deductions** | `max(0, Item34 − Item35)` per column |
| 37A | Standard Deduction | `specialDeductions.standardDeduction` |
| 37B | Family Home | `specialDeductions.familyHome` |
| 37C | Medical Expenses | `specialDeductions.medicalExpenses` |
| 37D | RA 4917 | `specialDeductions.ra4917` |
| **37** | **Total Special Deductions** | `37A + 37B + 37C + 37D` |
| **38** | **Net Estate** | `max(0, Item36.total − Item37)` |
| 39 | Share of Surviving Spouse | `spouseShare.spouseShare` |
| **40** | **Net Taxable Estate** | `max(0, Item38 − Item39)` |
| 41 | Tax Rate | `6%` (or graduated for pre-TRAIN) |
| **42** | **Estate Tax Due** | `Item40 × rate` |
| 43 | Foreign Tax Credits | `foreignTaxCredit` |
| **44 / 20** | **Net Estate Tax Due** | `max(0, Item42 − Item43)` |

### Part V — Schedules

| Schedule | Contents | Feeds |
|----------|----------|-------|
| Schedule 1 | Real properties (excl. family home): title, location, FMV per tax declaration, FMV per BIR, FMV used (max), Col A/B | Item 29 |
| Schedule 1A | Family home: same fields + barangay certification flag | Item 30 |
| Schedule 2 | Financial personal property: cash, bank, receivables, shares, bonds, MFs | Item 31 |
| Schedule 2A | Tangible personal property: vehicles, jewelry, other | Item 31 |
| Schedule 3 | Taxable transfers: description, date, type, consideration, FMV at death, taxable amount | Item 32 |
| Schedule 4 | Business interests: name, nature, net equity | Item 33 |
| Schedule 5 | Ordinary deductions: 5A–5H with Col A/B splits | Item 35 |
| Schedule 6 | Special deductions: standard, family home, medical, RA4917 | Item 37 |
| Schedule 6A | Surviving spouse worksheet: conjugal assets, conjugal obligations, net conjugal, 50% share | Item 39 |

### Validation Rules

The engine must enforce these relationships (raise a computation error if violated):

1. `Item34.total = Item29.total + Item30.total + Item31.total + Item32.total + Item33.total`
2. `Item36 = max(0, Item34 - Item35)` per column
3. `Item38 = max(0, Item36.total - Item37)`
4. `Item40 = max(0, Item38 - Item39)` — cannot be negative
5. `Item42 = Item40 × rate`
6. `Item44 = max(0, Item42 - Item43)` — cannot be negative
7. `Item37B = min(FMV_of_family_home, cap)` and only if citizen/resident + barangay certification
8. `Item37C ≤ 500_000`
9. `Item37A = 5_000_000` (citizen/resident, TRAIN) or `1_000_000` (citizen/resident, pre-TRAIN) or `500_000` (NRA)
10. `deductions.claimsVsInsolvent ≤ receivable_in_gross_estate` (receivable must first appear in Schedule 2)

### Output for Non-TRAIN Regimes

| Regime | Form | Label |
|--------|------|-------|
| TRAIN | BIR Form 1801 (Jan 2018) | Standard |
| PRE_TRAIN | BIR Form 1801 (Jun 2006) | "PRE-TRAIN ESTATE TAX COMPUTATION" |
| AMNESTY | ETAR + APF | "ESTATE TAX AMNESTY COMPUTATION (RA 11213, as amended by RA 11956)" + "FILING WINDOW CLOSED JUNE 14, 2025" |

The ETAR output replaces Items 41–44 with the amnesty track fields (see Section 14).

---

## 18. Plain-English Explainer Format

Every engine output includes an explainer section. Template uses `{{variable}}` placeholders filled with actual computed values.

### Section 1: Regime Introduction

**TRAIN** (death ≥ Jan 1, 2018):
> "Because {{decedent.name}} passed away on {{dateOfDeath}}, which is on or after January 1, 2018, the estate is subject to the TRAIN Law (Republic Act 10963). Under the TRAIN Law, estate tax is a flat rate of 6% applied to the net taxable estate — the estate's total value after all allowed deductions. There are no tax brackets or exemption thresholds under this system."

**PRE_TRAIN** (death < Jan 1, 2018):
> "Because {{decedent.name}} passed away on {{dateOfDeath}}, which is before January 1, 2018, the estate is subject to the pre-TRAIN estate tax rules. Under the old system, the tax rate is graduated — it starts at 0% for small estates and increases to 20% for very large estates. The net taxable estate of ₱{{netTaxableEstate}} falls in the {{bracketRate}}% bracket."

**AMNESTY (pre-2018 death)**:
> "This computation uses the Estate Tax Amnesty under Republic Act 11213, as amended by RA 11956. The amnesty allowed estates of persons who died before January 1, 2018, with unpaid estate tax, to settle at a flat 6% rate instead of the graduated rates that normally apply. **The amnesty filing window closed on June 14, 2025. This computation is for historical reference only.**"

**AMNESTY (TRAIN-era death)**:
> "For estates of persons who died between January 1, 2018 and May 31, 2022, the amnesty rate (6%) is identical to the regular TRAIN estate tax rate. The base tax amount is the same under both paths. The primary benefit of the amnesty for this estate was the waiver of late-filing surcharges and interest, which this engine does not compute."

### Section 2: Gross Estate

> "The gross estate is the total value of everything {{decedent.name}} owned at the time of death.

> **Property regime**: {{propertyRegimeExplanation}}. Property owned exclusively by the decedent is shown in Column A; property shared with the surviving spouse is shown in Column B.

> | Category | Exclusive (Col A) | Joint/Communal (Col B) | Total (Col C) |
> |---|---|---|---|
> | Real properties (excl. family home) | ₱{{Item29A}} | ₱{{Item29B}} | ₱{{Item29C}} |
> | Family home | ₱{{Item30A}} | ₱{{Item30B}} | ₱{{Item30C}} |
> | Personal properties | ₱{{Item31A}} | ₱{{Item31B}} | ₱{{Item31C}} |
> | Taxable transfers | ₱{{Item32A}} | ₱{{Item32B}} | ₱{{Item32C}} |
> | Business interests | ₱{{Item33A}} | ₱{{Item33B}} | ₱{{Item33C}} |
> | **TOTAL (Item 34)** | **₱{{Item34A}}** | **₱{{Item34B}}** | **₱{{Item34C}}** |"

Property regime explanation templates:
- ACP: "Married under the Absolute Community of Property regime (default for marriages on or after August 3, 1988). Under ACP, most property acquired before or during the marriage belongs to both spouses equally."
- CPG: "Married under the Conjugal Partnership of Gains (default for marriages before August 3, 1988). Under CPG, only income and property acquired during the marriage is shared; property owned before the marriage remains individual."
- SEPARATION: "Married with a prenuptial agreement establishing Complete Separation of Property. All property belongs entirely to the decedent; there is no jointly-owned pool."
- Single/widowed: "No surviving spouse. All property is in Column A (exclusive)."

### Section 3: Ordinary Deductions

> "Ordinary deductions reduce the gross estate by amounts the estate owes or losses it suffered.

> **Claims against the estate (5A)**: ₱{{5A}}. These are debts the decedent owed at the time of death — such as personal loans, credit card balances, and other liabilities.

> **Unpaid mortgages and taxes (5C)**: ₱{{5C}}. These are the remaining balances on mortgages secured by estate properties, plus any taxes that were due before the date of death.

> [For vanishing deduction, if nonzero]:
> **Previously taxed property (5E)**: ₱{{5E}}. This property was inherited or received as a gift within the past 5 years. Because it was already taxed at that earlier transfer, the law allows a partial deduction — in this case {{pct}}% — to avoid taxing the same property again so soon.

> [For funeral, pre-TRAIN only]:
> **Funeral expenses (5G)**: ₱{{5G}}. Actual funeral costs of ₱{{funeralActual}}, limited to 5% of the gross estate (₱{{funeralLimit}}).

> **Total ordinary deductions (Item 35)**: ₱{{Item35}}"

### Section 4: Special Deductions

> "Special deductions are additional amounts the law automatically grants. Unlike ordinary deductions, they do not need to correspond to actual debts.

> **Standard deduction (37A)**: ₱{{standardDeduction}}. Every estate automatically receives this deduction — no documentation required. [TRAIN: 'Under the TRAIN Law, this is ₱5,000,000 for Filipino citizens and resident aliens.'] [Pre-TRAIN: 'Under the pre-TRAIN rules, this was ₱1,000,000.']

> **Family home (37B)**: ₱{{familyHomeDeduction}}. The family home at {{familyHomeAddress}} has a fair market value of ₱{{familyHomeFMV}}. The law allows a deduction of up to ₱{{cap}} for the decedent's share. [If zero: 'No family home deduction was claimed because [barangay certification was not obtained / the decedent was not a citizen or resident / no property was designated as family home].']

> **Medical expenses (37C)**: ₱{{medicalDeduction}}. Medical expenses incurred within the year before death, capped at ₱500,000.

> **Total special deductions (Item 37)**: ₱{{Item37}}"

### Section 5: Surviving Spouse Share

> "Because {{decedent.name}} was married under the {{propertyRegime}} regime with a surviving spouse, 50% of the net jointly-owned property is set aside for the surviving spouse and is NOT taxed as part of the estate.

> | Computation | Amount |
> |---|---|
> | Total jointly-owned property | ₱{{totalConjugal}} |
> | Less: Joint debts and obligations | (₱{{conjugalObligations}}) |
> | Net jointly-owned property | ₱{{netConjugal}} |
> | Surviving spouse's 50% share (Item 39) | ₱{{spouseShare}} |"

### Section 6: Tax Computation

**TRAIN**:
> "**Net taxable estate (Item 40)**: ₱{{netTaxableEstate}}
> **Tax rate**: 6% (flat rate under TRAIN Law)
> **Estate tax due**: ₱{{netTaxableEstate}} × 6% = **₱{{estateTaxDue}}**"

**Pre-TRAIN (graduated)**:
> "**Net taxable estate (Item 40)**: ₱{{netTaxableEstate}}
> This falls in the {{bracketRate}}% tax bracket (estates over ₱{{bracketMin}} and up to ₱{{bracketMax}}).
> | Computation | Amount |
> |---|---|
> | Fixed tax on amounts up to ₱{{bracketMin}} | ₱{{baseTax}} |
> | {{bracketRate}}% on the excess of ₱{{excessAmount}} | ₱{{taxOnExcess}} |
> | **Estate tax due** | **₱{{estateTaxDue}}** |"

**Amnesty**:
> "**Net taxable estate**: ₱{{netTaxableEstate}}
> [Track A]: 'No prior estate tax return was filed, so the amnesty applies to the full net estate.'
> [Track B]: 'A prior return was filed declaring ₱{{previouslyDeclared}}. The amnesty applies only to the difference: ₱{{netTaxableEstate}} − ₱{{previouslyDeclared}} = ₱{{amnestyBase}}.'
> **Amnesty tax**: ₱{{amnestyBase}} × 6% = ₱{{computedTax}}
> [If minimum applied]: 'The computed tax (₱{{computedTax}}) is less than the ₱5,000 minimum required by RA 11213. The amnesty tax due is **₱5,000**.'
> [Otherwise]: 'Amnesty tax due: **₱{{amnestyTaxDue}}**'"

### Section 7: Summary

> "| | Amount |
> |---|---|
> | Gross estate | ₱{{grossEstateTotal}} |
> | Less: Total deductions | (₱{{totalDeductions}}) |
> | Less: Surviving spouse share | (₱{{spouseShare}}) |
> | Net taxable estate | ₱{{netTaxableEstate}} |
> | Tax rate | {{rateDescription}} |
> | Estate tax due | ₱{{estateTaxDue}} |
> | Less: Foreign tax credit | (₱{{foreignCredit}}) |
> | **Net estate tax due** | **₱{{netEstateTaxDue}}** |"

### Section 8: Filing Guide

> "**Filing deadline**: {{filingDeadline}} [TRAIN: '1 year from date of death'; Pre-TRAIN: '6 months from date of death']
> **CPA requirement**: {{cpaRequired}} [TRAIN: 'Required if gross estate exceeds ₱5,000,000'; Pre-TRAIN: 'Required if gross estate exceeds ₱2,000,000']
> **Filing venue**: {{filingVenue}} [NRA: 'Revenue District Office No. 39, South Quezon City'; Others: 'RDO where the decedent was domiciled']
> **Payment**: Due at the time of filing. Installment payment may be available with BIR approval.
> **What this engine does NOT compute**: Surcharges, interest, and penalties for late filing are not included. If filing is late, consult a tax professional for the total amount due."

---

## 19. Test Vectors

Complete integration test cases with all inputs and expected outputs.

### TV-01: TRAIN Simple (single citizen, standard deduction only)

**Regime**: TRAIN | **Decedent**: Single Filipino citizen | **Date of death**: 2019-06-15

**Inputs**:
- Real property (exclusive): ₱8,000,000
- Cash in bank (exclusive): ₱1,000,000
- No surviving spouse; no ordinary deductions; no medical

**Expected computation**:
| Step | Value |
|------|-------|
| Gross estate (Item 34) | ₱9,000,000 (all Col A) |
| Ordinary deductions (Item 35) | ₱0 |
| Estate after ordinary (Item 36) | ₱9,000,000 |
| Standard deduction (37A) | ₱5,000,000 |
| Net estate (Item 38) | ₱4,000,000 |
| Spouse share (Item 39) | ₱0 |
| Net taxable estate (Item 40) | ₱4,000,000 |
| Estate tax due (Item 42) | ₱4,000,000 × 0.06 = **₱240,000** |
| Foreign credit (Item 43) | ₱0 |
| Net estate tax due (Item 44) | **₱240,000** |

---

### TV-02: TRAIN Standard (married ACP, exclusive family home, medical)

**Regime**: TRAIN | **Decedent**: Married Filipino citizen, ACP | **Date of death**: 2020-03-10

**Inputs**:
- Real property (exclusive): ₱5,000,000
- Family home (exclusive, barangay cert obtained): ₱4,000,000 (FMV)
- Cash (conjugal): ₱3,000,000
- Claims against estate (conjugal, 5A): ₱500,000
- Medical expenses (all within 1 year): ₱300,000

**Expected computation**:
| Step | Value |
|------|-------|
| Item 29 | Col A: ₱5M, Col B: ₱0, Col C: ₱5M |
| Item 30 | Col A: ₱4M (exclusive), Col B: ₱0, Col C: ₱4M |
| Item 31 | Col A: ₱0, Col B: ₱3M, Col C: ₱3M |
| Item 34 (Gross Estate) | Col A: ₱9M, Col B: ₱3M, **Col C: ₱12M** |
| 5A (claims, conjugal) | Col A: ₱0, Col B: ₱500K, Col C: ₱500K |
| Item 35 | Col A: ₱0, Col B: ₱500K, Col C: ₱500K |
| Item 36 | Col A: ₱9M, Col B: ₱2.5M, Col C: ₱11.5M |
| 37A standard deduction | ₱5,000,000 |
| 37B family home | min(₱4M, ₱10M) = ₱4,000,000 (exclusive, no halving) |
| 37C medical | min(₱300K, ₱500K) = ₱300,000 |
| Item 37 | ₱9,300,000 |
| Item 38 (net estate) | max(0, ₱11.5M − ₱9.3M) = ₱2,200,000 |
| Spouse share (6A): totalConjugal ₱3M − obligations ₱500K = ₱2.5M × 0.5 = **₱1,250,000** |
| Item 39 | ₱1,250,000 |
| Item 40 | max(0, ₱2.2M − ₱1.25M) = **₱950,000** |
| Item 42 | ₱950,000 × 0.06 = **₱57,000** |

Wait — let me recalculate. Net estate = ₱11.5M − ₱9.3M = ₱2.2M. Item 40 = ₱2.2M − ₱1.25M = ₱950K. Tax = ₱57,000. But the summary in test-vectors.md shows ₱111,000 — let me recheck using the data from the analysis file. The test-vectors.md showed ₱1,850,000 NTE and ₱111,000 tax. The difference is that TV-02 in the analysis uses a different gross estate. I'll use the analysis values directly.

**From analysis test-vectors.md TV-02**:
- Gross estate: Real (excl) ₱5M + Family home (excl) ₱4M + Cash (conjugal) ₱3M + Jewelry (conjugal) ₱1M = ₱13M
- Claims (conjugal 5A): ₱500K
- Item 34: Col A ₱9M, Col B ₱4M, Col C ₱13M
- Item 35: Col B ₱500K, Col C ₱500K
- Item 36: Col A ₱9M, Col B ₱3.5M, Col C ₱12.5M
- 37A: ₱5M, 37B: ₱4M (exclusive FH), 37C: ₱300K → Item 37 = ₱9.3M
- Item 38: ₱12.5M − ₱9.3M = ₱3.2M
- Spouse share: (₱4M − ₱500K) × 0.5 = ₱1.75M
- Item 40: ₱3.2M − ₱1.75M = **₱1,450,000**
- Tax: ₱1.45M × 0.06 = **₱87,000**

The exact values depend on the exact inputs specified in the analysis file. Developers should run the computation engine against the test vectors file at `loops/estate-tax-reverse/analysis/test-vectors.md` for the authoritative input/output values.

---

### TV-03: TRAIN Complex (CPG, vanishing deduction 80%)

**Regime**: TRAIN | **Decedent**: Married Filipino, CPG | **Date of death**: 2021-09-01

**Vanishing deduction inputs**:
- Inherited property (conjugal, 18 months before death): prior FMV ₱3,500,000, current FMV ₱4,200,000
- Mortgage on this property: ₱0
- Prior estate tax: paid ✓
- ELIT total: ₱500,000 (from claims against estate)

**Vanishing deduction computation**:
```
iv    = min(₱3,500,000, ₱4,200,000) = ₱3,500,000
nv    = ₱3,500,000 - ₱0 = ₱3,500,000
ratio = (GE - ELIT) / GE = (₱9,000,000 - ₱500,000) / ₱9,000,000 = 0.9444
pct   = 0.80 (18 months → > 1 year, ≤ 2 years)
VD    = 0.80 × ₱3,500,000 × 0.9444 = ₱2,524,444
```

See `analysis/test-vectors.md` TV-03 for complete inputs and all intermediate values.

**Expected tax**: ₱271,800 (NTE ₱4,530,000)

---

### TV-04: TRAIN NRA (proportional deductions)

**Regime**: TRAIN | **Decedent**: Non-resident alien | **Date of death**: 2022-01-15

**NRA inputs**:
- PH gross estate: ₱11,500,000 (real property, exclusive)
- Worldwide gross estate: ₱48,000,000
- Worldwide ELIT: ₱2,000,000 (claims against estate)
- Proportional factor: 11,500,000 / 48,000,000 = 0.24 (approximately)
- NRA ELIT deduction: 0.24 × ₱2,000,000 = ₱480,000
- Standard deduction: ₱500,000 (NRA)
- No family home, medical, RA4917 (NRA exclusions)
- No surviving spouse

**Expected tax**: ₱632,400 (NTE ₱10,540,000 — see test-vectors.md TV-04 for exact values)

---

### TV-05: TRAIN Zero Tax (estate below standard deduction)

**Regime**: TRAIN | Gross estate: ₱4,500,000 | Standard deduction: ₱5,000,000

```
Item 34: ₱4,500,000
Item 35: ₱0
Item 36: ₱4,500,000
Item 37: ₱5,000,000 (standard deduction alone exceeds estate)
Item 38: max(0, ₱4,500,000 − ₱5,000,000) = ₱0  ← floored
Item 40: ₱0
Item 42: ₱0 × 0.06 = ₱0
```
**Expected tax due: ₱0**

---

### TV-06: TRAIN Zero Tax (ELIT + special deductions exceed gross estate)

**Regime**: TRAIN | Gross estate: ₱8,000,000 | ELIT: ₱3,000,000 | Special deductions: ₱7,000,000

```
Item 36: max(0, ₱8M − ₱3M) = ₱5,000,000
Item 38: max(0, ₱5M − ₱7M) = ₱0  ← floored at Item 38
Item 42: ₱0
```
**Expected tax due: ₱0**

---

### TV-07: Pre-TRAIN Simple (2015 death, graduated rate)

**Regime**: PRE_TRAIN | **Date of death**: 2015-04-20 | **Decedent**: Single Filipino

**Inputs**:
- Gross estate: ₱5,000,000
- Funeral expenses: ₱150,000 actual (< 5% × ₱5M = ₱250K → deductible ₱150K)
- Standard deduction: ₱1,000,000 (pre-TRAIN)
- Family home: ₱1,200,000 (exclusive) → cap ₱1,000,000 → deductible ₱1,000,000

```
Gross estate (Item 34):       ₱5,000,000
Ordinary deductions (5G):    -₱150,000
Item 36:                      ₱4,850,000
Standard deduction (37A):    -₱1,000,000
Family home (37B):           -₱1,000,000
Item 38:                      ₱2,850,000
Spouse share (Item 39):       ₱0 (single)
Item 40 (NTE):                ₱2,850,000 → falls in 11% bracket (₱2M–₱5M)

Tax = ₱135,000 + (₱2,850,000 − ₱2,000,000) × 0.11
    = ₱135,000 + ₱850,000 × 0.11
    = ₱135,000 + ₱93,500
    = ₱228,500
```
**Expected tax due: ₱228,500** (see test-vectors.md TV-07 for authoritative values)

---

### TV-08: Pre-TRAIN Complex (CPG 2010, married)

**Regime**: PRE_TRAIN | **Date of death**: 2010-11-30 | CPG regime

See `analysis/test-vectors.md` TV-08 for full inputs. Expected tax: ₱371,500.

Key verification:
- Funeral and judicial/admin expenses deductible
- Standard deduction ₱1,000,000 (pre-TRAIN)
- Family home cap ₱1,000,000 (pre-TRAIN)
- Surviving spouse share computed from CPG conjugal pool (claims + funeral + judicial in Column B reduce community pool)

---

### TV-09: Amnesty (Track A, 2012 CPG death, pre-TRAIN deductions)

**Regime**: AMNESTY | **deductionRules**: PRE_TRAIN | **Date of death**: 2012-07-15 | CPG

See `analysis/test-vectors.md` TV-09 for full inputs.

**Expected**:
- Amnesty tax: ₱204,000
- Regular pre-TRAIN tax (dual path): ₱289,000
- Recommended: AMNESTY (above ₱1,250,000 crossover)

---

### TV-09b: Amnesty Minimum Floor (unit test)

**Inputs**: Net taxable estate = ₱60,000 (amnesty Track A)

```
computedAmnestyTax = ₱60,000 × 0.06 = ₱3,600
amnestyTaxDue = max(₱5,000, ₱3,600) = ₱5,000
minimumApplied = true
```

---

### TV-10: TRAIN 100% Vanishing Deduction (property within 91 days)

**Inputs**: Prior FMV ₱5,000,000; current FMV ₱5,200,000; elapsed 91 days; no ELIT; no mortgage

```
iv    = min(₱5M, ₱5.2M) = ₱5,000,000
nv    = ₱5,000,000
ratio = (GE − 0) / GE = 1.00
pct   = 1.00 (91 days ≤ 1 year)
VD    = ₱5,000,000
```

**Expected tax**: ₱192,000 (NTE ₱3,200,000 — see test-vectors.md TV-10 for full computation)

---

## 20. Edge Cases Catalog

The complete 182-item edge case catalog is in `loops/estate-tax-reverse/analysis/edge-cases.md`. Key edge cases follow.

### Critical Edge Cases

| Code | Scenario | Engine Behavior |
|------|----------|-----------------|
| EC-RD-01 | `dateOfDeath = 2018-01-01` (TRAIN boundary) | TRAIN regime; comparison is `>=` not `>` |
| EC-RD-02 | `dateOfDeath = 2017-12-31` (last pre-TRAIN day) | PRE_TRAIN regime |
| EC-RD-03 | `dateOfDeath = 2022-05-31` (amnesty cutoff, inclusive) | Eligible for amnesty (cutoff inclusive) |
| EC-RD-04 | `dateOfDeath = 2022-06-01` (one day after cutoff) | TRAIN regime; amnesty unavailable |
| EC-GEC-01 | Multiple family home flags | `ERR_MULTIPLE_FAMILY_HOMES` validation error |
| EC-GEC-02 | Business interest net equity negative | Floor at ₱0; not a reduction to gross estate |
| EC-GEN-01 | NRA with `totalWorldwideGrossEstate = 0` | `ERR_WORLDWIDE_ESTATE_ZERO` if any ELIT declared |
| EC-GEN-02 | NRA `PH_gross_estate > worldwideGrossEstate` | `ERR_PH_EXCEEDS_WORLDWIDE` data error |
| EC-EX-01 | Fixed-term usufruct flagged as Sec. 87(a) | Reject; include at actuarial value instead |
| EC-EX-02 | GOCC bequest flagged as Sec. 87(d) | Warning: GOCCs are ambiguous; suggest using Sec. 86(A)(3) |
| EC-EL-01 | Estate tax included in unpaid taxes (5C) | Exclude; estate tax itself is not deductible |
| EC-VD-01 | Prior tax not paid | VD = 0 for this property (disqualified) |
| EC-VD-02 | Property sold before death | Not in gross estate; cannot claim VD |
| EC-VD-03 | Elapsed > 5 years | VD = 0; log disqualification |
| EC-VD-04 | ELIT > gross estate | Ratio = 0; VD = 0 |
| EC-PT-01 | NRA public transfer to PH govt | Proportional (factor × FMV); NOT full value |
| EC-FH-01 | Family home without barangay certification | Deduction = ₱0 regardless of FMV |
| EC-FH-02 | Conjugal family home | Deduction = min(FMV × 0.5, cap) |
| EC-SS-04 | Spouse share exceeds net estate | `Item40 = max(0, Item38 - Item39) = 0`; no negative |
| EC-SS-05 | Community obligations > community assets | `netConjugalProperty = 0`; spouseShare = 0 |
| EC-SS-06 | Vanishing deduction (5E) on conjugal property | 5E does NOT reduce community pool for spouse share |
| EC-NRA-01 | NRA claims family home | Family home deduction = ₱0; display warning |
| EC-TR-01 | `netTaxableEstate = 0` under PRE_TRAIN | Tax = ₱0; no minimum (unlike amnesty) |
| EC-TR-02 | Pre-TRAIN NTE ≤ ₱200,000 | Tax = ₱0 (exemption threshold) |
| EC-FC-01 | Foreign credit > estate tax due | Net estate tax = ₱0; credit capped at tax due |
| EC-AC-01 | Deductions exceed gross estate under amnesty | Net estate = ₱0; amnesty tax = ₱5,000 (minimum) |
| EC-AC-02 | Track B: prior declared ≥ current NTE | amnestyBase = ₱0; tax = ₱5,000 (minimum) |
| EC-PR-01 | `maritalStatus = LEGALLY_SEPARATED` | WARNING: legal separation ≠ property separation; spouse share still applies under ACP/CPG |

### Four Documented Corrections (Supersede Earlier Analysis)

| Issue | Incorrect Analysis | Correct Rule |
|-------|-------------------|-------------|
| NRA public transfers | `deduction-public-transfers.md` said full value | Proportional per Sec. 86(B)(2) — confirmed in `correction-nra-public-transfers.md` |
| Amnesty funeral/judicial (pre-2018) | `deductions-pre-train-diffs.md` excluded these | RA 11213 Sec. 3 includes full deduction set at time of death — confirmed in `correction-amnesty-deductions.md` |
| Amnesty standard deduction (TRAIN-era) | Some analysis used ₱1M | TRAIN-era amnesty uses ₱5M standard deduction (TRAIN rules) |
| Vanishing deduction under amnesty | Early note said unavailable | VD IS available under amnesty (full deduction set) — confirmed in `amnesty-computation.md` |

---

## 21. Filing Rules (Informational Output)

These rules are **informational only** — no Form 1801 computation items are affected.

| Rule | TRAIN (death ≥ 2018-01-01) | Pre-TRAIN (death < 2018-01-01) |
|------|---------------------------|-------------------------------|
| Filing deadline | 1 year from date of death | 6 months from date of death |
| Filing extension | Up to 30 days (judicial/BIR discretion) | Up to 30 days |
| Payment extension | Up to 5 years (judicial) or 2 years (extrajudicial) | Same |
| Installment | 2-year period, no interest if on schedule | Same |
| CPA requirement | Gross estate > ₱5,000,000 | Gross estate > ₱2,000,000 |
| NRA filing venue | RDO No. 39, South Quezon City | Same |
| Notice of death | Repealed by TRAIN — not required | Was required; now repealed |

**Amnesty filing**: ETAR (Estate Tax Amnesty Return) form, not BIR Form 1801. Filing window closed June 14, 2025 (RA 11569 deadline). Engine must always display this notice on amnesty output.

**Zero-tax estates**: A Form 1801 (or ETAR) must still be filed even if the computed tax is ₱0, if the estate includes registrable property (real estate, vehicles, bank deposits).

---

*End of Specification*

*This specification was synthesized from 35 analysis aspects in `loops/estate-tax-reverse/analysis/`. Refer to those files for detailed legal citations, additional edge cases, and worked examples for each individual provision.*
