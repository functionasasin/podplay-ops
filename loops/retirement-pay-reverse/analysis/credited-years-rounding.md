# Analysis: Credited Years of Service — Rounding Rule

**Wave:** 2 — Domain Rule Extraction
**Aspect:** credited-years-rounding
**Date:** 2026-03-06
**Sources:** ra7641-full-text.md, deepdive-retirement-pay-ra7641.md, core-formula-22-5-days.md, labor-code-art302.md

---

## Statutory Basis

**RA 7641, Section 1 (inline with formula):**

> "a fraction of at least six (6) months being considered as one whole year"

This clause appears immediately after the formula specification. It is the sole statutory rounding rule. There are no sub-rules for partial months within the partial year — the law draws a bright line at 6 complete calendar months.

**IRR Rule II, Section 5:**

> "For purposes of this Rule, a fraction of at least six (6) months shall be considered as one whole year."

The IRR restates the statutory rule verbatim. No additional granularity (day-count within the month) is provided.

**Implication:** The rounding unit is the **calendar month**, not the day. A service period of 20 years, 5 months, and 29 days counts as 20 credited years — not 21 — because the remaining period (5 months + 29 days) is less than 6 complete calendar months. There is no "almost 6 months" partial credit.

---

## Precise Algorithm

### Step 1: Compute Full Calendar Years

```
full_years = number of complete years from hire_date to retirement_date
```

A "complete year" means the anniversary date has been reached or passed.

**Example:** Hire = 2010-03-15, Retirement = 2030-09-14
- 20th anniversary = 2030-03-15 → passed
- 21st anniversary = 2031-03-15 → not reached
- full_years = 20

### Step 2: Compute Remaining Calendar Months

```
partial_start = hire_date advanced by full_years years
remaining_months = number of complete months from partial_start to retirement_date
```

A "complete month" means the calendar day-of-month has been reached or passed.

**Example (continued):** partial_start = 2030-03-15, retirement = 2030-09-14
- April 15 → complete (1 month)
- May 15 → complete (2 months)
- June 15 → complete (3 months)
- July 15 → complete (4 months)
- Aug 15 → complete (5 months)
- Sep 15 → NOT reached (retirement = Sep 14)
- remaining_months = 5

### Step 3: Apply Rounding Rule

```
if remaining_months >= 6:
    credited_years = full_years + 1
    rounding_applied = true
else:
    credited_years = full_years
    rounding_applied = false
```

**Example (continued):** remaining_months = 5 < 6 → credited_years = 20, no rounding.

### Step 4: Eligibility Gate

```
if credited_years < 5:
    return Ineligible { reason: "InsufficientService", credited_years, remaining_months }
```

Note: An employee with 4 full years + 6 months (remaining_months = 6) gets credited_years = 5 and IS eligible. This is one of the most legally significant rounding outcomes: an employee with exactly 4 years 6 months of service clears the 5-year minimum.

---

## Rust Implementation Pseudocode

```rust
use chrono::{Datelike, NaiveDate};

struct CreditedYearsResult {
    full_years: u32,
    remaining_months: u32,
    credited_years: u32,
    rounding_applied: bool,
}

fn compute_credited_years(hire: NaiveDate, retirement: NaiveDate) -> CreditedYearsResult {
    // Step 1: Full years
    let mut full_years = retirement.year() as u32 - hire.year() as u32;

    // Adjust if anniversary hasn't occurred yet this year
    let anniversary_this_year = hire
        .with_year(retirement.year() as i32)
        .unwrap_or_else(|| {
            // Feb 29 edge: if hire date is Feb 29, use Feb 28 in non-leap years
            NaiveDate::from_ymd_opt(retirement.year(), 3, 1).unwrap()
        });

    if retirement < anniversary_this_year {
        full_years -= 1;
    }

    // Step 2: Remaining months from the full-year anniversary
    let partial_start = advance_years(hire, full_years);
    let remaining_months = months_between(partial_start, retirement);

    // Step 3: Rounding rule
    let rounding_applied = remaining_months >= 6;
    let credited_years = if rounding_applied {
        full_years + 1
    } else {
        full_years
    };

    CreditedYearsResult {
        full_years,
        remaining_months,
        credited_years,
        rounding_applied,
    }
}

fn months_between(start: NaiveDate, end: NaiveDate) -> u32 {
    // Count complete calendar months: day-of-month in end >= day-of-month in start
    let years_diff = (end.year() - start.year()) as u32;
    let months_diff = end.month() as i32 - start.month() as i32;
    let raw_months = years_diff * 12 + months_diff as u32;

    // Subtract 1 if end day < start day (month not yet complete)
    if end.day() < start.day() {
        raw_months.saturating_sub(1)
    } else {
        raw_months
    }
}
```

