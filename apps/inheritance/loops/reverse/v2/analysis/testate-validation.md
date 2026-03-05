# Testate Validation Analysis
*Wave 2 — Domain Rule Extraction*
*Sources: Civil Code Arts. 840–872, 908–923; `input/sources/civil-code-succession.md`; `input/sources/key-rules-summary.md`*
*Depends on: heir-classification, heir-concurrence, legitime-fractions*

---

## 1. Overview

Testate validation is the engine step that examines will dispositions against the computed legitimes and determines whether any dispositions must be annulled, reduced, or marked as warnings. Five distinct problems can arise:

| Problem | Trigger | Effect | Article |
|---------|---------|--------|---------|
| **Preterition** | Compulsory heir in direct line completely omitted | Institution of heir ANNULLED | Art. 854 |
| **Invalid disinheritance** | Disinheritance without valid cause (or cause unproven) | Institution annulled to extent prejudicial | Art. 918 |
| **Inofficiousness** | Testamentary dispositions + donations exceed FP | Legacies/devises reduced; donations reduced if still short | Arts. 909–911 |
| **Underprovision** | Heir receives less than their legitime | Heir may claim deficiency | (general legitime rules) |
| **Condition stripping** | Testator imposes condition/charge on legitime portion | Condition treated as not written | Art. 872 |

These are checked in sequence in the pipeline. Each can feed back into earlier steps (e.g., preterition may change the ScenarioCode if the surviving heir set changes after annulment).

---

## 2. Preterition (Art. 854)

### Definition

> Art. 854: "The preterition or omission of one, some, or all of the compulsory heirs in the direct line, whether living at the time of the execution of the will or born after the death of the testator, shall annul the institution of heir; but the devises and legacies shall be valid insofar as they are not inofficious."

### Precise Scope

**"Compulsory heirs in the direct line"** — applies only to:
- Legitimate children/descendants (G1)
- Legitimate parents/ascendants (G2, when G1 is absent)

**NOT preterition**:
- Omission of surviving spouse (G3) — produces underprovision, NOT preterition
- Omission of illegitimate children (G4) — produces underprovision, NOT preterition
- Note: G3 and G4 cannot technically be preterited; they can only be underprovided

### Preterition Triggers

Preterition occurs when a compulsory heir in the direct line:
1. Is alive at the testator's death, AND
2. Is completely absent from the will (no devise, legacy, institution, or any benefit whatsoever)

**Not preterition when**:
- The heir predeceased the testator → no preterition (Art. 854 ¶2: "if the omitted compulsory heirs should die before the testator, the institution shall be effectual")
- The heir was omitted due to a valid reason stated in the will → possibly disinheritance
- The heir was given *something* in the will (even less than their legitime) → underprovision, not preterition

### Preterition Effect: Full Annulment of Institution

```
if preterition_detected:
    annul all "institution of heir" dispositions in the will
    preserve all devises and legacies (specific property grants)
    apply inofficiousness test to surviving devises/legacies
    // The estate, after clearing the institution, is distributed:
    //   - Legitimes satisfied first
    //   - Remaining free portion per intestate rules (as if no will)
    //   - Devises/legacies paid from free portion insofar as not inofficious
```

**Key distinction — institution vs devise/legacy**:
- **Institution of heir**: General share of the estate ("I leave ½ my estate to Juan")
- **Devise/Legacy**: Specific property or sum ("I leave the Makati condo to Ana")
- Preterition annuls only institutions; specific bequests survive if not inofficious.

### Rust Enum

```rust
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum PreteritionEffect {
    /// No preterition detected
    None,
    /// Institution annulled; will reduces to devises/legacies only
    InstitutionAnnulled { preterited_heirs: Vec<HeirId> },
}
```

### Preterition Detection Algorithm

