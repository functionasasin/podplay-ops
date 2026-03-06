# Analysis: Computation Pipeline — RA 7641 Retirement Pay Engine

**Wave:** 3 — Engine Design
**Aspect:** computation-pipeline
**Date:** 2026-03-06
**Sources:** eligibility-rules.md, core-formula-22-5-days.md, tax-treatment-conditions.md,
             separation-pay-interaction.md, company-plan-comparison-rules.md, data-model.md

---

## Overview

The engine runs a single-pass, ordered, short-circuiting pipeline. Each step receives the outputs
of all prior steps. A step may emit a fatal error (halts pipeline) or a warning (records and
continues). The final output assembles all intermediate results.

**Pipeline shape:**

```
Input (RetirementInput)
  │
  ▼
Step 1: Input Validation
  │ (fatal on invalid field values)
  ▼
Step 2: Eligibility Check
  │ (short-circuit: ineligible outputs skip steps 3–7; still compute for reference)
  ▼
Step 3: Credited Years Computation
  │
  ▼
Step 4: Daily Rate Computation
  │
  ▼
Step 5: Core Retirement Pay Computation (22.5-day formula)
  │
  ▼
Step 6: Company Plan Comparison (conditional on has_company_plan)
  │
  ▼
Step 7: Tax Treatment Determination
  │
  ▼
Step 8: Separation Pay Computation + Interaction (conditional on authorized_cause.is_some())
  │
  ▼
Step 9: Output Assembly
  │
  ▼
Output (RetirementOutput)
```

**Failure semantics:**
- Steps 1–5 are non-optional. Any fatal error in steps 1–4 halts the pipeline.
- Step 2 eligibility failure does NOT halt steps 3–9. The pipeline continues and computes all
  amounts for reference. The output's `eligibility.status` field communicates ineligibility to
  the frontend.
- Steps 6, 7, 8 are always computed. They produce zero/null outputs when not applicable.
- Step 9 always succeeds (assembles whatever was computed).

---

## Step 1: Input Validation

**Purpose:** Reject malformed inputs before any computation begins.

**Inputs:** `RetirementInput` (raw)

**Outputs:** `ValidationResult` (all errors collected; do not fail-fast — collect all errors)

### Field-Level Validation Rules

| Field | Validation Rule | Error Code |
|-------|-----------------|------------|
| `monthlyBasicSalaryCentavos` | > 0 | `salary_must_be_positive` |
| `monthlyBasicSalaryCentavos` | ≤ 50_000_000_00 (PHP 500M) | `salary_exceeds_maximum` |
| `salaryDivisor` | Must be 22 or 26 | `invalid_salary_divisor` |
| `birthDate` | Valid ISO 8601 date (YYYY-MM-DD) | `invalid_birth_date` |
| `hireDate` | Valid ISO 8601 date (YYYY-MM-DD) | `invalid_hire_date` |
| `retirementDate` | Valid ISO 8601 date (YYYY-MM-DD) | `invalid_retirement_date` |
| `birthDate` → `hireDate` gap | hire_date - birth_date ≥ 15 years | `hire_date_implies_child_labor` |
| `hireDate` → `retirementDate` order | hire_date < retirement_date | `hire_date_not_before_retirement_date` |
| `retirementDate` upper bound | retirement_date ≤ today + 365 days | `retirement_date_too_far_future` |
| `workerCategory` | Enum: `General`, `UndergroundMine`, `SurfaceMine` | `invalid_worker_category` |
| `employerType` | Enum: `General`, `Retail`, `Service`, `Agricultural` | `invalid_employer_type` |
| `employerEmployeeCount` | ≥ 1 | `employee_count_must_be_positive` |
| `companyPlanType` (if present) | Enum: `DaysPerYear`, `MonthsPerYear`, `FixedLumpSum`, `ManualEntry` | `invalid_company_plan_type` |
| `companyDaysPerYear` (if DaysPerYear) | > 0.0 and ≤ 365.0 | `invalid_company_days_per_year` |
| `companyMonthsPerYear` (if MonthsPerYear) | > 0.0 and ≤ 12.0 | `invalid_company_months_per_year` |
| `companyFixedAmountCentavos` (if FixedLumpSum) | > 0 | `fixed_lump_sum_must_be_positive` |
| `companyPlanBenefitCentavos` (if ManualEntry) | > 0 | `manual_benefit_must_be_positive` |
| `pagibigEmployerContributionsCentavos` (if hasPagebigOffset) | ≥ 0 | `pagibig_contributions_must_be_non_negative` |

### Cross-Field Validation

