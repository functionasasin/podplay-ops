# Adopted Children's Succession Rights

**Aspect**: adopted-children-rights
**Wave**: 2 (Heir Classification Rules)
**Primary Legal Basis**: RA 8552 Secs. 16-20, RA 11642 Secs. 41-43, 47; Civil Code Arts. 979, 984; Family Code Art. 189
**Depends On**: compulsory-heirs-categories

---

## Legal Basis

### RA 8552, Sec. 17 — Full Legitimacy (1998)

> "The adoptee shall be considered the legitimate son/daughter of the adopter(s) for all intents and purposes and as such is entitled to all the rights and obligations provided by law to legitimate sons/daughters born to them without discrimination of any kind."

### RA 8552, Sec. 18 — Succession Rights

> "In legal and intestate succession, the adopter(s) and the adoptee shall have reciprocal rights of succession without distinction from legitimate filiation. However, if the adoptee and his/her biological parent(s) had left a will, the law on testamentary succession shall govern."

### RA 8552, Sec. 16 — Severance of Biological Ties

> "Except in cases where the biological parent is the spouse of the adopter, all legal ties between the biological parent(s) and the adoptee shall be severed and the same shall then be vested on the adopter(s)."

### RA 11642, Sec. 41 — Extended Legitimacy (2022, supersedes RA 8552 Sec. 17)

> "The adoptee shall be considered the legitimate child of the adopter for all intents and purposes and as such is entitled to all the rights and obligations provided by law to legitimate children born to them without discrimination of any kind."

**Critical extension**: Sec. 41 explicitly states that the filiation created between the adopter and the adoptee **extends to the adopter's parents, legitimate siblings, and legitimate descendants**. This breaks the old "exclusivity rule" that limited the adoption relationship to only the adopter and adoptee.

### RA 11642, Sec. 42 — Severance of Biological Ties

> Upon issuance of the Order of Adoption, all legal ties between the biological parent(s) and the adoptee are severed and parental authority is vested in the adopter(s). Exception: where the biological parent is the spouse of the adopter.

### RA 11642, Sec. 43 — Succession

> "In testate and intestate succession, the adopters and the adoptee shall have reciprocal rights of succession without distinction from legitimate filiations."

Testamentary succession exception: If the adoptee and biological parent(s) had left a will, testamentary succession law governs.

### RA 11642, Sec. 47 — Rescission

Adoption may be rescinded only by the adoptee, on grounds of: (a) repeated maltreatment, (b) attempt on adoptee's life, or (c) abandonment by the adopter.

**Effect of rescission**: Legal ties between adoptee and adoptive parents are severed. Succession rights from the adopter are nullified. The child is restored to the parental authority of biological parents if available and willing.

### Civil Code Art. 979 — Intestate: Adopted Child as Legitimate

> "An adopted child succeeds to the property of the adopting parents in the same manner as a legitimate child."

### Civil Code Art. 984 — Death of Adopted Child (SUPERSEDED)

> "In case of the death of an adopted child, leaving no children or descendants, his parents and relatives by consanguinity and not by adoption, shall be his legal heirs."

**Status**: This provision is **superseded** by RA 8552 Sec. 16 (which severs biological ties) and further by RA 11642 Sec. 41 (which extends filiation to adopter's relatives). Under lex posteriori derogat priori, the later statutes prevail. The engine must NOT apply Art. 984 — the adopter (and now under RA 11642, the adopter's relatives) inherits from the adoptee, not the biological parents.

---

## Rule (Pseudocode)

### Classification

