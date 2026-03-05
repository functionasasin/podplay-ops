# Inheritance Sub-Monorepo Design

**Date**: 2026-03-05
**Status**: Approved

## Goal

Consolidate all inheritance-related code, loops, and specs into a single `apps/inheritance/` sub-monorepo. Set up CI to run forward ralph loops on a 6-hour schedule.

## Directory Structure

```
apps/inheritance/
├── engine/                    # Rust computation engine
│   ├── Cargo.toml
│   ├── Cargo.lock
│   ├── src/                   # lib.rs, main.rs, wasm.rs, types.rs, pipeline stages
│   ├── pkg/                   # WASM build output
│   ├── tests/
│   └── examples/              # JSON test cases + fuzz cases
├── frontend/                  # React app (Vite + React 19 + TypeScript)
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── src/
├── specs/                     # All design docs
│   ├── inheritance-engine-spec.md
│   ├── inheritance-platform-spec.md
│   ├── inheritance-premium-spec.md
│   ├── inheritance-frontend-design.md
│   ├── inheritance-v2-spec.md
│   └── estate-tax-engine-spec.md
├── loops/
│   ├── _registry.yaml         # Inheritance-only loop registry
│   ├── reverse/
│   │   ├── core/              # inheritance-reverse
│   │   ├── estate-tax/        # estate-tax-reverse
│   │   ├── frontend/          # inheritance-frontend-reverse
│   │   ├── premium/           # inheritance-premium-reverse
│   │   ├── platform/          # inheritance-platform-reverse
│   │   └── v2/                # inheritance-v2-reverse
│   └── forward/
│       ├── engine/            # Loop config only: PROMPT.md, frontier/, status/
│       ├── frontend/          # Loop config only
│       ├── ui/                # inheritance-ui-forward
│       ├── wasm/              # inheritance-wasm-forward
│       ├── v2/                # inheritance-v2-forward
│       ├── premium/           # inheritance-premium-forward
│       └── platform/          # inheritance-platform-forward
```

## CI Workflow

New file: `.github/workflows/inheritance.yml`

- **Trigger**: Every 6 hours (`0 6,18 * * *`) + `workflow_dispatch`
- **Discovery**: Reads `apps/inheritance/loops/_registry.yaml`, filters for `status == "active"` forward loops
- **Execution per loop**:
  1. Checkout repo with `GH_PAT`
  2. Configure git as `ralph-loop[bot]`
  3. Install Claude Code, Rust toolchain + wasm-pack, Node.js + pnpm
  4. Check convergence/paused status
  5. Run iterations in 6-hour window: `cat PROMPT.md | claude --print --dangerously-skip-permissions`
  6. After each iteration: commit + push
  7. On convergence: create GitHub issue with `ralph-converged` label, update registry

## Migration Mapping

### Code (moves to shared directories)

| Source | Destination |
|--------|------------|
| `loops/inheritance-rust-forward/{src,Cargo.toml,Cargo.lock,pkg,tests,examples}` | `apps/inheritance/engine/` |
| `loops/inheritance-frontend-forward/app/` | `apps/inheritance/frontend/` |

### Loop configs (PROMPT.md + frontier/ + status/ + analysis/ + raw/)

| Source | Destination |
|--------|------------|
| `loops/inheritance-rust-forward/` | `apps/inheritance/loops/forward/engine/` |
| `loops/inheritance-frontend-forward/` | `apps/inheritance/loops/forward/frontend/` |
| `loops/inheritance-ui-forward/` | `apps/inheritance/loops/forward/ui/` |
| `loops/inheritance-wasm-forward/` | `apps/inheritance/loops/forward/wasm/` |
| `loops/inheritance-v2-forward/` | `apps/inheritance/loops/forward/v2/` |
| `loops/inheritance-premium-forward/` | `apps/inheritance/loops/forward/premium/` |
| `loops/inheritance-platform-forward/` | `apps/inheritance/loops/forward/platform/` |

### Reverse loops (all converged)

| Source | Destination |
|--------|------------|
| `loops/inheritance-reverse/` | `apps/inheritance/loops/reverse/core/` |
| `loops/estate-tax-reverse/` | `apps/inheritance/loops/reverse/estate-tax/` |
| `loops/inheritance-frontend-reverse/` | `apps/inheritance/loops/reverse/frontend/` |
| `loops/inheritance-premium-reverse/` | `apps/inheritance/loops/reverse/premium/` |
| `loops/inheritance-platform-reverse/` | `apps/inheritance/loops/reverse/platform/` |
| `loops/inheritance-v2-reverse/` | `apps/inheritance/loops/reverse/v2/` |

### Specs

| Source | Destination |
|--------|------------|
| `docs/plans/inheritance-engine-spec.md` | `apps/inheritance/specs/inheritance-engine-spec.md` |
| `docs/plans/inheritance-platform-spec.md` | `apps/inheritance/specs/inheritance-platform-spec.md` |
| `docs/plans/inheritance-premium-spec.md` | `apps/inheritance/specs/inheritance-premium-spec.md` |
| `docs/plans/2026-02-24-inheritance-frontend-design.md` | `apps/inheritance/specs/inheritance-frontend-design.md` |
| `docs/plans/estate-tax-engine-spec.md` | `apps/inheritance/specs/estate-tax-engine-spec.md` |
| `loops/inheritance-v2-reverse/docs/plans/inheritance-v2-spec.md` | `apps/inheritance/specs/inheritance-v2-spec.md` |

### Registry

- Remove all inheritance/estate-tax entries from `loops/_registry.yaml`
- Create `apps/inheritance/loops/_registry.yaml` with those entries, paths updated

### What stays in place

- `entities/ideas/inheritance-distribution-engine.md` — knowledge graph entity
- `entities/ideas/estate-tax-calculator.md` — knowledge graph entity
- `docs/plans/2026-03-05-inheritance-sub-monorepo-design.md` — this design doc

## PROMPT.md Path Updates

All forward loop PROMPT.md files get path rewrites:

| Old pattern | New pattern |
|------------|------------|
| `loops/inheritance-rust-forward/` | `apps/inheritance/engine/` |
| `loops/inheritance-frontend-forward/app/` | `apps/inheritance/frontend/` |
| `loops/inheritance-v2-forward/engine/` | `apps/inheritance/engine/` |
| `loops/inheritance-v2-forward/frontend/` | `apps/inheritance/frontend/` |
| `docs/plans/inheritance-engine-spec.md` | `apps/inheritance/specs/inheritance-engine-spec.md` |
| `docs/plans/inheritance-*-spec.md` | `apps/inheritance/specs/inheritance-*-spec.md` |
| `loops/inheritance-frontend-reverse/analysis/` | `apps/inheritance/loops/reverse/frontend/analysis/` |

Frontier paths (`frontier/current-stage.md`, `status/converged.txt`) remain relative to each loop dir — no changes needed.

## Approach

Big bang move. All reverse loops are converged, forward loops aren't in CI yet. No transitional state needed.