| Rule | Error Code |
|------|------------|
| If `authorizedCause` = `ClosureDueToLosses`: `hasCreditingClause` must be false (closure due to losses yields no separation pay, so no crediting applies) | `crediting_clause_inapplicable_for_closure_losses` |
| If `reemployedWithin12Months` = true AND `authorizedCause`.is_some(): warn — separation pay exemption is independent, re-employment caveat only affects retirement pay exemption | `warning_reemployed_separation_pay_exempt_unaffected` |

### Validation Output Type

```rust
pub struct ValidationResult {
    pub is_valid: bool,
    pub errors: Vec<ValidationError>,
    pub warnings: Vec<ValidationWarning>,
}

pub struct ValidationError {
    pub field: String,          // JSON field path, e.g., "monthlyBasicSalaryCentavos"
    pub code: String,           // machine-readable code from table above
    pub message: String,        // human-readable explanation
}

pub struct ValidationWarning {
    pub field: Option<String>,
    pub code: String,
    pub message: String,
}
```

**Pipeline behavior:** If `is_valid = false`, halt pipeline. Return `ComputeError` with the
validation errors list. Do not proceed to Step 2.

---

## Step 2: Eligibility Check

**Purpose:** Determine whether the employee qualifies for RA 7641 retirement pay.

**Inputs:**
- `birth_date: NaiveDate`
- `hire_date: NaiveDate`
- `retirement_date: NaiveDate`
- `worker_category: WorkerCategory`
- `employer_type: EmployerType`
- `employer_employee_count: u32`
- `cba_retirement_age: Option<u8>` (None = no CBA, Some(55) = CBA allows age 55 retirement)

**Outputs:** `EligibilityResult`

### Sub-step 2a: Age Threshold by Worker Category

```rust
let (optional_age, compulsory_age) = match worker_category {
    WorkerCategory::General       => (60u8, 65u8),
    WorkerCategory::UndergroundMine => (50u8, 60u8),
    WorkerCategory::SurfaceMine   => (50u8, 60u8),
};

// Override optional_age if CBA specifies earlier retirement
let effective_optional_age = match cba_retirement_age {
    Some(cba_age) if cba_age < optional_age => cba_age,
    _ => optional_age,
};

let age_at_retirement: u8 = full_years_between(birth_date, retirement_date);
// full_years_between: returns floor of (retirement_date - birth_date) in years
// Uses calendar year arithmetic (chrono::NaiveDate subtraction)
```

### Sub-step 2b: Age Gate

```rust
let age_gate = if age_at_retirement < effective_optional_age {
    // Check CBA case: if has cba and age >= cba retirement age, pass
    IneligibleReason::BelowMinimumRetirementAge {
        age_at_retirement,
        minimum_age: effective_optional_age,
    }
} else {
    // Age passes
};

let retirement_type = if age_at_retirement >= compulsory_age {
    RetirementType::Compulsory
} else {
    RetirementType::Optional
};
```

### Sub-step 2c: Service Gate

```rust
// CRITICAL: The 5-year minimum uses FULL calendar months, NOT the 6-month rounding rule.
// The rounding rule only applies to credited years computation (Step 3).
let service_months: u32 = full_months_between(hire_date, retirement_date);
// full_months_between: returns floor of complete calendar months elapsed

let service_gate = if service_months < 60 {
    IneligibleReason::InsufficientService {
        service_months,
        required_months: 60,
    }
} else {
    // Service passes
};
```

### Sub-step 2d: Employer Size Gate

```rust
// Only applies to: Retail, Service, Agricultural employer types with <= 10 employees
let size_gate = if employer_employee_count <= 10
    && matches!(employer_type, EmployerType::Retail | EmployerType::Service | EmployerType::Agricultural)
{
    // Ineligible but still compute for reference; add warning
    IneligibleReason::EmployerExemptSmallEstablishment {
        reported_employee_count: employer_employee_count,
    }
} else {
    // Employer size passes
};
```

### Sub-step 2e: Combine Gates

```rust
// Priority order: if multiple gates fail, report all failures
let ineligible_reasons: Vec<IneligibleReason> = [age_gate, service_gate, size_gate]
    .into_iter()
    .flatten()
    .collect();

let eligibility_status = if ineligible_reasons.is_empty() {
    EligibilityStatus::Eligible { retirement_type }
} else if ineligible_reasons.iter().all(|r| matches!(r, IneligibleReason::EmployerExemptSmallEstablishment { .. })) {
    // Only employer size fails — treat as EligibleWithWarning (compute but flag)
    EligibilityStatus::EligibleWithWarning {
        retirement_type,
        warnings: vec![EligibilityWarning::SmallEstablishmentExemptionClaimed {
            reported_employee_count: employer_employee_count,
        }],
    }
} else {
    EligibilityStatus::Ineligible { reasons: ineligible_reasons }
};
```

