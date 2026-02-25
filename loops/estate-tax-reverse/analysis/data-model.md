# Analysis: Data Model — Complete Entity and Type Definitions

**Aspect**: data-model
**Wave**: 5 — Synthesis
**Date Analyzed**: 2026-02-25
**Depends On**: ALL Wave 1–4 analysis files; regime-detection.md; computation-pipeline.md

---

## Purpose

This document defines every type, enum, and interface the engine uses — from raw user input through every intermediate computation value to the final Form 1801 output. It supports all three tax regimes (TRAIN, PRE_TRAIN, AMNESTY). A developer can implement the full data layer from this document alone, without reading any other analysis file.

Types are written in pseudocode notation. Implement in any typed language (TypeScript, Python dataclasses, Go structs, Kotlin data classes, etc.).

---

## 1. Primitive Aliases

```pseudocode
// All monetary values are in Philippine Pesos (₱), represented as 64-bit floats or
// currency-safe integers (e.g., integer centavos / 100). Never use 32-bit float.
type Pesos = number        // ₱ amount; always ≥ 0 unless explicitly noted

// Dates are ISO 8601 strings "YYYY-MM-DD" or an equivalent Date object.
type IsoDate = string      // e.g., "2018-01-01"

// Decimal rate — percentages expressed as decimals (6% → 0.06)
type Rate = number         // 0.0 to 1.0
```

---

## 2. Enums

### 2.1 Regime

```pseudocode
enum Regime:
  TRAIN      // death on/after 2018-01-01; flat 6% on net taxable estate
  PRE_TRAIN  // death before 2018-01-01; graduated 5%–20% per bracket
  AMNESTY    // RA 11213/11569/11956; flat 6% on amnesty base; minimum ₱5,000
```

### 2.2 DeductionRules

```pseudocode
enum DeductionRules:
  TRAIN      // Standard ₱5M; family home cap ₱10M; no funeral/judicial
  PRE_TRAIN  // Standard ₱1M; family home cap ₱1M; funeral + judicial deductible
```

*Note*: `DeductionRules` is always derived from `dateOfDeath`, regardless of `Regime`.
Deaths on/after 2018-01-01 → `TRAIN`. Deaths before 2018-01-01 → `PRE_TRAIN`.
Under amnesty, these two flags are independent (e.g., `regime = AMNESTY` with `deductionRules = PRE_TRAIN` is valid for pre-2018 amnesty deaths).

### 2.3 AmnestyTrack

```pseudocode
enum AmnestyTrack:
  TRACK_A  // No prior estate tax return filed; 6% × full net taxable estate
  TRACK_B  // Prior return filed; 6% × max(0, total net estate − previously declared net estate)
```

### 2.4 PropertyRegime

```pseudocode
enum PropertyRegime:
  ACP         // Absolute Community of Property — default for marriages on/after Aug 3, 1988
  CPG         // Conjugal Partnership of Gains — default for marriages before Aug 3, 1988
  SEPARATION  // Complete Separation of Property by prenuptial agreement
  NONE        // No regime (single, widowed, legally separated) — no conjugal pool
```

### 2.5 Ownership

```pseudocode
enum Ownership:
  EXCLUSIVE  // Decedent's separate property → Column A (Form 1801)
  CONJUGAL   // Shared with spouse; community/conjugal pool → Column B (Form 1801)
```

*Note*: Under `SEPARATION` or `NONE` regime, all assets are `EXCLUSIVE`. Under `ACP`/`CPG`, user tags each asset. The engine does not auto-classify ownership — it accepts the user's tag.

### 2.6 MaritalStatus

```pseudocode
enum MaritalStatus:
  SINGLE               // Never married
  MARRIED              // Has living spouse at time of death
  WIDOWED              // Spouse predeceased
  LEGALLY_SEPARATED    // Legally separated (no conjugal pool; all exclusive)
```

### 2.7 RealPropertyLocation

```pseudocode
enum RealPropertyLocation:
  PH       // Situated in the Philippines — use max(fmvBir, fmvTaxDeclaration) rule
  FOREIGN  // Outside Philippines — use single user-provided FMV
```

### 2.8 PersonalPropertyFinancialSubtype

```pseudocode
enum PersonalPropertyFinancialSubtype:
  CASH_ON_HAND       // Physical cash; valued at face amount
  CASH_IN_BANK       // Bank deposits; valued at balance at date of death
  ACCOUNTS_RECEIVABLE // Trade/business receivables; valued at face (if collectible)
  NOTES_RECEIVABLE   // Promissory notes; valued at face
  SHARES_LISTED      // Shares of stock listed on PSE or foreign exchange; valued at closing price on date of death
  SHARES_UNLISTED    // Shares not publicly traded; valued at book value per share
  BONDS              // Government and corporate bonds; valued at FMV at date of death
  MUTUAL_FUNDS       // UITF/mutual fund units; valued at NAV per unit at date of death
  OTHER_FINANCIAL    // Any other financial instrument; user-provided FMV
```

### 2.9 PersonalPropertyTangibleSubtype

```pseudocode
enum PersonalPropertyTangibleSubtype:
  MOTOR_VEHICLE   // Cars, motorcycles, boats; user-provided FMV
  JEWELRY         // All jewelry; user-provided FMV
  OTHER_TANGIBLE  // Furniture, artwork, collectibles, etc.; user-provided FMV
```

### 2.10 TaxableTransferType

```pseudocode
enum TaxableTransferType:
  // Sec. 85(B): Transfer made in contemplation of death
  // Legal transfer during lifetime but motivated by death; 3-year presumption applies
  CONTEMPLATION_OF_DEATH

  // Sec. 85(C): Revocable transfer — decedent retained power to alter/revoke/terminate
  // OR relinquished that power within 3 years before death
  REVOCABLE_TRANSFER

  // Sec. 85(D): Property subject to a General Power of Appointment exercised by the decedent
  // Always includable if exercised by will; also includable if exercised by deed within 3 years of death
  GENERAL_POWER_OF_APPOINTMENT

  // Sec. 85(E): Life insurance on decedent's own life where proceeds are payable to the estate
  // OR to a revocably designated beneficiary
  LIFE_INSURANCE_ESTATE_OR_REVOCABLE

  // Sec. 85(G): Transfer for insufficient consideration
  // Only the EXCESS of FMV at death over the consideration received is included
  INSUFFICIENT_CONSIDERATION
```

### 2.11 BusinessType

```pseudocode
enum BusinessType:
  SOLE_PROPRIETORSHIP  // Individual business; net equity = total assets − total liabilities
  PARTNERSHIP          // Partnership interest; same net equity computation
```

### 2.12 AmnestyIneligibilityReason

```pseudocode
enum AmnestyIneligibilityReason:
  USER_NOT_ELECTED             // User did not request amnesty path
  DEATH_AFTER_COVERAGE_CUTOFF  // dateOfDeath > 2022-05-31
  TAX_ALREADY_PAID             // Estate tax already fully settled before May 2022
  PCGG_EXCLUSION               // Decedent under PCGG jurisdiction (RA 11213 Sec. 9)
  RA3019_EXCLUSION             // Pending Anti-Graft violations
  RA9160_EXCLUSION             // Pending Anti-Money Laundering violations
  PENDING_COURT_CASE_EXCLUSION // Court case filed before Feb 14, 2019 (RA 11213 enactment)
  UNEXPLAINED_WEALTH_EXCLUSION // Pending RA 1379 unexplained wealth proceedings
  RPC_FELONY_EXCLUSION         // Pending Revised Penal Code felony cases
```

### 2.13 ValidationErrorCode

