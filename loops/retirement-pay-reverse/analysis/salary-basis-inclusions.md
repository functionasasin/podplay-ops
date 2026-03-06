# Analysis: Salary Basis — Inclusions and Exclusions

**Wave:** 2 — Domain Rule Extraction
**Aspect:** salary-basis-inclusions
**Date:** 2026-03-06
**Sources:** ra7641-full-text.md, deepdive-retirement-pay-ra7641.md, dole-final-pay-la06-20.md, labor-code-art302.md

---

## Statutory Basis

**RA 7641 / IRR Rule II, Sec. 5** states retirement pay is computed using:

> "fifteen (15) days salary based on the **latest salary rate**"

The operative phrase is "latest salary rate" — meaning the salary at the time of retirement, not historical or averaged salary. The type of compensation that constitutes "salary" for this purpose is the key question this aspect addresses.

**DOLE Labor Advisory (Guidelines for Effective Implementation of RA 7641)** provides the single most authoritative administrative clarification:

> "COLA Exclusion: The cost-of-living allowance (COLA) is NOT included in the salary basis for retirement pay computation."

---

## What Is Included in the Salary Basis

### 1. Basic Monthly Salary (Always Included)

The primary input. "Latest salary rate" means the employee's basic monthly salary as of the retirement date.

- **Monthly-paid employees**: The contractual monthly basic salary
- **Weekly-paid employees**: Weekly rate × 52 / 12 = annualized monthly equivalent
- **Daily-paid employees**: Daily rate × 26 = imputed monthly salary (for those paid daily but whose work is regular/ongoing)
- **Part-time employees**: Pro-rated equivalent of full-time rate

### 2. Integrated COLA (Conditionally Included)

COLA that has been formally absorbed into the basic salary is included.

**Condition for inclusion**: The integration must be documented by:
- An employment contract clause stating COLA is part of basic pay, OR
- A CBA provision integrating COLA into basic pay, OR
- A company-wide integration memo/policy converting COLA to salary

**Practical note**: Many Philippine employers issued COLA integration memos following Wage Order implementation. Where this integration was formalized, the integrated amount is "basic pay" for all purposes including retirement pay.

### 3. Contractually-Defined Basic Pay Components (Conditionally Included)

Any allowance or benefit that:
- Is expressly defined in the employment contract, CBA, or company policy as "part of basic salary," AND
- Is paid regularly and continuously (not contingent on specific events or outputs)

Examples of allowances that may qualify depending on documentation:
- "Basic pay supplement" labeled explicitly as salary
- Fixed monthly "allowances" that are in practice guaranteed base compensation (substance over form)

**Key test**: Is the payment a fixed, regular, and unconditional component of the employee's compensation regardless of attendance variations? If yes → included. If contingent on hours/outputs/attendance → excluded.

---

## What Is Excluded from the Salary Basis

The following are definitively excluded. Each has a specific legal basis.

| Item | Excluded? | Authority |
|------|-----------|-----------|
| COLA (not integrated) | YES — always excluded | DOLE Labor Advisory (explicit) |
| COLA (integrated into basic) | NO — included | IRR Rule II; DOLE Advisory |
| Overtime pay | YES | IRR Rule II, Sec. 5; longstanding DOLE practice |
| Night shift differential (NSD) | YES | Labor Code Art. 86; IRR |
| Holiday premium pay | YES | Not part of basic salary |
| Variable allowances (transportation, meal, representation) | YES (unless contractually integrated) | IRR; DOLE practice |
| Commission income | YES (base pay component only — see below) | IRR; jurisprudence |
| Profit-sharing / bonuses | YES | Not regular salary |
| 13th month pay | Not used as input — appears only as formula component | PD 851; RA 7641 formula |
| Service incentive leave (SIL) | Not used as input — appears only as formula component | Labor Code Art. 95; RA 7641 formula |
| Hazard pay | YES (unless integrated per employment contract) | Not part of basic salary |
| Emergency cost of living allowances | YES | DOLE Advisory |

### COLA Detail

COLA under various wage orders is not part of basic pay unless formally integrated. The DOLE Advisory is explicit and unambiguous on this point. The RA 7641 formula uses "salary" — and COLAs are statutory supplements to, not part of, basic salary.

