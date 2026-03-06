# Analysis: Death Before Retirement

**Aspect:** death-before-retirement
**Wave:** 2 — Domain Rule Extraction
**Date:** 2026-03-06
**Depends on:** eligibility-rules, core-formula-22-5-days, salary-basis-inclusions

---

## Summary

When a covered private-sector employee dies while still in active service, before actually retiring, the right to receive RA 7641 statutory retirement pay is transmitted to the employee's legal heirs. The computation treats the **date of death as the retirement date**. This rule is derived from the general civil law principle that rights of a deceased transmit to heirs upon death, confirmed by labor law's pro-labor interpretation. However, the age eligibility requirement introduces a significant legal nuance.

---

## Primary Rule

**Heirs are entitled to retirement pay as if the employee had retired on the date of death.**

Sources:
- Deepdive analysis (ph-compliance-moats-reverse): "Death before retirement | Heirs are entitled to retirement pay as if employee retired on date of death"
- Civil Code of the Philippines, Art. 777: Rights of the deceased are transmitted to heirs from the moment of death
- Labor law principle of pro-labor interpretation (in dubio pro labor): Any doubt in labor rights resolved in favor of the worker/heirs

---

## Eligibility Analysis on Death

### Service Requirement (5 Years)
The minimum 5-year service requirement **still applies** as of the date of death.

- If the employee had < 5 years of service at death: **no RA 7641 entitlement**. Heirs receive no statutory retirement pay. Company plan (if any) governs separately.
- If the employee had ≥ 5 years of service at death: **RA 7641 entitlement exists**, subject to the age analysis below.

### Age Requirement — The Critical Nuance

RA 7641 requires age ≥ 60 (optional retirement) or age 65 (compulsory) for the employee to be eligible. When the employee dies **before** reaching age 60, the strict statutory text raises a question: does RA 7641 apply?

**Three scenarios:**

#### Scenario A: Employee dies at age ≥ 60 with ≥ 5 years service
**Clearly eligible.** Meets all statutory criteria. Compute as if employee retired on date of death. Heirs receive full statutory retirement pay.

#### Scenario B: Employee dies at age ≥ 50 and < 60 with ≥ 5 years service
**Likely eligible under pro-labor interpretation.** The employee was eligible for BIR-approved plan retirement and/or approaching statutory retirement. Labor courts consistently apply the pro-labor interpretation. However, this is a gray area under the strict text of RA 7641.
- If employer has a retirement plan that covers death in service: plan governs
- If no company plan: flag for legal review, but compute the amount to show the employee's potential entitlement
- Product action: compute and display with a legal advisory warning

#### Scenario C: Employee dies at age < 50 with ≥ 5 years service
**Gray area — most contested.** The employee had not yet reached any retirement threshold. Under strict RA 7641 reading, no retirement pay entitlement exists because the employee could not have "retired" at that age. However:
- Company retirement plans often cover death in service regardless of age
- Some jurisprudence (under the broader labor law framework) treats long-tenured employees who die in service as entitled to at least pro-rated benefits
- Product action: show computation with explicit legal advisory that age < 50 at death creates uncertainty; recommend legal consultation

**Practical product rule:** Always compute and display the amount. For age < 60 at death, display a legal advisory warning. Never show "zero" based on age alone without surfacing the computation — the heirs may have recourse under a company plan even if RA 7641 strictly doesn't apply.

---

## Computation Rules on Death

### Step 1: Establish "retirement date"
- Retirement date = date of death (not the date of any subsequent claim)

### Step 2: Credited years of service
- From hire date to date of death
- Apply the standard 6-month rounding rule:
  - Fraction ≥ 6 months → round up to next full year
  - Fraction < 6 months → drop (do not count)
- Minimum: 5 credited years for RA 7641 to apply

### Step 3: Salary basis
- **Latest salary rate before death** — the most recent monthly basic salary as of the date of death
- Same inclusions/exclusions as standard computation:
  - Included: basic pay, integrated COLA, contractually integrated allowances
  - Excluded: overtime, NSD, variable allowances, non-integrated COLA

### Step 4: Daily rate
```
Daily Rate = Monthly Basic Salary ÷ 26 working days
```

### Step 5: Retirement pay
```
Retirement Pay = Daily Rate × 22.5 × Credited Years of Service
```

Exact same formula as a living retiree. No modification for death scenario in the amount calculation.

### Step 6: Who receives payment
- The **legal heirs** of the deceased employee
- Order of succession per Civil Code (Art. 887 et seq.):
  1. Legitimate children and descendants (divide equally)
  2. Legitimate parents and ascendants (if no children)
  3. Illegitimate children (concurrently with legitimate children, at 1/2 share each)
  4. Surviving spouse (concurrently with children or parents)
  5. Brothers, sisters, nephews, nieces (if no spouse or children)
