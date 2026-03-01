# Decision Trees — Philippine Freelance & Self-Employed Income Tax Optimizer

**Status:** PARTIAL (populated from eight-percent-option aspect; additional trees to be added in regime-comparison-logic, vat-vs-percentage-tax, mixed-income-rules, and other Wave 2 aspects)
**Last updated:** 2026-03-01
**Legal basis:** See [legal-basis.md](legal-basis.md)

---

## How to Read These Trees

- Each tree starts from a root question.
- Every branch reaches a LEAF NODE — a concrete outcome.
- `[ACTION: ...]` = the engine takes this action, user sees this result.
- `[ERROR: ...]` = user sees an error or flag; engine stops this path.
- `[FLAG: MRF-XXX]` = manual review flag; see [manual-review-flags.md](manual-review-flags.md).
- All leaf nodes include a regulatory reference.

---

## DT-01: 8% Option Eligibility

**Root question:** Is the 8% income tax option available to this taxpayer?

**Legal basis:** NIRC Sec. 24(A)(2)(b); RR 8-2018 Part I; RMC 50-2018

```
START: Is the taxpayer an individual (natural person)?
│
├── NO → [ACTION: OUT_OF_SCOPE — only individuals file 1701/1701A. Engine does not support corporate/partnership entities.]
│         [Legal: NIRC Sec. 24 applies only to individuals; corporations file 1702]
│
└── YES → Does the taxpayer have ANY self-employment or professional income?
          (i.e., income from sole proprietorship, freelancing, or practice of profession)
          │
          ├── NO (purely compensation income only) →
          │    [ACTION: EIGHT_PCT = INELIGIBLE. Reason: Pure employees have no regime choice.
          │     Regime = GRADUATED_RATES_COMPENSATION only. No quarterly IT filing required
          │     (employer does substituted filing via Form 2316). Ref: NIRC Sec. 24(A)(2)(a).]
          │
          └── YES → Is the taxpayer VAT-registered?
                    (Check: does BIR COR show VAT as a registered tax type?)
                    │
                    ├── YES → [ACTION: EIGHT_PCT = INELIGIBLE. Reason: VAT registration bars 8% election.
                    │          Available paths: Graduated+OSD or Graduated+Itemized only.
                    │          Percentage tax does NOT apply (VAT registered).
                    │          Ref: RR 8-2018 Sec. 2(A), NIRC Sec. 24(A)(2)(b).]
                    │
                    └── NO → Is the taxpayer's annual gross sales/receipts
                              + other non-operating income ≤ ₱3,000,000?
                              (Use projected or actual year-to-date if filing mid-year)
                              │
                              ├── NO (> ₱3,000,000) →
                              │    [ACTION: EIGHT_PCT = INELIGIBLE. Reason: Exceeds ₱3M threshold.
                              │     Available paths: Graduated+OSD or Graduated+Itemized only.
                              │     Note: VAT registration is now REQUIRED — flag for user.
                              │     Ref: NIRC Sec. 24(A)(2)(b); NIRC Sec. 236(G).]
                              │
                              └── YES (≤ ₱3,000,000) →
                                   Is the taxpayer a partner in a General Professional Partnership (GPP)
                                   computing tax on their GPP DISTRIBUTIVE SHARE?
                                   │
                                   ├── YES (GPP partner, computing on GPP share) →
                                   │    [ACTION: EIGHT_PCT = INELIGIBLE for this income stream.
                                   │     Reason: GPP distributes net income already net of partnership expenses.
                                   │     Partners cannot apply further deductions or 8% option to GPP share.
                                   │     If the partner ALSO has separate non-GPP self-employment income,
                                   │     that separate income MAY be eligible — run DT-01 again for that income.
                                   │     Ref: RMC 50-2018; RR 8-2018 Part I ineligibility list.]
                                   │
                                   └── NO (not GPP partner, or has non-GPP self-employment) →
                                        Is the taxpayer subject to OTHER percentage taxes
                                        under NIRC Sections 117–128?
                                        (Note: Sec. 116 / 3% OPT is the ONLY compatible % tax)
                                        │
                                        ├── YES (subject to Sec. 117–128) →
                                        │    [ACTION: EIGHT_PCT = INELIGIBLE. Reason: 8% option only
                                        │     compatible with Sec. 116 OPT, not industry-specific % taxes.
                                        │     Ref: RR 8-2018 Sec. 2(A)(c).]
                                        │
                                        └── NO → Is the taxpayer a BMBE
                                                  (Barangay Micro Business Enterprise) with income
                                                  tax exemption certificate?
                                                  │
                                                  ├── YES →
                                                  │    [ACTION: EIGHT_PCT = INELIGIBLE (and irrelevant).
                                                  │     Reason: BMBE income is already exempt from income tax.
                                                  │     No income tax computation required.
                                                  │     Ref: RA 9178 (Barangay Micro Business Enterprise Act).]
                                                  │
                                                  └── NO → Has the taxpayer ALREADY filed Q1 1701Q
                                                            for this tax year WITHOUT electing 8%,
                                                            AND the Q1 filing deadline has passed?
                                                            │
                                                            ├── YES →
                                                            │    [ACTION: EIGHT_PCT = INELIGIBLE for THIS YEAR.
                                                            │     Reason: Election window closed. Q1 1701Q
                                                            │     without 8% election = defaulted to graduated.
                                                            │     Engine must use graduated rates for this year.
                                                            │     Ref: RR 8-2018 Part I — "default to graduated".]
                                                            │
                                                            └── NO →
                                                                 [ACTION: EIGHT_PCT = ELIGIBLE.
                                                                  Taxpayer may elect 8% option.
                                                                  Proceed to DT-02 for election procedure,
                                                                  or compute all 3 paths and recommend minimum.
                                                                  Ref: NIRC Sec. 24(A)(2)(b); RR 8-2018.]
```

---

## DT-02: 8% Option Election Procedure

**Root question:** How does this taxpayer formally elect the 8% option?

**Legal basis:** RR 8-2018 Part I; RMO 23-2018; RMC 32-2018

**Precondition:** DT-01 must have returned ELIGIBLE before entering this tree.

```
START: Is this taxpayer a NEW business registrant
       (filing BIR Form 1901 for the first time this year,
       or commenced business this year)?
│
├── YES (new registrant) →
│    Has the taxpayer already filed the INITIAL BIR Form 1901?
│    │
│    ├── NO (Form 1901 not yet filed) →
│    │    [ACTION: ELECTION_METHOD = AT_REGISTRATION.
│    │     Instruct user to check the 8% option box on BIR Form 1901 when registering.
│    │     No further election action needed — 8% is elected at registration.
│    │     Ref: RMO 23-2018 Sec. 3(A).]
│    │
│    └── YES (Form 1901 filed, business already registered without 8% election) →
│         Is this the FIRST taxable quarter (Q1) and has Q1 1701Q NOT yet been filed?
│         │
│         ├── YES (Q1 not yet filed) →
│         │    [ACTION: ELECTION_METHOD = INITIAL_Q1_RETURN.
│         │     User must file Q1 1701Q with Item 16 set to Option B (8% rate).
│         │     OR file Q1 2551Q with zero amount and notation:
│         │     "Availing of 8% Income Tax Rate Option for Taxable Year [YEAR]"
│         │     Ref: RMO 23-2018 Sec. 3(A); RR 8-2018 Part I.]
│         │
│         └── NO (Q1 already filed, or beyond Q1 period) →
│              [ACTION: ELECTION_WINDOW_CLOSED for this tax year.
│               Taxpayer has defaulted to graduated rates.
│               Notify user: cannot elect 8% after Q1 deadline.
│               Ref: RR 8-2018 Part I — irrevocable election must be Q1.]
│
└── NO (existing taxpayer, previously registered) →
     Is this the start of a new taxable year (before Q1 filing deadline)?
     Q1 filing deadline = May 15 of the current year (for Jan–Mar quarter)
     │
     ├── NO (Q1 deadline has passed, or Q1 already filed under graduated) →
     │    [ACTION: ELECTION_WINDOW_CLOSED for this tax year.
     │     Taxpayer is on graduated rates this year.
     │     May elect 8% again next year starting January 1.
     │     Ref: RR 8-2018 Part I — election must be at beginning of taxable year.]
     │
     └── YES (Q1 period is open, Q1 1701Q not yet filed) →
          Has taxpayer filed BIR Form 1905 to end-date the 2551Q form type?
          │
          ├── YES (Form 1905 already filed) →
          │    [ACTION: ELECTION_METHOD = FORM_1905_PLUS_Q1.
          │     Taxpayer has already deregistered from % tax via Form 1905.
          │     File Q1 1701Q with Item 16 = Option B (8%).
          │     No further 2551Q filings required for Q2 and Q3.
          │     Ref: RR 8-2018 Part I; RMO 23-2018 Sec. 3(B).]
          │
          └── NO (Form 1905 not yet filed) →
               Choose which election method to use:
               │
               ├── Option A: File Form 1905 NOW (before Q1 2551Q deadline, i.e., before April 25) →
               │    Then file Q1 1701Q with Item 16 = Option B (8%)
               │    [ACTION: ELECTION_METHOD = FORM_1905_PLUS_Q1.
               │     Form 1905 should be filed at the RDO with original COR.
               │     After processing, COR updated to reflect 8% election.
               │     Ref: RMO 23-2018 Sec. 3(B) Step 1-2.]
               │
               ├── Option B: File Q1 1701Q with 8% box checked →
               │    [ACTION: ELECTION_METHOD = Q1_1701Q_ONLY.
               │     File Q1 1701Q with Item 16 = Option B.
               │     The Q1 election on 1701Q alone is sufficient.
               │     Still recommended to file Form 1905 to update registration.
               │     Ref: RR 8-2018 Part I; RMC 32-2018.]
               │
               └── Option C: File Q1 2551Q NIL with notation →
                    File Q1 2551Q with tax due = ₱0.00 and notation:
                    "Availing of 8% Income Tax Rate Option for Taxable Year [YEAR]"
                    Then also file Q1 1701Q with Item 16 = Option B
                    [ACTION: ELECTION_METHOD = NIL_Q1_2551Q_PLUS_1701Q.
                     Both returns must be filed.
                     No further 2551Q filings for Q2, Q3.
                     Ref: RR 8-2018 Part I Option C election procedures.]
```

