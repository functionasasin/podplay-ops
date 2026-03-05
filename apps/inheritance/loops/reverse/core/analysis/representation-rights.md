# Representation Rights

**Aspect**: representation-rights
**Wave**: 2 (Heir Classification Rules)
**Primary Legal Basis**: Arts. 970-977 (Civil Code), Arts. 981-982, 989-990 (intestate specific), Art. 902 (illegitimate children), Art. 923 (disinheritance), Art. 1035 (unworthiness)
**Depends On**: compulsory-heirs-categories, heir-concurrence-rules

---

## Legal Basis

### Core Definition (Art. 970)

> "Representation is a right created by fiction of law, by virtue of which the representative is raised to the place and the degree of the person represented, and acquires the rights which the latter would have if he were living or if he could have inherited."

### Source of the Right (Art. 971)

> "The representative is called to the succession by the law and not by the person represented."

**Key implication**: Representation is a legal fiction, not a delegation. The representative's right comes from the law itself, not from the person they represent. This means:
- The representative need not be an heir of the person represented
- Art. 976 confirms: "A person may represent him whose inheritance he has renounced"

### Where Representation Applies (Art. 972)

> "The right of representation takes place in the direct descending line, but never in the ascending. In the collateral line, it takes place only in favor of the children of brothers or sisters, whether they be of the full or half blood."

Three domains:
1. **Direct descending line**: ALWAYS available (grandchildren represent predeceased children, great-grandchildren represent predeceased grandchildren, etc.)
2. **Ascending line**: NEVER (if a parent dies, their parent does NOT represent them — the nearer-excludes-more-remote rule of Art. 890 applies instead)
3. **Collateral line**: LIMITED — only children of brothers/sisters (nephews/nieces) can represent, NOT more remote collaterals

### Capacity Requirement (Art. 973)

> "In order that representation may take place, it is necessary that the representative himself be capable of succeeding the decedent."

The representative must independently qualify to inherit from the original decedent:
- Must be alive at decedent's death (or conceived, per Art. 1025)
- Must not be unworthy to succeed the decedent (Art. 1032)
- Must not be incapacitated with respect to the decedent (Art. 1027)
- Need NOT be capable of succeeding the person represented (Art. 976 confirms this)

### Per Stirpes Division (Art. 974)

> "Whenever there is succession by representation, the division of the estate shall be made per stirpes, in such manner that the representative or representatives shall not inherit more than what the person they represent would have inherited, if he were living or could inherit."

This is the core computation rule:
- Representatives collectively receive EXACTLY what the person represented would have received
- If multiple representatives share a line, they divide that line's share equally among themselves
- The number of representatives does NOT increase the line's total share

### Collateral Representation — Per Stirpes vs Per Capita (Art. 975)

> "When children of one or more brothers or sisters of the deceased survive, they shall inherit from the latter by representation, if they survive with their uncles or aunts. But if they alone survive, they shall inherit in equal portions."

Two modes for nephews/nieces:
1. **With surviving uncles/aunts**: Per stirpes (by representation of their parent)
2. **Alone (no surviving siblings of decedent)**: Per capita (equal shares, in their own right)

### Renunciation and Representation (Arts. 976-977)

**Art. 976**: "A person may represent him whose inheritance he has renounced."

> You CAN represent someone even if you renounced your inheritance from THAT person. Example: Grandchild renounced inheritance from predeceased Father, but can still represent Father when inheriting from Grandfather.

**Art. 977**: "Heirs who repudiate their share may not be represented."

> If you renounce YOUR share from the decedent, your children CANNOT represent you. Example: Child renounces inheritance from Father — Child's children (grandchildren of Father) cannot represent Child. This is the opposite direction from Art. 976.

---

## Triggers for Representation

Representation is triggered when a person who WOULD have inherited cannot do so. The specific triggers are:

### Trigger 1: Predecease (Arts. 981, 982)

The most common trigger. The person represented died before the decedent.

- **Art. 981**: "Should children of the deceased and descendants of other children who are dead, survive, the former shall inherit in their own right, and the latter by right of representation."
- **Art. 982**: "The grandchildren and other descendants shall inherit by right of representation, and if any one of them should have died, leaving several heirs, the portion pertaining to him shall be divided among the latter in equal portions."

