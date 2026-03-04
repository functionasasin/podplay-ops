# Algorithms — Non-Trivial Computation Pseudocode

**Aspect**: algorithms
**Wave**: 3 (Engine Design)
**Depends On**: rust-types, pipeline-design, legitime-fractions, intestate-distribution,
testate-validation, collation, vacancy-resolution, multiple-disinheritance-fix

---

## Overview

This file specifies pseudocode for every non-trivial computation in the v2 engine. Each
algorithm is self-contained with defined inputs, outputs, and all edge cases called out.
These algorithms are the authoritative reference for implementing the 10-step pipeline.

Algorithms covered:
1. Hare-Niemeyer rounding (centavos)
2. Art. 895 cap rule (IC legitime in Regime A)
3. Art. 911 reduction order (inofficiousness)
4. Art. 890 ascendant distribution
5. Per stirpes distribution (representation)
6. Collateral distribution — full/half blood (Arts. 1006, 975)
7. Unit-ratio intestate distribution (I3/I4/I8/I9/I10)
8. Collation imputation (step 9 phase 2)
9. Free portion allocation (step 8)
10. Vacancy redistribution (accretion, Art. 1021)

---

## 1. Hare-Niemeyer Rounding

**Purpose**: Convert `Vec<(HeirId, BigRational)>` exact amounts (in centavos) to integer
centavos such that the total sum equals the exact estate total exactly. No centavo lost or
gained.

**Context**: Applied as the final sub-step of step 10. All intermediate computations use
`BigRational`. Only the final output allocation is converted to `i64`.

**Algorithm**:

```rust
/// Convert exact rational shares to integer centavos using Hare-Niemeyer method.
/// Guarantees: sum(result) == total_centavos exactly.
fn hare_niemeyer(
    shares: &[(HeirId, BigRational)],   // rational centavo amounts (sum = total_centavos)
    total_centavos: i64,                // exact integer total
) -> Vec<(HeirId, i64)> {
    if shares.is_empty() {
        return vec![];
    }

    // Step 1: Floor each rational to integer centavos
    let floors: Vec<(HeirId, i64, BigRational)> = shares
        .iter()
        .map(|(id, r)| {
            let floor = r.floor().to_integer().to_i64().unwrap();
            let remainder = r - BigRational::from_integer(floor.into());
            (*id, floor, remainder)
        })
        .collect();

    // Step 2: Compute deficit = total - sum(floors)
    let floor_sum: i64 = floors.iter().map(|(_, f, _)| f).sum();
    let deficit = total_centavos - floor_sum;  // always >= 0; <= shares.len()

    // Step 3: Sort by remainder descending (largest fractional part gets +1 first)
    let mut sorted = floors.clone();
    sorted.sort_by(|a, b| b.2.cmp(&a.2));

    // Step 4: Distribute deficit centavos one each to top `deficit` heirs by remainder
    let mut result_map: HashMap<HeirId, i64> = HashMap::new();
    for (i, (id, floor, _)) in sorted.iter().enumerate() {
        let bonus = if (i as i64) < deficit { 1 } else { 0 };
        result_map.insert(*id, floor + bonus);
    }

    // Step 5: Reconstruct in original order
    shares.iter().map(|(id, _)| (*id, result_map[id])).collect()
}
```

**Edge cases**:
- All heirs have zero remainder: no adjustment needed, floor_sum == total_centavos
- Tie-breaking on equal remainders: stable sort preserves input order (first heir in input
  gets the rounding bonus). Must be documented in the `RoundingAdjustment` log entry.
- Single heir: always gets 100% of total_centavos (no rounding issue)
- Heir with zero share: remains zero after rounding (not eligible for +1)
- total_centavos == 0: all floors are 0, deficit == 0, all heirs get 0

**Output**: `RoundingAdjustment` entries appended to `state.computation_log` for each heir
who received a +1 centavo bonus.

---

## 2. Art. 895 Cap Rule — IC Legitime in Regime A

**Purpose**: Compute illegitimate children's legitime amounts (individual and aggregate) in
Regime A scenarios (T4, T5a, T5b) where IC must not exceed the free portion remaining after
the spouse is satisfied.

**Key law**: Art. 895¶1 (IC = ½ × per-LC share), Art. 895¶3 (aggregate cap), FC Art. 176

