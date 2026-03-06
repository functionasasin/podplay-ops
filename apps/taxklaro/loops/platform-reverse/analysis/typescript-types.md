# TypeScript Types — TaxKlaro Engine Interface

**Wave:** 3 (Frontend Data Model)
**Status:** COMPLETE
**Date:** 2026-03-06
**Depends on:** serde-wire-format, error-contract, wasm-export-signature

---

## Purpose

This document specifies the exact TypeScript interfaces for every Rust type in the TaxKlaro engine. Field names, types, nullability, and array conventions all match the serde wire format exactly (camelCase, Decimal→string, Option→null, Vec→array).

**Key rules from serde-wire-format:**
- All `Decimal`/`Peso`/`Rate` fields → `string` (not `number`)
- All `Option<T>` fields → `T | null` (not `T | undefined`)
- All enums → SCREAMING_SNAKE_CASE string literal unions
- All `bool` → `boolean`
- All `int`/`TaxYear`/`Quarter` → `number`
- All `Date` → `string` (ISO "YYYY-MM-DD")
- All `Vec<T>` → `T[]` (empty array `[]`, never `null`)

---

## File Organization

```
src/
  types/
    common.ts        — shared primitives, enums, small shared structs
    engine-input.ts  — TaxpayerInput and all sub-types
    engine-output.ts — TaxComputationResult and all output types
    index.ts         — re-exports all from the three files above
```

---

## 1. `src/types/common.ts`

```typescript
// ============================================================================
// Primitive Type Aliases
// ============================================================================

/** All monetary peso amounts. Serialized as decimal string: "1234.56" */
export type Peso = string;

/** Percentage as decimal: "0.08" for 8%. Never bare integer like "8". */
export type Rate = string;

/** Calendar year integer: 2018–2030 */
export type TaxYear = number;

/** ISO 8601 date string: "YYYY-MM-DD" */
export type ISODate = string;

/** Quarter number: 1, 2, or 3 */
export type Quarter = 1 | 2 | 3;

// ============================================================================
// Enumerations
// All enums serialize as SCREAMING_SNAKE_CASE strings.
// ============================================================================

export type TaxpayerType =
  | 'PURELY_SE'
  | 'MIXED_INCOME'
  | 'COMPENSATION_ONLY';

export const TAXPAYER_TYPES: readonly TaxpayerType[] = [
  'PURELY_SE',
  'MIXED_INCOME',
  'COMPENSATION_ONLY',
];

export type TaxpayerTier = 'MICRO' | 'SMALL' | 'MEDIUM' | 'LARGE';

export const TAXPAYER_TIERS: readonly TaxpayerTier[] = [
  'MICRO', 'SMALL', 'MEDIUM', 'LARGE',
];

export type FilingPeriod = 'Q1' | 'Q2' | 'Q3' | 'ANNUAL';

export const FILING_PERIODS: readonly FilingPeriod[] = [
  'Q1', 'Q2', 'Q3', 'ANNUAL',
];

export type IncomeType =
  | 'PURELY_SE'
  | 'MIXED_INCOME'
  | 'COMPENSATION_ONLY'
  | 'ZERO_INCOME';

export type TaxpayerClass = 'SERVICE_PROVIDER' | 'TRADER';

export type RegimePath = 'PATH_A' | 'PATH_B' | 'PATH_C';

export const REGIME_PATHS: readonly RegimePath[] = ['PATH_A', 'PATH_B', 'PATH_C'];

/**
 * User's explicit regime election (input only).
 * null = optimizer mode (engine recommends best path).
 */
export type RegimeElection =
  | 'ELECT_EIGHT_PCT'
  | 'ELECT_OSD'
  | 'ELECT_ITEMIZED';

export type DeductionMethod = 'ITEMIZED' | 'OSD' | 'NONE';

export type BalanceDisposition =
  | 'BALANCE_PAYABLE'
  | 'ZERO_BALANCE'
  | 'OVERPAYMENT';

export type ReturnType = 'ORIGINAL' | 'AMENDED';

export type FormType = 'FORM_1701' | 'FORM_1701A' | 'FORM_1701Q';

export type CwtClassification =
  | 'INCOME_TAX_CWT'
  | 'PERCENTAGE_TAX_CWT'
  | 'UNKNOWN';

export type DepreciationMethod = 'STRAIGHT_LINE' | 'DECLINING_BALANCE';

/**
 * How to handle an overpayment.
 * PENDING_ELECTION is engine output ONLY — never valid as user input.
 * Input only accepts: CARRY_OVER | REFUND | TCC | null.
 */
export type OverpaymentDisposition =
  | 'CARRY_OVER'
  | 'REFUND'
  | 'TCC'
  | 'PENDING_ELECTION';

/** Valid values for overpayment_preference in user input. */
export type OverpaymentPreferenceInput =
  | 'CARRY_OVER'
  | 'REFUND'
  | 'TCC';

// ============================================================================
// Shared Small Structs
// ============================================================================

/** Non-fatal issue from PL-01 input validation or PL-04 eligibility check. */
export interface ValidationWarning {
  code: string;       // e.g., "WARN-001"
  message: string;    // user-facing text
  severity: 'WARNING' | 'INFO';
}

/** Item requiring human judgment (engine cannot fully resolve). */
export interface ManualReviewFlag {
  code: string;         // e.g., "MRF-010"
  title: string;        // short title
  message: string;      // full user-facing description
  fieldAffected: string; // which input field triggered this
  engineAction: string;  // what the engine did in lieu of judgment
}

// ============================================================================
// WasmResult Envelope
// ============================================================================

/** Successful WASM response. */
export interface WasmOk<T> {
  status: 'ok';
  data: T;
}

/** Failed WASM response. */
export interface WasmError {
  status: 'error';
  errors: EngineError[];
}

export type WasmResult<T> = WasmOk<T> | WasmError;

/** Single error from the engine (validation or computation failure). */
export interface EngineError {
  code: string;     // "VAL-001", "ERR-001", "PARSE_ERROR", etc.
  message: string;  // user-facing message
  field: string | null;  // camelCase field name or null if not field-specific
  severity: 'ERROR' | 'WARNING' | 'INFO';
}
```

