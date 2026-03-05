# Testate Validation — Algorithm for Checking Will Compliance with Compulsory Heirs' Legitime

**Aspect**: testate-validation
**Wave**: 4 (Distribution Rules)
**Primary Legal Basis**: Arts. 842, 854-856, 886, 906, 908-912, 915-918, 922 (Civil Code)
**Depends On**: legitime-table, free-portion-rules, testate-institution, compulsory-heirs-categories, heir-concurrence-rules, representation-rights

---

## Overview

Testate validation is the engine's **gatekeeper phase**: before distributing the estate, the engine must check whether the will, taken as a whole, respects every compulsory heir's legitime. If it doesn't, the engine must correct the violation — either by annulling the institution (preterition), invalidating the disinheritance (defective grounds), or reducing inofficious dispositions.

This analysis covers:
1. The complete validation algorithm (the ordered sequence of checks)
2. Preterition detection (Art. 854) — already modeled in testate-institution; formalized here as Step 1
3. Disinheritance validation (Arts. 915-918, 922) — validating that each disinheritance is legally effective
4. Underprovision detection (Art. 855) — detecting compulsory heirs who receive less than their legitime
5. Inofficiousness detection and reduction (Arts. 908-912) — detecting and correcting dispositions that impair legitime
6. The three-phase reduction algorithm (Art. 911)
7. Art. 912 indivisible realty rule
8. The interaction between validation and the FP priority pipeline (Art. 895 ¶3)
9. Invalid disinheritance reconciliation (Art. 918)
10. Complete pseudocode for the validation pipeline
11. Data model additions

---

## Legal Basis

### Core Validation Articles

| Article | What It Governs | Key Text |
|---------|----------------|----------|
| **Art. 842** | Testator's constraint | "One who has compulsory heirs may dispose of his estate provided he does not contravene the provisions of this Code with regard to the legitime of said heirs." |
| **Art. 854** | Preterition | Omission of compulsory heirs in the direct line annuls the institution of heir; legacies/devises valid if not inofficious. |
| **Art. 855** | Underprovision | Share of an omitted or underprovided compulsory heir taken from undisposed estate, then pro rata from compulsory heirs, then from voluntary heirs. |
| **Art. 872** | Conditions on legitime void | "The testator cannot impose any charge, condition, or substitution whatsoever upon the legitimes..." — considered not imposed. |
| **Art. 906** | Disinheritance completeness | Compulsory heirs may be deprived of their legitime only through disinheritance for causes expressly stated by law. |
| **Art. 908** | Estate base for computation | Net estate at death + collatable donations at donation-time value = base for computing legitime. |
| **Art. 909** | Charging donations | To children → their legitime; to strangers → free portion. |
| **Art. 910** | IC donations | Illegitimate children's donations → their legitime. |
| **Art. 911** | Reduction order | (1) Respect donations, reduce testamentary dispositions first; (2) Pro rata within testamentary dispositions (preferred last); (3) Donations reduced reverse-chronologically if testamentary dispositions insufficient. |
| **Art. 912** | Indivisible realty | If reduction < ½ of property value → devisee keeps; if ≥ ½ → compulsory heirs take. Cash reimbursement either way. |
| **Art. 915** | Disinheritance definition | Compulsory heir may be deprived of legitime for causes expressly stated by law. |
| **Art. 916** | Disinheritance requirements | Must be through a will; legal cause must be specified. |
| **Art. 917** | Burden of proof | Other heirs must prove the truth of the cause if the disinherited heir denies it. |
| **Art. 918** | Invalid disinheritance | Without specified cause, or unproven cause, or cause not in the Code → annuls institution insofar as it prejudices the disinherited person; devises/legacies/other dispositions valid if not inofficious. |
| **Art. 922** | Reconciliation | Subsequent reconciliation voids the disinheritance. |

---

## The Validation Pipeline

The engine performs validation as a sequence of **ordered checks**. Each check can trigger a different correction mechanism. The order matters because some checks (preterition) can annul the entire institution, making subsequent checks moot.

```
VALIDATION PIPELINE (executed in strict order)

Check 1: PRETERITION (Art. 854)
  → If triggered: ANNUL institution, distribute intestate (preserving legacies/devises if not inofficious)
  → Pipeline TERMINATES — no further checks needed

Check 2: DISINHERITANCE VALIDITY (Arts. 915-918, 922)
  → If any disinheritance is invalid: REINSTATE the disinherited heir as compulsory heir
  → Recalculate scenario and legitimes with reinstated heirs
  → Art. 918: annul institution insofar as it prejudices reinstated heir

Check 3: LEGITIME FLOOR (Art. 842)
  → Compute each compulsory heir's legitime
  → For each compulsory heir: does the will give them ≥ their legitime?
  → If underprovided: trigger UNDERPROVISION recovery (Art. 855)

Check 4: INOFFICIOUSNESS (Arts. 908-912)
  → Does the total of all dispositions (testamentary + donations to strangers) exceed FP_disposable?
  → If yes: trigger REDUCTION per Art. 911 priority order

Check 5: CONDITIONS ON LEGITIME (Art. 872)
  → Strip all conditions/charges/substitutions from legitime portions
  → Only free portion share of compulsory heirs may be conditional
```

---

## Check 1: Preterition Detection (Art. 854)

Preterition is the **nuclear option** — it annuls the entire institution of heirs. Because of its severity, it is checked first.

### Rule

A compulsory heir **in the direct line** (legitimate children/descendants, or legitimate parents/ascendants) who is:
- Alive at the testator's death (or born after death but conceived before)
- Not instituted in the will
- Not given any legacy or devise
- Not validly disinherited

is a **preterited heir**. Preterition of ANY such heir annuls the institution.

### Scope Limitations

- **Only direct-line compulsory heirs**: surviving spouse and illegitimate children are NOT in the direct line — their omission is NOT preterition
- **Total omission required**: even a token legacy/devise (₱1 to LC3) prevents preterition (though it may trigger underprovision under Art. 855)
- **Adopted children count**: adopted children are in the direct line (legitimate children by legal fiction)

### Algorithm

```
function check_preterition(will: Will, heirs: Heir[]) -> PreteritionResult {

    direct_line_compulsory = filter(heirs, h =>
        h.is_compulsory AND
        h.is_alive_at_death AND
        (h.category == LEGITIMATE_CHILD_GROUP OR h.category == LEGITIMATE_ASCENDANT_GROUP)
    )

    preterited = []
    for each heir in direct_line_compulsory:
        is_in_will = (
            any(will.institutions, i => i.heir == heir) OR
            any(will.legacies, l => l.legatee == heir) OR
            any(will.devises, d => d.devisee == heir)
        )
        is_disinherited = any(will.disinheritances, d => d.heir == heir AND d.is_valid)

        if NOT is_in_will AND NOT is_disinherited:
            preterited.push(heir)

    if len(preterited) == 0:
        return NO_PRETERITION

    // PRETERITION FOUND — annul institution
    return PRETERITION {
        preterited_heirs: preterited,
        effect: ANNUL_ALL_INSTITUTIONS,
        // Legacies and devises survive, subject to inofficiousness
        surviving_legacies: will.legacies,
        surviving_devises: will.devises,
    }
}
```

