# Analysis: Rust Data Model — RA 7641 Retirement Pay Engine

**Wave:** 3 — Engine Design
**Aspect:** data-model
**Date:** 2026-03-06
**Sources:** core-formula-22-5-days.md, eligibility-rules.md, salary-basis-inclusions.md,
             tax-treatment-conditions.md, separation-pay-interaction.md,
             company-plan-comparison-rules.md, batch-computation-rules.md,
             nlrc-worksheet-format.md, death-before-retirement.md, edge-cases-catalog.md

---

## Overview

This document defines every Rust type used in the retirement pay engine. Types are grouped into:

1. **Input types** — what the WASM bridge receives from the frontend
2. **Intermediate types** — internal computation state (not exposed on wire)
3. **Output types** — what the WASM bridge returns to the frontend
4. **Shared enums** — enums used in both input and output
5. **NLRC types** — NLRC worksheet-specific structures
6. **Batch types** — batch computation input/output
7. **Error types** — error contract

All monetary values are `i64` centavos. No `f64` anywhere in the engine.
All dates are `chrono::NaiveDate`. No timezone handling in the engine.
JSON serialization uses `serde` with `rename_all = "camelCase"` and `deny_unknown_fields`.

---

## 1. Shared Enums

These enums appear in both input and output structures.

### WorkerCategory

```rust
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum WorkerCategory {
    /// Standard private sector employee (age 60 optional, 65 compulsory)
    General,
    /// Underground mine worker under RA 8558 (age 50 optional, 60 compulsory)
    UndergroundMine,
    /// Surface mine worker under RA 10757 — mill plant, electrical, mechanical,
    /// tailings pond personnel (age 50 optional, 60 compulsory)
    SurfaceMine,
}
```

### EmployerType

```rust
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum EmployerType {
    /// Non-retail, non-service, non-agricultural; ≤10-employee exemption does NOT apply
    General,
    /// Retail establishment; ≤10-employee exemption applies
    Retail,
    /// Service establishment; ≤10-employee exemption applies
    Service,
    /// Agricultural establishment; ≤10-employee exemption applies
    Agricultural,
}
```

### EmploymentType

```rust
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum EmploymentType {
    /// Monthly-salaried employee; daily rate = monthly / salary_divisor
    Monthly,
    /// Daily-paid employee with regular work; salary basis = daily_rate × salary_divisor
    Daily,
    /// Piece-rate / output-based employee; daily rate = ADS over last 12 months
    PieceRate,
}
```

### RetirementType

```rust
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum RetirementType {
    /// Voluntary retirement at age 60–64 (general) or 50–59 (mine workers)
    Optional,
    /// Compulsory retirement at age 65 (general) or 60 (mine workers)
    Compulsory,
    /// Early retirement under company plan / CBA (below statutory optional age)
    EarlyCompanyPlan,
    /// Death in service — heirs' benefit computed as if retired on date of death
    Death,
}
```

### AuthorizedCause

Authorized causes for termination that trigger separation pay under Labor Code Art. 298-299.

```rust
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum AuthorizedCause {
    /// Installation of labor-saving devices (Art. 298) — 1 month per year
    LaborSavingDevices,
    /// Redundancy (Art. 298) — 1 month per year
    Redundancy,
    /// Retrenchment to prevent losses (Art. 298) — 1/2 month per year
    Retrenchment,
    /// Closure not due to serious financial losses (Art. 298) — 1/2 month per year
    ClosureNotDueToLosses,
    /// Closure due to serious financial losses (Art. 298) — NOT legally required
    ClosureDueToLosses,
    /// Disease/illness where continued employment is prohibited by law or
    /// prejudicial to the employee's health (Art. 299) — 1/2 month per year
    Disease,
}
```

### CompanyPlanType

```rust
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum CompanyPlanType {
    /// No company plan; RA 7641 statutory minimum applies in full
    None,
    /// Company plan expressed as N days per year (e.g., 26 days = "1 month per year")
    DaysPerYear,
    /// Company plan expressed as N months per year (e.g., 1.0 = "1 month per year")
    MonthsPerYear,
    /// Company plan is a fixed lump sum amount
    FixedLumpSum,
    /// User manually computed and enters the company plan benefit directly
    ManualEntry,
}
```

### TaxExemptionTrack

```rust
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum TaxExemptionTrack {
    /// Track A: Exempt under NIRC Sec. 32(B)(6)(a) via Labor Code Art. 302 (RA 7641)
    /// Conditions: age ≥ 60, service ≥ 5 years, first time
    LaborCodeMandatory,
    /// Track B: Exempt under NIRC Sec. 32(B)(6)(a) via RA 4917 BIR-approved plan
    /// Conditions: age ≥ 50, service ≥ 10 years, BIR TQP plan, first time
    BirApprovedPlan,
    /// Not exempt — retirement pay is taxable income under NIRC
    None,
}
```

### ParentDocumentType (NLRC)

```rust
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ParentDocumentType {
    PositionPaper,
    Complaint,
    Reply,
    Standalone,
}
```

---

## 2. Input Types

### RetirementInput

The primary input to `compute_single_json()`. All fields required unless marked `Option<T>`.

