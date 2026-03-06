# Analysis: fetch-separation-pay-rules

**Wave:** 1 — Domain Source Acquisition
**Date:** 2026-03-06
**Source cached:** `input/sources/separation-pay-rules.md`

---

## What Was Fetched

Labor Code Articles 298 and 299 (formerly Arts. 283 and 284) on separation pay for authorized causes, plus Supreme Court jurisprudence on dual entitlement when an employee qualifies for both retirement pay and separation pay.

---

## Key Findings

### 1. Art. 298 Authorized Causes and Rates

| Cause | Rate |
|---|---|
| Redundancy / labor-saving devices | 1 month OR 1 month/year, whichever is higher |
| Retrenchment to prevent losses | 1 month OR 1/2 month/year, whichever is higher |
| Closure (not due to serious losses) | 1 month OR 1/2 month/year, whichever is higher |
| Closure due to serious losses | No separation pay owed |
| Disease/illness (Art. 299) | 1 month OR 1/2 month/year, whichever is greater |

### 2. Fraction of Year Rule

Art. 299 explicitly states: "a fraction of at least six (6) months being considered as one (1) whole year." This same rule applies to Art. 298 by DOLE practice and jurisprudence. Identical to RA 7641's credited-years rounding rule.

### 3. Critical Formula Distinction

Separation pay's "1/2 month salary" = **15 days basic pay only** (unlike RA 7641's "1/2 month salary" = 22.5 days).

This is the central compliance gap the product addresses: employers confusing these two definitions.

### 4. Dual Entitlement — Can Both Be Claimed?

**Yes, under certain conditions:**

- *Aquino v. NLRC* (G.R. No. 87653, 1992): Separation pay and retirement benefits are NOT mutually exclusive. Both must be paid unless the employer explicitly included a crediting provision in their retirement plan or CBA.
- *Goodyear v. Angus* (G.R. No. 185449, 2014): Court awarded both benefits in a retrenchment case. "The Labor Code does not prohibit dual recovery."
- Pro-labor rule: Doubts resolved in favor of employee.

**Exception:** If company plan/CBA has explicit language crediting separation pay against retirement pay, pay only the higher amount.

### 5. "Pay the Higher" Rule

When an employee is terminated for an authorized cause AND qualifies for retirement simultaneously:
- Compare retirement pay vs. separation pay amounts
- If CBA/plan has crediting provision: pay the higher
- If no crediting provision: employee may claim both (per *Aquino*)

**In the typical calculator scenario (employee retrenched near retirement age):**
- RA 7641 retirement pay formula (22.5 days/year) almost always exceeds separation pay for retrenchment (15 days/year)
- So RA 7641 retirement pay is generally the larger benefit
- But separation pay for redundancy (30 days/year) can exceed retirement pay for short-tenure employees

### 6. Tax Treatment

Separation pay for authorized causes beyond employee's control is **tax-exempt** under NIRC Sec. 32(B)(6)(b). This is a different provision from the retirement pay exemption under Sec. 32(B)(6)(a).

---

## Implications for the Product

1. **Separation Pay Comparison Section:** The results view must show separation pay computation alongside retirement pay, with the comparison clearly labeled.
2. **Cause Input Required:** The wizard must ask "Was the employee terminated for an authorized cause?" with cause type dropdown (redundancy, retrenchment, closure, disease, voluntary/just cause).
3. **Dual Entitlement Flag:** If authorized cause applies AND employee qualifies for retirement, show dual entitlement note with *Aquino v. NLRC* citation.
4. **CBA Crediting Question:** Wizard must ask "Does your company plan/CBA credit separation pay against retirement pay?" (yes/no/unknown).
5. **NLRC Worksheet:** Must include separation pay computation line when applicable, as NLRC complaints often arise from termination scenarios.

---

## Data for Engine

### SeparationPayCause enum values
- `Redundancy` — rate: 1 month/year
- `LaborSavingDevices` — rate: 1 month/year
- `Retrenchment` — rate: 1/2 month/year
- `ClosureNotDueToLosses` — rate: 1/2 month/year
- `ClosureDueToLosses` — rate: 0 (no separation pay)
- `Disease` — rate: 1/2 month/year
- `JustCause` — rate: 0 (no separation pay)
- `VoluntaryResignation` — rate: 0 (no separation pay)
- `NotApplicable` — no authorized cause involved

### DualEntitlementRule
```
if authorized_cause is Redundancy or LaborSavingDevices or Retrenchment or ClosureNotDueToLosses or Disease:
  if employee also qualifies for retirement (age >= 60, service >= 5 years):
    if cba_has_crediting_provision:
      pay = max(retirement_pay, separation_pay)
    else:
      pay = retirement_pay + separation_pay  // dual entitlement
```

### Separation Pay Formula (integer centavos)
```
monthly_salary_centavos = daily_rate_centavos * 26  // standard working days per month
// OR: monthly_salary_centavos = (annual_basic / 12) as integer

// Redundancy / LSD:
separation_pay = monthly_salary_centavos * credited_years_rounded

// Retrenchment / Closure (not losses) / Disease:
half_month_centavos = monthly_salary_centavos / 2
separation_pay = max(monthly_salary_centavos, half_month_centavos * credited_years_rounded)

// Minimum floor: always at least 1 month salary
separation_pay = max(separation_pay, monthly_salary_centavos)
```

Note: For separation pay, "1/2 month salary" = 15 days basic pay = monthly_salary / 2. NOT 22.5 days.

---

## References

- Labor Code Art. 298 [formerly Art. 283]
- Labor Code Art. 299 [formerly Art. 284]
- DOLE Department Order No. 147, Series of 2015
- Aquino v. NLRC, G.R. No. 87653 (February 11, 1992)
- Goodyear Philippines, Inc. v. Angus, G.R. No. 185449 (November 12, 2014)
- NIRC Sec. 32(B)(6)(b) — tax exemption for authorized-cause separations
