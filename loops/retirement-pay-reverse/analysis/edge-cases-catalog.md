# Analysis: Edge Cases Catalog — RA 7641 Retirement Pay

**Aspect:** edge-cases-catalog
**Wave:** 2 — Domain Rule Extraction
**Date:** 2026-03-06
**Depends on:** eligibility-rules, credited-years-rounding, salary-basis-inclusions, death-before-retirement, separation-pay-interaction, company-plan-comparison-rules

---

## Overview

This catalog covers edge cases that do not fit neatly into any single prior aspect. Each case specifies:
- **Rule**: the legal basis for the edge case
- **Engine behavior**: how the Rust engine handles it
- **UI behavior**: what the frontend shows
- **Test vector ID**: references for the test-vectors aspect

---

## EC-01: Company Transfers Between Related Entities

### The Scenario
An employee works for Company A for 8 years, then transfers to Company B (same corporate group / same beneficial owner), works 4 more years, and retires from Company B.

### Legal Rule
- RA 7641 requires service with "the same employer" for the 5-year minimum and credited years calculation.
- However, Supreme Court jurisprudence establishes that when two companies are "intimately related" — sharing common ownership, management, or business operations — they may be treated as a **single employer** for purposes of the 5-year minimum and credited years computation.

**Key cases:**
- *Eparwa Security and Janitorial Services, Inc. v. Liceo de Cagayan University, G.R. No. 150402*: affiliated companies treated as single employer
- *Tiu v. Platinum Plans Philippines, G.R. No. 163512*: corporate spin-off followed by transfer = continuous service
- *Espina v. Court of Appeals, G.R. No. 164582*: transfer between sister companies does not break continuity of service

**Conditions for aggregation:**
1. Same beneficial owner controls both companies (majority ownership)
2. Same or substantially overlapping management
3. Transfer was unilateral (employer-initiated, not employee resignation + rehire)
4. No severance or final pay was released between the companies (which would signal a break)

If any condition fails, only service with the terminal employer (the one from whom the employee retires) is credited.

### Engine Behavior

```
Input: transfer_history: Option<Vec<EmployerTransferRecord>>

struct EmployerTransferRecord {
    employer_name: String,
    hire_date: NaiveDate,
    separation_date: NaiveDate,
    is_related_entity: bool,        // user attests corporate relatedness
    severance_released: bool,       // true = break in service, false = transfer
}

Aggregation logic:
- If is_related_entity = true AND severance_released = false:
    - Add service months from prior employer to total service
    - Aggregate credited years across both employers
    - Use terminal employer's salary as salary basis
- If is_related_entity = false OR severance_released = true:
    - Only credit service from hire_date at terminal employer
    - Emit warning: "Only service with current employer credited. Prior service excluded."
```

**Warning flag:** When transfer history is provided with `is_related_entity = true`, emit `EligibilityWarning::CompanyTransferServiceAggregationRequired`. This flags the computation for legal review — the engine computes the aggregated amount but the user should verify the corporate relationship.

### UI Behavior
- Wizard Step 2 (Employment Details): optional section "Prior Employment with Related Entity"
  - Toggle: "Employee was previously employed by a related/affiliated company"
  - If yes: show sub-form for prior employer name, hire date, separation date, and checkbox "No severance pay was released at transfer"
- Results: if aggregation applied, show note: "Credited years include [N] years from [Prior Employer] as a related entity. Verify corporate relationship before asserting this entitlement."

---

## EC-02: CBA Retirement Provisions

### The Scenario
A company has a Collective Bargaining Agreement (CBA) that specifies retirement at age 55 with 15 years of service, at a rate of 1.5 months salary per year.

### Legal Rule
- CBA benefits are valid and enforceable **as long as they meet or exceed the RA 7641 statutory minimum**.
- RA 7641 is the **floor** — CBA cannot provide less. Any CBA provision providing less than 22.5 days × credited years is void pro tanto (invalid to that extent).
- Lower retirement age in CBA is permitted (Art. 302, Labor Code IRR, Rule II, Sec. 4).
- Higher benefit rate in CBA: fully enforceable.

