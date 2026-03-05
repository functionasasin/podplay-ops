# Legitime Table — Complete Fraction Table for Every Heir Combination

**Aspect**: legitime-table
**Wave**: 3 (Legitime Computation)
**Primary Legal Basis**: Arts. 886-903 (Civil Code), Art. 176 (Family Code)
**Depends On**: compulsory-heirs-categories, heir-concurrence-rules, illegitimate-children-rights

---

## Legal Basis

### Core Articles Governing Legitime Fractions

| Article | What It Governs |
|---------|----------------|
| **Art. 886** | Definition: legitime = reserved portion the testator cannot dispose of |
| **Art. 888** | Legitimate children's collective legitime = ½ of estate |
| **Art. 889** | Legitimate parents/ascendants' collective legitime = ½ of estate |
| **Art. 890** | Division among ascendants (equal if same degree; by line if different degrees) |
| **Art. 892** | Spouse's legitime when concurring with legitimate children (¼ if 1 child; equal-to-one-child if 2+) |
| **Art. 893** | Spouse's legitime when concurring with ascendants only = ¼ |
| **Art. 894** | Spouse (⅓) + illegitimate children (⅓) when no legitimate heirs |
| **Art. 895** | Illegitimate child = ½ of legitimate child's share; cap rule (¶3) |
| **Art. 896** | Illegitimate children with ascendants (no descendants) = ¼ total |
| **Art. 897** | Spouse's share when concurring with legitimate + illegitimate children = same as one legitimate child |
| **Art. 899** | Three-way concurrence: ascendants (½) + illegitimate (¼) + spouse (⅛) |
| **Art. 900** | Spouse alone = ½ (⅓ if articulo mortis) |
| **Art. 901** | Illegitimate children alone = ½ |
| **Art. 903** | Parents of illegitimate decedent: ½ alone; ¼ if with spouse |

### The Two Legitime Regimes

The Civil Code uses two fundamentally different mechanics depending on whether the primary compulsory heirs are **descendants** or **ascendants**:

**Regime A — Descendants Present (Arts. 888, 892, 895, 897)**:
- Legitimate children get a FIXED collective ½ of estate
- Spouse and illegitimate children's shares are derived FROM each legitimate child's per-child share
- Illegitimate children's shares come from the free portion
- The Art. 895 ¶3 cap rule applies

**Regime B — Ascendants Present, No Descendants (Arts. 889, 893, 896, 899)**:
- Ascendants get a FIXED collective ½ of estate
- Spouse and illegitimate children get FIXED fractions of the estate (not derived from per-heir shares)
- All concurring heirs' shares are defined as flat fractions
- No cap rule needed (fractions are pre-defined to always sum ≤ 1)

**Regime C — No Primary/Secondary Compulsory Heirs (Arts. 894, 900, 901)**:
- Only concurring heirs (spouse, illegitimate children, or both) survive
- Fixed fractions of the estate assigned directly

---

## Complete Legitime Fraction Table (Testate Succession)

### Notation

- `E` = net distributable estate
- `n` = number of legitimate child lines (including represented lines)
- `m` = number of illegitimate children
- `FP` = free portion = E − (sum of all legitimes)
- Fractions are of the TOTAL estate `E` unless otherwise noted

### Regime A: Descendants Present

#### Scenario T1 — Legitimate Children Only

| Heir | Legitime Formula | Fraction of E |
|------|-----------------|---------------|
| All legitimate children (collective) | E × ½ | ½ (0.5) |
| Each legitimate child | E × ½ ÷ n | ½n |
| **Free Portion** | E × ½ | **½ (0.5)** |

**Legal basis**: Art. 888
**Per-child**: Equal shares within the collective ½ (Art. 980 by analogy)

---

#### Scenario T2 — 1 Legitimate Child + Surviving Spouse

| Heir | Legitime Formula | Fraction of E |
|------|-----------------|---------------|
| Legitimate child | E × ½ | ½ (0.5) |
| Surviving spouse | E × ¼ | ¼ (0.25) |
| **Free Portion** | E × ¼ | **¼ (0.25)** |

