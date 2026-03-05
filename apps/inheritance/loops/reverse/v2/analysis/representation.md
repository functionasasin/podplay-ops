# Representation Rights
*Wave 2 — Domain Rule Extraction*
*Sources: Civil Code Arts. 856, 902, 923, 970–977, 981–982, 989–990, 1018, 1021, 1035*

---

## 1. Legal Basis

### Core Definition (Art. 970)
Representation is a right created by fiction of law. The representative is raised to the **place and degree** of the person represented and acquires their succession rights as if they were alive.

### Source of the Right (Art. 971)
The representative is called by **law**, not by the person represented. The representative does not succeed the person represented — they succeed the **decedent** directly, stepping into the represented person's position.

**Implication**: A person can represent someone whose inheritance from a *different* estate they previously renounced (Art. 976).

### Where Representation Applies (Art. 972)
Three domains:

| Domain | Rule |
|---|---|
| Direct descending line | Always available; no depth limit (grandchildren, great-grandchildren, etc.) |
| Ascending line | **Never** — Art. 972 explicitly forbids it |
| Collateral line | Limited to children of brothers/sisters (nephews/nieces) only |

### Per Stirpes Rule (Art. 974)
Representatives collectively receive **exactly** what the represented person would have received — never more. Multiple representatives divide the line share equally among themselves.

### Capacity Requirement (Art. 973)
The representative must independently qualify to inherit from the **decedent** (not from the person they represent):
- Must be alive at decedent's death (or conceived, per Art. 1025)
- Must not be unworthy to succeed the decedent (Art. 1032)
- Must not be incapacitated with respect to the decedent (Art. 1027)
- Need NOT be capable of succeeding the person represented (Art. 976 confirms this)

---

## 2. The Four Triggers

Representation is activated when a person who would have inherited **cannot**:

### Trigger 1: Predecease (Arts. 981–982, 989–990)
Most common trigger. The person represented died before the decedent.
- Art. 981: Children of deceased inherit by right of representation.
- Art. 982: Grandchildren "and other descendants" inherit by representation — no depth limit.
- Art. 989: Same rule for descendants of a dead illegitimate child.
- Art. 990: Transmission of illegitimate children's rights confirmed.

### Trigger 2: Disinheritance (Art. 923)
A validly disinherited compulsory heir's **children and descendants** take their place.
- Descendants preserve the legitime rights of the disinherited heir.
- The disinherited parent is further barred from usufruct or administration of the inherited property.
- Engine: DISINHERITANCE trigger produces identical per-stirpes computation as PREDECEASE.

### Trigger 3: Incapacity / Unworthiness (Art. 1035)
Children/descendants of an incapacitated or unworthy heir (Art. 1027, Art. 1032) **acquire the right to the legitime**.
- Excluded parent retains no usufruct or administration.
- Art. 1035 says "right to the legitime" — but in intestate succession the entire estate distributes as if all legitime, so this distinction is moot for computation.
- Engine: INCAPACITY/UNWORTHINESS trigger → same per-stirpes computation as PREDECEASE.

### Trigger 4: Illegitimate Child's Death (Arts. 902, 989, 990)
Rights of illegitimate children transmit to their descendants "whether legitimate or illegitimate":
- Art. 902 is the transmission clause.
- Art. 989/990 confirm that descendants inherit by right of representation from the deceased grandparent.
- Engine: Works identically to PREDECEASE trigger for computation purposes.

### NON-Trigger: Renunciation (Art. 977)
"Heirs who repudiate their share may not be represented."
- Renunciation **never** triggers representation.
- The renounced share accrues to co-heirs instead (Art. 1018 for intestate).
- If the renouncing heir was the only heir at that degree, the next degree inherits in their **own right** (Art. 969), NOT by representation.

---

## 3. Renunciation Asymmetry (Arts. 976–977)

These two articles create an intentional asymmetry:

| Direction | Rule |
|---|---|
| **Upward** (renouncing FROM the represented person) | Allowed — Art. 976: "A person may represent him whose inheritance he has renounced." |
| **Downward** (renouncing FROM the decedent yourself) | Blocked — Art. 977: Your children cannot represent you in your renounced share. |

**Example**: Grandchild (GC) renounced their inheritance from Father (F). Father later predeceases Grandfather (G). GC can still represent F to inherit from G. The renunciation was from F, not from G. (Art. 976)

**Counterexample**: Child (C) renounces their inheritance from Decedent (D). C's children cannot step in to represent C. The share instead accrues to C's co-heirs. (Art. 977)

---

## 4. Collateral Line Special Rules (Arts. 972, 975)

### Collateral Representation Limit (Art. 972)
In the collateral line, representation applies **only** to children of brothers or sisters (nephews/nieces). Grand-nephews, grand-nieces, and more remote collateral relatives **cannot** represent.

### Per Stirpes vs Per Capita for Nephews/Nieces (Art. 975)
Two modes depending on whether any uncle/aunt (sibling of decedent) survives:

| Situation | Rule | Art. |
|---|---|---|
| Nephews/nieces survive **with** their uncles/aunts | Per stirpes — represent their parent | 975 ¶1 |
| Nephews/nieces survive **alone** (all siblings predeceased) | Per capita — equal shares, own right | 975 ¶2 |

**Edge case**: If some siblings survive but others are dead with only grand-nephews (not nephews) — the dead sibling's line is simply extinct; grand-nephews cannot represent.

---

## 5. Rust Data Types

### RepresentationTrigger Enum
```rust
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum RepresentationTrigger {
    Predecease,       // Arts. 981, 982 — person died before decedent
    Disinheritance,   // Art. 923 — validly disinherited
    Incapacity,       // Art. 1035 — legally incapacitated
    Unworthiness,     // Art. 1035 — found unworthy (Art. 1032)
    Renunciation,     // Art. 977 — NOT a valid trigger (stored for explanation only)
}
```

### InheritanceMode Enum
```rust
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum InheritanceMode {
    OwnRight,       // Heir inherits directly
    Representation, // Heir represents a predeceased/excluded ancestor (Art. 970)
}
```

### LineInfo Struct (internal pipeline struct, not part of wire format)
```rust
pub struct LineInfo {
    pub original_heir_id: String,           // the child-of-decedent this line traces to
    pub effective_category: EffectiveGroup, // LegitimateChildGroup or IllegitimateChildGroup
    pub mode: InheritanceMode,
    pub trigger: Option<RepresentationTrigger>, // None if OwnRight
    pub live_representatives: Vec<String>,  // heir_ids who actually receive
    pub line_share: Option<BigRational>,    // computed in distribution step
}
```

### Fields Added to HeirInput (in addition to heir-classification fields)
```rust
// In HeirInput struct:
pub represents: Option<String>,             // heir_id of the person being represented (null if OwnRight)
pub inheritance_mode: InheritanceMode,      // OwnRight | Representation
pub line_ancestor_id: Option<String>,       // heir_id of the original child-of-decedent
```

---

## 6. Algorithms

### can_be_represented(heir) → bool
```
fn can_be_represented(heir: &HeirInput) -> bool {
    // Determine trigger type
    let trigger = get_trigger(heir);

    // Art. 977: Renunciation NEVER triggers representation
    if trigger == Renunciation { return false; }

    // No trigger at all (alive and eligible)
    if trigger is None { return false; }

    // Art. 972: Ascending line — NEVER
    if heir.line_direction == Ascending { return false; }

    // Art. 972: Collateral line — only siblings of decedent (one level)
    if heir.line_type == Collateral && !heir.is_sibling_of_decedent { return false; }

    // Valid triggers: Predecease, Disinheritance, Incapacity, Unworthiness
    true
}

fn get_trigger(heir: &HeirInput) -> Option<RepresentationTrigger> {
    if heir.is_deceased                          { return Some(Predecease); }
    if heir.is_disinherited && heir.disinheritance_is_valid { return Some(Disinheritance); }
    if heir.is_unworthy && !heir.unworthiness_condoned { return Some(Unworthiness); }
    if heir.is_incapacitated                     { return Some(Incapacity); }
    if heir.has_renounced                        { return Some(Renunciation); } // blocked by caller
    None
}
```