### Post-Preterition Distribution

When preterition annuls the institution:

```
function distribute_after_preterition(
    estate: Decimal,
    will: Will,
    heirs: Heir[],
    preterition: PreteritionResult
) -> Distribution {

    // Step 1: Compute what compulsory heirs need under intestate rules
    intestate_distribution = compute_intestate_distribution(estate, heirs)

    // Step 2: Check if surviving legacies/devises impair compulsory heirs
    total_testamentary = sum(l.amount for l in will.legacies) + sum(d.value for d in will.devises)
    total_legitime = sum(compute_legitime(h, heirs) for h in compulsory_heirs(heirs))

    if total_testamentary > estate - total_legitime:
        // Legacies/devises are inofficious — reduce per Art. 911
        reduction = total_testamentary - (estate - total_legitime)
        reduce_testamentary_dispositions(will.legacies, will.devises, reduction)

    // Step 3: Remaining estate distributes intestate
    remaining = estate - sum(effective_amount(l) for l in will.legacies)
                       - sum(effective_value(d) for d in will.devises)
    intestate_shares = compute_intestate_distribution(remaining, heirs)

    return merge(intestate_shares, legacy_shares, devise_shares)
}
```

### Preterited Heir Predeceased (Art. 854 ¶2)

If the preterited heir dies before the testator:
- **No representative exists**: preterition is moot, institution stands
- **Representatives exist**: check whether the representatives are themselves preterited. If the preterited heir's line (through representation) is also not provided for in the will, preterition still applies through the representatives.

```
function check_preterition_with_predecease(
    heir: Heir,
    will: Will,
    heirs: Heir[]
) -> bool {
    if heir.is_alive_at_death:
        return is_preterited(heir, will)

    // Heir predeceased — check representatives
    representatives = get_representatives(heir, heirs)
    if len(representatives) == 0:
        return false  // No representative → institution stands (Art. 854 ¶2)

    // Check if ALL representatives are also omitted
    // If any representative is provided for, no preterition for this line
    for rep in representatives:
        if is_in_will(rep, will):
            return false
    return true  // All representatives omitted → preterition through representation
}
```

---

## Check 2: Disinheritance Validation (Arts. 915-923)

A disinheritance is the testator's explicit deprivation of a compulsory heir's legitime. The engine must validate each disinheritance before treating the disinherited heir as excluded.

### Validity Requirements

A disinheritance is **valid** only if ALL of:

1. **Made through a will** (Art. 916) — cannot be in a separate document
2. **Cause is specified** (Art. 916) — must state the reason
3. **Cause is one enumerated in the Code** (Arts. 919, 920, 921) — cause must be a recognized ground
4. **Cause is true** (Art. 917) — if denied by the disinherited heir, other heirs bear burden of proof
5. **No subsequent reconciliation** (Art. 922) — reconciliation after the offense voids disinheritance

### Engine Input Model

The engine cannot determine truth of cause or reconciliation — these are factual/judicial determinations. The engine accepts flags:

```
struct Disinheritance {
    heir: HeirReference,
    cause_code: DisinheritanceCause,    // which Art. 919/920/921 ground
    cause_specified_in_will: bool,       // Art. 916 compliance
    cause_proven: bool,                  // Art. 917: adjudicated as true (input)
    reconciliation_occurred: bool,       // Art. 922: post-offense reconciliation (input)
}

enum DisinheritanceCause {
    // Art. 919 — Children/descendants (8 causes)
    ATTEMPT_ON_LIFE,            // 919(1)
    GROUNDLESS_ACCUSATION,      // 919(2)
    ADULTERY_WITH_SPOUSE,       // 919(3)
    FRAUD_UNDUE_INFLUENCE,      // 919(4)
    REFUSAL_TO_SUPPORT,         // 919(5)
    MALTREATMENT,               // 919(6)
    DISHONORABLE_LIFE,          // 919(7)
    CIVIL_INTERDICTION,         // 919(8)

    // Art. 920 — Parents/ascendants (8 causes)
    ABANDONMENT_CORRUPTION,     // 920(1)
    PARENT_ATTEMPT_ON_LIFE,     // 920(2)
    PARENT_GROUNDLESS_ACCUSATION, // 920(3)
    PARENT_ADULTERY_WITH_SPOUSE,  // 920(4)
    PARENT_FRAUD_UNDUE_INFLUENCE, // 920(5)
    LOSS_OF_PARENTAL_AUTHORITY,   // 920(6)
    PARENT_REFUSAL_TO_SUPPORT,    // 920(7)
    PARENT_ATTEMPT_ON_OTHER,      // 920(8)

    // Art. 921 — Spouse (6 causes)
    SPOUSE_ATTEMPT_ON_LIFE,       // 921(1)
    SPOUSE_GROUNDLESS_ACCUSATION, // 921(2)
    SPOUSE_FRAUD_UNDUE_INFLUENCE, // 921(3)
    SPOUSE_CAUSE_LEGAL_SEPARATION, // 921(4)
    SPOUSE_LOSS_PARENTAL_AUTHORITY, // 921(5)
    SPOUSE_REFUSAL_TO_SUPPORT,     // 921(6)
}
```

### Validation Algorithm

```
function validate_disinheritance(d: Disinheritance, heir: Heir) -> DisinheritanceResult {

    // Check 1: Cause specified in will (Art. 916)
    if NOT d.cause_specified_in_will:
        return INVALID { reason: "Art. 916: cause not specified in will" }

    // Check 2: Cause matches heir category
    valid_causes = match heir.category {
        LEGITIMATE_CHILD_GROUP => Art919_causes,
        LEGITIMATE_ASCENDANT_GROUP => Art920_causes,
        SURVIVING_SPOUSE_GROUP => Art921_causes,
        ILLEGITIMATE_CHILD_GROUP => Art919_causes,  // Art. 919 applies to "children and
                                                     // descendants, legitimate as well as illegitimate"
    }
    if d.cause_code NOT IN valid_causes:
        return INVALID { reason: "Art. 919/920/921: cause not applicable to this heir category" }

    // Check 3: Cause proven (Art. 917)
    if NOT d.cause_proven:
        return INVALID { reason: "Art. 917: cause not proven" }

    // Check 4: No reconciliation (Art. 922)
    if d.reconciliation_occurred:
        return INVALID { reason: "Art. 922: subsequent reconciliation voids disinheritance" }

    return VALID
}
```

### Effect of Invalid Disinheritance (Art. 918)

When a disinheritance is invalid, Art. 918 produces a nuanced result — NOT the same as preterition:

> "Disinheritance without a specification of the cause, or for a cause the truth of which, if contradicted, is not proved, or which is not one of those set forth in this Code, shall **annul the institution of heirs insofar as it may prejudice the person disinherited**; but the devises and legacies and other testamentary dispositions shall be valid to such extent as will not impair the legitime."

**Key differences from preterition (Art. 854)**:

| | Preterition (Art. 854) | Invalid Disinheritance (Art. 918) |
|--|----------------------|----------------------------------|
| **What is annulled** | Entire institution | Only the institution **insofar as it prejudices** the invalidly disinherited heir |
| **Scope** | All institutions wiped out | Institutions partially annulled — only enough to restore the disinherited heir's legitime |
| **Legacies/devises** | Valid if not inofficious | Valid if they do not impair the restored heir's legitime |
| **Distribution method** | Entire estate goes intestate (minus legacies/devises) | Engine restores the heir's legitime by reducing other dispositions |

### Art. 918 Algorithm

```
function handle_invalid_disinheritance(
    will: Will,
    reinstated_heir: Heir,
    estate: Decimal,
    heirs: Heir[]
) -> Will {

    // Step 1: Reinstate the heir into the compulsory heir pool
    heirs_updated = add_back(heirs, reinstated_heir)

    // Step 2: Recalculate scenario with reinstated heir
    new_scenario = determine_scenario(heirs_updated)

    // Step 3: Compute new legitimes (all compulsory heirs including reinstated)
    new_legitimes = compute_all_legitimes(estate, heirs_updated, new_scenario)

    // Step 4: Compute new free portion
    new_fp = estate - sum(new_legitimes.values())

    // Step 5: Check if existing dispositions fit within new free portion
    total_dispositions = sum_all_will_dispositions(will)
    if total_dispositions > new_fp:
        // Reduce dispositions per Art. 911 to fit
        excess = total_dispositions - new_fp
        reduce_inofficious_dispositions(will, excess)

    // Step 6: Ensure reinstated heir gets at least their new legitime
    // If the will gave them nothing (because they were "disinherited"), they need
    // their full legitime from somewhere
    reinstated_provision = get_will_provision(will, reinstated_heir)
    if reinstated_provision < new_legitimes[reinstated_heir]:
        // Underprovision — apply Art. 855 recovery
        deficit = new_legitimes[reinstated_heir] - reinstated_provision
        recover_underprovision(deficit, will, heirs_updated)

    return will  // modified
}
```

### Representation After Disinheritance (Art. 923)

When a disinheritance IS valid, the disinherited heir's children/descendants take their place:

```
function apply_valid_disinheritance(d: Disinheritance, heir: Heir, heirs: Heir[]) {
    // Remove disinherited heir from heir pool
    remove(heirs, heir)

    // Art. 923: Children and descendants of the disinherited take their place
    representatives = get_descendants(heir, heirs)
    if len(representatives) > 0:
        // Representatives preserve the compulsory heir rights to the legitime
        // They step into the disinherited parent's "line"
        for rep in representatives:
            rep.inherits_by = REPRESENTATION_OF_DISINHERITED
            rep.represented_ancestor = heir
        // The line count (n) stays the same — 1 line with representatives
    else:
        // No descendants — disinherited heir's legitime goes to:
        // Other compulsory heirs of the same class (effectively re-evaluating scenario)
        // The line count (n) decreases by 1
        // Scenario may change (e.g., T3 with n=3 becomes T3 with n=2)
    }

    // Art. 923 ¶2: Disinherited parent has NO usufruct or administration
    // of what the representatives inherit — engine flags this in narrative
}
```

---

## Check 3: Legitime Floor — Underprovision Detection (Art. 855)

After preterition and disinheritance are resolved, every surviving compulsory heir must receive at least their legitime. A compulsory heir who appears in the will but receives less than their legitime is **underprovided**.

### Detection

```
function detect_underprovision(
    will: Will,
    heirs: Heir[],
    legitimes: Map<Heir, Decimal>,
    estate: Decimal
) -> List<Underprovision> {

    underprovisions = []

    for each (heir, legitime) in legitimes:
        // Sum everything the will gives this heir
        will_provision = 0

        // From institution (if any)
        for inst in will.institutions:
            if inst.heir == heir:
                will_provision += compute_institution_value(inst, estate)

        // From legacies (if any)
        for leg in will.legacies:
            if leg.legatee == heir:
                will_provision += leg.effective_amount

        // From devises (if any)
        for dev in will.devises:
            if dev.devisee == heir:
                will_provision += dev.effective_value

        if will_provision < legitime:
            underprovisions.push(Underprovision {
                heir: heir,
                will_provision: will_provision,
                legitime: legitime,
                deficit: legitime - will_provision,
            })

    return underprovisions
}
```

### Underprovision Recovery (Art. 855 Waterfall)

Art. 855 specifies a **three-source waterfall** to make up the deficit:

```
function recover_underprovision(
    underprovisions: List<Underprovision>,
    will: Will,
    estate: Decimal,
    heirs: Heir[],
    legitimes: Map<Heir, Decimal>
) -> RecoveryPlan {

    total_deficit = sum(u.deficit for u in underprovisions)

    // === SOURCE 1: Undisposed estate ===
    // Property not covered by the will (Art. 855: "part of the estate not disposed of")
    total_disposed = sum_all_will_dispositions(will)
    undisposed = estate - total_disposed

    from_undisposed = min(total_deficit, max(undisposed, 0))
    remaining_deficit = total_deficit - from_undisposed

    if remaining_deficit <= 0:
        return plan_from_undisposed(underprovisions, from_undisposed)

    // === SOURCE 2: Other compulsory heirs' shares (pro rata) ===
    // ONLY the excess above each compulsory heir's own legitime can be taken
    excess_map = {}
    for each (heir, legitime) in legitimes:
        if heir NOT IN underprovisions:
            heir_provision = get_will_provision(will, heir)
            if heir_provision > legitime:
                excess_map[heir] = heir_provision - legitime

    total_excess = sum(excess_map.values())
    from_compulsory = min(remaining_deficit, total_excess)

    if from_compulsory > 0:
        for each (heir, excess) in excess_map:
            heir_reduction = from_compulsory * (excess / total_excess)
            reduce_heir_share(will, heir, heir_reduction)

    remaining_deficit -= from_compulsory

    if remaining_deficit <= 0:
        return plan

    // === SOURCE 3: Voluntary heirs' shares (pro rata) ===
    voluntary_shares = get_all_voluntary_shares(will)
    total_voluntary = sum(voluntary_shares.values())
    from_voluntary = min(remaining_deficit, total_voluntary)

    if from_voluntary > 0:
        for each (heir, share) in voluntary_shares:
            heir_reduction = from_voluntary * (share / total_voluntary)
            reduce_heir_share(will, heir, heir_reduction)

    remaining_deficit -= from_voluntary

    // If remaining_deficit > 0 at this point, the estate is overcommitted
    // This should not happen if legitimes are computed correctly
    assert remaining_deficit == 0, "Estate computation error"

    return plan
}
```

### Interaction: Omission Without Preterition

A compulsory heir NOT in the direct line (surviving spouse, illegitimate children) can be completely omitted from the will without triggering preterition. They are still entitled to their legitime — the engine treats this as maximum underprovision (will_provision = 0, deficit = full legitime).

```
// Spouse omitted from will → NOT preterition (Art. 854 only covers direct line)
// But spouse still gets their full legitime via Art. 855 recovery
if heir.category == SURVIVING_SPOUSE_GROUP AND NOT is_in_will(heir, will):
    underprovisions.push(Underprovision {
        heir: heir,
        will_provision: 0,
        legitime: spouse_legitime,
        deficit: spouse_legitime,
    })
```

