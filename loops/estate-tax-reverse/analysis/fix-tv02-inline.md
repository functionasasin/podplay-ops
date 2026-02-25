# Analysis: Fix TV-02 Inline Computation (Spec Section 19)

**Aspect**: fix-tv02-inline
**Wave**: 5 — Fix-It
**Date Analyzed**: 2026-02-25
**Depends On**: test-vectors.md (authoritative TV-02); estate-tax-engine-spec.md Section 19

---

## Problem

Spec Section 19 ("Test Vectors — Section 19") contains TV-02 with three internally contradictory answers:

1. **First inline attempt** (lines 1783–1801): Uses inputs of `Cash (conjugal): ₱3M` and `Medical: ₱300K`, computes NTE ₱950,000, tax **₱57,000**.
2. **Self-correction paragraph** (lines 1803–1815): Uses inputs of `Cash (conjugal): ₱3M`, `Jewelry (conjugal): ₱1M`, `Medical: ₱300K`, computes NTE ₱1,450,000, tax **₱87,000**.
3. **Deferred answer** (line 1817): States "use analysis/test-vectors.md for authoritative values" — which shows NTE ₱1,850,000, tax **₱111,000**.

The contradictions arise because the inline computation used different inputs than the analysis file:
- Spec inline used `Medical ₱300K`; analysis uses `Medical ₱400K`
- Spec first attempt omitted `Personal property (exclusive) ₱2M`
- Spec second attempt omitted `Personal property (exclusive) ₱2M` but added `Jewelry (conjugal) ₱1M` (wrong column)

## Fix

Remove the first inline computation table, the self-correction paragraph, and the "From analysis test-vectors.md TV-02" partial block. Replace with a single, correct computation derived directly from `analysis/test-vectors.md TV-02`.

## Authoritative TV-02 Inputs (from analysis/test-vectors.md)

```
decedent:
  citizenship:       Filipino
  residency:         resident
  dateOfDeath:       2023-06-20   → regime = TRAIN
  maritalStatus:     married
  propertyRegime:    ACP
  survivingSpouseAlive: true

assets:
  - Real property (exclusive — commercial lot, Makati):  ₱4,000,000  Col A
  - Family home   (exclusive — inherited, Pasig):        ₱6,000,000  Col A  isFamilyHome=true  barangayCert=true
  - Personal prop (exclusive — vehicles & jewelry):      ₱2,000,000  Col A
  - Personal prop (conjugal  — joint bank/deposits):     ₱3,000,000  Col B

deductions:
  5A claims against estate (conjugal personal loan):     ₱500,000   Col B  notarized=true  preExisting=true
  medicalExpenses (within 1 year before death):          ₱400,000
```

## Correct Computation

| Step | Value |
|------|-------|
| Item 29 (Real Property excl. FH) | Col A: ₱4,000,000 / Col B: ₱0 / Col C: ₱4,000,000 |
| Item 30 (Family Home) | Col A: ₱6,000,000 / Col B: ₱0 / Col C: ₱6,000,000 |
| Item 31 (Personal Property) | Col A: ₱2,000,000 / Col B: ₱3,000,000 / Col C: ₱5,000,000 |
| Item 32 (Taxable Transfers) | ₱0 |
| Item 33 (Business Interest) | ₱0 |
| Item 34 (Gross Estate) | Col A: **₱12,000,000** / Col B: **₱3,000,000** / Col C: **₱15,000,000** |
| 5A Claims (conjugal) | Col A: ₱0 / Col B: ₱500,000 / Col C: ₱500,000 |
| Item 35 (Ordinary Deductions) | Col A: ₱0 / Col B: ₱500,000 / **Col C: ₱500,000** |
| Item 36 (Estate after Ordinary) | max(0, ₱15,000,000 − ₱500,000) = **₱14,500,000** |
| 37A Standard Deduction | ₱5,000,000 (citizen, TRAIN) |
| 37B Family Home | min(₱6,000,000, ₱10,000,000) = ₱6,000,000 (exclusive — no halving) |
| 37C Medical | min(₱400,000, ₱500,000) = ₱400,000 |
| 37D RA 4917 | ₱0 |
| Item 37 (Special Deductions) | ₱5,000,000 + ₱6,000,000 + ₱400,000 = **₱11,400,000** |
| Item 38 (Net Estate) | max(0, ₱14,500,000 − ₱11,400,000) = **₱3,100,000** |
| Schedule 6A (Spouse share) | Community assets Col B: ₱3,000,000; obligations Col B: ₱500,000; net community: ₱2,500,000; spouse share: ₱2,500,000 × 0.50 = **₱1,250,000** |
| Item 39 | **₱1,250,000** |
| Item 40 (Net Taxable Estate) | max(0, ₱3,100,000 − ₱1,250,000) = **₱1,850,000** |
| Item 42 (Estate Tax Due) | ₱1,850,000 × 0.06 = **₱111,000** |
| Item 43 (Foreign Credit) | ₱0 |
| Item 44 (Net Estate Tax Due) | **₱111,000** |

## Rules Exercised

- ACP property regime: community assets enter Col B; exclusive enters Col A
- Exclusive family home: full FMV deductible (no halving — ½ rule applies only to conjugal/communal FH)
- Medical expense deduction at actual amount when within ₱500K cap
- Surviving spouse share computed on net community property (conjugal Col B − ELIT Col B obligations)
- Exclusive property (Col A) excluded from spouse share computation

## Impact on Spec

Replace Section 19 TV-02 (all content from the `**Expected computation**:` table through the deferred-answer paragraph) with the single correct table above, matching test-vectors.md exactly.

## Verification

NTE = ₱1,850,000 matches TV-02 row in test-vectors.md summary table (line 27).
Tax = ₱111,000 matches TV-02 row in test-vectors.md summary table (line 27).
All intermediate values match test-vectors.md lines 271–361.
