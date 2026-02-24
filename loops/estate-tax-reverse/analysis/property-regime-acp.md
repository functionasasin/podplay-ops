# Analysis: Absolute Community of Property (ACP)
## Aspect: `property-regime-acp`
## Date: 2026-02-24
## Wave: 2 (TRAIN-Era Rule Extraction)

---

## Legal Basis

**Primary**: Family Code of the Philippines (Executive Order No. 209, effective August 3, 1988), Articles 88–104
**Secondary**: NIRC Sec. 86(C) — Share of the Surviving Spouse (which depends on the property regime to determine Column B)

> **Art. 88**: "The absolute community of property between spouses shall commence at the precise moment that the marriage is celebrated. Any stipulation, express or implied, for the commencement of the community regime at any other time shall be void."

> **Art. 91**: "Unless otherwise provided in this Chapter or in the marriage settlements, the community property shall consist of all the property owned by the spouses at the time of the celebration of the marriage or acquired thereafter."

> **Art. 92**: "The following shall be excluded from the community property:
> (1) Property acquired during the marriage by gratuitous title by either spouse, and the fruits as well as the income thereof, if any, unless it is expressly provided by the donor, testator or grantor that they shall form part of the community property;
> (2) Property for personal and exclusive use of either spouse. However, jewelry shall form part of the community property;
> (3) Property acquired before the marriage by either spouse who has legitimate descendants by a former marriage, and the fruits as well as the income, if any, of such property."

> **Art. 93**: "Property acquired during the marriage is presumed to belong to the community, unless it is proved that it is one of those excluded therefrom."

---

## Applicability Rule

```
ACP applies when ALL of the following are true:
  1. Decedent was married at time of death
  2. Marriage was celebrated on or after August 3, 1988 (Family Code effectivity)
  3. No valid prenuptial agreement (marriage settlement) establishing a different regime

If condition 2 is false (marriage before Aug 3, 1988): CPG applies (see property-regime-cpg.md)
If condition 3 is false (valid prenuptial for full separation): Separation applies (see property-regime-separation.md)
```

**Engine input**: The user declares the property regime (ACP | CPG | SEPARATION). The engine uses this declaration; it does NOT auto-detect the regime from marriage date. The marriage date is an informational input for user guidance only.

---

## Rule (Pseudocode)

```
# ACP Column Classification Rules
# The user must tag each asset as "exclusive" (Column A) or "community" (Column B)
# The engine provides these rules as guidance for correct tagging

function classifyAssetUnderACP(asset, decedent):

  # Rule 1: Property acquired DURING marriage by gratuitous title → EXCLUSIVE (Column A)
  if asset.acquisitionMode == "GIFT" or asset.acquisitionMode == "INHERITANCE" or asset.acquisitionMode == "BEQUEST":
    if asset.acquisitionDuringMarriage == true:
      # UNLESS donor/testator expressly stipulated it joins community
      if asset.donorStipulatedCommunity == true:
        return "COMMUNITY"   # Column B — overridden by donor/testator intent
      else:
        return "EXCLUSIVE"   # Column A — default for gratuitous title during marriage

  # Rule 2: Fruits and income of exclusively owned property → EXCLUSIVE
  # (Only applies if parent asset is exclusive and donation did not cover income)
  if asset.isFruitOrIncomeOf != null:
    parentExclusive = classifyAssetUnderACP(asset.isFruitOrIncomeOf, decedent)
    if parentExclusive == "EXCLUSIVE":
      return "EXCLUSIVE"   # Income of exclusive asset is also exclusive

  # Rule 3: Property for personal and exclusive use → EXCLUSIVE
  # EXCEPTION: Jewelry is always COMMUNITY even if personal
  if asset.isPersonalExclusiveUse == true and asset.type != "JEWELRY":
    return "EXCLUSIVE"   # Column A

  if asset.type == "JEWELRY":
    return "COMMUNITY"   # Column B — always community regardless of use

  # Rule 4: Property acquired BEFORE marriage by a spouse with prior-marriage children → EXCLUSIVE
  if asset.acquiredBeforeMarriage == true:
    if decedent.hasLegitimateDescendantsFromPriorMarriage == true:
      return "EXCLUSIVE"   # Column A — protected for prior-marriage children's inheritance rights
    # Note: if NO prior-marriage children, pre-marital property is still COMMUNITY under ACP

  # Rule 5: Default — all other property is COMMUNITY (Art. 91 + Art. 93 presumption)
  # Includes: all property owned at time of marriage (if no prior-marriage children)
  #           all property acquired during marriage through work/purchase/compensation
  #           salary and compensation earned during marriage
  #           lottery winnings during marriage
  return "COMMUNITY"   # Column B — presumed community


# KEY DIFFERENCE FROM CPG:
# Under ACP, property OWNED AT TIME OF MARRIAGE is generally COMMUNITY (Column B)
# Under CPG, property owned at time of marriage is SEPARATE/CAPITAL (Column A)
# This is the single most important behavioral difference between the two regimes.
```

