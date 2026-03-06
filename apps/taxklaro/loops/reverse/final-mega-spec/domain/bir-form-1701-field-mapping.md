# BIR Form 1701 — Complete Field Mapping

**Form Version**: January 2018 ENCS (also covers August 2024 ENCS / Form 1701-MS variant; field structure is identical).
**Legal basis**: NIRC Sec. 51, 74-79, RR 8-2018, RA 11976 (EOPT Act).
**Cross-references**: [computation-rules.md](computation-rules.md) | [lookup-tables/graduated-rate-table.md](lookup-tables/graduated-rate-table.md) | [lookup-tables/eight-percent-option-rules.md](lookup-tables/eight-percent-option-rules.md) | [lookup-tables/itemized-deductions.md](lookup-tables/itemized-deductions.md) | [decision-trees.md](decision-trees.md)

---

## Overview

Form 1701 is the annual income tax return for:
- Individuals earning income from trade, business, or practice of profession (including purely SE individuals who use **itemized deductions** — those using OSD or 8% file Form 1701A instead)
- **Mixed income earners**: any individual who has BOTH compensation income (employer-sourced) and business/professional income
- Estates and Trusts

**Who does NOT file 1701**: purely compensation earners (Form 1700); purely SE taxpayers using OSD or 8% (Form 1701A).

**Filing deadline**: April 15 following the close of the taxable year. Two-installment option available if tax due > ₱2,000 (second installment October 15).

**Form structure**: 4 pages.
- Page 1: Header, Top Section, Part I (taxpayer background), Part II (tax payable summary), Part III (payment details)
- Page 2: Part IV (spouse info + Schedule 1 + Schedule 2)
- Pages 3–4: Schedules 3A, 3B, 4, 5, 6, Part V, Part VI

---

## Mapping Legend

| Symbol | Meaning |
|--------|---------|
| **USER** | Direct user input — no computation |
| **COMP** | Computed by engine — formula in referenced CR |
| **XFER** | Transferred verbatim from another schedule/form |
| **CONST** | Fixed constant value |
| **COND** | Conditionally populated (condition stated) |

---

## PAGE 1

### HEADER (BIR Use Only — Engine Output: leave blank on pre-filled return)

| Field | Source | Notes |
|-------|--------|-------|
| BCS/Item | BIR internal | Document control number assigned by BIR upon filing — not populated by engine |
| DLN (Document Locator Number) | BIR internal | Assigned at acceptance — not populated by engine |
| PSIC | BIR internal | Philippine Standard Industrial Classification code — not populated by engine |

---

### TOP SECTION (Return Metadata)

| Item | Field Name | Source | Engine Rule | Validation |
|------|-----------|--------|------------|-----------|
| 1 | For the Year (MM/YYYY) | **USER** | User-selected taxable year end date | Must be a valid calendar or fiscal year end. Format MM/YYYY. For 2025 calendar year: 12/2025. |
| 2 | Amended Return? | **USER** | Checkbox: Yes or No | If Yes, Item 10 in Part VI (Tax Paid in Return Previously Filed) must be populated with the prior payment amount. |
| 3 | Short Period Return? | **USER** | Checkbox: Yes or No | If Yes, the taxable year covers fewer than 12 months. Trigger: newly registered mid-year, or fiscal year change. The engine does NOT prorate the ₱250,000 bracket — it applies in full. See CR-047 (first-year/mid-year registrant). |

---

### PART I — Background Information on Taxpayer/Filer

| Item | Field Name | Source | Engine Rule | Validation / Notes |
|------|-----------|--------|------------|-------------------|
| 4 | TIN (Taxpayer/Filer) | **USER** | User-provided 12-digit TIN (9-digit base + 3-digit branch; branch = 000 for individuals) | Must be 12 digits. If taxpayer has no TIN, they must file Form 1901/1905 first — engine shows error, cannot proceed. |
| 4B | TIN (Spouse) | **USER** (COND) | Populated only if Item 18 = Joint Filing | Same TIN format validation. |
| 5 | RDO Code | **USER** | 3-digit Revenue District Office code where taxpayer is registered per BIR Form 2303/1901 | Must be a valid 3-digit code (001–150+ range). Engine does not validate specific RDO existence — user-entered. |
| 6 | Line of Business / Occupation | **USER** | Free text — nature of trade, profession, or business | Max 100 characters. Engine pre-fills suggested value based on user-selected `TaxpayerProfile.occupation_category`. |
| 7 | ATC (Alphanumeric Tax Code) | **COMP** | Derived from regime selection (Item 21) and income type | See ATC determination table below. |
| 8 | Taxpayer/Filer Type | **USER** | Single Proprietor \| Professional \| Estate \| Trust | Freelancers and self-employed professionals select "Professional". Registered business owners select "Single Proprietor". |
| 9 | Taxpayer's Name | **USER** | Last Name, First Name, Middle Name — must match BIR registration | As registered on BIR Form 1901/1905/2303. |
| 10 | Trade Name / Registered Name | **USER** | Business trade name if registered (e.g., "John Doe IT Solutions") | Optional. Leave blank if sole proprietor with no trade name. |
| 11 | Registered Address | **USER** | Full registered address as on BIR Form 2303 | Address Line 1, Address Line 2, City/Municipality, Province, Zip Code. If different from current address, taxpayer must update via BIR Form 1905 before filing. |
| 12 | Date of Birth | **USER** | MM/DD/YYYY format | Must be a valid calendar date. Used for age verification only (no tax computation dependency in current engine scope). |
| 13 | Contact Number | **USER** | Phone or mobile number | Format: 10-digit mobile (09XXXXXXXXX) or landline with area code. |
| 14 | Email Address | **USER** | Email for BIR correspondence | Standard email format validation. |
| 15 | Civil Status | **USER** | Single \| Married \| Legally Separated \| Widow/Widower | Affects joint filing availability. |
| 16 | If Married: Does spouse have income? | **USER** (COND) | Yes \| No | Only displayed if Item 15 = Married. If Yes, spouse background fields (Part IV) must be completed. |
| 17 | Citizenship | **USER** | Resident Citizen \| Non-Resident Citizen \| Resident Alien \| Non-Resident Alien Engaged in Trade/Business \| Non-Resident Alien Not Engaged in Trade/Business | Engine scope covers Resident Citizens only. Non-resident and alien cases trigger MRF (see manual-review-flags.md MRF-016, MRF-017). |
| 18 | Filing Status | **USER** | Separate Filing \| Joint Filing | Joint filing only available if both spouses have income. Form 1701 has two columns (A = taxpayer, B = spouse) when joint. Engine computes each column separately. |
| 19 | Income EXEMPT from Income Tax? | **USER** | Yes \| No | If Yes, user must state nature and legal basis. Engine flags for manual review — exemptions (e.g., BMBE registration) are out of engine scope. |
| 20 | Income subject to SPECIAL/PREFERENTIAL RATE? | **USER** | Yes \| No | If Yes, Part X (Consolidation of ALL Activities per Tax Regime) must be completed. Engine does not compute special rates (e.g., capital gains tax on shares, real property transactions) — flags for manual review. |
| 21 | Tax Rate for Business/Profession Income | **COMP** | Derived from user's regime election input (`TaxInput.regime_elected`) | ☐ Graduated Rates (Sec. 24(A)) — selected when Path A or Path B is recommended and elected  ☐ 8% Flat Rate (Sec. 24(A)(2)(b)) — selected only if `gross_receipts ≤ 3,000,000` AND taxpayer is not VAT-registered AND not a mixed-income employee |
| 21A | Method of Deduction | **COMP** (COND) | Only populated if Item 21 = Graduated Rates | ☐ Itemized Deduction (Sec. 34(A)-(J)) — elected when Path A  ☐ OSD (40%) — elected when Path B  For 8% filers: this item is left blank (8% has no deduction method — the ₱250,000 reduction is not a "deduction method"). |

