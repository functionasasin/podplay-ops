# Legitime — Surviving Spouse Deep Dive

**Aspect**: legitime-surviving-spouse
**Wave**: 3 (Legitime Computation)
**Primary Legal Basis**: Arts. 892, 893, 894, 897-900, 1002 (Civil Code); Arts. 994-1001 (intestate)
**Depends On**: compulsory-heirs-categories, heir-concurrence-rules, legitime-table, legitime-with-illegitimate

---

## Overview

The surviving spouse is the **most context-dependent** compulsory heir. Unlike legitimate children (always ½ collective) or ascendants (always ½ collective), the spouse's legitime fraction shifts dramatically based on:

1. **Who they concur with** — children, ascendants, illegitimate children, or alone
2. **How many** legitimate children there are (Art. 892: n=1 vs n≥2 discontinuity)
3. **Marriage circumstances** — articulo mortis (Art. 900 ¶2)
4. **Legal separation** — guilty spouse forfeits (Art. 1002)
5. **Succession type** — testate vs intestate yield different shares

This analysis provides the **complete spouse computation algorithm** for the engine.

---

## Legal Basis

### Testate Legitime Articles

| Article | Scenario | Spouse's Legitime | Source |
|---------|----------|-------------------|--------|
| **Art. 892 ¶1** | 1 legitimate child + spouse | ¼ of estate | From free portion |
| **Art. 892 ¶2** | 2+ legitimate children + spouse | Equal to one child's share = 1/(2n) of estate | From free portion |
| **Art. 892 ¶3** | (applies to both ¶1 and ¶2) | "the legitime of the surviving spouse shall be taken from the portion that can be freely disposed of by the testator" | — |
| **Art. 893** | Ascendants + spouse (no descendants) | ¼ of estate | From free portion |
| **Art. 894** | Illegitimate children + spouse (no legit. heirs) | ⅓ of estate | Direct statutory fraction |
| **Art. 897** | Legitimate children + illegitimate children + spouse | Same as Art. 892 (equal to one legitimate child's share) | From free portion |
| **Art. 898** | Same as Art. 897 | Same share (historical distinction between illegitimate sub-types, now unified by FC Art. 176) | From free portion |
| **Art. 899** | Ascendants + illegitimate children + spouse | ⅛ of estate | Direct statutory fraction |
| **Art. 900 ¶1** | Spouse ALONE (no other compulsory heirs) | ½ of estate | Direct statutory fraction |
| **Art. 900 ¶2** | Spouse alone, articulo mortis marriage | ⅓ of estate | Direct statutory fraction |

### Intestate Articles

| Article | Scenario | Spouse's Share | Mechanism |
|---------|----------|---------------|-----------|
| **Art. 994/996** | Legitimate children + spouse | Same as one child | Proportional (children + spouse divide estate) |
| **Art. 997** | Ascendants + spouse | ½ of estate | Fixed fraction |
| **Art. 998** | Illegitimate children + spouse | ½ of estate | Fixed fraction |
| **Art. 999** | Legitimate + illegitimate children + spouse | Same as one legitimate child | Unit ratio: 2 units per LC, 1 per IC, 2 for spouse |
| **Art. 1000** | Ascendants + illegitimate children + spouse | ¼ of estate | Fixed fraction |
| **Art. 1001** | Siblings + spouse (no ascendants, no children) | ½ of estate | Fixed fraction |
| **Art. 995** | Spouse alone (no descendants, ascendants, illegit. children) | Entire estate | Subject to Art. 1001 (siblings share) |

### Disqualification Articles

| Article | Rule |
|---------|------|
| **Art. 1002** | If legal separation exists AND the surviving spouse gave cause, they receive NOTHING |
| **Art. 921** | Grounds for disinheriting a spouse (6 causes) |
| **Art. 1032** | Unworthiness grounds (8 causes) — applicable to spouse |

---

## The Two Key Insights

### Insight 1: Source of Spouse's Legitime

In testate succession, the spouse's legitime has two distinct sourcing mechanisms:

**Charged to the Free Portion (Regime A & B)**:
- Art. 892 ¶3: When concurring with legitimate children → spouse's share comes from FP
- Art. 893 ¶2: When concurring with ascendants → spouse's ¼ comes from FP
- Art. 897/898: When concurring with legit + illegit children → same as Art. 892, from FP

**Direct Statutory Fraction (Regime C)**:
- Art. 894: Illegitimate children + spouse → ⅓ each (no FP-sourcing language)
- Art. 899: Ascendants + illegitimate + spouse → ⅛ (no FP-sourcing language)
- Art. 900: Spouse alone → ½ (direct fraction)

**Why This Matters for the Engine**:

When the spouse's share is "from the free portion," it interacts with the Art. 895 ¶3 cap rule — the spouse is satisfied FIRST, then illegitimate children get whatever remains of the FP. This creates the cap computation pipeline:

```
FP_total = E - legitimate_children_collective_legitime
spouse_legitime = compute_spouse_share(scenario)   // satisfied FIRST
FP_after_spouse = FP_total - spouse_legitime
illegitimate_cap = FP_after_spouse                 // Art. 895 ¶3
```

When the spouse's share is a direct statutory fraction (Regime C), there is no FP-sourcing interaction because these scenarios (T9, T10) have pre-determined fixed fractions that always sum correctly.

### Insight 2: The Art. 892 Discontinuity

Art. 892 creates a mathematical discontinuity at n=1 vs n=2:

| n (legitimate children) | Spouse's Legitime | As fraction of E |
|------------------------|-------------------|------------------|
| 1 | ¼ of estate (Art. 892 ¶1) | 0.25 |
| 2 | equal to one child = ½ ÷ 2 = ¼ of estate | 0.25 |
| 3 | equal to one child = ½ ÷ 3 = ⅙ of estate | 0.167 |
| 4 | equal to one child = ½ ÷ 4 = ⅛ of estate | 0.125 |
| 5 | equal to one child = ½ ÷ 5 = 1/10 of estate | 0.10 |
| 10 | equal to one child = ½ ÷ 10 = 1/20 of estate | 0.05 |

**Coincidental match at n=2**: At n=2, the spouse gets 1/(2×2) = ¼, which happens to equal the n=1 case. But the legal basis is different (¶1 vs ¶2), and the interaction with the free portion is different:

- n=1: FP = ½, spouse takes ¼ from FP, leaving ¼ for illegitimate children/testamentary dispositions
- n=2: FP = ½, spouse takes ¼ from FP, leaving ¼ — same result, different formula path

The discontinuity becomes visible when comparing n=1 vs n=2 with many illegitimate children:

| | n=1 (T5a) | n=2 (T5b) |
|---|-----------|-----------|
| FP | ½ = 0.5 | ½ = 0.5 |
| Spouse from FP | ¼ = 0.25 | ¼ = 0.25 |
| Remaining FP for IC | ¼ = 0.25 | ¼ = 0.25 |
| Cap threshold | m > 1 | m > 2(2-1) = 2 |

Even though the spouse's share is numerically identical, the cap threshold is different because the per-legitimate-child share differs (½ vs ¼), which changes the uncapped illegitimate share (¼ vs ⅛).

---

## Complete Spouse Legitime Table (Testate)

### Master Table: Every Scenario

| Scenario | Concurring Heirs | Spouse Fraction | Peso Amount (E=₱12M) | Legal Basis | Notes |
|----------|-----------------|----------------|----------------------|-------------|-------|
| T1 | Legitimate children only | — | — | — | No spouse |
| T2 | 1 LC + spouse | ¼ | ₱3,000,000 | Art. 892 ¶1 | From FP |
| T3 (n=2) | 2 LC + spouse | ¼ | ₱3,000,000 | Art. 892 ¶2 | = 1 child's share |
| T3 (n=3) | 3 LC + spouse | ⅙ | ₱2,000,000 | Art. 892 ¶2 | = 1 child's share |
| T3 (n=4) | 4 LC + spouse | ⅛ | ₱1,500,000 | Art. 892 ¶2 | = 1 child's share |
| T4 | LC + IC (no spouse) | — | — | — | No spouse |
| T5a | 1 LC + IC + spouse | ¼ | ₱3,000,000 | Art. 892 ¶1, 897 | From FP, spouse first |
| T5b (n=2) | 2 LC + IC + spouse | ¼ | ₱3,000,000 | Art. 892 ¶2, 897 | From FP, spouse first |
| T5b (n=3) | 3 LC + IC + spouse | ⅙ | ₱2,000,000 | Art. 892 ¶2, 897 | From FP, spouse first |
| T6 | Ascendants only | — | — | — | No spouse |
| T7 | Ascendants + spouse | ¼ | ₱3,000,000 | Art. 893 | From FP |
| T8 | Ascendants + IC | — | — | — | No spouse |
| T9 | Ascendants + IC + spouse | ⅛ | ₱1,500,000 | Art. 899 | Direct fraction |
| T10 | IC + spouse | ⅓ | ₱4,000,000 | Art. 894 | Direct fraction |
| T11 | IC only | — | — | — | No spouse |
| T12 | Spouse only | ½ | ₱6,000,000 | Art. 900 ¶1 | Direct fraction |
| T12-AM | Spouse only (articulo mortis) | ⅓ | ₱4,000,000 | Art. 900 ¶2 | Reduced fraction |
| T13 | No compulsory heirs | — | — | — | No spouse |
| T14 | Parents of illegit. decedent | — | — | — | No spouse |
| T15 | Parents + spouse of illegit. decedent | ¼ | ₱3,000,000 | Art. 903 ¶2 | Direct fraction |

### Observations

1. **Spouse's share ranges from ⅛ (T9) to ½ (T12)** — a 4× range depending on concurring heirs
2. **The ¼ fraction appears most often**: T2, T3(n=2), T5a, T5b(n=2), T7, T15
3. **Art. 892 ¶1 (¼ with 1 child) is the ONLY case where the spouse's share is explicitly lower than the child's** — in T2, the child gets ½ and the spouse gets ¼ (a 2:1 ratio favoring the child)
4. **Art. 892 ¶2 (n≥2) creates equality**: spouse = one child = 1/(2n). The spouse is treated as "one of the children" for share purposes, though the legal source differs (FP vs legitime)

---

## Complete Spouse Share Table (Intestate)

| Scenario | Concurring Heirs | Spouse Share | Peso Amount (E=₱12M) | Legal Basis |
|----------|-----------------|-------------|----------------------|-------------|
| I1 | LC only | — | — | No spouse |
| I2 | LC + spouse | = 1 child's share | ₱3,000,000 (n=3) | Art. 996 |
| I3 | LC + IC | — | — | No spouse |
| I4 | LC + IC + spouse | = 1 legitimate child | ₱2,400,000 (n=3,m=2) | Art. 999 |
| I5 | Ascendants only | — | — | No spouse |
| I6 | Ascendants + spouse | ½ | ₱6,000,000 | Art. 997 |
| I7 | IC only | — | — | No spouse |
| I8 | IC + spouse | ½ | ₱6,000,000 | Art. 998 |
| I9 | Ascendants + IC | — | — | No spouse |
| I10 | Ascendants + IC + spouse | ¼ | ₱3,000,000 | Art. 1000 |
| I11 | Spouse only | 1 (entire estate) | ₱12,000,000 | Art. 995 |
| I12 | Siblings + spouse | ½ | ₱6,000,000 | Art. 1001 |
| I13 | Siblings + IC | — | — | No spouse |
| I14 | Collaterals only | — | — | No spouse |
| I15 | State | — | — | No spouse |

---

## Testate vs. Intestate Comparison

The spouse often receives **more** in intestate than in testate succession:

| Concurrence | Testate Spouse | Intestate Spouse | Difference | Why |
|-------------|---------------|-----------------|------------|-----|
| 1 LC + S | ¼ | ½ (= 1 child) | +100% intestate | Testate: ¼ fixed; intestate: equal to child |
| 2 LC + S | ¼ | ⅓ | +33% intestate | Testate: 1/(2n)=¼; intestate: 1/(n+1)=⅓ |
| 3 LC + S | ⅙ | ¼ | +50% intestate | Testate: 1/(2n)=⅙; intestate: 1/(n+1)=¼ |
| Ascendants + S | ¼ | ½ | +100% intestate | Art. 893 vs Art. 997 |
| IC + S | ⅓ | ½ | +50% intestate | Art. 894 vs Art. 998 |
| Ascendants + IC + S | ⅛ | ¼ | +100% intestate | Art. 899 vs Art. 1000 |
| Spouse alone | ½ | 1 (entire) | +100% intestate | Art. 900 vs Art. 995 |

**Key insight**: In testate succession, the testator can use the free portion for purposes other than the spouse (charity, friends, etc.). In intestate succession, there is no free portion — the entire estate is distributed among legal heirs, so the spouse generally gets a larger absolute share.

**Exception**: When the testator's will explicitly gives the free portion to the spouse, the testate result can equal or exceed the intestate result.

---

## Special Rule: Articulo Mortis (Art. 900 ¶2)

### The Rule

> "If the marriage between the surviving spouse and the testator was solemnized in articulo mortis, and the testator died within three months from the time of the marriage, the legitime of the surviving spouse as the sole heir shall be one-third of the hereditary estate, except when they have been living as husband and wife for more than five years."

### Conditions (ALL must be true)

1. **Marriage solemnized in articulo mortis** (at the point of death) — OR the testator was already ill at the time of marriage AND the illness was the cause of death
2. **Death within 3 months** of the marriage
3. **NOT living together as husband and wife for 5+ years** before the marriage

### When It Applies

**ONLY Scenario T12** — spouse as sole compulsory heir. The article says "as the sole heir," which means this reduction does NOT apply when the spouse concurs with any other compulsory heir (children, ascendants, illegitimate children).

### Pseudocode

```
function compute_spouse_articulo_mortis(
    spouse: Heir,
    decedent: Decedent,
    scenario: ScenarioCode
) -> Fraction {

    // Only applies when spouse is the SOLE compulsory heir
    if scenario != T12:
        return null  // articulo mortis check irrelevant

    // Check all 3 conditions
    marriage_in_extremis = (
        decedent.marriage_solemnized_in_articulo_mortis
        OR (decedent.was_ill_at_marriage AND decedent.illness_caused_death)
    )

    died_within_3_months = (
        decedent.date_of_death - decedent.date_of_marriage
    ).total_months() < 3

    cohabitation_exception = decedent.years_of_cohabitation >= 5

    if marriage_in_extremis AND died_within_3_months AND NOT cohabitation_exception:
        return Rational(1, 3)   // Reduced: ⅓ instead of ½
    else:
        return Rational(1, 2)   // Normal: ½
}
```

### Data Model Requirements

The engine needs these fields on the Decedent struct:

```
struct Decedent {
    // ... other fields ...
    date_of_marriage: Date
    date_of_death: Date
    marriage_solemnized_in_articulo_mortis: bool
    was_ill_at_marriage: bool
    illness_caused_death: bool
    years_of_cohabitation: int   // years living together before marriage
}
```

### Edge Case: Articulo Mortis + Other Compulsory Heirs

If a testator marries in articulo mortis but has children or ascendants, Art. 900 ¶2 does NOT apply. The spouse gets their normal share per Art. 892/893/etc. The reduction is narrowly scoped to the "sole heir" scenario.

**Example**: D marries S on his deathbed. D has one legitimate child (LC1). D dies 2 months later. Even though the marriage was in articulo mortis, Art. 892 ¶1 applies (not Art. 900 ¶2). S gets ¼, not ⅓.

---

## Special Rule: Legal Separation (Art. 1002)

### The Rule

> "In case of a legal separation, if the surviving spouse gave cause for the separation, he or she shall not have any of the rights granted in the preceding articles."

### Conditions

1. **Legal separation exists** — a court decree of legal separation must be in effect at the time of death
2. **The surviving spouse was the GUILTY party** — the surviving spouse gave cause for the separation

### Effect

The guilty surviving spouse receives **NOTHING** — no legitime, no intestate share. They are completely removed from the computation.

### What About the Innocent Spouse?

Art. 892 ¶1 includes a clarifying clause: "In case of a legal separation, the surviving spouse may inherit if it was the deceased who had given cause for the same."

So:
- **Guilty surviving spouse** → forfeits all succession rights
- **Innocent surviving spouse** (decedent was guilty) → retains full succession rights

### Pseudocode

```
function is_spouse_disqualified_by_legal_separation(
    spouse: Heir,
    decedent: Decedent
) -> bool {
    if NOT decedent.has_legal_separation:
        return false
    // Guilty spouse = the one who gave cause for legal separation
    return spouse.is_guilty_party_in_legal_separation
}
```

### Data Model Requirements

```
struct Decedent {
    // ... other fields ...
    has_legal_separation: bool
    // Note: who is the guilty party is stored on the spouse heir
}

struct Heir {
    // ... other fields ...
    is_guilty_party_in_legal_separation: bool  // only relevant for spouse
}
```

### Interaction with Scenario Determination

When the spouse is disqualified by legal separation, they are **removed from the heir pool** before scenario determination. This can change the scenario entirely:

| Original Scenario | With Guilty Spouse Removed | Effect |
|-------------------|---------------------------|--------|
| T2 (1 LC + S) | T1 (1 LC only) | FP increases from ¼ to ½ |
| T3 (n LC + S) | T1 (n LC only) | FP increases from (n-1)/(2n) to ½ |
| T5a (1 LC + IC + S) | T4 (1 LC + IC) | IC cap threshold changes from m>1 to m>2 |
| T5b (n LC + IC + S) | T4 (n LC + IC) | IC cap threshold relaxes |
| T7 (Ascendants + S) | T6 (Ascendants only) | FP increases from ¼ to ½ |
| T9 (Asc + IC + S) | T8 (Asc + IC) | FP increases from ⅛ to ¼ |
| T10 (IC + S) | T11 (IC only) | FP increases from ⅓ to ½ |
| T12 (S only) | T13 (no compulsory heirs) | FP becomes entire estate |
| T15 (Parents of illegit. + S) | T14 (Parents of illegit.) | FP increases from ½ to ½ (no change) |

**Key**: Removing the guilty spouse always increases the free portion available to the testator and relaxes any cap on illegitimate children.

---

## Special Rule: Disinheritance of Spouse (Art. 921)

### Valid Grounds

A spouse may be disinherited in a will for these causes (all 6 required to be specified in the will per Art. 916):

1. Convicted of attempt against testator's life, or descendants, or ascendants
2. False accusation of a crime (6+ years imprisonment)
3. Fraud, violence, intimidation, or undue influence causing testator to make/change a will
4. Given cause for legal separation
5. Given grounds for loss of parental authority
6. Unjustifiable refusal to support children or the other spouse

### Effect on Computation

Valid disinheritance of the spouse has the same effect as legal separation guilt: the spouse is removed from the computation entirely. However, unlike legal separation (which applies automatically by operation of law), disinheritance:

- Must be in a will (Art. 916)
- Must specify the cause (Art. 918)
- The burden of proof falls on other heirs if contested (Art. 917)
- Can be rendered ineffective by reconciliation (Art. 922)

### Key Difference from Children's Disinheritance

When a child is disinherited, their descendants take their place by representation (Art. 923). There is **no equivalent for the spouse** — the spouse has no "descendants in the spousal line" who could step in. Disinheritance of the spouse simply removes them.

### Pseudocode

```
function is_spouse_disinherited(
    spouse: Heir,
    will: Will
) -> bool {
    if will == null:
        return false
    disinheritance = find_disinheritance_clause(will, spouse)
    if disinheritance == null:
        return false
    // Art. 918: Must specify a cause from Art. 921
    if disinheritance.cause NOT in VALID_SPOUSE_DISINHERITANCE_CAUSES:
        return false   // Invalid disinheritance → spouse retains legitime
    // Art. 922: Reconciliation nullifies disinheritance
    if disinheritance.reconciliation_occurred:
        return false
    return true   // Valid disinheritance
}
```

---

## The Master Spouse Computation Algorithm

```
function compute_spouse_legitime(
    estate: Rational,
    spouse: Heir,
    decedent: Decedent,
    all_heirs: List<Heir>,
    will: Will?,
    scenario: ScenarioCode,
    succession_type: TESTATE | INTESTATE
) -> SpouseLegitimeResult {

    // ============================================================
    // PHASE 1: DISQUALIFICATION CHECKS
    // ============================================================

    // Check 1: Legal separation (Art. 1002)
    if is_spouse_disqualified_by_legal_separation(spouse, decedent):
        return { amount: 0, disqualified: true, reason: "Art. 1002: guilty party in legal separation" }

    // Check 2: Disinheritance (Art. 921) — testate only
    if succession_type == TESTATE AND is_spouse_disinherited(spouse, will):
        return { amount: 0, disqualified: true, reason: "Art. 921: validly disinherited" }

    // Check 3: Unworthiness (Art. 1032) — handled in heir eligibility filter
    // (Assumed already filtered before this function is called)

    // ============================================================
    // PHASE 2: COMPUTE FRACTION BASED ON SCENARIO
    // ============================================================

    if succession_type == TESTATE:
        return compute_spouse_testate(estate, spouse, decedent, scenario)
    else:
        return compute_spouse_intestate(estate, spouse, decedent, all_heirs, scenario)
}

function compute_spouse_testate(
    estate: Rational,
    spouse: Heir,
    decedent: Decedent,
    scenario: ScenarioCode
) -> SpouseLegitimeResult {

    match scenario {

        // === Regime A: Descendants Present ===

        T2:   // 1 legitimate child + spouse
            fraction = Rational(1, 4)   // Art. 892 ¶1
            source = "free_portion"
            basis = "Art. 892 ¶1"

        T3:   // n≥2 legitimate children + spouse
            n = count_legitimate_child_lines()
            fraction = Rational(1, 2 * n)   // Art. 892 ¶2: equal to one child's share
            source = "free_portion"
            basis = "Art. 892 ¶2"

        T5a:  // 1 legitimate child + illegitimate children + spouse
            fraction = Rational(1, 4)   // Art. 892 ¶1, Art. 897
            source = "free_portion"
            basis = "Arts. 892 ¶1, 897"

        T5b:  // n≥2 legitimate children + illegitimate children + spouse
            n = count_legitimate_child_lines()
            fraction = Rational(1, 2 * n)   // Art. 892 ¶2, Art. 897
            source = "free_portion"
            basis = "Arts. 892 ¶2, 897"

        // === Regime B: Ascendants Present (No Descendants) ===

        T7:   // Ascendants + spouse
            fraction = Rational(1, 4)   // Art. 893
            source = "free_portion"
            basis = "Art. 893"

        T9:   // Ascendants + illegitimate children + spouse
            fraction = Rational(1, 8)   // Art. 899
            source = "direct_statutory"
            basis = "Art. 899"

        // === Regime C: Concurring Heirs Only ===

        T10:  // Illegitimate children + spouse
            fraction = Rational(1, 3)   // Art. 894
            source = "direct_statutory"
            basis = "Art. 894"

        T12:  // Spouse ALONE
            am = compute_spouse_articulo_mortis(spouse, decedent, scenario)
            fraction = am   // ½ normally, ⅓ if articulo mortis
            source = "direct_statutory"
            basis = am == Rational(1, 3) ? "Art. 900 ¶2 (articulo mortis)" : "Art. 900 ¶1"

        // === Special: Illegitimate Decedent ===

        T15:  // Parents + spouse of illegitimate decedent
            fraction = Rational(1, 4)   // Art. 903 ¶2
            source = "direct_statutory"
            basis = "Art. 903 ¶2"

        // All other scenarios: no spouse present
        _:
            return { amount: 0, disqualified: false, reason: "No spouse in this scenario" }
    }

    amount = estate * fraction
    return {
        amount: amount,
        fraction: fraction,
        source: source,
        basis: basis,
        disqualified: false,
        articulo_mortis_applied: (scenario == T12 AND fraction == Rational(1, 3))
    }
}

function compute_spouse_intestate(
    estate: Rational,
    spouse: Heir,
    decedent: Decedent,
    all_heirs: List<Heir>,
    scenario: ScenarioCode
) -> SpouseLegitimeResult {

    match scenario {

        I2:   // Legitimate children + spouse
            // Art. 996: spouse = same share as each child
            n = count_legitimate_child_lines()
            fraction = Rational(1, n + 1)   // divide estate among n children + 1 spouse
            basis = "Art. 996"

        I4:   // Legitimate + illegitimate children + spouse
            // Art. 999: spouse = same as one legitimate child
            // Unit method: 2 per LC, 1 per IC, 2 for spouse
            n = count_legitimate_child_lines()
            m = count_illegitimate_children()
            total_units = (2 * n) + m + 2
            fraction = Rational(2, total_units)
            basis = "Art. 999"

        I6:   // Ascendants + spouse
            fraction = Rational(1, 2)   // Art. 997
            basis = "Art. 997"

        I8:   // Illegitimate children + spouse
            fraction = Rational(1, 2)   // Art. 998
            basis = "Art. 998"

        I10:  // Ascendants + illegitimate children + spouse
            fraction = Rational(1, 4)   // Art. 1000
            basis = "Art. 1000"

        I11:  // Spouse alone
            fraction = Rational(1, 1)   // Art. 995: entire estate
            basis = "Art. 995"

        I12:  // Siblings + spouse
            fraction = Rational(1, 2)   // Art. 1001
            basis = "Art. 1001"

        _:
            return { amount: 0, disqualified: false, reason: "No spouse in this scenario" }
    }

    amount = estate * fraction
    return {
        amount: amount,
        fraction: fraction,
        source: "intestate_share",
        basis: basis,
        disqualified: false
    }
}
```

---

## Spouse's Free Portion Priority Rule (Art. 895 ¶3)

This is the critical interaction between the spouse's legitime and illegitimate children's cap:

### The Rule

Art. 895 ¶3: "...the legitime of the surviving spouse must first be fully satisfied."

### What This Means

In scenarios where BOTH the spouse and illegitimate children draw from the free portion (T5a, T5b), the computation order is:

1. Compute FP = E - legitimate_children_collective
2. **Deduct spouse's legitime FIRST** from FP
3. The REMAINDER is the cap for total illegitimate children's legitime

### Why This Matters

Without the priority rule, if illegitimate children were satisfied first, the spouse's share could be impaired. The law protects the spouse's share absolutely — illegitimate children bear the risk of cap reduction, not the spouse.

### Scenarios Where Priority Applies

| Scenario | FP | Spouse from FP | Remaining for IC | Cap = |
|----------|-----|---------------|-----------------|-------|
| T5a (n=1) | E/2 | E/4 (Art. 892 ¶1) | E/4 | E/4 |
| T5b (n=2) | E/2 | E/4 (Art. 892 ¶2) | E/4 | E/4 |
| T5b (n=3) | E/2 | E/6 (Art. 892 ¶2) | E/3 | E/3 |
| T5b (n=4) | E/2 | E/8 (Art. 892 ¶2) | 3E/8 | 3E/8 |

### Scenarios Where Priority Does NOT Apply

- T2, T3: No illegitimate children → no cap needed
- T7: No illegitimate children → no cap needed
- T9, T10: Flat statutory fractions → no FP-sourcing interaction
- T4: No spouse → spouse priority irrelevant

---

## Worked Examples

### Example 1: Spouse with 1 Legitimate Child (T2)

**Inputs**: E = ₱10,000,000, n = 1, spouse present, no illegitimate children, testate

| Heir | Legitime | Fraction | Basis |
|------|----------|----------|-------|
| LC1 | ₱5,000,000 | ½ | Art. 888 |
| Spouse | ₱2,500,000 | ¼ | Art. 892 ¶1 |
| **FP** | **₱2,500,000** | **¼** | |

**Narrative (Spouse)**:
> **S (surviving spouse)** receives **₱2,500,000** as legitime.
> Under Art. 892 ¶1 of the Civil Code, when only one legitimate child survives, the surviving spouse is entitled to one-fourth (¼) of the hereditary estate. This share is taken from the free portion (Art. 892 ¶3). The free portion is ₱5,000,000 (½ of ₱10,000,000); after the spouse's ₱2,500,000 legitime, ₱2,500,000 remains for testamentary disposition.

### Example 2: Spouse with 4 Legitimate Children (T3)

**Inputs**: E = ₱16,000,000, n = 4, spouse present, testate

| Heir | Legitime | Fraction | Basis |
|------|----------|----------|-------|
| Each LC (×4) | ₱2,000,000 | ⅛ = 1/(2×4) | Art. 888 |
| Spouse | ₱2,000,000 | ⅛ = 1/(2×4) | Art. 892 ¶2 |
| **Total legitime** | **₱10,000,000** | | |
| **FP** | **₱6,000,000** | **⅜** | |

**Verification**: 4 × ₱2M + ₱2M = ₱10M. FP = ₱16M - ₱10M = ₱6M. ✓

**Narrative (Spouse)**:
> **S (surviving spouse)** receives **₱2,000,000** as legitime.
> Under Art. 892 ¶2 of the Civil Code, when two or more legitimate children survive, the surviving spouse is entitled to a portion equal to the legitime of each legitimate child. The children's collective legitime is ₱8,000,000 (½ of ₱16,000,000), divided among 4 children at ₱2,000,000 each. The spouse receives an equal amount of ₱2,000,000, taken from the free portion (Art. 892 ¶3).

### Example 3: Spouse with Ascendants and Illegitimate Children (T9)

**Inputs**: E = ₱8,000,000, both parents alive, m = 2 illegitimate children, spouse present, testate

| Heir | Legitime | Fraction | Basis |
|------|----------|----------|-------|
| Father | ₱2,000,000 | ¼ | Art. 889, 890 |
| Mother | ₱2,000,000 | ¼ | Art. 889, 890 |
| IC1 | ₱1,000,000 | ⅛ = ¼/2 | Art. 899 (¼ collective ÷ 2) |
| IC2 | ₱1,000,000 | ⅛ = ¼/2 | Art. 899 |
| Spouse | ₱1,000,000 | ⅛ | Art. 899 |
| **Total legitime** | **₱7,000,000** | | |
| **FP** | **₱1,000,000** | **⅛** | |

**Narrative (Spouse)**:
> **S (surviving spouse)** receives **₱1,000,000** as legitime.
> Under Art. 899 of the Civil Code, when legitimate ascendants, illegitimate children, and the surviving spouse all concur, the spouse is entitled to one-eighth (⅛) of the hereditary estate. This is the smallest spouse legitime fraction in the Civil Code, as three other compulsory heir groups absorb most of the estate: the legitimate parents receive one-half (₱4,000,000), illegitimate children receive one-fourth (₱2,000,000), and the spouse receives one-eighth (₱1,000,000), leaving only one-eighth (₱1,000,000) as the free portion.

### Example 4: Spouse Alone, Articulo Mortis (T12-AM)

**Inputs**: E = ₱6,000,000, no other heirs, marriage solemnized in articulo mortis, death within 2 months, cohabitation < 5 years

| Heir | Legitime | Fraction | Basis |
|------|----------|----------|-------|
| Spouse | ₱2,000,000 | ⅓ | Art. 900 ¶2 (articulo mortis) |
| **FP** | **₱4,000,000** | **⅔** | |

**Narrative (Spouse)**:
> **S (surviving spouse)** receives **₱2,000,000** as legitime.
> S is the sole compulsory heir. Under Art. 900 ¶1, the surviving spouse as sole heir is normally entitled to one-half (½) of the estate. However, the marriage was solemnized in articulo mortis (at the point of death), and the testator died within three months of the marriage. Under Art. 900 ¶2, the spouse's legitime is reduced to one-third (⅓) of the estate. This reduction does not apply because S and the decedent were not living as husband and wife for more than five years before the marriage. S's legitime is therefore ₱2,000,000 (⅓ of ₱6,000,000).

### Example 5: Spouse Intestate with Ascendants (I6)

**Inputs**: E = ₱10,000,000, both parents alive, no children, no illegitimate children, intestate

| Heir | Share | Amount | Basis |
|------|-------|--------|-------|
| Father | ¼ | ₱2,500,000 | Art. 997 (½ to ascendants, equal split) |
| Mother | ¼ | ₱2,500,000 | Art. 997 |
| Spouse | ½ | ₱5,000,000 | Art. 997 |
| **Total** | | **₱10,000,000** | |

Compare with testate (T7): Spouse gets ¼ (₱2,500,000) — half of the intestate amount.

### Example 6: Guilty Spouse Removed (Legal Separation)

**Inputs**: E = ₱10,000,000, 2 legitimate children, surviving spouse gave cause for legal separation, testate

**Without legal separation**: Scenario T3, spouse gets ¼ (₱2,500,000), FP = ¼

**With legal separation (spouse removed)**: Scenario becomes T1, no spouse. FP = ½ (₱5,000,000).

| Heir | Without Legal Sep. | With Legal Sep. | Change |
|------|-------------------|-----------------|--------|
| LC1 | ₱2,500,000 (legitime) | ₱2,500,000 (legitime) | No change |
| LC2 | ₱2,500,000 (legitime) | ₱2,500,000 (legitime) | No change |
| Spouse | ₱2,500,000 | ₱0 (disqualified) | -₱2,500,000 |
| FP | ₱2,500,000 | ₱5,000,000 | +₱2,500,000 |

The children's legitime is unchanged — the spouse's disqualified share goes to the free portion.

---

## Edge Cases

### 1. De Facto Separation vs Legal Separation

Art. 1002 requires a **court decree** of legal separation. Mere de facto (physical) separation does not disqualify the spouse. The engine must check for a formal legal separation decree, not just whether the couple lived apart.

```
// WRONG: checking if they lived apart
// RIGHT: checking for court decree
is_disqualified = decedent.has_legal_separation_decree AND spouse.is_guilty_party
```

### 2. Annulled Marriage vs Legal Separation

If the marriage was **annulled** or declared **void ab initio** (e.g., for bigamy, lack of consent), there is no surviving spouse at all. The person is not a spouse — they have no succession rights. This is a different disqualification from Art. 1002.

The engine's heir classification step should check marriage validity before classifying someone as a surviving spouse.

### 3. Remarriage After Legal Separation

Legal separation does not dissolve the marriage bond in the Philippines. If D legally separates from S1 and then "remarries" S2, the second marriage is bigamous and void. S1 remains the legal surviving spouse (though potentially disqualified under Art. 1002). S2 has no succession rights.

### 4. Spouse's Legitime Cannot Be Reduced by Conditions

Art. 872: "The testator cannot impose any charge, condition, or substitution whatsoever upon the legitimes prescribed in this Code. Should he do so, the same shall be considered as not imposed."

A will that says "I leave ¼ to my spouse but only if she does not remarry" — the condition is void; the spouse gets the ¼ unconditionally.

### 5. Collation of Donations to Spouse

Art. 1066: "Neither shall donations to the spouse of the child be brought to collation; but if they have been given by the parent to the spouses jointly, the child shall be obliged to bring to collation one-half of the thing donated."

Donations to the surviving spouse by the decedent during lifetime are NOT subject to collation. However, Art. 909 applies: "Donations made to strangers shall be charged to that part of the estate of which the testator could have disposed." If the donation to the spouse exceeds the free portion, it may be inofficious and subject to reduction (Art. 911).

### 6. Usufruct Option (Art. 911 ¶3)

If the spouse's legitime consists of a usufruct or life annuity (an unusual but possible testamentary structure), Art. 911(3) gives compulsory heirs a choice: comply with the testamentary provision OR deliver the disposable portion in full ownership. This only matters when the will structures the spouse's share as a usufruct rather than outright ownership.

### 7. Art. 1001 — Siblings Concurring with Spouse (Intestate Only)

Art. 1001: "Should brothers and sisters or their children survive with the widow or widower, the latter shall be entitled to one-half of the inheritance."

This is the only intestate scenario where the spouse shares with non-compulsory heirs (collateral relatives). Key rules:
- Spouse gets ½ outright
- Siblings get the other ½ (divided per Arts. 1004-1008)
- This only arises when there are NO descendants, NO ascendants, and NO illegitimate children
- The spouse does NOT exclude siblings in intestate — they share

### 8. Spouse of Illegitimate Decedent (Art. 903)

When the decedent is an illegitimate child, the spouse's rights follow Art. 903 ¶2 (testate: ¼) or the intestate equivalent. The spouse of an illegitimate decedent is still a surviving spouse under Art. 887(3) — the decedent's own legitimacy status does not affect the spouse's classification.

### 9. Multiple Marriages — Which Spouse?

Only the surviving spouse from the **last valid marriage** has succession rights. In the Philippines, only the spouse from a subsisting marriage at the time of death is the surviving spouse. If D was married to S1, S1 died, D married S2 → S2 is the surviving spouse. If D was married to S1, D married S2 without annulment → S2's marriage is bigamous/void, S1 is the surviving spouse.

---

## Interactions with Other Heir Types

### Spouse + Legitimate Children (Regime A)

| Interaction | Rule |
|-------------|------|
| Spouse's fraction depends on child count | Art. 892: ¼ for n=1, 1/(2n) for n≥2 |
| Spouse's share from FP | Art. 892 ¶3 |
| Spouse = one child for intestate purposes | Art. 996, 999 |
| Spouse cannot represent a child | Representation is only in the descending line (Art. 972) |

### Spouse + Illegitimate Children (Cap Interaction)

| Interaction | Rule |
|-------------|------|
| Spouse satisfied FIRST from FP | Art. 895 ¶3 |
| Spouse's presence lowers IC cap threshold | Because spouse consumes part of FP before IC |
| Spouse's share is NEVER reduced by IC | Art. 895 ¶3 protects spouse absolutely |

### Spouse + Ascendants

| Interaction | Rule |
|-------------|------|
| Testate: Spouse gets ¼, ascendants get ½ | Arts. 889, 893 |
| Intestate: Spouse gets ½, ascendants get ½ | Art. 997 |
| Spouse's share doubles from testate to intestate | Because FP (¼ in testate) goes entirely to spouse in intestate |

### Spouse + Siblings (Intestate Only)

| Interaction | Rule |
|-------------|------|
| Spouse gets ½, siblings get ½ | Art. 1001 |
| Only when all 4 compulsory groups absent (except spouse) | Siblings are not compulsory heirs |
| Full-blood siblings get double half-blood | Art. 1006 applies within siblings' ½ |

---

## Test Implications

### Core Fraction Tests (Testate)

| # | Scenario | E | n | m | Expected Spouse | Expected FP | Basis |
|---|----------|---|---|---|----------------|-------------|-------|
| 1 | T2 | ₱10M | 1 | 0 | ₱2,500,000 (¼) | ₱2,500,000 | Art. 892 ¶1 |
| 2 | T3 | ₱12M | 2 | 0 | ₱3,000,000 (¼) | ₱3,000,000 | Art. 892 ¶2 |
| 3 | T3 | ₱12M | 3 | 0 | ₱2,000,000 (⅙) | ₱4,000,000 | Art. 892 ¶2 |
| 4 | T3 | ₱16M | 4 | 0 | ₱2,000,000 (⅛) | ₱6,000,000 | Art. 892 ¶2 |
| 5 | T5a | ₱10M | 1 | 1 | ₱2,500,000 (¼) | ₱0 | Arts. 892 ¶1, 897 |
| 6 | T5a | ₱10M | 1 | 3 | ₱2,500,000 (¼) | ₱0 | Art. 892 ¶1 (unaffected by IC count) |
| 7 | T5b | ₱12M | 3 | 2 | ₱2,000,000 (⅙) | ₱2,000,000 | Arts. 892 ¶2, 897 |
| 8 | T7 | ₱10M | 0 | 0 | ₱2,500,000 (¼) | ₱2,500,000 | Art. 893 |
| 9 | T9 | ₱8M | 0 | 2 | ₱1,000,000 (⅛) | ₱1,000,000 | Art. 899 |
| 10 | T10 | ₱9M | 0 | 3 | ₱3,000,000 (⅓) | ₱3,000,000 | Art. 894 |
| 11 | T12 | ₱10M | 0 | 0 | ₱5,000,000 (½) | ₱5,000,000 | Art. 900 ¶1 |
| 12 | T12-AM | ₱10M | 0 | 0 | ₱3,333,333 (⅓) | ₱6,666,667 | Art. 900 ¶2 |
| 13 | T15 | ₱10M | 0 | 0 | ₱2,500,000 (¼) | ₱5,000,000 | Art. 903 ¶2 |

### Core Fraction Tests (Intestate)

| # | Scenario | E | n | m | Expected Spouse | Basis |
|---|----------|---|---|---|----------------|-------|
| 14 | I2 | ₱10M | 2 | 0 | ₱3,333,333 (⅓) | Art. 996 |
| 15 | I2 | ₱12M | 3 | 0 | ₱3,000,000 (¼) | Art. 996 |
| 16 | I4 | ₱14M | 2 | 1 | ₱4,000,000 (2/7) | Art. 999 |
| 17 | I6 | ₱10M | 0 | 0 | ₱5,000,000 (½) | Art. 997 |
| 18 | I8 | ₱10M | 0 | 2 | ₱5,000,000 (½) | Art. 998 |
| 19 | I10 | ₱8M | 0 | 2 | ₱2,000,000 (¼) | Art. 1000 |
| 20 | I11 | ₱10M | 0 | 0 | ₱10,000,000 (1) | Art. 995 |
| 21 | I12 | ₱10M | 0 | 0 | ₱5,000,000 (½) | Art. 1001 |

### Disqualification Tests

| # | Test | Expected |
|---|------|----------|
| 22 | Guilty spouse in legal separation + T3 | Spouse gets ₱0; scenario becomes T1; FP doubles |
| 23 | Innocent spouse in legal separation + T3 | Spouse gets normal ₱1/(2n); no change |
| 24 | Validly disinherited spouse + T7 | Spouse gets ₱0; scenario becomes T6; FP doubles |
| 25 | Disinherited spouse with invalid cause + T7 | Disinheritance void (Art. 918); spouse gets normal ¼ |
| 26 | Disinherited spouse with reconciliation + T7 | Disinheritance void (Art. 922); spouse gets normal ¼ |
| 27 | Annulled marriage | No surviving spouse exists; no spouse in computation |

### Articulo Mortis Tests

| # | Test | AM Marriage | Died < 3mo | Cohabitation | Expected |
|---|------|-----------|-----------|--------------|----------|
| 28 | Normal marriage, spouse alone | No | n/a | n/a | ½ (Art. 900 ¶1) |
| 29 | AM marriage, died within 3mo, no cohabitation | Yes | Yes | < 5yr | ⅓ (Art. 900 ¶2) |
| 30 | AM marriage, died within 3mo, 5+ yr cohabitation | Yes | Yes | ≥ 5yr | ½ (exception applies) |
| 31 | AM marriage, died AFTER 3mo | Yes | No | < 5yr | ½ (3-month condition fails) |
| 32 | AM marriage, spouse NOT sole heir (has children) | Yes | Yes | < 5yr | ¼ per Art. 892 (AM doesn't apply to non-T12) |

### Testate vs Intestate Comparison Tests

| # | Concurrence | E | Testate Spouse | Intestate Spouse | Intestate % Increase |
|---|-------------|---|---------------|-----------------|---------------------|
| 33 | 1 LC + S | ₱10M | ₱2.5M (¼) | ₱5M (½) | +100% |
| 34 | 3 LC + S | ₱12M | ₱2M (⅙) | ₱3M (¼) | +50% |
| 35 | Asc + S | ₱10M | ₱2.5M (¼) | ₱5M (½) | +100% |
| 36 | IC + S | ₱9M | ₱3M (⅓) | ₱4.5M (½) | +50% |
| 37 | Asc + IC + S | ₱8M | ₱1M (⅛) | ₱2M (¼) | +100% |

### Free Portion Priority Tests (Spouse Before IC Cap)

| # | n | m | E | Spouse from FP | Remaining FP (= IC cap) | Per IC (capped?) |
|---|---|---|---|---------------|------------------------|-----------------|
| 38 | 1 | 1 | ₱10M | ₱2.5M | ₱2.5M | ₱2.5M (exactly fills) |
| 39 | 1 | 3 | ₱10M | ₱2.5M | ₱2.5M | ₱833K (capped) |
| 40 | 2 | 3 | ₱12M | ₱3M | ₱3M | ₱1M (uncapped; 3×₱1M = ₱3M ≤ ₱3M) |
| 41 | 2 | 4 | ₱12M | ₱3M | ₱3M | ₱750K (capped; 4×₱1.5M=₱6M > ₱3M) |

---

## Engine Pipeline Integration

The spouse computation occurs at **Step 3** of the pipeline, within `compute_all_legitimes`. The specific order:

```
Step 3a: Compute legitimate children's collective legitime (always ½ when present)
Step 3b: Compute spouse's legitime (depends on scenario and n)
Step 3c: Compute remaining FP after spouse (for cap rule)
Step 3d: Compute illegitimate children's legitime (with cap applied)
Step 3e: Compute final FP_disposable
```

The spouse computation MUST happen before the illegitimate children's computation because of the Art. 895 ¶3 priority rule.

### Pre-Computation: Spouse Eligibility Filter

Before Step 3, the eligibility filter (Step 1) must check:
1. Is the spouse alive at decedent's death?
2. Is the marriage valid (not annulled/void)?
3. Is the spouse disqualified by legal separation (Art. 1002)?
4. Is the spouse unworthy (Art. 1032)?
5. Is the spouse disinherited (Art. 921, testate only)?

If any of these disqualify the spouse, remove them from the heir pool and re-determine the scenario code.

---

*Analysis based on Civil Code Arts. 886-903, 921, 1002, 1032; Family Code marriage provisions; Intestate succession Arts. 994-1001. Cross-references: legitime-table (T2, T3, T5, T7, T9, T10, T12, T15), legitime-with-illegitimate (cap rule interaction), heir-concurrence-rules (scenario determination), compulsory-heirs-categories (spouse classification).*