```rust
/// Returns (per_ic_actual, total_ic_actual, fp_disposable, cap_applied).
fn compute_ic_cap_rule(
    e_adj: BigRational,
    n: u32,             // effective G1 lines (living + represented)
    m: u32,             // number of IC heirs
    spouse_legitime: BigRational,  // 0 if no spouse in scenario
) -> CapRuleResult {
    assert!(n > 0, "Regime A requires at least 1 G1 line");

    let fp_gross = e_adj.clone() / 2;          // always ½E in Regime A

    // Spouse is charged against FP_gross (Arts. 892, 897)
    let fp_after_spouse = fp_gross.clone() - spouse_legitime.clone();

    if m == 0 {
        // No IC: no cap computation needed
        return CapRuleResult {
            per_ic_actual: BigRational::zero(),
            total_ic_actual: BigRational::zero(),
            fp_disposable: fp_after_spouse,
            cap_applied: false,
            ic_uncapped_total: BigRational::zero(),
        };
    }

    // Art. 895¶1: IC = ½ of LC per-child share
    let per_lc = e_adj.clone() / (n * 2);       // = E / (2n)
    let per_ic_uncapped = per_lc.clone() / 2;   // = E / (4n)
    let total_ic_uncapped = per_ic_uncapped.clone() * m;

    // Art. 895¶3: IC aggregate cap = fp_after_spouse
    let cap_applied = total_ic_uncapped > fp_after_spouse;
    let total_ic_actual = if cap_applied {
        fp_after_spouse.clone()
    } else {
        total_ic_uncapped.clone()
    };

    // Proportional reduction: each IC receives same amount
    let per_ic_actual = total_ic_actual.clone() / m;
    let fp_disposable = fp_after_spouse - total_ic_actual.clone();

    CapRuleResult {
        per_ic_actual,
        total_ic_actual,
        fp_disposable,
        cap_applied,
        ic_uncapped_total: total_ic_uncapped,
    }
}
```

**Cap trigger conditions** (for documentation/narrative):

| Scenario | Cap bites when |
|----------|---------------|
| T4 (no spouse) | `m > 2n` |
| T5a (n=1, spouse=¼) | `m > 1` (always bites if ≥2 IC) |
| T5b (n≥2, spouse=1/(2n)) | `m > 2(n−1)` |

**Worked examples** (from legitime-fractions.md):
- T4, n=1, m=5, E=₱10M: per IC = ₱1M (capped at ½E ÷ 5); FP_disposable = ₱0
- T5a, n=1, m=4, E=₱10M: per IC = ₱625,000 (capped); FP_disposable = ₱0
- T5b, n=3, m=2, E=₱12M: per IC = ₱1M (no cap); FP_disposable = ₱2M

---

## 3. Art. 911 Reduction Order — Inofficiousness

**Purpose**: When testamentary dispositions (devises, legacies, donations) exceed FP_disposable,
reduce them in the order prescribed by Art. 911 until the excess is eliminated.

**Law**: Art. 911 — Reduction order (descending priority = reduced first):
1. Testamentary dispositions (devises/legacies) — reduced pro rata
2. Preferential donations inter vivos — per Art. 911¶2
3. Donations inter vivos — reduced in reverse chronological order (latest first)

```rust
/// Reduce inofficious testamentary dispositions to fit within FP_disposable.
/// Returns updated institution/devise/legacy allocations and donation reductions.
fn reduce_inofficious(
    fp_disposable: BigRational,
    devises_legacies: &mut Vec<Disposition>,   // testamentary dispositions (mutable)
    donations: &[Donation],                     // sorted by date descending
) -> InoficiousnessReduction {
    let total_dispositions: BigRational = devises_legacies.iter().map(|d| d.amount).sum();
    let excess = total_dispositions - fp_disposable.clone();

    if excess <= BigRational::zero() {
        return InoficiousnessReduction { reduced: vec![], donation_reductions: vec![] };
    }

    let mut remaining_excess = excess.clone();
    let mut reduced = vec![];

    // Phase 1: Reduce testamentary dispositions pro rata (Art. 911¶1)
    if !devises_legacies.is_empty() && remaining_excess > BigRational::zero() {
        let total_dev_leg: BigRational = devises_legacies.iter().map(|d| d.amount).sum();
        if total_dev_leg > BigRational::zero() {
            let reduction_ratio = remaining_excess.clone().min(total_dev_leg.clone()) / total_dev_leg.clone();
            for d in devises_legacies.iter_mut() {
                let reduction = d.amount.clone() * reduction_ratio.clone();
                d.amount -= reduction.clone();
                reduced.push(DispositionReduction {
                    disposition_id: d.id,
                    original: d.amount.clone() + reduction.clone(),
                    reduction: reduction.clone(),
                    new_amount: d.amount.clone(),
                    basis: Art911Phase::TestamentaryProRata,
                });
            }
            remaining_excess -= total_dev_leg.clone().min(remaining_excess.clone());
        }
    }

    // Phase 2: Reduce donations in reverse chronological order (Art. 911¶2)
    let mut donation_reductions = vec![];
    let mut sorted_donations = donations.to_vec();
    sorted_donations.sort_by(|a, b| b.date.cmp(&a.date));  // latest first

    for donation in &sorted_donations {
        if remaining_excess <= BigRational::zero() { break; }
        let reduction = donation.amount.clone().min(remaining_excess.clone());
        donation_reductions.push(DonationReduction {
            donation_id: donation.id,
            heir_id: donation.heir_id,
            original_amount: donation.amount.clone(),
            reduction,
            basis: Art911Phase::DonationReverseChronological,
        });
        remaining_excess -= reduction;
    }

    InoficiousnessReduction { reduced, donation_reductions }
}
```

