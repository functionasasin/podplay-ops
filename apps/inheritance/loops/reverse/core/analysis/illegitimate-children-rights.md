# Illegitimate Children's Rights

**Aspect**: illegitimate-children-rights
**Wave**: 2 (Heir Classification Rules)
**Primary Legal Basis**: Art. 176 (Family Code), Arts. 895, 896, 901, 902, 983, 988-993 (Civil Code), Art. 992 (Iron Curtain Rule)
**Depends On**: compulsory-heirs-categories, heir-concurrence-rules

---

## Legal Basis

### Art. 176 (Family Code) — The Master Rule

> "Illegitimate children shall use the surname and shall be under the parental authority of their mother, and shall be entitled to support in conformity with this Code. However, illegitimate children may use the surname of their father if their filiation has been expressly recognized by the father through the record of birth appearing in the civil register, or when an admission in a public document or private handwritten instrument is made by the father. Provided, the father has the right to institute an action before the regular courts to prove non-filiation during his lifetime. **The legitime of each illegitimate child shall consist of one-half of the legitime of a legitimate child.**"

### Art. 165 (Family Code) — Definition

> "Children conceived and born outside a valid marriage are illegitimate, unless otherwise provided in this Code."

### Art. 895 (Civil Code) — Original Provision (Partially Superseded)

> "The legitime of each of the acknowledged natural children and each of the natural children by legal fiction shall consist of one-half (½) of the legitime of each of the legitimate children or descendants."
>
> "The legitime of an illegitimate child who is neither an acknowledged natural, nor a natural child by legal fiction, shall be equal in every case to four-fifths (⅘) of the legitime of an acknowledged natural child."
>
> "The legitime of the illegitimate children shall be taken from the portion of the estate at the free disposal of the testator, provided that in no case shall the total legitime of such illegitimate children exceed that free portion, and that the legitime of the surviving spouse must first be fully satisfied."

**CRITICAL**: The Family Code (Art. 176) abolished the three-tier classification in Art. 895. Under current law:
- ~~"Acknowledged natural children" → ½ of legitimate child's legitime~~ **SUPERSEDED**
- ~~"Natural by legal fiction" → ½ of legitimate child's legitime~~ **SUPERSEDED**
- ~~"Other illegitimate" → ⅘ of ½ = 2/5 of legitimate child's legitime~~ **SUPERSEDED**

**Current rule**: ALL illegitimate children = ½ of legitimate child's legitime. Period.

However, **Art. 895 ¶3 (the cap rule) survives** and remains critically important: illegitimate children's total legitime cannot exceed the free portion, and the spouse's legitime is satisfied first.

### Art. 887 ¶3 — Filiation Proof Requirement

> "In all cases of illegitimate children, their filiation must be duly proved."

### Art. 992 — The Iron Curtain Rule

> "An illegitimate child has no right to inherit ab intestato from the legitimate children and relatives of his father or mother; nor shall such children or relatives inherit in the same manner from the illegitimate child."

### Art. 902 — Transmissibility to Descendants

> "The rights of illegitimate children set forth in the preceding articles are transmitted upon their death to their descendants, whether legitimate or illegitimate."

---

## 1. Unified Classification Rule

### Pre-Family Code (Historical — Engine Does NOT Implement This)

The old Civil Code Art. 895 created three tiers of illegitimate children:

| Tier | Description | Legitime |
|------|-------------|----------|
| 1 | Acknowledged natural children (parents could have married at conception) | ½ of legitimate child |
| 2 | Natural children by legal fiction | ½ of legitimate child |
| 3 | Other illegitimate children (Art. 287 — spurious, adulterous, incestuous) | ⅘ × ½ = 2/5 of legitimate child |

### Post-Family Code (Current Law — Engine Implements THIS)

Family Code Art. 176 collapsed all tiers into one:

| Category | Legitime | Legal Basis |
|----------|----------|-------------|
| ALL illegitimate children (regardless of circumstances of birth) | ½ of legitimate child's legitime | FC Art. 176 |

**Engine rule**: The engine MUST NOT distinguish between types of illegitimate children. Any code that produces different shares for different "kinds" of illegitimate children is a bug.

```
// CORRECT
function illegitimate_child_legitime(per_legitimate_child_legitime: Money) -> Money {
  return per_legitimate_child_legitime * 0.5  // FC Art. 176: always ½
}

// WRONG — DO NOT IMPLEMENT
function illegitimate_child_legitime_OLD(child: Heir, per_legit: Money) -> Money {
  if child.is_acknowledged_natural:
    return per_legit * 0.5
  else:
    return per_legit * 0.5 * 0.8  // The old ⅘ rule — ABOLISHED
}
```