**Pipeline behavior:** Ineligibility does NOT halt pipeline. Steps 3–8 execute normally.
The `RetirementOutput.eligibility.status` field communicates ineligibility. The computed
amounts are still populated for the "reference amount" shown in the UI (with ineligible badge).

---

## Step 3: Credited Years Computation

**Purpose:** Compute the legally credited years of service using the 6-month rounding rule.

**Inputs:**
- `hire_date: NaiveDate`
- `retirement_date: NaiveDate`

**Outputs:** `CreditedYearsResult`

### Algorithm

```rust
// Use calendar month arithmetic (chrono). Do NOT use day-count approximations.

let total_months: u32 = full_months_between(hire_date, retirement_date);
let full_years: u32 = total_months / 12;
let remaining_months: u32 = total_months % 12;

// 6-month rounding rule: RA 7641 Sec. 1
// "a fraction of at least six (6) months being considered as one whole year"
let (credited_years, rounding_applied) = if remaining_months >= 6 {
    (full_years + 1, true)
} else {
    (full_years, false)
};
```

### `full_months_between` Implementation

```rust
fn full_months_between(start: NaiveDate, end: NaiveDate) -> u32 {
    // Returns the count of complete calendar months elapsed.
    // E.g., 2003-07-01 → 2024-03-01 = 20 years 8 months = 248 months
    let years_diff = end.year() - start.year();
    let months_diff = end.month() as i32 - start.month() as i32;
    let day_adjustment = if end.day() < start.day() { -1i32 } else { 0i32 };
    let total_months = years_diff * 12 + months_diff + day_adjustment;
    total_months.max(0) as u32
}
```

### Output Type

```rust
pub struct CreditedYearsResult {
    pub full_years: u32,         // complete years without rounding
    pub remaining_months: u32,   // months after subtracting full years (0–11)
    pub credited_years: u32,     // after 6-month rounding rule
    pub rounding_applied: bool,  // true if remaining_months >= 6
    pub total_months_served: u32, // full_months_between result
}
```

### Edge Cases

| Scenario | Result |
|----------|--------|
| Exactly 5 years (60 months, 0 remaining) | full_years=5, remaining=0, credited=5, rounding=false |
| 4 years 6 months (54 months) | full_years=4, remaining=6, credited=5, rounding=true — ELIGIBLE |
| 4 years 5 months (53 months) | full_years=4, remaining=5, credited=4, rounding=false — INELIGIBLE |
| 20 years 0 months | credited=20, rounding=false |
| 20 years 6 months | credited=21, rounding=true |
| 20 years 11 months | credited=21, rounding=true |

---

## Step 4: Daily Rate Computation

**Purpose:** Compute the daily rate in integer centavos.

**Inputs:**
- `monthly_basic_salary_centavos: i64`
- `salary_divisor: u8` (22 or 26)

**Outputs:** `DailyRateResult`

### Algorithm

```rust
// Integer division — truncate remainder.
// This matches DOLE practice: daily rate is always floored.
// The retirement pay formula (Step 5) compensates by computing end-to-end in centavos.
let daily_rate_centavos: i64 = monthly_basic_salary_centavos / salary_divisor as i64;

let daily_rate_remainder_centavos: i64 =
    monthly_basic_salary_centavos % salary_divisor as i64;
```

### Output Type

```rust
pub struct DailyRateResult {
    pub daily_rate_centavos: i64,
    pub monthly_salary_centavos: i64,   // echoed for traceability
    pub salary_divisor: u8,
    pub daily_rate_remainder_centavos: i64, // for audit trail (not used in subsequent steps)
}
```

**Note:** The daily rate is shown in the UI for display purposes. It is NOT used in the core
retirement pay formula — the formula uses `monthly × 45 / 52` (exact rational). The daily rate
is used for:
1. Display in the 22.5-day breakdown card
2. Separation pay computation (Step 8), which requires a per-day amount

---

## Step 5: Core Retirement Pay Computation

**Purpose:** Compute the RA 7641 statutory retirement pay using the 22.5-day formula.

**Inputs:**
- `monthly_basic_salary_centavos: i64`
- `credited_years: u32` (from Step 3)
- `salary_divisor: u8`
- `daily_rate_centavos: i64` (from Step 4, used for component breakdown display)

**Outputs:** `RetirementPayResult`

### Primary Formula

