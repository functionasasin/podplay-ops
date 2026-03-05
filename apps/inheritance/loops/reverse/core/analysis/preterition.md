# Preterition — Total Omission of Compulsory Heirs in the Direct Line (Art. 854)

**Aspect**: preterition
**Wave**: 4 (Distribution Rules)
**Primary Legal Basis**: Arts. 854-855, 918 (Civil Code); Art. 176 (Family Code)
**Depends On**: compulsory-heirs-categories, heir-concurrence-rules, representation-rights, legitime-table, free-portion-rules, testate-institution, testate-validation, disinheritance-rules
**References**: Nuguid v. Nuguid (G.R. No. L-23445, 1966), Acain v. IAC (1987), Tubera-Balintec v. Heirs of Tubera (G.R. No. 235701, 2023)

---

## Overview

Preterition is the **most severe sanction** in Philippine testate succession: the total omission of a compulsory heir in the direct line from the will annuls the **entire institution of heirs**. It is the "nuclear option" — triggered not by testator intent but by the **objective fact** of total omission.

This analysis provides the **complete standalone reference** for the engine's preterition sub-system:

1. Art. 854 deep dive — text, scope, and mechanics
2. Who can be preterited (direct-line heirs only)
3. What constitutes "total omission" vs. token provision
4. Effect on the will — what is annulled, what survives
5. Post-preterition distribution algorithm
6. Art. 854 ¶2: predeceased preterited heirs and representation
7. Art. 854 vs. Art. 918: total annulment vs. partial annulment
8. Interaction with disinheritance, underprovision, and mixed scenarios
9. Illegitimate children and preterition
10. Born-after-death (posthumous) children
11. Complete pseudocode
12. Data model additions
13. Edge cases
14. Test cases
15. Narrative templates

---

## Legal Basis

### Art. 854 — The Preterition Rule

> "The preterition or omission of one, some, or all of the compulsory heirs in the direct line, whether living at the time of the execution of the will or born after the death of the testator, shall annul the institution of heir; but the devises and legacies shall be valid insofar as they are not inofficious.
>
> If the omitted compulsory heirs should die before the testator, the institution shall be effectual, without prejudice to the right of representation."

**Structural decomposition of Art. 854**:

| Element | Text | Engine Implication |
|---------|------|-------------------|
| **Subject** | "one, some, or all of the compulsory heirs in the direct line" | Only direct-line compulsory heirs trigger preterition |
| **Temporal scope** | "whether living at the time of the execution of the will or born after the death of the testator" | Posthumous children covered; will-execution date irrelevant |
| **Effect** | "shall annul the institution of heir" | ALL institutions of heirs voided — not just the preterited heir's share |
| **Survivor clause** | "but the devises and legacies shall be valid insofar as they are not inofficious" | Legacies/devises survive unless they impair legitime |
| **Predecease clause** | "If the omitted compulsory heirs should die before the testator, the institution shall be effectual" | Preterition moot if preterited heir predeceases |
| **Representation exception** | "without prejudice to the right of representation" | Even if preterited heir predeceases, their representatives may re-trigger preterition |

### Art. 855 — Underprovision Recovery (The Non-Preterition Path)

> "The share of a child or descendant omitted in a will must first be taken from the part of the estate not disposed of by the will, if any; if that is not sufficient, so much as may be necessary must be taken proportionally from the shares of the other compulsory heirs; and if the proportion available is not enough to cover the entire legitime, so much as may be necessary must be taken in the same proportion from the shares of the voluntary heirs."

Art. 855 applies when:
- A compulsory heir receives **less** than their legitime (underprovision), OR
- A spouse or illegitimate child is omitted (they are NOT in the direct line for Art. 854 purposes)

Art. 855 does NOT annul the institution — it recovers the deficit through a 3-source waterfall.

### Art. 918 — Defective Disinheritance (The Partial Annulment)

> "Disinheritance without a specification of the cause, or for a cause the truth of which, if contradicted, is not proved, or which is not one of those set forth in this Code, shall annul the institution of heirs insofar as it may prejudice the person disinherited; but the devises and legacies and other testamentary dispositions shall be valid to such extent as will not impair the legitime."

Art. 918 is the **partial annulment** counterpart to Art. 854's total annulment. See Section 7 below for the critical distinction.

---

## 1. Who Can Be Preterited — Direct-Line Compulsory Heirs Only

Art. 854 uses the precise phrase "compulsory heirs **in the direct line**." This limits preterition to:

### 1.1 Heirs Subject to Preterition

