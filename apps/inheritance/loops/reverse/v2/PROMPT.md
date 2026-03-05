# Philippine Inheritance Distribution Engine — Full-Stack Reverse Ralph Loop

You are an analysis agent in a ralph loop. Each time you run, you do ONE unit of work, then exit.

This is a **full-stack** reverse loop. You spec ALL layers — Philippine succession law rules, Rust engine algorithms, WASM bridge contract, TypeScript types, React frontend components, and UI design — in a single specification document.

## Your Working Directory

You are running from `loops/inheritance-v2-reverse/`. All paths below are relative to this directory.

## Your Goal

Produce a complete, implementation-ready specification at `docs/plans/inheritance-v2-spec.md` that covers:

1. **Philippine succession law** — every rule, formula, edge case from Civil Code Book III, Family Code, RA 8552, RA 11642
2. **Engine design** — Rust types, 10-step pipeline, BigRational arithmetic, test vectors
3. **Bridge contract** — WASM exported functions, JSON wire format, serde strictness rules
4. **Frontend data model** — TypeScript interfaces (matching Rust serde exactly), Zod schemas (strict mode)
5. **Frontend UI** — wizard component hierarchy, form flow, conditional visibility, results display
6. **Design system** — palette, typography, component library, spacing, visual direction

A developer should be able to build the entire product from this spec alone — Rust engine, WASM bridge, and React frontend — without discovering any type mismatches, missing fields, or serialization surprises at integration time.

## Prior Art

This is a v2 rebuild. The original inheritance project (6 loops, ~150 iterations) is available for reference:

- **Original spec**: `docs/plans/inheritance-engine-spec.md` (~1,200 lines)
- **Original Rust engine**: `loops/inheritance-rust-forward/src/` (types.rs, pipeline steps)
- **Original frontend types**: `loops/inheritance-frontend-forward/app/src/types/index.ts`
- **Original frontend schemas**: `loops/inheritance-frontend-forward/app/src/schemas/index.ts`
- **Original WASM bridge**: `loops/inheritance-frontend-forward/app/src/wasm/bridge.ts`
- **Original UI**: `loops/inheritance-frontend-forward/app/src/components/`
- **Original analysis files**: `loops/inheritance-reverse/analysis/` (33 aspect analyses)

You may reference these for domain knowledge, but the v2 spec must be **self-contained** — it must stand alone as the single source of truth for the v2 forward loop.

## What To Do This Iteration

1. **Read the frontier**: Open `frontier/aspects.md`
2. **Find the first unchecked `- [ ]` aspect** in dependency order (Wave 1 before Wave 2, etc.)
   - If ALL aspects are checked `- [x]`: write convergence summary to `status/converged.txt` and exit
3. **Analyze that ONE aspect** using the appropriate method for its wave
4. **Write findings** to `analysis/{aspect-name}.md`
5. **Update the frontier**:
   - Mark the aspect as `- [x]`
   - Update Statistics (increment Analyzed, decrement Pending, update Convergence %)
   - If you discovered new aspects, add them to the appropriate Wave
   - Add a row to `frontier/analysis-log.md`
6. **If this is a synthesis aspect (Wave 6)**, also append to or update the spec document at `docs/plans/inheritance-v2-spec.md`
7. **Commit**: `git add -A && git commit -m "loop(inheritance-v2-reverse): {aspect-name}"`
8. **Exit**

## Analysis Methods By Wave

### Wave 1: Legal Source Acquisition
**Goal**: Gather and cache raw Philippine succession law knowledge.

- Primary sources: Civil Code Book III (Arts. 774-1105), Family Code (Arts. 163-193), RA 8552, RA 11642
- Reference the original analysis files at `loops/inheritance-reverse/analysis/` — they contain pre-extracted rules
- Save consolidated source material to `input/sources/`
- Focus on extracting rules, NOT re-fetching web content that's already cached

**Method**: Read original analysis files, consolidate into clean source documents.

### Wave 2: Domain Rule Extraction
**Goal**: Extract every computation rule from the consolidated sources.

- Heir classification, eligibility gates, filiation proof requirements
- Concurrence rules (who inherits together, who excludes whom)
- Representation rights (per stirpes, collateral limits)
- Adopted/illegitimate children's rights
- Legitime computation (fraction table for all 30 scenarios)
- Free portion rules (FP_gross vs FP_disposable)
- Intestate distribution (15 scenarios, Iron Curtain Rule)
- Testate validation (preterition, disinheritance, inofficiousness, underprovision)
- Collation (Arts. 1061-1077)
- Accretion and vacancy resolution

**Method**: Read original analysis files for pre-extracted rules. Consolidate and validate. Fix the known BUG-001 (multiple disinheritances) in the spec by specifying correct redistribution logic.

### Wave 3: Engine Design
**Goal**: Design the Rust engine — types, pipeline, algorithms, test vectors.

- Define ALL data types with exact Rust field names and types
- Design the 10-step pipeline with clear inputs/outputs per step
- Specify algorithms with BigRational arithmetic
- Write 20+ test vectors covering all 30 scenarios
- Define 10 invariants
- **Fix BUG-001**: Specify the correct algorithm for multiple simultaneous disinheritances in step7_distribute.rs — batch-process all disinheritances, then recompute scenario and distribute once (not per-disinheritance)

**Synthesis artifacts**:
- Complete Rust type definitions (as spec pseudocode)
- Pipeline step descriptions with I/O types
- Test vectors with expected peso amounts
- Invariant definitions

### Wave 4: Bridge Contract
**Goal**: Specify the exact WASM boundary.

This wave prevents integration failures between frontend and engine.

