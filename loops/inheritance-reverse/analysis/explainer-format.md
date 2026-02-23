# Explainer Format — Per-Heir Plain-English Narrative Template System

**Aspect**: explainer-format
**Wave**: 5 (Synthesis)
**Depends On**: ALL Wave 1-4 aspects + computation-pipeline + data-model + test-vectors

---

## Overview

The inheritance distribution engine's narrative output is its **primary user-facing product**. Each heir (and their representative, attorney, or executor) must understand exactly **why** they receive their amount, grounded in specific Civil Code articles and peso computations. This document defines the complete template system for generating these narratives.

### Design Principles

1. **Self-contained**: Each narrative stands alone — a reader needs NO other context to understand WHY their share is what it is
2. **Article-grounded**: Every legal conclusion cites the specific article (e.g., "Art. 888 of the Civil Code")
3. **Computation-visible**: Show the math — fractions, multiplications, and subtotals, not just the final number
4. **Peso-concrete**: Use real peso amounts, not just fractions ("₱2,500,000" not just "¼ of the estate")
5. **Plain language**: Legal terms are always immediately explained in parentheses on first use
6. **Compositional**: Complex narratives are built from composable blocks that layer on top of each other

---

## 1. Data Model

### HeirNarrative (from data-model.md)

```
struct HeirNarrative {
    heir_id: HeirId,
    heir_name: String,
    heir_category_label: String,        // e.g., "illegitimate child", "surviving spouse"
    text: String,                       // The complete narrative paragraph
    summary_line: String,               // Bold one-liner: "{Name} ({label}) receives ₱{amount}"
    sections: List<NarrativeSection>,   // Ordered blocks composing the full text
}

struct NarrativeSection {
    section_type: NarrativeSectionType,
    text: String,
    legal_basis: List<String>,          // Article citations used in this section
}

enum NarrativeSectionType {
    HEADER,             // "{Name} ({label}) receives ₱{amount}."
    SUCCESSION_TYPE,    // "The decedent died {testate|intestate}..."
    CATEGORY,           // "As a {category} (Art. X)..."
    LEGITIME,           // "...entitled to a legitime of ₱X..."
    CAP_RULE,           // "However, Art. 895 ¶3 cap was applied..."
    FREE_PORTION,       // "...also receives ₱X from the free portion..."
    INTESTATE_SHARE,    // "Under Art. X, {heir}'s intestate share is..."
    COLLATION,          // "Note: ₱X donation imputed against share..."
    REPRESENTATION,     // "...inherits by right of representation..."
    DISINHERITANCE,     // "...was validly disinherited..." or "...disinheritance invalid..."
    PRETERITION,        // "...was completely omitted (Art. 854)..."
    INOFFICIOUS,        // "...reduced from ₱X to ₱Y (Art. 911)..."
    UNDERPROVISION,     // "...recovers ₱X under Art. 855..."
    CONDITION,          // "...condition stripped from legitime (Art. 872)..."
    ACCRETION,          // "...receives additional ₱X by accretion..."
    SUBSTITUTION,       // "...takes {original}'s place as substitute (Art. 859)..."
    RESERVATION,        // "Note: property subject to reserva troncal (Art. 891)..."
    ARTICULO_MORTIS,    // "Note: articulo mortis rule applied (Art. 900 ¶2)..."
    COMPARISON,         // Optional: "Under intestate, {heir} would have received ₱X"
}
```

---

## 2. Narrative Structure — Standard Template

Every narrative follows this composition order. Sections are included only when applicable.

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER (always)                                              │
│ "{Name} ({category_label}) receives ₱{total}."              │
│                                                              │
│ If collation: "({plus ₱{donation} previously received,      │
│  for a total of ₱{gross_entitlement}}.)"                    │
├─────────────────────────────────────────────────────────────┤
│ SUCCESSION TYPE (always)                                     │
│ "The decedent died {testate/intestate/partially testate}."   │
│                                                              │
│ If preterition converted: "Although a will existed, it was   │
│  annulled under Art. 854, and the estate distributes         │
│  intestate."                                                 │
├─────────────────────────────────────────────────────────────┤
│ CATEGORY (always for compulsory heirs)                       │
│ "As a {category} (Art. X), {Name} is a compulsory heir."    │
│                                                              │
│ Or for voluntary heirs:                                      │
│ "{Name} is a voluntary heir under the testator's will."      │
│                                                              │
│ Or for legatees/devisees:                                    │
│ "The testator's will provides a {legacy/devise} to {Name}." │
├─────────────────────────────────────────────────────────────┤
│ LEGITIME (if compulsory heir, testate)                       │
│ Explains the fraction, the math, the peso result.            │
│                                                              │
│ INTESTATE SHARE (if intestate succession)                    │
│ Explains the statutory distribution rule and math.           │
├─────────────────────────────────────────────────────────────┤
│ CAP RULE (if Art. 895 ¶3 applied to this IC)                │
│ Explains uncapped vs capped amount and why.                  │
├─────────────────────────────────────────────────────────────┤
│ FREE PORTION (if heir also receives from FP)                 │
│ Explains what portion of FP and under what authority.        │
├─────────────────────────────────────────────────────────────┤
│ SPECIAL EVENTS (0 or more, in pipeline order):               │
│ - REPRESENTATION                                             │
│ - DISINHERITANCE                                             │
│ - PRETERITION                                                │
│ - INOFFICIOUS reduction                                      │
│ - UNDERPROVISION recovery                                    │
│ - CONDITION stripping                                        │
│ - ACCRETION                                                  │
│ - SUBSTITUTION                                               │
│ - COLLATION                                                  │
│ - ARTICULO MORTIS                                            │
│ - RESERVATION                                                │
├─────────────────────────────────────────────────────────────┤
│ COMPARISON (optional, configurable)                          │
│ "Under {alternative} succession, {Name} would have           │
│  received ₱{alt_amount}."                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Section Templates — Complete Catalog

### 3.1 HEADER

**Always present. First line of every narrative.**

#### Standard Header (compulsory heir receiving from estate only)
```
**{name} ({category_label})** receives **₱{total}**.
```
Example:
> **Maria Cruz (legitimate child)** receives **₱5,000,000**.

#### Collation Header (compulsory heir with prior donation)
```
**{name} ({category_label})** receives **₱{net_from_estate} from the estate** (plus ₱{donations_imputed} previously received as a donation, for a total of ₱{gross_entitlement}).
```
Example:
> **Pilar Navarro (legitimate child)** receives **₱3,000,000 from the estate** (plus ₱2,000,000 previously received as a donation, for a total of ₱5,000,000).

#### Zero-Share Header (validly disinherited, no representatives)
```
**{name} ({category_label})** receives **₱0**.
```
Example:
> **Karen Villanueva (legitimate child, disinherited)** receives **₱0**.

#### Donation Return Header (inofficious donation)
```
**{name} ({category_label})** must **return ₱{return_amount} to the estate**.
```
Example:
> **Pedro Garcia (legitimate child)** must **return ₱500,000 to the estate**.

#### Reduced Voluntary Heir Header
```
**{name} ({designation})** receives **₱{reduced_amount}** (reduced from ₱{original_amount}).
```
Example:
> **Friend H (legatee, voluntary heir)** receives **₱2,500,000**.

### 3.2 SUCCESSION TYPE

**Always present. Sets context for the legal regime.**

#### Intestate
```
The decedent died intestate (without a valid will). The estate distributes under the rules of intestate succession (Arts. 960-1014 of the Civil Code).
```

#### Testate
```
The decedent left a valid will disposing of the estate. The distribution follows the testamentary dispositions, subject to the compulsory heirs' legitimes (Arts. 842-856 of the Civil Code).
```

