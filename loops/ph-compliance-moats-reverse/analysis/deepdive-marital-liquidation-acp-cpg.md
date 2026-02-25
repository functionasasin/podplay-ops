# Deep Dive: Marital Property Liquidation Engine (ACP / CPG)

**Domain:** ACP/CPG Liquidation — Family Code Art. 102 / Art. 129
**Date:** 2026-02-24
**Status:** HIGH priority candidate

---

## What It Is

When a Philippine marriage ends — by death, annulment, declaration of nullity, or legal separation — the marital property regime must be formally liquidated. This means: inventory everything, classify it, pay the debts, return what belongs to each spouse individually, and split the remainder.

The Family Code defines the exact algorithm. The Supreme Court has affirmed it repeatedly. Lawyers charge ₱100,000–₱600,000 to execute it. The arithmetic is not complex — it's a 4-step process defined by statute. The moat is almost entirely information asymmetry: most Filipinos have no idea the process exists, let alone how to run it.

---

## The Two Regimes

Filipino marriages fall into one of two default property regimes depending on when they married:

**Absolute Community of Property (ACP)** — default for all marriages celebrated on or after August 3, 1988 (effectivity of the Family Code). Everything acquired before AND during marriage is pooled into a single community estate, unless explicitly excluded.

**Conjugal Partnership of Gains (CPG)** — governed marriages before August 3, 1988, or any marriage after that date with a prenuptial agreement electing CPG. Only *gains* (property acquired through onerous title during the marriage) are conjugal. Pre-marital property stays exclusive.

Either regime can be overridden by a prenuptial agreement. But most Filipinos — particularly those without significant pre-marital assets — have no prenup and default to ACP.

---

## ACP Liquidation (Art. 102) — The 4-Step Algorithm

```
STEP 1: INVENTORY
  List all assets:
  - Community assets (everything that isn't excluded under Art. 92)
  - Exclusive property of Spouse A
  - Exclusive property of Spouse B

  ACP exclusions (Art. 92 — stays exclusive, NOT pooled):
  - Property acquired by inheritance or donation addressed to one spouse
  - Property for personal/exclusive use (clothing, personal effects)
  - Property acquired before marriage that is excluded under a marriage settlement

STEP 2: PAY DEBTS
  From community assets, pay:
  - All obligations and debts of the community
  - Advances chargeable to the community
  If community assets are insufficient:
    → Spouses are solidarily liable for remaining debts
    → Each spouse's exclusive property absorbs proportional share of deficit

STEP 3: RETURN EXCLUSIVES
  Return each spouse's exclusive property to them, free from community claims
  (Note: reimbursement claims between the spouses and the community are settled here — see Art. 118/120 below)

STEP 4: SPLIT THE REMAINDER
  Net community estate (community assets minus debts) = divided 50/50
  Unless marriage settlement specified a different ratio

OUTPUT:
  Spouse A's total: exclusive property returned + 50% of net community
  Spouse B's total: exclusive property returned + 50% of net community
```

---

## CPG Liquidation (Art. 129) — 8-Step Algorithm

CPG is more complex because the computation requires knowing what each spouse *brought into* the marriage (their initial capital), since CPG only shares the gains, not the starting values.

```
STEP 1: INVENTORY
  List all property:
  - Conjugal assets (Art. 117 — acquired by onerous title during marriage,
    fruits/income from exclusive + conjugal property, jointly managed enterprises)
  - Exclusive property of each spouse (Art. 109 — brought into marriage,
    inherited/donated during marriage, bought with exclusive funds)

STEP 2: RETURN ADMIN COSTS
  Deduct amounts advanced by either spouse for conjugal administration costs

STEP 3: PAY CONJUGAL DEBTS
  Pay all conjugal obligations from conjugal assets

STEP 4: REIMBURSE ADVANCES BY SPOUSES
  If either spouse advanced personal/exclusive funds for conjugal purposes:
    → Conjugal estate owes them reimbursement

STEP 5: RETURN EXCLUSIVES
  Each spouse's exclusive property returned to them

STEP 6: NET REMAINDER
  Net conjugal estate = conjugal assets after all steps above

STEP 7: IDENTIFY NET GAINS
  Net Gains = Net Remainder minus each spouse's Initial Capital at marriage
  (Initial Capital = value of property each spouse brought into marriage)

STEP 8: SPLIT NET GAINS 50/50
  Each spouse gets: their exclusive property + 50% of net gains
```

