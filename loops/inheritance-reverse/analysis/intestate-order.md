# Intestate Succession Order — Complete Priority and Distribution Rules

**Aspect**: `intestate-order`
**Wave**: 4 (Distribution Rules)
**Date**: 2026-02-23
**Legal Basis**: Arts. 960-1014 (Civil Code Book III, Chapter 3)

---

## 1. Legal Basis

### When Intestate Succession Applies (Art. 960)

Intestate succession takes place when:
1. The decedent dies **without a will**, or with a void will, or a will that lost validity
2. The will **does not dispose of all the property** — intestate rules apply to the undisposed remainder
3. The **suspensive condition** attached to an institution of heir does not occur, or the heir predeceases, or the heir repudiates with no substitution and no accretion
4. The **heir instituted is incapacitated** to succeed

> **Engine implication**: Case (2) is the "mixed succession" scenario — the engine applies intestate rules only to the undisposed portion of the estate. Cases (3) and (4) require re-running intestate rules on the affected portion after testate validation fails.

### General Intestate Rules

| Article | Rule |
|---------|------|
| Art. 961 | Default heirs: legitimate and illegitimate relatives, surviving spouse, and the State |
| Art. 962 | Nearest degree excludes more distant; same degree inherits equally; subject to representation |
| Art. 963 | Proximity measured by generations (each generation = one degree) |
| Art. 967 | Full blood = same father AND mother; half blood = same father OR mother, not both |
| Art. 968 | If one of several same-degree relatives is unwilling or incapacitated, their portion accrues to the others (NOT next degree) |
| Art. 969 | If ALL nearest relatives repudiate, the NEXT degree inherits in their own right (not by representation) |
| Art. 1018 | In intestate, a repudiating heir's share always accrues to co-heirs |

---

## 2. Priority Order (Complete Hierarchy)

The intestate hierarchy consists of **four priority classes** plus a **spouse layer** that crosses classes, plus **collaterals** and **the State** as fallbacks.

```
PRIORITY CLASS 1: Legitimate descendants (including adopted, legitimated, and represented)
PRIORITY CLASS 2: Legitimate ascendants
PRIORITY CLASS 3: Illegitimate children (and their descendants via representation)
PRIORITY CLASS 4: Surviving spouse (CONCURRING — never excluded, never excludes)
PRIORITY CLASS 5: Collateral relatives (siblings, nephews/nieces, others up to 5th degree)
PRIORITY CLASS 6: The State
```

### Exclusion Rules

| Rule | Description | Articles |
|------|-------------|---------|
| **E1** | Legitimate descendants exclude legitimate ascendants | Art. 985 |
| **E2** | Legitimate descendants do NOT exclude illegitimate children | Art. 983 |
| **E3** | Legitimate descendants do NOT exclude surviving spouse | Art. 996 |
| **E4** | Legitimate ascendants exclude collateral relatives | Art. 985 |
| **E5** | Illegitimate children do NOT exclude surviving spouse | Arts. 998, 1000 |
| **E6** | Any of the top 3 classes (LD, LA, IC) excludes pure collaterals from inheriting (except through Art. 1001 spouse exception) | Art. 1003 |
| **E7** | Surviving spouse alone does NOT exclude siblings/nephews-nieces (Art. 1001 exception) | Art. 995 |
| **E8** | **Iron Curtain Rule**: illegitimate child cannot inherit from parent's legitimate relatives; legitimate relatives cannot inherit from illegitimate person | Art. 992 |
| **E9** | Nearer-degree collaterals exclude more-remote collaterals (Art. 1009: beyond siblings/nieces-nephews, nearest degree wins) | Arts. 962, 1009, 1010 |
| **E10** | Collateral inheritance does not extend beyond 5th degree | Art. 1010 |

### Concurrence Rules

| Class | Can Concur With |
|-------|----------------|
| Legitimate descendants | Illegitimate children, surviving spouse |
| Legitimate ascendants | Illegitimate children, surviving spouse |
| Illegitimate children | Legitimate descendants (with 2:1 ratio), legitimate ascendants (flat ½/½), surviving spouse |
| Surviving spouse | EVERYONE — never excluded by any class |
| Siblings (collateral) | Surviving spouse only (Art. 1001) — excluded by all other classes |

---

## 3. Per-Scenario Distribution Rules

### 3.1 Scenarios with Legitimate Descendants (I1–I4)

**Governing articles**: Arts. 978-984, 983, 994, 996, 999

These scenarios apply whenever **any legitimate descendant survives** (or is represented). Adopted children and legitimated children count as legitimate descendants.

---

#### Scenario I1 — Legitimate Children/Descendants Only

**Heirs**: n legitimate descendant lines (LD), no spouse, no IC

| Heir | Share | Article |
|------|-------|---------|
| Each LD line | E / n | Art. 980 |

**Notes**:
- n = number of LD "lines" (each surviving child = 1 line; each set of grandchildren representing a dead child = 1 line)
- Within a line: representatives split the line's share equally (per stirpes, Art. 974)
- All surviving children of the decedent inherit in their own right (Art. 980: "The children of the deceased shall always inherit from him in their own right, dividing the inheritance in equal shares")

**Example** (E = ₱9,000,000; 3 surviving children):
- Each child: ₱9,000,000 / 3 = ₱3,000,000

---

#### Scenario I2 — Legitimate Descendants + Surviving Spouse

**Heirs**: n LD lines + spouse, no IC

| Heir | Share | Article |
|------|-------|---------|
| Each LD line | E / (n + 1) | Art. 996 |
| Surviving spouse | E / (n + 1) | Art. 996 |

**Rule**: Spouse receives a share EQUAL to each legitimate child (Art. 996: "the surviving spouse has in the succession the same share as that of each of the children").

**Example** (E = ₱8,000,000; 3 children + spouse):
- Each child: ₱8,000,000 / 4 = ₱2,000,000
- Spouse: ₱2,000,000

**Note**: This is DIFFERENT from testate succession where the spouse's share depends on the count of children (Art. 892 discontinuity at n=1). In intestate, the formula is always uniform: equal to one child's share.

---

#### Scenario I3 — Legitimate Descendants + Illegitimate Children (No Spouse)

**Heirs**: n LD lines + m IC lines, no spouse

| Heir | Units | Share | Article |
|------|-------|-------|---------|
| Each LD line | 2 | 2E / (2n + m) | Arts. 983, 895 |
| Each IC line | 1 | E / (2n + m) | Arts. 983, 895 |

**Rule**: Art. 983 says IC shares are "in the proportions prescribed by Article 895." In the intestate context, this means the 2:1 unit ratio — each IC receives half of what each LC receives. There is **NO CAP** in intestate (unlike testate where Art. 895 ¶3 caps IC at the free portion). The entire estate is distributed in the 2:1 ratio.