---

## ACP vs. CPG: Critical Distinction

| Property Category | ACP Result | CPG Result |
|---|---|---|
| Property owned before marriage (no prior-marriage children) | **Column B (community)** | Column A (separate) |
| Property owned before marriage (has prior-marriage children) | Column A (exclusive) | Column A (separate) |
| Acquired during marriage by work/purchase | Column B (community) | Column B (conjugal) |
| Acquired during marriage by inheritance/gift | Column A (exclusive) | Column A (paraphernal/capital) |
| Fruits/income of community property | Column B | Column B |
| Fruits/income of exclusive property | Column A | Column A |
| Jewelry (any) | **Column B (always)** | Column A (personal item) |

**Practical impact for estate tax**: ACP estates often have a LARGER Column B (community pool) than CPG estates, because pre-marital property is also community under ACP. This increases the surviving spouse share (Item 39) and can significantly reduce the net taxable estate.

---

## How ACP Maps to Form 1801 Columns

```
Column A (exclusive property) — items exclusively owned by the decedent
  Includes:
  - Property acquired by gratuitous title during marriage (no donor stipulation)
  - Property for personal exclusive use (not jewelry)
  - Property acquired before marriage if decedent has prior-marriage children

Column B (community property) — items forming the ACP pool
  Includes:
  - All pre-marital property (if no prior-marriage children)
  - All property acquired by work/purchase during marriage
  - Salary and earned income during marriage
  - Property acquired by gratuitous title if donor stipulated community inclusion
  - Jewelry (always)
  Full FMV of each asset is entered in Column B — NOT half

Column C = Column A + Column B (total for the decedent's estate)
  Note: Column B represents 100% of the joint community property, not just 50%.
  The spouse's 50% share is removed at Item 39 (surviving spouse share),
  NOT by entering 50% in Column B.
```

**Critical rule**: The gross estate includes 100% of community property (Column B). The engine does NOT halve community assets in Column B. The spouse's economic half is removed later through Item 39.

---

## ACP Obligations (Charges Against Community) — Art. 94

Under ACP, the community pool is charged with (Column B obligations):
1. Support of the spouses and common children
2. Debts contracted by the administrator-spouse for the benefit of the community, or by both spouses, or by one spouse with the other's consent
3. Debts contracted by one spouse without consent, to the extent the family benefited
4. All taxes, liens, charges, and expenses upon community property (including major/minor repairs)

**Engine impact**: These community obligations appear in Column B of Schedule 5 (ELIT). They reduce the community pool before computing the surviving spouse share. The user must identify whether each debt/obligation is a community obligation (Column B) or an exclusive obligation of the decedent (Column A).

---

## Form 1801 Mapping

