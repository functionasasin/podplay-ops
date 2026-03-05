# Analysis: Surviving Spouse Share
## Aspect: `surviving-spouse-share`
## Date: 2026-02-24
## Wave: 2 (TRAIN-Era Rule Extraction)

---

## Legal Basis

**NIRC Section 86(C) — Share of the Surviving Spouse**
*(Not amended by TRAIN Law — identical in TRAIN and pre-TRAIN regimes)*

> "The net share of the surviving spouse in the conjugal partnership property as diminished by the obligations properly chargeable to such property shall, for the purposes of this Chapter, be deducted from the net estate of the decedent."

**Applicable to**: All three regimes (TRAIN, pre-TRAIN, amnesty). This provision was not changed by RA 10963.

**Form 1801 Field**: Item 39 → feeds into Item 40 (Net Taxable Estate = max(0, Item 38 − Item 39)).

---

## Rule (Pseudocode)

```
function computeSurvivingSpouseShare(input):

  # Step 1: Determine property regime
  if input.decedent.maritalStatus == "single" or input.decedent.maritalStatus == "widowed":
    return 0  # No surviving spouse

  regime = input.propertyRegime  # "ACP" | "CPG" | "SEPARATION"

  if regime == "SEPARATION":
    return 0  # No community/conjugal pool exists under separation

  # Step 2: Sum total community/conjugal assets (Column B of gross estate)
  total_community_assets =
    grossEstate.realProperty.columnB        # Item 29B
    + grossEstate.familyHome.columnB        # Item 30B (full FMV of family home if conjugal)
    + grossEstate.personalProperty.columnB  # Item 31B
    + grossEstate.taxableTransfers.columnB  # Item 32B
    + grossEstate.businessInterest.columnB  # Item 33B

  # Step 3: Sum community/conjugal obligations (Column B of ELIT items only — NOT vanishing deduction or transfers for public use)
  community_obligations =
    schedule5A.columnB   # Claims against estate (community portion)
    + schedule5B.columnB # Claims vs. insolvent (community receivables — uncollectible portion)
    + schedule5C.columnB # Unpaid mortgages + unpaid taxes (community portion)
    + schedule5D.columnB # Casualty losses (community portion, during settlement)
  # NOTE: schedule5E (vanishing deduction) and 5F (transfers for public use) are policy deductions,
  # NOT obligations against the community pool. Exclude them from this sum.

  # Step 4: Net community/conjugal property
  net_community_property = max(0, total_community_assets - community_obligations)
  # Floor at 0: if obligations exceed assets, net community = 0 (spouse share cannot be negative)

  # Step 5: Surviving spouse's share = 50%
  surviving_spouse_share = net_community_property * 0.50

  return surviving_spouse_share


function applySpouseShareToTax(netEstate, survivingSpouseShare):
  # Item 38: Net Estate (after all ordinary + special deductions)
  # Item 39: Less: Share of Surviving Spouse
  # Item 40: Net Taxable Estate

  net_taxable_estate = max(0, netEstate - survivingSpouseShare)
  # Floor at 0: spouse share can exceed Net Estate → Net Taxable Estate = 0

  return net_taxable_estate
```

---

## Property Regime Rules

### How Property Regime Affects Column A vs. Column B

The engine requires users to input each asset tagged with its ownership classification. The property regime determines the default tagging rules.

#### ACP — Absolute Community of Property
- **Applies to**: Marriages contracted **on or after August 3, 1988** (Family Code effectivity)
- **Default**: All property owned at time of marriage AND acquired during marriage is community, UNLESS it falls into an exclusion
- **Column B (ACP community)**: All community property
- **Column A (ACP exclusive)**:
  - Property acquired before marriage that was excluded by marriage settlement
  - Property acquired by gratuitous title (gift, bequest, inheritance) during marriage and its fruits if stipulated
  - Property for personal and exclusive use (clothing, etc., except jewelry)
- **Engine input**: User tags each asset as "community" (Column B) or "exclusive" (Column A)

#### CPG — Conjugal Partnership of Gains
- **Applies to**: Marriages contracted **before August 3, 1988** (pre-Family Code)
- **Default**: Only income/fruits and property acquired through effort during marriage is conjugal
- **Column B (CPG conjugal)**: Income/fruits of separate property during marriage; property acquired through work/industry; property acquired through conjugal funds
- **Column A (CPG paraphernal/capital)**:
  - Property brought into marriage (capital of husband; paraphernal of wife)
  - Property acquired during marriage by gratuitous title (gifts, inheritance)
  - Property acquired by redemption of paraphernal/capital property
- **Engine input**: User tags each asset as "conjugal" (Column B) or "paraphernal/capital" (Column A)

#### Separation of Property
- **Applies to**: Couples who executed a pre-nuptial agreement establishing complete separation
- **Result**: No conjugal/community pool
- **Column B**: Always 0
- **Surviving spouse share**: 0

---

## Form 1801 Mapping

