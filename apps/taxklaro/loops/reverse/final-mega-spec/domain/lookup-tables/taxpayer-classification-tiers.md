# Lookup Table: Taxpayer Classification Tiers (EOPT Act)

**Legal basis:** RA 11976 (EOPT Act, January 5, 2024); RR 8-2024 (April 12, 2024)
**Effective:** April 27, 2024 (RR 8-2024 effectivity)
**Cross-references:**
- [computation-rules.md](../computation-rules.md) CR-015, CR-016, CR-017, CR-018
- [legal-basis.md](../legal-basis.md) Section 1.4 (EOPT Act provisions)
- [edge-cases.md](../edge-cases.md) EC-T01 through EC-T07

---

## Table 1: Tier Thresholds

| Tier | Gross Sales Lower Bound | Gross Sales Upper Bound | Typical Self-Employed Profile |
|------|------------------------|------------------------|-------------------------------|
| MICRO | ₱0 | ₱2,999,999.99 | Freelancers, VAs, content creators, early-career professionals, solo practitioners |
| SMALL | ₱3,000,000 | ₱19,999,999.99 | Established consultants, professional practices, small sole proprietors |
| MEDIUM | ₱20,000,000 | ₱999,999,999.99 | Professional service firms (rarely individual) |
| LARGE | ₱1,000,000,000 | Unlimited | Not applicable to individual self-employed taxpayers |

**Definition of "gross sales" for tier classification (per RR 8-2024):**
- Total sales/service revenue, net of VAT (exclude VAT portion if VAT-registered)
- Business income ONLY — excludes compensation income from employer-employee relationships
- For mixed-income earners: use business/professional income component only
- Does NOT deduct: cost of goods sold, operating expenses, or any other deduction
- All business lines AGGREGATED if taxpayer has multiple registered businesses

---

## Table 2: Filing Obligations by Tier

| Obligation | MICRO | SMALL | MEDIUM | LARGE |
|-----------|-------|-------|--------|-------|
| **VAT registration required** | NO (below ₱3M threshold) | YES (at or above ₱3M) | YES | YES |
| **Section 116 percentage tax (2551Q)** | YES (if not on 8% option) | NO (pays VAT instead) | NO | NO |
| **8% income tax option available** | YES (if gross ≤ ₱3M) | NO | NO | NO |
| **Annual ITR form — pure business** | 1701A (if OSD or 8%) or 1701 (if itemized) | 1701 (full form) | 1701 | 1701 |
| **Annual ITR form — mixed income** | 1701 | 1701 | 1701 | 1701 |
| **Quarterly ITR (1701Q)** | YES | YES | YES | YES |
| **Audited Financial Statements required** | NO (under ₱3M with OSD) / YES (over ₱3M or itemized with FS needed) | YES (gross > ₱3M) | YES | YES |
| **ITR page maximum (per EOPT mandate)** | 2 pages | 2 pages | No restriction | No restriction |
| **EWT rate applied BY clients to payments** | 5% (if gross receipts ≤ ₱3M prior year) | 10% (if gross receipts > ₱3M) | 10% | 10% |

---

## Table 3: Penalty and Interest Rates by Tier

**Legal basis:** NIRC Section 248 (civil penalties) and Section 249 (interest), as amended by RA 11976 (EOPT Act).

### Civil Penalty (Surcharge) — Section 248

| Violation | MICRO Rate | SMALL Rate | MEDIUM Rate | LARGE Rate |
|-----------|-----------|-----------|------------|-----------|
| Failure to file return | 10% of tax due | 10% of tax due | 25% of tax due | 25% of tax due |
| Failure to pay tax due | 10% of amount not paid | 10% of amount not paid | 25% of amount not paid | 25% of amount not paid |
| Underpayment of tax | 10% of underpayment | 10% of underpayment | 25% of underpayment | 25% of underpayment |
| Failure to file at all (no return submitted) | 10% of tax that should have been paid | 10% | 25% | 25% |
| **Fraud / willful neglect** | **50% of tax due** | **50% of tax due** | **50% of tax due** | **50% of tax due** |
| Wrong venue (filing at wrong RDO/AAB) | **ELIMINATED** (per EOPT) | **ELIMINATED** | **ELIMINATED** | **ELIMINATED** |