| Form Element | ACP Treatment |
|---|---|
| Item 29A (Real Property, exclusive) | Decedent's exclusively owned real property |
| Item 29B (Real Property, community) | Full FMV of ACP community real property |
| Item 30A (Family Home, exclusive) | Family home if exclusively owned (inherited, etc.) |
| Item 30B (Family Home, community) | Full FMV if family home is ACP community |
| Item 31A (Personal Property, exclusive) | Exclusive personal property |
| Item 31B (Personal Property, community) | Community personal property (including jewelry) |
| Item 32A/B (Taxable Transfers) | Tagged per asset's ownership at time of transfer |
| Item 33A/B (Business Interest) | Tagged per asset's ownership |
| Item 35 (Ordinary Deductions) | Schedule 5 uses same A/B split per obligation |
| Item 37A–D (Special Deductions) | Single column (no A/B split) |
| Schedule 6A Line 1 | Sum of all Column B gross estate items (= Item 34B) |
| Schedule 6A Line 2 | Column B ELIT obligations (5A–5D only) |
| Schedule 6A Line 3 | Net community property = Line 1 − Line 2 |
| Schedule 6A Line 4 | Surviving spouse share = Line 3 × 0.50 |
| Item 39 | = Schedule 6A Line 4 (surviving spouse share deduction) |
| Item 40 | = max(0, Item 38 − Item 39) (net taxable estate) |

---

## ACP Dissolution on Death — Art. 103

When a spouse dies, the ACP terminates. Dissolution sequence:
1. Pay debts and obligations of the community from community property
2. Remaining community property is divided equally between the estate and the surviving spouse
3. The decedent's share (50%) becomes part of the estate subject to estate tax
4. The surviving spouse's share (50%) is NOT subject to estate tax — deducted at Item 39

**This is exactly what the surviving spouse share formula implements**: the community pool after obligations, divided by 2, is the spouse's share and is removed from the taxable estate.

---

## Conditions and Regime Detection

```
Input fields required for ACP processing:
  - decedent.maritalStatus: "married" | "single" | "widowed" | "legally_separated"
  - decedent.propertyRegime: "ACP" | "CPG" | "SEPARATION"
  - decedent.hasLegitimateDescendantsFromPriorMarriage: boolean
  - For each asset: ownershipClass: "exclusive" | "community"
  - For each asset acquired by gratuitous title: donorStipulatedCommunity: boolean
  - For each debt/obligation: chargedTo: "exclusive" | "community"

Validations the engine SHOULD perform:
  - If maritalStatus != "married": warn if any Column B assets exist (no surviving spouse)
  - If propertyRegime == "ACP" and marriage date < 1988-08-03: warn user (CPG more likely)
  - If propertyRegime == "SEPARATION": Column B should be 0 — warn if any community assets entered

The engine CANNOT validate the correctness of each asset's ACP classification.
The user bears responsibility for correct classification per Family Code rules.
Provide guidance text next to each asset input explaining ACP rules.
```

---

## Regime-Specific Behavior Across the Three Tax Regimes

| Item | TRAIN | Pre-TRAIN | Amnesty |
|---|---|---|---|
| ACP applicable? | Yes | Yes | Yes (if marriage post-Aug 3, 1988 and death pre-2018) |
| Column B = full community FMV | Yes | Yes | Yes |
| Item 39 spouse share formula | Same | Same | Same |
| Community pool composition | Unchanged | Unchanged | Unchanged |

**Note**: The property regime (ACP/CPG/Separation) is determined by marriage date, NOT by the date of death. A decedent who died in 2012 under pre-TRAIN rules, married in 1990, would use ACP classification for Column B — and the same ACP rules apply regardless of which tax regime governs.

---

## Edge Cases

### EC-1: Pre-Marital Property — Key ACP Difference from CPG
```
Scenario: Decedent bought a house in 2000, married in 2005 (ACP). No prior-marriage children.
ACP Rule: The pre-marital house is COMMUNITY (Column B) — ACP includes all property at time of marriage
CPG Rule: Would be Column A (capital/paraphernal)
Estate impact: Under ACP, full house FMV in Column B increases community pool and spouse share
```

