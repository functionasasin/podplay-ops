# Current Stage: 5 (Scenario Coverage)

## Spec Sections
- Scenario vectors: T1-T15, I1-I15 representative cases
- Validate per_heir_shares sum, scenario_code, narrative count

## Test Results (updated by loop — iteration 2)
```

 RUN  v4.0.18 /home/clsandoval/cs/monorepo/loops/inheritance-frontend-forward/app

stderr | src/wasm/__tests__/scenario-coverage.test.ts
using deprecated parameters for `initSync()`; pass a single object instead

 ✓ src/wasm/__tests__/scenario-coverage.test.ts > scenario-coverage: intestate scenarios > I1: single legitimate child gets entire estate 32ms
 ✓ src/wasm/__tests__/scenario-coverage.test.ts > scenario-coverage: intestate scenarios > I2: legitimate children + spouse intestate 2ms
 ✓ src/wasm/__tests__/scenario-coverage.test.ts > scenario-coverage: intestate scenarios > I4: LC + IC + spouse intestate 2ms
 ✓ src/wasm/__tests__/scenario-coverage.test.ts > scenario-coverage: intestate scenarios > I5: ascendants only (parents, no children, no spouse) 2ms
 ✓ src/wasm/__tests__/scenario-coverage.test.ts > scenario-coverage: intestate scenarios > I7: illegitimate children only 1ms
 ✓ src/wasm/__tests__/scenario-coverage.test.ts > scenario-coverage: intestate scenarios > I11: surviving spouse only (no children, no ascendants) 1ms
 ✓ src/wasm/__tests__/scenario-coverage.test.ts > scenario-coverage: intestate scenarios > I13: siblings only (full + half blood) 2ms
 ✓ src/wasm/__tests__/scenario-coverage.test.ts > scenario-coverage: intestate scenarios > I15: escheat — no heirs, estate goes to state 1ms
 ✓ src/wasm/__tests__/scenario-coverage.test.ts > scenario-coverage: testate scenarios > T1: legitimate children with will (FP to charity) 8ms
 ✓ src/wasm/__tests__/scenario-coverage.test.ts > scenario-coverage: testate scenarios > T6: ascendants testate (parents + stranger in will) 3ms
 ✓ src/wasm/__tests__/scenario-coverage.test.ts > scenario-coverage: testate scenarios > T13: no compulsory heirs testate (entire estate disposed by will) 1ms
 ✓ src/wasm/__tests__/scenario-coverage.test.ts > scenario-coverage: cross-cutting invariants > computation_log has multiple pipeline steps for all scenarios 1ms
 ✓ src/wasm/__tests__/scenario-coverage.test.ts > scenario-coverage: cross-cutting invariants > large estate values: exact centavo arithmetic preserved 1ms
 ✓ src/wasm/__tests__/scenario-coverage.test.ts > scenario-coverage: cross-cutting invariants > donation collation: shares account for prior donations 2ms

 Test Files  1 passed (1)
      Tests  14 passed (14)
   Start at  16:42:13
   Duration  1.14s (transform 115ms, setup 103ms, import 93ms, tests 70ms, environment 673ms)
```

## Work Log
(no iterations yet)