**ATC Determination Table** (Item 7 engine computation):

| Income Type | Regime | Form | ATC |
|-------------|--------|------|-----|
| Business income only | Graduated (itemized or OSD) | 1701 | II012 |
| Professional income only | Graduated (itemized or OSD) | 1701 | II014 |
| Business income only | 8% | 1701 | II015 |
| Professional income only | 8% | 1701 | II017 |
| Mixed income (comp + business) | Graduated (itemized or OSD) | 1701 | II013 |
| Mixed income (comp + business) | 8% for business portion | 1701 | II016 |
| Compensation income only | Any | 1700 | II011 (not filed on 1701) |

Note: If taxpayer is purely SE with OSD or 8%, they file Form 1701A, not 1701 — these ATCs (II012, II014, II015, II017) appear on 1701A for those filers. On Form 1701, these ATCs apply to purely-SE taxpayers using **itemized deductions**, and to mixed-income earners.

---

### PART II — Total Tax Payable

All monetary fields: drop centavos ≤ 49; round up at 50+. Two columns: Column A (Taxpayer/Filer), Column B (Spouse, if joint filing).

| Item | Field Name | Source | Engine Rule | Notes |
|------|-----------|--------|------------|-------|
| 22 | Tax Due | **XFER** from Part V, Item 5 | `annual_result.income_tax_due` | Total income tax due before any credits or payments. |
| 23 | Less: Total Tax Credits/Payments | **XFER** from Part VI (Total Tax Credits/Payments) | `annual_result.total_credits` | Sum of all prepaid taxes, quarterly payments, CWT. |
| 24 | Tax Payable/(Overpayment) | **COMP** | `Item_22 − Item_23` | Positive = balance due; negative = overpayment. |
| 25 | Less: Portion for 2nd Installment | **USER** (COND) | User-entered; max = floor(Item_22 × 0.50) | Only available if Item 22 > ₱2,000 AND taxpayer elects installment payment. Second installment due October 15. |
| 26 | Amount of Tax Payable/(Overpayment) | **COMP** | `Item_24 − Item_25` | Amount payable April 15. |
| 26a | Overpayment Election | **USER** (COND) | Mark ONE: ☐ Refund ☐ Tax Credit Certificate ☐ Carry Over | Only if Item 24 < 0. Irrevocable once filed. Engine default recommendation: Carry Over (to avoid refund processing delay). |
| 27 | Surcharge | **COMP** (COND) | CR-016 / CR-020 | 25% of Item 22 if filed/paid late without fraud. 50% if fraudulent return. 10% for MICRO/SMALL taxpayers under EOPT. Zero if filed on time. |
| 28 | Interest | **COMP** (COND) | CR-017: `(Item_22 × rate) × (days_late / 365)` | 12% per annum for MEDIUM/LARGE; 6% per annum for MICRO/SMALL (EOPT). Days counted from April 15 to actual payment date. Zero if paid on time. |
| 29 | Compromise | **COMP** (COND) | CR-020: compromise penalty lookup table per RMO 7-2015 | BIR-assessed compromise penalty based on tax-due bracket. Zero if filed on time. |
| 30 | Total Penalties | **COMP** | `Item_27 + Item_28 + Item_29` | Sum of all three penalty components. |
| 31 | Total Amount Payable/(Overpayment) | **COMP** | `Item_26 + Item_30` | Final amount due (or receivable if overpaid). |
| 32 | Aggregate Amount Payable/(Overpayment) | **COMP** (COND) | `Item_31_ColA + Item_31_ColB` | Only for joint filers: combined amount for both taxpayer and spouse. Single filers: this equals Item 31. |

---

### PART III — Details of Payment

