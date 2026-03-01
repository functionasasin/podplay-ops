# Feature Spec: Estate Tax Inputs Wizard

**Aspect:** spec-estate-tax-inputs-wizard
**Wave:** 2 — Per-Feature Specification
**Date:** 2026-03-01
**Reads:** estate-tax-integration, spec-auth-persistence
**Depends on:** spec-auth-persistence ✓
**Depended on by:** spec-bir-1801-integration (references this wizard)

---

## 1. Overview

The Philippine estate tax computation engine (`docs/plans/estate-tax-engine-spec.md`) accepts a deeply-structured `EngineInput` object spanning six asset schedules, eight deduction schedules, decedent details, executor info, filing flags, and amnesty election. This input surface is too large to present as a single scrolling form. This feature specifies a **multi-tab wizard** — eight sequential tabs — that constructs the `EstateTaxEngineInput` object incrementally, validates it, and stores it in `cases.tax_input_json`.

**Why a PH estate lawyer needs this:**
- Estate tax computation requires 30–80 individual data entry fields depending on the complexity of the estate. A flat form causes critical fields to be missed or entered in the wrong schedule.
- The BIR Form 1801 organizes inputs into explicit schedules (1, 1A, 2, 2A, 3, 4, 5A–5H, 6). The wizard mirrors this structure so the lawyer can cross-reference their physical documents against each tab.
- Several fields conditionally appear (funeral expenses only for PRE_TRAIN estates, worldwide ELIT only for NRA decedents, amnesty exclusion flags only when amnesty is elected). A tabbed wizard can show/hide tabs and fields based on prior answers, preventing entry errors.
- This wizard feeds the `spec-bir-1801-integration` feature: the estate tax engine runs from this wizard's output, and the bridge formula `max(0, Item40 − Item44)` updates the inheritance distribution.

**What this spec covers:**
- All 8 wizard tabs: Decedent Details, Executor, Real Properties, Personal Properties, Other Assets, Ordinary Deductions, Special Deductions, Filing & Amnesty
- ASCII wireframes for every tab
- Field-level type, label, required/optional, validation, and conditional visibility rules
- Form state TypeScript types
- Auto-save strategy for wizard state
- Pre-population from inheritance wizard (5 auto-populated fields)
- Tab-level validation schema (what must be complete before proceeding)

**What this spec does NOT cover:**
- The estate tax engine algorithm (see `docs/plans/estate-tax-engine-spec.md`)
- The bridge formula or inheritance re-run (see `analysis/spec-bir-1801-integration.md`)
- The combined PDF output (see `analysis/spec-bir-1801-integration.md`)
- The results view for estate tax output (see `analysis/spec-bir-1801-integration.md`)

---

## 2. Data Model

### 2.1 Storage

No new database tables are required. The wizard writes its state to the `cases.tax_input_json` JSONB column, already defined in `spec-auth-persistence`. The column holds an object of type `EstateTaxEngineInput` (see §2.2 below).

The wizard is only accessible when a case is saved (authenticated, `case_id` exists). It is not available in anonymous mode.

```
cases.tax_input_json  ← EstateTaxEngineInput object (all wizard tabs combined)
cases.tax_output_json ← EstateTaxEngineOutput object (set after engine runs)
```

### 2.2 Wizard Form State (TypeScript)

The wizard state directly mirrors the engine's `EngineInput` type. The form operates on a mutable draft of this type and persists it to `cases.tax_input_json` on every auto-save.

```typescript
// src/types/estate-tax.ts
// (mirrors docs/plans/estate-tax-engine-spec.md §5 Data Model exactly)

export type PropertyRegime = 'ACP' | 'CPG' | 'SEPARATION'
export type MaritalStatus = 'SINGLE' | 'MARRIED' | 'WIDOWED' | 'LEGALLY_SEPARATED' | 'ANNULLED'
export type Ownership = 'EXCLUSIVE' | 'CONJUGAL'
export type TaxableTransferType =
  | 'CONTEMPLATION_OF_DEATH'
  | 'REVOCABLE'
  | 'POWER_OF_APPOINTMENT'
  | 'LIFE_INSURANCE'
  | 'INSUFFICIENT_CONSIDERATION'

// Tab 1 — Decedent Details
export interface EstateTaxDecedent {
  name: string                          // pre-populated from inheritance wizard
  dateOfDeath: string                   // ISO date; pre-populated from inheritance wizard
  citizenship: string                   // default 'Filipino'
  isNonResidentAlien: boolean           // default false
  address: string                       // required
  maritalStatus: MaritalStatus          // pre-populated from inheritance wizard is_married
  propertyRegime: PropertyRegime | null // null if single/widowed/annulled; default from marriage date
  totalWorldwideGrossEstate: number | null  // centavos; required if isNonResidentAlien && any ELIT
  totalWorldwideELIT: {
    claimsAgainstEstate: number
    claimsVsInsolvent: number
    unpaidMortgages: number
    casualtyLosses: number
    funeralExpenses: number             // PRE_TRAIN deductionRules only
    judicialAdminExpenses: number       // PRE_TRAIN deductionRules only
  } | null
}

// Tab 2 — Executor
export interface EstateTaxExecutor {
  name: string
  tin: string | null                    // NNN-NNN-NNN-NNN format
  contactNumber: string | null
  email: string | null
}

// Tab 3 — Real Properties
export interface RealPropertyAsset {
  titleNumber: string                   // OCT/TCT/CCT number
  taxDeclarationNumber: string
  location: string                      // barangay, municipality, province
  lotArea: number                       // sq.m.
  improvementArea: number               // sq.m.
  classification: 'RESIDENTIAL' | 'COMMERCIAL' | 'AGRICULTURAL' | 'INDUSTRIAL'
  fmvTaxDeclaration: number             // centavos; per tax declaration assessed value
  fmvBir: number                        // centavos; per BIR zonal value
  // engine computes fmv = max(fmvTaxDeclaration, fmvBir)
  ownership: Ownership
  isFamilyHome: boolean                 // if true → Schedule 1A
  barangayCertification: boolean        // required for family home deduction
}

// Tab 4 — Personal Properties
export type FinancialSubtype =
  | 'CASH_ON_HAND' | 'CASH_IN_BANK' | 'ACCOUNTS_RECEIVABLE'
  | 'NOTES_RECEIVABLE' | 'SHARES_LISTED' | 'SHARES_UNLISTED'
  | 'BONDS' | 'MUTUAL_FUNDS'

export type TangibleSubtype = 'MOTOR_VEHICLE' | 'JEWELRY' | 'OTHER_TANGIBLE'

export interface PersonalPropertyFinancialAsset {
  subtype: FinancialSubtype
  description: string
  fmv: number                           // centavos
  ownership: Ownership
}

export interface PersonalPropertyTangibleAsset {
  subtype: TangibleSubtype
  description: string
  quantity: number
  fmv: number                           // centavos; total for all units
  ownership: Ownership
}

// Tab 5 — Other Assets
export interface TaxableTransferAsset {
  description: string
  dateOfTransfer: string                // ISO date
  type: TaxableTransferType
  considerationReceived: number         // centavos; 0 for pure gifts
  fmvAtDeath: number                    // centavos
  // engine computes taxableAmount = max(0, fmvAtDeath - considerationReceived)
  ownership: Ownership
}

export interface BusinessInterestAsset {
  name: string                          // company/business name
  nature: string                        // e.g., "single proprietorship", "shares in XYZ Corp"
  netEquity: number                     // centavos; engine floors at 0
  ownership: Ownership
}

export interface Sec87ExemptAsset {
  description: string
  exemptionType: 'USUFRUCT_MERGER' | 'FIDUCIARY' | 'FIDEICOMMISSARY' | 'CHARITABLE_PRIVATE'
  fmv: number                           // centavos; audit trail only
}

// Tab 6 — Ordinary Deductions
export interface ClaimAgainstEstate {
  description: string
  amount: number                        // centavos
  ownership: Ownership
}

export interface ClaimVsInsolventPerson {
  description: string
  amountInGrossEstate: number           // centavos; must also appear as asset
  uncollectibleAmount: number           // centavos; the deductible portion
  ownership: Ownership
}

export interface UnpaidMortgage {
  description: string
  propertyInEstate: boolean             // must be true for deduction to apply
  amount: number                        // centavos
  ownership: Ownership
}

export interface UnpaidTax {
  description: string
  amount: number                        // centavos; owing as of DOD; not estate tax itself
  ownership: Ownership
}

export interface CasualtyLoss {
  description: string
  grossLoss: number                     // centavos
  insuranceRecovery: number             // centavos
  // engine computes: max(0, grossLoss - insuranceRecovery)
  ownership: Ownership
}

export interface VanishingDeductionProperty {
  description: string
  priorTransferType: 'INHERITANCE' | 'GIFT'
  priorTransferDate: string             // ISO date
  priorFMV: number                      // centavos; FMV at time of prior transfer
  currentFMV: number                    // centavos; FMV at decedent's DOD
  mortgageOnProperty: number            // centavos; also in unpaidMortgages
  priorTaxWasPaid: boolean
  ownership: Ownership
  isPhilippineSitus: boolean            // required for NRA
}

export interface PublicUseTransfer {
  description: string
  recipient: string                     // name of PH government entity or institution
  amount: number                        // centavos
  ownership: Ownership
}

export interface FuneralExpenses {
  actualAmount: number                  // centavos; engine applies min(actual, 5% × grossEstate)
}

export interface JudicialAdminExpenseItem {
  description: string
  amount: number                        // centavos
  ownership: Ownership
}

// Tab 7 — Special Deductions
export interface MedicalExpenseItem {
  description: string
  date: string                          // ISO date; must be within 1 year before DOD
  amount: number                        // centavos
}

export interface RA4917Benefits {
  amount: number                        // centavos
  employerName: string
}

export interface ForeignTaxCreditClaim {
  country: string
  foreignTaxPaid: number                // centavos
  foreignPropertyFMV: number            // centavos; FMV of property taxed in that country
}

// Tab 8 — Filing & Amnesty
export interface EstateFlags {
  taxFullyPaidBeforeMay2022: boolean
  priorReturnFiled: boolean
  previouslyDeclaredNetEstate: number | null    // centavos; required if priorReturnFiled = true
  subjectToPCGGJurisdiction: boolean
  hasRA3019Violations: boolean
  hasRA9160Violations: boolean
  hasPendingCourtCasePreAmnestyAct: boolean
  hasUnexplainedWealthCases: boolean
  hasPendingRPCFelonies: boolean
}

export interface FilingInfo {
  isAmended: boolean
  extensionToFile: boolean
  extensionToPay: boolean
  installmentGranted: boolean
  judicialSettlement: boolean
  hasTaxRelief: boolean
}

// Complete Wizard State (= EstateTaxEngineInput)
export interface EstateTaxWizardState {
  decedent: EstateTaxDecedent
  executor: EstateTaxExecutor
  estateFlags: EstateFlags
  userElectsAmnesty: boolean
  useNarrowAmnestyDeductions: boolean

  // Tab 3
  realProperties: RealPropertyAsset[]

  // Tab 4
  personalPropertiesFinancial: PersonalPropertyFinancialAsset[]
  personalPropertiesTangible: PersonalPropertyTangibleAsset[]

  // Tab 5
  taxableTransfers: TaxableTransferAsset[]
  businessInterests: BusinessInterestAsset[]
  sec87ExemptAssets: Sec87ExemptAsset[]

  // Tab 6
  claimsAgainstEstate: ClaimAgainstEstate[]
  claimsVsInsolvent: ClaimVsInsolventPerson[]
  unpaidMortgages: UnpaidMortgage[]
  unpaidTaxes: UnpaidTax[]
  casualtyLosses: CasualtyLoss[]
  vanishingDeductionProperties: VanishingDeductionProperty[]
  publicUseTransfers: PublicUseTransfer[]
  funeralExpenses: FuneralExpenses | null   // non-null only when deductionRules = PRE_TRAIN
  judicialAdminExpenses: JudicialAdminExpenseItem[] | null  // non-null only when deductionRules = PRE_TRAIN

  // Tab 7
  medicalExpenses: MedicalExpenseItem[] | null
  ra4917Benefits: RA4917Benefits | null
  foreignTaxCredits: ForeignTaxCreditClaim[]

  // Tab 8
  filing: FilingInfo
}
```