```rust
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RetirementInput {
    // ─── Employee Identity ───────────────────────────────────────────────────
    /// Full name of the employee (used in NLRC worksheet narrative)
    pub employee_name: String,

    // ─── Dates ───────────────────────────────────────────────────────────────
    /// Employee's date of birth (YYYY-MM-DD)
    pub birth_date: NaiveDate,

    /// First day of employment with the current employer (YYYY-MM-DD)
    pub hire_date: NaiveDate,

    /// Last day of employment / date of retirement or separation (YYYY-MM-DD)
    /// For death cases: date of death
    pub retirement_date: NaiveDate,

    // ─── Worker Classification ────────────────────────────────────────────────
    /// Worker category determining age thresholds
    pub worker_category: WorkerCategory,

    /// Type of retirement event
    pub retirement_type: RetirementType,

    // ─── Employer ────────────────────────────────────────────────────────────
    /// Total number of employees in the establishment at time of retirement
    /// (determines ≤10 employee exemption applicability)
    pub employer_employee_count: u32,

    /// Employer classification (determines ≤10 employee exemption applicability)
    pub employer_type: EmployerType,

    // ─── Salary ──────────────────────────────────────────────────────────────
    /// Employment type (monthly / daily / piece-rate)
    pub employment_type: EmploymentType,

    /// Latest monthly basic salary in centavos (required for Monthly and Daily types)
    /// For Daily type: this is the daily rate × salary_divisor
    /// Must be > 0 and ≤ 999_999_999 (PHP 9,999,999.99)
    /// Null only when employment_type = PieceRate
    pub monthly_salary_centavos: Option<i64>,

    /// Daily rate divisor. Accepts only 22 or 26 (default: 26)
    /// 26 = standard Philippine practice (IRR Rule II, Sec. 5)
    /// 22 = alternative if employment contract specifies 22 working days/month
    pub salary_divisor: u8,

    /// Whether COLA has been formally integrated into the basic salary above.
    /// If true: the amount in monthly_salary_centavos already includes integrated COLA.
    /// If false: the amount is pure basic salary (COLA excluded per DOLE Advisory).
    /// Does NOT affect computation; affects display output only.
    pub cola_integrated: bool,

    /// COLA amount in centavos (for display reference only — always excluded from formula)
    /// Required when cola_integrated = false and user wants it shown in output
    pub cola_amount_centavos: Option<i64>,

    // ─── Piece-rate fields (required when employment_type = PieceRate) ───────
    /// Total piece-rate / output-based earnings in last 12 months (centavos)
    /// Required when employment_type = PieceRate
    pub total_earnings_last_12_months_centavos: Option<i64>,

    /// Actual days worked in last 12 months (calendar days with work performed)
    /// Required when employment_type = PieceRate
    pub actual_working_days_last_12_months: Option<u32>,

    // ─── Tax Treatment Inputs ─────────────────────────────────────────────────
    /// Whether the employer holds a BIR Certificate of Qualification (Tax-Qualified Plan)
    /// Enables Track B tax exemption (RA 4917) for employees aged 50-59 with ≥10 years service
    pub employer_has_bir_approved_plan: bool,

    /// Whether the employee has previously received tax-exempt retirement benefits
    /// from any employer (once-in-a-lifetime limit per NIRC Sec. 32(B)(6)(a))
    pub employee_has_used_retirement_exemption: bool,

    /// Whether the employee will be re-employed by the same employer or related party
    /// within 12 months. Re-employment retroactively disallows the tax exemption.
    pub reemployed_within_12_months: bool,

    // ─── Separation Pay Interaction ───────────────────────────────────────────
    /// Authorized cause of termination (if employee is also being separated for a cause)
    /// None = pure retirement (no authorized cause)
    pub authorized_cause: Option<AuthorizedCause>,

    /// Whether the employer's CBA or company policy contains a crediting clause
    /// (i.e., separation pay is credited against retirement pay or vice versa)
    /// When true: only the higher amount is due
    /// When false: both amounts are independently owed (Aquino v. NLRC)
    pub has_crediting_clause: bool,

    // ─── Company Plan Comparison (optional) ──────────────────────────────────
    /// Whether a company retirement plan exists
    pub has_company_plan: bool,

    /// Type of company plan formula (required when has_company_plan = true)
    pub company_plan_type: Option<CompanyPlanType>,

    /// Days per year under company plan (required when company_plan_type = DaysPerYear)
    /// e.g., 26.0 for "1 month per year", 30.0 for "30 days per year"
    /// Stored as rational numerator × 10 to avoid floats:
    /// Use i32 tenths — e.g., 260 for 26.0 days, 225 for 22.5 days
    pub company_plan_days_per_year_tenths: Option<i32>,

    /// Months per year under company plan × 100 (required when company_plan_type = MonthsPerYear)
    /// e.g., 100 for 1.0 month, 150 for 1.5 months
    /// Stored as integer hundredths to avoid floats
    pub company_plan_months_per_year_hundredths: Option<i32>,

    /// Fixed lump sum company plan benefit in centavos
    /// (required when company_plan_type = FixedLumpSum)
    pub company_plan_fixed_amount_centavos: Option<i64>,

    /// Manually entered company plan benefit in centavos
    /// (required when company_plan_type = ManualEntry)
    pub company_plan_benefit_centavos: Option<i64>,

    /// PAG-IBIG employer contributions accumulated for this employee (centavos)
    /// When provided, credited against the RA 7641 obligation
    /// None = no PAG-IBIG offset applied
    pub pagibig_employer_contributions_centavos: Option<i64>,

    // ─── CBA / Optional Retirement Age Override ───────────────────────────────
    /// CBA retirement age (if CBA provides a retirement age lower than statutory)
    /// Enables EarlyCompanyPlan retirement type for employees below statutory optional age
    /// None = no CBA override; statutory age thresholds apply
    pub cba_retirement_age: Option<u8>,
}
```

