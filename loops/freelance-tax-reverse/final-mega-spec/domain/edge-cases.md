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

*Additional edge cases to be added in Wave 2 edge-cases aspect (EC-E: eligibility edge cases, EC-M: mixed income edge cases, EC-Q: quarterly filing edge cases, EC-C: CWT edge cases, EC-F: filing form edge cases)*
