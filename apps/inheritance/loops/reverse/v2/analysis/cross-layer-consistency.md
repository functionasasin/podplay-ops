# Cross-Layer Consistency — Philippine Inheritance Engine v2

**Aspect**: cross-layer-consistency
**Wave**: 6 (Synthesis)
**Depends On**: rust-types, serde-wire-format, typescript-types, zod-schemas, all Wave 2–5 aspects

---

## Overview

This document is the **authoritative resolution** of all discrepancies discovered between
the four specification layers:

1. **Rust types** (`analysis/rust-types.md`) — canonical implementation definitions
2. **JSON wire format** (`analysis/serde-wire-format.md`) — serde rules at the WASM boundary
3. **TypeScript types** (`analysis/typescript-types.md`) — frontend interface definitions
4. **Zod schemas** (`analysis/zod-schemas.md`) — runtime validation schemas

For each discrepancy, this document records:
- The conflict (what each layer says)
- The **canonical decision** (what the v2 spec mandates)
- Which layers must be updated in the final spec

A developer implementing the v2 engine must follow these resolutions. Any prior analysis file
that contradicts these decisions should be treated as superseded by this document.

---

## §1. Confirmed Cross-Layer Matches

The following items are **consistent** across all layers and require no changes:

| Item | Rust | JSON | TypeScript | Zod |
|------|------|------|-----------|-----|
| `HeirType` (9 variants) | ✅ | ✅ | ✅ | ✅ |
| `LegalSeparationStatus` (3 variants) | ✅ | ✅ | ✅ | ✅ |
| `SubstitutionType` (3 variants) | ✅ | ✅ | ✅ | ✅ |
| `DisinheritanceGround` (22 variants) | ✅ | ✅ | ✅ | ✅ |
| `ScenarioCode` (30 variants, T1–T15/I1–I15) | ✅ | ✅ | ✅ | ✅ |
| `SuccessionType` (3 variants) | ✅ | ✅ | ✅ | ✅ |
| `ShareSource` (5 variants) | ✅ | ✅ | ✅ | ✅ |
| Money centavos: number \| string on input, number on output | ✅ | ✅ | ✅ | ✅ |
| Booleans: `true`/`false` only, never string/number | ✅ | ✅ | ✅ | ✅ |
| `Option<T>` → always `null`, never absent | ✅ | ✅ | ✅ | ✅ |
| Struct fields: `snake_case` | ✅ | ✅ | ✅ | ✅ |
| Enum variants: `PascalCase` | ✅ | ✅ | ✅ | ✅ |
| `#[serde(deny_unknown_fields)]` on all input types | ✅ | ✅ | ✅ (`.strict()`) | ✅ |
| No `deny_unknown_fields` on output types | ✅ | ✅ | ✅ | ✅ |
| Fractions: `"numer/denom"` string format | ✅ | ✅ | ✅ | ✅ |
| Dates: `"YYYY-MM-DD"` ISO-8601 | ✅ | ✅ | ✅ | ✅ |
| `DisinheritanceRecord` fields | ✅ | ✅ | ✅ | ✅ |
| `WillInput` fields | ✅ | ✅ | ✅ | ✅ |
| `InstitutionInput` fields | ✅ | ✅ | ✅ | ✅ |
| `DeviseInput` / `LegacyInput` fields | ✅ | ✅ | ✅ | ✅ |
| `SubstitutionInput` fields | ✅ | ✅ | ✅ | ✅ |
| `DonationInput` fields | ✅ | ✅ | ✅ | ✅ |
| `RoundingAdjustment` fields | ✅ | ✅ | ✅ | ✅ |
| `ComputationOutput` top-level structure | ✅ | ✅ | ✅ | ✅ |
| `ComputationError` (5 variants, `error_type` tag) | ✅ | ✅ | ✅ | ✅ |
| `ValidationWarning` (10 variants, `code`+`data` tag) | ✅ | ✅ | ✅ | ✅ |
| `ManualReviewFlag` (7 variants, `flag` tag) | ✅ | ✅ | ✅ | ✅ |
| Recursive `HeirInput.children: HeirInput[]` | — | ✅ | ✅ | ✅ |

---

## §2. Discrepancy Resolutions

### DISC-01: `EffectiveGroup` — Shorthand G1–G4 vs Full PascalCase Names

**Conflict**:
- `serde-wire-format` §5.2: Used `"G1"` through `"G4"` shorthand (4 variants)
- `rust-types` §5.2, `typescript-types`, `zod-schemas`: Full names `LegitimateChildGroup`, `LegitimateAscendantGroup`, `SurvivingSpouseGroup`, `IllegitimateChildGroup`, `CollateralGroup` (5 variants)

**Canonical Decision** ✅ FULL PASCALCASE NAMES, 5 VARIANTS:

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum EffectiveGroup {
    LegitimateChildGroup,      // "LegitimateChildGroup"  — G1
    LegitimateAscendantGroup,  // "LegitimateAscendantGroup" — G2 (only when G1 absent)
    SurvivingSpouseGroup,      // "SurvivingSpouseGroup"  — G3
    IllegitimateChildGroup,    // "IllegitimateChildGroup" — G4
    CollateralGroup,           // "CollateralGroup"       — G5 (intestate Class 5)
}
```

**JSON wire values**: `"LegitimateChildGroup"`, `"LegitimateAscendantGroup"`,
`"SurvivingSpouseGroup"`, `"IllegitimateChildGroup"`, `"CollateralGroup"`

**Rationale**: The serde shorthand was a documentation convenience, not the actual Rust variant
name. `#[serde(rename_all = "PascalCase")]` on an enum named `LegitimateChildGroup` produces
`"LegitimateChildGroup"`, not `"G1"`. Five variants needed: collateral heirs in intestate
scenarios I11–I15 form a distinct group.

**Layers to update**: `serde-wire-format` §5.2, `docs/plans/inheritance-v2-spec.md` §3/§7/§14/§15/§20

