# Zod Schemas — TaxKlaro Engine Interface

**Wave:** 3 (Frontend Data Model)
**Status:** COMPLETE
**Date:** 2026-03-06
**Depends on:** typescript-types, serde-wire-format, error-contract

---

## Purpose

This document specifies the exact Zod schemas for every type in the TaxKlaro engine interface. Schemas enforce the serde wire format contract at the TypeScript layer, catching type mismatches before they reach the WASM engine.

**Key Zod rules (matching serde-wire-format):**
- `z.object({}).strict()` — rejects unknown fields on ALL input types (matches `deny_unknown_fields`)
- `z.boolean()` NOT `z.coerce.boolean()` — serde rejects string booleans
- `z.number().int()` NOT `z.coerce.number()` — serde rejects string-encoded integers
- `z.nullable()` NOT `z.optional()` — Option<T> serializes as null, not absent key
- `z.string().regex(PESO_RE)` — Decimal values are strings, validated by regex
- Output types use `z.object({})` without `.strict()` — forward-compatible

**Important distinction:**
- **Input schemas** = used before calling `compute_json()` — must be `.strict()`
- **Output schemas** = used after parsing WASM result — NOT `.strict()` (allow new fields)
- **Form schemas** = used for the React form (per-step, may be coercing/partial) — separate from engine schemas

---

## File Organization

```
src/
  schemas/
    primitives.ts    — Peso, Rate, ISODate, TaxYear, Quarter regex/validators
    enums.ts         — All 14 enum schemas (z.enum([...]))
    input.ts         — TaxpayerInput and all input sub-schemas
    output.ts        — TaxComputationResult and all output sub-schemas
    bridge.ts        — WasmResult<T> wrapper schemas
    index.ts         — Re-exports all schemas
```

---

## 1. `src/schemas/primitives.ts`

```typescript
import { z } from 'zod';

// ============================================================================
// Regex Patterns
// ============================================================================

/** Decimal string: digits, optional decimal point, optional fractional digits.
 * Matches: "0.00", "1234567.89", "0", "1200000"
 * Rejects: "1.23e6", "-500" (negative not allowed for peso inputs), ""
 */
export const PESO_RE = /^\d+(\.\d+)?$/;

/** Rate (percentage as decimal): may have many fractional digits.
 * Matches: "0.08", "0.063333", "0.00", "1.00"
 */
export const RATE_RE = /^\d+(\.\d+)?$/;

/** ISO 8601 date string: YYYY-MM-DD only. */
export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** TIN format: "XXX-XXX-XXX" or "XXX-XXX-XXX-XXXX" */
export const TIN_RE = /^\d{3}-\d{3}-\d{3}(-\d{4})?$/;

// ============================================================================
// Primitive Schemas
// ============================================================================

/**
 * Peso: decimal string, non-negative, arbitrary precision.
 * Serde serializes Decimal as string → never a JS number.
 * Input: user values will be coerced to strings by the UI before sending to WASM.
 */
export const PesoSchema = z
  .string()
  .regex(PESO_RE, { message: 'Amount must be a non-negative decimal string (e.g., "1234.56")' });

/**
 * Rate: percentage as decimal string (e.g., "0.08" for 8%).
 * Same format as Peso but semantically different.
 */
export const RateSchema = z
  .string()
  .regex(RATE_RE, { message: 'Rate must be a non-negative decimal string (e.g., "0.08")' });

/**
 * ISO date string: "YYYY-MM-DD".
 * NaiveDate serialized via DisplayFromStr.
 */
export const ISODateSchema = z
  .string()
  .regex(ISO_DATE_RE, { message: 'Date must be in YYYY-MM-DD format' });

/**
 * Tax year: integer 2018–2030.
 * Rust i32 serializes as JSON number.
 */
export const TaxYearSchema = z
  .number()
  .int({ message: 'Tax year must be an integer' })
  .min(2018, { message: 'Tax year must be 2018 or later' })
  .max(2030, { message: 'Tax year must be 2030 or earlier' });

/**
 * Quarter: 1, 2, or 3.
 * NOT a string — Rust i32 serializes as JSON number.
 * Note: Form2551QOutput uses Quarter | 4 (separate schema below).
 */
export const QuarterSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

/**
 * Quarter (including Q4) — used only for Form2551QOutput.
 */
export const QuarterOrFourSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);
```

---

## 2. `src/schemas/enums.ts`

```typescript
import { z } from 'zod';

// Every enum serializes as SCREAMING_SNAKE_CASE string (serde rename_all = "SCREAMING_SNAKE_CASE").
// z.enum([...]) validates at parse time — rejects any string not in the union.

export const TaxpayerTypeSchema = z.enum([
  'PURELY_SE',
  'MIXED_INCOME',
  'COMPENSATION_ONLY',
]);

export const TaxpayerTierSchema = z.enum([
  'MICRO',
  'SMALL',
  'MEDIUM',
  'LARGE',
]);

export const FilingPeriodSchema = z.enum(['Q1', 'Q2', 'Q3', 'ANNUAL']);

// Note: ANNUAL is the only value valid for annual returns.
// Q1/Q2/Q3 valid for quarterly only. Q4 does NOT exist for 1701Q.
export const QuarterlyFilingPeriodSchema = z.enum(['Q1', 'Q2', 'Q3']);

export const IncomeTypeSchema = z.enum([
  'PURELY_SE',
  'MIXED_INCOME',
  'COMPENSATION_ONLY',
  'ZERO_INCOME',
]);

export const TaxpayerClassSchema = z.enum(['SERVICE_PROVIDER', 'TRADER']);

export const RegimePathSchema = z.enum(['PATH_A', 'PATH_B', 'PATH_C']);

/**
 * RegimeElection: user's explicit regime choice.
 * null = optimizer mode (engine picks best).
 * Used as z.nullable() in input schemas.
 */
export const RegimeElectionSchema = z.enum([
  'ELECT_EIGHT_PCT',
  'ELECT_OSD',
  'ELECT_ITEMIZED',
]);

export const DeductionMethodSchema = z.enum(['ITEMIZED', 'OSD', 'NONE']);

export const BalanceDispositionSchema = z.enum([
  'BALANCE_PAYABLE',
  'ZERO_BALANCE',
  'OVERPAYMENT',
]);

export const ReturnTypeSchema = z.enum(['ORIGINAL', 'AMENDED']);

export const FormTypeSchema = z.enum([
  'FORM_1701',
  'FORM_1701A',
  'FORM_1701Q',
]);

export const CwtClassificationSchema = z.enum([
  'INCOME_TAX_CWT',
  'PERCENTAGE_TAX_CWT',
  'UNKNOWN',
]);

export const DepreciationMethodSchema = z.enum([
  'STRAIGHT_LINE',
  'DECLINING_BALANCE',
]);

/**
 * OverpaymentDisposition: used in OUTPUT only for full set.
 * PENDING_ELECTION is an engine output value — NEVER valid as input.
 */
export const OverpaymentDispositionSchema = z.enum([
  'CARRY_OVER',
  'REFUND',
  'TCC',
  'PENDING_ELECTION',
]);

/**
 * OverpaymentPreferenceInput: valid values for the INPUT field.
 * Explicitly excludes PENDING_ELECTION — serde rejects it via PL-01 check.
 */
export const OverpaymentPreferenceInputSchema = z.enum([
  'CARRY_OVER',
  'REFUND',
  'TCC',
]);
```