**Validation rules (enforced by engine before computation):**

| Field | Rule |
|-------|------|
| `birth_date` | Must be ≤ `hire_date` − 18 years (no child labor) |
| `hire_date` | Must be < `retirement_date` |
| `retirement_date` | Must be ≤ today + 366 days (planning window) |
| `employer_employee_count` | Must be ≥ 1 |
| `salary_divisor` | Must be exactly 22 or 26 |
| `monthly_salary_centavos` | Required when `employment_type` ≠ PieceRate; must be > 0 and ≤ 999_999_999 |
| `total_earnings_last_12_months_centavos` | Required when `employment_type` = PieceRate; must be > 0 |
| `actual_working_days_last_12_months` | Required when `employment_type` = PieceRate; must be ≥ 1 and ≤ 366 |
| `company_plan_type` | Required when `has_company_plan` = true |
| `company_plan_days_per_year_tenths` | Required when `company_plan_type` = DaysPerYear; must be > 0 |
| `company_plan_months_per_year_hundredths` | Required when `company_plan_type` = MonthsPerYear; must be > 0 |
| `company_plan_fixed_amount_centavos` | Required when `company_plan_type` = FixedLumpSum; must be > 0 |
| `company_plan_benefit_centavos` | Required when `company_plan_type` = ManualEntry; must be > 0 |

---

### BatchInput

Input to `compute_batch_json()`.

```rust
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BatchInput {
    /// Full CSV content as a UTF-8 string (including header row)
    pub csv_content: String,
}
```

---

### NlrcWorksheetInput

Input to `generate_nlrc_json()`. Wraps a `RetirementInput` plus exhibit metadata.

```rust
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct NlrcWorksheetInput {
    /// Complete retirement computation input (same as compute_single_json input)
    pub computation: RetirementInput,

    // ─── Case Filing Metadata ─────────────────────────────────────────────────
    /// NLRC regional branch (e.g., "National Capital Region, First Division")
    pub nlrc_branch: String,

    /// NLRC case number. None → displayed as "To be assigned"
    pub case_number: Option<String>,

    /// Exhibit label (e.g., "A", "1", "B-1")
    pub annex_label: String,

    /// Type of document to which the worksheet is attached
    pub parent_document_type: ParentDocumentType,

    /// Name of the person who prepared the worksheet (counsel, HR, or employee)
    pub prepared_by: String,

    /// Date the worksheet was prepared (YYYY-MM-DD)
    pub prepared_date: NaiveDate,

    // ─── Display Fields ───────────────────────────────────────────────────────
    /// Job title / designation of the employee (for narrative)
    pub employee_position: Option<String>,

    /// Employer's full legal name as it should appear in the NLRC filing
    pub respondent_name: String,

    // ─── Computation Flags ────────────────────────────────────────────────────
    /// Whether to include the 15-day vs 22.5-day underpayment comparison section
    /// Default: true (primary evidentiary value of the worksheet)
    pub include_employer_error_comparison: bool,
}
```

---

## 3. Intermediate Types

These types exist only within the engine computation pipeline. They are NOT exposed via WASM JSON output.

### EligibilityCheck

```rust
pub struct EligibilityCheck {
    pub age_at_retirement: u8,
    pub min_optional_age: u8,
    pub compulsory_age: u8,
    pub service_months: u32,         // total calendar months from hire to retirement
    pub meets_age_gate: bool,
    pub meets_service_gate: bool,
    pub meets_employer_size_gate: bool,
    pub small_employer_exemption_applicable: bool,  // employer_type is retail/service/agricultural
}
```

### CreditedYearsCalc

```rust
pub struct CreditedYearsCalc {
    pub full_years: u32,
    pub remaining_months: u8,   // 0–11
    pub credited_years: u32,    // full_years + (1 if remaining_months ≥ 6 else 0)
    pub rounding_applied: bool,
}
```

### SalaryBasis

```rust
pub struct SalaryBasis {
    /// Monthly salary used in the computation (centavos)
    /// = monthly_salary_centavos (monthly/daily) OR
    ///   total_earnings / actual_days × salary_divisor (piece_rate — imputed monthly)
    pub effective_monthly_centavos: i64,

    /// Daily rate = effective_monthly_centavos / salary_divisor (integer division)
    pub daily_rate_centavos: i64,

    /// Divisor used (22 or 26)
    pub divisor: u8,

    /// Whether computation used piece-rate ADS method
    pub is_piece_rate: bool,
}
```

---

## 4. Output Types

### RetirementOutput

The primary output of `compute_single_json()`.

