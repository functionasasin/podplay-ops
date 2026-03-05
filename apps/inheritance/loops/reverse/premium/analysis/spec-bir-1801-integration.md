# Feature Spec: BIR 1801 Estate Tax Integration

**Aspect:** spec-bir-1801-integration
**Wave:** 2 — Per-Feature Specification
**Date:** 2026-03-01
**Reads:** estate-tax-integration, spec-pdf-export, spec-auth-persistence
**Depends on:** spec-pdf-export ✓, spec-auth-persistence ✓
**Depended on by:** spec-estate-tax-inputs-wizard

---

## 1. Overview

This feature connects the estate tax computation engine to the existing inheritance calculator, enabling a combined workflow that produces **both** an inheritance distribution and a BIR Form 1801 estate tax computation in a single case.

**Why a PH estate lawyer needs this:**
- BIR Form 1801 must be filed within one year of the decedent's date of death (NIRC Sec. 90, as amended by TRAIN). The estate tax and the inheritance distribution are two outputs the lawyer must produce for every estate case — they are not optional extras.
- Today the lawyer does both calculations separately: the inheritance calculator (this app) for distribution, and Excel or a BIR worksheet for the tax. This feature eliminates that split workflow.
- The bridge formula `net_distributable_estate = max(0, Item 40 − Item 44)` means the two engines are mathematically linked: the estate tax amount determines how much is actually available for heirs to divide. Computing them separately risks inconsistency.
- Combined output in one PDF allows the lawyer to deliver a single professional document to the client and attach it as a supporting schedule to the BIR filing.

**Key user story:** Atty. Maria Santos has finished computing the intestate distribution for the Estate of Juan dela Cruz (3 children, surviving spouse, ₱15,000,000 gross estate). She clicks "Add Estate Tax Computation →" in the results view, enters the asset schedules and deduction details across 8 tabs, runs the estate tax engine, and gets ₱111,000 estate tax due. She confirms "Use ₱1,739,000 as the distributable estate" and the inheritance distribution automatically reruns with the precise net amount. She clicks "Generate Full Report" and downloads a combined PDF with Part I (distribution) and Part II (Form 1801 summary) on the firm's letterhead.

**Scope of this spec:**
- Overall integration architecture and UI flow
- AppState extension for the three new phases
- Data model additions (ALTER TABLE migration for the two boolean flags)
- Estate tax WASM bridge interface (`wasm/estate-tax-bridge.ts`)
- "Add Estate Tax" entry point in ActionsBar
- Estate tax wizard navigation shell and Tab 1: Decedent Extended Info (detailed)
- Estate tax results view and Form 1801 summary card
- "Update Distribution" confirmation modal
- Combined results view with tab switching
- Combined PDF export

**Out of scope (in `spec-estate-tax-inputs-wizard`):**
- Tab 2: Real Properties (Schedule 1/1A) — field-by-field form design
- Tab 3: Personal Properties (Schedule 2/2A)
- Tab 4: Taxable Transfers & Business Interests (Schedule 3/4)
- Tab 5: Ordinary Deductions (Schedule 5A–5H)
- Tab 6: Special Deductions & Medical Expenses (Schedule 6)
- Tab 7: Sec. 87 Exempt Assets
- Tab 8: Amnesty / Filing flags

**This spec does NOT re-specify the estate tax algorithm.** All computation logic is defined in `docs/plans/estate-tax-engine-spec.md`. This spec only specifies the integration layer: how the inputs are collected, how the engine is invoked, how outputs are displayed, and how the two engines communicate.

---

## 2. Data Model

### 2.1 Cases Table — Additional Migration

The `cases` table in `spec-auth-persistence` already defines:
- `tax_input_json JSONB` — estate tax EngineInput (EstateTaxEngineInput)
- `tax_output_json JSONB` — estate tax EngineOutput (EstateTaxEngineOutput)
- `gross_estate BIGINT` — net distributable estate in centavos (used as bridge value)

Two boolean flag columns are added by this feature's migration:

```sql
-- Migration: 004_estate_tax_integration.sql
-- Adds estate tax status flags to cases table

ALTER TABLE cases
  ADD COLUMN estate_tax_computed     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN net_estate_auto_pop     BOOLEAN NOT NULL DEFAULT false;

-- estate_tax_computed: true when tax_output_json has been set from a successful
--   estate tax engine run; false for cases without estate tax computation
-- net_estate_auto_pop: true when gross_estate was set by the bridge formula
--   (Item 40 - Item 44); false when the user entered it manually in the wizard

COMMENT ON COLUMN cases.estate_tax_computed IS
  'true if tax_output_json is populated from an estate tax engine run';

COMMENT ON COLUMN cases.net_estate_auto_pop IS
  'true if gross_estate was derived from estate tax result (bridge formula); '
  'false if user typed the amount manually in the inheritance wizard';
```

### 2.2 TypeScript Type Definitions

```typescript
// types/estate-tax.ts — estate tax engine I/O types for the UI layer

// Enums (mirror docs/plans/estate-tax-engine-spec.md §5.2)
export type Regime = 'TRAIN' | 'PRE_TRAIN' | 'AMNESTY'
export type DeductionRules = 'TRAIN' | 'PRE_TRAIN'
export type PropertyRegime = 'ACP' | 'CPG' | 'SEPARATION'
export type Ownership = 'EXCLUSIVE' | 'CONJUGAL'
export type MaritalStatus = 'SINGLE' | 'MARRIED' | 'WIDOWED' | 'LEGALLY_SEPARATED' | 'ANNULLED'
export type TaxableTransferType =
  | 'CONTEMPLATION_OF_DEATH'
  | 'REVOCABLE'
  | 'POWER_OF_APPOINTMENT'
  | 'LIFE_INSURANCE'
  | 'INSUFFICIENT_CONSIDERATION'

// Top-level engine input — matches estate-tax-engine-spec.md §5.6
// Full field definitions are in that spec; this is the TypeScript interface
// used by the UI layer to serialize/deserialize from Supabase JSONB
export interface EstateTaxEngineInput {
  decedent: {
    name: string
    dateOfDeath: string            // ISO date 'YYYY-MM-DD'
    citizenship: string            // e.g., 'Filipino'
    isNonResidentAlien: boolean
    address: string
    maritalStatus: MaritalStatus
    propertyRegime: PropertyRegime | null
    totalWorldwideGrossEstate: number | null   // centavos; NRA only
    totalWorldwideELIT: {
      claimsAgainstEstate: number
      claimsVsInsolvent: number
      unpaidMortgages: number
      casualtyLosses: number
      funeralExpenses: number
      judicialAdminExpenses: number
    } | null
  }
  executor: {
    name: string
    tin: string | null
    contactNumber: string | null
    email: string | null
  }
  estateFlags: {
    taxFullyPaidBeforeMay2022: boolean
    priorReturnFiled: boolean
    previouslyDeclaredNetEstate: number | null   // centavos
    subjectToPCGGJurisdiction: boolean
    hasRA3019Violations: boolean
    hasRA9160Violations: boolean
    hasPendingCourtCasePreAmnestyAct: boolean
    hasUnexplainedWealthCases: boolean
    hasPendingRPCFelonies: boolean
  }
  userElectsAmnesty: boolean
  useNarrowAmnestyDeductions: boolean
  // Asset arrays — fully typed in estate-tax-engine-spec.md §5.4
  realProperties: object[]
  personalPropertiesFinancial: object[]
  personalPropertiesTangible: object[]
  taxableTransfers: object[]
  businessInterests: object[]
  sec87ExemptAssets: object[]
  // Deduction arrays — fully typed in estate-tax-engine-spec.md §5.5
  claimsAgainstEstate: object[]
  claimsVsInsolvent: object[]
  unpaidMortgages: object[]
  unpaidTaxes: object[]
  casualtyLosses: object[]
  vanishingDeductionProperties: object[]
  publicUseTransfers: object[]
  funeralExpenses: { actualAmount: number } | null
  judicialAdminExpenses: { items: object[] } | null
  medicalExpenses: { items: object[] } | null
  ra4917Benefits: { amount: number; employerName: string } | null
  foreignTaxCredits: object[]
  filing: {
    isAmended: boolean
    extensionToFile: boolean
    extensionToPay: boolean
    installmentGranted: boolean
    judicialSettlement: boolean
    hasTaxRelief: boolean
  }
}

// Key output fields used by the integration layer
// Full output type is defined in estate-tax-engine-spec.md §5.7
export interface EstateTaxEngineOutput {
  regimeDetection: {
    regime: Regime
    deductionRules: DeductionRules
    amnestyEligible: boolean
    warnings: string[]
  }
  grossEstate: {
    total: { exclusive: number; conjugal: number; total: number }   // centavos
  }
  ordinaryDeductions: {
    total: { exclusive: number; conjugal: number; total: number }
  }
  specialDeductions: {
    standardDeduction: number
    familyHome: number
    medicalExpenses: number
    ra4917: number
    total: number
  }
  netEstate: number           // Item 38 centavos
  spouseShare: {
    spouseShare: number       // Item 39 centavos
  }
  taxComputation: {
    netTaxableEstate: number   // Item 40 centavos
    estateTaxDue: number       // Item 42 centavos
    foreignTaxCredit: number   // Item 43 centavos
    netEstateTaxDue: number    // Item 44 centavos
  }
  explainer: {
    sections: Array<{ heading: string; body: string }>
  }
  warnings: string[]
}

// Bridge formula result (derived, not from engine)
export interface BridgeResult {
  netDistributableEstate: number   // centavos = max(0, Item40 - Item44)
  isZeroTax: boolean               // Item44 === 0
  item40: number                   // centavos — net taxable estate
  item44: number                   // centavos — net estate tax due
}

export function computeBridgeValue(output: EstateTaxEngineOutput): BridgeResult {
  const item40 = output.taxComputation.netTaxableEstate
  const item44 = output.taxComputation.netEstateTaxDue
  return {
    netDistributableEstate: Math.max(0, item40 - item44),
    isZeroTax: item44 === 0,
    item40,
    item44
  }
}
```

