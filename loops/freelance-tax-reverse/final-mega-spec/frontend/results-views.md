# Results Views — Philippine Freelance & Self-Employed Income Tax Optimizer

**Status:** COMPLETE
**Last updated:** 2026-03-02
**Cross-references:**
- User journeys (flow context): [frontend/user-journeys.md](user-journeys.md)
- Wizard steps (input screens): [frontend/wizard-steps.md](wizard-steps.md)
- Engine data model (output types): [engine/data-model.md](../engine/data-model.md)
- Engine pipeline (output assembly): [engine/pipeline.md](../engine/pipeline.md)
- Computation rules (regime logic): [domain/computation-rules.md](../domain/computation-rules.md)
- Scenarios: [domain/scenarios.md](../domain/scenarios.md)
- API endpoints: [api/endpoints.md](../api/endpoints.md)
- Premium tiers: [premium/tiers.md](../premium/tiers.md)

---

## Table of Contents

1. [Results Page Architecture](#1-results-page-architecture)
2. [Section RV-01: Page Header and Context Bar](#2-section-rv-01-page-header-and-context-bar)
3. [Section RV-02: Warnings and Advisories Banner](#3-section-rv-02-warnings-and-advisories-banner)
4. [Section RV-03: Regime Comparison Table](#4-section-rv-03-regime-comparison-table)
5. [Section RV-04: Recommended Regime Callout](#5-section-rv-04-recommended-regime-callout)
6. [Section RV-05: Tax Due and Credits Breakdown](#6-section-rv-05-tax-due-and-credits-breakdown)
7. [Section RV-06: Balance Payable / Overpayment](#7-section-rv-06-balance-payable--overpayment)
8. [Section RV-07: Installment Payment Option](#8-section-rv-07-installment-payment-option)
9. [Section RV-08: Percentage Tax (Form 2551Q) Summary](#9-section-rv-08-percentage-tax-form-2551q-summary)
10. [Section RV-09: BIR Form Recommendation](#10-section-rv-09-bir-form-recommendation)
11. [Section RV-10: Penalty Summary (Late Filing)](#11-section-rv-10-penalty-summary-late-filing)
12. [Section RV-11: Manual Review Flags](#12-section-rv-11-manual-review-flags)
13. [Section RV-12: Path Detail Accordion](#13-section-rv-12-path-detail-accordion)
14. [Section RV-13: Action Bar](#14-section-rv-13-action-bar)
15. [Variant RV-V1: Annual Purely Self-Employed (≤ ₱3M, 8% Eligible)](#15-variant-rv-v1-annual-purely-self-employed)
16. [Variant RV-V2: Annual Purely Self-Employed (> ₱3M, VAT-Registered)](#16-variant-rv-v2-annual-vat-registered)
17. [Variant RV-V3: Annual Mixed Income Earner](#17-variant-rv-v3-annual-mixed-income-earner)
18. [Variant RV-V4: Quarterly Filing (1701Q)](#18-variant-rv-v4-quarterly-filing-1701q)
19. [Variant RV-V5: Late Filing with Penalties](#19-variant-rv-v5-late-filing-with-penalties)
20. [Variant RV-V6: Zero Tax Due / Overpayment](#20-variant-rv-v6-zero-tax-due--overpayment)
21. [Variant RV-V7: Locked Regime (User Override)](#21-variant-rv-v7-locked-regime-user-override)
22. [Variant RV-V8: Compensation-Only (No Optimizer)](#22-variant-rv-v8-compensation-only-no-optimizer)
23. [Loading, Error, and Empty States](#23-loading-error-and-empty-states)
24. [Value Formatting Rules](#24-value-formatting-rules)
25. [Mobile Layout Adaptations](#25-mobile-layout-adaptations)

---

## 1. Results Page Architecture

### 1.1 Overall Layout Structure

The results page is a single scrollable page rendered after the engine returns a `TaxComputationResult`. It is NOT a wizard step — it replaces the entire wizard content area and introduces a persistent sticky action bar at the bottom on mobile, or a floating action panel on the right on desktop.

The page is organized into vertical sections in the order listed in the Table of Contents. Sections that do not apply to the current taxpayer's situation are hidden entirely (not collapsed — they take no space in the DOM).

**Desktop layout (≥ 1024px):**
```
┌────────────────────────────────────────────────────────────┐
│  Context Bar (breadcrumb + modify inputs link)             │
├─────────────────────────────────┬──────────────────────────┤
│                                 │                          │
│  Main Results Column            │  Sticky Action Panel     │
│  (sections RV-01 through RV-13) │  (RV-13 contents)        │
│  width: 65%                     │  width: 33%              │
│                                 │  position: sticky top    │
└─────────────────────────────────┴──────────────────────────┘
```

**Tablet layout (768px – 1023px):**
```
┌────────────────────────────────────────┐
│  Context Bar                           │
├────────────────────────────────────────┤
│  Main Results Column (100%)            │
│  (sections RV-01 through RV-13)        │
├────────────────────────────────────────┤
│  Action Bar (sticky bottom, full width)│
└────────────────────────────────────────┘
```

**Mobile layout (< 768px):**
```
┌──────────────────────────────┐
│  Context Bar (compact)       │
├──────────────────────────────┤
│  Main Results (full width)   │
├──────────────────────────────┤
│  Action Bar (sticky, 56px h) │
└──────────────────────────────┘
```

### 1.2 Section Visibility Matrix

Each section's visibility depends on the `TaxComputationResult` fields. This table is exhaustive — every section, every condition.

| Section | Visible When | Hidden When |
|---------|-------------|-------------|
| RV-01 (Header / Context Bar) | Always | Never |
| RV-02 (Warnings) | `result.warnings.length > 0` OR `result.manual_review_flags.length > 0` | No warnings and no MRFs |
| RV-03 (Regime Comparison Table) | `result.taxpayer_type != COMPENSATION_ONLY` | `taxpayer_type == COMPENSATION_ONLY` |
| RV-04 (Recommended Regime Callout) | `result.taxpayer_type != COMPENSATION_ONLY` AND optimizer mode | Locked regime (shown as RV-V7 instead); COMPENSATION_ONLY |
| RV-05 (Tax Due and Credits) | Always | Never |
| RV-06 (Balance Payable / Overpayment) | `filing_period == ANNUAL` | `filing_period` is quarterly (Q1/Q2/Q3) |
| RV-07 (Installment Option) | `result.balance_result.installment_eligible == true` | `installment_eligible == false` |
| RV-08 (Percentage Tax) | `result.pt_result.pt_applies == true` | `pt_applies == false` (8% filer or VAT-registered) |
| RV-09 (BIR Form Recommendation) | Always | Never |
| RV-10 (Penalty Summary) | `result.penalty_result.applies == true` | `penalty_result.applies == false` |
| RV-11 (Manual Review Flags) | `result.manual_review_flags.length > 0` | No MRF flags |
| RV-12 (Path Detail Accordion) | `result.taxpayer_type != COMPENSATION_ONLY` | `COMPENSATION_ONLY` |
| RV-13 (Action Bar) | Always | Never |

### 1.3 Result Data Sources

Every displayed value in the results page maps to a specific field in `TaxComputationResult`. The full type is defined in [engine/data-model.md](../engine/data-model.md) Section 6. Key fields referenced throughout this spec:

| Display Concept | Source Field Path |
|----------------|------------------|
| Recommended path | `result.regime_comparison.recommended_path` |
| Best path tax due | `result.regime_comparison.comparisons[0].total_tax_burden` |
| Savings vs worst | `result.regime_comparison.savings_vs_worst` |
| Savings vs next best | `result.regime_comparison.savings_vs_next_best` |
| Path A tax | `result.path_a.income_tax_due` |
| Path A total burden | `result.regime_comparison.comparisons[PATH_A].total_tax_burden` |
| Path B tax | `result.path_b.income_tax_due` |
| Path B total burden | `result.regime_comparison.comparisons[PATH_B].total_tax_burden` |
| Path C tax | `result.path_c.total_income_tax` |
| Path C eligible | `result.path_c.eligible` |
| PT due | `result.pt_result.pt_due` |
| Balance payable | `result.balance_result.balance` |
| Overpayment | `result.balance_result.overpayment` |
| Total IT credits | `result.balance_result.total_it_credits` |
| CWT total | `result.cwt_credits.it_cwt_total` |
| Quarterly paid | `result.quarterly_aggregates.total_quarterly_it_paid` |
| Penalty total | `result.penalty_result.total_penalties` |
| Form type | `result.form_mapping.form_type` |
| Warnings list | `result.warnings` |
| MRF flags list | `result.manual_review_flags` |

---

## 2. Section RV-01: Page Header and Context Bar

### 2.1 Purpose

Orients the user to what they are viewing. Shows input summary and provides a fast path to modify inputs.

### 2.2 Layout

```
┌──────────────────────────────────────────────────────────────┐
│  ← Modify Inputs                    Tax Year: 2025 | Annual  │
│                                                              │
│  Your Tax Computation Results                                │
│  [Taxpayer name if logged in, or "For: Self-Employed        │
│   Freelancer" if anonymous]                                  │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Gross Receipts: ₱600,000   |  Expenses: ₱0          │    │
│  │ Filing: Annual 2025        |  Status: Non-VAT        │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### 2.3 Fields

| Element | Content | Source |
|---------|---------|--------|
| Back link label | "← Modify Inputs" | Static text |
| Back link action | Returns user to last wizard step with all inputs preserved in-memory | UI state |
| Period badge (right-aligned) | "Tax Year: {tax_year} \| {period_label}" where period_label = "Annual" for ANNUAL, "Q1 (Jan–Mar)" for Q1, "Q2 (Jan–Jun)" for Q2, "Q3 (Jan–Sep)" for Q3 | `result.tax_year`, `result.filing_period` |
| Page title | "Your Tax Computation Results" | Static text |
| Subtitle (logged in) | "{first_name}'s computation — {taxpayer_type_label}" where taxpayer_type_label = "Self-Employed" for PURELY_SE, "Mixed Income (Employee + Freelancer)" for MIXED_INCOME | `result.taxpayer_type` + user profile |
| Subtitle (anonymous) | "Anonymous computation — {taxpayer_type_label}" | `result.taxpayer_type` |
| Input summary: Gross Receipts | "Gross Receipts: ₱{formatted}" | `result.input.gross_receipts` |
| Input summary: Expenses label | "Expenses: ₱{formatted}" for OSD/Itemized; "Expenses: None (8% method)" if user skipped expenses and 8% was elected | `result.input.itemized_expenses.total_claimed` or ₱0 |
| Input summary: Filing | "Filing: {period_label} {tax_year}" | computed |
| Input summary: Status | "Non-VAT" if `is_vat_registered == false`; "VAT-Registered" if true | `result.input.is_vat_registered` |
| Input summary: Mixed income indicator | Shows "Compensation: ₱{formatted}" row ONLY if `taxpayer_type == MIXED_INCOME` | `result.input.taxable_compensation` |

### 2.4 Behavior

- The "← Modify Inputs" link is always visible and works regardless of login state.
- Clicking it restores the wizard to the last completed step. All field values remain populated from the previous entry.
- On mobile, the input summary row wraps to 2 columns; items are displayed in a 2×2 grid.

---

## 3. Section RV-02: Warnings and Advisories Banner

### 3.1 Purpose

Surfaces engine warnings and manual review flags prominently before showing the results, so the user understands any caveats affecting the computation.

### 3.2 Layout

Warnings appear as stacked cards immediately below the context bar. There are three visual styles:

**Red — Hard error (should not occur on results page; if it does, something failed):**
```
┌─────────────────────────────────────────────────────────┐
│ ⚠ Computation Error                                     │
│  [error message text]                                   │
└─────────────────────────────────────────────────────────┘
```

**Amber — Warning (user should review):**
```
┌─────────────────────────────────────────────────────────┐
│ ⚠ {warning title}                                       │
│  {warning message text}                                 │
└─────────────────────────────────────────────────────────┘
```

**Blue — Informational:**
```
┌─────────────────────────────────────────────────────────┐
│ ℹ {info title}                                          │
│  {info message text}                                    │
└─────────────────────────────────────────────────────────┘
```

### 3.3 Warning Display Rules

Each warning from `result.warnings` maps to a specific banner. The full warning list with titles, messages, and colors:

| Code | Banner Color | Banner Title | Banner Message |
|------|-------------|--------------|----------------|
| WARN-001 | Amber | "Approaching VAT Threshold" | "Gross receipts are within ₱300,000 of the ₱3,000,000 VAT registration threshold. If you expect to exceed ₱3,000,000 this year, you must register for VAT with the BIR." |
| WARN-002 | Amber | "VAT Registration Required" | "Gross receipts exceed the ₱3,000,000 VAT registration threshold. You are required to register for VAT. The 8% option is not available. This computation shows Graduated + OSD and Graduated + Itemized only." |
| WARN-003 | Blue | "No CWT Certificates Entered" | "No Form 2307 certificates (creditable withholding tax) were entered. If clients withheld tax from your payments, adding those 2307 certificates here will reduce your balance payable. Go back to add them." |
| WARN-004 | Blue | "Very Low Expenses Declared" | "Declared expenses are very low relative to your income. Review all legitimate business expenses (home office, equipment, software, professional fees) to ensure you are claiming the maximum deduction under Path A." |
| WARN-005 | Blue | "Verify Non-Operating Income Type" | "Non-operating income was entered but no Final Withholding Tax income was declared. If this income was from a bank (interest) or dividends, it may have already been subjected to final withholding tax and should be entered in the FWT Income field instead. The current computation may overstate your taxable income." |
| WARN-006 | Amber | "8% Election Timing Notice" | "The 8% income tax option can only be elected on the first quarterly return (Q1) of the tax year. This computation assumes you validly elected 8% on your Q1 return. If you did not elect 8% on Q1, this path is not available for the current year." |
| WARN-007 | Amber | "Mixed Income: ₱250,000 Deduction Not Applied" | "Because you have both compensation income and business income, the ₱250,000 annual exemption does NOT apply to the 8% computation on your business income (per BIR RMC 50-2018). The 8% rate applies to your full business gross receipts." |
| WARN-008 | Blue | "NOLCO Available Expiring Soon" | "One or more prior-year Net Operating Loss Carry-Over (NOLCO) entries expire this year or next. Ensure you apply them before they expire. NOLCO can only be used under Path A (Itemized Deductions)." |
| WARN-009 | Amber | "VAT-Registered: Only 2 Paths Available" | "As a VAT-registered taxpayer, the 8% income tax option is not available. This computation compares Graduated + Itemized Deductions vs Graduated + OSD (40%) only." |
| WARN-010 | Blue | "Prior Year Excess CWT Applied" | "A prior year excess creditable withholding tax (carry-over credit) has been applied to this year's computation. Verify this amount matches your prior year's annual ITR." |
| WARN-011 | Blue | "EAR Cap Applied to Entertainment Expenses" | "Entertainment, amusement, and representation (EAR) expenses were reduced to the legal cap of 1% of net revenue. The capped amount has been used in Path A." |
| WARN-012 | Blue | "Vehicle Depreciation Ceiling Applied" | "Vehicle acquisition cost exceeds the ₱2,400,000 BIR ceiling (RR 12-2012). Depreciation was computed on ₱2,400,000 only. The excess cost is non-deductible." |
| WARN-013 | Amber | "Home Office Deduction Requires Exclusive Use" | "Home office expenses were entered but exclusive use was not confirmed. Home office deductions are only allowed when the space is used EXCLUSIVELY for business (BIR requirement). The deduction was disallowed." |
| WARN-014 | Blue | "Non-Accredited Charity: Donation Not Deductible" | "Charitable contributions were entered but the donee was not marked as BIR-accredited. Non-accredited donations are not deductible under Sec. 34(H). The deduction was set to ₱0." |
| WARN-015 | Blue | "Bad Debts: Accrual Basis Required" | "Bad debt deductions were entered. Bad debts are only deductible for accrual-basis taxpayers. The deduction was applied because you indicated accrual accounting. Verify this is correct." |
| WARN-016 | Amber | "BMBE-Registered: Income Tax Exempt" | "You are registered as a Barangay Micro Business Enterprise (BMBE). BMBE-registered taxpayers are exempt from income tax on income from BMBE operations. All three path computations show ₱0 income tax due. Percentage tax and other obligations still apply." |
| WARN-017 | Blue | "GPP Partner: This Computation Uses Distributive Share" | "This computation uses your distributive share of the GPP's income as the gross receipts base. The GPP itself is not subject to income tax — only each partner's share is taxed. Verify that your distributive share amount matches your GPP's annual financial statements." |

**Display rules for Warning banners:**
- Banners appear in severity order: Amber first, then Blue. Multiple banners of the same color appear in WARN code order.
- If there are more than 3 banners, the 4th and subsequent are hidden behind a "Show 2 more notices →" link. Expanding shows all.
- Each banner is NOT dismissible — it remains visible for the session.
- Banners appear above the regime comparison table, below the context bar.

### 3.4 Manual Review Flag Banners

MRF flags appear in a separate card below the warning banners:

```
┌─────────────────────────────────────────────────────────┐
│ 🔍 Manual Review Required ({N} items)                    │
│                                                         │
│  These items could not be determined automatically.     │
│  Review each one before filing your return.             │
│                                                         │
│  • [MRF-XXX title]: [MRF description] [Learn more ↗]   │
│  • [MRF-YYY title]: [MRF description] [Learn more ↗]   │
│  [+ Show {M} more]  (if > 3 MRFs)                      │
└─────────────────────────────────────────────────────────┘
```

Each MRF item displays:
- MRF code (e.g., "MRF-009")
- Short title (from the MRF table in [domain/manual-review-flags.md](../domain/manual-review-flags.md))
- One-sentence description of what to verify
- "Learn more ↗" link that opens an in-app help modal with the full MRF explanation

**MRF banner color:** Purple border, light lavender background (#F5F3FF border #7C3AED).

**MRF banner behavior:**
- Not dismissible.
- If there are ≤ 3 MRF items, all are shown inline.
- If there are > 3, the first 3 are shown with a "Show {N-3} more" link.
- Computation results are still shown — MRFs are advisory, not blocking (per engine design).

---

## 4. Section RV-03: Regime Comparison Table

### 4.1 Purpose

This is the core output of the optimizer. Shows all eligible tax paths side by side with the recommended option highlighted. This section is the primary value-add over any existing tool — no competitor shows all three paths simultaneously.

### 4.2 Standard Three-Path Layout (Desktop)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Which Tax Path Saves You the Most?                                          │
│  The engine compared all three legal options for your situation.             │
├──────────────────────┬──────────────────────┬──────────────────────────────┤
│  PATH A              │  PATH B              │  PATH C  ★ RECOMMENDED      │
│  Graduated +         │  Graduated +         │  8% Flat Rate               │
│  Itemized Deductions │  OSD (40%)           │                              │
├──────────────────────┼──────────────────────┼──────────────────────────────┤
│  Net Taxable Income  │  Net Taxable Income  │  Taxable Base               │
│  ₱360,000            │  ₱360,000            │  ₱350,000                    │
├──────────────────────┼──────────────────────┼──────────────────────────────┤
│  Income Tax Due      │  Income Tax Due      │  Income Tax Due             │
│  ₱8,000              │  ₱8,000              │  ₱28,000                    │
├──────────────────────┼──────────────────────┼──────────────────────────────┤
│  Percentage Tax      │  Percentage Tax      │  Percentage Tax             │
│  ₱18,000             │  ₱18,000             │  Waived (₱0)                │
├──────────────────────┼──────────────────────┼──────────────────────────────┤
│  TOTAL TAX BURDEN    │  TOTAL TAX BURDEN    │  TOTAL TAX BURDEN           │
│  ₱26,000             │  ₱26,000             │  ₱28,000                    │
├──────────────────────┼──────────────────────┼──────────────────────────────┤
│  Effective Rate      │  Effective Rate      │  Effective Rate             │
│  4.33%               │  4.33%               │  4.67%                      │
├──────────────────────┼──────────────────────┼──────────────────────────────┤
│  Requires receipts:  │  Requires receipts:  │  Requires receipts: No      │
│  YES                 │  NO                  │                              │
├──────────────────────┼──────────────────────┼──────────────────────────────┤
│  [See Details ↓]     │  [See Details ↓]     │  [See Details ↓]            │
└──────────────────────┴──────────────────────┴──────────────────────────────┘
```

The recommended path column has a highlighted border (primary color: #1D4ED8), a "★ RECOMMENDED" badge at the top right, and a slightly shaded background (#EFF6FF). This visual treatment is applied regardless of which path is recommended.

### 4.3 Column Specification

Each column maps to a `RegimeOption` in `result.regime_comparison.comparisons`. The columns are always rendered left-to-right in the order: PATH_A, PATH_B, PATH_C — regardless of which is recommended. The recommended column receives the ★ RECOMMENDED badge. If a path is ineligible, its column is shown in a disabled/grayed state (see Section 4.6).

**Column rows and their data sources:**

| Row Label | Display Format | Source Field |
|-----------|---------------|--------------|
| Path header (row 1) | "PATH A" / "PATH B" / "PATH C" | Static based on path |
| Path name (row 2) | "Graduated + Itemized Deductions" / "Graduated + OSD (40%)" / "8% Flat Rate" | `regime_option.label` |
| Recommended badge | "★ RECOMMENDED" — shown only on the recommended path | `result.regime_comparison.recommended_path` |
| Net Taxable Income label | "Net Taxable Income" for A/B; "Taxable Base (after ₱250K exemption)" for C purely SE; "Taxable Base (no exemption)" for C mixed income | Computed based on path and taxpayer type |
| Net Taxable Income value | "₱{formatted}" | PATH_A: `result.path_a.total_nti`; PATH_B: `result.path_b.total_nti`; PATH_C: `result.path_c.taxable_base` |
| Income Tax Due label | "Income Tax Due" | Static |
| Income Tax Due value | "₱{formatted}" | PATH_A: `result.path_a.income_tax_due`; PATH_B: `result.path_b.income_tax_due`; PATH_C: `result.path_c.total_income_tax` |
| Percentage Tax label | "Percentage Tax (Form 2551Q)" | Static |
| Percentage Tax value | "₱{formatted}" for A/B; "Waived (₱0)" for C | `result.pt_result.pt_due` for A/B; ₱0 for C |
| Total Tax Burden label | "TOTAL TAX BURDEN" (bold, larger font) | Static |
| Total Tax Burden value | "₱{formatted}" (bold, larger font) | `regime_option.total_tax_burden` |
| Effective Rate label | "Effective Rate" | Static |
| Effective Rate value | "{pct}% of gross receipts" | `regime_option.effective_rate * 100`, formatted to 2 decimal places |
| Requires receipts label | "Requires receipts:" | Static |
| Requires receipts value | "YES — keep invoices, ORs, and contracts" for A; "NO — 40% deducted automatically" for B; "NO" for C | `regime_option.requires_documentation` |
| Detail button | "[See Details ↓]" | Opens RV-12 accordion to this path's section |

### 4.4 Savings Summary Below the Table

Below the three-column table, a savings summary bar is displayed:

```
┌──────────────────────────────────────────────────────────────┐
│  💰 By choosing PATH C (8% Flat Rate), you save              │
│     ₱2,000 compared to the next-best option (PATH B)        │
│     ₱2,000 compared to the highest-tax option (PATH A)      │
└──────────────────────────────────────────────────────────────┘
```

**Savings summary display rules:**

| Condition | Text Shown |
|-----------|-----------|
| `savings_vs_worst > 0` AND `savings_vs_next_best > 0` AND `savings_vs_worst != savings_vs_next_best` | "By choosing {recommended_label}, you save ₱{savings_vs_next_best} compared to the next-best option ({next_best_label}) and ₱{savings_vs_worst} compared to the highest-tax option ({worst_label})." |
| `savings_vs_worst > 0` AND `savings_vs_next_best == 0` (tie among top two, but third is worse) | "By choosing {recommended_label} or {next_best_label}, you save ₱{savings_vs_worst} compared to {worst_label}. Both recommended and next-best paths produce the same total tax." |
| `savings_vs_worst == 0` (all paths tied) | "All available tax paths produce the same total tax burden of ₱{total}. {recommended_label} is recommended because it has the simplest filing requirement." |
| Only one path available | "Only one tax path is available for your situation: {recommended_label}." |
| `savings_vs_worst < 0` | This state cannot occur (invariant INV-RC-01 ensures recommended has lowest burden). If reached, display: "Results may require review. Please contact support." |

**Savings summary background color:** #F0FDF4 (light green tint) for positive savings; #F9FAFB (neutral gray) for zero savings or single path.

### 4.5 Taxes Saved vs. Worst Path — Visual Bar

Below the savings summary, a horizontal bar chart is shown comparing total tax burdens:

```
  PATH A  ████████████████████████ ₱26,000
  PATH B  ████████████████████████ ₱26,000
  PATH C  ████████████████████████████ ₱28,000 ← highest
  ────────────────────────────────────────────
          The recommended path is PATH A or B
```

Bar widths are proportional to the tax burden of each path. The recommended path's bar is rendered in primary color (#1D4ED8); other paths in gray (#94A3B8). If a path is ineligible, its bar is striped gray with a lock icon.

**Bar chart behavior:**
- Bars are 100% of the recommended path's width as the baseline (the highest-tax path's bar extends beyond to show relative cost).
- Absolute peso amounts are shown at the right end of each bar.
- The chart is aria-labeled: "Tax burden comparison chart: Path A ₱{X}, Path B ₱{Y}, Path C ₱{Z}. Recommended: {path}."
- On mobile, the bar chart becomes a simple list of labeled rows with colored dots.

### 4.6 Ineligible Path Display

When a path is ineligible (e.g., Path C is not available because gross receipts > ₱3M), its column is shown in a disabled state:

```
┌──────────────────────────┐
│  PATH C                  │
│  8% Flat Rate            │
│  🔒 NOT AVAILABLE        │
│                          │
│  Why: {reason}           │
│                          │
│  Your gross receipts     │
│  exceed ₱3,000,000.      │
│  The 8% option is only   │
│  available when gross    │
│  receipts do not exceed  │
│  ₱3,000,000.             │
└──────────────────────────┘
```

**Ineligible column rules:**

| Column state | Background | Border | Text color | Badge |
|-------------|-----------|--------|-----------|-------|
| Eligible, not recommended | White (#FFFFFF) | Gray (#E2E8F0) | Default (#1E293B) | None |
| Eligible, recommended | Light blue (#EFF6FF) | Primary (#1D4ED8) | Default (#1E293B) | "★ RECOMMENDED" in primary color |
| Ineligible | Light gray (#F8FAFC) | Dashed gray (#CBD5E1) | Muted (#94A3B8) | "🔒 NOT AVAILABLE" in gray |

The reason for ineligibility is pulled from `result.path_c.ineligible_reasons`. Each reason code maps to the following user-readable text:

| IN Code | User-Readable Reason Text |
|---------|--------------------------|
| IN-01 | "You are VAT-registered. The 8% option is only for non-VAT taxpayers." |
| IN-02 | "Gross receipts + other income exceed ₱3,000,000. The 8% option has a ₱3,000,000 ceiling." |
| IN-03 | "You signified the OSD option on a prior quarterly return this year. The 8% election must be made on Q1 and cannot be changed mid-year." |
| IN-04 | "Your income is subject to industry-specific percentage taxes under Sections 117–128 of the NIRC, not Section 116. The 8% option only applies to Section 116 taxpayers." |
| IN-05 | "BMBE-registered taxpayers are exempt from income tax. The 8% option does not apply." |

If multiple IN codes are present, all reasons are listed as bullet points within the ineligible column.

---

## 5. Section RV-04: Recommended Regime Callout

### 5.1 Purpose

A large, prominent callout box that clearly states the recommendation and explains the rationale in plain language. This is the single most important element on the page for first-time users.

### 5.2 Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  ★  Recommended: PATH C — 8% Flat Rate                              │
│                                                                      │
│  Your lowest legal tax is ₱28,000.                                  │
│  You save ₱0 vs Path A and ₱0 vs Path B in this scenario.          │
│                                                                      │
│  Why: With no significant business expenses, the 8% flat rate       │
│  eliminates your percentage tax obligation (₱18,000 savings         │
│  on OPT) while your income tax is slightly higher. The net result   │
│  is ₱0 savings in this example — but the 8% path is simpler         │
│  (no quarterly receipts needed).                                     │
│                                                                      │
│  What this means for you:                                           │
│  • File: BIR Form 1701A                                              │
│  • Percentage tax: Waived — no Form 2551Q required                  │
│  • Record-keeping: No expense receipts required                     │
│  • Eligible to elect: Yes, if you signify on Q1 of tax year 2025   │
│                                                                      │
│  [Use this path →]    [Compare paths in detail ↓]                  │
└──────────────────────────────────────────────────────────────────────┘
```

### 5.3 Callout Content Specification

| Element | Content Rule |
|---------|-------------|
| Title | "★ Recommended: {recommended_path_label}" where label comes from `result.regime_comparison.comparisons[0].label` |
| Total tax statement | "Your lowest legal tax is ₱{formatted(total_tax_burden)}." |
| Savings statement (positive savings) | "You save ₱{savings_vs_next_best} vs the next-best option and ₱{savings_vs_worst} vs the highest-tax option." |
| Savings statement (zero savings vs next best) | "All eligible paths produce the same tax. This path is recommended because it has the fewest filing requirements." |
| Savings statement (single path) | "This is the only available tax option for your situation." |
| Why section (Path C recommended, no expenses) | "With minimal or no business expenses, the 8% flat rate eliminates your percentage tax obligation (saving ₱{pt_due} in Form 2551Q). Your income tax under 8% is ₱{path_c_it} vs ₱{path_ab_it} under the graduated method, but the elimination of percentage tax makes 8% the lower-burden option overall." |
| Why section (Path C recommended, some expenses) | "The 8% flat rate is still your best option even with declared expenses, because the percentage tax savings (₱{pt_due} waived) outweigh the benefit of deducting your ₱{total_expenses} in expenses under Path A." |
| Why section (Path B recommended) | "Your business expenses (₱{expenses}) are less than 40% of your gross receipts. Since the OSD automatically deducts 40%, it gives you a larger deduction than your actual expenses, reducing your taxable income by ₱{osd_deduction} vs ₱{actual_deductions} under itemized." |
| Why section (Path A recommended) | "Your business expenses (₱{expenses}) represent {expense_ratio}% of gross receipts, which is higher than the 40% OSD. Itemizing your actual expenses results in a larger total deduction (₱{itemized_deductions}), giving you the lowest taxable income of ₱{path_a_nti}." |
| What this means — Form | "File: {form_type_label}" where form_type_label = "BIR Form 1701A" for FORM_1701A, "BIR Form 1701" for FORM_1701, "BIR Form 1701Q" for FORM_1701Q |
| What this means — PT | "Percentage tax: Waived — no Form 2551Q required" if PATH_C; "Percentage tax: ₱{pt_due} due via Form 2551Q (quarterly)" if PATH_A or PATH_B and pt_applies; "Percentage tax: Not applicable (VAT-registered)" if VAT-registered |
| What this means — Record-keeping | "No expense receipts required" if PATH_C or PATH_B; "Keep receipts for all declared business expenses" if PATH_A |
| "Use this path" button action | Records the user's path choice (if logged in, saves to computation record); scrolls to RV-05 |
| "Compare paths in detail" link action | Expands all accordions in RV-12 |

### 5.4 Locked Regime Note

When `result.regime_comparison.using_locked_regime == true`, the callout shows an amber advisory instead of the recommendation reasoning:

```
┌──────────────────────────────────────────────────────────────┐
│  ⚠ Showing computation for your selected path:              │
│     PATH A — Graduated + Itemized Deductions                 │
│                                                              │
│  Note: PATH C (8% Flat Rate) would result in a lower total  │
│  tax burden of ₱{path_c_burden} — saving you ₱{savings}.   │
│  [Switch to recommended path →]                             │
└──────────────────────────────────────────────────────────────┘
```

This callout is only shown when the user has overridden the engine's recommendation. "Switch to recommended path" re-runs the computation in optimizer mode.

---

## 6. Section RV-05: Tax Due and Credits Breakdown

### 6.1 Purpose

Shows a detailed ledger of the income tax due, all credits applied, and the resulting balance. This section appears for both annual and quarterly filings.

### 6.2 Layout (Annual Filing)

```
┌──────────────────────────────────────────────────────────────┐
│  Income Tax Computation (PATH C — 8% Flat Rate)              │
│                                                              │
│  Gross Receipts                            ₱600,000.00       │
│  Less: ₱250,000 annual exemption          (₱250,000.00)     │
│  ─────────────────────────────────────────────────────       │
│  Taxable Base                              ₱350,000.00       │
│  × 8% flat rate                                              │
│  ─────────────────────────────────────────────────────       │
│  Income Tax Due                             ₱28,000.00       │
│                                                              │
│  Less: Tax Credits                                           │
│    Creditable Withholding Tax (CWT)        (₱30,000.00)     │
│    Prior Quarterly Payments (Q1+Q2+Q3)          (₱0.00)     │
│    Prior Year Excess CWT                        (₱0.00)     │
│    Compensation Tax Withheld (Form 2316)        (₱0.00)     │
│  ─────────────────────────────────────────────────────       │
│  Total Tax Credits                         (₱30,000.00)     │
│  ─────────────────────────────────────────────────────       │
│  BALANCE PAYABLE / (OVERPAYMENT)           (₱2,000.00) ✓   │
└──────────────────────────────────────────────────────────────┘
```

### 6.3 Row Specification

The ledger rows vary by path. Each row is defined below with its exact label, value source, and conditional visibility.

**PATH C (8% Flat Rate) rows:**

| Row Label | Value Source | Visible When |
|-----------|-------------|-------------|
| "Gross Receipts" | `result.input.gross_receipts` formatted as ₱ | Always |
| "Less: Sales Returns and Allowances" (indented) | `(₱{result.input.sales_returns_allowances})` | `sales_returns_allowances > 0` |
| "Net Gross Receipts" (shown only if returns > 0) | `result.gross_aggregates.net_gross_receipts` | `sales_returns_allowances > 0` |
| "Add: Non-Operating Income" (indented) | `₱{result.input.non_operating_income}` | `non_operating_income > 0` |
| "8% Eligible Base" (shown only if non-op income exists) | `result.gross_aggregates.eight_pct_base` | `non_operating_income > 0` |
| "Less: ₱250,000 annual exemption" (indented) | `(₱250,000.00)` | `taxpayer_type == PURELY_SE` |
| "Note: ₱250,000 exemption not applied (mixed income)" (no deduction) | Italic note text | `taxpayer_type == MIXED_INCOME` |
| "Taxable Base" | `result.path_c.taxable_base` | Always (for PATH C) |
| "× 8% flat rate" | Static label | Always (for PATH C) |
| "Income Tax Due" (bold) | `result.path_c.total_income_tax` | Always |
| (blank row for spacing) | — | — |
| "Less: Tax Credits" (section header) | Static | Always |
| "  Creditable Withholding Tax (CWT)" | `(₱{result.cwt_credits.it_cwt_total})` | `it_cwt_total > 0` |
| "  CWT Detail" expand link | Shows list of individual 2307 entries | `cwt_2307_entries.length > 0` |
| "  Prior Quarterly Payments (Q1+Q2+Q3)" | `(₱{result.quarterly_aggregates.total_quarterly_it_paid})` | Always (shows ₱0 if none paid) |
| "  Q1 Payment" (indented, expandable) | `(₱{q1_paid})` | `q1_paid > 0` |
| "  Q2 Payment" (indented, expandable) | `(₱{q2_paid})` | `q2_paid > 0` |
| "  Q3 Payment" (indented, expandable) | `(₱{q3_paid})` | `q3_paid > 0` |
| "  Prior Year Excess CWT" | `(₱{prior_year_excess_cwt})` | `prior_year_excess_cwt > 0` |
| "  Compensation Tax Withheld (Form 2316)" | `(₱{compensation_cwt})` | `taxpayer_type == MIXED_INCOME AND compensation_cwt > 0` |
| Separator line | — | — |
| "Total Tax Credits" | `(₱{total_it_credits})` | Always |
| Separator line | — | — |
| "BALANCE PAYABLE" (bold, colored red) | `₱{balance}` | `balance > 0` |
| "OVERPAYMENT" (bold, colored green with checkmark) | `(₱{overpayment}) ✓` | `overpayment > 0` |
| "ZERO BALANCE" (bold, colored gray) | `₱0.00` | `balance == 0 AND overpayment == 0` |

**PATH A (Graduated + Itemized) rows (shown when PATH_A is selected/recommended):**

| Row Label | Value Source | Visible When |
|-----------|-------------|-------------|
| "Gross Receipts" | `result.input.gross_receipts` | Always |
| "Less: Sales Returns and Allowances" | `(result.input.sales_returns_allowances)` | `> 0` |
| "Net Gross Receipts" | `result.gross_aggregates.net_gross_receipts` | `returns > 0` |
| "Add: Non-Operating Income" | `result.input.non_operating_income` | `> 0` |
| "Total Gross Income (Business)" | `result.gross_aggregates.graduated_income_base` | Always |
| "Less: Total Itemized Deductions" (expandable) | `(result.itemized_deductions.total_deductions)` | Always |
| — Deduction breakdown rows (expandable) | See Section 6.4 | Hidden until expanded |
| "Less: Percentage Tax Deduction (Sec. 34C)" | `(result.path_a.pt_deduction_applied)` | `pt_applies == true` |
| "Business Net Taxable Income" | `result.path_a.biz_nti` | Always |
| "Add: Taxable Compensation (from employer)" | `result.input.taxable_compensation` | `taxpayer_type == MIXED_INCOME` |
| "Total Net Taxable Income" (bold) | `result.path_a.total_nti` | Always |
| "Income Tax (Graduated Rate)" | `result.path_a.income_tax_due` | Always |
| [Credits section same as PATH C above] | — | — |

**PATH B (Graduated + OSD) rows:**

| Row Label | Value Source | Visible When |
|-----------|-------------|-------------|
| "Gross Receipts (Net)" | `result.gross_aggregates.net_gross_receipts` | Always |
| "Add: Non-Operating Income" | `result.input.non_operating_income` | `> 0` |
| "OSD Base" | `result.osd_result.osd_base` | Always |
| "Less: OSD (40% of OSD Base)" | `(result.osd_result.osd_deduction)` | Always |
| "Business Net Taxable Income (60% of OSD Base)" | `result.path_b.biz_nti` | Always |
| "Add: Taxable Compensation" | `result.input.taxable_compensation` | `MIXED_INCOME` |
| "Total Net Taxable Income" (bold) | `result.path_b.total_nti` | Always |
| "Income Tax (Graduated Rate)" | `result.path_b.income_tax_due` | Always |
| [Credits section same as PATH C above] | — | — |

### 6.4 Itemized Deduction Breakdown (Expandable)

When PATH A is shown and the user clicks "Less: Total Itemized Deductions (expand)", a sub-table appears:

```
  Salaries and wages                          ₱80,000.00
  Employee benefits (SSS/PhilHealth/Pag-IBIG) ₱12,000.00
  Office rent                                 ₱60,000.00
  Utilities                                   ₱18,000.00
  Communication (phone/internet)              ₱12,000.00
  Office supplies                              ₱5,000.00
  Professional fees paid                      ₱20,000.00
  Travel and transportation                    ₱8,000.00
  Business insurance                           ₱3,000.00
  Interest expense (net of arbitrage)          ₱0.00
  Taxes and licenses                           ₱2,500.00
  Casualty/theft losses                        ₱0.00
  Bad debts (accrual basis)                    ₱0.00
  Depreciation                                ₱15,000.00
  Charitable contributions                     ₱0.00
  Research and development                     ₱0.00
  Entertainment / representation (capped)      ₱1,500.00
  Home office expense                          ₱0.00
  NOLCO carry-over                             ₱0.00
  ─────────────────────────────────────────────────────
  TOTAL ITEMIZED DEDUCTIONS                  ₱237,000.00
```

Rows with ₱0.00 are shown but in muted gray (#94A3B8). Rows where a cap was applied show a tooltip: "ℹ Capped at {cap_amount} per BIR rules."

### 6.5 CWT Detail (Expandable)

When the user clicks "CWT Detail ▼" under the credits section, a sub-table of individual Form 2307 entries appears:

```
  Payor                      ATC    Income Payment  Tax Withheld
  ─────────────────────────────────────────────────────────────
  ABC Corporation            WI010  ₱300,000.00     ₱15,000.00
  XYZ Digital Agency         WI010  ₱300,000.00     ₱15,000.00
  ─────────────────────────────────────────────────────────────
  TOTAL CWT CREDITS                                 ₱30,000.00
```

Each row corresponds to one `ClassifiedForm2307Entry`. Columns: Payor (payor_name, truncated to 25 chars with tooltip if longer), ATC (atc_code), Income Payment (formatted peso), Tax Withheld (formatted peso). The table header row is bold. The total row has a top border and is bold.

---

## 7. Section RV-06: Balance Payable / Overpayment

### 7.1 Purpose

A large, unambiguous display of the final amount the taxpayer must pay (or will receive back). This is the "bottom line" that most users scroll to immediately.

### 7.2 Layout — Balance Payable State

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                BALANCE DUE BY APRIL 15, 2026           │  │
│  │                                                        │  │
│  │                      ₱28,000.00                        │  │
│  │                                                        │  │
│  │  This is the amount to pay to the BIR on your          │  │
│  │  Annual Income Tax Return (Form 1701A).                │  │
│  │                                                        │  │
│  │  Pay at any AAB (bank), GCash, or eBIRForms eFPS.     │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Deadline: April 15, 2026  [Add to Calendar ↗]             │
│  Payment channels: BancNet, GCash, PayMaya, BIR AAB banks   │
└──────────────────────────────────────────────────────────────┘
```

### 7.3 Layout — Overpayment State

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              OVERPAYMENT — CREDIT FOR NEXT YEAR        │  │
│  │                                                        │  │
│  │                      ₱2,000.00                         │  │
│  │                                                        │  │
│  │  Your tax credits exceed your income tax due.         │  │
│  │  This ₱2,000.00 overpayment may be:                   │  │
│  │  • Carried over as a credit to next year's return, OR │  │
│  │  • Applied for a cash refund (BIR refund process).    │  │
│  │                                                        │  │
│  │  Most taxpayers choose carry-over (faster, simpler).  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  You still must FILE your return by April 15, 2026.        │
│  Filing is required even when no payment is due.           │
└──────────────────────────────────────────────────────────────┘
```

### 7.4 Layout — Zero Balance State

```
┌──────────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────────────┐  │
│  │              ZERO BALANCE — NOTHING TO PAY             │  │
│  │                                                        │  │
│  │                      ₱0.00                             │  │
│  │                                                        │  │
│  │  Your tax credits exactly offset your income tax due. │  │
│  │  No payment is required.                              │  │
│  │                                                        │  │
│  │  You still must FILE your return by April 15, 2026.  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 7.5 Balance Section Field Specification

| Element | Content | Source |
|---------|---------|--------|
| Section header (balance) | "BALANCE DUE BY {deadline_date}" | `result.balance_result.balance > 0`, deadline from filing calendar |
| Section header (overpayment) | "OVERPAYMENT — CREDIT FOR NEXT YEAR" | `overpayment > 0` |
| Section header (zero) | "ZERO BALANCE — NOTHING TO PAY" | `balance == 0 AND overpayment == 0` |
| Main amount (balance) | "₱{balance}" in large bold text (32px), color #DC2626 (red) | `result.balance_result.balance` |
| Main amount (overpayment) | "₱{overpayment}" in large bold text (32px), color #16A34A (green) | `result.balance_result.overpayment` |
| Main amount (zero) | "₱0.00" in large bold text (32px), color #64748B (gray) | Both zero |
| Explanation text (balance) | "This is the amount to pay to the BIR on your {form_type_label} for Tax Year {tax_year}." | `result.form_mapping.form_type`, `result.tax_year` |
| Explanation text (overpayment) | "Your tax credits exceed your income tax due. This ₱{overpayment} overpayment may be carried over to next year's return or applied for a BIR cash refund. Most taxpayers choose carry-over." | `result.balance_result.overpayment` |
| Payment channels note | "Pay at any Authorized Agent Bank (AAB), via GCash (BIR payment), PayMaya BIR payment, or through eBIRForms eFPS if enrolled." | Static |
| Deadline line | "Deadline: {formatted_deadline}" | From `result.form_mapping.form_output.filing_deadline` or computed from filing calendar |
| "Add to Calendar" link | Opens ICS calendar file download for the filing deadline | Dynamic |
| Filing reminder (overpayment/zero balance) | "You still must FILE your return by {deadline}. Filing is required even when no payment is due." | Static, shown for overpayment and zero balance states |

### 7.6 Quarterly Balance

When `filing_period` is Q1, Q2, or Q3, section RV-06 is hidden (quarterly balance logic is embedded in RV-05's ledger within the quarterly variant RV-V4). The quarterly variant shows the net amount due for this quarter only.

---

## 8. Section RV-07: Installment Payment Option

### 8.1 Visibility Condition

Section RV-07 is displayed only when `result.balance_result.installment_eligible == true`. This condition is true when:
- `filing_period == ANNUAL`
- `balance > ₱2,000`

### 8.2 Layout

```
┌──────────────────────────────────────────────────────────────┐
│  ℹ Pay in Two Installments?                                  │
│                                                              │
│  If your annual balance payable exceeds ₱2,000, you may     │
│  split the payment into two equal installments:              │
│                                                              │
│  1st Installment:  ₱14,000.00  — Due April 15, 2026        │
│  2nd Installment:  ₱14,000.00  — Due July 15, 2026         │
│                                                              │
│  The 1st installment is due on the same day as the filing    │
│  deadline. The 2nd installment is due July 15 of the same   │
│  year. No additional paperwork is needed to use this option  │
│  — simply pay the first half by April 15.                   │
│                                                              │
│  Legal basis: NIRC Sec. 56(A)(2); RR 8-2018 Sec. 14.       │
└──────────────────────────────────────────────────────────────┘
```

### 8.3 Field Specification

| Element | Content | Source |
|---------|---------|--------|
| 1st Installment amount | "₱{formatted(installment_first)}" | `result.balance_result.installment_first` |
| 1st Installment deadline | "Due {April 15, {tax_year + 1}}" | Filing calendar |
| 2nd Installment amount | "₱{formatted(installment_second)}" | `result.balance_result.installment_second` |
| 2nd Installment deadline | "Due {July 15, {tax_year + 1}}" | Filing calendar |
| Note on rounding | If `installment_first != installment_second` (odd-peso balance): "The 1st installment is rounded up to the nearest centavo. The 2nd installment is the remainder." | `installment_first != installment_second` |

---

## 9. Section RV-08: Percentage Tax (Form 2551Q) Summary

### 9.1 Visibility Condition

Section RV-08 is shown when `result.pt_result.pt_applies == true`. This is true for non-VAT, non-8% taxpayers.

### 9.2 Layout

```
┌──────────────────────────────────────────────────────────────┐
│  📋 Percentage Tax Obligation (Separate from Income Tax)     │
│                                                              │
│  In addition to income tax, non-VAT taxpayers pay a         │
│  3% quarterly percentage tax on gross sales/receipts        │
│  (BIR Form 2551Q, filed separately every quarter).          │
│                                                              │
│  Annual Gross Sales (2025):          ₱600,000.00            │
│  Rate:                               3%                      │
│  ─────────────────────────────────────────────────────       │
│  Annual Percentage Tax:              ₱18,000.00              │
│  Less: PT CWT Credits (PT010):      (₱0.00)                 │
│  Net Percentage Tax Due:            ₱18,000.00               │
│                                                              │
│  Quarterly Filing Schedule:                                  │
│  Q1 (Jan–Mar): ₱4,500.00   Due: April 25, 2025             │
│  Q2 (Apr–Jun): ₱4,500.00   Due: July 25, 2025              │
│  Q3 (Jul–Sep): ₱4,500.00   Due: October 25, 2025           │
│  Q4 (Oct–Dec): ₱4,500.00   Due: January 25, 2026           │
│                                                              │
│  ℹ This tool shows the annual total. Each quarter's         │
│  2551Q is filed based on that quarter's actual gross        │
│  sales/receipts.                                             │
└──────────────────────────────────────────────────────────────┘
```

### 9.3 Field Specification

| Element | Content | Source |
|---------|---------|--------|
| Annual Gross Sales | `result.input.gross_receipts` (or gross sales if accrual) | `result.pt_result.pt_base` |
| Rate | "3%" for current periods (2023+); "1%" for periods Jul 2020–Jun 2023 | `result.pt_result.pt_rate * 100` |
| Annual Percentage Tax | `result.pt_result.pt_due` | Annual PT due |
| PT CWT Credits | `result.cwt_credits.pt_cwt_total` | From PT010 ATC entries |
| Net Percentage Tax Due | `result.pt_result.pt_due − result.cwt_credits.pt_cwt_total` | Computed |
| Q1 amount estimate | `result.pt_result.pt_due / 4` (equal quarters shown as estimate — actual depends on quarterly gross) | Approximation |
| Q1–Q4 deadlines | April 25, July 25, October 25, January 25 of following year | Filing calendar |
| Disclaimer note | "The quarterly amounts above are estimated based on equal distribution of annual gross receipts. Actual quarterly PT depends on each quarter's specific gross sales." | Static |

### 9.4 Path C (8%) Waiver Notice

When `result.path_c.eligible == true` AND PATH_C is recommended (pt_applies is false because 8% was elected), section RV-08 is hidden but the following inline note appears within RV-04 (Recommended Regime Callout):

"No Form 2551Q required. The 8% income tax option is 'in lieu of' the 3% percentage tax under NIRC Sec. 24(A)(2)(b). Choosing this path saves you ₱{pt_due} in percentage tax and eliminates quarterly 2551Q filings."

---

## 10. Section RV-09: BIR Form Recommendation

### 10.1 Purpose

Tells the user exactly which BIR form to use and explains why, with a link to the form's pre-populated preview.

### 10.2 Layout

```
┌──────────────────────────────────────────────────────────────┐
│  📄 Your Required BIR Return                                 │
│                                                              │
│  BIR Form 1701A  —  Annual Income Tax Return                │
│  (January 2018 ENCS)                                        │
│  For: Individuals Earning Purely from Self-Employment        │
│                                                              │
│  Why Form 1701A and not 1701?                               │
│  Form 1701A is the simplified annual return for purely       │
│  self-employed taxpayers using OSD or 8% flat rate.         │
│  Form 1701 is for mixed income earners or those using        │
│  itemized deductions.                                        │
│                                                              │
│  Required Attachments:                                       │
│  • Photocopies of all Form 2307 certificates received       │
│  • Summary Alphalist of Withholding Agents (SAWT)           │
│    (required if total CWT > ₱0)                            │
│                                                              │
│  [Preview Pre-Populated Form ↗]   (Pro feature)            │
│  [Download Form PDF ↗]   (Pro feature)                     │
└──────────────────────────────────────────────────────────────┘
```

### 10.3 Field Specification

| Element | Content | Source |
|---------|---------|--------|
| Form type label | "BIR Form {type}" where type = "1701A", "1701", or "1701Q" | `result.form_mapping.form_type` |
| Form description | "Annual Income Tax Return" for 1701/1701A; "Quarterly Income Tax Return" for 1701Q | Static |
| Form version | "(January 2018 ENCS)" for 1701A; "(July 2008 ENCS)" for 1701; "(January 2018 ENCS)" for 1701Q | Static |
| For whom | "For: Individuals Earning Purely from Self-Employment" for FORM_1701A PURELY_SE; "For: Individuals with Mixed Income (Employee + Self-Employed)" for FORM_1701 MIXED_INCOME; "For: Self-Employed Individuals (Quarterly)" for FORM_1701Q | `form_type` + `taxpayer_type` |
| Why this form (1701A) | "Form 1701A is the simplified annual return for purely self-employed taxpayers using OSD or 8% flat rate. Form 1701 is required for mixed income earners or those using itemized deductions." | Shown when `form_type == FORM_1701A` |
| Why this form (1701) | "Form 1701 is required because {reason}." where reason = "you have both compensation and business income (mixed income)" for MIXED_INCOME; "you are using itemized deductions (Path A)" for PURELY_SE with PATH_A | Shown when `form_type == FORM_1701` |
| Why this form (1701Q) | "Form 1701Q is the quarterly income tax return for self-employed individuals. It uses a cumulative method — you compute income tax on your total earnings from January 1 through the end of this quarter." | Shown when `form_type == FORM_1701Q` |
| Required attachments list | One bullet per item in `result.form_mapping.required_attachments` | `result.form_mapping.required_attachments` |
| "Preview Pre-Populated Form" button | Opens RV-12 expanded form preview; gated behind Pro subscription | Pro feature gate |
| "Download Form PDF" button | Triggers PDF download of pre-populated form; gated behind Pro | Pro feature gate |

### 10.4 Form 2551Q Mention

If `pt_form_output` is non-null, an additional line appears:
"Additionally required: BIR Form 2551Q — Quarterly Percentage Tax Return. Filed quarterly (4 times per year)."

---

## 11. Section RV-10: Penalty Summary (Late Filing)

### 11.1 Visibility Condition

Shown only when `result.penalty_result.applies == true`. This is true when the user entered an `actual_filing_date` that is past the deadline.

### 11.2 Layout

```
┌──────────────────────────────────────────────────────────────┐
│  ⚠ LATE FILING — PENALTIES APPLY                            │
│                                                              │
│  Filing date: August 15, 2026                               │
│  Deadline was: April 15, 2026  (123 days late, 5 months)   │
│                                                              │
│  Income Tax Penalties:                                       │
│    Base Tax Due:                    ₱28,000.00              │
│    Surcharge (10% — MICRO tier):     ₱2,800.00             │
│    Interest (6% × 5/12 months):        ₱700.00             │
│    Compromise Penalty (₱1K–₱5K bracket): ₱1,000.00        │
│  ─────────────────────────────────────────────────────       │
│  Total IT Due + Penalties:          ₱32,500.00              │
│                                                              │
│  Percentage Tax Penalties:                                   │
│    Base PT Due:                     ₱18,000.00              │
│    Surcharge (10%):                  ₱1,800.00              │
│    Interest (6% × 5/12):              ₱450.00               │
│    Compromise Penalty:              ₱1,000.00               │
│  ─────────────────────────────────────────────────────       │
│  Total PT Due + Penalties:          ₱21,250.00              │
│                                                              │
│  TOTAL AMOUNT DUE (Tax + Penalties): ₱53,750.00            │
│                                                              │
│  ⚠ Note: The BIR may assess penalties differently based on  │
│  the specific circumstances of your return. This is an      │
│  estimate. Consult a CPA or BIR officer for exact amounts.  │
└──────────────────────────────────────────────────────────────┘
```

### 11.3 Field Specification

| Element | Content | Source |
|---------|---------|--------|
| Filing date | "Filing date: {result.input.actual_filing_date}" | `TaxpayerInput.actual_filing_date` |
| Deadline | "Deadline was: {computed_deadline}" | Filing calendar |
| Days late | "{result.penalty_result.days_late} days late, {months_late} months" | `penalty_result.days_late`, `penalty_result.months_late` |
| IT Base Tax | `result.balance_result.balance` (balance payable, before penalties) | `balance_result.balance` |
| IT Surcharge | `result.penalty_result.it_penalties.surcharge` with rate label | `it_penalties.surcharge` |
| IT Interest | `result.penalty_result.it_penalties.interest` with rate and months | `it_penalties.interest` |
| IT Compromise | `result.penalty_result.it_penalties.compromise` with bracket label | `it_penalties.compromise` |
| Total IT + Penalties | `result.penalty_result.it_penalties.total` | `it_penalties.total` |
| PT section | Shown only if `pt_applies == true` | `pt_result.pt_applies` |
| PT Base Tax | `result.pt_result.pt_due` | `pt_result.pt_due` |
| PT Surcharge | `result.penalty_result.pt_penalties.surcharge` | `pt_penalties.surcharge` |
| PT Interest | `result.penalty_result.pt_penalties.interest` | `pt_penalties.interest` |
| PT Compromise | `result.penalty_result.pt_penalties.compromise` | `pt_penalties.compromise` |
| Total PT + Penalties | `result.penalty_result.pt_penalties.total` | `pt_penalties.total` |
| Grand total | IT total + PT total | sum of totals |
| Estimate disclaimer | "The BIR may assess penalties differently based on the specific circumstances of your return. This computation is an estimate based on standard penalty rates under RR 8-2024 and RMO 7-2015. Consult a CPA or BIR officer to confirm the exact amount due." | Static |

### 11.4 Penalty Reduction Advice

Below the penalty table, if penalties are significant (total_penalties > ₱5,000), an advisory appears:

```
💡 Reduce Your Penalties
You may apply for penalty abatement under Revenue Regulations 13-2001
if there is a reasonable cause for late filing (illness, calamity, etc.).
Contact your Revenue District Office (RDO) to inquire about abatement.
```

---

## 12. Section RV-11: Manual Review Flags

### 12.1 Purpose

Detailed display of each manual review flag that the engine raised. Each flag requires the taxpayer to verify a specific item before filing.

### 12.2 Visibility

Shown when `result.manual_review_flags.length > 0`. The RV-02 warnings banner already shows a compact summary; this section provides the full detail.

### 12.3 Layout

```
┌──────────────────────────────────────────────────────────────┐
│  🔍 Items Requiring Your Review Before Filing               │
│                                                              │
│  The optimizer flagged {N} items that require human         │
│  judgment. These do not block the computation, but you       │
│  should verify each one before filing your return.           │
│                                                              │
│  [MRF-009] Travel Expense Business Purpose                   │
│  ─────────────────────────────────────────────────────       │
│  Travel expenses are only deductible if directly related    │
│  to your business. Personal travel is not deductible.       │
│  What to verify: Confirm that all ₱8,000 entered under      │
│  travel is exclusively for business trips (client visits,   │
│  seminars, industry conferences). Prepare documentation:    │
│  receipts, boarding passes, itineraries.                    │
│  Engine assumption: Full amount treated as deductible.      │
│  [Mark as verified ✓]   [Exclude this deduction]           │
│                                                              │
│  [MRF-012] Home Office Equipment Percentage                 │
│  ...                                                         │
└──────────────────────────────────────────────────────────────┘
```

### 12.4 Per-Flag Display Fields

Each MRF card shows:

| Field | Content |
|-------|---------|
| Flag code | "[MRF-{code}]" in monospace, e.g., "[MRF-009]" |
| Flag title | The flag's short title (from manual-review-flags.md) |
| Description | Full explanation of what the flag means and why it matters |
| What to verify | Specific action item for the taxpayer |
| Engine assumption | What value the engine used in the computation (e.g., "Full amount treated as deductible" or "Deduction disallowed") |
| "Mark as verified" action | Records user confirmation; flag badge changes to green checkmark; computation does not change |
| "Exclude this deduction" action | Only shown for MRFs related to optional deductions (e.g., MRF-009 travel). Clicking re-runs computation with that deduction set to ₱0. |

---

## 13. Section RV-12: Path Detail Accordion

### 13.1 Purpose

Full step-by-step computation detail for each path. Used by users who want to understand exactly how each tax was computed, by CPAs verifying the numbers, and by pro users preparing for form filling.

### 13.2 Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Detailed Computation Breakdown                              │
│                                                              │
│  ▼ PATH A — Graduated + Itemized Deductions                  │
│  ┌───────────────────────────────────────────────────────┐   │
│  │  Gross Receipts                    ₱600,000.00         │   │
│  │  Less: Itemized Deductions        (₱237,000.00)       │   │
│  │  Less: Percentage Tax Deduction    (₱18,000.00)       │   │
│  │  Business NTI                      ₱345,000.00         │   │
│  │  Income Tax (Graduated)             ₱7,250.00          │   │
│  │  Percentage Tax (3%)               ₱18,000.00          │   │
│  │  TOTAL TAX BURDEN                  ₱25,250.00          │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ► PATH B — Graduated + OSD (40%)  [tap to expand]          │
│                                                              │
│  ► PATH C — 8% Flat Rate  [tap to expand]                    │
└──────────────────────────────────────────────────────────────┘
```

### 13.3 Accordion Behavior

- All three path accordions are collapsed by default.
- The recommended path accordion is pre-expanded.
- Each accordion header shows: path name, total_tax_burden, and a "★ Recommended" badge if applicable.
- Clicking any header toggles open/close.
- "Compare paths in detail ↓" in RV-04 expands all three simultaneously.
- On mobile, one accordion is open at a time; opening a second closes the previous.

### 13.4 Accordion Content: Path A Detail

Rows match the PATH A ledger from Section 6.3 (Tax Due and Credits Breakdown) but without the credits section — credits are shared across paths and shown in RV-05 only. The accordion shows only the income tax computation rows:

1. Gross Receipts: ₱{value}
2. Less: Sales Returns (if any): (₱{value})
3. Net Gross Receipts: ₱{value}
4. Add: Non-Operating Income (if any): ₱{value}
5. Total Gross Income: ₱{value}
6. Less: Total Itemized Deductions: (₱{value}) [expandable sub-table per Section 6.4]
7. Less: Percentage Tax Deduction (Sec. 34C) (if applicable): (₱{value})
8. Business Net Taxable Income: ₱{value}
9. Add: Taxable Compensation (mixed income only): ₱{value}
10. Total Net Taxable Income: ₱{value}
11. Graduated Rate Bracket Applied: "{bracket description}" (e.g., "₱250,001–₱400,000: ₱0 + 20% of excess over ₱250,000")
12. Income Tax Due: ₱{value}
13. Percentage Tax (3%): ₱{value}
14. **TOTAL TAX BURDEN: ₱{value}**

### 13.5 Accordion Content: Path B Detail

1. Gross Receipts (Net): ₱{value}
2. Add: Non-Operating Income (if any): ₱{value}
3. OSD Base: ₱{value}
4. Less: OSD (40% of OSD Base): (₱{value})
5. Business Net Taxable Income (60%): ₱{value}
6. Add: Taxable Compensation (mixed income only): ₱{value}
7. Total Net Taxable Income: ₱{value}
8. Graduated Rate Bracket Applied: "{bracket description}"
9. Income Tax Due: ₱{value}
10. Percentage Tax (3%): ₱{value}
11. **TOTAL TAX BURDEN: ₱{value}**

### 13.6 Accordion Content: Path C Detail

If eligible:
1. Gross Receipts: ₱{value}
2. Less: Sales Returns (if any): (₱{value})
3. Add: Non-Operating Income (if any): ₱{value}
4. 8% Eligible Base: ₱{value}
5. Less: ₱250,000 annual exemption (PURELY_SE only): (₱250,000.00) — OR: "Note: ₱250,000 exemption not applied (mixed income earner per RMC 50-2018)"
6. Taxable Base: ₱{value}
7. × 8% flat rate
8. Business Income Tax: ₱{value}
9. Compensation Income Tax (MIXED_INCOME): ₱{value} — "Computed separately at graduated rates on ₱{compensation}"
10. Total Income Tax: ₱{value}
11. Percentage Tax: **Waived** (8% is "in lieu of" Sec. 116 OPT)
12. Form 2551Q required: **No**
13. **TOTAL TAX BURDEN: ₱{value}**

If ineligible, the accordion shows the ineligibility reasons in the same format as Section 4.6.

### 13.7 Graduated Rate Bracket Applied

For Path A and Path B, the specific rate bracket applied is shown as a tooltip accessible by hovering over the "Income Tax Due" row. The tooltip content:

"Total NTI: ₱{total_nti}
Bracket: {bracket_floor} to {bracket_ceiling}
Formula: ₱{base_tax} + {excess_rate}% × (₱{total_nti} − ₱{bracket_floor})
= ₱{base_tax} + ₱{excess_amount}
= ₱{income_tax_due}"

The bracket ceiling for the top bracket shows "and above" instead of a peso ceiling.

---

## 14. Section RV-13: Action Bar

### 14.1 Purpose

Provides the primary follow-up actions. On desktop, this is a sticky right panel; on mobile, a sticky bottom bar.

### 14.2 Desktop Sticky Panel Layout

```
┌──────────────────────────────────────┐
│  Your Results                        │
│  ─────────────────────────────────── │
│  Tax Year: 2025 | Annual             │
│  Recommended: PATH C (8%)            │
│  Balance Due: ₱28,000.00             │
│  Deadline: April 15, 2026            │
│  ─────────────────────────────────── │
│  [Save Computation]    (Free account) │
│  [Download PDF Report] (Pro)         │
│  [Share Results Link]  (Free)        │
│  ─────────────────────────────────── │
│  [Start New Computation]              │
│  [Compute Another Quarter]            │
│  ─────────────────────────────────── │
│  💼 Need help filing?                 │
│  [Find a CPA →]                      │
└──────────────────────────────────────┘
```

### 14.3 Mobile Sticky Bottom Bar Layout

```
┌──────────────────────────────────────┐
│ [Save]  [Share]  [PDF ↗ Pro]  [New] │
└──────────────────────────────────────┘
```

The mobile bar has four icon buttons:
- "Save" (bookmark icon): save computation to account
- "Share" (share icon): copy shareable link
- "PDF" (document icon): download PDF (Pro gate)
- "New" (plus icon): start new computation

### 14.4 Action Specification

| Action | Label | Availability | Behavior |
|--------|-------|-------------|---------|
| Save Computation | "Save Computation" | Free (requires account) | If logged in: saves computation to user's history with a generated name "{taxpayer_type_label} {tax_year} {filing_period_label}" and shows success toast "Computation saved." If not logged in: shows sign-up modal, then saves after signup. |
| Download PDF Report | "Download PDF Report" | Pro subscription required | If Pro: triggers PDF generation and download (filename: "tax-optimizer-{tax_year}-{filing_period}-{timestamp}.pdf"). If free: shows upgrade modal "This feature requires TaxOptimizer Pro. See what you get →" |
| Share Results Link | "Share Results Link" | Free | Generates a read-only shareable URL (e.g., "taxoptimizer.ph/result/{computation_id}") and copies to clipboard. Shows toast: "Link copied to clipboard. Anyone with this link can view your results (inputs are visible)." If not saved: saves computation first, then generates link. |
| Start New Computation | "Start New Computation" | Always | Resets wizard to WS-00 with all fields cleared. Does NOT require confirmation (no data loss risk if user has already saved or seen results). |
| Compute Another Quarter | "Compute Another Quarter" | Shown when `filing_period == ANNUAL` | Pre-fills the wizard for a quarterly computation for the same tax year. Gross receipts field is cleared for user to enter Q1 data. Taxpayer profile fields are carried over. |
| Find a CPA | "Find a CPA →" | Always | Opens external link to a curated list of CPAs who specialize in freelancer tax preparation (partner page). Label in panel: "Need help filing? Connect with a verified CPA who handles freelancer tax returns." |

---

## 15. Variant RV-V1: Annual Purely Self-Employed (≤ ₱3M, 8% Eligible)

### 15.1 Description

The most common user scenario. Three paths all available. 8% is typically recommended for low-expense earners.

### 15.2 Section Visibility

| Section | Visible |
|---------|---------|
| RV-01 (Header) | Yes |
| RV-02 (Warnings) | Only if WARN-003/004 triggered |
| RV-03 (Comparison Table) | Yes — 3 columns, all eligible |
| RV-04 (Recommended Callout) | Yes |
| RV-05 (Credits Breakdown) | Yes |
| RV-06 (Balance) | Yes |
| RV-07 (Installment) | Yes if balance > ₱2,000 |
| RV-08 (Percentage Tax) | No (8% waives PT; if graduated paths shown, still PT applies but for the recommended path PT is waived) |
| RV-09 (Form Recommendation) | Yes — 1701A typically |
| RV-10 (Penalties) | No (assuming on-time filing) |
| RV-11 (MRFs) | Only if user entered itemized expenses that triggered flags |
| RV-12 (Path Detail) | Yes — PATH_C pre-expanded |
| RV-13 (Action Bar) | Yes |

**Note on RV-08 for this variant:** When the recommended path is PATH_C, section RV-08 is hidden. However, within RV-04's recommended callout, the PT waiver savings are prominently mentioned. If the user clicks "See Details" on PATH_A or PATH_B in RV-03, the accordion in RV-12 shows the PT obligation for those paths, contextualizing why PATH_C eliminates that cost.

---

## 16. Variant RV-V2: Annual VAT-Registered (> ₱3M)

### 16.1 Description

Only PATH_A and PATH_B are available. PATH_C column is shown in the disabled/locked state.

### 16.2 Section Visibility

| Section | Visible |
|---------|---------|
| RV-01 (Header) | Yes |
| RV-02 (Warnings) | Yes — WARN-009 ("VAT-Registered: Only 2 Paths Available") is always shown |
| RV-03 (Comparison Table) | Yes — 3 columns, PATH_C disabled |
| RV-04 (Recommended Callout) | Yes — between PATH_A and PATH_B |
| RV-05 (Credits Breakdown) | Yes |
| RV-06 (Balance) | Yes |
| RV-07 (Installment) | Yes if eligible |
| RV-08 (Percentage Tax) | No (VAT-registered; VAT shown separately below) |
| RV-09 (Form Recommendation) | Yes — always Form 1701 |
| RV-10 (Penalties) | No (on-time assumption) |
| RV-11 (MRFs) | If present |
| RV-12 (Path Detail) | Yes — recommended path pre-expanded |
| RV-13 (Action Bar) | Yes |

**Additional card for VAT-registered users (inserted between RV-08 and RV-09):**

```
┌──────────────────────────────────────────────────────────────┐
│  🧾 VAT Reminder                                            │
│                                                              │
│  As a VAT-registered taxpayer, your VAT obligations are      │
│  separate from income tax. This tool does not compute VAT.  │
│  VAT is filed via BIR Form 2550M (monthly) or 2550Q         │
│  (quarterly). Consult your CPA or accountant for VAT        │
│  compliance.                                                 │
│                                                              │
│  Your gross receipts for income tax purposes are your        │
│  VAT-exclusive amounts (net of output VAT collected).       │
└──────────────────────────────────────────────────────────────┘
```

---

## 17. Variant RV-V3: Annual Mixed Income Earner

### 17.1 Description

Compensation income plus business income. All relevant sections shown. ₱250K exemption note shown in PATH_C column.

### 17.2 Unique Display Elements in RV-03 (Comparison Table for Mixed Income)

For mixed income taxpayers, each column adds compensation-specific rows:

**Additional rows for PATH_A (column):**
- After "Business Net Taxable Income: ₱{biz_nti}"
- "Add: Taxable Compensation: ₱{taxable_compensation}"
- "Total Net Taxable Income: ₱{total_nti}" (bold)

**Additional rows for PATH_C (column):**
- PATH_C income tax due = business IT + compensation IT
- Sub-label: "Business Income Tax (8%): ₱{path_c.income_tax_due}"
- Sub-label: "Compensation Income Tax (Graduated): ₱{path_c.compensation_it}"
- "Total Income Tax: ₱{path_c.total_income_tax}" (bold)
- NOTE: "₱250,000 exemption NOT applied to business income (per RMC 50-2018)" shown in amber font

**Compensation income summary card (inserted before RV-03):**
```
┌──────────────────────────────────────────────────────────────┐
│  Your Compensation Income (from employer)                    │
│  Taxable Compensation:     ₱{taxable_compensation}          │
│  Tax Withheld (Form 2316): ₱{compensation_cwt}              │
│  ────────────────────────────────────────────────────────    │
│  Note: Your employer already withheld income tax on your     │
│  salary. This tool optimizes only the business portion of   │
│  your income (Path A/B/C). For Paths A and B, your          │
│  compensation and business income are combined to compute    │
│  your total graduated tax.                                   │
└──────────────────────────────────────────────────────────────┘
```

---

## 18. Variant RV-V4: Quarterly Filing (1701Q)

### 18.1 Description

Used when `filing_period` is Q1, Q2, or Q3. The comparison table still shows all three paths but uses the quarterly cumulative computation. Balance section (RV-06) is replaced by a quarterly payment summary.

### 18.2 Section Visibility

| Section | Visible |
|---------|---------|
| RV-01 (Header) | Yes — shows "Q{n} (Jan–{month})" in period badge |
| RV-02 (Warnings) | If present |
| RV-03 (Comparison Table) | Yes — shows cumulative YTD tax, not just this quarter |
| RV-04 (Recommended Callout) | Yes |
| RV-05 (Credits Breakdown — Quarterly) | Yes — different rows (see below) |
| RV-06 (Annual Balance) | No — replaced by quarterly payment summary |
| RV-07 (Installment) | No — quarterly returns cannot use installment |
| RV-08 (Percentage Tax) | If applicable — shows quarterly PT for this quarter only |
| RV-09 (Form Recommendation) | Yes — always 1701Q |
| RV-10 (Penalties) | If applicable |
| RV-11 (MRFs) | If present |
| RV-12 (Path Detail) | Yes |
| RV-13 (Action Bar) | Yes — includes "Compute Next Quarter" button |

### 18.3 Quarterly Balance Section (replaces RV-06 for quarterly)

```
┌──────────────────────────────────────────────────────────────┐
│  Q2 Payment Due (April 1 – June 30, 2025)                    │
│                                                              │
│  Cumulative IT Due (Jan–Jun 2025):     ₱15,000.00           │
│  Less: Q1 Payment Already Made:       (₱5,000.00)           │
│  Less: CWT Credits (this period):     (₱3,000.00)           │
│  ─────────────────────────────────────────────────────       │
│  THIS QUARTER'S PAYMENT DUE:           ₱7,000.00            │
│                                                              │
│  Deadline: August 15, 2025   [Add to Calendar ↗]           │
│                                                              │
│  Note: This quarterly return uses the CUMULATIVE method.     │
│  Your income is computed from January 1 through June 30.    │
│  The Q1 tax already paid is credited against this total.    │
└──────────────────────────────────────────────────────────────┘
```

| Element | Content | Source |
|---------|---------|--------|
| Section title | "Q{n} Payment Due ({period_dates})" | `filing_period`, filing calendar |
| Cumulative IT Due | "₱{result.selected_path.income_tax_due}" | Cumulative tax from 1701Q computation |
| Less: Q1/Q2 prior payments | Prior quarterly payments aggregated | `quarterly_aggregates.total_quarterly_it_paid` |
| Less: CWT credits | `it_cwt_total` | `cwt_credits.it_cwt_total` |
| This quarter's payment due | Cumulative − credits | `result.balance_result.balance` |
| Deadline | Per filing calendar | Computed |

---

## 19. Variant RV-V5: Late Filing with Penalties

### 19.1 Description

User specified an `actual_filing_date` past the deadline. Section RV-10 is shown with full penalty breakdown. The balance section (RV-06) shows a prominently updated total including penalties.

### 19.2 Modified RV-06 Layout for Late Filing

```
┌──────────────────────────────────────────────────────────────┐
│  ⚠ TOTAL AMOUNT DUE — LATE FILING                           │
│                                                              │
│  Income Tax Balance:                   ₱28,000.00           │
│  Late Filing Penalties (IT):            ₱4,500.00           │
│  Percentage Tax Due:                   ₱18,000.00           │
│  Late Filing Penalties (PT):            ₱3,250.00           │
│  ─────────────────────────────────────────────────────       │
│  TOTAL DUE (including penalties):      ₱53,750.00           │
│                                                              │
│  See the Penalty Breakdown section below for details.       │
└──────────────────────────────────────────────────────────────┘
```

The large balance amount is displayed in red (#DC2626) with the "⚠ TOTAL AMOUNT DUE — LATE FILING" header in amber (#D97706).

---

## 20. Variant RV-V6: Zero Tax Due / Overpayment

### 20.1 Description

The taxpayer's total IT due is ₱0 (e.g., gross receipts ≤ ₱250,000 under 8% option) or credits exceed tax due.

### 20.2 Zero Income Tax (Gross ≤ ₱250,000, PATH_C)

When `result.path_c.income_tax_due == 0` (because `taxable_base == 0`), the recommended callout (RV-04) shows:

```
┌──────────────────────────────────────────────────────────────┐
│  ✓ Zero Income Tax Due                                       │
│                                                              │
│  Your gross receipts of ₱{gross_receipts} are within the   │
│  ₱250,000 annual exemption for the 8% flat rate option.     │
│  Your income tax under PATH C is ₱0.                        │
│                                                              │
│  However, you MUST still file your income tax return         │
│  by April 15, 2026. Non-filing has penalties even if no     │
│  tax is due.                                                 │
│                                                              │
│  Percentage tax: ₱{pt_due} due quarterly via Form 2551Q.   │
│  (8% waives this only for 8% filers — but at this income    │
│  level, percentage tax is your only BIR obligation.)        │
└──────────────────────────────────────────────────────────────┘
```

**CORRECTION NOTE**: At gross ≤ ₱250,000 and PATH_C elected, percentage tax is ALSO waived (8% is in lieu of PT). The note above is ONLY shown if PATH_A or PATH_B is used (graduated paths still incur PT). For PATH_C elected taxpayers, the percentage tax note reads: "Percentage tax: Waived (8% option elected). No Form 2551Q required."

### 20.3 Overpayment State

When `balance_result.overpayment > 0`:

```
┌──────────────────────────────────────────────────────────────┐
│  ✓ No Payment Required — Overpayment of ₱{overpayment}     │
│                                                              │
│  Your creditable withholding tax and quarterly payments     │
│  exceed your income tax due. You have overpaid by ₱{N}.    │
│                                                              │
│  Options for this overpayment:                              │
│  1. Carry over to next year — Apply ₱{N} as a tax credit   │
│     on your 2026 annual return. No action needed now.       │
│  2. Claim a refund — File a written claim with your RDO     │
│     within 2 years of the filing date. BIR will process     │
│     the refund (typically takes 1–3 years).                 │
│                                                              │
│  Most taxpayers choose carry-over (option 1) — it is        │
│  faster, simpler, and avoids the BIR refund process.        │
│                                                              │
│  You still must FILE your return by April 15, 2026.        │
└──────────────────────────────────────────────────────────────┘
```

---

## 21. Variant RV-V7: Locked Regime (User Override)

### 21.1 Description

When the user explicitly chose a regime in Step WS-11 (override mode), the results show the computation for that specific path but also prominently show what savings they are leaving on the table.

### 21.2 Modified RV-04

Instead of the green "★ Recommended" callout, an amber "You chose: PATH {X}" callout is shown:

```
┌──────────────────────────────────────────────────────────────┐
│  ⚙ You chose: PATH A — Graduated + Itemized Deductions       │
│                                                              │
│  Total tax burden under Path A: ₱{path_a_total}             │
│                                                              │
│  ⚠ Note: PATH C (8% Flat Rate) would result in a lower     │
│  total tax burden of ₱{path_c_total}, saving you            │
│  ₱{savings} in total tax.                                    │
│                                                              │
│  [Switch to Recommended Path →]   [Keep My Selection]       │
└──────────────────────────────────────────────────────────────┘
```

The savings advisory is shown whenever the locked path is not the optimizer's recommendation AND the savings is > ₱0.

### 21.3 Modified RV-03 (Comparison Table)

The locked path column has the "⚙ Your Selection" badge instead of "★ RECOMMENDED". The recommended path column still shows the "★ RECOMMENDED" badge. The user's selected path column has a dark border (#1E293B); the recommended path column has the primary blue border.

---

## 22. Variant RV-V8: Compensation-Only (No Optimizer)

### 22.1 Description

When `taxpayer_type == COMPENSATION_ONLY`. The optimizer is not applicable. An informational screen is shown.

### 22.2 Content

Sections RV-03 (Comparison Table), RV-04 (Recommended Callout), and RV-12 (Path Detail) are all hidden.

An informational card is shown in their place:

```
┌──────────────────────────────────────────────────────────────┐
│  ℹ Compensation Income Only — No Optimization Needed        │
│                                                              │
│  You indicated that you have only salary/compensation        │
│  income from an employer. The three-regime tax optimization  │
│  applies only to self-employed and business income.          │
│                                                              │
│  For compensation-only earners:                             │
│  • Your employer handles income tax via payroll withholding. │
│  • Your tax obligation is fully managed through Form 2316    │
│    (Certificate of Compensation Payment/Tax Withheld).       │
│  • You may be required to file an income tax return (ITR)   │
│    if you had two or more employers in the same year, or     │
│    if you opted out of substituted filing.                   │
│                                                              │
│  If you also earn freelance or business income,             │
│  [Start a New Computation as Mixed Income Earner →]         │
└──────────────────────────────────────────────────────────────┘
```

Section RV-05 (Credits Breakdown) is still shown, presenting the compensation income tax computation:

```
Gross Compensation Income:                   ₱{taxable_compensation}
Income Tax (Graduated Rates):                ₱{graduated_tax}
Less: Tax Withheld (Form 2316):             (₱{compensation_cwt})
────────────────────────────────────────────────────────
BALANCE PAYABLE / (OVERPAYMENT):             ₱{balance}
```

---

## 23. Loading, Error, and Empty States

### 23.1 Loading State

Displayed while the API request is in flight (after the user clicks "See My Results" on the last wizard step). The computation API is synchronous and typically responds in < 500ms, but latency is possible.

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│          🔄  Computing your tax optimization...             │
│                                                              │
│  ████████████████████████░░░░░░░  70%                      │
│                                                              │
│  Analyzing three tax paths                                   │
│  Comparing graduated rates and 8% option                    │
│  Computing creditable withholding tax credits               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

The loading messages cycle through these exact strings every 500ms:
1. "Analyzing three tax paths"
2. "Comparing graduated rates and 8% option"
3. "Computing creditable withholding tax credits"
4. "Preparing your results"

The progress bar fills from 0% to 95% over 1.5 seconds, then stalls at 95% until the response arrives (simulated progress — actual completion depends on API response).

### 23.2 API Error State

Displayed when the compute endpoint returns a 5xx error or the network request fails.

```
┌──────────────────────────────────────────────────────────────┐
│  ⚠ Something went wrong                                     │
│                                                              │
│  We couldn't complete your tax computation. This is         │
│  likely a temporary issue.                                   │
│                                                              │
│  Error code: {http_status} — {timestamp}                    │
│                                                              │
│  [Try Again]    [Go Back to Edit Inputs]                    │
│                                                              │
│  If this keeps happening, please email                       │
│  support@taxoptimizer.ph with the error code above.         │
└──────────────────────────────────────────────────────────────┘
```

"Try Again" re-sends the exact same API request. "Go Back to Edit Inputs" returns the user to the last wizard step.

### 23.3 Validation Error State

Displayed when the compute endpoint returns a 422 (user input validation error). This should not normally occur if client-side validation is working, but serves as a safety net.

```
┌──────────────────────────────────────────────────────────────┐
│  ⚠ Input Error Detected                                     │
│                                                              │
│  The following issues were found with your inputs:           │
│  • {error_message_1}                                        │
│  • {error_message_2}                                        │
│                                                              │
│  [Go Back and Fix]                                          │
└──────────────────────────────────────────────────────────────┘
```

Error messages come from `response.body.errors[].message` (see API spec for error response schema). "Go Back and Fix" returns the user to the first wizard step that has an invalid field.

---

## 24. Value Formatting Rules

All monetary values and percentages on the results page follow these exact formatting rules. No exceptions.

### 24.1 Peso Amount Formatting

| Amount Range | Display Format | Example |
|-------------|---------------|---------|
| ₱0.00 | "₱0.00" | ₱0.00 |
| Centavo amounts | "₱{integer},{decimal}" | ₱1,250.50 |
| Thousands | Always with comma separator | ₱1,250.00 |
| Ten thousands | Comma after 2 digits from right | ₱12,500.00 |
| Hundred thousands | Comma before last 3 | ₱125,000.00 |
| Millions | Two commas | ₱1,250,000.00 |
| Ten millions | ₱12,500,000.00 | ₱12,500,000.00 |
| Hundred millions | ₱125,000,000.00 | ₱125,000,000.00 |
| Billions | ₱1,250,000,000.00 | ₱1,250,000,000.00 |

**Decimal places:** Always two decimal places (centavos) for display. The engine retains full precision internally; the display truncates to 2 decimal places using `toFixed(2)` on the Decimal type. No trailing zero suppression.

**Negative/credit amounts:** Shown with parentheses, not minus sign: "(₱30,000.00)" for credits and deductions in ledger rows.

**Zero amounts in ledger rows:** Show as "₱0.00" in muted gray (#94A3B8), never hidden.

### 24.2 Percentage Formatting

| Percentage | Display Format | Example |
|-----------|---------------|---------|
| Effective tax rate | "{value}% of gross receipts" | "4.67% of gross receipts" |
| Deduction rate | "{value}%" | "40%" |
| Flat tax rate | "{value}%" | "8%" |
| Interest rate | "{value}% per annum" | "6% per annum" |
| Surcharge rate | "{value}%" | "10%" |

All percentages are displayed to 2 decimal places if the value has cents (e.g., "4.67%"), or as a whole number if the value is exact (e.g., "8%", "40%", "3%"). Never display "8.00%" — display "8%".

### 24.3 Date Formatting

| Context | Format | Example |
|---------|--------|---------|
| Filing deadline | "MMMM D, YYYY" | "April 15, 2026" |
| Payment due date | "MMMM D, YYYY" | "July 15, 2026" |
| User-entered dates | "MMM D, YYYY" | "Aug 15, 2026" |
| Quarterly period | "{Qn} ({Month range})" | "Q1 (Jan–Mar)" |

### 24.4 Large Number Abbreviation (Mobile Only)

On screens < 480px wide, peso amounts ≥ ₱1,000,000 in the comparison table headers are abbreviated:
- ₱1,000,000 → "₱1M"
- ₱1,500,000 → "₱1.5M"
- ₱12,500,000 → "₱12.5M"

In ledger rows and balance sections, always show full amounts regardless of screen size.

---

## 25. Mobile Layout Adaptations

### 25.1 Comparison Table — Mobile (< 768px)

The three-column comparison table cannot fit on mobile at full width. On screens < 768px, it switches from a horizontal 3-column layout to a vertical card layout with horizontal scrolling:

```
┌───────────────────────────────────┐  ◄  ►
│  PATH C  ★ RECOMMENDED           │
│  8% Flat Rate                     │
│  ─────────────────────────────    │
│  Taxable Base:    ₱350,000        │
│  Income Tax:       ₱28,000        │
│  Percentage Tax:       ₱0 (waived)│
│  TOTAL BURDEN:     ₱28,000        │
│  Effective Rate: 4.67%            │
│  Receipts needed: No              │
│  [Details ↓]                      │
└───────────────────────────────────┘
 ○ ● ○  (pagination dots)
```

Navigation: swipe left/right, or tap arrows. Pagination dots show which path is currently visible. The recommended path is always shown first (leftmost) on mobile.

### 25.2 Path Detail Accordion — Mobile

On mobile, the RV-12 accordion collapses to a bottom sheet (modal sheet that slides up from the bottom) instead of an inline accordion, to avoid excessive page length. Tapping "See Details ↓" on any path card opens the bottom sheet for that path.

### 25.3 Balance Section — Mobile

On mobile, the balance section (RV-06) uses the full viewport width and larger font for the balance amount (40px bold) to ensure the key number is immediately visible without scrolling.

### 25.4 Touch Targets

All interactive elements on mobile have a minimum touch target of 44×44px. This applies to:
- All buttons in RV-13 action bar (height: 44px minimum)
- Accordion expand/collapse headers (touch area: full row width × 48px height)
- "← Modify Inputs" back link (touch target: 44px height, full text width)
- MRF "Mark as verified" and "Exclude" buttons (44px height)
- Expansion toggles for CWT detail and deduction breakdown (44px touch target)

### 25.5 Font Size Scaling

| Element | Desktop Font Size | Mobile Font Size |
|---------|-----------------|-----------------|
| Balance amount | 32px bold | 40px bold |
| Comparison table total burden row | 18px bold | 16px bold |
| Section headers | 20px semibold | 18px semibold |
| Body text (descriptions) | 14px | 14px |
| Legal/footnote text | 12px | 12px |
| Warning banner text | 14px | 13px |
| Page title | 28px bold | 22px bold |
