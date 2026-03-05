# Intestate Order — Complete Priority Order for Intestate Succession

**Aspect**: intestate-order
**Wave**: 4 (Distribution Rules)
**Primary Legal Basis**: Arts. 960-1014 (Civil Code — Legal or Intestate Succession)
**Depends On**: compulsory-heirs-categories, heir-concurrence-rules, representation-rights, legitime-table, legitime-with-illegitimate, legitime-surviving-spouse, legitime-ascendants, free-portion-rules

---

## Overview

This analysis formalizes the **complete intestate distribution algorithm** — the rules that govern how the entire net distributable estate is allocated when there is no valid will (or for the undisposed portion in mixed succession). Unlike testate succession where the estate is split into legitime + free portion, intestate succession distributes the **entire estate** according to a strict statutory hierarchy.

This analysis covers:
1. When intestate succession applies (Art. 960)
2. The 6-class priority hierarchy (Arts. 961, 978-1014)
3. Complete distribution formulas for all 15 intestate scenarios (I1-I15)
4. Within-class distribution rules (equal shares, ratio method, per stirpes, full/half blood)
5. The complete intestate distribution algorithm in pseudocode
6. Interaction with representation, accretion, and special rules
7. Key differences between intestate and testate shares for the same heir combination

---

## Legal Basis

### When Intestate Succession Applies (Art. 960)

> Legal or intestate succession takes place:
> (1) If a person dies without a will, or with a void will, or one which has subsequently lost its validity;
> (2) When the will does not institute an heir to, or dispose of all the property belonging to the testator. In such case, legal succession shall take place only with respect to the property of which the testator has not disposed;
> (3) If the suspensive condition attached to the institution of heir does not happen or is not fulfilled, or if the heir dies before the testator, or repudiates the inheritance, there being no substitution, and no right of accretion takes place;
> (4) When the heir instituted is incapable of succeeding, except in cases provided in this Code.

**Engine triggers for intestate succession**:

```
function is_intestate(decedent: Decedent) -> IntestateTrigger {
  if decedent.will == null:
    return FULL_INTESTATE           // Art. 960(1): no will
  if decedent.will.is_void:
    return FULL_INTESTATE           // Art. 960(1): void will
  if decedent.will.lost_validity:
    return FULL_INTESTATE           // Art. 960(1): lost validity

  // Art. 854: preterition annuls institution → converts to intestate
  if has_preterition(decedent.will, decedent):
    return FULL_INTESTATE_BY_PRETERITION

  // Art. 960(2): partial will → mixed succession
  if NOT decedent.will.disposes_entire_estate:
    return PARTIAL_INTESTATE        // Only undisposed portion

  // Art. 960(3): conditional institution failed
  if any(d for d in decedent.will.dispositions where d.condition_failed):
    return PARTIAL_INTESTATE        // Failed portion

  // Art. 960(4): instituted heir incapable
  if any(d for d in decedent.will.dispositions where d.heir.is_incapable AND NOT has_substitute(d)):
    return PARTIAL_INTESTATE        // Incapable heir's portion

  return NOT_INTESTATE
}

enum IntestateTrigger {
  NOT_INTESTATE,
  FULL_INTESTATE,                   // Entire estate distributes intestate
  FULL_INTESTATE_BY_PRETERITION,    // Art. 854 annulment
  PARTIAL_INTESTATE,                // Art. 960(2)-(4): only undisposed portion
}
```

### The General Principle (Art. 961)

> "In default of testamentary heirs, the law vests the inheritance, in accordance with the rules hereinafter set forth, in the legitimate and illegitimate relatives of the deceased, in the surviving spouse, and in the State."

### Proximity Rule (Art. 962)

> "In every inheritance, the relative nearest in degree excludes the more distant ones, saving the right of representation when it properly takes place."

---

## The 6-Class Priority Hierarchy

The intestate hierarchy consists of 6 classes. Classes 1-4 can **concur** with each other per specific articles. Classes 5-6 are **residual** — they only inherit when all of classes 1-4 are absent (with one exception: Art. 1001 spouse+siblings).

| Priority | Class | Articles | Who | Excludes |
|----------|-------|----------|-----|----------|
| 1 | Legitimate descendants | Arts. 978-984 | Children, grandchildren (by representation), adopted children | Excludes Class 2 (ascendants). Never excluded by any other class. |
| 2 | Legitimate ascendants | Arts. 985-987 | Parents, grandparents | Excluded by Class 1. Excludes Class 5 (collaterals). |
| 3 | Illegitimate children | Arts. 988-993 | Illegitimate children and their descendants | Never excluded by Class 1 or 2 (Art. 887 ¶2). Excluded as sole heir only by absence. |
| 4 | Surviving spouse | Arts. 994-1002 | Widow or widower | Never excluded by Class 1, 2, or 3 (Art. 887 ¶2). Guilty spouse excluded (Art. 1002). |
| 5 | Collateral relatives | Arts. 1003-1010 | Siblings, nephews/nieces, cousins (within 5th degree) | Excluded by Classes 1-4, EXCEPT Art. 1001 (concur with spouse). |
| 6 | The State | Arts. 1011-1014 | Republic of the Philippines | Excluded by Classes 1-5. Last resort. |

### Critical Concurrence Rules

Unlike a simple waterfall where each class fully excludes the next, Classes 1-4 have specific **concurrence articles** that define how they share the estate when multiple classes survive:

```
// Concurrence matrix (true = can inherit together)
//              Class 1   Class 2   Class 3   Class 4   Class 5
// Class 1        -       EXCLUDES    YES       YES       NO
// Class 2      excluded    -         YES       YES       NO
// Class 3       YES       YES         -        YES       NO
// Class 4       YES       YES        YES        -      Art.1001
// Class 5       NO        NO         NO      Art.1001    -
```

**The Art. 1001 Exception**: When the surviving spouse concurs with siblings/their children (and no one from Classes 1-3 survives), the collateral relatives are NOT excluded. Instead: ½ to spouse, ½ to siblings/their children.

---

## Complete Distribution Table: All 15 Intestate Scenarios

### Class 1 Present: Legitimate Descendants Survive

When ANY legitimate descendant survives (including by representation), legitimate ascendants (Class 2) are excluded. Classes 3 and 4 may concur.

#### I1 — Legitimate Children Only

**Surviving heirs**: Legitimate children (no spouse, no illegitimate children, no ascendants)
**Legal basis**: Art. 980
**Rule**: Equal shares among all legitimate children.

> "The children of the deceased shall always inherit from him in their own right, dividing the inheritance in equal shares." — Art. 980

```
function distribute_I1(estate: Money, legitimate_children: List<Heir>) -> Map<Heir, Money> {
  n = count(legitimate_children)
  per_child = estate / n
  return { child: per_child for child in legitimate_children }
}
```

**With representation** (Art. 981): If any child predeceased, their descendants represent them per stirpes. The number of **lines** determines the per-line share; within each line, representatives split equally.

```
function distribute_I1_with_representation(estate: Money, lines: List<LineInfo>) -> Map<Heir, Money> {
  n_lines = count(lines)
  per_line = estate / n_lines
  result = {}
  for line in lines:
    if line.mode == OWN_RIGHT:
      result[line.original_heir] = per_line
    else:  // REPRESENTATION
      per_rep = per_line / count(line.representatives)
      for rep in line.representatives:
        result[rep] = per_rep
  return result
}
```

