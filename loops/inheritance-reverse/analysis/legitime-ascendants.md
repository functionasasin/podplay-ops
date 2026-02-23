# Legitime — Ascendants (Parents and Higher Ascendants) Deep Dive

**Aspect**: legitime-ascendants
**Wave**: 3 (Legitime Computation)
**Primary Legal Basis**: Arts. 889-891 (Civil Code — testate legitime), Arts. 985-987, 991, 997, 1000 (intestate), Art. 903 (illegitimate decedent), Art. 920 (disinheritance of ascendants)
**Depends On**: compulsory-heirs-categories, heir-concurrence-rules, legitime-table, legitime-surviving-spouse

---

## Overview

Legitimate parents and ascendants are **secondary compulsory heirs** — they only receive a legitime when there are NO legitimate children or descendants (Art. 887(2): "in default of the foregoing"). When they do inherit, their collective legitime is always **½ of the estate** in testate succession (Art. 889), but the per-individual distribution follows complex rules based on degree, line (paternal/maternal), and which other heirs concur.

This analysis covers:
1. The activation gate (when ascendants inherit at all)
2. The ascendant collective fraction across all scenarios
3. The division algorithm among individual ascendants (Art. 890 / Arts. 986-987)
4. Reserva troncal (Art. 891)
5. Illegitimate decedent's parents (Art. 903)
6. Testate vs intestate comparison
7. Disinheritance of ascendants (Art. 920)
8. Complete edge cases and test implications

---

## Legal Basis

### Core Articles

| Article | What It Governs | Quoted Text (Key Portion) |
|---------|----------------|--------------------------|
| **Art. 887(2)** | Activation gate | "In default of [legitimate children and descendants], legitimate parents and ascendants, with respect to their legitimate children and descendants" |
| **Art. 889** | Ascendants' collective legitime | "The legitime of legitimate parents or ascendants consists of one-half (½) of the hereditary estates of their children and descendants." |
| **Art. 890 ¶1** | Division between parents | "The legitime reserved for the legitimate parents shall be divided between them equally; if one of the parents should have died, the whole shall pass to the survivor." |
| **Art. 890 ¶2** | Division among higher ascendants | "If the testator leaves neither father nor mother, but is survived by ascendants of equal degree of the paternal and maternal lines, the legitime shall be divided equally between both lines. If the ascendants should be of different degrees, it shall pertain entirely to the ones nearest in degree of either line." |
| **Art. 891** | Reserva troncal | "The ascendant who inherits from his descendant any property which the latter may have acquired by gratuitous title from another ascendant, or a brother or sister, is obliged to reserve such property..." |
| **Art. 903** | Parents of illegitimate decedent | Special regime: ½ alone; ¼ with spouse; 0 if decedent has own children |
| **Art. 920** | Disinheritance grounds for parents/ascendants | 8 causes enumerated |
| **Art. 972** | No representation in ascending line | "The right of representation takes place in the direct descending line, but never in the ascending." |

### Intestate Articles

| Article | Scenario | Ascendants' Share |
|---------|----------|-------------------|
| **Art. 985** | Ascendants inherit in default of descendants | "to the exclusion of collateral relatives" |
| **Art. 986** | Father and mother if living | "inherit in equal shares. Should one only survive, he or she shall succeed to the child to the exclusion of the other ascendants." |
| **Art. 987** | Higher ascendants (no parents) | Nearest degree wins; same degree → ½ per line; per capita within line |
| **Art. 991** | Ascendants + illegitimate children | ½ each |
| **Art. 997** | Ascendants + surviving spouse | ½ to ascendants, ½ to spouse |
| **Art. 1000** | Ascendants + illegitimate children + spouse | ½ to ascendants, ¼ to IC, ¼ to spouse |

---

## Rule 1: The Activation Gate

Ascendants are compulsory heirs ONLY when no legitimate children or descendants survive.

```
function are_ascendants_compulsory(heirs: List<Heir>) -> bool {
    // Art. 887(2): "In default of [legitimate children and descendants]"
    has_legitimate_descendants = any(
        h for h in heirs
        where h.effective_category == LEGITIMATE_CHILD_GROUP
        AND h.is_alive
        AND NOT h.is_disqualified
    )
    return NOT has_legitimate_descendants
}
```

**Key nuances**:
- "Default" means complete absence. If even ONE legitimate grandchild inherits by representation, ascendants are excluded.
- Adopted children count as legitimate children (RA 8552 Sec. 17) — their presence excludes ascendants.
- Legitimated children (FC Art. 179) also count as legitimate — their presence excludes ascendants.
- Illegitimate children do NOT exclude ascendants. They concur (Art. 887 ¶2).
- The surviving spouse does NOT exclude ascendants. They concur (Art. 887 ¶2).

**Engine check (must execute before any ascendant legitime computation)**:
```
if has_legitimate_descendants(heirs):
    for h in heirs where h.effective_category == LEGITIMATE_ASCENDANT_GROUP:
        h.receives_legitime = false
        h.exclusion_reason = "Art. 887(2): excluded by surviving legitimate descendants"
    return  // skip all ascendant computation
```

---

## Rule 2: Ascendants' Collective Legitime

### Testate: Always ½

