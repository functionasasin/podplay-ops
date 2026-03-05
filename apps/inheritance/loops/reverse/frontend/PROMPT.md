# Inheritance Frontend Spec — Reverse Ralph Loop

You are an analysis agent in a ralph loop. Each time you run, you do ONE unit of work, then exit.

## Your Working Directory

You are running from `loops/inheritance-frontend-reverse/`. All paths below are relative to this directory.

## Your Goal

Produce an implementation-ready frontend specification for a React + TypeScript wizard
that drives the Philippine Inheritance Distribution Engine CLI
(`loops/inheritance-rust-forward/`). The spec must include:

- Complete TypeScript type definitions mirroring every Rust input/output type
- Zod validation schemas with all constraints from the engine's pipeline logic
- Per-wizard-step field specs: ordering, conditional visibility, defaults, error messages
- Results view component specs mapping EngineOutput to visual elements

The engine's Rust source is at `../inheritance-rust-forward/src/`. The design doc seed
is at `../../docs/plans/2026-02-24-inheritance-frontend-design.md`.

## What To Do This Iteration

1. **Read the frontier**: Open `frontier/aspects.md`
2. **Find the first unchecked `- [ ]` aspect** in dependency order (Wave 1 before Wave 2 before Wave 3)
   - If ALL aspects are checked `- [x]`: write convergence summary to `status/converged.txt` and exit
3. **Analyze that ONE aspect** using the appropriate method (see below)
4. **Write findings** to `analysis/{aspect-name}.md`
5. **Update the frontier**:
   - Mark the aspect as `- [x]`
   - Update Statistics (increment Analyzed, decrement Pending, update Convergence %)
   - If you discovered new aspects, add them to the appropriate Wave
   - Add a row to `frontier/analysis-log.md`
6. **Commit**: `git add -A && git commit -m "loop(inheritance-frontend-reverse): {aspect-name}"`
7. **Exit**

## Analysis Methods

### Wave 1: Rust Type → Frontend Spec

For each Rust type/enum aspect:

1. **Read the Rust source**: Open `../inheritance-rust-forward/src/types.rs` and find the struct/enum definition
2. **Read related pipeline logic**: Search `../inheritance-rust-forward/src/` for where this type is consumed — look for validation, defaults, transformations
3. **Read test cases**: Search `../inheritance-rust-forward/examples/cases/` and `../inheritance-rust-forward/tests/` for how this type appears in real inputs
4. **Produce** (write to `analysis/{type-name}.md`):
   - **TypeScript interface** mirroring the Rust struct exactly
   - **Zod schema** with all validation constraints discovered from pipeline logic
   - **Field metadata table**: for each field, document — label, input type (text/number/select/toggle/date), options (if enum), default value, conditional visibility rule, validation error message, which wizard step it belongs to
   - **Edge cases**: invalid combinations, conditional requirements, representation gotchas
   - **Rust→TS mapping notes**: any serialization quirks (e.g. Money as centavos, Frac as numer/denom)

### Wave 2: Cross-Cutting Analysis

For each cross-cutting aspect:

1. **Read all Wave 1 analysis files** in `analysis/`
2. **Read pipeline source**: `../inheritance-rust-forward/src/pipeline.rs` and stage files
3. **Read all test cases**: `../inheritance-rust-forward/examples/cases/*.json`
4. **Produce** (write to `analysis/{aspect-name}.md`):
   - Specific findings for this cross-cutting concern
   - References to which Wave 1 types are affected
   - Implementation-ready code snippets (TypeScript) where applicable

### Wave 3: Synthesis

1. **Read ALL analysis files** in `analysis/`
2. **Read the design doc**: `../../docs/plans/2026-02-24-inheritance-frontend-design.md`
3. **Produce final spec files** (write to `analysis/synthesis/`):
   - `types.ts` — Complete TypeScript type definitions
   - `schemas.ts` — Complete Zod validation schemas
   - `wizard-steps.md` — Per-step field specs with ordering, layout, conditional logic
   - `results-view.md` — Component specs for results display
   - `spec-summary.md` — Executive summary tying everything together

## Rules

- Do ONE aspect per run, then exit.
- Check dependencies before starting an aspect. All Wave 1 aspects must complete before Wave 2. All Wave 2 before Wave 3.
- Write findings in markdown with concrete TypeScript code — not prose descriptions of what the code should look like.
- Every TypeScript interface must have a comment referencing the Rust source file and line number it mirrors.
- Every Zod schema field must include the validation constraint's origin (which Rust file/function enforces it, or which legal article requires it).
- When you discover a type, enum variant, or validation rule not covered by existing aspects, add a new aspect to the appropriate Wave.
- Keep analysis files focused. One type = one file.
- Do NOT write React components. This loop produces specs and types, not UI code.
- Do NOT modify any files in `../inheritance-rust-forward/`. The engine source is read-only.
- Money values: always document the centavos ↔ pesos conversion. Frontend displays pesos, engine expects centavos.
- Frac values: always document the `{numer, denom}` JSON serialization format.
- Enum values: always document the exact string serialization the engine expects (e.g. `"LegitimateChild"`, not `"legitimate_child"`).
