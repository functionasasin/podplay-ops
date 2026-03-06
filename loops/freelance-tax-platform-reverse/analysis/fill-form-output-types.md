# Fill Form Output Types — BIR Form Interface Inline

**Aspect:** fill-form-output-types
**Wave:** 7.5c (Spec Self-Containment Fix)
**Status:** COMPLETE
**Date:** 2026-03-06
**Depends on:** spec-review (identified the gap), typescript-types (source of truth)

---

## What Was Done

The spec at `docs/plans/freelance-tax-spec.md` Section 5.3 had a placeholder comment:

```typescript
// BIR Form Output Types (abbreviated — full field list in BIR form mapping docs)
// The complete field list for Form1701AOutput, Form1701Output, Form1701QOutput,
// Form2551QOutput is specified in analysis/typescript-types.md Section 3.
// ...
// (Form output interfaces are large — ~100+ fields each. Forward loop should
//  implement them from analysis/typescript-types.md which has the full specification.)
```

This violated the self-containment requirement: the forward loop reads ONLY `docs/plans/freelance-tax-spec.md`, so any reference to `analysis/typescript-types.md` is a broken dependency.

## Fix Applied

Replaced the placeholder comment with the full TypeScript interface definitions sourced from `analysis/typescript-types.md` Section 3:

1. **`Form1701AOutput`** — 55 fields: header, Part I identity, Part II tax payable (with overpayment disposition booleans), Part III CPA info, Part IV-A OSD path fields, Part IV-B 8% path fields, tax credits
2. **`NolcoScheduleRow`** — 8 fields: NOLCO schedule columns A–F, expiry year, expired flag
3. **`Form1701Output`** — 80+ fields: header, Part I identity, Part II tax payable, Schedule 2 compensation, Schedule 3A graduated rates, Schedule 3B 8% rate, Schedule 4 itemized deductions, Schedule 5 special deductions, Schedule 6 NOLCO entries, Part V tax due, Part VI tax credits
4. **`Form1701QOutput`** — 43 fields: header with quarter, Part I identity, Schedule I graduated, Schedule II 8% method, Schedule III tax credits, Schedule IV penalties
5. **`PT2551QScheduleRow`** — 5 fields: ATC code, tax base, rate, tax due, description
6. **`Form2551QOutput`** — 21 fields: header with `Quarter | 4` (Q4 is valid for 2551Q), Part I identity, Part II tax payable, Schedule 1 rows

## Verification

After the edit:
- No references to `analysis/typescript-types.md` remain in Section 5.3
- `FormOutputUnion` discriminated union references (`Form1701AOutput`, `Form1701Output`, `Form1701QOutput`) are all satisfied by interfaces defined within the same code block
- `Form2551QOutput` is referenced in `TaxComputationResult.ptFormOutput: Form2551QOutput | null` — now self-contained
- The `NolcoScheduleRow` used in `Form1701Output.sched6Entries` is defined before `Form1701Output`
- The `PT2551QScheduleRow` used in `Form2551QOutput.schedule1Rows` is defined before `Form2551QOutput`

## Impact on Forward Loop

The forward loop can now build `src/types/engine-output.ts` completely from the spec:
- `FormView` component: all BIR form field access is type-safe
- `PdfExport` sections: all form output fields are accessible with IntelliSense
- `ResultsView` with `formOutput.fields`: type narrowing via `isForm1701()`, `isForm1701A()`, `isForm1701Q()` works correctly
- Zod output schema: can validate `formOutput` shape without referencing external files

## Status

COMPLETE. The spec is now fully self-contained. The `spec-review` aspect can proceed to final PASS.