```
function classify_adopted_child(person, decedent) -> HeirCategory | null {
  // Precondition: person was adopted by decedent (or decedent is related to the adopter)

  // 1. Check if adoption exists and is valid
  if NOT person.has_valid_adoption_decree:
    return null

  // 2. Check if adoption has been rescinded
  if person.adoption_rescinded:
    if person.adoption_rescission_date < decedent.date_of_death:
      return null  // RA 11642 Sec. 47: rescission nullifies succession rights
    else:
      // Rescission after death has no retroactive effect on opened succession
      // Treat as adopted at time of death
      pass

  // 3. Determine relationship to decedent
  if decedent == person.adoptive_parent:
    // Direct adoption: adopted child of the decedent
    return ADOPTED_CHILD  // → effective_category = LEGITIMATE_CHILD_GROUP

  if decedent == person.adoptive_parent.parent:
    // RA 11642 Sec. 41: adoptee is grandchild of adopter's parents
    // Only for RA 11642 adoptions (post-Jan 6, 2022)
    return LEGITIMATE_DESCENDANT_BY_REPRESENTATION  // if adopter predeceased
    // or: inherits from grandparent via standard descent rules

  // 4. Stepparent adoption exception (RA 8552 Sec. 16 / RA 11642 Sec. 42)
  if person.biological_parent == decedent AND person.other_parent.is_spouse_of(adopter):
    // Biological ties NOT severed for the biological parent who is the adopter's spouse
    // Child retains inheritance rights from BOTH biological parent AND adopter
    return LEGITIMATE_CHILD  // retains biological legitimate status vis-à-vis this parent

  return null
}
```

### Full Equivalence Verification

```
function adopted_child_share(adopted_child, all_heirs, estate, succession_type) {
  // Core rule: adopted child is treated IDENTICALLY to biological legitimate child
  // RA 8552 Sec. 17 / RA 11642 Sec. 41: "without discrimination of any kind"

  // Map to LEGITIMATE_CHILD_GROUP
  assert effective_category(adopted_child) == LEGITIMATE_CHILD_GROUP

  // The adopted child receives:
  // - Same legitime fraction as a biological legitimate child
  // - Same intestate share as a biological legitimate child
  // - Same right of representation as a biological legitimate child
  // - Same collation obligations as a biological legitimate child

  // There is NO computation difference between adopted and biological legitimate children
  return compute_legitimate_child_share(adopted_child, all_heirs, estate, succession_type)
}
```

### Reciprocal Succession (Adopter from Adoptee)

```
function adopter_inheriting_from_adoptee(adopter, adoptee_estate) {
  // RA 8552 Sec. 18 / RA 11642 Sec. 43: reciprocal rights

  // The adopter inherits from the adoptee in the same manner as a
  // biological legitimate parent inherits from a legitimate child

  // This means:
  // - If adoptee dies with no descendants: adopter is a compulsory heir (Art. 887(2))
  // - If adoptee dies with descendants: adopter is NOT a compulsory heir (excluded by Group 1)
  // - Adopter's legitime from adoptee: ½ of estate (Art. 889), shared with other parent if any

  // Under RA 11642: adopter's PARENTS can also inherit from adoptee
  // (as grandparents, per Art. 890 if adopter predeceased)
}
```

---

## Two Legal Regimes: RA 8552 vs RA 11642

The engine must handle adoptions under BOTH regimes, as existing adoptions under RA 8552 remain valid.

| Feature | RA 8552 (1998) | RA 11642 (2022) |
|---------|---------------|----------------|
| Adoptee = legitimate child of adopter | Yes (Sec. 17) | Yes (Sec. 41) |
| Succession rights with adopter | Reciprocal, no distinction (Sec. 18) | Reciprocal, no distinction (Sec. 43) |
| Filiation extends to adopter's relatives | **No** (exclusivity rule) | **Yes** (Sec. 41: parents, siblings, descendants) |
| Adoptee inherits from adopter's parents | **No** (old rule: adoption is personal) | **Yes** (adoptee is grandchild of adopter's parents) |
| Adopter's parents inherit from adoptee | **No** | **Yes** (per Art. 890 if adopter predeceased) |
| Biological ties severed | Yes, except spouse-of-adopter (Sec. 16) | Yes, except spouse-of-adopter (Sec. 42) |
| Rescission grounds | Broad (Art. 191 FC as modified) | Limited to adoptee only: maltreatment, attempt on life, abandonment (Sec. 47) |
| Rescission effects | Reverts to pre-adoption; vested rights preserved (Sec. 20) | Succession rights nullified; restored to biological parents |
| Who can rescind | Adopter or adoptee | Only the adoptee |

### Engine Implication