---

## Check 4: Inofficiousness Detection and Reduction (Arts. 908-912)

### The Collation-Adjusted Estate (Art. 908)

Before checking inofficiousness, the engine computes the proper estate base:

```
function compute_validation_estate_base(
    net_estate_at_death: Decimal,
    donations: List<Donation>
) -> Decimal {
    // Art. 908: Add back collatable donations at donation-time value
    collatable_sum = sum(d.value_at_time_of_donation for d in donations where d.is_collatable)
    return net_estate_at_death + collatable_sum
}
```

### Detection

```
function detect_inofficiousness(
    estate_base: Decimal,       // collation-adjusted per Art. 908
    actual_estate: Decimal,     // net estate at death (what's actually distributable)
    total_legitimes: Decimal,   // sum of all compulsory heirs' legitimes
    testamentary_to_strangers: Decimal,  // will dispositions to non-compulsory heirs
    donations_to_strangers: Decimal      // inter vivos donations to non-heirs
) -> InofficiousnessResult {

    // FP_disposable = estate base - total legitimes
    fp_disposable = estate_base - total_legitimes

    // Total charged to free portion:
    // (1) Testamentary dispositions to voluntary heirs
    // (2) Donations to strangers (Art. 909 ¶2)
    total_charged_to_fp = testamentary_to_strangers + donations_to_strangers

    if total_charged_to_fp <= fp_disposable:
        return NOT_INOFFICIOUS

    excess = total_charged_to_fp - fp_disposable
    return INOFFICIOUS {
        excess: excess,
        requires_reduction: true
    }
}
```

### Art. 911 Three-Phase Reduction Algorithm

When dispositions are inofficious, they are reduced in strict priority order:

```
function reduce_inofficious(
    excess: Decimal,
    will: Will,
    donations: List<Donation>
) -> ReductionResult {

    remaining = excess
    reductions = []

    // ══════════════════════════════════════════════════
    // PHASE 1: Reduce testamentary devises and legacies
    // Art. 911(1): "Donations shall be respected as long
    // as the legitime can be covered, reducing or annulling,
    // if necessary, the devises or legacies made in the will"
    // ══════════════════════════════════════════════════

    // Step 1a: Separate preferred and non-preferred dispositions
    // Art. 911(2): testator may designate preferences
    non_preferred = filter(will.legacies + will.devises, d => NOT d.is_preferred)
    preferred = filter(will.legacies + will.devises, d => d.is_preferred)

    // Step 1b: Reduce NON-PREFERRED pro rata
    non_pref_total = sum(d.effective_amount for d in non_preferred)
    if remaining > 0 AND non_pref_total > 0:
        ratio = min(remaining / non_pref_total, Rational(1, 1))
        for d in non_preferred:
            cut = d.effective_amount * ratio
            reductions.push(Reduction {
                disposition: d,
                original: d.effective_amount,
                reduction: cut,
                remaining: d.effective_amount - cut,
                basis: "Art. 911(2): non-preferred legacy/devise reduced pro rata"
            })
            remaining -= cut

    // Step 1c: Reduce PREFERRED pro rata (only if non-preferred exhausted)
    if remaining > 0:
        pref_total = sum(d.effective_amount for d in preferred)
        if pref_total > 0:
            ratio = min(remaining / pref_total, Rational(1, 1))
            for d in preferred:
                cut = d.effective_amount * ratio
                reductions.push(Reduction {
                    disposition: d,
                    original: d.effective_amount,
                    reduction: cut,
                    remaining: d.effective_amount - cut,
                    basis: "Art. 911(2): preferred legacy/devise reduced (non-preferred exhausted)"
                })
                remaining -= cut

    // ══════════════════════════════════════════════════
    // PHASE 2: Reduce voluntary institutions (if any)
    // Voluntary heirs instituted as universal heirs in
    // the will are effectively receiving from the FP.
    // They must be reduced before donations.
    // ══════════════════════════════════════════════════

    if remaining > 0:
        voluntary_institutions = filter(will.institutions, i => NOT i.heir.is_compulsory)
        vol_inst_total = sum(i.effective_share for i in voluntary_institutions)
        if vol_inst_total > 0:
            ratio = min(remaining / vol_inst_total, Rational(1, 1))
            for i in voluntary_institutions:
                cut = i.effective_share * ratio
                reductions.push(Reduction {
                    disposition: i,
                    original: i.effective_share,
                    reduction: cut,
                    remaining: i.effective_share - cut,
                    basis: "Art. 911(1): voluntary institution reduced"
                })
                remaining -= cut

    // ══════════════════════════════════════════════════
    // PHASE 3: Reduce inter vivos donations
    // Art. 911(1): donations are reduced LAST
    // Reduced in reverse chronological order (most recent first)
    // ══════════════════════════════════════════════════

    if remaining > 0:
        sorted_donations = sort(donations, by: date, order: DESCENDING)
        for d in sorted_donations:
            if remaining <= 0: break
            cut = min(d.value_at_time_of_donation, remaining)
            reductions.push(Reduction {
                donation: d,
                original: d.value_at_time_of_donation,
                reduction: cut,
                remaining: d.value_at_time_of_donation - cut,
                basis: "Art. 911(1): donation reduced (testamentary dispositions exhausted)"
            })
            remaining -= cut

    return ReductionResult {
        reductions: reductions,
        unresolved_excess: remaining,  // should be 0
    }
}
```

### Art. 912: Indivisible Real Property Special Rule

When a devise of real property must be partially reduced but the property cannot be divided:

```
function handle_indivisible_realty(
    property_value: Decimal,
    reduction_amount: Decimal,
    devisee: Heir,
    compulsory_heirs: Heir[]
) -> IndivisibleRealtyResult {

    if reduction_amount < property_value * Rational(1, 2):
        // Reduction < ½ value → devisee KEEPS the property
        return IndivisibleRealtyResult {
            property_awarded_to: devisee,
            cash_reimbursement: CashReimbursement {
                from: devisee,
                to: compulsory_heirs,
                amount: reduction_amount,
            },
            narrative: format!(
                "The devise of {} (valued at ₱{}) must be reduced by ₱{}. " +
                "Under Art. 912, since the reduction (₱{}) is less than half the property value (₱{}), " +
                "{} keeps the property and reimburses the compulsory heirs ₱{} in cash.",
                property_desc, property_value, reduction_amount,
                reduction_amount, property_value / 2,
                devisee.name, reduction_amount
            ),
        }
    else:
        // Reduction ≥ ½ value → compulsory heirs TAKE the property
        devisee_reimbursement = property_value - reduction_amount
        return IndivisibleRealtyResult {
            property_awarded_to: compulsory_heirs,
            cash_reimbursement: CashReimbursement {
                from: compulsory_heirs,
                to: devisee,
                amount: devisee_reimbursement,
            },
            narrative: format!(
                "The devise of {} (valued at ₱{}) must be reduced by ₱{}. " +
                "Under Art. 912, since the reduction (₱{}) absorbs half or more of the property value (₱{}), " +
                "the compulsory heirs take the property and reimburse {} ₱{} in cash.",
                property_desc, property_value, reduction_amount,
                reduction_amount, property_value / 2,
                devisee.name, devisee_reimbursement
            ),
        }
}
```

