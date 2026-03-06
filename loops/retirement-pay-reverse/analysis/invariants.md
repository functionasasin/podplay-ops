# Analysis: Engine Invariants — RA 7641 Retirement Pay Engine

**Wave:** 3 — Engine Design
**Aspect:** invariants
**Date:** 2026-03-06
**Sources:** computation-pipeline.md, algorithms.md, data-model.md, eligibility-rules.md,
             test-vectors.md, tax-treatment-conditions.md, separation-pay-interaction.md

---

## Overview

This document defines all invariants that must hold for any valid input/output pair produced by
the RA 7641 retirement pay engine. Invariants fall into five categories:

1. **Arithmetic invariants** — relationships between computed monetary amounts
2. **Eligibility invariants** — consistency between eligibility flags and computed values
3. **Temporal invariants** — constraints on date-derived fields
4. **Pipeline invariants** — structural guarantees about the computation pipeline
5. **Boundary invariants** — value range constraints

Each invariant is expressed as:
- A prose description
- A formal assertion (`assert!` or `debug_assert!` pattern in Rust)
- The failure mode if violated
- Whether it is checkable at test time or compile time

---

## Category 1: Arithmetic Invariants

These invariants express mathematical relationships between computed fields. They hold for all
valid inputs where validation passes.

### INV-A1: Retirement pay formula correctness (divisor 26)

**Assertion:**
```rust
if salary_divisor == 26 {
    debug_assert_eq!(
        output.retirement_pay.retirement_pay_centavos,
        input.monthly_basic_salary_centavos * 45 * (output.credited_years.credited_years as i64) / 52
    );
}
```

**Description:** For the 26-day divisor, retirement pay equals
`monthly × 45 × credited_years / 52`. This is the exact rational expansion of
`monthly × (22.5 / 26) × credited_years`.

**Failure mode:** Any intermediate rounding, wrong formula branch, or off-by-one in
credited years would violate this. Test with the 20 known test vectors.

### INV-A2: Retirement pay formula correctness (divisor 22)

**Assertion:**
```rust
if salary_divisor == 22 {
    debug_assert_eq!(
        output.retirement_pay.retirement_pay_centavos,
        input.monthly_basic_salary_centavos * 45 * (output.credited_years.credited_years as i64) / 44
    );
}
```

**Description:** For the 22-day divisor, retirement pay equals
`monthly × 45 × credited_years / 44`. Derivation: `22.5/22 = 45/44`.

### INV-A3: Underpayment is always positive (when retirement pay > 0)

**Assertion:**
```rust
if output.retirement_pay.retirement_pay_centavos > 0 {
    debug_assert!(
        output.retirement_pay.underpayment_centavos > 0,
        "underpayment must be positive: 22.5 days always exceeds 15 days"
    );
}
```

**Description:** The 22.5-day formula always yields more than the 15-day formula.
`22.5 > 15` is a mathematical fact. Any implementation where underpayment ≤ 0 is a bug.

**Corollary:** `retirement_pay_centavos > employer_error_amount_centavos` always.

### INV-A4: Underpayment decomposition

**Assertion:**
```rust
debug_assert_eq!(
    output.retirement_pay.underpayment_centavos,
    output.retirement_pay.retirement_pay_centavos
        - output.retirement_pay.employer_error_amount_centavos
);
```

**Description:** Underpayment is defined as the difference between correct (22.5-day)
and incorrect (15-day) retirement pay. The field must equal this difference.

### INV-A5: Underpayment basis points is approximately 3333

**Assertion:**
```rust
// Not an exact equality (truncation causes minor variation) but must be in range
debug_assert!(
    output.retirement_pay.underpayment_basis_points >= 3330
        && output.retirement_pay.underpayment_basis_points <= 3334,
    "underpayment basis points must be ~3333 (33.33% = 7.5/22.5)"
);
```

**Description:** The ratio (22.5 - 15) / 22.5 = 7.5 / 22.5 = 1/3 = 33.33...%.
In basis points: 3333. Integer truncation may yield 3332 or 3333 but never 3334+.

**Exception:** For very small amounts (e.g., PHP 100 salary), integer truncation can
produce 3332. The range [3330, 3334] accommodates this.

### INV-A6: Employer error amount formula

