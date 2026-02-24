# Current Stage: 11 (Integration (End-to-End))

## Spec Sections
- Test Vectors: §14 (23 vectors)
- Invariants: §14.2 (10 invariants)
- Edge Cases: §13

## Test Results (updated by loop — iteration 3)
```
running 30 tests
test test_computation_log_populated ... ok
test test_tv04_spouse_only ... ok
test test_tv03_2lc_1ic_ratio ... ok
test test_all_heirs_have_narratives ... ok
test test_invariant9_collation ... ok
test test_tv01_single_lc_entire_estate ... ok
test test_tv05_parents_and_spouse ... ok
test test_invariant2_legitime_floor ... ok
test test_invariant7_preterition_annuls_all ... ok
test test_tv02_married_3lc_spouse_equal ... ok
test test_invariant8_disinheritance_zero ... FAILED
test test_tv06_testate_fp_to_charity ... FAILED
test test_tv07_preterition_annuls_will ... ok
test test_tv18_escheat_to_state ... ok
test test_invariant1_sum_all_vectors ... ok
test test_tv12_inofficious_legacy_spouse_recovery ... FAILED
test test_tv17_ic_only_equal_shares ... ok
test test_tv16_articulo_mortis ... FAILED
test test_tv11_collation_cap_inofficious ... FAILED
test test_tv10_representation_per_stirpes ... FAILED
test test_tv08_disinheritance_representation ... FAILED
test test_tv09_adopted_equals_legitimate ... ok
test test_tv19_total_renunciation_restart ... FAILED
test test_tv13_cap_rule_triggered ... FAILED
test test_tv15_collateral_siblings ... FAILED
test test_tv14_mixed_succession ... FAILED
test test_tv23_ascendant_only ... ok
test test_tv20_iron_curtain ... ok
test test_tv21_fideicommissary ... FAILED
test test_tv22_representation_collation ... FAILED

test result: FAILED. 17 passed; 13 failed; 0 ignored; 0 measured; 0 filtered out

Failure categories:
- Testate FP distribution (TV-06, TV-14): stranger/charity shares not found
- Representation (TV-10, TV-22): per-stirpes amounts wrong
- Disinheritance (TV-08, invariant8): disinherited heir still receives share
- Cap rule (TV-13): off by 1 centavo
- Collateral siblings (TV-15): sum = 0
- Inofficiousness (TV-11, TV-12): wrong amounts after reduction
- Articulo mortis (TV-16): nephew share not found
- Fideicommissary (TV-21): sum exceeds estate
- Vacancy/restart (TV-19): heir not found after restart
```

## Work Log
- iteration 3: Fixed IntestateByPreterition scenario dispatch (step7) + false preterition from representatives (step6). 14→17 passed, 16→13 failed.
