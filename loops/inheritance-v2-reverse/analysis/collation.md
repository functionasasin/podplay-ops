# Collation — Arts. 1061-1077

**Aspect**: collation
**Wave**: 2 (Domain Rule Extraction)
**Primary Legal Basis**: Arts. 1061-1077, 908-912
**Depends On**: legitime-fractions, heir-concurrence, intestate-distribution

---

## Overview

**Collation** ensures equality among compulsory heirs by requiring them to "bring back" inter vivos donations (lifetime gifts) into the hereditary mass. Two distinct functions:

1. **Mathematical addition** (Art. 908 ¶2): Add collatable donation values to the net estate to produce the collation-adjusted estate `E_adj` used for all legitime/share computations.
2. **Imputation/charging** (Arts. 909-910, 1073): Deduct the donation value from the donee-heir's share, so they receive only the difference from the actual estate.

---

## Rule 1: Who Must Collate (Art. 1061)

All four conditions must hold:

```
fn must_collate(heir, co_heirs, donation) -> bool {
    heir.is_compulsory
    && co_heirs.any(h => h.is_compulsory && h.id != heir.id)  // "with other compulsory heirs"
    && donation.is_gratuitous
    && !donation.expressly_exempt                              // Art. 1062
    && !(heir.has_repudiated && !donation.is_inofficious)     // Art. 1062 ¶2
}
```

### Art. 1062 Exemptions

| Exemption | Condition | Exception |
|-----------|-----------|-----------|
| Donor's express exemption | Donor expressly provided no collation | If inofficious, still reduced |
| Repudiation of inheritance | Donee repudiated inheritance | If inofficious, still reduced |

**Important**: Art. 1062 exempts from collation accounting but NOT from inofficiousness reduction. An exempt donation can still impair co-heirs' legitimes and must be reduced.

### Art. 1065: Ascending Line

Parents do NOT collate donations that the decedent-grandparent gave to the parents' children (grandchildren). The grandchildren would collate under Art. 1064 if inheriting by representation.

### Art. 1066: Spouse Donations

- Donation to child's spouse only → NOT collatable (Art. 1066 ¶1)
- Joint donation to child AND spouse → child collates **½** only (Art. 1066 ¶2)

---

## Rule 2: What Is Collatable

### Collatable (Default)

| Category | Article |
|----------|---------|
| Inter vivos donations to compulsory heirs | 1061 |
| Any other gratuitous transfer | 1061 |
| Debt payments on behalf of child | 1069 |
| Election expenses | 1069 |
| Fines paid on behalf of child | 1069 |
| "Similar expenses" (catch-all) | 1069 |
| Professional career expenses (if parent required OR impairs legitime) | 1068 |
| Joint donation to child+spouse — child's ½ | 1066 ¶2 |
| Donations to strangers → charged to FP (not heir) | 909 ¶2 |

### Not Collatable (Exempt)

