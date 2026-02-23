# Heir Concurrence Rules

**Aspect**: heir-concurrence-rules
**Wave**: 2 (Heir Classification Rules)
**Primary Legal Basis**: Arts. 887-903 (testate/legitime concurrence), Arts. 960-1014 (intestate concurrence)
**Depends On**: compulsory-heirs-categories

---

## Legal Basis

### The Fundamental Concurrence Rule (Art. 887 ¶2)

> "Compulsory heirs mentioned in Nos. 3, 4, and 5 are not excluded by those in Nos. 1 and 2; neither do they exclude one another."

This single paragraph establishes the entire concurrence framework:

- **Groups 1 and 2 are mutually exclusive**: Legitimate children/descendants (Group 1) exclude legitimate parents/ascendants (Group 2). Group 2 only inherits "in default of" Group 1.
- **Groups 3 and 4 always concur**: The surviving spouse (Group 3) and illegitimate children (Group 4) are NEVER excluded by Groups 1 or 2, and don't exclude each other.

### Intestate Exclusion Hierarchy (Arts. 960-1014)

The intestate order adds additional classes beyond compulsory heirs:

1. **Descending direct line** (Art. 978): Legitimate children/descendants — highest priority
2. **Ascending direct line** (Art. 985): Parents/ascendants — "to the exclusion of collateral relatives"
3. **Illegitimate children** (Art. 988): Inherit entire estate only "in the absence of legitimate descendants and ascendants"
4. **Surviving spouse** (Art. 995): Inherits entire estate only "in the absence of legitimate descendants and ascendants, and illegitimate children"
5. **Collateral relatives** (Art. 1003): Siblings, nephews/nieces, etc. — only if no descendants, ascendants, illegitimate children, or surviving spouse
6. **The State** (Art. 1011): Last resort — only "in default of persons entitled to succeed"

**Critical difference from testate**: In intestate succession, illegitimate children and the surviving spouse can be the SOLE heirs (they inherit the entire estate when no one higher in the hierarchy survives). In testate succession, they only receive their legitime.

---

## Exclusion Rules

### Rule 1: Primary vs Secondary Compulsory Heirs

```
// Art. 887(2): "In default of the foregoing"
function are_ascendants_compulsory(heirs: List<Heir>) -> bool {
  has_group1 = any(h for h in heirs
    where effective_category(h) == LEGITIMATE_CHILD_GROUP
    AND h.is_alive
    AND NOT is_excluded(h))
  return NOT has_group1
}
```

**Legal basis**: Art. 887(2) — legitimate parents/ascendants are compulsory "in default of" legitimate children/descendants.

**What "in default" means**:
- If even ONE legitimate child (or descendant by representation) survives → parents/ascendants get NO legitime
- "Default" = no surviving members of Group 1 at all (dead, incapacitated, all renounced)
- But if a child predeceases, their descendants may represent them (Art. 970) — so parents are still excluded

### Rule 2: Concurring Heirs Never Excluded

```
// Art. 887 ¶2
function is_spouse_excluded(heirs: List<Heir>) -> bool {
  // Spouse is NEVER excluded by other heir categories
  // Only excluded by own disqualification (legal separation guilt, unworthiness)
  return false  // categorical — other heirs cannot exclude spouse
}

function are_illegitimate_children_excluded(heirs: List<Heir>) -> bool {
  // Illegitimate children are NEVER excluded by other heir categories
  return false  // categorical — other heirs cannot exclude illegitimate children
}
```

### Rule 3: Nearer Excludes More Remote (Within Same Class)

```
// Art. 962: "the relative nearest in degree excludes the more distant ones"
// Art. 890: nearer ascendant excludes more remote ascendant
// Art. 986: parents exclude grandparents

function within_class_exclusion(heir: Heir, all_heirs: List<Heir>) -> bool {
  match heir.effective_category {
    LEGITIMATE_CHILD_GROUP:
      // Children inherit in own right; grandchildren only by representation
      // Art. 982: grandchildren inherit by right of representation
      if heir.degree_from_decedent > 1:
        // Only inherit if parent (the child of decedent) is dead/incapacitated/disinherited
        parent_line = find_parent_line(heir, all_heirs)
        return parent_line.is_alive AND NOT parent_line.is_excluded

    LEGITIMATE_ASCENDANT_GROUP:
      // Art. 986: "Should one only of [father/mother] survive, he or she shall
      // succeed to the child to the exclusion of the other ascendants"
      // Art. 890: nearer degree excludes more remote
      if heir.degree_from_decedent > 1:  // grandparent or higher
        return any(h for h in all_heirs
          where h.effective_category == LEGITIMATE_ASCENDANT_GROUP
          AND h.degree_from_decedent < heir.degree_from_decedent
          AND h.is_alive
          AND NOT is_excluded(h))
      return false

    ILLEGITIMATE_CHILD_GROUP:
      // All illegitimate children of the decedent inherit equally
      // No within-class exclusion (no "nearer" concept for direct children)
      return false

    SURVIVING_SPOUSE_GROUP:
      // Only one spouse possible
      return false
  }
}
```