---

## 3. `src/schemas/input.ts`

All input schemas use `.strict()` to reject unknown fields, matching Rust's `deny_unknown_fields`.

```typescript
import { z } from 'zod';
import {
  PesoSchema, ISODateSchema, TaxYearSchema, QuarterSchema, QuarterlyFilingPeriodSchema,
} from './primitives';
import {
  TaxpayerTypeSchema, FilingPeriodSchema, RegimeElectionSchema,
  ReturnTypeSchema, DepreciationMethodSchema, OverpaymentPreferenceInputSchema,
} from './enums';

// ============================================================================
// DepreciationEntry
// ============================================================================

export const DepreciationEntrySchema = z.object({
  assetName: z.string().min(1, { message: 'Asset name is required' }),
  assetCost: PesoSchema,
  salvageValue: PesoSchema,
  usefulLifeYears: z
    .number()
    .int({ message: 'Useful life must be an integer' })
    .min(1, { message: 'Useful life must be at least 1 year' })
    .max(50, { message: 'Useful life cannot exceed 50 years' }),
  acquisitionDate: ISODateSchema,
  method: DepreciationMethodSchema,
  priorAccumulatedDepreciation: PesoSchema,
}).strict();
// CRITICAL: .strict() rejects any unknown fields → matches deny_unknown_fields

export type DepreciationEntryInput = z.infer<typeof DepreciationEntrySchema>;

// ============================================================================
// NolcoEntry
// ============================================================================

export const NolcoEntrySchema = z.object({
  lossYear: TaxYearSchema,
  originalLoss: PesoSchema,
  remainingBalance: PesoSchema,
  expiryYear: z
    .number()
    .int()
    .min(2018)
    .max(2033),
  // expiryYear = lossYear + 3; max = 2030 + 3 = 2033
}).strict();

export type NolcoEntryInput = z.infer<typeof NolcoEntrySchema>;

// ============================================================================
// ItemizedExpenseInput
// ============================================================================

export const ItemizedExpenseInputSchema = z.object({
  // General expenses
  salariesAndWages: PesoSchema,
  sssPhilhealthPagibigEmployerShare: PesoSchema,
  rent: PesoSchema,
  utilities: PesoSchema,
  communication: PesoSchema,
  officeSupplies: PesoSchema,
  professionalFeesPaid: PesoSchema,
  travelTransportation: PesoSchema,
  insurancePremiums: PesoSchema,

  // Financial expenses
  interestExpense: PesoSchema,
  finalTaxedInterestIncome: PesoSchema,
  taxesAndLicenses: PesoSchema,
  casualtyTheftLosses: PesoSchema,
  badDebts: PesoSchema,
  isAccrualBasis: z.boolean(),
  // z.boolean() — NOT z.coerce.boolean(). Serde rejects "true"/"false" strings.

  // Depreciation list
  depreciationEntries: z.array(DepreciationEntrySchema),
  // Empty array [] is valid (no depreciation). Never null.

  // Special deductions
  charitableContributions: PesoSchema,
  charitableAccredited: z.boolean(),
  researchDevelopment: PesoSchema,
  entertainmentRepresentation: PesoSchema,
  homeOfficeExpense: PesoSchema,
  homeOfficeExclusiveUse: z.boolean(),

  // NOLCO
  nolcoEntries: z.array(NolcoEntrySchema),
  // Empty array [] is valid.
}).strict();

export type ItemizedExpenseInputData = z.infer<typeof ItemizedExpenseInputSchema>;

// ============================================================================
// Form2307Entry
// ============================================================================

export const Form2307EntrySchema = z.object({
  payorName: z.string().min(1, { message: 'Payor name is required' }),
  payorTin: z
    .string()
    .regex(/^\d{3}-\d{3}-\d{3}(-\d{4})?$/, {
      message: 'TIN must be in XXX-XXX-XXX or XXX-XXX-XXX-XXXX format',
    }),
  atcCode: z.string().min(1, { message: 'ATC code is required' }),
  incomePayment: PesoSchema,
  taxWithheld: PesoSchema,
  periodFrom: ISODateSchema,
  periodTo: ISODateSchema,
  quarterOfCredit: QuarterSchema.nullable(),
  // null for annual filing, 1/2/3 for quarterly attribution
  // IMPORTANT: number (not string), or null. NOT z.optional().
}).strict();

export type Form2307EntryData = z.infer<typeof Form2307EntrySchema>;

// ============================================================================
// QuarterlyPayment
// ============================================================================

export const QuarterlyPaymentSchema = z.object({
  quarter: QuarterSchema,
  // z.union([z.literal(1), z.literal(2), z.literal(3)]) — number, not string
  amountPaid: PesoSchema,
  datePaid: ISODateSchema.nullable(),
  // null if payment date unknown
  form1701qPeriod: QuarterlyFilingPeriodSchema,
  // "Q1" | "Q2" | "Q3" — must match quarter (Q1=1, Q2=2, Q3=3)
}).strict();

export type QuarterlyPaymentData = z.infer<typeof QuarterlyPaymentSchema>;

// ============================================================================
// TaxpayerInput (top-level engine input)
// ============================================================================

export const TaxpayerInputSchema = z.object({
  // --- Identity / Classification ---
  taxpayerType: TaxpayerTypeSchema,
  taxYear: TaxYearSchema,
  filingPeriod: FilingPeriodSchema,
  isMixedIncome: z.boolean(),

  // --- Registration Status ---
  isVatRegistered: z.boolean(),
  isBmbeRegistered: z.boolean(),
  subjectToSec117128: z.boolean(),
  isGppPartner: z.boolean(),

  // --- Business Income ---
  grossReceipts: PesoSchema,
  salesReturnsAllowances: PesoSchema,
  nonOperatingIncome: PesoSchema,
  fwtIncome: PesoSchema,
  costOfGoodsSold: PesoSchema,

  // --- Compensation Income ---
  taxableCompensation: PesoSchema,
  compensationCwt: PesoSchema,

  // --- Itemized Expenses ---
  itemizedExpenses: ItemizedExpenseInputSchema,
  // Always present, even if OSD selected (all fields = "0.00")

  // --- Regime Election ---
  electedRegime: RegimeElectionSchema.nullable(),
  // null = optimizer mode. NOT optional — always present, may be null.
  osdElected: z.boolean().nullable(),
  // null = let engine decide. NOT optional.

  // --- Prior Period Data ---
  priorQuarterlyPayments: z.array(QuarterlyPaymentSchema),
  cwt2307Entries: z.array(Form2307EntrySchema),
  priorYearExcessCwt: PesoSchema,

  // --- Penalty Inputs ---
  actualFilingDate: ISODateSchema.nullable(),
  // null = assume on-time filing
  returnType: ReturnTypeSchema,
  priorPaymentForReturn: PesoSchema,
  // "0.00" for ORIGINAL returns

  // --- Overpayment Preference ---
  overpaymentPreference: OverpaymentPreferenceInputSchema.nullable(),
  // null = auto-assign. "PENDING_ELECTION" is FORBIDDEN here.
}).strict();
// CRITICAL: .strict() — any extra field in the submitted JSON causes parse failure
// This matches serde's deny_unknown_fields behavior exactly.

export type TaxpayerInputData = z.infer<typeof TaxpayerInputSchema>;

// ============================================================================
// Per-Field Validation Constraints (beyond basic type)
// ============================================================================
// These are used in wizard form validation (not engine submission).
// Source: frontend/validation-rules.md

/**
 * Enhanced TaxpayerInput schema with domain-level constraints.
 * Use this for final pre-submission validation (see ValidationRulesSchema below).
 */
export const TaxpayerInputWithConstraintsSchema = TaxpayerInputSchema
  .omit({ itemizedExpenses: true }) // handled separately
  .extend({
    // taxYear additional constraint: for annual returns, must be <= currentYear - 1
    // This is enforced in the form layer (not re-enforced here — engine catches it).

    // grossReceipts ≥ salesReturnsAllowances (GV-01)
    grossReceipts: PesoSchema,
    salesReturnsAllowances: PesoSchema,

    // costOfGoodsSold ≤ grossReceipts (GV-02)
    costOfGoodsSold: PesoSchema,

    // compensationCwt ≤ 35% of taxableCompensation (soft check, not enforced here)

    itemizedExpenses: ItemizedExpenseInputSchema,
  })
  .refine(
    (data) => {
      // GV-01: salesReturnsAllowances <= grossReceipts
      const gr = parseFloat(data.grossReceipts);
      const sra = parseFloat(data.salesReturnsAllowances);
      return sra <= gr;
    },
    {
      message: 'Sales returns and allowances cannot exceed gross receipts',
      path: ['salesReturnsAllowances'],
    }
  )
  .refine(
    (data) => {
      // GV-02: costOfGoodsSold <= grossReceipts
      const gr = parseFloat(data.grossReceipts);
      const cogs = parseFloat(data.costOfGoodsSold);
      return cogs <= gr;
    },
    {
      message: 'Cost of goods sold cannot exceed gross receipts',
      path: ['costOfGoodsSold'],
    }
  )
  .refine(
    (data) => {
      // GV-03: priorQuarterlyPayments max 3 entries for ANNUAL filing
      if (data.filingPeriod === 'ANNUAL') {
        return data.priorQuarterlyPayments.length <= 3;
      }
      return true;
    },
    {
      message: 'Annual returns can have at most 3 prior quarterly payments (Q1, Q2, Q3)',
      path: ['priorQuarterlyPayments'],
    }
  )
  .refine(
    (data) => {
      // Validate each DepreciationEntry: salvageValue <= assetCost
      return data.itemizedExpenses.depreciationEntries.every(
        (entry) => parseFloat(entry.salvageValue) <= parseFloat(entry.assetCost)
      );
    },
    {
      message: 'Salvage value cannot exceed asset cost in depreciation entries',
      path: ['itemizedExpenses', 'depreciationEntries'],
    }
  )
  .refine(
    (data) => {
      // Validate each NolcoEntry: remainingBalance <= originalLoss
      return data.itemizedExpenses.nolcoEntries.every(
        (entry) => parseFloat(entry.remainingBalance) <= parseFloat(entry.originalLoss)
      );
    },
    {
      message: 'NOLCO remaining balance cannot exceed original loss',
      path: ['itemizedExpenses', 'nolcoEntries'],
    }
  )
  .refine(
    (data) => {
      // Validate each Form2307Entry: taxWithheld <= incomePayment
      return data.cwt2307Entries.every(
        (entry) => parseFloat(entry.taxWithheld) <= parseFloat(entry.incomePayment)
      );
    },
    {
      message: 'Tax withheld cannot exceed income payment in Form 2307 entries',
      path: ['cwt2307Entries'],
    }
  )
  .refine(
    (data) => {
      // Validate each Form2307Entry: periodTo >= periodFrom
      return data.cwt2307Entries.every(
        (entry) => entry.periodTo >= entry.periodFrom
      );
    },
    {
      message: 'Form 2307 period end must be on or after period start',
      path: ['cwt2307Entries'],
    }
  )
  .strict();
```

