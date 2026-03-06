# OSD Computation — Working Notes

**Aspect:** osd-computation
**Wave:** 2 — Domain Rules Extraction
**Date:** 2026-03-01

---

## Summary

Optional Standard Deduction (OSD) is governed by NIRC Sec. 34(L) as amended by TRAIN (RA 10963). For individuals (self-employed, professionals, sole proprietors), OSD = 40% of gross sales or gross receipts. The net taxable income under OSD = 60% of the OSD base.

Key finding: **8% always beats OSD** for pure-business taxpayers with gross ≤ ₱3M (when eligible). OSD is only the optimal choice when:
(a) Gross > ₱3M (8% unavailable), AND
(b) Actual expenses < 40% of gross receipts (otherwise itemized wins)

---

## Source Material

- NIRC Sec. 34(L): OSD = 40% of gross sales/receipts for individuals
- RR No. 16-2008: OSD implementing rules — election procedure, irrevocability
- BIR Form 1701A: Line items 36-46 (Graduated + OSD section)
- BIR Form 1701: Schedule 1 — OSD computation schedule
- BIR Form 1701Q: Schedules I and II — Quarterly OSD computation (cumulative)

---

## Key Rules Extracted

### Election Timing
- Must be signified in the **first quarterly return** of the taxable year (Q1 Form 1701Q, or simultaneously Q1 Form 2551Q)
- For new registrants who haven't filed a Q1 return yet: election may be signified in the Certificate of Registration or first quarterly return filed
- Election is **irrevocable** for the taxable year once filed in Q1
- Election does NOT carry over to the next year — must re-elect annually
- Failure to elect in Q1 = automatically considered itemized for that year

### OSD Base for Service Providers
```
osd_base_service = gross_receipts - passive_income_with_final_WHT
osd_amount = osd_base_service * 0.40
```
Gross receipts = all amounts received for professional/service income
Passive income excluded: interest income subject to FWT (20%), dividend income subject to FWT (10%), PCSO/lotto winnings, other final-tax items

### OSD Base for Traders (Goods Sellers)
```
gross_sales_net = gross_sales - sales_returns - sales_allowances - sales_discounts
gross_income_trader = gross_sales_net - cost_of_goods_sold
osd_base_trader = gross_income_trader - passive_income_with_final_WHT
osd_amount = osd_base_trader * 0.40
```
IMPORTANT: For traders, OSD is 40% of GROSS INCOME (after COGS), NOT gross sales.
For corporations: OSD is also 40% of gross income — but corporation rules don't apply here.

### Net Taxable Income
```
nti_osd = osd_base - osd_amount = osd_base * 0.60
```

### What OSD Covers
OSD is IN LIEU of ALL deductions under Sec. 34(A)-(K):
- Cannot deduct any itemized expense AND take OSD
- Cannot selectively use OSD for some expenses and itemize others
- NOLCO (Net Operating Loss Carry-Over) is NOT available to OSD users
- Charitable contribution deduction (Sec. 34H): Not available separately — covered by OSD

