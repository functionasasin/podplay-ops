# Disinheritance Rules — Valid Grounds, Formal Requirements, and Effects on Descendants

**Aspect**: disinheritance-rules
**Wave**: 4 (Distribution Rules)
**Primary Legal Basis**: Arts. 915-923, 1032-1035 (Civil Code); Art. 176 (Family Code)
**Depends On**: compulsory-heirs-categories, heir-concurrence-rules, representation-rights, legitime-table, free-portion-rules, testate-validation

---

## Overview

Disinheritance is the testator's voluntary act of depriving a compulsory heir of their legitime through a will, for a cause expressly recognized by law. It is the **only legal mechanism** by which a testator can defeat a compulsory heir's guaranteed share.

This analysis provides the **complete standalone reference** for the engine's disinheritance sub-system:

1. Formal validity requirements (Arts. 915-918)
2. Complete grounds enumeration (Arts. 919-921) with heir-category mapping
3. Reconciliation (Art. 922) — the automatic voiding mechanism
4. Representation by disinherited heir's descendants (Art. 923)
5. The critical distinction between invalid disinheritance (Art. 918) and preterition (Art. 854)
6. Overlap and distinction with unworthiness (Arts. 1032-1035)
7. Complete disinheritance sub-engine pseudocode
8. Engine input/output model
9. All edge cases
10. Test cases
11. Narrative templates

---

## Legal Basis

### Art. 915 — Definition

> "A compulsory heir may, in consequence of disinheritance, be deprived of his legitime, for causes expressly stated by law."

**Key constraints**:
- Only **compulsory heirs** can be disinherited (voluntary heirs have no protected share)
- Only the **legitime** is affected (if the testator also gave a free-portion share, that separate grant may be revoked independently)
- Causes must be **expressly stated by law** — no judicial discretion to add causes

### Art. 916 — Formal Requirements

> "Disinheritance can be effected only through a will wherein the legal cause therefor shall be specified."

Two hard requirements:
1. **In a will** — cannot be in a separate document, letter, affidavit, or verbal declaration
2. **Cause specified** — the will must state which ground applies (need not quote the article number, but the factual basis must be identifiable)

### Art. 917 — Burden of Proof

> "The burden of proving the truth of the cause for disinheritance shall rest upon the other heirs of the testator, if the disinherited heir should deny it."

**Engine implication**: The engine cannot adjudicate truth — it accepts a boolean `cause_proven` input. If the disinherited heir contests and the cause is not proven in judicial proceedings, the engine treats the disinheritance as invalid.

### Art. 918 — Effect of Invalid Disinheritance

> "Disinheritance without a specification of the cause, or for a cause the truth of which, if contradicted, is not proved, or which is not one of those set forth in this Code, shall annul the institution of heirs insofar as it may prejudice the person disinherited; but the devises and legacies and other testamentary dispositions shall be valid to such extent as will not impair the legitime."

Three invalidity triggers:
1. No cause specified in the will
2. Cause specified but not proven (when contested)
3. Cause is not one enumerated in Arts. 919-921

**Effect**: Partial annulment — only enough of the institution is annulled to restore the disinherited heir's legitime. This is critically different from preterition (Art. 854).

### Art. 922 — Reconciliation

> "A subsequent reconciliation between the offender and the offended person deprives the latter of the right to disinherit, and renders ineffectual any disinheritance that may have been made."

**Engine implication**: Reconciliation is a factual determination. The engine accepts a boolean `reconciliation_occurred` input. If true, the disinheritance is void regardless of whether the will is modified.

**Timing**: Reconciliation after the offense but before the testator's death voids the disinheritance. If the will is not updated to remove the disinheritance clause, it is still void. The legal effect is automatic — no need for the testator to execute a codicil.

### Art. 923 — Representation by Descendants

> "The children and descendants of the person disinherited shall take his or her place and shall preserve the rights of compulsory heirs with respect to the legitime; but the disinherited parent shall not have the usufruct or administration of the property which constitutes the legitime."

Two effects:
1. **Descendants step in**: The disinherited heir's children/descendants represent them and receive the legitime that would have gone to the disinherited heir
2. **No usufruct/administration**: The disinherited parent is barred from enjoying or managing the property inherited by their children through representation

---

## Complete Grounds for Disinheritance

### Art. 919 — Children and Descendants (Legitimate AND Illegitimate)

The article heading explicitly states: "legitimate as well as illegitimate." All 8 grounds apply to both.

| # | Ground | Code | Engine Input |
|---|--------|------|--------------|
| 919(1) | Attempt against the life of the testator, his/her spouse, descendants, or ascendants | `CHILD_ATTEMPT_ON_LIFE` | Boolean: convicted/found guilty |
| 919(2) | Groundless accusation of a crime punishable by ≥6 years imprisonment | `CHILD_GROUNDLESS_ACCUSATION` | Boolean: accusation found groundless |
| 919(3) | Adultery or concubinage with the testator's spouse | `CHILD_ADULTERY_WITH_SPOUSE` | Boolean: convicted |
| 919(4) | Fraud, violence, intimidation, or undue influence causing testator to make or change a will | `CHILD_FRAUD_UNDUE_INFLUENCE` | Boolean: proven |
| 919(5) | Unjustifiable refusal to support the parent/ascendant who disinherits | `CHILD_REFUSAL_TO_SUPPORT` | Boolean: refusal without justification |
| 919(6) | Maltreatment of the testator by word or deed | `CHILD_MALTREATMENT` | Boolean: proven |
| 919(7) | Leading a dishonorable or disgraceful life | `CHILD_DISHONORABLE_LIFE` | Boolean: proven |
| 919(8) | Conviction of a crime carrying civil interdiction | `CHILD_CIVIL_INTERDICTION` | Boolean: convicted |

### Art. 920 — Parents and Ascendants (Legitimate AND Illegitimate)

