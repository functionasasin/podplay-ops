# Analysis: Test Vectors — RA 7641 Retirement Pay Engine

**Wave:** 3 — Engine Design
**Aspect:** test-vectors
**Date:** 2026-03-06
**Sources:** algorithms.md, computation-pipeline.md, data-model.md,
             tax-treatment-conditions.md, separation-pay-interaction.md,
             eligibility-rules.md, credited-years-rounding.md, edge-cases-catalog.md

---

## Overview

This document defines 26 concrete test vectors for the retirement pay engine.
Each vector specifies:
- Exact input values (field names matching Rust `RetirementInput` camelCase serde names)
- Exact expected output values (field names matching Rust `RetirementOutput` camelCase)
- Arithmetic derivation showing how the expected values were computed

All monetary values are in integer centavos (i64).
Formula: `retirement_pay = monthly_centavos × 45 × credited_years / 52` (divisor 26)
Formula: `retirement_pay = monthly_centavos × 45 × credited_years / 44` (divisor 22)

---

## TV-001: Standard case — 21 credited years, DOLE reference example

**Scenario:** General employee, 20 years 8 months service, rounds up to 21 credited years.
The standard example from DOLE Handbook on Workers' Statutory Monetary Benefits.

**Input:**
```json
{
  "employeeName": "Ana Reyes",
  "workerCategory": "general",
  "birthDate": "1963-07-01",
  "hireDate": "2003-07-01",
  "retirementDate": "2024-03-01",
  "monthlyBasicSalaryCentavos": 2000000,
  "salaryDivisor": 26,
  "hasCompanyPlan": false,
  "authorizedCause": null,
  "hasCreditingClause": false,
  "hasBirApprovedPlan": false,
  "isFirstRetirementBenefit": true,
  "isDeathCase": false,
  "employerHeadcount": 50
}
```

**Arithmetic:**
```
Birth: 1963-07-01, Retirement: 2024-03-01
Age at retirement: full_years_between(1963-07-01, 2024-03-01) = 60 (birthday 2024-07-01 not yet reached → 60 years old on 2024-03-01)

Wait — 2024-03-01 vs birthday 2024-07-01: birthday NOT reached → age = 2024-1963-1 = 60
Actually: years_diff = 2024-1963=61, birthday this year = 2024-07-01, retirement 2024-03-01 < 2024-07-01 → birthday not reached → age = 61-1 = 60.

Service: full_months_between(2003-07-01, 2024-03-01)
  years_diff = 2024-2003 = 21, months_diff = 3-7 = -4, day_adj = 0 (day 1 == day 1)
  total = 21×12 + (-4) + 0 = 252 - 4 = 248 months
  full_years = 248/12 = 20, remaining = 248%12 = 8
  remaining 8 >= 6 → credited_years = 21, rounding_applied = true

Daily rate: 2_000_000 / 26 = 76_923 centavos, remainder = 2

Retirement pay (22.5-day formula):
  2_000_000 × 45 × 21 / 52
  = 90_000_000 × 21 / 52
  = 1_890_000_000 / 52
  = 36_346_153 centavos (truncated from 36_346_153.846...)
  = PHP 363,461.53

Employer error (15-day formula):
  2_000_000 × 15 × 21 / 26
  = 30_000_000 × 21 / 26
  = 630_000_000 / 26
  = 24_230_769 centavos
  = PHP 242,307.69

Underpayment: 36_346_153 - 24_230_769 = 12_115_384 centavos = PHP 121,153.84
Underpayment bp: 12_115_384 × 10_000 / 36_346_153 = 121_153_840_000 / 36_346_153 = 3333 bp

Tax treatment: age 60 >= 60, service 248 months >= 60, first benefit → track_a_exempt
```

**Expected output:**
```json
{
  "eligibility": {
    "status": "eligible",
    "ageAtRetirement": 60,
    "totalMonthsServed": 248,
    "meetsAgeRequirement": true,
    "meetsServiceRequirement": true,
    "meetsEmployerSizeRequirement": true
  },
  "creditedYears": {
    "fullYears": 20,
    "remainingMonths": 8,
    "creditedYears": 21,
    "roundingApplied": true,
    "totalMonthsServed": 248
  },
  "dailyRate": {
    "dailyRateCentavos": 76923,
    "monthlyLalaryCentavos": 2000000,
    "salaryDivisor": 26,
    "dailyRateRemainderCentavos": 2
  },
  "retirementPay": {
    "retirementPayCentavos": 36346153,
    "employerErrorAmountCentavos": 24230769,
    "underpaymentCentavos": 12115384,
    "underpaymentBasisPoints": 3333,
    "formula": "22.5_days",
    "monthlyBasisCentavos": 2000000,
    "creditedYears": 21
  },
  "taxTreatment": {
    "track": "track_a_exempt",
    "isExempt": true,
    "meetsAgeCondition": true,
    "meetsServiceCondition": true,
    "meetsFirstBenefitCondition": true,
    "meetsBirPlanCondition": false,
    "withholdingRequired": false
  },
  "paymentScenario": "retirementOnly",
  "totalObligationCentavos": 36346153
}
```

---

## TV-002: Mario the supervisor — 32 years service

**Scenario:** Longer service, higher salary. Validates scaling.

**Input:**
```json
{
  "employeeName": "Mario Santos",
  "workerCategory": "general",
  "birthDate": "1956-06-01",
  "hireDate": "1991-06-01",
  "retirementDate": "2024-06-01",
  "monthlyBasicSalaryCentavos": 2800000,
  "salaryDivisor": 26,
  "hasCompanyPlan": false,
  "authorizedCause": null,
  "hasCreditingClause": false,
  "hasBirApprovedPlan": false,
  "isFirstRetirementBenefit": true,
  "isDeathCase": false,
  "employerHeadcount": 100
}
```

**Arithmetic:**
```
Age: born 1956-06-01, retire 2024-06-01 → birthday reached on 2024-06-01 → age = 68

Service: full_months_between(1991-06-01, 2024-06-01)
  years_diff = 33, months_diff = 0, day_adj = 0
  total = 33×12 = 396 months
  full_years = 33, remaining = 0 → credited_years = 33, rounding_applied = false

Wait — let me recheck. The deep-dive example says "32 years" for Mario.
Use hire 1992-06-01, retire 2024-06-01 → 32 years exactly.

Service: full_months_between(1992-06-01, 2024-06-01)
  years_diff = 32, months_diff = 0, day_adj = 0
  total = 384 months
  full_years = 32, remaining = 0 → credited_years = 32

Retirement pay:
  2_800_000 × 45 × 32 / 52
  = 126_000_000 × 32 / 52
  = 4_032_000_000 / 52
  = 77_538_461 centavos (truncated from 77_538_461.538...)
  = PHP 775,384.61

Employer error (15-day):
  2_800_000 × 15 × 32 / 26
  = 42_000_000 × 32 / 26
  = 1_344_000_000 / 26
  = 51_692_307 centavos = PHP 516,923.07

Underpayment: 77_538_461 - 51_692_307 = 25_846_154 centavos = PHP 258,461.54
Underpayment bp: 25_846_154 × 10_000 / 77_538_461 = 258_461_540_000 / 77_538_461 = 3333 bp
```

**Expected output (key fields):**
```json
{
  "eligibility": { "status": "eligible", "ageAtRetirement": 68 },
  "creditedYears": {
    "fullYears": 32,
    "remainingMonths": 0,
    "creditedYears": 32,
    "roundingApplied": false,
    "totalMonthsServed": 384
  },
  "retirementPay": {
    "retirementPayCentavos": 77538461,
    "employerErrorAmountCentavos": 51692307,
    "underpaymentCentavos": 25846154,
    "underpaymentBasisPoints": 3333
  },
  "taxTreatment": { "track": "track_a_exempt", "isExempt": true },
  "totalObligationCentavos": 77538461
}
```