```
struct Adoption {
  decree_date: Date,
  is_under_ra_11642: bool,     // true if decree_date >= 2022-01-06
  adopter: Person,
  adoptee: Person,
  is_stepparent_adoption: bool, // biological parent is adopter's spouse
  is_rescinded: bool,
  rescission_date: Date | null,
}

function determine_adoption_regime(adoption: Adoption) -> AdoptionRegime {
  if adoption.decree_date >= Date("2022-01-06"):
    return RA_11642
  else:
    return RA_8552
}

function can_inherit_from_adopter_relative(adoptee, adopter_relative, adoption) -> bool {
  // Only under RA 11642 does filiation extend to adopter's relatives
  if adoption.regime == RA_8552:
    return false  // Old exclusivity rule: no inheritance from adopter's relatives

  if adoption.regime == RA_11642:
    // Sec. 41: filiation extends to adopter's parents, legitimate siblings,
    // and legitimate descendants
    if adopter_relative is adopter.parent:
      return true  // adoptee is grandchild
    if adopter_relative is adopter.legitimate_sibling:
      return true  // adoptee is nephew/niece
    if adopter_relative is adopter.legitimate_descendant:
      return true  // adoptee is sibling
    return false  // other relatives: not covered by Sec. 41
}
```

---

## Computation Impact

### Core Rule: No Distinction from Biological Legitimate Children

For ALL computation purposes, an adopted child with a valid, unrescinded adoption is identical to a biological legitimate child:

| Computation Step | Adopted Child Treatment | Legal Basis |
|-----------------|------------------------|-------------|
| Heir classification | LEGITIMATE_CHILD_GROUP | RA 8552 Sec. 17 / RA 11642 Sec. 41 |
| Legitime computation | Same fraction as biological legitimate child | Art. 888: ½ of estate shared equally |
| Intestate share | Same share as biological legitimate child | Art. 979, 980 |
| Concurrence counting | Counts as 1 legitimate child line | Art. 892 count |
| Spouse's share (Art. 892) | Adopted children included in the count | 1 vs 2+ branching |
| Representation | Can be represented by their descendants if they predecease | Arts. 970-977 |
| Collation | Subject to same collation rules as legitimate child | Art. 1061 |
| Disinheritance | Can be disinherited on same grounds as legitimate child | Art. 919 |
| Preterition | Omission triggers Art. 854 annulment | Art. 854 (direct line) |

### Worked Example: 2 Biological + 1 Adopted Child + Spouse (Intestate)

**Facts**: Estate = ₱12,000,000. Decedent survived by 2 biological legitimate children (LC1, LC2), 1 adopted child (AC1), and surviving spouse (S).

**Classification**:
- LC1, LC2: LEGITIMATE_CHILD (biological) → LEGITIMATE_CHILD_GROUP
- AC1: ADOPTED_CHILD → LEGITIMATE_CHILD_GROUP (no distinction)
- S: SURVIVING_SPOUSE → SURVIVING_SPOUSE_GROUP

**Intestate Distribution** (Art. 996: spouse = one child's share):
- Total shares: 4 (3 children + 1 spouse)
- Per share: ₱12,000,000 ÷ 4 = ₱3,000,000

| Heir | Share | Amount | Basis |
|------|-------|--------|-------|
| LC1 | ¼ | ₱3,000,000 | Art. 980 |
| LC2 | ¼ | ₱3,000,000 | Art. 980 |
| AC1 | ¼ | ₱3,000,000 | Art. 979, RA 8552 Sec. 17 |
| S | ¼ | ₱3,000,000 | Art. 996 |
| **Total** | | **₱12,000,000** | |

**Key**: AC1's share is identical to LC1 and LC2. No computation difference whatsoever.

### Worked Example: Adopted Child with Illegitimate Sibling (Testate)

**Facts**: Estate = ₱10,000,000. Decedent dies testate. Survived by 1 adopted child (AC1) and 1 illegitimate child (IC1). No spouse. Will: "I leave the free portion to Charity C."

**Classification**:
- AC1: ADOPTED_CHILD → LEGITIMATE_CHILD_GROUP
- IC1: ILLEGITIMATE_CHILD → ILLEGITIMATE_CHILD_GROUP

**Testate (Scenario T4)**:
- AC1's legitime: ½ × ₱10M = ₱5,000,000 (Art. 888; only 1 legitimate child)
- IC1's legitime: ½ × ₱5M = ₱2,500,000 (Art. 895/FC 176; ½ of legitimate child's legitime)
- Free portion: ₱10M - ₱5M - ₱2.5M = ₱2,500,000 → to Charity C

