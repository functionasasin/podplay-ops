# Current Stage: 9 (Vacancy Resolution)

## Status: COMPLETE

All 33 step9 tests passing. All 352 tests passing across the full crate.

## Implementation Summary

Implemented vacancy resolution (§10) with the full priority chain:

1. **detect_vacancies** - Detects vacant shares from predecease (without representation), renunciation, incapacity/unworthiness, and valid disinheritance (without representatives).

2. **check_total_renunciation** (Art. 969) - Checks if ALL living members of an effective category group have renounced, triggering next-degree inheritance.

3. **try_substitution** (Art. 859) - Searches will institutions, legacies, and devises for named substitutes. Testate only.

4. **apply_accretion** (Arts. 1015-1021) - Critical Art. 1021 distinction:
   - Legitime vacancy → ScenarioRestart (co-heirs succeed "in their own right")
   - Free portion vacancy → proportional distribution to co-heirs (Art. 1019)

5. **is_legitime_vacancy** - Determines if a vacancy is in the legitime (compulsory heir with from_legitime > 0).

6. **step9_resolve_vacancies** - Main orchestrator implementing:
   - Phase 0: Total renunciation check (Art. 969) → restart
   - Phase 1: Detect individual vacancies
   - Phase 2: Resolve each via priority chain (substitution → representation → accretion → intestate fallback)
   - Max restart guard with warnings
   - Art. 1020: charges follow accreting share (noted in legal_basis)

## Test Fix Note
Fixed test_step9_single_renunciation_accretion_intestate: distribution amounts were bare fractions (1/6, 1/2) summing to 1, but expected total was 100_000_000 (the net estate). Fixed to use absolute centavo amounts consistent with net_estate.
