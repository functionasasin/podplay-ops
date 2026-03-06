import type {
  TaxpayerType,
  TaxpayerTier,
  FilingPeriod,
  Quarter,
  RegimeElection,
  ReturnType,
  OverpaymentPreferenceInput,
  BusinessType,
  TaxYear,
  ISODate,
  Peso,
} from './common';

export interface Form2307Entry {
  payorTin: string;
  payorName: string;
  incomePayment: Peso;
  taxWithheld: Peso;
  quarter: Quarter | null;
}

export interface QuarterlyPayment {
  quarter: Quarter;
  taxPaid: Peso;
  penaltiesPaid: Peso;
}

export interface NolcoEntry {
  yearIncurred: TaxYear;
  originalAmount: Peso;
  appliedInPriorYears: Peso;
}

export interface ItemizedExpenseInput {
  costOfSales: Peso;
  salariesWages: Peso;
  rentals: Peso;
  repairs: Peso;
  depreciation: Peso;
  utilities: Peso;
  communications: Peso;
  supplies: Peso;
  insurance: Peso;
  professionalFees: Peso;
  advertising: Peso;
  interestExpense: Peso;
  taxes: Peso;
  otherExpenses: Peso;
  nolcoEntries: NolcoEntry[];
}

export interface TaxpayerInput {
  taxpayerType: TaxpayerType;
  taxpayerTier: TaxpayerTier;
  businessType: BusinessType;
  taxYear: TaxYear;
  filingPeriod: FilingPeriod;
  isMixedIncome: boolean;
  isVatRegistered: boolean;
  isBmbeRegistered: boolean;
  subjectToSec117128: boolean;
  isGppPartner: boolean;
  grossReceipts: Peso;
  salesReturnsAllowances: Peso;
  nonOperatingIncome: Peso;
  fwtIncome: Peso;
  costOfGoodsSold: Peso;
  taxableCompensation: Peso;
  compensationCwt: Peso;
  itemizedExpenses: ItemizedExpenseInput | null;
  electedRegime: RegimeElection | null;
  osdElected: boolean | null;
  priorQuarterlyPayments: QuarterlyPayment[];
  cwt2307Entries: Form2307Entry[];
  priorYearExcessCwt: Peso;
  actualFilingDate: ISODate | null;
  returnType: ReturnType;
  priorPaymentForReturn: Peso;
  overpaymentPreference: OverpaymentPreferenceInput | null;
}