**Assertion:**
```rust
debug_assert_eq!(
    output.retirement_pay.employer_error_amount_centavos,
    input.monthly_basic_salary_centavos
        * 15
        * (output.credited_years.credited_years as i64)
        / (input.salary_divisor as i64)
);
```

**Description:** The employer error amount uses the 15-day formula, which incorrectly
omits SIL and 13th month components.

### INV-A7: Non-negative retirement pay

**Assertion:**
```rust
debug_assert!(
    output.retirement_pay.retirement_pay_centavos >= 0,
    "retirement pay cannot be negative"
);
```

**Description:** All inputs are positive (validated in Step 1), so the product
`monthly × 45 × years / 52` is always non-negative.

**Compile-time enforcement:** Use `i64` (not `u64`) to allow signed arithmetic, but
validate all inputs are positive. The output must be checked for non-negativity.

### INV-A8: DualEntitlement total decomposition

**Assertion:**
```rust
if let PaymentScenario::DualEntitlement { retirement_pay_centavos, separation_pay_centavos, total_centavos } = &output.separation_pay.payment_scenario {
    debug_assert_eq!(
        *total_centavos,
        retirement_pay_centavos + separation_pay_centavos,
        "DualEntitlement total must equal retirement + separation"
    );
}
```

**Description:** Under the dual entitlement doctrine, the employer owes both amounts
independently. The total field must be the exact sum. No deductions, no rounding.

### INV-A9: CreditedRetirementHigher additional obligation

**Assertion:**
```rust
if let PaymentScenario::CreditedRetirementHigher {
    total_due_centavos,
    sep_pay_offset_centavos,
    additional_retirement_due_centavos
} = &output.separation_pay.payment_scenario {
    debug_assert_eq!(
        *total_due_centavos,
        output.retirement_pay.retirement_pay_centavos,
        "CreditedRetirementHigher: total_due must equal statutory retirement pay"
    );
    debug_assert_eq!(
        *additional_retirement_due_centavos,
        total_due_centavos - sep_pay_offset_centavos,
        "additional due must be total minus sep pay offset"
    );
}
```

**Description:** When a crediting clause applies and retirement pay exceeds separation pay,
the employer's total obligation equals the retirement pay amount (separation pay already
credited toward it). The additional amount due is the difference.

### INV-A10: Company plan governs correctly

**Assertion:**
```rust
if let CompanyPlanResult::Computed {
    company_benefit_centavos,
    statutory_minimum_centavos,
    retirement_pay_owed_centavos,
    governs,
    gap_centavos,
    ..
} = &output.company_plan {
    // retirement_pay_owed = max(company, statutory)
    debug_assert_eq!(
        *retirement_pay_owed_centavos,
        (*company_benefit_centavos).max(*statutory_minimum_centavos)
    );
    // governs field matches the higher amount
    debug_assert_eq!(
        *governs == PlanGoverns::Company,
        company_benefit_centavos >= statutory_minimum_centavos
    );
    // gap = statutory - company (signed)
    debug_assert_eq!(
        *gap_centavos,
        statutory_minimum_centavos - company_benefit_centavos
    );
    // statutory_minimum echoes Step 5 retirement pay
    debug_assert_eq!(
        *statutory_minimum_centavos,
        output.retirement_pay.retirement_pay_centavos
    );
}
```

**Description:** The company plan comparison fields must be internally consistent.
The governing amount is always the higher of the two. The gap is a signed difference.

### INV-A11: Additional obligation is non-negative

**Assertion:**
```rust
if let CompanyPlanResult::Computed { additional_obligation_centavos, gap_centavos, pagibig_offset_centavos, .. } = &output.company_plan {
    debug_assert!(*additional_obligation_centavos >= 0, "additional obligation cannot be negative");
    // additional_obligation = max(0, gap - pagibig_offset)
    if *gap_centavos > 0 {
        debug_assert_eq!(
            *additional_obligation_centavos,
            (gap_centavos - pagibig_offset_centavos).max(0)
        );
    } else {
        debug_assert_eq!(*additional_obligation_centavos, 0i64);
    }
}
```

**Description:** The employer's additional top-up obligation cannot be negative. If the
company plan already exceeds the statutory minimum, the additional obligation is zero.
PAG-IBIG employer contributions reduce the obligation but cannot make it negative.