#### Mixed
```
The decedent left a will that disposes of only part of the estate. The disposed portion follows the will; the undisposed portion distributes under intestate succession (Art. 960(2) of the Civil Code).
```

#### Preterition-Converted (testate → intestate)
```
Although the decedent left a will, {preterited_heir_name} — a compulsory heir in the direct line — was completely omitted. Under Art. 854 of the Civil Code, this preterition annuls the institution of heirs. {If legacies survive: "Legacies and devises survive insofar as they are not inofficious."} The estate distributes under intestate succession rules.
```

### 3.3 CATEGORY — Heir Classification

**Always present for compulsory heirs. Establishes legal standing.**

Templates per effective category:

#### Legitimate Child (including adopted, legitimated)
```
As a {raw_label} (Art. 887(1) of the Civil Code), {name} is a compulsory heir entitled to an equal share of the collective legitime.
```
Where `{raw_label}` is one of:
- "legitimate child" — biological legitimate
- "adopted child" — with "(RA 8552 Sec. 17: adopted children have the same successional rights as legitimate children)" appended
- "legitimated child" — with "(Art. 179, Family Code: legitimated children have the same rights as legitimate children)" appended

Examples:
> As a legitimate child (Art. 887(1) of the Civil Code), Ana is a compulsory heir entitled to an equal share of the collective legitime.

> As an adopted child (Art. 887(1) of the Civil Code; RA 8552 Sec. 17: adopted children have the same successional rights as legitimate children), Sam is a compulsory heir entitled to an equal share of the collective legitime.

#### Illegitimate Child
```
As an illegitimate child (Art. 176, Family Code), {name} is a compulsory heir. {Name}'s filiation is established by {filiation_proof_description} (Art. {filiation_article}, Family Code).
```
Where `{filiation_proof_description}` maps from FiliationProof enum:
- BIRTH_CERTIFICATE → "the record of birth in the civil register or a final judgment" (Art. 172(1))
- COURT_JUDGMENT → "a final judgment establishing filiation" (Art. 172(1))
- PUBLIC_DOCUMENT → "an admission of legitimate filiation in a public document" (Art. 172(2))
- PRIVATE_HANDWRITTEN → "a private handwritten instrument signed by the parent" (Art. 172(2))
- OPEN_POSSESSION → "open and continuous possession of the status of an illegitimate child" (Art. 172(3))
- OTHER_EVIDENCE → "other evidence as provided by the Rules of Court" (Art. 172(4))

Example:
> As an illegitimate child (Art. 176, Family Code), Carlo is a compulsory heir. Carlo's filiation is established by open and continuous possession of the status of an illegitimate child (Art. 172(3), Family Code).

#### Surviving Spouse
```
As the surviving spouse (Art. 887(3) of the Civil Code), {name} is a compulsory heir.
```
With special qualifiers when applicable:
- Articulo mortis: append " Note: the marriage was contracted in articulo mortis (Art. 900 ¶2)."
- Legal separation: "Note: [guilty_spouse] was legally separated from the decedent. Under Art. 1002, the guilty spouse forfeits succession rights." (Only if guilty spouse — innocent spouse retains rights)

#### Legitimate Ascendant
```
As a legitimate {ascendant_label} of the decedent (Art. 887(2) of the Civil Code), {name} is a compulsory heir. {Name} inherits because {exclusion_explanation}.
```
Where:
- `{ascendant_label}`: "parent" / "grandfather" / "grandmother" / "great-grandparent"
- `{exclusion_explanation}`: "the decedent left no surviving legitimate children or descendants"

Example:
> As a legitimate parent of the decedent (Art. 887(2) of the Civil Code), Roberto is a compulsory heir. Roberto inherits because the decedent left no surviving legitimate children or descendants.

#### Voluntary Heir (testate only)
```
{name} is a voluntary heir, instituted in the testator's will to receive {share_description} of the estate.
```

#### Legatee / Devisee
```
The testator's will provides a {legacy_or_devise} of {description} to {name}.
```
Where `{legacy_or_devise}` is "legacy" (personal property) or "devise" (real property).

### 3.4 LEGITIME — Compulsory Share Explanation (Testate)

**Present only for compulsory heirs in testate succession.**

#### Legitimate Child Legitime (Art. 888)
```
Under Art. 888 of the Civil Code, the collective legitime of the legitimate children is one-half (½) of the estate. The estate is ₱{estate}{if_collated: " (adjusted to ₱{e_adj} under Art. 908 after adding back ₱{collation_total} in collatable donations)"}. The collective legitime is ₱{lc_collective} (½ × ₱{estate_base}), divided equally among {n} legitimate child line{s}, giving each line ₱{per_line}.
```
Example:
> Under Art. 888 of the Civil Code, the collective legitime of the legitimate children is one-half (½) of the estate. The estate is ₱10,000,000. The collective legitime is ₱5,000,000 (½ × ₱10,000,000), divided equally among 2 legitimate child lines, giving each line ₱2,500,000.

#### Illegitimate Child Legitime (Art. 895)

**Uncapped:**
```
Under Art. 895 of the Civil Code, an illegitimate child's legitime is one-half (½) of that of a legitimate child. Each legitimate child's legitime is ₱{per_lc}, so {name}'s legitime is ₱{per_lc} × ½ = ₱{ic_legitime}. This share is taken from the free portion (Art. 895 ¶3).
```

**Capped (Art. 895 ¶3):**
```
Under Art. 895 of the Civil Code, an illegitimate child's computed legitime would be ₱{uncapped} (½ × ₱{per_lc}). However, Art. 895 ¶3 provides that the total legitime of all illegitimate children cannot exceed the free portion of the estate. The free portion is ₱{fp_gross} (½ of ₱{estate}). The surviving spouse's legitime of ₱{spouse_share} (Art. {spouse_art}) is satisfied first from this free portion, leaving ₱{fp_remaining}. This remaining amount is divided equally among {m} illegitimate children, giving {name} ₱{capped_amount}.
```
Example (from TV-13):
> Under Art. 895 of the Civil Code, an illegitimate child's computed legitime would be ₱5,000,000 (½ × ₱10,000,000). However, Art. 895 ¶3 provides that the total legitime of all illegitimate children cannot exceed the free portion of the estate. The free portion is ₱10,000,000 (½ of ₱20,000,000). The surviving spouse's legitime of ₱5,000,000 (Art. 892) is satisfied first from this free portion, leaving ₱5,000,000. This remaining amount is divided equally among 3 illegitimate children, giving Carlo ₱1,666,666.67.

#### Surviving Spouse Legitime

The spouse's legitime varies by scenario. Article citation depends on concurrence:

**With legitimate children (Regime A, Art. 892):**
```
Under Art. 892 of the Civil Code, the surviving spouse's legitime when concurring with legitimate children is {fraction_description}. {If n=1: "With one legitimate child, the spouse receives one-fourth (¼) of the estate = ₱{amount}." | If n≥2: "With {n} legitimate children, the spouse receives a share equal to each child's legitime = ₱{amount} (same as one legitimate child's share: ½E ÷ {n})."}
```

**With ascendants (Regime B, Art. 893):**
```
Under Art. 893 of the Civil Code, when the decedent leaves legitimate ascendants and a surviving spouse, the spouse's legitime is one-fourth (¼) of the estate = ₱{amount}.
```

**With illegitimate children only (Regime C, Art. 900):**
```
Under Art. 900 of the Civil Code, when the surviving spouse concurs only with illegitimate children, the spouse's legitime is one-third (⅓) of the estate = ₱{amount}.
```

