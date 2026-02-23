# Disinheritance Rules

**Aspect**: disinheritance-rules
**Wave**: 4 (Distribution Rules)
**Primary Legal Basis**: Arts. 915-923 (Civil Code)
**Depends On**: compulsory-heirs-categories, heir-concurrence-rules, representation-rights, testate-institution, testate-validation, legitime-table

---

## Overview

Disinheritance is the only mechanism in Philippine succession law by which a testator can **legally exclude a compulsory heir from their legitime**. It is strictly regulated: the cause must be real, expressly stated in the will, legally recognized, and not subsequently waived by reconciliation.

This analysis covers:
1. The 4 validity requirements (Arts. 915-917, 922)
2. Complete grounds for each heir class (Arts. 919-921) — 22 grounds total
3. Effect of **valid** disinheritance on the estate computation (Art. 923 representation)
4. Effect of **invalid** disinheritance (Art. 918)
5. Reconciliation (Art. 922) and timing
6. Art. 923 scope limitation: only children/descendants get representation
7. Engine computation pipeline for disinheritance scenarios

**Relationship to testate-validation**: The testate-validation analysis documented the disinheritance **validity check** as Step 2 of the validation pipeline and defined the `Disinheritance` struct and `DisinheritanceCause` enum (22 values). This analysis zooms in on the **substantive rules**: what each ground means, how Art. 923 representation works computationally, and what engine states result from valid vs invalid disinheritance.

---

## Legal Basis

### Arts. 915-923 — Full Text

| Article | Text |
|---------|------|
| **Art. 915** | "A compulsory heir may, in consequence of disinheritance, be deprived of his legitime, for causes expressly stated by law." |
| **Art. 916** | "Disinheritance can be effected only through a will wherein the legal cause therefor shall be specified." |
| **Art. 917** | "The burden of proving the truth of the cause for disinheritance shall rest upon the other heirs of the testator, if the disinherited heir should deny it." |
| **Art. 918** | "Disinheritance without a specification of the cause, or for a cause the truth of which, if contradicted, is not proved, or which is not one of those set forth in this Code, shall annul the institution of heirs insofar as it may prejudice the person disinherited; but the devises and legacies and other testamentary dispositions shall be valid to such extent as will not impair the legitime." |
| **Art. 919** | Eight grounds for disinheriting children and descendants (legitimate and illegitimate). See table below. |
| **Art. 920** | Eight grounds for disinheriting parents and ascendants (legitimate and illegitimate). See table below. |
| **Art. 921** | Six grounds for disinheriting a spouse. See table below. |
| **Art. 922** | "A subsequent reconciliation between the offender and the offended person deprives the latter of the right to disinherit, and renders ineffectual any disinheritance that may have been made." |
| **Art. 923** | "The children and descendants of the person disinherited shall take his or her place and shall preserve the rights of compulsory heirs with respect to the legitime; but the disinherited parent shall not have the usufruct or administration of the property which constitutes the legitime." |

---

## Section 1: Validity Requirements

For a disinheritance to be **legally effective** (valid), ALL four conditions must be satisfied:

| # | Requirement | Legal Source | Engine Input |
|---|-------------|-------------|-------------|
| 1 | **In a will** — must appear in a formally valid will | Art. 916 | `disinheritance.in_will == true` |
| 2 | **Cause specified** — the legal cause must be stated in the will | Art. 916 | `disinheritance.cause_code != null` |
| 3 | **Cause proved** — if denied by the disinherited heir, other heirs must prove the cause | Art. 917 | `disinheritance.cause_proven == true` (or unchallenged) |
| 4 | **No reconciliation** — no subsequent reconciliation between testator and disinherited heir | Art. 922 | `disinheritance.reconciliation_occurred == false` |

**Critical**: PARTIAL disinheritance is NOT allowed in Philippine law. A compulsory heir is either fully disinherited or not disinherited at all. The engine must reject inputs that attempt to give a disinherited heir a partial share.

```
VALIDITY_CHECK(disinheritance: Disinheritance) → DisinheritanceStatus

  IF disinheritance.in_will == false:
    RETURN INVALID (reason: "NOT_IN_WILL")

  IF disinheritance.cause_code == null OR cause_code == UNSPECIFIED:
    RETURN INVALID (reason: "NO_CAUSE_SPECIFIED")

  IF NOT is_valid_cause_for_heir_type(disinheritance.cause_code, disinheritance.heir.category):
    RETURN INVALID (reason: "CAUSE_NOT_IN_CODE")

  IF disinheritance.cause_proven == false:  // challenged and unproved
    RETURN INVALID (reason: "CAUSE_NOT_PROVED")

  IF disinheritance.reconciliation_occurred == true:
    RETURN INVALID (reason: "RECONCILIATION_OCCURRED")

  RETURN VALID
```

```
VALID_CAUSE_MATRIX:
  LEGITIMATE_CHILD_GROUP    → causes from Art. 919 (codes C1-C8)
  ILLEGITIMATE_CHILD_GROUP  → causes from Art. 919 (codes C1-C8)  [Art. 919: "legitimate as well as illegitimate"]
  LEGITIMATE_ASCENDANT_GROUP → causes from Art. 920 (codes A1-A8)
  SURVIVING_SPOUSE_GROUP    → causes from Art. 921 (codes S1-S6)
```

---

## Section 2: Complete Grounds (22 Total)

### Art. 919 — Children and Descendants (8 Grounds, applies to Legitimate AND Illegitimate)