---

## DT-03: Mid-Year Threshold Breach Handling

**Root question:** Has the taxpayer's cumulative gross receipts + non-operating income exceeded ₱3,000,000 during the year?

**Legal basis:** RR 8-2018 Part III; RMO 23-2018 Sec. 3(C); NIRC Sec. 236

**Precondition:** Taxpayer previously elected the 8% option (DT-02 returned ELECTION_SUCCESSFUL).

```
START: Current cumulative gross receipts + non-operating income > ₱3,000,000?
│
├── NO → [ACTION: CONTINUE_8PCT. No breach. Continue filing quarterly 1701Q under 8%.
│         Monitor each month as new receipts arrive. Ref: NIRC Sec. 24(A)(2)(b).]
│
└── YES → BREACH DETECTED.
          │
          └── Determine breach month:
               breach_month = first calendar month where cumulative exceeds ₱3,000,000
               │
               └── [REQUIRED ACTIONS — all must be performed:]
                    │
                    ├── ACTION 1: AUTO-DISQUALIFY 8% OPTION.
                    │    8% option is retroactively cancelled for the ENTIRE taxable year.
                    │    Taxpayer must recompute income tax under graduated rates for the full year.
                    │    Ref: RR 8-2018 Part III.
                    │
                    ├── ACTION 2: FILE BIR FORM 1905.
                    │    Deadline: within the MONTH FOLLOWING the breach month.
                    │    Example: breach in October → Form 1905 due by November 30.
                    │    Purposes: update tax type from non-VAT to VAT; cancel 2551Q; add 2550M/Q.
                    │    Ref: RMO 23-2018 Sec. 3(C) Step 1.
                    │
                    ├── ACTION 3: RETROACTIVE PERCENTAGE TAX.
                    │    Compute 3% percentage tax on gross receipts from January 1 through
                    │    the last complete month BEFORE the month of VAT registration.
                    │    VAT registration month = breach month + 1 (month Form 1905 is filed).
                    │    Formula: retroactive_pt = gross_jan_to_(vat_reg_month - 1) × 0.03
                    │    File amended/late BIR Form 2551Q for the affected quarters.
                    │    Ref: RR 8-2018 Part III; NIRC Sec. 116.
                    │
                    ├── ACTION 4: RECOMPUTE ANNUAL INCOME TAX UNDER GRADUATED RATES.
                    │    Use full-year gross receipts + non-operating income.
                    │    Deduction method:
                    │    ├── If taxpayer elected OSD in Q1 before breach: use OSD (40% of gross)
                    │    ├── If taxpayer elected itemized in Q1: use itemized (require expense inputs)
                    │    └── If no deduction method was elected (was on 8% only): must now choose
                    │         OSD or itemized for the annual ITR (defaults to OSD if none chosen)
                    │    File on BIR Form 1701 (NOT 1701A — breach year requires Form 1701).
                    │    Ref: RR 8-2018 Part III; RMO 23-2018 Sec. 3(C) Step 4-6.
                    │
                    ├── ACTION 5: CREDIT PRIOR 8% PAYMENTS.
                    │    All 8% quarterly income tax payments made before the breach are
                    │    treated as TAX CREDITS on the annual Form 1701.
                    │    These credits reduce the graduated-rate annual tax due.
                    │    Formula: annual_it_payable = annual_graduated_it - cwt - q8pct_payments_made
                    │    If credits exceed annual tax: excess is refundable or carry-over.
                    │    Ref: RR 8-2018 Part III; RMO 23-2018 Sec. 3(C) Step 3.
                    │
                    └── ACTION 6: FILE VAT RETURNS GOING FORWARD.
                         Starting from the breach month: taxpayer is VAT-registered.
                         Must file BIR Form 2550M (monthly) or 2550Q (quarterly VAT).
                         12% VAT applies to all sales/receipts from breach month onwards.
                         Input VAT credits available for VAT-registered purchases.
                         Ref: NIRC Sec. 106-108; RMO 23-2018 Sec. 3(C) Step 5.
```

---

## DT-04: Annual Filing Form Selection

**Root question:** Which BIR income tax return form does this taxpayer use for the annual ITR?

**Legal basis:** RR 8-2018 Part V; BIR Form series documentation; RMC 32-2018

```
START: Did the taxpayer earn ANY compensation income from employment this taxable year?
(Compensation = salary, wages, allowances, bonuses from an employer that reports via BIR Form 2316)
│
├── YES (mixed-income earner) →
│    [ACTION: ANNUAL_FORM = "1701".
│     BIR Form 1701 (Annual Income Tax Return for Self-Employed Individuals, Estates,
│     and Trusts Including Those With Mixed Income).
│     Applies regardless of which regime the business income uses (8%, OSD, itemized).
│     Mixed-income earners CANNOT use Form 1701A.
│     Ref: RR 8-2018 Part V; BIR 1701 form instructions.]
│
└── NO (purely self-employed / purely professional income) →
     Did a mid-year threshold breach occur (DT-03 returned BREACH)?
     │
     ├── YES (breach year) →
     │    [ACTION: ANNUAL_FORM = "1701".
     │     Breach-year filers must use Form 1701 even if purely self-employed.
     │     Reason: Form 1701 accommodates the VAT registration update schedule.
     │     Ref: RMO 23-2018 Sec. 3(C) Step 4.]
     │
     └── NO (no breach, no compensation) →
          Which tax regime applies for the year?
          │
          ├── GRADUATED + OSD (Path B) →
          │    [ACTION: ANNUAL_FORM = "1701A".
          │     BIR Form 1701A (Annual Income Tax Return for Individuals Earning Purely
          │     from Business/Profession).
          │     Use Part IV-A (OSD method, Items 36-46).
          │     OSD is computed as 40% of gross receipts (Item 40 × 40% = Item 41).
          │     Net taxable income = Item 42 = Item 40 − Item 41.
          │     Tax due from graduated rate table embedded in Part IV-A.
          │     Audited Financial Statements NOT required to attach.
          │     Ref: BIR Form 1701A (January 2018 ENCS) instructions.]
          │
          ├── 8% FLAT RATE (Path C) →
          │    [ACTION: ANNUAL_FORM = "1701A".
          │     BIR Form 1701A (Annual Income Tax Return for Individuals Earning Purely
          │     from Business/Profession).
          │     Use Part IV-B (8% method, Items 47-56).
          │     Item 47 = Gross Sales/Receipts and Other Non-Operating Income.
          │     Item 48 = ₱250,000 (statutory deduction; field is pre-filled or user enters 250000).
          │     Item 49 = Item 47 − Item 48 (or ₱0 if item 47 < ₱250,000).
          │     Item 50 = Item 49 × 8% = Tax Due.
          │     Audited Financial Statements NOT required to attach.
          │     Ref: BIR Form 1701A (January 2018 ENCS) instructions.]
          │
          └── GRADUATED + ITEMIZED DEDUCTIONS (Path A) →
               [ACTION: ANNUAL_FORM = "1701".
                CORRECTION: Form 1701A CANNOT be used for itemized deductions.
                BIR Form 1701A explicitly states it is ONLY for purely self-employed individuals
                using EITHER (a) graduated income tax rates with OSD, OR (b) 8% flat rate.
                Itemized deductions require BIR Form 1701 (Annual Income Tax Return for
                Self-Employed Individuals, Estates, and Trusts Including Those With Mixed Income).
                Form 1701 provides Schedule 3.A (business income), Schedule 4 (ordinary
                allowable itemized deductions, 17 line items), Schedule 5 (special deductions),
                and Schedule 6 (NOLCO).
                AFS attachment rule: Required if gross quarterly sales > ₱150,000 per RR 4-2019.
                For gross ≤ ₱150,000/quarter: AFS not required by BIR (EOPT simplification).
                Supporting receipts/invoices must be retained for 5 years per EOPT.
                Ref: BIR Form 1701A instructions (explicitly excludes itemized deduction filers);
                     BIR Form 1701 instructions; RR 4-2019; RA 11976 EOPT Act.]
```

