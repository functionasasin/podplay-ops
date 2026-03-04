# Fullstack Rust-WASM Template

Architecture-specific template set for products that combine:
- **Rust computation engine** (deterministic, exact arithmetic, domain logic)
- **WebAssembly bridge** (client-side, no server)
- **React + TypeScript frontend** (Vite, shadcn/ui, Zod, React Hook Form)

## When to Use

Use this template when your product:
1. Has a computation-heavy backend that must be deterministic and auditable
2. Runs entirely client-side (no server, sensitive data stays in browser)
3. Needs a wizard/form UI that feeds structured input to the engine
4. Produces structured output with narratives/explanations

Examples: legal calculators, tax engines, financial planners, compliance checkers.

## What This Template Fixes

This template exists because the original inheritance project needed **7 loops** (3 reverse, 4 forward) due to each loop only speccing/building one layer. The cascade:

1. `inheritance-reverse` specced only the Rust engine
2. `inheritance-frontend-reverse` was needed to map Rust types → TypeScript
3. `inheritance-frontend-forward` built against a mock bridge
4. `inheritance-wasm-forward` was needed to fix type conformance (booleans, null vs undefined, serde strictness)
5. `inheritance-ui-forward` was needed because no design system was specced

This template collapses the work to **2 loops**: one reverse (full-stack spec), one forward (integrated build).

## Template Contents

```
fullstack-rust-wasm/
├── README.md                              # This file
├── reverse/
│   ├── PROMPT.md.template                 # 6-wave reverse loop: domain → engine → bridge → frontend → UI/platform → synthesis
│   └── frontier/
│       └── aspects.md.template            # Pre-structured frontier with all 6 waves (incl. platform layer aspects)
└── forward/
    ├── PROMPT.md.template                 # 7-phase forward loop: engine → WASM → frontend → components → platform → polish → verification
    ├── forward-ralph.sh                   # Multi-workspace runner (Rust + frontend in one loop)
    └── frontier/
        └── stage-plan.md.template         # Stage tracking for multi-phase build
```

## How to Instantiate

### Step 1: Create your loop directories

```bash
PRODUCT="my-product"
mkdir -p loops/${PRODUCT}-reverse/{frontier,analysis,status,input}
mkdir -p loops/${PRODUCT}-forward/{frontier,status,engine,frontend}
```

### Step 2: Copy and customize the reverse loop

```bash
cp loops/_templates/fullstack-rust-wasm/reverse/PROMPT.md.template loops/${PRODUCT}-reverse/PROMPT.md
cp loops/_templates/fullstack-rust-wasm/reverse/frontier/aspects.md.template loops/${PRODUCT}-reverse/frontier/aspects.md
cp loops/_template/loop.sh loops/${PRODUCT}-reverse/loop.sh
chmod +x loops/${PRODUCT}-reverse/loop.sh
```

Edit `PROMPT.md` — replace all `{{PLACEHOLDERS}}`:
- `{{PRODUCT_NAME}}` — human-readable name (e.g., "Philippine Inheritance Distribution Engine")
- `{{LOOP_DIR}}` — loop directory name (e.g., `my-product-reverse`)
- `{{DOMAIN_DESCRIPTION}}` — what the product computes
- `{{DOMAIN_SOURCES}}` — where to find domain knowledge (legal texts, APIs, specs)
- `{{INPUT_DESCRIPTION}}` — what the engine takes as input
- `{{OUTPUT_DESCRIPTION}}` — what the engine produces
- Wave-specific aspects — replace example aspects with your domain's actual aspects

Edit `frontier/aspects.md` — replace placeholders, add domain-specific aspects.

### Step 3: Copy and customize the forward loop

```bash
cp loops/_templates/fullstack-rust-wasm/forward/PROMPT.md.template loops/${PRODUCT}-forward/PROMPT.md
cp loops/_templates/fullstack-rust-wasm/forward/forward-ralph.sh loops/${PRODUCT}-forward/forward-ralph.sh
cp loops/_templates/fullstack-rust-wasm/forward/frontier/stage-plan.md.template loops/${PRODUCT}-forward/frontier/stage-plan.md
chmod +x loops/${PRODUCT}-forward/forward-ralph.sh
```

