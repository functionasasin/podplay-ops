# Frontier — Inheritance Frontend Spec

## Statistics

- **Total aspects**: 25
- **Analyzed**: 25
- **Pending**: 0
- **Convergence**: 100%

## Wave 1: Rust Type → Frontend Spec (17 aspects)

- [x] engine-input-root — EngineInput struct, top-level shape and required fields
- [x] money — Money struct, centavos representation, pesos display conversion
- [x] engine-config — EngineConfig struct, boolean flags and defaults
- [x] decedent — Decedent struct, all fields including marriage and death-bed flags
- [x] person — Person struct, core fields (id, name, alive, degree, line)
- [x] relationship-enum — Relationship enum, all 11 variants and their implications
- [x] filiation-proof — FiliationProof enum, when required, valid options
- [x] blood-type — BloodType enum (Full/Half), sibling-only field
- [x] adoption — Adoption struct, regimes (RA 8552 vs RA 11642), rescission
- [x] will — Will struct, top-level shape, date_executed
- [x] institution-of-heir — InstitutionOfHeir struct, HeirReference, ShareSpec enum
- [x] legacy — Legacy struct, LegacySpec enum (FixedAmount, SpecificAsset, GenericClass)
- [x] devise — Devise struct, DeviseSpec enum (SpecificProperty, FractionalInterest)
- [x] condition-substitute — Condition and Substitute structs, enums for types/triggers
- [x] disinheritance — Disinheritance struct, 23 cause codes grouped by article
- [x] donation — Donation struct, 11+ exemption flags, collation rules
- [x] engine-output — EngineOutput, InheritanceShare, HeirNarrative, ComputationLog, ManualFlag

## Wave 2: Cross-Cutting Analysis (5 aspects)

- [x] conditional-visibility — Which fields appear/hide based on other field values (e.g. will step gated on testate, adoption sub-form on relationship type)
- [x] invalid-combinations — Combinations the engine rejects or that produce warnings (mine pipeline validation logic and test case failures)
- [x] scenario-field-mapping — Which scenario codes (T1-T15, I1-I15) are reachable from which input configurations, and how the results view adapts
- [x] test-case-field-coverage — Analyze all 20+ test case JSONs to verify Wave 1 specs cover every field value that appears in practice
- [x] shared-components — Identify reusable form components (MoneyInput, PersonPicker, DateInput, FractionInput) from Wave 1 field metadata

## Wave 3: Synthesis (3 aspects)

- [x] synthesis-types — Assemble complete types.ts from all Wave 1 TypeScript interfaces
- [x] synthesis-schemas — Assemble complete schemas.ts from all Wave 1 Zod schemas
- [x] synthesis-spec — Assemble wizard-steps.md, results-view.md, and spec-summary.md from all analysis

---

## FAILURE: Children for Representation — Insufficiently Specified

**Date discovered**: 2026-03-01
**Severity**: Spec gap led to unimplemented feature in forward loop

### What happened

The spec mentions `person.children` as a one-liner in the wizard-steps.md field table (line 228):
```
| person.children | Children (for Representation) | ... | PersonPicker (multi-select) | [] | No | All IDs must exist in family_tree |
```

And a single line in the person card layout:
```
(if dead + children_relevant)
Children (for representation): [PersonPicker multi]
```

This was NOT sufficient. Every other conditional section in the spec got a dedicated sub-section with:
- Detailed field breakdown (FiliationSection: 6 lines of spec)
- Layout diagram (AdoptionSubForm: full tree diagram)
- Variant-specific behavior (Legacy, Devise: variant tables)
- Reset/toggle logic (marriage cascade: explicit reset defaults)

`children` got none of this. The forward loop implemented it as a bare label stub with no actual picker, because the spec didn't describe:
1. That a **multi-select** PersonPicker doesn't exist — the shared PersonPicker component is single-select only
2. How to filter available persons (exclude self, optionally filter by relationship)
3. What helper text to show ("Select this person's children from the family tree")
4. What to show when no persons are available ("Add children first, then link them here")
5. How grandchildren work in the data model (children of a deceased LegitimateChild with degree 2+)

### Root cause

The reverse loop treated `children` as a simple field reference rather than recognizing it needs a **new UI pattern** (multi-select person picker via checkboxes) that doesn't exist in the shared component library. The spec's analysis of `person.md` even notes the field and its purpose but never escalated it to a dedicated component spec.

### Fix applied

Implemented `ChildrenForRepresentation` component in PersonCard.tsx with:
- Checkbox-based multi-select of family tree members
- Self-exclusion filter
- Helper text explaining representation
- Empty state when no other persons exist