In all testate scenarios where ascendants are compulsory heirs (T6-T9), their collective legitime is **½ of the estate** (Art. 889).

This ½ does NOT change based on:
- How many ascendants survive (1 parent vs 2 parents vs 4 grandparents)
- Whether a spouse concurs (still ½; spouse gets ¼ from FP per Art. 893)
- Whether illegitimate children concur (still ½; IC get ¼ from FP per Art. 896/899)

| Testate Scenario | Ascendants Collective | Concurring Heirs | FP |
|------------------|-----------------------|------------------|-----|
| T6: Ascendants only | ½ | — | ½ |
| T7: Ascendants + spouse | ½ | Spouse ¼ | ¼ |
| T8: Ascendants + IC | ½ | IC ¼ | ¼ |
| T9: Ascendants + IC + spouse | ½ | IC ¼, Spouse ⅛ | ⅛ |

### Intestate: ½ or Split with Other Classes

In intestate succession, ascendants' share depends on who else inherits:

| Intestate Scenario | Ascendants' Share | Concurring Heirs | Basis |
|-------------------|-------------------|------------------|-------|
| I5: Ascendants only | Entire estate | — | Art. 985 |
| I6: Ascendants + spouse | ½ | Spouse ½ | Art. 997 |
| I9: Ascendants + IC | ½ | IC ½ | Art. 991 |
| I10: Ascendants + IC + spouse | ½ | IC ¼, Spouse ¼ | Art. 1000 |

**Key observation**: In intestate, when ascendants are alone (I5), they get the **entire estate** — not just ½. There is no "free portion" concept in intestate succession; everything distributes to the heirs.

---

## Rule 3: Division Among Individual Ascendants (The Core Algorithm)

This is the most complex part of ascendant inheritance. Art. 890 (testate) and Arts. 986-987 (intestate) establish a hierarchy:

### Priority Level 1: Parents (Degree 1)

**Art. 890 ¶1 / Art. 986**: If the decedent's father and/or mother survive:

```
RULE: Parents take the entire ascendant share.
  - Both alive → equal shares (each gets ½ of the ascendant collective)
  - One alive → that parent gets ALL of the ascendant collective
  - Parents EXCLUDE all higher ascendants (grandparents, great-grandparents)
```

**Art. 986**: "Should one only of [father and mother] survive, he or she shall succeed to the child **to the exclusion of the other ascendants.**"

### Priority Level 2: Higher Ascendants (Degree 2+)

**Art. 890 ¶2 / Art. 987**: Only if BOTH parents are dead:

```
RULE 2A — Nearer degree takes all:
  If ascendants survive at different degrees, ALL goes to the nearest degree.
  Example: Paternal grandfather (degree 2) + maternal great-grandmother (degree 3)
    → ONLY paternal grandfather inherits (degree 2 < degree 3)

RULE 2B — Same degree, different lines → split by line:
  If ascendants of equal degree survive in both paternal and maternal lines:
    → ½ to paternal line, ½ to maternal line
    → Per capita within each line

RULE 2C — Same degree, one line only → all to that line:
  If ascendants of equal degree survive in only one line:
    → Everything to that line, per capita
```

### Complete Division Algorithm

```
function divide_among_ascendants(
    ascendants: List<Heir>,
    total_share: Amount
) -> Map<Heir, Amount> {
    result = {}

    // === Priority Level 1: Parents ===
    parents = filter(a where a.relationship == PARENT
                     AND a.is_alive
                     AND NOT a.is_disqualified,
                     ascendants)

    if count(parents) > 0:
        // Art. 890 ¶1 / Art. 986: parents exclude ALL higher ascendants
        if count(parents) == 2:
            // Both parents alive → equal shares
            result[father] = total_share / 2    // Fraction(1, 2) of total_share
            result[mother] = total_share / 2
        else:
            // One parent alive → all to survivor
            result[sole_parent] = total_share
        return result

    // === Priority Level 2: Higher Ascendants ===
    // Both parents dead. Find nearest degree among surviving ascendants.
    surviving = filter(a where a.is_alive AND NOT a.is_disqualified, ascendants)

    if count(surviving) == 0:
        return {}  // no ascendants survive

    // Art. 890 ¶2 / Art. 987: nearer degree wins
    min_degree = min(a.degree_from_decedent for a in surviving)
    nearest = filter(a where a.degree_from_decedent == min_degree, surviving)

    // Classify by line
    paternal = filter(a where a.line == PATERNAL, nearest)
    maternal = filter(a where a.line == MATERNAL, nearest)

    if count(paternal) > 0 AND count(maternal) > 0:
        // Art. 890 ¶2 / Art. 987: both lines → ½ each, per capita within
        paternal_share = total_share / 2
        maternal_share = total_share / 2

        for a in paternal:
            result[a] = paternal_share / count(paternal)
        for a in maternal:
            result[a] = maternal_share / count(maternal)

    elif count(paternal) > 0:
        // Only paternal line survives
        for a in paternal:
            result[a] = total_share / count(paternal)

    else:
        // Only maternal line survives
        for a in maternal:
            result[a] = total_share / count(maternal)

    return result
}
```

### Worked Examples of Ascendant Division

**Example 1**: Both parents alive. Total ascendant share = ₱5,000,000 (½ of ₱10M estate).
- Father: ₱2,500,000
- Mother: ₱2,500,000
- Any surviving grandparents: excluded by Art. 890 ¶1