---

## Check 5: Conditions on Legitime (Art. 872)

This check strips any conditions imposed on the legitime portion. Already modeled in testate-institution, formalized here for completeness:

```
function strip_legitime_conditions(
    will: Will,
    heirs: Heir[],
    legitimes: Map<Heir, Decimal>
) -> List<ConditionStrip> {

    strips = []

    for inst in will.institutions:
        if inst.heir.is_compulsory AND len(inst.conditions) > 0:
            // Art. 872: conditions on legitime are "considered as not imposed"
            heir_legitime = legitimes[inst.heir]
            institution_value = compute_institution_value(inst, estate)

            if institution_value <= heir_legitime:
                // Entire institution is within legitime → ALL conditions stripped
                strips.push(ConditionStrip {
                    heir: inst.heir,
                    stripped_conditions: inst.conditions,
                    reason: "Art. 872: entire institution within legitime, all conditions void"
                })
                inst.conditions = []
            else:
                // Institution exceeds legitime → split into two portions
                // Legitime portion: unconditional
                // Excess (from free portion): conditions MAY apply
                strips.push(ConditionStrip {
                    heir: inst.heir,
                    stripped_conditions: inst.conditions,  // stripped from legitime portion
                    retained_on_fp: inst.conditions,       // retained on FP excess
                    legitime_amount: heir_legitime,
                    fp_excess: institution_value - heir_legitime,
                    reason: "Art. 872: conditions stripped from legitime portion (₱" +
                            heir_legitime + "); retained on free portion excess (₱" +
                            (institution_value - heir_legitime) + ")"
                })

    return strips
}
```

---

## The Complete Validation Pipeline — Pseudocode

```
function validate_will(
    estate: Decimal,            // net distributable estate
    will: Will,                 // parsed will
    heirs: Heir[],              // classified heirs (from Steps 1-1.5)
    donations: List<Donation>,  // inter vivos donations for collation
    decedent: Decedent
) -> ValidationResult {

    result = ValidationResult { valid: true, corrections: [] }

    // ═══════════════════════════════════════════════
    // STEP 0: Compute collation-adjusted estate base
    // ═══════════════════════════════════════════════
    estate_base = compute_validation_estate_base(estate, donations)

    // ═══════════════════════════════════════════════
    // CHECK 1: PRETERITION (Art. 854)
    // ═══════════════════════════════════════════════
    preterition = check_preterition(will, heirs)
    if preterition.exists:
        result.valid = false
        result.succession_type = INTESTATE_BY_PRETERITION
        result.corrections.push(PRETERITION_ANNULMENT {
            preterited_heirs: preterition.preterited_heirs,
            surviving_legacies: will.legacies,
            surviving_devises: will.devises,
        })
        // Pipeline terminates — no further checks
        return result

    // ═══════════════════════════════════════════════
    // CHECK 2: DISINHERITANCE VALIDITY (Arts. 915-922)
    // ═══════════════════════════════════════════════
    for each d in will.disinheritances:
        heir = resolve_heir(d.heir, heirs)
        validity = validate_disinheritance(d, heir)

        if validity == VALID:
            // Apply: remove heir, activate representation (Art. 923)
            apply_valid_disinheritance(d, heir, heirs)
        else:
            // Invalid disinheritance → reinstate heir (Art. 918)
            result.valid = false
            result.corrections.push(DISINHERITANCE_INVALID {
                heir: heir,
                reason: validity.reason,
                effect: "Art. 918: institution annulled insofar as it prejudices this heir"
            })
            handle_invalid_disinheritance(will, heir, estate_base, heirs)

    // ═══════════════════════════════════════════════
    // RECOMPUTE AFTER DISINHERITANCE RESOLUTION
    // ═══════════════════════════════════════════════
    scenario = determine_scenario(heirs)
    legitimes = compute_all_legitimes(estate_base, heirs, decedent)
    total_legitime = sum(legitimes.values())
    fp_disposable = estate_base - total_legitime

    // ═══════════════════════════════════════════════
    // CHECK 3: LEGITIME FLOOR — UNDERPROVISION (Art. 855)
    // ═══════════════════════════════════════════════
    underprovisions = detect_underprovision(will, heirs, legitimes, estate_base)
    if len(underprovisions) > 0:
        result.valid = false
        for u in underprovisions:
            result.corrections.push(UNDERPROVISION {
                heir: u.heir,
                will_gives: u.will_provision,
                entitled_to: u.legitime,
                deficit: u.deficit,
            })
        recover_underprovision(underprovisions, will, estate_base, heirs, legitimes)

    // ═══════════════════════════════════════════════
    // CHECK 4: INOFFICIOUSNESS (Arts. 908-912)
    // ═══════════════════════════════════════════════

    // Compute total charged to free portion
    testamentary_to_voluntary = sum_voluntary_dispositions(will)
    donations_to_strangers = sum(d.value for d in donations where d.is_to_stranger)

    inofficiousness = detect_inofficiousness(
        estate_base, estate, total_legitime,
        testamentary_to_voluntary, donations_to_strangers
    )

    if inofficiousness.requires_reduction:
        result.valid = false
        reduction = reduce_inofficious(
            inofficiousness.excess,
            will,
            filter(donations, d => d.is_to_stranger)
        )
        result.corrections.push(INOFFICIOUS_REDUCTION {
            excess: inofficiousness.excess,
            reductions: reduction.reductions,
        })

        // Handle Art. 912 for any reduced devises of real property
        for r in reduction.reductions:
            if r.disposition.type == DEVISE AND r.disposition.property.is_indivisible:
                realty_result = handle_indivisible_realty(
                    r.disposition.property.value,
                    r.reduction,
                    r.disposition.devisee,
                    compulsory_heirs(heirs)
                )
                result.corrections.push(INDIVISIBLE_REALTY {
                    result: realty_result,
                })

    // ═══════════════════════════════════════════════
    // CHECK 5: CONDITIONS ON LEGITIME (Art. 872)
    // ═══════════════════════════════════════════════
    condition_strips = strip_legitime_conditions(will, heirs, legitimes)
    if len(condition_strips) > 0:
        for cs in condition_strips:
            result.corrections.push(CONDITION_STRIPPED {
                heir: cs.heir,
                conditions: cs.stripped_conditions,
                reason: cs.reason,
            })

    return result
}
```

---

## Interaction with FP Priority Pipeline (Art. 895 ¶3)

The validation must be aware that the **spouse's legitime is satisfied first** from the free portion before the illegitimate children's cap is applied. This means:

1. Inofficiousness is measured against `FP_disposable` (after all compulsory heir deductions), NOT `FP_gross`
2. If the testator gives a legacy to a stranger and there are illegitimate children whose cap reduces FP_disposable to 0, the legacy is **entirely inofficious** — even if FP_gross was ½ of the estate

```
// Example: E = ₱10M, 1 LC, 3 IC, Spouse
// FP_gross = ₱5M
// Spouse = ₱2.5M (from FP)
// FP_after_spouse = ₱2.5M
// IC cap = ₱2.5M (3 ICs capped at remaining FP)
// FP_disposable = ₱0
//
// If will says "₱1M to friend F" → ENTIRELY inofficious
// F gets ₱0 after reduction
```

