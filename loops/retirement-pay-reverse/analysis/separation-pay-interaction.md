# Separation Pay Interaction — RA 7641 vs. Labor Code Art. 298-299

**Aspect**: separation-pay-interaction (Wave 2)
**Analyzed**: 2026-03-06
**Sources**: separation-pay-rules.md, nirc-tax-exemption.md, tax-treatment-conditions.md

---

## 1. Two Distinct Benefits with Independent Triggers

| Feature | Retirement Pay (RA 7641 / Art. 302) | Separation Pay (Art. 298-299) |
|---------|-------------------------------------|-------------------------------|
| Trigger | Voluntary/compulsory retirement at qualifying age | Authorized cause termination by employer |
| Age requirement | 60 (optional) or 65 (compulsory) | None |
| Service requirement | 5 years minimum | None |
| Formula "half month" | 22.5 days (15 + 5 SIL + 1/12 of 13th month) | 15 days basic pay only |
| Rate (redundancy) | 22.5 days x credited years | 30 days x years OR 1 month, whichever higher |
| Rate (retrenchment/closure) | 22.5 days x credited years | 15 days x years OR 1 month, whichever higher |
| Paid by | Employer (mandatory) | Employer (mandatory, authorized causes only) |
| Tax treatment | NIRC Sec. 32(B)(6)(a) — may be exempt | NIRC Sec. 32(B)(6)(b) — always exempt (authorized causes) |

**Critical distinction**: "1/2 month salary" means different things in each law:
- RA 7641: 22.5 days (22.5 × daily rate)
- Art. 298-299: 15 days basic pay

---

## 2. Overlap Scenarios — When an Employee Qualifies for Both

An employee qualifies for BOTH retirement pay and separation pay when ALL of these are true:
1. Employee has reached optional retirement age (60+) or compulsory age (65+)
2. Employee has at least 5 years of service
3. Employer terminates for an authorized cause (redundancy, retrenchment, closure, or disease)

### Common Scenario: Retrenchment of a Retirement-Eligible Employee

**Example**: Age 62, 15 years service, monthly salary PHP 30,000 (PHP 1,000/day)

**Retirement pay (RA 7641):**
- Daily rate: PHP 30,000 × 12 / 365 = PHP 986.30/day (or per contract: 30,000/26 = PHP 1,153.85/day)
- 1/2 month salary = 22.5 days = PHP 22,184 (using 365-day method) or PHP 25,962 (using 26-day method)
- Credited years: 15
- Retirement pay = 22.5 × 15 × daily rate

**Separation pay (Art. 298 retrenchment):**
- Rate: 1/2 month per year = 15 days × 15 years = 225 days basic pay
- Using 30,000/30 = PHP 1,000/day: PHP 1,000 × 225 = PHP 225,000

**Retirement pay (using 26-day divisor):** PHP 1,153.85 × 22.5 × 15 = PHP 389,423

In this example, retirement pay (PHP 389,423) > separation pay (PHP 225,000).

---

## 3. The "Pay the Higher" Rule — Jurisprudence

### NO automatic "pay the higher" rule in Philippine law

Unlike some jurisdictions, Philippine law does NOT have a statutory rule that says "pay only the higher of retirement pay or separation pay." The default under Philippine jurisprudence is that BOTH may be payable independently.

**Aquino v. NLRC, G.R. No. 87653 (February 11, 1992):**
- Separation pay and retirement benefits are NOT alternative but can be cumulative
- If the employer's CBA or company policy does NOT contain a crediting clause, both must be paid
- "Any doubt concerning the rights of labor should be resolved in its favor" (in dubio pro labore)

**Goodyear Philippines, Inc. v. Angus, G.R. No. 185449 (November 12, 2014):**
- Both separation pay AND retirement pay awarded to qualified retrenched employees
- Labor Code does not prohibit dual recovery

### Exception: Crediting Clause in CBA or Company Policy

