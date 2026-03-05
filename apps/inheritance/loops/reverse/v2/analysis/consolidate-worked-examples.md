# Analysis: consolidate-worked-examples

**Aspect**: consolidate-worked-examples
**Wave**: 1 (Legal Source Acquisition)
**Depends On**: consolidate-legal-sources
**Status**: Complete

---

## What Was Done

Extracted all test vectors and worked examples from two source files in `loops/inheritance-reverse/analysis/`:

1. `test-vectors.md` — TV-01 through TV-13 (original 13 vectors)
2. `spec-fix-test-vectors.md` — TV-14 through TV-23 (10 additional vectors closing gaps)

Consolidated into: `input/sources/worked-examples.md`

---

## Summary of Findings

### Total Test Vectors: 23

| Range | Source | Focus |
|-------|--------|-------|
| TV-01 to TV-13 | test-vectors.md | Core scenarios (I1, I2, I3, I6, I11, T1, T2, T3, T5a, T5b) |
| TV-14 to TV-23 | spec-fix-test-vectors.md | Gap-fill (MIXED, I5, I7, I13, I15, I-ID, T12-AM, fideicommissary, collation) |

### Scenarios Covered: 17

I1, I2, I3, I5, I6, I7, I11, I13, I15, I-ID, T1, T2, T3, T5a, T5b, T12-AM, MIXED

### Key Computation Patterns Verified

1. **Intestate distribution**: Arts. 980-1014 (I1 through I15)
2. **Testate legitime**: Arts. 888-903 (T1 through T15)
3. **Cap rule (Art. 895 ¶3)**: TV-11 (not triggered), TV-13 (triggered)
4. **Collation (Art. 1061)**: TV-11, TV-22
5. **Art. 911 inofficiousness reduction**: TV-11, TV-12
6. **Preterition (Art. 854)**: TV-07
7. **Valid disinheritance + representation**: TV-08
8. **Adopted child (RA 8552 Sec. 17)**: TV-09 — adopted = legitimate for all purposes
9. **Per stirpes representation (Arts. 970-974)**: TV-08, TV-10, TV-22
10. **Mixed succession (Art. 960(2))**: TV-14 — undisposed FP distributes intestate
11. **Full/half-blood siblings (Art. 1006)**: TV-15 — 2:1 ratio
12. **Articulo mortis (Art. 900 ¶2)**: TV-16 — 3-condition check, ½→⅓ reduction
13. **IC-only (Art. 988)**: TV-17 — equal division, no cap
14. **Escheat (Art. 1011)**: TV-18 — State inherits
15. **Total renunciation (Art. 969)**: TV-19 — Art. 977 bars representation
16. **Iron Curtain (Art. 992)**: TV-20 — illegitimate decedent
17. **Fideicommissary (Art. 863 + Art. 872)**: TV-21 — partial validity, legitime stripped
18. **Representation collation (Art. 1064)**: TV-22 — grandchildren collate parent's donation

### 10 Formal Test Invariants Extracted

1. Sum invariant (from-estate amounts = net estate)
2. Total entitlement invariant (total entitlements = collated estate)
3. Legitime floor (testate: every compulsory heir ≥ legitime)
4. Art. 895 ratio (IC ≤ ½ × LC in testate)
5. Cap invariant (Σ IC legitimes ≤ FP after spouse)
6. Representation invariant (Σ reps in line = ancestor's share)
7. Adoption invariant (adopted share = legitimate share)
8. Preterition invariant (preterition → full intestate)
9. Disinheritance invariant (valid → ₱0, descendants may represent)
10. Scenario consistency (code matches survivor composition)

---

## Artifacts Produced

- `input/sources/worked-examples.md` — 23 test vectors with inputs, distribution tables, verification checks, and narrative examples

---

## Notes for v2 Engine

- All 23 vectors use the same `EngineInput` schema pattern established in v1
- Rounding: TV-08, TV-10, TV-13, TV-22 require Hare-Niemeyer (largest-remainder) to avoid off-by-one centavo errors
- Collation: TV-11 and TV-22 demonstrate the E_adj → from-estate settlement pattern
- BUG-001 (multiple disinheritances) is NOT exercised in these 23 vectors — it requires a dedicated TV with 2+ simultaneous disinheritances; spec must define correct behavior
