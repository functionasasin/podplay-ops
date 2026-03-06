# Tax Treatment Conditions — RA 7641 Retirement Pay

**Aspect**: tax-treatment-conditions (Wave 2)
**Analyzed**: 2026-03-06
**Sources**: nirc-tax-exemption.md, bir-approved-plans.md

---

## 1. Two-Track Tax Exemption System

Philippine law provides two independent tracks for tax-exempt retirement pay:

| Feature | Track A: RA 7641 Statutory | Track B: RA 4917 BIR-Approved Plan |
|---------|---------------------------|-------------------------------------|
| Legal basis | NIRC Sec. 32(B)(6)(a) — "mandatory provisions of the Labor Code" | NIRC Sec. 32(B)(6)(a) — "reasonable private benefit plan" |
| Minimum age | 60 (optional retirement) or 65 (compulsory) | 50 |
| Minimum service | 5 years | 10 years (same employer only) |
| BIR plan required | NO | YES — Certificate of Qualification |
| Once-in-a-lifetime | YES | YES |
| Re-employment caveat | YES — exempt revoked if re-employed within 12 months | YES — same |

---

## 2. Track A: RA 7641 Statutory Retirement (Labor Code Mandatory)

### Qualifying Conditions (ALL must be met)

1. **Age**: Employee is at least **60 years old** (optional retirement) OR **65 years old** (compulsory retirement)
2. **Service**: At least **5 years** of service with the same employer
3. **First time**: Availed of **only once** per lifetime — if the employee previously received tax-exempt retirement benefits from any employer, this exemption is NOT available again

### Key Properties

- Exemption flows directly from the Labor Code, NOT from any employer plan
- No BIR Certificate of Qualification required from the employer
- Applies automatically to RA 7641 statutory minimum pay computations
- No withholding tax required on payment

### Re-employment Caveat

If the retired employee is **re-employed by the same employer or any related party** within **12 months** from the retirement date:
- The exemption is retroactively **disallowed**
- Income tax becomes due on the previously exempt amount
- Employer is liable for deficiency withholding tax

---

## 3. Track B: RA 4917 BIR-Approved Plan (Early Retirement)

### Individual-Level Conditions (ALL four must be met)

| # | Condition | Requirement |
|---|-----------|-------------|
| 1 | Age | At least **50 years old** at time of retirement |
| 2 | Service | At least **10 years** of continuous service with the **same employer** |
| 3 | Plan status | Employer holds a BIR-issued **Certificate of Qualification** (Tax-Qualified Plan / TQP) |
| 4 | Frequency | **First time only** — no prior exempt retirement benefit from ANY employer (once-in-a-lifetime across all employers, per RMC 13-2024) |

### Plan-Level Requirements (for employer's plan to be TQP-certified)

The employer's plan must satisfy ALL of the following to hold a Certificate of Qualification:

1. **Written, permanent program** — formal plan document, not temporary
2. **Coverage**: covers ≥ 70% of all employees; of those eligible, ≥ 80% actually covered
3. **Non-discrimination**: no discriminatory contributions/benefits favoring officers, shareholders, supervisors, or highly compensated employees
4. **Employer contributions**: employer must contribute (employee-only plans insufficient)
5. **Non-diversion**: retirement fund corpus/income may not be used for any purpose other than exclusive benefit of employees
6. **Non-forfeitable rights**: accrued benefits are non-forfeitable

### Service Tacking (Multi-Employer Plans)

Service from a previous employer may count toward the 10-year requirement ONLY if ALL three apply:
1. Transfer was due to a valid **corporate merger** (not voluntary resignation or normal rehire)
2. Employee received **no separation pay** from the previous employer
3. Both employers participate in the **same multi-employer plan**

Source: RMC No. 13-2024 (January 22, 2024)

---

## 4. Decision Logic (Tax Determination Algorithm)

```
function determineTaxTreatment(
    age: u32,
    yearsService: u32,              // credited years (post-rounding)
    employerHasBirApprovedPlan: bool,
    employeeHasUsedExemptionBefore: bool,
    retirementType: "optional" | "compulsory" | "early",
    reemployedWithin12Months: bool
) -> TaxTreatment:

    // Short-circuit: second-time retiree or re-employed
    if employeeHasUsedExemptionBefore:
        return TAXABLE (reason: "once-in-a-lifetime limit already used")
    if reemployedWithin12Months:
        return TAXABLE (reason: "re-employed within 12 months — exemption disallowed")

    // Track A: RA 7641 Statutory (age 60-65, 5+ years)
    if age >= 60 AND yearsService >= 5:
        return EXEMPT_TRACK_A (reason: "RA 7641 statutory mandatory labor code provision")

    // Track B: RA 4917 BIR-Approved Plan (age 50-59, 10+ years, BIR plan)
    if age >= 50 AND yearsService >= 10 AND employerHasBirApprovedPlan:
        return EXEMPT_TRACK_B (reason: "RA 4917 BIR-approved retirement plan")

    // Track B conditions partially met — explain failure
    if age >= 50 AND yearsService >= 10 AND NOT employerHasBirApprovedPlan:
        return TAXABLE (reason: "employer has no BIR-approved plan; early retirement taxable")
    if age >= 50 AND yearsService < 10:
        return TAXABLE (reason: "less than 10 years service; Track B requires 10+")
    if age < 50:
        return TAXABLE (reason: "age below 50; no exemption track available")

    return TAXABLE (reason: "conditions not met")
```

---

## 5. Complete Tax Scenario Matrix

