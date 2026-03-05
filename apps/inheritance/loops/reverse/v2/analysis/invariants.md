# Invariants — Philippine Inheritance Engine v2

**Aspect**: invariants
**Wave**: 3 (Engine Design)
**Depends On**: rust-types, pipeline-design, algorithms, test-vectors, all Wave 2 aspects

---

## Overview

This document specifies **10 global formal invariants** that must hold for every valid
`(ComputationInput, ComputationOutput)` pair produced by the v2 engine. These invariants
are the authoritative contracts for:

1. **Unit tests** — assert each invariant on every test vector (TV-01 through TV-N27, TV-MD-*)
2. **Property-based tests** — generate random valid inputs; confirm invariants hold
3. **Integration tests** — verify after full WASM round-trip

Sub-domain invariants (disinheritance, vacancy, intestate, rounding) are captured in their
respective analysis files and cross-referenced here where they narrow or specialize a global
invariant.

---

## Global Invariants

---

### INV-1 — Centavo Conservation

```
Σ(heir.from_estate_centavos for h in output.heirs) == output.net_distributable_estate_centavos
```

**Plain language**: No centavo is lost, created, or double-counted.

**Scope**: All inputs (testate, intestate, mixed succession). Holds after Hare-Niemeyer rounding.

**Rust assertion**:
```rust
let sum: i64 = output.heirs.iter().map(|h| h.from_estate_centavos).sum();
assert_eq!(sum, output.net_distributable_estate_centavos,
    "INV-1: centavo conservation violated: sum={sum}, expected={}",
    output.net_distributable_estate_centavos);
```

**Notes**:
- `from_estate_centavos` covers only the estate portion. Collated donations already returned to
  heirs are accounted for separately in `collation_adjustment_centavos`.
- Rounding adjustments (`RoundingAdjustment`) may assign an extra ±1 centavo to one heir; this
  is still INV-1 compliant because the total remains exact.
- Escheated estate (Art. 1011) is treated as a "State heir" in the distribution; it participates
  in INV-1.

**Sub-domain cross-reference**: Narrows intestate-distribution INV-1 (total conservation).

---

### INV-2 — Entitlement = Collation-Adjusted Estate

```
Σ(heir.total_entitlement_centavos for h in output.heirs) == output.collation_adjusted_estate_centavos
```

**Plain language**: When donations are present, total entitlements (estate + collation credit)
equal the collation-adjusted estate E_adj, not the raw net estate E.

**Scope**: All inputs. When no donations exist, `E_adj == E` so INV-2 reduces to INV-1.

**Rust assertion**:
```rust
let sum: i64 = output.heirs.iter().map(|h| h.total_entitlement_centavos).sum();
assert_eq!(sum, output.collation_adjusted_estate_centavos,
    "INV-2: entitlement sum={sum} != E_adj={}",
    output.collation_adjusted_estate_centavos);
```

**Notes**:
- `total_entitlement_centavos = from_estate_centavos + collation_credit_centavos`
- E_adj >= E (Art. 1061: collation only adds donation value back; never subtracts below E)

---

### INV-3 — Legitime Floor

```
For every compulsory heir h in output.heirs where h.is_compulsory_heir == true:
  h.from_estate_centavos + h.collation_credit_centavos >= h.legitime_centavos
```

**Plain language**: A compulsory heir's combined receipt (estate + collation credit) is never
less than their legitime. The will may give more; never less.

**Scope**: Testate and mixed succession only. In pure intestate, `legitime_centavos` is null
(the concept does not apply).

**Rust assertion**:
```rust
for h in output.heirs.iter().filter(|h| h.is_compulsory_heir) {
    let received = h.from_estate_centavos + h.collation_credit_centavos;
    let floor = h.legitime_centavos.unwrap_or(0);
    assert!(received >= floor,
        "INV-3: legitime floor violated for {}: received={received} < floor={floor}",
        h.heir_id);
}
```

**Notes**:
- Underprovision (heir given less than legitime by will) is detected in step 7 and corrected
  in step 9 by taking from the free portion.