---

## 2. Proof of Filiation — Gate Condition

Before an illegitimate child can participate in succession at all, their filiation must be established. This is a **hard gate**: no proof of filiation = no inheritance rights.

### Proof Methods (FC Arts. 172, 175)

Art. 175 provides that illegitimate children establish filiation "in the same way and on the same evidence as legitimate children" (referring to Art. 172):

**Primary evidence (any one suffices)**:
1. Record of birth in the civil register (birth certificate naming the parent)
2. Final judgment declaring filiation
3. Admission of filiation in a public document signed by the parent
4. Admission of filiation in a private handwritten instrument signed by the parent

**Secondary evidence (if primary unavailable)**:
1. Open and continuous possession of the status of an illegitimate child
2. Any other means allowed by the Rules of Court and special laws

### Timing of Action (FC Art. 175)

- The action to establish filiation must be brought **during the lifetime of the alleged parent** (when based on secondary evidence)
- If based on primary evidence (Art. 172 ¶1), the child can bring the action during their own lifetime
- If the child dies during minority or in a state of insanity, heirs have 5 years to institute the action (Art. 173)

### Engine Data Model

```
struct IllegalitimateChild extends Heir {
  filiation_proved: bool,               // REQUIRED — Art. 887 ¶3
  filiation_proof_type: FiliationProof,  // for narrative purposes
}

enum FiliationProof {
  BIRTH_CERTIFICATE,           // Art. 172(1): record of birth in civil register
  FINAL_JUDGMENT,              // Art. 172(1): court judgment
  PUBLIC_DOCUMENT_ADMISSION,   // Art. 172(2): public document signed by parent
  PRIVATE_HANDWRITTEN_ADMISSION, // Art. 172(2): handwritten instrument signed by parent
  OPEN_CONTINUOUS_POSSESSION,  // Art. 172 ¶2(1): secondary evidence
  OTHER_EVIDENCE,              // Art. 172 ¶2(2): Rules of Court
}
```

### Engine Logic

```
function is_eligible_illegitimate_child(heir: Heir) -> bool {
  if heir.effective_category != ILLEGITIMATE_CHILD_GROUP:
    return false

  // Hard gate: Art. 887 ¶3
  if NOT heir.filiation_proved:
    return false  // Cannot participate in succession at all

  // Standard eligibility checks (already in heir-concurrence-rules)
  if heir.is_unworthy AND NOT heir.unworthiness_condoned:
    return false
  if heir.is_disinherited AND heir.disinheritance_valid:
    return false  // but descendants may represent (Art. 923)
  if heir.has_renounced:
    return false

  return true
}
```

---

## 3. The Half-Share Rule — Computation Mechanics

### Core Formula

In every scenario where legitimate and illegitimate children concur, the illegitimate child's share is computed relative to the legitimate child's share:

```
illegitimate_share = legitimate_per_child_share × 0.5
```

This relationship holds in both testate and intestate succession, but the base computation differs.

### Testate: Legitime Computation

When illegitimate children concur with legitimate children in testate succession:

```
function compute_illegitimate_legitime_testate(
  estate: Money,
  count_legit_children: int,      // "lines" counting representation
  count_illegit_children: int,
  has_spouse: bool
) -> {per_legit: Money, per_illegit: Money, spouse: Money, free_portion: Money} {

  // Step 1: Legitimate children's collective legitime = ½ of estate
  legit_collective = estate * 0.5                    // Art. 888
  per_legit = legit_collective / count_legit_children

  // Step 2: Each illegitimate child's computed legitime
  per_illegit_computed = per_legit * 0.5             // FC Art. 176 / Art. 895

  // Step 3: Spouse's share (from free portion)
  if has_spouse:
    if count_legit_children == 1:
      spouse = estate * 0.25                         // Art. 892 ¶1
    else:
      spouse = per_legit                             // Art. 892 ¶2, Art. 897
  else:
    spouse = 0

  // Step 4: Apply cap rule (Art. 895 ¶3)
  free_portion = estate - legit_collective
  remaining_fp_after_spouse = free_portion - spouse

  total_illegit = per_illegit_computed * count_illegit_children

  if total_illegit > remaining_fp_after_spouse:
    // CAP APPLIED: reduce proportionally
    total_illegit = remaining_fp_after_spouse
    per_illegit = total_illegit / count_illegit_children
  else:
    per_illegit = per_illegit_computed

  free_portion_remaining = remaining_fp_after_spouse - total_illegit

  return {per_legit, per_illegit, spouse, free_portion: free_portion_remaining}
}
```