### 2.3 Empty/Default Wizard State

When the wizard opens for a new estate tax computation, it is pre-populated with the following defaults. Fields marked "(pre-populated)" are copied from the inheritance wizard's `EngineInput`:

```typescript
function createDefaultEstateTaxState(
  inheritanceInput: InheritanceEngineInput
): EstateTaxWizardState {
  const maritalStatus: MaritalStatus = inheritanceInput.decedent.is_married
    ? 'MARRIED'
    : 'SINGLE'

  // Default property regime from marriage date (ACP from Aug 3, 1988)
  const propertyRegime: PropertyRegime | null = inheritanceInput.decedent.is_married
    ? (inheritanceInput.decedent.date_of_marriage &&
       inheritanceInput.decedent.date_of_marriage >= '1988-08-03'
       ? 'ACP' : 'CPG')
    : null

  return {
    decedent: {
      name: inheritanceInput.decedent.name,           // pre-populated
      dateOfDeath: inheritanceInput.decedent.date_of_death,  // pre-populated
      citizenship: 'Filipino',
      isNonResidentAlien: false,
      address: '',
      maritalStatus,                                   // pre-populated
      propertyRegime,                                  // default from marriage date
      totalWorldwideGrossEstate: null,
      totalWorldwideELIT: null,
    },
    executor: { name: '', tin: null, contactNumber: null, email: null },
    estateFlags: {
      taxFullyPaidBeforeMay2022: false,
      priorReturnFiled: false,
      previouslyDeclaredNetEstate: null,
      subjectToPCGGJurisdiction: false,
      hasRA3019Violations: false,
      hasRA9160Violations: false,
      hasPendingCourtCasePreAmnestyAct: false,
      hasUnexplainedWealthCases: false,
      hasPendingRPCFelonies: false,
    },
    userElectsAmnesty: false,
    useNarrowAmnestyDeductions: false,
    realProperties: [],
    personalPropertiesFinancial: [],
    personalPropertiesTangible: [],
    taxableTransfers: [],
    businessInterests: [],
    sec87ExemptAssets: [],
    claimsAgainstEstate: [],
    claimsVsInsolvent: [],
    unpaidMortgages: [],
    unpaidTaxes: [],
    casualtyLosses: [],
    vanishingDeductionProperties: [],
    publicUseTransfers: [],
    funeralExpenses: null,
    judicialAdminExpenses: null,
    medicalExpenses: null,
    ra4917Benefits: null,
    foreignTaxCredits: [],
    filing: {
      isAmended: false,
      extensionToFile: false,
      extensionToPay: false,
      installmentGranted: false,
      judicialSettlement: false,
      hasTaxRelief: false,
    },
  }
}
```

### 2.4 Tab Validation Schema

Each tab has a minimum set of required fields before the user can proceed. Tabs with no required fields (all arrays optional) pass validation trivially.

| Tab | Required Fields | Validation Rule |
|-----|-----------------|-----------------|
| 1 — Decedent Details | `decedent.name`, `decedent.dateOfDeath`, `decedent.address`, `decedent.citizenship`, `decedent.maritalStatus` | name non-empty; dateOfDeath valid ISO date ≤ today; address non-empty; citizenship non-empty; maritalStatus selected |
| 1 — NRA condition | `decedent.totalWorldwideGrossEstate` | Required when `isNonResidentAlien = true` AND any ELIT deduction declared (evaluated lazily at Tab 6) |
| 2 — Executor | `executor.name` | name non-empty |
| 3 — Real Properties | None (empty array is valid) | If any row is added: `titleNumber`, `taxDeclarationNumber`, `location`, `fmvTaxDeclaration`, `fmvBir`, `ownership` all required per row |
| 4 — Personal Properties | None | If any row added: `description`, `fmv`, `ownership`, `subtype` required per row |
| 5 — Other Assets | None | If taxable transfer added: `description`, `dateOfTransfer`, `type`, `fmvAtDeath`, `ownership` required per row |
| 6 — Ordinary Deductions | None | If `isFamilyHome = true` on any real property, `barangayCertification` must be set (boolean; unchecked = false is allowed but a warning is shown) |
| 7 — Special Deductions | None | If any medical expense item added: `description`, `date`, `amount` required per row; date must be within 1 year before DOD |
| 8 — Filing & Amnesty | None | If `priorReturnFiled = true`: `previouslyDeclaredNetEstate` required |

---

## 3. UI Design

### 3.1 Tab Navigation Header

The wizard renders as a full-page layout within the Case Editor (`/cases/:id/estate-tax`). The top of the page shows a horizontal tab bar with all 8 tabs. Completed tabs show a green checkmark. The current tab is highlighted. Future tabs are grayed.

```
┌────────────────────────────────────────────────────────────────────────────┐
│  ← Back to Inheritance Results          Estate Tax Wizard — [Case Title]   │
│  Auto-saved 2s ago                                                          │
├────────────────────────────────────────────────────────────────────────────┤
│ [✓ 1 Decedent] [✓ 2 Executor] [● 3 Real Props] [4 Personal] [5 Other]     │
│ [6 Deductions] [7 Spec. Ded.] [8 Filing]                                   │
│              ─────────────────────────── Step 3 of 8 ──────────────────── │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [  Tab content renders here  ]                                             │
│                                                                              │
├────────────────────────────────────────────────────────────────────────────┤
│  [← Back]                                  [Save Draft]  [Next: Personal →]│
└────────────────────────────────────────────────────────────────────────────┘
```

**Tab completion rules:**
- A tab shows `✓` when all required fields for that tab are valid AND the user has visited it.
- `●` = current tab.
- Tabs can be clicked directly (no enforced linear order) but clicking "Next" validates the current tab before advancing.
- "Save Draft" saves `tax_input_json` to DB immediately (no debounce) without running the engine.
- "Run Estate Tax" button appears only on Tab 8 (the final tab) and after all 8 tabs have been visited.

### 3.2 Tab 1: Decedent Details

Pre-populates from inheritance wizard. User can override any field.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  TAB 1 OF 8: DECEDENT DETAILS                                             │
│  Some fields have been pre-filled from your inheritance computation.      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Full Name (Last, First, Middle)           [pre-filled, editable]         │
│  [  Dela Cruz, Juan Andres Santos         ]                               │
│                                                                            │
│  Date of Death                             [pre-filled, editable]         │
│  [  2024-03-15  ]  ← YYYY-MM-DD                                          │
│                                                                            │
│  Citizenship                                                               │
│  [  Filipino                              ]  default: "Filipino"          │
│                                                                            │
│  ☐ Non-Resident Alien (NRA)                                               │
│     If checked: only Philippine-situs assets included in gross estate.    │
│                                                                            │
│  Address at Time of Death                                                  │
│  [  No. 14 Mabini St., Barangay San Antonio, Makati City, Metro Manila  ] │
│                                                                            │
│  Marital Status                                                            │
│  ◉ Single  ○ Married  ○ Widowed  ○ Legally Separated  ○ Annulled         │
│     [pre-selected from inheritance wizard is_married field]               │
│                                                                            │
│  Property Regime  [shows only when Marital Status = Married]              │
│  ◉ Absolute Community of Property (ACP)    ← default if married ≥ 1988   │
│  ○ Conjugal Partnership of Gains (CPG)     ← default if married < 1988   │
│  ○ Complete Separation of Property                                         │
│     Default is derived from date of marriage. Override if prenuptial.     │
│                                                                            │
│  ── FOR NRA DECEDENTS ONLY (shows when NRA checkbox is checked) ─────────│
│                                                                            │
│  Total Worldwide Gross Estate (₱)                                         │
│  [  ________________________  ]  Required if any ELIT declared in Tab 6  │
│                                                                            │
│  Total Worldwide ELIT — Claims Against Estate (₱)                         │
│  [  ________________________  ]                                           │
│                                                                            │
│  Total Worldwide ELIT — Claims vs Insolvent Persons (₱)                  │
│  [  ________________________  ]                                           │
│                                                                            │
│  Total Worldwide ELIT — Unpaid Mortgages (₱)                             │
│  [  ________________________  ]                                           │
│                                                                            │
│  Total Worldwide ELIT — Casualty Losses (₱)                              │
│  [  ________________________  ]                                           │
│                                                                            │
│  [shows only when NRA + dateOfDeath < 2018-01-01]                         │
│  Total Worldwide ELIT — Funeral Expenses (₱)                              │
│  [  ________________________  ]                                           │
│                                                                            │
│  Total Worldwide ELIT — Judicial/Admin Expenses (₱)                       │
│  [  ________________________  ]                                           │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

