# Company Plan Comparison Rules

**Aspect:** company-plan-comparison-rules (Wave 2)
**Analyzed:** 2026-03-06
**Sources:** RA 7641 Sec. 1–2, IRR Sec. 3, DOLE Advisory 1996, deepdive-retirement-pay-ra7641.md

---

## Legal Basis

### RA 7641, Section 1 (Article 287/302)
> "In case of retirement, the employee shall be entitled to receive such retirement benefits as he may have earned under existing laws and any collective bargaining agreement and other agreements: *Provided, however*, That an employee's retirement benefits under any collective bargaining and other agreements shall not be less than those provided herein."

**Rule:** Company plan benefits ≥ statutory minimum at all times. Below-minimum company plans must be topped up to the statutory floor.

### RA 7641, Section 2 (Preservation Clause)
> "Nothing in this Act shall deprive any employee of any benefit, supplement or retirement pay to which he may be entitled under existing laws or any collective bargaining or other agreement, or company policy or practice."

**Rule:** If the company plan is more generous, the employee keeps the higher amount. RA 7641 is a floor, not a cap.

### IRR Section 3 (Contractual Retirement Plan)
> "Employees may be retired under collective bargaining agreements or employment contracts. Retirement benefits under any such agreement shall NOT be less than the statutory minimum under RA 7641."

### DOLE Advisory 1996
> "Where employer has a retirement plan (via CBA, individual contract, or company policy) providing benefits equal to or superior to RA 7641 minimum, that plan prevails. Where benefits are inferior to the statutory minimum, the employer must pay the difference."

---

## Types of Company Retirement Plans

| Plan Type | Description | Key Consideration |
|-----------|-------------|-------------------|
| CBA retirement provision | Collectively bargained formula (e.g., "1 month per year of service") | May specify a lower optional retirement age (e.g., 55) |
| Individual employment contract | Express retirement clause in contract | Must still meet RA 7641 floor |
| Company retirement plan (BIR-registered) | Formal plan registered under RR 1-68; enables tax exemption | Required for NIRC Sec. 32(B)(6)(a) tax exemption |
| Company retirement plan (unregistered) | Company policy/practice with retirement formula | Provides no tax exemption; statutory floor still applies |
| PAG-IBIG Fund | Employer contributions only count | See PAG-IBIG Offset Rule below |
| SSS retirement benefit | Separate statutory benefit; NOT counted against RA 7641 obligation | Employee receives SSS benefit independently |

---

## The Pay-the-Higher Rule

### Formula

```
statutory_minimum = daily_rate × 22.5 × credited_years

company_plan_benefit = (company formula applied to same employee)

retirement_pay_owed = max(statutory_minimum, company_plan_benefit)

gap = statutory_minimum - company_plan_benefit
  if gap > 0: employer must pay at minimum statutory_minimum
  if gap <= 0: company plan prevails; employer pays company_plan_benefit
```

### Employee Perspective

The employee always receives the larger of the two amounts. There is no scenario where having a company plan reduces the employee's entitlement below the statutory minimum.

### Employer Perspective

If a company plan fully covers or exceeds the statutory minimum:
- Employer pays company plan amount
- No additional RA 7641 obligation

If a company plan covers only part of the statutory minimum:
- Employer pays the full statutory minimum
- The shortfall (gap) represents underpayment risk/NLRC exposure

---

## Company Plan Benefit Formula Types

For the engine, three common company plan formula structures must be supported:

### Type A: Days-Per-Year (similar to RA 7641 structure)
```
company_benefit = (monthly_salary / 26) × company_days_per_year × credited_years

Example: "1 month salary per year" → company_days_per_year = 26
         "30 days per year" → company_days_per_year = 30
         "22.5 days per year" → exactly equals statutory minimum
```

### Type B: Months-Per-Year
```
company_benefit = monthly_salary × company_months_per_year × credited_years

Example: "1 month per year" → months_per_year = 1.0
         "0.5 month per year" → months_per_year = 0.5 (below statutory for employees with integrated benefits)
```

### Type C: Fixed Lump Sum (less common)
```
company_benefit = fixed_lump_sum_amount

Use case: some older company plans specify a fixed peso amount per year of service (e.g., ₱5,000 per year)
Note: these become woefully inadequate as salaries rise
```

### Type D: Tiered/Graduated
```
company_benefit = Σ (rate_for_tier × years_in_tier)

Example: "1 month for first 5 years, 1.5 months for years 6–15, 2 months for years 16+"
```

The engine must support Types A and B as the most common structures, with a passthrough for Type C and Type D as a "manual entry" mode.

---

## PAG-IBIG Offset Rule

DOLE Advisory 1996 establishes a specific rule for PAG-IBIG Fund:

1. **Only employer contributions** to PAG-IBIG count toward RA 7641 obligation
2. **Employee contributions** are excluded (these belong to the employee regardless)
3. If employer's PAG-IBIG contributions accumulated for the employee meet or exceed the statutory minimum, RA 7641 is satisfied
4. If employer's PAG-IBIG contributions are less than the statutory minimum, the employer must pay the **shortfall** (not the full amount — credit for PAG-IBIG contributions already made)

**Formula:**
```
pagibig_employer_total = accumulated employer PAG-IBIG contributions for this employee
gap = statutory_minimum - pagibig_employer_total
employer_additional_obligation = max(0, gap)
```

**Note:** For the product, PAG-IBIG offset is a secondary calculation. The engine should flag the PAG-IBIG offset scenario and provide the additional obligation amount but note that the employer must produce the actual PAG-IBIG statement to calculate the true credit.

---

## CBA Early Retirement Age