```rust
// Exact rational arithmetic: 22.5 days / salary_divisor days
// For divisor=26: 22.5/26 = 45/52 (exact)
// For divisor=22: 22.5/22 = 45/44 (exact)

let (numerator, denominator) = match salary_divisor {
    26 => (45i64, 52i64),   // 22.5/26 = 45/52
    22 => (45i64, 44i64),   // 22.5/22 = 45/44
    _  => unreachable!(),   // validated in Step 1
};

// Multiply before divide to minimize truncation error.
// Overflow check: max monthly_centavos ≈ 500_000_000 (PHP 5M)
//   500_000_000 * 45 = 22_500_000_000 — fits in i64 (max ~9.2 × 10^18)
//   * 45 * credited_years (max 50) = 1_125_000_000_000 — fits in i64
let retirement_pay_centavos: i64 =
    monthly_basic_salary_centavos * numerator * credited_years as i64 / denominator;
```

### 22.5-Day Breakdown (Display Components)

These are fixed display constants computed from the daily rate for the UI breakdown card.
They are NOT reused in subsequent pipeline steps.

```rust
// 15-day component (basic salary portion)
let basic_component_centavos: i64 = daily_rate_centavos * 15;

// 5-day SIL component
let sil_component_centavos: i64 = daily_rate_centavos * 5;

// 2.5-day (1/12 of 13th month) component
// 2.5 = 5/2, so: daily_rate * 5 / 2
let thirteenth_month_component_centavos: i64 = daily_rate_centavos * 5 / 2;

// NOTE: These three components DO NOT sum exactly to retirement_pay_centavos
// because the primary formula is computed end-to-end without intermediate rounding.
// The breakdown is for display purposes. The authoritative amount is retirement_pay_centavos.
```

### 15-Day Error Comparison (Employer Underpayment Quantification)

```rust
// What an employer using the wrong 15-day formula would pay:
// 15 days / salary_divisor = for divisor 26: 15/26 ratio
let fifteen_day_numerator: i64 = match salary_divisor {
    26 => 15,
    22 => 15,
    _  => unreachable!(),
};

let employer_error_amount_centavos: i64 =
    monthly_basic_salary_centavos * fifteen_day_numerator * credited_years as i64
    / salary_divisor as i64;

let underpayment_centavos: i64 =
    retirement_pay_centavos - employer_error_amount_centavos;

// Underpayment as a rational percentage. For 22.5 vs 15 days:
// (22.5 - 15) / 22.5 = 7.5 / 22.5 = 1/3 = 33.33...%
// Store as basis points (integer): 3333 = 33.33%
let underpayment_basis_points: u32 =
    (underpayment_centavos * 10000 / retirement_pay_centavos) as u32;
```

### Output Type

```rust
pub struct RetirementPayResult {
    pub retirement_pay_centavos: i64,

    // 22.5-day breakdown (display only)
    pub basic_component_centavos: i64,          // 15 days × daily rate
    pub sil_component_centavos: i64,            // 5 days × daily rate
    pub thirteenth_month_component_centavos: i64, // 2.5 days × daily rate

    // 15-day employer error comparison
    pub employer_error_amount_centavos: i64,    // what 15-day formula yields
    pub underpayment_centavos: i64,             // correct - error
    pub underpayment_basis_points: u32,         // e.g., 3333 = 33.33%

    // Formula traceability
    pub credited_years: u32,
    pub salary_divisor: u8,
    pub formula_numerator: i64,   // 45 (for divisor 26) or 45 (for divisor 22)
    pub formula_denominator: i64, // 52 (for divisor 26) or 44 (for divisor 22)
}
```

---

## Step 6: Company Plan Comparison

**Purpose:** Compare statutory minimum to company plan benefit; determine which governs.

**Inputs:**
- `retirement_pay_centavos: i64` (from Step 5 — the statutory minimum)
- `monthly_basic_salary_centavos: i64`
- `credited_years: u32` (from Step 3)
- `daily_rate_centavos: i64` (from Step 4)
- Company plan fields from `RetirementInput`:
  - `has_company_plan: bool`
  - `company_plan_type: CompanyPlanType`
  - `company_days_per_year: Option<f64>` (for DaysPerYear)
  - `company_months_per_year: Option<f64>` (for MonthsPerYear)
  - `company_fixed_amount_centavos: Option<i64>` (for FixedLumpSum)
  - `company_plan_benefit_centavos: Option<i64>` (for ManualEntry)
  - `has_pagibig_offset: bool`
  - `pagibig_employer_contributions_centavos: i64`

**Outputs:** `CompanyPlanResult`

### Algorithm