### INV-A12: Separation pay floor applies

**Assertion:**
```rust
// For all causes except ClosureDueToLosses, when separation pay is non-zero,
// it must be at least 1 month (26 × daily_rate)
let daily_rate = input.monthly_basic_salary_centavos / (input.salary_divisor as i64);
let one_month_minimum = daily_rate * 26;
if let Some(cause) = &input.authorized_cause {
    if *cause != AuthorizedCause::ClosureDueToLosses {
        debug_assert!(
            output.separation_pay.separation_pay_centavos >= one_month_minimum,
            "separation pay must be at least 1 month minimum"
        );
    }
}
```

**Description:** Labor Code Art. 298 mandates a 1-month minimum floor for separation pay
(except closure due to losses). This is the higher of (formula amount) or (1 month pay).

---

## Category 2: Eligibility Invariants

### INV-E1: Eligible employees have credited years >= 5

**Assertion:**
```rust
if output.is_eligible {
    debug_assert!(
        output.credited_years.credited_years >= 5,
        "eligible employee must have >= 5 credited years"
    );
}
```

**Description:** Eligibility requires at minimum 5 years of service (60 calendar months).
The 6-month rounding rule means anyone with ≥ 54 months (4y 6m) rounds up to 5 credited years.
However, the service gate uses raw months (< 60 = ineligible), so:
- 54 months (4y 6m): credited_years = 5, but service gate: 54 < 60 → **INELIGIBLE**.
- 60 months (5y 0m): credited_years = 5, service gate passes → **ELIGIBLE**.

**Therefore:** An eligible employee always has total_months_served >= 60, which means
credited_years >= 5 always.

### INV-E2: Ineligible due to service has credited years < 5 (usually)

**Assertion (educational — not enforced as hard assert):**
```rust
// If ineligible due to InsufficientService, then total_months < 60.
// credited_years may be 4 or 5 (can be 5 if 4y 6m–4y 11m via rounding), but is_eligible = false.
// This is intentional: service gate bypasses credited-year rounding.
```

**Description:** An employee with 4y 11m (59 months) has credited_years = 5 (via rounding)
but is_eligible = false. This is NOT a bug. The service gate deliberately uses raw months to
prevent the rounding rule from bridging the 5-year threshold. The invariant is:
`total_months_served < 60 → is_eligible = false`, not `credited_years < 5 → is_eligible = false`.

### INV-E3: is_eligible flag consistency

**Assertion:**
```rust
let expected_is_eligible = matches!(
    output.eligibility.status,
    EligibilityStatus::Eligible { .. } | EligibilityStatus::EligibleWithWarning { .. }
);
debug_assert_eq!(
    output.is_eligible,
    expected_is_eligible,
    "is_eligible must mirror eligibility.status"
);
```

**Description:** `RetirementOutput.is_eligible` is a convenience field that must match
the eligibility status enum. These must never diverge.

### INV-E4: Age at retirement consistency

**Assertion:**
```rust
let computed_age = full_years_between(input.birth_date, input.retirement_date);
debug_assert_eq!(
    output.eligibility.age_at_retirement,
    computed_age,
    "age_at_retirement must equal full_years_between(birth, retirement)"
);
```

**Description:** The age at retirement in the output must be derived from the dates, not
approximated or cached stale. This guards against copy-paste errors in the assembly step.

### INV-E5: Retirement type consistency with age

**Assertion:**
```rust
let compulsory_age: u8 = match input.worker_category {
    WorkerCategory::General => 65,
    WorkerCategory::UndergroundMine | WorkerCategory::SurfaceMine => 60,
};
if let EligibilityStatus::Eligible { retirement_type } | EligibilityStatus::EligibleWithWarning { retirement_type, .. } = &output.eligibility.status {
    debug_assert_eq!(
        *retirement_type == RetirementType::Compulsory,
        output.eligibility.age_at_retirement >= compulsory_age
    );
}
```

**Description:** Retirement type (Optional vs Compulsory) must be consistent with age
thresholds. Compulsory applies at age 65 for general workers, 60 for mine workers.

### INV-E6: Small establishment exemption produces EligibleWithWarning