### Rule 4: Intestate-Only Exclusion Hierarchy

In intestate succession, an additional exclusion hierarchy applies beyond compulsory heir rules:

```
// The complete intestate priority order
enum IntestateClass {
  CLASS_1_LEGITIMATE_DESCENDANTS,   // Arts. 978-984
  CLASS_2_LEGITIMATE_ASCENDANTS,    // Arts. 985-987
  CLASS_3_ILLEGITIMATE_CHILDREN,    // Arts. 988-993
  CLASS_4_SURVIVING_SPOUSE,         // Arts. 994-1002
  CLASS_5_COLLATERAL_RELATIVES,     // Arts. 1003-1010
  CLASS_6_STATE,                    // Arts. 1011-1014
}
```

**Key**: Classes 1-4 can CONCUR with each other (per specific articles), but they ALL exclude Classes 5 and 6.

```
function intestate_exclusion(heir_class: IntestateClass, surviving_classes: Set<IntestateClass>) -> bool {
  match heir_class {
    CLASS_5_COLLATERAL_RELATIVES:
      // Art. 1003: only if no descendants, ascendants, illegitimate children, or spouse
      return any of {CLASS_1, CLASS_2, CLASS_3, CLASS_4} in surviving_classes

    CLASS_6_STATE:
      // Art. 1011: only "in default of persons entitled to succeed"
      return any of {CLASS_1..CLASS_5} in surviving_classes

    // Classes 1-4: concurrence rules apply (they don't simply exclude each other)
    // See concurrence scenarios below
    _: return false
  }
}
```

**Special rule — Spouse + Collaterals (Art. 1001)**:

```
// Exception: Spouse does NOT fully exclude collaterals
// Art. 1001: "Should brothers and sisters or their children survive with the
// widow or widower, the latter shall be entitled to one-half of the inheritance
// and the brothers and sisters or their children to the other half."

// This applies ONLY when:
// - No legitimate descendants (Class 1)
// - No legitimate ascendants (Class 2)
// - No illegitimate children (Class 3)
// - Spouse survives WITH siblings/their children
```

---

## Complete Concurrence Scenarios

### Testate Concurrence (Legitime Allocation)

In testate succession, concurrence determines how the **legitime** is allocated. The **free portion** is whatever remains after all compulsory heirs' legitimes are satisfied.

| # | Surviving Groups | Art. | Legitime Allocation | Free Portion |
|---|-----------------|------|---------------------|-------------|
| T1 | G1 only | 888 | ½ to legitimate children (equal shares) | ½ |
| T2 | G1 + G3 (1 child) | 888, 892¶1 | ½ child; ¼ spouse | ¼ |
| T3 | G1 + G3 (2+ children) | 888, 892¶2 | ½ children; spouse = 1 child's share (from FP) | Remainder |
| T4 | G1 + G4 | 888, 895 | ½ legitimate; each illegit. = ½ legit. share (from FP) | Remainder |
| T5 | G1 + G3 + G4 | 888, 892, 895, 897 | ½ legitimate; spouse = 1 legit. share (from FP); each illegit. = ½ legit. share (from FP) | Remainder |
| T6 | G2 only | 889, 890 | ½ to parents/ascendants | ½ |
| T7 | G2 + G3 | 889, 893 | ½ ascendants; ¼ spouse (from FP) | ¼ |
| T8 | G2 + G4 | 889, 896 | ½ ascendants; ¼ illegitimate children (from FP) | ¼ |
| T9 | G2 + G3 + G4 | 889, 899 | ½ ascendants; ¼ illegit. (from FP); ⅛ spouse (from FP) | ⅛ |
| T10 | G3 + G4 | 894 | ⅓ spouse; ⅓ illegitimate children | ⅓ |
| T11 | G4 only | 901 | ½ to illegitimate children | ½ |
| T12 | G3 only | 900 | ½ spouse (⅓ if articulo mortis) | ½ (⅔) |
| T13 | None | 842 | No legitime | Entire estate |