```rust
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RetirementOutput {
    // ─── Eligibility ──────────────────────────────────────────────────────────
    pub eligibility: EligibilityResult,

    // ─── Credited Service ─────────────────────────────────────────────────────
    /// Total calendar months from hire_date to retirement_date
    pub service_months: u32,

    /// Full years of service (before rounding)
    pub full_years: u32,

    /// Remaining months after full years (0–11)
    pub partial_months: u8,

    /// Credited years after applying ≥6-month rounding rule
    pub credited_years: u32,

    /// Whether the ≥6-month rounding rule was applied
    pub rounding_applied: bool,

    // ─── Salary Basis ─────────────────────────────────────────────────────────
    /// Effective monthly salary used in computation (centavos)
    pub effective_monthly_centavos: i64,

    /// Daily rate (effective_monthly / salary_divisor, integer division)
    pub daily_rate_centavos: i64,

    /// Divisor used for daily rate computation (22 or 26)
    pub salary_divisor: u8,

    /// COLA amount excluded from computation (centavos); 0 if none or integrated
    pub cola_excluded_centavos: i64,

    // ─── 22.5-Day Formula Decomposition ──────────────────────────────────────
    /// The three statutory components of "one-half month salary" (RA 7641 Sec. 1)
    pub formula_breakdown: FormulaBreakdown,

    // ─── Core Retirement Pay ──────────────────────────────────────────────────
    /// Total retirement pay = half_month_centavos × credited_years (centavos)
    pub retirement_pay_centavos: i64,

    // ─── Employer Error Comparison ────────────────────────────────────────────
    /// What the employer would pay using the incorrect 15-day formula (centavos)
    pub fifteen_day_formula_centavos: i64,

    /// Underpayment if employer uses 15-day formula (centavos)
    /// = retirement_pay_centavos - fifteen_day_formula_centavos
    pub underpayment_centavos: i64,

    /// Underpayment as integer basis points (underpayment / retirement_pay × 10000)
    /// e.g., 3333 = 33.33%
    pub underpayment_basis_points: u32,

    // ─── Tax Treatment ────────────────────────────────────────────────────────
    pub tax_treatment: TaxTreatment,

    // ─── Separation Pay Comparison ────────────────────────────────────────────
    /// Present when authorized_cause is Some(_) OR always present (may be RetirementOnly)
    pub separation_pay: SeparationPayComparison,

    // ─── Company Plan Comparison ──────────────────────────────────────────────
    /// Present only when has_company_plan = true in input
    pub company_plan: Option<CompanyPlanAnalysis>,

    // ─── Age at Retirement ────────────────────────────────────────────────────
    pub age_at_retirement: u8,

    /// Retirement type as determined by the engine (may differ from input if
    /// engine corrects based on actual age — e.g., input says Optional but age ≥ 65)
    pub retirement_type: RetirementType,
}
```

### EligibilityResult

```rust
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EligibilityResult {
    /// Whether the employee has RA 7641 entitlement
    pub is_eligible: bool,

    /// "eligible_optional" | "eligible_compulsory" | "ineligible_age" |
    /// "ineligible_service" | "ineligible_small_employer"
    pub status: String,

    /// Human-readable explanation (one sentence)
    pub reason: String,

    /// Primary ineligibility reason (null if eligible)
    pub ineligibility_reason: Option<IneligibilityReason>,

    /// Warnings that do not prevent computation but flag legal uncertainties
    pub warnings: Vec<EligibilityWarning>,
}
```

### IneligibilityReason

```rust
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase", tag = "type")]
pub enum IneligibilityReason {
    BelowMinimumRetirementAge {
        age_at_retirement: u8,
        minimum_age: u8,
    },
    InsufficientService {
        service_months: u32,
        required_months: u32,   // always 60
    },
    EmployerExemptSmallEstablishment {
        reported_employee_count: u32,
    },
}
```

### EligibilityWarning

```rust
#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum EligibilityWarning {
    /// Employer claims ≤10 employees; headcount should be independently verified
    SmallEstablishmentExemptionClaimed,
    /// A CBA may provide an earlier retirement age; verify before concluding ineligibility
    CbaRetirementAgeMayApply,
    /// Employee transferred from a related company; service aggregation may apply
    CompanyTransferServiceAggregationRequired,
    /// Fixed-term employee with ≥5 years service; may be deemed regular by SC jurisprudence
    FixedTermRegularEmployeeFlag,
}
```

### FormulaBreakdown

The three statutory components of "one-half month salary" under RA 7641 Sec. 1.
Used for both results display and NLRC worksheet three-addend computation.

```rust
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FormulaBreakdown {
    /// Component 1: 15 days salary = monthly_salary × 15 / salary_divisor (integer division)
    pub fifteen_days_centavos: i64,

    /// Component 2: 5 days SIL = monthly_salary × 5 / salary_divisor (integer division)
    pub five_days_sil_centavos: i64,

    /// Component 3: 1/12 of 13th month = monthly_salary / 12 (integer division)
    pub one_twelfth_thirteenth_month_centavos: i64,

    /// Sum of all three components = "one-half month salary" for this employee
    /// = fifteen_days + five_days_sil + one_twelfth_thirteenth_month (centavos)
    pub half_month_total_centavos: i64,

    /// Fixed display values for the formula components (constants, not computed)
    /// These are safe to display as floats since they are fixed legal constants
    pub days_basic: f64,      // always 15.0
    pub days_sil: f64,        // always 5.0
    pub days_thirteenth: f64, // always 2.5 (display approximation — actual computation uses /12)
    pub days_total: f64,      // always 22.5
}
```

