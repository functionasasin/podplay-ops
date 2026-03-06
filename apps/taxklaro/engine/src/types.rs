use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use serde_with::{serde_as, DisplayFromStr};

use crate::errors::{EngineError, ManualReviewFlag, ValidationWarning};

// ============================================================================
// Type Aliases
// ============================================================================

/// Quarter number for 1701Q: 1, 2, or 3. (2551Q can use 4 as well.)
pub type Quarter = u8;

// ============================================================================
// Enumerations (14 total — all SCREAMING_SNAKE_CASE in JSON)
// ============================================================================

// ─── Input Classification ────────────────────────────────────────────────────

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TaxpayerType {
    PurelySe,         // → "PURELY_SE"
    MixedIncome,      // → "MIXED_INCOME"
    CompensationOnly, // → "COMPENSATION_ONLY"
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TaxpayerTier {
    Micro,  // < ₱3M → "MICRO"
    Small,  // ₱3M–₱20M → "SMALL"
    Medium, // ₱20M–₱1B → "MEDIUM"
    Large,  // ≥ ₱1B → "LARGE"
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum FilingPeriod {
    Q1,     // → "Q1"
    Q2,     // → "Q2"
    Q3,     // → "Q3"
    Annual, // → "ANNUAL"
    // NOTE: Q4 is NOT a valid FilingPeriod for income tax (no 1701Q for Q4).
}

/// Derived output — more granular than TaxpayerType.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum IncomeType {
    PurelySe,         // → "PURELY_SE"
    MixedIncome,      // → "MIXED_INCOME"
    CompensationOnly, // → "COMPENSATION_ONLY"
    ZeroIncome,       // → "ZERO_INCOME"
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TaxpayerClass {
    ServiceProvider, // → "SERVICE_PROVIDER"
    Trader,          // → "TRADER"
}

// ─── Regime ──────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum RegimePath {
    PathA, // → "PATH_A"  (graduated + itemized deductions)
    PathB, // → "PATH_B"  (graduated + OSD 40%)
    PathC, // → "PATH_C"  (8% flat rate, PURELY_SE only)
}

/// User's explicit election. None = optimizer mode.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum RegimeElection {
    ElectEightPct, // → "ELECT_EIGHT_PCT"
    ElectOsd,      // → "ELECT_OSD"
    ElectItemized, // → "ELECT_ITEMIZED"
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum DeductionMethod {
    Itemized, // → "ITEMIZED"  (Path A)
    Osd,      // → "OSD"       (Path B, 40%)
    None,     // → "NONE"      (Path C, no deduction)
}

// ─── Balance / Forms ─────────────────────────────────────────────────────────

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum BalanceDisposition {
    BalancePayable, // → "BALANCE_PAYABLE"
    ZeroBalance,    // → "ZERO_BALANCE"
    Overpayment,    // → "OVERPAYMENT"
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ReturnType {
    Original, // → "ORIGINAL"
    Amended,  // → "AMENDED"
}

/// Which ITR form to file.
///
/// CRITICAL: serde SCREAMING_SNAKE_CASE would produce FORM_1701_A (wrong).
/// Use explicit renames to get FORM_1701A / FORM_1701Q without the extra underscore.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum FormType {
    Form1701,                          // → "FORM_1701"
    #[serde(rename = "FORM_1701A")]
    Form1701a,                         // → "FORM_1701A"
    #[serde(rename = "FORM_1701Q")]
    Form1701q,                         // → "FORM_1701Q"
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum CwtClassification {
    IncomeTaxCwt,     // → "INCOME_TAX_CWT"
    PercentageTaxCwt, // → "PERCENTAGE_TAX_CWT"
    Unknown,          // → "UNKNOWN" — triggers MRF-021
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum DepreciationMethod {
    StraightLine,     // → "STRAIGHT_LINE"
    DecliningBalance, // → "DECLINING_BALANCE"
}

/// Engine output only. Input accepts only CARRY_OVER | REFUND | TCC.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum OverpaymentDisposition {
    CarryOver,       // → "CARRY_OVER"
    Refund,          // → "REFUND"
    Tcc,             // → "TCC"
    PendingElection, // → "PENDING_ELECTION" (output only)
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ErrorSeverity {
    Error,   // → "ERROR"
    Warning, // → "WARNING"
    Info,    // → "INFO"
}

// ============================================================================
// Primary Input — TaxpayerInput
// ============================================================================

#[serde_as]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct TaxpayerInput {
    // --- Identity / Classification ---
    pub taxpayer_type: TaxpayerType,
    pub tax_year: u16,         // 2018–2030
    pub filing_period: FilingPeriod,
    pub is_mixed_income: bool, // true iff taxpayer_type == MIXED_INCOME

    // --- Registration Status ---
    pub is_vat_registered: bool,       // true → Path C ineligible
    pub is_bmbe_registered: bool,      // true → income tax exempt
    pub subject_to_sec_117_128: bool,  // true → Path C ineligible
    pub is_gpp_partner: bool,          // true → Path C ineligible

    // --- Business Income ---
    #[serde_as(as = "DisplayFromStr")]
    pub gross_receipts: Decimal,              // String in JSON: "1234.56"
    #[serde_as(as = "DisplayFromStr")]
    pub sales_returns_allowances: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub non_operating_income: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub fwt_income: Decimal,                  // Income with final withholding tax
    #[serde_as(as = "DisplayFromStr")]
    pub cost_of_goods_sold: Decimal,          // Traders only; zero for service providers

    // --- Compensation Income ---
    #[serde_as(as = "DisplayFromStr")]
    pub taxable_compensation: Decimal,        // Zero for PURELY_SE
    #[serde_as(as = "DisplayFromStr")]
    pub compensation_cwt: Decimal,            // CWT from Form 2316; zero for PURELY_SE

    // --- Itemized Expenses (Path A only) ---
    pub itemized_expenses: ItemizedExpenseInput, // Zero-filled if not applicable

    // --- Regime Election ---
    pub elected_regime: Option<RegimeElection>, // None = optimizer mode
    pub osd_elected: Option<bool>,              // Overridden by elected_regime

    // --- Prior Period Data ---
    pub prior_quarterly_payments: Vec<QuarterlyPayment>, // [] if none; max 3 for ANNUAL
    pub cwt_2307_entries: Vec<Form2307Entry>,             // [] if none
    #[serde_as(as = "DisplayFromStr")]
    pub prior_year_excess_cwt: Decimal,

    // --- Penalty Inputs ---
    pub actual_filing_date: Option<String>, // "YYYY-MM-DD"; null = assume on-time
    pub return_type: ReturnType,
    #[serde_as(as = "DisplayFromStr")]
    pub prior_payment_for_return: Decimal,  // "0.00" for ORIGINAL

    // --- Overpayment Preference ---
    pub overpayment_preference: Option<OverpaymentDisposition>,
    // Allowed non-null: CARRY_OVER | REFUND | TCC (NOT PENDING_ELECTION)
    // null = engine auto-assigns: CARRY_OVER if ≤₱50K, PENDING_ELECTION if >₱50K
}

// ============================================================================
// Sub-input Types
// ============================================================================

/// Itemized Expense Input — 23 fields covering all Sec. 34 deductions (Path A only).
#[serde_as]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ItemizedExpenseInput {
    // Sec. 34(A): Ordinary and necessary business expenses
    #[serde_as(as = "DisplayFromStr")]
    pub salaries_and_wages: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sss_philhealth_pagibig_employer_share: Decimal, // Employer's mandatory share only
    #[serde_as(as = "DisplayFromStr")]
    pub rent: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub utilities: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub communication: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub office_supplies: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub professional_fees_paid: Decimal, // Fees paid to OTHER professionals
    #[serde_as(as = "DisplayFromStr")]
    pub travel_transportation: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub insurance_premiums: Decimal,
    // Sec. 34(B): Interest expense
    #[serde_as(as = "DisplayFromStr")]
    pub interest_expense: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub final_taxed_interest_income: Decimal, // For 33% arbitrage reduction
    // Sec. 34(C): Taxes and licenses
    #[serde_as(as = "DisplayFromStr")]
    pub taxes_and_licenses: Decimal, // Business taxes (excl. income tax)
    // Sec. 34(D): Losses
    #[serde_as(as = "DisplayFromStr")]
    pub casualty_theft_losses: Decimal,
    // Sec. 34(E): Bad debts
    #[serde_as(as = "DisplayFromStr")]
    pub bad_debts: Decimal,
    pub is_accrual_basis: bool,
    // Sec. 34(F): Depreciation
    pub depreciation_entries: Vec<DepreciationEntry>, // [] if none
    // Sec. 34(H): Charitable contributions
    #[serde_as(as = "DisplayFromStr")]
    pub charitable_contributions: Decimal, // Capped at 10% of net taxable income
    pub charitable_accredited: bool,       // True = accredited donee, full deduction
    // Sec. 34(I): Research and development
    #[serde_as(as = "DisplayFromStr")]
    pub research_development: Decimal,
    // Sec. 34(J): Entertainment, amusement, recreation (EAR)
    #[serde_as(as = "DisplayFromStr")]
    pub entertainment_representation: Decimal, // Capped at 0.5% net sales or 1% net revenue
    // Home office (Rev. Regs. 12-2003 interpretation)
    #[serde_as(as = "DisplayFromStr")]
    pub home_office_expense: Decimal,
    pub home_office_exclusive_use: bool, // True = full deduction; false = proportionate
    // NOLCO (Net Operating Loss Carry-Over)
    pub nolco_entries: Vec<NolcoEntry>, // [] if none; losses from prior 3 years
}

/// CWT Certificate entry (BIR Form 2307).
#[serde_as]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Form2307Entry {
    pub payor_name: String,            // Non-empty
    pub payor_tin: String,             // "XXX-XXX-XXX" or "XXX-XXX-XXX-XXXX"
    pub atc_code: String,              // e.g., "WI010", "PT010"
    #[serde_as(as = "DisplayFromStr")]
    pub income_payment: Decimal,       // ≥ 0
    #[serde_as(as = "DisplayFromStr")]
    pub tax_withheld: Decimal,         // ≥ 0, ≤ income_payment
    pub period_from: String,           // "YYYY-MM-DD"
    pub period_to: String,             // "YYYY-MM-DD", ≥ period_from
    pub quarter_of_credit: Option<u8>, // 1/2/3 for quarterly filing; null for annual
}