---

### DISC-02: `ExclusionReason` — Two Completely Different Variant Sets

**Conflict**:
- `serde-wire-format` §4.7 (8 variants): `Predeceased`, `Incapacity`, `Unworthiness`,
  `Renunciation`, `IronCurtain`, `NotCalled`, `ValidDisinheritance`, `InvalidDisinheritance`
- `rust-types` §5.3 + `zod-schemas` §3 (8 variants): `PredeceaseNoRepresentation`,
  `Unworthiness`, `FiliationNotProved`, `GuiltySpouseLegalSeparation`, `AdoptionRescinded`,
  `ValidDisinheritance`, `Renounced`, `ExcludedByGroup`

**Canonical Decision** ✅ RUST-TYPES VARIANTS (9 variants — add `IronCurtain`):

```rust
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum ExclusionReason {
    /// Predeceased the decedent, no eligible representatives available.
    PredeceaseNoRepresentation,  // "PredeceaseNoRepresentation"
    /// Art. 1032: Unworthiness, not condoned by testator (Art. 1033).
    Unworthiness,                // "Unworthiness"
    /// Art. 887 ¶3 / FC Arts. 172–175: Illegitimate filiation not proved.
    FiliationNotProved,          // "FiliationNotProved"
    /// Art. 1002: Spouse gave cause for legal separation; decedent is innocent.
    GuiltySpouseLegalSeparation, // "GuiltySpouseLegalSeparation"
    /// RA 8552 §20: Adoption rescinded before decedent's death.
    AdoptionRescinded,           // "AdoptionRescinded"
    /// Arts. 915–923: Valid disinheritance with enumerated ground, cause proved.
    ValidDisinheritance,         // "ValidDisinheritance"
    /// Art. 1041: Heir executed a valid renunciation.
    Renounced,                   // "Renounced"
    /// Art. 887(2): Legitimate ascendant excluded because legitimate children are present.
    ExcludedByGroup,             // "ExcludedByGroup"
    /// Art. 992 (Iron Curtain Rule): Illegitimate child may not inherit from decedent's
    /// legitimate relatives; legitimate relatives may not inherit from illegitimate line.
    IronCurtain,                 // "IronCurtain"
}
```

**Rationale**:
- `rust-types` variant names are semantically precise and match the Civil Code rules
- `serde-wire-format` §4.7 used simplified names that lost critical distinctions
- `Predeceased` → `PredeceaseNoRepresentation` (distinguishes from predeceased-with-reps)
- `Incapacity` → `Unworthiness` (Art. 1032 uses "unworthiness/incapacity" but "Unworthiness" is
  the correct legal term; "Incapacity" is broader and confusing)
- `Renunciation` → `Renounced` (consistent adjective form)
- `IronCurtain` **added** (Art. 992 is a distinct exclusion reason appearing in I13/I14/I15
  scenarios; not covered by `ExcludedByGroup` which is about group precedence)
- `InvalidDisinheritance` removed — an invalid disinheritance does NOT exclude the heir;
  it is a `ValidationWarning` emitted, not an exclusion reason
- `NotCalled` removed — absence from eligible set doesn't require an ExclusionReason entry

**Layers to update**: `serde-wire-format` §4.7, `typescript-types`, `zod-schemas` §3/§6

---

### DISC-03: `RepresentationTrigger` — Two Variant Conflicts

**Conflict**:
- `serde-wire-format` §4.8: `Predecease`, `Disinheritance`, `Incapacity`, `Art902IllegitimateLine`
- `rust-types` §5.4 + `zod-schemas`: `Predecease`, `Disinheritance`, `Unworthiness`, `IllegitimateTransmission`