**Spouse alone (Art. 900):**
```
Under Art. 900, when the surviving spouse is the sole compulsory heir, the spouse's legitime is one-half (½) of the estate = ₱{amount}.{If articulo_mortis: " However, Art. 900 ¶2 applies: the marriage was contracted in articulo mortis and the decedent died within three months. The spouse's legitime is reduced to one-third (⅓) = ₱{reduced_amount}."}
```

**With ascendants + illegitimate children (Art. 899):**
```
Under Art. 899 of the Civil Code, when legitimate ascendants, illegitimate children, and the surviving spouse all concur, the spouse receives one-eighth (⅛) of the estate = ₱{amount}.
```

#### Ascendant Legitime (Arts. 889-890)
```
Under Art. 889 of the Civil Code, in the absence of legitimate descendants, the legitimate ascendants' collective legitime is one-half (½) of the estate = ₱{collective}. {Division per Art. 890:}
```
With division sub-templates:
- Parents only: "Both parents share equally, receiving ₱{per_parent} each."
- One surviving parent: "As the sole surviving parent, {name} receives the entire ₱{collective}."
- Higher ascendants: "Under Art. 890, nearer ascendants exclude more remote ones. At the {degree} degree, the ascendant legitime is divided ½ paternal / ½ maternal, with each line's share split equally among ascendants of the same degree."

### 3.5 INTESTATE SHARE — Distribution Explanation (Intestate)

**Present only in intestate succession, replaces the LEGITIME section.**

#### With Descendants — Equal Shares (I1-I2)
```
Under Art. {article} of the Civil Code, {distribution_rule}. With {count} {heirs_description}, the ₱{estate} estate is divided into {divisor} equal shares of ₱{per_share} each.
```

Article mapping:
- Children only (I1): Art. 980 — "children of the deceased inherit in their own right, dividing the inheritance in equal shares"
- Children + spouse (I2): Art. 996 — "the surviving spouse is entitled to a share equal to that of each legitimate child"

#### With Descendants — 2:1 Ratio (I3-I4)
```
Under Arts. 983 and 895 of the Civil Code, when illegitimate children concur with legitimate children, each illegitimate child receives one-half (½) the share of each legitimate child. {If spouse: "The surviving spouse receives a share equal to one legitimate child (Art. 999)."} Using the proportional unit method: each legitimate child = 2 units{if_spouse: ", surviving spouse = 2 units"}, each illegitimate child = 1 unit. Total units = {total}. Per unit = ₱{estate} ÷ {total} = ₱{per_unit}. {Name} receives {units} unit(s) = ₱{amount}. Note: in intestate succession, the Art. 895 ¶3 cap rule does not apply.
```
Example (from TV-03):
> Under Arts. 983 and 895 of the Civil Code, when illegitimate children concur with legitimate children, each illegitimate child receives one-half (½) the share of each legitimate child. Using the proportional unit method: each legitimate child = 2 units, each illegitimate child = 1 unit. Total units = 5. Per unit = ₱10,000,000 ÷ 5 = ₱2,000,000. Gloria receives 1 unit = ₱2,000,000. Note: in intestate succession, the Art. 895 ¶3 cap rule does not apply.

#### Ascendants (I5-I8)
```
Under Art. {article} of the Civil Code, {rule_description}. {Ascendant division per Art. 890/986-987.}
```

Article mapping:
- Ascendants only (I5): Art. 985 — "inherit the whole estate in equal shares"
- Ascendants + spouse (I6): Art. 997 — "when only legitimate ascendants survive with the surviving spouse, the spouse receives one-half (½) and the ascendants receive the other half"
- Ascendants + IC (I7): Art. 991 — "an illegitimate child gets one-half (½) of the estate, and the legitimate parents or ascendants the other half"
- Ascendants + IC + spouse (I8): Art. 998 — ascendants ½, IC ¼, spouse ¼

#### Illegitimate Children Only (I9-I10)
```
Under Art. {article}, the illegitimate children inherit {fraction} of the estate, divided equally. {If spouse: "The surviving spouse receives the other half (Art. {spouse_art})."}
```

#### Surviving Spouse Alone (I11)
```
Under Art. 995 of the Civil Code, when the surviving spouse is the sole heir (no descendants, ascendants, or illegitimate children), the spouse inherits the entire estate of ₱{estate}.
```

#### Spouse + Siblings (I12)
```
Under Art. 1001 of the Civil Code, when brothers and sisters (or their children) survive with the surviving spouse and no descendants, ascendants, or illegitimate children exist, the spouse receives one-half (½) of the estate and the siblings share the other half. {If full/half blood mix: "Under Art. 1006, full-blood siblings receive double the share of half-blood siblings."}
```

#### Collaterals Only (I13-I14)
```
Under Art. {article} of the Civil Code, {collateral_rule}. {If full/half blood mix: "Full-blood siblings receive double the share of half-blood siblings (Art. 1006). Using the unit method: full-blood = 2 units, half-blood = 1 unit."} {If nephews per stirpes: "Nephews and nieces inherit by representation (Art. 972), dividing their parent's share equally."}
```

#### Escheat (I15)
```
The decedent died intestate with no surviving heirs within the degrees prescribed by law. Under Art. 1011 of the Civil Code, the State inherits the entire estate. Per Art. 1013, personal property is assigned to the municipality or city of the decedent's last residence, and real estate to the municipalities or cities where situated, for the benefit of public schools and charitable institutions.
```

### 3.6 CAP RULE (Art. 895 ¶3)

**Present only when the cap rule reduced illegitimate children's shares in testate succession.**

```
Note: The Art. 895 ¶3 cap rule was applied. The uncapped total of all illegitimate children's legitimes (₱{uncapped_total}) exceeds the remaining free portion (₱{fp_remaining}) after the surviving spouse's share of ₱{spouse_amount} was fully satisfied first. Each illegitimate child's share is therefore reduced from ₱{uncapped_per_ic} to ₱{capped_per_ic}.
```

### 3.7 FREE PORTION

**Present when the heir receives additional amounts from the free portion beyond their legitime.**

#### Testate — Voluntary Heir / Legatee
```
{Name} receives ₱{fp_amount} from the free portion, as directed by the testator's will. The free portion (₱{fp_total}) is the remaining estate after all compulsory heirs' legitimes (totaling ₱{total_legitime}) are satisfied. The testator may freely dispose of the free portion under Art. 842.
```

#### Testate — Compulsory Heir Receiving Above Legitime
```
In addition to the legitime of ₱{legitime_amount}, {name} receives ₱{fp_excess} from the free portion as the testator's will grants {name} more than the minimum legitime. The excess comes from the testator's disposable free portion (Art. 842).
```

#### Mixed Succession — Undisposed FP
```
The free portion of ₱{fp} was not disposed of in the will. Under Art. 960(2), undisposed property passes under intestate succession. {Name}'s intestate share of the free portion is ₱{amount}.
```

### 3.8 REPRESENTATION

**Present when the heir inherits by right of representation.**

```
{Name} inherits by right of representation (Art. 970 of the Civil Code) in place of {represented_name}, who {trigger_description}. Under Art. 974, {represented_name}'s line receives ₱{line_share}, which is divided equally among {count} representative(s) at ₱{per_rep} each.
```
Where `{trigger_description}` maps:
- PREDECEASE → "predeceased the decedent"
- DISINHERITANCE → "was validly disinherited (Art. 923)"
- INCAPACITY → "was declared incapable of succeeding (Art. 1032)"
- UNWORTHINESS → "was declared unworthy to succeed (Art. 1032)"

Additional note for disinheritance representation:
```
Note: {represented_name} has no right of usufruct or administration over {name}'s inheritance (Art. 923 ¶2).
```

Example (from TV-08):
> Luis inherits by right of representation (Art. 970 of the Civil Code) in place of Karen, who was validly disinherited (Art. 923). Under Art. 974, Karen's line receives ₱2,666,666.67, which is divided equally among 2 representatives at ₱1,333,333.33 each. Note: Karen has no right of usufruct or administration over Luis's inheritance (Art. 923 ¶2).