/// Prior quarterly income tax payment record.
#[serde_as]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct QuarterlyPayment {
    pub quarter: u8, // 1, 2, or 3
    #[serde_as(as = "DisplayFromStr")]
    pub amount_paid: Decimal,
    pub date_paid: Option<String>,  // "YYYY-MM-DD" or null if unknown
    pub form1701q_period: String,   // "Q1" | "Q2" | "Q3"
}

/// Asset depreciation entry for Schedule 34(F).
#[serde_as]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct DepreciationEntry {
    pub asset_name: String,        // Non-empty
    #[serde_as(as = "DisplayFromStr")]
    pub asset_cost: Decimal,       // ≥ 0
    #[serde_as(as = "DisplayFromStr")]
    pub salvage_value: Decimal,    // ≥ 0, ≤ asset_cost
    pub useful_life_years: u16,    // 1–50
    pub acquisition_date: String,  // "YYYY-MM-DD"
    pub method: DepreciationMethod,
    #[serde_as(as = "DisplayFromStr")]
    pub prior_accumulated_depreciation: Decimal, // ≥ 0
}

/// Net Operating Loss Carry-Over entry.
#[serde_as]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct NolcoEntry {
    pub loss_year: u16,             // Year loss was incurred
    #[serde_as(as = "DisplayFromStr")]
    pub original_loss: Decimal,     // > 0
    #[serde_as(as = "DisplayFromStr")]
    pub remaining_balance: Decimal, // ≥ 0, ≤ original_loss
    pub expiry_year: u16,           // = loss_year + 3
}

