---
type: idea
name: Philippine Inheritance Distribution Engine
aliases: [inheritance engine, succession calculator, heir share calculator]
status: exploring
tags: [succession, philippines, calculator, ralph-loop, inheritance]
created: 2026-02-23
related_projects: []
related_ideas: [[estate-tax-calculator]]
---

# Philippine Inheritance Distribution Engine

Fully deterministic computation engine for Philippine inheritance distribution under the Civil Code (Book III — Succession) and Family Code. Takes a net distributable estate (after tax) and a structured family tree as input, and produces per-heir peso amounts with plain-English narrative explanations.

## Origin

Companion to the [[estate-tax-calculator]]. The estate-tax engine answers "how much tax does the estate owe?" — this engine answers "who inherits what, and why?"

## Why Separate From Estate Tax

Estate tax and inheritance distribution are distinct legal domains:
- **Estate tax** (NIRC): Government's share — how much the estate owes before distribution
- **Succession** (Civil Code): Family's share — how the remaining estate splits among heirs

The engines chain: gross estate → estate-tax engine → net distributable estate → **this engine** → per-heir amounts with explanations.

## Scope

- **Testate succession**: With a will — validate legitime, distribute free portion per testamentary disposition
- **Intestate succession**: No will — distribute per statutory rules (Arts. 960-1014)
- **Mixed**: Will disposes of only part of the estate
- **Heir types**: Legitimate children, illegitimate children (half-share rule), surviving spouse, legitimate ascendants, adopted children, representation

## Architecture

Fully deterministic (same as estate-tax engine):
- All succession rules codified as pure functions
- Decision trees for heir classification and concurrence
- Legitime fraction tables for every possible heir combination
- Every edge case explicitly handled (preterition, disinheritance, collation, representation)

## Output

Two-part output per computation:
1. **Numbers table** — per-heir breakdown: legitime amount, free portion amount, total
2. **Narrative per heir** — plain English explaining WHY they got that amount, citing specific Civil Code articles

Example: "Maria (illegitimate child) receives ₱500,000. Under Art. 895, her legitime is half that of a legitimate child. Juan (legitimate) receives ₱1,000,000, so Maria's share is ₱500,000."

## Next Step

Reverse ralph loop at `loops/inheritance-reverse/` systematically extracts every succession rule from the Civil Code and produces a spec complete enough for any developer to implement.