**Note on fraud:** The 50% fraud surcharge applies uniformly to ALL tiers — there is no tier-based reduction for fraudulent returns or willful neglect to file.

### Interest on Unpaid Taxes — Section 249

| Taxpayer Tier | Annual Interest Rate | Daily Rate (approx.) |
|---------------|---------------------|----------------------|
| MICRO | 6% per annum | 6% ÷ 365 = 0.016438%/day |
| SMALL | 6% per annum | 0.016438%/day |
| MEDIUM | 12% per annum | 12% ÷ 365 = 0.032877%/day |
| LARGE | 12% per annum | 0.032877%/day |

**Interest computation rules:**
- Interest is SIMPLE (not compounded)
- Interest is computed on the TAX DUE amount only — NOT on the surcharge amount
- Interest accrues from the date the tax was due until the date of payment (inclusive of both dates, or exclusive — BIR practice is to count from deadline to payment date)
- 365-day year used (no adjustment for leap years per BIR practice)

### Information Return Penalties — Section 250

| Tier | Penalty Per Failure to File Information Return | Annual Aggregate Cap |
|------|-----------------------------------------------|----------------------|
| MICRO | ₱500 per failure | ₱12,500 per year |
| SMALL | ₱500 per failure | ₱12,500 per year |
| MEDIUM | ₱1,000 per failure | ₱25,000 per year |
| LARGE | ₱1,000 per failure | ₱25,000 per year |

### Compromise Penalties (Violations of Sections 113, 237, 238 — Invoicing)

| Tier | Compromise Penalty Rate |
|------|------------------------|
| MICRO | 50% of standard BIR compromise penalty schedule |
| SMALL | 50% of standard BIR compromise penalty schedule |
| MEDIUM | 100% of standard BIR compromise penalty schedule |
| LARGE | 100% of standard BIR compromise penalty schedule |

---

## Table 4: Tier Classification Rules and Procedures

| Rule | Detail |
|------|--------|
| **New registrants (first taxable year)** | Default classification: MICRO. Applies until first complete taxable year's gross sales are reported on the annual ITR. |
| **Existing registrants (registered on or before December 31, 2022)** | Classified based on 2022 gross sales. Classification takes effect in the taxable year following RR 8-2024 (i.e., effective for TY2024). |
| **Existing registrants (registered January 1, 2023 or later)** | Classified based on gross sales for the first taxable year of business. |
| **Reclassification by BIR** | BIR must issue WRITTEN NOTIFICATION to the taxpayer before reclassification. |
| **When reclassification takes effect** | The taxable year FOLLOWING the year in which the written BIR notice was received. |
| **Taxpayer-initiated reclassification** | Not permitted. Tier is set by BIR based on gross sales data from filed returns. |
| **Self-declaration for classification** | For years before BIR issues formal classification, taxpayer applies the threshold rules based on their own filed gross sales figures. |
| **Aggregation across business lines** | All business income (from all registered business activities) is AGGREGATED for tier determination. If a taxpayer has a consultancy and a trading business, both are combined. |
| **Mixed income treatment** | Only the BUSINESS/PROFESSIONAL income component is used. Compensation income (from employment) is excluded entirely from the tier calculation. |
| **VAT-registered taxpayers** | Gross sales used for tier classification are NET of VAT (exclude the 12% VAT collected). Use gross sales figure from VAT returns (total sales minus output VAT collected). |

---

## Table 5: Triple Coincidence — The ₱3M Threshold

The ₱3,000,000 figure appears in three independent regulatory contexts, all triggered simultaneously when a freelancer's annual gross exceeds this amount:

| Threshold Context | Below ₱3M | At or Above ₱3M | Legal Basis |
|-------------------|-----------|-----------------|-------------|
| **Taxpayer Tier** | MICRO | SMALL | RA 11976, RR 8-2024 |
| **VAT Registration** | Non-VAT; Section 116 percentage tax (3%) applies | Must register for VAT; 12% output VAT on sales | NIRC Sec. 109(CC), TRAIN |
| **8% Income Tax Option** | Available | NOT available | NIRC Sec. 24(A)(2)(b) |
| **EWT Rate (withheld by clients)** | 5% | 10% | RR 11-2018 |
| **Civil Penalty Rate** | 10% | 10% (if still SMALL) OR 25% (if MEDIUM/LARGE) | RA 11976 |
| **Interest Rate on Unpaid Tax** | 6%/yr | 6%/yr (if SMALL) OR 12%/yr (if MEDIUM/LARGE) | RA 11976 |