### find_representatives(heir_id, all_heirs, decedent) → Vec<String>
```
fn find_representatives(heir_id: &str, all_heirs: &[HeirInput], decedent: &Decedent) -> Vec<String> {
    let mut reps = vec![];
    for child in direct_children_of(heir_id, all_heirs) {
        // Art. 973: representative must be capable of succeeding the DECEDENT
        if !is_capable_of_succeeding(&child, decedent) { continue; }

        if child.is_alive && is_eligible(&child) {
            reps.push(child.id.clone());
        } else if can_be_represented(&child) {
            // Recursive: child is also dead/excluded — look at their descendants
            let sub_reps = find_representatives(&child.id, all_heirs, decedent);
            reps.extend(sub_reps);
        }
        // If child is incapable of succeeding decedent and cannot be represented → skip branch
    }
    reps
}
```

### distribute_per_stirpes(line_share, representatives) → Map<heir_id, BigRational>
```
fn distribute_per_stirpes(
    line_share: BigRational,
    representatives: &[String],
) -> HashMap<String, BigRational> {
    if representatives.is_empty() { return HashMap::new(); } // vacant share

    let per_rep = line_share / BigRational::from_integer(representatives.len() as i64);
    representatives.iter().map(|id| (id.clone(), per_rep.clone())).collect()
}
```

### build_lines(decedent, all_heirs) → Vec<LineInfo>
```
fn build_lines(decedent: &Decedent, all_heirs: &[HeirInput]) -> Vec<LineInfo> {
    let mut lines = vec![];
    for child in direct_children_of_decedent(decedent, all_heirs) {
        if child.is_alive && is_eligible(&child) {
            lines.push(LineInfo {
                original_heir_id: child.id.clone(),
                effective_category: child.effective_group,
                mode: OwnRight,
                trigger: None,
                live_representatives: vec![child.id.clone()],
                line_share: None,
            });
        } else if can_be_represented(&child) {
            let reps = find_representatives(&child.id, all_heirs, decedent);
            if !reps.is_empty() {
                lines.push(LineInfo {
                    original_heir_id: child.id.clone(),
                    effective_category: child.effective_group,
                    mode: Representation,
                    trigger: Some(get_trigger(&child).unwrap()),
                    live_representatives: reps,
                    line_share: None,
                });
            }
            // else: line is extinct — no line created
        }
        // Renouncing heirs: no line created (Art. 977 / Art. 1018)
    }
    lines
}
```

### Multi-Level Representation Example (recursive)
```
// D → C1 (predeceased) → GC1 (predeceased) → GGC1 (alive)
// build_lines(D):
//   child = C1, can_be_represented(C1) = true
//   find_representatives(C1):
//     child = GC1, not alive, can_be_represented(GC1) = true
//     find_representatives(GC1):
//       child = GGC1, alive → returns [GGC1]
//     returns [GGC1]
//   line = LineInfo { original: C1, reps: [GGC1], mode: Representation }
//
// GGC1 receives C1's entire line share.
```

