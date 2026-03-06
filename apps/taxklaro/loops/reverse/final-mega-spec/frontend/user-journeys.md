# User Journeys — Philippine Freelance & Self-Employed Income Tax Optimizer

**Status:** COMPLETE
**Last updated:** 2026-03-02
**Cross-references:**
- Wizard steps (field-level detail): [frontend/wizard-steps.md](wizard-steps.md)
- Results views: [frontend/results-views.md](results-views.md)
- Engine pipeline: [engine/pipeline.md](../engine/pipeline.md)
- Scenario codes: [domain/scenarios.md](../domain/scenarios.md)
- Premium tiers: [premium/tiers.md](../premium/tiers.md)

---

## Overview

Eight distinct user journeys are defined for this product. Each journey is specified from entry point through every screen, decision, and follow-up action. Every leaf node is a concrete outcome — no branch ends with "varies" or "depends on context."

| ID | Journey Name | User Type | Filing Mode | Primary Goal |
|----|-------------|-----------|-------------|--------------|
| UJ-01 | Freelancer First-Timer | New taxpayer, never filed | Annual optimizer | Learn which regime + see exact tax due |
| UJ-02 | Returning Annual Filer | Existing user, annual ITR | Annual optimizer | Confirm regime + get annual balance payable |
| UJ-03 | Mixed Income Earner | Employee with side income | Annual optimizer | Compute combined income + choose biz regime |
| UJ-04 | VAT-Registered Professional | >₱3M earner, VAT-registered | Annual optimizer | Compare OSD vs Itemized (8% not available) |
| UJ-05 | Quarterly Filer | Any self-employed | Quarterly (Q1/Q2/Q3) | Compute this quarter's payment due |
| UJ-06 | Platform Freelancer | Upwork/Fiverr/Toptal user | Annual or quarterly | Handle RR 16-2023 CWT + multi-2307 inputs |
| UJ-07 | CPA / Bookkeeper | Professional preparer | Any | Process one client's return efficiently |
| UJ-08 | Late / Penalty Computation | Missed deadline filer | Annual or quarterly | Know exact penalty + total amount due |

---

## UJ-01: Freelancer First-Timer

**User profile:** Filipino freelancer, age 22–30, earns income on Upwork/local platforms or does copywriting/design. Has been freelancing 6–18 months. Never filed a BIR return. Doesn't know if they need to, or which form. Has heard about "8 percent" from a Facebook group but doesn't understand it.

**Entry point:** Google search for "freelance tax philippines 2026" or "8 percent tax option philippines" → landing page hero CTA "Compute My Tax Now — Free." No account required.

### Screen Flow Diagram

```
Landing Page
    ↓ [CTA: Compute My Tax Now — Free]
Step 1: Taxpayer Profile (what kind of earner are you?)
    ↓ [User selects: Purely Self-Employed / Freelancer]
Step 2: Income Source (what's your business type?)
    ↓ [User selects: Professional services (no inventory)]
Step 3: Gross Receipts (how much did you earn this year?)
    ↓ [User enters amount, e.g. ₱600,000]
Step 4: Expenses (did you have business expenses?)
    ↓ [User answers YES → enters itemized breakdown OR NO → skips]
Step 5: CWT / 2307 (did clients withhold tax from your payments?)
    ↓ [User answers YES → enters CWT amount OR NO → skips]
Step 6: Registration Status (are you VAT-registered?)
    ↓ [User selects NO (non-VAT) — typical for <₱3M earner]
    ↓ [If gross receipts < ₱250,000: WARN-001 advisory shown]
Results: Three-regime comparison + recommended regime
    ↓ [User sees savings comparison]
    ↓ Option A: Save computation (requires free account creation)
    ↓ Option B: Download summary PDF (requires Pro upgrade)
    ↓ Option C: Share result link (free, read-only shareable URL)
    ↓ Option D: Start over / modify inputs
```

### Step-by-Step Detail

**Step 1 — Taxpayer Profile**

Screen title: "Let's find your best tax option"
Prompt: "Which best describes you?"
Options (radio buttons):
1. "I'm purely self-employed / freelancing (no employer)" → sets `taxpayer_type = PURELY_SE`
2. "I have a job AND earn freelance income" → routes to UJ-03 (Mixed Income) from Step 2
3. "I only have a salary from an employer" → shows informational modal "This tool is for self-employed and freelance income. If you only have a salary, your employer already handles your tax via payroll." No further computation. CTA: "Learn about freelance income tax →"

Decision gate: User selects option 1 to continue UJ-01.

**Step 2 — Income Source**

Screen title: "What type of business or profession do you have?"
Prompt: "Select the category that best describes how you earn money."
Options (radio buttons):
1. "Professional services — IT, design, writing, consulting, marketing, etc." → sets `taxpayer_class = PROFESSIONAL`
2. "Professional with government-regulated license — doctor, lawyer, CPA, engineer, architect" → sets `taxpayer_class = PROFESSIONAL`; adds advisory: "If you practice through a General Professional Partnership (GPP), select below."
   - Sub-option: "I practice through a GPP" → sets `is_gpp_partner = true`; routes to Manual Review Flag MRF-005 advisory
3. "Product-based business — I sell goods, products, merchandise" → sets `taxpayer_class = TRADER`; shows field for `cost_of_goods_sold`
4. "Both products and services" → sets `taxpayer_class = MIXED`; shows COGS field
5. "I'm not sure" → shows contextual helper: "If you primarily exchange time/skill for money (freelancing, consulting, tutoring), choose 'Professional services'. If you primarily sell physical goods, choose 'Product-based'."

Help text below options: "This affects whether the 8% option applies and how your deductions are calculated."

**Step 3 — Tax Year and Filing Period**

