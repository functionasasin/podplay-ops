# Analysis: Conjugal Partnership of Gains (CPG)
## Aspect: `property-regime-cpg`
## Date: 2026-02-24
## Wave: 2 (TRAIN-Era Rule Extraction)

---

## Legal Basis

**Primary**: Civil Code of the Philippines (Republic Act No. 386), Articles 142–185 (Chapter 3: Conjugal Partnership of Gains)
**Secondary**: NIRC Sec. 86(C) — Share of the Surviving Spouse (which depends on the property regime to determine Column B composition)

> **Art. 142**: "By means of the conjugal partnership of gains, the husband and wife place in a common fund the fruits of their separate property and the income from their work or industry, and divide equally, upon the dissolution of the marriage or of the partnership, the net gains or benefits obtained indiscriminately by either spouse during the marriage."

> **Art. 148**: "The following shall be the exclusive property of each spouse:
> (1) That which is brought to the marriage as his or her own;
> (2) That which each acquires during the marriage by lucrative title;
> (3) That which is acquired by right of redemption or by exchange with property belonging to only one of the spouses;
> (4) That which is purchased with exclusive money of the wife or of the husband."

> **Art. 153**: "The following are conjugal partnership property:
> (1) That which is acquired by onerous title during the marriage at the expense of the common fund, whether the acquisition be for the partnership, or for only one of the spouses;
> (2) That obtained from the labor, industry, work, or profession of either or both of the spouses;
> (3) The fruits, natural, industrial, or civil, due or received during the marriage from the common property, as well as the net fruits from the exclusive property of each spouse;
> (4) The share of either spouse in the hidden treasure which the law awards to the finder or owner of the property where the treasure is found;
> (5) Those acquired through occupation such as fishing or hunting;
> (6) Livestock existing upon dissolution of the partnership in excess of the number of each kind brought to the marriage by either spouse;
> (7) Those which are acquired by chance, such as winnings in gambling or betting."

> **Art. 160**: "All property of the marriage is presumed to belong to the conjugal partnership, unless it be proved that it pertains exclusively to the husband or to the wife."

---

## Applicability Rule

```
CPG applies when ALL of the following are true:
  1. Decedent was married at time of death
  2. Marriage was celebrated BEFORE August 3, 1988 (the day the Family Code took effect)
  3. No valid prenuptial agreement establishing ACP or full separation

OR:

  CPG applies when:
  1. Decedent was married at any time
  2. Spouses executed a valid prenuptial agreement expressly choosing CPG

If condition 2 is false (marriage on or after Aug 3, 1988) AND no CPG prenuptial: ACP applies (see property-regime-acp.md)
If valid prenuptial for full separation: Separation applies (see property-regime-separation.md)
```

**Engine input**: The user declares the property regime (ACP | CPG | SEPARATION). The engine uses this declaration; it does NOT auto-detect from marriage date. Marriage date is informational only, used to generate a user warning if the declared regime is inconsistent with the marriage date.

---

## Rule (Pseudocode)

