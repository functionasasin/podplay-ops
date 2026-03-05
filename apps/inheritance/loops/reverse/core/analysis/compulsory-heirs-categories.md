# Compulsory Heirs Categories

**Aspect**: compulsory-heirs-categories
**Wave**: 2 (Heir Classification Rules)
**Primary Legal Basis**: Art. 887 (Civil Code), Art. 176 (Family Code), Art. 179 (Family Code), RA 8552 Sec. 17

---

## Legal Basis

### Art. 887 (Civil Code) — The Enumeration

> The following are compulsory heirs:
> (1) Legitimate children and descendants, with respect to their legitimate parents and ascendants;
> (2) In default of the foregoing, legitimate parents and ascendants, with respect to their legitimate children and descendants;
> (3) The widow or widower;
> (4) Acknowledged natural children, and natural children by legal fiction;
> (5) Other illegitimate children referred to in Article 287.
>
> Compulsory heirs mentioned in Nos. 3, 4, and 5 are not excluded by those in Nos. 1 and 2; neither do they exclude one another.
>
> In all cases of illegitimate children, their filiation must be duly proved.

### Art. 176 (Family Code) — Unified Illegitimate Classification

> Illegitimate children shall use the surname and shall be under the parental authority of their mother... The legitime of each illegitimate child shall consist of one-half of the legitime of a legitimate child.

**Critical**: Art. 176 abolished the Civil Code's three-tier classification of illegitimate children (acknowledged natural, natural by legal fiction, other illegitimate). Under the Family Code, ALL illegitimate children have a **single uniform status** and a **single legitime fraction**: ½ of a legitimate child's legitime.

### Art. 179 (Family Code) — Legitimated Children

> Legitimated children shall enjoy the same rights as legitimate children.

### RA 8552, Sec. 17 — Adopted Children

> The adoptee shall be considered the legitimate son/daughter of the adopter(s) for all intents and purposes and as such is entitled to all the rights and obligations provided by law to legitimate sons/daughters born to them without discrimination of any kind.

---

## Rule (Pseudocode)

```
enum HeirCategory {
  LEGITIMATE_CHILD,        // biological legitimate child of decedent
  LEGITIMATED_CHILD,       // illegitimate child legitimated by subsequent marriage (FC Art. 177-179)
  ADOPTED_CHILD,           // child adopted under RA 8552
  ILLEGITIMATE_CHILD,      // child born outside valid marriage (FC Art. 165, 176)
  SURVIVING_SPOUSE,        // widow or widower of decedent
  LEGITIMATE_PARENT,       // legitimate father or mother of decedent
  LEGITIMATE_ASCENDANT,    // grandparent or higher, in the legitimate line
}

// For computation purposes, three categories are equivalent:
function effective_category(heir: Heir) -> EffectiveCategory {
  match heir.category {
    LEGITIMATE_CHILD     => LEGITIMATE_CHILD_GROUP,
    LEGITIMATED_CHILD    => LEGITIMATE_CHILD_GROUP,  // FC Art. 179
    ADOPTED_CHILD        => LEGITIMATE_CHILD_GROUP,  // RA 8552 Sec. 17
    ILLEGITIMATE_CHILD   => ILLEGITIMATE_CHILD_GROUP,
    SURVIVING_SPOUSE     => SURVIVING_SPOUSE_GROUP,
    LEGITIMATE_PARENT    => LEGITIMATE_ASCENDANT_GROUP,
    LEGITIMATE_ASCENDANT => LEGITIMATE_ASCENDANT_GROUP,
  }
}

enum EffectiveCategory {
  LEGITIMATE_CHILD_GROUP,      // Primary compulsory heirs (Art. 887(1))
  ILLEGITIMATE_CHILD_GROUP,    // Concurring compulsory heirs (Art. 887(4-5), FC 176)
  SURVIVING_SPOUSE_GROUP,      // Concurring compulsory heir (Art. 887(3))
  LEGITIMATE_ASCENDANT_GROUP,  // Secondary compulsory heirs (Art. 887(2))
}
```

### Classification Decision Tree