```pseudocode
enum ValidationErrorCode:
  // Regime detection errors
  ERR_DATE_REQUIRED               // dateOfDeath is null or missing
  ERR_DATE_FUTURE                 // dateOfDeath is after today
  ERR_DATE_IMPLAUSIBLE            // dateOfDeath is before 1901-01-01
  ERR_TRACK_B_MISSING_INPUT       // priorReturnFiled = true but previouslyDeclaredNetEstate missing
  ERR_PRIOR_DECLARED_NEGATIVE     // previouslyDeclaredNetEstate < 0

  // Asset validation errors
  ERR_FMV_MISSING                 // Required FMV field is missing or null
  ERR_FMV_NEGATIVE                // FMV is negative (must be ≥ 0)
  ERR_MULTIPLE_FAMILY_HOMES       // More than one asset has isDesignatedFamilyHome = true
  ERR_FOREIGN_PROPERTY_EXCEEDS_GE // foreignPropertyValue > total gross estate (credit computation)
  ERR_FAMILY_HOME_NRA             // NRA decedent: family home deduction not available; asset flagged
  ERR_BUSINESS_EQUITY_NEGATIVE    // User explicitly entered negative netEquity; inform that floor is 0

  // Deduction validation errors
  ERR_FUNERAL_NOT_DEDUCTIBLE      // Funeral expenses input on TRAIN-era estate (deductionRules = TRAIN)
  ERR_JUDICIAL_NOT_DEDUCTIBLE     // Judicial/admin expenses input on TRAIN-era estate
  ERR_INSOLVENT_NOT_IN_GE         // 5B claim not cross-referenced to a gross estate asset
  ERR_MEDICAL_TIMING              // medicalPaidWithin1Year = false; deduction disallowed
  ERR_VANISHING_PRIOR_TAX_UNPAID  // vanishingProperty.priorTaxPaid = false; VD disqualified
  ERR_VANISHING_NOT_IN_GE         // Vanishing deduction property not identifiable in gross estate
  ERR_PUBLIC_USE_NRA_NOT_PH_SITUS // Public use transfer by NRA: property not PH-situs
  ERR_ESTATE_TAX_IN_UNPAID_TAXES  // User listed estate tax itself as unpaid tax (disallowed)

  // Property regime errors
  ERR_CONJUGAL_WITH_NONE_REGIME   // Asset tagged CONJUGAL but maritalStatus is SINGLE/WIDOWED/SEPARATED
  ERR_FAMILY_HOME_NO_RESIDENCE    // isDesignatedFamilyHome = true but isActualResidence = false
```

---

## 3. Input Types

### 3.1 Decedent

The decedent is the person who died. This is the primary subject of the estate tax computation.

```pseudocode
type Decedent:
  // ── Identity ──────────────────────────────────────────────────────────────
  name:                     string          // Full legal name (for Form 1801 header)
  tin:                      string?         // BIR Tax Identification Number (optional; for form)
  dateOfBirth:              IsoDate?        // Optional; not needed for tax computation
  dateOfDeath:              IsoDate         // REQUIRED — primary computation input; YYYY-MM-DD

  // ── Taxpayer Status ───────────────────────────────────────────────────────
  isNonResidentAlien:       boolean         // true = NRA; false = citizen or resident alien
                                            // NRA: PH-situs assets only; proportional deductions; no family home; no foreign tax credit
  reciprocityExemptionApplies: boolean      // NRA only: true = PH intangible personal property excluded (Sec. 104)
                                            // Requires user-declared bilateral reciprocity with decedent's home country
  totalWorldwideGrossEstate: Pesos          // NRA only: user-provided total worldwide gross estate
                                            // Used as denominator in Sec. 86(B) proportional deduction formula
                                            // If NRA only has PH property (no foreign assets), set to = phGrossEstate

  // ── Marital Status ────────────────────────────────────────────────────────
  maritalStatus:            MaritalStatus   // SINGLE | MARRIED | WIDOWED | LEGALLY_SEPARATED
  propertyRegime:           PropertyRegime  // ACP | CPG | SEPARATION | NONE
                                            // NONE if maritalStatus ≠ MARRIED
  marriageDate:             IsoDate?        // Optional but recommended for CPG vs. ACP guidance
                                            // Engine uses Aug 3, 1988 as Family Code boundary for UI hints
                                            // If missing, engine displays UI guidance on regime selection
```

**Validation rules**:
- `dateOfDeath` is required (ERR_DATE_REQUIRED)
- `dateOfDeath` must not be in the future (ERR_DATE_FUTURE)
- `dateOfDeath` must be on or after 1901-01-01 (ERR_DATE_IMPLAUSIBLE)
- If `maritalStatus != MARRIED`: `propertyRegime` must be `NONE`
- If `maritalStatus == MARRIED`: `propertyRegime` must be `ACP`, `CPG`, or `SEPARATION`
- If `isNonResidentAlien == false`: `totalWorldwideGrossEstate` is unused (ignore)
- If `isNonResidentAlien == true`: `totalWorldwideGrossEstate` must be ≥ 0 (can equal PH gross estate if no foreign assets)

---

### 3.2 Estate Flags

Control flags for regime detection, amnesty eligibility, and Track A/B selection.

```pseudocode
type EstateFlags:
  // ── Amnesty Inputs ────────────────────────────────────────────────────────
  userElectsAmnesty:               boolean  // User explicitly requests amnesty path (default: false)
                                            // Engine never auto-selects amnesty; always user-elected

  taxFullyPaidBeforeMay2022:       boolean  // true = estate tax was fully settled before the amnesty period
                                            // A fully paid estate is ineligible for amnesty
                                            // Only relevant if dateOfDeath ≤ 2022-05-31

  priorReturnFiled:                boolean  // true = a BIR estate tax return was previously filed for this estate
                                            // Determines TRACK_A (no prior return) vs. TRACK_B (prior return filed)
                                            // Only relevant if userElectsAmnesty = true

  previouslyDeclaredNetEstate:     Pesos?   // Net estate as declared on the prior estate tax return
                                            // Required if priorReturnFiled = true (Track B)
                                            // Track B amnesty base = max(0, currentNetEstate − previouslyDeclaredNetEstate)

  // ── Amnesty Eligibility Exclusions (RA 11213 Sec. 9) ──────────────────────
  // All default to false. Only displayed to user when userElectsAmnesty = true.
  subjectToPCGGJurisdiction:       boolean  // Decedent's assets subject to PCGG authority
  hasRA3019Violations:             boolean  // Pending Anti-Graft and Corrupt Practices Act (RA 3019) violations
  hasRA9160Violations:             boolean  // Pending Anti-Money Laundering Act (RA 9160) violations
  hasPendingCourtCasePreAmnestyAct: boolean // Court case against estate filed before Feb 14, 2019
  hasUnexplainedWealthCases:       boolean  // Pending unexplained wealth proceedings (RA 1379)
  hasPendingRPCFelonies:           boolean  // Pending Revised Penal Code felony cases
```

---

### 3.3 Asset Types

#### 3.3.1 RealPropertyAsset

Reported in Schedule 1 (Item 29) or Schedule 1A (Item 30 — family home only).

```pseudocode
type RealPropertyAsset:
  id:                     string       // Unique identifier within this estate
  description:            string       // Property description (e.g., "Lot 5, Block 3, Makati")
  location:               RealPropertyLocation  // PH | FOREIGN
  ownership:              Ownership    // EXCLUSIVE | CONJUGAL

  // ── Valuation (PH Property) ───────────────────────────────────────────────
  fmvBir:                 Pesos?       // BIR zonal value — user provides; PH property only
  fmvTaxDeclaration:      Pesos?       // Assessed value from tax declaration — user provides; PH property only
  // Engine computes: fmv = max(fmvBir, fmvTaxDeclaration) for PH property
  // Both fmvBir and fmvTaxDeclaration are required for PH property

  // ── Valuation (Foreign Property) ─────────────────────────────────────────
  fmvForeign:             Pesos?       // User-provided FMV for foreign real property (already converted to PHP)
  // For foreign property, fmv = fmvForeign directly (no two-column rule)

  // ── Family Home Flag ──────────────────────────────────────────────────────
  isDesignatedFamilyHome: boolean      // true = report in Schedule 1A (Item 30), not Schedule 1 (Item 29)
                                       // Only ONE property may have this flag = true (engine validates)
                                       // Only citizens/residents may designate a family home (NRA → false)
  isActualResidence:      boolean      // true = decedent actually resided in this property at time of death
                                       // Required for family home deduction (isDesignatedFamilyHome must = isActualResidence = true)
  hasBrgyyCertification:  boolean      // true = barangay certification of family home status available
                                       // Required documentation for deduction; engine generates warning if false

  // ── Sec. 87 Exclusions ────────────────────────────────────────────────────
  isExemptSec87:          boolean      // true = pre-computation exclusion applies (merger of usufruct, etc.)
                                       // If true, this asset is removed before populating gross estate schedules
  sec87Basis:             string?      // Which Sec. 87 subsection: "(a)" | "(b)" | "(c)" | "(d)" (optional, informational)
```

**Engine FMV computation rule** (applied internally, not stored on input):
```pseudocode
function computeRealPropertyFmv(asset: RealPropertyAsset): Pesos:
  if asset.isExemptSec87:
    return 0   // excluded before gross estate; not added to any schedule
  if asset.location == PH:
    return max(asset.fmvBir ?? 0, asset.fmvTaxDeclaration ?? 0)
  else:
    return asset.fmvForeign ?? 0
```

