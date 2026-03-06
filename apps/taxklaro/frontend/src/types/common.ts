// ============================================================================
// Primitive Type Aliases
// ============================================================================

/** All monetary peso amounts. Serialized as decimal string: "1234.56". NEVER number. */
export type Peso = string;

/** Percentage as decimal string: "0.08" for 8%. Never bare integer "8". */
export type Rate = string;

/** Calendar year integer: 2018–2030 */
export type TaxYear = number;

/** ISO 8601 date string: "YYYY-MM-DD" */
export type ISODate = string;

/** Quarter number: 1, 2, or 3. NOT a string — matches Rust u8. */
export type Quarter = 1 | 2 | 3;

// ============================================================================
// Enumerations — all serialize as SCREAMING_SNAKE_CASE strings
// ============================================================================

export type TaxpayerType =
  | 'PURELY_SE'
  | 'MIXED_INCOME'
  | 'COMPENSATION_ONLY';

export const TAXPAYER_TYPES: readonly TaxpayerType[] = [
  'PURELY_SE', 'MIXED_INCOME', 'COMPENSATION_ONLY',
];

export type TaxpayerTier = 'MICRO' | 'SMALL' | 'MEDIUM' | 'LARGE';

export const TAXPAYER_TIERS: readonly TaxpayerTier[] = [
  'MICRO', 'SMALL', 'MEDIUM', 'LARGE',
];

/** Q4 is NOT a valid FilingPeriod for ITR. */
export type FilingPeriod = 'Q1' | 'Q2' | 'Q3' | 'ANNUAL';

export const FILING_PERIODS: readonly FilingPeriod[] = ['Q1', 'Q2', 'Q3', 'ANNUAL'];

export type RegimeElection =
  | 'ELECT_ITEMIZED'
  | 'ELECT_OSD'
  | 'ELECT_EIGHT_PERCENT';

export const REGIME_ELECTIONS: readonly RegimeElection[] = [
  'ELECT_ITEMIZED', 'ELECT_OSD', 'ELECT_EIGHT_PERCENT',
];

export type TaxPath = 'PATH_A' | 'PATH_B' | 'PATH_C';

export const TAX_PATHS: readonly TaxPath[] = ['PATH_A', 'PATH_B', 'PATH_C'];

export type FormType =
  | 'Form1701A'
  | 'Form1701'
  | 'Form1701Q'
  | 'Form2551Q';

export const FORM_TYPES: readonly FormType[] = [
  'Form1701A', 'Form1701', 'Form1701Q', 'Form2551Q',
];

export type ReturnType = 'ORIGINAL' | 'AMENDED';

export const RETURN_TYPES: readonly ReturnType[] = ['ORIGINAL', 'AMENDED'];

export type OverpaymentPreferenceInput = 'REFUND' | 'CARRY_OVER' | 'ISSUANCE_OF_TAX_CREDIT';

export const OVERPAYMENT_PREFERENCES: readonly OverpaymentPreferenceInput[] = [
  'REFUND', 'CARRY_OVER', 'ISSUANCE_OF_TAX_CREDIT',
];

export type IncomeType =
  | 'SELF_EMPLOYMENT'
  | 'PROFESSIONAL'
  | 'MIXED'
  | 'COMPENSATION';

export type BusinessType =
  | 'TRADE_OR_BUSINESS'
  | 'PRACTICE_OF_PROFESSION'
  | 'BOTH';

export const BUSINESS_TYPES: readonly BusinessType[] = [
  'TRADE_OR_BUSINESS', 'PRACTICE_OF_PROFESSION', 'BOTH',
];

export type ExpenseMethod = 'ITEMIZED' | 'OSD';

export const EXPENSE_METHODS: readonly ExpenseMethod[] = ['ITEMIZED', 'OSD'];

export type FilingStatus = 'DRAFT' | 'COMPUTED' | 'FINALIZED' | 'ARCHIVED';

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
  code: string;
  message: string;
  field: string | null;
  severity: 'ERROR' | 'WARNING';
}