```
# CPG Column Classification Rules
# The user must tag each asset as "exclusive" (Column A) or "conjugal" (Column B)
# The engine provides these rules as guidance for correct tagging

function classifyAssetUnderCPG(asset, decedent):

  # Rule 1: Pre-marital property → EXCLUSIVE (Column A) [Art. 148(1)]
  # This is the CRITICAL DIFFERENCE FROM ACP.
  # Under CPG, ALL pre-marital property is exclusive regardless of whether
  # the decedent has prior-marriage children. No exception for prior-marriage children.
  if asset.acquiredBeforeMarriage == true:
    return "EXCLUSIVE"   # Column A — always exclusive under CPG

  # Rule 2: Property acquired during marriage by lucrative (gratuitous) title → EXCLUSIVE [Art. 148(2)]
  # Same as ACP: gifts, inheritances, bequests during marriage are exclusive
  # UNLIKE ACP: no donor-override exception in CPG (lucrative acquisitions are ALWAYS exclusive)
  if asset.acquisitionMode in ["GIFT", "INHERITANCE", "BEQUEST"]:
    if asset.acquisitionDuringMarriage == true:
      return "EXCLUSIVE"   # Column A — no donor override unlike ACP
      # Note: if a donor stipulates community inclusion, this is legally contested under CPG.
      # Engine default: treat as exclusive; warn user if donor stipulated community.

  # Rule 3: Property acquired in exchange for (or by redemption of) exclusive property → EXCLUSIVE [Art. 148(3)]
  if asset.acquiredByExchangeForExclusiveProperty == true:
    return "EXCLUSIVE"   # Column A — substituted exclusive property

  # Rule 4: Property purchased with exclusive money → EXCLUSIVE [Art. 148(4)]
  if asset.purchasedWithExclusiveFunds == true:
    return "EXCLUSIVE"   # Column A — traced to exclusive source

  # Rule 5: Fruits and income of EXCLUSIVE (capital/paraphernal) property → CONJUGAL [Art. 153(3)]
  # THIS IS THE MOST CRITICAL DIFFERENCE FROM ACP.
  # Under ACP: fruits of exclusive property = exclusive (stays Column A)
  # Under CPG: fruits of exclusive property = CONJUGAL (moves to Column B)
  if asset.isFruitOrIncomeOf != null:
    parentColumn = classifyAssetUnderCPG(asset.isFruitOrIncomeOf, decedent)
    # Under CPG, fruits are ALWAYS conjugal — regardless of parent asset column
    return "CONJUGAL"   # Column B — all fruits/income during marriage are conjugal

  # Rule 6: Fruits and income of CONJUGAL property → CONJUGAL [Art. 153(3)]
  # (Implicit — already captured by Rule 5 returning CONJUGAL for all fruits)

  # Rule 7: Property acquired by work/labor/industry/profession during marriage → CONJUGAL [Art. 153(2)]
  # Same as ACP: salaries, wages, professional fees, business income earned during marriage
  if asset.acquiredByWorkDuringMarriage == true:
    return "CONJUGAL"   # Column B

  # Rule 8: Property acquired with conjugal funds → CONJUGAL [Art. 153(1)]
  if asset.purchasedWithConjugalFunds == true:
    return "CONJUGAL"   # Column B

  # Rule 9: Default — per Art. 160 presumption, acquired during marriage = CONJUGAL
  # (Rebuttable: spouse must prove it is exclusive under Art. 148)
  return "CONJUGAL"   # Column B — presumed conjugal if acquired during marriage


# -----------------------------------------------------------------------
# MOST CRITICAL CPG vs. ACP DISTINCTION (for developer):
#
# ACP (Art. 92, Family Code):
#   - Pre-marital property: COMMUNITY (Column B) — unless prior-marriage children
#   - Fruits of exclusive property: EXCLUSIVE (Column A) — stays with parent asset
#   - Jewelry: always COMMUNITY
#
# CPG (Art. 148, 153, Civil Code):
#   - Pre-marital property: EXCLUSIVE (Column A) — always, no exception
#   - Fruits of exclusive property: CONJUGAL (Column B) — moves to community pool
#   - Jewelry: follows general rule (personal item = exclusive if pre-marital or gratuitous)
# -----------------------------------------------------------------------
```

---

## CPG vs. ACP: Critical Distinctions

| Property Category | CPG Result | ACP Result |
|---|---|---|
| Pre-marital property (no prior-marriage children) | **Column A (exclusive)** | Column B (community) |
| Pre-marital property (has prior-marriage children) | **Column A (exclusive)** | Column A (exclusive) |
| Acquired during marriage by work/purchase | Column B (conjugal) | Column B (community) |
| Acquired during marriage by inheritance/gift | Column A (exclusive) | Column A (exclusive) |
| **Fruits/income of exclusive property** | **Column B (conjugal)** | **Column A (exclusive)** |
| Fruits/income of conjugal property | Column B (conjugal) | Column B (community) |
| Jewelry acquired pre-marital | Column A (exclusive) | Column B (community) |
| Jewelry acquired during marriage by purchase | Column B (conjugal) | Column B (community) |
| Jewelry acquired during marriage as gift | Column A (exclusive) | Column A (exclusive) |