**Example**: Estate = ₱9,000,000; 3 legitimate children (C1 alive, C2 predeceased with 2 grandchildren GC1/GC2, C3 alive)
- 3 lines → ₱3,000,000 each
- C1: ₱3,000,000; GC1: ₱1,500,000; GC2: ₱1,500,000; C3: ₱3,000,000

---

#### I2 — Legitimate Children + Surviving Spouse

**Surviving heirs**: Legitimate children + surviving spouse
**Legal basis**: Arts. 994, 996
**Rule**: Spouse receives a share equal to one legitimate child's share. All shares are equal.

> "If a widow or widower and legitimate children or descendants are left, the surviving spouse has in the succession the same share as that of each of the children." — Art. 996

```
function distribute_I2(estate: Money, legit_lines: List<LineInfo>, spouse: Heir) -> Map<Heir, Money> {
  n_lines = count(legit_lines)
  // Spouse counts as one additional "share"
  total_shares = n_lines + 1
  per_share = estate / total_shares

  result = { spouse: per_share }
  for line in legit_lines:
    distribute_line_share(per_share, line, result)
  return result
}
```

**Key difference from testate**: In testate T2 (1 child + spouse), spouse gets ¼ and child gets ½ (spouse is smaller). In intestate I2, spouse gets EQUAL to each child: if 1 child + spouse, each gets ½.

**Example**: Estate = ₱12,000,000; 3 children + spouse
- 4 equal shares: ₱3,000,000 each

---

#### I3 — Legitimate + Illegitimate Children (No Spouse)

**Surviving heirs**: Legitimate children + illegitimate children (no spouse)
**Legal basis**: Arts. 983, 895
**Rule**: Unit ratio method — each legitimate child = 2 units, each illegitimate child = 1 unit (½ of legitimate per Art. 895).

> "If illegitimate children survive with legitimate children, the shares of the former shall be in the proportions prescribed by Article 895." — Art. 983

```
function distribute_I3(estate: Money, legit_lines: List<LineInfo>,
                        illegit_lines: List<LineInfo>) -> Map<Heir, Money> {
  n_legit = count(legit_lines)
  n_illegit = count(illegit_lines)

  // 2:1 ratio (Art. 895: illegitimate = ½ of legitimate)
  total_units = (n_legit * 2) + (n_illegit * 1)
  per_unit = estate / total_units

  result = {}
  for line in legit_lines:
    distribute_line_share(per_unit * 2, line, result)
  for line in illegit_lines:
    distribute_line_share(per_unit * 1, line, result)
  return result
}
```

**No cap rule in intestate**: Unlike testate succession (Art. 895 ¶3), intestate succession has NO cap on illegitimate children's shares. The entire estate is distributed proportionally using the 2:1 ratio.

**Example**: Estate = ₱10,000,000; 2 legitimate + 3 illegitimate children
- Total units: (2 × 2) + (3 × 1) = 7
- Per unit: ₱10M / 7 = ₱1,428,571
- Each LC: ₱2,857,143; Each IC: ₱1,428,571

---

#### I4 — Legitimate + Illegitimate Children + Surviving Spouse

**Surviving heirs**: Legitimate children + illegitimate children + surviving spouse
**Legal basis**: Arts. 999, 983, 895
**Rule**: Spouse = one legitimate child's share (2 units). Unit ratio method for all.

> "When the widow or widower survives with legitimate children or descendants and illegitimate children or their descendants, whether legitimate or illegitimate, such widow or widower shall be entitled to the same share as that of a legitimate child." — Art. 999

```
function distribute_I4(estate: Money, legit_lines: List<LineInfo>,
                        illegit_lines: List<LineInfo>, spouse: Heir) -> Map<Heir, Money> {
  n_legit = count(legit_lines)
  n_illegit = count(illegit_lines)

  // Spouse = 2 units (same as legitimate child), per Art. 999
  // Legitimate child = 2 units, Illegitimate child = 1 unit
  total_units = (n_legit * 2) + (n_illegit * 1) + 2  // +2 for spouse
  per_unit = estate / total_units

  result = { spouse: per_unit * 2 }
  for line in legit_lines:
    distribute_line_share(per_unit * 2, line, result)
  for line in illegit_lines:
    distribute_line_share(per_unit * 1, line, result)
  return result
}
```

**Example**: Estate = ₱14,000,000; 2 LC + 1 IC + spouse
- Units: (2×2) + (1×1) + 2 = 7
- Per unit: ₱2,000,000
- Each LC: ₱4,000,000; IC: ₱2,000,000; Spouse: ₱4,000,000

---

### Class 2 Present: Legitimate Ascendants Survive (No Descendants)

Only when NO legitimate descendant survives (including no represented lines). Ascendants may concur with Classes 3 and 4.

#### I5 — Legitimate Parents/Ascendants Only

**Surviving heirs**: Legitimate parents or ascendants (no descendants, no illegitimate children, no spouse)
**Legal basis**: Arts. 985, 986, 987
**Rule**: Entire estate to ascendants. Division per 3-tier algorithm (parents → nearest degree → by-line split).

> "In default of legitimate children and descendants of the deceased, his parents and ascendants shall inherit from him, to the exclusion of collateral relatives." — Art. 985

```
function distribute_I5(estate: Money, ascendants: List<Heir>) -> Map<Heir, Money> {
  return distribute_ascendants(estate, ascendants)
}

function distribute_ascendants(amount: Money, ascendants: List<Heir>) -> Map<Heir, Money> {
  // Tier 1: Both parents alive → equal shares (Art. 986 ¶1)
  // Tier 2: One parent alive → all to survivor (Art. 986 ¶2)
  // Tier 3: No parents → nearest degree, by-line split (Art. 987)

  parents = filter(a where a.degree == 1, ascendants)

  if count(parents) == 2:
    return { parents[0]: amount / 2, parents[1]: amount / 2 }
  if count(parents) == 1:
    return { parents[0]: amount }

  // No parents → Art. 987: nearest degree, by-line split
  // (a) Find the minimum degree among surviving ascendants
  min_degree = min(a.degree for a in ascendants)
  nearest = filter(a where a.degree == min_degree, ascendants)

  // (b) Split by paternal/maternal line
  paternal = filter(a where a.line == PATERNAL, nearest)
  maternal = filter(a where a.line == MATERNAL, nearest)

  result = {}
  if count(paternal) > 0 AND count(maternal) > 0:
    // Art. 987: "one-half shall go to the paternal and the other half to the maternal"
    pat_share = amount / 2
    mat_share = amount / 2
    // "In each line the division shall be made per capita"
    for a in paternal:
      result[a] = pat_share / count(paternal)
    for a in maternal:
      result[a] = mat_share / count(maternal)
  elif count(paternal) > 0:
    // Only paternal line
    for a in paternal:
      result[a] = amount / count(paternal)
  else:
    // Only maternal line
    for a in maternal:
      result[a] = amount / count(maternal)

  return result
}
```

**Example**: Estate = ₱10,000,000; both parents survive
- Father: ₱5,000,000; Mother: ₱5,000,000

**Example (grandparents)**: Estate = ₱10,000,000; no parents; paternal grandfather + both maternal grandparents survive
- Paternal line: ₱5,000,000 (all to paternal grandfather)
- Maternal line: ₱5,000,000 (₱2,500,000 to each maternal grandparent)