**Field details:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Full Name | text | Yes | Pre-populated from `inheritanceInput.decedent.name` |
| Date of Death | date (YYYY-MM-DD) | Yes | Pre-populated; cannot be future date |
| Citizenship | text | Yes | Default "Filipino"; common values shown as quick-select: Filipino, American, Chinese, Japanese |
| Non-Resident Alien | boolean toggle | No | When true: NRA section expands |
| Address | text (multiline) | Yes | Street, barangay, municipality, province |
| Marital Status | radio (5 options) | Yes | Pre-populated from `inheritanceInput.decedent.is_married` |
| Property Regime | radio (3 options) | When married | Default ACP if marriage ≥ 1988-08-03; CPG if earlier |
| Worldwide Gross Estate | number (₱) | When NRA + ELIT | In centavos; formatted as ₱ with comma separators |
| Worldwide ELIT — Claims Against Estate | number (₱) | When NRA + ELIT | Claims by creditors against the worldwide estate; in centavos |
| Worldwide ELIT — Claims vs Insolvent | number (₱) | When NRA + ELIT | Amount owed by insolvent debtors of the decedent; in centavos |
| Worldwide ELIT — Unpaid Mortgages | number (₱) | When NRA + ELIT | Outstanding mortgage balances on worldwide property at DOD |
| Worldwide ELIT — Casualty Losses | number (₱) | When NRA + ELIT | Losses from fire, theft, or other casualty not covered by insurance |
| Worldwide ELIT — Funeral Expenses | number (₱) | When NRA + PRE_TRAIN | Visible only if NRA and DOD < 2018-01-01 |
| Worldwide ELIT — Judicial/Admin | number (₱) | When NRA + PRE_TRAIN | Visible only if NRA and DOD < 2018-01-01 |

### 3.3 Tab 2: Executor

```
┌──────────────────────────────────────────────────────────────────────────┐
│  TAB 2 OF 8: EXECUTOR / ADMINISTRATOR                                     │
│  The person responsible for filing BIR Form 1801.                         │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Executor / Administrator Name  *                                          │
│  [  Santos, Maria Luisa Reyes                                           ]  │
│                                                                            │
│  Executor TIN  (optional)                                                  │
│  [  123-456-789-000  ]  ← NNN-NNN-NNN-NNN format                         │
│                                                                            │
│  Contact Number  (optional)                                                │
│  [  +63 917 555 1234   ]                                                  │
│                                                                            │
│  Email Address  (optional)                                                 │
│  [  msantos@reyeslaw.ph                                                 ]  │
│                                                                            │
│  ℹ  This information appears on BIR Form 1801 Part II (Executor Info).   │
│     The counsel/firm information is filled from your Firm Settings.        │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

**Field details:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Executor Name | text | Yes | Format: Last, First Middle; appears on BIR Form 1801 F10 |
| Executor TIN | text | No | Validate format NNN-NNN-NNN-NNN (regex: `^\d{3}-\d{3}-\d{3}-\d{3}$`); show inline format hint |
| Contact Number | text | No | No format constraint; accept +63 or 09 prefix |
| Email Address | text (email) | No | Standard email format validation |

### 3.4 Tab 3: Real Properties (Schedules 1 & 1A)

This tab handles both regular real properties (Schedule 1) and the family home (Schedule 1A). The family home is identified by the `isFamilyHome` toggle on any row — it does not need a separate section.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  TAB 3 OF 8: REAL PROPERTIES                                              │
│  Schedule 1 (regular real property) and Schedule 1A (family home).       │
│  Engine uses: FMV = max(BIR Zonal Value, Tax Declaration Assessed Value) │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │  No. 1                                                    [Remove] │   │
│  │                                                                     │   │
│  │  Title Number (OCT/TCT/CCT) *                                       │   │
│  │  [  TCT No. T-98765                                              ]  │   │
│  │                                                                     │   │
│  │  Tax Declaration Number *                                           │   │
│  │  [  TD-2021-04-0123                                              ]  │   │
│  │                                                                     │   │
│  │  Location *                                                         │   │
│  │  [  Lot 5 Block 2, Brgy. San Antonio, Makati City, Metro Manila  ] │   │
│  │                                                                     │   │
│  │  Lot Area (sq.m.)          Improvement Area (sq.m.)                │   │
│  │  [  250.00        ]        [  180.00                   ]           │   │
│  │                                                                     │   │
│  │  Classification                                                     │   │
│  │  ◉ Residential  ○ Commercial  ○ Agricultural  ○ Industrial         │   │
│  │                                                                     │   │
│  │  BIR Zonal Value (₱) *     Tax Declaration FMV (₱) *              │   │
│  │  [  8,500,000.00  ]        [  7,200,000.00             ]           │   │
│  │  Engine uses: ₱8,500,000.00 (higher value)                         │   │
│  │                                                                     │   │
│  │  Ownership                                                          │   │
│  │  ◉ Exclusive (Column A)  ○ Conjugal (Column B)                     │   │
│  │                                                                     │   │
│  │  ☐ This is the Family Home (Schedule 1A)                           │   │
│  │     [appears when checked:]                                         │   │
│  │     ☑ Barangay Certification obtained (required for FH deduction)  │   │
│  │                                                                     │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  [+ Add Another Real Property]                                             │
│                                                                            │
│  ── SUMMARY ──────────────────────────────────────────────────────────── │
│  Regular Real Property (Schedule 1):   Exclusive ₱8,500,000 | Conjugal ₱0│
│  Family Home (Schedule 1A):            Exclusive ₱0          | Conjugal ₱0│
│  Total Real Property:                  Exclusive ₱8,500,000 | Conjugal ₱0│
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

**Field details per row:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Title Number | text | Yes | OCT/TCT/CCT; shown on BIR schedules |
| Tax Declaration Number | text | Yes | Format: TD-YYYY-NN-NNNN or similar; informational |
| Location | text | Yes | Barangay, municipality, province |
| Lot Area | decimal (sq.m.) | No | Informational; not used in computation |
| Improvement Area | decimal (sq.m.) | No | Informational; not used in computation |
| Classification | radio (4 options) | Yes | Default: Residential |
| BIR Zonal Value (₱) | number | Yes | centavos internally; formatted with ₱ + commas |
| Tax Declaration FMV (₱) | number | Yes | centavos internally |
| FMV used by engine | computed display | — | Shows `max(fmvBir, fmvTaxDeclaration)` immediately below both fields |
| Ownership | radio (2) | Yes | Exclusive / Conjugal; Conjugal hidden if property regime = SEPARATION |
| Is Family Home | boolean | No | At most ONE row may have isFamilyHome = true; enforce in UI |
| Barangay Certification | boolean | When isFamilyHome | Warning shown if unchecked: "Family home deduction requires barangay certification" |

**Summary section:**
- Computed live from all rows
- Shows exclusive total, conjugal total per schedule
- Family home row highlighted with blue tag "Family Home (Sched. 1A)"

### 3.5 Tab 4: Personal Properties (Schedules 2 & 2A)

Two sub-sections: Schedule 2 (financial) and Schedule 2A (tangible personal property).

```
┌──────────────────────────────────────────────────────────────────────────┐
│  TAB 4 OF 8: PERSONAL PROPERTIES                                          │
│  Schedule 2: Financial assets · Schedule 2A: Tangible personal property  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ── SCHEDULE 2: FINANCIAL PERSONAL PROPERTY ─────────────────────────── │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │  No. 1                                                    [Remove] │   │
│  │                                                                     │   │
│  │  Category                                                           │   │
│  │  [  Cash in Bank                        ▼]  ← select               │   │
│  │  Options: Cash on Hand / Cash in Bank / Accounts Receivable /      │   │
│  │           Notes Receivable / Listed Shares / Unlisted Shares /     │   │
│  │           Bonds / Mutual Funds                                      │   │
│  │                                                                     │   │
│  │  Description *                                                      │   │
│  │  [  BDO Savings Account No. 012-3456789-0                       ]  │   │
│  │                                                                     │   │
│  │  Fair Market Value (₱) *                Ownership                  │   │
│  │  [  450,000.00             ]            ◉ Exclusive  ○ Conjugal    │   │
│  │                                                                     │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  [+ Add Financial Asset]                                                   │
│                                                                            │
│  ── SCHEDULE 2A: TANGIBLE PERSONAL PROPERTY ─────────────────────────── │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │  No. 1                                                    [Remove] │   │
│  │                                                                     │   │
│  │  Category                                                           │   │
│  │  [  Motor Vehicle                       ▼]                         │   │
│  │  Options: Motor Vehicle / Jewelry / Other Tangible Property        │   │
│  │                                                                     │   │
│  │  Description *                                                      │   │
│  │  [  2019 Toyota Vios 1.3L, Plate No. ABC 123                    ]  │   │
│  │                                                                     │   │
│  │  Quantity     Fair Market Value (₱) *      Ownership               │   │
│  │  [  1       ] [  480,000.00         ]      ◉ Exclusive  ○ Conjugal │   │
│  │                                                                     │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  [+ Add Tangible Asset]                                                    │
│                                                                            │
│  ── SUMMARY ──────────────────────────────────────────────────────────── │
│  Schedule 2 (Financial):   Exclusive ₱450,000 | Conjugal ₱0             │
│  Schedule 2A (Tangible):   Exclusive ₱480,000 | Conjugal ₱0             │
│  Total Personal Property:  Exclusive ₱930,000 | Conjugal ₱0             │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

**Financial asset fields (per row):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Category | select (8 options) | Yes | Maps to `FinancialSubtype` enum |
| Description | text | Yes | Account numbers, CUSIP, certificate numbers |
| FMV (₱) | number | Yes | centavos; formatted with commas |
| Ownership | radio (2) | Yes | Conjugal hidden if property regime = SEPARATION |