These fields are populated by the user at the time of payment. The engine pre-fills them based on `PaymentSummary` struct (see CR-041, filing-deadlines.md Part 12).

| Item | Field Name | Source | Notes |
|------|-----------|--------|-------|
| 33 | Name of Bank / Agency | **USER** | Name of Authorized Agent Bank (AAB) or Revenue Collection Officer (RCO). Engine suggests nearest AAB based on user's RDO Code. |
| 34 | Cash/Bank Debit Memo | **USER** | Date and amount of cash payment or bank debit memo. Format: MM/DD/YYYY; amount in full pesos. |
| 35 | Check | **USER** | Check number, drawee bank name, check date (MM/DD/YYYY), check amount. |
| 36 | Tax Debit Memo | **USER** | TDM reference number, date issued (MM/DD/YYYY), amount approved. Requires prior BIR approval of TDM before it can be applied. |
| 37 | Others | **USER** | E-payment reference (GCash, PayMaya, UnionBank, LBP, DBP, PayMongo), transaction reference number, date, and amount. Engine suggests this field when `PaymentSummary.recommended_channel = GCASH` or `MAYA`. |
| Machine Validation | BIR stamp | BIR internal | Revenue Official Receipt details stamped by BIR if filed OTC at RDO. Not populated by engine. |

---

## PAGE 2

### PART IV — Background Information of Spouse

Only populated if Civil Status = Married AND Item 18 = Joint Filing OR Item 16 = Yes.

| Item | Field Name | Source | Notes |
|------|-----------|--------|-------|
| IV-1 | Spouse's TIN | **USER** | Same 12-digit TIN format. |
| IV-2 | Spouse's RDO Code | **USER** | 3-digit code for spouse's registered RDO. |
| IV-3 | Spouse's Taxpayer/Filer Type | **USER** | Single Proprietor \| Professional \| Compensation Earner |
| IV-4 | Spouse's ATC | **COMP** | Same ATC determination logic as Item 7, applied to spouse's income type and regime election. |
| IV-5 | Spouse's Name | **USER** | Last Name, First Name, Middle Name. |
| IV-6 | Spouse's Contact Number | **USER** | Phone or mobile number. |
| IV-7 | Spouse's Line of Business / Occupation | **USER** | Nature of spouse's trade or profession. |
| IV-8 | Spouse's Date of Birth | **USER** | MM/DD/YYYY. |
| IV-9 | Spouse's Citizenship | **USER** | Same options as Item 17. |
| IV-10 | Spouse's Income EXEMPT? | **USER** | Yes \| No |
| IV-11 | Spouse's Income Subject to Special Rate? | **USER** | Yes \| No |
| IV-12 | Spouse's Tax Rate | **COMP** | ☐ Graduated \| ☐ 8% (same eligibility rules as primary taxpayer's Item 21) |
| IV-12A | Spouse's Method of Deduction | **COMP** (COND) | ☐ Itemized \| ☐ OSD — only if Item IV-12 = Graduated |

---

### SCHEDULE 1 — Employer Information and Compensation Income

Only for mixed income earners (taxpayers with any compensation income). Skip entirely if purely business/professional.

Columns per employer row: (A) Name of Employer, (B) Employer TIN, (C) Gross Compensation Income, (D) Non-Taxable Compensation, (E) Taxable Compensation, (F) Tax Withheld.

| Row | Source | Engine Rule |
|-----|--------|------------|
| Item 1 — First Employer | **USER** | Data from BIR Form 2316 received from first employer. All columns A-F populated from Form 2316. See CR-030 for compensation income components. |
| Item 2 — Second/Other Employer(s) | **USER** (COND) | Repeat row for each additional employer (if taxpayer changed jobs during the year). Multiple Form 2316s must be aggregated. See CR-030 multiple-employer aggregation function. |
| Item 3A — Totals (Taxpayer) | **COMP** | Sum of all employer rows for taxpayer: `Σ(Gross Comp)`, `Σ(Non-Taxable Comp)`, `Σ(Taxable Comp)`, `Σ(Tax Withheld)` |
| Item 3B — Totals (Spouse) | **COMP** (COND) | Same summation for spouse employers, if applicable. |

**Non-Taxable Compensation column** includes (per CR-030):

| Component | Amount |
|-----------|--------|
| SSS employee contribution | Actual amount withheld |
| PhilHealth employee contribution | Actual amount withheld |
| Pag-IBIG (HDMF) employee contribution | Actual amount withheld |
| GSIS contribution (government employees) | Actual amount withheld |
| 13th month pay and other bonuses | Up to ₱90,000 aggregate; excess is taxable |
| De minimis benefits within BIR-prescribed limits | Amounts within limits only; excess is taxable |
| Union dues (bona fide union members) | Actual amount |

---

### SCHEDULE 2 — Taxable Compensation Income

| Item | Field Name | Source | Engine Rule |
|------|-----------|--------|------------|
| 1 | Total Gross Compensation Income | **XFER** from Schedule 1, Item 3A Column C | `compensation_input.gross_compensation` |
| 2 | Less: Non-Taxable Compensation Income | **XFER** from Schedule 1, Item 3A Column D | `compensation_input.non_taxable_compensation` |
| 3 | Taxable Compensation Income | **COMP** | `Item_1 − Item_2` = `compensation_input.taxable_compensation` → feeds into Schedule 3.A Item 12 for mixed income. Also used in CR-029/CR-030 Path A/B/C computations. |
| 4A | Personal Exemption (2018+) | **CONST** | ₱0. TRAIN Law (RA 10963) eliminated personal exemptions effective January 1, 2018. The zero-rated bracket in the graduated rate table provides the equivalent benefit. |
| 4B | Additional Exemption for Dependents (2018+) | **CONST** | ₱0. Also eliminated by TRAIN Law. |