The engine must use the correctly computed `FP_disposable` from the free-portion-rules pipeline, NOT a naive `estate - total_legitime`.

---

## Edge Cases

### E1: Will Gives Compulsory Heir MORE Than Legitime

Not a violation. The excess comes from the free portion. The testator is free to favor one compulsory heir over another, provided all get at least their legitime.

```
// 2 children, E = ₱10M
// Will: "80% to LC1, 20% to LC2"
// LC1 legitime = ₱2.5M → gets ₱8M (₱2.5M from legitime, ₱5.5M from FP) — VALID
// LC2 legitime = ₱2.5M → gets ₱2M — UNDERPROVIDED by ₱500K → Art. 855 applies
```

### E2: Multiple Underprovisions Simultaneously

When several compulsory heirs are underprovided, the engine must compute ALL deficits before applying the waterfall. Recovery sources are shared pro rata among all underprovided heirs.

```
function recover_multiple_underprovisions(
    underprovisions: List<Underprovision>,
    ...
) {
    total_deficit = sum(u.deficit for u in underprovisions)
    // Apply waterfall to total_deficit
    // Then allocate recovered amounts pro rata among underprovided heirs
    for u in underprovisions:
        u.recovery = recovered_total * (u.deficit / total_deficit)
}
```

### E3: Disinheritance + Preterition Interaction

