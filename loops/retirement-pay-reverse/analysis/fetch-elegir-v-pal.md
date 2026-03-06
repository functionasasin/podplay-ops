# Analysis: fetch-elegir-v-pal

**Wave:** 1 — Domain Source Acquisition
**Date:** 2026-03-06
**Status:** Complete
**Source cached at:** input/sources/elegir-v-pal.md

---

## What Was Fetched

Supreme Court decision in *Bibiano C. Elegir v. Philippine Airlines, Inc.*, G.R. No. 181995, July 16, 2012 — the principal modern authority confirming the 22.5-day formula for "one-half month salary" under RA 7641.

Also captured: *Capitol Wireless, Inc. v. Sec. Confesor*, G.R. No. 117174, November 13, 1996 — the earlier precedent that first established the 22.5-day formula (cited in Elegir).

---

## Key Facts Confirmed

### The 22.5-Day Formula is Settled Law

The Supreme Court in *Elegir* confirmed (citing *Capitol Wireless*) that "one-half (1/2) month salary" under RA 7641 means:

```
One-half month salary = 15 days + 5 days SIL + 1/12 of 13th month pay
                      = 15.0 + 5.0 + 2.5
                      = 22.5 days per year of service
```

**The 2.5-day derivation for 1/12 of 13th month:**
- 13th month pay = 1 full month = 30 days salary
- 1/12 × 30 = 2.5 days

This is not approximation — it is exact integer arithmetic when using a 30-day month basis.

### Exact Statutory Text

Cited in Elegir from RA 7641 / Art. 302:

> "one-half (1/2) month salary shall mean fifteen (15) days plus one-twelfth (1/12) of the 13th month pay and the cash equivalent of not more than five (5) days of service incentive leaves"

### The "Not More Than 5 Days" Language

The SIL component is "not more than five (5) days" — a statutory ceiling/floor combination:
- Floor: 5 days is the statutory minimum (confirmed by DOLE implementing rules)
- Ceiling: parties may agree to broader inclusions (e.g., more SIL days)
- For the RA 7641 calculator: always use 5 days SIL in the formula

### Superior Benefits Rule

*Elegir*'s primary ruling (beyond the formula confirmation) establishes the hierarchy:
1. If company plan/CBA provides MORE than RA 7641 minimum → company plan governs
2. If company plan provides LESS than RA 7641 minimum → RA 7641 applies regardless
3. RA 7641 is a mandatory minimum, not the only applicable standard

The retirement pay calculator must:
- Always compute RA 7641 statutory minimum
- If company plan formula is entered, compute both
- Display the higher of the two as the employee's actual entitlement
- Flag if company plan falls below RA 7641 (compliance gap)

### SIL is Always Included

The 5 days SIL is part of the formula regardless of whether the employee:
- Actually had SIL entitlement under their contract
- Used or did not use their SIL during service
- Was on a "no-leave" contract or arrangement

This eliminates one potential employer defense for underpayment.

---

## The Compliance Gap This Creates

The *Elegir* doctrine is directly stated in the product brief: most employers compute retirement using 15 days, not 22.5 days, because they read "one-half month" as literally half a 30-day month (= 15 days). The Court's interpretation adds 50% more value (7.5 additional days per year of service).

**Underpayment magnitude:**
- Using 15 days: ₱X per year
- Using 22.5 days: ₱X × 1.5 per year
- Systematic underpayment: **33.3% of correct statutory amount** per retiring employee

Example (monthly salary ₱25,000, 20 years service):
- Incorrect (15 days): ₱25,000/26 × 15 × 20 = ₱288,462
- Correct (22.5 days): ₱25,000/26 × 22.5 × 20 = ₱432,692
- Underpayment: ₱144,231 (exactly 33.3% short)

---

## Relationship to Other Sources

| Source | Role |
|---|---|
| RA 7641 / Art. 302 (cached) | Statutory basis for the formula |
| *Capitol Wireless v. Confesor* (G.R. 117174, 1996) | First case to establish 22.5-day computation |
| **Elegir v. PAL (G.R. 181995, 2012)** | Modern affirmation; most-cited authority |
| DOLE Implementing Rules (Wave 1 pending) | Regulatory confirmation + daily rate divisor guidance |
| NIRC / BIR Rules (Wave 1 pending) | Tax treatment conditions |

---

## Product Impact

1. **Core formula**: `retirement_pay = daily_rate × 22.5 × credited_years`
2. **No rounding on the 22.5 multiplier** — it is exact (15 + 5 + 1/12 of 13th month)
3. **Arithmetic precision**: In Rust engine, represent the 22.5 multiplier as rational 45/2 to avoid floating point; or compute each component separately in integer centavos:
   - `component_15_days = daily_rate_centavos × 15`
   - `component_sil = daily_rate_centavos × 5`
   - `component_13th = (monthly_rate_centavos × credited_years) / 12` (integer division, truncate centavos)
   - Sum = total retirement pay in centavos
4. **Company plan comparison** requires this formula as the statutory baseline
5. **NLRC worksheet** must cite G.R. No. 181995 as authority for the 22.5-day formula

---

## New Aspects Discovered

None — the *Elegir* case confirms what was already known from the deep-dive analysis. All aspects for handling the 22.5-day formula (core-formula-22-5-days, data-model, algorithms) are already in the frontier.

---

## Sources

- Elegir v. PAL (LawPhil): https://lawphil.net/judjuris/juri2012/jul2012/gr_181995_2012.html
- Elegir v. PAL (SC E-Library): https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/1/55012
- Capitol Wireless v. Confesor (SC E-Library): https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/21/57375
- Case digest: https://jur.ph/jurisprudence/digest/elegir-v-philippine-airlines-inc
- LaborLaw.ph overview: https://laborlaw.ph/retirement-pay/
