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
  | 'PURELY_SE'           // Rust: PurelySe
  | 'MIXED_INCOME'        // Rust: MixedIncome
  | 'COMPENSATION_ONLY';  // Rust: CompensationOnly

export const TAXPAYER_TYPES: readonly TaxpayerType[] = [
  'PURELY_SE', 'MIXED_INCOME', 'COMPENSATION_ONLY',
];

export type TaxpayerTier = 'MICRO' | 'SMALL' | 'MEDIUM' | 'LARGE';

export const TAXPAYER_TIERS: readonly TaxpayerTier[] = [
  'MICRO', 'SMALL', 'MEDIUM', 'LARGE',
];

/** Engine input: the period this computation covers. Q4 is NOT a valid FilingPeriod for ITR. */
export type FilingPeriod = 'Q1' | 'Q2' | 'Q3' | 'ANNUAL';

export const FILING_PERIODS: readonly FilingPeriod[] = ['Q1', 'Q2', 'Q3', 'ANNUAL'];

/** Derived output — more granular than TaxpayerType. */
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
 * null = optimizer mode — engine recommends best path.
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

/**
 * Which ITR form to file.
 * IMPORTANT: Uses SCREAMING_SNAKE_CASE WITHOUT underscore before A/Q.
 * "FORM_1701A" not "FORM_1701_A" — distinct from FormOutputUnion.formVariant tag.
 */
export type FormType = 'FORM_1701' | 'FORM_1701A' | 'FORM_1701Q';

export type CwtClassification =
  | 'INCOME_TAX_CWT'
  | 'PERCENTAGE_TAX_CWT'
  | 'UNKNOWN';

export type DepreciationMethod = 'STRAIGHT_LINE' | 'DECLINING_BALANCE';

/**
 * Overpayment handling.
 * PENDING_ELECTION is engine OUTPUT only — never valid as user input.
 * Input must be CARRY_OVER | REFUND | TCC | null.
 */
export type OverpaymentDisposition =
  | 'CARRY_OVER'
  | 'REFUND'
  | 'TCC'
  | 'PENDING_ELECTION';

/** Valid input values for overpayment_preference (excludes PENDING_ELECTION). */
export type OverpaymentPreferenceInput = 'CARRY_OVER' | 'REFUND' | 'TCC';

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
  code: string;          // "VAL-001", "ERR-001", "PARSE_ERROR", etc.
  message: string;       // user-facing message
  field: string | null;  // camelCase field name or null if not field-specific
  severity: 'ERROR' | 'WARNING' | 'INFO';
}
