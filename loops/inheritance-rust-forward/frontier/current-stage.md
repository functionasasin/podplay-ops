# Current Stage: 11 (Integration (End-to-End))

## Spec Sections
- Test Vectors: §14 (23 vectors)
- Invariants: §14.2 (10 invariants)
- Edge Cases: §13

## Test Results (updated by loop — iteration 7)
```
running 30 tests
test test_computation_log_populated ... ok
test test_invariant2_legitime_floor ... ok
test test_all_heirs_have_narratives ... ok
test test_invariant8_disinheritance_zero ... ok
test test_invariant7_preterition_annuls_all ... ok
test test_invariant1_sum_all_vectors ... ok
test test_tv03_2lc_1ic_ratio ... ok
test test_tv04_spouse_only ... ok
test test_tv02_married_3lc_spouse_equal ... ok
test test_tv05_parents_and_spouse ... ok
test test_tv07_preterition_annuls_will ... ok
test test_tv06_testate_fp_to_charity ... ok
test test_invariant9_collation ... ok
test test_tv08_disinheritance_representation ... ok
test test_tv01_single_lc_entire_estate ... ok
test test_tv18_escheat_to_state ... ok
test test_tv09_adopted_equals_legitimate ... ok
test test_tv10_representation_per_stirpes ... ok
test test_tv16_articulo_mortis ... ok
test test_tv20_iron_curtain ... ok
test test_tv17_ic_only_equal_shares ... ok
test test_tv14_mixed_succession ... ok
test test_tv12_inofficious_legacy_spouse_recovery ... FAILED
test test_tv11_collation_cap_inofficious ... FAILED
test test_tv19_total_renunciation_restart ... ok
test test_tv15_collateral_siblings ... ok
test test_tv13_cap_rule_triggered ... ok
test test_tv23_ascendant_only ... ok
test test_tv22_representation_collation ... ok
test test_tv21_fideicommissary ... ok

failures:

---- test_tv12_inofficious_legacy_spouse_recovery stdout ----

thread 'test_tv12_inofficious_legacy_spouse_recovery' panicked at tests/integration.rs:504:5:
assertion `left == right` failed: Xena: total 500000000 != expected 2500000 pesos
  left: 500000000
 right: 250000000

---- test_tv11_collation_cap_inofficious stdout ----

thread 'test_tv11_collation_cap_inofficious' panicked at tests/integration.rs:513:5:
assertion `left == right` failed: Pilar: net_from_estate 371428572 != expected 3000000 pesos
  left: 371428572
 right: 300000000

failures:
    test_tv11_collation_cap_inofficious
    test_tv12_inofficious_legacy_spouse_recovery

test result: FAILED. 28 passed; 2 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

## Work Log
- iteration 3: Fixed IntestateByPreterition scenario dispatch (step7) + false preterition from representatives (step6). 14→17 passed, 16→13 failed.
- iteration 4: Fixed step10_finalize heir_name fallback for non-heir beneficiaries (charities, strangers). Used dist.heir_id as fallback when heir not in classified heirs list. Added basic narrative generation for non-heir beneficiaries. 17→20 passed, 13→10 failed. Fixed: TV-06, TV-14, TV-16.
- iteration 5: Fixed collateral sibling classification (TV-15) and total renunciation restart (TV-19). Added collateral categories (Sibling, NephewNiece, OtherCollateral) to HeirCategory/EffectiveCategory. Added blood_type to Person struct. Fixed step1 mutual exclusion to exclude renounced heirs. Added zero-share entries in step10 for renounced/disinherited heirs. 20→22 passed, 10→8 failed. Fixed: TV-15, TV-19.
- iteration 6: Fixed disinheritance representation distribution (TV-08, invariant8). Two root causes: (1) step5 add_lc_legitimes gave separate legitimes to degree-2 grandchildren — now filters to degree-1 anchors only. (2) step7 Phase 1 gave disinherited heirs full legitime — now redirects to representatives per stirpes (Art. 923). 22→24 passed, 8→6 failed. Fixed: TV-08, invariant8.
- iteration 7: Three root causes fixed: (1) Intestate formulas I1-I4 counted individual heirs (including degree-2 representatives) instead of degree-1 lines — added get_lc_lines() + distribute_lc_lines() helpers for line-aware distribution per stirpes (Art. 970-982). (2) Step7 intestate path distributed on net_estate instead of estate_base — changed to estate_base so step8 collation properly deducts donations from gross entitlements. (3) Step10 rounding used largest-share-first remainder assignment — changed to largest-remainder (Hare-Niemeyer) method so rounding corrections stay with shares that lost the most from flooring. Also fixed step10 to apply collation (donation deductions) BEFORE rounding so net_from_estate correctly reflects post-collation amounts. 24→28 passed, 6→2 failed. Fixed: TV-10, TV-13, TV-21, TV-22.