```
function classify_heir(person, decedent) -> HeirCategory | null {

  // 1. Is this the surviving spouse?
  if person is legally married to decedent at time of death:
    if legal_separation exists AND decedent was the innocent spouse:
      return null  // Art. 1002: guilty spouse loses inheritance rights
    return SURVIVING_SPOUSE

  // 2. Is this a child of the decedent?
  if person is child of decedent:

    // 2a. Adopted child?
    if person was adopted by decedent under RA 8552:
      if adoption has been judicially rescinded before death:
        return null  // RA 8552 Sec. 20: rescission extinguishes succession rights
      return ADOPTED_CHILD

    // 2b. Legitimate child?
    if person was conceived or born during valid marriage of decedent (FC Art. 164):
      return LEGITIMATE_CHILD

    // 2c. Legitimated child?
    if person was born outside wedlock BUT parents subsequently married (FC Art. 177-178):
      return LEGITIMATED_CHILD  // equivalent to LEGITIMATE_CHILD per FC Art. 179

    // 2d. Illegitimate child (default for children born outside marriage)
    if filiation is duly proved (FC Art. 172, 175, 176):
      return ILLEGITIMATE_CHILD
    else:
      return null  // Art. 887: "their filiation must be duly proved"

  // 3. Is this a descendant (grandchild or lower) of the decedent?
  // (Only relevant through right of representation — see representation-rights aspect)
  if person is legitimate descendant of a predeceased/incapacitated/disinherited child of decedent:
    return LEGITIMATE_CHILD  // inherits by representation (Art. 970)
  if person is descendant of a predeceased illegitimate child:
    return ILLEGITIMATE_CHILD  // Art. 902: rights transmitted to descendants

  // 4. Is this a parent or ascendant of the decedent?
  if person is legitimate parent of decedent:
    return LEGITIMATE_PARENT
  if person is legitimate ascendant of decedent (grandparent+):
    // Only if no closer ascendant survives (Art. 890)
    if no closer legitimate ascendant survives:
      return LEGITIMATE_ASCENDANT
    else:
      return null  // nearer ascendant excludes more remote

  // 5. Not a compulsory heir
  return null
}
```

### Is-Compulsory Check

```
function is_compulsory_heir(heir: Heir, all_heirs: List<Heir>) -> bool {
  category = effective_category(heir)

  match category {
    LEGITIMATE_CHILD_GROUP:
      return true  // always compulsory (Art. 887(1))

    LEGITIMATE_ASCENDANT_GROUP:
      // Only compulsory "in default of" legitimate children/descendants (Art. 887(2))
      has_legitimate_descendants = any(h for h in all_heirs
        where effective_category(h) == LEGITIMATE_CHILD_GROUP)
      return NOT has_legitimate_descendants

    SURVIVING_SPOUSE_GROUP:
      return true  // always compulsory (Art. 887(3))

    ILLEGITIMATE_CHILD_GROUP:
      return true  // always compulsory (Art. 887(4-5)); "not excluded by those in Nos. 1 and 2"
  }
}
```

---

## The Four Groups: Summary Table

| # | EffectiveCategory | Constituent Raw Categories | Compulsory? | Excluded By | Art. 887 Reference |
|---|-------------------|---------------------------|-------------|-------------|-------------------|
| 1 | LEGITIMATE_CHILD_GROUP | Legitimate child, Legitimated child, Adopted child | Always | Nobody | (1) |
| 2 | LEGITIMATE_ASCENDANT_GROUP | Legitimate parent, Legitimate grandparent+ | Only if no Group 1 heirs | Group 1 | (2) |
| 3 | SURVIVING_SPOUSE_GROUP | Widow/Widower | Always | Nobody | (3) |
| 4 | ILLEGITIMATE_CHILD_GROUP | Illegitimate child | Always | Nobody | (4)-(5) |

### Key Concurrence Rule (Art. 887 ¶2)

> "Compulsory heirs mentioned in Nos. 3, 4, and 5 are not excluded by those in Nos. 1 and 2; neither do they exclude one another."

This means:
- Groups 3 and 4 **always** participate regardless of who else survives
- Groups 1 and 2 are **mutually exclusive** (Group 1 excludes Group 2)
- Groups 3 and 4 concur with either Group 1 or Group 2

---

## Computation Impact

Each category's share depends on which combination of groups is present. The full legitime table is deferred to the **legitime-table** aspect, but the category determines which row of that table applies:

| Surviving Groups | Scenario | Key Articles |
|-----------------|----------|-------------|
| 1 only | Legitimate children alone | Art. 888 |
| 1 + 3 | Legitimate children + spouse | Arts. 888, 892 |
| 1 + 4 | Legitimate children + illegitimate children | Arts. 888, 895 |
| 1 + 3 + 4 | Legitimate children + spouse + illegitimate children | Arts. 888, 892, 895, 897 |
| 2 only | Legitimate ascendants alone | Arts. 889, 890 |
| 2 + 3 | Legitimate ascendants + spouse | Arts. 889, 893 |
| 2 + 4 | Legitimate ascendants + illegitimate children | Arts. 889, 896 |
| 2 + 3 + 4 | Ascendants + spouse + illegitimate children | Arts. 889, 899 |
| 3 + 4 | Spouse + illegitimate children (no legitimate heirs) | Art. 894 |
| 4 only | Illegitimate children alone | Art. 901 |
| 3 only | Surviving spouse alone | Art. 900 |
| Neither 1-4 | No compulsory heirs | Free disposal (Art. 842) |