---

#### I6 — Legitimate Parents/Ascendants + Surviving Spouse

**Surviving heirs**: Legitimate parents/ascendants + surviving spouse
**Legal basis**: Art. 997
**Rule**: ½ to ascendants, ½ to spouse. Flat split.

> "When the widow or widower survives with legitimate parents or ascendants, the surviving spouse shall be entitled to one-half (½) of the estate, and the legitimate parents or ascendants to the other half." — Art. 997

```
function distribute_I6(estate: Money, ascendants: List<Heir>, spouse: Heir) -> Map<Heir, Money> {
  result = { spouse: estate / 2 }
  ascendant_shares = distribute_ascendants(estate / 2, ascendants)
  result.merge(ascendant_shares)
  return result
}
```

**Key difference from testate**: In testate T7, ascendants get ½ and spouse gets ¼ (free portion = ¼). In intestate I6, spouse gets a **full ½** — double the testate share.

**Example**: Estate = ₱8,000,000; both parents + spouse
- Father: ₱2,000,000; Mother: ₱2,000,000; Spouse: ₱4,000,000

---

### Class 3 Present: Illegitimate Children (No Descendants or Ascendants)

When no legitimate descendants AND no legitimate ascendants survive.

#### I7 — Illegitimate Children Only

**Surviving heirs**: Illegitimate children (no legitimate descendants, no ascendants, no spouse)
**Legal basis**: Art. 988
**Rule**: Entire estate equally to illegitimate children.

> "In the absence of legitimate descendants and ascendants, the illegitimate children shall succeed to the entire estate of the deceased." — Art. 988

```
function distribute_I7(estate: Money, illegit_lines: List<LineInfo>) -> Map<Heir, Money> {
  n = count(illegit_lines)
  per_line = estate / n
  result = {}
  for line in illegit_lines:
    distribute_line_share(per_line, line, result)
  return result
}
```

Art. 989 provides for representation: descendants of a predeceased illegitimate child inherit by representation per stirpes.

---

#### I8 — Illegitimate Children + Surviving Spouse

**Surviving heirs**: Illegitimate children + surviving spouse (no legitimate descendants or ascendants)
**Legal basis**: Art. 998
**Rule**: ½ to spouse, ½ to illegitimate children (shared equally).

> "If a widow or widower survives with illegitimate children, such widow or widower shall be entitled to one-half (½) of the inheritance, and the illegitimate children or their descendants, whether legitimate or illegitimate, to the other half." — Art. 998

```
function distribute_I8(estate: Money, illegit_lines: List<LineInfo>,
                        spouse: Heir) -> Map<Heir, Money> {
  result = { spouse: estate / 2 }
  ic_total = estate / 2
  n = count(illegit_lines)
  per_line = ic_total / n
  for line in illegit_lines:
    distribute_line_share(per_line, line, result)
  return result
}
```

**Key difference from testate**: In testate T10, each gets ⅓ (with ⅓ free portion). In intestate I8, each gets ½ — the "free portion" effectively goes to spouse and ICs proportionally (½ each instead of ⅓ each).

---

### Cross-Class Concurrence (Ascendants + Illegitimate Children)

#### I9 — Legitimate Ascendants + Illegitimate Children

**Surviving heirs**: Legitimate ascendants + illegitimate children (no descendants, no spouse)
**Legal basis**: Art. 991
**Rule**: ½ to ascendants, ½ to illegitimate children. Flat split.

> "If legitimate ascendants are left, the illegitimate children shall divide the inheritance with them, taking one-half of the estate, whatever be the number of the ascendants or of the illegitimate children." — Art. 991

```
function distribute_I9(estate: Money, ascendants: List<Heir>,
                        illegit_lines: List<LineInfo>) -> Map<Heir, Money> {
  result = {}
  ascendant_shares = distribute_ascendants(estate / 2, ascendants)
  result.merge(ascendant_shares)

  ic_total = estate / 2
  n = count(illegit_lines)
  per_line = ic_total / n
  for line in illegit_lines:
    distribute_line_share(per_line, line, result)
  return result
}
```

**Note**: "Whatever be the number" means the ½/½ split is FIXED regardless of whether there is 1 ascendant and 5 illegitimate children or vice versa. The shares are divided equally WITHIN each half.

---

#### I10 — Legitimate Ascendants + Illegitimate Children + Surviving Spouse

**Surviving heirs**: Legitimate ascendants + illegitimate children + surviving spouse
**Legal basis**: Art. 1000
**Rule**: ½ to ascendants, ¼ to illegitimate children, ¼ to spouse. Fixed fractions.

> "If legitimate ascendants, the surviving spouse, and illegitimate children are left, the surviving spouse shall be entitled to one-fourth (¼) of the estate; and the illegitimate children, one-fourth (¼) of the estate; and the remaining one-half (½) shall belong to the legitimate ascendants." — Art. 1000

```
function distribute_I10(estate: Money, ascendants: List<Heir>,
                         illegit_lines: List<LineInfo>, spouse: Heir) -> Map<Heir, Money> {
  result = { spouse: estate / 4 }  // ¼

  ascendant_shares = distribute_ascendants(estate / 2, ascendants)  // ½
  result.merge(ascendant_shares)

  ic_total = estate / 4  // ¼
  n = count(illegit_lines)
  per_line = ic_total / n
  for line in illegit_lines:
    distribute_line_share(per_line, line, result)
  return result
}
```

**Key difference from testate**: In testate T9, ascendants get ½, IC get ¼, spouse gets ⅛ (FP = ⅛). In intestate I10, spouse gets ¼ — double the testate share. The "extra" comes from no free portion.

---

### Class 4 Only: Surviving Spouse (No Descendants, No Ascendants, No Illegitimate Children)

#### I11 — Surviving Spouse Only

**Surviving heirs**: Surviving spouse (no descendants, no ascendants, no illegitimate children, no collateral relatives)
**Legal basis**: Art. 995
**Rule**: Entire estate to surviving spouse.

> "In the absence of legitimate descendants and ascendants, and illegitimate children and their descendants, whether legitimate or illegitimate, the surviving spouse shall inherit the entire estate, without prejudice to the rights of brothers and sisters, nephews and nieces, should there be any, under Article 1001." — Art. 995

```
function distribute_I11(estate: Money, spouse: Heir) -> Map<Heir, Money> {
  return { spouse: estate }
}
```

**Art. 1002 disqualification**: If the surviving spouse gave cause for legal separation, they get NOTHING (entire estate falls to next class).

**Articulo mortis**: Art. 900 ¶2's ⅓ reduction applies to the **testate legitime** only. In intestate I11, there is no explicit parallel provision — the surviving spouse inherits the entire estate. However, there is academic debate on whether the articulo mortis rule applies by analogy in intestate succession. Engine recommendation: **do not apply** the ⅓ reduction in intestate — Art. 900 ¶2 is in the Legitime section (testate), not in the Intestate Succession chapter.

---

#### I12 — Surviving Spouse + Siblings/Nephews/Nieces

**Surviving heirs**: Surviving spouse + brothers/sisters or their children (no descendants, no ascendants, no illegitimate children)
**Legal basis**: Art. 1001
**Rule**: ½ to spouse, ½ to siblings/their children.