---

## 4. `src/schemas/output.ts`

Output schemas do NOT use `.strict()` — allows the engine to add new fields in future versions without breaking existing frontends.

```typescript
import { z } from 'zod';
import {
  PesoSchema, RateSchema, ISODateSchema, TaxYearSchema, QuarterSchema, QuarterOrFourSchema,
} from './primitives';
import {
  TaxpayerTypeSchema, TaxpayerTierSchema, FilingPeriodSchema, IncomeTypeSchema,
  TaxpayerClassSchema, RegimePathSchema, DeductionMethodSchema, BalanceDispositionSchema,
  FormTypeSchema, CwtClassificationSchema, OverpaymentDispositionSchema,
  DepreciationMethodSchema, ReturnTypeSchema,
} from './enums';

// ============================================================================
// Shared Small Structs
// ============================================================================

export const ValidationWarningSchema = z.object({
  code: z.string(),
  message: z.string(),
  severity: z.enum(['WARNING', 'INFO']),
});
// No .strict() — output type

export const ManualReviewFlagSchema = z.object({
  code: z.string(),
  title: z.string(),
  message: z.string(),
  fieldAffected: z.string(),
  engineAction: z.string(),
});

// ============================================================================
// NolcoEntry (output — same shape as input but no deny_unknown_fields)
// ============================================================================

export const NolcoEntryOutputSchema = z.object({
  lossYear: TaxYearSchema,
  originalLoss: PesoSchema,
  remainingBalance: PesoSchema,
  expiryYear: z.number().int(),
});

// ============================================================================
// DepreciationEntry (output echo — same as input but without strict)
// ============================================================================

export const DepreciationEntryOutputSchema = z.object({
  assetName: z.string(),
  assetCost: PesoSchema,
  salvageValue: PesoSchema,
  usefulLifeYears: z.number().int(),
  acquisitionDate: ISODateSchema,
  method: DepreciationMethodSchema,
  priorAccumulatedDepreciation: PesoSchema,
});

// ============================================================================
// Form2307Entry (output echo)
// ============================================================================

export const Form2307EntryOutputSchema = z.object({
  payorName: z.string(),
  payorTin: z.string(),
  atcCode: z.string(),
  incomePayment: PesoSchema,
  taxWithheld: PesoSchema,
  periodFrom: ISODateSchema,
  periodTo: ISODateSchema,
  quarterOfCredit: QuarterSchema.nullable(),
});

// ============================================================================
// InputSummary
// ============================================================================

export const InputSummarySchema = z.object({
  taxYear: TaxYearSchema,
  filingPeriod: FilingPeriodSchema,
  taxpayerType: TaxpayerTypeSchema,
  taxpayerTier: TaxpayerTierSchema,
  grossReceipts: PesoSchema,
  isVatRegistered: z.boolean(),
  incomeType: IncomeTypeSchema,
});

// ============================================================================
// GrossAggregates
// ============================================================================

export const GrossAggregatesSchema = z.object({
  netGrossReceipts: PesoSchema,
  grossIncome: PesoSchema,
  thresholdBase: PesoSchema,
  eightPctBase: PesoSchema,
  graduatedIncomeBase: PesoSchema,
  ptQuarterlyBase: PesoSchema,
  taxpayerClass: TaxpayerClassSchema,
});

// ============================================================================
// DeductionBreakdown
// ============================================================================

export const DeductionBreakdownSchema = z.object({
  salaries: PesoSchema,
  employeeBenefits: PesoSchema,
  rent: PesoSchema,
  utilities: PesoSchema,
  communication: PesoSchema,
  officeSupplies: PesoSchema,
  professionalFees: PesoSchema,
  travelTransportation: PesoSchema,
  insurance: PesoSchema,
  interest: PesoSchema,
  taxesLicenses: PesoSchema,
  losses: PesoSchema,
  badDebts: PesoSchema,
  depreciation: PesoSchema,
  charitable: PesoSchema,
  researchDevelopment: PesoSchema,
  entertainmentRepresentation: PesoSchema,
  homeOffice: PesoSchema,
  nolco: PesoSchema,
});

// ============================================================================
// Path Results
// ============================================================================

export const PathAResultSchema = z.object({
  eligible: z.boolean(),
  ptDeductionApplied: PesoSchema,
  bizNti: PesoSchema,
  totalNti: PesoSchema,
  incomeTaxDue: PesoSchema,
  deductionMethod: z.literal('ITEMIZED'),
  pathLabel: z.string(),
  deductionBreakdown: DeductionBreakdownSchema,
  totalDeductions: PesoSchema,
  earCapApplied: PesoSchema,
  interestArbitrageReduction: PesoSchema,
  nolcoRemaining: z.array(NolcoEntryOutputSchema),
});

export const PathBResultSchema = z.object({
  eligible: z.boolean(),
  bizNti: PesoSchema,
  totalNti: PesoSchema,
  incomeTaxDue: PesoSchema,
  osdAmount: PesoSchema,
  deductionMethod: z.literal('OSD'),
  pathLabel: z.string(),
  osdBase: PesoSchema,
});

export const PathCResultSchema = z.object({
  eligible: z.boolean(),
  ineligibleReasons: z.array(z.string()),
  exemptAmount: PesoSchema,
  taxableBase: PesoSchema,
  incomeTaxDue: PesoSchema,
  compensationIt: PesoSchema,
  totalIncomeTax: PesoSchema,
  ptWaived: z.boolean(),
  deductionMethod: z.literal('NONE'),
  pathLabel: z.string(),
});

// ============================================================================
// RegimeOption (comparison row)
// ============================================================================

export const RegimeOptionSchema = z.object({
  path: RegimePathSchema,
  incomeTaxDue: PesoSchema,
  percentageTaxDue: PesoSchema,
  totalTaxBurden: PesoSchema,
  label: z.string(),
  requiresDocumentation: z.boolean(),
  requiresOas: z.boolean(),
  effectiveRate: RateSchema,
});

// ============================================================================
// PercentageTaxResult
// ============================================================================

export const PercentageTaxResultSchema = z.object({
  ptApplies: z.boolean(),
  ptRate: RateSchema,
  ptBase: PesoSchema,
  ptDue: PesoSchema,
  form2551qRequired: z.boolean(),
  filingDeadline: ISODateSchema.nullable(),
  reason: z.string(),
});

// ============================================================================
// PenaltyStack + PenaltyResult
// ============================================================================

export const PenaltyStackSchema = z.object({
  surcharge: PesoSchema,
  interest: PesoSchema,
  compromise: PesoSchema,
  total: PesoSchema,
});

export const PenaltyResultSchema = z.object({
  applies: z.boolean(),
  daysLate: z.number().int(),
  monthsLate: z.number().int(),
  itPenalties: PenaltyStackSchema,
  ptPenalties: PenaltyStackSchema,
  totalPenalties: PesoSchema,
});

// ============================================================================
// Form Output Types
// ============================================================================

// Form1701AOutput
export const Form1701AOutputSchema = z.object({
  // Header
  taxYearCovered: TaxYearSchema,
  amendedReturn: z.boolean(),
  shortPeriodReturn: z.boolean(),
  fiscalYearEnd: ISODateSchema.nullable(),
  // Part I
  tin: z.string(),
  rdoCode: z.string(),
  taxpayerNameLast: z.string(),
  taxpayerNameFirst: z.string(),
  taxpayerNameMiddle: z.string(),
  citizenship: z.string(),
  civilStatus: z.string(),
  registeredAddress: z.string(),
  zipCode: z.string(),
  contactNumber: z.string(),
  emailAddress: z.string(),
  businessName: z.string(),
  psicCode: z.string(),
  methodOfDeduction: z.string(),
  typeOfTaxpayer: z.string(),
  birthday: ISODateSchema,
  atcCode: z.string(),
  isAvailingOsd: z.boolean(),
  isAvailing8pct: z.boolean(),
  // Part II
  incomeTaxDue: PesoSchema,
  lessTaxRelief: PesoSchema,
  incomeTaxDueNetOfRelief: PesoSchema,
  addPenaltiesSurcharge: PesoSchema,
  addPenaltiesInterest: PesoSchema,
  addPenaltiesCompromise: PesoSchema,
  totalTaxPayable: PesoSchema,
  lessTaxCredits: PesoSchema,
  netTaxPayable: PesoSchema,
  overpayment: PesoSchema,
  overpaymentToBeRefunded: z.boolean(),
  overpaymentToBeIssuedTcc: z.boolean(),
  overpaymentToCarryOver: z.boolean(),
  // Part III
  cpaTin: z.string().nullable(),
  cpaName: z.string().nullable(),
  cpaAccreditationNumber: z.string().nullable(),
  // Part IV-A: OSD path
  ivaGrossSalesServices: PesoSchema,
  ivaSalesReturnsAllowances: PesoSchema,
  ivaNetSales: PesoSchema,
  ivaCostOfSales: PesoSchema,
  ivaTotalGrossIncome: PesoSchema,
  ivaNonOpIncomeInterest: PesoSchema,
  ivaNonOpIncomeRental: PesoSchema,
  ivaNonOpIncomeRoyalty: PesoSchema,
  ivaNonOpIncomeDividend: PesoSchema,
  ivaNonOpIncomeOthers: PesoSchema,
  ivaOsdAmount: PesoSchema,
  ivaNetTaxableIncome: PesoSchema,
  ivaGraduatedTaxTable1: PesoSchema,
  ivaGraduatedTaxTable2: PesoSchema,
  ivaIncomeTaxDue: PesoSchema,
  // Part IV-B: 8% path
  ivbGrossSalesServices: PesoSchema,
  ivbSalesReturnsAllowances: PesoSchema,
  ivbNetSales: PesoSchema,
  ivbNonOpIncomeInterest: PesoSchema,
  ivbNonOpIncomeRental: PesoSchema,
  ivbNonOpIncomeRoyalty: PesoSchema,
  ivbNonOpIncomeDividend: PesoSchema,
  ivbNonOpIncomeOthers: PesoSchema,
  ivbTotalGross: PesoSchema,
  ivbLess250k: PesoSchema,
  ivbTaxableIncome: PesoSchema,
  ivbIncomeTaxDue: PesoSchema,
  // Tax Credits
  tcPriorYearExcess: PesoSchema,
  tcQuarterly1701qPayments: PesoSchema,
  tcCwtQ1Q2Q3: PesoSchema,
  tcCwtQ4: PesoSchema,
  tcPriorFilingPayment: PesoSchema,
  tcForeignTaxCredits: PesoSchema,
  tcOtherCredits: PesoSchema,
  tcTotalCredits: PesoSchema,
});

// Form1701Output — full schema (abbreviated for clarity; same pattern)
export const NolcoScheduleRowSchema = z.object({
  colAYearIncurred: TaxYearSchema,
  colBOriginalLoss: PesoSchema,
  colCAppliedPriorYears: PesoSchema,
  colDBalanceBeginning: PesoSchema,
  colEAppliedCurrentYear: PesoSchema,
  colFBalanceEnd: PesoSchema,
  expiryYear: TaxYearSchema,
  expired: z.boolean(),
});

export const Form1701OutputSchema = z.object({
  // Header
  taxYearCovered: TaxYearSchema,
  amendedReturn: z.boolean(),
  shortPeriodReturn: z.boolean(),
  // Part I
  tin: z.string(),
  rdoCode: z.string(),
  taxpayerNameLast: z.string(),
  taxpayerNameFirst: z.string(),
  taxpayerNameMiddle: z.string(),
  citizenship: z.string(),
  civilStatus: z.string(),
  registeredAddress: z.string(),
  zipCode: z.string(),
  contactNumber: z.string(),
  emailAddress: z.string(),
  businessName: z.string(),
  psicCode: z.string(),
  methodOfDeduction: z.string(),
  typeOfTaxpayer: z.string(),
  birthday: ISODateSchema,
  atcCode: z.string(),
  withBusinessIncome: z.boolean(),
  withCompensationIncome: z.boolean(),
  // Part II: Tax Payable
  incomeTaxDue: PesoSchema,
  lessTaxRelief: PesoSchema,
  netTaxDue: PesoSchema,
  surcharge: PesoSchema,
  interest: PesoSchema,
  compromise: PesoSchema,
  totalPayable: PesoSchema,
  lessTaxCreditsTotal: PesoSchema,
  netPayable: PesoSchema,
  overpaymentAmount: PesoSchema,
  overpaymentRefund: z.boolean(),
  overpaymentTcc: z.boolean(),
  overpaymentCarryOver: z.boolean(),
  secondInstallmentAmount: PesoSchema,
  // Schedule 2: Compensation
  sched2GrossCompensation: PesoSchema,
  sched2NonTaxableExclusions: PesoSchema,
  sched2TaxableCompensation: PesoSchema,
  // Schedule 3A: Graduated rates
  sched3aGrossReceipts: PesoSchema,
  sched3aLessReturns: PesoSchema,
  sched3aNetReceipts: PesoSchema,
  sched3aLessCogs: PesoSchema,
  sched3aGrossIncomeFromOps: PesoSchema,
  sched3aNonOpIncome: PesoSchema,
  sched3aTotalGrossIncome: PesoSchema,
  sched3aDeductionMethod: z.string(),
  sched3aTotalDeductions: PesoSchema,
  sched3aCompNti: PesoSchema,
  sched3aBizNti: PesoSchema,
  sched3aTotalNti: PesoSchema,
  sched3aTaxTable1: PesoSchema,
  sched3aTaxTable2: PesoSchema,
  sched3aIncomeTaxDue: PesoSchema,
  // Schedule 3B: 8% rate
  sched3bGrossReceipts: PesoSchema,
  sched3bLessReturns: PesoSchema,
  sched3bNetReceipts: PesoSchema,
  sched3bNonOpIncome: PesoSchema,
  sched3bTotalGross: PesoSchema,
  sched3bLess250k: PesoSchema,
  sched3bTaxableIncome: PesoSchema,
  sched3bIncomeTaxDue: PesoSchema,
  // Schedule 4: Itemized Deductions
  sched4CompensationDeductions: PesoSchema,
  sched4SssGsisPhilhealth: PesoSchema,
  sched4Rent: PesoSchema,
  sched4Interest: PesoSchema,
  sched4Utilities: PesoSchema,
  sched4Ear: PesoSchema,
  sched4Communication: PesoSchema,
  sched4Depreciation: PesoSchema,
  sched4TaxesLicenses: PesoSchema,
  sched4Insurance: PesoSchema,
  sched4ProfessionalFees: PesoSchema,
  sched4Travel: PesoSchema,
  sched4Supplies: PesoSchema,
  sched4Charitable: PesoSchema,
  sched4BadDebts: PesoSchema,
  sched4ResearchDevelopment: PesoSchema,
  sched4Others: PesoSchema,
  sched4TotalOrdinaryDeductions: PesoSchema,
  // Schedule 5: Special Deductions
  sched5PensionTrust: PesoSchema,
  sched5PremiumHealthHospitalization: PesoSchema,
  sched5Nolco: PesoSchema,
  sched5FringeBenefits: PesoSchema,
  sched5Total: PesoSchema,
  // Schedule 6: NOLCO
  sched6Entries: z.array(NolcoScheduleRowSchema),
  // Part V: Tax Due
  v1TaxOnComp: PesoSchema,
  v2TaxFromSched3aOr3b: PesoSchema,
  v3LessSpecialDeductions: PesoSchema,
  v4TotalTax: PesoSchema,
  v5IncomeTaxDue: PesoSchema,
  // Part VI: Tax Credits
  vi1PriorYearExcess: PesoSchema,
  vi2Q1Payment: PesoSchema,
  vi3Q2Payment: PesoSchema,
  vi4Q3Payment: PesoSchema,
  vi5CwtQ1Q2Q3: PesoSchema,
  vi6CwtQ4: PesoSchema,
  vi7CompCwt: PesoSchema,
  vi8PriorAmendedPayment: PesoSchema,
  vi9ForeignTaxCredit: PesoSchema,
  vi10OtherCredits: PesoSchema,
  vi11TotalCredits: PesoSchema,
  vi12NetTaxPayable: PesoSchema,
});

// Form1701QOutput
export const Form1701QOutputSchema = z.object({
  // Header
  taxYear: TaxYearSchema,
  quarter: QuarterSchema,
  returnPeriodFrom: ISODateSchema,
  returnPeriodTo: ISODateSchema,
  amendedReturn: z.boolean(),
  // Part I
  tin: z.string(),
  rdoCode: z.string(),
  taxpayerName: z.string(),
  businessName: z.string(),
  // Schedule I: Graduated Method
  siGrossReceipts: PesoSchema,
  siLessReturns: PesoSchema,
  siNetReceipts: PesoSchema,
  siLessCogs: PesoSchema,
  siGrossIncome: PesoSchema,
  siNonOpIncome: PesoSchema,
  siTotalGrossIncome: PesoSchema,
  siDeductions: PesoSchema,
  siPriorQtrNti: PesoSchema,
  siTotalNti: PesoSchema,
  siIncomeTaxDueTable1: PesoSchema,
  siIncomeTaxDueTable2: PesoSchema,
  siIncomeTaxDue: PesoSchema,
  // Schedule II: 8% Method
  siiCurrentQtrGross: PesoSchema,
  siiReturnsAllowances: PesoSchema,
  siiNetCurrent: PesoSchema,
  siiPriorQtrCumulative8pct: PesoSchema,
  siiTotalCumulativeGross: PesoSchema,
  siiLess250k: PesoSchema,
  siiTaxableCumulative: PesoSchema,
  siiTaxDue8pct: PesoSchema,
  // Schedule III: Tax Credits
  siiiCwtCurrentQuarter: PesoSchema,
  siiiPriorQtrCwtAlreadyClaimed: PesoSchema,
  siiiNetCwtThisQtr: PesoSchema,
  siiiPriorQtr1701qPayments: PesoSchema,
  siiiPriorYearExcess: PesoSchema,
  siiiTotalCredits: PesoSchema,
  siiiNetPayable: PesoSchema,
  // Schedule IV: Penalties
  sivSurcharge: PesoSchema,
  sivInterest: PesoSchema,
  sivCompromise: PesoSchema,
  sivTotalPenalties: PesoSchema,
});

// PT2551QScheduleRow + Form2551QOutput
export const PT2551QScheduleRowSchema = z.object({
  atcCode: z.string(),
  taxBase: PesoSchema,
  rate: RateSchema,
  taxDue: PesoSchema,
  description: z.string(),
});

export const Form2551QOutputSchema = z.object({
  taxYear: TaxYearSchema,
  quarter: QuarterOrFourSchema,
  // IMPORTANT: Quarter | 4 — 2551Q is filed for all 4 quarters
  returnPeriodFrom: ISODateSchema,
  returnPeriodTo: ISODateSchema,
  amendedReturn: z.boolean(),
  nilReturn: z.boolean(),
  tin: z.string(),
  rdoCode: z.string(),
  taxpayerName: z.string(),
  businessName: z.string(),
  atcCode: z.string(),
  grossTaxableSalesReceipts: PesoSchema,
  percentageTaxRate: RateSchema,
  percentageTaxDue: PesoSchema,
  lessPtCwtCredits: PesoSchema,
  netPtPayable: PesoSchema,
  addSurcharge: PesoSchema,
  addInterest: PesoSchema,
  addCompromise: PesoSchema,
  totalAmountPayable: PesoSchema,
  schedule1Rows: z.array(PT2551QScheduleRowSchema),
});

// ============================================================================
// FormOutputUnion — discriminated union
// JSON shape: { "formVariant": "Form1701a", "fields": { ... } }
// ============================================================================

export const FormOutputUnionSchema = z.discriminatedUnion('formVariant', [
  z.object({
    formVariant: z.literal('Form1701'),
    fields: Form1701OutputSchema,
  }),
  z.object({
    formVariant: z.literal('Form1701a'),
    fields: Form1701AOutputSchema,
  }),
  z.object({
    formVariant: z.literal('Form1701q'),
    fields: Form1701QOutputSchema,
  }),
]);
// z.discriminatedUnion() for formVariant — matches serde adjacently tagged enum.
// Key: "formVariant" is PascalCase tag (NOT same as FormType SCREAMING_SNAKE_CASE).

// ============================================================================
// TaxComputationResult
// ============================================================================

export const TaxComputationResultSchema = z.object({
  // Input Echo
  inputSummary: InputSummarySchema,

  // Regime Comparison
  comparison: z.array(RegimeOptionSchema),
  recommendedRegime: RegimePathSchema,
  usingLockedRegime: z.boolean(),
  savingsVsWorst: PesoSchema,
  savingsVsNextBest: PesoSchema,

  // Selected Regime Details
  selectedPath: RegimePathSchema,
  selectedIncomeTaxDue: PesoSchema,
  selectedPercentageTaxDue: PesoSchema,
  selectedTotalTax: PesoSchema,

  // Path Details (null if ineligible)
  pathADetails: PathAResultSchema.nullable(),
  pathBDetails: PathBResultSchema.nullable(),
  pathCDetails: PathCResultSchema.nullable(),

  // Gross Aggregates
  grossAggregates: GrossAggregatesSchema,

  // Credits
  totalItCredits: PesoSchema,
  cwtCredits: PesoSchema,
  quarterlyPayments: PesoSchema,
  priorYearExcess: PesoSchema,
  compensationCwt: PesoSchema,

  // Balance
  balance: PesoSchema,
  disposition: BalanceDispositionSchema,
  overpayment: PesoSchema,
  overpaymentDisposition: OverpaymentDispositionSchema.nullable(),
  installmentEligible: z.boolean(),
  installmentFirstDue: PesoSchema,
  installmentSecondDue: PesoSchema,

  // Percentage Tax
  ptResult: PercentageTaxResultSchema,

  // Form Output
  formType: FormTypeSchema,
  formOutput: FormOutputUnionSchema,
  ptFormOutput: Form2551QOutputSchema.nullable(),
  requiredAttachments: z.array(z.string()),

  // Penalties
  penalties: PenaltyResultSchema.nullable(),

  // Flags & Warnings
  manualReviewFlags: z.array(ManualReviewFlagSchema),
  warnings: z.array(ValidationWarningSchema),

  // Metadata
  engineVersion: z.string(),
  computedAt: ISODateSchema,
});
// No .strict() — output type (forward compatible)
```

