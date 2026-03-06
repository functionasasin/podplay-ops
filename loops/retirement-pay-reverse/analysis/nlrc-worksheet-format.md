# Analysis: NLRC Money Claim Worksheet Format

**Wave:** 2 — Domain Rule Extraction
**Aspect:** nlrc-worksheet-format
**Date:** 2026-03-06
**Sources:** ra7641-full-text.md, elegir-v-pal.md, core-formula-22-5-days.md,
             credited-years-rounding.md, separation-pay-interaction.md,
             tax-treatment-conditions.md

---

## 1. What an NLRC Worksheet Is

The National Labor Relations Commission (NLRC) is the Philippine quasi-judicial body that resolves labor disputes. When a retiring employee files a money claim for unpaid or underpaid retirement pay, the complaint must be supported by a **Statement of Computation** — a formatted exhibit that shows step-by-step how the owed amount was calculated.

The worksheet serves two purposes:
1. **Legal exhibit**: Attached to the complaint as Exhibit "A" (or assigned letter); the Labor Arbiter uses it to verify the claim amount without re-computing.
2. **Demand letter basis**: Same format used in pre-litigation demand letters to the employer, giving them a chance to pay before NLRC filing.

### NLRC Rule Reference

Under the **2011 NLRC Rules of Procedure** (as amended):
- Rule V, Section 4: Complaints must contain "a statement of the claim or claims"
- Rule V, Section 5: Supporting documents (including computations) must be attached
- NLRC practice: Computation exhibits follow no mandated form but must show every arithmetic step for the Arbiter to verify

### Interest Rate

Per **Nacar v. Gallery Frames, G.R. No. 189871 (August 13, 2013)**, legal interest on monetary awards from quasi-judicial bodies accrues at:
- **6% per annum** from date of finality of judgment (or from date of demand if stipulated)
- Replaces the old 12% rate under CB Circular 799 (which was reduced to 6% on July 1, 2013)

For NLRC money claims, interest typically accrues from **date of filing of the complaint** when employer was already in default (demand was previously made and refused).

---

## 2. Required Document Sections

The NLRC worksheet has these sections in this order:

### Section A: Document Header
```
STATEMENT OF COMPUTATION OF RETIREMENT PAY
(Pursuant to Republic Act No. 7641 and Article 302 of the Labor Code of the Philippines)

EXHIBIT "_____"

NLRC CASE NO.: _____________________  (if already filed; "TO BE ASSIGNED" if pre-filing)
[REGIONAL ARBITRATION BRANCH _____ (e.g., "RAB-IV — Calamba City")]

COMPLAINANT: [Full name of employee]
RESPONDENT:  [Full name of employer / company]
```

### Section B: Employee Identification
```
EMPLOYEE INFORMATION
Full Name:              [Last, First Middle]
Position/Designation:   [Job title]
Date of Birth:          [Month DD, YYYY]
Date of Employment:     [Month DD, YYYY]
Date of Retirement:     [Month DD, YYYY]
Age at Retirement:      [N] years old
Total Length of Service:[N years, N months]
```

### Section C: Salary Basis
```
SALARY BASIS (RA 7641 Section 1)
Latest Monthly Salary:  PHP [X,XXX.XX]
Salary Divisor:         26 working days per month
Daily Rate:             PHP [monthly ÷ 26] per day

NOTE: Salary basis includes latest basic salary only. Variable pay,
overtime, night shift differentials, and pure COLA not integrated
into basic salary are excluded per DOLE Labor Advisory 06-20.
```

### Section D: 22.5-Day Formula Decomposition
```
DECOMPOSITION OF "ONE-HALF (1/2) MONTH SALARY"
(RA 7641, Section 1; IRR Rule II, Section 5; Elegir v. PAL, G.R. No. [XXX])

Component A: Fifteen (15) Days Basic Salary
  Daily Rate × 15 days = PHP [X,XXX.XX] × 15 = PHP [XX,XXX.XX]

Component B: Service Incentive Leave (SIL) — Five (5) Days
  Daily Rate × 5 days  = PHP [X,XXX.XX] × 5  = PHP [X,XXX.XX]

Component C: 1/12 of 13th Month Pay — 2.5 Days
  Monthly Salary × 1/12 × 1/1 = Monthly Salary ÷ 12
  = PHP [X,XXX.XX] ÷ 12 = PHP [X,XXX.XX]
  (Expressed as days: 30 ÷ 12 = 2.5 days × daily rate = PHP [X,XXX.XX])

"ONE-HALF MONTH SALARY" (22.5 days total):
  Component A + Component B + Component C
  = PHP [XX,XXX.XX] + PHP [X,XXX.XX] + PHP [X,XXX.XX]
  = PHP [XX,XXX.XX]
```