| Form Element | Description | Engine Value |
|---|---|---|
| **Schedule 6A** | Surviving spouse share worksheet | Detailed computation breakdown |
| Schedule 6A Line 1 | Total community/conjugal property | `total_community_assets` (= Item 34B) |
| Schedule 6A Line 2 | Less: Obligations charged to community | `community_obligations` (ELIT Column B, lines 5A–5D only) |
| Schedule 6A Line 3 | Net community/conjugal property | `net_community_property` |
| Schedule 6A Line 4 | Surviving spouse share (50%) | `surviving_spouse_share` |
| **Item 39** | Share of surviving spouse | `surviving_spouse_share` |
| **Item 40** | Net Taxable Estate | `max(0, Item38 - Item39)` |

**Important**: Item 39 is a **single value** — it is NOT split into Column A/B/C. It is subtracted directly from Item 38 (Net Estate, Column C total) to produce Item 40.

---

## Sequence in Computation Pipeline

```
Item 34C  Gross Estate (total A + B)
  Item 35  Less: Ordinary Deductions (Schedule 5, sum A+B+C)
= Item 36  Estate After Ordinary Deductions

  Item 37A Less: Standard Deduction
  Item 37B Less: Family Home (special deduction)
  Item 37C Less: Medical Expenses
  Item 37D Less: RA 4917 Benefits
= Item 38  Net Estate

  Item 39  Less: Surviving Spouse Share    ← computed from Schedule 6A
= Item 40  Net Taxable Estate (floor: 0)

× 0.06    Tax Rate
= Item 42  Estate Tax Due
```

**Critical ordering rule**: Surviving spouse share is deducted AFTER all other deductions (ordinary + special). The spouse share formula uses the **gross estate Column B** and **ELIT Column B obligations**, not the net estate after other deductions.

---

## Interaction with Family Home

The family home FMV appears in Column B (if conjugal/community) and feeds into `total_community_assets` in the spouse share computation. There is no double-counting issue:

- **Item 30B** (gross estate): Full FMV of the family home (if conjugal)
- **Item 37B** (special deduction): min(FMV × 0.50, ₱10,000,000) — decedent's half only (per NIRC text; see `deduction-family-home` analysis for ACP ambiguity note)
- **Item 39** (spouse share): Captures the spouse's half of the family home through the community pool formula: (community assets − community liabilities) / 2

Together, Items 37B and 39 effectively remove the full value of a conjugal family home from the net taxable estate:
- Item 37B removes the decedent's half (explicitly, capped at ₱10M)
- Item 39 removes the spouse's half (via 50% of community pool which includes full FMV)

*Note*: This only holds when the family home is within the cap. If FMV > ₱10M, the excess above the cap in the decedent's half is not deducted at Item 37B but is "shared away" through Item 39 (since the full FMV is still in the community pool at Item 30B).

---

## Pre-TRAIN and Amnesty Interactions

