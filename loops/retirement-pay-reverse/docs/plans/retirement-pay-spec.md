# RA 7641 Retirement Pay Calculator — Implementation Specification

**Version:** 1.0
**Date:** 2026-03-06
**Status:** DRAFT — assembled from all reverse-loop analysis files (Waves 1–6)

This document is the complete specification for building the RA 7641 Retirement Pay Calculator. Every section is fully written. The forward loop must be able to build the entire product from this spec alone without ambiguity.

---

## Table of Contents

1. [Product Overview](#s1-product-overview)
2. [Domain Rules — RA 7641 Law](#s2-domain-rules)
3. [Eligibility Rules](#s3-eligibility-rules)
4. [Credited Years Algorithm](#s4-credited-years-algorithm)
5. [Salary Basis](#s5-salary-basis)
6. [Tax Treatment](#s6-tax-treatment)
7. [Separation Pay Interaction](#s7-separation-pay-interaction)
8. [Company Plan Comparison](#s8-company-plan-comparison)
9. [Death Before Retirement](#s9-death-before-retirement)
10. [Edge Cases](#s10-edge-cases)
11. [Rust Engine — Data Model](#s11-rust-data-model)
12. [Computation Pipeline](#s12-computation-pipeline)
13. [Arithmetic Algorithms](#s13-arithmetic-algorithms)
14. [Batch Engine](#s14-batch-engine)
15. [NLRC Worksheet Generator](#s15-nlrc-worksheet-generator)
16. [Test Vectors](#s16-test-vectors)
17. [Invariants](#s17-invariants)
18. [WASM Bridge Contract](#s18-wasm-bridge)
19. [Serde Wire Format](#s19-serde-wire-format)
20. [Error Contract](#s20-error-contract)
21. [TypeScript Types](#s21-typescript-types)
22. [Zod Schemas](#s22-zod-schemas)
23. [Frontend UI — Wizard](#s23-wizard-ui)
24. [Frontend UI — Results View](#s24-results-view)
25. [Frontend UI — Batch Upload](#s25-batch-upload-ui)
26. [Frontend UI — NLRC Worksheet](#s26-nlrc-ui)
27. [Platform Layer — Auth](#s27-auth)
28. [Platform Layer — Database & Migrations](#s28-database)
29. [Platform Layer — Organizations](#s29-org-model)
30. [Platform Layer — Computation Management](#s30-computation-management)
31. [Platform Layer — Sharing](#s31-sharing)
32. [Platform Layer — Navigation & Layout](#s32-navigation)
33. [Platform Layer — Landing Page](#s33-landing-page)
34. [Platform Layer — Environment Configuration](#s34-env-config)
35. [Build & Deployment — Vite/WASM](#s35-build-config)
36. [Build & Deployment — Fly.io](#s36-deployment)
37. [Testing — Vitest](#s37-vitest)
38. [Testing — Playwright E2E](#s38-playwright)
39. [CI/CD Pipeline](#s39-cicd)
40. [Monorepo File Layout](#s40-file-layout)

---

## S1. Product Overview

### What It Is

A web application for computing Philippine retirement pay under Republic Act No. 7641 (The New Retirement Pay Law, 1992). The primary use cases are:

1. **Single employee computation** — HR professionals and labor lawyers enter employee data; the app computes the correct RA 7641 retirement pay with full breakdown.
2. **Batch computation** — Upload a CSV of employees; compute retirement obligations for up to 5,000 employees at once.
3. **NLRC worksheet** — Generate a formatted Statement of Computation for filing at the National Labor Relations Commission.
4. **Company plan gap analysis** — Compare the employer's retirement plan against the RA 7641 statutory minimum to identify undercoverage.

### Core Value Proposition

Most Philippine employers compute retirement pay using 15 days per year of service. RA 7641 defines "one-half month salary" as **22.5 days** (15 days + 5 days Service Incentive Leave + 2.5 days = 1/12 of 13th month pay). Employers using 15 days underpay every retiring employee by exactly 33%. This is confirmed by the Supreme Court in *Elegir v. Philippine Airlines, G.R. No. 181995 (July 20, 2011)*.

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Computation engine | Rust → WASM via `wasm-pack --target web` |
| Frontend | React 19 + Vite 5 + TanStack Router |
| Styling | Tailwind CSS 4 + shadcn/ui + Radix |
| Auth | Supabase Auth (PKCE flow) |
| Database | Supabase PostgreSQL with RLS |
| PDF export | @react-pdf/renderer |
| Testing | Vitest + Playwright |
| Deployment | Fly.io (static SPA via Nginx) |

### Monorepo Paths

```
apps/retirement-pay/
├── engine/               # Rust WASM engine
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs        # #[wasm_bindgen] exports
│       ├── types.rs      # All Rust types
│       ├── pipeline.rs   # Computation pipeline
│       ├── batch.rs      # Batch processing
│       ├── nlrc/         # NLRC worksheet generator
│       ├── arithmetic.rs # Exact integer arithmetic
│       └── algorithms.rs # Date arithmetic
├── frontend/             # React SPA
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   └── src/
├── Dockerfile            # Multi-stage: Rust + Node + Nginx
└── nginx.conf
```

---

## S2. Domain Rules — RA 7641 Law

### The Statute

Republic Act No. 7641 (December 9, 1992), amending Article 287 (now Art. 302) of the Labor Code of the Philippines.

**Section 1 verbatim (key excerpt):**
> "For the purpose of this Act, the term one-half (1/2) month salary shall mean fifteen (15) days plus one-twelfth (1/12) of the 13th month pay and the cash equivalent of not more than five (5) days of service incentive leaves."

### The 22.5-Day Formula

"One-half month salary" = **22.5 days** per year of credited service:

| Component | Days | Calculation |
|-----------|------|-------------|
| 15 days basic salary | 15 | Daily rate × 15 |
| Service Incentive Leave (SIL) | 5 | Daily rate × 5 |
| 1/12 of 13th month pay | 2.5 | Monthly salary ÷ 12 |
| **Total per credited year** | **22.5** | Sum |

**Unified formula (engine uses this):**
```
retirement_pay_centavos = (monthly_salary_centavos × 45 × credited_years) / 52
```
Where 45/52 = 22.5/26 (exact rational form using 26-day divisor).

**Display components (approximate, ±1 centavo each due to integer division):**
```
component_a = (monthly_salary_centavos × 15) / 26   // 15 days
component_b = (monthly_salary_centavos × 5)  / 26   // 5 days SIL
component_c = monthly_salary_centavos / 12           // 1/12 of 13th month
```
The worksheet displays A+B+C with a note that the final total uses the exact 45/52 formula.

**Salary divisor:** 26 working days/month is the standard per DOLE Labor Advisory 06-20.
For mining workers (RA 8558, RA 10757): 22 working days/month is the alternate divisor.

**Common employer error:** Using 15 days only:
```
erroneous_amount = (monthly_salary_centavos × 15 × credited_years) / 26
underpayment = retirement_pay_centavos - erroneous_amount
```
The correct amount is always 50% higher than the 15-day amount: 22.5 ÷ 15 = 1.50.

### Legal Citations

| Citation | Key Rule |
|----------|---------|
| RA 7641, Sec. 1 (1992) | "One-half month salary" = 22.5 days |
| Labor Code Art. 302 (formerly 287) | Retirement pay entitlement and formula |
| Elegir v. PAL, G.R. No. 181995 (2011) | SC confirmation: 22.5 days |
| IRR of RA 7641, Rule II, Sec. 5 | "Total effective days: 22.5 days (15 + 5 + 2.5)" |
| DOLE Labor Advisory 06-20 | Final pay rules; 26-day divisor |
| NIRC Sec. 32(B)(6)(a) | Retirement pay tax exemption conditions |
| Nacar v. Gallery Frames, G.R. No. 189871 (2013) | Legal interest at 6% per annum |

---

## S3. Eligibility Rules

### Three Gates (All Must Pass)

**Gate 1 — Age**

| Worker Category | Optional Retirement Age | Compulsory Retirement Age | Statute |
|----------------|------------------------|--------------------------|---------|
| General | 60 | 65 | Art. 302 |
| Underground Mine | 50 | 60 | RA 8558 |
| Surface Mine (mill plant, electrical, mechanical, tailings pond) | 50 | 60 | RA 10757 |

CBA may lower the optional retirement age below 60 (e.g., CBA age 55 is valid).

**Gate 2 — Service**

Minimum 5 years (60 months) of credited service with the same employer. The 5-year check uses **raw calendar months** (< 60 months = ineligible), NOT the rounded credited years.

**Gate 3 — Employer Size**

The ≤10 employee exemption applies ONLY to:
- Retail, service, or agricultural establishments
- That have ≤10 regular employees at time of retirement

General (non-retail/non-service/non-agricultural) employers with any headcount are NOT exempt.

When exemption applies: engine still computes retirement pay for reference and shows an amber advisory. The employee may contest the employer's claimed exemption.

### Eligibility Output

```rust
pub enum EligibilityStatus {
    EligibleOptional,              // age >= optional_age, service >= 5yr
    EligibleCompulsory,            // age >= compulsory_age
    Ineligible,
}

pub enum IneligibilityReason {
    AgeTooYoung,
    ServiceTooShort,
    EmployerExemptSmallEstablishment { employee_count: u32 },
}
```

**Ineligibility does NOT halt the pipeline.** All amounts are still computed for reference.

---

## S4. Credited Years Algorithm

### The Rule

RA 7641 Sec. 1: "fraction of at least six (6) months shall be considered one whole year."

### Algorithm

```
1. Compute full_months = full_calendar_months_between(hire_date, retirement_date)
2. full_years = full_months / 12  (integer division)
3. remaining_months = full_months % 12
4. credited_years = if remaining_months >= 6 { full_years + 1 } else { full_years }
5. rounding_applied = remaining_months >= 6
```

### `full_calendar_months_between(start, end)` Algorithm

```
months = (end.year - start.year) * 12 + (end.month - start.month)
if end.day < start.day:
    months -= 1   // partial month not completed
return months
```

Special case: Feb 29 in non-leap year → treat as Feb 28.

### Age Computation

```rust
pub fn full_years_between(birth: NaiveDate, reference: NaiveDate) -> u32 {
    let years = reference.year() - birth.year();
    let birthday_reached = (reference.month(), reference.day()) >= (birth.month(), birth.day());
    if birthday_reached { years as u32 } else { (years - 1) as u32 }
}
```

### 5-Year Gate Uses Raw Months

```rust
let service_months = full_months_between(hire_date, retirement_date);
if service_months < 60 {
    // INELIGIBLE — do NOT use credited_years for this check
}
```

---

## S5. Salary Basis

### What Is Included

- Basic monthly salary (as of last day of employment)
- COLA that has been formally integrated into basic salary
- Regular allowances that are fixed and contractual (guaranteed, not conditional)

### What Is Excluded

- Overtime pay
- Night shift differentials
- Variable/performance bonuses
- Allowances that are non-regular and non-integrated (pure COLA, meal, transportation if not integrated)
- Fringe benefits

### Daily Rate Computation

```
daily_rate_centavos = monthly_salary_centavos / salary_divisor
```
where `salary_divisor` = 26 (default) or 22 (mine workers).

**Important:** The engine never computes a standalone daily_rate for the retirement pay total. The unified formula `(monthly × 45 × years) / 52` is used directly. The daily_rate field in the output is for display purposes only.

### Piece-Rate Employees

```
ADS = total_earnings_last_12mo / actual_working_days
retirement_pay = ADS × (45 / 2) × credited_years
```

---

## S6. Tax Treatment

### Track A — Labor Code Mandatory (NIRC Sec. 32(B)(6)(a))

All four conditions must be met for full exemption:
1. Age ≥ 60 at retirement
2. Service ≥ 5 years
3. First time availing of tax-exempt retirement benefit (once-in-a-lifetime)
4. Retirement under mandatory/optional Labor Code retirement (no BIR plan required)

If all 4 met: entire retirement pay is tax-exempt. No withholding.

### Track B — BIR-Approved Private Plan (RA 4917)

All four conditions:
1. Age ≥ 50 at retirement
2. Service ≥ 10 years
3. First time availing
4. BIR Certificate of Qualification (company has BIR-approved retirement plan)

Track B allows exemption at age 50 vs Track A's age 60.

### RMC 13-2024 "Once-in-a-Lifetime" Rule

- Across ALL employers, not just the current one
- Re-employment within 12 months retroactively disallows exemption
- Engine cannot verify this — emits a `requiresVerification` flag when conditions are met

### Tax Output

```rust
pub enum TaxTreatment {
    FullyExempt { track: ExemptionTrack },
    PartiallyExempt { exempt_amount_centavos: i64, taxable_amount_centavos: i64 },
    FullyTaxable { reason: TaxableReason },
    RequiresVerification { likely_track: ExemptionTrack },
}
```

---

## S7. Separation Pay Interaction

### Dual Entitlement Doctrine

Under *Aquino v. NLRC, G.R. No. 87653* and *Goodyear v. Angus*: retirement pay and separation pay are independent obligations. Both may be owed simultaneously. The crediting clause in a CBA may merge them under a pay-the-higher rule.

### Separation Pay Formula (Labor Code Art. 298)

```
separation_pay = (monthly_salary_centavos × 15 × credited_years) / 26
```
Note: separation pay "½ month" = **15 days** (NOT 22.5 days).

Minimum = 1 month's salary.

### Payment Scenarios

```rust
pub enum PaymentScenario {
    RetirementOnly,                          // Only retirement trigger
    SeparationOnly,                          // Only separation trigger, below retirement age
    DualEntitlement,                         // Both owed, paid separately
    CreditedRetirementHigher,                // Crediting clause: retirement is higher
    CreditedSeparationHigher,               // Crediting clause: separation is higher
    NeitherEligible,
}
```

### Authorized Causes (Art. 298)

| Cause | Separation Pay |
|-------|---------------|
| Retrenchment / Redundancy | ½ month per year (15 days) |
| Closure NOT due to losses | ½ month per year (15 days) |
| Closure DUE TO serious losses | None |
| Disease (Art. 299) | ½ month per year (15 days) |
| Installation of labor-saving devices | 1 month per year |

---

## S8. Company Plan Comparison

### The Rule

RA 7641 is a **floor**, not a cap. The employer must pay the higher of:
- RA 7641 statutory minimum
- Company retirement plan benefit

### Comparison Formula

```
statutory_minimum = (monthly_salary_centavos × 45 × credited_years) / 52
company_benefit   = computed_from_plan_type()
retirement_pay_owed = max(statutory_minimum, company_benefit)
gap = max(0, statutory_minimum - company_benefit)
```

### Plan Types

```rust
pub enum CompanyPlanType {
    DaysPerYear { days: f64 },              // e.g., 26 days = 1 month per year
    MonthsPerYear { months: f64 },          // e.g., 1.5 months per year
    FixedLumpSum { amount_centavos: i64 },  // Total fixed amount
    ManualEntry { amount_centavos: i64 },   // User directly enters company plan amount
    None,
}
```

**Integer conversion for DaysPerYear:**
```rust
let days_times_10 = (days_per_year * 10.0).round() as i64;
let company_benefit = (monthly_salary_centavos * days_times_10 * credited_years as i64) / 260;
```

### PAG-IBIG Offset

Only employer PAG-IBIG contributions can offset retirement pay obligations. Employee contributions cannot.

---

## S9. Death Before Retirement

### The Rule

Heirs are entitled to retirement pay as if the employee had retired on the date of death (Civil Code Art. 777).

### Engine Behavior

- `retirement_date` = date of death
- Same 22.5-day formula applies
- If employee was below age 60 at death: compute the amount AND emit `EligibilityWarning::AgeBelowMinimumAtDeath`
- Benefits payable to heirs; subject to estate tax (6% flat rate under TRAIN Law)

---

## S10. Edge Cases

### EC-01: Company Transfers Between Related Entities

Related companies (common ownership, management overlap, employer-initiated transfer, no prior severance) = single employer for service aggregation. Engine requires user attestation via `is_related_entity: bool` and emits `EligibilityWarning::CompanyTransferServiceAggregationRequired`.

### EC-02: CBA Retirement Provisions

CBA may set lower retirement age (e.g., 55) and higher benefit rate. Engine computes both CBA amount and RA 7641 minimum, pays the higher. CBA provisions that pay LESS than 22.5 days are void pro tanto.

### EC-03: Employment Type

```rust
pub enum EmploymentType {
    Regular,
    Probationary,         // < 6 months → regular by operation of law after 6 months
    ProjectBased,         // Each project standalone; do NOT aggregate
    Seasonal,             // Each season standalone
    FixedTermDisputed,    // Emit warning; compute as regular
    PartTime,             // Same formula; standard 26-day divisor
    Domestic,             // Error: covered by RA 10361, not RA 7641
}
```

### EC-04: DOLE Exemption (≤10 Employees)

Three-part test: (1) retail/service/agricultural type, (2) ≤10 regular employees, (3) per establishment (not per company). Engine always computes the statutory amount for reference even when exemption applies.

### EC-07: Pre-RA 7641 Service

Service before January 7, 1993 counts fully. No cutoff date. Engine uses hire_date directly.

### EC-11: Interrupted Service / Rehire

RA 7641 IRR Rule II, Sec. 4: service includes "continuous or broken" periods. If no severance/final pay was released between the periods, both periods aggregate. If final pay was released (clean break), only the post-rehire period counts.

### EC-12: Latest Salary Rate

RA 7641 uses the salary **in effect on the last day of employment**. Engine trusts the user-inputted monthly_salary field. UI shows guidance: "Enter salary as of retirement date."

### EC-13: 13th Month / SIL Double-Counting

There is NO double-counting. The 5 SIL days and 1/12 of 13th month in the retirement formula are independent of separately accrued SIL and current-year 13th month pay. Engine does not receive or process separately accrued benefits.

---

## S11. Rust Engine — Data Model

**File:** `engine/src/types.rs`

### RetirementInput

```rust
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RetirementInput {
    pub employee_name: String,
    pub company_name: String,
    pub birth_date: NaiveDate,               // "YYYY-MM-DD"
    pub hire_date: NaiveDate,
    pub retirement_date: NaiveDate,
    pub monthly_salary_centavos: i64,        // basic monthly salary in centavos
    pub salary_divisor: u8,                  // 26 (default) or 22 (mining)
    pub worker_category: WorkerCategory,
    pub retirement_type: RetirementType,     // Optional, Compulsory, Death
    pub employer_type: EmployerType,
    pub employer_employee_count: u32,
    pub employment_type: EmploymentType,
    pub salary_type: SalaryType,             // Monthly, DailyRate, PieceRate
    pub authorized_cause: Option<AuthorizedCause>,  // for separation pay computation
    pub company_plan: Option<CompanyPlanInput>,
    pub has_bir_approved_plan: bool,
    pub is_first_time_availing: bool,
    pub prior_retirement_pay_received: bool,
    pub transfer_history: Option<Vec<EmployerTransferRecord>>,
    pub service_periods: Option<Vec<ServicePeriod>>,
    pub cba_plan: Option<CbaPlanInput>,
    pub cba_retirement_age: Option<u8>,
    pub amount_already_paid_centavos: Option<i64>,
}
```

### Enums

```rust
pub enum WorkerCategory { General, UndergroundMine, SurfaceMine }
pub enum RetirementType { Optional, Compulsory, Death }
pub enum EmployerType { General, Retail, Service, Agricultural }
pub enum SalaryType { Monthly, DailyRate, PieceRate }
pub enum AuthorizedCause {
    Retrenchment, Redundancy, ClosureNotDueToLosses,
    ClosureDueToLosses, Disease, InstallationLaborSavingDevices,
}
pub enum EmploymentType {
    Regular, Probationary, ProjectBased, Seasonal,
    FixedTermDisputed, PartTime, Domestic,
}
pub enum CompanyPlanType { DaysPerYear, MonthsPerYear, FixedLumpSum, ManualEntry, None }
pub enum TaxExemptionTrack { TrackA, TrackB }
```

### RetirementOutput

```rust
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RetirementOutput {
    pub employee_name: String,
    pub company_name: String,
    pub eligibility: EligibilityResult,
    pub credited_years_whole: u32,
    pub credited_years_months: u8,
    pub credited_years_rounded: u32,
    pub rounding_applied: bool,
    pub age_at_retirement: u8,
    pub service_months: u32,
    pub monthly_salary_centavos: i64,
    pub salary_divisor: u8,
    pub daily_rate_centavos: i64,            // monthly / divisor (for display)
    pub fifteen_days_pay_centavos: i64,      // component A per year (display)
    pub sil_pay_centavos: i64,               // component B per year (display)
    pub thirteenth_month_pay_centavos: i64,  // component C per year (display)
    pub total_half_month_centavos: i64,      // A+B+C per year (display; may ±1 from exact)
    pub retirement_pay_centavos: i64,        // EXACT: (monthly × 45 × years) / 52
    pub erroneous_15_day_pay_centavos: i64,  // (monthly × 15 × years) / 26
    pub correct_minus_erroneous_centavos: i64,
    pub tax_treatment: TaxTreatmentResult,
    pub separation_pay_comparison: SeparationPayResult,
    pub company_plan_comparison: CompanyPlanResult,
    pub breakdown: ComputationBreakdown,
}

pub struct EligibilityResult {
    pub status: EligibilityStatus,
    pub reasons: Vec<IneligibilityReason>,
    pub warnings: Vec<EligibilityWarning>,
}

pub struct TaxTreatmentResult {
    pub treatment: TaxTreatment,
    pub exempt_amount_centavos: i64,
    pub taxable_amount_centavos: i64,
}

pub struct SeparationPayResult {
    pub separation_pay_basis: SeparationPayBasis,
    pub separation_pay_centavos: Option<i64>,
    pub retirement_pay_is_higher: Option<bool>,
    pub recommended_benefit_centavos: Option<i64>,
    pub payment_scenario: PaymentScenario,
}

pub struct CompanyPlanResult {
    pub company_plan_type: CompanyPlanType,
    pub statutory_minimum_centavos: i64,
    pub company_plan_amount_centavos: Option<i64>,
    pub company_plan_is_sufficient: Option<bool>,
    pub gap_centavos: Option<i64>,
    pub enforced_amount_centavos: i64,   // max(statutory, company)
}
```

### BatchInput / BatchOutput

```rust
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BatchInput {
    pub csv_content: String,   // Full UTF-8 CSV string
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchOutput {
    pub batch_id: String,                    // UUID v4
    pub computed_at: String,                 // ISO 8601 UTC
    pub input_row_count: u32,
    pub summary: BatchSummary,
    pub employees: Vec<BatchRowResult>,
    pub row_errors: Vec<BatchRowError>,
}

pub struct BatchSummary {
    pub total_rows: u32,
    pub parse_error_rows: u32,
    pub computation_error_rows: u32,
    pub eligible_rows: u32,
    pub ineligible_rows: u32,
    pub total_retirement_pay_centavos: i64,
    pub total_fifteen_day_amount_centavos: i64,
    pub total_underpayment_centavos: i64,
    pub avg_retirement_pay_centavos: i64,
    pub median_retirement_pay_centavos: i64,
    pub min_retirement_pay_centavos: i64,
    pub max_retirement_pay_centavos: i64,
    pub avg_credited_years: u32,
    pub potentially_exempt_count: u32,
    pub not_exempt_count: u32,
    pub requires_verification_count: u32,
    pub ineligible_age_count: u32,
    pub ineligible_service_count: u32,
    pub ineligible_small_employer_count: u32,
}
```

### NlrcGenerateInput / NlrcWorksheetOutput

See Section S15 for complete types.

---

## S12. Computation Pipeline

**File:** `engine/src/pipeline.rs`

**Entry point:** `compute_single(input: &RetirementInput) -> RetirementOutput`

Nine steps — all run even when ineligible:

| Step | Operation | Key Outcome |
|------|-----------|-------------|
| 1 | Input validation | `EngineError` if invalid (see S20) |
| 2 | Eligibility check | `EligibilityResult` with status + reasons + warnings |
| 3 | Credited years | `credited_years_rounded`, `rounding_applied` |
| 4 | Daily rate | `daily_rate_centavos = monthly / divisor` (display only) |
| 5 | Retirement pay | `retirement_pay_centavos = (monthly × 45 × years) / 52` |
| 6 | Company plan comparison | `CompanyPlanResult` |
| 7 | Tax treatment | `TaxTreatmentResult` |
| 8 | Separation pay | `SeparationPayResult` |
| 9 | Output assembly | `RetirementOutput` |

**Rule:** Steps 3–9 always produce values regardless of eligibility status. The `retirement_pay_centavos` of an ineligible employee is still computed and returned (for reference and gap analysis).

---

## S13. Arithmetic Algorithms

**File:** `engine/src/arithmetic.rs`

All monetary arithmetic in **i64 centavos**. No floating point in the engine.

### Primary Formula

```rust
pub fn compute_retirement_pay(monthly_centavos: i64, credited_years: u32) -> i64 {
    // retirement_pay = monthly × 45/52 × credited_years
    // multiply-before-divide to minimize truncation
    (monthly_centavos * 45 * credited_years as i64) / 52
}
```

Maximum truncation: < PHP 2.00 for any realistic salary/years combination.

### 15-Day Erroneous Amount

```rust
pub fn compute_erroneous_15day(monthly_centavos: i64, credited_years: u32, divisor: u8) -> i64 {
    (monthly_centavos * 15 * credited_years as i64) / divisor as i64
}
```

### Display Components (approximate)

```rust
pub fn compute_display_components(monthly: i64, divisor: u8) -> (i64, i64, i64) {
    let a = (monthly * 15) / divisor as i64;      // 15 days
    let b = (monthly * 5) / divisor as i64;       // 5 days SIL
    let c = monthly / 12;                          // 1/12 of 13th month
    (a, b, c)
}
```

### Interest (Nacar v. Gallery Frames — 6% per annum)

```rust
pub fn compute_interest(principal: i64, demand_date: NaiveDate, computation_date: NaiveDate) -> i64 {
    let days = (computation_date - demand_date).num_days() as i64;
    (principal * 6 * days) / 36500  // truncate (never round up against employer)
}
```

---

## S14. Batch Engine

**File:** `engine/src/batch.rs`

### CSV Schema

**Required columns (case-insensitive, underscores or spaces):**
`employee_id`, `employee_name`, `birth_date`, `hire_date`, `retirement_date`, `monthly_salary`, `worker_category`, `employer_employee_count`, `employer_type`

**Optional columns:**
`salary_divisor` (default 26), `has_company_plan` (default false), `company_plan_monthly_benefit`, `notes`

**CSV format rules:**
- UTF-8 encoding (BOM stripped)
- CRLF or LF line endings
- RFC 4180 quoting
- Comment rows (first char `#`) silently skipped
- Maximum 5,000 data rows per file; maximum 10 MB

### Processing Order

1. Parse CSV → per-row `BatchRowInput` or `BatchRowError`
2. Per-row compute via `compute_single()` → `BatchRowResult`
3. Aggregate → `BatchSummary`
4. Output preserves CSV row order

Duplicate `employee_id`: first occurrence processed; subsequent = `duplicate_employee_id` error.

### Batch-Level Errors (abort entire batch)

| Code | Condition |
|------|-----------|
| `batch_too_large` | > 5,000 data rows |
| `batch_empty` | Header only, no data rows |
| `missing_columns` | Required column absent |
| `invalid_encoding` | Not valid UTF-8 |
| `not_csv` | Cannot parse as CSV |

### Row-Level Error Codes

`invalid_date_format`, `invalid_date_value`, `date_range_violation`, `age_below_minimum`, `invalid_salary`, `invalid_worker_category`, `invalid_employer_type`, `invalid_salary_divisor`, `duplicate_employee_id`, `missing_required_field`, `company_plan_missing_benefit`

---

## S15. NLRC Worksheet Generator

**File:** `engine/src/nlrc/`

### What It Generates

A structured `NlrcWorksheetOutput` that the frontend renders into a @react-pdf/renderer layout without further computation. All amounts are pre-computed; all dates are pre-formatted.

### WASM Entry Points

```rust
// Single employee
#[wasm_bindgen]
pub fn generate_nlrc_json(input_json: &str) -> String

// Multi-employee (from batch)
#[wasm_bindgen]
pub fn generate_nlrc_batch_json(input_json: &str) -> String
```

### NlrcGenerateInput (combined input)

```json
{
  "retirement": { ...RetirementInput... },
  "nlrc": {
    "caseNumber": null,
    "regionalBranch": "Regional Arbitration Branch IV — Calamba City",
    "exhibitLabel": "A",
    "dateFiled": null,
    "complainantFullName": "DELA CRUZ, Juan Santos",
    "complainantPosition": "Production Supervisor",
    "respondentName": "ABC Manufacturing Corporation",
    "respondentAddress": "123 Industrial Road, Calamba City",
    "preparedByName": "Atty. Maria B. Reyes",
    "attorneyRollNo": "12345",
    "attorneyPtrNo": "PTR No. 2345678 / Jan. 5, 2026 / Makati City",
    "attorneyIbpNo": "IBP No. 98765 / Jan. 3, 2026 / Makati",
    "attorneyMcleNo": "MCLE Compliance No. VI-0123456 / April 1, 2025",
    "lawFirmName": "Reyes & Associates Law Office",
    "lawFirmAddress": "Suite 501, Alpha Tower, Makati City",
    "amountAlreadyPaidCentavos": null,
    "dateOfDemand": "2026-02-15",
    "includeInterest": true,
    "includeEmployerComparison": true,
    "includeTaxTreatment": true
  }
}
```

**Demand letter mode:** When `caseNumber` and `dateFiled` are both null → title changes to "STATEMENT OF COMPUTATION" without EXHIBIT label; certification uses DEMAND format; no interest section.

### Worksheet Sections

| Section | Content |
|---------|---------|
| A | Document header: EXHIBIT label, NLRC case number, parties |
| B | Employee information: name, position, birth/hire/retirement dates, service length |
| C | Salary basis: monthly salary, divisor, daily rate |
| D | 22.5-day decomposition: components A, B, C with amounts; note on approximate vs exact |
| E | Credited years of service: computation with rounding applied/not |
| F | Retirement pay total: formula × credited years |
| G | 15-day employer error comparison (if `includeEmployerComparison`) |
| H | Amount already paid / balance due (if `amountAlreadyPaidCentavos` present) |
| I | Legal interest at 6% per annum — Nacar formula (if `includeInterest`) |
| J | Tax treatment note (if `includeTaxTreatment`) |
| K | Legal citations: RA 7641, Art. 302, Elegir v. PAL, IRR Rule II Sec. 5 (+ Nacar if interest) |
| L | Certification / signature block |

### PDF Layout

- Paper: Legal (8.5" × 13")
- Margins: 1.0" top/bottom, 1.25" left/right
- Font: Times New Roman 12pt body, 14pt bold headings
- Fits on one page for standard cases

---

## S16. Test Vectors

**File:** `engine/src/tests.rs` — `assert_invariants(input, output)` called in every test.

### Core Single-Employee Vectors

**TV-01: Standard DOLE example (Juan dela Cruz)**
- Input: monthly PHP 20,000 (2_000_000 centavos), hire 1994-01-01, retirement 2024-03-15, age 60, General
- Service: 30 years 2 months → 30 credited years (2 months < 6, no round-up)
- Expected: `retirement_pay_centavos = (2_000_000 × 45 × 30) / 52 = 51_923_076` (PHP 519,230.76)
- Erroneous 15-day: `(2_000_000 × 15 × 30) / 26 = 34_615_384` (PHP 346,153.84)
- Underpayment: `17_307_692` centavos (PHP 173,076.92)

**TV-02: Rounding UP (6+ remaining months)**
- Input: hire 1994-01-01, retirement 2024-07-01 → service = 30 years 6 months → credited_years = **31**
- Verify: rounding_applied = true

**TV-03: Rounding DOWN (5 remaining months)**
- Input: hire 1994-01-01, retirement 2024-06-01 → service = 30 years 5 months → credited_years = **30**
- Verify: rounding_applied = false

**TV-04: Ineligible — age (general employee, age 55)**
- Input: birth 1969-01-01, retirement 2024-01-01 → age = 55 < 60
- Expected: eligibility.status = Ineligible, reasons = [AgeTooYoung]
- Still compute retirement_pay for reference

**TV-05: Ineligible — service (4 years 11 months)**
- service_months = 59 < 60 → Ineligible, reasons = [ServiceTooShort]

**TV-06: Tax exempt Track A**
- age 62, service 15 years, first_time = true, no BIR plan
- Expected: TaxTreatment = FullyExempt { track: TrackA }

**TV-07: Tax exempt Track B**
- age 52, service 11 years, first_time = true, has_bir_approved_plan = true
- Expected: TaxTreatment = FullyExempt { track: TrackB }

**TV-08: Not exempt (age < 60, no BIR plan)**
- age 58, service 10 years, no BIR plan
- Expected: TaxTreatment = FullyTaxable

**TV-09: Death case**
- retirement_type = Death; retirement_date = date of death
- Same formula; emit AgeBelowMinimumAtDeath if age < 60

**TV-10: Separation pay — retirement higher**
- authorized_cause = Retrenchment; age 62, 25 years service, monthly PHP 50,000
- retirement_pay = (5_000_000 × 45 × 25) / 52 = 108_173_076
- separation_pay = (5_000_000 × 15 × 25) / 26 = 72_115_384
- Expected: retirement_pay_is_higher = true, recommended = retirement_pay

**TV-11: Dual entitlement**
- Employee meets BOTH retirement eligibility AND was retrenched
- Expected: payment_scenario = DualEntitlement (both paid separately)

**TV-12: Small employer exemption**
- employer_type = Retail, employee_count = 8
- Expected: eligibility.status = Ineligible, reasons = [EmployerExemptSmallEstablishment]
- retirement_pay still computed for reference

**TV-13: Pre-1993 service**
- hire_date = 1985-06-01, retirement_date = 2025-06-01 → credited_years = 40 (no cutoff)

**TV-14: Mine worker (age 52)**
- worker_category = UndergroundMine, age 52
- Expected: eligible (age >= 50)

**TV-15: Company plan — gap detected**
- company_plan = DaysPerYear(15.0), monthly PHP 30,000, 20 years
- statutory = (3_000_000 × 45 × 20) / 52 = 51_923_076
- company = (3_000_000 × 15 × 20) / 26 = 34_615_384
- gap = 17_307_692 centavos

### Batch Vectors

**TB-01: Mixed eligibility (3 employees)** — EMP001 eligible, EMP002 ineligible age, EMP003 eligible compulsory
**TB-02: Parse error row** — invalid date month 13
**TB-03: Duplicate employee_id** — second occurrence = parse_error
**TB-04: Small employer in batch** — still computes with warning

### NLRC Vectors

**TNW-01: Standard with interest** — 19 days elapsed; interest = (balance × 6 × 19) / 36500
**TNW-02: Demand letter mode** — no case number, no interest
**TNW-03: With prior partial payment** — balance_due = retirement_pay - amount_paid

---

## S17. Invariants

`assert_invariants(input: &RetirementInput, output: &RetirementOutput)` must be called in every unit test.

### Arithmetic Invariants

| ID | Rule |
|----|------|
| INV-A1 | `retirement_pay_centavos >= 0` for all inputs |
| INV-A2 | `erroneous_15_day_pay_centavos >= 0` |
| INV-A3 | `correct_minus_erroneous_centavos >= 0` (correct always ≥ erroneous) |
| INV-A4 | `retirement_pay_centavos == (monthly × 45 × credited_years) / 52` (exact) |
| INV-A5 | Formula numerator factor = 45 always (never 15 or 30) |
| INV-A6 | If `monthly_salary_centavos = 0`, all pay amounts = 0 |

### Eligibility Invariants

| ID | Rule |
|----|------|
| INV-E1 | If eligible → `credited_years_rounded >= 5` |
| INV-E2 | Ineligibility never blocks computation (amounts always present) |
| INV-E3 | Small employer ineligibility → `company_plan_comparison.gap_centavos = null` |

### Temporal Invariants

| ID | Rule |
|----|------|
| INV-T1 | `age_at_retirement = full_years_between(birth_date, retirement_date)` (exact) |
| INV-T2 | `service_months = full_months_between(hire_date, retirement_date)` (exact) |
| INV-T3 | If `remaining_months >= 6` → `credited_years_rounded = whole_years + 1` |
| INV-T4 | If `remaining_months < 6` → `credited_years_rounded = whole_years` |
| INV-T5 | `service_months >= 60` ↔ service gate passes (independent of age gate) |

### Pipeline Invariants

| ID | Rule |
|----|------|
| INV-P1 | All 9 pipeline steps always run |
| INV-P2 | Output contains no null monetary fields (always i64 values, never Option in output) |
| INV-P3 | `compute_single` is a pure function (no global state, no side effects) |

### Boundary Invariants

| ID | Rule |
|----|------|
| INV-B1 | Maximum truncation across all arithmetic: < PHP 2.00 for realistic salary/years |
| INV-B2 | Interest truncates downward (never rounds up against employer) |
| INV-B3 | Company plan gap >= 0 always (negative gap = 0, plan is sufficient) |

---

## S18. WASM Bridge Contract

### Build Command

```bash
# Run from apps/retirement-pay/engine/
wasm-pack build --target web --out-dir ../../frontend/src/wasm/pkg
```

### Output Files

```
frontend/src/wasm/pkg/
├── retirement_pay_engine.js          # ESM loader
├── retirement_pay_engine_bg.wasm     # WASM binary
├── retirement_pay_engine.d.ts        # TypeScript declarations (auto-generated)
└── retirement_pay_engine_bg.wasm.d.ts
```

The `pkg/` directory is **gitignored**. Rebuilt by CI before tests.

### Exported Functions

```typescript
// From retirement_pay_engine.d.ts
export function compute_single_json(input_json: string): string;
export function compute_batch_json(input_json: string): string;
export function generate_nlrc_json(input_json: string): string;
export function initSync(module: WebAssembly.Module | BufferSource): InitOutput;
export default function init(input?: RequestInfo | URL | Response | BufferSource): Promise<InitOutput>;
```

### Browser Init (`src/wasm/bridge.ts`)

```typescript
import init, { compute_single_json, compute_batch_json, generate_nlrc_json }
  from './pkg/retirement_pay_engine.js';

let _initialized = false;
let _initPromise: Promise<void> | null = null;

export async function initWasm(): Promise<void> {
  if (_initialized) return;
  if (_initPromise) return _initPromise;
  _initPromise = init().then(() => { _initialized = true; });
  return _initPromise;
}

export { compute_single_json, compute_batch_json, generate_nlrc_json };
```

### Node.js Init (`src/wasm/bridge.node.ts`)

```typescript
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { initSync } from './pkg/retirement_pay_engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const wasmBytes = readFileSync(join(__dirname, './pkg/retirement_pay_engine_bg.wasm'));
initSync(wasmBytes);

export { compute_single_json, compute_batch_json, generate_nlrc_json }
  from './pkg/retirement_pay_engine.js';
```

### App Bootstrap (`src/main.tsx`)

```typescript
async function bootstrap() {
  try {
    await initWasm();
  } catch (error) {
    // Render fatal error page — no Tailwind needed here
    const root = createRoot(document.getElementById('root')!);
    root.render(<WasmLoadError error={error} />);
    return;
  }
  const root = createRoot(document.getElementById('root')!);
  root.render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
}
bootstrap();
```

WASM is initialized BEFORE the React router mounts. No route component ever calls WASM before init completes.

### Web Worker for Large Batches

For > 50 employees, computation runs in a Web Worker to avoid blocking the main thread:

```typescript
// src/workers/batch.worker.ts
// INIT message: fetch WASM bytes via fetch(wasmUrl), then initSync(bytes)
// COMPUTE message: call compute_batch_json(JSON.stringify(input)), postMessage RESULT
```

Threshold: `BATCH_WORKER_THRESHOLD = 50`

### Vite Plugin Order (MANDATORY)

```typescript
plugins: [
  react(),          // 1st
  wasm(),           // 2nd — BEFORE topLevelAwait
  topLevelAwait(),  // 3rd
  tsconfigPaths(),  // any order
]
```

Reversing `wasm()` and `topLevelAwait()` produces broken production output.

---

## S19. Serde Wire Format

### Input Structs

```rust
#[serde(rename_all = "camelCase", deny_unknown_fields)]
```

`deny_unknown_fields` on ALL input structs prevents silent field name typos from being ignored.

### Output Structs

```rust
#[serde(rename_all = "camelCase")]
// deny_unknown_fields NOT on output (Rust owns it; no external input)
```

### Field Type Rules

| Rust Type | JSON Representation |
|-----------|-------------------|
| `i64` (centavos) | JSON integer |
| `u32`, `u8` | JSON integer |
| `NaiveDate` | `"YYYY-MM-DD"` string |
| `bool` | `true` / `false` |
| `Option<T>` in output | `null` if None (NEVER omitted) |
| `Option<T>` in input | `null` or absent (both accepted) |
| `String` | JSON string |
| Enum | camelCase string (e.g., `"workersGeneral"` → check exact variant names below) |

### Enum Wire Names (camelCase)

```
WorkerCategory:     "general" | "undergroundMine" | "surfaceMine"
RetirementType:     "optional" | "compulsory" | "death"
EmployerType:       "general" | "retail" | "service" | "agricultural"
EmploymentType:     "regular" | "probationary" | "projectBased" | "seasonal"
                    | "fixedTermDisputed" | "partTime" | "domestic"
AuthorizedCause:    "retrenchment" | "redundancy" | "closureNotDueToLosses"
                    | "closureDueToLosses" | "disease" | "installationLaborSavingDevices"
CompanyPlanType:    "daysPerYear" | "monthsPerYear" | "fixedLumpSum" | "manualEntry" | "none"
EligibilityStatus:  "eligibleOptional" | "eligibleCompulsory" | "ineligible"
TaxTreatment:       "fullyExempt" | "partiallyExempt" | "fullyTaxable" | "requiresVerification"
PaymentScenario:    "retirementOnly" | "separationOnly" | "dualEntitlement"
                    | "creditedRetirementHigher" | "creditedSeparationHigher" | "neitherEligible"
```

### Result Envelope

```json
// Success:
{ "Ok": { ...T... } }

// Error:
{ "Err": { "code": "validationFailed", "message": "...", "fields": [...] } }
```

All three WASM exports always return one of these two shapes.

---

## S20. Error Contract

**File:** `engine/src/errors.rs`

### EngineError

```rust
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineError {
    pub code: ErrorCode,
    pub message: String,
    pub fields: Vec<FieldError>,
}

pub enum ErrorCode {
    ParseError,        // wire: "parseError"
    ValidationFailed,  // wire: "validationFailed"
    InternalError,     // wire: "internalError"
    SerializationError,// wire: "serializationError"
}

pub struct FieldError {
    pub field: String,
    pub code: FieldErrorCode,
    pub message: String,
}

pub enum FieldErrorCode {
    AgeTooYoung, ServiceTooShort, DateOrder, DateInFuture,
    InvalidSalary, InvalidDivisor, InvalidEnum, MissingRequired,
    // wire: camelCase — "ageTooYoung", "serviceTooShort", etc.
}
```

### Validation Rules

All validation errors are **collected** before returning (not fail-fast). A single call returns all field errors at once.

| Rule | Field | Error Code |
|------|-------|-----------|
| `hire_date >= retirement_date` | hire_date / retirement_date | `dateOrder` |
| `retirement_date > today` | retirement_date | `dateInFuture` |
| `birth_date >= hire_date` | birth_date | `dateOrder` |
| `monthly_salary_centavos <= 0` | monthlySalaryCentavos | `invalidSalary` |
| `monthly_salary_centavos > 999_999_999` | monthlySalaryCentavos | `invalidSalary` |
| `salary_divisor not in [22, 26]` | salaryDivisor | `invalidDivisor` |
| `age_at_hire < 15 years` | birthDate | advisory (not error) |

**Ineligibility is NOT an error.** Ineligible employees return a valid `RetirementOutput` with `eligibility.status = "ineligible"`.

---

## S21. TypeScript Types

**Files:** `src/types/engine.ts`, `src/types/ui.ts`

### Key Mapping Rules

| Rust | TypeScript |
|------|-----------|
| `i64` | `number` (integer) |
| `Option<T>` | `T \| null` (NEVER `T \| undefined`) |
| `NaiveDate` | `string` (YYYY-MM-DD) |
| Enum | string union literal |

### Core Interfaces

```typescript
// src/types/engine.ts

export interface RetirementInput {
  employeeName: string;
  companyName: string;
  birthDate: string;
  hireDate: string;
  retirementDate: string;
  monthlySalaryCentavos: number;
  salaryDivisor: 22 | 26;
  workerCategory: WorkerCategory;
  retirementType: RetirementType;
  employerType: EmployerType;
  employerEmployeeCount: number;
  employmentType: EmploymentType;
  salaryType: SalaryType;
  authorizedCause: AuthorizedCause | null;
  companyPlan: CompanyPlanInput | null;
  hasBirApprovedPlan: boolean;
  isFirstTimeAvailing: boolean;
  priorRetirementPayReceived: boolean;
  transferHistory: EmployerTransferRecord[] | null;
  servicePeriods: ServicePeriod[] | null;
  cbaPlan: CbaPlanInput | null;
  cbaRetirementAge: number | null;
  amountAlreadyPaidCentavos: number | null;
}

export interface RetirementOutput {
  employeeName: string;
  companyName: string;
  eligibility: EligibilityResult;
  creditedYearsWhole: number;
  creditedYearsMonths: number;
  creditedYearsRounded: number;
  roundingApplied: boolean;
  ageAtRetirement: number;
  serviceMonths: number;
  monthlySalaryCentavos: number;
  salaryDivisor: number;
  dailyRateCentavos: number;
  fifteenDaysPayCentavos: number;
  silPayCentavos: number;
  thirteenthMonthPayCentavos: number;
  totalHalfMonthCentavos: number;
  retirementPayCentavos: number;
  erroneous15DayPayCentavos: number;
  correctMinusErroneousCentavos: number;
  taxTreatment: TaxTreatmentResult;
  separationPayComparison: SeparationPayResult;
  companyPlanComparison: CompanyPlanResult;
  breakdown: ComputationBreakdown;
}

export type WorkerCategory = 'general' | 'undergroundMine' | 'surfaceMine';
export type RetirementType = 'optional' | 'compulsory' | 'death';
export type EmployerType = 'general' | 'retail' | 'service' | 'agricultural';
export type EmploymentType = 'regular' | 'probationary' | 'projectBased' | 'seasonal'
  | 'fixedTermDisputed' | 'partTime' | 'domestic';
export type EligibilityStatus = 'eligibleOptional' | 'eligibleCompulsory' | 'ineligible';
export type TaxTreatment = 'fullyExempt' | 'partiallyExempt' | 'fullyTaxable' | 'requiresVerification';
export type PaymentScenario = 'retirementOnly' | 'separationOnly' | 'dualEntitlement'
  | 'creditedRetirementHigher' | 'creditedSeparationHigher' | 'neitherEligible';
export type SeparationPayBasis = 'authorizedCause' | 'retrenchment' | 'redundancy'
  | 'closure' | 'disease' | 'notApplicable';

export type EngineResult<T> = { Ok: T } | { Err: EngineError };
export interface EngineError { code: string; message: string; fields: FieldError[]; }
export interface FieldError { field: string; code: string; message: string; }
```

### Utility Functions

```typescript
// src/utils/money.ts
export function formatCentavos(centavos: number): string {
  return '₱' + (centavos / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
export function parsePesosToCentavos(input: string): number {
  return Math.round(parseFloat(input.replace(/[₱,]/g, '')) * 100);
}
```

---

## S22. Zod Schemas

**Files:** `src/schemas/engine-input.ts`, `src/schemas/engine-output.ts`, `src/schemas/ui-forms.ts`

### Key Rules

- All input schemas: `.strict()` (reject unknown fields)
- `z.boolean()` — NOT `z.coerce.boolean()`
- `z.nullable()` for wire Optional fields — NOT `z.optional()`
- `z.number().int()` for centavo fields
- Dates: `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)`

### RetirementInputSchema (wire)

```typescript
export const RetirementInputSchema = z.object({
  employeeName: z.string().min(1).max(128),
  companyName: z.string().min(1).max(128),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  retirementDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  monthlySalaryCentavos: z.number().int().positive().max(999_999_999),
  salaryDivisor: z.union([z.literal(22), z.literal(26)]),
  workerCategory: z.enum(['general', 'undergroundMine', 'surfaceMine']),
  retirementType: z.enum(['optional', 'compulsory', 'death']),
  employerType: z.enum(['general', 'retail', 'service', 'agricultural']),
  employerEmployeeCount: z.number().int().positive(),
  employmentType: z.enum(['regular', 'probationary', 'projectBased', 'seasonal',
    'fixedTermDisputed', 'partTime', 'domestic']),
  salaryType: z.enum(['monthly', 'dailyRate', 'pieceRate']),
  authorizedCause: z.enum(['retrenchment', 'redundancy', 'closureNotDueToLosses',
    'closureDueToLosses', 'disease', 'installationLaborSavingDevices']).nullable(),
  companyPlan: CompanyPlanInputSchema.nullable(),
  hasBirApprovedPlan: z.boolean(),
  isFirstTimeAvailing: z.boolean(),
  priorRetirementPayReceived: z.boolean(),
  transferHistory: z.array(EmployerTransferRecordSchema).nullable(),
  servicePeriods: z.array(ServicePeriodSchema).nullable(),
  cbaPlan: CbaPlanInputSchema.nullable(),
  cbaRetirementAge: z.number().int().min(40).max(70).nullable(),
  amountAlreadyPaidCentavos: z.number().int().nonnegative().nullable(),
}).strict().superRefine((data, ctx) => {
  if (data.hireDate >= data.retirementDate) {
    ctx.addIssue({ code: 'custom', path: ['hireDate'], message: 'hire_date must be before retirement_date' });
  }
  if (data.birthDate >= data.hireDate) {
    ctx.addIssue({ code: 'custom', path: ['birthDate'], message: 'birth_date must be before hire_date' });
  }
});
```

### Wizard Step Schemas (UI forms — accept string inputs)

```typescript
export const WizardStep1Schema = z.object({
  employeeName: z.string().min(1, 'Required'),
  companyName: z.string().min(1, 'Required'),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  employerType: z.enum(['general', 'retail', 'service', 'agricultural']),
  employerEmployeeCount: z.string().regex(/^\d+$/).transform(Number),
  employmentType: z.enum(['regular', 'probationary', 'projectBased', 'seasonal',
    'fixedTermDisputed', 'partTime', 'domestic']),
}).strict();

// Steps 2–5: similar pattern with string inputs for dates/numbers
// formStateToInput(step1, step2, step3, step4, step5): RetirementInput
```

### EngineResultSchema Factory

```typescript
export function EngineResultSchema<T extends z.ZodTypeAny>(schema: T) {
  return z.union([
    z.object({ Ok: schema }).strict(),
    z.object({ Err: EngineErrorSchema }).strict(),
  ]);
}
```

---

## S23. Wizard UI

**Route:** `/compute/new` and `/compute/$id/edit`

**File:** `src/pages/compute/new.tsx`

### 5 Steps

| Step | Title | Key Fields | WASM Call? |
|------|-------|-----------|-----------|
| 1 | Employee & Employer | name, company, birth date, employer type, headcount, employment type | No |
| 2 | Employment Details | hire date, retirement date, retirement type, authorized cause, worker category | No |
| 3 | Salary & Benefits | monthly salary (centavos), salary divisor, salary type | No |
| 4 | Tax & Benefits | has_bir_approved_plan, is_first_time_availing, prior_retirement_pay_received | No |
| 5 | Company Plan (optional) | plan type, plan parameters | No |
| Submit | Review | (review step; no new inputs) | Yes — `compute_single_json` |

### Wizard State Management

```typescript
// src/hooks/useWizard.ts
const useWizard = () => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [formData, setFormData] = useState<Partial<WizardFormState>>({});
  // ...
  const submit = async (input: RetirementInput): Promise<void> => {
    // 1. call compute_single_json
    // 2. parse result
    // 3. save to supabase.computations
    // 4. navigate to /compute/$id/results
  };
};
```

### Step Navigation Rules

- "Next" validates current step's Zod schema before advancing
- "Back" never validates; goes to previous step (preserving data)
- Step 5 is skippable ("Skip" → submit directly with `companyPlan: null`)
- Progress indicator: horizontal stepper showing 1–5 with active/completed states

---

## S24. Results View

**Routes:** `/compute/$id/results` (auth), `/share/$token` (public)

### Components

| Component | File | Condition to Render |
|-----------|------|---------------------|
| `ResultsPageHeader` | `components/results/ResultsPageHeader.tsx` | Always (auth mode only) |
| `EligibilityBadgeCard` | `components/results/EligibilityBadgeCard.tsx` | Always |
| `UnderpaymentHighlightCard` | `components/results/UnderpaymentHighlightCard.tsx` | Always (core value) |
| `PayBreakdownCard` | `components/results/PayBreakdownCard.tsx` | Always |
| `TaxTreatmentAlert` | `components/results/TaxTreatmentAlert.tsx` | Always |
| `SeparationPayComparisonCard` | `components/results/SeparationPayComparisonCard.tsx` | When `separationPayBasis !== 'notApplicable'` |
| `CompanyPlanComparisonCard` | `components/results/CompanyPlanComparisonCard.tsx` | When company plan present |
| `ResultsActionsRow` | `components/results/ResultsActionsRow.tsx` | Auth mode only (not share mode) |
| `ResultsPageSkeleton` | `components/results/ResultsPageSkeleton.tsx` | While loading |

### UnderpaymentHighlightCard (Core Value Prop)

Two-column comparison: left (green) = correct 22.5-day amount; right (gray, strikethrough) = erroneous 15-day amount. Below: amber highlighted underpayment delta. This card MUST always render — it is the product's core message.

### ResultsActionsRow Buttons

- "NLRC Worksheet" → `<Link to="/compute/$id/nlrc">`
- "Export PDF" → calls `usePdfExport(output)` hook
- "New Computation" → `<Link to="/compute/new">`
- "Delete" → opens `<AlertDialog>` confirm → `supabase.from('computations').delete().eq('id', id)` → navigate to `/dashboard`

### Share Mode Differences

When rendered at `/share/$token`:
- No `ResultsPageHeader` (no edit/delete)
- Banner: "Shared computation — read only. Sign up to create your own."
- Action row: PDF export + "Sign Up to Save Computations" CTA only
- Data fetched via `supabase.rpc('get_shared_computation', { p_token: token })` (anon role)

---

## S25. Batch Upload UI

**Routes:** `/batch/new` (upload + compute), `/batch/$id` (results)

### State Machine

```
idle → file-selected → computing → results (navigate to /batch/$id)
                                 ↘ error (batch-level)
```

### Components

| Component | File | Purpose |
|-----------|------|---------|
| `CsvDropZone` | `components/batch/CsvDropZone.tsx` | Drag-and-drop or click to select |
| `FilePreviewCard` | `components/batch/FilePreviewCard.tsx` | Preview after file selected |
| `ComputingProgressCard` | `components/batch/ComputingProgressCard.tsx` | Spinner during WASM computation |
| `BatchErrorCard` | `components/batch/BatchErrorCard.tsx` | Batch-level errors |
| `BatchResultsHeader` | `components/batch/BatchResultsHeader.tsx` | Title + export + share buttons |
| `BatchSummaryCard` | `components/batch/BatchSummaryCard.tsx` | 3-stat tile aggregate |
| `BatchResultsTable` | `components/batch/BatchResultsTable.tsx` | Filterable/sortable/paginated table |
| `BatchRowDetail` | `components/batch/BatchRowDetail.tsx` | Right sheet with per-row breakdown |
| `BatchExportMenu` | `components/batch/BatchExportMenu.tsx` | CSV + PDF export dropdown |
| `BatchResultsSkeleton` | `components/batch/BatchResultsSkeleton.tsx` | Loading state |

### Critical Implementation Detail

WASM computation is synchronous (blocks main thread). Wrap in `setTimeout(fn, 50)` so the `ComputingProgressCard` renders before blocking:

```typescript
useEffect(() => {
  if (state.phase !== 'computing') return;
  const timer = setTimeout(async () => {
    const result = compute_batch_json(JSON.stringify({ csvContent }));
    // ...
  }, 50);
  return () => clearTimeout(timer);
}, [state.phase]);
```

### Table Features

- Filter tabs: All / Eligible / Ineligible / Errors
- Sort: row number, name, retirement pay, underpayment, credited years, status
- Pagination: 100 rows per page
- Error rows: `bg-red-50`, error message inline
- Ineligible rows: `bg-orange-50`, monetary cells show `—`
- Details: Radix Sheet from right edge with full breakdown

### Export Options

| Export | Format | Filename Pattern |
|--------|--------|-----------------|
| Full results | CSV | `batch-results-{name}-{date}.csv` |
| Eligible only | CSV | `batch-eligible-{name}-{date}.csv` |
| Error rows | CSV | `batch-errors-{name}-{date}.csv` |
| Summary report | PDF | `batch-summary-{name}-{date}.pdf` |
| NLRC worksheets | PDF | One per eligible employee |

CSV Blob download pattern: `URL.createObjectURL(blob)` → `<a>` click → `URL.revokeObjectURL`.

---

## S26. NLRC Worksheet UI

**Route:** `/compute/$id/nlrc`

**File:** `src/pages/compute/[id]/nlrc.tsx`

### Two Panels

1. **Input form** (left panel): case metadata, parties, attorney info, optional fields (interest, employer comparison, tax section toggles). Form state → `NlrcGenerateInput`.
2. **Preview** (right panel): read-only rendered worksheet using `generate_nlrc_json` WASM call.

### PDF Export

Uses @react-pdf/renderer with Legal paper (8.5" × 13"), Times New Roman 12pt. Exported via `renderToStream()` or `pdf().toBlob()`.

### Print Mode

`@media print` hides sidebar and topbar. `<Button onClick={() => window.print()}>` triggers browser print.

---

## S27. Auth

**Files:** `src/routes/auth/sign-in.tsx`, `sign-up.tsx`, `callback.tsx`, `forgot-password.tsx`, `update-password.tsx`

### Supabase Client Setup

```typescript
// src/lib/supabase.ts
export const supabase = createClient<Database>(
  supabaseUrl ?? '',
  supabaseAnonKey ?? '',
  { auth: { flowType: 'pkce', autoRefreshToken: true, persistSession: true, detectSessionInUrl: true } }
)
export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
```

### Auth Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/auth/sign-in` | `SignInPage` | Email/password + magic link |
| `/auth/sign-up` | `SignUpPage` | Account creation |
| `/auth/callback` | `AuthCallbackPage` | PKCE code exchange + magic link landing |
| `/auth/forgot-password` | `ForgotPasswordPage` | Request reset email |
| `/auth/update-password` | `UpdatePasswordPage` | Set new password after reset |

### Auth Guard (TanStack Router)

```typescript
// src/routes/_authenticated.tsx
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: '/auth/sign-in' });
  },
});
```

All authenticated routes are children of `_authenticated.tsx`.

### Supabase Dashboard Config

- **Site URL:** `https://retirement-pay.fly.dev`
- **Redirect URLs:** `https://retirement-pay.fly.dev/auth/callback`, `http://localhost:5173/auth/callback`
- Email confirmation: OFF in dev (use Inbucket at `localhost:54324`), ON in production

---

## S28. Database & Migrations

**Files:** `supabase/migrations/` (idempotent, sequential timestamps)

### Tables

#### `organizations`
```sql
CREATE TABLE IF NOT EXISTS public.organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  slug        TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  industry    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `organization_members`
```sql
CREATE TABLE IF NOT EXISTS public.organization_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, user_id)
);
```

#### `organization_invitations`
```sql
CREATE TABLE IF NOT EXISTS public.organization_invitations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invited_by      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  token           UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `computations`
```sql
CREATE TABLE IF NOT EXISTS public.computations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  title           TEXT NOT NULL DEFAULT '',
  mode            TEXT NOT NULL CHECK (mode IN ('single', 'batch')),
  status          TEXT NOT NULL CHECK (status IN ('draft', 'computed', 'shared')),
  input           JSONB NOT NULL,
  output          JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `shared_links`
```sql
CREATE TABLE IF NOT EXISTS public.shared_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  computation_id  UUID NOT NULL REFERENCES public.computations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token           UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (computation_id)   -- One share link per computation
);
```

### RLS Policies

All tables: `ENABLE ROW LEVEL SECURITY`.

`computations`:
- SELECT: `auth.uid() = user_id OR organization_id IN (user's orgs)`
- INSERT/UPDATE/DELETE: `auth.uid() = user_id`

`shared_links`:
- SELECT: `auth.uid() = user_id` (owner can view) OR via RPC (anon via `get_shared_computation`)
- INSERT: `auth.uid() = user_id`
- DELETE: `auth.uid() = user_id`

### RPCs

#### `create_organization(p_name TEXT, p_slug TEXT, p_industry TEXT) → UUID`

```sql
CREATE OR REPLACE FUNCTION public.create_organization(
  p_name TEXT, p_slug TEXT, p_industry TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_org_id UUID;
BEGIN
  INSERT INTO organizations (name, slug, industry) VALUES (p_name, p_slug, p_industry)
  RETURNING id INTO v_org_id;
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (v_org_id, auth.uid(), 'owner');
  RETURN v_org_id;
END;
$$;
-- No anon GRANT (requires authenticated user)
```

#### `get_shared_computation(p_token UUID) → JSONB`

```sql
CREATE OR REPLACE FUNCTION public.get_shared_computation(p_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_result JSONB;
BEGIN
  SELECT to_jsonb(c.*) INTO v_result
  FROM computations c
  JOIN shared_links sl ON sl.computation_id = c.id
  WHERE sl.token = p_token;
  RETURN v_result;
END;
$$;

-- CRITICAL: anon must be able to call this for public share links
REVOKE ALL ON FUNCTION public.get_shared_computation(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_computation(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_shared_computation(UUID) TO authenticated;
```

**WARNING:** If the anon GRANT is missing, `supabase.rpc('get_shared_computation', ...)` returns `{ data: null, error: null }` for all tokens — silent failure. Verify with:
```sql
SELECT has_function_privilege('anon', 'public.get_shared_computation(uuid)', 'execute');
-- Must return: true
```

### Supabase Gotchas

1. **`SECURITY DEFINER` always needs `SET search_path = public`** — prevents schema injection attacks.
2. **`shared_links.token` is UUID type, not TEXT** — frontend must pass a UUID string. `supabase.rpc('get_shared_computation', { p_token: token })` — `token` is already a UUID string from the URL param.
3. **Email confirmation in dev** — Set `enable_confirmations = false` in `supabase/config.toml` or check Inbucket at `localhost:54324`.
4. **Migration idempotency** — All migrations use `IF NOT EXISTS`, `CREATE OR REPLACE`. Safe to run `supabase db reset` + re-apply.

---

## S29. Organizations

**Files:** `src/types/org.ts`, `src/hooks/useOrganization.ts`, `src/hooks/useOrgMembers.ts`, `src/routes/org/`

### TypeScript Types

```typescript
export type OrgRole = 'owner' | 'admin' | 'member';
export type OrgIndustry = 'manufacturing' | 'retail' | 'hospitality' | 'healthcare'
  | 'finance' | 'bpo' | 'other';

export interface Organization { id: string; name: string; slug: string; industry: OrgIndustry; createdAt: string; }
export interface OrgMember { id: string; organizationId: string; userId: string; role: OrgRole; joinedAt: string; email?: string; fullName?: string; }
export interface OrgInvitation { id: string; organizationId: string; invitedBy: string; email: string; role: 'admin' | 'member'; token: string; expiresAt: string; }
```

### `useOrganization()` Hook

```typescript
// src/hooks/useOrganization.ts
// Fetches org_members joined with organizations for current user
// currentOrg: OrgSummary | null — preference stored in localStorage key "retirement_pay_current_org_id"
// allOrgs: OrgSummary[]
// setCurrentOrg(orgId): updates localStorage
```

### Org Routes

| Route | Page | Auth | Purpose |
|-------|------|------|---------|
| `/org` | `OrgIndexPage` | Yes | Redirect to first org or "Create org" |
| `/org/new` | `CreateOrgPage` | Yes | Create org wizard |
| `/org/$orgId` | `OrgSettingsPage` | Yes (member) | General settings |
| `/org/$orgId/members` | `OrgMembersPage` | Yes (admin+) | Member list |
| `/org/$orgId/invitations` | `OrgInvitationsPage` | Yes (admin+) | Pending invitations |

---

## S30. Computation Management

### ComputationRecord

```typescript
// src/types/computation.ts
export type ComputationStatus = 'draft' | 'computed' | 'shared';

export interface ComputationRecord {
  id: string;
  userId: string;
  organizationId: string | null;
  title: string;
  input: RetirementInput;
  output: RetirementOutput | null;   // null for 'draft'
  status: ComputationStatus;
  createdAt: string;
  updatedAt: string;
}
```

### Status Workflow

```
draft → computed → shared
  ↑         ↓
  └── edit ──┘        (re-run wizard updates output, stays 'computed')
shared → computed     (revoke share link)
computed → deleted    (delete action)
```

### Dashboard

**Route:** `/dashboard`
**File:** `src/routes/_authenticated/dashboard.tsx`

Shows `ComputationCard` grid (single computations) and `BatchCard` list. Each card: employee name (or batch filename), date, retirement pay amount, status badge. Click → navigate to results page.

**Empty state:** "No computations yet. Start with a new computation." + primary CTA button.

### Hooks

- `useComputations()` — fetches all computations for user+org (TanStack Query)
- `useComputation(id)` — fetches single record
- `useComputationActions(id)` — `deleteComputation()`, `updateTitle()`

---

## S31. Sharing

### Share Link Creation

1. User clicks "Share" on results page → `ShareDialog` opens
2. Frontend inserts into `shared_links`: `{ computation_id, user_id, token: uuid }` — `UNIQUE (computation_id)` means inserting again revokes the old token
3. Frontend updates computation `status` to `'shared'`
4. Dialog shows: `https://{origin}/share/{token}` in read-only input
5. "Copy Link" → `navigator.clipboard.writeText(url)` → toast "Link copied"
6. "Revoke" → `supabase.from('shared_links').delete().eq('computation_id', id)` + status back to `'computed'`

### Share Link Access (anon)

```typescript
// src/hooks/useSharedComputation.ts
export function useSharedComputation(token: string) {
  // supabase.rpc('get_shared_computation', { p_token: token })
  // token must be UUID string — matches RPC parameter type UUID
}
```

**CRITICAL:** `p_token` is UUID type in the RPC. The TanStack Router param `$token` is a string from the URL. Pass it directly — Supabase JS client handles UUID string → PostgreSQL UUID coercion.

---

## S32. Navigation & Layout

**Files:** `src/components/layout/AppShell.tsx`, `Sidebar.tsx`, `MobileTopBar.tsx`, `MobileDrawer.tsx`, `NavLinks.tsx`, `OrgSwitcher.tsx`, `UserMenu.tsx`

### AppShell

The `_authenticated.tsx` layout renders `<AppShell>`. Desktop: fixed 256px left sidebar. Mobile: top bar with hamburger + Sheet drawer.

```tsx
<div className="min-h-screen bg-slate-50">
  <Sidebar />                           // hidden below lg
  <MobileTopBar onMenuClick={...} />    // hidden at lg+
  <MobileDrawer open={...} onClose={...} />
  <main className="lg:pl-64">
    <div className="py-8 px-4">
      {children}
    </div>
  </main>
</div>
```

### Nav Items

| Label | Route | Icon | Active Strategy |
|-------|-------|------|-----------------|
| Dashboard | `/dashboard` | `LayoutDashboard` | Exact match |
| New Computation | `/compute/new` | `Plus` | Exact match |
| Batch Upload | `/batch/new` | `FileSpreadsheet` | Exact match |
| Organization | `/org` | `Building2` | Prefix match |
| Settings | `/settings` | `Settings` | Exact match |

### OrgSwitcher

Shows current org name. Dropdown lists all orgs + "Create Organization". Current org stored in `localStorage("retirement_pay_current_org_id")`.

### UserMenu

Avatar initials (from `user_metadata.full_name`), truncated email, `LogOut` icon button. Sign-out: `supabase.auth.signOut()` → toast → navigate to `/auth/sign-in`.

### Print Override

```css
@media print {
  aside, header.mobile-topbar, .no-print { display: none !important; }
  main { padding-left: 0 !important; }
}
```

---

## S33. Landing Page

**Route:** `/`
**File:** `src/routes/index.tsx` + `src/components/landing/`

`beforeLoad`: if session → redirect to `/dashboard`. Otherwise renders `LandingPage`.

### Sections (in order)

1. **LandingNav** — sticky; logo + Sign in + Get started
2. **HeroSection** — amber pill badge ("Most employers underpay by 33%"); H1 "Compute RA 7641 Retirement Pay correctly"; 22.5 days explanation; Elegir citation; CTA buttons
3. **SampleComputationTeaser** — static example: Maria Santos, 20 years, PHP 50,000/month. Two-column comparison: incorrect (₱576,923) vs correct (₱852,564). Underpayment callout: ₱275,640
4. **UnderpaymentExplainerSection** — 3-panel formula (15 + 5 + 2.5 days); RA 7641 Sec. 1 blockquote; Elegir citation
5. **FeaturesSection** — 6 feature cards: single calculator, batch, plan gap, NLRC, PDF, share
6. **LegalCredibilitySection** — 3 pillars: RA 7641, Elegir v. PAL, DOLE LA 06-20
7. **SignUpCTASection** — dark background; "Create free account" + "Sign in"
8. **LandingFooter** — logo + legal disclaimer

Landing page is **entirely static** — no API calls, no loading states.

---

## S34. Environment Configuration

### Required Variables

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project REST + Auth endpoint |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous API key |

### Files

```
apps/retirement-pay/frontend/
├── .env.local.example      # Committed template
├── .env.local              # Gitignored; developer fills in
└── src/vite-env.d.ts       # ImportMetaEnv augmentation
```

### SetupPage Pattern

`src/lib/supabase.ts` exports `supabaseConfigured: boolean`. Root layout (`src/routes/__root.tsx`) checks: if `!supabaseConfigured` → render `<SetupPage />` instead of the app.

`SetupPage` shows which variables are set/missing + copy-paste template.

### Production (Fly.io)

Vite embeds env vars at **build time**. Pass as Docker build args:
```bash
fly deploy \
  --build-arg VITE_SUPABASE_URL=... \
  --build-arg VITE_SUPABASE_ANON_KEY=...
```

### TypeScript Declaration

```typescript
// src/vite-env.d.ts
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}
```

---

## S35. Build Configuration

### Vite Config

```typescript
// apps/retirement-pay/frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    react(),
    wasm(),           // BEFORE topLevelAwait — mandatory order
    topLevelAwait(),
    tsconfigPaths(),
  ],
  build: {
    target: 'esnext', // required for top-level await
    rollupOptions: {
      output: { assetFileNames: 'assets/[name]-[hash][extname]' },
    },
  },
  assetsInclude: ['**/*.wasm'],   // treat .wasm as asset, not JS
});
```

### Vitest Config

```typescript
// apps/retirement-pay/frontend/vitest.config.ts
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',          // NOT jsdom — fs needed for WASM
    pool: 'forks',                // CRITICAL for WASM in Node.js
    setupFiles: ['src/wasm/bridge.node.ts'],
    globals: true,
  },
});
```

### TypeScript Config

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client"],
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "skipLibCheck": true          // skip wasm-bindgen generated .d.ts
  }
}
```

---

## S36. Deployment (Fly.io)

### Dockerfile

**Path:** `apps/retirement-pay/Dockerfile`

```dockerfile
# Stage 1: Rust WASM
FROM rust:1.82-slim AS rust-builder
WORKDIR /engine
RUN cargo install wasm-pack
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*
RUN rustup target add wasm32-unknown-unknown
COPY engine/ .
RUN wasm-pack build --target web --out-dir /engine/pkg

# Stage 2: Vite frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
COPY --from=rust-builder /engine/pkg ./src/wasm/pkg
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
RUN npm run build
RUN ls dist/assets/*.wasm || (echo "ERROR: WASM missing from dist/assets/" && exit 1)

# Stage 3: Nginx
FROM nginx:1.27-alpine AS production
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/app.conf
COPY --from=frontend-builder /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Config

**Path:** `apps/retirement-pay/nginx.conf`

```nginx
server {
    listen 8080;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json
               application/wasm;

    # SPA routing — all non-file paths serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # WASM content type
    location ~* \.wasm$ {
        add_header Content-Type application/wasm;
        expires 1y;
    }

    # Static assets — long cache
    location ~* \.(js|css|png|jpg|ico|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy strict-origin-when-cross-origin;
}
```

### fly.toml

**Path:** `apps/retirement-pay/fly.toml`

```toml
app = "retirement-pay"
primary_region = "sin"    # Singapore — closest to Philippines

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  memory = "256mb"
  cpu_kind = "shared"
  cpus = 1
```

### Deploy Command

```bash
fly deploy \
  --build-arg VITE_SUPABASE_URL=$(fly secrets get VITE_SUPABASE_URL) \
  --build-arg VITE_SUPABASE_ANON_KEY=$(fly secrets get VITE_SUPABASE_ANON_KEY)
```

### Production Verification Checklist

After `fly deploy`:
1. Navigate to production URL
2. Open Network tab — verify `.wasm` file loads (not 404), has `Content-Type: application/wasm`
3. Run a single computation — verify WASM initializes and result appears
4. Test a share link at `/share/{uuid}` from unauthenticated browser tab
5. Verify Supabase `get_shared_computation` anon grant: `SELECT has_function_privilege('anon', 'public.get_shared_computation(uuid)', 'execute');` → must return `true`

---

## S37. Vitest (Unit Tests)

**File structure:** `src/**/*.test.ts`, `src/**/*.spec.ts`

### Engine Test Pattern

```typescript
// src/wasm/engine.test.ts
// bridge.node.ts runs initSync() in setupFiles before this file
import { compute_single_json } from '../wasm/bridge.node';
import { RetirementInputSchema } from '../schemas/engine-input';
import { RetirementOutputSchema } from '../schemas/engine-output';

test('TV-01: standard DOLE example', () => {
  const input: RetirementInput = { /* Juan dela Cruz */ };
  const rawResult = compute_single_json(JSON.stringify(input));
  const result = JSON.parse(rawResult);
  expect('Ok' in result).toBe(true);
  const output = result.Ok;
  expect(output.retirementPayCentavos).toBe(51_923_076);
  expect(output.erroneous15DayPayCentavos).toBe(34_615_384);
  expect(output.correctMinusErroneousCentavos).toBe(17_307_692);
  expect(output.creditedYearsRounded).toBe(30);
  expect(output.roundingApplied).toBe(false);
});

// All 26+ test vectors from S16 must pass
// assert_invariants() equivalent validated in every test via output schema
```

---

## S38. Playwright E2E

**File:** `e2e/*.spec.ts` or `tests/e2e/`

### Required Scenarios

| Scenario | Steps |
|----------|-------|
| Auth flow | Sign up → confirm email (local Inbucket) → sign in → dashboard visible |
| Sign-in | Enter credentials → dashboard |
| Sign-out | Click sign-out → landing page |
| Single computation wizard | Fill all 5 steps → submit → results page shows correct amounts |
| Results page | Verify UnderpaymentHighlightCard shows underpayment > 0 |
| Share link | Create share link → copy → open in new tab (no auth) → same results |
| Revoke share | Revoke → open old link → "invalid link" page |
| Batch upload | Upload test CSV → compute → results table shows correct rows |
| Batch export | Download CSV → verify content |
| NLRC worksheet | Navigate to `/compute/$id/nlrc` → fill form → verify preview renders |
| PDF export | Click "Export PDF" → verify download initiates (check `page.waitForEvent('download')`) |
| Delete computation | Confirm dialog → deleted → not in dashboard |
| Org create | Create org → slug auto-generated → member appears with owner role |

---

## S39. CI/CD Pipeline

**File:** `.github/workflows/retirement-pay.yml`

Triggers on push/PR to `main` affecting `apps/retirement-pay/**`.

### Jobs (dependency order)

```
typecheck ─┐
           ├─ vitest ─┐
lint ──────┘           ├─ build ─── playwright ─── deploy (main only)
```

### Job Summary

| Job | Command | Condition |
|-----|---------|-----------|
| typecheck | `npm run typecheck` (tsc --noEmit) | All branches |
| lint | `npm run lint` (ESLint zero warnings, `--max-warnings 0`) | All branches |
| vitest | `wasm-pack build` + `npm run test` | Needs typecheck + lint |
| build | `wasm-pack build` + `npm run build` + verify `.wasm` in `dist/assets/` | Needs vitest |
| playwright | Serve `dist/` with `npx serve` + `npx playwright test` | Needs build |
| deploy | `fly deploy --build-arg ...` | Main branch only, needs playwright |

### Rust + Node Caching

```yaml
- uses: dtolnay/rust-toolchain@v1
  with:
    toolchain: '1.82'
    targets: wasm32-unknown-unknown

- uses: actions/cache@v4
  with:
    path: |
      ~/.cargo/registry
      ~/.cargo/git
      apps/retirement-pay/engine/target
    key: rust-${{ hashFiles('apps/retirement-pay/engine/Cargo.lock') }}

- uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: 'npm'
    cache-dependency-path: apps/retirement-pay/frontend/package-lock.json
```

### Required GitHub Secrets

| Secret | Used In |
|--------|---------|
| `FLY_API_TOKEN` | `fly deploy` in deploy job |
| `VITE_SUPABASE_URL` | Build args (typecheck uses empty strings; deploy uses real values) |
| `VITE_SUPABASE_ANON_KEY` | Build args |

---

## S40. Monorepo File Layout

Complete file tree for the forward loop to create:

```
apps/retirement-pay/
├── Dockerfile
├── nginx.conf
├── fly.toml
│
├── engine/
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs               # #[wasm_bindgen] exports: compute_single_json, compute_batch_json,
│       │                        #   generate_nlrc_json, generate_nlrc_batch_json
│       ├── types.rs             # RetirementInput, RetirementOutput, all supporting types
│       ├── pipeline.rs          # compute_single(input) -> RetirementOutput (9 steps)
│       ├── batch.rs             # compute_batch(csv) -> BatchOutput
│       ├── arithmetic.rs        # compute_retirement_pay, compute_interest, display components
│       ├── algorithms.rs        # full_months_between, full_years_between
│       ├── errors.rs            # EngineError, FieldError, error codes
│       ├── invariants.rs        # assert_invariants (called in tests)
│       └── nlrc/
│           ├── mod.rs           # NlrcWorksheetGenerator struct
│           ├── types.rs         # NlrcGenerateInput, NlrcWorksheetOutput, NlrcBatchInput
│           ├── interest.rs      # compute_interest (6% Nacar)
│           ├── format.rs        # format_money, format_date
│           └── citations.rs     # static citation text blocks
│
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── vitest.config.ts
    ├── tsconfig.json
    ├── .env.local.example
    ├── .gitignore
    └── src/
        ├── main.tsx                       # bootstrap() — initWasm() before router mount
        ├── router.ts                      # TanStack Router createRouter
        ├── vite-env.d.ts                  # ImportMetaEnv augmentation
        │
        ├── wasm/
        │   ├── pkg/                       # gitignored — wasm-pack output
        │   ├── bridge.ts                  # async init() for browser
        │   ├── bridge.node.ts             # sync initSync() for vitest
        │   ├── api.ts                     # computeSingle(), computeBatch(), generateNlrc()
        │   ├── helpers.ts                 # unwrapWasmResult(), WasmEngineError
        │   └── batch-worker-client.ts     # computeBatchInWorker() > 50 employees
        │
        ├── workers/
        │   └── batch.worker.ts            # Web Worker for large batches
        │
        ├── lib/
        │   ├── supabase.ts                # createClient, supabaseConfigured
        │   ├── database.types.ts          # supabase gen types output
        │   └── utils.ts                   # cn() from shadcn
        │
        ├── contexts/
        │   └── AuthContext.tsx            # AuthProvider, useAuth()
        │
        ├── types/
        │   ├── engine.ts                  # RetirementInput, RetirementOutput, all engine types
        │   ├── computation.ts             # ComputationRecord, BatchComputationRecord
        │   ├── org.ts                     # Organization, OrgMember, OrgInvitation
        │   └── ui.ts                      # UI-only types (wizard state, etc.)
        │
        ├── schemas/
        │   ├── engine-input.ts            # RetirementInputSchema, BatchInputSchema
        │   ├── engine-output.ts           # RetirementOutputSchema, BatchOutputSchema
        │   ├── engine-error.ts            # EngineErrorSchema
        │   ├── enums.ts                   # Enum schemas
        │   ├── ui-forms.ts                # WizardStep1-5Schema, formStateToInput()
        │   └── index.ts                   # re-exports
        │
        ├── hooks/
        │   ├── useWizard.ts               # wizard state, submit
        │   ├── useComputation.ts          # useComputation(id)
        │   ├── useComputations.ts         # useComputations() — dashboard list
        │   ├── useComputationActions.ts   # delete, update title
        │   ├── useSharedComputation.ts    # get_shared_computation RPC
        │   ├── useBatchRecord.ts          # fetch batch from Supabase
        │   ├── useSaveBatchComputation.ts # save batch output
        │   ├── usePdfExport.ts            # @react-pdf/renderer → download
        │   └── useOrganization.ts         # useOrganization() — current org, all orgs
        │
        ├── utils/
        │   ├── money.ts                   # formatCentavos, parsePesosToCentavos
        │   └── dates.ts                   # formatDate, parseDateString
        │
        ├── components/
        │   ├── ui/                        # shadcn/ui components (auto-generated)
        │   ├── SetupPage.tsx              # Missing env vars guide
        │   ├── layout/
        │   │   ├── AppShell.tsx
        │   │   ├── Sidebar.tsx
        │   │   ├── MobileTopBar.tsx
        │   │   ├── MobileDrawer.tsx
        │   │   ├── NavLinks.tsx
        │   │   ├── OrgSwitcher.tsx
        │   │   └── UserMenu.tsx
        │   ├── landing/
        │   │   ├── LandingPage.tsx
        │   │   ├── LandingNav.tsx
        │   │   ├── HeroSection.tsx
        │   │   ├── SampleComputationTeaser.tsx
        │   │   ├── UnderpaymentExplainerSection.tsx
        │   │   ├── FeaturesSection.tsx
        │   │   ├── LegalCredibilitySection.tsx
        │   │   ├── SignUpCTASection.tsx
        │   │   └── LandingFooter.tsx
        │   ├── results/
        │   │   ├── ResultsPageHeader.tsx
        │   │   ├── EligibilityBadgeCard.tsx
        │   │   ├── UnderpaymentHighlightCard.tsx
        │   │   ├── PayBreakdownCard.tsx
        │   │   ├── TaxTreatmentAlert.tsx
        │   │   ├── SeparationPayComparisonCard.tsx
        │   │   ├── CompanyPlanComparisonCard.tsx
        │   │   ├── ResultsActionsRow.tsx
        │   │   └── ResultsPageSkeleton.tsx
        │   ├── batch/
        │   │   ├── CsvDropZone.tsx
        │   │   ├── FilePreviewCard.tsx
        │   │   ├── ComputingProgressCard.tsx
        │   │   ├── BatchErrorCard.tsx
        │   │   ├── BatchResultsHeader.tsx
        │   │   ├── BatchSummaryCard.tsx
        │   │   ├── BatchResultsTable.tsx
        │   │   ├── BatchRowDetail.tsx
        │   │   ├── BatchExportMenu.tsx
        │   │   └── BatchResultsSkeleton.tsx
        │   └── shared/
        │       ├── ShareButton.tsx        # Share dialog trigger
        │       ├── ShareDialog.tsx        # Create/copy/revoke share link
        │       ├── PdfExportButton.tsx    # Reusable PDF download button
        │       ├── TaxTreatmentBadge.tsx  # Badge variant by tax treatment
        │       └── ComputationCard.tsx    # Dashboard card
        │
        ├── routes/
        │   ├── __root.tsx                 # RootLayout: SetupPage check, QueryClient, AuthProvider
        │   ├── index.tsx                  # / → LandingPage (redirect if authed)
        │   ├── _authenticated.tsx         # Layout: beforeLoad auth guard + AppShell
        │   ├── auth/
        │   │   ├── sign-in.tsx
        │   │   ├── sign-up.tsx
        │   │   ├── callback.tsx
        │   │   ├── forgot-password.tsx
        │   │   └── update-password.tsx
        │   ├── _authenticated/
        │   │   ├── dashboard.tsx
        │   │   ├── compute/
        │   │   │   ├── new.tsx            # 5-step wizard
        │   │   │   └── $id/
        │   │   │       ├── results.tsx
        │   │   │       ├── edit.tsx       # Pre-populated wizard
        │   │   │       └── nlrc.tsx       # NLRC worksheet form + preview
        │   │   ├── batch/
        │   │   │   ├── new.tsx
        │   │   │   └── $id.tsx
        │   │   ├── org/
        │   │   │   ├── index.tsx
        │   │   │   ├── new.tsx
        │   │   │   └── $orgId/
        │   │   │       ├── index.tsx
        │   │   │       ├── members.tsx
        │   │   │       └── invitations.tsx
        │   │   └── settings.tsx
        │   ├── share/
        │   │   └── $token.tsx             # Public share page (no auth)
        │   └── setup.tsx                  # SetupPage route
        │
        └── pdf/
            ├── RetirementPayPdf.tsx       # Single computation PDF layout
            ├── BatchSummaryPdf.tsx        # Batch summary PDF layout
            └── NlrcWorksheetPdf.tsx       # NLRC worksheet PDF layout
```

---

## Appendix A: Design System

### Color Semantic Roles

| Role | Tailwind Classes | Usage |
|------|-----------------|-------|
| Correct / green | `bg-green-50`, `text-green-800`, `border-green-500` | Correct amounts, eligible status, sufficient plan |
| Underpayment / amber | `bg-amber-50`, `text-amber-900`, `border-amber-300` | Underpayment highlight, warnings |
| Error / red | `bg-red-50`, `text-red-700`, `border-red-400` | Ineligible status, validation errors, insufficient plan |
| Legal / blue | `bg-blue-50`, `text-blue-700`, `border-blue-200` | Legal citations, info alerts |
| Neutral / gray | `bg-gray-50`, `text-gray-600` | Default content, labels |

### Typography

- Body: Inter variable font
- Money values: always `font-mono` Tailwind class
- Large money amounts: `text-2xl font-bold font-mono`
- Section labels: `text-xs uppercase tracking-wide`

### Required shadcn Components

`button`, `card` (+ Header/Content/Footer/Title/Description), `alert` (+ Title/Description), `badge`, `input`, `label`, `table` (+ Header/Body/Row/Head/Cell), `dialog` (+ Header/Footer/Title/Description/Content), `alert-dialog`, `sheet` (+ Content/Title/Trigger), `dropdown-menu` (full), `separator`, `skeleton`, `select`, `checkbox`, `tabs`, `toast` (via sonner), `progress`

### Toaster

Use `sonner` (not shadcn toast). `<Toaster richColors position="top-right" />` in root layout.

### Lucide Icon Vocabulary

`AlertTriangle`, `AlertCircle`, `CheckCircle2`, `XCircle`, `TrendingUp`, `Calculator`, `FileText`, `Download`, `Upload`, `UploadCloud`, `FileSpreadsheet`, `FileDown`, `Loader2`, `Scale`, `Building2`, `Shield`, `ShieldCheck`, `ShieldX`, `Share2`, `Pencil`, `Trash2`, `Plus`, `ChevronDown`, `ChevronLeft`, `ChevronRight`, `Menu`, `LogOut`, `User`, `LayoutDashboard`, `Settings`, `BookOpen`, `BarChart3`, `ArrowRight`, `RefreshCw`, `X`, `Check`

---

## Appendix B: PDF Export Layouts

### Single Computation PDF (`RetirementPayPdf.tsx`)

- Paper: A4 landscape or Letter portrait
- Sections: Header (employee name, company, date), Eligibility, 22.5-day breakdown table, Tax treatment, Separation pay comparison (if applicable), Company plan comparison (if applicable), Legal basis citations, Disclaimer
- Firm branding: logo placeholder area at top right

### NLRC Worksheet PDF (`NlrcWorksheetPdf.tsx`)

- Paper: Legal (8.5" × 13")
- Matches exactly the worksheet sections A–L from S15
- Single employee: one document
- Multi-employee: cover page + one section per employee + summary page

### Batch Summary PDF (`BatchSummaryPdf.tsx`)

- Paper: Letter or A4
- Sections: Header (batch name, date, employee count), Summary statistics table, Eligible employees table (name, credited years, salary, retirement pay, underpayment), Ineligible employees table, Tax treatment distribution, Company plan gap summary (if applicable), Compliance advisory note

---

## Appendix C: Inherited Lessons — 5 Failure Modes to Prevent

These are anti-patterns from prior apps that MUST be explicitly avoided:

| # | Failure | Prevention |
|---|---------|------------|
| 1 | Production build never tested; WASM 404 in production | Dockerfile: `RUN ls dist/assets/*.wasm \|\| exit 1`. CI build job verifies WASM presence. Post-deploy checklist includes network tab verification. |
| 2 | `get_shared_computation` RPC used TEXT param; frontend passed UUID; silent null return | RPC parameter is `UUID` type. Frontend passes raw UUID string. Verified by `has_function_privilege('anon', ...)` SQL check. |
| 3 | Missing anon GRANT on `get_shared_computation` | Migration explicitly: `REVOKE ALL FROM PUBLIC; GRANT EXECUTE TO anon; GRANT EXECUTE TO authenticated;` Verified by SQL check post-migration. |
| 4 | PDF export button rendered but `onClick` handler not wired | `ResultsActionsRow` spec explicitly defines `onClick={exportPdf}` on the PDF button with `usePdfExport(output)` hook. Playwright E2E scenario: PDF export. |
| 5 | Components rendered without shadcn wrapper; unstyled output | Visual verification: every major component has `<Card>`, `<Alert>`, `<Badge>`, or `<Table>` wrapper as its root element. No raw `<div>` islands for data display. |