**Note**: Groups 1 and 2 never appear simultaneously.

---

## Interactions

### Group 1 (Legitimate Children) Interactions

- **Excludes Group 2**: If ANY legitimate child/descendant survives, legitimate parents/ascendants receive NO legitime (Art. 887(2): "in default of the foregoing")
- **Concurs with Group 3 (Spouse)**: Spouse gets share equal to one child's (Art. 892), charged to free portion
- **Concurs with Group 4 (Illegitimate)**: Each illegitimate child gets ½ of each legitimate child's legitime (Art. 895/FC 176), charged to free portion
- **Within Group 1**: All members share the collective legitime (½ of estate) equally, regardless of whether they are biological, legitimated, or adopted

### Group 2 (Legitimate Ascendants) Interactions

- **Excluded by Group 1**: Only inherits as compulsory heir when there are NO legitimate children/descendants
- **Within Group 2**: Parents split equally (Art. 890 ¶1). If one parent dead, survivor takes all. If no parents, nearest ascendants inherit; if from different lines but same degree, split ½ paternal / ½ maternal (Art. 890 ¶2)
- **Concurs with Group 3**: Spouse gets ¼ (Art. 893)
- **Concurs with Group 4**: Illegitimate children get ¼ total (Art. 896)
- **Concurs with Groups 3 + 4**: Ascendants ½, illegitimate ¼, spouse ⅛ (Art. 899)

### Group 3 (Surviving Spouse) Interactions

- **Never excluded**: Always gets a share
- **Share varies by concurrence**: ¼ with 1 child (Art. 892), equal to one child with 2+ children (Art. 892), ¼ with ascendants (Art. 893), ⅛ with ascendants + illegitimate (Art. 899), ⅓ with illegitimate only (Art. 894), ½ alone (Art. 900)
- **Articulo mortis exception**: If married at point of death and decedent dies within 3 months → only ⅓ as sole heir, unless cohabitation > 5 years (Art. 900 ¶2)
- **Legal separation**: Guilty spouse loses all inheritance rights (Art. 1002)

### Group 4 (Illegitimate Children) Interactions

- **Never excluded**: Always gets a share, regardless of Groups 1 or 2
- **Share varies**: ½ of legitimate child's share when concurring with Group 1 (Art. 895/FC 176); ¼ of estate with Group 2 (Art. 896); ⅓ with spouse only (Art. 894); ½ of estate alone (Art. 901)
- **Cap rule (Art. 895 ¶3)**: Total illegitimate children's legitime cannot exceed the free portion; spouse's legitime must be satisfied first
- **Iron Curtain Rule (Art. 992)**: Illegitimate children cannot inherit ab intestato from the legitimate relatives of their parents (only relevant in intestate from people other than their parent)
- **Filiation requirement (Art. 887 ¶3)**: Must be duly proved per FC Arts. 172, 175

---

## Edge Cases

### 1. Adopted Child with Rescinded Adoption
- **Rule**: RA 8552 Sec. 20 — if adoption is judicially rescinded before decedent's death, the child loses succession rights from the adopter
- **Engine logic**: Check `adoption_rescission_date` vs `date_of_death`. If rescission before death → not a compulsory heir of the adopter
- **Vested rights preserved**: Any inheritance received before rescission is not returned

### 2. Legitimated Child — Timing
- **Rule**: FC Art. 180 — effects of legitimation retroact to the time of birth
- **Engine logic**: If parents married before decedent's death, the legitimated child is treated as legitimate from birth, regardless of when the marriage occurred
- **Limitation**: FC Art. 177 — only children whose parents had no impediment to marry at time of conception can be legitimated (as amended by RA 9858 removing age impediment)

### 3. Posthumous Child
- **Rule**: Art. 1025 — a child already conceived at time of death is capable of succeeding, provided it is born alive per Art. 41
- **Engine logic**: If child was conceived before death and born alive, classify as legitimate child (if parents married) or illegitimate child (if not)

### 4. Legal Separation and Guilty Spouse
- **Rule**: Art. 892 ¶2 — "In case of a legal separation, the surviving spouse may inherit if it was the deceased who had given cause for the same." Art. 1002 — "In case of a legal separation, if the surviving spouse gave cause for the separation, he or she shall not have any of the rights granted"
- **Engine logic**: If `legal_separation == true AND spouse_is_guilty == true` → spouse gets NOTHING. If `spouse_is_innocent == true` → spouse inherits normally.