---

## DT-05: ₱250,000 Deduction Applicability Under 8% Option

**Root question:** Should the ₱250,000 statutory deduction be applied to this taxpayer's 8% computation?

**Legal basis:** NIRC Sec. 24(A)(2)(b); RMC 50-2018; RR 8-2018 Part IX (Item 48 of 1701Q Schedule II)

```
START: Has the taxpayer elected the 8% income tax option for this year?
│
├── NO → [ACTION: NOT_APPLICABLE. ₱250,000 deduction concept applies only under 8% option.
│         Under Path A (itemized) or Path B (OSD), use the graduated rate table zero-bracket instead.
│         Ref: NIRC Sec. 24(A)(2)(a).]
│
└── YES (8% elected) →
     Did the taxpayer receive ANY compensation income from employment this year?
     (Include: salary, wages, 13th month, bonuses, allowances from employer's BIR Form 2316)
     │
     ├── YES (compensation income exists, even ₱1 of compensation) →
     │    [ACTION: DEDUCTION_250K = DO_NOT_APPLY.
     │     The ₱250,000 is NOT deducted from business income.
     │     8% Tax Base = Gross Business Receipts + Non-Operating Income (NO deduction).
     │     8% Tax Due = tax_base × 0.08.
     │     Even if taxable compensation is BELOW ₱250,000, the unused portion of the
     │     ₱250,000 bracket CANNOT be transferred to the business income side.
     │     The unused portion is forfeited.
     │     Example: Taxable comp = ₱150,000 (₱100,000 "unused" ₱250K bracket).
     │     Business 8% tax = Gross biz × 0.08 (NOT (Gross biz − ₱100,000) × 0.08).
     │     Ref: RMC 50-2018; RR 8-2018 Part II; 1701Q Schedule II Item 48 instructions.]
     │
     └── NO (no compensation income; purely self-employed) →
          [ACTION: DEDUCTION_250K = APPLY.
           ₱250,000 is deducted from gross receipts + non-operating income.
           8% Tax Base = MAX(0, gross_receipts + non_op_income − 250,000).
           8% Tax Due = tax_base × 0.08.
           If gross + non-op < ₱250,000: Tax Due = ₱0.
           At quarterly level: deduction applied once against cumulative YTD gross.
           At annual level: same formula applied to full-year totals.
           Ref: NIRC Sec. 24(A)(2)(b); RR 8-2018 Part I; 1701Q Schedule II Item 48.]
```

---

## DT-06: Tax Type and Form 2551Q (Percentage Tax) Filing Obligation

**Root question:** Must this taxpayer file BIR Form 2551Q (Quarterly Percentage Tax Return)?

**Legal basis:** NIRC Sec. 116; RR 8-2018 Part IV; CREATE Act RA 11534

```
START: What is the taxpayer's income tax regime for this year?
│
├── EIGHT_PERCENT_OPTION (elected 8%) →
│    Has a mid-year threshold breach occurred?
│    │
│    ├── NO (no breach) →
│    │    [ACTION: 2551Q = NOT_REQUIRED.
│    │     The 8% rate is "in lieu of" both graduated income tax and the 3% percentage tax.
│    │     Percentage tax is waived for the entire year.
│    │     For existing taxpayers who filed Form 1905 to deregister from % tax:
│    │       → No 2551Q filing needed at all.
│    │     For existing taxpayers who did NOT file Form 1905 before Q1 2551Q deadline:
│    │       → File Q1 2551Q with zero amount and election notation.
│    │       → No Q2 or Q3 2551Q required.
│    │     For new registrants: no 2551Q required at all.
│    │     Ref: NIRC Sec. 24(A)(2)(b); RR 8-2018 Part I; RMO 23-2018.]
│    │
│    └── YES (breach occurred) →
│         [ACTION: 2551Q = REQUIRED_FOR_PARTIAL_YEAR.
│          Retroactive percentage tax applies from January 1 through the last month
│          before VAT registration (= breach month).
│          File amended 2551Q for the affected quarters at 3% rate.
│          After VAT registration month: no more 2551Q; file VAT returns instead.
│          Ref: RR 8-2018 Part III; NIRC Sec. 116.]
│
├── GRADUATED_OSD (Path B) →
│    Is taxpayer VAT-registered?
│    │
│    ├── YES → [ACTION: 2551Q = NOT_REQUIRED. VAT-registered taxpayers do not pay OPT.
│    │          They file 2550M/2550Q instead. Ref: NIRC Sec. 109(BB); Sec. 116 exemption.]
│    │
│    └── NO → Is gross receipts ≤ ₱3,000,000?
│              │
│              ├── YES → [ACTION: 2551Q = REQUIRED. File quarterly at 3% of gross receipts.
│              │          Deadlines: Q1 = April 25, Q2 = July 25, Q3 = October 25, Q4 = January 25.
│              │          Ref: NIRC Sec. 116; NIRC Sec. 128 for deadlines.]
│              │
│              └── NO (> ₱3M) → [ACTION: 2551Q = NOT_REQUIRED (VAT should be registered).
│                                 Flag user: must register for VAT if gross > ₱3M.
│                                 Ref: NIRC Sec. 236(G).]
│
└── GRADUATED_ITEMIZED (Path A) →
     [Same logic as GRADUATED_OSD — see OSD branch above.
      Deduction method does not affect percentage tax obligation.
      Percentage tax applies based on VAT status and gross receipts threshold only.]
```

---

## DT-07: Regime Recommendation — Full Expanded Decision Tree

**Root question:** Given gross receipts and business expenses, which tax path has the lowest total tax burden?

**Legal basis:** NIRC Sec. 24(A)(2)(a), Sec. 24(A)(2)(b), Sec. 34(L), Sec. 116; CR-028 in computation-rules.md

**This tree is the canonical entry point for all regime comparisons.** For exact pseudocode, see CR-028.