**Special testate scenario — Illegitimate decedent's parents (Art. 903)**:

| # | Surviving Heirs | Art. | Allocation |
|---|----------------|------|-----------|
| T14 | Parents of illegitimate decedent only (no descendants, no spouse, no children) | 903¶1 | ½ to parents |
| T15 | Parents of illegitimate decedent + spouse (no children) | 903¶2 | ¼ parents; ¼ spouse |

### Intestate Concurrence (Entire Estate Distribution)

In intestate succession, the ENTIRE estate is distributed (no free portion concept). The concurrence rules differ from testate.

| # | Surviving Heirs | Art. | Distribution |
|---|----------------|------|-------------|
| I1 | Legitimate children only | 980 | Equal shares |
| I2 | Legitimate children + spouse | 996 | Spouse = one child's share; all shares equal |
| I3 | Legitimate + illegitimate children (no spouse) | 983, 895 | Illegitimate = ½ of legitimate share; ratio method |
| I4 | Legitimate + illegitimate children + spouse | 999, 983, 895 | Spouse = 1 legit. child's share; illegit. = ½ legit. share; ratio method |
| I5 | Legitimate parents only | 985, 986 | Equal shares (or all to survivor) |
| I6 | Legitimate parents + spouse | 997 | ½ parents; ½ spouse |
| I7 | Illegitimate children only | 988 | Equal shares (entire estate) |
| I8 | Illegitimate children + spouse | 998 | ½ spouse; ½ illegitimate children |
| I9 | Legitimate ascendants + illegitimate children | 991 | ½ ascendants; ½ illegitimate children |
| I10 | Legitimate ascendants + illegitimate children + spouse | 1000 | ½ ascendants; ¼ illegitimate; ¼ spouse |
| I11 | Spouse only | 995 | Entire estate (but see I12) |
| I12 | Spouse + siblings/nephews/nieces | 1001 | ½ spouse; ½ siblings |
| I13 | Siblings only | 1004, 1006 | Equal shares (full blood = 2×half blood) |
| I14 | Other collateral relatives (within 5th degree) | 1009, 1010 | Per degree of relationship |
| I15 | No heirs | 1011 | Entire estate to State |

---

## Concurrence Determination Algorithm

