# Edge Cases — Philippine Freelance & Self-Employed Income Tax Optimizer

**Status:** INITIAL (populated from eopt-taxpayer-tiers aspect; to be expanded in Wave 2 edge-cases aspect)
**Last updated:** 2026-02-28

Every edge case is numbered, described, and resolved. The engine must handle all of these without fallback to "consult a professional" — those belong in [manual-review-flags.md](manual-review-flags.md) instead.

---

## Group EC-T: Taxpayer Tier Classification Edge Cases

### EC-T01: First-Year Registrant — No Prior Year Gross Sales
**Scenario:** A freelancer registers with BIR in 2025 and has no prior-year gross sales data.

**What the engine must do:**
1. Default classification: MICRO
2. Use the user's current-year gross estimate to compute taxes (they haven't filed yet)
3. Note in output: "You are classified as Micro taxpayer (default for first-year registrants) under RR 8-2024. Your classification will be updated by BIR based on your first-year annual return."

**Legal basis:** RR 8-2024 — new registrants classified as Micro until first taxable year gross sales are established via filed annual return.

**Engine behavior:**
- `taxpayer_tier = TaxpayerTier.MICRO`
- `classification_source = "default_first_year"`
- Penalties/interest apply at MICRO rates

---

### EC-T02: Taxpayer Crosses ₱3M Mid-Year (Intra-Year Threshold Breach)
**Scenario:** A freelancer was MICRO at the start of the year (below ₱3M prior year), but cumulative gross receipts exceed ₱3M by, say, October.

**What triggers:**
1. **VAT registration obligation:** Triggered immediately upon exceeding ₱3M. Must register for VAT within 30 days of the month the threshold was exceeded (per NIRC Sec. 236(G)). VAT effective from the next quarter after registration.
2. **Tier reclassification:** Does NOT change mid-year. The taxpayer remains MICRO for the current taxable year. BIR will issue written notice; new tier (SMALL) takes effect the FOLLOWING taxable year.
3. **8% option:** If taxpayer elected 8% at start of year and crosses ₱3M mid-year, the 8% election is RETROACTIVELY CANCELLED for the entire year. Taxpayer must switch to graduated rates (Path A or B) for the full year. Any 8% quarterly payments are reclassified as advance payments toward the graduated tax.

**Engine behavior when user inputs annual gross > ₱3M but notes they were on 8% option:**
- Detect: `gross_receipts > 3_000_000 AND elected_eight_percent = true`
- Flag: EC-T02 — "You elected 8% but your gross exceeds ₱3M. The 8% option is not available. Your computation has been switched to graduated rates."
- Recompute using Paths A and B only
- Note: VAT registration obligation (tool cannot compute VAT, but must alert)

**Quarterly implications:**
- Q1 and Q2 paid under 8% are treated as advance payments
- At annual reconciliation, total tax under graduated method is computed; quarterly payments credited
- If taxpayer crossed ₱3M in Q3, Q3 and annual return must use graduated method

---

### EC-T03: Taxpayer Falls Below ₱3M After Being SMALL (Downgrade)
**Scenario:** A SMALL taxpayer's annual gross drops below ₱3M in the current year.

**What does NOT change immediately:**
- Tier: Still SMALL until BIR issues written reclassification notice
- VAT status: Does NOT automatically deregister from VAT just because gross falls below ₱3M. Requires:
  - 3 consecutive years with gross receipts below ₱3M, OR
  - Formal application for VAT deregistration with BIR
- 8% option: NOT available even if gross is now below ₱3M, because the taxpayer is still classified as SMALL (not yet reclassified to MICRO)

**Engine behavior:**
- If user indicates they are a VAT-registered taxpayer, tool excludes 8% option regardless of current gross
- Tool notes: "If your VAT registration is active, the 8% option is not available even if gross receipts are below ₱3M."

---

### EC-T04: Mixed-Income Taxpayer — What Gross Sales Is Used for Tier Classification?
**Scenario:** An employee earning ₱2M in salary also earns ₱2.5M from freelance consulting.

**Tier classification:** Based on BUSINESS INCOME ONLY.
- Business income: ₱2.5M → MICRO (below ₱3M)
- Compensation income: ₱2M → EXCLUDED from tier calculation

**Engine behavior:**
- `business_gross = 2_500_000`
- `compensation_gross = 2_000_000`
- `tier_classification_basis = business_gross  // NOT business_gross + compensation_gross`
- `taxpayer_tier = TaxpayerTier.MICRO`
- `eight_percent_eligible = True  // business gross ≤ ₱3M`
- Note: 8% option for mixed-income does NOT include ₱250K deduction (per RMC 50-2018)

---

### EC-T05: Multiple Business Lines — How to Aggregate for Tier
**Scenario:** A freelancer earns ₱1.5M from design work + ₱1.2M from online tutoring + ₱0.5M from selling digital products = ₱3.2M total business income.

**Tier classification:** ALL business lines are aggregated.
- Total business gross: ₱3,200,000 → SMALL tier
- 8% option: NOT available (> ₱3M)
- VAT registration: Required

**Engine behavior:**
- Input: `income_sources: array of {source_name, gross_amount, income_type}`
- Computation: `total_business_gross = sum(gross_amount for each source where income_type == "business")`
- `taxpayer_tier = classify_tier(total_business_gross)`

**Caveat for the engine:** The tool collects a single `gross_receipts` value, which must represent the TOTAL of all business income sources. The wizard step for gross receipts must include helper text: "Include all income from freelancing, professional practice, and any business activity. Do not include salary from employment."

---

### EC-T06: Fraud Violation — No Tier-Based Reduction
**Scenario:** A taxpayer (any tier) files a fraudulent return to understate income.

**Surcharge rate:** 50% of tax due, regardless of tier.

**Engine behavior:**
- The optimizer computes regular taxes and does not compute fraud penalties — those are assessed by BIR after audit.
- However, in the penalty estimator section: `if violation_type == FRAUD: surcharge_rate = 0.50` (overrides tier-based rates)
- Note in output: "Fraud violations carry a 50% surcharge regardless of taxpayer tier. This rate is not reducible."

---

### EC-T07: Wrong Venue — Eliminated by EOPT
**Scenario:** A taxpayer files their return at the wrong RDO or pays at a bank outside their registered RDO's jurisdiction.

**Pre-EOPT (before January 22, 2024):** 25% surcharge (wrong-venue penalty).

**Post-EOPT (January 22, 2024 onwards):** ELIMINATED. No penalty for filing or paying at any authorized agent bank, RDO, or authorized tax software provider.