### Trigger 2: Disinheritance (Art. 923)

> "The children and descendants of the person disinherited shall take his or her place and shall preserve the rights of compulsory heirs with respect to the legitime; but the disinherited parent shall not have the usufruct or administration of the property which constitutes the legitime."

When a compulsory heir is validly disinherited:
- Their descendants step into their place
- The descendants preserve the disinherited heir's LEGITIME rights
- The disinherited parent is further barred from usufruct/administration

### Trigger 3: Incapacity/Unworthiness (Art. 1035)

> "If the person excluded from the inheritance by reason of incapacity should be a child or descendant of the decedent and should have children or descendants, the latter shall acquire his right to the legitime."

When a child/descendant is excluded for incapacity (Art. 1027) or unworthiness (Art. 1032):
- Their children/descendants acquire the excluded person's right to the legitime
- The excluded person has no usufruct or administration

### Trigger 4: Illegitimate Children's Descendants (Art. 902)

> "The rights of illegitimate children set forth in the preceding articles are transmitted upon their death to their descendants, whether legitimate or illegitimate."

When an illegitimate child of the decedent predeceases:
- Their descendants (whether legitimate or illegitimate) inherit by representation
- Art. 989 confirms: "If, together with illegitimate children, there should survive descendants of another illegitimate child who is dead, the former shall succeed in their own right and the latter by right of representation."
- Art. 990: "The hereditary rights granted by the two preceding articles to illegitimate children shall be transmitted upon their death to their descendants, who shall inherit by right of representation from their deceased grandparent."

### NON-Trigger: Renunciation (Art. 977)

Renunciation does NOT trigger representation:
- "Heirs who repudiate their share may not be represented"
- If a child renounces their inheritance from the decedent, their children cannot step in
- Instead, the renounced share accrues to co-heirs (Art. 1018: "In legal succession the share of the person who repudiates the inheritance shall always accrue to his co-heirs")
- If the renouncing heir was the ONLY heir of that degree, the next degree inherits in their OWN right (Art. 969), not by representation

---

## Rule (Pseudocode)

### Representation Eligibility Check

```
function can_be_represented(person: Heir, succession_type: SuccessionType) -> bool {
  // Must have a trigger condition
  if person.is_alive AND is_eligible(person):
    return false  // Alive and eligible — no need for representation

  // Check trigger type
  trigger = get_trigger(person)
  if trigger == NONE:
    return false

  // Art. 977: Renunciation does NOT trigger representation
  if trigger == RENUNCIATION:
    return false

  // Art. 972: Representation NEVER in ascending line
  if person.line_direction == ASCENDING:
    return false

  // Art. 972: In collateral line, ONLY children of siblings can represent
  if person.line_type == COLLATERAL:
    if NOT person.is_sibling_of_decedent:
      return false
    // Only nephews/nieces can represent, not more remote collaterals

  // Valid triggers: PREDECEASE, DISINHERITANCE, INCAPACITY, UNWORTHINESS
  return trigger in {PREDECEASE, DISINHERITANCE, INCAPACITY, UNWORTHINESS}
}

enum RepresentationTrigger {
  NONE,
  PREDECEASE,      // Arts. 981, 982
  DISINHERITANCE,  // Art. 923
  INCAPACITY,      // Art. 1035
  UNWORTHINESS,    // Art. 1035
  RENUNCIATION,    // Art. 977 — NOT a valid trigger
}

function get_trigger(person: Heir) -> RepresentationTrigger {
  if NOT person.is_alive:
    return PREDECEASE
  if person.is_disinherited AND person.disinheritance_valid:
    return DISINHERITANCE
  if person.is_unworthy AND NOT person.unworthiness_condoned:
    return UNWORTHINESS
  if person.is_incapacitated:
    return INCAPACITY
  if person.has_renounced:
    return RENUNCIATION  // Will be rejected by can_be_represented()
  return NONE
}
```

### Finding Representatives