- The product cannot determine heirship — it outputs the total amount; legal process (extrajudicial settlement or court proceeding) determines distribution

---

## Tax Treatment on Death

### Income Tax
The NIRC Sec. 32(B)(6)(a) income tax exemption on retirement pay was designed for the **employee's** income. When the employee dies, the benefit payable to heirs is no longer "income" in the same sense.

**Treatment:**
- If the employee had a BIR-approved retirement plan AND would have met all 4 conditions (age ≥ 50, service ≥ 10 years, first-time, BIR-approved plan): the benefit transmitted to heirs may still be treated as tax-exempt under the plan's terms
- If no BIR-approved plan (pure RA 7641 statutory benefit): the benefit becomes part of the gross estate and is subject to **estate tax** (6% flat rate under TRAIN Law, with standard deduction of ₱5,000,000)
- The heirs themselves do not pay income tax on amounts received from an estate — estate tax is paid by the estate before distribution

### Estate Tax Implications
- Retirement pay receivable by the heirs is an asset of the **gross estate** under NIRC Sec. 85
- Exception: If the retirement plan designates a beneficiary (not the estate), the proceeds may be excluded from the gross estate under NIRC Sec. 85(G) (transfers under insurance-type arrangements)
- BIR-approved retirement plan proceeds payable to a designated beneficiary: generally excluded from gross estate (analogous to life insurance)
- Pure RA 7641 statutory benefit (no plan): part of gross estate

**Product action:** Always display a tax advisory for death-before-retirement scenarios. Recommend consultation with a tax professional for both estate tax filing and proper characterization of the retirement pay.

---

## Interaction with Other Death Benefits

When computing the total amounts due to heirs of a deceased employee, retirement pay is one component of a larger set of death-triggered benefits. The product should itemize all:

| Benefit | Trigger | Computing Body | Note |
|---------|---------|----------------|------|
| RA 7641 retirement pay | Death in service with ≥5 years | Employer | Subject to age analysis above |
| Pro-rated 13th month pay (PD 851) | Death during calendar year | Employer | Always due regardless of tenure |
| Unpaid earned salary | Death during pay period | Employer | Pro-rated to date of death |
| SIL cash conversion (Art. 95) | Unused SIL accrued | Employer | If ≥1 year service |
| SSS death benefit (RA 8282) | Death of SSS member | Social Security System | Separate; not employer obligation |
| PAG-IBIG death benefit (RA 9679) | Death of PAG-IBIG member | Home Development Mutual Fund | Separate; not employer obligation |
| PhilHealth | Death while member | PhilHealth | Separate; medical reimbursement rules |
| Life insurance (if company-provided) | Death | Insurance company | Per policy terms |

**Important:** The 5 SIL days and 1/12 of 13th month embedded in the RA 7641 22.5-day formula are NOT double-counted against the separately computed pro-rated 13th month pay and SIL cash conversion. These are distinct obligations.

---

## Final Pay Release Rule on Death

DOLE LA 06-20 applies to death-triggered separations:
- All final pay components (including retirement pay) must be released **within 30 calendar days** from the date of death
- Payment is made to the legal heirs or duly authorized representative of the estate
- Employer may require basic documentation of heirship (e.g., Death Certificate, valid ID of heir claiming payment, simple affidavit of heirship for uncontested cases)
- For contested estates: employer should await court order or extrajudicial settlement; 30-day rule may be extended by mutual agreement or legal process

---

## Edge Cases

### Employee dies exactly on retirement date
- Computes as normal retirement. No special treatment needed.
- If employee died on the day they would have turned 65 (compulsory retirement): eligible for full retirement pay.

### Employee dies during a leave of absence
- Authorized leave (sick leave, AWOL with reinstatement pending, maternity leave, etc.) does not break continuity of service
- Date of death is still the retirement date for computation
- Salary basis: last salary rate before the leave began (for authorized leaves)

### Company transfers before death
- If employee was transferred between related companies and service was continuous: aggregate service years may apply (see edge-cases-catalog aspect)
- At minimum, service with the terminal employer (employer at time of death) is credited
- Aggregation requires evidence of corporate relatedness (same beneficial owner, management, etc.)

### Death during probationary period (< 5 years service)
- RA 7641 does not apply (< 5 year threshold)
- Company retirement plan or CBA plan governs, if any
- Standard final pay (unpaid wages, pro-rated 13th month, SIL conversion) still due

### Employer ≤ 10 employees — death scenario
- Employer is exempt from RA 7641 regardless of death scenario
- Company plan or CBA governs
- Final pay components (wages, 13th month, SIL) still due as these are not RA 7641 benefits

### Mining workers (RA 8558 / RA 10757)
- Underground mine workers: optional retirement at age 50; if death before 50 with ≥5 years service, same gray-area analysis applies
- Surface mine workers: same reduced thresholds as underground workers
- Otherwise: same death-before-retirement rules apply