#### 3.3.2 PersonalPropertyFinancialAsset

Reported in Schedule 2 (Item 31 — financial personal property).

```pseudocode
type PersonalPropertyFinancialAsset:
  id:                     string
  description:            string       // e.g., "BPI Savings Account #1234"
  subtype:                PersonalPropertyFinancialSubtype
  fmv:                    Pesos        // User-provided at valuation basis for subtype:
                                       //   CASH_ON_HAND: face value
                                       //   CASH_IN_BANK: balance at date of death
                                       //   ACCOUNTS_RECEIVABLE: face value (if collectible)
                                       //   NOTES_RECEIVABLE: face value
                                       //   SHARES_LISTED: closing market price × shares owned
                                       //   SHARES_UNLISTED: book value per share × shares owned
                                       //   BONDS/MUTUAL_FUNDS: market price / NAV at date of death
                                       //   OTHER_FINANCIAL: user-provided FMV
  ownership:              Ownership
  isCrossReferencedToInsolvency: boolean  // true = this is a receivable from an insolvent debtor
                                          // Must be cross-referenced to a ClaimVsInsolventPerson
                                          // (asset stays in gross estate; deducted at Schedule 5B)
  isExemptSec87:          boolean      // Sec. 87 pre-computation exclusion
```

#### 3.3.3 PersonalPropertyTangibleAsset

Reported in Schedule 2A (Item 31 — tangible personal property, combined with Schedule 2 into Item 31).

```pseudocode
type PersonalPropertyTangibleAsset:
  id:                     string
  description:            string       // e.g., "2022 Toyota Fortuner, plate ABC 123"
  subtype:                PersonalPropertyTangibleSubtype
  fmv:                    Pesos        // User-provided FMV at date of death
  ownership:              Ownership
  isExemptSec87:          boolean
```

#### 3.3.4 TaxableTransferAsset

Reported in Schedule 3 (Item 32). These are transfers made during the decedent's lifetime that the law deems still part of the estate.

```pseudocode
type TaxableTransferAsset:
  id:                     string
  description:            string       // e.g., "Transfer of Lot 7 to daughter in 2016"
  transferType:           TaxableTransferType
  fmvAtDeath:             Pesos        // FMV of the property at the CURRENT decedent's date of death
                                       // (not the FMV at the time of transfer)
  considerationReceived:  Pesos?       // Only used for INSUFFICIENT_CONSIDERATION type
                                       // Amount received by decedent in exchange for the transfer
                                       // Included amount = max(0, fmvAtDeath − considerationReceived)
  transferDate:           IsoDate?     // Date the transfer was made
                                       // Required for CONTEMPLATION_OF_DEATH (3-year lookback check)
                                       // and REVOCABLE_TRANSFER / GPA exercised by deed (3-year lookback)
  ownership:              Ownership    // EXCLUSIVE if transferred from decedent's exclusive property
                                       // CONJUGAL if transferred from conjugal property
```

**Engine amount rule**:
```pseudocode
function computeTaxableTransferAmount(asset: TaxableTransferAsset): Pesos:
  if asset.transferType == INSUFFICIENT_CONSIDERATION:
    return max(0, asset.fmvAtDeath - (asset.considerationReceived ?? 0))
  else:
    return asset.fmvAtDeath  // Full FMV at death for all other types
```

#### 3.3.5 BusinessInterestAsset

Reported in Schedule 4 (Item 33). Includes sole proprietorships and partnership interests.

```pseudocode
type BusinessInterestAsset:
  id:                     string
  businessName:           string       // Name of the business entity
  businessType:           BusinessType // SOLE_PROPRIETORSHIP | PARTNERSHIP
  totalAssets:            Pesos        // User-provided total assets of the business
  totalLiabilities:       Pesos        // User-provided total liabilities of the business
  ownership:              Ownership
  // Engine computes: netEquity = max(0, totalAssets - totalLiabilities)
  // Negative net equity is floored at 0 (never reduces gross estate)
  // Note: Shares of stock in CORPORATIONS are NOT reported here;
  // they are reported as SHARES_LISTED or SHARES_UNLISTED in PersonalPropertyFinancialAsset
```

---

### 3.4 Deduction Input Types

#### 3.4.1 ClaimAgainstEstate

Schedule 5A. A pre-existing personal obligation of the decedent outstanding at date of death.

```pseudocode
type ClaimAgainstEstate:
  id:                     string
  description:            string       // e.g., "BDO personal loan, loan no. 789"
  amountOwed:             Pesos        // Outstanding balance at date of death
  ownership:              Ownership    // EXCLUSIVE (personal debt) or CONJUGAL (joint/community debt)

  // Documentation attestations (user-declared; engine accepts as true, does not verify)
  existedAtDateOfDeath:   boolean      // Obligation existed before or at time of death (not post-death)
  contractedInGoodFaith:  boolean      // Debt incurred in good faith for adequate consideration
  isNotarized:            boolean      // Supported by notarized instrument, loan agreement, or institutional statement
```

#### 3.4.2 ClaimVsInsolventPerson

Schedule 5B. A receivable the estate holds against an insolvent debtor; deductible to the extent uncollectible.
The corresponding asset MUST appear in PersonalPropertyFinancialAsset (ACCOUNTS_RECEIVABLE or NOTES_RECEIVABLE).

```pseudocode
type ClaimVsInsolventPerson:
  id:                     string
  description:            string       // e.g., "Loan to Juan dela Cruz, now insolvent"
  grossEstateAssetId:     string       // ID of the PersonalPropertyFinancialAsset that includes this receivable
                                       // Engine validates: that asset must exist in gross estate (ERR_INSOLVENT_NOT_IN_GE)
  totalReceivable:        Pesos        // Total amount owed to the estate
  uncollectibleAmount:    Pesos        // Portion that is irrecoverable (≤ totalReceivable)
  ownership:              Ownership
  debtorIsInsolvent:      boolean      // User-declared; true = debtor cannot pay
```

#### 3.4.3 UnpaidMortgage

Part of Schedule 5C. Outstanding mortgage on a property included in the gross estate.

```pseudocode
type UnpaidMortgage:
  id:                     string
  description:            string       // e.g., "Mortgage on Makati property, BDO Housing Loan"
  outstandingBalance:     Pesos        // Outstanding principal balance at date of death
  ownership:              Ownership    // Must match the ownership of the mortgaged property
                                       // CONJUGAL: full balance goes to Column B; Schedule 6A handles the 50% split
  underlyingPropertyInGrossEstate: boolean  // true = the mortgaged property is included in gross estate
                                            // Engine validates (ERR_MORTGAGE_PROPERTY_NOT_IN_GE if false)
  relatedVanishingPropertyId: string?  // If this mortgage encumbers a vanishing deduction property,
                                       // provide the VanishingDeductionProperty ID for correct Step 2 computation
```

#### 3.4.4 UnpaidTax

Part of Schedule 5C (combined with unpaid mortgages). Tax accrued before death but unpaid at death.

```pseudocode
type UnpaidTax:
  id:                     string
  taxType:                string       // Descriptive label, e.g., "real_property_tax_2022", "income_tax_2021"
                                       // NOT "estate_tax" — the estate tax itself is disallowed (engine validates)
  amountDue:              Pesos        // Amount accrued and unpaid at date of death
  ownership:              Ownership    // EXCLUSIVE (personal tax) or CONJUGAL (e.g., joint RPT)
  accruedBeforeDeath:     boolean      // Tax liability arose on or before date of death
  unpaidAtDeath:          boolean      // Tax was not remitted at time of death
```

#### 3.4.5 CasualtyLoss

Schedule 5D. Uninsured loss to estate assets occurring during settlement (post-death, pre-filing).

```pseudocode
type CasualtyLoss:
  id:                     string
  description:            string       // e.g., "Typhoon damage to Cebu property during estate settlement"
  totalLoss:              Pesos        // Fair value of loss at time of casualty
  insuranceRecovery:      Pesos        // Amount recovered or recoverable from insurance (0 if none)
  ownership:              Ownership
  occurredDuringSettlement: boolean    // true = after date of death, before estate tax filing
  qualifyingEvent:        boolean      // true = fire, storm, shipwreck, casualty, robbery, theft, or embezzlement
  notClaimedForIncomeTax: boolean      // true = this loss was not also claimed on an estate income tax return
  // Engine computes: deductible = max(0, totalLoss − insuranceRecovery)
```

