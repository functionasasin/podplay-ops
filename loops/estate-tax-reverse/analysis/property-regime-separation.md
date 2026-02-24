# Analysis: Complete Separation of Property
## Aspect: `property-regime-separation`
## Date: 2026-02-24
## Wave: 2 (TRAIN-Era Rule Extraction)

---

## Legal Basis

**Primary**: Family Code of the Philippines (Executive Order No. 209, effective August 3, 1988), Arts. 143–146 (Regime of Separation of Property) and Art. 74–76 (marriage settlements)
**Pre-Family Code equivalent**: Civil Code Art. 144 (old numbering — "capitulaciones matrimoniales" allowing prenuptial property regime selection)
**Secondary**: NIRC Sec. 86(C) — Share of the Surviving Spouse

> **Art. 74, Family Code**: "The property relations between husband and wife shall be governed in the following order: (1) By marriage settlements executed before the marriage; (2) By the provisions of this Code; and (3) By the local custom."

> **Art. 75, Family Code**: "The future spouses may, in the marriage settlements, agree upon the regime of absolute community, conjugal partnership of gains, complete separation of property, or any other regime. In the absence of marriage settlements, or when the regime agreed upon is void, the system of absolute community of property as established in this Code shall govern."

> **Art. 143, Family Code**: "Should the future spouses agree in the marriage settlements that their property relations during marriage shall be governed by the regime of complete separation of property, the provisions in this Chapter shall be suppletory."

> **Art. 145, Family Code**: "Each spouse shall own, dispose of, possess, administer and enjoy his or her own separate estate, without need of the consent of the other. To each spouse shall belong all earnings from his or her profession, business or industry and all fruits, natural, industrial or civil, due or received during the marriage from his or her separate property."

> **Art. 146, Family Code**: "Both spouses shall bear the family expenses in proportion to their income, or, in case of insufficiency or default thereof, to the current market value of their separate properties. The liability of the spouses to creditors for family expenses shall, however, be solidary."

> **NIRC Sec. 86(C) — Share of the Surviving Spouse** (comment in cached NIRC text): "For separation of property regime: no community/conjugal property exists; surviving spouse share = 0."

---

## Critical Distinction: Separation of Property vs. Legal Separation

**These are entirely different legal concepts. The engine must not conflate them.**

| Concept | What It Is | Estate Tax Effect |
|---------|-----------|-------------------|
| **Separation of Property (regime)** | A PROPERTY REGIME established by prenuptial agreement before marriage. The marriage is fully valid. Each spouse owns their own property during the marriage. | Column B = 0; Item 39 = 0 |
| **Legal Separation** | A COURT DECREE separating the spouses from bed and board (marital cohabitation). The marriage bond remains. Property regime (ACP or CPG) may CONTINUE unless court orders liquidation. | Column B determined by the ONGOING property regime (ACP/CPG); Item 39 still applies |
| **Annulment / Void Marriage** | Marriage declared void or voidable. Property relations governed by Art. 147/148 Family Code (co-ownership rules). | No standard regime; co-ownership percentage applied |

**Engine input handling**:
```
If user selects maritalStatus = "legally_separated":
  → DO NOT default to Separation of Property regime
  → Ask user to specify their property regime (ACP or CPG based on marriage date)
  → Item 39 (surviving spouse share) still applies using the existing ACP/CPG Column B
  → Warn: "Legal separation does not dissolve the property regime or the surviving spouse's share"

If user selects propertyRegime = "SEPARATION":
  → This means prenuptial complete separation, NOT legal separation
  → Column B = 0; Item 39 = 0
```

---

## Applicability Rule

```
SEPARATION regime applies when:
  1. The decedent was married at the time of death
  2. A valid prenuptial agreement (marriage settlement) expressly established
     complete separation of property BEFORE the marriage was celebrated
  3. The prenuptial agreement was executed in a public instrument and registered
     in the local civil registry where the marriage was recorded

Partial separation (Art. 144, Family Code):
  The agreement specifies that CERTAIN NAMED properties are separate;
  all other property defaults to ACP.
  Engine handles: user must tag each asset as "exclusive" or "community";
  the ACP rules govern community-pool assets; exclusive assets follow separation rules.
  (See EC-7 below for partial separation handling)
```