### Intestate: Ratio Method

In intestate succession, the entire estate distributes (no free portion concept). The half-share ratio is preserved:

```
function compute_illegitimate_share_intestate(
  estate: Money,
  count_legit_children: int,      // "lines" counting representation
  count_illegit_children: int,
  has_spouse: bool
) -> {per_legit: Money, per_illegit: Money, spouse: Money} {

  // Unit system: legitimate child = 2 units, illegitimate child = 1 unit
  // Arts. 983, 895, 999
  legit_unit = 2
  illegit_unit = 1
  spouse_unit = if has_spouse then 2 else 0  // Art. 999: same as 1 legitimate child

  total_units = (count_legit_children * legit_unit)
              + (count_illegit_children * illegit_unit)
              + spouse_unit

  per_unit = estate / total_units

  per_legit = per_unit * legit_unit      // = per_unit * 2
  per_illegit = per_unit * illegit_unit  // = per_unit * 1
  spouse = per_unit * spouse_unit        // = per_unit * 2

  // Verify half-share ratio: per_illegit / per_legit = 1/2 ✓
  return {per_legit, per_illegit, spouse}
}
```

**Key difference**: In intestate, the cap rule (Art. 895 ¶3) does NOT apply because there is no "free portion" concept — the entire estate distributes proportionally. The half-share ratio is enforced by the unit system, not by capping.

### Without Legitimate Children — Different Rules Apply

When illegitimate children do NOT concur with legitimate children, the half-share rule is irrelevant. Instead, specific articles set fixed fractions:

| Concurring With | Illegitimate Children's Share | Article | Computation |
|----------------|------------------------------|---------|-------------|
| Nobody (alone) — testate | ½ of estate (collective) | Art. 901 | Divided equally among all illegitimate children |
| Nobody (alone) — intestate | Entire estate | Art. 988 | Divided equally among all illegitimate children |
| Surviving spouse only — testate | ⅓ of estate (collective) | Art. 894 | Divided equally among all illegitimate children |
| Surviving spouse only — intestate | ½ of estate | Art. 998 | Divided equally among all illegitimate children |
| Legitimate ascendants only — testate | ¼ of estate (collective) | Art. 896 | Divided equally; from free portion |
| Legitimate ascendants only — intestate | ½ of estate | Art. 991 | Divided equally |
| Legitimate ascendants + spouse — testate | ¼ of estate (collective) | Art. 899 | Divided equally; from free portion |
| Legitimate ascendants + spouse — intestate | ¼ of estate | Art. 1000 | Divided equally |

```
function compute_illegitimate_share_no_legit_children(
  estate: Money,
  count_illegit: int,
  scenario: Scenario
) -> Money {

  collective = match scenario {
    // Testate scenarios
    T8  (ascendants + illegit):              estate * 0.25   // Art. 896
    T9  (ascendants + spouse + illegit):     estate * 0.25   // Art. 899
    T10 (spouse + illegit):                  estate / 3      // Art. 894
    T11 (illegit only):                      estate * 0.5    // Art. 901

    // Intestate scenarios
    I7  (illegit only):                      estate          // Art. 988
    I8  (spouse + illegit):                  estate * 0.5    // Art. 998
    I9  (ascendants + illegit):              estate * 0.5    // Art. 991
    I10 (ascendants + spouse + illegit):     estate * 0.25   // Art. 1000
  }

  return collective / count_illegit  // Equal shares within the group
}
```

---

## 4. The Iron Curtain Rule (Art. 992) — Inheritance Barrier

### The Rule

> "An illegitimate child has no right to inherit ab intestato from the legitimate children and relatives of his father or mother; nor shall such children or relatives inherit in the same manner from the illegitimate child."

### What It Means

Art. 992 creates a **bilateral barrier** between:
- **Side A**: The illegitimate child (and their descendants)
- **Side B**: The legitimate children and relatives of the illegitimate child's parent

Neither side can inherit from the other through intestate succession.

### Scope and Limits

| Can inherit from? | Legitimate relatives of parent | Parent directly | Own descendants | Own spouse |
|-------------------|-------------------------------|-----------------|-----------------|-----------|
| Illegitimate child | NO (Art. 992) | YES | YES | YES |
| Legitimate relative → illegitimate child | NO (Art. 992) | N/A | N/A | N/A |

