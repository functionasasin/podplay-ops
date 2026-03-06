# Analysis: fetch-nirc-tax-exemption

**Aspect**: fetch-nirc-tax-exemption
**Wave**: 1 — Domain Source Acquisition
**Date**: 2026-03-06
**Source file**: input/sources/nirc-tax-exemption.md

---

## What Was Fetched

- NIRC Section 32(B)(6)(a) full text and interpretation
- RR No. 1-68 (1968) — original BIR implementing rules for RA 4917 qualified plans
- RR No. 15-2025 (April 29, 2025) — updated private retirement plan regulations
- RMC No. 13-2024 — same employer rule clarification

---

## Key Findings

### Two Tax Exemption Tracks

**Track A — Labor Code Mandatory (RA 7641 statutory)**
- Age: 60–65 at retirement
- Service: ≥5 years with employer
- BIR plan: NOT required
- Once-in-lifetime rule: applies
- Re-employment disqualification: within 12 months of same/related employer

**Track B — BIR-Approved Private Plan (RA 4917)**
- Age: ≥50 at retirement
- Service: ≥10 years with SAME employer
- BIR plan: Required (Certificate of Qualification)
- Once-in-lifetime rule: applies (across all employers ever)
- Re-employment disqualification: within 12 months

### Critical Product Implication

The RA 7641 statutory retirement case at age 60-65 is **always tax-exempt** without a BIR-registered plan. This is the primary case the calculator handles. The product must:
1. Detect which track applies
2. Display the correct tax treatment with statutory basis
3. Flag the "no BIR plan" case (age 50-59) as taxable

### "No Plan = Taxable" Rule

Employers without a BIR-registered plan: retirement benefits are taxable UNLESS they qualify under Track A (mandatory Labor Code provisions, age 60-65, 5+ years). This distinction is critical for the calculator UI — a checkbox/dropdown for whether employer has BIR-approved plan.

### Once-in-Lifetime Rule

An employee who has ALREADY claimed tax-exempt retirement benefits (from this or any prior employer) cannot claim exemption again. The calculator should include a field to capture this, and output a `taxExemptionAlreadyUsed` warning if applicable.

### Separation Pay Distinction

Separation pay for authorized causes (Art. 298-299) uses a **different** provision — Section 32(B)(6)(b). It is:
- Exempt regardless of age or length of service
- Only for employer-initiated separations beyond employee's control
- Distinct from retirement pay exemption

---

## Tax Treatment Decision Tree

```
Is employee age 60-65?
  AND has ≥5 years service?
  AND has NOT previously claimed tax-exempt retirement?
  → Track A: EXEMPT (no BIR plan needed)

Is employee age 50-59?
  AND has ≥10 years same employer?
  AND employer has BIR Certificate of Qualification?
  AND has NOT previously claimed tax-exempt retirement?
  → Track B: EXEMPT (BIR plan required)

Otherwise:
  → TAXABLE (add to gross income, graduated tax rates apply)

Regardless:
  If re-employed by same/related employer within 12 months:
  → Retroactively TAXABLE
```

---

## Type Fields Required in Engine Output

```rust
pub struct TaxTreatment {
    pub is_exempt: bool,
    pub track: TaxExemptionTrack,
    pub reason: String,
    pub bir_plan_required: bool,
    pub once_in_lifetime_caveat: bool,
    pub re_employment_warning: bool,
}

pub enum TaxExemptionTrack {
    LaborCodeMandatory,    // Track A: age 60-65, 5+ years, no plan required
    BirApprovedPlan,       // Track B: age 50-59, 10+ years, BIR plan required
    None,                  // Taxable
}
```

---

## Edge Cases

1. **Age 65 compulsory retirement, employer has no BIR plan**: Track A applies → tax-exempt
2. **Age 62 optional retirement, employer has BIR-approved plan**: Track A applies (age ≥60 qualifies under Labor Code) → tax-exempt, simpler than Track B
3. **Age 55 early retirement, employer has BIR plan, 12 years service**: Track B applies → tax-exempt, BUT must verify once-in-lifetime
4. **Age 55, no BIR plan**: Taxable regardless of service years
5. **Age 48, BIR plan, 15 years service**: Taxable — does not meet age 50 minimum
6. **Second retirement (previously claimed exemption)**: Taxable — once-in-lifetime rule consumed
7. **Re-hired within 12 months after claiming exemption**: Retroactively taxable — original exemption disallowed

---

## Impact on Spec Sections

- **S7 Domain: Tax Treatment** — primary section for these rules
- **S3 Data Model** — must include `TaxTreatment` struct
- **S16.1 Wizard Step 3** — needs "employer has BIR-approved plan?" input field and "previously claimed retirement tax exemption?" field
- **S16.5 Results View** — TaxTreatmentAlert component showing exemption track and reason
- **S19 Test Vectors** — must include: Track A, Track B, no-plan-taxable, second-retirement, too-young cases