---

## 2. `src/types/engine-input.ts`

```typescript
import type {
  TaxpayerType, FilingPeriod, RegimeElection, ReturnType,
  OverpaymentPreferenceInput, DepreciationMethod, ISODate, TaxYear, Quarter, Peso,
} from './common';

// ============================================================================
// Depreciation Entry
// ============================================================================

export interface DepreciationEntry {
  assetName: string;          // Non-empty string
  assetCost: Peso;            // >= "0.00"
  salvageValue: Peso;         // >= "0.00", <= assetCost
  usefulLifeYears: number;    // integer 1–50
  acquisitionDate: ISODate;   // "YYYY-MM-DD"
  method: DepreciationMethod;
  priorAccumulatedDepreciation: Peso; // >= "0.00"
}

// ============================================================================
// NOLCO Entry
// ============================================================================

export interface NolcoEntry {
  lossYear: TaxYear;        // year loss was incurred
  originalLoss: Peso;       // > "0.00"
  remainingBalance: Peso;   // >= "0.00", <= originalLoss
  expiryYear: TaxYear;      // = lossYear + 3
}

// ============================================================================
// Itemized Expense Input (Path A)
// ============================================================================

export interface ItemizedExpenseInput {
  salariesAndWages: Peso;
  sssPhilhealthPagibigEmployerShare: Peso;
  rent: Peso;
  utilities: Peso;
  communication: Peso;
  officeSupplies: Peso;
  professionalFeesPaid: Peso;
  travelTransportation: Peso;
  insurancePremiums: Peso;
  interestExpense: Peso;
  finalTaxedInterestIncome: Peso;
  taxesAndLicenses: Peso;
  casualtyTheftLosses: Peso;
  badDebts: Peso;
  isAccrualBasis: boolean;
  depreciationEntries: DepreciationEntry[];  // [] if none
  charitableContributions: Peso;
  charitableAccredited: boolean;
  researchDevelopment: Peso;
  entertainmentRepresentation: Peso;
  homeOfficeExpense: Peso;
  homeOfficeExclusiveUse: boolean;
  nolcoEntries: NolcoEntry[];  // [] if none
}

// ============================================================================
// Form 2307 Entry (CWT Certificate)
// ============================================================================

export interface Form2307Entry {
  payorName: string;         // non-empty
  payorTin: string;          // "XXX-XXX-XXX" or "XXX-XXX-XXX-XXXX"
  atcCode: string;           // e.g., "WI010", "PT010"
  incomePayment: Peso;       // >= "0.00"
  taxWithheld: Peso;         // >= "0.00", <= incomePayment
  periodFrom: ISODate;       // "YYYY-MM-DD"
  periodTo: ISODate;         // "YYYY-MM-DD", >= periodFrom
  quarterOfCredit: Quarter | null; // 1/2/3 for quarterly filing; null for annual
}

// ============================================================================
// Quarterly Payment
// ============================================================================

export interface QuarterlyPayment {
  quarter: Quarter;           // 1, 2, or 3
  amountPaid: Peso;           // >= "0.00"
  datePaid: ISODate | null;   // "YYYY-MM-DD" or null if unknown
  form1701qPeriod: 'Q1' | 'Q2' | 'Q3'; // must match quarter
}

// ============================================================================
// Top-Level Input
// ============================================================================

export interface TaxpayerInput {
  // --- Identity / Classification ---
  taxpayerType: TaxpayerType;
  taxYear: number;            // 2018–2030
  filingPeriod: FilingPeriod;
  isMixedIncome: boolean;

  // --- Registration Status ---
  isVatRegistered: boolean;
  isBmbeRegistered: boolean;
  subjectToSec117128: boolean;
  isGppPartner: boolean;

  // --- Business Income ---
  grossReceipts: Peso;
  salesReturnsAllowances: Peso;
  nonOperatingIncome: Peso;
  fwtIncome: Peso;
  costOfGoodsSold: Peso;

  // --- Compensation Income ---
  taxableCompensation: Peso;
  compensationCwt: Peso;

  // --- Itemized Expenses ---
  itemizedExpenses: ItemizedExpenseInput;

  // --- Regime Election ---
  electedRegime: RegimeElection | null;  // null = optimizer mode
  osdElected: boolean | null;            // null = let engine decide

  // --- Prior Period Data ---
  priorQuarterlyPayments: QuarterlyPayment[];  // [] if none; max 3 for ANNUAL
  cwt2307Entries: Form2307Entry[];             // [] if none
  priorYearExcessCwt: Peso;

  // --- Penalty Inputs ---
  actualFilingDate: ISODate | null;  // null = assume on-time
  returnType: ReturnType;
  priorPaymentForReturn: Peso;       // "0.00" for ORIGINAL

  // --- Overpayment Preference ---
  overpaymentPreference: OverpaymentPreferenceInput | null;
  // null = engine auto-assigns (CARRY_OVER if <= 50000, else PENDING_ELECTION)
  // NOT "PENDING_ELECTION" — that is output only, rejected as input
}

// ============================================================================
// Default Factory
// Creates a zero-filled TaxpayerInput for wizard initialization.
// ============================================================================

export function createDefaultTaxpayerInput(): TaxpayerInput {
  return {
    taxpayerType: 'PURELY_SE',
    taxYear: new Date().getFullYear(),
    filingPeriod: 'ANNUAL',
    isMixedIncome: false,
    isVatRegistered: false,
    isBmbeRegistered: false,
    subjectToSec117128: false,
    isGppPartner: false,
    grossReceipts: '0.00',
    salesReturnsAllowances: '0.00',
    nonOperatingIncome: '0.00',
    fwtIncome: '0.00',
    costOfGoodsSold: '0.00',
    taxableCompensation: '0.00',
    compensationCwt: '0.00',
    itemizedExpenses: {
      salariesAndWages: '0.00',
      sssPhilhealthPagibigEmployerShare: '0.00',
      rent: '0.00',
      utilities: '0.00',
      communication: '0.00',
      officeSupplies: '0.00',
      professionalFeesPaid: '0.00',
      travelTransportation: '0.00',
      insurancePremiums: '0.00',
      interestExpense: '0.00',
      finalTaxedInterestIncome: '0.00',
      taxesAndLicenses: '0.00',
      casualtyTheftLosses: '0.00',
      badDebts: '0.00',
      isAccrualBasis: false,
      depreciationEntries: [],
      charitableContributions: '0.00',
      charitableAccredited: false,
      researchDevelopment: '0.00',
      entertainmentRepresentation: '0.00',
      homeOfficeExpense: '0.00',
      homeOfficeExclusiveUse: false,
      nolcoEntries: [],
    },
    electedRegime: null,
    osdElected: null,
    priorQuarterlyPayments: [],
    cwt2307Entries: [],
    priorYearExcessCwt: '0.00',
    actualFilingDate: null,
    returnType: 'ORIGINAL',
    priorPaymentForReturn: '0.00',
    overpaymentPreference: null,
  };
}
```