**Key limits**:
1. Art. 992 applies ONLY to **intestate** (ab intestato) succession — a testator can still leave a legacy/devise to an illegitimate child's legitimate half-sibling by will
2. The barrier is between the illegitimate child and the LEGITIMATE relatives — not between the illegitimate child and the parent
3. Illegitimate children CAN inherit from their own parent (the decedent) — Art. 992 blocks them from inheriting from their parent's legitimate children and other relatives

### Engine Relevance

Art. 992 is relevant when the **decedent is NOT the parent** of the illegitimate child. Since this engine takes a single decedent and their heirs as input, the Iron Curtain Rule manifests in the following way:

```
function iron_curtain_check(heir: Heir, decedent: Decedent) -> bool {
  // Art. 992 applies when:
  // 1. heir is an illegitimate child of someone OTHER than the decedent
  // 2. heir is trying to inherit intestate from the decedent
  // 3. heir's parent is a legitimate relative of the decedent

  // In practice for this engine: the engine's input is the decedent's
  // family tree. If an heir is flagged as the decedent's illegitimate child,
  // they CAN inherit. Art. 992 prevents inheritance from other relatives,
  // which is outside this engine's scope (different decedent).

  // However, the REVERSE direction matters when the decedent IS an
  // illegitimate child — see Art. 903 and illegitimate-decedent scenarios.

  return false  // Not relevant within this engine's scope (single decedent)
}
```

**Engine design note**: Art. 992 is primarily a constraint for a **multi-estate** or **family succession planning** tool. For this engine (single decedent → per-heir distribution), it manifests as:

1. When the decedent is a legitimate parent: their illegitimate children CAN inherit — no barrier
2. When the decedent is an illegitimate child: Art. 903 (not Art. 992) governs who inherits from them. Art. 992's effect is that the decedent's legitimate half-siblings CANNOT inherit intestate from the illegitimate decedent.

The engine should:
- Include a `decedent.is_illegitimate` flag
- When `true`, use Art. 903 rules for the decedent's parents
- When `true`, exclude legitimate half-siblings from the intestate heir list (Art. 992)

```
function filter_heirs_for_illegitimate_decedent(
  heirs: List<Heir>,
  decedent: Decedent
) -> List<Heir> {
  if NOT decedent.is_illegitimate:
    return heirs  // No Iron Curtain filtering needed

  return heirs.filter(h => {
    // Exclude legitimate half-siblings (Art. 992)
    if h.is_legitimate_half_sibling_of_decedent:
      return false  // Iron Curtain blocks intestate inheritance

    // All others pass through
    return true
  })
}
```

---

## 5. Transmissibility of Rights (Art. 902)

### The Rule

> "The rights of illegitimate children set forth in the preceding articles are transmitted upon their death to their descendants, whether legitimate or illegitimate."

### What This Means

1. If an illegitimate child predeceases the decedent, their descendants (legitimate or illegitimate) can **represent** them
2. The representation follows the same per stirpes rule (Art. 974) as for legitimate children
3. The illegitimate child's descendants inherit the illegitimate child's share — NOT a legitimate child's share

### Engine Logic

```
function can_be_represented_illegitimate(
  illegitimate_child: Heir,
  their_descendants: List<Heir>
) -> bool {
  // Art. 902: rights transmitted to descendants
  // Requires: the illegitimate child is dead, disinherited, or unworthy
  // AND has living eligible descendants

  if illegitimate_child.is_alive:
    return false  // No representation needed

  if illegitimate_child.has_renounced:
    return false  // Art. 977: renouncing heirs cannot be represented

  // Predecease, disinheritance, incapacity/unworthiness → can be represented
  has_eligible_descendants = any(d for d in their_descendants
    where d.is_alive AND is_eligible(d))

  return has_eligible_descendants
}

function illegitimate_representation_share(
  illegitimate_child_share: Money,
  representing_descendants: List<Heir>
) -> Map<Heir, Money> {
  // Art. 974: per stirpes — representatives share the represented person's portion
  // The represented person's share was already computed as an illegitimate child's share (½ of legit)

  shares = {}
  per_descendant = illegitimate_child_share / count(representing_descendants)

  for each descendant in representing_descendants:
    shares[descendant] = per_descendant

  return shares
}
```

### Important Nuance: Descendants Can Be Legitimate or Illegitimate

