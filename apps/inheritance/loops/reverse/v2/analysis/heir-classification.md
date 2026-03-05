# Heir Classification Analysis
*Wave 2 — Domain Rule Extraction*
*Sources: Civil Code Art. 887, Family Code Arts. 163–182, RA 8552 Sec. 17–20, RA 11642*

---

## 1. The Four Compulsory Heir Groups (Art. 887)

| Group Code | Legal Basis | Members | Excluded By |
|---|---|---|---|
| `LEGITIMATE_CHILD_GROUP` | Art. 887(1) + FC 179 + RA 8552 §17 | Legitimate biological, Legitimated (FC 177–179), Adopted (RA 8552) | Nobody (never excluded) |
| `LEGITIMATE_ASCENDANT_GROUP` | Art. 887(2) | Legitimate parents, grandparents, further ascendants | G1: if ANY member of LEGITIMATE_CHILD_GROUP is eligible |
| `SURVIVING_SPOUSE_GROUP` | Art. 887(3) | Widow or widower | Nobody (but eligibility gated by legal separation) |
| `ILLEGITIMATE_CHILD_GROUP` | Art. 887(4–5) + FC 176 | All illegitimate children with proved filiation | Nobody (never excluded by other groups) |

**Critical rule**: Groups 3, 4, and 5 of Art. 887 (spouse and illegitimate children) are NOT excluded by groups 1 and 2, and do not exclude each other. Only LEGITIMATE_ASCENDANT_GROUP is excluded when LEGITIMATE_CHILD_GROUP is present.

---

## 2. Heir Subtypes and Effective Categories

The engine must model the actual legal status of an heir (`HeirType`) separately from the computed group they join for distribution (`EffectiveGroup`):

### `HeirType` enum (Rust)
```rust
enum HeirType {
    LegitimateChild,        // Born/conceived in valid marriage (FC 164)
    LegitimatedChild,       // Born outside wedlock, parents later married (FC 177–179)
    AdoptedChild,           // RA 8552 or RA 11642 adoption, not rescinded
    IllegalChild,           // Born outside marriage, filiation proved (FC 165, 175)
    LegitimateAscendant,    // Legitimate parents/grandparents (Art. 887(2))
    Spouse,                 // Widow or widower
}
```

### Effective Group Mapping
```
HeirType::LegitimateChild    → EffectiveGroup::LegitimateChildGroup
HeirType::LegitimatedChild   → EffectiveGroup::LegitimateChildGroup  (FC 179: same rights)
HeirType::AdoptedChild       → EffectiveGroup::LegitimateChildGroup  (RA 8552 §17: no distinction)
HeirType::IllegalChild       → EffectiveGroup::IllegitimateChildGroup
HeirType::LegitimateAscendant → EffectiveGroup::LegitimateAscendantGroup
HeirType::Spouse             → EffectiveGroup::SurvivingSpouseGroup
```

**Engine note**: The effective group is what drives scenario code assignment and fraction computation. HeirType is retained for display, narrative, and edge case logic (e.g., rescission check, stepparent adoption).

---

## 3. Eligibility Gate — Pre-Classification Filter

Before assigning an heir to a group, the engine must evaluate these gates in order. A failed gate marks the heir as `Ineligible` (not simply removes them — the reason must be stored for the narrative output).

### Gate 1: Death with No Representatives
```
if heir.is_deceased AND heir.representatives.is_empty():
    → Ineligible(reason: DeadNoRepresentatives)
```
Note: if heir is deceased but HAS eligible representatives, the heir is not placed in the group — their representatives are placed via right of representation.

### Gate 2: Unworthiness (Art. 1032)
```
if heir.is_unworthy AND NOT heir.unworthiness_condoned (Art. 1033):
    → Ineligible(reason: Unworthy)
```
- Condoned unworthiness: testator knew of the cause at time of will execution (Art. 1033).
- Descendants of unworthy heir may represent (Art. 1035).

### Gate 3: Illegitimate Filiation Not Proved (Art. 887 ¶3)
```
if heir.type == IllegalChild AND NOT heir.filiation_proved:
    → Ineligible(reason: FiliationNotProved)
```
- Legitimate and adopted children have their filiation proved by birth certificate / court order; this gate only fires for illegitimate children.
- Proof modes (FC 172/175): birth record, final judgment, public document admission, private handwritten instrument, open and continuous possession of status, other means per Rules of Court.

### Gate 4: Guilty Spouse in Legal Separation (Art. 1002)
```
if heir.type == Spouse AND heir.legal_separation_status == GuiltySpouse:
    → Ineligible(reason: GuiltySpouseLegalSeparation)
```
- If the DECEASED gave cause for legal separation, the surviving spouse STILL inherits (Art. 892).
- Only the spouse who **gave cause** for legal separation is excluded.