| Heir | Legitime | Free Portion | Total | Basis |
|------|----------|-------------|-------|-------|
| AC1 | ₱5,000,000 | — | ₱5,000,000 | Art. 888, RA 8552 Sec. 17 |
| IC1 | ₱2,500,000 | — | ₱2,500,000 | Art. 895, FC 176 |
| Charity C | — | ₱2,500,000 | ₱2,500,000 | Will |
| **Total** | **₱7,500,000** | **₱2,500,000** | **₱10,000,000** | |

**Key**: The adopted child AC1 is the sole "legitimate child" for Art. 888 purposes. IC1 gets half of AC1's share, exactly as if AC1 were biological.

---

## Interactions

### 1. Adopted Child + Biological Legitimate Children

- **Rule**: No distinction. All share the collective ½ legitime equally.
- **Legal basis**: RA 8552 Sec. 17 / RA 11642 Sec. 41 ("without discrimination of any kind")
- **Engine logic**: When counting legitimate children for Art. 888/892, include adopted children in the count.

### 2. Adopted Child + Illegitimate Children

- **Rule**: The illegitimate child's legitime is ½ of the adopted child's legitime, just as it would be ½ of any legitimate child's legitime.
- **Legal basis**: Art. 895 / FC 176
- **Engine logic**: For the ratio method, adopted child = 2 units, illegitimate child = 1 unit.

### 3. Adopted Child + Surviving Spouse

- **Rule**: Same interaction as biological legitimate child + spouse.
- **Art. 892 branching**: Adopted children are included in the count for the 1 vs 2+ determination.
  - 1 adopted child + spouse: spouse gets ¼ (Art. 892 ¶1)
  - 2+ children (any mix of adopted/biological) + spouse: spouse gets = 1 child's share (Art. 892 ¶2)

### 4. Adopted Child + Biological Parents of Decedent

- **Rule**: Adopted child is in LEGITIMATE_CHILD_GROUP → excludes LEGITIMATE_ASCENDANT_GROUP.
- **Legal basis**: Art. 887(2) ("in default of the foregoing")
- **Engine logic**: Even a single adopted child excludes both biological parents from being compulsory heirs.

### 5. Biological Parents of Adopted Child vs Adoptive Parents

- **Rule**: Upon valid adoption, biological parents lose ALL succession rights from the adoptee (RA 8552 Sec. 16 / RA 11642 Sec. 42). The adoptive parents have full succession rights.
- **Exception**: Stepparent adoption — if one biological parent is the adopter's spouse, that biological parent's ties are NOT severed.
- **Engine logic**: When the decedent is the adopted child, classify the ADOPTIVE parents as LEGITIMATE_PARENT, NOT the biological parents (unless stepparent adoption preserves the biological parent tie).

### 6. Adopted Child and Iron Curtain Rule (Art. 992)

- **Rule**: Art. 992 creates a barrier between illegitimate children and the legitimate family. However, an adopted child is a LEGITIMATE child — Art. 992 does not apply to adopted children.
- **Under RA 8552**: The adopted child could inherit from the adopter but NOT from the adopter's relatives (exclusivity rule, not Art. 992).
- **Under RA 11642**: The adopted child CAN inherit from the adopter's parents, legitimate siblings, and legitimate descendants (Sec. 41 breaks the exclusivity rule).
- **Engine logic**: Art. 992 is irrelevant for adopted children. For RA 11642 adoptees, check `can_inherit_from_adopter_relative()`.

### 7. Adopted Child's Own Descendants (Representation)

- **Rule**: If the adopted child predeceases the decedent (adopter), the adopted child's own children (whether biological or adopted) can represent them under Arts. 970-977.
- **Legal basis**: The adopted child is a legitimate child; representation operates normally in the descending line.
- **Engine logic**: Build representation lines for adopted children exactly as for biological legitimate children.