| Code | Ground | Key Elements | Engine Notes |
|------|--------|-------------|-------------|
| C1 | Found guilty of attempt against life of: testator, testator's spouse, descendants, or ascendants | Criminal conviction or judicial finding required | Requires `conviction_record` input |
| C2 | Accused testator of a crime with imprisonment ≥ 6 years, and accusation found groundless | Accusation filed + found groundless (acquittal or dismissal for lack of merit) | Both elements must be true |
| C3 | Convicted of adultery or concubinage with testator's spouse | Criminal conviction specifically for adultery/concubinage | Requires final judgment |
| C4 | By fraud, violence, intimidation, or undue influence caused testator to make or change a will | Vitiates testator's consent in making the will | Any of the four modes; engine accepts boolean |
| C5 | Refusal without justifiable cause to support the parent/ascendant who disinherits | Unjustified refusal of support obligation | Factual determination |
| C6 | Maltreatment of testator by word or deed | Physical or verbal; no conviction required | Factual determination |
| C7 | Leads a dishonorable or disgraceful life | Pattern of conduct (not a single act) | Factual determination; engine accepts boolean |
| C8 | Convicted of a crime with penalty of civil interdiction | Art. 34 Revised Penal Code: civil interdiction penalties | Requires conviction with civil interdiction component |

### Art. 920 — Parents and Ascendants (8 Grounds, applies to Legitimate AND Illegitimate)

