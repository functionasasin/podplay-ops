# Analysis: fetch-bir-approved-plans

**Wave**: 1 (Domain Source Acquisition)
**Date**: 2026-03-06
**Status**: Complete
**Source cached at**: `input/sources/bir-approved-plans.md`

---

## What Was Fetched

BIR requirements for qualifying a private retirement benefit plan as a "Tax-Qualified Plan" (TQP), based on:
- RR No. 15-2025 (April 29, 2025) — supersedes RR 1-68 (1968), effective May 15, 2025
- RMC No. 13-2024 — multi-employer service tacking clarification
- RA 4917 (1967) — original authorizing statute

---

## Key Findings

### 1. Plan-Level Requirements for TQP Status

A plan must satisfy ALL:
1. Written, permanent, and continuing program
2. Coverage: at least 70% of all employees (with carve-outs for part-time ≤20h/wk, seasonal ≤5 months/yr, and those below minimum tenure)
3. Non-discriminatory: no discrimination in contributions or benefits favoring officers, shareholders, supervisors, or highly compensated employees
4. Employer contributions required (employee-only contribution is insufficient)
5. Non-diversion: fund cannot be used for employer's own business ventures
6. Non-forfeitable rights: accrued benefits are non-forfeitable

### 2. Critical Change in RR 15-2025 vs. RR 1-68

RR 1-68 required a **trusteed** structure. RR 15-2025 removes this requirement:
- **Non-trusteed/insured plans** are now officially recognized
- Consequence: only trusteed plans get exempt trust income (non-trusteed pay regular income tax on investment earnings)
- Impact on product: `planType: "trusteed" | "non_trusteed"` may be needed to explain trust income treatment to HR users

### 3. Certificate of Qualification Process

- Apply within **30 days** of plan effectivity to BIR Legal and Legislative Division, National Office
- Fee: ₱0 (≤5 employees), ₱2,000 (6-50), ₱3,000 (51-100), ₱5,000 (>100)
- Amendatory certificate: ₱2,000 / ₱3,500 / ₱5,000 respectively
- Valid until revoked
- Pending approval: employer may provisionally claim tax incentives, at own risk

### 4. Individual Conditions for Track B Exemption

Age ≥ 50 + service ≥ 10 years with **same employer** + plan has TQP certificate + **first time ever** (any employer)

### 5. Multi-Employer Service Tacking (RMC 13-2024)

Service tacking allowed ONLY if:
1. Transfer due to valid corporate merger (not voluntary resignation)
2. No separation pay received from prior employer
3. Both employers participate in same multi-employer plan

Otherwise, only current-employer years count toward the 10-year requirement.

---

## Implications for Spec

### Input Fields Needed
- `employer_has_bir_approved_plan: bool` — determines Track B eligibility
- `employee_previously_availed_exemption: bool` — once-in-a-lifetime gate
- (Optional) `plan_type: "trusteed" | "non_trusteed"` — for trust income treatment explanation

### Tax Determination Logic
```
fn determine_tax_track(input: &RetirementInput) -> TaxTrack {
    if input.retirement_age >= 60 && input.credited_years >= 5 {
        return TaxTrack::LaborCodeMandatory // Track A — no plan needed
    }
    if input.retirement_age >= 50
        && input.credited_years >= 10
        && input.employer_has_bir_approved_plan
        && !input.employee_previously_availed_exemption {
        return TaxTrack::BirApprovedPlan // Track B
    }
    TaxTrack::Taxable
}
```

### Warning Flag
HR users whose employees retire at age 50-59 with a company that has no BIR-approved plan will see: retirement benefit is taxable. Calculator should provide actionable guidance on obtaining TQP status.

### NLRC Worksheet
Tax treatment field must cite specific provision:
- Track A: "Tax-exempt under NIRC Sec. 32(B)(6)(a), mandatory Labor Code provisions (RA 7641), age [X], service [Y] years"
- Track B: "Tax-exempt under NIRC Sec. 32(B)(6)(a), RA 4917, BIR-approved plan, age [X], service [Y] years"
- Taxable: "Subject to income tax — Track B conditions not fully met: [specific unmet condition]"

---

## New Aspects Discovered

None. The BIR plan requirements were already anticipated in the frontier. The key new detail (non-trusteed plans now recognized under RR 15-2025) is captured in the source and should be included in the `tax-treatment-conditions` Wave 2 aspect.