---

## 5. `src/schemas/bridge.ts`

```typescript
import { z } from 'zod';

// ============================================================================
// EngineError (from error-contract.md)
// ============================================================================

export const EngineErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  field: z.string().nullable(),
  severity: z.enum(['ERROR', 'WARNING', 'INFO']),
});

// ============================================================================
// WasmResult<T> — discriminated union wrapper
// ============================================================================

/**
 * Creates a WasmResult schema for a given data schema T.
 * Usage: WasmResultSchema(TaxComputationResultSchema)
 */
export function WasmResultSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.discriminatedUnion('status', [
    z.object({
      status: z.literal('ok'),
      data: dataSchema,
    }),
    z.object({
      status: z.literal('error'),
      errors: z.array(EngineErrorSchema),
    }),
  ]);
}

// Concrete schemas for the two WASM exports:

export const ValidationResultDataSchema = z.object({
  valid: z.boolean(),
  errors: z.array(EngineErrorSchema),
});

// Produced by compute_json():
import { TaxComputationResultSchema } from './output';
export const ComputeResultSchema = WasmResultSchema(TaxComputationResultSchema);

// Produced by validate_json():
export const ValidateResultSchema = WasmResultSchema(ValidationResultDataSchema);
```

---

## 6. `src/schemas/index.ts`