**Engine input**: The user declares the property regime (ACP | CPG | SEPARATION). The engine uses this declaration. Marriage date is informational only and triggers warnings for consistency checks.

---

## Rule (Pseudocode)

```
# SEPARATION REGIME — Column Classification
# Under complete separation, ALL property of the decedent is Column A (exclusive).
# There is NO community/conjugal pool. Column B = 0 throughout.

function classifyAssetUnderSEPARATION(asset, decedent):
  # Under complete separation, EVERY asset of the decedent is exclusive.
  # Art. 145: Each spouse owns, possesses, administers their own separate estate.
  # Pre-marital property: exclusive (same as CPG — no community)
  # Property acquired during marriage by work/industry: exclusive (UNLIKE ACP/CPG)
  # Property acquired during marriage by gift/inheritance: exclusive (same as ACP/CPG)
  # Fruits and income of any property: exclusive (same as ACP; unlike CPG)
  return "EXCLUSIVE"   # Column A — always


# SURVIVING SPOUSE SHARE UNDER SEPARATION
function computeSurvivingSpouseShare_SEPARATION(input):
  # Art. 145: each spouse owns their own property exclusively
  # NIRC Sec. 86(C): deduction applies to share in "conjugal/community partnership property"
  # Under separation, NO conjugal/community partnership property exists
  # Therefore, the deduction under Sec. 86(C) = 0
  return 0   # Item 39 = 0


# FORM 1801 IMPACT
function applyRegime_SEPARATION(grossEstate):

  # All assets are Column A (exclusive) — Column B = 0
  for each asset in grossEstate.assets:
    asset.columnA = asset.fmv
    asset.columnB = 0   # Always zero under separation

  # Item 34B = 0 (no community/conjugal gross estate)
  item_34B = 0

  # Schedule 6A: community pool computation — all zeros
  schedule_6A = {
    line1_total_community_assets: 0,        # Item 34B = 0
    line2_community_obligations:  0,        # No community obligations exist
    line3_net_community_property: 0,        # Line 1 − Line 2 = 0
    line4_surviving_spouse_share:  0,       # Line 3 × 0.50 = 0
  }

  # Item 39 = 0
  item_39 = 0

  # Item 40 = Item 38 (no spouse share deduction)
  # Net taxable estate = Total net estate after ordinary and special deductions
  item_40 = item_38   # Not reduced by Item 39 since Item 39 = 0


# DEBT CLASSIFICATION UNDER SEPARATION
# Art. 146: Both spouses are SOLIDARILY LIABLE for family expenses
# but each spouse's debts for their own account are their own.
# For Form 1801 purposes:
function classifyDebtUnderSEPARATION(debt):
  # Under separation, all obligations of the decedent are Column A (exclusive)
  # There is no conjugal/community Column B to charge obligations against
  # All Schedule 5 items (5A–5D) go in Column A only
  return "EXCLUSIVE"   # Column A
  # NOTE: Even family expense debts (Art. 146 solidarity) are treated as
  # Column A for the decedent's estate since Column B = 0 under separation
```

---

## SEPARATION vs. ACP vs. CPG: Comparison Table

| Property Category | SEPARATION | ACP | CPG |
|---|---|---|---|
| Pre-marital property | **Column A** | Column B (if no prior children) | Column A |
| During marriage: work/salary | **Column A** | Column B | Column B |
| During marriage: gift/inheritance | **Column A** | Column A | Column A |
| Fruits/income of any property | **Column A** | Column A (of exclusive); Column B (of community) | Column B (ALL fruits during marriage) |
| Jewelry | **Column A** | Column B (always) | Depends on acquisition mode |
| Surviving spouse share | **0** | 50% of net Column B | 50% of net Column B |
| Item 39 | **₱0** | Potentially large deduction | Potentially large deduction |
| Family expenses solidarity | Both pay proportionally | Community obligation | Conjugal obligation |

**Key insight for estate computation**:
- Under SEPARATION, the GROSS ESTATE may appear larger relative to ACP/CPG because there is no Item 39 deduction reducing the taxable estate. However, the decedent's actual wealth is also undiluted by community pooling.
- Under ACP/CPG with a large Column B, Item 39 can substantially reduce the net taxable estate. Under SEPARATION, no such reduction occurs.
- For equal asset values, SEPARATION generally results in HIGHER estate tax than ACP/CPG because Item 39 = 0.