### Financial Statement Requirements
- Gross receipts < ₱3M AND OSD elected: Financial statements NOT required to be attached to annual return
- Gross receipts ≥ ₱3M: Audited FS required under RR 4-2019 even if OSD elected
  (The FS requirement is separate from whether you can claim OSD — OSD computation doesn't reference FS)
- Must maintain FS and make available to BIR upon demand

### Quarterly OSD Computation (Cumulative Method)
Quarter 1:
  cumulative_gross_receipts_Q1 = Q1 gross receipts
  cumulative_osd_Q1 = cumulative_gross_receipts_Q1 * 0.40
  cumulative_nti_Q1 = cumulative_gross_receipts_Q1 * 0.60
  cumulative_it_Q1 = graduated_tax(cumulative_nti_Q1)
  quarterly_tax_payable_Q1 = cumulative_it_Q1 - CWT_Q1

Quarter 2:
  cumulative_gross_receipts_Q2 = (Q1 + Q2) gross receipts
  cumulative_osd_Q2 = cumulative_gross_receipts_Q2 * 0.40
  cumulative_nti_Q2 = cumulative_gross_receipts_Q2 * 0.60
  cumulative_it_Q2 = graduated_tax(cumulative_nti_Q2)
  quarterly_tax_payable_Q2 = cumulative_it_Q2 - quarterly_tax_payable_Q1 - CWT_Q1_Q2

Quarter 3:
  cumulative_gross_receipts_Q3 = (Q1 + Q2 + Q3) gross receipts
  cumulative_osd_Q3 = cumulative_gross_receipts_Q3 * 0.40
  cumulative_nti_Q3 = cumulative_gross_receipts_Q3 * 0.60
  cumulative_it_Q3 = graduated_tax(cumulative_nti_Q3)
  quarterly_tax_payable_Q3 = cumulative_it_Q3 - Q1_paid - Q2_paid - CWT_Q1_Q2_Q3

Annual:
  annual_gross_receipts = (Q1 + Q2 + Q3 + Q4) gross receipts
  annual_osd = annual_gross_receipts * 0.40
  annual_nti = annual_gross_receipts * 0.60
  annual_it = graduated_tax(annual_nti)
  balance_payable = annual_it - Q1_paid - Q2_paid - Q3_paid - total_CWT

### Mixed Income Earner + OSD
- OSD applies ONLY to the business/professional income portion
- Compensation income has NO deductions (flat: all compensation is NTI)
- Combined NTI = compensation_NTI + (business_gross_receipts * 0.60)
- Tax = graduated_tax(combined_NTI)
- Less: employer WHT on compensation + quarterly advance payments + CWT credits

### Breakeven: OSD vs Itemized
Exact breakeven always at expense ratio = 40% of gross receipts/income.
- Expense ratio < 40%: OSD wins (40% deduction > actual expenses)
- Expense ratio > 40%: Itemized wins
- Expense ratio = 40%: Tied

This holds regardless of income level due to the linear nature of the OSD formula. Verified:
- GR = ₱1,000,000, AE = ₱400,000 (40%): Both net ₱600,000 → tied ✓
- GR = ₱2,000,000, AE = ₱800,000 (40%): Both net ₱1,200,000 → tied ✓

### Breakeven: OSD vs 8%
For pure-business taxpayers with GR ≤ ₱3M:
- 8% ALWAYS beats OSD (verified at all GR levels — see lookup table)
- Savings from 8% vs OSD range from ₱0 (at GR = ₱250K) to ₱222,500 (at GR = ₱3M)
- No crossover point exists in the ₱0–₱3M range

Implication: Engine should NEVER recommend OSD over 8% when both are available.
OSD is only relevant when:
  1. Gross > ₱3M (8% not available), AND
  2. Actual expenses < 40% of gross (otherwise itemized recommended)

---

## Edge Cases Identified

EC-OSD01: Election missed in Q1 — defaults to itemized for the year
EC-OSD02: Trader with COGS — must apply OSD to gross income, not gross sales
EC-OSD03: Passive income alongside business — passive income excluded from OSD base
EC-OSD04: First-year registrant mid-year — first quarterly return timing determines election
EC-OSD05: Expense ratio proves > 40% after OSD elected — cannot switch; stuck
EC-OSD06: GPP partner using OSD — individual partner can use OSD; GPP entity cannot
EC-OSD07: Multiple business activities (professional + trading) — separate OSD bases
EC-OSD08: OSD + NOLCO interaction — NOLCO not available under OSD (must use itemized)
EC-OSD09: OSD for VAT-registered taxpayer (GR > ₱3M) — still available but no % tax

---

## Files Written To

- `final-mega-spec/domain/computation-rules.md` — CR-026 (OSD expanded rules)
- `final-mega-spec/domain/lookup-tables/osd-breakeven-table.md` — New file (full OSD tax table)
- `final-mega-spec/domain/edge-cases.md` — Group EC-OSD (9 edge cases)