If the employer's CBA or retirement plan document contains an explicit provision stating that separation pay is credited against or deducted from retirement pay (or vice versa), then only the net difference (or the higher amount) is due. The crediting clause is enforceable when:
1. It is explicitly stated in a written CBA or company policy
2. The employee was given notice of the policy
3. The provision does not result in waiving a right granted by law (i.e., the net amount must be >= RA 7641 statutory minimum)

---

## 4. Three Distinct Payment Scenarios

### Scenario A: Dual Entitlement (No Crediting Clause)
- Employee receives BOTH retirement pay AND separation pay
- Most common in retrenchments, closures, redundancies affecting retirement-age workers
- Total liability = retirement pay amount + separation pay amount
- Applicable law: *Aquino v. NLRC*; *Goodyear v. Angus*

### Scenario B: Crediting Clause Applies — Pay the Higher
- Employer's CBA/policy says: "separation pay shall be credited against retirement pay"
- Only the higher of the two is due
- If retirement pay > separation pay: pay retirement pay only (the difference is owed beyond what separation pay covers)
- If separation pay > retirement pay: theoretically the employer has already paid more than the RA 7641 minimum; but note RA 7641 minimum cannot be waived, so pay at least RA 7641 amount
- In practice: when the crediting clause exists and separation pay is lower, the employer pays retirement pay (which subsumes/exceeds the separation pay obligation)

### Scenario C: Only Separation Pay (Not Yet Retirement-Eligible)
- Employee is terminated for authorized cause but is under 60 years old or has < 5 years service
- Only separation pay applies
- No retirement pay entitlement under RA 7641
- (Note: company plan may still apply if it has lower eligibility thresholds)

---

## 5. Decision Algorithm

```
function computePaymentScenario(
    age: u32,
    credited_years: u32,               // post-rounding
    authorized_cause: Option<AuthorizedCause>,
    has_crediting_clause: bool,
    retirement_pay_amount_centavos: i64,
    separation_pay_amount_centavos: i64,
) -> PaymentScenario:

    retirement_eligible = (age >= 60) AND (credited_years >= 5)
    separation_eligible = authorized_cause.is_some()

    if NOT retirement_eligible AND NOT separation_eligible:
        return PaymentScenario::NeitherEligible

    if retirement_eligible AND NOT separation_eligible:
        return PaymentScenario::RetirementOnly {
            retirement_pay: retirement_pay_amount_centavos
        }

    if NOT retirement_eligible AND separation_eligible:
        return PaymentScenario::SeparationOnly {
            separation_pay: separation_pay_amount_centavos
        }

    // Both eligible
    if has_crediting_clause:
        // Pay the higher
        higher = max(retirement_pay_amount_centavos, separation_pay_amount_centavos)
        net_retirement = retirement_pay_amount_centavos - separation_pay_amount_centavos
        if net_retirement > 0:
            return PaymentScenario::CreditedRetirementHigher {
                total_due: retirement_pay_amount_centavos,
                already_covered_by_sep_pay: separation_pay_amount_centavos,
                additional_due: net_retirement,
            }
        else:
            // Separation pay exceeds retirement pay — still must pay RA 7641 minimum
            return PaymentScenario::CreditedSeparationHigher {
                total_due: separation_pay_amount_centavos,
                // RA 7641 minimum is already satisfied since sep_pay > ret_pay
            }
    else:
        // Dual entitlement — pay both
        return PaymentScenario::DualEntitlement {
            retirement_pay: retirement_pay_amount_centavos,
            separation_pay: separation_pay_amount_centavos,
            total: retirement_pay_amount_centavos + separation_pay_amount_centavos,
        }
```

### Authorized Cause Enum