- WASM exported function: `compute_json(input: &str) -> Result<String, String>`
- JSON wire format — exact serde rules:
  - `#[serde(deny_unknown_fields)]` on all input types
  - `#[serde(rename_all = "snake_case")]` for struct fields
  - `#[serde(rename_all = "PascalCase")]` for enum variants (match original engine)
  - Booleans: `true`/`false` only (NOT strings)
  - Money.centavos: number or string (for BigInt support)
  - Optional fields: `null` in JSON (NOT absent, NOT `undefined`)
  - Dates: ISO-8601 strings
  - Fractions: `"numer/denom"` string format
- Error contract: validation errors vs computation errors vs panic recovery
- Initialization: `initSync()` for Node.js/vitest, `init()` for browser

### Wave 5: Frontend Data Model + UI Design
**Goal**: Spec the complete frontend — types, schemas, components, visual design.

#### 5a: TypeScript Types + Zod Schemas
- Map every Rust struct → TypeScript interface (exact field names)
- Map every Rust enum → TypeScript union (exact variant names matching serde)
- Zod schemas in strict mode:
  - `z.object({}).strict()` — rejects unknown fields
  - `z.boolean()` — NOT `z.coerce.boolean()`
  - `z.number()` — NOT `z.coerce.number()`
  - `z.nullable()` — NOT `z.optional()` for serde Option fields
- Per-field metadata: labels, input types, defaults, conditional visibility, validation messages

#### 5b: Component Hierarchy + Wizard Flow
- 6-step wizard: Estate → Decedent → Family Tree → Will → Donations → Review
- Conditional: Will step only shown if hasWill=true
- Results view: header, distribution table/chart, narrative panel, warnings, computation log
- Shared components: MoneyInput (₱ prefix, centavos↔pesos), DateInput, FractionInput, PersonPicker, EnumSelect

#### 5c: Design System (Fresh Exercise)
- Choose palette appropriate for a legal/financial tool (NOT reusing Navy+Gold — fresh direction)
- Choose typography pairing (UI font + legal/narrative font)
- Component library: shadcn/ui (Radix + Tailwind CSS 4)
- Spacing philosophy
- Key patterns: form cards, badges for heir categories, severity-based alerts

### Wave 6: Synthesis
**Goal**: Assemble everything into the final spec document.

- Compile `docs/plans/inheritance-v2-spec.md` from all analysis files
- Cross-layer consistency check:
  - Rust struct field names ↔ JSON wire format ↔ TypeScript interface fields ↔ Zod schema fields
  - Enum variant names match across all layers (PascalCase)
  - Optional/nullable handling matches across all layers (null, not undefined)
  - Money serialization consistent (centavos as number or string)
- Add Cross-Layer Consistency Checklist section
- Add integration test scenarios (form → JSON → WASM → result → display)
- Self-review: "Could a developer build the entire product from this spec alone?"

## Output: The Spec Document

The final spec at `docs/plans/inheritance-v2-spec.md` must contain:

```
§1  Overview (Philippine inheritance distribution calculator, target users: lawyers/estate planners)
§2  Computation Pipeline (10-step deterministic pipeline with restart conditions)
§3  Data Model (all Rust types with field descriptions)
§4  Heir Classification (compulsory heirs, eligibility gate, filiation proof)
§5  Representation (per stirpes, collateral limits, Art. 970-977)
§6  Legitime Computation (fraction table for all 30 scenarios, cap rule, FP pipeline)
§7  Distribution (intestate 15 scenarios, testate, mixed succession)
§8  Collation (Arts. 1061-1077, imputation, estate base)
§9  Testate Validation (preterition, disinheritance, inofficiousness, underprovision)
§10 Vacancy Resolution (substitution, representation, accretion, intestate fallback)
§11 Narrative Templates (per-heir plain-English explanations with article citations)
§12 Rounding (BigRational → centavos, Hare-Niemeyer method)
§13 Bridge Contract
    §13.1 WASM Export Signature
    §13.2 JSON Wire Format (serde rules)
    §13.3 Error Contract
    §13.4 Initialization (Node.js vs Browser)
§14 TypeScript Types (interfaces matching §3 exactly)
§15 Zod Schemas (strict mode, matching §13.2 exactly)
§16 Frontend Architecture
    §16.1 Wizard Steps (6 steps, fields, conditional visibility)
    §16.2 Results View (components, data mapping)
    §16.3 Shared Components (MoneyInput, DateInput, etc.)
§17 Design System
    §17.1 Palette (CSS custom properties)
    §17.2 Typography
    §17.3 Component Patterns
§18 Test Vectors (20+ with expected peso amounts)
§19 Invariants (10 formal rules)
§20 Cross-Layer Consistency Checklist
§21 Edge Cases + Manual Review Flags
Appendix A: Civil Code Quick Reference
Appendix B: Glossary
```

## Rules

- Do ONE aspect per run, then exit.
- Check dependencies before starting an aspect.
- Write findings in markdown with specific numbers, formulas, and examples.
- Discover new aspects and add them to the frontier.
- Keep analysis files focused. One aspect = one file.
- The spec is the artifact. Everything else is scaffolding.
- **Cross-layer consistency is paramount.** A field name mismatch between Rust and TypeScript means a runtime crash.
- **Fix BUG-001**: The v2 spec must correctly handle multiple simultaneous disinheritances.
- **Fresh design**: Do NOT copy the Navy+Gold palette from v1. Exercise fresh design judgment for the legal/financial domain.
- Reference original analysis files freely, but the v2 spec must be self-contained.

## Commit Convention

```
loop(inheritance-v2-reverse): {aspect-name}
```