### 2.3 Updated CaseRow Type Extension

```typescript
// types/db.ts — additions to CaseRow from spec-auth-persistence
export interface CaseRow {
  // ... all existing fields from spec-auth-persistence ...
  estate_tax_computed: boolean
  net_estate_auto_pop: boolean
}
```

---

## 3. UI Design

### 3.1 "Add Estate Tax Computation" Entry Point

The entry point is a new button added to `ActionsBar` in `ResultsView`. It appears after a successful inheritance computation.

**ActionsBar — current state:**
```
┌────────────────────────────────────────────────────────────────┐
│  [ Edit Input ]  [ Export JSON ]  [ Copy Narratives ]          │
└────────────────────────────────────────────────────────────────┘
```

**ActionsBar — with BIR 1801 button added (unauthenticated):**
```
┌─────────────────────────────────────────────────────────────────────┐
│  [ Edit Input ]  [ Export JSON ]  [ Copy Narratives ]               │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Compute Estate Tax (BIR Form 1801)                    →     │   │
│  │  Add estate tax to compute the net distributable estate      │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

**For unauthenticated users:** Clicking "Compute Estate Tax" triggers the auth modal (from spec-auth-persistence §3.1) with the message "Sign in to save your case and add estate tax computation." After sign-in, the case is auto-saved and the estate tax wizard opens.

**For authenticated users with a saved case:** Button navigates to estate tax wizard immediately.

**For authenticated users with no saved case:** Case is auto-created (status: 'draft'), then wizard opens.

**Visual treatment:** The estate tax button is styled as a secondary CTA with a distinct background (amber-50 border-amber-300 text-amber-900 in light mode) to visually separate it from the primary actions. This signals it is an optional add-on step.

**When estate tax has already been computed for this case:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  [ Edit Input ]  [ Export JSON ]  [ Copy Narratives ]               │
│  [ Generate Full Report PDF ]   ← replaces "Export PDF" when       │
│                                    both engines have run            │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  ✓ Estate Tax Computed — Net Estate Tax: ₱111,000            │   │
│  │  [ View Estate Tax ]   [ Re-run Estate Tax ]                 │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 3.2 Estate Tax Wizard — Navigation Shell

The estate tax wizard is a full-page overlay/route that replaces the results view during input. It shares the same top-level app chrome (header, user menu) but replaces the main content area.

**Route:** `/cases/:id/estate-tax`

**Tab navigation (8 tabs):**
```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  ← Estate of Juan dela Cruz                                                           │
│  Estate Tax Computation — BIR Form 1801                                              │
├──────────────────────────────────────────────────────────────────────────────────────┤
│  [1: Decedent] [2: Real Prop.] [3: Personal Prop.] [4: Transfers] [5: Deductions]   │
│  [6: Spec. Deductions] [7: Exempt Assets] [8: Amnesty / Filing]                      │
│  ─────────────────────────────────────────────────────────────────────────────────   │
│  ● ○ ○ ○ ○ ○ ○ ○   Tab 1 of 8: Decedent & Executor Info                             │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                       │
│  [Tab content — see §3.3]                                                             │
│                                                                                       │
├──────────────────────────────────────────────────────────────────────────────────────┤
│  [← Back]                                          [Save Progress]  [Next Tab →]     │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

**Tab labels and coverage (summary):**

| Tab # | Label | Spec | Schedules Covered |
|-------|-------|------|-------------------|
| 1 | Decedent & Executor | This file — §3.3 | Form 1801 F1–F12 |
| 2 | Real Properties | spec-estate-tax-inputs-wizard | Schedule 1, 1A |
| 3 | Personal Properties | spec-estate-tax-inputs-wizard | Schedule 2, 2A |
| 4 | Transfers & Business | spec-estate-tax-inputs-wizard | Schedule 3, 4 |
| 5 | Ordinary Deductions | spec-estate-tax-inputs-wizard | Schedule 5A–5H |
| 6 | Special Deductions | spec-estate-tax-inputs-wizard | Schedule 6 |
| 7 | Exempt Assets | spec-estate-tax-inputs-wizard | Sec. 87 exclusions |
| 8 | Amnesty / Filing | spec-estate-tax-inputs-wizard | Flags, filing metadata |

**Navigation behavior:**
- Clicking a tab label navigates to that tab without saving (draft state is preserved in memory)
- "Save Progress" writes `tax_input_json` to Supabase immediately (partial input — engine is not called yet)
- "Next Tab →" saves progress and advances
- Completed tabs show a check mark (●) in the progress dots; current tab is filled; future tabs are empty (○)
- Tab 1 is always shown first; user may navigate in any order
- "← Back" from Tab 1 returns to the results view (inheritance distribution) without discarding inputs

**Pre-population from inheritance wizard:**
When the estate tax wizard opens, Tab 1 is pre-populated from the inheritance engine's `EngineInput`:

| Estate Tax Field | Source in Inheritance Input | Pre-populated Value |
|------------------|-----------------------------|--------------------|
| `decedent.name` | `decedent.name` | Direct copy |
| `decedent.dateOfDeath` | `decedent.date_of_death` | Direct copy |
| `decedent.maritalStatus` | `decedent.is_married` + `decedent.has_legal_separation` | `MARRIED` if `is_married=true`; `LEGALLY_SEPARATED` if `has_legal_separation=true`; `SINGLE` otherwise |
| `decedent.propertyRegime` | `decedent.date_of_marriage` | `ACP` if `date_of_marriage >= '1988-08-03'`; `CPG` if earlier; `null` if not married |
| `decedent.citizenship` | none | Default: `'Filipino'` (editable) |
| `decedent.isNonResidentAlien` | none | Default: `false` (editable) |
| `decedent.address` | none | Empty (required input) |
| `executor.name` | none | Empty (required input) |