```rust
if !has_company_plan {
    return CompanyPlanResult::NotApplicable;
}

// Compute company plan benefit (in centavos, integer arithmetic)
let company_benefit_centavos: i64 = match company_plan_type {
    CompanyPlanType::DaysPerYear => {
        // Convert days_per_year to exact rational
        // days_per_year is provided as f64 but must be validated to be a simple fraction
        // Engine converts to rational: multiply by 2 to clear the 0.5 if applicable
        // E.g., 22.5 days → numerator=45, denominator=2
        // Then: monthly * numerator * credited_years / (denominator * salary_divisor)
        let days_per_year = company_days_per_year.unwrap();
        // Represent as centavos: daily_rate * days_per_year * credited_years
        // To avoid f64: scale days_per_year × 10 to integer, divide by 10
        // days × 10 gives integer (e.g., 22.5 × 10 = 225)
        let days_times_10 = (days_per_year * 10.0).round() as i64;
        daily_rate_centavos * days_times_10 * credited_years as i64 / 10
    }
    CompanyPlanType::MonthsPerYear => {
        let months_per_year = company_months_per_year.unwrap();
        // months × 10 to integer (e.g., 1.5 × 10 = 15)
        let months_times_10 = (months_per_year * 10.0).round() as i64;
        monthly_basic_salary_centavos * months_times_10 * credited_years as i64 / 10
    }
    CompanyPlanType::FixedLumpSum => {
        company_fixed_amount_centavos.unwrap()
    }
    CompanyPlanType::ManualEntry => {
        company_plan_benefit_centavos.unwrap()
    }
};

// PAG-IBIG offset: only employer contributions count
let pagibig_offset = if has_pagibig_offset {
    pagibig_employer_contributions_centavos
} else {
    0i64
};

// Effective company benefit after PAG-IBIG offset
// PAG-IBIG offset reduces the additional obligation but does not increase company benefit
let statutory_minimum = retirement_pay_centavos; // from Step 5

// Gap analysis
let gap_centavos = statutory_minimum - company_benefit_centavos;
// positive gap = statutory is higher (underpayment)
// negative gap = company plan is more generous (no gap)

// After PAG-IBIG offset:
let additional_obligation_centavos = if gap_centavos > 0 {
    // Employer must top up, but credit PAG-IBIG contributions already made
    (gap_centavos - pagibig_offset).max(0)
} else {
    0i64
};

let governs = if company_benefit_centavos >= statutory_minimum {
    PlanGoverns::Company
} else {
    PlanGoverns::Statutory
};

let retirement_pay_owed_centavos = company_benefit_centavos.max(statutory_minimum);
```

### Output Type

```rust
pub enum PlanGoverns {
    Statutory,   // RA 7641 minimum is higher; employer must pay statutory amount
    Company,     // Company plan is at least as good; company amount governs
}

pub enum CompanyPlanResult {
    NotApplicable,
    Computed {
        company_benefit_centavos: i64,
        statutory_minimum_centavos: i64,
        retirement_pay_owed_centavos: i64,  // max(company, statutory)
        governs: PlanGoverns,
        gap_centavos: i64,                  // statutory - company (positive = underpayment)
        gap_basis_points: u32,              // |gap| / statutory × 10000
        pagibig_offset_centavos: i64,
        additional_obligation_centavos: i64, // gap after PAG-IBIG credit
    },
}
```

---

## Step 7: Tax Treatment Determination

**Purpose:** Determine whether the retirement pay is tax-exempt and under which track.

**Inputs:**
- `age_at_retirement: u8` (from Step 2)
- `credited_years: u32` (from Step 3)
- `employer_has_bir_approved_plan: bool`
- `employee_has_used_retirement_exemption: bool`
- `reemployed_within_12_months: bool`

**Outputs:** `TaxTreatmentResult`

### Algorithm