**Edge cases**:
- FP_disposable = 0: ALL testamentary dispositions are inofficious; all devises/legacies
  reduced to zero, then donations reduced newest-first
- Some heirs have NO testamentary disposition (legitime-only): not affected
- A donation that was partially collatated: only the non-collatated remainder is subject to
  Art. 911 reduction (Art. 1062 interaction)
- Simultaneous-date donations: reduce pro rata among same-date donations (Art. 911 is silent;
  this is the conservative interpretation; add MANUAL_REVIEW flag)

---

## 4. Art. 890 Ascendant Distribution

**Purpose**: Divide the G2 collective amount among individual ascendant heirs.

**Law**: Art. 986 (parents exclude all higher), Art. 987 (no parents → degree proximity → by-line)

```rust
fn distribute_ascendants(
    collective: BigRational,
    ascendants: &[ClassifiedHeir],
) -> Vec<(HeirId, BigRational)> {
    // Safety: only call with eligible G2 heirs
    let eligible: Vec<_> = ascendants.iter().filter(|a| a.is_eligible).collect();
    assert!(!eligible.is_empty(), "distribute_ascendants called with no eligible ascendants");

    // Tier 1 (Art. 986¶1): parents (degree == 1) exclude all higher ascendants
    let parents: Vec<_> = eligible.iter().filter(|a| a.degree == 1).collect();
    if !parents.is_empty() {
        return divide_equally(&parents, collective);
        // → both parents alive: ¼ each (½E × ½)
        // → one parent: ½E to survivor
    }

    // Tier 2 (Art. 987¶1): no parents → nearest degree takes all
    let min_degree = eligible.iter().map(|a| a.degree).min().unwrap();
    let nearest: Vec<_> = eligible.iter().filter(|a| a.degree == min_degree).collect();

    // Tier 3 (Art. 987¶2): if only one line at nearest degree, all to that line
    let paternal: Vec<_> = nearest.iter().filter(|a| a.line == Line::Paternal).collect();
    let maternal: Vec<_> = nearest.iter().filter(|a| a.line == Line::Maternal).collect();

    match (paternal.is_empty(), maternal.is_empty()) {
        (false, false) => {
            // Both lines at same degree: ½ to paternal line, ½ to maternal line (Art. 987¶2)
            // Then per capita within each line
            let mut result = divide_equally(&paternal, collective.clone() / 2);
            result.extend(divide_equally(&maternal, collective / 2));
            result
        }
        (false, true) => divide_equally(&paternal, collective),
        (true, false)  => divide_equally(&maternal, collective),
        (true, true)   => unreachable!("no nearest ascendants found"),
    }
}

fn divide_equally(heirs: &[&&ClassifiedHeir], amount: BigRational) -> Vec<(HeirId, BigRational)> {
    let n = heirs.len() as u32;
    heirs.iter().map(|h| (h.id, amount.clone() / n)).collect()
}
```

**Edge cases**:
- Both parents alive (most common G2 case): each gets `collective / 2`
- One parent predeceased (and they have NO eligible children — otherwise G1 would activate):
  surviving parent gets all `collective`
