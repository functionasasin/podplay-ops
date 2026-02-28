# Current Stage: 13 (Real WASM Engine)

## Spec Sections
- Rust engine: loops/inheritance-rust-forward/
- Compile to WASM, replace mock bridge with real engine

## Test Results (updated by loop — iteration 2)
```

 RUN  v4.0.18 /home/clsandoval/cs/monorepo/loops/inheritance-frontend-forward/app

 ✓ src/wasm/__tests__/wasm-real.test.ts > wasm-real engine > computeWasm() with simple intestate input returns valid EngineOutput > returns an object with all required EngineOutput fields 43ms
 ✓ src/wasm/__tests__/wasm-real.test.ts > wasm-real engine > computeWasm() with simple intestate input returns valid EngineOutput > returns arrays for per_heir_shares, narratives, warnings 2ms
 ✓ src/wasm/__tests__/wasm-real.test.ts > wasm-real engine > computeWasm() with simple intestate input returns valid EngineOutput > returns computation_log as an object with steps array 2ms
 ✓ src/wasm/__tests__/wasm-real.test.ts > wasm-real engine > per_heir_shares[] has one entry per heir in input > single heir produces 1 share entry 3ms
 ✓ src/wasm/__tests__/wasm-real.test.ts > wasm-real engine > per_heir_shares[] has one entry per heir in input > multiple heirs produce matching share entries 2ms
 ✓ src/wasm/__tests__/wasm-real.test.ts > wasm-real engine > narratives[] has one entry per heir > single heir produces 1 narrative entry 1ms
 ✓ src/wasm/__tests__/wasm-real.test.ts > wasm-real engine > narratives[] has one entry per heir > narrative count matches share count 2ms
 ✓ src/wasm/__tests__/wasm-real.test.ts > wasm-real engine > narratives[] has one entry per heir > each narrative has non-empty text 1ms
 ✓ src/wasm/__tests__/wasm-real.test.ts > wasm-real engine > scenario_code is a valid ScenarioCode enum value > simple intestate returns a valid scenario code 2ms
 ✓ src/wasm/__tests__/wasm-real.test.ts > wasm-real engine > scenario_code is a valid ScenarioCode enum value > testate input returns a valid scenario code 2ms
 ✓ src/wasm/__tests__/wasm-real.test.ts > wasm-real engine > succession_type matches input > intestate input (will=null) returns Intestate succession_type 1ms
 ✓ src/wasm/__tests__/wasm-real.test.ts > wasm-real engine > succession_type matches input > testate input returns Testate succession_type 1ms
 ✓ src/wasm/__tests__/wasm-real.test.ts > wasm-real engine > succession_type matches input > intestate scenario_code starts with I 1ms
 ✓ src/wasm/__tests__/wasm-real.test.ts > wasm-real engine > succession_type matches input > testate scenario_code starts with T 1ms
 ✓ src/wasm/__tests__/wasm-real.test.ts > wasm-real engine > computation_log has at least one step > computation_log.steps is non-empty 1ms
 ✓ src/wasm/__tests__/wasm-real.test.ts > wasm-real engine > computation_log has at least one step > each step has step_number, step_name, description 1ms
 ✓ src/wasm/__tests__/wasm-real.test.ts > wasm-real engine > computation_log has at least one step > final_scenario in computation_log matches output scenario_code 1ms
 ✓ src/wasm/__tests__/wasm-real.test.ts > wasm-real engine > computation_log has at least one step > total_restarts is a non-negative integer 1ms
 ✓ src/wasm/__tests__/wasm-real.test.ts > wasm-real engine > output Money fields have centavos property > per_heir_shares Money fields have centavos 1ms
 ✓ src/wasm/__tests__/wasm-real.test.ts > wasm-real engine > output Money fields have centavos property > centavos values are numbers or numeric strings 1ms
 ✓ src/wasm/__tests__/wasm-real.test.ts > wasm-real engine > computeWasm() with invalid input throws/rejects > rejects negative estate centavos 5ms
 ✓ src/wasm/__tests__/wasm-real.test.ts > wasm-real engine > computeWasm() with invalid input throws/rejects > rejects duplicate person IDs 1ms
 ✓ src/wasm/__tests__/wasm-real.test.ts > wasm-real engine > computeWasm() with invalid input throws/rejects > rejects multiple SurvivingSpouse 1ms
 ✓ src/wasm/__tests__/wasm-real.test.ts > wasm-real engine > known scenario: 2 LC + spouse intestate (I2) > returns scenario I2 for 2 LC + spouse intestate 1ms
 ✓ src/wasm/__tests__/wasm-real.test.ts > wasm-real engine > known scenario: 2 LC + spouse intestate (I2) > returns 3 heir shares for 2 LC + spouse 1ms
 ✓ src/wasm/__tests__/wasm-real.test.ts > wasm-real engine > known scenario: single LC intestate (example input) > returns I1 for single LC intestate 1ms
 ✓ src/wasm/__tests__/wasm-real.test.ts > wasm-real engine > known scenario: single LC intestate (example input) > single heir gets the full estate 0ms
 ✓ src/wasm/__tests__/wasm-real.test.ts > wasm-real engine > total shares sum equals estate > single heir: total equals estate 1ms
 ✓ src/wasm/__tests__/wasm-real.test.ts > wasm-real engine > total shares sum equals estate > multiple heirs: total equals estate 1ms
 ✓ src/wasm/__tests__/wasm-real.test.ts > wasm-real engine > total shares sum equals estate > escheat: no shares, total is 0 0ms
 ✓ src/wasm/__tests__/wasm-real.test.ts > wasm-real engine > InheritanceShare structural fields > each share has heir_category as valid EffectiveCategory 1ms
 ✓ src/wasm/__tests__/wasm-real.test.ts > wasm-real engine > InheritanceShare structural fields > each share has inherits_by as OwnRight or Representation 1ms
 ✓ src/wasm/__tests__/wasm-real.test.ts > wasm-real engine > InheritanceShare structural fields > each share has legal_basis as an array 0ms

 Test Files  1 passed (1)
      Tests  33 passed (33)
   Start at  14:44:06
   Duration  2.36s (transform 275ms, setup 190ms, import 375ms, tests 90ms, environment 1.32s)
```

## Work Log
(no iterations yet)