```
START: Is the taxpayer VAT-registered?
│
├── YES (VAT-registered) →
│    [INELIGIBLE for 8% option (RR 8-2018). No percentage tax applies (Sec. 116 exemption).]
│    [Available paths: PATH_A and PATH_B only.]
│    │
│    └── Does the taxpayer have tracked and documented business expenses?
│         │
│         ├── YES (has itemized docs) →
│         │    Compute Path A: grad_tax(gross_income − itemized_deductions)
│         │    Compute Path B: grad_tax(gross_income × 0.60)
│         │    Compare totals (NO percentage tax for either; VAT-registered):
│         │    │
│         │    ├── expense_ratio > 40% →
│         │    │    [ACTION: RECOMMEND PATH_A (Graduated + Itemized).
│         │    │     Path A NTI < Path B NTI when itemized > OSD (40% of gross).
│         │    │     No PT applies to either; VAT filed separately.
│         │    │     Savings = grad_tax(0.60×GI) − grad_tax(GI − itemized).
│         │    │     Ref: NIRC Sec. 34(A)-(K); CR-004.]
│         │    │
│         │    ├── expense_ratio = 40% →
│         │    │    [ACTION: RECOMMEND PATH_B (Graduated + OSD) on tie.
│         │    │     Path A = Path B at exactly 40% expense ratio.
│         │    │     OSD preferred: simpler filing, no documentation burden.
│         │    │     Ref: NIRC Sec. 34(L); CR-026.]
│         │    │
│         │    └── expense_ratio < 40% →
│         │         [ACTION: RECOMMEND PATH_B (Graduated + OSD).
│         │          OSD (40% flat) deducts more than actual expenses.
│         │          Path B NTI < Path A NTI.
│         │          Ref: NIRC Sec. 34(L); CR-026.]
│         │
│         └── NO (no itemized docs) →
│              [ACTION: RECOMMEND PATH_B (Graduated + OSD) — only option.
│               Path A requires substantiation; without docs, itemized is unavailable.
│               Path B: NTI = gross_income × 0.60; IT = grad_tax(NTI).
│               No percentage tax. File Form 1701/1701A.
│               Ref: NIRC Sec. 34(L); RR 16-2008.]
│
└── NO (not VAT-registered) →
     Is the taxpayer's gross_receipts + non_operating_income > ₱3,000,000?
     │
     ├── YES (> ₱3M) →
     │    [INELIGIBLE for 8% option. Must register for VAT.
     │     Available paths: PATH_A and PATH_B only (with 3% PT on both).]
     │    [FLAG: VAT registration is REQUIRED (NIRC Sec. 236(G)). Notify user.]
     │    │
     │    └── Same as the VAT-registered branch above, PLUS add PT = GR × 3% to both paths.
     │         [ACTION: RECOMMEND whichever of PATH_A or PATH_B has lower total (IT + PT).
     │          Breakeven is still at 40% expense ratio (PT is identical for both paths).]
     │
     └── NO (≤ ₱3M) → 8% OPTION MAY BE AVAILABLE.
          │
          └── Check DT-01 for eligibility. Did DT-01 return ELIGIBLE?
               │
               ├── NOT ELIGIBLE (GPP partner, Sec. 117-128 subject, election window closed, BMBE) →
               │    [Available paths: PATH_A and PATH_B only (with 3% PT on both).]
               │    │
               │    └── Does taxpayer have itemized documentation?
               │         │
               │         ├── YES →
               │         │    Compute Path A: grad_tax(gross_income − itemized) + GR×0.03
               │         │    Compute Path B: grad_tax(gross_income×0.60) + GR×0.03
               │         │    (PT cancels in comparison; compare only IT)
               │         │    │
               │         │    ├── expense_ratio > 40% →
               │         │    │    [ACTION: RECOMMEND PATH_A (Itemized + Graduated).
               │         │    │     Savings = grad_tax(0.60×GI) − grad_tax(GI−itemized).
               │         │    │     Ref: CR-004; CR-005.]
               │         │    │
               │         │    ├── expense_ratio = 40% →
               │         │    │    [ACTION: RECOMMEND PATH_B (OSD). Tie; simpler filing wins.
               │         │    │     Ref: CR-026.]
               │         │    │
               │         │    └── expense_ratio < 40% →
               │         │         [ACTION: RECOMMEND PATH_B (OSD).
               │         │          Ref: CR-026.]
               │         │
               │         └── NO (no docs) →
               │              [ACTION: RECOMMEND PATH_B (OSD). Only viable option.
               │               Total = grad_tax(GR×0.60) + GR×0.03.
               │               Ref: CR-005; CR-008.]
               │
               └── ELIGIBLE (DT-01 returned ELIGIBLE) →
                    All 3 paths potentially available. Check the gross receipts range:
                    │
                    ├── BRANCH A: gross_for_threshold ≤ ₱250,000 →
                    │    [Path C tax = ₱0 (no tax). Path A and B may also be ₱0 or close.
                    │     ACTION: RECOMMEND PATH_C (8%). Zero tax under 8%; simpler to file.
                    │     Note: Still must file 1701Q quarterly (even with ₱0 tax due).
                    │     Ref: NIRC Sec. 24(A)(2)(b); EC-8-01 (zero-tax annual filing required).]
                    │
                    ├── BRANCH B: ₱250,001 ≤ gross_for_threshold ≤ ₱400,000 →
                    │    [In this range: Path C tax = (GR−250K)×8% is very small.
                    │     Path B tax = PT only (NTI < ₱250K → graduated IT = 0) = GR×3%.
                    │     Comparison: (GR−250K)×0.08 vs GR×0.03.
                    │     At GR = ₱250K: C = 0; B = 7,500 → C wins.
                    │     At GR = ₱400K: C = 12,000; B = 12,000 → TIE.
                    │     For all GR in (₱250K, ₱400K): C < B (see Table RC-02).
                    │     ACTION: RECOMMEND PATH_C (8%) for this range.
                    │     Ref: CR-028 Table RC-02.]
                    │
                    ├── BRANCH C: ₱400,001 ≤ gross_for_threshold ≤ ₱437,499 →
                    │    [NARROW OSD-WINS WINDOW. Path B (OSD) is cheaper than Path C (8%) here.
                    │     Maximum advantage to OSD: ₱833 (at GR ≈ ₱425,000).
                    │     Path A (itemized) with expense_ratio > breakeven may also win.
                    │     Compute all 3 paths. Compare totals.
                    │     │
                    │     └── Sub-check: Does taxpayer have itemized docs AND expense_ratio > breakeven?
                    │          (Breakeven at GR = ₱400K: r = 37.5%; at ₱437.5K: r = 40%)
                    │          │
                    │          ├── YES (docs + expense > breakeven) →
                    │          │    Compare Path A total vs Path B total:
                    │          │    ├── Path A < Path B → [ACTION: RECOMMEND PATH_A]
                    │          │    └── Path A ≥ Path B → [ACTION: RECOMMEND PATH_B]
                    │          │
                    │          └── NO (no docs or expense ≤ breakeven) →
                    │               [ACTION: RECOMMEND PATH_B (OSD).
                    │                OSD beats 8% in this narrow range. Maximum savings ₱833.
                    │                Ref: CR-028 Table RC-02; OSD-wins window ₱400K–₱437.5K.]]
                    │
                    ├── BRANCH D: gross_for_threshold = ₱437,500 →
                    │    [Exact second crossover: Path B (OSD) = Path C (8%) = ₱15,000.
                    │     Tie-breaking rule: prefer Path C (simpler; no PT filing needed).
                    │     ACTION: RECOMMEND PATH_C (8%). Equal total tax; fewer filings.
                    │     Ref: CR-028 Table RC-02, crossover verification.]
                    │
                    └── BRANCH E: gross_for_threshold > ₱437,500 up to ₱3,000,000 →
                         [Path C (8%) always beats Path B (OSD) in this range.
                          Path A (itemized) may beat Path C only if expense_ratio > breakeven.]
                         │
                         └── Does taxpayer have itemized documentation?
                              │
                              ├── YES →
                              │    Look up breakeven expense ratio from Table RC-01 (or compute inline).
                              │    actual_expense_ratio = itemized_deductions / gross_receipts
                              │    │
                              │    ├── actual_expense_ratio > breakeven_ratio(GR) →
                              │    │    Compute Path A and Path C. Compare.
                              │    │    ├── Path A < Path C →
                              │    │    │    [ACTION: RECOMMEND PATH_A (Itemized + Graduated).
                              │    │    │     Show savings vs 8% and vs OSD.
                              │    │    │     Note: Must file 2551Q quarterly for PT.
                              │    │    │     Ref: CR-028 Table RC-01; CR-004.]
                              │    │    │
                              │    │    └── Path A ≥ Path C (rounding edge) →
                              │    │         [ACTION: RECOMMEND PATH_C (8%).
                              │    │          Tie or very near tie; prefer 8% (simpler, no PT).
                              │    │          Ref: CR-028 Invariant INV-RC-06; tie-break rule.]
                              │    │
                              │    └── actual_expense_ratio ≤ breakeven_ratio(GR) →
                              │         [Path C beats Path A (and definitionally Path B).
                              │          ACTION: RECOMMEND PATH_C (8%).
                              │          Show savings vs Path A (if docs available) and Path B.
                              │          Ref: CR-028 Table RC-01; CR-006.]
                              │
                              └── NO (no itemized docs) →
                                   [Path A not available. Compare Path B vs Path C only.
                                    Path C always wins above ₱437,500.
                                    ACTION: RECOMMEND PATH_C (8%).
                                    Total = (GR − 250,000) × 0.08 (for purely self-employed).
                                    Percentage tax waived.
                                    Form: 1701A (if pure SE) or 1701 (if mixed income).
                                    Ref: CR-006; CR-028 Table RC-02.]
```

---

---

## DT-16: Regime Recommendation — VAT-Registered Taxpayer (Path A vs Path B Only)

**Root question:** For a VAT-registered taxpayer (gross > ₱3M or voluntarily VAT-registered), which of Path A or Path B yields the lower income tax?

**Legal basis:** NIRC Sec. 24(A)(2)(a); Sec. 34(L); Sec. 34(A)-(K); CR-004; CR-005.

**Precondition:** Taxpayer is VAT-registered. Path C (8%) is NOT available. Percentage tax does NOT apply.

```
START: Compute gross income (for VAT taxpayers: net of output VAT on receipts; VAT-exclusive)
│
│ NOTE: For VAT-registered taxpayers, gross income used for deduction/OSD purposes
│       is the VAT-exclusive amount (total receipts ÷ 1.12 for 12% VAT output tax removal).
│       The engine does not compute VAT liability; it uses the VAT-exclusive gross.
│
└── Does the taxpayer have documented and allowable business expenses (Sec. 34)?
     │
     ├── NO (no expense documentation) →
     │    [ACTION: RECOMMEND PATH_B (Graduated + OSD).
     │     NTI = gross_income × 0.60.
     │     IT = grad_tax(NTI). No PT.
     │     Must attach Audited Financial Statements if prior year GR > ₱3M (RR 4-2019).
     │     Ref: NIRC Sec. 34(L); CR-005.]
     │
     └── YES (has expense documentation) →
          Compute expense_ratio = itemized_deductions / gross_income
          │
          ├── expense_ratio < 40% →
          │    [ACTION: RECOMMEND PATH_B (Graduated + OSD).
          │     OSD = gross_income × 0.40 > itemized_deductions.
          │     Lower NTI under OSD → lower IT.
          │     Savings = grad_tax(GI − itemized) − grad_tax(GI × 0.60).
          │     (Savings are positive since GI − itemized > GI × 0.60 when ratio < 40%)
          │     Ref: NIRC Sec. 34(L); CR-026.]
          │
          ├── expense_ratio = 40% (exactly) →
          │    [ACTION: RECOMMEND PATH_B (OSD). Tie; OSD preferred (no documentation risk).
          │     Both paths yield identical IT. OSD election simpler to defend in BIR audit.
          │     Ref: CR-026; DT-07 tie-breaking rule.]
          │
          └── expense_ratio > 40% →
               Compute Path A IT = grad_tax(gross_income − itemized_deductions)
               Compute Path B IT = grad_tax(gross_income × 0.60)
               │
               ├── Path A IT < Path B IT →
               │    [ACTION: RECOMMEND PATH_A (Graduated + Itemized).
               │     Savings = Path B IT − Path A IT.
               │     Attach: receipts, invoices, payroll records, depreciation schedules.
               │     AFS attachment: required if prior year GR > ₱3M (RR 4-2019).
               │     Ref: NIRC Sec. 34(A)-(K); CR-004; CR-027.]
               │
               └── Path A IT ≥ Path B IT (rounding case only; mathematically impossible if ratio > 40%) →
                    [ACTION: RECOMMEND PATH_B (OSD).
                     Edge case: only occurs due to float rounding. OSD is preferred on tie.
                     Log this as a rounding anomaly for monitoring.
                     Ref: INV-RC-06; CR-028 invariants.]
```

