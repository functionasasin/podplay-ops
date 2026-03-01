# BIR Form 1701A — Complete Field Mapping

**Form Version**: January 2018 (ENCS). Introduced by TRAIN Law (RA 10963); did not exist before 2018.
**Legal basis**: NIRC Sec. 51, 24(A), 34(L), 74-79, RR 8-2018, RA 11976 (EOPT Act).
**Cross-references**: [computation-rules.md](computation-rules.md) | [lookup-tables/graduated-rate-table.md](lookup-tables/graduated-rate-table.md) | [lookup-tables/eight-percent-option-rules.md](lookup-tables/eight-percent-option-rules.md) | [lookup-tables/osd-breakeven-table.md](lookup-tables/osd-breakeven-table.md) | [decision-trees.md](decision-trees.md) | [bir-form-1701-field-mapping.md](bir-form-1701-field-mapping.md)

---

## Overview

Form 1701A is the **simplified annual income tax return** for individuals who earn **purely** from business or practice of profession (no compensation income), using either:
1. **Graduated income tax rates with Optional Standard Deduction (OSD)** — 40% of gross receipts. Available to both VAT-registered and non-VAT registered taxpayers. (Path B in engine terminology)
2. **8% flat income tax rate in lieu of graduated rates AND percentage tax** — Available only to non-VAT registered taxpayers with gross receipts ≤ ₱3,000,000 for the year. (Path C in engine terminology)

**Who files 1701A** (all three conditions must be true):
- Earning PURELY from business or practice of profession (zero compensation income from any employer)
- Using OSD method (40% of gross receipts) under graduated rates, OR using the 8% flat rate
- NOT using itemized deductions under graduated rates (those filers use Form 1701 instead)

**Who CANNOT file 1701A**:
- Any taxpayer with ANY compensation income from any employer → must file Form 1701
- VAT-registered taxpayers who want the 8% option → VAT-registered are ineligible for 8%; they file 1701A only if using OSD under graduated rates
- Taxpayers using itemized deductions → must file Form 1701
- Mixed-income earners → must file Form 1701 regardless of regime elected for business portion

**Filing deadline**: On or before April 15 of the calendar year following the taxable year. Two-installment option available if tax due > ₱2,000 (second installment: October 15).