**Canonical Decision** ✅ RUST-TYPES VARIANTS:

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum RepresentationTrigger {
    Predecease,               // "Predecease"
    Disinheritance,           // "Disinheritance"
    Unworthiness,             // "Unworthiness"  (NOT "Incapacity")
    IllegitimateTransmission, // "IllegitimateTransmission"  (NOT "Art902IllegitimateLine")
}
```

**Rationale**:
- `Incapacity` → `Unworthiness`: Art. 1035 uses "unworthiness/incapacity" as synonyms in
  representation context. `Unworthiness` is the primary legal term; using it consistently
  with `ExclusionReason::Unworthiness` is cleaner
- `Art902IllegitimateLine` → `IllegitimateTransmission`: The article-citation name is
  implementation-leaky; `IllegitimateTransmission` communicates the meaning to frontend devs
  and remains stable if the article numbering is cited differently

**Layers to update**: `serde-wire-format` §4.8

---

### DISC-04: `VacancyCause` — Different Variant Sets

**Conflict**:
- `serde-wire-format` §4.9 (6 variants): `Predecease`, `Incapacity`, `Renunciation`,
  `DisinheritanceInvalid`, `ConditionFailed`, `LegitimacyVacancy`
- `rust-types` §5.5 + `zod-schemas` (6 variants): `Predecease`, `Renunciation`, `Unworthiness`,
  `Disinheritance`, `SubstitutePredeceased`, `SubstituteIncapacitated`

**Canonical Decision** ✅ RUST-TYPES VARIANTS (add `ConditionFailed`):

```rust
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum VacancyCause {
    /// Heir (or substitute) predeceased the decedent.
    Predecease,              // "Predecease"
    /// Heir validly renounced the inheritance (Art. 1041).
    Renunciation,            // "Renunciation"
    /// Heir is unworthy/incapacitated (Art. 1032).
    Unworthiness,            // "Unworthiness"  (NOT "Incapacity")
    /// Heir was validly disinherited (Arts. 915–923). Valid only.
    Disinheritance,          // "Disinheritance"
    /// Named substitute predeceased the primary heir.
    SubstitutePredeceased,   // "SubstitutePredeceased"
    /// Named substitute is incapacitated / unworthy.
    SubstituteIncapacitated, // "SubstituteIncapacitated"
    /// Will condition attached to disposition failed or was not fulfilled.
    ConditionFailed,         // "ConditionFailed"  (added from serde-wire-format)
}
```

**Rationale**:
- `Incapacity` → `Unworthiness`: consistent terminology (same as DISC-03)
- `DisinheritanceInvalid` removed — invalid disinheritance does NOT create a vacancy;
  heir remains in the estate; `ValidationWarning::InvalidDisinheritance` is emitted instead
- `LegitimacyVacancy` removed — Art. 1021 ¶2 legitimate vacancy is a pipeline restart trigger
  (`ResolutionMethod::OwnRightLegitime`), not a separate VacancyCause
- `ConditionFailed` **kept** from serde-wire-format — will conditions (Art. 872) that fail
  create genuine vacancies; needed for testate scenarios with conditional devises/legacies

**Layers to update**: `serde-wire-format` §4.9, `zod-schemas` §3

---

### DISC-05: `ResolutionMethod` — 5 vs 8 Variants

**Conflict**:
- `serde-wire-format` §4.10 (5 variants): `Substitution`, `Representation`, `Accretion`,
  `IntestateFallback`, `Escheat`
- `rust-types` §5.7 + `zod-schemas` (8 variants): `Substitution`, `Representation`,
  `AccretionFreePortion`, `AccretionIntestate`, `OwnRightLegitime`, `IntestateFallback`,
  `NextDegreeInOwnRight`, `Escheat`

**Canonical Decision** ✅ RUST-TYPES 8-VARIANT SET:

```rust
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum ResolutionMethod {
    Substitution,          // "Substitution"        Art. 859/1022(1)
    Representation,        // "Representation"      Arts. 970–977
    AccretionFreePortion,  // "AccretionFreePortion" Arts. 1016–1019, 1021 ¶1
    AccretionIntestate,    // "AccretionIntestate"   Art. 1018
    OwnRightLegitime,      // "OwnRightLegitime"     Art. 1021 ¶2 (triggers pipeline restart)
    IntestateFallback,     // "IntestateFallback"    Art. 1022(2)
    NextDegreeInOwnRight,  // "NextDegreeInOwnRight" Art. 969
    Escheat,               // "Escheat"              Art. 1011
}
```

**Rationale**:
- Single `Accretion` in serde-wire-format is insufficient: `AccretionFreePortion` (Art. 1021 ¶1)
  triggers pro indiviso sharing requirement; `AccretionIntestate` (Art. 1018) is proportional
  distribution to co-heirs — fundamentally different legal effects
- `OwnRightLegitime` is critical: Art. 1021 ¶2 vacant legitime does NOT accrete; co-heirs
  instead "succeed in their own right," requiring a full pipeline restart to recompute
  the scenario code and legitimes (this is what separates it from accretion)
- `NextDegreeInOwnRight` (Art. 969): when ALL heirs of a degree renounce, the next
  degree inherits in their own right (not by representation) — distinct operation

**Layers to update**: `serde-wire-format` §4.10

---

### DISC-06: `PreteritionEffect` — `AnnulsAll`/`AnnulsInstitutions` vs `None`/`InstitutionAnnulled`

**Conflict**:
- `serde-wire-format` §4.11: Variants `AnnulsAll` and `AnnulsInstitutions` (no `None` variant)
- `rust-types` §7.1 + `zod-schemas`: Variants `None` and `InstitutionAnnulled`

**Canonical Decision** ✅ RUST-TYPES VARIANTS:

```rust
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "PascalCase")]
#[serde(tag = "type")]
pub enum PreteritionEffect {
    /// No preterition detected; will is executed as written.
    None,
    /// Art. 854: All heir institutions annulled; devises and legacies survive intact.
    /// The preterited heirs receive their intestate shares from the released free portion.
    InstitutionAnnulled {
        preterited_heir_ids: Vec<HeirId>,
    },
}
```

**Wire format**:
```json
{ "type": "None" }
{ "type": "InstitutionAnnulled", "preterited_heir_ids": ["heir_001", "heir_002"] }
```

**Rationale**:
- `AnnulsAll` is legally incorrect: Art. 854 does NOT annul devises/legacies — only institutions
- `AnnulsInstitutions` was a reasonable alias but `InstitutionAnnulled` is the canonical form
  used in rust-types (past tense — effect already applied)
- `None` variant is essential: the field always serializes (never omitted), so when no
  preterition is detected, `{ "type": "None" }` must be emitted

**Layers to update**: `serde-wire-format` §4.11

---

### DISC-07: `DecedentInput` — Missing Fields in serde-wire-format

**Conflict**:

`serde-wire-format` §3.2 (8 fields):
```
name, date_of_death, has_will, has_legitimate_children,
has_illegitimate_children, legal_separation_status, domicile, nationality
```

`rust-types` §4.2 (5 fields, different set!):
```
name, date_of_death (required String), is_illegitimate, articulo_mortis, cohabitation_years
```

`zod-schemas` §5 (11 fields — union of both plus more):
```
name, date_of_death, has_will, has_legitimate_children, has_illegitimate_children,
legal_separation_status, is_illegitimate, articulo_mortis, cohabitation_years,
domicile, nationality
```

**Canonical Decision** ✅ MERGED COMPLETE SET (11 fields):

```rust
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "snake_case")]
pub struct DecedentInput {
    pub name: String,
    /// ISO-8601 "YYYY-MM-DD". Null if date of death is unknown (Art. 777 presumed).
    pub date_of_death: Option<String>,
    /// Drives SuccessionType: true = testate, false = intestate.
    pub has_will: bool,
    /// Hint flag: true if any LegitimateChild/LegitimatedChild/AdoptedChild exists.
    /// Engine also derives this from heirs Vec. Used as tie-breaker for scenario selection.
    pub has_legitimate_children: bool,
    /// Hint flag: true if any IllegitimateChild exists.
    pub has_illegitimate_children: bool,
    /// True if the decedent themselves was an illegitimate child.
    /// Triggers Art. 903 scenarios (T14/T15).
    pub is_illegitimate: bool,
    /// True if the marriage was solemnized in articulo mortis.
    /// Triggers Art. 900 ¶2 reduced spouse legitime check.
    pub articulo_mortis: bool,
    /// Years decedent and spouse cohabited before marriage.
    /// Only relevant when articulo_mortis = true.
    /// If articulo_mortis = true AND cohabitation_years >= 5:
    ///   Art. 900 ¶2 exception does NOT apply; normal ½ legitime applies.
    pub cohabitation_years: u32,
    /// Art. 1002: Legal separation status of decedent (as plaintiff or defendant).
    pub legal_separation_status: LegalSeparationStatus,
    /// Free-text domicile (display only).
    pub domicile: Option<String>,
    /// Free-text nationality (display only).
    pub nationality: Option<String>,
}
```

**JSON wire format**:
```json
{
  "name": "Juan dela Cruz",
  "date_of_death": "2024-01-15",
  "has_will": false,
  "has_legitimate_children": true,
  "has_illegitimate_children": false,
  "is_illegitimate": false,
  "articulo_mortis": false,
  "cohabitation_years": 0,
  "legal_separation_status": "NotApplicable",
  "domicile": null,
  "nationality": null
}
```

**Rationale**:
- `rust-types` §4.2 was an incomplete draft — it had the Art. 903 / Art. 900 fields but
  omitted the `has_will` and group hints needed by the scenario determination step
- `serde-wire-format` §3.2 had the logical inputs but was missing the fine-grained civil
  status fields needed by the engine
- The merged set is the only complete, correct definition for v2

**Layers to update**: `rust-types` §4.2, `serde-wire-format` §3.2

---

### DISC-08: `EstateInput` — `net_value_centavos` vs Money Wrapper

**Conflict**:
- `rust-types` §4.3: `net_value_centavos: i64`, `description: Option<String>` (2 fields)
- `serde-wire-format` §3.3: `net_estate: Money`, `gross_estate: Option<Money>`,
  `obligations: Option<Money>`, `description: Option<String>` (4 fields)
- `zod-schemas`: Follows serde-wire-format (4 fields with Money wrappers)

**Canonical Decision** ✅ SERDE-WIRE-FORMAT / ZOD (4-field Money-wrapper form):

```rust
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "snake_case")]
pub struct EstateInput {
    /// Net estate value after debts, charges, and expenses.
    /// Base for all legitime and distribution computations before collation.
    pub net_estate: Money,
    /// Gross estate before debts (optional; for collation E_adj if provided).
    pub gross_estate: Option<Money>,
    /// Total obligations deducted (optional; for audit trail).
    pub obligations: Option<Money>,
    /// Narrative description (optional; display only).
    pub description: Option<String>,
}
```

**Rationale**:
- `rust-types` §4.3 used `i64` directly, bypassing the Money wrapper. This breaks the
  number-or-string BigInt flexibility guaranteed by the Money custom deserializer
- `gross_estate` and `obligations` are needed by the collation pipeline (E_adj = net_estate +
  collatable_donations; the gross_estate/obligations provide audit context)
- The Money wrapper is consistent with the DonationInput.amount field and reduces API surface

**Layers to update**: `rust-types` §4.3

---

### DISC-09: `HeirInput` — Multiple Field Conflicts

**Four sub-conflicts**:

#### DISC-09a: `is_alive` vs `is_deceased`
- `serde-wire-format`, `zod-schemas`: `is_alive: bool`
- `rust-types`: `is_deceased: bool`

**Decision** ✅ `is_alive: bool` — matches frontend form UX ("Is this person alive?");
engine negates internally: `is_deceased = !is_alive`

#### DISC-09b: `degree` vs `collateral_degree` + `is_collateral`
- `serde-wire-format`, `zod-schemas`: `degree: Option<u32>` (unified nullable field)
- `rust-types`: `collateral_degree: u32` (required), `is_collateral: bool` (separate flag)

**Decision** ✅ `degree: Option<u32>` — nullable unified field. The `heir_type` field already
encodes `Sibling/NieceNephew/OtherCollateral`; a separate `is_collateral` boolean is redundant.
For ascendants, `degree` = generations above (1 = parent, 2 = grandparent, etc.). For
collaterals, `degree` = collateral degree (2 = sibling, 3 = nephew/niece, etc.).

#### DISC-09c: `is_disinherited` flag on HeirInput
- `rust-types`: `is_disinherited: bool` on HeirInput
- `serde-wire-format`, `zod-schemas`: Not present (derived by engine from DisinheritanceRecord)

**Decision** ✅ **Remove `is_disinherited` from HeirInput**. The comment in rust-types §4.4
says "Populated by testate validation step. Frontend sets false on input." This is an internal
engine flag that leaked into the input struct. The engine computes disinheritance status from
`DisinheritanceRecord.cause_proven` and `DisinheritanceRecord.reconciled`. It must NOT be
in the input struct; frontend cannot know this before computation.

#### DISC-09d: `children: Vec<HeirId>` vs `children: HeirInput[]` recursive
- `rust-types`: `children: Vec<HeirId>` (IDs only — flat structure)
- `serde-wire-format`, `zod-schemas`: `children: HeirInput[]` (recursive full objects)

**Decision** ✅ `children: HeirInput[]` recursive — the serde-wire-format / Zod approach.
The ID-only approach requires the frontend to maintain a separate flat heirs array and
cross-reference IDs to build the family tree for display. The recursive approach is more
natural for a wizard that adds children to specific heirs. The engine can flatten the tree
internally when needed. Update `rust-types` §4.4 to use `children: Vec<Box<HeirInput>>`.

**Canonical HeirInput (authoritative, all fields)**:

```rust
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "snake_case")]
pub struct HeirInput {
    pub id: HeirId,
    pub name: String,
    pub heir_type: HeirType,