**Note on arithmetic**: The three-addend method (15/div + 5/div + 1/12) is the authoritative computation for the NLRC worksheet. The shortcut (monthly × 45 / 52) is used for the main retirement pay total to minimize intermediate truncation. Both are computed and cross-referenced; any discrepancy of > 2 centavos triggers a computation invariant violation log.

### TaxTreatment

```rust
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TaxTreatment {
    /// Whether retirement pay qualifies for income tax exemption
    pub is_tax_exempt: bool,

    /// Which exemption track applies (LaborCodeMandatory, BirApprovedPlan, or None)
    pub exemption_track: TaxExemptionTrack,

    /// Human-readable explanation of the tax determination
    pub reason: String,

    /// True when Track B conditions (age ≥ 50, service ≥ 10 years) are met but
    /// employer has no BIR-approved plan — indicates the employer could enable
    /// exemption by registering a plan
    pub bir_plan_required_for_exemption: bool,

    /// True when exempt but employee may be re-employed within 12 months —
    /// warns that exemption could be retroactively disallowed
    pub re_employment_caveat_applies: bool,

    /// List of unmet conditions that prevent exemption (for detailed UI display)
    pub unmet_conditions: Vec<String>,
}
```

### SeparationPayComparison

```rust
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SeparationPayComparison {
    /// Authorized cause from input (None = pure retirement)
    pub authorized_cause: Option<AuthorizedCause>,

    /// Computed separation pay amount (0 when no authorized cause or ClosureDueToLosses)
    pub separation_pay_centavos: i64,

    /// Daily rate used for separation pay computation (same as retirement daily rate)
    pub separation_pay_daily_rate_centavos: i64,

    /// Rate days used: 30 (LaborSavingDevices/Redundancy), 15 (others), 0 (none)
    pub rate_days: u8,

    /// Whether the 1-month minimum was applied
    pub one_month_minimum_applied: bool,

    /// Credited years used (same as retirement credited_years)
    pub credited_years: u32,

    /// Payment scenario — determines what amounts are owed and how
    pub payment_scenario: PaymentScenario,

    /// Legal citation note for dual entitlement (null when not applicable)
    pub dual_entitlement_note: Option<String>,

    /// Whether the crediting clause from input was applied
    pub crediting_clause_applied: bool,
}
```

### PaymentScenario

```rust
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase", tag = "tag")]
pub enum PaymentScenario {
    /// Pure retirement — no authorized cause. Only retirement pay owed.
    RetirementOnly,

    /// Employee has authorized cause but is not retirement-eligible.
    SeparationOnly {
        separation_pay_centavos: i64,
    },

    /// Both retirement-eligible AND terminated for authorized cause.
    /// No crediting clause — both amounts independently owed.
    /// Authority: Aquino v. NLRC (G.R. No. 87653), Goodyear v. Angus (G.R. No. 185449)
    DualEntitlement {
        retirement_pay_centavos: i64,
        separation_pay_centavos: i64,
        total_centavos: i64,
    },

    /// Crediting clause applies AND retirement pay > separation pay.
    /// Total due = retirement pay (separation pay is offset/credited).
    CreditedRetirementHigher {
        total_due_centavos: i64,
        sep_pay_offset_centavos: i64,
        additional_retirement_due_centavos: i64,
    },

    /// Crediting clause applies AND separation pay ≥ retirement pay.
    /// RA 7641 minimum is satisfied since sep pay ≥ retirement pay.
    CreditedSeparationHigher {
        total_due_centavos: i64,
    },

    /// Neither retirement-eligible nor authorized cause — no statutory entitlement.
    NeitherEligible,
}
```

### CompanyPlanAnalysis

```rust
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CompanyPlanAnalysis {
    /// Company plan type from input
    pub plan_type: CompanyPlanType,

    /// Company plan benefit computed in centavos
    pub company_plan_benefit_centavos: i64,

    /// Statutory minimum computed under RA 7641 (22.5-day formula)
    pub statutory_minimum_centavos: i64,

    /// Amount employee is entitled to receive: max(company_plan, statutory_minimum)
    pub retirement_pay_owed_centavos: i64,

    /// Which governs: "statutory" (when statutory > company) or "company" (when company ≥ statutory)
    pub governing_plan: String,

    /// Shortfall of company plan below statutory minimum (centavos)
    /// 0 when company plan meets or exceeds statutory minimum
    pub gap_centavos: i64,

    /// Gap as basis points of statutory minimum (gap / statutory × 10000)
    /// 0 when gap = 0
    pub gap_basis_points: u32,

    /// PAG-IBIG employer contributions credited (centavos); 0 if not provided
    pub pagibig_offset_centavos: i64,

    /// Additional obligation after PAG-IBIG offset: max(0, gap - pagibig_offset)
    pub additional_obligation_centavos: i64,

    /// Human-readable description of company plan formula (for display)
    pub plan_description: String,

    /// Equivalent days per year of the company plan (for comparison display)
    /// Stored as tenths: e.g., 225 = 22.5 days, 260 = 26.0 days
    pub equivalent_days_per_year_tenths: i32,
}
```

---

## 5. Batch Types

