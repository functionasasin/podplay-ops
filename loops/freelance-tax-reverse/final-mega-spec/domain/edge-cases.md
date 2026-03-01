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

*Additional edge cases to be added in Wave 2 edge-cases aspect (EC-E: eligibility edge cases, EC-M: mixed income edge cases, EC-Q: quarterly filing edge cases, EC-C: CWT edge cases from professional fee withholding, EC-F: filing form edge cases)*
