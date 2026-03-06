# Fill Wizard Step Fields — Analysis

**Wave:** 7.5 (Spec Gap Fill)
**Date:** 2026-03-06
**Depends on:** completeness-audit (FAIL on wizard step fields)
**Source:** `loops/freelance-tax-reverse/final-mega-spec/frontend/wizard-steps.md`
**Target:** New Section 7.7 in `docs/plans/freelance-tax-spec.md`

---

## What Was Missing

The completeness-audit identified that Section 7 of the unified spec defined wizard state types,
step routing logic, and Zod schemas for 5 key steps — but did NOT include per-field specs for
all 17 wizard steps. Missing for each field:
- Exact label text
- Field type (peso, radio, select, checkbox, date, text, toggle)
- Placeholder text
- Help text / tooltip copy
- Required / optional flag
- Ordered validation rules
- Exact error messages

## What Was Merged

All content from `wizard-steps.md` was incorporated into the spec as Section 7.7:

### Steps Included
- WS-00: Mode Selection (1 field: mode_selection radio card group)
- WS-01: Taxpayer Profile (1 field: taxpayer_type radio card group with conditional modal)
- WS-02: Business Type (3 fields: business_category, is_gpp_partner, cost_of_goods_sold)
- WS-03: Tax Year and Filing Period (2 fields: tax_year select, filing_period radio)
- WS-04: Gross Receipts (4 fields: gross_receipts, sales_returns_allowances, non_operating_income, fwt_income)
- WS-05: Compensation Income (3 fields: taxable_compensation, number_of_employers, compensation_cwt)
- WS-06: Expense Method Selection (1 field: expense_input_method radio card group)
- WS-07A: Itemized Expenses — General (13 fields including home_office)
- WS-07B: Itemized Expenses — Financial (8 fields including bad_debts, charitable)
- WS-07C: Itemized Expenses — Depreciation (7 fields per asset entry including method, prior_depreciation)
- WS-07D: Itemized Expenses — NOLCO (4 fields per NOLCO entry)
- WS-08: Form 2307 CWT (7 fields per 2307 entry + running total display)
- WS-09: Prior Quarterly Payments (3 entries × 2 fields)
- WS-10: Registration and VAT Status (4 fields)
- WS-11: Regime Election (1 field: elected_regime radio card)
- WS-12: Filing Details (3 fields: return_type, prior_payment, is_late_filing, actual_filing_date)
- WS-13: Prior Year Credits (2 fields: has_prior_year_carryover, prior_year_excess_cwt)

### Additional Content
- Section 7.7.18: Step Routing Matrix (17-step × 6-scenario table)
- Section 7.7.19: Global Validation Constraints (GV-01 through GV-20)
- Section 7.7.20: Dynamic Advisories (DA-01 through DA-14)

## Critical Details Preserved

1. **Peso field behavior**: ₱ prefix, thousands separators on blur, max ₱9,999,999,999.99
2. **ATC auto-classification table**: WI010, WI011, WI157, WI160, WI760, WC010, WC760, PT010
3. **Conditional modals**: COMPENSATION_ONLY taxpayer type shows modal before advancing
4. **NOT_SURE business category**: Shows helper panel, blocks advancement until re-selection
5. **Depreciation vehicle cap**: ₱2,400,000 ceiling per RR 12-2012, detected by asset_name keywords
6. **Interest expense 33% reduction**: Auto-computed from final_taxed_interest_income
7. **Entertainment cap**: 1% net revenue for services, 0.5% net sales for traders
8. **Home office exclusive use**: Blocks deduction if not exclusively used
9. **NOLCO 3-year FIFO rule**: Only tax_year-3 through tax_year-1 eligible
10. **Form 2307 WI760 effective rate**: 1% on half remittance = 0.5% effective
11. **Quarterly slot limits**: Q2 allows Q1 only; Q3 allows Q1+Q2; Annual allows Q1+Q2+Q3
12. **GV-18**: Advisory (non-blocking) for home office non-exclusive use
13. **DA-06/DA-07**: Real-time comparison of itemized total vs 40% OSD
14. **DA-08**: Alert when CWT credits may exceed income tax (overpayment scenario)

## Result

Section 7.7 added to spec — 17 wizard steps fully specified with all field properties.
The forward loop can now implement every wizard step without external research or judgment calls.