```rust
pub enum AuthorizedCause {
    LaborSavingDevices,    // Art. 298 — 1 month/year rate
    Redundancy,            // Art. 298 — 1 month/year rate
    Retrenchment,          // Art. 298 — 1/2 month/year rate
    ClosureNotDueToLosses, // Art. 298 — 1/2 month/year rate
    ClosureDueToLosses,    // Art. 298 — NOT required (but may be paid voluntarily)
    Disease,               // Art. 299 — 1/2 month/year rate
}
```

### Separation Pay Rate by Cause

| AuthorizedCause | Rate per Year | Minimum |
|----------------|---------------|---------|
| LaborSavingDevices | 30 days × years | 1 month pay |
| Redundancy | 30 days × years | 1 month pay |
| Retrenchment | 15 days × years | 1 month pay |
| ClosureNotDueToLosses | 15 days × years | 1 month pay |
| ClosureDueToLosses | PHP 0 (not required) | PHP 0 |
| Disease | 15 days × years | 1 month pay |

**Important**: "1 month pay" minimum = 26 days (one full calendar month of basic pay using 26-day divisor). If `15 days × years < 26 days` (i.e., years < 2), then 26 days is the minimum.

---

## 6. Separation Pay Computation Formula

```
// Separation pay "1/2 month" = 15 days basic pay (NOT 22.5 days — see Art. 298)
daily_rate_centavos = monthly_basic_centavos * 12 / 365   // calendar day method
OR
daily_rate_centavos = monthly_basic_centavos / 26          // working day method (preferred for separation pay)

// For 1-month-per-year causes (redundancy, labor-saving devices):
sep_pay_centavos = max(
    30 * daily_rate_centavos * credited_years,
    26 * daily_rate_centavos    // 1-month minimum
)

// For 1/2-month-per-year causes (retrenchment, closure not due to losses, disease):
sep_pay_centavos = max(
    15 * daily_rate_centavos * credited_years,
    26 * daily_rate_centavos    // 1-month minimum
)
```

---

## 7. Tax Treatment in Overlap Scenarios

### Retirement Pay Tax
- Subject to RA 7641 / RA 4917 exemption rules (see `tax-treatment-conditions.md`)
- Exempt if: (age >= 60 AND service >= 5 AND first-time) OR (age >= 50 AND service >= 10 AND BIR plan AND first-time)

### Separation Pay Tax
- Always exempt under NIRC Sec. 32(B)(6)(b) when due to authorized causes (Art. 298-299)
- No age, service, or BIR plan requirement
- The exemption is independent of the retirement pay exemption

### Dual Entitlement Tax
- Both amounts are independently exempt
- Retirement pay: exempt under Sec. 32(B)(6)(a) if conditions met
- Separation pay: exempt under Sec. 32(B)(6)(b) regardless
- The "once-in-a-lifetime" restriction applies to the retirement pay exemption, NOT to separation pay
- Receiving tax-exempt separation pay does NOT consume the once-in-a-lifetime retirement exemption

---

## 8. Rust Data Model Requirements

### Input additions for separation pay interaction

```rust
pub enum AuthorizedCause {
    LaborSavingDevices,
    Redundancy,
    Retrenchment,
    ClosureNotDueToLosses,
    ClosureDueToLosses,
    Disease,
}

pub struct RetirementInput {
    // ... existing fields ...
    pub authorized_cause: Option<AuthorizedCause>,  // None if pure retirement (not terminated)
    pub has_crediting_clause: bool,                  // Employer CBA/policy credits sep pay against retirement pay
}
```

### Output additions

```rust
pub struct SeparationPayComparison {
    pub authorized_cause: Option<AuthorizedCause>,
    pub separation_pay_centavos: i64,             // 0 if no authorized cause
    pub separation_pay_daily_rate_centavos: i64,  // 15-day "half month" rate
    pub credited_years: u32,
    pub payment_scenario: PaymentScenario,
    pub dual_entitlement_note: Option<String>,    // Legal citation when dual entitlement applies
    pub crediting_clause_applied: bool,
}

pub enum PaymentScenario {
    RetirementOnly,
    SeparationOnly { separation_pay_centavos: i64 },
    DualEntitlement {
        retirement_pay_centavos: i64,
        separation_pay_centavos: i64,
        total_centavos: i64,
    },
    CreditedRetirementHigher {
        total_due_centavos: i64,
        sep_pay_offset_centavos: i64,
        additional_retirement_due_centavos: i64,
    },
    CreditedSeparationHigher {
        total_due_centavos: i64,  // sep pay already satisfies RA 7641 minimum
    },
    NeitherEligible,
}
```