**Practical impact for estate tax**:
- CPG estates typically have a **smaller Column B** than ACP estates because:
  1. Pre-marital property (often a substantial portion of wealth) stays in Column A under CPG
  2. However, rental income, dividends, and other fruits of capital property move to Column B under CPG
- The net effect depends on the estate's composition: asset-heavy pre-marital estates = smaller CPG community pool; income-heavy estates = similar CPG and ACP pools

---

## How CPG Maps to Form 1801 Columns

```
Column A (exclusive property) — capital or paraphernal items owned exclusively
  Includes under CPG:
  - All pre-marital property (regardless of whether prior-marriage children exist)
  - Property acquired during marriage by gratuitous title (gifts, inheritance, bequests)
  - Property acquired by exchange/redemption from exclusive property
  - Property purchased with exclusive funds
  - Debts incurred before marriage or for exclusive purposes (Column A obligations)

Column B (conjugal property) — items forming the CPG community pool
  Includes under CPG:
  - ALL fruits and income of EITHER spouse's exclusive property (critical CPG rule)
  - ALL property acquired by either spouse's work/industry during marriage
  - ALL property acquired with conjugal funds
  - ALL fruits of conjugal property itself
  - Gambling winnings, treasure finds, livestock gains, fishing/hunting during marriage
  Full FMV of each conjugal asset is entered in Column B — NOT half

Column C = Column A + Column B (total for the decedent's estate)
  Note: Column B represents 100% of the joint conjugal property, not just 50%.
  The spouse's 50% share is removed at Item 39 (surviving spouse share),
  NOT by entering 50% in Column B.
```

**Same as ACP**: Enter FULL FMV of conjugal assets in Column B. Do NOT halve. The spouse's economic half is removed through Item 39 using Schedule 6A.

---

## CPG Conjugal Obligations — Art. 161

Under CPG, the conjugal partnership is charged with (Column B obligations):
1. All debts and obligations contracted during the marriage by the designated administrator-spouse
2. Debts and obligations contracted by either spouse without the other's consent when they redounded to the benefit of the family
3. Debts before marriage if jointly contracted
4. Support of the family
5. Taxes and liens on conjugal property and on the exclusive property of either spouse, when the taxes or liens are borne by the conjugal partnership
6. Minor repair of conjugal or exclusive property (minor repair only; major repair to exclusive property is an exclusive obligation)

**Exclusive obligations** (Column A):
- Debts contracted before marriage (by the individual spouse)
- Debts for exclusive benefit of one spouse only (and the family did not benefit)
- Major repairs to exclusive (capital/paraphernal) property

**Engine impact**: User must identify whether each debt/obligation is conjugal (Column B) or exclusive (Column A). Column B obligations reduce the conjugal pool before computing the surviving spouse share.

---

## Form 1801 Mapping