> "Should brothers and sisters or their children survive with the widow or widower, the latter shall be entitled to one-half (½) of the inheritance and the brothers and sisters or their children to the other half." — Art. 1001

This is the **only scenario** where collateral relatives (Class 5) concur with a higher class (Class 4). Art. 995 expressly carves out this exception ("without prejudice to the rights of brothers and sisters, nephews and nieces... under Article 1001").

```
function distribute_I12(estate: Money, spouse: Heir,
                         collaterals: List<Heir>) -> Map<Heir, Money> {
  result = { spouse: estate / 2 }
  collateral_total = estate / 2
  collateral_shares = distribute_collaterals(collateral_total, collaterals)
  result.merge(collateral_shares)
  return result
}
```

**Scope of Art. 1001**: The article says "brothers and sisters or their children" — this limits the concurrence to siblings and nephews/nieces. More remote collaterals (cousins, etc.) do NOT concur with the spouse. If only remote collaterals survive with the spouse, the spouse takes the entire estate per Art. 995 (and the remote collaterals are excluded).

---

### Class 5: Collateral Relatives (No Descendants, No Ascendants, No Illegitimate Children, No Spouse — or Art. 1001 Concurrence)

#### I13 — Siblings Only

**Surviving heirs**: Brothers and sisters of the decedent
**Legal basis**: Arts. 1003, 1004, 1006, 1007
**Rules**:
- Full blood siblings: equal shares (Art. 1004)
- Full + half blood: full blood gets **double** the share of half blood (Art. 1006)
- Half blood only (both sides): equal shares regardless of which parent (Art. 1007)

```
function distribute_siblings(amount: Money, siblings: List<Sibling>) -> Map<Heir, Money> {
  full_blood = filter(s where s.blood_type == FULL, siblings)
  half_blood = filter(s where s.blood_type == HALF, siblings)

  if count(half_blood) == 0:
    // Art. 1004: all full blood → equal shares
    per_sibling = amount / count(siblings)
    return { s: per_sibling for s in siblings }

  if count(full_blood) == 0:
    // Art. 1007: all half blood → equal shares (no line distinction)
    per_sibling = amount / count(siblings)
    return { s: per_sibling for s in siblings }

  // Art. 1006: mixed → full blood = 2 units, half blood = 1 unit
  total_units = (count(full_blood) * 2) + (count(half_blood) * 1)
  per_unit = amount / total_units

  result = {}
  for s in full_blood:
    result[s] = per_unit * 2
  for s in half_blood:
    result[s] = per_unit * 1
  return result
}
```

**Example**: Estate = ₱10,000,000; 2 full-blood siblings + 1 half-blood sibling
- Total units: (2 × 2) + (1 × 1) = 5
- Per unit: ₱2,000,000
- Each full-blood: ₱4,000,000; Half-blood: ₱2,000,000

---

#### I13a — Siblings + Nephews/Nieces (No Spouse)

**Surviving heirs**: Some siblings alive + children of predeceased siblings
**Legal basis**: Arts. 1005, 1008
**Rule**: Surviving siblings inherit per capita; nephews/nieces of predeceased siblings inherit per stirpes.

> "Should brothers and sisters survive together with nephews and nieces, who are the children of the decedent's brothers and sisters who are dead, the former shall inherit per capita, and the latter per stirpes." — Art. 1005

The full/half blood rule (Art. 1006) applies here too — a half-blood sibling's share (or their represented line) is half that of a full-blood sibling (Art. 1008).

```
function distribute_siblings_with_representation(amount: Money,
    sibling_lines: List<SiblingLine>) -> Map<Heir, Money> {

  // Each surviving sibling = 1 line; each predeceased sibling with children = 1 line
  // Apply full/half blood weighting per line
  total_units = 0
  for line in sibling_lines:
    units = 2 if line.blood_type == FULL else 1
    total_units += units

  per_unit = amount / total_units
  result = {}

  for line in sibling_lines:
    units = 2 if line.blood_type == FULL else 1
    line_share = per_unit * units

    if line.mode == OWN_RIGHT:
      result[line.original_sibling] = line_share
    else:  // REPRESENTATION (predeceased sibling → nephews/nieces)
      per_nephew = line_share / count(line.representatives)
      for nephew in line.representatives:
        result[nephew] = per_nephew

  return result
}
```

---

#### I13b — Nephews/Nieces Only (All Siblings Predeceased)

**Surviving heirs**: Only nephews/nieces (all siblings predeceased)
**Legal basis**: Art. 975
**Rule**: Per capita (equal shares among all nephews/nieces) — NOT per stirpes.

> "But if they alone survive, they shall inherit in equal portions." — Art. 975

```
function distribute_nephews_only(amount: Money, nephews: List<Heir>) -> Map<Heir, Money> {
  // Art. 975: per capita when no surviving siblings
  // Art. 1008: half-blood nephews' children have same rules as half-blood siblings
  // But Art. 975 says "equal portions" — this overrides per-stirpes

  per_nephew = amount / count(nephews)
  return { n: per_nephew for n in nephews }
}
```

**Note**: There is scholarly debate on whether Art. 1006's full/half blood doubling rule applies to nephews/nieces inheriting per capita under Art. 975. Art. 1008 says they succeed "in accordance with the rules laid down for the brothers and sisters of the full blood" — suggesting the double-share rule may apply even in per capita mode. The engine should apply the Art. 1006 doubling rule by default for consistency, with a configuration flag for the alternative interpretation (pure equal shares).

---

#### I14 — Other Collateral Relatives (Within 5th Degree)

**Surviving heirs**: No siblings, no nephews/nieces, but other collateral relatives within the 5th degree
**Legal basis**: Arts. 1009, 1010
**Rule**: Nearest degree inherits. No line or blood distinction.

> "Should there be neither brothers nor sisters, nor children of brothers or sisters, the other collateral relatives shall succeed to the estate. The latter shall succeed without distinction of lines or preference among them by reason of relationship by the whole blood." — Art. 1009

> "The right to inherit ab intestato shall not extend beyond the fifth degree of relationship in the collateral line." — Art. 1010

```
function distribute_other_collaterals(amount: Money,
    collaterals: List<Heir>) -> Map<Heir, Money> {
  // Art. 1009: no line or blood distinction
  // Art. 962: nearest degree excludes more remote
  // Art. 1010: max 5th degree

  // Filter to within 5th degree
  eligible = filter(c where c.collateral_degree <= 5, collaterals)
  if count(eligible) == 0:
    return {}  // Falls to State (I15)

  // Nearest degree excludes more remote
  min_degree = min(c.collateral_degree for c in eligible)
  nearest = filter(c where c.collateral_degree == min_degree, eligible)

  // Equal shares, no blood/line distinction
  per_heir = amount / count(nearest)
  return { c: per_heir for c in nearest }
}
```

**Degree counting** (Art. 966): In the collateral line, count up to the common ancestor, then down. Siblings = 2nd degree, nephews/nieces = 3rd degree, first cousins = 4th degree, children of first cousins = 5th degree.

---

#### I15 — No Heirs (Estate to the State)

**Surviving heirs**: None within the legal hierarchy
**Legal basis**: Arts. 1011-1014
**Rule**: Entire estate to the State.

> "In default of persons entitled to succeed in accordance with the provisions of the preceding Sections, the State shall inherit the whole estate." — Art. 1011

