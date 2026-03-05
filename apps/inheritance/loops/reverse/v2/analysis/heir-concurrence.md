# Heir Concurrence Analysis
*Wave 2 — Domain Rule Extraction*
*Sources: Civil Code Arts. 887–903 (testate), Arts. 960–1014 (intestate), Arts. 1015–1023 (accretion)*
*Depends on: heir-classification*

---

## 1. Core Concurrence Rule (Art. 887 ¶2)

> "Compulsory heirs mentioned in Nos. 3, 4, and 5 are not excluded by those in Nos. 1 and 2; neither do they exclude one another."

This establishes the full concurrence framework:

| Relationship | Rule |
|---|---|
| G1 (LegitimateChild) vs G2 (LegitimateAscendant) | **Mutually exclusive**: G1 excludes G2 ("in default of") |
| G3 (Spouse) vs G1/G2 | **Never excluded** by other groups; only by personal disqualification |
| G4 (IllegitimateChild) vs G1/G2 | **Never excluded** by other groups |
| G3 vs G4 | **Never exclude each other** |

---

## 2. Scenario Code System

The engine assigns a **ScenarioCode** before computing any fractions. There are 30 scenarios total: 15 testate (T1–T15) and 15 intestate (I1–I15). The scenario code is the key input to the legitime computation step.