**Form structure**: 2 pages only (simplified vs. Form 1701's 4 pages).
- Page 1: Header, Top Section, Part I (taxpayer background), Part II (tax payable summary), Part III (declaration/signature), Part IV (payment details)
- Page 2: Part IV (Computation of Income Tax) with two sub-parts:
  - Part IV-A (Items 36–46): Graduated Rates + OSD computation
  - Part IV-B (Items 47–56): 8% Flat Rate computation
  - Tax Credits/Payments section (Items 57–65): applies to both sub-parts

**Engine form selection rule**: The engine determines which annual form to pre-fill based on `AnnualFormSelector` (see Decision Tree DT-04):
- If `has_compensation_income = true` → Form 1701
- If `has_compensation_income = false` AND elected regime = Path A (Itemized) → Form 1701
- If `has_compensation_income = false` AND elected regime = Path B (OSD) → Form 1701A (Part IV-A)
- If `has_compensation_income = false` AND elected regime = Path C (8%) → Form 1701A (Part IV-B)

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
| BCS/Item | BIR internal | Document control number assigned by BIR upon acceptance — not populated by engine |
| DLN (Document Locator Number) | BIR internal | Assigned at acceptance — not populated by engine |
| PSIC | BIR internal | Philippine Standard Industrial Classification code — not populated by engine |

---

### TOP SECTION (Return Metadata)

| Item | Field Name | Source | Engine Rule | Validation |
|------|-----------|--------|------------|-----------|
| 1 | For the Year (MM/YYYY) | **USER** | User-selected taxable year end date; engine pre-fills based on `TaxInput.taxable_year` | Must be a valid calendar year end. Format MM/YYYY. For 2025 calendar year: 12/2025. Form 1701A supports calendar year only (fiscal year filers use Form 1701). |
| 2 | Amended Return? | **USER** | Checkbox: Yes or No | If Yes, Item 61 (Tax Paid in Return Previously Filed) must be populated with the prior payment amount from the original return being amended. |
| 3 | Short Period Return? | **USER** | Checkbox: Yes or No | If Yes, taxable year covers fewer than 12 months (newly registered mid-year, or cessation of business mid-year). Engine note: The ₱250,000 deduction for 8% filers is NOT prorated — it applies in full even for a short period return. The graduated rate brackets also apply in full without proration. |

---

### PART I — Background Information on Taxpayer/Filer

| Item | Field Name | Source | Engine Rule | Validation / Notes |
|------|-----------|--------|------------|-------------------|
| 4 | TIN | **USER** | User-provided 12-digit TIN (9-digit base + 3-digit branch code; branch = 000 for individuals). Stored as `TaxpayerProfile.tin`. | Must be exactly 12 digits. Format: NNN-NNN-NNN-NNN. If no TIN exists, taxpayer must register via BIR Form 1901 first — engine shows blocking error `ERR-001`. |
| 5 | RDO Code | **USER** | 3-digit Revenue District Office code where taxpayer is registered per BIR Form 2303 (Certificate of Registration). Stored as `TaxpayerProfile.rdo_code`. | Must be 3 numeric digits. Engine does not validate against live RDO registry — user-entered. Engine uses this to suggest nearest payment bank/channel. |
| 6 | Taxpayer Type | **USER** | ☐ Single Proprietor \| ☐ Professional. Stored as `TaxpayerProfile.taxpayer_type`. | Professional: freelancers, consultants, licensed professionals (lawyers, doctors, CPAs, engineers, architects, nurses), online sellers of services. Single Proprietor: registered business owners with trade name. Engine pre-selects based on `TaxpayerProfile.occupation_category`. |
| 7 | ATC (Alphanumeric Tax Code) | **COMP** | Derived from Item 6 (taxpayer type) and Item 19 (tax rate election). See ATC Determination Table below. | Engine auto-fills; user cannot override. |
| 8 | Taxpayer's Name | **USER** | Last Name, First Name, Middle Name — as registered on BIR Form 1901/1905/2303. Stored as `TaxpayerProfile.full_name`. | Must match BIR registration exactly (including middle name). |
| 9 | Registered Address | **USER** | Full address as on BIR Form 2303 (Certificate of Registration). Includes: Address Line 1, Address Line 2, City/Municipality, Province. | If different from current residence, taxpayer must update via BIR Form 1905 before filing. Engine displays warning if address was last verified > 1 year ago. |
| 9A | ZIP Code | **USER** | 4-digit postal code of registered address. | Must be a valid 4-digit Philippine ZIP code. |
| 10 | Line of Business / Occupation | **USER** | Nature of trade, business, or profession (e.g., "Freelance Web Developer", "Consulting Engineer", "Graphic Designer"). | Max 100 characters. Engine pre-fills with suggested description based on `TaxpayerProfile.occupation_category`. |
| 11 | Telephone Number | **USER** | Landline or mobile number for BIR contact. | Format: area code + number for landline (e.g., 02-8XXX-XXXX); 11-digit mobile (09XXXXXXXXX). |
| 12 | Email Address | **USER** | Email address for BIR electronic notices and correspondence. | Standard email format validation (RFC 5322). |
| 13 | Date of Birth | **USER** | Taxpayer's birthdate in MM/DD/YYYY format. Stored as `TaxpayerProfile.date_of_birth`. | Must be a valid calendar date. No tax computation dependency — used for identity verification only. Engine validates that taxpayer is at least 18 years old (minor earners require guardian filing — MRF flag). |
| 14 | Citizenship | **USER** | Select ONE: Resident Citizen \| Non-Resident Citizen \| Resident Alien \| Non-Resident Alien Engaged in Trade/Business \| Non-Resident Alien Not Engaged in Trade/Business. | Engine scope covers Resident Citizens only. Any other selection triggers `MRF-016` (foreign citizen/non-resident) and `MRF-017` (foreign tax credit) — engine flags for professional review and cannot guarantee correctness of output for non-resident filers. |
| 15 | Civil Status | **USER** | ☐ Single \| ☐ Married \| ☐ Legally Separated \| ☐ Widow/Widower | Civil status does NOT affect the 1701A tax computation (no personal exemption since TRAIN Law eliminated them). Captured for records and potential joint filing eligibility check only. |
| 16 | Contact Number | **USER** | Mobile or landline number (duplicate of Item 11 in some form versions; if both appear, they serve the same purpose). | Same format validation as Item 11. If both Items 11 and 16 appear on the printed form, engine populates both from the same stored phone number field. |
| 17 | Income EXEMPT from Income Tax? | **USER** | ☐ Yes \| ☐ No. If Yes, user must specify the nature of exempt income and legal basis. | Engine: if Yes and taxpayer is claiming full exemption (e.g., BMBE-registered, below-threshold cooperative), trigger `MRF-020` (exempt income claim) — engine cannot verify BMBE registration or exemption eligibility. For partial exemption (e.g., foreign-sourced income on certain treaties), trigger `MRF-016`. |
| 18 | Filing Status | **USER** | ☐ Separate Filing \| ☐ Joint Filing | Form 1701A is almost always Separate Filing. Joint Filing on 1701A is technically permitted if both spouses are purely self-employed (no compensation income for either), both use OSD or 8%, and they elect joint filing. In practice, this is rare — most dual-earner couples use Form 1701. Engine default: Separate Filing. If Joint Filing selected: both spouses' data must be entered, and engine computes two columns (A and B). |
| 19 | Tax Rate and Method of Deduction | **COMP** | Derived from engine's regime recommendation and user's confirmed election. Stored as `TaxInput.regime_elected`. Irrevocable for the full taxable year once the Q1 Form 1701Q has been filed with this election. | ☐ **Graduated IT Rates with OSD (40%)** — Sec. 24(A) + Sec. 34(L). Available to both VAT-registered and non-VAT registered taxpayers. Triggers Part IV-A (Items 36–46). ☐ **8% Income Tax Rate** — Sec. 24(A)(2)(b). Available ONLY if: (a) taxpayer is NOT VAT-registered, AND (b) total gross sales/receipts and other non-operating income for the taxable year do NOT exceed ₱3,000,000. Triggers Part IV-B (Items 47–56). **Engine enforcement**: if gross_receipts > ₱3,000,000 OR taxpayer is VAT-registered, the 8% checkbox is disabled and engine forces Path B (OSD/graduated). |

---

### ATC Determination Table (Item 7 — Engine Auto-Fill)

| Taxpayer Type (Item 6) | Regime Elected (Item 19) | ATC Code | Description |
|------------------------|--------------------------|----------|-------------|
| Professional | Graduated Rates + OSD | **II014** | Income from Profession – Graduated IT Rates |
| Single Proprietor | Graduated Rates + OSD | **II012** | Business Income – Graduated IT Rates |
| Professional | 8% Flat Rate | **II017** | Income from Profession – 8% IT Rate |
| Single Proprietor | 8% Flat Rate | **II015** | Business Income – 8% IT Rate |

Note: ATC codes II013 (Mixed Income – Graduated) and II016 (Mixed Income – 8%) do NOT appear on Form 1701A. Those ATCs are on Form 1701 only, which handles compensation income alongside business income.

---

### PART II — Total Tax Payable

All monetary fields: drop centavos ≤ 49 (round down); round up at 50+ centavos.

| Item | Field Name | Source | Engine Rule | Notes |
|------|-----------|--------|------------|-------|
| 20 | Tax Due | **XFER** from Part IV | OSD path: transferred from Item 46 (`annual_result.income_tax_due`). 8% path: transferred from Item 56 (`annual_result.income_tax_due`). | Total income tax due for the year before any credits or prior payments. Must equal engine's `recommended_regime.tax_due`. |
| 21 | Less: Total Tax Credits/Payments | **XFER** from Items 57–64 (Tax Credits section) | `annual_result.total_credits` = sum of Items 57–63 as computed in Tax Credits/Payments section. | Engine pre-computes this from user's quarterly payment records and CWT certificates entered. |
| 22 | Tax Payable/(Overpayment) | **COMP** | `Item_20 − Item_21`. If positive: additional tax due. If negative: overpayment. | Engine stores as `annual_result.balance_payable`. Negative value = taxpayer is owed a refund or credit. |
| 23 | Less: Portion Allowed for 2nd Installment | **USER** (COND) | Available only if Item 20 > ₱2,000 AND taxpayer elects two-installment payment. User enters amount; maximum = `floor(Item_20 × 0.50)`. Second installment due October 15. | Engine enables this field only if `annual_result.income_tax_due > 2000`. If user declines installment, engine sets to ₱0. Engine shows tooltip: "You may pay up to 50% of your Tax Due (₱[X]) by October 15." |
| 24 | Amount of Tax Payable/(Overpayment) (Item 22 Less Item 23) | **COMP** | `Item_22 − Item_23`. This is the amount due on April 15. | If Item 22 is negative (overpayment), Item 23 must be ₱0 (no installment on negative). Item 24 = Item 22 in that case. |
| 24a | Overpayment Election | **USER** (COND) | Mark ONE option (irrevocable once return is filed): ☐ To be Refunded ☐ To be Issued a Tax Credit Certificate (TCC) ☐ To be Carried Over as Tax Credit for Next Year | Only displayed if Item 24 < 0 (overpayment). Engine default recommendation: Carry Over (fastest, avoids refund claim processing which takes 60–120 days at BIR). |
| 25 | Surcharge | **COMP** (COND) | CR-016 / CR-020. 25% of Item 20 if filed/paid late without fraud. 50% if fraudulent return. 10% if taxpayer is classified as MICRO or SMALL under EOPT Act (RA 11976). ₱0 if filed and paid on time (on or before April 15). | Engine computes based on `PaymentSummary.payment_date` vs. deadline (April 15). If payment_date is on or before April 15: surcharge = 0. |
| 26 | Interest | **COMP** (COND) | CR-017: `(Item_20 × annual_rate) × (days_late / 365)`. Annual rate: 12% for MEDIUM/LARGE taxpayers; 6% for MICRO/SMALL taxpayers under EOPT Act. Days late = actual payment date minus April 15 (minimum 1 day if any late). ₱0 if paid on time. | Formula: `interest = (tax_due × rate) × (days_late ÷ 365)`. Example: ₱50,000 tax due, 60 days late, MICRO taxpayer: `50,000 × 0.06 × (60/365) = ₱493.15 → ₱493`. |
| 27 | Compromise | **COMP** (COND) | CR-020: lookup compromise penalty based on tax-due bracket per RMO 7-2015 Annex A. See [lookup-tables/bir-penalty-schedule.md](lookup-tables/bir-penalty-schedule.md) for full bracket table. ₱0 if filed and paid on time. | Engine notes: compromise is BIR-assessed, not self-assessed. Engine shows the scheduled amount as an estimate; actual compromise may differ based on BIR discretion. |
| 28 | Total Penalties | **COMP** | `Item_25 + Item_26 + Item_27` | Sum of surcharge + interest + compromise. ₱0 if no penalties apply. |
| 29 | Total Amount Payable/(Overpayment) | **COMP** | `Item_24 + Item_28` | Final amount owed to BIR (or amount refundable/creditable if Item 24 is negative and Item 28 is ₱0). |

---

### PART III — Declaration / Signature

| Field | Source | Engine Rule | Notes |
|-------|--------|------------|-------|
| Taxpayer/Authorized Agent signature | **USER** | Wet signature (paper) or digital certificate (eFPS). | Signed under penalty of perjury. Engine displays the required declaration text verbatim: "I declare, under the penalties of perjury, that this return has been made in good faith, verified by me, and to the best of my knowledge and belief is true and correct, pursuant to the provisions of the National Internal Revenue Code, as amended, and the regulations issued under authority thereof." |
| Date signed | **USER** | MM/DD/YYYY. | Engine pre-fills with current date. |
| If signed by CPA (authorized agent) | **USER** (COND) | Required if a CPA is filing on behalf of the taxpayer. | Fields: CPA name, CPA TIN, BIR accreditation number, date issued, expiry date, PTR number. All fields mandatory if CPA signs. |
| If signed by Lawyer (authorized agent) | **USER** (COND) | Required if a lawyer is filing on behalf of the taxpayer. | Fields: Lawyer name, Lawyer TIN, Attorney's Roll number, IBP number, MCLE compliance number. All fields mandatory if lawyer signs. |

---

### PART IV — Details of Payment (Page 1, Bottom Section)

These fields are populated when payment is made. Engine pre-fills based on `PaymentSummary` struct.

| Item | Field Name | Source | Engine Rule | Notes |
|------|-----------|--------|------------|-------|
| 30 | Name of Bank / Agency | **USER** | Name of Authorized Agent Bank (AAB) or Revenue Collection Officer (RCO) where tax was paid. | Engine suggests nearest AAB based on user's RDO Code. Common AABs: BPI, BDO, Metrobank, RCBC, PNB, Landbank, DBP. Also accepts "GCash" or "Maya" for e-payment. |
| 31 | Cash/Bank Debit Memo | **USER** | Date (MM/DD/YYYY) and amount of cash payment or bank-to-bank debit memo. | Amount must be in whole pesos (no centavos). Date must be on or before payment deadline. |
| 32 | Check | **USER** | Check number, drawee bank name, check date (MM/DD/YYYY), check amount. | Check date must be on or before payment deadline. Post-dated checks are not accepted for BIR payments. |
| 33 | Tax Debit Memo | **USER** (COND) | TDM reference number, date issued (MM/DD/YYYY), amount applied. | TDM must have prior BIR approval before it can be applied as payment. Engine shows warning if TDM is selected without prior approval confirmation. |
| 34 | Others | **USER** | E-payment reference number, payment channel name, date, and amount. | Accepted channels: GCash (via GBiz), PayMaya (now Maya Business), PayMongo, UnionBank Online, Landbank (NCIP), DBP PayTax. Format: channel name + reference number + date + amount. |
| Machine Validation / Revenue Official Receipt | BIR internal | Not populated by engine. | BIR stamp details applied when taxpayer files OTC at RDO window. For eFPS/eBIRForms electronic filers, the system generates an e-mail acknowledgment receipt instead. |

---

## PAGE 2

### PART IV — Computation of Income Tax

Page 2 contains the actual computation. Two parallel sections: Part IV-A (OSD/graduated, Items 36–46) and Part IV-B (8% rate, Items 47–56). Only ONE section is filled based on Item 19 election.

**Engine rule**: If `TaxInput.regime_elected = PATH_B_OSD`: fill Items 36–46 only, leave Items 47–56 blank.
**Engine rule**: If `TaxInput.regime_elected = PATH_C_8PCT`: fill Items 47–56 only, leave Items 36–46 blank.

---

### PART IV-A — For Graduated Income Tax Rates with OSD — Items 36–46

*(Fill ONLY if Item 19 = Graduated Rates + OSD. Leave blank if 8% rate elected.)*

| Item | Field Name | Source | Engine Rule | Cross-Ref | Notes |
|------|-----------|--------|------------|-----------|-------|
| 36 | Sales/Revenues/Receipts/Fees | **USER** | Total gross income from business or practice of profession for the full taxable year. Stored as `TaxInput.gross_receipts`. | CR-006 | Include ALL receipts: professional fees, service revenues, business sales, retainer fees, commissions, royalties from business. Do NOT include compensation income (that goes on Form 1701, not 1701A). |
| 37 | Less: Sales Returns, Allowances and Discounts | **USER** | Total reductions to gross sales: customer refunds, allowances granted, trade discounts. Stored as `TaxInput.sales_returns`. | CR-006 | Enter ₱0 if none. Most freelancers/professionals have ₱0 here. |
| 38 | Net Sales/Revenues/Receipts/Fees (Item 36 Less Item 37) | **COMP** | `Item_36 − Item_37`. Stored as `intermediate.net_receipts_osd`. | CR-006 | For most freelancers with no returns: Item 38 = Item 36. |
| 39 | Less: Allowable Deduction — Optional Standard Deduction (OSD) at 40% of Item 38 | **COMP** | `Item_38 × 0.40`. Stored as `intermediate.osd_deduction`. | CR-006, CR-013 | OSD requires NO documentation — no receipts, no expense records. The 40% is a flat allowance in lieu of all itemized deductions. For 1701A filers, this is the ONLY deduction available (no NOLCO, no depreciation, no other deductions apply alongside OSD). |
| 40 | Net Income/(Loss) from Business/Profession (Item 38 Less Item 39) | **COMP** | `Item_38 − Item_39 = Item_38 × 0.60`. Stored as `intermediate.net_taxable_income_osd`. | CR-006 | This is always 60% of Net Sales. Cannot be negative under OSD (OSD cannot exceed gross receipts). If Item 38 = ₱0, Item 40 = ₱0 and Item 46 = ₱0. |
| 41 | Add: Other Non-Operating Income — Line 1 | **USER** (COND) | Optional income NOT from primary business/profession. Specify description and amount. | CR-006 | Examples: interest income not subject to final tax, rental income (if not primary business), gain on sale of personal property, foreign-source income (if resident citizen). Enter ₱0 or leave blank if none. |
| 42 | Add: Other Non-Operating Income — Line 2 | **USER** (COND) | Additional row for second type of non-operating income. | CR-006 | Enter ₱0 or leave blank if none. |
| 43 | Add: Other Non-Operating Income — Line 3 | **USER** (COND) | Additional row for third type of non-operating income. | CR-006 | Enter ₱0 or leave blank if none. |
| 44 | Add: Other Non-Operating Income — Line 4 | **USER** (COND) | Additional row for fourth type of non-operating income. | CR-006 | Enter ₱0 or leave blank if none. |
| 45 | Total Taxable Income/(Loss) (Item 40 + Items 41–44) | **COMP** | `Item_40 + Item_41 + Item_42 + Item_43 + Item_44`. Stored as `intermediate.total_taxable_income_osd`. | CR-006 | This is the net taxable income that enters the graduated rate table. For taxpayers with only business income and no non-operating income: Item 45 = Item 40 = Item 38 × 60%. |
| 46 | Tax Due (Item 45 applied to graduated rate table) | **COMP** | Apply TRAIN graduated rate table to Item 45. Use Table 2 (2023 onwards) for taxable years 2023 and later. Formula: `graduated_tax(Item_45)`. Stored as `annual_result.income_tax_due`. Transfer to Part II, Item 20. | CR-001, CR-002 | **Current Table (2023 onwards, per TRAIN Sec. 24(A)(2)(a))**: Not over ₱250,000 → ₱0. Over ₱250,000–₱400,000 → 15% of excess over ₱250,000. Over ₱400,000–₱800,000 → ₱22,500 + 20% of excess over ₱400,000. Over ₱800,000–₱2,000,000 → ₱102,500 + 25% of excess over ₱800,000. Over ₱2,000,000–₱8,000,000 → ₱402,500 + 30% of excess over ₱2,000,000. Over ₱8,000,000 → ₱2,202,500 + 35% of excess over ₱8,000,000. **Historical Table (2018–2022)**: Not over ₱250,000 → ₱0. Over ₱250,000–₱400,000 → 20%. Over ₱400,000–₱800,000 → ₱30,000 + 25%. Over ₱800,000–₱2,000,000 → ₱130,000 + 30%. Over ₱2,000,000–₱8,000,000 → ₱490,000 + 32%. Over ₱8,000,000 → ₱2,410,000 + 35%. Full cross-reference: [lookup-tables/graduated-rate-table.md](lookup-tables/graduated-rate-table.md). |

**Worked Example for Part IV-A** (taxable year 2025):
- Freelance web developer; gross receipts = ₱900,000; no returns; no non-operating income
- Item 36 = ₱900,000
- Item 37 = ₱0
- Item 38 = ₱900,000
- Item 39 = ₱900,000 × 40% = ₱360,000
- Item 40 = ₱900,000 − ₱360,000 = ₱540,000
- Items 41–44 = ₱0
- Item 45 = ₱540,000
- Item 46 = ₱102,500 + (₱540,000 − ₱400,000) × 20% = ₱102,500 + ₱28,000 = ₱130,500

Wait — correcting the bracket: Item 45 = ₱540,000 falls in the ₱400,000–₱800,000 bracket:
- Item 46 = ₱22,500 + (₱540,000 − ₱400,000) × 20% = ₱22,500 + ₱28,000 = **₱50,500**

---

### PART IV-B — For 8% Income Tax Rate — Items 47–56

*(Fill ONLY if Item 19 = 8% Income Tax Rate. Leave blank if OSD/graduated elected.)*
*(ONLY AVAILABLE IF: taxpayer is NOT VAT-registered AND total gross sales/receipts and non-operating income ≤ ₱3,000,000 for the year)*

| Item | Field Name | Source | Engine Rule | Cross-Ref | Notes |
|------|-----------|--------|------------|-----------|-------|
| 47 | Sales/Revenues/Receipts/Fees | **USER** | Total gross receipts from business/profession for the taxable year. Stored as `TaxInput.gross_receipts`. | CR-007, CR-026 | Same as Item 36 (OSD section). Most taxpayers enter the same gross receipts figure in both Part IV-A and Part IV-B, but only ONE part is completed based on Item 19 election. |
| 48 | Less: Sales Returns, Allowances and Discounts | **USER** | Total reductions to gross receipts. Stored as `TaxInput.sales_returns`. | CR-007 | Enter ₱0 if none. |
| 49 | Net Sales/Revenues/Receipts/Fees (Item 47 Less Item 48) | **COMP** | `Item_47 − Item_48`. Stored as `intermediate.net_receipts_8pct`. | CR-007 | For most freelancers: Item 49 = Item 47. |
| 50 | Add: Other Non-Operating Income — Line 1 | **USER** (COND) | Other income NOT from primary business. Specify type and amount. CRITICAL: The 8% rate applies to gross receipts PLUS non-operating income (per RR 8-2018 Sec. 3) — non-operating income is included in the 8% base, unlike OSD where it is added after applying the 40% OSD only to business income. | CR-007, CR-026 | Enter ₱0 or leave blank if none. Common examples: interest on savings not subject to final tax (rare — most bank interest is already subject to 20% final tax), gain on sale of non-business property. |
| 51 | Add: Other Non-Operating Income — Line 2 | **USER** (COND) | Additional row. | CR-007 | Enter ₱0 or leave blank if none. |
| 52 | Add: Other Non-Operating Income — Line 3 | **USER** (COND) | Additional row. | CR-007 | Enter ₱0 or leave blank if none. |
| 53 | Total Gross Sales/Receipts and Other Non-Operating Income (Item 49 + Items 50–52) | **COMP** | `Item_49 + Item_50 + Item_51 + Item_52`. Stored as `intermediate.eight_pct_base_gross`. | CR-007, CR-026 | This is the total base for the 8% eligibility check AND for the tax computation. Engine must verify: `Item_53 ≤ ₱3,000,000`; if Item 53 > ₱3,000,000, the 8% option is disqualified and engine must recompute under Path B (OSD) and alert user. |
| 54 | Less: Allowable Reduction of ₱250,000 | **CONST** | ₱250,000 — statutory deduction for purely self-employed individuals with no compensation income. Stored as `intermediate.eight_pct_exemption = 250000`. | CR-007, CR-026 | This is a FIXED deduction; it does NOT change based on income level, number of months, or taxpayer type. It applies ONLY to purely SE individuals (no compensation income). If the taxpayer had ANY compensation income during the year → must file Form 1701, not 1701A, and the ₱250,000 is NOT deducted (per RMC 50-2018 and CR-029). Note: the graduated rate table's zero-bracket up to ₱250,000 accomplishes the same economic result for OSD/itemized filers — the explicit ₱250,000 deduction in Item 54 achieves parity for 8% filers. |
| 55 | Taxable Income/(Loss) at 8% Rate (Item 53 Less Item 54) | **COMP** | `max(0, Item_53 − Item_54)`. If `Item_53 ≤ ₱250,000`: Item 55 = ₱0, meaning no tax due. Stored as `intermediate.eight_pct_taxable_income`. | CR-007 | If gross receipts ≤ ₱250,000, the 8% yields ₱0 tax. This is effectively the same as Path B (OSD) in this range — the zero-bracket handles it. Engine should note: for gross receipts ≤ ₱250,000, both Path B and Path C yield ₱0 income tax (though Path B still requires percentage tax of 3%, whereas Path C exempts from percentage tax). |
| 56 | Tax Due (Item 55 × 8%) | **COMP** | `Item_55 × 0.08`. Stored as `annual_result.income_tax_due`. Transfer to Part II, Item 20. | CR-007, CR-026 | Formula in full: `Tax Due = max(0, (Total_Gross_Receipts + Non-Operating_Income − ₱250,000)) × 0.08`. **Critical note**: This 8% is in lieu of BOTH the graduated income tax rate AND the 3% percentage tax under Sec. 116. Taxpayers on the 8% option do NOT file BIR Form 2551Q (quarterly percentage tax return) — the 8% rate subsumes it. |

**Worked Example for Part IV-B** (taxable year 2025):
- Freelance web developer; gross receipts = ₱900,000; no returns; no non-operating income; no compensation income
- Item 47 = ₱900,000
- Item 48 = ₱0
- Item 49 = ₱900,000
- Items 50–52 = ₱0
- Item 53 = ₱900,000
- Item 54 = ₱250,000
- Item 55 = ₱900,000 − ₱250,000 = ₱650,000
- Item 56 = ₱650,000 × 8% = **₱52,000**

Comparison: Part IV-A (OSD) yields ₱50,500; Part IV-B (8%) yields ₱52,000. For this taxpayer, Path B (OSD/graduated) is ₱1,500 cheaper. Engine recommends Path B. (This is within the narrow ₱400K–₱437.5K OSD-wins window for net taxable income; see [lookup-tables/osd-breakeven-table.md](lookup-tables/osd-breakeven-table.md).)

---

### TAX CREDITS/PAYMENTS SECTION — Items 57–65

*(Applies to BOTH OSD/graduated filers and 8% rate filers. Fill all applicable items.)*

This section collects all prepaid income taxes and CWT credits to compute the net amount payable or overpayable.

| Item | Field Name | Source | Engine Rule | Cross-Ref | Notes |
|------|-----------|--------|------------|-----------|-------|
| 57 | Prior Year's Excess Credits | **USER** | Overpayment from the immediately preceding taxable year's annual ITR (1701A or 1701) that the taxpayer elected to "Carry Over as Tax Credit for Next Year" (not refunded and not converted to TCC). Stored as `PaymentSummary.prior_year_excess_credits`. | CR-011 | If the prior year return showed an overpayment and taxpayer checked "Carry Over," enter that overpayment amount here. If refunded or TCC issued, enter ₱0. Engine pre-fills if user's prior-year return is stored in the system. |
| 58 | Quarterly Income Tax Payments (BIR Form 1701Q) | **USER** | Total of all quarterly income tax payments made via Form 1701Q for the current taxable year (Q1 + Q2 + Q3 payments only — Q4 is covered by this annual return). Stored as `PaymentSummary.quarterly_payments_total`. | CR-011, CR-015 | Engine pre-fills by summing stored Q1, Q2, and Q3 quarterly payment amounts from user's saved quarterly records. Formula: `quarterly_total = Q1_tax_paid + Q2_tax_paid + Q3_tax_paid`. Note: Q3 payment covers cumulative 9-month liability minus Q1 and Q2 payments. Do NOT include Form 2551Q (percentage tax) payments here — those are separate. |
| 59 | Creditable Tax Withheld (BIR Form 2307) for Q1 to Q3 | **USER** | Total amount of creditable withholding tax (CWT) per BIR Form 2307 certificates received from clients/customers for Q1 (January–March), Q2 (April–June), and Q3 (July–September). Stored as `PaymentSummary.cwt_q1_to_q3`. | CR-010, CR-011 | Engine pre-fills by summing CWT amounts from user's entered 2307 records for Q1–Q3. This is the aggregate CWT reflected on ALL 2307 certificates received during the first nine months, whether or not they were claimed on quarterly 1701Q returns. For quarterly returns, CWT was netted against quarterly tax; this annual line reconciles the total. |
| 60 | Creditable Tax Withheld (BIR Form 2307) for Q4 | **USER** | Total CWT per 2307 certificates received for Q4 (October–December). Stored as `PaymentSummary.cwt_q4`. | CR-010, CR-011 | Separate from Item 59 because Q4 CWT was never credited on a quarterly return (there is no Q4 1701Q filing — the annual return IS the Q4 filing). Engine pre-fills from user's Q4 2307 records. Total annual CWT = Item 59 + Item 60. |
| 61 | Tax Paid in Return Previously Filed (if Amended Return) | **USER** (COND) | Only if Item 2 = Yes (Amended Return). Enter the amount actually paid with the original return being amended. Stored as `PaymentSummary.prior_filing_payment`. | CR-011 | Prevents double-payment. If original return showed ₱30,000 due and was paid, and amended return shows ₱32,000 due, the incremental amount payable is ₱2,000 — achieved by crediting the ₱30,000 already paid. Enter ₱0 if not an amended return. |
| 62 | Foreign Tax Credits | **USER** (COND) | Credit for income taxes paid to foreign governments on income also taxable in the Philippines. Applicable only if taxpayer has foreign-sourced income AND paid income tax abroad AND the Philippines has no tax treaty exempting that income. Stored as `PaymentSummary.foreign_tax_credits`. | CR-011 | For most Form 1701A filers (domestic freelancers serving Philippine clients): enter ₱0. For freelancers serving foreign clients via Upwork/Fiverr with no foreign tax withheld at source: enter ₱0 (service income to Philippine resident from foreign clients is taxable in PH with no offsetting foreign tax). Engine flag: if user enters a non-zero value, trigger `MRF-017` (foreign tax credit) for professional review. |
| 63 | Other Tax Credits/Payments | **USER** (COND) | Any other credit not covered above. Specify the nature and amount. Common examples: Tax Debit Memo (TDM) approved by BIR, excess CWT from merged/consolidated company (not typical for individual filers). Stored as `PaymentSummary.other_credits`. | CR-011 | Most individual filers enter ₱0. Engine shows text field for description if amount > ₱0. |
| 64 | Total Tax Credits/Payments (Sum of Items 57 through 63) | **COMP** | `Item_57 + Item_58 + Item_59 + Item_60 + Item_61 + Item_62 + Item_63`. Transfer to Part II, Item 21. Stored as `annual_result.total_credits`. | CR-011 | Engine validation: `total_credits` must be ≥ 0. Cannot be negative. Engine alert if `total_credits > Item_20 × 2` (implausibly large credits — likely data entry error). |
| 65 | Tax Payable/(Overpayment) (Item 20 Less Item 64) | **COMP** | `Item_20 − Item_64`. Transfer to Part II, Item 22. Stored as `annual_result.balance_payable`. | CR-011 | This is auto-computed verification. Note: Item 65 and Part II Item 22 must be identical. If there is any discrepancy, engine flags as error `ERR-023` (balance mismatch between Page 2 computation and Part II summary). |

---

## REQUIRED ATTACHMENTS

| # | Document | When Required | Engine Behavior |
|---|----------|--------------|----------------|
| 1 | **SAWT** (Summary Alphalist of Withholding Tax) | Always required if any 2307 CWT is claimed (Items 59 or 60 > ₱0). Electronic submission via eBIRForms or eFPS. | Engine generates SAWT data in CSV format per BIR specifications. Includes: payer TIN, payer name, quarter, ATC code, income payment amount, tax withheld. One row per 2307 received. |
| 2 | **BIR Form 2307 copies** | Always required if any CWT is claimed. Attach photocopies of ALL 2307 certificates received during the year. | Engine prompts user to confirm 2307 upload/entry for each issuing client. Engine generates checklist of 2307s by payer. |
| 3 | **BIR Form 2304** (Certificate of Income Payments Not Subjected to Withholding Tax) | Required if taxpayer received income from clients who issued 2304 instead of 2307. | Engine prompts for 2304 details if user indicates non-withholding income. |
| 4 | **Approved Tax Debit Memo (TDM)** | Required if Item 63 includes a TDM credit. | Engine records TDM reference number and date issued. |
| 5 | **Proof of Prior Year's Excess Credits** | Required if Item 57 > ₱0. Must show prior year's 1701A/1701 indicating overpayment and "Carry Over" election. | Engine links to prior year's saved return if stored in system. |
| 6 | **No Audited Financial Statements (AFS)** | Not required for 1701A filers. The OSD method (40% flat deduction) removes the need to substantiate expenses, so no AFS is needed. 8% filers likewise have no expense deduction to substantiate. | Engine explicitly tells user: "No audited financial statements required for this return." This is a key advantage of 1701A over 1701 (itemized). |

---

## KEY DIFFERENCES FROM FORM 1701

| Feature | Form 1701A | Form 1701 |
|---------|------------|-----------|
| Pages | 2 pages | 4 pages |
| Who files | Purely self-employed, no compensation income, OSD or 8% only | Mixed income earners, OR purely SE using itemized deductions |
| Compensation income section | None (Schedule 1, Schedule 2 absent) | Schedule 1 (employer info), Schedule 2 (compensation income detail) |
| Spouse information section | None (for purely SE individuals) | Part IV spouse background section |
| Deduction options | OSD (40%) or 8% flat rate — TWO mutually exclusive sub-computations | Itemized OR OSD OR 8% — THREE possible regimes |
| Audited Financial Statements | NOT required | Required for itemized deduction filers |
| ATC codes available | II012, II014, II015, II017 | II011, II012, II013, II014, II015, II016, II017 |
| Non-operating income treatment | OSD: added after 40% applied to business income. 8%: included in the gross base before ₱250K deduction. | Same treatment but computed within broader multi-schedule framework |
| Penalties section | Items 25–28 (4 items) | Items 27–30 (4 items, different numbering) |
| Two-installment option | Available if Item 20 > ₱2,000 | Available if Item 22 > ₱2,000 |

---

## ENGINE OUTPUT: FORM 1701A PRE-FILL STRUCT

The engine populates a `Form1701AOutput` struct which is serialized to JSON for the frontend pre-fill display and PDF generation:

```
Form1701AOutput {
  // Metadata
  taxable_year: string                          // "12/2025" format
  is_amended: boolean                           // Item 2
  is_short_period: boolean                      // Item 3
  filing_date: date                             // Pre-filled with April 15 deadline

  // Part I — Taxpayer Info
  tin: string                                   // Item 4, 12-digit
  rdo_code: string                              // Item 5, 3-digit
  taxpayer_type: enum("PROFESSIONAL", "SINGLE_PROPRIETOR")  // Item 6
  atc_code: enum("II012","II014","II015","II017")           // Item 7, auto-computed
  taxpayer_name: string                         // Item 8
  registered_address_line1: string              // Item 9
  registered_address_line2: string              // Item 9 (continued)
  city_municipality: string                     // Item 9
  province: string                              // Item 9
  zip_code: string                              // Item 9A
  line_of_business: string                      // Item 10
  telephone_number: string                      // Item 11
  email_address: string                         // Item 12
  date_of_birth: date                           // Item 13
  citizenship: enum("RESIDENT_CITIZEN","NON_RESIDENT_CITIZEN","RESIDENT_ALIEN","NR_ALIEN_ET","NR_ALIEN_NET")  // Item 14
  civil_status: enum("SINGLE","MARRIED","LEGALLY_SEPARATED","WIDOW_WIDOWER")  // Item 15
  contact_number: string                        // Item 16
  income_exempt: boolean                        // Item 17
  filing_status: enum("SEPARATE","JOINT")       // Item 18
  tax_rate_election: enum("OSD_GRADUATED","EIGHT_PERCENT")  // Item 19

  // Part II — Tax Payable
  tax_due: integer                              // Item 20 — in whole pesos
  total_credits: integer                        // Item 21 — in whole pesos
  tax_payable_overpayment: integer              // Item 22 — signed integer (negative = overpayment)
  second_installment_amount: integer            // Item 23 — ₱0 if not elected
  amount_due_april15: integer                   // Item 24 — signed
  overpayment_election: enum("REFUND","TCC","CARRY_OVER") | null  // Item 24a — null if no overpayment
  surcharge: integer                            // Item 25
  interest: integer                             // Item 26
  compromise: integer                           // Item 27
  total_penalties: integer                      // Item 28
  total_amount_payable: integer                 // Item 29

  // Part IV-A — OSD/Graduated (null if 8% elected)
  osd_gross_receipts: integer | null            // Item 36
  osd_sales_returns: integer | null             // Item 37
  osd_net_receipts: integer | null              // Item 38
  osd_deduction: integer | null                 // Item 39
  osd_net_income: integer | null                // Item 40
  osd_non_op_income_1: integer | null           // Item 41
  osd_non_op_income_2: integer | null           // Item 42
  osd_non_op_income_3: integer | null           // Item 43
  osd_non_op_income_4: integer | null           // Item 44
  osd_total_taxable_income: integer | null      // Item 45
  osd_tax_due: integer | null                   // Item 46

  // Part IV-B — 8% Rate (null if OSD/graduated elected)
  eight_pct_gross_receipts: integer | null      // Item 47
  eight_pct_sales_returns: integer | null       // Item 48
  eight_pct_net_receipts: integer | null        // Item 49
  eight_pct_non_op_income_1: integer | null     // Item 50
  eight_pct_non_op_income_2: integer | null     // Item 51
  eight_pct_non_op_income_3: integer | null     // Item 52
  eight_pct_total_base: integer | null          // Item 53
  eight_pct_exemption: integer | null           // Item 54 — always 250000 when applicable
  eight_pct_taxable_income: integer | null      // Item 55
  eight_pct_tax_due: integer | null             // Item 56

  // Tax Credits/Payments
  prior_year_excess_credits: integer            // Item 57
  quarterly_payments: integer                   // Item 58
  cwt_q1_to_q3: integer                        // Item 59
  cwt_q4: integer                              // Item 60
  prior_filing_payment: integer                 // Item 61
  foreign_tax_credits: integer                  // Item 62
  other_credits: integer                        // Item 63
  total_tax_credits: integer                    // Item 64
  net_payable_verification: integer             // Item 65 — must equal Item 22
}
```

---

## FORM 1701A VALIDATION INVARIANTS

The following must be true in all valid Form 1701A outputs:

| # | Invariant | Formula |
|---|-----------|---------|
| FV-1A-01 | Tax due equals filed amount | `Form1701AOutput.tax_due = annual_result.income_tax_due` (within rounding ≤ ₱1) |
| FV-1A-02 | Net receipts (OSD) is correct | If OSD: `osd_net_receipts = osd_gross_receipts − osd_sales_returns` |
| FV-1A-03 | OSD deduction is correct | If OSD: `osd_deduction = floor(osd_net_receipts × 0.40 + 0.5)` (round-half-up) |
| FV-1A-04 | OSD net income is correct | If OSD: `osd_net_income = osd_net_receipts − osd_deduction` |
| FV-1A-05 | 8% base does not exceed threshold | If 8%: `eight_pct_total_base ≤ 3000000`; if exceeded, engine should have blocked 8% election |
| FV-1A-06 | 8% exemption is fixed constant | If 8%: `eight_pct_exemption = 250000` always |
| FV-1A-07 | 8% taxable income non-negative | If 8%: `eight_pct_taxable_income = max(0, eight_pct_total_base − 250000)` |
| FV-1A-08 | 8% tax due is correct | If 8%: `eight_pct_tax_due = eight_pct_taxable_income × 0.08` |
| FV-1A-09 | Total credits is sum of parts | `total_tax_credits = prior_year_excess_credits + quarterly_payments + cwt_q1_to_q3 + cwt_q4 + prior_filing_payment + foreign_tax_credits + other_credits` |
| FV-1A-10 | Net payable matches | `net_payable_verification = tax_due − total_tax_credits` |
| FV-1A-11 | Part II tax payable matches | `tax_payable_overpayment = tax_due − total_credits` |
| FV-1A-12 | Total penalties is sum of parts | `total_penalties = surcharge + interest + compromise` |
| FV-1A-13 | Total payable is correct | `total_amount_payable = amount_due_april15 + total_penalties` |
| FV-1A-14 | Mutually exclusive path | Exactly ONE of {OSD path, 8% path} has non-null values; the other path's Items are all null |
| FV-1A-15 | ATC matches taxpayer type and regime | `atc_code` matches the ATC Determination Table above — no other ATC values possible |
| FV-1A-16 | 8% and VAT incompatible | If taxpayer is VAT-registered: `tax_rate_election ≠ EIGHT_PERCENT`; engine blocks |
| FV-1A-17 | No compensation income on 1701A | `has_compensation_income = false` is a precondition for 1701A filing; if true, engine redirects to Form 1701 |
| FV-1A-18 | Rounding applied | All peso values are integers (centavos dropped per BIR instructions: ≤ 49 cents → drop; ≥ 50 cents → round up) |

---

## CROSS-FORM DATA FLOW: FORM 1701A AS DESTINATION

Data flowing INTO Form 1701A from other forms and engine outputs:

```
BIR Form 1701Q (Q1) → Tax Payable line → feeds Item 58 (partial)
BIR Form 1701Q (Q2) → Tax Payable line → feeds Item 58 (partial)
BIR Form 1701Q (Q3) → Tax Payable line → feeds Item 58 (partial)
[Sum of Q1+Q2+Q3 tax payments = Item 58]

BIR Form 2307 (all received Q1–Q3) → Column 10 Tax Withheld → feeds Item 59
BIR Form 2307 (all received Q4) → Column 10 Tax Withheld → feeds Item 60

Prior Year 1701A/1701 Overpayment (if Carry Over election) → feeds Item 57

Engine Output (annual_result.income_tax_due) → feeds Item 20 (tax due)
  - If OSD: computed from Item 46 (graduated table on 60% of net receipts)
  - If 8%: computed from Item 56 (8% of (gross receipts − ₱250,000))
```

---

## CROSS-FORM DATA FLOW: FORM 1701A AS SOURCE

Data flowing OUT OF Form 1701A to future returns:

```
Form 1701A Item 24 (Amount of Tax Payable/(Overpayment)):
  → If positive: paid to AAB/RCO (no further carry-forward)
  → If negative AND Carry Over elected: flows to NEXT year's 1701A/1701 Item 57 (Prior Year Excess Credits)
  → If negative AND Refund elected: claim submitted to BIR (no future form effect)
  → If negative AND TCC elected: Tax Credit Certificate issued (no future form effect)

Form 1701A Item 20 (Tax Due) — indirectly:
  → Used as basis for installment election (Item 23) if > ₱2,000
```

See also: [bir-form-1701-field-mapping.md](bir-form-1701-field-mapping.md) for Form 1701 (the companion form for itemized deduction filers and mixed income earners).
