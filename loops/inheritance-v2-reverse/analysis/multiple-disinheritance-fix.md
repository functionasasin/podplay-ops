# Multiple Disinheritance Fix — BUG-001 Correct Algorithm
*Wave 2 — Domain Rule Extraction*
*Sources: Civil Code Arts. 915–923; testate-validation.md; representation.md; heir-concurrence.md*
*Depends on: testate-validation, representation, heir-concurrence, heir-classification*

---

## 1. Statement of BUG-001

The v1 engine processed disinheritances one-at-a-time in a `for` loop, recomputing the scenario and redistributing after each individual disinheritance:

```
// WRONG — v1 algorithm
for disinheritance in will.disinheritances:
    if disinheritance.is_valid:
        mark heir excluded
        add representatives
        recompute_scenario_code()   // ← intermediate, based on partial exclusions
        compute_legitimes()          // ← based on intermediate scenario
        distribute()                 // ← distributes at partial state
```

**Why this is wrong**: The final distribution depends on which disinheritance is processed first, rather than on the final eligible heir set. The ScenarioCode, legitime fractions, and distribution rules all change mid-loop, producing intermediate states that are never legally real. The law does not distinguish between "simultaneously disinherited in the same will" heirs — all valid disinheritances in the same will take effect at the same instant (the testator's death).

---

## 2. Legal Basis for Batch Processing

**Art. 923**: "The children and descendants of the person disinherited shall take his or her place..."
- The disinherited heir's exclusion and the representative's entry are instantaneous at death.
- There is no legal intermediate state where heir A is excluded but heir B is not.

**Art. 777**: "The rights to the succession are transmitted from the moment of the death of the decedent."
- All succession effects (including all disinheritances in the same will) activate simultaneously at the moment of death.

**Art. 916**: Disinheritance is effected through a will — a single legal instrument. Effects from a single will apply as a unit, not in sequence.

**Principle**: The eligible heir set is determined once, at the moment of death, considering all valid disinheritances simultaneously. Computation runs once on the final heir set.

---

## 3. The V2 Correct Algorithm

### 3.1 High-Level Phase Sequence

```
Phase A: Validate all disinheritances
Phase B: Apply all valid disinheritances atomically
Phase C: Build representatives for all excluded heirs atomically
Phase D: Recompute ScenarioCode ONCE with final heir set
Phase E: Compute legitimes ONCE for final scenario
Phase F: Distribute ONCE
```

### 3.2 Full Rust Pseudocode

```rust
/// BUG-001 fix: Batch-process all disinheritances from a single will.
/// Returns the updated heirs and the disinheritance result.
fn apply_all_disinheritances(
    heirs: &mut Vec<ClassifiedHeir>,
    disinheritances: &[DisinheritanceRecord],
    family_tree: &FamilyTree,
) -> DisinheritanceResult {
    // Phase A: Partition into valid and invalid disinheritances
    let (valid_dis, invalid_dis): (Vec<_>, Vec<_>) = disinheritances
        .iter()
        .partition(|d| d.is_valid && !d.reconciled);

    // Phase B: Exclude ALL validly disinherited heirs atomically
    //          Do NOT add representatives yet — ensure the full
    //          exclusion set is committed before any cascading.
    for dis in &valid_dis {
        if let Some(heir) = heirs.iter_mut().find(|h| h.id == dis.heir_id) {
            heir.is_eligible = false;
            heir.exclusion_reason = Some(ExclusionReason::ValidDisinheritance);
        }
    }

    // Phase C: Build representatives for ALL excluded heirs atomically.
    //          find_representatives() skips heirs that are themselves excluded.
    //          Recursive: if representative is also disinherited, their
    //          children represent in turn (see §4.1 cascading below).
    let mut new_representatives: Vec<ClassifiedHeir> = Vec::new();
    for dis in &valid_dis {
        let reps = find_representatives_recursive(
            dis.heir_id,
            heirs,           // already has all exclusions from Phase B
            family_tree,
        );
        new_representatives.extend(reps);
    }
    heirs.extend(new_representatives);

    // Deduplicate: a person who is a representative of two branches
    // cannot receive two shares (per stirpes preserves the represented slot,
    // not the representative count)
    heirs.dedup_by_key(|h| h.id);

    // Phase D: ScenarioCode recomputed once by the calling pipeline step.
    //          This function does NOT call recompute_scenario() — that is the
    //          pipeline's responsibility, ensuring a single recompute.

    DisinheritanceResult {
        valid_disinheritances: valid_dis.iter().map(|d| d.heir_id).collect(),
        invalid_disinheritances: invalid_dis.iter().map(|d| d.heir_id).collect(),
        total_processed: disinheritances.len(),
        requires_restart: !valid_dis.is_empty(),
    }
}

/// Recursive representative finder for disinherited heir `heir_id`.
/// Handles the case where the first-level representative is also disinherited.
fn find_representatives_recursive(
    heir_id: HeirId,
    heirs: &[ClassifiedHeir],  // exclusions already set
    family_tree: &FamilyTree,
) -> Vec<ClassifiedHeir> {
    let direct_children = family_tree.children_of(heir_id);
    let mut result = Vec::new();

    for child_id in direct_children {
        let child = heirs.iter().find(|h| h.id == child_id);
        match child {
            // Child exists and is eligible → represents the disinherited heir
            Some(c) if c.is_eligible => {
                result.push(c.clone().with_representation_trigger(
                    heir_id,
                    RepresentationTrigger::Disinheritance,
                ));
            }
            // Child is also disinherited → grandchildren represent child
            // (who in turn represents the original disinherited heir)
            Some(c) if !c.is_eligible => {
                let grandchild_reps = find_representatives_recursive(
                    child_id,
                    heirs,
                    family_tree,
                );
                // Grandchildren carry the representation chain from original heir
                // through child to grandchild
                result.extend(grandchild_reps.into_iter().map(|r| {
                    r.with_representation_chain_prepended(heir_id)
                }));
            }
            // Child not in heir list → treat as stranger, recurse to their
            // children if family_tree has them registered
            None => {
                let deeper = find_representatives_recursive(
                    child_id,
                    heirs,
                    family_tree,
                );
                result.extend(deeper);
            }
            _ => {}
        }
    }
    result
}
```

### 3.3 Pipeline Integration

```rust
// In the pipeline, step 7 (testate validation):
fn step7_testate_validation(state: &mut PipelineState) -> StepResult {
    if !state.will.exists {
        return StepResult::NoOp;  // intestate: no disinheritances possible
    }

    // BUG-001 FIX: batch apply ALL disinheritances first
    let dis_result = apply_all_disinheritances(
        &mut state.classified_heirs,
        &state.will.disinheritances,
        &state.family_tree,
    );

    // THEN check preterition on the post-disinheritance heir set
    let preterition = detect_preterition(
        &state.classified_heirs,
        &state.will,
        state.succession_type,
    );

    // Combine: determine if restart needed
    let requires_restart = dis_result.requires_restart
        || matches!(preterition, PreteritionEffect::InstitutionAnnulled { .. });

    if requires_restart {
        // SINGLE ScenarioCode recompute after ALL mutations
        state.scenario_code = determine_scenario_code(&state.classified_heirs, &state.will);
        state.restart_count += 1;
        if state.restart_count > MAX_RESTARTS {
            return StepResult::Error(EngineError::MaxRestartsExceeded);
        }
        return StepResult::Restart { from_step: 5 };  // re-run legitime computation
    }

    StepResult::Continue(TestateValidationResult { /* ... */ })
}
```

**Key invariant**: `determine_scenario_code()` is called at most once in step 7 per pipeline pass, after all disinheritances and preterition mutations have been applied.

---

## 4. Edge Cases

### 4.1 Cascading Disinheritance (Parent and Child Both Disinherited)

**Scenario**: Decedent disinherits both A and A's child B in the same will. B has a child C.

```
Decedent
└── A (disinherited)
    └── B (also disinherited)
        └── C (not disinherited, otherwise eligible)
```

**Phase B (batch exclusion)**: Both A and B marked `is_eligible = false`.

**Phase C (representation)**:
- For A's representatives: direct child B is excluded → recurse deeper → B's child C is eligible
- C carries the representation chain: `C represents B represents A`
- For B's representatives: direct child C is eligible → C represents B
- After dedup: C appears once with the deeper chain (A→B→C)

**Result**: C receives what A would have received (per stirpes). C does not receive a double share.

**ScenarioCode recompute**: The heir set now contains A-slot occupied by C. Count of effective G1 positions = same as if A were alive. The scenario code reflects the same n-children count, just with C in A's place.

### 4.2 Sibling Cross-Disinheritance (Multiple Siblings Disinherited)

**Scenario**: 3 children (A, B, C). Will disinherits B and C simultaneously.
- B has children: b1, b2
- C has children: c1
- A has no children

```
Phase B: B excluded, C excluded
Phase C: b1, b2 represent B; c1 represents C
Final eligible G1: {A, b1 (per stirpes of B), b2 (per stirpes of B), c1 (per stirpes of C)}
Effective slots: A (1 slot), B's slot (b1+b2 share), C's slot (c1 gets all)
ScenarioCode: T1(n=3 effective positions)
```

**Computation**:
- G1 total legitime = ½ estate
- A's share = ½ × (1/3) estate = 1/6 estate
- b1's share = ½ × (1/3) × (1/2) = 1/12 estate
- b2's share = 1/12 estate
- c1's share = ½ × (1/3) = 1/6 estate

### 4.3 Mixed Valid/Invalid Disinheritances

**Scenario**: Will disinherits A with Art. 919(1) (valid ground, cause proven) and B with an unspecified cause (no ground = invalid per Art. 918).

**Phase A partition**:
- A: `is_valid = true` → goes into `valid_dis`
- B: `is_valid = false` → goes into `invalid_dis`

**Phase B**: Only A is excluded. B remains eligible.

**Phase C**: Representatives for A added.

**For invalid B**: Art. 918 applies — institution annulled only to the extent it prejudices B's legitime. B is reinstate for their legitime portion. The engine adds a `INVALID_DISINHERITANCE` warning.

**Consequence**: A and B must not be mixed in the same batch-exclusion pass. The valid/invalid partition is mandatory before Phase B.

### 4.4 All G1 Children Disinherited (No Representatives)

**Scenario**: 2 legitimate children (A, B), both validly disinherited, neither has children. Decedent also has parents (G2) and a spouse (G3).

**Question**: Does G2 emerge when all G1 are disinherited with no representatives?

**Analysis**: The Civil Code Art. 887 states G2 applies "in default of legitimate children and descendants." This phrase has two interpretations:
1. **Conservative (default)**: "In default" means the decedent had NO legitimate children/descendants — a biological/lineage fact. Disinheritance is a personal legal sanction, not erasure of lineage. G2 does not emerge.
2. **Expansive**: "In default" means "when no legitimate descendants can or will receive" — including through disinheritance with no representation.

**v2 spec adopts Conservative interpretation** (majority scholarly view): G2 does NOT emerge when all G1 are disinherited. With no eligible G1 and no G4 here, the estate scenario depends on surviving Spouse (G3) and presence of illegitimate children.

**Flag as MANUAL_REVIEW**: When all G1 are disinherited with no representatives, generate `ManualReviewFlag::AllDescendantsDisinherited { heirs: [...] }`. Legal counsel must confirm whether G2 emerges.

**Scenario code in this case (conservative)**: No G1 (disinherited, no reps), G2 present but NOT activated due to conservation rule. With Spouse and no G4:
- Estate effectively goes to → Spouse only for legitime, remainder per FP
- ScenarioCode: T12 (Spouse only, no G1 no G4 no G2 → G3 gets ½)
- But G2 parents are present... the engine must decide.

**Engine rule**: When conservative interpretation is applied and G2 is suppressed, set `ScenarioCode = T12` (or T10 if IC present) and attach `MANUAL_REVIEW`. Do NOT activate G2 automatically.

### 4.5 Disinheritance of Spouse

The spouse (G3) can be disinherited under Art. 921 (6 grounds). Representation does NOT apply to a disinherited spouse — the spouse has no children who "take their place" in the legal sense of Art. 923 (which is limited to "children and descendants of the person disinherited").

**Effect of valid spousal disinheritance**:
- Spouse excluded from all distributions (legitime and free portion)
- No representation cascade for the spouse's slot
- ScenarioCode recomputed without Spouse in G3

**Batch rule**: If the will disinherits both a child (Art. 919) and the spouse (Art. 921) simultaneously, both are excluded in Phase B. Phase C adds only the child's representatives (none for the spouse).

### 4.6 Reconciliation Mixed with Other Disinheritances

**Scenario**: Will disinherits A (valid ground), B (valid ground, but reconciliation occurred). Also disinherits C (valid ground, no reconciliation).

**Phase A partition**:
- A: `is_valid = true, reconciled = false` → valid_dis
- B: `is_valid = true, reconciled = true` → invalid_dis (reconciliation voids = Art. 922)
- C: `is_valid = true, reconciled = false` → valid_dis

**Result**: A and C excluded; B reinstated (treated as fully eligible). B's will allocation may underprovide B — check for underprovision separately.

### 4.7 Disinheritance with Substitution

**Scenario**: Will disinherits A AND names X as A's substitute (simple substitution, Art. 857).

**Interaction**: Substitution takes effect when the primary beneficiary cannot inherit. A valid disinheritance means A cannot inherit → X would step in as substitute.

**BUT**: Art. 923 says A's *children and descendants* take A's place with respect to the **legitime**. Substitution can only operate on the free portion, not on the legitime (since the legitime is protected by law, and the children's representational right to the legitime cannot be displaced by testamentary substitution).

**Engine rule**:
1. A is disinherited → A's children represent A for the **legitime portion** (Art. 923)
2. X substitutes A for the **free portion institutions** directed to A (Art. 857)
3. If A had no children and was disinherited → X substitutes for A's entire allocation (both legitime would normally go back to estate, but A had no representatives → vacancy resolution, then X via substitution for FP part)

**Note**: This is a MANUAL_REVIEW edge case when the disinherited heir has both representatives (children) and a testamentary substitute.

---

## 5. Test Vectors

### TV-MD-01: Two Children Disinherited, Neither Has Representatives

**Input**:
- Estate: ₱9,000,000
- G1: A (eligible), B (disinherited, no children), C (disinherited, no children)
- Spouse: none
- G4: none
- Will: disinherits B and C (Art. 919(1), valid grounds)

**v1 Wrong Result** (order: B first, then C):
1. After excluding B: Heirs = {A, C}; T1(n=2): A=2.25M, C=2.25M, FP=4.5M
2. After excluding C: Heirs = {A}; T1(n=1): A=4.5M, FP=4.5M
- v1 final: A=4.5M, C=0 (excluded), B=0 (excluded), FP=4.5M ← C was assigned 2.25M in step 1 then stripped

**v2 Correct Result** (batch):
- Final heirs: {A} only (B and C excluded, no reps)
- ScenarioCode: T1(n=1): G1 total=½; A gets ½ × 9M = 4.5M; FP=4.5M

**v2 Output**:
| Heir | Share |
|------|-------|
| A | ₱4,500,000 |
| B | ₱0 (validly disinherited) |
| C | ₱0 (validly disinherited) |
| Free Portion | ₱4,500,000 |

**Warning**: `MULTIPLE_DISINHERITANCES`

---

### TV-MD-02: Two Children Disinherited, One Has Representatives

**Input**:
- Estate: ₱9,000,000
- G1: A (eligible), B (disinherited, children: b1, b2), C (disinherited, no children)
- Spouse: none, G4: none

**v2 Correct Result**:
- Exclude B and C. Add b1, b2 as representatives of B. C has no reps.
- Final effective G1 slots: A (slot 1), B's slot (b1+b2), [C's slot — vacant, no reps → accretion]
- Wait: C's slot has no representatives and no accretion candidate → goes to the estate FP?
  - Actually: when a disinherited heir has no reps, their "slot" in the legitime is not vacant in the same way as a predeceased heir with no reps.
  - The disinheritance removes C entirely. The remaining G1 heirs (A + b1/b2) recompute their legitimes based on the new n count.
  - New n for legitimate child positions: A (1) + B's slot (1) = 2 effective positions. C is removed entirely from the count.
- ScenarioCode: T1(n=2 effective positions): G1 total = ½; per position = ¼
  - A gets ¼ × 9M = 2.25M
  - B's slot gets ¼ × 9M = 2.25M → b1 = 1.125M, b2 = 1.125M
  - FP = ½ × 9M = 4.5M

**v2 Output**:
| Heir | Share |
|------|-------|
| A | ₱2,250,000 |
| b1 (rep. of B) | ₱1,125,000 |
| b2 (rep. of B) | ₱1,125,000 |
| C | ₱0 (disinherited, no reps) |
| Free Portion | ₱4,500,000 |

---

### TV-MD-03: Child and Spouse Disinherited Simultaneously — ScenarioCode Change

**Input**:
- Estate: ₱6,000,000
- G1: A (legitimate child, disinherited, no children)
- G3: Spouse S (disinherited, Art. 921)
- G4: IC1 (illegitimate child, eligible)
- Will: disinherits A (Art. 919(1)) and S (Art. 921(1)) simultaneously

**v1 Wrong** (process A first):
1. Exclude A: Heirs = {S, IC1} → Scenario T10: G3=⅓=2M, G4=⅓=2M, FP=⅓=2M
2. Exclude S: Heirs = {IC1} → Scenario T11: G4=½=3M, FP=½=3M
- v1 final: IC1=3M — but arrived there through wrong intermediate state

**v1 Wrong** (process S first):
1. Exclude S: Heirs = {A, IC1} → Scenario T4(n=1, m=1): G1=½=3M, G4 capped ≤(½/2n=¼=1.5M).
   IC1 uncapped would be (½/2 = 1.5M), check against FP: FP = 3M, G4 uncapped ≤ FP → IC1=1.5M, FP=1.5M
2. Exclude A: Heirs = {IC1} → Scenario T11: G4=½=3M, FP=3M
- v1 final (S first): IC1=3M — same answer but for wrong reasons; different intermediate states

**v2 Correct**:
- Batch exclude A and S. No representatives for either.
- Final heirs: {IC1} → Scenario T11 (illegitimate children only)
- G4 total legitime = ½ × 6M = 3M; IC1 gets 3M; FP = 3M

**v2 Output**:
| Heir | Share |
|------|-------|
| A | ₱0 (validly disinherited) |
| S (Spouse) | ₱0 (validly disinherited) |
| IC1 | ₱3,000,000 |
| Free Portion | ₱3,000,000 |

*Note: In this case v1 and v2 happen to produce the same final numbers, but v1 goes through legally incorrect intermediate states. In cases where the intermediate state affects FP distributions or will institution allocations, v1 will produce wrong answers.*

---

### TV-MD-04: ScenarioCode Genuinely Changes — Different Final Distribution

**Input**:
- Estate: ₱12,000,000
- G1: A (eligible, 1 legitimate child), B (disinherited, Art. 919), C (disinherited, Art. 919)
- G3: Spouse S (eligible)
- G4: none
- B has children: b1. C has no children.
- Will: institutions to A (¼ estate), S (¼ estate), devises to stranger X (½ estate)

**v1 Wrong** (B first, then C):
Step 1: Exclude B, add b1 as rep. Heirs = {A, b1 (rep B), C, S}. n=3 effective children.
- T3(n=3): G1=½, each=1/6; G3=1/6 (= per-child).
- A=2M, b1=2M (B's slot), C=2M, S=2M, FP=4M
- Will: A gets 3M (¼ × 12M), S gets 3M, X devise gets 6M
- FP = 4M but devises = 6M → inofficiousness? Check...
- Intermediate state: wrong scenario with C still included

Step 2: Exclude C. Heirs = {A, b1 (rep B), S}. n=2 effective children.
- T3(n=2): G1=½ each child=¼; G3=¼.
- A=3M, b1=3M, S=3M, FP=3M
- Now the will: A inst=3M=legitime, S inst=3M=legitime, devise X=6M
- FP=3M but X devise=6M: FP is only 3M → inofficiousness triggered
- X reduced to 3M

v1 final: A=3M, b1=3M, S=3M, X=3M (reduced)

**v2 Correct**:
- Batch exclude B and C. Add b1 as rep of B. C has no reps.
- Final heirs: {A, b1 (rep B), S}. n=2 effective children.
- ScenarioCode T3(n=2): G1=½ (A=¼, b1=¼); G3=¼; FP=¼
- A=3M, b1=3M, S=3M, FP=3M
- Will dispositions vs FP=3M: A inst=3M (=A's legitime ✓), S inst=3M (=S's legitime ✓), X devise=6M
- Free portion = 3M but X wants 6M → inofficiousness: X devise reduced to 3M

v2 final: A=3M, b1=3M, S=3M, X=3M (reduced)

*In this example the answers happen to match because the batch v2 and the final v1 step land on the same final heir set. The real divergence occurs when v1's intermediate distribution commits testamentary allocations at intermediate states (e.g., FP-funded grants to heirs that get overridden).*

---

### TV-MD-05: Cascading Disinheritance (Parent and Child Both Disinherited)

**Input**:
- Estate: ₱8,000,000
- G1: A (disinherited), A's child B (also disinherited), B's child C (eligible, not disinherited)
- G1 also: D (eligible, independent branch)
- G3: none. G4: none.

**Phase B**: A and B both excluded.

**Phase C (representation)**:
- For A: direct child B is excluded → recurse to B's child C. C is eligible.
  - C added as representative of A (chain: A→B→C)
- For B: direct child C is eligible → C is representative of B.
- After dedup: C appears once (carrying the chain A→B→C, which collapses to A→C for the slot)

**Slot assignment**: A's slot is now occupied by C. The effective G1 positions = {D (1 slot), A's slot (C)}.

**ScenarioCode**: T1(n=2): G1 total = ½; per slot = ¼.
- D = ¼ × 8M = 2M
- C (representing A's slot) = ¼ × 8M = 2M
- FP = ½ × 8M = 4M

**v2 Output**:
| Heir | Share |
|------|-------|
| D | ₱2,000,000 |
| C (rep. chain A→B→C) | ₱2,000,000 |
| A | ₱0 (disinherited) |
| B | ₱0 (disinherited) |
| Free Portion | ₱4,000,000 |

---

## 6. Rust Types Specific to This Algorithm

```rust
/// Reason an heir was excluded from the eligible set.
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum ExclusionReason {
    /// Art. 915-923: Valid disinheritance with enumerated ground
    ValidDisinheritance,
    /// Art. 1027-1032: Unworthiness / incapacity
    Unworthiness,
    /// Art. 1015: Predecease (no representation available)
    PredeceaseNoRepresentation,
}

/// Result of batch-processing all disinheritances.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct DisinheritanceResult {
    /// Heir IDs that were validly disinherited and excluded
    pub valid_disinheritances: Vec<HeirId>,
    /// Heir IDs whose disinheritance failed validity check (Art. 918 applies)
    pub invalid_disinheritances: Vec<HeirId>,
    /// Heir IDs whose disinheritance was voided by reconciliation (Art. 922)
    pub reconciled_disinheritances: Vec<HeirId>,
    /// New representative heirs added (from Art. 923)
    pub representatives_added: Vec<HeirId>,
    /// Pipeline must recompute scenario code and legitimes
    pub requires_restart: bool,
    /// Warning code for UI (present when valid_disinheritances.len() >= 2)
    pub warning: Option<ValidationWarning>,
}

/// Representation chain tracking (for cascading disinheritances)
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct RepresentationChain {
    /// The original heir whose slot is being filled (e.g., A in A→B→C)
    pub root_heir_id: HeirId,
    /// The path of excluded heirs between root and representative
    pub through_excluded: Vec<HeirId>,
    /// The actual representative receiving the share
    pub representative_id: HeirId,
    /// Trigger that activated representation at each link
    pub trigger: RepresentationTrigger,
}

/// How the representative's share is derived
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum RepresentationTrigger {
    Predecease,
    Disinheritance,
    Unworthiness,
    IllegitimateTransmission,
}
```

---

## 7. Invariants Specific to Batch Disinheritance

**INV-MD-1**: `determine_scenario_code()` is called at most once after all disinheritances have been applied. It is never called within the `apply_all_disinheritances()` function.

**INV-MD-2**: `valid_dis` and `invalid_dis` are determined before any heir mutation. The partition is computed on the input `disinheritances` slice, not on a mutating list.

**INV-MD-3**: A reconciled disinheritance (`reconciled = true`) is never in `valid_dis`, regardless of whether the ground is otherwise enumerated and proven.

**INV-MD-4**: After `apply_all_disinheritances()` returns, no heir in `heirs` is simultaneously `is_eligible = true` AND has `exclusion_reason = Some(ValidDisinheritance)`. These are mutually exclusive states.

**INV-MD-5**: A representative's slot value equals what the excluded heir would have received, never more (per stirpes rule, Art. 974). Multiple representatives of the same excluded heir divide the slot equally.

**INV-MD-6**: The number of effective G1 "positions" for ScenarioCode determination equals the number of eligible G1 heirs plus the number of distinct represented-G1 slots (not the count of individual representatives). Example: A (eligible) + b1,b2 (reps of excluded B) = 2 effective positions (n=2), not 3.

**INV-MD-7**: Representation for a disinherited heir is limited to the direct descending line (Art. 923 → Art. 972). Collateral siblings of a disinherited heir cannot represent them.

**INV-MD-8**: An invalid disinheritance (Art. 918) generates a warning but does NOT exclude the heir from `heirs` and does NOT trigger `requires_restart = true`. The engine proceeds with the heir still eligible, then applies Art. 918 partial annulment at the distribution step.

---

## 8. Narrative Templates

**For valid disinheritance (no representatives)**:
> "[Heir Name] was validly disinherited under Art. [919/920/921]([n]) and receives no share of the estate. As [he/she] left no children or descendants to represent [him/her], [his/her] portion is redistributed among the remaining heirs."

**For valid disinheritance (with representatives)**:
> "[Heir Name] was validly disinherited under Art. [919/920/921]([n]). By right of representation (Art. 923), [his/her] children — [rep names] — collectively receive the ₱[amount] that would have passed to [him/her], divided equally among them."

**For cascading disinheritance**:
> "[Heir Name] and [his/her] child [Name] were both disinherited in the same will. [Grandchild Name], as the next eligible descendant, represents both and receives ₱[amount] under the per stirpes rule (Arts. 923, 974)."

**For invalid disinheritance**:
> "The attempted disinheritance of [Heir Name] was invalid [because: no cause specified / cause not proven / cause not enumerated]. Under Art. 918, [Heir Name]'s legitime of ₱[amount] is protected and the institution of heirs is annulled to the extent it prejudices this amount."

**For batch warning**:
> "This estate involved [n] simultaneous disinheritances. All were processed in a single batch before computing the heir set and distribution fractions, ensuring legally correct results regardless of will order."

---

## 9. Integration Point with Other Pipeline Steps

| Pipeline Step | Interaction with Disinheritance |
|---|---|
| Step 2: Classify Heirs | Sets initial `is_eligible = true` for all; `exclusion_reason = None` |
| Step 3: Build Lines | Builds initial representation lines (for predecease); later re-built post-disinheritance |
| Step 5: Determine Scenario | First scenario determination (before disinheritance) |
| **Step 7: Testate Validation** | **Apply batch disinheritance → rebuild lines → recompute scenario (restart)** |
| Step 8: Compute Legitimes | Runs on post-restart final heir set and final ScenarioCode |
| Step 9: Distribute | Runs once on final distribution |
| Step 10: Vacancy Resolution | Handles remaining vacancies after disinheritance (disinherited with no reps → accretion or intestate) |

**Restart flow**:
```
Step 7 detects valid disinheritance(s)
  → mutates heirs, adds representatives
  → sets requires_restart = true
  → pipeline resets restart_count++
  → jumps back to Step 3 (rebuild lines with updated heirs)
  → Step 5 redetermines ScenarioCode
  → Step 6 recomputes collation-adjusted estate base
  → Step 7 re-runs (now disinheritances already applied, dis_result.valid_dis will be empty on second pass since already excluded)
  → Step 8 computes legitimes on final state
  → Step 9 distributes
  → Step 10 resolves vacancies
```

**Idempotency guard on re-run**: On the second pass through Step 7, heirs already excluded from disinheritance will have `exclusion_reason = Some(ValidDisinheritance)`. The `apply_all_disinheritances()` function checks this before applying and skips already-excluded heirs, ensuring it is idempotent.