**Example 2**: Mother alive, father dead. Total = ₱5,000,000.
- Mother: ₱5,000,000 (all)
- Paternal grandparents: excluded even though father is dead (Art. 986: "to the exclusion of the other ascendants")

**Example 3**: Both parents dead. Paternal grandfather alive. Maternal grandmother alive. Total = ₱5,000,000.
- Both are degree 2. Different lines, same degree → Art. 890 ¶2 / Art. 987
- Paternal grandfather: ₱2,500,000 (½ of share)
- Maternal grandmother: ₱2,500,000 (½ of share)

**Example 4**: Both parents dead. Paternal grandfather + paternal grandmother alive. Maternal grandmother alive. Total = ₱5,000,000.
- All degree 2. Two paternal, one maternal.
- Paternal share: ₱2,500,000 → ₱1,250,000 each (grandfather + grandmother)
- Maternal share: ₱2,500,000 → ₱2,500,000 (grandmother only)

**Example 5**: Both parents dead. Paternal grandfather (degree 2) alive. Maternal great-grandmother (degree 3) alive. Total = ₱5,000,000.
- Different degrees → NEARER takes all
- Paternal grandfather: ₱5,000,000
- Maternal great-grandmother: ₱0 (excluded by nearer degree)

**Example 6**: Both parents dead. Only maternal grandmother (degree 2) survives. Total = ₱5,000,000.
- Single line → all to that line
- Maternal grandmother: ₱5,000,000

**Example 7**: Both parents dead. Paternal great-grandfather (degree 3) + maternal great-grandmother (degree 3). Total = ₱5,000,000.
- Same degree, different lines → ½ each
- Paternal great-grandfather: ₱2,500,000
- Maternal great-grandmother: ₱2,500,000

---

## Rule 4: No Representation in the Ascending Line

**Art. 972**: "The right of representation takes place in the direct descending line, but never in the ascending."

This means:
- If the father is dead, the **paternal grandparents do NOT automatically "represent" the father**.
- Instead, the division algorithm in Art. 890 handles the transition from parents to higher ascendants.
- The algorithm is NOT representation — it's a flat hierarchy: check parents first, then find nearest degree among all surviving ascendants.

**Engine implication**: The Step 1.5 "Build Lines" for representation (from `representation-rights` analysis) applies ONLY to the descending line. No representation structures need to be built for ascendants.

```
function build_ascendant_list(family_tree: FamilyTree) -> List<Heir> {
    // Simply enumerate all surviving legitimate ascendants with their degree and line
    // NO representation logic
    ascendants = []
    for ancestor in family_tree.ancestors_of(decedent):
        if ancestor.is_alive AND ancestor.is_legitimate_relative:
            ascendants.append(Heir(
                person: ancestor,
                degree_from_decedent: compute_degree(ancestor, decedent),
                line: PATERNAL if is_on_father_side(ancestor) else MATERNAL,
                effective_category: LEGITIMATE_ASCENDANT_GROUP,
            ))
    return ascendants
}
```

---

## Rule 5: Reserva Troncal (Art. 891)

**Art. 891**: "The ascendant who inherits from his descendant any property which the latter may have acquired by gratuitous title from another ascendant, or a brother or sister, is obliged to reserve such property as he may have acquired by operation of law for the benefit of relatives who are within the third degree and who belong to the line from which said property came."

### What This Means

When an ascendant inherits property from a descendant, and that property was originally obtained by the descendant through gratuitous title (gift/inheritance) from ANOTHER ascendant or sibling, the inheriting ascendant must **reserve** that specific property for certain relatives.

### Reserva Troncal Elements

| Element | Rule |
|---------|------|
| **Who is the reservista** | The ascendant who inherits by operation of law |
| **What is reserved** | Property the descendant acquired by gratuitous title from another ascendant or sibling |
| **For whom** (reservatarios) | Relatives within 3rd degree of the decedent, belonging to the LINE from which the property came |
| **Trigger** | Ascendant inheriting → descendant died → property traces back to another line |

### Example

1. Grandmother G gives a house to Grandchild X (gratuitous title).
2. X dies without issue. X's mother (M) inherits the house under Art. 985.
3. M is now the **reservista**: she must reserve the house for G's relatives within the 3rd degree who belong to G's line.
4. If M later dies, the house goes to those reservatarios — NOT to M's own heirs from a different line.

### Engine Implications

**Reserva troncal is a POST-distribution encumbrance**. It does not change the legitime fractions or the basic inheritance computation. Instead:

1. Compute the normal inheritance distribution (ascendant receives their share)
2. Check if any property in the estate was acquired by the decedent through gratuitous title from ANOTHER ascendant or sibling
3. If yes, flag that property as "subject to reserva troncal" in the output
4. The narrative should note: "This property is subject to reserva troncal under Art. 891 and must be reserved for qualifying relatives."