| Form Element | CPG Treatment |
|---|---|
| Item 29A (Real Property, exclusive) | Decedent's exclusively owned real property (pre-marital, inherited, etc.) |
| Item 29B (Real Property, conjugal) | Full FMV of CPG conjugal real property |
| Item 30A (Family Home, exclusive) | Family home if exclusively owned (e.g., pre-marital with no prior-marriage children — wait: under CPG, pre-marital = Column A, so family home from before marriage is Column A) |
| Item 30B (Family Home, conjugal) | Full FMV if family home is CPG conjugal property |
| Item 31A (Personal Property, exclusive) | Exclusive personal property |
| Item 31B (Personal Property, conjugal) | Conjugal personal property (including ALL fruits/income of exclusive assets) |
| Item 32A/B (Taxable Transfers) | Tagged per asset's ownership classification at time of transfer |
| Item 33A/B (Business Interest) | Exclusively owned business = Column A; business acquired during marriage = Column B |
| Item 35 (Ordinary Deductions) | Schedule 5 uses same A/B split per obligation (conjugal debts → Column B) |
| Item 37A–D (Special Deductions) | Single column (no A/B split) |
| Schedule 6A Line 1 | Sum of all Column B gross estate items (= Item 34B) |
| Schedule 6A Line 2 | Column B ELIT obligations (5A–5D only; conjugal debts only) |
| Schedule 6A Line 3 | Net conjugal property = Line 1 − Line 2 |
| Schedule 6A Line 4 | Surviving spouse share = Line 3 × 0.50 |
| Item 39 | = Schedule 6A Line 4 (surviving spouse share deduction) |
| Item 40 | = max(0, Item 38 − Item 39) (net taxable estate) |

---

## CPG Dissolution on Death — Art. 175

When a spouse dies, the conjugal partnership terminates. Dissolution sequence:
1. Pay debts and obligations of the conjugal partnership from conjugal property
2. Return the capital/paraphernal property to each spouse's respective estate
3. Remaining conjugal property is divided equally (50/50) between the estate and the surviving spouse
4. The decedent's share (50%) of net conjugal property becomes part of the estate subject to estate tax
5. The surviving spouse's share (50%) is NOT subject to estate tax — deducted at Item 39

**This is exactly what the surviving spouse share formula implements**: column B conjugal pool after obligations, divided by 2, is the spouse's share.

---

## Conditions and Regime Detection

```
Input fields required for CPG processing:
  - decedent.maritalStatus: "married" | "single" | "widowed" | "legally_separated"
  - decedent.propertyRegime: "ACP" | "CPG" | "SEPARATION"
  - decedent.marriageDate: date (for regime consistency warning only)
  - For each asset: ownershipClass: "exclusive" | "conjugal"
  - For each asset: acquisitionMode: "PURCHASE" | "GIFT" | "INHERITANCE" | "BEQUEST" | "EXCHANGE" | "WORK_INCOME" | "FRUITS"
  - For each debt/obligation: chargedTo: "exclusive" | "conjugal"

Validations the engine SHOULD perform:
  - If maritalStatus != "married": warn if any Column B assets exist (no surviving spouse)
  - If propertyRegime == "CPG" and marriage date >= 1988-08-03: WARN user
      "Marriage date suggests ACP applies (post-Family Code). Confirm CPG was established by prenuptial agreement."
  - If propertyRegime == "SEPARATION": Column B should be 0 — warn if any conjugal assets entered

The engine CANNOT validate the correctness of each asset's CPG classification.
The user bears responsibility for correct classification per Civil Code rules.
Provide guidance text next to each asset input explaining CPG rules,
with explicit highlighting of the fruits-of-exclusive = conjugal rule.
```

---

## Regime-Specific Behavior Across the Three Tax Regimes

| Item | TRAIN | Pre-TRAIN | Amnesty |
|---|---|---|---|
| CPG applicable? | Yes (if pre-1988 marriage decedent dies post-2018) | Yes (most common case for pre-2018 deaths) | Yes (pre-2018 death + pre-1988 marriage) |
| Column B = full conjugal FMV | Yes | Yes | Yes |
| Item 39 spouse share formula | Same | Same | Same |
| Conjugal pool composition | Unchanged | Unchanged | Unchanged |

**Note**: The property regime (CPG/ACP/Separation) is determined by the marriage date, NOT the date of death. A decedent who died in 2023 (TRAIN-era), having married in 1975, would use CPG classification for Column B.

**Most common CPG scenario**: Pre-TRAIN deceased (died before 2018), married before 1988 (CPG default). See Sample 5 in commentary-samples.md (₱8M estate, CPG, death in 2015 → tax ₱91,000).

---

## Edge Cases