### 3.9 DISINHERITANCE

**Present for the disinherited heir (₱0 share) and for their representatives.**

#### Valid Disinheritance (heir receives ₱0)
```
{Name} is validly disinherited in the testator's will. The disinheritance is based on Art. {cause_article} of the Civil Code: {cause_description}. Under Art. 915, a compulsory heir may be deprived of their legitime for causes expressly stated by law. {If has_representatives: "{Name}'s descendants ({rep_names}) inherit by representation under Art. 923."} {If no_representatives: "{Name}'s share is redistributed among the remaining heirs."}
```

#### Invalid Disinheritance (heir reinstated)
```
The testator's will purported to disinherit {name}. However, the disinheritance is invalid under Art. 918 because {invalidity_reason}. {Name} is reinstated as a compulsory heir and receives the full legitime of ₱{amount}.
```
Where `{invalidity_reason}` maps:
- NO_CAUSE → "the will does not specify a cause (Art. 916 requires a specified legal cause)"
- WRONG_CATEGORY → "the stated cause ({cause}) is not among those enumerated in Art. {article} for {heir_category_description}"
- NOT_PROVEN → "the stated cause was not proven (Art. 917 requires proof or acknowledgment)"
- RECONCILED → "the offender and testator subsequently reconciled, voiding the disinheritance under Art. 922"

### 3.10 PRETERITION

**Present when Art. 854 applies (total omission of a direct-line compulsory heir).**

#### For the Preterited Heir
```
{Name}, a compulsory heir in the direct line, was completely omitted from the testator's will — {name} was neither instituted as an heir, nor given any legacy, devise, or other testamentary provision. Under Art. 854 of the Civil Code, the preterition (total omission) of a compulsory heir in the direct line annuls the institution of heirs. {If legacies_survive: "The testator's legacies and devises survive insofar as they do not impair the compulsory heirs' legitimes (Art. 854)."} {If no_legacies: "Since the will contained no separate legacies or devises, the entire estate distributes under intestate succession rules."} Under Art. {intestate_article}, {intestate_distribution_explanation}.
```

#### For Other Heirs Affected by Preterition
```
Because {preterited_name} was preterited under Art. 854, the testator's institutions were annulled. The estate distributes under intestate succession, where {name}'s share is ₱{amount} under Art. {article}.
```

#### Preterition Through Representation (Art. 854 ¶2)
```
{Predeceased_name}, a compulsory heir in the direct line, predeceased the testator and was also omitted from the will. Under Art. 854 ¶2, the institution would ordinarily remain effectual. However, {predeceased_name}'s descendants ({rep_names}) also survive and were completely omitted. Preterition applies through representation, annulling the institution.
```

#### Spouse Omission — NOT Preterition (Art. 855)
```
Although {name} was not mentioned in the testator's will, this does not constitute preterition under Art. 854. Art. 854 applies only to compulsory heirs in the direct line (children, descendants, parents, ascendants). The surviving spouse, while a compulsory heir under Art. 887(3), is not in the direct line. {Name}'s omission is treated as an underprovision, and the legitime of ₱{amount} is recovered under Art. 855.
```

### 3.11 INOFFICIOUS REDUCTION (Art. 911)

**Present for voluntary heirs / legatees / devisees whose dispositions were reduced.**

```
The testator's will directed ₱{original} to {name}. However, the total testamentary dispositions to voluntary heirs (₱{total_voluntary}) exceed the free portion (₱{fp_disposable}), making this disposition inofficious under Art. 911. {Reduction_detail}. {Name} receives ₱{after_reduction}.
```
Where `{Reduction_detail}` depends on reduction phase:
- Phase 1a (non-preferred pro rata): "As a non-preferred disposition, it is reduced pro rata with other non-preferred dispositions."
- Phase 1b (preferred): "Although designated as a preferred disposition, the non-preferred reductions were insufficient. This preferred disposition is reduced by ₱{reduction}."
- Phase 2 (voluntary institutions): "The excess is charged against voluntary institutions pro rata."
- Phase 3 (donations): "Inter vivos donations are reduced in reverse chronological order."

#### Art. 912 Indivisible Realty
```
The devise of {property_description} (valued at ₱{value}) to {devisee} must be reduced by ₱{reduction} to protect the compulsory heirs' legitime. Under Art. 912, since the reduction {comparison} half of the property's value: {outcome}.
```
Where `{outcome}`:
- reduction < ½ value → "{Devisee} retains the property and must reimburse the compulsory heirs ₱{cash} in cash."
- reduction ≥ ½ value → "The compulsory heirs receive the property and must reimburse {devisee} ₱{cash} in cash."

### 3.12 UNDERPROVISION RECOVERY (Art. 855)

**Present when a compulsory heir receives less than their legitime from the will.**

```
{Name} is entitled to a legitime of ₱{legitime} under Art. {article}. The testator's will provided only ₱{will_provision}, leaving a deficit of ₱{deficit}. Under Art. 855 of the Civil Code, this deficit is recovered: {recovery_description}.
```
Where `{recovery_description}` follows the 3-source waterfall:
1. "₱{from_undisposed} from the undisposed portion of the estate."
2. "₱{from_compulsory} pro rata from other compulsory heirs' shares in excess of their own legitimes."
3. "₱{from_voluntary} pro rata from the voluntary heirs' shares."

### 3.13 COLLATION (Arts. 1061-1077)

**Present when inter vivos donations affect the heir's distribution.**

#### Basic — Donation Within Share
```
Note: {Name} previously received ₱{donation_value} as an inter vivos donation during the decedent's lifetime. Under Art. 1061 of the Civil Code, this donation must be collated (fictitiously added back) to compute each heir's share. The collation-adjusted estate is ₱{e_adj} (Art. 908). {Name}'s {share_label} is ₱{gross_entitlement}. Under Art. {imputation_article}, the donation is charged against this share, leaving ₱{net_from_estate} to be received from the actual estate.
```
Where `{imputation_article}` is Art. 909 (legitimate children) or Art. 910 (illegitimate children).

#### Exceeds Share — No Return
```
Note: {Name} previously received ₱{donation_value} as a donation, which exceeds {name}'s share of ₱{gross_entitlement}. Under Art. 909, the excess of ₱{excess} is charged to the free portion. {Name} does not return any amount but receives nothing further from the estate.
```

#### Inofficious — Must Return
```
Note: {Name}'s prior donation of ₱{donation_value} exceeds both {name}'s share (₱{gross_entitlement}) and the available free portion. Under Arts. 909 and 911, the donation is inofficious (impairs co-heirs' legitimes). {Name} must return ₱{return_amount} to the estate.
```

#### Representation Collation (Art. 1064)
```
Note: Under Art. 1064, grandchildren inheriting by representation must collate donations their parent ({parent_name}) would have been obliged to bring. {Parent_name} received ₱{parent_donation} during the decedent's lifetime. After collation, {name}'s line receives ₱{net_line_share}, divided among {count} grandchildren at ₱{per_gc} each.
```

#### Donor-Exempt (Art. 1062)
```
Note: The decedent expressly exempted {name}'s donation of ₱{donation_value} from collation under Art. 1062. This donation is NOT deducted from {name}'s share. {If inofficious: "However, the donation is still subject to reduction under Art. 911 insofar as it impairs co-heirs' legitimes."}
```

### 3.14 CONDITION STRIPPING (Art. 872)

**Present when a will imposes conditions on a compulsory heir's legitime.**