#### 3.4.6 VanishingDeductionProperty

Schedule 5E (Property Previously Taxed). Property received by the current decedent from a prior decedent or donor within 5 years, on which the prior tax was paid.

```pseudocode
type VanishingDeductionProperty:
  id:                     string
  description:            string       // e.g., "Lot inherited from mother, who died 2021-03-15"
  priorTransferDate:      IsoDate      // Date of prior decedent's death OR date of gift (donation)
                                       // Engine computes elapsed years: dateOfDeath − priorTransferDate
  priorFmv:               Pesos        // FMV at time of prior transfer (at prior death date or gift date)
  currentFmv:             Pesos        // FMV at CURRENT decedent's date of death (must match gross estate entry)
  mortgageOnProperty:     Pesos        // Unpaid mortgage specifically encumbering THIS property at current death date
                                       // This amount must also appear in an UnpaidMortgage entry (cross-reference)
                                       // Use 0 if no mortgage on this property
  ownership:              Ownership
  priorTaxPaid:           boolean      // true = estate tax (if inherited) or donor's tax (if gifted) was finally determined and paid
  propertyIdentifiable:   boolean      // true = the property can be specifically traced from the prior transfer
  // Computed by engine:
  // iv = min(priorFmv, currentFmv)
  // nv = max(0, iv - mortgageOnProperty)
  // ratio = max(0, (grossEstateTotal - elitTotal) / grossEstateTotal)
  // pct = vanishingPct(elapsed_years)  → 1.0/0.8/0.6/0.4/0.2/0.0
  // vd = pct × nv × ratio
```

#### 3.4.7 PublicUseTransfer

Schedule 5F. Bequest or legacy to the government of the Philippines or a political subdivision for exclusively public use.

```pseudocode
type PublicUseTransfer:
  id:                     string
  description:            string       // e.g., "Legacy of ₱500,000 to City of Manila for public park"
  fmv:                    Pesos        // Value of the transfer
  ownership:              Ownership
  recipientIsGovernment:  boolean      // true = Philippines national government, province, city, municipality, or barangay
                                       // false = charitable private institution → NOT this deduction (use Sec. 87(d) exclusion)
  isExclusivelyForPublicUse: boolean   // true = the transfer is restricted to public purposes
                                       // Note: transfers to private charitable institutions go through Sec. 87(d) exclusion,
                                       //       NOT through this deduction. This field must be true for the deduction to apply.
```

**NRA Note**: For non-resident alien decedents, PublicUseTransfer deductions are **proportional** (Sec. 86(B)(2)), not full-value. The engine applies the NRA proportional formula automatically when `decedent.isNonResidentAlien == true`.

#### 3.4.8 FuneralExpenses

**Pre-TRAIN ONLY** (deductionRules = `PRE_TRAIN`). If `deductionRules = TRAIN`, engine rejects this input with ERR_FUNERAL_NOT_DEDUCTIBLE.

```pseudocode
type FuneralExpenses:
  actualAmount:           Pesos        // Total actual funeral and burial expenses
  // Engine computes deductible = min(actualAmount, 0.05 × grossEstateTotal)
  // The 5% limit uses Item 34 Column C (total gross estate, after all assets are summed)
  // Funeral expenses must be computed AFTER gross estate is finalized (ordering dependency)
  // Funeral expenses are always EXCLUSIVE (Column A) — they are personal obligations, not conjugal
  // Maximum deductible (pre-TRAIN): min(actual, 5% × gross estate) with no additional peso cap
  //   (Note: some pre-TRAIN BIR forms show a ₱200,000 cap; the NIRC text shows only the 5% cap.
  //    Engine implements the NIRC 5% cap without a fixed peso ceiling.)
```

#### 3.4.9 JudicialAdminExpenses

**Pre-TRAIN ONLY** (deductionRules = `PRE_TRAIN`). If `deductionRules = TRAIN`, engine rejects this input with ERR_JUDICIAL_NOT_DEDUCTIBLE.

```pseudocode
type JudicialAdminExpenses:
  actualAmount:           Pesos        // Total judicial and administrative expenses of estate settlement
                                       // e.g., attorney's fees, court fees, accountant fees, executor compensation
  // Engine computes deductible = actualAmount (no cap; full actual expenses deductible)
  // Judicial/admin expenses are always EXCLUSIVE (Column A)
```

#### 3.4.10 MedicalExpenses

Special deduction (Schedule 6 area). Available under TRAIN, pre-TRAIN, and amnesty.

```pseudocode
type MedicalExpenses:
  actualAmount:           Pesos        // Total medical/healthcare expenses paid within 1 year before death
  paidWithin1YearOfDeath: boolean      // true = all medical expenses included were incurred within 1 year before dateOfDeath
                                       // false → ERR_MEDICAL_TIMING (deduction disallowed)
  // Engine computes: deductible = min(actualAmount, 500_000)   // ₱500,000 cap; same for all regimes
  // Medical expenses are always EXCLUSIVE (Column A) — personal/separate obligation of the decedent
  // Available for citizens, residents, and NRAs (subject to proportional formula for NRAs)
```

#### 3.4.11 RA4917Benefits

Special deduction. Retirement or death benefits from a qualified private benefit plan under RA 4917. These are excluded from gross income and also excluded from the estate tax base.

```pseudocode
type RA4917Benefits:
  amount:                 Pesos        // Amount of RA 4917 benefit receivable by the estate
  ownership:              Ownership    // Usually EXCLUSIVE
  // No monetary cap — full amount is deductible
  // Requires that the benefit was received from a qualifying private benefit plan under RA 4917
```

#### 3.4.12 ForeignTaxCreditClaim

Applied after tax is computed (not a deduction from estate). Reduces estate tax due (Item 42 → Item 43 → Item 44).
Not available under amnesty (`regime = AMNESTY`).

```pseudocode
type ForeignTaxCreditClaim:
  country:                string       // Name of the foreign country where tax was paid
  foreignTaxPaid:         Pesos        // Amount of foreign estate tax actually paid, in PHP equivalent
                                       // (user converts from foreign currency; engine does not convert)
  foreignPropertyValue:   Pesos        // FMV of the decedent's property situated in that foreign country, in PHP
                                       // Must be ≤ total gross estate (Item 34C); engine validates
  documentationVerified:  boolean      // Informational only — proof of payment obtained; not enforced by engine
  // Engine computes:
  //   perCountryLimit = phEstateTaxDue × (foreignPropertyValue / grossEstateTotal)
  //   perCountryCredit = min(foreignTaxPaid, perCountryLimit)
  // Aggregate: totalCredit = min(sum of perCountryCredits, phEstateTaxDue)
```

---

### 3.5 EngineInput (Top-Level Wrapper)

The complete input to the engine. Everything the user provides flows through this type.

```pseudocode
type EngineInput:
  // ── Subject of the Estate ─────────────────────────────────────────────────
  decedent:                  Decedent
  estate:                    EstateFlags

  // ── Gross Estate Assets ────────────────────────────────────────────────────
  realProperties:            RealPropertyAsset[]           // Schedule 1 + 1A
  personalFinancialAssets:   PersonalPropertyFinancialAsset[]  // Schedule 2
  personalTangibleAssets:    PersonalPropertyTangibleAsset[]   // Schedule 2A
  taxableTransfers:          TaxableTransferAsset[]         // Schedule 3
  businessInterests:         BusinessInterestAsset[]        // Schedule 4

  // ── Ordinary Deductions (Schedule 5) ─────────────────────────────────────
  claimsAgainstEstate:       ClaimAgainstEstate[]           // Schedule 5A
  claimsVsInsolventPersons:  ClaimVsInsolventPerson[]       // Schedule 5B
  unpaidMortgages:           UnpaidMortgage[]               // Schedule 5C (mortgages)
  unpaidTaxes:               UnpaidTax[]                    // Schedule 5C (taxes)
  casualtyLosses:            CasualtyLoss[]                 // Schedule 5D
  vanishingProperties:       VanishingDeductionProperty[]   // Schedule 5E
  publicUseTransfers:        PublicUseTransfer[]            // Schedule 5F

  // ── Pre-TRAIN Exclusive Deductions ────────────────────────────────────────
  // Provided only when deductionRules = PRE_TRAIN; engine rejects if TRAIN
  funeralExpenses:           FuneralExpenses?               // Schedule 5G (pre-TRAIN) — engine ignores if deductionRules = TRAIN
  judicialAdminExpenses:     JudicialAdminExpenses?         // Schedule 5G (pre-TRAIN) — engine ignores if deductionRules = TRAIN

  // ── Special Deductions ────────────────────────────────────────────────────
  // Standard deduction is automatically applied by engine (no user input needed)
  // Family home is identified via isDesignatedFamilyHome flag on RealPropertyAsset
  medicalExpenses:           MedicalExpenses?               // Schedule area — up to ₱500,000
  ra4917Benefits:            RA4917Benefits[]               // RA 4917 employer death benefits

  // ── Tax Credits (Post-Tax) ────────────────────────────────────────────────
  foreignTaxCredits:         ForeignTaxCreditClaim[]        // Item 43 — citizens/residents only
```