// ============================================================================
// WASM Result Envelope
// ============================================================================

/// Discriminated union used as the WASM function return type.
///
/// Serializes as:
///   `{"status":"ok","data":{...}}`       on success
///   `{"status":"error","errors":[...]}` on failure
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "status", rename_all = "lowercase")]
pub enum WasmResult<T> {
    Ok { data: T },
    Error { errors: Vec<EngineError> },
}

// ============================================================================
// Primary Output — TaxComputationResult
// ============================================================================

#[serde_as]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaxComputationResult {
    // --- Input Echo ---
    pub input_summary: InputSummary,

    // --- Regime Comparison ---
    pub comparison: Vec<RegimeOption>, // Always 3 entries (PATH_A/B/C)
    pub recommended_regime: RegimePath,
    pub using_locked_regime: bool,
    #[serde_as(as = "DisplayFromStr")]
    pub savings_vs_worst: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub savings_vs_next_best: Decimal,

    // --- Selected Regime Details ---
    pub selected_path: RegimePath,
    #[serde_as(as = "DisplayFromStr")]
    pub selected_income_tax_due: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub selected_percentage_tax_due: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub selected_total_tax: Decimal,

    // --- Path Details (None if ineligible/not applicable) ---
    pub path_a_details: Option<PathAResult>, // None if COMPENSATION_ONLY
    pub path_b_details: Option<PathBResult>, // None if COMPENSATION_ONLY
    pub path_c_details: Option<PathCResult>, // None if ineligible (all 8 conditions)

    // --- Gross Aggregates ---
    pub gross_aggregates: GrossAggregates,

    // --- Credits ---
    #[serde_as(as = "DisplayFromStr")]
    pub total_it_credits: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub cwt_credits: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub quarterly_payments: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub prior_year_excess: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub compensation_cwt: Decimal,

    // --- Balance ---
    #[serde_as(as = "DisplayFromStr")]
    pub balance: Decimal,
    pub disposition: BalanceDisposition,
    #[serde_as(as = "DisplayFromStr")]
    pub overpayment: Decimal, // "0.00" if no overpayment
    pub overpayment_disposition: Option<OverpaymentDisposition>,
    pub installment_eligible: bool,
    #[serde_as(as = "DisplayFromStr")]
    pub installment_first_due: Decimal,  // April 15 installment
    #[serde_as(as = "DisplayFromStr")]
    pub installment_second_due: Decimal, // July 15 installment

    // --- Percentage Tax ---
    pub pt_result: PercentageTaxResult,

    // --- Form Output ---
    pub form_type: FormType,
    pub form_output: FormOutputUnion,
    pub pt_form_output: Option<Form2551QOutput>,
    pub required_attachments: Vec<String>,

    // --- Penalties ---
    pub penalties: Option<PenaltyResult>, // None if on-time filing

    // --- Flags & Warnings ---
    pub manual_review_flags: Vec<ManualReviewFlag>,
    pub warnings: Vec<ValidationWarning>,

    // --- Metadata ---
    pub engine_version: String, // e.g., "1.0.0"
    pub computed_at: String,    // "YYYY-MM-DD"
}