- Paternal grandfather + maternal great-grandmother (degree 2 vs degree 3):
  paternal grandfather wins (Art. 987¶1 nearer degree), gets entire `collective`
- Only maternal grandparents (degree 2, one line): they get `collective` per capita

---

## 5. Per Stirpes Distribution — Representation

**Purpose**: When heirs represent a predeceased/disinherited/unworthy heir, distribute
that heir's SLOT equally among the representatives.

**Law**: Art. 974 (representation in equal portions), Art. 975 (per capita between nephews)

```rust
/// Compute individual allocations for representatives within a slot.
/// `slot_amount` = the share that would have gone to the represented heir.
/// Returns a list of (representative_id, amount).
fn distribute_per_stirpes(
    slot_amount: BigRational,
    representatives: &[ClassifiedHeir],
) -> Vec<(HeirId, BigRational)> {
    // Representatives within one branch split the slot EQUALLY (Art. 974)
    // regardless of how many levels deep the representation goes
    let n = representatives.len() as u32;
    assert!(n > 0, "per_stirpes requires at least 1 representative");
    representatives.iter().map(|r| (r.id, slot_amount.clone() / n)).collect()
}

/// Art. 975: Between DIFFERENT represented lines (e.g., 2 predeceased siblings,
/// each with nephews), each LINE gets the line's slot, then per capita within line.
/// This is effectively per stirpes at the sibling level.
fn distribute_per_stirpes_multi_line(
    estate_slot: BigRational,           // total to distribute among all lines
    lines: &[(HeirId, Vec<HeirId>)],    // (represented_heir_id, [representative_ids])
) -> Vec<(HeirId, BigRational)> {
    let n_lines = lines.len() as u32;
    let per_line = estate_slot / n_lines;
    let mut result = vec![];
    for (_, reps) in lines {
        let per_rep = per_line.clone() / reps.len() as u32;
        for rep_id in reps {
            result.push((*rep_id, per_rep.clone()));
        }
    }
    result
}
```

**Key distinction** (from `representation.md`):
- **Within a branch** (multiple grandchildren representing ONE predeceased child): per stirpes —
  they split the one child's slot equally
- **Between branches** (Art. 975 per capita for nephews inheriting on their own — not by
  representation): each nephew gets an equal independent share
  - This only applies when ALL direct heirs (e.g., all children) are dead/ineligible and nephews
    represent them; then each nephew-LINE gets the parent's slot

**Collateral representation limit**: Art. 972 — representation in collateral line only goes
down to nephews/nieces. Grand-nephews do NOT represent. If a nephew predeceases without
eligible children, their slot is vacated (accretion / intestate fallback applies).

---

## 6. Collateral Distribution — Full/Half Blood

**Purpose**: Distribute intestate estate among siblings, nephews/nieces, and cousins using
the full-blood / half-blood ratio (Art. 1006) and the proximity rule (Art. 962).

**Law**: Art. 1006 (full blood = 2 × half blood), Art. 975 (nephews per capita / per stirpes),
Art. 1008 (full/half blood applies to nephews too), Art. 1004 (siblings only → equal shares)