### Gate 5: Rescinded Adoption (RA 8552 §20)
```
if heir.type == AdoptedChild AND heir.adoption_rescinded:
    if heir.adoption_rescission_date < decedent.date_of_death:
        → Ineligible(reason: AdoptionRescinded)
    // If rescission after death: adoption rights survive
```

### Gate 6: Valid Disinheritance (Arts. 915–923)
```
if heir.is_disinherited AND heir.disinheritance_is_valid:
    → Ineligible(reason: ValidlyDisinherited)
    // BUT: heir's descendants may represent (Art. 923)
    // BUG-001 fix: all disinheritances processed together, not sequentially
```

### Gate 7: Renunciation (Art. 1041, Art. 977)
```
if heir.has_renounced:
    → Ineligible(reason: Renounced)
    // Art. 977: representatives of a renouncing heir CANNOT represent
    // Renunciation is the ONLY vacancy trigger that blocks representation
```

---

## 4. Group Exclusion: Ascendants Excluded by Descendants

After the eligibility gate passes, the engine must check group-level exclusion:

```
if LEGITIMATE_CHILD_GROUP.has_any_eligible_member():
    // Exclude ALL of LEGITIMATE_ASCENDANT_GROUP
    for heir in LEGITIMATE_ASCENDANT_GROUP:
        heir.status = ExcludedByGroup(reason: "Legitimate descendants present (Art. 887(2))")
```

This check happens AFTER representation is resolved — if a child is deceased but has eligible representatives, the representatives count as filling LEGITIMATE_CHILD_GROUP for purposes of this exclusion check.

---

## 5. Ascendant Division Rules (Art. 890)

When LEGITIMATE_ASCENDANT_GROUP is eligible, the share allocation within the group follows:

| Ascendant Composition | Division Rule |
|---|---|
| Both parents living | Equal halves |
| One parent dead | Entire ascendant share to survivor |
| No parents, grandparents of equal degree, same line | Equal among grandparents in that line |
| No parents, grandparents of equal degree, both lines | ½ paternal line + ½ maternal line, then per capita within each line |
| Ascendants of different degrees | Entirely to nearest-in-degree (nearer excludes remoter) |

**Engine data needed**: For each ascendant, store: `paternal_line: bool`, `degree: u32`. The algorithm walks upward, finds the minimum degree present, keeps only those at minimum degree, then splits by line.

---

## 6. Illegitimate Child Filiation (FC Art. 176, superseding Civil Code Art. 895)

**The Family Code eliminated the Civil Code's three-tier illegitimate classification**:
- Pre-FC: "acknowledged natural child", "natural child by legal fiction", "other illegitimate"
- Post-FC (in force since 1988): single category — illegitimate child — all receive **½ of a legitimate child's legitime**

**Engine implication**: The Rust engine needs only one `IllegitimateChild` category. No sub-tier distinction. Civil Code Art. 895's three-paragraph structure is superseded; only the ½ rule applies universally.

---

## 7. Legitimation Requirements (FC Arts. 177–180, RA 9858 amendment)

A legitimated child must have been:
1. Born outside of wedlock
2. Parents had **no legal impediment** to marry at time of conception, OR the only impediment was that one or both parents were **under 18** (RA 9858 amendment to Art. 177)
3. Parents subsequently contracted a **valid marriage** (Art. 178)

Effects:
- Retroactive to birth (Art. 180)
- Legitimated child's deceased descendants also benefit (Art. 181)
- Impugment period: 5 years from accrual for prejudiced parties (Art. 182)

**Engine flag**: `is_legitimated: bool` on Heir. If true AND legitimation is valid → `effective_group = LEGITIMATE_CHILD_GROUP`. Invalid legitimation (failed conditions) → heir remains illegitimate.

---

## 8. Stepparent Adoption Edge Case (RA 8552 §16)

When the adopter is married to the child's biological parent:
- Biological parent retains parental authority (shared with adopter)
- Child retains inheritance rights from the biological parent
- Child gains inheritance rights from the adopter