If the will disinherits LC2 but also omits LC3 (neither mentioned nor disinherited), preterition of LC3 takes priority. The entire institution is annulled per Art. 854, and the disinheritance of LC2 is assessed separately in the resulting intestate distribution (if the disinheritance is valid, LC2 is still excluded; LC2's descendants represent per Art. 923).

```
// Check order matters:
// 1. Check preterition first (LC3 is preterited → annul institution)
// 2. Within the resulting intestate distribution, LC2's disinheritance still applies
//    (valid disinheritance is effective even in intestate succession)
```

### E4: Legacy to Compulsory Heir AS Free Portion Share

A compulsory heir may receive BOTH their legitime AND a legacy from the free portion. The legacy is NOT inofficious unless total dispositions exceed FP_disposable. The engine should not double-count: if the will says "₱2M legacy to LC1" and LC1's legitime is ₱3M, LC1 gets ₱3M (legitime) + ₱2M (legacy) = ₱5M — the ₱2M is charged to the free portion.

### E5: Zero Free Portion — Any Voluntary Disposition Is Inofficious

When FP_disposable = 0 (common in T5a with m≥2), the validation should immediately reduce ALL voluntary dispositions to zero without further calculation.

```
if fp_disposable == 0:
    for d in voluntary_dispositions(will):
        reduce_to_zero(d)
    return
```

### E6: Donation Exceeds Heir's Legitime (Art. 909)

When a donation to a compulsory heir exceeds their legitime:
- The excess is charged to the free portion (Art. 909)
- If the excess consumes the free portion, it is inofficious
- But the donation itself is NOT returned — only future testamentary dispositions are affected

```
// E = ₱10M (at death), donation of ₱4M to LC1
// Collated estate = ₱14M
// LC1 legitime = ₱7M (½ × ₱14M, only child)
// LC1 already received ₱4M → needs ₱3M more
// FP on collated estate = ₱7M
// Donation charged: ₱0 (within legitime, not against FP)
//
// But if LC1's legitime were ₱3M and they received ₱4M:
// Excess = ₱1M charged to FP
// FP_disposable reduced by ₱1M
```

### E7: Art. 918 vs Art. 854 — Invalid Disinheritance Is Not Preterition

If the will says "I disinherit LC2" but the disinheritance is invalid (bad cause, not proven), this is NOT preterition because the testator did not "omit" LC2 — they explicitly addressed LC2 (even if ineffectively). Art. 918 applies, not Art. 854. The institution is annulled only "insofar as it may prejudice" LC2.

### E8: Will With Mixed Valid and Invalid Disinheritances

If the will validly disinherits LC2 and invalidly disinherits LC3:
- LC2 is excluded (Art. 915); LC2's children represent (Art. 923)
- LC3 is reinstated (Art. 918); institution adjusted to give LC3 their legitime
- The scenario computation must account for both: LC2's line (through representatives) and LC3's full compulsory share

### E9: Art. 911(3) — Usufruct/Life Annuity Option

If the free portion is given as a usufruct or life annuity, compulsory heirs can choose between:
- (a) Complying with the testamentary provision
- (b) Delivering the disposable portion in full ownership to the beneficiary

This is a human decision outside the deterministic engine's scope. The engine should flag this scenario:

```
if any_disposition_is_usufruct_or_annuity(will):
    result.flags.push(REQUIRES_MANUAL_ELECTION {
        article: "Art. 911(3)",
        description: "Compulsory heirs must choose between honoring the usufruct/annuity " +
                     "or delivering the disposable portion outright to the beneficiary"
    })
```

### E10: Reconciliation Timing (Art. 922)

Reconciliation after the disinheritance cause but before the testator's death voids the disinheritance. Reconciliation after the testator's death has no effect. The engine accepts `reconciliation_occurred` as a boolean input without resolving timing questions.

---

## Data Model Additions

```
struct ValidationResult {
    valid: bool,                          // true if will needs no correction
    corrections: List<Correction>,        // ordered list of corrections applied
    succession_type: SuccessionType,      // TESTATE, INTESTATE_BY_PRETERITION, MIXED
    flags: List<ManualFlag>,              // scenarios requiring human decision
}

enum Correction {
    PRETERITION_ANNULMENT {
        preterited_heirs: List<Heir>,
        surviving_legacies: List<Legacy>,
        surviving_devises: List<Devise>,
    },
    DISINHERITANCE_INVALID {
        heir: Heir,
        reason: String,
        effect: String,
    },
    UNDERPROVISION {
        heir: Heir,
        will_gives: Decimal,
        entitled_to: Decimal,
        deficit: Decimal,
        recovery_sources: List<RecoverySource>,
    },
    INOFFICIOUS_REDUCTION {
        excess: Decimal,
        reductions: List<Reduction>,
    },
    INDIVISIBLE_REALTY {
        property: AssetRef,
        result: IndivisibleRealtyResult,
    },
    CONDITION_STRIPPED {
        heir: Heir,
        conditions: List<Condition>,
        reason: String,
    },
}

struct Reduction {
    disposition: Disposition,   // which legacy/devise/donation/institution
    original: Decimal,          // original amount
    reduction: Decimal,         // amount reduced
    remaining: Decimal,         // amount after reduction
    basis: String,              // legal citation for the reduction
}

struct IndivisibleRealtyResult {
    property_awarded_to: AwardTarget,   // "devisee" or "compulsory_heirs"
    cash_reimbursement: CashReimbursement,
    narrative: String,
}

struct CashReimbursement {
    from: AwardTarget,
    to: AwardTarget,
    amount: Decimal,
}

enum AwardTarget {
    DEVISEE(Heir),
    COMPULSORY_HEIRS(List<Heir>),
}

struct ManualFlag {
    article: String,
    description: String,
}

struct Underprovision {
    heir: Heir,
    will_provision: Decimal,
    legitime: Decimal,
    deficit: Decimal,
}
```

---

## Test Implications

### Preterition Tests

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| T-TV-1 | Standard preterition | 3 LCs, will institutes only LC1 and LC2. LC3 omitted. E = ₱12M. | Preterition → institution annulled → intestate: each heir (3 LC + S if present) gets equal share. |
| T-TV-2 | Spouse omission ≠ preterition | 1 LC, spouse S. Will: "All to LC1." S omitted. E = ₱10M. | NOT preterition. LC1 gets max(₱5M legitime, will share). S gets ₱2.5M legitime via Art. 855. |
| T-TV-3 | IC omission ≠ preterition | 2 LC, 1 IC. Will: "½ each to LC1 and LC2." IC omitted. E = ₱10M. | NOT preterition (IC not in direct line). IC gets legitime via Art. 855. |
| T-TV-4 | Token legacy prevents preterition | 2 LC. Will: "All to LC1. ₱1 to LC2." E = ₱10M. | NOT preterition (LC2 received something). But LC2 underprovided by ₱2,499,999 → Art. 855. |
| T-TV-5 | Preterited heir predeceased, no reps | 2 LC. LC2 predeceased, no children. Will: "All to LC1." E = ₱10M. | No preterition (Art. 854 ¶2) → institution valid → LC1 gets ₱10M. |
| T-TV-6 | Preterited heir predeceased, with reps | 2 LC. LC2 predeceased, has GC1. Will: "All to LC1." GC1 not mentioned. E = ₱10M. | Preterition through representation → institution annulled → intestate. |
| T-TV-7 | Adopted child omitted | 2 biological LC + 1 adopted AC. Will: "All to LC1 and LC2." AC omitted. E = ₱12M. | Preterition (adopted = legitimate in direct line) → annulled → intestate: 4 shares (3 children + S if present). |

### Disinheritance Validation Tests

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| T-TV-8 | Valid disinheritance | 3 LC. Will: disinherit LC2 for maltreatment (Art. 919(6)), proven. LC2 has GC1, GC2. E = ₱12M. | Valid. LC2 excluded. GC1+GC2 represent. 3 lines → ₱2M/line. GC1=₱1M, GC2=₱1M. |
| T-TV-9 | Invalid disinheritance — no cause specified | 3 LC. Will: "I disinherit LC2." No cause stated. E = ₱12M. | Invalid (Art. 916). LC2 reinstated. Art. 918: institution annulled insofar as it prejudices LC2 → LC2 gets legitime. |
| T-TV-10 | Invalid disinheritance — wrong cause for heir type | Spouse S. Will: "I disinherit S for leading a dishonorable life" (Art. 919(7) ground). E = ₱10M. | Invalid. Art. 919(7) applies to children, not spouse. S reinstated. |
| T-TV-11 | Invalid — reconciliation | 2 LC. Will: disinherit LC2 for maltreatment. Reconciliation occurred. E = ₱10M. | Invalid (Art. 922). LC2 reinstated. |
| T-TV-12 | Valid disinheritance, no descendants | 2 LC. Disinherit LC2 (valid), LC2 has no children. E = ₱10M. | Valid. Scenario changes: only 1 LC → T2 (if spouse) or T1 (if no spouse). LC1 gets larger share. |

### Underprovision Tests

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| T-TV-13 | Underprovision from undisposed estate | 2 LC. Will: "₱1M to LC1, ₱1M to LC2." E = ₱10M. | Each LC's legitime = ₱2.5M. Each underprovided by ₱1.5M. Source 1: undisposed estate (₱8M) covers deficit. Each gets ₱2.5M total. |
| T-TV-14 | Underprovision — waterfall to voluntary | 2 LC. Will: "₱1M to LC1, ₱1M to LC2, ₱6M to friend F." E = ₱10M. | Legitimes = ₱2.5M each. FP = ₱5M. F gets ₱6M → inofficious by ₱1M. Also LC1 and LC2 underprovided. Art. 855 waterfall + Art. 911 reduction. |
| T-TV-15 | Spouse omitted — full deficit recovery | 1 LC + S. Will: "Everything to LC1." E = ₱10M. | S's legitime = ₱2.5M, will gives ₱0. Deficit = ₱2.5M. LC1 gets ₱10M from will, but ₱7.5M is from FP. Reduce LC1's FP share by ₱2.5M. Final: LC1 = ₱7.5M, S = ₱2.5M. |

### Inofficiousness Reduction Tests

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| T-TV-16 | Single legacy exceeds FP | 1 LC + S. Will: "₱6M to friend F." E = ₱10M. FP = ₱2.5M. | F's legacy inofficious by ₱3.5M. Reduce to ₱2.5M. LC1 = ₱5M, S = ₱2.5M, F = ₱2.5M. |
| T-TV-17 | Multiple legacies, pro rata reduction | 1 LC. Will: "₱3M to F1, ₱4M to F2." E = ₱10M. FP = ₱5M. | Total = ₱7M, excess = ₱2M. Pro rata: F1 reduced by ₱2M×(3/7)=₱857K → ₱2,143K. F2 reduced by ₱2M×(4/7)=₱1,143K → ₱2,857K. |
| T-TV-18 | Preferred legacy survives longer | 1 LC. Will: "₱3M to F1, ₱4M (preferred) to F2." E = ₱10M. FP = ₱5M. | Excess = ₱2M. Non-preferred (F1) reduced first: F1 ₱3M → ₱1M (reduced by ₱2M). F2 untouched at ₱4M. Total = ₱5M = FP ✓. |
| T-TV-19 | Non-preferred exhausted, preferred reduced | 1 LC. Will: "₱1M to F1, ₱6M (preferred) to F2." E = ₱10M. FP = ₱5M. | Excess = ₱2M. F1 reduced by ₱1M → ₱0. Remaining excess = ₱1M. F2 reduced by ₱1M → ₱5M. Total = ₱5M = FP ✓. |
| T-TV-20 | Testamentary exhausted, donation reduced | 1 LC. Will: "₱4M to F." Plus ₱3M donation to stranger (collatable). E at death = ₱7M. Collated = ₱10M. | Legitime = ₱5M. FP = ₱5M. F (₱4M) + donation (₱3M) = ₱7M, excess = ₱2M. Phase 1: F reduced by ₱2M → ₱2M. Donation untouched (₱3M ≤ remaining FP). |
| T-TV-21 | Zero FP — all voluntary reduced to zero | 1 LC + 3 IC + S. Will: "₱1M to friend F." E = ₱10M. FP = ₱0 (cap consumed). | F's ₱1M entirely inofficious → reduced to ₱0. |

### Art. 912 Indivisible Realty Tests

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| T-TV-22 | Reduction < ½ → devisee keeps | Devise of house (₱5M). Reduction needed: ₱2M. | ₱2M < ₱2.5M (½). Devisee keeps house, pays ₱2M cash to compulsory heirs. |
| T-TV-23 | Reduction ≥ ½ → compulsory heirs take | Devise of house (₱5M). Reduction needed: ₱3M. | ₱3M ≥ ₱2.5M (½). Compulsory heirs take house, pay ₱2M cash to devisee. |
| T-TV-24 | Reduction exactly ½ | Devise of house (₱4M). Reduction needed: ₱2M. | ₱2M = ₱2M (½). Art. 912: "absorb one-half" → compulsory heirs take. Pay ₱2M cash to devisee. |

### Condition Stripping Tests

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| T-TV-25 | Condition on legitime stripped | 1 LC. Will: "LC1 inherits everything, on condition LC1 graduates law school." E = ₱10M. | Legitime = ₱5M. Condition stripped from ₱5M legitime portion. Condition retained on ₱5M FP portion (if testator intent was conditional on FP). |
| T-TV-26 | Substitution on legitime stripped | 1 LC. Will: "LC1 inherits, with fideicommissary to GC1." E = ₱10M. | Art. 872 + Art. 863: Fideicommissary cannot burden legitime. Substitution void as to ₱5M legitime. May apply to ₱5M FP share. |

### Combined Tests

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| T-TV-27 | Invalid disinheritance + inofficiousness | 2 LC + S. Will: "Disinherit LC2 (no cause). ₱7M to friend F." E = ₱10M. | (1) Disinheritance invalid → LC2 reinstated. (2) Scenario T3 (2 LC + S): each LC = ₱2.5M, S = ₱2.5M, FP = ₱2.5M. (3) F's ₱7M inofficious by ₱4.5M → reduced to ₱2.5M. |
| T-TV-28 | Preterition overrides everything | 3 LC + S. Will: "Disinherit LC2 (valid). ₱4M to F. All rest to LC1." LC3 omitted. E = ₱12M. | Preterition (LC3 omitted) → entire institution annulled. F's legacy survives if not inofficious. Intestate distribution of remainder. Disinheritance of LC2 still applies within intestate. |
| T-TV-29 | Multiple corrections cascade | 1 LC + 1 IC + S. Will: "₱8M to friend F. ₱1M to LC1." IC and S omitted. E = ₱10M. | NOT preterition (IC and S not direct line). LC1 underprovided (₱1M < ₱5M legitime). IC's legitime from FP. S's legitime from FP. F's ₱8M inofficious. Cascading Art. 855 + Art. 911. |

---

## Narrative Templates

### Preterition Narrative

> **{name} ({relationship})** was completely omitted from the testator's will. Under Art. 854 of the Civil Code, the preterition (total omission) of a compulsory heir in the direct line annuls the institution of heirs. {If legacies/devises survive: "The legacies and devises in the will remain valid insofar as they are not inofficious (Art. 854)."} The estate is distributed under intestate succession rules.

### Inofficious Reduction Narrative

> The testator's will directed ₱{original} to **{beneficiary}**. However, the total testamentary dispositions (₱{total_dispositions}) exceed the free portion (₱{fp_disposable}), making this disposition inofficious under Art. 911. {If non-preferred: "As a non-preferred disposition, it is reduced pro rata with other non-preferred dispositions."} {If preferred: "Although the testator designated this as a preferred disposition, the non-preferred dispositions were insufficient to cover the excess, so this preferred disposition was reduced by ₱{reduction}."} **{beneficiary}** receives ₱{after_reduction}.

### Invalid Disinheritance Narrative

> The testator's will purported to disinherit **{name}** ({relationship}). However, the disinheritance is invalid under Art. 918 because {reason}. {If no cause: "the will does not specify a cause for the disinheritance (Art. 916 requires a specified legal cause)."} {If wrong cause: "the stated cause is not among those enumerated in Art. {919|920|921} for {heir category}."} {If unproven: "the stated cause was not proven (Art. 917)."} {If reconciled: "the offender and the testator subsequently reconciled, voiding the disinheritance under Art. 922."} **{name}** is reinstated as a compulsory heir and receives their full legitime of ₱{legitime}.

### Underprovision Recovery Narrative

> **{name} ({relationship})** is a compulsory heir entitled to a legitime of ₱{legitime} under Art. {article}. The testator's will provided only ₱{will_provision}, leaving a deficit of ₱{deficit}. Under Art. 855, this deficit is recovered as follows: {Source 1: "₱{from_undisposed} from the undisposed portion of the estate."} {Source 2: "₱{from_compulsory} pro rata from other compulsory heirs' shares above their own legitimes."} {Source 3: "₱{from_voluntary} pro rata from the voluntary heirs' shares."} **{name}** receives ₱{total}.

### Art. 912 Indivisible Realty Narrative

> The devise of {property_description} (valued at ₱{value}) to **{devisee}** must be reduced by ₱{reduction} to respect the compulsory heirs' legitime. Under Art. 912, since the reduction {absorbs_comparison} half of the property's value, {outcome}. {If devisee keeps: "**{devisee}** retains the property and must reimburse the compulsory heirs ₱{cash} in cash."} {If heirs take: "The compulsory heirs receive the property and must reimburse **{devisee}** ₱{cash} in cash."}

### Condition Stripped Narrative

> The testator's will imposed a condition on **{name}**'s inheritance: "{condition_description}". Under Art. 872 of the Civil Code, the testator cannot impose any charge, condition, or substitution upon the legitime. The condition is deemed not imposed with respect to **{name}**'s legitime of ₱{legitime}. {If FP excess: "The condition may apply to the ₱{fp_excess} received from the free portion."}

---

## Engine Pipeline Integration

Testate validation is **Step 2.5** in the pipeline — after heir classification and scenario determination, but before distribution:

```
Step 1:     Classify heirs (compulsory-heirs-categories)
Step 1.5:   Build lines for representation (representation-rights)
Step 2:     Determine scenario (heir-concurrence-rules) → T1-T15
    ↓
Step 2.5:   VALIDATE WILL (THIS ASPECT)
    Input:  estate, will, heirs, donations, decedent
    Output: ValidationResult { corrections, final succession type }
    Effect: May modify will (reduce dispositions), modify heirs
            (reinstate invalidly disinherited), or change succession
            type entirely (preterition → intestate)
    ↓
Step 3:     Compute each heir's legitime (post-validation scenario)
Step 4:     Compute free portion
Step 5:     Distribute (testate, intestate, or mixed based on validation)
Step 6:     Compute final per-heir amounts
Step 7:     Generate per-heir narrative explanations
```

### Key Constraint: Validation Before Distribution

The engine MUST NOT distribute before validation. The validation step can:
- Change the succession type (testate → intestate via preterition)
- Change the heir pool (reinstate invalidly disinherited heirs)
- Reduce disposition amounts (inofficious reduction)
- Add recovery allocations (underprovision)

All of these must be resolved before the final distribution is computed.

---

*Analysis based on Civil Code Arts. 842, 854-856, 872, 886, 906, 908-912, 915-923. Cross-references: testate-institution (preterition algorithm, underprovision waterfall, condition stripping), free-portion-rules (FP pipeline, inofficiousness detection, Art. 911 reduction), legitime-table (T1-T15 legitime computation), heir-concurrence-rules (scenario determination), representation-rights (Art. 923 representation after disinheritance).*