```rust
fn distribute_collaterals(
    amount: BigRational,
    collaterals: &[ClassifiedHeir],    // only eligible collaterals
) -> Vec<(HeirId, BigRational)> {
    // Step 1: Find nearest degree among all eligible collaterals
    let min_degree = collaterals.iter().map(|c| c.degree).min().unwrap();
    let nearest: Vec<_> = collaterals.iter().filter(|c| c.degree == min_degree).collect();

    // Step 2: Check if all same degree are siblings (degree == 2)
    if min_degree == 2 {
        // Siblings (full + half blood)
        return distribute_with_blood_ratio(&nearest, amount);
    }

    // Step 3: Degree 3 — nephews/nieces
    // Art. 975: nephews represent predeceased siblings → per stirpes (each line gets sibling's share)
    // vs Art. 975 ¶2: all siblings dead, nephews alone → per capita (equal shares, subject to blood)
    if min_degree == 3 {
        let siblings_survived = collaterals.iter().any(|c| c.degree == 2 && c.is_eligible);
        if siblings_survived {
            // Nephews represent deceased siblings: per stirpes
            return distribute_nephews_per_stirpes(&nearest, amount, collaterals);
        } else {
            // No siblings survived: nephews inherit per capita with blood ratio
            return distribute_with_blood_ratio(&nearest, amount);
        }
    }

    // Step 4: Degree 4 (first cousins) and beyond — per capita, no blood ratio beyond
    // degree 3 (Art. 1008 only mentions brothers' children)
    distribute_per_capita(&nearest, amount)
}

fn distribute_with_blood_ratio(
    heirs: &[&ClassifiedHeir],
    amount: BigRational,
) -> Vec<(HeirId, BigRational)> {
    // Art. 1006: full blood = 2 units, half blood = 1 unit
    let total_units: u32 = heirs.iter().map(|h| {
        if h.blood_type == BloodType::Full { 2 } else { 1 }
    }).sum();
    let per_unit = amount / total_units;
    heirs.iter().map(|h| {
        let units = if h.blood_type == BloodType::Full { 2 } else { 1 };
        (h.id, per_unit.clone() * units)
    }).collect()
}

fn distribute_nephews_per_stirpes(
    nephews: &[&ClassifiedHeir],
    amount: BigRational,
    all_collaterals: &[ClassifiedHeir],
) -> Vec<(HeirId, BigRational)> {
    // Group nephews by their represented sibling
    let mut by_sibling: HashMap<HeirId, (BloodType, Vec<&ClassifiedHeir>)> = HashMap::new();
    for nephew in nephews {
        let sibling_id = nephew.represents_heir_id.unwrap();
        let sibling = all_collaterals.iter().find(|c| c.id == sibling_id).unwrap();
        by_sibling.entry(sibling_id)
            .or_insert((sibling.blood_type, vec![]))
            .1.push(nephew);
    }

    // Compute sibling slots with blood ratio
    let siblings: Vec<_> = by_sibling.keys()
        .map(|id| all_collaterals.iter().find(|c| c.id == *id).unwrap())
        .collect();
    let sibling_amounts = distribute_with_blood_ratio(&siblings, amount);

    // Within each sibling's slot: divide equally among that sibling's nephews
    let mut result = vec![];
    for (sibling_id, sibling_amount) in &sibling_amounts {
        let (_, nephews_of_sibling) = &by_sibling[sibling_id];
        let per_nephew = sibling_amount.clone() / nephews_of_sibling.len() as u32;
        for n in nephews_of_sibling {
            result.push((n.id, per_nephew.clone()));
        }
    }
    result
}
```

**Edge cases**:
- Art. 1001 (spouse + siblings concurrence): Art. 1001 exception — collaterals CAN concur
  with the spouse in intestate. The intestate scenario codes I12 handles this: spouse gets ½,
  collaterals get ½ (with full/half blood ratio applied within ½)
- All full blood: standard equal distribution
- All half blood: standard equal distribution (ratio only matters when mixed)
- Only one sibling: gets entire amount regardless of blood type

---

## 7. Unit-Ratio Intestate Distribution

**Purpose**: Compute intestate shares using the 2:1 (LC:IC) unit ratio for scenarios I3, I4,
I8, I9, I10.

**Law**: Art. 983 (2:1 ratio), Art. 999 (spouse = equal to LC), FC Art. 176

```rust
struct UnitSpec {
    heir_id: HeirId,
    units: u32,  // 2 for LC/spouse, 1 for IC
}

fn distribute_by_units(
    amount: BigRational,
    unit_specs: &[UnitSpec],
) -> Vec<(HeirId, BigRational)> {
    let total_units: u32 = unit_specs.iter().map(|s| s.units).sum();
    let per_unit = amount / total_units;
    unit_specs.iter().map(|s| (s.heir_id, per_unit.clone() * s.units)).collect()
}

fn build_unit_specs(
    scenario: ScenarioCode,
    heirs: &[ClassifiedHeir],
) -> Vec<UnitSpec> {
    match scenario {
        I3 => heirs.iter().map(|h| UnitSpec {
            heir_id: h.id,
            units: if h.heir_group == G1 { 2 } else { 1 },  // G4 = 1 unit
        }).collect(),

        I4 => heirs.iter().map(|h| UnitSpec {
            heir_id: h.id,
            units: match h.heir_group {
                G1 | G3 => 2,   // LC and spouse equal (Art. 999)
                G4 => 1,        // IC = 1 unit
                _ => unreachable!(),
            },
        }).collect(),

        I8 => {
            // Spouse = ½ fixed; IC split remaining ½ equally (Art. 997)
            // Implement as: spouse slot first, then IC split remainder
            // Alternatively: spouse = 2 units, each IC = 1 unit if n_IC==1 gives 2:1
            // Use direct formula: spouse_share = E/2, ic_share = (E/2) / m
            // NOTE: Do NOT use unit ratio for I8 — use explicit formula
            heirs.iter().map(|h| UnitSpec {
                heir_id: h.id,
                units: if h.heir_group == G3 { 2 } else { 1 },
            }).collect()
            // This gives spouse = E * 2/(m+2), NOT E/2. Adjust below.
        }

        I9 | I10 => {
            // These use explicit fraction formulas (not unit ratio)
            // I9: ascendants ½, IC ½ (Art. 989/990)
            // I10: ascendants ½, IC ¼, spouse ¼ (Art. 1000)
            // Build directly from fractions
            todo!("Use explicit formulas for I9/I10 — see intestate-distribution.md")
        }

        _ => unreachable!("Unit ratio only applies to I3, I4"),
    }
}
```