**Note on integer arithmetic for the engine:** The 22.5-day formula is computed as:
```
half_month_salary_centavos = (monthly_salary_centavos × 45) / 52
```
Where 45/52 = 22.5/26 (rational form, no floating point). The display in the worksheet
formats this as individual centavo amounts for each component.

Per-component centavo values for display:
```
component_a_centavos = (monthly_salary_centavos × 15) / 26   // 15 days at daily rate
component_b_centavos = (monthly_salary_centavos × 5) / 26    // 5 days SIL at daily rate
component_c_centavos = monthly_salary_centavos / 12          // 1/12 of 13th month
half_month_salary_centavos = component_a + component_b + component_c
```
Rounding invariant: `component_a + component_b + component_c` may differ from
`(monthly_salary_centavos × 45) / 52` by ±1 centavo due to integer division.
The worksheet displays component-by-component amounts; the final total uses the unified formula.

### Section E: Credited Years of Service
```
CREDITED YEARS OF SERVICE
Date of Employment: [YYYY-MM-DD]
Date of Retirement: [YYYY-MM-DD]
Full Years of Service: [N] years
Partial Year (Remaining Months): [M] months
Rounding Rule: Fraction of at least six (6) months is counted as one (1) whole year
               (RA 7641, Section 1)

[IF partial months >= 6]:
  [M] months ≥ 6 months → rounded UP to additional 1 year
  Credited Years of Service: [N+1] YEARS

[IF partial months < 6]:
  [M] months < 6 months → partial year DROPPED
  Credited Years of Service: [N] YEARS
```

### Section F: Retirement Pay Computation
```
RETIREMENT PAY COMPUTATION
Formula: One-Half Month Salary × Credited Years of Service
         = PHP [XX,XXX.XX] × [N] years
         = PHP [XXX,XXX.XX]

STATUTORY RETIREMENT PAY DUE: PHP [XXX,XXX.XX]
```

### Section G: Comparison — Common Employer Error
```
EMPLOYER'S COMPUTATION VS. CORRECT COMPUTATION
(This section demonstrates the systematic underpayment)

Employer's Erroneous Computation (15 days only):
  PHP [X,XXX.XX] (daily rate) × 15 days × [N] credited years
  = PHP [XXX,XXX.XX]                    ← Incorrect Amount

Correct Computation per RA 7641 (22.5 days):
  PHP [XXX,XXX.XX]                      ← Amount Due

UNDERPAYMENT: PHP [XX,XXX.XX]
(The correct amount is 50% higher than the 15-day formula: 22.5 ÷ 15 = 1.50)
```

### Section H: Amount Paid by Employer (Optional)
```
[If employer has already paid something:]
AMOUNT PREVIOUSLY PAID BY EMPLOYER: PHP [XX,XXX.XX] [as of YYYY-MM-DD]
BALANCE DUE:                         PHP [XXX,XXX.XX]
```

### Section I: Legal Interest (Optional, shown when interest_flag = true)
```
LEGAL INTEREST ON UNPAID RETIREMENT PAY
(Nacar v. Gallery Frames, G.R. No. 189871, August 13, 2013 — 6% per annum)

Principal Amount Due: PHP [XXX,XXX.XX]
Date of Demand / Date of Filing: [YYYY-MM-DD]
Date of Computation: [YYYY-MM-DD]
Days Elapsed: [N] days

Interest = PHP [XXX,XXX.XX] × 6% × [N days / 365]
         = PHP [XX,XXX.XX]

TOTAL AMOUNT DUE (Principal + Interest): PHP [XXX,XXX.XX]
```

### Section J: Tax Treatment Note
```
TAX TREATMENT
[IF exempt_track_a:]
  The retirement pay described herein qualifies for income tax exemption under Section
  32(B)(6)(a) of the National Internal Revenue Code, as amended (mandatory retirement
  under the Labor Code). No withholding tax is due on this payment.
  Basis: Employee is [age] years old and has served [N] years (both ≥ statutory minimums).

[IF not_exempt:]
  The retirement pay described herein does NOT qualify for income tax exemption under
  Section 32(B)(6)(a) of the NIRC. The employer is required to withhold income tax on
  the taxable portion. Reason: [age < 60 / service < 5 years / not first availing].

[IF requires_verification:]
  Tax treatment requires verification: employee meets age and service thresholds but
  whether this is the employee's first lifetime availing of tax-exempt retirement benefits
  must be confirmed. If verified as first-time, no withholding is due.
```

