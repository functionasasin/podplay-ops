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