| # | Ground | Code | Engine Input |
|---|--------|------|--------------|
| 920(1) | Abandoning children, inducing daughters to live corruptly/immorally, or attempting against their virtue | `PARENT_ABANDONMENT_CORRUPTION` | Boolean: proven |
| 920(2) | Conviction of attempt against the life of the testator, his/her spouse, descendants, or ascendants | `PARENT_ATTEMPT_ON_LIFE` | Boolean: convicted |
| 920(3) | Groundless accusation of a crime punishable by ≥6 years imprisonment | `PARENT_GROUNDLESS_ACCUSATION` | Boolean: accusation found groundless |
| 920(4) | Conviction of adultery or concubinage with the testator's spouse | `PARENT_ADULTERY_WITH_SPOUSE` | Boolean: convicted |
| 920(5) | Fraud, violence, intimidation, or undue influence causing testator to make or change a will | `PARENT_FRAUD_UNDUE_INFLUENCE` | Boolean: proven |
| 920(6) | Loss of parental authority for causes specified in the Code | `PARENT_LOSS_PARENTAL_AUTHORITY` | Boolean: judicially determined |
| 920(7) | Refusal to support children/descendants without justifiable cause | `PARENT_REFUSAL_TO_SUPPORT` | Boolean: refusal without justification |
| 920(8) | Attempt by one parent against the life of the other, unless reconciled | `PARENT_ATTEMPT_ON_OTHER` | Boolean: proven AND no reconciliation |

**Note on 920(8)**: This ground has its own built-in reconciliation exception — "unless there has been a reconciliation between them." This is independent of Art. 922's general reconciliation rule. The reconciliation here is between the parents (not between testator and disinherited heir), though in practice the testator is often the other parent.

### Art. 921 — Spouse

| # | Ground | Code | Engine Input |
|---|--------|------|--------------|
| 921(1) | Conviction of attempt against the life of the testator, his/her descendants, or ascendants | `SPOUSE_ATTEMPT_ON_LIFE` | Boolean: convicted |
| 921(2) | Groundless accusation of a crime punishable by ≥6 years imprisonment | `SPOUSE_GROUNDLESS_ACCUSATION` | Boolean: accusation found groundless |
| 921(3) | Fraud, violence, intimidation, or undue influence causing testator to make or change a will | `SPOUSE_FRAUD_UNDUE_INFLUENCE` | Boolean: proven |
| 921(4) | Having given cause for legal separation | `SPOUSE_CAUSE_LEGAL_SEPARATION` | Boolean: judicially determined |
| 921(5) | Having given grounds for loss of parental authority | `SPOUSE_LOSS_PARENTAL_AUTHORITY` | Boolean: judicially determined |
| 921(6) | Unjustifiable refusal to support the children or the other spouse | `SPOUSE_REFUSAL_TO_SUPPORT` | Boolean: refusal without justification |

**Key difference**: Art. 923 (representation) does NOT apply to disinherited spouses. A disinherited spouse has no descendants who can "represent" them in the spouse category — spouse is a unique, non-representable heir class.

### Cause-Category Validation Matrix

The engine must enforce that the cause code matches the heir category:

```
VALID_CAUSES = {
    LEGITIMATE_CHILD_GROUP:     Art919_causes,  // 8 causes
    ILLEGITIMATE_CHILD_GROUP:   Art919_causes,  // same 8 causes (Art. 919 says "legitimate as well as illegitimate")
    LEGITIMATE_ASCENDANT_GROUP: Art920_causes,  // 8 causes
    SURVIVING_SPOUSE_GROUP:     Art921_causes,   // 6 causes
}
```

A disinheritance citing a cause from the wrong article is invalid per Art. 918 ("cause... not one of those set forth in this Code" for that heir category).

---

## Effect of Valid Disinheritance on the Engine

### Step-by-Step Engine Logic

When a disinheritance is validated as legally effective:

```
function apply_valid_disinheritance(
    disinheritance: Disinheritance,
    heir: Heir,
    all_heirs: Heir[],
    estate: Decimal
) -> DisinheritanceEffect {

    // 1. Remove disinherited heir from the active heir pool
    heir.status = DISINHERITED
    heir.receives_legitime = false
    heir.receives_free_portion = false

    // 2. Check for representatives (Art. 923)
    representatives = get_living_descendants(heir, all_heirs)

    if len(representatives) > 0:
        // Art. 923: descendants step into disinherited heir's place
        // The "line" persists — line count (n) stays the same
        // Representatives inherit per stirpes (Art. 974)
        line = create_representation_line(
            represented: heir,
            representatives: representatives,
            trigger: DISINHERITANCE
        )

        // Flag: disinherited parent barred from usufruct/administration
        line.usufruct_bar = heir  // Art. 923 ¶2

        return DisinheritanceEffect {
            heir: heir,
            outcome: VALID_WITH_REPRESENTATION,
            line: line,
            line_count_change: 0,       // line persists through representatives
            scenario_change: false,      // scenario typically unchanged
            narrative_flags: [USUFRUCT_BAR]
        }
    else:
        // No descendants — disinherited heir's line is eliminated
        // Line count (n) decreases by 1
        // Scenario MAY change (e.g., T3 with n=3 → T3 with n=2, or T1→T6 if last child)

        return DisinheritanceEffect {
            heir: heir,
            outcome: VALID_NO_REPRESENTATION,
            line: null,
            line_count_change: -1,       // one fewer line
            scenario_change: true,       // must re-evaluate scenario
            narrative_flags: []
        }
    }
}
```

### Scenario Re-evaluation After Disinheritance

When a disinherited heir has NO representatives, the scenario may change dramatically:

| Before Disinheritance | After Disinheritance | Effect |
|----------------------|---------------------|--------|
| T3 (3 LC + Spouse) | T3 (2 LC + Spouse) | n decreases, per-child legitime increases |
| T1 (1 LC only) | T6 (Parents only) or T12 (Spouse only) | Entire regime change |
| T5a (1 LC + IC + Spouse) | T10 (IC + Spouse) | Regime A → Regime C |
| T7 (Parents + Spouse) | T12 (Spouse only) | Regime B → Regime C |
| T8 (Parents + IC) | T11 (IC only) | Regime B → Regime C |

