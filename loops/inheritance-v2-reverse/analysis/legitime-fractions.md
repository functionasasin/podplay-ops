# Legitime Fractions Analysis
*Wave 2 — Domain Rule Extraction*
*Sources: Civil Code Arts. 888–903, Family Code Art. 176*
*Depends on: heir-concurrence (T1–T15, I1–I15 scenario codes), heir-classification*

---

## 1. The Three Legitime Regimes

The Civil Code uses three mechanically distinct regimes depending on which primary compulsory heirs survive:

| Regime | Condition | Mechanism |
|--------|-----------|-----------|
| **A — Descendants Present** | G1 (legitimate children/descendants) present | Children get fixed collective ½; spouse + IC shares *derived from* per-child amount; Art. 895 cap applies |
| **B — Ascendants Present, No Descendants** | G1 absent, G2 (legitimate ascendants) present | Ascendants get fixed collective ½; spouse + IC get *flat statutory fractions* of estate; no cap needed |
| **C — Neither Present** | G1 and G2 both absent | Only concurring heirs (G3 spouse, G4 IC); direct flat fractions of estate |

**Special**: When decedent is illegitimate and leaves no descendants or children, Art. 903 applies (scenarios T14/T15).

---

## 2. The Two Free Portion Values

The engine tracks two distinct FP values:

```
FP_gross       = E − primary_heirs_collective_legitime
               = ½E in Regimes A and B
               = E   in Regime C (no primary heirs)

FP_disposable  = E − sum(ALL compulsory heirs' legitimes)
               = FP_gross − spouse_from_fp − IC_from_fp
```