```
function find_representatives(person: Heir, decedent: Decedent) -> List<Heir> {
  // Get person's descendants who can serve as representatives
  representatives = []

  for child in person.children:
    // Art. 973: Representative must be capable of succeeding the DECEDENT
    if is_capable_of_succeeding(child, decedent):
      if child.is_alive AND is_eligible(child):
        representatives.append(child)
      elif can_be_represented(child):
        // Recursive: this child is also dead/excluded, check THEIR descendants
        sub_reps = find_representatives(child, decedent)
        representatives.extend(sub_reps)
    // If child is incapable of succeeding the decedent, skip entirely

  return representatives
}

function is_capable_of_succeeding(heir: Heir, decedent: Decedent) -> bool {
  // Art. 973: the representative must independently qualify
  if NOT heir.is_alive:
    return false  // Must be alive at decedent's death (Art. 1025)
  if heir.is_unworthy_to(decedent) AND NOT heir.unworthiness_condoned:
    return false  // Art. 1032
  if heir.is_incapacitated_to(decedent):
    return false  // Art. 1027
  return true
}
```

### Per Stirpes Distribution

```
function distribute_per_stirpes(line_share: Money, representatives: List<Heir>,
                                 person_represented: Heir) -> Map<Heir, Money> {
  // Art. 974: representatives collectively receive exactly the person represented's share
  // If multiple, divide equally among themselves
  if len(representatives) == 0:
    return {}  // No representatives — share becomes vacant (accretion rules apply)

  per_rep_share = line_share / len(representatives)

  result = {}
  for rep in representatives:
    result[rep] = per_rep_share

  return result
}
```

### Multi-Level Representation (Recursive Per Stirpes)

```
// When representation goes multiple levels deep:
// Grandchild predeceased, their children (great-grandchildren) represent

function distribute_line(line_share: Money, original_heir: Heir, decedent: Decedent) -> Map<Heir, Money> {
  // Base case: heir is alive and eligible
  if original_heir.is_alive AND is_eligible(original_heir):
    return {original_heir: line_share}

  // Recursive case: heir cannot inherit, find representatives
  if NOT can_be_represented(original_heir):
    return {}  // No representation possible — vacant share

  representatives = []
  for child in original_heir.children:
    if is_capable_of_succeeding(child, decedent):
      representatives.append(child)

  if len(representatives) == 0:
    return {}  // No eligible representatives — vacant share

  // Divide line_share equally among immediate representatives
  per_rep_share = line_share / len(representatives)

  result = {}
  for rep in representatives:
    // Each representative may themselves need representation (recursive)
    sub_result = distribute_line(per_rep_share, rep, decedent)
    result.merge(sub_result)

  return result
}
```

### Counting "Lines" for Concurrence (Used by heir-concurrence-rules)

```
function count_lines_and_build_distribution(
    decedent: Decedent,
    succession_type: SuccessionType
) -> (int, Map<Heir, LineInfo>) {
  // Each child of the decedent (or their representatives) = 1 "line"
  // This count is critical for:
  //   - Art. 892: spouse share depends on 1 vs 2+ legitimate children
  //   - Legitime computation: collective ½ divided by number of lines

  lines = {}
  line_count = 0

  for child in decedent.children:
    category = effective_category(child)

    if category == LEGITIMATE_CHILD_GROUP:
      if child.is_alive AND is_eligible(child):
        line_count += 1
        lines[child] = LineInfo(type=OWN_RIGHT, count=1)
      elif can_be_represented(child):
        reps = find_representatives(child, decedent)
        if len(reps) > 0:
          line_count += 1  // Still counts as ONE line
          lines[child] = LineInfo(type=REPRESENTATION, representatives=reps, count=len(reps))
        // else: no representatives — this line is extinct

    elif category == ILLEGITIMATE_CHILD_GROUP:
      if child.is_alive AND is_eligible(child):
        line_count += 1  // (counted separately for illegitimate share computation)
        lines[child] = LineInfo(type=OWN_RIGHT, count=1)
      elif can_be_represented(child):  // Art. 902
        reps = find_representatives(child, decedent)
        if len(reps) > 0:
          line_count += 1
          lines[child] = LineInfo(type=REPRESENTATION, representatives=reps, count=len(reps))

  return (line_count, lines)
}
```

