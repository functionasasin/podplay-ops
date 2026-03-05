/**
 * Estate Tax Inputs Wizard types (§4.23)
 * Source: docs/plans/inheritance-premium-spec.md §4.23
 */

// ============================================================================
// Enums / Literal Unions
// ============================================================================

export type MaritalStatus = 'single' | 'married' | 'widowed' | 'legally_separated' | 'annulled';

export type PropertyRegime = 'ACP' | 'CPG' | 'CSP';

export type Citizenship = 'Filipino' | 'NRA';

export type PropertyClassification = 'residential' | 'commercial' | 'industrial' | 'agricultural';

export type PropertyOwnership = 'exclusive' | 'conjugal' | 'community';

export type PersonalPropertySubtype =
  | 'cash'
  | 'bank_deposit'
  | 'receivable'
  | 'shares'
  | 'bonds'
  | 'vehicle'
  | 'jewelry'
  | 'other';

export type TaxableTransferType =
  | 'CONTEMPLATION_OF_DEATH'
  | 'REVOCABLE'
  | 'POWER_OF_APPOINTMENT'
  | 'LIFE_INSURANCE'
  | 'INSUFFICIENT_CONSIDERATION';

export type DeductionRules = 'TRAIN' | 'PRE_TRAIN';

export type AmnestyDeductionMode = 'standard' | 'narrow';

export const MARITAL_STATUSES: readonly MaritalStatus[] = [
  'single', 'married', 'widowed', 'legally_separated', 'annulled',
];

export const PROPERTY_REGIMES: readonly PropertyRegime[] = ['ACP', 'CPG', 'CSP'];

export const PROPERTY_CLASSIFICATIONS: readonly PropertyClassification[] = [
  'residential', 'commercial', 'industrial', 'agricultural',
];

export const PROPERTY_OWNERSHIPS: readonly PropertyOwnership[] = [
  'exclusive', 'conjugal', 'community',
];

export const PERSONAL_PROPERTY_SUBTYPES: readonly PersonalPropertySubtype[] = [
  'cash', 'bank_deposit', 'receivable', 'shares', 'bonds', 'vehicle', 'jewelry', 'other',
];

export const TAXABLE_TRANSFER_TYPES: readonly TaxableTransferType[] = [
  'CONTEMPLATION_OF_DEATH',
  'REVOCABLE',
  'POWER_OF_APPOINTMENT',
  'LIFE_INSURANCE',
  'INSUFFICIENT_CONSIDERATION',
];

// ============================================================================
// Tab 1 — Decedent Details
// ============================================================================

export interface DecedentDetails {
  name: string;
  dateOfDeath: string;
  citizenship: Citizenship;
  isNonResidentAlien: boolean;
  address: string;
  maritalStatus: MaritalStatus;
  propertyRegime: PropertyRegime | null;
  worldwideGrossEstate: number | null;
}

// ============================================================================
// Tab 2 — Executor
// ============================================================================

export interface ExecutorDetails {
  name: string;
  tin: string;
  contact: string;
  email: string;
}

// ============================================================================
// Tab 3 — Real Properties
// ============================================================================

export interface RealPropertyItem {
  id: string;
  titleNumber: string;
  taxDecNumber: string;
  location: string;
  lotArea: number | null;
  improvementArea: number | null;
  classification: PropertyClassification;
  fmvTaxDec: number;
  fmvBirZonal: number;
  ownership: PropertyOwnership;
  isFamilyHome: boolean;
  hasBarangayCert: boolean;
}

// ============================================================================
// Tab 4 — Personal Properties
// ============================================================================

export interface PersonalPropertyItem {
  id: string;
  subtype: PersonalPropertySubtype;
  description: string;
  fmv: number;
  ownership: PropertyOwnership;
}

// ============================================================================
// Tab 5 — Other Assets
// ============================================================================

export interface TaxableTransfer {
  id: string;
  type: TaxableTransferType;
  description: string;
  fmv: number;
}

export interface BusinessInterest {
  id: string;
  businessName: string;
  description: string;
  fmv: number;
}

export interface ExemptAsset {
  id: string;
  description: string;
  fmv: number;
  legalBasis: string;
}

export interface OtherAssets {
  taxableTransfers: TaxableTransfer[];
  businessInterests: BusinessInterest[];
  exemptAssets: ExemptAsset[];
}

// ============================================================================
// Tab 6 — Ordinary Deductions
// ============================================================================

export interface DeductionItem {
  id: string;
  description: string;
  amount: number;
}

export interface OrdinaryDeductions {
  claimsAgainstEstate: DeductionItem[];
  claimsAgainstInsolvent: DeductionItem[];
  unpaidMortgages: DeductionItem[];
  unpaidTaxes: DeductionItem[];
  casualtyLosses: DeductionItem[];
  vanishingDeduction: number;
  publicUseTransfers: DeductionItem[];
  funeralExpenses: number | null;
  judicialAdminExpenses: number | null;
}

// ============================================================================
// Tab 7 — Special Deductions
// ============================================================================

export interface SpecialDeductions {
  medicalExpenses: number;
  ra4917Benefits: number;
  foreignTaxCredits: number;
  standardDeduction: number;
  familyHomeDeduction: number;
}

