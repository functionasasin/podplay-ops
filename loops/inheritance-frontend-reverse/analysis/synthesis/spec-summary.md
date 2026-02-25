# Spec Summary — Philippine Inheritance Distribution Engine Frontend
## Executive Summary

**Wave**: 3 (Synthesis) — Final deliverable
**Date produced**: 2026-02-25
**Loop**: `inheritance-frontend-reverse`
**Total analysis iterations**: 25 aspects across 3 waves

---

## What Was Produced

This loop analyzed the Rust inheritance engine source code and produced a complete,
implementation-ready frontend specification. The outputs are:

| File | Description |
|------|-------------|
| `analysis/synthesis/types.ts` | Complete TypeScript type definitions (17 types, 12 enums) |
| `analysis/synthesis/schemas.ts` | Complete Zod validation schemas (~650 lines, 7 cross-field refinements) |
| `analysis/synthesis/wizard-steps.md` | Per-step field specs for 6-step wizard |
| `analysis/synthesis/results-view.md` | Component specs for results display |
| `analysis/synthesis/spec-summary.md` | This document |

---

## System Architecture Summary

### Engine Interface

The Rust engine exposes a single function (via WASM):
```
compute(input_json: string) → output_json: string
```

- **Input**: `EngineInput` JSON → full serialization of 6 top-level fields
- **Output**: `EngineOutput` JSON → 6 top-level fields including per-heir shares
- **No server**: Runs entirely client-side via WebAssembly
- **Exact arithmetic**: BigRational in WASM — no floating-point approximation

### Data Flow

```
Wizard Steps (1-6) → EngineInput JSON → WASM compute() → EngineOutput JSON → Results View
```

### 6-Step Wizard Overview

| Step | Component | Always Visible | Key Inputs |
|------|-----------|---------------|-----------|
| 1. Estate Details | EstateStep.tsx | Yes | `net_distributable_estate`, `hasWill` toggle |
| 2. Decedent Details | DecedentStep.tsx | Yes | `decedent.*`, marriage cascade (6 conditional fields) |
| 3. Family Tree | FamilyTreeStep.tsx | Yes | `family_tree[]` (11 relationship types, conditional sub-forms) |
| 4. Will & Dispositions | WillStep.tsx | **When `hasWill = true`** | `will.{institutions, legacies, devises, disinheritances}` |
| 5. Donations | DonationsStep.tsx | Yes | `donations[]` (11 conditional exemption flags) |
| 6. Review & Config | ReviewStep.tsx | Yes | `config.*`, pre-submission validation, submit button |

---

## Critical Serialization Rules

These serialization quirks **must** be implemented correctly or the engine will silently produce wrong results:

| Type | Wire Format | Common Mistake | Source |
|------|------------|----------------|--------|
| `Money` | `{"centavos": number\|string}` | Sending pesos instead of centavos | `types.rs:22-29` |
| `Frac` | `"1/2"` (bare string) | Sending `{numer:1, denom:2}` object | `fraction.rs:241-244` |
| `ShareSpec::Fraction` | `{"Fraction": "1/2"}` | Sending `{"Fraction": {numer:1, denom:2}}` | `types.rs:381-388` |
| `LegacySpec::GenericClass` | `["desc", {"centavos":N}]` | Sending object instead of 2-tuple array | `types.rs:408-413` |
| `DeviseSpec::FractionalInterest` | `["asset-id", "1/2"]` | Sending object instead of 2-tuple array | `types.rs:425-429` |
| ShareSpec unit variants | `"EntireFreePort"` (plain string) | Sending `{"EntireFreePort": null}` | `types.rs:381-388` |
| `will: null` | `null` | Missing field | `types.rs:1-18` |
| Enum variants | `"LegitimateChild"` (PascalCase) | `"legitimate_child"` (snake_case) | All enum types |

---

## TypeScript Types Summary

All types are in `analysis/synthesis/types.ts`. Key types:

```typescript
// Top-level input/output
interface EngineInput { ... }      // 6 fields
interface EngineOutput { ... }     // 6 fields

// Core entities
interface Decedent { ... }         // 11 fields
interface Person { ... }           // 14 fields
interface Will { ... }             // 5 fields
interface Donation { ... }         // 17 fields
interface EngineConfig { ... }     // 2 fields

// Will dispositions
interface InstitutionOfHeir { ... }  // 6 fields
interface HeirReference { ... }      // 4 fields
interface Legacy { ... }             // 6 fields
interface Devise { ... }             // 6 fields
interface Disinheritance { ... }     // 5 fields
interface Condition { ... }          // 3 fields
interface Substitute { ... }         // 3 fields
interface Adoption { ... }           // 8 fields

// Output types
interface InheritanceShare { ... }   // 14 fields
interface HeirNarrative { ... }      // 4 fields
interface ComputationLog { ... }     // 3 fields
interface ManualFlag { ... }         // 3 fields

// Enums (12 total)
type Relationship          // 11 variants (PascalCase)
type FiliationProof        // 6 variants
type BloodType             // 2 variants: "Full" | "Half"
type AdoptionRegime        // 2 variants: "Ra8552" | "Ra11642"
type DisinheritanceCause   // 22 variants (grouped by Art. 919/920/921)
type ShareSpec             // 6 variants (mixed unit-string + tagged-object)
type LegacySpec            // 3 variants
type DeviseSpec            // 2 variants
type EffectiveCategory     // 5 variants
type InheritanceMode       // 2 variants
type SuccessionType        // 4 variants
type ScenarioCode          // 30 variants (T1-T15, I1-I15, note: T5a/T5b lowercase)
```

---

## Zod Schema Summary

All schemas are in `analysis/synthesis/schemas.ts`. Key cross-field refinements in `EngineInputSchema.superRefine`:

| # | Rule | Source |
|---|------|--------|
| 1 | `will.date_executed ≤ decedent.date_of_death` | Art. 838 |
| 2 | `donation.date ≤ decedent.date_of_death` | Legal constraint |
| 3 | Max 1 `SurvivingSpouse` in `family_tree` | Engine modeling constraint |
| 4 | Institution/disinheritance `person_id` must reference `family_tree` | `step6_validation.rs:828` |
| 5 | Max 1 `is_residuary = true` institution | `step7_distribute.rs:987` |
| 6 | Donation `recipient_heir_id` must reference `family_tree` | `step4_estate_base.rs:96` |
| 7 | `Person.children[]` IDs must reference `family_tree` | `step2_lines.rs:81` (panic risk) |

---

## Conditional Visibility Summary

The wizard has 3 levels of conditional field display:

### Level 1: Step Gating
- **Step 4 (Will)**: Only shown when `hasWill = true` (Step 1 toggle)

### Level 2: Section Gating (within a step)
- **Marriage fields** (Step 2): Only when `decedent.is_married = true`
- **Articulo mortis chain**: 3-deep cascade from `marriage_solemnized_in_articulo_mortis`
- **Adoption sub-form** (Step 3): Only when `relationship = AdoptedChild`
- **Filiation sub-fields** (Step 3): Only when `relationship = IllegitimateChild`
- **Blood type** (Step 3): Only when `relationship = Sibling`
- **Guilty party flag** (Step 3): Only when `relationship = SurvivingSpouse && decedent.has_legal_separation = true`
- **Line of descent** (Step 3): Only when `relationship ∈ {LegitimateParent, LegitimateAscendant}`
- **Exemption flags** (Step 5): Only when `!donation.recipient_is_stranger`

### Level 3: Field Gating (within a section)
- Institution share: Hidden when `is_residuary = true`
- Fraction inputs: Shown when `share_type = "Fraction"`
- Class designation: Shown when `heir.is_collective = true`
- Heir name editable: When `person_id = null`
- Rescission date: When `adoption.is_rescinded = true`
- Proof type dropdown: When `filiation_proved = true`
- Invalidity reason: When `substitute.is_valid = false`
- Professional expense sub-fields: Cascade within donation exemption flags

---

## Validation Layers

Three-layer validation strategy (from `invalid-combinations.md §14`):