**Tangible asset fields (per row):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Category | select (3 options) | Yes | Motor Vehicle / Jewelry / Other Tangible Property |
| Description | text | Yes | For vehicles: make, model, year, plate number |
| Quantity | integer | Yes | Default 1 |
| FMV (₱) | number | Yes | Total FMV for all units of this row |
| Ownership | radio (2) | Yes | Conjugal (Column B) or Exclusive (Column C); Conjugal hidden if SEPARATION regime |

### 3.6 Tab 5: Other Assets (Schedules 3, 4, and Sec. 87 Exempt)

Three sub-sections: taxable transfers, business interests, and Sec. 87 exempt assets (excluded from gross estate).

```
┌──────────────────────────────────────────────────────────────────────────┐
│  TAB 5 OF 8: OTHER ASSETS                                                 │
│  Schedule 3: Taxable transfers · Schedule 4: Business interests           │
│  Sec. 87 Exempt: excluded assets (not counted in gross estate)            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ── SCHEDULE 3: TAXABLE TRANSFERS (Sec. 85 NIRC) ───────────────────── │
│  Transfers within 3 years of death, revocable, POA, life insurance.      │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │  No. 1                                                    [Remove] │   │
│  │                                                                     │   │
│  │  Transfer Type *                                                    │   │
│  │  [  Contemplation of Death (Sec. 85B)   ▼]                        │   │
│  │  Options: Contemplation of Death / Revocable Transfer /            │   │
│  │           Power of Appointment / Life Insurance /                  │   │
│  │           Insufficient Consideration                               │   │
│  │                                                                     │   │
│  │  Description *                                                      │   │
│  │  [  Lot in Quezon City donated to daughter in 2022                ]│   │
│  │                                                                     │   │
│  │  Date of Transfer *        FMV at Date of Death (₱) *              │   │
│  │  [  2022-08-10           ] [  3,500,000.00                       ] │   │
│  │                                                                     │   │
│  │  Consideration Received (₱)       Taxable Amount (computed)        │   │
│  │  [  0.00                        ] ₱3,500,000.00                   │   │
│  │                                                                     │   │
│  │  Ownership                                                          │   │
│  │  ◉ Exclusive (Column A)  ○ Conjugal (Column B)                     │   │
│  │                                                                     │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  [+ Add Taxable Transfer]                                                  │
│                                                                            │
│  ── SCHEDULE 4: BUSINESS INTERESTS ─────────────────────────────────── │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │  No. 1                                                    [Remove] │   │
│  │                                                                     │   │
│  │  Business Name *                                                    │   │
│  │  [  JDC General Merchandise                                     ]  │   │
│  │                                                                     │   │
│  │  Nature of Business *                                               │   │
│  │  [  Single proprietorship — sari-sari store, Makati City        ]  │   │
│  │                                                                     │   │
│  │  Net Equity (₱) *               Ownership                          │   │
│  │  [  750,000.00       ]          ◉ Exclusive  ○ Conjugal            │   │
│  │                                                                     │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  [+ Add Business Interest]                                                 │
│                                                                            │
│  ── SEC. 87 EXEMPT ASSETS (excluded from gross estate) ─────────────── │
│  These are not counted in the gross estate. Enter for audit trail only.   │
│  Exemption types: usufruct merger, fiduciary transmission,                │
│  fideicommissary substitution, charitable private transfers.              │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │  No. 1                                                    [Remove] │   │
│  │                                                                     │   │
│  │  Description *                   Exemption Type *                  │   │
│  │  [  Life estate from mother   ]  [  Usufruct Merger   ▼]          │   │
│  │                                  Options: Usufruct Merger /        │   │
│  │                                  Fiduciary / Fideicommissary /     │   │
│  │                                  Charitable Private                │   │
│  │                                                                     │   │
│  │  FMV (₱)  (for audit trail only — not included in gross estate)   │   │
│  │  [  1,200,000.00   ]                                               │   │
│  │                                                                     │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  [+ Add Exempt Asset]                                                      │
│                                                                            │
│  ── SUMMARY ──────────────────────────────────────────────────────────── │
│  Schedule 3 (Taxable Transfers): Exclusive ₱3,500,000 | Conjugal ₱0     │
│  Schedule 4 (Business Interests): Exclusive ₱750,000 | Conjugal ₱0      │
│  Sec. 87 Exempt (excluded):       ₱1,200,000 (not in gross estate)       │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

**Taxable transfer fields (per row):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Transfer Type | select (5 options) | Yes | Maps to `TaxableTransferType` |
| Description | text | Yes | Nature of the asset transferred |
| Date of Transfer | date | Yes | ISO date; must be ≤ DOD |
| FMV at Death (₱) | number | Yes | centavos |
| Consideration Received (₱) | number | Yes | Default 0 |
| Taxable Amount | computed display | — | `max(0, fmvAtDeath − considerationReceived)` shown live |
| Ownership | radio (2) | Yes | Conjugal or Exclusive; only exclusive transfers are includible under Sec. 85(B) NIRC |

**Business interest fields (per row):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Business Name | text | Yes | Trade name or corporate name as registered with SEC/DTI |
| Nature | text | Yes | Single proprietorship, partnership shares, corporate shares |
| Net Equity (₱) | number | Yes | Engine floors at 0 if negative |
| Ownership | radio (2) | Yes | Conjugal or Exclusive; conjugal hidden if SEPARATION regime |

**Sec. 87 exempt asset fields (per row):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Description | text | Yes | Asset name or description (e.g., "GSIS life insurance policy", "SSS benefit receivable") |
| Exemption Type | select (4) | Yes | Maps to `Sec87ExemptAsset.exemptionType` |
| FMV (₱) | number | No | For audit trail only; shown with "(not counted)" label |

### 3.7 Tab 6: Ordinary Deductions (Schedule 5A–5H)

Eight sub-sections. Sections 5G (funeral) and 5H (judicial/admin) are conditionally hidden for TRAIN regime estates.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  TAB 6 OF 8: ORDINARY DEDUCTIONS                                          │
│  Schedule 5A through 5H. Some sections are only available for estates     │
│  with date of death before January 1, 2018 (PRE-TRAIN regime).           │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ── 5A: CLAIMS AGAINST THE ESTATE ──────────────────────────────────── │
│  Debts and obligations of the decedent as of the date of death.           │
│                                                                            │
│  ┌───────────────────────────────────────────────────────────────┐        │
│  │  Description *           Amount (₱) *    Ownership            │        │
│  │  [SSS loan balance  ]  [ 85,000.00  ]   ◉ Exclusive ○ Conjugal│       │
│  │  [Credit card debt  ]  [ 45,000.00  ]   ○ Exclusive ◉ Conjugal│       │
│  └───────────────────────────────────────────────────────────────┘        │
│  [+ Add Claim Against Estate]                                              │
│  Subtotal 5A: Exclusive ₱85,000 | Conjugal ₱45,000                       │
│                                                                            │
│  ── 5B: CLAIMS AGAINST INSOLVENT PERSONS ───────────────────────────── │
│  Receivables from insolvent persons included in gross estate.             │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────┐      │
│  │  Description *   In Gross Estate (₱) *  Uncollectible (₱) *    │      │
│  │  [Loan to Pedro ] [ 200,000.00        ] [ 200,000.00       ]    │      │
│  │  Ownership: ◉ Exclusive  ○ Conjugal                             │      │
│  └─────────────────────────────────────────────────────────────────┘      │
│  [+ Add Insolvent Claim]                                                   │
│  Subtotal 5B: Exclusive ₱200,000 | Conjugal ₱0                           │
│                                                                            │
│  ── 5C: UNPAID MORTGAGES AND TAXES ─────────────────────────────────── │
│                                                                            │
│  MORTGAGES                                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐      │
│  │  Description *          ☑ Property in estate?  Amount (₱) *    │      │
│  │  [Metrobank home loan]  ☑ Yes                  [ 2,300,000.00 ]│      │
│  │  Ownership: ◉ Exclusive  ○ Conjugal                             │      │
│  └─────────────────────────────────────────────────────────────────┘      │
│  [+ Add Unpaid Mortgage]                                                   │
│                                                                            │
│  TAXES OWING AS OF DATE OF DEATH                                           │
│  ┌─────────────────────────────────────────────────────────────────┐      │
│  │  Description *                           Amount (₱) *           │      │
│  │  [Real property tax 2024 1st quarter ]  [ 12,500.00         ]   │      │
│  │  Ownership: ◉ Exclusive  ○ Conjugal                             │      │
│  └─────────────────────────────────────────────────────────────────┘      │
│  [+ Add Unpaid Tax]                                                        │
│  ⚠  Do not include the estate tax itself as an unpaid tax.               │
│  Subtotal 5C: Exclusive ₱2,312,500 | Conjugal ₱0                         │
│                                                                            │
│  ── 5D: CASUALTY LOSSES ────────────────────────────────────────────── │
│  Losses from fire, theft, typhoon, etc. occurring after death but before  │
│  filing (NIRC Sec. 86A4).                                                 │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────┐      │
│  │  Description *     Gross Loss (₱) *   Insurance Recovery (₱) * │      │
│  │  [Fire — bodega ] [ 500,000.00    ]  [ 0.00               ]    │      │
│  │  Net Loss: ₱500,000  Ownership: ◉ Exclusive ○ Conjugal         │      │
│  └─────────────────────────────────────────────────────────────────┘      │
│  [+ Add Casualty Loss]                                                     │
│  Subtotal 5D: Exclusive ₱500,000 | Conjugal ₱0                           │
│                                                                            │
│  ── 5E: VANISHING DEDUCTION ────────────────────────────────────────── │
│  Property received as inheritance/gift within the past 5 years.           │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────┐      │
│  │  Description *                        Prior Transfer Type        │      │
│  │  [Condominium unit — Makati         ] ◉ Inheritance ○ Gift      │      │
│  │                                                                   │      │
│  │  Date of Prior Transfer *   FMV at Prior Transfer (₱) *         │      │
│  │  [  2021-06-20            ] [  4,200,000.00                 ]   │      │
│  │                                                                   │      │
│  │  FMV at Decedent's DOD (₱) *   Mortgage on Property (₱) *       │      │
│  │  [  4,800,000.00            ]  [  0.00                     ]    │      │
│  │                                                                   │      │
│  │  ☑ Prior tax (estate tax or donor's tax) was paid               │      │
│  │                                                                   │      │
│  │  [NRA only] ☑ Property is Philippine-situs                       │      │
│  │                                                                   │      │
│  │  Ownership: ◉ Exclusive  ○ Conjugal                              │      │
│  │                                                                   │      │
│  │  Years elapsed: 5 → Rate: 20%  Vanishing deduction: ₱840,000    │      │
│  │  (computed live: min(priorFMV, currentFMV) × 0.20)              │      │
│  └─────────────────────────────────────────────────────────────────┘      │
│  [+ Add Vanishing Deduction Property]                                      │
│  Subtotal 5E: Exclusive ₱840,000 | Conjugal ₱0                           │
│                                                                            │
│  ── 5F: TRANSFERS FOR PUBLIC USE ───────────────────────────────────── │
│  Bequest/devise to PH government or qualified institutions.               │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────┐      │
│  │  Description *          Recipient (PH gov't entity) *           │      │
│  │  [Land donation      ]  [Quezon City Government             ]   │      │
│  │  Amount (₱) *           Ownership                               │      │
│  │  [  1,500,000.00    ]  ◉ Exclusive  ○ Conjugal                 │      │
│  └─────────────────────────────────────────────────────────────────┘      │
│  [+ Add Public Use Transfer]                                               │
│  Subtotal 5F: Exclusive ₱1,500,000 | Conjugal ₱0                         │
│                                                                            │
│  ── 5G: FUNERAL EXPENSES  [PRE-TRAIN ONLY — DOD before Jan 1, 2018] ─── │
│  [Section hidden if dateOfDeath ≥ 2018-01-01]                             │
│                                                                            │
│  Actual Funeral Expenses (₱) *                                             │
│  [  85,000.00  ]                                                           │
│  ℹ  Deductible amount = min(actual, 5% × gross estate). Computed by engine│
│                                                                            │
│  ── 5H: JUDICIAL AND ADMINISTRATIVE EXPENSES [PRE-TRAIN ONLY] ─────── │
│  [Section hidden if dateOfDeath ≥ 2018-01-01]                             │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────┐      │
│  │  Description *                 Amount (₱) *      Ownership      │      │
│  │  [Notarial fees — EJS       ]  [  15,000.00  ]  ◉ Excl ○ Conj  │      │
│  │  [Newspaper publication fee ]  [   8,400.00  ]  ◉ Excl ○ Conj  │      │
│  └─────────────────────────────────────────────────────────────────┘      │
│  [+ Add Judicial/Admin Expense]                                            │
│  Subtotal 5H: Exclusive ₱23,400 | Conjugal ₱0                            │
│                                                                            │
│  ── TOTAL ORDINARY DEDUCTIONS (Item 35) ───────────────────────────── │
│  Exclusive: ₱5,537,500  |  Conjugal: ₱45,000  |  Total: ₱5,582,500      │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

**Section 5A — Claims Against Estate, per row:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Description | text | Yes | Creditor name, loan type |
| Amount (₱) | number | Yes | centavos |
| Ownership | radio (2) | Yes | Conjugal hidden if SEPARATION regime |

**Section 5B — Claims vs Insolvent, per row:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Description | text | Yes | Name of insolvent debtor |
| Amount in Gross Estate (₱) | number | Yes | Must match an asset row in Tabs 3 or 4 |
| Uncollectible Amount (₱) | number | Yes | Deductible portion; ≤ amountInGrossEstate |
| Ownership | radio (2) | Yes | Conjugal or Exclusive; conjugal hidden if SEPARATION regime |

**Section 5C — Mortgages, per row:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Description | text | Yes | Bank name, loan type |
| Property in Estate | boolean | Yes | Warning if false: "Deduction only applies if property is in the estate" |
| Amount (₱) | number | Yes | Outstanding balance at DOD |
| Ownership | radio (2) | Yes | Conjugal mortgage = full balance in Column B |

**Section 5C — Taxes Owing, per row:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Description | text | Yes | Tax type, period |
| Amount (₱) | number | Yes | Taxes accrued and unpaid at DOD (e.g., income tax for prior year) |
| Ownership | radio (2) | Yes | Conjugal or Exclusive; conjugal hidden if SEPARATION regime |

**Section 5D — Casualty Losses, per row:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Description | text | Yes | Type of loss, cause |
| Gross Loss (₱) | number | Yes | Fair market value of loss before insurance recovery |
| Insurance Recovery (₱) | number | Yes | Default 0 |
| Net Loss | computed display | — | `max(0, grossLoss − insuranceRecovery)` shown live |
| Ownership | radio (2) | Yes | Conjugal or Exclusive; conjugal hidden if SEPARATION regime |

**Section 5E — Vanishing Deduction, per row:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Description | text | Yes | Property name |
| Prior Transfer Type | radio (2) | Yes | Inheritance / Gift |
| Date of Prior Transfer | date | Yes | Must be ≤ DOD; years elapsed computed live |
| Prior FMV (₱) | number | Yes | FMV at time of prior inheritance/gift |
| FMV at Decedent's DOD (₱) | number | Yes | Current FMV used to cap the deductible amount at the lower of prior or current FMV |
| Mortgage on Property (₱) | number | Yes | Default 0; should also appear in 5C |
| Prior Tax Paid | boolean | Yes | Warning shown if false: "Vanishing deduction requires prior estate/donor's tax was paid" |
| Philippine Situs | boolean | When NRA | Hidden for non-NRA decedents |
| Ownership | radio (2) | Yes | Conjugal or Exclusive; conjugal hidden if SEPARATION regime |
| Computed deduction | display | — | `min(priorFMV, currentFMV) × VD_PCT[years]` shown live; years table: 1→100%, 2→80%, 3→60%, 4→40%, 5→20%, >5→0% |

**Section 5F — Public Use Transfers, per row:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Description | text | Yes | Nature of bequest |
| Recipient | text | Yes | PH government entity name |
| Amount (₱) | number | Yes | Amount bequeathed to the government entity; must be ≤ net estate |
| Ownership | radio (2) | Yes | Conjugal or Exclusive; conjugal hidden if SEPARATION regime |

**Section 5G — Funeral Expenses (PRE_TRAIN only):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Actual Amount (₱) | number | Yes (when section visible) | Engine applies `min(actual, 5% × grossEstate)` |

**Section 5H — Judicial/Admin Expenses (PRE_TRAIN only), per row:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Description | text | Yes | Nature of expense (e.g., "Attorney's fees for estate settlement", "Court filing fees") |
| Amount (₱) | number | Yes | Actual amount paid or payable; must be supported by receipts |
| Ownership | radio (2) | Yes | Conjugal or Exclusive; conjugal hidden if SEPARATION regime |

### 3.8 Tab 7: Special Deductions (Schedule 6)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  TAB 7 OF 8: SPECIAL DEDUCTIONS                                           │
│  Standard deduction (computed automatically) · Medical expenses ·         │
│  RA 4917 retirement benefits · Foreign tax credits                        │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ── STANDARD DEDUCTION (Item 37A) ─────────────────────────────────── │
│  Computed automatically. No user input required.                          │
│                                                                            │
│  ╔══════════════════════════════════════════════════════════════════╗      │
│  ║  Standard Deduction (TRAIN, Filipino citizen):  ₱5,000,000.00  ║      │
│  ║  [Changes to ₱1,000,000 if DOD before Jan 1, 2018]             ║      │
│  ║  [Changes to ₱500,000 for NRA decedents under any regime]      ║      │
│  ╚══════════════════════════════════════════════════════════════════╝      │
│                                                                            │
│  ── FAMILY HOME DEDUCTION (Item 37B) ──────────────────────────────── │
│  Computed from Schedule 1A. No user input required here.                  │
│                                                                            │
│  ╔══════════════════════════════════════════════════════════════════╗      │
│  ║  Family Home FMV (from Tab 3, Schedule 1A): ₱8,500,000.00      ║      │
│  ║  Family Home Deduction (TRAIN cap ₱10,000,000): ₱8,500,000.00  ║      │
│  ║  Barangay Certification: ✓ Obtained                             ║      │
│  ╚══════════════════════════════════════════════════════════════════╝      │
│                                                                            │
│  ── MEDICAL EXPENSES (Item 37C) ────────────────────────────────────── │
│  Medical expenses incurred within 1 year before date of death.            │
│  Capped at ₱500,000 total (NIRC Sec. 86A6).                              │
│                                                                            │
│  ☐ No medical expenses to declare                                         │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────┐      │
│  │  No. 1                                                  [Remove] │      │
│  │                                                                   │      │
│  │  Description *                                                    │      │
│  │  [  Chemotherapy — St. Luke's Medical Center               ]     │      │
│  │                                                                   │      │
│  │  Date of Expense *          Amount (₱) *                         │      │
│  │  [  2024-02-28            ] [  185,000.00                  ]     │      │
│  │  ✓ Within 1 year before Mar 15, 2024                             │      │
│  └─────────────────────────────────────────────────────────────────┘      │
│                                                                            │
│  [+ Add Medical Expense]                                                   │
│                                                                            │
│  Running total: ₱185,000  |  Cap: ₱500,000  |  ₱315,000 remaining        │
│  Deductible amount (after cap): ₱185,000                                  │
│                                                                            │
│  ── RA 4917 RETIREMENT BENEFITS (Item 37D) ─────────────────────────── │
│  Death benefit from BIR-approved private employer qualified plan.         │
│  Must also appear as asset in Schedule 2 (Personal Properties Financial). │
│                                                                            │
│  ☐ No RA 4917 benefits to declare                                         │
│                                                                            │
│  [shows when unchecked:]                                                   │
│  Employer Name *                                                           │
│  [  JG Summit Holdings Inc.                                            ]  │
│                                                                            │
│  Benefit Amount (₱) *                                                      │
│  [  250,000.00  ]                                                         │
│  ⚠  This amount must also appear in Schedule 2 (Exclusive column).       │
│                                                                            │
│  ── FOREIGN TAX CREDITS ─────────────────────────────────────────────── │
│  Available for Filipino citizens and PH residents with foreign property.  │
│  [Section hidden for NRA decedents]                                       │
│                                                                            │
│  ☐ No foreign estate tax paid                                             │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────┐      │
│  │  No. 1                                                  [Remove] │      │
│  │                                                                   │      │
│  │  Country *               Foreign Tax Paid (₱ equiv.) *           │      │
│  │  [  United States     ]  [  45,000.00                       ]    │      │
│  │                                                                   │      │
│  │  FMV of Foreign Property in PH Estate (₱) *                      │      │
│  │  [  3,500,000.00   ]                                              │      │
│  └─────────────────────────────────────────────────────────────────┘      │
│                                                                            │
│  [+ Add Foreign Tax Credit]                                                │
│                                                                            │
│  ── SUMMARY (Item 37 — Total Special Deductions) ──────────────────── │
│  Standard Deduction (37A):       ₱5,000,000                              │
│  Family Home Deduction (37B):    ₱8,500,000                              │
│  Medical Expenses (37C):         ₱185,000                                │
│  RA 4917 Benefits (37D):         ₱250,000                                │
│  Total Special Deductions (37):  ₱13,935,000                             │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

**Medical expense fields (per row):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Description | text | Yes | Service description, hospital/clinic name |
| Date of Expense | date | Yes | Must be within 1 year before DOD; validation feedback shown inline |
| Amount (₱) | number | Yes | centavos; running total with cap indicator shown |

**RA 4917 Benefits fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Employer Name | text | Yes | Name of the employer as it appears on the SSS/GSIS or private retirement plan document |
| Benefit Amount (₱) | number | Yes | Must also appear in Schedule 2 |

**Foreign Tax Credit fields (per row):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Country | text | Yes | Country where foreign estate tax was paid |
| Foreign Tax Paid (₱ equiv.) | number | Yes | Converted to PHP at DOD exchange rate (user provides the converted amount) |
| FMV of Foreign Property (₱) | number | Yes | For proportional credit cap computation |

### 3.9 Tab 8: Filing & Amnesty

```
┌──────────────────────────────────────────────────────────────────────────┐
│  TAB 8 OF 8: FILING FLAGS & AMNESTY                                       │
│  Filing information for BIR Form 1801. Amnesty election (RA 11213).      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ── FILING INFORMATION ────────────────────────────────────────────── │
│                                                                            │
│  ☐ This is an AMENDED return (previously filed a return for this estate) │
│  ☐ Extension to file granted (BIR extension letter obtained)             │
│  ☐ Extension to pay granted (paid in installments, BIR approval)         │
│  ☐ Installment payment plan granted (NIRC Sec. 91)                       │
│  ☐ This is a judicial settlement (probate case pending)                  │
│  ☐ Tax relief applicable (RA 9504, etc.)                                 │
│                                                                            │
│  ── REGIME DETECTION (informational) ──────────────────────────────── │
│  ╔══════════════════════════════════════════════════════════════════╗      │
│  ║  Date of Death: March 15, 2024                                  ║      │
│  ║  Regime: TRAIN (death on or after January 1, 2018)              ║      │
│  ║  Rate: 6% flat on Net Taxable Estate                            ║      │
│  ║  Standard Deduction: ₱5,000,000 (citizen/resident)             ║      │
│  ║  Family Home Cap: ₱10,000,000                                  ║      │
│  ║  Funeral/Judicial Expenses: Not deductible (TRAIN)              ║      │
│  ╚══════════════════════════════════════════════════════════════════╝      │
│                                                                            │
│  ── ESTATE TAX AMNESTY (RA 11213, as amended by RA 11956) ─────────── │
│  [Section only active if DOD ≤ May 31, 2022]                             │
│                                                                            │
│  [Shows "NOT ELIGIBLE" banner when DOD > 2022-05-31:]                    │
│  ╔══════════════════════════════════════════════════════════════════╗      │
│  ║  ⚠  Amnesty Not Available                                       ║      │
│  ║  Date of death is after May 31, 2022. RA 11213 amnesty coverage ║      │
│  ║  ended June 14, 2025. This estate must file under regular TRAIN  ║      │
│  ║  rules.                                                          ║      │
│  ╚══════════════════════════════════════════════════════════════════╝      │
│                                                                            │
│  [Shows amnesty section when DOD ≤ 2022-05-31:]                          │
│                                                                            │
│  ☐ Has the estate tax already been FULLY PAID before May 2022?           │
│     (If yes, amnesty is not available for this estate)                    │
│                                                                            │
│  ☐ Was a prior estate tax return filed for this estate?                  │
│     [shows when checked:]                                                  │
│     Previously Declared Net Taxable Estate (₱)                            │
│     [  ________________________  ]  (required for Track B computation)   │
│                                                                            │
│  ☐ I elect to avail of the Estate Tax Amnesty under RA 11213             │
│                                                                            │
│  [Six exclusion checks — shows only when amnesty is elected:]             │
│                                                                            │
│  ℹ  Estates with any of the following are INELIGIBLE for amnesty:        │
│                                                                            │
│  ☐ Estate is subject to PCGG jurisdiction (RA 1379 / ill-gotten wealth)  │
│  ☐ Decedent had violations of RA 3019 (Anti-Graft and Corrupt Practices) │
│  ☐ Decedent had violations of RA 9160 (Anti-Money Laundering Act)        │
│  ☐ A court case was filed before February 14, 2019 for this estate       │
│  ☐ Decedent has unexplained wealth cases pending                         │
│  ☐ Decedent has pending RPC criminal felony cases                        │
│                                                                            │
│  [If any above is checked → show:]                                        │
│  ✗  This estate is INELIGIBLE for amnesty. Computation will use regular   │
│     TRAIN / PRE_TRAIN rates.                                              │
│                                                                            │
│  ── PROFESSIONAL OVERRIDE ─────────────────────────────────────────── │
│  ☐ Use narrow amnesty deductions (for attorneys who prefer conservative  │
│    interpretation limiting deductions to ELIT only under amnesty)         │
│                                                                            │
│  ────────────────────────────────────────────────────────────────────── │
│                                                                            │
│  [← Back: Special Deductions]        [Save Draft]  [▶ Run Estate Tax]   │
│                                                                            │
│  ℹ  Running the computation will calculate BIR Form 1801 amounts and     │
│     update the net distributable estate for the inheritance distribution. │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