```
struct ReservaTroncal {
    property_id: str,                    // the specific property subject to reservation
    reservista: Heir,                     // the ascending heir who received it
    origin_line: Line,                    // paternal or maternal — the line the property came from
    reservatarios: List<Person>,          // relatives within 3rd degree of decedent in the origin line
    original_transferor: Person,          // the ascendant or sibling who originally gave the property
    transfer_type: GratuitousTitle,       // donation or inheritance
}

function check_reserva_troncal(
    estate_assets: List<Asset>,
    inheriting_ascendant: Heir,
    decedent: Decedent
) -> List<ReservaTroncal> {
    reservations = []
    for asset in estate_assets:
        if asset.acquired_by == GRATUITOUS_TITLE
           AND (asset.source_person.is_ascendant_of(decedent)
                OR asset.source_person.is_sibling_of(decedent))
           AND asset.source_person != inheriting_ascendant:
            // This asset is subject to reserva troncal
            origin_line = determine_line(asset.source_person, decedent)
            reservatarios = find_relatives_within_3rd_degree(
                decedent, origin_line
            )
            reservations.append(ReservaTroncal(
                property_id: asset.id,
                reservista: inheriting_ascendant,
                origin_line: origin_line,
                reservatarios: reservatarios,
                original_transferor: asset.source_person,
                transfer_type: asset.acquisition_type,
            ))
    return reservations
}
```

**Data model requirement**: The estate input must include, for each asset, metadata about how the decedent acquired it (purchase vs gratuitous title) and from whom. Without this metadata, the engine cannot detect reserva troncal.

```
struct Asset {
    id: str,
    description: str,
    value: Amount,
    acquired_by: AcquisitionType,  // PURCHASE | DONATION | INHERITANCE | OTHER
    source_person: Option<Person>, // who gave/bequeathed it (if gratuitous)
}

enum AcquisitionType {
    PURCHASE,          // not subject to reserva troncal
    DONATION,          // gratuitous — check for reserva troncal
    INHERITANCE,       // gratuitous — check for reserva troncal
    OTHER,             // needs manual classification
}
```

### Reserva Troncal in Narrative

If reserva troncal applies, the narrative for the inheriting ascendant must include:

> **[Ascendant name] (legitimate parent/ascendant)** receives **₱X** including [property description].
> Note: [Property description] is subject to reserva troncal under Art. 891 of the Civil Code. [Ascendant name] received this property from the decedent, who originally acquired it by [donation/inheritance] from [original transferor], a [relationship] of the decedent. [Ascendant name] is obligated to reserve this property for the benefit of relatives within the third degree of the decedent who belong to the [paternal/maternal] line.

---

## Rule 6: Illegitimate Decedent's Parents (Art. 903)

Art. 903 creates a special regime when the decedent is illegitimate:

### Art. 903 ¶1: Parents Alone
> "The legitime of the parents who have an illegitimate child, when such child leaves neither legitimate descendants, nor a surviving spouse, nor illegitimate children, is one-half (½) of the hereditary estate of such illegitimate child."

### Art. 903 ¶2: Children Exclude Parents
> "If only legitimate or illegitimate children are left, the parents are not entitled to any legitime whatsoever."

### Art. 903 ¶3: Parents + Spouse
> "If only the widow or widower survives with parents of the illegitimate child, the legitime of the parents is one-fourth (¼) of the hereditary estate of the child, and that of the surviving spouse also one-fourth (¼) of the estate."

### Art. 903 Decision Tree

```
function compute_illegitimate_decedent_parent_legitime(
    estate: Amount,
    decedent: Decedent,           // must be illegitimate
    heirs: List<Heir>
) -> Map<Heir, Amount> {
    assert decedent.is_illegitimate

    has_children = any(h for h in heirs
        where (h.effective_category == LEGITIMATE_CHILD_GROUP
               OR h.effective_category == ILLEGITIMATE_CHILD_GROUP)
        AND h.is_alive AND NOT h.is_disqualified)

    has_spouse = any(h for h in heirs
        where h.effective_category == SURVIVING_SPOUSE_GROUP
        AND h.is_alive AND NOT h.is_disqualified)

    parents = filter(h where h.relationship == PARENT_OF_ILLEGITIMATE,
                     heirs)

    if has_children:
        // Art. 903 ¶2: parents get NOTHING
        // The decedent's own children inherit under normal rules
        return { parent: 0 for parent in parents }

    if has_spouse:
        // Art. 903 ¶3: parents get ¼, spouse gets ¼, FP = ½
        parent_collective = estate * 1/4
        return divide_between_parents(parents, parent_collective)

    // Art. 903 ¶1: parents alone → ½, FP = ½
    parent_collective = estate * 1/2
    return divide_between_parents(parents, parent_collective)
}

function divide_between_parents(
    parents: List<Heir>,
    total: Amount
) -> Map<Heir, Amount> {
    // Art. 903 doesn't specify division rules between parents
    // By analogy to Art. 890: equally if both, all to survivor if one
    alive_parents = filter(p where p.is_alive AND NOT p.is_disqualified, parents)
    if count(alive_parents) == 2:
        return { p: total / 2 for p in alive_parents }
    elif count(alive_parents) == 1:
        return { alive_parents[0]: total }
    else:
        return {}  // no surviving parents
}
```

### Key Difference: Art. 903 vs Art. 889

