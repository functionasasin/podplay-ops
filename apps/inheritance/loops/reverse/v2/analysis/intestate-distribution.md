# Intestate Distribution Analysis
*Wave 2 — Domain Rule Extraction*
*Sources: Civil Code Arts. 960–1014 (Intestate Succession), Arts. 1015–1023 (Accretion)*
*Depends on: heir-classification, heir-concurrence, representation, legitime-fractions*

---

## 1. When Intestate Succession Applies (Art. 960)

Intestate succession takes place when:
1. No will, void will, or will that lost validity (Art. 960(1))
2. Will does not dispose of all property — intestate applies only to undisposed portion (Art. 960(2))
3. Suspensive condition on institution fails, heir predeceases, heir renounces without substitution or accretion (Art. 960(3))
4. Instituted heir is incapable of succeeding (Art. 960(4))
5. **Preterition** (Art. 854): omission of direct-line compulsory heir annuls institution → converts to full intestate (devises/legacies remain valid if not inofficious)

```rust
pub enum IntestateTrigger {
    NotIntestate,
    FullIntestateNoWill,           // Art. 960(1)
    FullIntestateVoidWill,         // Art. 960(1)
    FullIntestateByPreterition,    // Art. 854 annulment
    PartialIntestateUndisposed,    // Art. 960(2)
    PartialIntestateConditionFailed, // Art. 960(3)
    PartialIntestateIncapable,     // Art. 960(4)
}
```

---

## 2. General Principles (Arts. 961–962)

**Art. 961** — Intestate heirs: legitimate/illegitimate relatives, surviving spouse, the State.

**Art. 962 — Proximity Rule** — Nearest relative in degree excludes more remote, *saving the right of representation when it properly takes place.*

---

## 3. The 6-Class Priority Hierarchy

| Priority | Class | Articles | Who |
|----------|-------|----------|-----|
| 1 | Legitimate descendants | 978–984 | Children, grandchildren (by representation), adopted |
| 2 | Legitimate ascendants | 985–987 | Parents, grandparents (excluded by Class 1) |
| 3 | Illegitimate children | 988–993 | Illegitimate children and descendants |
| 4 | Surviving spouse | 994–1002 | Widow/widower (guilty spouse excluded by Art. 1002) |
| 5 | Collateral relatives | 1003–1010 | Siblings, nephews/nieces, cousins ≤ 5th degree |
| 6 | The State | 1011–1014 | Republic of the Philippines |

**Critical**: Classes 1–4 can **concur** with each other per specific articles. Class 5 is excluded by Classes 1–4, **except Art. 1001** (spouse + siblings). Class 6 only inherits when all of Classes 1–5 are absent.

---

## 4. All 15 Intestate Scenarios — Complete Distribution Formulas

### Class 1 Present: Legitimate Descendants Survive

#### I1 — Legitimate Children Only
**Legal basis**: Art. 980
**Rule**: Equal shares; each child = 1/n of estate.
**With representation (Art. 981)**: Predeceased child's line = 1 share; representatives split that share per stirpes.

```
n_lines = count(active_legit_lines)  // living children + represented lines
per_line = estate / n_lines
```

**Example**: ₱9,000,000 estate; 3 lines (C1 alive, C2 predeceased→GC1+GC2, C3 alive)
- C1: ₱3,000,000 | GC1: ₱1,500,000 | GC2: ₱1,500,000 | C3: ₱3,000,000

#### I2 — Legitimate Children + Surviving Spouse
**Legal basis**: Arts. 994, 996
**Rule**: Spouse receives a share **equal to one legitimate child's share**. All shares equal.

```
total_units = n_lines + 1   // +1 for spouse
per_unit = estate / total_units
spouse_share = per_unit
each_legit_line_share = per_unit
```

**Key difference from testate (T2/T3)**: In testate, spouse's legitime = ¼ (1 child) or 1/(2n) (≥2 children) taken from FP, always ≤ child's ½ share. In intestate I2, spouse gets full **equal** share with each child.

**Example**: ₱12,000,000 estate; 3 children + spouse → 4 equal shares of ₱3,000,000 each.

#### I3 — Legitimate + Illegitimate Children (No Spouse)
**Legal basis**: Arts. 983, 895
**Rule**: 2:1 unit ratio — legitimate child = 2 units, illegitimate child = 1 unit.
**No cap**: Unlike testate (Art. 895 ¶3 cap), intestate has NO cap on illegitimate children's shares.