**Note on Feb 29 (leap year birthdays):** If hire_date is February 29 (leap year), and the anniversary falls in a non-leap year, use February 28 as the anniversary date. This follows standard Philippine labor practice of the nearest non-leap date.

---

## Service Period: What Counts

Per **IRR Rule II, Section 4** and DOLE practice:

| Period | Counted? |
|--------|---------|
| Regular working days | Yes |
| Authorized sick leave (paid or unpaid) | Yes |
| Authorized vacation leave | Yes |
| Maternity/paternity leave | Yes (RA 11210 for maternity) |
| Regular holidays (whether worked or not) | Yes |
| Service Incentive Leave (SIL) | Yes |
| Unauthorized absences (AWOL) | Generally no — service clock pauses |
| Suspension (pending investigation, found innocent) | Yes — reinstated service |
| Suspension (disciplinary, found guilty) | Debated — flag for legal review |
| Preventive suspension (later found innocent) | Yes — reinstated |
| Period of illegal dismissal (later reinstated) | Yes — backpay includes this period per SC rulings |

**Service before RA 7641 effectivity (January 7, 1993):** Counted. The law does not exclude pre-enactment service. An employee hired in 1975 who retires in 2010 counts all 35 years.

---

## Hire Date Definition

The hire date for RA 7641 purposes is:

1. **Regular employees:** Date of signing of employment contract or actual first day of work, whichever is earlier.
2. **Probationary employees who regularized:** Date of original hire (probationary period counts), not the regularization date.
3. **Contractual employees later regularized:** Disputed. Generally: original contract start if there was continuous service. If there were gaps between contracts, only the regularization date may count. Engine flags this for legal review.
4. **Employees transferred between related companies:** Aggregate service may count per jurisprudence (doctrine of piercing corporate veil for related employers). Engine flags for legal review.

---

## Retirement Date Definition

The retirement date is the actual last day of employment:

- For optional retirement (age 60+): Date the employee formally retires.
- For compulsory retirement (age 65): The actual retirement date (employer cannot defer beyond 65 without employee consent).
- For death before retirement: Date of death is treated as the retirement date (heirs entitled to compute as if employee retired on that date).
- For retrenchment/authorized cause at age 60+: The separation date is used.

---

## Eligibility Interaction: The 4y6m Edge Case

This is the most legally significant rounding scenario:

```
Hire: 2020-01-15
Retirement: 2024-07-15
Full years: 4
Remaining months: 6 (July 15 → July 15 = exactly 6 months)
Rounding: Yes (6 >= 6)
Credited years: 5
Result: ELIGIBLE
```

vs.

```
Hire: 2020-01-15
Retirement: 2024-07-14
Full years: 4
Remaining months: 5 (July 14 < July 15, so 5 months, not 6)
Rounding: No
Credited years: 4
Result: INELIGIBLE
```

**One day's difference determines eligibility.** The engine must display remaining_months clearly in the eligibility explanation so users understand exactly where they stand.

---

## Complete Decision Table with Examples