```rust
// Short-circuit: once-in-a-lifetime limit already used
if employee_has_used_retirement_exemption {
    return TaxTreatmentResult {
        is_tax_exempt: false,
        exemption_track: TaxExemptionTrack::None,
        reason: "Employee has previously received tax-exempt retirement benefits.
                 The exemption is available only once in a lifetime (RMC 13-2024).".to_string(),
        bir_plan_required_for_exemption: false,
        re_employment_caveat_applies: false,
    };
}

// Short-circuit: re-employed within 12 months disallows exemption
if reemployed_within_12_months {
    return TaxTreatmentResult {
        is_tax_exempt: false,
        exemption_track: TaxExemptionTrack::None,
        reason: "Employee will be re-employed within 12 months. The exemption is
                 retroactively disallowed (NIRC Sec. 32(B)(6)(a)).".to_string(),
        bir_plan_required_for_exemption: false,
        re_employment_caveat_applies: true,
    };
}

// Track A: RA 7641 Statutory (age ≥ 60, service ≥ 5 years)
if age_at_retirement >= 60 && credited_years >= 5 {
    return TaxTreatmentResult {
        is_tax_exempt: true,
        exemption_track: TaxExemptionTrack::LaborCodeMandatory,
        reason: "Tax-exempt under NIRC Sec. 32(B)(6)(a) as mandatory Labor Code retirement.
                 Age ≥ 60 and service ≥ 5 years. No BIR-approved plan required.".to_string(),
        bir_plan_required_for_exemption: false,
        re_employment_caveat_applies: false,
    };
}

// Track B: RA 4917 BIR-Approved Plan (age 50–59, service ≥ 10 years, BIR plan)
if age_at_retirement >= 50 && credited_years >= 10 {
    if employer_has_bir_approved_plan {
        return TaxTreatmentResult {
            is_tax_exempt: true,
            exemption_track: TaxExemptionTrack::BirApprovedPlan,
            reason: "Tax-exempt under NIRC Sec. 32(B)(6)(a) via RA 4917 BIR Tax-Qualified
                     Plan. Age ≥ 50, service ≥ 10 years, employer holds Certificate of
                     Qualification.".to_string(),
            bir_plan_required_for_exemption: false,
            re_employment_caveat_applies: false,
        };
    } else {
        return TaxTreatmentResult {
            is_tax_exempt: false,
            exemption_track: TaxExemptionTrack::None,
            reason: "Taxable: employer has no BIR Tax-Qualified Plan. Track B requires age ≥ 50,
                     service ≥ 10 years, AND a BIR Certificate of Qualification (RA 4917).".to_string(),
            bir_plan_required_for_exemption: true,
            re_employment_caveat_applies: false,
        };
    }
}

// No track available
TaxTreatmentResult {
    is_tax_exempt: false,
    exemption_track: TaxExemptionTrack::None,
    reason: format!(
        "Taxable: employee is {} years old with {} credited years. \
         Track A requires age ≥ 60 and service ≥ 5 years. \
         Track B requires age ≥ 50 and service ≥ 10 years and a BIR-approved plan.",
        age_at_retirement, credited_years
    ),
    bir_plan_required_for_exemption: age_at_retirement >= 50 && credited_years >= 10,
    re_employment_caveat_applies: false,
}
```

### Output Type

```rust
pub struct TaxTreatmentResult {
    pub is_tax_exempt: bool,
    pub exemption_track: TaxExemptionTrack,
    pub reason: String,
    pub bir_plan_required_for_exemption: bool,
    pub re_employment_caveat_applies: bool,
}

pub enum TaxExemptionTrack {
    LaborCodeMandatory,  // Track A — RA 7641 / Labor Code Art. 302
    BirApprovedPlan,     // Track B — RA 4917
    None,                // Taxable
}
```

---

## Step 8: Separation Pay Computation + Interaction

**Purpose:** If authorized cause termination applies, compute separation pay and determine
payment scenario (dual entitlement, crediting, or retirement only).

**Inputs:**
- `authorized_cause: Option<AuthorizedCause>`
- `has_crediting_clause: bool`
- `monthly_basic_salary_centavos: i64`
- `salary_divisor: u8`
- `credited_years: u32` (from Step 3)
- `age_at_retirement: u8` (from Step 2)
- `retirement_pay_centavos: i64` (from Step 5)

**Outputs:** `SeparationPayResult`

### Algorithm