The critical difference: in CPG, **initial capital is returned first**, and only the gains above that starting point are split. A spouse who brought ₱5M in property into the marriage gets that ₱5M back before the split. In ACP, everything goes into the pool and is split 50/50 regardless of who brought what.

---

## The Classification Problem (Prerequisites to Both Algorithms)

Before running either algorithm, every asset must be classified: community/conjugal or exclusive? This is where most of the complexity — and most of the lawyer time — lives.

The rules are statute-defined decision trees:

**Art. 118 — The Installment Rule:**
> Property bought on installment before and during marriage.

```
KEY QUESTION: When did ownership vest?
  → Ownership vested BEFORE marriage (full purchase price paid, or deed executed):
     → Exclusive property of the buying spouse
     → BUT: conjugal/community funds paid on installments DURING marriage
            → create a REIMBURSEMENT CLAIM by the conjugal estate
  
  → Ownership vested DURING marriage (final payment / deed of absolute sale):
     → Community/conjugal property
     → BUT: exclusive funds paid BEFORE marriage as down payment
            → create a REIMBURSEMENT CLAIM by the buying spouse's estate
```

The practical middle-class scenario: House-and-lot purchased on bank amortization. Couple paid 20% down before marriage from the future husband's savings, then amortized the remaining 80% during the marriage from their joint income. The property is conjugal (ownership vested during marriage via deed of absolute sale), but the husband's estate is owed the 20% down payment as a reimbursement claim.

**Art. 120 — The Improvement Rule:**
> Improvements made on one spouse's exclusive property using conjugal funds.

```
OWNERSHIP: Stays with the owner of the land (exclusive property remains exclusive)
REIMBURSEMENT: Conjugal estate is owed the cost of the improvement
  (NOT the increase in value — just the actual cost of the improvement)
```

The practical scenario: Wife owns a lot inherited from her parents. During the marriage, they build a house on it using their joint savings. The lot stays the wife's exclusive property. But the conjugal estate has a reimbursement claim equal to the construction cost of the house.

---

## Use Case: The Surviving Spouse Who Doesn't Know She's on a Clock

> *Perla's husband Ben died in October 2024. They were married in 1995 (CPG regime — pre-Family Code marriage). They own: a house-and-lot in Parañaque (bought 2003, fully paid, titled in both names), a condo in Makati (bought 2015 on installment, amortization completed 2022, titled in Ben's name only), Ben's car (2019), Perla's car (2016), Ben's savings account (₱800,000), a joint savings account (₱1,200,000), and Ben's GSIS pension receivable.*
>
> *Ben's children from a prior relationship are asking Perla to sign an extrajudicial settlement. A lawyer quoted her ₱250,000 to handle the estate.*

What's actually happening here, step by step:

**Step 1 — She's on a 6-month deadline she doesn't know about.**
Art. 103 Family Code: if Perla doesn't liquidate the CPG within 6 months of Ben's death, *any disposition of community property (including the estate settlement) is void.* This clock started October 2024. She has until April 2025.

**Step 2 — CPG liquidation comes before inheritance.**
Ben's estate is not the entire list of assets above. Ben's *estate* is only his *share of the CPG net gains + his exclusive property*. The CPG must be liquidated first to determine what the estate even is.

**Step 3 — Classification of each asset:**

| Asset | Analysis | Classification |
|-------|----------|----------------|
| Parañaque house-and-lot (bought 2003) | Acquired by onerous title during marriage | **Conjugal** |
| Makati condo (amortization completed 2022, titled Ben) | Ownership vested during marriage → conjugal regardless of title | **Conjugal** |
| Ben's car (2019) | Bought during marriage, onerous title | **Conjugal** |
| Perla's car (2016) | Bought during marriage, onerous title | **Conjugal** |
| Ben's savings (₱800K) | Accumulated during marriage | **Conjugal** |
| Joint savings (₱1.2M) | Accumulated during marriage | **Conjugal** |
| GSIS pension | Mixed — earned during marriage but government-administered; portion vested before death may have different treatment | **Flag for review** |
| Ben's pre-1995 assets (if any) | Brought into marriage | **Ben's exclusive** |
| Perla's pre-1995 assets (if any) | Brought into marriage | **Perla's exclusive** |

