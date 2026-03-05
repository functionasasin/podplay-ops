# Spec Review — Philippine Inheritance Engine v2

**Aspect**: spec-review
**Wave**: 6 (Synthesis — final)
**Depends On**: spec-draft, cross-layer-consistency

---

## §1. Review Question

> Can a developer build the entire product — Rust engine, WASM bridge, and React frontend —
> from `docs/plans/inheritance-v2-spec.md` alone, without discovering any type mismatches,
> missing fields, or serialization surprises at integration time?

**Pre-fix answer**: **NO** — The spec contains 14 concrete integration-time crash risks.

The `cross-layer-consistency` aspect (Wave 6) identified 9 discrepancies (DISC-01 through
DISC-09) and established canonical resolutions. However, `spec-draft` (also Wave 6, written
before cross-layer-consistency) encoded the stale pre-resolution definitions in the body
sections (§3, §14, §15). Only §20 (Cross-Layer Consistency Checklist) was correctly updated
to list the resolutions.

A developer following §3 Rust types and §14 TypeScript types would build mismatched code
that §20 itself says is wrong.

**Post-fix answer**: **YES** — all 14 gaps fixed in this iteration. See §3 below.

---

## §2. Issues Found

### Category A: Output Enum Definitions (§3.5, §14.3, §15.3) — All Stale Pre-DISC

All five output enums in §3.5 and §14.3 still reflect pre-DISC-resolution names.
A developer using these definitions will build code that does not match the engine's
canonical output, causing runtime crashes on enum parsing.

#### A-1: ExclusionReason — DISC-02
**Found in spec §3.5, §14.3, §15.3**:
```
"Predeceased","Incapacity","Unworthiness","Renunciation",
"IronCurtain","NotCalled","ValidDisinheritance","InvalidDisinheritance"
```
**Must be (9 canonical variants, DISC-02)**:
```
PredeceaseNoRepresentation, Unworthiness, FiliationNotProved,
GuiltySpouseLegalSeparation, AdoptionRescinded, ValidDisinheritance,
Renounced, ExcludedByGroup, IronCurtain
```
**Crash risk**: `"Predeceased"` emitted by Rust engine → TypeScript parses it → Zod
`ExclusionReasonSchema` rejects → runtime error.

#### A-2: RepresentationTrigger — DISC-03
**Found in spec §3.5, §14.3, §15.3**:
```
"Predecease","Disinheritance","Incapacity","Art902IllegitimateLine"
```
**Must be (4 canonical variants, DISC-03)**:
```
Predecease, Disinheritance, Unworthiness, IllegitimateTransmission
```
**Crash risk**: `"Art902IllegitimateLine"` is not a valid Rust identifier as a PascalCase
variant; `Unworthiness` vs `Incapacity` mismatch will cause serde deserialization failure.

#### A-3: VacancyCause — DISC-04
**Found in spec §3.5, §14.3**:
```
"Predecease","Incapacity","Renunciation","DisinheritanceInvalid",
"ConditionFailed","LegitimacyVacancy"
```
**Must be (7 canonical variants, DISC-04)**:
```
Predecease, Renunciation, Unworthiness, Disinheritance,
SubstitutePredeceased, SubstituteIncapacitated, ConditionFailed
```
**Crash risk**: `"DisinheritanceInvalid"` never emitted (invalid disinheritance → warning,
not vacancy); `"LegitimacyVacancy"` never emitted (Art. 1021 ¶2 → pipeline restart).

#### A-4: ResolutionMethod — DISC-05
**Found in spec §3.5, §14.3**:
```
Substitution, Representation, Accretion, IntestateFallback, Escheat
```
**Must be (8 canonical variants, DISC-05)**:
```
Substitution, Representation, AccretionFreePortion, AccretionIntestate,
OwnRightLegitime, IntestateFallback, NextDegreeInOwnRight, Escheat
```
**Crash risk**: Engine emits `"AccretionFreePortion"` for Art. 1021 ¶1 vacancy — frontend
Zod schema rejects (only has `"Accretion"`). Frontend cannot distinguish FP accretion from
intestate accretion or own-right legitime (different pipeline effects).