| Item | TRAIN | Pre-TRAIN | Amnesty |
|---|---|---|---|
| **Rule** | Sec. 86(C) | Sec. 86(C) (unchanged) | Sec. 86(C) (same) |
| **Formula** | Identical | Identical | Identical |
| **Available?** | Yes | Yes | Yes (it's one of the listed deductions) |
| **Cap** | None | None | None |

The surviving spouse share deduction is regime-invariant. The only difference across regimes is WHAT ends up in Column B (which depends on property regime, which depends on marriage date — not on date of death for tax regime selection purposes).

**Amnesty note**: RA 11213 explicitly allows surviving spouse share as one of the deductions when computing net estate for amnesty tax purposes. Even under the narrow interpretation of amnesty deductions (standard + spouse share only), the spouse share is always available.

---

## Edge Cases

### EC-1: No Surviving Spouse
```
Scenario: Decedent was single, widowed, or divorced
Result: surviving_spouse_share = 0; Item 39 = 0
Test: Verified in Sample 1 (single, ₱0 spouse share)
```

### EC-2: Separation of Property Regime
```
Scenario: Couple executed a prenuptial agreement for complete separation
Result: Column B = 0; community_obligations = 0; surviving_spouse_share = 0
Note: All property in Column A (exclusive to decedent)
```

### EC-3: All Exclusive Property (ACP/CPG with no community property at death)
```
Scenario: Married but all assets are exclusive (inherited individually, gifts, pre-marriage separate)
Result: total_community_assets = 0; surviving_spouse_share = 0
Note: This is unusual but legally possible under ACP with prenuptial carve-outs
```

### EC-4: Spouse Share Exceeds Net Estate (Zero Tax Result)
```
Scenario: Community liabilities are low; community assets are large; other deductions reduce net estate below spouse share
Example (Sample 3): Net Estate = ₱600,000; Spouse Share = ₱7,000,000
Result: Net Taxable Estate = max(0, ₱600,000 − ₱7,000,000) = ₱0
Rule: Floor at 0; NO minimum tax under regular TRAIN rules (distinct from amnesty ₱5,000 minimum)
```

### EC-5: Community Obligations Exceed Community Assets
```
Scenario: Total conjugal debts exceed total conjugal asset value (estate is insolvent)
Result: net_community_property = max(0, negative) = 0; surviving_spouse_share = 0
Note: Spouse share cannot be negative; if community is insolvent, spouse gets nothing from estate computation
```

### EC-6: Partially Community, Partially Exclusive
```
Scenario: ACP marriage; decedent has both exclusive (inherited) property and community property
Column A: exclusive property (₱3,000,000)
Column B: community property (₱12,000,000)
Column B obligations: ₱500,000 (community debts)
spouse_share = (₱12,000,000 - ₱500,000) / 2 = ₱5,750,000
Note: Exclusive property in Column A does NOT factor into spouse share computation
```

### EC-7: CPG — Income vs. Capital Classification
```
Scenario: Pre-1988 marriage; decedent owned both capital property (pre-marriage) and conjugal fruits
Engine challenge: User must correctly classify each asset as Column A or Column B
Engine behavior: Accept user's classification; no internal validation of CPG rules (too complex)
Documentation: Provide user guidance on CPG vs. ACP classification
```

### EC-8: Family Home Is Exclusive Property
```
Scenario: Family home was inherited or acquired before marriage (exclusive); decedent is ACP-married
Item 30 entry: Column A (full FMV)
Family home deduction: min(FMV, ₱10M) (no half-FMV reduction needed since it's exclusive)
Spouse share: family home NOT in community pool (Column B); does not increase spouse share
```

### EC-9: NRA Decedent with Surviving Spouse
```
Scenario: Non-resident alien decedent with a surviving spouse
Rule: NRA estate uses only PH-situs property
Column B: Community PH-situs property only
Spouse share computation: Same formula, but only PH-situs community assets and PH-situs community obligations
Note: NRA spouse share still deducted at Item 39, same as citizen/resident
```

### EC-10: Multiple Properties Mixed Ownership (Conjugal + Exclusive)
```
Scenario: Several real properties, some exclusive, some conjugal
Engine: Sum all Column B real property FMVs for Item 29B; sum all Column A FMVs for Item 29A
Spouse share only uses Column B total; Column A is not affected
```

### EC-11: Vanishing Deduction on Conjugal Property
```
Scenario: Conjugal property (Column B) has a vanishing deduction (Schedule 5E, Column B)
Key rule: Vanishing deduction does NOT reduce the community pool for spouse share purposes
community_obligations excludes Schedule 5E
Rationale: Vanishing deduction is a tax allowance, not an actual obligation against the community
```

### EC-12: Spouse Share Under Amnesty — Track B (Prior Return Filed)
```
Scenario: Prior return was filed; amnesty covers only undeclared portion
Spouse share computation: Applies to the FULL estate (gross estate minus deductions), not just the undeclared portion
The undeclared net estate = total net estate − previously declared net estate
The spouse share at time of death must be computed consistently
```

---

## Test Implications

1. **Test-SS-01**: Single decedent → Item 39 = 0, Item 40 = Item 38
2. **Test-SS-02**: ACP marriage, all community, no debts → spouse_share = GE_B / 2
3. **Test-SS-03**: ACP marriage, community debts → spouse_share = (GE_B − debts_B) / 2 (verify with Sample 2: ₱8,750,000)
4. **Test-SS-04**: ACP with both exclusive and community → spouse_share from Column B only (verify no impact from Column A)
5. **Test-SS-05**: Spouse share > Net Estate → Net Taxable Estate = 0, no negative (verify with Sample 3: ₱0)
6. **Test-SS-06**: CPG marriage (pre-1988) → same formula applied to Column B conjugal assets (verify with Sample 5: ₱3,800,000)
7. **Test-SS-07**: Separation of property → Item 39 = 0 (no Column B exists)
8. **Test-SS-08**: Vanishing deduction on conjugal property → 5E column B NOT subtracted from community pool; spouse share unchanged
9. **Test-SS-09**: NRA with surviving spouse → same formula, PH-situs community assets only
10. **Test-SS-10**: Community obligations exceed community assets → net_community = 0, spouse_share = 0
11. **Test-SS-11**: Pre-TRAIN death (CPG) → same formula; confirm Sample 5 (₱8M − ₱400K = ₱7.6M / 2 = ₱3.8M)
12. **Test-SS-12**: Amnesty path with surviving spouse → spouse share available; same formula applied

---

## Summary for Developer

The surviving spouse share (Item 39) is a deduction from Net Estate (Item 38) to produce Net Taxable Estate (Item 40).

**Formula**:
```
Item 39 = max(0, (Column_B_gross_estate − Column_B_ELIT_obligations_5A_to_5D)) × 0.50
Item 40 = max(0, Item 38 − Item 39)
```

**Key rules**:
- Only applies if decedent had a living spouse at death AND property regime is ACP or CPG
- Uses gross estate Column B values (NOT the net estate after other deductions)
- Only actual financial obligations (ELIT lines 5A–5D) reduce the community pool — NOT the vanishing deduction (5E) or transfers for public use (5F)
- Result floored at 0 in both places (net community property, net taxable estate)
- This provision is unchanged across all three regimes (TRAIN, pre-TRAIN, amnesty)
- Regime-invariant formula; the only variable is what the user enters in Column B (determined by property regime: ACP vs. CPG vs. Separation)