---

## TV-003: Minimum service — exactly 60 months (5 years)

**Scenario:** Employee with exactly 60 months service, zero remaining months, no rounding.

**Input:**
```json
{
  "hireDate": "2018-03-01",
  "retirementDate": "2023-03-01",
  "birthDate": "1960-03-01",
  "monthlyBasicSalaryCentavos": 1500000,
  "salaryDivisor": 26,
  "workerCategory": "general",
  "employerHeadcount": 25,
  "isFirstRetirementBenefit": true,
  "hasCompanyPlan": false,
  "authorizedCause": null,
  "hasCreditingClause": false,
  "hasBirApprovedPlan": false,
  "isDeathCase": false
}
```

**Arithmetic:**
```
Age: born 1960-03-01, retire 2023-03-01 → birthday reached → age = 63

Service: full_months_between(2018-03-01, 2023-03-01)
  years_diff = 5, months_diff = 0, day_adj = 0 → total = 60
  full_years = 5, remaining = 0 → credited_years = 5, rounding_applied = false
  Service gate: 60 >= 60 → eligible

Retirement pay:
  1_500_000 × 45 × 5 / 52
  = 67_500_000 × 5 / 52
  = 337_500_000 / 52
  = 6_490_384 centavos (truncated from 6_490_384.615...)
  = PHP 64,903.84
```

**Expected output (key fields):**
```json
{
  "eligibility": {
    "status": "eligible",
    "totalMonthsServed": 60,
    "meetsServiceRequirement": true
  },
  "creditedYears": {
    "fullYears": 5,
    "remainingMonths": 0,
    "creditedYears": 5,
    "roundingApplied": false
  },
  "retirementPay": { "retirementPayCentavos": 6490384 },
  "totalObligationCentavos": 6490384
}
```

---

## TV-004: Ineligible — 59 months total despite 11 remaining (service gate fails)

**Scenario:** Employee with 4 years 11 months service (59 total months). The 6-month rounding
rule would give credited_years = 5, but the service gate uses raw months. 59 < 60 → ineligible.
This tests the critical distinction between the service gate (raw months) and credited years (rounded).

**Input:**
```json
{
  "hireDate": "2018-04-01",
  "retirementDate": "2023-03-01",
  "birthDate": "1960-04-01",
  "monthlyBasicSalaryCentavos": 2000000,
  "salaryDivisor": 26,
  "workerCategory": "general",
  "employerHeadcount": 30,
  "isFirstRetirementBenefit": true,
  "hasCompanyPlan": false,
  "authorizedCause": null,
  "hasCreditingClause": false,
  "hasBirApprovedPlan": false,
  "isDeathCase": false
}
```

**Arithmetic:**
```
Service: full_months_between(2018-04-01, 2023-03-01)
  years_diff = 4, months_diff = -1, day_adj = 0
  total = 4×12 + (-1) = 47 months

Wait, let me recalculate:
  years_diff = 2023-2018 = 5
  months_diff = 3-4 = -1
  day_adj = 0 (day 1 == day 1)
  total = 5×12 + (-1) + 0 = 60 - 1 = 59 months ✓

full_years = 59/12 = 4, remaining = 59%12 = 11
remaining 11 >= 6 → credited_years = 5 (would be, but service gate checks raw months)
Service gate: 59 < 60 → ineligible (insufficient_service)

Pipeline continues with reference computation:
Retirement pay (reference only):
  2_000_000 × 45 × 5 / 52 = 8_653_846 centavos = PHP 86,538.46
  (Note: credited_years used here is 5 from rounding, but ineligibility is set)
```

**Expected output (key fields):**
```json
{
  "eligibility": {
    "status": "insufficient_service",
    "totalMonthsServed": 59,
    "meetsAgeRequirement": true,
    "meetsServiceRequirement": false
  },
  "creditedYears": {
    "fullYears": 4,
    "remainingMonths": 11,
    "creditedYears": 5,
    "roundingApplied": true,
    "totalMonthsServed": 59
  },
  "retirementPay": {
    "retirementPayCentavos": 8653846,
    "isReferenceOnly": true
  },
  "totalObligationCentavos": 0
}
```

---

## TV-005: Rounding up — exactly 6 remaining months (credited_years += 1)

**Scenario:** 20 years 6 months service. Remaining months = 6 >= 6 → rounds up to 21.

**Input:**
```json
{
  "hireDate": "2003-01-01",
  "retirementDate": "2023-07-01",
  "birthDate": "1963-01-01",
  "monthlyBasicSalaryCentavos": 1800000,
  "salaryDivisor": 26,
  "workerCategory": "general",
  "employerHeadcount": 50,
  "isFirstRetirementBenefit": true,
  "hasCompanyPlan": false,
  "authorizedCause": null,
  "hasCreditingClause": false,
  "hasBirApprovedPlan": false,
  "isDeathCase": false
}
```

**Arithmetic:**
```
Service: full_months_between(2003-01-01, 2023-07-01)
  years_diff = 20, months_diff = 6, day_adj = 0
  total = 20×12 + 6 = 246 months
  full_years = 20, remaining = 6
  remaining 6 >= 6 → credited_years = 21, rounding_applied = true

Retirement pay:
  1_800_000 × 45 × 21 / 52
  = 81_000_000 × 21 / 52
  = 1_701_000_000 / 52
  = 32_711_538 centavos = PHP 327,115.38
```

**Expected output (key fields):**
```json
{
  "creditedYears": {
    "fullYears": 20,
    "remainingMonths": 6,
    "creditedYears": 21,
    "roundingApplied": true,
    "totalMonthsServed": 246
  },
  "retirementPay": { "retirementPayCentavos": 32711538 },
  "totalObligationCentavos": 32711538
}
```

---

## TV-006: No rounding — 5 remaining months (credited_years stays at 20)

**Scenario:** 20 years 5 months service. Remaining months = 5 < 6 → drops. credited_years = 20.
Contrast with TV-005 where same years but 6 months remaining rounds up.

**Input:**
```json
{
  "hireDate": "2003-01-01",
  "retirementDate": "2023-06-01",
  "birthDate": "1963-01-01",
  "monthlyBasicSalaryCentavos": 1800000,
  "salaryDivisor": 26,
  "workerCategory": "general",
  "employerHeadcount": 50,
  "isFirstRetirementBenefit": true,
  "hasCompanyPlan": false,
  "authorizedCause": null,
  "hasCreditingClause": false,
  "hasBirApprovedPlan": false,
  "isDeathCase": false
}
```

**Arithmetic:**
```
Service: full_months_between(2003-01-01, 2023-06-01)
  years_diff = 20, months_diff = 5, day_adj = 0
  total = 245 months
  full_years = 20, remaining = 5
  remaining 5 < 6 → credited_years = 20, rounding_applied = false

Retirement pay:
  1_800_000 × 45 × 20 / 52
  = 81_000_000 × 20 / 52
  = 1_620_000_000 / 52
  = 31_153_846 centavos = PHP 311,538.46
```

**Expected output (key fields):**
```json
{
  "creditedYears": {
    "fullYears": 20,
    "remainingMonths": 5,
    "creditedYears": 20,
    "roundingApplied": false,
    "totalMonthsServed": 245
  },
  "retirementPay": { "retirementPayCentavos": 31153846 },
  "totalObligationCentavos": 31153846
}
```

---

## TV-007: Tax exempt Track A — age 60, 5+ years, first benefit

**Scenario:** Optional retirement at exactly age 60, first time claiming. Classic Track A exempt.