// ============================================================================
// Tab 8 — Filing & Amnesty
// ============================================================================

export interface FilingData {
  userElectsAmnesty: boolean;
  amnestyDeductionMode: AmnestyDeductionMode;
  isAmended: boolean;
  hasExtension: boolean;
  isInstallment: boolean;
  isJudicialSettlement: boolean;
  hasPcggViolation: boolean;
  hasRa3019Violation: boolean;
  hasRa9160Violation: boolean;
}

// ============================================================================
// Complete Wizard State
// ============================================================================

export interface EstateTaxWizardState {
  decedent: DecedentDetails;
  executor: ExecutorDetails;
  realProperties: RealPropertyItem[];
  personalProperties: PersonalPropertyItem[];
  otherAssets: OtherAssets;
  ordinaryDeductions: OrdinaryDeductions;
  specialDeductions: SpecialDeductions;
  filing: FilingData;
}

// ============================================================================
// Tab Validation
// ============================================================================

export type TabIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const TAB_NAMES: readonly string[] = [
  'Decedent',
  'Executor',
  'Real Props',
  'Personal',
  'Other',
  'Deductions',
  'Spec. Ded.',
  'Filing',
];

export const TAB_COUNT = 8;

// ============================================================================
// Defaults
// ============================================================================

export function createDefaultEstateTaxState(): EstateTaxWizardState {
  return {
    decedent: {
      name: '',
      dateOfDeath: '',
      citizenship: 'Filipino',
      isNonResidentAlien: false,
      address: '',
      maritalStatus: 'single',
      propertyRegime: null,
      worldwideGrossEstate: null,
    },
    executor: {
      name: '',
      tin: '',
      contact: '',
      email: '',
    },
    realProperties: [],
    personalProperties: [],
    otherAssets: {
      taxableTransfers: [],
      businessInterests: [],
      exemptAssets: [],
    },
    ordinaryDeductions: {
      claimsAgainstEstate: [],
      claimsAgainstInsolvent: [],
      unpaidMortgages: [],
      unpaidTaxes: [],
      casualtyLosses: [],
      vanishingDeduction: 0,
      publicUseTransfers: [],
      funeralExpenses: null,
      judicialAdminExpenses: null,
    },
    specialDeductions: {
      medicalExpenses: 0,
      ra4917Benefits: 0,
      foreignTaxCredits: 0,
      standardDeduction: 5_000_000,
      familyHomeDeduction: 0,
    },
    filing: {
      userElectsAmnesty: false,
      amnestyDeductionMode: 'standard',
      isAmended: false,
      hasExtension: false,
      isInstallment: false,
      isJudicialSettlement: false,
      hasPcggViolation: false,
      hasRa3019Violation: false,
      hasRa9160Violation: false,
    },
  };
}

/**
 * Determine deduction rules based on date of death.
 * DOD < 2018-01-01 → PRE_TRAIN (old rules with funeral expenses, judicial admin expenses)
 * DOD >= 2018-01-01 → TRAIN (new rules)
 */
export function getDeductionRules(dateOfDeath: string): DeductionRules {
  return dateOfDeath < '2018-01-01' ? 'PRE_TRAIN' : 'TRAIN';
}

/**
 * Pre-populate estate tax wizard state from inheritance EngineInput.
 */
export function prePopulateFromEngineInput(
  engineInput: { decedent: { name: string; date_of_death: string; is_married: boolean; date_of_marriage: string | null } },
): Partial<EstateTaxWizardState> {
  const { decedent } = engineInput;

  const maritalStatus: MaritalStatus = decedent.is_married ? 'married' : 'single';

  let propertyRegime: PropertyRegime | null = null;
  if (decedent.is_married && decedent.date_of_marriage) {
    propertyRegime = decedent.date_of_marriage >= '1988-08-03' ? 'ACP' : 'CPG';
  } else if (decedent.is_married) {
    propertyRegime = 'ACP';
  }

  return {
    decedent: {
      name: decedent.name,
      dateOfDeath: decedent.date_of_death,
      citizenship: 'Filipino',
      isNonResidentAlien: false,
      address: '',
      maritalStatus,
      propertyRegime,
      worldwideGrossEstate: null,
    },
  };
}

/**
 * Check if a tab is valid (has all required fields).
 * Tabs 1-2 have required fields, tabs 3-8 are always valid when empty.
 */
export function isTabValid(tabIndex: TabIndex, state: EstateTaxWizardState): boolean {
  switch (tabIndex) {
    case 0: // Decedent
      return (
        state.decedent.name.trim().length > 0 &&
        state.decedent.dateOfDeath.trim().length > 0 &&
        state.decedent.address.trim().length > 0 &&
        state.decedent.citizenship.length > 0 &&
        state.decedent.maritalStatus.length > 0
      );
    case 1: // Executor
      return state.executor.name.trim().length > 0;
    case 2: // Real Properties
    case 3: // Personal Properties
    case 4: // Other Assets
    case 5: // Ordinary Deductions
    case 6: // Special Deductions
    case 7: // Filing
      return true;
    default:
      return false;
  }
}