**Important**: I8/I9/I10 use explicit fraction formulas, not a unit ratio. Only I3 and I4
truly use the 2:1 unit ratio. The engine must use direct formulas for the others:

```
I8:  spouse = E/2,  each_IC = (E/2) / m
I9:  asc = E/2,     each_IC = (E/2) / m
I10: asc = E/2,     IC = E/4 (total, ÷m per IC),  spouse = E/4
```

**No cap in intestate**: The 2:1 ratio is the IC's full intestate entitlement. Art. 895¶3
cap does NOT apply to intestate scenarios.

---

## 8. Collation Imputation (Step 9, Phase 2)

**Purpose**: Deduct collatable donations from each heir's distribution share. The heir
receives `gross_share − collatated_amount` from the estate, having already received the
donation during the decedent's lifetime.

**Law**: Arts. 909–910 (imputation), Arts. 1073–1077 (partition)

```rust
fn apply_collation_imputation(
    heir_distributions: &mut Vec<HeirDistribution>,
    collation_result: &CollationResult,
    legitime_result: &LegitimeResult,
) -> Vec<ImputationEntry> {
    let mut imputation_log = vec![];

    for classification in &collation_result.donations {
        if !classification.is_collatable { continue; }

        let heir_dist = heir_distributions.iter_mut()
            .find(|d| d.heir_id == classification.donation.heir_id)
            .expect("heir in donation must exist in distributions");

        let donation_val = classification.donation.valuation_at_donation.clone();

        // Art. 909: donations to compulsory heirs → imputed against legitime first,
        //           then against FP portion if donation exceeds legitime
        let heir_legitime = legitime_result.per_heir
            .iter()
            .find(|e| e.heir_id == heir_dist.heir_id)
            .map(|e| e.legitime.clone())
            .unwrap_or(BigRational::zero());

        let imputed_to_legitime = donation_val.clone().min(heir_legitime.clone());
        let imputed_to_fp = (donation_val.clone() - imputed_to_legitime.clone())
            .max(BigRational::zero());

        // Reduce heir's gross_share by full donation value
        // (if donation > gross_share, heir owes no additional; Art. 1073 partition handles excess)
        let deduction = donation_val.clone().min(heir_dist.gross_share.clone());
        heir_dist.gross_share -= deduction.clone();
        heir_dist.collation_deduction = Some(CollationDeduction {
            donation_id: classification.donation.id,
            donation_amount: donation_val.clone(),
            imputed_to_legitime,
            imputed_to_fp,
            actual_deduction: deduction.clone(),
        });

        imputation_log.push(ImputationEntry {
            heir_id: heir_dist.heir_id,
            donation_id: classification.donation.id,
            donation_amount: donation_val,
            deduction,
        });
    }

    imputation_log
}
```

**Art. 1064 — Representation collation**:
When an heir died before the decedent and is represented by their children, the collatable
donations made to the predeceased heir are collated by the representatives proportionally
to their share of the represented slot:

```rust
fn collate_by_representation(
    representatives: &[ClassifiedHeir],
    donation_to_represented: BigRational,
    represented_slot: BigRational,
    total_slot: BigRational,
) -> Vec<(HeirId, BigRational)> {
    // Each representative collates (their_share / total_slot) × donation_amount
    representatives.iter().map(|r| {
        let rep_fraction = r.slot_share.clone() / total_slot.clone();
        let rep_collation = rep_fraction * donation_to_represented.clone();
        (r.id, rep_collation)
    }).collect()
}
```

---

## 9. Free Portion Allocation (Step 8)