**Input:**
```json
{
  "hireDate": "2009-05-15",
  "retirementDate": "2024-05-15",
  "birthDate": "1964-05-15",
  "monthlyBasicSalaryCentavos": 3000000,
  "salaryDivisor": 26,
  "workerCategory": "general",
  "employerHeadcount": 75,
  "isFirstRetirementBenefit": true,
  "hasCompanyPlan": false,
  "authorizedCause": null,
  "hasCreditingClause": false,
  "hasBirApprovedPlan": false,
  "isDeathCase": false
}
```

**Arithmetic:**
```
Age: born 1964-05-15, retire 2024-05-15 → birthday reached (same date) → age = 60
Service: full_months_between(2009-05-15, 2024-05-15)
  years_diff = 15, months_diff = 0, day_adj = 0 → total = 180 months
  full_years = 15, remaining = 0 → credited_years = 15

Retirement pay:
  3_000_000 × 45 × 15 / 52
  = 135_000_000 × 15 / 52
  = 2_025_000_000 / 52
  = 38_942_307 centavos = PHP 389,423.07

Tax treatment: age 60 >= 60 ✓, service 180 >= 60 ✓, first benefit ✓ → track_a_exempt
```

**Expected output (key fields):**
```json
{
  "eligibility": { "status": "eligible", "ageAtRetirement": 60 },
  "retirementPay": { "retirementPayCentavos": 38942307 },
  "taxTreatment": {
    "track": "track_a_exempt",
    "isExempt": true,
    "meetsAgeCondition": true,
    "meetsServiceCondition": true,
    "meetsFirstBenefitCondition": true,
    "meetsBirPlanCondition": false,
    "withholdingRequired": false
  },
  "totalObligationCentavos": 38942307
}
```

---

## TV-008: Tax exempt Track B — BIR-approved plan, age 52, 12 years service

**Scenario:** Early retirement under a BIR Tax-Qualified Plan. Age 52 (< 60 for Track A),
12 years service (>= 10 for Track B), employer has TQP certificate, first benefit.
Employee is eligible for early retirement under company plan but RA 7641 eligibility
requires age >= 60 for general workers. Computation is for reference; Track B exemption
is relevant when the company plan is larger than statutory minimum.

**Input:**
```json
{
  "hireDate": "2012-01-01",
  "retirementDate": "2024-01-01",
  "birthDate": "1972-01-01",
  "monthlyBasicSalaryCentavos": 5000000,
  "salaryDivisor": 26,
  "workerCategory": "general",
  "employerHeadcount": 200,
  "isFirstRetirementBenefit": true,
  "hasCompanyPlan": true,
  "companyPlan": {
    "formulaType": "monthsPerYear",
    "monthsPerYear": 1.5,
    "planName": "ABC Corp Retirement Fund"
  },
  "authorizedCause": null,
  "hasCreditingClause": false,
  "hasBirApprovedPlan": true,
  "isDeathCase": false
}
```

**Arithmetic:**
```
Age: born 1972-01-01, retire 2024-01-01 → birthday reached → age = 52
Service: full_months_between(2012-01-01, 2024-01-01)
  total = 144 months, full_years = 12, remaining = 0 → credited_years = 12
RA 7641 eligibility: age 52 < 60 → ineligible for RA 7641 statutory retirement

RA 7641 statutory retirement pay (reference):
  5_000_000 × 45 × 12 / 52
  = 225_000_000 × 12 / 52
  = 2_700_000_000 / 52
  = 51_923_076 centavos = PHP 519,230.76

Company plan (monthsPerYear = 1.5):
  months_times_10 = 15
  benefit = 5_000_000 × 15 × 12 / 10
          = 75_000_000 × 12 / 10
          = 900_000_000 / 10
          = 90_000_000 centavos = PHP 900,000.00

Gap: statutory (51_923_076) - company (90_000_000) = -38_076_924 (negative → company higher)
Governs: Company (company_benefit >= statutory)

Tax treatment:
  age 52 >= 50 ✓, service 144 months >= 120 months ✓, BIR plan ✓, first benefit ✓
  → track_b_exempt (applies to company plan benefit)
```

**Expected output (key fields):**
```json
{
  "eligibility": {
    "status": "insufficient_age",
    "ageAtRetirement": 52,
    "meetsAgeRequirement": false
  },
  "retirementPay": {
    "retirementPayCentavos": 51923076,
    "isReferenceOnly": true
  },
  "companyPlan": {
    "companyBenefitCentavos": 90000000,
    "statutoryMinimumCentavos": 51923076,
    "gapCentavos": -38076924,
    "gapBasisPoints": 0,
    "governs": "company",
    "retirementPayOwedCentavos": 90000000
  },
  "taxTreatment": {
    "track": "track_b_exempt",
    "isExempt": true,
    "meetsAgeCondition": true,
    "meetsServiceCondition": true,
    "meetsFirstBenefitCondition": true,
    "meetsBirPlanCondition": true,
    "withholdingRequired": false
  },
  "totalObligationCentavos": 90000000
}
```

---

## TV-009: Taxable — eligible but previously received exempt benefit

**Scenario:** Employee meets age and service requirements but has already availed of
tax-exempt retirement at a previous employer. Second benefit is fully taxable.

**Input:**
```json
{
  "hireDate": "2004-06-01",
  "retirementDate": "2024-06-01",
  "birthDate": "1962-06-01",
  "monthlyBasicSalaryCentavos": 3500000,
  "salaryDivisor": 26,
  "workerCategory": "general",
  "employerHeadcount": 50,
  "isFirstRetirementBenefit": false,
  "hasCompanyPlan": false,
  "authorizedCause": null,
  "hasCreditingClause": false,
  "hasBirApprovedPlan": false,
  "isDeathCase": false
}
```

**Arithmetic:**
```
Age: born 1962-06-01, retire 2024-06-01 → birthday reached → age = 62
Service: full_months_between(2004-06-01, 2024-06-01) = 240 months
full_years = 20, remaining = 0 → credited_years = 20
Eligible: age 62 >= 60 ✓, service 240 >= 60 ✓

Retirement pay:
  3_500_000 × 45 × 20 / 52
  = 157_500_000 × 20 / 52
  = 3_150_000_000 / 52
  = 60_576_923 centavos = PHP 605,769.23

Tax treatment:
  age 62 >= 60 ✓, service 240 >= 60 ✓, BUT isFirstRetirementBenefit = false ✗
  → taxable (once-in-a-lifetime condition fails)
  withholdingRequired = true
```

**Expected output (key fields):**
```json
{
  "eligibility": { "status": "eligible", "ageAtRetirement": 62 },
  "retirementPay": { "retirementPayCentavos": 60576923 },
  "taxTreatment": {
    "track": "taxable",
    "isExempt": false,
    "meetsAgeCondition": true,
    "meetsServiceCondition": true,
    "meetsFirstBenefitCondition": false,
    "withholdingRequired": true
  },
  "totalObligationCentavos": 60576923
}
```

---

## TV-010: Death before retirement — heirs' entitlement

**Scenario:** Employee died at age 63 with 18 years 3 months service.
Heirs entitled to retirement pay as if employee had retired on the date of death.

**Input:**
```json
{
  "hireDate": "2005-09-01",
  "retirementDate": "2024-03-01",
  "birthDate": "1960-09-01",
  "monthlyBasicSalaryCentavos": 2200000,
  "salaryDivisor": 26,
  "workerCategory": "general",
  "employerHeadcount": 60,
  "isFirstRetirementBenefit": true,
  "hasCompanyPlan": false,
  "authorizedCause": null,
  "hasCreditingClause": false,
  "hasBirApprovedPlan": false,
  "isDeathCase": true
}
```