```typescript
export * from './primitives';
export * from './enums';
export * from './input';
export * from './output';
export * from './bridge';
```

---

## 7. Per-Step Form Schemas (Wizard Validation)

These are the schemas used by each wizard step for per-field validation. They are NOT engine input schemas — they may be partial, coercing, or form-specific. They derive from `TaxpayerInputSchema` but with wizard-specific rules.

### Step WS-01: Taxpayer Profile
```typescript
export const WS01Schema = z.object({
  taxpayerType: TaxpayerTypeSchema,
  // VERR-WS01-01: required, no null
}).strict();
```

### Step WS-03: Tax Year and Filing Period
```typescript
export const WS03Schema = z.object({
  taxYear: z
    .number()
    .int()
    .min(2018, { message: 'Please select a valid tax year between 2018 and 2030.' })
    .max(2030, { message: 'Please select a valid tax year between 2018 and 2030.' }),
  filingPeriod: FilingPeriodSchema,
}).strict();
// VERR-WS03-05: Q4 is not valid (rejected by FilingPeriodSchema — no 'Q4' variant)
// VERR-WS03-02: taxYear <= currentYear - 1 for ANNUAL is enforced in the form component,
//               not in Zod (requires runtime date context).
```

### Step WS-04: Gross Receipts
```typescript
export const WS04Schema = z.object({
  grossReceipts: PesoSchema,
  salesReturnsAllowances: PesoSchema,
  nonOperatingIncome: PesoSchema,
  fwtIncome: PesoSchema,
}).strict()
  .refine(
    (d) => parseFloat(d.salesReturnsAllowances) <= parseFloat(d.grossReceipts),
    {
      message: 'Sales returns and allowances cannot exceed gross receipts.',
      path: ['salesReturnsAllowances'],
    }
  );
// VERR-WS04-02: PesoSchema rejects negative (no minus sign in regex)
// VERR-WS04-03: refine checks salesReturnsAllowances <= grossReceipts
// VERR-WS04-04: max ₱9,999,999,999.99 checked in form component (string length / parse)
```

