# Analysis: fetch-ra7641-full-text

**Wave:** 1 — Domain Source Acquisition
**Date:** 2026-03-06
**Sources Cached:** input/sources/ra7641-full-text.md

---

## What Was Fetched

Successfully cached the following primary legal documents:

1. **RA 7641 Full Text** — Statutory text of Republic Act No. 7641 (December 9, 1992), the complete amended Article 287 of the Labor Code, Sections 1-3.
2. **IRR of RA 7641** — Implementing Rules and Regulations (April 1, 1993), Rule II: Retirement Benefits, Sections 1-9.
3. **DOLE Labor Advisory** — Guidelines for Effective Implementation of RA 7641, issued October 24, 1996, with key clarifications.
4. **RA 8558** — Amendment notes (regularization impact on eligibility).
5. **RA 10757** — Surface mine workers provision (optional retirement age 50 instead of 60).
6. **Labor Code renumbering note** — Article 287 → Article 302 per RA 10151 (2011).

---

## Key Statutory Findings

### The "One-Half Month Salary" Definition (The Core Legal Issue)

The statute (Article 287/302) defines "one-half (1/2) month salary" with EXACT statutory language:

> "Unless the parties provide for broader inclusions, the term 'one-half (1/2) month salary' shall mean fifteen (15) days plus one-twelfth (1/12) of the 13th month pay and the cash equivalent of not more than five (5) days of service incentive leaves."

This = **22.5 effective days** (15 + 5 + 2.5), not 15 days as most employers compute.

### Formula (Exact)

```
Minimum Retirement Pay = Daily Rate × 22.5 × Credited Years of Service
```

Where:
- Daily Rate = Monthly Basic Salary ÷ 26 (for monthly-paid) OR ADS for last 12 months (for piece-rate)
- Credited Years = Actual years served; fraction ≥ 6 months rounds UP to 1 year; < 6 months dropped

### Eligibility Conditions

| Condition | Threshold |
|-----------|-----------|
| Optional retirement age | 60 (general); 50 (surface mine workers) |
| Compulsory retirement age | 65 |
| Minimum service | 5 years with same establishment |
| Exempt establishments | ≤ 10 employees (retail, service, agricultural) |

### Tax Exemption Conditions (IRR Section 6 / NIRC Sec 32(B)(6)(a))

ALL FOUR conditions must be satisfied for tax exemption:
1. Employee is at least 50 years old at time of retirement
2. Employee has served at least 10 years with the same establishment
3. This is the first time the employee avails of the tax exemption privilege
4. The retirement plan is registered with and approved by the BIR

If any one condition fails, the full retirement pay is taxable as ordinary income.

### COLA Exclusion (Explicit)

The DOLE Labor Advisory explicitly states: **COLA is NOT included** in the salary basis for retirement pay computation.

### Pre-1993 Service

Service rendered before the law's effectivity (January 7, 1993) COUNTS toward the credited years of service. This benefits long-tenured employees who may have started before RA 7641 was enacted.

---

## Implications for Engine Design

1. **Integer centavos arithmetic**: Daily Rate computation must use exact rational arithmetic. The 1/12 of 13th month pay is a fraction that cannot be approximated.
2. **The 22.5-day multiplier**: Must be represented exactly as 45/2 (rational fraction) to avoid floating-point error.
3. **Daily rate divisor**: Standard is 26 for monthly-paid employees (IRR-confirmed). Must allow configuration for companies using different divisors.
4. **ADS for piece-rate workers**: Average Daily Salary = Sum of last 12 months' earnings / actual working days in that period.
5. **Rounding for credited years**: Fraction ≥ 6 months rounds up; < 6 months drops. This is a ceiling/floor function on months.
6. **Tax flag**: Boolean result from checking all 4 conditions. Single failure = taxable.

---

## Source Reliability

- **Primary source**: Supreme Court E-Library confirmed the statutory text matches RA 7641.
- **IRR**: LegalDex source confirmed implementing rules match what the DOLE Labor Advisory references.
- **DOLE Advisory**: October 24, 1996 advisory provides the most operationally clear computation guidance.
- **Cross-confirmed**: Multiple Philippine legal sources (Lawphil, Chan Robles, Respicio) all state the same 22.5-day definition.

---

## Files Created

- `input/sources/ra7641-full-text.md` — Complete cached source with full text, IRR, DOLE advisory, and computation example