```
total_units = (n_legit_lines * 2) + (n_illegit_lines * 1)
per_unit = estate / total_units
each_legit_line_share = per_unit * 2
each_illegit_line_share = per_unit * 1
```

**Example**: ₱10,000,000; 2 LC + 3 IC → 7 units; per unit = ₱1,428,571; each LC: ₱2,857,143; each IC: ₱1,428,571

#### I4 — Legitimate + Illegitimate Children + Surviving Spouse
**Legal basis**: Arts. 999, 983, 895
**Rule**: Spouse = 2 units (same as legitimate child); 2:1 ratio throughout.

```
total_units = (n_legit_lines * 2) + (n_illegit_lines * 1) + 2  // +2 for spouse
per_unit = estate / total_units
spouse_share = per_unit * 2
each_legit_line_share = per_unit * 2
each_illegit_line_share = per_unit * 1
```

**Example**: ₱14,000,000; 2 LC + 1 IC + spouse → 7 units; per unit = ₱2,000,000; each LC: ₱4,000,000; IC: ₱2,000,000; spouse: ₱4,000,000

---

### Class 2 Present: Legitimate Ascendants Survive (No Descendants)

#### I5 — Legitimate Parents/Ascendants Only
**Legal basis**: Arts. 985, 986, 987
**Rule**: Entire estate to ascendants. 3-tier algorithm:
- **Tier 1** (Art. 986 ¶1): Both parents alive → ½ each
- **Tier 2** (Art. 986 ¶2): One parent alive → entire estate to survivor
- **Tier 3** (Art. 987): No parents → nearest degree, by-line split

```rust
fn distribute_ascendants(amount: Money, ascendants: &[Heir]) -> HashMap<HeirId, Money> {
    let parents: Vec<_> = ascendants.iter().filter(|a| a.degree == 1).collect();
    if parents.len() == 2 {
        return map![parents[0].id => amount/2, parents[1].id => amount/2];
    }
    if parents.len() == 1 {
        return map![parents[0].id => amount];
    }
    // Art. 987: nearest degree, by-line split
    let min_degree = ascendants.iter().map(|a| a.degree).min().unwrap();
    let nearest: Vec<_> = ascendants.iter().filter(|a| a.degree == min_degree).collect();
    let paternal: Vec<_> = nearest.iter().filter(|a| a.line == Line::Paternal).collect();
    let maternal: Vec<_> = nearest.iter().filter(|a| a.line == Line::Maternal).collect();
    match (paternal.is_empty(), maternal.is_empty()) {
        (false, false) => {
            // ½ to each line, per capita within line
            let pat_each = amount/2 / paternal.len();
            let mat_each = amount/2 / maternal.len();
            paternal.map(|a| a.id => pat_each) + maternal.map(|a| a.id => mat_each)
        }
        (false, true)  => paternal.map(|a| a.id => amount / paternal.len()),
        (true,  false) => maternal.map(|a| a.id => amount / maternal.len()),
        (true,  true)  => unreachable!()
    }
}
```

**Example (grandparents, both lines)**: ₱10,000,000; paternal grandfather + both maternal grandparents
- Paternal line: ₱5,000,000; Maternal line: ₱5,000,000 → each maternal GP: ₱2,500,000

#### I6 — Legitimate Parents/Ascendants + Surviving Spouse
**Legal basis**: Art. 997
**Rule**: ½ to ascendants, ½ to spouse.

```
spouse_share = estate / 2
ascendant_total = estate / 2
→ distribute_ascendants(ascendant_total, ascendants)
```

**Key difference from testate (T7)**: In testate, spouse gets ¼ from FP. In intestate I6, spouse gets ½ — **double** the testate share.

---

### Class 3 Present: Illegitimate Children (No Descendants, No Ascendants)

#### I7 — Illegitimate Children Only
**Legal basis**: Art. 988
**Rule**: Entire estate equally to illegitimate children (or their representatives per Art. 989).

```
each_illegit_line_share = estate / n_illegit_lines
```

#### I8 — Illegitimate Children + Surviving Spouse
**Legal basis**: Art. 998
**Rule**: ½ to spouse, ½ to illegitimate children (equal shares).

