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
               Does the taxpayer wish to attach Audited Financial Statements?
               (Required when gross > ₱3M; for below ₱3M, attachment is optional under EOPT)
               │
               ├── YES (attaching AFS) →
               │    [ACTION: ANNUAL_FORM = "1701A" or "1701" (either acceptable).
               │     Form 1701A can accommodate itemized deductions.
               │     Form 1701 provides more detailed schedule for itemized items.
               │     BIR accepts either; recommend 1701A for simplicity.
               │     Ref: BIR form instructions; EOPT simplifications.]
               │
               └── NO (not attaching AFS) →
                    [ACTION: ANNUAL_FORM = "1701A".
                     For non-AFS filers on itemized: use Form 1701A.
                     Schedule 3 (Itemized Deductions) is available within 1701A for
                     the detailed deduction breakdown.
                     Ref: BIR Form 1701A instructions; RR 8-2018.]
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

## DT-07: Regime Recommendation (Overview — Fully Expanded in regime-comparison-logic aspect)

**Root question:** Given gross receipts and business expenses, which tax path has the lowest total tax burden?

**Legal basis:** NIRC Sec. 24(A); CR-007 in computation-rules.md

**Note:** This tree provides a high-level flow. For exact formula application, see
[computation-rules.md](computation-rules.md) CR-007.

```
START: What is the taxpayer's income profile?
│
├── PURELY SELF-EMPLOYED (no compensation) →
│    Is 8% option eligible? (Run DT-01)
│    │
│    ├── NOT ELIGIBLE →
│    │    Compare Path A vs Path B:
│    │    ├── expense_ratio > 0.40? → Path A (itemized) likely wins vs Path B (OSD)
│    │    └── expense_ratio ≤ 0.40? → Path B (OSD) likely wins vs Path A (itemized)
│    │    [Compute both; recommend lower. See CR-007.]
│    │
│    └── ELIGIBLE →
│         Is expense_ratio ≥ breakeven_threshold(gross_receipts)?
│         (Breakeven table: see CR-014 / lookup-tables/graduated-rate-table.md)
│         │
│         ├── YES (high expenses, itemized may beat 8%) →
│         │    Compute all 3 paths. Compare Path A vs Path C.
│         │    ├── Path A (itemized) ≤ Path C (8%)? → Recommend Path A
│         │    └── Path C (8%) < Path A (itemized)? → Recommend Path C
│         │
│         └── NO (low expenses) →
│              [ACTION: RECOMMEND = PATH_C (8%). 8% always beats Path B (OSD) for service
│               businesses below ₱3M. Only verify if Path A (itemized) might win with
│               very high expenses. Ref: CR-014 breakeven analysis.]
│
└── MIXED INCOME (compensation + business) →
     Compensation portion: always graduated rates (no choice).
     Business portion: run DT-01 for eligibility.
     ├── 8% ELIGIBLE → Compare: graduated+deduction vs 8% for business portion.
     └── NOT ELIGIBLE → Graduated + OSD or Itemized for business portion.
     [Compute total tax for each combination. See mixed-income-rules aspect for full tree.]
```

---

## Trees To Be Added in Future Aspects

The following decision trees are planned but not yet written. They will be added when the corresponding aspects are analyzed:

| Tree | Aspect That Will Create It | Brief Description |
|------|---------------------------|-------------------|
| DT-08: VAT vs Percentage Tax Determination | vat-vs-percentage-tax | Is taxpayer VAT or OPT? Threshold mechanics, registration obligations |
| DT-09: Mixed Income Computation Flow | mixed-income-rules | Full compensation + business income computation with all regime combinations |
| DT-10: Form 1701Q vs 1701A vs 1701 (full) | bir-form-1701-field-mapping | Expanded version of DT-04 with all schedule-level branching |
| DT-11: CWT Credit Application | creditable-withholding-tax | How to apply 2307 credits at quarterly and annual level |
| DT-12: Quarterly vs Annual Filing Sequence | quarterly-filing-rules | Order of operations, cumulative method, installment payment decision |
| DT-13: OSD vs Itemized Comparison | osd-computation | When OSD beats itemized and vice versa |
| DT-14: NOLCO Applicability | edge-cases | When net operating loss carry-over applies |
| DT-15: First-Year Taxpayer Setup | edge-cases | New taxpayer mid-year registration, first filing obligations |