---

### 3.3 Tab 1: Decedent & Executor Info

This tab captures the extended decedent info required by the estate tax engine that is not present in the inheritance wizard, plus executor information.

```
┌──────────────────────────────────────────────────────────────────────┐
│  DECEDENT INFORMATION                                                │
│  ────────────────────────────────────────────────────────────────   │
│                                                                      │
│  Full name (Last, First, Middle)                                     │
│  [Dela Cruz, Juan Santos                                         ]   │
│  ● Pre-filled from inheritance wizard                                │
│                                                                      │
│  Date of Death                     Tax Regime (auto-detected)        │
│  [2024-03-15          ]            [TRAIN — Flat 6% (≥ Jan 2018)]   │
│                                                                      │
│  Citizenship                       Resident Status                   │
│  [Filipino                     ]   ○ Resident citizen               │
│                                    ○ Non-resident citizen            │
│                                    ○ Resident alien                  │
│                                    ○ Non-resident alien (NRA)        │
│                                    ⚠ NRA: only PH-situs assets;     │
│                                      ₱500,000 standard deduction    │
│                                                                      │
│  Home Address                                                        │
│  [123 Padre Faura St., Ermita, Manila, Metro Manila             ]   │
│                                                                      │
│  Marital Status                    Property Regime                  │
│  [Married                  ▾]      [Absolute Community (ACP)   ▾]  │
│  Options: Single, Married,         Options: ACP (post-Aug 1988),    │
│  Widowed, Legally Separated,       CPG (pre-Aug 1988),              │
│  Annulled                          Separation of Property            │
│                                    Disabled if not married           │
│                                                                      │
│  ────────────────────────────────────────────────────────────────   │
│  EXECUTOR / ADMINISTRATOR INFORMATION                                │
│  ────────────────────────────────────────────────────────────────   │
│                                                                      │
│  Executor / Administrator Name               Required                │
│  [Santos, Maria Luisa dela Cruz          ]                          │
│                                                                      │
│  Executor TIN                      Contact Number         Optional  │
│  [123-456-789-000             ]    [+63 917 123 4567  ]             │
│                                                                      │
│  Executor Email                               Optional               │
│  [mldc@email.com                         ]                          │
│                                                                      │
│  ────────────────────────────────────────────────────────────────   │
│  NRA ADDITIONAL INPUTS  (shown only when isNonResidentAlien = true) │
│  ────────────────────────────────────────────────────────────────   │
│  For proportional deduction of ELIT (Sec. 86B, NIRC)                │
│                                                                      │
│  Worldwide Gross Estate (₱)          Worldwide ELIT (₱)            │
│  [___________________]               [___________________]          │
│  Enter total value of all            Enter total ELIT deductions     │
│  worldwide assets in pesos           from worldwide estate           │
│  (or equivalent)                                                     │
└──────────────────────────────────────────────────────────────────────┘
```

**Field validations for Tab 1:**

| Field | Validation Rule |
|-------|----------------|
| `decedent.name` | Non-empty string; max 200 chars |
| `decedent.dateOfDeath` | Valid ISO date; must be ≤ today (2026-03-01); must match inheritance wizard's `date_of_death` — show warning if they differ |
| `decedent.citizenship` | Non-empty string; max 50 chars |
| `decedent.isNonResidentAlien` | Boolean; affects asset/deduction eligibility |
| `decedent.address` | Non-empty string; max 500 chars |
| `decedent.maritalStatus` | One of: `SINGLE`, `MARRIED`, `WIDOWED`, `LEGALLY_SEPARATED`, `ANNULLED` |
| `decedent.propertyRegime` | Required if `maritalStatus = MARRIED`; null otherwise |
| `executor.name` | Non-empty string; max 200 chars |
| `executor.tin` | Optional; if provided, matches pattern `\d{3}-\d{3}-\d{3}-\d{3}` |
| `executor.contactNumber` | Optional; if provided, non-empty string |
| `decedent.totalWorldwideGrossEstate` | Required when `isNonResidentAlien = true` AND any ELIT is declared; integer centavos ≥ 0 |
| `decedent.totalWorldwideELIT` | Required when `isNonResidentAlien = true` AND any ELIT is declared |

**Tax regime auto-detection display:**

The regime is shown read-only, computed from `dateOfDeath` in real time:
- `dateOfDeath >= 2018-01-01`: "TRAIN — Flat 6% on net taxable estate"
- `dateOfDeath < 2018-01-01 AND dateOfDeath <= 2022-05-31`: "PRE_TRAIN — Graduated 0%–20% | Amnesty may apply (Tab 8)"
- `dateOfDeath < 2018-01-01 AND dateOfDeath > 2022-05-31`: "PRE_TRAIN — Graduated 0%–20%"

**Property regime defaulting logic:**
- If `decedent.maritalStatus` changes to `SINGLE`, `WIDOWED`, `LEGALLY_SEPARATED`, or `ANNULLED` → `propertyRegime` is disabled and set to `null`
- If `maritalStatus = MARRIED` and `decedent.dateOfMarriage` is available from inheritance wizard:
  - `dateOfMarriage >= 1988-08-03` → default `ACP` (Family Code default)
  - `dateOfMarriage < 1988-08-03` → default `CPG` (Civil Code default)
  - User can override the default manually

---

### 3.4 Estate Tax Computing State

After the user fills all required fields and clicks "Compute Estate Tax" (available from any tab once minimum data is complete):

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│              Computing Estate Tax…                               │
│                                                                  │
│              Running 14-phase BIR computation pipeline          │
│              Regime: TRAIN | Date of Death: 2024-03-15          │
│                                                                  │
│              ████████████████████░░░░░░░░░   72%               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

The estate tax engine WASM call is expected to complete in < 200ms for typical inputs. The progress bar is animated at a fixed rate (not actual progress), terminating when the WASM promise resolves.

**Error handling:** If the WASM engine throws (invalid input, numeric overflow, etc.), the error message from the engine is shown inline:

```
┌─────────────────────────────────────────────────────────────────┐
│  ⊗  Estate tax computation failed                               │
│                                                                  │
│  "Worldwide gross estate must be provided for NRA estates       │
│   with ELIT deductions."                                        │
│                                                                  │
│  [ ← Fix Inputs ]                                               │
└─────────────────────────────────────────────────────────────────┘
```

**"Compute Estate Tax" button availability:**
- Enabled when: Tab 1 is fully valid (all required fields filled) AND at least one asset has been entered in Tabs 2–4
- Disabled with tooltip "Enter at least one asset before computing" if no assets are entered
- Always available from Tab 8 (amnesty flags may affect computation)

---

### 3.5 Estate Tax Results View