```rust
// If no authorized cause, return RetirementOnly scenario
let Some(cause) = authorized_cause else {
    return SeparationPayResult {
        authorized_cause: None,
        separation_pay_centavos: 0,
        separation_pay_daily_rate_centavos: daily_rate_centavos, // same as Step 4
        credited_years,
        payment_scenario: PaymentScenario::RetirementOnly,
        dual_entitlement_note: None,
        crediting_clause_applied: false,
    };
};

// Separation pay daily rate = monthly / salary_divisor (same as retirement pay daily rate)
let sep_daily_rate = monthly_basic_salary_centavos / salary_divisor as i64;

// 1-month minimum = 26 days × daily rate
let one_month_minimum_centavos = sep_daily_rate * 26;

// Separation pay formula by cause
let raw_sep_pay = match cause {
    AuthorizedCause::LaborSavingDevices | AuthorizedCause::Redundancy => {
        // 1 month per year (30 days)
        sep_daily_rate * 30 * credited_years as i64
    }
    AuthorizedCause::Retrenchment
    | AuthorizedCause::ClosureNotDueToLosses
    | AuthorizedCause::Disease => {
        // 1/2 month per year (15 days)
        sep_daily_rate * 15 * credited_years as i64
    }
    AuthorizedCause::ClosureDueToLosses => {
        // Not legally required — employer may pay voluntarily but no obligation
        0i64
    }
};

// Apply 1-month minimum floor (unless ClosureDueToLosses)
let separation_pay_centavos = if cause == AuthorizedCause::ClosureDueToLosses {
    0i64
} else {
    raw_sep_pay.max(one_month_minimum_centavos)
};

// Retirement-eligible = age >= 60 AND credited_years >= 5
let retirement_eligible = age_at_retirement >= 60 && credited_years >= 5;

// Determine payment scenario
let payment_scenario = if !retirement_eligible {
    PaymentScenario::SeparationOnly { separation_pay_centavos }
} else if cause == AuthorizedCause::ClosureDueToLosses {
    // Closure due to losses: no separation pay obligation; retirement pay still due
    PaymentScenario::RetirementOnly
} else if !has_crediting_clause {
    // Default: dual entitlement (Aquino v. NLRC, Goodyear v. Angus)
    PaymentScenario::DualEntitlement {
        retirement_pay_centavos,
        separation_pay_centavos,
        total_centavos: retirement_pay_centavos + separation_pay_centavos,
    }
} else {
    // Crediting clause applies: pay the higher
    if retirement_pay_centavos >= separation_pay_centavos {
        PaymentScenario::CreditedRetirementHigher {
            total_due_centavos: retirement_pay_centavos,
            sep_pay_offset_centavos: separation_pay_centavos,
            additional_retirement_due_centavos: retirement_pay_centavos - separation_pay_centavos,
        }
    } else {
        // Separation pay > retirement pay; still must pay at least RA 7641 minimum
        // In practice, separation pay satisfies (exceeds) the RA 7641 floor
        PaymentScenario::CreditedSeparationHigher {
            total_due_centavos: separation_pay_centavos,
        }
    }
};

let dual_entitlement_note = if matches!(payment_scenario, PaymentScenario::DualEntitlement { .. }) {
    Some("Under Aquino v. NLRC (G.R. No. 87653, Feb. 11, 1992) and Goodyear Philippines \
          v. Angus (G.R. No. 185449, Nov. 12, 2014), both retirement pay and separation pay \
          may be awarded when the employee independently qualifies for each benefit.".to_string())
} else {
    None
};
```

### Output Type

```rust
pub struct SeparationPayResult {
    pub authorized_cause: Option<AuthorizedCause>,
    pub separation_pay_centavos: i64,
    pub separation_pay_daily_rate_centavos: i64,
    pub credited_years: u32,
    pub payment_scenario: PaymentScenario,
    pub dual_entitlement_note: Option<String>,
    pub crediting_clause_applied: bool,
}

pub enum PaymentScenario {
    RetirementOnly,
    SeparationOnly { separation_pay_centavos: i64 },
    DualEntitlement {
        retirement_pay_centavos: i64,
        separation_pay_centavos: i64,
        total_centavos: i64,
    },
    CreditedRetirementHigher {
        total_due_centavos: i64,
        sep_pay_offset_centavos: i64,
        additional_retirement_due_centavos: i64,
    },
    CreditedSeparationHigher {
        total_due_centavos: i64,
    },
    NeitherEligible,
}
```

---

## Step 9: Output Assembly

**Purpose:** Combine all step outputs into the final `RetirementOutput`.

**Inputs:** Outputs from Steps 2–8.

**Outputs:** `RetirementOutput`

### Assembly

```rust
pub struct RetirementOutput {
    // Step 2
    pub eligibility: EligibilityResult,

    // Step 3
    pub credited_years: CreditedYearsResult,

    // Step 4
    pub daily_rate: DailyRateResult,

    // Step 5
    pub retirement_pay: RetirementPayResult,

    // Step 6
    pub company_plan: CompanyPlanResult,  // NotApplicable if no company plan

    // Step 7
    pub tax_treatment: TaxTreatmentResult,

    // Step 8
    pub separation_pay: SeparationPayResult,

    // Derived summary fields (computed in assembly)
    pub total_obligation_centavos: i64,   // see below
    pub is_eligible: bool,                // true if eligibility.status is Eligible or EligibleWithWarning
}
```

### `total_obligation_centavos` Computation

```rust
// The authoritative amount owed by the employer, accounting for company plan and separation pay
let base_retirement = match &company_plan {
    CompanyPlanResult::NotApplicable => retirement_pay.retirement_pay_centavos,
    CompanyPlanResult::Computed { retirement_pay_owed_centavos, .. } => *retirement_pay_owed_centavos,
};

let total_obligation_centavos = match &separation_pay.payment_scenario {
    PaymentScenario::RetirementOnly => base_retirement,
    PaymentScenario::SeparationOnly { separation_pay_centavos } => *separation_pay_centavos,
    PaymentScenario::DualEntitlement { total_centavos, .. } => *total_centavos,
    PaymentScenario::CreditedRetirementHigher { total_due_centavos, .. } => *total_due_centavos,
    PaymentScenario::CreditedSeparationHigher { total_due_centavos } => *total_due_centavos,
    PaymentScenario::NeitherEligible => 0,
};
```