Edit `PROMPT.md` — replace placeholders with your product's stages, spec references, and domain-specific details.

Edit `forward-ralph.sh` — update `STAGE_NAMES`, `STAGE_DEPS`, and test filter patterns for your stages.

### Step 4: Run the reverse loop first

```bash
cd loops/${PRODUCT}-reverse
./loop.sh
# Produces: docs/plans/${PRODUCT}-spec.md
```

### Step 5: Run the forward loop

```bash
cd loops/${PRODUCT}-forward
./forward-ralph.sh auto
# Builds: engine/ (Rust) → WASM bridge → frontend/ (React)
```

## Key Design Decisions

### Why one reverse loop specs everything

The reverse loop produces a **single spec document** covering all layers:
- Domain rules → Rust types and algorithms
- Rust serde contract → TypeScript types and Zod schemas (strict, matching serde exactly)
- WASM bridge → exported functions, JSON wire format, error contract
- Frontend → component hierarchy, wizard flow, conditional visibility, design system
- Platform layer → auth flow, route table, env config, navigation, database migrations

This prevents the "mock gap" — where the frontend is built against a mock that doesn't match the real engine's strictness requirements. It also prevents the "platform gap" — where the app compiles and passes tests but crashes on first run because auth, env vars, routes, or migrations were never specified.

### Why one forward loop builds everything

The forward loop builds in phases within a single directory:
1. **Phase 1: Engine** — Rust types → pipeline steps → integration tests → fuzz
2. **Phase 2: WASM Bridge** — wasm-bindgen → wasm-pack build → verify round-trip
3. **Phase 3: Frontend Foundation** — Vite scaffold → TS types → Zod schemas → bridge.ts (real WASM, no mock)
4. **Phase 4: Frontend Components** — shared components → wizard steps → results view (all tests hit real engine)
5. **Phase 5: Platform Layer** — auth page, route registration, env config, navigation, boot verification
6. **Phase 6: UI Polish** — design system → restyle → responsive
7. **Phase 7: Completeness Verification** — stub scan → functional completeness audit → build verification

Every frontend test calls the real WASM engine from Phase 3 onward. No mock. No conformance surprises.

### Why Phase 5 (Platform Layer) exists

The inheritance project shipped with all 26 premium stages "complete" but was **unusable on first run**:
- Blank page: `supabase.ts` threw on missing env vars, crashing the entire app
- Auth page was a placeholder stub: "will be implemented in Stage 3" (Stage 3 was Zod Schemas)
- Landing page said "Sign in to continue" with no sign-in button or link
- `/clients/new` route existed as a file but wasn't registered in the router
- Duplicate migration prevented `supabase db push` on a fresh project

Every one of these was a **spec gap** — the reverse loop never analyzed the platform layer. Phase 5 ensures the app is bootable and navigable before any polish work begins.

### Why Phase 7 exists (anti-stub backpressure)

Tests can pass with stubs everywhere — a component that renders `<div/>` compiles and doesn't crash, but it's a broken product. Phase 7 adds two layers of backpressure:

1. **Mechanical (runner-level)**: The `stub_scan()` function in `forward-ralph.sh` greps source files for banned patterns (`todo!()`, `// TODO`, `// STUB`, empty components, etc.) and blocks convergence if any are found. This runs at EVERY stage, not just Phase 7.
2. **Semantic (prompt-level)**: Phase 7 stages require Claude to walk through every feature in the spec and verify it's fully implemented, wired to real data, and handles edge cases. A stub scan catches obvious patterns; the completeness audit catches features that exist but are hollow.

The same principle applies to the reverse loop: the `placeholder-validation` aspect is a hard gate that scans the spec for banned patterns before convergence. Placeholders in the spec cascade directly into stubs in the product.

### Why strict Zod schemas

The spec mandates that Zod schemas use strict mode and match Rust serde exactly:
- Booleans must be `true`/`false`, not `"true"`/`"false"` (serde rejects string booleans)
- Numbers must be numbers, not strings (serde rejects `"123"`)
- `null` not `undefined` for optional fields (serde maps Option to null)
- Enum values match Rust's serde naming convention (PascalCase or snake_case, depending on `#[serde(rename_all)]`)

This is documented in Wave 3 (Bridge Contract) of the reverse loop.