---

## Representation in Testate vs Intestate

### Testate Succession

In testate succession, representation affects the **legitime**:

1. The collective legitime (½ of estate for legitimate children per Art. 888) is divided by the number of **lines** (not heads)
2. Each line's share is then distributed per stirpes within that line
3. The spouse's share (Art. 892) is computed based on the number of lines (not individual representatives)
4. Representation does NOT affect the free portion disposition (that's governed by the will)

**Exception — Art. 854 (Preterition)**: If the represented person was preterited (omitted from the will):
> "The preterition or omission of one, some, or all of the compulsory heirs in the direct line... shall annul the institution of heir... If the omitted compulsory heirs should die before the testator, the institution shall be effectual, without prejudice to the right of representation."

This means: if a preterited heir predeceases the testator, the will is NOT annulled, but the preterited heir's descendants inherit by representation.

### Intestate Succession

In intestate succession, representation distributes shares more directly:

- **Art. 981**: Surviving children inherit in own right; descendants of dead children inherit by representation
- **Art. 989**: Same rule for illegitimate children
- **Art. 975** (collateral): Nephews/nieces inherit per stirpes if with surviving uncles/aunts, per capita if alone

The ratio method for intestate:
```
// Each legitimate child line = 2 units (or 1 unit per head in equal-share scenarios)
// Each illegitimate child line = 1 unit
// Spouse = same as 1 legitimate child line

// Within each line, distribute per stirpes:
per_line_share = total_for_line
if line.type == OWN_RIGHT:
  heir_gets = per_line_share  // entire line share
elif line.type == REPRESENTATION:
  per_rep = per_line_share / line.count  // divide equally among representatives
```

---

## Interactions

### With Disinheritance (Art. 923)

- Disinherited heir's descendants represent them and preserve their LEGITIME rights
- The disinherited parent has NO usufruct or administration over the inherited property
- The per-stirpes division treats the disinherited heir's line identically to a predeceased heir's line
- Engine: `trigger = DISINHERITANCE` → same computation as `PREDECEASE`

### With Incapacity/Unworthiness (Art. 1035)

- Children of an incapacitated/unworthy heir acquire the right to the LEGITIME
- Excluded parent has no usufruct or administration
- Engine: `trigger = INCAPACITY | UNWORTHINESS` → same computation as `PREDECEASE`
- Note: Art. 1035 says "acquire his right to the LEGITIME" — in intestate, the entire estate distributes as if it were all legitime, so this distinction doesn't matter for computation

### With Illegitimate Children (Arts. 902, 989, 990)

- Art. 902: Rights of illegitimate children transmit to their descendants (both legitimate and illegitimate)
- Art. 989: In intestate, descendants of a dead illegitimate child inherit by representation
- Art. 990: Confirms transmission to grandchildren by representation
- Engine: An illegitimate child line can be represented just like a legitimate child line
- The representatives inherit the illegitimate child's share (which is ½ of a legitimate child's share per Art. 895)

### With the Spouse (Art. 892)

- Art. 892 depends on the COUNT of legitimate children:
  - 1 child (or 1 line) → spouse gets ¼ of estate
  - 2+ children (or 2+ lines) → spouse gets equal to one child's share of the ½ legitime
- Represented lines COUNT as lines for this determination
- Example: Decedent had 3 children, all predeceased but all have grandchildren → 3 lines → spouse gets equal to one line's share (Art. 892 ¶2)

### With Renunciation (Arts. 976, 977)

- Art. 976: You CAN represent someone whose inheritance you renounced (renouncing from B ≠ renouncing from A through B)
- Art. 977: You CANNOT be represented if you renounce (your children cannot step in for your renounced share)
- These rules are ASYMMETRIC:
  - Upward: Renouncing from the represented person → still can represent them
  - Downward: Renouncing from the decedent → cannot be represented

### With Accretion (Arts. 1018, 1021)

- If a represented line has NO eligible representatives → that line's share becomes vacant
- Vacant shares are redistributed per accretion rules:
  - Intestate (Art. 1018): accrues to co-heirs of the same degree
  - Testate, legitime (Art. 1021): co-heirs succeed "in their own right" (not accretion proper)
  - Testate, free portion (Art. 1021): accretion proper may apply