| Code | Ground | Key Elements | Engine Notes |
|------|--------|-------------|-------------|
| A1 | Abandoned children OR induced daughters to corrupt/immoral life OR attempted against their virtue | Three distinct triggers under one provision | Any of the three modes; engine accepts boolean |
| A2 | Convicted of attempt against life of: testator, testator's spouse, descendants, or ascendants | Criminal conviction or judicial finding | Requires `conviction_record` input |
| A3 | Accused testator of a crime with imprisonment ≥ 6 years, and accusation found false | Accusation + found false (not merely groundless — "false" implies bad faith) | Slightly stronger threshold than C2 |
| A4 | Convicted of adultery or concubinage with testator's spouse | Criminal conviction | Requires final judgment |
| A5 | By fraud, violence, intimidation, or undue influence caused testator to make or change a will | Vitiates testator's consent | Any of the four modes |
| A6 | Loss of parental authority for causes specified in the Code | Family Code Arts. 223-232 grounds for loss of parental authority | Requires judicial decree of loss |
| A7 | Refusal to support children or descendants without justifiable cause | Unjustified refusal of support obligation | Factual determination |
| A8 | Attempt by one parent against the life of the other — UNLESS reconciliation between parents | Specific inter-spousal violence; built-in reconciliation carve-out within the ground itself | Built-in sub-exception: if the two parents reconciled, the ground does NOT apply (different from Art. 922's general reconciliation with the testator) |

**Note on A8**: The "unless there has been a reconciliation between them" refers to reconciliation between the two parents — not between the parent and the testator-child. This is DIFFERENT from Art. 922's reconciliation (which is between the testator and the disinherited heir).

### Art. 921 — Spouse (6 Grounds)

| Code | Ground | Key Elements | Engine Notes |
|------|--------|-------------|-------------|
| S1 | Convicted of attempt against life of: testator, testator's descendants, or testator's ascendants | Criminal conviction (note: spouse's own relatives NOT included, unlike Art. 919/920) | Requires conviction |
| S2 | Accused testator of crime with imprisonment ≥ 6 years, accusation found false | Same structure as A3 (false, not merely groundless) | Both elements required |
| S3 | By fraud, violence, intimidation, or undue influence caused testator to make or change a will | Vitiates testator's consent | Any of the four modes |
| S4 | Gave cause for legal separation | Art. 55 Family Code grounds (adultery, concubinage, physical violence, etc.) | Requires judicial finding OR factual stipulation |
| S5 | Gave grounds for loss of parental authority | Family Code grounds | Requires factual basis |
| S6 | Unjustifiable refusal to support the children or the other spouse | Failure of spousal/parental support duty | Factual determination |

---

## Section 3: Effect of VALID Disinheritance

### 3.1 Primary Effect — Exclusion from Legitime and All Inheritance

A validly disinherited compulsory heir:
- **Loses all inheritance rights** — both legitime and any free-portion share
- Is **completely removed** from the estate as a recipient
- **Cannot receive ANYTHING** — not even a voluntary legacy from the same will that disinherits them (the will can only disinherit; it cannot simultaneously give and disinherit)

```
APPLY_VALID_DISINHERITANCE(heir: Heir, family_tree: FamilyTree) → FamilyTree:

  // Remove disinherited heir from active heir pool
  family_tree.remove_as_heir(heir)
  heir.disinherited = true
  heir.disinheritance_valid = true

  // Trigger Art. 923 representation if applicable (see Section 3.2)
  representatives = get_art923_representatives(heir, family_tree)
  FOR rep IN representatives:
    family_tree.add_heir(rep, basis="ART_923_REPRESENTATION")

  RETURN family_tree
```

### 3.2 Art. 923 Representation — Scope and Computation

**Art. 923 text**: "The children and descendants of the person disinherited shall take his or her place and shall preserve the rights of compulsory heirs with respect to the legitime; but the disinherited parent shall not have the usufruct or administration of the property which constitutes the legitime."

#### Scope Limitation — Art. 923 Applies ONLY to Disinherited Children/Descendants

This is the most critical scope rule. Art. 923 uses the phrase "the children and descendants of the person disinherited" — but WHO can actually exercise this representation right depends on whether those representatives qualify as compulsory heirs in relation to the DECEDENT:

| Disinherited Heir Type | Their Children/Descendants | Art. 923 Applies? | Reason |
|------------------------|---------------------------|-------------------|--------|
| Child/Descendant (LC or IC) | Grandchildren of decedent | **YES** | Grandchildren are direct descendants of decedent; they qualify as representatives with compulsory heir rights |
| Parent/Ascendant (Father, Mother) | Testator's siblings | **NO** — siblings are NOT compulsory heirs in testate | Testator's siblings have no compulsory heir status; Art. 923 does not extend to them |
| Spouse | N/A (spouse has no descendants who represent the spouse's share) | **NO** | No representation mechanism for spouse's share; also no Art. 923 language for spouse |

**Practical consequence**: When an ascendant or spouse is disinherited, their share simply does not go to any representative. The estate is recalculated under the applicable testate or intestate scenario **as if that heir did not exist**, which may elevate the remaining compulsory heirs' shares or free portion.

#### Computation Rules Under Art. 923

When Art. 923 applies (disinherited child/descendant has surviving descendants):

1. **Line preserved**: The disinherited heir's LINE still exists in the headcount for legitime computation. The legitimate children's collective legitime (½ of estate) is computed based on the number of LINES (not individuals). The disinherited heir's line is filled by their representatives.

2. **Per stirpes distribution** (Art. 974 via Art. 923): Representatives collectively receive exactly what the disinherited heir WOULD HAVE received. Multiple representatives split that amount equally among themselves.

3. **Usufruct/administration restriction**: The disinherited parent (the actual disinherited child of the testator) has NO usufruct over or administration of the property that constitutes the representatives' legitime. Engine must flag this as a **guardianship/administration note** in the narrative.

4. **Capacity of representatives** (Art. 973): Each representative must independently qualify to succeed the decedent (must be alive, not unworthy, not incapacitated).

```
GET_ART923_REPRESENTATIVES(disinherited_heir: Heir, family_tree: FamilyTree) → List[Heir]:

  // Art. 923 only applies if disinherited heir is a child/descendant
  IF disinherited_heir.category NOT IN [LEGITIMATE_CHILD_GROUP, ILLEGITIMATE_CHILD_GROUP]:
    RETURN []  // no representation for disinherited ascendants or spouse

  // Find all surviving descendants of the disinherited heir
  // who are alive and capable of succeeding the decedent (Art. 973)
  candidates = family_tree.get_living_descendants(disinherited_heir)
  // Filter: must be capable of succeeding DECEDENT (not just the disinherited heir)
  representatives = [c FOR c IN candidates IF is_capable_to_succeed_decedent(c, decedent)]

  IF representatives is empty:
    RETURN []  // disinherited heir simply excluded; line vanishes

  // Only use NEAREST degree of descendants (grandchildren before great-grandchildren,
  // unless grandchildren also predecease, then great-grandchildren represent)
  // This is recursive: closest surviving descendants form the first-level representatives;
  // if they renounce or are unworthy, their descendants can represent them in turn.
  nearest = get_nearest_capable_representatives(representatives)

  RETURN nearest
```

#### Line Counting for Legitime Headcount

When Art. 923 representation occurs, the line still counts as one "child" for headcount purposes:

```
COMPUTE_LEGITIMATE_LINES(family_tree: FamilyTree) → List[Line]:
  lines = []
  FOR child IN family_tree.get_children_of_decedent():
    IF child.alive AND NOT child.disinherited_valid:
      lines.append(Line(representative=child, size=1))
    ELSE IF child.disinherited_valid:
      reps = GET_ART923_REPRESENTATIVES(child, family_tree)
      IF reps NOT empty:
        lines.append(Line(representatives=reps, size=1))
        // Line still counts as 1 for headcount; representatives share that line
      // If no reps: line vanishes, not counted
    ELSE IF child.predeceased OR child.incapacitated:
      reps = GET_REPRESENTATION_REPS(child, family_tree)  // Art. 970-975
      IF reps NOT empty:
        lines.append(Line(representatives=reps, size=1))
  RETURN lines
```

---

## Section 4: Effect of INVALID Disinheritance (Art. 918)

### Art. 918 Effect — Partial Annulment (NOT Total Annulment)

Invalid disinheritance triggers Art. 918, NOT Art. 854 (preterition). The distinction is critical:

| | **Art. 854 (Preterition)** | **Art. 918 (Invalid Disinheritance)** |
|---|---|---|
| **Trigger** | Total omission — heir not mentioned at all | Heir disinherited but without valid grounds or procedural compliance |
| **Effect on institution** | TOTAL annulment — entire institution void | PARTIAL annulment — void only insofar as it prejudices the reinstated heir |
| **Other dispositions** | Legacies/devises preserved if not inofficious | ALL devises, legacies, and other testamentary dispositions preserved if not inofficious |
| **Resulting distribution** | Intestate for the annulled institution portion | Testate distribution continues with reinstated heir; institution reduced as needed |

### Art. 918 Algorithm

```
APPLY_INVALID_DISINHERITANCE(
    heir: Heir,
    family_tree: FamilyTree,
    will: Will,
    net_estate: Money
) → (FamilyTree, Will):

  // Step 1: Reinstate the heir as a fully active compulsory heir
  heir.disinherited = false
  heir.disinherited_valid = false
  family_tree.add_back_as_heir(heir)

  // Step 2: Recompute the succession scenario with reinstated heir
  new_scenario = determine_scenario(family_tree)
  new_legitimes = compute_all_legitimes(net_estate, new_scenario, family_tree)

  // Step 3: Check if the will's current institutions prejudice the reinstated heir
  // The will's institution is void only to the extent it prejudices the reinstated heir
  // = the reinstated heir is not receiving their legitime under the current will distribution
  heir_current_will_share = compute_heir_share_under_will(heir, will)
  heir_required_legitime = new_legitimes[heir]

  IF heir_current_will_share >= heir_required_legitime:
    // No prejudice: will stands as-is
    RETURN (family_tree, will)

  // Step 4: Will institution is void "insofar as it may prejudice" the reinstated heir
  // = reduce the institution of OTHER voluntary/testamentary heirs to fund the deficit
  deficit = heir_required_legitime - heir_current_will_share
  corrected_will = reduce_institution_to_cover_deficit(will, heir, deficit)
  // Reduction order: voluntary heirs first, then devises/legacies if needed
  // (but Art. 918 says "devises and legacies...valid to such extent as will not impair legitime"
  //  so devises/legacies are only reduced if strictly necessary)

  RETURN (family_tree, corrected_will)
```

**Key distinction**: Under Art. 918, the institution is only void "insofar as it may prejudice the person disinherited." This means:
- If the heir receives enough from the will anyway (e.g., was given a legacy despite being "disinherited"), no correction is needed.
- Only the quantum of institution that BLOCKS the heir's legitime is annulled.
- Devises, legacies, and other testamentary dispositions are preserved if they don't impair the reinstated heir's legitime.

---

## Section 5: Reconciliation (Art. 922)

Art. 922 provides that **subsequent reconciliation** between the testator (offended party) and the disinheriting-cause actor (the would-be disinherited heir) has two effects:

1. **Prospective effect**: Deprives the testator of the RIGHT to disinherit going forward
2. **Retroactive effect**: Renders **ineffectual** any disinheritance that was already made in an existing will

### Timing Logic

```
APPLY_RECONCILIATION(disinheritance: Disinheritance) → DisinheritanceStatus:

  IF disinheritance.reconciliation_occurred == false:
    RETURN: proceed with normal validity check

  // Reconciliation occurred: disinheritance is rendered ineffectual
  // regardless of whether the cause was originally valid
  RETURN INVALID (reason: "RECONCILIATION_OCCURRED")
  // → triggers Art. 918 treatment (not Art. 854)
```

**Engine input requirement**: The engine must accept a boolean `reconciliation_occurred` on the `Disinheritance` struct. Whether reconciliation occurred is a **factual question** (judicial determination or stipulation). The engine treats this as a given input.

**A8 special case (Art. 920)**: Ground A8 has an **internal reconciliation carve-out**: "An attempt by one of the parents against the life of the other, unless there has been a reconciliation between them." This reconciliation is between the two parents — NOT between the testator and the disinherited heir. The engine must check this sub-exception SEPARATELY from Art. 922's general reconciliation.

```
IS_VALID_CAUSE(cause_code: DisinheritanceCause, heir: Heir, inputs) → bool:

  IF cause_code == A8:
    // Built-in sub-exception: check if parents reconciled with each other
    IF inputs.A8_parents_reconciled == true:
      RETURN false  // ground does not apply even if conduct occurred
    RETURN inputs.A8_attempt_occurred

  // ... all other grounds: standard boolean check
```

---

## Section 6: Interaction with Preterition (Art. 854)

The engine must check **preterition BEFORE disinheritance validity** (as established in testate-validation):

```
CHECK ORDER:
  1. Preterition (Art. 854) → if triggered, TERMINATE with intestate distribution
  2. Disinheritance validity (Arts. 915-918, 922) → if invalid, apply Art. 918
  3. (continue with remaining validation steps)
```

**Key interaction**: When preterition annuls the institution (Step 1), distribution becomes intestate. Valid disinheritances that were processed BEFORE the preterition check STILL APPLY within the intestate distribution. A validly disinherited child does not get a share in the resulting intestate distribution either (their exclusion survives preterition).

**Invalid disinheritance + preterition**: If a disinheritance is INVALID (Art. 918) AND another compulsory heir is preterited (Art. 854), the preterition check runs first and annuls the institution. The invalidly disinherited heir is reinstated and participates in the intestate distribution. The Art. 918 partial-annulment mechanism is moot once preterition has already triggered total annulment.

---

## Rule (Pseudocode)

### Master Disinheritance Processing Function

```
PROCESS_DISINHERITANCE(
    will: Will,
    family_tree: FamilyTree,
    net_estate: Money
) → (FamilyTree, Will, List[ValidationNote]):

  notes = []
  modified_will = will.copy()
  modified_tree = family_tree.copy()

  FOR disinheritance IN will.disinheritances:
    status = VALIDITY_CHECK(disinheritance)

    IF status == VALID:
      // Apply valid disinheritance
      modified_tree = APPLY_VALID_DISINHERITANCE(
          disinheritance.heir, modified_tree)
      notes.append(Note(
          type="VALID_DISINHERITANCE",
          heir=disinheritance.heir,
          cause=disinheritance.cause_code,
          representatives=GET_ART923_REPRESENTATIVES(disinheritance.heir, modified_tree)
      ))

    ELSE:  // INVALID
      // Apply Art. 918 — partial annulment
      (modified_tree, modified_will) = APPLY_INVALID_DISINHERITANCE(
          disinheritance.heir, modified_tree, modified_will, net_estate)
      notes.append(Note(
          type="INVALID_DISINHERITANCE_ART918",
          heir=disinheritance.heir,
          reason=status.reason,
          correction="HEIR_REINSTATED_INSTITUTION_REDUCED_PRO_TANTO"
      ))

  RETURN (modified_tree, modified_will, notes)
```

### Art. 923 Per-Stirpes Distribution

```
DISTRIBUTE_DISINHERITED_LINE(
    disinherited_heir: Heir,
    line_legitime: Money,  // what the disinherited heir would have received
    family_tree: FamilyTree
) → List[(Heir, Money)]:

  representatives = GET_ART923_REPRESENTATIVES(disinherited_heir, family_tree)

  IF representatives is empty:
    // Line collapses; share redistributes per accretion or intestate rules
    RETURN []

  // Per stirpes: split line_legitime equally among all representatives
  per_rep = line_legitime / len(representatives)

  RETURN [(rep, per_rep) FOR rep IN representatives]
  // + flag: disinherited parent has NO usufruct/administration of these amounts
```

---

## Interactions

### With Legitimate Children's Legitime Computation

| Scenario | Headcount | Effect |
|----------|-----------|--------|
| LC2 validly disinherited, 2 grandchildren represent | 3 "lines" count (LC1 line, GC1+GC2 line, LC3 line) | Legitime split into 3 equal line-shares; GC1 and GC2 each get ½ of their line |
| LC2 validly disinherited, NO grandchildren | 2 "lines" count only (LC1, LC3) | LC2's line vanishes; estate split between remaining lines |
| Parent (ascendant) validly disinherited | No Art. 923 representation | Scenario re-evaluates; remaining ascendants or other classes inherit |
| Spouse validly disinherited | No Art. 923 representation | Scenario re-evaluates; spouse simply absent from heir pool |

### With Illegitimate Children

Art. 919 explicitly states it applies to "children and descendants, legitimate as well as illegitimate." Illegitimate children may be disinherited on the same grounds as legitimate children. Their disinheritance follows identical validity rules. Art. 923 representation also applies: descendants of a disinherited illegitimate child take their place.

Critically: the descendants of a disinherited illegitimate child inherit the **illegitimate child's share** (not a legitimate child's share). The share type is determined by the disinherited heir's classification, not the representatives' classification.

```
IF disinherited_heir.category == ILLEGITIMATE_CHILD_GROUP:
  representatives inherit IC share (half the LC per-child share)
  // Art. 902: descendants of IC (whether legitimate or illegitimate themselves)
  // inherit the IC's right — they still get the IC share, not a full LC share
```

### With Intestate Succession

Disinheritance is a **testate instrument only** (Art. 916: "only through a will"). It has no effect in intestate succession. When there is no will, the law ignores any prior disinheritance attempts. The disinherited heir inherits normally under intestate rules.

### With Adopted Children

Adopted children are classified as legitimate children. They may be disinherited on Art. 919 grounds exactly like biological legitimate children. Art. 923 representation applies.

### With Unworthiness to Succeed (Art. 1032)

Disinheritance and unworthiness are separate mechanisms:
- **Disinheritance**: Act of TESTATOR excluding an heir; requires a will; governed by Arts. 915-923
- **Unworthiness** (incapacity by law): Automatic exclusion by law for certain serious wrongs; governed by Arts. 1032-1040; applies even without a will

An heir can simultaneously be disinherited AND unworthy. If the disinheritance is invalid (Art. 918), the heir is reinstated; but if they are independently unworthy under Art. 1032, they are still excluded.

---

## Edge Cases

### EC-D1: Disinheritance Without Descendants — Line Collapses

**Facts**: LC2 is validly disinherited. LC2 has no children (no grandchildren of decedent exist).
**Rule**: Art. 923 does not apply. LC2's line simply collapses. The legitimate children's legitime is now split only between LC1 and LC3 (2 lines, not 3).
**Engine**: Remove LC2 from family_tree, do NOT add any Art. 923 representatives. Recompute scenario with 2 lines.

### EC-D2: Disinherited Heir's Child Also Predeceases

**Facts**: LC2 is validly disinherited. LC2's only child GC1 predeceased the testator.
**Rule**: GC1 cannot represent LC2 under Art. 923 (GC1 is dead). If GC1 has children (great-grandchildren of decedent), THEY can represent LC2 under Art. 923 via multi-level representation (the right of representation is recursive in the descending line).
**Engine**: GET_ART923_REPRESENTATIVES recursively searches until it finds living capable descendants.

### EC-D3: Invalidly Disinherited Heir with No Will Institution

**Facts**: Testator disinherited LC2 with no valid cause (Art. 918), but the will does NOT institute LC2 to anything. There are no other voluntary dispositions affecting LC2.
**Rule**: Art. 918 says institution is annulled "insofar as it may prejudice" the reinstated heir. If the will simply didn't give LC2 anything (no institution) and there's an undisposed portion, the undisposed portion can fund LC2's legitime under Art. 855. If no undisposed portion, reduce the other heirs' testamentary shares.
**Engine**: Reinstate LC2. Compute underprovision recovery per Art. 855 waterfall.

### EC-D4: Reconciliation Occurring AFTER Testator's Death

**Facts**: Testator made a will disinheriting LC2, then died before reconciling. After the testator's death, LC2 "reconciles" with the testator's estate executor.
**Rule**: Art. 922 requires reconciliation "between the offender and the offended person." The offended party (testator) is dead. Post-death "reconciliation" is legally impossible — you cannot reconcile with a deceased person. The disinheritance stands.
**Engine**: `reconciliation_occurred` must be dated BEFORE `decedent.date_of_death` to be valid.

### EC-D5: Multiple Disinheritances — Some Valid, Some Invalid

**Facts**: Will disinherits 3 heirs: LC2 (valid), LC3 (invalid — no cause specified), Spouse S (valid).
**Rule**: Each disinheritance is evaluated independently. Valid ones apply; invalid ones trigger Art. 918 for each. No "all or nothing" result.
**Engine**: Loop through `will.disinheritances`, process each independently. Valid → apply; Invalid → Art. 918 reinstatement.

### EC-D6: Disinheritance of Spouse + Legal Separation

**Facts**: Testator validly disinherits spouse under Art. 921(4) (gave cause for legal separation). No judicial legal separation decree was filed. The cause existed factually.
**Rule**: Art. 921(4) does NOT require a final judicial decree of legal separation — it requires that the spouse "gave cause for legal separation." The factual existence of the cause (as defined in Art. 55 Family Code) is sufficient, even without a court proceeding. Engine must treat `S4_gave_cause` as a factual boolean.
**Note**: Contrast with Art. 1002 (legal separation disqualification from intestate inheritance) which requires a judicial decree. Disinheritance for Art. 921(4) is broader — no decree needed.

### EC-D7: Art. 920(A8) Internal Reconciliation Carve-Out

**Facts**: Father (testator) disinherits Mother (ascendant) under Art. 920(8): "attempt by one of the parents against the life of the other." However, Father and Mother reconciled before Mother's disinheritance. After reconciliation, Father made his will disinheriting Mother on this ground.
**Rule**: Art. 920(8) explicitly provides "unless there has been a reconciliation between them." Even if the attempt occurred, if the two parents reconciled thereafter, the ground is negated. The disinheritance is INVALID even if the underlying conduct happened.
**Engine**: Check `inputs.A8_parents_reconciled` within the ground-validity check (SEPARATE from Art. 922 reconciliation check).

### EC-D8: Disinherited Heir's Representative is Also Unworthy

**Facts**: LC2 validly disinherited. GC1 (LC2's child) would represent under Art. 923. But GC1 is independently unworthy to succeed the decedent under Art. 1032.
**Rule**: Art. 973 requires that "the representative himself be capable of succeeding the decedent." GC1 is unworthy → incapable → cannot represent LC2. If GC1 has no surviving children, and GC2 (LC2's other child) is the only other representative, GC2 takes the full line share.
**Engine**: Filter representatives by `is_capable_to_succeed_decedent()`.

### EC-D9: Disinheritance in a Will That Is Subsequently Revoked

**Facts**: Testator made Will #1 disinheriting LC2. Testator then made Will #2 that makes no mention of disinheriting LC2 (revokes Will #1 by implication).
**Rule**: Wills may be revoked (Arts. 828-833). The disinheritance in Will #1 is no longer operative under Will #2. LC2 is a regular compulsory heir under Will #2. The engine processes only the LAST VALID WILL.
**Engine**: Process the single operative will. Prior will disinheritances that are revoked have no effect.

### EC-D10: Can a Testator Disinherit a Descendant Who Is Not a Direct Child?

**Facts**: Testator disinherits grandchild GC1 in the will (GC1's parent LC1 is still alive).
**Rule**: GC1 is NOT a compulsory heir while LC1 is alive and not excluded (nearer excludes more remote). One cannot disinherit a non-compulsory heir. The disinheritance provision is moot — GC1 would inherit nothing anyway while LC1 lives. Engine should flag: "GC1 is not a compulsory heir; disinheritance provision has no legal effect."
**Edge**: If LC1 subsequently predeceases the testator BEFORE the will is executed, GC1 becomes a compulsory heir by representation (Art. 981), and the disinheritance clause becomes relevant.
**Engine**: Classify GC1's status at the time of decedent's death. If GC1 is a compulsory heir (by representation) at that time, the disinheritance applies. If not, ignore.

---

## Test Cases

### D-T1: Valid Disinheritance — Child with Representing Grandchildren

**Input**:
- Net estate: ₱12,000,000
- Family: LC1, LC2 (disinherited-valid, C6 — maltreatment), LC3 + Spouse S
- LC2 has 2 children: GC1, GC2
- Will: "I disinherit LC2 for maltreatment [Art. 919(6)]. Free portion to charity C."

**Computation**:
- Valid disinheritance → Art. 923: GC1, GC2 represent LC2
- Lines: LC1 line | GC1+GC2 line | LC3 line → 3 lines
- Collective legitime (LC group) = ½ × ₱12M = ₱6,000,000 → ₱2,000,000 per line
- Spouse (Art. 892, n=3): ₱12M × 1/(2×3) = ₱2,000,000 from FP
- Total legitime: ₱6,000,000 (LC lines) + ₱2,000,000 (S) = ₱8,000,000
- FP = ₱12M − ₱8M = ₱4,000,000 → charity C

| Heir | Legitime | FP | Total | Basis |
|------|----------|-----|-------|-------|
| LC1 | ₱2,000,000 | — | ₱2,000,000 | Art. 888 |
| GC1 | ₱1,000,000 | — | ₱1,000,000 | Arts. 923, 974 |
| GC2 | ₱1,000,000 | — | ₱1,000,000 | Arts. 923, 974 |
| LC3 | ₱2,000,000 | — | ₱2,000,000 | Art. 888 |
| S | ₱2,000,000 | — | ₱2,000,000 | Art. 892 |
| Charity C | — | ₱4,000,000 | ₱4,000,000 | Will |
| **Total** | ₱8,000,000 | ₱4,000,000 | ₱12,000,000 | |

**D-T1 Narrative (GC1)**:
> **GC1 (grandchild, by representation under Art. 923)** receives **₱1,000,000**.
> GC1's parent LC2 was validly disinherited by the testator for maltreatment (Art. 919(6) of the Civil Code). Under Art. 923, the children of a validly disinherited heir take the disinherited heir's place and preserve the rights of compulsory heirs with respect to the legitime. The legitimate children's collective legitime is ½ of the estate (₱6,000,000), divided into 3 lines of ₱2,000,000 each. GC1 and GC2 share LC2's line equally by right of representation (Art. 974), receiving ₱1,000,000 each. Note: LC2 (the disinherited parent) has no usufruct or right of administration over GC1's inheritance (Art. 923).

---

### D-T2: Valid Disinheritance — No Descendants of Disinherited Heir

**Input**:
- Net estate: ₱10,000,000
- Family: LC1, LC2 (disinherited-valid, C1 — attempt on testator's life), LC3
- LC2 has NO children
- No surviving spouse
- Will: "I disinherit LC2. The rest I leave to LC1 and LC3 equally."

**Computation**:
- Valid disinheritance, no Art. 923 representatives → LC2's line collapses
- Lines: LC1 line | LC3 line → 2 lines
- Collective legitime = ½ × ₱10M = ₱5,000,000 → ₱2,500,000 per line
- No spouse
- FP = ₱10M − ₱5M = ₱5,000,000 → LC1 + LC3 equally (₱2,500,000 each)

| Heir | Legitime | FP | Total |
|------|----------|-----|-------|
| LC1 | ₱2,500,000 | ₱2,500,000 | ₱5,000,000 |
| LC3 | ₱2,500,000 | ₱2,500,000 | ₱5,000,000 |
| LC2 | ₱0 | ₱0 | ₱0 (validly disinherited) |

---

### D-T3: Invalid Disinheritance (No Cause Specified) — Art. 918

**Input**:
- Net estate: ₱10,000,000
- Family: LC1, LC2 (disinherited-invalid — will says "I disinherit LC2" but states no legal cause)
- Surviving spouse S
- Will: "I disinherit LC2. I institute LC1 as my sole heir."

**Computation**:
- Disinheritance invalid (Art. 918: no cause specified)
- Reinstate LC2 as compulsory heir
- Recompute scenario: 2 LC children + spouse (T3)
- Collective legitime = ½ × ₱10M = ₱5,000,000 → ₱2,500,000 per child
- S legitime (Art. 892, n=2) = ₱10M × 1/(2×2) = ₱2,500,000 from FP
- Total legitime = ₱5M + ₱2.5M = ₱7,500,000; FP = ₱2,500,000
- Will institution of LC1 as sole heir is ANNULLED "insofar as it prejudices LC2" → i.e., to the extent LC1 would receive LC2's legitime (₱2,500,000), that institution is void
- LC1 keeps their legitime + FP share; LC2 gets their legitime restored

| Heir | Legitime | FP | Total | Notes |
|------|----------|-----|-------|-------|
| LC1 | ₱2,500,000 | ₱2,500,000 | ₱5,000,000 | Art. 888 + remaining FP |
| LC2 | ₱2,500,000 | — | ₱2,500,000 | Reinstated per Art. 918 |
| S | ₱2,500,000 | — | ₱2,500,000 | Art. 892 |
| **Total** | | | ₱10,000,000 | |

---

### D-T4: Valid Disinheritance of Spouse

**Input**:
- Net estate: ₱10,000,000
- Family: 2 legitimate children (LC1, LC2), Spouse S (disinherited-valid, S4 — gave cause for legal separation)
- Will: "I disinherit my spouse for cause. I leave the free portion to my children equally."

**Computation**:
- Valid disinheritance of spouse → No Art. 923 representation for spouse
- Scenario re-evaluates: 2 LC children, NO spouse (T1)
- Collective legitime (Art. 888) = ½ × ₱10M = ₱5,000,000 → ₱2,500,000 per child
- FP = ₱10M − ₱5M = ₱5,000,000 → ₱2,500,000 each to LC1 and LC2 (per will)
- Spouse receives ₱0

| Heir | Legitime | FP | Total |
|------|----------|-----|-------|
| LC1 | ₱2,500,000 | ₱2,500,000 | ₱5,000,000 |
| LC2 | ₱2,500,000 | ₱2,500,000 | ₱5,000,000 |
| S | ₱0 | ₱0 | ₱0 (validly disinherited) |

---

### D-T5: Valid Disinheritance of Ascendant — No Representation

**Input**:
- Net estate: ₱10,000,000
- Family: No children; Surviving Father (disinherited-valid, A2 — convicted of attempt on testator's life) + Mother + Spouse S
- Will: "I disinherit my father. I leave my estate as follows..."

**Computation**:
- Father disinherited → NO Art. 923 representation (father's children = testator's siblings; siblings are NOT compulsory heirs in testate)
- Scenario without father: Mother only + Spouse S (T7 equivalent — one ascendant + spouse)
- Mother's legitime (Art. 889): ½ × ₱10M = ₱5,000,000 (sole surviving ascendant)
- Spouse (Art. 893 — with one ascendant): ¼ × ₱10M = ₱2,500,000 from FP
- Total legitime = ₱5M + ₱2.5M = ₱7,500,000; FP = ₱2,500,000

| Heir | Legitime | FP | Total |
|------|----------|-----|-------|
| Mother | ₱5,000,000 | — | ₱5,000,000 |
| Spouse S | ₱2,500,000 | — | ₱2,500,000 |
| Father | ₱0 | ₱0 | ₱0 (validly disinherited) |
| FP | — | ₱2,500,000 | Distributes per will |

---

### D-T6: Reconciliation Voids Disinheritance

**Input**:
- Net estate: ₱8,000,000
- Family: LC1, LC2 (disinherited, C6 — maltreatment), Spouse S
- Post-will: testator and LC2 reconciled (Art. 922)
- `disinheritance.reconciliation_occurred = true`

**Computation**:
- Reconciliation occurred → Art. 922 renders disinheritance ineffectual → treat as never disinherited
- Scenario: 2 LC children + spouse (T3)
- LC collective legitime = ½ × ₱8M = ₱4,000,000 → ₱2,000,000 per child
- Spouse (Art. 892, n=2): ₱8M × 1/(2×2) = ₱2,000,000 from FP
- Total legitime = ₱4M + ₱2M = ₱6,000,000; FP = ₱2,000,000

---

### D-T7: Invalid Disinheritance (Art. 920 Cause Applied to Child — Wrong Heir Type)

**Input**:
- Net estate: ₱8,000,000
- Family: LC1 (disinherited, cause_code = A7 — "refusal to support children"), LC2, Spouse S
- A7 is from Art. 920 (causes for disinheriting PARENTS), not Art. 919 (causes for children)

**Computation**:
- Cause A7 not valid for LC1 (a child) → `is_valid_cause_for_heir_type()` returns false → INVALID
- Art. 918 applies → reinstate LC1
- Scenario: 2 LC children + spouse (T3) continues normally

---

### D-T8: Multi-Level Representation via Art. 923

**Input**:
- Net estate: ₱12,000,000
- Family: LC1, LC2 (validly disinherited), no surviving spouse
- LC2's only child GC1 also predeceased testator
- GC1's children (GGC1, GGC2) survive testator

**Computation**:
- LC2 disinherited → Art. 923 → look for LC2's descendants
- GC1 predeceased → GC1 cannot represent
- GGC1, GGC2 are GC1's children → they represent LC2 at the great-grandchild level
- Lines: LC1 line | GGC1+GGC2 line → 2 lines
- Collective legitime = ½ × ₱12M = ₱6,000,000 → ₱3,000,000 per line
- No spouse → FP = ₱6,000,000

| Heir | Legitime | FP | Total |
|------|----------|-----|-------|
| LC1 | ₱3,000,000 | (FP per will) | varies |
| GGC1 | ₱1,500,000 | — | ₱1,500,000 |
| GGC2 | ₱1,500,000 | — | ₱1,500,000 |

---

### D-T9: Disinheritance + Preterition Interaction

**Input**:
- Net estate: ₱12,000,000
- Family: LC1 (preterited — completely omitted from will), LC2 (validly disinherited, C6)
- Will: "I institute LC3 as my sole heir. I disinherit LC2."

**Computation**:
- Step 1 (Preterition check): LC1 totally omitted → Art. 854 → ANNUL institution of LC3
- Distribution becomes intestate
- Step 2: Within intestate distribution, LC2's valid disinheritance still applies
- Intestate with LC1 + [Art. 923 descendants of LC2 if any] + LC3 (if there is one, otherwise just LC1)
- If family is only LC1 and LC2 (no LC3): intestate between LC1 and Art. 923 descendants of LC2

---

## Narrative Templates

### Template 1: Valid Disinheritance — Direct Recipient (Not Representing)

> **[Heir Name] ([relationship])** receives **₱[amount]**.
> [The other heirs' computation explanation.]

### Template 2: Art. 923 Representative

> **[Representative Name] ([relationship], by right of representation under Art. 923)** receives **₱[amount]**.
> [Representative's parent] was validly disinherited by the testator on the ground of [cause description] (Art. 919([#]) / Art. 920([#]) / Art. 921([#]) of the Civil Code). Under Art. 923, the children and descendants of a validly disinherited heir take the disinherited heir's place and preserve the rights of compulsory heirs with respect to the legitime. [Disinherited parent]'s line receives [fraction] of the estate as legitime ([₱line_legitime]), divided equally among [n] representatives. [Representative Name] receives ₱[per_rep_amount] by right of representation (Art. 974). Note: [Disinherited parent] has no right of usufruct or administration over this inheritance (Art. 923).

### Template 3: Invalidly Disinherited Heir (Art. 918 Reinstated)

> **[Heir Name] ([relationship])** receives **₱[amount]**.
> The testator's will purported to disinherit [heir name]. However, the disinheritance is legally ineffective because [reason: no cause specified / cause not in the Civil Code / cause was not proved / reconciliation occurred] (Art. 918 / Art. 922 of the Civil Code). As a compulsory heir who was invalidly disinherited, [heir name] is reinstated to receive their full legitime of ₱[legitime_amount]. The institution of other heirs in the will is annulled only to the extent necessary to satisfy [heir name]'s legitime.

### Template 4: Validly Disinherited Heir (Receives Nothing)

> **[Heir Name] ([relationship])** receives **₱0**.
> [Heir name] was validly disinherited by the testator on the ground of [cause description] (Art. 919([#]) / Art. 920([#]) / Art. 921([#]) of the Civil Code). The disinheritance satisfies all legal requirements: it was made in a will, the legal cause was specified, the cause is recognized by the Civil Code, and no subsequent reconciliation occurred (Arts. 915-916, 922). As a validly disinherited heir, [heir name] receives no inheritance — neither legitime nor any portion of the free portion. [If representatives exist:] [Heir name]'s share passes to their children [GC names] by right of representation under Art. 923.

### Template 5: Validly Disinherited Ascendant or Spouse (No Representation)

> **[Heir Name] ([relationship])** receives **₱0**.
> [Heir name] was validly disinherited by the testator on the ground of [cause description] (Art. 920([#]) / Art. 921([#])). As a validly disinherited heir, [heir name] receives no inheritance. Unlike the disinheritance of children and descendants, the disinheritance of a [parent/spouse] does not trigger the right of representation under Art. 923 — [parent's children (the testator's siblings) / the spouse's relatives] are not compulsory heirs and do not take the disinherited heir's place.

---

## Data Model Additions

The following data model elements are specific to this analysis (complementing those defined in testate-validation):

```
enum DisinheritanceCause {
  // Art. 919 — Children and Descendants
  C1  // attempt against life of testator/spouse/descendants/ascendants
  C2  // groundless accusation (imprisonment ≥ 6 years)
  C3  // adultery/concubinage with testator's spouse
  C4  // fraud/violence/intimidation/undue influence re: will
  C5  // refusal to support parent/ascendant without cause
  C6  // maltreatment by word or deed
  C7  // dishonorable or disgraceful life
  C8  // civil interdiction penalty

  // Art. 920 — Parents and Ascendants
  A1  // abandonment/inducing immoral life/attempt against virtue of children
  A2  // attempt against life of testator/spouse/descendants/ascendants
  A3  // false accusation (imprisonment ≥ 6 years)
  A4  // adultery/concubinage with testator's spouse
  A5  // fraud/violence/intimidation/undue influence re: will
  A6  // loss of parental authority
  A7  // refusal to support children/descendants without cause
  A8  // attempt by parent against life of other parent (unless parents reconciled)

  // Art. 921 — Spouse
  S1  // attempt against life of testator/descendants/ascendants
  S2  // false accusation (imprisonment ≥ 6 years)
  S3  // fraud/violence/intimidation/undue influence re: will
  S4  // gave cause for legal separation
  S5  // gave grounds for loss of parental authority
  S6  // unjustifiable refusal to support children or spouse
}

struct Disinheritance {
  heir: Heir
  cause_code: DisinheritanceCause
  in_will: bool
  cause_proven: bool           // false = challenged and unproved; true = proven or unchallenged
  reconciliation_occurred: bool  // Art. 922 general reconciliation (testator ↔ heir)
  A8_parents_reconciled: bool  // ONLY for A8: Art. 920(8) internal sub-exception
}

struct DisinheritanceResult {
  disinheritance: Disinheritance
  status: DisinheritanceStatus  // VALID or INVALID
  invalid_reason: string | null
  representatives: List[Heir]   // Art. 923 representatives (may be empty)
  // For Art. 923 output:
  usufruct_restriction_flag: bool  // always true for valid disinheritance with representatives
}
```

---

## Test Implications

The following test scenarios are required to verify the disinheritance engine:

| Test ID | Scenario | Key Rule | Expected Outcome |
|---------|----------|----------|-----------------|
| D-T1 | Valid disinheritance (C6), 2 grandchildren represent | Art. 923 per stirpes | Each grandchild gets ½ of disinherited line |
| D-T2 | Valid disinheritance, no grandchildren | Line collapse | Remaining 2 children split estate |
| D-T3 | Invalid disinheritance — no cause | Art. 918 reinstatement | Heir reinstated; institution reduced |
| D-T4 | Valid disinheritance of spouse | No representation | Spouse gets ₱0; scenario recalculates without spouse |
| D-T5 | Valid disinheritance of ascendant | No Art. 923 representation | Scenario recalculates with remaining ascendants |
| D-T6 | Reconciliation voids disinheritance | Art. 922 | Heir treated as never disinherited |
| D-T7 | Wrong cause code for heir type | Cause not in Code | Art. 918 — INVALID |
| D-T8 | Multi-level Art. 923 (GGC represent) | Recursive representation | Great-grandchildren take disinherited line |
| D-T9 | Disinheritance + preterition | Art. 854 pre-empts pipeline | Intestate; valid disinheritance persists within intestate |
| D-T10 | IC disinherited, IC's child represents | IC share type preserved | Representative gets IC share (½ of LC per-child share) |
| D-T11 | A8 internal reconciliation | Art. 920(8) sub-exception | Ground negated even though conduct occurred |
| D-T12 | Post-death "reconciliation" | Art. 922 requires testator alive | Disinheritance stands |

