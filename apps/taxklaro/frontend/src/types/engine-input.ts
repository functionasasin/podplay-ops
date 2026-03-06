import type {
  TaxpayerType, FilingPeriod, RegimeElection, ReturnType,
  OverpaymentPreferenceInput, DepreciationMethod, ISODate, TaxYear, Quarter, Peso,
} from './common';

// ============================================================================
// DepreciationEntry
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
// NolcoEntry
// ============================================================================

export interface NolcoEntry {
  lossYear: TaxYear;        // year loss was incurred
  originalLoss: Peso;       // > "0.00"
  remainingBalance: Peso;   // >= "0.00", <= originalLoss
  expiryYear: TaxYear;      // = lossYear + 3
}

// ============================================================================
// ItemizedExpenseInput (Path A — 23 fields)
// ============================================================================

export interface ItemizedExpenseInput {
  // Sec. 34(A): Ordinary and necessary business expenses
  salariesAndWages: Peso;
  sssPhilhealthPagibigEmployerShare: Peso;  // Employer mandatory share ONLY
  rent: Peso;
  utilities: Peso;
  communication: Peso;
  officeSupplies: Peso;
  professionalFeesPaid: Peso;               // Fees paid to OTHER professionals
  travelTransportation: Peso;
  insurancePremiums: Peso;
  // Sec. 34(B): Interest
  interestExpense: Peso;
  finalTaxedInterestIncome: Peso;           // For 33% arbitrage reduction
  // Sec. 34(C): Taxes and licenses
  taxesAndLicenses: Peso;                   // Excludes income tax; excludes OPT (computed by engine)
  // Sec. 34(D): Losses
  casualtyTheftLosses: Peso;
  // Sec. 34(E): Bad debts
  badDebts: Peso;
  isAccrualBasis: boolean;
  // Sec. 34(F): Depreciation
  depreciationEntries: DepreciationEntry[];  // [] if none
  // Sec. 34(H): Charitable contributions
  charitableContributions: Peso;            // Cap: 10% of net taxable income
  charitableAccredited: boolean;            // true = accredited donee
  // Sec. 34(I): Research and development
  researchDevelopment: Peso;
  // Sec. 34(J): Entertainment, amusement, recreation (EAR)
  entertainmentRepresentation: Peso;        // Cap: 0.5% net sales or 1% net revenue
  // Home office deduction
  homeOfficeExpense: Peso;
  homeOfficeExclusiveUse: boolean;          // true = full deduction; false = proportionate
  // NOLCO
  nolcoEntries: NolcoEntry[];              // [] if none
}

// ============================================================================
// Form2307Entry (CWT Certificate)
// ============================================================================

export interface Form2307Entry {
  payorName: string;         // non-empty
  payorTin: string;          // "XXX-XXX-XXX" or "XXX-XXX-XXX-XXXX"
  atcCode: string;           // e.g., "WI010", "PT010" — used for classification
  incomePayment: Peso;       // >= "0.00"
  taxWithheld: Peso;         // >= "0.00", <= incomePayment
  periodFrom: ISODate;       // "YYYY-MM-DD"
  periodTo: ISODate;         // "YYYY-MM-DD", >= periodFrom
  quarterOfCredit: Quarter | null; // 1/2/3 for quarterly filing; null for annual
}

// ============================================================================
// QuarterlyPayment
// ============================================================================

export interface QuarterlyPayment {
  quarter: Quarter;           // 1, 2, or 3 (Q4 filed as annual ITR, not 1701Q)
  amountPaid: Peso;           // >= "0.00"
  datePaid: ISODate | null;   // "YYYY-MM-DD" or null if unknown
  form1701qPeriod: 'Q1' | 'Q2' | 'Q3'; // must match quarter
}

// ============================================================================
// TaxpayerInput — Top-Level Input (25 fields)
// ============================================================================

export interface TaxpayerInput {
  // --- Identity / Classification ---
  taxpayerType: TaxpayerType;
  taxYear: number;            // 2018–2030
  filingPeriod: FilingPeriod; // Q1 | Q2 | Q3 | ANNUAL (NOT Q4)
  isMixedIncome: boolean;     // true iff taxpayerType === 'MIXED_INCOME'

  // --- Registration Status ---
  isVatRegistered: boolean;        // true → Path C ineligible
  isBmbeRegistered: boolean;       // true → income tax exempt
  subjectToSec117128: boolean;     // true → Path C ineligible
  isGppPartner: boolean;           // true → Path C ineligible

  // --- Business Income ---
  grossReceipts: Peso;             // >= "0.00" — NEVER grossReceiptsAmount
  salesReturnsAllowances: Peso;    // >= "0.00", <= grossReceipts
  nonOperatingIncome: Peso;        // passive income NOT subjected to FWT
  fwtIncome: Peso;                 // income already subjected to final withholding tax
  costOfGoodsSold: Peso;           // traders only; "0.00" for service providers

  // --- Compensation Income ---
  taxableCompensation: Peso;       // "0.00" for PURELY_SE
  compensationCwt: Peso;           // CWT from Form 2316s; "0.00" for PURELY_SE

  // --- Itemized Expenses ---
  itemizedExpenses: ItemizedExpenseInput;  // always required; zero-fill if not applicable

  // --- Regime Election ---
  electedRegime: RegimeElection | null;  // null = optimizer mode
  osdElected: boolean | null;            // null = let engine decide

  // --- Prior Period Data ---
  priorQuarterlyPayments: QuarterlyPayment[];  // [] if none; max 3 for ANNUAL
  cwt2307Entries: Form2307Entry[];             // [] if none — NEVER form2307Entries
  priorYearExcessCwt: Peso;                    // >= "0.00" — NEVER priorYearExcessCredits

  // --- Penalty Inputs ---
  actualFilingDate: ISODate | null;  // null = assume on-time
  returnType: ReturnType;
  priorPaymentForReturn: Peso;       // "0.00" for ORIGINAL

  // --- Overpayment Preference ---
  overpaymentPreference: OverpaymentPreferenceInput | null;
  // null = engine auto-assigns (CARRY_OVER if <=₱50K, PENDING_ELECTION otherwise)
  // NEVER pass 'PENDING_ELECTION' — that is output only, rejected as input
}

// ============================================================================
// Default Factory — zero-filled TaxpayerInput for wizard initialization
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