// ============================================================================
// Output Sub-types
// ============================================================================

#[serde_as]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InputSummary {
    pub tax_year: u16,
    pub filing_period: FilingPeriod,
    pub taxpayer_type: TaxpayerType,
    pub taxpayer_tier: TaxpayerTier,
    #[serde_as(as = "DisplayFromStr")]
    pub gross_receipts: Decimal, // Net (after returns/allowances)
    pub is_vat_registered: bool,
    pub income_type: IncomeType,
}

#[serde_as]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GrossAggregates {
    #[serde_as(as = "DisplayFromStr")]
    pub net_gross_receipts: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub gross_income: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub threshold_base: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub eight_pct_base: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub graduated_income_base: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub pt_quarterly_base: Decimal,
    pub taxpayer_class: TaxpayerClass,
}

/// Path A (Graduated + Itemized) computation result.
#[serde_as]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PathAResult {
    pub eligible: bool,
    #[serde_as(as = "DisplayFromStr")]
    pub pt_deduction_applied: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub biz_nti: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub total_nti: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub income_tax_due: Decimal,
    pub deduction_method: DeductionMethod, // Always ITEMIZED
    pub path_label: String,                // "Path A — Graduated + Itemized Deductions"
    pub deduction_breakdown: DeductionBreakdown,
    #[serde_as(as = "DisplayFromStr")]
    pub total_deductions: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub ear_cap_applied: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub interest_arbitrage_reduction: Decimal,
    pub nolco_remaining: Vec<NolcoEntry>,
}