### Rust Enum

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum ScenarioCode {
    // Testate scenarios
    T1, T2, T3, T4, T5,
    T6, T7, T8, T9,
    T10, T11, T12, T13,
    T14, T15,
    // Intestate scenarios
    I1, I2, I3, I4,
    I5, I6, I7, I8,
    I9, I10, I11, I12,
    I13, I14, I15,
}
```

---

## 3. Testate Legitime Scenarios (T1–T15)

In testate succession, the engine computes each group's **legitime fraction** of the hereditary estate. The free portion (FP) = 1 − sum(all legitimes). Illegitimate children's legitimes come from FP, subject to the cap rule (Art. 895 ¶3).

### Regime A: Descendants Present (G1)

| Code | Surviving Groups | Legal Basis | Legitime Fractions |
|------|-----------------|-------------|-------------------|
| T1 | n legit. children only | Art. 888 | G1 total = ½; each = 1/(2n); FP = ½ |
| T2 | 1 legit. child + spouse | Arts. 888, 892¶1 | G1 = ½; G3 = ¼ (from FP); FP = ¼ |
| T3 | n≥2 legit. children + spouse | Arts. 888, 892¶2 | G1 total = ½; G3 = 1/(2n) (from FP); FP = (n−1)/(2n) |
| T4 | n legit. + m illegit. (no spouse) | Arts. 888, 895 | G1 total = ½; each illegit. = (½/2n) uncapped; FP = remainder after cap |
| T5 | n legit. + m illegit. + spouse | Arts. 888, 892, 895, 897 | G1 = ½; G3 = 1/(2n) if n≥2, else ¼; G4 capped at FP−G3; FP = remainder |

**Spouse formula in T3/T5**: When n≥2, per-child legitime = estate × ½ / n. Spouse's legitime = same per-child amount (Art. 892 ¶2). Note: when n=1, spouse gets ¼ of estate regardless (Art. 892 ¶1), which is LESS than the child's ½.

### Regime B: Ascendants Present, No Descendants (G2)

| Code | Surviving Groups | Legal Basis | Legitime Fractions |
|------|-----------------|-------------|-------------------|
| T6 | Ascendants only | Art. 889 | G2 total = ½; FP = ½ |
| T7 | Ascendants + spouse | Arts. 889, 893 | G2 = ½; G3 = ¼ (from FP); FP = ¼ |
| T8 | Ascendants + m illegit. | Arts. 889, 896 | G2 = ½; G4 total = ¼ (from FP); FP = ¼ |
| T9 | Ascendants + m illegit. + spouse | Arts. 889, 899 | G2 = ½; G4 total = ¼ (from FP); G3 = ⅛ (from FP); FP = ⅛ |

### Regime C: No Primary Compulsory Heirs (G1 and G2 absent)

| Code | Surviving Groups | Legal Basis | Legitime Fractions |
|------|-----------------|-------------|-------------------|
| T10 | Spouse + m illegit. | Art. 894 | G3 = ⅓; G4 total = ⅓; FP = ⅓ |
| T11 | m illegit. only | Art. 901 | G4 total = ½; FP = ½ |
| T12 | Spouse only | Art. 900 | G3 = ½ (or ⅓ if articulo mortis < 3 months); FP = ½ (or ⅔) |
| T13 | No compulsory heirs | Art. 842 | No legitime; FP = entire estate |

### Special: Illegitimate Decedent's Parents (Art. 903)

Applies when the **decedent** was themselves an illegitimate child. Their legitimate parents may inherit under these scenarios:

| Code | Surviving Heirs | Legal Basis | Allocation |
|------|----------------|-------------|-----------|
| T14 | Parents of illegit. decedent only (no descendants, no spouse, no children) | Art. 903 ¶1 | Parents = ½; FP = ½ |
| T15 | Parents of illegit. decedent + spouse (no children) | Art. 903 ¶2 | Parents = ¼; Spouse = ¼; FP = ½ |

**Critical**: If the illegitimate decedent leaves ANY children (legitimate or illegitimate), parents get **NOTHING** (Art. 903 ¶2). T14/T15 only apply when there are no children/descendants.

---

## 4. Intestate Distribution Scenarios (I1–I15)

In intestate succession, the **entire estate** is distributed — there is no "free portion" concept. Different share rules apply.

### Classes 1–4 Concurrence (Primary Heirs)

| Code | Surviving Heirs | Legal Basis | Distribution |
|------|----------------|-------------|-------------|
| I1 | n legit. children (no spouse, no illegit.) | Art. 980 | Equal shares; each = 1/n |
| I2 | n legit. children + spouse | Art. 996 | Spouse = 1 child's share; all equal at 1/(n+1) |
| I3 | n legit. + m illegit. (no spouse) | Arts. 983, 895 | Ratio: legit. unit=2, illegit. unit=1; per-unit = estate ÷ (2n+m) |
| I4 | n legit. + m illegit. + spouse | Arts. 999, 983, 895 | Ratio: legit.=2, illegit.=1, spouse=2; per-unit = estate ÷ (2n+m+2) |
| I5 | Legitimate parents only | Arts. 985, 986 | Equal (½ each if both; all to survivor if one dead) |
| I6 | Legitimate parents + spouse | Art. 997 | ½ to parents; ½ to spouse |
| I7 | m illegit. children only | Art. 988 | Equal shares; each = 1/m |
| I8 | m illegit. children + spouse | Art. 998 | ½ to spouse; ½ to illegit. children equally |
| I9 | Legitimate ascendants + m illegit. children | Art. 991 | ½ to ascendants; ½ to illegit. children |
| I10 | Legit. ascendants + m illegit. + spouse | Art. 1000 | ½ ascendants; ¼ illegit. children; ¼ spouse |
| I11 | Spouse only (no siblings eligible) | Art. 994/995 | Entire estate to spouse |

### Class 5: Collateral Relatives (Intestate Only)

Collaterals only inherit if ALL of Classes 1–4 are absent (no descendants, ascendants, illegitimate children, or surviving spouse who takes entire estate without collaterals).

**Exception**: Art. 1001 — spouse does NOT fully exclude siblings. The spouse concurs with siblings/their children in I12.

| Code | Surviving Heirs | Legal Basis | Distribution |
|------|----------------|-------------|-------------|
| I12 | Spouse + siblings/nephews-nieces | Art. 1001 | ½ to spouse; ½ to siblings (full blood = 2× half blood) |
| I13 | Siblings only (no spouse, no primary heirs) | Arts. 1003–1006 | Full blood = 2 units, half blood = 1 unit; per-unit method |
| I14 | Other collaterals only (within 5th degree) | Arts. 1009, 1010 | All inherit; nearer degree excludes more remote; equal within same degree |
| I15 | No heirs at all | Art. 1011 | Entire estate to the State (escheat) |

---

## 5. Scenario Determination Algorithm

### Inputs
- `groups`: output of heir classification (which effective groups have ≥1 eligible heir)
- `decedent.is_illegitimate`: bool — triggers T14/T15 check
- `count_legit_children`: u32 — needed to distinguish T2 vs T3
- `succession_type`: Testate | Intestate | Mixed

### Testate Scenario Determination

```rust
fn determine_testate_scenario(
    has_g1: bool,
    has_g2: bool,
    has_g3: bool,
    has_g4: bool,
    count_legit_children: u32,
    decedent_is_illegitimate: bool,
) -> ScenarioCode {
    // Art. 887(2): G1 presence excludes G2
    let effective_g2 = has_g2 && !has_g1;

    // Special: illegitimate decedent's parents (Art. 903)
    if decedent_is_illegitimate && effective_g2 && !has_g1 && !has_g4 {
        return if has_g3 { ScenarioCode::T15 } else { ScenarioCode::T14 };
    }

    match (has_g1, effective_g2, has_g3, has_g4) {
        (true,  false, false, false) => ScenarioCode::T1,
        (true,  false, true,  false) =>
            if count_legit_children == 1 { ScenarioCode::T2 } else { ScenarioCode::T3 },
        (true,  false, false, true)  => ScenarioCode::T4,
        (true,  false, true,  true)  => ScenarioCode::T5,
        (false, true,  false, false) => ScenarioCode::T6,
        (false, true,  true,  false) => ScenarioCode::T7,
        (false, true,  false, true)  => ScenarioCode::T8,
        (false, true,  true,  true)  => ScenarioCode::T9,
        (false, false, true,  true)  => ScenarioCode::T10,
        (false, false, false, true)  => ScenarioCode::T11,
        (false, false, true,  false) => ScenarioCode::T12,
        (false, false, false, false) => ScenarioCode::T13,
        _ => unreachable!("G1 always excludes G2; other combos covered above"),
    }
}
```

### Intestate Scenario Determination

```rust
fn determine_intestate_scenario(
    has_g1: bool,
    has_g2: bool,
    has_g3: bool,
    has_g4: bool,
    has_collaterals: bool,  // siblings, nephews/nieces, cousins ≤ 5th degree
) -> ScenarioCode {
    let effective_g2 = has_g2 && !has_g1;

    match (has_g1, effective_g2, has_g3, has_g4) {
        (true,  false, false, false) => ScenarioCode::I1,
        (true,  false, true,  false) => ScenarioCode::I2,
        (true,  false, false, true)  => ScenarioCode::I3,
        (true,  false, true,  true)  => ScenarioCode::I4,
        (false, true,  false, false) => ScenarioCode::I5,
        (false, true,  true,  false) => ScenarioCode::I6,
        (false, false, false, true)  => ScenarioCode::I7,
        (false, false, true,  true)  => ScenarioCode::I8,
        (false, true,  false, true)  => ScenarioCode::I9,
        (false, true,  true,  true)  => ScenarioCode::I10,
        (false, false, true,  false) =>
            if has_collaterals { ScenarioCode::I12 } else { ScenarioCode::I11 },
        (false, false, false, false) =>
            if has_collaterals { ScenarioCode::I13 } // or I14 depending on collateral type
            else { ScenarioCode::I15 },
        _ => unreachable!(),
    }
    // Note: I13 vs I14 further resolved by collateral classification step
}
```

---

## 6. Count of Legitimate Child Lines

The number of "legitimate child lines" (not individual heirs) drives the per-child legitime in T2/T3/T5 and the spouse share formula. A predeceased child with eligible descendants counts as **1 line** (per stirpes representation).

```rust
/// Each direct legitimate child slot = 1 line, whether occupied by the child or their representatives.
fn count_legitimate_child_lines(classified_heirs: &ClassifiedHeirs) -> u32 {
    classified_heirs
        .legitimate_child_group
        .iter()
        .filter(|slot| slot.is_active_line) // alive heir or has representatives
        .count() as u32
}
```

**Why this matters**: With 2 legitimate child lines, the per-child legitimate = estate × ¼. With 3 lines = estate × ⅙. The spouse's share in T3/T5 is always equal to the per-line amount.

---

## 7. Cap Rule (Art. 895 ¶3)

The Art. 895 cap constrains illegitimate children's legitime in scenarios T4 and T5 (and T8 is a fixed ¼ with no cap needed since it comes from FP).

**Cap formula**:
```
FP_gross = estate − total_G1_legitime   // = ½ × estate for scenarios with G1
spouse_legitime_from_FP = computed G3 amount
FP_disposable = FP_gross − spouse_legitime_from_FP