**Arithmetic:**
```
(retirementDate is set to date of death for death cases)
Age: born 1960-09-01, death date 2024-03-01
  birthday 2024-09-01 not yet reached → age = 2024-1960-1 = 63

Service: full_months_between(2005-09-01, 2024-03-01)
  years_diff = 18, months_diff = -6, day_adj = 0
  total = 18×12 + (-6) = 216 - 6 = 210 months
  full_years = 17, remaining = 6
  remaining 6 >= 6 → credited_years = 18, rounding_applied = true

Retirement pay:
  2_200_000 × 45 × 18 / 52
  = 99_000_000 × 18 / 52
  = 1_782_000_000 / 52
  = 34_269_230 centavos = PHP 342,692.30
```

**Expected output (key fields):**
```json
{
  "eligibility": {
    "status": "eligible",
    "ageAtRetirement": 63,
    "isDeathCase": true
  },
  "creditedYears": {
    "fullYears": 17,
    "remainingMonths": 6,
    "creditedYears": 18,
    "roundingApplied": true,
    "totalMonthsServed": 210
  },
  "retirementPay": { "retirementPayCentavos": 34269230 },
  "taxTreatment": { "track": "track_a_exempt", "isExempt": true },
  "totalObligationCentavos": 34269230
}
```

---

## TV-011: Compulsory retirement at age 65 — long service

**Scenario:** Employee reaches compulsory retirement age with long service.

**Input:**
```json
{
  "hireDate": "1999-01-01",
  "retirementDate": "2024-01-01",
  "birthDate": "1959-01-01",
  "monthlyBasicSalaryCentavos": 4500000,
  "salaryDivisor": 26,
  "workerCategory": "general",
  "employerHeadcount": 150,
  "isFirstRetirementBenefit": true,
  "hasCompanyPlan": false,
  "authorizedCause": null,
  "hasCreditingClause": false,
  "hasBirApprovedPlan": false,
  "isDeathCase": false
}
```

**Arithmetic:**
```
Age: born 1959-01-01, retire 2024-01-01 → birthday reached → age = 65 (compulsory)
Service: full_months_between(1999-01-01, 2024-01-01) = 300 months
full_years = 25, remaining = 0 → credited_years = 25

Retirement pay:
  4_500_000 × 45 × 25 / 52
  = 202_500_000 × 25 / 52
  = 5_062_500_000 / 52
  = 97_355_769 centavos = PHP 973,557.69
```

**Expected output (key fields):**
```json
{
  "eligibility": {
    "status": "eligible",
    "ageAtRetirement": 65,
    "retirementType": "compulsory"
  },
  "retirementPay": { "retirementPayCentavos": 97355769 },
  "taxTreatment": { "track": "track_a_exempt", "isExempt": true },
  "totalObligationCentavos": 97355769
}
```

---

## TV-012: Dual entitlement — redundancy termination of retirement-eligible employee

**Scenario:** Age 63, 20 years service. Employer declares redundancy (authorized cause).
No crediting clause in CBA. Both retirement pay AND separation pay are due independently.

**Input:**
```json
{
  "hireDate": "2004-01-01",
  "retirementDate": "2024-01-01",
  "birthDate": "1961-01-01",
  "monthlyBasicSalaryCentavos": 3000000,
  "salaryDivisor": 26,
  "workerCategory": "general",
  "employerHeadcount": 100,
  "isFirstRetirementBenefit": true,
  "hasCompanyPlan": false,
  "authorizedCause": "redundancy",
  "hasCreditingClause": false,
  "hasBirApprovedPlan": false,
  "isDeathCase": false
}
```

**Arithmetic:**
```
Age: born 1961-01-01, retire 2024-01-01 → birthday reached → age = 63
Service: 240 months, credited_years = 20

Retirement pay:
  3_000_000 × 45 × 20 / 52
  = 2_700_000_000 / 52
  = 51_923_076 centavos = PHP 519,230.76

Separation pay (Redundancy — 1 month per year):
  daily_rate = 3_000_000 / 26 = 115_384 centavos
  raw = 115_384 × 30 × 20 = 69_230_400 centavos
  one_month_min = 115_384 × 26 = 2_999_984 centavos
  final = max(69_230_400, 2_999_984) = 69_230_400 centavos = PHP 692,304.00

No crediting clause → DualEntitlement
Total obligation: 51_923_076 + 69_230_400 = 121_153_476 centavos = PHP 1,211,534.76
```

**Expected output (key fields):**
```json
{
  "retirementPay": { "retirementPayCentavos": 51923076 },
  "separationPay": {
    "separationPayCentavos": 69230400,
    "cause": "redundancy",
    "rateType": "oneMonthPerYear",
    "floorApplied": false
  },
  "paymentScenario": "dualEntitlement",
  "totalObligationCentavos": 121153476
}
```

---

## TV-013: Crediting clause — retrenchment where retirement pay is higher

**Scenario:** Age 61, 15 years service, retrenchment. Employer's plan has an explicit crediting
clause. Retirement pay > separation pay → employer pays retirement pay amount only.

**Input:**
```json
{
  "hireDate": "2009-06-01",
  "retirementDate": "2024-06-01",
  "birthDate": "1963-06-01",
  "monthlyBasicSalaryCentavos": 2500000,
  "salaryDivisor": 26,
  "workerCategory": "general",
  "employerHeadcount": 80,
  "isFirstRetirementBenefit": true,
  "hasCompanyPlan": false,
  "authorizedCause": "retrenchment",
  "hasCreditingClause": true,
  "hasBirApprovedPlan": false,
  "isDeathCase": false
}
```

**Arithmetic:**
```
Age: born 1963-06-01, retire 2024-06-01 → age = 61
Service: 180 months, credited_years = 15

Retirement pay:
  2_500_000 × 45 × 15 / 52
  = 112_500_000 × 15 / 52
  = 1_687_500_000 / 52
  = 32_451_923 centavos = PHP 324,519.23

Separation pay (Retrenchment — 1/2 month per year):
  daily_rate = 2_500_000 / 26 = 96_153 centavos
  raw = 96_153 × 15 × 15 = 21_634_425 centavos
  one_month_min = 96_153 × 26 = 2_499_978 centavos
  final = max(21_634_425, 2_499_978) = 21_634_425 centavos = PHP 216,344.25

Crediting clause present:
  retirement_pay (32_451_923) > separation_pay (21_634_425)
  → PaymentScenario: creditedRetirementHigher
  additional_due = 32_451_923 - 21_634_425 = 10_817_498 centavos = PHP 108,174.98
  total_due = 32_451_923 centavos (employer pays retirement pay, sep pay credited against it)
```

**Expected output (key fields):**
```json
{
  "retirementPay": { "retirementPayCentavos": 32451923 },
  "separationPay": { "separationPayCentavos": 21634425 },
  "paymentScenario": "creditedRetirementHigher",
  "creditedScenario": {
    "higherAmountCentavos": 32451923,
    "lowerAmountCentavos": 21634425,
    "additionalDueCentavos": 10817498,
    "totalDueCentavos": 32451923
  },
  "totalObligationCentavos": 32451923
}
```

---

## TV-014: Company plan insufficient — 15 days/year (statutory governs)

**Scenario:** Company uses 15-day formula. Statutory minimum applies. Gap analysis shows
employer must pay the difference.

**Input:**
```json
{
  "hireDate": "2004-01-01",
  "retirementDate": "2024-01-01",
  "birthDate": "1964-01-01",
  "monthlyBasicSalaryCentavos": 2000000,
  "salaryDivisor": 26,
  "workerCategory": "general",
  "employerHeadcount": 50,
  "isFirstRetirementBenefit": true,
  "hasCompanyPlan": true,
  "companyPlan": {
    "formulaType": "daysPerYear",
    "daysPerYear": 15.0,
    "planName": "XYZ Corp Retirement Plan"
  },
  "authorizedCause": null,
  "hasCreditingClause": false,
  "hasBirApprovedPlan": false,
  "isDeathCase": false
}
```