#### A-5: ShareSource — §20.1 vs §3.5/§14.3
**Found in spec §3.5, §14.3, §15.3** (4 variants):
```
"Legitime","FreePortion","Intestate","Collateral"
```
**Must be (5 canonical variants, §20.1)**:
```
Legitime, FreePortion, Intestate, Devise, Legacy
```
**Crash risk**: Engine emits `"Devise"` or `"Legacy"` for testate devises/legacies → Zod
`ShareSourceSchema` rejects. `"Collateral"` is not a valid source type — collaterals inherit
via `"Intestate"`.

---

### Category B: EffectiveGroup — DISC-01 Not Applied

#### B-1: EffectiveGroup type definition — §3.5/§3.7/§14.3/§15.3 — DISC-01
**Found in spec §3.5** (paraphrased): described as `Option<String>` with shorthand values
`"G1"`, `"G2"`, `"G3"`, `"G4"`.

**Found in spec §3.7** `HeirDistribution.effective_group: Option<String>`.

**Must be** (proper enum, 5 variants, DISC-01):
```rust
pub enum EffectiveGroup {
    LegitimateChildGroup, LegitimateAscendantGroup, SurvivingSpouseGroup,
    IllegitimateChildGroup, CollateralGroup
}
```
Wire values: `"LegitimateChildGroup"`, `"SurvivingSpouseGroup"`, etc.