**Critical**: The engine must re-run scenario determination and legitime computation after each valid disinheritance without representation.

### Multiple Disinheritances

If multiple heirs are disinherited in the same will:

```
function process_all_disinheritances(
    will: Will,
    heirs: Heir[],
    estate: Decimal
) -> ProcessingResult {

    // Process ALL disinheritances first, then re-evaluate once
    valid_disinheritances = []
    invalid_disinheritances = []

    for d in will.disinheritances:
        heir = find_heir(d.heir_reference, heirs)
        result = validate_disinheritance(d, heir)

        if result == VALID:
            valid_disinheritances.push((d, heir))
        else:
            invalid_disinheritances.push((d, heir, result))

    // Apply all valid disinheritances
    for (d, heir) in valid_disinheritances:
        apply_valid_disinheritance(d, heir, heirs, estate)

    // Reinstate all invalidly disinherited heirs
    for (d, heir, reason) in invalid_disinheritances:
        heir.status = REINSTATED
        heir.receives_legitime = true

    // Re-evaluate scenario with the final heir pool
    final_heirs = filter(heirs, h => h.status != DISINHERITED)
    new_scenario = determine_scenario(final_heirs)
    new_legitimes = compute_all_legitimes(estate, final_heirs, new_scenario)

    return ProcessingResult {
        valid: valid_disinheritances,
        invalid: invalid_disinheritances,
        scenario: new_scenario,
        legitimes: new_legitimes,
    }
}
```

---

## Effect of Invalid Disinheritance (Art. 918)

### The Three Invalidity Triggers

A disinheritance is invalid if ANY of:
1. **No cause specified** in the will (Art. 916 violation)
2. **Cause not proven** — the disinherited heir contests and the other heirs fail to prove truth (Art. 917)
3. **Cause not in the Code** — the specified ground is not among those in Arts. 919-921 for the relevant heir category

### Distinction from Preterition (Art. 854)

This is the **most critical distinction** for the engine:

| Dimension | Invalid Disinheritance (Art. 918) | Preterition (Art. 854) |
|-----------|----------------------------------|----------------------|
| **What triggers it** | Testator ATTEMPTED to disinherit but failed | Testator TOTALLY OMITTED a direct-line compulsory heir |
| **What is annulled** | Institution "insofar as it prejudices" the disinherited heir | ENTIRE institution of all heirs |
| **Scope of annulment** | Partial — only enough to restore one heir's legitime | Total — all institutions wiped out |
| **Legacies/devises** | Valid if they don't impair the REINSTATED heir's legitime | Valid if not inofficious generally |
| **Distribution method** | Engine restores heir's legitime by reducing other dispositions | Estate distributes intestate (minus valid legacies/devises) |
| **Which heirs affected** | Only direct-line compulsory heirs trigger preterition; spouse/IC omission ≠ preterition | Same |
| **Representation** | Art. 923 applies if heir has descendants | N/A — preterition annuls before representation applies |

### Art. 918 Algorithm (Detailed)

```
function handle_invalid_disinheritance(
    will: Will,
    reinstated_heir: Heir,
    estate: Decimal,
    all_heirs: Heir[]
) -> Corrections {

    corrections = []

    // Step 1: Reinstate the heir into the compulsory heir pool
    reinstated_heir.status = REINSTATED
    reinstated_heir.receives_legitime = true
    active_heirs = get_active_heirs(all_heirs)  // includes reinstated

    // Step 2: Recalculate scenario with reinstated heir
    new_scenario = determine_scenario(active_heirs)

    // Step 3: Compute ALL new legitimes (including reinstated heir)
    new_legitimes = compute_all_legitimes(estate, active_heirs, new_scenario)
    reinstated_legitime = new_legitimes[reinstated_heir]

    // Step 4: Check what the will currently gives the reinstated heir
    current_provision = get_will_provision(will, reinstated_heir)
    // Usually 0 — the will tried to disinherit them, so gave nothing

    if current_provision >= reinstated_legitime:
        // Rare: the will somehow provides enough despite the disinheritance clause
        // (e.g., testator also left a legacy to the heir separately)
        return NO_CORRECTIONS_NEEDED

    // Step 5: Deficit = what the reinstated heir is owed
    deficit = reinstated_legitime - current_provision

    // Step 6: Compute new free portion
    total_legitime = sum(new_legitimes.values())
    new_fp = estate - total_legitime

    // Step 7: Check if existing dispositions exceed new FP
    total_dispositions = sum_will_dispositions_to_non_compulsory(will)
    if total_dispositions > new_fp:
        // Dispositions are now inofficious — reduce per Art. 911
        excess = total_dispositions - new_fp
        corrections.push(Correction {
            type: REDUCE_INOFFICIOUS,
            amount: excess,
            method: ART_911_REDUCTION
        })

    // Step 8: Recover the deficit for the reinstated heir via Art. 855 waterfall
    corrections.push(Correction {
        type: RECOVER_UNDERPROVISION,
        heir: reinstated_heir,
        deficit: deficit,
        method: ART_855_WATERFALL
    })

    return corrections
}
```

### Key Insight: Art. 918 vs Art. 855 Interaction

Invalid disinheritance feeds into the underprovision recovery pipeline (Art. 855). The reinstated heir was given nothing (or less than their legitime), so the Art. 855 three-source waterfall activates:
1. Undisposed estate first
2. Excess above other compulsory heirs' legitimes (pro rata)
3. Voluntary heirs' shares (pro rata)

---

## Representation After Disinheritance (Art. 923) — Deep Analysis

### Core Rule

When a disinheritance IS valid, the disinherited heir's children and descendants step into their place. They "preserve the rights of compulsory heirs with respect to the legitime."

