# Wave 1 Analysis: Maceda Law (RA 6552) — Realty Installment Buyer Rights

**Aspect:** maceda-law-real-estate
**Sources:** RA 6552 (Maceda Law, Aug. 26 1972), PD 957 (Subdivision and Condominium Buyers' Protective Decree), DHSUD/HLURB adjudication records, Civil Code Art. 1226-1229 (penalty clauses), HSAC (Human Settlements Adjudication Commission) fee schedule, PSA residential building permit data 2024
**Date analyzed:** 2026-02-25

---

## Overview

The Maceda Law (Republic Act No. 6552), enacted in 1972, is the Philippines' primary consumer protection statute for buyers of residential real estate on installment. It imposes mandatory, non-waivable rights on sellers of residential subdivisions and condominium units — rights that are 100% defined by deterministic statutory formulas. The law defines exact cash surrender value (CSV) formulas, grace period computation rules, and mandatory procedural prerequisites to cancellation.

Despite being fully statutory and arithmetically computable, millions of Filipino installment buyers are systematically deprived of their Maceda rights due to:
1. **Information asymmetry**: Buyers don't know the formula or that their rights are non-waivable.
2. **Power asymmetry**: Developers (SM, Ayala, DMCI, Megaworld, etc.) have legal departments; buyers typically don't.
3. **Lawyer gating**: Enforcing Maceda rights currently requires filing a DHSUD/HSAC complaint, which most buyers attempt only with legal counsel.
4. **Developer abuse**: Contracts with clauses that waive Maceda rights (explicitly void under Sec. 6), informal "verbal" cancellations without notarial notice, and CSV refunds that are calculated below the statutory floor.

The core insight: the CSV computation is a single algebraic formula with graduated rates defined by the statute itself — the equivalent of the inheritance engine's legitime computation. A buyer who knows the formula and their rights needs only: (1) total payments made, (2) years of installment, and (3) date of last payment to compute exactly what they are owed.

---

## Domains Identified

---

### Domain 1: Cash Surrender Value (CSV) Calculator

**Description:** When a real estate installment buyer defaults on payments and the seller/developer seeks to cancel the contract, RA 6552 mandates a cash surrender value refund. The formula is entirely determined by the statute based on total payments made and years of installment. Buyers who have paid for 2+ years are entitled to at least 50% of total payments, increasing by 5% per year after the 5th year, capped at 90%. The actual cancellation cannot take effect until the CSV is paid in full to the buyer.

**Governing sections:**
- RA 6552 Sec. 3(b) — CSV formula for buyers who have paid 2+ years of installments: 50% of total payments made for 2-5 years; additional 5% per year beyond 5 years; maximum 90%
- RA 6552 Sec. 3(a) — Grace period right: 1 month for every 1 year of installments paid, exercisable once every 5 years
- RA 6552 Sec. 4 — Rights for buyers who have paid less than 2 years: 60-day grace period minimum; no CSV refund required
- RA 6552 Sec. 3(b) — Cancellation effective 30 days after notarial notice AND after full CSV payment
- RA 6552 Sec. 6 — Any contract clause waiving or modifying Secs. 3, 4, 5 is void and of no effect
- PD 957 Sec. 23 — Complementary protection: buyer may rescind if developer fails to develop project; full reimbursement of all payments including amortization interest at legal rate

**Computation sketch:**

```
INPUTS:
- Total amount paid to date (all installments + down payment + deposits + option money)
- Date of first payment
- Date of latest/last payment
- Date contract was cancelled or notice received (to determine years of installment)

STEP 1: Compute years of installment paid
  years = floor((cancellation_date − first_payment_date) in days / 365)

STEP 2: Determine eligibility tier
  If years < 2:
    → Section 4 applies: 60-day grace period, NO CSV refund
  If years >= 2:
    → Section 3 applies: CSV refund mandatory

STEP 3: Compute refund percentage
  If 2 ≤ years ≤ 5:  refund_pct = 50%
  If years > 5:       refund_pct = 50% + (years − 5) × 5%
  Cap at:             refund_pct = min(refund_pct, 90%)

STEP 4: Compute CSV amount
  CSV = total_payments × refund_pct

STEP 5: Compute grace period (if still in active installment)
  grace_period_days = years_paid × 30  [1 month per year of installment]
  Note: exercisable only once every 5 years of contract life

STEP 6: Compute cancellation notice deadline
  effective_cancellation_date = notarial_notice_receipt_date + 30 days
  AND CSV must be paid in full by that date

OUTPUT:
- Eligible tier (Sec. 3 or Sec. 4)
- CSV amount (in PHP)
- Refund percentage
- Grace period days remaining
- Effective cancellation date (if notice was received)
- "Fair check" flag: Is the developer's offered CSV equal to the statutory floor?
```

**Refund percentage table (fully statutory, RA 6552 Sec. 3(b)):**

| Years of Installment Paid | Refund % | Example: Total Paid = P500,000 |
|---------------------------|----------|-------------------------------|
| < 2 years | 0% (Sec. 4) | P0 |
| 2 years | 50% | P250,000 |
| 3 years | 50% | P250,000 |
| 4 years | 50% | P250,000 |
| 5 years | 50% | P250,000 |
| 6 years | 55% | P275,000 |
| 7 years | 60% | P300,000 |
| 8 years | 65% | P325,000 |
| 9 years | 70% | P350,000 |
| 10 years | 75% | P375,000 |
| 11 years | 80% | P400,000 |
| 12 years | 85% | P425,000 |
| 13+ years | 90% (max) | P450,000 |

**Who currently does this:**
- Real estate lawyers (DHSUD/HSAC proceedings): compute CSV to verify if developer's offer is correct
- DHSUD Regional Offices: adjudicate CSV disputes; buyers may file without lawyers but rarely do
- Developer legal departments: compute CSV to determine minimum exposure on cancellations
- Buyers themselves: almost never — most accept whatever refund developers offer without verification

**Rough market size:**
- Residential building permits issued in 2024: 116,427 units (PSA data)
- Residential real estate market: estimated 150,000–250,000 installment units sold annually (subdivision lots, condominiums, house-and-lot packages on installment terms under PD 957)
- Philippines housing backlog: 6.7 million units (DHSUD 2021), with large informal financing component
- Contract defaults/cancellations: Industry estimates suggest 15-25% of installment contracts eventually cancel (market observation; developers report high cancellation rates in pre-selling)
- Conservative estimate of CSV computation events: 20,000–50,000 per year (defaults/cancellations where CSV is in play)
- Grace period computation events: 30,000–80,000 per year (buyers invoking grace period rights before cancellation)
- Total affected population: Millions of Filipinos currently carrying residential installment contracts

**Professional fee range:**
- DHSUD/HSAC complaint filing: varies by claim size (HSAC fee calculator at hsac.gov.ph)
- Lawyer acceptance fee for Maceda Law complaint: P15,000–P50,000+ (based on general real estate litigation rates)
- Lawyer appearance fees: P3,000–P5,000 per hearing
- Total legal spend for a contested CSV refund: P30,000–P100,000+ including filing fees
- For a buyer who paid 3 years of installments on a P3M property (total paid ~P900,000), a Maceda CSV would be P450,000 — worth hiring a lawyer for, but the computation itself is trivial

**Pain indicators:**
- Developers routinely issue CSV refunds below the statutory floor — buyers accept because they don't know the formula
- Many cancellation notices are served informally (verbal, text message) without the required notarial act — buyers don't know this makes the cancellation legally defective
- Art. 6 voiding clause is widely unknown — buyers sign contracts waiving Maceda rights and believe them enforceable
- PD 957 and RA 6552 overlap creates confusion: buyers of PD 957 projects get dual protection but don't know which applies
- Maceda Law does NOT apply to: (a) bank financed purchases (loan fully paid developer; bank relationship is different), (b) industrial lots, (c) commercial buildings — buyers frequently don't know if they're covered
- DHSUD has adjudicatory jurisdiction but backlog is significant; buyers without lawyers struggle to navigate the process

**Computability assessment:** Fully deterministic (5/5). The law is explicit: inputs = total payments + years of installment; output = exact CSV peso amount. No judicial discretion is involved in the formula itself (only in whether cancellation was properly effected, which is a procedural binary check, not a judgment call).

**Opportunity score (preliminary):**
- Market size: 3/5 (20K–80K contested events/year; millions in latent demand for "check my CSV")
- Moat depth: 4/5 (buyers systematically unable to verify CSV without professional help; information asymmetry is the moat, not legal complexity)
- Computability: 5/5 (fully deterministic statutory formula)
- Pain: 4/5 (real money at stake — P100K–P500K+ per buyer; developer power imbalance; no free verification tool exists)

---

### Domain 2: Maceda Cancellation Validity Checker

**Description:** For a developer to legally cancel a Maceda-covered installment contract, it must follow an exact procedural sequence that is binary (either done or not done). Many cancellations in the Philippines are procedurally defective, meaning the buyer is still legally entitled to the property or has stronger rights than they know. Checking cancellation validity is a pure decision-tree traversal across statutory requirements.

**Governing sections:**
- RA 6552 Sec. 3(b) — Cancellation requirements for 2+ year buyers:
  1. Notice of cancellation/demand for rescission must be by **notarial act**
  2. Effective only after **30 days** from buyer's receipt of the notarial notice
  3. Effective only after **full payment of CSV** to the buyer before or at the 30-day deadline
- RA 6552 Sec. 4 — For <2 year buyers: 60-day written notice; no CSV required
- RA 6552 Sec. 5 — Right to sell or assign rights to a third party (developer cannot unreasonably restrict)
- RA 6552 Sec. 6 — Waiver clauses in contract are void

**Computation sketch:**

```
DECISION TREE (Sec. 3(b) cancellation validity):

INPUT: Buyer profile + cancellation notice facts

QUESTION 1: Has buyer paid 2+ years of installments?
  NO  → Apply Sec. 4 rules (60-day written notice; no CSV)
  YES → Continue

QUESTION 2: Was the cancellation notice by notarial act?
  NO  → Cancellation is INVALID. Buyer may continue paying or seek reinstatement.
  YES → Continue

QUESTION 3: Has 30 days elapsed from buyer's receipt of notarial notice?
  NO  → Cancellation not yet effective; buyer may still invoke grace period within window
  YES → Continue

QUESTION 4: Was full CSV paid to buyer before/at the 30-day deadline?
  NO  → Cancellation is INVALID despite notice. Buyer retains rights under contract.
  YES → Cancellation is legally valid.

ADDITIONAL CHECKS:
- Was notice served at buyer's last known address? (Sec. 3(b) procedural requirement)
- Did buyer invoke grace period before notice? (1 month/year, max once per 5 years)
- Does contract contain a void waiver clause that developer is relying on?
```

**Who currently does this:** Lawyers representing buyers who suspect their cancellation was improper; DHSUD adjudicators reviewing complaints; developer legal teams assessing exposure before filing cancellation notices.

**Rough market size:** Subset of Domain 1 — ~10,000–30,000 cancellation events annually where validity is in question. Most buyers accept cancellations without checking; those who do check almost always need a lawyer.

**Professional fee range:** Bundled with Domain 1 — the same lawyer handling a CSV refund claim typically also checks cancellation validity. The incremental fee is zero (it's part of the same case analysis), but the combined case is worth P30,000–P100,000+ in professional fees.

**Computability assessment:** Fully deterministic (5/5). Every step is a binary check: was the notice notarized? was CSV paid? did 30 days elapse? These are factual questions with binary answers, not legal judgments.

**Pain indicators:**
- Most buyers who receive a cancellation notice — even defective ones — simply vacate the property; they do not know their rights
- Developers leverage their legal sophistication gap to effect improper cancellations without CSV payment
- Reinstatement of a cancelled contract requires DHSUD complaint and multi-month proceedings

**Opportunity score (preliminary):**
- Market size: 2/5 (10K–30K events where validity is contested)
- Moat depth: 4/5 (buyers have no way to check validity without lawyer review)
- Computability: 5/5 (binary decision tree)
- Pain: 5/5 (defective cancellation means buyer has lost their home/lot without legal basis; extremely high stakes)

---

### Domain 3: Maceda Coverage Eligibility Checker

**Description:** Before computing a CSV or checking a cancellation, buyers need to know whether RA 6552 applies to their transaction at all. The coverage rules have several exclusions and common misunderstandings (e.g., bank-financed purchases, commercial properties). This is a pre-computation eligibility filter.

**Governing sections:**
- RA 6552 Sec. 3 — Covers: sale or financing of real estate on installment payments; includes residential condominium apartments
- RA 6552 Sec. 3 (exclusions) — Excludes: industrial lots, commercial buildings, sales to tenants under RA 3844
- Case law clarification: If buyer obtained a bank loan and used it to pay the developer in full, the bank's mortgage is NOT covered by Maceda — different statute (bank loan = financial institution, different rules)
- PD 957 Sec. 23 — Complementary coverage: applies to all PD 957-registered subdivision/condominium projects (broader coverage, different remedy)

**Computation sketch:**
```
INPUTS: Property type, payment structure, developer registration status

Q1: Is the property residential (house, condo, townhouse, subdivision lot)?
  YES → Potential Maceda coverage
  NO (industrial lot, commercial building) → NOT covered

Q2: Is the payment directly to the developer/seller in installments?
  YES → Maceda applies
  NO (lump-sum bank loan paid to developer; buyer owes bank) → Maceda does NOT apply to bank
  Note: Pag-IBIG and SSS housing loans that directly amortize to developer ARE covered

Q3: Is the sale under a PD 957-registered project?
  YES → BOTH PD 957 and RA 6552 protections apply (buyer may choose stronger remedy)
  NO → Only RA 6552 applies (if residential installment)

OUTPUT: Coverage determination + applicable statutes + recommended remedies
```

**Computability assessment:** Fully deterministic (5/5). The eligibility check is a simple decision tree with binary inputs.

**Opportunity score (preliminary):**
- Market size: 3/5 (same pool of installment buyers)
- Moat depth: 3/5 (lawyers provide this as part of case intake; moderate DIY potential)
- Computability: 5/5 (binary decision tree)
- Pain: 3/5 (confusion is real but resolving eligibility is just step 1)

---

## Domains NOT Identified as Automation Candidates

**PD 957 project compliance (developer side):** Registration of subdivision/condominium projects, license to sell, development plan approvals — these require DHSUD administrative processing and site inspections. Not computable.

**Fair market value determination for CSV base:** The law uses "total payments made" (not FMV or appraised value) as the CSV base — this is a factual figure from payment receipts, not a valuation exercise. No judgment required.

**Interest on CSV refunds:** CSV refund amounts per Sec. 3(b) do not earn statutory interest under the Maceda Law itself. However, if a developer refuses to pay and buyer files a DHSUD complaint, legal interest at 6% p.a. (BSP Circ. 799/Nacar framework) may be awarded from the date of demand — this is handled by the civil-code-obligations interest computation engine (already identified as a high-priority domain).

---

## Summary Table

| Domain | Governing Sections | Computability | Market Size | Moat | Pain | Priority |
|--------|-------------------|---------------|-------------|------|------|----------|
| CSV Calculator | RA 6552 Sec. 3(b) | 5/5 | 3/5 | 4/5 | 4/5 | **HIGH** |
| Cancellation Validity Checker | RA 6552 Sec. 3(b)/4/5 | 5/5 | 2/5 | 4/5 | 5/5 | **MEDIUM-HIGH** |
| Coverage Eligibility Checker | RA 6552 Sec. 3, PD 957 | 5/5 | 3/5 | 3/5 | 3/5 | **MEDIUM** |

---

## Key Insight: The Information Asymmetry Moat

Unlike other domains in this survey where the moat is technical complexity (e.g., multi-factor payroll premiums, ACP/CPG liquidation), the Maceda Law moat is **pure information asymmetry**. The formula itself is simple enough to put on a napkin — it's a single percentage table with a floor and a cap. The moat exists because:

1. Buyers have never heard of the formula and are told by developers they have no rights
2. Developers' standard contracts include void waiver clauses that buyers believe are enforceable
3. Cancellation notices arrive via text message or informal letters — buyers don't know this is legally defective
4. The cost of verifying your CSV (hiring a lawyer for P30K-P100K) is often disproportionate to small balances

This is the **strongest consumer empowerment use case** in the survey. A free public-facing tool (not even requiring a subscription) that tells a Filipino installment buyer "You paid P450,000 over 3 years. If the developer cancels, they owe you P225,000 — and that cancellation notice you received via text is legally invalid" would be genuinely transformative.

The monetization path: the free computation tool is the top of the funnel. The paid product is DHSUD complaint preparation, demand letter drafting, and settlement negotiation support.

**Comparable:** "This is like the inheritance engine but for real estate installment buyers." Just as heirs don't know their legitime fractions, buyers don't know their CSV percentages. Just as lawyers charge P50K-200K to compute what the Civil Code already defines, real estate lawyers charge P30K-100K to compute what RA 6552 already specifies.

---

## New Aspects Discovered

No new Wave 1 aspects. The Maceda Law is self-contained; its interaction with the civil-code-obligations legal interest domain (for overdue CSV refunds) and with the penalty clause domain (Art. 1229 reduction for developer penalty clauses) is already captured in prior analyses.