After computation completes, the results are shown as a Form 1801 summary card. This is a new route at `/cases/:id/estate-tax/results`.

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← Estate of Juan dela Cruz          Estate Tax Computation Result  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ESTATE TAX SUMMARY — BIR Form 1801                                  │
│  Regime: TRAIN (Death ≥ Jan 1, 2018) | Flat 6%                      │
│                                                                       │
│  GROSS ESTATE                                                         │
│  ─────────────────────────────────────────────────────────────────   │
│  Real Properties (Item 29)             ₱9,000,000.00                 │
│    incl. Family Home (Item 30)         ₱6,000,000.00                 │
│  Personal Properties (Item 31)         ₱5,000,000.00                 │
│  Taxable Transfers (Item 32)           ₱0.00                         │
│  Business Interests (Item 33)          ₱0.00                         │
│  GROSS ESTATE (Item 34)                ₱14,000,000.00  ◀ bold        │
│                                                                       │
│  DEDUCTIONS                                                           │
│  ─────────────────────────────────────────────────────────────────   │
│  Ordinary Deductions (Item 35)         ₱500,000.00                   │
│  Estate After Ordinary (Item 36)       ₱13,500,000.00                │
│  Standard Deduction (Item 37A)         ₱5,000,000.00                 │
│  Family Home Deduction (Item 37B)      ₱6,000,000.00                 │
│  Medical Expenses (Item 37C)           ₱400,000.00                   │
│  Total Special Deductions (Item 37)    ₱11,400,000.00                │
│                                                                       │
│  NET ESTATE COMPUTATION                                               │
│  ─────────────────────────────────────────────────────────────────   │
│  Net Estate (Item 38)                  ₱2,100,000.00                 │
│  Surviving Spouse Share (Item 39)      ₱ 361,000.00                  │
│  Net Taxable Estate (Item 40)          ₱1,739,000.00                 │
│  Estate Tax Due — 6% (Item 42)         ₱  104,340.00                 │
│  Foreign Tax Credit (Item 43)          ₱       0.00                  │
│  NET ESTATE TAX DUE (Item 44)          ₱  104,340.00  ◀ bold/amber  │
│                                                                       │
│  BRIDGE COMPUTATION                                                   │
│  ─────────────────────────────────────────────────────────────────   │
│  Net Taxable Estate (Item 40)          ₱1,739,000.00                 │
│  Less: Net Estate Tax Due (Item 44)  − ₱  104,340.00                 │
│  ─────────────────────────────────────                               │
│  NET DISTRIBUTABLE ESTATE              ₱1,634,660.00  ◀ bold/green  │
│  (max(0, Item 40 − Item 44))                                         │
│                                                                       │
│  ────────────────────────────────────────────────────────────────    │
│  FILING INFORMATION                                                   │
│  Filing deadline:  2025-03-15  (1 year from date of death)           │
│  CPA certification: Required (gross estate > ₱5,000,000)            │
│                                                                       │
│  ⚠  Warnings (from engine):                                          │
│  • Family home deduction limited to ₱10,000,000 (TRAIN cap)         │
│                                                                       │
│  ─────────────────────────────────────────────────────────────────   │
│  USE THIS DISTRIBUTABLE ESTATE FOR INHERITANCE DISTRIBUTION?         │
│                                                                       │
│  Current inheritance distribution uses:  ₱5,000,000.00 (manual)    │
│  Estate tax computation gives:           ₱1,634,660.00              │
│                                                                       │
│  [ Yes — Recompute Inheritance with ₱1,634,660.00 ]  ← primary CTA │
│  [ Keep Manual Amount (₱5,000,000.00) ]               ← secondary   │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

**Special case — zero tax:**
When `netEstateTaxDue = 0` (e.g., gross estate ≤ ₱5,000,000 and standard deduction absorbs all):

```
│  NET DISTRIBUTABLE ESTATE              ₱1,739,000.00                 │
│  (No estate tax due — full net taxable estate distributes to heirs)  │
```

**Special case — amnesty with closed window:**
```
│  ⚠  AMNESTY FILING WINDOW CLOSED (June 14, 2025)                    │
│     This computation is for historical reference only.               │
│     Consult a licensed tax attorney regarding late filing options.   │
```

---

### 3.6 "Update Inheritance Distribution" Confirmation Modal

Displayed when the user clicks "Yes — Recompute Inheritance":

```
┌─────────────────────────────────────────────────────────────────────┐
│  Update Inheritance Distribution?                                    │
│  ──────────────────────────────────────────────────────────────     │
│  The inheritance engine will rerun with the estate-tax-derived      │
│  net distributable estate.                                           │
│                                                                      │
│  Previous value (manually entered):   ₱5,000,000.00                │
│  New value (from BIR 1801 result):    ₱1,634,660.00                │
│                                                                      │
│  All per-heir share amounts will change. The distribution logic     │
│  (succession scenario, legitime rules) remains unchanged.           │
│                                                                      │
│  [ Confirm — Recompute Now ]        [ Cancel ]                      │
└─────────────────────────────────────────────────────────────────────┘
```

**On "Confirm":**
1. The inheritance WASM `compute()` is called with the same `inheritanceInput` but `net_distributable_estate` updated to the bridge value
2. The combined results view is shown (§3.7)
3. Both `tax_input_json`, `tax_output_json`, updated `inheritance_input_json`, updated `inheritance_output_json`, and `gross_estate` (bridge value) are saved to Supabase
4. `estate_tax_computed = true`, `net_estate_auto_pop = true` are set on the case
5. Case status advances to `computed`

**On "Cancel":**
1. The estate tax result is saved to the case (`tax_input_json`, `tax_output_json`, `estate_tax_computed = true`)
2. `net_estate_auto_pop` stays `false` — the manually entered value is preserved
3. User is shown the combined results view (§3.7) but with the original inheritance amounts
4. `gross_estate` column is NOT updated (original manual value is retained)

---

### 3.7 Combined Results View

After recomputation (or after "Keep Manual Amount"), the combined results view displays both engines' outputs in a tabbed interface.

**Route:** `/cases/:id` (same as before; the view is tab-extended when both engines have run)

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← Dashboard    Estate of Juan dela Cruz              ✓ Saved        │
│  Status: computed                                     [Finalize]     │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  [ Inheritance Distribution ]  [ Estate Tax — Form 1801 ]           │
│  ─────────────────────────────────────────                           │
│  ▼ Tab 1 selected: Inheritance Distribution                          │
│                                                                       │
│  [Existing ResultsView — ResultsHeader, DistributionSection,         │
│   NarrativePanel, WarningsPanel, ComputationLog]                     │
│                                                                       │
│  Net distributable estate: ₱1,634,660.00                            │
│  ✓ Derived from estate tax computation (Item 40 − Item 44)          │
│                                                                       │
├──────────────────────────────────────────────────────────────────────┤
│  [ Edit Input ]  [ Generate Full Report PDF ]  [ Share ]             │
│  [ Re-run Estate Tax ]                                               │
└──────────────────────────────────────────────────────────────────────┘
```

**Tab 2 — Estate Tax — Form 1801:**
```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  [ Inheritance Distribution ]  [● Estate Tax — Form 1801 ]          │
│  ─────────────────────────────────────────                           │
│                                                                       │
│  [Estate Tax Results card — same layout as §3.5, read-only]         │
│                                                                       │
│  [ Edit Estate Tax Inputs ]  [ Re-run Estate Tax ]                   │
└──────────────────────────────────────────────────────────────────────┘
```

**"Generate Full Report PDF" button** (shown only when both engines have run) replaces the existing "Export PDF" button. It generates the combined two-section PDF (§3.8).

**"Re-run Estate Tax" button:** Returns user to the estate tax wizard (Tab 1) with existing inputs pre-filled. After re-running, the "Update Distribution" modal is shown again if the bridge value changed.

**"net_estate_auto_pop" indicator:**

When `net_estate_auto_pop = true`, the inheritance results view shows:
```
Net distributable estate: ₱1,634,660.00
✓ Derived from estate tax computation (BIR Form 1801 — Item 40 − Item 44)
```

When `net_estate_auto_pop = false` (user kept manual amount):
```
Net distributable estate: ₱5,000,000.00
⚠ Manually entered. Run estate tax computation to derive the precise amount.
[ View Estate Tax Result ]
```

---

### 3.8 Combined PDF Layout

The combined PDF is generated by the `generateCombinedPdf()` function, which extends the existing `generatePdf()` function specified in `spec-pdf-export`.

**Library:** `@react-pdf/renderer` (same as spec-pdf-export)

**Document structure:**

```
Page 1–N:  Part I — Inheritance Distribution
           (same layout as spec-pdf-export, no changes)
           ├── Firm header (logo, name, address, counsel name)
           ├── Report title: "ESTATE SETTLEMENT REPORT"
           ├── Case summary: decedent, DOD, succession type, scenario
           ├── Distribution summary table (heir, category, legal basis, net share)
           ├── Per-heir narratives (with NCC citations)
           ├── Computation log
           └── Warnings (if any)