### What "Preserve the Rights" Means

1. Representatives receive the **exact same legitime** that the disinherited heir would have received
2. Distribution among representatives is **per stirpes** (Art. 974)
3. The line count (n) does NOT change — the disinherited heir's "line" persists through representatives
4. The scenario does NOT change (e.g., T3 with 3 children stays T3 with 3 lines)

### The Usufruct/Administration Bar

Art. 923 ¶2: The disinherited parent "shall not have the usufruct or administration of the property which constitutes the legitime."

This means:
- If GC1 (age 10) inherits ₱2,000,000 by representing their disinherited parent LC2, LC2 cannot:
  - Use or enjoy the property (usufruct)
  - Manage the property or collect income from it (administration)
- A guardian OTHER than the disinherited parent must be appointed for minor representatives

**Engine output**: The engine flags `USUFRUCT_BAR` in the narrative for each representative heir. This is a post-distribution legal constraint, not a computation change.

### Recursive Representation

If the disinherited heir's child is also dead (predeceased the testator), representation continues recursively:

```
LC2 (disinherited) → GC1 (predeceased) → GGC1, GGC2 (alive)
                    → GC2 (alive)

Line split:
- LC2's line share: ₱2,000,000
  - GC1's sub-line: ₱1,000,000
    - GGC1: ₱500,000
    - GGC2: ₱500,000
  - GC2: ₱1,000,000
```

### What If ALL Descendants Are Also Dead or Incapacitated?

If the disinherited heir has no living descendants capable of representing them:
- The line is eliminated
- Line count decreases
- Scenario must be re-evaluated
- The "freed" legitime portion redistributes to remaining compulsory heirs through scenario change

### Descendants of Disinherited Spouse

Art. 923 says "children and descendants of the person disinherited shall take his or her place." However, this applies to representation of the **disinherited heir's compulsory heir rights**.

For a disinherited **spouse**: Art. 923 representation does NOT apply because:
- The surviving spouse category is a personal, non-transmissible status
- There is no "line" concept for spouses — spouse is always a single individual
- Children of the disinherited spouse may inherit in their own right as children/descendants of the testator, but NOT as representatives of the spouse

**Engine rule**: `if heir.category == SURVIVING_SPOUSE_GROUP: representation = NOT_APPLICABLE`

---

## Disinheritance vs. Unworthiness (Arts. 1032-1035)

### Structural Comparison

| Dimension | Disinheritance (Arts. 915-923) | Unworthiness (Arts. 1032-1035) |
|-----------|-------------------------------|-------------------------------|
| **Mechanism** | Voluntary act by testator in a will | Legal incapacity by operation of law |
| **Applies in** | Testate succession only | Both testate AND intestate |
| **Requires a will** | Yes (Art. 916) | No |
| **Who decides** | Testator | The law (judicial determination) |
| **Forgiveness** | Reconciliation (Art. 922) — automatic, no writing needed | Condonation in writing, or testator knew and still made the will (Art. 1033) |
| **Effect on descendants** | Art. 923: descendants represent and preserve legitime | Art. 1035: descendants of child/descendant "acquire his right to the legitime" |
| **Usufruct bar** | Yes — disinherited parent barred (Art. 923 ¶2) | Yes — excluded parent barred (Art. 1035 ¶2) |

### Overlapping Grounds

Many grounds appear in BOTH Arts. 919-921 AND Art. 1032:

| Disinheritance Ground | Unworthiness Ground | Overlap |
|-----------------------|--------------------|---------|
| 919(1): Attempt on life | 1032(2): Convicted of attempt on life | Near-identical |
| 919(2): Groundless accusation | 1032(3): False accusation | Near-identical |
| 919(3): Adultery with spouse | 1032(5): Adultery/concubinage with testator's spouse | Near-identical |
| 919(4): Fraud/undue influence on will | 1032(6): Fraud/undue influence causing will | Identical |
| 920(1): Abandonment/corruption | 1032(1): Abandonment/corruption of children | Near-identical |

### Engine Implications of Overlap

When the same act triggers BOTH disinheritance and unworthiness:

1. **Disinheritance is checked first** (in the testate validation pipeline)
2. If disinheritance is valid, the heir is excluded — unworthiness check is redundant
3. If disinheritance is invalid (e.g., reconciliation voided it), check unworthiness separately
4. Unworthiness can operate as a **backup** — if Art. 922 reconciliation voids the disinheritance, but Art. 1033 condonation was NOT given in writing, the heir may still be excluded for unworthiness

```
function resolve_disinheritance_and_unworthiness(
    heir: Heir,
    disinheritance: Disinheritance | null,
    unworthiness_grounds: UnworthinessGround[] | null
) -> ExclusionResult {

    // Try disinheritance first
    if disinheritance != null:
        result = validate_disinheritance(disinheritance, heir)
        if result == VALID:
            return EXCLUDED_BY_DISINHERITANCE

    // If disinheritance fails or doesn't exist, check unworthiness
    if unworthiness_grounds != null and len(unworthiness_grounds) > 0:
        for ground in unworthiness_grounds:
            if not ground.condoned_in_writing and not ground.known_when_will_made:
                return EXCLUDED_BY_UNWORTHINESS

    return NOT_EXCLUDED
}
```

### Art. 1033 vs. Art. 922: Forgiveness Mechanisms

| Art. 922 (Disinheritance) | Art. 1033 (Unworthiness) |
|--------------------------|------------------------|
| Reconciliation — any form, no writing required | Must be condoned **in writing** OR testator knew and still made the will |
| Automatic — voids disinheritance without any formal act | Requires affirmative written condonation OR a will made with knowledge |
| Between "offender and offended" | Between testator and unworthy person |

**Critical engine scenario**: Testator disinherits child for 919(1) (attempt on life). Later, they reconcile verbally. Art. 922 voids the disinheritance. But Art. 1032(2) (same act) still makes the child unworthy — and verbal reconciliation does NOT constitute "condonation in writing" per Art. 1033.