**Engine behavior:**
- Do NOT compute or mention wrong-venue penalties for TY2024 onwards.
- For prior-year computations (TY2023 or earlier): engine may note that wrong-venue penalty could apply for prior periods, but does not compute this (it's a manual BIR assessment, not self-computable).

---

### EC-T08: Reclassification Mid-Period — Which Rules Apply?
**Scenario:** BIR sends a reclassification notice in March 2025, upgrading a taxpayer from MICRO to SMALL for TY2025.

**Rules:**
- For TY2024 annual return (filed April 2025): MICRO rates apply (old classification)
- For TY2025 returns: SMALL rates apply (new classification)
- Notice sent in Q1 TY2025 → new tier effective for the FULL TY2025

**Engine behavior:**
- Ask user: "Has BIR issued you a written taxpayer classification notice?"
- If yes: ask what tier was assigned and effective year
- Apply the stated tier for the relevant tax year computation
- Note: "If you have not received a written BIR notice, your classification remains as previously set."

---

### EC-T09: ₱3,000,000 Exactly — Boundary Case
**Scenario:** A freelancer's annual gross receipts are exactly ₱3,000,000.00.

**Rules that apply:**
| Rule | Amount | Classification |
|------|--------|----------------|
| Taxpayer tier (MICRO is "less than ₱3M") | ₱3,000,000 | SMALL tier |
| 8% option (available if gross "does not exceed ₱3M") | ₱3,000,000 | 8% AVAILABLE |
| VAT registration (required if "exceeds ₱3M") | ₱3,000,000 | VAT NOT required |
| Non-VAT percentage tax (Section 116) | ₱3,000,000 | Applicable (if not on 8%) |
| EWT rate by clients (based on ≤ ₱3M) | ₱3,000,000 | 5% rate applies |

**Engine implementation:**
```
GROSS = 3_000_000

is_micro = GROSS < 3_000_000           // False → SMALL tier for penalties
is_eight_pct_eligible = GROSS <= 3_000_000   // True → can elect 8%
must_register_vat = GROSS > 3_000_000        // False → non-VAT
pct_tax_applies = GROSS <= 3_000_000         // True (if not on 8%)
ewt_rate_from_clients = 0.05                 // ≤ ₱3M → 5%
surcharge_rate_if_late = 0.10               // SMALL → 10% (same as MICRO)
interest_rate_if_late = 0.06               // SMALL → 6%/yr (same as MICRO)
```

**Key note:** At exactly ₱3,000,000, the SMALL tier applies for classification purposes, but the penalty and interest rates are the SAME as MICRO (both SMALL and MICRO get 10%/6%). So the practical impact of this boundary is:
- 8% option still available ✓
- VAT still not required ✓
- Tier is SMALL (but penalty rates same as MICRO) ✓

---

---

## Group EC-EM: E-Marketplace & DFSP Withholding Edge Cases (RR 16-2023)

**Legal basis:** RR No. 16-2023 (December 27, 2023); RMC No. 8-2024 (January 15, 2024)

### EC-EM01: Freelancer Below ₱500,000 Threshold — No Sworn Declaration Submitted
**Scenario:** A freelancer earns ₱350,000 via Payoneer in the year. They do not know about the Sworn Declaration requirement and fail to submit it by January 20.

**What happens:**
- Payoneer is legally obligated to withhold (trigger 2: failure to submit SD)
- CWT amount: ₱350,000 × 0.005 = ₱1,750 withheld (even though below threshold)
- Freelancer receives ₱348,250 net from Payoneer
- Payoneer issues 2307 (WI760) showing income payment ₱175,000, tax withheld ₱1,750

**Engine behavior:**
- If user reports receiving a 2307 from Payoneer with WI760 ATC: accept and credit ₱1,750 against tax due
- Warn user: "You may have had ₱1,750 withheld unnecessarily. If your combined annual gross remittances from ALL platforms were below ₱500,000, you were eligible to submit a Sworn Declaration to avoid this withholding. The withheld amount still offsets your income tax."
- Engine cannot reverse the withheld amount — user must claim it as CWT credit

**Resolution:** No adjustment to computation. Credit the 2307 amount as normal CWT.

---

### EC-EM02: Multiple Platforms — Combined Total Exceeds ₱500,000 But No Single Platform Does
**Scenario:** A freelancer earns:
- Via Payoneer (from Upwork): ₱280,000
- Via GCash (from local clients): ₱260,000
- Combined: ₱540,000

Freelancer submits a Sworn Declaration to both platforms claiming "my total from all platforms is below ₱500,000" (which is false).

**What happens:**
- The SD is a false declaration — this is a criminal tax fraud offense
- If neither platform independently tracks across all DFSPs, they may not withhold (each platform sees only its own ₱280K or ₱260K)
- The freelancer still owes income tax on ₱540,000; the withholding is merely a collection mechanism
- BIR cross-matching of 2307s from both platforms will reveal the true combined amount

**Engine behavior:**
- Engine asks: "What are your combined gross remittances from ALL e-marketplace and DFSP platforms?"
- If user enters ₱540,000 combined (honest): engine flags that they were NOT eligible for exemption
- Engine cannot validate whether user actually submitted a false SD; it computes based on actual income declared
- If user declares ₱540,000 income, the income tax computation is on ₱540,000 regardless of whether platforms withheld

**Resolution:** Engine computes income tax on declared income. If user enters 2307s showing ₱0 CWT (because platforms didn't withhold), no CWT credit is applied. If platforms did withhold, credit is applied.

---

### EC-EM03: Upwork→Payoneer→GCash Chain — Who Withholds?
**Scenario:** Freelancer receives payment: Upwork (collects from client) → Payoneer (USD wallet) → GCash (PHP conversion and final credit).

**What happens:**
- Upwork is NOT the withholding agent (it is upstream; Payoneer is the last facility controlling payment before remittance)
- Payoneer is the intermediate DFSP, but if it remits to GCash rather than directly to the freelancer's bank:
  - If Payoneer → GCash → Freelancer: GCash may be the "last facility" (the one that credits the freelancer's account)
  - Practical reality (as of 2024-2026): Payoneer typically settles in the freelancer's bank account directly (not via GCash). GCash-Payoneer transfers go through bank intermediaries.
  - The platform actually converting and sending final funds to the freelancer is the withholding agent.

**Engine behavior:**
- Engine does not need to resolve the Payoneer vs. GCash determination
- Engine asks: "Did you receive a BIR Form 2307 from Payoneer, GCash, Maya, or any other platform for ATC WI760?"
- Whatever 2307s the user actually received: credit those amounts
- If the user received no 2307 despite having income above ₱500K: flag as potential compliance issue (platform may not have been BIR-compliant yet) but still compute income tax normally

**Resolution:** Credit whatever 2307s the user presents. Engine does not adjudicate which platform was legally required to withhold.

---

### EC-EM04: Platform CWT Exceeds Income Tax Due — Refundable Excess
**Scenario:** A freelancer has low taxable income (near ₱250K threshold) but received substantial CWT from platforms:
- Gross receipts: ₱400,000
- Income tax under 8%: (₱400,000 − ₱250,000) × 0.08 = ₱12,000
- Platform CWT (from ₱400,000 via Payoneer): ₱400,000 × 0.005 = ₱2,000
- Professional fee CWT from clients (5% on some contracts): ₱8,000
- Total CWT: ₱10,000
- Balance payable: ₱12,000 − ₱10,000 = ₱2,000 (still payable)

**Alternative scenario with excess:**
- Gross receipts: ₱300,000
- Income tax under 8%: (₱300,000 − ₱250,000) × 0.08 = ₱4,000
- Platform CWT: ₱300,000 × 0.005 = ₱1,500
- Professional fee CWT: ₱5,000
- Total CWT: ₱6,500
- Excess CWT: ₱6,500 − ₱4,000 = ₱2,500 refundable

**Engine behavior:**
```
balance_payable = MAX(0, income_tax_due - total_cwt_credits)
cwt_excess      = MAX(0, total_cwt_credits - income_tax_due)

if cwt_excess > 0:
  display: "You have ₱{cwt_excess} in excess CWT credits. This may be:
            (a) Applied as tax credit to next year's income tax return, OR
            (b) Claimed as refund (BIR Form 1914 refund application)"
  flag: MANUAL_REVIEW_CWT_EXCESS
```

**Resolution:** Engine computes and displays excess CWT. Notifies user of options (carry-forward or refund claim). Refund application itself is out of scope for the tool.

---

### EC-EM05: Platform Issues 2307 With Incorrect ATC — WI160 vs. WI760
**Scenario:** A platform issues a 2307 with ATC WI160 (which is the general EWT code for professional fees, not the e-marketplace code) instead of WI760.

**What happens:**
- This is a platform compliance error
- The 2307 amount is still a valid creditable withholding tax regardless of the ATC code
- BIR cross-matching may flag a discrepancy, but the freelancer's credit is still valid

**Engine behavior:**
- Engine accepts 2307 entries regardless of ATC code (user enters total CWT amount)
- Engine does NOT validate ATC codes on 2307s (out of scope)
- For the optimizer, any creditable withholding tax from 2307 reduces the balance payable

**Resolution:** Engine accepts and credits the amount. No special handling needed beyond the general CWT credit computation.

---

### EC-EM06: Freelancer Not Registered With BIR — Cannot Use Payoneer
**Scenario:** Under RR 16-2023, platforms are PROHIBITED from allowing unregistered sellers. A freelancer who uses Payoneer/GCash must have their BIR Certificate of Registration (Form 2303) submitted to the platform.

**What happens:**
- Technically, if a freelancer is using Payoneer without submitting Form 2303, both the freelancer and Payoneer are in violation of RR 16-2023
- BIR enforcement is actively targeting unregistered online freelancers

**Engine behavior:**
- Engine is NOT a registration tool; it computes tax for people who ARE already filing
- If the user is not BIR-registered, the engine should display a pre-computation notice: "To use this tool and to legally receive payments via Payoneer, GCash, or similar platforms, you must first register with BIR (Form 1901). Penalty for late registration: ₱1,000 compromise penalty. Click here to learn how to register."
- Engine proceeds with computation if user indicates they will register (tool helps them understand their tax obligation)

**Resolution:** Registration prompt displayed. Computation proceeds normally if user confirms or ignores the notice.

---

### EC-EM07: Annual vs. Quarterly 2307 Timing — Platform Issues Annual 2307
**Scenario:** Some platforms may issue a single annual 2307 instead of quarterly 2307s. The BIR rules require quarterly issuance within 20 days after each quarter end.

**What happens:**
- For the ANNUAL ITR computation: whether quarterly or annual 2307, the total CWT for the year is the same
- For QUARTERLY 1701Q computation: if the user doesn't have quarterly 2307s, they cannot properly credit CWT on 1701Q

**Engine behavior:**
- Engine asks for CWT breakdown by quarter when computing quarterly payments
- If user only has annual total (from one 2307): engine distributes proportionally or allows user to allocate quarterly amounts manually
- For annual ITR computation: total annual CWT is entered regardless of quarter breakdown
- Flag: "Your platform should issue BIR Form 2307 within 20 days after each quarter end. If you're only receiving an annual certificate, request quarterly certificates from your platform."

**Resolution:** For annual computation, accept total annual 2307 amount. For quarterly computation, if no quarterly breakdown available, allow user to enter estimate or distribute evenly across quarters.

---

---

## Group EC-P: Penalty and Compliance Edge Cases

**Legal basis:** NIRC Sections 203, 222, 247-282; RA 11976 (EOPT Act); RMO 7-2015

### EC-P01: Multiple Missed Returns in Same Year — Offense Counter
**Scenario:** A freelancer missed filing 1701Q for Q1, Q2, and Q3. They are catching up in November. Q1 and Q3 had ₱0 tax due (nil). Q2 had ₱15,000 tax due.

**What the engine must compute:**
- Q1: Nil return, 1st offense (most recent tax year, first discovered) → ₱1,000 compromise
- Q2: Return with tax due → compromise based on ₱15,000 bracket (₱10,001–₱20,000) → ₱5,000 compromise + 10% surcharge + 6% interest
- Q3: Nil return, 2nd offense → ₱5,000 compromise

**Engine behavior:**
- Track offense number for nil returns within a single catch-up scenario
- Q1 nil = offense 1 (₱1,000), Q3 nil = offense 2 (₱5,000)
- Returns with tax due have a fixed compromise table (no offense counter — bracket-based)
- Offense counter is NOT shared between nil and non-nil return types

**Key rule:** Offense numbering for nil returns is PER SERIES OF VIOLATIONS identified in the same inspection or catch-up, NOT per lifetime. Engine defaults to offense 1 for the first nil return in the current catch-up, incrementing from there.

---

### EC-P02: Abatement Claim — Force Majeure (Typhoon, BIR System Downtime)
**Scenario:** A freelancer missed filing the Q3 1701Q deadline because Typhoon Julian caused eBIRForms to be inaccessible and AABs were closed in their area from October 1–15.

**What happens:**
- Taxpayer is entitled to file for ABATEMENT of surcharges and interest under NIRC Section 204(B)
- Must file BIR Form 2105 with supporting documentation (news clippings, barangay certification, etc.)
- If approved: surcharge and interest are WAIVED; only the basic tax due remains payable
- Compromise penalty may also be abated

**Engine behavior:**
- Engine computes the FULL penalty as if no abatement
- Adds a note: "If your late filing was caused by a BIR-recognized circumstance (typhoon, earthquake, BIR eFPS/eBIRForms downtime, etc.), you may apply for penalty abatement under NIRC Section 204(B). File BIR Form 2105 with your RDO. If approved, surcharges and interest are waived."
- Engine does NOT compute post-abatement amounts (outcome is discretionary per BIR)
- Flag: MRF_ABATEMENT_POSSIBLE

**Resolution:** Display full penalty amounts. Display abatement note. Mark as manual review flag.

---

### EC-P03: Prescriptive Period — Prior Year Return Already Prescribed
**Scenario:** A freelancer asking "what if I caught up filing my TY2019 income tax return right now (in 2026)?"

**What happens (assuming return was filed late in 2020):**
- TY2019 annual return was due April 15, 2020
- If filed late in 2020: 3-year prescriptive period started from actual filing date → expires ~2023
- If filed in 2026 (now): the assessment window has ALREADY EXPIRED
- BIR can no longer ASSESS deficiency taxes for TY2019 (with ordinary 3-year period)
- However: the tax was still legally DUE; the filing is still required; late filing penalties still apply for the act of filing late

**Engine behavior:**
```
prescriptive = is_still_assessable(2019, filed_on_time=False, return_filed=True,
                                    has_fraud=False, current_date=2026-03-01)
→ expiry_date = ~2023 (3 years from 2020 filing)
→ is_assessable = False

if not prescriptive.is_assessable:
  display: "Your TY2019 return appears to be beyond the 3-year ordinary assessment
            period. BIR can generally no longer assess additional deficiency taxes for
            this year. However, late filing penalties (surcharge, interest, compromise)
            still apply for the filing. Filing late is better than not filing at all."
```

**Key distinction:** Prescriptive period prevents BIR from ASSESSING additional tax. It does NOT waive the taxpayer's obligation to FILE and PAY the tax due.

---

### EC-P04: Substantial Underdeclaration — Fraud Surcharge Override
**Scenario:** A freelancer declared ₱500,000 gross receipts but actual gross receipts were ₱900,000 (underdeclaration of ₱400,000 = 80% of declared amount, well above 30% threshold).

**What triggers:**
1. Section 248(B): Creates PRIMA FACIE evidence of fraudulent return
2. Fraud surcharge: 50% of FULL deficiency (not 25% or the EOPT-reduced 10%)
3. Assessment period: 10-year extraordinary period from BIR's date of discovery
4. Criminal referral: BIR may refer to DOJ for prosecution under Section 254

**Computation:**
```
declared_gross = 500_000
actual_gross   = 900_000
underdeclaration = 400_000
underdecl_pct = 400_000 / 500_000 = 80%  // > 30% → prima facie fraud

// Engine scenario: user entered both amounts, engine detects discrepancy
if underdecl_pct > 0.30:
  violation_type = ViolationType.FRAUD
  surcharge_rate = 0.50  // OVERRIDES tier-based rates (EOPT reduction does NOT apply)
  flag: EC_P04_SUBSTANTIAL_UNDERDECLARATION
  display: "WARNING: Your underdeclaration exceeds 30% of your declared income.
            Under NIRC Section 248(B), this creates prima facie evidence of a
            fraudulent return. A 50% civil surcharge applies (not reduced by EOPT).
            The BIR has 10 years from discovery to assess additional taxes.
            This situation should be resolved with a licensed CPA."
```

**Engine behavior:**
- Compute 50% surcharge on the additional tax due (not the declared tax due)
- Compute interest at tier rate (fraud does NOT change interest rate — only surcharge)
- Compute compromise penalty from table (based on additional tax due)
- Output full exposure with warning
- Flag: MANUAL_REVIEW — user must consult a CPA for remediation

---

### EC-P05: Nil Return Filed Late — Multiple Years Not Filed
**Scenario:** A freelancer has been freelancing for 3 years and has NEVER filed any return. They want to catch up now. Each year they had ₱0 net tax due (earnings under ₱250,000, pure gross basis).

**What applies:**
- 3 annual returns missed (1701A, assumed nil — no tax due each year)
- Q1, Q2, Q3 quarterly returns (1701Q) missed for each year = 9 quarterly returns
- Percentage tax returns (2551Q) missed if they were not on 8% = 12 quarterly returns per year × 3 years = 36 missed 2551Q

**Compromise penalties per return (nil, Sec. 275):**
- Annual 1701A: 1st offense ₱1,000, 2nd offense ₱5,000, 3rd offense ₱10,000
- Quarterly 1701Q (nil): counted sequentially — 1st through 9th offense (3rd = ₱10,000; subsequent = escalates to prosecution if not compromised)
- Quarterly 2551Q (nil): same offense counter progression

**Engine behavior:**
- For this catch-up scenario, show estimated total compromise exposure
- Flag that quarterly returns beyond 3rd offense may not be compromisable
- Note that filing (even late, even nil) is better than not filing — prescriptive period starts running

**Resolution:** Engine computes 1st, 2nd, 3rd offense amounts for nil returns. For the 4th+ nil return in sequence, flags as "may require criminal prosecution" and outputs: "For returns beyond the 3rd missed nil filing, consult a CPA for negotiated settlement with BIR."

---

### EC-P06: Compromise Penalty Not Applicable — Fraud Violation
**Scenario:** BIR discovers a freelancer used ghost receipts (fake expenses) to overstate deductions, inflating tax savings. This constitutes fraud under Section 254.

**What triggers:**
1. 50% fraud surcharge (Section 248(B))
2. Criminal prosecution under Section 254: fine ₱30,000–₱100,000 + imprisonment 2–4 years
3. **CANNOT be compromised** — Section 254 violations are excluded from the compromise framework

**Engine behavior:**
- Engine does NOT process fraud scenarios (it computes taxes, not criminal defense)
- If user indicates a past filing was fraudulent, engine displays: "Fraud violations under NIRC Section 254 cannot be resolved through compromise penalties. You should consult a licensed CPA or tax attorney for guidance on voluntary correction and potential penalty abatement."
- Engine redirects to computing the correct tax liability going forward

**Resolution:** Engine never computes compromise for fraud scenarios. Always flags to manual review.

---

### EC-P07: BIR Oplan Kandado — Closure Order
**Scenario:** A freelancer operating without BIR registration is caught during a TCVD (Tax Compliance Verification Drive). BIR issues a "Closure Order" (Oplan Kandado).

**What a closure order means:**
- BIR can padlock the business premises for 5+ days
- Not applicable to home-based/remote freelancers (no physical business premises to close)
- More relevant for freelancers operating a co-working space, clinic, studio, or retail outlet

**For online-only freelancers:**
- No physical premises to close
- BIR enforcement tools: administrative penalties (compromise), criminal referral, asset distraint/levy, third-party notices to banks

**Engine behavior:**
- Engine displays the registration failure penalty (₱2,000–₱20,000 by municipality class)
- For remote/online freelancers: adds note that Oplan Kandado closure orders apply to physical business premises and may not apply to their situation
- Still recommends immediate BIR registration to avoid escalating penalties

---

---

## Group EC-8: 8% Income Tax Option Edge Cases

*(Added from eight-percent-option aspect, 2026-03-01)*

### EC-8-01: Gross Receipts Exactly Equal to ₱250,000 (Pure Self-Employed, 8% Elected)

**Scenario:** A freelancer on 8% option earns exactly ₱250,000 for the year. No other income.

**Computation:**
- Tax base = MAX(0, ₱250,000 − ₱250,000) = ₱0
- 8% Tax Due = ₱0 × 0.08 = **₱0**
- Percentage Tax = ₱0 (waived)
- Total Tax = **₱0**

**Engine must still require filing:**
- Taxpayer must file quarterly 1701Q (even if zero) and annual 1701A (zero return)
- Failure to file a zero return = ₱1,000 compromise penalty (first offense nil return)
- Engine output must NOT say "no filing required" — it must say "zero tax but filing still required"

**Engine behavior:**
- `eight_pct_tax_due = 0`
- `total_tax_burden = 0`
- `filing_required = true`
- `note = "Zero tax due but quarterly 1701Q and annual 1701A must still be filed by deadlines."`

**Legal basis:** NIRC Sec. 51 — annual return required for all individuals deriving income; RR 8-2018 Part IV filing obligations table.

---

### EC-8-02: Q1 Gross Receipts Below ₱250,000 (Purely Self-Employed, 8%)

**Scenario:** Freelancer on 8% option earns ₱180,000 in Q1 (Jan–Mar). No other income in Q1.

**Q1 Computation:**
- Q1 cumulative gross = ₱180,000
- 8% tax base = MAX(0, ₱180,000 − ₱250,000) = ₱0
- Q1 Tax Due = **₱0**
- Q1 Tax Payable = ₱0 − ₱0 (CWT) = **₱0**

**Q1 1701Q must still be filed** with zero tax payable.

**Q2 Scenario:** Earns additional ₱400,000 in Q2. Cumulative = ₱580,000.
- Q2 8% tax base = MAX(0, ₱580,000 − ₱250,000) = ₱330,000
- Q2 cumulative tax due = ₱330,000 × 0.08 = ₱26,400
- Q2 tax payable = ₱26,400 − CWT − ₱0 (Q1 payment) = ₱26,400 − CWT

**Engine behavior:**
- For quarterly computation, always use MAX(0, cumulative_gross − 250,000) × 0.08
- Never allow quarterly tax due to be negative
- Still require filing of Q1 1701Q with zero amount

**Legal basis:** RR 8-2018 Part IX; CR-010; NIRC Sec. 76.

---

### EC-8-03: Mid-Year Threshold Breach in Q1 (Very High First-Quarter Income)

**Scenario:** Freelancer elected 8% option. Receives a large one-time contract payment in February: ₱3,500,000. Total Q1 gross = ₱3,500,000. This is a Q1 breach.

**Detection:** Cumulative exceeds ₱3M as early as February (month 2).

**Actions:**
1. 8% option auto-disqualified for the ENTIRE year (retroactive from January 1)
2. Form 1905 must be filed in March (month following February)
3. Retroactive PT: 3% on January-only gross (month before VAT registration month of March)
   - If ₱1,000,000 received in January: retroactive PT = ₱1,000,000 × 3% = ₱30,000
4. Annual ITR on Form 1701 (not 1701A)
5. No 8% quarterly payments were made yet (Q1 not yet filed at time of breach detection)

**Nuance:** If taxpayer ALREADY PAID Q1 8% tax (Q1 1701Q filed early in April before realizing breach):
- Those Q1 8% payments become credits on the annual return
- Engine must ask: "Have you already filed and paid Q1 1701Q under the 8% option?"
- If yes: record q1_8pct_payment for CR-024 credit computation

**Engine behavior:**
- Detect breach when monthly_cumulative exceeds 3_000_000
- Immediately display breach warning with all required actions (Steps 1-6 from CR-024)
- Compute OSD-based annual IT as default (itemized requires expense documentation)
- Show total additional liability: annual IT payable + retroactive PT

**Legal basis:** RR 8-2018 Part III; RMO 23-2018 Sec. 3(C).

---

### EC-8-04: Mixed-Income Earner — Taxable Compensation Below ₱250,000

**Scenario:** Employee earns ₱150,000 taxable compensation (after all allowances). Also has ₱800,000 freelance income. Elects 8% on business income.

**Compensation Tax:**
- Taxable comp = ₱150,000 → Graduated tax = ₱0 (within ₱250,000 zero bracket)
- Unused ₱250K bracket = ₱100,000

**Business Tax (8%, mixed income):**
- 8% Business Tax = ₱800,000 × 0.08 = **₱64,000**
- The ₱100,000 "unused" portion of the ₱250K is FORFEITED — cannot reduce business income

**INCORRECT (do not do this):**
- 8% Tax = (₱800,000 − ₱100,000) × 0.08 = ₱56,000 ← WRONG

**Engine behavior:**
- `mixed_income = true`
- `deduction_250k_applied = false` (never for mixed income under 8%)
- `business_tax_base = 800_000` (full gross, no deduction)
- `business_tax = 800_000 * 0.08 = 64_000`
- Note displayed: "The ₱250,000 allowance applies only to purely self-employed taxpayers. As a mixed-income earner, your business income is taxed at 8% of the full gross amount with no deduction."

**Legal basis:** RMC 50-2018; RR 8-2018 Part II; NIRC Sec. 24(A)(2)(c).

---

### EC-8-05: Taxpayer Tries to Elect 8% After Q1 Has Been Filed Under Graduated

**Scenario:** Freelancer filed Q1 1701Q in May 2026 with Item 16 set to "Graduated Rates" (Option A). In July, realizes that 8% would have been cheaper. Asks if they can amend Q1 return to elect 8%.

**Rule:** The 8% election is irrevocable once Q1 is filed under graduated rates. There is no mechanism for retroactive election after Q1 is filed. The election window closed when the Q1 graduated return was filed.

**Engine behavior:**
- Display: "The 8% income tax option must be elected on or before the Q1 quarterly income tax return (Form 1701Q). Since your Q1 return was filed under graduated rates, the 8% option is not available for this tax year."
- Compute and show how much could have been saved with 8% (educational; cannot be acted on for this year)
- Prompt: "You may elect the 8% option starting January 1 of next year by checking Item 16 as '8%' on your Q1 1701Q."
- Do NOT allow engine to submit with 8% election if Q1 is known to have been filed under graduated

**Legal basis:** RR 8-2018 Part I — "default: considered to have availed of graduated rates" if no election; irrevocability clause.

---

### EC-8-06: Other Non-Operating Income Pushes Gross Above ₱3M Threshold

**Scenario:** Freelancer has ₱2,900,000 in professional service fees but also ₱200,000 in interest income from a business bank account (non-operating income). Total = ₱3,100,000 → exceeds ₱3M.

**Threshold computation:**
- Threshold base = ₱2,900,000 (service fees) + ₱200,000 (business interest) = ₱3,100,000
- ₱3,100,000 > ₱3,000,000 → **8% INELIGIBLE**

**Note:** Passive income already subject to final withholding tax (e.g., regular savings account interest at 20% FWT) is EXCLUDED from the threshold. The ₱200,000 business interest here refers to interest from a current/savings account not yet subject to FWT, or where the taxpayer is computing on an accrual basis.

**Engine behavior:**
- `threshold_base = service_fees + non_operating_income_included`
- `eight_pct_eligible = threshold_base <= 3_000_000`
- If `threshold_base > 3_000_000`: display "8% option not available. Your gross receipts including non-operating income exceed ₱3,000,000."
- Clarify to user which income sources are included in threshold

**Legal basis:** RMC 50-2018; NIRC Sec. 24(A)(2)(b) — "gross sales or receipts and other non-operating income."

---

### EC-8-07: GPP Partner Also Has Separate Sole Proprietorship Income

**Scenario:** A CPA is a partner in an accounting partnership (GPP) and also operates a personal coaching business as a sole proprietor.

**Two income streams:**
1. GPP distributive share: cannot use 8% option. Must use graduated rates on GPP net share.
2. Sole proprietorship coaching income: CAN use 8% option if gross ≤ ₱3M.

**Threshold check for 8%:**
- The ₱3M threshold is checked on the SOLE PROPRIETORSHIP income only
- GPP distributive share is NOT included in the 8% threshold computation for the sole prop business
- Combined income for INCOME TAX purposes: GPP share (graduated) + coaching income (8% if elected)

**Engine behavior:**
- Treat GPP distributive share as a separate, non-8%-eligible income stream
- Separately compute: graduated tax on GPP share + 8% on coaching income
- 8% eligibility check uses only coaching gross receipts for threshold
- Annual form: Form 1701 (mixed income: GPP share + sole prop)

**Manual review flag:** MRF should be raised for GPP partner scenarios. The engine can compute the 8% on the sole prop portion, but GPP distributive share computation requires the partnership's K-1 equivalent (BIR Schedule K equivalent for GPPs). See MRF-001.

**Legal basis:** RMC 50-2018; RMO 23-2018; RR 8-2018 Part I ineligibility clause for GPP partners.

---

### EC-8-08: New Registrant Commences Business Mid-Year (Not January 1)

**Scenario:** Freelancer registers with BIR in July 2026 and earns ₱600,000 from July to December.

**Does the ₱250,000 deduction apply for partial year?**
- YES. The ₱250,000 deduction is an annual amount, NOT prorated for partial years.
- Even if the taxpayer only operated for 6 months, the full ₱250,000 is deducted.

**Does the ₱3M threshold apply for partial year?**
- YES, the ₱3M threshold is an annual cap. For a mid-year registrant, their partial-year gross is compared to ₱3M. Since ₱600,000 < ₱3M, 8% is available.

**Quarterly filing for mid-year registrant:**
- Only required to file for quarters after registration date
- If registered in July (Q3): first quarterly ITR is for Q3 (Jul–Sep), due November 15
- No Q1 or Q2 filing required (not yet registered; no income)
- Q3 is also the "first" quarterly return — 8% election is made on this Q3 return (which is the initial return)

**Engine behavior:**
- `registration_month = 7` (July)
- `first_required_quarter = 3` (Q3, July–September)
- 8% election can be made on Q3 1701Q (which is the initial quarterly return for this taxpayer)
- Apply full ₱250,000 deduction against cumulative gross of ₱600,000 (Jul–Dec)
- Annual 1701A tax base: MAX(0, 600,000 − 250,000) × 0.08 = 350,000 × 8% = ₱28,000

**Legal basis:** RR 8-2018 Part I (election on initial quarterly return after commencement); NIRC Sec. 24(A)(2)(b) — ₱250K deduction is annual amount with no proration provision.

---

### EC-8-09: Excess CWT Credits Exceed 8% Annual Tax Due (Refund vs Carry-Over)

**Scenario:** Freelancer on 8% option. Annual gross = ₱1,200,000. Annual 8% tax due = (₱1,200,000 − ₱250,000) × 8% = ₱76,000. Total CWT credits from Form 2307s = ₱90,000. No quarterly payments (CWT covered it all).

**Annual computation:**
- Tax Due = ₱76,000
- Less CWT: ₱90,000
- Balance: ₱76,000 − ₱90,000 = **−₱14,000** (overpayment)

**Options for excess CWT (per NIRC Sec. 76):**
1. **Claim as refund:** File BIR Form 1701A with the overpayment marked as "refund." BIR will issue refund after review. This is often slow (6–24 months in practice).
2. **Carry over to next year:** Mark as "tax credit carry-over for next year." No cash refund, but credited against next year's Q1 tax.
3. **Cannot do both:** The taxpayer must choose ONE option on the annual return; the choice is irrevocable.

**Engine behavior:**
- Compute `overpayment = MAX(0, cwt_total + quarterly_payments - annual_tax_due)`
- If `overpayment > 0`:
  - Display: "You have an overpayment of ₱[amount]. You may either: (1) Claim as a refund (mark on Form 1701A Item 64 = 'To be refunded') or (2) Carry over as credit to next year (mark on Form 1701A Item 65 = 'Tax credit for next year')."
  - Present both options as radio buttons on the results screen
  - Warn: "Once you file your annual return, this choice is final for this tax year."

**Legal basis:** NIRC Sec. 76; BIR Form 1701A Items 64-65.

---

### EC-8-10: Sales Returns Reduce Gross Below ₱250,000 (Net Gross Receipts = Negative)

**Scenario:** Freelancer issued invoices totaling ₱320,000 but had ₱100,000 in client-approved sales returns (cancelled project, refunded). Net gross = ₱220,000.

**Computation:**
- Net gross receipts = ₱320,000 − ₱100,000 = ₱220,000
- 8% Tax Base = MAX(0, ₱220,000 − ₱250,000) = ₱0
- 8% Tax Due = **₱0**

**Important:** The gross for the ₱3M threshold is also NET: ₱220,000 → well below ₱3M, 8% available.

**Engine validation:**
- `assert net_gross_receipts >= 0` — even with returns, net cannot go below zero
- If user inputs returns > gross billings: display validation error "Sales returns (₱X) cannot exceed gross billings (₱Y). Please verify your entries."

**Legal basis:** CR-025; NIRC Sec. 24(A)(2)(b) using "gross sales or receipts" which is net of returns by convention.

---

### EC-8-11: 8% Election Valid — but Taxpayer Is Marginal VAT Filer (Approaching ₱3M)

**Scenario:** Freelancer's projected annual gross = ₱2,800,000. Currently on 8% option. Receives a new contract in October that could push them to ₱3,100,000 by December.

**Engine behavior — proactive warning:**
- When user's current-year-to-date gross exceeds ₱2,000,000 (67% of threshold), display:
  "⚠️ Your gross receipts are approaching the ₱3,000,000 threshold. If your total gross exceeds ₱3M before December 31, your 8% option will be automatically cancelled and you must register for VAT."
- If user's projected annual gross > ₱3,000,000: immediately compute breach scenario via CR-024
- Show comparison: "If you remain below ₱3M, your 8% tax is ₱X. If you exceed ₱3M, your tax increases to ₱Y (graduated + retroactive PT)."

**Threshold proximity flags (engine thresholds):**
| Cumulative Gross | Warning Level | Engine Action |
|-----------------|--------------|---------------|
| > ₱2,000,000 | CAUTION | Show yellow warning banner about VAT threshold |
| > ₱2,500,000 | WARNING | Show orange warning; add threshold tracker widget |
| > ₱2,800,000 | ALERT | Show red warning; show breach scenario computation |
| > ₱3,000,000 | BREACH | Trigger full breach recomputation (CR-024); show all required actions |

**Legal basis:** RR 8-2018 Part III; NIRC Sec. 236(G) — VAT registration obligation when threshold exceeded.

---

*Additional 8% edge cases may be discovered during regime-comparison-logic, quarterly-filing-rules, and annual-reconciliation aspects. EC-E, EC-M, EC-Q, EC-C, EC-F groups to be added in the Wave 2 edge-cases aspect.*

---

## Group EC-OSD: Optional Standard Deduction Edge Cases

*Added: 2026-03-01 (osd-computation aspect)*

### EC-OSD01: OSD Election Missed in Q1 — Default to Itemized

**Scenario:** A freelancer files their Q1 Form 1701Q on April 15 without ticking the OSD checkbox or otherwise signifying OSD intent. They come back in July and want to switch to OSD because they realize they have few expenses.

**What the engine must do:**
- If user indicates Q1 was filed without OSD election: Lock deduction method = itemized for the year
- Display: "Your Q1 return was filed without electing OSD. The OSD election must be made in your first quarterly return and cannot be changed mid-year. You are locked into itemized deductions for [Tax Year]. You may elect OSD again starting January [Next Year]."
- Continue computing Paths A and B; Path B (OSD) becomes unavailable
- Only show Path A (Itemized) and Path C (8%, if eligible) as viable options

**Engine flag:** EC-OSD01
**Legal basis:** NIRC Sec. 34(L); RR No. 16-2008 Sec. 3 and 5

**Engine behavior:**
```
if osd_election_missed_in_q1 == true AND current_quarter > 1:
  available_paths = ["path_a"]  // Only itemized
  if eight_pct_eligible:
    available_paths.append("path_c")  // 8% still available if not previously filed as graduated
  display_warning("EC-OSD01: OSD not elected in Q1. Locked into itemized deductions for this year.")
```

---

### EC-OSD02: Trader with COGS — OSD Applied to Wrong Base

**Scenario:** A sole proprietor sells merchandise (not services). Gross sales = ₱1,500,000. COGS = ₱900,000. Operating expenses = ₱200,000. They try to apply OSD to their gross sales of ₱1,500,000 instead of gross income = ₱600,000.

**What the engine must do:**
- For taxpayers who select "trading/merchandising" as business type: Collect COGS separately
- Compute OSD base = gross_sales − sales_returns − COGS (= gross income)
- OSD amount = 40% × ₱600,000 = ₱240,000
- NTI = ₱360,000
- NOT: 40% × ₱1,500,000 = ₱600,000 (WRONG — this would be overstating the deduction)

**Correct computation:**
```
gross_sales = 1_500_000
cogs = 900_000
gross_income = gross_sales - cogs = 600_000
osd_amount = gross_income * 0.40 = 240_000
nti = gross_income - osd_amount = 360_000  // = 600,000 × 0.60
it = graduated_tax(360_000) = (360_000-250_000) * 0.15 = 16_500
pt = gross_sales * 0.03 = 45_000  // Note: PT on gross sales, not gross income
total_path_b = 16_500 + 45_000 = 61_500
```

**Note on PT base:** Percentage tax (3%) is computed on GROSS RECEIPTS/GROSS SALES (before COGS), not on gross income. This is consistent with Sec. 116 which refers to "gross quarterly sales/receipts."

**Display requirement:** Engine must clearly label: "OSD Deduction: 40% of ₱600,000 (Gross Income after Cost of Sales) = ₱240,000"

**Legal basis:** NIRC Sec. 34(L) — "gross income" for individuals in trade = gross sales minus cost of sales; BIR Form 1701A Schedule 1 (OSD section, line 40 definition)

---

### EC-OSD03: Passive Income Alongside Business — OSD Base Exclusion

**Scenario:** A professional earns ₱1,200,000 from consulting AND ₱50,000 in bank interest (subject to 20% FWT). They want to use OSD.

**What the engine must do:**
- Exclude the ₱50,000 bank interest from OSD base (already subjected to final WHT; not included in gross receipts for income tax purposes)
- OSD base = ₱1,200,000 (consulting only)
- OSD = ₱480,000
- NTI = ₱720,000
- Percentage tax = ₱1,200,000 × 0.03 = ₱36,000 (PT is on professional income only, not on FWT income)

**What the engine must NOT do:**
- Do NOT include ₱50,000 interest in gross receipts
- Do NOT compute income tax on ₱1,250,000 (total including interest)
- The ₱50,000 interest was already taxed at 20% FWT by the bank — no further income tax liability

**Engine input collection:** When user enters income sources, distinguish:
1. Professional/business income → subject to regular income tax computation
2. Passive income with FWT → pre-taxed; excluded from OSD base; shown in output as "Final Tax Income (excluded from computation)"

**Legal basis:** RR No. 16-2008 Sec. 2(B) — OSD base excludes income already subjected to final taxes

---

### EC-OSD04: First-Year Registrant — Mid-Year Registration

**Scenario:** A professional registers with BIR on August 15, 2025. Their first quarterly period covers August-September 2025 (Q3 of calendar year, but Q1 of their first taxable year). Their first 1701Q is filed November 15, 2025.

**What the engine must do:**
- Treat the first 1701Q (November 2025, covering Aug-Sep 2025) as "Q1 for OSD election purposes"
- OSD election in this first return is VALID
- The quarterly computation covers only Aug 15 – Sep 30, 2025 (partial Q3 in calendar year terms, but Q1 in taxpayer's first year)
- Annual ITR (1701A) covers Aug 15 – Dec 31, 2025

**Engine input:** Collect `business_registration_date`. If mid-year:
- First taxable period = registration date to December 31
- Q1 = registration month through next quarter end
- OSD election valid in this first filing

**Worked example:**
- Registered: Aug 15, 2025
- Q1 return covers: Aug 15 – Sep 30, 2025 (filed by Nov 15, 2025)
- Q2 covers: Oct 1 – Dec 31, 2025 (but no 1701Q for Q4; goes straight to annual)
- Actually: 1701Q is only filed for Q1, Q2, Q3. Annual covers all four quarters.
- For mid-year registrant: only Q3 1701Q (covering Aug-Sep) is filed; then annual (Form 1701A)

**Legal basis:** RR 8-2018; NIRC Sec. 76 — quarterly returns for Q1, Q2, Q3 only; no Q4 return

---

### EC-OSD05: Expense Ratio Proves Greater Than 40% After OSD Elected

**Scenario:** A freelancer elected OSD in Q1. By year-end, they discover their actual expenses are ₱600,000 on ₱1,000,000 gross (60% expense ratio). Under itemized, their NTI would be ₱400,000; under OSD, NTI is ₱600,000. They want to switch.

**What the engine must do:**
- Recognize that the election is irrevocable for the year
- Compute tax under OSD (what they're stuck with)
- Show the difference: "If you had used itemized deductions (expense ratio 60%), your tax would have been ₱X less. Consider using itemized deductions next year."
- Do NOT compute or recommend switching for the current year

**Computed difference for example:**
- OSD: NTI = 600,000; IT = graduated(600,000) = 62,500; PT = 30,000; Total = ₱92,500
- Itemized: NTI = 400,000; IT = graduated(400,000) = 0 (= 240,000; wait: 400,000 - 600,000 expenses... net = 400,000); IT = graduated(400,000) = 22,500 - 400,000... Let me recalculate:
  - Gross = 1,000,000; Expenses = 600,000; NTI = 400,000; IT = graduated(400,000) = 22,500; PT = 30,000; Total = ₱52,500

Wait, gross - expenses = 1,000,000 - 600,000 = 400,000 NTI.
IT = graduated(400,000):
- 400,000 is in bracket 3 (400,001–800,000)... actually 400,000 is the BOUNDARY. At exactly 400,000 it's still bracket 2:
- 250,001-400,000 at 15%: (400,000-250,000)×0.15 = 22,500; Base tax bracket 3 starts at 400,001.
- So IT = ₱22,500

- Itemized: IT = 22,500; PT = 30,000; Total = ₱52,500
- OSD excess cost: ₱92,500 − ₱52,500 = ₱40,000 EXTRA tax paid due to OSD election
- Engine message: "Your actual expense ratio is 60%, which exceeds the 40% OSD. You are paying ₱40,000 more in income tax than if you had used itemized deductions. Your OSD election is irrevocable for [Year]. For [Next Year], consider tracking your expenses to use itemized deductions."

**Engine behavior:**
```
if deduction_method == "osd" AND actual_expense_ratio > 0.40:
  itemized_nti = gross_receipts - actual_itemized_expenses
  itemized_it = graduated_tax(max(0, itemized_nti))
  tax_difference = osd_total_tax - (itemized_it + percentage_tax)
  if tax_difference > 0:
    display_advisory("EC-OSD05: You could save ₱{tax_difference} with itemized deductions next year. OSD election is irrevocable for {year}.")
```

---

### EC-OSD06: GPP Partner vs. GPP Entity — OSD Question

**Scenario:** A lawyer is a partner in a General Professional Partnership (GPP). The GPP itself computes net income under itemized deductions. The lawyer receives a ₱500,000 distributive share. Can the individual lawyer claim OSD on their distributive share?

**Answer:** YES — but the OSD election is made by the INDIVIDUAL on their distributive share received from the GPP, NOT by the GPP entity.
- GPP entity: Files its own return (Form 1702); may use itemized or OSD at the GPP level
- Individual partner: Receives distributive share (already net of GPP-level deductions)
- Individual partner's return: Reports distributive share as business income; MAY elect OSD
  - BUT: If GPP already deducted expenses, the individual partner's OSD would effectively double-deduct

**BIR position (per RMC 76-2020):**
- Individual partner's OSD is applied to their DISTRIBUTIVE SHARE from GPP (the amount received)
- The GPP's own deductions (at GPP level) are separate — the partner doesn't "add back" GPP expenses
- This means: IF the GPP used itemized deductions and distributed ₱500K to a partner, the partner can STILL elect OSD on their ₱500K distributive share
- This is NOT double-deduction because the two deductions are at different entity levels

**Engine handling:**
- If user selects "GPP partner" as taxpayer type: Collect `gpp_distributive_share` as income
- Apply OSD at 40% of distributive share (if OSD elected by individual partner)
- NTI = distributive_share × 0.60

**Note:** This situation is flagged as requiring user confirmation: "You indicated you are a GPP partner. Your ₱{X} distributive share is treated as self-employment income. You have elected OSD: your NTI = ₱{X × 0.60}."

---

### EC-OSD07: Multiple Business Activities — OSD Across Activities

**Scenario:** A person is both a practicing CPA (professional income: ₱800,000) AND operates a small retail store (gross sales: ₱400,000; COGS: ₱250,000). They elect OSD.

**What the engine must do:**
- Both income sources are from the same individual → consolidated return
- OSD applies to the COMBINED gross income (aggregated):
  - Professional gross receipts: ₱800,000
  - Retail gross income: ₱400,000 − ₱250,000 = ₱150,000
  - Combined gross income: ₱950,000
  - OSD: ₱380,000 (40% of combined)
  - NTI: ₱570,000
- Percentage tax: 3% of total gross receipts/sales (800,000 + 400,000 = ₱1,200,000) = ₱36,000

**Alternative interpretation (WRONG — engine must NOT do this):**
- Do NOT compute OSD separately for each business type and then add
- Do NOT apply OSD to gross sales (₱400,000) for the retail portion (must use gross income = ₱150,000)

**Legal basis:** Individual files one consolidated ITR covering all business/professional income. The OSD is applied to total gross income across all activities.

**Engine design:** Collect income by type (professional fees, trading income with COGS, service income). Consolidate all into one OSD computation:
```
total_gross_income = (
  sum(professional_gross_receipts) +
  sum(trading_gross_income)  // already net of COGS per activity
)
osd_amount = total_gross_income * 0.40
nti = total_gross_income * 0.60
```

---

### EC-OSD08: OSD and NOLCO — Cannot Combine

**Scenario:** A freelancer has ₱200,000 NOLCO carried over from 2023 (loss year). In 2025, they earn ₱1,000,000 and elect OSD. They expect to deduct both the 40% OSD AND the ₱200,000 NOLCO.

**What the engine must do:**
- OSD and NOLCO are MUTUALLY EXCLUSIVE for that taxable year
- If OSD is elected: NOLCO deduction is NOT available
- Display: "NOLCO Notice: You have ₱200,000 of Net Operating Loss Carry-Over from [Year]. If you elect OSD this year, you cannot deduct this NOLCO. Under itemized deductions with your NOLCO, your taxable income would be ₱[GR − expenses − NOLCO]; under OSD, your taxable income is ₱[GR × 0.60]. Consider itemized deductions to use your NOLCO."

**Comparison engine should show:**
```
// Under OSD:
osd_nti = 1_000_000 * 0.60 = 600_000
osd_it = graduated_tax(600_000) = 62_500

// Under Itemized (assuming expenses = ₱150,000):
itemized_nti_before_nolco = 1_000_000 - 150_000 = 850_000
itemized_nti_after_nolco = max(0, 850_000 - 200_000) = 650_000
itemized_it = graduated_tax(650_000) = 22_500 + (650_000-400_000)*0.20 = 72_500

// Compare:
osd_total = 62_500 + 30_000 (PT) = 92_500
itemized_total = 72_500 + 30_000 (PT) = 102_500
// In this case: OSD wins despite NOLCO under itemized (because NOLCO effect = 40K savings, 8K less tax, but OSD advantage > NOLCO advantage)
```

**NOLCO carry-over period:** 3 consecutive years from year of loss. Engine must track:
- Year NOLCO was incurred
- Whether taxpayer was on itemized in the loss year (NOLCO only generated under itemized)
- Remaining carry-over years

**Legal basis:** NIRC Sec. 34(D)(3) — NOLCO not available to OSD or 8% users

---

### EC-OSD09: OSD for VAT-Registered Taxpayer (GR > ₱3M)

**Scenario:** A VAT-registered professional with gross receipts of ₱4,000,000 wants to use OSD. The 8% option is not available (gross > ₱3M and VAT-registered). Can they use OSD?

**Answer:** YES — OSD is available regardless of VAT status or income level.

**What changes for VAT-registered taxpayers:**
- No percentage tax (not applicable; VAT applies instead)
- 8% option: NOT available
- OSD: Available — applies 40% of gross receipts (exclusive of VAT)

**Engine computation for VAT-registered + OSD:**
```
gross_receipts_excl_vat = gross_receipts  // VAT is separate; gross receipts for IT = ex-VAT amount
osd_base = gross_receipts_excl_vat - passive_income_with_fwt
osd_amount = osd_base * 0.40
nti = osd_base - osd_amount
income_tax = graduated_tax(nti)
// NO percentage tax (VAT-registered)
total_tax_burden = income_tax
// VAT is computed separately and is not part of the income tax optimizer scope
```

**Output note:** Engine must display: "VAT Registration Notice: You are VAT-registered. Your 12% VAT liability is separate from your income tax and is not computed here. This tool computes your income tax only. Your VAT returns are filed via BIR Form 2550Q."

**Worked example:**
- Gross receipts (excl. VAT): ₱4,000,000
- OSD: ₱1,600,000
- NTI: ₱2,400,000
- IT: 402,500 + (2,400,000−2,000,000)×0.30 = 402,500 + 120,000 = ₱522,500
- No PT
- Total: ₱522,500

Compare with itemized (hypothetical 30% expense ratio):
- Expenses = ₱1,200,000 (30% of GR)
- NTI = ₱2,800,000
- IT = 402,500 + (2,800,000−2,000,000)×0.30 = 402,500+240,000 = ₱642,500
- OSD wins (expense ratio < 40%)

Compare with itemized (hypothetical 55% expense ratio):
- Expenses = ₱2,200,000 (55% of GR)
- NTI = ₱1,800,000
- IT = 102,500 + (1,800,000−800,000)×0.25 = 102,500+250,000 = ₱352,500
- Itemized wins (expense ratio > 40%)

**Legal basis:** NIRC Sec. 34(L) — no income ceiling or VAT exclusion for individual OSD

---

## Group EC-ID: Itemized Deductions Edge Cases

### EC-ID01: Home Office — Shared Workspace (Dual Use)
**Scenario:** A freelancer uses a spare bedroom as a home office 8 hours per day for work, and it doubles as a guest room on weekends.

**What the engine must do:**
A home office deduction is allowed ONLY for space used **exclusively and regularly** for business. A room that is also used as a guest room does NOT qualify.

**Engine behavior:**
- If user answers "Yes, I use my home office exclusively for business" → include home office expense
- If user answers "No, the room is also used personally" → set home_office_expense = 0 and display:
  > "Home office deductions require exclusive business use. Rooms that double as personal space (guest rooms, bedrooms) are not deductible. If you have a clearly dedicated workspace (separate room, partition, or designated area used only for work), you may still qualify."

**Resolution:** Engine enforces the "exclusive use" requirement through a checkbox acknowledgment. If user confirms exclusive use, expense is included; if not, it is excluded.

**Legal basis:** NIRC Sec. 34(A)(1); general principle of ordinary and necessary business expenses

---

### EC-ID02: Dual-Use Equipment — Computer Used for Both Work and Personal Use
**Scenario:** A freelancer uses one MacBook Pro for both client work and personal Netflix, gaming, and social media. They want to deduct the full cost.

**What the engine must do:**
Only the business-use percentage is deductible. The engine must prompt for the business use percentage.

**Engine behavior:**
- Engine prompts: "What percentage of this device's usage is for business? (e.g., 70% = 70% of annual depreciation is deductible)"
- User enters: 75%
- Engine computes: `deductible_depreciation = annual_sl_depreciation × 0.75`
- No validation of user's stated percentage (engine accepts user's estimate)
- Engine displays MRF-003 variant: "Business use percentage for dual-use equipment is based on your own records. BIR may request logbook evidence during audit."

**Legal basis:** NIRC Sec. 34(F); general principle of prorating expenses between personal and business use

---

### EC-ID03: EAR Cap — Service Provider with Client Entertainment
**Scenario:** A lawyer spends ₱50,000 on client dinners and a golf club membership for business entertainment, but has only ₱2,000,000 in gross receipts.

**EAR Cap computation:**
```
ear_cap = ₱2,000,000 × 0.01 = ₱20,000
actual_ear = ₱50,000
deductible_ear = min(₱50,000, ₱20,000) = ₱20,000
```

**Engine behavior:**
- Engine caps the EAR deduction at ₱20,000
- Displays warning: "Your entertainment, amusement, and recreation (EAR) expenses (₱50,000) exceed the deductible limit of 1% of gross receipts (₱20,000). Only ₱20,000 is allowed as a deduction per NIRC Sec. 34(A)(1) and RR 10-2002."
- The remaining ₱30,000 of EAR is permanently disallowed (cannot be carried forward)

**Legal basis:** NIRC Sec. 34(A)(1); RR No. 10-2002

---

### EC-ID04: Depreciation — Asset Purchased Mid-Year
**Scenario:** A freelancer buys a ₱80,000 camera in June 2025 (6 months into the taxable year). Do they get a full year's depreciation for 2025?

**Engine behavior:**
```
// For assets purchased mid-year, prorate depreciation to months of use
full_year_depreciation = (80,000 - 0) / 5 = ₱16,000
months_of_use_in_year = 12 - 6 + 1 = 7  // June through December = 7 months
prorated_depreciation = 16,000 × (7/12) = ₱9,333.33

// Deductible for 2025: ₱9,333.33
// Deductible for 2026-2030: ₱16,000/year
// Final year (2030): remaining basis
```

**Engine input required:** `month_of_purchase` for each asset in the depreciation schedule.

**Note:** BIR practice allows full-month convention (month of purchase counts as a full month). Engine uses whole-month convention.

**Legal basis:** NIRC Sec. 34(F); RR 2-98 — no specific proration rule stated, but consistent treatment required

---

### EC-ID05: NOLCO — Taxpayer Switches Between Itemized and OSD Across Years
**Scenario:** Taxpayer used itemized deductions in 2023 (had a net operating loss of ₱200,000). In 2024, they elected OSD. In 2025, they return to itemized deductions. Can they use the 2023 NOLCO?

**Rule:** NOLCO is SUSPENDED (not forfeited) during years when OSD or 8% is used. The 3-year carry-over window continues to count, but the suspended year's NOLCO cannot be applied.

```
2023: Itemized → NOL = ₱200,000 (origin year 2023, expires after 2026)
2024: OSD → NOLCO suspended (cannot use 2023 NOLCO in 2024)
2025: Itemized → NOLCO resumed
  available_nolco = ₱200,000 (origin 2023, expires 2026, not yet expired)
  apply to 2025 NTI → NOLCO of ₱200,000 deductible if NTI > 0

2026: Last year to use the 2023 NOLCO (expires after 2026)
```

**Engine behavior:**
- Track each NOLCO entry with: origin_year, remaining amount, expiry year (origin + 3), is_suspended flag
- is_suspended flag does NOT extend the carry-over period; it only prevents use for that year
- If 2024 OSD year causes NOLCO to lapse due to expiry, engine must warn user

**Warning message:**
> "Your 2023 Net Operating Loss (NOLCO) of ₱200,000 was suspended in 2024 when you used OSD. It expires after TY2026. If you plan to return to itemized deductions, use this NOLCO in 2025 or 2026."

**Legal basis:** NIRC Sec. 34(D)(3); BIR Revenue Memorandum Circulars on NOLCO application

---

### EC-ID06: Interest Expense — Arbitrage Reduction Edge Case
**Scenario:** A freelancer has ₱30,000 in bank interest income (subject to 20% FWT) and ₱20,000 in interest paid on a business loan. Is the full ₱20,000 deductible?

**Engine computation:**
```
interest_income_subject_to_fwt = ₱30,000
arbitrage_adjustment = ₱30,000 × 0.33 = ₱9,900
gross_interest_expense = ₱20,000
deductible_interest = MAX(0, ₱20,000 - ₱9,900) = ₱10,100
```

**Engine behavior:**
- Engine computes and applies the reduction automatically
- Displays informational note: "Your interest deduction has been reduced by ₱9,900 (33% of your ₱30,000 interest income already subject to 20% final withholding tax) to prevent tax arbitrage. NIRC Sec. 34(B)(1)."

**Edge case variant:** What if the arbitrage adjustment exceeds the gross interest expense?
```
interest_income_fwt = ₱90,000
arbitrage_adjustment = ₱90,000 × 0.33 = ₱29,700
gross_interest_expense = ₱15,000
deductible_interest = MAX(0, ₱15,000 - ₱29,700) = MAX(0, -₱14,700) = ₱0
// No interest deduction at all; do NOT allow negative interest deduction
```

**Legal basis:** NIRC Sec. 34(B)(1) as amended by TRAIN

---

### EC-ID07: Bad Debt — Receivable That Was Never Included in Income
**Scenario:** A freelancer on the accrual basis billed ₱50,000 for services but the client never paid. The freelancer writes off the receivable as a bad debt. Is it deductible?

**Rule:** Bad debts are only deductible if the receivable was **previously included in gross income**. For a cash-basis taxpayer, income is only recognized when received — so an uncollected receivable was never in gross income and cannot become a bad debt deduction.

**Engine behavior:**
- Engine must ask: "Are you on cash basis or accrual basis for income recognition?"
  - Cash basis: Bad debt deduction = ₱0 (uncollected never entered gross income; flag and explain)
  - Accrual basis: Bad debt deduction available if: (a) included in prior-year gross income, (b) actually ascertained as worthless, (c) written off in books
- Display: If cash basis and bad debts claimed, engine rejects: "On cash-basis accounting, only amounts actually received are included in gross income. Unpaid receivables are not deductible as bad debts because they were never recognized as income."

**Note:** Most freelancers are de facto cash-basis (they recognize income when received). Engine should default to cash basis and flag bad debt attempts.

**Legal basis:** NIRC Sec. 34(E)

---

### EC-ID08: Charitable Contribution — NPO Cap Computation
**Scenario:** A doctor has net taxable income before charitable deduction of ₱800,000 and wants to deduct ₱100,000 donated to a BIR-accredited nonprofit hospital.

**Engine computation:**
```
// NPO charitable deduction cap: 10% of NTI before this deduction
nti_before_charitable = ₱800,000
charitable_npo_cap = ₱800,000 × 0.10 = ₱80,000
charitable_npo_claimed = ₱100,000

// Deductible amount:
charitable_npo_allowed = min(₱100,000, ₱80,000) = ₱80,000

// Warning: ₱20,000 excess is permanently disallowed
```

**Engine display:** "Your donation of ₱100,000 to [nonprofit name] exceeds the 10% of net taxable income limit (₱80,000). Only ₱80,000 is deductible. The remaining ₱20,000 cannot be carried forward."

**Note on government donations (fully deductible):** If the donation is to a government agency for a priority program (DENR, DSWD, DepEd, DOH, etc.), there is NO ceiling. Engine must distinguish between government vs. NPO recipients.

**Legal basis:** NIRC Sec. 34(H)

---

### EC-ID09: NOLCO Expiry — Partial Use
**Scenario:** Taxpayer has NOLCO entries from multiple years:
- 2022: ₱300,000 (expires after 2025)
- 2023: ₱150,000 (expires after 2026)
Current year is 2025. Net income before NOLCO = ₱200,000.

**Engine applies FIFO (oldest first):**
```
available_nolco = [
  {origin: 2022, remaining: 300,000, expires: 2025},
  {origin: 2023, remaining: 150,000, expires: 2026}
]
net_income_before_nolco = ₱200,000

// Apply 2022 NOLCO first (expires 2025 — THIS IS THE LAST YEAR):
use_2022 = min(300,000, 200,000) = ₱200,000
remaining_after_2022 = 300,000 - 200,000 = ₱100,000 (EXPIRES UNUSED)
net_income_after_2022 = 200,000 - 200,000 = ₱0

// 2023 NOLCO: net income is now ₱0; no further NOLCO needed
// NTI = ₱0; Income Tax = ₱0

// CRITICAL: ₱100,000 of 2022 NOLCO expires unutilized at end of 2025!
```

**Engine warning:** "₱100,000 of your 2022 NOLCO will expire unused at the end of TY2025 because your taxable income was fully offset by ₱200,000. The remaining ₱100,000 CANNOT be carried to 2026."

**Legal basis:** NIRC Sec. 34(D)(3) — 3-year carry-over, FIFO application

---

### EC-ID10: Depreciation — Luxury Vehicle Cost Ceiling
**Scenario:** A real estate broker uses a Toyota Land Cruiser (purchase price ₱4,500,000) for business client visits. They want to deduct depreciation.

**Engine computation:**
```
// Vehicle cost ceiling for sedans/passenger cars (per BIR guidance): ₱2,400,000
// Land Cruiser classified as SUV/utility vehicle; same ceiling applied per BIR practice
depreciable_cost = min(₱4,500,000, ₱2,400,000) = ₱2,400,000
salvage_value = ₱0
useful_life = 5 years
annual_depreciation = ₱2,400,000 / 5 = ₱480,000

// If vehicle is 80% business use:
deductible_depreciation = ₱480,000 × 0.80 = ₱384,000/year
```

**Engine display:** "The cost ceiling for vehicles is ₱2,400,000 per BIR Revenue Regulations. Your vehicle's cost of ₱4,500,000 has been capped at ₱2,400,000 for depreciation purposes. Annual depreciation: ₱480,000 × [business_use]% = ₱[deductible]."

**Legal basis:** BIR Revenue Regulations (vehicle depreciation cap); NIRC Sec. 34(F)

---

## Group EC-RC: Regime Comparison Edge Cases

### EC-RC01: All Paths Produce ₱0 Tax (Gross < ₱250K, No Significant Expenses)
**Scenario:** A part-time freelancer earns ₱200,000 gross and has elected 8% option.

**Path C computation:**
- Tax base = max(200,000 − 250,000, 0) = 0
- IT = 0 × 0.08 = ₱0
- PT = waived under 8%
- Total = ₱0

**Path B computation:**
- NTI = 200,000 × 0.60 = 120,000 (in zero bracket)
- IT = ₱0
- PT = 200,000 × 0.03 = ₱6,000
- Total = ₱6,000

**Path A computation:**
- NTI = 200,000 − expenses (say ₱0) = 200,000 (still in zero bracket)
- IT = ₱0
- PT = ₱6,000
- Total = ₱6,000

**Engine behavior:** Recommend Path C (₱0 total). Savings vs Path B/A = ₱6,000.
**Message to user:** "Under the 8% option, your income tax is ₱0 because your gross receipts (₱200,000) do not exceed the ₱250,000 deductible amount. However, you must still file your quarterly 1701Q returns with zero tax due."
**Key point:** Zero-tax scenario still requires filing (EC-8-01 from 8% option edge cases).

---

### EC-RC02: Path C and Path B Exact Tie at ₱400,000 Gross Receipts
**Scenario:** Non-VAT freelancer, gross = exactly ₱400,000, purely self-employed.

**Path B:** NTI = 240,000 (zero bracket); IT = 0; PT = 12,000; Total = **₱12,000**
**Path C:** Tax base = 400,000 − 250,000 = 150,000; IT = 12,000; PT = 0; Total = **₱12,000**

**Engine behavior:** Both paths tied at ₱12,000. Tie-breaking rule applies:
- Prefer Path C (8%) — simpler to file, no PT filing obligation (no Form 2551Q required).
- Display to user: "Both the 8% option and the OSD method result in the same total tax of ₱12,000. We recommend the 8% option because it eliminates the quarterly percentage tax filing (Form 2551Q)."

**What NOT to do:** Do NOT return an error or undefined behavior. Tie is a valid output.

---

### EC-RC03: Path B (OSD) Wins Over Path C (8%) in Narrow ₱400K–₱437.5K Window
**Scenario:** Non-VAT freelancer, gross = ₱420,000, purely self-employed, no itemized docs.

**Path B:** NTI = 252,000; IT = (252,000−250,000)×0.15 = 300; PT = 12,600; Total = **₱12,900**
**Path C:** Tax base = 170,000; IT = 13,600; PT = 0; Total = **₱13,600**

**Engine behavior:** Recommend Path B (OSD). Savings vs Path C = ₱700.
**Key warning:** Engine MUST NOT apply the invariant "Path C always beats Path B" here — that invariant only holds outside this window. See INV-RC-02 exception clause in CR-028.
**Message to user:** "In your income range (₱400,001–₱437,499), the OSD method (₱12,900) is slightly cheaper than the 8% option (₱13,600) by ₱700. This is a narrow window where OSD is preferred. Note: You will still need to file quarterly percentage tax returns (Form 2551Q)."

---

### EC-RC04: Taxpayer Has CWT Credits That Exceed Annual Tax Under All Paths
**Scenario:** Consultant, gross = ₱1,000,000, all income from corporate clients who withheld 10% EWT (₱100,000 total CWT). On 8%: annual IT = ₱60,000.

**Computation:**
- Path C annual IT = (1,000,000 − 250,000) × 0.08 = ₱60,000
- CWT = ₱100,000
- balance_payable = max(60,000 − 100,000, 0) = ₱0
- overpayment = 100,000 − 60,000 = ₱40,000

**Engine behavior:**
1. Still recommend the path with lowest GROSS tax (Path C at ₱60,000).
2. Report balance_payable = ₱0 and overpayment = ₱40,000.
3. Show message: "Your creditable withholding tax (₱100,000) exceeds your income tax due (₱60,000) under the recommended 8% option by ₱40,000. You may: (a) apply this as a tax credit to next year's return, or (b) file for a cash refund with the BIR."
4. Do NOT change the regime recommendation based on CWT amount — comparison is always on gross tax burden before CWT.

---

### EC-RC05: Itemized Deductions Exactly Equal to OSD (40% Expense Ratio)
**Scenario:** GR = ₱1,500,000, itemized_deductions = ₱600,000 (exactly 40%).

**Path A NTI = Path B NTI = 900,000. IT_A = IT_B = 102,500 + (900K−800K)×0.25 = 127,500**
**PT for A and B = 45,000. Total A = Total B = 172,500**

**Path C (if eligible):** Tax = (1,500,000−250,000) × 0.08 = 100,000. Total = ₱100,000.

**Engine behavior:** Path C is recommended (100,000 < 172,500). If Path C were not available:
- Path A = Path B at ₱172,500. Prefer Path B (OSD) per tie-breaking rule.
- Message: "Your expense ratio is exactly 40%, so the OSD method produces the same income tax as itemized deductions. We recommend OSD for simplicity (no expense documentation required to substantiate your deductions with the BIR)."

---

### EC-RC06: Mixed Income Earner Where 8% Business Tax + Compensation Tax < OSD Total
**Scenario:** Employee earns ₱480,000 taxable compensation; also freelances ₱800,000.
- Taxable comp = ₱480,000 → employer withholds: (480K−250K)×0.15 = ₱34,500
- 8% on business: ₱800,000 × 0.08 = ₱64,000 (no ₱250K deduction for mixed income)
- 8% total ADDITIONAL tax due = ₱64,000 + ₱0 PT = ₱64,000

**vs. OSD on business (graduated combined):**
- Business NTI (OSD) = 800,000 × 0.60 = ₱480,000
- Combined NTI = 480,000 + 480,000 = ₱960,000
- Total IT = 102,500 + (960,000−800,000)×0.25 = 102,500 + 40,000 = ₱142,500
- Less: employer-withheld compensation IT (₱34,500) = Balance tax = ₱108,000
- PT on business = ₱24,000
- OSD total incremental tax = ₱108,000 + ₱24,000 = ₱132,000

Wait — for regime comparison, engine must compute TOTAL annual IT on all income, not just incremental:
- Path C (8%): Annual IT = comp_IT + biz_8pct = 34,500 + 64,000 = ₱98,500; PT = ₱0; Total = ₱98,500
- Path B (OSD): Annual IT = grad_tax(960K) = 142,500; PT = 24,000; Total = ₱166,500

**Recommendation: Path C (8%) on business income.** Savings = ₱68,000.
**Engine behavior:** For mixed income, the "compensation IT" is fixed regardless of business regime choice. The comparison is: (combined_IT + PT) across regimes. Engine must compute combined IT under each path (see CR-028 Section 28.5–28.7 for mixed income handling).

---

### EC-RC07: Recommendation Changes Based on Documentation Availability
**Scenario:** Same taxpayer, GR = ₱2,000,000, itemized = ₱1,400,000 (70% ratio).

**With documentation available:**
- Path A: NTI = 600,000; IT = 22,500+(600K−400K)×0.20 = 62,500; PT = 60,000; Total = ₱122,500
- Path B: NTI = 1,200,000; IT = 102,500+(1,200K−800K)×0.25 = 202,500; PT = 60,000; Total = ₱262,500
- Path C: IT = (2M−250K)×0.08 = 140,000; PT = 0; Total = ₱140,000
- Recommendation: **Path A (₱122,500)** — docs required.

**Without documentation:**
- Path A is null (no docs).
- Path B: ₱262,500; Path C: ₱140,000.
- Recommendation: **Path C (₱140,000)**.

**Engine behavior:** When has_itemized_documentation = false, Path A must be null. The recommendation silently omits Path A and returns Path C.
**UI message when docs unavailable:** "Based on your inputs, the 8% option (₱140,000 total tax) is recommended. Note: if you have documented business expenses totaling more than 65.6% of your gross receipts (more than ₱1,312,000), itemized deductions could reduce your tax below ₱140,000. Enable expense tracking to see if itemized deductions would save you more."

---

### EC-RC08: Savings Comparison When Only Path B is Available (Both 8% and Docs Unavailable)
**Scenario:** GPP partner, GR = ₱2,000,000, no 8% option, no expense docs.

**DT-01 returns:** INELIGIBLE (GPP partner).
**Paths available:** Path B only (8% ineligible; no docs for Path A).

**Engine behavior:**
- path_a = null (no docs)
- path_c = null (ineligible: GPP partner)
- path_b = {total: 262,500}
- recommended_regime = PATH_B (only option)
- savings_vs_path_b = 0
- savings_vs_path_a = null (not computed)
- savings_vs_path_c = null (not computed)
- eight_pct_ineligible_reason = "GPP partners cannot use the 8% option..."

**Engine must NOT return an error when only one path is available.** It returns the single available path as the recommendation with savings = ₱0.

---

### EC-RC09: Gross Receipts = Exactly ₱3,000,000 (Threshold Boundary)
**Scenario:** Non-VAT consultant, gross = exactly ₱3,000,000.

**8% Eligibility check:** gross_for_threshold = 3,000,000. Check: `3,000,000 <= 3,000,000` → TRUE. 8% IS available.
**Path C:** Tax base = 3,000,000 − 250,000 = 2,750,000; IT = 220,000; PT = 0; Total = ₱220,000
**Path B:** NTI = 1,800,000; IT = 402,500 + (1,800K−2,000K)... Wait: NTI = 1,800,000 is in bracket 4.
  IT = 102,500 + (1,800,000−800,000)×0.25 = 102,500 + 250,000 = 352,500; PT = 90,000; Total = ₱442,500

**Recommendation: Path C (₱220,000)**. Savings vs OSD = ₱222,500.
**Key invariant:** At ₱3,000,000 exactly, the 8% option IS available (the threshold is inclusive, `≤ 3,000,000`). See CR-015 boundary rules. Engine must use `<=` not `<` for the threshold check.
**Near-threshold warning:** near_threshold_warning = true (at exactly ₱3M, within ₱200K of threshold). Warn user: "Your income is at the ₱3,000,000 threshold. If your actual annual receipts exceed ₱3,000,000, the 8% option becomes unavailable and you must register for VAT."

---

### EC-RC10: Savings Display When Recommended Path Has ₱0 Savings vs Itself
**Scenario:** Path C recommended. Engine must show savings vs Path A and Path B, and ₱0 savings vs Path C.

**Engine behavior:**
- savings_vs_path_c = 0 (saving nothing vs yourself)
- savings_vs_path_b = positive number (what you save over OSD)
- savings_vs_path_a = positive number (what you save over itemized) if Path A available

**Display rule:** Do NOT show "You save ₱0 by choosing the 8% option vs the 8% option." Only show savings vs non-recommended paths.
- Show: "The 8% option saves you ₱XX,XXX vs the OSD method and ₱YY,YYY vs itemized deductions."
- savings_vs_recommended (₱0) is for internal validation only (INV-RC-08); never shown in UI.

---

## Group EC-M: Mixed Income Earner Edge Cases

**Legal basis:** NIRC Sec. 24(A)(1)(b), Sec. 24(A)(2)(b); RMC 50-2018; RR 8-2018; CR-029; CR-030.

---

### EC-M01: Multiple Employers in Same Tax Year

**Scenario:** Renzo resigned from Employer A in May (taxable comp ₱240,000, TW ₱0) and joined Employer B in July (taxable comp ₱360,000, TW ₱16,500). He also freelances (gross receipts ₱500,000, 8% option elected). Multiple Form 2316s exist.

**Problem:** Employer A withheld ₱0 because ₱240,000 is within the zero bracket when considered alone. Employer B withheld ₱16,500 on ₱360,000 (15% × (360,000 − 250,000) = ₱16,500) because B also only knows about B's portion. But combined taxable compensation is ₱600,000 — now in the 20% bracket above ₱400,000.

**Engine computation:**
1. Aggregate taxable_compensation = 240,000 + 360,000 = ₱600,000
2. Aggregate TW = 0 + 16,500 = ₱16,500
3. compensation_it = graduated_tax(600,000) = 22,500 + 20% × (600,000 − 400,000) = ₱62,500
4. tw_deficiency = 62,500 − 16,500 = ₱46,000 deficiency on compensation alone
5. Business Path C: business_it = 500,000 × 0.08 = ₱40,000 (no ₱250K — mixed income)
6. Total IT Path C = 62,500 + 40,000 = ₱102,500
7. Balance at annual = 102,500 − 16,500 (TW) = ₱86,000 payable (including the comp deficiency)

**Engine behavior:**
- Show "Multiple employers detected" warning
- Show compensation deficiency of ₱46,000 prominently
- Advise: "Consider requesting additional withholding from your current employer for the rest of the year to avoid a large balance at filing."
- Allow user to enter aggregated values or itemize per employer

**Form to file:** BIR Form 1701 (Annex A for multiple Form 2316s is required — attach all Form 2316s).

---

### EC-M02: Compensation Income Exceeds ₱3M (High-Salary Executive + Freelance)

**Scenario:** Atty. Bea earns ₱5,000,000 taxable compensation from her law firm employer (PEZA company, exempt from income tax — so comp is non-taxable? No — PEZA exemption applies to the COMPANY, not employee compensation). She also does outside arbitration work earning ₱800,000 gross professional fees.

Wait — clarification: PEZA employees' compensation IS still subject to Philippine income tax; the PEZA exemption applies to the entity's income, not employee wages. So:
- taxable_compensation = ₱5,000,000 (employer withholds at graduated rates)
- business_gross_receipts = ₱800,000

**8% eligibility for business portion:**
- gross_for_threshold = ₱800,000 (compensation excluded from threshold)
- ₱800K ≤ ₱3M → 8% ELIGIBLE for business portion
- Note: The ₱3M threshold check uses ONLY business gross, NOT compensation. A taxpayer earning ₱50M in compensation can still elect 8% on ₱500K of side income.

**Path C (8% on business):**
- compensation_it = graduated_tax(5,000,000) = 402,500 + 0.30 × (5,000,000 − 2,000,000) = ₱1,302,500
- business_it = 800,000 × 0.08 = ₱64,000
- total_it = ₱1,366,500; pt = 0
- total_burden = ₱1,366,500

**Path B (OSD + Graduated, combined):**
- business_nti_osd = 800,000 × 0.60 = 480,000
- combined_nti = 5,000,000 + 480,000 = 5,480,000
- total_it = 402,500 + 0.30 × (5,480,000 − 2,000,000) = 402,500 + 1,044,000 = ₱1,446,500
- pt = 800,000 × 0.03 = ₱24,000
- total_burden = ₱1,470,500

**WINNER: Path C (8%) saves ₱104,000 vs Path B.**

**Engine behavior:** No special handling required beyond standard. The computation is straightforward. However, display a note: "Your compensation income pushes your combined income into the top 30% bracket. The 8% option on your business income is especially valuable because it avoids the 30% marginal rate that would apply to business income under graduated methods."

---

### EC-M03: Business Net Loss — Cannot Offset Compensation Income

**Scenario:** Dana is an employee (taxable comp ₱600,000, TW ₱62,500) who started a catering business that lost money. Business gross receipts ₱200,000, business expenses ₱350,000 (net loss of ₱150,000).

**Path A (Itemized) — business has a NET LOSS:**
- business_nti_itemized = max(200,000 − 350,000, 0) = ₱0 (floored at 0)
- NOLCO: ₱150,000 net operating loss can be carried forward for 3 years under Path A
- combined_nti = 600,000 + 0 = 600,000
- total_it = graduated_tax(600,000) = 22,500 + 20% × (600,000 − 400,000) = ₱62,500
- pt = 200,000 × 0.03 = ₱6,000
- total_burden_A = ₱68,500

**Path B (OSD):**
- business_nti_osd = 200,000 × 0.60 = 120,000 (OSD ALWAYS produces positive NTI; no loss possible)
- combined_nti = 600,000 + 120,000 = 720,000
- total_it = 22,500 + 20% × (720,000 − 400,000) = 22,500 + 64,000 = ₱86,500
- pt = ₱6,000
- total_burden_B = ₱92,500

**Path C (8%):**
- business_it = 200,000 × 0.08 = ₱16,000 (8% on GROSS — ignores the actual loss)
- compensation_it = ₱62,500
- total_it = ₱78,500; pt = 0
- total_burden_C = ₱78,500

**WINNER: Path A (Itemized) at ₱68,500 — because the business NTI is floored at ₱0, effectively shielding the business income from tax while still paying the lower compensation-only tax.**

**Engine behavior:**
- Detect: business_gross_income < itemized_deductions (net loss condition)
- Flag EC-M03: "Your business has a net operating loss of ₱[loss_amount]. The loss cannot reduce your compensation income. Under Path A (Itemized), your business income tax is ₱0, and the ₱[loss_amount] loss is tracked as NOLCO for potential deduction in future tax years."
- Set business_nti_itemized = 0 (do NOT use negative value in graduated computation)
- Track NOLCO: nolco_amount = max(itemized_deductions − business_gross_income, 0); nolco_year = tax_year; nolco_expiry = tax_year + 3
- Flag MRF-009 (business loss NOLCO tracking) — see manual-review-flags.md

---

### EC-M04: Mid-Year Employee Resignation — Becomes Pure Self-Employed

**Scenario:** Carlos resigned from his BPO job on June 30 after earning ₱280,000 taxable compensation (TW ₱4,500 — employer withheld on the ₱280K which is above ₱250K on an annualized basis but not much). He started freelance software consulting in July, earning ₱600,000 gross for July–December.

**Type of earner for the year:** Mixed income (has comp income Jan–Jun + business income Jul–Dec).

**8% eligibility:**
- gross_for_threshold = ₱600,000 (business only) ≤ ₱3M → 8% available
- IMPORTANT: Taxpayer originally registered as employee; now needs to register as self-employed. The engine should remind user to register for BIR Certificate of Registration as self-employed if not already done.
- 8% election: If taxpayer registered mid-year and filed their first 1701Q in Q3 (covering Jul–Sep), they can elect 8% at that time (it's effectively their "first quarter" of business activity). [Ref: CR-023 — election timing rules for mid-year starters]

**Quarterly filing:**
- Q1 (Jan–Mar): No business income. No 1701Q for business needed. (But if already registered as SE, file nil 1701Q.)
- Q2 (Jan–Jun): Same as Q1 — no business income. nil or skip depending on registration date.
- Q3 (Jul–Sep): First business income. Cumulative gross = ₱300,000. File first 1701Q.
  - For 1701Q Q3 (covers cumulative Jan–Sep on cumulative method, but business started in July):
  - Cumulative business gross (from Jul–Sep) = ₱300,000
  - If 8% method: IT = 300,000 × 0.08 = ₱24,000 (no ₱250K deduction — mixed income)
- Annual (Form 1701):
  - taxable_compensation = ₱280,000; TW = ₱4,500
  - gross_receipts (business) = ₱600,000

**Path C computation:**
- compensation_it = graduated_tax(280,000) = 0.15 × (280,000 − 250,000) = ₱4,500
- business_it = 600,000 × 0.08 = ₱48,000 (no ₱250K deduction)
- total_it = ₱52,500; pt = 0
- Balance at annual = 52,500 − 4,500 (TW) − 24,000 (Q3 1701Q payment) = **₱24,000 payable**

**Engine behavior:**
- Detect: user indicates business start date after January 1
- Set quarterly_filing_start_quarter = Q3 (if business started Jul–Sep)
- Remind: "Since you started business activities in July, your first quarterly income tax return (Form 1701Q) is due November 15 (Q3). You do not need to file Q1 or Q2 1701Q for business income."
- Apply the ₱250K no-deduction rule (mixed income earner for the full year)
- Prior-quarter business payments: Only Q3's ₱24,000 paid (no Q1/Q2 payments)

---

### EC-M05: Mid-Year Job Start — Pure Freelancer Becomes Mixed Income

**Scenario:** Gina was a pure freelancer from January to June (gross ₱400,000, on 8% option). She accepted a full-time job offer in July (taxable comp ₱360,000 for July–Dec, TW ₱16,500).

**Type of earner for the year:** Mixed income (became mixed income in July when she accepted a job).

**Critical rule (8% deduction — MIR-03 retroactive application):**
- In Q1 and Q2, Gina was a pure SE taxpayer, so she applied the ₱250K deduction.
  - Q1 (Jan–Mar): Gross ₱200,000. 8% IT (cumulative) = max(200K − 250K, 0) × 0.08 = ₱0. Q1 paid: ₱0.
  - Q2 (Jan–Jun): Gross ₱400,000. 8% IT (cumulative) = (400K − 250K) × 0.08 = ₱12,000. Less Q1 = ₱12,000 Q2 payment.
- BUT: At annual filing, Gina is NOW a mixed income earner (has compensation income).
  The annual 8% computation will be: business_it = 400,000 × 0.08 = ₱32,000 (NO ₱250K deduction).
  Annual compensation_it = graduated_tax(360,000) = 0.15 × (360,000 − 250,000) = ₱16,500.
  Total annual IT = 32,000 + 16,500 = ₱48,500.
  Less: TW ₱16,500; less: Q1+Q2 quarterly payments ₱12,000.
  Balance at annual = 48,500 − 16,500 − 12,000 = **₱20,000 payable**.

**Engine behavior:**
- Detect: user indicates they received compensation income mid-year (July onwards)
- At annual reconciliation: recalculate business_it WITHOUT the ₱250K deduction
- Display: "Because you received employment income from July onwards, you are now a mixed income earner for this tax year. Your quarterly payments were computed as if you were purely self-employed. The annual reconciliation adjusts your business income tax (no ₱250,000 deduction applies), resulting in a ₱20,000 balance payable."
- Note: Q1 and Q2 payments (₱12,000 total) are still creditable — they were advance payments
- The quarterly filing behavior is retroactively corrected at annual filing only; no amended quarterly returns needed

---

### EC-M06: Government Employee with Private Professional Practice

**Scenario:** Dr. Reyes is a physician employed at a government hospital (annual taxable comp ₱520,000, tax withheld via government payroll system). He also maintains a private clinic earning ₱1,200,000 gross professional fees.

**Key differences from private-sector employment:**
- Government payroll uses its own computation system (often manual or legacy); the "tax withheld" amount may not exactly match graduated computation. The engine uses whatever amount the doctor declares as TW from the government-issued Certificate of Compensation.
- GSIS deductions (not SSS) are non-taxable. These have already been excluded by the government payroll system before issuing the Certificate.
- Government employees may receive RATA (Representation and Transportation Allowance) which may be exempt from income tax under certain circulars (DBM rules). Assume it has already been excluded in the Certificate.

**Engine computation (standard mixed income):**
- taxable_compensation = ₱520,000 (from government Certificate)
- TW = whatever the government payroll withheld (enter from Certificate)
- gross_receipts = ₱1,200,000 (private practice)
- gross_for_threshold = ₱1,200,000 (business only) ≤ ₱3M → 8% eligible

**Path C:** compensation_it = grad_tax(520,000) = 22,500 + 20% × (520,000 − 400,000) = ₱46,500
business_it = 1,200,000 × 0.08 = ₱96,000 (no ₱250K deduction — mixed income)
total_it = ₱142,500; pt = 0; total_burden = ₱142,500

**Path B:** business_nti_osd = 720,000; combined_nti = 520,000 + 720,000 = 1,240,000
total_it = 102,500 + 0.25 × (1,240,000 − 800,000) = 102,500 + 110,000 = ₱212,500
pt = 1,200,000 × 0.03 = ₱36,000; total_burden = ₱248,500

**WINNER: Path C saves ₱106,000 vs Path B.**

**Engine behavior:** No special handling for government vs private employer. The Certificate of Compensation replaces Form 2316. Engine accepts both. Display note: "Government employees receive a Certificate of Compensation instead of BIR Form 2316. The taxable compensation and tax withheld values are equivalent — enter them in the same fields."

---

### EC-M07: Zero Taxable Compensation — Minimum Wage Earner with Side Business

**Scenario:** Ana is a minimum wage earner at a rural factory (exempt from income tax per NIRC Sec. 24(A)(2)(b) special MWE exemption). She receives a Form 2316 with taxable compensation = ₱0 (all compensation is non-taxable MWE pay). She also does online selling earning ₱300,000 gross from her e-commerce store.

**Key rule (MIR-03 applies even at zero taxable comp):**
- Ana IS a mixed income earner — she has compensation income from an employer.
- Even though taxable_compensation = 0, the presence of the employment relationship triggers RMC 50-2018.
- 8% business tax = 300,000 × 0.08 = ₱24,000 (NO ₱250K deduction)
- This is MORE than if she were purely self-employed: (300,000 − 250,000) × 0.08 = ₱4,000

**Engine behavior:**
- If taxable_compensation = 0 and user indicates they are an employee, proceed as mixed income
- Display note: "Even though your compensation is tax-exempt (minimum wage earner), your status as an employee means the ₱250,000 deduction cannot be applied to your business income under the 8% option. This is required by BIR RMC 50-2018."
- Compute Path C: business_it = 300,000 × 0.08 = ₱24,000 (no deduction)
- Compute Path B: combined_nti = 0 + 300,000 × 0.60 = 180,000; total_it = 0 (below ₱250K); pt = 300,000 × 0.03 = ₱9,000; total_burden_B = ₱9,000

**WINNER: Path B (₱9,000) beats Path C (₱24,000) in this specific edge case.**

Key insight: For very low business gross receipts (near ₱250K) where the ₱250K deduction is prohibited (because of mixed income status), Path B (OSD + graduated combined at ₱0 tax) may BEAT Path C (8% on full gross). This is the ONLY common scenario where a mixed income earner with low business income should not automatically choose 8%.

**Engine invariant update:** The general rule "Path C beats Path B below ₱3M for service businesses" does NOT apply to ALL mixed income scenarios. For mixed income earners, compute both and compare numerically.

---

### EC-M08: Foreign Employer — No Philippine Income Tax Withheld

**Scenario:** Miko works remotely for a US tech company (employee, not contractor). He is paid USD and the US company does not register with Philippine BIR or withhold Philippine income tax. He also does freelance coding on the side earning ₱500,000 from local clients.

**Philippine tax treatment of foreign employment income:**
- Filipino citizens are taxed on WORLDWIDE income per NIRC Sec. 23(A).
- Foreign employment income IS taxable in the Philippines; the US employer does not handle this.
- US taxes withheld (if any) cannot offset Philippine income tax without a tax treaty credit (Philippines-US tax treaty is the US-Philippines Tax Treaty of 1982). [FLAG: MRF-016 — foreign tax credit computation is complex and out of scope for engine; flag for professional review.]
- For engine purposes: user enters their annual foreign employment income (converted to PHP at BSP annual average rate) as taxable_compensation. TW = 0 (no Philippine withholding by foreign employer).

**Engine computation:**
- taxable_compensation = foreign_comp_in_USD × bsp_annual_rate (user provides this conversion)
- tax_withheld_by_employer = 0
- business_gross_receipts = ₱500,000

**Path C (8% on business, mixed income):**
- compensation_it = graduated_tax(taxable_comp_php) — varies based on amount
- business_it = 500,000 × 0.08 = ₱40,000 (no ₱250K deduction)
- total_it = compensation_it + 40,000
- it_balance_at_annual = total_it − 0 (TW) − CWT_business − quarterly_paid
  → Likely a large balance payable since no TW on comp

**Engine behavior:**
- If user indicates "foreign employer / no Philippine withholding":
  - Set tax_withheld_by_employer = 0
  - Show warning: "Your foreign employer does not withhold Philippine income tax. Your compensation income is still fully taxable in the Philippines. You must self-compute and pay via quarterly 1701Q for any advance payments, or prepare for a large balance at annual filing."
  - Flag MRF-016 (foreign employment income), MRF-017 (foreign tax credit if any taxes paid abroad)
- For quarterly planning: advise the taxpayer to make estimated quarterly IT payments on compensation income to avoid a large year-end balance (optional — no requirement to pay comp tax quarterly if no employer)

---

### EC-M09: Mixed Income with Large Business CWT — Potential Refund

**Scenario:** Lani is an employee (taxable comp ₱480,000, TW ₱34,500) who also has a professional practice. Her clients issued Form 2307 at 15% EWT rate on ₱800,000 gross professional fees. total_cwt_business = ₱120,000 (15% × 800,000).

**Path C (8%):**
- compensation_it = graduated_tax(480,000) = 22,500 + 20% × (480,000 − 400,000) = ₱38,500
- business_it = 800,000 × 0.08 = ₱64,000 (no ₱250K deduction — mixed income)
- total_it = ₱102,500; pt = 0; total_burden = ₱102,500
- Total credits = TW (₱34,500) + CWT_business (₱120,000) + quarterly_paid (₱0) = ₱154,500
- Overpayment: 154,500 − 102,500 = **₱52,000 REFUND**

**Engine behavior:**
- Detect overpayment: overpayment = max(total_credits − total_it, 0) = ₱52,000
- Display: "You have a refund of ₱52,000. This is because your creditable withholding tax (₱120,000 withheld by your clients at 15%) plus employer withholding (₱34,500) exceed your total income tax due (₱102,500) by ₱52,000."
- Refund options: (a) Claim as cash refund — file annual 1701 with "To be refunded" option, then file BIR Form 1914 or 1918 for refund; (b) Apply as tax credit for next year — check "To be carried over/applied to next year" on Form 1701
- Warning: "Cash refunds from the BIR can take time to process. Consider applying the excess as a tax credit to next year's return if you expect similar income levels."
- Note: The 15% EWT rate appears abnormally high. Standard EWT for professional fees is 10% (gross < ₱3M prior year) or 15% (gross ≥ ₱3M prior year). Verify ATC code and confirm the correct rate was applied by clients.

**Invariant:** overpayment and it_balance_at_annual cannot both be > 0 simultaneously. If total_credits > total_it → overpayment; if total_credits < total_it → balance_due.

---

### EC-M10: Business Income Switches Regime Mid-Year (8% to Graduated)

**Scenario:** Jed is a mixed income earner who elected 8% for business income at Q1 (gross receipts ₱200,000 by March). By September (Q3 filing), his cumulative business gross crossed ₱3,000,000 (total ₱3,100,000).

**When 8% election is retroactively cancelled:**
- At the point gross_for_threshold exceeds ₱3,000,000, the 8% option is automatically DISQUALIFIED.
- Taxpayer must switch to graduated rates (Path A or B) for the ENTIRE YEAR.
- Q1 and Q2 payments made under 8% become advance payments toward the graduated-rate annual tax.
- Q3 1701Q must be filed under graduated method (cumulative Jan–Sep, not just Q3 business).

**Engine behavior at annual filing (if user discloses full-year gross > ₱3M after having elected 8%):**
- Detect: election_status = EIGHT_PCT_ELECTED but gross_for_threshold > 3,000,000
- Flag EC-M10: "Your gross business receipts exceeded ₱3,000,000 this year. The 8% option is not available. We have switched your computation to graduated rates for the full year. Your Q1/Q2 8% payments (₱[amount]) are credited as advance payments."
- Recompute using Path B (OSD) or Path A (Itemized) for the full year
- Prior quarterly payments under 8% are added to total_quarterly_it_paid
- At annual: total tax = graduated-rate computation; less: TW + CWT + 8%-based quarterly payments
- Also flag: VAT registration obligation triggered (taxpayer must register for VAT within 30 days of the month threshold was breached). Show alert: "You must register for Value-Added Tax (VAT) with the BIR. Contact your Revenue District Office to update your Certificate of Registration."

**This EC-M10 applies identically whether the taxpayer is pure SE or mixed income.** The distinction is that for mixed income, the annual form is 1701 (not 1701A) and the computation still separates compensation from business income.

---

## Group EC-VPT: VAT vs. Percentage Tax Edge Cases

### EC-VPT01: Exactly ₱3,000,000 Gross Sales — Triple Boundary
**Scenario:** A freelance graphic designer has exactly ₱3,000,000 in annual gross sales.

**Applicable rules and outcomes:**
- EOPT Taxpayer Tier: **SMALL** (boundary is "less than ₱3M" — exactly ₱3M is SMALL, not MICRO)
- VAT Registration: **NOT required** (threshold is "exceeding ₱3M" — ₱3M exactly is not "exceeding")
- 8% Option Eligibility: **STILL ELIGIBLE** (threshold is "not exceeding ₱3M" — ₱3M is included)
- Percentage Tax: Applies (non-VAT, not on 8%, gross ≤ ₱3M), unless 8% is elected

**Engine behavior:**
- `taxpayer_tier = SMALL`
- `vat_registration_required = false`
- `eight_pct_eligible = true`
- `opm_obligation = true` (unless 8% elected)
- If 8% is elected: Path C total = (₱3,000,000 − ₱250,000) × 0.08 = ₱220,000
- If Path B: NTI = ₱3,000,000 × 0.60 = ₱1,800,000; IT = ₱402,500 + (₱1,800,000 − ₱2,000,000) × 0.25 = ₱402,500 − wait, ₱1,800,000 is in bracket 4: IT = ₱102,500 + (₱1,800,000 − ₱800,000) × 0.25 = ₱102,500 + ₱250,000 = ₱352,500; PT = ₱3,000,000 × 0.03 = ₱90,000; Total B = ₱442,500
- Recommendation: Path C (₱220,000) saves ₱222,500 vs Path B

**Engine output note:** "Although your gross sales equal exactly ₱3,000,000, you remain eligible for the 8% option and VAT registration is not required."

---

### EC-VPT02: Voluntary VAT Registration Below ₱3M
**Scenario:** A web developer with ₱1,500,000 in gross sales voluntarily registered for VAT (clients required a VAT-registered supplier for their input VAT credits).

**What changes:**
- VAT applies (voluntary registration is binding)
- Percentage tax does NOT apply (mutual exclusivity)
- 8% option is NOT available (VAT-registered status bars 8%)
- Engine: Paths A and B only; no percentage tax component

**Engine behavior:**
- `vat_registered = true`
- `eight_pct_eligible = false`
- `opm_obligation = false`
- Alert: "You are voluntarily VAT-registered. The 8% option is not available and you have a separate quarterly VAT obligation. This tool computes income tax only."

**Comparison table for this taxpayer:**

| Path | NTI | Income Tax | PT | VAT | Total IT |
|------|-----|------------|----|----|---------|
| A (Itemized, assume ₱300K expenses) | ₱1,200,000 | ₱148,500 | ₱0 | Separate | ₱148,500 |
| B (OSD) | ₱900,000 | ₱102,500 + ₱25,000 = ₱127,500 — wait: ₱900K is bracket 4: ₱102,500 + (₱900,000 − ₱800,000) × 0.25 = ₱102,500 + ₱25,000 = ₱127,500 | ₱0 | Separate | ₱127,500 |
| C (8%) | N/A | N/A | N/A | N/A | NOT AVAILABLE |

**Recommendation: Path B (OSD) at ₱127,500 total IT.** VAT obligation is separate and not included.

---

### EC-VPT03: Taxpayer Crosses ₱3M During Q3 — Split-Quarter OPT
**Scenario:** A consultant's cumulative gross sales reached ₱3,100,000 in September (Q3). Was on Path B (graduated + OSD) all year. Had not elected 8%.

**Applicable rules:**
- 8% was never elected → OPT was due Q1 and Q2
- Q3: OPT applies from July 1 to the day before VAT takes effect (filing Form 1905 in October, VAT effective November 1)
- Q4: VAT (no OPT)

**Step-by-step engine behavior:**
1. Detect: `annual_gross_sales = 3,100,000 > 3,000,000` AND `not vat_registered` AND `not elected_eight_percent`
2. Set `vat_registration_required = true`
3. For income tax regime comparison: treat as VAT-registered (no OPT in final burden for simplicity — the actual Q3 OPT is a separate transition detail)
4. Alert: "Your gross sales exceeded ₱3,000,000. VAT registration is required (File Form 1905 at your RDO within 10 days of September 30). Percentage tax (3%) applied to your sales from January through the day before VAT took effect."
5. Compute Q3 OPT (July–September, pre-VAT): e.g., Q3 gross sales = ₱700,000 → OPT = ₱21,000
6. Annual income tax uses full-year gross income (VAT-exclusive): graduated rates on Path A or B

**Manual review flag MRF-019 applies** — user must confirm exact breach month and VAT effective date for correct Q3 2551Q filing split.

---

### EC-VPT04: Taxpayer on 8% Crosses ₱3M Mid-Year (Combined EC with EC-T02)
**Scenario:** A graphic artist elected 8% for 2026 in Q1 (filing 2551Q NIL and 1701Q with 8% box). By August (Q3), cumulative gross reaches ₱3,200,000.

**Cascade of consequences:**
1. 8% option RETROACTIVELY CANCELLED for all of 2026 (CR-024 mid-year breach procedure)
2. VAT registration REQUIRED: File Form 1905 within 10 days of August 31
3. VAT effective September 1, 2026 (assuming Oct 10 deadline met)
4. Retroactive OPT: 3% × gross sales Jan–Aug (pre-VAT period) computed and filed via amended 2551Q
5. All 8% quarterly IT payments (Q1, Q2 under 8%) reclassified as advance IT payments
6. Annual income tax: graduated rates (Path A or B) on full-year gross income

**Retroactive OPT computation example:**
- Jan–Aug gross sales: ₱3,200,000 (all sales before VAT effective date)
- Wait — breach is at ₱3M, so Jan–Aug total is ₱3,200,000; VAT effective Sep 1
- Retroactive OPT = ₱3,200,000 × 0.03 = ₱96,000

**Note:** The retroactive OPT is deductible as Path A itemized expense (Sec. 34(C)(1)), but for total burden comparison, it is an additional cost. The engine should show the total additional cost triggered by the breach.

**Engine output:**
- `eight_pct_breached = true`
- `breach_month = "August 2026"`
- `retroactive_opm = 96,000`
- `vat_registration_required = true`
- `vat_effective_date = "September 1, 2026"`
- Switch to graduated rates for full year; credit prior 8% quarterly payments

---

### EC-VPT05: Two Businesses — One Exceeds ₱3M, One Does Not
**Scenario:** A freelancer has two lines of business: (1) web development (GR ₱2,500,000) and (2) online English tutoring (GR ₱800,000). Total gross = ₱3,300,000.

**Rule:** The ₱3M threshold uses COMBINED gross sales from ALL business activities of the same individual taxpayer (per NIRC Sec. 236(G) — the threshold applies to the person, not to individual business lines).

**Engine behavior:**
- `total_gross_sales = 2,500,000 + 800,000 = 3,300,000`
- `vat_registration_required = true` (combined exceeds ₱3M)
- `eight_pct_eligible = false` (combined exceeds ₱3M)
- `opm_obligation = false` for income tax purposes (treat as VAT scenario)
- Alert: "Your combined gross sales from all business activities total ₱3,300,000, which exceeds the ₱3M VAT threshold. VAT registration is required for ALL your business activities."

**Note:** After VAT registration, BOTH business lines are VAT-registered — taxpayer cannot register only one business line for VAT. VAT applies to all sales of the individual taxpayer.

---

### EC-VPT06: OPT as Deductible Expense Creates Apparent Discrepancy
**Scenario:** A freelancer uses Path A (itemized deductions). They claim the percentage tax paid (₱45,000) as an itemized deduction. Their accountant says their total tax burden is ₱147,000 (IT) + ₱45,000 (OPT) = ₱192,000. But their CPA says the income tax is only ₱137,250 because the OPT is deducted first.

**Resolution:** Both are correct — they're describing different things:
- **CPA's calculation:** IT computed AFTER deducting OPT = ₱137,250. Plus OPT of ₱45,000. Total burden = ₱182,250.
- **Naive sum:** IT without OPT deduction = ₱147,000. Plus OPT. Total = ₱192,000. **INCORRECT** — overstates burden.
- **Correct method** (CR-032 algorithm): OPT reduces Path A's NTI, which lowers IT. Total burden = lower IT + OPT.

**Engine behavior:**
- Always compute Path A using the CR-032 algorithm (OPT included in itemized deductions first, then compute IT on reduced NTI, then add OPT back for total burden display)
- Show breakdown: "Income Tax: ₱137,250 + Percentage Tax: ₱45,000 = Total: ₱182,250"
- Path A savings vs Path B and C computed on this correct total

---

### EC-VPT07: OPT Rate History — Taxpayer Files Amended Return for 2021
**Scenario:** A freelancer is filing an amended annual ITR for taxable year 2021 (for audit defense). They need to include the correct percentage tax for that year.

**Applicable OPT rate for 2021:**
- Q1 2021 (Jan–Mar): 1% (CREATE 1% rate — effective July 1, 2020; Q1 2021 is within the 1% period)
- Q2 2021 (Apr–Jun): 1%
- Q3 2021 (Jul–Sep): 1%
- Q4 2021 (Oct–Dec): 1%
- Full year 2021: ALL quarters at 1% (entire year 2021 falls within July 1, 2020 – June 30, 2023 window)

**Engine behavior when `tax_year = 2021`:**
- `pt_rate = 0.01` (for the full 2021 year)
- Annual OPT = annual_gross_receipts (cash basis for 2021) × 0.01
- Note: For TY2021, the basis is gross RECEIPTS (pre-EOPT), not gross sales
- Path A: OPT = receipts × 0.01; deductible under Sec. 34(C)(1)
- Path B: OPT = receipts × 0.01; adds to total burden

**Reference:** See [percentage-tax-rates.md Part 1](lookup-tables/percentage-tax-rates.md) for complete rate history table.

---

### EC-VPT08: Percentage Tax as the Only Tax Due (Zero Income Tax)
**Scenario:** A first-year freelance writer earns ₱200,000 in gross receipts, has no expenses, and is not on 8% option.

**Path B (OSD):**
- NTI = ₱200,000 × 0.60 = ₱120,000
- IT = ₱0 (below ₱250,000 zero-bracket)
- OPT = ₱200,000 × 0.03 = ₱6,000
- Total burden B = ₱6,000 (OPT only)

**Path C (8%, if eligible — assume eligible):**
- IT = (₱200,000 − ₱250,000) → max(−₱50,000, 0) = ₱0 (negative base → zero tax)
- OPT = ₱0 (waived)
- Total burden C = ₱0

**Recommendation: Path C (₱0) is best.** However, even though there is zero income tax, the taxpayer must still:
- File Q1 1701Q (8% option box checked, zero tax due)
- File 2551Q NIL for Q1 if not electing 8%, OR file 2551Q with ₱6,000/4 = ₱1,500 per quarter

**Edge case:** Path C with gross receipts < ₱250,000 results in ₱0 income tax AND ₱0 percentage tax. The taxpayer must still register with BIR and file returns (NIL returns). Engine behavior: show "₱0 total tax — Path C recommended. You must still file quarterly returns and annual ITR even with zero liability."

---

### EC-VPT09: Percentage Tax on Non-Operating Income
**Scenario:** A non-VAT freelance photographer earns ₱800,000 in professional fees and also ₱50,000 in bank interest (already subjected to 20% Final Withholding Tax).

**OPT basis clarification:**
- Professional fees: ₱800,000 — SUBJECT to OPT (business/professional income)
- Bank interest income: ₱50,000 — **NOT SUBJECT to OPT** (final-taxed passive income; excluded from OPT base)
- OPT base = ₱800,000 only
- OPT = ₱800,000 × 0.03 = ₱24,000

**Engine behavior:**
- OPT is computed on professional fee/business gross sales ONLY
- Passive income subjected to final withholding tax (interest, dividends, royalties) is EXCLUDED from OPT base
- `opm_base = gross_professional_sales` (excludes final-withheld income)
- For 8% threshold test: same — final-withheld income excluded from the ₱3M threshold calculation

**Note for non-operating income in 8% computation:** Non-operating income that is NOT subject to FWT (e.g., rental income from a property used in business) IS included in the 8% base and OPT base.

---

### EC-VPT10: VAT-Registered Taxpayer Switching to Graduated Rates — PT Impact
**Scenario:** A VAT-registered architect (₱4,500,000 gross sales) wants to compare Path A vs Path B. In prior years, their CPA always chose OSD. This year they have significant business expenses (₱2,200,000) and wonder if itemized beats OSD.

**Key rule:** For VAT-registered taxpayers, the OSD breakeven is still 40% of gross INCOME:
- OSD deduction = gross income × 40%
- Itemized beats OSD when itemized > gross income × 40%
- VAT-exclusive gross income = ₱4,500,000
- OSD amount = ₱4,500,000 × 0.40 = ₱1,800,000
- Itemized = ₱2,200,000 > ₱1,800,000 → **Path A (itemized) WINS**

**Computation:**
- Path A: NTI = ₱4,500,000 − ₱2,200,000 = ₱2,300,000; IT = ₱402,500 + (₱2,300,000 − ₱2,000,000) × 0.30 = ₱402,500 + ₱90,000 = ₱492,500
- Path B: NTI = ₱4,500,000 × 0.60 = ₱2,700,000; IT = ₱402,500 + (₱2,700,000 − ₱2,000,000) × 0.30 = ₱402,500 + ₱210,000 = ₱612,500
- No OPT on either path (VAT-registered)
- Savings from Path A vs B: ₱612,500 − ₱492,500 = ₱120,000

**Engine behavior:** For VAT-registered taxpayers, no OPT in total burden for either path. Breakeven analysis: `itemized_deductions > gross_income * 0.40` → Path A wins. This is the same breakeven as non-VAT taxpayers (the presence of OPT on both paths for non-VAT does not change the relative breakeven between A and B — only the A-vs-C and B-vs-C comparisons are affected by OPT presence/absence).

---

## Group EC-PT: Percentage Tax Filing Mechanics Edge Cases

### EC-PT01: First-Year Registrant — Mid-Year Registration, PT Obligation Start Date

**Scenario:** A graphic designer registers with BIR on March 15, 2026 (mid-Q1). She starts earning income immediately after registration. When is her first Form 2551Q due, and what is the taxable gross for Q1?

**Resolution:**
The percentage tax obligation begins on the DATE OF BIR REGISTRATION, not January 1 of the year. The taxpayer only has PT obligations for periods AFTER registration.

- Q1 taxable period covered: March 15 – March 31, 2026 (16 days; not the full quarter)
- Q1 gross sales for Form 2551Q: Only gross sales/receipts INVOICED from March 15 onwards
- Q1 Form 2551Q deadline: April 25, 2026 (same deadline regardless of registration date)
- Q1 Item 13 election: Must declare income tax rate election (GRADUATED or EIGHT_PERCENT) on this first Q1 return
- Q1 is the first Q1 the taxpayer has registered; election declared here applies for the remainder of 2026

**Engine behavior:**
- Input: `registration_date = "2026-03-15"`, `taxable_year = 2026`
- Q1 gross for PT computation: Only income from March 15 to March 31 (user must input this separately from Jan-Feb income, which is zero/pre-registration)
- For Q1 Form 1701Q: Same rule — only income from registration date is included
- Flag to user: "Your Q1 percentage tax and income tax returns cover only the period from your registration date (March 15, 2026) through March 31, 2026. Include only invoices issued from March 15 onwards."
- No PT obligation arises for any period before registration date
- For the annual income tax return (Form 1701A/1701), the full-year computation uses income from registration date only

**Legal basis:** Registration creates the tax obligation from the date it is effective. BIR registration under Sec. 236 creates the obligation to file returns from the first applicable period after registration.

---

### EC-PT02: Graduated Declared on Q1 Form 2551Q — Taxpayer Now Wants 8%

**Scenario:** An IT consultant filed her Q1 Form 2551Q on April 20, 2026 and checked "Graduated income tax rate" on Item 13. She paid ₱7,500 PT (3% × ₱250,000 Q1 gross). In May, her CPA tells her the 8% option would save her ₱38,000 for the year. Can she switch?

**Resolution:**
**No.** The income tax rate election on Q1 Form 2551Q is IRREVOCABLE for the taxable year. Once "Graduated income tax rate" is declared on Item 13 of the Q1 return, the taxpayer CANNOT switch to 8% for the same taxable year. This is explicitly stated in RR No. 8-2018 Sec. 2(A): "The election...shall be irrevocable and the taxpayer shall be bound to its application for the entire taxable year."

**Engine behavior:**
- Input: `has_filed_q1_with_graduated_election = true`, `taxable_year = 2026`
- Output: 8% option shown as UNAVAILABLE with reason: "You already elected the graduated income tax rate on your Q1 Form 2551Q. This election is irrevocable for TY2026. The 8% option will become available again starting Q1 TY2027 if you elect it then."
- Tool must show the potential savings the taxpayer is foregoing, as motivation to elect correctly for NEXT year
- Do NOT compute or recommend Path C for this taxpayer for TY2026
- Note in output: "For TY2027: elect 8% on Q1 Form 2551Q or Q1 Form 1701Q (whichever you file first) to avoid locking into graduated rates again."

**What the taxpayer CAN do:**
- File the remaining Q2, Q3, Q4 Form 2551Q returns (graduated rate; 3% PT applies each quarter)
- File Form 1701A or 1701 at annual (graduated method)
- Cannot amend Q1 2551Q to change the election (amendment only corrects errors in gross receipts or tax computation, not the rate election itself)

---

### EC-PT03: Government Agency as Withholding Agent — PT Withholding Credit (Item 15)

**Scenario:** A freelance translator provides services to the Department of Foreign Affairs (DFA). DFA is a government withholding agent. DFA pays her ₱180,000 in professional fees for Q2 2026 and issues two documents: (1) BIR Form 2307 (ATC WI010, 5% EWT, ₱9,000) for income tax withholding, and (2) BIR Form 2307 (ATC PT010, 3% OPT, ₱5,400) for percentage tax withholding. How does she handle the PT withholding?

**Correct handling:**
```
Q2 gross sales: ₱180,000
Q2 PT due (3% × ₱180,000): ₱5,400

Form 2551Q Q2 computation:
  Item 14 (total tax due from Schedule 1): ₱5,400
  Item 15 (government PT withholding per Form 2307 ATC PT010): ₱5,400
  Item 18 (total credits): ₱5,400
  Item 19 (tax still payable): ₱5,400 − ₱5,400 = ₱0

  Total amount payable: ₱0
  (The government already withheld and remitted the PT on her behalf)

Separately, the EWT credit (₱9,000 from WI010 2307):
  Goes into Form 1701Q Q2 as income tax credit (Item 15/16 of 1701Q)
  NOT applied against PT (EWT is an income tax credit; PT is a separate tax)
```

**Engine behavior:**
- User inputs `government_cwt_pct_tax = 5,400` for Q2
- This value flows to Item 15 of Form 2551Q
- Engine reduces Item 19 accordingly (₱0 payable in this case)
- Engine shows the two 2307s separately:
  - "Income tax credit (EWT, ATC WI010): ₱9,000 — applies to your quarterly income tax return (Form 1701Q)"
  - "Percentage tax credit (OPT, ATC PT010): ₱5,400 — applies to your quarterly PT return (Form 2551Q)"
- If government PT withholding > PT due: overpayment — user must file for refund or carry forward

**When government PT withholding occurs:** Government agencies that are withholding agents (DepEd, DOH, DFA, DOST, LGUs, GOCCs) are required to withhold percentage tax (in addition to EWT) when paying non-VAT registered suppliers. Freelancers earning from government contracts must watch for this.

**PT overpayment resolution:** An overpayment of percentage tax (Item 15 credits > Item 14 tax due) results in a negative Item 19. The excess is shown as "(Overpayment)". The taxpayer may:
1. Carry forward the excess to the next quarter (apply as credit in Item 17 of next quarter's 2551Q with description "Excess OPT from prior quarter")
2. File a formal refund claim with BIR (rare, given small amounts)

---

### EC-PT04: Freelancer with Multiple Lines of Business — Multiple ATC Rows

**Scenario:** A self-employed individual has two business activities in 2026: (1) professional fees from freelance copywriting (₱600,000 Q2 gross), and (2) small retail sales of handmade crafts via Instagram (₱80,000 Q2 gross). Total Q2 gross = ₱680,000. Both activities are non-VAT (combined < ₱3M). How does the Form 2551Q Schedule 1 look?

**Analysis:**
Both professional fees and small retail sales by an individual with gross sales ≤ ₱3M fall under NIRC Sec. 116, which applies to "persons who are not VAT-registered." The ATC for both is **PT010** (Persons exempt from VAT under Sec. 109(CC)).

For this taxpayer, the two activities do NOT require separate Schedule 1 rows because they both use the same ATC (PT010) and the same tax rate (3%). They are combined into a single PT010 row with the total gross from both activities.

```
Q2 Form 2551Q Schedule 1:
  Row 1: ATC = PT010
         Taxable Amount = ₱680,000    // ₱600,000 professional + ₱80,000 retail
         Tax Rate = 3%
         Tax Due = ₱680,000 × 0.03 = ₱20,400

  Item 7 Total: ₱20,400
  Item 14: ₱20,400
  Total payable: ₱20,400
```

**When MULTIPLE ATC rows are genuinely needed:**
If a taxpayer has activities under DIFFERENT ATC codes with different rates (e.g., a franchise holder paying 2% under PT060 AND professional services at 3% under PT010), they use separate rows. However, for this tool's target users (freelancers, professionals, sole proprietors in service industries), all income is typically PT010 at 3%. The engine should warn if a user enters activities that might carry different ATC codes.

**Engine behavior:**
- Aggregate all non-VAT, non-8%, non-exempt business income into a single quarterly_gross_sales figure
- All income under Sec. 116 uses PT010 at 3%
- Flag to user: "If you have activities subject to a different percentage tax rate (e.g., franchise under Sec. 119), consult a CPA — this tool covers PT010 (professional/service income) only."

---

### EC-PT05: Partial-Quarter PT After VAT Deregistration Takes Effect

**Scenario:** A formerly VAT-registered architect's VAT deregistration was approved effective January 1, 2026. Her last VAT return was for Q4 2025. Starting January 2026, she is non-VAT and must file Form 2551Q. Her Q1 2026 gross sales are ₱450,000. This is also her first chance to elect 8% since deregistration.

**Resolution:**
Upon successful VAT deregistration (Form 1905 approved), the taxpayer reverts to percentage tax (Sec. 116) and becomes eligible for the 8% option if gross ≤ ₱3M. The transition is clean at the start of a quarter.

```
Q1 2026 — First quarter as non-VAT:
  quarterly_gross_sales = ₱450,000
  Item 13 election (Q1 only): Must elect NOW
    → Option 1: Elect GRADUATED → 3% PT due = ₱450,000 × 0.03 = ₱13,500
    → Option 2: Elect EIGHT_PERCENT → PT = ₱0 (waived by 8% election)

  If electing 8% (Option 2):
    Q1 2551Q: Filed with "8% income tax rate" checked; Tax due = ₱0
    Q2-Q4 2551Q: Not filed
    Annual ITR: Form 1701A (8% method); income tax = (gross - ₱250,000) × 8%

  If electing graduated (Option 1):
    Q1-Q4 2551Q: Filed quarterly (3% each quarter)
    Annual ITR: Form 1701A or 1701 (OSD or itemized)
```

**Engine behavior:**
- Input flag: `first_year_as_non_vat = true`
- Output alert: "You have reverted from VAT to non-VAT status this taxable year. You must file Form 2551Q (percentage tax) for 2026 if you elect the graduated income tax rate, OR declare the 8% option on your Q1 Form 2551Q. Your Q1 Item 13 election is the critical first step — it determines your entire 2026 filing path."
- Engine runs full three-path comparison to help the taxpayer choose the optimal election
- Note: If prior year gross was > ₱3M (reason for VAT registration), and current year gross is estimated at ≤ ₱3M, 8% option is available for the current year

**Prior-year CWT rate implication:** If the taxpayer's prior year (2025) gross was > ₱3M (when VAT-registered), clients in 2026 may initially withhold EWT at 10% (the higher rate for prior-year gross > ₱3M). However, since 2025 gross > ₱3M, the 10% rate is correct for 2026 regardless of VAT status. This affects the CWT credits computation but not the PT computation.

---

### EC-PT06: Q1 Form 2551Q Filed Late — PT Penalties vs. No PT Penalties Under 8%

**Scenario:** A freelance videographer was uncertain about electing 8% and filed his Q1 Form 2551Q on May 30, 2026 (35 days late; deadline was April 25). He ultimately checked "Graduated income tax rate" on Item 13 and paid ₱12,000 PT (₱400,000 Q1 gross × 3%). What penalties apply?

**Penalty computation (MICRO taxpayer):**
```
Basic tax due: ₱12,000
Days late: 35 (April 26 to May 30, inclusive)
Tier: MICRO (gross < ₱3M)

Surcharge (CR-016):
  MICRO tier, failure to pay: 10% of tax due
  Surcharge = ₱12,000 × 0.10 = ₱1,200

Interest (CR-017):
  MICRO tier: 6% per annum
  Interest = ₱12,000 × 0.06 × (35 / 365) = ₱12,000 × 0.005753 = ₱69.04 → ₱69.04

Compromise (CR-020.1):
  Tax due ₱12,000 falls in the ≤₱20,000 bracket → ₱5,000

Total penalties: ₱1,200 + ₱69.04 + ₱5,000 = ₱6,269.04
Total amount due: ₱12,000 + ₱6,269.04 = ₱18,269.04
```

**What if he had elected 8% instead?**
```
If 8% elected:
  Q1 2551Q: ₱0 PT due (waived by 8%)
  Filing deadline still April 25, 2026
  If filed late (May 30):
    Basic tax due: ₱0 (NIL return)
    Compromise for late NIL return (first offense): ₱1,000
    (No surcharge or interest on ₱0 tax due)

  Savings from electing 8%: No PT liability → only ₱1,000 compromise for late NIL
  vs. ₱18,269.04 total penalty on graduated path
```

**Engine behavior:**
- When generating Form 2551Q with late filing: call `compute_total_late_filing_penalty()` (CR-020)
- Populate Item 20 (surcharge), Item 21 (interest), Item 22 (compromise) with computed values
- Flag: "This return is X days past the filing deadline. Penalties have been computed above. To minimize penalties, file and pay immediately."
- Late NIL 2551Q penalties also computed (CR-020.2) for taxpayers who had zero income but filed late

**Key distinction:**
- Late 2551Q with tax due: THREE components (surcharge + interest + compromise)
- Late 2551Q with ₱0 tax due (nil return): ONLY compromise penalty (₱1,000 / ₱5,000 / ₱10,000 by offense count), no surcharge or interest (₱0 × 10% = ₱0; ₱0 × 6% = ₱0)

*Cross-references: [CR-034 (Form 2551Q engine)](../computation-rules.md) | [percentage-tax-rates.md Part 11](percentage-tax-rates.md) | [EC-VPT group (VAT/PT boundary)](edge-cases.md) | [CR-020 (penalty computation)](../computation-rules.md)*