```
// Master algorithm: given a list of surviving heirs, determine the concurrence scenario

function determine_testate_scenario(heirs: List<Heir>) -> TestateScenario {
  // Step 1: Identify which effective groups are present
  has_group1 = any(h for h in heirs where effective_category(h) == LEGITIMATE_CHILD_GROUP AND is_eligible(h))
  has_group2 = any(h for h in heirs where effective_category(h) == LEGITIMATE_ASCENDANT_GROUP AND is_eligible(h))
  has_group3 = any(h for h in heirs where effective_category(h) == SURVIVING_SPOUSE_GROUP AND is_eligible(h))
  has_group4 = any(h for h in heirs where effective_category(h) == ILLEGITIMATE_CHILD_GROUP AND is_eligible(h))

  // Step 2: Apply mutual exclusion (Group 1 excludes Group 2)
  if has_group1:
    has_group2 = false  // Art. 887(2)

  // Step 3: Special case — is decedent an illegitimate child? (Art. 903)
  if decedent.is_illegitimate:
    return determine_illegitimate_decedent_scenario(has_group2, has_group3, has_group4, heirs)

  // Step 4: Map to scenario
  count_group1 = count(h for h in heirs where effective_category(h) == LEGITIMATE_CHILD_GROUP AND is_eligible(h))

  match (has_group1, has_group2, has_group3, has_group4) {
    (true,  false, false, false) => T1   // Legitimate children only
    (true,  false, true,  false) =>
      if count_group1 == 1: T2           // 1 legitimate child + spouse
      else: T3                            // 2+ legitimate children + spouse
    (true,  false, false, true)  => T4   // Legitimate children + illegitimate children
    (true,  false, true,  true)  => T5   // Legitimate + illegitimate + spouse
    (false, true,  false, false) => T6   // Ascendants only
    (false, true,  true,  false) => T7   // Ascendants + spouse
    (false, true,  false, true)  => T8   // Ascendants + illegitimate children
    (false, true,  true,  true)  => T9   // Ascendants + illegitimate + spouse
    (false, false, true,  true)  => T10  // Spouse + illegitimate children only
    (false, false, false, true)  => T11  // Illegitimate children only
    (false, false, true,  false) => T12  // Surviving spouse only
    (false, false, false, false) => T13  // No compulsory heirs
  }
}

function determine_intestate_scenario(heirs: List<Heir>) -> IntestateScenario {
  // Same group detection as testate
  has_group1 = /* legitimate children/descendants */
  has_group2 = /* legitimate ascendants */
  has_group3 = /* surviving spouse */
  has_group4 = /* illegitimate children */

  if has_group1: has_group2 = false  // mutual exclusion

  count_group1 = count(group1 heirs)

  // Check for collateral relatives (intestate-only class)
  has_collaterals = any(h for h in heirs where h.is_collateral AND is_eligible(h))

  match (has_group1, has_group2, has_group3, has_group4) {
    (true,  false, false, false) => I1
    (true,  false, true,  false) => I2
    (true,  false, false, true)  => I3
    (true,  false, true,  true)  => I4
    (false, true,  false, false) => I5
    (false, true,  true,  false) => I6
    (false, false, true,  false) =>
      if has_collaterals: I12           // Spouse + siblings
      else: I11                          // Spouse alone
    (false, false, false, true)  => I7
    (false, false, true,  true)  => I8
    (false, true,  false, true)  => I9
    (false, true,  true,  true)  => I10
    (false, false, false, false) =>
      if has_collaterals: I13 or I14    // Collaterals only
      else: I15                          // No heirs → State
  }
}
```

### Eligibility Check (Pre-Concurrence Filter)

```
function is_eligible(heir: Heir) -> bool {
  // An heir must pass ALL of these to participate in concurrence
  if NOT heir.is_alive AND NOT has_representation(heir):
    return false                    // Dead with no representatives

  if heir.is_unworthy AND NOT heir.unworthiness_condoned:
    return false                    // Art. 1032, 1033

  if heir.effective_category == ILLEGITIMATE_CHILD_GROUP AND NOT heir.filiation_proved:
    return false                    // Art. 887 ¶3

  if heir.effective_category == SURVIVING_SPOUSE_GROUP AND heir.legal_separation_guilty:
    return false                    // Art. 1002

  if heir.raw_category == ADOPTED_CHILD AND heir.adoption_rescinded:
    return false                    // RA 8552 Sec. 20

  if heir.is_disinherited AND heir.disinheritance_valid:
    // Disinherited heir is excluded, but their children may represent (Art. 923)
    return false                    // The heir themselves is excluded

  // Has renounced? (Art. 1041)
  if heir.has_renounced:
    return false

  return true
}
```

---

## Interactions Between Scenarios

### Testate ↔ Intestate Differences

The concurrence scenarios produce DIFFERENT shares depending on whether succession is testate or intestate:

| Heirs Present | Testate (Legitime) | Intestate |
|--------------|-------------------|-----------|
| Legitimate children + spouse | Children: ½ (shared); Spouse: ¼ or = 1 child (from FP) | All equal shares (Art. 996) |
| Parents + spouse | Parents: ½; Spouse: ¼ | Parents: ½; Spouse: ½ (Art. 997) |
| Illegitimate children + spouse | Each: ⅓; FP: ⅓ | Each: ½ (Art. 998) |
| Parents + illegitimate + spouse | Parents: ½; Illegit: ¼; Spouse: ⅛ | Parents: ½; Illegit: ¼; Spouse: ¼ (Art. 1000) |

**Key insight for the engine**: The same heir combination produces different numerical results depending on succession type. The engine must first determine succession type (testate/intestate/mixed), THEN apply the correct scenario.

### Mixed Succession Concurrence

In mixed succession (Art. 778, 780), both testate and intestate rules apply:

```
function mixed_succession(estate, will, heirs) {
  // Step 1: Identify what the will disposes of
  testate_portion = sum(will.dispositions)
  intestate_portion = estate - testate_portion

  // Step 2: Validate testate portion against compulsory heirs' legitime
  // (Uses testate concurrence rules)
  validate_legitime(estate, will, heirs)

  // Step 3: Distribute undisposed portion per intestate rules
  // (Uses intestate concurrence rules)
  distribute_intestate(intestate_portion, heirs)
}
```