**Filing flags:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Is Amended Return | boolean | No | Default false |
| Extension to File | boolean | No | Default false |
| Extension to Pay | boolean | No | Default false |
| Installment Granted | boolean | No | Default false |
| Judicial Settlement | boolean | No | Default false; causes additional warning in engine output |
| Tax Relief | boolean | No | Default false |

**Amnesty fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Tax Fully Paid Before May 2022 | boolean | No | If true → amnesty ineligible; default false |
| Prior Return Filed | boolean | No | If true → Track B; otherwise Track A |
| Previously Declared Net Estate (₱) | number | When prior return filed | centavos |
| Elect Amnesty | boolean | No | Only shown when DOD ≤ 2022-05-31 |
| Six RA 11213 Sec. 9 exclusion flags | boolean each | When amnesty elected | Any true → amnesty blocked |
| Narrow Amnesty Deductions | boolean | No | Professional override; default false |

### 3.10 Running the Estate Tax Engine

When the user clicks "Run Estate Tax" on Tab 8:

1. UI validates all tabs (show error highlighting on any tab with incomplete required fields).
2. If all tabs valid: trigger WASM estate tax engine call via bridge function.
3. Show loading state: "Computing estate tax…" spinner overlays the button.
4. On success: navigate to Estate Tax Results view (specified in `spec-bir-1801-integration.md`).
5. On WASM error: show toast notification with engine error message; remain on Tab 8.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [▶ Run Estate Tax]                                                        │
│                                                                            │
│  [Validation error state:]                                                 │
│  ✗  Please complete required fields before running:                       │
│     • Tab 1: Address is required                                           │
│     • Tab 2: Executor name is required                                     │
│                                                                            │
│  [Loading state:]                                                          │
│  ◌  Computing estate tax…                                                 │
│                                                                            │
│  [Error state:]                                                            │
│  ✗  Computation failed: Invalid date of death format in decedent record.  │
│     Please correct and try again.                                          │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. API / Data Layer