**Example** (E = ₱6,000,000; n=2 LC, m=1 IC):
- Total units = (2×2) + (1×1) = 5
- Per unit = ₱6,000,000 / 5 = ₱1,200,000
- Each LC: 2 × ₱1,200,000 = ₱2,400,000
- Each IC: 1 × ₱1,200,000 = ₱1,200,000
- Check: 2×₱2,400,000 + ₱1,200,000 = ₱6,000,000 ✓

---

#### Scenario I4 — Legitimate Descendants + Illegitimate Children + Surviving Spouse

**Heirs**: n LD lines + m IC lines + spouse

| Heir | Units | Share | Article |
|------|-------|-------|---------|
| Each LD line | 2 | 2E / (2n + m + 2) | Arts. 999, 983, 895 |
| Each IC line | 1 | E / (2n + m + 2) | Arts. 983, 895 |
| Surviving spouse | 2 | 2E / (2n + m + 2) | Art. 999 |

**Rule**: Art. 999 says spouse is entitled to "the same share as that of a legitimate child." So spouse = LC = 2 units in the formula, and IC = 1 unit.

**Example** (E = ₱10,000,000; n=2 LC, m=2 IC, spouse):
- Total units = (2×2) + (2×1) + 2 = 8
- Per unit = ₱10,000,000 / 8 = ₱1,250,000
- Each LC: 2 × ₱1,250,000 = ₱2,500,000
- Each IC: 1 × ₱1,250,000 = ₱1,250,000
- Spouse: 2 × ₱1,250,000 = ₱2,500,000
- Check: 2×₱2,500,000 + 2×₱1,250,000 + ₱2,500,000 = ₱10,000,000 ✓

---

### 3.2 Scenarios with Legitimate Ascendants (No Descendants) (I5–I8)

**Governing articles**: Arts. 985-987, 991, 997, 1000

These scenarios apply when **no legitimate descendants** survive or are represented, but **legitimate ascendants** do survive.

---

#### Scenario I5 — Legitimate Ascendants Only

**Heirs**: legitimate ascendants only (no IC, no spouse, no LD)

| Heir | Share | Article |
|------|-------|---------|
| All ascendants collectively | E | Art. 985 |

**Internal distribution among ascendants** (Art. 986/987):

```
1. If both PARENTS (father and mother) alive:
      Father = E/2, Mother = E/2 (Art. 986: equal shares)

2. If only ONE parent alive:
      Survivor = E (Art. 986: whole to survivor)

3. If NO parents (but grandparents or higher survive):
      - All same degree, same line: equal per capita within that line
      - Same degree, DIFFERENT lines (paternal vs maternal):
           Paternal group = E/2, Maternal group = E/2 (Art. 987)
           Within each line: divide equally per capita
      - DIFFERENT degrees in DIFFERENT lines:
           Nearest degree (in their line) takes ENTIRE estate for their line
           (Art. 987: "if the ascendants should be of different degrees, it shall pertain entirely to the ones nearest in degree of either line")
```

> **Critical**: There is NO right of representation in the ascending line (Art. 972). If a parent predeceases the decedent, that parent's share does NOT pass to the parent's own parents (the grandparents). Instead, the surviving parent takes the whole (Art. 986), or the nearest-degree ascendant rule (Art. 987) applies.

**Example** (E = ₱6,000,000; surviving: maternal grandmother + paternal grandfather + paternal grandmother):
- Maternal line has 1 person (1 grandparent), paternal line has 2 people (2 grandparents)
- All are grandparents = same degree (2nd degree ascendants)
- Different lines: maternal ½ = ₱3,000,000, paternal ½ = ₱3,000,000
- Within maternal: grandmother alone = ₱3,000,000
- Within paternal: grandfather + grandmother split equally = ₱1,500,000 each

---

#### Scenario I6 — Legitimate Ascendants + Surviving Spouse

**Heirs**: legitimate ascendants + spouse (no LD, no IC)

| Heir | Share | Article |
|------|-------|---------|
| All ascendants collectively | E/2 | Art. 997 |
| Surviving spouse | E/2 | Art. 997 |

**Rule**: Art. 997: "the surviving spouse shall be entitled to one-half (½) of the estate, and the legitimate parents or ascendants to the other half."

The ascendants' ½ is then internally divided per Arts. 986/987 rules above.

**Example** (E = ₱4,000,000; both parents alive + spouse):
- Spouse: ₱2,000,000
- Father: ₱1,000,000, Mother: ₱1,000,000

**CRITICAL CONTRAST with testate** (T7 — ascendants + spouse): In testate, spouse gets ¼ and ascendants get ½ (with ¼ FP). In intestate I6, both get ½. Spouse gets 100% more in intestate than testate.

---

#### Scenario I7 — Legitimate Ascendants + Illegitimate Children (No Spouse)

**Heirs**: legitimate ascendants + m IC lines (no LD, no spouse)

| Heir | Share | Article |
|------|-------|---------|
| All ascendants collectively | E/2 | Art. 991 |
| All IC collectively | E/2 | Art. 991 |
| Each IC | (E/2) / m | Art. 991 |

**Rule**: Art. 991: "the illegitimate children shall divide the inheritance with them, taking one-half of the estate, whatever be the number of the ascendants or of the illegitimate children."

**Important**: The IC get a flat ½ collectively, NOT the 2:1 unit ratio used in I3/I4. Art. 991 gives a fixed ½ to IC regardless of ascendant count. This is DIFFERENT from scenarios with legitimate descendants.

**Example** (E = ₱6,000,000; mother alive + 3 IC):
- Mother: ₱3,000,000
- Each IC: ₱3,000,000 / 3 = ₱1,000,000

---

#### Scenario I8 — Legitimate Ascendants + Illegitimate Children + Surviving Spouse

**Heirs**: legitimate ascendants + m IC lines + spouse (no LD)

| Heir | Share | Article |
|------|-------|---------|
| All ascendants collectively | E/2 | Art. 1000 |
| All IC collectively | E/4 | Art. 1000 |
| Each IC | (E/4) / m | Art. 1000 |
| Surviving spouse | E/4 | Art. 1000 |

**Rule**: Art. 1000: "the surviving spouse shall be entitled to one-fourth (¼) of the estate; and the illegitimate children, one-fourth (¼) of the estate; and the remaining one-half (½) shall belong to the legitimate ascendants."

**Note**: IC get ¼ collectively regardless of how many there are. With many IC, each individual IC may get a very small fraction.

**Example** (E = ₱8,000,000; both parents alive + 2 IC + spouse):
- Father: ₱2,000,000, Mother: ₱2,000,000 (split ½ equally)
- Spouse: ₱2,000,000
- Each IC: ₱2,000,000 / 2 = ₱1,000,000

