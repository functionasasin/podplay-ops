# Spec Patch: Narrative Templates — Section 10 Expansion

**Aspect**: spec-patch-narratives
**Wave**: 5 (Synthesis — Spec Patch)
**Depends On**: explainer-format, spec-draft, spec-review

---

## What Was Done

Replaced the bare-bones Section 10 of `docs/plans/inheritance-engine-spec.md` with a complete, standalone narrative template system covering all 19 `NarrativeSectionType` values.

## Changes Made

### Section 10 Expanded (1484-1570 → 1484-~2100)

**Added subsections:**

| Subsection | Content |
|------------|---------|
| 10.2 | Data model: `HeirNarrative` struct + complete `NarrativeSectionType` enum (19 values) |
| 10.3 | Narrative composition order diagram (fixed pipeline order) |
| 10.4 | HEADER — 5 variants: standard, collation, zero-share, donation-return, reduced voluntary |
| 10.5 | SUCCESSION_TYPE — 4 variants: intestate, testate, mixed, preterition-converted |
| 10.6 | CATEGORY — 8 variants: LC, adopted, legitimated, IC (with filiation), spouse, ascendant, voluntary heir, legatee/devisee, collateral/State |
| 10.7 | LEGITIME — 8 templates: LC (Art. 888), IC uncapped, IC capped (Art. 895 ¶3), spouse Regime A/B/C/alone, spouse+ascendants+IC (Art. 899), ascendant (Arts. 889-890) |
| 10.8 | INTESTATE_SHARE — 12 templates: I1-I15 scenarios (equal shares, 2:1 ratio, ascendants, IC only, spouse alone, spouse+siblings, collaterals, escheat) |
| 10.9 | CAP_RULE — 1 template (Art. 895 ¶3 applied) |
| 10.10 | FREE_PORTION — 3 variants: voluntary heir, compulsory heir above legitime, mixed succession undisposed FP |
| 10.11 | REPRESENTATION — trigger mapping (predecease/disinheritance/incapacity/unworthiness) + Art. 923 ¶2 note |
| 10.12 | DISINHERITANCE — 2 variants: valid (₱0) + invalid/reinstated (Art. 918, 4 invalidity reasons) |
| 10.13 | PRETERITION — 4 variants: preterited heir, other affected heirs, through representation (Art. 854 ¶2), spouse omission non-preterition (Art. 855) |
| 10.14 | INOFFICIOUS — Art. 911 phases 1a/1b/2/3 + Art. 912 indivisible realty (2 outcomes) |
| 10.15 | UNDERPROVISION — Art. 855 3-source waterfall |
| 10.16 | COLLATION — 5 variants: basic, exceeds share (no return), inofficious (must return), representation (Art. 1064), donor-exempt (Art. 1062) |
| 10.17 | CONDITION — Art. 872 condition stripping from legitime |
| 10.18 | ACCRETION — 3 variants: Art. 1021 vacant legitime (recomputation), Art. 1015/1019 FP accretion (proportional), Art. 1018 intestate accretion |
| 10.19 | SUBSTITUTION — Art. 859 substitute template with Art. 862 obligations transfer |
| 10.20 | RESERVATION — Art. 891 reserva troncal warning annotation |
| 10.21 | ARTICULO_MORTIS — Art. 900 ¶2 reduction ½→⅓ |
| 10.22 | COMPARISON — optional testate/intestate comparison |
| 10.23 | Generation algorithm pseudocode (complete section selection logic) |
| 10.24 | Helper functions: `category_label`, `filiation_description`, `format_peso`, `format_fraction`, `spouse_article` |
| 10.25 | Category labels reference table |
| 10.26 | Formatting rules (typography, peso format, fraction format, sentence structure, paragraph length) |
| 10.27 | Narrative validation rules (10 rules) |

### Section 14.6 Fixed

Replaced:
```
- Test all 28 narrative patterns (N-01 through N-28 in `analysis/explainer-format.md`)
```
With:
```
- Test all 19 NarrativeSectionType variants: verify each section type is generated correctly for at least one test vector (see Section 10.3 composition order and Sections 10.4-10.22 templates)
```
This removes the external file reference, making the spec fully standalone per the spec-review requirement.

## Coverage Verification

All 19 `NarrativeSectionType` values are now documented with complete templates in the spec:

| Type | Section | Status |
|------|---------|--------|
| HEADER | 10.4 | ✓ 5 variants |
| SUCCESSION_TYPE | 10.5 | ✓ 4 variants |
| CATEGORY | 10.6 | ✓ 8 variants |
| LEGITIME | 10.7 | ✓ 8 templates |
| INTESTATE_SHARE | 10.8 | ✓ 12 templates (I1-I15) |
| CAP_RULE | 10.9 | ✓ 1 template |
| FREE_PORTION | 10.10 | ✓ 3 variants |
| REPRESENTATION | 10.11 | ✓ with trigger mapping |
| DISINHERITANCE | 10.12 | ✓ 2 variants |
| PRETERITION | 10.13 | ✓ 4 variants |
| INOFFICIOUS | 10.14 | ✓ 4 phases + Art. 912 |
| UNDERPROVISION | 10.15 | ✓ 3-source waterfall |
| COLLATION | 10.16 | ✓ 5 variants |
| CONDITION | 10.17 | ✓ 1 template |
| ACCRETION | 10.18 | ✓ 3 variants |
| SUBSTITUTION | 10.19 | ✓ 1 template |
| RESERVATION | 10.20 | ✓ warning annotation |
| ARTICULO_MORTIS | 10.21 | ✓ 1 template |
| COMPARISON | 10.22 | ✓ optional |

## Spec Standalone Status

After this patch, Section 10 is self-contained. A developer with no prior knowledge of Philippine law can:
1. Look up the `NarrativeSectionType` enum in Section 10.2
2. Follow the composition order in Section 10.3
3. Fill in the exact template text from Sections 10.4-10.22
4. Run the generation algorithm from Section 10.23
5. Use the helper functions from Section 10.24
6. Validate output against the 10 rules in Section 10.27

No reference to `analysis/explainer-format.md` remains in the spec.
