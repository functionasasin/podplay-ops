# Analysis: cache-existing-analysis

**Aspect:** cache-existing-analysis (Wave 1)
**Date:** 2026-03-06
**Status:** Complete

## What Was Done

Imported the deep-dive analysis from `loops/ph-compliance-moats-reverse/analysis/deepdive-retirement-pay-ra7641.md` into `input/sources/deepdive-retirement-pay-ra7641.md`.

## Key Knowledge Extracted

### Core Formula
- "One-half (1/2) month salary" under RA 7641 = **22.5 days**, NOT 15 days
- Breakdown: 15 days salary + 5 days SIL + 1/12 of 13th month pay
- 13th month ÷ 12 months = 2.5 days (using 26 working days/month basis)
- Daily Rate = Monthly Basic Salary ÷ 26

### Full Formula
```
Retirement Pay = (Monthly Basic Salary ÷ 26) × 22.5 × Credited Years
```

Shortcut: `Monthly Salary × 0.8654 × Years` (because 22.5/26 = 0.8654)

### Eligibility Rules
- Age ≥ 60: optional retirement
- Age ≥ 65: compulsory retirement
- Minimum 5 years of service
- Establishments with ≤10 regular employees: exempt from RA 7641

### Credited Years Rounding
- Partial year ≥ 6 months: round UP to next full year
- Partial year < 6 months: drop the partial year

### Salary Basis
- Included: basic monthly salary, integrated COLA, contractual allowances deemed basic pay
- Excluded: pure COLA (not integrated), OT pay, night shift differential, variable allowances (transportation, meal, representation) unless contractually integrated

### Tax Treatment (4 Conditions for Exemption)
All four must be met:
1. Employee ≥ 50 years old at retirement
2. Employee has ≥ 10 years of service
3. First time receiving retirement benefit from same employer
4. Benefit from a BIR-approved (RR 1-68) retirement plan

Without BIR-approved plan: statutory RA 7641 benefit is technically taxable.

### Separation Pay Interaction
- If employee qualifies for both RA 7641 retirement pay and Art. 298 separation pay: compute both, pay the higher
- Not an either/or — both separately mandated; employer cannot use one to offset the other

### Edge Cases Documented
| Scenario | Rule |
|----------|------|
| < 5 years service | No RA 7641 entitlement |
| Partial year: 7 yr 5 mo | Count as 7 years (drop) |
| Partial year: 7 yr 7 mo | Count as 8 years (round up) |
| COLA not integrated | Exclude from daily rate |
| Related company transfers | Possible aggregation — legal review flag |
| ≤10 employee claim | Flag for verification |
| Death before retirement | Heirs entitled as if retired on death date |

### Key Supreme Court Citation
- *Elegir v. Philippine Airlines, Inc.*: confirmed "one-half (1/2) month salary means 22.5 days"

## Gaps for Further Research (Subsequent Waves)

The deep-dive is an excellent starting point but the following need primary source verification:
1. **RA 7641 full text** — exact statutory language, all exceptions, grandfathering clauses
2. **Art. 302 Labor Code** — renumbered from Art. 287; exact text of the retirement article
3. **Elegir v. PAL full ruling** — GR number, date, exact holding, dissents if any
4. **NIRC Sec. 32(B)(6)(a)** — exact tax exemption conditions, interaction with RR 1-68
5. **Revenue Regulation 1-68** — BIR-approved plan conditions (what makes a plan "approved")
6. **Labor Code Art. 298-299** — exact separation pay formulas for comparison
7. **DOLE Labor Advisory 06-20** — final pay rules that include retirement pay as component
8. **NLRC money claim worksheet format** — what NLRC actually requires in exhibit format

## Source Quality Assessment
- The deep-dive is a synthesis document from the ph-compliance-moats-reverse loop
- Core formula and eligibility rules match known Philippine labor law
- Supreme Court citation (Elegir v. PAL) requires GR number for primary source verification
- Tax treatment rules should be verified against current BIR regulations (RR 1-68 may have been updated)

## Files Created
- `input/sources/deepdive-retirement-pay-ra7641.md` — imported deep-dive (read-only reference)