Screen title: "What period are you filing for?"
Year selector: dropdown 2018–2026, default 2025 (previous calendar year for April 2026 filers).
Period selector: "Annual Return (full year)" is pre-selected for UJ-01.
Note: "For quarterly returns (Q1/Q2/Q3), use the Quarterly Filing mode." Link: "Switch to quarterly mode →"

**Step 4 — Gross Receipts**

Screen title: "How much did you earn?"
Label: "Total gross receipts (before any deductions)"
Input: peso amount field; placeholder "e.g., 600000"
Help text: "Enter your total invoiced amounts / deposits received for the year. Don't subtract any expenses yet."
Contextual guidance shown dynamically:
- If user enters ≤ ₱250,000: amber advisory: "Your income is at or below ₱250,000. Under the 8% option, your tax would be ₱0 (₱250,000 is exempt). You still need to file a return."
- If user enters > ₱3,000,000: orange advisory: "Your gross receipts exceed ₱3,000,000. The 8% flat rate option is NOT available for you. The tool will compute Graduated + OSD vs Graduated + Itemized Deductions."
- Otherwise: no advisory (normal range).

Additional field: "Sales returns and allowances (if any)" — optional, defaults to ₱0. Help text: "Refunds or discounts you gave clients that reduce your gross receipts. Most freelancers leave this at ₱0."

**Step 5 — Business Expenses**

Screen title: "Did you have business expenses?"
Toggle: "Yes, I have expenses to deduct" / "No, I have no significant expenses"

If YES:
- Sub-question: "Do you want to enter itemized expenses or use the simplified method?"
  - "Enter my actual expenses (may save more if expenses > 40% of income)" → shows ItemizedExpensesForm (see wizard-steps.md for all fields)
  - "Use the simplified 40% deduction (Optional Standard Deduction)" → no additional fields needed; engine auto-computes OSD
- Note shown: "You don't need receipts for the 40% OSD method. The engine will compare both methods and recommend the best."

If NO:
- Advisory: "No expenses entered. The 8% flat rate will likely be your best option (if eligible). The OSD and itemized paths will produce the same result: 60% of your income as taxable."

**Step 6 — Creditable Withholding Tax (CWT)**

Screen title: "Did clients withhold tax from your payments?"
Explanation: "When Filipino clients pay you for services and you're not VAT-registered, they're required to withhold 5%–10% of your fee and give you a BIR Form 2307 certificate. This withheld tax can be deducted from what you owe."

Toggle: "Yes, I received BIR Form 2307 certificates" / "No, no tax was withheld"

If YES:
- "How many 2307 certificates did you receive?" — number selector 1–50
- For each certificate (up to entry):
  - Payor name (text)
  - Amount of income on which tax was withheld (peso field)
  - Amount of tax withheld (peso field) — auto-computed as hint: "typically 5% or 10% of the income amount"
  - ATC code (optional dropdown: WI010 5%, WI011 10%, WI760 1% platform, other)
- Total CWT summary shown: "Total tax credits from 2307s: ₱X,XXX"

If NO:
- Field skipped. `total_cwt_credits = 0`.

**Step 7 — Registration and VAT Status**

Screen title: "Registration details"
Question 1: "Are you registered with BIR?" (required)
- "Yes, I have a TIN and Certificate of Registration (COR)" → continue
- "Not yet, I'm just planning" → advisory: "You can still use this tool to estimate your taxes. Note: if your annual income exceeds ₱250,000, BIR registration is required. We'll show you how to compute based on your situation."

Question 2: "Are you VAT-registered?" (shown only if Q1 = yes)
- "No, I am not VAT-registered" → typical for <₱3M earners
- "Yes, I am VAT-registered" → routes to UJ-04 branch

Question 3: "Did you register your 8% option election?" (shown if gross < ₱3M and PURELY_SE)
- "Yes, I elected the 8% flat rate" → sets `elected_regime = PATH_C`
- "No, I did not specifically elect 8% — I'm not sure" → sets `elected_regime = null` (optimizer mode; engine recommends)
- "I elected the graduated method" → sets `elected_regime = PATH_A_OR_B` (engine selects between A and B)

Help text: "The 8% election must be made on your first quarterly return (Q1 1701Q due May 15) or on your first return if registering mid-year. If you didn't make an explicit election, the engine will show you which is best and what you should elect for future years."

**Results Screen**

After submission, engine computes all applicable paths. Results page shows:

Section 1 — Recommended Regime (prominent, colored highlight):
```
✓ RECOMMENDED: 8% Flat Rate (Path C)
Your estimated annual income tax: ₱28,000
You save ₱14,320 vs. the graduated method
```

Section 2 — Three-way comparison table (collapsed by default, expandable):
```
                    Path C (8%)    Path B (OSD)    Path A (Itemized)
Gross Receipts      ₱600,000       ₱600,000        ₱600,000
Deduction           ₱250,000       ₱240,000        ₱180,000 (actual)
Taxable Income      ₱350,000       ₱360,000        ₱420,000
Income Tax          ₱28,000        ₱42,320         ₱62,000
Percentage Tax      ₱0 (waived)    ₱18,000         ₱18,000
TOTAL               ₱28,000        ₱60,320         ₱80,000
```
Note: If Path C not eligible, its column shows "Not Available" with reason.

Section 3 — CWT Credit and Balance Payable:
```
Tax Under Recommended Regime:    ₱28,000
Less: Creditable Withholding Tax: (₱5,000)
Annual Balance Payable:           ₱23,000
Due by: April 15, 2026
```

Section 4 — What to do next:
- "Download your computation summary (PDF) — Pro" [upgrade prompt for free users]
- "Save this result" — requires free account creation
- "Share this result" — generates shareable URL
- "Learn how to file Form 1701A →" — link to content article
- "Set deadline reminders" — email reminders for April 15 (free feature)

Section 5 — Disclaimer (always visible, below results):
"This computation is an estimate for planning purposes only. It is not a substitute for professional tax advice. Results are based on the information you provided. Verify all figures with your registered tax agent or accountant before filing."

