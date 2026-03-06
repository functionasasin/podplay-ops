# Deep Dive: Retirement Pay Engine (RA 7641)

**Source:** Imported from `loops/ph-compliance-moats-reverse/analysis/deepdive-retirement-pay-ra7641.md`
**Original Date:** 2026-02-24
**Imported:** 2026-03-06
**Status:** READ-ONLY — Do not modify. Source of truth from ph-compliance-moats-reverse loop.

---

## What It Is

RA 7641 mandates a statutory minimum retirement benefit for every private-sector employee in the Philippines who has no company retirement plan (or whose company plan gives less than the statutory minimum). The law is straightforward in principle: pay a retiring employee based on their length of service.

The trap is the formula. The law defines "one-half (1/2) month salary" as a legal term of art — and that definition is what trips everyone up.

---

## The Core Problem: "Half-Month" Doesn't Mean 15 Days

**What most people compute:**
> Half a month = 15 days. Simple.

**What the law actually says (RA 7641, Sec. 1):**
> "one-half (1/2) month salary shall include all of the following: fifteen (15) days salary based on the latest salary rate; the cash equivalent of five (5) days of service incentive leave; and one-twelfth (1/12) of the thirteenth month pay due the employee."

**The real formula:**
```
"Half-month salary" under RA 7641 = 15 days + 5 days SIL + (1/12 × 13th month)
                                    = 15 days + 5 days + 2.5 days (since 13th month = 1 month = 26 working days ÷ 12 ≈ 2.17 days)
                                    ≈ 22.5 days total
```

The Supreme Court confirmed this in *Elegir v. Philippine Airlines, Inc.*:
> "one-half (1/2) month salary means 22.5 days"

**The systematic underpayment:** Employers using 15 days per year instead of 22.5 days are underpaying every retiring employee by **exactly 33%**. Not approximately. Exactly — because 22.5 / 15 = 1.5.

This is not a gray area. It is a documented, widespread compliance failure.

---

## The Full Formula

**Eligibility:**
- Age 60 (optional retirement) or 65 (compulsory)
- Minimum 5 years of service with the same employer
- Exception: establishments with ≤10 regular employees are exempt from RA 7641 (but not from voluntary company plans)

**Formula:**
```
Daily Rate = Monthly Basic Salary ÷ 26 working days

Retirement Pay = Daily Rate × 22.5 days × Credited Years of Service

Credited Years = actual full years of service
  + 1 additional year if partial year ≥ 6 months (rounding rule)
  (e.g., 14 years and 7 months → counted as 15 years)
```

**Shortcut:**
```
Retirement Pay = Monthly Salary × 0.8654 × Years of Service
  (because 22.5 ÷ 26 = 0.8654)
```

**Salary basis — what's included:**
- Latest basic monthly salary
- Integrated COLA (if COLA has been absorbed into basic salary)
- Any allowances contractually deemed part of basic pay

**Salary basis — what's excluded:**
- Pure COLA not yet integrated
- Overtime pay
- Night shift differentials
- Most variable allowances (transportation, meal, representation) unless contractually integrated

---

## Use Case: The Retiring Factory Supervisor

> *Mario has worked for a garments factory in Caloocan for 32 years. He turns 65 this year. His latest monthly basic salary is ₱28,000. The company has no registered retirement plan. The HR manager tells him his retirement pay is ₱430,000. He signs and accepts.*

**What HR computed (wrong):**
```
Daily Rate = ₱28,000 ÷ 26 = ₱1,076.92
Retirement Pay = ₱1,076.92 × 15 days × 32 years
               = ₱516,923

(HR rounded down, said ₱430,000 — they also miscounted his years.)
```

**What he's actually owed (correct):**
```
Daily Rate = ₱28,000 ÷ 26 = ₱1,076.92
Credited Years = 32 (no rounding needed — exact full years)
Retirement Pay = ₱1,076.92 × 22.5 × 32
               = ₱775,385
```

**Mario was underpaid by ₱258,462.** He signed away his right without knowing. That's 9+ months of salary, lost to a definitional misunderstanding.

If Mario had consulted a labor lawyer before signing: ₱10,000–₱25,000 consultation fee, ₱775,000 in correct retirement pay. The tool eliminates the consultation fee; the recovery stays with Mario.

---

## Why This Is the Inheritance Engine Pattern

The inheritance engine thesis: **Philippine law contains statutory formulas that professionals charge to compute, that laypeople systematically get wrong, that the statute already defines precisely, and that therefore are automatable.**

Retirement pay is the clearest analog:

| Factor | Inheritance Engine | Retirement Pay |
|--------|-------------------|----------------|
| Source formula | Civil Code legitimes + intestate order | RA 7641 "22.5 days" definition |
| Common error | Wrong legitime fractions, missed preterition | 15 days instead of 22.5 days |
| Error type | Non-intuitive statutory rule | Counter-intuitive definition of "half" |
| Underpayment magnitude | Varies | Exactly 33% per retiree |
| Professional fee | ₱30K–₱100K+ | ₱5K–₱25K per computation |
| Public tool exists? | No | No |
| Verdict | HIGH | HIGH |

---

## The Market