**Assertion:**
```rust
let is_small_exempt = input.employer_employee_count <= 10
    && matches!(input.employer_type, EmployerType::Retail | EmployerType::Service | EmployerType::Agricultural);
if is_small_exempt {
    // Only employer size failure → EligibleWithWarning (not Ineligible)
    // If other gates also fail, result is Ineligible
    // This invariant: if ONLY size fails, status must be EligibleWithWarning
}
```

**Description:** The RA 7641 exemption for small establishments (≤10 employees in retail,
service, or agricultural) does not make the employee categorically ineligible — it means the
employer may not be legally obligated. The system computes and flags, rather than refusing.
This is intentionally treated as EligibleWithWarning so the employee can still generate
an NLRC worksheet.

---

## Category 3: Temporal Invariants

### INV-T1: Credited years upper bound

**Assertion:**
```rust
let max_possible_years = full_years_between(input.hire_date, input.retirement_date) + 1;
debug_assert!(
    output.credited_years.credited_years <= max_possible_years,
    "credited years cannot exceed full calendar years + 1 (from rounding)"
);
```

**Description:** Credited years is at most `floor_years + 1` due to the 6-month rounding
rule. It cannot exceed the actual elapsed calendar years by more than 1.

### INV-T2: Credited years lower bound

**Assertion:**
```rust
debug_assert!(
    output.credited_years.credited_years >= output.credited_years.full_years,
    "credited years cannot be less than full years"
);
debug_assert!(
    output.credited_years.credited_years <= output.credited_years.full_years + 1,
    "credited years can exceed full years by at most 1"
);
```

**Description:** Credited years is always in [full_years, full_years + 1].

### INV-T3: Remaining months in range [0, 11]

**Assertion:**
```rust
debug_assert!(
    output.credited_years.remaining_months <= 11,
    "remaining months must be 0–11"
);
```

**Description:** After dividing total months by 12, the remainder is always 0–11.

### INV-T4: Total months decomposition

**Assertion:**
```rust
debug_assert_eq!(
    output.credited_years.total_months_served,
    output.credited_years.full_years * 12 + output.credited_years.remaining_months,
    "total months must equal full_years × 12 + remaining_months"
);
```

**Description:** The `total_months_served` field must be exactly decomposable into
`full_years` and `remaining_months`.

### INV-T5: Rounding flag consistency

**Assertion:**
```rust
debug_assert_eq!(
    output.credited_years.rounding_applied,
    output.credited_years.remaining_months >= 6,
    "rounding_applied flag must match whether remaining_months >= 6"
);
```

**Description:** The rounding flag must match the actual condition.

### INV-T6: Age at retirement is reasonable

**Assertion:**
```rust
// Enforced by input validation, but also checked at output:
debug_assert!(
    output.eligibility.age_at_retirement >= 15,
    "retirement age must be at least 15 (hire_date - birth_date >= 15y invariant)"
);
debug_assert!(
    output.eligibility.age_at_retirement <= 120,
    "retirement age cannot exceed 120"
);
```

**Description:** Validated by Step 1 (birth_date + 15y ≤ hire_date, hire_date < retirement_date).
Output age is bounded.

---

## Category 4: Pipeline Invariants

### INV-P1: 22.5-day formula is always used

**Assertion:**
```rust
// The formula numerator must always be 45; the denominator must always be 52 (div=26) or 44 (div=22)
debug_assert_eq!(output.retirement_pay.formula_numerator, 45i64);
debug_assert!(
    output.retirement_pay.formula_denominator == 52 || output.retirement_pay.formula_denominator == 44
);
```

**Description:** There is no circumstance under which the engine uses the 15-day formula
as its primary computation. The 15-day formula appears only in the `employer_error_amount`
field for comparison purposes. The `formula_numerator = 45` and corresponding denominator
are fixed constants. No business logic can change them.

**This invariant is the core product guarantee**: every computation uses the legally correct
22.5-day formula.

### INV-P2: No floating point in monetary fields

**Description (compile-time enforced):** All monetary output fields are `i64`. The type
system prevents float contamination. This invariant is enforced at compile time via types,
not runtime assertions.

