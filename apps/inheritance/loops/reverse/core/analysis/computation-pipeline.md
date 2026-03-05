# Computation Pipeline — End-to-End Inheritance Distribution Flow

**Aspect**: computation-pipeline
**Wave**: 5 (Synthesis)
**Depends On**: ALL Wave 1-4 aspects (compulsory-heirs-categories, heir-concurrence-rules, representation-rights, adopted-children-rights, illegitimate-children-rights, legitime-table, legitime-with-illegitimate, legitime-surviving-spouse, legitime-ascendants, free-portion-rules, intestate-order, testate-institution, testate-validation, disinheritance-rules, preterition, accretion-rules, collation)

---

## Overview

This document defines the **complete end-to-end computation graph** for the Philippine Inheritance Distribution Engine. The engine is fully deterministic — given the same inputs, it always produces the same outputs. No LLM or probabilistic component is involved in the computation.

### Inputs

```
struct EngineInput {
    net_distributable_estate: Money,      // Output of estate-tax engine (after tax)
    decedent: Decedent,                    // Civil status, legitimacy, date of death
    family_tree: List<Heir>,               // All potential heirs with classifications
    will: Will | null,                     // Testamentary dispositions (null = intestate)
    donations: List<Donation>,             // Inter vivos donations by decedent
    config: EngineConfig,                  // Configurable legal parameters
}
```

### Outputs

```
struct EngineOutput {
    per_heir_shares: List<InheritanceShare>,  // Exact peso amount per heir
    narratives: List<HeirNarrative>,          // Plain-English explanation per heir
    computation_log: ComputationLog,          // Step-by-step audit trail
    warnings: List<Warning>,                  // Manual review flags
    succession_type: SuccessionType,          // TESTATE | INTESTATE | MIXED
    scenario_code: string,                    // T1-T15 or I1-I15 (or MIXED)
}
```

---

## Pipeline Architecture

The pipeline consists of **10 steps** executed sequentially. Some steps may loop back to earlier steps (e.g., vacancy resolution triggering scenario re-evaluation). The pipeline has a max-iteration guard to prevent infinite loops.

```
┌─────────────────────────────────────────────────────────────┐
│                    ENGINE INPUT                              │
│  net_distributable_estate + family_tree + will + donations   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  Step 1: CLASSIFY HEIRS │
              │  (heir categories)      │
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────────┐
              │  Step 2: BUILD LINES       │
              │  (representation analysis) │
              └────────────┬───────────────┘
                           │
                           ▼
              ┌─────────────────────────────────┐
              │  Step 3: DETERMINE SUCCESSION    │
              │  TYPE + SCENARIO                 │
              │  (testate/intestate/mixed → T/I) │
              └────────────┬────────────────────┘
                           │
                           ▼
              ┌──────────────────────────────┐
              │  Step 4: COMPUTE ESTATE BASE │
              │  (collation: Art. 908)       │
              └────────────┬─────────────────┘
                           │
                           ▼
              ┌─────────────────────────────┐
              │  Step 5: COMPUTE LEGITIMES   │
              │  (fraction table + cap rule) │
              └────────────┬────────────────┘
                           │
                           ▼
              ┌──────────────────────────────────┐
              │  Step 6: TESTATE VALIDATION       │
              │  (preterition → disinheritance →  │
              │   underprovision → inofficiousness │
              │   → condition stripping)           │
              │  [may restart from Step 3]         │
              └────────────┬─────────────────────┘
                           │
                           ▼
              ┌──────────────────────────────────┐
              │  Step 7: DISTRIBUTE ESTATE        │
              │  (legitime allocation +            │
              │   free portion / intestate shares) │
              └────────────┬─────────────────────┘
                           │
                           ▼
              ┌───────────────────────────────────┐
              │  Step 8: COLLATION ADJUSTMENT      │
              │  (impute donations, adjust shares, │
              │   detect inofficiousness)           │
              └────────────┬──────────────────────┘
                           │
                           ▼
              ┌────────────────────────────────┐
              │  Step 9: VACANCY RESOLUTION     │
              │  (substitution → representation │
              │   → accretion → intestate)      │
              │  [may restart from Step 3]      │
              └────────────┬───────────────────┘
                           │
                           ▼
              ┌──────────────────────────────┐
              │  Step 10: FINALIZE + NARRATE  │
              │  (rounding, narrative gen,     │
              │   audit trail)                 │
              └────────────┬─────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    ENGINE OUTPUT                              │
│  per-heir shares (₱ amounts) + narratives + audit trail      │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 1: Classify Heirs

**Source**: `compulsory-heirs-categories`, `adopted-children-rights`, `illegitimate-children-rights`
**Purpose**: Determine each person's legal category and whether they qualify as a compulsory heir.

### Algorithm

```
function step1_classify_heirs(
    family_tree: List<Person>,
    decedent: Decedent
) -> List<Heir> {

    heirs = []

    for person in family_tree:
        // 1. Determine raw category
        raw_category = classify_heir(person, decedent)
        // Returns: LEGITIMATE_CHILD | LEGITIMATED_CHILD | ADOPTED_CHILD |
        //          ILLEGITIMATE_CHILD | SURVIVING_SPOUSE |
        //          LEGITIMATE_PARENT | LEGITIMATE_ASCENDANT | null

        if raw_category == null:
            continue  // Not an heir

        // 2. Map to effective category
        effective = effective_category(raw_category)
        // LEGITIMATE_CHILD_GROUP | ILLEGITIMATE_CHILD_GROUP |
        // SURVIVING_SPOUSE_GROUP | LEGITIMATE_ASCENDANT_GROUP

        // 3. Check eligibility (disqualification gates)
        eligible = check_eligibility(person, raw_category)
        // Checks: filiation_proved (IC), adoption_rescinded (adopted),
        //         legal_separation_guilty (spouse), is_unworthy (all)

        // 4. Build Heir struct
        heir = Heir {
            id: person.id,
            name: person.name,
            raw_category: raw_category,
            effective_category: effective,
            is_alive: person.is_alive_at_succession,
            is_eligible: eligible,
            filiation_proved: person.filiation_proved,
            is_unworthy: person.is_unworthy AND NOT person.unworthiness_condoned,
            is_disinherited: false,         // Set in Step 6
            disinheritance_valid: false,     // Set in Step 6
            has_renounced: person.has_renounced,
            adoption: person.adoption,       // Adoption struct if applicable
            children: [],                    // Populated below
            degree_from_decedent: person.degree,
            line: person.line,               // PATERNAL | MATERNAL (for ascendants)
        }

        heirs.append(heir)

    // 5. Link parent-child relationships for representation
    link_family_tree(heirs)

    return heirs
}
```

### Eligibility Gate

```
function check_eligibility(person: Person, category: HeirCategory) -> bool {
    // Hard disqualifications — these remove the person from the heir pool entirely

    if category == ILLEGITIMATE_CHILD AND NOT person.filiation_proved:
        return false  // Art. 887 ¶3

    if category == ADOPTED_CHILD AND person.adoption_rescinded:
        return false  // RA 8552 Sec. 20

    if category == SURVIVING_SPOUSE AND person.legal_separation_guilty:
        return false  // Art. 1002

    if person.is_unworthy AND NOT person.unworthiness_condoned:
        return false  // Art. 1032, but Art. 1035 allows children to represent

    return true
}
```

### Output

- `List<Heir>` with raw and effective categories assigned
- Each heir flagged as eligible or ineligible
- Family tree linkages established for representation analysis

---

## Step 2: Build Representation Lines

**Source**: `representation-rights`
**Purpose**: For each child of the decedent, determine whether they inherit in their own right or through representatives. Build "lines" for concurrence counting.

### Algorithm

```
function step2_build_lines(
    heirs: List<Heir>,
    decedent: Decedent
) -> LineResult {

    legitimate_lines = []
    illegitimate_lines = []

    for child in decedent.direct_children:
        heir = find_heir(child, heirs)
        if heir == null:
            continue

        category = heir.effective_category

        if category == LEGITIMATE_CHILD_GROUP:
            line = build_single_line(heir, decedent, heirs)
            if line != null:
                legitimate_lines.append(line)

        elif category == ILLEGITIMATE_CHILD_GROUP:
            line = build_single_line(heir, decedent, heirs)
            if line != null:
                illegitimate_lines.append(line)

    return LineResult {
        legitimate_lines: legitimate_lines,
        illegitimate_lines: illegitimate_lines,
        n: len(legitimate_lines),   // Count for concurrence
        m: len(illegitimate_lines), // Count for concurrence
    }
}