CBAs may specify a retirement age lower than 60 (e.g., age 55, or after 25 years of service regardless of age). When a CBA early retirement applies:

1. The CBA's retirement age triggers retirement eligibility (employee can retire earlier than 60)
2. The CBA's retirement benefit formula must still meet or exceed the RA 7641 statutory minimum
3. The statutory minimum computation still uses the 22.5-day formula and credited years as of CBA retirement date
4. If the CBA benefit exceeds the statutory minimum (as computed at the early date), the CBA amount governs

**Edge case:** Employee retires at 55 under CBA. Years of service = 28 years. CBA provides "2 months per year" = ₱672,000. Statutory minimum at 22.5 days = ₱504,000. CBA governs: employee receives ₱672,000.

---

## Gap Analysis: Per-Employee and Portfolio-Level

### Per-Employee Gap

```
per_employee_gap = max(0, statutory_minimum - company_plan_benefit)
```

This is the amount the employer must pay beyond the company plan benefit. Zero means fully covered.

### Portfolio-Level Gap Analysis (Batch Mode)

For HR departments running gap analysis on their entire workforce approaching retirement:

```
total_gap = Σ per_employee_gap for all employees in scope
undercovered_count = count of employees where per_employee_gap > 0
fully_covered_count = count of employees where per_employee_gap == 0
coverage_ratio = fully_covered_count / total_employees
largest_individual_gap = max(per_employee_gap)
average_gap_undercovered = total_gap / undercovered_count  (if undercovered_count > 0)
```

---

## Which Prevails: Decision Rules

| Scenario | Result |
|----------|--------|
| No company plan exists | Statutory minimum applies in full |
| Company plan = statutory minimum exactly | Either governs; employee receives statutory amount |
| Company plan > statutory minimum | Company plan governs; employee receives company amount |
| Company plan < statutory minimum | Statutory minimum governs; employer pays difference |
| Company plan for some employees, none for others | Each employee analyzed individually |
| PAG-IBIG contributions ≥ statutory minimum | PAG-IBIG offset satisfies RA 7641; additional obligation = 0 |
| PAG-IBIG contributions < statutory minimum | Employer pays the shortfall |
| CBA provides earlier retirement age with adequate benefit | CBA governs on both age and amount |
| CBA provides earlier retirement age with inadequate benefit | Statutory minimum applies to the benefit computation |

---

## Engine Data Requirements for Company Plan Input

For the comparison engine, the following inputs are needed:

```
has_company_plan: bool
company_plan_type: "none" | "days_per_year" | "months_per_year" | "fixed_lump_sum" | "manual_entry"

// For days_per_year:
company_days_per_year: f64  // e.g., 26.0 for "1 month per year"

// For months_per_year:
company_months_per_year: f64  // e.g., 1.0 for "1 month per year"

// For fixed_lump_sum:
company_fixed_amount_centavos: i64

// For manual_entry (user computes and enters the benefit):
company_plan_benefit_centavos: i64

// PAG-IBIG offset (optional):
has_pagibig_offset: bool
pagibig_employer_contributions_centavos: i64  // total accumulated employer contributions
```

---

## Engine Output for Comparison

```
company_plan_benefit_centavos: i64       // computed from company plan formula
statutory_minimum_centavos: i64          // 22.5-day formula result
retirement_pay_owed_centavos: i64        // max(company, statutory)
plan_governs: "statutory" | "company"   // which governs
gap_centavos: i64                        // statutory - company (positive means gap, 0 means covered)
gap_percentage: f64                      // gap / statutory (e.g., 0.33 means 33% shortfall)
pagibig_offset_centavos: i64             // 0 if no offset
additional_obligation_centavos: i64      // after PAG-IBIG offset deduction
```

---

## UI Representation

The company plan comparison results are displayed as a side-by-side comparison:

| Metric | Statutory (RA 7641) | Company Plan |
|--------|---------------------|--------------|
| Formula | 22.5 days × credited years | [company formula] |
| Days per year | 22.5 | [computed equivalent] |
| Gross amount | ₱XXX,XXX | ₱XXX,XXX |
| Governs? | [Y/N] | [Y/N] |
| Gap | — | ₱XXX (shortfall) or — (covered) |

Visual indicator: if company plan has a gap, show a red alert badge. If fully covered or exceeds, show a green badge.

---

## Key Edge Cases

1. **Company plan uses 26 days divisor, RA 7641 uses 26 days**: No conflict. Comparison is straightforward.
2. **Company plan uses different divisor (22 days)**: The company plan formula must be computed on its own terms; comparison uses centavo amounts, not day counts.
3. **Company plan is denominated in different currency** (pre-1993 USD-linked plans for MNCs): Convert at BSP reference rate on retirement date; note this in output as a legal uncertainty flag.
4. **Multiple company plans** (e.g., CBA provision + separate non-registered plan): Use the plan most favorable to the employee (anti-waiver principle).
5. **Company plan has a cap** (e.g., "1 month per year, capped at 20 years"): Apply the cap when computing company plan benefit; compare capped company benefit to uncapped statutory minimum.
6. **Company recently adopted a plan**: RA 7641 service counts from hire date regardless of when plan was adopted. Service before plan adoption still accrues statutory rights.

---

## Implications for NLRC Worksheet

When filing a money claim for underpayment, the worksheet must show:

1. The statutory minimum computed under RA 7641 (with full 22.5-day breakdown)
2. What the company paid (or its company plan provides)
3. The gap (line 1 minus line 2 = claim amount)
4. Legal basis: RA 7641 Sec. 1, IRR Sec. 5, Art. 302 Labor Code

This is the core "statement of computation" format for retirement pay NLRC cases.