// Each illegit child's uncapped computed share:
per_illegit_uncapped = G1_per_child / 2   // = (estate / 2 / n) / 2

total_illegit_uncapped = per_illegit_uncapped × m

// Apply cap:
total_illegit_actual = min(total_illegit_uncapped, FP_disposable)
per_illegit_actual = total_illegit_actual / m   // proportional reduction
```

**Example (cap bites)**: Estate ₱10M, 1 legit child, 1 spouse, 5 illegit children.
- G1 legitime: ₱5M → FP_gross = ₱5M
- Spouse (T5, n=1): ¼ × ₱10M = ₱2.5M → FP_disposable = ₱2.5M
- Per illegit uncapped: ₱5M / 2 = ₱2.5M × 5 = ₱12.5M total
- Cap: ₱12.5M → ₱2.5M; each illegit gets ₱500,000 (not ₱2.5M)
- FP = ₱0 (fully consumed by spouse + illegit)

**Example (cap does not bite)**: Estate ₱10M, 2 legit children, 1 spouse, 1 illegit child.
- G1 legitime: ₱5M → per child = ₱2.5M; FP_gross = ₱5M
- Spouse (T5, n=2): ₱2.5M → FP_disposable = ₱2.5M
- Per illegit uncapped: ₱2.5M / 2 = ₱1.25M (< FP_disposable, no cap)
- FP actual = ₱5M − ₱2.5M − ₱1.25M = ₱1.25M

---

## 8. Sibling Full-Blood vs Half-Blood (Arts. 1004, 1006)

Applies to scenarios I12 and I13.

```rust
// Full blood sibling = 2 units; half blood = 1 unit
fn sibling_units(siblings: &[Sibling]) -> Vec<(HeirId, Rational)> {
    let total_units: u32 = siblings.iter()
        .map(|s| if s.is_full_blood { 2 } else { 1 })
        .sum();
    siblings.iter()
        .map(|s| {
            let units = if s.is_full_blood { 2u32 } else { 1u32 };
            (s.id, Rational::new(units, total_units))
        })
        .collect()
}
```

Art. 1007 special case: if ALL surviving siblings are half-blood (some paternal, some maternal), they inherit equally — no doubling rule applies when no full-blood siblings survive.

---

## 9. Testate vs Intestate Comparison Table

The same heir configuration produces different numbers depending on succession type. The engine must use the correct scenario branch:

| Surviving Heirs | Testate Spouse Share | Intestate Spouse Share |
|----------------|---------------------|----------------------|
| 2 legit. children + spouse | = 1 child's share = ¼ estate | = 1 child's share = ⅓ estate |
| Parents + spouse | ¼ of estate (Art. 893) | ½ of estate (Art. 997) |
| Illegit. children + spouse | ⅓ of estate (Art. 894) | ½ of estate (Art. 998) |
| Ascendants + illegit. + spouse | ⅛ of estate (Art. 899) | ¼ of estate (Art. 1000) |

---

## 10. Mixed Succession Handling

Mixed succession (Art. 778, 780) occurs when a will only disposes of part of the estate. The engine applies:
1. **Testate scenario** for legitime validation and the disposed portion
2. **Intestate scenario** for the undisposed remainder

```
testate_portion = sum(will.dispositions)
intestate_remainder = estate − testate_portion