---

## 4. Intermediate Computation Types

These types are used internally by the engine during computation. They are also part of the output for display/explainer purposes.

### 4.1 ColumnValues

Used throughout for the three-column structure (Column A = exclusive, Column B = conjugal, Column C = total).

```pseudocode
type ColumnValues:
  exclusive:  Pesos   // Column A — decedent's separate/exclusive property
  conjugal:   Pesos   // Column B — community/conjugal property shared with spouse
  total:      Pesos   // Column C — always = exclusive + conjugal

// Constructor helper:
function columnValues(exclusive: Pesos, conjugal: Pesos): ColumnValues:
  return { exclusive, conjugal, total: exclusive + conjugal }

// Zero constant:
ZERO_COLUMNS = { exclusive: 0, conjugal: 0, total: 0 }
```

### 4.2 RegimeDetectionResult

Output of Phase 1 (regime detection). This drives all downstream branching.

```pseudocode
type RegimeDetectionResult:
  regime:              Regime           // TRAIN | PRE_TRAIN | AMNESTY
  deductionRules:      DeductionRules   // TRAIN | PRE_TRAIN (independent of regime)
  track:               AmnestyTrack?    // TRACK_A | TRACK_B | null (null for non-amnesty)
  displayDualPath:     boolean          // true = show amnesty vs. pre-TRAIN comparison table
  amnestyEligibility:  AmnestyEligibilityResult?
  warnings:            string[]         // Human-readable contextual notices (not errors)
```

### 4.3 AmnestyEligibilityResult

```pseudocode
type AmnestyEligibilityResult:
  eligible:            boolean
  reason:              AmnestyIneligibilityReason | "ELIGIBLE"
  track:               AmnestyTrack?   // Only present when eligible = true
```

### 4.4 GrossEstateResult

Output of Phase 3 (gross estate computation). Maps to Form 1801 Items 29–34.

```pseudocode
type GrossEstateResult:
  realProperty:        ColumnValues    // Item 29 (Schedule 1) — all real property excl. family home
  familyHome:          ColumnValues    // Item 30 (Schedule 1A) — the designated family home
  personalProperty:    ColumnValues    // Item 31 (Schedules 2 + 2A) — all personal property
  taxableTransfers:    ColumnValues    // Item 32 (Schedule 3) — taxable lifetime transfers
  businessInterest:    ColumnValues    // Item 33 (Schedule 4) — sole proprietorship/partnership equity
  total:               ColumnValues    // Item 34 = sum of all above
```

*Column rule*: Item 34.total = Item 34.exclusive + Item 34.conjugal.
Each sub-item also follows `total = exclusive + conjugal`.

### 4.5 OrdinaryDeductionsResult

Output of Phase 4 (ordinary deductions). Maps to Form 1801 Schedule 5 and Item 35.

```pseudocode
type OrdinaryDeductionsResult:
  claimsAgainstEstate:      ColumnValues    // Schedule 5A
  claimsVsInsolvent:        ColumnValues    // Schedule 5B
  unpaidMortgagesAndTaxes:  ColumnValues    // Schedule 5C (mortgages + taxes combined)
  casualtyLosses:           ColumnValues    // Schedule 5D
  vanishingDeduction:       ColumnValues    // Schedule 5E
  publicUseTransfers:       ColumnValues    // Schedule 5F (NRA: proportional version)
  funeralExpenses:          ColumnValues    // Schedule 5G (pre-TRAIN only; always Column A; always 0 under TRAIN)
  judicialAdminExpenses:    ColumnValues    // Schedule 5G (pre-TRAIN only; always Column A; always 0 under TRAIN)
  total:                    ColumnValues    // Item 35 = sum of all lines above
```

*Note*: `funeralExpenses` and `judicialAdminExpenses` are always zero when `deductionRules = TRAIN`. The fields are present in the output regardless of regime (zero for TRAIN), so the display layer can show them as "N/A" or omit them.

### 4.6 SpecialDeductionsResult

Output of Phase 5 (special deductions). Maps to Form 1801 Item 37 sub-items.

```pseudocode
type SpecialDeductionsResult:
  standardDeduction:     Pesos    // Item 37A — ₱5,000,000 (TRAIN citizen/resident), ₱500,000 (NRA), ₱1,000,000 (pre-TRAIN citizen/resident)
                                  // Single amount (not split into columns A/B)
  familyHome:            Pesos    // Item 37B — min(familyHomeFmv × ownershipFactor, cap) where cap = ₱10M (TRAIN) or ₱1M (pre-TRAIN)
                                  // familyHomeFmv × 0.5 if conjugal; × 1.0 if exclusive
  medicalExpenses:       Pesos    // Item 37C — min(actualMedical, 500_000); 0 if no medical or timing failed
  ra4917Benefits:        Pesos    // Item 37D — total of all RA 4917 benefit amounts
  total:                 Pesos    // Item 37 = sum of all above sub-items
  // All items are single Pesos values (not ColumnValues) because special deductions are
  // subtracted from the total Column C estate, not split by column

// Family home ownership factor:
// If familyHome asset ownership = EXCLUSIVE: fmv × 1.0 (decedent owned fully)
// If familyHome asset ownership = CONJUGAL: fmv × 0.5 (decedent's half only)
// Cap: TRAIN = ₱10,000,000; pre-TRAIN and amnesty (pre-2018 death) = ₱1,000,000
// If no family home designated: familyHome = 0
```

### 4.7 SpouseShareResult

Output of Phase 6 (surviving spouse share). Maps to Form 1801 Schedule 6A and Item 39.

```pseudocode
type SpouseShareResult:
  totalCommunityAssets:   Pesos   // Schedule 6A Line 1 = Item 34 Column B (all conjugal gross estate)
  communityObligations:   Pesos   // Schedule 6A Line 2 = sum of ELIT Column B (5A + 5B + 5C + 5D only)
                                  // Does NOT include Schedule 5E (vanishing) or 5F (public transfers)
  netCommunityProperty:   Pesos   // Schedule 6A Line 3 = max(0, totalCommunityAssets − communityObligations)
  spouseShare:            Pesos   // Schedule 6A Line 4 = netCommunityProperty × 0.50 = Item 39
  // If no spouse (NONE regime) or SEPARATION: all fields = 0
```

### 4.8 IntermediateTotals

Computed items on Form 1801 Part IV that are not inputs or final outputs but bridging calculations.

```pseudocode
type IntermediateTotals:
  grossEstate:            Pesos   // Item 34C
  ordinaryDeductions:     Pesos   // Item 35C
  estateAfterOrdinary:    Pesos   // Item 36 = max(0, Item 34C − Item 35C)
  specialDeductions:      Pesos   // Item 37 total
  netEstate:              Pesos   // Item 38 = max(0, Item 36 − Item 37)
  spouseShare:            Pesos   // Item 39
  netTaxableEstate:       Pesos   // Item 40 = max(0, Item 38 − Item 39)
```

*All intermediate values are floored at 0. Negative values at any intermediate step produce 0, not a carry-forward negative.*

### 4.9 TaxComputationResult

Output of Phase 7 (tax rate application) and Phase 8 (foreign tax credit). Maps to Form 1801 Items 41–44/20.