| Heir Category | In Direct Line? | Can Be Preterited? | Legal Basis |
|--------------|----------------|--------------------|----|
| Legitimate children | Yes (descending) | **YES** | Art. 887(1), Art. 854 |
| Legitimate descendants (grandchildren by representation) | Yes (descending) | **YES** (as representatives) | Arts. 970-972, 854 |
| Adopted children | Yes (= legitimate) | **YES** | RA 8552 Sec. 17 |
| Legitimated children | Yes (= legitimate) | **YES** | FC Art. 179 |
| Illegitimate children | Yes (descending) | **YES** | Art. 887(4-5), Art. 854; confirmed by *Tubera-Balintec v. Heirs of Tubera* (2023) |
| Legitimate parents | Yes (ascending) | **YES** | Art. 887(2), Art. 854; confirmed by *Nuguid v. Nuguid* (1966) |
| Legitimate ascendants (grandparents) | Yes (ascending) | **YES** (when parents don't survive) | Arts. 889-890 |

### 1.2 Heirs NOT Subject to Preterition

| Heir Category | In Direct Line? | Preterition? | What Happens If Omitted? |
|--------------|----------------|-------------|--------------------------|
| **Surviving spouse** | **No** (affinity, not consanguinity) | **NO** | Art. 855 underprovision recovery; spouse still gets legitime |
| Collateral relatives | No | No | Only inherit intestate anyway |

**Key principle**: The surviving spouse, despite being a compulsory heir under Art. 887(3), is NOT "in the direct line" because the direct line is constituted by consanguinity (blood relationship) in the ascending and descending directions (Arts. 964-965). The spousal relationship is one of affinity, not consanguinity.

**Engine rule**: `spouse_omission → underprovision (Art. 855), NEVER preterition (Art. 854)`

### 1.3 The Illegitimate Child Question — Settled

There was historical debate about whether illegitimate children are "in the direct line" for Art. 854 purposes. This is now settled:

- **Tubera-Balintec v. Heirs of Tubera** (G.R. No. 235701, 2023): The Supreme Court held that an illegitimate child is a compulsory heir in the direct descending line, and their total omission constitutes preterition.
- **Dumayas v. Lindo** (2021): Even illegitimate descendants omitted from wills executed before the Family Code may invoke Art. 854 if the succession opens after the Family Code's effectivity.
- Rationale: Art. 887(4-5) lists illegitimate children as compulsory heirs; Art. 964 defines the direct line as "constituted by the series of degrees among ascendants and descendants" — illegitimate children are in the descending line of the decedent.

**Engine rule**: `illegitimate_child.is_in_direct_line = true` — always.

---

## 2. What Constitutes "Total Omission"

Preterition requires **total** omission — the compulsory heir must receive absolutely **nothing** from the will: no institution, no legacy, no devise, no usufruct, no annuity.

### 2.1 The Token Provision Defense

Even a **nominal** provision (e.g., "I leave ₱1 to my son LC3") defeats preterition. The heir was not "omitted" — they were provided for, however inadequately. If the provision is below the heir's legitime, the remedy is **underprovision** under Art. 855, not preterition under Art. 854.

```
PRETERITION vs. UNDERPROVISION decision:

IF heir receives NOTHING from the will (no institution, no legacy, no devise):
    → TOTAL OMISSION → PRETERITION (Art. 854)
    → Effect: annul ALL institutions

IF heir receives SOMETHING but less than their legitime:
    → PARTIAL PROVISION → UNDERPROVISION (Art. 855)
    → Effect: recover deficit from 3-source waterfall
    → Institutions SURVIVE
```

### 2.2 What Counts as "Providing For" a Compulsory Heir

The engine must check whether the heir appears in ANY of these:

| Provision Type | Defeats Preterition? | Example |
|---------------|---------------------|---------|
| Institution as heir | Yes | "I institute LC1 as my heir" |
| Legacy (personal property) | Yes | "I bequeath ₱1 to LC1" |
| Devise (real property) | Yes | "I devise Lot A to LC1" |
| Usufruct | Yes | "I give LC1 usufruct over my house" |
| Share in residuary | Yes | "The rest to my children equally" |
| Named as substitute heir | **No** — substitute only receives IF primary fails | Cannot defeat preterition |
| Named as fideicommissary | **Debatable** — but engine should treat as NO since receipt is conditional on fiduciary | Flag for review |
| Conditional institution that fails | **No** — if condition doesn't happen, heir receives nothing | Preterition applies |

### 2.3 Disinheritance vs. Preterition — Mutual Exclusivity

A compulsory heir who is **disinherited** in the will (even invalidly) is NOT preterited. The testator addressed the heir; the omission is not "total." The distinction:

| Scenario | Art. 854 (Preterition)? | Art. 918 (Defective Disinheritance)? |
|----------|------------------------|--------------------------------------|
| Heir completely unmentioned in will | **YES** | No |
| Heir disinherited with valid cause | No (heir excluded validly) | No |
| Heir disinherited with invalid/unproven cause | No | **YES** |
| Heir disinherited without specifying cause | No | **YES** |
| Heir disinherited but reconciliation occurred | No* | **YES** (reconciliation voids the disinheritance → Art. 918 applies) |

*Note on reconciliation: Even if the will's disinheritance clause is void due to reconciliation (Art. 922), this is still treated as invalid disinheritance (Art. 918), NOT preterition. The testator addressed the heir in the will — the omission is not total.

---

## 3. Effect of Preterition on the Will

### 3.1 What Is Annulled — The Institution of Heirs

Art. 854 annuls **"the institution of heir"** — meaning ALL institutions in the will, not just the preterited heir's would-be share.

```
ANNULMENT SCOPE:
  - ALL InstitutionOfHeir entries in the will → VOID
  - This means: every person named as a universal heir (Art. 840) loses their institution
  - The entire estate passes as if the decedent died INTESTATE (with exceptions below)
```

**What annulment does NOT void**:
- Legacies (specific personal property bequests)
- Devises (specific real property grants)
- Other testamentary dispositions (usufructs, fideicommissary obligations expressed as legacies)

These survive **"insofar as they are not inofficious"** — i.e., only if they don't impair compulsory heirs' legitimes.

### 3.2 What Survives — Legacies and Devises

After preterition annuls the institution:

```
function evaluate_surviving_dispositions(
    estate: Decimal,
    will: Will,
    heirs: Heir[]
) -> SurvivingDispositions {

    // Step 1: Compute total legitime under intestate rules
    // (since institution is annulled, intestate scenario applies)
    total_legitime = compute_total_legitime_intestate(estate, heirs)

    // Step 2: Compute free portion
    free_portion = estate - total_legitime

    // Step 3: Sum all surviving testamentary dispositions
    total_legacies = sum(will.legacies.map(l => l.amount))
    total_devises = sum(will.devises.map(d => d.value))
    total_testamentary = total_legacies + total_devises

    // Step 4: Check inofficiousness
    if total_testamentary <= free_portion:
        return ALL_SURVIVE  // All legacies/devises are valid
    else:
        // Reduce per Art. 911 priority
        excess = total_testamentary - free_portion
        return reduce_dispositions(will.legacies, will.devises, excess)
}
```

### 3.3 The Post-Preterition Distribution Algorithm

```
function distribute_after_preterition(
    estate: Decimal,
    will: Will,
    heirs: Heir[],
    preterited_heirs: Heir[]
) -> Distribution {

    // Phase 1: Evaluate surviving legacies/devises
    surviving = evaluate_surviving_dispositions(estate, will, heirs)

    // Phase 2: Compute estate available for intestate distribution
    estate_for_intestate = estate - surviving.total_value

    // Phase 3: Distribute remainder per intestate rules
    // CRITICAL: ALL compulsory heirs participate in intestate distribution,
    // including those who WERE named in the annulled institution
    intestate_shares = compute_intestate_distribution(estate_for_intestate, heirs)

    // Phase 4: Merge distributions
    result = []
    for each heir in heirs:
        result.push({
            heir: heir,
            from_legitime: intestate_shares[heir],  // from intestate rules
            from_legacy: surviving.amount_for(heir), // if they're also a legatee
            total: intestate_shares[heir] + surviving.amount_for(heir),
        })

    // Phase 5: Add legatee/devisee distributions
    for each legatee in surviving.legatees:
        if legatee NOT in heirs:
            result.push({
                heir: legatee,
                from_legacy: surviving.amount_for(legatee),
                total: surviving.amount_for(legatee),
            })

    return result
}
```

### 3.4 Disinheritance Survives Preterition

If the will both preterits one heir AND validly disinherits another, preterition annuls the institution, but the disinheritance is NOT voided. Within the resulting intestate distribution, the validly disinherited heir remains excluded.

```
Example:
  - Will institutions LC1 as sole heir (omitting LC2 and LC3)
  - Will validly disinherits LC3 for maltreatment (Art. 919(6))
  - LC2 is preterited → Art. 854 annuls the institution
  - BUT LC3's disinheritance remains valid
  - Intestate distribution: LC1, LC2, [LC3's descendants by representation], Spouse
  - LC3 personally receives nothing; LC3's children step in per Art. 923
```

---

## 4. Art. 854 ¶2 — Predeceased Preterited Heir

### 4.1 Basic Rule: Institution Stands If Preterited Heir Predeceases

> "If the omitted compulsory heirs should die before the testator, the institution shall be effectual..."

If the heir who would have been preterited dies before the testator:
- And has **no representatives** (no descendants who can step in): preterition is moot; institution stands
- And has **representatives**: check whether those representatives are also omitted

### 4.2 "...Without Prejudice to the Right of Representation"

The exception clause means representation can **re-trigger preterition through the representatives**:

```
function check_preterition_through_predecease(
    heir: Heir,
    will: Will,
    all_heirs: Heir[]
) -> PreteritionCheckResult {

    if heir.is_alive_at_death:
        // Standard check
        return is_totally_omitted(heir, will)

    // Heir predeceased — check if they WOULD have been preterited
    if NOT would_be_preterited(heir, will):
        return NOT_PRETERITED  // Heir was provided for in the will

    // Heir would have been preterited. Check for representatives
    representatives = get_valid_representatives(heir, all_heirs)

    if len(representatives) == 0:
        return NOT_PRETERITED  // No representatives → institution effectual (Art. 854 ¶2)

    // Check if ANY representative is provided for in the will
    for rep in representatives:
        if is_provided_for_in_will(rep, will):
            return NOT_PRETERITED  // At least one representative covered → no preterition for this line

    // ALL representatives are also omitted → preterition through representation
    return PRETERITED_THROUGH_REPRESENTATION {
        original_heir: heir,
        representatives: representatives,
    }
}
```

### 4.3 Representation Scope

Representation for preterition purposes follows the same rules as general representation (Arts. 970-977):
- **Descending line**: unlimited depth (Art. 982)
- **Ascending line**: NO representation (Art. 972) — if a preterited parent predeceases, their parents cannot represent them
- **Collateral line**: only children of siblings (Art. 972) — but this is irrelevant since preterition only affects direct-line heirs

---

## 5. Illegitimate Children and Preterition

### 5.1 Illegitimate Children CAN Be Preterited

As confirmed by *Tubera-Balintec v. Heirs of Tubera* (2023), illegitimate children are compulsory heirs in the direct descending line. Their total omission from a will constitutes preterition.

### 5.2 Engine Implications

When an illegitimate child is preterited:
1. The institution of heirs is annulled (same as for legitimate children)
2. Post-preterition distribution follows intestate rules
3. In intestate distribution, the illegitimate child gets their intestate share (2:1 ratio method with legitimate children, NOT the testate ½-share)
4. This means preterition of an illegitimate child can **benefit** them — intestate shares are generally more favorable than testate legitime

### 5.3 Preterition of Illegitimate Child + Legitimate Children Named

```
Example:
  Estate = ₱12,000,000
  Will: "I institute LC1 and LC2 as sole heirs, equally."
  IC1 (illegitimate child) completely omitted.

  Preterition triggered → institution annulled → intestate distribution:
  - Unit method: LC1 = 2 units, LC2 = 2 units, IC1 = 1 unit → 5 units total
  - Per unit: ₱12,000,000 ÷ 5 = ₱2,400,000
  - LC1: ₱4,800,000, LC2: ₱4,800,000, IC1: ₱2,400,000

  Compare to testate (had IC1 been given a token ₱1):
  - LC collective legitime: ½ × ₱12M = ₱6M → ₱3M each
  - IC1 legitime: ½ of LC share from FP = ₱1,500,000 (from FP of ₱6M minus spouse share)

  IC1 gets ₱2,400,000 intestate vs. ₱1,500,000 testate — preterition benefits IC1.
```

---

## 6. Born-After-Death (Posthumous) Children

Art. 854 explicitly covers children "born after the death of the testator." This addresses:

1. **Child conceived before death, born after**: Fully covered. Art. 1025 states "A child already conceived at the time of the death of the decedent is capable of succeeding provided it be born later under the conditions prescribed in Article 41."
2. **Practical effect**: The testator could not have known about the child when making the will, yet preterition still applies. The law presumes no testator intent requirement — preterition is objective.

**Engine handling**: The engine accepts the heir list as an input. If a posthumous child is included in the heir list (by the user/system) and is not provided for in the will, preterition is triggered.

---

## 7. Art. 854 vs. Art. 918 — The Critical Distinction

This is the most important distinction for the engine's testate validation pipeline.

### 7.1 Comparison Table

| Feature | Art. 854 (Preterition) | Art. 918 (Defective Disinheritance) |
|---------|----------------------|-------------------------------------|
| **Trigger** | Total omission of direct-line heir | Invalid disinheritance attempt |
| **Testator awareness** | Presumed involuntary (testator "forgot") | Testator aware (explicitly addressed heir) |
| **Annulment scope** | **TOTAL** — annuls ALL institutions | **PARTIAL** — annuls only insofar as it prejudices the disinherited heir |
| **Post-annulment regime** | Intestate succession for entire estate (minus surviving legacies/devises) | Rest of will stands; only enough reduced to restore the heir's legitime |
| **Surviving dispositions** | Legacies/devises valid if not inofficious | Devises, legacies, and other dispositions valid if not impairing legitime |
| **Severity** | Nuclear — whole institution voided | Surgical — minimum annulment needed |
| **Pipeline position** | Check 1 (runs first) | Check 2 (runs after preterition check) |

### 7.2 Why Order Matters

Preterition is checked BEFORE defective disinheritance because:
1. If preterition is found, it annuls ALL institutions — no need to check individual disinheritances
2. But valid disinheritances still apply within the resulting intestate distribution
3. Invalid disinheritances (Art. 918) are only relevant when preterition is NOT triggered

### 7.3 Worked Comparison

```
SCENARIO A: LC3 completely omitted (no mention at all)
  → Art. 854 preterition → ALL institutions annulled → intestate for entire estate

SCENARIO B: LC3 disinherited but cause is invalid
  → Art. 918 → institutions annulled ONLY insofar as they prejudice LC3
  → LC3 gets their legitime restored; other institutions stand
  → Rest of will is valid

SCENARIO C: LC3 given ₱1 legacy (below legitime)
  → Neither Art. 854 nor Art. 918 → Art. 855 underprovision recovery
  → 3-source waterfall: undisposed estate → other compulsory heirs' excess → voluntary heirs
```

---

## 8. The Preterition Detection Algorithm

### 8.1 Complete Pseudocode

```
struct PreteritionResult {
    is_preterition: bool,
    preterited_heirs: Heir[],             // heirs who were totally omitted
    through_representation: Map<Heir, Heir[]>, // predeceased omitted heirs → their representatives
    annulment_scope: AnnulmentScope,       // TOTAL_INSTITUTION
    surviving_legacies: Legacy[],          // valid legacies post-inofficiousness check
    surviving_devises: Devise[],           // valid devises post-inofficiousness check
}

enum AnnulmentScope {
    TOTAL_INSTITUTION,  // Art. 854 — all institutions voided
    NONE,               // No preterition found
}

function detect_preterition(
    will: Will,
    heirs: Heir[],
    estate: Decimal
) -> PreteritionResult {

    // Step 1: Identify all direct-line compulsory heirs
    direct_line_heirs = filter(heirs, h =>
        h.is_compulsory AND
        h.is_in_direct_line AND  // LC, IC, adopted, legitimated, ascendants
        NOT h.is_validly_disinherited  // disinherited heirs cannot be preterited
    )

    preterited = []
    through_representation = {}

    // Step 2: For each direct-line heir, check total omission
    for each heir in direct_line_heirs:
        if heir.is_alive_at_death:
            if is_totally_omitted(heir, will):
                preterited.push(heir)
        else:
            // Predeceased — check via representation (Art. 854 ¶2)
            reps = get_valid_representatives(heir, heirs)
            if len(reps) == 0:
                continue  // No reps → institution effectual

            // Check if the predeceased heir would have been preterited
            if NOT is_totally_omitted(heir, will):
                continue  // Heir was provided for → no preterition

            // Check if ALL representatives are also omitted
            all_reps_omitted = all(reps, r => is_totally_omitted(r, will))
            if all_reps_omitted:
                preterited.push(heir)
                through_representation[heir] = reps

    // Step 3: Determine result
    if len(preterited) == 0:
        return PreteritionResult { is_preterition: false }

    // Step 4: Evaluate surviving dispositions
    surviving = evaluate_surviving_dispositions(estate, will, heirs)

    return PreteritionResult {
        is_preterition: true,
        preterited_heirs: preterited,
        through_representation: through_representation,
        annulment_scope: TOTAL_INSTITUTION,
        surviving_legacies: surviving.legacies,
        surviving_devises: surviving.devises,
    }
}

function is_totally_omitted(heir: Heir, will: Will) -> bool {
    // Check all possible forms of testamentary provision
    in_institution = any(will.institutions, i => i.heir == heir)
    in_legacy = any(will.legacies, l => l.legatee == heir)
    in_devise = any(will.devises, d => d.devisee == heir)
    in_usufruct = any(will.usufructs, u => u.beneficiary == heir)

    return NOT (in_institution OR in_legacy OR in_devise OR in_usufruct)
}

function is_provided_for_in_will(heir: Heir, will: Will) -> bool {
    return NOT is_totally_omitted(heir, will)
}
```

### 8.2 Inofficiousness Check for Surviving Legacies/Devises

```
function evaluate_surviving_dispositions(
    estate: Decimal,
    will: Will,
    heirs: Heir[]
) -> SurvivingDispositions {

    // Compute total legitime (using INTESTATE scenario since institution annulled)
    total_legitime = sum(
        compute_intestate_share(h, heirs, estate)
        for h in heirs if h.is_compulsory
    )

    // Note: in intestate succession, there's no "free portion" per se,
    // but for inofficiousness purposes, we compute what remains after
    // all compulsory heirs' intestate shares
    // Actually: post-preterition, the free portion = estate - total_legitime
    // But in intestate, the ENTIRE estate goes to heirs (no free portion)
    // So the free portion for legacy purposes = 0 if only compulsory heirs,
    // unless the intestate distribution doesn't exhaust the estate (it always does)

    // CORRECTION: After preterition, the estate distributes intestate.
    // In intestate succession, the ENTIRE estate goes to heirs.
    // But Art. 854 says legacies/devises survive if "not inofficious."
    // "Inofficious" means impairing the legitime.
    // The test: total_legacies + total_devises + total_intestate_legitime <= estate
    // Since intestate distribution = entire estate, any legacy/devise would
    // reduce what's available for intestate heirs.
    // But the law allows legacies/devises up to the free portion.

    // RESOLUTION: Compute based on TESTATE legitimes (what the heirs are entitled to
    // as compulsory heirs), not intestate shares (which may be higher).
    // The "inofficious" test is: do the legacies/devises impair the LEGITIMES,
    // not the intestate shares.

    // Compute testate-regime legitimes
    testate_total_legitime = compute_total_compulsory_legitime(estate, heirs)
    free_portion = estate - testate_total_legitime

    total_legacies = sum(will.legacies.map(l => l.amount))
    total_devises = sum(will.devises.map(d => d.value))
    total_testamentary = total_legacies + total_devises

    if total_testamentary <= free_portion:
        // All legacies/devises survive
        remaining_for_intestate = estate - total_testamentary
        return SurvivingDispositions {
            legacies: will.legacies,
            devises: will.devises,
            total_value: total_testamentary,
            remaining_estate: remaining_for_intestate,
        }
    else:
        // Reduce per Art. 911 priority
        excess = total_testamentary - free_portion
        reduced = reduce_dispositions(will.legacies, will.devises, excess)
        remaining = estate - (total_testamentary - excess)
        return SurvivingDispositions {
            legacies: reduced.legacies,
            devises: reduced.devises,
            total_value: total_testamentary - excess,
            remaining_estate: remaining,
        }
}
```

### 8.3 Inofficiousness Debate: Testate Legitime vs. Intestate Share

There is a subtle but important question: when Art. 854 says legacies/devises survive "insofar as they are not inofficious," does "inofficious" mean:
- (A) Impairing the **testate legitime** (the minimum guaranteed share), OR
- (B) Impairing the **intestate share** (what heirs would get in full intestacy)?

**The prevailing interpretation is (A)**: inofficiousness means impairing the legitime, not the intestate share. The free portion exists even in a preterition scenario for purposes of evaluating legacies/devises. This means:

```
free_portion_for_legacies = estate - total_compulsory_legitime

NOT: free_portion_for_legacies = estate - total_intestate_shares (= 0)
```

If interpretation (B) were correct, NO legacies/devises would ever survive preterition (since intestate succession distributes the entire estate). But Art. 854 explicitly contemplates surviving legacies — so interpretation (A) must be correct.

**Engine implementation**: Use testate-regime legitime computation (not intestate shares) to determine the inofficiousness threshold.

---

## 9. Post-Preterition Distribution — The Complete Algorithm

```
function complete_preterition_distribution(
    estate: Decimal,
    will: Will,
    heirs: Heir[],
    preterition: PreteritionResult
) -> Distribution {

    // PHASE 1: Determine surviving legacies/devises and their total value
    surviving = preterition.surviving_legacies + preterition.surviving_devises
    total_surviving = sum(surviving.map(s => s.effective_amount))

    // PHASE 2: Compute estate available for intestate distribution
    estate_for_intestate = estate - total_surviving

    // PHASE 3: Apply disinheritances (valid ones survive preterition)
    effective_heirs = filter(heirs, h => NOT h.is_validly_disinherited)
    // But disinherited heirs' descendants by representation participate
    for each disinherited in filter(heirs, h => h.is_validly_disinherited):
        reps = get_representatives(disinherited, heirs)
        effective_heirs.extend(reps)  // They inherit by representation

    // PHASE 4: Distribute intestate
    intestate_distribution = compute_intestate_distribution(
        estate_for_intestate,
        effective_heirs
    )

    // PHASE 5: Merge all distributions
    result = Distribution { entries: [] }

    // Intestate shares
    for each (heir, amount) in intestate_distribution:
        result.add(heir, amount, source: "INTESTATE_POST_PRETERITION")

    // Legacy/devise shares
    for each disposition in surviving:
        result.add(disposition.beneficiary, disposition.effective_amount,
                   source: "SURVIVING_LEGACY_DEVISE")

    return result
}
```

---

## 10. Data Model Additions

```
struct PreteritionResult {
    is_preterition: bool,
    preterited_heirs: Heir[],
    through_representation: Map<Heir, Heir[]>,
    annulment_scope: AnnulmentScope,
    surviving_legacies: Legacy[],
    surviving_devises: Devise[],
    reduction_applied: Decimal,      // amount reduced from inofficious dispositions
}

enum AnnulmentScope {
    TOTAL_INSTITUTION,  // Art. 854 preterition — ALL institutions voided
    PARTIAL,            // Art. 918 defective disinheritance — only insofar as prejudices heir
    NONE,               // No annulment
}

struct SurvivingDispositions {
    legacies: Legacy[],           // legacies that survive (possibly reduced)
    devises: Devise[],            // devises that survive (possibly reduced)
    total_value: Decimal,         // sum of all surviving dispositions
    remaining_estate: Decimal,    // estate available for intestate distribution
    reductions: Reduction[],      // any reductions applied for inofficiousness
}

// Add to the pipeline's ValidationResult:
struct PreteritionCheck {
    triggered: bool,
    preterited_heirs: Heir[],
    through_representation: Map<Heir, Heir[]>,
    surviving_dispositions: SurvivingDispositions,
    resulting_distribution_mode: DistributionMode,  // INTESTATE or MIXED
}

enum DistributionMode {
    INTESTATE,    // No surviving legacies/devises → pure intestate
    MIXED,        // Surviving legacies/devises + intestate for remainder
}
```

---

## 11. Interactions With Other Engine Components

### 11.1 Interaction with Testate Validation Pipeline

Preterition is **Check 1** in the validation pipeline (see `testate-validation.md`). If triggered:
- Pipeline **terminates** — no need for Checks 2-5
- Exception: valid disinheritances are noted and applied within the intestate distribution

### 11.2 Interaction with Intestate Distribution Engine

Post-preterition, the intestate distribution engine handles the remaining estate. All the intestate rules apply:
- Unit ratio method for legitimate + illegitimate children
- Spouse gets same share as legitimate child (Art. 996/999)
- Representation per stirpes
- No cap rule (intestate has no Art. 895 ¶3 cap)

### 11.3 Interaction with Collation (Art. 1061)

If the decedent made inter vivos donations subject to collation, the collated estate base is used for computing the inofficiousness threshold:
- Collated estate = net_estate_at_death + collatable_donations
- Free portion for inofficiousness = collated_estate - total_legitime
- If surviving legacies + devises exceed this free portion, reduce them

### 11.4 Interaction with Disinheritance

As discussed in Section 3.4: valid disinheritances survive preterition. The disinheritance was a separate testamentary act that is not part of the "institution of heirs."

---

## 12. Edge Cases

### EC-1: All Compulsory Heirs Preterited (No Voluntary Heirs in Will)
- Will only contains institutions for strangers (e.g., "I leave everything to my friend F")
- ALL compulsory heirs omitted → Art. 854 annuls institution
- F's institution is voided; entire estate goes intestate
- If F was also given a legacy (separate from institution), the legacy survives per Art. 854

### EC-2: Preterition of Only One of Multiple Children
- Will institutions LC1 and LC2, completely omits LC3
- LC3 is preterited → ALL institutions annulled (not just LC1/LC2's shares)
- LC1 and LC2 also lose their institutions and receive intestate shares instead
- Result may be better or worse for LC1/LC2 depending on the will's dispositions

### EC-3: Token Legacy Defeating Preterition
- Will: "I leave ₱1 to LC3. I institute F as my sole heir."
- LC3 received something → NOT preterited → Art. 855 underprovision instead
- F's institution stands (but reduced to accommodate LC3's legitime deficit)
- Dramatic difference: ₱1 legacy changes outcome from total annulment to partial reduction

### EC-4: Preterited Heir Who Is Also a Legatee Elsewhere
- Impossible by definition: if the heir receives ANY testamentary provision, they are not preterited
- If the heir is named as a legatee, they are provided for → no preterition

### EC-5: Adopted Child Preterited
- Adopted child = legitimate child (RA 8552 Sec. 17)
- Total omission of adopted child → preterition → institution annulled
- Engine treats identically to omission of biological legitimate child

### EC-6: Preterition of Illegitimate Child Only
- Will names all legitimate children and spouse; omits IC1
- IC1 is in the direct descending line → preterition triggered
- ALL institutions annulled → entire estate distributes intestate
- Note: under intestate rules (no cap), IC1 may get MORE than they would have under testate legitime

### EC-7: Multiple Preteritions (Some Alive, Some Through Representation)
- LC1 alive and omitted; LC2 predeceased (omitted, with grandchildren GC1, GC2 also omitted)
- Both LC1 and LC2's line are preterited
- Single annulment; intestate distribution among LC1, GC1, GC2 (by representation), and other heirs

### EC-8: Preterited Parent (Ascending Line)
- Decedent has no children; survived by parents (PA, MA)
- Will: "I leave everything to my spouse S"
- PA and MA are direct-line ascending compulsory heirs, totally omitted → preterition
- Institution of S annulled; estate distributes intestate (PA, MA, and S per Art. 997)
- Per *Nuguid v. Nuguid*: this is the classic ascending-line preterition case

### EC-9: Predeceased Preterited Heir With No Representatives
- LC3 was alive when will was executed, but predeceased the testator
- LC3 has no children or descendants
- Art. 854 ¶2: "institution shall be effectual" → no preterition
- Will proceeds normally (minus LC3, who is no longer an heir)

### EC-10: Predeceased Preterited Heir With Representatives Who ARE Named in Will
- LC3 predeceased; LC3's children GC1, GC2 survive
- Will names GC1 and GC2 as heirs (even though LC3 is omitted)
- GC1 and GC2 are provided for → no preterition through representation
- The "line" is not omitted; representatives are covered

### EC-11: Conditional Institution That Fails
- Will: "I institute LC3 if LC3 graduates law school; otherwise to F"
- LC3 does not graduate → condition fails → LC3 receives nothing
- Is this preterition? The heir was ADDRESSED in the will but receives nothing due to a failed condition
- Art. 872 strips conditions from legitime: LC3's LEGITIME portion cannot be conditional
- Engine should split: LC3's legitime = unconditional; free portion share = conditional
- If the only provision is the conditional one and condition fails: LC3 receives legitime unconditionally, F gets nothing from that share

### EC-12: Will Only Contains Legacies, No Institution
- Art. 841: will valid even without institution → remainder passes intestate
- No institution to annul → preterition technically inapplicable (Art. 854 annuls "the institution of heir")
- Compulsory heirs receive intestate shares from the undisposed remainder
- Legacies survive if not inofficious
- This is NOT preterition but mixed succession under Art. 960(2)

### EC-13: Preterition + Reconciled Disinheritance of Another Heir
- Will omits LC2 (preterited), disinherits LC3 (but reconciliation occurred → Art. 922 voids it)
- LC2 triggers preterition → institution annulled
- LC3's disinheritance is void (reconciliation) → LC3 is reinstated
- Both LC2 and LC3 participate in intestate distribution

---

## 13. Test Cases

### Category A: Basic Preterition Detection

**T-PR-1: Single legitimate child preterited**
- Estate: ₱10,000,000
- Heirs: LC1 (alive), LC2 (alive)
- Will: "I institute LC1 as sole heir"
- Expected: Preterition of LC2 → institution annulled → intestate (₱5M each per Art. 980)

**T-PR-2: Illegitimate child preterited**
- Estate: ₱10,000,000
- Heirs: LC1, LC2 (legitimate), IC1 (illegitimate, alive, filiation proven)
- Will: "I institute LC1 and LC2 equally"
- Expected: Preterition of IC1 → institution annulled → intestate
- Unit method: LC1 = 2, LC2 = 2, IC1 = 1 → 5 units
- Per unit: ₱2,000,000
- LC1: ₱4,000,000; LC2: ₱4,000,000; IC1: ₱2,000,000

**T-PR-3: Adopted child preterited**
- Estate: ₱12,000,000
- Heirs: LC1 (biological), AC1 (adopted under RA 8552)
- Will: "I institute LC1 as sole heir"
- Expected: AC1 preterited → institution annulled → intestate (₱6M each)

**T-PR-4: Parents preterited (ascending line)**
- Estate: ₱6,000,000
- Decedent has no children; survived by Father (F), Mother (M), Spouse (S)
- Will: "I leave everything to my spouse S"
- Expected: F and M preterited → institution annulled → intestate (Art. 997: S = ½, F+M = ½)
- F: ₱1,500,000; M: ₱1,500,000; S: ₱3,000,000

**T-PR-5: No preterition — all compulsory heirs provided for**
- Estate: ₱10,000,000
- Heirs: LC1, LC2, S
- Will: "I institute LC1, LC2, and S as heirs equally"
- Expected: No preterition (may have underprovision if shares < legitimes, but not preterition)

### Category B: Token Provision vs. Total Omission

**T-PR-6: Token legacy defeats preterition**
- Estate: ₱10,000,000
- Heirs: LC1, LC2, LC3
- Will: "I institute LC1 and LC2. I bequeath ₱100 to LC3."
- Expected: LC3 NOT preterited (received ₱100 legacy) → Art. 855 underprovision
- LC3's legitime = ₱10M × ½ ÷ 3 = ₱1,666,667
- Deficit = ₱1,666,567 → recovered via Art. 855 waterfall

**T-PR-7: ₱0 legacy does NOT defeat preterition**
- A legacy of ₱0 is no provision at all → heir still preterited
- Engine rule: provision.amount must be > 0

**T-PR-8: Named as substitute only — still preterited**
- Estate: ₱10,000,000
- Heirs: LC1, LC2
- Will: "I institute LC1 as sole heir. If LC1 predeceases me, LC2 shall substitute."
- LC1 survives → LC2 receives nothing → LC2 is preterited
- Expected: Preterition → institution annulled → intestate (₱5M each)

### Category C: Predeceased Preterited Heir

**T-PR-9: Predeceased heir with no representatives**
- Estate: ₱10,000,000
- Heirs at death: LC1 (alive), LC2 (alive); LC3 predeceased with no children
- Will: "I institute LC1 as sole heir" (written when LC3 was alive)
- Expected: LC3 predeceased without representatives → Art. 854 ¶2 → institution effectual
- LC2 is alive and preterited → preterition triggered for LC2
- Institution annulled; intestate distribution among LC1 and LC2 (₱5M each)

**T-PR-10: Predeceased heir with representatives who are also omitted**
- Estate: ₱12,000,000
- Heirs: LC1 (alive), LC2 (predeceased, left GC1, GC2)
- Will: "I institute LC1 as sole heir"
- Expected: LC2 predeceased but GC1, GC2 alive and omitted → preterition through representation
- Institution annulled → intestate
- LC1: ₱6M, GC1: ₱3M, GC2: ₱3M (per stirpes for LC2's line)

**T-PR-11: Predeceased heir with representatives who ARE in the will**
- Estate: ₱12,000,000
- Heirs: LC1 (alive), LC2 (predeceased, left GC1, GC2)
- Will: "I institute LC1 and GC1 and GC2 as heirs equally"
- Expected: GC1 and GC2 are provided for → LC2's line NOT preterited → no preterition
- Will proceeds; may need to validate shares against legitimes (Art. 855)

### Category D: Preterition + Disinheritance Interaction

**T-PR-12: Preterition + valid disinheritance of another heir**
- Estate: ₱12,000,000
- Heirs: LC1, LC2, LC3 (alive); LC3 validly disinherited (maltreatment); LC3 has child GC1
- Will: "I institute LC1 as sole heir. I disinherit LC3 for maltreatment."
- LC2 omitted → preterition → institution annulled
- LC3's disinheritance survives; GC1 represents LC3 (Art. 923)
- Intestate: LC1, LC2, GC1 (representing LC3's line), no spouse
- 3 lines: LC1 = ¼M, LC2 = ₱4M, GC1 = ₱4M (per Art. 980, 3 equal child-lines)

**T-PR-13: Preterition + invalid disinheritance**
- Estate: ₱12,000,000
- Heirs: LC1, LC2, LC3 (alive); LC3 has invalid disinheritance (cause not proven)
- Will: "I institute LC1 as sole heir. I disinherit LC3 for reason X (not proven)."
- LC2 is preterited → Art. 854 → institution annulled
- LC3's disinheritance is invalid → LC3 reinstated as compulsory heir
- Intestate: LC1, LC2, LC3 (₱4M each)

### Category E: Surviving Legacies/Devises

**T-PR-14: Preterition with surviving non-inofficious legacy**
- Estate: ₱10,000,000
- Heirs: LC1, LC2 (alive); F (friend, voluntary)
- Will: "I institute LC1 as sole heir. I bequeath ₱1,000,000 to F."
- LC2 preterited → institution annulled
- Legitime: LC collective = ½ × ₱10M = ₱5M; free portion = ₱5M
- Legacy to F (₱1M) ≤ free portion (₱5M) → legacy survives
- Intestate from remaining ₱9M: LC1 = ₱4.5M, LC2 = ₱4.5M; F gets ₱1M

**T-PR-15: Preterition with inofficious legacy (partially reduced)**
- Estate: ₱6,000,000
- Heirs: LC1, LC2, LC3, S (spouse); F (friend)
- Will: "I institute LC1, LC2 as heirs. I bequeath ₱4,000,000 to F."
- LC3 preterited → institution annulled
- Compute testate legitime: LC collective = ½ × ₱6M = ₱3M; S = ₱3M × ⅓ = ₱750,000 (equal to one child with 3 children, from FP)
- Total legitime = ₱3,000,000 + ₱750,000 = ₱3,750,000
- Free portion = ₱6M - ₱3.75M = ₱2,250,000
- F's legacy (₱4M) exceeds free portion → reduce to ₱2,250,000
- Remaining for intestate: ₱6M - ₱2.25M = ₱3,750,000
- Intestate shares (3 children + spouse, Art. 999): 4 units = ₱937,500 each
- LC1: ₱937,500; LC2: ₱937,500; LC3: ₱937,500; S: ₱937,500; F: ₱2,250,000

**T-PR-16: Preterition with NO surviving legacies (pure intestate)**
- Estate: ₱10,000,000
- Heirs: LC1, LC2, LC3
- Will: "I institute LC1 and LC2 as my sole heirs equally."
- LC3 preterited → institution annulled; no legacies/devises → pure intestate
- LC1: ₱3,333,333; LC2: ₱3,333,333; LC3: ₱3,333,333

### Category F: Spouse Omission (NOT Preterition)

**T-PR-17: Spouse omitted — NOT preterition, triggers underprovision**
- Estate: ₱10,000,000
- Heirs: LC1, LC2, S
- Will: "I institute LC1 and LC2 as heirs equally. Nothing to S."
- S is NOT in the direct line → NOT preterition → Art. 855 underprovision
- Institutions stand; S's legitime recovered from Art. 855 waterfall
- S's legitime = ₱10M × ½ ÷ 2 = ₱2,500,000 (with 2 children, Art. 892 ¶2)
- Total legitime = ₱5M + ₱2.5M = ₱7.5M; FP = ₱2.5M
- Will gives LC1 and LC2 ₱5M each = ₱10M total → S gets nothing → underprovision
- Recovery: reduce LC1 and LC2 shares to accommodate S's ₱2.5M

**T-PR-18: IC omitted from will with only ascendants — IS preterition**
- Estate: ₱8,000,000
- Decedent has no legitimate children; survived by Father, IC1 (illegitimate child)
- Will: "I institute my Father as sole heir"
- IC1 is in the direct descending line → preterition → institution annulled
- Intestate: Art. 991: IC1 = ½ (₱4M), Father = ½ (₱4M)

### Category G: Complex Scenarios

**T-PR-19: Preterition of child born after testator's death**
- Estate: ₱10,000,000
- Heirs: LC1, LC2 (born posthumously, child was conceived before death)
- Will: "I institute LC1 as sole heir" (written before LC2 was conceived)
- Expected: LC2 is a compulsory heir born after death (Art. 854 explicitly covers this)
- Preterition triggered → institution annulled → intestate: ₱5M each

**T-PR-20: Will with only legacies, no institution — preterition inapplicable**
- Estate: ₱10,000,000
- Heirs: LC1, LC2, S
- Will: "I bequeath ₱1,000,000 to F." (No institution of heirs)
- No institution to annul → Art. 854 does not apply
- Art. 841: remainder passes intestate; Art. 960(2) mixed succession
- This is NOT preterition even if compulsory heirs aren't named

**T-PR-21: Preterition annulment with collation**
- Estate at death: ₱8,000,000
- Collatable donation to LC1: ₱2,000,000
- Heirs: LC1, LC2, LC3 (alive)
- Will: "I institute LC1 as sole heir" (LC2, LC3 omitted)
- Preterition → institution annulled
- Collated estate for inofficiousness: ₱8M + ₱2M = ₱10M
- Total legitime: ½ × ₱10M = ₱5M
- Free portion: ₱5M (no surviving legacies/devises → all goes intestate)
- Intestate from actual estate (₱8M): LC1, LC2, LC3 equally
- LC1: already received ₱2M → gets ₱666,667 from estate; LC2, LC3: ₱2,666,667 each

---

## 14. Narrative Templates

### Template 1: Basic Preterition (Direct-Line Heir Omitted)

> **{heir_name} ({relationship})** receives **₱{amount}**.
> {heir_name} is a compulsory heir in the direct line under Art. 887 of the Civil Code. The testator's will completely omitted {heir_name} — {heir_name} was neither instituted as an heir, nor given any legacy, devise, or other testamentary provision. Under Art. 854, the preterition (total omission) of a compulsory heir in the direct line annuls the institution of heirs in the will. {if_legacies: The testator's legacies/devises survive insofar as they do not impair the compulsory heirs' legitimes (Art. 854).} The {remaining_estate_description} distributes under the rules of intestate succession. Under Art. {intestate_article}, {distribution_explanation}, resulting in {heir_name}'s share of ₱{amount}.

### Template 2: Preterition Through Representation

> **{representative_name} (grandchild, by representation of {predeceased_heir_name})** receives **₱{amount}**.
> {predeceased_heir_name}, a compulsory heir in the direct line, predeceased the testator. Under Art. 854 ¶2 of the Civil Code, the will's institution would ordinarily remain effectual when a preterited heir predeceases. However, {predeceased_heir_name}'s descendants ({representative_names}) survive the testator and were also completely omitted from the will. Under the right of representation (Art. 970), {representative_name} steps into {predeceased_heir_name}'s place. Since {predeceased_heir_name}'s entire line is omitted, preterition applies, annulling the institution of heirs. The estate distributes intestate, with {representative_name} receiving ₱{amount} as {their_share_of_line} of {predeceased_heir_name}'s line by right of representation (Art. 974).

### Template 3: Preterition With Surviving Legacy

> **{legatee_name} ({relationship})** receives **₱{reduced_amount}** {if_reduced: (reduced from ₱{original_amount})}.
> Although the institution of heirs was annulled due to preterition of {preterited_heir_name} under Art. 854, the testator's legacy of ₱{original_amount} to {legatee_name} survives annulment. Under Art. 854, devises and legacies remain valid insofar as they are not inofficious. {if_not_reduced: The total of surviving legacies (₱{total_legacies}) does not exceed the free portion (₱{free_portion}), so the full legacy stands.}{if_reduced: However, the total of surviving legacies (₱{original_total}) exceeds the free portion (₱{free_portion}) by ₱{excess}. Under Art. 911, the legacy is reduced pro rata to ₱{reduced_amount} to respect the compulsory heirs' legitimes.}

### Template 4: Spouse Not Preterited (Underprovision Instead)

> **{spouse_name} (surviving spouse)** receives **₱{amount}**.
> Although {spouse_name} was not mentioned in the testator's will, this does not constitute preterition under Art. 854 of the Civil Code. Art. 854 applies only to compulsory heirs in the **direct line** (children, descendants, parents, ascendants). The surviving spouse, while a compulsory heir under Art. 887(3), is not in the direct line. Instead, {spouse_name}'s omission triggers the underprovision recovery mechanism under Art. 855. {spouse_name}'s legitime of ₱{legitime_amount} (Art. {spouse_article}) is recovered {recovery_description}.

### Template 5: Preterited Heir Benefits from Intestacy

> **{heir_name} ({relationship})** receives **₱{intestate_amount}**.
> {heir_name} was completely omitted from the testator's will, constituting preterition under Art. 854. The annulment of the institution means the estate distributes under intestate succession rules, which provide {heir_name} with ₱{intestate_amount}. {if_more_than_testate: Notably, this is more than the ₱{testate_amount} {heir_name} would have received as their testate legitime had they been minimally provided for in the will, because intestate succession {reason_more_favorable}.}

---

## 15. Summary of Key Rules for the Engine

| Rule | Engine Implementation |
|------|----------------------|
| Only direct-line heirs trigger preterition | Check `heir.is_in_direct_line` — LC, IC, adopted, legitimated, ascendants |
| Spouse omission ≠ preterition | Always route to Art. 855 underprovision |
| Total omission required | Check ALL will provisions (institutions, legacies, devises, usufructs) |
| ₱1 token provision defeats preterition | Any provision with amount > 0 prevents preterition for that heir |
| Disinheritance (even invalid) prevents preterition | Heir was addressed → not "omitted" |
| Preterition annuls ALL institutions | Not just the omitted heir's share — entire institution system voided |
| Legacies/devises survive | Subject to inofficiousness check against testate-regime free portion |
| Valid disinheritances survive preterition | Applied within the resulting intestate distribution |
| Predeceased preterited heir → check representatives | If reps exist and all are omitted → preterition through representation |
| Posthumous children covered | Art. 854 explicit: "born after the death of the testator" |
| No institution to annul → no preterition | Will with only legacies → mixed succession (Art. 960(2)), not preterition |
| Check preterition FIRST in validation pipeline | Before disinheritance validation, underprovision, inofficiousness |

---

*Analysis based on: Civil Code Arts. 854-855, 918, 887, 960, 970-977; Family Code Art. 176; RA 8552 Sec. 17; Nuguid v. Nuguid (G.R. No. L-23445, 1966); Acain v. IAC (1987); Tubera-Balintec v. Heirs of Tubera (G.R. No. 235701, 2023); Dumayas v. Lindo (2021); Respicio & Co., RALB Law, ASG Law commentaries.*