**Engine implications**: This is the only scenario where an adopted child has succession rights in TWO separate estates. The engine handles each estate computation independently; within the estate being computed (e.g., the adopter's estate), the child is classified as `LEGITIMATE_CHILD_GROUP`. The child's dual-succession status is metadata, not a computation concern within a single estate.

---

## 9. Engine Data Model for Heir Input

Every heir record must carry these fields:

```rust
struct HeirInput {
    id: String,                           // stable identifier
    heir_type: HeirType,                  // legal classification
    is_deceased: bool,                    // predecease check
    date_of_death: Option<NaiveDate>,     // for predecease ordering
    representatives: Vec<String>,         // heir_ids of eligible representatives
    is_unworthy: bool,                    // Art. 1032
    unworthiness_condoned: bool,          // Art. 1033
    filiation_proved: bool,               // FC 172/175; always true for legit/adopted
    legal_separation_status: Option<LegalSeparationStatus>, // Spouse only
    adoption_rescinded: bool,             // AdoptedChild only
    adoption_rescission_date: Option<NaiveDate>,
    biological_parent_is_adopter_spouse: bool, // Stepparent adoption flag
    is_disinherited: bool,                // flagged by testate validation step
    disinheritance_is_valid: bool,        // from will validation
    has_renounced: bool,                  // Art. 1041
    paternal_line: bool,                  // Ascendant only
    degree: Option<u32>,                  // Ascendant only (1=parent, 2=grandparent, ...)
    is_legitimated: bool,                 // FC 177–179
}

enum LegalSeparationStatus {
    InnocentSpouse,
    GuiltySpouse,
    NotApplicable,
}
```

---

## 10. Classification Algorithm (Pseudocode)

```
fn classify_heirs(heirs: Vec<HeirInput>, decedent: Decedent) -> HeirClassificationResult:
    eligible = []
    excluded = []
    represented = []

    // Step 1: Eligibility gate (in gate order 1–7 above)
    for heir in heirs:
        result = run_eligibility_gate(heir, decedent)
        match result:
            Eligible   → eligible.push(heir)
            Ineligible(reason) → excluded.push((heir, reason))

    // Step 2: Resolve representation for ineligible heirs (death, unworthiness, disinheritance)
    // (Renouncing heirs: NO representation per Art. 977)
    for (heir, reason) in excluded:
        if reason in [DeadNoRepresentatives, Unworthy, ValidlyDisinherited]:
            reps = heir.representatives.filter(r → r.is_eligible_as_representative(decedent))
            if reps.not_empty():
                represented.push(RepresentationGroup { heir_id: heir.id, reps, per_stirpes_share: nil })

    // Step 3: Build effective groups
    groups = {
        LEGITIMATE_CHILD_GROUP: eligible.filter(e → e.effective_group == LegitimateChild),
        LEGITIMATE_ASCENDANT_GROUP: eligible.filter(e → e.effective_group == LegitimateAscendant),
        SURVIVING_SPOUSE_GROUP: eligible.filter(e → e.effective_group == Spouse),
        ILLEGITIMATE_CHILD_GROUP: eligible.filter(e → e.effective_group == IllegitimateChild),
    }

    // Also add representation groups into LEGITIMATE_CHILD_GROUP if representatives are in that group
    for rep_group in represented:
        if rep_group.reps[0].effective_group == LegitimateChild:
            groups.LEGITIMATE_CHILD_GROUP.add_all(rep_group.reps)
        // etc.

    // Step 4: Group exclusion
    if groups.LEGITIMATE_CHILD_GROUP.not_empty():
        for asc in groups.LEGITIMATE_ASCENDANT_GROUP:
            excluded.push((asc, ExcludedByGroup("Art. 887(2): legitimate descendants present")))
        groups.LEGITIMATE_ASCENDANT_GROUP = []

    return HeirClassificationResult { groups, excluded, represented }
```

---

## 11. Summary: What the Engine Needs Per Heir

| Field | Affects | Gate |
|---|---|---|
| `heir_type` | Effective group assignment | All |
| `is_deceased` + `representatives` | Death gate + representation | Gate 1 |
| `is_unworthy` + `unworthiness_condoned` | Unworthiness gate | Gate 2 |
| `filiation_proved` | Illegitimate filiation gate | Gate 3 |
| `legal_separation_status` | Spouse exclusion | Gate 4 |
| `adoption_rescinded` + `adoption_rescission_date` | Adoption rescission | Gate 5 |
| `is_disinherited` + `disinheritance_is_valid` | Disinheritance gate | Gate 6 |
| `has_renounced` | Renunciation gate | Gate 7 |
| `paternal_line` + `degree` | Ascendant division (Art. 890) | Post-classification |
| `is_legitimated` | Effective group override | Pre-gate |

---

## 12. Article Quick Reference for This Aspect

| Rule | Article |
|---|---|
| Compulsory heirs definition | Art. 887 CC |
| Illegitimate children = ½ legitimate | FC Art. 176 |
| Legitimated = legitimate | FC Arts. 177–180 |
| Adopted = legitimate | RA 8552 §17 |
| Rescission of adoption | RA 8552 §20 |
| Stepparent adoption dual rights | RA 8552 §16 |
| Filiation proof modes | FC Arts. 172, 175 |
| Guilty spouse excluded | Art. 1002 CC |
| Unworthiness grounds | Art. 1032 CC |
| Unworthiness condoned | Art. 1033 CC |
| Unworthy heir's children represent | Art. 1035 CC |
| Renunciation blocks representation | Art. 977 CC |
| Ascendant division | Art. 890 CC |
| Disinheritance → descendants represent | Art. 923 CC |
