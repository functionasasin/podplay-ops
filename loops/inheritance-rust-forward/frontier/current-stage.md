# Current Stage: 12 (Fuzz Invariants (100 random cases))

## Spec Sections
- Fuzz Invariants: 100 randomized cases
- All 10 invariants from §14.2
- Safety checks: sum conservation, no negatives, disinheritance validity

## Test Results (updated by loop — iteration 2)
```
Passed: 99/100
Failed: 1/100

036-testate-simple-fractions-1lc-sp.json:
    INV1 sum_conservation: sum_nfe=101875000 != estate=81500000
```

Remaining failure is a different bug: will institution of "1/1" (entire estate) for a compulsory
heir is not being capped at FP_disposable when a surviving spouse has a compulsory legitime.
The excess over legitime should be limited to FP_disposable, not the raw institution value.

## Work Log
- iteration 3: Fixed IntestateByPreterition scenario dispatch (step7) + false preterition from representatives (step6). 14→17 passed, 16→13 failed.
- iteration 4: Fixed step10_finalize heir_name fallback for non-heir beneficiaries (charities, strangers). Used dist.heir_id as fallback when heir not in classified heirs list. Added basic narrative generation for non-heir beneficiaries. 17→20 passed, 13→10 failed. Fixed: TV-06, TV-14, TV-16.
- iteration 5: Fixed collateral sibling classification (TV-15) and total renunciation restart (TV-19). Added collateral categories (Sibling, NephewNiece, OtherCollateral) to HeirCategory/EffectiveCategory. Added blood_type to Person struct. Fixed step1 mutual exclusion to exclude renounced heirs. Added zero-share entries in step10 for renounced/disinherited heirs. 20→22 passed, 10→8 failed. Fixed: TV-15, TV-19.
- iteration 6: Fixed disinheritance representation distribution (TV-08, invariant8). Two root causes: (1) step5 add_lc_legitimes gave separate legitimes to degree-2 grandchildren — now filters to degree-1 anchors only. (2) step7 Phase 1 gave disinherited heirs full legitime — now redirects to representatives per stirpes (Art. 923). 22→24 passed, 8→6 failed. Fixed: TV-08, invariant8.
- iteration 7: Three root causes fixed: (1) Intestate formulas I1-I4 counted individual heirs (including degree-2 representatives) instead of degree-1 lines — added get_lc_lines() + distribute_lc_lines() helpers for line-aware distribution per stirpes (Art. 970-982). (2) Step7 intestate path distributed on net_estate instead of estate_base — changed to estate_base so step8 collation properly deducts donations from gross entitlements. (3) Step10 rounding used largest-share-first remainder assignment — changed to largest-remainder (Hare-Niemeyer) method so rounding corrections stay with shares that lost the most from flooring. Also fixed step10 to apply collation (donation deductions) BEFORE rounding so net_from_estate correctly reflects post-collation amounts. 24→28 passed, 6→2 failed. Fixed: TV-10, TV-13, TV-21, TV-22.
- iteration 8: Three root causes fixed: (1) check_preterition falsely detected preterition when will had no institutions (TV-12) or when ICs were omitted from LC-only institutions (TV-11). Art. 854 annuls "the institution of heirs" — if none exist, nothing to annul. ICs' FP-based shares are protected by underprovision (Art. 855), not preterition. (2) check_inofficiousness counted ALL donations toward the excess, but donations are handled by collation (Step 8). Now only testamentary dispositions count. (3) Step 7 distributed legacies at original will amounts, ignoring Step 6 inofficiousness reductions. Now uses reduced amounts. 28→30 passed, 2→0 failed. Fixed: TV-11, TV-12. ALL TESTS PASS.
- fuzz iteration 1: Fixed disinheritance extinct-line double-counting (INV1+INV8). Two changes: (1) Step 2 now sets representation_trigger on heirs with extinct lines (disinherited/dead/unworthy with no living representatives) so downstream stages can detect them. (2) Step 5 add_lc_legitimes and add_ic_legitimes now filter out heirs with extinct lines (has_extinct_line check) to avoid distributing per-line legitimes to heirs whose lines were already excluded from line_counts. Previously, a disinherited heir with no children would get a full per-line share even though their line was extinct, inflating the total above the estate. 88→99 fuzz cases passing. 30/30 integration tests still pass. Remaining: case 036 (unrelated FP cap bug).