```pseudocode
type TaxComputationResult:
  regime:                 Regime         // Which rate function was applied

  // ── TRAIN and pre-TRAIN ──────────────────────────────────────────────────
  netTaxableEstate:       Pesos          // Item 40 — input to rate function
  taxRateOrSchedule:      string         // "6% flat" or "graduated schedule (5%–20%)"
  estateTaxDue:           Pesos          // Item 42 = netTaxableEstate × 0.06 (TRAIN)
                                         //         = computeGraduatedTax(netTaxableEstate) (pre-TRAIN)
  foreignTaxCredit:       Pesos          // Item 43 = result of computeForeignTaxCredit()
                                         //         = 0 for NRA; = 0 for amnesty
  netEstateTaxDue:        Pesos          // Item 44 = Item 20 = max(0, estateTaxDue − foreignTaxCredit)

  // ── Amnesty-Specific Fields (present when regime = AMNESTY) ──────────────
  amnestyTrack:           AmnestyTrack?  // TRACK_A | TRACK_B | null
  amnestyBase:            Pesos?         // TRACK_A: = netTaxableEstate (Item 40)
                                         // TRACK_B: = max(0, netTaxableEstate − previouslyDeclaredNetEstate)
  amnestyComputedTax:     Pesos?         // = amnestyBase × 0.06
  amnestyTaxDue:          Pesos?         // = max(5_000, amnestyComputedTax)  — minimum ₱5,000 always applies
  // Note: amnesty has NO foreign tax credit (foreignTaxCredit = 0; not applicable)

  // ── Pre-TRAIN Graduated Rate Breakdown (present when regime = PRE_TRAIN) ─
  graduatedBrackets:      GraduatedBracketResult[]?  // Each bracket's tax contribution (for explainer)
```

### 4.10 GraduatedBracketResult

Used for the pre-TRAIN graduated tax computation explainer. One entry per applicable bracket.

```pseudocode
type GraduatedBracketResult:
  bracketFloor:     Pesos    // Lower bound of this bracket
  bracketCeiling:   Pesos?   // Upper bound (null = no ceiling / top bracket)
  rate:             Rate     // Tax rate for this bracket
  baseAmount:       Pesos    // Fixed tax amount at bottom of this bracket (cumulative tax on prior brackets)
  excessAmount:     Pesos    // Amount of NTE falling in this bracket
  taxFromBracket:   Pesos    // excessAmount × rate (marginal tax from this bracket)
  cumulativeTax:    Pesos    // Total tax through end of this bracket

// Pre-TRAIN bracket table (from NIRC RA 8424 Sec. 84, original):
PRE_TRAIN_BRACKETS = [
  { floor:         0, ceiling:    200_000, baseAmount:      0, rate: 0.00 },
  { floor:   200_000, ceiling:    500_000, baseAmount:      0, rate: 0.05 },
  { floor:   500_000, ceiling:  2_000_000, baseAmount: 15_000, rate: 0.08 },
  { floor: 2_000_000, ceiling:  5_000_000, baseAmount: 135_000, rate: 0.11 },
  { floor: 5_000_000, ceiling: 10_000_000, baseAmount: 465_000, rate: 0.15 },
  { floor: 10_000_000, ceiling: null,      baseAmount: 1_215_000, rate: 0.20 },
]
// Note: For NTE ≤ ₱200,000, the pre-TRAIN tax is ₱0 (exemption threshold).
```

### 4.11 NRAProportionalDeductionResult

Used when `decedent.isNonResidentAlien = true`. The Sec. 86(B) formula applies a ratio to scale deductions.

```pseudocode
type NRAProportionalDeductionResult:
  phGrossEstate:         Pesos   // Philippine-situs gross estate (Item 34C, NRA computation)
  worldwideGrossEstate:  Pesos   // User-provided total worldwide gross estate
  ratio:                 Rate    // = phGrossEstate / worldwideGrossEstate
                                 // This ratio is applied to ALL ordinary deductions (5A–5F)
                                 // and to special deductions (except standard deduction, which is fixed ₱500K NRA)
  proportionalElitDeduction:  Pesos   // Actual ELIT total × ratio
  proportionalVanishingDeduction: Pesos
  proportionalPublicUseDeduction: Pesos
  proportionalMedicalDeduction:   Pesos  // min(actual × ratio, 500_000)
  // Standard deduction for NRA: fixed ₱500,000 (both TRAIN and pre-TRAIN) — NOT proportional
  // Family home: NRA has NO family home deduction (isDesignatedFamilyHome must be false for NRA)
```

### 4.12 DualPathComparisonResult

Present when `displayDualPath = true` (pre-2018 amnesty-eligible estates). Shows amnesty vs. regular pre-TRAIN side-by-side.

```pseudocode
type DualPathComparisonResult:
  regularPreTrain:     EngineOutput   // Full computation under PRE_TRAIN regime
  amnesty:             EngineOutput   // Full computation under AMNESTY regime
  // Key comparison fields (also in EngineOutput but surfaced here for display convenience):
  regularPreTrainTaxDue:  Pesos
  amnestyTaxDue:          Pesos
  benefitOfAmnesty:       Pesos      // = max(0, regularPreTrainTaxDue − amnestyTaxDue)
                                     // Positive = amnesty produces lower base tax
                                     // 0 = same base tax (or amnesty has minimum ₱5,000 which exceeds regular)
  recommendedPath:        "AMNESTY" | "REGULAR" | "EQUAL"
  note:                   string     // "Amnesty filing window closed June 14, 2025 — for historical reference only"
```

---

## 5. Output Types

### 5.1 ValidationError

```pseudocode
type ValidationError:
  code:        ValidationErrorCode
  field:       string?       // Which input field triggered the error (e.g., "decedent.dateOfDeath")
  assetId:     string?       // Which asset triggered the error (if asset-level)
  message:     string        // Human-readable explanation of the error
  severity:    "ERROR" | "WARNING"
                             // ERROR: computation cannot proceed until resolved
                             // WARNING: computation can proceed but user should review
```

### 5.2 Form1801Output

The complete set of Form 1801 field values. All fields are present regardless of regime. For non-applicable fields, the value is 0 and the field is labeled N/A in the display.

```pseudocode
type Form1801Output:
  // ── Part I: Decedent Information ──────────────────────────────────────────
  decedentName:              string    // Form 1801 header
  decedentTin:               string?
  dateOfDeath:               IsoDate
  dateOfBirth:               IsoDate?
  regime:                    string    // "TRAIN (RA 10963)" | "PRE-TRAIN (RA 8424)" | "ESTATE TAX AMNESTY (RA 11213)"
  formVersion:               string    // "January 2018" (TRAIN) | "June 2006" (pre-TRAIN) | "ETAR" (amnesty)

  // ── Part IV: Gross Estate ─────────────────────────────────────────────────
  item29:  ColumnValues    // Real property (excl. family home)
  item30:  ColumnValues    // Family home
  item31:  ColumnValues    // Personal property (Schedules 2 + 2A)
  item32:  ColumnValues    // Taxable transfers
  item33:  ColumnValues    // Business interest
  item34:  ColumnValues    // Total gross estate (sum of Items 29–33)

  // ── Schedule 5: Ordinary Deductions ──────────────────────────────────────
  sched5A: ColumnValues    // Claims against estate
  sched5B: ColumnValues    // Claims vs. insolvent persons
  sched5C: ColumnValues    // Unpaid mortgages + unpaid taxes
  sched5D: ColumnValues    // Casualty losses
  sched5E: ColumnValues    // Vanishing deduction (property previously taxed)
  sched5F: ColumnValues    // Transfers for public use
  sched5G: ColumnValues    // Other ordinary deductions (pre-TRAIN: funeral + judicial; TRAIN: 0)
  item35:  ColumnValues    // Total ordinary deductions (sum of Schedules 5A–5G)

  item36:  Pesos           // Estate after ordinary deductions = max(0, Item34C − Item35C)

  // ── Special Deductions ────────────────────────────────────────────────────
  item37A: Pesos           // Standard deduction (₱5M / ₱1M / ₱500K NRA)
  item37B: Pesos           // Family home deduction (capped)
  item37C: Pesos           // Medical expenses (capped at ₱500K)
  item37D: Pesos           // RA 4917 benefits
  item37:  Pesos           // Total special deductions = sum of 37A–37D

  item38:  Pesos           // Net estate = max(0, Item36 − Item37)

  // ── Spouse Share ──────────────────────────────────────────────────────────
  sched6A: SpouseShareResult  // Schedule 6A worksheet
  item39:  Pesos           // Share of surviving spouse (= sched6A.spouseShare)
  item40:  Pesos           // Net taxable estate = max(0, Item38 − Item39)

  // ── Tax Due ───────────────────────────────────────────────────────────────
  item41:  string          // Tax rate description (e.g., "Six percent (6%)" or "Graduated (5%-20%)")
  item42:  Pesos           // Estate tax due (before credits) = Item40 × rate (or graduated)
  item43:  Pesos           // Less: foreign tax credit (0 for NRA; 0 for amnesty)
  item44:  Pesos           // Net estate tax due = max(0, Item42 − Item43)

  // ── Part III Equivalent ───────────────────────────────────────────────────
  item20:  Pesos           // Tax due = Item44 (redundant on Form 1801; preserved for form fidelity)
  // Items 21–24 are OUT OF SCOPE (prior payments, surcharges, penalties)
```