---

## Edge Cases

### 1. Rescission of Adoption — Timing and Effects

**Under RA 8552 (Sec. 20)**:
- Rescission extinguishes reciprocal rights prospectively from the date of judgment
- **Vested rights preserved**: Inheritances already received are not returned
- After rescission, adoptee is considered a legitimated child of biological parent(s) (Sec. 20(a))

**Under RA 11642 (Sec. 47)**:
- Only the adoptee can initiate rescission (not the adopter)
- Grounds limited to: maltreatment, attempt on life, abandonment
- Succession rights from adopter are nullified
- Child restored to biological parents if available

**Engine logic**:
```
function rescission_effect(adoption, decedent_death_date) {
  if NOT adoption.is_rescinded:
    return ADOPTION_VALID  // Full rights

  if adoption.rescission_date > decedent_death_date:
    return ADOPTION_VALID  // Succession already opened; rescission cannot retroact

  // Rescission before death → no succession rights from adopter
  if adoption.regime == RA_8552:
    // Sec. 20(a): adoptee becomes legitimated child of biological parents
    return REVERTS_TO_LEGITIMATED_CHILD

  if adoption.regime == RA_11642:
    // Restored to biological parents
    return REVERTS_TO_BIOLOGICAL
}
```

### 2. Stepparent Adoption (Biological Parent is Adopter's Spouse)

**Rule**: RA 8552 Sec. 16 / RA 11642 Sec. 42 — when one biological parent is the spouse of the adopter, that biological parent's legal ties are NOT severed.

**Effect**: The child has inheritance rights from BOTH:
- The adopter (as an adopted/legitimate child)
- The biological parent who is the adopter's spouse (biological ties preserved)

**Engine logic**:
```
function stepparent_adoption_rights(child, decedent) {
  if child.adoption.is_stepparent_adoption:
    if decedent == child.adoptive_parent:
      return LEGITIMATE_CHILD_GROUP  // from adopter
    if decedent == child.biological_parent_married_to_adopter:
      return LEGITIMATE_CHILD_GROUP  // biological ties preserved
    if decedent == child.other_biological_parent:
      return null  // ties severed with the non-spouse biological parent
}
```

**Test case**: Child C was born to Father F and Mother M. M marries Stepfather SF. SF adopts C (stepparent adoption).
- C inherits from SF as adopted legitimate child ✓
- C inherits from M as biological legitimate child ✓ (ties with M not severed)
- C does NOT inherit from F (ties with F severed upon adoption) ✗

### 3. Death of Adopted Child — Who Inherits?

**Old rule (Civil Code Art. 984)**: When adopted child dies without descendants, biological parents/relatives inherit.

**Current rule (RA 8552/11642)**: Art. 984 is superseded.

| Scenario | Who Inherits from Adoptee | Legal Basis |
|----------|--------------------------|-------------|
| Adoptee dies with descendants | Descendants (Art. 978-982) | Standard rules |
| Adoptee dies with no descendants, adopter alive | Adopter as legitimate parent (Art. 889) | RA 8552 Sec. 18 / RA 11642 Sec. 43 |
| Adoptee dies with no descendants, adopter dead (RA 8552) | NOT adopter's parents (exclusivity) → biological relatives per Art. 984? | Ambiguous — see note |
| Adoptee dies with no descendants, adopter dead (RA 11642) | Adopter's parents as legitimate grandparents (Art. 890) | RA 11642 Sec. 41 |

**Ambiguity note**: Under RA 8552, when the adopter is dead and the adoptee dies childless, there is doctrinal debate about whether Art. 984 (biological relatives inherit) still applies since biological ties were severed. The safer interpretation: RA 8552 Sec. 16 severs biological ties, so biological relatives should NOT inherit; the estate would escheat or go to the adopter's other heirs if any. Under RA 11642, this is resolved — adopter's relatives (parents, siblings) can inherit.