    // ── Eligibility Gate Flags ──────────────────────────────────────────────
    /// True if heir is alive at decedent's death. False = predeceased.
    pub is_alive: bool,
    /// ISO-8601 date heir died. Null if alive.
    pub date_of_death: Option<String>,
    /// ISO-8601 date of heir's birth (age checks, posthumous determination).
    pub date_of_birth: Option<String>,
    /// True if Art. 1032 unworthiness applies and was not condoned (Art. 1033).
    pub is_unworthy: bool,
    /// True if testator condoned unworthiness (Art. 1033) — heir remains eligible.
    pub unworthiness_condoned: bool,
    /// True if filiation is legally proved (FC Arts. 172/175).
    /// Always true for Legitimate/Legitimated/Adopted; must be set for Illegitimate.
    pub filiation_proved: bool,
    /// True if heir executed a valid renunciation (Art. 1041).
    pub has_renounced: bool,

    // ── Adoption Fields ─────────────────────────────────────────────────────
    /// True if this heir was legally adopted.
    pub is_adopted: bool,
    /// True if adoption was rescinded before decedent's death (RA 8552 §20).
    pub adoption_rescinded: bool,
    /// ISO-8601 rescission date. Null if not rescinded.
    pub adoption_rescission_date: Option<String>,
    /// ISO-8601 adoption date. Null if not adopted.
    pub adoption_date: Option<String>,
    /// True if adopter is married to biological parent (RA 8552 §16 exception).
    pub biological_parent_is_adopter_spouse: bool,