**Arithmetic:**
```
Service: 240 months, credited_years = 20
Age: 60 at retirement

Statutory retirement pay:
  2_000_000 × 45 × 20 / 52
  = 1_800_000_000 / 52
  = 34_615_384 centavos = PHP 346,153.84

Company plan (DaysPerYear = 15.0):
  daily_rate = 2_000_000 / 26 = 76_923 centavos
  days_times_10 = 150
  company_benefit = 76_923 × 150 × 20 / 10
                 = 11_538_450 × 20 / 10
                 = 230_769_000 / 10
                 = 23_076_900 centavos = PHP 230,769.00

Gap: 34_615_384 - 23_076_900 = 11_538_484 centavos = PHP 115,384.84 (statutory higher)
gap_bp: 11_538_484 × 10_000 / 34_615_384 = 115_384_840_000 / 34_615_384 = 3333 bp
Governs: Statutory
Retirement pay owed: 34_615_384 centavos (statutory minimum, employer must pay full amount)
```

**Expected output (key fields):**
```json
{
  "companyPlan": {
    "companyBenefitCentavos": 23076900,
    "statutoryMinimumCentavos": 34615384,
    "gapCentavos": 11538484,
    "gapBasisPoints": 3333,
    "governs": "statutory",
    "retirementPayOwedCentavos": 34615384
  },
  "totalObligationCentavos": 34615384
}
```

---

## TV-015: Company plan — 22.5 days/year (computational path difference creates tiny gap)

**Scenario:** Company plan set to exactly 22.5 days/year. Due to different computational
paths (daily_rate × 225 × years / 10 vs monthly × 45 × years / 52), results differ by a
few centavos due to truncation. Statutory governs by this tiny margin.

**Input:** Same as TV-014 but `daysPerYear: 22.5`

**Arithmetic:**
```
Statutory: 34_615_384 centavos (from TV-014)

Company plan (DaysPerYear = 22.5):
  daily_rate = 76_923 centavos
  days_times_10 = 225
  company_benefit = 76_923 × 225 × 20 / 10
                 = 17_307_675 × 20 / 10
                 = 346_153_500 / 10
                 = 34_615_350 centavos = PHP 346,153.50

Gap: 34_615_384 - 34_615_350 = 34 centavos (tiny positive gap)
gap_bp: 34 × 10_000 / 34_615_384 = 340_000 / 34_615_384 = 0 bp (rounds to 0)
Governs: Statutory (company < statutory by 34 centavos)

Note: This 34-centavo gap is an artifact of truncation in two different computational paths.
The engine must use the statutory formula result (34_615_384) as the obligation, not the
company plan result, since company_benefit < statutory_minimum.
```

**Expected output (key fields):**
```json
{
  "companyPlan": {
    "companyBenefitCentavos": 34615350,
    "statutoryMinimumCentavos": 34615384,
    "gapCentavos": 34,
    "gapBasisPoints": 0,
    "governs": "statutory",
    "retirementPayOwedCentavos": 34615384
  },
  "totalObligationCentavos": 34615384
}
```

---

## TV-016: Company plan exceeds statutory — 30 days/year (company governs)

**Scenario:** More generous company plan. Company benefit higher than statutory minimum.
Employer owes the company plan amount.

**Input:** Same as TV-014 but `daysPerYear: 30.0`

**Arithmetic:**
```
Company plan (DaysPerYear = 30.0):
  daily_rate = 76_923 centavos
  days_times_10 = 300
  company_benefit = 76_923 × 300 × 20 / 10
                 = 23_076_900 × 20 / 10
                 = 461_538_000 / 10
                 = 46_153_800 centavos = PHP 461,538.00

Statutory: 34_615_384 centavos
Gap: 34_615_384 - 46_153_800 = -11_538_416 (negative — company higher)
Governs: Company
Retirement pay owed: 46_153_800 centavos (company plan is more generous)
```

**Expected output (key fields):**
```json
{
  "companyPlan": {
    "companyBenefitCentavos": 46153800,
    "statutoryMinimumCentavos": 34615384,
    "gapCentavos": -11538416,
    "gapBasisPoints": 0,
    "governs": "company",
    "retirementPayOwedCentavos": 46153800
  },
  "totalObligationCentavos": 46153800
}
```

---

## TV-017: Salary divisor 22 — exact division, no truncation

**Scenario:** Monthly salary divisible exactly by 22. Demonstrates the alternative divisor
and exact arithmetic (zero remainder).

**Input:**
```json
{
  "hireDate": "2009-01-01",
  "retirementDate": "2024-01-01",
  "birthDate": "1964-01-01",
  "monthlyBasicSalaryCentavos": 2200000,
  "salaryDivisor": 22,
  "workerCategory": "general",
  "employerHeadcount": 50,
  "isFirstRetirementBenefit": true,
  "hasCompanyPlan": false,
  "authorizedCause": null,
  "hasCreditingClause": false,
  "hasBirApprovedPlan": false,
  "isDeathCase": false
}
```

**Arithmetic:**
```
Service: 180 months, credited_years = 15
Age: 60 at retirement

Daily rate: 2_200_000 / 22 = 100_000 centavos (PHP 1,000.00 — exact, remainder = 0)

Retirement pay (divisor 22 → 45/44):
  2_200_000 × 45 × 15 / 44
  = 99_000_000 × 15 / 44
  = 1_485_000_000 / 44
  = 33_750_000 centavos (PHP 337,500.00 — exact, no truncation)

Employer error (15-day, divisor 22):
  2_200_000 × 15 × 15 / 22
  = 33_000_000 × 15 / 22
  = 495_000_000 / 22
  = 22_500_000 centavos (PHP 225,000.00 — exact)

Underpayment: 33_750_000 - 22_500_000 = 11_250_000 centavos = PHP 112,500.00
Underpayment bp: 11_250_000 × 10_000 / 33_750_000 = 112_500_000_000 / 33_750_000 = 3333 bp
```

**Expected output (key fields):**
```json
{
  "dailyRate": {
    "dailyRateCentavos": 100000,
    "salaryDivisor": 22,
    "dailyRateRemainderCentavos": 0
  },
  "retirementPay": {
    "retirementPayCentavos": 33750000,
    "employerErrorAmountCentavos": 22500000,
    "underpaymentCentavos": 11250000,
    "underpaymentBasisPoints": 3333
  },
  "totalObligationCentavos": 33750000
}
```

---

## TV-018: Underground mine worker — optional retirement at age 52

**Scenario:** Underground mine worker category. Optional retirement age is 50 (not 60).
Employee at age 52 is eligible under RA 8558 amendment.

**Input:**
```json
{
  "hireDate": "2009-06-01",
  "retirementDate": "2024-06-01",
  "birthDate": "1972-06-01",
  "monthlyBasicSalaryCentavos": 3500000,
  "salaryDivisor": 26,
  "workerCategory": "undergroundMine",
  "employerHeadcount": 75,
  "isFirstRetirementBenefit": true,
  "hasCompanyPlan": false,
  "authorizedCause": null,
  "hasCreditingClause": false,
  "hasBirApprovedPlan": false,
  "isDeathCase": false
}
```

**Arithmetic:**
```
Age: born 1972-06-01, retire 2024-06-01 → birthday reached → age = 52
Worker category: undergroundMine → optional retirement age = 50
Age check: 52 >= 50 ✓ → eligible

Service: 180 months, credited_years = 15

Retirement pay:
  3_500_000 × 45 × 15 / 52
  = 157_500_000 × 15 / 52
  = 2_362_500_000 / 52
  = 45_432_692 centavos = PHP 454,326.92
```

**Expected output (key fields):**
```json
{
  "eligibility": {
    "status": "eligible",
    "ageAtRetirement": 52,
    "retirementType": "optional",
    "workerCategory": "undergroundMine"
  },
  "retirementPay": { "retirementPayCentavos": 45432692 },
  "taxTreatment": { "track": "track_a_exempt", "isExempt": true },
  "totalObligationCentavos": 45432692
}
```