**Follow-Up Actions**

1. User creates free account → computation saved → returns next year for UJ-02 flow
2. User upgrades to Pro → downloads PDF → shares with their CPA
3. User clicks "How to file Form 1701A" → reads content article
4. User clicks "Set reminders" → enters email → receives April 15 reminder
5. User modifies inputs → recalculates → sees updated comparison in real-time

**Error States Visible to User**

| Condition | Screen | Message |
|-----------|--------|---------|
| Gross receipts > ₱999,999,999 | Step 4 | "Please enter an amount below ₱1,000,000,000. For amounts this large, consult a CPA directly." |
| CWT > income tax due (all paths) | Results | Amber advisory: "Your withheld tax exceeds your tax due under all regimes. You may be entitled to a tax refund or TCC. Consider applying for refund via BIR Form 1914." |
| Expenses > 100% of gross | Step 5 | Inline: "Business expenses cannot exceed your gross receipts. Please review your amounts." |
| Year selected < 2018 | Step 3 | "TRAIN Law rate tables begin in 2018. For earlier years, tax rates differ. The tool only supports 2018–2026." |

---

## UJ-02: Returning Annual Filer

**User profile:** Self-employed professional who used the tool last year or is familiar with Philippine tax. Has kept income/expense records. Wants to quickly confirm regime and get exact balance payable. Comfortable with tax terminology.

**Entry point:** Bookmarked URL, email deadline reminder link, or logged-in returning session. If logged in, previous year's data is pre-loaded for comparison reference.

### Screen Flow Diagram

```
Dashboard (logged in) → "New Computation" button
    ↓
[Pre-filled: taxpayer profile, VAT status from last year — confirm or update]
Step 1: Confirm taxpayer profile (prefilled from saved data)
Step 2: Update income for current year
Step 3: Update expenses for current year
Step 4: Update CWT certificates (new 2307s this year)
Step 5: Regime lock (did you already elect a regime this year on your Q1 1701Q?)
Results: Full comparison with year-over-year savings summary
    ↓
Option A: Download PDF (Pro)
Option B: Compare to last year (Pro)
Option C: Open quarterly tracker (Pro)
```

### Step-by-Step Detail

**Step 1 — Profile Confirmation**

Screen title: "Confirm your details for [Tax Year]"
Prefilled fields from saved profile (from previous year):
- Taxpayer type (PURELY_SE / MIXED_INCOME)
- Business type (Professional / Trader / Mixed)
- VAT status

Each field has a pencil icon to edit. User confirms by clicking "Looks right, continue →" or edits as needed.

If any field changed (e.g., user became VAT-registered this year): advisory shown "Your VAT status has changed. This affects which regimes are available."

**Step 2 — Income Update**

Same as UJ-01 Step 4, but with previous year's values shown as placeholder/hint:
- "Last year you entered: ₱X,XXX,XXX" shown in muted text below the field.
- User enters current year gross receipts.
- Dynamic threshold advisories same as UJ-01.

**Step 3 — Expense Update**

If user used itemized last year: previous year's itemized categories shown as starting point. User can increment/decrement each line or start fresh.
If user used OSD last year: no pre-fill needed; just confirm "Use 40% OSD again" or switch to itemized.

New field (UJ-02 only): "Did you carry over a Net Operating Loss (NOLCO) from prior year?"
- If YES: enter prior year's allowable loss amount. Engine applies NOLCO deduction under Path A only.

**Step 4 — CWT Update**

Same as UJ-01 Step 6. Previous year's payor list shown as template; user can copy payors and enter new amounts.

**Step 5 — Regime Lock**

Screen title: "Did you already elect a tax regime this year?"
Explanation: "Your regime election is made on your first quarterly return (Q1 1701Q, due May 15). If you already filed Q1, your regime is locked for this year."

Options:
- "I already filed Q1 and elected the 8% flat rate" → sets `elected_regime = PATH_C`; engine computes Path C only; shows savings vs. graduated
- "I already filed Q1 and elected graduated (OSD or itemized)" → sets `elected_regime = PATH_A_OR_B`; engine computes Paths A and B and recommends the better one
- "I haven't filed Q1 yet (planning / first time this year)" → `elected_regime = null`; full optimizer mode

**Results Screen**

Same structure as UJ-01 but with additional panel:
- Year-over-year comparison (Pro): "Last year you owed ₱XX,XXX. This year: ₱XX,XXX. Difference: ₱X,XXX [more/less]."
- Regime consistency note: if engine recommends a different regime than last year, amber advisory: "The recommended regime changed from last year. You can only change regimes at the start of a new year (Q1 election). If your Q1 is already filed, you must use your elected regime."

**Follow-Up Actions**

1. Pro user: download prefilled PDF summary → send to CPA or self-file via eBIRForms
2. Pro user: open quarterly tracker → see Q1/Q2/Q3 payments vs. annual balance
3. Free user: see results, manually copy figures into eBIRForms
4. Set reminder for next year's Q1 deadline (May 15)

---

## UJ-03: Mixed Income Earner (Employee + Freelancer)

**User profile:** Full-time employee (receives monthly salary, employer handles payroll tax via BIR Form 2316) who also does freelance work on the side. Confused about which form to file (1701 vs 1701A), whether their ₱250K exemption applies, and how their salary and freelance income interact.

**Entry point:** Search for "employed and freelancing tax philippines" or "form 1701 mixed income" → landing page → selects "I have a job AND earn freelance income" on profile step.

### Screen Flow Diagram

```
Landing Page
    ↓ [CTA]
Step 1: Profile — selects "I have a job AND earn freelance income"
    → sets taxpayer_type = MIXED_INCOME
Step 2: Compensation income details
Step 3: Freelance/business income details
Step 4: Business expenses
Step 5: CWT on freelance income
Step 6: Registration and regime election
Results: Mixed-income computation showing both income streams
    ↓
Download Form 1701 prefill PDF (Pro)
    ↓
Quarterly tracker for freelance income (Pro)
```