### EC-2: Inherited Property During ACP Marriage — No Donor Stipulation
```
Scenario: Decedent received ₱5M inheritance from parent in 2010 (during marriage)
Rule: Inheritance by gratuitous title → Column A (exclusive), Art. 92(1)
Column B impact: Zero — inheritance does NOT enter community pool
Fruits: If the ₱5M generated rental income of ₱200K/year, that income is also exclusive (Column A)
UNLESS: the will or deed of donation expressly includes the property in the community
```

### EC-3: Inherited Property During ACP Marriage — Donor Stipulates Community
```
Scenario: Parent's will says "I give this to my child and their spouse jointly as community property"
Rule: Donor/testator expressly stipulated community → Column B (community)
Community pool: increased by the donated/inherited property
```

### EC-4: Jewelry — Always Community
```
Scenario: Decedent owned expensive jewelry (rings, necklaces) worth ₱1,000,000
ACP Rule: Jewelry is always Column B (community) regardless of who wears it (Art. 92(2) exception)
CPG Rule: Would be Column A (personal item)
Estate impact: Under ACP, ₱1,000,000 in jewelry increases community pool by ₱1,000,000
```

### EC-5: Prior Marriage Children — Excluded Pre-Marital Property
```
Scenario: Decedent was previously married, has children from that marriage; remarried in 1995 (ACP)
Rule: Property acquired BEFORE the current marriage is EXCLUSIVE (Column A) — Art. 92(3)
Rationale: Protects prior-marriage children's inheritance rights
Income of pre-marital property: Also exclusive (Column A)
Note: This is the ONLY circumstance under ACP where pre-marital property is exclusive
```

### EC-6: Property Acquired by Work During Marriage — Always Community
```
Scenario: Decedent earned ₱10M salary during marriage, used it to buy stocks
Rule: Salary = community; stocks purchased from salary = community (Column B)
Even if: only one spouse worked (the unemployed spouse's contribution as homemaker is recognized)
```

### EC-7: Second Marriage — Prior ACP Not Liquidated
```
Scenario: Decedent's first marriage dissolved (divorced/widowed); remarried without liquidating first ACP
Rule: Under Art. 103, the first ACP must be liquidated within 6 months of dissolution
Consequences: Properties from undissolved first ACP are technically a separate pool
Engine limitation: Engine assumes one active property regime; user should sort out prior ACP liquidation before inputting values
Guidance: Warn user if decedent had prior marriage; advise proper liquidation accounting
```

### EC-8: Marriage Settlement Modifying ACP — Partial Exclusions
```
Scenario: Prenuptial agreement excludes certain specific assets from community (but not full separation)
Rule: Art. 92 exclusions apply by default; additional exclusions may be in the marriage settlement
Engine behavior: User must tag such excluded assets as Column A
Cannot validate against prenuptial agreement content
```

### EC-9: ACP Community Property in Decedent's Name Only
```
Scenario: Land title is in decedent's name alone, but acquired during marriage with no prior-marriage children
ACP Rule: Title does not determine ownership — ACP property is jointly owned regardless of whose name appears
Art. 91 note: "owned by the spouses in common regardless of whose name appears on the title"
Column B: Full FMV of the land (community)
Warning: Instruct user that title/name does not determine ACP vs. exclusive classification
```

### EC-10: ACP with Mixed Ownership — Some Exclusive, Some Community
```
Scenario: Decedent has both exclusive property (Art. 92 exclusions) and community property (Art. 91 default)
Form 1801: Column A for exclusive items; Column B for community items
Item 34A: Sum of all Column A gross estate values
Item 34B: Sum of all Column B gross estate values
Item 34C: Item 34A + Item 34B
Item 39: Only uses Column B values (exclusive property not in community pool)
```