### 5.3 ETAROutput

Estate Tax Amnesty Return output (used when `regime = AMNESTY`). Replaces Form1801Output for amnesty path.

```pseudocode
type ETAROutput:
  // ETAR follows similar gross estate and deduction structure as Form 1801
  // but has distinct line numbering and a simplified summary
  grossEstate:           Pesos          // Total gross estate (same computation as Item 34C)
  totalDeductions:       Pesos          // Ordinary + special + spouse share (same computation method)
  netTaxableEstate:      Pesos          // = grossEstate − totalDeductions (Item 40 equivalent)
  amnestyTrack:          AmnestyTrack   // TRACK_A | TRACK_B
  amnestyBase:           Pesos          // TRACK_A: = netTaxableEstate; TRACK_B: = max(0, NTE − previouslyDeclared)
  amnestyRate:           Rate           // = 0.06
  amnestyComputedTax:    Pesos          // = amnestyBase × 0.06
  amnestyTaxDue:         Pesos          // = max(5_000, amnestyComputedTax)
  filingWindowStatus:    string         // "CLOSED — Amnesty filing deadline was June 14, 2025 (RA 11569/RA 11956). This computation is for historical reference only."
  formLabel:             string         // "Estate Tax Amnesty Return (ETAR) + Acceptance Payment Form (APF)"
```

### 5.4 ExplainerStep

One step in the plain-English explainer section. Defined here; full template in explainer-format.md (Wave 5).

```pseudocode
type ExplainerStep:
  stepNumber:         integer          // 1, 2, 3, …
  title:              string           // Short label, e.g., "Total Value of the Estate"
  formReference:      string           // e.g., "Form 1801 Item 34" or "Schedule 5E"
  amount:             Pesos?           // The computed value for this step (null if non-numeric)
  plainEnglish:       string           // 1–3 sentence non-expert explanation of what this means
  legalBasis:         string?          // Short citation, e.g., "NIRC Sec. 85(A)"
  ruleApplied:        string?          // Brief description of the rule (e.g., "Capped at ₱500,000")
```

### 5.5 EngineOutput (Final)

The top-level engine output. Contains everything the UI needs to render the full computation.

```pseudocode
type EngineOutput:
  // ── Metadata ──────────────────────────────────────────────────────────────
  computedAt:            IsoDate        // Date the computation was run
  engineVersion:         string         // Semantic version of the engine

  // ── Input Echo ────────────────────────────────────────────────────────────
  input:                 EngineInput    // The original inputs (for audit trail and explainer)

  // ── Regime ────────────────────────────────────────────────────────────────
  regimeDetection:       RegimeDetectionResult

  // ── Intermediate Computation Values ──────────────────────────────────────
  grossEstate:           GrossEstateResult
  ordinaryDeductions:    OrdinaryDeductionsResult
  specialDeductions:     SpecialDeductionsResult
  spouseShare:           SpouseShareResult
  intermediates:         IntermediateTotals
  taxComputation:        TaxComputationResult

  // ── Form Outputs ──────────────────────────────────────────────────────────
  form1801:              Form1801Output?   // Present for TRAIN and pre-TRAIN regimes
  etar:                  ETAROutput?       // Present for AMNESTY regime

  // ── Dual-Path Comparison ──────────────────────────────────────────────────
  dualPath:              DualPathComparisonResult?   // Present when displayDualPath = true

  // ── Explainer ─────────────────────────────────────────────────────────────
  explainer:             ExplainerStep[]   // Full step-by-step plain-English computation walkthrough

  // ── Validation ────────────────────────────────────────────────────────────
  warnings:              ValidationError[] // Non-blocking warnings (severity = WARNING)
  // Errors (severity = ERROR) cause computation to halt; EngineOutput is null for unresolved ERRORs
```

---

## 6. Key Constants

All monetary constants referenced in the engine. Defined once; never hardcoded inline.

```pseudocode
// ── Regime Boundaries ────────────────────────────────────────────────────────
TRAIN_EFFECTIVE_DATE:              IsoDate = "2018-01-01"   // Deaths on/after this date → TRAIN
AMNESTY_COVERAGE_CUTOFF:          IsoDate = "2022-05-31"   // Deaths on/before this date → amnesty-eligible
FAMILY_CODE_EFFECTIVITY:          IsoDate = "1988-08-03"   // ACP default for marriages on/after; CPG before

// ── TRAIN-Era Constants ───────────────────────────────────────────────────────
TRAIN_TAX_RATE:                   Rate  = 0.06
TRAIN_STANDARD_DEDUCTION_CITIZEN: Pesos = 5_000_000   // Citizens and resident aliens
TRAIN_STANDARD_DEDUCTION_NRA:     Pesos =   500_000   // Non-resident aliens
TRAIN_FAMILY_HOME_CAP:            Pesos = 10_000_000
TRAIN_MEDICAL_CAP:                Pesos =    500_000  // Same across all regimes

// ── Pre-TRAIN Constants ───────────────────────────────────────────────────────
PRE_TRAIN_STANDARD_DEDUCTION_CITIZEN: Pesos = 1_000_000
PRE_TRAIN_STANDARD_DEDUCTION_NRA:     Pesos =   500_000  // Same as TRAIN
PRE_TRAIN_FAMILY_HOME_CAP:            Pesos = 1_000_000
PRE_TRAIN_FUNERAL_PCT:                Rate  = 0.05       // 5% of total gross estate
PRE_TRAIN_EXEMPTION_THRESHOLD:        Pesos =   200_000  // NTE ≤ ₱200K → ₱0 tax (zero-rate bracket)
PRE_TRAIN_CROSSOVER_NTE:              Pesos = 1_250_000  // NTE above this → amnesty base tax lower than pre-TRAIN

// ── Amnesty Constants ─────────────────────────────────────────────────────────
AMNESTY_TAX_RATE:                 Rate  = 0.06
AMNESTY_MINIMUM_TAX:              Pesos = 5_000         // Always applied: max(5_000, computed)
AMNESTY_FILING_DEADLINE:          IsoDate = "2025-06-14" // RA 11569 filing window closed

// ── Vanishing Deduction Percentage Table ──────────────────────────────────────
VANISHING_PCT_TABLE = [
  { maxYears: 1, pct: 1.00 },
  { maxYears: 2, pct: 0.80 },
  { maxYears: 3, pct: 0.60 },
  { maxYears: 4, pct: 0.40 },
  { maxYears: 5, pct: 0.20 },
  // > 5 years → 0.00 (disqualified)
]
```

---

## 7. Field-Level Validation Rules (Summary)

| Field | Rule | Error Code |
|-------|------|-----------|
| `decedent.dateOfDeath` | Required; not null | ERR_DATE_REQUIRED |
| `decedent.dateOfDeath` | Not in future | ERR_DATE_FUTURE |
| `decedent.dateOfDeath` | ≥ 1901-01-01 | ERR_DATE_IMPLAUSIBLE |
| `estate.previouslyDeclaredNetEstate` | Required if `priorReturnFiled = true` | ERR_TRACK_B_MISSING_INPUT |
| `estate.previouslyDeclaredNetEstate` | Must be ≥ 0 | ERR_PRIOR_DECLARED_NEGATIVE |
| Any `fmv` field | Required and ≥ 0 | ERR_FMV_MISSING / ERR_FMV_NEGATIVE |
| `isDesignatedFamilyHome` | Only one asset may be true | ERR_MULTIPLE_FAMILY_HOMES |
| `isDesignatedFamilyHome = true` | `decedent.isNonResidentAlien` must be false | ERR_FAMILY_HOME_NRA |
| `isDesignatedFamilyHome = true` | `isActualResidence` must also be true | ERR_FAMILY_HOME_NO_RESIDENCE |
| `funeralExpenses` input | Only allowed when `deductionRules = PRE_TRAIN` | ERR_FUNERAL_NOT_DEDUCTIBLE |
| `judicialAdminExpenses` input | Only allowed when `deductionRules = PRE_TRAIN` | ERR_JUDICIAL_NOT_DEDUCTIBLE |
| `ClaimVsInsolventPerson.grossEstateAssetId` | Must reference an existing asset in gross estate | ERR_INSOLVENT_NOT_IN_GE |
| `MedicalExpenses.paidWithin1YearOfDeath` | Must be true for deduction to apply | ERR_MEDICAL_TIMING |
| `VanishingDeductionProperty.priorTaxPaid` | Must be true for deduction to apply | ERR_VANISHING_PRIOR_TAX_UNPAID |
| `ForeignTaxCreditClaim.foreignPropertyValue` | Must be ≤ grossEstateTotal | ERR_FOREIGN_PROPERTY_EXCEEDS_GE |
| `UnpaidTax.taxType` | Must not equal "estate_tax" | ERR_ESTATE_TAX_IN_UNPAID_TAXES |
| Asset `ownership = CONJUGAL` | `maritalStatus` must be `MARRIED` and `propertyRegime` ≠ `SEPARATION` | ERR_CONJUGAL_WITH_NONE_REGIME |

