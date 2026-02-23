# Analysis: spec-review

**Date**: 2026-02-23
**Wave**: 5 (Synthesis)
**Verdict**: FAILS — 3 targeted fix-it aspects added to frontier

---

## Task

Self-review: "Could a developer with zero knowledge of Philippine succession law build the engine from this spec alone?"

Review methodology: read every section of `inheritance-engine-spec.md` (2066 lines) against 5 criteria:
1. Missing heir combination scenarios — every scenario must have exact fractions
2. Vague legitime fractions — every fraction must be exact, not "see analysis file"
3. Missing test vectors for important scenarios
4. Narrative template completeness — standard + all special events
5. Pipeline step completeness — can a developer implement all 10 steps from the spec?

---

## Verdict: FAILS (3 targeted fix-its required)

The spec is **85% complete**. It would let a developer build the core engine correctly but would leave them guessing on narrative generation for many cases, and unable to validate their implementation for ~20 of 30 scenarios. Three fix-it aspects are added to the frontier; the spec does NOT converge until they are resolved.

---

## What Passes

### Section 1-3: Overview, Scope, Legal Background ✅

Clear, well-structured orientation for a developer with zero law knowledge. The 8-concept legal background (compulsory heirs, legitime, free portion, intestate vs testate, Art. 895 ¶3 cap rule, representation, preterition, collation) is complete and accurate. A developer finishing Section 3 would have sufficient conceptual grounding.

### Section 4: Data Model ✅ (with minor gaps — see below)

All structs and enums are present. The 30+-field `Heir` struct, the `Will` model with all 6 `ShareSpec` variants, the 18-field `Donation` struct, and the `EngineOutput` types are comprehensive. The `Fraction` and `Money` primitive types correctly enforce the rational arithmetic mandate.

Category derivation rule is explicit:
```
LEGITIMATE_CHILD | LEGITIMATED_CHILD | ADOPTED_CHILD → LEGITIMATE_CHILD_GROUP
ILLEGITIMATE_CHILD → ILLEGITIMATE_CHILD_GROUP
SURVIVING_SPOUSE → SURVIVING_SPOUSE_GROUP
LEGITIMATE_PARENT | LEGITIMATE_ASCENDANT → LEGITIMATE_ASCENDANT_GROUP
```

### Section 5: Computation Pipeline ✅

All 10 steps have pseudocode. The two restart conditions are documented with their guards. The rational arithmetic mandate is enforced throughout. The collatability table in Step 4 covers all 12 donation categories. The critical note "Step 7 uses net estate at death, NOT collation-adjusted base" is explicit.

### Section 6: Legitime Fraction Table ✅

All 15 testate scenarios with exact fractions. Cap rule formulas are correct and verified:
- T4 cap triggers when m > 2n (verified: m/(4n) > ½ ↔ m > 2n)
- T5a cap triggers when m > 1 (verified: FP_after_spouse = ¼, uncapped total = m/4 > ¼ ↔ m > 1)
- T5b cap triggers when m > 2(n-1) (verified: FP_after_spouse = (n-1)/(2n), uncapped total = m/(4n) > (n-1)/(2n) ↔ m > 2(n-1))

Ascendant division sub-algorithm is complete: 3-tier (parents → nearest degree → by-line split). Art. 972 "no representation in ascending line" is explicitly noted.

### Sections 7-9: Intestate Rules, Validation, Special Modules ✅

All 15 intestate scenarios with exact distribution formulas. The "NO cap rule in intestate" point is prominently stated and repeated. The 5-check testate validation pipeline is correct and ordered. The Art. 1021 legitime vs free-portion accretion distinction ("in own right" → restart vs proportional → no restart) is correct and critical — the spec gets this right.

The Art. 911 three-phase reduction algorithm is complete pseudocode. The 4-priority vacancy resolution chain is correct.

### Section 12: Manual Review Flags ✅ (minor gap — see below)

All 6 flags present with triggers, defaults, and legal basis.

---

## What Fails