---

## 3. `src/types/engine-output.ts`

```typescript
import type {
  Peso, Rate, TaxYear, ISODate, Quarter,
  TaxpayerType, TaxpayerTier, FilingPeriod, IncomeType, TaxpayerClass,
  RegimePath, DeductionMethod, BalanceDisposition, FormType,
  CwtClassification, OverpaymentDisposition,
  ValidationWarning, ManualReviewFlag, WasmResult,
} from './common';
import type { Form2307Entry, NolcoEntry } from './engine-input';

// ============================================================================
// Input Summary (echoed in result)
// ============================================================================

export interface InputSummary {
  taxYear: TaxYear;
  filingPeriod: FilingPeriod;
  taxpayerType: TaxpayerType;
  taxpayerTier: TaxpayerTier;
  grossReceipts: Peso;    // net (after returns/allowances)
  isVatRegistered: boolean;
  incomeType: IncomeType;
}

// ============================================================================
// Gross Aggregates (PL-03 output)
// ============================================================================

export interface GrossAggregates {
  netGrossReceipts: Peso;
  grossIncome: Peso;
  thresholdBase: Peso;
  eightPctBase: Peso;
  graduatedIncomeBase: Peso;
  ptQuarterlyBase: Peso;
  taxpayerClass: TaxpayerClass;
}

// ============================================================================
// Deduction Breakdown (Path A itemized categories)
// ============================================================================

export interface DeductionBreakdown {
  salaries: Peso;
  employeeBenefits: Peso;
  rent: Peso;
  utilities: Peso;
  communication: Peso;
  officeSupplies: Peso;
  professionalFees: Peso;
  travelTransportation: Peso;
  insurance: Peso;
  interest: Peso;     // net of arbitrage reduction
  taxesLicenses: Peso;
  losses: Peso;
  badDebts: Peso;
  depreciation: Peso;
  charitable: Peso;   // after 10% cap
  researchDevelopment: Peso;
  entertainmentRepresentation: Peso; // after EAR cap
  homeOffice: Peso;
  nolco: Peso;
}

// ============================================================================
// Path Results
// ============================================================================

export interface PathAResult {
  eligible: boolean;
  ptDeductionApplied: Peso;
  bizNti: Peso;
  totalNti: Peso;
  incomeTaxDue: Peso;
  deductionMethod: 'ITEMIZED';  // always ITEMIZED
  pathLabel: string;  // "Path A — Graduated + Itemized Deductions"
  deductionBreakdown: DeductionBreakdown;
  totalDeductions: Peso;
  earCapApplied: Peso;
  interestArbitrageReduction: Peso;
  nolcoRemaining: NolcoEntry[];
}

export interface PathBResult {
  eligible: boolean;
  bizNti: Peso;
  totalNti: Peso;
  incomeTaxDue: Peso;
  osdAmount: Peso;
  deductionMethod: 'OSD';  // always OSD
  pathLabel: string;  // "Path B — Graduated + OSD (40%)"
  osdBase: Peso;
}

export interface PathCResult {
  eligible: boolean;
  ineligibleReasons: string[];  // [] if eligible; each is "IN-XX: reason"
  exemptAmount: Peso;    // "250000.00" for PURELY_SE, "0.00" for MIXED_INCOME
  taxableBase: Peso;
  incomeTaxDue: Peso;
  compensationIt: Peso;  // "0.00" for PURELY_SE
  totalIncomeTax: Peso;
  ptWaived: boolean;
  deductionMethod: 'NONE';  // always NONE
  pathLabel: string;  // "Path C — 8% Flat Rate"
}

// ============================================================================
// Regime Comparison
// ============================================================================

export interface RegimeOption {
  path: RegimePath;
  incomeTaxDue: Peso;
  percentageTaxDue: Peso;
  totalTaxBurden: Peso;
  label: string;
  requiresDocumentation: boolean;
  requiresOas: boolean;
  effectiveRate: Rate;
}

// ============================================================================
// CWT Credits
// ============================================================================

/** Form 2307 entry annotated with its classification. */
export interface ClassifiedForm2307Entry extends Form2307Entry {
  classification: CwtClassification;
  ewtRateImplied: Rate;
}

// ============================================================================
// Percentage Tax Result
// ============================================================================

export interface PercentageTaxResult {
  ptApplies: boolean;
  ptRate: Rate;           // "0.03" or "0.01" for Jul 2020 – Jun 2023
  ptBase: Peso;           // "0.00" if ptApplies == false
  ptDue: Peso;            // "0.00" if ptApplies == false
  form2551qRequired: boolean;
  filingDeadline: ISODate | null;  // null if form not required
  reason: string;         // human-readable explanation
}

// ============================================================================
// Penalty Types
// ============================================================================

export interface PenaltyStack {
  surcharge: Peso;
  interest: Peso;
  compromise: Peso;
  total: Peso;  // tax_due + surcharge + interest + compromise (includes base)
}

export interface PenaltyResult {
  applies: boolean;
  daysLate: number;    // integer; 0 if applies == false
  monthsLate: number;  // integer = ceil(daysLate/30); 0 if applies == false
  itPenalties: PenaltyStack;
  ptPenalties: PenaltyStack;
  totalPenalties: Peso;  // sum of surcharge+interest+compromise only (NOT base tax)
}

// ============================================================================
// Form Output Types
// ============================================================================

export interface Form1701AOutput {
  // Header
  taxYearCovered: TaxYear;
  amendedReturn: boolean;
  shortPeriodReturn: boolean;
  fiscalYearEnd: ISODate | null;

  // Part I
  tin: string;
  rdoCode: string;
  taxpayerNameLast: string;
  taxpayerNameFirst: string;
  taxpayerNameMiddle: string;
  citizenship: string;
  civilStatus: string;
  registeredAddress: string;
  zipCode: string;
  contactNumber: string;
  emailAddress: string;
  businessName: string;
  psicCode: string;
  methodOfDeduction: string;  // "OSD" | "8% FLAT RATE"
  typeOfTaxpayer: string;     // "Individual"
  birthday: ISODate;
  atcCode: string;
  isAvailingOsd: boolean;
  isAvailing8pct: boolean;

  // Part II: Tax Payable
  incomeTaxDue: Peso;
  lessTaxRelief: Peso;
  incomeTaxDueNetOfRelief: Peso;
  addPenaltiesSurcharge: Peso;
  addPenaltiesInterest: Peso;
  addPenaltiesCompromise: Peso;
  totalTaxPayable: Peso;
  lessTaxCredits: Peso;
  netTaxPayable: Peso;
  overpayment: Peso;
  overpaymentToBeRefunded: boolean;
  overpaymentToBeIssuedTcc: boolean;
  overpaymentToCarryOver: boolean;

  // Part III: CPA info
  cpaTin: string | null;
  cpaName: string | null;
  cpaAccreditationNumber: string | null;

  // Part IV-A: OSD path
  ivaGrossSalesServices: Peso;
  ivaSalesReturnsAllowances: Peso;
  ivaNetSales: Peso;
  ivaCostOfSales: Peso;
  ivaTotalGrossIncome: Peso;
  ivaNonOpIncomeInterest: Peso;
  ivaNonOpIncomeRental: Peso;
  ivaNonOpIncomeRoyalty: Peso;
  ivaNonOpIncomeDividend: Peso;
  ivaNonOpIncomeOthers: Peso;
  ivaOsdAmount: Peso;
  ivaNetTaxableIncome: Peso;
  ivaGraduatedTaxTable1: Peso;
  ivaGraduatedTaxTable2: Peso;
  ivaIncomeTaxDue: Peso;

  // Part IV-B: 8% path
  ivbGrossSalesServices: Peso;
  ivbSalesReturnsAllowances: Peso;
  ivbNetSales: Peso;
  ivbNonOpIncomeInterest: Peso;
  ivbNonOpIncomeRental: Peso;
  ivbNonOpIncomeRoyalty: Peso;
  ivbNonOpIncomeDividend: Peso;
  ivbNonOpIncomeOthers: Peso;
  ivbTotalGross: Peso;
  ivbLess250k: Peso;
  ivbTaxableIncome: Peso;
  ivbIncomeTaxDue: Peso;

  // Tax Credits
  tcPriorYearExcess: Peso;
  tcQuarterly1701qPayments: Peso;
  tcCwtQ1Q2Q3: Peso;
  tcCwtQ4: Peso;
  tcPriorFilingPayment: Peso;
  tcForeignTaxCredits: Peso;
  tcOtherCredits: Peso;
  tcTotalCredits: Peso;
}

export interface NolcoScheduleRow {
  colAYearIncurred: TaxYear;
  colBOriginalLoss: Peso;
  colCAppliedPriorYears: Peso;
  colDBalanceBeginning: Peso;
  colEAppliedCurrentYear: Peso;
  colFBalanceEnd: Peso;
  expiryYear: TaxYear;
  expired: boolean;
}

export interface Form1701Output {
  // Header
  taxYearCovered: TaxYear;
  amendedReturn: boolean;
  shortPeriodReturn: boolean;

  // Part I
  tin: string;
  rdoCode: string;
  taxpayerNameLast: string;
  taxpayerNameFirst: string;
  taxpayerNameMiddle: string;
  citizenship: string;
  civilStatus: string;
  registeredAddress: string;
  zipCode: string;
  contactNumber: string;
  emailAddress: string;
  businessName: string;
  psicCode: string;
  methodOfDeduction: string;  // "ITEMIZED" | "OSD"
  typeOfTaxpayer: string;     // "Individual"
  birthday: ISODate;
  atcCode: string;
  withBusinessIncome: boolean;
  withCompensationIncome: boolean;

  // Part II: Tax Payable
  incomeTaxDue: Peso;
  lessTaxRelief: Peso;
  netTaxDue: Peso;
  surcharge: Peso;
  interest: Peso;
  compromise: Peso;
  totalPayable: Peso;
  lessTaxCreditsTotal: Peso;
  netPayable: Peso;
  overpaymentAmount: Peso;
  overpaymentRefund: boolean;
  overpaymentTcc: boolean;
  overpaymentCarryOver: boolean;
  secondInstallmentAmount: Peso;

  // Schedule 2: Compensation
  sched2GrossCompensation: Peso;
  sched2NonTaxableExclusions: Peso;
  sched2TaxableCompensation: Peso;

  // Schedule 3A: Graduated rates
  sched3aGrossReceipts: Peso;
  sched3aLessReturns: Peso;
  sched3aNetReceipts: Peso;
  sched3aLessCogs: Peso;
  sched3aGrossIncomeFromOps: Peso;
  sched3aNonOpIncome: Peso;
  sched3aTotalGrossIncome: Peso;
  sched3aDeductionMethod: string;
  sched3aTotalDeductions: Peso;
  sched3aCompNti: Peso;
  sched3aBizNti: Peso;
  sched3aTotalNti: Peso;
  sched3aTaxTable1: Peso;
  sched3aTaxTable2: Peso;
  sched3aIncomeTaxDue: Peso;

  // Schedule 3B: 8% rate
  sched3bGrossReceipts: Peso;
  sched3bLessReturns: Peso;
  sched3bNetReceipts: Peso;
  sched3bNonOpIncome: Peso;
  sched3bTotalGross: Peso;
  sched3bLess250k: Peso;
  sched3bTaxableIncome: Peso;
  sched3bIncomeTaxDue: Peso;

  // Schedule 4: Itemized Deductions
  sched4CompensationDeductions: Peso;
  sched4SssGsisPhilhealth: Peso;
  sched4Rent: Peso;
  sched4Interest: Peso;
  sched4Utilities: Peso;
  sched4Ear: Peso;
  sched4Communication: Peso;
  sched4Depreciation: Peso;
  sched4TaxesLicenses: Peso;
  sched4Insurance: Peso;
  sched4ProfessionalFees: Peso;
  sched4Travel: Peso;
  sched4Supplies: Peso;
  sched4Charitable: Peso;
  sched4BadDebts: Peso;
  sched4ResearchDevelopment: Peso;
  sched4Others: Peso;
  sched4TotalOrdinaryDeductions: Peso;

  // Schedule 5: Special Deductions
  sched5PensionTrust: Peso;
  sched5PremiumHealthHospitalization: Peso;
  sched5Nolco: Peso;
  sched5FringeBenefits: Peso;
  sched5Total: Peso;

  // Schedule 6: NOLCO
  sched6Entries: NolcoScheduleRow[];

  // Part V: Tax Due
  v1TaxOnComp: Peso;
  v2TaxFromSched3aOr3b: Peso;
  v3LessSpecialDeductions: Peso;
  v4TotalTax: Peso;
  v5IncomeTaxDue: Peso;

  // Part VI: Tax Credits
  vi1PriorYearExcess: Peso;
  vi2Q1Payment: Peso;
  vi3Q2Payment: Peso;
  vi4Q3Payment: Peso;
  vi5CwtQ1Q2Q3: Peso;
  vi6CwtQ4: Peso;
  vi7CompCwt: Peso;
  vi8PriorAmendedPayment: Peso;
  vi9ForeignTaxCredit: Peso;
  vi10OtherCredits: Peso;
  vi11TotalCredits: Peso;
  vi12NetTaxPayable: Peso;
}

export interface Form1701QOutput {
  // Header
  taxYear: TaxYear;
  quarter: Quarter;
  returnPeriodFrom: ISODate;
  returnPeriodTo: ISODate;
  amendedReturn: boolean;

  // Part I
  tin: string;
  rdoCode: string;
  taxpayerName: string;
  businessName: string;

  // Schedule I: Graduated Method
  siGrossReceipts: Peso;
  siLessReturns: Peso;
  siNetReceipts: Peso;
  siLessCogs: Peso;
  siGrossIncome: Peso;
  siNonOpIncome: Peso;
  siTotalGrossIncome: Peso;
  siDeductions: Peso;
  siPriorQtrNti: Peso;
  siTotalNti: Peso;
  siIncomeTaxDueTable1: Peso;
  siIncomeTaxDueTable2: Peso;
  siIncomeTaxDue: Peso;

  // Schedule II: 8% Method
  siiCurrentQtrGross: Peso;
  siiReturnsAllowances: Peso;
  siiNetCurrent: Peso;
  siiPriorQtrCumulative8pct: Peso;
  siiTotalCumulativeGross: Peso;
  siiLess250k: Peso;
  siiTaxableCumulative: Peso;
  siiTaxDue8pct: Peso;

  // Schedule III: Tax Credits
  siiiCwtCurrentQuarter: Peso;
  siiiPriorQtrCwtAlreadyClaimed: Peso;
  siiiNetCwtThisQtr: Peso;
  siiiPriorQtr1701qPayments: Peso;
  siiiPriorYearExcess: Peso;
  siiiTotalCredits: Peso;
  siiiNetPayable: Peso;

  // Schedule IV: Penalties
  sivSurcharge: Peso;
  sivInterest: Peso;
  sivCompromise: Peso;
  sivTotalPenalties: Peso;
}

export interface PT2551QScheduleRow {
  atcCode: string;
  taxBase: Peso;
  rate: Rate;
  taxDue: Peso;
  description: string;
}

export interface Form2551QOutput {
  // Header
  taxYear: TaxYear;
  quarter: Quarter | 4;  // 2551Q IS filed for Q4 unlike 1701Q
  returnPeriodFrom: ISODate;
  returnPeriodTo: ISODate;
  amendedReturn: boolean;
  nilReturn: boolean;

  // Part I
  tin: string;
  rdoCode: string;
  taxpayerName: string;
  businessName: string;

  // Part II: Tax Payable
  atcCode: string;
  grossTaxableSalesReceipts: Peso;
  percentageTaxRate: Rate;
  percentageTaxDue: Peso;
  lessPtCwtCredits: Peso;
  netPtPayable: Peso;
  addSurcharge: Peso;
  addInterest: Peso;
  addCompromise: Peso;
  totalAmountPayable: Peso;

  // Schedule 1
  schedule1Rows: PT2551QScheduleRow[];
}

// ============================================================================
// FormOutputUnion — discriminated union matching Rust adjacently-tagged enum
// JSON shape: { "formVariant": "Form1701a", "fields": { ... } }
// ============================================================================

export type FormOutputUnion =
  | { formVariant: 'Form1701'; fields: Form1701Output }
  | { formVariant: 'Form1701a'; fields: Form1701AOutput }
  | { formVariant: 'Form1701q'; fields: Form1701QOutput };

// Type guard helpers for FormOutputUnion
export function isForm1701(u: FormOutputUnion): u is { formVariant: 'Form1701'; fields: Form1701Output } {
  return u.formVariant === 'Form1701';
}
export function isForm1701A(u: FormOutputUnion): u is { formVariant: 'Form1701a'; fields: Form1701AOutput } {
  return u.formVariant === 'Form1701a';
}
export function isForm1701Q(u: FormOutputUnion): u is { formVariant: 'Form1701q'; fields: Form1701QOutput } {
  return u.formVariant === 'Form1701q';
}

// ============================================================================
// Final Output — TaxComputationResult
// ============================================================================

export interface TaxComputationResult {
  // Input Echo
  inputSummary: InputSummary;

  // Regime Comparison
  comparison: RegimeOption[];
  recommendedRegime: RegimePath;
  usingLockedRegime: boolean;
  savingsVsWorst: Peso;
  savingsVsNextBest: Peso;

  // Selected Regime Details
  selectedPath: RegimePath;
  selectedIncomeTaxDue: Peso;
  selectedPercentageTaxDue: Peso;
  selectedTotalTax: Peso;

  // Path Details (null if ineligible)
  pathADetails: PathAResult | null;  // null if COMPENSATION_ONLY
  pathBDetails: PathBResult | null;  // null if COMPENSATION_ONLY
  pathCDetails: PathCResult | null;  // null if ineligible (all 8 conditions)

  // Gross Aggregates
  grossAggregates: GrossAggregates;

  // Credits
  totalItCredits: Peso;
  cwtCredits: Peso;
  quarterlyPayments: Peso;
  priorYearExcess: Peso;
  compensationCwt: Peso;

  // Balance
  balance: Peso;
  disposition: BalanceDisposition;
  overpayment: Peso;
  overpaymentDisposition: OverpaymentDisposition | null;
  installmentEligible: boolean;
  installmentFirstDue: Peso;   // April 15 due
  installmentSecondDue: Peso;  // July 15 due

  // Percentage Tax
  ptResult: PercentageTaxResult;

  // Form Output
  formType: FormType;
  formOutput: FormOutputUnion;
  ptFormOutput: Form2551QOutput | null;
  requiredAttachments: string[];

  // Penalties
  penalties: PenaltyResult | null;  // null if on-time

  // Flags & Warnings
  manualReviewFlags: ManualReviewFlag[];
  warnings: ValidationWarning[];

  // Metadata
  engineVersion: string;  // e.g., "1.0.0"
  computedAt: ISODate;    // "YYYY-MM-DD"
}

// ============================================================================
// Convenience type aliases
// ============================================================================

/** The full WASM result type for the compute_json() export. */
export type ComputeResult = WasmResult<TaxComputationResult>;

/** The full WASM result type for the validate_json() export. */
export interface ValidationResult {
  valid: boolean;
  errors: import('./common').EngineError[];
}
export type ValidateResult = WasmResult<ValidationResult>;
```