**Engine comparison rule:**
```
statutory_minimum = daily_rate × 22.5 × credited_years
cba_benefit = cba_daily_rate × cba_rate_days × credited_years

if cba_benefit >= statutory_minimum:
    enforce_cba = true
    amount_due = cba_benefit
    gap = 0
else:
    enforce_cba = false
    amount_due = statutory_minimum
    gap = statutory_minimum - cba_benefit
    note = "CBA benefit is below RA 7641 statutory minimum. Statutory minimum applies."
```

### CBA Retirement Age Interaction
- If CBA sets retirement age at 55 (below the RA 7641 statutory 60), the engine accepts age 55 as eligible.
- Input field: `cba_retirement_age: Option<u8>` — if Some(55), treat age 55 as optional retirement age.
- Engine check: if `age_at_retirement < 60 AND cba_retirement_age.is_some() AND age_at_retirement >= cba_retirement_age`:
    - Eligible under CBA terms
    - Compute both CBA amount and RA 7641 statutory minimum
    - Pay the higher

### Engine Behavior

```rust
pub struct CbaPlanInput {
    pub retirement_age: u8,           // CBA minimum age (may be < 60)
    pub rate_days_per_year: u16,      // e.g., 30 for 1-month-per-year CBA
    pub rate_basis: CbaRateBasis,     // BasicOnly or FullSalaryPackage
    pub service_years_required: u8,   // CBA minimum service (may differ from 5-year stat min)
}

pub enum CbaRateBasis {
    BasicOnly,            // CBA uses basic salary only (same as RA 7641 basis)
    FullSalaryPackage,    // CBA includes bonuses, allowances in rate base
}

pub struct CbaPlanResult {
    pub cba_amount_centavos: i64,
    pub statutory_minimum_centavos: i64,
    pub gap_centavos: i64,                  // statutory - CBA; 0 if CBA >= statutory
    pub enforced_amount_centavos: i64,      // max(CBA, statutory)
    pub enforcement_basis: EnforcementBasis,// CbaPlan or StatutoryMinimum
}

pub enum EnforcementBasis {
    CbaPlan,
    StatutoryMinimum,
}
```

### UI Behavior
- Wizard Step 5 (Company Plan — optional): radio group "CBA Plan" / "Company Retirement Plan" / "None"
- When CBA: show CBA retirement age, CBA rate (days per year), CBA service requirement
- Results: side-by-side comparison: CBA Amount vs. Statutory Minimum, "Applied: [CBA Plan / Statutory Minimum]"

---

## EC-03: Contractual vs. Regular Employee Status Dispute

### The Scenario
An employee has worked through a series of 6-month fixed-term contracts for the same company for 7 years total, totaling ≥ 5 years. The employer asserts the employee is "contractual" and not entitled to retirement pay.

### Legal Rule
**DOLE Department Order No. 174-17 and Supreme Court jurisprudence** establish that:
- Regular employment is the rule; fixed-term is the exception.
- A series of short-term contracts with the same employer performing the **same functions** is evidence of disguised regular employment.
- After 6 months of probationary employment, an employee becomes regular by operation of law (Labor Code Art. 296).
- For project-based / seasonal workers: each project or season is assessed individually — NOT a basis for regular employment claim.
- For perpetually renewed fixed-term contracts: treated as regular employment (Supreme Court: *Brent School v. Zamora, G.R. No. 48494*; but note exceptions for project-based and fixed-period employment agreed to by parties of equal standing).

**Key test:** Was the fixed-term nature agreed upon **knowingly, freely, and without moral dominance** by the employer? If not, the fixed term is unenforceable and the employee is regular.

### Engine Behavior

```rust
pub enum EmploymentType {
    Regular,                  // Standard presumption — RA 7641 applies
    Probationary,             // < 6 months, not yet regular
    ProjectBased,             // Specific project with defined end; each contract separate
    Seasonal,                 // Seasonal work; each season separate
    FixedTermDisputed,        // Long-term repeated fixed-term; flag for legal review
    PartTime,                 // Regular but < 8 hours/day; RA 7641 applies
    Domestic,                 // Kasambahay — RA 10361 governs, not RA 7641
}
```