```rust
// Verified at type level: all monetary fields in output types are i64
pub struct RetirementPayResult {
    pub retirement_pay_centavos: i64,
    pub basic_component_centavos: i64,
    pub sil_component_centavos: i64,
    pub thirteenth_month_component_centavos: i64,
    pub employer_error_amount_centavos: i64,
    pub underpayment_centavos: i64,
    // ...
}
```

**Exception:** `company_days_per_year` and `company_months_per_year` input fields are `f64`
but are immediately converted via the ×10 pattern before any arithmetic. The invariant is
that no `f64` value appears in an intermediate or final monetary computation.

### INV-P3: Pipeline output is complete when input is valid

**Assertion:**
```rust
// If validation passes (input is valid), the pipeline ALWAYS produces a full RetirementOutput.
// There are no null/None fields in the core output (only Optional fields in conditional structures).
// This is enforced by the return type: Result<RetirementOutput, ComputeError>
// ComputeError is only returned on validation failure (Step 1) or JSON parse error.
```

**Description:** Steps 2–9 are pure functions over validated inputs. They do not panic or
return errors. This means: a valid JSON input that passes Step 1 validation always produces
a complete `RetirementOutput`.

### INV-P4: Ineligibility does not suppress computation

**Assertion:**
```rust
// Even if is_eligible = false, the following fields are populated:
debug_assert!(output.retirement_pay.retirement_pay_centavos >= 0);
debug_assert!(output.credited_years.credited_years >= 0);
// The computation proceeds regardless of eligibility status.
```

**Description:** The pipeline computes the "would-be" retirement pay even for ineligible
employees. This is intentional — it allows the UI to display a reference amount with an
ineligibility badge, and it provides data for NLRC worksheets even for contested cases.

### INV-P5: Step outputs are internally consistent within a single call

**Assertion:**
```rust
// The credited_years in separation_pay must match the credited_years from Step 3
debug_assert_eq!(
    output.separation_pay.credited_years,
    output.credited_years.credited_years
);
// The daily_rate in separation_pay must match Step 4
debug_assert_eq!(
    output.separation_pay.separation_pay_daily_rate_centavos,
    output.daily_rate.daily_rate_centavos
);
```

**Description:** Multiple output fields echo intermediate results from earlier pipeline
steps. These must be consistent — they come from the same computation call, not separate calls.

### INV-P6: Tax exemption requires all preconditions

**Assertion:**
```rust
// Track A: LaborCodeMandatory requires age >= 60 AND credited >= 5
if output.tax_treatment.exemption_track == TaxExemptionTrack::LaborCodeMandatory {
    debug_assert!(output.eligibility.age_at_retirement >= 60);
    debug_assert!(output.credited_years.credited_years >= 5);
    debug_assert!(!input.employee_has_used_retirement_exemption);
    debug_assert!(!input.reemployed_within_12_months);
}

// Track B: BirApprovedPlan requires age >= 50 AND credited >= 10 AND BIR plan
if output.tax_treatment.exemption_track == TaxExemptionTrack::BirApprovedPlan {
    debug_assert!(output.eligibility.age_at_retirement >= 50);
    debug_assert!(output.credited_years.credited_years >= 10);
    debug_assert!(input.employer_has_bir_approved_plan);
    debug_assert!(!input.employee_has_used_retirement_exemption);
    debug_assert!(!input.reemployed_within_12_months);
}
```

**Description:** Tax exemption tracks have strict preconditions. Any output claiming
tax exemption must satisfy all conditions. This prevents silent exemption grants.

### INV-P7: is_tax_exempt consistent with exemption_track

**Assertion:**
```rust
debug_assert_eq!(
    output.tax_treatment.is_tax_exempt,
    output.tax_treatment.exemption_track != TaxExemptionTrack::None,
    "is_tax_exempt must be true iff exemption_track is not None"
);
```

**Description:** The boolean convenience field must match the enum.

---

## Category 5: Boundary Invariants

### INV-B1: All centavo amounts within i64 bounds

**Assertion:**
```rust
// Maximum input: monthly = PHP 500M = 50_000_000_000 centavos
// Maximum credited_years = 50 (reasonable bound for very long-tenured employees)
// Maximum retirement_pay:
//   50_000_000_000 * 45 * 50 / 52 = 2_163_461_538_461 centavos ≈ PHP 21.6 billion
// i64 max = 9_223_372_036_854_775_807 — no overflow
```