### BatchOutput

Returned by `compute_batch_json()`.

```rust
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchOutput {
    /// UUID v4 identifying this batch run
    pub batch_id: String,

    /// ISO 8601 UTC timestamp of computation
    pub computed_at: String,

    /// Number of data rows in the CSV (excluding header and comment rows)
    pub input_row_count: u32,

    /// Aggregated summary statistics
    pub summary: BatchSummary,

    /// Per-employee results in CSV row order
    pub employees: Vec<BatchEmployeeResult>,

    /// Convenience subset: only rows with parse_error or computation_error status
    pub row_errors: Vec<BatchRowError>,
}
```

### BatchSummary

```rust
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchSummary {
    // ─── Counts ───────────────────────────────────────────────────────────────
    pub total_rows: u32,
    pub parse_error_rows: u32,
    pub computation_error_rows: u32,
    pub eligible_rows: u32,
    pub ineligible_rows: u32,

    // ─── Monetary Totals (eligible employees only) ────────────────────────────
    pub total_retirement_pay_centavos: i64,
    pub total_fifteen_day_amount_centavos: i64,
    pub total_underpayment_centavos: i64,
    pub total_company_plan_gap_centavos: i64,

    // ─── Per-Employee Statistics (eligible employees only) ────────────────────
    pub avg_retirement_pay_centavos: i64,
    pub median_retirement_pay_centavos: i64,
    pub min_retirement_pay_centavos: i64,
    pub max_retirement_pay_centavos: i64,
    pub avg_credited_years: u32,
    pub avg_monthly_salary_centavos: i64,

    // ─── Tax Treatment Distribution ───────────────────────────────────────────
    pub potentially_exempt_count: u32,
    pub not_exempt_count: u32,
    pub requires_verification_count: u32,

    // ─── Ineligibility Breakdown ──────────────────────────────────────────────
    pub ineligible_age_count: u32,
    pub ineligible_service_count: u32,
    pub ineligible_small_employer_count: u32,

    // ─── Company Plan Gap Distribution ────────────────────────────────────────
    pub employees_with_company_plan: u32,
    pub employees_meeting_statutory_minimum: u32,
    pub employees_below_statutory_minimum: u32,
}
```

### BatchEmployeeResult

```rust
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchEmployeeResult {
    pub employee_id: String,
    pub employee_name: String,
    pub row_number: u32,

    /// "ok" | "ineligible" | "computation_error" | "parse_error"
    pub status: String,

    // ─── Present when status = "ok" or "ineligible" ───────────────────────────
    /// "eligible_optional" | "eligible_compulsory" | "ineligible_age" |
    /// "ineligible_service" | "ineligible_small_employer"
    pub eligibility_status: Option<String>,

    /// Eligibility warning code or null
    pub eligibility_warning: Option<String>,

    pub age_at_retirement: Option<u8>,
    pub service_months: Option<u32>,
    pub credited_years: Option<u32>,
    pub rounding_applied: Option<bool>,
    pub partial_months: Option<u8>,
    pub monthly_salary_centavos: Option<i64>,
    pub retirement_pay_centavos: Option<i64>,
    pub fifteen_day_amount_centavos: Option<i64>,
    pub underpayment_centavos: Option<i64>,

    /// "potentially_exempt" | "not_exempt" | "requires_verification"
    pub tax_treatment: Option<String>,

    pub has_company_plan: Option<bool>,
    pub company_plan_gap_centavos: Option<i64>,

    /// User-provided note from CSV (pass-through)
    pub notes: Option<String>,

    // ─── Present when status = "computation_error" or "parse_error" ───────────
    pub error_code: Option<String>,
    pub error_message: Option<String>,
    pub error_field: Option<String>,
}
```

### BatchRowError

```rust
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchRowError {
    pub row_number: u32,
    pub employee_id: String,
    pub error_code: String,
    pub error_message: String,
    pub error_field: Option<String>,
}
```

---

## 6. NLRC Worksheet Types

### NlrcWorksheet

Full structured output of `generate_nlrc_json()`. The frontend renders this into PDF via @react-pdf/renderer.

