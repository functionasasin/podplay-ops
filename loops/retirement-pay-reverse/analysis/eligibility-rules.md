# Analysis: Eligibility Rules — RA 7641 Retirement Pay

**Aspect:** eligibility-rules
**Wave:** 2 (Domain Rule Extraction)
**Date:** 2026-03-06
**Sources:** ra7641-full-text.md, labor-code-art302.md, deepdive-retirement-pay-ra7641.md

---

## Summary

Three independent eligibility gates must ALL pass before RA 7641 applies:
1. Age threshold (varies by worker category)
2. Minimum service period (≥ 5 years)
3. Employer size (establishment must employ > 10 workers)

If any gate fails, the employee has no RA 7641 statutory entitlement — though a company plan may still apply.

---

## Gate 1: Age Threshold

### General Private Sector (the dominant case)

| Retirement Type | Age Requirement | Who Initiates |
|---|---|---|
| Optional retirement | ≥ 60 years old | Employee at their option |
| Compulsory retirement | Exactly 65 years old | Employer may compulsorily retire |

- An employee aged 60–64 may retire voluntarily; the employer cannot force retirement until age 65.
- An employee who reaches 65 must be allowed to retire with full RA 7641 benefit.
- CBA or employment contract may set a lower optional retirement age, but statutory minimum benefit applies regardless.

### Underground Mine Workers (RA 8558, effective February 26, 1998)

| Retirement Type | Age Requirement |
|---|---|
| Optional retirement | ≥ 50 years old |
| Compulsory retirement | Age 60 |

Coverage: Employees working underground in mining operations.

### Surface Mine Workers (RA 10757, effective April 8, 2016)

| Retirement Type | Age Requirement |
|---|---|
| Optional retirement | ≥ 50 years old |
| Compulsory retirement | Age 60 |

Coverage strictly limited to: **mill plant workers, electrical, mechanical, and tailings pond personnel**.
(Note: Underground mine workers are covered by the earlier RA 8558, not RA 10757.)

### Age Computation Rule

Age is computed as of the **retirement date** (date of separation / last day of employment). A person whose 60th birthday falls on the retirement date IS eligible.

Engine input: `birth_date: NaiveDate`, `retirement_date: NaiveDate`
Engine computation: `age_at_retirement = years between birth_date and retirement_date`

---

## Gate 2: Minimum Service Period

- Employee must have served **at least five (5) years** with the **same establishment**.
- "Service" for this purpose includes:
  - Authorized absences
  - Vacation leave
  - Regular holidays and special non-working days
  - Sick leave on pay or with pay
  - Leaves covered by law (maternity, paternity, solo parent, etc.)
- The **same establishment** requirement means service with a different employer does NOT count (subject to company transfer exceptions — see edge-cases-catalog).
- Service before January 7, 1993 (RA 7641 effectivity) **counts** toward the 5-year minimum and toward credited years of service for the benefit computation.

### Minimum Service Check: Exact Rule

```
service_months = months_between(hire_date, retirement_date)
eligible_service = service_months >= 60  // 5 years = 60 months
```

If `service_months < 60`: NOT eligible under RA 7641. Output: `ineligible`, reason: `insufficient_service`.

**Edge case:** An employee with exactly 4 years 11 months and 29 days is NOT eligible. The law says "at least five (5) years" — this means full years. The 6-month rounding rule applies only to the credited years calculation for the benefit amount, NOT to the 5-year minimum eligibility threshold.

**Critical distinction:** The 6-month rounding rule (fraction ≥ 6 months = 1 year) is used ONLY to compute credited years for the benefit formula. It does NOT affect the 5-year eligibility gate. A person with 4 years 8 months fails the 5-year minimum — the rounding rule cannot promote them to "5 years" for eligibility purposes.

---

## Gate 3: Employer Size Exemption

- Retail, service, and agricultural establishments or operations employing **not more than ten (10) employees or workers** are EXEMPT from RA 7641.
- The exemption is based on the **number of employees in the establishment at the time of retirement**, not at hiring.
- If the employer grew from 8 to 15 employees during the employment period: they become covered by RA 7641 once they exceed 10 employees. Service accrued before and after the threshold counts.
- If the employer shrinks from 15 to 8 employees: they lose RA 7641 coverage. (Uncommon; creates retroactivity issues — flag for legal review.)

### Employer Category Definitions

| Category | Examples |
|---|---|
| Retail establishment | Sari-sari store, small retail shop, boutique |
| Service establishment | Small barbershop, laundry shop, repair shop |
| Agricultural operation | Small farm, fish pond, poultry operation |

Non-retail/non-service/non-agricultural employers (manufacturing, BPO, corporate) are NOT eligible for this exemption regardless of employee count.

### Engine Behavior for Exempt Establishments

When `employer_employee_count <= 10`:
- Output: `ineligible`, reason: `employer_exempt_small_establishment`
- Still compute and display the RA 7641 amount (for reference / potential NLRC claim contesting the exemption)
- Show warning: "Employer claims ≤10 employee exemption. Verify headcount independently."

---

## Complete Eligibility Decision Tree