### EC-1: Pre-Marital Property — Key CPG Difference from ACP
```
Scenario: Decedent bought a house in 1975, married in 1980 (CPG). No prior-marriage children.
CPG Rule: Pre-marital house is EXCLUSIVE (Column A) — pre-marital property is always exclusive under CPG
ACP Rule: Would be Column B (community) — ACP includes all property at time of marriage
Estate impact: Under CPG, the house stays in Column A, does NOT enter the conjugal pool
Spouse share: NOT computed on this house; surviving spouse has no claim to the pre-marital house
```

### EC-2: Rental Income from Pre-Marital Property — CPG vs. ACP Critical Case
```
Scenario: Decedent owned an apartment building before marriage (exclusive, Column A);
          during marriage, it earned ₱500,000/year in rental income.
CPG Rule: Rental income (fruits) of exclusive property = CONJUGAL (Column B) [Art. 153(3)]
ACP Rule: Same rental income = EXCLUSIVE (Column A) [Art. 92 — fruits of exclusive = exclusive]

For estate tax:
  - The accumulated rental income (e.g., in a bank account) = Column B under CPG
  - Same bank account = Column A under ACP
  - Under CPG: adds to conjugal pool → increases spouse share (Item 39)
  - Under ACP: stays exclusive → no impact on spouse share

This is the single most operationally significant CPG vs. ACP difference.
```

### EC-3: Inherited Property During CPG Marriage
```
Scenario: Decedent received ₱5M inheritance from parent in 1990 (during marriage, CPG)
CPG Rule: Inheritance by lucrative/gratuitous title → Column A (exclusive) [Art. 148(2)]
Same as ACP Rule: Also Column A
BUT: Fruits/income of the inherited ₱5M:
  CPG: Fruits = Column B (conjugal) — the ₱5M interest/dividends = community
  ACP: Fruits = Column A (exclusive) — the ₱5M interest/dividends = exclusive
Practical: Under CPG, if decedent invested inherited ₱5M in stocks and earned dividends,
           the dividends are conjugal (Column B) even though the principal is exclusive (Column A)
```

### EC-4: CPG with Donor Stipulating Community
```
Scenario: Under ACP, a donor can stipulate that an inheritance is community property.
CPG Rule: Art. 148(2) says lucrative title = exclusive, period. No donor override exception.
Engine behavior: Treat as exclusive (Column A). Warn user if donor stipulated community —
                 advise them to seek legal counsel as this is legally contested under CPG.
```

### EC-5: Property Acquired with Mixed Funds
```
Scenario: Decedent used ₱1M exclusive (pre-marital savings) + ₱3M conjugal funds to buy property worth ₱4M
CPG Rule: When property acquired with mixed funds, generally classified as CONJUGAL [Art. 153(1)]
          UNLESS the exclusive contribution is documented and exceeds conjugal contribution (contested)
Engine default: Conjugal (Column B)
Guidance text: Advise user to consult lawyer for reimbursement claim from conjugal partnership
```

### EC-6: Livestock and Natural Accretions
```
Scenario: Decedent brought 10 cows to the marriage; at death, there are 25 cows.
CPG Rule: 10 cows = exclusive (Column A) [pre-marital]; 15 excess cows = conjugal (Column B) [Art. 153(6)]
Engine: Requires user to input pre-marital count vs. total at death; excess = Column B
Note: This is rarely an issue in modern estates but exists in the law
```

### EC-7: Gambling Winnings and Treasure
```
Scenario: Decedent won ₱2M in a casino during the marriage (CPG)
CPG Rule: Winnings = conjugal (Column B) [Art. 153(7)]
ACP Rule: Same — acquired during marriage = community (Column B) by default
No practical difference between CPG and ACP here; both = Column B
```