- Preterited heirs have `from_estate_centavos >= legitime_centavos` after Art. 854 applies
  (their institutions replace the will's omission).

---

### INV-4 — Art. 895 Ratio (Regime A, T4/T5 Scenarios)

```
For scenarios T4 and T5 (LC + IC both present in testate):
  each_ic_legitime_rational <= per_lc_legitime_rational / 2
```

**Plain language**: Each IC's legitime is at most half of each LC's legitime. This is the
Art. 895 "half-portion rule" for illegitimate children when both LC and IC are present
in testate succession.

**Scope**: Scenarios T4 (LC + IC, no spouse) and T5a/T5b (LC + IC + spouse). Does NOT
apply in intestate (I3/I4) where the 2:1 ratio is direct and uncapped.

**Rust assertion** (using BigRational before rounding):
```rust
if matches!(state.scenario_code, Some(T4) | Some(T5a) | Some(T5b)) {
    let per_lc = state.legitime_result.as_ref().unwrap().per_lc_rational.clone();
    for ic in state.legitime_result.as_ref().unwrap().ic_entries.iter() {
        assert!(ic.legitime_rational <= per_lc.clone() / BigRational::from(2),
            "INV-4: Art.895 ratio violated for IC {}: {} > {}/2",
            ic.heir_id, ic.legitime_rational, per_lc);
    }
}
```

**Notes**:
- After Hare-Niemeyer rounding, integer centavos satisfy: `ic_centavos <= (lc_centavos / 2) + 1`
  (the `+1` handles the rounding remainder).
- Regime B (T8/T9) applies a flat ¼ per IC for legitime; Art. 895 does not apply.
- Cap rule (INV-5) is a companion constraint.

---

### INV-5 — Aggregate IC Cap (Regime A)

```
For scenarios T4, T5a, T5b, T6, T7 (any testate with IC):
  Σ(ic_legitime_centavos) <= fp_available_after_spouse_centavos
```

**Plain language**: The total of all IC legitimes must fit within the free portion remaining
after the spouse has been satisfied. If not, the IC shares are scaled down proportionally
until they do (Art. 895 cap rule).

**Scope**: Regime A testate scenarios with at least one IC and at least one LC.

**Rust assertion**:
```rust
if regime_is_a_with_ic(&state) {
    let ic_total: i64 = state.legitime_result.as_ref().unwrap()
        .ic_entries.iter().map(|e| e.legitime_centavos).sum();
    let fp_after_spouse = state.legitime_result.as_ref().unwrap()
        .fp_available_after_spouse_centavos;
    assert!(ic_total <= fp_after_spouse,
        "INV-5: IC aggregate cap violated: ic_total={ic_total} > fp={fp_after_spouse}");
}
```

**Notes**:
- In Regime B (T8/T9), each IC's ¼ share is computed against its own share of the estate;
  the cap constraint takes a different form and is not subject to INV-5.
- INV-4 and INV-5 are both required simultaneously; a set of IC shares can satisfy INV-4
  individually but still violate INV-5 in aggregate.

---

### INV-6 — Per Stirpes Slot Conservation

```
For every represented heir H with exclusion (disinheritance, predecease, incapacity):
  Σ(r.from_estate_centavos for r in representatives_of(H)) == H.slot_centavos ± 1
```

**Plain language**: Representatives collectively receive exactly what their excluded
principal would have received. The ±1 tolerance is for Hare-Niemeyer rounding within
the slot.

**Scope**: Any scenario where representation applies (Arts. 970–977).

**Rust assertion**:
```rust
for (heir_id, slot) in state.representation_slots.iter() {
    let reps: Vec<&HeirDistribution> = output.heirs.iter()
        .filter(|h| h.represented_heir_id.as_deref() == Some(heir_id))
        .collect();
    if !reps.is_empty() {
        let rep_sum: i64 = reps.iter().map(|r| r.from_estate_centavos).sum();
        assert!((rep_sum - slot.centavos).abs() <= 1,
            "INV-6: slot conservation violated for {heir_id}: reps={rep_sum}, slot={}",
            slot.centavos);
    }
}
```

**Notes**:
- Renouncing heir's descendants can NEVER represent (Art. 977). INV-6 does not apply to
  renunciations (the slot accretes per Art. 1018 instead).
- Multi-level representation is recursive; the invariant applies at every level.

**Sub-domain cross-reference**: Narrows INV-MD-5 (representation slot value == excluded heir's).

---

### INV-7 — Adoption Equivalence

```
For every RA 8552 adopted child A and every biological legitimate child LC in the same
scenario position:
  A.from_estate_centavos == LC.from_estate_centavos (within ±1 for rounding)
```

**Plain language**: An adopted child's share is identical to a biological legitimate child's
share in the same positional slot. RA 8552 Sec. 17 grants full equivalence.

**Scope**: All scenarios. Adopted children are classified as `HeirType::LegitimateChild`
with `is_adopted = true`; they participate in all LC group computations identically.

**Rust assertion**:
```rust
let lc_shares: Vec<i64> = output.heirs.iter()
    .filter(|h| h.heir_type == HeirType::LegitimateChild)
    .map(|h| h.from_estate_centavos)
    .collect();
// All LC shares (including adopted) must be within ±1 of each other
if let (Some(&min), Some(&max)) = (lc_shares.iter().min(), lc_shares.iter().max()) {
    assert!(max - min <= 1,
        "INV-7: adoption equivalence violated: lc_shares={lc_shares:?}");
}
```

**Notes**:
- RA 11642 legitimated children are also treated as LC. INV-7 applies equally.
- Representation within the LC group can create different per-heir amounts (multiple
  representatives sharing one slot). The invariant applies at the slot level, not the
  individual representative level.

---

### INV-8 — Preterition Totality

```
If output.preterition_detected == true:
  output.succession_type == SuccessionType::Intestate
  OR output.succession_type == SuccessionType::Mixed  (if devises/legacies remain)
  AND output.testamentary_institutions_annulled == true
```

**Plain language**: When preterition is detected (Art. 854), ALL testamentary institutions
are annulled. The succession type changes to intestate (or mixed if devises/legacies remain).
There is no partial preservation of institutions.

**Scope**: Testate scenarios where at least one compulsory heir in the direct line is
completely omitted from the will.

**Rust assertion**:
```rust
if output.preterition_detected {
    assert!(output.testamentary_institutions_annulled,
        "INV-8: preterition detected but institutions not annulled");
    assert!(matches!(output.succession_type,
        SuccessionType::Intestate | SuccessionType::Mixed),
        "INV-8: preterition detected but succession_type is still Testate");
}
```

**Notes**:
- Only G1/G2 (direct-line) compulsory heirs trigger preterition. Preterition of a spouse
  does NOT trigger Art. 854 (Art. 854 scope is limited to forced heirs in direct line).
- Devises and legacies survive preterition in mixed succession (Art. 854 ¶1), subject to
  inofficiousness reduction (Art. 911).

---

### INV-9 — Disinheritance Exclusion

```
For every heir d where d.exclusion_reason == ExclusionReason::ValidDisinheritance:
  d.from_estate_centavos == 0
  d.total_entitlement_centavos == 0
```

**Plain language**: A validly disinherited heir receives nothing from the estate and has
zero total entitlement. Representatives may receive the slot (INV-6), but the principal
receives nothing.

**Scope**: All testate scenarios where `disinheritances` is non-empty.

**Rust assertion**:
```rust
for h in output.heirs.iter()
    .filter(|h| h.exclusion_reason == Some(ExclusionReason::ValidDisinheritance))
{
    assert_eq!(h.from_estate_centavos, 0,
        "INV-9: disinherited heir {} has non-zero from_estate={}", h.heir_id, h.from_estate_centavos);
    assert_eq!(h.total_entitlement_centavos, 0,
        "INV-9: disinherited heir {} has non-zero total_entitlement={}", h.heir_id, h.total_entitlement_centavos);
}
```

**Notes**:
- Reconciled disinheritances (Art. 922) must produce `ExclusionReason::None` (the heir is
  not disinherited at all).
- Invalid disinheritances (Art. 918) produce `ExclusionReason::InvalidDisinheritance` and
  do NOT exclude the heir; INV-9 does not apply to them.
- Batch disinheritance (BUG-001 fix): all disinheritances are applied simultaneously before
  `determine_scenario_code()` is called. INV-9 is verified after the single scenario
  recompute, not after each individual disinheritance.

**Sub-domain cross-reference**: Narrows INV-MD-4 (eligible cannot also have ValidDisinheritance).

---

### INV-10 — Scenario Consistency

```
determine_scenario_code(output.classified_heirs, output.will_present)
  == output.scenario_code
```

**Plain language**: After the pipeline completes, the scenario code computed from the
final classified heir set matches the scenario code used in all legitime and distribution
computations. The scenario code is computed exactly once per pipeline pass, after all
heir eligibility mutations.

**Scope**: All inputs. Must hold for the terminal pipeline pass (after all restarts).

**Rust assertion**:
```rust
let recomputed = determine_scenario_code(&output.classified_heirs, output.will_present);
assert_eq!(recomputed, output.scenario_code,
    "INV-10: scenario consistency violated: recomputed={recomputed:?}, used={:?}",
    output.scenario_code);
```

**Notes**:
- `determine_scenario_code()` must be pure (no side effects) to be safely callable in
  assertions.
- Called at most once per pipeline pass (BUG-001 fix ensures this; see INV-MD-1).
- On restart, the scenario code is recomputed from the updated `classified_heirs` set.
  The invariant applies to the FINAL pass, not intermediate restart states.

---

## Pipeline Invariants (Structural)

These govern the pipeline execution itself, not just input/output pairs.

### PINV-1 — Termination

```
state.restart_count <= MAX_RESTARTS (== 10)
```

The pipeline always terminates. MAX_RESTARTS == 10 is set in `pipeline.rs`. Each restart
removes at least one heir from the active pool or changes the scenario code deterministically,
guaranteeing progress toward a fixed point.

### PINV-2 — Monotonic Heir Eligibility Change

```
On any restart from step 3:
  |classified_heirs_base| >= |classified_heirs after restart|
```

Restarts can only exclude heirs (disinheritance, preterition). They never introduce new
heirs who were not in `classified_heirs_base` (representation additions are re-derived from
the base, not accumulated across restarts).

### PINV-3 — Step Ordering

Steps execute in exactly this order per pass: 1→2→3→4→5→6→7→8→9→10. A restart to step N
clears and re-executes steps N through 10. Steps 1 and 2 are never re-executed after
the first pass.

### PINV-4 — Idempotent Base Classification

```
classified_heirs_base is set exactly once (step 2) and never mutated thereafter.
```

All mutations (representation, disinheritance exclusion, preterition annulment) operate
on `classified_heirs` (the working copy), never on `classified_heirs_base`.

### PINV-5 — Log Append-Only

```
|computation_log| is non-decreasing across all pipeline steps.
```

Log entries are never removed or modified. Each step appends at least one `ComputationLogEntry`.

---

## Sub-Domain Invariants (Cross-References)

These invariants are defined in domain-specific analysis files. They specialize the global
invariants for particular scenarios.

| Sub-Domain | File | Invariants |
|------------|------|------------|
| Batch disinheritance (BUG-001) | `analysis/multiple-disinheritance-fix.md` | INV-MD-1 through INV-MD-8 |
| Vacancy resolution | `analysis/vacancy-resolution.md §13` | 10 invariants (priority chain, Art. 977, Art. 1021, etc.) |
| Intestate distribution | `analysis/intestate-distribution.md §13` | 10 invariants (total conservation, no FP, G1 excludes G2, etc.) |
| Rounding | `analysis/algorithms.md §1` | Sum == total_centavos exactly |
| Collation | `analysis/collation.md` | E_adj >= E (collation non-deflation) |
| Representation | `analysis/representation.md` | Per stirpes, per capita switch (Art. 975) |

---

## Invariant Test Matrix

Each invariant applies to specific scenario classes:

| Invariant | Intestate (I1–I15) | Testate (T1–T15) | Mixed | BUG-001 | Notes |
|-----------|:-:|:-:|:-:|:-:|-------|
| INV-1 (centavo conservation) | ✓ | ✓ | ✓ | ✓ | Universal |
| INV-2 (entitlement = E_adj) | ✓ | ✓ | ✓ | ✓ | Universal |
| INV-3 (legitime floor) | — | ✓ | ✓ | ✓ | Testate only |
| INV-4 (Art. 895 ratio) | — | T4/T5 only | — | — | Regime A |
| INV-5 (IC cap) | — | T4–T7 | — | — | Regime A with IC |
| INV-6 (per stirpes slot) | ✓ | ✓ | ✓ | ✓ | When representation applies |
| INV-7 (adoption equivalence) | ✓ | ✓ | ✓ | ✓ | When adopted heirs present |
| INV-8 (preterition totality) | — | ✓ | ✓ | — | When preterition detected |
| INV-9 (disinheritance exclusion) | — | ✓ | ✓ | ✓ | When valid disinheritance |
| INV-10 (scenario consistency) | ✓ | ✓ | ✓ | ✓ | Universal |

---

## Rust Assertion Helper (Engine Test Suite)

Recommended pattern for running all invariants in a single function:

```rust
pub fn assert_all_invariants(
    input: &ComputationInput,
    output: &ComputationOutput,
    state: &PipelineState,
) {
    assert_inv1(output);
    assert_inv2(output);
    assert_inv3(output);
    assert_inv4(state);
    assert_inv5(state);
    assert_inv6(output, state);
    assert_inv7(output);
    assert_inv8(output);
    assert_inv9(output);
    assert_inv10(output, state);
    assert_pinv1(state);
    assert_pinv2(state);
}

/// Call this from every test vector function:
/// ```
/// let (input, output, state) = engine.compute(tv.input);
/// assert_all_invariants(&input, &output, &state);
/// assert_eq!(output.heirs, tv.expected_heirs);
/// ```
```

---

## Violation Response Protocol

When an invariant is violated in production (WASM output):

1. **INV-1/INV-2 violation** → Panic with `ComputationError::InternalInconsistency`. Never
   return a result where centavos do not balance.
2. **INV-3 violation** → Panic. Legitime floor is a legal guarantee; returning a wrong
   result is worse than returning an error.
3. **INV-4/INV-5 violation** → Panic with `ComputationError::CapRuleViolation`.
4. **INV-6 violation** → Panic with `ComputationError::InternalInconsistency`.
5. **INV-7 violation** → This is a classification bug (step 2). Panic.
6. **INV-8 violation** → This is a preterition detection bug (step 7). Panic.
7. **INV-9 violation** → This is a disinheritance application bug (step 7). Panic.
8. **INV-10 violation** → This is a pipeline state bug. Panic with diagnostic info.
9. **PINV-1 violation** → `ComputationError::MaxRestartsExceeded` with `MANUAL_REVIEW` flag.

---

## Edge Cases

1. **All heirs excluded**: All disinherited + no representatives → Art. 1011 escheat to State.
   INV-1 still holds (State is a "heir" slot in the output). INV-3 is vacuously satisfied
   (no compulsory heirs with shares).

2. **Zero estate**: `net_estate_centavos == 0`. INV-1 holds trivially (all shares = 0).
   INV-3 holds vacuously. Engine still runs all 10 steps (for narrative output).

3. **Single heir**: INV-1 satisfied (one heir gets 100%). INV-6 vacuously satisfied (no slots
   to divide). Hare-Niemeyer rounding is trivial.

4. **Collation > estate**: When `Σ(donations) > net_estate`, `E_adj` is still positive
   (only collatable donations are added; the estate itself cannot go negative). A CollationDebt
   warning is emitted and MANUAL_REVIEW is flagged. INV-2 still holds.

5. **Restart chain**: Disinheritance restart → preterition detected → second restart.
   INV-10 holds at the terminal pass. The intermediate restarts may temporarily violate INV-10
   (correct; they are not complete outputs).