| Category | Article |
|----------|---------|
| Support (food, clothing, shelter) | 1067 |
| Education (basic) | 1067 |
| Medical attendance (even extraordinary) | 1067 |
| Apprenticeship, ordinary equipment | 1067 |
| Customary gifts (birthday, holiday) | 1067 |
| Property left by will (default) | 1063 |
| Donations to child's spouse (not joint) | 1066 ¶1 |
| Donations grandparent→grandchild (for parent's obligation) | 1065 |
| Professional career expenses (default, no directive, doesn't impair) | 1068 |
| Wedding gifts ≤ 1/10 FP_disposable | 1070 |

### Art. 1068: Professional Expenses — Conditional

```
fn professional_expense_collatable_amount(
    expense: Amount,
    parent_expressly_required: bool,
    impairs_legitime: bool,
    imputed_home_savings: Amount  // what child would have spent living at home
) -> Option<Amount> {
    if !parent_expressly_required && !impairs_legitime {
        return None  // Not collatable
    }
    let net = expense - imputed_home_savings;
    Some(max(0, net))
}
```

Note: `imputed_home_savings` is user-provided input; the engine does not compute it.

### Art. 1070: Wedding Gifts Special Threshold

Wedding gifts (jewelry, clothing, outfit) from parents/ascendants:
- NOT collatable per se
- Reducible as inofficious ONLY if they exceed **1/10 of FP_disposable**
- Only the excess over 1/10 is reducible

```
fn wedding_gift_inofficious_amount(gift_value: Amount, fp_disposable: Amount) -> Amount {
    let threshold = fp_disposable / 10;
    max(0, gift_value - threshold)
}
```

**Circular dependency resolution**: Wedding gifts are NOT added to E_adj (they're not collatable). Compute FP_disposable on the non-wedding-gift estate base, then check the 1/10 threshold.

---

## Rule 3: Valuation — Time of Donation (Art. 1071)

**Always use value at the time of the donation.** Never current/death-time value.

- Property worth ₱1M at donation, ₱5M at death → collate at **₱1M**
- Property destroyed after donation → still collated at **donation-time value**
- Appreciation, depreciation, total loss → donee's risk/benefit

```
fn collation_value(donation: &Donation) -> Amount {
    donation.value_at_time_of_donation  // Art. 1071: always this, never current_value
}
```

### Art. 1075: Fruits and Interest

Pre-death fruits/interest belong to the donee. Only post-death fruits/interest pertain to the estate. This is a partition-phase concern; the computation engine does not track it.

---

## Rule 4: Collation-Adjusted Estate (Art. 908)

```
E_adj = net_estate_at_death + sum(collatable_value(d) for d in collatable_donations)
```

`E_adj` is used for ALL subsequent computations:
- All legitime fractions applied to `E_adj`
- All intestate shares computed on `E_adj`
- FP_gross and FP_disposable computed on `E_adj`

The actual `net_estate_at_death` is only used at final partition to determine cash/property available.

### Joint Donation Splitting (Art. 1072)

When both parents donated jointly, only **½** is collated in each parent's estate. Engine processes one decedent at a time:

```
fn collatable_value_in_this_estate(donation: &Donation) -> Amount {
    if donation.is_joint_from_both_parents {
        donation.value_at_time_of_donation / 2  // Art. 1072
    } else {
        donation.value_at_time_of_donation
    }
}
```

---

## Rule 5: Imputation Against Heir Shares (Arts. 909-910)

### Three Charging Rules

| Donation To | Charged Against | Article |
|-------------|----------------|---------|
| Legitimate child | Child's legitime | 909 ¶1 |
| Illegitimate child | Child's legitime | 910 |
| Stranger (non-compulsory heir) | Free portion | 909 ¶2 |

### Child Donation Imputation Algorithm

```
fn impute_donation_to_child(
    gross_entitlement: Amount,  // legitime or intestate share on E_adj
    donation_total: Amount,
    fp_disposable: Amount
) -> ImputationResult {
    if donation_total <= gross_entitlement {
        ImputationResult {
            charged_to_legitime: donation_total,
            charged_to_fp: 0,
            net_from_estate: gross_entitlement - donation_total,
            is_inofficious: false,
            inofficious_amount: 0,
        }
    } else {
        let excess = donation_total - gross_entitlement;
        if excess <= fp_disposable {
            ImputationResult {
                charged_to_legitime: gross_entitlement,
                charged_to_fp: excess,
                net_from_estate: 0,
                is_inofficious: false,
                inofficious_amount: 0,
            }
        } else {
            ImputationResult {
                charged_to_legitime: gross_entitlement,
                charged_to_fp: fp_disposable,
                net_from_estate: 0,
                is_inofficious: true,
                inofficious_amount: excess - fp_disposable,
            }
        }
    }
}
```

### Donation to Stranger

```
fn impute_stranger_donation(donation: Amount, fp_disposable: Amount) -> ImputationResult {
    if donation <= fp_disposable {
        ImputationResult { charged_to_fp: donation, is_inofficious: false, inofficious_amount: 0 }
    } else {
        ImputationResult {
            charged_to_fp: fp_disposable,
            is_inofficious: true,
            inofficious_amount: donation - fp_disposable,
        }
    }
}
```

---

## Rule 6: Donation Exceeds Share — Inofficiousness Reduction (Art. 911)

When total FP consumption (heir excesses + stranger donations + testamentary dispositions) exceeds FP_disposable, the excess is inofficious. Reduction order per Art. 911:

1. **Phase 1a**: Non-preferred legacies/devises pro rata
2. **Phase 1b**: Preferred legacies/devises pro rata
3. **Phase 2**: Voluntary institutions pro rata
4. **Phase 3**: Donations in **reverse chronological order** (most recent first)

```
fn reduce_donations_reverse_chrono(excess: Amount, donations: &mut [Donation]) -> Vec<DonationReduction> {
    donations.sort_by(|a, b| b.date.cmp(&a.date));  // Most recent first
    let mut remaining = excess;
    let mut reductions = vec![];
    for d in donations.iter() {
        if remaining <= 0 { break; }
        let reduction = min(d.value_at_time_of_donation, remaining);
        reductions.push(DonationReduction {
            donation_id: d.id,
            original_value: d.value_at_time_of_donation,
            reduced_by: reduction,
            remaining_value: d.value_at_time_of_donation - reduction,
            return_required: reduction,
        });
        remaining -= reduction;
    }
    reductions
}
```

---

## Rule 7: Collation by Representation (Art. 1064)

Grandchildren inheriting by representation of a predeceased parent must collate the **parent's** donations, even if they never received the property.

```
fn collation_for_representatives(
    represented_heir: &Heir,         // predeceased parent
    representatives: &[Heir],        // grandchildren
    parent_donations: &[Donation],
    line_share: Amount,              // line's total entitlement on E_adj
) -> RepresentativeCollation {
    let parent_donation_total = parent_donations.iter()
        .map(|d| d.value_at_time_of_donation).sum();
    let net_line_share = line_share - parent_donation_total;
    if net_line_share >= 0 {
        RepresentativeCollation {
            net_from_estate: net_line_share,
            per_representative: net_line_share / representatives.len(),
            owes_estate: false,
        }
    } else {
        RepresentativeCollation {
            net_from_estate: 0,
            per_representative: 0,
            owes_estate: true,
            excess: -net_line_share,  // Parent's donation exceeded line's entitlement
        }
    }
}
```

**Key rule**: Grandchildren collate even though they never received the donated property. If parent spent/sold the donation, the grandchildren still bear the collation obligation.

---

## Rule 8: Partition Mechanics (Arts. 1073-1074)

From the computation engine's perspective, per-heir output is:

```
struct PartitionAllocation {
    heir_id: HeirId,
    total_entitlement: Amount,       // Computed on E_adj
    already_received: Amount,        // Sum of collatable donations at donation-time value
    from_actual_estate: Amount,      // max(0, total_entitlement - already_received)
    partition_note: Option<String>,  // Art. 1074 flags (cash equivalent needed, etc.)
}
```

In-kind partition decisions (which specific properties go to whom) are downstream of engine computation. The engine produces peso amounts only.

### Art. 1076: Reimbursement

Co-heirs reimburse donee for necessary preservation expenses; donee collating an immovable in-kind is reimbursed for improvements existing at partition time. Engine flags these scenarios but does not compute amounts (requires appraisal data).

---

## Rule 9: Intestate Collation

Art. 1061 applies to both testate and intestate succession. In intestate:
- No "free portion" concept
- E_adj used to compute intestate shares
- Donations imputed against each heir's intestate share
- Excess over share → inofficious → must be returned

```
fn collate_intestate(net_estate: Amount, donations: &[Donation], heirs: &[Heir]) -> IntestateCollationResult {
    let collatable = donations.iter().filter(|d| is_collatable(d, heirs));
    let e_adj = net_estate + collatable.map(|d| collatable_value_in_this_estate(d)).sum();

    let shares = compute_intestate_shares(e_adj, heirs);  // Per scenario

    for heir in heirs {
        let donated = collatable.filter(|d| d.recipient_heir_id == Some(heir.id))
            .map(|d| collatable_value_in_this_estate(d)).sum();
        shares[heir.id].from_estate = max(0, shares[heir.id].total - donated);
        if donated > shares[heir.id].total {
            shares[heir.id].excess = donated - shares[heir.id].total;
            // Mark as inofficious
        }
    }

    // Invariant: sum(from_estate) <= net_estate
    assert!(shares.values().map(|s| s.from_estate).sum() <= net_estate);
    shares
}
```

---

## Rule 10: Art. 1077 — Disputes Don't Block Partition

If collation obligation is disputed, the engine should:
1. Flag the donation as disputed
2. Compute distribution both ways (with and without collation)
3. Note that partition proceeds with adequate security

```
struct CollationDispute {
    donation_id: DonationId,
    reason: String,
    with_collation: Amount,       // Per-heir amounts if collated
    without_collation: Amount,    // Per-heir amounts if not collated
    security_required: Amount,    // Difference between the two scenarios
}
```

---

## 14-Category Collatability Matrix

| # | Category | Collatable? | Article | Notes |
|---|----------|-------------|---------|-------|
| 1 | Inter vivos donation to compulsory heir | Yes | 1061 | Default |
| 2 | Donation expressly exempt by donor | No | 1062 | Check inofficiousness |
| 3 | Donation by repudiating heir | No | 1062 | Check inofficiousness |
| 4 | Property left by will | No | 1063 | Unless testator provides |
| 5 | Grandchild inheriting by representation — parent's donation | Yes | 1064 | Even if grandchild didn't receive it |
| 6 | Donations grandparent→grandchild (for parent's obligation) | No | 1065 | Parent doesn't collate |
| 7 | Donation to child's spouse (not joint) | No | 1066 ¶1 | Spouse's gift, not child's |
| 8 | Joint donation to child+spouse | Yes (½ only) | 1066 ¶2 | Child collates ½ |
| 9 | Support, education, medical, apprenticeship, ordinary equipment, customary gifts | No | 1067 | Always exempt |
| 10 | Professional/vocational career expenses (no directive, no impairment) | No | 1068 | Default exempt |
| 11 | Professional/vocational career expenses (parent required OR impairs legitime) | Yes (minus home savings) | 1068 | Conditional |
| 12 | Debt payments, election expenses, fines, similar | Yes | 1069 | Always collatable |
| 13 | Wedding gifts (jewelry, clothing, outfit) ≤ 1/10 FP_disposable | No | 1070 | Not reducible |
| 14 | Donation to stranger | Charged to FP | 909 ¶2 | Not to heir legitime |

---

## Data Model

### Donation Input Struct (Rust)

```rust
struct Donation {
    id: DonationId,
    recipient_heir_id: Option<HeirId>,       // None if stranger
    recipient_is_stranger: bool,
    value_at_time_of_donation: BigRational,  // Art. 1071: always this value
    date: NaiveDate,                         // For Art. 911(3) reverse-chrono

    // Collatability classification flags
    is_expressly_exempt: bool,               // Art. 1062 — donor exempted
    is_support_education_medical: bool,      // Art. 1067 — auto exempt
    is_customary_gift: bool,                 // Art. 1067 — auto exempt
    is_professional_expense: bool,           // Art. 1068 — conditional
    professional_expense_parent_required: bool,   // Art. 1068 condition 1
    professional_expense_imputed_savings: Option<BigRational>,  // Art. 1068 deduction
    is_joint_from_both_parents: bool,        // Art. 1072 — split ½ each estate
    is_to_child_spouse_only: bool,           // Art. 1066 ¶1 — exempt
    is_joint_to_child_and_spouse: bool,      // Art. 1066 ¶2 — ½ collatable
    is_wedding_gift: bool,                   // Art. 1070 — 1/10 FP threshold
    is_debt_payment_for_child: bool,         // Art. 1069 — collatable
    is_election_expense: bool,               // Art. 1069 — collatable
    is_fine_payment: bool,                   // Art. 1069 — collatable
}
```

### Collation Result Struct (Rust)

```rust
struct CollationResult {
    collation_adjusted_estate: BigRational,  // E_adj = net_estate + collatable_sum
    collatable_sum: BigRational,
    collatable_donation_ids: Vec<DonationId>,
    non_collatable_donation_ids: Vec<DonationId>,

    // Per-heir imputation
    imputation_results: Vec<ImputationResult>,
    stranger_donations_total: BigRational,   // → FP
    excess_over_legitime_total: BigRational, // Heir excesses → FP

    // Inofficiousness
    inofficious: bool,
    inofficious_amount: BigRational,
    donation_reductions: Vec<DonationReduction>,  // Art. 911(3) reductions

    // Disputes
    disputes: Vec<CollationDispute>,

    // Partition output
    partition_allocations: Vec<PartitionAllocation>,
}

struct ImputationResult {
    heir_id: HeirId,
    gross_entitlement: BigRational,    // Legitime or intestate share (on E_adj)
    donations_received: BigRational,   // Total at donation-time value
    charged_to_legitime: BigRational,
    charged_to_fp: BigRational,
    net_from_estate: BigRational,      // max(0, gross - donated)
    is_excess: bool,
    excess_amount: BigRational,
}

struct DonationReduction {
    donation_id: DonationId,
    original_value: BigRational,
    reduced_by: BigRational,
    remaining_value: BigRational,
    return_required: BigRational,  // Donee must return this to estate
}

struct PartitionAllocation {
    heir_id: HeirId,
    total_entitlement: BigRational,
    already_received: BigRational,
    from_actual_estate: BigRational,   // max(0, total_entitlement - already_received)
    partition_note: Option<String>,
}
```

---

## Pipeline Integration

Collation inserts at **two points** in the 10-step pipeline:

### Point 1: Before Legitime Computation (between steps 2 and 3)

```
Step 2:   Determine scenario (heir concurrence)
Step 2.5: COLLATION PHASE 1 — compute E_adj
          In:  net_estate_at_death, donations, heirs
          Out: E_adj (used for ALL subsequent steps)
Step 3:   Compute legitimes on E_adj
Step 4:   Compute FP_gross and FP_disposable on E_adj
```

### Point 2: After Distribution (between steps 6 and 7)

```
Step 6:   Compute gross per-heir amounts (legitime + FP allocations)
Step 6.5: COLLATION PHASE 2 — imputation and inofficiousness
          In:  gross_per_heir, donations_by_heir, FP_disposable
          Out: net_per_heir_from_estate, inofficious_flags, donation_reductions
          Invariant: sum(net_from_estate) <= net_estate_at_death
Step 7:   Generate narratives (include collation context)
```

**Critical invariant**: `sum(net_from_estate_i) ≤ net_estate_at_death`. If this fails, the donation reduction logic has an error.

---

## Worked Examples

### Example 1: Simple Collation — Donation Within Share

Facts: E_death = ₱8,000,000; 3 LC (intestate); ₱1,500,000 donated to LC1.

```
E_adj = ₱8,000,000 + ₱1,500,000 = ₱9,500,000
Per child share = ₱9,500,000 ÷ 3 = ₱3,166,667
LC1: ₱3,166,667 - ₱1,500,000 = ₱1,666,667 from estate
LC2: ₱3,166,667 from estate
LC3: ₱3,166,667 from estate
Verify: ₱1,666,667 + ₱3,166,667 + ₱3,166,667 = ₱8,000,001 ≈ ₱8,000,000 ✓
```

### Example 2: Donation Exceeds Legitime — Testate

Facts: E_death = ₱6,000,000; 2 LC; ₱4,000,000 donated to LC1; will leaves FP to charity.

```
E_adj = ₱10,000,000
LC legitime each = ½ × ₱10M ÷ 2 = ₱2,500,000
FP_disposable = ₱5,000,000

LC1: ₱4M > ₱2.5M → excess = ₱1.5M charged to FP
     LC1 from estate = ₱0
FP remaining = ₱5M - ₱1.5M = ₱3.5M → charity

Verify: ₱0 + ₱2,500,000 + ₱3,500,000 = ₱6,000,000 ✓
```

### Example 3: Inofficious Donation

Facts: E_death = ₱2,000,000; 2 LC (intestate); ₱8,000,000 donated to LC1.

```
E_adj = ₱10,000,000
Per child = ₱5,000,000
LC1: donated ₱8M > share ₱5M → excess = ₱3M (inofficious)
LC1 must return ₱3M to estate
After return: estate = ₱5,000,000
LC1 net: ₱8M - ₱3M = ₱5,000,000 (donation only)
LC2: ₱5,000,000 from estate ✓
```

### Example 4: Representation Collation (Art. 1064)

Facts: E_death = ₱9,000,000; 3 lines (LC1 alive, LC2 predeceased→GC1+GC2, LC3 alive); ₱2,000,000 donated to LC2 during LC2's lifetime.

```
E_adj = ₱11,000,000
Per line = ₱11M ÷ 3 = ₱3,666,667
LC2's line: ₱3,666,667 - ₱2,000,000 = ₱1,666,667 net
GC1 = GC2 = ₱1,666,667 ÷ 2 = ₱833,333 each

Verify: ₱3,666,667 + ₱833,333 + ₱833,333 + ₱3,666,667 = ₱9,000,000 ✓
```

---

## Edge Cases

| # | Case | Rule |
|---|------|------|
| EC-1 | All heirs received equal donations | Collation applies symmetrically; no net redistribution (but still required for inofficiousness check) |
| EC-2 | Sole compulsory heir | Art. 1061 requires "with other compulsory heirs"; no collation |
| EC-3 | No compulsory heirs | No collation (no one to equalize against) |
| EC-4 | Repudiation + inofficious donation | Donee keeps non-inofficious portion; Art. 1062 exemption yields to inofficiousness |
| EC-5 | Multiple donations to same heir | Sum all donations; impute as one block |
| EC-6 | Destroyed donated property | Still collated at donation-time value (Art. 1071) |
| EC-7 | Donor-exempt donation | Not added to E_adj; still check inofficiousness against non-adjusted base |
| EC-8 | IC donation + Art. 895 cap rule | Excess over capped IC legitime → FP; if FP = 0, inofficious |
| EC-9 | Grandchildren didn't receive donated property | Must still collate (Art. 1064 explicit) |
| EC-10 | Wedding gift circular dependency | Compute FP on non-wedding-gift base; apply 1/10 threshold |
| EC-11 | Art. 1063 testamentary property | Not collatable by default; testator can require collation |
| EC-12 | Art. 1068 professional expense dispute | Provide both (with/without collation) computations per Art. 1077 |

---

## Test Vectors

### Collatability

| TV | Donation | Expected |
|----|----------|----------|
| C-01 | ₱2M to LC1, no exemption | Collatable |
| C-02 | ₱2M to LC1, expressly exempt | Not collatable; check inofficiousness |
| C-03 | ₱500K medical bills | Not collatable (Art. 1067) |
| C-04 | ₱200K college tuition | Not collatable (Art. 1067) |
| C-05 | ₱1M law school, no directive, no impairment | Not collatable (Art. 1068 default) |
| C-06 | ₱1M law school, parent required | Collatable minus imputed home savings |
| C-07 | ₱300K car loan payment | Collatable (Art. 1069) |
| C-08 | ₱4M joint to LC1+spouse | ₱2M collatable (Art. 1066 ¶2) |
| C-09 | ₱2M to LC1's spouse only | Not collatable (Art. 1066 ¶1) |
| C-10 | ₱6M joint donation from both parents | ₱3M in this estate (Art. 1072) |

### Imputation

| TV | E_death | Donations | Scenario | Expected |
|----|---------|-----------|----------|----------|
| C-11 | ₱8M | ₱1.5M→LC1 | 3 LC intestate | LC1=₱1,667K; LC2=LC3=₱3,167K |
| C-12 | ₱6M | ₱4M→LC1 | 2 LC testate FP→charity | LC1=₱0; LC2=₱2.5M; charity=₱3.5M |
| C-13 | ₱8M | ₱2M→LC1, ₱1M→LC2 | 3 LC intestate | LC1=₱1.67M; LC2=₱2.67M; LC3=₱3.67M |

### Inofficiousness

| TV | E_death | Donation | Expected |
|----|---------|----------|----------|
| C-14 | ₱2M | ₱8M→LC1 (2 LC intestate) | LC1 returns ₱3M; each gets ₱5M net |
| C-15 | ₱3M | ₱5M→LC2 predeceased (3 lines) | GC line share=₱2.67M < ₱5M; excess ₱2.33M inofficious |

### Wedding Gifts

| TV | Gift Value | FP_disposable | Expected |
|----|-----------|---------------|----------|
| C-16 | ₱400K | ₱5M | Threshold=₱500K; not reducible |
| C-17 | ₱800K | ₱5M | Threshold=₱500K; reduce by ₱300K |

---

## Narrative Templates

### Template 1: Basic Collation (donation within share)

> **{name} ({relationship})** receives **₱{from_estate} from the estate** (plus ₱{donation_value} previously received as a donation during the decedent's lifetime, for a total of ₱{total}). Under Art. 1061, the ₱{donation_value} inter vivos donation is collated (fictitiously added) into the estate. The collation-adjusted estate is ₱{e_adj}. {name}'s {intestate share | legitime} is ₱{gross_entitlement}. Per Art. 909, the donation is charged against {name}'s share, leaving ₱{from_estate} from the actual estate.

### Template 2: Donation Exceeds Share (no return needed)

> **{name} ({relationship})** receives **₱0 from the estate**, having already received ₱{donation_value} as a donation exceeding {name}'s share of ₱{gross_entitlement}. Under Art. 909, the excess of ₱{excess} is charged to the free portion. {name}'s total inheritance is ₱{donation_value}.

### Template 3: Inofficious Donation (return required)

> **{name} ({relationship})** must **return ₱{return_amount} to the estate**. The ₱{donation_value} inter vivos donation exceeds {name}'s share by ₱{excess}. Under Arts. 909 and 911, inofficious donations that impair co-heirs' legitimes must be reduced. After returning ₱{return_amount}, {name}'s net inheritance is ₱{net_total}.

### Template 4: Representation Collation (Art. 1064)

> **{name} (grandchild, by representation of {parent})** receives **₱{from_estate} from the estate**. Under Art. 1064, grandchildren inheriting by representation must collate donations their parent would have been obliged to bring, even if they never received the property. {parent} received ₱{parent_donation} during the decedent's lifetime. The collation-adjusted estate is ₱{e_adj}, giving {parent}'s line ₱{line_share}. After deducting ₱{parent_donation}, ₱{net_line_share} remains, divided among {count} grandchildren at ₱{per_gc} each.

### Template 5: Donor-Exempt Donation (Art. 1062)

> **{name} ({relationship})** receives **₱{from_estate} from the estate** plus ₱{donation_value} as a non-collatable donation. The decedent expressly exempted this donation from collation under Art. 1062. The donation is treated as a gift from the free portion and is NOT deducted from {name}'s share. {name}'s total inheritance is ₱{total}.

---

## Summary

| Rule | Key Point |
|------|-----------|
| Who must collate | Compulsory heir + co-heirs + gratuitous + not exempt + not repudiated |
| Valuation | Always donation-time value (Art. 1071) |
| E_adj | Used for ALL legitime/share computations; actual estate only at partition |
| Charging order | To legitime first; excess to FP; excess over FP = inofficious |
| Representation | Grandchildren collate parent's donations (Art. 1064), even if property gone |
| Inofficiousness | Reduce legacies/devises → institutions → donations reverse-chronological |
| Wedding gifts | 1/10 FP_disposable threshold; only excess reducible |
| Disputes | Compute both ways; partition proceeds with security (Art. 1077) |