function build_single_line(
    heir: Heir,
    decedent: Decedent,
    all_heirs: List<Heir>
) -> Line | null {

    // Case 1: Heir is alive and eligible — inherits in own right
    if heir.is_alive AND heir.is_eligible AND NOT heir.has_renounced:
        return Line {
            original_heir: heir,
            mode: OWN_RIGHT,
            representatives: [],
            is_active: true,
        }

    // Case 2: Check if heir can be represented
    trigger = get_representation_trigger(heir)

    if trigger == RENUNCIATION:
        return null  // Art. 977: cannot be represented if renounced

    if trigger in {PREDECEASE, DISINHERITANCE, INCAPACITY, UNWORTHINESS}:
        // Find eligible representatives (recursive)
        reps = find_representatives(heir, decedent, all_heirs)
        if len(reps) > 0:
            return Line {
                original_heir: heir,
                mode: REPRESENTATION,
                representatives: reps,
                is_active: true,
            }
        else:
            return null  // Line extinct — no eligible representatives

    return null  // Heir ineligible for other reasons
}
```

### Line Counting Rules

- Each surviving child of the decedent = 1 line
- Each represented child (predeceased/disinherited/incapacitated) with eligible descendants = 1 line
- Renouncing heirs create NO line (Art. 977)
- Lines-not-heads: `n` = number of legitimate lines, `m` = number of illegitimate lines
- These counts directly feed into Step 3 (concurrence) and Step 5 (legitime fractions)

---

## Step 3: Determine Succession Type + Scenario

**Source**: `heir-concurrence-rules`
**Purpose**: Determine whether succession is testate, intestate, or mixed, then identify the specific concurrence scenario (T1-T15 or I1-I15).

### Algorithm

```
function step3_determine_succession(
    will: Will | null,
    heirs: List<Heir>,
    lines: LineResult,
    decedent: Decedent
) -> SuccessionResult {

    // 1. Determine succession type
    if will == null OR will.is_empty:
        succession_type = INTESTATE
    elif will.disposes_of_entire_estate:
        succession_type = TESTATE
    else:
        succession_type = MIXED  // Will disposes of only part

    // 2. Identify which effective groups survive
    has_group1 = lines.n > 0  // Legitimate children/descendants
    has_group2 = any(h for h in heirs
        where h.effective_category == LEGITIMATE_ASCENDANT_GROUP
        AND h.is_eligible AND h.is_alive)
    has_group3 = any(h for h in heirs
        where h.effective_category == SURVIVING_SPOUSE_GROUP
        AND h.is_eligible)
    has_group4 = lines.m > 0  // Illegitimate children

    // 3. Apply mutual exclusion: Group 1 excludes Group 2
    if has_group1:
        has_group2 = false  // Art. 887(2)

    // 4. Check for collateral relatives (intestate-only)
    has_collaterals = false
    if NOT has_group1 AND NOT has_group2 AND NOT has_group3 AND NOT has_group4:
        has_collaterals = any(h for h in heirs where h.is_collateral
            AND h.degree_from_decedent <= 5 AND h.is_eligible)

    // 5. Map to scenario code
    if succession_type == TESTATE OR succession_type == MIXED:
        testate_scenario = map_testate_scenario(
            has_group1, has_group2, has_group3, has_group4,
            lines.n, decedent.is_illegitimate
        )

    if succession_type == INTESTATE OR succession_type == MIXED:
        intestate_scenario = map_intestate_scenario(
            has_group1, has_group2, has_group3, has_group4,
            has_collaterals, lines.n, decedent.is_illegitimate
        )

    return SuccessionResult {
        succession_type: succession_type,
        testate_scenario: testate_scenario,    // T1-T15 or null
        intestate_scenario: intestate_scenario, // I1-I15 or null
        groups_present: {has_group1, has_group2, has_group3, has_group4},
        n: lines.n,
        m: lines.m,
    }
}
```

### Testate Scenario Mapping

```
function map_testate_scenario(g1, g2, g3, g4, n, is_illegitimate_decedent) -> string {
    if is_illegitimate_decedent AND g2:
        if g3: return "T15"    // Parents + spouse of illegitimate decedent
        else:  return "T14"    // Parents of illegitimate decedent only

    match (g1, g2, g3, g4) {
        (true,  false, false, false) => "T1"
        (true,  false, true,  false) => if n == 1: "T2" else: "T3"
        (true,  false, false, true)  => "T4"
        (true,  false, true,  true)  => "T5"   // sub-case T5a/T5b by n
        (false, true,  false, false) => "T6"
        (false, true,  true,  false) => "T7"
        (false, true,  false, true)  => "T8"
        (false, true,  true,  true)  => "T9"
        (false, false, true,  true)  => "T10"
        (false, false, false, true)  => "T11"
        (false, false, true,  false) => "T12"
        (false, false, false, false) => "T13"
    }
}
```

### Intestate Scenario Mapping

```
function map_intestate_scenario(g1, g2, g3, g4, collaterals, n, is_illegitimate_decedent) -> string {
    match (g1, g2, g3, g4) {
        (true,  false, false, false) => "I1"
        (true,  false, true,  false) => "I2"
        (true,  false, false, true)  => "I3"
        (true,  false, true,  true)  => "I4"
        (false, true,  false, false) => "I5"
        (false, true,  true,  false) => "I6"
        (false, false, false, true)  => "I7"
        (false, false, true,  true)  => "I8"
        (false, true,  false, true)  => "I9"
        (false, true,  true,  true)  => "I10"
        (false, false, true,  false) =>
            if collaterals: "I12" else: "I11"
        (false, false, false, false) =>
            if collaterals: "I13" or "I14" else: "I15"
    }
}
```

---

## Step 4: Compute Estate Base (Collation)

**Source**: `collation`, `free-portion-rules`
**Purpose**: Add back collatable inter vivos donations to the net estate to compute the correct estate base for legitime computation (Art. 908).

### Algorithm

```
function step4_compute_estate_base(
    net_estate: Money,
    donations: List<Donation>,
    heirs: List<Heir>,
    succession_result: SuccessionResult
) -> EstateBaseResult {

    // 1. Filter collatable donations
    collatable = []
    for d in donations:
        collatability = determine_collatability(d, heirs, succession_result)
        if collatability.is_collatable:
            collatable.append({
                donation: d,
                collatable_amount: collatability.amount,  // At donation-time value (Art. 1071)
                charged_to: collatability.charge_target,   // LEGITIME or FREE_PORTION
                donee: d.recipient,
            })

    // 2. Compute adjusted estate base (Art. 908)
    total_collatable = sum(c.collatable_amount for c in collatable)
    estate_base = net_estate + total_collatable

    // 3. Classify donations by charging target
    donations_charged_to_legitime = filter(c where c.charged_to == LEGITIME)
    donations_charged_to_fp = filter(c where c.charged_to == FREE_PORTION)

    return EstateBaseResult {
        net_estate_at_death: net_estate,
        total_collatable_donations: total_collatable,
        estate_base: estate_base,          // This is the base for ALL legitime computations
        collatable_donations: collatable,
        donations_to_legitime: donations_charged_to_legitime,
        donations_to_fp: donations_charged_to_fp,
    }
}
```

### Collatability Determination

```
function determine_collatability(
    donation: Donation,
    heirs: List<Heir>,
    succession: SuccessionResult
) -> CollatabilityResult {

    donee = find_heir(donation.recipient, heirs)

    // Rule 1: Donee must be a compulsory heir succeeding with others (Art. 1061)
    // Exception: donations to strangers are always added to estate base (Art. 909 ¶2)
    if donee == null OR NOT donee.is_compulsory:
        // Stranger donation — collatable, charged to FP
        return { is_collatable: true, amount: donation.value_at_donation,
                 charge_target: FREE_PORTION }

    co_heirs = filter(heirs, h => h.is_compulsory AND h.id != donee.id)
    if len(co_heirs) == 0:
        return { is_collatable: false }  // Sole compulsory heir, no equalization needed

    // Rule 2: Check exemptions (Art. 1062)
    if donation.expressly_exempt_from_collation:
        // Donor-exempt, but still check inofficiousness
        return { is_collatable: false, check_inofficiousness: true }

    if donee.has_renounced AND NOT donation.is_inofficious:
        return { is_collatable: false }  // Repudiation exemption

    // Rule 3: Check type-based exemptions
    if donation.type in {SUPPORT, EDUCATION, MEDICAL, APPRENTICESHIP,
                          ORDINARY_EQUIPMENT, CUSTOMARY_GIFT}:
        return { is_collatable: false }  // Art. 1067

    if donation.type == PROFESSIONAL_CAREER:
        if NOT donation.parent_expressly_required AND NOT impairs_legitime(donation):
            return { is_collatable: false }  // Art. 1068 default exemption
        amount = donation.value_at_donation - donation.imputed_home_savings
        return { is_collatable: true, amount: max(0, amount),
                 charge_target: LEGITIME }

    if donation.type == WEDDING_GIFT:
        if donation.value_at_donation <= estate_fp * (1/10):
            return { is_collatable: false }  // Art. 1070 threshold
        return { is_collatable: true,
                 amount: donation.value_at_donation - estate_fp * (1/10),
                 charge_target: LEGITIME }

    if donation.recipient_is_child_spouse_only:
        return { is_collatable: false }  // Art. 1066

    if donation.is_joint_to_child_and_spouse:
        return { is_collatable: true, amount: donation.value_at_donation / 2,
                 charge_target: LEGITIME }  // Art. 1066 ¶2

    // Rule 4: Charging target
    if donee.effective_category == LEGITIMATE_CHILD_GROUP:
        return { is_collatable: true, amount: donation.value_at_donation,
                 charge_target: LEGITIME }  // Art. 909 ¶1

    if donee.effective_category == ILLEGITIMATE_CHILD_GROUP:
        return { is_collatable: true, amount: donation.value_at_donation,
                 charge_target: LEGITIME }  // Art. 910

    return { is_collatable: true, amount: donation.value_at_donation,
             charge_target: FREE_PORTION }  // Default
}
```

### Key Rule: Valuation at Time of Donation (Art. 1071)

All collatable donations are valued at their worth **when given**, not at the time of death. Appreciation, depreciation, or destruction is at the donee's risk/benefit. The engine uses `donation.value_at_donation` exclusively.

---

## Step 5: Compute Legitimes

**Source**: `legitime-table`, `legitime-with-illegitimate`, `legitime-surviving-spouse`, `legitime-ascendants`
**Purpose**: Compute each compulsory heir's legitime based on the scenario code and estate base.

### Algorithm

```
function step5_compute_legitimes(
    estate_base: Money,        // From Step 4 (collation-adjusted)
    scenario: string,          // T1-T15
    lines: LineResult,
    heirs: List<Heir>,
    decedent: Decedent
) -> LegitimeResult {

    n = lines.n   // Legitimate child lines
    m = lines.m   // Illegitimate child lines

    match scenario {

        // === REGIME A: Descendants Present ===

        "T1":  // n legitimate children only
            lc_collective = estate_base * Fraction(1, 2)
            per_lc = lc_collective / n
            fp_gross = estate_base * Fraction(1, 2)
            return { per_lc: per_lc, fp_gross: fp_gross, fp_disposable: fp_gross }

        "T2":  // 1 legitimate child + spouse
            child_legitime = estate_base * Fraction(1, 2)
            spouse_legitime = estate_base * Fraction(1, 4)
            fp_disposable = estate_base * Fraction(1, 4)
            return { per_lc: child_legitime, spouse: spouse_legitime,
                     fp_gross: estate_base * Fraction(1, 2),
                     fp_disposable: fp_disposable }

        "T3":  // n >= 2 legitimate children + spouse
            lc_collective = estate_base * Fraction(1, 2)
            per_lc = lc_collective / n
            spouse_legitime = per_lc  // Art. 892 ¶2, Art. 897
            fp_gross = estate_base * Fraction(1, 2)
            fp_disposable = fp_gross - spouse_legitime
            return { per_lc: per_lc, spouse: spouse_legitime,
                     fp_gross: fp_gross, fp_disposable: fp_disposable }

        "T4":  // n legitimate + m illegitimate (no spouse)
            lc_collective = estate_base * Fraction(1, 2)
            per_lc = lc_collective / n
            per_ic_uncapped = per_lc / 2    // Art. 895
            fp_gross = estate_base * Fraction(1, 2)
            cap = fp_gross                   // No spouse, full FP available
            total_ic = m * per_ic_uncapped
            if total_ic > cap:
                per_ic = cap / m             // Capped
            else:
                per_ic = per_ic_uncapped
            fp_disposable = fp_gross - min(total_ic, cap)
            return { per_lc: per_lc, per_ic: per_ic,
                     fp_gross: fp_gross, fp_disposable: fp_disposable,
                     cap_applied: total_ic > cap }

        "T5":  // n legitimate + m illegitimate + spouse
            lc_collective = estate_base * Fraction(1, 2)
            per_lc = lc_collective / n
            fp_gross = estate_base * Fraction(1, 2)

            // Spouse (Art. 892, 897)
            if n == 1:
                spouse_legitime = estate_base * Fraction(1, 4)  // T5a
            else:
                spouse_legitime = per_lc                         // T5b

            // Illegitimate (Art. 895) — cap rule with spouse priority
            per_ic_uncapped = per_lc / 2
            remaining_fp = fp_gross - spouse_legitime  // Art. 895 ¶3
            total_ic = m * per_ic_uncapped
            if total_ic > remaining_fp:
                per_ic = remaining_fp / m              // Capped
            else:
                per_ic = per_ic_uncapped
            fp_disposable = remaining_fp - min(total_ic, remaining_fp)
            return { per_lc: per_lc, spouse: spouse_legitime,
                     per_ic: per_ic, fp_gross: fp_gross,
                     fp_disposable: fp_disposable,
                     cap_applied: total_ic > remaining_fp }

        // === REGIME B: Ascendants Present (No Descendants) ===

        "T6":  // Ascendants only
            asc_collective = estate_base * Fraction(1, 2)
            fp_disposable = estate_base * Fraction(1, 2)
            asc_shares = divide_among_ascendants(heirs, asc_collective)
            return { ascendants: asc_shares, fp_gross: fp_disposable,
                     fp_disposable: fp_disposable }

        "T7":  // Ascendants + spouse
            asc_collective = estate_base * Fraction(1, 2)
            spouse_legitime = estate_base * Fraction(1, 4)
            fp_disposable = estate_base * Fraction(1, 4)
            asc_shares = divide_among_ascendants(heirs, asc_collective)
            return { ascendants: asc_shares, spouse: spouse_legitime,
                     fp_gross: estate_base * Fraction(1, 2),
                     fp_disposable: fp_disposable }

        "T8":  // Ascendants + m illegitimate
            asc_collective = estate_base * Fraction(1, 2)
            ic_collective = estate_base * Fraction(1, 4)  // Art. 896 flat
            per_ic = ic_collective / m
            fp_disposable = estate_base * Fraction(1, 4)
            asc_shares = divide_among_ascendants(heirs, asc_collective)
            return { ascendants: asc_shares, per_ic: per_ic,
                     fp_gross: estate_base * Fraction(1, 2),
                     fp_disposable: fp_disposable }

        "T9":  // Ascendants + m illegitimate + spouse
            asc_collective = estate_base * Fraction(1, 2)
            ic_collective = estate_base * Fraction(1, 4)  // Art. 899
            per_ic = ic_collective / m
            spouse_legitime = estate_base * Fraction(1, 8)  // Art. 899
            fp_disposable = estate_base * Fraction(1, 8)
            asc_shares = divide_among_ascendants(heirs, asc_collective)
            return { ascendants: asc_shares, per_ic: per_ic,
                     spouse: spouse_legitime,
                     fp_gross: estate_base * Fraction(1, 2),
                     fp_disposable: fp_disposable }

        // === REGIME C: No Primary/Secondary Compulsory Heirs ===

        "T10":  // m illegitimate + spouse
            ic_collective = estate_base * Fraction(1, 3)  // Art. 894
            per_ic = ic_collective / m
            spouse_legitime = estate_base * Fraction(1, 3)
            fp_disposable = estate_base * Fraction(1, 3)
            return { per_ic: per_ic, spouse: spouse_legitime,
                     fp_gross: estate_base, fp_disposable: fp_disposable }

        "T11":  // m illegitimate only
            ic_collective = estate_base * Fraction(1, 2)  // Art. 901
            per_ic = ic_collective / m
            fp_disposable = estate_base * Fraction(1, 2)
            return { per_ic: per_ic, fp_gross: estate_base,
                     fp_disposable: fp_disposable }

        "T12":  // Spouse only
            if is_articulo_mortis(heirs.spouse, decedent):
                spouse_legitime = estate_base * Fraction(1, 3)  // Art. 900 ¶2
            else:
                spouse_legitime = estate_base * Fraction(1, 2)  // Art. 900
            fp_disposable = estate_base - spouse_legitime
            return { spouse: spouse_legitime, fp_gross: estate_base,
                     fp_disposable: fp_disposable }

        "T13":  // No compulsory heirs
            return { fp_gross: estate_base, fp_disposable: estate_base }

        // === SPECIAL: Illegitimate Decedent ===

        "T14":  // Parents of illegitimate decedent
            parent_collective = estate_base * Fraction(1, 2)
            parent_shares = divide_among_parents(heirs, parent_collective)
            return { parents: parent_shares, fp_gross: estate_base * Fraction(1, 2),
                     fp_disposable: estate_base * Fraction(1, 2) }

        "T15":  // Parents + spouse of illegitimate decedent
            parent_collective = estate_base * Fraction(1, 4)
            spouse_legitime = estate_base * Fraction(1, 4)
            parent_shares = divide_among_parents(heirs, parent_collective)
            return { parents: parent_shares, spouse: spouse_legitime,
                     fp_gross: estate_base * Fraction(1, 2),
                     fp_disposable: estate_base * Fraction(1, 2) }
    }
}
```

### Ascendant Division Sub-Algorithm (Art. 890)

```
function divide_among_ascendants(heirs: List<Heir>, total: Money) -> Map<Heir, Money> {
    ascendants = filter(heirs, h => h.effective_category == LEGITIMATE_ASCENDANT_GROUP
                                     AND h.is_eligible AND h.is_alive)

    // Tier 1: Parents (degree 1)
    parents = filter(ascendants, a => a.degree_from_decedent == 1)
    if len(parents) > 0:
        return divide_equally(parents, total)

    // Tier 2: Nearest degree among higher ascendants
    min_degree = min(a.degree_from_decedent for a in ascendants)
    nearest = filter(ascendants, a => a.degree_from_decedent == min_degree)

    // Tier 3: By-line split (Art. 890 ¶2, Art. 987)
    paternal = filter(nearest, a => a.line == PATERNAL)
    maternal = filter(nearest, a => a.line == MATERNAL)

    if len(paternal) > 0 AND len(maternal) > 0:
        result = {}
        result.merge(divide_equally(paternal, total / 2))
        result.merge(divide_equally(maternal, total / 2))
        return result
    else:
        surviving = paternal if len(paternal) > 0 else maternal
        return divide_equally(surviving, total)
}
```

---

## Step 6: Testate Validation

**Source**: `testate-validation`, `preterition`, `disinheritance-rules`
**Purpose**: Check whether the will respects all compulsory heirs' legitimes. If violations are found, correct them. This step only executes if succession is TESTATE or MIXED.

### Validation Pipeline (5 Ordered Checks)

```
function step6_testate_validation(
    will: Will,
    heirs: List<Heir>,
    lines: LineResult,
    legitime_result: LegitimeResult,
    estate_base: Money,
    succession: SuccessionResult
) -> ValidationResult {

    corrections = []

    // CHECK 1: PRETERITION (Art. 854)
    // Only direct-line compulsory heirs (LC, IC in direct line, ascendants)
    // Total omission = no institution, no legacy, no devise, no disinheritance
    preterition = check_preterition(will, heirs)
    if preterition.found:
        // NUCLEAR: Annul ALL institutions
        // Legacies/devises survive if not inofficious
        // Distribute remainder intestate
        // Pipeline TERMINATES here
        return ValidationResult {
            preterition: preterition,
            distribution_mode: POST_PRETERITION_INTESTATE,
            surviving_legacies: filter_inofficious(will.legacies, legitime_result),
            surviving_devises: filter_inofficious(will.devises, legitime_result),
        }

    // CHECK 2: DISINHERITANCE VALIDITY (Arts. 915-922)
    scenario_changed = false
    for d in will.disinheritances:
        validity = validate_disinheritance(d, will, heirs)
        if NOT validity.is_valid:
            // Art. 918: REINSTATE heir, restore their legitime
            // Partial annulment (NOT total like preterition)
            reinstate_heir(d.heir, heirs, lines)
            corrections.append(Correction.INVALID_DISINHERITANCE(d))
            scenario_changed = true

    if scenario_changed:
        // Re-evaluate scenario with reinstated heirs
        // RESTART from Step 3
        return ValidationResult {
            needs_restart: true,
            corrections: corrections,
            restart_from: STEP_3,
        }

    // CHECK 3: UNDERPROVISION (Art. 855)
    for heir in compulsory_heirs(heirs):
        will_provision = compute_will_provision(heir, will)
        required_legitime = get_legitime(heir, legitime_result)
        if will_provision < required_legitime:
            deficit = required_legitime - will_provision
            // Art. 855 waterfall: undisposed → compulsory heirs' excess → voluntary heirs
            recovery = recover_underprovision(deficit, will, heirs, estate_base)
            corrections.append(Correction.UNDERPROVISION(heir, deficit, recovery))

    // CHECK 4: INOFFICIOUSNESS (Arts. 908-912)
    total_dispositions = sum_all_dispositions(will) + sum(donations_to_fp)
    if total_dispositions > legitime_result.fp_disposable:
        excess = total_dispositions - legitime_result.fp_disposable
        // Art. 911: three-phase reduction
        reductions = reduce_inofficious(excess, will, donations)
        corrections.append(Correction.INOFFICIOUSNESS(excess, reductions))

    // CHECK 5: CONDITION STRIPPING (Art. 872)
    for heir in compulsory_heirs(heirs):
        for condition in get_conditions(heir, will):
            if condition.applies_to_legitime_portion:
                // Strip condition from legitime; keep on FP share only
                strip_condition(condition, heir, legitime_result)
                corrections.append(Correction.CONDITION_STRIPPED(heir, condition))

    return ValidationResult {
        needs_restart: false,
        corrections: corrections,
        preterition: null,
    }
}
```

### Art. 911 Three-Phase Reduction Algorithm

```
function reduce_inofficious(
    excess: Money,
    will: Will,
    donations: List<Donation>
) -> List<Reduction> {

    reductions = []
    remaining = excess

    // Phase 1a: Non-preferred testamentary dispositions (pro rata)
    non_preferred = filter(will.legacies + will.devises, d => NOT d.is_preferred)
    if remaining > 0 AND len(non_preferred) > 0:
        total_non_preferred = sum(d.value for d in non_preferred)
        reduce_amount = min(remaining, total_non_preferred)
        for d in non_preferred:
            d_reduction = reduce_amount * (d.value / total_non_preferred)
            reductions.append(Reduction(d, d_reduction, "Art. 911(2) pro rata"))
        remaining -= reduce_amount

    // Phase 1b: Preferred testamentary dispositions
    preferred = filter(will.legacies + will.devises, d => d.is_preferred)
    if remaining > 0 AND len(preferred) > 0:
        total_preferred = sum(d.value for d in preferred)
        reduce_amount = min(remaining, total_preferred)
        for d in preferred:
            d_reduction = reduce_amount * (d.value / total_preferred)
            reductions.append(Reduction(d, d_reduction, "Art. 911(2) preferred"))
        remaining -= reduce_amount

    // Phase 2: Voluntary institutions
    voluntary = filter(will.institutions, i => NOT i.heir.is_compulsory)
    if remaining > 0 AND len(voluntary) > 0:
        total_voluntary = sum(i.share_value for i in voluntary)
        reduce_amount = min(remaining, total_voluntary)
        for i in voluntary:
            i_reduction = reduce_amount * (i.share_value / total_voluntary)
            reductions.append(Reduction(i, i_reduction, "Art. 911 voluntary"))
        remaining -= reduce_amount

    // Phase 3: Donations — reverse chronological (most recent first)
    sorted_donations = sort(donations, by=date, descending)
    for d in sorted_donations:
        if remaining <= 0:
            break
        reduce_amount = min(remaining, d.value)
        reductions.append(Reduction(d, reduce_amount, "Art. 911(1) donation"))
        remaining -= reduce_amount

    return reductions
}
```

### Restart Mechanism

When Step 6 detects that a disinheritance is invalid and an heir must be reinstated, the scenario may change (e.g., T1→T3 if a previously-disinherited child returns). The pipeline must restart from Step 3 with the updated heir pool. A max-restart counter (default: number of heirs) prevents infinite loops.

---

## Step 7: Distribute Estate

**Source**: `testate-institution`, `intestate-order`, `free-portion-rules`
**Purpose**: Allocate the actual estate among heirs — compulsory heirs receive their legitime, and the free portion (or entire estate in intestate) is distributed per will or intestate rules.

### Algorithm

```
function step7_distribute(
    net_estate: Money,          // Actual estate at death (not collation-adjusted)
    estate_base: Money,         // Collation-adjusted base
    legitime_result: LegitimeResult,
    will: Will | null,
    heirs: List<Heir>,
    lines: LineResult,
    succession: SuccessionResult,
    validation: ValidationResult
) -> DistributionResult {

    shares = Map<Heir, HeirShare>()

    // === TESTATE SUCCESSION ===
    if succession.succession_type == TESTATE:

        if validation.preterition != null:
            // Post-preterition: intestate distribution with surviving legacies
            return distribute_post_preterition(
                net_estate, heirs, lines, succession,
                validation.surviving_legacies, validation.surviving_devises
            )

        // 7a. Allocate legitimes to compulsory heirs
        for heir in compulsory_heirs(heirs):
            legitime = get_heir_legitime(heir, legitime_result, lines)
            shares[heir] = HeirShare {
                legitime_amount: legitime,
                fp_amount: 0,
                basis: get_legitime_basis(heir, succession.testate_scenario),
            }

        // 7b. Distribute free portion per will
        fp_remaining = net_estate - sum(s.legitime_amount for s in shares.values())
        // Adjust: fp is computed on estate_base, but distributed from net_estate
        // If collation donations exist, actual distributable may differ
        will_dispositions = get_effective_dispositions(will, validation)
        for disp in will_dispositions:
            recipient = disp.heir
            amount = min(disp.amount, fp_remaining)
            if recipient in shares:
                shares[recipient].fp_amount += amount
            else:
                shares[recipient] = HeirShare { legitime_amount: 0, fp_amount: amount }
            fp_remaining -= amount

        // 7c. Undisposed free portion → intestate (Art. 960(2), mixed succession)
        if fp_remaining > 0:
            intestate_shares = compute_intestate_distribution(fp_remaining, heirs, lines)
            for (heir, amount) in intestate_shares:
                if heir in shares:
                    shares[heir].fp_amount += amount
                else:
                    shares[heir] = HeirShare { legitime_amount: 0, fp_amount: amount }

    // === INTESTATE SUCCESSION ===
    elif succession.succession_type == INTESTATE:
        intestate_shares = compute_intestate_distribution(net_estate, heirs, lines)
        for (heir, amount) in intestate_shares:
            shares[heir] = HeirShare {
                legitime_amount: amount,  // In intestate, everything is "legitime"
                fp_amount: 0,
                basis: get_intestate_basis(heir, succession.intestate_scenario),
            }

    // === MIXED SUCCESSION ===
    elif succession.succession_type == MIXED:
        // Testate portion first (with validation corrections)
        // Then intestate for undisposed remainder
        // See Testate path above — step 7c handles the intestate remainder

    // 7d. Distribute within representation lines (per stirpes)
    for (heir, share) in shares:
        if heir.line != null AND heir.line.mode == REPRESENTATION:
            line_total = share.total()
            per_stirpes = distribute_within_line(line_total, heir.line)
            // Replace single heir entry with representative entries
            shares.remove(heir)
            shares.merge(per_stirpes)

    return DistributionResult { shares: shares }
}
```

### Intestate Distribution Sub-Algorithm

```
function compute_intestate_distribution(
    estate: Money,
    heirs: List<Heir>,
    lines: LineResult
) -> Map<Heir, Money> {

    scenario = determine_intestate_scenario(heirs, lines)
    n = lines.n  // legitimate lines
    m = lines.m  // illegitimate lines
    spouse = find_spouse(heirs)

    match scenario {
        "I1":  // n legitimate children only
            return divide_equally_by_lines(lines.legitimate_lines, estate)

        "I2":  // n legitimate children + spouse
            // Spouse = 1 child's share (Art. 996)
            per_share = estate / (n + 1)
            return { each_lc_line: per_share, spouse: per_share }

        "I3":  // n legitimate + m illegitimate (no spouse)
            // 2:1 ratio method (Art. 983, Art. 895)
            total_units = 2*n + m
            per_unit = estate / total_units
            return { each_lc_line: 2 * per_unit, each_ic_line: per_unit }

        "I4":  // n legitimate + m illegitimate + spouse
            // Spouse = 1 LC share = 2 units (Art. 999)
            total_units = 2*n + m + 2
            per_unit = estate / total_units
            return { each_lc_line: 2*per_unit, each_ic_line: per_unit,
                     spouse: 2*per_unit }

        "I5":  // Legitimate parents only
            return divide_among_ascendants(heirs, estate)

        "I6":  // Parents + spouse
            return { parents: estate/2, spouse: estate/2 }

        "I7":  // Illegitimate children only
            return divide_equally_by_lines(lines.illegitimate_lines, estate)

        "I8":  // Illegitimate children + spouse
            return { ic_total: estate/2, spouse: estate/2 }

        "I9":  // Ascendants + illegitimate children
            return { ascendants: estate/2, ic_total: estate/2 }

        "I10":  // Ascendants + illegitimate + spouse
            return { ascendants: estate/2, ic_total: estate/4, spouse: estate/4 }

        "I11":  // Spouse only
            return { spouse: estate }

        "I12":  // Spouse + siblings/nephews/nieces
            spouse_share = estate / 2    // Art. 1001
            sibling_share = estate / 2
            sibling_distribution = distribute_among_collaterals(heirs, sibling_share)
            return { spouse: spouse_share, ...sibling_distribution }

        "I13":  // Siblings only
            return distribute_among_collaterals(heirs, estate)

        "I14":  // Other collateral relatives
            return distribute_among_collaterals(heirs, estate)

        "I15":  // No heirs → State
            return { state: estate }
    }
}
```

### Key: No Cap Rule in Intestate

In intestate succession, there is NO Art. 895 ¶3 cap rule. The 2:1 ratio method distributes the entire estate proportionally. This is a critical difference from testate succession.

---

## Step 8: Collation Adjustment

**Source**: `collation`
**Purpose**: Impute inter vivos donations against donee-heirs' shares (Arts. 1073-1074). Reduce the donee's actual distribution by the amount already received. Detect inofficiousness of donations.

### Algorithm

```
function step8_collation_adjustment(
    distribution: DistributionResult,
    estate_base_result: EstateBaseResult,
    legitime_result: LegitimeResult
) -> AdjustedDistribution {

    adjusted = copy(distribution.shares)
    inofficious_donations = []

    for collation_item in estate_base_result.collatable_donations:
        donee = collation_item.donee
        donation_amount = collation_item.collatable_amount
        charge_target = collation_item.charged_to

        if donee NOT in adjusted:
            continue  // Donee not an heir (stranger donation)

        // Impute: reduce donee's share by donation amount (Art. 1073)
        if charge_target == LEGITIME:
            // Deduct from donee's legitime portion
            adjusted[donee].legitime_amount -= donation_amount
            if adjusted[donee].legitime_amount < 0:
                // Donation exceeds legitime — excess cascades to FP
                excess = abs(adjusted[donee].legitime_amount)
                adjusted[donee].legitime_amount = 0
                adjusted[donee].fp_amount -= excess
                if adjusted[donee].fp_amount < 0:
                    // Donation exceeds entire share — inofficious
                    inofficious_amount = abs(adjusted[donee].fp_amount)
                    adjusted[donee].fp_amount = 0
                    inofficious_donations.append({
                        donation: collation_item.donation,
                        inofficious_amount: inofficious_amount
                    })

        elif charge_target == FREE_PORTION:
            // Stranger donation: reduce FP_disposable
            // This was already accounted for in Step 6 (inofficiousness check)
            // but track for narrative purposes
            pass

    // Art. 1064: Grandchildren by representation must collate parent's donations
    for line in all_representation_lines:
        parent_donations = filter(estate_base_result.collatable_donations,
                                   d => d.donee == line.original_heir)
        if len(parent_donations) > 0:
            total_parent_donated = sum(d.collatable_amount for d in parent_donations)
            // Reduce the line's total share
            for rep in line.representatives:
                rep_share_of_donation = total_parent_donated * (rep.share / line.total)
                adjusted[rep].legitime_amount -= rep_share_of_donation
                // May result in ₱0 distribution (Art. 1064 consequence)

    return AdjustedDistribution {
        shares: adjusted,
        inofficious_donations: inofficious_donations,
    }
}
```

### Key: Donee Does Not Return Property (Art. 1071)

Collation is mathematical, not physical. The donee keeps the donated property. Their inheritance share is simply reduced by the donation's value at the time of donation. Co-heirs receive equivalent property from the actual estate (Art. 1073-1074).

---

## Step 9: Vacancy Resolution

**Source**: `accretion-rules`
**Purpose**: Resolve vacant shares created by renunciation, predecease (when no representation exists), or incapacity that wasn't resolved earlier.

### Resolution Priority Chain

```
function step9_resolve_vacancies(
    distribution: AdjustedDistribution,
    will: Will | null,
    heirs: List<Heir>,
    lines: LineResult,
    iteration: int
) -> ResolvedDistribution {

    MAX_ITERATIONS = len(heirs)  // Infinite-loop guard

    vacancies = detect_vacancies(distribution)
    if len(vacancies) == 0:
        return distribution  // No vacancies — pass through

    for vacancy in vacancies:

        // Priority 1: SUBSTITUTION (Art. 859, testate only)
        if will != null AND vacancy.disposition != null:
            substitute = find_substitute(will, vacancy)
            if substitute != null AND substitute.is_eligible:
                transfer_share(vacancy, substitute, distribution)
                continue

        // Priority 2: REPRESENTATION (Arts. 970-977)
        // (Most representation was already handled in Step 2, but check again)
        if vacancy.cause != RENUNCIATION:
            reps = find_representatives(vacancy.heir, heirs)
            if len(reps) > 0:
                distribute_per_stirpes(vacancy.amount, reps, distribution)
                continue

        // Priority 3: ACCRETION (Arts. 1015-1021)
        if vacancy.source == LEGITIME:
            // Art. 1021: co-heirs succeed "in their own right"
            // This is NOT proportional accretion — it's scenario re-evaluation
            if iteration < MAX_ITERATIONS:
                // Remove vacant heir, RESTART from Step 3
                return ResolvedDistribution {
                    needs_restart: true,
                    restart_from: STEP_3,
                    removed_heirs: [vacancy.heir],
                }
        elif vacancy.source == FREE_PORTION:
            // Art. 1021: accretion proper — proportional to existing shares
            co_heirs = get_co_heirs_for_accretion(vacancy, will, heirs)
            if len(co_heirs) > 0:
                distribute_proportionally(vacancy.amount, co_heirs, distribution)
                continue

        // Priority 4: INTESTATE FALLBACK (Art. 1022(2), testate only)
        if will != null:
            // Vacant share passes to legal heirs under intestate rules
            intestate_shares = compute_intestate_distribution(vacancy.amount, heirs, lines)
            for (heir, amount) in intestate_shares:
                distribution.shares[heir].fp_amount += amount
    }

    return distribution
}
```

### Art. 1021 Critical Distinction

- **Vacant LEGITIME**: Co-heirs succeed "in their own right" — this means the engine must re-evaluate the scenario as if the vacating heir never existed. All fractions recompute. This can change the scenario code (e.g., T5 → T3 if an illegitimate child renounces).
- **Vacant FREE PORTION**: Accretion proper — the vacant share is distributed proportionally to co-heirs' existing shares (Art. 1019). No scenario re-evaluation needed.

---

## Step 10: Finalize + Generate Narratives

**Source**: spec requirement (engine output format)
**Purpose**: Convert rational fractions to peso amounts, handle rounding, and generate plain-English narrative explanations for each heir.

### Algorithm

```
function step10_finalize(
    distribution: ResolvedDistribution,
    net_estate: Money,
    heirs: List<Heir>,
    succession: SuccessionResult,
    legitime_result: LegitimeResult,
    computation_log: ComputationLog
) -> EngineOutput {

    // 1. Convert all fractions to peso amounts with rounding
    final_shares = allocate_with_rounding(distribution, net_estate)

    // 2. Verify: total distributed == net_estate
    total = sum(s.total() for s in final_shares.values())
    assert total == net_estate, "Distribution mismatch: {total} != {net_estate}"

    // 3. Generate per-heir narratives
    narratives = []
    for (heir, share) in final_shares:
        narrative = generate_narrative(
            heir, share, succession, legitime_result, computation_log
        )
        narratives.append(narrative)

    // 4. Collect warnings (items needing manual review)
    warnings = collect_warnings(computation_log)
    // e.g., Art. 903 grandparent ambiguity, cross-class accretion,
    //        collation disputes (Art. 1077), reserva troncal flags

    return EngineOutput {
        per_heir_shares: final_shares,
        narratives: narratives,
        computation_log: computation_log,
        warnings: warnings,
        succession_type: succession.succession_type,
        scenario_code: succession.testate_scenario or succession.intestate_scenario,
    }
}
```

### Rounding Algorithm (Rational → Peso)

```
function allocate_with_rounding(
    shares: Map<Heir, HeirShare>,
    total_estate: Money
) -> Map<Heir, FinalShare> {

    // Use rational arithmetic throughout; convert to centavos at the end
    result = {}
    total_allocated = Money(0)

    for (heir, share) in sorted_by_share_desc(shares):
        peso_amount = floor_to_centavo(share.total())
        result[heir] = FinalShare {
            legitime: floor_to_centavo(share.legitime_amount),
            free_portion: floor_to_centavo(share.fp_amount),
            total: peso_amount,
        }
        total_allocated += peso_amount

    // Distribute rounding remainder (1 centavo at a time, largest share first)
    remainder = total_estate - total_allocated
    for heir in sorted_by_share_desc(result):
        if remainder <= Money(0):
            break
        result[heir].total += Money(0.01)
        result[heir].legitime += Money(0.01)  // Attribute to legitime
        remainder -= Money(0.01)

    return result
}
```

### Narrative Generation Template

```
function generate_narrative(
    heir: Heir,
    share: FinalShare,
    succession: SuccessionResult,
    legitime_result: LegitimeResult,
    log: ComputationLog
) -> HeirNarrative {

    // Structure:
    // 1. Heir identification and category
    // 2. Legitime share explanation (if compulsory heir)
    // 3. Free portion share explanation (if any)
    // 4. Collation adjustments (if any)
    // 5. Total with citation

    parts = []

    // Line 1: Category
    parts.append("{heir.name} ({category_label(heir)}) receives {format_peso(share.total)}.")

    // Line 2: Legitime basis
    if share.legitime > 0:
        if heir.effective_category == LEGITIMATE_CHILD_GROUP:
            parts.append("As a {raw_label(heir)} (Art. 887(1)), {name} is a compulsory "
                + "heir entitled to an equal share of the collective legitime of one-half "
                + "(½) of the estate. Under Art. 888 of the Civil Code, the legitime of "
                + "{n} legitimate child lines is {format_peso(lc_collective)}, giving "
                + "each line {format_peso(share.legitime)}.")

        elif heir.effective_category == ILLEGITIMATE_CHILD_GROUP:
            parts.append("As an illegitimate child (Art. 176, Family Code), {name} is a "
                + "compulsory heir entitled to a legitime of one-half (½) of that of a "
                + "legitimate child. Under Art. 895 of the Civil Code, since each "
                + "legitimate child receives {format_peso(per_lc)}, {name}'s legitime "
                + "is {format_peso(share.legitime)}.")
            if legitime_result.cap_applied:
                parts.append("Note: The cap rule under Art. 895 ¶3 was applied — the "
                    + "total legitime of all illegitimate children was reduced to fit "
                    + "within the free portion after the surviving spouse's share was "
                    + "satisfied first.")

        elif heir.effective_category == SURVIVING_SPOUSE_GROUP:
            article = get_spouse_article(succession.testate_scenario)
            parts.append("As the surviving spouse ({article}), {name} is a compulsory "
                + "heir entitled to {format_peso(share.legitime)}.")

        elif heir.effective_category == LEGITIMATE_ASCENDANT_GROUP:
            parts.append("As a legitimate {ascendant_label(heir)} (Art. 889), {name} "
                + "is a compulsory heir. In the absence of legitimate descendants, "
                + "ascendants receive a collective legitime of one-half (½) of the "
                + "estate, which is {format_peso(share.legitime)} for {name}.")

    // Line 3: Free portion (if testate)
    if share.free_portion > 0:
        parts.append("{name} also receives {format_peso(share.free_portion)} from "
            + "the free portion as disposed in the will.")

    // Line 4: Collation (if applicable)
    if heir.has_collation_adjustments:
        parts.append("Note: {name} previously received {format_peso(donation_amount)} "
            + "as an inter vivos donation, which has been imputed against their share "
            + "under Art. 1073 of the Civil Code.")

    // Line 5: Representation (if applicable)
    if heir.inherits_by == REPRESENTATION:
        parts.append("{name} inherits by right of representation (Art. 970) in "
            + "place of {represented_person.name}, who {trigger_description}.")

    return HeirNarrative { heir: heir, text: join(parts, " ") }
}
```

---

## Pipeline Control Flow — Restart Conditions

The pipeline has two points where it may restart:

### Restart 1: Step 6 → Step 3 (Invalid Disinheritance)

When an invalid disinheritance is detected and an heir is reinstated, the concurrence scenario may change. The pipeline restarts from Step 3 with the updated heir pool.

### Restart 2: Step 9 → Step 3 (Vacant Legitime)

When a compulsory heir's legitime becomes vacant (renunciation without representation), Art. 1021 requires co-heirs to succeed "in their own right" — meaning the scenario is re-evaluated as if the vacating heir never existed.

### Restart Guard

```
MAX_RESTARTS = len(heirs)  // Upper bound: one restart per heir

