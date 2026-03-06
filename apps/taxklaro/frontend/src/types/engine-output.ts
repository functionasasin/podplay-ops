import type {
  Peso, Rate, TaxYear, ISODate, Quarter,
  TaxpayerType, TaxpayerTier, FilingPeriod, IncomeType, TaxpayerClass,
  RegimePath, DeductionMethod, BalanceDisposition, FormType,
  CwtClassification, OverpaymentDisposition,
  ValidationWarning, ManualReviewFlag, WasmResult,
} from './common';
import type { Form2307Entry, NolcoEntry } from './engine-input';

// Re-export CwtClassification so consumers don't need to import from common separately
export type { CwtClassification, DeductionMethod };

// ============================================================================
// Input Summary (echoed in result for display)
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
  interest: Peso;       // net of arbitrage reduction
  taxesLicenses: Peso;
  losses: Peso;
  badDebts: Peso;
  depreciation: Peso;
  charitable: Peso;     // after 10% cap
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
  deductionMethod: 'ITEMIZED';   // always ITEMIZED
  pathLabel: string;             // "Path A — Graduated + Itemized Deductions"
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
  deductionMethod: 'OSD';        // always OSD
  pathLabel: string;             // "Path B — Graduated + OSD (40%)"
  osdBase: Peso;
}

export interface PathCResult {
  eligible: boolean;
  ineligibleReasons: string[];   // [] if eligible; each is "IN-XX: reason"
  exemptAmount: Peso;            // "250000.00" for PURELY_SE, "0.00" for MIXED_INCOME
  taxableBase: Peso;
  incomeTaxDue: Peso;
  compensationIt: Peso;          // "0.00" for PURELY_SE
  totalIncomeTax: Peso;
  ptWaived: boolean;
  deductionMethod: 'NONE';       // always NONE
  pathLabel: string;             // "Path C — 8% Flat Rate"
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
// Percentage Tax Result
// ============================================================================

export interface PercentageTaxResult {
  ptApplies: boolean;
  ptRate: Rate;             // "0.03" or "0.01" for Jul 2020 – Jun 2023
  ptBase: Peso;             // "0.00" if ptApplies == false
  ptDue: Peso;              // "0.00" if ptApplies == false
  form2551qRequired: boolean;
  filingDeadline: ISODate | null;  // null if form not required
  reason: string;           // human-readable explanation
}

// ============================================================================
// Penalties
// ============================================================================

export interface PenaltyStack {
  surcharge: Peso;
  interest: Peso;
  compromise: Peso;
  total: Peso;  // tax_due + surcharge + interest + compromise (includes base)
}

export interface PenaltyResult {
  applies: boolean;
  daysLate: number;     // integer; 0 if applies == false
  monthsLate: number;   // integer = ceil(daysLate/30); 0 if applies == false
  itPenalties: PenaltyStack;
  ptPenalties: PenaltyStack;
  totalPenalties: Peso; // sum of surcharge+interest+compromise only (NOT base tax)
}

// ============================================================================
// FormOutputUnion — adjacently tagged discriminated union
//
// CRITICAL: formVariant tag uses PascalCase (Rust variant names with serde adjacently-tagged).
// This is DIFFERENT from FormType which uses SCREAMING_SNAKE_CASE.
//   formType: 'FORM_1701A'   (no underscore before A)
//   formVariant: 'Form1701a' (PascalCase, serde adjacently-tagged)
// Use formType for routing/display. Use formVariant only for TypeScript type narrowing.
// ============================================================================

export type FormOutputUnion =
  | { formVariant: 'Form1701'; fields: Form1701Output }
  | { formVariant: 'Form1701a'; fields: Form1701AOutput }
  | { formVariant: 'Form1701q'; fields: Form1701QOutput };

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
// TaxComputationResult — Final Output
// ============================================================================

export interface TaxComputationResult {
  // Input Echo
  inputSummary: InputSummary;

  // Regime Comparison
  comparison: RegimeOption[];         // always 3 entries
  recommendedRegime: RegimePath;      // NOT recommendedPath
  usingLockedRegime: boolean;
  savingsVsWorst: Peso;
  savingsVsNextBest: Peso;

  // Selected Regime Details
  selectedPath: RegimePath;
  selectedIncomeTaxDue: Peso;
  selectedPercentageTaxDue: Peso;
  selectedTotalTax: Peso;

  // Path Details (null if ineligible/not applicable)
  pathADetails: PathAResult | null;   // null if COMPENSATION_ONLY
  pathBDetails: PathBResult | null;   // null if COMPENSATION_ONLY
  pathCDetails: PathCResult | null;   // null if all 8 ineligibility conditions

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
  overpayment: Peso;                  // "0.00" if no overpayment
  overpaymentDisposition: OverpaymentDisposition | null;
  installmentEligible: boolean;       // NOT InstallmentEligibility enum
  installmentFirstDue: Peso;          // April 15 installment
  installmentSecondDue: Peso;         // July 15 installment

  // Percentage Tax
  ptResult: PercentageTaxResult;

  // Form Output
  formType: FormType;                 // SCREAMING_SNAKE_CASE ("FORM_1701A")
  formOutput: FormOutputUnion;        // PascalCase tag ("Form1701a")
  ptFormOutput: Form2551QOutput | null;
  requiredAttachments: string[];

  // Penalties
  penalties: PenaltyResult | null;    // null if on-time filing

  // Flags & Warnings
  manualReviewFlags: ManualReviewFlag[];
  warnings: ValidationWarning[];

  // Metadata
  engineVersion: string;              // e.g., "1.0.0"
  computedAt: ISODate;                // "YYYY-MM-DD"
}

// Convenience aliases
export type ComputeResult = WasmResult<TaxComputationResult>;

export interface ValidationResult {
  valid: boolean;
  errors: import('./common').EngineError[];
}
export type ValidateResult = WasmResult<ValidationResult>;

// ============================================================================
// BIR Form Output Types — full field specifications
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