Page N+1:  Part II separator page
           ┌───────────────────────────────────────┐
           │                                       │
           │  PART II                              │
           │  Estate Tax Computation               │
           │  BIR Form 1801                        │
           │                                       │
           │  Decedent: Juan dela Cruz             │
           │  Date of Death: 2024-03-15            │
           │  Regime: TRAIN (Flat 6%)              │
           │                                       │
           └───────────────────────────────────────┘

Page N+2:  Form 1801 Summary — Gross Estate schedule
           Columns: Item # | Description | Excl. (Col A) | Conj. (Col B) | Total (Col C)
           ├── Item 29: Real Properties
           ├── Item 30: Family Home
           ├── Item 31: Personal Properties
           ├── Item 32: Taxable Transfers
           ├── Item 33: Business Interests
           └── Item 34: GROSS ESTATE (bold)

Page N+3:  Form 1801 Summary — Deductions + Tax
           ├── Item 35: Ordinary Deductions (subtotal)
           ├── Item 36: Estate After Ordinary
           ├── Item 37A: Standard Deduction
           ├── Item 37B: Family Home Deduction
           ├── Item 37C: Medical Expenses
           ├── Item 37: Total Special Deductions
           ├── Item 38: Net Estate
           ├── Item 39: Surviving Spouse Share
           ├── Item 40: NET TAXABLE ESTATE (bold)
           ├── Item 42: Estate Tax Due (rate × Item 40)
           ├── Item 43: Foreign Tax Credit
           ├── Item 44: NET ESTATE TAX DUE (bold, amber)
           └── Bridge: Net Distributable Estate (bold, green)

Page N+4:  Filing Information + Disclaimer
           ├── Filing deadline (1 year from DOD)
           ├── CPA certification requirement (GE > ₱5,000,000)
           ├── Summary of engine warnings
           ├── Standard legal disclaimer:
           │   "This report is a computational estimate based on inputs
           │    provided by the user. It is not a substitute for a filed
           │    BIR Form 1801 or professional legal and tax advice.
           │    Consult a licensed CPA and attorney before filing."
           └── Generation date, software version
```

**`generateCombinedPdf()` function signature:**

```typescript
// lib/generateCombinedPdf.ts
import { generatePdf } from './generatePdf'
import type { EngineInput, EngineOutput } from '@/types'
import type { EstateTaxEngineInput, EstateTaxEngineOutput } from '@/types/estate-tax'
import type { FirmProfile } from '@/types/db'

export async function generateCombinedPdf(params: {
  inheritanceInput: EngineInput
  inheritanceOutput: EngineOutput
  estateTaxInput: EstateTaxEngineInput
  estateTaxOutput: EstateTaxEngineOutput
  bridgeValue: number            // centavos
  netEstateAutoPopulated: boolean
  firm: FirmProfile | null
}): Promise<Blob>

// When only inheritance is available (no estate tax run yet):
// Call generatePdf() from spec-pdf-export directly
```

---

## 4. API / Data Layer

### 4.1 Estate Tax WASM Bridge

A new bridge module is created for the estate tax WASM, mirroring `wasm/bridge.ts` for the inheritance engine.

```typescript
// wasm/estate-tax-bridge.ts

import type { EstateTaxEngineInput, EstateTaxEngineOutput } from '@/types/estate-tax'

// WASM module expected export:
//   compute_estate_tax_json: (inputJson: string) => string
//   initAsync: (wasmUrl?: string) => Promise<void>
//   initSync: (wasmModule: WebAssembly.Module) => void

let wasmInitialized = false
let wasmModule: { compute_estate_tax_json: (json: string) => string } | null = null

async function ensureWasmInitialized(): Promise<void> {
  if (wasmInitialized) return
  const { default: initAsync, compute_estate_tax_json } = await import(
    './pkg/estate_tax_engine/estate_tax_engine.js'
  )
  await initAsync()
  wasmModule = { compute_estate_tax_json }
  wasmInitialized = true
}

export async function computeEstateTax(
  input: EstateTaxEngineInput
): Promise<EstateTaxEngineOutput> {
  await ensureWasmInitialized()
  const inputJson = JSON.stringify(input)
  const outputJson = wasmModule!.compute_estate_tax_json(inputJson)
  const output = JSON.parse(outputJson) as EstateTaxEngineOutput
  return output
}
```

**WASM module path:** `wasm/pkg/estate_tax_engine/estate_tax_engine.js` (built from `loops/estate-tax-rust-forward/src/` when that forward loop runs).

**Vite config addition:** The existing `vite-plugin-wasm` and `vite-plugin-top-level-await` configuration in `vite.config.ts` already supports multiple WASM modules. No additional Vite changes are needed.

**Error handling:** If the WASM call throws (e.g., invalid JSON, integer overflow, unsupported regime combination), the raw error message is surfaced in the UI (§3.4). The bridge does not swallow errors.

### 4.2 AppState Extension

```typescript
// App.tsx — new phases extending the existing AppState

type AppState =
  // Existing phases (unchanged):
  | { phase: 'wizard' }
  | { phase: 'computing' }
  | { phase: 'results'; input: EngineInput; output: EngineOutput }
  | { phase: 'loading-case' }
  | { phase: 'error'; message: string }

  // New phases added by this feature:
  | {
      phase: 'estate-tax-wizard'
      inheritanceInput: EngineInput
      inheritanceOutput: EngineOutput
      taxInputDraft: Partial<EstateTaxEngineInput>   // partially filled estate tax form
    }
  | {
      phase: 'estate-tax-computing'
      inheritanceInput: EngineInput
      inheritanceOutput: EngineOutput
      taxInput: EstateTaxEngineInput
    }
  | {
      phase: 'estate-tax-results'
      inheritanceInput: EngineInput
      inheritanceOutput: EngineOutput
      taxInput: EstateTaxEngineInput
      taxOutput: EstateTaxEngineOutput
      bridgeValue: number               // centavos = max(0, Item40 - Item44)
    }
  | {
      phase: 'combined-results'
      inheritanceInput: EngineInput
      inheritanceOutput: EngineOutput
      taxInput: EstateTaxEngineInput
      taxOutput: EstateTaxEngineOutput
      bridgeValue: number
      netEstateAutoPopulated: boolean   // true if inheritance reran with bridge value
    }
```

**Phase transition diagram:**

```
                  ┌─────────────────────────────────────────────────┐
                  │                                                  │
  results ───────►│ estate-tax-wizard ──► estate-tax-computing      │
     ▲            │         ▲                    │                  │
     │            │         │ "← Back"           ▼                  │
     │            │   "Re-run"         estate-tax-results           │
     │            │         ▲                    │                  │
     │            └─────────┼────────────────────┼──────────────────┘
     │                      │                    │
     │                      │         "Keep Manual Amount"
     │                      │                    │
     │                      │         "Yes — Recompute"
     │                      │                    │
     │                      │                    ▼
     │                      │           computing (re-run)
     │                      │                    │
     │                      │                    ▼
     └──────────────────────────── combined-results ◄──────────────┘
```

### 4.3 Case Save Functions for Tax Data

```typescript
// lib/cases.ts — additions to spec-auth-persistence case functions