**Purpose**: Assign testamentary dispositions (institutions, devises, legacies) up to
FP_disposable. Apply inofficiousness reduction if total exceeds FP_disposable.

**Law**: Art. 914 (free disposal), Art. 907 (fraction institution ≤ 1), Art. 911 (reduction)

```rust
fn allocate_free_portion(
    fp_disposable: BigRational,
    will: &WillInput,
    legitime_per_heir: &HashMap<HeirId, BigRational>,
) -> FreePortionAllocation {
    // Step 1: Compute will dispositions total
    let mut institutions: Vec<Disposition> = will.institutions.iter().map(|inst| {
        Disposition {
            id: inst.id,
            heir_id: inst.heir_id,
            amount: match inst.amount {
                Amount::Fraction(f) => fp_disposable.clone() * f,  // apply fraction to FP
                Amount::Fixed(c)    => BigRational::from(c),
            },
            disposition_type: DispositionType::Institution,
        }
    }).collect();

    let mut devises_legacies: Vec<Disposition> = will.devises.iter().chain(will.legacies.iter())
        .map(|d| Disposition {
            id: d.id,
            heir_id: d.heir_id,
            amount: BigRational::from(d.amount.centavos),
            disposition_type: DispositionType::DeviseLegacy,
        })
        .collect();

    // Step 2: Check total (institutions + devises + legacies) vs FP_disposable
    let total_dispositions: BigRational = institutions.iter()
        .chain(devises_legacies.iter())
        .map(|d| d.amount.clone())
        .sum();

    let mut inofficiousness_reduction = None;
    let mut warnings = vec![];

    if total_dispositions > fp_disposable {
        warnings.push(ValidationWarning::InoficiousDisposition {
            excess: total_dispositions.clone() - fp_disposable.clone(),
        });

        // Apply Art. 911 reduction
        let reduction = reduce_inofficious(
            fp_disposable.clone(),
            &mut devises_legacies,  // reduced first (pro rata)
            &will.donations,        // then donations (reverse chrono)
        );
        inofficiousness_reduction = Some(reduction);
    }

    // Step 3: Assign residual FP (testator's "residue clause" or FP not explicitly willed)
    let assigned: BigRational = institutions.iter()
        .chain(devises_legacies.iter())
        .map(|d| d.amount.clone())
        .sum();
    let residual_fp = fp_disposable.clone() - assigned.clone();

    FreePortionAllocation {
        fp_disposable,
        institutions,
        devises_legacies,
        residual_fp,           // goes to heirs via step 9 distribute
        inofficiousness_reduction,
        warnings,
    }
}
```

---

## 10. Vacancy Redistribution — Accretion (Art. 1021)

**Purpose**: When a share becomes vacant (heir predeceases/repudiates without representation
or substitution), redistribute it per Art. 1021's two-paragraph distinction.

**Law**:
- Art. 1021¶1: Vacant **FP share** → accretion (add pro indiviso to remaining heirs in same class)
- Art. 1021¶2: Vacant **legitime share** → does NOT go by accretion; triggers scenario recompute
  (the system must restart from step 4 without that heir in the heir set)

```rust
fn resolve_vacant_share(
    vacant: &VacantShare,
    heirs: &[ClassifiedHeir],
    fp_allocation: &FreePortionAllocation,
    state: &mut PipelineState,
) -> StepResult {
    match vacant.share_source {
        ShareSource::FreePortion => {
            // Art. 1021¶1: accretion — add pro indiviso to remaining FP heirs
            let fp_heirs: Vec<_> = heirs.iter()
                .filter(|h| h.is_eligible && h.id != vacant.heir_id)
                .filter(|h| /* has FP allocation */ fp_allocation.has_heir(h.id))
                .collect();

            if fp_heirs.is_empty() {
                // No one to accrete to → intestate fallback
                return redistribute_intestate(vacant.amount.clone(), state);
            }

            // Art. 1017 "equal shares" + Art. 1019 proportionality:
            // Divide equally among heirs with FP allocations in same will/class
            let per_heir = vacant.amount.clone() / fp_heirs.len() as u32;
            for heir in &fp_heirs {
                state.add_to_distribution(heir.id, per_heir.clone());
            }
            StepResult::Continue
        }

        ShareSource::Legitime => {
            // Art. 1021¶2: vacant legitime does NOT go by accretion
            // Must restart from step 4 to recompute scenario with heir removed
            StepResult::Restart {
                from_step: 4,
                trigger: RestartTrigger::LegitimeVacancy { vacant_heir_id: vacant.heir_id },
            }
        }
    }
}
```