// Step A: Validate testate dispositions against all legitimes (testate scenario)
// Step B: Distribute intestate_remainder per intestate scenario
// Step C: Ensure each heir's total ≥ their legitime
```

---

## 11. Edge Cases

### E1: Representation Creates Virtual Child Lines
When a legitimate child predeceases but has eligible representatives, those representatives occupy the **original child's slot** for concurrence counting. The scenario code and per-child legitime are computed as if the predeceased child were alive. Grandchildren then split the parent's slot per stirpes.

### E2: All Children Renounce
If ALL G1 members renounce, G2 becomes eligible ("in default"). Engine must re-run scenario determination after renunciation processing. Renouncing heirs' children do NOT represent (Art. 977).

### E3: Spouse + Collaterals (Art. 1001 Exception)
A surviving spouse does NOT fully exclude siblings/their children from intestate succession. This is the ONLY case where collaterals (Class 5) concur with a primary Class 4 heir. Engine flags: `has_collaterals = true` → I12 (not I11).

### E4: Articulo Mortis Marriage (Art. 900 ¶2)
If the marriage was solemnized in articulo mortis (deathbed), AND the testator died within 3 months, AND they had not been living together for 5+ years, then in T12 (spouse only), the spouse's legitime is ⅓ (not ½). Engine requires `articulo_mortis: bool` and `cohabitation_years: u32` on the decedent record.

### E5: Illegitimate Decedent — Parents vs Children Priority
If an illegitimate decedent has ANY children (Art. 903 ¶2 says "only legitimate or illegitimate children are left"), parents get zero. The T14/T15 branch only fires when `has_g1 = false AND has_g4 = false`. The `decedent_is_illegitimate` flag triggers this special branch, but children still exclude parents even in this mode.

---

## 12. New Fields Required on Engine Input

From this analysis, these fields are needed that may not yet be in the HeirInput struct:

| Field | Location | Purpose |
|-------|----------|---------|
| `is_full_blood: bool` | Sibling heir input | Sibling double-share rule (Art. 1006) |
| `is_collateral: bool` | Heir input | Distinguish primary vs collateral for intestate scenarios |
| `collateral_degree: u32` | Collateral heir input | 5th degree limit (Art. 1010) |
| `articulo_mortis: bool` | Decedent input | Art. 900 ¶2 spouse legitime reduction |
| `cohabitation_years: u32` | Decedent input | Art. 900 ¶2 5-year exception |
| `decedent_is_illegitimate: bool` | Decedent input | Triggers Art. 903 scenarios T14/T15 |

---

## 13. Article Quick Reference

| Rule | Article |
|------|---------|
| G3 + G4 never excluded | Art. 887 ¶2 |
| G1 excludes G2 | Art. 887(2) |
| Legit. children equal shares | Art. 980 |
| Illegit. = ½ legit. child | FC Art. 176 + Art. 895 |
| Spouse with 1 legit. child | Art. 892 ¶1 |
| Spouse with 2+ legit. children | Art. 892 ¶2 |
| Spouse with ascendants only | Art. 893 |
| Spouse + illegit. only (testate) | Art. 894 |
| Cap rule | Art. 895 ¶3 |
| Illegit. with ascendants (testate) | Art. 896 |
| Spouse + legit. + illegit. (testate) | Art. 897 |
| All three groups (testate) | Art. 899 |
| Spouse alone (testate) | Art. 900 |
| Articulo mortis reduction | Art. 900 ¶2 |
| Illegit. alone (testate) | Art. 901 |
| Illegit. decedent's parents | Art. 903 |
| Spouse + children (intestate) | Art. 996 |
| Spouse + parents (intestate) | Art. 997 |
| Spouse + illegit. (intestate) | Art. 998 |
| Spouse + all groups (intestate) | Art. 999 |
| Asc. + illegit. + spouse (intestate) | Art. 1000 |
| Spouse + collaterals (intestate) | Art. 1001 |
| Sibling equal shares | Art. 1004 |
| Full vs half blood siblings | Art. 1006 |
| Half-blood only (equal) | Art. 1007 |
| Other collaterals | Art. 1009 |
| 5th degree limit | Art. 1010 |
| Escheat to State | Art. 1011 |