### 4.1 Wizard State Storage

The wizard auto-saves `EstateTaxWizardState` to `cases.tax_input_json` using the same debounced save pattern as the inheritance wizard, with a 2000ms debounce (slightly longer than the 1500ms inheritance debounce to avoid conflict when both wizards could theoretically be dirty at the same time).

```typescript
// lib/estateTax.ts

import { supabase } from './supabase'
import type { EstateTaxWizardState } from '@/types/estate-tax'

export async function saveEstateTaxInput(
  caseId: string,
  wizardState: EstateTaxWizardState
): Promise<void> {
  const { error } = await supabase
    .from('cases')
    .update({
      tax_input_json: wizardState as unknown as Json,
    })
    .eq('id', caseId)

  if (error) throw error
}

export async function loadEstateTaxInput(
  caseId: string
): Promise<EstateTaxWizardState | null> {
  const { data, error } = await supabase
    .from('cases')
    .select('tax_input_json')
    .eq('id', caseId)
    .single()

  if (error) throw error
  return (data?.tax_input_json as EstateTaxWizardState) ?? null
}

export async function saveEstateTaxOutput(
  caseId: string,
  output: EstateTaxEngineOutput,
  netDistributableEstate: number
): Promise<void> {
  const { error } = await supabase
    .from('cases')
    .update({
      tax_output_json: output as unknown as Json,
      estate_tax_computed: true,
      net_distributable_estate: netDistributableEstate,
      net_estate_auto_populated: true,
    })
    .eq('id', caseId)

  if (error) throw error
}
```

### 4.2 Auto-Save Hook for Estate Tax Wizard