restart_count = 0
while restart_count < MAX_RESTARTS:
    result = run_pipeline(input)
    if result.needs_restart:
        input = update_input(result)
        restart_count += 1
    else:
        break

if restart_count >= MAX_RESTARTS:
    raise Error("Pipeline exceeded maximum restart limit. Manual review required.")
```

---

## Pipeline Data Flow Summary

| Step | Input | Output | Key Decision |
|------|-------|--------|--------------|
| **1. Classify** | family_tree, decedent | List\<Heir\> | Who qualifies as heir, in what category |
| **2. Build Lines** | List\<Heir\>, decedent | LineResult (n, m, lines) | Representation analysis, line counting |
| **3. Succession Type** | will, heirs, lines | SuccessionResult (T/I scenario) | Testate vs intestate vs mixed; scenario code |
| **4. Estate Base** | net_estate, donations, heirs | EstateBaseResult (collation-adjusted) | Add back collatable donations (Art. 908) |
| **5. Legitimes** | estate_base, scenario, n, m | LegitimeResult (per-heir fractions) | Which fraction table applies; cap rule |
| **6. Validation** | will, heirs, legitimes | ValidationResult (corrections) | Preterition, disinheritance, underprovision, inofficiousness |
| **7. Distribute** | net_estate, legitimes, will | DistributionResult (per-heir amounts) | Legitime allocation + FP distribution |
| **8. Collation Adj.** | distribution, donations | AdjustedDistribution | Impute donations, detect inofficiousness |
| **9. Vacancies** | distribution, will, heirs | ResolvedDistribution | Substitution → representation → accretion → intestate |
| **10. Finalize** | distribution, all context | EngineOutput (₱ amounts + narratives) | Rounding, narrative generation, audit trail |

---

## Cross-Step Interactions

### Scenario Re-Evaluation Triggers

| Trigger | From Step | Effect |
|---------|-----------|--------|
| Invalid disinheritance (Art. 918) | Step 6 | Reinstate heir → restart from Step 3 |
| Vacant legitime (Art. 1021) | Step 9 | Remove heir → restart from Step 3 |
| Total renunciation (Art. 969) | Step 9 | Next degree inherits in own right → restart from Step 3 |
| Preterition (Art. 854) | Step 6 | Annul institution → switch to intestate distribution in Step 7 |

### Collation Integration Points

| Point | Step | What Happens |
|-------|------|-------------|
| Estate base computation | Step 4 | Art. 908: add collatable donations to net estate |
| Distribution adjustment | Step 8 | Arts. 1073-1074: reduce donee's share, give co-heirs equivalents |
| Inofficiousness check | Step 6 | Art. 911: if donations + dispositions > FP, reduce |

### Two Free Portion Values

| Value | Computed In | Used By |
|-------|-------------|---------|
| FP_gross | Step 5 | Art. 895 ¶3 cap base |
| FP_disposable | Step 5 | Testate validation (Step 6), will distribution (Step 7) |

---

## Implementation Notes

### Rational Arithmetic

All computation must use exact rational arithmetic (fractions with integer numerator and denominator) to avoid floating-point rounding errors. Convert to peso amounts only in Step 10.

```
struct Fraction {
    numerator: BigInt,
    denominator: BigInt,
}