import type { EstateTaxEngineInput, EstateTaxEngineOutput } from '@/types/estate-tax'

// Save estate tax inputs (partial — user saves progress mid-wizard)
export async function saveTaxInputDraft(
  caseId: string,
  taxInput: Partial<EstateTaxEngineInput>
): Promise<void> {
  const { error } = await supabase
    .from('cases')
    .update({ tax_input_json: taxInput as unknown as Json })
    .eq('id', caseId)
  if (error) throw error
}

// Save estate tax computation result (after WASM engine runs)
export async function saveTaxOutput(
  caseId: string,
  taxInput: EstateTaxEngineInput,
  taxOutput: EstateTaxEngineOutput,
  bridgeValueCentavos: number
): Promise<void> {
  const { error } = await supabase
    .from('cases')
    .update({
      tax_input_json:       taxInput as unknown as Json,
      tax_output_json:      taxOutput as unknown as Json,
      estate_tax_computed:  true,
      // gross_estate updated only if user confirms recompute — see saveRecomputedInheritance()
    })
    .eq('id', caseId)
  if (error) throw error
}

// Save combined result after user confirms "Recompute Inheritance"
export async function saveRecomputedInheritance(
  caseId: string,
  inheritanceInput: EngineInput,      // updated with bridge value
  inheritanceOutput: EngineOutput,    // re-run output
  bridgeValueCentavos: number
): Promise<void> {
  const { error } = await supabase
    .from('cases')
    .update({
      input_json:         inheritanceInput as unknown as Json,
      output_json:        inheritanceOutput as unknown as Json,
      gross_estate:       bridgeValueCentavos,
      net_estate_auto_pop: true,
      status:             'computed',
      decedent_name:      inheritanceInput.decedent?.name ?? null,
      date_of_death:      inheritanceInput.decedent?.date_of_death ?? null,
    })
    .eq('id', caseId)
  if (error) throw error
}

// Load saved estate tax draft (when reopening wizard on existing case)
export async function loadTaxInputDraft(
  caseId: string
): Promise<Partial<EstateTaxEngineInput> | null> {
  const { data, error } = await supabase
    .from('cases')
    .select('tax_input_json')
    .eq('id', caseId)
    .single()
  if (error) throw error
  return (data?.tax_input_json as Partial<EstateTaxEngineInput>) ?? null
}
```

### 4.4 Estate Tax Wizard State Hook

```typescript
// hooks/useEstateTaxWizard.ts

import { useState } from 'react'
import type { EstateTaxEngineInput } from '@/types/estate-tax'
import type { EngineInput } from '@/types'
import { saveTaxInputDraft } from '@/lib/cases'

export function useEstateTaxWizard(
  caseId: string,
  inheritanceInput: EngineInput,
  savedDraft: Partial<EstateTaxEngineInput> | null
) {
  const [activeTab, setActiveTab] = useState(0)

  // Pre-populate Tab 1 from inheritance inputs; merge with any saved draft
  const defaultTab1 = deriveTab1Defaults(inheritanceInput)
  const [formData, setFormData] = useState<Partial<EstateTaxEngineInput>>(
    savedDraft ?? defaultTab1
  )

  function updateSection(
    section: keyof EstateTaxEngineInput,
    value: EstateTaxEngineInput[typeof section]
  ) {
    setFormData(prev => ({ ...prev, [section]: value }))
  }

  async function saveProgress() {
    if (!caseId) return
    await saveTaxInputDraft(caseId, formData)
  }

  function isTab1Valid(): boolean {
    const d = formData.decedent
    const e = formData.executor
    return (
      !!d?.name &&
      !!d?.dateOfDeath &&
      !!d?.citizenship &&
      !!d?.address &&
      !!d?.maritalStatus &&
      (d.maritalStatus !== 'MARRIED' || !!d.propertyRegime) &&
      !!e?.name
    )
  }

  function hasMinimumAssets(): boolean {
    return (
      (formData.realProperties?.length ?? 0) > 0 ||
      (formData.personalPropertiesFinancial?.length ?? 0) > 0 ||
      (formData.personalPropertiesTangible?.length ?? 0) > 0 ||
      (formData.taxableTransfers?.length ?? 0) > 0 ||
      (formData.businessInterests?.length ?? 0) > 0
    )
  }

  function canCompute(): boolean {
    return isTab1Valid() && hasMinimumAssets()
  }

  return {
    activeTab, setActiveTab,
    formData, updateSection,
    saveProgress,
    isTab1Valid, hasMinimumAssets, canCompute
  }
}

// Derive Tab 1 defaults from inheritance engine input
function deriveTab1Defaults(
  inp: EngineInput
): Partial<EstateTaxEngineInput> {
  const decedent = inp.decedent
  return {
    decedent: {
      name:                 decedent?.name ?? '',
      dateOfDeath:          decedent?.date_of_death ?? '',
      citizenship:          'Filipino',
      isNonResidentAlien:   false,
      address:              '',
      maritalStatus:        resolveMaritalStatus(decedent),
      propertyRegime:       resolvePropertyRegime(decedent),
      totalWorldwideGrossEstate: null,
      totalWorldwideELIT:   null,
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
      isAmended: false, extensionToFile: false, extensionToPay: false,
      installmentGranted: false, judicialSettlement: false, hasTaxRelief: false
    }
  }
}

function resolveMaritalStatus(decedent: EngineInput['decedent']): MaritalStatus {
  if (!decedent?.is_married) return 'SINGLE'
  if (decedent.has_legal_separation) return 'LEGALLY_SEPARATED'
  return 'MARRIED'
}

function resolvePropertyRegime(decedent: EngineInput['decedent']): PropertyRegime | null {
  if (!decedent?.is_married) return null
  if (!decedent.date_of_marriage) return 'ACP'   // default for married without known date
  return decedent.date_of_marriage >= '1988-08-03' ? 'ACP' : 'CPG'
}
```

### 4.5 Routes

```typescript
// App.tsx — new routes added

import { Routes, Route } from 'react-router-dom'

<Routes>
  <Route path="/"               element={<Calculator />} />
  <Route path="/dashboard"      element={<RequireAuth><Dashboard /></RequireAuth>} />
  <Route path="/cases/:id"      element={<RequireAuth><CaseEditor /></RequireAuth>} />
  <Route path="/cases/:id/estate-tax"
                                element={<RequireAuth><EstateTaxWizard /></RequireAuth>} />
  <Route path="/cases/:id/estate-tax/results"
                                element={<RequireAuth><EstateTaxResults /></RequireAuth>} />
  <Route path="/share/:token"   element={<SharedCaseView />} />