```
The testator's will imposed a condition on {name}'s inheritance: "{condition_description}". Under Art. 872 of the Civil Code, the testator cannot impose any charge, condition, or substitution upon the legitime. The condition is deemed not imposed with respect to {name}'s legitime of ₱{legitime}. {If fp_excess: "The condition applies only to the ₱{fp_excess} received from the free portion."}
```

### 3.15 ACCRETION

**Present when the heir receives additional share from a vacant co-heir's portion.**

#### Art. 1021 — Vacant Legitime (Recomputation)
```
{Vacant_heir_name} {vacancy_cause_description}. Since {vacant_heir_name} {representation_explanation}, {vacant_heir_name}'s share of the legitime became vacant. Under Art. 1021 of the Civil Code, when a compulsory heir's legitime is repudiated, the remaining compulsory heirs succeed to it in their own right, not by accretion. The inheritance was recomputed as if only {remaining_count} {heir_description} survived, resulting in {name}'s share of ₱{new_amount}.
```

#### Art. 1015/1019 — Free Portion Accretion (Proportional)
```
{Vacant_heir_name}'s share of the free portion (₱{vacant_amount}) became vacant because {vacancy_cause}. Under Art. 1015 of the Civil Code, {vacant_heir_name}'s share accretes to the remaining co-heirs. Per Art. 1019, this accretion is proportional to each co-heir's existing share. {Name} receives an additional ₱{accretion_amount}.
```

#### Art. 1018 — Intestate Accretion
```
{Vacant_heir_name} {vacancy_cause_description}. Under Art. 1018, in intestate succession, the share of a person who repudiates the inheritance accretes to the co-heirs. {Name} receives an additional ₱{accretion_amount}, bringing the total to ₱{new_total}.
```

### 3.16 SUBSTITUTION

**Present when the heir takes the place of an original heir via testamentary substitution.**

```
{Name} takes the place of {original_name} as a substitute designated in the testator's will. {Original_name} {trigger_description}. Under Art. 859, {name} inherits {original_name}'s share of ₱{amount}. {If obligations_transfer: "Under Art. 862, the charges and conditions imposed on {original_name} apply equally to {name}."}
```

### 3.17 RESERVA TRONCAL (Art. 891)

**Warning annotation, not a distribution modifier. Always appears at the end.**

```
WARNING — Reserva Troncal: The property "{property_description}" inherited by {ascendant_name} is subject to reserva troncal under Art. 891 of the Civil Code. This property was originally acquired by the decedent through {acquisition_method} from {source_person} ({relationship}). {Ascendant_name} is obligated to reserve this property for qualifying relatives within the third degree of the decedent belonging to the {paternal_or_maternal} line.
```

### 3.18 ARTICULO MORTIS (Art. 900 ¶2)

**Present only when the articulo mortis rule applies to the surviving spouse.**

```
Note: Art. 900 ¶2 applies. The decedent's marriage was contracted in articulo mortis (at the point of death), the decedent died within three months of the marriage, and the illness was known at the time of the ceremony. The surviving spouse's legitime is reduced from one-half (½) to one-third (⅓) of the estate: from ₱{normal_amount} to ₱{reduced_amount}.
```

### 3.19 COMPARISON (Optional)

**Optionally appended to show how the heir would fare under a different succession regime.**

```
Note: Under {alternative} succession with the same family composition, {name} would have received ₱{alt_amount} — {comparison_description}.
```
Examples:
> Note: Under intestate succession with the same family composition, Carlo would have received ₱2,857,142.86 — 71% more than the testate share of ₱1,666,666.67, because the Art. 895 ¶3 cap rule does not apply in intestate succession.

> Note: Under testate succession, Ana would have received only ₱2,500,000 as her legitime. The intestate distribution of ₱3,000,000 is more favorable.

---

## 4. Narrative Generation Algorithm

### 4.1 Pseudocode

```
function generate_narrative(
    heir: Heir,
    share: InheritanceShare,
    succession: SuccessionResult,
    legitime_result: LegitimeResult,
    validation: ValidationResult,
    collation: CollationResult,
    vacancy: VacancyResolutionResult,
    log: ComputationLog,
    config: NarrativeConfig
) -> HeirNarrative {

    sections = []

    // ── HEADER ──
    if share.donations_imputed > 0:
        sections.append(collation_header(heir, share))
    elif share.total == 0 and heir.is_disinherited:
        sections.append(zero_header(heir))
    elif share.disposition_type == INOFFICIOUS_DONATION:
        sections.append(return_header(heir, share))
    else:
        sections.append(standard_header(heir, share))

    // ── SUCCESSION TYPE ──
    if validation.preterition_applied:
        sections.append(preterition_converted_succession(validation))
    elif succession.succession_type == INTESTATE:
        sections.append(intestate_succession())
    elif succession.succession_type == TESTATE:
        sections.append(testate_succession())
    elif succession.succession_type == MIXED:
        sections.append(mixed_succession())

    // ── CATEGORY ──
    if heir.is_compulsory:
        sections.append(category_section(heir))
    elif share.disposition_type == LEGACY or share.disposition_type == DEVISE:
        sections.append(legatee_section(heir, share))
    else:
        sections.append(voluntary_heir_section(heir, share))

    // ── MAIN SHARE EXPLANATION ──
    if succession.succession_type == INTESTATE or validation.preterition_applied:
        sections.append(intestate_share_section(heir, share, succession))
    elif heir.is_compulsory and share.from_legitime > 0:
        sections.append(legitime_section(heir, share, legitime_result))

    // ── CAP RULE (if applied to this IC) ──
    if heir.effective_category == ILLEGITIMATE_CHILD_GROUP
       and legitime_result.cap_applied:
        sections.append(cap_rule_section(heir, legitime_result))

    // ── FREE PORTION ──
    if share.from_free_portion > 0:
        sections.append(free_portion_section(heir, share, succession))

    // ── SPECIAL EVENTS (in pipeline order) ──

    if heir.inherits_by == REPRESENTATION:
        sections.append(representation_section(heir))

    if heir.is_disinherited:
        sections.append(disinheritance_section(heir, validation))

    if heir.affected_by_preterition and heir != preterited_heir:
        sections.append(preterition_effect_section(heir, validation))

    for correction in validation.corrections_affecting(heir):
        match correction.type:
            INOFFICIOUS → sections.append(inofficious_section(heir, correction))
            UNDERPROVISION → sections.append(underprovision_section(heir, correction))
            CONDITION_STRIPPED → sections.append(condition_section(heir, correction))

    if heir in collation.affected_heirs:
        sections.append(collation_section(heir, collation))

    if heir in vacancy.beneficiaries:
        sections.append(accretion_section(heir, vacancy))

    if heir.is_substitute:
        sections.append(substitution_section(heir))

    if heir.articulo_mortis_applied:
        sections.append(articulo_mortis_section(heir, share))

    // ── RESERVA TRONCAL WARNING ──
    if heir.has_reserva_troncal_flag:
        sections.append(reserva_troncal_section(heir))

    // ── OPTIONAL COMPARISON ──
    if config.include_comparison and share.comparison_available:
        sections.append(comparison_section(heir, share))

    // ── ASSEMBLE ──
    full_text = join(sections.map(s -> s.text), " ")
    summary_line = sections[0].text  // The HEADER

    return HeirNarrative {
        heir_id: heir.id,
        heir_name: heir.name,
        heir_category_label: category_label(heir),
        text: full_text,
        summary_line: summary_line,
        sections: sections,
    }
}
```

### 4.2 Helper Functions