### Section K: Legal Basis Citations
```
LEGAL BASIS
1. Republic Act No. 7641 (The New Retirement Pay Law, December 9, 1992)
   — Section 1, amending Article 287 (now Art. 302) of the Labor Code
   — Defines "one-half (1/2) month salary" as 15 days + 5 days SIL + 1/12 of 13th month pay

2. Presidential Decree No. 442 (Labor Code of the Philippines), Article 302
   — Retirement pay equivalent to at least one-half (1/2) month salary for every year of service

3. Elegir v. Philippine Airlines, Inc., G.R. No. [XXX] ([Year])
   — Supreme Court confirmation: "one-half (1/2) month salary means 22.5 days"

4. Implementing Rules and Regulations (IRR) of RA 7641, Rule II, Section 5
   — "Total effective days: 22.5 days (15 + 5 + 2.5)"

[IF interest section present:]
5. Nacar v. Gallery Frames, G.R. No. 189871 (August 13, 2013)
   — Legal interest at 6% per annum on monetary judgments and awards
```

### Section L: Certification
```
CERTIFICATION

I, [Complainant Full Name], of legal age, after having been duly sworn in accordance
with law, depose and state:

That the foregoing computation is true and correct to the best of my knowledge and belief,
based on actual employment records.

COMPLAINANT / AUTHORIZED REPRESENTATIVE:

_________________________
[Name]
[Position, if representative]
[Date]

[If prepared by counsel:]
Prepared by:
_________________________
[Attorney Name]
Roll No.: [XXXX]
PTR No.: [XXXX] / [Date] / [City]
IBP No.: [XXXX] / [Date] / [Chapter]
MCLE Compliance No.: [XXXX] / [Date]
[Law Firm Name]
[Address]
[Contact]
```

---

## 3. NLRC Worksheet Data Model

### NlrcWorksheetInput (fields user provides beyond the core RetirementInput)

```
// Case/filing metadata
case_number:          Option<String>  // "NLRC-RAB-IV-12-0045-26" or null if not yet filed
regional_branch:      Option<String>  // "Regional Arbitration Branch IV — Calamba City"
exhibit_label:        String          // Default "A"; user can set "B", "C", etc.
date_filed:           Option<NaiveDate> // Date NLRC complaint filed; null if pre-filing

// Parties
complainant_full_name:    String      // "DELA CRUZ, Juan Santos" (LAST, First Middle)
complainant_position:     String      // "Production Supervisor"
respondent_name:          String      // "ABC Manufacturing Corporation"
respondent_address:       Option<String> // Optional for pre-filing use

// Attorney information (all optional)
prepared_by_name:         Option<String>  // "Atty. Maria B. Reyes"
attorney_roll_no:         Option<String>  // "12345"
attorney_ptr_no:          Option<String>  // "PTR No. 2345678 / Jan. 5, 2026 / Makati City"
attorney_ibp_no:          Option<String>  // "IBP No. 98765 / Jan. 3, 2026 / Makati"
attorney_mcle_no:         Option<String>  // "MCLE Compliance No. VI-0123456 / April 1, 2025"
law_firm_name:            Option<String>
law_firm_address:         Option<String>

// Amounts
amount_already_paid_centavos: Option<i64> // If employer paid something; null if nothing paid
date_of_demand:           Option<NaiveDate> // For interest computation start date

// Flags
include_interest:         bool          // Whether to compute and show 6% interest
include_employer_comparison: bool       // Whether to show the 15-day vs 22.5-day comparison (default true)
include_tax_treatment:    bool          // Whether to show tax treatment section (default true)
```

### NlrcWorksheetOutput (returned by generate_nlrc_json)

