# Spec Draft — Wave 6 Synthesis

**Aspect**: spec-draft
**Wave**: 6 (Synthesis)
**Depends On**: All Waves 1–5 (26 analysis files)

---

## Summary

Assembled `docs/plans/inheritance-v2-spec.md` (2,929 lines, 21 sections + 2 appendices)
from all 26 analysis files.

## Structure Produced

| Section | Content | Lines (approx) |
|---|---|---|
| §1 Overview | Purpose, legal scope, capabilities | 50 |
| §2 Computation Pipeline | 10-step design, PipelineState, orchestrator, restart triggers | 120 |
| §3 Data Model — Rust Types | All 49 types: enums, structs, serde attributes | 400 |
| §4 Heir Classification | G1–G4, eligibility gates, adoption rules, Art. 890 | 100 |
| §5 Representation | 4 triggers, per stirpes algorithm, collateral limit, Art. 976/977 | 80 |
| §6 Legitime Computation | Full 30-scenario fraction table, Art. 895 cap algorithm | 150 |
| §7 Distribution | Testate + intestate (all 15 scenarios), Iron Curtain, collateral sub-algo | 120 |
| §8 Collation | 14-category matrix, E_adj, imputation, Art. 911 reduction | 100 |
| §9 Testate Validation | Preterition, BUG-001 fix, inofficiousness, underprovision, condition stripping | 120 |
| §10 Vacancy Resolution | 4-step chain, Art. 1021 distinction, matrix | 60 |
| §11 Narrative Templates | Per-heir format, standard templates, article citations | 50 |
| §12 Rounding | Hare-Niemeyer algorithm + properties | 50 |
| §13 Bridge Contract | WASM export, wire format, error contract, initialization | 250 |
| §14 TypeScript Types | All interfaces (input + output), tagged unions | 300 |
| §15 Zod Schemas | Input schemas, output schemas, tagged unions, file layout | 250 |
| §16 Frontend Architecture | Wizard steps, results view, shared components | 250 |
| §17 Design System | Palette (CSS vars), typography, component library, patterns | 150 |
| §18 Test Vectors | 19 selected vectors with expected amounts, coverage map | 200 |
| §19 Invariants | 10 global + 5 pipeline invariants | 100 |
| §20 Cross-Layer Consistency | Field names, enum variants, nullability, tagged enums, money | 100 |
| §21 Edge Cases | Manual review flags, automatic handling, invariant violations | 80 |
| Appendix A | Civil Code quick reference (30 articles) | 60 |
| Appendix B | Glossary (30+ terms) | 80 |

## Key Decisions Captured

1. **BUG-001 fix**: Batch-process all simultaneous disinheritances → single ScenarioCode recompute
2. **EffectiveGroup as string**: NOT a Rust enum; stored as `Option<String>` with values "G1".."G4"
3. **T5 single variant**: No T5a/T5b in ScenarioCode; n=1 vs n≥2 handled internally
4. **Money wire format**: Input accepts number OR string; output always number
5. **Option<T> = null not absent**: Never use `skip_serializing_if`; TypeScript uses `T | null` not `T | undefined`
6. **Zod `.strict()` on input only**: Mirrors `deny_unknown_fields`; output schemas omit `.strict()`
7. **Fresh design palette**: Archival jade green + copper accent + warm stone neutrals (NOT navy+gold)
8. **WASM dual-path init**: Promise-based singleton guard; Node.js = `initSync` + `fs.readFileSync`; browser = `initAsync()`

## Cross-Layer Consistency Notes

- EffectiveGroup shorthand "G1"-"G4" consistent across Rust → JSON → TypeScript → Zod → UI labels
- All 22 DisinheritanceGround variants ("Art919_1".."Art921_6") consistent across all layers
- All 30 ScenarioCode variants consistent (single flat T5, not T5a/T5b)
- Tagged enum discriminants: `type`/`code`/`flag`/`error_type` consistent Rust ↔ TypeScript
- Money serialization: InputMoney (`number | string`) ↔ OutputMoney (`number`) explicit in all layers

## Status

Spec document written. Pending: cross-layer-consistency aspect (spot-check all types) and spec-review aspect (developer build simulation).