Art. 902 explicitly says "descendants, whether legitimate or illegitimate." This means:
- An illegitimate child's legitimate grandchild can represent them
- An illegitimate child's illegitimate grandchild can also represent them
- The representative's own legitimacy status does NOT affect the share — they inherit the **represented person's** share (which is an illegitimate child's share)

```
// Example:
// Decedent D has 2 legitimate children (LC1, LC2) and 1 illegitimate child (IC1, predeceased).
// IC1 has 1 legitimate grandchild (GC1) and 1 illegitimate grandchild (GC2).
//
// GC1 and GC2 represent IC1 (Art. 902).
// They share IC1's portion equally.
// IC1's portion = ½ of one legitimate child's share.
// GC1 and GC2 each get ¼ of one legitimate child's share.
//
// Their own legitimacy status (GC1=legitimate, GC2=illegitimate) does NOT
// further halve their share — the halving already happened at IC1's level.
```

---

## 6. Disinheritance of Illegitimate Children

### Valid Grounds (Art. 919)

Art. 919 applies to "children and descendants, **legitimate as well as illegitimate**":

1. Attempt against testator's life, spouse, descendants, or ascendants
2. Groundless accusation of crime (6+ years imprisonment)
3. Adultery or concubinage with testator's spouse
4. Fraud, violence, intimidation to affect will
5. Refusal to support parent without justifiable cause
6. Maltreatment by word or deed
7. Leading a dishonorable or disgraceful life
8. Conviction of crime carrying civil interdiction

### Effect of Disinheritance (Art. 923)

When an illegitimate child is validly disinherited:
- The disinherited child is excluded entirely
- Their descendants (legitimate or illegitimate, per Art. 902) **take their place** and preserve compulsory heir rights
- The disinherited parent has no usufruct or administration over the inherited property

### Engine Logic

```
function handle_disinherited_illegitimate(
  disinherited: Heir,
  estate: Money,
  scenario: Scenario
) {
  if disinherited.disinheritance_valid:
    // Check for descendants who can represent (Art. 923 + Art. 902)
    descendants = get_eligible_descendants(disinherited)
    if descendants.is_empty:
      // No representation → share is lost (accretes to co-heirs or free portion)
      remove_from_computation(disinherited)
    else:
      // Descendants take disinherited child's place
      // They get the disinherited child's ILLEGITIMATE share (½ of legit)
      // NOT a legitimate child's share
      replace_with_representatives(disinherited, descendants)
  else:
    // Invalid disinheritance → annuls institution insofar as it prejudices
    // the disinherited heir (Art. 918), but their legitime is preserved
    restore_legitime(disinherited)
}
```

---

## 7. Cap Rule Deep Dive (Art. 895 ¶3)

The cap rule is the most complex computation involving illegitimate children. Detailed analysis:

### The Priority Ordering

Art. 895 ¶3 establishes a strict priority:
1. **First**: Legitimate children's collective legitime (½ of estate) — this is NEVER reduced
2. **Second**: Surviving spouse's legitime — must be "fully satisfied" before illegitimate children get anything
3. **Third**: Illegitimate children's collective legitime — whatever remains of the free portion after spouse is satisfied

### When the Cap Bites

The cap activates when:
```
total_illegitimate_legitime_computed > free_portion - spouse_legitime
```

This happens when there are **many illegitimate children relative to the number of legitimate children**:

```
// Threshold: cap bites when count_illegit > 2 * (free_portion - spouse) / per_legit_share
// Simplified: when the ratio of illegitimate to legitimate children is too high

// Example: Estate = ₱10,000,000, 1 legitimate child, 1 spouse
// Free portion = ₱5,000,000
// Spouse = ₱2,500,000 (Art. 892 ¶1)
// Remaining FP = ₱2,500,000
// Per illegitimate computed = ₱2,500,000 (½ of ₱5,000,000)
// Cap bites if count_illegit > 1 → with 2+ illegitimate children, each gets less than computed

// Example: Estate = ₱10,000,000, 2 legitimate children, 1 spouse
// Free portion = ₱5,000,000
// Per legit = ₱2,500,000; Spouse = ₱2,500,000 (Art. 892 ¶2)
// Remaining FP = ₱2,500,000
// Per illegitimate computed = ₱1,250,000
// Cap bites if count_illegit > 2 → with 3+ illegitimate children, cap applies
```

### Worked Example: Cap in Action

**Facts**: Estate = ₱10,000,000. 1 legitimate child (LC1). Spouse (S). 5 illegitimate children (IC1-IC5).

**Computation**:
```
legit_collective = ₱10M × 0.5 = ₱5,000,000    // Art. 888
per_legit = ₱5,000,000 / 1 = ₱5,000,000       // 1 legitimate child
free_portion = ₱10M - ₱5M = ₱5,000,000

spouse = ₱10M × 0.25 = ₱2,500,000             // Art. 892 ¶1 (1 child)
remaining_fp = ₱5M - ₱2.5M = ₱2,500,000

per_illegit_computed = ₱5M × 0.5 = ₱2,500,000  // Art. 895
total_illegit_computed = 5 × ₱2.5M = ₱12,500,000

// CAP CHECK: ₱12,500,000 > ₱2,500,000 → CAP APPLIES
total_illegit_capped = ₱2,500,000
per_illegit_actual = ₱2,500,000 / 5 = ₱500,000

free_portion_remaining = ₱2.5M - ₱2.5M = ₱0
```

| Heir | Legitime | Basis |
|------|----------|-------|
| LC1 | ₱5,000,000 | Art. 888 |
| S | ₱2,500,000 | Art. 892 ¶1 |
| IC1-IC5 | ₱500,000 each | Art. 895, capped by Art. 895 ¶3 |
| Free portion | ₱0 | |
| **Total** | **₱10,000,000** | |

**Narrative for IC1**:
> **IC1 (illegitimate child)** receives **₱500,000**.
> As an illegitimate child (Art. 176, Family Code), IC1 is a compulsory heir entitled to a legitime equal to one-half (½) of a legitimate child's legitime. The computed legitime would be ₱2,500,000 (½ of LC1's ₱5,000,000). However, under Art. 895 ¶3, the total legitime of all illegitimate children cannot exceed the free portion (₱5,000,000) after the surviving spouse's legitime (₱2,500,000) is first fully satisfied. The remaining free portion of ₱2,500,000 is divided equally among 5 illegitimate children, giving IC1 a legitime of ₱500,000.