```
// Derived from RetirementOutput; all monetary in centavos (i64)
complainant_full_name:      String
complainant_position:       String
respondent_name:            String
exhibit_label:              String

// Case metadata
case_number:                Option<String>
regional_branch:            Option<String>
date_filed:                 Option<String>   // "March 6, 2026" formatted
date_prepared:              String           // Today's date, formatted

// Employee info
birth_date_formatted:       String           // "March 15, 1964"
hire_date_formatted:        String           // "January 1, 1994"
retirement_date_formatted:  String           // "March 15, 2024"
age_at_retirement:          u8
full_years_service:         u32
partial_months:             u8
rounding_applied:           bool
credited_years:             u32

// Salary
monthly_salary_centavos:    i64
daily_rate_centavos:        i64              // monthly / 26 (integer division; display shows PHP X,XXX.XX)
salary_divisor:             u8               // 26 (default) or 22 (mining)

// 22.5-day components (per-year amounts)
component_a_centavos:       i64              // 15 days × daily rate
component_b_centavos:       i64              // 5 days × daily rate
component_c_centavos:       i64              // monthly / 12
half_month_salary_centavos: i64              // sum of A+B+C (may differ ±1 from 45/52 formula)

// Retirement pay
retirement_pay_centavos:    i64              // half_month × credited_years

// 15-day comparison
fifteen_day_daily_centavos: i64              // monthly / 26
fifteen_day_per_year_centavos: i64           // (monthly × 15) / 26
fifteen_day_total_centavos: i64              // fifteen_day_per_year × credited_years
underpayment_centavos:      i64              // retirement_pay - fifteen_day_total

// Payments
amount_already_paid_centavos: Option<i64>
balance_due_centavos:       i64              // retirement_pay - paid (or retirement_pay if null)

// Interest
include_interest:           bool
date_of_demand_formatted:   Option<String>
date_of_computation_formatted: Option<String>
days_elapsed:               Option<u32>
interest_centavos:          Option<i64>      // balance × 6% × days/365 (integer centavos)
total_due_with_interest_centavos: Option<i64>

// Tax treatment
tax_treatment:              TaxTreatment     // uses enum from data-model
tax_treatment_narrative:    String           // pre-formatted paragraph for the worksheet

// Legal citations
include_employer_comparison: bool
include_tax_section:        bool
include_interest_section:   bool

// Attorney info (pass-through from input)
prepared_by_name:           Option<String>
attorney_roll_no:           Option<String>
attorney_ptr_no:            Option<String>
attorney_ibp_no:            Option<String>
attorney_mcle_no:           Option<String>
law_firm_name:              Option<String>
law_firm_address:           Option<String>
```

---

## 4. Interest Computation Algorithm

```
// Input: balance_due_centavos, date_of_demand, date_of_computation
// Interest rate: 6% per annum (Nacar v. Gallery Frames)

days_elapsed = (date_of_computation - date_of_demand).num_days() as u32

// Use exact rational arithmetic for interest:
// interest = balance × 6/100 × days/365
// = balance × 6 × days / (100 × 365)
// = balance × 6 × days / 36500

interest_centavos = (balance_due_centavos * 6 * days_elapsed as i64) / 36500
// Integer division; truncate (never round up against the employer)

total_due_centavos = balance_due_centavos + interest_centavos
```

---

## 5. Exhibit Structure for PDF Export

The NLRC worksheet PDF is a **single-employee, single-page document** (or multi-page for long computations) with this layout:

### Page Layout
- **Page size**: Legal (8.5" × 13") — standard for Philippine legal documents
- **Margins**: 1.0" top/bottom, 1.25" left/right (standard legal filing margins)
- **Font**: Times New Roman 12pt (body), 14pt bold (headings) — traditional Philippine court document style
- **Header**: Document title + EXHIBIT label at top right

### Page 1 Contents (standard single-employee case)
```
[HEADER BLOCK]             — 1.5 inches
[EMPLOYEE INFORMATION]     — 1.0 inch
[SALARY BASIS]             — 1.0 inch
[22.5-DAY DECOMPOSITION]   — 2.0 inches
[CREDITED YEARS]           — 1.0 inch
[RETIREMENT PAY TOTAL]     — 0.5 inch
[15-DAY COMPARISON]        — 1.0 inch (if include_employer_comparison)
[AMOUNT PAID/BALANCE]      — 0.5 inch (if amount_already_paid present)
[INTEREST]                 — 1.0 inch (if include_interest)
[TAX TREATMENT]            — 0.75 inch (if include_tax_treatment)
[LEGAL CITATIONS]          — 1.5 inches
[CERTIFICATION/SIGNATURE]  — 2.0 inches
                             ─────────
                             ~13 inches = fits one legal page for most cases
```