### Step-by-Step Detail

**Step 2 — Compensation Income**

Screen title: "Tell us about your employment income"
Explanation: "Your salary income is always taxed at graduated rates — your employer handles this. We need it to compute your combined income for the correct tax bracket."

Fields:
1. "Total taxable compensation for the year" (peso field)
   - Help text: "Find this on your BIR Form 2316 (certificate from your employer). Look for 'Gross Taxable Compensation Income' or line 23."
   - If user has multiple employers: "Add another employer" link — can add up to 10 Form 2316 entries
2. "Tax withheld on compensation (from Form 2316)" (peso field)
   - Help text: "Look for 'Total Amount of Tax Withheld' on your Form 2316. This offsets your total income tax."
3. "Were you a minimum wage earner?" (toggle Yes/No)
   - If YES: compensation is tax-exempt; `taxable_compensation = 0`; only business income taxable
4. "Did you work for more than one employer this year?" (toggle Yes/No)
   - If YES: user enters each employer's Form 2316 separately; engine aggregates

**Step 3 — Freelance/Business Income**

Same fields as UJ-01 Step 4, but with additional context:
"Your freelance/business income is separate from your salary. We'll compute the best regime for your business income, then combine everything for your total tax."

Note on ₱250K exemption: "Important: The ₱250,000 exemption under the 8% option does NOT apply when you have any salary income. Your 8% rate applies directly on your full business gross receipts."
This note appears prominently, as this is the #1 confusion point for mixed income earners.

**Step 4 — Business Expenses**

Same as UJ-01 Step 5. Itemized or OSD for business portion only.

**Step 5 — CWT on Freelance Income**

Same as UJ-01 Step 6, but labeled "CWT from freelance clients only." The compensation_cwt was captured in Step 2.

**Step 6 — Regime Election**

Mixed income specific question: "For your freelance/business income, which regime applies?"
(Explanation: "Your salary is always graduated. For your freelance income, you can choose 8% flat or graduated method.")
Options same as UJ-01 Step 7 regime election.

**Results Screen**

Mixed income results layout has two panels:

Panel 1 — Business Income Regime Comparison:
```
                    Path C (8%)    Path B (OSD)    Path A (Itemized)
Business Gross      ₱480,000       ₱480,000        ₱480,000
Business Tax Due    ₱38,400        ₱37,720         ₱42,160
Note: No ₱250K deduction for mixed income earners on Path C
```

Panel 2 — Combined Income Tax:
```
                    Path C (8%)    Path B (OSD)    Path A (Itemized)
Business Tax Due    ₱38,400        ₱37,720         ₱42,160
Compensation Tax    ₱XX,XXX        ₱XX,XXX         ₱XX,XXX
Total IT Due        ₱XX,XXX        ₱XX,XXX         ₱XX,XXX
Less CWT (comp)     (₱XX,XXX)      (₱XX,XXX)       (₱XX,XXX)
Less CWT (biz)      (₱X,XXX)       (₱X,XXX)        (₱X,XXX)
BALANCE PAYABLE     ₱XX,XXX        ₱XX,XXX         ₱XX,XXX
```

Recommended regime highlighted: which business regime produces lowest TOTAL balance payable.

Form routing notice: "You must file BIR Form 1701 (not 1701A) because you have mixed income. The simplified 1701A is only for purely self-employed individuals."

**Follow-Up Actions**

1. Download Form 1701 prefill guide (PDF, Pro)
2. See quarterly freelance tracker — tracks Q1/Q2/Q3 business income payments (Pro)
3. Share result with employer's HR/CPA for coordination

---

## UJ-04: VAT-Registered Professional

**User profile:** High-earning professional (doctor, IT consultant, architect) with gross receipts > ₱3,000,000. Already VAT-registered. Knows the 8% option is not available. Wants to compare OSD vs. Itemized deductions to minimize income tax. May also want VAT computation.

**Entry point:** Search for "income tax OSD vs itemized philippines VAT registered" or direct referral from CPA. Professional user; comfortable with numbers.

### Screen Flow Diagram

```
Landing Page
    ↓
Step 1: Profile — PURELY_SE
Step 2: Income Source — Professional
Step 3: Gross Receipts — user enters > ₱3,000,000
    → System shows: "The 8% option is NOT available (gross > ₱3M). Computing OSD vs. Itemized."
    → Path C column hidden in results; no confusion
Step 4: Business Expenses — itemized expense entry
Step 5: VAT details — VAT output, input VAT credits
Step 6: CWT
Results: OSD vs Itemized comparison only
    ↓
Download Form 1701 prefill (Pro)
    ↓
VAT return helper (Pro — separate product feature)
```

### Step-by-Step Detail

**Step 3 — Gross Receipts (VAT Context)**

When gross_receipts > ₱3,000,000, the dynamic advisory triggers:
"Your gross receipts exceed ₱3,000,000. This means:
- The 8% flat rate option is NOT available to you
- You should be (or become) VAT-registered
- We'll compare Graduated + OSD vs. Graduated + Itemized to find your best outcome"

If user previously had < ₱3M but just crossed threshold: additional advisory: "Have you registered for VAT? If your cumulative receipts exceeded ₱3M mid-year, you were required to register for VAT from the quarter following the quarter you crossed the threshold. Missing VAT registration may result in penalties."

**Step 4 — VAT Details**

Screen title: "VAT computation (optional but recommended)"
Explanation: "As a VAT-registered taxpayer, you collect 12% VAT from clients. Your income tax is computed on VAT-exclusive amounts."

Fields:
1. "Are your gross receipts above VAT-inclusive or VAT-exclusive?"
   - Radio: "VAT-inclusive (12% already in the amount)" → engine divides by 1.12 to get VAT-exclusive
   - Radio: "VAT-exclusive (12% is added on top)" → amount used as-is