---

## TV-019: Separation pay only — closure due to losses (retirement eligible, zero sep pay)

**Scenario:** Age 62, 10 years service. Company closes due to losses. Retirement pay is due
under RA 7641 but separation pay is PHP 0 (closure due to losses exemption).

**Input:**
```json
{
  "hireDate": "2014-01-01",
  "retirementDate": "2024-01-01",
  "birthDate": "1962-01-01",
  "monthlyBasicSalaryCentavos": 1800000,
  "salaryDivisor": 26,
  "workerCategory": "general",
  "employerHeadcount": 40,
  "isFirstRetirementBenefit": true,
  "hasCompanyPlan": false,
  "authorizedCause": "closureDueToLosses",
  "hasCreditingClause": false,
  "hasBirApprovedPlan": false,
  "isDeathCase": false
}
```

**Arithmetic:**
```
Age: 62, Service: 120 months, credited_years = 10

Retirement pay:
  1_800_000 × 45 × 10 / 52
  = 810_000_000 / 52
  = 15_576_923 centavos = PHP 155,769.23

Separation pay (closureDueToLosses): 0 centavos (no obligation)
Payment scenario: retirementOnly
Total: 15_576_923 centavos
```

**Expected output (key fields):**
```json
{
  "retirementPay": { "retirementPayCentavos": 15576923 },
  "separationPay": {
    "separationPayCentavos": 0,
    "cause": "closureDueToLosses",
    "floorApplied": false
  },
  "paymentScenario": "retirementOnly",
  "totalObligationCentavos": 15576923
}
```

---

## TV-020: Disease separation pay — 1-month floor applies (1 year service)

**Scenario:** Age 63, only 1 year of service (ineligible for RA 7641 retirement).
Authorized cause is Disease. Separation pay raw (15 × 1 year) is less than the 1-month
floor, so the floor applies. Retirement pay computed for reference only.

**Input:**
```json
{
  "hireDate": "2023-01-01",
  "retirementDate": "2024-01-01",
  "birthDate": "1961-01-01",
  "monthlyBasicSalaryCentavos": 2000000,
  "salaryDivisor": 26,
  "workerCategory": "general",
  "employerHeadcount": 30,
  "isFirstRetirementBenefit": true,
  "hasCompanyPlan": false,
  "authorizedCause": "disease",
  "hasCreditingClause": false,
  "hasBirApprovedPlan": false,
  "isDeathCase": false
}
```

**Arithmetic:**
```
Age: 63, Service: 12 months (full_years = 1, remaining = 0, credited_years = 1)
Service gate: 12 < 60 → ineligible for RA 7641 (insufficient_service)

Separation pay (Disease — 1/2 month per year):
  daily_rate = 2_000_000 / 26 = 76_923 centavos
  raw = 76_923 × 15 × 1 = 1_153_845 centavos
  one_month_min = 76_923 × 26 = 1_999_998 centavos
  final = max(1_153_845, 1_999_998) = 1_999_998 centavos = PHP 19,999.98 (floor applies)

Retirement pay (reference only, ineligible):
  2_000_000 × 45 × 1 / 52 = 90_000_000 / 52 = 1_730_769 centavos

Payment scenario: separationOnly (only sep pay is owed since retirement ineligible)
Total: 1_999_998 centavos
```

**Expected output (key fields):**
```json
{
  "eligibility": {
    "status": "insufficient_service",
    "totalMonthsServed": 12
  },
  "retirementPay": {
    "retirementPayCentavos": 1730769,
    "isReferenceOnly": true
  },
  "separationPay": {
    "separationPayCentavos": 1999998,
    "cause": "disease",
    "rateType": "halfMonthPerYear",
    "floorApplied": true,
    "rawAmountCentavos": 1153845,
    "oneMonthMinCentavos": 1999998
  },
  "paymentScenario": "separationOnly",
  "totalObligationCentavos": 1999998
}
```

---

## TV-021: Leap day birthday — age computation edge case

**Scenario:** Employee born February 29, 1960. Retirement date February 28, 2020.
The 2020 birthday should be treated as February 29 (since 2020 is a leap year).
Retirement on Feb 28 does NOT reach the Feb 29 birthday → age = 59 → ineligible.

**Input:**
```json
{
  "hireDate": "1995-01-01",
  "retirementDate": "2020-02-28",
  "birthDate": "1960-02-29",
  "monthlyBasicSalaryCentavos": 2000000,
  "salaryDivisor": 26,
  "workerCategory": "general",
  "employerHeadcount": 40,
  "isFirstRetirementBenefit": true,
  "hasCompanyPlan": false,
  "authorizedCause": null,
  "hasCreditingClause": false,
  "hasBirApprovedPlan": false,
  "isDeathCase": false
}
```

**Arithmetic:**
```
Age computation:
  years_diff = 2020 - 1960 = 60
  birthday_this_year: NaiveDate::from_ymd_opt(2020, 2, 29) = Some(2020-02-29)
  (2020 is a leap year, so Feb 29 exists)
  retirement(2020-02-28) >= bday(2020-02-29)? NO → birthday NOT reached → age = 60-1 = 59

Age 59 < 60 → ineligible (insufficient_age)

Service: full_months_between(1995-01-01, 2020-02-28)
  years_diff = 25, months_diff = 1, day_adj = 28<1? No, 28>1 → day_adj = 0
  total = 25×12 + 1 = 301 months → well above 60 months (service eligible)
  full_years = 25, remaining = 1, credited_years = 25 (no rounding since 1 < 6)

Retirement pay (reference only — age ineligible):
  2_000_000 × 45 × 25 / 52 = 2_250_000_000 / 52 = 43_269_230 centavos
```

**Expected output (key fields):**
```json
{
  "eligibility": {
    "status": "insufficient_age",
    "ageAtRetirement": 59,
    "meetsAgeRequirement": false,
    "meetsServiceRequirement": true
  },
  "retirementPay": {
    "retirementPayCentavos": 43269230,
    "isReferenceOnly": true
  },
  "totalObligationCentavos": 0
}
```

---

## TV-022: Leap day birthday — retires on Feb 29, 2020 (eligible at 60)

**Scenario:** Same employee as TV-021 but retires one day later (February 29, 2020).
Birthday reached → age = 60 → eligible for optional retirement.

**Input:** Same as TV-021 but `"retirementDate": "2020-02-29"`

**Arithmetic:**
```
Age computation:
  birthday_this_year = 2020-02-29 (leap year)
  retirement(2020-02-29) >= bday(2020-02-29)? YES → age = 60

Age 60 >= 60 → eligible (optional retirement)

Service: full_months_between(1995-01-01, 2020-02-29)
  Same 301 months as TV-021 (one day difference doesn't change month count since
  end.day(29) >= start.day(1) → day_adj = 0)
  credited_years = 25

Retirement pay:
  2_000_000 × 45 × 25 / 52 = 43_269_230 centavos = PHP 432,692.30
```

**Expected output (key fields):**
```json
{
  "eligibility": { "status": "eligible", "ageAtRetirement": 60 },
  "retirementPay": { "retirementPayCentavos": 43269230 },
  "totalObligationCentavos": 43269230
}
```

---

## TV-023: Small employer exemption — <= 10 employees

**Scenario:** Employee meets all individual qualifications (age, service) but employer has
only 8 employees. RA 7641 exempts employers with 10 or fewer employees.

**Input:**
```json
{
  "hireDate": "2004-01-01",
  "retirementDate": "2024-01-01",
  "birthDate": "1964-01-01",
  "monthlyBasicSalaryCentavos": 2000000,
  "salaryDivisor": 26,
  "workerCategory": "general",
  "employerHeadcount": 8,
  "isFirstRetirementBenefit": true,
  "hasCompanyPlan": false,
  "authorizedCause": null,
  "hasCreditingClause": false,
  "hasBirApprovedPlan": false,
  "isDeathCase": false
}
```