```rust
fn detect_preterition(
    classified_heirs: &ClassifiedHeirs,
    will: &Will,
    succession_type: SuccessionType,
) -> PreteritionEffect {
    if succession_type != SuccessionType::Testate {
        return PreteritionEffect::None;
    }

    let mut preterited = Vec::new();

    // Check G1 (legitimate children/descendants)
    for heir in &classified_heirs.legitimate_child_group {
        if heir.is_eligible && !will.gives_anything_to(heir.id) {
            preterited.push(heir.id);
        }
    }

    // Check G2 (legitimate ascendants) — only if G1 entirely absent
    if classified_heirs.legitimate_child_group.is_empty() {
        for heir in &classified_heirs.legitimate_ascendant_group {
            if heir.is_eligible && !will.gives_anything_to(heir.id) {
                preterited.push(heir.id);
            }
        }
    }

    if preterited.is_empty() {
        PreteritionEffect::None
    } else {
        PreteritionEffect::InstitutionAnnulled {
            preterited_heirs: preterited,
        }
    }
}
```

### Post-Annulment Distribution

After institution annulment:
1. Re-run legitime computation with the actual eligible heir set
2. Satisfy all legitimes from the estate
3. Apply surviving devises/legacies (from free portion)
4. Reduce devises/legacies if inofficious (Art. 911)
5. Distribute any remaining free portion per intestate rules

---

## 3. Disinheritance (Arts. 915–923)

### Formal Requirements (Art. 916)

A valid disinheritance requires ALL of:
1. **In a will** — disinheritance cannot be accomplished any other way
2. **Cause specified** — the specific ground must be stated
3. **Cause is an enumerated ground** — must be one of the grounds in Arts. 919–921
4. **Cause is true** — burden of proof on other heirs if disinherited heir contests (Art. 917)
5. **No reconciliation** — reconciliation after the cause voids the disinheritance (Art. 922)

### 22 Enumerated Grounds

#### Art. 919 — Grounds for Children/Descendants (8 grounds)

| # | Ground | Notes |
|---|--------|-------|
| 919(1) | Attempt on life of testator, testator's spouse, descendants, or ascendants | Criminal conviction not required; attempt sufficient |
| 919(2) | Groundless accusation of crime (6+ years imprisonment) | Accusation found groundless by competent authority |
| 919(3) | Conviction of adultery or concubinage with testator's spouse | Final conviction required |
| 919(4) | Fraud, violence, intimidation, or undue influence on will-making | Any will in testator's life |
| 919(5) | Refusal to support parent/ascendant without justifiable cause | Testator is the parent/ascendant |
| 919(6) | Maltreatment by word or deed | Verbal or physical abuse |
| 919(7) | Leading a dishonorable or disgraceful life | Ongoing conduct, not single act |
| 919(8) | Conviction for crime carrying civil interdiction | Accessory penalty, e.g. reclusion perpetua |

#### Art. 920 — Grounds for Parents/Ascendants (8 grounds)

| # | Ground | Notes |
|---|--------|-------|
| 920(1) | Abandonment of children; inducing daughters to immoral life; attempts against their virtue | Triple alternative |
| 920(2) | Conviction of attempt on testator's/spouse's/descendants'/ascendants' life | |
| 920(3) | Groundless accusation of crime (6+ years imprisonment), found false | |
| 920(4) | Conviction of adultery or concubinage with testator's spouse | |
| 920(5) | Fraud, violence, intimidation, undue influence on will-making | |
| 920(6) | Loss of parental authority for causes specified in the Code | FC Art. 228-232 grounds |
| 920(7) | Refusal to support children/descendants without justifiable cause | |
| 920(8) | Attempt by one parent against the life of the other (unless reconciled) | Intra-parental, exception for reconciliation |

#### Art. 921 — Grounds for Surviving Spouse (6 grounds)

| # | Ground | Notes |
|---|--------|-------|
| 921(1) | Conviction of attempt on testator's/descendants'/ascendants' life | Note: NOT "spouse's relatives" unlike Art. 919(1) |
| 921(2) | Groundless accusation of crime (6+ years imprisonment), found false | |
| 921(3) | Fraud, violence, intimidation, undue influence on will-making | |
| 921(4) | Spouse gave cause for legal separation | FC Art. 55 grounds |
| 921(5) | Spouse gave grounds for loss of parental authority | |
| 921(6) | Unjustifiable refusal to support children or other spouse | |

**Total: 22 grounds (8 + 8 + 6)**

### Rust Enum for Disinheritance Grounds