2. "Total input VAT credits for the year" (optional, peso field)
   - Help text: "Input VAT from your purchases of goods/services used in your business. This affects your VAT payable, not your income tax."

Note: "This tool computes your INCOME TAX only. VAT computation (Form 2550) is separate and not covered here. The figures above are used only to correctly identify your VAT-exclusive gross income for income tax purposes."

**Step 5 — Itemized Expense Entry**

Same as UJ-01 itemized path, but for VAT-registered:
- All expense amounts should be VAT-exclusive
- Advisory: "Enter amounts net of input VAT (the 12% portion you claimed as input VAT credit is not deductible for income tax)."

**Results Screen**

Two-column comparison (no Path C):
```
                    Path B (OSD)           Path A (Itemized)
Gross Receipts      ₱4,200,000             ₱4,200,000
Deduction           ₱1,680,000 (40%)       ₱2,100,000 (actual)
Net Taxable Inc.    ₱2,520,000             ₱2,100,000
Tax (graduated)     ₱567,500               ₱447,500
RECOMMENDED         —                      ✓ Saves ₱120,000
```

Note on Path C: "Path C (8% flat rate) is not available because your gross receipts exceed ₱3,000,000. Only Path A (Itemized) and Path B (OSD) apply."

Form routing notice: "File BIR Form 1701. Form 1701A is only for 8% option filers."

---

## UJ-05: Quarterly Filer (1701Q Mode)

**User profile:** Self-employed person computing their Q1, Q2, or Q3 quarterly return. May be mid-year. Needs the incremental payment due for this quarter after crediting previous quarters.

**Entry point:** Email deadline reminder ("Q2 1701Q due August 15 — compute now"), or direct navigation to "Quarterly Filing" tab from the tool.

### Screen Flow Diagram

```
Tool Homepage
    ↓ [Tab: "Quarterly Return (1701Q)"]
Step 1: Select quarter (Q1 / Q2 / Q3) and year
Step 2: Taxpayer profile (same as annual)
Step 3: Cumulative gross receipts YTD
Step 4: Cumulative expenses YTD (if applicable)
Step 5: CWT for the current quarter (new 2307s this quarter)
Step 6: Prior quarter payments and regime
Results: This quarter's income tax payment due
    ↓
Optional: Save quarterly data to annual tracker (Pro)
    ↓
Print/save quarterly summary
```

### Step-by-Step Detail

**Step 1 — Quarter Selection**

Screen title: "Quarterly Income Tax Return (Form 1701Q)"
Explanation: "Quarterly returns cover cumulative income from January 1 to the end of the selected quarter. Each quarter's payment is incremental — you subtract prior payments."

Quarter selector (radio):
- Q1: January 1 – March 31. Due: May 15
- Q2: January 1 – June 30 (cumulative). Due: August 15
- Q3: January 1 – September 30 (cumulative). Due: November 15
Year: dropdown 2018–2026, default current year

First-year registrant option: "I registered mid-year (not Jan 1)" toggle
- If YES: shows registration quarter selector
  - "I registered in Q1 (Jan–Mar)" → standard flow
  - "I registered in Q2 (Apr–Jun)" → first return is Q2; Q1 not required
  - "I registered in Q3 (Jul–Sep)" → first return is Q3
  - "I registered in Q4 (Oct–Dec)" → no quarterly returns this year; annual only

**Step 3 — Cumulative Gross Receipts YTD**

Label: "Total gross receipts from January 1 through [end of selected quarter]"
Sub-label: "Enter your CUMULATIVE total, not just this quarter's receipts."
Example shown: "Example: If you earned ₱150,000 in Q1 and ₱200,000 in Q2, enter ₱350,000 for Q2."

**Step 5 — CWT for Current Quarter**

Label: "New 2307 certificates received this quarter only"
Advisory: "For Q2, only enter 2307s you received between April 1 and June 30. Don't include Q1 certificates again."

**Step 6 — Prior Quarter Information**

Screen title: "Previous quarterly payments"

For Q1 (no prior payments):
- This section is skipped; no prior quarterly IT or CWT to enter.

For Q2:
- "Q1 income tax you already paid" (peso field) — help: "The amount you paid on your Q1 1701Q"
- "Q1 CWT credits already used" (peso field) — help: "CWT certificates you already applied in Q1"
- "Regime you elected on Q1 return" (radio: 8% flat / OSD / Itemized)

For Q3:
- "Q1 + Q2 income tax already paid" (peso field) — combined prior payments
- "Q1 + Q2 CWT credits already applied" (peso field)
- "Regime elected" (radio: 8% flat / OSD / Itemized)

**Results Screen**

Quarterly results are simpler — only showing the elected/recommended regime:

```
Quarterly 1701Q Summary — Q2 2025

Cumulative YTD (Jan–Jun):
  Gross Receipts:          ₱700,000
  Less OSD (40%):         (₱280,000)
  Net Taxable Income:      ₱420,000
  Cumulative IT Due:        ₱42,500

Less: Prior Quarter Payments
  Q1 IT Paid:             (₱18,250)
  Q1 CWT Applied:          (₱5,000)

Less: New CWT This Quarter: (₱7,500)

Q2 PAYMENT DUE:           ₱11,750
Due by: August 15, 2025

Percentage Tax (2551Q):
  Cumulative gross:        ₱700,000
  Less: prior two quarters ₱300,000 billed separately in Q1
  This quarter's receipts: ₱400,000
  Q2 2551Q PT due:         ₱12,000
  (Filed separately; due: August 25)
```

Note: "This is the amount for your 1701Q (income tax quarterly return). Your percentage tax (Form 2551Q) is filed separately with a different deadline."

---

## UJ-06: Platform Freelancer (Upwork / Fiverr / Toptal)