When `EmploymentType::FixedTermDisputed`:
- Compute the retirement pay as if regular (use total continuous service with same employer)
- Emit `EligibilityWarning::FixedTermStatusDisputed`
- UI: amber alert — "This computation treats the employee as regular based on [N] years of continuous service. Employment status should be confirmed with a labor lawyer. Disputed contractual status may affect entitlement."

When `EmploymentType::ProjectBased` or `Seasonal`:
- Do NOT aggregate service across separate contracts
- Show each contract's credited months
- Compute retirement pay only if a single continuous contract (or continuous series with same project) exceeds 5 years
- More commonly: not eligible (each project standalone)

When `EmploymentType::Domestic`:
- Display error: "Domestic workers (Kasambahay) are governed by RA 10361, not RA 7641. This calculator covers private-sector employment only."
- No computation rendered

When `EmploymentType::Probationary`:
- Display ineligibility: "Employee has [N] months of service. Probationary employees who have not yet completed 6 months of service are not yet regular and do not have RA 7641 entitlement."

### UI Behavior
- Wizard Step 2: Employment Type dropdown with options and short explanatory text for each
- For `FixedTermDisputed`: guidance note on what documents to gather (list of contracts, same duties across contracts, absence of project closure between contracts)

---

## EC-04: DOLE Exemption for Small Establishments

### The Scenario
The employer claims the ≤10 employee exemption. What is the exact rule, and how does the engine handle it?

### Legal Rule (detailed — from RA 7641, Sec. 1, para. 7)
> "The provision of this article shall not apply to establishments employing not more than ten (10) employees or workers for retail and service establishments or in establishments engaged in agricultural operations."

**Three-part test for exemption:**
1. **Establishment type**: Must be retail, service, or agricultural. A BPO, manufacturing plant, or financial institution with 8 employees does NOT qualify for the exemption.
2. **Employee count**: Must be ≤ 10 **regular** employees in the establishment at time of retirement.
3. **Establishment unit**: The exemption applies per establishment, not per company. If a company has 3 stores each with 6 employees, each store (establishment) may qualify. A central warehouse with 12 employees does not qualify even if the owner of the sari-sari stores is the same person.

**DOLE definition of "establishment":** A single economic unit at a single location.

### Counting Rules
- Only **regular employees** count toward the 10-employee threshold. Project-based, seasonal, and probationary employees are NOT counted (DOLE Labor Advisory).
- Part-time regular employees are counted as 1 employee each (not fractional).
- Managerial employees who are also covered by RA 7641 (managers below officer level) count.

### Engine Behavior

```rust
pub struct EmployerInfo {
    pub employer_type: EmployerType,        // General, Retail, Service, Agricultural
    pub regular_employee_count: u32,        // Count of regular employees at time of retirement
    pub establishment_count: Option<u32>,   // If multi-establishment (for advisory only)
}

pub enum EmployerType {
    General,         // Non-retail/non-service/non-agricultural — exemption NOT available
    Retail,          // Retail store — exemption available if ≤10 regulars
    Service,         // Service establishment — exemption available if ≤10 regulars
    Agricultural,    // Farm, fishpond, poultry — exemption available if ≤10 regulars
}

Exemption logic:
- if employer_type == General: exemption_available = false (always covered)
- if employer_type in [Retail, Service, Agricultural] AND regular_employee_count <= 10:
    exemption_applicable = true
    ineligibility_reason = Some(EmployerExemptSmallEstablishment { count: regular_employee_count })
- else:
    exemption_applicable = false
```

**Always compute the statutory amount even when exemption applies** — for reference and potential NLRC challenge if employee contests the exemption claim.