### The Cap Rule (Art. 895 ¶3) — Concurrence Constraint

> "The legitime of the illegitimate children shall be taken from the portion of the estate at the free disposal of the testator, provided that in no case shall the total legitime of such illegitimate children exceed that free portion, and that the legitime of the surviving spouse must first be fully satisfied."

This creates a **priority ordering within concurrence**:

```
// When G1 + G3 + G4 or G2 + G3 + G4 concur:
function apply_cap_rule(estate, legitimate_heirs_legitime, spouse_legitime, illegitimate_children_legitime) {
  free_portion = estate - legitimate_heirs_legitime  // ½ of estate

  // Priority 1: Spouse's legitime satisfied first
  remaining_fp = free_portion - spouse_legitime
  assert remaining_fp >= 0  // By construction, spouse's share is defined to fit

  // Priority 2: Illegitimate children's total capped at remaining free portion
  if illegitimate_children_legitime > remaining_fp:
    illegitimate_children_legitime = remaining_fp  // Cap applied
    // Note: individual shares are reduced proportionally

  return (spouse_legitime, illegitimate_children_legitime)
}
```

**When does the cap bite?** When there are many illegitimate children relative to the estate:

Example: Estate = ₱10,000,000. 1 legitimate child + spouse + 5 illegitimate children.
- Legitimate child legitime: ½ × ₱10M = ₱5,000,000
- Free portion: ₱5,000,000
- Spouse legitime (Art. 892): ¼ × ₱10M = ₱2,500,000 → remaining FP = ₱2,500,000
- Each illegitimate child's computed legitime: ½ × ₱5M = ₱2,500,000
- Total illegitimate = 5 × ₱2,500,000 = ₱12,500,000 — but cap = ₱2,500,000!
- Each illegitimate child gets: ₱2,500,000 ÷ 5 = ₱500,000 (not ₱2,500,000)

### Collateral Relative Concurrence (Intestate Only)

Collateral relatives (siblings, nephews/nieces, cousins) only participate in intestate succession and only when ALL of the following are absent:
- Legitimate descendants (Group 1)
- Legitimate ascendants (Group 2)
- Illegitimate children (Group 4)

```
function collateral_concurrence(heirs: List<Heir>) -> CollateralScenario {
  has_spouse = any(h where effective_category(h) == SURVIVING_SPOUSE_GROUP AND is_eligible(h))
  has_siblings = any(h where h.is_sibling AND is_eligible(h))
  has_nephews_nieces = any(h where h.is_nephew_niece AND is_eligible(h))
  has_other_collaterals = any(h where h.is_collateral AND h.degree <= 5 AND is_eligible(h))

  if has_spouse AND (has_siblings OR has_nephews_nieces):
    // Art. 1001: ½ to spouse, ½ to siblings/their children
    return SPOUSE_WITH_SIBLINGS

  if has_siblings:
    // Art. 1004-1008: full blood = 2× half blood share
    return SIBLINGS_ONLY

  if has_nephews_nieces:
    // Art. 1005: per stirpes if concurring with surviving aunts/uncles, per capita if alone (Art. 975)
    return NEPHEWS_NIECES

  if has_other_collaterals:
    // Art. 1009: within 5th degree, no line distinction
    return OTHER_COLLATERALS

  return NO_COLLATERALS
}
```

### Sibling Full-Blood vs Half-Blood Rule (Art. 1006)

```
// Art. 1006: full blood siblings get double the share of half-blood siblings
function sibling_shares(siblings: List<Sibling>) {
  full_blood = filter(s where s.is_full_blood, siblings)
  half_blood = filter(s where s.is_half_blood, siblings)

  // Full blood = 2 units; half blood = 1 unit
  total_units = (count(full_blood) * 2) + (count(half_blood) * 1)

  for each sibling in full_blood:
    share = 2 / total_units
  for each sibling in half_blood:
    share = 1 / total_units
}
```

---

## Edge Cases

### 1. All Compulsory Heirs Renounce (Arts. 969, 1041)