**Art. 1017 "equal portions" clarification**: Art. 1017 says vacant share is divided "in
equal portions." This does NOT block accretion — it specifies HOW accretion is divided (equally,
not proportionally to existing shares). Art. 1019 applies proportionality only when the accreting
heirs have unequal pre-existing portions; in testate accretion, Art. 1017 controls (equal).

---

## 11. Algorithm Interaction Matrix

The following shows which algorithms call each other:

```
step6_compute_legitimes
  ├── compute_ic_cap_rule           (Art. 895, Regime A only)
  ├── distribute_ascendants         (Art. 890, Regime B)
  └── (fraction lookup from table)  (all scenarios)

step8_allocate_free_portion
  ├── allocate_free_portion         (§9 above)
  └── reduce_inofficious            (Art. 911, if excess)

step9_distribute
  ├── distribute_per_stirpes        (represented heirs)
  ├── distribute_with_blood_ratio   (collaterals)
  ├── distribute_by_units           (I3/I4)
  └── apply_collation_imputation    (§8 above)

step10_resolve_vacancies_and_round
  ├── resolve_vacant_share          (§10 above)
  └── hare_niemeyer                 (§1 above, FINAL SUB-STEP)
```

---

## 12. BigRational Arithmetic Conventions

All monetary computations use `num_rational::BigRational` internally:

```rust
use num_rational::BigRational;
use num_bigint::BigInt;
use num_traits::{Zero, One, ToPrimitive};

/// Convert i64 centavos to BigRational
fn cents_to_rational(c: i64) -> BigRational {
    BigRational::new(BigInt::from(c), BigInt::one())
}

/// Convert BigRational to i64 centavos (floor, before Hare-Niemeyer)
fn rational_to_cents_floor(r: &BigRational) -> i64 {
    r.floor().to_integer().to_i64()
        .expect("centavo amount fits in i64")
}
```

**Precision rule**: No intermediate rounding. All intermediate amounts stay as exact
`BigRational` fractions. The only conversion to `i64` is at the very end of step 10
via `hare_niemeyer()`.

**Negative values**: A gross_share can become negative if collation deductions exceed the
heir's computed allocation (Arts. 1073–1077 partition). In this case, the heir owes the
estate (collation debt). The engine does NOT set floor to 0; it reports the negative as
a `CollationDebt` warning and flags for MANUAL_REVIEW. The final output clamps negative
centavo values to 0 and reports the debt amount separately.

---

## 13. Edge Case Summary Table

| Edge Case | Algorithm | Handling |
|-----------|-----------|---------|
| IC = 0 (no illegitimate children) | Cap rule | Skip cap; per_ic = 0 |
| FP_disposable = 0 | Art. 911 reduction | All devises/legacies reduced to 0 |
| All heirs renounce | Vacancy | All → State (escheat, Art. 1011) |
| Single heir gets entire estate | Hare-Niemeyer | floor + deficit; no tie-break issue |
| Collation debt > gross_share | Imputation | Clamp to 0; emit CollationDebt warning |
| Nephews alone (no surviving siblings) | Collateral | Per capita with blood ratio |
| Mixed same-date donations, Art. 911 | Reduction | Pro rata among same-date; MANUAL_REVIEW |
| Both lines, same ascendant degree | Art. 890 | ½ paternal + ½ maternal, per capita within |
| Representative renounces | Representation | Art. 977: representation blocked; vacates |
| T12 articulo mortis | Legitime | Spouse gets ⅓ instead of ½; check 3-month rule |

---

## 14. Article Quick Reference

| Algorithm | Articles |
|-----------|---------|
| Hare-Niemeyer rounding | (custom method; no Civil Code article) |
| IC cap rule | Arts. 895¶1, 895¶3, FC Art. 176 |
| Art. 911 reduction | Art. 911 |
| Ascendant distribution | Arts. 890, 986, 987 |
| Per stirpes | Arts. 974, 975 |
| Collateral / blood ratio | Arts. 1004, 1006, 1008 |
| Unit ratio intestate | Arts. 983, 995, 999 |
| Collation imputation | Arts. 909–910, 1064, 1073–1077 |
| Free portion allocation | Arts. 907, 914, 911 |
| Vacancy / accretion | Arts. 1015–1023 |
