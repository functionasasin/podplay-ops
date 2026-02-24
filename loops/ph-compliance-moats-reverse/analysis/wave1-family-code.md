# Wave 1 Analysis: Family Code (EO 209)

**Aspect**: family-code
**Source**: Executive Order No. 209 (Family Code of the Philippines), effective August 3, 1988
**Analyzed**: 2026-02-24

---

## Source Overview

The Family Code governs property relations, support obligations, and dissolution procedures for Philippine marriages. The most computation-heavy provisions are concentrated in:

- **Title IV**: Property Relations Between Spouses (Art. 74–148)
  - Chapter 1: General Provisions (Art. 74–81) — property regime selection, prenuptial agreements
  - Chapter 2: Donations by Reason of Marriage (Art. 82–87)
  - Chapter 3: System of Absolute Community (Art. 88–104)
  - Chapter 4: Conjugal Partnership of Gains (Art. 105–133)
  - Chapter 5: Separation of Property of the Spouses (Art. 134–142)
- **Title VIII**: Support (Art. 194–208)
- **Title I**: Marriage — Art. 43, 49–52 (property effects of annulment/nullity)
- **Title II**: Legal Separation — Art. 63 (property effects, forfeiture of net profits)

**Note**: Estate tax and succession distribution are already covered by sibling loops (estate-tax-reverse, inheritance-reverse). This analysis focuses on the *inter vivos* property regime mechanics and support obligations.

---

## Domain 1: Marital Property Liquidation (ACP / CPG)

### Description
When a marriage dissolves (death, annulment, declaration of nullity, legal separation), the marital property regime must be formally liquidated per a statutorily mandated algorithm. This applies to ~4–5 million existing marriages and every future marriage dissolution.

### Governing Law
- **ACP Liquidation**: Family Code Art. 102 (inter vivos dissolution), Art. 103 (death of spouse)
- **CPG Liquidation**: Art. 129 (inter vivos), Art. 130 (death)
- **Annulment/Nullity**: Art. 43, 49–52
- **Legal Separation**: Art. 63

### Computation Sketch — ACP (Art. 102)

The statute defines a precise 4-step algorithm:

1. **Inventory**: Catalog all community property AND all exclusive property of each spouse separately
2. **Debt payment**: Pay all debts and obligations of the community from community assets; if insufficient, spouses are solidarily liable for the balance from their exclusive property (proportionally per Art. 94)
3. **Return exclusives**: Deliver remaining exclusive property of each spouse back to each of them
4. **Equal split**: Divide the **net remainder** of community property equally (50/50) between spouses — unless the marriage settlement specified a different proportion

**Art. 103 adds**: If a spouse dies, liquidation must occur within **6 months** of death. Failure makes any subsequent disposition of community property **void**. A subsequent remarriage without liquidation triggers mandatory complete separation of property for the new marriage.

### Computation Sketch — CPG (Art. 129)

Eight-step procedure:
1. Inventory all CPG property AND exclusive property of each spouse
2. Return administration costs charged to CPG
3. Pay CPG obligations and debts
4. Pay debts owed to each spouse for amounts they advanced to CPG
5. Return exclusive property remaining to each spouse
6. Determine the **net remainder** = CPG assets minus all above
7. Half of net remainder goes to each spouse as their share of **net gains**
8. Deliver each spouse's share

**Key difference from ACP**: CPG only shares the *gains* during marriage; pre-marital property stays exclusive. This makes classification (Domain 2 below) critical before liquidation.

### Who Currently Does This
- Family law attorneys handle annulment/legal separation cases (P100K–600K lawyer fees per case)
- Estate lawyers handle post-death liquidation as part of estate settlement (P50K–200K)
- In extrajudicial settlements, parties often rely on lawyers to draft the liquidation agreement

### Market Size
- **371,825 marriages registered in 2024** — each one creates a property regime that will eventually need liquidation (at death or dissolution)
- **~10,000 annulment petitions per year** (OSG data, growing from 4,520 in 2001 to 11,135 in 2014)
- **~55,000–65,000 deaths of married Filipinos per year** (estimated from PSA mortality data) requiring post-death liquidation
- **Stock**: ~4–5 million existing marriages, all of which will eventually trigger liquidation