### Step WS-07C: Depreciation
```typescript
export const DepreciationEntryFormSchema = DepreciationEntrySchema
  .refine(
    (d) => parseFloat(d.salvageValue) <= parseFloat(d.assetCost),
    {
      message: 'Salvage value cannot exceed asset cost.',
      path: ['salvageValue'],
    }
  );
```

### Step WS-08: Form 2307 Entries
```typescript
export const Form2307EntryFormSchema = Form2307EntrySchema
  .refine(
    (d) => parseFloat(d.taxWithheld) <= parseFloat(d.incomePayment),
    {
      message: 'Tax withheld cannot exceed income payment.',
      path: ['taxWithheld'],
    }
  )
  .refine(
    (d) => d.periodTo >= d.periodFrom,
    {
      message: 'Period end must be on or after period start.',
      path: ['periodTo'],
    }
  );
```

---

## 8. Cross-Layer Consistency Verification

| Layer | Validation | Status |
|-------|-----------|--------|
| Rust `deny_unknown_fields` | `.strict()` on all input schemas | VERIFIED |
| Rust `Decimal` → JSON string | `PesoSchema = z.string().regex(PESO_RE)` | VERIFIED |
| Rust `Option<T>` → JSON null | `.nullable()` on all optional fields | VERIFIED |
| Rust `bool` → JSON bool | `z.boolean()` (no coerce) | VERIFIED |
| Rust `i32`/`TaxYear`/`Quarter` → JSON number | `z.number().int()` | VERIFIED |
| Rust `NaiveDate` → "YYYY-MM-DD" | `ISODateSchema = z.string().regex(ISO_DATE_RE)` | VERIFIED |
| Rust `Vec<T>` → JSON array | `z.array(...)` (empty = `[]`, never null) | VERIFIED |
| Enum variants SCREAMING_SNAKE_CASE | `z.enum(['PURELY_SE', ...])` | VERIFIED |
| FormOutputUnion adjacently tagged | `z.discriminatedUnion('formVariant', [...])` | VERIFIED |
| WasmResult `status: "ok"\|"error"` | `z.discriminatedUnion('status', [...])` | VERIFIED |
| Output types no `deny_unknown_fields` | No `.strict()` on output schemas | VERIFIED |
| `PENDING_ELECTION` forbidden in input | `OverpaymentPreferenceInputSchema` omits it | VERIFIED |
| `Form2551QOutput.quarter` is `1\|2\|3\|4` | `QuarterOrFourSchema` | VERIFIED |
| `quarterOfCredit` is `number \| null` | `QuarterSchema.nullable()` | VERIFIED |
| `formVariant` PascalCase (not SCREAMING) | `z.literal('Form1701a')` etc. | VERIFIED |