```
function category_label(heir: Heir) -> String {
    match heir.effective_category:
        LEGITIMATE_CHILD_GROUP:
            match heir.relationship:
                LEGITIMATE_CHILD → "legitimate child"
                ADOPTED_CHILD → "adopted child"
                LEGITIMATED_CHILD → "legitimated child"
                LEGITIMATE_GRANDCHILD → "grandchild, by representation"
        ILLEGITIMATE_CHILD_GROUP → "illegitimate child"
        SURVIVING_SPOUSE_GROUP → "surviving spouse"
        LEGITIMATE_ASCENDANT_GROUP:
            match heir.relationship:
                LEGITIMATE_PARENT → "legitimate parent"
                LEGITIMATE_ASCENDANT → "legitimate {degree_label(heir.degree)} ascendant"
}

function raw_label(heir: Heir) -> String {
    // Full label with legal basis for category explanation
    match heir.relationship:
        LEGITIMATE_CHILD → "legitimate child"
        ADOPTED_CHILD → "adopted child (RA 8552 Sec. 17: same rights as legitimate)"
        LEGITIMATED_CHILD → "legitimated child (Art. 179, Family Code: same rights as legitimate)"
        ILLEGITIMATE_CHILD → "illegitimate child (Art. 176, Family Code)"
        SURVIVING_SPOUSE → "surviving spouse"
        LEGITIMATE_PARENT → "legitimate parent"
        LEGITIMATE_ASCENDANT → "legitimate ascendant"
        LEGITIMATE_GRANDCHILD → "grandchild by representation"
}

function filiation_description(proof: FiliationProof) -> String {
    match proof:
        BIRTH_CERTIFICATE → "record of birth in the civil register (Art. 172(1), FC)"
        COURT_JUDGMENT → "final judgment establishing filiation (Art. 172(1), FC)"
        PUBLIC_DOCUMENT → "admission of filiation in a public document (Art. 172(2), FC)"
        PRIVATE_HANDWRITTEN → "private handwritten instrument signed by the parent (Art. 172(2), FC)"
        OPEN_POSSESSION → "open and continuous possession of the status of an illegitimate child (Art. 172(3), FC)"
        OTHER_EVIDENCE → "evidence as provided by the Rules of Court (Art. 172(4), FC)"
}

function format_peso(amount: Money) -> String {
    // Format with ₱ prefix, comma thousands separator, 2 decimal places
    // Omit decimals if .00
    if amount.centavos == 0:
        return "₱{amount.pesos:,}"     // e.g., "₱5,000,000"
    else:
        return "₱{amount:,.2f}"        // e.g., "₱1,666,666.67"
}

function format_fraction(frac: Fraction) -> String {
    // Display as Unicode fraction + parenthetical decimal
    // Common fractions get Unicode; others use slash notation
    known = {
        (1,2): "½", (1,3): "⅓", (2,3): "⅔", (1,4): "¼", (3,4): "¾",
        (1,5): "⅕", (1,6): "⅙", (1,8): "⅛", (3,8): "⅜",
    }
    if (frac.num, frac.den) in known:
        return known[(frac.num, frac.den)]
    else:
        return "{frac.num}/{frac.den}"
}

function spouse_article(scenario: TestateScenario | IntestateScenario) -> String {
    // Map scenario to the article governing the spouse's share
    match scenario:
        T1, T2, T3 → "Art. 892"         // Regime A (with LC)
        T4, T5a, T5b → "Art. 892"       // Regime A (with LC + IC)
        T7, T8 → "Art. 893"             // Regime B (with ascendants)
        T9 → "Art. 899"                  // Regime B (ascendants + IC)
        T11 → "Art. 894"                // Regime C (IC only)
        T12, T13 → "Art. 900"           // Regime C (spouse alone / articulo mortis)
        I2, I4 → "Art. 996/999"         // Intestate with LC
        I6 → "Art. 997"                 // Intestate with ascendants
        I8 → "Art. 998"                 // Intestate with ascendants + IC
        I10 → "Art. 1000"               // Intestate IC + spouse
        I11 → "Art. 995"                // Intestate spouse alone
        I12 → "Art. 1001"               // Intestate spouse + siblings
}
```

---

## 5. Formatting Rules

### 5.1 Typography

| Element | Format |
|---------|--------|
| Heir name | **Bold** on first mention |
| Category label | In parentheses after name: "({label})" |
| Peso amounts | **Bold** when it's the main amount received |
| Fractions | Written as words + symbol: "one-half (½)" |
| Article references | "Art. {number} of the Civil Code" (first mention) / "Art. {number}" (subsequent) |
| Family Code references | "Art. {number}, Family Code" |
| RA references | "RA {number} Sec. {number}" |
| Notes/warnings | Prefixed with "Note:" or "WARNING —" |

### 5.2 Peso Formatting

- Use ₱ prefix (Philippine peso sign)
- Comma-separate thousands: ₱1,000,000
- Show centavos only when non-zero: ₱1,666,666.67 (not ₱5,000,000.00)
- Always show full amount — no abbreviations like "₱5M"

### 5.3 Fraction Formatting

- Always show fraction both as words AND symbol: "one-half (½)"
- In computation steps, show the multiplication: "½ × ₱10,000,000 = ₱5,000,000"
- For non-standard fractions, use slash notation: "1/2n" or "5/14"

### 5.4 Sentence Structure

- Active voice preferred: "{Name} receives ₱X" not "₱X is received by {Name}"
- Legal basis BEFORE conclusion: "Under Art. 888... the legitime is ₱X" not "The legitime is ₱X per Art. 888"
- One legal concept per sentence — don't chain multiple articles in a single sentence
- Present tense for current rules: "Art. 895 provides that..." not "Art. 895 provided that..."

### 5.5 Paragraph Structure

- Each narrative is a SINGLE paragraph (no bullet points, no sub-headers)
- Sentences flow logically: classification → basis → computation → result → notes
- Target length: 3-8 sentences for simple cases, up to 12 sentences for complex cases (collation + cap + representation)
- Maximum length guard: if narrative exceeds 15 sentences, split into "Summary" (5 sentences) and "Detailed Computation" (remaining)

---

## 6. Complete Worked Examples

These examples demonstrate the full narrative format across different scenarios. All are drawn from the test vectors.

### Example 1: Simple Intestate — Single Heir (TV-01)

> **Maria Cruz (legitimate child)** receives **₱5,000,000**. The decedent died intestate (without a valid will). As a legitimate child (Art. 887(1) of the Civil Code), Maria is a compulsory heir. Under Art. 980, children of the deceased inherit in their own right, dividing the inheritance in equal shares. As the sole legitimate child with no other surviving heirs, Maria inherits the entire net distributable estate of ₱5,000,000.

### Example 2: Intestate — Spouse with Children (TV-02)

> **Rosa Santos (surviving spouse)** receives **₱3,000,000**. The decedent died intestate (without a valid will). As the surviving spouse (Art. 887(3) of the Civil Code), Rosa is a compulsory heir. Under Art. 996 of the Civil Code, the surviving spouse is entitled to a share equal to that of each legitimate child. With 3 legitimate children, there are 4 equal shares totaling ₱12,000,000. Rosa's share is ₱3,000,000 (¼ of the estate).

### Example 3: Intestate — Illegitimate Child, 2:1 Ratio (TV-03)

> **Gloria Reyes (illegitimate child)** receives **₱2,000,000**. The decedent died intestate (without a valid will). As an illegitimate child (Art. 176, Family Code), Gloria is a compulsory heir. Gloria's filiation is established by record of birth in the civil register (Art. 172(1), Family Code). Under Arts. 983 and 895 of the Civil Code, when illegitimate children concur with legitimate children, each illegitimate child receives one-half (½) the share of each legitimate child. Using the proportional unit method: each legitimate child = 2 units, each illegitimate child = 1 unit. Total units = 5. Per unit = ₱10,000,000 ÷ 5 = ₱2,000,000. Gloria receives 1 unit = ₱2,000,000. Note: in intestate succession, the Art. 895 ¶3 cap rule does not apply.