### Professional Cost Range
- Annulment (uncontested): P160,000–P540,000 total; attorney's fees alone P100,000–P400,000
- Contested annulment with property division: P500,000–P1,000,000+
- Estate settlement component: P50,000–P200,000 for a lawyer to compute and draft liquidation

### Computability Assessment
**Fully deterministic** — once an inventory of all assets and debts is compiled with their classification (exclusive vs. community), the liquidation algorithm is mechanical:
- Sum all community assets
- Subtract all community debts
- Divide net remainder 50/50

The hard part is *classification* (Domain 2 below), not the liquidation math itself. A tool that guides users through asset classification and then runs the 4-step algorithm would replicate 80%+ of what lawyers do in uncontested cases.

### Pain Score: 5/5
- Multi-step process most people have never done
- Failure to liquidate within 6 months renders dispositions **void** (Art. 103) — high-stakes deadline
- Classification of community vs. exclusive property for installment purchases (Art. 118), improvements, and mixed-funding scenarios is confusing without guidance
- Lawyers charge P100K–600K for a largely formulaic process
- Many surviving spouses don't know they must liquidate within 6 months — a compliance time-bomb

---

## Domain 2: Conjugal Property Classification Engine

### Description
Before liquidation can occur, each asset must be classified as: (a) community property / conjugal property, or (b) exclusive property of Spouse A or Spouse B. The classification rules are statute-defined but complex, especially for installment purchases, mixed-funding improvements, and inherited/donated property received during marriage.

### Governing Law
- **ACP exclusions**: Art. 92 — property acquired by gratuitous title (inheritance, donation), property for personal/exclusive use, property acquired before marriage
- **ACP inclusions**: Art. 91 — everything not excluded (including pre-marital property under ACP, unlike CPG)
- **CPG exclusive property**: Art. 109 — property brought into marriage, acquired by gratuitous title during marriage, acquired by redemption of exclusive property, personal belongings
- **CPG conjugal property**: Art. 117 — acquired by onerous title during marriage, fruits/income from both exclusive and conjugal property, enterprise jointly managed, improvements on exclusive property using conjugal funds
- **Installment purchases**: Art. 118 — property bought on installment: if ownership vested before marriage → exclusive but conjugal funds advanced must be reimbursed; if ownership vested during marriage → conjugal/community but advance from exclusive funds must be reimbursed
- **Improvements**: Art. 120 — improvement on exclusive property using conjugal funds: ownership goes to owner of the land, but conjugal partnership is reimbursed the cost of improvement at liquidation

### Computation Sketch

For each asset, the engine asks:
1. When was it acquired? (before/during marriage)
2. What type of acquisition? (onerous purchase, inheritance, donation, exchange)
3. What funds were used? (exclusive, conjugal, mixed)
4. If mixed-funding, compute the reimbursement: conjugal funds advanced → create a reimbursement claim; exclusive funds advanced → create a reimbursement claim

For Art. 118 installment case:
- Input: Purchase price, installments paid before marriage, installments paid during marriage, funding source per installment period
- Output: Classification (exclusive or conjugal) + reimbursement obligation to the other party

For Art. 120 improvement:
- Input: Land value before improvement, cost of improvement, funding source
- Output: Ownership stays with land owner; conjugal claim = cost of improvement (not appreciation, not proportional share of increase)

### Who Currently Does This
Family lawyers and accountants in annulment/estate proceedings. In contested annulments, this becomes the primary battleground, multiplying legal fees significantly.

### Market Size
Same as Domain 1 — every dissolution requires classification first. The ~10,000 annulment cases per year and ~55,000+ post-death liquidations per year all need classification.

### Professional Cost Range
Embedded in annulment/estate settlement fees. Contested property classification disputes can add P200,000–500,000+ to annulment costs.