---

## PAGES 3–4

### SCHEDULE 3.A — Taxable Business Income (Graduated Rate — Itemized or OSD)

Fill Items 1–24 if using graduated rates (Path A itemized or Path B OSD). Skip if using 8% (use Schedule 3.B instead).

| Item | Field Name | Source | Engine Rule | Notes |
|------|-----------|--------|------------|-------|
| 1 | Sales/Revenues/Receipts/Fees | **USER** | `business_input.gross_receipts_sales` | Total gross income from business or profession for the full taxable year. For service businesses: total professional fees billed. For merchandise: total gross sales. |
| 2 | Less: Sales Returns, Allowances and Discounts | **USER** | `business_input.sales_returns_discounts` | Reductions from returned goods, price adjustments, trade discounts. Default: ₱0. Engine includes in threshold computation per CR-025. |
| 3 | Net Sales/Revenues/Receipts/Fees | **COMP** | `Item_1 − Item_2` = `business_input.net_sales` | Net receipts after returns and discounts. This is the OSD base for service businesses (Path B). |
| 4 | Less: Cost of Sales/Services | **USER** (COND) | `business_input.cost_of_sales_services` | Direct cost of goods sold (merchandise) or direct cost of services (professional). Required for itemized deduction (Path A). For pure service businesses with no direct cost: ₱0. OSD filers do not need this field (deduction is computed as 40% of Item 3 regardless). |
| 5 | Gross Income from Operation | **COMP** | `Item_3 − Item_4` = `business_input.gross_income_from_operations` | Gross profit from primary business activity. Zero minimum (cannot be negative for this line). |
| 6 | Add: Other Non-Operating Income | **USER** | `business_input.other_non_operating_income` | Dividends (not subject to final tax), interest income (not subject to final tax), gains on property sale, rental income outside primary business, other income. Foreign-sourced non-operating income: resident citizen includes globally, others include Philippine-source only. |
| 7 | Total Gross Income | **COMP** | `Item_5 + Item_6` = `business_input.total_gross_income` | Combined operating + non-operating gross income. |
| 8 | Less: Allowable Deductions | **COMP** | Path A: `total_itemized_deductions` (from Schedule 4 + Schedule 5 totals, per CR-027). Path B: `Item_3 × 0.40` (OSD, per CR-026). | For OSD: deduction amount = net sales × 40%. Schedule 4 not required. For Itemized: transfer total from Schedule 4 + Schedule 5. |
| 9 | Net Income/(Loss) from Business/Profession | **COMP** | `Item_7 − Item_8` | Net taxable income before NOLCO. Can be negative (resulting in a net loss). |
| 10 | Less: NOLCO from Schedule 6 | **USER** (COND) | `nolco_input.nolco_applied_this_year` (from Schedule 6 total, per NOLCO tracking algorithm in lookup-tables/itemized-deductions.md Part 5) | Only available under Path A (itemized deductions). NOT available under OSD or 8%. Maximum 3-year carryover. |
| 11 | Taxable Income/(Loss) from Business/Profession | **COMP** | `Item_9 − Item_10` | Net taxable business income after NOLCO. Can be negative — engine shows as loss, no tax due on business portion. |
| 12 | Add: Taxable Compensation Income | **XFER** (COND) from Schedule 2, Item 3 | `compensation_input.taxable_compensation` | Only for mixed income earners. For purely SE taxpayers: ₱0 / blank. |
| 13 | Total Taxable Income | **COMP** | `Item_11 + Item_12` | Combined business + compensation taxable income. This is the base for the graduated rate table. |
| 14 | Income Tax Due | **COMP** | CR-001 / CR-002: `compute_graduated_tax_schedule2(Item_13)` for tax year 2023+; `compute_graduated_tax_schedule1(Item_13)` for 2018–2022. | Apply graduated rate table (lookup-tables/graduated-rate-table.md) to Item 13. |
| 15 | Less: Tax Withheld on Compensation | **XFER** (COND) from Schedule 1, Item 3A Column F | `compensation_input.tax_withheld_by_employer` | For mixed income earners: EWT withheld by employers per Form 2316. For purely SE: ₱0 / blank. |
| 16 | Tax Due on Business Income | **COMP** | `Item_14 − Item_15` | Net income tax on business/professional portion (after removing employer-withheld tax on compensation). This flows to Part V, Item 2. |
| 17–24 | Additional computations for special situations | **COND** | Items 17–24 cover equity method investments, BMBE exemptions, and other special tax regimes. Engine leaves blank unless user flags special income items. Engine scope does not cover these; flagged for manual review. | Leave blank for standard freelancer/professional filers. |

---

### SCHEDULE 3.B — Taxable Business Income (8% Flat Rate)

Fill Items 25–30 INSTEAD of Items 1–24 above. Only for non-VAT registered taxpayers with gross receipts ≤ ₱3,000,000.

| Item | Field Name | Source | Engine Rule | Notes |
|------|-----------|--------|------------|-------|
| 25 | Sales/Revenues/Receipts/Fees | **USER** | `business_input.gross_receipts_sales` | Same field as Schedule 3.A Item 1. Total gross receipts for the taxable year. No deduction for cost of sales here — 8% applies to gross. |
| 26 | Add: Other Non-Operating Income | **USER** | `business_input.other_non_operating_income` | Other income included in the 8% tax base per RR 8-2018 Sec. 3. Foreign-withheld final tax income (interest, dividends) is EXCLUDED from the 8% base. |
| 27 | Total Gross Sales/Receipts and Other Non-Operating Income | **COMP** | `Item_25 + Item_26` = `path_c_input.gross_receipts_plus_nonop` | This is the combined 8% tax base before the ₱250,000 deduction. This value is also used for the ₱3M eligibility threshold check. |
| 28 | Less: Allowable reduction — ₱250,000 | **COMP** | CR-003 / `determine_250k_deduction()` from eight-percent-option-rules.md Part 5: Returns ₱250,000 if purely SE (no compensation income); returns ₱0 if mixed income earner. | PURELY SELF-EMPLOYED: ₱250,000 deduction. MIXED INCOME: ₱0 (the ₱250,000 is already applied within the graduated rate zero bracket on compensation income — per RMC 50-2018). |
| 29 | Taxable Income/(Loss) at 8% Rate | **COMP** | `Item_27 − Item_28` | The net amount subject to 8%. If purely SE with gross ≤ ₱250,000, this is zero → tax due = ₱0. |
| 30 | Tax Due at 8% | **COMP** | CR-004: `max(0, Item_29) × 0.08` | The flat rate income tax. Flows to Part V, Item 2. Cannot be negative. |