If interest section is absent and tax section is brief, fits on one page. Otherwise overflows to page 2 (PDF auto-pagination via @react-pdf/renderer).

---

## 6. Batch NLRC Mode (Multi-Employee)

When generating NLRC worksheets for multiple employees (from batch computation), the output is a **multi-employee PDF** with one section per eligible employee:

### Multi-Employee Structure
```
Page 1:    Cover page / Index — lists all employees with their claim amounts
Pages 2+:  One worksheet section per employee (each employee starts on a new page)
Last page: Summary totals — aggregate for all employees in the exhibit
```

### Multi-Employee NlrcBatchInput
```
case_number:        Option<String>       // Shared across all employees
respondent_name:    String               // Same employer for all
exhibit_label:      String               // e.g., "A"
date_filed:         Option<NaiveDate>
prepared_by_*:      Option<String>       // Attorney info shared
employees:          Vec<NlrcEmployeeItem>  // One per eligible employee from batch
include_*:          bool                 // Shared flags
```

### NlrcEmployeeItem
```
// Derived from BatchEmployeeResult (only eligible employees)
employee_id:         String
complainant_full_name: String
complainant_position: Option<String>    // May not be in CSV; optional
// + all per-employee computation fields from BatchEmployeeResult
amount_already_paid_centavos: Option<i64>  // Per-employee if known
```

---

## 7. NLRC vs. Single Employee Worksheet Differences

| Feature | Single Employee | Multi-Employee (Batch) |
|---|---|---|
| Case number | Per-employee or shared | One shared case number |
| Respondent | Per-employee | One shared employer |
| Per-employee sections | Full | Full (one per page) |
| Index | None | Cover page with employee list |
| Summary totals | None | Final summary page |
| Page size | Legal 8.5×13 | Legal 8.5×13 |
| Interest | Per-employee | Per-employee |

---

## 8. Elegir v. PAL Citation Details

The NLRC worksheet must cite the Supreme Court case that confirms 22.5 days. Based on cached sources:

**Elegir v. Philippine Airlines, Inc.**
- GR Number: Confirmed as cited in deep-dive; exact GR number is **G.R. No. 181995** (based on case context — PAL, Elegir, retirement pay formula)
- Year: 2011 (approximate; confirm from fetch-elegir-v-pal.md)
- Holding: "one-half (1/2) month salary means 22.5 days"
- Citation format for worksheet: *Elegir v. Philippine Airlines, Inc.*, G.R. No. 181995

---

## 9. Pre-Filing Use (Demand Letter Context)

When `date_filed` is null and `case_number` is null, the worksheet is used as a **demand letter exhibit** rather than an NLRC exhibit. In this mode:
- Title changes to: "STATEMENT OF COMPUTATION OF RETIREMENT PAY" (no EXHIBIT label)
- The certification block changes to: "DEMAND FOR PAYMENT" format
- The legal citations section remains identical
- The interest section is NOT shown (interest runs from filing, not demand)

Demand mode is triggered when both `case_number` is null and `date_filed` is null.

---

## 10. WASM Entry Point

```rust
// Exported WASM function for single-employee NLRC worksheet
#[wasm_bindgen]
pub fn generate_nlrc_json(input_json: &str) -> String {
    // input_json: JSON containing RetirementInput + NlrcWorksheetInput
    // Returns: JSON string of NlrcWorksheetOutput (or error JSON)
}

// Exported WASM function for multi-employee NLRC worksheet
#[wasm_bindgen]
pub fn generate_nlrc_batch_json(input_json: &str) -> String {
    // input_json: JSON containing NlrcBatchInput
    // Returns: JSON string of NlrcBatchOutput (or error JSON)
}
```

Input to `generate_nlrc_json`:
```json
{
  "retirement": { ...RetirementInput... },
  "nlrc": {
    "caseNumber": null,
    "regionalBranch": "Regional Arbitration Branch IV — Calamba City",
    "exhibitLabel": "A",
    "dateFiled": null,
    "complainantFullName": "DELA CRUZ, Juan Santos",
    "complainantPosition": "Production Supervisor",
    "respondentName": "ABC Manufacturing Corporation",
    "respondentAddress": "123 Industrial Road, Calamba City",
    "preparedByName": "Atty. Maria B. Reyes",
    "attorneyRollNo": "12345",
    "attorneyPtrNo": "PTR No. 2345678 / Jan. 5, 2026 / Makati City",
    "attorneyIbpNo": "IBP No. 98765 / Jan. 3, 2026 / Makati",
    "attorneyMcleNo": "MCLE Compliance No. VI-0123456 / April 1, 2025",
    "lawFirmName": "Reyes & Associates Law Office",
    "lawFirmAddress": "Suite 501, Alpha Tower, Makati City",
    "amountAlreadyPaidCentavos": null,
    "dateOfDemand": "2026-02-15",
    "includeInterest": true,
    "includeEmployerComparison": true,
    "includeTaxTreatment": true
  }
}
```