**FP_gross** is the cap limit for Art. 895 ¶3 (IC's maximum).
**FP_disposable** is what the testator can freely give by will (Art. 914).

---

## 3. Complete Testate Legitime Fraction Table (T1–T15)

### Notation
- `E` = collation-adjusted net estate
- `n` = number of legitimate child **lines** (represented lines count, Art. 974)
- `m` = number of illegitimate children
- `S` = surviving spouse

### Regime A: Descendants Present

| Code | Surviving Groups | G1 Collective | Per LC | G3 Spouse | G4 IC per Child | FP_gross | FP_disposable |
|------|-----------------|--------------|--------|-----------|-----------------|----------|---------------|
| **T1** | n LC only | ½ | 1/(2n) | — | — | ½ | ½ |
| **T2** | 1 LC + S | ½ | ½ | ¼ (Art. 892¶1) | — | ½ | ¼ |
| **T3** | n≥2 LC + S | ½ | 1/(2n) | 1/(2n) (Art. 892¶2) | — | ½ | (n−1)/(2n) |
| **T4** | n LC + m IC | ½ | 1/(2n) | — | min(1/(4n), cap/m) | ½ | max(½ − m/(4n), 0) |
| **T5a** | 1 LC + m IC + S | ½ | ½ | ¼ (Art. 892¶1) | min(¼, remaining_fp/m) | ½ | max(¼ − m×(¼), 0) |
| **T5b** | n≥2 LC + m IC + S | ½ | 1/(2n) | 1/(2n) (Art. 897) | min(1/(4n), remaining_fp/m) | ½ | max((n−1)/(2n) − m/(4n), 0) |

**T2 vs T3 boundary**: When n=1, spouse gets ¼ (Art. 892¶1 explicit). When n≥2, spouse gets 1/(2n) = same as one child (Art. 892¶2). Note: T3 with n=2 gives spouse ¼, which coincidentally matches T2, but the legal basis differs.

**T5a vs T5b split**: When n=1 use T5a formula; when n≥2 use T5b formula. This distinction must be captured in the scenario code (T5 sub-type or handled by the T2/T3 logic).

### Regime B: Ascendants Present (No Descendants)

| Code | Surviving Groups | G2 Collective | G3 Spouse | G4 IC Collective | FP_gross | FP_disposable |
|------|-----------------|--------------|-----------|-----------------|----------|---------------|
| **T6** | Ascendants only | ½ | — | — | ½ | ½ |
| **T7** | Ascendants + S | ½ | ¼ (Art. 893) | — | ½ | ¼ |
| **T8** | Ascendants + m IC | ½ | — | ¼ (Art. 896, flat) | ½ | ¼ |
| **T9** | Ascendants + m IC + S | ½ | ⅛ (Art. 899) | ¼ (Art. 899) | ½ | ⅛ |

**Key Regime B distinction**: Art. 896/899 give IC a *flat group fraction* (¼) regardless of m. No cap rule—the ¼ is fixed. Each IC receives ¼ ÷ m.

**T9 is the most constrained scenario**: FP_disposable = ⅛E. Testator has only 12.5% disposable freedom.

### Regime C: No Primary/Secondary Compulsory Heirs

| Code | Surviving Groups | G3 Spouse | G4 IC Collective | FP_disposable |
|------|-----------------|-----------|-----------------|---------------|
| **T10** | m IC + S | ⅓ (Art. 894) | ⅓ (Art. 894) | ⅓ |
| **T11** | m IC only | — | ½ (Art. 901) | ½ |
| **T12** | S only (normal) | ½ (Art. 900) | — | ½ |
| **T12-AM** | S only (articulo mortis) | ⅓ (Art. 900¶2) | — | ⅔ |
| **T13** | No compulsory heirs | — | — | 1 (entire estate) |

**T12 articulo mortis conditions** (Art. 900¶2): marriage in articulo mortis AND died within 3 months AND NOT living together 5+ years → spouse gets ⅓ instead of ½.

### Special: Illegitimate Decedent (Art. 903)

| Code | Surviving Heirs | Parents | G3 Spouse | FP_disposable |
|------|----------------|---------|-----------|---------------|
| **T14** | Parents of IC decedent only | ½ (Art. 903¶1) | — | ½ |
| **T15** | Parents of IC decedent + S | ¼ (Art. 903¶2) | ¼ | ½ |

**Prerequisite for T14/T15**: Decedent is illegitimate AND has no descendants (legitimate or illegitimate) AND no illegitimate children of their own. If any children exist, parents get NOTHING and normal T1-T13 rules apply.

---

## 4. Art. 895 Cap Rule — Full Algorithm

The cap rule (Art. 895¶3) applies **only in Regime A** (T4, T5). It prevents IC's aggregate legitime from exceeding the disposable FP after the spouse is satisfied first.

### Cap Rule Step-by-Step

```rust
fn compute_ic_with_cap(
    estate: Rational,
    n: u32,          // legitimate child lines
    m: u32,          // illegitimate children
    spouse_from_fp: Rational,  // 0 if no spouse
) -> (Rational, Rational) {  // (per_ic, fp_disposable)
    if m == 0 {
        return (Rational::ZERO, estate / 2 - spouse_from_fp);
    }

    let fp_gross = estate / 2;               // always ½E in Regime A
    let fp_after_spouse = fp_gross - spouse_from_fp;

    // Art. 895¶1 uncapped amount: IC = ½ of LC's per-child share
    let per_lc = estate / (2 * n);
    let per_ic_uncapped = per_lc / 2;        // = estate / (4n)
    let total_ic_uncapped = per_ic_uncapped * m;

    // Art. 895¶3 cap: total IC ≤ remaining FP after spouse satisfied
    let total_ic_actual = total_ic_uncapped.min(fp_after_spouse);
    let per_ic_actual = total_ic_actual / m; // proportional reduction

    let fp_disposable = fp_after_spouse - total_ic_actual;
    (per_ic_actual, fp_disposable)
}
```

### Cap Threshold Conditions

| Scenario | Cap bites when |
|----------|---------------|
| T4 (no spouse) | m > 2n |
| T5a (n=1, with spouse) | m > 1 |
| T5b (n≥2, with spouse) | m > 2(n−1) = 2n−2 |

### Cap Rule Worked Examples

**T4 — n=1, m=5, E=₱10M**:
- G1: ₱5M; per LC: ₱5M; FP_gross: ₱5M
- Per IC uncapped: ₱2.5M; total: ₱12.5M > ₱5M → **cap bites**
- Per IC actual: ₱5M ÷ 5 = ₱1M; FP_disposable: ₱0

**T5a — n=1, m=4, E=₱10M**:
- G1: ₱5M; Spouse (T5a): ₱2.5M; FP_after_spouse: ₱2.5M
- Per IC uncapped: ₱2.5M; total: ₱10M > ₱2.5M → **cap bites**
- Per IC actual: ₱2.5M ÷ 4 = ₱625,000; FP_disposable: ₱0

**T5b — n=3, m=2, E=₱12M (no cap)**:
- G1: ₱6M; per LC: ₱2M; Spouse: ₱2M; FP_after_spouse: ₱4M
- Per IC uncapped: ₱1M; total: ₱2M < ₱4M → **no cap**
- FP_disposable: ₱4M − ₱2M = ₱2M

**T5b — n=2, m=5, E=₱10M (cap bites)**:
- G1: ₱5M; per LC: ₱2.5M; Spouse: ₱2.5M; FP_after_spouse: ₱2.5M
- Per IC uncapped: ₱1.25M; total: ₱6.25M > ₱2.5M → **cap bites**
- Per IC actual: ₱2.5M ÷ 5 = ₱500,000; FP_disposable: ₱0

---

## 5. Ascendant Distribution (Art. 890)

When G2 group receives its collective legitime, it is divided among individual ascendants:

```rust
fn distribute_among_ascendants(
    ascendants: &[Ascendant],
    collective: Rational,
) -> Vec<(HeirId, Rational)> {
    // Art. 986: parents (degree 1) exclude all higher ascendants
    let parents: Vec<_> = ascendants.iter().filter(|a| a.degree == 1).collect();
    if !parents.is_empty() {
        return divide_equally(&parents, collective);
    }

    // Art. 987: no parents → divide by line, per capita within line
    let paternal: Vec<_> = ascendants.iter().filter(|a| a.line == Line::Paternal).collect();
    let maternal: Vec<_> = ascendants.iter().filter(|a| a.line == Line::Maternal).collect();

    // Different degrees: nearer degree takes all (regardless of line)
    let min_degree = ascendants.iter().map(|a| a.degree).min().unwrap();
    let nearest: Vec<_> = ascendants.iter().filter(|a| a.degree == min_degree).collect();
    if nearest.len() < ascendants.len() {
        return divide_equally(&nearest, collective);
    }

    // Same degree, both lines: ½ paternal, ½ maternal (Art. 987)
    match (paternal.is_empty(), maternal.is_empty()) {
        (false, false) => {
            let mut result = divide_equally(&paternal, collective / 2);
            result.extend(divide_equally(&maternal, collective / 2));
            result
        }
        (true, false) => divide_equally(&maternal, collective),
        (false, true) => divide_equally(&paternal, collective),
        (true, true) => vec![],
    }
}
```

**Art. 890 edge cases**:
- Both parents alive → ¼ each (½ × 2)
- One parent dead → survivor gets all ½
- No parents, grandparents only: paternal grandfather + maternal grandmother → ½ each (equal degree, different lines)
- Paternal grandfather (2nd degree) + maternal great-grandmother (3rd degree) → all to paternal grandfather (nearer degree wins, Art. 987¶2)

---

## 6. FP Pipeline (Art. 895¶3 Priority Order)

The free portion is consumed in strict order:

```
STEP 1:  FP_gross = E − collective_legitime_G1_or_G2   (½E in Regimes A/B; E in C)
STEP 2:  Deduct spouse's legitime (Arts. 892, 893):
             FP_after_spouse = FP_gross − spouse_legitime_from_fp
         Note: In T9/T10, spouse has a direct statutory fraction (not "from FP")
         In Regimes B/C fixed-fraction scenarios, both spouse and IC are pre-determined
STEP 3:  Cap IC (Regime A only, Arts. 895¶3):
             total_ic_uncapped = m × (per_lc / 2)
             total_ic_actual   = min(total_ic_uncapped, FP_after_spouse)
STEP 4:  FP_disposable = FP_after_spouse − total_ic_actual
```

**Regime B/C note**: Steps 2–3 use fixed statutory fractions (not derived amounts), so no cap logic is needed. The fractions always sum to ≤ 1 by statutory design.

---

## 7. Intestate Succession — No Free Portion

In intestate succession (I1–I15), **there is no free portion concept**. The entire estate is distributed by statute. IC's 2:1 ratio (Art. 983, FC Art. 176) applies but without a cap:

```
Intestate ratio: LC unit = 2, IC unit = 1, Spouse unit = 2 (in I4)
Per-unit share = E ÷ total_units
```

**Cap rule does NOT apply in intestate**—this is a key difference from testate. In I3/I4, the 2:1 ratio is not "IC from free portion"; it is the IC's full intestate entitlement.

---

## 8. Rust Struct: LegitimeResult

```rust
pub struct LegitimeResult {
    /// Map from heir ID to their computed legitime amount
    pub per_heir: HashMap<HeirId, BigRational>,
    /// Sum of all legitimes
    pub total_legitimes: BigRational,
    /// Free portion gross (E − primary collective)
    pub fp_gross: BigRational,
    /// Free portion after spouse deducted (= fp_gross in T6/T8/T11/etc.)
    pub fp_after_spouse: BigRational,
    /// Free portion after IC cap applied = FP_disposable
    pub fp_disposable: BigRational,
    /// Whether the Art. 895 cap was applied
    pub cap_applied: bool,
    /// Uncapped total IC amount (before cap, for narrative)
    pub ic_uncapped_total: BigRational,
}
```

---

## 9. Quick-Reference Fraction Table (Summary)

### Testate (All 15 Scenarios — Concise)

| Scenario | LC Total | LC Per | Spouse | IC Total | IC Per | FP_disposable |
|----------|----------|--------|--------|----------|--------|---------------|
| T1 | ½ | 1/(2n) | — | — | — | ½ |
| T2 | ½ | ½ | ¼ | — | — | ¼ |
| T3 | ½ | 1/(2n) | 1/(2n) | — | — | (n−1)/(2n) |
| T4 | ½ | 1/(2n) | — | ≤½ | min(1/(4n), cap/m) | ≥0 |
| T5a | ½ | ½ | ¼ | ≤¼ | min(¼, cap/m) | ≥0 |
| T5b | ½ | 1/(2n) | 1/(2n) | ≤(n−1)/(2n) | min(1/(4n), cap/m) | ≥0 |
| T6 | — | — (asc. ½) | — | — | — | ½ |
| T7 | — | — (asc. ½) | ¼ | — | — | ¼ |
| T8 | — | — (asc. ½) | — | ¼ | 1/(4m) | ¼ |
| T9 | — | — (asc. ½) | ⅛ | ¼ | 1/(4m) | ⅛ |
| T10 | — | — | ⅓ | ⅓ | 1/(3m) | ⅓ |
| T11 | — | — | — | ½ | 1/(2m) | ½ |
| T12 | — | — | ½ or ⅓ | — | — | ½ or ⅔ |
| T13 | — | — | — | — | — | 1 |
| T14 | — | — (par. ½) | — | — | — | ½ |
| T15 | — | — (par. ¼) | ¼ | — | — | ½ |

### Intestate (All 15 Scenarios — Concise)

| Scenario | LC | Spouse | IC | Ascendants | Collaterals | Entire Estate |
|----------|----|--------|-----|------------|-------------|---------------|
| I1 | 1/n each | — | — | — | — | ✓ |
| I2 | 1/(n+1) each | 1/(n+1) | — | — | — | ✓ |
| I3 | 2-units each | — | 1-unit each | — | — | ✓ |
| I4 | 2-units each | 2-units | 1-unit each | — | — | ✓ |
| I5 | — | — | — | equal (½ each if both parents) | — | ✓ |
| I6 | — | ½ | — | ½ | — | ✓ |
| I7 | — | — | 1/m each | — | — | ✓ |
| I8 | — | ½ | ½ (÷m) | — | — | ✓ |
| I9 | — | — | ½ (÷m) | ½ | — | ✓ |
| I10 | — | ¼ | ¼ (÷m) | ½ | — | ✓ |
| I11 | — | all | — | — | — | ✓ |
| I12 | — | ½ | — | — | ½ (full=2×half) | ✓ |
| I13 | — | — | — | — | all (full=2×half) | ✓ |
| I14 | — | — | — | — | all (nearer excl. remote) | ✓ |
| I15 | — | — | — | — | → State (escheat) | ✓ |

---

## 10. Edge Cases and Invariants

### EC-1: T2/T3 Boundary (n=2 coincidence)
T3 with n=2: per-child = ¼, spouse = ¼, FP = ¼. This matches T2's absolute amounts but not fractions. The engine correctly uses T3 because n=2 (not n=1). Scenario code must be determined by `count_legitimate_child_lines()`, not by whether child amounts equal ¼.

### EC-2: Represented Lines Count as Active Lines
A predeceased legitimate child with eligible grandchildren who represent them counts as **1 active line** in n. This means:
- Decedent has LC1 (alive) + LC2 (predeceased, 2 grandchildren) = **n=2** → T3 (not T2)
- LC2's slot is distributed among grandchildren per stirpes

### EC-3: Articulo Mortis Only in T12
Art. 900¶2 reduction (½→⅓) only applies when spouse is the *sole* compulsory heir. In all other scenarios, normal spouse fractions apply.

### EC-4: T4/T5 Zero Cap Guard
If `m = 0`, skip cap computation entirely (division by zero guard). The `per_ic` field is zero.

### EC-5: FP_disposable = 0 is Valid
When the cap fully consumes FP (e.g., T5a with m=2), FP_disposable = 0. Any testamentary disposition in this case is fully inofficious (Art. 911). This is not an error — the engine must emit a warning but proceed.

### EC-6: T10 — No FP_gross Concept
In T10/T11/T12/T13 (Regime C), FP_gross = E (the entire estate), since there are no primary compulsory heirs. The spouse and IC fractions are direct statutory assignments, not "charged to FP." FP_disposable is still computable as E − sum(all legitimes).

### Invariant: All Testate Legitimes ≤ E
```
sum(per_heir_legitime for all heirs) ≤ E
```
The fractions for every scenario sum to ≤ 1:
- T9: ½ + ¼ + ⅛ + ⅛ = 1 (equals 1 — full)
- T13: 0 ≤ 1 (minimum)
- T4 capped: ½ + cap = ½ + ½ = 1 (equals 1 when fully capped)

---

## 11. Article Quick Reference

| Rule | Article |
|------|---------|
| Definition of legitime | Art. 886 |
| LC collective = ½ | Art. 888 |
| Ascendants collective = ½ | Art. 889 |
| Ascendant division (parents → grandparents → lines) | Art. 890 |
| Spouse with 1 LC = ¼ | Art. 892¶1 |
| Spouse with 2+ LC = 1 child's share | Art. 892¶2 |
| Spouse's share from FP | Art. 892¶3 |
| Spouse with ascendants = ¼ | Art. 893 |
| Spouse + IC only = ⅓ each | Art. 894 |
| IC = ½ of LC per-child share (superseded old tiers) | Art. 895¶1 + FC Art. 176 |
| IC cap = remaining FP after spouse | Art. 895¶3 |
| IC with ascendants = ¼ total (flat) | Art. 896 |
| Spouse with LC + IC = same as 1 LC share | Art. 897 |
| Three-way: Asc + IC + Spouse | Art. 899 |
| Spouse alone = ½ (or ⅓ articulo mortis) | Art. 900 |
| IC alone = ½ | Art. 901 |
| Parents of illegitimate decedent | Art. 903 |
| Estate base (collation-adjusted) | Art. 908 |
| Donations to children charged to legitime | Art. 909 |
| Donations to IC charged to IC legitime | Art. 910 |
| Inofficious disposition reduction order | Art. 911 |
| IC = ½ of LC (Family Code supersedes old Art. 895 tiers) | FC Art. 176 |