```typescript
// hooks/useEstateTaxAutoSave.ts
import { useEffect, useRef, useState } from 'react'
import { saveEstateTaxInput } from '@/lib/estateTax'
import type { EstateTaxWizardState } from '@/types/estate-tax'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const h = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(h)
  }, [value, delay])
  return debounced
}

export function useEstateTaxAutoSave(
  caseId: string | null,
  wizardState: EstateTaxWizardState | null,
  enabled: boolean
): SaveStatus {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const debouncedState = useDebounce(wizardState, 2000)
  const isFirst = useRef(true)

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return }
    if (!enabled || !caseId || !debouncedState) return

    setStatus('saving')
    saveEstateTaxInput(caseId, debouncedState)
      .then(() => {
        setStatus('saved')
        setTimeout(() => setStatus('idle'), 2000)
      })
      .catch(() => setStatus('error'))
  }, [debouncedState, caseId, enabled])

  return status
}
```

### 4.3 WASM Estate Tax Engine Bridge

The estate tax engine is a separate WASM module from the inheritance engine. The bridge function converts `EstateTaxWizardState` to the engine's input format and returns `EstateTaxEngineOutput`.

```typescript
// wasm/estate-tax-bridge.ts

import init, { compute_estate_tax } from '@/wasm/estate_tax_engine'

let initialized = false

async function ensureInit() {
  if (!initialized) {
    await init()
    initialized = true
  }
}

export async function runEstateTaxEngine(
  input: EstateTaxWizardState
): Promise<EstateTaxEngineOutput> {
  await ensureInit()

  // Convert centavo integers to Pesos decimals for Rust engine
  // (engine accepts Pesos as f64 strings to avoid float precision issues)
  const engineInput = convertWizardStateToEngineInput(input)

  const rawOutput = compute_estate_tax(JSON.stringify(engineInput))
  const output: EstateTaxEngineOutput = JSON.parse(rawOutput)

  if (output.error) {
    throw new Error(output.error)
  }

  return output
}

// Bridge formula: net distributable estate
export function computeNetDistributableEstate(
  output: EstateTaxEngineOutput
): number {
  // centavos; max(0, Item40 - Item44)
  const item40 = output.taxComputation.netTaxableEstate  // centavos
  const item44 = output.taxComputation.netEstateTaxDue   // centavos
  return Math.max(0, item40 - item44)
}
```

### 4.4 Tab Validation Functions

```typescript
// lib/estateTaxValidation.ts
import type { EstateTaxWizardState } from '@/types/estate-tax'

export interface TabValidationResult {
  valid: boolean
  errors: string[]
}

export function validateTab1(state: EstateTaxWizardState): TabValidationResult {
  const errors: string[] = []
  const d = state.decedent

  if (!d.name.trim()) errors.push('Full name is required')
  if (!d.dateOfDeath) errors.push('Date of death is required')
  else if (d.dateOfDeath > new Date().toISOString().slice(0, 10))
    errors.push('Date of death cannot be in the future')
  if (!d.address.trim()) errors.push('Address is required')
  if (!d.citizenship.trim()) errors.push('Citizenship is required')
  if (!d.maritalStatus) errors.push('Marital status is required')
  if (d.maritalStatus === 'MARRIED' && !d.propertyRegime)
    errors.push('Property regime is required for married decedents')

  return { valid: errors.length === 0, errors }
}

export function validateTab2(state: EstateTaxWizardState): TabValidationResult {
  const errors: string[] = []
  if (!state.executor.name.trim()) errors.push('Executor name is required')
  if (state.executor.tin && !/^\d{3}-\d{3}-\d{3}-\d{3}$/.test(state.executor.tin))
    errors.push('TIN format must be NNN-NNN-NNN-NNN')
  return { valid: errors.length === 0, errors }
}

export function validateTab3(state: EstateTaxWizardState): TabValidationResult {
  const errors: string[] = []
  const familyHomeCount = state.realProperties.filter(p => p.isFamilyHome).length
  if (familyHomeCount > 1) errors.push('Only one family home may be declared')
  state.realProperties.forEach((p, i) => {
    if (!p.titleNumber.trim()) errors.push(`Property ${i + 1}: title number required`)
    if (!p.taxDeclarationNumber.trim()) errors.push(`Property ${i + 1}: tax declaration number required`)
    if (!p.location.trim()) errors.push(`Property ${i + 1}: location required`)
    if (p.fmvBir <= 0 && p.fmvTaxDeclaration <= 0)
      errors.push(`Property ${i + 1}: at least one FMV value required`)
  })
  return { valid: errors.length === 0, errors }
}

export function validateTab8(state: EstateTaxWizardState): TabValidationResult {
  const errors: string[] = []
  if (state.estateFlags.priorReturnFiled &&
      (state.estateFlags.previouslyDeclaredNetEstate === null ||
       state.estateFlags.previouslyDeclaredNetEstate < 0))
    errors.push('Previously declared net estate required when prior return was filed')
  return { valid: errors.length === 0, errors }
}

export function validateAllTabs(state: EstateTaxWizardState): TabValidationResult {
  const all = [
    validateTab1(state),
    validateTab2(state),
    validateTab3(state),
    // Tabs 4–7: no required fields; array items validated inline
    validateTab8(state),
  ]
  return {
    valid: all.every(r => r.valid),
    errors: all.flatMap(r => r.errors),
  }
}
```

---

## 5. Integration Points

### 5.1 Entry Point: From BIR 1801 Integration

This wizard is opened from the "Add Estate Tax Computation" button in the inheritance results view. See `spec-bir-1801-integration.md` §3 for the full trigger flow. The wizard receives the `inheritanceInput` as a prop (for pre-population) and the `caseId` (for saving).

```typescript
// Route: /cases/:id/estate-tax
// Component: EstateTaxWizardPage
// Props: caseId: string (from URL param), inheritanceInput: InheritanceEngineInput (from case.input_json)
```

### 5.2 Exit Points: Back to BIR 1801 Integration

After running the engine:
- On success: return to combined results view (`/cases/:id?view=combined`)
- "Back to Inheritance Results" header link: navigates to `/cases/:id` without clearing wizard state
- "Save Draft" (any tab): saves without running engine; remains on wizard

### 5.3 Pre-Population

```typescript
// EstateTaxWizardPage.tsx — mount logic
useEffect(() => {
  async function initialize() {
    // First: try to load existing tax_input_json (returning to a saved wizard)
    const saved = await loadEstateTaxInput(caseId)
    if (saved) {
      setWizardState(saved)
      return
    }

    // No saved state: pre-populate from inheritance input
    const defaultState = createDefaultEstateTaxState(inheritanceInput)
    setWizardState(defaultState)
  }
  initialize()
}, [caseId])
```

### 5.4 Downstream Dependencies

- `spec-bir-1801-integration` — reads `cases.tax_output_json` and `cases.net_distributable_estate` after this wizard runs the engine
- `spec-pdf-export` — Part II of the PDF reads `cases.tax_input_json` and `cases.tax_output_json`
- `spec-case-export-zip` — includes `tax_input_json` in the exported ZIP

### 5.5 Cases Table Columns Used

| Column | Read | Write | Notes |
|--------|------|-------|-------|
| `tax_input_json` | On load | On every auto-save | Full `EstateTaxWizardState` |
| `tax_output_json` | — | After engine runs | `EstateTaxEngineOutput` |
| `net_distributable_estate` | — | After engine runs | `max(0, Item40 − Item44)` in centavos |
| `net_estate_auto_populated` | — | After engine runs | Set to `true` |
| `estate_tax_computed` | — | After engine runs | Set to `true` |
| `input_json` | For pre-population | — | Read `decedent.name`, `date_of_death`, `is_married`, `date_of_marriage` |

---

## 6. Edge Cases

### 6.1 Regime-Conditional Fields

| Scenario | Behavior |
|----------|----------|
| DOD ≥ 2018-01-01 (TRAIN) | Tab 6 sections 5G (funeral) and 5H (judicial/admin) are hidden; any previously-entered values for these sections are preserved in state but engine ignores them |
| DOD < 2018-01-01 (PRE_TRAIN) | Sections 5G and 5H are visible; the global Ownership selector is relevant for 5H items |
| Marital Status = SINGLE, WIDOWED, ANNULLED | Property Regime selector hidden; all assets default to EXCLUSIVE; Conjugal column radio buttons hidden |
| Property Regime = SEPARATION | Conjugal radio option hidden for all ownership selectors; all assets must be EXCLUSIVE |
| NRA = false | Worldwide ELIT section on Tab 1 hidden; foreign tax credit section on Tab 7 hidden |
| NRA = true | Standard deduction auto-displays as ₱500,000 on Tab 7 regardless of regime; worldwide ELIT fields required if any domestic ELIT declared |

### 6.2 Family Home Constraints

| Scenario | Behavior |
|----------|----------|
| Two properties marked isFamilyHome = true | Inline validation error: "Only one property may be designated the family home"; block save until resolved |
| isFamilyHome = true, barangayCertification = false | Warning displayed (yellow): "Family home deduction requires barangay certification. Without it, the deduction will be disallowed." Engine still computes; output includes this warning flag |
| Family home FMV > ₱10,000,000 (TRAIN) | Tab 7 displays: "Family home deduction capped at ₱10,000,000. Excess ₱N,NNN,NNN is not deductible." |
| Family home FMV > ₱1,000,000 (PRE_TRAIN) | Similar cap warning for ₱1,000,000 cap |

### 6.3 Medical Expense Date Validation

| Scenario | Behavior |
|----------|----------|
| Medical expense date > DOD | Inline error: "Date of expense cannot be after date of death" |
| Medical expense date > 1 year before DOD | Inline warning (orange): "This expense is outside the 1-year window and will not be deductible." Row is visually marked as non-qualifying but remains in the form |
| Sum of qualifying expenses > ₱500,000 | Running total indicator turns orange; deductible amount shown as ₱500,000 |

### 6.4 Vanishing Deduction Computation

The vanishing deduction percentage is computed live:

| Years Since Prior Transfer | Deduction Rate | Display Example |
|---------------------------|---------------|-----------------|
| ≤ 1 year | 100% | "1 year → 100%" |
| > 1 year, ≤ 2 years | 80% | "2 years → 80%" |
| > 2 years, ≤ 3 years | 60% | "3 years → 60%" |
| > 3 years, ≤ 4 years | 40% | "4 years → 40%" |
| > 4 years, ≤ 5 years | 20% | "5 years → 20%" |
| > 5 years | 0% | "More than 5 years → no deduction" (row shown in red; entry retained but zero deduction) |