| Layer | When | Covers |
|-------|------|--------|
| **Layer 1: Zod Schema** | Every keystroke (debounced) | Type checks, required fields, enum values, format validation |
| **Layer 2: Cross-Field SuperRefine** | On step navigation change | Referential integrity (#1-10 from priority table), date ordering, duplicate IDs |
| **Layer 3: Pre-Submission Preview** | Review step (Step 6) | Behavioral warnings (#11-25): preterition, mutual exclusion, inofficiousness estimate |

### Hard Errors (block submission)

| # | Error | Source |
|---|-------|--------|
| 1 | Duplicate person IDs | Panic in `step2_lines.rs:81` |
| 2 | `person.children[]` refs non-existent ID | Panic in `step2_lines.rs:81` |
| 3 | `AdoptedChild` + `adoption = null` | Silent exclusion `step1_classify.rs:188` |
| 4 | `net_distributable_estate ≤ 0` | Useless output |
| 5 | Multiple `SurvivingSpouse` | Incorrect engine model |
| 6 | `will.date_executed > date_of_death` | Legally void (Art. 838) |
| 7 | `donation.date > date_of_death` | Legally impossible |
| 8 | `HeirReference.person_id` → non-existent | Silent preterition risk |
| 9 | `donation.recipient_heir_id` → non-existent | ManualFlag + collation excluded |
| 10 | Duplicate disposition IDs | Ambiguous reduction tracking |

### Warnings (dismissable, don't block submission)

Preterition risk, invalid disinheritance, rescinded adoption, unworthy heir, spouse guilt
in legal separation, ascendants excluded by descendants, collaterals excluded by compulsory heirs.

---

## Results View Summary

### Layout Variants (7 total)

| Layout | Trigger | Description |
|--------|---------|-------------|
| `standard-distribution` | Most intestate scenarios | Table + pie chart |
| `testate-with-dispositions` | Testate (T1-T12, T14-T15) | Legitime + free portion sections |
| `mixed-succession` | `SuccessionType = "Mixed"` | Two-section layout |
| `preterition-override` | `SuccessionType = "IntestateByPreterition"` | Error banner + intestate table |
| `collateral-weighted` | I12, I13, I14 | Blood type unit weighting |
| `escheat` | I15 | Single card — estate to State |
| `no-compulsory-full-fp` | T13 | Only testamentary dispositions |

### Key Display Rules

- **Primary money value**: `net_from_estate` (what heir actually receives from estate)
- **Secondary**: `gross_entitlement` and `donations_imputed` (shown only when donations imputed)
- **Engine TODOs**: `from_legitime`, `from_free_portion`, `from_intestate` are always `{centavos:0}` — show only when non-zero
- **Narratives**: Render `**bold**` as `<strong>` — minimal Markdown parser only
- **Warnings panel**: Currently always empty (`warnings: []`) — render for forward compatibility

---

## Shared Components

10 shared components identified (from `shared-components.md`):

### Tier 1: Primitive Inputs
- `MoneyInput` — pesos UI ↔ centavos storage; 5 input contexts + 7 output display contexts
- `DateInput` — ISO-8601 dates; 6 contexts with `minDate`/`maxDate` cross-validation
- `FractionInput` — `"n/d"` string serialization; 3 input + 1 output contexts
- `PersonPicker` — family_tree dropdown; 9 contexts with optional filters
- `EnumSelect` — typed enum dropdown with grouping; 13 enum types

### Tier 2: Composite Sub-Forms
- `HeirReferenceForm` — person picker + name + collective toggle; 5 disposition contexts
- `ConditionForm` — condition_type + description + status; 3 disposition contexts
- `SubstituteForm` — substitution_type + heir ref + triggers; 3 disposition contexts

### Tier 3: Utilities
- `DispositionIdGenerator` — unique ID generation across institutions/legacies/devises
- `ValidityIndicator` — real-time badge; disinheritance validity + articulo mortis

---

## Scenario Prediction

The frontend can predict the scenario code in real-time as the wizard is filled.
Full `predictScenario()` implementation in `scenario-field-mapping.md §5`:

```
Input: { hasWill, legitimateChildCount, illegitimateChildCount,
         hasSurvivingSpouse, legitimateAscendantCount,
         decedentIsIllegitimate, hasSiblingsOrNephews, hasOtherCollaterals }
Output: ScenarioPrediction { scenarioCode, successionType, regime, description, articles }
```

**Important caveat**: The frontend cannot predict:
- Mixed succession (happens after Step 5 — will doesn't exhaust free portion)
- IntestateByPreterition (happens after Step 6 — preterition detected)

Show the predicted scenario in Step 6 Review with an appropriate caveat note.

---

## Known Engine Gaps (Frontend Must Compensate)

| Gap | Source | Frontend Action |
|-----|--------|----------------|
| `warnings: []` always in output | `step10_finalize.rs:619` | Render panel for forward compatibility |
| `from_legitime/from_free_portion/from_intestate` always 0 | `step10_finalize.rs:538-540` | Show only when > 0; don't show "From Legitime: ₱0" |
| `legitime_fraction` always `""` | `step10_finalize.rs:542` | Show only when non-empty |
| No input validation in engine | All pipeline steps | Frontend must validate thoroughly (Layers 1-3) |
| Engine accepts `date_executed > date_of_death` | No date check in Rust | Frontend must enforce (Art. 838) |
| Engine accepts multiple SurvivingSpouse | No constraint in Rust | Frontend must enforce max 1 |
| `person.children[]` panic on missing ID | `step2_lines.rs:81` | Frontend must enforce referential integrity |
| `retroactive_ra_11642` not consumed by pipeline | Engine TODO | Show "experimental" label in Advanced Settings |

---

## Test Coverage Note

The 20 test case JSONs cover:
- **Fully covered**: All Regime A intestate scenarios (I1-I4, I7-I8), most Regime B (I5-I6), collateral (I13), escheat (I15), testate T1+T3
- **Not covered by tests**: T2, T4-T15 (except T1, T3); I9, I10, I11, I12, I14; LegitimatedChild, LegitimateAscendant, NephewNiece, OtherCollateral, Stranger
- **Recommendation**: Frontend should not restrict to test-covered cases — all 30 scenarios and all 11 relationship types are structurally valid per the Rust type definitions

---

## File Manifest

```
analysis/synthesis/
├── types.ts          ← Complete TypeScript interfaces (Wave 3 synthesis)
├── schemas.ts        ← Complete Zod schemas (Wave 3 synthesis)
├── wizard-steps.md   ← Per-step field specs (Wave 3 synthesis) ← THIS LOOP
├── results-view.md   ← Results display component specs (Wave 3 synthesis) ← THIS LOOP
└── spec-summary.md   ← This document ← THIS LOOP
```

All Wave 1 type analyses are in `analysis/{type-name}.md`.
All Wave 2 cross-cutting analyses are in `analysis/{aspect-name}.md`.

---

## Implementation Checklist

When building the frontend, implement in this order:

1. **Types & Schemas** — Copy `types.ts` and `schemas.ts` verbatim; add `zod` dependency
2. **WASM Bridge** — `engine.ts`: load WASM, export `compute(input: EngineInput): EngineOutput`
3. **Shared Components** — MoneyInput, DateInput, FractionInput, EnumSelect, PersonPicker
4. **Composite Components** — HeirReferenceForm, ConditionForm, SubstituteForm
5. **Step 1 + Step 2** — Simple forms; test serialization early with sample estate
6. **Step 3 (Family Tree)** — Most complex; relationship-driven conditional visibility
7. **Step 5 (Donations)** — Simpler than Step 3; stranger toggle cascade
8. **Step 4 (Will)** — 4 sub-tabs; implement after Step 3 (depends on family_tree)
9. **Step 6 (Review)** — Pre-submission validation + scenario prediction
10. **Results View** — Layout variants; start with `standard-distribution`; add other layouts
11. **Export / Actions** — JSON export, narrative copy
12. **Validation Layer 3** — Pre-submission behavioral warnings