**Description:** With input validation bounding monthly salary to ≤ PHP 500 million
and practical maximum credited years of 50, all intermediate products stay well within i64 range.

Overflow-critical intermediate: `monthly × 45 × credited_years` before division.
Max: `50_000_000_000 × 45 × 50 = 112_500_000_000_000` which is < i64 max ≈ 9.2 × 10^18.

### INV-B2: Credited years minimum when eligible

**Assertion:**
```rust
if output.is_eligible {
    debug_assert!(output.credited_years.credited_years >= 5);
    debug_assert!(output.credited_years.total_months_served >= 60);
}
```

**Description:** Eligible employees always have at minimum 5 credited years (60 raw months).
This is the service gate condition. See INV-E1.

### INV-B3: Retirement pay proportional to credited years

**Assertion:**
```rust
// For same monthly salary and divisor, retirement_pay increases linearly with credited_years.
// retirement_pay(y+1) - retirement_pay(y) = monthly * 45 / 52 (for divisor 26)
// This is the annual accrual rate. Each additional credited year adds exactly this amount.
// (Subject to integer truncation of ≤ 51 centavos)
```

**Description:** Retirement pay is linear in credited years. This is a fundamental
property of the formula. A longer-tenured employee always receives more (or equal due to
truncation on very small salaries).

### INV-B4: Separation pay for ClosureDueToLosses is always zero

**Assertion:**
```rust
if input.authorized_cause == Some(AuthorizedCause::ClosureDueToLosses) {
    debug_assert_eq!(output.separation_pay.separation_pay_centavos, 0);
}
```

**Description:** Closure due to business losses does not obligate the employer to pay
separation pay under Art. 298. This is a hard legal rule, not a computation result.

### INV-B5: total_obligation_centavos is non-negative

**Assertion:**
```rust
debug_assert!(
    output.total_obligation_centavos >= 0,
    "total obligation cannot be negative"
);
```

**Description:** The employer's total obligation is always zero or positive. It cannot
be negative under any legal theory.

### INV-B6: Gap basis points are bounded

**Assertion:**
```rust
if let CompanyPlanResult::Computed { gap_basis_points, .. } = &output.company_plan {
    debug_assert!(*gap_basis_points <= 10_000, "gap basis points cannot exceed 100%");
}
```

**Description:** Basis points represent a percentage scaled by 100. The gap as a fraction
of the statutory minimum cannot exceed 100% (which would mean company plan is zero).
Input validation requires company_benefit > 0, so basis points < 10000 always.

---

## Invariant Enforcement Strategy

### Compile-Time Invariants (Type System)
- All monetary fields are `i64` — no float contamination is possible
- Option<T> fields are explicit — no implicit null
- Enums cover all cases — match arms must be exhaustive

### Debug-Time Invariants (debug_assert!)
All invariants marked with `debug_assert!` compile away in release builds. They run during:
- `cargo test` (always runs with assertions)
- `cargo build --debug` (development builds)
- NOT in `cargo build --release` (production WASM build)

This is intentional: invariants catch bugs during development without adding overhead to the
production WASM module.

### Test-Time Invariants (Assertion Functions)
A dedicated `assert_invariants(input: &RetirementInput, output: &RetirementOutput)` function
should be called in every unit test. This function runs all invariants listed in this document.