### 6.5 Claims vs Insolvent — Asset Cross-Reference

The uncollectible amount in 5B must reference an asset appearing in the gross estate. The UI shows a warning (not a blocker) if the sum of `amountInGrossEstate` across all 5B items exceeds the total financial personal property declared in Tab 4:

"The claims vs insolvent persons amount (₱X) may exceed financial personal property in the estate (₱Y). Verify these receivables are included in Schedule 2."

### 6.6 RA 4917 — Asset Cross-Reference

RA 4917 benefits must also appear in Schedule 2 (financial personal property). The UI shows a non-blocking warning if no financial property row has a description containing the employer name or mentions "retirement benefit":

"RA 4917 benefit should also appear as an asset in Schedule 2 (Personal Properties > Financial). Add it as 'CASH_IN_BANK' or 'OTHER' type."

### 6.7 Amnesty — Already After Coverage Window

When DOD > 2022-05-31, the amnesty section on Tab 8 is entirely replaced by a banner explaining ineligibility. The engine auto-detects this and uses the regular TRAIN/PRE_TRAIN regime. No user input is needed.

### 6.8 Returning to a Saved Wizard

When a case already has `tax_input_json` populated:
- Wizard loads with all tabs pre-filled from saved state
- Tab completion indicators calculated from the loaded state
- No pre-population from inheritance input (saved state takes precedence)
- If inheritance `date_of_death` has changed since wizard was saved: show yellow banner on Tab 1: "Date of death was updated in the inheritance wizard. Verify this tab reflects the correct date."

### 6.9 Engine Computation Error Recovery

| Error | User-Visible Message | Recovery Action |
|-------|---------------------|-----------------|
| Invalid date of death | "Date of death format is invalid. Please check Tab 1." | Navigate to Tab 1, highlight field |
| Negative net equity (business) | Engine floors at zero; no error — warning in output | Show output warning to user |
| NRA with no worldwide gross estate | "Worldwide gross estate is required for NRA decedents with ELIT deductions." | Highlight Tab 1 NRA section |
| Empty estate (all arrays empty, all zero) | Engine succeeds; net estate tax = 0 | Valid; show "No assets declared. Net Estate Tax Due: ₱0.00" |

### 6.10 Wizard With No Case ID (Unauthenticated)

The estate tax wizard is not available without authentication. If a user attempts to navigate to `/cases/:id/estate-tax` without a session:
- `RequireAuth` wrapper redirects to `/` with `showAuthModal: true`
- After sign-in, redirect back to `/cases/:id/estate-tax`

---

## 7. Dependencies

### 7.1 Upstream Feature Dependencies

| Dependency | Reason |
|------------|--------|
| `spec-auth-persistence` ✓ | Cases table must exist; `tax_input_json`, `tax_output_json`, `net_distributable_estate`, `net_estate_auto_populated`, `estate_tax_computed` columns must be present on `cases` table |

### 7.2 Packages Required

```bash
# All already included by spec-auth-persistence; no new packages needed
# Estate tax WASM module is bundled separately from inheritance WASM
# in the same Vite project:
#   loops/inheritance-frontend-forward/app/src/wasm/estate_tax_engine/
```

### 7.3 Additional Cases Table Columns

`spec-auth-persistence` defines `tax_input_json JSONB` and `tax_output_json JSONB` on `cases`. This wizard also requires three additional columns to be added to the migration:

```sql
-- Add to supabase/migrations/001_initial_schema.sql
-- (or create 002_estate_tax_columns.sql migration)

ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS estate_tax_computed      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS net_distributable_estate BIGINT,   -- centavos
  ADD COLUMN IF NOT EXISTS net_estate_auto_populated BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN cases.estate_tax_computed IS
  'true when estate tax engine has been run and tax_output_json is populated';
COMMENT ON COLUMN cases.net_distributable_estate IS
  'Bridge value: max(0, Item40 - Item44) in centavos. Null until estate tax computed.';
COMMENT ON COLUMN cases.net_estate_auto_populated IS
  'true = net_distributable_estate came from estate tax engine. false = user entered manually.';
```

---

## 8. Acceptance Criteria

### Wizard Navigation
- [ ] All 8 tabs accessible via horizontal tab bar; clicking any tab navigates directly
- [ ] "Next" button validates current tab before advancing; shows inline error list if invalid
- [ ] "Back" button navigates to previous tab without validation
- [ ] Tab completion checkmarks (`✓`) appear after all required fields for that tab are valid
- [ ] "Run Estate Tax" button only enabled when Tab 8 is active and all tabs have been visited at least once

### Tab 1 — Decedent Details
- [ ] Name, date of death, marital status pre-populated from inheritance wizard input
- [ ] Property regime defaulted from marriage date (ACP if ≥ 1988-08-03, CPG if earlier)
- [ ] Property regime hidden when marital status ≠ MARRIED
- [ ] NRA section (worldwide ELIT fields) hidden when isNonResidentAlien = false
- [ ] Date of death validation: valid date, not in future
- [ ] Pre-population skipped when existing `tax_input_json` loaded from DB

### Tab 3 — Real Properties
- [ ] Each row has: title number, tax declaration, location, both FMV fields, ownership, family home toggle
- [ ] FMV-used display updates live: `max(fmvBir, fmvTaxDeclaration)` shown below both fields
- [ ] Maximum one family home allowed; second isFamilyHome toggle shows inline error
- [ ] Barangay certification warning shown for family home without certification
- [ ] Conjugal ownership radio hidden when property regime = SEPARATION
- [ ] Summary subtotals update live as rows added/removed

### Tab 6 — Ordinary Deductions
- [ ] Sections 5G and 5H hidden entirely when DOD ≥ 2018-01-01
- [ ] Sections 5G and 5H visible when DOD < 2018-01-01
- [ ] Vanishing deduction rate and amount computed live from dates and FMV values
- [ ] Warning shown when property in estate = false for mortgage row
- [ ] Running total for all 5A–5H sections shown in summary at bottom

### Tab 7 — Special Deductions
- [ ] Standard deduction shown as read-only computed value (₱5,000,000 / ₱1,000,000 / ₱500,000 based on regime and citizenship)
- [ ] Family home deduction carried over from Tab 3 data; shown as read-only
- [ ] Medical expense date validation: within 1 year before DOD; out-of-range rows marked
- [ ] Medical expense running total with ₱500,000 cap indicator
- [ ] RA 4917 warning shown if employer name not found in Schedule 2 descriptions
- [ ] Foreign tax credit section hidden for NRA decedents

### Tab 8 — Filing & Amnesty
- [ ] Amnesty section hidden entirely (replaced by "Not Eligible" banner) when DOD > 2022-05-31
- [ ] "Previously Declared Net Estate" field shown only when priorReturnFiled = true
- [ ] Six exclusion checkboxes shown only when userElectsAmnesty = true
- [ ] If any exclusion is checked: "Ineligible for amnesty" banner shown; engine will use regular regime
- [ ] Regime detection summary box shows correct regime, rate, standard deduction, FH cap for the entered DOD

### Save & Load
- [ ] Wizard auto-saves `tax_input_json` to `cases` table with 2000ms debounce
- [ ] Save status indicator (Saving / Saved / Error) shown in header
- [ ] "Save Draft" button saves immediately (no debounce) without running engine
- [ ] Returning to wizard for a case with existing `tax_input_json` loads all tabs correctly
- [ ] All array items restored: real properties, financial assets, tangible assets, deductions, medical expenses, etc.

### Engine Execution
- [ ] "Run Estate Tax" triggers full-tab validation; shows per-tab error list if any invalid
- [ ] Loading state shown during WASM computation ("Computing estate tax…")
- [ ] On success: `tax_output_json` and `net_distributable_estate` saved to `cases` table
- [ ] On success: `net_estate_auto_populated = true` saved to `cases` table
- [ ] On WASM error: error message shown as toast; wizard remains on Tab 8
- [ ] Bridge value `max(0, Item40 − Item44)` computed and stored in `cases.net_distributable_estate`

### Security & Access
- [ ] Wizard not accessible without authentication (RequireAuth guard)
- [ ] `tax_input_json` and `tax_output_json` protected by RLS (same `cases_all_own` policy)
- [ ] No other user can read or write a case's estate tax data

---

## 9. File Changes Required

| File | Change |
|------|--------|
| `src/types/estate-tax.ts` | NEW — All TypeScript types for wizard state |
| `src/lib/estateTax.ts` | NEW — Save/load functions for tax_input_json |
| `src/hooks/useEstateTaxAutoSave.ts` | NEW — Debounced auto-save hook |
| `src/lib/estateTaxValidation.ts` | NEW — Per-tab validation functions |
| `src/wasm/estate-tax-bridge.ts` | NEW — WASM bridge for estate tax engine |
| `src/pages/EstateTaxWizardPage.tsx` | NEW — 8-tab wizard container |
| `src/components/estate-tax/Tab1Decedent.tsx` | NEW — Tab 1 form |
| `src/components/estate-tax/Tab2Executor.tsx` | NEW — Tab 2 form |
| `src/components/estate-tax/Tab3RealProperties.tsx` | NEW — Tab 3 form |
| `src/components/estate-tax/Tab4PersonalProperties.tsx` | NEW — Tab 4 form |
| `src/components/estate-tax/Tab5OtherAssets.tsx` | NEW — Tab 5 form |
| `src/components/estate-tax/Tab6OrdinaryDeductions.tsx` | NEW — Tab 6 form |
| `src/components/estate-tax/Tab7SpecialDeductions.tsx` | NEW — Tab 7 form |
| `src/components/estate-tax/Tab8FilingAmnesty.tsx` | NEW — Tab 8 form |
| `src/components/estate-tax/WizardTabBar.tsx` | NEW — Tab navigation header |
| `src/components/estate-tax/CurrencyInput.tsx` | NEW — Reusable ₱ input with comma formatting |
| `src/components/estate-tax/OwnershipRadio.tsx` | NEW — Reusable Exclusive/Conjugal radio |
| `src/App.tsx` | MODIFY — Add route `/cases/:id/estate-tax` |
| `supabase/migrations/002_estate_tax_columns.sql` | NEW — Adds estate_tax_computed, net_distributable_estate, net_estate_auto_populated to cases |
