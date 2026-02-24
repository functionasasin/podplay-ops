# Current Stage: 12 (Fuzz Invariants (100 random cases))

## Spec Sections
- Fuzz Invariants: 100 randomized cases
- All 10 invariants from §14.2
- Safety checks: sum conservation, no negatives, disinheritance validity

## Test Results (updated by loop — iteration 6)
```
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.01s
     Running tests/fuzz_invariants.rs (target/debug/deps/fuzz_invariants-d9d7cdb13b9fc557)

running 1 test
test test_fuzz_invariants ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.05s
```

## Work Log
- iteration 3: Fixed IntestateByPreterition scenario dispatch (step7) + false preterition from representatives (step6). 14→17 passed, 16→13 failed.
- iteration 4: Fixed step10_finalize heir_name fallback for non-heir beneficiaries (charities, strangers). Used dist.heir_id as fallback when heir not in classified heirs list. Added basic narrative generation for non-heir beneficiaries. 17→20 passed, 13→10 failed. Fixed: TV-06, TV-14, TV-16.
- iteration 5: Fixed collateral sibling classification (TV-15) and total renunciation restart (TV-19). Added collateral categories (Sibling, NephewNiece, OtherCollateral) to HeirCategory/EffectiveCategory. Added blood_type to Person struct. Fixed step1 mutual exclusion to exclude renounced heirs. Added zero-share entries in step10 for renounced/disinherited heirs. 20→22 passed, 10→8 failed. Fixed: TV-15, TV-19.
- iteration 6: Fixed disinheritance representation distribution (TV-08, invariant8). Two root causes: (1) step5 add_lc_legitimes gave separate legitimes to degree-2 grandchildren — now filters to degree-1 anchors only. (2) step7 Phase 1 gave disinherited heirs full legitime — now redirects to representatives per stirpes (Art. 923). 22→24 passed, 8→6 failed. Fixed: TV-08, invariant8.
- iteration 7: Three root causes fixed: (1) Intestate formulas I1-I4 counted individual heirs (including degree-2 representatives) instead of degree-1 lines — added get_lc_lines() + distribute_lc_lines() helpers for line-aware distribution per stirpes (Art. 970-982). (2) Step7 intestate path distributed on net_estate instead of estate_base — changed to estate_base so step8 collation properly deducts donations from gross entitlements. (3) Step10 rounding used largest-share-first remainder assignment — changed to largest-remainder (Hare-Niemeyer) method so rounding corrections stay with shares that lost the most from flooring. Also fixed step10 to apply collation (donation deductions) BEFORE rounding so net_from_estate correctly reflects post-collation amounts. 24→28 passed, 6→2 failed. Fixed: TV-10, TV-13, TV-21, TV-22.
- iteration 8: Three root causes fixed: (1) check_preterition falsely detected preterition when will had no institutions (TV-12) or when ICs were omitted from LC-only institutions (TV-11). Art. 854 annuls "the institution of heirs" — if none exist, nothing to annul. ICs' FP-based shares are protected by underprovision (Art. 855), not preterition. (2) check_inofficiousness counted ALL donations toward the excess, but donations are handled by collation (Step 8). Now only testamentary dispositions count. (3) Step 7 distributed legacies at original will amounts, ignoring Step 6 inofficiousness reductions. Now uses reduced amounts. 28→30 passed, 2→0 failed. Fixed: TV-11, TV-12. ALL TESTS PASS.
- iteration 9 (fuzz iter 3): Fixed INV1 sum_conservation failure in case 036 (1 LC + spouse, institution for 1/1 of estate). Root cause: Step 7 Phase 2 did not cap institution FP excess at fp_disposable. Institution value 1/1 × estate produced excess over legitime of 1/2 estate, but FP_disposable was only 1/4 estate. Added remaining_fp tracking throughout Phase 2 — all institution and legacy FP allocations are now capped at available FP. 99→100 passed, 1→0 failed.
