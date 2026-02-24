# Current Stage: 11 (Integration (End-to-End))

## Spec Sections
- Test Vectors: §14 (23 vectors)
- Invariants: §14.2 (10 invariants)
- Edge Cases: §13

## Test Results (updated by loop — iteration 5)
```
running 30 tests
test test_tv01_single_lc_entire_estate ... ok
test test_tv04_spouse_only ... ok
test test_tv05_parents_and_spouse ... ok
test test_computation_log_populated ... ok
test test_tv03_2lc_1ic_ratio ... ok
test test_tv02_married_3lc_spouse_equal ... ok
test test_invariant7_preterition_annuls_all ... ok
test test_tv07_preterition_annuls_will ... ok
test test_tv06_testate_fp_to_charity ... ok
test test_invariant8_disinheritance_zero ... FAILED
test test_invariant2_legitime_floor ... ok
test test_invariant9_collation ... ok
test test_tv10_representation_per_stirpes ... FAILED
test test_tv15_collateral_siblings ... ok
test test_tv08_disinheritance_representation ... FAILED
test test_tv12_inofficious_legacy_spouse_recovery ... FAILED
test test_tv11_collation_cap_inofficious ... FAILED
test test_tv18_escheat_to_state ... ok
test test_tv20_iron_curtain ... ok
test test_tv19_total_renunciation_restart ... ok
test test_tv17_ic_only_equal_shares ... ok
test test_tv16_articulo_mortis ... ok
test test_tv09_adopted_equals_legitimate ... ok
test test_all_heirs_have_narratives ... ok
test test_invariant1_sum_all_vectors ... ok
test test_tv23_ascendant_only ... ok
test test_tv13_cap_rule_triggered ... FAILED
test test_tv21_fideicommissary ... FAILED
test test_tv22_representation_collation ... FAILED
test test_tv14_mixed_succession ... ok

failures:

---- test_invariant8_disinheritance_zero stdout ----
assertion `left == right` failed: Invariant 8: disinherited heir gets 0
  left: 266666666
 right: 0

---- test_tv10_representation_per_stirpes stdout ----
assertion `left == right` failed: Faye: total 285714286 != expected 5000000 pesos
  left: 285714286
 right: 500000000

---- test_tv08_disinheritance_representation stdout ----
assertion `left == right` failed: Invariant 1 (Sum): net_from_estate sum 2133333329 != estate 1600000000
  left: 2133333329
 right: 1600000000

---- test_tv12_inofficious_legacy_spouse_recovery stdout ----
assertion `left == right` failed: Xena: total 500000000 != expected 2500000 pesos
  left: 500000000
 right: 250000000

---- test_tv11_collation_cap_inofficious stdout ----
assertion `left == right` failed: Pilar: net_from_estate 514285715 != expected 3000000 pesos
  left: 514285715
 right: 300000000

---- test_tv13_cap_rule_triggered stdout ----
assertion `left == right` failed: Bianca: total 1000000001 != expected 10000000 pesos
  left: 1000000001
 right: 1000000000

---- test_tv21_fideicommissary stdout ----
assertion `left == right` failed: Invariant 1 (Sum): net_from_estate sum 1249999998 != estate 1000000000
  left: 1249999998
 right: 1000000000

---- test_tv22_representation_collation stdout ----
assertion `left == right` failed: David: net_from_estate 225000000 != expected 6000000 pesos
  left: 225000000
 right: 600000000

failures:
    test_invariant8_disinheritance_zero
    test_tv08_disinheritance_representation
    test_tv10_representation_per_stirpes
    test_tv11_collation_cap_inofficious
    test_tv12_inofficious_legacy_spouse_recovery
    test_tv13_cap_rule_triggered
    test_tv21_fideicommissary
    test_tv22_representation_collation

test result: FAILED. 22 passed; 8 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

## Work Log
- iteration 3: Fixed IntestateByPreterition scenario dispatch (step7) + false preterition from representatives (step6). 14→17 passed, 16→13 failed.
- iteration 4: Fixed step10_finalize heir_name fallback for non-heir beneficiaries (charities, strangers). Used dist.heir_id as fallback when heir not in classified heirs list. Added basic narrative generation for non-heir beneficiaries. 17→20 passed, 13→10 failed. Fixed: TV-06, TV-14, TV-16.
- iteration 5: Fixed collateral sibling classification (TV-15) and total renunciation restart (TV-19). Added collateral categories (Sibling, NephewNiece, OtherCollateral) to HeirCategory/EffectiveCategory. Added blood_type to Person struct. Fixed step1 mutual exclusion to exclude renounced heirs. Added zero-share entries in step10 for renounced/disinherited heirs. 20→22 passed, 10→8 failed. Fixed: TV-15, TV-19.