---

## 9. Critical Traps for Forward Loop

1. **Do NOT use `z.coerce.boolean()`** — serde strict parsing rejects "true"/"false" strings.

2. **Do NOT use `z.optional()` for `Option<T>` fields** — must be `.nullable()`. JSON `null` is not the same as a missing key.

3. **Do NOT omit `.strict()` on input schemas** — any typo in a field name will silently send the wrong value to the engine. `.strict()` catches it immediately.

4. **`quarterOfCredit` is `z.number()`, not `z.string()`** — Quarter serializes as JSON number. `.nullable()` because annual filers don't attribute CWT to a specific quarter.

5. **`PesoSchema` rejects negative values** — the regex `^\d+(\.\d+)?$` has no minus sign. The engine validates balance signs; the frontend should display credit/debit distinction in the UI, not via negative amounts in input.

6. **`Form2551QOutput.quarter`** uses `QuarterOrFourSchema` (`1|2|3|4`) — this is the ONLY place Q4 appears as a valid quarter number.

7. **`FormOutputUnion` uses `z.discriminatedUnion('formVariant', [...])`** — the tag key is `"formVariant"` (camelCase), not `"form_variant"` (snake_case) or `"formType"` (different field entirely).

8. **Output schemas must NOT be strict** — when engine adds a new field in a future version, the frontend must not crash. Only input schemas use `.strict()`.