```
spouse_share = estate / 2
each_illegit_line_share = (estate / 2) / n_illegit_lines
```

**Key difference from testate (T10)**: Testate: spouse ⅓, each IC ⅓ (with ⅓ FP). Intestate: spouse ½, IC group ½.

---

### Cross-Class Concurrence

#### I9 — Legitimate Ascendants + Illegitimate Children (No Descendants, No Spouse)
**Legal basis**: Art. 991
**Rule**: ½ to ascendants, ½ to illegitimate children. Fixed split regardless of numbers.

```
ascendant_total = estate / 2  → distribute_ascendants(estate/2, ascendants)
each_illegit_line_share = (estate / 2) / n_illegit_lines
```

**"Whatever be the number"**: The ½/½ split is FIXED. 1 ascendant + 5 IC → ascendant still gets ½.

#### I10 — Legitimate Ascendants + Illegitimate Children + Surviving Spouse
**Legal basis**: Art. 1000
**Rule**: ½ ascendants, ¼ illegitimate children, ¼ spouse. FIXED fractions.

```
ascendant_total = estate / 2  → distribute_ascendants(estate/2, ascendants)
spouse_share = estate / 4
each_illegit_line_share = (estate / 4) / n_illegit_lines
```

**Key difference from testate (T9)**: Testate: asc ½, IC ¼, spouse ⅛ (FP = ⅛). Intestate: spouse gets ¼ vs ⅛ — **double** the testate share.

---

### Class 4 Only: Surviving Spouse

#### I11 — Surviving Spouse Only (No Siblings Eligible)
**Legal basis**: Arts. 994–995
**Rule**: Entire estate to surviving spouse.

**Art. 1002 disqualification**: Spouse who gave cause for legal separation gets NOTHING → falls to I13/I14/I15.

**Articulo mortis note**: Art. 900 ¶2's ⅓ reduction is in the Legitime chapter (testate only). Do NOT apply it in intestate I11. Spouse inherits entire estate in I11 regardless of marriage circumstances.

**Art. 1001 carve-out**: "Without prejudice to the rights of brothers and sisters, nephews and nieces, should there be any, under Article 1001" — if siblings/nephews-nieces exist, this becomes I12 instead.

---

### Art. 1001 Exception: Spouse + Collaterals

#### I12 — Surviving Spouse + Siblings/Nephews-Nieces
**Legal basis**: Art. 1001
**Rule**: ½ to spouse, ½ to siblings/their children.

```
spouse_share = estate / 2
collateral_total = estate / 2  → distribute_collaterals(estate/2, collaterals)
```

**Scope of concurrence**: Only **siblings and their children** (nephews/nieces). More remote collaterals (cousins, etc.) do NOT concur with the spouse. If only remote collaterals survive with the spouse, I11 applies (spouse takes all, remote collaterals excluded).

---

### Class 5: Collateral Relatives

#### I13 — Siblings Only (No Primary Heirs, No Spouse)
**Legal basis**: Arts. 1003, 1004, 1006, 1007

Three sub-cases:
1. **All full blood** (Art. 1004): equal shares
2. **All half blood** (Art. 1007): equal shares (no line distinction)
3. **Mixed full + half blood** (Art. 1006): full blood = 2 units, half blood = 1 unit

```rust
fn distribute_siblings(amount: Money, siblings: &[Sibling]) -> HashMap<HeirId, Money> {
    let full: Vec<_> = siblings.iter().filter(|s| s.blood == BloodType::Full).collect();
    let half: Vec<_> = siblings.iter().filter(|s| s.blood == BloodType::Half).collect();
    match (full.is_empty(), half.is_empty()) {
        (false, true)  => // All full: equal
            full.map(|s| s.id => amount / full.len()),
        (true,  false) => // All half: equal (Art. 1007: no line distinction)
            half.map(|s| s.id => amount / half.len()),
        (false, false) => { // Mixed: 2:1 ratio
            let total_units = full.len() * 2 + half.len() * 1;
            let per_unit = amount / total_units;
            full.map(|s| s.id => per_unit * 2) + half.map(|s| s.id => per_unit * 1)
        }
        (true, true) => unreachable!()
    }
}
```

**Example**: ₱10,000,000; 2 full-blood + 1 half-blood siblings → 5 units; per unit = ₱2,000,000; each full: ₱4,000,000; half: ₱2,000,000