---

## 4. `src/types/index.ts`

```typescript
export * from './common';
export * from './engine-input';
export * from './engine-output';
```

---

## 5. Cross-Layer Consistency Verification

Every field in this document has been verified against serde-wire-format.md:

| Category | Rule | Status |
|----------|------|--------|
| Decimal fields | All typed as `string` (Peso/Rate) | VERIFIED |
| Option fields | All typed as `T \| null` | VERIFIED |
| Bool fields | All typed as `boolean` | VERIFIED |
| Int fields (taxYear, etc.) | All typed as `number` | VERIFIED |
| Date fields | All typed as `ISODate = string` | VERIFIED |
| Vec fields | All typed as `T[]` | VERIFIED |
| Enum variants | SCREAMING_SNAKE_CASE string literals | VERIFIED |
| camelCase keys | Match serde rename_all = "camelCase" | VERIFIED |
| FormOutputUnion | Adjacently tagged: `formVariant` + `fields` | VERIFIED |
| WasmResult | Discriminated union: `status: "ok" \| "error"` | VERIFIED |
| `quarter_of_credit` | `Quarter \| null` (number or null) | VERIFIED |
| `overpaymentPreference` input | No PENDING_ELECTION allowed | VERIFIED |
| `overpaymentDisposition` output | Includes PENDING_ELECTION | VERIFIED |
| `Form2551QOutput.quarter` | `Quarter \| 4` (Q4 is valid for 2551Q) | VERIFIED |
| `pathADetails` in PathAResult | Includes deductionBreakdown inline | VERIFIED |