---

## Data Model Implications (for Wave 3)

The `RetirementInput` struct needs a termination reason field:

```
enum TerminationReason {
    OptionalRetirement,      // Employee chose to retire at 60+
    CompulsoryRetirement,    // Reached age 65 (mandatory)
    DeathInService,          // Employee died while employed
    EarlyRetirementCompanyPlan, // Company plan permits early retirement
}
```

When `termination_reason = DeathInService`:
- `retirement_date` = `date_of_death` (same field, renamed semantically in UI)
- `age_at_retirement` = computed from DOB to date of death
- Output includes `death_scenario_advisory: bool = true`
- Tax treatment result includes additional field: `estate_tax_note: String`

The `EligibilityResult` struct needs:
```
struct EligibilityResult {
    is_eligible: bool,
    eligibility_basis: EligibilityBasis,  // Statutory, CompanyPlan, None
    age_warning: Option<AgeWarningKind>,
    legal_advisory: Option<String>,       // For death < 60 scenarios
}

enum AgeWarningKind {
    DeathBeforeOptionalRetirementAge,    // died < 60, ≥ 50
    DeathBeforeAnyRetirementThreshold,  // died < 50
}
```

---

## Product UI Implications (for Wave 5)

### In the wizard
- Step 4 (Retirement Details): add termination reason selector with option "Death in Service"
- When "Death in Service" is selected:
  - "Retirement Date" field label changes to "Date of Death"
  - New informational callout: "Retirement pay is computed as of the date of death and is payable to the employee's legal heirs."

### In the results view
- Display a `DeathScenarioAlert` component (Alert variant `warning` or `info`):
  - If age at death ≥ 60: "Employee died while eligible for retirement. Full retirement pay is due to heirs."
  - If age at death 50–59: "Employee died before optional retirement age. RA 7641 eligibility may depend on company plan. Recommend legal review before asserting entitlement."
  - If age at death < 50: "Employee died well before retirement age. RA 7641 statutory entitlement is uncertain. Consult a labor lawyer to assess claim under company plan or CBA."
- Always show the computed amount regardless of age warning — it represents the potential maximum entitlement
- Tax advisory callout: "Benefits payable to heirs upon death are subject to estate tax rules. Consult a tax professional for estate tax filing."

### In the NLRC worksheet
- Caption the computation as: "Retirement Pay — Death in Service (Art. 302, Labor Code; RA 7641)"
- Add: "Payable to heirs as of the date of death: [DATE]"
- Itemize all final pay components separately

---

## Computation Example

**Facts:**
- Employee: Maria Santos
- Date of hire: March 1, 2005
- Date of death: October 15, 2026 (age 62)
- Monthly basic salary: ₱35,000
- Service before death: 21 years, 7 months → 22 credited years (7 months ≥ 6 months → rounds up)

**Computation:**
```
Daily Rate = ₱35,000 ÷ 26 = ₱1,346.15
Retirement Pay = ₱1,346.15 × 22.5 × 22 = ₱666,842.31
```

**In integer centavos (Rust engine):**
```
monthly_basic_centavos = 3_500_000   // ₱35,000.00
daily_rate_centavos = 3_500_000 × 100 ÷ 26 = 346,153 centavos (₱3,461.53... → truncate to centavo)
// Exact: use rational arithmetic: daily_rate = 3_500_000 / 26 centavos per day
retirement_pay = (3_500_000 * 225 * 22) / (26 * 10)  // 225/10 = 22.5, avoid fp
= (3_500_000 * 4_950) / 260
= 17_325_000_000 / 260
= 66_634_615 centavos
= ₱666,346.15
```

**Maria's heirs receive:** ₱666,346.15 statutory retirement pay (plus additional final pay components: pro-rated 13th month, unused SIL, accrued wages to date of death).

---

## Legal Citations

| Citation | Relevance |
|----------|-----------|
| RA 7641, Sec. 1 (Art. 302, Labor Code) | Statutory retirement pay formula |
| Civil Code, Art. 777 | Rights transmitted to heirs from moment of death |
| DOLE IRR Rule II, Sec. 4 | Retirement ages; service computation rules |
| DOLE Labor Advisory 06-20 | 30-day final pay rule applies to death separations |
| NIRC Sec. 32(B)(6)(a) | Income tax exemption conditions (for living retiree) |
| NIRC Sec. 85 | Gross estate inclusions (for deceased's retirement pay) |
| NIRC Sec. 86(A)(5) | Standard deduction for gross estate (₱5,000,000 under TRAIN) |
| TRAIN Law (RA 10963) | Estate tax flat rate of 6% |
| In dubio pro labor | Labor law pro-worker interpretation principle |