```rust
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum DisinheritanceGround {
    // Art. 919 — children/descendants
    AttemptOnLifeArt919_1,
    GroundlessAccusationArt919_2,
    AdulteryWithSpouseArt919_3,
    FraudOnWillArt919_4,
    RefusalToSupportParentArt919_5,
    MaltreatmentArt919_6,
    DishonorabLeLifeArt919_7,
    CivilInterdictionConvictionArt919_8,
    // Art. 920 — parents/ascendants
    AbandonmentOfChildrenArt920_1,
    AttemptOnLifeArt920_2,
    GroundlessAccusationArt920_3,
    AdulteryWithSpouseArt920_4,
    FraudOnWillArt920_5,
    LossOfParentalAuthorityArt920_6,
    RefusalToSupportChildrenArt920_7,
    AttemptOnOtherParentsLifeArt920_8,
    // Art. 921 — spouse
    AttemptOnLifeArt921_1,
    GroundlessAccusationArt921_2,
    FraudOnWillArt921_3,
    CauseForLegalSeparationArt921_4,
    GroundsForLossOfParentalAuthorityArt921_5,
    RefusalToSupportArt921_6,
}
```

### Valid Disinheritance Effects (Art. 923)

```
valid disinheritance of heir X:
  1. X is excluded from the estate (treated as predeceased for distribution purposes)
  2. X's children/descendants take X's place by right of representation
  3. X retains no usufruct or administration of the property passing to their children
```

**Representation cascade from Art. 923**:
- Disinherited heir's descendants represent them
- This is one of the 4 triggers for representation (see representation.md)
- The representatives receive X's slot per stirpes
- If X has no eligible representatives → X's share goes to vacancy resolution (accretion or intestate)

### Invalid Disinheritance Effect (Art. 918)

Disinheritance is **invalid** when:
- No cause specified
- Cause not one of the enumerated grounds
- Cause is contradicted and not proven

```
invalid disinheritance of heir X:
  1. The institution of heirs is annulled — but ONLY insofar as it prejudices X's legitime
  2. Devises, legacies, other testamentary dispositions remain valid up to the extent they
     do not impair X's legitime
  3. X is effectively reinstated for their legitime portion
  4. X does NOT necessarily receive more than their legitime (unlike preterition, which
     annuls institutions entirely — here only the prejudicial portion is struck)
```

**Contrast with preterition**:
| | Preterition | Invalid Disinheritance |
|--|-------------|----------------------|
| Trigger | Complete omission | Defective disinheritance attempt |
| Effect | Entire institution annulled | Only prejudicial portion annulled |
| Devises/legacies | Survive if not inofficious | Survive if not impairing legitime |
| Free portion | Goes by intestate rules | Remains as testator directed |

### Reconciliation (Art. 922)

```rust
/// Reconciliation between testator and heir voids a prior disinheritance.
/// The engine must check: if disinheritance_ground exists AND reconciliation_date > disinheritance_date,
/// treat as if disinheritance never occurred.
struct DisinheritanceRecord {
    heir_id: HeirId,
    ground: DisinheritanceGround,
    is_valid: bool,         // false = unproven / not enumerated ground
    reconciled: bool,       // true = Art. 922 applies → disinheritance voided
}
```

If `reconciled = true`, the disinheritance is voided and the heir is treated as fully eligible.

---

## 4. BUG-001: Multiple Simultaneous Disinheritances

### The Bug (v1 behavior)

The v1 engine processed each disinheritance one at a time, redistributing after each:
```
// WRONG v1 algorithm:
for each disinherited_heir in will.disinheritances:
    mark_heir_excluded(disinherited_heir)
    add_representatives_for(disinherited_heir)
    recompute_scenario()    // ← recomputes after EACH disinheritance
    redistribute()          // ← redistributes after EACH disinheritance
```

This produces incorrect results when 2+ heirs are disinherited in the same will, because the scenario code changes with each step, causing re-distribution at intermediate states.

### The Fix (v2 correct algorithm)