### Collateral Per Capita Switch (Art. 975)
```
fn build_collateral_lines(decedent, all_heirs) -> Vec<LineInfo> {
    let siblings = siblings_of(decedent, all_heirs);
    let alive_siblings: Vec<_> = siblings.iter().filter(|s| s.is_alive && is_eligible(s)).collect();
    let dead_siblings: Vec<_> = siblings.iter().filter(|s| can_be_represented(s)).collect();

    let mut lines = vec![];

    if alive_siblings.is_empty() && !dead_siblings.is_empty() {
        // Art. 975 ¶2: only nephews/nieces survive — per CAPITA
        // Collect ALL nephews/nieces, create one "line" per nephew/niece in own right
        let all_nephews: Vec<_> = dead_siblings.iter()
            .flat_map(|s| direct_children_of(&s.id, all_heirs))
            .filter(|n| n.is_alive && is_eligible(n))
            .collect();
        for nephew in all_nephews {
            lines.push(LineInfo {
                original_heir_id: nephew.id.clone(),
                mode: OwnRight, // per capita — own right, not representation
                // ...
            });
        }
    } else {
        // Art. 975 ¶1: siblings survive alongside nephews/nieces — per STIRPES
        for sibling in &alive_siblings {
            lines.push(LineInfo { mode: OwnRight, original_heir_id: sibling.id.clone(), /* ... */ });
        }
        for sibling in &dead_siblings {
            let reps = find_representatives(&sibling.id, all_heirs, decedent);
            if !reps.is_empty() {
                // Only go ONE level deep for collateral (Art. 972 — children of siblings only)
                let direct_nephews: Vec<_> = reps.iter()
                    .filter(|r| is_direct_child_of(r, &sibling.id, all_heirs))
                    .cloned().collect();
                if !direct_nephews.is_empty() {
                    lines.push(LineInfo {
                        mode: Representation,
                        original_heir_id: sibling.id.clone(),
                        live_representatives: direct_nephews,
                        // ...
                    });
                }
            }
        }
    }
    lines
}
```

---

## 7. Line Counting for Concurrence Formulas

**Critical**: Count **lines** (one per child-of-decedent), not individual representatives. This matters for:
- Art. 892: spouse's share depends on 1 line vs 2+ lines among legitimate children
- Art. 888: collective ½ legitime divided by number of legitimate lines

**Example**: Decedent had 3 children, all predeceased, all with grandchildren → **3 lines** → spouse gets equal to one line's share (Art. 892 ¶2), not ¼.

---

## 8. Pipeline Integration

### Where Representation Fits
Representation must be resolved **before** concurrence determination. Proposed pipeline placement:

```
Step 1: Classify heirs (heir-classification)
Step 2: Build lines with representation (THIS ASPECT)
    - Resolves predecease, disinheritance, incapacity, unworthiness triggers
    - Counts legitimate_lines, illegitimate_lines (used in Step 3)
Step 3: Determine scenario code (heir-concurrence)
    - Uses line counts from Step 2
Step 4: Compute legitime fractions (legitime-fractions)
    - Uses scenario code from Step 3
```

---

## 9. Key Edge Cases

### 9.1 Multi-Level (Great-Grandchildren)
`D → C1(dead) → GC1(dead) → GGC1(alive)` — GGC1 represents C1 via recursive traversal. GGC1 receives C1's full line share. (No depth limit per Arts. 970, 982.)

### 9.2 Mixed Live and Dead Representatives
`D → C1(dead) → GC1(alive) + GC2(dead) → GGC1 + GGC2(alive)`
- C1's line share is split: ½ to GC1, ½ to GC2's sub-line.
- GC2's sub-line split: ¼ to GGC1, ¼ to GGC2.
- Total C1 line = 4 parts: GC1: ½, GGC1: ¼, GGC2: ¼.

### 9.3 Representative Unworthy to Succeed Decedent (Art. 973)
GC1 is alive but unworthy to succeed D. `is_capable_of_succeeding(GC1, D)` → false. GC1 excluded from representative list. If GC1 has children and they ARE capable of succeeding D, they may represent GC1 recursively.

### 9.4 Preterition of Predeceased Heir (Art. 854 final sentence)
If C1 was preterited but predeceased D: the will is NOT annulled. C1's descendants (GC1, GC2) inherit C1's legitime by representation. Institution of other heirs remains valid.