**Why this matters in practice**: Many employees receive monthly pay stubs showing "Basic: PHP 12,000 + COLA: PHP 1,500 = PHP 13,500." The retirement pay formula uses PHP 12,000 (basic), not PHP 13,500 (total).

However, if a wage order integration memo states "COLA of PHP 1,500 hereby absorbed into basic pay; new basic pay = PHP 13,500," then the salary basis is PHP 13,500.

### Commission Income

For employees whose primary compensation includes commissions:
- If there is an identifiable fixed base pay component: use the base pay only
- If total compensation is commission-only (no fixed base): use the piece-rate/average rule (see below)

### Bonuses and 13th Month Pay (Not Double-Counted)

The 13th month pay appears in the RA 7641 formula as `1/12 of 13th month pay` — this is a fixed formula component, **not** based on the actual 13th month pay received. The formula uses `1/12 × monthly_salary` to approximate the 13th month component. The actual 13th month pay received is never used as an input to the retirement pay formula.

---

## Piece-Rate and Output-Based Employees

**IRR Rule II, Sec. 5:**

> "For piece-rate or those paid by results: Daily Rate = Average Daily Salary (ADS) for the last 12 months / actual working days in that period"

**Algorithm:**

```
ADS = Total basic earnings in last 12 months ÷ Actual working days in that period

Where:
  Total basic earnings = Sum of all piece-rate / output-based earnings (excluding overtime, differentials)
  Actual working days = Calendar-counted days where employee reported for work

Retirement Pay = ADS × 22.5 × Credited Years
```

**Engine implementation**: The frontend must detect if the employee is piece-rate (`employmentType: "piece_rate"`) and collect:
- `totalEarningsLast12MonthsCentavos: i64`
- `actualWorkingDaysLast12Months: u32`

The engine then computes:
```
ads_centavos = total_earnings_centavos / actual_working_days
retirement_pay_centavos = ads_centavos * 45 * credited_years / 2
  // ADS × 22.5 × years = ADS × (45/2) × years
```

---

## CBA Provisions — Broader Inclusions

RA 7641, Sec. 1 includes a savings clause:

> "Unless the parties provide for broader inclusions, the term 'one-half (1/2) month salary' shall mean..."

This means a CBA can expand the definition of "one-half month salary" beyond 22.5 days. Common CBA expansions:
- Including 100% of SIL (more than 5 days if CBA grants more)
- Including actual 13th month in full rather than 1/12
- Including specific allowances as part of the salary basis

**Engine rule**: If a company plan or CBA provides MORE than the RA 7641 minimum, the higher amount governs (RA 7641 Sec. 2). The engine's company plan comparison feature handles this — the statutory computation is the floor, not the ceiling.

---

## Salary Input Fields (Engine Design Implications)

The engine needs the following inputs to correctly determine the salary basis:

| Field | Type | Description |
|-------|------|-------------|
| `monthlySalaryCentavos` | `i64` | Basic monthly salary in centavos (REQUIRED) |
| `employmentType` | `enum` | `"monthly"` \| `"daily"` \| `"piece_rate"` |
| `salaryDivisor` | `u8` | `26` (default) or `22` — daily rate divisor |
| `colaIntegrated` | `bool` | Whether COLA has been integrated into basic pay |
| `colaAmountCentavos` | `i64?` | COLA amount if `colaIntegrated = false` (for display only) |
| `totalEarningsLast12MonthsCentavos` | `i64?` | Required only if `employmentType = "piece_rate"` |
| `actualWorkingDaysLast12Months` | `u32?` | Required only if `employmentType = "piece_rate"` |

### Validation Rules

- `monthlySalaryCentavos` must be > 0 and ≤ 50_000_000_00 (PHP 500M/month — overflow guard)
- If `colaIntegrated = false`, the COLA amount is displayed in output as "excluded from computation" but does NOT affect the formula
- If `employmentType = "piece_rate"` and `totalEarningsLast12MonthsCentavos` is null: validation error
- `salaryDivisor` must be exactly 22 or 26; no other values accepted

---