```rust
fn apply_disinheritances(
    heirs: &mut Vec<ClassifiedHeir>,
    disinheritances: &[DisinheritanceRecord],
) -> DisinheritanceResult {
    // Step 1: Validate all disinheritances
    let mut valid_dis: Vec<&DisinheritanceRecord> = disinheritances
        .iter()
        .filter(|d| d.is_valid && !d.reconciled)
        .collect();

    // Step 2: Remove ALL disinherited heirs at once
    for dis in &valid_dis {
        if let Some(heir) = heirs.iter_mut().find(|h| h.id == dis.heir_id) {
            heir.is_eligible = false;
            heir.exclusion_reason = Some(ExclusionReason::ValidDisinheritance);
        }
    }

    // Step 3: Add representatives for ALL disinherited heirs at once
    for dis in &valid_dis {
        add_representation_for_disinherited(heirs, dis.heir_id);
    }

    // Step 4: Recompute scenario code ONCE with final eligible heir set
    // (called by the pipeline, not inline here)

    DisinheritanceResult {
        valid_disinheritances: valid_dis.iter().map(|d| d.heir_id).collect(),
        invalid_disinheritances: disinheritances
            .iter()
            .filter(|d| !d.is_valid || d.reconciled)
            .map(|d| d.heir_id)
            .collect(),
    }
}
```

**Key rule**: The scenario code is recomputed exactly once after all disinheritances are applied. Never recompute mid-loop.

---

## 5. Inofficiousness (Arts. 909–911)

### Definition

A testamentary disposition (or donation) is **inofficious** when it exceeds the free portion available after satisfying all legitimes. The testator cannot effectively give away more than the FP.

### Inofficiousness Test

```
// After computing all legitimes:
total_legitimes = sum(all_heir_legitimes)
FP = estate_adjusted - total_legitimes   // estate_adjusted includes collatable donations per Art. 908

// Will dispositions:
testate_dispositions_total = sum(will.institutions) + sum(will.devises) + sum(will.legacies)

// Donations (Art. 909):
donations_to_strangers_total = sum(donations where donee not a compulsory heir)
// Donations to heirs: charged to their legitime (Art. 909, Art. 910)

// Excess:
excess = testate_dispositions_total + donations_to_strangers_total - FP
if excess > 0: inofficiousness_detected = true
```

### Reduction Order (Art. 911)

Reduction is applied in this strict order:

**Step 1 — Reduce devises and legacies (proportionally)**
```
// Reduce all devises and legacies pro rata
// Exception: if testator designated a preferred devise/legacy, reduce others first;
//   reduce the preferred one only after all others are exhausted
reduction_ratio = excess / testate_dispositions_total
for each devise/legacy:
    amount_reduced = devise.value × reduction_ratio
    devise.actual_amount = devise.value - amount_reduced
```

**Step 2 — If excess remains after full reduction of devises/legacies, reduce donations**
```
// Reduce donations in reverse chronological order (most recent first)
// Per Art. 911: donations are last resort; devises/legacies are respected first
remaining_excess = excess - total_devises_legacies
for donation in donations.sorted_by(|a,b| b.date.cmp(&a.date)):
    if remaining_excess <= 0: break
    reduction = min(donation.value, remaining_excess)
    donation.reduced_by = reduction
    remaining_excess -= reduction
```

**Note on Art. 911(3) — Usufruct/Annuity**:
If a devise/legacy is a usufruct or life annuity whose value may exceed the FP, compulsory heirs may choose between:
- (a) Complying with the provision as written, OR
- (b) Delivering to the devisee/legatee the part of the FP that the testator could freely dispose of

This is a **choice** for the compulsory heirs — the engine should flag this as a `ManualReview` item.

### Art. 912 — Indivisible Real Property

If an inofficious devise consists of **indivisible real property**:
- If reduction < ½ its value → property goes to the devisee (devisee reimburses heirs in cash)
- If reduction ≥ ½ its value → property goes to compulsory heirs (heirs reimburse devisee in cash)

This is a physical-partition issue — flagged as `ManualReview` since the engine operates in money values only.

### Rust Types