/// Path B (Graduated + OSD 40%) computation result.
#[serde_as]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PathBResult {
    pub eligible: bool,
    #[serde_as(as = "DisplayFromStr")]
    pub biz_nti: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub total_nti: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub income_tax_due: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub osd_amount: Decimal,
    pub deduction_method: DeductionMethod, // Always OSD
    pub path_label: String,                // "Path B — Graduated + OSD (40%)"
    #[serde_as(as = "DisplayFromStr")]
    pub osd_base: Decimal,
}

/// Path C (8% Flat Rate) computation result.
#[serde_as]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PathCResult {
    pub eligible: bool,
    pub ineligible_reasons: Vec<String>, // [] if eligible; each is "IN-XX: reason"
    #[serde_as(as = "DisplayFromStr")]
    pub exempt_amount: Decimal,          // "250000.00" for PURELY_SE, "0.00" for MIXED
    #[serde_as(as = "DisplayFromStr")]
    pub taxable_base: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub income_tax_due: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub compensation_it: Decimal, // "0.00" for PURELY_SE
    #[serde_as(as = "DisplayFromStr")]
    pub total_income_tax: Decimal,
    pub pt_waived: bool,
    pub deduction_method: DeductionMethod, // Always NONE
    pub path_label: String,                // "Path C — 8% Flat Rate"
}

/// Regime comparison table entry (one per path — always 3 in output).
#[serde_as]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegimeOption {
    pub path: RegimePath,
    #[serde_as(as = "DisplayFromStr")]
    pub income_tax_due: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub percentage_tax_due: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub total_tax_burden: Decimal,
    pub label: String,
    pub requires_documentation: bool,
    pub requires_oas: bool,
    #[serde_as(as = "DisplayFromStr")]
    pub effective_rate: Decimal,
}

/// Itemized deduction category breakdown (Path A).
#[serde_as]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeductionBreakdown {
    #[serde_as(as = "DisplayFromStr")]
    pub salaries: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub employee_benefits: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub rent: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub utilities: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub communication: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub office_supplies: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub professional_fees: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub travel_transportation: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub insurance: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub interest: Decimal, // Net of arbitrage reduction
    #[serde_as(as = "DisplayFromStr")]
    pub taxes_licenses: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub losses: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub bad_debts: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub depreciation: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub charitable: Decimal, // After 10% cap
    #[serde_as(as = "DisplayFromStr")]
    pub research_development: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub entertainment_representation: Decimal, // After EAR cap
    #[serde_as(as = "DisplayFromStr")]
    pub home_office: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub nolco: Decimal,
}

/// Percentage tax computation result.
#[serde_as]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PercentageTaxResult {
    pub pt_applies: bool,
    #[serde_as(as = "DisplayFromStr")]
    pub pt_rate: Decimal,   // "0.03" or "0.01" for CREATE period
    #[serde_as(as = "DisplayFromStr")]
    pub pt_base: Decimal,   // "0.00" if pt_applies == false
    #[serde_as(as = "DisplayFromStr")]
    pub pt_due: Decimal,    // "0.00" if pt_applies == false
    pub form2551q_required: bool,
    pub filing_deadline: Option<String>, // None if form not required
    pub reason: String,                  // Human-readable explanation
}

/// Penalty amounts for a single tax type (IT or PT).
#[serde_as]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PenaltyStack {
    #[serde_as(as = "DisplayFromStr")]
    pub surcharge: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub interest: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub compromise: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub total: Decimal, // tax_due + surcharge + interest + compromise
}