**Step 4 — Hypothetical CPG computation:**

Assume: Ben's initial capital = ₱500,000 (pre-marital savings); Perla's initial capital = ₱200,000 (pre-marital jewelry).

```
Total conjugal assets:
  Parañaque house-and-lot: ₱8,000,000
  Makati condo: ₱4,500,000
  Ben's car: ₱800,000
  Perla's car: ₱600,000
  Ben's savings: ₱800,000
  Joint savings: ₱1,200,000
  TOTAL: ₱15,900,000

Conjugal debts: ₱0 (assumed fully paid)
Net conjugal estate: ₱15,900,000

Return exclusives:
  Ben: ₱500,000
  Perla: ₱200,000

Net gains (Art. 129 Step 7):
  ₱15,900,000 − ₱500,000 − ₱200,000 = ₱15,200,000

Each spouse's share of net gains: ₱7,600,000

Perla's total from CPG liquidation:
  ₱200,000 (exclusive) + ₱7,600,000 (half of net gains) = ₱7,800,000

Ben's share going into his estate:
  ₱500,000 (exclusive) + ₱7,600,000 (half of net gains) = ₱8,100,000
```

**Step 5 — Ben's estate = ₱8,100,000 (not ₱15,900,000)**

The estate that gets distributed to the heirs under the inheritance engine is ₱8,100,000, not the entire marital estate. If Ben's children from the prior relationship computed their shares based on the full ₱15.9M, they were off by nearly half.

**This is why the marital liquidation engine must precede the inheritance engine** — and why the two tools are complementary products in a legal tech stack.

---

## Why Lawyers Cost What They Cost (And Why It's Mostly Arithmetic)

A family lawyer in an uncontested estate/annulment case spends time on:
1. **Client interviews** to inventory assets — not billable computation, just data gathering
2. **Classifying each asset** — a decision tree (statute-defined)
3. **Computing each spouse's share** — 4–8 step statutory algorithm
4. **Drafting the liquidation agreement / deed of extrajudicial settlement** — document generation
5. **Coordinating notarization and registration** — administrative

Steps 2–4 are the ones being automated. Step 5 is administrative. Step 1 is what the user inputs. The legal judgment in a truly uncontested case is minimal — the law defines the classification rules and the liquidation algorithm. Lawyers charge ₱100,000–₱600,000 for the combination of document work + professional oversight.

An engine that does steps 2–4 and outputs a draft agreement doesn't replace the lawyer for contested cases or complex situations. But for the massive majority of uncontested estate settlements (where the parties agree on the asset list and just need the math done correctly), it changes the economics significantly.

---

## The Art. 103 6-Month Deadline — A Compliance Time Bomb

Every Filipino who loses a spouse is on a **6-month clock they almost certainly don't know about**.

Art. 103 Family Code:
> "Upon the termination of the marriage by death, the community property shall be liquidated in the same proceeding for the settlement of the estate of the deceased. If no judicial settlement proceeding is instituted, the surviving spouse shall liquidate the community property either judicially or extrajudicially within six (6) months from the death of the deceased spouse. If upon the lapse of the six-month period no liquidation is made, any disposition or encumbrance involving the community property of the terminated marriage shall be void."

**What this means in practice:**
- Surviving spouse cannot sell, mortgage, or transfer any community property after 6 months without liquidating first
- Real estate transactions on community property done without prior liquidation can be challenged as void
- Banks sometimes require proof of liquidation before releasing joint accounts to a surviving spouse
- The 6-month deadline is not widely known and is almost never communicated at the time of death

**The tool's role:** An alert layer — "your spouse died [date]. The Art. 103 liquidation deadline is [date + 6 months]. You have [X days] remaining."

---

## The Failing That Compounds Everything: Successive Marriages Without Liquidation

Art. 103 adds a further consequence: if a widowed spouse *remarries* before liquidating the prior marriage's community property, the new marriage is automatically on complete separation of property regime — no ACP, no CPG, regardless of preference. The undivided community property from the first marriage remains frozen until liquidation.

This creates the situation: remarried Filipino with assets technically still entangled in the first marriage's community estate, no one aware, and any property transactions during the second marriage potentially clouded.

The inheritance engine already handles the downstream effect (heirs from first and second marriages). The liquidation engine handles the upstream cause.

---

## Computation Decision Tree (Full)