</Routes>
```

---

## 5. Integration Points

### 5.1 With spec-pdf-export

- `generatePdf()` (inheritance only) is unchanged
- `generateCombinedPdf()` (this spec) extends it by appending Part II pages
- The `ActionsBar` "Export PDF" button becomes conditional:
  - If `estate_tax_computed = false` → "Generate Inheritance Report" → calls `generatePdf()`
  - If `estate_tax_computed = true` → "Generate Full Report" → calls `generateCombinedPdf()`
- Firm header data from `user_profiles` is shared between both PDF functions

### 5.2 With spec-auth-persistence

- Uses the `cases` table with the two new columns added by this spec's migration
- `tax_input_json` and `tax_output_json` columns were pre-defined in spec-auth-persistence for this use
- The `gross_estate` column is updated with the bridge value when user confirms recomputation
- All RLS policies from spec-auth-persistence apply — no new policies needed

### 5.3 With spec-estate-tax-inputs-wizard

- Tabs 2–8 of the estate tax wizard are fully specified in `spec-estate-tax-inputs-wizard`
- This spec provides the wizard shell (navigation, Tab 1, compute button, results)
- `spec-estate-tax-inputs-wizard` provides the field-by-field form design for Tabs 2–8
- Both specs share `useEstateTaxWizard` hook and `formData` state

### 5.4 With spec-shareable-links

- Shared cases show the Combined Results View if `estate_tax_computed = true`
- The estate tax tab is read-only in shared view (same as inheritance tab)
- No changes to sharing mechanism needed

### 5.5 With Inheritance WASM Bridge

- The inheritance WASM `compute()` function is called a second time when the user confirms "Recompute Inheritance"
- Input: same `inheritanceInput` from `AppState.estate-tax-results`, with `net_distributable_estate` overwritten with `bridgeValue`
- Output: new `EngineOutput` which replaces the original in `combined-results` state

### 5.6 With spec-case-export-zip

- The ZIP export includes `estate-tax-input.json`, `estate-tax-output.json` alongside the inheritance JSONs and PDF
- When `estate_tax_computed = true`, the ZIP contains all four JSON files plus the combined PDF

---

## 6. Edge Cases

### 6.1 User Changes Date of Death After Estate Tax Is Computed

**Scenario:** User opens the inheritance wizard, changes `decedent.date_of_death` (e.g., from 2024-03-15 to 2023-03-15 — crossing the TRAIN threshold into PRE_TRAIN).

**Detection:** When `inheritanceInput.decedent.date_of_death` differs from `estateTaxInput.decedent.dateOfDeath`, and `estate_tax_computed = true`.

**UI response:** A yellow warning banner appears in both the inheritance results and the estate tax tab:
```
⚠ Date of death has changed. The estate tax computation is stale.
  [ Re-run Estate Tax ]
```

**Behavior:** The stale estate tax output is NOT automatically discarded. `net_estate_auto_pop` is flagged. The "Generate Full Report" button is disabled until estate tax is re-run.

### 6.2 Net Estate Tax Due Is Zero

**Scenario:** Small estate (e.g., gross estate ₱3,000,000 → standard deduction ₱5,000,000 absorbs all → `netEstateTaxDue = 0`).

**Bridge value:** `max(0, Item40 − 0) = Item40 = net taxable estate`.

**UI:** "Update Distribution" modal changes text:
```
No estate tax is due on this estate.
The full net taxable estate (₱X) distributes to the heirs.

[ Confirm — Recompute with ₱X ]   [ Keep Manual Amount ]
```

**Results banner:**
```
✓ No estate tax due — full net taxable estate distributes to heirs
```

### 6.3 Item 40 Equals Zero

**Scenario:** Gross estate = all deductions + spouse share → `netTaxableEstate = 0`.

**Bridge value:** `max(0, 0 − 0) = 0`.

**UI:** Warning shown:
```
⚠ Net taxable estate is ₱0.00 — there is nothing to distribute to heirs
  from the tax-estate perspective. Check your asset and deduction inputs.
```

**"Update Distribution" modal:** Disabled. User cannot update inheritance with ₱0 (would produce ₱0 for all heirs). The modal shows:
```
The computed net distributable estate is ₱0.00. Applying this would
remove all heir shares. Review your estate tax inputs before updating.
```

### 6.4 Amnesty Filing Window Closed

**Scenario:** User elects amnesty for a death before 2022-05-31. The engine outputs a `AMNESTY_FILING_WINDOW_CLOSED` warning.

**UI:** The warning is shown prominently at the top of the estate tax results card in amber styling. The bridge formula is still computed and the user can still use the amnesty tax amount for historical reference.

**PDF:** The Part II separator page includes a banner:
```
HISTORICAL REFERENCE — AMNESTY FILING WINDOW CLOSED JUNE 14, 2025
```

### 6.5 NRA Decedent

**Scenario:** `isNonResidentAlien = true`.

**Validation:** The engine requires `totalWorldwideGrossEstate` and `totalWorldwideELIT` if ELIT deductions are declared. Tab 1 shows the NRA Additional Inputs section (§3.3).

**Warning added to results:**
```
⚠ Non-resident alien estate: Only Philippine-situs assets are included
  in this computation. The inheritance distribution covers PH-situs
  assets only. Worldwide assets may be subject to other jurisdictions.
```

**Bridge:** Same formula. The `net_distributable_estate` is derived from PH-situs assets only.

### 6.6 Pre-TRAIN Estate (Graduated Rates)

**Scenario:** `dateOfDeath < 2018-01-01`.

**No special handling in integration layer:** The estate tax engine auto-detects the PRE_TRAIN regime and returns graduated rate computation in `taxComputation.graduatedBracket`. The results view renders the bracket details:

```
Estate Tax Due (PRE_TRAIN Graduated):
  Bracket: ₱500,001 – ₱2,000,000 (8%)
  Base tax:     ₱15,000
  Excess:       ₱349,000 × 8% = ₱27,920
  Total:        ₱42,920
```

**Bridge formula:** Unchanged: `max(0, Item40 − Item44)`.

### 6.7 Very Large Estate (> ₱5,000,000 Gross Estate — CPA Required)

**Scenario:** TRAIN regime; gross estate > ₱5,000,000 → BIR requires CPA certification.

**UI flag in results:**
```
⚠ CPA Certification Required
  Gross estate exceeds ₱5,000,000. A certified public accountant must
  certify the estate tax return before filing (TRAIN Law requirement).
  This computational estimate does not substitute for CPA certification.