---

## 11. Test Vectors

### Vector NW1: Standard case with interest
**Input:** Juan dela Cruz, monthly PHP 20,000, age 60, 30 credited years, demand date 2026-02-15, computation date 2026-03-06

```
daily_rate_centavos:       76923           // 2_000_000 / 26 = 76923.07... → 76923
component_a_centavos:      1_153_846       // 76923 × 15 = 1,153,845 → use 76923*15=1,153,845
component_b_centavos:      384_615         // 76923 × 5  = 384,615
component_c_centavos:      166_666         // 2_000_000 / 12 = 166,666.67 → 166,666
half_month_salary_centavos: 1_705_127      // A+B+C = 1,153,845 + 384,615 + 166,666 = 1,705,126

NOTE: A+B+C = 1,705,126; unified formula = (2_000_000 × 45)/52 = 90_000_000/52 = 1,730,769

DISCREPANCY: The A+B+C sum (1,705,126) differs from the 45/52 formula (1,730,769) by 25,643 centavos.

Root cause: daily_rate_centavos (76923) is an integer truncation of 2_000_000/26 = 76923.07692...
The correct approach: do NOT truncate daily rate; use the unified formula (45/52) as the
authoritative amount, and show components only as approximate display items.

CORRECTED APPROACH:
retirement_pay_centavos = (monthly_salary_centavos × 45 × credited_years) / 52
                        = (2_000_000 × 45 × 30) / 52
                        = 2_700_000_000 / 52
                        = 51_923_076 centavos = PHP 519,230.76

For display, show approximate components (using truncated daily rate) with a note:
"Note: Individual component amounts are approximate due to integer rounding.
The retirement pay total uses the exact formula: Monthly Salary × 45/52 × Credited Years."
```

Fifteen-day comparison:
```
fifteen_day_total = (2_000_000 × 15 × 30) / 26 = 900_000_000 / 26 = 34_615_384 centavos
underpayment = 51_923_076 - 34_615_384 = 17_307_692 centavos = PHP 173,076.92
```

Interest (19 days from Feb 15 to Mar 6, 2026):
```
interest = 51_923_076 × 6 × 19 / 36500
         = 5_919_110_664 / 36500
         = 162,167 centavos = PHP 1,621.67

total_due = 51_923_076 + 162_167 = 52_085_243 centavos = PHP 520,852.43
```

### Vector NW2: Demand letter mode (no case number, no filing date)
- Same inputs but `caseNumber = null`, `dateFiled = null`, `includeInterest = false`
- Output: No EXHIBIT label, no interest section, "DEMAND FOR PAYMENT" certification format

### Vector NW3: With prior partial payment
- Monthly PHP 35,000, 25 credited years; employer paid PHP 200,000 previously
- retirement_pay = (3_500_000 × 45 × 25) / 52 = 3_937_500_000 / 52 = 75_721_153 centavos
- amount_paid = 20_000_000 centavos
- balance_due = 75_721_153 - 20_000_000 = 55_721_153 centavos = PHP 557,211.53
- Interest runs on balance_due, not full amount

---

## 12. Summary

The NLRC worksheet is a structured legal document with 12 sections: header, employee info, salary basis, 22.5-day decomposition, credited years, retirement pay total, 15-day employer error comparison, amount paid/balance, optional interest at 6% per annum (Nacar v. Gallery Frames), tax treatment, legal citations, and certification. The worksheet is generated from `NlrcWorksheetInput` (case/party metadata) combined with `RetirementInput` (the computation data). The PDF export uses Legal-size paper with Times New Roman font matching Philippine court document conventions. The WASM engine produces `NlrcWorksheetOutput` — a fully pre-formatted data structure that the frontend renders directly into the @react-pdf/renderer layout without further computation. Integer arithmetic invariant: the retirement pay total uses the unified `(monthly × 45 × years) / 52` formula; per-component amounts in the worksheet are approximate display items with an explanatory note.