### Field-Level Critical Traps (Cross-Reference)

| Rust field | JSON key | TS type | Trap |
|------------|---------|---------|------|
| `cwt_2307_entries` | `cwt2307Entries` | `Form2307Entry[]` | Digit in name: "2307" not "Two307" |
| `is_vat_registered` | `isVatRegistered` | `boolean` | "is" prefix stays in camelCase |
| `subject_to_sec_117_128` | `subjectToSec117128` | `boolean` | Numbers 117, 128 stay as digits |
| `pt_cwt_total` in CwtCreditResult | NOT in TaxComputationResult directly | — | Aggregated into `ptResult` |
| `form_output` | `formOutput` | `FormOutputUnion` | NOT the same as `formType` |
| `form_type` | `formType` | `FormType` | Separate from `formOutput.formVariant` |
| `formVariant` in FormOutputUnion | `formVariant` | `"Form1701" \| "Form1701a" \| "Form1701q"` | PascalCase tag, NOT same as FormType enum |
| `quarter_of_credit` | `quarterOfCredit` | `Quarter \| null` | `number \| null`, not `string \| null` |
| `gross_receipts` in InputSummary | `grossReceipts` | `Peso = string` | This is net_gross_receipts (after returns) |

---

## 6. Notable Design Decisions

### 6.1 PathAResult includes DeductionBreakdown inline