**Volume:**
- Philippines has ~50M employed workers; aging workforce means hundreds of thousands reaching 60–65 annually
- All private-sector employers (except ≤10 employee establishments) are covered
- Every year, a cohort of employees turns 65 — each one is a potential retirement pay computation event
- The NLRC handles thousands of retirement pay disputes annually; this is a top money claim category

**Who gets it wrong:**
- SMEs and family businesses (primary offenders — no dedicated HR/legal)
- Casual/contractual arrangements formalized after years of service (service period disputes compound the formula errors)
- BPO companies with high turnover and young workforces where retirement pay wasn't front-of-mind for years, then suddenly is

**Professional fee range:**
- Labor lawyer memo/computation: ₱5,000–₱25,000 per retiree
- NLRC money claim filing fee + attorney's fees: 10% of award (often ₱50,000–₱200,000 for long-tenured employees)
- HR consultant engagement for batch computation (company retrenchment/restructuring): ₱3,000–₱10,000 per employee

---

## Computation Decision Tree (Full)

```
INPUT:
  - Monthly basic salary (latest rate)
  - Date of hire
  - Date of retirement (or separation date)
  - Reason for separation (optional/compulsory retirement, or early retirement under company plan)
  - Whether COLA is integrated into basic
  - Whether employer has ≤10 employees

STEP 1: Eligibility check
  - Age ≥ 60? → eligible for optional retirement
  - Age ≥ 65? → compulsory retirement (employer must pay even if no company plan)
  - Service ≥ 5 years? → eligible (if < 5 years, no RA 7641 entitlement)
  - Employer ≤ 10 employees? → exempt from RA 7641 (check company plan separately)

STEP 2: Credited years of service
  - Compute full years from hire date to separation date
  - If partial year ≥ 6 months: round UP to next full year
  - If partial year < 6 months: drop the partial year

STEP 3: Daily rate
  - Daily Rate = Monthly Basic Salary ÷ 26

STEP 4: Retirement pay
  - Statutory minimum = Daily Rate × 22.5 × Credited Years
  - If company plan exists: compare to statutory minimum; pay whichever is HIGHER

STEP 5: Tax treatment
  - Tax exempt if ALL of:
    a) Employee is ≥ 50 years old at retirement
    b) Employee has ≥ 10 years of service
    c) First time to receive retirement benefit from same employer
    d) Benefit comes from a BIR-approved (Revenue Regulation 1-68) retirement plan
  - Without a BIR-approved plan: statutory RA 7641 benefit is technically taxable
    (creates planning opportunity: establish BIR-approved plan before mass retirement event)

STEP 6: Output
  - Retirement pay amount
  - Daily rate used
  - Credited years applied
  - Rounding rule applied? (Y/N)
  - Tax treatment flag (exempt / potentially taxable / consult CPA)
  - Comparison to company plan benefit if applicable
```

---

## Additional Interaction: Separation Pay vs. Retirement Pay

A retiring employee who is also being retrenched (age 60+, company downsizing) may be entitled to **both** separation pay and retirement pay — whichever results in the higher total benefit. Some companies try to pay only one; both are separately mandated.

The engine should flag: "Employee meets criteria for both RA 7641 retirement pay and Art. 298 separation pay — compute both and pay the higher."

---

## Edge Cases Worth Handling

| Scenario | Rule |
|----------|------|
| Employee retires at 60 but has only 4.5 years of service | No RA 7641 entitlement (< 5 years). Company plan governs, if any. |
| 6-month rounding: 7 years and 5 months | Count as 7 years (partial < 6 months, drop) |
| 6-month rounding: 7 years and 7 months | Count as 8 years (partial ≥ 6 months, round up) |
| COLA not integrated | Use basic salary only, exclude COLA from daily rate |
| Employee transferred between related companies | Jurisprudence allows aggregation of service in some cases — requires legal review flag |
| Employer claims establishment has ≤10 employees | Tool flags for verification (common misuse of exemption) |
| Death before retirement | Heirs are entitled to retirement pay as if employee retired on date of death |

---

## The Product Shape

**Minimum viable:**
A web form. Enter salary, hire date, retirement date, regime. Output: retirement pay amount, period breakdown, whether 22.5-day formula was applied, tax treatment flag.

**Higher value:**
- **Batch mode:** Upload CSV of all employees approaching retirement. Generate schedule of retirement pay obligations per employee — exactly what HR does manually before a company-wide restructuring or mass retirement event.
- **Company plan gap analysis:** Input company plan formula → compare to RA 7641 → show which employees are undercovered and by how much.
- **NLRC money claim worksheet:** Generate a formatted statement of computation suitable for filing as an exhibit in an NLRC complaint.
- **Tax advisory flag:** Flag the BIR-approved plan planning opportunity when a company is approaching a mass retirement event.

---

## Cross-References

- **Legal Interest Engine:** NLRC retirement pay awards carry 6% p.a. interest from finality of judgment (Nacar). The retirement pay computation feeds the interest computation engine.
- **Final Pay Computation (DOLE LA 06-20):** Retirement pay is a component of final pay — the retirement pay engine output plugs directly into the final pay engine.
- **NIRC Sec. 32(B)(6)(a):** Tax exemption requires BIR-approved retirement plan. Flag interaction for tax planning.
- **Separation Pay (Art. 298):** Double-check whether employee qualifies for both; pay the higher amount.