### EC-11: Surviving Spouse's Own Separate Property in Estate
```
Scenario: Both spouses owned separate property before marriage
ACP Rule: Both spouses' pre-marital property (if no prior-marriage children) is COMMUNITY
Under ACP: Both are in Column B
Note: The engine deals only with the DECEDENT's estate. The surviving spouse's OWN exclusive property (post-separation) is NOT part of the estate computation. Item 39 removes the spouse's share of the community pool; the spouse's personal non-community assets are not involved.
```

### EC-12: NRA Decedent Under ACP
```
Scenario: Non-resident alien decedent, married in Philippines under ACP
ACP classification: Same Column A/B rules apply
Key difference: Only PH-situs property appears in gross estate
If community property includes foreign assets: those are NOT in the gross estate for NRAs
Schedule 6A: Uses only PH-situs community assets in Line 1
Surviving spouse share: Computed from PH-situs community assets and obligations only
```

---

## Test Implications

1. **Test-ACP-01**: All property exclusive (single inherited from parents, no marriage) → Column B = 0, spouse share = 0
2. **Test-ACP-02**: All property community (ACP, purchased during marriage) → full FMV in Column B, spouse share = 50% of (GE − debts)
3. **Test-ACP-03**: Mixed ownership: exclusive (inherited) + community (earned) → only community in Column B
4. **Test-ACP-04**: Pre-marital property, no prior-marriage children → pre-marital in Column B (verify against CPG which would be Column A)
5. **Test-ACP-05**: Inherited during marriage, no donor stipulation → Column A; income of inherited also Column A
6. **Test-ACP-06**: Inherited during marriage, donor stipulates community → Column B
7. **Test-ACP-07**: Jewelry worth ₱500K → always Column B regardless of personal use
8. **Test-ACP-08**: Prior-marriage children, pre-marital property → Column A (protected for prior children)
9. **Test-ACP-09**: Community debt → reduces Column B pool before spouse share; exclusive debt → reduces Column A (no impact on spouse share)
10. **Test-ACP-10**: ACP with NRA decedent → only PH-situs community property in Schedule 6A
11. **Test-ACP-11**: Spouse share > net estate → net taxable = 0 (verified against Sample 3: ₱7M > ₱600K)
12. **Test-ACP-12**: ACP vs. CPG with same facts → ACP has larger Column B (pre-marital property in B under ACP, in A under CPG)

---

## Summary for Developer

**When ACP applies**: Marriage on or after August 3, 1988, without a prenuptial agreement for separation.

**Column B rule under ACP**: ALL property of either spouse (pre-marital AND during-marriage) is community (Column B) EXCEPT:
- Art. 92(1): Acquired during marriage by gift/inheritance/bequest — exclusive UNLESS donor/testator stipulated community
- Art. 92(2): Personal exclusive use items — exclusive, EXCEPT jewelry (jewelry = always community)
- Art. 92(3): Pre-marital property of a spouse who has prior-marriage legitimate children — exclusive

**Column A rule under ACP**: Only the three Art. 92 exclusions above.

**Presumption**: If in doubt, the asset is community (Column B). The user must actively flag exclusions.

**Engine contract**:
```
Input: per-asset tag { ownershipClass: "exclusive" | "community" }
Output: Column A (exclusive) or Column B (community) in all Form 1801 schedules
Computation: Column B sum feeds Schedule 6A → Item 39 (surviving spouse share)
             Column A sum has no impact on Item 39
Key rule: Enter FULL FMV in Column B, NOT half-FMV
          The spouse's 50% is removed through Item 39, not through halving Column B
```

**Cross-reference**: See `surviving-spouse-share.md` for the Item 39 computation formula using Column B values. See `property-regime-cpg.md` for the contrasting CPG classification rules. See `property-regime-separation.md` for the zero-community case.