#### I13 — Siblings + Nephews/Nieces (Representation)
**Legal basis**: Arts. 1005, 1008
**Rule**: Living siblings per capita; nephews/nieces of predeceased siblings per stirpes.
Full/half blood doubling applies to sibling lines (Art. 1008 incorporates Art. 1006 rules).

#### I13b — Nephews/Nieces Only (All Siblings Predeceased)
**Legal basis**: Art. 975
**Rule**: Per capita (equal shares) — NOT per stirpes.

> "But if they alone survive, they shall inherit in equal portions." — Art. 975

**Note on Art. 1008 + Art. 1006 interaction**: Art. 1008 says nephews of full-blood siblings "succeed in accordance with the rules laid down for brothers and sisters of the full blood" — engine applies full/half blood doubling rule even in per capita mode (configurable).

#### I14 — Other Collateral Relatives (Within 5th Degree)
**Legal basis**: Arts. 1009, 1010
**Rule**: Nearest degree excludes more remote. Equal shares within same degree. No line or blood distinction.

```
eligible = collaterals.filter(|c| c.collateral_degree <= 5)
min_degree = eligible.iter().min_by(|c| c.collateral_degree)
nearest = eligible.filter(|c| c.collateral_degree == min_degree)
each_share = amount / nearest.len()
```

**Degree counting** (Art. 966, collateral line): Count up to common ancestor + down.
- 2nd degree: siblings
- 3rd degree: nephews/nieces; grandparents
- 4th degree: great-grandparents; children of nephews/nieces (grand-nephews); first cousins
- 5th degree: children of first cousins; great-grandchildren of siblings

#### I15 — No Heirs (Escheat to State)
**Legal basis**: Arts. 1011–1014

```rust
pub struct EscheatedEstate {
    pub total: Money,
    // Art. 1013: personal property → municipality/city of last residence
    // Art. 1013: real property → municipality/city where situated
    // Art. 1013: for benefit of public schools and charitable institutions
    // Art. 1014: legitimate heir can reclaim within 5 years
    pub escheat_deadline_years: u8,  // = 5
}
```

---

## 5. Intestate Scenario Determination Algorithm

```rust
/// Called AFTER eligibility gates, AFTER G1 excludes G2.
pub fn determine_intestate_scenario(
    has_g1: bool,               // legitimate descendants (or representatives)
    has_g2: bool,               // legitimate ascendants (already excludes if has_g1)
    has_g3: bool,               // surviving spouse (not guilty of legal sep.)
    has_g4: bool,               // illegitimate children (or representatives)
    has_siblings: bool,         // siblings AND/OR their children (nephews/nieces)
    has_any_collateral: bool,   // any collateral within 5th degree
) -> ScenarioCode {
    // G1 excludes G2 is already applied before calling this fn
    match (has_g1, has_g2, has_g3, has_g4) {
        (true,  false, false, false) => ScenarioCode::I1,
        (true,  false, true,  false) => ScenarioCode::I2,
        (true,  false, false, true)  => ScenarioCode::I3,
        (true,  false, true,  true)  => ScenarioCode::I4,
        (false, true,  false, false) => ScenarioCode::I5,
        (false, true,  false, true)  => ScenarioCode::I6,
        (false, false, false, true)  => ScenarioCode::I7,   // note: G4=illegit, G3=none
        (false, false, true,  true)  => ScenarioCode::I8,
        (false, true,  true,  false) => ScenarioCode::I9,
        (false, true,  true,  true)  => ScenarioCode::I10,
        // Spouse only — check for Art. 1001 sibling concurrence
        (false, false, true,  false) => {
            if has_siblings { ScenarioCode::I12 } else { ScenarioCode::I11 }
        }
        // No primary heirs
        (false, false, false, false) => {
            if has_siblings      { ScenarioCode::I13 }
            else if has_any_collateral { ScenarioCode::I14 }
            else                 { ScenarioCode::I15 }
        }
        _ => unreachable!("G1 always excludes G2"),
    }
}
```

**Note on I13 vs I14 refinement**: I13 is the initial code for collateral heirs. A sub-step further classifies as siblings-only, siblings+nephews-nieces, or nephews-nieces-only. I14 is for other collaterals (cousins, etc.).

---

## 6. Collateral Distribution Sub-Algorithm