## UI Implications

### Wizard Step 3 — Salary & Benefits

The salary input step must present:

1. **Employment type selector**: Monthly-salaried / Daily-paid / Piece-rate (affects which fields appear)

2. **Monthly basic salary input** (shown for monthly and daily types):
   - Label: "Latest Monthly Basic Salary"
   - Placeholder: "e.g., PHP 28,000"
   - Validation: PHP 500 minimum (PHP 50,000 centavos), PHP 5,000,000 maximum
   - Help text: "Enter your basic salary only — do not include COLA, allowances, or overtime"

3. **COLA question** (shown for all types):
   - "Has your COLA been formally integrated into your basic salary?"
   - Radio: Yes / No
   - If "No": display info box — "COLA is excluded from the retirement pay computation per DOLE guidelines. Only your basic salary of [amount] will be used."
   - If "Yes": The COLA is already included in the basic salary you entered above.

4. **Salary divisor** (collapsible advanced option):
   - Label: "Daily rate divisor"
   - Options: "26 days (standard — default)" or "22 days (company practice)"
   - Default: 26
   - Help text: "Most companies use 26. Use 22 only if your employment contract or company policy specifies 22 working days per month."

5. **Piece-rate inputs** (shown only if employment type = piece-rate):
   - "Total earnings in last 12 months (basic/piece-rate pay only)"
   - "Number of days actually worked in last 12 months"

---

## Output Display Implications

The results view must show the salary basis clearly:

```
Salary Basis
├── Monthly basic salary:     PHP 28,000.00
├── COLA (excluded):          PHP 1,500.00  [shown if COLA not integrated]
├── Salary used in formula:   PHP 28,000.00
├── Daily rate (÷ 26):        PHP 1,076.92
└── Salary divisor used:      26 days
```

If COLA is integrated:
```
├── Monthly basic salary      PHP 29,500.00
│   (includes integrated      [note: COLA of PHP 1,500 integrated]
│    COLA of PHP 1,500)
└── Daily rate (÷ 26):        PHP 1,134.62
```

---

## Summary of Rules

| Rule | Definitive Source |
|------|-------------------|
| Salary basis = "latest salary rate" | RA 7641 Sec. 1 |
| COLA excluded unless integrated | DOLE Labor Advisory (explicit) |
| Overtime, NSD, variable allowances excluded | IRR Rule II; DOLE practice |
| Integrated COLA (formal) included | IRR Rule II; DOLE Advisory |
| Piece-rate: use ADS of last 12 months | IRR Rule II, Sec. 5 |
| CBA may expand inclusions beyond statutory | RA 7641 Sec. 1 savings clause |
| Daily rate divisor: 26 (default) or 22 (company practice) | IRR Rule II, Sec. 5 |
| 13th month / SIL not input — they are formula constants | RA 7641 formula structure |

---

## Decision Rules for Engine

```
IF employmentType == "monthly" OR "daily":
    salary_basis = monthlySalaryCentavos
    // colaIntegrated status doesn't change this value
    // (user enters the already-integrated or already-exclusive basic salary)
    // colaIntegrated flag is for display/disclosure only

    daily_rate = salary_basis / salaryDivisor

ELSE IF employmentType == "piece_rate":
    daily_rate = totalEarningsLast12MonthsCentavos / actualWorkingDaysLast12Months

retirement_pay = daily_rate * 45 * credited_years / 2
    // 22.5 days = 45/2 days
    // Uses integer arithmetic throughout
```

**Note on the 45/52 vs 45/2 distinction**:
- `45/52` is used when starting from monthly salary (because daily_rate = monthly/26, and 22.5/26 = 45/52)
- `45/2` is used when starting from an already-computed daily rate
- Both are equivalent: (monthly/26) × (45/2) = monthly × 45/52 ✓

---

## Key Takeaway

The salary basis rules are simple: use basic pay only. The most important practical distinctions are:
1. COLA is excluded unless formally integrated — this is the single most common salary basis error
2. Overtime, NSD, and variable allowances are never included
3. Piece-rate workers use ADS instead of monthly salary
4. The definition can only be expanded (by CBA), never contracted below the statutory minimum