The engine should flag this scenario: `DISINHERITANCE_VOIDED_BUT_UNWORTHINESS_PERSISTS`

### Art. 1035 — Descendants of Unworthy Heir

> "If the person excluded from the inheritance by reason of incapacity should be a child or descendant of the decedent and should have children or descendants, the latter shall acquire his right to the legitime."

This parallels Art. 923 exactly:
- Descendants represent the excluded heir
- Excluded parent barred from usufruct/administration

**Engine treatment**: The representation logic is identical regardless of whether exclusion is by disinheritance (Art. 923) or unworthiness (Art. 1035).

---

## Interactions With Other Engine Components

### 1. Preterition Pipeline Priority

In the testate validation pipeline, preterition (Art. 854) is checked BEFORE disinheritance (Arts. 915-918). This order matters because:

- If a compulsory heir in the direct line is preterited, the entire institution is annulled
- A valid disinheritance PREVENTS preterition (the heir was not "omitted" — they were explicitly addressed)
- An invalid disinheritance does NOT prevent preterition for Art. 854 purposes

**Interaction**:
```
// If heir is "disinherited" in the will...
if will.has_disinheritance(heir):
    // Check validity
    if validate_disinheritance(disinheritance, heir) == VALID:
        // No preterition — heir was addressed and validly excluded
        heir.preterition_status = NOT_PRETERITED
    else:
        // Invalid disinheritance — but the testator DID address the heir
        // Art. 918 applies (partial annulment), NOT Art. 854 (total annulment)
        // The attempted disinheritance, even though invalid, shows the testator
        // did not "omit" the heir — they intentionally tried to exclude them
        heir.preterition_status = NOT_PRETERITED  // Art. 918 governs, not Art. 854
```

**Critical rule**: An attempted (but invalid) disinheritance triggers Art. 918 (partial annulment), NEVER Art. 854 (preterition/total annulment). The testator's intent to address the heir, even if legally defective, distinguishes this from total omission.

### 2. Free Portion Pipeline Interaction

After disinheritance is processed:
- Valid disinheritance WITH representation: FP computation unchanged (line persists)
- Valid disinheritance WITHOUT representation: FP must be recomputed (fewer compulsory heirs → larger FP)
- Invalid disinheritance: FP must be recomputed (reinstated heir reduces FP)

### 3. Intestate Distribution After Preterition + Valid Disinheritances

When preterition annuls the institution AND valid disinheritances exist:
- The valid disinheritances survive within the resulting intestate distribution
- The disinherited heir is still excluded from the intestate shares
- Art. 923 representation still applies

```
function distribute_after_preterition_with_disinheritances(
    estate: Decimal,
    heirs: Heir[],
    valid_disinheritances: Disinheritance[]
) -> Distribution {

    // Apply valid disinheritances to the heir pool
    for d in valid_disinheritances:
        heir = find_heir(d.heir_reference, heirs)
        apply_valid_disinheritance(d, heir, heirs, estate)

    // Now distribute intestate with the modified heir pool
    active_heirs = get_active_heirs(heirs)
    return compute_intestate_distribution(estate, active_heirs)
}
```

### 4. Collation Interaction

If the disinherited heir received inter vivos donations from the testator:
- **Valid disinheritance with representation**: The donation is collated against the REPRESENTATIVES' share (Art. 1064: grandchildren bring to collation what their parent would have)
- **Valid disinheritance without representation**: The donation may be inofficious — if it exceeds the free portion, it's subject to reduction (Art. 911(3))
- **Invalid disinheritance**: The donation is collated against the reinstated heir's legitime normally

---

## Data Model

### Disinheritance Struct

```
struct Disinheritance {
    heir_reference: HeirReference,        // who is being disinherited
    cause_code: DisinheritanceCause,      // which Art. 919/920/921 ground
    cause_specified_in_will: bool,        // Art. 916: cause stated in the will
    cause_proven: bool,                   // Art. 917: adjudicated as true (engine input)
    reconciliation_occurred: bool,        // Art. 922: post-offense reconciliation (engine input)
}
```

### DisinheritanceCause Enum (22 total)

```
enum DisinheritanceCause {
    // Art. 919 — Children/descendants (8 causes)
    CHILD_ATTEMPT_ON_LIFE,                  // 919(1)
    CHILD_GROUNDLESS_ACCUSATION,            // 919(2)
    CHILD_ADULTERY_WITH_SPOUSE,             // 919(3)
    CHILD_FRAUD_UNDUE_INFLUENCE,            // 919(4)
    CHILD_REFUSAL_TO_SUPPORT,               // 919(5)
    CHILD_MALTREATMENT,                     // 919(6)
    CHILD_DISHONORABLE_LIFE,                // 919(7)
    CHILD_CIVIL_INTERDICTION,               // 919(8)

    // Art. 920 — Parents/ascendants (8 causes)
    PARENT_ABANDONMENT_CORRUPTION,          // 920(1)
    PARENT_ATTEMPT_ON_LIFE,                 // 920(2)
    PARENT_GROUNDLESS_ACCUSATION,           // 920(3)
    PARENT_ADULTERY_WITH_SPOUSE,            // 920(4)
    PARENT_FRAUD_UNDUE_INFLUENCE,           // 920(5)
    PARENT_LOSS_PARENTAL_AUTHORITY,         // 920(6)
    PARENT_REFUSAL_TO_SUPPORT,              // 920(7)
    PARENT_ATTEMPT_ON_OTHER,               // 920(8)

    // Art. 921 — Spouse (6 causes)
    SPOUSE_ATTEMPT_ON_LIFE,                 // 921(1)
    SPOUSE_GROUNDLESS_ACCUSATION,           // 921(2)
    SPOUSE_FRAUD_UNDUE_INFLUENCE,           // 921(3)
    SPOUSE_CAUSE_LEGAL_SEPARATION,          // 921(4)
    SPOUSE_LOSS_PARENTAL_AUTHORITY,         // 921(5)
    SPOUSE_REFUSAL_TO_SUPPORT,              // 921(6)
}
```