**Engine logic**:
```
function heirs_of_adoptee(adoptee, adoption) {
  // Biological parents: excluded (ties severed)
  // Exception: stepparent adoption preserves one biological parent

  if adoption.regime == RA_8552:
    // Only the adopter (and adoptee's own descendants/spouse) can inherit
    // Adopter's relatives CANNOT inherit (exclusivity rule)
    eligible_parents = [adoption.adopter]  // if alive
    // If adopter is dead: no parental class heir available
    // Falls through to next intestate class

  if adoption.regime == RA_11642:
    // Adopter AND adopter's relatives can inherit
    eligible_parents = [adoption.adopter]  // if alive
    eligible_grandparents = [adoption.adopter.parents]  // if adopter dead, Art. 890
    eligible_siblings = [adoption.adopter.legitimate_children]  // as siblings
}
```

### 4. Multiple Adoptions / Double Inheritance

**Scenario**: Child C is adopted by Couple A. A later divorces (or annuls). Can C inherit from both?

**Rule**: Adoption creates parent-child relationship with both members of a couple who adopted jointly. If the couple separates, both remain parents for succession purposes (adoption is not reversed by marital dissolution).

**Engine logic**: If adopted by a couple, the child has TWO adoptive parents. Both are legitimate parents for succession purposes. The child can inherit from each.

### 5. Adoption + Biological Legitimate Children — Equal Treatment Verification

**Critical verification**: The engine must NEVER produce different shares for adopted vs biological legitimate children who are siblings. Any computation that distinguishes them (other than the narrative explanation) is a bug.

```
function verify_no_discrimination(heirs, shares) {
  legitimate_children = filter(h where effective_category(h) == LEGITIMATE_CHILD_GROUP, heirs)

  // All legitimate children (biological, legitimated, adopted) must have equal shares
  shares_set = unique(shares[h] for h in legitimate_children)
  assert len(shares_set) == 1  // All shares must be identical
}
```

### 6. RA 11642 Transitional: Pre-2022 Adoptions

**Question**: Does RA 11642 Sec. 41's extended filiation apply retroactively to adoptions decreed under RA 8552?

**Analysis**: The statute does not contain an explicit retroactivity clause. Under general statutory construction principles:
- Substantive rights are generally not applied retroactively
- However, RA 11642 repealed RA 8552 — all existing adoptees now fall under the new regime
- The safer interpretation: Sec. 41 applies to ALL existing adoptions, not just new ones

**Engine logic**: Flag this as configurable. Default: treat all adoptees under the RA 11642 regime for succession purposes, unless the user specifies otherwise.

```
struct AdoptionConfig {
  // If true, apply RA 11642 extended filiation to ALL adoptions
  // If false, only apply to adoptions decreed after Jan 6, 2022
  retroactive_ra_11642: bool,  // default: true
}
```

### 7. Biological Parent Left a Will Including Adoptee

**Rule**: RA 8552 Sec. 18 / RA 11642 Sec. 43 — "if the adoptee and his/her biological parent(s) had left a will, the law on testamentary succession shall govern."

**Effect**: Even though biological ties are severed for intestate succession, if the biological parent left a will that includes the adoptee as a beneficiary, that testamentary disposition is valid.

**Engine logic**: The adoptee is NOT a compulsory heir of the biological parent (ties severed), so they cannot demand a legitime. But they CAN receive from the free portion if named in the biological parent's will as a voluntary heir.

### 8. Adopted Child Preterition

**Rule**: An adopted child is a compulsory heir in the direct line (as a legitimate child). If a will totally omits the adopted child, Art. 854 preterition applies — the institution of heirs is annulled.

**Engine logic**: Include adopted children in the preterition check. Omitting an adopted child from a will has the same devastating effect as omitting a biological legitimate child.

---