| Feature | Art. 889 (Legitimate Decedent) | Art. 903 (Illegitimate Decedent) |
|---------|-------------------------------|----------------------------------|
| **Heirs** | Legitimate parents/ascendants | Parents of the illegitimate child (may be illegitimate parents) |
| **Fraction alone** | ½ | ½ |
| **Fraction with spouse** | ½ (spouse gets ¼ from FP) | ¼ (spouse also gets ¼) |
| **Excludes IC** | No — concurs (Art. 896/899) | Yes! Art. 903 ¶2: children exclude parents entirely |
| **Higher ascendants** | Yes — Art. 890 allows grandparents | No — Art. 903 specifically says "parents" |
| **Interaction with IC** | Ascendants ½ + IC ¼ (Art. 896) | N/A — if decedent's own IC exist, parents get 0 |

**Critical for engine**: Art. 903 only mentions "parents" — not ascendants generally. The higher-ascendant rules of Art. 890 do not clearly apply. If both parents of the illegitimate decedent are dead, Art. 903 may not extend to grandparents. This is a legal gray area; the engine should flag this as requiring legal advice.

```
if decedent.is_illegitimate AND count(alive_parents) == 0:
    // Art. 903 says "parents" — unclear if grandparents inherit
    flag_warning("Art. 903 only references 'parents' of the illegitimate child. "
                 "Whether grandparents can inherit under this provision is legally uncertain. "
                 "Legal counsel recommended.")
    // Conservative default: no ascendant inheritance
    return {}
```

---

## Rule 7: Testate vs Intestate Comparison for Ascendant Scenarios

The ascendant scenarios produce different results in testate vs intestate:

### Scenario A: Ascendants Only

| | Testate | Intestate |
|--|---------|-----------|
| Ascendants' share | ½ (Art. 889) | Entire estate (Art. 985) |
| Free portion | ½ | N/A |
| Difference | +100% more intestate | |

### Scenario B: Ascendants + Surviving Spouse

| | Testate | Intestate |
|--|---------|-----------|
| Ascendants' share | ½ (Art. 889) | ½ (Art. 997) |
| Spouse's share | ¼ from FP (Art. 893) | ½ (Art. 997) |
| Free portion | ¼ | N/A |
| Spouse comparison | +100% more intestate (¼ → ½) | |
| Ascendants comparison | Same (½ = ½) | |

### Scenario C: Ascendants + Illegitimate Children

| | Testate | Intestate |
|--|---------|-----------|
| Ascendants' share | ½ (Art. 889) | ½ (Art. 991) |
| IC's share | ¼ (Art. 896) | ½ (Art. 991) |
| Free portion | ¼ | N/A |
| IC comparison | +100% more intestate (¼ → ½) | |

### Scenario D: Ascendants + IC + Spouse

| | Testate | Intestate |
|--|---------|-----------|
| Ascendants' share | ½ (Art. 899) | ½ (Art. 1000) |
| IC's share | ¼ (Art. 899) | ¼ (Art. 1000) |
| Spouse's share | ⅛ (Art. 899) | ¼ (Art. 1000) |
| Free portion | ⅛ | N/A |
| Spouse comparison | +100% more intestate (⅛ → ¼) | |

**Key pattern**: Ascendants' collective share is **always ½** in both testate and intestate (except when alone intestate, where they get everything). The spouse and illegitimate children benefit more from intestate succession because they absorb the free portion.

---

## Rule 8: Disinheritance of Ascendants (Art. 920)

Art. 920 provides 8 grounds for disinheriting parents or ascendants:

1. Abandoned their children or induced daughters to live a corrupt/immoral life, or attempted against their virtue
2. Convicted of attempt against the life of the testator, spouse, descendants, or ascendants
3. False accusation of crime with 6+ year imprisonment
4. Convicted of adultery/concubinage with the testator's spouse
5. By fraud/violence/intimidation/undue influence caused the testator to make or change a will
6. Loss of parental authority for causes specified in the Code
7. Refusal to support children/descendants without justifiable cause
8. Attempt by one parent against the life of the other, unless reconciled

### Effect of Disinheriting an Ascendant

**Art. 923 does NOT apply to ascendants**. Art. 923 (representation by children of disinherited person) only applies "in the descending line." There is NO representation in the ascending line (Art. 972).

Therefore, when a parent is validly disinherited:
- That parent simply loses their share
- No one "represents" the disinherited parent
- The share accrues to the other parent if one exists, or to higher ascendants per Art. 890

```
function handle_disinherited_ascendant(
    disinherited: Heir,
    ascendants: List<Heir>,
    total_share: Amount
) -> Map<Heir, Amount> {
    // Remove disinherited from the pool
    remaining = filter(a where a != disinherited, ascendants)

    // No representation in ascending line (Art. 972)
    // Redistribute among remaining ascendants per Art. 890
    return divide_among_ascendants(remaining, total_share)
}
```

**Example**: Decedent disinherits father. Mother survives.
- Father: ₱0 (disinherited)
- Mother: gets ALL of the ½ ascendant legitime (Art. 890 ¶1: "the whole shall pass to the survivor")

**Example**: Decedent disinherits mother. Both paternal grandparents survive.
- Mother: ₱0 (disinherited)
- Father is dead.
- Fall through to Art. 890 ¶2: grandparents at degree 2.
- Only paternal line survives → all to paternal grandparents per capita.