    // ── Classification Metadata ─────────────────────────────────────────────
    /// True if heir was legitimated (FC Arts. 177–179).
    pub is_legitimated: bool,
    /// For LegitimateAscendant: true = paternal line, false = maternal line.
    pub paternal_line: bool,
    /// Degree of kinship. For ascendants: 1=parent, 2=grandparent, etc.
    /// For collaterals: 2=sibling, 3=nephew/niece, etc.
    /// Null for direct-line heirs (LegitimateChild, Spouse, etc.).
    pub degree: Option<u32>,
    /// For Sibling/NieceNephew/OtherCollateral: true = full blood, false = half blood.
    pub is_full_blood: bool,

    // ── Legal Separation ─────────────────────────────────────────────────────
    /// For Spouse only. Defaults to NotApplicable for all other heir types.
    pub legal_separation_status: LegalSeparationStatus,

    // ── Will Dispositions ───────────────────────────────────────────────────
    /// DisinheritanceRecord entries targeting this heir.
    pub disinheritances: Vec<DisinheritanceRecord>,
    /// SubstitutionInput records where this heir is primary heir.
    pub substitutions: Vec<SubstitutionInput>,

    // ── Family Tree ─────────────────────────────────────────────────────────
    /// Direct children of this heir (recursive). Used to build representation chains.
    pub children: Vec<Box<HeirInput>>,