```

**PDF:** The filing information section (Part II, final page) includes this flag.

### 6.8 Estate Tax Wizard Opened for Shared Case

**Scenario:** A shared case URL is accessed. The estate tax tab is visible in read-only mode.

**Guard:** The route `/cases/:id/estate-tax` requires auth (`RequireAuth` wrapper). The shared view route `/share/:token` only shows the combined results view — there is no link to open the estate tax wizard from a shared view.

### 6.9 Estate Tax Input Partially Filled

**Scenario:** User fills Tab 1 and Tab 2 but closes the browser before completing Tabs 3–8.

**Recovery:** When the user reopens the case, `loadTaxInputDraft()` returns the partial `tax_input_json`. The wizard opens at Tab 1 with all previously entered data restored. Tabs with missing required data are indicated by an empty progress dot (○) and the "Compute Estate Tax" button remains disabled until minimum assets exist.

### 6.10 Recomputing After Partial Estate Tax Data

**Scenario:** User had a combined result, then edits inheritance inputs (adds a new heir). The inheritance engine reruns. The estate tax computation was based on the old inheritance inputs.

**Impact analysis:** Adding a new heir does NOT affect the estate tax computation — estate tax depends on assets and deductions, not on the heir list. Therefore, the existing `tax_output_json` remains valid.

**Exception:** If the user changes `net_distributable_estate` manually in the inheritance wizard after a combined result, `net_estate_auto_pop` is reset to `false` and the warning "Manual override applied — estate tax result no longer drives distribution" is shown.

---

## 7. Dependencies

### 7.1 Feature Dependencies (must be built first)

| Feature | Why Required |
|---------|-------------|
| `spec-auth-persistence` | `cases` table with `tax_input_json`, `tax_output_json` columns; authentication for wizard access |
| `spec-pdf-export` | `generatePdf()` function extended to `generateCombinedPdf()` |

### 7.2 Package Dependencies (additions to existing)

No new npm packages are required. The estate tax WASM bridge uses the same Vite WASM plugin already installed. `@react-pdf/renderer` is already specified in `spec-pdf-export`.

### 7.3 Rust/WASM Dependency

The estate tax engine WASM (`wasm/pkg/estate_tax_engine/`) must be built from the Rust implementation of `docs/plans/estate-tax-engine-spec.md`. This is a forward-loop deliverable outside this spec's scope. The bridge module (`wasm/estate-tax-bridge.ts`) can be written before the WASM is compiled; the bridge will fail at runtime until the WASM package is available.

### 7.4 Implementation Order within this Feature

```
1. Add DB migration (004_estate_tax_integration.sql)
2. Add EstateTaxEngineInput / EstateTaxEngineOutput TypeScript types
3. Add estate-tax-bridge.ts (WASM bridge skeleton, fails gracefully if WASM not yet built)
4. Extend AppState with three new phases
5. Build EstateTaxWizard component shell + Tab 1 (Decedent & Executor)
6. Build EstateTaxResults component (results card + bridge display)
7. Build "Update Distribution" modal
8. Build Combined Results view (tab switcher)
9. Extend generatePdf() → generateCombinedPdf()
10. Wire ActionsBar "Add Estate Tax" button
11. Add routes in App.tsx
12. (After spec-estate-tax-inputs-wizard) Build Tabs 2–8 and connect to wizard shell
```

---

## 8. Acceptance Criteria

### Authentication & Routing
- [ ] Anonymous user in results view sees "Compute Estate Tax" button
- [ ] Clicking it as anonymous triggers auth modal with message about saving the case
- [ ] After sign-in, user is redirected to `/cases/:id/estate-tax` with case auto-saved
- [ ] Authenticated user in results view clicks button and navigates directly to wizard
- [ ] Route `/cases/:id/estate-tax` is protected; unauthenticated access redirects to auth modal
- [ ] Shared case URL (`/share/:token`) shows combined results read-only; no link to estate tax wizard

### Estate Tax Wizard — Tab 1
- [ ] Tab 1 pre-populates `decedent.name` and `decedent.dateOfDeath` from inheritance input
- [ ] `maritalStatus` is correctly derived: `is_married=true` → `MARRIED`; `has_legal_separation=true` → `LEGALLY_SEPARATED`; else `SINGLE`
- [ ] `propertyRegime` is pre-populated from marriage date (ACP for post-Aug 1988, CPG for earlier)
- [ ] Tax regime label is shown read-only and updates in real time when `dateOfDeath` is changed
- [ ] NRA Additional Inputs section is hidden when `isNonResidentAlien = false`; shown when `true`
- [ ] Tab 1 validation rejects empty `name`, `address`, `executor.name`
- [ ] TIN field validates pattern `\d{3}-\d{3}-\d{3}-\d{3}` when provided

### Wizard Navigation
- [ ] "Save Progress" writes `tax_input_json` to Supabase without running the engine
- [ ] "← Back" from Tab 1 returns to inheritance results without discarding form state
- [ ] All 8 tab buttons are visible and clickable in the tab bar
- [ ] Progress dots show completed (●), current (●), and pending (○) tabs
- [ ] "Compute Estate Tax" button is disabled when no assets are entered
- [ ] "Compute Estate Tax" button is disabled when Tab 1 is invalid

### Estate Tax Computation
- [ ] Clicking "Compute Estate Tax" calls `computeEstateTax(formData)` via WASM bridge
- [ ] Computing state shows animated progress bar
- [ ] On success, navigates to estate tax results view at `/cases/:id/estate-tax/results`
- [ ] On WASM error, shows error message with "← Fix Inputs" button
- [ ] `tax_input_json` and `tax_output_json` are saved to Supabase after successful computation
- [ ] `estate_tax_computed = true` is set on the case

### Estate Tax Results View
- [ ] Form 1801 summary card shows all items (29–44) with correct ₱ formatting (comma separators, 2 decimal places)
- [ ] Bridge value (Item 40 − Item 44) is prominently displayed in green
- [ ] Zero tax case shows "No estate tax due" banner
- [ ] Amnesty window closed warning is shown in amber when amnesty was elected
- [ ] CPA certification requirement flag shown when gross estate > ₱5,000,000
- [ ] Engine warnings are listed below the summary card
- [ ] "Yes — Recompute Inheritance" button shows the computed bridge value in its label
- [ ] "Keep Manual Amount" button shows the current manual `net_distributable_estate` in its label

### Update Distribution Modal
- [ ] Modal shows previous (manual) value and new (bridge) value
- [ ] Confirming triggers inheritance WASM rerun with bridge value as `net_distributable_estate`
- [ ] After rerun, combined results view is shown with updated per-heir shares
- [ ] `inheritance_input_json`, `inheritance_output_json`, `gross_estate`, `net_estate_auto_pop = true` are saved
- [ ] Cancelling saves estate tax result only; inheritance amounts unchanged; `net_estate_auto_pop = false`

### Combined Results View
- [ ] Tab bar shows "Inheritance Distribution" and "Estate Tax — Form 1801"
- [ ] Switching tabs preserves scroll position within each tab
- [ ] Inheritance tab shows "✓ Derived from estate tax computation" when `net_estate_auto_pop = true`
- [ ] Inheritance tab shows "⚠ Manually entered" when `net_estate_auto_pop = false`
- [ ] Estate Tax tab shows read-only Form 1801 summary
- [ ] "Generate Full Report PDF" button is shown (replaces "Generate Inheritance Report")
- [ ] "Re-run Estate Tax" opens wizard with existing inputs pre-filled

### Combined PDF
- [ ] PDF contains Part I (inheritance distribution, unchanged from spec-pdf-export) and Part II (estate tax)
- [ ] Part II includes: regime, gross estate schedule, deductions schedule, net estate, spouse share, net taxable estate, tax due, bridge value
- [ ] Part II separator page is present between Part I and Part II
- [ ] Filing deadline shown on Part II final page (1 year from DOD formatted as `YYYY-MM-DD`)
- [ ] Legal disclaimer is present on final page
- [ ] PDF renders correctly for TRAIN, PRE_TRAIN, and AMNESTY regimes

### Stale Tax Warning
- [ ] Changing `date_of_death` in inheritance wizard after estate tax is computed shows stale warning
- [ ] "Generate Full Report" is disabled when tax computation is stale
- [ ] Stale warning persists until estate tax is re-run

### Data Integrity
- [ ] Opening a case with `estate_tax_computed = true` loads combined results view (not results-only view)
- [ ] Opening a case with `estate_tax_computed = false` loads standard results view with "Add Estate Tax" button
- [ ] Reloading the page mid-wizard restores all entered form data from `tax_input_json`

---

## 9. File Changes Required

| File | Change |
|------|--------|
| `supabase/migrations/004_estate_tax_integration.sql` | NEW — ALTER TABLE adds `estate_tax_computed`, `net_estate_auto_pop` columns |
| `src/types/estate-tax.ts` | NEW — EstateTaxEngineInput, EstateTaxEngineOutput, BridgeResult types |
| `src/types/db.ts` | MODIFY — add `estate_tax_computed`, `net_estate_auto_pop` to CaseRow |
| `src/wasm/estate-tax-bridge.ts` | NEW — WASM bridge for estate tax engine |
| `src/lib/cases.ts` | MODIFY — add `saveTaxInputDraft`, `saveTaxOutput`, `saveRecomputedInheritance`, `loadTaxInputDraft` |
| `src/lib/generateCombinedPdf.ts` | NEW — combined PDF generation function |
| `src/hooks/useEstateTaxWizard.ts` | NEW — wizard state, tab navigation, pre-population, validation |
| `src/components/results/ActionsBar.tsx` | MODIFY — add "Compute Estate Tax" CTA |
| `src/pages/EstateTaxWizard.tsx` | NEW — wizard shell + Tab 1 |
| `src/pages/EstateTaxResults.tsx` | NEW — Form 1801 summary card + bridge display + Update modal |
| `src/pages/CombinedResults.tsx` | NEW — tabbed combined view |
| `src/App.tsx` | MODIFY — extend AppState, add routes, add transition handlers |