---

### 3.3 Scenarios with Illegitimate Children (No Legitimate Descendants, No Legitimate Ascendants) (I9–I10)

**Governing articles**: Arts. 988-990, 998

---

#### Scenario I9 — Illegitimate Children Only

**Heirs**: m IC lines (no LD, no LA, no spouse)

| Heir | Share | Article |
|------|-------|---------|
| Each IC line | E / m | Art. 988 |

**Rule**: Art. 988: "In the absence of legitimate descendants and ascendants, the illegitimate children shall succeed to the entire estate of the deceased."

**Representation within IC group** (Art. 989): If an IC predeceased, their own children (the decedent's grandchildren) represent them by right and inherit the IC's share per stirpes.

**Example** (E = ₱6,000,000; 2 surviving IC + 1 dead IC represented by 2 grandchildren):
- 3 IC lines total
- Each IC line: ₱6,000,000 / 3 = ₱2,000,000
- IC1: ₱2,000,000
- IC2: ₱2,000,000
- Dead IC's children (2): ₱2,000,000 / 2 = ₱1,000,000 each

---

#### Scenario I10 — Illegitimate Children + Surviving Spouse

**Heirs**: m IC lines + spouse (no LD, no LA)

| Heir | Share | Article |
|------|-------|---------|
| All IC collectively | E/2 | Art. 998 |
| Each IC | (E/2) / m | Art. 998 |
| Surviving spouse | E/2 | Art. 998 |

**Rule**: Art. 998: "such widow or widower shall be entitled to one-half (½) of the inheritance, and the illegitimate children or their descendants, whether legitimate or illegitimate, to the other half."

**Example** (E = ₱4,000,000; 2 IC + spouse):
- Spouse: ₱2,000,000
- Each IC: ₱2,000,000 / 2 = ₱1,000,000

---

### 3.4 Surviving Spouse Scenarios (No Descendants, No Ascendants, No IC) (I11–I12)

**Governing articles**: Arts. 995, 1001, 1002

---

#### Scenario I11 — Surviving Spouse Only

**Heirs**: spouse only (no LD, no LA, no IC, no siblings/nephews-nieces)

| Heir | Share | Article |
|------|-------|---------|
| Surviving spouse | E | Art. 995 |

**Rule**: Art. 995: "the surviving spouse shall inherit the entire estate, without prejudice to the rights of brothers and sisters, nephews and nieces, should there be any, under Article 1001."

The caveat about Art. 1001 is significant: even with a spouse as the only "primary" heir, siblings and nephews/nieces of the DECEDENT get ½ if they exist (see I12 below).

---

#### Scenario I12 — Surviving Spouse + Brothers/Sisters/Nephews/Nieces of Decedent

**Heirs**: spouse + collateral kin of decedent (siblings and/or their children)

| Heir | Share | Article |
|------|-------|---------|
| Surviving spouse | E/2 | Art. 1001 |
| Brothers/sisters + nephews/nieces collectively | E/2 | Art. 1001 |

**Rule**: Art. 1001: "Should brothers and sisters or their children survive with the widow or widower, the latter shall be entitled to one-half (½) of the inheritance and the brothers and sisters or their children to the other half."

**Internal distribution of collateral ½** per Arts. 1004-1008:
- All full-blood siblings alive: equal shares among them
- Mix of full and half blood: 2:1 ratio (full:half)
- Surviving siblings + children of dead siblings: siblings per capita, nieces/nephews per stirpes
- Only children of dead siblings: equal per capita (Art. 975)

**Trigger condition**: Art. 1001 applies ONLY when the spouse concurs with siblings/nephews-nieces AND there are no LD, LA, or IC. If any of LD, LA, or IC are present, Art. 1001 does NOT apply — the spouse takes their share per Arts. 996-1000.

**Example** (E = ₱6,000,000; spouse + 2 full-blood siblings + 2 children of a dead full-blood sibling):
- Spouse: ₱3,000,000
- Collateral ½ = ₱3,000,000:
  - 2 living siblings + 1 dead sibling (represented by 2 children) = 3 sibling lines
  - Each sibling line: ₱3,000,000 / 3 = ₱1,000,000
  - Each living sibling: ₱1,000,000
  - Each niece/nephew (of dead sibling): ₱1,000,000 / 2 = ₱500,000

---

### 3.5 Collateral Relative Scenarios (I13–I15)

**Governing articles**: Arts. 1003-1010

**Trigger**: No legitimate descendants, no legitimate ascendants, no illegitimate children, no surviving spouse (or surviving spouse is disqualified under Art. 1002 AND no other eligible heirs).

---

#### Scenario I13 — Siblings and/or Nephews/Nieces (No Spouse)

**Heirs**: brothers/sisters (and/or their children) of decedent

| Sub-case | Distribution | Article |
|----------|-------------|---------|
| Only full-blood siblings | Equal shares per capita | Art. 1004 |
| Only half-blood siblings | Equal shares per capita | Art. 1007 |
| Full + half blood siblings | 2:1 ratio (full gets double half) | Art. 1006 |
| Living siblings + children of dead siblings | Siblings per capita; nieces/nephews per stirpes within their parent's share | Art. 1005 |
| Children of half-blood siblings (applying sibling rules) | Per Art. 1008 rules (same 2:1 principle for full vs half) | Art. 1008 |
| Only nieces/nephews (all siblings dead) | Equal per capita (Art. 975: "if they alone survive, they shall inherit in equal portions") | Art. 975 |

**Full-blood vs half-blood 2:1 computation**:
```
Let f = number of full-blood siblings
Let h = number of half-blood siblings
Total units = (2 × f) + (1 × h)
Each full-blood sibling: 2E / (2f + h)
Each half-blood sibling: E / (2f + h)
```

**Example** (E = ₱6,000,000; 2 full-blood siblings + 2 half-blood siblings):
- Total units = (2×2) + (1×2) = 6
- Per unit = ₱1,000,000
- Each full-blood sibling: ₱2,000,000
- Each half-blood sibling: ₱1,000,000

---

#### Scenario I14 — Other Collateral Relatives (No Siblings or Sibling Children)

**Heirs**: uncles/aunts, cousins, or other collaterals within 5th degree

| Heir | Share | Article |
|------|-------|---------|
| Each surviving nearest-degree collateral | Equal shares | Arts. 1009, 962 |

**Rules** (Art. 1009):
- No distinction between lines (paternal vs maternal) among non-sibling collaterals
- No 2:1 full blood/half blood distinction
- Nearest degree excludes more remote
- Maximum: 5th degree (Art. 1010)

**Degree reference** (for collateral line computation):
- Uncle/aunt = 3rd degree (sibling + 2)
- First cousin = 4th degree (uncle + 1)
- Second cousin = 6th degree → EXCLUDED by Art. 1010

**Example** (E = ₱3,000,000; 3 first cousins survive, no closer collaterals):
- First cousins = 4th degree; within the 5th-degree limit
- Each: ₱3,000,000 / 3 = ₱1,000,000

---

### 3.6 The State (I16)

**Heirs**: no one qualifies in any class

| Heir | Share | Article |
|------|-------|---------|
| The State | E | Art. 1011 |

**Distribution** (Art. 1013): personal property → municipality/city of last residence; real property → municipality/city where located. Estate benefits public schools and charitable institutions.

**5-year claim period** (Art. 1014): if a qualified heir later appears and files within 5 years, they recover the estate or its proceeds.

---

### 3.7 Special: Illegitimate Decedent (Art. 993)

When the **decedent is illegitimate**, intestate succession follows different rules for the decedent's parents:

| Heirs of Illegitimate Decedent | Distribution | Article |
|--------------------------------|-------------|---------|
| Children (legitimate or illegitimate) of decedent | Children inherit → Art. 992 Iron Curtain applies for IC's relationships | Art. 992 |
| If no children: both parents alive | Equal shares (½ each) | Art. 993 |
| If no children: one parent alive | Entire estate to surviving parent | Art. 993 (implied) |
| Surviving spouse + parents (no children) | Spouse ¼, Parents ¼ | Art. 903 ¶3 (testate context, applied by analogy to intestate) |

**Iron Curtain Rule in illegitimate decedent's estate**: The decedent's legitimate relatives (on the father's or mother's side) CANNOT inherit from the illegitimate decedent intestate (Art. 992, second clause). Only the parents themselves (direct ascendants) can inherit under Art. 993 — they are not barred by Art. 992.

---

## 4. Master Pseudocode Algorithm

```pseudocode
function compute_intestate_shares(
    estate: Decimal,        // net distributable estate (post-tax)
    heirs: List[Heir]       // all potential heirs with classifications
) -> List[InheritanceShare]:

    // STEP 0: Filter eligible heirs
    // Remove: deceased (unless eligible for representation), incapacitated (Art. 1027),
    //         unworthy (Art. 1032), legally separated guilty spouse (Art. 1002),
    //         and any blocked by Iron Curtain Rule (Art. 992)
    eligible = []
    for h in heirs:
        if not h.is_alive and not has_eligible_representatives(h, heirs):
            continue  // Dead with no reps: remove from pool
        if is_incapacitated(h) and not has_eligible_representatives(h, heirs):
            continue
        if is_unworthy(h) and not has_eligible_representatives(h, heirs):
            continue
        if is_guilty_spouse_legal_separation(h):
            continue  // Art. 1002: no rights whatsoever
        if blocked_by_iron_curtain(h, decedent):
            continue  // Art. 992: illegitimate cannot inherit from parent's legit relatives
        eligible.append(h)

    // STEP 1: Classify eligible heirs
    ld_lines = build_representation_lines(
        survivors = [h for h in eligible if is_legitimate_descendant(h) and h.is_alive],
        represented = [h for h in heirs if is_legitimate_descendant(h)
                       and not h.is_alive and has_eligible_representatives(h, heirs)]
    )
    // is_legitimate_descendant: includes biological legitimate children, adopted children (RA 8552/RA 11642), legitimated children (FC Art. 179)

    la = [h for h in eligible if is_legitimate_ascendant(h) and h.is_alive]
    // Activated only if len(ld_lines) == 0

    ic_lines = build_representation_lines(
        survivors = [h for h in eligible if is_illegitimate_child(h) and h.is_alive],
        represented = [h for h in heirs if is_illegitimate_child(h)
                       and not h.is_alive and has_eligible_representatives(h, heirs)]
    )

    sp = find_eligible_spouse(eligible)  // null if no spouse or disqualified

    collaterals = [h for h in eligible if is_collateral(h)]
    // Includes siblings, nephews/nieces, uncles/aunts, cousins (up to 5th degree)

    // STEP 2: Determine scenario and compute shares
    n = len(ld_lines)
    m = len(ic_lines)
    has_ld = n > 0
    has_la = len(la) > 0
    has_ic = m > 0
    has_sp = sp != null
    has_siblings_or_nieces = has_siblings_or_sibling_children(collaterals)
    has_coll = len(collaterals) > 0

    // STEP 3: Branch on scenario
    if has_ld:
        return distribute_with_descendants(estate, ld_lines, ic_lines, sp, n, m)
    elif has_la:
        return distribute_with_ascendants(estate, la, ic_lines, sp, m)
    elif has_ic:
        return distribute_ic_only(estate, ic_lines, sp, m)
    elif has_sp:
        if has_siblings_or_nieces:
            // I12: Art. 1001
            return distribute_spouse_with_siblings(estate, sp, collaterals)
        else:
            // I11: Spouse alone
            return [InheritanceShare(sp, estate,
                "Art. 995: surviving spouse inherits entire estate in default of all other heirs")]
    elif has_coll:
        return distribute_collaterals(estate, collaterals)
    else:
        return [InheritanceShare(STATE, estate,
                "Art. 1011: State inherits entire estate in default of all private heirs")]


// ----------------------------------------------------------------
function distribute_with_descendants(estate, ld_lines, ic_lines, sp, n, m):
    results = []
    has_sp = sp != null

    if not has_sp and m == 0:
        // Scenario I1
        per_line = estate / n
        for line in ld_lines:
            distribute_line(line, per_line, results,
                f"Art. 980: inherits equal share ({n} legitimate descendant lines)")

    elif has_sp and m == 0:
        // Scenario I2
        per_unit = estate / (n + 1)  // n LC lines + 1 spouse
        for line in ld_lines:
            distribute_line(line, per_unit, results,
                f"Art. 996: inherits equal share with surviving spouse ({n+1} total units)")
        results.append(share(sp, per_unit, "Art. 996: spouse receives share equal to one legitimate child"))

    elif not has_sp and m > 0:
        // Scenario I3
        total_units = (2 * n) + (1 * m)
        per_unit = estate / total_units
        for line in ld_lines:
            distribute_line(line, 2 * per_unit, results,
                f"Art. 983/895: legitimate descendant receives 2 units in 2:1 ratio with illegitimate children")
        for line in ic_lines:
            distribute_line(line, 1 * per_unit, results,
                f"Art. 983/895: illegitimate child receives 1 unit (½ of legitimate child's share)")

    else:
        // Scenario I4 (has_sp and m > 0)
        total_units = (2 * n) + (1 * m) + 2  // spouse gets 2 units = same as LC
        per_unit = estate / total_units
        for line in ld_lines:
            distribute_line(line, 2 * per_unit, results,
                f"Art. 999/983/895: legitimate descendant receives 2 units (n={n}, m={m}, spouse concurring)")
        for line in ic_lines:
            distribute_line(line, 1 * per_unit, results,
                f"Art. 983/895: illegitimate child receives 1 unit (½ of LC share)")
        results.append(share(sp, 2 * per_unit, "Art. 999: spouse receives same share as one legitimate child"))

    return results


// ----------------------------------------------------------------
function distribute_with_ascendants(estate, la, ic_lines, sp, m):
    results = []
    has_sp = sp != null
    has_ic = m > 0

    // Determine ascendant collective share
    if not has_sp and not has_ic:
        // Scenario I5: Ascendants alone
        asc_share = estate
    elif has_sp and not has_ic:
        // Scenario I6: Ascendants + spouse
        asc_share = estate / 2
        results.append(share(sp, estate / 2, "Art. 997: surviving spouse receives ½ in concurrence with legitimate ascendants"))
    elif not has_sp and has_ic:
        // Scenario I7: Ascendants + IC
        asc_share = estate / 2
        ic_collective = estate / 2
        ic_per_line = ic_collective / m
        for line in ic_lines:
            distribute_line(line, ic_per_line, results,
                f"Art. 991: illegitimate children collectively receive ½ (split among {m} lines)")
    else:
        // Scenario I8: Ascendants + IC + spouse
        asc_share = estate / 2
        ic_collective = estate / 4
        ic_per_line = ic_collective / m
        for line in ic_lines:
            distribute_line(line, ic_per_line, results,
                f"Art. 1000: illegitimate children collectively receive ¼ (split among {m} lines)")
        results.append(share(sp, estate / 4, "Art. 1000: surviving spouse receives ¼ in concurrence with ascendants and illegitimate children"))

    // Distribute ascendant share per Arts. 986/987
    distribute_ascendants(asc_share, la, results)
    return results


function distribute_ascendants(asc_share, la, results):
    // Filter: only alive, eligible ascendants already pre-selected
    parents = [a for a in la if a.degree == 1]  // direct parents
    higher = [a for a in la if a.degree > 1]    // grandparents and above

    if len(parents) > 0:
        // Art. 986: Parents take precedence over higher ascendants
        if len(parents) == 2:
            // Both parents alive: equal shares
            results.append(share(parents[0], asc_share / 2, "Art. 986: father and mother share equally"))
            results.append(share(parents[1], asc_share / 2, "Art. 986: father and mother share equally"))
        else:
            // One parent alive: takes all
            results.append(share(parents[0], asc_share,
                "Art. 986: sole surviving parent takes entire ascendant share"))
    elif len(higher) > 0:
        // No parents: nearest degree among higher ascendants
        min_degree = min(a.degree for a in higher)
        nearest = [a for a in higher if a.degree == min_degree]

        paternal = [a for a in nearest if a.line == PATERNAL]
        maternal = [a for a in nearest if a.line == MATERNAL]

        if len(paternal) == 0 or len(maternal) == 0:
            // Only one line: divide equally per capita within that line
            per_capita = asc_share / len(nearest)
            for a in nearest:
                results.append(share(a, per_capita,
                    f"Art. 987: nearest ascendants ({min_degree}° degree) divide equally per capita"))
        else:
            // Both lines present: ½ to paternal line, ½ to maternal line
            paternal_share = asc_share / 2
            maternal_share = asc_share / 2
            for a in paternal:
                results.append(share(a, paternal_share / len(paternal),
                    "Art. 987: paternal line receives ½; divided equally within line"))
            for a in maternal:
                results.append(share(a, maternal_share / len(maternal),
                    "Art. 987: maternal line receives ½; divided equally within line"))


// ----------------------------------------------------------------
function distribute_ic_only(estate, ic_lines, sp, m):
    results = []
    has_sp = sp != null

    if not has_sp:
        // Scenario I9
        per_line = estate / m
        for line in ic_lines:
            distribute_line(line, per_line, results,
                f"Art. 988: illegitimate children inherit entire estate in absence of legitimate descendants and ascendants ({m} lines)")
    else:
        // Scenario I10
        ic_collective = estate / 2
        per_line = ic_collective / m
        for line in ic_lines:
            distribute_line(line, per_line, results,
                f"Art. 998: illegitimate children collectively receive ½ (split among {m} lines)")
        results.append(share(sp, estate / 2, "Art. 998: surviving spouse receives ½ in concurrence with illegitimate children"))

    return results


// ----------------------------------------------------------------
function distribute_spouse_with_siblings(estate, sp, collaterals):
    results = []
    sp_share = estate / 2
    coll_share = estate / 2

    results.append(share(sp, sp_share, "Art. 1001: surviving spouse receives ½ in concurrence with brothers, sisters, or their children of the decedent"))

    // Distribute collateral ½ per Arts. 1004-1008
    distribute_siblings_and_nieces(coll_share, collaterals, results)
    return results


// ----------------------------------------------------------------
function distribute_siblings_and_nieces(coll_share, collaterals, results):
    siblings = [c for c in collaterals if c.type == SIBLING]
    nieces_nephews = [c for c in collaterals if c.type == SIBLING_CHILD]

    // Build sibling lines (living siblings = 1 line; dead sibling's children = 1 line)
    lines = {}
    for s in siblings:
        if s.is_alive:
            lines[s.id] = {sibling: s, children: [], is_alive: true}
    for nn in nieces_nephews:
        parent_id = nn.parent_id
        if parent_id not in lines:
            lines[parent_id] = {sibling: None, children: [], is_alive: false}
        lines[parent_id].children.append(nn)

    // Count full-blood vs half-blood lines
    full_lines = [l for l in lines.values() if is_full_blood(l)]
    half_lines = [l for l in lines.values() if not is_full_blood(l)]

    f = len(full_lines)
    h = len(half_lines)
    total_units = (2 * f) + (1 * h)  // Art. 1006: 2:1 ratio

    if total_units == 0:
        return  // No collaterals

    per_unit = coll_share / total_units

    for line in full_lines:
        line_share = 2 * per_unit
        if line.is_alive:
            results.append(share(line.sibling, line_share,
                "Art. 1004/1006: full-blood sibling receives 2 units (double half-blood)"))
        else:
            per_child = line_share / len(line.children)
            for child in line.children:
                results.append(share(child, per_child,
                    "Art. 1005: niece/nephew inherits by representation (per stirpes) from deceased full-blood sibling's share"))

    for line in half_lines:
        line_share = 1 * per_unit
        if line.is_alive:
            results.append(share(line.sibling, line_share,
                "Art. 1006/1007: half-blood sibling receives 1 unit (half of full-blood sibling)"))
        else:
            per_child = line_share / len(line.children)
            for child in line.children:
                results.append(share(child, per_child,
                    "Art. 1005/1008: niece/nephew inherits by representation from deceased half-blood sibling's share"))


// ----------------------------------------------------------------
function distribute_collaterals(estate, collaterals):
    results = []

    siblings = [c for c in collaterals if c.type == SIBLING]
    sibling_children = [c for c in collaterals if c.type == SIBLING_CHILD]
    others = [c for c in collaterals if c.type not in (SIBLING, SIBLING_CHILD)]

    if len(siblings) > 0 or len(sibling_children) > 0:
        // Scenarios I13-I14: Art. 1003-1008
        distribute_siblings_and_nieces(estate, siblings + sibling_children, results)
    elif len(others) > 0:
        // Scenario I15: Art. 1009 — other collaterals, no line/blood preference
        min_degree = min(c.degree for c in others)
        nearest = [c for c in others if c.degree == min_degree]
        per_capita = estate / len(nearest)
        for c in nearest:
            results.append(share(c, per_capita,
                f"Art. 1009: nearest collateral relatives ({min_degree}° degree) divide equally in default of siblings and their children; Art. 1010 limits to 5th degree"))

    return results


// ----------------------------------------------------------------
function build_representation_lines(survivors, represented):
    lines = []
    for s in survivors:
        lines.append(Line(representatives=[s], is_own_right=true))
    for h in represented:
        reps = get_eligible_representatives(h)
        if len(reps) > 0:
            lines.append(Line(representatives=reps, is_own_right=false,
                              trigger=h.representation_trigger))
    return lines


function distribute_line(line, line_share, results, article_citation):
    if line.is_own_right:
        heir = line.representatives[0]
        results.append(InheritanceShare(heir, line_share, article_citation))
    else:
        // Representation: per stirpes — split equally among representatives
        per_rep = line_share / len(line.representatives)
        for rep in line.representatives:
            results.append(InheritanceShare(rep, per_rep,
                f"Art. 974: inherits by representation (per stirpes); {article_citation}; trigger: {line.trigger}"))
```

---

## 5. Representation Within Intestate Succession

### Triggers (applicable in intestate)

| Trigger | Effect | Article |
|---------|--------|---------|
| Predecease | Deceased heir's line represented by descendants | Arts. 970, 981, 982 |
| Incapacity / Unworthiness | Same as predecease — descendants step in | Art. 1035 |
| Disinheritance | Descendants represent disinherited heir | Art. 923 |
| Renunciation | NO representation (Art. 977); instead, Art. 1018 accretion or Art. 969 next-degree succession | Arts. 977, 1018, 969 |

### Per-Stirpes vs Per-Capita

| Situation | Rule |
|-----------|------|
| All children of decedent alive (I1-I4) | Per capita: equal shares to each child |
| Some children alive, some dead with descendants | Alive children per capita; dead children's descendants per stirpes |
| ALL children dead, grandchildren survive | Grandchildren take as nearest degree (per capita), NOT per stirpes |
| Nieces/nephews with living siblings (I13) | Siblings per capita; nieces/nephews per stirpes within their parent's share |
| Nieces/nephews alone, all siblings dead | Equal per capita (Art. 975: "they alone survive") |

### Key Rule: Renunciation Does NOT Trigger Representation

- **Art. 977**: "Heirs who repudiate their share may not be represented."
- **Art. 1018**: Instead, in intestate succession, the repudiating heir's share **accrues** to co-heirs.
- **Art. 969**: If ALL nearest-degree relatives repudiate, the NEXT DEGREE inherits in their own right (not by representation).

### Per-Stirpes Calculation Example

Decedent has 3 children. Child A survives. Child B predeceased — left 2 children. Child C predeceased — left 1 child.
- 3 lines: A (1 person), B-line (2 reps), C-line (1 rep)
- Each line: E/3
- Child A: E/3
- Each of B's children: (E/3)/2 = E/6
- C's child: E/3

---

## 6. Special Rules

### 6.1 Iron Curtain Rule (Art. 992)

**Bilateral barrier**: Illegitimate children cannot inherit intestate from the legitimate relatives of their parent; and those legitimate relatives cannot inherit from the illegitimate child.

**Engine implementation**:
1. When building `eligible` heirs for a LEGITIMATE decedent: check if any heir is an illegitimate child of the decedent's sibling — if so, that person is blocked by Art. 992 and cannot represent their parent in collateral succession.
2. When building `eligible` heirs for an ILLEGITIMATE decedent: check if any heir is a legitimate relative of the decedent's parent — if so, those relatives are blocked.

**What Art. 992 does NOT block**:
- Illegitimate children of the decedent themselves inheriting FROM the decedent (they ARE the decedent's own IC)
- The decedent's own parents inheriting from the decedent (Art. 993 governs directly)

### 6.2 Art. 1001 — Spouse with Siblings (Special Concurrence)

Art. 1001 is an EXCEPTION that allows collateral relatives (siblings/nephews-nieces) to "penetrate" the normal rule that spouse alone takes everything. This exception ONLY applies when:
- The spouse concurs with siblings or their children
- There are NO legitimate descendants, legitimate ascendants, or illegitimate children

If any of LD, LA, or IC are present: the spouse's share is governed by Arts. 996/997/998/999/1000, and siblings get nothing.

### 6.3 Accretion in Intestate (Art. 1018)

When one heir in intestate repudiates:
- Their share **accrues to co-heirs** (Art. 1018)
- Not to the next class (that only happens under Art. 969 when ALL nearest relatives repudiate)

**Implementation**: After initial share computation, if an heir repudiates:
1. Remove the repudiating heir
2. Recalculate shares from scratch using the remaining eligible heirs
3. (Do not trigger representation — Art. 977 forbids it for renunciants)

Exception: If all heirs of the current class repudiate, apply Art. 969 — invoke the NEXT class in its own right.

### 6.4 Legal Separation (Art. 1002)

The **guilty** spouse in a legal separation proceeding forfeits all intestate inheritance rights. The innocent spouse retains full rights.

**Engine check**: At Step 0, if `heir.is_spouse AND heir.legal_separation_status == GUILTY`, remove from eligible pool. The scenario then re-evaluates with spouse absent.

---

## 7. Complete Intestate Scenario Table

| Code | Heirs Present | Distribution | Governing Articles |
|------|---------------|-------------|-------------------|
| **I1** | n LD lines (no sp, no IC) | Each LD line: E/n | Arts. 978, 980 |
| **I2** | n LD lines + spouse | Each LD line and spouse: E/(n+1) | Arts. 980, 996 |
| **I3** | n LD lines + m IC lines (no sp) | LD line: 2E/(2n+m); IC line: E/(2n+m) | Arts. 983, 895 |
| **I4** | n LD lines + m IC lines + spouse | LD=2u, IC=u, Sp=2u; u=E/(2n+m+2) | Arts. 983, 895, 999 |
| **I5** | LA only | LA: entire estate per Art. 986/987 division | Arts. 985, 986, 987 |
| **I6** | LA + spouse | LA: E/2 (internal per 986/987); Sp: E/2 | Art. 997 |
| **I7** | LA + m IC (no sp) | LA: E/2 per 986/987; each IC: E/(2m) | Art. 991 |
| **I8** | LA + m IC + spouse | LA: E/2; each IC: E/(4m); Sp: E/4 | Art. 1000 |
| **I9** | m IC only | Each IC line: E/m | Art. 988 |
| **I10** | m IC + spouse | Each IC: E/(2m); Sp: E/2 | Art. 998 |
| **I11** | Spouse only (no siblings) | Sp: E | Art. 995 |
| **I12** | Spouse + siblings/nieces-nephews | Sp: E/2; collateral kin: E/2 per Arts. 1004-1008 | Arts. 995, 1001 |
| **I13** | Siblings/nieces-nephews only | Per Arts. 1004-1008 (2:1 full/half) | Arts. 1003-1008 |
| **I14** | Other collaterals only (no siblings) | Equal shares, nearest degree, up to 5th | Arts. 1009, 1010 |
| **I15** | None | State takes all | Arts. 1011-1013 |

**Special (illegitimate decedent)**:
| Code | Heirs Present | Distribution | Articles |
|------|---------------|-------------|---------|
| **Iill-1** | Children of illegitimate decedent | Per I1-I4 with IC of decedent counted as LC (they are legitimate children of the illegitimate person) | Arts. 988-990 |
| **Iill-2** | No children; both parents alive | ½ to father, ½ to mother | Art. 993 |
| **Iill-3** | No children; one parent alive | Entire to surviving parent | Art. 993 |
| **Iill-4** | No children; parents + spouse | Parents ¼, Spouse ¼ | Art. 903 ¶3 (analogous) |

---

## 8. Interactions with Other Engine Components

### 8.1 Mixed Succession (Art. 960(2))

When a will disposes of ONLY PART of the estate:
1. Testate engine computes testamentary dispositions for the disposed portion
2. **Intestate engine** receives the undisposed remainder as its `estate` parameter
3. The undisposed remainder is distributed per the intestate scenarios above
4. The same heir may receive from BOTH testate (testamentary share) and intestate (undisposed portion)

**Example**: Decedent has 2 LC + spouse. Will gives ₱2,000,000 to a charity (from free portion). Undisposed remainder = free portion minus charity bequest. This remainder passes intestate under I2 rules.

### 8.2 Testate Validation Failure (Art. 918 / Art. 854)

When a will fails validation (preterition under Art. 854, or invalid disinheritance under Art. 918):
- Art. 854: Institution of heirs annulled; devises/legacies preserved within free portion
- After annulment: the entire estate (minus valid legacies/devises) passes INTESTATE
- The intestate engine receives the residue as `estate`

### 8.3 Intestate Share vs Legitime

In intestate succession, there is NO separate "legitime" computation — the entire estate is distributed per the scenarios above. The legitime concept applies ONLY in testate succession to protect compulsory heirs. In intestate, the statutory shares ARE the heirs' shares.

**Critical**: For the same heir combination, intestate shares are always ≥ testate legitime (the law is more generous to heirs when there is no will). This is by design — the decedent's testamentary freedom is zero in intestate.

### 8.4 Representation Pipeline Integration

The `build_representation_lines` function from Step 1.5 of the overall pipeline (analyzed in `representation-rights.md`) is called within the intestate engine to resolve:
- Which heirs are represented (predecease, disinheritance, incapacity/unworthiness)
- Per-stirpes vs per-capita within each line
- Recursive multi-level representation (grandchildren, great-grandchildren, etc.)

---

## 9. Edge Cases

### EC1 — All Nearest-Degree Relatives Repudiate (Art. 969)

All 3 legitimate children renounce. No substitution. No grandchildren.
→ Grandchildren (next degree) inherit in their **own right** per capita (not by representation)
→ Engine: when all members of the current class repudiate, advance to next class
→ Do NOT apply per-stirpes — the next class inherits directly, not as representatives

### EC2 — Partial Repudiation (Art. 1018 Accretion)

2 of 3 legitimate children survive; 1 renounces. No IC, no spouse.
→ Renouncing child's 1/3 accrues to the 2 co-heirs
→ Each surviving child: (1/3) + (1/6) = 1/2
→ Engine: after initial computation, reallocate renounced shares equally to co-heirs

### EC3 — Adopted Child Under RA 11642 Inheriting from Adopter's Parents

Under RA 11642 Sec. 41, the adoptee's filiation extends to the adopter's parents (grandparents of adoptee). If adoptee survives grandparents in intestate:
→ Adoptee participates as a grandchild (legitimate grandchild) in the grandparent's estate
→ Engine: `AdoptionConfig.ra11642_extended_filiation = true` flag enables this

### EC4 — Illegitimate Child Representing Deceased Illegitimate Sibling (Art. 902)

Parent (decedent) has 1 LC and 1 dead IC (IC's children are grandchildren). IC's 2 grandchildren (legitimate) represent the IC by Art. 902 (IC rights transmit to descendants).
→ Scenario I3 with representation: n=1 (1 LC), m=1 (IC-line with 2 representatives)
→ Per unit = E/(2+1) = E/3
→ LC: 2E/3; each grandchild representing IC: (E/3)/2 = E/6
→ Grandchildren inherit as IC-share representatives, NOT as legitimate grandchildren

### EC5 — Iron Curtain in Collateral Succession

Decedent (legitimate) has 1 full-blood sibling. That sibling has 1 legitimate child and 1 illegitimate child (both are nephews/nieces of decedent).
→ Legitimate nephew: can represent sibling (Art. 972: nieces/nephews by collateral representation)
→ Illegitimate nephew: BLOCKED by Art. 992 — cannot inherit from decedent (a legitimate relative of the illegitimate nephew's parent)
→ Engine: apply Iron Curtain filter before building sibling-line representatives

### EC6 — Legal Separation Changes Scenario

Decedent has 2 LC + guilty spouse.
→ Art. 1002: guilty spouse gets nothing
→ Scenario changes from I2 to I1
→ Each LC: E/2 (instead of E/3 if spouse were eligible)
→ Engine: remove guilty spouse at Step 0 filter, then recalculate scenario

### EC7 — No Representation in Ascending Line (Art. 972)

Both parents of decedent are dead. Father's parents (paternal grandparents) are alive. Mother's parents (maternal grandparents) are also alive.
→ Scenario I5: ascendants only (parents both dead = no parents to take precedence)
→ All four grandparents are 2nd degree: same degree, different lines
→ Paternal grandparents: E/2 (split equally, E/4 each)
→ Maternal grandparents: E/2 (split equally, E/4 each)
→ The parents' shares do NOT go to their surviving siblings (uncle/aunt) — only their parents inherit

### EC8 — Simultaneous Death (Commorientes)

Decedent and a potential heir die in the same accident. Art. 43 (Family Code) and Art. 1025 (Civil Code) require the heir to be alive at the moment of succession opening.
→ If timing cannot be established: presume both predeceased the other (neither inherits from the other)
→ Engine: `Heir.survival_status = COMMORIENTE` → treated as predeceased
→ Representatives of the commoriente heir (if any) may still inherit by representation (unless the trigger is renunciation)

### EC9 — Art. 1001 Blocked by Presence of IC

Decedent has: spouse + 2 IC + 1 brother.
→ IC are present → Art. 1001 does NOT apply
→ Scenario I10 applies: IC collectively ½, spouse ½
→ Brother gets NOTHING (Art. 1003 excludes collaterals when any of LD/LA/IC/spouse present)

### EC10 — Beyond 5th Degree Collateral

Decedent's closest surviving relatives are second cousins (6th degree collateral).
→ Art. 1010: right of inheritance does NOT extend beyond 5th degree in collateral line
→ Second cousins are excluded
→ State inherits the entire estate (Art. 1011)

### EC11 — Half-Blood Nephews/Nieces Alongside Full-Blood Nephews/Nieces (Art. 1008)

Decedent's full-blood sibling has 2 children; decedent's half-blood sibling (now dead) has 2 children. Both siblings dead.
→ Full-blood sibling's children = full-blood nieces/nephews (full-blood relative of decedent)
→ Half-blood sibling's children = half-blood nieces/nephews
→ Art. 1006 + Art. 1008: full-blood line gets 2 units; half-blood line gets 1 unit
→ But within each line, children of the same sibling split their parent's share equally

---

## 10. Test Implications

### Required Test Vectors for `intestate-order`

| Test | Scenario | Key Verification |
|------|---------|-----------------|
| T-I1a | 3 LC, no will | Each gets E/3 |
| T-I1b | 1 LC + 2 dead LC (each with 2 grandchildren) | Survivor gets E/3; each grandchild gets E/6 (per stirpes) |
| T-I2a | 2 LC + spouse, no will | Each gets E/3 (spouse = child share) |
| T-I2b | n=1 LC + spouse | Each gets E/2 (not ¼ as in testate T1) |
| T-I3a | 2 LC + 1 IC, no will | LC: 2E/5 each; IC: E/5 |
| T-I3b | 1 LC + 3 IC, no will | LC: 2E/5; each IC: E/15 |
| T-I4a | 2 LC + 2 IC + spouse | u=E/8; LC=2u=E/4; IC=u=E/8; Sp=2u=E/4 |
| T-I5a | Both parents alive | Each parent: E/2 |
| T-I5b | Only father alive | Father: E |
| T-I5c | No parents; 3 paternal grandparents + 1 maternal grandmother | Paternal: E/6 each; maternal: E/2 |
| T-I6 | Father alive + spouse | Father: E/2; Spouse: E/2 |
| T-I7 | Mother alive + 2 IC | Mother: E/2; each IC: E/4 |
| T-I8 | Both parents + 3 IC + spouse | Parents: E/4 each; each IC: E/12; Spouse: E/4 |
| T-I9a | 2 IC only | Each IC: E/2 |
| T-I9b | 1 IC + 2 grandchildren (IC's children, IC dead) | 2 IC lines: surviving IC=E/2; grandchild line=E/2 (each grandchild E/4) |
| T-I10 | 2 IC + spouse | Each IC: E/4; Spouse: E/2 |
| T-I11 | Spouse only, no siblings | Spouse: E |
| T-I12a | Spouse + 2 full-blood siblings | Spouse: E/2; each sibling: E/4 |
| T-I12b | Spouse + 1 full-blood sibling + 1 dead full-blood sibling (2 nieces/nephews) | Spouse: E/2; sibling: E/4; each niece/nephew: E/8 |
| T-I13a | 2 full + 2 half blood siblings | full each: 2E/6=E/3; half each: E/6 |
| T-I13b | 1 alive sibling + 3 nieces/nephews of dead sibling | Sibling: E/2; each niece/nephew: E/6 |
| T-I14 | 3 first cousins (4th degree, no siblings) | Each: E/3 |
| T-I15 | Second cousins only | State takes E (Art. 1010: 6th degree excluded) |
| T-EC1 | All 3 children renounce, grandchildren present | Grandchildren inherit per capita in own right (Art. 969) |
| T-EC2 | 2 children: 1 accepts, 1 renounces | Accepting child: E (full accretion per Art. 1018) |
| T-EC5 | Sibling's illegitimate child vs legitimate child | Legitimate niece/nephew inherits; illegitimate niece/nephew blocked by Art. 992 |
| T-EC6 | 2 LC + guilty spouse | 2 LC split E equally (I1); spouse removed per Art. 1002 |
| T-EC9 | Spouse + IC + brother | Brother excluded; I10 applies (Sp=E/2, IC=E/2) |

---

## Key Findings for Engine Builder

1. **No cap rule in intestate**: The testate Art. 895 ¶3 cap on illegitimate children does NOT apply in intestate. All distributions use the 2:1 unit ratio (I3/I4) or fixed statutory fractions (I7/I8).

2. **Spouse always concurs**: The surviving spouse is NEVER excluded from intestate succession when they are eligible. The spouse concurs with every class.

3. **Unit ratio formula** for I3/I4 (the most common complex scenario):
   - `per_unit = estate / (2n + m + (2 if spouse else 0))`
   - LD line = 2 × per_unit
   - IC line = 1 × per_unit
   - Spouse = 2 × per_unit (if present)

4. **Art. 991 vs Art. 983**: IC with ascendants → flat ½ (Art. 991). IC with descendants → 2:1 unit ratio (Art. 983). The formula changes based on which class they concur with.

5. **Art. 1001 is a narrow exception**: Siblings only participate when there are NO descendants, ascendants, or IC — and even then, only ½ (not the whole estate).

6. **Renunciation → accretion (Art. 1018), not next-degree succession** — unless all nearest relatives repudiate (Art. 969).

7. **No representation ascending line** (Art. 972): critical for ascendant distribution algorithm.

8. **Iron Curtain (Art. 992)** applies in intestate collateral succession: illegitimate nieces/nephews cannot represent their parent to inherit from the parent's legitimate relatives (the decedent).

9. **Per-stirpes division**: when all children of a class predecease, the grandchildren inherit per capita (not per stirpes) as the nearest surviving degree in their own right.

10. **5th degree limit** (Art. 1010): second cousins (6th degree) and beyond are excluded. State takes the estate if no closer collateral relative exists.