```rust
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NlrcWorksheet {
    // ─── Case Header ──────────────────────────────────────────────────────────
    pub nlrc_branch: String,
    pub complainant_name: String,
    pub respondent_name: String,
    /// Case number or null (displays as "To be assigned")
    pub case_number: Option<String>,
    pub annex_label: String,
    /// "positionPaper" | "complaint" | "reply" | "standalone"
    pub parent_document_type: String,
    pub prepared_by: String,
    /// "March 6, 2026" format (full month name DD, YYYY)
    pub prepared_date: String,

    // ─── Factual Basis ────────────────────────────────────────────────────────
    pub employee_position: Option<String>,
    /// "January 1, 1994" format
    pub hire_date_formatted: String,
    /// "March 15, 2026" format
    pub retirement_date_formatted: String,
    /// "Optional Retirement (Age 60)" | "Compulsory Retirement (Age 65)" | etc.
    pub retirement_type_description: String,
    pub age_at_retirement: u8,
    pub service_years: u32,
    pub service_months: u8,
    /// "PHP 28,000.00" format
    pub monthly_salary_formatted: String,
    pub salary_divisor: u8,

    // ─── Credited Years ───────────────────────────────────────────────────────
    pub credited_years: u32,
    pub rounding_applied: bool,
    pub partial_months: u8,
    /// "7 months ≥ 6 months — partial year rounded up to next full year" or
    /// "5 months < 6 months — partial year not credited (dropped)" or
    /// "No partial year — credited years equal full years of service"
    pub rounding_description: String,

    // ─── Daily Rate ───────────────────────────────────────────────────────────
    pub daily_rate_centavos: i64,
    /// "PHP 1,076.92" format
    pub daily_rate_formatted: String,

    // ─── 22.5-Day Decomposition ───────────────────────────────────────────────
    pub fifteen_days_centavos: i64,
    pub fifteen_days_formatted: String,
    pub five_days_sil_centavos: i64,
    pub five_days_sil_formatted: String,
    pub one_twelfth_thirteenth_month_centavos: i64,
    pub one_twelfth_thirteenth_month_formatted: String,
    pub half_month_total_centavos: i64,
    pub half_month_total_formatted: String,

    // ─── Total Retirement Pay ─────────────────────────────────────────────────
    pub retirement_pay_centavos: i64,
    pub retirement_pay_formatted: String,

    // ─── Employer Error Comparison (conditional section) ─────────────────────
    pub include_employer_error_comparison: bool,
    pub fifteen_day_formula_amount_centavos: i64,
    pub fifteen_day_formula_amount_formatted: String,
    pub underpayment_centavos: i64,
    pub underpayment_formatted: String,
    /// "33.33%" — computed as (underpayment / retirement_pay) × 100, 2 decimal places
    pub underpayment_pct_display: String,

    // ─── Separation Pay (conditional section) ────────────────────────────────
    pub include_separation_pay: bool,
    pub separation_pay: Option<NlrcSeparationPaySection>,

    // ─── Tax Treatment ────────────────────────────────────────────────────────
    /// "Exempt" | "PotentiallyExempt" | "NotExempt"
    pub tax_treatment_status: String,
    /// Full rendered paragraph text for Section VI
    pub tax_section_text: String,

    // ─── Summary ──────────────────────────────────────────────────────────────
    pub total_money_claim_centavos: i64,
    pub total_money_claim_formatted: String,
    pub summary_line_items: Vec<NlrcLineItem>,

    // ─── Legal Citations ──────────────────────────────────────────────────────
    pub legal_citations: Vec<LegalCitation>,
}
```

### NlrcSeparationPaySection

```rust
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NlrcSeparationPaySection {
    pub authorized_cause: AuthorizedCause,
    /// "Retrenchment to prevent losses (Labor Code Art. 298)"
    pub authorized_cause_description: String,
    /// "Art. 298" or "Art. 299"
    pub legal_basis_article: String,
    /// "one-half (1/2) month salary per year of service"
    pub rate_description: String,
    /// 15 or 30 (0 for ClosureDueToLosses)
    pub rate_days: u8,
    pub separation_pay_centavos: i64,
    pub separation_pay_formatted: String,
    pub uses_one_month_minimum: bool,
    /// "Both retirement and separation pay are independently owed (Aquino v. NLRC, G.R. No. 87653)"
    /// OR "Retirement pay is higher — crediting clause applied"
    pub payment_scenario_description: String,
}
```

### NlrcLineItem

```rust
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NlrcLineItem {
    /// "Retirement Pay (RA 7641 / Art. 302)"
    pub label: String,
    /// "(32 years × PHP 23,871.78)"
    pub sub_label: String,
    pub amount_centavos: i64,
    /// "PHP 763,896.96"
    pub amount_formatted: String,
}
```

### LegalCitation

```rust
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LegalCitation {
    /// "Republic Act No. 7641, Sec. 1"
    pub citation: String,
    /// "Defines 'one-half month salary' as 15 days + 5 days SIL + 1/12 of 13th month pay"
    pub description: String,
}
```

---

## 7. Error Types

### EngineError

Returned by all three WASM export functions when processing fails.

```rust
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineError {
    /// Machine-readable error code (e.g., "validation_error", "invalid_date_format")
    pub error: String,

    /// Unique error code for programmatic handling
    pub code: String,

    /// Specific field that caused the error (null for structural errors)
    pub field: Option<String>,

    /// "error" | "warning" | "info"
    pub severity: String,

    /// Human-readable explanation safe for display to users
    pub message: String,
}
```

**JSON shape:**
```json
{
  "error": "validation_error",
  "code": "invalid_salary_divisor",
  "field": "salaryDivisor",
  "severity": "error",
  "message": "salaryDivisor must be 22 or 26. Received: 30."
}
```

### Standard Error Codes

