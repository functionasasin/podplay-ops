# Free Portion Rules — Computation of the Disposable Free Portion

**Aspect**: free-portion-rules
**Wave**: 3 (Legitime Computation)
**Primary Legal Basis**: Arts. 842, 886, 908-914 (Civil Code); Art. 895 ¶3 (cap rule interaction); Arts. 851-855 (partial disposition, preterition)
**Depends On**: legitime-table, legitime-with-illegitimate, legitime-surviving-spouse, legitime-ascendants

---

## Overview

The **free portion** (also called "disposable portion" or "disposable free portion") is the remainder of the net distributable estate after all compulsory heirs' legitimes have been satisfied. It is the only part of the estate that the testator can freely dispose of by will.

This analysis covers:
1. The legal definition and computation formula
2. Free portion values for every scenario (T1-T15)
3. Art. 908: how to determine the estate base for legitime computation (collation of inter vivos donations)
4. Art. 909-910: charging donations to legitime vs free portion
5. Art. 911-912: reduction of inofficious dispositions when free portion is exceeded
6. Art. 914: testator's freedom to dispose of the free portion
7. Interaction with the Art. 895 ¶3 cap rule (illegitimate children consuming free portion)
8. Mixed succession: what happens when the will only disposes of part of the free portion
9. Complete pseudocode for the engine's free portion computation step

---

## Legal Basis

### Core Articles

| Article | What It Governs | Quoted Text (Key Portion) |
|---------|----------------|--------------------------|
| **Art. 842** | Testator's freedom | "One who has no compulsory heirs may dispose by will of all his estate or any part of it... One who has compulsory heirs may dispose of his estate provided he does not contravene the provisions of this Code with regard to the legitime of said heirs." |
| **Art. 886** | Definition of legitime | "Legitime is that part of the testator's property which he cannot dispose of because the law has reserved it for certain heirs who are, therefore, called compulsory heirs." |
| **Art. 908** | Estate base for legitime computation | "To determine the legitime, the value of the property left at the death of the testator shall be considered, deducting all debts and charges, which shall not include those imposed in the will. To the net value of the hereditary estate, shall be added the value of all donations by the testator that are subject to collation, at the time he made them." |
| **Art. 909** | Charging donations | "Donations given to children shall be charged to their legitime. Donations made to strangers shall be charged to that part of the estate of which the testator could have disposed by his last will." |
| **Art. 910** | Illegitimate children's donations | "Donations which an illegitimate child may have received during the lifetime of his father or mother, shall be charged to his legitime." |
| **Art. 911** | Reduction order for inofficious dispositions | "(1) Donations shall be respected as long as the legitime can be covered, reducing or annulling, if necessary, the devises or legacies made in the will; (2) The reduction of the devises or legacies shall be pro rata..." |
| **Art. 912** | Indivisible real property reduction | If a devise of indivisible real property must be reduced, it goes to whoever holds the larger share (devisee if reduction < ½ value; compulsory heirs otherwise), with cash reimbursement. |
| **Art. 914** | Testator's freedom over FP | "The testator may devise and bequeath the free portion as he may deem fit." |

### Key Relationship Articles

| Article | Interaction |
|---------|------------|
| **Art. 895 ¶3** | Illegitimate children's legitime comes from the free portion; spouse satisfied first |
| **Art. 892 ¶3** | Surviving spouse's legitime (with children) is taken from the free portion |
| **Art. 893 ¶2** | Surviving spouse's legitime (with ascendants) is taken from the free portion |
| **Art. 851** | If will doesn't dispose of entire estate, intestate succession for the remainder |
| **Art. 960(2)** | Mixed succession: intestate for undisposed portion |

---

## The Two Meanings of "Free Portion"

A critical distinction for the engine:

### 1. Gross Free Portion (FP_gross)

The portion of the estate NOT reserved as legitime for primary/secondary compulsory heirs (legitimate children or ascendants). This is computed BEFORE deducting the spouse's and illegitimate children's legitime (which are sourced from it in Regime A and Regime B).

```
FP_gross = E - legitimate_children_collective_legitime   // Regime A
         = E - ascendants_collective_legitime             // Regime B
         = E                                              // Regime C (no primary/secondary heirs)
```

### 2. Net Disposable Free Portion (FP_disposable)

The portion of the estate the testator can actually dispose of freely — after ALL compulsory heirs' legitimes have been satisfied, including spouse and illegitimate children's shares that were charged against the gross free portion.

```
FP_disposable = E - sum(all_compulsory_heirs_legitimes)
```

