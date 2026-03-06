import type {
  TaxpayerType, TaxYear, FilingPeriod, RegimeElection,
  ReturnType, OverpaymentPreferenceInput,
} from './common';
import type { ItemizedExpenseInput, QuarterlyPayment, Form2307Entry } from './engine-input';

// ============================================================================
// Wizard Step IDs
// ============================================================================

export type WizardStepId =
  | 'WS00' | 'WS01' | 'WS02' | 'WS03' | 'WS04'
  | 'WS05' | 'WS06' | 'WS07A' | 'WS07B' | 'WS07C' | 'WS07D'
  | 'WS08' | 'WS09' | 'WS10' | 'WS11' | 'WS12' | 'WS13'
  | 'REVIEW';

// ============================================================================
// WizardFormData — maps to TaxpayerInput exactly, split across wizard steps
// Field names match TaxpayerInput for direct serialization
// ============================================================================

export interface WizardFormData {
  taxpayerType: TaxpayerType;
  taxYear: TaxYear;
  filingPeriod: FilingPeriod;           // NOT filingMode — 'Q1'|'Q2'|'Q3'|'ANNUAL'
  isMixedIncome: boolean;
  isVatRegistered: boolean;             // NOT vatStatus enum
  isBmbeRegistered: boolean;
  subjectToSec117128: boolean;
  isGppPartner: boolean;
  grossReceipts: string;                // String for PesoInput — NOT grossReceiptsAmount
  salesReturnsAllowances: string;
  nonOperatingIncome: string;
  fwtIncome: string;
  costOfGoodsSold: string;
  taxableCompensation: string;
  compensationCwt: string;
  itemizedExpenses: Partial<ItemizedExpenseInput>;
  electedRegime: RegimeElection | null;
  osdElected: boolean | null;
  priorQuarterlyPayments: QuarterlyPayment[];
  cwt2307Entries: Form2307Entry[];      // NOT form2307Entries
  priorYearExcessCwt: string;           // NOT priorYearExcessCredits
  actualFilingDate: string | null;
  returnType: ReturnType;
  priorPaymentForReturn: string;
  overpaymentPreference: OverpaymentPreferenceInput | null;
  // UI-only fields (not sent to engine)
  clientId: string | null;
  computationTitle: string;
}

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// ============================================================================
// Default WizardFormData
// ============================================================================

export const DEFAULT_WIZARD_DATA: WizardFormData = {
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
  clientId: null,
  computationTitle: '',
};