/// Late filing penalty result.
#[serde_as]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PenaltyResult {
    pub applies: bool,
    pub days_late: i32,   // 0 if applies == false
    pub months_late: i32, // ceil(days_late / 30); 0 if applies == false
    pub it_penalties: PenaltyStack,
    pub pt_penalties: PenaltyStack,
    #[serde_as(as = "DisplayFromStr")]
    pub total_penalties: Decimal, // surcharge+interest+compromise only (NOT base tax)
}

// ============================================================================
// BIR Form Output Types
// ============================================================================

/// FormOutputUnion — adjacently tagged.
/// NOTE: `formVariant` tag uses PascalCase Rust variant names (NOT SCREAMING_SNAKE_CASE).
/// "Form1701a" ≠ "FORM_1701A" — use formType for routing.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "formVariant", content = "fields")]
pub enum FormOutputUnion {
    Form1701(Form1701Output),
    Form1701a(Form1701AOutput),
    Form1701q(Form1701QOutput),
}

/// BIR Form 1701-A output fields.
#[serde_as]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Form1701AOutput {
    // Header
    pub tax_year_covered: u16,
    pub amended_return: bool,
    pub short_period_return: bool,
    pub fiscal_year_end: Option<String>,

    // Part I
    pub tin: String,
    pub rdo_code: String,
    pub taxpayer_name_last: String,
    pub taxpayer_name_first: String,
    pub taxpayer_name_middle: String,
    pub citizenship: String,
    pub civil_status: String,
    pub registered_address: String,
    pub zip_code: String,
    pub contact_number: String,
    pub email_address: String,
    pub business_name: String,
    pub psic_code: String,
    pub method_of_deduction: String,  // "OSD" | "8% FLAT RATE"
    pub type_of_taxpayer: String,     // "Individual"
    pub birthday: String,
    pub atc_code: String,
    pub is_availing_osd: bool,
    pub is_availing_8pct: bool,

    // Part II: Tax Payable
    #[serde_as(as = "DisplayFromStr")]
    pub income_tax_due: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub less_tax_relief: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub income_tax_due_net_of_relief: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub add_penalties_surcharge: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub add_penalties_interest: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub add_penalties_compromise: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub total_tax_payable: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub less_tax_credits: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub net_tax_payable: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub overpayment: Decimal,
    pub overpayment_to_be_refunded: bool,
    pub overpayment_to_be_issued_tcc: bool,
    pub overpayment_to_carry_over: bool,

    // Part III: CPA Info
    pub cpa_tin: Option<String>,
    pub cpa_name: Option<String>,
    pub cpa_accreditation_number: Option<String>,

    // Part IV-A: OSD path
    #[serde_as(as = "DisplayFromStr")]
    pub iva_gross_sales_services: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub iva_sales_returns_allowances: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub iva_net_sales: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub iva_cost_of_sales: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub iva_total_gross_income: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub iva_non_op_income_interest: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub iva_non_op_income_rental: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub iva_non_op_income_royalty: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub iva_non_op_income_dividend: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub iva_non_op_income_others: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub iva_osd_amount: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub iva_net_taxable_income: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub iva_graduated_tax_table1: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub iva_graduated_tax_table2: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub iva_income_tax_due: Decimal,

    // Part IV-B: 8% path
    #[serde_as(as = "DisplayFromStr")]
    pub ivb_gross_sales_services: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub ivb_sales_returns_allowances: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub ivb_net_sales: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub ivb_non_op_income_interest: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub ivb_non_op_income_rental: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub ivb_non_op_income_royalty: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub ivb_non_op_income_dividend: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub ivb_non_op_income_others: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub ivb_total_gross: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub ivb_less_250k: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub ivb_taxable_income: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub ivb_income_tax_due: Decimal,

    // Tax Credits
    #[serde_as(as = "DisplayFromStr")]
    pub tc_prior_year_excess: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub tc_quarterly_1701q_payments: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub tc_cwt_q1_q2_q3: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub tc_cwt_q4: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub tc_prior_filing_payment: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub tc_foreign_tax_credits: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub tc_other_credits: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub tc_total_credits: Decimal,
}

