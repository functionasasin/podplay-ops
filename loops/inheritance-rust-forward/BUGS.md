# Known Bugs

## BUG-001: Multiple disinheritances produce incorrect distribution (sum > estate)

**Severity:** High
**Status:** Open
**Found:** 2026-02-24

### Description

When a will disinherits **2 or more** compulsory heirs simultaneously, the engine produces incorrect distributions where the sum of `net_from_estate` across all heirs exceeds the actual estate value (roughly doubles it).

The existing test suite (TV-08) only tests **single** disinheritance, which works correctly. The bug surfaces when multiple disinheritances are present.

### Reproduction

```json
{
  "net_distributable_estate": {"centavos": 3000000000},
  "decedent": {"id":"d","name":"Roberto","date_of_death":"2026-01-15","is_married":true,
    "date_of_marriage":"2000-01-01","marriage_solemnized_in_articulo_mortis":false,
    "was_ill_at_marriage":false,"illness_caused_death":false,
    "years_of_cohabitation":0,"has_legal_separation":false,"is_illegitimate":false},
  "family_tree": [
    {"id":"lc1","name":"Sandra","is_alive_at_succession":true,"relationship_to_decedent":"LegitimateChild","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null},
    {"id":"lc2","name":"Tomas","is_alive_at_succession":true,"relationship_to_decedent":"LegitimateChild","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null},
    {"id":"lc3","name":"Ursela","is_alive_at_succession":true,"relationship_to_decedent":"LegitimateChild","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null},
    {"id":"sp","name":"Victor","is_alive_at_succession":true,"relationship_to_decedent":"SurvivingSpouse","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null}
  ],
  "will": {
    "institutions": [
      {"id":"i1","heir":{"person_id":"lc1","name":"Sandra","is_collective":false,"class_designation":null},"share":"EntireFreePort","conditions":[],"substitutes":[],"is_residuary":false}
    ],
    "legacies": [], "devises": [],
    "disinheritances": [
      {"heir_reference":{"person_id":"lc2","name":"Tomas","is_collective":false,"class_designation":null},"cause_code":"ChildAttemptOnLife","cause_specified_in_will":true,"cause_proven":true,"reconciliation_occurred":false},
      {"heir_reference":{"person_id":"lc3","name":"Ursela","is_collective":false,"class_designation":null},"cause_code":"ChildGroundlessAccusation","cause_specified_in_will":true,"cause_proven":true,"reconciliation_occurred":false}
    ],
    "date_executed": "2025-06-01"
  },
  "donations": [],
  "config": {"retroactive_ra_11642":false,"max_pipeline_restarts":10}
}
```

### Expected

- Tomas: P0 (disinherited, no children to represent)
- Ursela: P0 (disinherited, no children to represent)
- Sandra: gets legitime + FP
- Victor (spouse): gets spouse share
- **Sum of net_from_estate = P30,000,000**

### Actual

- Sandra: P16,875,000
- Tomas: P16,875,000 (should be P0)
- Ursela: P16,875,000 (should be P0)
- Victor: P9,375,000
- **Sum of net_from_estate = P60,000,000** (2x estate)

### Likely Root Cause

Probably in `step7_distribute.rs` or the interaction between `step6_validation.rs` and `step7_distribute.rs`. When multiple heirs are disinherited, their shares may be double-counted — once in the legitime pool redistribution and once in the intestate distribution. Single disinheritance works because the redistribution logic handles one case correctly but doesn't account for the compounding effect of multiple disinherited heirs.

### Workaround

Use only one disinheritance per will. If multiple disinheritances are needed, this bug must be fixed first.