### TypeScript/JSON output (camelCase):

```typescript
type AuthorizedCause =
  | "LaborSavingDevices"
  | "Redundancy"
  | "Retrenchment"
  | "ClosureNotDueToLosses"
  | "ClosureDueToLosses"
  | "Disease";

type PaymentScenario =
  | { tag: "RetirementOnly" }
  | { tag: "SeparationOnly"; separationPayCentavos: number }
  | {
      tag: "DualEntitlement";
      retirementPayCentavos: number;
      separationPayCentavos: number;
      totalCentavos: number;
    }
  | {
      tag: "CreditedRetirementHigher";
      totalDueCentavos: number;
      sepPayOffsetCentavos: number;
      additionalRetirementDueCentavos: number;
    }
  | { tag: "CreditedSeparationHigher"; totalDueCentavos: number }
  | { tag: "NeitherEligible" };

interface SeparationPayComparison {
  authorizedCause: AuthorizedCause | null;
  separationPayCentavos: number;
  separationPayDailyRateCentavos: number;
  creditedYears: number;
  paymentScenario: PaymentScenario;
  dualEntitlementNote: string | null;
  creditingClauseApplied: boolean;
}
```

---

## 9. UI Requirements

### Wizard Step 4 — Retirement Details (additions)

Additional fields when employer has terminated for an authorized cause:

1. `authorizedCause` — Enum select, label: "Authorized Cause of Termination"
   - Options: None (pure retirement), Labor-Saving Devices, Redundancy, Retrenchment, Closure (not due to losses), Closure (due to serious losses), Disease/Illness
   - Default: None
   - Show only if: employee is being separated, not purely retiring voluntarily

2. `hasCreditingClause` — Boolean toggle, label: "Does the employer's CBA or company policy credit separation pay against retirement pay?"
   - Helper text: "If yes, only the higher amount is due. If no, both amounts may be owed independently (Aquino v. NLRC)."
   - Shown when: `authorizedCause` is not null and employee is retirement-eligible
   - Default: false

### Results Display — Separation Pay Comparison Card

A dedicated card in the results view showing:

1. **DualEntitlement scenario:**
   - Header: "Dual Entitlement — Both Benefits Owed"
   - Badge: amber/orange "Dual Entitlement"
   - Show: Retirement Pay amount + Separation Pay amount = Total
   - Legal note: "Under *Aquino v. NLRC* (G.R. No. 87653), both retirement pay and separation pay may be awarded when the employee independently qualifies for each. The employer's CBA does not contain a crediting provision."
   - Separation pay tax note: "Separation pay due to [cause] is tax-exempt under NIRC Sec. 32(B)(6)(b)."

2. **CreditedRetirementHigher scenario:**
   - Header: "Retirement Pay is Higher — Crediting Clause Applies"
   - Show: Separation pay (already paid or offsetting): [amount] | Additional retirement due: [difference]
   - Total owed: retirement pay amount

3. **RetirementOnly scenario:**
   - No separation pay card shown (or a collapsed note: "No authorized cause termination")

4. **SeparationOnly scenario:**
   - Header: "Separation Pay Only — Employee Not Yet Retirement-Eligible"
   - Show separation pay breakdown

### NLRC Worksheet Additions