```
INPUT: birth_date, hire_date, retirement_date, worker_category, employer_employee_count

STEP 1: Determine age thresholds by worker_category
  - "general"          → optional_age = 60, compulsory_age = 65
  - "underground_mine" → optional_age = 50, compulsory_age = 60
  - "surface_mine"     → optional_age = 50, compulsory_age = 60

STEP 2: Age check
  age_at_retirement = full_years(birth_date → retirement_date)
  IF age_at_retirement < optional_age:
    → ineligible: "below_minimum_retirement_age"
    → (unless CBA provides lower retirement age — flag for CBA plan check)
  IF age_at_retirement >= compulsory_age:
    → retirement_type = "compulsory"
  ELSE:
    → retirement_type = "optional"

STEP 3: Service check
  service_months = full_months(hire_date → retirement_date)
  IF service_months < 60:
    → ineligible: "insufficient_service" (need ≥ 60 months)

STEP 4: Employer size check
  IF employer_employee_count <= 10:
    → ineligible: "employer_exempt_small_establishment"
    → compute anyway for reference; show warning

STEP 5: All checks passed → eligible
  → proceed to credited years computation
```

---

## Eligibility Result Struct (for Engine)

```rust
pub enum EligibilityStatus {
    Eligible { retirement_type: RetirementType },
    Ineligible { reason: IneligibilityReason },
    EligibleWithWarning { retirement_type: RetirementType, warning: EligibilityWarning },
}

pub enum RetirementType {
    Optional,   // age >= optional_age, employee chose to retire
    Compulsory, // age >= compulsory_age, employer may compulsorily retire
}

pub enum IneligibilityReason {
    BelowMinimumRetirementAge { age_at_retirement: u8, minimum_age: u8 },
    InsufficientService { service_months: u32, required_months: u32 },
    EmployerExemptSmallEstablishment { reported_employee_count: u32 },
}

pub enum EligibilityWarning {
    SmallEstablishmentExemptionClaimed { reported_employee_count: u32 },
    CbaRetirementAgeMayApply,
    CompanyTransferServiceAggregationRequired,
}
```

---

## UI Behavior Per Eligibility Result

| Result | UI Behavior |
|---|---|
| `Eligible { Optional }` | Show full computation. Badge: "Eligible — Optional Retirement". |
| `Eligible { Compulsory }` | Show full computation. Badge: "Eligible — Compulsory Retirement (Age 65)". |
| `Ineligible { BelowMinimumRetirementAge }` | Show red alert: "Employee is [age] years old. Minimum retirement age is [min_age] for this worker category. RA 7641 does not apply." |
| `Ineligible { InsufficientService }` | Show red alert: "Employee has [N] months of service. RA 7641 requires at least 60 months (5 years). No statutory entitlement." |
| `Ineligible { EmployerExemptSmallEstablishment }` | Show yellow alert: "Employer reports [N] employees (≤10). RA 7641 is exempt for this establishment type. Verify independently." + show computed amount for reference. |
| `EligibleWithWarning` | Show full computation + yellow alert with warning details. |

---

## Edge Cases for Eligibility

### CBA Retirement Age

A CBA may set optional retirement at age 55 (or even younger). In that case:
- The employee retires at 55 under the CBA
- RA 7641 benefit is the **floor** — the CBA benefit must be at least equal to RA 7641 minimum
- For age eligibility in the engine: if `has_cba_plan = true` and `retirement_age_in_plan < 60`, accept the earlier age and compute RA 7641 minimum

Engine input field: `cba_retirement_age: Option<u8>` (None = no CBA, Some(55) = CBA at age 55)

### Interrupted Service (Breaks in Employment)

- If an employee was rehired after a gap, the question is whether the gap breaks continuity.
- RA 7641 IRR says "continuous or broken service counts" — but only with the **same establishment**.
- A gap followed by rehire at the same employer: both periods count toward the 5-year minimum and credited years.
- Engine behavior: if two hire/separation dates at same employer are provided, sum the total months served.

### Part-Time Employees

- Part-time employees are covered by RA 7641 (DOLE confirmed in the 1996 Labor Advisory).
- Their "daily rate" is computed from their actual pay rate.
- Engine: treat part-time status as normal — no modification to formula.

### Fixed-Term / Project-Based Employees

- If the employee has worked in a series of fixed-term contracts totaling ≥ 5 years with the same employer, they may be deemed a regular employee under Supreme Court jurisprudence (repeated renewal = regular employment).
- Engine behavior: flag for legal review if employment_type = "fixed_term" and service >= 5 years.

---

## Validation Rules for Engine Input

| Field | Validation |
|---|---|
| `birth_date` | Must be a valid date; retirement_date - birth_date must be ≥ 18 years (no child labor) |
| `hire_date` | Must be ≤ retirement_date |
| `retirement_date` | Must be ≤ today + 1 year (forward planning allowed); must be > hire_date |
| `worker_category` | Enum: general / underground_mine / surface_mine |
| `employer_employee_count` | Integer ≥ 1 |
| `employer_type` | Enum: general / retail / service / agricultural (affects small-employer exemption) |

---

## Sources

- RA 7641, Sec. 1 (Art. 287 Para 3): age 60 optional, 65 compulsory, 5-year service minimum
- RA 7641, Sec. 1 (Art. 287 Para 7): ≤10 employee exemption
- RA 8558: underground mine workers age 50/60
- RA 10757: surface mine workers age 50/60
- DOLE Rule II, Book VI, Sec. 4: service includes authorized absences, vacations, holidays
- DOLE Labor Advisory Oct 24, 1996: part-time employees covered; service before 1993 counts
- input/sources/labor-code-art302.md: engineering-relevant takeaways confirmed