## Test Implications

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 1 | Adopted child (valid, unrescinded) classification | effective_category = LEGITIMATE_CHILD_GROUP |
| 2 | Adopted child shares with 2 biological legitimate children, intestate, ₱12M | Each child gets ₱3M (equal to biological); spouse ₱3M |
| 3 | Adopted child + 1 illegitimate child, testate, ₱10M | AC: ₱5M legitime; IC: ₱2.5M legitime |
| 4 | Adopted child is sole legitimate child + spouse, testate | AC legitime: ½; spouse: ¼ (Art. 892 ¶1: 1 child) |
| 5 | 1 biological + 1 adopted child + spouse, testate | Art. 892 ¶2 applies (2+ children); spouse = 1 child's share |
| 6 | Rescinded adoption before death | Adopted child gets NOTHING from adopter |
| 7 | Rescinded adoption after death | Adopted child retains rights (succession already opened) |
| 8 | Stepparent adoption: child inherits from biological parent (spouse of adopter) | Child classified as legitimate child of biological parent |
| 9 | Stepparent adoption: child does NOT inherit from non-spouse biological parent | Child classified as null for non-spouse biological parent |
| 10 | Adopted child omitted from will (preterition) | Art. 854 annulment triggered |
| 11 | Death of adopted child, adopter alive | Adopter inherits as legitimate parent (Art. 889) |
| 12 | Death of adopted child, adopter dead, RA 11642 | Adopter's parents inherit as grandparents (Art. 890) |
| 13 | Death of adopted child, adopter dead, RA 8552 | Ambiguous: estate may escheat; biological relatives excluded |
| 14 | Adopted child predeceases decedent, has 2 children | Grandchildren represent per stirpes (Arts. 970-977) |
| 15 | Biological parent's will names adopted child | Adoptee receives from free portion as voluntary heir |
| 16 | verify_no_discrimination: 2 bio + 1 adopted, all shares equal | Assertion passes — no share difference |
| 17 | RA 11642 adoptee inheriting from adopter's parent (intestate) | Adoptee = grandchild of adopter's parent; inherits per Art. 982 |
| 18 | RA 8552 adoptee attempting to inherit from adopter's parent | Fails — exclusivity rule blocks |

---

## Engine Data Model Impact

```
// Additions/modifications to the Heir struct

struct Heir {
  // ... existing fields from compulsory-heirs-categories ...

  // Adoption-specific fields
  adoption: Adoption | null,        // non-null if this person was adopted

  // These are derived/computed:
  has_valid_adoption: bool,          // adoption != null AND !adoption.is_rescinded (or rescinded after death)
  adoption_regime: RA_8552 | RA_11642 | null,
  is_stepparent_adoptee: bool,       // biological parent is adopter's spouse
  biological_parent_tie_preserved: Person | null,  // the biological parent whose ties survive (stepparent)
}

struct Adoption {
  decree_date: Date,
  regime: RA_8552 | RA_11642,        // determined by decree_date
  adopter: Person,                    // or adopting couple
  adoptee: Person,
  is_stepparent_adoption: bool,
  biological_parent_spouse: Person | null,  // the bio parent married to adopter
  is_rescinded: bool,
  rescission_date: Date | null,
  rescission_grounds: string | null,  // for narrative purposes
}

struct AdoptionConfig {
  retroactive_ra_11642: bool,         // default true: apply Sec. 41 to pre-2022 adoptions
}
```

---

## Summary of Critical Rules for the Engine

1. **Adopted child = legitimate child**: No computation distinction. Any code path that produces different shares for adopted vs biological legitimate children is a **bug**.

2. **Biological ties severed**: Adopted child does NOT inherit from biological parents (intestate). Exception: stepparent adoption preserves one biological parent's ties.

3. **Reciprocal rights**: Adopter inherits from adoptee as legitimate parent.

4. **RA 11642 extension**: Post-2022 adoptees have family ties extending to adopter's parents, siblings, and descendants — enabling inheritance from/to adopter's relatives.

5. **Rescission timing matters**: Only rescission BEFORE the decedent's death affects succession. Post-death rescission cannot retroact.

6. **Art. 984 is dead letter**: The engine must NOT apply Civil Code Art. 984. RA 8552/11642 supersede it.

7. **Preterition applies**: Omitting an adopted child from a will triggers Art. 854 annulment, exactly like omitting a biological legitimate child.

---

*Analysis based on RA 8552 Secs. 16-20, RA 11642 Secs. 41-43, 47, Civil Code Arts. 887-888, 892, 895, 970-977, 979, 984, Family Code Art. 189.*