---

## How SEPARATION Maps to Form 1801 Columns

```
Column A (exclusive property) — ALL of the decedent's property
  Under SEPARATION:
  - ALL real property owned by decedent → Column A
  - Family home (if decedent's own) → Column A (Schedule 1A)
  - ALL personal property → Column A
  - ALL taxable transfers → Column A
  - ALL business interests → Column A
  - ALL debts and obligations → Column A (Schedule 5)

Column B (community property) — ALWAYS ZERO
  No assets, no obligations.

Column C = Column A + 0 = Column A
  Item 34C = Item 34A (all gross estate is Column A)

Schedule 6A:
  Line 1: 0 (no community/conjugal gross estate)
  Line 2: 0 (no community/conjugal obligations)
  Line 3: 0 (net community property)
  Line 4: 0 (surviving spouse share)

Item 39: ₱0
Item 40: = max(0, Item 38 − 0) = Item 38
```

---

## Form 1801 Mapping

| Form Element | SEPARATION Treatment |
|---|---|
| Item 29A (Real Property, exclusive) | Full FMV of ALL decedent's real property |
| Item 29B (Real Property, community) | ₱0 — no community property |
| Item 30A (Family Home, exclusive) | Full FMV of decedent's family home (if in decedent's name) |
| Item 30B (Family Home, community) | ₱0 — no community property |
| Item 31A (Personal Property, exclusive) | Full FMV of ALL decedent's personal property |
| Item 31B (Personal Property, community) | ₱0 |
| Item 32A/B (Taxable Transfers) | All in Column A; Column B = 0 |
| Item 33A/B (Business Interest) | All in Column A; Column B = 0 |
| Item 34A | Sum of ALL gross estate |
| Item 34B | ₱0 |
| Item 34C | = Item 34A |
| Item 35 (Schedule 5 ELIT) | All in Column A; Column B = 0 |
| Item 39 (Surviving Spouse Share) | ₱0 |
| Item 40 (Net Taxable Estate) | = max(0, Item 38) — not further reduced by spouse share |

---

## Conditions

```
Input fields required for SEPARATION processing:
  - decedent.maritalStatus: "married" (required — unmarried/widowed = no regime needed)
  - decedent.propertyRegime: "SEPARATION"
  - Prenuptial agreement: assumed valid (engine cannot verify); user declares the regime
  - For each asset: ownershipClass: "exclusive" (must always be "exclusive" under full separation)
    — Engine should warn if user enters ownershipClass = "community" with SEPARATION regime

Validations the engine SHOULD perform:
  1. If propertyRegime == "SEPARATION" and any asset has ownershipClass == "community":
       WARN: "Complete separation of property means no community assets exist.
              Please check your entry or verify your property regime."
  2. If propertyRegime == "SEPARATION" and maritalStatus != "married":
       INFO: "Separation of property only applies when the decedent was married.
              Surviving spouse share is already zero for unmarried/widowed decedents."
  3. If maritalStatus == "legally_separated":
       WARN: "Legal separation is different from the separation of property REGIME.
              Legal separation does not eliminate the surviving spouse's share if
              the property regime is ACP or CPG. Please confirm your property regime."

The engine CANNOT verify that a valid prenuptial agreement existed.
The user declares the regime; the engine applies it.
```

---

## Regime-Specific Behavior Across the Three Tax Regimes

| Item | TRAIN | Pre-TRAIN | Amnesty |
|---|---|---|---|
| SEPARATION applicable? | Yes (married under prenuptial separation, died 2018+) | Yes (married under prenuptial separation, died before 2018) | Yes (eligible estate, separation regime) |
| Column B | 0 | 0 | 0 |
| Item 39 | ₱0 | ₱0 | ₱0 |
| Deductions available | Full TRAIN set (₱5M standard, ₱10M family home cap, etc.) | Full pre-TRAIN set (₱1M standard, ₱1M family home cap, funeral expenses, etc.) | Amnesty limited set (₱5M standard + spouse share only, but spouse share = ₱0) |