### 5. Unproved Filiation of Illegitimate Child
- **Rule**: Art. 887 ¶3 — "In all cases of illegitimate children, their filiation must be duly proved"
- **Engine logic**: The engine should require a `filiation_proved: boolean` field for illegitimate children. If `false`, they are NOT compulsory heirs.

### 6. Incapacity and Unworthiness (Art. 1032)
- **Rule**: Persons who committed certain acts (attempt on testator's life, fraud, etc.) are incapable of succeeding by unworthiness
- **Engine logic**: Check `is_unworthy` flag. If `true`, the heir is excluded. However, their children may still inherit their legitime (Art. 1035).
- **Condoned unworthiness (Art. 1033)**: If testator knew of the cause and still included them in the will, or condoned in writing, unworthiness is nullified.

### 7. Parents of an Illegitimate Child (Art. 903)
- When the decedent IS the illegitimate child who dies:
  - If decedent leaves no descendants, no spouse, no children → parents get ½ (Art. 903 ¶1)
  - If only spouse survives with parents → parents ¼, spouse ¼ (Art. 903 ¶2)
  - If decedent leaves children (legitimate or illegitimate) → parents get NOTHING (Art. 903 ¶2)

### 8. Spouse of Adopted Child's Biological Parent
- **Rule**: RA 8552 Sec. 16 — if biological parent is the spouse of the adopter, biological ties are NOT severed
- **Engine logic**: In stepparent adoption, the child retains inheritance rights from both the biological parent (who is the adopter's spouse) AND the adopter

---

## Test Implications

The following test cases are needed for heir classification:

1. **Basic legitimate child**: Married parents → child classified as LEGITIMATE_CHILD
2. **Legitimated child**: Parents marry after birth → classified as LEGITIMATED_CHILD → effective_category = LEGITIMATE_CHILD_GROUP
3. **Adopted child**: Valid adoption under RA 8552 → classified as ADOPTED_CHILD → effective_category = LEGITIMATE_CHILD_GROUP
4. **Adopted child with rescinded adoption**: → NOT a compulsory heir
5. **Illegitimate child with proved filiation**: → ILLEGITIMATE_CHILD
6. **Illegitimate child without proved filiation**: → NOT a compulsory heir
7. **Posthumous legitimate child**: Conceived before death, born alive → LEGITIMATE_CHILD
8. **Surviving spouse, no legal separation**: → SURVIVING_SPOUSE
9. **Guilty surviving spouse (legal separation)**: → NOT a compulsory heir (excluded)
10. **Innocent surviving spouse (legal separation)**: → SURVIVING_SPOUSE (still inherits)
11. **Legitimate parents when legitimate children exist**: → NOT compulsory (excluded by Group 1)
12. **Legitimate parents when no legitimate children exist**: → LEGITIMATE_PARENT (compulsory)
13. **Grandparents when parents are dead and no children exist**: → LEGITIMATE_ASCENDANT
14. **Unworthy heir**: → Excluded, but their children may inherit their legitime (Art. 1035)
15. **Stepparent adoption (RA 8552 Sec. 16)**: → Child inherits from both biological parent and adopter
16. **Mixed group: legitimate + adopted + illegitimate**: All three properly classified and get correct effective categories

---

## Engine Data Model Impact

```
struct Heir {
  id: string,
  name: string,
  raw_category: HeirCategory,          // LEGITIMATE_CHILD | LEGITIMATED_CHILD | ADOPTED_CHILD | ILLEGITIMATE_CHILD | SURVIVING_SPOUSE | LEGITIMATE_PARENT | LEGITIMATE_ASCENDANT
  effective_category: EffectiveCategory, // computed from raw_category
  is_alive: bool,
  is_compulsory: bool,                  // computed based on who else survives
  filiation_proved: bool,               // required for illegitimate children
  is_unworthy: bool,                    // Art. 1032
  unworthiness_condoned: bool,          // Art. 1033
  is_disinherited: bool,               // Arts. 915-923
  disinheritance_valid: bool,          // whether the cause is legally valid
  adoption_rescinded: bool,             // RA 8552 Sec. 20
  legal_separation_guilty: bool,        // for spouses, Art. 1002
  articulo_mortis_marriage: bool,       // Art. 900 ¶2
  cohabitation_over_5_years: bool,      // exception to articulo mortis
  children: List<Heir>,                 // for representation purposes
  degree_from_decedent: int,            // for ascendants: 1 = parent, 2 = grandparent
  line: PaternalOrMaternal,             // for ascendants: which side
}
```

---

*Analysis based on Civil Code Art. 887, Family Code Arts. 163-182, RA 8552 Secs. 16-20.*