The Rust `PathAResult` struct references `ItemizedDeductionResult` from PL-05, which contains `DeductionBreakdown`. For the TypeScript output type, we flatten the relevant fields directly into `PathAResult` to keep the type self-contained. Specifically:
- `deductionBreakdown: DeductionBreakdown` — all 19 itemized categories
- `totalDeductions: Peso` — sum after caps
- `earCapApplied: Peso` — EAR cap used
- `interestArbitrageReduction: Peso` — 33% arbitrage reduction
- `nolcoRemaining: NolcoEntry[]` — updated NOLCO schedule

### 6.2 Quarter type for Form2551QOutput

`Form2551QOutput.quarter` is typed as `Quarter | 4` because 2551Q is filed for all four quarters (unlike 1701Q which only covers Q1/Q2/Q3). The `Quarter` type alias is `1 | 2 | 3`. Form2551QOutput uses `Quarter | 4` = `1 | 2 | 3 | 4`.

### 6.3 FormType vs FormOutputUnion.formVariant

These are two different things with different naming:
- `formType: FormType` — uses the enum values: `"FORM_1701"`, `"FORM_1701A"`, `"FORM_1701Q"` (SCREAMING_SNAKE_CASE)
- `FormOutputUnion.formVariant` — uses PascalCase Rust variant names: `"Form1701"`, `"Form1701a"`, `"Form1701q"`

The frontend should use `formType` for routing/display logic and `formVariant` only for TypeScript type narrowing via `isForm1701()`, `isForm1701A()`, `isForm1701Q()` helpers.

### 6.4 CwtCreditResult not in TaxComputationResult

The `CwtCreditResult` from PL-07 is an internal pipeline type. Its relevant fields are exposed in `TaxComputationResult` as flat fields (`cwtCredits`, `compensationCwt`, `priorYearExcess`) rather than as a nested struct. The `ClassifiedForm2307Entry[]` list is not exposed in the final result (it's internal to the engine). If detailed CWT attribution is needed for display, it must be derived from the input's `cwt2307Entries` array.