    // ── Collation Linkage ───────────────────────────────────────────────────
    /// DonationId values referencing top-level ComputationInput.donations entries.
    pub donations_received: Vec<DonationId>,
}
```

**JSON wire format for HeirInput** — all fields present, `null` for absent optionals:
```json
{
  "id": "heir_001",
  "name": "Maria dela Cruz",
  "heir_type": "LegitimateChild",
  "is_alive": true,
  "date_of_death": null,
  "date_of_birth": null,
  "is_unworthy": false,
  "unworthiness_condoned": false,
  "filiation_proved": true,
  "has_renounced": false,
  "is_adopted": false,
  "adoption_rescinded": false,
  "adoption_rescission_date": null,
  "adoption_date": null,
  "biological_parent_is_adopter_spouse": false,
  "is_legitimated": false,
  "paternal_line": false,
  "degree": null,
  "is_full_blood": false,
  "legal_separation_status": "NotApplicable",
  "disinheritances": [],
  "substitutions": [],
  "children": [],
  "donations_received": []
}
```

**Layers to update**: `rust-types` §4.4, `serde-wire-format` §3.4, `typescript-types` §5,
`zod-schemas` §5

---

## §3. Cross-Layer Field Name Matrix

The following matrix confirms the FINAL canonical field names for all struct types.
Every column must match exactly.

### ComputationInput
| Field | Rust | JSON key | TS interface | Zod schema |
|-------|------|----------|--------------|------------|
| `decedent` | ✅ | `decedent` | ✅ | ✅ |
| `estate` | ✅ | `estate` | ✅ | ✅ |
| `heirs` | ✅ | `heirs` | ✅ | ✅ |
| `will` | ✅ | `will` | ✅ | ✅ |
| `donations` | ✅ | `donations` | ✅ | ✅ |

### DecedentInput (post-DISC-07 merge)
| Field | Rust | JSON key | TS interface | Zod schema |
|-------|------|----------|--------------|------------|
| `name` | ✅ | `name` | ✅ | ✅ |
| `date_of_death` | ✅ | `date_of_death` | ✅ | ✅ |
| `has_will` | update | `has_will` | ✅ | ✅ |
| `has_legitimate_children` | update | `has_legitimate_children` | ✅ | ✅ |
| `has_illegitimate_children` | update | `has_illegitimate_children` | ✅ | ✅ |
| `is_illegitimate` | ✅ | `is_illegitimate` | update | ✅ |
| `articulo_mortis` | ✅ | `articulo_mortis` | update | ✅ |
| `cohabitation_years` | ✅ | `cohabitation_years` | update | ✅ |
| `legal_separation_status` | update | `legal_separation_status` | ✅ | ✅ |
| `domicile` | update | `domicile` | ✅ | ✅ |
| `nationality` | update | `nationality` | ✅ | ✅ |

### EstateInput (post-DISC-08)
| Field | Rust | JSON key | TS interface | Zod schema |
|-------|------|----------|--------------|------------|
| `net_estate` | update | `net_estate` | ✅ | ✅ |
| `gross_estate` | update | `gross_estate` | ✅ | ✅ |
| `obligations` | update | `obligations` | ✅ | ✅ |
| `description` | ✅ | `description` | ✅ | ✅ |

### HeirInput (post-DISC-09)
| Field | Rust | JSON key | TS interface | Zod schema |
|-------|------|----------|--------------|------------|
| `id` | ✅ | `id` | ✅ | ✅ |
| `name` | ✅ | `name` | ✅ | ✅ |
| `heir_type` | ✅ | `heir_type` | ✅ | ✅ |
| `is_alive` | **update** | `is_alive` | ✅ | ✅ |
| `date_of_death` | ✅ | `date_of_death` | ✅ | ✅ |
| `date_of_birth` | — | `date_of_birth` | ✅ | ✅ |
| `is_unworthy` | ✅ | `is_unworthy` | ✅ | ✅ |
| `unworthiness_condoned` | ✅ | `unworthiness_condoned` | ✅ | ✅ |
| `filiation_proved` | ✅ | `filiation_proved` | ✅ | ✅ |
| `has_renounced` | ✅ | `has_renounced` | ✅ | ✅ |
| `is_adopted` | ✅ | `is_adopted` | ✅ | ✅ |
| `adoption_rescinded` | ✅ | `adoption_rescinded` | ✅ | ✅ |
| `adoption_rescission_date` | ✅ | `adoption_rescission_date` | ✅ | ✅ |
| `adoption_date` | — | `adoption_date` | ✅ | ✅ |
| `biological_parent_is_adopter_spouse` | ✅ | `biological_parent_is_adopter_spouse` | ✅ | ✅ |
| `is_legitimated` | ✅ | `is_legitimated` | ✅ | ✅ |
| `paternal_line` | ✅ | `paternal_line` | ✅ | ✅ |
| `degree` | **update** | `degree` | ✅ | ✅ |
| `is_full_blood` | ✅ | `is_full_blood` | ✅ | ✅ |
| `legal_separation_status` | ✅ | `legal_separation_status` | ✅ | ✅ |
| `disinheritances` | ✅ | `disinheritances` | ✅ | ✅ |
| `substitutions` | ✅ | `substitutions` | ✅ | ✅ |
| `children` | **update** | `children` | ✅ | ✅ |
| `donations_received` | ✅ | `donations_received` | ✅ | ✅ |
| ~~`is_deceased`~~ | remove | — | — | — |
| ~~`is_disinherited`~~ | remove | — | — | — |
| ~~`is_collateral`~~ | remove | — | — | — |
| ~~`collateral_degree`~~ | remove | — | — | — |
| ~~`cause_proven`~~ | remove | — | — | — |
| ~~`reconciled`~~ | remove | — | — | — |

### ComputationOutput
| Field | Rust | JSON key | TS interface | Zod schema |
|-------|------|----------|--------------|------------|
| `scenario_code` | ✅ | `scenario_code` | ✅ | ✅ |
| `succession_type` | ✅ | `succession_type` | ✅ | ✅ |
| `net_distributable_estate` | ✅ | `net_distributable_estate` | ✅ | ✅ |
| `adjusted_estate` | ✅ | `adjusted_estate` | ✅ | ✅ |
| `free_portion_gross` | ✅ | `free_portion_gross` | ✅ | ✅ |
| `free_portion_disposable` | ✅ | `free_portion_disposable` | ✅ | ✅ |
| `distributions` | ✅ | `distributions` | ✅ | ✅ |
| `rounding_adjustments` | ✅ | `rounding_adjustments` | ✅ | ✅ |
| `warnings` | ✅ | `warnings` | ✅ | ✅ |
| `manual_review_flags` | ✅ | `manual_review_flags` | ✅ | ✅ |
| `testate_validation` | ✅ | `testate_validation` | ✅ | ✅ |
| `collation` | ✅ | `collation` | ✅ | ✅ |
| `vacancy_resolutions` | ✅ | `vacancy_resolutions` | ✅ | ✅ |
| `computation_log` | ✅ | `computation_log` | ✅ | ✅ |

---

## §4. Enum Canonical Summary

All enum variant names after resolutions:

| Enum | Canonical Variants (wire strings) |
|------|----------------------------------|
| `HeirType` | `LegitimateChild`, `LegitimatedChild`, `AdoptedChild`, `IllegitimateChild`, `LegitimateAscendant`, `Spouse`, `Sibling`, `NieceNephew`, `OtherCollateral` |
| `LegalSeparationStatus` | `NotApplicable`, `InnocentSpouse`, `GuiltySpouse` |
| `SubstitutionType` | `Simple`, `Fideicommissary`, `Reciprocal` |
| `DisinheritanceGround` | `Art919_1`…`Art919_8`, `Art920_1`…`Art920_8`, `Art921_1`…`Art921_6` |
| `ScenarioCode` | `T1`…`T15`, `I1`…`I15` |
| `SuccessionType` | `Testate`, `Intestate`, `Mixed` |
| `EffectiveGroup` | `LegitimateChildGroup`, `LegitimateAscendantGroup`, `SurvivingSpouseGroup`, `IllegitimateChildGroup`, `CollateralGroup` |
| `ExclusionReason` | `PredeceaseNoRepresentation`, `Unworthiness`, `FiliationNotProved`, `GuiltySpouseLegalSeparation`, `AdoptionRescinded`, `ValidDisinheritance`, `Renounced`, `ExcludedByGroup`, `IronCurtain` |
| `RepresentationTrigger` | `Predecease`, `Disinheritance`, `Unworthiness`, `IllegitimateTransmission` |
| `VacancyCause` | `Predecease`, `Renunciation`, `Unworthiness`, `Disinheritance`, `SubstitutePredeceased`, `SubstituteIncapacitated`, `ConditionFailed` |
| `ShareSource` | `Legitime`, `FreePortion`, `Intestate`, `Devise`, `Legacy` |
| `ResolutionMethod` | `Substitution`, `Representation`, `AccretionFreePortion`, `AccretionIntestate`, `OwnRightLegitime`, `IntestateFallback`, `NextDegreeInOwnRight`, `Escheat` |
| `PreteritionEffect` (tag) | `None`, `InstitutionAnnulled` |
| `ValidationWarning` (code+data) | `PreteritionDetected`, `InvalidDisinheritance`, `ConditionStripped`, `Underprovision`, `InoficiousnessReduced`, `ReconciliationVoided`, `PosthumousHeirPossible`, `AnnuityChoiceRequired`, `IndivisibleRealty`, `MultipleDisinheritances` |
| `ManualReviewFlag` (flag) | `AllDescendantsDisinherited`, `DisinheritedWithSubstituteAndReps`, `PosthumousChildPossible`, `UsufructElectionRequired`, `IndivisibleRealtyPartition`, `ReconciliationPreWill`, `LegitimationContested` |
| `ComputationError` (error_type) | `InputValidation`, `DomainValidation`, `MaxRestartsExceeded`, `ArithmeticError`, `PanicRecovered` |

---

## §5. Nullability Matrix

Every `Option<T>` in Rust must be `T | null` in TypeScript and `z.nullable(TSchema)` in Zod.
Never `T | undefined` and never `z.optional()`.

| Struct | Field | Rust | TypeScript | Zod |
|--------|-------|------|-----------|-----|
| `DecedentInput` | `date_of_death` | `Option<String>` | `string \| null` | `z.nullable(DateStringSchema)` |
| `DecedentInput` | `domicile` | `Option<String>` | `string \| null` | `z.nullable(z.string())` |
| `DecedentInput` | `nationality` | `Option<String>` | `string \| null` | `z.nullable(z.string())` |
| `EstateInput` | `gross_estate` | `Option<Money>` | `InputMoney \| null` | `z.nullable(InputMoneySchema)` |
| `EstateInput` | `obligations` | `Option<Money>` | `InputMoney \| null` | `z.nullable(InputMoneySchema)` |
| `EstateInput` | `description` | `Option<String>` | `string \| null` | `z.nullable(z.string())` |
| `HeirInput` | `date_of_death` | `Option<String>` | `string \| null` | `z.nullable(DateStringSchema)` |
| `HeirInput` | `date_of_birth` | `Option<String>` | `string \| null` | `z.nullable(DateStringSchema)` |
| `HeirInput` | `adoption_date` | `Option<String>` | `string \| null` | `z.nullable(DateStringSchema)` |
| `HeirInput` | `adoption_rescission_date` | `Option<String>` | `string \| null` | `z.nullable(DateStringSchema)` |
| `HeirInput` | `degree` | `Option<u32>` | `number \| null` | `z.nullable(z.number().int().min(1))` |
| `ComputationInput` | `will` | `Option<WillInput>` | `WillInput \| null` | `z.nullable(WillInputSchema)` |
| `ComputationInput` | `donations` | `Option<Vec<DonationInput>>` | `DonationInput[] \| null` | `z.nullable(z.array(DonationInputSchema))` |
| `WillInput` | `date_executed` | `Option<String>` | `string \| null` | `z.nullable(DateStringSchema)` |
| `DonationInput` | `donor_id` | `Option<String>` | `string \| null` | `z.nullable(z.string())` |
| `DonationInput` | `recipient_heir_id` | `Option<String>` | `string \| null` | `z.nullable(z.string())` |
| `DonationInput` | `date` | `Option<String>` | `string \| null` | `z.nullable(DateStringSchema)` |
| `DonationInput` | `description` | `Option<String>` | `string \| null` | `z.nullable(z.string())` |
| `DonationInput` | `professional_expense_...` | `Option<i64>` | `number \| null` | `z.nullable(z.number().int())` |
| `DisinheritanceRecord` | `note` | `Option<String>` | `string \| null` | `z.nullable(z.string())` |
| `InstitutionInput` | `fraction` | `Option<String>` | `string \| null` | `z.nullable(FractionStringSchema)` |
| `InstitutionInput` | `amount_centavos` | `Option<i64>` | `number \| null` | `z.nullable(z.number().int())` |
| `InstitutionInput` | `description` | `Option<String>` | `string \| null` | `z.nullable(z.string())` |
| `DeviseInput` | `beneficiary_heir_id` | `Option<HeirId>` | `string \| null` | `z.nullable(z.string())` |
| `HeirDistribution` | `effective_group` | `Option<EffectiveGroup>` | `EffectiveGroup \| null` | `z.nullable(EffectiveGroupSchema)` |
| `HeirDistribution` | `exclusion_reason` | `Option<ExclusionReason>` | `ExclusionReason \| null` | `z.nullable(ExclusionReasonSchema)` |
| `HeirDistribution` | `per_stirpes_fraction` | `Option<String>` | `string \| null` | `z.nullable(FractionStringSchema)` |
| `HeirDistribution` | `representation` | `Option<RepresentationChain>` | `RepresentationChain \| null` | `z.nullable(RepresentationChainSchema)` |
| `HeirDistribution` | `per_heir_fraction` | `Option<String>` | `string \| null` | `z.nullable(FractionStringSchema)` |
| `HeirDistribution` | `partition_notes` | `Option<String>` | `string \| null` | `z.nullable(z.string())` |
| `ComputationOutput` | `testate_validation` | `Option<TestateValidationResult>` | `TestateValidationResult \| null` | `z.nullable(TestateValidationResultSchema)` |
| `ComputationOutput` | `collation` | `Option<CollationResult>` | `CollationResult \| null` | `z.nullable(CollationResultSchema)` |

---

## §6. Integration Smoke Test Checklist

Before shipping: verify these end-to-end scenarios parse without error:

### Smoke Test 1 — Minimal Intestate (I1: LC only)
```json
// Input
{ "decedent": { "name": "A", "date_of_death": "2024-01-01", "has_will": false,
    "has_legitimate_children": true, "has_illegitimate_children": false,
    "is_illegitimate": false, "articulo_mortis": false, "cohabitation_years": 0,
    "legal_separation_status": "NotApplicable", "domicile": null, "nationality": null },
  "estate": { "net_estate": {"centavos": 100000000}, "gross_estate": null,
    "obligations": null, "description": null },
  "heirs": [{ "id": "h1", "name": "LC1", "heir_type": "LegitimateChild",
    "is_alive": true, "date_of_death": null, "date_of_birth": null,
    "is_unworthy": false, "unworthiness_condoned": false, "filiation_proved": true,
    "has_renounced": false, "is_adopted": false, "adoption_rescinded": false,
    "adoption_rescission_date": null, "adoption_date": null,
    "biological_parent_is_adopter_spouse": false, "is_legitimated": false,
    "paternal_line": false, "degree": null, "is_full_blood": false,
    "legal_separation_status": "NotApplicable",
    "disinheritances": [], "substitutions": [], "children": [],
    "donations_received": [] }],
  "will": null, "donations": null }