### CRITICAL FAIL 1: Narrative Templates Incomplete (Sections 10 + 14.6)

**The problem**: Section 10 provides the standard template and 7 validation rules. It covers:
- Standard header
- Succession type sentence
- Category explanation
- Legitime computation block
- Free portion sentence

What it does NOT provide as templates:
1. **Collateral heir narratives** (scenarios I12-I14): No template for how to explain to a sibling, nephew/niece, or cousin why they are inheriting. What articles are cited? What's the structure?
2. **State/escheat narrative** (I15): No template.
3. **Special event templates**: The following events have NO template in the spec (they are in explainer-format.md only, which the spec shouldn't require developers to read):
   - Representation section — when an heir inherits "by representation"
   - Disinheritance (valid) section — explaining to representatives why their ancestor was excluded
   - Disinheritance (invalid/Art. 918) section — explaining reinstatement
   - Preterition section — explaining the Art. 854 annulment effect to ALL heirs
   - Inofficiousness reduction section — explaining why a legacy was reduced from ₱X to ₱Y
   - Underprovision recovery section (Art. 855) — explaining the 3-source waterfall
   - Condition stripping section (Art. 872) — noting that a condition was removed
   - Accretion section — for Art. 1021 and Art. 1015-1019 cases
   - Collation section — showing donation imputation arithmetic
   - Articulo mortis reduction section — explaining ½ → ⅓ reduction
   - Reserva troncal warning section

The test vectors partially fill this gap — TV-07 shows a preterition narrative, TV-08 shows representation+disinheritance, TV-13 shows the cap rule. But TV-08 shows representation in the context of disinheritance, not standalone predecease representation. A developer cannot reliably derive all 19 NarrativeSection types from 13 test vectors.

**Impact**: The narrative is a stated core output of the engine ("this is a USER-TARGETED engine"). A developer who builds the computation correctly but generates incorrect narratives has failed the spec's requirement.

**Section 14.6** makes this worse: "Test all 28 narrative patterns (N-01 through N-28) in `analysis/explainer-format.md`" — this explicitly tells developers to read an analysis file the spec is supposed to replace. This violates the standalone requirement.

**Fix-it**: `spec-patch-narratives` — add all 19 NarrativeSection templates directly to Section 10 of the spec, replacing the reference to explainer-format.md with inline content.

---

### CRITICAL FAIL 2: Missing Test Vectors for 20+ Scenarios (Section 11 + 14.6)

**The problem**: The spec provides 13 test vectors covering 10 scenarios (I1, I2, I3, I6, I11, T1, T2, T3, T5a, T5b). But the spec's own implementation requirements say:
- "Unit test each legitime scenario (T1-T15) with both cap-triggered and non-cap cases"
- "Unit test each intestate scenario (I1-I15)"
- "Integration test all 13 test vectors above"

The following scenarios have **zero test vectors**:

| Missing Testate | Missing Intestate |
|----------------|------------------|
| T4 (LC + IC, no spouse) | I4 (n LC + m IC + spouse) |
| T6 (ascendants only) | I7 (IC only) |
| T7 (ascendants + spouse) | I8 (IC + spouse) |
| T8 (ascendants + IC) | I9 (ascendants + IC) |
| T9 (ascendants + IC + spouse) | I10 (ascendants + IC + spouse) |
| T10 (IC + spouse) | I12 (spouse + siblings) |
| T11 (IC only) | I13 (sibling/nephew collaterals) |
| T12 (spouse only, testate) | I14 (other collaterals) |
| T14 (illegitimate decedent, parents) | I15 (State) |
| T15 (illegitimate decedent, parents + spouse) | |

That is 10 missing testate scenarios + 9 missing intestate scenarios = **19 of 30 scenarios have no test vector**.

A developer implementing Regime B (T6-T9), Regime C (T10-T12), illegitimate decedent (T14-T15), or intestate collateral succession (I12-I15) has no reference computation to validate against.

**Impact**: The developer would implement these scenarios from the fraction table alone, with no validation checkpoint. Bugs in ascendant division, the collateral blood-type algorithm, or the IC-only scenario would go undetected.

**Fix-it**: `spec-patch-test-vectors` — add minimal test vectors for T4, T6-T9, T10-T12, T14-T15, I4, I7-I10, I12-I15 (simplified: exact peso amounts + fraction computation + invariant verification). Does not need full narratives for all, just enough to validate the fraction computation.

---

### MINOR FAIL 3: Data Model Gaps (Section 4)

These do not block implementation but would cause developer confusion:

**3a. Will validity contract undefined**

`Will.is_valid` is described as "Form validity (probated — outside engine scope)". But what should the engine do when `is_valid = false`?

The spec is silent. A developer could reasonably either: (a) treat invalid will = intestate, (b) throw an error, or (c) still process the substantive dispositions. Answer should be stated explicitly. The correct answer (implied by "outside engine scope") is: the engine should **reject invalid wills at the input boundary** and only accept wills where probate has confirmed formal validity. If `is_valid = false`, the engine should throw an input validation error.

**3b. `is_gratuitous` field unexplained**

`Donation.is_gratuitous: bool` has no explanation of when false or what effect that has on collatability. A donation with `is_gratuitous = false` would not be a "donation" in the legal sense (it would be a sale). Either remove this field, or define what it means for computation.

**3c. `BloodType` undefined**

`BloodType { FULL, HALF }` is defined but never explained. A developer in most jurisdictions would guess correctly, but the spec should state: FULL = both parents of the heir are siblings (same mother AND father) of the decedent; HALF = only one parent (same father OR same mother, but not both). This is needed for I13 full/half blood weighting.

**3d. `FiliationProof` article numbering inconsistency**

Section 4.2 uses:
```
OPEN_CONTINUOUS_POSSESSION,  // FC Art. 172 ¶2(1)
OTHER_EVIDENCE,              // FC Art. 172 ¶2(2)
```

Section 10.5 uses:
```
OPEN_CONTINUOUS_POSSESSION → "...Art. 172(3), Family Code..."
OTHER_EVIDENCE → "...Art. 172(4), Family Code..."
```

Both refer to the same provisions but use different citation formats. A developer generating narratives would use Section 10.5 citations (correct for narrative output), but the enum comment in Section 4.2 would confuse them. Unify to one format.

**3e. Four manual flag codes missing from Section 12**

The spec-draft analysis log notes 10 manual review flags (6 from computation-pipeline + 4 from edge-cases). But Section 12 of the spec only lists 6. The 4 missing flags from edge-cases.md:
- `USUFRUCT_ANNUITY_OPTION` — Art. 911 ¶3: testator or compulsory heir may elect usufruct/annuity instead of reduction; computation depends on election
- `DUAL_LINE_ASCENDANT` — when a consanguineous union means an ascendant appears in both paternal and maternal lines; Art. 890 by-line split is ambiguous
- `POSTHUMOUS_DISINHERITANCE` — will disinherits an heir conceived but not yet born; disinheritance validity for posthumous children
- `CONTRADICTORY_DISPOSITIONS` — will has internally contradictory clauses (e.g., heir X gets ½ and heir X gets ⅓)

Without these flags, a developer would compute a deterministic result in gray-area situations that should trigger a warning. The `ManualFlagCode` enum in Section 4.7 only lists 6 values and should list 10.

**Fix-it**: `spec-patch-minor-gaps` — address all items in 3a through 3e above with targeted edits to the spec. Estimated: add ~50 lines to Section 4, Section 10, Section 12.

---

## Complete Gap Table

| # | Section | Gap | Severity |
|---|---------|-----|---------|
| 1 | 10, 14.6 | Narrative templates missing for all special events and collateral/escheat scenarios | CRITICAL |
| 2 | 11, 14.6 | Test vectors missing for 19 of 30 scenarios (T4, T6-T15, I4, I7-I15) | CRITICAL |
| 3a | 4.3 | `Will.is_valid = false` behavior undefined | MINOR |
| 3b | 4.4 | `is_gratuitous` field unexplained | MINOR |
| 3c | 4.5 | `BloodType` FULL/HALF not defined | MINOR |
| 3d | 4.2, 10.5 | `FiliationProof` article numbering inconsistent (¶2(1) vs (3)) | MINOR |
| 3e | 4.7, 12 | 4 manual flag codes missing (USUFRUCT_ANNUITY_OPTION, DUAL_LINE_ASCENDANT, POSTHUMOUS_DISINHERITANCE, CONTRADICTORY_DISPOSITIONS) | MINOR |

---

## What Does NOT Need Fixing

The following aspects were carefully reviewed and are CORRECT:

1. **Legitime fractions**: All 15 testate scenarios have exact fractions. Cap trigger thresholds mathematically verified. ✅
2. **Pipeline step order**: The 10-step pipeline is correct. Restart conditions are properly guarded. ✅
3. **Art. 854 vs Art. 918 distinction**: Preterition (total annulment) vs invalid disinheritance (partial annulment) is clearly differentiated. ✅
4. **Art. 1021 accretion distinction**: Vacant legitime → restart (not proportional) vs vacant FP → proportional accretion. Correct. ✅
5. **Cause-category matching**: Implicitly defined by enum naming (CHILD_, PARENT_, SPOUSE_) + explicit IMPORTANT note in Section 4.3. Inferable by developer. ✅
6. **Art. 977 renunciation non-trigger**: Correctly noted in Step 2 pseudocode ("Art. 977: NO line created"). ✅
7. **Iron Curtain Rule**: Correct in I13 for collateral succession. ✅
8. **Rational arithmetic mandate**: Explicitly enforced throughout. ✅
9. **FP_gross vs FP_disposable**: Two-value tracking is correct and critical. ✅
10. **Testate vs intestate cap rule difference**: Prominently stated and repeated. ✅

---

## Fix-it Aspects Added to Frontier

Three aspects are added to the frontier for targeted spec patches:

1. **`spec-patch-narratives`** (Wave 5): Add all 19 NarrativeSection templates to Section 10 of the spec; add collateral, State, and special-event narrative templates; remove reference to explainer-format.md from Section 14.6. Sources: `analysis/explainer-format.md`.

2. **`spec-patch-test-vectors`** (Wave 5): Add minimal test vectors for T4, T6-T9, T10-T12, T14-T15, I4, I7-I10, I12-I15 to Section 11 of the spec (exact amounts + fraction computation + key invariants; no narrative required except for one scenario per wave). Sources: `analysis/test-vectors.md`, `analysis/legitime-table.md`, `analysis/intestate-order.md`.

3. **`spec-patch-minor-gaps`** (Wave 5): Targeted edits to address items 3a-3e: (a) will validity contract, (b) is_gratuitous removal/clarification, (c) BloodType definition, (d) FiliationProof citation unification, (e) add 4 missing ManualFlagCode values to Section 4.7 and Section 12. Sources: `analysis/edge-cases.md`, `analysis/data-model.md`.

Once all three patch aspects are completed, re-run `spec-review`.

---

## Test Implications

This review generates the following test implications for the eventual implementation:

- The 28 narrative test cases in explainer-format.md must be made part of the spec (not just analysis files) — they constitute the spec's acceptance test for narrative generation
- After spec-patch-test-vectors: the engine has ~30 test vectors covering all T and I scenarios, plus special cases = complete regression suite
- The 10 invariants in Section 11 should be run against all 30+ vectors automatically

---

## Summary

The spec is structurally sound and legally accurate. Its computation logic is complete and correct. The gaps are in the **user-facing output** (narrative templates), **validation scaffolding** (test vectors for most scenarios), and **minor data model clarifications**. These are the final mile, not a fundamental flaw. The fix-it aspects are targeted and scoped: each should require 1-2 loop iterations to complete.

**Convergence status**: NOT CONVERGED. No `status/converged.txt` written.