**User profile:** Filipino freelancer earning primarily through Upwork, Fiverr, or Toptal. Payments via Payoneer, PayPal, or Wise. Subject to RR 16-2023 1% withholding on platform remittances. May also have direct client CWT (5%). Confused about how platform withholding works vs. direct client 2307.

**Entry point:** Search for "Upwork tax philippines 2026" or "payoneer tax withholding philippines" → specialized landing content → tool.

### Screen Flow Diagram

```
Landing Page (SEO: "Upwork Tax Philippines")
    ↓
Standard UJ-01 flow Steps 1-3
    ↓ [At CWT step — special routing]
Step 5 (CWT): "Where do you earn from?" — special platform section
    → "Upwork/Fiverr/Platform" tab shown
    → RR 16-2023 explanation
    → 1% platform withholding entry (ATC WI760)
    → Client direct 2307 entry (ATC WI010 / WI011)
    ↓
Results: Same three-regime comparison; CWT includes both platform + client withholding
```

### Step-by-Step Detail

**Step 5 — CWT / Platform Withholding**

Screen title: "Tax withheld by platforms and clients"
Tabbed interface:

Tab 1: "Platform withholding (Upwork, Fiverr, Payoneer)"
Explanation: "Under BIR Revenue Regulation 16-2023, e-marketplace operators like Upwork and Payoneer must withhold 1% of every remittance to Philippine sellers. This withheld amount is reported on a BIR Form 2307 (ATC WI760)."
Fields:
- "Platform name" (text, pre-fills: Upwork / Fiverr / Toptal / Other)
- "Total remittances for the year" (peso field) — auto-converts from USD if needed (see below)
- "1% withheld by platform" (auto-computed: remittances × 0.01, editable)
- "Did you receive a Form 2307 from the platform?" (toggle) — advisory if NO: "If you haven't received a 2307 from Upwork/Payoneer, you may still claim the credit based on your platform earnings reports. Contact the platform's support for PH tax documentation."
- Currency converter: "My platform income is in USD" toggle → shows USD amount field + "Exchange rate" field (defaulting to BSP official rate for the tax year, editable)

Tab 2: "Direct client withholding (2307 from Philippine clients)"
Same as UJ-01 Step 6.

Tab 3: "Summary"
Shows aggregate: "Total CWT credits for the year: ₱XX,XXX (Platform: ₱X,XXX + Direct clients: ₱X,XXX)"

**Currency Handling**

For platform freelancers who enter USD amounts:
- Tool shows current year's BSP annual average exchange rate (e.g., 2025 average: ₱56.50/USD)
- User can override with their actual exchange rate
- Note: "Use the Bangko Sentral ng Pilipinas (BSP) annual average exchange rate for the tax year, or the rate at time of remittance. The BSP rate for [year] is ₱XX.XX/USD. Source: BSP Statistical Interactive Database."
- Converted peso equivalent shown alongside USD input

**Results Screen**

Same as UJ-01 results, with additional note:
"Computation includes ₱X,XXX in platform withholding (RR 16-2023) and ₱X,XXX in direct client withholding. Both are counted as Creditable Withholding Tax (CWT) credits."

If total CWT > tax due under recommended regime: orange advisory with specific amounts and refund instructions.

---

## UJ-07: CPA / Bookkeeper (Professional Preparer Mode)

**User profile:** Certified Public Accountant or bookkeeper who prepares returns for multiple self-employed clients. Needs to process 5–50+ returns efficiently. Wants batch input, per-client PDF export, and a professional dashboard. Pays for the Pro or Enterprise tier.

**Entry point:** Direct referral, social media (CPA Facebook groups), or organic search "tax software philippines CPA". Signs up for Pro/Enterprise directly (no free-then-upgrade friction for this user).

### Screen Flow Diagram

```
Pro/Enterprise Signup
    ↓
CPA Dashboard (multi-client view)
    ↓
[+ Add New Client] button
    ↓
Client Profile Setup
    ↓
Per-client computation flow (same as UJ-01 to UJ-04, but faster entry)
    ↓
Results per client
    ↓
Per-client PDF export (Pro)
    ↓
Batch export (all clients, CSV or PDF bundle) (Enterprise)
    ↓
Client sharing (send results link to client email) (Pro)
```

### Step-by-Step Detail

**CPA Dashboard**

Screen layout:
```
╔══════════════════════════════════════════════════╗
║  TaxOptPH — Professional Dashboard               ║
║  [+ Add Client]  [Batch Import CSV]  [Export All]║
╠══════════════════════════════════════════════════╣
║  Clients (24)           Filter: [All ▼] [Year ▼] ║
╠══════════════════════════════════════════════════╣
║  Name           TIN        Status    Tax Due      ║
║  Juan dela Cruz 123-456-789 ✓ Done   ₱28,000     ║
║  Maria Santos   234-567-890 ⚠ Review ₱0 (refund) ║
║  Carlos Reyes   345-678-901 ○ Draft  —            ║
║  ...                                              ║
╚══════════════════════════════════════════════════╝
```

Status values:
- `○ Draft` — data entry in progress
- `✓ Done` — computation complete
- `⚠ Review` — manual review flag triggered (MRF present in result)
- `✗ Error` — validation error in input data

**Client Profile Setup**

CPA enters per client:
- Client legal name (text)
- TIN (formatted: XXX-XXX-XXX-XXXX)
- Taxpayer type (PURELY_SE / MIXED_INCOME)
- Business type
- VAT status
- All income, expense, and CWT fields (same as UJ-01 to UJ-04 steps)
- Regime already elected (if Q1 already filed)

Speed features:
- Copy profile from existing client (useful for similar client types)
- Import last year's data for returning clients
- Bulk CSV import for experienced CPAs (Enterprise): upload CSV with all client data; engine processes in batch; dashboard shows results

**Per-Client PDF Export**

Pro feature. Each client PDF includes:
- Client name and TIN
- Tax year and filing period
- Three-regime comparison table
- Recommended regime with savings explanation
- Balance payable or refund amount
- Filing deadline
- Disclaimer text (see legal/disclaimers.md)
- Prepared by: CPA name, firm name, PRC number (configurable in account settings)