```
function distribute_I15(estate: Money) -> EscheatedEstate {
  return EscheatedEstate {
    total: estate,
    // Art. 1013: personal property → municipality/city of last residence
    // Art. 1013: real property → municipality/city where situated
    // Art. 1013: for benefit of public schools and charitable institutions
    // Art. 1014: legitimate heir can reclaim within 5 years
    escheat_deadline: decedent.date_of_death + 5_years,
  }
}
```

---

### Special Scenarios: Illegitimate Decedent

When the decedent is themselves an illegitimate child, the Iron Curtain Rule (Art. 992) applies, and Art. 993 governs the parents' inheritance.

#### I-ID1 — Illegitimate Decedent: Parents Only (No Descendants, No Spouse, No Children)

**Legal basis**: Art. 993
**Rule**: Parents inherit the entire estate (equal shares if both surviving).

> "If an illegitimate child should die without issue, either legitimate or illegitimate, his father or mother shall succeed to his entire estate; and if the child's filiation is duly proved as to both parents, who are both living, they shall inherit from him share and share alike." — Art. 993

#### I-ID2 — Illegitimate Decedent: Iron Curtain Rule

**Legal basis**: Art. 992
**Rule**: Illegitimate child has NO right to inherit ab intestato from the legitimate children and relatives of their father/mother; nor do such children/relatives inherit from the illegitimate child.