### EC-8: Business Interest Started Before Marriage
```
Scenario: Decedent started a sole proprietorship in 1975, married in 1980 (CPG)
The business existed pre-marriage; its FMV at marriage date = exclusive (Column A)
Appreciation in business value DURING marriage:
  CPG Rule: Profits and gains of the business during marriage = conjugal [Art. 153(2)]
  Specifically: Art. 153(3) — "net fruits from the exclusive property of each spouse" = conjugal
Engine: User inputs total business FMV at death in Column B (practical approach)
Note: Strict application would require business valuation at marriage and apportioning
      Pre-marital value = Column A; accumulated gains during marriage = Column B
      This apportionment is complex; engine should warn user and suggest professional advice
```

### EC-9: Legal Separation — CPG Effects
```
Scenario: Decedent and spouse were legally separated; no divorce in PH
CPG Rule: Legal separation does not dissolve the CPG — conjugal partnership continues
          BUT the legally separated spouse may have separate property management
          The conjugal partnership is dissolved upon death, not upon legal separation
Engine: If maritalStatus = "legally_separated", still apply CPG Column B rules;
        surviving spouse share formula still applies unless court order provides otherwise
Warning: Advise user to consult counsel on legal separation effects on conjugal partnership
```

### EC-10: CPG and Pre-TRAIN Tax — Most Common Combined Scenario
```
Scenario: Filipino citizen, married in 1970 (CPG), died March 2015 (pre-TRAIN)
This is the most common case for estates still being settled under CPG + pre-TRAIN rules.
Property regime: CPG (pre-1988 marriage) → Column B = conjugal property only
Tax regime: Pre-TRAIN (died before 2018) → graduated rates
Deductions: pre-TRAIN standard (₱1M), pre-TRAIN family home (≤₱1M), FUNERAL deductible

See Sample 5 in commentary-samples.md:
  Gross Estate (all conjugal): ₱8,000,000
  CPG Spouse Share: ₱3,800,000
  Net Taxable Estate: ₱1,450,000
  Tax: ₱91,000 (graduated: ₱15,000 + 8% × ₱950,000)
```

### EC-11: CPG with All-Pre-Marital Estate
```
Scenario: Decedent married at age 70 (1985, CPG), died at age 75 (1990),
          all property was pre-marital and no fruits accumulated during short marriage
CPG Result: All property = Column A (exclusive); Column B = 0
Spouse share: ₱0 (no conjugal pool)
Note: The marriage produced no conjugal property in this scenario
Engine: Column B sum = 0 → Schedule 6A Line 1 = 0 → Item 39 = 0 → Item 40 = Item 38
```

### EC-12: NRA Decedent Under CPG
```
Scenario: Non-resident alien decedent, married in Philippines in 1975 (CPG)
CPG classification: Same Column A/B rules apply
Key difference: Only PH-situs property appears in gross estate for NRAs
If conjugal property includes foreign assets: NOT in gross estate for NRAs
Schedule 6A: Uses only PH-situs conjugal assets in Line 1
Surviving spouse share: Computed from PH-situs conjugal assets and obligations only
If all conjugal property is foreign-situs: Column B = 0 → Item 39 = 0
```

---

## Fruit Classification — Implementation Note

The fruits/income rule under CPG (Art. 153(3)) has important implementation implications:

```
# FRUIT CLASSIFICATION ALGORITHM FOR CPG
# Called whenever an asset is "income" or "fruit" of another asset

function classifyFruitUnderCPG(fruitAsset, parentAsset):
  # Under CPG: ALL fruits received DURING the marriage are conjugal
  # regardless of whether the parent asset is exclusive or conjugal

  if fruitAsset.receivedDuringMarriage == true:
    return "CONJUGAL"   # Column B — Art. 153(3)
  else:
    # Fruit received BEFORE marriage: follows the parent asset's column
    # (Pre-marital fruit of pre-marital property = exclusive)
    return classifyAssetUnderCPG(parentAsset, decedent)

# Engine practical approach:
# The user should tag each income/fruit asset as:
#   - The year/period it was earned (during marriage vs. before)
#   - Whether it is a "fruit" of an exclusive or conjugal asset
# The engine then applies: during marriage = Column B regardless of parent asset
# Guidance text should explain this rule clearly to users
```