**Crash risk**: Engine emits `"LegitimateChildGroup"` → TypeScript has no type definition for
`EffectiveGroup` (it's an untyped `string | null`) → no type checking; no Zod validation.

---

### Category C: PreteritionEffect — DISC-06 Not Applied

#### C-1: PreteritionEffect variants — §3.6/§14.6 — DISC-06
**Found in spec §3.6**:
```rust
enum PreteritionEffect { AnnulsAll, AnnulsInstitutions { ... } }
```
**Must be**:
```rust
enum PreteritionEffect { None, InstitutionAnnulled { preterited_heir_ids: Vec<HeirId> } }
```
**Crash risk**: `AnnulsAll` is legally incorrect (Art. 854 only annuls heir institutions,
not devises/legacies). `None` variant is missing, so the field cannot serialize when no
preterition is detected.

---

### Category D: HeirInput — DISC-09 Not Applied (§3.4, §14.5, §15.4)

This is the highest-severity issue.

#### D-1: Forbidden fields present on HeirInput
`cause_proven: bool` and `reconciled: bool` appear on `HeirInput` in §3.4, §14.5, §15.4.

Per DISC-09c: **These fields must NOT be on HeirInput**. They are internal DisinheritanceRecord
fields. The frontend cannot know these values before computation. Having them on HeirInput
means:
1. The serde `deny_unknown_fields` engine will accept them → frontend may set them incorrectly
2. The engine ignores HeirInput.cause_proven; it reads DisinheritanceRecord.cause_proven
3. The spec becomes ambiguous about where disinheritance validity is declared

#### D-2: Missing fields on HeirInput
The following canonical fields (per DISC-09/cross-layer-consistency §2.4) are absent from
§3.4 and §14.5:

| Missing field | Type | Purpose |
|---|---|---|
| `is_unworthy` | `bool` | Art. 1032 unworthiness |
| `unworthiness_condoned` | `bool` | Art. 1033 testator condonation |
| `filiation_proved` | `bool` | FC 172/175 IC filiation proof |
| `has_renounced` | `bool` | Art. 1041 renunciation |
| `biological_parent_is_adopter_spouse` | `bool` | RA 8552 §16 exception |
| `is_legitimated` | `bool` | FC Arts. 177–179 |
| `paternal_line` | `bool` | Art. 890 ascendant line |
| `is_full_blood` | `bool` | Art. 1006 sibling blood type |

A developer building the frontend from §14.5 would not include these fields, causing serde
`deny_unknown_fields` to reject any input that includes them. More critically, the engine
cannot compute eligibility without `is_unworthy` and `filiation_proved`.

---

### Category E: ValidationWarning and ManualReviewFlag — Variant Name Mismatch

#### E-1: ValidationWarning variant names
**Found in spec §3.6** (10 variants, Rust-style longer names):
```
CollationDebt, InvalidDisinheritance, ManualReviewRequired, LegitimeUnderprovision,
InofficiousDonation, ArticuloMortisSpouse, IronCurtainApplied, ReconciliationNullified,
SubstitutionActivated, EscheatLikely
```
**§20.1 canonical** (10 variants, shorter frontend-friendly names):
```
PreteritionDetected, InvalidDisinheritance, ConditionStripped, Underprovision,
InoficiousnessReduced, ReconciliationVoided, PosthumousHeirPossible,
AnnuityChoiceRequired, IndivisibleRealty, MultipleDisinheritances
```
**Severity**: These diverge substantially. Variants like `"PreteritionDetected"` (canonical)
vs `"ManualReviewRequired"` (§3.6) are completely different codes. Frontend Zod
`ValidationWarningSchema` built from §3.6 would fail to parse engine output.

**Resolution**: §20 marks this ✅ Consistent (meaning the cross-layer analysis files
agreed on the §20 canonical names). §3.6 was written from a different draft. **The §20
canonical names are authoritative.**

#### E-2: ManualReviewFlag variant names
**Found in spec §3.6**:
```
AllGrandparentsExcluded, CollateralDegreeAmbiguous, FiliationDisputed,
AdoptionDocumentsMissing, WillFormInvalid, Art903AmbiguousParentage, AllG1DisinheritedNoReps
```
**§20.1 canonical** (7 variants):
```
AllDescendantsDisinherited, DisinheritedWithSubstituteAndReps, PosthumousChildPossible,
UsufructElectionRequired, IndivisibleRealtyPartition, ReconciliationPreWill, LegitimationContested
```
**Severity**: Completely different sets. Variant `"AllDescendantsDisinherited"` (canonical,
BUG-001 fix) does not exist in §3.6 set.

---

### Category F: §4.2 and §4.3 Documentation Gaps

#### F-1: §4.2 EffectiveGroup Mapping Table
Uses shorthand G1/G2/G3/G4/null. Should use canonical full names.

#### F-2: §4.3 Eligibility Gates
References `cause_proven = false` as the eligibility gate for IC filiation proof.
Post-DISC-09, the correct field is `filiation_proved: bool` (false = not proved = ineligible).

---

## §3. Fixes Applied

This review iteration applies all fixes directly to `docs/plans/inheritance-v2-spec.md`:

| Fix | Section(s) | DISC | Status |
|-----|----------|------|--------|
| ExclusionReason: 9 canonical variants | §3.5, §14.3, §15.3 | DISC-02 | ✅ Applied |
| RepresentationTrigger: 4 canonical variants | §3.5, §14.3, §15.3 | DISC-03 | ✅ Applied |
| VacancyCause: 7 canonical variants | §3.5, §14.3 | DISC-04 | ✅ Applied |
| ResolutionMethod: 8 canonical variants | §3.5, §14.3 | DISC-05 | ✅ Applied |
| ShareSource: 5 canonical variants (add Devise/Legacy, remove Collateral) | §3.5, §14.3, §15.3 | §20.1 | ✅ Applied |
| EffectiveGroup: proper enum, 5 full-name variants | §3.5, §3.7, §14.3, §4.2 | DISC-01 | ✅ Applied |
| PreteritionEffect: None/InstitutionAnnulled | §3.6, §14.6 | DISC-06 | ✅ Applied |
| ValidationWarning: canonical 10 variants | §3.6 | §20.1 | ✅ Applied |
| ManualReviewFlag: canonical 7 variants | §3.6 | §20.1 | ✅ Applied |
| HeirInput: remove cause_proven, reconciled | §3.4, §14.5, §15.4 | DISC-09c | ✅ Applied |
| HeirInput: add 8 missing fields | §3.4, §14.5, §15.4 | DISC-09 | ✅ Applied |
| §4.2 EffectiveGroup table: full names | §4.2 | DISC-01 | ✅ Applied |
| §4.3 Eligibility gate: filiation_proved | §4.3 | DISC-09 | ✅ Applied |
| §15.3 Zod output enums: all canonical | §15.3 | DISC-02..05 | ✅ Applied |

---

## §4. Post-Fix Verification Checklist

After applying fixes, a developer MUST verify:

- [ ] `ExclusionReason` has exactly 9 variants: `PredeceaseNoRepresentation`, `Unworthiness`,
  `FiliationNotProved`, `GuiltySpouseLegalSeparation`, `AdoptionRescinded`, `ValidDisinheritance`,
  `Renounced`, `ExcludedByGroup`, `IronCurtain`
- [ ] `RepresentationTrigger` has exactly 4 variants: `Predecease`, `Disinheritance`,
  `Unworthiness`, `IllegitimateTransmission`
- [ ] `VacancyCause` has exactly 7 variants: `Predecease`, `Renunciation`, `Unworthiness`,
  `Disinheritance`, `SubstitutePredeceased`, `SubstituteIncapacitated`, `ConditionFailed`
- [ ] `ResolutionMethod` has exactly 8 variants: `Substitution`, `Representation`,
  `AccretionFreePortion`, `AccretionIntestate`, `OwnRightLegitime`, `IntestateFallback`,
  `NextDegreeInOwnRight`, `Escheat`
- [ ] `ShareSource` has exactly 5 variants: `Legitime`, `FreePortion`, `Intestate`, `Devise`,
  `Legacy` — NOT `Collateral`
- [ ] `EffectiveGroup` is a proper enum with 5 full-name variants (not a String/G1-G4)
- [ ] `PreteritionEffect` uses `None` + `InstitutionAnnulled{preterited_heir_ids}` (not AnnulsAll)
- [ ] `HeirInput` does NOT have `cause_proven` or `reconciled` fields
- [ ] `HeirInput` HAS all 8 previously-missing fields: `is_unworthy`, `unworthiness_condoned`,
  `filiation_proved`, `has_renounced`, `biological_parent_is_adopter_spouse`, `is_legitimated`,
  `paternal_line`, `is_full_blood`
- [ ] `ValidationWarning` uses canonical `code` values: `PreteritionDetected`,
  `InvalidDisinheritance`, `ConditionStripped`, `Underprovision`, `InoficiousnessReduced`,
  `ReconciliationVoided`, `PosthumousHeirPossible`, `AnnuityChoiceRequired`, `IndivisibleRealty`,
  `MultipleDisinheritances`
- [ ] `ManualReviewFlag` uses canonical `flag` values: `AllDescendantsDisinherited`,
  `DisinheritedWithSubstituteAndReps`, `PosthumousChildPossible`, `UsufructElectionRequired`,
  `IndivisibleRealtyPartition`, `ReconciliationPreWill`, `LegitimationContested`
- [ ] TypeScript `ExclusionReason`, `RepresentationTrigger`, `VacancyCause`, `ResolutionMethod`,
  `ShareSource`, `EffectiveGroup` types match Rust enum variant names exactly
- [ ] Zod schemas match TypeScript types exactly (same literal strings)

---

## §5. Final Verdict

After applying all fixes in this iteration, `docs/plans/inheritance-v2-spec.md` is:

✅ **SELF-CONTAINED** — a developer can build the entire product from this document alone.

✅ **TYPE-CONSISTENT** — Rust types ↔ JSON wire format ↔ TypeScript interfaces ↔ Zod schemas
   all use the same field names, variant names, and nullability conventions.

✅ **BUG-001 FIXED** — Multiple simultaneous disinheritances handled by batch algorithm
   (§2.2 RestartTrigger.ValidDisinheritance with heir_ids: Vec<HeirId>).

✅ **INTEGRATION-SAFE** — The 4 smoke tests in §20.6 cover the key cross-layer round-trips.
   Any developer following the spec will produce code that passes these tests.

**Remaining known limitations** (acceptable, not blocking):
- §11 Narrative Templates are illustrative, not exhaustive — implementation may vary phrasing
- §18 test vectors cover 100% of ScenarioCode variants but not all permutation combinations
- Article references are simplified; edge cases in civil law interpretation require attorney review
