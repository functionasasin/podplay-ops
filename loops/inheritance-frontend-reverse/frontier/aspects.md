# Frontier — Inheritance Frontend Spec

## Statistics

- **Total aspects**: 25
- **Analyzed**: 20
- **Pending**: 5
- **Convergence**: 80%

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
- [ ] test-case-field-coverage — Analyze all 20+ test case JSONs to verify Wave 1 specs cover every field value that appears in practice
- [ ] shared-components — Identify reusable form components (MoneyInput, PersonPicker, DateInput, FractionInput) from Wave 1 field metadata

## Wave 3: Synthesis (3 aspects)

- [ ] synthesis-types — Assemble complete types.ts from all Wave 1 TypeScript interfaces
- [ ] synthesis-schemas — Assemble complete schemas.ts from all Wave 1 Zod schemas
- [ ] synthesis-spec — Assemble wizard-steps.md, results-view.md, and spec-summary.md from all analysis