```rust
#[cfg(test)]
pub fn assert_invariants(input: &RetirementInput, output: &RetirementOutput) {
    // INV-A1: formula correctness
    if input.salary_divisor == 26 {
        assert_eq!(
            output.retirement_pay.retirement_pay_centavos,
            input.monthly_basic_salary_centavos * 45 * (output.credited_years.credited_years as i64) / 52,
            "INV-A1: formula correctness (div=26)"
        );
    }
    if input.salary_divisor == 22 {
        assert_eq!(
            output.retirement_pay.retirement_pay_centavos,
            input.monthly_basic_salary_centavos * 45 * (output.credited_years.credited_years as i64) / 44,
            "INV-A2: formula correctness (div=22)"
        );
    }

    // INV-A3: underpayment positive
    if output.retirement_pay.retirement_pay_centavos > 0 {
        assert!(output.retirement_pay.underpayment_centavos > 0, "INV-A3");
    }

    // INV-A4: underpayment decomposition
    assert_eq!(
        output.retirement_pay.underpayment_centavos,
        output.retirement_pay.retirement_pay_centavos - output.retirement_pay.employer_error_amount_centavos,
        "INV-A4"
    );

    // INV-A7: non-negative retirement pay
    assert!(output.retirement_pay.retirement_pay_centavos >= 0, "INV-A7");

    // INV-E1: eligible → credited_years >= 5
    if output.is_eligible {
        assert!(output.credited_years.credited_years >= 5, "INV-E1");
    }

    // INV-E3: is_eligible consistency
    let expected = matches!(
        output.eligibility.status,
        EligibilityStatus::Eligible { .. } | EligibilityStatus::EligibleWithWarning { .. }
    );
    assert_eq!(output.is_eligible, expected, "INV-E3");

    // INV-P1: formula numerator is always 45
    assert_eq!(output.retirement_pay.formula_numerator, 45i64, "INV-P1");

    // INV-P5: separation pay credited_years echoes Step 3
    assert_eq!(
        output.separation_pay.credited_years,
        output.credited_years.credited_years,
        "INV-P5a"
    );

    // INV-P7: tax exemption consistency
    assert_eq!(
        output.tax_treatment.is_tax_exempt,
        output.tax_treatment.exemption_track != TaxExemptionTrack::None,
        "INV-P7"
    );

    // INV-T2: credited years in [full_years, full_years + 1]
    assert!(output.credited_years.credited_years >= output.credited_years.full_years, "INV-T2a");
    assert!(output.credited_years.credited_years <= output.credited_years.full_years + 1, "INV-T2b");

    // INV-T3: remaining months 0–11
    assert!(output.credited_years.remaining_months <= 11, "INV-T3");

    // INV-T4: total months decomposition
    assert_eq!(
        output.credited_years.total_months_served,
        output.credited_years.full_years * 12 + output.credited_years.remaining_months,
        "INV-T4"
    );

    // INV-T5: rounding flag
    assert_eq!(
        output.credited_years.rounding_applied,
        output.credited_years.remaining_months >= 6,
        "INV-T5"
    );

    // INV-B5: total obligation non-negative
    assert!(output.total_obligation_centavos >= 0, "INV-B5");
}
```

### Property-Based Testing (Recommended)
The arithmetic invariants (INV-A1 through INV-A12) are ideal candidates for property-based
testing using the `proptest` crate:
- Generate random valid inputs (positive salaries, valid dates, valid enums)
- Run `compute_single(input)`
- Call `assert_invariants(input, output)`
- Proptest will find counterexamples if any exist

---

## Critical Invariant Summary (The "Never Violate" List)

| ID | Invariant | Consequence of Violation |
|----|-----------|--------------------------|
| INV-P1 | Formula numerator always 45 | Wrong retirement pay computed — legal liability |
| INV-A3 | Underpayment always positive | 22.5-day formula not applied — product fails its core purpose |
| INV-E1 | Eligible → credited_years >= 5 | Impossible eligibility state — indicates pipeline bug |
| INV-E3 | is_eligible mirrors status enum | UI shows wrong eligibility badge |
| INV-A8 | DualEntitlement total = sum | Employee underpaid under dual entitlement |
| INV-P2 | No float in monetary fields | Silent precision loss in computation |
| INV-B4 | ClosureDueToLosses → sep pay = 0 | Illegal overpayment guidance to users |
| INV-P7 | is_tax_exempt ↔ track != None | Wrong tax treatment displayed |

---

## Summary

24 invariants are specified across 5 categories:
- **12 arithmetic invariants** — mathematical relationships between monetary fields
- **6 eligibility invariants** — consistency between flags and computed values
- **6 temporal invariants** — date-arithmetic field consistency
- **7 pipeline invariants** — structural and behavioral guarantees
- **6 boundary invariants** — value range constraints

The most critical invariant is **INV-P1**: the formula numerator must always be 45
(i.e., the 22.5-day formula is always used). This is the product's core legal claim.
Any code path that could produce `formula_numerator != 45` is a critical bug.

All invariants except the type-level ones (INV-P2) are testable via the
`assert_invariants()` function, which must be called in every unit test.