```rust
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct InofficiousnessResult {
    /// Total amount by which devises/legacies are reduced
    pub devise_reduction_total: Money,
    /// Per-devise/legacy adjustments
    pub devise_reductions: Vec<DeviseReduction>,
    /// Total amount by which donations are reduced
    pub donation_reduction_total: Money,
    /// Per-donation adjustments
    pub donation_reductions: Vec<DonationReduction>,
    /// True if any usufruct/annuity devise triggered Art. 911(3) choice
    pub has_annuity_choice: bool,
    /// True if any real property devise requires Art. 912 physical partition analysis
    pub has_indivisible_realty: bool,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct DeviseReduction {
    pub devise_id: DeviseId,
    pub original_amount: Money,
    pub reduced_amount: Money,
    pub reduction: Money,
}
```

---

## 6. Underprovision

### Definition

Underprovision occurs when a testate disposition assigns a compulsory heir less than their computed legitime.

```
for each compulsory heir:
    will_allocation = sum of will dispositions benefiting this heir
    if will_allocation < heir.legitime:
        underprovision_amount = heir.legitime - will_allocation
        // Heir is entitled to claim the deficiency from the estate
```

### Effect

The heir can claim the deficiency from:
1. The free portion of the estate
2. If FP insufficient: from reduction of other testate dispositions (in Art. 911 order)

Underprovision does NOT annul institutions (unlike preterition). It simply increases the heir's actual distribution to match their legitime.

### Rust Type

```rust
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Underprovision {
    pub heir_id: HeirId,
    pub will_allocation: Money,
    pub legitime: Money,
    pub deficiency: Money,
}
```

---

## 7. Condition Stripping (Art. 872)

### Rule

> Art. 872: "The testator cannot impose any charge, condition, or substitution whatsoever upon the legitimes prescribed in this Code. Should he do so, the same shall be considered as not imposed."

### Scope

Any condition, charge, or restriction in the will that purports to affect the **legitime portion** of a compulsory heir is automatically void. The heir receives their full legitime unconditionally.

Examples of invalid conditions:
- "I leave my legitime to Maria on condition she does not remarry" → condition stripped
- "I leave my legitime to Juan subject to the management of my executor" → charge stripped
- "I leave my legitime to Ana, but if she converts religion, it goes to Pedro" → condition stripped

The **free portion** is not restricted by Art. 872 — conditions on the FP are valid (subject to Art. 871 regarding marriage conditions, which is separately treated).

### Art. 871 — Marriage Condition Exception

> Art. 871: "The condition not to contract a first or subsequent marriage shall be considered as not written UNLESS such condition has been imposed on the widow or widower by the deceased spouse, or by the latter's ascendants or descendants."

Valid marriage condition: deceased spouse restricts widower/widow remarriage
Invalid (stripped): any other person imposes a no-remarriage condition

### Condition Detection

```rust
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ConditionStrippingResult {
    /// Conditions found on legitime portions (all stripped = void)
    pub stripped_conditions: Vec<StrippedCondition>,
    /// Conditions found on FP portion (preserved unless separately invalid)
    pub preserved_conditions: Vec<ConditionId>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct StrippedCondition {
    pub disposition_id: DispositionId,
    pub heir_id: HeirId,
    pub condition_text: String,      // original text for display
    pub affects_legitime: bool,       // always true if in stripped list
    pub article_basis: &'static str, // "Art. 872"
}
```

---

## 8. Will Input Types

### `Will` Struct

The engine input must capture:

