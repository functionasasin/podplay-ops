# Wizard Steps — Philippine Freelance & Self-Employed Income Tax Optimizer

**Status:** COMPLETE
**Last updated:** 2026-03-02
**Cross-references:**
- User journeys (flow context): [frontend/user-journeys.md](user-journeys.md)
- Results views (output screens): [frontend/results-views.md](results-views.md)
- Engine data model (field types): [engine/data-model.md](../engine/data-model.md)
- Validation rules (client-side): [frontend/validation-rules.md](validation-rules.md)
- Error states (engine errors): [engine/error-states.md](../engine/error-states.md)
- Computation rules: [domain/computation-rules.md](../domain/computation-rules.md)

---

## Table of Contents

1. [Wizard Architecture](#1-wizard-architecture)
2. [Step WS-00: Mode Selection (Annual vs Quarterly)](#2-step-ws-00-mode-selection)
3. [Step WS-01: Taxpayer Profile](#3-step-ws-01-taxpayer-profile)
4. [Step WS-02: Business Type](#4-step-ws-02-business-type)
5. [Step WS-03: Tax Year and Filing Period](#5-step-ws-03-tax-year-and-filing-period)
6. [Step WS-04: Gross Receipts](#6-step-ws-04-gross-receipts)
7. [Step WS-05: Compensation Income (Mixed Income Only)](#7-step-ws-05-compensation-income-mixed-income-only)
8. [Step WS-06: Expense Method Selection](#8-step-ws-06-expense-method-selection)
9. [Step WS-07A: Itemized Expenses — General Business Costs](#9-step-ws-07a-itemized-expenses--general-business-costs)
10. [Step WS-07B: Itemized Expenses — Financial and Special Items](#10-step-ws-07b-itemized-expenses--financial-and-special-items)
11. [Step WS-07C: Itemized Expenses — Depreciation Assets](#11-step-ws-07c-itemized-expenses--depreciation-assets)
12. [Step WS-07D: Itemized Expenses — NOLCO Carry-Over](#12-step-ws-07d-itemized-expenses--nolco-carry-over)
13. [Step WS-08: Creditable Withholding Tax (Form 2307)](#13-step-ws-08-creditable-withholding-tax-form-2307)
14. [Step WS-09: Prior Quarterly Payments](#14-step-ws-09-prior-quarterly-payments)
15. [Step WS-10: Registration and VAT Status](#15-step-ws-10-registration-and-vat-status)
16. [Step WS-11: Regime Election](#16-step-ws-11-regime-election)
17. [Step WS-12: Filing Details and Return Type](#17-step-ws-12-filing-details-and-return-type)
18. [Step WS-13: Prior Year Carry-Over Credits](#18-step-ws-13-prior-year-carry-over-credits)
19. [Step Routing Matrix](#19-step-routing-matrix)
20. [Global Validation Constraints](#20-global-validation-constraints)
21. [Dynamic Advisories and Contextual Guidance](#21-dynamic-advisories-and-contextual-guidance)

---

## 1. Wizard Architecture

### 1.1 Overall Structure

The optimizer is a multi-step wizard. Not all steps appear for every user — conditional routing skips steps that are not relevant. The wizard is a single-page application (SPA) where each step occupies the full content area; prior steps remain accessible via a progress indicator for editing.

**Navigation controls (present on every step):**
- "Back" button: returns to the previous visible step; disabled on Step WS-00.
- "Continue" button: validates the current step and advances; label changes to "See My Results" on the last step.
- Progress bar: shows N of M steps completed, where M is the total number of steps applicable to this user's path (computed after WS-01).
- "Save and continue later" link (Pro feature): saves current wizard state to user's account; visible after authentication.

### 1.2 Field Specification Format

Each field is specified as follows:

| Property | Description |
|----------|-------------|
| **ID** | Field identifier matching the engine data model field name (e.g., `gross_receipts`) |
| **Label** | Exact text label displayed above the field |
| **Type** | HTML input type or component type (text, number, peso, radio, checkbox, select, date, toggle) |
| **Placeholder** | Placeholder text displayed inside the field when empty; never used as substitute for label |
| **Default** | Initial value on page load; shown if user has not edited the field |
| **Required** | Whether the field must be filled before advancing |
| **Visible When** | Condition under which the field is displayed; "always" = no condition |
| **Validation Rules** | Ordered list of checks applied on blur and on "Continue" click |
| **Error Messages** | Exact error text shown below the field when each validation rule fails |
| **Help Text** | Tooltip or inline explanation text; shown as a ? icon or below the label |

### 1.3 Peso Field Behavior

All fields with type "peso" behave as follows:
- Display prefix: "₱" rendered as a non-editable left adornment.
- Numeric input only; commas auto-inserted for thousands separators on blur (e.g., "1200000" → "1,200,000").
- Accepts decimal point for centavos (e.g., "12500.50").
- On paste: strips non-numeric characters except the decimal point.
- Min value: 0 (negative values rejected with error: "Amount cannot be negative").
- Max value: 9,999,999,999.99 (ten billion minus one centavo); amounts above show error: "Amount exceeds maximum allowed value. If your income exceeds ₱10 billion, please contact us."
- Empty = treated as ₱0 only if field is not Required; for Required fields, empty triggers "This field is required."

### 1.4 ATC Code Auto-Classification

When a user enters an ATC code in Step WS-08, the following logic determines the CwtClassification immediately (no server round-trip):

| ATC Code Input | Classification Displayed | Credit Applied To |
|----------------|-------------------------|------------------|
| WI010 | Income Tax CWT | Income tax due |
| WI011 | Income Tax CWT | Income tax due |
| WI157 | Income Tax CWT | Income tax due |
| WI160 | Income Tax CWT | Income tax due |
| WI760 | Income Tax CWT (RR 16-2023 Platform) | Income tax due |
| WC010 | Income Tax CWT | Income tax due |
| WC760 | Income Tax CWT (RR 16-2023 Platform) | Income tax due |
| PT010 | Percentage Tax CWT | Percentage tax due (2551Q), NOT income tax |
| Any other value | Unknown — Manual Review Required | Not credited until confirmed |

---

## 2. Step WS-00: Mode Selection

**Screen title:** "What would you like to compute?"
**Purpose:** Determines whether to compute an annual return or a quarterly return. Sets `filing_period` initial direction and adjusts subsequent step routing.
**Always shown:** Yes — this is the first screen after the landing page CTA is clicked.
**Engine field set:** `filing_period` (preliminary — confirmed in WS-03)

### Fields

---

**Field: mode_selection**

| Property | Value |
|----------|-------|
| ID | `mode_selection` (UI-only; not an engine field) |
| Label | "What are you computing?" |
| Type | Radio card group (large cards with icon + title + description) |
| Default | "Annual Return" |
| Required | Yes |
| Visible When | Always |

**Options:**

| Option Value | Card Title | Card Description |
|--------------|-----------|-----------------|
| `ANNUAL` | "Annual Income Tax Return" | "Compute your full-year income tax and decide which tax method saves you the most. Filing deadline: April 15. Forms: 1701 or 1701A." |
| `QUARTERLY` | "Quarterly Income Tax Return" | "Pay your income tax for Q1, Q2, or Q3. Uses the cumulative method — earlier quarters are credited. Forms: 1701Q." |
| `PENALTY` | "Penalty and Late Filing" | "Missed a deadline? Compute the exact surcharge, interest, and compromise penalty owed for a late return." |

**Validation Rules:**
1. A selection is required to continue.

**Error Messages:**
1. (no selection): "Please select what you'd like to compute."

---

## 3. Step WS-01: Taxpayer Profile

**Screen title:** "Let's find your best tax option"
**Purpose:** Establishes `taxpayer_type` — the single most important classification. Determines whether mixed-income rules apply, whether 8% is available, which forms are used, and which subsequent steps appear.
**Engine field set:** `taxpayer_type`, `is_mixed_income`

### Fields

---

**Field: taxpayer_type**

| Property | Value |
|----------|-------|
| ID | `taxpayer_type` |
| Label | "Which best describes your income situation?" |
| Type | Radio card group |
| Default | None (no pre-selection) |
| Required | Yes |
| Visible When | Always |

**Options:**

| Option Value | Card Title | Card Description |
|--------------|-----------|-----------------|
| `PURELY_SE` | "I'm purely self-employed or freelancing" | "Your only income is from your own business, practice, or freelance work. No salary from any employer. You can choose the 8% flat rate if eligible." |
| `MIXED_INCOME` | "I have both a job AND freelance/business income" | "You receive a salary from an employer AND earn extra income from a side business or profession. Your compensation is taxed separately." |
| `COMPENSATION_ONLY` | "I only have a salary from an employer" | "You receive only a payslip. Your employer already handles your income tax via payroll (BIR Form 2316). This tool has limited use for you." |

**Conditional action — COMPENSATION_ONLY selected:**
- Immediately shows a modal overlay before advancing:
  - Title: "This tool is for self-employed and freelance income"
  - Body: "If you only earn a salary from an employer, your employer already handles your income tax withheld through payroll. You receive a BIR Form 2316 from your employer. You typically don't need to file your own income tax return unless you have multiple employers or other income.\n\nIf you also have any business income on the side, please select 'I have both a job AND freelance/business income' instead."
  - Button 1: "I have business income too — go back" → closes modal, re-selects nothing
  - Button 2: "I understand — show me what applies to me" → advances wizard but shows limited-applicability state (no regime comparison; engine returns COMPENSATION_ONLY result with no optimization)

**Validation Rules:**
1. A selection is required to continue.

**Error Messages:**
1. (no selection): "Please tell us which best describes you."

**Dynamic behavior:**
- When `MIXED_INCOME` is selected: progress bar updates to show 2 additional steps (WS-05 Compensation Income will appear).
- When `PURELY_SE` is selected: `is_mixed_income` set to `false` automatically.
- When `MIXED_INCOME` is selected: `is_mixed_income` set to `true` automatically.

---

## 4. Step WS-02: Business Type

**Screen title:** "What type of business or profession do you have?"
**Purpose:** Sets `taxpayer_class` (SERVICE_PROVIDER vs TRADER), `is_gpp_partner`, and determines whether COGS field appears.
**Engine fields set:** `taxpayer_class` (via UI; engine derives from `cost_of_goods_sold > 0`), `is_gpp_partner`
**Visible When:** `taxpayer_type` is `PURELY_SE` or `MIXED_INCOME`

### Fields

---

**Field: business_category**

| Property | Value |
|----------|-------|
| ID | `business_category` (UI-only; maps to `taxpayer_class` and `cost_of_goods_sold` logic) |
| Label | "What type of business or profession do you have?" |
| Type | Radio card group |
| Default | None |
| Required | Yes |
| Visible When | Always (within WS-02) |

**Options:**

| Option Value | Card Title | Card Description | Engine mapping |
|--------------|-----------|-----------------|---------------|
| `PROFESSIONAL_SERVICES` | "Professional or freelance services" | "IT, software, design, writing, marketing, consulting, tutoring, photography, video production, virtual assistant, or any work where you exchange time and skill for payment. No physical goods sold." | `taxpayer_class = SERVICE_PROVIDER`; `cost_of_goods_sold` hidden |
| `REGULATED_PROFESSIONAL` | "Licensed / government-regulated profession" | "Lawyer, doctor, dentist, nurse, CPA, engineer, architect, pharmacist, or other profession regulated by PRC or the Supreme Court. May practice solo or through a partnership." | `taxpayer_class = SERVICE_PROVIDER`; `cost_of_goods_sold` hidden; shows GPP sub-question |
| `TRADER` | "Product-based business (I sell goods)" | "Retail, wholesale, buy-and-sell, manufacturing, or any business where you primarily sell physical products or merchandise. You have cost of goods sold." | `taxpayer_class = TRADER`; shows `cost_of_goods_sold` field |
| `MIXED_BUSINESS` | "Both products and services" | "Your business sells both goods and services — e.g., a repair shop, a restaurant, a product + installation business." | `taxpayer_class = TRADER` (engine uses TRADER logic when COGS > 0); shows `cost_of_goods_sold` field |
| `NOT_SURE` | "I'm not sure how to categorize my work" | "See the helper guide below to determine which category fits your work." | Shows helper modal; no selection made until user re-selects |

**Conditional action — NOT_SURE selected:**
- Shows inline expandable helper panel:
  - "If you primarily exchange time, skill, or knowledge for money — writing, coding, designing, advising — you are a **Service Provider**."
  - "If you primarily buy goods and resell them, or manufacture products to sell, you are a **Trader**."
  - "If your work involves both (e.g., you sell equipment AND install it), choose **Both products and services**."
  - "If you have a government-regulated license (PRC-issued or SC-issued), choose **Licensed profession**."
  - After reading, the user must select one of the first four options.

---

**Field: is_gpp_partner**

| Property | Value |
|----------|-------|
| ID | `is_gpp_partner` |
| Label | "Do you practice through a General Professional Partnership (GPP)?" |
| Type | Toggle (Yes / No) |
| Default | No |
| Required | Yes (when visible) |
| Visible When | `business_category == REGULATED_PROFESSIONAL` |
| Help Text | "A GPP is a partnership formed by licensed professionals (e.g., a law firm, accounting firm, or medical group) that is itself tax-exempt at the entity level. If you are a partner receiving a distributive share of GPP net income, your income is classified differently. Most solo practitioners select 'No'." |

**Conditional action — is_gpp_partner = Yes:**
- Shows advisory card (amber): "GPP partners are subject to special rules. The 8% flat rate option is NOT available to GPP distributive share income. This tool will flag items requiring manual review with your accountant. Computation will proceed under Graduated + Itemized or Graduated + OSD."
- Sets `is_gpp_partner = true` in engine input; triggers MRF-025 in engine output.

**Validation Rules:**
1. Required when `business_category == REGULATED_PROFESSIONAL`.

**Error Messages:**
1. (no selection): "Please indicate whether you practice through a General Professional Partnership."

---

**Field: cost_of_goods_sold**

| Property | Value |
|----------|-------|
| ID | `cost_of_goods_sold` |
| Label | "Cost of goods sold (COGS)" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No (defaults to ₱0 if left empty) |
| Visible When | `business_category == TRADER` OR `business_category == MIXED_BUSINESS` |
| Help Text | "Enter the total cost of the goods you purchased or manufactured for sale. This includes the purchase price of inventory, shipping costs to acquire goods, and direct production costs. Do NOT include your own salaries, rent, or overhead here — those go in the expenses section." |

**Validation Rules:**
1. Must be ≥ ₱0.
2. Must be ≤ `gross_receipts` (validated after WS-04 is completed; cross-field).

**Error Messages:**
1. (negative): "Cost of goods sold cannot be negative."
2. (exceeds gross receipts): "Cost of goods sold cannot exceed your gross receipts. If your COGS exceeded your revenue, you have a gross loss — please verify your numbers."

---

## 5. Step WS-03: Tax Year and Filing Period

**Screen title:** "What period are you filing for?"
**Purpose:** Sets `tax_year` and `filing_period`. These determine which rate table applies (2018–2022 vs 2023+) and how many prior-quarter steps appear.
**Engine fields set:** `tax_year`, `filing_period`

### Fields

---

**Field: tax_year**

| Property | Value |
|----------|-------|
| ID | `tax_year` |
| Label | "Tax year" |
| Type | Select (dropdown) |
| Default | 2025 (since today is 2026, 2025 is the most recently completed tax year for annual filers) |
| Required | Yes |
| Visible When | Always |
| Help Text | "Select the calendar year you are filing for. For the Annual ITR due April 15, 2026: select 2025. For quarterly returns during 2026: select 2026." |

**Options:**

| Value | Display Label | Notes |
|-------|--------------|-------|
| 2018 | "2018" | TRAIN law first year; older rate table applies |
| 2019 | "2019" | TRAIN older rates |
| 2020 | "2020" | TRAIN older rates; CREATE 1% PT applies to this year |
| 2021 | "2021" | CREATE 1% PT applies |
| 2022 | "2022" | TRAIN older rates; CREATE 1% PT July 2020–June 2023 |
| 2023 | "2023" | TRAIN 2023+ rate table applies (lower rates); CREATE 1% PT through June 2023; 3% from July 2023 |
| 2024 | "2024" | TRAIN 2023+ rates; 3% PT; EOPT Act effective Oct 27, 2024 |
| 2025 | "2025 (most common)" | TRAIN 2023+ rates; 3% PT; full EOPT Act year; default |
| 2026 | "2026 (current year — quarterly filers only)" | For Q1/Q2/Q3 quarterly returns filed during calendar year 2026 |

**Validation Rules:**
1. Must be an integer between 2018 and 2030 (inclusive).
2. Cannot select a future year for Annual returns (if `mode_selection == ANNUAL` AND `tax_year > 2025` for 2026 current date).
3. For QUARTERLY mode: `tax_year` can be 2026 (current year) for quarterly returns.

**Error Messages:**
1. (out of range): "Please select a valid tax year between 2018 and 2026."
2. (future annual): "You cannot file an Annual ITR for a year that has not yet ended. For quarterly returns in progress, select 'Quarterly Income Tax Return' mode."

**Dynamic advisory shown if `tax_year` is 2023:**
- Amber info card: "For 2023, there are two rate tables. The OLD TRAIN rates apply to January–December 2022 only. The NEW (lower) TRAIN rates apply to 2023 onwards. This tool applies the 2023+ rate table for Tax Year 2023, which is correct per BIR."

**Dynamic advisory shown if `tax_year <= 2022`:**
- Info card (blue): "You are computing tax for {tax_year}. The 2018–2022 graduated rate table applies, with higher brackets than the 2023+ table. Verify your rates with BIR issuances for older years."

---

**Field: filing_period**

| Property | Value |
|----------|-------|
| ID | `filing_period` |
| Label | "Filing period" |
| Type | Radio buttons |
| Default | `ANNUAL` (if `mode_selection == ANNUAL`); `Q1` (if `mode_selection == QUARTERLY`) |
| Required | Yes |
| Visible When | Always |
| Help Text | "Annual: covers the full calendar year (Jan 1–Dec 31). Quarterly: covers Jan–Mar (Q1), Jan–Jun (Q2), or Jan–Sep (Q3) on a cumulative basis." |

**Options (conditional on mode_selection):**

If `mode_selection == ANNUAL`:

| Value | Label |
|-------|-------|
| `ANNUAL` | "Annual Return — Full year (January 1–December 31)" |

(Single option, pre-selected, read-only display for Annual mode.)

If `mode_selection == QUARTERLY`:

| Value | Label | Deadline |
|-------|-------|---------|
| `Q1` | "Q1 — January 1 through March 31" | "Due May 15 of the same year" |
| `Q2` | "Q2 — January 1 through June 30 (cumulative)" | "Due August 15 of the same year" |
| `Q3` | "Q3 — January 1 through September 30 (cumulative)" | "Due November 15 of the same year" |

Note displayed below: "There is no Q4 quarterly return for income tax. Q4 data is reported on your Annual ITR (Form 1701/1701A) due April 15 of the following year."

If `mode_selection == PENALTY`:

| Value | Label | Notes |
|-------|-------|-------|
| `ANNUAL` | "Annual Return (Form 1701 / 1701A)" | Penalty for late annual filing |
| `Q1` | "Q1 Quarterly Return (Form 1701Q)" | Penalty for late Q1 quarterly |
| `Q2` | "Q2 Quarterly Return (Form 1701Q)" | Penalty for late Q2 quarterly |
| `Q3` | "Q3 Quarterly Return (Form 1701Q)" | Penalty for late Q3 quarterly |

**Validation Rules:**
1. Required; must match the options listed for the selected mode.
2. For QUARTERLY mode: must be Q1, Q2, or Q3; Q4 not valid.

**Error Messages:**
1. (no selection): "Please select the filing period."
2. (Q4 attempted): "Q4 is not a valid quarterly filing period for income tax. Select Annual Return to compute your full-year balance."

---

## 6. Step WS-04: Gross Receipts

**Screen title:** "How much did you earn?"
**Purpose:** Captures the primary income inputs: `gross_receipts`, `sales_returns_allowances`, `non_operating_income`, `fwt_income`.
**Engine fields set:** `gross_receipts`, `sales_returns_allowances`, `non_operating_income`, `fwt_income`
**Note:** `cost_of_goods_sold` is already captured in WS-02 for traders. This step focuses on revenue only.

### Fields

---

**Field: gross_receipts**

| Property | Value |
|----------|-------|
| ID | `gross_receipts` |
| Label | "Total gross receipts or sales" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | None (empty) |
| Required | Yes |
| Visible When | Always |
| Help Text | "Enter all income you received from your business or profession during the period — before subtracting any expenses. For freelancers: all amounts clients paid you. For quarterly returns: the cumulative total from January 1 through the end of the quarter, not just the current quarter's receipts." |

**Validation Rules:**
1. Required — cannot be empty or left as ₱0 with no acknowledgment.
2. Must be ≥ ₱0.
3. Must be ≥ `sales_returns_allowances` (cross-field; checked on step completion).
4. Maximum value: ₱9,999,999,999.99.
5. If `filing_period == Q1` AND `gross_receipts == 0`: show WARN advisory but do not block (zero-income Q1 is valid).

**Error Messages:**
1. (empty): "Please enter your gross receipts. Enter ₱0 if you had no income this period."
2. (negative): "Gross receipts cannot be negative."
3. (less than returns): "Gross receipts cannot be less than your sales returns and allowances."
4. (over maximum): "Amount exceeds maximum allowed value. If your income exceeds ₱10 billion, please contact us."

**Dynamic advisories (shown inline below the field as user types, updated on each keypress with 300ms debounce):**

| Condition | Advisory Type | Exact Advisory Text |
|-----------|--------------|---------------------|
| `0 < gross_receipts <= 250000` | Amber | "Your income is ₱250,000 or below. Under the 8% flat rate option, your income tax would be ₱0 — the ₱250,000 is fully exempt. You still need to file a return with BIR." |
| `250000 < gross_receipts <= 3000000` | Green | "You may be eligible for the 8% flat rate option. The optimizer will compare all available methods and recommend the one that saves you the most." |
| `gross_receipts > 3000000` | Orange | "Your gross receipts exceed ₱3,000,000. The 8% flat rate option is NOT available. The optimizer will compare Graduated + OSD versus Graduated + Itemized Deductions." |
| `gross_receipts > 3000000` (and `!is_vat_registered`) | Orange (appended) | "At this income level, you may be required to register for VAT. See Registration Details in a later step." |
| `gross_receipts == 0` | Amber | "You have entered ₱0 for gross receipts. If you had no income this period, you are still required to file a 'no-income' return with BIR by the deadline." |

---

**Field: sales_returns_allowances**

| Property | Value |
|----------|-------|
| ID | `sales_returns_allowances` |
| Label | "Sales returns and allowances (if any)" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Visible When | Always |
| Help Text | "Refunds you gave back to clients, credit memos, or discounts off the invoice price that reduce your gross receipts. Most freelancers leave this at ₱0. Do NOT enter your business expenses here — those are entered separately." |

**Validation Rules:**
1. Must be ≥ ₱0.
2. Must be ≤ `gross_receipts`.

**Error Messages:**
1. (negative): "Sales returns and allowances cannot be negative."
2. (exceeds gross receipts): "Returns and allowances cannot exceed your gross receipts."

---

**Field: non_operating_income**

| Property | Value |
|----------|-------|
| ID | `non_operating_income` |
| Label | "Other business-related income (not subject to final tax)" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Visible When | Always (collapsed inside an expandable "Additional income" section by default) |
| Help Text | "Passive income from your business that is not subject to final withholding tax and is not already included in your gross receipts above. Examples: rental income from a property you own for business use, royalties from professional work where no final tax was withheld. Do NOT include bank interest or dividends here — those go in the next field." |

**Validation Rules:**
1. Must be ≥ ₱0.

**Error Messages:**
1. (negative): "Income cannot be negative."

---

**Field: fwt_income**

| Property | Value |
|----------|-------|
| ID | `fwt_income` |
| Label | "Income already subject to final withholding tax" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Visible When | Always (collapsed inside expandable "Additional income" section by default) |
| Help Text | "Income on which the payor already withheld the FINAL tax — meaning this income is fully taxed and excluded from your income tax return computation. Examples: interest income on bank savings/time deposits (20% FWT), PCSO prize winnings (20% FWT), dividends from domestic corporations (10% FWT). This amount is excluded from the taxable base. Do not add it to gross receipts." |

**Validation Rules:**
1. Must be ≥ ₱0.

**Error Messages:**
1. (negative): "Amount cannot be negative."

---

## 7. Step WS-05: Compensation Income (Mixed Income Only)

**Screen title:** "Your employment income"
**Purpose:** Captures `taxable_compensation` and `compensation_cwt` for mixed-income earners.
**Engine fields set:** `taxable_compensation`, `compensation_cwt`
**Visible When:** `taxpayer_type == MIXED_INCOME`

### Step Introduction Text

Displayed above all fields:
"For mixed-income earners, your salary from employers and your business income are computed together for tax purposes. Your employer(s) already withheld income tax from your salary — enter the NET taxable compensation after all exclusions."

---

**Field: taxable_compensation**

| Property | Value |
|----------|-------|
| ID | `taxable_compensation` |
| Label | "Total taxable compensation income" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | None (empty) |
| Required | Yes (when WS-05 is visible) |
| Visible When | `taxpayer_type == MIXED_INCOME` |
| Help Text | "From your BIR Form 2316 (received from your employer), use the amount on 'Gross Taxable Compensation Income' or Item 22 — which is your gross compensation MINUS non-taxable exclusions (SSS, PhilHealth, Pag-IBIG employee share, 13th month pay up to ₱90,000, de minimis benefits). If you have multiple employers, add up all Form 2316 amounts. Do NOT reduce by income tax withheld — that goes in the next field." |

**Validation Rules:**
1. Required when `taxpayer_type == MIXED_INCOME`.
2. Must be ≥ ₱0.
3. If `taxpayer_type == MIXED_INCOME` AND `taxable_compensation == 0`: show advisory (amber): "You entered ₱0 for compensation. If you truly have no salary income, consider selecting 'Purely Self-Employed' instead. If your compensation was below the non-taxable threshold, ₱0 is correct."

**Error Messages:**
1. (empty when required): "Please enter your taxable compensation. Use ₱0 if your compensation was fully excluded."
2. (negative): "Taxable compensation cannot be negative."

---

**Field: number_of_employers**

| Property | Value |
|----------|-------|
| ID | `number_of_employers` (UI-only; not a direct engine field) |
| Label | "How many employers did you have this year?" |
| Type | Select (dropdown) |
| Default | "1" |
| Required | No |
| Visible When | `taxpayer_type == MIXED_INCOME` |
| Help Text | "If you had more than one employer in the tax year, enter the combined totals from all your Form 2316 certificates in the fields below." |

**Options:**

| Value | Display |
|-------|---------|
| 1 | "1 employer" |
| 2 | "2 employers" |
| 3 | "3 or more employers" |

**Conditional advisory if value > 1:**
- Amber info: "With multiple employers, your total tax withheld may exceed what a single employer would withhold. The engine will reconcile this at the annual level. Make sure you combine all Form 2316 amounts."

---

**Field: compensation_cwt**

| Property | Value |
|----------|-------|
| ID | `compensation_cwt` |
| Label | "Total income tax withheld from your salary (from all Form 2316s)" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | None (empty) |
| Required | Yes (when WS-05 is visible) |
| Visible When | `taxpayer_type == MIXED_INCOME` |
| Help Text | "From your BIR Form 2316, use Item 33 'Total Taxes Withheld'. If you have multiple Form 2316s, add the Item 33 amounts from each. This amount credits against your total income tax due." |

**Validation Rules:**
1. Required when `taxpayer_type == MIXED_INCOME`.
2. Must be ≥ ₱0.
3. Must be ≤ `taxable_compensation × 0.35` (soft check — warn if > 35% effective rate, but do not block; the 35% is the maximum graduated rate).
4. If `compensation_cwt > taxable_compensation`: warn (amber) "Tax withheld exceeds your taxable compensation. Please verify your Form 2316 figures."

**Error Messages:**
1. (empty when required): "Please enter the total tax withheld from your salary."
2. (negative): "Amount cannot be negative."

**Soft warning (non-blocking) — appended as amber advisory card:**
- Condition: `compensation_cwt > taxable_compensation × 0.35`
- Text: "The tax withheld (₱{compensation_cwt}) appears high relative to your compensation (₱{taxable_compensation}). The maximum income tax rate is 35%. Please double-check your Form 2316 figures."

---

## 8. Step WS-06: Expense Method Selection

**Screen title:** "How would you like to handle your business expenses?"
**Purpose:** Determines whether the user enters itemized expenses (Steps WS-07A–WS-07D appear) or uses the 40% OSD (Steps WS-07A–WS-07D are skipped). This is a routing decision, not a final election — the engine still computes all eligible paths.
**Engine fields set:** `osd_elected` (preliminary), routing for WS-07A–WS-07D
**Visible When:** `taxpayer_type == PURELY_SE` OR `taxpayer_type == MIXED_INCOME`

### Step Introduction Text

"To recommend the best tax method, the optimizer needs to know your business expenses. You have two options:"

---

**Field: expense_input_method**

| Property | Value |
|----------|-------|
| ID | `expense_input_method` (UI-only routing field) |
| Label | "How will you enter your expenses?" |
| Type | Radio card group |
| Default | "OSD" |
| Required | Yes |
| Visible When | Always (within WS-06) |

**Options:**

| Option Value | Card Title | Card Description |
|--------------|-----------|-----------------|
| `ITEMIZED` | "Enter my actual expenses" | "I'll enter a detailed breakdown of what I spent on my business. This may save you more tax if your actual expenses exceed 40% of your income. You'll need your receipts and records." |
| `OSD` | "Use the 40% standard deduction (easier)" | "I don't want to track individual expenses. The BIR allows you to deduct 40% of your gross income automatically — no receipts needed. Great if your expenses are below 40% of income or you don't keep detailed records." |
| `NO_EXPENSES` | "I had no significant business expenses" | "My only income source is services billed to clients and I had no notable business costs. The tool will compute using OSD (40%) and 8% flat rate (if eligible)." |

**Conditional behavior:**
- `ITEMIZED` selected: Steps WS-07A, WS-07B, WS-07C, WS-07D are added to the wizard flow.
- `OSD` selected: WS-07A–WS-07D are skipped. Engine receives `ItemizedExpenseInput` with all fields set to ₱0.
- `NO_EXPENSES` selected: WS-07A–WS-07D are skipped. Engine receives `ItemizedExpenseInput` with all fields set to ₱0.

**Note shown below option cards:**
"Regardless of which you choose, the optimizer will always compare all three tax methods (8%, OSD, and Itemized) and tell you which saves the most. If you enter itemized expenses, you get a complete three-way comparison. If you skip expenses, the optimizer assumes ₱0 itemized and ₱0 OSD beats itemized in most cases."

**Advisory shown when `ITEMIZED` is selected:**
- Blue info card: "You'll enter your expenses in the next few steps. You don't need exact figures — reasonable estimates work for tax planning. You'll need exact amounts only if you actually file using Itemized Deductions."

**Advisory shown when `OSD` or `NO_EXPENSES` is selected and `gross_receipts > 0`:**
- Auto-computed preview: "Estimated OSD deduction: ₱{gross_receipts × 0.40 — formatted}. This is 40% of your gross receipts. Taxable income under OSD would be approximately ₱{(gross_receipts - sales_returns_allowances) × 0.60 — formatted}."

**Validation Rules:**
1. A selection is required to continue.

**Error Messages:**
1. (no selection): "Please select how you'll enter your expenses."

---

## 9. Step WS-07A: Itemized Expenses — General Business Costs

**Screen title:** "Your business expenses — General costs"
**Purpose:** Captures the main ordinary and necessary business expense fields from `ItemizedExpenseInput`.
**Engine fields set:** `itemized_expenses.salaries_and_wages`, `itemized_expenses.sss_philhealth_pagibig_employer_share`, `itemized_expenses.rent`, `itemized_expenses.utilities`, `itemized_expenses.communication`, `itemized_expenses.office_supplies`, `itemized_expenses.professional_fees_paid`, `itemized_expenses.travel_transportation`, `itemized_expenses.insurance_premiums`, `itemized_expenses.taxes_and_licenses`, `itemized_expenses.entertainment_representation`, `itemized_expenses.home_office_expense`, `itemized_expenses.home_office_exclusive_use`
**Visible When:** `expense_input_method == ITEMIZED`

### Step Introduction Text

"Enter the amounts you spent on your business this year. Enter ₱0 for any category that doesn't apply to you. All deductions are subject to BIR rules — the engine applies the correct caps and rules automatically."

---

**Field: salaries_and_wages**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.salaries_and_wages` |
| Label | "Salaries and wages paid to employees" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Visible When | Always (within WS-07A) |
| Help Text | "Total gross salaries and wages you paid to your employees or helpers during the year. Do NOT include your own compensation (you are the business owner, not an employee of your own sole proprietorship)." |

**Validation Rules:**
1. Must be ≥ ₱0.

**Error Messages:**
1. (negative): "Amount cannot be negative."

---

**Field: sss_philhealth_pagibig_employer_share**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.sss_philhealth_pagibig_employer_share` |
| Label | "Employer's share of SSS, PhilHealth, and Pag-IBIG contributions" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Visible When | Always (within WS-07A) |
| Help Text | "Only the mandatory employer's share of SSS, PhilHealth, and Pag-IBIG contributions paid for your employees is deductible here. The employee's share (deducted from their salary) is not your expense. Your own voluntary SSS/PhilHealth contributions as a self-employed individual are NOT deductible under this line." |

**Validation Rules:**
1. Must be ≥ ₱0.

**Error Messages:**
1. (negative): "Amount cannot be negative."

---

**Field: rent**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.rent` |
| Label | "Office or workspace rent" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Visible When | Always (within WS-07A) |
| Help Text | "Rent paid for your dedicated office space, co-working desk, or business premises. For home offices, do NOT enter your full home rent here — use the 'Home office' field instead (only the business-use portion qualifies, and only if the space is used exclusively for business)." |

**Validation Rules:**
1. Must be ≥ ₱0.

**Error Messages:**
1. (negative): "Amount cannot be negative."

---

**Field: utilities**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.utilities` |
| Label | "Utilities (electricity, water — business portion)" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Visible When | Always (within WS-07A) |
| Help Text | "Electricity and water bills attributable to your business operations. If you work from home, enter only the business-use portion (e.g., if 20% of your home is used for business, enter 20% of your utility bills here). If you have a dedicated office, enter the full utility bills for that office." |

**Validation Rules:**
1. Must be ≥ ₱0.

**Error Messages:**
1. (negative): "Amount cannot be negative."

---

**Field: communication**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.communication` |
| Label | "Communication and internet costs (business portion)" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Visible When | Always (within WS-07A) |
| Help Text | "Phone, mobile load, and internet subscription costs for business use. If your internet connection is used for both personal and business purposes, enter only the business portion. Most freelancers who work exclusively online claim the full internet subscription." |

**Validation Rules:**
1. Must be ≥ ₱0.

**Error Messages:**
1. (negative): "Amount cannot be negative."

---

**Field: office_supplies**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.office_supplies` |
| Label | "Office supplies and materials" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Visible When | Always (within WS-07A) |
| Help Text | "Stationery, printer ink and paper, small tools, pens, notebooks, and other consumable supplies used in your business. Do NOT include computers or equipment that last more than one year — those are depreciated (enter them in the Depreciation section)." |

**Validation Rules:**
1. Must be ≥ ₱0.

**Error Messages:**
1. (negative): "Amount cannot be negative."

---

**Field: professional_fees_paid**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.professional_fees_paid` |
| Label | "Professional fees paid to others" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Visible When | Always (within WS-07A) |
| Help Text | "Fees paid to accountants, lawyers, consultants, subcontractors, or other professionals who helped your business. Do NOT include your own professional income here — only what you paid others." |

**Validation Rules:**
1. Must be ≥ ₱0.

**Error Messages:**
1. (negative): "Amount cannot be negative."

---

**Field: travel_transportation**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.travel_transportation` |
| Label | "Business travel and transportation" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Visible When | Always (within WS-07A) |
| Help Text | "Transportation costs for business-related travel: fuel, parking, Grab/taxi rides to client sites, airfare and hotel for business trips within the Philippines. Personal travel is NOT deductible. Foreign travel is subject to additional scrutiny by BIR." |

**Validation Rules:**
1. Must be ≥ ₱0.

**Error Messages:**
1. (negative): "Amount cannot be negative."

---

**Field: insurance_premiums**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.insurance_premiums` |
| Label | "Business insurance premiums" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Visible When | Always (within WS-07A) |
| Help Text | "Premiums for business insurance policies: general liability, professional indemnity, property insurance on business assets. Life insurance is deductible ONLY if the death benefit goes to the business, not to your family. Personal life insurance premiums are not deductible." |

**Validation Rules:**
1. Must be ≥ ₱0.

**Error Messages:**
1. (negative): "Amount cannot be negative."

---

**Field: taxes_and_licenses**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.taxes_and_licenses` |
| Label | "Business taxes and licenses (excluding income tax)" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Visible When | Always (within WS-07A) |
| Help Text | "Business registration fees (barangay, municipal, city), professional tax receipts (PTR), documentary stamp taxes paid, and other taxes that are NOT income tax. Do NOT include your income tax or percentage tax here — the engine computes and deducts those separately." |

**Validation Rules:**
1. Must be ≥ ₱0.

**Error Messages:**
1. (negative): "Amount cannot be negative."

---

**Field: entertainment_representation**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.entertainment_representation` |
| Label | "Entertainment, meals, and representation expenses" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Visible When | Always (within WS-07A) |
| Help Text | "Client meals, entertainment costs, and gifts spent for business development. Important: the BIR limits this deduction to 1% of your net revenue (for service businesses) or 0.5% of net sales (for traders). The engine automatically computes the cap and limits your deduction. Enter your actual spending — the engine applies the cap." |

**Validation Rules:**
1. Must be ≥ ₱0.

**Error Messages:**
1. (negative): "Amount cannot be negative."

**Dynamic advisory shown when value > 0:**
- Blue info: "The BIR caps entertainment deductions at 1% of net revenue for service providers. Your estimated cap is ₱{(gross_receipts - sales_returns_allowances) × 0.01 — formatted}. If you entered more than this, the engine will automatically reduce your deductible amount to the cap."

---

**Field: home_office_expense**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.home_office_expense` |
| Label | "Home office expense (monthly rent or mortgage interest)" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Visible When | Always (within WS-07A) |
| Help Text | "If you work from home and have a space used exclusively for business (a dedicated room, not a shared living area), enter the business-use portion of your monthly home rent or mortgage interest × 12. Example: if your rent is ₱15,000/month and your home office is 15% of your home's total floor area, enter ₱15,000 × 12 × 0.15 = ₱27,000." |

**Validation Rules:**
1. Must be ≥ ₱0.
2. If `home_office_expense > 0` AND `home_office_exclusive_use == false`: the engine sets the deductible amount to ₱0; show warning.

**Error Messages:**
1. (negative): "Amount cannot be negative."

---

**Field: home_office_exclusive_use**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.home_office_exclusive_use` |
| Label | "Is this space used exclusively and regularly for business?" |
| Type | Toggle (Yes / No) |
| Default | No |
| Required | Yes (when `home_office_expense > 0`) |
| Visible When | `itemized_expenses.home_office_expense > 0` |
| Help Text | "BIR requires the space to be used EXCLUSIVELY for business — meaning you do no personal activities there. A dedicated home office room qualifies. A dining table, bedroom, or shared living space does NOT qualify even if you work there regularly." |

**Validation Rules:**
1. Required when `home_office_expense > 0`.

**Error Messages:**
1. (not answered when expense > 0): "Please indicate whether the space is used exclusively for business."

**Conditional advisory when `home_office_exclusive_use == false` AND `home_office_expense > 0`:**
- Amber warning: "Since the space is not exclusively used for business, the BIR home office deduction does NOT apply. Your home office expense of ₱{home_office_expense} will NOT be deducted. To claim a home office deduction, the space must be used only for business activities."

---

## 10. Step WS-07B: Itemized Expenses — Financial and Special Items

**Screen title:** "Your business expenses — Financial and special items"
**Purpose:** Captures `interest_expense`, `final_taxed_interest_income`, `casualty_theft_losses`, `bad_debts`, `is_accrual_basis`, `charitable_contributions`, `charitable_accredited`, `research_development`.
**Engine fields set:** All listed above.
**Visible When:** `expense_input_method == ITEMIZED`

---

**Field: interest_expense**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.interest_expense` |
| Label | "Interest expense on business loans" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Visible When | Always (within WS-07B) |
| Help Text | "Gross interest paid on loans used for your business. Personal loans (car loan for personal use, personal credit card interest) are not deductible. Business credit card interest is deductible. The BIR reduces this deduction by 33% of your interest income on bank deposits (to prevent arbitrage). The engine automatically applies this reduction." |

**Validation Rules:**
1. Must be ≥ ₱0.

**Error Messages:**
1. (negative): "Amount cannot be negative."

---

**Field: final_taxed_interest_income**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.final_taxed_interest_income` |
| Label | "Interest income from bank deposits (subject to 20% final tax)" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Visible When | `itemized_expenses.interest_expense > 0` |
| Help Text | "If you earned interest on bank savings accounts or time deposits, enter the gross interest (before the 20% withholding). This is used to compute the 33% arbitrage reduction to your interest expense deduction. If you entered ₱0 for interest expense above, leave this at ₱0." |

**Validation Rules:**
1. Must be ≥ ₱0.

**Error Messages:**
1. (negative): "Amount cannot be negative."

**Dynamic advisory shown when `interest_expense > 0` and `final_taxed_interest_income > 0`:**
- Blue info: "BIR requires a reduction to your interest expense deduction: 33% × ₱{final_taxed_interest_income} = ₱{final_taxed_interest_income × 0.33 — formatted} will be subtracted from the gross interest expense. Net deductible interest: ₱{interest_expense - (final_taxed_interest_income × 0.33) — formatted}."

---

**Field: casualty_theft_losses**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.casualty_theft_losses` |
| Label | "Casualty or theft losses (not covered by insurance)" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Visible When | Always (within WS-07B) |
| Help Text | "Losses of business property due to fire, typhoon, earthquake, flood, or theft that were NOT compensated by insurance. You must reduce this by any insurance recovery. Only business assets qualify (personal property losses are not deductible)." |

**Validation Rules:**
1. Must be ≥ ₱0.

**Error Messages:**
1. (negative): "Amount cannot be negative."

---

**Field: is_accrual_basis**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.is_accrual_basis` |
| Label | "Do you use accrual accounting?" |
| Type | Toggle (Yes / No) |
| Default | No |
| Required | Yes (when bad_debts field is visible) |
| Visible When | Always (within WS-07B) |
| Help Text | "Accrual basis: you record income when earned (invoiced) and expenses when incurred, even if not yet paid. Cash basis: you record income and expenses only when cash changes hands. Most freelancers use cash basis. Bad debts are only deductible under accrual basis." |

---

**Field: bad_debts**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.bad_debts` |
| Label | "Bad debts written off" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Visible When | `is_accrual_basis == true` |
| Help Text | "Receivables from clients that you have formally written off as uncollectible this year. The client owed you money, you previously recognized this as income (accrual basis), you made reasonable collection efforts, and you've now given up on collecting. This deduction is NOT available to cash-basis taxpayers." |

**Validation Rules:**
1. Must be ≥ ₱0.
2. If `itemized_expenses.is_accrual_basis == false` AND `bad_debts > 0`: show error.

**Error Messages:**
1. (negative): "Amount cannot be negative."
2. (accrual basis required): "Bad debts deduction is only available to accrual-basis taxpayers. You indicated you use cash basis accounting. Please correct your accounting method selection or remove this amount."

**Conditional advisory when `bad_debts > 0` and visible:**
- Info: "Bad debts claimed: ₱{bad_debts}. The BIR requires documentation showing: (1) the receivable was previously recognized as income, (2) you made collection efforts, and (3) the debt is genuinely uncollectible. Keep your written-off receivable ledger entries and collection attempt records."

---

**Field: charitable_contributions**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.charitable_contributions` |
| Label | "Charitable contributions and donations" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Visible When | Always (within WS-07B) |
| Help Text | "Donations to BIR-accredited charitable organizations, foundations, or institutions. This is capped at 10% of your taxable income before this deduction. Donations to non-accredited organizations are NOT deductible. The engine automatically applies the cap." |

**Validation Rules:**
1. Must be ≥ ₱0.

**Error Messages:**
1. (negative): "Amount cannot be negative."

---

**Field: charitable_accredited**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.charitable_accredited` |
| Label | "Is the recipient a BIR-accredited charitable organization?" |
| Type | Toggle (Yes / No) |
| Default | No |
| Required | Yes (when `charitable_contributions > 0`) |
| Visible When | `itemized_expenses.charitable_contributions > 0` |
| Help Text | "BIR-accredited organizations have a certificate of accreditation. Examples: Philippine Red Cross, accredited foundations with BIR confirmation. Churches, schools, and NGOs may or may not have BIR accreditation — check their certificates. If you're unsure, select 'No' to be safe — unaccredited donations are not deductible." |

**Conditional advisory when `charitable_accredited == false` AND `charitable_contributions > 0`:**
- Amber warning: "Donations to non-accredited organizations are NOT deductible under NIRC Sec. 34(H). Your charitable contribution of ₱{charitable_contributions} will be excluded from your deductions. If you have an accreditation certificate from the organization, change your answer to 'Yes'."

**Validation Rules:**
1. Required when `charitable_contributions > 0`.

**Error Messages:**
1. (not answered): "Please indicate whether the charitable organization is BIR-accredited."

---

**Field: research_development**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.research_development` |
| Label | "Research and development expenses" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Visible When | Always (within WS-07B) |
| Help Text | "Expenditures for research, product development, or technological innovation directly connected to your business. Must be ordinary and necessary for your business. Speculative or hobby R&D does not qualify." |

**Validation Rules:**
1. Must be ≥ ₱0.

**Error Messages:**
1. (negative): "Amount cannot be negative."

---

## 11. Step WS-07C: Itemized Expenses — Depreciation Assets

**Screen title:** "Your business assets (for depreciation)"
**Purpose:** Captures `depreciation_entries` — one entry per depreciable asset.
**Engine fields set:** `itemized_expenses.depreciation_entries`
**Visible When:** `expense_input_method == ITEMIZED`

### Step Introduction Text

"If you own business equipment, computers, furniture, or vehicles used for your work, you can deduct a portion of their cost each year as depreciation. Enter each asset separately."

**Add Asset button:** "+ Add another asset" — appends a new asset entry form. Initial state: one asset entry form is shown pre-opened. If user has no assets to depreciate, they may click "Skip depreciation — I have no qualifying assets" to proceed with `depreciation_entries = []`.

---

### Asset Entry Form (repeated per asset; each instance is identified by 1-based index)

**Field: asset_name** (within asset entry N)

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.depreciation_entries[N].asset_name` |
| Label | "Asset description" |
| Type | Text |
| Placeholder | "e.g., MacBook Pro 2023, Office desk, Delivery motorcycle" |
| Default | Empty |
| Required | Yes (if the asset entry exists and is not being deleted) |
| Visible When | Asset entry N exists |
| Help Text | "A descriptive name so you can identify this asset in your records." |

**Validation Rules:**
1. Required when the asset entry exists.
2. Non-empty string; at least 2 characters.
3. Maximum 100 characters.

**Error Messages:**
1. (empty): "Please describe this asset."
2. (too long): "Asset description must be 100 characters or fewer."

---

**Field: asset_cost** (within asset entry N)

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.depreciation_entries[N].asset_cost` |
| Label | "Original purchase price" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | None |
| Required | Yes |
| Visible When | Asset entry N exists |
| Help Text | "The amount you paid to acquire this asset. For used assets purchased second-hand, enter the price you paid. For donated assets, enter the fair market value at the time of donation." |

**Validation Rules:**
1. Required.
2. Must be > ₱0 (assets with ₱0 cost produce ₱0 depreciation; prompt user to delete entry if cost is ₱0).

**Error Messages:**
1. (empty): "Please enter the purchase price."
2. (zero or negative): "Purchase price must be greater than ₱0."

**Dynamic advisory for vehicles:**
- If `asset_name` contains any of: "car", "van", "vehicle", "truck", "SUV", "sedan", "motorcycle" (case-insensitive):
  - If `asset_cost > 2400000`: Amber advisory: "Vehicle cost exceeds the BIR's ₱2,400,000 ceiling (RR 12-2012). The engine will cap the depreciation base at ₱2,400,000. The excess ₱{asset_cost - 2400000 — formatted} is non-deductible."
  - If `asset_cost <= 2400000`: No advisory.

---

**Field: salvage_value** (within asset entry N)

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.depreciation_entries[N].salvage_value` |
| Label | "Estimated residual value at end of useful life" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Visible When | Asset entry N exists |
| Help Text | "The estimated value of the asset when it's fully depreciated (e.g., scrap value). Most freelancers leave this at ₱0. For vehicles, a common estimate is ₱50,000–₱100,000." |

**Validation Rules:**
1. Must be ≥ ₱0.
2. Must be < `asset_cost` (salvage value cannot equal or exceed original cost; depreciation would be zero or negative).

**Error Messages:**
1. (negative): "Salvage value cannot be negative."
2. (≥ asset_cost): "Salvage value must be less than the original purchase price."

---

**Field: useful_life_years** (within asset entry N)

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.depreciation_entries[N].useful_life_years` |
| Label | "Useful life (years)" |
| Type | Select (dropdown) |
| Default | "5" (most common for computers and office equipment) |
| Required | Yes |
| Visible When | Asset entry N exists |
| Help Text | "The number of years this asset is expected to be useful for your business. BIR-prescribed useful lives apply. See the guide below for common asset types." |

**Options:**

| Value | Display Label |
|-------|--------------|
| 1 | "1 year" |
| 2 | "2 years" |
| 3 | "3 years (software, mobile phones)" |
| 4 | "4 years" |
| 5 | "5 years (computers, laptops, office equipment, cameras, vehicles)" |
| 6 | "6 years" |
| 7 | "7 years" |
| 8 | "8 years" |
| 9 | "9 years" |
| 10 | "10 years (office furniture, heavy equipment, generators)" |
| 15 | "15 years" |
| 20 | "20 years" |
| 25 | "25 years" |
| 50 | "50 years" |

**Helpful reference panel (expandable below the field):**
"BIR-Prescribed Useful Lives (Common Assets):
- Computer / laptop / tablet: 5 years
- Mobile phone: 3 years
- Camera / video equipment: 5 years
- Software license (perpetual): 3 years
- Office furniture and fixtures: 5–10 years
- Office equipment (printer, scanner): 5 years
- Air conditioning unit: 5–10 years
- Generator set: 10 years
- Delivery motorcycle: 5 years
- Delivery van or light vehicle: 5 years
- Heavy trucks: 10 years
- Building improvements (leasehold): lease term or 5 years, whichever is shorter"

**Validation Rules:**
1. Required.
2. Must be an integer between 1 and 50.

**Error Messages:**
1. (empty): "Please select the useful life."
2. (out of range): "Useful life must be between 1 and 50 years."

---

**Field: acquisition_date** (within asset entry N)

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.depreciation_entries[N].acquisition_date` |
| Label | "Date placed in service" |
| Type | Date picker (YYYY-MM-DD) |
| Default | None (empty) |
| Required | Yes |
| Visible When | Asset entry N exists |
| Help Text | "The date this asset was first used for business. If you're not sure of the exact date, use the first of the month of purchase. For assets purchased in prior years, enter the original purchase date — the engine computes partial-year depreciation for the acquisition year and full-year for subsequent years." |

**Validation Rules:**
1. Required.
2. Must be a valid date (not future-dated beyond `tax_year` December 31).
3. Must be ≥ 1970-01-01 (reasonable lower bound).

**Error Messages:**
1. (empty): "Please enter the date this asset was placed in service."
2. (invalid format): "Please enter a valid date in YYYY-MM-DD format."
3. (future date): "The acquisition date cannot be in the future relative to the tax year being filed."

---

**Field: depreciation_method** (within asset entry N)

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.depreciation_entries[N].method` |
| Label | "Depreciation method" |
| Type | Radio buttons |
| Default | `STRAIGHT_LINE` |
| Required | Yes |
| Visible When | Asset entry N exists |
| Help Text | "Straight-line divides the cost equally over the useful life. Declining balance gives higher deductions in early years. Most freelancers use straight-line for simplicity." |

**Options:**

| Value | Label | Description |
|-------|-------|-------------|
| `STRAIGHT_LINE` | "Straight-line (recommended)" | "Equal deduction each year: (Cost − Salvage) ÷ Useful Life." |
| `DECLINING_BALANCE` | "Declining balance (double)" | "Higher deductions in early years; 2× the straight-line rate applied to the remaining book value." |

**Validation Rules:**
1. Required.

**Error Messages:**
1. (no selection): "Please select a depreciation method."

---

**Field: prior_accumulated_depreciation** (within asset entry N)

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.depreciation_entries[N].prior_accumulated_depreciation` |
| Label | "Prior accumulated depreciation (if asset was acquired in a previous year)" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Visible When | Asset entry N exists AND (`acquisition_date` year < `tax_year`) |
| Help Text | "If you already claimed depreciation on this asset in prior years' tax returns, enter the total amount you've already deducted. The engine uses this to compute the current year's deduction based on the remaining book value. Leave at ₱0 if this is the first year you're deducting depreciation on this asset." |

**Validation Rules:**
1. Must be ≥ ₱0.
2. Must be < `asset_cost` (cannot have deducted more than the asset cost).

**Error Messages:**
1. (negative): "Prior depreciation cannot be negative."
2. (≥ asset_cost): "Prior accumulated depreciation cannot equal or exceed the original cost of the asset."

---

**Delete Asset button (per entry):** "Remove this asset" — removes the entry. Confirmation not required for this non-destructive action (no data is lost yet; user hasn't submitted).

---

## 12. Step WS-07D: Itemized Expenses — NOLCO Carry-Over

**Screen title:** "Net Operating Loss Carry-Over (NOLCO)"
**Purpose:** Captures `nolco_entries` — prior-year losses being claimed under Path A.
**Engine fields set:** `itemized_expenses.nolco_entries`
**Visible When:** `expense_input_method == ITEMIZED`

### Step Introduction Text

"If your business had a net operating loss in a prior year (2022, 2023, or 2024) and you are using itemized deductions, you can carry over that loss as an additional deduction this year. This deduction is ONLY available under Itemized Deductions (not OSD or 8%)."

**Skip option:** "I have no prior-year losses to carry over" button — sets `nolco_entries = []` and proceeds.

---

**Field: has_nolco**

| Property | Value |
|----------|-------|
| ID | `has_nolco` (UI-only routing) |
| Label | "Do you have any unused net operating losses from prior years?" |
| Type | Toggle (Yes / No) |
| Default | No |
| Required | Yes |
| Visible When | Always (within WS-07D) |
| Help Text | "A net operating loss occurs when your total allowable deductions exceed your gross income for the year, resulting in a negative taxable income. Under NIRC Sec. 34(D)(3), you can carry this loss forward for up to 3 years and deduct it from future income." |

---

### NOLCO Entry Form (repeated per loss year; shown only when `has_nolco == true`)

**Add Loss Year button:** "+ Add another loss year" — appends a new NOLCO entry. Maximum 3 entries (3-year FIFO rule: only losses from the 3 years prior to the current tax year are eligible).

---

**Field: loss_year** (within NOLCO entry N)

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.nolco_entries[N].loss_year` |
| Label | "Year the loss was incurred" |
| Type | Select (dropdown) |
| Default | `tax_year - 1` |
| Required | Yes |
| Visible When | NOLCO entry N exists AND `has_nolco == true` |
| Help Text | "The calendar year in which your net operating loss was incurred — not the year you're carrying it over to." |

**Options:** Dynamically generated — shows the three years prior to `tax_year`:
- If `tax_year == 2025`: options are 2022, 2023, 2024
- If `tax_year == 2024`: options are 2021, 2022, 2023
- Pattern: `tax_year - 3`, `tax_year - 2`, `tax_year - 1`

**Validation Rules:**
1. Required.
2. `loss_year` must be between `tax_year - 3` and `tax_year - 1` (inclusive).
3. No two NOLCO entries may have the same `loss_year`.

**Error Messages:**
1. (empty): "Please select the year the loss was incurred."
2. (out of range): "NOLCO can only be carried over for 3 years. Loss from {loss_year} has expired and cannot be claimed in {tax_year}."
3. (duplicate year): "You already entered a NOLCO entry for {loss_year}. Each loss year can only appear once."

---

**Field: original_loss** (within NOLCO entry N)

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.nolco_entries[N].original_loss` |
| Label | "Original net operating loss amount for {loss_year}" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | None |
| Required | Yes |
| Visible When | NOLCO entry N exists |
| Help Text | "The full amount of the net operating loss as reported on your {loss_year} income tax return. This is the total loss, not the remaining balance." |

**Validation Rules:**
1. Required.
2. Must be > ₱0.

**Error Messages:**
1. (empty): "Please enter the original loss amount."
2. (zero or negative): "The original net operating loss must be greater than ₱0."

---

**Field: remaining_balance** (within NOLCO entry N)

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.nolco_entries[N].remaining_balance` |
| Label | "Remaining undeducted balance" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | Equals `original_loss` when `original_loss` is entered |
| Required | Yes |
| Visible When | NOLCO entry N exists |
| Help Text | "How much of the original loss you have NOT yet claimed. If you already deducted some of this loss in an earlier year, enter only the remaining amount. If this is the first year you're claiming it, enter the same amount as the original loss." |

**Validation Rules:**
1. Required.
2. Must be ≥ ₱0.
3. Must be ≤ `original_loss`.

**Error Messages:**
1. (empty): "Please enter the remaining undeducted balance."
2. (negative): "Remaining balance cannot be negative."
3. (exceeds original): "Remaining balance cannot exceed the original loss amount."

---

## 13. Step WS-08: Creditable Withholding Tax (Form 2307)

**Screen title:** "Tax withheld by your clients (BIR Form 2307)"
**Purpose:** Captures `cwt_2307_entries` — all CWT certificates received from clients.
**Engine fields set:** `cwt_2307_entries`
**Visible When:** Always (after WS-01; applicable to all self-employed taxpayers)

### Step Introduction Text

"When Philippine clients pay you for services, they are often required to withhold a portion of your fee and give you a BIR Form 2307. This withheld amount is like a tax pre-payment — you deduct it from your computed income tax due."

---

**Field: has_2307**

| Property | Value |
|----------|-------|
| ID | `has_2307` (UI-only routing) |
| Label | "Did you receive any BIR Form 2307 certificates from clients this year?" |
| Type | Toggle (Yes / No) |
| Default | No |
| Required | Yes |
| Visible When | Always |
| Help Text | "Form 2307 is a certificate your client gives you when they withhold tax. It shows: (1) the client's name and TIN, (2) the amount they paid you, (3) the rate they withheld (usually 5% or 10%), and (4) the total tax withheld. If you only worked for foreign clients or platforms that don't withhold Philippine tax, select No." |

**Advisory shown when `has_2307 == false`:**
- Blue info: "If you worked through platforms like Upwork or Fiverr, check whether your payment processor (e.g., Payoneer, PayPal, GCash) issued you a Form 2307 under BIR RR 16-2023. These may withhold 1% (WI760) on remittances."

---

### Form 2307 Entry Form (shown when `has_2307 == true`; repeated per certificate)

**Add certificate button:** "+ Add another Form 2307" — appends a new entry. No limit enforced in UI (engine accepts up to 50; beyond 50, show error at submission: "You have entered more than 50 Form 2307 entries. Please combine multiple forms from the same payor into a single entry.").

---

**Field: payor_name** (within 2307 entry N)

| Property | Value |
|----------|-------|
| ID | `cwt_2307_entries[N].payor_name` |
| Label | "Client or company name (withholding agent)" |
| Type | Text |
| Placeholder | "e.g., Acme Corporation, Juan Santos" |
| Default | Empty |
| Required | Yes |
| Visible When | 2307 entry N exists |
| Help Text | "The name of the person or company that withheld the tax. This is the name that appears at the top of your Form 2307 as the 'Withholding Agent'." |

**Validation Rules:**
1. Required.
2. Non-empty string, at least 2 characters, maximum 200 characters.

**Error Messages:**
1. (empty): "Please enter the name of the client who withheld this tax."
2. (too short): "Please enter at least 2 characters."
3. (too long): "Name must be 200 characters or fewer."

---

**Field: payor_tin** (within 2307 entry N)

| Property | Value |
|----------|-------|
| ID | `cwt_2307_entries[N].payor_tin` |
| Label | "Client's TIN (Tax Identification Number)" |
| Type | Text |
| Placeholder | "XXX-XXX-XXX-XXXX" |
| Default | Empty |
| Required | No |
| Visible When | 2307 entry N exists |
| Help Text | "The 9- or 12-digit TIN of the withholding agent as shown on their Form 2307. Format: 123-456-789 or 123-456-789-000. Optional — leaving this blank will not affect your tax computation, but TINs may be required if you claim a refund." |

**Validation Rules:**
1. If not empty: must match pattern `\d{3}-\d{3}-\d{3}(-\d{3})?` (9 digits with dashes, optionally followed by `-NNN` branch code).
2. If not empty: digits only (after removing dashes) must total 9 or 12 digits.

**Error Messages:**
1. (invalid format): "Please enter the TIN in the format XXX-XXX-XXX or XXX-XXX-XXX-XXX (e.g., 123-456-789-000)."

---

**Field: atc_code** (within 2307 entry N)

| Property | Value |
|----------|-------|
| ID | `cwt_2307_entries[N].atc_code` |
| Label | "ATC code (Alphanumeric Tax Code)" |
| Type | Select with free-text fallback |
| Default | "WI010" |
| Required | Yes |
| Visible When | 2307 entry N exists |
| Help Text | "The ATC code tells BIR what type of income was withheld. It appears on your Form 2307 in the 'ATC' column. If you're not sure, WI010 (5–10% professional fee) is the most common for freelancers." |

**Dropdown options (searchable):**

| ATC | Display Label | Common Use |
|-----|--------------|-----------|
| WI010 | "WI010 — Professional fee, individual (5% or 10%)" | Most common for freelancers |
| WI011 | "WI011 — Rental income, individual" | Property rental |
| WI157 | "WI157 — Professional fee ≥ ₱720K, individual (15%)" | High-earning professionals |
| WI160 | "WI160 — Additional professional fees, individual (10%)" | Supplemental fees |
| WI760 | "WI760 — E-marketplace / DFSP remittance (1%, RR 16-2023)" | Upwork/Fiverr via Payoneer, GCash |
| WC010 | "WC010 — Professional fee, corporate payee (5% or 10%)" | If your business is incorporated |
| WC760 | "WC760 — E-marketplace, corporate payee (1%)" | Corporate e-marketplace |
| PT010 | "PT010 — Percentage tax (3%), withheld by government" | Government agency clients |
| OTHER | "Other — I'll enter the code manually" | Any unlisted code |

When "OTHER" is selected: show free-text input field with placeholder "Enter ATC code (e.g., WI162)".

**ATC classification preview (shown immediately below the dropdown when value is selected):**

| ATC Selected | Preview Text |
|-------------|-------------|
| WI010–WI160, WC010, WC760, WI760 | Green label: "This credit will apply to your **income tax** due." |
| PT010 | Amber label: "This credit applies to your **percentage tax** (2551Q), NOT your income tax. It does not reduce your Form 1701/1701A balance." |
| OTHER with unrecognized code | Amber label: "Unrecognized ATC code — this will require manual review. The credit will be flagged and NOT automatically applied until the code is confirmed." |

**Validation Rules:**
1. Required.
2. If "OTHER" is selected: the free-text ATC field must be non-empty; pattern `[A-Z]{2}\d{3,4}` recommended but not strictly enforced.

**Error Messages:**
1. (empty): "Please select an ATC code."
2. (OTHER selected but free-text empty): "Please enter the ATC code."

---

**Field: income_payment** (within 2307 entry N)

| Property | Value |
|----------|-------|
| ID | `cwt_2307_entries[N].income_payment` |
| Label | "Gross income on which tax was withheld" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | None |
| Required | Yes |
| Visible When | 2307 entry N exists |
| Help Text | "The total amount the client paid you during this period — before they withheld tax. This should be the gross amount, not your net take-home. Found in the 'Amount of Income Payment' column of your Form 2307." |

**Validation Rules:**
1. Required.
2. Must be > ₱0.
3. Must be ≥ `tax_withheld` for this entry (withheld amount cannot exceed income).

**Error Messages:**
1. (empty): "Please enter the income amount."
2. (zero or negative): "Income payment must be greater than ₱0."
3. (less than tax_withheld): "The income payment cannot be less than the tax withheld."

---

**Field: tax_withheld** (within 2307 entry N)

| Property | Value |
|----------|-------|
| ID | `cwt_2307_entries[N].tax_withheld` |
| Label | "Amount of tax withheld" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | None |
| Required | Yes |
| Visible When | 2307 entry N exists |
| Help Text | "The actual amount withheld by your client. This is shown in the 'Amount of Tax Withheld' column of your Form 2307. For most freelancers at the 5% rate: this equals 5% × income payment. For the 10% rate: 10% × income payment." |

**Auto-hint (shown below field when `income_payment > 0` and `atc_code` is known):**
- WI010: "At 5%: ₱{income_payment × 0.05 — formatted} | At 10%: ₱{income_payment × 0.10 — formatted}"
- WI157: "At 15%: ₱{income_payment × 0.15 — formatted}"
- WI760: "At 1% (on ½ remittance): ₱{income_payment × 0.005 — formatted} (0.5% effective rate per RR 16-2023)"
- PT010: "At 3%: ₱{income_payment × 0.03 — formatted}"

**Validation Rules:**
1. Required.
2. Must be ≥ ₱0.
3. Must be ≤ `income_payment`.

**Error Messages:**
1. (empty): "Please enter the amount withheld."
2. (negative): "Tax withheld cannot be negative."
3. (exceeds income): "Tax withheld cannot exceed the income payment amount."

---

**Field: period_from** and **period_to** (within 2307 entry N)

| Property | Value (period_from) | Value (period_to) |
|----------|--------------------|------------------|
| ID | `cwt_2307_entries[N].period_from` | `cwt_2307_entries[N].period_to` |
| Label | "Period start date" | "Period end date" |
| Type | Date picker | Date picker |
| Default | January 1 of `tax_year` | December 31 of `tax_year` |
| Required | Yes | Yes |
| Help Text | "The start of the quarter or period this 2307 covers." | "The end of the quarter or period this 2307 covers." |

**Validation Rules:**
1. Both required.
2. `period_from` must be ≤ `period_to`.
3. Both dates must be within the `tax_year` (January 1 to December 31 of `tax_year`).

**Error Messages:**
1. (empty): "Please enter the period start/end date."
2. (period_from > period_to): "Period start date cannot be after period end date."
3. (outside tax year): "The period dates must fall within tax year {tax_year}."

---

**Running total display (shown at bottom of WS-08 when at least one 2307 entry exists):**

```
┌─────────────────────────────────────────────────────┐
│  Summary of Tax Credits from Form 2307              │
│                                                     │
│  Income Tax Credits (WI/WC series):    ₱XX,XXX.XX  │
│  Percentage Tax Credits (PT010):       ₱X,XXX.XX   │
│  Credits requiring review (unknown):   ₱X,XXX.XX   │
│                                                     │
│  Total Income Tax Credits:             ₱XX,XXX.XX  │
└─────────────────────────────────────────────────────┘
```

---

## 14. Step WS-09: Prior Quarterly Payments

**Screen title:** "Previous quarterly tax payments this year"
**Purpose:** Captures `prior_quarterly_payments` — payments made on earlier Form 1701Q returns.
**Engine fields set:** `prior_quarterly_payments`
**Visible When:** `filing_period == ANNUAL` OR (`filing_period == Q2` OR `filing_period == Q3`)

### Step Introduction Text (shown for ANNUAL filing):
"If you made quarterly income tax payments during the year (Q1, Q2, or Q3 using Form 1701Q), enter them here. These payments will be credited against your annual tax due."

### Step Introduction Text (shown for Q2 quarterly filing):
"If you made a Q1 quarterly income tax payment earlier this year, enter it here. The Q2 return uses the cumulative method — your Q1 payment is credited against the Q2 tax due."

### Step Introduction Text (shown for Q3 quarterly filing):
"If you made Q1 and/or Q2 quarterly income tax payments earlier this year, enter them here. The Q3 return uses the cumulative method — prior payments are credited against Q3 tax due."

---

**Field: has_prior_payments**

| Property | Value |
|----------|-------|
| ID | `has_prior_payments` (UI-only routing) |
| Label | "Did you make any quarterly income tax payments this year?" |
| Type | Toggle (Yes / No) |
| Default | No |
| Required | Yes |
| Visible When | Always (within WS-09) |
| Help Text | "Quarterly payments are made using BIR Form 1701Q. If this is your first time filing or you didn't file quarterly returns, select 'No'." |

---

### Quarterly Payment Entry Form (shown when `has_prior_payments == true`)

**Available entry slots:** Determined by `filing_period`:
- ANNUAL: up to 3 entries (Q1, Q2, Q3)
- Q2: up to 1 entry (Q1 only)
- Q3: up to 2 entries (Q1 and Q2)

One entry slot per available prior quarter; user fills in the applicable ones and leaves others at ₱0 or skips.

---

**Field: quarterly_payment_amount[Q1]** (Q1 entry)

| Property | Value |
|----------|-------|
| ID | `prior_quarterly_payments[Q1].amount_paid` |
| Label | "Q1 payment made (January–March)" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Visible When | `has_prior_payments == true` AND `filing_period` allows Q1 (i.e., not Q1 mode itself) |
| Help Text | "The net amount you actually paid to BIR for your Q1 1701Q return. This is the payment amount, not the computed tax — if you had CWT credits that reduced what you paid, enter the actual amount remitted. Leave at ₱0 if you didn't file or pay a Q1 return." |

**Validation Rules:**
1. Must be ≥ ₱0.

**Error Messages:**
1. (negative): "Payment amount cannot be negative."

---

**Field: quarterly_payment_date[Q1]**

| Property | Value |
|----------|-------|
| ID | `prior_quarterly_payments[Q1].date_paid` |
| Label | "Q1 payment date" |
| Type | Date picker |
| Default | None (empty) |
| Required | No |
| Visible When | `quarterly_payment_amount[Q1] > 0` |
| Help Text | "The date you paid the Q1 return. Used for reference. If not sure, leave blank." |

**Validation Rules:**
1. If entered: must be a valid date between 2018-01-01 and today.

**Error Messages:**
1. (invalid date): "Please enter a valid date."

---

*(Q2 and Q3 payment fields follow the same pattern as Q1 above, with labels "Q2 payment made (January–June)" and "Q3 payment made (January–September)" respectively; visible based on `filing_period` as described. Field IDs: `prior_quarterly_payments[Q2].amount_paid`, `prior_quarterly_payments[Q2].date_paid`, `prior_quarterly_payments[Q3].amount_paid`, `prior_quarterly_payments[Q3].date_paid`.)*

---

## 15. Step WS-10: Registration and VAT Status

**Screen title:** "Your BIR registration details"
**Purpose:** Captures `is_vat_registered`, `is_bmbe_registered`, `subject_to_sec_117_128`.
**Engine fields set:** `is_vat_registered`, `is_bmbe_registered`, `subject_to_sec_117_128`
**Visible When:** Always (after WS-01; all self-employed taxpayers)

---

**Field: is_bir_registered**

| Property | Value |
|----------|-------|
| ID | `is_bir_registered` (UI-only; not an engine field) |
| Label | "Are you registered with BIR?" |
| Type | Radio buttons |
| Default | "Yes" |
| Required | Yes |
| Visible When | Always |
| Help Text | "BIR registration means you have a TIN and a Certificate of Registration (COR). If you earn from business or professional work, BIR registration is required." |

**Options:**

| Value | Label |
|-------|-------|
| `YES` | "Yes — I have a TIN and Certificate of Registration (Form 2303)" |
| `PLANNING` | "Not yet — I'm planning to register" |

**Conditional advisory when `PLANNING` selected:**
- Amber advisory: "BIR registration is required if your annual income from business or profession exceeds ₱250,000. This tool can still estimate your taxes. Note that you may be subject to penalties for late registration if you are already earning above the threshold."

---

**Field: is_vat_registered**

| Property | Value |
|----------|-------|
| ID | `is_vat_registered` |
| Label | "Are you VAT-registered?" |
| Type | Radio buttons |
| Default | "No" |
| Required | Yes |
| Visible When | Always |
| Help Text | "VAT (Value Added Tax) registration is mandatory if your annual gross sales exceed ₱3,000,000. If you are VAT-registered, you collect 12% VAT from clients in addition to your fees. The 8% flat rate option is NOT available to VAT-registered taxpayers." |

**Options:**

| Value | Label | Consequence |
|-------|-------|------------|
| `NO` | "No — I am not VAT-registered (Non-VAT)" | Path C (8%) may be available; 3% percentage tax applies if gross < ₱3M |
| `YES` | "Yes — I am VAT-registered" | Path C blocked; only Paths A and B available; engine computes VAT-exclusive income |

**Conditional advisory when `YES` selected:**
- Orange advisory: "VAT-registered taxpayers cannot use the 8% flat rate option. The optimizer will compare only Graduated + OSD (Path B) vs Graduated + Itemized Deductions (Path A)."

**Conditional advisory when `NO` selected AND `gross_receipts > 3000000`:**
- Orange advisory: "Your gross receipts of ₱{gross_receipts} exceed ₱3,000,000. You may be required to register for VAT. Operating above the VAT threshold without VAT registration may result in BIR penalties. Consider consulting a CPA about VAT registration."

---

**Field: is_bmbe_registered**

| Property | Value |
|----------|-------|
| ID | `is_bmbe_registered` |
| Label | "Are you registered as a Barangay Micro Business Enterprise (BMBE)?" |
| Type | Toggle (Yes / No) |
| Default | No |
| Required | Yes |
| Visible When | Always (collapsed inside expandable "Special registrations" section) |
| Help Text | "BMBE registration (under RA 9178) exempts micro businesses with total assets of ₱3,000,000 or less from income tax. If you are BMBE-registered with a valid BMBE certificate, your income tax due is ₱0 regardless of income." |

**Conditional advisory when `YES` selected:**
- Green advisory: "BMBE-registered businesses are exempt from income tax under RA 9178. The engine will return ₱0 income tax for all paths. You still have percentage tax obligations (3%) if non-VAT registered."

---

**Field: subject_to_sec_117_128**

| Property | Value |
|----------|-------|
| ID | `subject_to_sec_117_128` |
| Label | "Is your business subject to special percentage taxes (e.g., telecom, transport, electricity, gas, water, franchise)" |
| Type | Toggle (Yes / No) |
| Default | No |
| Required | Yes |
| Visible When | Always (collapsed inside expandable "Special registrations" section) |
| Help Text | "Certain industries pay industry-specific percentage taxes under NIRC Sections 117–128 instead of the general 3% percentage tax under Section 116. These include: franchisees (radio/TV/gas stations), domestic carriers (ships, airlines, buses), IPPs, and telecommunication companies. Most freelancers and professionals select 'No' — this applies to larger businesses." |

**Conditional advisory when `YES` selected:**
- Amber advisory: "Industry-specific percentage taxes (Sec. 117–128) disqualify you from the 8% flat rate option. The engine will compute Paths A and B only."

---

## 16. Step WS-11: Regime Election

**Screen title:** "Have you elected a specific tax method?"
**Purpose:** Sets `elected_regime` — whether the user has formally elected a regime with BIR, or wants the optimizer to recommend one.
**Engine fields set:** `elected_regime`
**Visible When:** Always (after WS-01; for PURELY_SE and MIXED_INCOME taxpayers)

---

**Field: elected_regime**

| Property | Value |
|----------|-------|
| ID | `elected_regime` |
| Label | "Which best describes your situation?" |
| Type | Radio card group |
| Default | null (Optimizer mode) |
| Required | Yes |
| Visible When | Always |
| Help Text | "Your 'election' is how you formally told BIR which tax method you're using. The 8% option must be elected on your first quarterly return (Q1 1701Q). If you're not sure what you elected, select 'I want the optimizer to recommend the best method'." |

**Options:**

| Option Value | Card Title | Card Description | Engine mapping |
|--------------|-----------|-----------------|---------------|
| `null` | "Show me the best option (Optimizer Mode)" | "I want the tool to compute all applicable methods and recommend the one that saves me the most. Best for planning or first-time filers." | `elected_regime = null` |
| `ELECT_EIGHT_PCT` | "I elected the 8% flat rate" | "I formally elected the 8% flat rate on my Q1 1701Q return (or first quarterly return). I want to confirm my tax due under this method." | `elected_regime = ELECT_EIGHT_PCT` |
| `ELECT_OSD` | "I elected the graduated method + 40% OSD" | "I use the standard 40% deduction without tracking individual expenses." | `elected_regime = ELECT_OSD` |
| `ELECT_ITEMIZED` | "I elected the graduated method + itemized deductions" | "I track my actual business expenses and claim them as deductions." | `elected_regime = ELECT_ITEMIZED` |

**Advisory when `ELECT_EIGHT_PCT` selected and `is_vat_registered == true`:**
- Error (blocking): "You indicated you are VAT-registered. The 8% flat rate is NOT available to VAT-registered taxpayers. Please change your election to Graduated + OSD or Graduated + Itemized, or go back and correct your VAT registration status."

**Advisory when `ELECT_EIGHT_PCT` selected and `gross_receipts > 3000000`:**
- Error (blocking): "Your gross receipts exceed ₱3,000,000. The 8% flat rate option is only available to taxpayers with gross receipts at or below ₱3,000,000. Please change your election."

**Advisory when `ELECT_EIGHT_PCT` selected and `is_gpp_partner == true`:**
- Error (blocking): "GPP partners cannot elect the 8% flat rate. Please change your election."

**Advisory when `null` (optimizer) selected:**
- Blue info: "The optimizer will compute all eligible methods and present a three-way comparison. The recommended method will be highlighted. You are not locked into the recommendation — it's for planning only."

**Validation Rules:**
1. Required — one of the four options must be selected.
2. If `ELECT_EIGHT_PCT` selected: engine will validate eligibility; if ineligible (any of the above blocking conditions), the wizard blocks advancement and shows the applicable advisory.

**Error Messages:**
1. (no selection): "Please select your regime election status."

---

## 17. Step WS-12: Filing Details and Return Type

**Screen title:** "Filing details"
**Purpose:** Captures `return_type`, `prior_payment_for_return`, and `actual_filing_date` (for late filing scenarios). Also sets `prior_year_excess_cwt`.
**Engine fields set:** `return_type`, `prior_payment_for_return`, `actual_filing_date`
**Visible When:** Always (final data step before results)

---

**Field: return_type**

| Property | Value |
|----------|-------|
| ID | `return_type` |
| Label | "Is this an original or amended return?" |
| Type | Radio buttons |
| Default | `ORIGINAL` |
| Required | Yes |
| Visible When | Always |
| Help Text | "Original: you are filing this return for the first time. Amended: you are correcting a return you already filed. Amendments must be filed within 3 years of the original due date (or within 3 years from filing date if late)." |

**Options:**

| Value | Label |
|-------|-------|
| `ORIGINAL` | "Original — I am filing this for the first time" |
| `AMENDED` | "Amended — I am correcting a previously filed return" |

---

**Field: prior_payment_for_return**

| Property | Value |
|----------|-------|
| ID | `prior_payment_for_return` |
| Label | "Amount already paid on your original return" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Visible When | `return_type == AMENDED` |
| Help Text | "If you already paid tax when you filed the original return, enter that amount here. It will be credited against the amended balance. Leave at ₱0 if no payment was made on the original return." |

**Validation Rules:**
1. Must be ≥ ₱0 (when visible).

**Error Messages:**
1. (negative): "Prior payment cannot be negative."

---

**Field: is_late_filing**

| Property | Value |
|----------|-------|
| ID | `is_late_filing` (UI-only routing) |
| Label | "Are you filing after the deadline?" |
| Type | Toggle (Yes / No) |
| Default | No |
| Required | Yes |
| Visible When | Always |
| Help Text | "Deadlines: Annual ITR — April 15. Q1 — May 15. Q2 — August 15. Q3 — November 15. If you are filing after your deadline, select 'Yes' to compute penalties (surcharge, interest, and compromise penalty)." |

---

**Field: actual_filing_date**

| Property | Value |
|----------|-------|
| ID | `actual_filing_date` |
| Label | "Actual (or planned) filing date" |
| Type | Date picker |
| Default | Today's date |
| Required | Yes (when `is_late_filing == true`) |
| Visible When | `is_late_filing == true` |
| Help Text | "Enter today's date if you are computing penalties as of today. Enter a future date if you want to estimate penalties for filing on a future date." |

**Validation Rules:**
1. Required when `is_late_filing == true`.
2. Must be a valid date.
3. Must be after the deadline for the selected `filing_period` and `tax_year`.

**Error Messages:**
1. (empty): "Please enter the filing date."
2. (invalid): "Please enter a valid date."
3. (not after deadline): "The date you entered is on or before the deadline for this return. If you are filing on time, select 'No' for late filing."

---

## 18. Step WS-13: Prior Year Carry-Over Credits

**Screen title:** "Prior year carry-over tax credits"
**Purpose:** Captures `prior_year_excess_cwt` — any excess CWT carried over from the previous year's annual ITR.
**Engine fields set:** `prior_year_excess_cwt`
**Visible When:** `filing_period == ANNUAL`

---

**Field: has_prior_year_carryover**

| Property | Value |
|----------|-------|
| ID | `has_prior_year_carryover` (UI-only routing) |
| Label | "Did you carry over an excess tax credit from last year's annual return?" |
| Type | Toggle (Yes / No) |
| Default | No |
| Required | Yes |
| Visible When | Always (within WS-13) |
| Help Text | "If your tax credits (from CWT and quarterly payments) exceeded your income tax due on last year's annual return and you elected 'Carry Over' as your overpayment disposition, you have a credit to apply this year. You can find this on your prior year's Form 1701 or 1701A under 'Tax Credit Carried Over'." |

---

**Field: prior_year_excess_cwt**

| Property | Value |
|----------|-------|
| ID | `prior_year_excess_cwt` |
| Label | "Amount of credit carried over from prior year" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | Yes (when `has_prior_year_carryover == true`) |
| Visible When | `has_prior_year_carryover == true` |
| Help Text | "The exact peso amount shown as 'Carry Over' or 'Credit to be Applied Next Year' on your prior year's annual ITR. This reduces your current year's income tax balance payable." |

**Validation Rules:**
1. Required when visible.
2. Must be ≥ ₱0.

**Error Messages:**
1. (empty when visible): "Please enter the carry-over credit amount."
2. (negative): "Credit amount cannot be negative."

---

## 19. Step Routing Matrix

The following table shows which steps appear for each combination of `mode_selection`, `taxpayer_type`, `expense_input_method`, and `filing_period`.

| Step | Annual PURELY_SE OSD/8% | Annual PURELY_SE Itemized | Annual MIXED_INCOME | Quarterly Q1 | Quarterly Q2/Q3 | Late Filing Mode |
|------|------------------------|--------------------------|---------------------|-------------|-----------------|-----------------|
| WS-00 Mode Selection | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| WS-01 Taxpayer Profile | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| WS-02 Business Type | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| WS-03 Tax Year & Period | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| WS-04 Gross Receipts | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| WS-05 Compensation | — | — | ✓ | Mixed only | Mixed only | Mixed only |
| WS-06 Expense Method | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| WS-07A Gen. Expenses | — | ✓ | ✓ (if itemized) | ✓ (if itemized) | ✓ (if itemized) | ✓ (if itemized) |
| WS-07B Financial Items | — | ✓ | ✓ (if itemized) | ✓ (if itemized) | ✓ (if itemized) | ✓ (if itemized) |
| WS-07C Depreciation | — | ✓ | ✓ (if itemized) | ✓ (if itemized) | ✓ (if itemized) | ✓ (if itemized) |
| WS-07D NOLCO | — | ✓ | ✓ (if itemized) | ✓ (if itemized) | ✓ (if itemized) | ✓ (if itemized) |
| WS-08 Form 2307 CWT | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| WS-09 Prior Qtly Pmts | ✓ (annual) | ✓ (annual) | ✓ (annual) | — | ✓ (Q2/Q3) | ✓ (if annual) |
| WS-10 Registration/VAT | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| WS-11 Regime Election | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| WS-12 Filing Details | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| WS-13 Prior Year Credits | ✓ (annual) | ✓ (annual) | ✓ (annual) | — | — | ✓ (if annual) |

Legend: ✓ = step shown; — = step skipped

---

## 20. Global Validation Constraints

The following cross-field validations are checked at the time the "See My Results" button is clicked (final submission), in addition to per-field validations on each step.

| Constraint ID | Rule | Error Message |
|--------------|------|--------------|
| GV-01 | `gross_receipts >= sales_returns_allowances` | "Sales returns (₱{sales_returns_allowances}) cannot exceed gross receipts (₱{gross_receipts}). Please correct your income figures." |
| GV-02 | `cost_of_goods_sold <= gross_receipts` | "Cost of goods sold (₱{cost_of_goods_sold}) cannot exceed your gross receipts (₱{gross_receipts}). If your costs exceeded revenue, you have a gross loss — verify your numbers." |
| GV-03 | If `taxpayer_type == MIXED_INCOME`: `taxable_compensation > 0` | "Mixed-income earners must have compensation income greater than ₱0. If you have no salary income, change your taxpayer type to 'Purely Self-Employed'." |
| GV-04 | If `taxpayer_type == PURELY_SE`: `taxable_compensation == 0` | "Purely self-employed taxpayers should have ₱0 compensation income. If you have a salary, change your taxpayer type to 'Mixed Income'." |
| GV-05 | `compensation_cwt <= taxable_compensation` (soft check, amber warning, non-blocking) | Advisory: "Tax withheld (₱{compensation_cwt}) exceeds compensation (₱{taxable_compensation}). Verify your Form 2316 figures." |
| GV-06 | Each `DepreciationEntry`: `salvage_value < asset_cost` | "For asset '{asset_name}': salvage value (₱{salvage_value}) must be less than purchase price (₱{asset_cost})." |
| GV-07 | Each `DepreciationEntry`: `prior_accumulated_depreciation < asset_cost` | "For asset '{asset_name}': prior depreciation (₱{prior_accumulated_depreciation}) cannot equal or exceed the purchase price." |
| GV-08 | Each `Form2307Entry`: `tax_withheld <= income_payment` | "For Form 2307 from {payor_name}: tax withheld (₱{tax_withheld}) cannot exceed income payment (₱{income_payment})." |
| GV-09 | Each `Form2307Entry`: `period_from <= period_to` | "For Form 2307 from {payor_name}: period start date cannot be after period end date." |
| GV-10 | Each `NolcoEntry`: `remaining_balance <= original_loss` | "For NOLCO from {loss_year}: remaining balance cannot exceed the original loss." |
| GV-11 | If `elected_regime == ELECT_EIGHT_PCT` AND `is_vat_registered == true` | "You elected the 8% flat rate but you are VAT-registered. The 8% option is not available to VAT-registered taxpayers. Please change your election." |
| GV-12 | If `elected_regime == ELECT_EIGHT_PCT` AND `gross_receipts > 3000000` | "You elected the 8% flat rate but your gross receipts exceed ₱3,000,000. The 8% option is only available at or below the ₱3,000,000 threshold." |
| GV-13 | If `is_late_filing == true` AND `actual_filing_date` is not after deadline | "The filing date you entered ({actual_filing_date}) is on or before the deadline for this return. Change 'Are you filing late?' to 'No' or enter a later date." |
| GV-14 | Each `NolcoEntry`: no duplicate `loss_year` values | "You have two NOLCO entries for {loss_year}. Each loss year can only appear once." |
| GV-15 | Each `QuarterlyPayment`: `amount_paid >= 0` | "Quarterly payment amounts cannot be negative." |
| GV-16 | `prior_year_excess_cwt >= 0` | "Prior year carry-over credit cannot be negative." |
| GV-17 | If `itemized_expenses.bad_debts > 0` AND `is_accrual_basis == false` | "Bad debts deduction requires accrual-basis accounting. You indicated you use cash basis. Please correct your accounting method or remove the bad debts amount." |
| GV-18 | If `itemized_expenses.home_office_expense > 0` AND `home_office_exclusive_use == false` | Advisory (non-blocking): "Home office deduction requires exclusive business use of the space. Since you indicated mixed use, the engine will set the home office deduction to ₱0." |
| GV-19 | `prior_quarterly_payments` length ≤ 3 | "Cannot enter more than 3 quarterly payment entries (Q1, Q2, Q3)." |
| GV-20 | `cwt_2307_entries` length ≤ 50 | "Maximum 50 Form 2307 entries allowed. Please combine multiple forms from the same payor into a single entry." |

---

## 21. Dynamic Advisories and Contextual Guidance

The following real-time advisories are computed client-side as the user fills in the wizard, displayed as colored cards or inline notes. These do not block form submission — they are informational.

| Advisory ID | Trigger Condition | Type | Advisory Text |
|------------|------------------|------|--------------|
| DA-01 | `gross_receipts > 0` AND `gross_receipts <= 250000` | Amber | "Your income is at or below ₱250,000. Under the 8% flat rate, your income tax is ₱0 — you are fully covered by the ₱250,000 exemption. You still need to file a return with BIR." |
| DA-02 | `gross_receipts > 3000000` AND `!is_vat_registered` | Orange | "Gross receipts exceed ₱3,000,000. The 8% flat rate is unavailable. Consider speaking with a CPA about VAT registration obligations." |
| DA-03 | `is_vat_registered == true` | Orange | "VAT-registered taxpayers cannot use the 8% flat rate. Only Paths A and B will be computed." |
| DA-04 | `is_bmbe_registered == true` | Green | "BMBE-registered businesses are exempt from income tax. All paths will show ₱0 income tax due." |
| DA-05 | `is_gpp_partner == true` | Amber | "GPP partners cannot use the 8% flat rate. The computation will be limited to Paths A and B, with certain items flagged for manual review." |
| DA-06 | `expense_input_method == ITEMIZED` AND sum of all expense fields < `gross_receipts × 0.40` | Blue | "Your itemized expenses total ₱{total_itemized}. This is less than the 40% OSD (₱{osd_amount}). Unless your receipts include more expenses not yet entered, the OSD method may save you more." |
| DA-07 | `expense_input_method == ITEMIZED` AND sum of all expense fields > `gross_receipts × 0.40` | Green | "Your itemized expenses total ₱{total_itemized}, which exceeds the 40% OSD (₱{osd_amount}). Itemized deductions may give you a better result if you have documentation." |
| DA-08 | Sum of all `cwt_2307_entries.tax_withheld` (income tax type) > estimated income tax under best regime | Blue | "Your CWT credits (₱{total_cwt}) may exceed your estimated income tax due. You may have an overpayment. The results screen will show your options: carry over, refund, or TCC." |
| DA-09 | `return_type == AMENDED` | Amber | "Amended returns must be filed within 3 years of the original due date. For tax year {tax_year}, the last date to amend is April 15, {tax_year + 4}. Verify that this deadline has not passed." |
| DA-10 | `filing_period == ANNUAL` AND `prior_quarterly_payments` is empty | Blue | "You have not entered any quarterly tax payments. If you filed quarterly returns (1701Q) for Q1, Q2, or Q3, those payments reduce your annual balance. Go back to add them if applicable." |
| DA-11 | `atc_code == PT010` for any 2307 entry | Amber | "Form 2307 with ATC PT010 is a percentage tax credit — it applies to your 2551Q percentage tax, NOT your income tax. This will be shown separately in your results." |
| DA-12 | `is_late_filing == true` | Orange | "Late filing penalties will be computed and shown in your results. Penalties include: surcharge ({surcharge_rate}), interest (6% or 12% per annum depending on your tier), and a compromise penalty." |
| DA-13 | `tax_year <= 2022` | Blue | "You are computing for tax year {tax_year}. Older rate tables apply. Verify your results against BIR issuances for that year." |
| DA-14 | All `cwt_2307_entries` have `atc_code == WI760` | Blue | "All your Form 2307 entries use WI760 (RR 16-2023 platform withholding). This is correct for Upwork/Fiverr payments via Payoneer or GCash. The 1% rate applies on half the remittance amount (0.5% effective rate)." |