**Batch Operations (Enterprise)**

- Export all clients to CSV: TIN, gross, expenses, IT due per regime, recommended regime, balance payable
- Send results to all clients by email (configured email templates)
- API access for integration with accounting software

**Follow-Up Actions**

1. Download PDF per client → attach to eBIRForms submission
2. Email results to client → client reviews and approves
3. Export batch CSV → import into CPA's own records
4. Set bulk deadline reminders for all clients

---

## UJ-08: Late / Penalty Computation

**User profile:** Self-employed person who missed a filing or payment deadline. May have missed one or multiple quarters, or the annual. Wants to know: How much total do I owe now (tax + penalties + interest)? Are there any amnesty programs?

**Entry point:** Search for "BIR penalty late filing philippines", or existing user who notices they missed a deadline from the calendar widget.

### Screen Flow Diagram

```
Tool Homepage → "Penalty Calculator" tab
    ↓
Step 1: Select return type (1701Q / 1701 / 2551Q) and period
Step 2: Enter original tax due (if known) or compute from scratch
Step 3: Enter filing/payment date (actual date taxpayer is paying now)
Step 4: Taxpayer tier (for EOPT penalty rates)
Results: Penalty breakdown (surcharge + interest + compromise) + total due
    ↓
Information on BIR abatement program
    ↓
Print penalty computation for BIR submission
```

### Step-by-Step Detail

**Step 1 — Return Type and Period**

Return type selector:
- Annual ITR (Form 1701 or 1701A) — deadline: April 15 of year following tax year
- Q1 1701Q — deadline: May 15
- Q2 1701Q — deadline: August 15
- Q3 1701Q — deadline: November 15
- Q2 2551Q (percentage tax) — deadline: August 25
- Q1 2551Q — deadline: April 25

Period: Tax year + quarter (if applicable)

**Step 2 — Original Tax Due**

Option A: "I already know my tax due" → enter amount
Option B: "Compute my tax first" → launches standard UJ-01 computation first; amount flows in automatically

**Step 3 — Filing Date**

Date picker: "What date are you filing / paying now?"
System computes days late automatically.

"Did you voluntarily disclose (filing BEFORE BIR assessment)?" — toggle
- YES: 25% surcharge (MICRO/SMALL: 10%), no 50% fraud surcharge
- NO (already received BIR notice): 25% surcharge may be locked; advisory to consult BIR

**Step 4 — Taxpayer Tier**

Same as main tool — MICRO / SMALL / MEDIUM / LARGE. Determines EOPT penalty rates.

**Results Screen**

```
Penalty Computation
Return: Annual ITR 2024 (Form 1701)
Original tax due:        ₱48,000
Filed late by:           187 days (deadline: April 15 → filed October 19)
Taxpayer tier:           MICRO

Surcharge (10% for MICRO):       ₱4,800
Interest: 6% × ₱48,000 × 187/365 = ₱1,467.95
Compromise penalty:              ₱3,000 (tax ≥ ₱20,000, ≤ ₱50,000 bracket)

TOTAL AMOUNT DUE:               ₱57,267.95
(Basic tax ₱48,000 + Surcharge ₱4,800 + Interest ₱1,467.95 + Compromise ₱3,000)

Payment deadline: Pay as soon as possible to stop interest accrual.
Interest continues to accrue at ₱7.89/day (6% × ₱48,000 / 365).
```

Abatement advisory (always shown): "The BIR offers abatement of penalties for voluntary disclosure under Revenue Regulations 18-2013. If you file and pay before receiving a BIR assessment, you may apply for 50% abatement of surcharge and compromise penalty. Consult a CPA or BIR RDO for the abatement procedure."

**Follow-Up Actions**

1. Print penalty computation for personal records
2. Print for BIR submission (official-looking summary with disclaimer)
3. Learn about abatement via content article link
4. Compute next quarter/year in advance via calendar reminders

---

## Cross-Journey Decision Gates

The following decisions apply across multiple journeys and have the same handling regardless of which journey triggers them.

### Gate 1: Gross Receipts vs. ₱3,000,000 Threshold

| Condition | Route | User Message |
|-----------|-------|-------------|
| gross_receipts_net ≤ ₱3,000,000 | All three paths computed | Standard three-column comparison shown |
| gross_receipts_net > ₱3,000,000 | Paths A and B only | "8% option not available above ₱3M. Comparing OSD vs. Itemized." Path C column hidden. |
| gross_receipts_net = ₱3,000,000 exactly | All three paths computed | Path C available. Boundary condition advisory: "Your gross equals exactly ₱3M. The 8% option is still available (threshold is ₱3M, not 'less than ₱3M'). You are in the SMALL EOPT tier, not subject to VAT." |

### Gate 2: Elected Regime vs. Engine Recommendation

| Condition | Route | User Message |
|-----------|-------|-------------|
| `elected_regime = null` | Optimizer mode — all paths | Show all paths; highlight recommended |
| `elected_regime = PATH_C` AND engine recommends PATH_C | Locked mode — Path C highlighted | "Great — your elected regime matches the optimal choice." |
| `elected_regime = PATH_C` AND engine recommends PATH_A or B | Locked mode — show both | Amber advisory: "You elected 8% flat rate, but the Graduated method would save you ₱X,XXX. Your election is locked for this year. Consider switching next year (elect on your first Q1 1701Q for [next year])." |
| `elected_regime = PATH_A_OR_B` AND engine recommends PATH_C | Locked mode — show graduated only | Amber advisory: "You elected Graduated method, but 8% flat rate would save you ₱X,XXX. Your election is locked for this year. Consider switching next year." |

### Gate 3: CWT Exceeds Tax Due