**Legal basis**: Art. 888 (child), Art. 892 ¶1 (spouse = ¼ when only 1 child)
**Key**: Art. 892 ¶1 explicitly sets spouse at ¼ (NOT equal to the child's ½). This is a deliberate asymmetry.
**Source**: Spouse's ¼ is "taken from the portion that can be freely disposed of" (Art. 892 ¶3), i.e., from the FP.
**Verification**: ½ + ¼ + ¼ = 1 ✓

---

#### Scenario T3 — 2+ Legitimate Children + Surviving Spouse

| Heir | Legitime Formula | Fraction of E |
|------|-----------------|---------------|
| All legitimate children (collective) | E × ½ | ½ (0.5) |
| Each legitimate child | E × ½ ÷ n | 1/(2n) |
| Surviving spouse | E × ½ ÷ n | 1/(2n) |
| **Free Portion** | E × (n−1)/(2n) | **(n−1)/(2n)** |

**Legal basis**: Art. 888 (children), Art. 892 ¶2 (spouse = equal to one child's share of the ½)
**Source**: Spouse's share from FP (Art. 892 ¶3)
**Verification**: ½ + 1/(2n) + (n−1)/(2n) = ½ + n/(2n) = ½ + ½ = 1 ✓

**Concrete values**:

| n (children) | Per child | Spouse | Free Portion |
|-------------|-----------|--------|-------------|
| 2 | ¼ (0.25) | ¼ (0.25) | ¼ (0.25) |
| 3 | ⅙ (0.167) | ⅙ (0.167) | ⅓ (0.333) |
| 4 | ⅛ (0.125) | ⅛ (0.125) | ⅜ (0.375) |
| 5 | 1/10 (0.10) | 1/10 (0.10) | 2/5 (0.40) |
| 10 | 1/20 (0.05) | 1/20 (0.05) | 9/20 (0.45) |

**Observation**: As `n` increases, the FP asymptotically approaches ½. The testator gains more disposable freedom with more children (counterintuitive but mathematically correct — the spouse's charge on FP shrinks).

---

#### Scenario T4 — Legitimate Children + Illegitimate Children (No Spouse)

| Heir | Legitime Formula (uncapped) | Fraction of E |
|------|---------------------------|---------------|
| All legitimate children (collective) | E × ½ | ½ (0.5) |
| Each legitimate child | E × ½ ÷ n | 1/(2n) |
| Each illegitimate child (uncapped) | E × ¼ ÷ n | 1/(4n) |
| **Free Portion (before illegit.)** | E × ½ | ½ (0.5) |

**Legal basis**: Art. 888 (legitimate), Art. 895 (illegitimate = ½ of legitimate child's share)
**Source of illegitimate shares**: From the free portion (Art. 895 ¶3)

**Cap rule** (Art. 895 ¶3): Total illegitimate children's legitime ≤ FP = E × ½

No spouse to satisfy first, so cap = full FP.

```
total_illegit_uncapped = m × E/(4n)
cap = E/2

if total_illegit_uncapped > cap:
    each_illegit = (E/2) / m     // capped: split entire FP equally
else:
    each_illegit = E/(4n)         // uncapped: ½ of legitimate child's share

free_portion_remaining = E/2 - min(total_illegit_uncapped, cap)
```

**Cap bites when**: m/(4n) > ½ → m > 2n (illegitimate children exceed twice the legitimate children)

| n | m | Cap bites? | Each illegit. share |
|---|---|-----------|-------------------|
| 1 | 1 | No (1 ≤ 2) | 1/4 of E |
| 1 | 2 | No (2 = 2) | 1/4 of E |
| 1 | 3 | Yes (3 > 2) | 1/6 of E |
| 2 | 1 | No | 1/8 of E |
| 2 | 4 | No (4 = 4) | 1/8 of E |
| 2 | 5 | Yes (5 > 4) | 1/10 of E |

---

#### Scenario T5 — Legitimate Children + Illegitimate Children + Surviving Spouse

This is the most complex testate scenario. Three articles interact: Arts. 888, 892, 895, 897.

**Sub-case T5a: n = 1 legitimate child**

| Heir | Legitime Formula (uncapped) | Fraction of E |
|------|---------------------------|---------------|
| Legitimate child | E × ½ | ½ (0.5) |
| Surviving spouse | E × ¼ | ¼ (0.25) |
| Each illegitimate child (uncapped) | E × ¼ | ¼ (0.25) |
| **Free Portion** | E × ½ | ½ (0.5) |

**Cap rule** (Art. 895 ¶3): Spouse satisfied FIRST from FP.
```
free_portion = E/2
remaining_fp_after_spouse = E/2 - E/4 = E/4
total_illegit_uncapped = m × E/4
cap = E/4 (remaining FP)

if m × E/4 > E/4:    // i.e., m > 1
    each_illegit = (E/4) / m    // capped
else:
    each_illegit = E/4           // uncapped (m = 1 exactly fills it)
```

**Cap bites when**: m > 1 (more than 1 illegitimate child!)

| m | Each illegit. (as fraction of E) | Notes |
|---|--------------------------------|-------|
| 1 | ¼ (0.25) | Exactly fills remaining FP; FP remaining = 0 |
| 2 | ⅛ (0.125) | Cap bites; FP remaining = 0 |
| 3 | 1/12 (0.083) | Cap bites; FP remaining = 0 |
| 5 | 1/20 (0.05) | Cap bites; FP remaining = 0 |

**Sub-case T5b: n ≥ 2 legitimate children**

| Heir | Legitime Formula (uncapped) | Fraction of E |
|------|---------------------------|---------------|
| All legitimate children (collective) | E × ½ | ½ (0.5) |
| Each legitimate child | E/(2n) | 1/(2n) |
| Surviving spouse | E/(2n) | 1/(2n) |
| Each illegitimate child (uncapped) | E/(4n) | 1/(4n) |
| **Free Portion** | E × ½ | ½ (0.5) |

**Legal basis**: Art. 888 (children ½), Art. 892 ¶2 + Art. 897 (spouse = one child's share), Art. 895 (illegitimate = ½ of legitimate child's share)

**Cap rule** (Art. 895 ¶3): Spouse satisfied first from FP.
```
free_portion = E/2
spouse_share = E/(2n)
remaining_fp = E/2 - E/(2n) = E(n-1)/(2n)
total_illegit_uncapped = m × E/(4n)

if m × E/(4n) > E(n-1)/(2n):    // i.e., m > 2(n-1) → m > 2n-2
    each_illegit = E(n-1)/(2n) / m    // capped
else:
    each_illegit = E/(4n)               // uncapped
```

**Cap bites when**: m > 2(n−1) = 2n − 2

| n | Cap threshold (m >) | Example: n=2, m=3 |
|---|---------------------|-------------------|
| 2 | m > 2 | Bites at m=3 |
| 3 | m > 4 | Bites at m=5 |
| 4 | m > 6 | Bites at m=7 |
| 5 | m > 8 | Bites at m=9 |

---

### Regime B: Ascendants Present (No Descendants)

#### Scenario T6 — Legitimate Parents/Ascendants Only

| Heir | Legitime Formula | Fraction of E |
|------|-----------------|---------------|
| Legitimate parents/ascendants (collective) | E × ½ | ½ (0.5) |
| **Free Portion** | E × ½ | **½ (0.5)** |

**Legal basis**: Art. 889
**Division among ascendants** (Art. 890):
- Both parents alive → equal shares (¼ each)
- One parent alive → all to survivor (½)
- No parents, grandparents survive → divide by line (½ paternal, ½ maternal) then per capita within each line
- Different degrees → all to the nearer degree

```
function divide_among_ascendants(ascendants: List<Heir>, total: Amount) {
    parents = filter(a where a.degree == 1, ascendants)  // father/mother

    if count(parents) > 0:
        // Art. 986: parents exclude all higher ascendants
        return divide_equally(parents, total)

    // Art. 987: divide by lines, then per capita within line
    paternal = filter(a where a.line == PATERNAL, ascendants)
    maternal = filter(a where a.line == MATERNAL, ascendants)

    if count(paternal) > 0 AND count(maternal) > 0:
        // Both lines have ascendants of equal degree
        // Half to each line, then per capita within
        paternal_share = total / 2
        maternal_share = total / 2
        divide_equally(paternal, paternal_share)
        divide_equally(maternal, maternal_share)
    else:
        // Only one line → all to that line
        surviving_line = paternal if count(paternal) > 0 else maternal
        divide_equally(surviving_line, total)
}
```

---

#### Scenario T7 — Legitimate Parents/Ascendants + Surviving Spouse

| Heir | Legitime Formula | Fraction of E |
|------|-----------------|---------------|
| Legitimate parents/ascendants (collective) | E × ½ | ½ (0.5) |
| Surviving spouse | E × ¼ | ¼ (0.25) |
| **Free Portion** | E × ¼ | **¼ (0.25)** |

**Legal basis**: Art. 889 (parents ½), Art. 893 (spouse ¼, from FP)
**Verification**: ½ + ¼ + ¼ = 1 ✓

---

#### Scenario T8 — Legitimate Parents/Ascendants + Illegitimate Children

| Heir | Legitime Formula | Fraction of E |
|------|-----------------|---------------|
| Legitimate parents/ascendants (collective) | E × ½ | ½ (0.5) |
| Illegitimate children (collective) | E × ¼ | ¼ (0.25) |
| Each illegitimate child | E × ¼ ÷ m | 1/(4m) |
| **Free Portion** | E × ¼ | **¼ (0.25)** |

**Legal basis**: Art. 889 (parents ½), Art. 896 (illegitimate children = ¼ total, from FP)
**Key difference from Regime A**: Art. 896 gives a FLAT ¼ to illegitimate children as a GROUP — not a per-child formula derived from a legitimate child's share. This flat fraction means no cap rule is needed; the ¼ is fixed regardless of how many illegitimate children there are.
**Verification**: ½ + ¼ + ¼ = 1 ✓

---

#### Scenario T9 — Legitimate Parents/Ascendants + Illegitimate Children + Surviving Spouse

| Heir | Legitime Formula | Fraction of E |
|------|-----------------|---------------|
| Legitimate parents/ascendants (collective) | E × ½ | ½ (0.5) |
| Illegitimate children (collective) | E × ¼ | ¼ (0.25) |
| Each illegitimate child | E × ¼ ÷ m | 1/(4m) |
| Surviving spouse | E × ⅛ | ⅛ (0.125) |
| **Free Portion** | E × ⅛ | **⅛ (0.125)** |

**Legal basis**: Art. 899 ("surviving spouse shall be entitled to one-eighth... and the illegitimate children to one-fourth, the rest being the legitime of the parents or ascendants")
**Verification**: ½ + ¼ + ⅛ + ⅛ = 4/8 + 2/8 + 1/8 + 1/8 = 8/8 = 1 ✓
**Note**: This is the most constrained scenario — testator can only freely dispose of ⅛ of the estate.

---

### Regime C: No Primary/Secondary Compulsory Heirs

#### Scenario T10 — Illegitimate Children + Surviving Spouse Only

| Heir | Legitime Formula | Fraction of E |
|------|-----------------|---------------|
| Illegitimate children (collective) | E × ⅓ | ⅓ (0.333) |
| Each illegitimate child | E × ⅓ ÷ m | 1/(3m) |
| Surviving spouse | E × ⅓ | ⅓ (0.333) |
| **Free Portion** | E × ⅓ | **⅓ (0.333)** |

**Legal basis**: Art. 894
**Prerequisite**: No legitimate children/descendants AND no legitimate ascendants
**Verification**: ⅓ + ⅓ + ⅓ = 1 ✓

---

#### Scenario T11 — Illegitimate Children Only

| Heir | Legitime Formula | Fraction of E |
|------|-----------------|---------------|
| Illegitimate children (collective) | E × ½ | ½ (0.5) |
| Each illegitimate child | E × ½ ÷ m | 1/(2m) |
| **Free Portion** | E × ½ | **½ (0.5)** |

**Legal basis**: Art. 901
**Prerequisite**: No legitimate children/descendants, no legitimate ascendants, no surviving spouse

---

#### Scenario T12 — Surviving Spouse Only

| Heir | Legitime Formula | Fraction of E |
|------|-----------------|---------------|
| Surviving spouse (normal) | E × ½ | ½ (0.5) |
| Surviving spouse (articulo mortis) | E × ⅓ | ⅓ (0.333) |
| **Free Portion (normal)** | E × ½ | **½ (0.5)** |
| **Free Portion (articulo mortis)** | E × ⅔ | **⅔ (0.667)** |

**Legal basis**: Art. 900
**Articulo mortis condition** (Art. 900 ¶2): Marriage solemnized at the point of death AND decedent died within 3 months, UNLESS they lived as husband and wife for 5+ years.

```
function spouse_sole_legitime(spouse: Heir, decedent: Decedent) -> Fraction {
    if is_articulo_mortis(spouse, decedent):
        return 1/3
    else:
        return 1/2
}

function is_articulo_mortis(spouse, decedent) -> bool {
    marriage_in_extremis = decedent.marriage_in_articulo_mortis
    died_within_3_months = (decedent.date_of_death - decedent.date_of_marriage).months < 3
    lived_together_5_years = decedent.cohabitation_years >= 5

    return marriage_in_extremis AND died_within_3_months AND NOT lived_together_5_years
}
```

---

#### Scenario T13 — No Compulsory Heirs

| Heir | Legitime Formula | Fraction of E |
|------|-----------------|---------------|
| (none) | — | — |
| **Free Portion** | E × 1 | **1 (1.0)** |

**Legal basis**: Art. 842 ("One who has no compulsory heirs may dispose by will of all his estate")

---

### Special Regime: Illegitimate Decedent (Art. 903)

When the decedent is an illegitimate child, a special set of rules applies to their parents.

#### Scenario T14 — Parents of Illegitimate Decedent Only

| Heir | Legitime Formula | Fraction of E |
|------|-----------------|---------------|
| Parents of illegitimate decedent | E × ½ | ½ (0.5) |
| **Free Portion** | E × ½ | **½ (0.5)** |

**Legal basis**: Art. 903 ¶1
**Prerequisite**: Decedent is illegitimate; no descendants, no surviving spouse, no illegitimate children
**Division**: Both parents alive → equal shares; one → all to survivor

---

#### Scenario T15 — Parents of Illegitimate Decedent + Surviving Spouse

| Heir | Legitime Formula | Fraction of E |
|------|-----------------|---------------|
| Parents of illegitimate decedent | E × ¼ | ¼ (0.25) |
| Surviving spouse | E × ¼ | ¼ (0.25) |
| **Free Portion** | E × ½ | **½ (0.5)** |

**Legal basis**: Art. 903 ¶2
**Note**: Art. 903 ¶2 also states "If only legitimate or illegitimate children are left, the parents are not entitled to any legitime whatsoever." — this means if the illegitimate decedent has their own children (legitimate or illegitimate), the illegitimate decedent's parents get NOTHING. The children inherit under the normal rules (Art. 888 if legitimate children, Art. 901 if only illegitimate children).

---

## Master Legitime Computation Algorithm

```
function compute_all_legitimes(
    estate: Amount,
    heirs: List<Heir>,
    decedent: Decedent
) -> Map<Heir, Amount> {

    // Step 1: Determine which groups are present (from heir-concurrence-rules)
    scenario = determine_testate_scenario(heirs)

    // Step 2: Compute group-level fractions based on scenario
    match scenario {

        // === REGIME A: Descendants Present ===

        T1:  // Legitimate children only
            legit_collective = estate * 1/2     // Art. 888
            per_legit_child = legit_collective / n
            free_portion = estate * 1/2
            return { each_legit_child: per_legit_child }

        T2:  // 1 legitimate child + spouse
            child_legitime = estate * 1/2       // Art. 888
            spouse_legitime = estate * 1/4      // Art. 892 ¶1
            free_portion = estate * 1/4
            return { child: child_legitime, spouse: spouse_legitime }

        T3:  // 2+ legitimate children + spouse
            legit_collective = estate * 1/2     // Art. 888
            per_legit_child = legit_collective / n
            spouse_legitime = per_legit_child   // Art. 892 ¶2
            free_portion = estate - legit_collective - spouse_legitime
            return { each_legit_child: per_legit_child, spouse: spouse_legitime }

        T4:  // Legitimate + illegitimate children (no spouse)
            legit_collective = estate * 1/2     // Art. 888
            per_legit_child = legit_collective / n
            per_illegit_uncapped = per_legit_child / 2  // Art. 895
            free_portion = estate * 1/2
            // Apply cap (Art. 895 ¶3) — no spouse to satisfy first
            cap = free_portion
            total_illegit = m * per_illegit_uncapped
            if total_illegit > cap:
                per_illegit = cap / m
            else:
                per_illegit = per_illegit_uncapped
            return { each_legit_child: per_legit_child, each_illegit_child: per_illegit }

        T5:  // Legitimate + illegitimate + spouse
            legit_collective = estate * 1/2     // Art. 888
            per_legit_child = legit_collective / n
            free_portion = estate * 1/2

            // Spouse (Art. 892, 897)
            if n == 1:
                spouse_legitime = estate * 1/4  // Art. 892 ¶1
            else:
                spouse_legitime = per_legit_child  // Art. 892 ¶2, Art. 897

            // Illegitimate (Art. 895) — cap rule with spouse priority
            per_illegit_uncapped = per_legit_child / 2  // Art. 895
            remaining_fp = free_portion - spouse_legitime  // Art. 895 ¶3: spouse first
            total_illegit = m * per_illegit_uncapped

            if total_illegit > remaining_fp:
                per_illegit = remaining_fp / m  // capped
            else:
                per_illegit = per_illegit_uncapped

            return {
                each_legit_child: per_legit_child,
                spouse: spouse_legitime,
                each_illegit_child: per_illegit
            }

        // === REGIME B: Ascendants Present (No Descendants) ===

        T6:  // Ascendants only
            ascendant_collective = estate * 1/2  // Art. 889
            free_portion = estate * 1/2
            return distribute_among_ascendants(ascendants, ascendant_collective)

        T7:  // Ascendants + spouse
            ascendant_collective = estate * 1/2  // Art. 889
            spouse_legitime = estate * 1/4       // Art. 893
            free_portion = estate * 1/4
            result = distribute_among_ascendants(ascendants, ascendant_collective)
            result[spouse] = spouse_legitime
            return result

        T8:  // Ascendants + illegitimate children
            ascendant_collective = estate * 1/2       // Art. 889
            illegit_collective = estate * 1/4          // Art. 896 (flat ¼)
            per_illegit = illegit_collective / m
            free_portion = estate * 1/4
            result = distribute_among_ascendants(ascendants, ascendant_collective)
            result[each_illegit] = per_illegit
            return result

        T9:  // Ascendants + illegitimate + spouse
            ascendant_collective = estate * 1/2       // Art. 889/899
            illegit_collective = estate * 1/4          // Art. 899
            per_illegit = illegit_collective / m
            spouse_legitime = estate * 1/8             // Art. 899
            free_portion = estate * 1/8
            result = distribute_among_ascendants(ascendants, ascendant_collective)
            result[each_illegit] = per_illegit
            result[spouse] = spouse_legitime
            return result

        // === REGIME C: No Primary/Secondary Compulsory Heirs ===

        T10:  // Illegitimate children + spouse
            illegit_collective = estate * 1/3     // Art. 894
            per_illegit = illegit_collective / m
            spouse_legitime = estate * 1/3        // Art. 894
            free_portion = estate * 1/3
            return { each_illegit: per_illegit, spouse: spouse_legitime }

        T11:  // Illegitimate children only
            illegit_collective = estate * 1/2     // Art. 901
            per_illegit = illegit_collective / m
            free_portion = estate * 1/2
            return { each_illegit: per_illegit }

        T12:  // Spouse only
            spouse_legitime = spouse_sole_legitime(spouse, decedent)  // Art. 900
            free_portion = estate - spouse_legitime
            return { spouse: spouse_legitime }

        T13:  // No compulsory heirs
            free_portion = estate
            return {}

        // === SPECIAL: Illegitimate Decedent ===

        T14:  // Parents of illegitimate decedent
            parent_collective = estate * 1/2      // Art. 903 ¶1
            return distribute_among_parents(parents, parent_collective)

        T15:  // Parents + spouse of illegitimate decedent
            parent_collective = estate * 1/4      // Art. 903 ¶2
            spouse_legitime = estate * 1/4        // Art. 903 ¶2
            result = distribute_among_parents(parents, parent_collective)
            result[spouse] = spouse_legitime
            return result
    }
}
```

---

## Representation Interaction

When a legitimate child predeceases, is disinherited, or is incapacitated, and has descendants who represent them (Arts. 970-977, 923, 1035), the line count `n` includes the represented line.

```
function count_child_lines(heirs: List<Heir>) -> int {
    lines = Set()
    for heir in heirs:
        if heir.effective_category == LEGITIMATE_CHILD_GROUP:
            if heir.degree_from_decedent == 1:
                // Direct child: this IS a line
                lines.add(heir.id)
            else:
                // Grandchild or deeper: maps to parent-line
                lines.add(heir.represented_ancestor_id)
    return count(lines)
}
```

**Per-stirpes distribution within a represented line**:
```
function distribute_within_line(line_share: Amount, representatives: List<Heir>) -> Map<Heir, Amount> {
    // Art. 974: representatives cannot inherit more than the person represented
    // Divide the line's share equally among the representatives at the first level
    // If a representative themselves has representatives, recurse
    direct_reps = filter(r where r.parent == represented_person, representatives)
    per_rep = line_share / count(direct_reps)
    result = {}
    for rep in direct_reps:
        if rep.is_alive AND is_eligible(rep):
            result[rep] = per_rep
        elif has_eligible_descendants(rep):
            // Recursive representation (Art. 982)
            sub_reps = get_eligible_descendants(rep)
            result.merge(distribute_within_line(per_rep, sub_reps))
    return result
}
```

---

## Summary: Complete Fraction Reference Table

### Testate Legitime Fractions (All 15 Scenarios)

| # | Scenario | Children Collective | Per Legit. Child | Spouse | Illegit. Collective | Per Illegit. Child | Free Portion |
|---|----------|-------------------|-----------------|--------|--------------------|--------------------|-------------|
| T1 | n legit. children | ½ | 1/(2n) | — | — | — | ½ |
| T2 | 1 legit. child + spouse | ½ | ½ | ¼ | — | — | ¼ |
| T3 | n≥2 legit. children + spouse | ½ | 1/(2n) | 1/(2n) | — | — | (n−1)/(2n) |
| T4 | n legit. + m illegit. | ½ | 1/(2n) | — | min(m/(4n), ½) | min(1/(4n), 1/(2m)) | max(½ − m/(4n), 0) |
| T5a | 1 legit. + m illegit. + spouse | ½ | ½ | ¼ | min(m/4, ¼) | min(¼, 1/(4m)) | max(¼ − m/4, 0) |
| T5b | n≥2 legit. + m illegit. + spouse | ½ | 1/(2n) | 1/(2n) | min(m/(4n), (n−1)/(2n)) | min(1/(4n), (n−1)/(2mn)) | max((n−1)/(2n) − m/(4n), 0) |
| T6 | Ascendants only | — | — | — | — | — | ½ |
| T7 | Ascendants + spouse | — | — | ¼ | — | — | ¼ |
| T8 | Ascendants + m illegit. | — | — | — | ¼ | 1/(4m) | ¼ |
| T9 | Ascendants + m illegit. + spouse | — | — | ⅛ | ¼ | 1/(4m) | ⅛ |
| T10 | m illegit. + spouse | — | — | ⅓ | ⅓ | 1/(3m) | ⅓ |
| T11 | m illegit. only | — | — | — | ½ | 1/(2m) | ½ |
| T12 | Spouse only | — | — | ½ (or ⅓) | — | — | ½ (or ⅔) |
| T13 | No compulsory heirs | — | — | — | — | — | 1 |
| T14 | Parents of illegit. decedent | — | — | — | — | — | ½ |
| T15 | Parents + spouse of illegit. decedent | — | — | ¼ | — | — | ½ |

**Note for T6-T9, T14-T15**: Ascendants' collective share = ½ (T6-T9) or ½/¼ (T14-T15). Division among individual ascendants follows Art. 890 rules (see `divide_among_ascendants` above).

---

## Worked Examples

### Example A: Scenario T5b — 3 Legitimate + 2 Illegitimate + Spouse

**Inputs**: E = ₱12,000,000, n = 3, m = 2

| Computation | Formula | Amount |
|------------|---------|--------|
| Children collective | ₱12M × ½ | ₱6,000,000 |
| Per legitimate child | ₱6M ÷ 3 | ₱2,000,000 |
| Spouse | = one child's share (Art. 892 ¶2) | ₱2,000,000 |
| FP | ₱12M × ½ | ₱6,000,000 |
| Remaining FP after spouse | ₱6M − ₱2M | ₱4,000,000 |
| Per illegit. (uncapped) | ₱2M × ½ | ₱1,000,000 |
| Total illegit. | 2 × ₱1M | ₱2,000,000 |
| Cap check | ₱2M ≤ ₱4M | **No cap** |

**Final distribution**:

| Heir | Legitime | Basis |
|------|----------|-------|
| LC1 | ₱2,000,000 | Art. 888 |
| LC2 | ₱2,000,000 | Art. 888 |
| LC3 | ₱2,000,000 | Art. 888 |
| Spouse | ₱2,000,000 | Art. 892 ¶2, Art. 897 |
| IC1 | ₱1,000,000 | Art. 895 |
| IC2 | ₱1,000,000 | Art. 895 |
| **Total legitime** | **₱10,000,000** | |
| **Free portion** | **₱2,000,000** | |

**Verification**: IC1's ₱1M = ½ of LC1's ₱2M ✓. Spouse's ₱2M = LC1's ₱2M ✓.

---

### Example B: Scenario T5a with Cap — 1 Legitimate + 4 Illegitimate + Spouse

**Inputs**: E = ₱10,000,000, n = 1, m = 4

| Computation | Formula | Amount |
|------------|---------|--------|
| Legitimate child | ₱10M × ½ | ₱5,000,000 |
| Spouse | ₱10M × ¼ (Art. 892 ¶1) | ₱2,500,000 |
| FP | ₱10M × ½ | ₱5,000,000 |
| Remaining FP after spouse | ₱5M − ₱2.5M | ₱2,500,000 |
| Per illegit. (uncapped) | ₱5M × ½ | ₱2,500,000 |
| Total illegit. (uncapped) | 4 × ₱2.5M | ₱10,000,000 |
| Cap check | ₱10M > ₱2.5M | **CAP APPLIES** |
| Per illegit. (capped) | ₱2.5M ÷ 4 | ₱625,000 |

**Final distribution**:

| Heir | Legitime | Basis |
|------|----------|-------|
| LC1 | ₱5,000,000 | Art. 888 |
| Spouse | ₱2,500,000 | Art. 892 ¶1 |
| IC1 | ₱625,000 | Art. 895 (capped by ¶3) |
| IC2 | ₱625,000 | Art. 895 (capped by ¶3) |
| IC3 | ₱625,000 | Art. 895 (capped by ¶3) |
| IC4 | ₱625,000 | Art. 895 (capped by ¶3) |
| **Total legitime** | **₱10,000,000** | |
| **Free portion** | **₱0** | |

**Note**: The cap reduces each illegitimate child from ₱2,500,000 to ₱625,000 — a 75% reduction! The testator has ZERO disposable free portion.

---

### Example C: Scenario T9 — Ascendants + 3 Illegitimate + Spouse

**Inputs**: E = ₱8,000,000, m = 3, both parents alive

| Heir | Legitime | Basis |
|------|----------|-------|
| Father | ₱2,000,000 | Art. 889, 890 (½ of ₱4M) |
| Mother | ₱2,000,000 | Art. 889, 890 (½ of ₱4M) |
| Spouse | ₱1,000,000 | Art. 899 (⅛ of ₱8M) |
| IC1 | ₱666,667 | Art. 899 (¼ of ₱8M ÷ 3) |
| IC2 | ₱666,667 | Art. 899 |
| IC3 | ₱666,667 | Art. 899 |
| **Total legitime** | **₱7,000,000** | |
| **Free portion** | **₱1,000,000** | ⅛ of ₱8M |

**Verification**: ½ + ⅛ + ¼ + ⅛ = 4/8 + 1/8 + 2/8 + 1/8 = 8/8 = 1 ✓

---

### Example D: Scenario T10 — 2 Illegitimate + Spouse (No Legitimate Heirs)

**Inputs**: E = ₱9,000,000, m = 2

| Heir | Legitime | Basis |
|------|----------|-------|
| Spouse | ₱3,000,000 | Art. 894 (⅓) |
| IC1 | ₱1,500,000 | Art. 894 (⅓ ÷ 2) |
| IC2 | ₱1,500,000 | Art. 894 (⅓ ÷ 2) |
| **Total legitime** | **₱6,000,000** | |
| **Free portion** | **₱3,000,000** | ⅓ |

---

## Edge Cases

### 1. Single Legitimate Child — The T2/T3 Boundary

Art. 892 creates a discontinuity at n=1. When the first legitimate child has a child of their own who represents them, and a second legitimate child exists, the scenario jumps from T2 behavior to T3 behavior. The engine must count **lines**, not heads.

Example: Decedent has 1 living child + 1 predeceased child with grandchildren = 2 lines → T3, not T2.

### 2. All Illegitimate Children's Legitime Consumed by Cap → Free Portion = 0

When the cap rule under Art. 895 ¶3 reduces illegitimate children's shares, the free portion after all legitimes may be zero. The testator has no disposable portion. Any testamentary disposition beyond the legitimes would be inofficious and must be reduced per Art. 911.

### 3. Ascendants of Different Degrees and Lines

Art. 890 ¶2: When the decedent leaves no father or mother but has grandparents:
- Same line, same degree → per capita within line
- Different lines, same degree → ½ paternal, ½ maternal
- Different degrees → all to the nearer degree (regardless of line)

Example: Paternal grandfather (2nd degree) + maternal great-grandmother (3rd degree) → only paternal grandfather inherits (nearer degree wins).

### 4. One Parent Dead, Other Alive — Impact on Spouse's Share

If the decedent dies with one surviving parent and a spouse (T7):
- Parent gets the entire ascendant legitime of ½ (Art. 890: "the whole shall pass to the survivor")
- Spouse still gets ¼ (Art. 893)
- The spouse's fraction does NOT change based on whether one or both parents survive

### 5. Articulo Mortis Applies Only in T12

The articulo mortis reduction (½ → ⅓) per Art. 900 ¶2 only applies when the spouse is the SOLE compulsory heir (Scenario T12). When the spouse concurs with other compulsory heirs, the normal rules apply (Arts. 892, 893, 894, 897, 899).

### 6. Art. 903 — Parents Inherit Zero When Illegitimate Decedent Has Children

Art. 903 ¶2: "If only legitimate or illegitimate children are left, the parents are not entitled to any legitime whatsoever." This means when the illegitimate decedent has their OWN children (legitimate or illegitimate), the decedent's parents (the grandparents) receive nothing. The normal Regime A (T1-T5) or Regime C (T10-T11) rules apply based on the decedent's own children.

### 7. Fractional Precision — Infinite Decimals

Many scenarios produce non-terminating decimal fractions (e.g., ⅓ = 0.333..., ⅙ = 0.166...). The engine must use exact rational arithmetic or round only at the final step to avoid penny-rounding errors that don't sum to the total estate.

```
// Recommended: use rational fractions throughout, convert to peso amounts only at output
struct Fraction {
    numerator: int
    denominator: int
}

// Allocate any rounding remainder to the largest-share heir (or the first heir)
function allocate_rounding_remainder(shares: Map<Heir, Fraction>, estate: Amount) -> Map<Heir, Amount> {
    peso_shares = {}
    total_allocated = 0
    for (heir, fraction) in shares:
        peso_shares[heir] = floor(estate * fraction.numerator / fraction.denominator)
        total_allocated += peso_shares[heir]

    remainder = estate - total_allocated
    // Distribute remainder 1 centavo at a time to heirs in order
    for heir in sorted_by_share_desc(peso_shares):
        if remainder <= 0: break
        peso_shares[heir] += 1  // add 1 centavo
        remainder -= 1

    return peso_shares
}
```

### 8. Empty Groups in Regime A Cap Calculation

When applying the cap rule in T4/T5, if there are zero illegitimate children (m=0), the cap logic is skipped entirely. The algorithm must guard against division by zero.

```
if m == 0:
    skip cap calculation
    each_illegit = 0
```

---

## Test Implications

### Fraction Computation Tests (one per scenario)

| # | Scenario | E | n | m | Expected Per-Legit | Expected Spouse | Expected Per-Illegit | Expected FP |
|---|----------|---|---|---|-------------------|----------------|---------------------|-------------|
| 1 | T1 | ₱10M | 3 | 0 | ₱1,666,667 | — | — | ₱5,000,000 |
| 2 | T2 | ₱10M | 1 | 0 | ₱5,000,000 | ₱2,500,000 | — | ₱2,500,000 |
| 3 | T3 | ₱12M | 3 | 0 | ₱2,000,000 | ₱2,000,000 | — | ₱4,000,000 |
| 4 | T4 | ₱10M | 2 | 2 | ₱2,500,000 | — | ₱1,250,000 | ₱2,500,000 |
| 5 | T4cap | ₱10M | 1 | 5 | ₱5,000,000 | — | ₱1,000,000 | ₱0 |
| 6 | T5a | ₱10M | 1 | 1 | ₱5,000,000 | ₱2,500,000 | ₱2,500,000 | ₱0 |
| 7 | T5a-cap | ₱10M | 1 | 3 | ₱5,000,000 | ₱2,500,000 | ₱833,333 | ₱0 |
| 8 | T5b | ₱12M | 3 | 2 | ₱2,000,000 | ₱2,000,000 | ₱1,000,000 | ₱2,000,000 |
| 9 | T5b-cap | ₱10M | 2 | 5 | ₱2,500,000 | ₱2,500,000 | ₱500,000 | ₱0 |
| 10 | T6 | ₱10M | 0 | 0 | — (parents ₱2.5M each) | — | — | ₱5,000,000 |
| 11 | T7 | ₱10M | 0 | 0 | — (parents ₱2.5M each) | ₱2,500,000 | — | ₱2,500,000 |
| 12 | T8 | ₱10M | 0 | 3 | — (parents ₱2.5M each) | — | ₱833,333 | ₱2,500,000 |
| 13 | T9 | ₱8M | 0 | 3 | — (parents ₱2M each) | ₱1,000,000 | ₱666,667 | ₱1,000,000 |
| 14 | T10 | ₱9M | 0 | 2 | — | ₱3,000,000 | ₱1,500,000 | ₱3,000,000 |
| 15 | T11 | ₱10M | 0 | 4 | — | — | ₱1,250,000 | ₱5,000,000 |
| 16 | T12 | ₱10M | 0 | 0 | — | ₱5,000,000 | — | ₱5,000,000 |
| 17 | T12am | ₱10M | 0 | 0 | — | ₱3,333,333 | — | ₱6,666,667 |
| 18 | T13 | ₱10M | 0 | 0 | — | — | — | ₱10,000,000 |

### Cap Rule Tests

| # | n | m | Spouse? | Cap bites? | Expected behavior |
|---|---|---|---------|-----------|------------------|
| 19 | 1 | 1 | Yes | No (exactly fills) | Each illegit. = ¼E |
| 20 | 1 | 2 | Yes | Yes | Each illegit. = ⅛E |
| 21 | 1 | 10 | Yes | Yes | Each illegit. = 1/40E |
| 22 | 2 | 4 | No | No (exactly fills) | Each illegit. = ⅛E |
| 23 | 2 | 5 | No | Yes | Each illegit. = 1/10E |
| 24 | 1 | 3 | No | Yes | Each illegit. = ⅙E |
| 25 | 3 | 4 | Yes | No | Each illegit. = 1/12E |
| 26 | 3 | 5 | Yes | Yes (5 > 2×(3−1)=4) | Each illegit. = (3−1)/(2×3×5)E = 1/15E |

### Ascendant Distribution Tests

| # | Ascendants | Expected |
|---|-----------|----------|
| 27 | Both parents | ½ each of group share |
| 28 | Father only | All of group share |
| 29 | Paternal grandparents (both) + maternal grandfather | ½ to paternal (¼ each), ½ to maternal |
| 30 | Paternal grandfather + maternal grandmother | ½ each (equal degree, different lines) |
| 31 | Paternal grandfather + maternal great-grandmother | All to paternal grandfather (nearer degree) |

### Boundary Tests

| # | Test | Expected |
|---|------|----------|
| 32 | T3 with n=2 (boundary of T2→T3) | Spouse = ¼ (same as T2 coincidentally), not ½ |
| 33 | FP = 0 after cap | Testamentary disposition to stranger = fully inofficious |
| 34 | Rounding: E=₱10,000,000 ÷ 3 children | ₱1,666,666.67 — verify total = ₱10M |

---

## Engine Pipeline Integration

The legitime-table computation is **Step 3** in the engine pipeline:

```
Step 1: Classify heirs (compulsory-heirs-categories)
Step 1.5: Build lines for representation (representation-rights)
Step 2: Determine concurrence scenario (heir-concurrence-rules) → T1-T15 or I1-I15
    ↓
Step 3: Compute each heir's legitime (THIS ASPECT)
    Input: scenario code, estate amount, heir counts (n, m), heir list
    Output: Map<Heir, LegitimeAmount>
    ↓
Step 4: Compute free portion = estate - sum(all legitimes)
Step 5: Distribute free portion per will (testate) or intestate rules
```

---

*Analysis based on Civil Code Arts. 886-903, Family Code Art. 176, with cross-references to heir-concurrence-rules (T1-T15 scenario codes) and representation-rights (line counting).*