- **Rule**: If the nearest relatives ALL renounce, the next degree inherits IN THEIR OWN RIGHT (not by representation) — Art. 969
- **Engine logic**: Re-run concurrence determination after removing renouncing heirs
- **Important**: Renouncing heirs' children do NOT represent them for renunciation (unlike predecease/disinheritance). Art. 977: "Heirs who repudiate their share may not be represented."

### 2. Accretion Among Co-Heirs (Arts. 1015-1023)

- **Rule**: When one co-heir cannot receive (dies before testator, renounces, incapacitated), their share accrues to co-heirs
- **Testate vs intestate distinction**:
  - Art. 1018: In intestate succession, the repudiating heir's share ALWAYS accrues to co-heirs of the same degree
  - Art. 1021: Among compulsory heirs, accretion of the **legitime** is "in their own right" (not accretion). Accretion proper only applies to the **free portion**.
- **Engine logic**: After concurrence, check if any eligible heir cannot receive. If so, redistribute their share per accretion rules.

### 3. Surviving Spouse Concurring with Both Legitimate AND Illegitimate Children (T5/I4)

This is the most complex concurrence scenario. Multiple articles interact:
- Art. 888: Legitimate children get ½ as collective legitime
- Art. 892: Spouse gets share equal to one child (2+ children) or ¼ (1 child)
- Art. 895: Each illegitimate child gets ½ of one legitimate child's legitime
- Art. 897: Confirms spouse gets legitimate child's share even with illegitimate children present
- Art. 895 ¶3: Cap rule — illegitimate children's total cannot exceed free portion; spouse satisfied first

**Testate computation**:
```
per_legit_child = (estate / 2) / count_legitimate_children
spouse_share = per_legit_child  // Art. 897 (if 2+ children) or estate/4 (if 1 child)
per_illegit_child = per_legit_child / 2  // Art. 895

total_legitime = (estate / 2)                       // legitimate children
              + spouse_share                         // spouse
              + (per_illegit_child * count_illegit)  // illegitimate (capped at free_portion - spouse)
free_portion = estate - total_legitime
```

**Intestate computation** (Art. 999, ratio method):
```
// Art. 999: spouse = 1 legitimate child share; Art. 983/895: illegitimate = ½ legitimate
legit_unit = 2
illegit_unit = 1
spouse_unit = 2  // same as legitimate child
total_units = (count_legit * 2) + (count_illegit * 1) + 2

per_unit = estate / total_units
```

### 4. Only Illegitimate Decedent's Parents Survive (Art. 903)

When the decedent is themselves an illegitimate child, Art. 903 creates a special concurrence:

```
function illegitimate_decedent_parents(has_descendants, has_spouse, has_illegit_children, parents) {
  // Art. 903 ¶1: no descendants, no spouse, no children → parents get ½
  if NOT has_descendants AND NOT has_spouse AND NOT has_illegit_children:
    return parents_get(1/2)  // Free portion = ½

  // Art. 903 ¶2: if only children survive → parents get NOTHING
  if has_descendants OR has_illegit_children:
    return parents_get(0)

  // Art. 903 ¶2: if only spouse survives with parents
  if has_spouse AND NOT has_descendants AND NOT has_illegit_children:
    return {parents: 1/4, spouse: 1/4}  // Free portion = ½
}
```

### 5. Legal Separation: Innocent vs Guilty Spouse

- **Art. 892 ¶2**: In legal separation, the surviving spouse "may inherit if it was the deceased who had given cause for the same" — i.e., if the spouse is the INNOCENT party
- **Art. 1002**: If the surviving spouse GAVE CAUSE for the separation (guilty), they lose ALL inheritance rights
- **Engine logic**: The concurrence determination must check `spouse.legal_separation_guilty` BEFORE including the spouse in the scenario. A guilty spouse is treated as if there is NO surviving spouse.

### 6. One Legitimate Child vs Two or More

Art. 892 creates a branching rule depending on the count of legitimate children:
- **One child**: Spouse gets **¼ of the estate** (a fixed fraction, Art. 892 ¶1)
- **Two or more**: Spouse gets a share **equal to one child's share of the ½ legitime** (Art. 892 ¶2)

```
function spouse_share_with_children(estate, count_legit_children) {
  if count_legit_children == 1:
    return estate * 1/4  // Art. 892 ¶1: fixed ¼

  // Art. 892 ¶2: equal to one child's share of the collective legitime
  per_child_legitime = (estate * 1/2) / count_legit_children
  return per_child_legitime
}
```