```rust
fn distribute_collaterals(amount: Money, collaterals: &[CollateralHeir]) -> HashMap<HeirId, Money> {
    let siblings: Vec<_> = collaterals.iter().filter(|c| c.is_sibling).collect();
    let nephews:  Vec<_> = collaterals.iter().filter(|c| c.is_nephew_niece).collect();

    if !siblings.is_empty() && !nephews.is_empty() {
        // Art. 1005: surviving siblings per capita + nephews per stirpes
        distribute_sibling_lines(amount, build_sibling_lines(siblings, nephews))
    } else if !siblings.is_empty() {
        distribute_siblings(amount, siblings)
    } else if !nephews.is_empty() {
        // Art. 975: per capita when no surviving siblings
        distribute_nephews_per_capita(amount, nephews)
    } else {
        // Arts. 1009-1010: other collaterals
        distribute_other_collaterals(amount, collaterals)
    }
}
```

---

## 7. Intestate Accretion (Art. 1018)

> "In legal succession the share of the person who repudiates the inheritance shall always accrue to his co-heirs." — Art. 1018

**Key rules**:
- Art. 977: renouncing heir CANNOT be represented
- Art. 1018: vacant share accrues to co-heirs of the estate (all remaining heirs proportionally)
- If ALL heirs of a class renounce: next class inherits in own right (triggers scenario re-evaluation)

```rust
fn apply_intestate_accretion(
    shares: HashMap<HeirId, Money>,
    heirs: &[Heir],
    scenario: ScenarioCode,
) -> HashMap<HeirId, Money> {
    let renouncing: Vec<HeirId> = heirs.iter()
        .filter(|h| h.has_renounced && shares.contains_key(&h.id))
        .map(|h| h.id)
        .collect();

    if renouncing.is_empty() { return shares; }

    let mut result = shares;
    for heir_id in renouncing {
        let vacant = result.remove(&heir_id).unwrap();
        let remaining: Vec<HeirId> = result.keys().cloned().collect();
        if remaining.is_empty() {
            // All heirs renounced → next class (re-evaluate)
            return re_evaluate_intestate(heirs, scenario);
        }
        // Accrue proportionally to all remaining heirs
        let total_remaining: Money = result.values().sum();
        for co_id in &remaining {
            let proportion = result[co_id] / total_remaining;
            *result.get_mut(co_id).unwrap() += vacant * proportion;
        }
    }
    result
}
```

---

## 8. Iron Curtain Rule (Art. 992)

> "An illegitimate child has no right to inherit ab intestato from the legitimate children and relatives of his father or mother; nor shall such children or relatives inherit in the same manner from the illegitimate child." — Art. 992