/// NOLCO schedule row for Form 1701 Schedule 6.
#[serde_as]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NolcoScheduleRow {
    pub col_a_year_incurred: u16,
    #[serde_as(as = "DisplayFromStr")]
    pub col_b_original_loss: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub col_c_applied_prior_years: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub col_d_balance_beginning: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub col_e_applied_current_year: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub col_f_balance_end: Decimal,
    pub expiry_year: u16,
    pub expired: bool,
}

/// BIR Form 1701 output fields.
#[serde_as]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Form1701Output {
    // Header
    pub tax_year_covered: u16,
    pub amended_return: bool,
    pub short_period_return: bool,

    // Part I
    pub tin: String,
    pub rdo_code: String,
    pub taxpayer_name_last: String,
    pub taxpayer_name_first: String,
    pub taxpayer_name_middle: String,
    pub citizenship: String,
    pub civil_status: String,
    pub registered_address: String,
    pub zip_code: String,
    pub contact_number: String,
    pub email_address: String,
    pub business_name: String,
    pub psic_code: String,
    pub method_of_deduction: String,  // "ITEMIZED" | "OSD"
    pub type_of_taxpayer: String,     // "Individual"
    pub birthday: String,
    pub atc_code: String,
    pub with_business_income: bool,
    pub with_compensation_income: bool,

    // Part II: Tax Payable
    #[serde_as(as = "DisplayFromStr")]
    pub income_tax_due: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub less_tax_relief: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub net_tax_due: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub surcharge: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub interest: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub compromise: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub total_payable: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub less_tax_credits_total: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub net_payable: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub overpayment_amount: Decimal,
    pub overpayment_refund: bool,
    pub overpayment_tcc: bool,
    pub overpayment_carry_over: bool,
    #[serde_as(as = "DisplayFromStr")]
    pub second_installment_amount: Decimal,

    // Schedule 2: Compensation
    #[serde_as(as = "DisplayFromStr")]
    pub sched2_gross_compensation: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched2_non_taxable_exclusions: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched2_taxable_compensation: Decimal,

    // Schedule 3A: Graduated rates
    #[serde_as(as = "DisplayFromStr")]
    pub sched3a_gross_receipts: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched3a_less_returns: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched3a_net_receipts: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched3a_less_cogs: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched3a_gross_income_from_ops: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched3a_non_op_income: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched3a_total_gross_income: Decimal,
    pub sched3a_deduction_method: String,
    #[serde_as(as = "DisplayFromStr")]
    pub sched3a_total_deductions: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched3a_comp_nti: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched3a_biz_nti: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched3a_total_nti: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched3a_tax_table1: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched3a_tax_table2: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched3a_income_tax_due: Decimal,

    // Schedule 3B: 8% rate
    #[serde_as(as = "DisplayFromStr")]
    pub sched3b_gross_receipts: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched3b_less_returns: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched3b_net_receipts: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched3b_non_op_income: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched3b_total_gross: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched3b_less_250k: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched3b_taxable_income: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched3b_income_tax_due: Decimal,

    // Schedule 4: Itemized Deductions
    #[serde_as(as = "DisplayFromStr")]
    pub sched4_compensation_deductions: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched4_sss_gsis_philhealth: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched4_rent: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched4_interest: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched4_utilities: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched4_ear: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched4_communication: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched4_depreciation: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched4_taxes_licenses: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched4_insurance: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched4_professional_fees: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched4_travel: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched4_supplies: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched4_charitable: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched4_bad_debts: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched4_research_development: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched4_others: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched4_total_ordinary_deductions: Decimal,

    // Schedule 5: Special Deductions
    #[serde_as(as = "DisplayFromStr")]
    pub sched5_pension_trust: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched5_premium_health_hospitalization: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched5_nolco: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched5_fringe_benefits: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sched5_total: Decimal,

    // Schedule 6: NOLCO
    pub sched6_entries: Vec<NolcoScheduleRow>,

    // Part V: Tax Due
    #[serde_as(as = "DisplayFromStr")]
    pub v1_tax_on_comp: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub v2_tax_from_sched3a_or_3b: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub v3_less_special_deductions: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub v4_total_tax: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub v5_income_tax_due: Decimal,

    // Part VI: Tax Credits
    #[serde_as(as = "DisplayFromStr")]
    pub vi1_prior_year_excess: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub vi2_q1_payment: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub vi3_q2_payment: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub vi4_q3_payment: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub vi5_cwt_q1_q2_q3: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub vi6_cwt_q4: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub vi7_comp_cwt: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub vi8_prior_amended_payment: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub vi9_foreign_tax_credit: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub vi10_other_credits: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub vi11_total_credits: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub vi12_net_tax_payable: Decimal,
}