| Code | Trigger |
|------|---------|
| `validation_error` | Field fails validation rule |
| `invalid_date_format` | Date string not in YYYY-MM-DD format |
| `invalid_date_value` | Date string is a valid format but invalid calendar date |
| `date_range_violation` | hire_date ≥ retirement_date, or birth_date ≥ hire_date |
| `invalid_salary_divisor` | salary_divisor is not 22 or 26 |
| `missing_required_field` | Required field is null when employment_type requires it |
| `salary_out_of_range` | monthly_salary_centavos ≤ 0 or > 999_999_999 |
| `invalid_worker_category` | Unrecognized WorkerCategory variant |
| `invalid_employer_type` | Unrecognized EmployerType variant |
| `invalid_authorized_cause` | Unrecognized AuthorizedCause variant |
| `invalid_company_plan_type` | Unrecognized CompanyPlanType variant |
| `company_plan_data_missing` | has_company_plan=true but required plan field is null |
| `piece_rate_data_missing` | employment_type=PieceRate but earnings/days fields are null |
| `batch_too_large` | CSV has > 5,000 data rows |
| `batch_empty` | CSV has no data rows |
| `missing_columns` | CSV missing required header columns |
| `invalid_encoding` | CSV is not valid UTF-8 |
| `not_csv` | Input does not parse as CSV |
| `deserialization_error` | JSON input does not match expected schema |

---

## 8. Serde Configuration

All public structs use:

```rust
#[serde(rename_all = "camelCase")]
```

Input structs additionally use:

```rust
#[serde(deny_unknown_fields)]
```

This ensures the frontend cannot send extra fields that might silently be ignored,
preventing type drift between TypeScript and Rust from going undetected.

Enums are serialized as camelCase strings:

```rust
#[serde(rename_all = "camelCase")]
// WorkerCategory::UndergroundMine → "undergroundMine"
// AuthorizedCause::ClosureNotDueToLosses → "closureNotDueToLosses"
// CompanyPlanType::DaysPerYear → "daysPerYear"
```

Tagged enums (PaymentScenario) use `tag = "tag"` to produce JSON like:
```json
{ "tag": "dualEntitlement", "retirementPayCentavos": 38365380, ... }
```

Dates are serialized as `NaiveDate` → `"YYYY-MM-DD"` strings via serde's default chrono support.

Option fields serialize as `null` (not omitted). The frontend must handle null, not undefined.

---

## 9. Type Relationship Diagram

```
BatchInput ──────────────── compute_batch_json() ──────────────── BatchOutput
                                                                      ├── BatchSummary
                                                                      └── Vec<BatchEmployeeResult>

RetirementInput ──────────── compute_single_json() ────────────── RetirementOutput
                                                                      ├── EligibilityResult
                                                                      │     ├── IneligibilityReason (enum)
                                                                      │     └── Vec<EligibilityWarning>
                                                                      ├── FormulaBreakdown
                                                                      ├── TaxTreatment
                                                                      ├── SeparationPayComparison
                                                                      │     └── PaymentScenario (enum)
                                                                      └── Option<CompanyPlanAnalysis>

NlrcWorksheetInput ──────── generate_nlrc_json() ───────────────── NlrcWorksheet
  └── computation: RetirementInput                                    ├── Option<NlrcSeparationPaySection>
                                                                      ├── Vec<NlrcLineItem>
                                                                      └── Vec<LegalCitation>

Any of the above ──────────── [on error] ───────────────────────── EngineError
```

---

## 10. Key Design Decisions

### Money: i64 centavos everywhere

All monetary values in the engine are `i64` centavos. No `f64`. The frontend formats centavos to pesos for display. This prevents floating-point rounding errors on multi-decade, high-salary computations.

Overflow analysis:
- Max monthly salary: PHP 9,999,999.99 → 999,999,999 centavos
- Max credited years: 50 (reasonable maximum)
- Max retirement pay: 999,999,999 × 45 × 50 / 52 ≈ 43.3 billion centavos = i64 max 9.2 × 10^18 — no overflow

### Two arithmetic paths

1. **Shortcut** (45/52): Used for `RetirementOutput.retirement_pay_centavos`. Minimizes intermediate truncation.
2. **Three-addend** (15/div + 5/div + 1/12): Used for `FormulaBreakdown` and NLRC worksheet. Matches statutory language exactly and is required for the worksheet's line-item display.

### Fraction encoding for company plan formulas

Company plan days/months use integer tenths/hundredths rather than `f64` to avoid float serialization issues:
- `company_plan_days_per_year_tenths: i32` — 225 = 22.5 days
- `company_plan_months_per_year_hundredths: i32` — 150 = 1.5 months

### No computed strings in engine for display

The engine does NOT produce currency-formatted strings like "PHP 28,000.00" in `RetirementOutput`. Those belong in the frontend. Exception: `NlrcWorksheet` includes pre-formatted strings because the worksheet has strict formatting rules (PHP prefix, comma separator, 2 decimal places) that must be consistent across PDF and HTML renderers.

### Option<T> vs absent fields

All optional fields use `Option<T>` and serialize as JSON `null`, never omitted. The TypeScript types use `T | null` (not `T | undefined`), and Zod schemas use `z.nullable()` (not `z.optional()`).

---

## 11. Summary

| Category | Count |
|----------|-------|
| Shared enums | 8 |
| Input types | 3 (RetirementInput, BatchInput, NlrcWorksheetInput) |
| Intermediate types | 3 (EligibilityCheck, CreditedYearsCalc, SalaryBasis) |
| Output types (RetirementOutput subtypes) | 8 |
| Batch types | 4 |
| NLRC types | 5 |
| Error types | 1 (EngineError) |
| **Total public types** | **32** |

All 32 types map 1:1 to TypeScript interfaces defined in the frontend data model (next Wave 5 aspect).
Field names in Rust (snake_case) become camelCase in JSON and TypeScript via serde `rename_all`.