**Engine impact**: When the **decedent** is illegitimate, filter collateral heirs before scenario determination:
- Exclude decedent's parents' legitimate children (the decedent's half-siblings from the legitimate side)
- Exclude decedent's parents' other legitimate relatives

**Only these may inherit from an illegitimate decedent**:
- Decedent's own descendants (legitimate or illegitimate)
- Decedent's parents (Art. 993: entire estate equally to surviving parent(s))
- Decedent's surviving spouse
- Decedent's own illegitimate children

**Art. 993** (illegitimate decedent, no issue, no spouse): Parents inherit entire estate; if both living, equal shares.

---

## 9. Testate vs. Intestate Comparison Table

| Scenario | Heirs | Spouse (Testate) | Spouse (Intestate) | Spouse Gain |
|----------|-------|-----------------|-------------------|------------|
| T2/I2 | 1 LC + Spouse | ¼ | ½ | +100% |
| T3/I2 | n≥2 LC + Spouse | 1/(2n) | 1/(n+1) | ~+33–100% |
| T7/I6 | Asc + Spouse | ¼ | ½ | +100% |
| T10/I8 | IC + Spouse | ⅓ | ½ | +50% |
| T9/I10 | Asc+IC+Spouse | ⅛ | ¼ | +100% |

**Key insight**: In intestate succession, the surviving spouse ALWAYS receives more than their testate legitime. The free portion that the testator controls in testate gets absorbed proportionally in intestate — and the spouse consistently benefits.

---

## 10. Key Differences from Testate (Summary)

| Rule | Testate | Intestate |
|------|---------|-----------|
| Free portion exists | Yes (FP_gross − legitimes) | No — entire estate distributed |
| Art. 895 cap (IC vs FP) | Yes — IC total ≤ FP_disposable | No — 2:1 ratio with no cap |
| Spouse with 1 LC | ¼ | ½ (equal to LC) |
| Spouse with ascendants | ¼ | ½ |
| Spouse alone | ½ (or ⅓ articulo mortis) | Entire estate |
| Siblings eligible | Never (not compulsory heirs) | Yes (Class 5, Art. 1001 with spouse) |
| State inherits | Never | When no eligible heir |

---

## 11. Rust Type Extensions Identified

From this analysis, the following additions are needed to the `DecedentInput` or `HeirInput` types:

```rust
pub struct CollateralHeir {
    pub id: HeirId,
    pub name: String,
    pub relationship: CollateralRelationship,  // Sibling, Nephew, Niece, Cousin, etc.
    pub blood_type: BloodType,                  // Full, Half (for siblings)
    pub collateral_degree: u8,                  // 2–5
    pub line: Option<Line>,                     // Paternal | Maternal (for siblings)
    pub parent_sibling_id: Option<HeirId>,      // For nephews/nieces: which sibling's child
    pub has_renounced: bool,
    pub is_disqualified: bool,                  // Art. 1002, unworthiness
}

pub enum CollateralRelationship {
    Sibling,
    NephewNiece,         // Child of sibling
    GrandNephewNiece,    // Child of nephew/niece
    Cousin,              // Child of aunt/uncle
    CousinOnceRemoved,   // Child of first cousin
}

pub enum BloodType {
    Full,   // Both parents are same as decedent's
    Half,   // Only one parent is same
}
```

---

## 12. Worked Examples

### Example A — I3: Legitimate + Illegitimate Children
Estate: ₱10,000,000; 2 LC + 3 IC
- Total units: (2 × 2) + (3 × 1) = 7
- Per unit: ₱10,000,000 / 7 = ₱1,428,571.43 (rounded via Hare-Niemeyer)
- Each LC: ₱2,857,142.86; Each IC: ₱1,428,571.43

### Example B — I10: Ascendants + IC + Spouse
Estate: ₱8,000,000; both parents + 2 IC + spouse
- Ascendants: ₱4,000,000 (½) → Father: ₱2,000,000; Mother: ₱2,000,000
- Illegitimate children: ₱2,000,000 (¼) → each IC: ₱1,000,000
- Spouse: ₱2,000,000 (¼)

### Example C — I12: Spouse + Siblings
Estate: ₱6,000,000; spouse + 2 full-blood siblings + 1 half-blood sibling
- Spouse: ₱3,000,000 (½)
- Sibling ½: ₱3,000,000 → 5 units (2×2 + 1×1); per unit = ₱600,000
  - Each full-blood sibling: ₱1,200,000
  - Half-blood sibling: ₱600,000

### Example D — I5 (Grandparents, Both Lines)
Estate: ₱10,000,000; both parents predeceased; paternal grandfather + both maternal grandparents
- Paternal line: ₱5,000,000 → paternal grandfather: ₱5,000,000
- Maternal line: ₱5,000,000 → each maternal grandparent: ₱2,500,000

---

## 13. Invariants

1. **Total conservation**: Sum of all intestate shares == net distributable estate (before Hare-Niemeyer rounding adjustment)
2. **No free portion**: In intestate succession, the "free portion" concept does not exist; entire estate is distributed
3. **G1 excludes G2**: If any legitimate descendant (or their representative) exists, no legitimate ascendant inherits
4. **No Art. 895 cap**: 2:1 ratio is applied directly in I3/I4 with no cap constraint
5. **Iron curtain applies**: For illegitimate decedents, legitimate relatives of the decedent's parents are excluded (Art. 992)
6. **Per stirpes within lines**: Representatives never exceed what their represented heir would have received (Art. 974)
7. **Art. 975 per capita**: When nephews/nieces survive alone (no living siblings), they inherit in equal portions, NOT per stirpes
8. **I11 → I12 check**: Spouse-only scenario must first check for surviving siblings/nephews-nieces (Art. 1001)
9. **Art. 1010 degree limit**: No collateral beyond 5th degree may inherit; excess falls to State
10. **Accretion proportional**: In intestate, renounced share accrues to all remaining co-heirs proportionally (Art. 1018); no representation for renouncing heir (Art. 977)