**Note**: The property regime (SEPARATION) is determined by the prenuptial agreement, not the date of death. A decedent who died in 2023 under a prenuptial separation established in 2000 uses the SEPARATION rules for Column B (= 0), while TRAIN-era rates apply because the death is post-2018.

**Practical rarity**: Complete separation by prenuptial agreement is uncommon in the Philippines. Most Philippine estate tax filings involve ACP (post-1988 marriages) or CPG (pre-1988 marriages). However, the engine must support this case.

---

## Edge Cases

### EC-1: Separation Regime — No Surviving Spouse Share Despite Being Married
```
Scenario: Decedent was legally married under a prenuptial complete separation of property.
          Decedent's estate: real property ₱10,000,000 (exclusive), personal ₱2,000,000.
Result: Column B = 0 throughout. Item 39 = 0.
        Net taxable estate (assuming no other deductions) = full ₱12M minus deductions.
Contrast: Under ACP, if the ₱12M was all community, Item 39 would deduct ₱6M (50% of net community).
Impact: Higher estate tax under SEPARATION than under ACP/CPG for same gross estate value.
```

### EC-2: Legal Separation — DIFFERENT From Separation Regime
```
Scenario: User marks maritalStatus = "legally_separated" and mistakenly selects propertyRegime = "SEPARATION"
          Reality: Decedent was legally separated (court decree) but married in 1985 under CPG.
                   CPG was NOT dissolved by the legal separation.
Engine behavior:
  - Display mandatory warning: "Legal separation ≠ separation of property regime"
  - Prompt user to confirm the actual property regime (CPG, given 1985 marriage)
  - If user confirms CPG: apply CPG Column B rules; compute Item 39 from CPG community pool
  - If user insists on SEPARATION: apply as declared; note this is user's legal determination
```

### EC-3: Partial Separation — Mixed Regime
```
Scenario: Prenuptial agreement says "the following named properties are exclusively Mine:
           [lot in Makati, 100 shares of ABC Corp]" — all other property follows ACP.
Legal basis: Art. 144 Family Code allows partial separation.
Engine handling:
  - User declares propertyRegime = "ACP" (the governing default for unlisted assets)
  - User tags the specifically-separated assets as ownershipClass = "exclusive" (Column A)
  - All other assets follow ACP rules (Column B for community; Column A for ACP exclusions)
  - Item 39 computed from ACP Column B pool (excluding the prenuptially-separated assets)
Note: Engine does not have a "PARTIAL_SEPARATION" mode. User applies the regime by tagging assets.
     The ACP rules apply to the non-separated pool.
```

### EC-4: All Property Exclusively Owned Under Separation — Family Home
```
Scenario: Family home (FMV ₱8,000,000) is under decedent's name only, SEPARATION regime.
Gross estate (Schedule 1A): Item 30A = ₱8,000,000 (Column A — exclusive)
Family home deduction (Item 37B):
  TRAIN: min(8,000,000, 10,000,000) = ₱8,000,000 (full FMV deducted — no halving since Column A)
  Pre-TRAIN: min(8,000,000, 1,000,000) = ₱1,000,000
Note: Under ACP/CPG, the family home is often conjugal (Column B);
      the family home deduction formula halves the FMV if conjugal (min(FMV×0.5, cap)).
      Under SEPARATION, the home is always Column A (exclusive), so full FMV applies to the deduction formula.
```

### EC-5: Separation Regime Under Amnesty Path
```
Scenario: Decedent died in 2014 under prenuptial separation of property. Estate was unpaid. Amnesty elected.
Amnesty deductions: standard deduction (₱1M, applied at time of death = pre-TRAIN era) + surviving spouse share.
Surviving spouse share under separation = ₱0 (Item 39 = 0, no community pool).
Result: Amnesty net estate = gross estate − ₱1,000,000 (standard deduction only)
        Amnesty tax = net estate × 0.06
Key point: The amnesty deductions are ALREADY minimal; under separation, even the spouse share deduction is ₱0.
This yields a HIGHER amnesty tax than the same estate under ACP/CPG (where spouse share would reduce the amnesty base).
```