---

### SCHEDULE 4 — Ordinary Allowable Itemized Deductions

Only if Itemized Deductions (Path A) is elected. Skip if OSD or 8%.

| Line | Deduction Category | Source | Engine Rule | Cap / Notes |
|------|--------------------|--------|------------|------------|
| 1 | Amortization | **USER** | `itemized.amortization` | Amortization of intangible assets, pre-operating costs per Sec. 34(B). Requires supporting schedule showing asset, cost, and amortization period. |
| 2 | Bad Debts | **USER** | `itemized.bad_debts` | Specifically identified receivables written off as uncollectible. Cash-basis taxpayers (all freelancers registered under cash basis) cannot claim bad debt deductions — no prior income to recover. See EC-ID10 in edge-cases.md. |
| 3 | Charitable and Other Contributions | **USER** | `itemized.charitable_contributions` | Cap: 5% of `Item_9` (net income before charitable contributions) for individual taxpayers. Full deduction for donations to priority government projects under Sec. 34(H)(2). Requires BIR-accredited donee receipt. |
| 4 | Depletion | **USER** | `itemized.depletion` | Only for natural resource businesses (oil/gas, mineral mines). Most freelancers: ₱0. |
| 5 | Depreciation | **USER** | `itemized.depreciation` | Straight-line, declining balance, or BIR-approved method per Sec. 34(F). Useful life by asset type: see lookup-tables/itemized-deductions.md Part 6. Vehicle ceiling: ₱2,400,000 acquisition cost. |
| 6 | Entertainment, Amusement and Recreation (EAR) | **COMP** | CR-027.2: `min(user_ear_claimed, ear_cap)` where `ear_cap = max(0, net_revenues × 0.01)` for service, `max(0, net_sales × 0.005)` for goods | Cap: 1% of net revenue for service providers; 0.5% of net sales for goods sellers per RR 10-2002. Engine enforces cap automatically. |
| 7 | Fringe Benefits | **USER** | `itemized.fringe_benefits_for_employees` | Deductible if FBT has been paid on the grossed-up amount. Owner cannot deduct their own fringe benefits — only benefits provided to employees. |
| 8 | Interest | **COMP** | CR-027.1 interest arbitrage: `max(0, gross_interest_expense − 0.33 × interest_income_final_taxed)` | Reduction required: 33% of interest income subjected to final tax must be deducted from gross interest expense per Sec. 34(B)(1). Engine computes this automatically. |
| 9 | Losses | **USER** | `itemized.casualty_losses` | Losses from fire, storm, shipwreck, theft, or embezzlement — not compensated by insurance. Net of insurance recovery. Domestic losses only (foreign losses only for resident citizens). |
| 10 | Pension Trusts | **USER** | `itemized.pension_trust_contributions` | Contributions to BIR-approved employee pension fund. Initial past-service cost: 1/10 per year over 10 years. Current service cost: 100% deductible. |
| 11 | Rental | **USER** | `itemized.rent_expense` | Rent for property used in trade/business/profession. Includes office rent, equipment leases, co-working space fees. |
| 12 | Research and Development | **USER** | `itemized.research_development` | R&D costs per Sec. 34(I). Can be expensed immediately or deferred over 60 months. Engine treats as immediate expense unless user flags deferred. |
| 13 | Salaries, Wages and Allowances | **USER** | `itemized.salaries_wages` | Compensation paid to employees (not the business owner's own salary). Sole proprietors cannot deduct their own salary — this line is for employee wages only. |
| 14 | SSS, GSIS, PhilHealth, HDMF Contributions (Employer Portion) | **USER** | `itemized.mandatory_contributions_employer` | Employer's mandatory share of SSS, PhilHealth, Pag-IBIG for employees. Does NOT include owner's own contributions (those belong in compensation expense or are non-deductible personal items). |
| 15 | Taxes and Licenses | **USER** | `itemized.taxes_and_licenses` | Business taxes (percentage tax, local government taxes, license fees, BIR registration). Does NOT include income tax, estate tax, donor's tax, or special assessments against local benefits. Note: The 3% percentage tax (Form 2551Q amounts) is deductible here under Sec. 34(C)(1) per CR-031. |
| 16 | Transportation and Travel | **USER** | `itemized.transportation_travel` | Actual costs for business-purpose transportation and travel. Must be substantiated with official receipts. Personal travel is disallowed. See MRF-009 in manual-review-flags.md. |
| 17a | Janitorial and Messengerial Services | **USER** | `itemized.janitorial_messengerial` | Paid to third-party service providers. |
| 17b | Professional Fees (legal, accounting, consulting) | **USER** | `itemized.professional_fees` | Payments to CPAs, lawyers, consultants, IT service providers. Must have official receipts. |
| 17c | Security Services | **USER** | `itemized.security_services` | Third-party security guard services. |
| 17d | Repair and Maintenance | **USER** | `itemized.repairs_maintenance` | Maintenance of business equipment and facilities. Distinguish from capital improvements (not immediately deductible). |
| 17e | Other Expenses Subject to Withholding | **USER** | `itemized.other_wht_expenses` | Expenses where EWT was required and paid. EOPT Act (RA 11976, effective Jan 1, 2024) removed the withholding-as-prerequisite rule (Sec. 34(K) repealed) — deductibility no longer contingent on withholding. |
| 17f | Other Ordinary Business Expenses | **USER** | `itemized.other_ordinary_expenses` | Catch-all for NIRC Sec. 34(A)(1) ordinary and necessary expenses not enumerated above. Examples: office supplies, internet/phone bills for business use, software subscriptions. Must be substantiated with ORs. |
| **Total** | Total Ordinary Allowable Itemized Deductions | **COMP** | `sum(Lines 1–17f)` = `itemized_input.total_ordinary_itemized` | Transfer to Schedule 3.A, Item 8 (combined with Schedule 5 total). |

---

### SCHEDULE 5 — Special Allowable Itemized Deductions

| Line | Deduction Category | Source | Engine Rule | Cap / Notes |
|------|--------------------|--------|------------|------------|
| 1 | Additional Compensation for Senior Citizen Employees (RA 9994) | **USER** | `special_deductions.senior_citizen_additional_comp` | Additional 15% deduction on top of standard salary deduction for senior citizen employees. Requires documentary proof of senior citizen status (ID). Most freelancers: ₱0. |
| 2 | Additional Compensation for PWD Employees (RA 10524) | **USER** | `special_deductions.pwd_additional_comp` | Additional 25% deduction on top of standard salary for PWD employees. Requires PWD ID and documentation. Most freelancers: ₱0. |
| 3 | Discount Granted to Senior Citizens (RA 9994) | **USER** | `special_deductions.senior_citizen_discount` | 20% mandatory discount given to senior citizens. Deduct the cost of the discount (not lost revenue). Only applicable if taxpayer operates a business subject to mandatory senior citizen discounts (restaurants, hotels, hospitals, transportation, etc.). |
| 4 | Discount Granted to PWDs (RA 10754) | **USER** | `special_deductions.pwd_discount` | 20% mandatory discount given to PWDs. Same structure as senior citizen discount. |
| 5 | Other Special Allowable Deductions | **USER** | `special_deductions.other_special` | Per specific laws (e.g., RA 7277, RA 9257, PEZA/TIEZA incentive legislation). Requires legal citation and supporting documents. |
| **Total** | Total Special Allowable Itemized Deductions | **COMP** | `sum(Lines 1–5)` = `itemized_input.total_special_itemized` | Added to Schedule 4 total for Item 8 of Schedule 3.A: `total_deductions = total_ordinary_itemized + total_special_itemized`. |

---

### SCHEDULE 6 — Computation of Net Operating Loss Carry Over (NOLCO)

Only if claiming NOLCO (Path A, itemized deductions only). Tracks losses from up to 3 prior consecutive years.

| Column | Field Name | Source | Engine Rule |
|--------|-----------|--------|------------|
| A | Taxable Year Incurred | **USER** | The year the net operating loss was recorded. Must be within 3 years of current year. |
| B | Amount of Net Operating Loss | **USER** | The original loss amount for that year (unapplied at start of current year). |
| C | NOLCO Applied in Previous Years | **USER** | Cumulative amount already deducted in prior taxable years from this loss year's balance. |
| D | NOLCO Expired | **COMP** | Portion that has lapsed: a loss year's NOLCO expires if more than 3 taxable years have passed from the year of loss. `nolco_expired = max(0, original_loss − prior_applied)` if `(current_year − loss_year) > 3`. |
| E | NOLCO Applied This Current Year | **COMP** | `nolco_applied_this_year = min(remaining_nolco_balance, current_year_net_income)` where `remaining_nolco_balance = Column_B − Column_C − Column_D`. Applied FIFO (oldest loss year first) per CR-027 NOLCO tracking algorithm. |
| F | Net Operating Loss Balance (Unapplied) | **COMP** | `Column_B − Column_C − Column_D − Column_E` |
| **Total** | Total NOLCO Applied This Year | **COMP** | `Σ(Column_E, all rows)` → transfers to Schedule 3.A, Item 10. |

**NOLCO constraints**:
- Available ONLY under itemized deductions (Path A). NOT available under OSD (Path B) or 8% (Path C).
- Maximum 3 consecutive taxable years from the year the loss was incurred.
- Applied FIFO: oldest loss year consumed first.
- If taxpayer switches from itemized to OSD in a future year, NOLCO balance is suspended (not expired) — it resumes if taxpayer switches back to itemized within the 3-year window.
- See CR-027 NOLCO tracking algorithm and EC-ID05 (NOLCO suspension cross-method) in edge-cases.md.

---

### PART V — Tax Due (Consolidated)

| Item | Field Name | Source | Engine Rule |
|------|-----------|--------|------------|
| V-1 | Total Tax Due on Compensation Income | **COMP** (COND) | `graduated_tax(taxable_compensation)` from Schedule 2. For purely SE taxpayers: ₱0. For mixed income under Path A/B: this line is ZERO because compensation tax is netted against business tax in Schedule 3.A Items 14 and 15. For mixed income under Path C: `graduated_tax(taxable_compensation)` is entered here. |
| V-2 | Total Tax Due on Business Income | **XFER** | From Schedule 3.A Item 16 (graduated paths) OR Schedule 3.B Item 30 (8% path). For graduated+OSD (Path B): Schedule 3.A Item 16. For graduated+itemized (Path A): Schedule 3.A Item 16. For 8% (Path C): Schedule 3.B Item 30. |
| V-3 | Total Tax Due | **COMP** | `Item_V1 + Item_V2` |
| V-4 | Add: Special Tax Due | **COND** | From Part X if taxpayer has activities taxed at special/preferential rates. Zero for standard freelancer/professional filers. |
| V-5 | Total Income Tax Due | **COMP** | `Item_V3 + Item_V4` → transfers to Part II, Item 22. This is `annual_result.income_tax_due`. |

---

### PART VI — Summary of Tax Credits/Payments

| Item | Field Name | Source | Engine Rule | Notes |
|------|-----------|--------|------------|-------|
| VI-1 | Prior Year's Excess Credits | **USER** | `credits_input.prior_year_excess_credits` | Amount from prior year's annual ITR that was elected as Carry Over (not refunded, not TCC). Proof required: copy of prior year ITR showing overpayment. |
| VI-2 | Tax Payments — 1st Quarter (Form 1701Q, Q1) | **USER** | `credits_input.q1_payment` | Amount actually paid with the Q1 1701Q filing (Item 28 net payable from Q1 form, after CWT at that time). Not the cumulative tax due — only the cash paid. |
| VI-3 | Tax Payments — 2nd Quarter (Form 1701Q, Q2) | **USER** | `credits_input.q2_payment` | Amount actually paid with the Q2 1701Q filing. |
| VI-4 | Tax Payments — 3rd Quarter (Form 1701Q, Q3) | **USER** | `credits_input.q3_payment` | Amount actually paid with the Q3 1701Q filing. |
| VI-5 | Creditable Tax Withheld — Q1 (BIR Form 2307) | **USER** | `cwt_input.q1_cwt` | CWT amounts from 2307 certificates issued by clients/platforms covering income received in Q1. Per CR-036: the CURRENT quarter's CWT is distinct from CWT already claimed in prior quarters. |
| VI-6 | Creditable Tax Withheld — Q2 (BIR Form 2307) | **USER** | `cwt_input.q2_cwt` | CWT for Q2 receipts per 2307 certificates. |
| VI-7 | Creditable Tax Withheld — Q3 (BIR Form 2307) | **USER** | `cwt_input.q3_cwt` | CWT for Q3 receipts per 2307 certificates. |
| VI-8 | Creditable Tax Withheld — Q4 (BIR Form 2307) | **USER** | `cwt_input.q4_cwt` | CWT for Q4 receipts (October–December) per 2307 certificates. 1701 annual return is where Q4 CWT is first claimed (no Q4 quarterly return). |
| VI-9 | Tax Withheld on Compensation (BIR Form 2316) | **XFER** (COND) from Schedule 1, Item 3A Column F | `compensation_input.tax_withheld_by_employer` | For mixed income earners only: total EWT withheld by employer(s) per all Form 2316 copies. Already subtracted in Schedule 3.A Item 15 — this is a cross-check field for reconciliation. Purely SE taxpayers: ₱0 / blank. |
| VI-10 | Tax Paid in Return Previously Filed (Amended Returns) | **USER** (COND) | `credits_input.prior_amended_payment` | Only if Item 2 (Top Section) = Amended Return. Enter total tax previously paid on the return being replaced. |
| VI-11 | Foreign Tax Credits | **USER** (COND) | `credits_input.foreign_tax_credits` | Available only to resident citizens with foreign-sourced income taxed by a foreign government. Requires proof of foreign tax paid. Triggers MRF-017 for review. Most domestic freelancers: ₱0. |
| VI-12 | Other Tax Credits/Payments | **USER** (COND) | `credits_input.other_credits` | Approved Tax Debit Memo, BMBE exemption certificate credit, etc. Requires documentary proof. |
| **Total** | Total Tax Credits/Payments | **COMP** | `sum(VI-1 through VI-12)` → transfers to Part II, Item 23. |

---

## REQUIRED ATTACHMENTS — Engine Checklist

The engine generates a required attachments checklist based on the taxpayer's inputs:

| Attachment | Required When | Engine Trigger |
|-----------|--------------|---------------|
| Statement of Management's Responsibility (SMR) | Always for Form 1701 | `always_required = True` |
| Certificate of Independent CPA | Gross quarterly sales > ₱150,000 (i.e., annual gross > ₱600,000 on average) | `business_input.gross_receipts_sales / 4 > 150000` |
| Account Information Form (AIF) and Financial Statements | Gross receipts > ₱150,000/quarter | Same trigger as CPA certificate |
| BIR Form 2304 (Income Payments Not Subjected to Withholding) | Taxpayer has income from clients who did not withhold | `cwt_input.has_non_wht_income = True` |
| BIR Form 2307 copies (CWT certificates) | Any CWT credits claimed (VI-5 through VI-8 > ₱0) | `total_cwt > 0` |
| BIR Form 2316 copies (Employer compensation certificates) | Mixed income earner (Schedule 1 populated) | `is_mixed_income = True` |
| Approved Tax Debit Memo | TDM claimed in Part III Item 36 | `payment.tax_debit_memo > 0` |
| Proof of Prior Year's Excess Credits | VI-1 > ₱0 | `credits_input.prior_year_excess_credits > 0` |
| SAWT (Summary Alphalist of Withholding Tax) | Any CWT credits claimed | `total_cwt > 0` — must be submitted electronically, not just attached |
| Schedule 6 (NOLCO) | NOLCO claimed (Schedule 3.A Item 10 > ₱0) | `nolco_input.nolco_applied_this_year > 0` |

---

## Engine Integration: Form 1701 Population Algorithm

```
function populate_form_1701(
    TaxInput input,
    AnnualITResult annual_result,
    CompensationInput comp_input,
    ItemizedDeductionsInput itemized_input,
    CWTInput cwt_input,
    CreditsInput credits_input,
    PenaltyInput penalty_input
) -> Form1701Output:

    // PART I
    form.item_7_atc = determine_atc(
        is_mixed_income = (comp_input.taxable_compensation > 0),
        income_type = input.taxpayer_type,  // BUSINESS or PROFESSIONAL
        regime = annual_result.recommended_regime
    )
    form.item_21_tax_rate = annual_result.recommended_regime  // GRADUATED or EIGHT_PERCENT
    form.item_21a_method = if annual_result.recommended_regime == GRADUATED:
        annual_result.deduction_method  // ITEMIZED or OSD
    else:
        None

    // SCHEDULE 3.A (Path A or B)
    if annual_result.recommended_regime == GRADUATED:
        form.sch3a_item1 = input.gross_receipts_sales
        form.sch3a_item2 = input.sales_returns_discounts
        form.sch3a_item3 = form.sch3a_item1 - form.sch3a_item2
        form.sch3a_item4 = input.cost_of_sales_services
        form.sch3a_item5 = form.sch3a_item3 - form.sch3a_item4
        form.sch3a_item6 = input.other_non_operating_income
        form.sch3a_item7 = form.sch3a_item5 + form.sch3a_item6
        form.sch3a_item8 = annual_result.deductions_used  // CR-026 or CR-027 total
        form.sch3a_item9 = form.sch3a_item7 - form.sch3a_item8
        form.sch3a_item10 = itemized_input.nolco_applied_this_year  // 0 if OSD
        form.sch3a_item11 = form.sch3a_item9 - form.sch3a_item10
        form.sch3a_item12 = comp_input.taxable_compensation  // 0 if purely SE
        form.sch3a_item13 = form.sch3a_item11 + form.sch3a_item12
        form.sch3a_item14 = compute_graduated_tax(form.sch3a_item13, input.tax_year)
        form.sch3a_item15 = comp_input.tax_withheld_by_employer  // 0 if purely SE
        form.sch3a_item16 = form.sch3a_item14 - form.sch3a_item15

    // SCHEDULE 3.B (Path C — 8%)
    elif annual_result.recommended_regime == EIGHT_PERCENT:
        form.sch3b_item25 = input.gross_receipts_sales
        form.sch3b_item26 = input.other_non_operating_income
        form.sch3b_item27 = form.sch3b_item25 + form.sch3b_item26
        form.sch3b_item28 = determine_250k_deduction(comp_input.taxable_compensation)
        form.sch3b_item29 = max(0, form.sch3b_item27 - form.sch3b_item28)
        form.sch3b_item30 = form.sch3b_item29 * 0.08

    // PART V
    if annual_result.recommended_regime == EIGHT_PERCENT:
        form.partv_item1 = compute_graduated_tax(comp_input.taxable_compensation, input.tax_year)
        form.partv_item2 = form.sch3b_item30
    else:  // GRADUATED
        form.partv_item1 = 0  // Already netted in Schedule 3.A
        form.partv_item2 = form.sch3a_item16
    form.partv_item3 = form.partv_item1 + form.partv_item2
    form.partv_item4 = 0  // no special tax for standard filers
    form.partv_item5 = form.partv_item3 + form.partv_item4

    // PART VI (Tax Credits)
    form.partvi_item1 = credits_input.prior_year_excess_credits
    form.partvi_item2 = credits_input.q1_payment
    form.partvi_item3 = credits_input.q2_payment
    form.partvi_item4 = credits_input.q3_payment
    form.partvi_item5 = cwt_input.q1_cwt
    form.partvi_item6 = cwt_input.q2_cwt
    form.partvi_item7 = cwt_input.q3_cwt
    form.partvi_item8 = cwt_input.q4_cwt
    form.partvi_item9 = comp_input.tax_withheld_by_employer
    form.partvi_item10 = credits_input.prior_amended_payment
    form.partvi_item11 = credits_input.foreign_tax_credits
    form.partvi_item12 = credits_input.other_credits
    form.partvi_total = sum(item1..item12)

    // PART II
    form.item22 = round_pesos(form.partv_item5)
    form.item23 = round_pesos(form.partvi_total)
    form.item24 = form.item22 - form.item23
    form.item26 = form.item24 - form.item25  // item25 = user-entered 2nd installment
    form.item27 = penalty_input.surcharge
    form.item28 = penalty_input.interest
    form.item29 = penalty_input.compromise
    form.item30 = form.item27 + form.item28 + form.item29
    form.item31 = form.item26 + form.item30
    form.item32 = form.item31  // same as item31 for single filers; sum of both columns for joint

    return form
```

---

## Rounding Rules (All Monetary Fields on Form 1701)

Per BIR general instructions (all form versions since ENCS 2018):

| Rule | Application |
|------|------------|
| Drop centavos ≤ 49 | Any field value with centavos: if centavo portion ≤ 0.49, discard (truncate to whole peso) |
| Round up at 50+ | If centavo portion ≥ 0.50, round up to next whole peso |
| Never enter centavos | All monetary fields on the form are whole pesos only |
| Intermediate calculations | Engine maintains full decimal precision through all intermediate steps; only the FINAL value transferred to a form field is rounded |

---

## Form 1701 vs Form 1701A — Selection Rule

| Taxpayer Situation | Required Form |
|-------------------|--------------|
| Purely SE, itemized deductions, graduated rates | **Form 1701** |
| Purely SE, OSD, graduated rates | **Form 1701A** |
| Purely SE, 8% flat rate | **Form 1701A** |
| Mixed income (any compensation + any business) | **Form 1701** (always, regardless of deduction method) |
| Purely compensation income | Form 1700 (out of engine scope) |

Engine decision: `select_annual_form()` in CR-054 (annual reconciliation rules, decision-trees.md DT-04).

---

*See also: [bir-form-1701a-field-mapping.md](bir-form-1701a-field-mapping.md) for Form 1701A field mapping.*
*Last updated: 2026-03-01 (bir-form-1701-field-mapping iteration)*