### With Collateral Relatives (Art. 972, 975)

- Representation in the collateral line is LIMITED to children of siblings only
- Nephews/nieces can represent their parent (the decedent's sibling) per Art. 975
- Children of nephews/nieces (grand-nephews/nieces) CANNOT represent — Art. 972 limits collateral representation to "children of brothers or sisters"
- Art. 975 per capita exception: If ALL siblings predeceased and only nephews/nieces survive, they inherit per capita (equal shares), NOT per stirpes

---

## Edge Cases

### 1. Multi-Level Representation (Great-Grandchildren)

**Scenario**: Decedent D → Child C1 (predeceased) → Grandchild GC1 (also predeceased) → Great-grandchild GGC1 (alive)

**Rule**: Art. 970 creates a fiction of law with no depth limit in the direct descending line. Art. 982 states grandchildren "and other descendants" inherit by representation.

**Engine logic**: The recursive `distribute_line()` function handles this. GGC1 represents GC1, who represents C1. GGC1 receives C1's entire line share.

### 2. Mixed Live and Dead Representatives

**Scenario**: D → C1 (predeceased) → GC1 (alive) + GC2 (predeceased) → GGC1, GGC2 (alive)

**Computation**:
- C1's line share divided between GC1 and GC2's sub-line
- GC1 gets ½ of C1's line share (own right)
- GC2's sub-line gets ½ of C1's line share, divided between GGC1 and GGC2
- GGC1 gets ¼ of C1's line share
- GGC2 gets ¼ of C1's line share

### 3. Representative Is Unworthy to Succeed the Decedent

**Scenario**: D → C1 (predeceased) → GC1 (alive but unworthy to succeed D, per Art. 1032)

**Rule**: Art. 973 — the representative must be "capable of succeeding the decedent." GC1 cannot represent C1 because GC1 is unworthy to succeed D.

**Engine logic**: `is_capable_of_succeeding(GC1, D)` returns false. GC1 is excluded from the representative list. If GC1 has children, they may represent GC1 (recursive check).

### 4. Representation After Preterition of a Predeceased Heir (Art. 854)

**Scenario**: D's will omits C1 (preterited), but C1 predeceased D. C1 has grandchildren GC1, GC2.

**Rule**: Art. 854 final sentence: "If the omitted compulsory heirs should die before the testator, the institution shall be effectual, without prejudice to the right of representation."

**Effect**:
- The will is NOT annulled (because the preterited heir predeceased)
- GC1 and GC2 still inherit by representation — they get C1's LEGITIME
- The institution of other heirs in the will remains valid

### 5. Representation of an Illegitimate Child by Illegitimate Descendants

**Scenario**: D had illegitimate child IC1 who predeceased D. IC1 had an illegitimate child IGC1.

**Rule**: Art. 902 — rights of illegitimate children transmit to their descendants "whether legitimate or illegitimate." Art. 990 confirms representation.

**Engine logic**: IGC1 represents IC1. IGC1's share = IC1's share (½ of a legitimate child's share per Art. 895). If IC1 had multiple descendants, they split IC1's share equally per stirpes.

### 6. All Children Predeceased, All Grandchildren Represent

**Scenario**: D had 3 children (C1, C2, C3), all predeceased. C1 has 1 grandchild, C2 has 3 grandchildren, C3 has 2 grandchildren.

**Computation (intestate, estate = ₱9,000,000)**:
- 3 lines (one per child), each gets ₱3,000,000
- C1's line: 1 grandchild → ₱3,000,000
- C2's line: 3 grandchildren → ₱1,000,000 each
- C3's line: 2 grandchildren → ₱1,500,000 each

The number of grandchildren per line does NOT affect the line share — only the within-line distribution.

### 7. Collateral Representation Limit (Art. 972)

**Scenario**: D has no descendants, no ascendants, no spouse, no illegitimate children. D's only sibling (S1) predeceased. S1's child (nephew N1) also predeceased. N1's child (grand-nephew GN1) survives.

**Rule**: Art. 972 limits collateral representation to "children of brothers or sisters." GN1 (grand-nephew) CANNOT represent N1 because N1 is not a sibling of D — N1 is a nephew.

**Engine logic**: In collateral line, only check one level of representation (children of siblings). Grand-nephews/grand-nieces cannot represent.

### 8. Art. 975 Per Capita Switch for Nephews/Nieces

**Scenario A** (per stirpes): D has no descendants/ascendants/spouse/illegitimate children. Surviving: Sibling S1, Nephew N1 (child of predeceased S2), Nephew N2 (child of predeceased S2).

- S1 inherits per capita: ½
- N1 + N2 represent S2: ½ → ¼ each

**Scenario B** (per capita): Same as above, but S1 also predeceased and has no children. Only N1 and N2 survive.

- Art. 975: "if they alone survive, they shall inherit in equal portions"
- N1: ½, N2: ½ (NOT per stirpes through their parent)

### 9. Representation Where Representative Renounced from the Represented Person (Art. 976)

**Scenario**: D → C1 (predeceased). GC1 previously renounced their inheritance from C1 (i.e., from C1's own estate). Can GC1 still represent C1 for purposes of inheriting from D?

**Rule**: Art. 976: "A person may represent him whose inheritance he has renounced." **YES** — GC1 can represent C1.

**Engine logic**: Renunciation FROM the represented person is irrelevant. Only renunciation FROM the decedent matters (Art. 977).

---

## Test Implications

### Basic Representation Tests

| # | Scenario | Expected Result |
|---|----------|----------------|
| 1 | 2 children + 1 predeceased child with 2 grandchildren, intestate, estate ₱9M | C1: ₱3M, C2: ₱3M, GC1: ₱1.5M, GC2: ₱1.5M |
| 2 | Same as #1 but testate (will gives free portion to charity) | 3 lines → each line's legitime = ₱9M × ½ ÷ 3 = ₱1.5M; GC1: ₱750K, GC2: ₱750K |
| 3 | All 3 children predeceased, each has different # of grandchildren | Per stirpes: each line gets ⅓, divided within line |
| 4 | Multi-level: child predeceased, grandchild also predeceased, great-grandchild alive | Great-grandchild gets entire line share |

### Trigger Type Tests

| # | Scenario | Expected Result |
|---|----------|----------------|
| 5 | Child validly disinherited, has 2 children | Art. 923: grandchildren represent, get disinherited child's legitime |
| 6 | Child unworthy (Art. 1032), has 1 child | Art. 1035: grandchild acquires right to legitime |
| 7 | Child renounces, has children | Art. 977: NO representation; share accrues to co-heirs |
| 8 | Illegitimate child predeceased, has legitimate descendants | Art. 902: descendants inherit IC's share by representation |
| 9 | Illegitimate child predeceased, has illegitimate descendants | Art. 902: "whether legitimate or illegitimate" — same result |

### Renunciation Asymmetry Tests (Arts. 976-977)

| # | Scenario | Expected Result |
|---|----------|----------------|
| 10 | GC1 renounced from C1 but C1 predeceased D | Art. 976: GC1 CAN still represent C1 to inherit from D |
| 11 | C1 renounces from D, C1 has children | Art. 977: C1's children CANNOT represent C1 |
| 12 | All children of same degree renounce | Art. 969: next degree inherits in own right (NOT representation) |

### Capacity of Representative Tests

| # | Scenario | Expected Result |
|---|----------|----------------|
| 13 | GC1 is unworthy to succeed D; GC2 is not | Only GC2 represents C1; GC1 excluded per Art. 973 |
| 14 | GC1 unworthy to D but has children GGC1, GGC2 | GGC1, GGC2 may represent GC1 (if they are capable of succeeding D) |

### Concurrence Impact Tests

| # | Scenario | Expected Result |
|---|----------|----------------|
| 15 | 1 surviving child + 2 represented lines + spouse (testate) | 3 lines → Art. 892 ¶2 applies (spouse = 1 line's share) |
| 16 | 0 surviving children, all represented + spouse (testate) | Same as above — representation counts as lines |
| 17 | Represented legitimate lines + illegitimate child + spouse (intestate) | Ratio method: each legit line = 2 units, illegit = 1 unit, spouse = 2 units |

### Collateral Representation Tests

| # | Scenario | Expected Result |
|---|----------|----------------|
| 18 | 1 surviving sibling + nephews of predeceased sibling | Per stirpes: sibling's share vs represented line's share (Art. 975) |
| 19 | Only nephews/nieces survive (all siblings predeceased) | Per capita: equal shares among all nephews/nieces (Art. 975) |
| 20 | Grand-nephew/niece tries to represent nephew | NOT allowed — Art. 972 limits collateral representation to children of siblings |

### Complex Representation Tests

| # | Scenario | Expected Result |
|---|----------|----------------|
| 21 | 2 legit children + 1 predeceased legit child (2 GC) + 1 predeceased illegitimate child (1 IGC) + spouse, intestate, estate ₱14M | LC1: 2 units, LC2: 2 units, [GC1+GC2]: 2 units, IGC: 1 unit, Spouse: 2 units → 9 units; per unit = ₱1,555,556; GC1 & GC2 each get ₱1,555,556 |
| 22 | Preterited heir predeceased, has grandchildren | Art. 854: will NOT annulled; grandchildren inherit preterited heir's legitime by representation |

---

## Engine Data Model Impact

### Additions to Heir struct

```
struct Heir {
  // ... existing fields from compulsory-heirs-categories ...

  // Representation-specific fields:
  representation_trigger: RepresentationTrigger | null,
    // PREDECEASE, DISINHERITANCE, INCAPACITY, UNWORTHINESS, RENUNCIATION, null
  represented_by: List<Heir>,     // list of representatives (empty if inherits in own right)
  represents: Heir | null,        // person this heir represents (null if in own right)
  inherits_by: InheritanceMode,   // OWN_RIGHT or REPRESENTATION
  line_ancestor: Heir | null,     // the original child of the decedent this line traces to
}

enum InheritanceMode {
  OWN_RIGHT,       // Heir inherits directly
  REPRESENTATION,  // Heir represents a predeceased/excluded person (Art. 970)
}

struct LineInfo {
  original_heir: Heir,               // the child of decedent (may be dead/excluded)
  effective_category: EffectiveCategory,  // LEGITIMATE_CHILD_GROUP or ILLEGITIMATE_CHILD_GROUP
  mode: InheritanceMode,
  representatives: List<Heir>,       // who actually receives (empty if original_heir inherits)
  line_share: Money,                 // computed later
}
```

### New Pipeline Step: Build Lines

```
// Between Step 1 (Classify Heirs) and Step 2 (Determine Concurrence):

Step 1.5: Build Lines
  for each child of decedent:
    if alive and eligible → create line with mode=OWN_RIGHT
    elif can_be_represented → find representatives → create line with mode=REPRESENTATION
    else → line is extinct (skip)

  count legitimate_lines, illegitimate_lines
  these counts feed into Step 2 (concurrence determination)
```

---

## Summary: Key Rules for the Engine

1. **Per stirpes is the default**: Representatives collectively get exactly what the represented person would have gotten (Art. 974)
2. **Lines, not heads**: Count the number of lines (each child of decedent = 1 line) for concurrence and share computation (Art. 892)
3. **Recursive representation**: No depth limit in the direct descending line (Art. 970, 982)
4. **Collateral limit**: Only nephews/nieces can represent siblings; per capita if alone (Arts. 972, 975)
5. **No ascending representation**: Never (Art. 972)
6. **Renunciation asymmetry**: Can represent someone you renounced from (Art. 976); cannot be represented if you renounce (Art. 977)
7. **All triggers produce same computation**: Predecease, disinheritance, incapacity, unworthiness → same per-stirpes distribution
8. **Representative must qualify independently**: Must be capable of succeeding the decedent (Art. 973), regardless of relationship with the represented person
9. **Illegitimate children can be represented**: Art. 902 transmits rights to descendants, whether legitimate or illegitimate

---

*Analysis based on Civil Code Arts. 856, 902, 923, 970-977, 981-982, 989-990, 1035, and Family Code Art. 176.*
