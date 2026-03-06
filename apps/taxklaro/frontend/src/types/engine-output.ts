import type { TaxPath, FormType, Peso, Rate, TaxYear } from './common';

export interface PathResult {
  path: TaxPath;
  isEligible: boolean;
  ineligibilityReasons: string[];
  grossIncome: Peso;
  allowableDeductions: Peso;
  taxableIncome: Peso;
  incomeTax: Peso;
  taxDue: Peso;
  taxPayable: Peso;
  effectiveRate: Rate;
}

export interface GraduatedTaxLine {
  bracketMin: Peso;
  bracketMax: Peso | null;
  baseAmount: Peso;
  rate: Rate;
  taxOnExcess: Peso;
  totalTax: Peso;
}

export interface Form1701AOutput {
  formType: 'Form1701A';
  taxYear: TaxYear;
  grossSales: Peso;
  lessReturnsAllowances: Peso;
  netSales: Peso;
  optionalStandardDeduction: Peso;
  taxableIncome: Peso;
  incomeTax: Peso;
  lessCwtCredits: Peso;
  lessPriorQuarterly: Peso;
  taxPayable: Peso;
}

export interface Form1701Output {
  formType: 'Form1701';
  taxYear: TaxYear;
  grossReceipts: Peso;
  allowableDeductions: Peso;
  taxableIncome: Peso;
  incomeTax: Peso;
  lessCwtCredits: Peso;
  lessPriorQuarterly: Peso;
  taxPayable: Peso;
}

export interface Form1701QOutput {
  formType: 'Form1701Q';
  taxYear: TaxYear;
  quarter: number;
  grossReceiptsToDate: Peso;
  allowableDeductionsToDate: Peso;
  taxableIncomeToDate: Peso;
  incomeTaxToDate: Peso;
  lessCwtCreditsToDate: Peso;
  lessPriorQuarterlyPayments: Peso;
  taxPayable: Peso;
}

export interface Form2551QOutput {
  formType: 'Form2551Q';
  taxYear: TaxYear;
  quarter: number;
  grossReceipts: Peso;
  percentageTax: Peso;
  taxPayable: Peso;
}

export type FormOutputUnion =
  | Form1701AOutput
  | Form1701Output
  | Form1701QOutput
  | Form2551QOutput;

export interface ValidationResult {
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  field: string | null;
  severity: 'ERROR';
}

export interface ValidationWarning {
  code: string;
  message: string;
  field: string | null;
  severity: 'WARNING';
}

export interface TaxComputationResult {
  taxYear: TaxYear;
  recommendedPath: TaxPath;
  paths: PathResult[];
  selectedForm: FormType;
  formOutput: FormOutputUnion;
  warnings: ValidationWarning[];
  narrative: string;
}