```
INPUT:
  - Marriage date → determine default regime (ACP if ≥ Aug 3, 1988; CPG if earlier)
  - Prenuptial agreement? → may override regime or specify different split ratio
  - Dissolution event: death / annulment / nullity / legal separation
  - Inventory of all assets with:
    - Description
    - Acquisition date
    - How acquired (purchase, inheritance, donation, exchange)
    - Who paid / from what funds
    - Current fair market value
  - Inventory of all debts (community and exclusive)
  - Each spouse's initial capital at marriage (CPG only)

CLASSIFICATION ENGINE (per asset):
  IF regime = ACP:
    EXCLUDE if: inherited/donated to one spouse, personal use items, excluded by marriage settlement
    INCLUDE all else as community
    
  IF regime = CPG:
    EXCLUDE if: brought into marriage, inherited/donated during marriage, bought with exclusive funds
    INCLUDE if: bought during marriage with conjugal/mixed funds, fruits/income generated during marriage
    
  FOR installment purchases (Art. 118):
    → When did ownership vest?
    → Compute reimbursement claim for pre/during marriage installments
    
  FOR improvements (Art. 120):
    → Is the land exclusive or conjugal?
    → If exclusive land, improvement cost → reimbursement claim for conjugal estate

LIQUIDATION ALGORITHM:
  IF regime = ACP:
    1. Sum all community assets
    2. Subtract all community debts
    3. Return exclusives to each spouse
    4. Split net remainder 50/50 (or per settlement ratio)
    
  IF regime = CPG:
    1. Sum all conjugal assets
    2. Return admin cost reimbursements
    3. Subtract conjugal debts
    4. Return advances by spouses
    5. Return exclusives to each spouse
    6. Net conjugal estate
    7. Net gains = net estate minus total initial capital
    8. Split net gains 50/50

OUTPUT:
  - Asset classification list (community/conjugal vs. exclusive)
  - Reimbursement claims (Art. 118/120)
  - Each spouse's total share
  - If dissolution by death: flag which share becomes the decedent's estate
  - Art. 103 deadline alert if applicable
  - Draft extrajudicial settlement agreement structure
  - Inheritance engine input (decedent's share → feed into distribution)
```

---

## The Stack: Liquidation → Inheritance → Interest

The three tools form a natural pipeline:

```
EVENT: Death of married Filipino
  ↓
[Marital Liquidation Engine]
  Input: full asset inventory + classification
  Output: each spouse's share; decedent's share identified
  ↓
[Inheritance Distribution Engine]
  Input: decedent's gross estate (from liquidation output) + heirs
  Output: each heir's share, legitimes, free portion, testamentary dispositions
  ↓
[Estate Tax Engine]
  Input: gross estate, deductions, property regime (from liquidation)
  Output: estate tax due, BIR Form 1801
  ↓
[Legal Interest Engine]
  Input: any estate debts or claims with interest accrual
  Output: total obligation with interest periods
```

Each tool is independently useful. Together, they cover the entire Philippine death-of-married-person workflow — which currently costs ₱200,000–₱1,000,000+ in professional fees for a typical middle-class estate.

---

## Market Sizing

- ~55,000–65,000 married Filipinos die annually → each triggers Art. 103 liquidation
- ~371,000 new marriages per year → each one creates a future liquidation event
- ~10,000 annulment petitions per year → each requires liquidation as prerequisite to property division
- Stock of ~4–5 million existing marriages = eventual liquidation events
- A liquidation tool serving even 5% of death-triggered events = ~3,000 users/year at inception, growing with awareness

**Professional fee displacement:**
- Uncontested estate with liquidation: ₱100,000–₱350,000 lawyer fee
- If tool handles classification + algorithm + draft agreement: displaces majority of the billable work for uncontested cases
- Contested cases still require lawyers — tool is the floor estimate and negotiating baseline

---

## Cross-References

- **Inheritance Engine:** Liquidation engine output (decedent's share) is the gross estate input to the inheritance engine. The two products are complementary and should share a data model.
- **Estate Tax Engine:** Gross estate determined by liquidation; deductions include conjugal debts; family home deduction depends on whether property is community or exclusive.
- **Legal Interest Engine:** Estate debts and claims carry interest; Art. 2209 applies to obligations of the estate.
- **Property Classification (Art. 118/120):** Classification engine is a prerequisite module to the liquidation engine — same product, different screen.
