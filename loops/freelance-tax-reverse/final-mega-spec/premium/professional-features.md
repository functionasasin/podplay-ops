# Professional (B2B) Features — Philippine Freelance & Self-Employed Income Tax Optimizer

**Status:** COMPLETE
**Last updated:** 2026-03-02
**Cross-references:**
- Tier definitions and gating rules: [premium/tiers.md](tiers.md)
- Pricing and billing cycles: [premium/pricing.md](pricing.md)
- Feature matrix: [premium/features-by-tier.md](features-by-tier.md)
- API endpoints (batch, API keys, clients, PDF export): [api/endpoints.md](../api/endpoints.md)
- Auth model and CPA role: [api/auth.md](../api/auth.md)
- Database schema: [database/schema.md](../database/schema.md)
- BIR Form 1701 field mappings: [domain/bir-form-1701-field-mapping.md](../domain/bir-form-1701-field-mapping.md)
- BIR Form 1701A field mappings: [domain/bir-form-1701a-field-mapping.md](../domain/bir-form-1701a-field-mapping.md)
- Engine data model: [engine/data-model.md](../engine/data-model.md)

---

## Table of Contents

1. [Feature Scope and Tier Requirements](#1-feature-scope-and-tier-requirements)
2. [PDF Export Engine](#2-pdf-export-engine)
   - 2.1 Technology and Rendering Stack
   - 2.2 Common Document Structure
   - 2.3 SUMMARY Export — Layout Specification
   - 2.4 FORM_1701_PREFILL Export — Layout Specification
   - 2.5 FORM_1701A_PREFILL Export — Layout Specification
   - 2.6 FORM_1701Q_PREFILL Export — Layout Specification
   - 2.7 CWT_SCHEDULE Export — Layout Specification
   - 2.8 White-Label Logo Overlay
   - 2.9 PDF Storage and Download Mechanics
   - 2.10 PDF Generation Error Handling
3. [Batch Computation System](#3-batch-computation-system)
   - 3.1 Architecture Overview
   - 3.2 Job Lifecycle State Machine
   - 3.3 Processing Rules and Concurrency
   - 3.4 Per-Item Error Handling
   - 3.5 Result Retention and Cleanup
   - 3.6 Webhook Notifications for Batch Completion
   - 3.7 Batch API Rate Limits and Quotas
4. [API Key System](#4-api-key-system)
   - 4.1 Key Generation Algorithm
   - 4.2 Scope Definitions and Endpoint Access Matrix
   - 4.3 API Key Validation Per-Request
   - 4.4 API Key Rate Limits
   - 4.5 API Key Security Rules
5. [CPA Client Management](#5-cpa-client-management)
   - 5.1 CPA Role Requirement and Acquisition
   - 5.2 Client Onboarding Flow
   - 5.3 CPA Dashboard Layout
   - 5.4 Running a Computation on Behalf of a Client
   - 5.5 Client Computation Visibility Rules
   - 5.6 Client Deletion and Data Retention
   - 5.7 Multi-CPA Collision Rules
6. [Priority Support SLA](#6-priority-support-sla)
7. [Professional Features Invariants](#7-professional-features-invariants)

---

## 1. Feature Scope and Tier Requirements

### 1.1 Which Tier Unlocks Which Feature

| Professional Feature | Required Plan | Additional Role | Notes |
|---------------------|--------------|-----------------|-------|
| PDF export (SUMMARY, all PREFILL types, CWT_SCHEDULE) | PRO or ENTERPRISE | None | PRO gets 30-day download expiry; ENTERPRISE gets 365-day expiry |
| White-label PDF export (custom logo) | ENTERPRISE | None | White-label is per-export, not account-global |
| Batch computation (`/batch/*`) | ENTERPRISE | None | Up to 50 items/batch, 5 concurrent batches |
| API key access (`/api-keys/*`) | ENTERPRISE | None | Up to 5 active keys |
| CPA client management (`/clients/*`) | ENTERPRISE | CPA | Both ENTERPRISE subscription AND CPA role required |
| Priority support email | ENTERPRISE | None | 1 business-day response SLA |
| Unlimited CWT entries per computation | ENTERPRISE | None | PRO = 50; FREE = 10 |
| Unlimited prior quarterly payment entries | ENTERPRISE | None | FREE and PRO = 3 |

### 1.2 Feature Dependency Map

The professional features depend on each other as follows:

```
CPA Role + ENTERPRISE subscription
         |
         v
CPA Client Management (/clients/*)
         |
         v
Run computation on behalf of client (/clients/:id/computations)
         |
         v
Export client computation as PDF (/computations/:id/exports)
         |
         v
White-label PDF (if white_label_logo_url provided)
```

```
ENTERPRISE subscription
         |
         +----> API Key (/api-keys/*)
         |              |
         |              v
         |      Batch API via API Key (/batch/*)
         |
         +----> Batch API via Session (/batch/*)
```

### 1.3 Feature Gate Check Order

When any professional endpoint is requested, the server checks in this order:
1. Is the request authenticated (session or API key)? If not: `401 ERR_UNAUTHENTICATED`.
2. Is the user's subscription `ENTERPRISE`? If not: `403 ERR_REQUIRES_ENTERPRISE`.
3. If the endpoint is a `/clients/*` endpoint: Does `users.role == 'CPA'`? If not: `403 ERR_REQUIRES_CPA_ROLE`.
4. If using an API key: Does the key have the required scope? If not: `403 ERR_INSUFFICIENT_SCOPE`.
5. Proceed to endpoint handler.

---

## 2. PDF Export Engine

### 2.1 Technology and Rendering Stack

| Property | Value |
|----------|-------|
| Rendering library | Playwright (Chromium headless) running server-side |
| HTML template engine | Handlebars (server-side template compilation before Playwright render) |
| PDF page format | A4 portrait (210mm × 297mm) |
| PDF media type | `application/pdf` |
| Page margins | Top: 20mm, Bottom: 25mm, Left: 20mm, Right: 20mm |
| Print background | Enabled (color backgrounds print) |
| Scale | 1.0 (no scaling) |
| Primary font family | Inter (loaded from self-hosted woff2 files; fallback: Arial, sans-serif) |
| Monospace font family | JetBrains Mono (self-hosted woff2; fallback: Courier New, monospace) |
| Base font size | 10pt |
| Color profile | sRGB |
| Compression | Lossless PDF compression enabled |
| File naming | `{export_type}_{computation_id}_{yyyymmdd}.pdf` |
| Max file size expected | SUMMARY: ~120 KB; FORM_1701_PREFILL: ~180 KB; FORM_1701A_PREFILL: ~150 KB; FORM_1701Q_PREFILL: ~140 KB; CWT_SCHEDULE: variable (50–500 KB depending on number of 2307 entries) |
| Async generation | PDF generation runs in a background worker pool; API returns signed URL once ready |
| Generation timeout | 30 seconds maximum. If Playwright does not return within 30 seconds, the export row is marked `status = 'FAILED'` with `error_reason = 'GENERATION_TIMEOUT'`. |
| Generation worker pool | 4 Playwright worker processes, each handling one PDF at a time. Queue waits if all workers are busy. |

### 2.2 Common Document Structure

All five export types share the following structure:

#### 2.2.1 Header Block (appears on every page)

| Element | Description |
|---------|-------------|
| Logo | TaxOptimizer PH wordmark logo at top-left. Replaced by white-label logo if `white_label_logo_url` is set. Image: max height 40px, width auto-scaled to maintain aspect ratio. |
| Document title | Top-right aligned. Bold, 12pt. Example: "Tax Computation Summary — AY2025" |
| Horizontal rule | 1px solid #E2E8F0 (gray-200) separating header from content |

#### 2.2.2 Footer Block (appears on every page)

| Element | Description |
|---------|-------------|
| Left side | Page number: "Page X of Y" in 8pt gray (#718096) |
| Center | "Generated by TaxOptimizer PH on {date} at {time} PHT" in 8pt gray. Date format: "March 2, 2026". If white-label: "Powered by TaxOptimizer PH" in 8pt gray. |
| Right side | "FOR REFERENCE ONLY. This document is not a BIR-accepted filing." in 8pt red (#E53E3E). |

#### 2.2.3 Disclaimer Box

A boxed section immediately after the header on page 1 of all exports:

**Box style:** Border: 1px solid #FC8181 (red-300), background: #FFF5F5 (red-50), border-radius: 4px, padding: 8pt.

**Disclaimer text (exact):**
> **Important Notice:** This document is generated by TaxOptimizer PH and is intended for reference and planning purposes only. It does not constitute official tax advice or a substitute for consultation with a licensed Certified Public Accountant (CPA) or tax professional. TaxOptimizer PH makes no representations or warranties about the accuracy, completeness, or fitness for a specific purpose of this document. The user is solely responsible for verifying all figures against original source documents and for all filings submitted to the Bureau of Internal Revenue (BIR). This document does not constitute a BIR-accepted tax return and must not be submitted to the BIR as a filing.

### 2.3 SUMMARY Export — Layout Specification

**Full document title:** "Tax Computation Summary — {ANNUAL/Q1/Q2/Q3} {tax_year}"

**File name:** `SUMMARY_{computation_id}_{yyyymmdd}.pdf`

**Expected page count:** 3–5 pages depending on number of deduction entries and CWT entries.

#### 2.3.1 Page 1 — Taxpayer Profile and Regime Comparison

**Section 1: Taxpayer Profile**

| Label | Source field | Format |
|-------|-------------|--------|
| Tax Year | `TaxpayerInput.tax_year` | Plain integer: "2025" |
| Filing Period | `TaxpayerInput.filing_period` | "Annual (BIR Form 1701/1701A)" or "Q1 (BIR Form 1701Q)" or "Q2 (BIR Form 1701Q)" or "Q3 (BIR Form 1701Q)" |
| Taxpayer Type | `TaxpayerInput.taxpayer_type` | "Purely Self-Employed / Professional" or "Mixed Income (Compensation + Business)" |
| VAT Registered | `TaxpayerInput.is_vat_registered` | "Yes" or "No" |
| BMBE Registered | `TaxpayerInput.is_bmbe_registered` | "Yes" or "No" |
| Subject to Sec. 117–128 | `TaxpayerInput.subject_to_sec_117_128` | "Yes" or "No" |
| GPP Partner | `TaxpayerInput.is_gpp_partner` | "Yes" or "No" |
| EOPT Taxpayer Tier | `TaxComputationResult.eopt_tier` | "MICRO (gross receipts below ₱3M)" or "SMALL (gross receipts ₱3M–₱20M)" or "MEDIUM/LARGE" |
| Gross Receipts / Sales | `TaxpayerInput.gross_receipts` | Philippine Peso format: "₱1,200,000.00" |
| Cost of Goods Sold | `TaxpayerInput.cost_of_goods_sold` | Philippine Peso format |
| Net Sales/Receipts | `TaxComputationResult.net_receipts` | Philippine Peso format |
| Computation Generated On | Timestamp of `pdf_exports.created_at` | "March 2, 2026 at 2:30 PM PHT" |

**Section 2: Regime Comparison Table**

A three-column comparison table with one column per available path. If a path is ineligible, the column shows the reason (from `TaxComputationResult.path_c_ineligible_reason`).

| Row | Path A: Graduated + Itemized | Path B: Graduated + OSD (40%) | Path C: 8% Flat Rate |
|-----|----------------------------|-----------------------------|---------------------|
| Gross Receipts / Net Sales | ₱{amount} | ₱{amount} | ₱{amount} |
| Less: Deductions | ₱{itemized_total} "Itemized" | ₱{osd_amount} "40% OSD" | "N/A — 8% applies to gross" |
| Net Taxable Income | ₱{path_a_nti} | ₱{path_b_nti} | ₱{gross_receipts − 250000} |
| Income Tax Due | ₱{path_a_income_tax} | ₱{path_b_income_tax} | ₱{path_c_income_tax} |
| Less: Percentage Tax (3%) | −₱{path_a_pt} | −₱{path_b_pt} | "Waived" |
| Total Tax Liability | ₱{path_a_total} | ₱{path_b_total} | ₱{path_c_total} |

**Recommendation badge:** A highlighted box below the table showing:
- "RECOMMENDED: Path {A/B/C} — {Graduated + Itemized Deductions / Graduated + OSD / 8% Flat Rate}"
- "Saves ₱{savings_vs_next_best} vs. next best option"
- "Saves ₱{savings_vs_worst} vs. highest-tax option"

If a path is ineligible, it shows: "INELIGIBLE: {reason}" in the column header. Ineligible columns use gray (#718096) text.

If an election was made (not optimizer mode): "NOTE: You have elected Path {X}. TaxOptimizer recommends Path {Y} which would save ₱{savings}." in an amber advisory box.

**Section 3: Tax Credit Summary**

| Row | Amount |
|-----|--------|
| Creditable Withholding Tax (Form 2307 entries) | ₱{total_cwt} |
| Prior Quarterly Payments (Form 1701Q) | ₱{total_prior_quarterly_payments} |
| Prior Year Excess CWT Carried Forward | ₱{prior_year_excess_cwt} |
| Total Credits | ₱{total_credits} |
| Tax Due (under recommended path) | ₱{recommended_path_income_tax} |
| **Balance Payable / (Refundable)** | **₱{balance_payable}** |

Balance row uses green (#276749) text if refundable, red (#C53030) if payable.

#### 2.3.2 Page 2 — Itemized Deductions Detail (if applicable)

This page appears only when the user has entered `itemized_expenses` values (at least one nonzero field). It shows all entries for Path A computation.

| Deduction Category | Amount | Notes |
|-------------------|--------|-------|
| Salaries, Wages, and Benefits | ₱{amount} | NIRC Sec. 34(A) |
| Employer SSS/PhilHealth/Pag-IBIG Contributions | ₱{amount} | NIRC Sec. 34(A) |
| Rent Expense | ₱{amount} | NIRC Sec. 34(A) |
| Utilities | ₱{amount} | NIRC Sec. 34(A) |
| Communication | ₱{amount} | NIRC Sec. 34(A) |
| Office Supplies | ₱{amount} | NIRC Sec. 34(A) |
| Professional Fees Paid | ₱{amount} | NIRC Sec. 34(A) |
| Travel and Transportation | ₱{amount} | NIRC Sec. 34(A) |
| Insurance Premiums | ₱{amount} | NIRC Sec. 34(A) |
| Interest Expense (net of 33% arbitrage reduction) | ₱{interest_net} | NIRC Sec. 34(B). Shown gross and net. |
| Taxes and Licenses | ₱{amount} | NIRC Sec. 34(C) |
| Casualty and Theft Losses | ₱{amount} | NIRC Sec. 34(D) |
| Bad Debts (accrual basis only) | ₱{amount} | NIRC Sec. 34(E). If cash basis, shows ₱0.00 with note "Bad debts disallowed for cash-basis taxpayer." |
| Depreciation (sum of all entries) | ₱{total_depreciation} | NIRC Sec. 34(F). See depreciation detail below. |
| Charitable Contributions (capped) | ₱{charitable_allowed} | NIRC Sec. 34(H). Shows computed cap and input amount. |
| Research and Development | ₱{amount} | NIRC Sec. 34(I) |
| Entertainment, Amusement, Recreation (EAR) | ₱{ear_allowed} | NIRC Sec. 34(A)(1)(b). Shows computed cap and input amount. |
| Home Office Expense (exclusive use only) | ₱{home_office_allowed} | Shows full amount if exclusive use; ₱0.00 with note if not exclusive. |
| NOLCO (Net Operating Loss Carryover) | ₱{nolco_applied} | NIRC Sec. 34(D)(3). Shows year of origin for each applied carryover. |
| **Total Allowable Itemized Deductions** | **₱{total_itemized}** | Bold, underlined |

**Depreciation detail sub-table** (one row per depreciation entry):

| Asset Name | Cost | Salvage | Life | Method | Annual Depreciation |
|-----------|------|---------|------|--------|---------------------|
| {asset_name} | ₱{cost} | ₱{salvage} | {N} yrs | Straight-line / DB | ₱{annual_amount} |

**Manual Review Flags on this page:** Any MRF codes from the engine's `manual_review_flags` list that relate to itemized deductions are shown in an amber box below the deductions table, each with its code number, flag title, and description.

#### 2.3.3 Page 3 — Form 2307 CWT Entries (if any)

This page appears only when `cwt_2307_entries` is non-empty.

**Table header:** "Creditable Withholding Tax (CWT) — Form 2307 Entries"

| # | Payor Name | Payor TIN | ATC Code | Period From | Period To | Income Payment | Tax Withheld | Quarter of Credit |
|---|-----------|----------|----------|-------------|-----------|---------------|-------------|-----------------|
| 1 | {payor_name} | {payor_tin} | {atc_code} | {from} | {to} | ₱{income_payment} | ₱{tax_withheld} | Q{n} or Annual |

**Total row:** Sum row at the bottom: "Total CWT Available for Credit: ₱{total_cwt}"

**Note:** "Source: BIR Form 2307 (Certificate of Creditable Tax Withheld at Source). Verify all entries against original Form 2307 certificates. Figures shown here are as entered by the taxpayer and have not been verified by TaxOptimizer PH."

#### 2.3.4 Last Page — Filing Instructions and Deadlines

**Section: Recommended Filing Actions**

Rendered as a numbered checklist based on the recommended path and filing period:

If recommended path is PATH_C (8%) and filing period is ANNUAL:
1. File BIR Form 1701A (Annual ITR — 8% Flat Rate Election) on or before April 15, {tax_year + 1}.
2. Signify your election to use the 8% option in BIR Form 1701A Part IV, Item 50.
3. Pay balance due of ₱{balance_payable} through the BIR's Authorized Agent Banks (AAB) or via GCash/Maya/online banking using BIR payment channels.
4. Attach all Form 2307 certificates from payors to your return.
5. If filing via eBIRForms: Use offline eBIRForms package version 7.9.4 or later.
6. If filing via eAFS: Upload Form 1701A and attachments within 15 calendar days after the filing deadline.

If recommended path is PATH_A or PATH_B and filing period is ANNUAL:
1. File BIR Form 1701 (Annual ITR — Graduated Rate) on or before April 15, {tax_year + 1}.
2. If electing OSD: Mark Item 43 "Optional Standard Deduction" in BIR Form 1701.
3. If using itemized deductions: Attach Schedule 1 (Itemized Deductions) to your return.
4. Pay balance due of ₱{balance_payable} on or before April 15, {tax_year + 1}.
5. Attach all Form 2307 certificates from payors.
6. If filing via eBIRForms: Use eBIRForms v7.9.4 or later. Select Form 1701 (January 2018 version).

If filing period is Q1:
1. File BIR Form 1701Q for Q1 (January 1 – March 31) on or before May 15, {tax_year}.
2. Use cumulative method: taxable income and deductions are for the full period January 1 to March 31.
3. Pay balance due of ₱{balance_payable} on or before May 15, {tax_year}.

If filing period is Q2:
1. File BIR Form 1701Q for Q2 (January 1 – June 30) on or before August 15, {tax_year}.
2. Deduct Q1 payment of ₱{q1_payment} already made. Balance due is ₱{balance_payable}.

If filing period is Q3:
1. File BIR Form 1701Q for Q3 (January 1 – September 30) on or before November 15, {tax_year}.
2. Deduct prior quarterly payments (Q1 + Q2) totaling ₱{total_prior_quarterly}. Balance due is ₱{balance_payable}.

**Section: Percentage Tax Reminder** (shown if taxpayer is not on 8% path and is below ₱3M):
> "As a non-VAT registered taxpayer with gross receipts below ₱3,000,000, you are also required to file quarterly Percentage Tax returns (BIR Form 2551Q) at 3% of gross receipts. Your estimated quarterly percentage tax for this period is ₱{quarterly_pt}. Deadlines: Q1 — April 25, Q2 — July 25, Q3 — October 25, Q4 — January 25 of the following year."

**Section: Important Deadlines Table**

| Form | Description | Deadline |
|------|-------------|----------|
| 1701A or 1701 | Annual ITR for AY{tax_year} | April 15, {tax_year + 1} |
| 1701Q (Q1) | Quarterly ITR, Q1 | May 15, {tax_year} |
| 1701Q (Q2) | Quarterly ITR, Q2 | August 15, {tax_year} |
| 1701Q (Q3) | Quarterly ITR, Q3 | November 15, {tax_year} |
| 2551Q (Q1) | Percentage Tax, Q1 | April 25, {tax_year} |
| 2551Q (Q2) | Percentage Tax, Q2 | July 25, {tax_year} |
| 2551Q (Q3) | Percentage Tax, Q3 | October 25, {tax_year} |
| 2551Q (Q4) | Percentage Tax, Q4 | January 25, {tax_year + 1} |

### 2.4 FORM_1701_PREFILL Export — Layout Specification

**Full document title:** "BIR Form 1701 Pre-fill Reference — AY{tax_year}"

**File name:** `FORM_1701_PREFILL_{computation_id}_{yyyymmdd}.pdf`

**Purpose:** A pre-filled reference document showing BIR Form 1701 fields populated from the computation result. This is NOT submitted to the BIR — it is a reference for the taxpayer or CPA when filling the official eBIRForms or BIR portal.

**Watermark:** Diagonal watermark across all pages: "FOR REFERENCE ONLY — NOT FOR SUBMISSION" in light red (opacity 0.15), 48pt, rotated 45 degrees.

**Page 1 — BIR Form 1701 Part I: Background Information**

| Item No. | Field Label | Pre-filled Value | Source |
|---------|------------|-----------------|--------|
| 1 | For the Year (YYYY) | {tax_year} | `TaxpayerInput.tax_year` |
| 2 | Amended Return? | "No" (default; user marks if amended) | `TaxpayerInput.return_type` |
| 3 | Short Period Return? | "No" | Always No for this tool (full-year computation) |
| 4 | Taxpayer Identification Number (TIN) | "{Leave blank — enter your TIN}" | Not stored by TaxOptimizer PH |
| 5 | RDO Code | "{Enter your RDO code}" | Not stored |
| 6 | Taxpayer's Name | "{Enter your registered name}" | Not stored |
| 7 | Registered Address | "{Enter your registered address}" | Not stored |
| 8 | Zip Code | "{Enter zip code}" | Not stored |
| 9 | Contact Number | "{Enter contact number}" | Not stored |
| 10 | Tax Agent Accreditation No. | "{If filed by agent, enter here}" | Not stored |
| 11 | Date of Birth (MM/DD/YYYY) | "{Enter date of birth}" | Not stored |
| 12 | Citizenship | "{Enter citizenship}" | Not stored |
| 13 | Civil Status | "{Enter civil status}" | Not stored |
| 14 | Are you availing of tax relief under Special Law or International Tax Treaty? | "No" (default) | Not computed by engine |
| 15 | Category of Qualified Person | "{Leave blank if not applicable}" | Not stored |
| 16 | ATC (Alphanumeric Tax Code) | IT-010 for Graduated; IT-011 for 8% | `TaxComputationResult.recommended_path` |

**Page 1 — BIR Form 1701 Part II: Computation of Tax**

These fields reference the computation result.

| Item No. | Field Label | Pre-filled Value | Source |
|---------|------------|-----------------|--------|
| 32 | Gross Receipts/Sales | {gross_receipts} | `TaxpayerInput.gross_receipts` |
| 33 | Less: Sales Returns, Allowances, Discounts | {sales_returns_allowances} | `TaxpayerInput.sales_returns_allowances` |
| 34 | Net Sales/Receipts/Revenues | {net_receipts} | `TaxComputationResult.net_receipts` |
| 35 | Add: Other Income | {non_operating_income} | `TaxpayerInput.non_operating_income` |
| 36 | Gross Income from Business | {gross_income_from_business} | CR-005 result |
| 37 | Less: Cost of Sales/Services | {cost_of_goods_sold} | `TaxpayerInput.cost_of_goods_sold` |
| 38 | Gross Income | {gross_income_net_of_cogs} | CR-005 result |
| 39 | Less: Deductions (if Itemized) | {total_itemized_deductions} | Path A only |
| 40 | Less: Optional Standard Deduction | {osd_amount} | Path B only (40% × Item 38) |
| 41 | Net Income from Business | {net_taxable_income} | Recommended path result |
| 42 | Add: Taxable Compensation Income | {taxable_compensation} | `TaxpayerInput.taxable_compensation` |
| 43 | Total Net Taxable Income | {total_nti} | Combined for mixed income |
| 44 | Income Tax Due | {income_tax_due} | From recommended path |
| 45 | Less: Tax Credits/Payments | {total_credits} | Total CWT + prior quarterly |
| 46 | Tax Still Due | {balance_payable} | Positive = payable; Negative = refundable |
| 47 | Add: Penalties (if applicable) | {total_penalties} | From penalty computation (CR-020) |
| 48 | Total Amount Payable | {total_amount_payable} | Item 46 + Item 47 |

**Page 2 — Schedule 1: Itemized Deductions** (shown if recommended path is PATH_A)

One row per deduction category, using the same categories as the SUMMARY export §2.3.2. Field labels match BIR Form 1701 Schedule 1 labels exactly.

**Page 2 — Schedule 2: Tax Credits / Tax Payments**

| Schedule Item | Label | Pre-filled Value |
|-------------|-------|-----------------|
| A | Creditable Tax Withheld per BIR Form 2307 | {total_cwt_for_it} |
| B | Creditable Tax Withheld per BIR Form 2306 | 0.00 (not supported by engine) |
| C | Prior Year's Excess Credits | {prior_year_excess_cwt} |
| D | Tax Payments for the First Three Quarters | {total_prior_quarterly_payments} |
| E | Other Credits | 0.00 |
| Total | Total Tax Credits / Tax Payments | {total_credits} |

**Page 3 — Schedule 3: Information on Income Payments Subjected to CWT**

A tabulation of all Form 2307 entries, same format as SUMMARY export §2.3.3.

### 2.5 FORM_1701A_PREFILL Export — Layout Specification

**Full document title:** "BIR Form 1701A Pre-fill Reference — AY{tax_year}"

**File name:** `FORM_1701A_PREFILL_{computation_id}_{yyyymmdd}.pdf`

**Applicability check:** If recommended path is PATH_A (Itemized), the computation was for a mixed-income taxpayer, or VAT-registered, this export type should not be used. The API returns `400 ERR_INCOMPATIBLE_EXPORT_TYPE` with message: "FORM_1701A_PREFILL is only applicable when the recommended filing path is PATH_B (OSD) or PATH_C (8% Flat Rate) for purely self-employed, non-VAT registered taxpayers." If the user calls this endpoint on a computation where it's not applicable, the error prevents generation.

**Watermark:** Same as FORM_1701_PREFILL — "FOR REFERENCE ONLY — NOT FOR SUBMISSION".

**Page 1 — Background Information**

Same as FORM_1701_PREFILL items 1–16, with:
- Item 16 ATC: IT-010 for Path B (OSD/Graduated); IT-011 for Path C (8%)
- Item 17 "Are you availing of the 8% Income Tax Rate?": "Yes" if PATH_C, "No" if PATH_B

**Page 1 — Computation of Tax (Graduated + OSD — Items 36–46)**

Used when recommended path is PATH_B:

| Item No. | Field Label | Pre-filled Value |
|---------|------------|-----------------|
| 36 | Gross Sales/Receipts | {gross_receipts} |
| 37 | Less: Sales Returns, Allowances | {sales_returns_allowances} |
| 38 | Net Sales/Receipts | {net_receipts} |
| 39 | Add: Non-Operating Income | {non_operating_income} |
| 40 | Total Gross Income | {total_gross_income} |
| 41 | Less: OSD (40% of Item 40) | {osd_amount} |
| 42 | Net Taxable Income | {path_b_nti} |
| 43 | Income Tax Due (on Item 42) | {path_b_income_tax} |
| 44 | Less: Tax Credits/Payments | {total_credits} |
| 45 | Tax Still Due | {balance_payable_path_b} |
| 46 | Add: Penalties (if applicable) | {total_penalties} |

**Page 1 — Computation of Tax (8% Flat Rate — Items 47–56)**

Used when recommended path is PATH_C:

| Item No. | Field Label | Pre-filled Value |
|---------|------------|-----------------|
| 47 | Gross Sales/Receipts | {gross_receipts} |
| 48 | Less: Sales Returns, Allowances | {sales_returns_allowances} |
| 49 | Net Sales/Receipts | {net_receipts} |
| 50 | Add: Non-Operating Income | {non_operating_income} |
| 51 | Total Gross Income | {total_gross_income} |
| 52 | Less: ₱250,000 Deduction | 250000.00 |
| 53 | Net Taxable Income | {path_c_nti} (Item 51 − 250,000) |
| 54 | Income Tax Rate | 8% |
| 55 | Income Tax Due (8% × Item 53) | {path_c_income_tax} |
| 56 | Less: Tax Credits/Payments | {total_cwt} (Prior quarterly payments excluded for 8% path — quarterly 1701Qs not required) |

**Page 2 — Tax Credits (Items 57–65)**

| Item No. | Label | Pre-filled Value |
|---------|-------|-----------------|
| 57 | CWT per BIR Form 2307 (income tax) | {total_cwt_for_it} |
| 58 | CWT per BIR Form 2306 | 0.00 |
| 59 | Prior Year's Excess CWT | {prior_year_excess_cwt} |
| 60 | Tax Payments for First Three Quarters | {total_prior_quarterly_payments} (if Path B; 0.00 if Path C) |
| 61 | Other Credits | 0.00 |
| 62 | Total Credits | {total_credits} |
| 63 | Tax Still Due or (Overpayment) | {balance_payable} |
| 64 | Add: Penalties | {total_penalties} |
| 65 | Total Amount Payable / (Overpayment) | {total_amount_payable} |

### 2.6 FORM_1701Q_PREFILL Export — Layout Specification

**Full document title:** "BIR Form 1701Q Pre-fill Reference — {Q1/Q2/Q3} {tax_year}"

**File name:** `FORM_1701Q_PREFILL_{computation_id}_{yyyymmdd}.pdf`

**Applicability:** Only applicable when `TaxpayerInput.filing_period` is "Q1", "Q2", or "Q3". If filing period is "ANNUAL", returns `400 ERR_INCOMPATIBLE_EXPORT_TYPE` with message: "FORM_1701Q_PREFILL requires a quarterly filing period (Q1, Q2, or Q3). This computation has filing_period = ANNUAL."

**Watermark:** Same as other pre-fill exports.

**Page 1 — Background Information**

| Item No. | Label | Pre-filled Value |
|---------|-------|-----------------|
| 1 | Tax Year (YYYY) | {tax_year} |
| 2 | Quarter | {Q1/Q2/Q3} |
| 3 | Date From | Q1: January 1; Q2: January 1; Q3: January 1 (cumulative method always starts Jan 1) |
| 4 | Date To | Q1: March 31; Q2: June 30; Q3: September 30 |
| 5 | Amended Return? | "No" (default) |
| 6 | TIN | "{Enter your TIN}" |
| 7 | RDO Code | "{Enter your RDO code}" |
| 8 | Name | "{Enter your registered name}" |
| 9 | ATC | IT-010 (Graduated) or IT-011 (8%) per recommended path |

**Page 1 — Computation (Graduated — Schedule I and II)**

For Path A or Path B (cumulative to date of quarter):

| Item No. | Label | Pre-filled Value |
|---------|-------|-----------------|
| 36 | Gross Sales/Receipts (cumulative) | {gross_receipts} |
| 37 | Less: Returns/Allowances | {sales_returns_allowances} |
| 38 | Net Receipts | {net_receipts} |
| 39 | Add: Non-Operating Income | {non_operating_income} |
| 40 | Gross Income | {gross_income} |
| 41 | Less: Cost of Sales/Services | {cost_of_goods_sold} |
| 42 | Gross Income from Business | {gross_income_net_of_cogs} |
| 43 | Less: Deductions | {applicable_deductions} — OSD or itemized per path |
| 44 | Net Income from Business | {nti} |
| 45 | Add: Taxable Compensation | {taxable_compensation} |
| 46 | Total Net Taxable Income | {total_nti} |
| 47 | Income Tax on Total Net Taxable Income | {income_tax} |
| 48 | Less: Applicable Tax Treaty Relief | 0.00 |
| 49 | Total Tax Due | {income_tax} |
| 50 | Less: CWT (IT) per Form 2307 | {total_cwt_for_it} |
| 51 | Less: Prior Year Excess CWT | {prior_year_excess_cwt} |
| 52 | Less: Prior Quarterly Payments | {prior_quarterly_payments_total} |
| 53 | Tax Still Due / (Overpayment) | {balance_payable} |
| 54 | Add: Penalties | {total_penalties} |
| 55 | Total Amount Payable | {total_amount_payable} |

**Page 1 — Computation (8% Flat Rate — Schedule III)**

For Path C:

| Item No. | Label | Pre-filled Value |
|---------|-------|-----------------|
| 56 | Gross Sales/Receipts (cumulative) | {gross_receipts} |
| 57 | Less: Returns/Allowances | {sales_returns_allowances} |
| 58 | Net Receipts | {net_receipts} |
| 59 | Add: Non-Operating Income | {non_operating_income} |
| 60 | Total Gross Income | {total_gross_income} |
| 61 | Less: ₱250,000 Deduction (Q1 only) | 250000.00 if Q1; 0.00 if Q2 or Q3 |
| 62 | Net Taxable Income | {path_c_nti} |
| 63 | Income Tax Rate | 8% |
| 64 | Income Tax Due | {path_c_income_tax} |
| 65 | Less: Tax Credits | {total_cwt_for_it} |
| 66 | Less: Prior Quarterly Payments | 0.00 (8% filers do not have quarterly 1701Q payments in the traditional sense; first 1701Q for Path C shows full 8% on cumulative income) |
| 67 | Tax Still Due / (Overpayment) | {balance_payable} |
| 68 | Total Amount Payable | {total_amount_payable} |

### 2.7 CWT_SCHEDULE Export — Layout Specification

**Full document title:** "Schedule of Creditable Withholding Tax — {ANNUAL/Q1/Q2/Q3} {tax_year}"

**File name:** `CWT_SCHEDULE_{computation_id}_{yyyymmdd}.pdf`

**Purpose:** A formatted schedule of all Form 2307 entries, intended as a reference for completing the BIR SAWT (Summary Alphalist of Withholding Tax) attachment or the Schedule of CWT in BIR Form 1701/1701A.

**Page 1 — Cover Page**

| Element | Content |
|---------|---------|
| Title | "Schedule of Creditable Withholding Tax" |
| Subtitle | "Per BIR Form 2307 (Certificate of Creditable Tax Withheld at Source)" |
| Tax Period | "{Q1/Q2/Q3/Annual}, Assessment Year {tax_year}" |
| Number of 2307 Entries | "{N} certificate(s) listed" |
| Total Income Payments | "₱{total_income_payments}" |
| Total CWT (Income Tax) | "₱{total_cwt_it}" |
| Total CWT (Percentage Tax) | "₱{total_cwt_pt}" |
| Grand Total CWT | "₱{total_cwt}" |

**Main Table — One Row Per Form 2307 Entry**

| Column | Width | Content |
|--------|-------|---------|
| Seq. # | 4% | Sequential number 1, 2, 3, … |
| Payor Name | 22% | Payor name (truncated at 35 chars if needed) |
| Payor TIN | 12% | "XXX-XXX-XXX" format |
| ATC Code | 8% | e.g., "WI040", "WC158" |
| Period From | 9% | "MM/DD/YYYY" |
| Period To | 9% | "MM/DD/YYYY" |
| Income Payment | 12% | "₱X,XXX,XXX.XX" right-aligned |
| Tax Rate | 5% | e.g., "10%" or "15%" |
| Tax Withheld | 11% | "₱X,XXX,XXX.XX" right-aligned |
| Credited in | 8% | "Q1", "Q2", "Q3", or "Annual" |

**If more than 30 entries:** Table continues on subsequent pages with "Continued…" in the header.

**Summary Sub-table by ATC Code:**

After the main table, a grouped summary:

| ATC Code | Description | Total Income Payments | Total Tax Withheld |
|----------|-------------|----------------------|-------------------|
| WI040 | Professional fees — individual, 10% | ₱{subtotal} | ₱{cwt_subtotal} |
| WI158 | Brokers, agents — 10% | ₱{subtotal} | ₱{cwt_subtotal} |
| (one row per ATC code present) | | | |
| **GRAND TOTAL** | | **₱{total_income_payments}** | **₱{total_cwt}** |

**Footer note on CWT Schedule:**
> "Note: This schedule is prepared for reference purposes and must be reconciled against original BIR Form 2307 certificates. All amounts are as entered by the taxpayer. Attach original Form 2307 certificates to your annual income tax return. Submit the Summary Alphalist of Withholding Taxes (SAWT) via BIR eFPS or eBIRForms. For assistance, consult a licensed CPA."

### 2.8 White-Label Logo Overlay

**Availability:** ENTERPRISE tier only. Per-export parameter (not an account setting).

**API parameter:** `white_label_logo_url` (string) on `POST /computations/:id/exports`.

**Logo URL Requirements:**
- Must be a valid HTTPS URL (not HTTP).
- File must be accessible publicly (no auth required). The server fetches the file at render time.
- Accepted formats: PNG (preferred for transparency), JPG, WebP.
- Max file size: 1 MB. If the fetched file exceeds 1 MB: `400 ERR_WHITE_LABEL_LOGO_TOO_LARGE`.
- If fetch fails (timeout after 5 seconds, 404, or non-image content-type): `400 ERR_WHITE_LABEL_LOGO_FETCH_FAILED`.
- Recommended dimensions: 300px wide × 100px tall. Aspect ratio is preserved.

**Logo placement rules:**
- The TaxOptimizer PH wordmark in the header is replaced by the provided logo.
- Logo is placed at the top-left of each page header.
- Rendered height: 36px (scales width proportionally).
- If the logo has a transparent background (PNG), it is rendered on the white background of the PDF.
- If the logo has a colored background, the rectangle is rendered as-is.

**Footer text when white-labeling:**
- The footer center text changes from "Generated by TaxOptimizer PH on {date}" to "Prepared for {client display name or 'Client'} on {date} — Powered by TaxOptimizer PH".
- "Powered by TaxOptimizer PH" is ALWAYS present in the footer (required by license). Font size: 7pt, color: #A0AEC0 (gray-400).
- The right-side footer disclaimer ("FOR REFERENCE ONLY. This document is not a BIR-accepted filing.") is always shown regardless of white-labeling.

**Database tracking:** The `pdf_exports` row stores:
- `white_label_logo_url` (nullable text) — the URL provided.
- `white_labeled` (boolean, default false) — true if logo was applied.

### 2.9 PDF Storage and Download Mechanics

**Storage backend:** Cloudflare R2 (S3-compatible object storage).

**Bucket name:** `taxoptimizer-pdf-exports` (production); `taxoptimizer-pdf-exports-staging` (staging).

**Object key format:** `{user_id}/{computation_id}/{export_type}/{export_id}.pdf`

**Object access:** Private (no public access). Downloads served via signed URLs.

**Signed URL generation:**
- PRO tier: Signed URL valid for 30 days from first request (not from generation time).
- ENTERPRISE tier: Signed URL valid for 365 days from first request.
- Signed URLs are re-generated on each `GET /computations/:id/exports/:export_id/download` call. A new signed URL with the full remaining TTL is generated each time.
- The TTL clock starts from the first download request, not from the export creation time. This means an export created in January but first downloaded in February gets a fresh 30-day or 365-day URL in February.

**API download flow:**
1. `POST /computations/:id/exports` — creates export job, returns `export_id` and `status: "PENDING"`.
2. Server generates PDF asynchronously (background worker).
3. Client polls `GET /computations/:id/exports/:export_id` until `status == "READY"`.
4. `GET /computations/:id/exports/:export_id/download` — returns `{ "download_url": "https://...", "expires_at": "..." }`. Client navigates browser to `download_url`.

**Status values for `pdf_exports.status`:**
- `PENDING` — queued, not yet started
- `GENERATING` — Playwright render in progress
- `READY` — PDF stored in R2, download URL available
- `FAILED` — generation failed (see `error_reason` field)

**`error_reason` values for FAILED state:**
- `GENERATION_TIMEOUT` — Playwright did not return within 30 seconds
- `COMPUTATION_NOT_FOUND` — source computation was deleted between export request and generation
- `WHITE_LABEL_LOGO_FETCH_FAILED` — logo URL could not be fetched
- `WHITE_LABEL_LOGO_TOO_LARGE` — logo file exceeded 1 MB
- `WHITE_LABEL_LOGO_INVALID_FORMAT` — fetched file is not PNG/JPG/WebP
- `INCOMPATIBLE_EXPORT_TYPE` — export type not applicable to this computation (e.g., FORM_1701A_PREFILL for a mixed-income filer)
- `INTERNAL_ERROR` — unexpected Playwright or template rendering error

**Retry policy for FAILED exports:** User must re-submit a new `POST /computations/:id/exports` request. Failed exports are not retried automatically.

### 2.10 PDF Generation Error Handling

| Scenario | API Behavior | Resolution for User |
|----------|-------------|---------------------|
| Export type not applicable to computation | `400 ERR_INCOMPATIBLE_EXPORT_TYPE` (synchronous, before job creation) | User selects a compatible export type. Error message explains which types are applicable. |
| Computation not found | `404 ERR_NOT_FOUND` | Computation was deleted. User must re-run computation. |
| Plan does not allow PDF export | `403 ERR_REQUIRES_PRO_OR_ENTERPRISE` | User upgrades. |
| White-label logo URL invalid | `400 ERR_WHITE_LABEL_LOGO_*` (synchronous) | User provides a valid HTTPS URL. |
| PDF generation fails after job creation | `export_id.status = "FAILED"`, `error_reason` set | User re-submits export request. |
| All 4 Playwright workers busy | Export job queued in DB; processed when a worker frees up. | Polling `GET /exports/:id` shows `status: "PENDING"` until picked up. |

---

## 3. Batch Computation System

### 3.1 Architecture Overview

The batch computation system processes multiple `TaxpayerInput` objects in a single API call. It is designed for CPA and bookkeeping workflows where a professional processes a full client roster for year-end filings.

**Components:**
- **API layer:** `POST /batch/computations` (submit), `GET /batch/:id` (status), `GET /batch/:id/results` (results)
- **Queue:** PostgreSQL-backed job queue (pg-boss or equivalent). Each batch job is a row in `batch_jobs`; each item is a row in `batch_job_items`. No external message broker (Redis/SQS) required.
- **Worker pool:** 4 computation worker processes (same backend workers as single `/compute` — engine is stateless and reentrant). Each worker picks one batch item at a time.
- **Result storage:** Results stored in `batch_job_items.result_json` (JSONB) upon completion.

**Concurrency model:** Each ENTERPRISE user may have at most 5 concurrently `QUEUED` or `PROCESSING` batch jobs. Submitting a 6th concurrent batch returns `429 ERR_RATE_LIMIT_EXCEEDED`. Completed and expired batches do not count toward the 5-job limit.

### 3.2 Job Lifecycle State Machine

```
[POST /batch/computations]
         |
         v
      QUEUED ─────────────────> (deleted after 30 days if not started)
         |
         | (worker picks up)
         v
    PROCESSING ──────────────> (each item: PENDING → SUCCESS or FAILED)
         |
         | (all items processed)
         v
   COMPLETE (if 0 failures)
         OR
  PARTIAL_FAILURE (if ≥1 failure)
```

**Allowed status transitions:**

| From | To | Condition |
|------|----|-----------|
| QUEUED | PROCESSING | Worker starts processing the batch |
| PROCESSING | COMPLETE | All items processed with no failures |
| PROCESSING | PARTIAL_FAILURE | All items processed, at least 1 failure |

There is no FAILED state at the batch level — a batch can only be COMPLETE or PARTIAL_FAILURE. Individual items can fail while the batch continues. A batch is never stuck in PROCESSING beyond 15 minutes: if a batch has been in PROCESSING for 15 minutes without updates to `updated_at`, a watchdog process marks it PARTIAL_FAILURE with a sentinel error in the failed items.

**Per-item status values:**

| Status | Meaning |
|--------|---------|
| `PENDING` | Item not yet processed by a worker |
| `SUCCESS` | Engine computed the result successfully |
| `FAILED` | Engine returned a validation error for this item |

### 3.3 Processing Rules and Concurrency

**Processing order:** Items within a batch are processed in the order submitted (by `item_index`). Workers do not guarantee ordering across concurrent batches.

**Item isolation:** A failure in one item does not stop processing of other items. Each item's engine call is independent. If the engine throws an unexpected error (assertion failure / `ERR_ASSERT_*`), that item is marked FAILED with `error_code = "ERR_INTERNAL_ENGINE_ERROR"` and processing continues.

**Worker assignment:** Workers are assigned to items, not batches. A single batch can be worked on by up to 4 workers simultaneously (one item per worker). This means a 50-item batch runs in 13 waves of 4 items (12 × 4 = 48, then 2 remaining).

**Estimated completion time:** Computed as: `ceil(total_items / 4) × 0.6 seconds` (each computation averages 0.6 seconds). Returned in `POST /batch/computations` response as `estimated_completion_seconds`.

**Maximum queue wait time:** 2 minutes. If a QUEUED batch has not started processing within 2 minutes of submission (due to all workers being busy with other batches), a `queue_wait_exceeded` warning is logged but the batch continues to wait. Users are advised to poll for status.

### 3.4 Per-Item Error Handling

When a batch item fails, the item's `status` is set to `FAILED` and the `GET /batch/:id/results` response includes:

```json
{
  "item_index": 7,
  "external_id": "client_007",
  "label": "Pedro Reyes — AY2025",
  "status": "FAILED",
  "computation_id": null,
  "error_code": "ERR_VALIDATION_FAILED",
  "error_message": "3 validation errors in item input.",
  "error_details": [
    {
      "field": "gross_receipts",
      "code": "ERR_GROSS_RECEIPTS_NEGATIVE",
      "message": "gross_receipts must be ≥ 0.00. Received: -5000.00"
    },
    {
      "field": "tax_year",
      "code": "ERR_TAX_YEAR_OUT_OF_RANGE",
      "message": "tax_year must be between 2018 and 2030. Received: 2031"
    },
    {
      "field": "itemized_expenses.bad_debts",
      "code": "ERR_BAD_DEBTS_CASH_BASIS",
      "message": "bad_debts must be 0.00 when is_accrual_basis is false. Received: 50000.00"
    }
  ]
}
```

**Error codes in batch items:** All error codes from `engine/error-states.md` are applicable. The collect-all mode is used (all validation errors for an item are reported, not just the first).

**Batch item error summary:** The `GET /batch/:id` response includes `failed_items` count. The `GET /batch/:id/results` response can be filtered by `status_filter=FAILED` to retrieve only failed items for review and correction.

### 3.5 Result Retention and Cleanup

**Batch job retention:** Batch jobs and their results are retained for 30 days from `completed_at`. After 30 days, a scheduled cleanup job deletes the `batch_jobs` and `batch_job_items` rows.

**Computation persistence:** Computations created by successful batch items (`status == 'SUCCESS'`) are saved to the `computations` table under the submitting user's account. These computations are NOT deleted when the batch job expires — they follow the normal computation retention policy (retained until user account is deleted).

**Pre-expiry behavior:** If a user attempts `GET /batch/:id/results` on an expired batch, the response is `404 ERR_NOT_FOUND` with message: "This batch job has expired (30-day retention limit). Batch results are no longer available. However, the individual computations created from this batch remain in your computation history."

### 3.6 Webhook Notifications for Batch Completion

When a batch job reaches `COMPLETE` or `PARTIAL_FAILURE` status, the system fires a webhook notification to any registered webhook endpoint for the `batch.completed` event.

**Webhook event name:** `batch.completed`

**Webhook payload:**

```json
{
  "event": "batch.completed",
  "timestamp": "2026-03-02T14:45:00.000Z",
  "batch_id": "batch_uuid_here",
  "status": "PARTIAL_FAILURE",
  "total_items": 50,
  "completed_items": 49,
  "failed_items": 1,
  "queued_at": "2026-03-02T14:30:00.000Z",
  "started_at": "2026-03-02T14:30:05.000Z",
  "completed_at": "2026-03-02T14:45:00.000Z",
  "results_url": "https://api.taxoptimizer.ph/v1/batch/batch_uuid_here/results"
}
```

**Webhook registration:** Via `POST /webhooks` (see [api/endpoints.md §14](../api/endpoints.md)). Webhook URL must be HTTPS. A shared secret (HMAC-SHA256) is included in the `X-TaxOptimizer-Signature` header for verification.

**Webhook delivery:** POST to the registered URL with 5-second timeout. Retry on failure: 3 retries with exponential backoff (10s, 30s, 90s). After all retries fail, the webhook delivery is marked failed and the user can retrieve results via polling.

**Signature verification (receiver's responsibility):**
1. Extract raw request body (bytes before JSON parsing).
2. Compute `HMAC-SHA256(raw_body, webhook_secret)`.
3. Compare with `X-TaxOptimizer-Signature` header (hex-encoded). If mismatch, reject as potential forgery.

### 3.7 Batch API Rate Limits and Quotas

| Limit | Value |
|-------|-------|
| Items per batch | Max 50 |
| Concurrent batch jobs per ENTERPRISE account | Max 5 |
| `POST /batch/computations` calls per day | 100 |
| `GET /batch/:id` polling calls per minute | 30 |
| `GET /batch/:id/results` calls per minute | 30 |
| Total batch items processed per day (across all batches) | 2,500 |

**Per-day item quota:** If the sum of all batch items submitted in the current calendar day (midnight to midnight PHT, UTC+8) exceeds 2,500, `POST /batch/computations` returns `429 ERR_DAILY_BATCH_QUOTA_EXCEEDED` with body: `{"error_code": "ERR_DAILY_BATCH_QUOTA_EXCEEDED", "message": "Daily batch item quota exceeded (2,500 items per day). Your quota resets at midnight Philippine Standard Time."}`.

---

## 4. API Key System

### 4.1 Key Generation Algorithm

**Format:** `tax_live_{random}` (production) or `tax_test_{random}` (staging/test environment).

**Random component:** 32 bytes from `crypto.getRandomValues()` (browser Web Crypto API) or `crypto.randomBytes(32)` (Node.js). Encoded as URL-safe base64 (base64url). Result: 43 characters.

**Full key length:** `tax_live_` (9 chars) + 43 chars = 52 characters.

**Examples:**
- Production: `tax_live_ABCDefghIJKLmnopQRSTuvwxYZ0123456789-_abc`
- Staging: `tax_test_ABCDefghIJKLmnopQRSTuvwxYZ0123456789-_abc`

**Storage security:** Only the first 10 characters of the key (`tax_live_A`) are stored in `api_keys.key_prefix` for display. The full raw key is shown to the user exactly ONCE at creation and is never retrievable again. The key is stored in `api_keys.key_hash` as `BLAKE2b-256(raw_key)`, hex-encoded.

**Validation:** On each request using an API key:
1. Extract the full key from `Authorization: ApiKey {key}` header.
2. Compute `BLAKE2b-256(key)`.
3. Look up `api_keys` where `key_hash = {computed_hash}`.
4. If found: check `is_active = true`, `expires_at IS NULL OR expires_at > NOW()`, and that the owning user's subscription is still ENTERPRISE.
5. Load the key's `scopes` array.
6. Check that the required scope for the endpoint is present. If not: `403 ERR_INSUFFICIENT_SCOPE`.

### 4.2 Scope Definitions and Endpoint Access Matrix

Each API key is issued with a subset of the following scopes. A key without a scope cannot access the corresponding endpoints, even if the account has an ENTERPRISE subscription.

| Scope name | Grants access to | Does NOT grant access to |
|-----------|------------------|--------------------------|
| `compute:read` | `GET /compute` (anonymous compute is always available — this scope is for future per-key analytics only; currently `POST /compute` only) | Writing/saving computations |
| `compute:write` | `POST /compute` (anonymous-mode; result NOT saved), `POST /computations` (save to account) | Reading saved computations |
| `computations:read` | `GET /computations`, `GET /computations/:id`, `GET /computations/:id/exports`, `GET /computations/:id/exports/:export_id/download` | Modifying computations |
| `computations:write` | `POST /computations`, `DELETE /computations/:id` | Reading computations (need `computations:read` for that) |
| `pdf:export` | `POST /computations/:id/exports` | None (requires `computations:read` to retrieve export status) |
| `clients:read` | `GET /clients`, `GET /clients/:id`, `GET /clients/:id/computations` | Modifying clients |
| `clients:write` | `POST /clients`, `PATCH /clients/:id`, `DELETE /clients/:id`, `POST /clients/:id/computations` | Reading clients (need `clients:read`) |
| `batch:submit` | `POST /batch/computations` | Reading batch results |
| `batch:read` | `GET /batch/:id`, `GET /batch/:id/results` | Submitting batches |
| `webhooks:manage` | `GET /webhooks`, `POST /webhooks`, `DELETE /webhooks/:id` | None additional |

**Default scopes on key creation (if user does not specify):** `compute:write`, `computations:read`, `computations:write`, `batch:submit`, `batch:read`. The user can customize scopes at creation time via the `scopes` array in `POST /api-keys`.

**Scope validation pseudocode:**
```
function check_scope(api_key, required_scope):
  if required_scope not in api_key.scopes:
    return 403, "ERR_INSUFFICIENT_SCOPE",
      "This API key does not have the '{required_scope}' scope. Reissue a key with the required scope."
  return OK
```

**Combined scope requirement example:** To submit a batch and read the results:
- `batch:submit` for `POST /batch/computations`
- `batch:read` for `GET /batch/:id` and `GET /batch/:id/results`
- `computations:read` to retrieve the computation results stored by the batch

### 4.3 API Key Validation Per-Request

The full validation sequence on every request with `Authorization: ApiKey ...`:

1. Parse header: `Authorization: ApiKey {raw_key}`. If header is malformed (no space, no `ApiKey` prefix): `401 ERR_MALFORMED_AUTHORIZATION_HEADER`.
2. Key format check: must match regex `^tax_(live|test)_[A-Za-z0-9_-]{43}$`. If not: `401 ERR_INVALID_API_KEY`.
3. Hash computation: `BLAKE2b-256(raw_key)` using 32-byte output.
4. Database lookup: `SELECT * FROM api_keys WHERE key_hash = $1 AND is_active = true AND (expires_at IS NULL OR expires_at > NOW())`. If no row: `401 ERR_INVALID_API_KEY` (same error for all failures — do not distinguish "key not found" from "key inactive" to prevent enumeration).
5. User lookup: `SELECT * FROM users WHERE id = api_keys.user_id AND deleted_at IS NULL AND suspended_at IS NULL`. If user not found/deleted/suspended: `401 ERR_ACCOUNT_SUSPENDED`.
6. Subscription check: user's active subscription must be ENTERPRISE. If not: `403 ERR_REQUIRES_ENTERPRISE`.
7. Scope check: see §4.2. If insufficient scope: `403 ERR_INSUFFICIENT_SCOPE`.
8. Rate limit check: apply per-key rate limits from [api/endpoints.md §4](../api/endpoints.md). If exceeded: `429 ERR_RATE_LIMIT_EXCEEDED`.
9. Update `api_keys.last_used_at = NOW()` (async, non-blocking — do not delay response for this).
10. Set request context: `ctx.user_id = api_keys.user_id`, `ctx.auth_method = "API_KEY"`, `ctx.api_key_id = api_keys.id`.

### 4.4 API Key Rate Limits

API key rate limits are independent of the session-auth rate limits. If the same user has both a session and an API key making requests simultaneously, each auth method's limits are tracked independently.

| Rate limit dimension | Value |
|----------------------|-------|
| `POST /compute` per hour per key | 1,000 |
| `POST /compute` per day per key | 10,000 |
| All other endpoints per minute per key | 600 |
| `POST /batch/computations` per day per account (all keys combined) | 100 |
| Batch items per day per account (all keys combined) | 2,500 |

**Shared quota for batch:** The batch item quota (2,500/day) is shared across all API keys and session auth for the same ENTERPRISE account. It is not per-key.

**Rate limit headers:** All responses from API-key-authenticated requests include:
- `X-RateLimit-Limit-Hour: {limit}` — requests per hour for the current endpoint group
- `X-RateLimit-Remaining-Hour: {remaining}` — remaining calls this hour
- `X-RateLimit-Reset-Hour: {unix_timestamp}` — when the hourly window resets
- `X-RateLimit-Limit-Minute: {limit}` — for non-compute endpoints
- `X-RateLimit-Remaining-Minute: {remaining}`
- `X-RateLimit-Reset-Minute: {unix_timestamp}`

### 4.5 API Key Security Rules

1. **Single-display:** Raw key is shown exactly once — in the `POST /api-keys` response field `raw_key`. The `raw_key` field is absent from all subsequent API responses. The only way to get a new raw key is to delete the old key and create a new one.
2. **Revocation:** `DELETE /api-keys/:key_id` immediately sets `is_active = false`. Any in-flight requests using the revoked key that have already passed validation complete normally. Future requests with the revoked key receive `401 ERR_INVALID_API_KEY` within the time it takes for the DB flag to propagate (typically < 100ms with read-your-writes guarantee).
3. **No API-key-can-list-API-keys:** `GET /api-keys` and `POST /api-keys` require session cookie authentication only, never API key auth. This prevents a compromised API key from being used to issue additional keys.
4. **Key prefix display:** Only the `key_prefix` (first 10 chars) is stored and displayed in `GET /api-keys` to help users identify which key is which.
5. **Rollover recommendation:** If a key is suspected compromised, the recommended procedure is: (1) immediately delete the compromised key via `DELETE /api-keys/:key_id`, (2) create a new key via `POST /api-keys`, (3) update all integrations with the new key.
6. **Environment separation:** Keys generated in production have prefix `tax_live_`. Keys generated in staging have prefix `tax_test_`. Production keys cannot be used against the staging API, and vice versa (validated by the API at step 2 of §4.3: production API rejects `tax_test_` prefix).

---

## 5. CPA Client Management

### 5.1 CPA Role Requirement and Acquisition

CPA client management requires BOTH an active ENTERPRISE subscription AND the CPA role (`users.role = 'CPA'`). A user who upgrades to ENTERPRISE without requesting the CPA role can use all other ENTERPRISE features but cannot access `/clients/*` endpoints.

**How to get the CPA role:**
1. Log in as an ENTERPRISE subscriber.
2. Navigate to Account Settings → Professional Role → "Request CPA/Bookkeeper Role".
3. Fill out the role request form (fields: full name, CPA PRC license number, firm name, Philippine address, brief description of practice).
4. Submit via `POST /users/me/request-cpa-role` with the following body:

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `full_name` | string | Yes | Non-empty, max 200 chars |
| `prc_license_number` | string | Yes | Format: 7 digits (e.g., "0123456"). Stored as-is; not validated against PRC database. |
| `firm_name` | string | No | Max 200 chars. Default: empty string. |
| `practice_description` | string | Yes | 20–500 chars |

5. Admin reviews within 1 business day (Philippine Standard Time, Monday–Friday 8am–6pm).
6. Admin approves via admin panel: sets `users.role = 'CPA'`.
7. System sends approval email: "Your CPA role request has been approved. You now have access to CPA Client Management features."
8. If rejected, admin sends email with reason. User may reapply after correcting the issue.

**CPA role check at API level:** `POST /users/me/request-cpa-role` requires ENTERPRISE subscription. Users on FREE or PRO see: `403 ERR_REQUIRES_ENTERPRISE`.

### 5.2 Client Onboarding Flow

A CPA adds clients to their roster by providing the client's registered TaxOptimizer email address. The client must already have a TaxOptimizer account (any tier — FREE, PRO, or ENTERPRISE).

**Invitation flow (client must consent):**

Step 1: CPA calls `POST /clients` with `client_email: "client@example.com"`.

Step 2: Server checks if a TaxOptimizer user with that email exists. If yes, creates a `cpa_clients` row with `consent_status = 'PENDING'` and sends an email to the client:

**Email subject:** "A CPA has requested to manage your TaxOptimizer account"

**Email body (exact):**
> "Hello,
>
> [CPA Full Name] from [Firm Name or 'independent practice'] has requested access to manage your TaxOptimizer PH tax computations as your CPA.
>
> If you authorize this request, your CPA will be able to:
> - View all your saved tax computations
> - Run new tax computations on your behalf
> - Export PDF reports from your computations
> - Add notes to your client profile
>
> Your CPA will NOT be able to:
> - Change your password or account settings
> - View your billing information
> - Delete your TaxOptimizer account
>
> To authorize: [Approve Access] button (links to https://app.taxoptimizer.ph/consent/{consent_token})
> To decline: [Decline] button (links to https://app.taxoptimizer.ph/consent/{consent_token}/decline)
>
> This invitation expires in 7 days. If you did not expect this request, you can safely ignore it.
>
> — The TaxOptimizer PH Team"

Step 3a: Client clicks "Approve Access" → `consent_status = 'APPROVED'`, `GET /clients` now returns this client.

Step 3b: Client clicks "Decline" → `consent_status = 'DECLINED'`, client removed from CPA's roster.

Step 3c: Invitation expires (7 days pass without action) → `consent_status = 'EXPIRED'`, CPA's `POST /clients` call had returned a `202 Accepted` with `consent_status: "PENDING"` at submission time, now this client shows with `consent_status: "EXPIRED"` and is not accessible for computations.

**Note:** The `POST /clients` response returns `202 Accepted` (not `201 Created`) because the client record is only tentative until consent is granted. The `201 Created` response is only returned once consent is approved (via a webhook or re-check of `GET /clients/:id`).

**Bypass option for CPA-owned clients:** If the CPA's client does NOT have a TaxOptimizer account, the CPA may create a "managed-only" client by calling `POST /clients` with `create_unregistered: true`. This creates a minimal client profile without an associated TaxOptimizer user account. These clients cannot log in to view their own computations. Fields for unregistered clients:

| Field | Type | Required |
|-------|------|----------|
| `display_name` | string | Yes |
| `tin` | string | Yes |
| `email` | string | No |
| `phone` | string | No |
| `notes` | string | No |
| `create_unregistered` | boolean | Yes (must be `true`) |

### 5.3 CPA Dashboard Layout

The CPA dashboard is a dedicated section of the web app visible only when `users.role = 'CPA'` and subscription is ENTERPRISE.

**Navigation path:** Dashboard → Professional → Clients

**Client list view:**

```
+----------------------------------------------------------+
| My Clients                                    [+ Add Client] |
+----------------------------------------------------------+
| Search: [_______________________] Sort: [Created: Newest v] |
+----------------------------------------------------------+
| Juan dela Cruz                        juan@example.com  |
| TIN: 234-567-890 | 8 computations | Last: Mar 1, 2026  |
| Notes: Freelance graphic designer                       |
| [View Computations] [New Computation] [Edit] [Remove]   |
+----------------------------------------------------------+
| Maria Santos                        maria@example.com   |
| TIN: 456-789-012 | 3 computations | Last: Feb 28, 2026 |
| Notes: IT consultant, 8% filer                         |
| [View Computations] [New Computation] [Edit] [Remove]   |
+----------------------------------------------------------+
```

**Client detail view (on [View Computations]):**

Shows full computation history for that client, with the same columns as the user's own computation history list:
- Label
- Tax Year
- Filing Period
- Recommended Path
- Tax Due
- Date Created
- Actions: [View] [Export PDF] [Re-run]

The CPA can export PDFs (including white-label PDFs) from this view.

### 5.4 Running a Computation on Behalf of a Client

When a CPA runs a computation for a client, the computation is associated with:
- `computations.user_id = client_user_id` (the client's user ID, not the CPA's)
- A `cpa_client_computations` row: `{ cpa_client_id, computation_id, created_by_cpa_user_id }`

**Access rules:**
- The CPA can view and export this computation.
- The client (if they have a TaxOptimizer account) can also view this computation in their own history.
- Other CPAs cannot view this computation (even if they also have the same client in their roster).

**Computation label for CPA-run computations:** Auto-generated label includes the CPA's name: "Prepared by [CPA Full Name] — {tax_year} {filing_period}"

**API call:** `POST /clients/:client_id/computations` — identical body to `POST /computations` but the computation is saved under the client's `user_id`. See [api/endpoints.md §10.7](../api/endpoints.md).

### 5.5 Client Computation Visibility Rules

| Actor | What they can see |
|-------|------------------|
| CPA | All computations for any client in their roster (created by the CPA or by the client themselves) |
| Client | All their own computations (created by themselves or by their CPA on their behalf) |
| Other CPA (different firm) | Cannot see — even if they also manage the same client, each CPA has their own isolated view of that client's computations |
| Admin | All computations (read-only audit view via admin panel) |

### 5.6 Client Deletion and Data Retention

**Removing a client from CPA's roster:**
- `DELETE /clients/:client_id` deletes the `cpa_clients` row and all `cpa_client_computations` rows for this CPA–client relationship.
- Does NOT delete the computations themselves from the `computations` table.
- The client still has full access to their computations.
- The CPA loses access to the client's computations immediately.

**Client account deletion (client deletes their TaxOptimizer account):**
- The `cpa_clients` row is soft-deleted (set `client_deleted_at = NOW()`).
- The CPA's dashboard no longer shows this client.
- Computations created by the CPA for this client remain in the CPA's exported PDFs (if already exported) but are no longer accessible via the client computations API.

**ENTERPRISE account lapse (CPA's subscription expires):**
- All CPA client management features are suspended (no access to `/clients/*`).
- Client records and computations are NOT deleted.
- If the CPA's ENTERPRISE subscription is renewed within 30 days, full access is restored.
- If not renewed after 30 days, all `cpa_clients` rows are soft-deleted (client relationships removed), but computations remain.

### 5.7 Multi-CPA Collision Rules

The same client (by email) may be in multiple CPAs' rosters simultaneously. Each CPA's view of the client is independent:

| Scenario | Rule |
|----------|------|
| CPA A adds client@example.com | CPA A has client in their roster with their own `notes` |
| CPA B also adds client@example.com | CPA B has the same client in their roster with their own separate `notes` |
| CPA A runs a computation for the client | CPA B cannot see this computation |
| CPA B runs a computation for the client | CPA A cannot see this computation |
| Client views their own history | Client sees all computations: those from CPA A, those from CPA B, and their own direct computations |
| CPA A deletes the client from their roster | Client is still in CPA B's roster unaffected |
| Client withdraws consent for CPA A | `cpa_clients.consent_status = 'WITHDRAWN'`; CPA A loses access; CPA B unaffected |

**Consent withdrawal by client:** Client can revoke a CPA's access at any time via Account Settings → Professional Access → "Revoke CPA Access" → select CPA by name → confirm. This calls `PATCH /users/me/cpa-consent/{consent_token}` with `{ "action": "REVOKE" }` and sets `consent_status = 'WITHDRAWN'`. The CPA receives an email notification: "Your client [client display name] has revoked your CPA access to their TaxOptimizer account."

---

## 6. Priority Support SLA

### 6.1 Contact Channels

| Tier | Support Channel | Expected Response |
|------|----------------|-------------------|
| FREE | In-app help widget (FreshDesk ticketing) | 3 business days |
| PRO | In-app help widget (FreshDesk ticketing) | 2 business days |
| ENTERPRISE | In-app help widget + dedicated email: enterprise@taxoptimizer.ph | 1 business day |

**Business day definition:** Monday through Friday, 8:00 AM to 6:00 PM Philippine Standard Time (UTC+8). Philippine national holidays are excluded (see Holiday list §6.4).

### 6.2 SLA Details

| Property | Value |
|----------|-------|
| ENTERPRISE initial response SLA | 1 business day from ticket receipt |
| PRO initial response SLA | 2 business days from ticket receipt |
| FREE initial response SLA | 3 business days from ticket receipt |
| ENTERPRISE resolution target | 3 business days for standard issues; 5 business days for complex issues |
| ENTERPRISE critical issue escalation | Issues blocking tax filing (BIR deadline within 48 hours): response within 2 hours on business days |
| Scheduled 30-minute call | Available for ENTERPRISE on request via enterprise@taxoptimizer.ph. Scheduling within 2 business days. Conducted via Google Meet. |
| SLA credit | No SLA credits are issued for missed response times. The SLA is a best-effort commitment, not a contractual guarantee. |

### 6.3 Support Ticket Priority Matrix

| Issue Type | Priority | Expected Response |
|-----------|----------|------------------|
| Computation result appears incorrect | High | ENTERPRISE: 1 BD; PRO: 2 BD |
| Cannot log in / authentication issue | High | ENTERPRISE: 1 BD; PRO: 2 BD |
| PDF export fails | Medium | ENTERPRISE: 1 BD; PRO: 2 BD |
| Batch job stuck in PROCESSING | High | ENTERPRISE: 1 BD; PRO: not applicable |
| API key not working | High | ENTERPRISE: 1 BD |
| Billing / payment issue | Medium | ENTERPRISE: 1 BD; PRO: 2 BD |
| Feature request | Low | Logged in product backlog; no response SLA |
| Tax law question (not product question) | Not supported | Users directed to consult a licensed CPA |

### 6.4 Philippine Public Holidays (2026) — Support Excluded Days

| Date | Holiday |
|------|---------|
| January 1 | New Year's Day |
| January 29 | Chinese New Year (tentative, per proclamation) |
| April 2 | Maundy Thursday |
| April 3 | Good Friday |
| April 4 | Black Saturday |
| April 9 | Araw ng Kagitingan (Day of Valor) |
| May 1 | Labor Day |
| June 12 | Independence Day |
| August 21 | Ninoy Aquino Day |
| August 31 | National Heroes Day |
| November 1 | All Saints' Day |
| November 2 | All Souls' Day |
| November 30 | Bonifacio Day |
| December 8 | Feast of the Immaculate Conception |
| December 25 | Christmas Day |
| December 30 | Rizal Day |
| December 31 | New Year's Eve (special non-working holiday) |

If a ticket is received on a holiday, the SLA clock starts on the next business day.

### 6.5 Escalation Path for ENTERPRISE

1. **Standard ticket:** Email to enterprise@taxoptimizer.ph or in-app widget. Assigned to support tier 1 within 1 BD.
2. **Unresolved after 2 BD:** User or support tier 1 escalates to engineering team via internal Slack channel `#support-enterprise-escalation`. Engineering reviews within 4 hours on the next business day.
3. **Critical filing deadline escalation:** Email to enterprise@taxoptimizer.ph with subject prefix "[URGENT]". Support monitors this inbox every 2 hours on business days. Response within 2 hours.
4. **Unresolved after 5 BD:** Support manager reviews and contacts user directly to schedule a call.

---

## 7. Professional Features Invariants

| Code | Invariant | Enforcement |
|------|-----------|-------------|
| PF-INV-01 | A user must have `plan = 'ENTERPRISE'` to access any `/clients/*`, `/batch/*`, or `/api-keys/*` endpoint. No exceptions. | API gate check §1.3 |
| PF-INV-02 | CPA client management requires BOTH ENTERPRISE subscription AND `role = 'CPA'`. ENTERPRISE without CPA role returns `403 ERR_REQUIRES_CPA_ROLE`. CPA role without ENTERPRISE returns `403 ERR_REQUIRES_ENTERPRISE`. | API gate check §1.3 |
| PF-INV-03 | A batch job must contain at least 1 item and at most 50 items. If 0 items: `400`. If >50 items: `400`. | API validation |
| PF-INV-04 | A user may have at most 5 concurrently QUEUED or PROCESSING batch jobs. A 6th submission returns `429`. Completed or expired batches do not count toward this limit. | Checked at `POST /batch/computations` |
| PF-INV-05 | A user may have at most 5 active API keys. `POST /api-keys` when 5 exist returns `409 ERR_API_KEY_LIMIT_REACHED`. | Checked at `POST /api-keys` |
| PF-INV-06 | Raw API keys are shown exactly once (at creation). After creation, only `key_prefix` is retrievable. No raw key recovery exists. | Enforced by never storing raw key |
| PF-INV-07 | `GET /api-keys` and `POST /api-keys` require session cookie auth. API keys cannot be used to manage other API keys. | Auth check on those endpoints |
| PF-INV-08 | White-label logo applies to the export, not the account. Each export independently specifies whether to white-label. | Per-export parameter |
| PF-INV-09 | PDF exports with `status = 'FAILED'` cannot be retried automatically. A new `POST /computations/:id/exports` request must be made. | No auto-retry for PDF generation |
| PF-INV-10 | A computation created by a batch item is owned by the ENTERPRISE user who submitted the batch (not a "batch" entity). The computation is a normal `computations` row with the user's `user_id`. | batch_job_items.computation_id references computations |
| PF-INV-11 | Batch results (batch_jobs and batch_job_items rows) expire 30 days after completion. Computations created from batch items do NOT expire with the batch. | Separate retention policies |
| PF-INV-12 | A CPA can only access computations for clients in their own roster. Cross-CPA access to a mutual client's computations is not permitted. | `cpa_client_computations.cpa_user_id` check |
| PF-INV-13 | FORM_1701A_PREFILL export is incompatible with mixed-income taxpayer computations and VAT-registered taxpayer computations. This is validated before the export job is queued. | Synchronous check in `POST /computations/:id/exports` |
| PF-INV-14 | FORM_1701Q_PREFILL export requires `filing_period` to be Q1, Q2, or Q3. ANNUAL period computations cannot use this export type. | Synchronous check in `POST /computations/:id/exports` |
| PF-INV-15 | Downgrading from ENTERPRISE to PRO while there are active (QUEUED/PROCESSING) batch jobs: the batch jobs continue to completion. No new batches can be submitted after downgrade takes effect. | Grace period logic in premium/tiers.md §12 |
| PF-INV-16 | "Powered by TaxOptimizer PH" must appear in the footer of all white-labeled PDF exports. This text cannot be removed by any configuration. | Hard-coded in PDF template |
| PF-INV-17 | API key rate limits are tracked independently from session-auth rate limits for the same user. A user who exhausts their API key hourly limit can still make session-auth requests until that limit is exhausted separately. | Separate Redis keys for session vs API key rate buckets |
| PF-INV-18 | Consent for a CPA to manage a client is required for registered clients. Unregistered clients (created with `create_unregistered: true`) do not require consent. | CPA client onboarding flow §5.2 |
| PF-INV-19 | A client who has revoked CPA consent (`consent_status = 'WITHDRAWN'`) must re-consent via the invitation flow if the CPA attempts to re-add them. The CPA cannot bypass consent by deleting and re-adding the client. | Checked at `POST /clients`: if email matches an WITHDRAWN consent, returns `409 ERR_CONSENT_WITHDRAWN` with message "This client has previously revoked your access. The client must approve a new invitation before access can be restored." |
| PF-INV-20 | The batch daily item quota (2,500/day) is shared across all API keys and session auth for the same ENTERPRISE account. It is not per-key and not per-session. | Quota checked against user_id, not auth method |
