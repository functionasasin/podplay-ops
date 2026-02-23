---
type: idea
name: Philippine Estate Tax Calculator
aliases: [estate tax engine, BIR 1801 calculator]
status: exploring
tags: [tax, philippines, calculator, ralph-loop]
created: 2026-02-23
related_projects: []
---

# Philippine Estate Tax Calculator

End-to-end computation engine for Philippine estate tax under the TRAIN Law (RA 10963). The goal is a **fully locked-down core logic engine** — no frontend, no UI concerns — just a pure computation module that takes structured inputs and produces the complete BIR Form 1801 output.

## Origin

Restart of a previous project. The key insight this time: use a **reverse Ralph loop** to systematically extract every computation rule from the legal sources (NIRC Sections 84-97, RR 12-2018, BIR Form 1801 guidelines) and produce a spec so complete that any developer with zero tax knowledge can implement the engine.

## Why Reverse Ralph

The "reference material" here isn't a video — it's **legal text**. But the pattern is identical:

1. **Input**: Legal sources (NIRC, Revenue Regulations, BIR Form 1801, case law)
2. **Analysis loop**: Extract one rule/provision per iteration, map it to computation logic
3. **Output**: Complete software specification for the computation engine

The laws are the "video" — the reverse loop watches them and extracts the formula.

## Architecture Options

### Option A: Fully Deterministic (Recommended for core)
- All computation rules codified as pure functions
- Decision trees for classification (property regime, residency, asset type)
- Every edge case explicitly handled
- **Pros**: Auditable, testable, predictable, fast, no API costs
- **Cons**: Requires exhaustive rule extraction upfront (which is exactly what the reverse ralph does)

### Option B: Hybrid (Deterministic core + Agentic intake)
- Deterministic computation engine (Option A)
- Agentic layer on top for: natural language asset description → structured classification, ambiguous situation interpretation, generating plain-English explanations of results
- **Pros**: Better UX, handles real-world messiness
- **Cons**: More complex, agentic layer can hallucinate classifications

### Option C: Fully Agentic
- LLM reads laws and computes on every invocation
- **Pros**: Flexible, zero upfront codification
- **Cons**: Non-deterministic (fatal for tax computation), expensive, slow, can hallucinate numbers
- **Verdict**: Not appropriate for financial/legal computation. Rejected.

## Recommended Approach

**Option A for the engine, Option B as a future wrapper.**

The reverse Ralph loop produces a spec for Option A. A future forward Ralph loop or separate project can add the agentic intake layer.

## What the Engine Computes

The engine mirrors BIR Form 1801 exactly:

1. **Gross Estate** (exclusive + conjugal/communal, by asset category)
2. **Ordinary Deductions** (ELIT, vanishing deduction, public transfers)
3. **Special Deductions** (standard, family home, medical, RA 4917)
4. **Net Share of Surviving Spouse**
5. **Net Taxable Estate**
6. **Estate Tax Due** (6% flat rate)
7. **Penalties** (surcharge + interest for late filing)
8. **Tax Credits** (foreign estate tax, prior payments)
9. **Total Amount Payable**

## Next Step

Set up `loops/estate-tax-reverse/` with the reverse Ralph loop to systematically extract all rules from the legal sources.