// All intermediate computations use Fraction
// Only Step 10 converts to Money (centavo-precision)
```

### Determinism Guarantee

The pipeline is fully deterministic:
- Same inputs → same scenario code → same fractions → same peso amounts
- No randomness, no probabilistic decisions, no LLM in the loop
- All "ambiguous" legal questions are either resolved by the analysis (with citation) or flagged as warnings requiring manual review

### Manual Review Flags (Warnings)

The engine flags situations that require human judgment:

| Flag | Trigger | Legal Basis |
|------|---------|-------------|
| `GRANDPARENT_OF_ILLEGITIMATE` | Art. 903 says "parents" not "ascendants" | Gray area |
| `CROSS_CLASS_ACCRETION` | Art. 1018 vs Art. 968 ambiguity | Scholarly debate |
| `RESERVA_TRONCAL` | Art. 891 asset-level encumbrance detected | Post-distribution |
| `COLLATION_DISPUTE` | Art. 1077 disputed collation item | Dual computation |
| `RA_11642_RETROACTIVITY` | Pre-2022 adoption with Sec. 41 extension | Transitional |
| `ARTICULO_MORTIS` | Art. 900 ¶2 conditions detected | Verify 3 conditions |

---

*Synthesized from all 19 Wave 1-4 analysis files. Cross-references: compulsory-heirs-categories (Step 1), representation-rights (Step 2), heir-concurrence-rules (Step 3), collation (Steps 4, 8), legitime-table (Step 5), testate-validation + preterition + disinheritance-rules (Step 6), testate-institution + intestate-order + free-portion-rules (Step 7), accretion-rules (Step 9).*