### Computability Assessment
**Mostly deterministic** — the classification rules are statute-defined decision trees. Edges cases exist (disputed improvements, mixed-source installments) but the core logic is deterministic. A questionnaire-driven tool could classify 85–90% of typical Philippine middle-class marriage assets correctly:
- Lot purchased before marriage → exclusive
- House built on the lot during marriage using conjugal funds → lot stays exclusive, house/improvement → conjugal owns the cost (Art. 120 reimbursement claim)
- Condo bought on installment, 30% down before marriage, 70% amortized during marriage → conjugal property because ownership vested during marriage, but exclusive estate is owed the 30% down payment (Art. 118)

### Pain Score: 4/5
- Classification errors cause disputes and litigation
- Art. 118 installment rule is poorly understood even by many lawyers
- Standard middle-class scenario (lot + house on installment) involves Art. 118/120 interaction, which most spouses cannot compute unassisted

---

## Domain 3: Child/Spousal Support Calculator

### Description
When spouses separate or are unmarried co-parents, support must be determined and enforced. Art. 194–208 defines what support covers and the proportionality rule, but leaves the amount to judicial discretion.

### Governing Law
- **Art. 194**: Definition of support (food, shelter, clothing, medical, education, transportation — including tertiary education)
- **Art. 195**: Who is obliged (spouses, parents↔children, ascendants↔descendants, siblings)
- **Art. 199**: Order of obligors when there are multiple persons bound to give support
- **Art. 200**: Multiple obligors — share **in proportion to their resources**; multiple recipients — priority order with child over spouse
- **Art. 201**: Amount proportional to giver's **resources/means** AND recipient's **necessities**
- **Art. 202**: Support reduced/increased proportionally when resources or necessities change
- **Art. 203**: Support demandable from date of **judicial or extrajudicial demand**

### Computation Sketch

No fixed formula in statute. Courts apply a proportionality framework:
- **Payer capacity**: Net monthly income (gross minus taxes, mandatory deductions), other dependents, other obligations
- **Recipient needs**: Documented monthly expenses (school fees, food, rent/utilities, medical, clothing, transportation)
- **Both parents' share**: If both parents have means, each contributes proportionally (Art. 200) — if Parent A earns P80K/month and Parent B earns P20K/month, Parent A bears 80% of support and Parent B bears 20%
- **Common court practice**: Provisional support often set at ~20–35% of payer's net income as a starting point, with adjustments based on documented needs

### Who Currently Does This
- Family lawyers (P50K–300K for legal separation cases)
- PAO (free for indigent clients)
- Barangay mediation (free, but non-binding for significant amounts)

### Market Size
- Difficult to quantify — not all separated couples go to court for support
- ~10,000+ annulment cases per year include support component
- Unknown number of extrajudicial support agreements among separated/OFW families
- Potentially 500,000–1M+ Filipinos in de facto separation situations needing support guidance

### Professional Cost Range
P50,000–300,000 for legal separation proceedings; P30,000–100,000 for standalone support petition in Family Court

### Computability Assessment
**Partially deterministic** — the *framework* is statute-defined (proportionality of means and needs) but the *amount* requires evidence and judicial discretion. A calculator could:
- Guide users through documenting needs (line-item expense worksheet)
- Compute each parent's proportional share (Art. 200) based on declared incomes
- Show a range based on Philippine court practice (20–35% of net income)
- Flag changes triggering Art. 202 modification (income change, new dependent, major expense)

The tool's output would be advisory/negotiating reference — not a definitive figure — because the statute deliberately avoids fixing a formula. This limits computability vs. Domains 1 and 2.

### Pain Score: 3/5
- Process is confusing but free/low-cost options (barangay mediation, PAO) exist
- Core computation is proportionality, which is intuitive
- Main friction is enforcement, not computation (RA 9262 enforcement mechanisms, garnishment)
- Lower pain score because many Filipinos handle this informally

---

## Domain 4: Legal Separation — Forfeiture of Net Profits (Guilty Spouse)

