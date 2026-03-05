# Spec Fix: Narrative Validation Rules, Helper Functions, NarrativeConfig, NarrativeSectionType

**Aspect**: spec-fix-narrative-rules
**Wave**: 6 (Spec Fixes)
**Depends On**: explainer-format, spec-draft, spec-review

---

## Problem

Spec-review identified four gaps in §11 (Narrative Template System):

| ID | Severity | Gap |
|----|----------|-----|
| H4 | HIGH | Narrative validation rules absent — 10 rules from explainer-format analysis not in spec |
| H5 | HIGH | Narrative helper functions not specified — 6 functions from explainer-format analysis not in spec |
| M2 | MEDIUM | NarrativeConfig struct missing from spec data model |
| M3 | MEDIUM | NarrativeSectionType enum missing from spec data model |

Additionally, the spec §11.2 Header Variants table lists only 4 variants but the explainer-format analysis defines 5 (missing: Donation Return).

A developer reading only the spec would not know:
- What section types a narrative can contain (and the enum to model them)
- How to format labels, peso amounts, fractions, or map scenarios to spouse articles
- What runtime configuration options exist
- How to validate that a generated narrative is correct
- How to generate the "return ₱X to estate" header for inofficious donations

## Fix Summary

Add to spec §11:
1. **§11.2**: Add Donation Return header variant
2. **§11.5** (new): NarrativeSectionType enum — 19 values with descriptions
3. **§11.6** (new): Helper functions — 6 functions with complete pseudocode
4. **§11.7** (new): NarrativeConfig struct — 5 runtime configuration fields with defaults
5. **§11.8** (new): Validation rules — 10 rules that every generated narrative must pass

## Source Material

All content is drawn from the explainer-format analysis (`analysis/explainer-format.md`), specifically:
- §1 Data Model → NarrativeSectionType enum
- §4.2 Helper Functions → 6 functions
- §8 NarrativeConfig → struct definition
- §9 Validation Rules → 10 rules

## Changes Applied to Spec

### 1. §11.2 — Added Donation Return Header

Added the 5th header variant for inofficious donation cases where an heir must return money to the estate:

```
| Donation return | `**{name} ({label})** must **return ₱{return_amount} to the estate**.` |
```

### 2. §11.5 — NarrativeSectionType Enum

19 values covering every possible component of an heir's narrative, assembled in fixed pipeline order:

```
enum NarrativeSectionType {
    HEADER,              // Always first. "{Name} ({label}) receives ₱{amount}."
    SUCCESSION_TYPE,     // "The decedent died {testate|intestate|partially testate}."
    CATEGORY,            // "As a {category} (Art. X), {Name} is a compulsory heir."
    LEGITIME,            // "Under Art. X, {heir}'s legitime is ₱X."
    CAP_RULE,            // "However, Art. 895 ¶3 cap was applied..."
    FREE_PORTION,        // "...also receives ₱X from the free portion..."
    INTESTATE_SHARE,     // "Under Art. X, {heir}'s intestate share is..."
    COLLATION,           // "Note: ₱X donation imputed against share..."
    REPRESENTATION,      // "...inherits by right of representation..."
    DISINHERITANCE,      // "...was validly disinherited..." or "...invalid..."
    PRETERITION,         // "...was completely omitted (Art. 854)..."
    INOFFICIOUS,         // "...reduced from ₱X to ₱Y (Art. 911)..."
    UNDERPROVISION,      // "...recovers ₱X under Art. 855..."
    CONDITION,           // "...condition stripped from legitime (Art. 872)..."
    ACCRETION,           // "...receives additional ₱X by accretion..."
    SUBSTITUTION,        // "...takes {original}'s place as substitute..."
    RESERVATION,         // "Note: property subject to reserva troncal..."
    ARTICULO_MORTIS,     // "Note: articulo mortis rule applied..."
    COMPARISON,          // Optional: "Under intestate, would have received ₱X"
}
```

Each section carries its own text and legal basis citations. Sections are assembled in the order listed above and concatenated into a single paragraph.

### 3. §11.6 — Helper Functions

Six functions required by the narrative generation algorithm:

1. **`category_label(heir) → String`**: Maps effective category + relationship to display label (e.g., "legitimate child", "grandchild, by representation")
2. **`raw_label(heir) → String`**: Full label with legal basis for category explanation (e.g., "adopted child (RA 8552 Sec. 17: same rights as legitimate)")
3. **`filiation_description(proof) → String`**: Maps FiliationProof enum to readable description with FC Art. 172 sub-citation
4. **`format_peso(amount) → String`**: ₱ prefix, comma thousands, centavos only when non-zero
5. **`format_fraction(frac) → String`**: Unicode fraction for common values, slash notation otherwise
6. **`spouse_article(scenario) → String`**: Maps testate/intestate scenario code to governing article for spouse's share

### 4. §11.7 — NarrativeConfig

Runtime configuration struct with 5 fields:

```
struct NarrativeConfig {
    include_comparison: bool,       // default: false
    include_filiation_proof: bool,  // default: true
    include_collation_detail: bool, // default: true
    max_sentences: int,             // default: 15
    language: String,               // default: "en"
}
```

### 5. §11.8 — Validation Rules

10 rules that every generated narrative must pass:

1. **Amount consistency**: HEADER peso amount = InheritanceShare.total (or net_from_estate for collation header)
2. **Article citation**: Every legal conclusion cites at least one article
3. **Category match**: category_label matches heir's effective_category
4. **Computation visibility**: Any fractional share shows the multiplication (e.g., "½ × ₱10,000,000 = ₱5,000,000")
5. **Special event coverage**: Every Correction in ValidationResult affecting this heir has a corresponding section
6. **Collation coverage**: If donations_imputed > 0, COLLATION section must be present
7. **Representation coverage**: If inherits_by == REPRESENTATION, REPRESENTATION section must be present
8. **No orphan references**: No reference to an heir, article, or computation not previously explained
9. **Peso format consistency**: All amounts use ₱ prefix, comma thousands, centavos only when non-zero
10. **Self-containment**: A reader with no prior context can understand the entire narrative

## Test Implications

- All 28 narrative test cases (N-01 through N-28) from explainer-format analysis exercise these rules
- The 10 validation rules should be implemented as post-generation assertions in the narrative generation step (Step 10)
- NarrativeConfig defaults ensure the most informative output without overwhelming detail

## Cross-References

| Addition | Source Analysis | Spec Section |
|----------|---------------|--------------|
| NarrativeSectionType enum | explainer-format §1 | §11.5 |
| Helper functions (6) | explainer-format §4.2 | §11.6 |
| NarrativeConfig struct | explainer-format §8 | §11.7 |
| Validation rules (10) | explainer-format §9 | §11.8 |
| Donation Return header | explainer-format §3.1 | §11.2 |