| Hire Date | Retirement Date | Full Years | Remaining Months | Credited Years | Rounding | Eligible (≥5y)? |
|-----------|----------------|------------|------------------|----------------|----------|-----------------|
| 2004-01-01 | 2024-01-01 | 20 | 0 | 20 | No | Yes |
| 2004-01-01 | 2024-06-30 | 20 | 5 | 20 | No | Yes |
| 2004-01-01 | 2024-07-01 | 20 | 6 | 21 | Yes | Yes |
| 2004-01-01 | 2024-12-31 | 20 | 11 | 21 | Yes | Yes |
| 2019-07-15 | 2024-01-14 | 4 | 5 | 4 | No | No |
| 2019-07-15 | 2024-01-15 | 4 | 6 | 5 | Yes | Yes (border) |
| 2019-07-15 | 2024-07-14 | 4 | 11 | 5 | Yes | Yes |
| 1990-03-01 | 2024-03-01 | 34 | 0 | 34 | No | Yes |
| 2020-02-29 | 2025-08-28 | 5 | 5 | 5 | No | Yes |
| 2020-02-29 | 2025-08-29 | 5 | 6 | 6 | Yes | Yes |

---

## Output Fields for Credited Years

The computation result must include all intermediate values to explain the rounding decision:

```json
{
  "hireDate": "2004-01-01",
  "retirementDate": "2024-07-01",
  "fullYears": 20,
  "remainingMonths": 6,
  "roundingApplied": true,
  "creditedYears": 21,
  "eligibilityStatus": "Eligible",
  "minimumServiceYears": 5
}
```

If ineligible:
```json
{
  "hireDate": "2019-07-15",
  "retirementDate": "2024-01-14",
  "fullYears": 4,
  "remainingMonths": 5,
  "roundingApplied": false,
  "creditedYears": 4,
  "eligibilityStatus": "Ineligible",
  "ineligibilityReason": "InsufficientService",
  "shortfall": "Need 1 more credited year. Currently 4 years 5 months. Need 5 months more service for rounding to apply.",
  "minimumServiceYears": 5
}
```

---

## Service Gap Handling

If an employee was terminated and rehired by the same employer, service periods may or may not aggregate:

- **Constructive dismissal then reinstatement:** Service is continuous (SC ruling restores gap period).
- **Voluntary resignation and rehire:** Generally does NOT aggregate. New hire date for RA 7641 purposes.
- **Resignation with quitclaim:** New hire date unless quitclaim was executed under duress (requires legal review).
- **Fixed-term contracts in continuous succession:** Aggregate if there was no genuine break in employment (labor-only contracting doctrine may apply).

**Engine behavior:** Accept a single hire_date and retirement_date. For service gap scenarios, flag with a warning: "If there were gaps in your service with this employer, the credited years computation may differ. Consult a labor lawyer." Do not attempt to compute aggregated multi-period service in v1.

---

## Invariants Derived from This Analysis

1. `remaining_months` is always in range [0, 11] — it is never 12 or more (that would be another full year).
2. `credited_years >= full_years` always (rounding can only add, never subtract).
3. `credited_years <= full_years + 1` always (rounding adds at most 1 year).
4. If `remaining_months == 0`, `rounding_applied` is always false.
5. If `rounding_applied` is true, `credited_years == full_years + 1`.
6. `credited_years < 5` → Ineligible for RA 7641 (regardless of age).

---

## Interaction with Minimum Service Rule

The eligibility gate checks `credited_years >= 5`, not `full_years >= 5`. This means:

- 4 full years + 6 remaining months → credited_years = 5 → **Eligible**
- 4 full years + 5 remaining months → credited_years = 4 → **Ineligible**

This is explicitly confirmed by the statutory language: "a fraction of at least six (6) months being considered as one whole year" — this applies to the minimum service computation too, not just to the pay computation.

---

## Summary

The credited years rounding rule is mechanically simple but critically precise:

1. Count full calendar years from hire to retirement.
2. Count remaining complete calendar months after full years.
3. If remaining months ≥ 6: add 1 credited year; otherwise: keep full years.
4. Check credited years ≥ 5 for eligibility.

The engine uses `chrono::NaiveDate` arithmetic for exact month counting. No day-count approximations. The output includes `fullYears`, `remainingMonths`, `creditedYears`, and `roundingApplied` to fully explain the computation.

Key risks:
- Off-by-one on the month boundary (day 14 vs day 15 of the month determines month completeness)
- Feb 29 leap year hire dates require normalization to Feb 28 in non-leap years
- The 4y6m eligibility edge case is the most common disputed scenario — output must be clear