Note: When count = 1, the per-child share would be ½ × estate = ₱5M (for a ₱10M estate), but the spouse gets ¼ = ₱2.5M — NOT equal to the child's share. This is a deliberate asymmetry in the law.

When count = 2, per-child = ¼ × estate = ₱2.5M, and spouse also gets ₱2.5M = ¼. The ¼ coincidence is only because of the math with 2 children.

### 7. Representation Creates "Virtual" Children for Concurrence Counting

When a legitimate child predeceases or is disinherited, their descendants represent them. For concurrence purposes:

```
function count_legitimate_child_lines(heirs: List<Heir>) -> int {
  // Each surviving legitimate child = 1 line
  // Each represented predeceased/disinherited child = 1 line (regardless of how many grandchildren)
  lines = 0
  for child in decedent.children:
    if child.effective_category == LEGITIMATE_CHILD_GROUP:
      if child.is_alive AND is_eligible(child):
        lines += 1
      elif has_eligible_descendants(child):
        lines += 1  // Representation: counts as 1 line
  return lines
}
```

This count affects the spouse's share (Art. 892) and the per-line legitime split.

---

## Test Implications

### Concurrence Determination Tests

| # | Heirs Present | Expected Testate Scenario | Expected Intestate Scenario |
|---|--------------|--------------------------|---------------------------|
| 1 | 2 legitimate children | T1 | I1 |
| 2 | 2 legitimate children + spouse | T3 | I2 |
| 3 | 1 legitimate child + spouse | T2 | I2 |
| 4 | 2 legitimate + 1 illegitimate + spouse | T5 | I4 |
| 5 | Both parents (no children) | T6 | I5 |
| 6 | Both parents + spouse | T7 | I6 |
| 7 | Both parents + 2 illegitimate + spouse | T9 | I10 |
| 8 | 2 illegitimate + spouse (no legitimate heirs) | T10 | I8 |
| 9 | 3 illegitimate only | T11 | I7 |
| 10 | Spouse only | T12 | I11 |
| 11 | Spouse + 2 siblings | N/A (no compulsory) | I12 |
| 12 | No heirs at all | T13 | I15 |

### Exclusion Tests

| # | Test | Expected Result |
|---|------|----------------|
| 13 | 2 legitimate children + both parents | Parents excluded (Group 1 excludes Group 2) |
| 14 | Grandchildren only (children predeceased) + parents | Grandchildren represent → parents excluded |
| 15 | 2 legitimate children + guilty spouse | Spouse excluded (Art. 1002) → scenario = T1 not T3 |
| 16 | All children renounce + parents survive | Parents NOW compulsory (Group 1 gone) → scenario T6 |
| 17 | 1 illegitimate (filiation not proved) + spouse | Illegitimate excluded → scenario = T12 |

### Cap Rule Tests

| # | Test | Expected Result |
|---|------|----------------|
| 18 | 1 legit child + spouse + 10 illegitimate children (estate ₱10M) | Total illegit. legitime capped; each illegit. gets much less than ½ of legit. child |
| 19 | 1 legit child + spouse + 1 illegitimate child (estate ₱10M) | No cap needed; all fit within free portion |

### Accretion Tests

| # | Test | Expected Result |
|---|------|----------------|
| 20 | 3 legitimate children, 1 renounces (intestate) | Renouncing heir's share accrues to 2 remaining children (Art. 1018) |
| 21 | 3 legitimate children, 1 renounces — renouncing heir has children | Children do NOT represent (Art. 977); accretion to co-heirs |

---

## Engine Pipeline Integration

The heir-concurrence determination is **Step 2** in the computation pipeline:

```
Step 1: Classify all heirs (compulsory-heirs-categories)
         ↓
Step 2: Determine concurrence scenario (THIS ASPECT)
         - Filter eligible heirs
         - Apply within-class exclusion
         - Apply Group 1 vs Group 2 exclusion
         - Map to scenario code (T1-T13 or I1-I15)
         ↓
Step 3: Compute each heir's legitime share (Wave 3: legitime-table)
Step 4: Distribute free portion (Wave 4: distribution rules)
```

The scenario code from Step 2 is the **key input** for Step 3 — it determines which legitime fractions apply.

---

*Analysis based on Civil Code Arts. 887-903, 960-1014, 1015-1023, Family Code Art. 176.*