---

## Error Handling Summary

| Error Condition | Pipeline Behavior | Output |
|----------------|-------------------|--------|
| Step 1: Validation failure | Halt. Return `ComputeError`. | `{ "error": "...", "code": "validation_failed", "fields": [...] }` |
| Step 2: Ineligible (age/service) | Continue. Mark eligibility.status = Ineligible. | Full output with ineligible flag |
| Step 2: Employer exempt (size) | Continue. Mark EligibleWithWarning. | Full output with warning |
| Step 3–8: No failures expected | Steps 3–8 are pure functions on validated inputs. | Full output |

---

## Concurrency + Statefulness

The pipeline is **pure and stateless**:
- No global mutable state
- Each call to `compute_single(input)` is independent
- Thread-safe: multiple WASM calls may run concurrently (though the WASM target is typically single-threaded in browser)

---

## Batch Mode Pipeline

For batch mode (`compute_batch(batch_input)`), the pipeline runs the single-employee pipeline
for each row independently. See `batch-engine.md` for the batch orchestration layer.

The single-employee pipeline is:
```rust
fn compute_single(input: RetirementInput) -> Result<RetirementOutput, ComputeError>
```

Batch:
```rust
fn compute_batch(batch: BatchInput) -> BatchOutput {
    let results: Vec<BatchRowResult> = batch.employees
        .into_iter()
        .map(|emp| BatchRowResult {
            employee_id: emp.employee_id.clone(),
            result: compute_single(emp.into()),
        })
        .collect();
    aggregate(results)
}
```

---

## Pipeline Invocation Entry Points

### Single Employee (exposed via WASM)

```rust
#[wasm_bindgen]
pub fn compute_single_json(input_json: &str) -> String {
    let result: Result<RetirementOutput, ComputeError> = (|| {
        let input: RetirementInput = serde_json::from_str(input_json)
            .map_err(|e| ComputeError::ParseError(e.to_string()))?;
        compute_single(input)
    })();
    serde_json::to_string(&result).expect("output serialization is infallible")
}
```

### Batch (exposed via WASM)

```rust
#[wasm_bindgen]
pub fn compute_batch_json(input_json: &str) -> String {
    let result: Result<BatchOutput, ComputeError> = (|| {
        let input: BatchInput = serde_json::from_str(input_json)
            .map_err(|e| ComputeError::ParseError(e.to_string()))?;
        Ok(compute_batch(input))
    })();
    serde_json::to_string(&result).expect("output serialization is infallible")
}
```

### NLRC Worksheet Generation (exposed via WASM)

```rust
#[wasm_bindgen]
pub fn generate_nlrc_json(input_json: &str) -> String {
    let result: Result<NlrcWorksheet, ComputeError> = (|| {
        let input: RetirementInput = serde_json::from_str(input_json)
            .map_err(|e| ComputeError::ParseError(e.to_string()))?;
        let output = compute_single(input.clone())?;
        Ok(generate_nlrc_worksheet(input, output))
    })();
    serde_json::to_string(&result).expect("output serialization is infallible")
}
```

---

## Arithmetic Invariants

These invariants MUST hold for any valid output:

1. `retirement_pay_centavos = monthly_salary * 45 * credited_years / 52` (for divisor=26)
2. `employer_error_amount_centavos = monthly_salary * 15 * credited_years / 26` (for divisor=26)
3. `underpayment_centavos = retirement_pay_centavos - employer_error_amount_centavos`
4. `underpayment_centavos > 0` when `retirement_pay_centavos > 0`
5. `retirement_pay_centavos >= 0` always
6. `separation_pay_centavos >= one_month_minimum` when authorized cause is not ClosureDueToLosses and not 0
7. `total_obligation_centavos >= retirement_pay_centavos` when eligible (employer owes at least statutory)
8. In `DualEntitlement`: `total_centavos = retirement_pay_centavos + separation_pay_centavos`
9. `credited_years >= 5` whenever `eligibility.is_eligible = true` (service gate ensures 60 months minimum, which rounds to ≥ 5 credited years)
10. No intermediate `f64` values in monetary computations (Steps 1–8 inclusive)

---

## Summary

The 9-step pipeline is ordered, pure, and short-circuit-safe. Steps proceed unconditionally
unless input validation (Step 1) fails. Ineligibility (Step 2) is communicated in output but
does not halt computation — all amounts are computed for reference. Monetary arithmetic uses
exact integer centavos throughout with `i64`. The pipeline entry point is `compute_single()`,
called by `compute_single_json()` for WASM, or looped by `compute_batch()` for batch mode.