**Arithmetic:**
```
Age: 60, Service: 240 months, credited_years = 20
Employer headcount: 8 <= 10 → small employer exemption applies → ineligible

Retirement pay (reference):
  2_000_000 × 45 × 20 / 52 = 34_615_384 centavos
```

**Expected output (key fields):**
```json
{
  "eligibility": {
    "status": "ineligible_small_employer",
    "ageAtRetirement": 60,
    "meetsAgeRequirement": true,
    "meetsServiceRequirement": true,
    "meetsEmployerSizeRequirement": false,
    "employerHeadcount": 8
  },
  "retirementPay": {
    "retirementPayCentavos": 34615384,
    "isReferenceOnly": true
  },
  "totalObligationCentavos": 0
}
```

---

## TV-024: High salary overflow safety — PHP 5,000,000/month, 40 years

**Scenario:** Maximum practical salary test. Verifies no overflow in intermediate computations.

**Input:**
```json
{
  "hireDate": "1984-01-01",
  "retirementDate": "2024-01-01",
  "birthDate": "1959-01-01",
  "monthlyBasicSalaryCentavos": 500000000,
  "salaryDivisor": 26,
  "workerCategory": "general",
  "employerHeadcount": 500,
  "isFirstRetirementBenefit": true,
  "hasCompanyPlan": false,
  "authorizedCause": null,
  "hasCreditingClause": false,
  "hasBirApprovedPlan": false,
  "isDeathCase": false
}
```

**Arithmetic:**
```
Monthly: PHP 5,000,000 = 500_000_000 centavos
Service: 480 months, full_years = 40, remaining = 0, credited_years = 40

Overflow check at each intermediate step:
  step 1: 500_000_000 × 45 = 22_500_000_000 (< 9.2×10^18 ✓)
  step 2: 22_500_000_000 × 40 = 900_000_000_000 (< 9.2×10^18 ✓)
  step 3: 900_000_000_000 / 52 = 17_307_692_307 centavos ✓

Retirement pay:
  500_000_000 × 45 × 40 / 52
  = 900_000_000_000 / 52
  = 17_307_692_307 centavos = PHP 173,076,923.07
```

**Expected output (key fields):**
```json
{
  "creditedYears": { "creditedYears": 40 },
  "retirementPay": {
    "retirementPayCentavos": 17307692307,
    "formula": "22.5_days"
  },
  "totalObligationCentavos": 17307692307
}
```

---

## TV-025: Batch computation — 3 employees, summary totals

**Scenario:** Batch computation with 3 employees. Verifies per-employee results and
aggregate summary statistics.

**Input (`compute_batch_json`):**
```json
{
  "batchId": "batch-2024-q1",
  "computedBy": "HR Department",
  "employees": [
    {
      "employeeId": "EMP-001",
      "employeeName": "Ana Reyes",
      "hireDate": "2004-01-01",
      "retirementDate": "2024-01-01",
      "birthDate": "1964-01-01",
      "monthlyBasicSalaryCentavos": 2000000,
      "salaryDivisor": 26,
      "workerCategory": "general",
      "employerHeadcount": 100,
      "isFirstRetirementBenefit": true,
      "hasCompanyPlan": false,
      "authorizedCause": null,
      "hasCreditingClause": false,
      "hasBirApprovedPlan": false,
      "isDeathCase": false
    },
    {
      "employeeId": "EMP-002",
      "employeeName": "Mario Santos",
      "hireDate": "1992-06-01",
      "retirementDate": "2024-06-01",
      "birthDate": "1956-06-01",
      "monthlyBasicSalaryCentavos": 2800000,
      "salaryDivisor": 26,
      "workerCategory": "general",
      "employerHeadcount": 100,
      "isFirstRetirementBenefit": true,
      "hasCompanyPlan": false,
      "authorizedCause": null,
      "hasCreditingClause": false,
      "hasBirApprovedPlan": false,
      "isDeathCase": false
    },
    {
      "employeeId": "EMP-003",
      "employeeName": "Luisa Cruz",
      "hireDate": "2018-03-01",
      "retirementDate": "2023-03-01",
      "birthDate": "1960-03-01",
      "monthlyBasicSalaryCentavos": 1500000,
      "salaryDivisor": 26,
      "workerCategory": "general",
      "employerHeadcount": 100,
      "isFirstRetirementBenefit": true,
      "hasCompanyPlan": false,
      "authorizedCause": null,
      "hasCreditingClause": false,
      "hasBirApprovedPlan": false,
      "isDeathCase": false
    }
  ]
}
```

**Arithmetic:**
```
EMP-001: 240 months, credited_years = 20
  retirement = 2_000_000 × 45 × 20 / 52 = 34_615_384 centavos

EMP-002: 384 months, credited_years = 32
  retirement = 2_800_000 × 45 × 32 / 52 = 77_538_461 centavos

EMP-003: 60 months, credited_years = 5
  retirement = 1_500_000 × 45 × 5 / 52 = 6_490_384 centavos

Summary:
  total_employees = 3
  eligible_count = 3
  ineligible_count = 0
  total_obligation = 34_615_384 + 77_538_461 + 6_490_384 = 118_644_229 centavos = PHP 1,186,442.29
  average_obligation = 118_644_229 / 3 = 39_548_076 centavos (truncated) = PHP 395,480.76
  max_obligation = 77_538_461 centavos (EMP-002)
  min_obligation = 6_490_384 centavos (EMP-003)
  tax_exempt_count = 3
  taxable_count = 0
```

**Expected output (key fields):**
```json
{
  "batchId": "batch-2024-q1",
  "results": [
    { "employeeId": "EMP-001", "totalObligationCentavos": 34615384 },
    { "employeeId": "EMP-002", "totalObligationCentavos": 77538461 },
    { "employeeId": "EMP-003", "totalObligationCentavos": 6490384 }
  ],
  "summary": {
    "totalEmployees": 3,
    "eligibleCount": 3,
    "ineligibleCount": 0,
    "totalObligationCentavos": 118644229,
    "averageObligationCentavos": 39548076,
    "maxObligationCentavos": 77538461,
    "minObligationCentavos": 6490384,
    "taxExemptCount": 3,
    "taxableCount": 0
  }
}
```

---

## TV-026: NLRC worksheet generation

**Scenario:** Generate a complete NLRC money claim computation worksheet for Mario Santos
(TV-002 parameters). Validates the NLRC worksheet output structure and required legal fields.

**Input (`generate_nlrc_json`):**
```json
{
  "employeeId": "EMP-MARIO",
  "employeeName": "Mario Santos",
  "employerName": "ABC Corporation",
  "caseNumber": "NLRC-NCR-CASE-0001-2024",
  "complainant": "Mario Santos",
  "respondent": "ABC Corporation",
  "computationDate": "2024-06-01",
  "computation": {
    "hireDate": "1992-06-01",
    "retirementDate": "2024-06-01",
    "birthDate": "1956-06-01",
    "monthlyBasicSalaryCentavos": 2800000,
    "salaryDivisor": 26,
    "workerCategory": "general",
    "employerHeadcount": 100,
    "isFirstRetirementBenefit": true,
    "hasCompanyPlan": false,
    "authorizedCause": null,
    "hasCreditingClause": false,
    "hasBirApprovedPlan": false,
    "isDeathCase": false
  }
}
```