**Engine note:** When a user inputs gross receipts of exactly ₱3,000,000, the engine must apply:
- MICRO tier (< ₱3M threshold for tier is EXCLUSIVE; ₱3M exactly falls in SMALL tier — see below)

**CRITICAL BOUNDARY NOTE:**
Per RR 8-2024, MICRO is defined as gross sales "less than ₱3,000,000" — meaning ₱3,000,000 exactly places the taxpayer in the SMALL tier. Per NIRC Sec. 24(A)(2)(b), the 8% option applies if gross receipts "do not exceed ₱3,000,000" — meaning ₱3,000,000 exactly DOES allow the 8% option. This creates a narrow boundary case where a taxpayer with exactly ₱3,000,000 gross is:
- SMALL tier (penalty/interest rules)
- Still 8%-eligible (income tax option)
- Still non-VAT eligible (VAT threshold is "not exceeding ₱3M")

**Resolution for the engine:** Use the following boundary rules:
```
is_micro:          gross_sales < 3_000_000
is_small:          3_000_000 <= gross_sales < 20_000_000
eight_pct_eligible: gross_sales <= 3_000_000   // ₱3M exactly: YES
must_register_vat:  gross_sales > 3_000_000    // ₱3M exactly: NO
```

---

## Table 6: Tier-Specific Filing Simplifications (EOPT Mandate)

| Simplification | MICRO | SMALL | MEDIUM | LARGE |
|----------------|-------|-------|--------|-------|
| **Maximum ITR pages (EOPT mandate)** | 2 pages | 2 pages | No cap | No cap |
| **File-and-pay-anywhere** | YES | YES | YES | YES |
| **Electronic payment accepted** | YES | YES | YES | YES |
| **Annual Registration Fee (₱500 ARF)** | ABOLISHED (all tiers) | ABOLISHED | ABOLISHED | ABOLISHED |
| **Books retention period** | 5 years | 5 years | 5 years | 5 years |
| **Wrong-venue penalty** | None (eliminated) | None (eliminated) | None (eliminated) | None (eliminated) |

---

## Table 7: Filing Deadlines (Uniform Across All Tiers)

**Note:** Filing deadlines are NOT tier-specific. All self-employed taxpayers follow the same schedule regardless of tier.

| Form | Period Covered | Deadline | Notes |
|------|---------------|----------|-------|
| BIR Form 1701Q (Q1) | January–March | May 15 | Cumulative from Jan 1 |
| BIR Form 1701Q (Q2) | January–June (cumulative) | August 15 | Cumulative from Jan 1 |
| BIR Form 1701Q (Q3) | January–September (cumulative) | November 15 | Cumulative from Jan 1 |
| BIR Form 1701 / 1701A (Annual) | January–December | April 15 (following year) | No Q4 quarterly return |
| BIR Form 2551Q (Q1 pct tax) | January–March | April 25 | Non-VAT, non-8% filers only |
| BIR Form 2551Q (Q2 pct tax) | April–June | July 25 | Non-VAT, non-8% filers only |
| BIR Form 2551Q (Q3 pct tax) | July–September | October 25 | Non-VAT, non-8% filers only |
| BIR Form 2551Q (Q4 pct tax) | October–December | January 25 (following year) | Non-VAT, non-8% filers only |

**Installment payment for annual balance (all tiers):**
- If annual balance payable > ₱2,000: First 50% due April 15; Second 50% due July 15
- If annual balance payable ≤ ₱2,000: Full payment due April 15

**Important:** The tool should note if a deadline falls on a weekend or holiday; in that case, the next business day applies. The tool should NOT hardcode dates for future years — instead compute dynamically based on calendar, moving to next business day if the 15th/25th falls on a Saturday, Sunday, or Philippine national holiday.

---

*Source: RA 11976 (EOPT Act), RR 8-2024, NIRC Sec. 248 and 249 as amended*