### Example 4: Testate — Legitimate Child with Free Portion to Charity (TV-06)

> **Daniel Dela Cruz (legitimate child)** receives **₱2,500,000**. The decedent left a valid will disposing of the estate. As a legitimate child (Art. 887(1) of the Civil Code), Daniel is a compulsory heir entitled to an equal share of the collective legitime. Under Art. 888 of the Civil Code, the collective legitime of the legitimate children is one-half (½) of the estate. The collective legitime is ₱5,000,000 (½ × ₱10,000,000), divided equally among 2 legitimate child lines, giving each line ₱2,500,000. The remaining free portion (₱5,000,000) is validly disposed by the testator's will to Charity C.

### Example 5: Preterition — Omitted Legitimate Child (TV-07)

> **Dina Ramos (legitimate child)** receives **₱3,000,000**. Although the decedent left a will, Dina — a compulsory heir in the direct line — was completely omitted. Under Art. 854 of the Civil Code, the preterition (total omission) of a compulsory heir in the direct line annuls the institution of heirs. Since the will contained no separate legacies or devises, the entire estate distributes under intestate succession rules. Under Art. 996 of the Civil Code, the surviving spouse is entitled to a share equal to that of each legitimate child. With 3 legitimate children and 1 spouse, there are 4 equal shares of ₱3,000,000 each.

### Example 6: Disinheritance + Representation (TV-08)

> **Luis Villanueva (grandchild, by representation)** receives **₱1,333,333.33**. The decedent left a valid will disposing of the estate. Luis inherits by right of representation (Art. 970 of the Civil Code) in place of Karen (LC3), who was validly disinherited for maltreatment under Art. 919(6) of the Civil Code. Under Art. 923, the children of a disinherited heir step into the disinherited heir's place and preserve the rights of compulsory heirs with respect to the legitime. Under Art. 888, the collective legitime of the legitimate children is one-half (½) of the estate = ₱8,000,000, divided into 3 lines of ₱2,666,666.67 each. Under Art. 974, Karen's line receives ₱2,666,666.67, which is divided equally among 2 representatives at ₱1,333,333.33 each. Note: Karen has no right of usufruct or administration over Luis's inheritance (Art. 923 ¶2).

### Example 7: Cap Rule — Illegitimate Child Reduced (TV-13)

