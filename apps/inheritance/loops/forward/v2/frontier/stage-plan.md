# Stage Plan — Philippine Inheritance Distribution Engine v2

## Phase Overview

| Phase | Name | Workspace | Stages | Status |
|-------|------|-----------|--------|--------|
| 1 | Engine Core | engine/ (cargo test) | 0-12 | pending |
| 2 | WASM Bridge | engine/ → frontend/ (wasm-pack) | P2-1, P2-2 | pending |
| 3 | Frontend Foundation | frontend/ (vitest + real WASM) | P3-1, P3-2, P3-3 | pending |
| 4 | Frontend Components | frontend/ (vitest + real WASM) | P4-1 — P4-7 | pending |
| 5 | UI Polish | frontend/ (vitest + CSS check) | P5-1, P5-2, P5-3 | pending |

**Total: 25 stages across 5 phases**

## Current Stage

Not started. Run `./forward-ralph.sh auto` to begin.

## Stage Details

### Phase 1: Engine Core (13 stages)
| Stage | Name | Test Filter | Deps |
|-------|------|-------------|------|
| 0 | Scaffold + Types + Fractions | `fraction` | — |
| 1 | Classify Heirs | `step1` | 0 |
| 2 | Build Lines | `step2` | 1 |
| 3 | Succession Type + Scenario | `step3` | 1 |
| 4 | Compute Estate Base | `step4` | 0 |
| 5 | Compute Legitimes + FP | `step5` | 3 |
| 6 | Testate Validation | `step6` | 5 |
| 7 | Distribute Estate | `step7` | 2, 5, 6 |
| 8 | Collation Adjustment | `step8` | 4, 7 |
| 9 | Vacancy Resolution | `step9` | 7 |
| 10 | Finalize + Narrate | `step10` | 7, 8, 9 |
| 11 | Integration Tests (E2E) | `--test integration` | 0-10 |
| 12 | Fuzz Invariants (4 passes) | `--test fuzz_invariants` | 11 |

### Phase 2: WASM Bridge (2 stages)
| Stage | Name | Test Method | Deps |
|-------|------|-------------|------|
| P2-1 | WASM Export | `cargo check --target wasm32` | 12 |
| P2-2 | WASM Build + Copy | `wasm-pack build` + artifact check | P2-1 |

### Phase 3: Frontend Foundation (3 stages)
| Stage | Name | Test Filter | Deps |
|-------|------|-------------|------|
| P3-1 | Vite + React Scaffold | `smoke` | P2-2 |
| P3-2 | Types + Schemas | `schemas` | P3-1 |
| P3-3 | WASM Bridge (Real) | `bridge` | P3-2, P2-2 |

### Phase 4: Frontend Components (7 stages)
| Stage | Name | Test Filter | Deps |
|-------|------|-------------|------|
| P4-1 | Shared Form Components | `shared` | P3-3 |
| P4-2 | Wizard Shell + Estate + Decedent | `wizard` | P4-1 |
| P4-3 | Family Tree Step | `family` | P4-2 |
| P4-4 | Will Step | `will` | P4-3 |
| P4-5 | Donations + Review | `donation\|review` | P4-4 |
| P4-6 | Results View | `results` | P4-5 |
| P4-7 | Validation + Integration | `integration\|e2e` | P4-6 |

### Phase 5: UI Polish (3 stages)
| Stage | Name | Test Filter | Deps |
|-------|------|-------------|------|
| P5-1 | Design System Setup | `.` (all) + CSS > 20KB | P4-7 |
| P5-2 | Component Restyle | `.` (all) + CSS > 20KB | P5-1 |
| P5-3 | Responsive + Polish | `.` (all) + CSS > 20KB | P5-2 |

## Completed Stages

(None yet)

## Notes

- Phase 1 tests: `cargo test {filter}` in engine/
- Phase 2 tests: `cargo check --target wasm32` + `wasm-pack build` + artifact verification + copy to frontend
- Phase 3-5 tests: `npx vitest run {filter}` in frontend/ — all hit real WASM engine
- No mocks. Phase 3 Stage P3-3 wires real WASM before any components are built.
- Phase 5 adds CSS bundle size check: `npm run build` must produce CSS > 20KB
- Stage 12 (fuzz) requires 4 consecutive passes for stability
- Spec source of truth: `docs/plans/inheritance-v2-spec.md`