| Age | Service | BIR Plan | Used Before | Re-employed <12mo | Tax Status | Track |
|-----|---------|----------|-------------|-------------------|------------|-------|
| 65 | ≥ 5 yrs | No | No | No | **EXEMPT** | A (compulsory) |
| 60-64 | ≥ 5 yrs | No | No | No | **EXEMPT** | A (optional) |
| 60-64 | ≥ 5 yrs | Yes | No | No | **EXEMPT** | A (statutory supersedes) |
| 50-59 | ≥ 10 yrs | Yes | No | No | **EXEMPT** | B (BIR plan) |
| 50-59 | ≥ 10 yrs | No | No | No | **TAXABLE** | None — no BIR plan |
| 50-59 | < 10 yrs | Yes | No | No | **TAXABLE** | None — insufficient service |
| < 50 | any | any | No | No | **TAXABLE** | None — age below minimum |
| any | any | any | Yes | No | **TAXABLE** | None — once-in-a-lifetime used |
| any | any | any | No | Yes | **TAXABLE** | None — re-employed within 12 months |

---

## 6. Tax on Taxable Retirement Pay

When retirement pay is taxable:
- Added to gross income for the taxable year
- Subject to **graduated income tax rates** (NIRC Sec. 24(A))
- 2023 onward rates (under TRAIN Law / RA 10963):
  - 0% on first PHP 250,000
  - 20% on PHP 250,001 – PHP 400,000
  - 25% on PHP 400,001 – PHP 800,000
  - 30% on PHP 800,001 – PHP 2,000,000
  - 32% on PHP 2,000,001 – PHP 8,000,000
  - 35% on over PHP 8,000,000
- Employer must withhold income tax at source
- Note: The calculator should **flag** taxability but **not compute** the graduated tax itself, as that requires full annual income data beyond retirement pay alone

---

## 7. Separation Pay Tax Distinction

Separation pay (Art. 298-299 Labor Code — authorized causes) is governed by a **separate provision**: NIRC Sec. 32(B)(6)(b):
- Exempt **regardless of age or length of service**
- Only for separation due to circumstances **beyond employee's control**: retrenchment, redundancy, closure, disease
- Does NOT apply to voluntary resignation
- Does NOT apply to retirement (retirement is Section 32(B)(6)(a))
- Both retirement pay and separation pay may be simultaneously paid; each has its own exemption analysis

---

## 8. Rust Data Model Requirements

### Input fields required for tax determination:

```rust
pub struct RetirementInput {
    // ... other fields ...
    pub employer_has_bir_approved_plan: bool,
    pub employee_has_used_retirement_exemption: bool,
    pub reemployed_within_12_months: bool,
}
```

### Output fields required:

```rust
pub enum TaxExemptionTrack {
    LaborCodeMandatory,  // Track A
    BirApprovedPlan,     // Track B
    None,                // Taxable
}

pub struct TaxTreatment {
    pub is_tax_exempt: bool,
    pub exemption_track: TaxExemptionTrack,
    pub reason: String,               // Human-readable explanation
    pub bir_plan_required_for_exemption: bool,  // True if Track B needed and plan missing
    pub re_employment_caveat_applies: bool,      // True if exempt but re-employment risk exists
}
```

### TypeScript/JSON output (camelCase):

```typescript
interface TaxTreatment {
  isTaxExempt: boolean;
  exemptionTrack: "LaborCodeMandatory" | "BirApprovedPlan" | "None";
  reason: string;
  birPlanRequiredForExemption: boolean;
  reEmploymentCaveatApplies: boolean;
}
```

---

## 9. NLRC Worksheet Requirements

The NLRC money claim worksheet must include tax treatment:
- State whether retirement pay is exempt or taxable
- If exempt: cite statutory basis (Track A: "Labor Code Art. 302 (RA 7641), mandatory provision" or Track B: "RA 4917, BIR-approved plan")
- If taxable: note that income tax is separately due and retirement pay is included in annual gross income
- Legal citation for tax exemption: "NIRC Sec. 32(B)(6)(a)"

---

## 10. Product UI Requirements

### Input wizard fields needed:
1. `employerHasBirApprovedPlan` — Boolean toggle, label: "Does the employer have a BIR Tax-Qualified Retirement Plan (Certificate of Qualification)?"
   - Helper text: "Required only for employees under age 60 seeking tax exemption"
   - Conditionally shown when: employee age is 50-65 (always show; relevant for both tracks)
2. `employeeHasUsedRetirementExemption` — Boolean toggle, label: "Has this employee previously received tax-exempt retirement benefits from any employer?"
   - Helper text: "The tax exemption may only be used once in a lifetime"
3. `reemployedWithin12Months` — Boolean toggle, label: "Will the employee be re-employed by the same employer within 12 months?"
   - Helper text: "Re-employment within 12 months retroactively disallows the exemption"
   - Default: false

### Results display:
- **Exempt badge** (green): "Tax-Exempt — [Track A: Labor Code / Track B: BIR-Approved Plan]"
- **Taxable badge** (amber): "Taxable — [reason for non-exemption]"
- **Warning alert** (amber): Show when employer has no BIR plan and employee is age 50-59 — "Without a BIR Tax-Qualified Plan, early retirement benefits are taxable. Consider registering a plan with the BIR."

---

## 11. Legal References

- NIRC Sec. 32(B)(6)(a) — exclusion from gross income, retirement benefits
- RA 4917 (1967) — Private Retirement Benefit Plan Tax Exemption Act
- RR No. 1-68 (March 25, 1968) — original implementing rules
- RR No. 15-2025 (April 29, 2025) — revised implementing rules (effective May 15, 2025)
- RMC No. 13-2024 (January 22, 2024) — once-in-a-lifetime rule; multi-employer service tacking
- RR No. 2-98 — withholding tax on compensation (RA 7641 retirement pay listed as exclusion)
- TRAIN Law (RA 10963) — graduated income tax rates for taxable retirement pay