### EC-6: Single / Widowed Decedent — Separation Regime Not Needed
```
Scenario: Decedent was never married (single) or was widowed.
There is no surviving spouse, so Item 39 = 0 regardless of any property regime.
The engine does NOT need to collect propertyRegime if maritalStatus = "single" or "widowed".
No Column B logic runs; all property is Column A.
Note: This is NOT the same as "separation of property" — it is just the absence of a spouse.
Engine: propertyRegime input should be hidden/disabled when maritalStatus != "married".
```

### EC-7: Separation Regime — NRA Decedent
```
Scenario: Non-resident alien decedent married under prenuptial separation of property.
NRA scope: Only PH-situs property in gross estate.
Column B: Still 0 (same rule — SEPARATION means no community pool).
Item 39: ₱0 (same as for citizens under separation).
Schedule 6A: All zeros (same as citizen SEPARATION).
NRA standard deduction: ₱500,000 (Sec. 86(B)(1)) — applies regardless of property regime.
No family home deduction for NRAs (same rule regardless of regime).
```

### EC-8: Annulment / Void Marriage — Not Governed by Standard Regimes
```
Scenario: The marriage was declared null and void (court order). Decedent was "married"
          at time of death but marriage is now annulled.
Legal regime: Art. 147–148 Family Code (co-ownership rules for void/voidable marriages).
NOT ACP, CPG, or Separation of Property.
Engine limitation: The engine does NOT handle Art. 147/148 co-ownership scenarios.
User guidance: Advise executor/heir to consult legal counsel for the correct property allocation.
Engine: If user indicates "annulled" or "void marriage", display warning and treat as single
        (Column B = 0, Item 39 = 0) with a disclaimer that professional legal advice is needed.
```

### EC-9: Pre-Family Code Marriages — Old Civil Code Separation
```
Scenario: Decedent married in 1975 (pre-Family Code) under a "capitulaciones matrimoniales"
          (prenuptial agreement under old Civil Code) establishing separation of property.
Legal validity: Such pre-Family Code prenuptial agreements are valid and honored.
Art. 256, Family Code: The Family Code is retroactive to the extent it does not impair
vested rights. Pre-FC prenuptial agreements establishing separation remain valid.
Engine: User declares propertyRegime = "SEPARATION"; engine applies same rules.
        Column B = 0; Item 39 = 0.
        Note in guidance text: "This includes separation established under pre-1988 marriage settlements."
```

### EC-10: Separation Regime — Debt Solidarily Owed (Art. 146)
```
Scenario: Under Art. 146, both spouses are solidarily liable for family expenses.
          A ₱100,000 family expense debt is unpaid at decedent's death.
Question: Does this go in Column A or Column B of Schedule 5A (claims against estate)?
Answer: Column A — under separation, there is NO Column B. All debts of the decedent,
        even if solidarily shared with the spouse, are recorded in Column A.
Result: The debt is an ordinary deduction under ELIT (Schedule 5A), reducing gross estate.
        The spouse's part of the solidarity does NOT create a community pool.
        Column B remains 0 for claims and for the gross estate.
```

### EC-11: Separation — Family Expenses Impact on Deductions
```
Scenario: Decedent under separation regime incurred ₱200,000 in unpaid family expense bills.
          These are valid claims against the estate (Column A, Schedule 5A).
          The surviving spouse is solidarily liable but that does not alter the estate's deduction.
Computation:
  Schedule 5A Column A: ₱200,000 (claims against estate — family expenses debt)
  Schedule 5A Column B: ₱0 (no community obligations)
  Total ELIT (Item 35): ₱200,000 reduces Column A gross estate
```

### EC-12: Separation Regime — No "Surviving Spouse Share" Even If Spouse Contributed to Assets
```
Scenario: Surviving spouse contributed ₱2,000,000 from their own earnings to renovate
          a property titled in the decedent's name under a separation regime.
          At death, the property FMV = ₱5,000,000.
Engine behavior: The ₱5,000,000 is Column A (decedent's exclusive property per title and regime).
                 The spouse's contribution creates a REIMBURSEMENT CLAIM against the estate,
                 which would appear as a debt (Schedule 5A, Column A) if properly documented.
                 This is NOT a community pool claim and does NOT flow through Item 39.
User guidance: Advise that the spouse's contribution is a claim against the estate (5A),
               not a property regime entitlement. Consult counsel for reimbursement documentation.
Note: Item 39 = 0 regardless. The ₱2M reimbursement claim (if valid) reduces gross estate via Item 35.
```