---

## 8. Regime-Controlled Function Dispatch

All functions that vary by regime or deductionRules must accept these as explicit parameters. Summary of branching:

```pseudocode
// Branch on deductionRules (not regime):
function getStandardDeduction(decedent, deductionRules):
  if decedent.isNonResidentAlien:
    return 500_000   // Same for TRAIN and PRE_TRAIN
  return deductionRules == TRAIN ? 5_000_000 : 1_000_000

function getFamilyHomeCap(deductionRules):
  return deductionRules == TRAIN ? 10_000_000 : 1_000_000

function isFuneralDeductible(deductionRules):
  return deductionRules == PRE_TRAIN

function isJudicialAdminDeductible(deductionRules):
  return deductionRules == PRE_TRAIN

// Branch on regime (not deductionRules):
function applyTaxRate(nteOrAmnestyBase, regime, preTRAINBrackets):
  switch regime:
    case TRAIN:
      return nteOrAmnestyBase × 0.06
    case PRE_TRAIN:
      return computeGraduatedTax(nteOrAmnestyBase, preTRAINBrackets)
    case AMNESTY:
      computedTax = nteOrAmnestyBase × 0.06
      return max(5_000, computedTax)

function isForeignTaxCreditAllowed(regime, decedent):
  if regime == AMNESTY:
    return false          // No credit under amnesty
  if decedent.isNonResidentAlien:
    return false          // NRA: no foreign tax credit
  return true
```

---

## 9. Ordering Dependencies

Some computations must complete before others can begin. The dependency chain is:

```
1. decedent.dateOfDeath
   → detectRegime() → (regime, deductionRules, track)

2. All asset FMVs resolved (isExemptSec87 filter applied)
   → computeGrossEstate() → GrossEstateResult (Items 29–34)

3. GrossEstateResult (grossEstateTotal = Item34C)
   → computeFuneralExpenseDeduction() [pre-TRAIN only; needs grossEstateTotal for 5% limit]
   → computeELIT() [needs grossEstateTotal for cross-validation]

4. ELIT computed (lines 5A–5D)
   → computeVanishingDeduction() [needs elitTotal for ratio computation in Step 3]

5. All ordinary deductions computed (Item35)
   → Item36 = max(0, Item34C - Item35C)

6. Item36 + deductionRules
   → computeSpecialDeductions() [standard, family home, medical, RA4917]

7. All special deductions (Item37)
   → Item38 = max(0, Item36 - Item37)

8. GrossEstate Column B + ELIT Column B (5A–5D only, NOT 5E/5F)
   → computeSurvivingSpouseShare() → Item39

9. Item38 + Item39
   → Item40 = max(0, Item38 - Item39)

10. Item40 + regime
    → applyTaxRate() → Item42

11. Item42 + grossEstateTotal
    → computeForeignTaxCredit() → Item43

12. Item42 - Item43
    → Item44 = Item20 = netEstateTaxDue
```

**Critical ordering rules**:
- Funeral expense deduction (pre-TRAIN) **must** use the final gross estate total (Item 34C). It cannot be computed before all assets are tallied.
- Vanishing deduction **must** use the final ELIT total (5A–5D sum). It cannot be computed before all ELIT items are finalized.
- Surviving spouse share **must** use gross estate Column B (not the net estate). It uses the raw conjugal gross estate values, not values after other deductions.
- Special deductions are subtracted from Item 36 (post-ordinary), not from Item 34 (gross estate).
- Foreign tax credit is applied last, after the estate tax due is fully computed.

---

## 10. Test Implications

| Test ID | What to Verify |
|---------|---------------|
| DM-01 | Decedent with `maritalStatus = SINGLE`: all assets are `EXCLUSIVE`; `propertyRegime` must be `NONE`; `spouseShare = 0` |
| DM-02 | `isNonResidentAlien = true` rejects `isDesignatedFamilyHome = true` (ERR_FAMILY_HOME_NRA) |
| DM-03 | Multiple assets with `isDesignatedFamilyHome = true` → ERR_MULTIPLE_FAMILY_HOMES |
| DM-04 | `FuneralExpenses` input on TRAIN-era estate → ERR_FUNERAL_NOT_DEDUCTIBLE |
| DM-05 | `ClaimVsInsolventPerson` with `grossEstateAssetId` not in assets → ERR_INSOLVENT_NOT_IN_GE |
| DM-06 | `VanishingDeductionProperty` with `priorTaxPaid = false` → deduction is ₱0; no error (WARNING level) |
| DM-07 | `BusinessInterestAsset` with `totalLiabilities > totalAssets` → `netEquity = 0` (floor); no error |
| DM-08 | `ForeignTaxCreditClaim` when `regime = AMNESTY` → credit forced to ₱0 |
| DM-09 | `ForeignTaxCreditClaim` when `decedent.isNonResidentAlien = true` → credit forced to ₱0 |
| DM-10 | Pre-TRAIN estate: `deductionRules = PRE_TRAIN`; `FuneralExpenses` input accepted; deductible = min(actual, 5% × Item34C) |
| DM-11 | Amnesty (pre-2018 death): `regime = AMNESTY`, `deductionRules = PRE_TRAIN`; both flags present simultaneously |
| DM-12 | `previouslyDeclaredNetEstate` required when `priorReturnFiled = true`; missing → ERR_TRACK_B_MISSING_INPUT |
| DM-13 | All `ColumnValues.total` fields equal `exclusive + conjugal` exactly (no rounding error) |
| DM-14 | All intermediate Pesos values floored at 0 (no negative intermediate results propagate) |
| DM-15 | Vanishing deduction on amnesty estate: VD is available (regime = AMNESTY does not disable VD) |

---

## 11. Relationship to Other Analysis Files

| Type / Constant | Defined Here | Sourced From |
|----------------|--------------|-------------|
| `Regime`, `DeductionRules`, `AmnestyTrack` | Yes | regime-detection.md |
| `RegimeDetectionResult` | Yes | regime-detection.md (formal definition) |
| `PRE_TRAIN_BRACKETS` | Yes | tax-rate-pre-train.md |
| `GrossEstateResult` structure | Yes | gross-estate-citizens.md, gross-estate-nonresident.md |
| `OrdinaryDeductionsResult` structure | Yes | deduction-elit.md, deduction-vanishing.md, deduction-public-transfers.md, deductions-pre-train-diffs.md |
| `SpecialDeductionsResult` structure | Yes | deduction-standard.md, deduction-family-home.md, deduction-medical.md, deduction-ra4917.md |
| `SpouseShareResult` structure | Yes | surviving-spouse-share.md |
| `TaxComputationResult` | Yes | tax-rate-train.md, tax-rate-pre-train.md, amnesty-computation.md |
| `ForeignTaxCreditClaim` computation | Yes | tax-credits.md |
| `NRAProportionalDeductionResult` | Yes | nonresident-deductions.md |
| `DualPathComparisonResult` | Yes | amnesty-vs-regular.md |
| Form 1801 field names and ordering | Yes | form-1801-fields.md |
| `VanishingDeductionProperty` formula details | Yes | deduction-vanishing.md |
| Sec. 87 exclusions | Yes | exemptions.md |
| CPG vs. ACP classification rules | Referenced | property-regime-acp.md, property-regime-cpg.md |
| Filing rules (1-year deadline, CPA requirement) | Not in data model | filing-rules.md (informational; not computation data) |
