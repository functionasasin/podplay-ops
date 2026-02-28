# Working Notes: eopt-taxpayer-tiers
**Date:** 2026-02-28
**Aspect:** EOPT Act tiered taxpayer classification — how tiers affect self-employed filing procedures and deadlines

---

## Source Material
- `input/sources/eopt-create-provisions.md` — Sections 1, 8, 9, 10, 11
- `final-mega-spec/domain/legal-basis.md` — Sections 1.4.1, 1.4.5

## Key Findings

### The ₱3M Triple Coincidence
The ₱3,000,000 threshold appears in three independent regulatory contexts:
1. **Taxpayer tier boundary** (MICRO < ₱3M, SMALL ≥ ₱3M) — RR 8-2024
2. **VAT registration threshold** (non-VAT ≤ ₱3M, must-register-VAT > ₱3M) — NIRC Sec. 109(CC)
3. **8% income tax option eligibility** (available if gross ≤ ₱3M) — NIRC Sec. 24(A)(2)(b)

These three thresholds happen to coincide numerically but derive from different statutes and have independent legal bases. A taxpayer crossing ₱3M triggers all three changes simultaneously.

### Tier vs. ₱3M Threshold Practical Overlap
| Condition | Tier | VAT Status | 8% Available | Pct Tax | Penalty Rate | Interest |
|-----------|------|-----------|--------------|---------|--------------|----------|
| Gross < ₱3M | MICRO | Non-VAT | YES | 3% (if not on 8%) | 10% | 6%/yr |
| ₱3M ≤ Gross < ₱20M | SMALL | VAT | NO | N/A (VAT instead) | 10% | 6%/yr |
| ₱20M ≤ Gross < ₱1B | MEDIUM | VAT | NO | N/A | 25% | 12%/yr |
| Gross ≥ ₱1B | LARGE | VAT | NO | N/A | 25% | 12%/yr |

### What Tier Does NOT Change
- Filing DEADLINES — uniform across all tiers (April 15, August 15, November 15, January 25 for 2551Q)
- Income tax rates (graduated table or 8%) — driven by election and gross threshold, not tier
- Filing FORMS — driven by deduction method and income mix, not tier directly (though simplified 2-page ITR mandate aligns with Micro/Small using 1701A)

### Tier Determination Algorithm
1. New registrant → MICRO by default (no prior year data)
2. Existing registrant (registered 2022 or earlier) → classify by 2022 gross sales
3. Existing registrant (registered 2023+) → classify by first taxable year gross sales
4. Reclassification: requires written BIR notice; takes effect NEXT taxable year after notice
5. "Gross sales" for classification = business income only (net of VAT if VAT-registered); excludes compensation from employer-employee relationship

### Edge Cases Found
- EC-T01: First-year registrant → MICRO default
- EC-T02: Crosses ₱3M mid-year → stays MICRO for current year, VAT obligation triggers separately
- EC-T03: Falls below ₱3M (Small→Micro) → stays SMALL until BIR notice
- EC-T04: Mixed income taxpayer → tier based on business income only
- EC-T05: Multiple business lines → aggregate all business income for tier
- EC-T06: Fraud violation → 50% surcharge for ALL tiers (no tier-based reduction)
- EC-T07: Wrong venue → eliminated entirely (EOPT), not a tier issue

### Files to Write
- `final-mega-spec/domain/computation-rules.md` — CR-015 (tier classification), CR-016 (surcharge), CR-017 (interest), CR-018 (total penalty)
- `final-mega-spec/domain/lookup-tables/taxpayer-classification-tiers.md` — complete tier lookup table
- `final-mega-spec/domain/edge-cases.md` — initial content: EC-T01 through EC-T07

### New Aspects Discovered
None — tier information was well-covered in eopt-create-fetch source material. The bir-penalty-schedule aspect (already queued) will cover the full penalty schedule in more detail (surcharge exceptions, compromise penalties, information return penalties, criminal penalties).