---

## Test Implications

1. **Test-SEP-01**: TRAIN + married + SEPARATION → Column B = 0, Item 39 = 0, Item 40 = Item 38; higher tax than equivalent ACP estate
2. **Test-SEP-02**: Pre-TRAIN + SEPARATION → same Column B = 0, Item 39 = 0; graduated rates still apply; funeral expenses deductible (pre-TRAIN)
3. **Test-SEP-03**: Amnesty + SEPARATION → gross estate − ₱1M standard deduction only (no spouse share); amnesty tax = net × 0.06
4. **Test-SEP-04**: SEPARATION with family home (Column A, ₱8M) → TRAIN deduction = full ₱8M (no halving); compare to ACP conjugal family home deduction = min(4M, 10M) = ₱4M
5. **Test-SEP-05**: maritalStatus = "legally_separated" with CPG regime → verify that engine does NOT zero out Item 39; CPG Column B still applies; contrast with SEPARATION where Item 39 = 0
6. **Test-SEP-06**: SEPARATION + NRA → Column B = 0; NRA standard deduction ₱500K; no family home deduction; Item 39 = 0
7. **Test-SEP-07**: SEPARATION + community-tagged asset (user error) → engine emits warning; engine still processes as Column A (override) or prompts user to re-tag
8. **Test-SEP-08**: Annulled marriage → engine warns; treats as single (Column B = 0, Item 39 = 0) with disclaimer
9. **Test-SEP-09**: SEPARATION with solidary family debt → debt in Column A (Schedule 5A); Column B stays 0; Item 39 = 0
10. **Test-SEP-10**: SEPARATION vs. ACP with identical ₱10M estate, married 2010, no prior children → SEPARATION: tax on full net estate (Item 39 = 0); ACP: if all community, Item 39 ≈ ₱4.5M → ACP net taxable ≈ ₱5.5M → ACP tax ≈ 60% less than SEPARATION tax

---

## Summary for Developer

**When SEPARATION applies**: Decedent was married AND spouses executed a valid prenuptial agreement (marriage settlement) expressly establishing complete separation of property before the marriage was celebrated. Valid under Family Code (Art. 74–76, 143–146) for marriages from August 3, 1988 onward; valid under Civil Code for pre-1988 prenuptial agreements.

**The single governing rule**: Under complete separation, ALL property of the decedent is **Column A (exclusive)**. Column B = 0 everywhere.

**Engine contract**:
```
Input: decedent.propertyRegime = "SEPARATION"
Rule:  ALL assets → ownershipClass = "exclusive" → Column A
       Column B = 0 for every line item in every schedule
Output:
  Item 34B = 0
  Schedule 6A: {line1: 0, line2: 0, line3: 0, line4: 0}
  Item 39 = 0
  Item 40 = max(0, Item 38)  // no spouse share deduction

Warnings to display:
  1. If any asset tagged as "community": warn user and prompt correction
  2. If maritalStatus == "legally_separated": warn user that legal separation ≠ separation of property regime
  3. Before applying separation: confirm user understands this eliminates the surviving spouse's share

Impact note:
  Complete separation of property results in NO Item 39 deduction.
  This typically produces a higher estate tax than ACP/CPG with the same gross estate.
  Confirm with the user that this property regime is correctly declared.
```

**Family home deduction under SEPARATION**:
```
Since the family home is always Column A (exclusive) under SEPARATION:
  family_home_deduction = min(fmv, cap)   // full FMV formula applies — no halving
  TRAIN cap: ₱10,000,000
  Pre-TRAIN cap: ₱1,000,000
  (Same as ACP/CPG when the family home is an exclusive (Column A) property)
```

**Cross-reference**: See `property-regime-acp.md` for ACP rules (default for post-1988 marriages). See `property-regime-cpg.md` for CPG rules (default for pre-1988 marriages). See `surviving-spouse-share.md` for the Item 39 computation that yields ₱0 under SEPARATION. See `deduction-family-home.md` for the family home halving rule (halving applies only to conjugal/community Column B homes, not exclusive Column A).