### 9.5 Collateral: Grand-Nephew Cannot Represent
`D → (no descendants/ascendants/spouse) → Sibling S1(dead) → Nephew N1(dead) → Grand-nephew GN1(alive)`.
Art. 972 limits collateral representation to "children of brothers or sisters." N1 is a nephew, not a sibling, so GN1 cannot represent N1. S1's line is extinct. GN1 inherits nothing.

### 9.6 All Siblings Predeceased (Art. 975 Per Capita)
Only nephews/nieces remain. They inherit in **equal shares per capita**, NOT per stirpes. This is a mode switch — nephews/nieces inherit in their own right, not by representation.

### 9.7 Art. 976 Asymmetry
GC1 renounced inheritance from C1 (a different estate). C1 later predeceases D. GC1 CAN still represent C1 to inherit from D. The renunciation was from C1's estate, not D's estate. (Art. 976)

---

## 10. Test Vectors

| # | Scenario | Expected |
|---|---|---|
| R-01 | C1(alive), C2(dead, GC1+GC2 alive), intestate ₱9M | C1: ₱3M, GC1: ₱1.5M, GC2: ₱1.5M |
| R-02 | C1(dead, GC1+GC2), C2(dead, GC3+GC4+GC5), intestate ₱9M | Line C1: ₱4.5M (GC1: ₱2.25M, GC2: ₱2.25M), Line C2: ₱4.5M (GC3-5: ₱1.5M each) |
| R-03 | C1(dead)→GC1(dead)→GGC1(alive), C2(alive), intestate ₱9M | C2: ₱4.5M, GGC1: ₱4.5M |
| R-04 | C1 validly disinherited, has GC1+GC2 | Art. 923: GC1+GC2 represent C1, each gets ½ of C1's line share |
| R-05 | C1 unworthy (Art. 1032, not condoned), has GC1 | Art. 1035: GC1 acquires C1's legitime right |
| R-06 | C1 renounces, has GC1 | Art. 977: NO representation; GC1 gets nothing; share accrues to co-heirs |
| R-07 | All siblings predeceased; N1, N2, N3 (nephews) survive alone | Art. 975 ¶2: per capita — N1: ⅓, N2: ⅓, N3: ⅓ |
| R-08 | S1(alive), N1+N2 (children of dead S2) | Art. 975 ¶1: per stirpes — S1: ½, N1: ¼, N2: ¼ |
| R-09 | GN1 tries to represent dead N1 (collateral) | Art. 972: BLOCKED — not a child of a sibling; N1's line is extinct |
| R-10 | GC1 renounced from C1's estate; C1 predeceases D | Art. 976: GC1 CAN represent C1 to inherit from D |
| R-11 | 3 children all dead, each with grandchildren; spouse alive; testate | 3 lines → spouse = 1 line's share of ½ estate (Art. 892 ¶2), not ¼ |
| R-12 | GC1 unworthy to D, has GGC1 who is NOT unworthy | Art. 973: GC1 excluded; GGC1 represents GC1 (if GGC1 capable of succeeding D) |

---

## 11. Article Quick Reference

| Rule | Article |
|---|---|
| Representation defined | CC Art. 970 |
| Law calls representative, not represented | CC Art. 971 |
| Domains (descending yes, ascending no, collateral limited) | CC Art. 972 |
| Representative must be capable of succeeding decedent | CC Art. 973 |
| Per stirpes rule | CC Art. 974 |
| Collateral per capita when alone | CC Art. 975 |
| Can represent one you renounced from | CC Art. 976 |
| Renouncing heir cannot be represented | CC Art. 977 |
| Grandchildren by representation | CC Arts. 981–982 |
| Illegitimate children's rights transmit to descendants | CC Arts. 902, 990 |
| Descendants of dead illegitimate child represent | CC Art. 989 |
| Disinheritance triggers representation | CC Art. 923 |
| Incapacity/unworthiness triggers representation | CC Art. 1035 |
| Renounced share accrues to co-heirs (intestate) | CC Art. 1018 |