**Example**: Both parents disinherited, no grandparents survive.
- No ascendants remain. Ascendant group gets ₱0.
- The ½ ascendant collective is NOT redistributed to the free portion — wait, actually it IS. If no ascendant qualifies, the ascendant group has no compulsory heirs, and the scenario effectively shifts to a no-ascendant scenario (Regime C or T13). The engine must re-evaluate the scenario code.

```
function handle_all_ascendants_disqualified(
    heirs: List<Heir>
) -> ScenarioCode {
    // If all ascendants are disqualified (disinherited/unworthy),
    // re-evaluate scenario as if no ascendants exist
    remaining_heirs = filter(h where NOT h.is_disqualified, heirs)
    return determine_testate_scenario(remaining_heirs)
}
```

---

## Rule 9: Unworthiness (Art. 1032) Applied to Ascendants

Grounds from Art. 1032 that commonly affect ascendants:

| # | Ground | Common Ascendant Scenario |
|---|--------|---------------------------|
| 1 | Abandoned children or induced daughters to immoral life | Direct — parent abandoned child |
| 2 | Convicted of attempt against testator's life | Parent attempted to kill child |
| 6 | Fraud/violence to cause testator to make/change will | Parent coerced child into making will |

**Art. 1033**: Unworthiness is cured if the testator knew and still made the will, or condoned in writing.

**Art. 1035**: If the unworthy person is a child/descendant, their children take their place. But Art. 1035 does NOT apply to ascending heirs — there is no representation in the ascending line.

**Engine treatment**: Same as disinheritance — remove unworthy ascendant, redistribute among remaining ascendants, or re-evaluate scenario if none remain.

---

## Interactions

### With Surviving Spouse
- Ascendants' ½ is NOT affected by spouse's presence
- Spouse's share comes from FP (testate) or is a separate statutory fraction (intestate)
- See `legitime-surviving-spouse` analysis for full spouse interaction

### With Illegitimate Children
- In testate (Art. 896): IC get a flat ¼ of estate — NOT derived from ascendant's share
- In testate (Art. 899): when all three concur (ascendants + IC + spouse), fractions are pre-fixed: ½ + ¼ + ⅛ = ⅞, FP = ⅛
- No cap rule needed in Regime B (Art. 896 gives flat ¼ to IC, not per-child derived)

### With Adopted Children
- An adopted child's adoptive parents are "legitimate parents" for succession (RA 8552)
- If the adopter (parent) dies, the adoptive parents of the adopter inherit as grandparents if both adoptive parents of the decedent are dead — but this is the standard ascending line, not adoption-specific
- Key: if the decedent has an adopted child, that adopted child EXCLUDES ascendants (adopted child = legitimate child)

---

## Edge Cases

### 1. One Parent Dead, No Higher Ascendants

If father died before decedent, mother alive, no grandparents:
- Mother gets ALL of the ascendant ½ (Art. 890 ¶1)
- This is by far the most common real-world scenario

### 2. Both Parents Dead, Asymmetric Grandparents

Paternal grandfather alive. Maternal grandmother + maternal grandfather alive.
- All degree 2 → divide by line
- Paternal: ½ of share → 1 person → paternal grandfather gets ½
- Maternal: ½ of share → 2 persons → each gets ¼
- This creates unequal per-person amounts despite equal degree

### 3. Mixed-Degree Ascendants

Paternal grandfather (degree 2) + paternal great-grandmother (degree 3) + maternal grandfather (degree 2)
- Minimum degree = 2
- Only degree-2 ascendants qualify: paternal grandfather + maternal grandfather
- Different lines → ½ each
- Paternal great-grandmother excluded (degree 3 > 2)

### 4. Great-Grandparents Only

All parents and grandparents dead. Two paternal great-grandparents and one maternal great-grandparent survive.
- All degree 3 → eligible
- Paternal: 2 persons → ½ of share → ¼ each
- Maternal: 1 person → ½ of share → all

### 5. Ascendant of Both Lines