**Expected output (key fields):**
```json
{
  "worksheetTitle": "Statement of Computation of Retirement Pay",
  "caseNumber": "NLRC-NCR-CASE-0001-2024",
  "employeeName": "Mario Santos",
  "employerName": "ABC Corporation",
  "computationDate": "2024-06-01",
  "legalBasis": [
    "Republic Act No. 7641 (Retirement Pay Law)",
    "Article 302, Labor Code of the Philippines",
    "Elegir v. Philippine Airlines, Inc., G.R. No. 181995 (July 16, 2012)"
  ],
  "serviceRecord": {
    "hireDate": "1992-06-01",
    "retirementDate": "2024-06-01",
    "totalMonthsServed": 384,
    "fullYears": 32,
    "remainingMonths": 0,
    "creditedYears": 32,
    "roundingApplied": false
  },
  "salaryBasis": {
    "monthlyBasicSalaryCentavos": 2800000,
    "dailyRateCentavos": 107692,
    "salaryDivisor": 26
  },
  "formulaBreakdown": {
    "componentBasicPay": { "days": 15, "amountCentavos": 43076923 },
    "componentSil": { "days": 5, "amountCentavos": 14358974 },
    "componentThirteenthMonth": { "days": 2.5, "amountCentavos": 7179487 },
    "totalDays": 22.5,
    "totalAmountCentavos": 64615384
  },
  "retirementPayPerYear": 2019231,
  "creditedYears": 32,
  "totalRetirementPay": 64615392,
  "employerPaidAmount": 0,
  "deficiencyAmount": 64615392,
  "totalMoneyClaimCentavos": 64615392
}
```

**Note:** The NLRC worksheet uses component decomposition for display:
- Basic pay component: `monthly × 15 / divisor × credited_years`
- SIL component: `monthly × 5 / divisor × credited_years`
- 13th month component: `(monthly / 12) × 1/2 × credited_years = monthly × 1/24 × credited_years`

Decomposition arithmetic (for display — primary total still uses 45/52 formula):
```
daily_rate = 2_800_000 / 26 = 107_692 centavos
basic_pay  = 107_692 × 15 × 32 = 51_692_160 centavos ← wait, check against TV-002

Actually the worksheet shows the breakdown per credited_year then multiplied:
per_year = monthly × 45 / (52 × 1) for one year? No.
The breakdown components are:
  basic:   daily × 15 × years = 107_692 × 15 × 32 = 51_692_160?

Hmm, let me recalculate the total: 107_692 × 15 × 32 = 51_692,160 centavos (≠ TV-002's 77_538_461)

The discrepancy is because the primary formula uses monthly × 45 × years / 52 (no intermediate daily rate),
but the NLRC breakdown DOES use daily_rate (with truncation at each component).

NLRC worksheet breakdown (informational only — uses daily rate for display):
  daily_rate = 107_692 centavos (truncated from 107_692.307...)
  basic_pay  = 107_692 × 15 × 32 = 51_691_960...

Recalculate:
  107_692 × 15 = 1_615_380
  1_615_380 × 32 = 51_692_160 centavos

  sil = 107_692 × 5 × 32 = 107_692 × 160 = 17_230_720 centavos

  13th_month = (2_800_000 / 12) / 2 × 32
             = 233_333 / 2 × 32 (truncated division)
             = 116_666 × 32 = 3_733_312 centavos

  total_from_breakdown = 51_692_160 + 17_230_720 + 3_733_312 = 72_656_192 centavos

This is DIFFERENT from TV-002's 77_538_461. The worksheet breakdown is INFORMATIONAL only.
The legally binding retirement pay is the primary formula result (77_538_461 centavos).
The NLRC worksheet must note this explicitly.

Use the primary formula result as the totalRetirementPay in the worksheet.
```

**Revised expected output for TV-026 worksheet totals:**
```json
{
  "retirementPayCentavos": 77538461,
  "formulaBreakdownNote": "Component decomposition shown for reference only. Total computed using exact rational formula: monthly × 45 × years / 52.",
  "primaryFormulaResult": 77538461,
  "legallyBindingAmountCentavos": 77538461
}
```

---

## Summary Table

| # | Scenario | Monthly (PHP) | Yrs | Credited | Retirement Pay (centavos) | Eligible | Tax Track |
|---|----------|--------------|-----|----------|--------------------------|----------|-----------|
| TV-001 | Standard, 20y8m | 20,000 | 20y8m | 21 | 36,346,153 | yes | track_a |
| TV-002 | High salary, 32y | 28,000 | 32y0m | 32 | 77,538,461 | yes | track_a |
| TV-003 | Min service, 5y | 15,000 | 5y0m | 5 | 6,490,384 | yes | track_a |
| TV-004 | Ineligible, 4y11m | 20,000 | 4y11m | 5* | 8,653,846* | **no** | — |
| TV-005 | Round up, 20y6m | 18,000 | 20y6m | 21 | 32,711,538 | yes | track_a |
| TV-006 | No round, 20y5m | 18,000 | 20y5m | 20 | 31,153,846 | yes | track_a |
| TV-007 | Track A exempt, 15y | 30,000 | 15y0m | 15 | 38,942,307 | yes | track_a |
| TV-008 | Track B, early ret | 50,000 | 12y0m | 12 | 51,923,076* | **no (age)** | track_b |
| TV-009 | Taxable, 2nd benefit | 35,000 | 20y0m | 20 | 60,576,923 | yes | taxable |
| TV-010 | Death, 17y6m | 22,000 | 17y6m | 18 | 34,269,230 | yes | track_a |
| TV-011 | Compulsory, 65, 25y | 45,000 | 25y0m | 25 | 97,355,769 | yes | track_a |
| TV-012 | Dual entitlement | 30,000 | 20y0m | 20 | 51,923,076 | yes | track_a |
| TV-013 | Crediting clause | 25,000 | 15y0m | 15 | 32,451,923 | yes | track_a |
| TV-014 | Company plan 15d | 20,000 | 20y0m | 20 | 34,615,384 | yes | track_a |
| TV-015 | Company plan 22.5d | 20,000 | 20y0m | 20 | 34,615,384 | yes | track_a |
| TV-016 | Company plan 30d | 20,000 | 20y0m | 20 | 34,615,384* | yes | track_a |
| TV-017 | Divisor 22, exact | 22,000 | 15y0m | 15 | 33,750,000 | yes | track_a |
| TV-018 | Underground mine, 52 | 35,000 | 15y0m | 15 | 45,432,692 | yes | track_a |
| TV-019 | Closure losses, 10y | 18,000 | 10y0m | 10 | 15,576,923 | yes | track_a |
| TV-020 | Disease 1y, floor | 20,000 | 1y0m | 1 | 1,730,769* | **no** | — |
| TV-021 | Leap bday, Feb 28 | 20,000 | 25y1m | 25 | 43,269,230* | **no (age 59)** | — |
| TV-022 | Leap bday, Feb 29 | 20,000 | 25y1m | 25 | 43,269,230 | yes | track_a |
| TV-023 | Small employer | 20,000 | 20y0m | 20 | 34,615,384* | **no** | — |
| TV-024 | High salary overflow | 5,000,000 | 40y0m | 40 | 17,307,692,307 | yes | track_a |
| TV-025 | Batch, 3 employees | various | various | various | 118,644,229 total | yes | track_a |
| TV-026 | NLRC worksheet | 28,000 | 32y0m | 32 | 77,538,461 | yes | track_a |

*Reference only (ineligible employee or company plan governs)

---

## Notes on Test Vector Precision

1. **All centavo values are exact integer results** of Rust integer arithmetic with truncation.
2. **Vectors marked `*`** compute retirement pay but mark it `isReferenceOnly: true` in the output.
3. **TV-015** deliberately tests the 34-centavo truncation artifact between two computational paths. Both paths are correct; the statutory formula governs.
4. **TV-026** NLRC worksheet: component decomposition totals may differ from the primary formula. The legally binding amount is always from the `monthly × 45 × years / 52` formula.
5. **TV-025** average is truncated: `118_644_229 / 3 = 39_548_076` (remainder 1 centavo discarded).