| Condition | Route | User Message |
|-----------|-------|-------------|
| total_cwt > it_due_recommended | CWT credit shown; balance = 0 | Orange advisory: "Your withheld tax (₱X,XXX) exceeds your income tax under the [regime] method (₱X,XXX). You have a tax overpayment of ₱X,XXX. Options: (1) Claim refund via BIR Form 1914 (takes 2+ years); (2) Apply as credit against next year's tax; (3) Request Tax Credit Certificate (TCC). Consult your RDO." Balance payable shown as ₱0. |
| total_cwt = it_due_recommended | Balance = 0 exactly | "Your withheld tax exactly covers your tax due. No additional payment required." |
| total_cwt < it_due_recommended | Normal balance payable | Standard results shown |

### Gate 4: Manual Review Flags Triggered

| Condition | Route | User Message |
|-----------|-------|-------------|
| One or more MRF codes triggered | Amber flag panel shown in results | "Items requiring professional review: [list of MRF descriptions]. The engine has used conservative assumptions for these items (see below). Consult a CPA or tax attorney for final determination." Each MRF shows its code, description, and the conservative assumption used. |
| MRF-001 (BMBE-registered) triggered | Computation continues; tax = 0; flag shown | "You indicated BMBE registration. Under RA 9178, BMBE registrants are exempt from income tax. This tool shows ₱0 income tax for reference. Verify your BMBE registration is current with your LGU." |

### Gate 5: Free vs. Pro Feature Gates

| User Action | Free | Pro | Enterprise |
|-------------|------|-----|-----------|
| Compute tax (annual) | ✓ Unlimited | ✓ Unlimited | ✓ Unlimited |
| View three-regime comparison | ✓ | ✓ | ✓ |
| Download PDF export | ✗ Upgrade prompt | ✓ | ✓ |
| Save computation history | ✗ One saved | ✓ Unlimited | ✓ Unlimited |
| Quarterly tracker (link Q1/Q2/Q3/annual) | ✗ | ✓ | ✓ |
| Year-over-year comparison | ✗ | ✓ | ✓ |
| Multiple clients | ✗ (self only) | ✗ (self only) | ✓ Up to 200 |
| Batch CSV import | ✗ | ✗ | ✓ |
| API access | ✗ | ✗ | ✓ |
| White-label branding | ✗ | ✗ | ✓ |
| Email deadline reminders | ✓ (1 per year) | ✓ (all deadlines) | ✓ (all clients) |
| Share result link | ✓ | ✓ | ✓ |

Upgrade prompt design: Non-blocking modal shown when free user attempts a Pro action. CTA: "Unlock with Pro — ₱199/month". Secondary: "Maybe later" (dismisses). Never shown mid-computation — only after results are displayed.

---

## Journey State Machine

Every user journey passes through these states. The system tracks current state per session.

| State | Description | Next States |
|-------|-------------|------------|
| `LANDING` | User on landing page | `STEP_1` (click CTA), `LANDING` (scroll) |
| `STEP_1` | Profile selection screen | `STEP_2` (form valid), `STEP_1` (error) |
| `STEP_2` | Income source screen | `STEP_3` (continue), `STEP_1` (back) |
| `STEP_3` | Gross receipts entry | `STEP_4` (continue), `STEP_2` (back) |
| `STEP_4` | Expense entry | `STEP_5` (continue), `STEP_3` (back) |
| `STEP_5` | CWT entry | `STEP_6` (continue), `STEP_4` (back) |
| `STEP_6` | Registration/status | `COMPUTING` (submit), `STEP_5` (back) |
| `COMPUTING` | Engine running (< 200ms) | `RESULTS` (success), `ERROR` (validation fail) |
| `RESULTS` | Results page | `MODIFY` (edit), `SAVE` (account prompt), `EXPORT` (Pro), `NEW` (start over) |
| `MODIFY` | Edit specific step | `COMPUTING` (resubmit) |
| `ERROR` | Validation error shown | `STEP_N` (return to failing step) |
| `SAVE_PROMPT` | Account creation modal | `RESULTS` (dismissed), `ACCOUNT_CREATED` (signed up) |
| `ACCOUNT_CREATED` | New free account | `RESULTS` (continues), `DASHBOARD` (if Pro) |
| `DASHBOARD` | Pro/Enterprise user home | `STEP_1` (new comp), `CLIENT_LIST` (Enterprise) |

Back-navigation: every step has a "← Back" button. Changes to earlier steps trigger re-computation when user re-reaches Step 6/Submit.
Browser back button: supported. Form state preserved in URL query params (no sensitive data; only form structure state — which sections are expanded, which step is active).

---

## Accessibility Requirements for All Journeys

(Detail in [ui/accessibility.md](../ui/accessibility.md))

- All form steps navigable by keyboard (Tab, Shift+Tab, Enter, Space)
- Screen reader announces step number and progress: "Step 3 of 6: How much did you earn?"
- Error messages announced via aria-live="assertive"
- Results comparison table has appropriate ARIA table roles and column/row headers
- Every CTA button has a non-generic aria-label (e.g., "Compute my tax — opens results page" not just "Submit")
- Focus management: on step transition, focus moves to step heading
- No auto-advancing steps — user explicitly clicks Continue
- Timeout: no session timeout while user is actively editing (only timeout after 60 minutes of total inactivity)

---

## Mobile Behavior for All Journeys

(Detail in [frontend/responsive-behavior.md](responsive-behavior.md))

- Wizard: single-column layout on mobile; step indicator condensed to dots
- Results: three-column comparison collapses to tabbed view on mobile (one regime per tab)
- All currency inputs: numeric keyboard triggered on mobile (input type="number", inputmode="numeric")
- CWT certificate entry: full-screen modal on mobile (not inline table)
- PDF export prompts: "Upgrade to Pro" modal is full-screen sheet on mobile
- Dashboard (CPA users): client list becomes swipeable card view on mobile
- Touch targets: all buttons minimum 44×44px