### Cap Rule — Intestate Non-Applicability

In intestate succession, there is no "free portion" concept. The ratio method (unit system) inherently distributes the entire estate proportionally. The cap rule from Art. 895 ¶3 is a **testate-only** constraint.

In intestate, the ratio always holds: illegitimate = 1 unit, legitimate = 2 units, spouse = 2 units. The total always adds up to 100% of the estate.

---

## 8. Illegitimate Children When Decedent Is Illegitimate (Art. 903)

When the decedent is themselves illegitimate, special rules govern their parents' inheritance rights:

| Surviving Heirs | Parents' Share | Other Shares | Free Portion | Art. |
|----------------|---------------|-------------|-------------|------|
| Parents only (no descendants, no spouse, no children) | ½ | — | ½ | 903 ¶1 |
| Parents + spouse (no children) | ¼ | Spouse: ¼ | ½ | 903 ¶2 |
| Children (legitimate or illegitimate) survive | 0 | Children inherit | — | 903 ¶2 |

**Note**: When the illegitimate decedent leaves their own children (legitimate or illegitimate), the decedent's parents are NOT entitled to any legitime whatsoever. This is a complete exclusion, not just a reduction.

---

## Interactions

### With Legitimate Children (Arts. 888, 895, 983, 999)
- **Testate**: Illegitimate children's legitime = ½ of each legitimate child's legitime; taken from free portion; subject to cap rule
- **Intestate**: Ratio method with 2:1 unit ratio (legitimate:illegitimate)
- **Key**: Legitimate children's collective legitime (½ of estate) is NEVER reduced to accommodate illegitimate children

### With Surviving Spouse (Arts. 894, 897-899, 998-999)
- **Testate**: Spouse's legitime is satisfied BEFORE illegitimate children (Art. 895 ¶3 priority)
- **When only spouse + illegitimate concur**: Each gets ⅓ (testate, Art. 894) or ½ each (intestate, Art. 998)
- **With ascendants**: Spouse gets ⅛, illegitimate get ¼ total (testate, Art. 899); spouse ¼, illegitimate ¼ (intestate, Art. 1000)

### With Legitimate Ascendants (Arts. 896, 899, 991, 1000)
- **Testate**: Ascendants always get ½ (Art. 889); illegitimate children get ¼ from free portion (Art. 896)
- **Intestate**: Each class gets ½ (Art. 991); with spouse added, ascendants ½, illegitimate ¼, spouse ¼ (Art. 1000)

### With Adopted Children
- Adopted children are in the LEGITIMATE_CHILD_GROUP (RA 8552 Sec. 17)
- Illegitimate children's half-share computation uses adopted children's per-child share as the base
- No special rule — adopted child = legitimate child for all purposes

### With Representation (Art. 902)
- Illegitimate children CAN be represented by their descendants (Art. 902)
- Representatives inherit the illegitimate child's share (½ of legitimate), not a full legitimate share
- Both legitimate and illegitimate descendants can represent