### DisinheritanceEffect Struct

```
struct DisinheritanceEffect {
    heir: Heir,
    outcome: DisinheritanceOutcome,       // VALID_WITH_REP | VALID_NO_REP | INVALID
    representatives: Heir[] | null,       // Art. 923 descendants (if any)
    line_count_change: int,               // 0 if represented, -1 if not
    scenario_change: bool,                // true if scenario needs re-evaluation
    usufruct_bar: Heir | null,            // disinherited parent barred (Art. 923 ¶2)
    corrections: Correction[],            // for invalid disinheritance (Art. 918)
    narrative_flags: NarrativeFlag[],
}

enum DisinheritanceOutcome {
    VALID_WITH_REPRESENTATION,
    VALID_NO_REPRESENTATION,
    INVALID_NO_CAUSE_SPECIFIED,
    INVALID_CAUSE_NOT_PROVEN,
    INVALID_CAUSE_NOT_IN_CODE,
    INVALID_RECONCILIATION,
}
```

### UnworthinessGround Struct (for overlap handling)

```
struct UnworthinessGround {
    ground_code: UnworthinessCause,          // Art. 1032 ground
    condoned_in_writing: bool,               // Art. 1033
    known_when_will_made: bool,              // Art. 1033 alternative
}
```

---

## Edge Cases

### 1. Disinherited Heir Who Also Renounces

If a compulsory heir is validly disinherited AND separately renounces:
- **Disinheritance governs** — the renunciation is moot (they have nothing to renounce)
- Art. 977 (heirs who repudiate cannot be represented) does NOT apply because the exclusion is by disinheritance, not renunciation
- Art. 923 representation still applies (disinheritance triggers representation; renunciation does not)

### 2. Mutual Disinheritance (Parent ↔ Child)

If testator disinherits child, and child's will also disinherits the testator:
- Each disinheritance is evaluated independently against the respective decedent's estate
- No interaction between the two — they operate on different estates

### 3. Disinherited Heir's Own Intestate Rights

A validly disinherited heir loses ALL rights to the decedent's estate — both legitime AND intestate share. They cannot inherit by any path from this particular decedent.

However:
- They can still inherit from OTHER persons
- Their descendants can represent them per Art. 923

### 4. Partial Disinheritance

Can a testator disinherit a compulsory heir from only PART of their legitime? No.

Art. 915: Disinheritance deprives the heir of "his legitime" — the whole thing. There is no partial disinheritance under Philippine law. Either the disinheritance is valid and the heir loses their entire legitime, or it's invalid and they keep it all.

If the testator wants to reduce (not eliminate) a compulsory heir's share, the mechanism is to give them exactly their legitime and direct the free portion elsewhere — not disinheritance.

### 5. Disinheritance of Adopted Child

Adopted children (RA 8552, RA 11642) are in the LEGITIMATE_CHILD_GROUP. Art. 919 grounds apply. No special rules — adopted children are disinheritable on the same grounds as biological legitimate children.

If the adoption is rescinded before the testator's death:
- The child is no longer a compulsory heir of the adopter
- The disinheritance clause becomes moot (no compulsory heir to disinherit)

### 6. Art. 920(8) Built-in Reconciliation

Art. 920(8): "An attempt by one of the parents against the life of the other, **unless there has been a reconciliation between them**."

This has its own reconciliation exception independent of Art. 922. Even if the testator has not reconciled with the offending parent under Art. 922, if the parents reconciled between themselves regarding the specific act (attempt on life), the ground is negated.

Engine must model this as a separate boolean: `parents_reconciled_920_8: bool`

### 7. Multiple Disinheritances with Mixed Validity