### UI Behavior
- Wizard Step 1 (Employer Info): dropdown for employer type; numeric field for regular employee count
- If exemption applies: yellow/amber alert box:
  - "This employer qualifies for the ≤10 employee exemption under RA 7641. Statutory retirement pay is not legally required."
  - "The amount below (PHP [X]) represents what the employee would be owed if the establishment had more than 10 regular employees. It may support a claim if the employee contests the employee count."
  - "Verify: Does the employer's retirement or CBA plan provide alternative benefits?"

---

## EC-05: Employee with Multiple Concurrent Employers

### The Scenario
An employee works part-time for two different companies simultaneously. On retirement, can they claim retirement pay from both?

### Legal Rule
- RA 7641 applies to each **employer-employee relationship independently**.
- Each employer must independently satisfy the 5-year minimum and the 10-employee threshold relative to the claimant's relationship with that employer.
- Each employer pays retirement based on the **monthly basic salary that employer paid** — not a combined salary.
- There is no aggregation across unrelated employers.

**SSS consideration:** The employee has two separate SSS contributions (one from each employer). SSS retirement benefit is separate from RA 7641 and is unaffected by multiple employers.

### Engine Behavior
- The engine computes one employer at a time.
- For multi-employer scenarios, the user runs the calculator once per employer.
- No multi-employer input mode is needed.
- This is documented in the UI as guidance only.

### UI Advisory Text
In the single-employee calculator, a footnote under the salary fields: "If this employee has concurrent employers, run a separate computation for each employer. Each employer's obligation is computed independently based on the salary they pay and the service the employee has with them."

---

## EC-06: Employer Becomes Insolvent / Closes Down

### The Scenario
The employer closes the business. Employees have not yet reached retirement age (e.g., age 55, 10 years service). Are they entitled to retirement pay? Are they entitled to separation pay?

### Legal Rule
**Retirement pay (RA 7641):** Does NOT apply — employees have not yet reached the minimum retirement age (60 for general workers). They are not "retiring"; they are being separated due to business closure.

**Separation pay (Labor Code Art. 298):**
- Closure NOT due to serious business losses: separation pay due at 1/2 month per year (15 days × years), minimum 1 month.
- Closure DUE TO serious business losses: no separation pay required (Art. 298, para. 2 exception).

**Unpaid wages in insolvency:** Priority creditors under the Labor Code — wages, 13th month pay, and statutory monetary benefits are preferred claims against the assets of an insolvent employer (Art. 110, Labor Code and RA 10142, FRIA).

