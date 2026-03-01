# Analysis Notes: eight-percent-option

**Aspect:** eight-percent-option
**Wave:** 2 (Domain Rules Extraction)
**Analyzed:** 2026-03-01
**Sources used:** input/sources/nirc-section-24a.md, input/sources/rr-8-2018-summary.md, input/sources/worked-examples.md

---

## Key Findings

### Eligibility Rules (8 conditions, all must be met)
1. Individual (natural person)
2. Self-employment or mixed income
3. Gross + non-operating income ≤ ₱3,000,000
4. NOT VAT-registered
5. NOT a GPP partner (for GPP distributive share)
6. Only Section 116 percentage tax applies (not Sec. 117-128)
7. NOT BMBE tax-exempt
8. Election made on Q1 1701Q (or at registration, or on Q1 2551Q NIL)

### Election Methods (6 methods)
- A: At registration (Form 1901)
- B: Initial Q1 1701Q (new registrant)
- C: Initial Q1 2551Q NIL with notation (new registrant)
- D: Form 1905 before Q1 2551Q deadline + Q1 1701Q (existing taxpayer, preferred)
- E: Q1 1701Q Item 16 = Option B (existing taxpayer)
- F: Q1 2551Q NIL with exact notation + Q1 1701Q (existing taxpayer)

Exact notation text: "Availing of 8% Income Tax Rate Option for Taxable Year [YEAR]"

### ₱250,000 Deduction Rules
- Applies ONLY to purely self-employed (no compensation income)
- Does NOT apply to mixed-income earners (even if taxable compensation < ₱250K)
- Applied at CUMULATIVE quarterly level (not freshly each quarter)
- Results in MAX(0, cumulative_gross - 250,000) × 8% at each quarterly filing

### Irrevocability
- Irrevocable for entire taxable year once Q1 is filed with 8% election
- Does NOT carry over to next year; must re-elect each year
- Exception: mid-year breach auto-disqualifies (not taxpayer's choice)

### Mid-Year Breach (very important workflow)
- Breach: cumulative gross + non-op > ₱3M
- Auto-disqualifies 8% option for ENTIRE year (retroactive)
- Required actions: Form 1905 in following month, retroactive 3% PT, recompute annual under graduated, credit 8% payments
- Annual form must be 1701 (not 1701A) in breach year

### Non-Operating Income in Threshold
- Included: business bank interest, rental of business assets, royalties, gain on business asset sales
- Excluded: passive income with FWT (savings interest, dividends, prizes) — already final-taxed

### Percentage Tax Interaction
- Under 8%: PT waived entirely
- This is the PRIMARY advantage over Path B (OSD): no 3% PT = saves 3% of gross
- At ₱1M gross: saves ₱30,000 vs Path B

---

## Files Created/Updated

### NEW FILES
- `final-mega-spec/domain/lookup-tables/eight-percent-option-rules.md` — 14-part comprehensive reference:
  - Part 1: Eligibility matrix (8 conditions)
  - Part 2: Ineligibility triggers (18 codes IN-01 to IN-18)
  - Part 3: Election procedures (3A new registrant, 3B existing taxpayer; 6 methods)
  - Part 4: Irrevocability rules (7 rules)
  - Part 5: ₱250K deduction rules (5A: applies, 5B: does not apply)
  - Part 6: Gross receipts and non-operating income definitions (tables)
  - Part 7: Mid-year breach procedure (steps 1-7 + pseudocode)
  - Part 8: VAT reversion rules
  - Part 9: Filing obligations table (complete)
  - Part 10: Quarterly mechanics (detailed formulas for pure SE and mixed income)
  - Part 11: Worked examples (5 examples covering all key scenarios)
  - Part 12: Percentage tax interaction
  - Part 13: Sales returns/allowances/discounts
  - Part 14: Validation invariants (10 invariants: 8PCT-V01 to 8PCT-V10)

- `final-mega-spec/domain/decision-trees.md` — 7 decision trees (DT-01 to DT-07):
  - DT-01: 8% eligibility (full 8-node tree to leaf)
  - DT-02: Election procedure (new vs existing; 6 election methods)
  - DT-03: Mid-year threshold breach handling (6 required actions)
  - DT-04: Annual filing form selection (1701 vs 1701A)
  - DT-05: ₱250K deduction applicability
  - DT-06: Form 2551Q obligation
  - DT-07: Regime recommendation overview (full tree planned for regime-comparison-logic)

### UPDATED FILES
- `final-mega-spec/domain/computation-rules.md`:
  - CR-023: Election procedure rules (pseudocode for window check, annual re-election check)
  - CR-024: Mid-year breach recomputation pseudocode (full struct types, step-by-step algorithm, worked example)
  - CR-025: Sales returns/allowances/discounts — net gross receipts definition + reimbursements edge case
  - Updated cross-references section to point to new decision-trees.md and eight-percent-option-rules.md

- `final-mega-spec/domain/edge-cases.md`:
  - EC-8-01: Zero-tax filing still required (gross exactly ₱250K)
  - EC-8-02: Q1 gross below ₱250K (quarterly tax = ₱0 but filing still required)
  - EC-8-03: Breach occurs in Q1 (very high first-quarter income)
  - EC-8-04: Mixed income, taxable comp below ₱250K (unused portion forfeited)
  - EC-8-05: Attempted late election after Q1 filed under graduated
  - EC-8-06: Non-operating income pushes total above ₱3M
  - EC-8-07: GPP partner with separate sole proprietorship
  - EC-8-08: Mid-year registrant (not January 1) — full ₱250K deduction still applies
  - EC-8-09: Excess CWT credits exceed 8% tax (refund vs carry-over)
  - EC-8-10: Sales returns reduce net gross below ₱250K
  - EC-8-11: Approaching ₱3M threshold — proactive warnings with 4-tier threshold proximity table

---

## New Aspects Discovered

No new aspects discovered in this analysis — the 8% option rules were well-documented in existing sources. The decision-trees.md stub at the end lists future trees needed (DT-08 through DT-15) that will be created by their respective Wave 2 aspects.