---

## Edge Cases

### 1. Multiple Illegitimate Children from Different Parents
- **Rule**: All illegitimate children of the decedent are treated equally regardless of who the other parent is
- **Engine logic**: Do not track or distinguish by the identity of the other parent

### 2. Illegitimate Child Acknowledged Only by Mother
- **Rule**: FC Art. 176 — illegitimate children are under the parental authority of their mother by default
- **Effect**: If the decedent is the father, filiation must still be independently proved per Art. 887 ¶3
- **Engine logic**: `filiation_proved` flag applies regardless of which parent is the decedent

### 3. Father's Right to Contest Filiation
- **Rule**: FC Art. 176 — "the father has the right to institute an action before the regular courts to prove non-filiation during his lifetime"
- **Engine logic**: If the father successfully contested filiation before death → child is not an heir at all. Set `filiation_proved = false`.

### 4. Posthumous Recognition
- **Rule**: Recognition of an illegitimate child in the decedent's will is valid (this is an admission in a public document per Art. 172(2))
- **Engine logic**: If the will contains recognition of an illegitimate child → set `filiation_proved = true` and classify as ILLEGITIMATE_CHILD

### 5. Illegitimate Child Predeceases Decedent Without Descendants
- **Rule**: No representation possible (Art. 902 requires descendants). The child's share does not accrue.
- **Testate effect**: That illegitimate child's portion of the free portion becomes available for testamentary disposition
- **Intestate effect**: Share accrues to co-heirs of the same class (Art. 1018)

### 6. All Illegitimate Children Renounce
- **Rule**: Art. 977 — renouncing heirs cannot be represented. Art. 969 — if all nearest relatives renounce, next degree inherits in own right
- **Engine logic**: Re-run concurrence determination without the illegitimate children. This changes the scenario (e.g., from T5 to T3).

### 7. Illegitimate Child of an Illegitimate Decedent
- **Rule**: The illegitimate child inherits from the illegitimate decedent normally (Art. 988, 993)
- **Art. 992 barrier**: Does NOT apply between an illegitimate child and their illegitimate parent — Art. 992 blocks inheritance from the parent's LEGITIMATE relatives, not from the parent themselves

### 8. Collation of Donations to Illegitimate Children (Art. 910)
- **Rule**: "Donations which an illegitimate child may have received during the lifetime of his father or mother, shall be charged to his legitime. Should they exceed the portion that can be freely disposed of, they shall be reduced."
- **Engine logic**: Inter vivos donations to illegitimate children are:
  1. Added back to compute the collated estate
  2. Charged against that illegitimate child's legitime
  3. If donation exceeds legitime, excess charged to free portion
  4. If donation exceeds free portion, it is subject to reduction (inofficious)

---

## Test Implications

### Filiation Gate Tests

| # | Test | Expected Result |
|---|------|----------------|
| 1 | Illegitimate child with filiation proved via birth certificate | Eligible — participates in succession |
| 2 | Illegitimate child with filiation NOT proved | Excluded — Art. 887 ¶3 |
| 3 | Father contested filiation during lifetime, won | Child excluded |
| 4 | Illegitimate child recognized in the will | filiation_proved = true, participates |

### Half-Share Computation Tests

| # | Test | Expected Result |
|---|------|----------------|
| 5 | Estate ₱10M, 2 legit + 1 illegit (testate) | Legit each: ₱2.5M; Illegit: ₱1.25M (from FP) |
| 6 | Estate ₱10M, 2 legit + 1 illegit (intestate) | Legit each: ₱4M (2/5); Illegit: ₱2M (1/5) |
| 7 | Estate ₱10M, 2 legit + 1 illegit + spouse (testate) | Legit each: ₱2.5M; Spouse: ₱2.5M; Illegit: ₱1.25M |
| 8 | Estate ₱10M, 2 legit + 1 illegit + spouse (intestate) | Each legit: 2/7 × ₱10M; Illegit: 1/7; Spouse: 2/7 |

### Cap Rule Tests

| # | Test | Expected Result |
|---|------|----------------|
| 9 | Estate ₱10M, 1 legit + spouse + 5 illegit (testate) | Each illegit capped at ₱500K (not ₱2.5M) |
| 10 | Estate ₱10M, 1 legit + spouse + 1 illegit (testate) | No cap; illegit gets ₱2.5M |
| 11 | Estate ₱10M, 2 legit + spouse + 3 illegit (testate) | Cap check: remaining FP = ₱2.5M; computed total = ₱3.75M → capped |