**Company retirement plan:** If a funded company plan exists, employees may claim from the plan fund even in insolvency (fund is separate from employer's assets if properly constituted as a trust).

### Engine Behavior
When user selects `authorized_cause = ClosureDueToLosses` AND employee is below retirement age:
- `payment_scenario = SeparationOnly { separation_pay_centavos: 0 }` (losses closure = no sep pay)
- Advisory: "No separation pay is required when closure is due to serious business losses. However, unpaid wages and benefits remain preferred claims. If losses are disputed, the employee may file an NLRC complaint."

When `authorized_cause = ClosureNotDueToLosses` AND employee below retirement age:
- `payment_scenario = SeparationOnly { separation_pay_centavos: computed_15day_sep_pay }`

### UI Behavior
- When authorized cause = `ClosureDueToLosses` and age < 60:
  - Amber alert: "No retirement pay is owed (employee is below age 60). No separation pay is required when closure is due to serious financial losses. Wages and statutory benefits due up to the last day of employment remain payable."

---

## EC-07: Pre-RA 7641 Service (Before January 7, 1993)

### The Scenario
An employee started working in 1985, before RA 7641 took effect on January 7, 1993. Do years before 1993 count?

### Legal Rule
**Yes, pre-RA 7641 service counts fully.**

From DOLE Labor Advisory (October 24, 1996): "Length of service in computing retirement benefits shall include the years of service both before and after January 7, 1993, the effectivity date of Republic Act No. 7641."

This is critical for long-tenured employees who started before the law took effect.

**Example:**
- Hire date: June 1, 1985
- Retirement date: June 1, 2025
- Total service: 40 years — ALL 40 years credited for both the 5-year minimum AND the credited years formula

### Engine Behavior
- No cutoff at January 7, 1993 in the computation.
- The engine uses `hire_date` directly; no special handling for pre-1993 service.
- This is automatically correct as long as no date-filtering code is introduced.
- **Anti-pattern to avoid:** Do NOT implement a January 7, 1993 cutoff or split computation. It would be legally wrong.

### Test Vector: TV-PRELAW-01
- Input: hire_date = 1985-06-01, retirement_date = 2025-06-01
- Expected: credited_years = 40 (no cutoff)
- Retirement pay = daily_rate × 22.5 × 40

---

## EC-08: Part-Time Employees

### The Scenario
An employee works 4 hours per day (half-time) at a basic wage of PHP 10,000/month for 10 years. Are they entitled to retirement pay?

### Legal Rule
**Yes.** DOLE Labor Advisory (October 24, 1996) explicitly confirms: part-time employees are covered by RA 7641.

Formula: Identical. Daily rate = monthly basic salary ÷ 26. The "26 working days" divisor does not change for part-time — it is a statutory formula, not a reflection of actual days worked.

### Engine Behavior
- `EmploymentType::PartTime` — process identically to regular employment
- No formula modifications
- Advisory in results: "Part-time employees are fully covered by RA 7641. The daily rate uses the standard 26-day divisor regardless of actual hours per day."

---

## EC-09: Employee Retires but Continues Working (Part-Time / Consultant)

### The Scenario
An employee retires at age 65, receives retirement pay, then is rehired by the same employer as a consultant or on a new fixed-term contract. Does the subsequent engagement affect the retirement pay computation?

### Legal Rule
- Once retirement pay is computed and paid, the obligation is discharged.
- Subsequent re-engagement is a new employment relationship.
- The subsequent contract does NOT retroactively affect the retirement pay computation.
- However, if the employee retires, receives retirement pay, is rehired, and then retires again: the second retirement does NOT entitle the employee to another RA 7641 benefit (the employee would be retiring from a new, typically shorter-tenure engagement — the service starts fresh from the date of re-engagement).

**Tax implication:** The NIRC Sec. 32(B)(6)(a) "once-in-a-lifetime" exemption means the employee cannot claim income tax exemption on a second retirement pay from the same or different employer.

### Engine Behavior
- The engine computes one retirement event.
- If the user provides `rehire_date` after a prior retirement, the engine uses only the post-rehire service for credited years.
- `prior_retirement_pay_received: bool` — if true, marks the tax exemption as unavailable ("once-in-a-lifetime" exhausted).

---

## EC-10: Mining Workers — Underground vs. Surface Classification

### The Scenario
A worker at a mine claims to be a surface mine worker (age 52, entitled to retire at 50 under RA 10757). The employer disputes the classification, saying the worker is a general employee (age threshold: 60).

### Legal Rule
**RA 10757 (Surface Mine Workers Retirement Act, 2016)** covers:
- Mill plant workers
- Electrical, mechanical, and tailings pond personnel

**RA 8558 (Underground Mine Workers)** covers:
- Workers actually performing work underground

**DOLE determines classification** in disputes. The engine cannot adjudicate classification disputes — it computes based on the user-selected category and notes the limitation.

### Engine Behavior

```rust
pub enum WorkerCategory {
    General,           // Age 60 optional, 65 compulsory
    UndergroundMine,   // Age 50 optional, 60 compulsory (RA 8558)
    SurfaceMine,       // Age 50 optional, 60 compulsory (RA 10757)
                       // Note: Mill plant, electrical, mechanical, tailings pond only
}
```

When `SurfaceMine` selected:
- Advisory: "Surface mine worker category covers mill plant workers, electrical, mechanical, and tailings pond personnel under RA 10757. If the worker's role does not fall within these categories, use 'General' category."

### Test Vectors
- TV-MINE-01: Underground miner, age 52, 15 years service — eligible (age ≥ 50)
- TV-MINE-02: Surface mine worker (mill plant), age 52, 15 years service — eligible
- TV-MINE-03: "Surface mine" administrative staff, age 52 — user should use General; engine cannot detect this error but advisory warns

---

## EC-11: Interrupted Service / Re-Hire at Same Employer

### The Scenario
Employee worked 3 years, resigned (or was terminated), was rehired 1 year later, worked 4 more years. Do both periods combine for the 5-year minimum?

### Legal Rule
**RA 7641 IRR, Rule II, Sec. 4 (paraphrased):** "The term 'length of service' shall refer to the employee's period of service to the establishment, whether continuous or broken."

**"Broken" service:** Periods of separation and rehire at the **same establishment** are counted together for both the 5-year minimum AND credited years calculation.

**Exception:** If a final pay and/or retirement benefit was released between the two periods (i.e., the first separation was treated as a clean break with all obligations settled), the second period stands alone.

### Engine Behavior

```rust
pub struct ServicePeriod {
    pub hire_date: NaiveDate,
    pub separation_date: NaiveDate,
    pub final_pay_released: bool,  // true = clean break; false = voluntary departure/temporary
}

// Total service months = sum of months in all ServicePeriod entries where final_pay_released = false
// OR if final_pay_released = true for any earlier period: only count from the most recent hire_date
// after the last period where final_pay_released = true
```

**Note:** Engine conservatively treats a `final_pay_released = true` break as a full reset. If users are unsure, the engine computes both scenarios and shows the difference.

### UI Behavior
- Wizard Step 2: optional "Prior Service Periods" section
  - Toggle: "Employee has had prior interrupted service with this employer"
  - If yes: list of service periods (hire date, separation date, was final pay fully released?)
  - Advisory: "If retirement pay was included in final pay at the prior separation, the employee's service resets at rehire. Only current period counts."

---

## EC-12: Salary Increases During the Final Year

### The Scenario
Employee received a salary increase 3 months before retirement. Which salary is used — pre-increase or post-increase?

### Legal Rule
RA 7641 says "based on the **latest salary rate**." The latest salary rate is the salary **in effect on the last day of employment (retirement date)**.

- If a salary increase took effect before the retirement date: **new (higher) salary is used** — even if only by 1 day.
- If a salary increase was negotiated/agreed but not yet effective on retirement date: the **current salary applies** (future increases are not retroactive for retirement pay purposes, unless the agreement explicitly makes it retroactive).
- If a CBA wage increase is being implemented in tranches: use the tranche in effect on the retirement date.

### Engine Behavior
- The engine receives `monthly_basic_centavos` as of retirement date. The user inputs the correct salary.
- No separate handling of salary history — the engine trusts the input salary is correct.
- The specification to "use latest salary rate" is a user responsibility (data entry), not an engine algorithm.
- UI guidance text near salary field: "Enter the monthly basic salary in effect on the last day of employment (retirement date). Subsequent salary increases not yet effective on the retirement date are excluded."

---

## EC-13: 13th Month Pay and SIL Already Received — Double-Counting Risk

### The Scenario
An employee received their 13th month pay for the year (December 2024), and also received cash conversion of their 5 SIL days for the year. They then retire in March 2025. The 22.5-day formula INCLUDES 5 days SIL and 1/12 of 13th month. Is there double-counting?

### Legal Rule
**No double-counting.** The 5 days SIL and 1/12 of 13th month embedded in the 22.5-day retirement pay formula are **in addition to** (and independent of) separately accrued SIL and 13th month pay.

**Basis:** RA 7641 Sec. 1 explicitly adds these components to the retirement pay formula as part of the retirement benefit itself — they are a notional component of the retirement pay computation, not a deduction from or credit against separately accrued SIL and 13th month pay.

**Separately accrued final pay components (payable regardless):**
- Pro-rated 13th month pay for the current year (Jan 2025 to March 2025)
- Unused SIL cash conversion as of retirement date
- Accrued earned wages to last day

These are NOT deducted from the retirement pay amount.

### Engine Behavior
- The engine computes retirement pay as: `daily_rate × 22.5 × credited_years`
- The engine does NOT receive or process separately accrued SIL or 13th month pay data
- The engine does NOT deduct any prior payments from retirement pay
- Final pay components are listed separately in the NLRC worksheet as independent line items

### UI Advisory
In the results view, under the breakdown section:
> "The 5 SIL days and 1/12 of 13th month pay shown above are components of the RA 7641 retirement pay formula — they are not deducted from separately accrued SIL benefits or 13th month pay for the current year. The employee is entitled to retirement pay under this formula PLUS any separately accrued final pay components."

---

## EC-14: Retirement During Probationary Period

### The Scenario
An employee has been on "probationary" status for 4 years 11 months and the employer attempts to use this to deny retirement pay.

### Legal Rule
- Under Labor Code Art. 296, the maximum probationary period is **6 months** (unless covered by apprenticeship agreements or professional licensure requirements).
- An employee who has worked > 6 months is **regular by operation of law**, regardless of what the employer calls them.
- A 4-year 11-month "probationary" classification is void; the employee is a regular employee for all purposes, including RA 7641.
- However, RA 7641 still requires the 5-year minimum service threshold. At 4 years 11 months, even as a regular employee, the employee falls short of 5 years.

### Engine Behavior
- `EmploymentType::Probationary` AND `service_months >= 6`: treat as regular.
- Emit advisory: "Extended probationary period exceeds 6 months. Employee is regular by operation of law (Labor Code Art. 296)."
- Apply standard eligibility rules (5-year minimum still applies).

---

## EC-15: Retirement Pay vs. Gratuity Pay Distinction

### The Scenario
A company has a "gratuity pay" scheme that pays 1 month per year of service. The employer argues this satisfies RA 7641 and wants to offset it against the statutory retirement pay.

### Legal Rule
A company "gratuity pay" satisfies RA 7641 **only if the amount equals or exceeds the RA 7641 statutory minimum** (22.5 days × credited years).

- 1 month = 26 days (using 26-day divisor). 26 days > 22.5 days, so a 1-month-per-year gratuity scheme satisfies and exceeds RA 7641.
- The excess (26 - 22.5 = 3.5 days per year) is the company's additional benefit on top of the statutory floor.
- If the company's "gratuity" is described as "1/2 month per year of service" and computed as 15 days, it does NOT satisfy RA 7641 (15 < 22.5). The gap of 7.5 days per year is owed additionally.

### Engine Behavior
- This is handled by the `company-plan-comparison-rules` analysis.
- The engine receives `company_plan_days_per_year: Option<f32>` and compares to 22.5.
- Gap = `max(0, 22.5 - company_plan_days_per_year) × credited_years × daily_rate`
- If gap > 0: emit gap amount. If gap = 0: show "Company plan meets statutory minimum."

---

## EC-16: Employee Hired as Minor (Below 18)

### Legal Rule
- Minors (< 18 years) cannot be legally employed in hazardous work (Labor Code Art. 139).
- Non-hazardous work by minors 15-17 is regulated but permitted under specific conditions.
- Service as a minor counts toward RA 7641 credited years — no exclusion for minority service in the law.

### Engine Behavior
- `birth_date` validation: If retirement_date − birth_date ≥ 18 years at time of retirement, no issue.
- If the hire date implies the employee was < 15 at hire: emit advisory "Employee appears to have been hired before age 15. Verify employment records for accuracy." Do not refuse to compute.
- Compute normally; use the actual hire date provided.

---

## Data Model Additions Required (for Wave 3)

Based on this catalog, the following additions to `RetirementInput` are required:

```rust
// Transfer history (EC-01)
pub transfer_history: Option<Vec<EmployerTransferRecord>>,

// CBA plan input (EC-02)
pub cba_plan: Option<CbaPlanInput>,

// Employment type (EC-03, EC-08, EC-14)
pub employment_type: EmploymentType,

// Employer type for exemption gate (EC-04)
pub employer_type: EmployerType,

// Interrupted service periods (EC-11)
pub service_periods: Option<Vec<ServicePeriod>>,  // If None, use hire_date and retirement_date

// Prior retirement pay received (EC-09)
pub prior_retirement_pay_received: bool,
```

---

## Test Vectors Summary

| ID | Scenario | Key Assertion |
|----|----------|---------------|
| TV-EC-01 | Transfer to related entity, no severance | Aggregate service; credited years = combined total |
| TV-EC-02 | Transfer with severance released | Only terminal employer service credited |
| TV-EC-03 | CBA at 1.5 months/year — above statutory | Enforce CBA; show gap = 0 |
| TV-EC-04 | CBA at 15 days/year — below statutory | Enforce statutory; gap = 7.5 days × years × daily rate |
| TV-EC-05 | CBA retirement at age 55, RA 7641 = 60 | Accept 55 for CBA; compute both; pay higher |
| TV-EC-06 | Fixed-term employee, 7 years | Compute as regular; emit FixedTermStatusDisputed warning |
| TV-EC-07 | Domestic worker (kasambahay) | Error: not covered by RA 7641 |
| TV-EC-08 | Retail employer, 8 employees | Exemption applies; compute reference amount; amber warning |
| TV-EC-09 | Manufacturing employer, 8 employees | NO exemption (not retail/service/agricultural); compute normally |
| TV-EC-10 | Pre-1993 hire, 40-year tenure | All 40 years credited; no 1993 cutoff |
| TV-EC-11 | Part-time employee, 10 years, PHP 10,000/month | Eligible; same formula; daily rate = 10000/26 |
| TV-EC-12 | Broken service, no final pay released | Aggregate both periods |
| TV-EC-13 | Broken service, final pay released in gap | Reset; only post-rehire service counted |
| TV-EC-14 | Second retirement (same employer) | Service reset from rehire; prior_retirement_pay_received = true → no tax exemption |
| TV-EC-15 | Underground mine worker, age 52 | Eligible (age ≥ 50 under RA 8558) |
| TV-EC-16 | General employee, age 52 | Ineligible (age < 60 for General category) |
| TV-EC-17 | Closure due to losses, age 55 | SeparationOnly, sep pay = 0; advisory shown |
| TV-EC-18 | Closure not due to losses, age 62 | DualEntitlement: retirement pay + sep pay |
| TV-EC-19 | Salary increase 3 months before retirement | Latest salary (post-increase) used |
| TV-EC-20 | Extended 4-year "probationary" employee | Treated as regular; 5-year minimum still applies; ineligible at 4y11m |

---

## Legal References

| Citation | Relevance |
|----------|-----------|
| RA 7641, Sec. 1 | Core statute, including ≤10 employee exemption |
| Labor Code Art. 296 | 6-month maximum probationary period |
| Labor Code Art. 298 | Authorized causes, separation pay rates |
| Labor Code Art. 302 (formerly Art. 287) | Retirement pay, service computation rules |
| RA 8558 | Underground mine workers, age 50/60 |
| RA 10361 | Kasambahay (domestic workers) — excludes from RA 7641 |
| RA 10757 | Surface mine workers, age 50/60 |
| DOLE IRR Rule II, Sec. 4 | Service includes authorized absences; continuous or broken service |
| DOLE Labor Advisory, Oct. 24, 1996 | Part-time employees covered; pre-1993 service counts |
| DOLE D.O. No. 174-17 | Contractualization guidelines; project-based vs. regular |
| Eparwa Security v. Liceo de Cagayan | Related entities = single employer |
| Tiu v. Platinum Plans, G.R. No. 163512 | Corporate spin-off: continuous service |
| Brent School v. Zamora, G.R. No. 48494 | Fixed-term employment conditions |
| Aquino v. NLRC, G.R. No. 87653 | Dual entitlement (retirement + separation pay) |
| Civil Code, Art. 777 | Rights transmitted to heirs at death |
| NIRC Sec. 32(B)(6)(a) | Once-in-a-lifetime income tax exemption for retirement pay |