Will disinherits 3 heirs: LC1 (valid), LC2 (invalid — wrong cause), LC3 (valid).
- LC1: excluded, Art. 923 representation checked
- LC2: reinstated, Art. 918 applies (partial annulment to restore LC2's legitime)
- LC3: excluded, Art. 923 representation checked
- Scenario recalculated with LC2 reinstated but LC1 and LC3 excluded

### 8. Disinheritance + Legal Separation Overlap (Spouse)

Art. 921(4) allows disinheritance of spouse for "giving cause for legal separation." But Art. 1002 already strips a guilty spouse of all intestate rights.

In **testate** succession: disinheritance is needed to remove the spouse's legitime. Art. 1002 alone only affects intestate rights. If there's a will, the testator needs Art. 921(4) to defeat the spouse's compulsory share.

In **intestate** succession: Art. 1002 automatically removes the guilty spouse. Disinheritance is impossible (no will).

### 9. Posthumous Disinheritance

Can a will disinherit a child not yet born at the time the will is executed? The will can include a disinheritance clause for future-born children if the cause pre-existed. However, practically, most grounds require acts by the child that cannot occur before birth.

The engine should accept such a clause but flag it for review: `POSTHUMOUS_DISINHERITANCE_REVIEW`

### 10. Reconciliation Timing — Before vs. After Will Execution

Art. 922 says "subsequent reconciliation" voids the disinheritance. "Subsequent" means after the offense, not after the will. So:

- Offense occurs → Reconciliation → Will executed with disinheritance clause → Death
  - Disinheritance VOID — reconciliation already occurred before the will was even made
- Offense occurs → Will executed with disinheritance clause → Reconciliation → Death
  - Disinheritance VOID — reconciliation after the will voids it automatically
- Offense occurs → Will executed → Death → (no reconciliation)
  - Disinheritance VALID

The engine only needs: `reconciliation_occurred: bool` (did reconciliation occur at any point after the offense and before death?).

---

## Test Cases

### Category A: Validity Checks

**A1: Valid disinheritance — all requirements met**
- Estate: ₱10,000,000
- Heirs: LC1, LC2 (legitimate children), S (spouse)
- Will disinherits LC2 for maltreatment (Art. 919(6))
- cause_specified_in_will: true, cause_proven: true, reconciliation_occurred: false
- Expected: LC2 excluded. If LC2 has no children: scenario changes from T3(n=2)+S to T2(n=1)+S
- LC1 legitime: ₱5,000,000 (Art. 888); S legitime: ₱2,500,000 (Art. 892 ¶1); FP: ₱2,500,000

**A2: Invalid — cause not specified**
- Same facts as A1, but cause_specified_in_will: false
- Expected: Art. 918 applies. LC2 reinstated. Scenario stays T3(n=2)+S
- LC1: ₱2,500,000; LC2: ₱2,500,000; S: ₱2,500,000; FP: ₱2,500,000

**A3: Invalid — wrong cause for heir category**
- Estate: ₱10,000,000
- Heirs: Parents (P1, P2), S (spouse)
- Will disinherits P1 citing cause_code: CHILD_MALTREATMENT (Art. 919(6) — wrong article for parents)
- Expected: Invalid — Art. 920 causes required for ascendants. P1 reinstated.

**A4: Invalid — cause not proven**
- Same as A1, cause_specified_in_will: true, cause_proven: false
- Expected: Art. 918 — LC2 reinstated.

**A5: Void by reconciliation**
- Same as A1 but reconciliation_occurred: true
- Expected: Art. 922 — disinheritance void. LC2 reinstated.

### Category B: Representation (Art. 923)

**B1: Valid disinheritance with 2 grandchildren representing**
- Estate: ₱12,000,000
- Heirs: LC1, LC2 (disinherited), LC3, S; LC2 has GC1, GC2
- Disinheritance valid (Art. 919(6), all requirements met)
- Expected: 3 lines persist. Collective LC legitime: ₱6,000,000 → ₱2,000,000/line
  - LC1: ₱2,000,000; GC1: ₱1,000,000; GC2: ₱1,000,000; LC3: ₱2,000,000; S: ₱2,000,000
  - FP: ₱4,000,000
  - Narrative: usufruct bar on LC2

**B2: Valid disinheritance, no descendants — scenario change**
- Estate: ₱10,000,000
- Heirs: LC1, LC2 (disinherited, no children), S
- Disinheritance valid
- Expected: LC2 eliminated. Scenario: T2 (1 LC + S)
  - LC1: ₱5,000,000; S: ₱2,500,000; FP: ₱2,500,000

**B3: Recursive representation through disinheritance**
- Estate: ₱12,000,000
- Heirs: LC1, LC2 (disinherited); LC2 has GC1 (predeceased, has GGC1 and GGC2) and GC2
- Expected: LC2's line: GC1's sub-line (GGC1: ₱1,000,000, GGC2: ₱1,000,000) + GC2: ₱2,000,000
  - Wait — 2 lines: LC1 and LC2's line
  - Collective LC legitime: ½ of ₱12M = ₱6,000,000. Per line: ₱3,000,000
  - LC2's line (₱3,000,000): GC1's sub-line (₱1,500,000) split between GGC1 (₱750,000) and GGC2 (₱750,000); GC2 gets ₱1,500,000
  - LC1: ₱3,000,000; GGC1: ₱750,000; GGC2: ₱750,000; GC2: ₱1,500,000

**B4: Disinherited spouse — no representation**
- Estate: ₱10,000,000
- Heirs: LC1, LC2, S (disinherited for Art. 921(4) — cause for legal separation)
- Disinheritance valid
- Expected: S excluded entirely. Scenario: T1 (2 LC only)
  - LC1: ₱2,500,000; LC2: ₱2,500,000; FP: ₱5,000,000
  - No representation for spouse

### Category C: Invalid Disinheritance + Art. 918

**C1: Invalid disinheritance — Art. 918 partial annulment**
- Estate: ₱10,000,000
- Heirs: LC1, LC2 (disinherited, but cause not proven), S
- Will: "I disinherit LC2. I leave ₱3,000,000 to charity C. The rest to LC1."
- Expected: LC2 reinstated. Scenario T3 (2 LC + S)
  - LC1 legitime: ₱2,500,000; LC2 legitime: ₱2,500,000; S legitime: ₱2,500,000
  - FP: ₱2,500,000. Charity C's ₱3,000,000 exceeds FP by ₱500,000 → reduced to ₱2,500,000
  - LC1 gets ₱2,500,000 (legitime); LC2 gets ₱2,500,000 (restored legitime); S gets ₱2,500,000; C gets ₱2,500,000

**C2: Art. 918 — dispositions preserved as long as they don't impair**
- Estate: ₱20,000,000
- Heirs: LC1, LC2 (disinherited, invalid), S
- Will: "I disinherit LC2. I leave ₱5,000,000 to charity C. I leave ₱8,000,000 to LC1."
- Expected: LC2 reinstated. Legitimes: LC1: ₱5M, LC2: ₱5M, S: ₱5M. FP: ₱5M
  - Charity C's ₱5M = FP → valid, not inofficious
  - LC1 was given ₱8M, exceeds their ₱5M legitime by ₱3M — but this must fit within FP
  - LC1's excess ₱3M comes from FP, which is already consumed by C → LC1's institution reduced
  - Final: LC1: ₱5M (legitime), LC2: ₱5M (restored), S: ₱5M, C: ₱5M

### Category D: Disinheritance + Preterition Interaction

**D1: Valid disinheritance prevents preterition**
- Estate: ₱12,000,000
- Heirs: LC1, LC2 (validly disinherited), LC3 (preterited — omitted from will)
- Will: "I disinherit LC2. I institute LC1 as sole heir."
- Expected: LC3 preterited → Art. 854 annuls institution. But LC2 remains validly disinherited.
  - Post-preterition distribution is intestate with LC2 excluded
  - Active heirs: LC1, LC3, S (if any). If no S: LC1 and LC3 split ₱12M equally → ₱6M each
  - LC2's representatives (if any) receive LC2's share per Art. 923

**D2: Invalid disinheritance does NOT trigger preterition**
- Estate: ₱12,000,000
- Heirs: LC1, LC2 (disinherited, invalid — cause not proven)
- Will: "I disinherit LC2. I leave everything to LC1."
- Expected: Art. 918 applies (NOT Art. 854). LC2 reinstated.
  - Partial annulment: LC1's institution reduced to accommodate LC2's legitime
  - LC1: ₱6M (legitimé ₱3M + FP), LC2: ₱3M (restored legitime), remaining FP to LC1 per will

### Category E: Unworthiness Overlap

**E1: Disinheritance voided by reconciliation, unworthiness persists**
- LC1 attempted against testator's life (Art. 919(1) / Art. 1032(2))
- Will disinherits LC1. Later, testator and LC1 reconcile (Art. 922 → disinheritance void)
- But reconciliation was verbal — no written condonation per Art. 1033
- Expected: Disinheritance INVALID (Art. 922). But unworthiness check: Art. 1032(2) applies, not condoned in writing → LC1 excluded for unworthiness (Art. 1035)
- Engine flag: `DISINHERITANCE_VOIDED_UNWORTHINESS_APPLIES`

**E2: Both disinheritance and unworthiness — disinheritance sufficient**
- LC1 committed fraud/undue influence on will (Art. 919(4) / Art. 1032(6))
- Will disinherits LC1. Cause proven. No reconciliation.
- Expected: Disinheritance VALID. Unworthiness check unnecessary but confirms exclusion.

### Category F: Scenario Changes

**F1: Last child disinherited — regime change**
- Estate: ₱10,000,000
- Heirs: LC1 (only legitimate child, disinherited, no descendants), P1, P2 (parents), S
- Disinheritance valid
- Expected: No legitimate descendants survive → ascendant regime activates
  - Scenario: T7 (Parents + Spouse)
  - P1: ₱2,500,000; P2: ₱2,500,000; S: ₱2,500,000; FP: ₱2,500,000

**F2: All compulsory heirs disinherited**
- Estate: ₱10,000,000
- Heirs: LC1 (disinherited, valid, no descendants), no other compulsory heirs
- Expected: Scenario T15 (no compulsory heirs). Entire estate is free portion.
  - Testator can dispose of entire ₱10,000,000 by will

**F3: Disinherited ascendant with surviving co-ascendant**
- Estate: ₱10,000,000
- Heirs: P1 (disinherited for Art. 920(7) — refusal to support), P2 (surviving parent), S
- Disinheritance valid. No representation in ascending line (Art. 972).
- Expected: P1 excluded. P2 is sole ascendant. Scenario depends on other heirs.
  - With S: T7 (Ascendants + Spouse) → P2: ₱5,000,000; S: ₱2,500,000; FP: ₱2,500,000

### Category G: Narrative Verification

**G1: Narrative for valid disinheritance with representation**
- Expected narrative for GC1 in test B1:
> **GC1 (grandchild, by representation)** receives **₱1,000,000**.
> GC1's parent LC2 was validly disinherited by the testator for maltreatment (Art. 919(6) of the Civil Code). Under Art. 923, the children and descendants of a disinherited heir take the disinherited heir's place and preserve the rights of compulsory heirs with respect to the legitime. The legitimate children's collective legitime is ½ of the estate (₱6,000,000), divided into 3 lines of ₱2,000,000 each. GC1 and GC2 share their parent's line equally by right of representation (Art. 974), receiving ₱1,000,000 each. Note: Under Art. 923 ¶2, the disinherited parent LC2 has no right to the usufruct or administration of GC1's inheritance.

**G2: Narrative for invalid disinheritance — Art. 918**
- Expected narrative for LC2 in test C1:
> **LC2 (legitimate child, reinstated)** receives **₱2,500,000**.
> The testator's will attempted to disinherit LC2, but the disinheritance was found invalid because the cause was not proven (Art. 917). Under Art. 918 of the Civil Code, an invalid disinheritance annuls the institution of heirs insofar as it prejudices the disinherited person. LC2 is reinstated as a compulsory heir entitled to a legitime. With 2 legitimate children and a surviving spouse, the collective legitime of the children is ½ of the estate (₱5,000,000), giving each child ₱2,500,000 (Art. 888).

**G3: Narrative for disinherited spouse**
- Expected narrative for S in test B4:
> **S (surviving spouse, disinherited)** receives **₱0**.
> The testator validly disinherited S for having given cause for legal separation (Art. 921(4) of the Civil Code). A validly disinherited compulsory heir is deprived of their legitime (Art. 915). Unlike children and descendants, there is no right of representation for a disinherited spouse — the spouse's share is simply eliminated from the distribution.

---

## Summary of Key Rules for the Engine

1. **Only in a will**: Disinheritance cannot exist in intestate succession (Art. 916)
2. **Cause must be specified AND from the correct article**: Art. 919 for children/descendants, Art. 920 for parents/ascendants, Art. 921 for spouse
3. **22 total grounds**: 8 + 8 + 6 across three articles
4. **Burden of proof on other heirs**: Engine accepts `cause_proven` as input (Art. 917)
5. **Reconciliation voids automatically**: No formal act needed (Art. 922)
6. **Art. 923 representation**: Descendants of disinherited children/ascendants step in; disinherited parent loses usufruct/administration
7. **No representation for spouse**: Spouse is a personal, non-representable category
8. **Invalid disinheritance ≠ preterition**: Art. 918 (partial annulment) vs Art. 854 (total annulment)
9. **Attempted invalid disinheritance prevents preterition**: The testator addressed the heir — total omission did not occur
10. **Unworthiness is a backup**: When disinheritance fails, Art. 1032 may still exclude the heir (but condonation rules differ)
11. **Multiple disinheritances**: Process all, then re-evaluate scenario once
12. **No partial disinheritance**: All or nothing — heir loses entire legitime or keeps it all