/// BIR Form 1701-Q output fields.
#[serde_as]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Form1701QOutput {
    // Header
    pub tax_year: u16,
    pub quarter: u8,
    pub return_period_from: String,
    pub return_period_to: String,
    pub amended_return: bool,

    // Part I
    pub tin: String,
    pub rdo_code: String,
    pub taxpayer_name: String,
    pub business_name: String,

    // Schedule I: Graduated Method
    #[serde_as(as = "DisplayFromStr")]
    pub si_gross_receipts: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub si_less_returns: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub si_net_receipts: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub si_less_cogs: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub si_gross_income: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub si_non_op_income: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub si_total_gross_income: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub si_deductions: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub si_prior_qtr_nti: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub si_total_nti: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub si_income_tax_due_table1: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub si_income_tax_due_table2: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub si_income_tax_due: Decimal,

    // Schedule II: 8% Method
    #[serde_as(as = "DisplayFromStr")]
    pub sii_current_qtr_gross: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sii_returns_allowances: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sii_net_current: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sii_prior_qtr_cumulative_8pct: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sii_total_cumulative_gross: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sii_less_250k: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sii_taxable_cumulative: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sii_tax_due_8pct: Decimal,

    // Schedule III: Tax Credits
    #[serde_as(as = "DisplayFromStr")]
    pub siii_cwt_current_quarter: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub siii_prior_qtr_cwt_already_claimed: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub siii_net_cwt_this_qtr: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub siii_prior_qtr_1701q_payments: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub siii_prior_year_excess: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub siii_total_credits: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub siii_net_payable: Decimal,

    // Schedule IV: Penalties
    #[serde_as(as = "DisplayFromStr")]
    pub siv_surcharge: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub siv_interest: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub siv_compromise: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub siv_total_penalties: Decimal,
}

/// Percentage Tax Form 2551-Q schedule row.
#[serde_as]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Pt2551QScheduleRow {
    pub atc_code: String,
    #[serde_as(as = "DisplayFromStr")]
    pub tax_base: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub rate: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub tax_due: Decimal,
    pub description: String,
}

/// BIR Form 2551-Q (Quarterly Percentage Tax) output.
#[serde_as]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Form2551QOutput {
    // Header
    pub tax_year: u16,
    pub quarter: u8,   // 2551Q IS filed for Q4 unlike 1701Q — valid: 1–4
    pub return_period_from: String,
    pub return_period_to: String,
    pub amended_return: bool,
    pub nil_return: bool,

    // Part I
    pub tin: String,
    pub rdo_code: String,
    pub taxpayer_name: String,
    pub business_name: String,

    // Part II: Tax Payable
    pub atc_code: String,
    #[serde_as(as = "DisplayFromStr")]
    pub gross_taxable_sales_receipts: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub percentage_tax_rate: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub percentage_tax_due: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub less_pt_cwt_credits: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub net_pt_payable: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub add_surcharge: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub add_interest: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub add_compromise: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub total_amount_payable: Decimal,

    // Schedule 1
    pub schedule1_rows: Vec<Pt2551QScheduleRow>,
}