```rust
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Will {
    /// Whether a will exists
    pub exists: bool,
    /// Institutions: general shares of the estate given to heirs
    pub institutions: Vec<Institution>,
    /// Devises: specific real property given to named persons
    pub devises: Vec<Devise>,
    /// Legacies: specific personal property or money sums given to named persons
    pub legacies: Vec<Legacy>,
    /// Explicit disinheritances with stated grounds
    pub disinheritances: Vec<DisinheritanceRecord>,
    /// Explicit substitutions designated by testator
    pub substitutions: Vec<Substitution>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Institution {
    pub id: DispositionId,
    pub heir_id: HeirId,
    /// Fraction of estate (e.g., "1/2") or null if peso amount
    pub fraction: Option<String>,     // "numer/denom" format
    /// Peso amount in centavos (null if fraction used)
    pub amount_centavos: Option<i64>,
    /// Any conditions attached (may be stripped per Art. 872)
    pub conditions: Vec<String>,
    /// Whether this institution is preferred for Art. 911 reduction
    pub is_preferred: bool,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Devise {
    pub id: DeviseId,
    /// Beneficiary (may be compulsory heir or stranger)
    pub beneficiary_id: Option<HeirId>,   // null if stranger
    pub beneficiary_name: String,
    pub property_description: String,
    pub estimated_value_centavos: i64,
    pub is_usufruct: bool,
    pub is_real_property: bool,
    pub conditions: Vec<String>,
    pub is_preferred: bool,   // Art. 911 preferred devise
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Legacy {
    pub id: LegacyId,
    pub beneficiary_id: Option<HeirId>,
    pub beneficiary_name: String,
    pub amount_centavos: i64,
    pub conditions: Vec<String>,
    pub is_preferred: bool,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(deny_unknown_fields)]
pub struct DisinheritanceRecord {
    pub heir_id: HeirId,
    pub ground: DisinheritanceGround,
    /// True if reconciliation occurred after the disinheritance (Art. 922)
    pub reconciled: bool,
    /// Engine-computed: ground is enumerated + not reconciled
    pub is_valid: bool,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Substitution {
    pub primary_heir_id: HeirId,
    pub substitute_heir_id: HeirId,
    pub substitution_type: SubstitutionType,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum SubstitutionType {
    Simple,      // Art. 857 — A in default of B
    Fideicommissary,  // Art. 863 — A holds and transmits to B
}
```

---

## 9. Testate Validation Pipeline Step

### Inputs
- `will: Will`
- `classified_heirs: ClassifiedHeirs`
- `computed_legitimes: LegitimeResult`
- `estate_adjusted: Money` (post-collation)

### Outputs

```rust
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TestateValidationResult {
    pub preterition: PreteritionEffect,
    pub disinheritance_result: DisinheritanceResult,
    pub underprovisions: Vec<Underprovision>,
    pub inofficiousness: Option<InofficiousnessResult>,
    pub stripped_conditions: Vec<StrippedCondition>,
    /// True if engine must restart scenario determination after validation
    pub requires_restart: bool,
    /// Warnings for the UI
    pub warnings: Vec<ValidationWarning>,
    /// Items that require manual legal review (usufruct choice, indivisible realty, etc.)
    pub manual_review_flags: Vec<ManualReviewFlag>,
}
```

### Step Sequence

```
1. Check disinheritances (BUG-001 fix: batch process all at once)
   → if any valid disinheritances: mark heirs excluded, add representatives
   → if any invalid disinheritances: flag Art. 918 partial annulment
   → set requires_restart = true if heir set changed

2. Check preterition (Art. 854)
   → for each G1/G2 heir: alive + completely omitted = preterited
   → if preterition: annul all institutions, set requires_restart = true

3. Strip invalid conditions from legitime portions (Art. 872)
   → flag stripped conditions as warnings

4. Check underprovision (after preterition/disinheritance adjustments)
   → for each compulsory heir: will_allocation < legitime → underprovision

5. Check inofficiousness (Arts. 909–911)
   → compute FP
   → if (devises + legacies + donations_to_strangers) > FP → reduce per Art. 911 order
   → flag usufruct choices and indivisible realty for manual review

6. Return TestateValidationResult
```

### Restart Logic

The pipeline step 7 (validation) may trigger a restart of steps 3–6 when:
- Valid disinheritances change the eligible heir set (requires new ScenarioCode)
- Preterition annuls institutions (requires new distribution calculation)

Maximum restarts: 3 (same as overall pipeline restart guard).

---

## 10. Integration with `requires_will` Flag

The validation step runs only when `will.exists = true`. When `will.exists = false`:
- Succession type = Intestate
- No preterition, no condition stripping, no will-related inofficiousness
- Disinheritances are impossible (Art. 916 requires a will)
- The step is a no-op: return empty `TestateValidationResult`

---

## 11. Edge Cases

### EC-1: Preterition of ALL Compulsory Heirs in Direct Line

If all G1 heirs are preterited:
- All institutions annulled
- Estate distributed: legitimes satisfied, then intestate rules for remainder
- Devises/legacies survive if not inofficious

### EC-2: Preterition + Disinheritance in Same Will