> **Carlo Bautista (illegitimate child)** receives **₱1,666,666.67**. The decedent left a valid will disposing of the estate. As an illegitimate child (Art. 176, Family Code), Carlo is a compulsory heir. Carlo's filiation is established by open and continuous possession of the status of an illegitimate child (Art. 172(3), Family Code). Under Art. 895 of the Civil Code, an illegitimate child's computed legitime would be ₱5,000,000 (½ × ₱10,000,000, the sole legitimate child's share). However, Art. 895 ¶3 provides that the total legitime of all illegitimate children cannot exceed the free portion of the estate. The free portion is ₱10,000,000 (½ of ₱20,000,000). The surviving spouse's legitime of ₱5,000,000 (Art. 892) is satisfied first from this free portion, leaving ₱5,000,000. This remaining amount is divided equally among 3 illegitimate children, giving Carlo ₱1,666,666.67. Note: under intestate succession with the same family composition, Carlo would have received ₱2,857,142.86 — 71% more, because the Art. 895 ¶3 cap rule does not apply in intestate succession.

### Example 8: Collation — Donation Imputed Against Share (TV-11)

> **Pilar Navarro (legitimate child)** receives **₱3,000,000 from the estate** (plus ₱2,000,000 previously received as a donation, for a total of ₱5,000,000). The decedent left a valid will disposing of the estate. As a legitimate child (Art. 887(1) of the Civil Code), Pilar is a compulsory heir. Under Art. 1061 of the Civil Code, the ₱2,000,000 donation to Pilar must be collated (fictitiously added back) to the estate for computing shares. The collation-adjusted estate is ₱20,000,000 (Art. 908). Under Art. 888, the collective legitime is ₱10,000,000 (½ × ₱20,000,000), divided equally among 2 legitimate child lines, giving Pilar ₱5,000,000. Under Art. 1073, the donation is charged against Pilar's share, reducing the amount received from the actual estate to ₱3,000,000.

### Example 9: Inofficious Legacy — Reduced (TV-12)

> **Friend H (legatee, voluntary heir)** receives **₱2,500,000**. The decedent left a valid will disposing of the estate. The testator's will provided a legacy of ₱6,000,000 to Friend H. However, the total testamentary dispositions to voluntary heirs (₱6,000,000) exceed the free portion (₱2,500,000), making this disposition inofficious under Art. 911 of the Civil Code. As a non-preferred disposition, it is reduced to fit within the available free portion. Friend H's legacy is therefore reduced from ₱6,000,000 to ₱2,500,000 to respect the compulsory heirs' legitimes. Note: Xena (surviving spouse) was omitted from the will but this is not preterition under Art. 854, as the spouse is not in the direct line. Xena recovers her legitime of ₱2,500,000 under Art. 855.

### Example 10: Adopted Child — Equal Treatment (TV-09)

> **Sam Torres (adopted child)** receives **₱1,875,000**. The decedent left a valid will disposing of the estate. As an adopted child (Art. 887(1) of the Civil Code; RA 8552 Sec. 17: adopted children have the same successional rights as legitimate children), Sam is a compulsory heir entitled to an equal share of the collective legitime. Under Art. 888 of the Civil Code, the collective legitime of the legitimate children is one-half (½) of the estate. The collective legitime is ₱7,500,000 (½ × ₱15,000,000), divided equally among 3 legitimate child lines (including Sam), giving each line ₱2,500,000. Sam's share is identical to that of the biological legitimate children Quentin and Rita, confirming that adopted children receive exactly equal treatment under Philippine succession law.

---

## 7. Edge Case Narratives

### 7.1 Escheat to State (I15)

> The decedent died intestate with no surviving heirs within the degrees prescribed by law. Under Art. 1011 of the Civil Code, the State inherits the entire estate. Per Art. 1013, personal property is assigned to the municipality or city of the decedent's last residence, and real estate to the municipalities or cities where situated, for the benefit of public schools and charitable institutions. Under Art. 1014, a legitimate heir may reclaim the estate within five (5) years from delivery to the State.

### 7.2 Total Repudiation (Art. 969)

> **Roberto Cruz (legitimate parent)** receives **₱4,500,000**. The decedent died intestate. All three legitimate children — Ana, Ben, and Carlos — renounced the inheritance. Under Art. 969 of the Civil Code, when all the nearest relatives of a given degree repudiate, those of the following degree inherit in their own right. As a legitimate parent of the decedent (Art. 887(2) of the Civil Code), Roberto is a compulsory heir. The ₱9,000,000 estate is divided equally between both parents at ₱4,500,000 each.

### 7.3 Spouse with Articulo Mortis (Art. 900 ¶2)

> **Lucia Lim (surviving spouse)** receives **₱2,666,666.67**. The decedent died intestate. As the surviving spouse (Art. 887(3) of the Civil Code), Lucia is a compulsory heir. Under Art. 900 of the Civil Code, when the surviving spouse is the sole compulsory heir, the spouse's legitime is one-half (½) of the estate. However, Art. 900 ¶2 applies: the marriage was contracted in articulo mortis (at the point of death), the decedent died within three months of the marriage, and the illness was known at the time of the ceremony. The spouse's legitime is therefore reduced from one-half (½) to one-third (⅓) of the estate: ₱8,000,000 × ⅓ = ₱2,666,666.67.

### 7.4 Invalid Disinheritance — Reinstated Heir

> **Ana Santos (legitimate child)** receives **₱3,000,000**. The decedent left a will that purported to disinherit Ana. However, the disinheritance is invalid under Art. 918 of the Civil Code because the stated cause was not proven (Art. 917 requires proof or acknowledgment by the disinherited heir in the same will or another document). Ana is reinstated as a compulsory heir with her full legitime restored. Under Art. 888, the collective legitime is ₱6,000,000 (½ × ₱12,000,000), giving each of the 2 legitimate child lines ₱3,000,000.

---

## 8. NarrativeConfig — Runtime Configuration

```
struct NarrativeConfig {
    include_comparison: bool,       // Include testate-vs-intestate comparison notes
    include_filiation_proof: bool,  // Include filiation proof details for ICs (default: true)
    include_collation_detail: bool, // Include detailed collation math (default: true)
    max_sentences: int,             // Maximum sentences before splitting (default: 15)
    language: String,               // "en" — future: "fil" for Filipino
}
```

Default configuration:
```
NarrativeConfig {
    include_comparison: false,      // Off by default — enabled by user/executor request
    include_filiation_proof: true,
    include_collation_detail: true,
    max_sentences: 15,
    language: "en",
}
```

---

## 9. Validation Rules for Narratives

Every generated narrative must pass these checks:

1. **Amount consistency**: The peso amount in the HEADER must match `InheritanceShare.total` (or `net_from_estate` if collation header)
2. **Article citation**: Every legal conclusion must cite at least one article
3. **Category match**: The `{category_label}` must match the heir's `effective_category`
4. **Computation visibility**: If the share involves a fraction, the multiplication must be shown (e.g., "½ × ₱10,000,000 = ₱5,000,000")
5. **Special event coverage**: Every `Correction` in `ValidationResult` affecting this heir must have a corresponding narrative section
6. **Collation coverage**: If `donations_imputed > 0`, the COLLATION section must be present
7. **Representation coverage**: If `inherits_by == REPRESENTATION`, the REPRESENTATION section must be present
8. **No orphan references**: Do not reference an heir, article, or computation not previously explained
9. **Peso format consistency**: All amounts use ₱ prefix, comma thousands, centavos only when non-zero
10. **Self-containment**: A reader with no prior context can understand the entire narrative without needing any other document

---

## 10. Cross-Reference — Templates by Source Analysis

| Section Type | Primary Source Analysis | Articles |
|-------------|----------------------|----------|
| HEADER | computation-pipeline | — |
| SUCCESSION TYPE | testate-institution, intestate-order | Arts. 842, 854, 960 |
| CATEGORY (LC) | compulsory-heirs-categories | Art. 887(1) |
| CATEGORY (IC) | illegitimate-children-rights | Art. 176 FC, Art. 172 FC |
| CATEGORY (Spouse) | legitime-surviving-spouse | Art. 887(3) |
| CATEGORY (Ascendant) | legitime-ascendants | Art. 887(2) |
| LEGITIME (LC) | legitime-table | Art. 888 |
| LEGITIME (IC uncapped) | legitime-with-illegitimate | Art. 895 |
| LEGITIME (IC capped) | legitime-with-illegitimate | Art. 895 ¶3 |
| LEGITIME (Spouse) | legitime-surviving-spouse | Arts. 892-900 |
| LEGITIME (Ascendant) | legitime-ascendants | Arts. 889-890 |
| CAP RULE | legitime-with-illegitimate | Art. 895 ¶3 |
| INTESTATE SHARE | intestate-order | Arts. 960-1014 |
| FREE PORTION | free-portion-rules | Arts. 842, 908, 960(2) |
| REPRESENTATION | representation-rights | Arts. 970-977 |
| DISINHERITANCE | disinheritance-rules | Arts. 915-923 |
| PRETERITION | preterition | Art. 854 |
| INOFFICIOUS | testate-validation, free-portion-rules | Arts. 908-912 |
| UNDERPROVISION | testate-validation | Art. 855 |
| CONDITION | testate-institution | Art. 872 |
| ACCRETION | accretion-rules | Arts. 1015-1023 |
| SUBSTITUTION | testate-institution | Art. 859 |
| COLLATION | collation | Arts. 1061-1077 |
| RESERVA TRONCAL | legitime-ascendants | Art. 891 |
| ARTICULO MORTIS | legitime-surviving-spouse | Art. 900 ¶2 |
| COMPARISON | computation-pipeline | — |

---

## 11. Test Implications

The following narrative tests must be exercised:

| # | Test | Validates |
|---|------|-----------|
| N-01 | Single heir, intestate | HEADER + SUCCESSION + CATEGORY + INTESTATE SHARE (minimal narrative) |
| N-02 | Multi-heir intestate, equal shares | INTESTATE SHARE with division math |
| N-03 | Intestate 2:1 ratio with IC | Unit method computation display |
| N-04 | Testate with legitime only | LEGITIME section with fraction math |
| N-05 | Testate with FP disposition | LEGITIME + FREE PORTION sections |
| N-06 | IC with cap rule | CAP RULE section, uncapped vs capped amounts |
| N-07 | Representation narrative | REPRESENTATION section with trigger description |
| N-08 | Valid disinheritance, heir ₱0 | Zero-share HEADER + DISINHERITANCE section |
| N-09 | Invalid disinheritance, reinstatement | DISINHERITANCE section with invalidity reason |
| N-10 | Preterition → intestate conversion | PRETERITION + converted SUCCESSION TYPE |
| N-11 | Preterition through representation | PRETERITION section with Art. 854 ¶2 |
| N-12 | Inofficious legacy reduction | INOFFICIOUS section with reduction math |
| N-13 | Underprovision recovery (spouse) | UNDERPROVISION section with waterfall |
| N-14 | Collation — donation within share | Collation HEADER + COLLATION section |
| N-15 | Collation — inofficious donation | Return HEADER + COLLATION section |
| N-16 | Representation collation (Art. 1064) | COLLATION section with parent's donation |
| N-17 | Accretion — FP proportional | ACCRETION section, proportional math |
| N-18 | Accretion — legitime recomputation | ACCRETION section with Art. 1021 |
| N-19 | Substitution | SUBSTITUTION section |
| N-20 | Condition stripped from legitime | CONDITION section, Art. 872 |
| N-21 | Adopted child equal treatment | CATEGORY section with RA 8552 citation |
| N-22 | Escheat to State | Full escheat narrative |
| N-23 | Articulo mortis | ARTICULO MORTIS section |
| N-24 | Reserva troncal warning | RESERVATION section |
| N-25 | Complex: cap + collation + representation | All sections composed correctly, 10+ sentences |
| N-26 | Comparison note (testate vs intestate) | COMPARISON section |
| N-27 | Amount consistency across header/body | Validation rule #1 |
| N-28 | Peso formatting (centavos, commas) | Validation rule #9 |

---

## 12. Summary

The narrative template system consists of:
- **19 section types** covering every possible component of an heir's explanation
- **5 header variants** (standard, collation, zero-share, donation return, reduced)
- **4 succession type templates** (intestate, testate, mixed, preterition-converted)
- **4 category templates** per effective category (LC, IC, spouse, ascendant) plus voluntary/legatee
- **13 special event templates** (representation, disinheritance, preterition, inofficiousness, underprovision, condition, accretion, substitution, collation, articulo mortis, reservation, comparison)
- **6 helper functions** for formatting and label generation
- **10 validation rules** ensuring narrative correctness
- **28 test cases** exercising all narrative pathways
- **10 complete worked examples** demonstrating end-to-end narrative generation

The algorithm is fully deterministic: given the same `InheritanceShare` and computation context, it always produces the same narrative text. No LLM or probabilistic component is used in narrative generation — all text is assembled from templates with variable substitution.