### Description
Under Art. 63 (effects of legal separation decree), the offending spouse **forfeits their share of the net profits** earned by the community property or conjugal partnership. These forfeitures go to the common children, or if none, to the innocent spouse. This creates a specific computation: what are the net profits of the marital property regime attributable to the marriage period?

### Governing Law
- **Art. 63(2)**: Forfeiture of guilty spouse's share of net profits
- **Art. 43(2)**: Same rule applies to bad-faith spouse in void/voidable marriages
- **Art. 102/129**: Net profits = final net assets minus the value of properties each spouse brought into marriage (their initial capital)

**Net profits formula (derived from Art. 102/129)**:
```
Net Profits = (Community Assets at Dissolution) - (Community Debts) - (Initial Capital of Guilty Spouse at Marriage Start)
Guilty Spouse's Forfeited Share = 50% of Net Profits (their normal entitlement, now forfeited)
```

This means the forfeiture computation requires:
1. Inventory of all assets at dissolution (same as Domain 1)
2. Inventory of all debts
3. Documentation of each spouse's **initial capital** (value of property they brought into the marriage)
4. Compute net remainder
5. Identify the "net profits" = net remainder minus total initial capital of both spouses
6. The guilty spouse's 50% share of net profits is forfeited

### Computability Assessment
**Fully deterministic** — once inputs are gathered, the formula runs mechanically. The challenge is documenting the initial capital at marriage start (requires historical asset valuations), which is a data-gathering problem, not a computation problem.

### Market Size
Subset of ~10,000 legal separation + annulment cases per year where one spouse is the "guilty/bad faith party."

### Pain Score: 3/5
- Complex enough to require a lawyer but limited to contested cases
- Lower standalone market size (subset of annulment/legal separation cases)

---

## Summary Table

| Domain | Computability | Market Size | Pro Cost | Pain | Notes |
|--------|--------------|-------------|----------|------|-------|
| ACP/CPG Liquidation | Fully deterministic | Large (all dissolutions) | P100K–600K | 5/5 | Best opportunity |
| Property Classification | Mostly deterministic | Large (same as above) | Embedded | 4/5 | Prerequisite to liquidation |
| Support Calculator | Partially deterministic | Very large (500K+) | P30K–300K | 3/5 | Framework only; no fixed formula |
| Net Profits Forfeiture | Fully deterministic | Medium (subset of dissolutions) | Embedded | 3/5 | Limited standalone market |

---

## Top Opportunity: ACP/CPG Liquidation + Classification Combined

The most compelling opportunity is a **Marital Property Settlement Engine** that:

1. **Classifies each asset** using the Art. 91/92 (ACP) or Art. 109/117/118/120 (CPG) decision tree
2. **Computes reimbursement claims** for mixed-funding situations (Art. 118 installments, Art. 120 improvements)
3. **Runs the Art. 102/129 liquidation algorithm**: inventory → debt payment → return exclusives → 50/50 split
4. **Produces a draft liquidation agreement** formatted for signing and notarization
5. **Tracks the Art. 103 6-month deadline** post-death and alerts surviving spouses

**Inputs**: Marriage date, regime (ACP default post-1988, or CPG if prenup), list of each asset with acquisition date/method/funding source, list of all debts, each spouse's initial capital at marriage

**Outputs**:
- Classified asset list (community vs. exclusive)
- Reimbursement claims between spouses
- Net community estate amount
- Each spouse's total share (exclusive + 50% of net community)
- Draft extrajudicial settlement agreement

**This is inheritance but for living marriages**: The Civil Code / Family Code defines the exact arithmetic. Lawyers charge P100K–600K to do this math. The statute literally specifies the 4-step algorithm in Art. 102/129.

---

## Discovered Aspects for Frontier

None warranting a separate aspect — the key Family Code computational domains are covered between this analysis and the estate/inheritance sibling loops.

Note: **RA 8552 (Domestic Adoption Act)** and **RA 9262 (VAWC)** mentioned in the aspect brief are not computation-heavy and do not yield automatable domains. Adoption is primarily a procedural eligibility determination; RA 9262 protective orders involve judicial discretion, not statutory formulas.
