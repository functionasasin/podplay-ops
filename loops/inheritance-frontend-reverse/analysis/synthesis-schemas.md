# Synthesis: schemas.ts — Complete Zod Validation Schemas

**Wave**: 3 (Synthesis)
**Output file**: `analysis/synthesis/schemas.ts`
**Depends on**: All Wave 1 analysis files + Wave 2 validation-rules.md

---

## What Was Produced

`analysis/synthesis/schemas.ts` is a single, self-contained Zod schema file
covering every input and output type of the Philippine Inheritance Distribution
Engine. It assembles all per-type schemas from the Wave 1 analyses into correct
dependency order with cross-file refinements.

---

## File Structure (17 sections)

| Section | Content |
|---------|---------|
| 1 | Primitive helpers: `DateSchema`, `FracSchema`, `FractionalInterestFracSchema` |
| 2 | Money: `CentavosValueSchema`, `MoneySchema` |
| 3 | Enum schemas (11 enums) |
| 4 | `AdoptionSchema` |
| 5 | Condition, Substitute, FideicommissarySubstitution schemas |
| 6 | `ShareSpecSchema` |
| 7 | `LegacySpecSchema`, `DeviseSpecSchema` |
| 8 | `InstitutionOfHeirSchema`, `LegacySchema`, `DeviseSchema`, `DisinheritanceSchema` |
| 9 | `WillSchema` |
| 10 | `DonationSchema` |
| 11 | `PersonSchema` |
| 12 | `DecedentSchema` |
| 13 | `EngineConfigSchema` |
| 14 | `EngineInputSchema` (top-level, with cross-field refinements) |
| 15 | Engine output schemas: `EngineOutputSchema`, `InheritanceShareSchema`, etc. |
| 16 | `CAUSE_BY_RELATIONSHIP` + cause-group constants |
| 17 | `WARNING_SEVERITY` map for results UI |

---

## Dependency Order

All schemas are defined before they are referenced, eliminating circular
dependencies. `z.lazy()` is used only in `FideicommissarySubstitutionSchema`
for `ShareSpecSchema` (which logically follows conditions/substitutes but is
needed in the fideicommissary struct).

```
DateSchema, FracSchema
  └─ MoneySchema
       └─ LegacySpecSchema (FixedAmount, GenericClass)
  └─ AdoptionSchema (decree_date, rescission_date)
  └─ DecedentSchema (date_of_death, date_of_marriage)
  └─ DonationSchema (date)
  └─ WillSchema (date_executed)

FracSchema
  └─ FractionalInterestFracSchema
       └─ DeviseSpecSchema (FractionalInterest)
  └─ ShareSpecSchema (Fraction variant)

Enum schemas (no deps)
  └─ ConditionSchema (ConditionTypeSchema, ConditionStatusSchema)
  └─ SubstituteSchema (SubstitutionTypeSchema, SubstitutionTriggerSchema, HeirReferenceSchema)
  └─ PersonSchema (RelationshipSchema, FiliationProofSchema, AdoptionRegimeSchema,
                   LineOfDescentSchema, BloodTypeSchema, AdoptionSchema)
  └─ DisinheritanceSchema (DisinheritanceCauseSchema, HeirReferenceSchema)

HeirReferenceSchema (no deps beyond z.string())
  └─ InstitutionOfHeirSchema (HeirReferenceSchema, ShareSpecSchema, ConditionSchema, SubstituteSchema)
  └─ LegacySchema (HeirReferenceSchema, LegacySpecSchema, ConditionSchema, SubstituteSchema)
  └─ DeviseSchema (HeirReferenceSchema, DeviseSpecSchema, ConditionSchema, SubstituteSchema)
  └─ DisinheritanceSchema (HeirReferenceSchema)
  └─ SubstituteSchema (HeirReferenceSchema)

WillSchema
  └─ InstitutionOfHeirSchema, LegacySchema, DeviseSchema, DisinheritanceSchema, DateSchema

EngineInputSchema
  └─ MoneySchema, DecedentSchema, PersonSchema[], WillSchema|null, DonationSchema[], EngineConfigSchema
```

---

## Cross-Field Refinements in EngineInputSchema

These are the cross-field validations that require context from multiple
top-level fields, assembled at the `EngineInputSchema.superRefine` level:

| Constraint | Source |
|-----------|--------|
| `will.date_executed ≤ decedent.date_of_death` | Art. 838 Civil Code (engine ignores) |
| `donation.date ≤ decedent.date_of_death` | step6_validation.rs:674-697 |
| At most one `SurvivingSpouse` in `family_tree` | Civil Code (bigamy) |
| `InstitutionOfHeir.heir.person_id` references `family_tree` | step7_distribute.rs |
| At most one `is_residuary = true` institution | step7_distribute.rs:987 |
| `Disinheritance.heir_reference.person_id` references `family_tree` | step1_classify.rs:53-55 |
| `Donation.recipient_heir_id` references `family_tree` (when non-stranger) | step4_estate_base.rs:97-113 |

---

## Key Serialization Gotchas Captured

### Money: centavos integer or string
```typescript
// Engine accepts i64 or "bigint string" (types.rs:47-70)
{ centavos: 200000000 }      // preferred (normal amounts)
{ centavos: "9999999999999" } // large amounts (BigInt safe)
```

### Frac: "n/d" string (NOT object)
```typescript
// fraction.rs:241-264 custom serializer
"1/2"   // ✓ correct
{"numer": 1, "denom": 2}  // ✗ wrong — engine will reject
```

### ShareSpec: tagged enum with mixed serialization
```typescript
"EqualWithOthers"          // unit variant → plain string
{"Fraction": "1/3"}        // tuple variant → tagged object
```

### LegacySpec::GenericClass: 2-tuple array
```typescript
{"GenericClass": ["Books", {"centavos": 50000}]}  // ✓ 2-element array
{"GenericClass": {"desc": "Books", "money": ...}} // ✗ wrong
```

### DeviseSpec::FractionalInterest: 2-tuple array
```typescript
{"FractionalInterest": ["lot-1", "1/2"]}  // ✓ 2-element array
```

---

## Engine Output Schema Notes

Output schemas validate the received engine response. Key caveats:

- `InheritanceShare.from_legitime`, `from_free_portion`, `from_intestate` are
  always `{ centavos: 0 }` in current engine (engine TODO at step10:538-540)
- `InheritanceShare.legitime_fraction` is always `""` (engine TODO at step10:541)
- `net_from_estate` is the **primary display value** for each heir's payout
- `ComputationLog.steps` only includes Step 10 currently
- `warnings` array is always `[]` in current engine (step10:619)
- `ManualFlagSchema` included for future compatibility

---

## Exports Summary

Every schema is exported. All inferred TypeScript types (via `z.infer<>`) are
also exported alongside their schemas. This allows consumers to import either:

```typescript
import { PersonSchema, type Person } from "./synthesis/schemas";
```

The `types.ts` and `schemas.ts` synthesis files are **complementary but
independent** — `schemas.ts` does not import from `types.ts`. Both derive
types from the same Rust source analysis.

---

## Items Not Captured (Known Gaps)

| Item | Reason |
|------|--------|
| `Heir` struct (types.rs:493-521) | Engine-internal computed type, not in EngineInput |
| `NarrativeSectionType` enum | Output-only, not needed for input validation |
| `DistributionScenario` | Engine-internal type, not in output JSON |
| Frac fraction reduction/normalization | Engine-side; frontend sends raw n/d |
| SSS funeral expense deduction | Estate calculation, documented in wave-2 aspects |

---

## How to Use schemas.ts in the Wizard

```typescript
// 1. Validate a complete form submission before calling the engine
import { EngineInputSchema, type EngineInput } from "@/lib/schemas";

const result = EngineInputSchema.safeParse(formData);
if (!result.success) {
  const errors = result.error.flatten();
  // Display errors.fieldErrors per-field
}

// 2. Validate engine response before rendering results
import { EngineOutputSchema, type EngineOutput } from "@/lib/schemas";

const output = EngineOutputSchema.parse(engineResponse);
// output.per_heir_shares is typed InheritanceShare[]

// 3. Use cause lookup for disinheritance form
import { CAUSE_BY_RELATIONSHIP } from "@/lib/schemas";

const allowedCauses = CAUSE_BY_RELATIONSHIP[heir.relationship_to_decedent] ?? [];
// Render only applicable cause options in the dropdown
```