**Engine impact**: When filtering intestate heirs for an illegitimate decedent:
- Exclude the decedent's parents' legitimate children (the decedent's half-siblings from the legitimate side)
- Exclude the decedent's parents' other legitimate relatives
- Only allow: decedent's own descendants, decedent's parents, decedent's spouse, decedent's own illegitimate children

---

## The Collateral Distribution Algorithm

Collateral relatives require their own distribution sub-algorithm due to the interplay of full/half blood rules, representation, and the per capita switch:

```
function distribute_collaterals(amount: Money, collaterals: List<Heir>) -> Map<Heir, Money> {
  // Step 1: Check for siblings (Arts. 1004-1008)
  siblings = filter(c where c.is_sibling_of_decedent, collaterals)
  nephews_nieces = filter(c where c.is_child_of_sibling_of_decedent, collaterals)

  if count(siblings) > 0 AND count(nephews_nieces) > 0:
    // Art. 1005: siblings per capita + nephews per stirpes
    return distribute_siblings_with_representation(amount,
      build_sibling_lines(siblings, nephews_nieces))

  if count(siblings) > 0:
    // Art. 1004/1006: siblings only
    return distribute_siblings(amount, siblings)

  if count(nephews_nieces) > 0:
    // Art. 975: nephews/nieces alone → per capita (equal shares)
    return distribute_nephews_only(amount, nephews_nieces)

  // Step 2: Other collateral relatives (Arts. 1009-1010)
  return distribute_other_collaterals(amount, collaterals)
}
```

---

## Complete Intestate Distribution Algorithm (Master Function)

```
function distribute_intestate(estate: Money, heirs: List<Heir>,
                               decedent: Decedent) -> Map<Heir, DistributionResult> {
  // ====================================================================
  // Step 1: Build lines and classify heirs
  // ====================================================================
  legit_lines = build_legitimate_lines(decedent, heirs)
  illegit_lines = build_illegitimate_lines(decedent, heirs)
  ascendants = get_eligible_ascendants(decedent, heirs)
  spouse = get_eligible_spouse(heirs)
  collaterals = get_eligible_collaterals(decedent, heirs)

  has_legit = count(legit_lines) > 0
  has_ascendants = count(ascendants) > 0
  has_illegit = count(illegit_lines) > 0
  has_spouse = spouse != null
  has_siblings = any(c where c.is_sibling_of_decedent OR c.is_child_of_sibling_of_decedent, collaterals)
  has_any_collateral = count(collaterals) > 0

  // ====================================================================
  // Step 2: Apply Iron Curtain Rule for illegitimate decedent (Art. 992)
  // ====================================================================
  if decedent.is_illegitimate:
    collaterals = filter_iron_curtain(collaterals, decedent)

  // ====================================================================
  // Step 3: Mutual exclusion — Group 1 excludes Group 2
  // ====================================================================
  if has_legit:
    has_ascendants = false
    ascendants = []

  // ====================================================================
  // Step 4: Determine intestate scenario and distribute
  // ====================================================================
  scenario = determine_intestate_scenario(has_legit, has_ascendants,
                                           has_illegit, has_spouse,
                                           has_siblings, has_any_collateral)

  raw_shares = match scenario {
    I1  => distribute_I1(estate, legit_lines)
    I2  => distribute_I2(estate, legit_lines, spouse)
    I3  => distribute_I3(estate, legit_lines, illegit_lines)
    I4  => distribute_I4(estate, legit_lines, illegit_lines, spouse)
    I5  => distribute_I5(estate, ascendants)
    I6  => distribute_I6(estate, ascendants, spouse)
    I7  => distribute_I7(estate, illegit_lines)
    I8  => distribute_I8(estate, illegit_lines, spouse)
    I9  => distribute_I9(estate, ascendants, illegit_lines)
    I10 => distribute_I10(estate, ascendants, illegit_lines, spouse)
    I11 => distribute_I11(estate, spouse)
    I12 => distribute_I12(estate, spouse, collaterals)
    I13 => distribute_collaterals(estate, collaterals)
    I14 => distribute_other_collaterals(estate, collaterals)
    I15 => distribute_I15(estate)
  }

  // ====================================================================
  // Step 5: Handle accretion for renouncing heirs (Art. 1018)
  // ====================================================================
  final_shares = apply_intestate_accretion(raw_shares, heirs, scenario)

  // ====================================================================
  // Step 6: Generate per-heir DistributionResult with narrative
  // ====================================================================
  return generate_results(final_shares, scenario, estate, decedent)
}

function determine_intestate_scenario(
    has_legit: bool, has_ascendants: bool, has_illegit: bool,
    has_spouse: bool, has_siblings: bool, has_any_collateral: bool
) -> IntestateScenario {
  match (has_legit, has_ascendants, has_illegit, has_spouse) {
    (true,  false, false, false) => I1
    (true,  false, false, true)  => I2
    (true,  false, true,  false) => I3
    (true,  false, true,  true)  => I4
    (false, true,  false, false) => I5
    (false, true,  false, true)  => I6
    (false, false, true,  false) => I7
    (false, false, true,  true)  => I8
    (false, true,  true,  false) => I9
    (false, true,  true,  true)  => I10
    (false, false, false, true)  =>
      if has_siblings: I12    // Art. 1001: spouse + siblings
      else: I11               // Spouse alone (remote collaterals excluded by Art. 995)
    (false, false, false, false) =>
      if has_any_collateral:
        if has_siblings: I13  // Siblings/nephews/nieces
        else: I14             // Other collaterals within 5th degree
      else: I15               // No heirs → State
  }
}
```

---

## Intestate Accretion Rules (Art. 1018)

> "In legal succession the share of the person who repudiates the inheritance shall always accrue to his co-heirs." — Art. 1018

When an intestate heir renounces:

```
function apply_intestate_accretion(shares: Map<Heir, Money>, heirs: List<Heir>,
                                    scenario: IntestateScenario) -> Map<Heir, Money> {
  renouncing = filter(h where h.has_renounced, keys(shares))

  if count(renouncing) == 0:
    return shares  // No renunciation → no change

  for heir in renouncing:
    vacant_share = shares.remove(heir)

    // Art. 977: renouncing heir CANNOT be represented
    // Art. 1018: share accrues to co-heirs of the same degree
    co_heirs = get_co_heirs(heir, shares, scenario)

    if count(co_heirs) == 0:
      // Art. 969: if ALL of same degree renounce → next degree inherits in own right
      // Must re-evaluate the entire scenario
      return re_evaluate_scenario(shares, heirs, scenario)

    // Accrue proportionally to co-heirs
    total_co_heir_shares = sum(shares[h] for h in co_heirs)
    for co_heir in co_heirs:
      proportion = shares[co_heir] / total_co_heir_shares
      shares[co_heir] += vacant_share * proportion

  return shares
}
```

**Key interaction**: Accretion interacts differently depending on the scenario:
- **Within same class** (e.g., 3 legitimate children, 1 renounces): share accrues to the other 2 children
- **Cross-class** (e.g., I4: 2 LC + 1 IC + spouse, IC renounces): whether the IC's share goes only to other ICs, or to ALL co-heirs, is debated. Art. 1018 says "co-heirs" without qualification → the share accrues to ALL remaining heirs in the scenario proportionally. Engine default: accrue to all co-heirs proportionally.

---

## Testate vs Intestate Comparison Table

This table highlights the **economic difference** for each heir combination between testate (minimum: just the legitime) and intestate (full intestate share). The difference represents what the testator could redirect via the free portion if a will existed.

| Scenario | Heirs | Testate Total Compulsory | Intestate Total | Spouse Testate | Spouse Intestate | Spouse Gain (Intestate) |
|----------|-------|-------------------------|----------------|----------------|-----------------|----------------------|
| I1/T1 | LC only | ½ (legitime) | 1 (entire) | — | — | — |
| I2/T2 | 1 LC + S | ¾ (½+¼) | 1 | ¼ | ½ | +100% |
| I2/T3 | 2 LC + S | ⅚ (½+⅙+⅙) → ⅔ for 2LC+S | 1 | 1/(2n) | 1/(n+1) | +33-100% |
| I3/T4 | LC + IC | > ½ (depends) | 1 | — | — | — |
| I6/T7 | Parents + S | ¾ (½+¼) | 1 | ¼ | ½ | +100% |
| I8/T10 | IC + S | ⅔ (⅓+⅓) | 1 | ⅓ | ½ | +50% |
| I10/T9 | Asc+IC+S | ⅞ (½+¼+⅛) | 1 | ⅛ | ¼ | +100% |

**Key insight**: In intestate succession, the surviving spouse ALWAYS receives more than their testate legitime. This is because the free portion (which the testator controls in testate) gets absorbed into the intestate shares — and the spouse consistently benefits from this absorption.

---

## Interaction with Representation

Representation integrates seamlessly with the intestate distribution:

1. **Before scenario determination**: Build lines (Step 1.5). Each represented line counts as ONE heir for scenario purposes.
2. **During distribution**: Each line receives its computed share. Within a represented line, per stirpes division applies.
3. **Line counting**: The number of legitimate lines determines per-share value in I1, I2, I3, I4. Represented lines are counted just like living children.

```
// Helper used by all I1-I4 scenarios
function distribute_line_share(line_share: Money, line: LineInfo,
                                result: Map<Heir, Money>) {
  if line.mode == OWN_RIGHT:
    result[line.original_heir] = line_share
  else:  // REPRESENTATION
    per_rep = line_share / count(line.representatives)
    for rep in line.representatives:
      result[rep] = per_rep
}
```

---

## Interaction with Mixed Succession (Art. 960(2))

When a will partially disposes of the estate, the undisposed remainder distributes per intestate rules:

```
function distribute_mixed(estate: Money, will: Will, heirs: List<Heir>,
                           decedent: Decedent) -> Map<Heir, DistributionResult> {
  // Step 1: Compute total legitime and validate will
  legitime_total = compute_total_legitime(estate, heirs)
  free_portion = estate - legitime_total

  // Step 2: Satisfy will dispositions (within free portion)
  will_distributed = satisfy_will(will, free_portion, heirs)

  // Step 3: Compute undisposed remainder
  will_total = sum(will_distributed.values())
  remainder = estate - legitime_total - will_total

  // Step 4: Distribute remainder per intestate rules
  if remainder > 0:
    intestate_shares = distribute_intestate(remainder, heirs, decedent)
    // Combine with legitime and will distributions
    return combine_distributions(legitime_total, will_distributed, intestate_shares, heirs)

  // Step 5: If will disposes of everything within free portion
  return generate_testate_results(legitime_total, will_distributed, heirs)
}
```

---

## Edge Cases

### 1. Legal Separation — Guilty Spouse (Art. 1002)

> "In case of a legal separation, if the surviving spouse gave cause for the separation, he or she shall not have any of the rights granted in the preceding articles."

The guilty spouse is **completely excluded** from intestate succession. The engine must:
- Remove the spouse from the heir pool before scenario determination
- Re-evaluate which scenario applies (e.g., I4 without spouse becomes I3)

### 2. All Nearest Relatives Renounce (Art. 969)

> "If the inheritance should be repudiated by the nearest relative, should there be one only, or by all the nearest relatives called by law to succeed, should there be several, those of the following degree shall inherit in their own right and cannot represent the person or persons repudiating the inheritance."

When ALL heirs of the nearest degree renounce:
- Next degree inherits **in their own right** (NOT by representation)
- The engine must re-run scenario determination with the renouncing heirs removed
- Art. 977 confirms: children of renouncing heirs cannot represent them

### 3. Simultaneous Death (Commorientes)

If the decedent and an heir die simultaneously (and it cannot be determined who died first), Art. 43 of the Civil Code provides:
> "If there is a doubt, as between two or more persons who are called to succeed each other, as to which of them died first, whoever alleges the death of one prior to the other, shall prove the same; in the absence of proof, it is presumed that they died at the same time and there shall be no transmission of rights from one to the other."

**Engine logic**: If simultaneous death with an heir → that heir is treated as predeceased → representation applies (if eligible).

### 4. Unworthiness to Succeed (Art. 1032)

An unworthy heir is excluded from intestate succession. If the unworthy heir is a child/descendant:
- Art. 1035: their children/descendants acquire the right to the legitime
- Engine: treat like predecease for representation purposes (their descendants step in)

### 5. Art. 992 Iron Curtain in Intestate

The Iron Curtain Rule is specific to intestate succession. In the engine's heir filtering:

```
function filter_iron_curtain(heirs: List<Heir>, decedent: Decedent) -> List<Heir> {
  if NOT decedent.is_illegitimate:
    return heirs  // Rule only applies when DECEDENT is illegitimate

  // Filter out legitimate relatives of decedent's parents
  // who are NOT the decedent's own descendants or parents
  return filter(h where NOT is_blocked_by_iron_curtain(h, decedent), heirs)
}

function is_blocked_by_iron_curtain(heir: Heir, decedent: Decedent) -> bool {
  // Art. 992: An illegitimate child has no right to inherit ab intestato
  // from the legitimate children and relatives of his father or mother
  // (nor vice versa)
  if heir.is_legitimate_relative_of(decedent.father) AND
     heir != decedent.father:
    return true
  if heir.is_legitimate_relative_of(decedent.mother) AND
     heir != decedent.mother:
    return true
  return false
}
```

### 6. Spouse Concurring with Siblings vs Remote Collaterals

Art. 1001 only allows **siblings and their children** to concur with the spouse. If the only surviving collaterals are more remote (e.g., first cousins), the spouse takes the entire estate per Art. 995. The engine must distinguish:

```
function spouse_collateral_concurrence(spouse: Heir, collaterals: List<Heir>) -> IntestateScenario {
  siblings_or_nephews = filter(c where c.is_sibling_of_decedent
    OR c.is_child_of_sibling_of_decedent, collaterals)

  if count(siblings_or_nephews) > 0:
    return I12  // Art. 1001: ½ spouse, ½ siblings
  else:
    return I11  // Art. 995: entire estate to spouse (remote collaterals excluded)
}
```

### 7. Half-Blood Siblings from Different Parents

Art. 1007: Half-blood siblings "on the father's and some on the mother's side" inherit in equal shares "without distinction as to the origin of the property."

```
// Art. 1007: all half-blood from different parents → equal shares
// This overrides any line-based logic when only half-blood siblings survive
// Example: Decedent has half-sibling A (same father) and half-sibling B (same mother)
// A and B inherit equally
```

### 8. The 5th Degree Limit (Art. 1010)

Collateral relatives beyond the 5th degree CANNOT inherit intestate. If the nearest surviving collateral is at the 6th degree or beyond, the estate escheats to the State.

### 9. Art. 984 — Death of an Adopted Child

> "In case of the death of an adopted child, leaving no children or descendants, his parents and relatives by consanguinity and not by adoption, shall be his legal heirs."

**Note**: This article has been superseded by RA 8552 and RA 11642. Under RA 8552, the adopter's family inherits (not biological relatives). Under RA 11642, the scope is further expanded. The engine should apply the statute in effect at the time of the decedent's death (see adopted-children-rights analysis for full regime handling).

---

## Test Implications

### Scenario Determination Tests

| # | Surviving Heirs | Expected Scenario |
|---|----------------|------------------|
| 1 | 3 legitimate children | I1 |
| 2 | 2 legitimate children + spouse | I2 |
| 3 | 2 legitimate + 1 illegitimate | I3 |
| 4 | 2 legitimate + 1 illegitimate + spouse | I4 |
| 5 | Both parents (no descendants) | I5 |
| 6 | Both parents + spouse | I6 |
| 7 | 3 illegitimate children | I7 |
| 8 | 2 illegitimate + spouse | I8 |
| 9 | Both parents + 2 illegitimate | I9 |
| 10 | Both parents + 1 illegitimate + spouse | I10 |
| 11 | Spouse only | I11 |
| 12 | Spouse + 2 siblings | I12 |
| 13 | 3 siblings (full blood) | I13 |
| 14 | No heirs at all | I15 |

### Distribution Amount Tests (Estate = ₱12,000,000)

| # | Scenario | Heirs | Expected Distribution |
|---|----------|-------|----------------------|
| 15 | I1 | 3 LC | LC1: ₱4M, LC2: ₱4M, LC3: ₱4M |
| 16 | I2 | 3 LC + S | Each: ₱3M (4 equal shares) |
| 17 | I3 | 2 LC + 2 IC | LC each: ₱4M (2 units), IC each: ₱2M (1 unit); total 6 units |
| 18 | I4 | 2 LC + 1 IC + S | Units: 2+2+1+2=7; per unit: ₱12M/7=₱1,714,286; LC: ₱3,428,571; IC: ₱1,714,286; S: ₱3,428,571 |
| 19 | I5 | Both parents | F: ₱6M, M: ₱6M |
| 20 | I6 | Both parents + S | F: ₱3M, M: ₱3M, S: ₱6M |
| 21 | I7 | 3 IC | Each: ₱4M |
| 22 | I8 | 2 IC + S | S: ₱6M, IC1: ₱3M, IC2: ₱3M |
| 23 | I9 | Both parents + 2 IC | F: ₱3M, M: ₱3M, IC1: ₱3M, IC2: ₱3M |
| 24 | I10 | Both parents + 2 IC + S | F: ₱3M, M: ₱3M, IC1: ₱1.5M, IC2: ₱1.5M, S: ₱3M |
| 25 | I11 | S only | S: ₱12M |
| 26 | I12 | S + 2 full-blood siblings | S: ₱6M, Sib1: ₱3M, Sib2: ₱3M |
| 27 | I13 | 2 full + 1 half-blood siblings | Full: ₱4.8M each (2 units), Half: ₱2.4M (1 unit); total 5 units |

### Representation Integration Tests

| # | Scenario | Heirs | Expected Distribution |
|---|----------|-------|----------------------|
| 28 | I1 + rep | 2 LC alive + 1 predeceased LC with 3 GC | 3 lines: LC1 ₱4M, LC2 ₱4M, GC1 ₱1.33M, GC2 ₱1.33M, GC3 ₱1.33M |
| 29 | I2 + rep | 1 LC alive + 1 predeceased LC with 2 GC + S | 3 shares (2 lines + S): LC ₱4M, GC1 ₱2M, GC2 ₱2M, S ₱4M |
| 30 | I4 + rep | 1 LC alive + 1 predeceased LC with 1 GC + 1 IC + S | Units: 2+2+1+2=7; per unit ₱12M/7; LC ₱3.43M, GC ₱3.43M, IC ₱1.71M, S ₱3.43M |

### Collateral Distribution Tests

| # | Scenario | Heirs | Expected Distribution |
|---|----------|-------|----------------------|
| 31 | I13 full+half | 2 full-blood + 2 half-blood siblings | Full: ₱4M each (2u), Half: ₱2M each (1u); 6 units total |
| 32 | I13a sib+nephew | 1 sibling + 2 nephews (of predeceased sibling), all full blood | Sibling: ₱6M; N1: ₱3M, N2: ₱3M (per stirpes) |
| 33 | I13b nephews only | 3 nephews from 2 predeceased siblings | Per capita (Art. 975): ₱4M each |
| 34 | I12 + half blood | S + 1 full-blood sib + 1 half-blood sib | S: ₱6M; Full sib: ₱4M (2u of ₱6M/3u); Half sib: ₱2M (1u of ₱6M/3u) |

### Edge Case Tests

| # | Scenario | Expected Result |
|---|----------|----------------|
| 35 | I2 with guilty spouse (Art. 1002) | Spouse excluded → falls to I1 |
| 36 | I1 with 1 child renouncing (of 3) | Renouncing child's share accrues to 2 remaining (Art. 1018) |
| 37 | I1 with ALL children renouncing, parents survive | Re-evaluate: falls to I5 (Art. 969) |
| 38 | Spouse + first cousins (no siblings) | I11 (cousins excluded; Art. 1001 only applies to siblings) |
| 39 | Collateral at 6th degree, no one else | I15 (Art. 1010 bars beyond 5th degree → State) |
| 40 | I4 with IC renouncing | IC's share accrues to all co-heirs proportionally |
| 41 | Illegitimate decedent with half-siblings | Art. 992 Iron Curtain → half-siblings excluded |

### Testate vs Intestate Comparison Tests (Estate = ₱12,000,000)

| # | Heirs | Spouse Testate Legitime | Spouse Intestate Share | Difference |
|---|-------|------------------------|-----------------------|-----------|
| 42 | 1 LC + S | ₱3M (¼) | ₱6M (½) | +₱3M (+100%) |
| 43 | 3 LC + S | ₱1.5M (⅛) | ₱3M (¼) | +₱1.5M (+100%) |
| 44 | Parents + S | ₱3M (¼) | ₱6M (½) | +₱3M (+100%) |
| 45 | 2 IC + S | ₱4M (⅓) | ₱6M (½) | +₱2M (+50%) |
| 46 | Parents + 1 IC + S | ₱1.5M (⅛) | ₱3M (¼) | +₱1.5M (+100%) |

---

## Narrative Template for Intestate Distribution

The narrative for each intestate heir must explain:
1. The succession type (intestate) and why (no will / void will / undisposed portion)
2. The applicable scenario and legal basis
3. The computation method (equal shares / ratio method / fixed fractions)
4. The specific articles that determine their share

### Template Examples

**For I2 (Legitimate Children + Spouse)**:
> **{heir_name} ({relationship})** receives **₱{amount}**.
> The decedent died intestate (without a valid will). Under Art. 996 of the Civil Code, when legitimate children or descendants and a surviving spouse survive the decedent, the surviving spouse receives a share equal to that of each legitimate child. With {n} legitimate children and the surviving spouse, the ₱{estate} estate is divided into {n+1} equal shares of ₱{per_share} each.

**For I4 (Legitimate + Illegitimate + Spouse, ratio method)**:
> **{heir_name} (illegitimate child)** receives **₱{amount}**.
> The decedent died intestate. Under Art. 999, the surviving spouse receives the same share as a legitimate child. Under Arts. 983 and 895, each illegitimate child receives one-half (½) the share of a legitimate child. Using the ratio method: each legitimate child = 2 units, each illegitimate child = 1 unit, surviving spouse = 2 units. Total units = {total}. Per unit = ₱{estate}/{total} = ₱{per_unit}. As an illegitimate child (1 unit), {heir_name} receives ₱{amount}.

**For I12 (Spouse + Siblings)**:
> **{heir_name} (surviving spouse)** receives **₱{amount}**.
> The decedent died intestate with no descendants, ascendants, or illegitimate children. Under Art. 1001 of the Civil Code, when brothers and sisters or their children survive with the surviving spouse, the spouse receives one-half (½) of the estate and the siblings receive the other half. The surviving spouse therefore receives ₱{estate/2}.

**For I13 (Siblings with full/half blood)**:
> **{heir_name} (half-blood sibling)** receives **₱{amount}**.
> The decedent died intestate with no descendants, ascendants, illegitimate children, or surviving spouse. Under Art. 1006 of the Civil Code, when siblings of the full blood and half blood survive together, full-blood siblings receive double the share of half-blood siblings. Using the unit method: each full-blood sibling = 2 units, each half-blood sibling = 1 unit. Total units = {total}. {heir_name}, as a half-blood sibling (1 unit), receives ₱{amount}.

**For I15 (Escheat to State)**:
> The decedent died intestate with no surviving heirs within the degrees prescribed by law. Under Art. 1011 of the Civil Code, the State inherits the entire estate. Per Art. 1013, personal property is assigned to the municipality/city of the decedent's last residence, and real estate to the municipalities/cities where situated, for the benefit of public schools and charitable institutions. Under Art. 1014, a legitimate heir may reclaim the estate within five (5) years from delivery to the State.

---

## Data Model Additions

### IntestateScenario Enum

```
enum IntestateScenario {
  I1,   // Legitimate children only (Art. 980)
  I2,   // Legitimate children + spouse (Arts. 994, 996)
  I3,   // Legitimate + illegitimate children (Arts. 983, 895)
  I4,   // Legitimate + illegitimate + spouse (Arts. 999, 983, 895)
  I5,   // Legitimate ascendants only (Arts. 985, 986, 987)
  I6,   // Legitimate ascendants + spouse (Art. 997)
  I7,   // Illegitimate children only (Art. 988)
  I8,   // Illegitimate children + spouse (Art. 998)
  I9,   // Legitimate ascendants + illegitimate children (Art. 991)
  I10,  // Legitimate ascendants + illegitimate + spouse (Art. 1000)
  I11,  // Surviving spouse only (Art. 995)
  I12,  // Surviving spouse + siblings (Art. 1001)
  I13,  // Collateral relatives — siblings/nephews/nieces (Arts. 1003-1008)
  I14,  // Collateral relatives — other within 5th degree (Arts. 1009-1010)
  I15,  // No heirs — State (Arts. 1011-1014)
}
```

### CollateralHeir Struct

```
struct CollateralHeir {
  heir: Heir,
  collateral_degree: int,         // degree of collateral relationship (2=sibling, 3=nephew, etc.)
  is_sibling_of_decedent: bool,
  is_child_of_sibling: bool,      // nephew/niece
  blood_type: BloodType,          // FULL or HALF (Art. 967)
  sibling_parent_side: ParentSide | null,  // PATERNAL or MATERNAL (for half-blood)
}

enum BloodType { FULL, HALF }
enum ParentSide { PATERNAL, MATERNAL }
```

### SiblingLine Struct (for collateral representation)

```
struct SiblingLine {
  original_sibling: Heir,
  blood_type: BloodType,
  mode: InheritanceMode,         // OWN_RIGHT or REPRESENTATION
  representatives: List<Heir>,   // nephews/nieces if represented
}
```

---

## Summary: Key Rules for the Engine

1. **No free portion in intestate**: The ENTIRE estate distributes to intestate heirs. There is no testator-controlled portion.
2. **No cap rule in intestate**: Art. 895 ¶3 cap does NOT apply. The 2:1 ratio (LC:IC) distributes the full estate proportionally.
3. **Spouse always gets more intestate**: In every scenario where a spouse concurs with other heirs, the intestate share exceeds the testate legitime.
4. **Art. 1001 is the only cross-class concurrence**: Collaterals only concur with spouse, and only if siblings/nephews/nieces.
5. **Art. 995 scope limitation**: Spouse takes entire estate UNLESS siblings/nephews/nieces survive (Art. 1001). More remote collaterals are excluded.
6. **Full/half blood rule**: Applies to siblings (Art. 1006) and their children (Art. 1008). Does NOT apply to other collaterals (Art. 1009: "without distinction of lines or preference among them by reason of relationship by the whole blood").
7. **5th degree limit**: Art. 1010 — intestate inheritance through collateral line stops at 5th degree. Beyond that → State.
8. **Art. 969 re-evaluation**: When ALL nearest relatives renounce, re-run scenario determination with them removed. Next degree inherits in own right, not by representation.
9. **Illegitimate decedent**: Art. 992 Iron Curtain applies in intestate only. Filter out parent's legitimate relatives before scenario determination.
10. **Guilty spouse exclusion**: Art. 1002 removes guilty spouse from ALL intestate scenarios. The scenario shifts as if no spouse existed.

---

*Analysis based on Civil Code Arts. 960-1014, 1015-1023, 1025, 1032-1035, 1041-1057; Family Code Art. 176; RA 8552 Sec. 17.*
