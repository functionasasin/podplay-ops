# Analysis: consolidate-legal-sources

**Aspect**: consolidate-legal-sources
**Wave**: 1 (Legal Source Acquisition)
**Status**: Complete

---

## Goal

Read original analysis files from `loops/inheritance-reverse/analysis/` (33 aspects, ~1.2 MB),
consolidate Civil Code Book III, Family Code, RA 8552, and RA 11642 succession rules into
clean source documents under `input/sources/`. This gives Wave 2 a single, authoritative
reference without re-fetching web content.

---

## Method

Surveyed and read the following original analysis files:

| File | Key Content |
|------|------------|
| `legal-source-fetch.md` | Source inventory; 4 cached source docs confirmed complete |
| `compulsory-heirs-categories.md` | Art. 887 rules, 4 effective groups, eligibility gate |
| `heir-concurrence-rules.md` | T1–T15/I1–I15 scenario codes, concurrence algorithms |
| `legitime-table.md` | Complete 15-scenario fraction table, cap rule algorithm |
| `intestate-order.md` | All 15 intestate scenarios, Iron Curtain Rule |
| `collation.md` | Arts. 1061–1077 rules, collatability matrix |
| `disinheritance-rules.md` | Arts. 915–923, 22 grounds, reconciliation, BUG-001 |
| `representation-rights.md` | Arts. 970–977, 4 triggers, per stirpes algorithm |

---

## Output Files Created

| File | Contents |
|------|---------|
| `input/sources/civil-code-succession.md` | Complete Civil Code Book III (Arts. 774–1105): general provisions, legitime (Arts. 886–914), disinheritance (Arts. 915–923), intestate succession (Arts. 960–1014), representation (Arts. 970–977), accretion (Arts. 1015–1023), collation (Arts. 1061–1077) |
| `input/sources/family-code-filiation.md` | FC Arts. 163–182: legitimate/illegitimate classification, filiation proof (Arts. 172, 175), Art. 176 unified illegitimate legitime (½ of legitimate), legitimated children (Arts. 177–179) |
| `input/sources/ra-8552-adoption.md` | RA 8552 Secs. 16–20: adopted = legitimate, stepparent adoption exception, rescission effects. RA 11642 note (same substantive rights, administrative adoption) |
| `input/sources/key-rules-summary.md` | Quick reference: 4 groups, T1–T15 table, I1–I15 table, representation, disinheritance grounds, collation rules, BUG-001 fix spec, article citation index |

---

## Key Findings

### Finding 1: Source Completeness

The original analysis files are comprehensive. No gaps that would block Wave 2. The primary
sources (Arts. 774–1105 CC, FC Arts. 163–182, RA 8552) are fully documented across the 33
analysis files.

### Finding 2: Single Illegitimate Classification (FC Art. 176)

The Family Code abolished the Civil Code's three-tier system:
- Old: acknowledged natural / natural by legal fiction / other illegitimate
- New (FC 176): ALL illegitimate children get **½ of a legitimate child's legitime** uniformly

**Engine impact**: One `ILLEGITIMATE_CHILD` category. No sub-tiers.

### Finding 3: Adopted = Legitimate (RA 8552 Sec. 17)

Adopted children under RA 8552 and RA 11642 are treated **identically** to legitimate biological
children. The engine uses `ADOPTED_CHILD` as a raw category that maps to `LEGITIMATE_CHILD_GROUP`.
Exception: stepparent adoption (biological parent is adopter's spouse) preserves dual succession.

### Finding 4: 30 Scenario Codes (T1–T15, I1–I15)

All 30 scenarios are cleanly enumerable based on which of the 4 effective groups survive.
The scenario code is the pivot for all computation — both legitime fractions (Wave 2) and
distribution algorithms (Wave 3+).

### Finding 5: BUG-001 Documented

The original v1 spec had a bug: when 2+ compulsory heirs are disinherited simultaneously,
the engine processed each disinheritance sequentially and recomputed the scenario after each
removal. This produced incorrect results because the scenario code should be computed ONCE
after all disinheritances are applied.

**v2 fix specification** (captured in `key-rules-summary.md` §5):
```
1. Collect all valid disinheritances
2. Remove ALL disinherited heirs from eligible heir set
3. Add their eligible descendants as representatives
4. Compute scenario code ONCE on the final eligible set
5. Distribute based on single scenario computation
```

### Finding 6: Iron Curtain Rule (Art. 992)

Hard barrier in intestate succession: illegitimate children cannot inherit from the
**legitimate relatives** of their biological parents. This is an engine filter applied
only in intestate mode; it does not affect testate legitime computation.

### Finding 7: Articulo Mortis Exception (Art. 900 ¶2)

Applies **only** in scenario T12 (spouse as sole compulsory heir). Reduces spouse's legitime
from ½ to ⅓ if:
- Marriage was in articulo mortis (at point of death)
- Decedent died within 3 months of marriage
- UNLESS cohabitation exceeded 5 years

Engine needs: `marriage_in_articulo_mortis: bool` and `cohabitation_years: u32` fields on
the estate input.

---

## Source Coverage Assessment

| Topic | Coverage | Notes |
|-------|----------|-------|
| Compulsory heirs (Art. 887) | Complete | All 4 groups, eligibility gate |
| Legitime fractions T1–T15 | Complete | Full table with formulas |
| Cap rule (Art. 895 ¶3) | Complete | Algorithm documented |
| Intestate distribution I1–I15 | Complete | All 15 scenarios |
| Iron Curtain (Art. 992) | Complete | |
| Representation (Arts. 970–977) | Complete | 4 triggers, per stirpes, collateral limit |
| Disinheritance (Arts. 915–923) | Complete | 22 grounds across 3 categories |
| Preterition (Art. 854) | Complete | |
| Inofficiousness (Arts. 909–911) | Complete | Reduction order |
| Collation (Arts. 1061–1077) | Complete | 14-category matrix |
| Accretion (Arts. 1015–1023) | Complete | Art. 1021 legitime vs FP distinction |
| FC filiation (Arts. 163–182) | Complete | Art. 176 unified rule confirmed |
| RA 8552 adoption | Complete | Secs. 16, 17, 18, 20 |
| RA 11642 | Noted | Same substantive rights; administrative adoption only |

---

## Readiness for Wave 2

All Wave 2 aspects can begin:
- `heir-classification` → `input/sources/civil-code-succession.md` (Art. 887), `family-code-filiation.md`
- `heir-concurrence` → `input/sources/key-rules-summary.md` §2–3
- `representation` → `input/sources/civil-code-succession.md` §VI
- `legitime-fractions` → `input/sources/key-rules-summary.md` §2
- `intestate-distribution` → `input/sources/key-rules-summary.md` §3
- `testate-validation` → `input/sources/civil-code-succession.md` §III
- `collation` → `input/sources/civil-code-succession.md` §X
- `vacancy-resolution` → `input/sources/civil-code-succession.md` §VII
- `multiple-disinheritance-fix` → `input/sources/key-rules-summary.md` §5 (BUG-001 fix spec)