### Scenarios Without Legitimate Children

| # | Test | Expected Result |
|---|------|----------------|
| 12 | Estate ₱6M, 3 illegit only (testate) | Illegit collective: ₱3M (½); each ₱1M; FP: ₱3M |
| 13 | Estate ₱6M, 3 illegit only (intestate) | Each: ₱2M (entire estate) |
| 14 | Estate ₱6M, 2 illegit + spouse (testate) | Spouse: ₱2M (⅓); Illegit collective: ₱2M (⅓); FP: ₱2M |
| 15 | Estate ₱6M, 2 illegit + spouse (intestate) | Spouse: ₱3M (½); Each illegit: ₱1.5M (¼ each) |
| 16 | Estate ₱8M, parents + 2 illegit (testate) | Parents: ₱4M (½); Illegit: ₱2M total (¼); FP: ₱2M |
| 17 | Estate ₱8M, parents + 2 illegit + spouse (testate) | Parents: ₱4M; Illegit: ₱2M; Spouse: ₱1M; FP: ₱1M |

### Representation Tests

| # | Test | Expected Result |
|---|------|----------------|
| 18 | Predeceased illegit child with 2 descendants (intestate) | Descendants share IC's portion per stirpes |
| 19 | Disinherited illegit child with descendants (testate) | Descendants take IC's place (Art. 923 + Art. 902) |
| 20 | Illegitimate child renounces — has descendants | Descendants CANNOT represent (Art. 977) |

### Iron Curtain Tests

| # | Test | Expected Result |
|---|------|----------------|
| 21 | Illegitimate decedent with legitimate half-siblings (intestate) | Half-siblings excluded by Art. 992 |
| 22 | Legitimate decedent with illegitimate children | Iron Curtain NOT relevant — illegit children inherit normally |

### Collation Test

| # | Test | Expected Result |
|---|------|----------------|
| 23 | Illegit child received ₱2M donation inter vivos; estate ₱8M; 2 legit + 1 illegit | Collated estate = ₱10M; illegit's share reduced by prior donation |

---

## Engine Data Model Impact

```
// Additional fields for illegitimate children (extending Heir struct)

struct Heir {
  // ... existing fields from compulsory-heirs-categories ...

  // Illegitimate-specific fields
  filiation_proved: bool,                    // REQUIRED for illegitimate children (Art. 887 ¶3)
  filiation_proof_type: FiliationProof?,     // For narrative: what evidence established filiation
  filiation_contested_and_lost: bool,        // FC Art. 176: father successfully proved non-filiation
  recognized_in_will: bool,                  // Whether the will itself recognizes the child
  prior_donations: Money,                    // For collation (Art. 910)
}

// Decedent-level fields
struct Decedent {
  // ... existing fields ...

  is_illegitimate: bool,  // Whether the decedent is themselves illegitimate
  // If true: Art. 903 governs parents' share; Art. 992 excludes legitimate half-siblings
}
```

---

## Narrative Template for Illegitimate Children

### When concurring with legitimate children (half-share applies):

> **{Name} (illegitimate child)** receives **₱{amount}**.
> As an illegitimate child (Art. 176, Family Code), {Name} is a compulsory heir entitled to a legitime equal to one-half (½) of a legitimate child's legitime. Each legitimate child's legitime is ₱{legit_per_child} ({legit_fraction} of the estate ÷ {count_legit} children). {Name}'s legitime is therefore ₱{legit_per_child} × ½ = ₱{amount}. {if_capped: However, under Art. 895 ¶3, the total legitime of all illegitimate children (₱{total_illegit_computed}) exceeds the remaining free portion (₱{remaining_fp}) after the surviving spouse's legitime (₱{spouse_share}) is fully satisfied. {Name}'s share is therefore reduced to ₱{amount_capped}.}

### When sole heir class (no legitimate children/ascendants):

> **{Name} (illegitimate child)** receives **₱{amount}**.
> In the absence of legitimate descendants and ascendants, {Name} inherits as an illegitimate child under Art. {article}. {if_testate: The collective legitime of all illegitimate children is {fraction} of the estate (₱{collective}), divided equally among {count} illegitimate children.} {if_intestate: Under Art. {article}, illegitimate children inherit {fraction} of the estate, divided equally.}

---

*Analysis based on Family Code Art. 165, 172, 175, 176; Civil Code Arts. 887, 895, 896, 901, 902, 910, 919, 923, 983, 988-993; commentary from Respicio & Co., RALB Law, NDV Law.*
