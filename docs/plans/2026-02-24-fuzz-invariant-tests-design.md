# Fuzz Invariant Tests for Inheritance Engine

**Date:** 2026-02-24
**Status:** Approved

## Problem

The existing 30 integration tests only cover explicitly stated test vectors. BUG-001 (multiple disinheritances producing sum > estate) was missed because TV-08 only tests single disinheritance. We need randomized test cases that exercise combinatorial edge cases.

## Approach

**Approach A: Python generator + Rust invariant test**

1. Python script generates ~100 JSON fixtures with randomized but structurally valid inputs
2. Single Rust `#[test]` loads all fixtures, runs `run_pipeline()`, checks all 10 invariants

## Python Generator (`examples/generate-fuzz-cases.py`)

- Fixed seed for reproducibility
- Reuses helper patterns from `generate-testate-cases.py`
- 100 cases weighted toward complexity:
  - 15 intestate simple (1-6 LC, with/without spouse)
  - 10 intestate with illegitimate children
  - 10 intestate ascendants/collaterals
  - 10 testate simple institutions
  - 15 testate with disinheritances (1-4, with/without representing children)
  - 10 testate with legacies
  - 10 testate with donations/collation
  - 10 mixed/complex (representation, renunciation, preterition, articulo mortis)
  - 10 stress/edge (large families, tiny estates, single heir)

## Rust Test (`tests/fuzz_invariants.rs`)

Single `#[test]` checking all 10 invariants per case:
1. Sum conservation: `sum(net_from_estate) == estate`
2. Legitime floor: no negative shares
3. IC/LC ratio (testate only, when both present)
4. IC cap (testate only)
5. Representation sum equals ancestor share
6. Adoption equality
7. Preterition annulment
8. Disinheritance validity (disinherited heir with no children gets 0)
9. Collation sum: `sum(net_from_estate) == net_estate`
10. Scenario consistency (I-prefix for intestate, T-prefix for testate)

Plus safety checks: no single share > estate, no negative net_from_estate, no panics.

Inapplicable invariants are skipped per case (not failed).

## Files

| File | Action |
|------|--------|
| `examples/generate-fuzz-cases.py` | New |
| `examples/fuzz-cases/*.json` | New (generated) |
| `tests/fuzz_invariants.rs` | New |

No changes to existing files. No new Rust dependencies.