---

---

## DT-09: Mixed Income Earner — Complete Computation Flow

**Legal basis:** NIRC Sec. 24(A)(1)(b) (compensation), Sec. 24(A)(2) (business income), Sec. 24(A)(2)(b) (8% option); RMC 50-2018 (₱250K deduction waiver for mixed income); RR 8-2018 Part II; CR-029; CR-030.

```
START: Does this taxpayer have compensation income from an employer this tax year?
(i.e., receives salary/wages with a BIR Form 2316 issued by at least one employer)
│
├── NO → [ACTION: Route to pure self-employed flow (DT-07). Exit DT-09.]
│         [Reference: CR-028 for pure SE comparison.]
│
└── YES (Mixed Income Earner) →

     │
     ├── Does the taxpayer have MORE THAN ONE Form 2316 (multiple employers)?
     │    │
     │    ├── YES →
     │    │    [ACTION: Prompt user to enter SUMMED values from all Form 2316s.
     │    │     "Enter the total of all 'Total Taxable Compensation Income' amounts
     │    │     from all your employers' Form 2316s."
     │    │     Compute aggregated_compensation via CR-030 aggregate_form_2316s().
     │    │     If tw_deficiency > 0: Show warning "Multiple employer deficiency alert:
     │    │     Your combined compensation tax of ₱[comp_it] exceeds the total withheld
     │    │     (₱[total_tw]). You will owe approximately ₱[tw_deficiency] at annual filing
     │    │     due to each employer not knowing your other income."
     │    │     Proceed with total_taxable_compensation and total_tw as inputs.]
     │    │
     │    └── NO (single employer or summed by user) →
     │         [ACTION: Use single Form 2316 taxable_compensation and tax_withheld_by_employer.]
     │         Continue.
     │
     ├── Does the taxpayer have a FOREIGN employer with no Philippine income tax withholding?
     │    │
     │    ├── YES →
     │    │    [FLAG: MRF-016 — Foreign employer compensation.
     │    │     User must self-compute Philippines taxable amount and tax.
     │    │     Set tax_withheld_by_employer = 0 for foreign employer portion.
     │    │     If taxpayer claims foreign tax credit: FLAG MRF-017.]
     │    │    Continue with user-provided taxable_compensation and TW = 0.
     │    │
     │    └── NO → Continue.
     │
     ├── Is the taxpayer's taxable compensation = 0 (i.e., they reported compensation income
     │    but all of it is excluded / below minimum wage)?
     │    │
     │    ├── YES →
     │    │    [DECISION: If compensation income exists but taxable_compensation = 0,
     │    │     the taxpayer is STILL a mixed income earner. RMC 50-2018 does not require
     │    │     a minimum taxable compensation amount — ANY compensation income (even ₱0 taxable)
     │    │     triggers the "no ₱250K deduction" rule for the 8% business option.
     │    │     Treat as mixed income earner with taxable_compensation = 0 and TW = 0.
     │    │     Note: Minimum wage earners are EXEMPT from income tax on compensation per NIRC Sec. 24(A)(2)(b)
     │    │     — their compensation may be 0 taxable. But their business income can still be taxed.
     │    │     8% tax base = gross_business_receipts × 0.08 (NO ₱250K deduction).]
     │    │
     │    └── NO (normal case: taxable_compensation > 0) → Continue.
     │
     ═══════════════════════════════════════════
     STEP 2: GATHER BUSINESS INCOME INFORMATION
     ═══════════════════════════════════════════
     │
     [ACTION: Collect business income inputs:]
     - gross_receipts: decimal  (annual gross from self-employment/profession)
     - non_operating_income: decimal  (interest, etc. from business; set to 0 if none)
     - gross_for_threshold: = gross_receipts + non_operating_income
       [RULE: Compensation income is NOT added to this threshold. Only BUSINESS gross counts.]
     - itemized_deductions: decimal (if user has substantiated business expenses)
     - has_itemized_documentation: bool
     - is_vat_registered: bool
     - election_status: ElectionStatus
     - total_cwt_business: decimal (from all Form 2307s for business income)
     - total_quarterly_it_paid: decimal (prior quarterly 1701Q payments for business)
     │
     ═══════════════════════════════════════════════════════════════════
     STEP 3: DETERMINE WHICH PATHS ARE AVAILABLE FOR BUSINESS INCOME
     ═══════════════════════════════════════════════════════════════════
     │
     │ PATH A (Itemized + Graduated, Combined):
     ├── Is has_itemized_documentation = true?
     │    ├── YES → Path A is AVAILABLE.
     │    └── NO → Path A is UNAVAILABLE (no documentation to substantiate).
     │
     │ PATH B (OSD + Graduated, Combined):
     ├── Always AVAILABLE. [OSD requires no documentation.]
     │
     │ PATH C (8% on Business, Graduated on Compensation Separately):
     ├── Run DT-01 (8% Eligibility) using business gross_for_threshold only:
     │    │
     │    ├── Is is_vat_registered = true?
     │    │    └── YES → Path C UNAVAILABLE. [Ref: DT-01 branch.]
     │    │
     │    ├── Is gross_for_threshold > ₱3,000,000?
     │    │    └── YES → Path C UNAVAILABLE. [Ref: DT-01 branch.]
     │    │    └── NO (≤ ₱3,000,000) → Continue 8% eligibility checks.
     │    │
     │    ├── Is election_status = GRADUATED_ELECTED?
     │    │    └── YES → Path C UNAVAILABLE (taxpayer locked into graduated for the year).
     │    │
     │    └── All eligibility checks pass → Path C AVAILABLE.
     │
     ═══════════════════════════════════════════════════
     STEP 4: COMPUTE EACH AVAILABLE PATH
     ═══════════════════════════════════════════════════
     │
     ├── [COMPUTE PATH A if available]
     │    business_nti_itemized = max(gross_receipts − itemized_deductions, 0)
     │    combined_nti_A = taxable_compensation + business_nti_itemized
     │    total_it_A = graduated_tax(combined_nti_A, tax_year)
     │    pt_A = 0 if is_vat_registered else gross_receipts × 0.03
     │    total_burden_A = total_it_A + pt_A
     │    it_balance_A = max(total_it_A − tax_withheld_by_employer − total_cwt_business − total_quarterly_it_paid, 0)
     │    overpayment_A = max(tax_withheld_by_employer + total_cwt_business + total_quarterly_it_paid − total_it_A, 0)
     │
     ├── [COMPUTE PATH B]
     │    business_nti_osd = gross_receipts × 0.60
     │    combined_nti_B = taxable_compensation + business_nti_osd
     │    total_it_B = graduated_tax(combined_nti_B, tax_year)
     │    pt_B = 0 if is_vat_registered else gross_receipts × 0.03
     │    total_burden_B = total_it_B + pt_B
     │    it_balance_B = max(total_it_B − tax_withheld_by_employer − total_cwt_business − total_quarterly_it_paid, 0)
     │    overpayment_B = max(tax_withheld_by_employer + total_cwt_business + total_quarterly_it_paid − total_it_B, 0)
     │
     └── [COMPUTE PATH C if available]
          ← CRITICAL DIFFERENCE FROM PATHS A/B:
            Compensation and business income are taxed SEPARATELY (not combined).
          ←
          business_8pct_base = gross_for_threshold  // NO ₱250,000 deduction (RMC 50-2018)
          business_it_C = business_8pct_base × 0.08
          compensation_it_C = graduated_tax(taxable_compensation, tax_year)  // separate computation
          total_it_C = business_it_C + compensation_it_C
          pt_C = 0  // Waived under 8% regime
          total_burden_C = total_it_C
          it_balance_C = max(total_it_C − tax_withheld_by_employer − total_cwt_business − total_quarterly_it_paid, 0)
          overpayment_C = max(tax_withheld_by_employer + total_cwt_business + total_quarterly_it_paid − total_it_C, 0)

     ═══════════════════════════════════════════════════
     STEP 5: COMPARE AND RECOMMEND
     ═══════════════════════════════════════════════════
     │
     [ACTION: Build list of computed paths.]
     [ACTION: Find path with minimum total_tax_burden.]
     │
     ├── Do two or more paths have the SAME total_tax_burden?
     │    └── YES → Apply tie-breaking: prefer Path C > Path B > Path A
     │              (simpler compliance requirement → prefer 8% over OSD over itemized on tie)
     │
     [ACTION: RECOMMENDATION = minimum-burden path after tie-breaking.]
     [ACTION: Compute savings: savings_vs_x = x.total_burden − recommended.total_burden for each non-recommended path.]
     │
     ═══════════════════════════════════════════════════
     STEP 6: DETERMINE FILING OBLIGATIONS AND QUARTERLY SCHEDULE
     ═══════════════════════════════════════════════════
     │
     [ACTION: Annual form = "BIR Form 1701" — ALWAYS for mixed income, regardless of regime.]
     [ACTION: If total quarterly filing quarters remain (e.g., Q1, Q2, Q3 not yet filed):
              Set quarterly_form = "BIR Form 1701Q" for business income.]
     [ACTION: Percentage tax filing (if pt > 0): "BIR Form 2551Q" — quarterly, due 25 days after quarter end.]
     │
     ═══════════════════════════════════════════════════
     STEP 7: OUTPUT
     ═══════════════════════════════════════════════════
     │
     [ACTION: Return MixedIncomeComparisonResult (see CR-029 compare_mixed_income_regimes):]
     - All computed paths with breakdowns
     - Recommended path with reason
     - Savings vs each non-recommended path
     - Annual IT balance due (or overpayment/refund)
     - Effective total tax rate (total_burden / total_income)
     - Filing obligations summary
     - Key notes:
       → "Your compensation income is always taxed at graduated rates. Your employer handles this via payroll."
       → If Path C recommended: "Under the 8% option, the ₱250,000 exemption does NOT apply to your business income because you also have compensation income (RMC 50-2018). Your business tax base is ₱[gross_receipts]."
       → "At annual filing (Form 1701), both your compensation and business income are reconciled together."
       → If multiple Form 2316s: "With income from multiple employers, verify your combined compensation tax."
       → If near-threshold: "Your business income is near the ₱3,000,000 limit for the 8% option. Monitor your actual receipts."
```