// Expected: scenario_code "I1", distributions[0].total_centavos = 100000000
```

### Smoke Test 2 — Enum Round-Trip (all output enums present)
```json
// Verify TypeScript can parse ComputationOutput with:
// - effective_group: "LegitimateChildGroup"  (DISC-01)
// - exclusion_reason: "PredeceaseNoRepresentation"  (DISC-02)
// - RepresentationTrigger: "IllegitimateTransmission"  (DISC-03)
// - VacancyCause: "SubstitutePredeceased"  (DISC-04)
// - resolution_method: "AccretionFreePortion"  (DISC-05)
// - preterition_effect: { "type": "InstitutionAnnulled", "preterited_heir_ids": ["h1"] }  (DISC-06)
// All Zod schemas must accept these values without throwing
```

### Smoke Test 3 — DecedentInput strict rejection
```json
// Must REJECT (serde deny_unknown_fields):
{ "decedent": { "name": "A", "date_of_death": null, "has_will": false,
    "has_legitimate_children": false, "has_illegitimate_children": false,
    "is_illegitimate": false, "articulo_mortis": false, "cohabitation_years": 0,
    "legal_separation_status": "NotApplicable", "domicile": null, "nationality": null,
    "unknown_field": "BAD" }, ... }
// Error: { "error_type": "InputValidation", "message": "unknown field `unknown_field`..." }
```

### Smoke Test 4 — Money BigInt string input
```json
// Must ACCEPT centavos as string:
{ "estate": { "net_estate": {"centavos": "9000000000000000"}, ... } }
// Zod InputMoneySchema.safeParse({ centavos: "9000000000000000" }) → success
```

---

## §7. Summary of Required Spec Updates

The following sections of `docs/plans/inheritance-v2-spec.md` must be updated to reflect
these resolutions:

| Spec Section | Required Update |
|-------------|----------------|
| §3 Data Model | Update DecedentInput (11 fields), EstateInput (Money wrapper), HeirInput (canonical 24-field set) |
| §3 Data Model | Update EffectiveGroup (5 full-name variants), ExclusionReason (9 variants), RepresentationTrigger (4 variants), VacancyCause (7 variants), ResolutionMethod (8 variants), PreteritionEffect (2 variants) |
| §13.2 JSON Wire Format | Sync all type-specific sections with DISC-07 through DISC-09 resolutions |
| §13.2 JSON Wire Format | Update §4.7–§4.11 enum tables with canonical variant names |
| §14 TypeScript Types | Reflect merged DecedentInput, canonical HeirInput, all enum updates |
| §15 Zod Schemas | Update ExclusionReasonSchema (9 variants), RepresentationTriggerSchema (4 variants), VacancyCauseSchema (7 variants) |
| §20 Cross-Layer Consistency | Reference this analysis; list all 9 discrepancies and resolutions |

---

## §8. Key Implementation Rules (Developer Checklist)

A developer implementing the v2 engine must verify:

- [ ] `EffectiveGroup` enum has 5 variants with full PascalCase names (not G1–G4)
- [ ] `ExclusionReason` has 9 variants including `IronCurtain`
- [ ] `RepresentationTrigger` uses `Unworthiness` (not `Incapacity`) and `IllegitimateTransmission` (not `Art902IllegitimateLine`)
- [ ] `VacancyCause` has 7 variants including `ConditionFailed` (not 6)
- [ ] `ResolutionMethod` has 8 variants (not 5 — `AccretionFreePortion` ≠ `AccretionIntestate`)
- [ ] `PreteritionEffect` uses `None` and `InstitutionAnnulled` (not `AnnulsAll`/`AnnulsInstitutions`)
- [ ] `DecedentInput` has all 11 fields: name, date_of_death, has_will, has_legitimate_children, has_illegitimate_children, is_illegitimate, articulo_mortis, cohabitation_years, legal_separation_status, domicile, nationality
- [ ] `EstateInput` uses `net_estate: Money` (not `net_value_centavos: i64`)
- [ ] `HeirInput` uses `is_alive` (not `is_deceased`) and `degree: Option<u32>` (not `collateral_degree: u32`)
- [ ] `HeirInput` does NOT have `is_disinherited`, `is_collateral`, `cause_proven`, `reconciled` fields
- [ ] `HeirInput.children` is recursive `Vec<Box<HeirInput>>` (not `Vec<HeirId>`)
- [ ] All `Option<T>` fields serialize/deserialize as `null` (never absent key)
- [ ] No `#[serde(skip_serializing_if = "Option::is_none")]` on any field
- [ ] Input types have `#[serde(deny_unknown_fields)]`; output types do NOT
- [ ] Zod schemas: all input schemas use `.strict()`, output schemas do NOT
- [ ] Zod schemas: `z.nullable()` used for all `Option<T>` fields, never `z.optional()`
- [ ] TypeScript: all `Option<T>` fields typed as `T | null`, never `T | undefined`