Theoretically possible in cases of consanguinity (e.g., if the decedent's parents were cousins, a great-grandparent could be an ancestor on both paternal and maternal sides). The engine should NOT double-count — a person is one heir regardless of how many lines they appear in. Assign them to the line that gives them the larger share, or treat them as belonging to both lines (split counting).

**Conservative approach**: Flag for manual review.

```
function check_dual_line_ascendant(ascendants: List<Heir>) -> Warning? {
    persons = set()
    for a in ascendants:
        if a.person_id in persons:
            return Warning("Ascendant {a.name} appears in both paternal and "
                          "maternal lines (consanguinity). Manual review required.")
        persons.add(a.person_id)
    return null
}
```

### 6. Disinherited Parent with Surviving Grandparents

Father disinherited. Mother dead. Paternal grandparents survive.
- Father is disqualified → removed from pool
- Mother is dead → removed from pool
- No parents qualify → fall to Art. 890 ¶2
- Paternal grandparents (degree 2): only paternal line → all to them
- **Note**: Even though father is disqualified, his parents CAN inherit (disinheritance is personal, Art. 972 non-representation rule doesn't block them because they inherit in their own right under Art. 890 ¶2, not by "representing" the father)

### 7. Reserva Troncal + Ascendant Legitime Overlap

An ascendant inherits both (a) their legitime share and (b) property subject to reserva troncal. The engine must track the reserva obligation separately — the ascendant receives the property but is obligated to preserve it for reservatarios.

### 8. Art. 903 — Father Only of Illegitimate Child

If the illegitimate child's filiation was proved only as to the father (mother unknown or deceased), the father alone inherits the ½ under Art. 903.

### 9. Art. 903 — Illegitimate Decedent's Parents with Illegitimate Grandchild

Illegitimate decedent has an illegitimate child of their own (an "illegitimate grandchild" of the original parents). Under Art. 903 ¶2, the parents get NOTHING because the decedent has a surviving child. The illegitimate child inherits under Art. 901.

---

## Test Implications

### Ascendant Division Tests

| # | Scenario | Ascendants | Total Share | Expected Distribution |
|---|----------|-----------|-------------|----------------------|
| 1 | Both parents alive | F, M | ₱5,000,000 | F: ₱2,500,000; M: ₱2,500,000 |
| 2 | Father only | F | ₱5,000,000 | F: ₱5,000,000 |
| 3 | Mother only | M | ₱5,000,000 | M: ₱5,000,000 |
| 4 | Both dead; PGF + MGM | PGF(deg 2, pat), MGM(deg 2, mat) | ₱5,000,000 | PGF: ₱2,500,000; MGM: ₱2,500,000 |
| 5 | Both dead; PGF + PGM + MGF | PGF, PGM (pat, deg 2), MGF (mat, deg 2) | ₱5,000,000 | PGF: ₱1,250,000; PGM: ₱1,250,000; MGF: ₱2,500,000 |
| 6 | Both dead; PGF (deg 2) + MGGM (deg 3) | PGF(pat, deg 2), MGGM(mat, deg 3) | ₱5,000,000 | PGF: ₱5,000,000; MGGM: ₱0 (nearer degree wins) |
| 7 | Both dead; only MGM (deg 2) | MGM(mat, deg 2) | ₱5,000,000 | MGM: ₱5,000,000 |
| 8 | Both dead; PGF + PGM (deg 2, paternal only) | PGF, PGM (pat, deg 2) | ₱5,000,000 | PGF: ₱2,500,000; PGM: ₱2,500,000 |
| 9 | Both dead; PGGF + MGGF (deg 3) | PGGF(pat, deg 3), MGGF(mat, deg 3) | ₱5,000,000 | PGGF: ₱2,500,000; MGGF: ₱2,500,000 |

### Concurrence with Other Heir Types (Testate)

| # | Scenario | E | Ascendant Share | Spouse Share | IC Share | FP |
|---|----------|---|----------------|-------------|---------|-----|
| 10 | T6: Both parents only | ₱10M | ₱5M (₱2.5M each) | — | — | ₱5M |
| 11 | T7: Both parents + spouse | ₱10M | ₱5M (₱2.5M each) | ₱2.5M | — | ₱2.5M |
| 12 | T7: Mother only + spouse | ₱10M | ₱5M (all to mother) | ₱2.5M | — | ₱2.5M |
| 13 | T8: Both parents + 3 IC | ₱12M | ₱6M (₱3M each) | — | ₱3M total (₱1M each) | ₱3M |
| 14 | T9: Both parents + 2 IC + spouse | ₱8M | ₱4M (₱2M each) | ₱1M | ₱2M total (₱1M each) | ₱1M |
| 15 | T9: Mother only + 1 IC + spouse | ₱8M | ₱4M (all to mother) | ₱1M | ₱2M | ₱1M |

### Concurrence with Other Heir Types (Intestate)

| # | Scenario | E | Ascendant Share | Spouse Share | IC Share |
|---|----------|---|----------------|-------------|---------|
| 16 | I5: Both parents only | ₱10M | ₱10M (₱5M each) | — | — |
| 17 | I5: Father only | ₱10M | ₱10M (all to father) | — | — |
| 18 | I6: Both parents + spouse | ₱10M | ₱5M (₱2.5M each) | ₱5M | — |
| 19 | I9: Both parents + 2 IC | ₱10M | ₱5M (₱2.5M each) | — | ₱5M (₱2.5M each) |
| 20 | I10: Both parents + 2 IC + spouse | ₱8M | ₱4M (₱2M each) | ₱2M | ₱2M (₱1M each) |

### Art. 903 (Illegitimate Decedent) Tests

| # | Scenario | E | Parents' Share | Spouse | Notes |
|---|----------|---|---------------|--------|-------|
| 21 | T14: Both parents of illegit. decedent, no other heirs | ₱10M | ₱5M (₱2.5M each) | — | Art. 903 ¶1 |
| 22 | T14: Father only of illegit. decedent | ₱10M | ₱5M (all to father) | — | Art. 903 ¶1 |
| 23 | T15: Both parents + spouse of illegit. decedent | ₱10M | ₱2.5M (₱1.25M each) | ₱2.5M | Art. 903 ¶3 |
| 24 | Illegit. decedent has own child → parents get 0 | ₱10M | ₱0 | — | Art. 903 ¶2 |
| 25 | Illegit. decedent has own illegitimate child → parents get 0 | ₱10M | ₱0 | — | Art. 903 ¶2 |

### Disinheritance Tests

| # | Scenario | Disinherited | Remaining | Expected |
|---|----------|-------------|-----------|----------|
| 26 | Father disinherited, mother alive | Father | Mother | Mother gets all ½ |
| 27 | Mother disinherited, father alive | Mother | Father | Father gets all ½ |
| 28 | Both parents disinherited, PGF + MGM alive | F, M | PGF, MGM | PGF ¼, MGM ¼ of estate |
| 29 | Both parents disinherited, no grandparents | F, M | (none) | Re-evaluate scenario: no ascendant heirs → shift to Regime C |

### Activation Gate Tests

| # | Scenario | Has Descendants? | Ascendants Receive? |
|---|----------|-----------------|---------------------|
| 30 | 1 legitimate child + parents | Yes | No — excluded by Art. 887(2) |
| 31 | 1 adopted child (RA 8552) + parents | Yes | No — adopted = legitimate |
| 32 | 1 illegitimate child only + parents | No legitimate descendants | Yes — IC don't exclude ascendants |
| 33 | Predeceased child with grandchildren + parents | Yes (by representation) | No — grandchildren represent child |
| 34 | All children renounced + parents | Depends | If all children AND their descendants renounced → Yes |

### Reserva Troncal Tests

| # | Scenario | Property Source | Inheriting Ascendant | Reserva? |
|---|----------|----------------|---------------------|----------|
| 35 | Property donated by PGF, inherited by mother | PGF (ascendant) | Mother | Yes — Art. 891 applies |
| 36 | Property purchased by decedent | N/A (not gratuitous) | Father | No — purchased property not subject |
| 37 | Property inherited from sibling | Sibling | Mother | Yes — Art. 891 includes siblings |

---

## Engine Pipeline Integration

The ascendant legitime computation integrates into the pipeline as follows:

```
Step 1: Classify heirs (compulsory-heirs-categories)
  → Identify all LEGITIMATE_ASCENDANT_GROUP members
  → For each, record: degree, line (paternal/maternal)

Step 1.5: Build Lines (representation-rights)
  → For DESCENDING line only (NOT ascending)
  → Check: if any legitimate descendant lines exist → EXCLUDE all ascendants

Step 2: Determine scenario (heir-concurrence-rules)
  → If descendants present: T1-T5 (Regime A) — ascendants get nothing
  → If no descendants, ascendants present: T6-T9 (Regime B)
  → If illegitimate decedent: T14-T15 (special)

Step 3: Compute legitimes (THIS + legitime-table)
  → Ascendant collective = ½ (Art. 889) or ¼ (Art. 903 ¶3)
  → Call divide_among_ascendants() to get per-person amounts

Step 3.5: Check reserva troncal (THIS)
  → For each ascendant receiving property, check Art. 891
  → Flag any reserva troncal obligations in output

Step 4-8: (Downstream — free portion, distribution, narrative)
```

---

## Narrative Templates

### Template: Ascendant as Sole Compulsory Heirs (T6)

> **[Name] (legitimate [parent/grandparent])** receives **₱X**.
> As a legitimate [parent/ascendant] of the decedent, [Name] is a compulsory heir under Art. 887(2) of the Civil Code. Since the decedent left no legitimate children or descendants, the legitimate [parents/ascendants] are entitled to a collective legitime of one-half (½) of the estate under Art. 889. [Division detail per Art. 890]. [Name]'s share is ₱X.

### Template: Ascendant with Spouse (T7)

> **[Name] (legitimate [parent])** receives **₱X**.
> Under Art. 889, the legitimate [parents/ascendants]' collective legitime is one-half (½) of the estate (₱Y). Under Art. 890, [division rule]. [Name]'s share from the ascendant legitime is ₱X. The surviving spouse receives a separate legitime of one-fourth (¼) of the estate under Art. 893.

### Template: Ascendant with IC and Spouse (T9)

> **[Name] (legitimate [parent])** receives **₱X**.
> Under Art. 899, when the decedent leaves legitimate ascendants, illegitimate children, and a surviving spouse, the ascendants receive one-half (½) of the estate, the illegitimate children one-fourth (¼), and the surviving spouse one-eighth (⅛). [Name]'s share of the ascendant collective is ₱X per Art. 890.

### Template: Parent of Illegitimate Decedent (T14)

> **[Name] ([father/mother] of the decedent)** receives **₱X**.
> The decedent was an illegitimate child. Under Art. 903 of the Civil Code, when an illegitimate child dies leaving no descendants, surviving spouse, or own illegitimate children, the parents' legitime is one-half (½) of the estate. [Division between parents]. [Name] receives ₱X.

### Template: Reserva Troncal Note

> **Note**: [Property] inherited by [Ascendant name] is subject to reserva troncal under Art. 891 of the Civil Code. This property was originally acquired by the decedent through [donation/inheritance] from [source person], [a/an] [relationship] of the decedent. [Ascendant name] is obligated to reserve this property for qualifying relatives within the third degree of the decedent belonging to the [paternal/maternal] line.

---

*Analysis based on Civil Code Arts. 887-891, 903, 920, 972, 985-987, 991, 997, 1000, 1032-1035; Family Code Art. 176; RA 8552 Sec. 17. Cross-references: heir-concurrence-rules (activation gate), legitime-table (T6-T9, T14-T15), legitime-surviving-spouse (concurrence), representation-rights (Art. 972 no ascending representation).*