---

## DT-10: Mixed Income — ₱250,000 Deduction Decision

**Legal basis:** NIRC Sec. 24(A)(2)(b); RMC 50-2018; CR-029 Rule MIR-03.

```
START: Is the taxpayer computing under Path C (8% flat rate)?
│
├── NO (Path A or Path B — graduated methods) →
│    [ACTION: DEDUCTION_250K = NOT APPLICABLE.
│     Under Paths A and B, the graduated rate table itself provides the zero-rate bracket
│     (first ₱250,000 of combined NTI at 0%). This is NOT a separate deduction —
│     it is built into the rate table. No adjustment needed.
│     The graduated_tax() function handles this automatically.]
│    [Leaf: Proceed with graduated computation.]
│
└── YES (Path C — 8% flat rate) →
     │
     └── Does the taxpayer have ANY compensation income from an employer this tax year?
          (Even ₱1 of compensation; even if taxable_compensation = 0 due to exclusions)
          │
          ├── YES (compensation income exists — mixed income earner) →
          │    [ACTION: DEDUCTION_250K = DO_NOT_APPLY.
          │     8% Tax Base = gross_business_receipts + non_operating_income.
          │     Tax = tax_base × 0.08. NO subtraction of ₱250,000.
          │     Legal basis: RMC 50-2018 — "the applicable 8% income tax on gross sales/receipts
          │     and other non-operating income in excess of ₱250,000 shall NOT be applicable
          │     [for mixed income earners]; instead, the 8% income tax rate shall apply on the
          │     TOTAL AMOUNT of gross sales/receipts."
          │     Display note: "Because you also receive compensation income, the ₱250,000
          │     deduction does not apply to your business income under the 8% option.
          │     Your employer's payroll already accounts for this bracket in your withholding."]
          │
          └── NO (purely self-employed, no compensation) →
               [ACTION: DEDUCTION_250K = APPLY.
                8% Tax Base = max(gross_business_receipts + non_operating_income − 250,000, 0).
                Tax = tax_base × 0.08.
                If gross_for_threshold ≤ ₱250,000: Tax = ₱0 (fully exempt under 8% option).
                Legal basis: NIRC Sec. 24(A)(2)(b).]
                [Leaf: Pure self-employed 8% with ₱250K deduction.]
```

---

## DT-11: VAT vs. Percentage Tax (OPT) Obligation Determination

**Root question:** What indirect tax obligation does this taxpayer have?

**Legal basis:** NIRC Sec. 109(CC), Sec. 116, Sec. 236(G); RR 3-2024; RMC 67-2021

```
START: Is the taxpayer currently VAT-registered?
(Check: BIR Certificate of Registration shows VAT as a registered tax type)
│
├── YES (VAT-registered) →
│    [ACTION: INDIRECT_TAX = "VAT".
│     Percentage tax does NOT apply. VAT applies instead.
│     8% income tax option is NOT available (VAT-registered bars 8% per RR 8-2018).
│     Engine uses Paths A and B only for regime comparison.
│     Paths A and B: no OPT component in total burden calculation.
│     Alert: "As a VAT-registered taxpayer, you have a separate quarterly VAT obligation
│             (BIR Form 2550Q). This tool computes income tax only."
│     Legal: NIRC Sec. 116 (percentage tax applies to NON-VAT persons only);
│            NIRC Sec. 24(A)(2)(b) (8% bars VAT-registered persons).]
│
└── NO (not VAT-registered) →
     What is the taxpayer's annual gross sales (accrual basis)?
     │
     ├── Annual gross sales > ₱3,000,000 →
     │    [ACTION: VAT_REGISTRATION_REQUIRED.
     │     Taxpayer has exceeded the mandatory VAT threshold under NIRC Sec. 236(G).
     │     Required action: File BIR Form 1905 within 10 days of end of the month
     │     when the ₱3,000,000 threshold was exceeded.
     │     INDIRECT_TAX = "PERCENTAGE_TAX_UNTIL_VAT_REGISTRATION_THEN_VAT".
     │     For income tax regime comparison: treat as VAT-registered (no OPT in paths A/B).
     │     8% income tax option NOT available (gross > ₱3M bars 8% per Sec. 24(A)(2)(b)).
     │     Engine shows 2 paths (A and B) only.
     │     Alert: "Your gross sales exceed ₱3,000,000. VAT registration is REQUIRED.
     │             File BIR Form 1905 at your RDO within 10 days of the end of the month
     │             your cumulative sales crossed ₱3,000,000. Until VAT takes effect,
     │             you remain subject to 3% percentage tax."
     │     Legal: NIRC Sec. 236(G); NIRC Sec. 116.]
     │
     └── Annual gross sales ≤ ₱3,000,000 →
          Has the taxpayer elected the 8% income tax option this year?
          (Check: Q1 1701Q Item 16 = Option B, or Form 1905, or 2551Q NIL notation)
          │
          ├── YES (8% option elected) →
          │    [ACTION: INDIRECT_TAX = "NONE_WAIVED".
          │     8% income tax rate is "in lieu of" both the graduated income tax
          │     AND the Sec. 116 percentage tax.
          │     Percentage tax WAIVED — no Form 2551Q required for Q2 and Q3.
          │     (Q1: may have filed 2551Q NIL as election signal; no further 2551Q needed)
          │     Engine uses Path C only for computing 8% regime.
          │     For regime comparison: show Paths A and B WITH hypothetical PT to
          │     demonstrate the savings from Path C (no PT).
          │     Legal: NIRC Sec. 24(A)(2)(b) — "in lieu of" language;
          │            RR 8-2018 Part I; RMC 32-2018.]
          │
          └── NO (not on 8%, or election not yet made) →
               Is the taxpayer eligible to ELECT the 8% option?
               (DT-01 returns ELIGIBLE, AND we are within Q1 election window)
               │
               ├── ELIGIBLE AND WITHIN ELECTION WINDOW →
               │    [ACTION: INDIRECT_TAX = "PERCENTAGE_TAX" (current default).
               │     However: engine MUST show the 8% path (Path C) in regime comparison
               │     to illustrate the benefit of electing 8% (saves 3% OPT).
               │     If Path C is recommended: prompt user to elect 8% via Q1 1701Q.
               │     If graduated (Path A or B) is recommended: user stays on OPT (3%).
               │     Annual PT = annual_gross_sales × 0.03. File Form 2551Q quarterly.
               │     Legal: NIRC Sec. 116; NIRC Sec. 24(A)(2)(b).]
               │
               └── NOT ELIGIBLE OR ELECTION WINDOW CLOSED →
                    [ACTION: INDIRECT_TAX = "PERCENTAGE_TAX".
                     Taxpayer cannot use 8% option this year (DT-01 returned INELIGIBLE,
                     or Q1 deadline passed without election).
                     Annual PT = annual_gross_sales × 0.03. File Form 2551Q quarterly.
                     Engine uses Paths A and B only in regime comparison.
                     Legal: NIRC Sec. 116; RR 8-2018 Part I (irrevocable after Q1).]
```