**The engine should compute and track both values**, because:
- `FP_gross` is needed as the cap limit for Art. 895 ¶3 (illegitimate children's maximum)
- `FP_disposable` is what the testator can actually give away by will (or what passes intestate for undisposed estates)

---

## Free Portion for Every Testate Scenario

### Complete Table

| Scenario | FP_gross (before spouse/IC deduction) | Spouse from FP | IC from FP | FP_disposable | As Fraction of E |
|----------|--------------------------------------|---------------|-----------|---------------|------------------|
| **T1** (n LC) | E × ½ | — | — | E × ½ | ½ (0.5) |
| **T2** (1 LC + S) | E × ½ | E × ¼ | — | E × ¼ | ¼ (0.25) |
| **T3** (n≥2 LC + S) | E × ½ | E/(2n) | — | E(n−1)/(2n) | (n−1)/(2n) |
| **T4** (n LC + m IC) | E × ½ | — | min(mE/(4n), E/2) | max(E/2 − mE/(4n), 0) | varies |
| **T5a** (1 LC + m IC + S) | E × ½ | E × ¼ | min(mE/4, E/4) | max(E/4 − mE/4, 0) | varies |
| **T5b** (n≥2 LC + m IC + S) | E × ½ | E/(2n) | min(mE/(4n), E(n−1)/(2n)) | max(E(n−1)/(2n) − mE/(4n), 0) | varies |
| **T6** (Ascendants) | E × ½ | — | — | E × ½ | ½ (0.5) |
| **T7** (Ascendants + S) | E × ½ | E × ¼ | — | E × ¼ | ¼ (0.25) |
| **T8** (Ascendants + m IC) | E × ½ | — | E × ¼ | E × ¼ | ¼ (0.25) |
| **T9** (Ascendants + m IC + S) | E × ½ | E × ⅛ | E × ¼ | E × ⅛ | ⅛ (0.125) |
| **T10** (m IC + S) | E | — | E × ⅓ | E × ⅓ | ⅓ (0.333) |
| **T11** (m IC) | E | — | E × ½ | E × ½ | ½ (0.5) |
| **T12** (S only) | E | E × ½ | — | E × ½ | ½ (0.5) |
| **T12-AM** (S only, articulo mortis) | E | E × ⅓ | — | E × ⅔ | ⅔ (0.667) |
| **T13** (no compulsory heirs) | E | — | — | E | 1 (1.0) |
| **T14** (Parents of illegit. decedent) | E × ½ | — | — | E × ½ | ½ (0.5) |
| **T15** (Parents + S of illegit. decedent) | E × ½ | E × ¼ | — | E × ½ | ½ (0.5) |

### Key Observations

1. **FP_disposable ranges from 0 to E (the entire estate)**:
   - **Minimum = 0**: When the cap rule bites and the entire FP is consumed by spouse + illegitimate children (T5a with m≥1, T5b with m>2(n−1), T4 with m>2n)
   - **Maximum = E**: When there are no compulsory heirs at all (T13)

2. **T9 is the most constrained scenario**: FP_disposable = ⅛ of E. The testator can freely dispose of only 12.5% of their estate.

3. **Regime B/C scenarios have fixed FP_disposable**: No cap rule interaction — the fractions are pre-determined by statute.

4. **Regime A scenarios have variable FP_disposable**: Depends on n, m, and whether the cap bites.

5. **FP_gross is always ½E when primary/secondary heirs exist**: This is because legitimate children's collective (½) or ascendants' collective (½) is always the same. FP_gross = E − ½E = ½E.

6. **In Regime C (T10-T12), FP_gross = E**: Because there are no primary/secondary compulsory heirs, the entire estate is technically "free" before the concurring heirs' statutory fractions are applied.

---

## Art. 908: The Collation-Adjusted Estate Base

### The Two-Step Computation

Art. 908 defines the estate base for computing legitime (and therefore the free portion):

```
STEP 1: Net estate at death
  net_estate = gross_estate_at_death - debts - charges
  // "charges" here means debts/obligations, NOT testamentary charges (Art. 908 ¶1)
  // Testamentary charges (imposed by the will) are NOT deducted

STEP 2: Add back collatable donations
  collation_adjusted_estate = net_estate + sum(collatable_donations_at_value_when_given)
```

### What Is Subject to Collation

| Donation Type | Collatable? | Charged To | Legal Basis |
|---------------|-------------|------------|-------------|
| Donation to legitimate child | Yes | Child's legitime | Art. 909 ¶1 |
| Donation to illegitimate child | Yes | Child's legitime | Art. 910 |
| Donation to surviving spouse (by decedent) | See note | Not collatable per Art. 1066 | Art. 1066 |
| Donation to stranger | Yes | Free portion | Art. 909 ¶2 |
| Donation to spouse AND child jointly | Partially | Child's ½ charged to child's legitime | Art. 1066 |

**Note on spouse**: Art. 1066 exempts donations to the surviving spouse from collation. However, Art. 909 ¶2 treats donations to "strangers" as charged to the disposable portion. The surviving spouse is NOT a stranger but a compulsory heir, so donations to the spouse are in a special category — not collatable for legitime computation, but potentially inofficious if they exceed the disposable portion.

### Engine Implication

The engine's input must include a list of inter vivos donations with:
- Recipient (heir or stranger)
- Value at time of donation
- Whether the donation is subject to collation

```
struct Donation {
    recipient: HeirId | "stranger"
    value_at_time_of_donation: Amount
    is_collatable: bool         // Some donations are exempt (Art. 1067-1069)
    is_to_child: bool           // Charged to child's legitime (Art. 909 ¶1)
    is_to_illegitimate_child: bool  // Charged to IC's legitime (Art. 910)
    is_to_stranger: bool        // Charged to free portion (Art. 909 ¶2)
}
```

### Collation-Adjusted Estate Formula

```
function compute_collation_adjusted_estate(
    net_estate: Amount,
    donations: List<Donation>
) -> Amount {
    collatable_sum = sum(d.value_at_time_of_donation for d in donations if d.is_collatable)
    return net_estate + collatable_sum
}
```

**Critical**: The legitime fractions are computed against the **collation-adjusted estate**, not just the net estate at death. This means the free portion can be smaller (or even negative, indicating inofficious donations) than it would be without collation.

### Imputation of Donations Against Heir Shares

After computing each heir's legitime using the collation-adjusted estate, donations already received are deducted:

```
function compute_net_legitime(
    heir: Heir,
    gross_legitime: Amount,
    donations_received: List<Donation>
) -> Amount {
    total_donations = sum(d.value_at_time_of_donation for d in donations_received)
    net_legitime = gross_legitime - total_donations
    if net_legitime < 0:
        // Heir received MORE than their legitime via donation
        // The excess is charged to the free portion (Art. 909)
        // If it exceeds FP, the donation is inofficious and subject to reduction (Art. 911)
        return 0
    return net_legitime
}
```

---

## Arts. 909-912: Inofficious Dispositions and Reduction

### When the Free Portion Is Exceeded

A testamentary disposition (or inter vivos donation) is **inofficious** when it impairs the compulsory heirs' legitime — i.e., when the total of all dispositions exceeds the free portion.

### Detection: Is Any Disposition Inofficious?

```
function check_inofficiousness(
    estate: Amount,
    total_legitimes: Amount,
    testamentary_dispositions: Amount,
    donations_to_strangers: Amount
) -> InofficiousnessResult {

    fp_disposable = estate - total_legitimes
    total_dispositions = testamentary_dispositions + donations_to_strangers

    if total_dispositions <= fp_disposable:
        return { is_inofficious: false }

    excess = total_dispositions - fp_disposable
    return {
        is_inofficious: true,
        excess: excess,
        requires_reduction: true
    }
}
```

### Art. 911: Reduction Order (Priority Rules)

When dispositions exceed the free portion, they are reduced in this strict order:

**Priority 1**: Reduce testamentary devises and legacies FIRST (Art. 911(1))
- Rationale: Inter vivos donations "shall be respected as long as the legitime can be covered"
- Donations survive; testamentary dispositions absorb the reduction first

**Priority 2**: Within testamentary dispositions, reduce **pro rata** (Art. 911(2))
- UNLESS the testator specified a preference order in the will
- If a preferred devise/legacy is marked, reduce ALL others first; only reduce the preferred one if the others are fully consumed

**Priority 3**: If all testamentary dispositions are reduced to zero and the excess STILL remains, reduce inter vivos donations (Art. 911(1), by implication)
- Donations are reduced in reverse chronological order (most recent first) — this is the general rule from Art. 771 by analogy

### Reduction Pseudocode

```
function reduce_inofficious_dispositions(
    excess: Amount,
    testamentary_dispositions: List<Disposition>,
    donations: List<Donation>,
    preferred_dispositions: List<DispositionId>  // from will
) -> ReductionResult {

    remaining_excess = excess
    reductions = []

    // === Phase 1: Reduce testamentary dispositions ===

    // Separate preferred and non-preferred
    non_preferred = filter(d where d.id NOT in preferred_dispositions, testamentary_dispositions)
    preferred = filter(d where d.id in preferred_dispositions, testamentary_dispositions)

    // Step 1a: Reduce non-preferred pro rata
    non_preferred_total = sum(d.amount for d in non_preferred)
    if remaining_excess > 0 AND non_preferred_total > 0:
        reduction_ratio = min(remaining_excess / non_preferred_total, 1)
        for d in non_preferred:
            reduction = d.amount * reduction_ratio
            reductions.append({ disposition: d, reduction: reduction })
            remaining_excess -= reduction

    // Step 1b: Reduce preferred pro rata (only if non-preferred fully consumed)
    if remaining_excess > 0:
        preferred_total = sum(d.amount for d in preferred)
        if preferred_total > 0:
            reduction_ratio = min(remaining_excess / preferred_total, 1)
            for d in preferred:
                reduction = d.amount * reduction_ratio
                reductions.append({ disposition: d, reduction: reduction })
                remaining_excess -= reduction

    // === Phase 2: Reduce donations (reverse chronological) ===
    if remaining_excess > 0:
        sorted_donations = sort(donations, by: date, order: DESCENDING)
        for d in sorted_donations:
            reduction = min(d.value_at_time_of_donation, remaining_excess)
            reductions.append({ donation: d, reduction: reduction })
            remaining_excess -= reduction
            if remaining_excess <= 0:
                break

    return {
        reductions: reductions,
        remaining_excess: remaining_excess  // Should be 0 if donations are sufficient
    }
}
```

### Art. 912: Indivisible Real Property Special Rule

When a devise of real property must be partially reduced:
- If reduction absorbs **less than ½** of the property's value → devisee keeps the property, reimburses compulsory heirs in cash
- If reduction absorbs **½ or more** of the property's value → compulsory heirs take the property, reimburse devisee in cash

```
function handle_indivisible_realty_reduction(
    property_value: Amount,
    reduction_amount: Amount
) -> IndivisibleRealtyResult {
    if reduction_amount < property_value / 2:
        return {
            property_goes_to: "devisee",
            cash_reimbursement_to: "compulsory_heirs",
            cash_amount: reduction_amount
        }
    else:
        return {
            property_goes_to: "compulsory_heirs",
            cash_reimbursement_to: "devisee",
            cash_amount: property_value - reduction_amount
        }
}
```

---

## Free Portion in Intestate Succession

### No Free Portion Concept

In intestate succession, there is **no free portion**. The entire estate is distributed among heirs according to statutory rules. The concept of "free portion" is exclusively a testate mechanism:

- **Testate**: Estate = legitime + free portion. Testator controls the free portion.
- **Intestate**: Estate = sum of all statutory shares. No testator control (no will).

### Intestate "Equivalent" Shares vs Free Portion

In many scenarios, the intestate distribution gives each heir more than their testate legitime because the intestate rules distribute what would have been the free portion:

| Scenario | Testate FP | Intestate "FP equivalent" | Who benefits |
|----------|-----------|---------------------------|--------------|
| T2/I2 (1 LC + S) | ¼ | 0 (all distributed) | Spouse doubles (¼→½) |
| T3/I2 (n LC + S) | (n−1)/(2n) | 0 | Spouse & children all increase |
| T7/I6 (Asc + S) | ¼ | 0 | Spouse doubles (¼→½) |
| T10/I8 (IC + S) | ⅓ | 0 | Spouse increases (⅓→½) |

### Engine Implication

The engine should only compute `FP_disposable` for testate succession. For intestate, the output is simply the per-heir shares (no free portion field in the output).

For **mixed succession** (Art. 960(2)), the free portion computation applies to the testate part, and the undisposed remainder passes intestate.

---

## Mixed Succession: Partial Will Disposition

### When It Arises

Art. 960(2): "When the will does not institute an heir to, or dispose of all the property belonging to the testator. In such case, legal succession shall take place only with respect to the property of which the testator has not disposed."

This creates **mixed succession** when:
1. The will only disposes of PART of the free portion
2. The remainder of the free portion passes intestate

### Computation

```
function compute_mixed_succession(
    estate: Amount,
    total_legitimes: Amount,
    testamentary_dispositions: Amount
) -> MixedSuccessionResult {

    fp_disposable = estate - total_legitimes

    // Testamentary dispositions can only be from the free portion
    if testamentary_dispositions > fp_disposable:
        // Inofficious — reduce per Art. 911
        return reduce_and_redistribute(...)

    // Portion disposed by will
    disposed_fp = testamentary_dispositions

    // Undisposed free portion passes intestate
    undisposed_fp = fp_disposable - disposed_fp

    if undisposed_fp > 0:
        // Distribute undisposed_fp per intestate rules
        intestate_shares = compute_intestate_distribution(undisposed_fp, heirs)
        return {
            succession_type: MIXED,
            legitime_shares: ...,              // Each compulsory heir's legitime
            testamentary_shares: ...,          // Will dispositions from FP
            intestate_shares: intestate_shares, // Undisposed FP distributed intestate
        }
    else:
        return {
            succession_type: TESTATE,
            legitime_shares: ...,
            testamentary_shares: ...,
            intestate_shares: {}  // Nothing left
        }
}
```

### Who Gets the Undisposed Free Portion?

The undisposed free portion is distributed as if the testator died intestate with respect to that portion. This means:
- The same intestate rules apply (Arts. 960-1014)
- Compulsory heirs who already received their legitime ALSO participate in the intestate distribution of the undisposed FP
- Non-compulsory heirs (siblings, collaterals) may inherit from the undisposed portion if the intestate rules permit

**Example**: Estate = ₱10M, 2 legitimate children, spouse, will gives ₱1M to charity.
- Children's collective legitime: ₱5M (₱2.5M each)
- Spouse's legitime: ₱2.5M (from FP)
- FP_disposable: ₱10M − ₱5M − ₱2.5M = ₱2.5M
- Charity: ₱1M (testamentary disposition)
- Undisposed FP: ₱2.5M − ₱1M = ₱1.5M
- The ₱1.5M is distributed intestate among LC1, LC2, and Spouse per Art. 996/999

---

## Cap Rule Interaction: The FP Pipeline

The free portion is consumed in a specific order due to Art. 895 ¶3's priority rule:

```
STEP 1: Compute FP_gross
  FP_gross = E - primary_heirs_collective_legitime
  // ½E in Regime A and B; E in Regime C

STEP 2: Satisfy spouse's legitime from FP (Art. 892 ¶3, 893 ¶2)
  FP_after_spouse = FP_gross - spouse_legitime
  // Only in Regime A (T2, T3, T5) and Regime B (T7)
  // In Regime C (T10) and some Regime B scenarios (T9), spouse has direct statutory fraction

STEP 3: Cap illegitimate children's legitime (Art. 895 ¶3)
  // Only in Regime A (T4, T5)
  IC_cap = FP_after_spouse
  actual_IC_total = min(uncapped_IC_total, IC_cap)
  FP_after_IC = FP_after_spouse - actual_IC_total

STEP 4: FP_disposable = FP_after_IC
  // This is what the testator can give away by will
```

### The Complete Pipeline (All Scenarios)

```
function compute_free_portion_pipeline(
    estate: Amount,
    scenario: ScenarioCode,
    n: int,  // legitimate child lines
    m: int,  // illegitimate children
    spouse_legitime: Amount,
    total_legitimes_excl_fp_charged: Amount  // primary/secondary heirs' legitime only
) -> FreePortion {

    match scenario {

        // === Regime A: Descendants Present ===
        // FP_gross = E/2 (always)
        // Spouse and IC charged to FP

        T1:
            return { gross: estate/2, disposable: estate/2 }

        T2:
            fp_gross = estate / 2
            return { gross: fp_gross, disposable: fp_gross - spouse_legitime }

        T3:
            fp_gross = estate / 2
            return { gross: fp_gross, disposable: fp_gross - spouse_legitime }

        T4:
            fp_gross = estate / 2
            per_lc = estate / (2 * n)
            per_ic_uncapped = per_lc / 2
            total_ic_uncapped = per_ic_uncapped * m
            total_ic = min(total_ic_uncapped, fp_gross)
            return { gross: fp_gross, disposable: fp_gross - total_ic }

        T5a, T5b:
            fp_gross = estate / 2
            fp_after_spouse = fp_gross - spouse_legitime
            per_lc = estate / (2 * n)
            per_ic_uncapped = per_lc / 2
            total_ic_uncapped = per_ic_uncapped * m
            total_ic = min(total_ic_uncapped, fp_after_spouse)
            return { gross: fp_gross, disposable: fp_after_spouse - total_ic }

        // === Regime B: Ascendants Present ===
        // FP_gross = E/2
        // Fixed statutory fractions for spouse and IC

        T6:
            return { gross: estate/2, disposable: estate/2 }

        T7:
            return { gross: estate/2, disposable: estate/2 - spouse_legitime }
            // = E/2 - E/4 = E/4

        T8:
            return { gross: estate/2, disposable: estate/2 - estate/4 }
            // IC collective = E/4 (fixed), FP_disposable = E/4

        T9:
            return { gross: estate/2, disposable: estate * 1/8 }
            // IC = E/4, Spouse = E/8, FP_disposable = E/2 - E/4 - E/8 = E/8

        // === Regime C: No Primary/Secondary Heirs ===
        // FP_gross = E (entire estate)

        T10:
            return { gross: estate, disposable: estate * 1/3 }
            // IC = E/3, Spouse = E/3, FP_disposable = E/3

        T11:
            return { gross: estate, disposable: estate * 1/2 }
            // IC = E/2, FP_disposable = E/2

        T12:
            spouse_frac = is_articulo_mortis ? 1/3 : 1/2
            return { gross: estate, disposable: estate * (1 - spouse_frac) }

        T13:
            return { gross: estate, disposable: estate }
            // No compulsory heirs — entire estate is free

        // === Special: Illegitimate Decedent ===
        T14:
            return { gross: estate/2, disposable: estate/2 }

        T15:
            return { gross: estate/2, disposable: estate * 1/2 }
            // Parents = E/4, Spouse = E/4, FP_disposable = E/2
    }
}
```

---

## Worked Examples

### Example 1: T3 — 3 Legitimate Children + Spouse, Will Gives FP to Charity

**Inputs**: E = ₱12,000,000, n = 3, no IC, spouse present, will leaves entire FP to charity

| Step | Computation | Result |
|------|------------|--------|
| FP_gross | ₱12M × ½ | ₱6,000,000 |
| Spouse legitime (from FP) | ₱12M/(2×3) = ₱2M | ₱2,000,000 |
| FP_after_spouse | ₱6M − ₱2M | ₱4,000,000 |
| FP_disposable | = FP_after_spouse | ₱4,000,000 |
| Charity receives | ₱4,000,000 | Entire FP_disposable |

| Heir | Amount | Basis |
|------|--------|-------|
| LC1 | ₱2,000,000 | Art. 888 (½ ÷ 3) |
| LC2 | ₱2,000,000 | Art. 888 |
| LC3 | ₱2,000,000 | Art. 888 |
| Spouse | ₱2,000,000 | Art. 892 ¶2 (from FP) |
| Charity | ₱4,000,000 | Art. 914 (FP disposition) |
| **Total** | **₱12,000,000** | |

**Narrative (FP)**:
> The testator's free portion is ₱4,000,000. Under Art. 914, the testator may devise and bequeath the free portion as they see fit. The free portion is ₱6,000,000 (½ of the ₱12,000,000 estate) minus the surviving spouse's legitime of ₱2,000,000 (Art. 892 ¶2, taken from the free portion per Art. 892 ¶3), leaving ₱4,000,000 disposable. The will directs this entire amount to charity.

---

### Example 2: T5b — Inofficious Disposition (Will Exceeds FP)

**Inputs**: E = ₱10,000,000, n = 2, m = 2, spouse present. Will leaves ₱3,000,000 to a friend.

| Step | Computation | Result |
|------|------------|--------|
| FP_gross | ₱10M × ½ | ₱5,000,000 |
| Per LC | ₱5M ÷ 2 | ₱2,500,000 |
| Spouse | = per LC (n≥2) | ₱2,500,000 |
| FP_after_spouse | ₱5M − ₱2.5M | ₱2,500,000 |
| Per IC uncapped | ₱2.5M × ½ | ₱1,250,000 |
| Total IC uncapped | 2 × ₱1.25M | ₱2,500,000 |
| Cap check | ₱2.5M ≤ ₱2.5M | No cap (exactly fills) |
| FP_disposable | ₱2.5M − ₱2.5M | **₱0** |
| Will gives to friend | ₱3,000,000 | **INOFFICIOUS** |

The ₱3,000,000 disposition to the friend is entirely inofficious because FP_disposable = ₱0.

**Reduction per Art. 911**: The entire ₱3,000,000 legacy to the friend must be reduced to ₱0.

| Heir | Before Reduction | After Reduction | Basis |
|------|-----------------|-----------------|-------|
| LC1 | ₱2,500,000 | ₱2,500,000 | Art. 888 (unchanged) |
| LC2 | ₱2,500,000 | ₱2,500,000 | Art. 888 (unchanged) |
| Spouse | ₱2,500,000 | ₱2,500,000 | Art. 892 ¶2 (unchanged) |
| IC1 | ₱1,250,000 | ₱1,250,000 | Art. 895 (unchanged) |
| IC2 | ₱1,250,000 | ₱1,250,000 | Art. 895 (unchanged) |
| Friend | ₱3,000,000 | **₱0** | Art. 911: fully reduced |
| **Total** | ₱13,000,000 (exceeds estate!) | **₱10,000,000** | |

---

### Example 3: Art. 908 Collation — Donation Expands the Estate Base

**Inputs**: Net estate at death = ₱8,000,000. During lifetime, decedent donated ₱2,000,000 to legitimate child LC1. No will (intestate). 3 legitimate children, no spouse.

| Step | Computation | Result |
|------|------------|--------|
| Collation-adjusted estate | ₱8M + ₱2M | ₱10,000,000 |
| LC collective legitime | ₱10M × ½ | ₱5,000,000 |
| Per LC share (intestate, entire estate) | ₱10M ÷ 3 | ₱3,333,333 |
| LC1 already received | ₱2,000,000 | (donation) |
| LC1 net inheritance | ₱3,333,333 − ₱2,000,000 | ₱1,333,333 |
| LC2 inheritance | ₱3,333,333 | |
| LC3 inheritance | ₱3,333,333 | |

**Verification**: ₱1,333,333 + ₱3,333,333 + ₱3,333,333 = ₱8,000,000 (actual estate) ✓

**Narrative (LC1)**:
> **LC1** receives **₱1,333,333** from the estate. Under Art. 908, the collation-adjusted estate is ₱10,000,000 (net estate of ₱8,000,000 plus ₱2,000,000 previously donated to LC1). Each child's intestate share is ₱3,333,333 (₱10,000,000 ÷ 3). Under Art. 909, the ₱2,000,000 donation to LC1 is charged against their share, leaving ₱1,333,333 to be received from the estate.

---

### Example 4: Mixed Succession — Will Only Disposes Part of FP

**Inputs**: E = ₱10,000,000. 1 legitimate child, no spouse, no IC. Will leaves ₱1,000,000 to a university.

| Step | Computation | Result |
|------|------------|--------|
| LC legitime | ₱10M × ½ | ₱5,000,000 |
| FP_disposable | ₱10M × ½ | ₱5,000,000 |
| Testamentary (university) | | ₱1,000,000 |
| Undisposed FP | ₱5M − ₱1M | ₱4,000,000 |

The ₱4,000,000 undisposed FP passes intestate (Art. 960(2)). Since LC is the only heir, LC receives it.

| Heir | Legitime | Testamentary | Intestate (Undisposed FP) | Total |
|------|----------|-------------|---------------------------|-------|
| LC | ₱5,000,000 | — | ₱4,000,000 | ₱9,000,000 |
| University | — | ₱1,000,000 | — | ₱1,000,000 |
| **Total** | | | | **₱10,000,000** |

---

### Example 5: T12-AM — Articulo Mortis Increases FP

**Inputs**: E = ₱9,000,000. Spouse only, articulo mortis conditions met. Will leaves FP to charity.

| Step | Computation | Result |
|------|------------|--------|
| Spouse legitime (AM) | ₱9M × ⅓ | ₱3,000,000 |
| FP_disposable | ₱9M − ₱3M | ₱6,000,000 |

**Compare normal T12**: Spouse would get ₱4,500,000 (½), FP = ₱4,500,000.

**Effect of articulo mortis**: The testator gains ₱1,500,000 MORE disposable freedom (FP increases from ₱4.5M to ₱6M). This is the law's protective mechanism against deathbed marriages designed to capture inheritance.

---

## Edge Cases

### 1. FP_disposable = 0 (Zero Free Portion)

When the cap rule fully consumes the remaining FP (common in T5a with m≥2, T5b with many ICs, T4 with m>2n):
- Any testamentary disposition is fully inofficious
- Art. 911 requires complete reduction of all devises/legacies
- The testator effectively has NO testamentary freedom
- This is a valid and expected outcome, not an error

```
if fp_disposable == 0:
    all_testamentary_dispositions_reduced_to_zero = true
```

### 2. FP_disposable < 0 (Negative Free Portion — Collation Scenario)

When inter vivos donations to compulsory heirs exceeded what they were entitled to, the collation-adjusted estate may produce a situation where the sum of all legitimes exceeds the actual estate at death. This does NOT mean the estate is insolvent — it means the donations were partially inofficious.

```
if fp_disposable < 0:
    // The donation excess must be returned (Art. 911)
    // Donations are reduced in reverse chronological order
    trigger_donation_reduction(abs(fp_disposable))
```

### 3. Testamentary Charge vs Debt (Art. 908 Distinction)

Art. 908 says "deducting all debts and charges, which shall not include those imposed in the will." This means:
- **Funeral expenses, loans, taxes** → deducted before computing legitime
- **"I leave ₱100,000 for masses for my soul"** → this is a testamentary charge, NOT deducted. It comes from the FP.

The engine must distinguish between estate debts/charges and testamentary charges:
```
struct EstateDeduction {
    amount: Amount
    type: "debt" | "charge" | "testamentary_charge"
    // Only "debt" and "charge" reduce the estate base per Art. 908
    // "testamentary_charge" is a disposition from FP
}
```

### 4. Donations to Strangers Exceeding FP

Art. 909 ¶2: Donations to strangers are charged to the disposable portion. If total donations to strangers exceed FP_disposable, the excess donations are inofficious and must be reduced per Art. 911.

The engine should:
1. Compute FP_disposable using collation-adjusted estate
2. Total all donations to strangers
3. If donations to strangers > FP_disposable → flag as inofficious, compute reduction

### 5. Multiple Wills (Codicils)

Philippine law allows codicils (Art. 825: "A codicil is a supplement or addition to a will"). Dispositions in multiple wills/codicils are additive. The engine should sum all testamentary dispositions across all valid testamentary instruments.

### 6. Conditional Dispositions

Art. 871 allows conditional institution of heirs. If a condition is suspensive and unfulfilled at the testator's death, that disposition lapses (Art. 960(3)) and the property passes intestate. The engine should:
- Track conditions on each testamentary disposition
- Treat unfulfilled suspensive conditions as lapsed → amount returns to FP or intestate pool

### 7. Art. 911(3) — Usufruct or Life Annuity Option

If the testator gives the FP as a usufruct or life annuity, compulsory heirs can choose between:
- (a) Complying with the testamentary provision, OR
- (b) Delivering the disposable portion in full ownership to the beneficiary

This is a human decision outside the engine's deterministic scope. The engine should flag this scenario for manual resolution.

### 8. FP Distribution When Testator Has No Will (Intestate)

There is no "free portion" concept in intestate succession. However, the engine must still compute what the testator COULD have disposed of (for Art. 908/909 collation purposes). The FP_disposable is implicitly distributed according to intestate rules.

---

## Data Model Additions

### FreePortion Struct

```
struct FreePortionResult {
    gross: Amount               // FP before spouse/IC deduction
    after_spouse: Amount        // FP after spouse's legitime deducted (if applicable)
    after_ic: Amount            // FP after IC legitime deducted (if applicable) = disposable
    disposable: Amount          // Final amount testator can freely dispose of
    testamentary_consumed: Amount // Amount consumed by will dispositions
    undisposed: Amount          // disposable - testamentary_consumed (passes intestate)
    is_inofficious: bool        // Whether dispositions exceed disposable
    inofficious_excess: Amount  // Amount by which dispositions exceed disposable
}
```

### Donation Struct (for Art. 908 collation)

```
struct Donation {
    id: DonationId
    recipient_heir_id: HeirId?       // null if stranger
    recipient_is_stranger: bool
    value_at_time_of_donation: Amount
    date: Date
    is_collatable: bool              // false for exempted donations (Arts. 1067-1069)
    description: String
}
```

### TestamentaryDisposition Struct

```
struct TestamentaryDisposition {
    id: DispositionId
    beneficiary: HeirId | "stranger:<name>"
    amount: Amount                   // or fraction of estate
    is_preferred: bool               // Art. 911(2): testator marked as preferred
    condition: Condition?            // Art. 871: suspensive/resolutory
    type: "devise" | "legacy" | "charge"  // devise = realty, legacy = personalty/money
    property_id: PropertyId?         // For Art. 912 (indivisible realty)
}
```

---

## Test Implications

### FP Computation Tests (One Per Scenario)

| # | Scenario | E | n | m | Spouse? | Expected FP_disposable |
|---|----------|---|---|---|---------|----------------------|
| 1 | T1 | ₱10M | 3 | 0 | No | ₱5,000,000 (½) |
| 2 | T2 | ₱10M | 1 | 0 | Yes | ₱2,500,000 (¼) |
| 3 | T3 (n=2) | ₱10M | 2 | 0 | Yes | ₱2,500,000 (¼) |
| 4 | T3 (n=3) | ₱12M | 3 | 0 | Yes | ₱4,000,000 (⅓) |
| 5 | T3 (n=10) | ₱10M | 10 | 0 | Yes | ₱4,500,000 (9/20) |
| 6 | T4 uncapped | ₱10M | 2 | 2 | No | ₱2,500,000 |
| 7 | T4 capped | ₱10M | 1 | 3 | No | ₱0 |
| 8 | T5a uncapped | ₱10M | 1 | 1 | Yes | ₱0 |
| 9 | T5a capped | ₱10M | 1 | 3 | Yes | ₱0 |
| 10 | T5b uncapped | ₱12M | 3 | 2 | Yes | ₱2,000,000 |
| 11 | T5b capped | ₱12M | 3 | 5 | Yes | ₱0 |
| 12 | T6 | ₱10M | 0 | 0 | No | ₱5,000,000 |
| 13 | T7 | ₱10M | 0 | 0 | Yes | ₱2,500,000 |
| 14 | T8 | ₱10M | 0 | 3 | No | ₱2,500,000 |
| 15 | T9 | ₱8M | 0 | 3 | Yes | ₱1,000,000 |
| 16 | T10 | ₱9M | 0 | 2 | Yes | ₱3,000,000 |
| 17 | T11 | ₱10M | 0 | 4 | No | ₱5,000,000 |
| 18 | T12 | ₱10M | 0 | 0 | Yes | ₱5,000,000 |
| 19 | T12-AM | ₱10M | 0 | 0 | Yes | ₱6,666,667 |
| 20 | T13 | ₱10M | 0 | 0 | No | ₱10,000,000 |
| 21 | T14 | ₱10M | 0 | 0 | No | ₱5,000,000 |
| 22 | T15 | ₱10M | 0 | 0 | Yes | ₱5,000,000 |

### Inofficiousness Tests

| # | Test | FP_disposable | Disposition | Expected |
|---|------|--------------|-------------|----------|
| 23 | Will gives ₱1M, FP=₱5M | ₱5M | ₱1M | Valid — ₱4M undisposed |
| 24 | Will gives ₱5M, FP=₱5M | ₱5M | ₱5M | Valid — ₱0 undisposed |
| 25 | Will gives ₱6M, FP=₱5M | ₱5M | ₱6M | Inofficious by ₱1M — reduce |
| 26 | FP=₱0, any disposition | ₱0 | ₱1M | Fully inofficious — reduce to ₱0 |
| 27 | Multiple devises, pro rata | ₱5M | ₱3M+₱4M=₱7M | ₱2M excess, each reduced proportionally |

### Art. 911 Reduction Order Tests

| # | Test | Non-preferred | Preferred | Donation | Excess | Expected |
|---|------|--------------|-----------|----------|--------|----------|
| 28 | Non-preferred only | ₱3M legacy | — | — | ₱1M | Legacy reduced to ₱2M |
| 29 | Non-preferred + preferred | ₱2M legacy A, ₱2M legacy B (preferred) | | — | ₱1M | A reduced to ₱1M, B unchanged |
| 30 | Both consumed, donation | ₱2M | ₱1M | ₱2M to stranger | ₱2M | Non-pref→₱0, pref→₱0, donation reduced by ₱2M-₱3M... wait, reduce legacies first |
| 31 | Donation-only excess | — | — | ₱3M to stranger | ₱1M | Donation reduced to ₱2M |

### Collation Tests (Art. 908)

| # | Net Estate | Donation | Collation-Adjusted | Per LC (n=2 intestate) | LC1 (received donation) | LC2 |
|---|-----------|----------|-------------------|----------------------|------------------------|-----|
| 32 | ₱8M | ₱2M to LC1 | ₱10M | ₱5M | ₱5M − ₱2M = ₱3M | ₱5M |
| 33 | ₱6M | ₱4M to LC1 | ₱10M | ₱5M | ₱5M − ₱4M = ₱1M | ₱5M |
| 34 | ₱4M | ₱6M to LC1 | ₱10M | ₱5M | ₱0 (excess ₱1M is inofficious) | ₱4M from actual estate |

### Mixed Succession Tests

| # | E | n | Spouse? | FP_disposable | Will Disposes | Undisposed FP | Passes To |
|---|---|---|---------|--------------|---------------|---------------|-----------|
| 35 | ₱10M | 2 | Yes | ₱2.5M | ₱1M to charity | ₱1.5M | Intestate (LC1, LC2, S) |
| 36 | ₱10M | 1 | No | ₱5M | ₱5M to friend | ₱0 | Nothing passes intestate |
| 37 | ₱10M | 1 | No | ₱5M | ₱0 (empty will) | ₱5M | Intestate (LC1 gets all) |

### Boundary Tests

| # | Test | Expected |
|---|------|----------|
| 38 | T3 with n=2: FP convergence to T2 | Both yield FP=¼ (coincidental match) |
| 39 | T3 as n→∞: FP approaches ½ | FP = (n-1)/(2n) → ½ |
| 40 | FP_disposable exactly 0 (boundary) | No testamentary disposition allowed, but not an error |
| 41 | FP_disposable = ₱0.01 (near zero) | ₱0.01 can be willed; rational arithmetic must handle this |

---

## Engine Pipeline Integration

The free portion computation is **Step 4** in the engine pipeline, immediately after all legitimes are computed:

```
Step 1:   Classify heirs (compulsory-heirs-categories)
Step 1.5: Build lines for representation (representation-rights)
Step 2:   Determine concurrence scenario (heir-concurrence-rules) → T1-T15
Step 3:   Compute each heir's legitime (legitime-table + sub-analyses)
    ↓
Step 4:   Compute free portion (THIS ASPECT)
    Input: estate, total_legitimes, scenario, cap_applied
    Output: FreePortionResult { gross, after_spouse, after_ic, disposable, ... }
    ↓
Step 5:   Distribute free portion
    - If testate: apply testamentary dispositions from FP_disposable
      - Check inofficiousness (Art. 911)
      - Reduce if necessary
    - If undisposed remainder: distribute intestate (Art. 960(2))
    - If intestate: no FP step (entire estate distributed in Step 3)
    ↓
Step 6:   Compute final per-heir amounts
Step 7:   Generate per-heir narrative explanations
```

### Key Constraint

The free portion computation MUST use the same rational arithmetic as the legitime computation. Any rounding before this step can cause FP_disposable to be slightly off, leading to incorrect inofficiousness detection.

```
// WRONG: rounding at each step
fp = floor(estate * 0.5) - floor(estate * 0.25)  // can lose centavos

// RIGHT: exact rational arithmetic
fp = estate * Rational(1,2) - estate * Rational(1,4)  // exact
```

---

*Analysis based on Civil Code Arts. 842, 851-855, 886, 895 ¶3, 908-914, 960. Cross-references: legitime-table (T1-T15 FP values), legitime-with-illegitimate (cap rule consuming FP), legitime-surviving-spouse (spouse charged to FP), legitime-ascendants (ascendants' ½ determines FP_gross).*