---

## Test Implications

1. **Test-CPG-01**: All pre-marital property (CPG) → Column A = total estate, Column B = 0, spouse share = 0
2. **Test-CPG-02**: All property acquired during marriage by work → Column B = total, spouse share = 50% of (GE − conjugal debts)
3. **Test-CPG-03**: Pre-marital house + rental income during marriage → house = Column A, rental income = Column B (critical CPG rule)
4. **Test-CPG-04**: Inherited asset during marriage → Column A; fruits of that asset → Column B (ACP would keep fruits in Column A)
5. **Test-CPG-05**: Pre-marital savings (Column A) invested in stocks during marriage; stocks' dividends → Column B; principal stocks (from pre-marital funds) → Column A [Art. 148(4)]
6. **Test-CPG-06**: Business started before marriage → pre-marital value = Column A; profits during marriage = Column B
7. **Test-CPG-07**: All conjugal property (CPG, married 1960) → same as ACP community property; Column B = total; verify spouse share formula same as ACP
8. **Test-CPG-08**: CPG + pre-TRAIN (death 2015) → verify Sample 5 exact values (₱8M, debts ₱400K, funeral ₱350K, family home ₱1M cap → tax ₱91,000)
9. **Test-CPG-09**: CPG vs. ACP with same facts → CPG has smaller Column B (pre-marital in A), but CPG has larger Column B income (fruits of pre-marital in B)
10. **Test-CPG-10**: Legal separation + CPG → Column B still applies (legal separation ≠ dissolution of conjugal partnership)
11. **Test-CPG-11**: Mixed-fund property (partial exclusive, partial conjugal) → classify as conjugal (Column B) per default rule
12. **Test-CPG-12**: NRA + CPG → only PH-situs conjugal assets in Schedule 6A; PH-situs computation identical to citizen CPG

---

## Summary for Developer

**When CPG applies**: Marriage contracted before August 3, 1988, without prenuptial agreement choosing ACP or separation. Also applies if prenuptial expressly chose CPG regardless of marriage date.

**Column A rule under CPG** (Exclusive / Capital or Paraphernal):
- Pre-marital property: **always Column A** under CPG (no prior-marriage-children exception needed)
- Acquired during marriage by gratuitous title (gift, inheritance, bequest): Column A
- Acquired by exchange/redemption of exclusive property: Column A
- Acquired with exclusive funds: Column A

**Column B rule under CPG** (Conjugal):
- Property acquired during marriage by work/labor/profession: Column B
- Property acquired during marriage with conjugal funds: Column B
- **ALL fruits and income of ANY property (exclusive OR conjugal) received during marriage: Column B** ← critical CPG rule
- Livestock excess, treasure finds, gambling winnings, fishing/hunting during marriage: Column B

**Presumption**: Per Art. 160, if property was acquired during the marriage, it is presumed conjugal (Column B). The burden of proving exclusivity falls on the estate.

**Engine contract**:
```
Input: per-asset tag { ownershipClass: "exclusive" | "conjugal" }
Output: Column A (exclusive) or Column B (conjugal) in all Form 1801 schedules
Computation: Column B sum feeds Schedule 6A → Item 39 (surviving spouse share)
             Column A sum has no impact on Item 39
Key rule: Enter FULL FMV in Column B, NOT half-FMV
          The spouse's 50% is removed through Item 39, not through halving Column B
Warning to user: "Under CPG, income earned during marriage from ANY property
                 (even your own pre-marital assets) belongs to the conjugal pool."
```

**Cross-reference**: See `surviving-spouse-share.md` for the Item 39 computation formula using Column B values. See `property-regime-acp.md` for ACP rules and the ACP vs. CPG comparison table. See `property-regime-separation.md` for the zero-community case. See `commentary-samples.md` Sample 5 for a complete CPG + pre-TRAIN computation worked example.