If a will both disinherits heir A (valid) and completely omits heir B (preterition):
- Process disinheritance first (batch): A excluded, A's descendants added as representatives
- Check preterition: B is preterited
- Both effects apply: institution annulled (from preterition), A's descendants still represent

### EC-3: Heir Born After Will Execution

Art. 854 extends preterition to heirs "born after the death of the testator" — i.e., posthumous children born to the decedent's spouse within 300 days of death (FC Art. 164 conception presumption). Engine should flag this as `ManualReview` since it requires external verification.

### EC-4: Invalid Disinheritance + Complete Omission

If the will attempts to disinherit heir X with an invalid ground AND completely fails to give X anything:
- Invalid disinheritance (Art. 918): institution annulled to extent prejudicial
- But the complete omission could also constitute preterition (Art. 854)
- **Preterition is the stronger doctrine** — it annuls all institutions, not just the prejudicial portion
- Engine should apply preterition when both apply, and note the invalid disinheritance attempt as a warning

### EC-5: Heir Given Condition-Laden Legitime Only

If the only thing given to a compulsory heir is their legitime with a condition:
- Condition is stripped (Art. 872) → heir still receives legitime unconditionally
- NOT preterition (heir was not omitted; they were given something)
- The stripping is silent: heir gets the legitime without the condition, no underprovision

### EC-6: Reconciliation After Disinheritance

If `DisinheritanceRecord.reconciled = true`:
- The disinheritance is voided (Art. 922)
- The heir is treated as fully eligible
- Check whether the will was updated after reconciliation — if not, the heir may be underprovided
- Flag as `ManualReview` if will predates reconciliation (heir likely underprovided)

---

## 12. Validation Warnings Catalog

| Warning Code | Trigger | Display Message |
|---|---|---|
| `PRETERITION_DETECTED` | Art. 854 preterition | "Institution of heirs is annulled due to preterition of [heir name]." |
| `INVALID_DISINHERITANCE` | Art. 918 | "Disinheritance of [heir] appears invalid; institution annulled to extent it impairs their legitime." |
| `CONDITION_STRIPPED` | Art. 872 | "Condition on [heir]'s legitime portion is legally void and will be treated as not imposed." |
| `UNDERPROVISION` | Heir allocation < legitime | "[Heir] receives less than their legitime (₱X). Engine adjusts distribution to ₱Y." |
| `INOFFICIOUSNESS_REDUCED` | Art. 911 | "Devise/legacy to [beneficiary] reduced from ₱X to ₱Y due to inofficiousness." |
| `RECONCILIATION_VOIDED` | Art. 922 | "Disinheritance of [heir] is voided by reconciliation. Heir treated as eligible." |
| `POSTHUMOUS_HEIR_POSSIBLE` | Art. 854 ¶2 | "A posthumous child may exist. Manual review required." |
| `ANNUITY_CHOICE_REQUIRED` | Art. 911(3) | "Devise of usufruct/annuity requires compulsory heirs to elect compliance or cash-out." |
| `INDIVISIBLE_REALTY` | Art. 912 | "Inofficious devise of real property requires partition analysis by legal counsel." |
| `MULTIPLE_DISINHERITANCES` | 2+ valid disinheritances | "Multiple simultaneous disinheritances processed in batch (BUG-001 fix applied)." |

---

## 13. Article Quick Reference

| Rule | Article |
|------|---------|
| Preterition | Art. 854 |
| Preterition does not occur if heir predeceases | Art. 854 ¶2 |
| Condition stripping on legitime | Art. 872 |
| Marriage condition exception | Art. 871 |
| Estate base for legitime computation | Art. 908 |
| Imputation of donations to children | Art. 909 |
| Imputation of donations to illegitimate children | Art. 910 |
| Inofficiousness reduction order | Art. 911 |
| Indivisible real property | Art. 912 |
| Disinheritance formal requirements | Art. 915, 916 |
| Burden of proof | Art. 917 |
| Invalid disinheritance effect | Art. 918 |
| Grounds — children/descendants | Art. 919 |
| Grounds — parents/ascendants | Art. 920 |
| Grounds — spouse | Art. 921 |
| Reconciliation voids disinheritance | Art. 922 |
| Disinherited heir's children represent | Art. 923 |