---

## DT-12: VAT Registration Timing and Transition

**Root question:** When does VAT take effect after the ₱3M threshold is crossed, and what happens during the transition?

**Legal basis:** NIRC Sec. 236(G); RR 11-1998 as amended; NIRC Sec. 116

**Precondition:** Taxpayer is not VAT-registered and gross sales have exceeded ₱3,000,000.

```
START: In which calendar MONTH did cumulative annual gross sales exceed ₱3,000,000?
(breach_month = first month where running total of gross sales > ₱3,000,000)
│
└── breach_month identified (e.g., October 2026)
    │
    ├── REGISTRATION DEADLINE:
    │    Form 1905 must be filed at the RDO within 10 days of the end of breach_month.
    │    Breach month = October → Form 1905 deadline = November 10, 2026.
    │
    ├── PERCENTAGE TAX PERIOD (before VAT takes effect):
    │    OPT (3%) applies to gross sales from January 1 through the last day of the month
    │    BEFORE VAT registration takes effect.
    │    VAT effective date = first day of the month AFTER Form 1905 is processed.
    │    │
    │    ├── Form 1905 filed and processed in November 2026 →
    │    │    VAT effective December 1, 2026.
    │    │    OPT applies to January 1 – November 30, 2026 gross sales.
    │    │    OPT amount = (cumulative gross sales through Nov 30) × 0.03
    │    │    Q4 OPT (Oct–Dec): only October and November gross sales count.
    │    │    December is VAT period — no OPT for December sales.
    │    │    [ACTION: Flag split-quarter OPT obligation. Amended or special Q4 2551Q filing
    │    │     covers October 1 – November 30 only; Q4 VAT (2550Q) covers December only.]
    │    │
    │    └── Form 1905 filed late (after November 10) →
    │         [ACTION: Late VAT registration — BIR may assess penalties for late registration.
    │          OPT technically continues until VAT is processed.
    │          Flag: "Late VAT registration may result in a ₱1,000 compromise penalty.
    │                 Consult your CPA or RDO to regularize your registration status."
    │          For income tax computation: treat taxpayer as non-VAT for OPT purposes up to
    │          VAT effective date, and VAT-registered from VAT effective date onwards.]
    │
    ├── INCOME TAX IMPACT:
    │    For income tax computation (annual ITR):
    │    - Path C (8%) was DISQUALIFIED at point of breach (gross > ₱3M — see CR-024).
    │    - Paths A and B: no percentage tax component for the portion of the year after VAT.
    │    - For the annual ITR: aggregate the full year's gross income (before VAT).
    │    - OPT paid before VAT registration IS deductible under Sec. 34(C)(1) for Path A.
    │    [ACTION: Split-year computation required. Engine prompt:
    │     "You crossed the ₱3M threshold. The engine will compute Path A and B for the
    │      full year. OPT applies only from January 1 to [VAT effective date - 1 day]."]
    │
    └── VAT OBLIGATIONS GOING FORWARD:
         From VAT effective date:
         ├── File BIR Form 2550Q (quarterly VAT return) — due 25th day after quarter end.
         ├── OR BIR Form 2550M (monthly) if gross sales ≥ ₱10M or enrolled in eFPS.
         ├── Charge 12% VAT on all sales from VAT effective date.
         ├── Claim input VAT on VAT-able business purchases from VAT effective date.
         └── [OUT_OF_SCOPE: Full VAT computation. Alert user to engage CPA for VAT compliance.]
```

---

## DT-13: Percentage Tax Filing Obligation Check (Quarter-Level)

**Root question:** For a given quarter, is a Form 2551Q filing required?

**Legal basis:** NIRC Sec. 116; RMC 67-2021; RR 8-2018

```
START: What is the taxpayer's indirect tax status for this quarter?
│
├── VAT-registered for the ENTIRE quarter →
│    [ACTION: NO_2551Q_REQUIRED.
│     Taxpayer files VAT returns (2550M/Q) instead.
│     Ref: NIRC Sec. 116 applies only to non-VAT persons.]
│
├── On 8% income tax option for this year →
│    [ACTION: NO_2551Q_REQUIRED (except possibly Q1 NIL election signal).
│     Q1: If taxpayer elected 8% via a Q1 2551Q NIL filing, that one NIL return was filed.
│          No further 2551Q filings for Q2 and Q3 of this year.
│     Q2, Q3: No 2551Q required (8% waives OPT).
│     Q4: No 2551Q for Q4 (no Q4 quarterly OPT — annual reconciliation via 1701A).
│     Ref: RR 8-2018 Part I — 8% election waives OPT; RMC 32-2018.]
│
├── Non-VAT, graduated rates (Paths A or B), gross ≤ ₱3M for the year →
│    [ACTION: 2551Q_REQUIRED.
│     File BIR Form 2551Q for this quarter.
│     Tax due = gross quarterly SALES (accrual) × 0.03.
│     Even if tax due = ₱0 (e.g., zero gross sales quarter), file a NIL 2551Q before deadline.
│     Deadlines: Q1 April 25, Q2 July 25, Q3 October 25, Q4 January 25.
│     Ref: NIRC Sec. 116; RMC 67-2021.]
│
└── Non-VAT, graduated rates, taxpayer crossed ₱3M during this quarter →
     [ACTION: PARTIAL_QUARTER_2551Q.
      Percentage tax covers only the period from the quarter start through the day
      BEFORE VAT registration takes effect.
      File Form 2551Q for the OPT-applicable portion; separately begin VAT filings.
      This is a manual-review flag (MRF) — engine alerts user to seek CPA guidance
      for the transition quarter.
      Ref: NIRC Sec. 116; NIRC Sec. 236(G); DT-12 for registration timeline.
      See: MRF-019 (VAT transition quarter OPT/VAT split).]
```

---

## Trees To Be Added in Future Aspects

The following decision trees are planned but not yet written. They will be added when the corresponding aspects are analyzed:

| Tree | Aspect That Will Create It | Brief Description |
|------|---------------------------|-------------------|
| DT-14: CWT Credit Application | creditable-withholding-tax | How to apply 2307 credits at quarterly and annual level |
| DT-15: Quarterly vs Annual Filing Sequence | quarterly-filing-rules | Order of operations, cumulative method, installment payment decision |

---

## DT-14: Quarterly Filing Sequence and Form Selection

**Root question:** For a given quarter and taxpayer profile, which forms must be filed and in what order?

**Legal basis:** NIRC Secs. 74–76, 116; BIR Form 1701Q, 2551Q instructions; RA 11976 (EOPT Act)

**When to apply:** At the start of each quarter to determine the taxpayer's filing obligations.