When dual entitlement applies, the NLRC worksheet must include:
```
IV. SEPARATION PAY (Art. 298, Labor Code)
Cause: [Authorized Cause]
Rate: [1/2 or 1 month] per year of service
Daily rate: PHP [X] (monthly basic / 26)
Credited years: [N]
Separation pay: PHP [Y] ([rate_days] days × [N] years × PHP [daily rate])

V. TOTAL MONEY CLAIM
   Retirement pay:    PHP [A]
   Separation pay:    PHP [B]
   ─────────────────────────
   TOTAL:             PHP [A+B]

   Note: Under Aquino v. NLRC (G.R. No. 87653, Feb. 11, 1992) and Goodyear
   Philippines v. Angus (G.R. No. 185449, Nov. 12, 2014), an employee who
   qualifies independently for both retirement pay and separation pay is
   entitled to receive both benefits. No crediting provision exists in the
   applicable CBA or company policy.
```

---

## 10. Test Vectors for Separation Pay Interaction

### TV-SEP-01: Pure Retirement, No Authorized Cause
- Input: age=62, years=15, authorized_cause=None, has_crediting_clause=false
- Output: PaymentScenario::RetirementOnly
- Separation pay: PHP 0

### TV-SEP-02: Dual Entitlement — Retrenchment, No Crediting Clause
- Input: age=62, years=15, monthly_basic=30000, authorized_cause=Retrenchment, has_crediting_clause=false
- Separation pay = max(15 × (30000/26) × 15, 26 × (30000/26)) = max(259,615, 30,000) = PHP 259,615
- Retirement pay = 22.5 × (30000/26) × 15 = PHP 389,423
- Scenario: DualEntitlement, total = PHP 649,038

### TV-SEP-03: Crediting Clause — Retirement Higher
- Input: age=62, years=15, monthly_basic=30000, authorized_cause=Retrenchment, has_crediting_clause=true
- Separation pay = PHP 259,615 (same as above)
- Retirement pay = PHP 389,423 (same as above)
- Retirement > separation → CreditedRetirementHigher
- total_due = PHP 389,423
- sep_pay_offset = PHP 259,615
- additional_retirement_due = PHP 129,808

### TV-SEP-04: Only Separation Pay Eligible — Age 45
- Input: age=45, years=15, authorized_cause=Redundancy, has_crediting_clause=false
- Not retirement-eligible (age < 60)
- Separation pay = max(30 × (salary/26) × 15, 26 × (salary/26)) — 1-month-per-year rate
- Scenario: SeparationOnly

### TV-SEP-05: Closure Due to Serious Losses — No Separation Pay Due
- Input: age=62, years=15, authorized_cause=ClosureDueToLosses, has_crediting_clause=false
- Separation pay = PHP 0 (not legally required for serious-loss closure)
- Scenario: RetirementOnly (retirement pay still due under RA 7641)
- Note: RA 7641 retirement pay is NOT affected by the serious-loss exemption for separation pay

### TV-SEP-06: Neither Eligible — Age 45, No Authorized Cause
- Input: age=45, years=3, authorized_cause=None
- Under 60, under 5 years → not retirement-eligible
- No authorized cause → no separation pay
- Scenario: NeitherEligible

---

## 11. Legal References

- Labor Code Art. 298 [formerly Art. 283] — Authorized causes: installation of labor-saving devices, redundancy, retrenchment, closure
- Labor Code Art. 299 [formerly Art. 284] — Disease as ground for termination
- RA 7641 / Labor Code Art. 302 — Retirement pay law, 22.5-day formula
- Aquino v. NLRC, G.R. No. 87653 (February 11, 1992) — Dual entitlement to retirement and separation pay
- Goodyear Philippines, Inc. v. Angus, G.R. No. 185449 (November 12, 2014) — Both retirement and separation pay awarded in retrenchment
- NIRC Sec. 32(B)(6)(a) — Tax exemption for retirement pay
- NIRC Sec. 32(B)(6)(b) — Tax exemption for separation pay (authorized causes)
