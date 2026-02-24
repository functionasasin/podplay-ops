# Current Stage: 11 (Integration (End-to-End))

## Spec Sections
- Test Vectors: §14 (23 vectors)
- Invariants: §14.2 (10 invariants)
- Edge Cases: §13

## Test Results (updated by loop — iteration 4)
```
running 30 tests
test test_computation_log_populated ... ok
test test_invariant7_preterition_annuls_all ... ok
test test_tv04_spouse_only ... ok
test test_tv02_married_3lc_spouse_equal ... ok
test test_tv03_2lc_1ic_ratio ... ok
test test_invariant8_disinheritance_zero ... FAILED
test test_all_heirs_have_narratives ... ok
test test_tv05_parents_and_spouse ... ok
test test_tv06_testate_fp_to_charity ... ok
test test_tv01_single_lc_entire_estate ... ok
test test_invariant9_collation ... ok
test test_invariant1_sum_all_vectors ... ok
test test_tv07_preterition_annuls_will ... ok
test test_invariant2_legitime_floor ... ok
test test_tv09_adopted_equals_legitimate ... ok
test test_tv15_collateral_siblings ... FAILED
test test_tv12_inofficious_legacy_spouse_recovery ... FAILED
test test_tv11_collation_cap_inofficious ... FAILED
test test_tv10_representation_per_stirpes ... FAILED
test test_tv16_articulo_mortis ... ok
test test_tv19_total_renunciation_restart ... FAILED
test test_tv18_escheat_to_state ... ok
test test_tv20_iron_curtain ... ok
test test_tv17_ic_only_equal_shares ... ok
test test_tv14_mixed_succession ... ok
test test_tv22_representation_collation ... FAILED
test test_tv08_disinheritance_representation ... FAILED
test test_tv21_fideicommissary ... FAILED
test test_tv13_cap_rule_triggered ... FAILED
test test_tv23_ascendant_only ... ok

test result: FAILED. 20 passed; 10 failed; 0 ignored; 0 measured; 0 filtered out

failures:
    test_invariant8_disinheritance_zero
    test_tv08_disinheritance_representation
    test_tv10_representation_per_stirpes
    test_tv11_collation_cap_inofficious
    test_tv12_inofficious_legacy_spouse_recovery
    test_tv13_cap_rule_triggered
    test_tv15_collateral_siblings
    test_tv19_total_renunciation_restart
    test_tv21_fideicommissary
    test_tv22_representation_collation
```

## Remaining Failure Analysis

### Group 1: Collateral heirs not classified (TV-15)
- **Root cause**: `step1_classify` skips siblings/nephews — they return `None` from `raw_category_from_relationship` and are excluded from the heirs list
- **Fix needed**: Add `Sibling`, `NephewNiece`, `OtherCollateral` to `HeirCategory` and `CollateralGroup` to `EffectiveCategory`, update step1 to classify them, set `blood_type`
- **Scope**: types.rs, step1_classify.rs, step2_lines.rs helpers, step4/step8/step9 EffectiveCategory matches, step10 labels

### Group 2: Disinheritance distribution (TV-08, invariant8)
- TV-08 sum is 2133333329 vs expected 1600000000 (over-distribution)
- Invariant 8: disinherited heir gets 266666666 instead of 0
- **Root cause**: Disinherited heir still receives a share in distribution; step7 or step9 not zeroing out validly disinherited heirs

### Group 3: Representation amounts wrong (TV-10, TV-22)
- TV-10: Faye gets 285714286 instead of 500000000
- TV-22: David gets 225000000 instead of 600000000
- **Root cause**: Per-stirpes representation share computation appears incorrect

### Group 4: Testate validation/inofficious (TV-11, TV-12, TV-13)
- TV-11: Pilar gets 514285715 instead of 300000000 (collation+inofficious)
- TV-12: Xena gets 500000000 instead of 250000000 (inofficious legacy)
- TV-13: Bianca gets 1000000001 instead of 1000000000 (off by 1, cap rule)
- **Root cause**: Step 6 inofficious detection or reduction not working correctly

### Group 5: Vacancy resolution (TV-19, TV-21)
- TV-19: No share found for heir 'f' (total renunciation restart)
- TV-21: Sum 1249999998 vs expected 1000000000 (fideicommissary)
- **Root cause**: Step 9 vacancy resolution/restart issues

## Work Log
- iteration 3: Fixed IntestateByPreterition scenario dispatch (step7) + false preterition from representatives (step6). 14→17 passed, 16→13 failed.
- iteration 4: Fixed step10_finalize heir_name fallback for non-heir beneficiaries (charities, strangers). Used dist.heir_id as fallback when heir not in classified heirs list. Added basic narrative generation for non-heir beneficiaries. 17→20 passed, 13→10 failed. Fixed: TV-06, TV-14, TV-16.