```
START: What is the taxpayer's registration status this quarter?
│
├── Registered BIR (has active COR) AND quarter is Q1, Q2, or Q3 of taxable year
│   │
│   ├── What is the taxpayer's income tax regime?
│   │   │
│   │   ├── 8% INCOME TAX RATE (elected on Q1 1701Q or COR)
│   │   │   │
│   │   │   ├── Q1 AND regime NOT yet locked (first return of the year)
│   │   │   │   → [ACTION: FILE Form 1701Q Q1 with Schedule II, Item 16 = 8%.
│   │   │   │     Do NOT file Form 2551Q. The 8% election waives percentage tax.
│   │   │   │     Due: May 15. Attach 2307s and SAWT if CWT credits claimed.
│   │   │   │     NOTE: Q1 is the ONLY time 8% can be elected. After Q1, regime is locked.
│   │   │   │     Ref: NIRC Sec. 24(A)(2)(b); RR 8-2018 Sec. 2(B); CR-044]
│   │   │   │
│   │   │   ├── Q2 (regime already locked as 8%)
│   │   │   │   → [ACTION: FILE Form 1701Q Q2 with Schedule II.
│   │   │   │     Do NOT file Form 2551Q.
│   │   │   │     Item 50 = Item 51 from prior Q1 Form 1701Q.
│   │   │   │     Due: August 15. Ref: CR-044]
│   │   │   │
│   │   │   └── Q3 (regime locked as 8%)
│   │   │       → [ACTION: FILE Form 1701Q Q3 with Schedule II.
│   │   │         Do NOT file Form 2551Q.
│   │   │         Item 50 = Item 51 from Q2 Form 1701Q.
│   │   │         Due: November 15. Ref: CR-044]
│   │   │
│   │   ├── GRADUATED RATES + OSD
│   │   │   │
│   │   │   ├── Q1
│   │   │   │   → Step 1: [ACTION: FILE Form 2551Q Q1.
│   │   │   │     Percentage tax = Q1 gross receipts × 3%.
│   │   │   │     Due: APRIL 25 (before 1701Q!).
│   │   │   │     Ref: NIRC Sec. 116; CR-034]
│   │   │   │   → Step 2: [ACTION: FILE Form 1701Q Q1 with Schedule I, Item 16A = OSD.
│   │   │   │     Due: May 15.
│   │   │   │     Ref: CR-042]
│   │   │   │
│   │   │   ├── Q2
│   │   │   │   → Step 1: [ACTION: FILE Form 2551Q Q2. Due: July 25.]
│   │   │   │   → Step 2: [ACTION: FILE Form 1701Q Q2 with Schedule I. Due: August 15.]
│   │   │   │
│   │   │   └── Q3
│   │   │       → Step 1: [ACTION: FILE Form 2551Q Q3. Due: October 25.]
│   │   │       → Step 2: [ACTION: FILE Form 1701Q Q3 with Schedule I. Due: November 15.]
│   │   │
│   │   ├── GRADUATED RATES + ITEMIZED DEDUCTIONS
│   │   │   │
│   │   │   │   (Same filing sequence as Graduated+OSD but Form 1701Q uses Itemized computation)
│   │   │   │
│   │   │   ├── Q1 → FILE 2551Q Q1 (Apr 25) THEN 1701Q Q1 (May 15, Schedule I, Itemized)
│   │   │   ├── Q2 → FILE 2551Q Q2 (Jul 25) THEN 1701Q Q2 (Aug 15, Schedule I, Itemized)
│   │   │   └── Q3 → FILE 2551Q Q3 (Oct 25) THEN 1701Q Q3 (Nov 15, Schedule I, Itemized)
│   │   │         [Ref: CR-043]
│   │   │
│   │   └── VAT-REGISTERED (>₱3M, Graduated rates only)
│   │       │
│   │       ├── Q1 → FILE Form 2550Q Q1 (May 25) THEN 1701Q Q1 (May 15)
│   │       │     [NOTE: 2550Q Q1 due May 25 is AFTER 1701Q Q1 due May 15.
│   │       │      File income tax first, then VAT return.]
│   │       ├── Q2 → FILE 1701Q Q2 (Aug 15) AND 2550Q Q2 (Aug 25)
│   │       └── Q3 → FILE 1701Q Q3 (Nov 15) AND 2550Q Q3 (Nov 25)
│   │           [Ref: CR-031, CR-033; No Form 2551Q (VAT-registered)]
│
├── Registered BUT this is Q4 of the taxable year
│   │
│   ├── Graduated + OSD or Itemized (non-VAT)
│   │   → [ACTION: FILE Form 2551Q Q4. Due: January 25 of NEXT YEAR.
│   │     This is the ONLY Q4 quarterly obligation. No 1701Q for Q4.
│   │     The annual 1701 / 1701A due April 15 covers Q4 income.
│   │     Ref: NIRC Sec. 116; CR-032]
│   │
│   ├── 8% rate
│   │   → [ACTION: No Q4 quarterly filings. Annual 1701A due April 15 of next year.
│   │     No Form 2551Q for Q4 (percentage tax waived). Ref: CR-044]
│   │
│   └── VAT-registered
│       → [ACTION: FILE Form 2550Q Q4. Due: February 25 of next year.
│         No 1701Q for Q4. Annual 1701 due April 15. Ref: CR-031]
│
├── Registered but this is the ANNUAL PERIOD (prior year filing)
│   │
│   ├── 8% rate OR Graduated+OSD, purely self-employed, non-VAT
│   │   → [ACTION: FILE Form 1701A. Due: April 15.
│   │     Attach: all 2307s, SAWT, prior year carry-over schedule if applicable.
│   │     Ref: CR-011, CR-037]
│   │
│   ├── Graduated+Itemized, OR mixed-income, OR VAT-registered
│   │   → [ACTION: FILE Form 1701. Due: April 15.
│   │     Attach: financial statements if GR ≥ ₱3M (or if required by RDO),
│   │     Schedule of itemized deductions, NOLCO schedule, all 2307s, SAWT.
│   │     Ref: CR-011, CR-037, CR-027]
│   │
│   └── Annual balance payable > ₱2,000 AND taxpayer elects installment
│       → [ACTION: Pay 50% of balance by April 15. Pay remaining 50% by October 15.
│         Elect installment on the return (Item 25 on Form 1701/1701A).
│         Ref: CR-011 Installment Payment Rule]
│
├── First-year taxpayer registered DURING the year
│   │
│   ├── Registered Q1 (Jan–Mar) → Normal filing obligations from Q1 onward
│   ├── Registered Q2 (Apr–Jun) → First quarterly return is the Q2 1701Q
│   │   [Q2 is the election quarter for 8%. Due: August 15.
│   │    First 2551Q is Q2 (if graduated). Due: July 25.]
│   ├── Registered Q3 (Jul–Sep) → First quarterly return is Q3 1701Q
│   │   [Q3 is the election quarter. Due: November 15.
│   │    First 2551Q is Q3. Due: October 25.]
│   └── Registered Q4 (Oct–Dec) → No quarterly returns this year
│       [Only obligation: Annual 1701/1701A due April 15 of next year.
│        For graduated: Q4 2551Q due January 25 of next year.
│        Ref: CR-047]
│
└── NOT registered (no active BIR COR) → [ACTION: REGISTRATION_REQUIRED.
    Taxpayer must register with BIR (Form 1901) before any filing obligations arise.
    Ref: NIRC Sec. 236; RA 11976 EOPT registration rules]
```

---

## DT-15: Quarterly Installment and Overpayment at Quarter Level

**Root question:** At the end of a quarterly computation, is the quarter-level tax payable positive, zero, or negative (overpayment)?

**Legal basis:** NIRC Sec. 74–75; BIR Form 1701Q Schedule III Item 63

```
START: Compute Item 63 = Item 46 or 54 (cumulative tax due) − Item 62 (total credits)
│
├── Item 63 > ₱0 (tax payable this quarter)
│   │
│   └── → [ACTION: PAY Item 63 by the quarterly due date.
│           File 1701Q showing this amount in Part III, Item 28.
│           Actual payment = Item 63.
│           This amount becomes "tax paid prior quarters" (Item 56) on the NEXT quarter's return.]
│
├── Item 63 = ₱0 (tax due fully covered by credits, no excess)
│   │
│   └── → [ACTION: FILE NIL quarterly return (still required).
│           No payment needed. Tax payable = ₱0.
│           Proceed to annual reconciliation at year-end.
│           This quarter contributes ₱0 to Item 56 of next quarter.]
│
└── Item 63 < ₱0 (overpayment at quarterly level)
    │
    ├── Is this Q1 or Q2?
    │   │
    │   └── → [ACTION: FILE quarterly return showing ₱0 payable (Item 28 shows ₱0, not negative).
    │           Actual payment = ₱0.
    │           The overpayment is NOT refunded at the quarterly level.
    │           It is implicitly absorbed: next quarter's credits (Item 56) will include only
    │           actual cash paid (₱0 this quarter), so the cumulative structure naturally
    │           prevents double-counting. The overpayment "disappears" — the next quarter's
    │           cumulative tax due will still be offset by the growing CWT aggregate.]
    │
    └── Is this Q3 (last quarterly return)?
        │
        └── → [ACTION: FILE Q3 return showing ₱0 payable.
               Overpayment at Q3 level will flow through to annual reconciliation.
               At annual: balance = (annual IT − annual CWT − total Q1+Q2+Q3 payments).
               Since Q3 payment = ₱0, the Q3 overpayment simply means the annual credits
               are large — annual balance = negative = overpayment.
               See DT for annual overpayment disposition (disposition of excess at CR-038).]
```

---

## Updated Trees Summary

| Tree | Description | Status |
|------|-------------|--------|
| DT-01 | 8% Option Eligibility | Complete |
| DT-02 | 8% Election Procedure | Complete |
| DT-03 | Mid-Year ₱3M Breach | Complete |
| DT-04 | Annual Form Selection (1701 vs 1701A) | Complete |
| DT-05 | ₱250K Deduction Applicability | Complete |
| DT-06 | Form 2551Q Obligation | Complete |
| DT-07 | Regime Recommendation (best path) | Complete |
| DT-08 | Mixed Income Annual Tax | Complete (DT-09 covers mixed income flow) |
| DT-09 | Mixed Income Computation Flow | Complete |
| DT-10 | ₱250K Deduction Decision for Mixed Income | Complete |
| DT-11 | VAT vs OPT Obligation | Complete |
| DT-12 | VAT Registration Timing | Complete |
| DT-13 | Quarter-Level PT Filing Check | Complete |
| DT-14 | Quarterly Filing Sequence and Form Selection | Complete (this document) |
| DT-15 | Quarterly Installment and Overpayment | Complete (this document) |
| DT-16 | VAT-Registered Regime Selection (OSD vs Itemized) | Complete |
