# Collation — Accounting for Inter Vivos Donations in Inheritance Distribution

**Aspect**: collation
**Wave**: 4 (Distribution Rules)
**Primary Legal Basis**: Arts. 1061-1077 (Civil Code, Chapter 4 Section 5); Arts. 908-912 (legitime computation base)
**Depends On**: free-portion-rules (Art. 908 estate base), legitime-table (all scenario fractions), heir-concurrence-rules (who must collate), intestate-order (intestate collation distribution)

---

## Overview

**Collation** is the legal mechanism that ensures equality among compulsory heirs by requiring them to "bring back" into the hereditary mass the value of inter vivos donations (lifetime gifts) they received from the decedent. Without collation, a parent could circumvent the legitime system by donating the entire estate to one child during their lifetime, leaving nothing at death.

Collation has **two distinct functions**:
1. **Mathematical addition** (Art. 908 ¶2): Fictitiously add the value of collatable donations to the net estate at death to compute the correct estate base for legitime and free portion calculations
2. **Imputation/charging** (Arts. 909-910, 1073): Deduct the donation value from the donee-heir's share, so co-heirs receive equivalent property from the actual estate

This analysis covers:
1. Who must collate (obligation and exemptions)
2. What is collatable (inclusions and exclusions by article)
3. Valuation rules (time of donation, not death)
4. The collation computation algorithm
5. Imputation: charging donations against legitime vs free portion
6. Donation exceeds share: when the donee "owes" the estate
7. Partition mechanics: how co-heirs are made whole
8. Collation in representation (grandchildren)
9. Joint donations (both parents)
10. Interaction with inofficiousness reduction (Arts. 911-912)
11. Complete pseudocode for the engine's collation sub-system
12. Edge cases and test implications

---

## Legal Basis

### Core Collation Articles (Arts. 1061-1077)

| Article | Rule | Quoted Text (Key Portion) |
|---------|------|--------------------------|
| **Art. 1061** | Obligation to collate | "Every compulsory heir, who succeeds with other compulsory heirs, must bring into the mass of the estate any property or right which he may have received from the decedent, during the lifetime of the latter, by way of donation, or any other gratuitous title, in order that it may be computed in the determination of the legitime of each heir, and in the account of the partition." |
| **Art. 1062** | Exemption by donor's express will; repudiation | "Collation shall not take place among compulsory heirs if the donor should have so expressly provided, or if the donee should repudiate the inheritance of the donor, unless the donation should be reduced as inofficious." |
| **Art. 1063** | Testamentary property not collatable by default | "Property left by will is not deemed subject to collation, if the testator has not otherwise provided, but the legitime shall in any case remain unimpaired." |
| **Art. 1064** | Grandchildren by representation must collate parent's donations | "When grandchildren, who survive with their uncles, aunts, or cousins, inherit from their grandparents in representation of their father or mother, they shall bring to collation all that their parents, if alive, would have been obliged to bring, even though such grandchildren have not inherited the property." |
| **Art. 1065** | Parents not obliged to collate donations to their children | "Parents are not obliged to bring to collation in the inheritance of their ascendants any property which may have been donated by the latter to their children." |
| **Art. 1066** | Donations to spouse of child exempt; joint donations split | "Neither shall donations to the spouse of the child be brought to collation; but if they have been given by the parent to the spouses jointly, the child shall be obliged to bring to collation one-half of the thing donated." |
| **Art. 1067** | Support/education/customary gifts exempt | "Expenses for support, education, medical attendance, even in extraordinary illness, apprenticeship, ordinary equipment, or customary gifts are not subject to collation." |
| **Art. 1068** | Professional/vocational expenses conditionally exempt | "Expenses incurred by the parents in giving their children a professional, vocational or other career shall not be brought to collation unless the parents so provide, or unless they impair the legitime; but when their collation is required, the sum which the child would have spent if he had lived in the house and company of his parents shall be deducted therefrom." |
| **Art. 1069** | Debts/fines/election expenses collatable | "Any sums paid by a parent in satisfaction of the debts of his children, election expenses, fines, and similar expenses shall be brought to collation." |
| **Art. 1070** | Wedding gifts: 1/10 FP threshold | "Wedding gifts by parents and ascendants consisting of jewelry, clothing, and outfit, shall not be reduced as inofficious except insofar as they may exceed one-tenth of the sum which is disposable by will." |
| **Art. 1071** | Valuation at time of donation | "The same things donated are not to be brought to collation and partition, but only their value at the time of the donation, even though their just value may not then have been assessed. Their subsequent increase or deterioration and even their total loss or destruction, be it accidental or culpable, shall be for the benefit or account and risk of the donee." |
| **Art. 1072** | Joint donation split between parents' estates | "In the collation of a donation made by both parents, one-half shall be brought to the inheritance of the father, and the other half, to that of the mother. That given by one alone shall be brought to collation in his or her inheritance." |
| **Art. 1073** | Donee's share reduction; co-heirs get equivalents | "The donee's share of the estate shall be reduced by an amount equal to that already received by him; and his co-heirs shall receive an equivalent, as much as possible, in property of the same nature, class and quality." |
| **Art. 1074** | Alternative: cash/securities when in-kind impracticable | "Should the provisions of the preceding article be impracticable, if the property donated was immovable, the co-heirs shall be entitled to receive its equivalent in cash or securities, at the rate of quotation; and should there be neither cash nor marketable securities in the estate, so much of the other property as may be necessary shall be sold at public auction. If the property donated was movable, the co-heirs shall only have a right to select an equivalent of other personal property of the inheritance at its just price." |
| **Art. 1075** | Fruits/interest only from succession opening | "The fruits and interest of the property subject to collation shall not pertain to the estate except from the day on which the succession is opened." |
| **Art. 1076** | Reimbursement of necessary expenses and improvements | "The co-heirs are bound to reimburse to the donee the necessary expenses which he has incurred for the preservation of the property donated to him... The donee who collates in kind an immovable which has been given to him must be reimbursed by his co-heirs for the improvements which have increased the value of the property, and which exist at the time the partition is effected." |
| **Art. 1077** | Disputes don't block partition | "Should any question arise among the co-heirs upon the obligation to bring to collation or as to the things which are subject thereto, the distribution of the estate shall not be interrupted for this reason, provided adequate security is given." |

### Related Articles (Estate Base Computation)

| Article | Interaction |
|---------|------------|
| **Art. 908** | Estate base = net estate at death + value of collatable donations at time given |
| **Art. 909** | Donations to children → charged to their legitime; donations to strangers → charged to FP |
| **Art. 910** | Donations to illegitimate children → charged to their legitime |
| **Art. 911** | Reduction order when donations + testamentary dispositions exceed FP: legacies first, then donations reverse-chronological |
| **Art. 912** | Indivisible realty threshold (½ value) determines who keeps property |

---

## Rule 1: Who Must Collate

### The Obligation (Art. 1061)

Collation applies when **ALL** of the following conditions are met:

```
function must_collate(heir: Heir, co_heirs: List<Heir>, donation: Donation) -> bool {
    // Condition 1: Donee is a compulsory heir
    if NOT heir.is_compulsory:
        return false

    // Condition 2: Donee succeeds WITH other compulsory heirs
    // (sole compulsory heir has no one to equalize against)
    if co_heirs.filter(h => h.is_compulsory AND h.id != heir.id).count == 0:
        return false

    // Condition 3: Donation was "by way of donation, or any other gratuitous title"
    if NOT donation.is_gratuitous:
        return false

    // Condition 4: Not expressly exempted by donor (Art. 1062)
    if donation.expressly_exempt_from_collation:
        return false

    // Condition 5: Donee has NOT repudiated the inheritance (Art. 1062)
    // EXCEPTION: even if repudiated, collation required if donation is inofficious
    if heir.has_repudiated AND NOT donation.is_inofficious:
        return false

    return true
}
```

### Art. 1062 Exemptions

Two exemptions from the collation obligation:

1. **Donor's express exemption**: The donor (decedent) expressly provided that the donation should NOT be collated. This is an affirmative act — silence means collation IS required (default = collatable).

2. **Repudiation of inheritance**: If the donee repudiates the inheritance, they are not obliged to collate — BUT this exemption has a critical exception: "unless the donation should be reduced as inofficious." If the donation impairs other heirs' legitimes, it must still be reduced even if the donee repudiated.

```
struct CollationExemption {
    type: "donor_express" | "repudiation"
    // For repudiation: check if donation is inofficious
    // If inofficious, exemption does NOT apply
    inofficiousness_override: bool
}
```

### Art. 1065: Ascending Line Exception

Parents do NOT need to collate donations their parent (the decedent-grandparent) gave to the parent's children (decedent's grandchildren). The rule addresses the case where:
- Decedent = grandparent
- Heir = parent (ascending line)
- Grandparent donated to grandchild during lifetime
- Parent does NOT collate that donation in grandparent's estate

This makes sense because the donation went to the grandchild, not the parent. The grandchild would collate it under Art. 1064 if inheriting by representation.

### Art. 1066: Spouse Donations

- Donations to the **spouse of a child** → NOT collatable by the child
- Donations given to the **child AND spouse jointly** → child must collate **one-half** of the donated value

```
function determine_collatable_amount(donation: Donation) -> Amount {
    if donation.recipient_is_child_spouse_only:
        return 0  // Art. 1066 exemption
    if donation.is_joint_to_child_and_spouse:
        return donation.value_at_time_of_donation / 2  // Art. 1066 ¶2
    return donation.value_at_time_of_donation
}
```

---

## Rule 2: What Is Collatable

### Collatable (Default)

| Category | Legal Basis | Notes |
|----------|-------------|-------|
| Inter vivos donations to compulsory heirs | Art. 1061 | Any gratuitous transfer during lifetime |
| Gratuitous transfers by any other title | Art. 1061 | Not just formal "donations" — any gratuitous conveyance |
| Debt payments on behalf of child | Art. 1069 | Sums paid to satisfy children's debts |
| Election expenses | Art. 1069 | Campaign costs, etc. |
| Fines paid on behalf of child | Art. 1069 | Criminal or administrative fines |
| "Similar expenses" | Art. 1069 | Catch-all for non-support expenditures benefiting child |
| Professional career expenses (if parent so provides OR if they impair legitime) | Art. 1068 | Conditionally collatable |
| Joint donation to child and spouse (child's ½) | Art. 1066 ¶2 | Only the child's half |
| Inter vivos donations to strangers | Art. 909 ¶2 | Charged to FP, not to any heir's legitime |

### Not Collatable (Exempt)

| Category | Legal Basis | Notes |
|----------|-------------|-------|
| Support expenses | Art. 1067 | Food, clothing, shelter |
| Education expenses (basic) | Art. 1067 | Primary, secondary, ordinary schooling |
| Medical attendance (even extraordinary) | Art. 1067 | Hospital bills, surgery, long-term care |
| Apprenticeship costs | Art. 1067 | Training expenses |
| Ordinary equipment | Art. 1067 | Normal household setup |
| Customary gifts | Art. 1067 | Birthday, holiday gifts of moderate value |
| Donations expressly exempted by donor | Art. 1062 | Donor must have expressly provided |
| Property left by will (default) | Art. 1063 | Unless testator provided otherwise |
| Donations to child's spouse (not joint) | Art. 1066 ¶1 | Separate gift to spouse |
| Donations grandparent→grandchild (for parent's collation) | Art. 1065 | Parent doesn't collate; grandchild might under Art. 1064 |
| Professional career expenses (default, if not impairing legitime) | Art. 1068 | Unless parent provides or it impairs legitime |
| Wedding gifts (jewelry, clothing, outfit) up to 1/10 FP | Art. 1070 | Only excess over 1/10 of disposable portion is reducible as inofficious |

### Art. 1068: Professional Expenses — Conditional Collation

Professional/vocational career expenses have a unique two-condition test:

```
function is_professional_expense_collatable(
    expense: ProfessionalExpense,
    parent_expressly_required: bool,
    impairs_legitime: bool,
    imputed_home_savings: Amount  // what child would have spent living at home
) -> CollationResult {

    if NOT parent_expressly_required AND NOT impairs_legitime:
        return { collatable: false }

    // If collatable, deduct imputed home-living costs
    collatable_amount = expense.amount - imputed_home_savings
    if collatable_amount < 0:
        collatable_amount = 0

    return { collatable: true, amount: collatable_amount }
}
```

**Engine note**: The imputed home-living savings deduction is inherently subjective. The engine should accept this as an input parameter (user provides the deduction amount), not attempt to compute it.

---

## Rule 3: Valuation — Time of Donation (Art. 1071)

### The Rule

"The same things donated are not to be brought to collation and partition, but only their **value at the time of the donation**."

This is critical:
- A property worth ₱1M when donated but ₱5M at death → collated at **₱1M**
- A property worth ₱5M when donated but destroyed before death → collated at **₱5M**
- Appreciation, depreciation, loss, or destruction after donation → donee's risk/benefit

```
function collation_value(donation: Donation) -> Amount {
    // ALWAYS use donation-time value, per Art. 1071
    return donation.value_at_time_of_donation
    // NOT: donation.current_value_at_death
}
```

### Art. 1075: Fruits and Interest

Fruits and interest of collatable property do NOT accrue to the estate retroactively. They only pertain to the estate from the **day of succession opening** (death). Before death, all fruits and interest belong to the donee.

```
// Engine doesn't need to track pre-death fruits/interest
// Only post-death fruits/interest are relevant for partition
// This is a partition-phase concern, not a computation concern
```

### Art. 1076: Necessary Expenses and Improvements

At partition time:
- Co-heirs must reimburse the donee for **necessary preservation expenses**
- If collating in kind (immovable): co-heirs reimburse **improvements that increased value** and exist at partition time

**Engine note**: These are partition-phase adjustments. The computation engine should flag them for the partition step but does NOT need to compute them (requires appraisal data not available at computation time).

---

## Rule 4: The Collation Computation Algorithm

### Step-by-Step Process

```
function compute_collation(
    net_estate_at_death: Amount,    // After debts, charges (NOT testamentary charges)
    donations: List<Donation>,       // All inter vivos donations by decedent
    heirs: List<Heir>,               // All surviving heirs
    will: Will?                      // Optional will
) -> CollationResult {

    // ===== PHASE 1: Determine which donations are collatable =====

    collatable_donations = []
    non_collatable_donations = []

    for d in donations:
        if is_collatable(d, heirs):
            collatable_donations.append(d)
        else:
            non_collatable_donations.append(d)

    // ===== PHASE 2: Compute collation-adjusted estate (Art. 908) =====

    collatable_sum = sum(d.value_at_time_of_donation for d in collatable_donations)
    collation_adjusted_estate = net_estate_at_death + collatable_sum
    // This is the "E" used in ALL legitime fraction computations

    // ===== PHASE 3: Compute legitimes using adjusted estate =====

    scenario = determine_scenario(heirs)
    legitimes = compute_all_legitimes(collation_adjusted_estate, scenario, heirs)
    // legitimes here are GROSS legitimes (before donation imputation)

    fp_gross = compute_fp_gross(collation_adjusted_estate, scenario)
    fp_disposable = compute_fp_disposable(collation_adjusted_estate, scenario, heirs)

    // ===== PHASE 4: Impute/charge donations against heir shares =====

    imputation_results = []
    excess_over_legitime = 0  // Sum of donations exceeding individual legitimes

    for heir in heirs.filter(h => h.is_compulsory):
        heir_donations = collatable_donations.filter(d => d.recipient_heir_id == heir.id)
        total_donated_to_heir = sum(d.value_at_time_of_donation for d in heir_donations)

        if total_donated_to_heir <= legitimes[heir.id]:
            // Donation fits within legitime — straightforward imputation
            net_from_estate = legitimes[heir.id] - total_donated_to_heir
            imputation_results.append({
                heir: heir,
                gross_legitime: legitimes[heir.id],
                donated: total_donated_to_heir,
                net_from_estate: net_from_estate,
                excess: 0,
                charged_to: "legitime"
            })
        else:
            // Donation EXCEEDS legitime
            excess = total_donated_to_heir - legitimes[heir.id]
            excess_over_legitime += excess
            imputation_results.append({
                heir: heir,
                gross_legitime: legitimes[heir.id],
                donated: total_donated_to_heir,
                net_from_estate: 0,  // Gets nothing more from estate for legitime
                excess: excess,
                charged_to: "legitime_then_fp"
            })

    // Charge donations to strangers against free portion
    stranger_donation_total = sum(d.value_at_time_of_donation
        for d in collatable_donations
        if d.recipient_is_stranger)

    // ===== PHASE 5: Check for inofficiousness =====

    total_fp_consumed = excess_over_legitime + stranger_donation_total
    if will:
        total_fp_consumed += sum(d.amount for d in will.dispositions if d.type != "institution")

    if total_fp_consumed > fp_disposable:
        // Donations and/or testamentary dispositions are inofficious
        inofficious_excess = total_fp_consumed - fp_disposable
        // Reduction per Art. 911 (see free-portion-rules analysis)
        reduction = reduce_inofficious(inofficious_excess, will, collatable_donations)
    else:
        reduction = null

    // ===== PHASE 6: Compute actual estate distribution =====

    // The actual estate to distribute is net_estate_at_death (NOT collation-adjusted)
    // Donations have ALREADY left the estate during the decedent's lifetime
    actual_distributable = net_estate_at_death

    return {
        collation_adjusted_estate: collation_adjusted_estate,
        actual_distributable: actual_distributable,
        imputation_results: imputation_results,
        excess_over_legitime: excess_over_legitime,
        stranger_donations: stranger_donation_total,
        inofficious: total_fp_consumed > fp_disposable,
        reduction: reduction,
    }
}
```

---

## Rule 5: Imputation — Charging Donations (Arts. 909-910)

### Three Charging Rules

| Donation To | Charged Against | Legal Basis |
|-------------|----------------|-------------|
| Legitimate child | Child's legitime | Art. 909 ¶1 |
| Illegitimate child | Child's legitime | Art. 910 |
| Stranger (non-heir) | Free portion | Art. 909 ¶2 |

### When Donation to Child Exceeds Their Legitime

If a donation to a child exceeds their computed legitime:
1. The **entire legitime** is consumed (child receives ₱0 from estate as legitime)
2. The **excess** is charged to the free portion (Art. 909: "Insofar as they may be inofficious or may exceed the disposable portion, they shall be reduced")
3. If the excess also exceeds the free portion → the donation is **inofficious** and must be returned/reduced

```
function impute_donation_to_child(
    child_legitime: Amount,
    donation_total: Amount,
    fp_disposable: Amount
) -> ImputationResult {

    if donation_total <= child_legitime:
        return {
            charged_to_legitime: donation_total,
            charged_to_fp: 0,
            net_legitime_from_estate: child_legitime - donation_total,
            is_inofficious: false,
            inofficious_amount: 0
        }

    excess_over_legitime = donation_total - child_legitime

    if excess_over_legitime <= fp_disposable:
        return {
            charged_to_legitime: child_legitime,
            charged_to_fp: excess_over_legitime,
            net_legitime_from_estate: 0,
            is_inofficious: false,
            inofficious_amount: 0
        }

    // Donation is inofficious
    inofficious_amount = excess_over_legitime - fp_disposable
    return {
        charged_to_legitime: child_legitime,
        charged_to_fp: fp_disposable,
        net_legitime_from_estate: 0,
        is_inofficious: true,
        inofficious_amount: inofficious_amount
        // The inofficious amount must be returned to the estate
    }
}
```

### Donation to Illegitimate Child (Art. 910)

Same rule as legitimate child: charged to IC's legitime. If excess, charged to FP. But note that IC's legitime is computed differently:
- Testate: IC legitime = ½ of LC legitime, from FP, subject to cap (Art. 895 ¶3)
- Intestate: IC share per unit ratio method

The donation imputation happens AFTER the legitime/share is computed using the collation-adjusted estate.

### Donation to Stranger (Art. 909 ¶2)

Stranger donations go directly against the free portion:

```
function impute_stranger_donation(
    donation: Amount,
    fp_disposable: Amount
) -> ImputationResult {
    if donation <= fp_disposable:
        return { charged_to_fp: donation, is_inofficious: false }
    return {
        charged_to_fp: fp_disposable,
        is_inofficious: true,
        inofficious_amount: donation - fp_disposable
    }
}
```

---

## Rule 6: Partition Mechanics (Arts. 1073-1074)

### Art. 1073: The Equalizing Principle

"The donee's share of the estate shall be reduced by an amount equal to that already received by him; and his co-heirs shall receive an equivalent, as much as possible, in property of the same nature, class and quality."

This is the **partition implementation** of the mathematical collation:
1. Compute each heir's total entitlement using the collation-adjusted estate
2. Deduct what the donee already received via donation
3. The donee receives only the difference from the actual estate
4. Co-heirs receive their full entitlement from the actual estate
5. Preference: co-heirs receive property of the "same nature, class and quality" as the donated property

### Art. 1074: Alternatives When In-Kind Impracticable

When co-heirs cannot receive equivalent in-kind property:
- **Donated property was immovable** → co-heirs receive cash or securities at market quotation; if no cash/securities, estate property sold at public auction
- **Donated property was movable** → co-heirs select equivalent personal property from the estate at just price

### Engine Implementation

The engine's computation phase produces **peso amounts** per heir. The in-kind partition (deciding WHICH properties go to whom) is a downstream partition-phase concern. The engine should:

1. Compute each heir's total entitlement (from collation-adjusted estate)
2. Compute how much each heir receives from the actual estate (entitlement minus donations already received)
3. Flag any Art. 1074 scenarios for the partition phase

```
struct PartitionAllocation {
    heir_id: HeirId
    total_entitlement: Amount       // Computed on collation-adjusted estate
    already_received: Amount        // Value of donations at time given (Art. 1071)
    from_actual_estate: Amount      // total_entitlement - already_received (≥ 0)
    partition_note: String?         // "Art. 1074: co-heirs receive cash equivalent" etc.
}
```

---

## Rule 7: Collation by Representation (Art. 1064)

### The Rule

"When grandchildren, who survive with their uncles, aunts, or cousins, inherit from their grandparents in representation of their father or mother, they shall bring to collation all that their parents, if alive, would have been obliged to bring, even though such grandchildren have not inherited the property."

### Key Implications

1. Grandchildren representing a predeceased parent must collate the **parent's** donations, not just their own
2. They collate even though they **never received** the donated property (the parent did)
3. The collation amount is deducted from the grandchildren's combined share (the represented line's share)
4. If the parent's donation exceeded the line's share, the grandchildren owe the difference to the estate

```
function collation_for_representatives(
    represented_heir: Heir,         // The predeceased parent
    representatives: List<Heir>,    // The grandchildren
    parent_donations: List<Donation>,
    line_share: Amount              // The represented line's total entitlement
) -> RepresentativeCollation {

    parent_donation_total = sum(d.value_at_time_of_donation for d in parent_donations)

    net_line_share = line_share - parent_donation_total

    if net_line_share >= 0:
        // Grandchildren divide the net line share per stirpes
        per_representative = net_line_share / representatives.count
        return {
            line_entitlement: line_share,
            parent_donation_collated: parent_donation_total,
            net_from_estate: net_line_share,
            per_representative: per_representative,
            owes_estate: false
        }
    else:
        // Parent's donation exceeded the line's entitlement
        // Grandchildren receive nothing AND the excess is charged to FP
        return {
            line_entitlement: line_share,
            parent_donation_collated: parent_donation_total,
            net_from_estate: 0,
            per_representative: 0,
            owes_estate: true,
            excess: abs(net_line_share)
        }
    }
}
```

### Critical Edge Case: Grandchildren Didn't Inherit the Donated Property

Art. 1064 explicitly says "even though such grandchildren have not inherited the property." This means:
- Parent received ₱5M donation from grandparent
- Parent spent/sold the ₱5M
- Parent dies, leaving nothing to grandchildren
- Grandchildren inherit from grandparent by representation
- Grandchildren STILL must collate the ₱5M

This can result in grandchildren receiving significantly less than expected. The engine should generate a clear narrative explaining why.

---

## Rule 8: Joint Donations (Art. 1072)

### Both-Parent Donations

When BOTH parents make a joint donation:
- **½** is collated in the father's inheritance
- **½** is collated in the mother's inheritance

When ONE parent alone donates:
- The full donation is collated only in that parent's inheritance

### Engine Implication

The engine processes ONE decedent's estate at a time. For a joint donation:

```
struct Donation {
    // ...existing fields...
    is_joint_from_both_parents: bool
    // If true, only half the value is collated in THIS decedent's estate
}

function collatable_value_in_this_estate(donation: Donation) -> Amount {
    if donation.is_joint_from_both_parents:
        return donation.value_at_time_of_donation / 2  // Art. 1072
    return donation.value_at_time_of_donation
}
```

---

## Rule 9: Art. 1070 — Wedding Gifts Threshold

### The Rule

Wedding gifts (jewelry, clothing, outfit) from parents/ascendants:
- Are NOT subject to collation as such
- Are NOT reducible as inofficious UNLESS they exceed **one-tenth (1/10)** of the disposable portion (FP_disposable)
- Only the **excess** over 1/10 of FP_disposable is reducible

```
function check_wedding_gift_inofficiousness(
    wedding_gift_value: Amount,
    fp_disposable: Amount
) -> WeddingGiftResult {
    threshold = fp_disposable / 10  // 1/10 of disposable portion
    if wedding_gift_value <= threshold:
        return { reducible: false }
    return {
        reducible: true,
        reducible_amount: wedding_gift_value - threshold
    }
}
```

### Engine Note

Wedding gifts are in a unique category:
- NOT collatable for legitime computation (Art. 1067 exempts "customary gifts")
- NOT reducible unless exceeding the 1/10 threshold (Art. 1070)
- The 1/10 threshold is computed against FP_disposable, creating a circular dependency (FP depends on collation, wedding gift reducibility depends on FP). In practice, compute FP first ignoring wedding gifts, then check threshold.

---

## Rule 10: Interaction with Inofficiousness (Art. 911)

### The Combined Check

Collation and inofficiousness are deeply intertwined. The complete flow:

1. **Compute collation-adjusted estate** (Art. 908): E_adj = net_estate + collatable_donations
2. **Compute all legitimes** on E_adj
3. **Compute FP_disposable** on E_adj
4. **Impute heir donations** against their respective legitimes (Arts. 909-910)
5. **Sum up FP consumption**: heir donation excesses + stranger donations + testamentary dispositions
6. **If FP consumption > FP_disposable** → inofficious → reduce per Art. 911:
   - Phase 1a: Reduce non-preferred legacies/devises pro rata
   - Phase 1b: Reduce preferred legacies/devises pro rata
   - Phase 2: Reduce voluntary institutions pro rata
   - Phase 3: Reduce donations in reverse chronological order

### Donation Reduction (Art. 911(3))

When ALL testamentary dispositions have been reduced to zero and excess remains:
- Donations are reduced **most recent first** (reverse chronological)
- Each donation is reduced up to its full value before moving to the next
- The donee must return the inofficious portion

```
function reduce_donations_reverse_chrono(
    excess: Amount,
    donations: List<Donation>
) -> List<DonationReduction> {

    sorted = sort(donations, by: date, order: DESCENDING)
    reductions = []
    remaining = excess

    for d in sorted:
        if remaining <= 0:
            break
        reduction = min(d.value_at_time_of_donation, remaining)
        reductions.append({
            donation_id: d.id,
            original_value: d.value_at_time_of_donation,
            reduced_by: reduction,
            remaining_value: d.value_at_time_of_donation - reduction,
            return_required: reduction  // Donee must return this amount
        })
        remaining -= reduction

    return reductions
}
```

---

## Rule 11: Collation in Intestate vs Testate

### Testate Succession

Collation is most fully expressed in testate succession:
- Art. 908 adjusts the estate base
- Arts. 909-910 charge donations to specific accounts (legitime vs FP)
- Art. 911 provides the reduction mechanism
- Art. 1062 allows donor to expressly exempt

### Intestate Succession

Collation also applies in intestate succession (Art. 1061 says "common to testate and intestate"):
- The collation-adjusted estate determines each heir's share
- Donations are imputed against the donee-heir's intestate share
- No "free portion" concept — but the unit-ratio or statutory-fraction method uses E_adj
- Inofficious donations must still be reduced if they impair co-heirs' shares

```
function collation_intestate(
    net_estate: Amount,
    donations: List<Donation>,
    heirs: List<Heir>,
    scenario: IntestateScenario
) -> IntestateCollationResult {

    // Step 1: Collation-adjusted estate
    collatable = donations.filter(d => is_collatable(d, heirs))
    e_adj = net_estate + sum(d.value for d in collatable)

    // Step 2: Compute intestate shares using e_adj
    shares = compute_intestate_shares(e_adj, heirs, scenario)

    // Step 3: Impute donations
    for heir in heirs:
        heir_donations = collatable.filter(d => d.recipient == heir.id)
        donated_total = sum(d.value for d in heir_donations)
        shares[heir.id].from_estate = max(0, shares[heir.id].total - donated_total)
        if donated_total > shares[heir.id].total:
            shares[heir.id].excess = donated_total - shares[heir.id].total
            // This excess means the donation was inofficious

    // Step 4: Verify actual estate covers all from_estate amounts
    total_from_estate = sum(s.from_estate for s in shares.values())
    assert total_from_estate <= net_estate  // Must hold if collation is correct

    return shares
}
```

---

## Art. 1077: Disputes Don't Block Partition

"Should any question arise among the co-heirs upon the obligation to bring to collation or as to the things which are subject thereto, the distribution of the estate shall not be interrupted for this reason, provided adequate security is given."

### Engine Implication

When the engine encounters uncertain collation scenarios (e.g., whether an expense is "ordinary support" per Art. 1067 or collatable), it should:
1. Flag the item as disputed
2. Compute distribution BOTH ways (with and without collation of the disputed item)
3. Note that the dispute doesn't block the partition (adequate security can be posted)

```
struct CollationDispute {
    donation_id: DonationId
    reason: String  // e.g., "Unclear if professional expense impairs legitime per Art. 1068"
    with_collation: DistributionResult
    without_collation: DistributionResult
    security_required: Amount  // Difference between the two computations
}
```

---

## Complete Worked Examples

### Example 1: Simple Collation — Donation Within Legitime

**Facts**: E_death = ₱8,000,000. 3 legitimate children (LC1, LC2, LC3). No spouse. No will (intestate). Decedent donated ₱1,500,000 to LC1 during lifetime.

**Step 1 — Collation-Adjusted Estate**:
- E_adj = ₱8,000,000 + ₱1,500,000 = ₱9,500,000

**Step 2 — Intestate Shares** (Art. 980: equal shares):
- Per child: ₱9,500,000 ÷ 3 = ₱3,166,667

**Step 3 — Imputation**:
- LC1: ₱3,166,667 - ₱1,500,000 = **₱1,666,667 from estate**
- LC2: **₱3,166,667 from estate**
- LC3: **₱3,166,667 from estate**

**Verification**: ₱1,666,667 + ₱3,166,667 + ₱3,166,667 = ₱8,000,001 ≈ ₱8,000,000 (rounding) ✓

**Narrative (LC1)**:
> **LC1 (legitimate child)** receives **₱1,666,667 from the estate** (plus ₱1,500,000 previously received as a donation, for a total of ₱3,166,667). Under Art. 1061 of the Civil Code, the ₱1,500,000 inter vivos donation must be collated (fictitiously added back) into the estate. The collation-adjusted estate is ₱9,500,000, divided equally among 3 children (₱3,166,667 each). Since LC1 already received ₱1,500,000 as an advance on inheritance (Art. 909), LC1 receives only ₱1,666,667 from the actual estate.

---

### Example 2: Donation Exceeds Legitime — Testate

**Facts**: E_death = ₱6,000,000. 2 legitimate children (LC1, LC2). No spouse. Decedent donated ₱4,000,000 to LC1. Will leaves free portion to charity C.

**Step 1 — Collation-Adjusted Estate**:
- E_adj = ₱6,000,000 + ₱4,000,000 = ₱10,000,000

**Step 2 — Legitimes** (Art. 888):
- LC collective legitime = ½ × ₱10,000,000 = ₱5,000,000
- Per child: ₱2,500,000
- FP_disposable = ₱5,000,000

**Step 3 — Imputation**:
- LC1's donation (₱4,000,000) > LC1's legitime (₱2,500,000)
- Excess = ₱4,000,000 - ₱2,500,000 = ₱1,500,000 → charged to FP
- LC1 receives **₱0 from estate** (already got more than legitime)
- LC2 receives **₱2,500,000 from estate** (full legitime)

**Step 4 — Free Portion**:
- FP_disposable = ₱5,000,000
- Minus LC1's excess charged to FP: ₱5,000,000 - ₱1,500,000 = ₱3,500,000 available
- Will gives FP to charity: charity receives ₱3,500,000

**Step 5 — Verify**:
- LC1 from estate: ₱0
- LC2 from estate: ₱2,500,000
- Charity from estate: ₱3,500,000
- Total from estate: ₱6,000,000 ✓

**Narrative (LC1)**:
> **LC1 (legitimate child)** receives **₱0 from the estate** (having already received ₱4,000,000 as a donation during the decedent's lifetime, which exceeds LC1's legitime of ₱2,500,000). Under Art. 908, the collation-adjusted estate is ₱10,000,000. Under Art. 888, each child's legitime is ₱2,500,000 (½ of ₱10M ÷ 2). Under Art. 909, the ₱4,000,000 donation is charged first to LC1's legitime (₱2,500,000), with the excess of ₱1,500,000 charged to the free portion. LC1's total inheritance (donation + estate) is ₱4,000,000.

---

### Example 3: Inofficious Donation — Must Be Returned

**Facts**: E_death = ₱2,000,000. 2 legitimate children (LC1, LC2). No spouse. No will. Decedent donated ₱8,000,000 to LC1 during lifetime.

**Step 1 — Collation-Adjusted Estate**:
- E_adj = ₱2,000,000 + ₱8,000,000 = ₱10,000,000

**Step 2 — Intestate Shares** (equal):
- Per child: ₱10,000,000 ÷ 2 = ₱5,000,000

**Step 3 — Imputation**:
- LC1: ₱5,000,000 entitlement - ₱8,000,000 donated = **-₱3,000,000** (owes the estate)
- LC2: ₱5,000,000 entitlement from actual estate

**Step 4 — Problem**: LC2 is entitled to ₱5,000,000 but the actual estate is only ₱2,000,000. LC1's donation is inofficious by ₱3,000,000.

**Step 5 — Reduction**:
- LC1 must return ₱3,000,000 to the estate (Art. 911 by analogy — donation reduced)
- After return: estate = ₱2,000,000 + ₱3,000,000 = ₱5,000,000
- LC2 receives ₱5,000,000

**Final**:
- LC1: ₱8,000,000 donated - ₱3,000,000 returned = **₱5,000,000 net**
- LC2: **₱5,000,000 from estate**
- Equal ✓

**Narrative (LC2)**:
> **LC2 (legitimate child)** receives **₱5,000,000 from the estate**. Under Art. 908, the collation-adjusted estate is ₱10,000,000, giving each child an equal share of ₱5,000,000. The ₱8,000,000 donation to LC1 exceeded LC1's ₱5,000,000 share by ₱3,000,000, making the donation inofficious to that extent. Under Arts. 909 and 911, LC1 must return ₱3,000,000 to the estate to preserve LC2's share.

---

### Example 4: Representation Collation (Art. 1064)

**Facts**: E_death = ₱9,000,000. 3 legitimate child lines: LC1 (alive), LC2 (predeceased, with 2 grandchildren GC1, GC2), LC3 (alive). No spouse. Intestate. Decedent donated ₱2,000,000 to LC2 during LC2's lifetime.

**Step 1 — Collation-Adjusted Estate**:
- E_adj = ₱9,000,000 + ₱2,000,000 = ₱11,000,000

**Step 2 — Intestate Shares** (3 lines, equal per stirpes):
- Per line: ₱11,000,000 ÷ 3 = ₱3,666,667

**Step 3 — Collation by Representatives** (Art. 1064):
- GC1 and GC2 inherit by representation of LC2
- They must collate LC2's ₱2,000,000 donation (even though they never received it)
- LC2's line entitlement: ₱3,666,667
- Minus LC2's donation: ₱3,666,667 - ₱2,000,000 = ₱1,666,667 from estate
- GC1: ₱1,666,667 ÷ 2 = ₱833,333 from estate
- GC2: ₱833,333 from estate

**Step 4 — Other Heirs**:
- LC1: ₱3,666,667 from estate
- LC3: ₱3,666,667 from estate

**Verification**: ₱3,666,667 + ₱833,333 + ₱833,333 + ₱3,666,667 = ₱9,000,000 ✓

**Narrative (GC1)**:
> **GC1 (grandchild, by representation)** receives **₱833,333 from the estate**. GC1 inherits by right of representation of predeceased parent LC2 (Arts. 970, 981). Under Art. 1064, grandchildren inheriting by representation must collate all donations their parents would have been obliged to bring, even if they never received the property. LC2 received ₱2,000,000 from the decedent during lifetime. The collation-adjusted estate is ₱11,000,000, giving LC2's line ₱3,666,667. After deducting LC2's ₱2,000,000 donation, ₱1,666,667 remains for GC1 and GC2, split equally at ₱833,333 each.

---

### Example 5: Donor-Exempted Collation (Art. 1062) — Inofficiousness Still Applies

**Facts**: E_death = ₱6,000,000. 2 legitimate children (LC1, LC2). No spouse. Decedent donated ₱5,000,000 to LC1 with express declaration: "This donation shall not be subject to collation." No will.

**Step 1 — Collation Check**:
- Donation is expressly exempted from collation per Art. 1062
- BUT: is it inofficious?

**Step 2 — Inofficiousness Check**:
- Even exempt donations must be checked for inofficiousness
- E_adj = ₱6,000,000 + ₱5,000,000 = ₱11,000,000 (still add for inofficiousness computation)
- Per child entitlement: ₱11,000,000 ÷ 2 = ₱5,500,000
- LC1 received ₱5,000,000 < ₱5,500,000 → NOT inofficious

**Step 3 — Distribution** (exempt collation means donation is treated as FP gift):
- Since exempt from collation, LC1's donation is NOT deducted from share
- Intestate distribution: ₱6,000,000 ÷ 2 = ₱3,000,000 each
- LC1 total: ₱3,000,000 (estate) + ₱5,000,000 (donation) = ₱8,000,000
- LC2 total: ₱3,000,000

**Note**: The exemption from collation creates inequality. LC1 gets ₱8M vs LC2's ₱3M. This is the donor's intent per Art. 1062 — the donation is effectively a gift from the free portion.

**When It Would Be Inofficious**: If the donation were ₱8,000,000 instead:
- E_adj = ₱6,000,000 + ₱8,000,000 = ₱14,000,000
- LC2's legitime = ½ × ₱14,000,000 ÷ 2 = ₱3,500,000
- LC2 can only get ₱3,000,000 from actual estate < ₱3,500,000 legitime
- Donation is inofficious by ₱500,000 → LC1 must return ₱500,000 despite exemption

---

## Data Model Additions

### CollationInput Struct (Engine Input)

```
struct CollationInput {
    donations: List<Donation>
}

struct Donation {
    id: DonationId
    recipient_heir_id: HeirId?              // null if stranger
    recipient_is_stranger: bool
    value_at_time_of_donation: Amount        // Art. 1071: always use this value
    date: Date                              // For Art. 911(3) reverse-chrono reduction
    description: String
    is_gratuitous: bool                     // Must be gratuitous to be collatable

    // Collatability flags
    is_expressly_exempt: bool               // Art. 1062: donor provided exemption
    is_support_education_medical: bool      // Art. 1067: automatically exempt
    is_customary_gift: bool                 // Art. 1067: automatically exempt
    is_professional_expense: bool           // Art. 1068: conditionally exempt
    professional_expense_parent_required: bool  // Art. 1068: parent required collation
    professional_expense_imputed_savings: Amount? // Art. 1068: deduction for home-living
    is_joint_from_both_parents: bool        // Art. 1072: split ½ each estate
    is_to_child_spouse_only: bool           // Art. 1066 ¶1: exempt
    is_joint_to_child_and_spouse: bool      // Art. 1066 ¶2: ½ collatable
    is_wedding_gift: bool                   // Art. 1070: special 1/10 threshold
    is_debt_payment_for_child: bool         // Art. 1069: collatable
    is_election_expense: bool               // Art. 1069: collatable
    is_fine_payment: bool                   // Art. 1069: collatable
}
```

### CollationResult Struct (Engine Output)

```
struct CollationResult {
    collation_adjusted_estate: Amount       // E_adj = net_estate + collatable_sum
    collatable_donations: List<Donation>    // Filtered list of collatable donations
    non_collatable_donations: List<Donation>
    collatable_sum: Amount                  // Total value of collatable donations

    imputation_results: List<ImputationResult>  // Per-heir imputation
    stranger_donations_total: Amount        // Total stranger donations → FP
    excess_over_legitime_total: Amount      // Sum of heir donation excesses → FP

    inofficious: bool                       // Whether any donation is inofficious
    inofficious_amount: Amount              // Total inofficious excess
    donation_reductions: List<DonationReduction>? // Art. 911(3) reductions if inofficious

    disputes: List<CollationDispute>        // Uncertain items (Art. 1077)

    partition_allocations: List<PartitionAllocation> // Per-heir from-estate amounts
}

struct ImputationResult {
    heir_id: HeirId
    gross_entitlement: Amount               // Legitime or intestate share (on E_adj)
    donations_received: Amount              // Total donations at time given
    charged_to_legitime: Amount             // Min(donations, legitime)
    charged_to_fp: Amount                   // Excess over legitime (if any)
    net_from_estate: Amount                 // gross_entitlement - donations (≥ 0)
    is_excess: bool                         // donations > gross_entitlement
    excess_amount: Amount                   // donations - gross_entitlement (if excess)
}

struct DonationReduction {
    donation_id: DonationId
    original_value: Amount
    reduced_by: Amount
    remaining_value: Amount
    return_required: Amount                 // Donee must return this to estate
}
```

---

## Edge Cases

### 1. All Children Received Equal Donations

If all compulsory heirs received equal donations, collation still applies but produces no net change in distribution — each heir's deduction is the same. The computation is still necessary because the collation-adjusted estate may reveal inofficious testamentary dispositions.

### 2. Donation to Non-Heir Compulsory Heir (e.g., Ascendant When Descendants Exist)

If the decedent donated to a parent during lifetime, but the parent is NOT a compulsory heir (because descendants survive), the parent is treated as a "stranger" for charging purposes (Art. 909 ¶2) — donation charged to FP.

### 3. Repudiation + Inofficious Donation (Art. 1062 ¶2)

If a donee repudiates the inheritance:
- No collation obligation (Art. 1062)
- BUT if the donation is inofficious (impairs other heirs' legitimes), it must still be reduced
- The repudiating donee keeps only the non-inofficious portion

### 4. Multiple Donations to Same Heir Over Time

All donations to the same heir are summed and imputed together against that heir's share. If the heir received 5 donations totaling ₱3M, the ₱3M is charged as one block against their legitime, then excess against FP.

### 5. Donation of Specific Property Valued Below Market

Art. 1071 uses "value at the time of the donation." If the donor and donee agreed on a below-market value, the actual market value at donation time should be used (to prevent evasion). The engine should accept the donation-time fair market value as input.

### 6. Donation That No Longer Exists (Destroyed, Sold)

Per Art. 1071: "Their subsequent increase or deterioration and even their total loss or destruction, be it accidental or culpable, shall be for the benefit or account and risk of the donee." The donation is STILL collated at its value when given, even if the property was destroyed or sold. The donee bears the risk.

### 7. Collation in Testate vs Intestate: Different Base Effects

In testate succession, the collation-adjusted estate affects both the legitime AND free portion computations. A large donation can reduce FP_disposable to zero, making all testamentary dispositions inofficious.

In intestate succession, the collation-adjusted estate affects the total distributable amount. Each heir's intestate share is computed on E_adj, then donations are deducted. There is no "free portion" to consume.

### 8. Donor Exemption + Testate Scenario

If the donor exempted a donation from collation (Art. 1062) but left a will:
- The donation is NOT added to the estate base for legitime computation
- BUT the donation IS still checked for inofficiousness — if it impairs compulsory heirs' legitimes computed on the non-collated estate, it must be reduced
- This creates a subtlety: the estate base for legitime is net_estate (without the exempted donation), but the inofficiousness check must consider what the compulsory heirs would receive

### 9. Art. 1063: Testamentary Property and Collation

Property left by will is NOT collatable by default — the testator's will already accounts for it. But the testator can expressly require collation of testamentary property. The legitime must remain unimpaired regardless.

### 10. Collation When No Compulsory Heirs

Art. 1061 requires collation only when the donee "succeeds with other compulsory heirs." If there are no compulsory heirs (scenario T13/I15), collation does not apply — the entire estate is freely disposable.

### 11. Circular Dependency: Wedding Gifts (Art. 1070)

Wedding gifts are checked against 1/10 of FP_disposable. But FP_disposable depends on the estate base, which depends on collation. The resolution: wedding gifts are NOT collated (Art. 1067 exempts "customary gifts"), so they don't affect the estate base. The 1/10 threshold is computed on the FP_disposable derived from the non-wedding-gift estate base.

### 12. Donation to Illegitimate Child + Cap Rule Interaction

An IC received a donation. The donation is charged to IC's legitime (Art. 910). But IC's legitime may be capped (Art. 895 ¶3). If the donation exceeds the capped legitime, the excess is charged to FP. If FP is already zero due to the cap, the donation is inofficious.

---

## Test Cases

### Collatability Determination

| # | Test | Donation Details | Expected |
|---|------|-----------------|----------|
| T-C1 | Basic collation | ₱2M to LC1, no exemption | Collatable |
| T-C2 | Donor-exempt | ₱2M to LC1, expressly exempt | Not collatable (but check inofficiousness) |
| T-C3 | Support expense | ₱500K for LC1's medical bills | Not collatable (Art. 1067) |
| T-C4 | Education expense | ₱200K for LC1's college tuition | Not collatable (Art. 1067) |
| T-C5 | Professional career (no parent directive) | ₱1M for LC1's law school | Not collatable (Art. 1068 default) |
| T-C6 | Professional career (parent required) | ₱1M for LC1's law school, parent specified collation | Collatable, minus imputed home savings |
| T-C7 | Professional career (impairs legitime) | ₱5M for LC1's MBA abroad, impairs co-heirs | Collatable (Art. 1068 override) |
| T-C8 | Debt payment | ₱300K paid for LC1's car loan | Collatable (Art. 1069) |
| T-C9 | Election expense | ₱1M for LC1's campaign | Collatable (Art. 1069) |
| T-C10 | Customary gift | ₱50K birthday gift | Not collatable (Art. 1067) |
| T-C11 | Joint to child+spouse | ₱4M to LC1 and spouse jointly | ₱2M collatable (Art. 1066 ¶2) |
| T-C12 | To child's spouse only | ₱2M to LC1's spouse | Not collatable (Art. 1066 ¶1) |
| T-C13 | Stranger donation | ₱3M to friend F | Collatable, charged to FP (Art. 909 ¶2) |
| T-C14 | Joint from both parents | ₱6M joint donation | ₱3M in this estate (Art. 1072) |

### Imputation Tests

| # | E_death | Donations | Heirs | Expected |
|---|---------|-----------|-------|----------|
| T-C15 | ₱8M | ₱1.5M to LC1 | 3 LC, no S, intestate | LC1=₱1,667K, LC2=₱3,167K, LC3=₱3,167K |
| T-C16 | ₱6M | ₱4M to LC1 | 2 LC, no S, testate (FP→charity) | LC1=₱0, LC2=₱2.5M, Charity=₱3.5M |
| T-C17 | ₱8M | ₱2M to LC1, ₱1M to LC2 | 3 LC, no S, intestate | LC1=₱1.67M, LC2=₱2.67M, LC3=₱3.67M |
| T-C18 | ₱10M | ₱3M to IC1 | 2 LC + 1 IC, no S, intestate | E_adj=₱13M; unit method 2:1; LC=₱5.2M each, IC=₱2.6M; IC from estate = max(0, ₱2.6M-₱3M) = ₱0 |

### Excess and Inofficiousness Tests

| # | E_death | Donation | Heirs | Expected |
|---|---------|----------|-------|----------|
| T-C19 | ₱2M | ₱8M to LC1 | 2 LC, no S, intestate | E_adj=₱10M; each=₱5M; LC1 owes ₱3M; donation reduced; LC1 net=₱5M, LC2=₱5M |
| T-C20 | ₱4M | ₱6M to LC1 | 2 LC, no S, testate (FP→charity) | E_adj=₱10M; legitime=₱2.5M each; LC1 excess=₱3.5M→FP; FP=₱5M-₃.5M=₱1.5M; charity=₱1.5M |
| T-C21 | ₱1M | ₱9M to LC1 | 2 LC, no S, no will | E_adj=₱10M; each=₱5M; LC1 owes ₱4M; but estate only ₱1M; LC1 returns ₱4M |
| T-C22 | ₱6M | ₱5M to LC1 (exempt) | 2 LC, no S, no will | Not collated but check inofficiousness; E_adj=₱11M; each=₱5.5M; actual estate ₱6M/2=₱3M each; LC1 total=₱3M+₱5M=₱8M > ₱5.5M entitlement → exempt=valid |

### Representation Collation Tests

| # | E_death | Donation | Family | Expected |
|---|---------|----------|--------|----------|
| T-C23 | ₱9M | ₱2M to LC2 (predeceased) | LC1, LC2→(GC1,GC2), LC3 | E_adj=₱11M; per line=₱3.67M; GC line: ₱3.67M-₂M=₱1.67M; GC1=₱833K, GC2=₱833K |
| T-C24 | ₱3M | ₱5M to LC2 (predeceased) | LC1, LC2→(GC1,GC2), LC3 | E_adj=₱8M; per line=₱2.67M; GC line: ₱2.67M-₅M= -₂.33M; GC receives ₱0, donation inofficious by ₱2.33M |

### Wedding Gift Tests

| # | E_death | Wedding Gift | FP_disposable | Expected |
|---|---------|-------------|---------------|----------|
| T-C25 | ₱10M | ₱400K jewelry | ₱5M (T1, 2 LC) | Threshold=₱500K; gift ≤ threshold → not reducible |
| T-C26 | ₱10M | ₱800K jewelry | ₱5M (T1, 2 LC) | Threshold=₱500K; excess=₱300K → reducible by ₱300K |
| T-C27 | ₱10M | ₱200K jewelry | ₱1.25M (T9) | Threshold=₱125K; excess=₱75K → reducible by ₱75K |

### Intestate vs Testate Collation Comparison

| # | E_death | Donation | Heirs | Testate FP→Charity | Intestate |
|---|---------|----------|-------|--------------------|-----------|
| T-C28 | ₱8M | ₱2M to LC1 | 2 LC, S | T: E_adj=₱10M, LC each=₱2.5M, S=₱2.5M, FP=₱2.5M, charity=₱500K | I: E_adj=₱10M, unit method 3 shares, per=₱3.33M, LC1=₱1.33M |

### Edge Case Tests

| # | Test | Expected |
|---|------|----------|
| T-C29 | No compulsory heirs + donation to friend | No collation needed; friend inherits per will/intestate |
| T-C30 | All children received equal ₱1M donations | Collation applies symmetrically; no net redistribution |
| T-C31 | Sole compulsory heir + donation | Art. 1061 requires "with other compulsory heirs"; no collation |
| T-C32 | Repudiation + inofficious donation | Donee keeps non-inofficious portion; excess returned |
| T-C33 | Multiple donations to same heir (3 gifts = ₱5M total) | Sum all: ₱5M imputed as one block |
| T-C34 | Destroyed donated property | Still collated at donation-time value (Art. 1071) |
| T-C35 | IC donation + cap rule: IC capped at ₱500K, donation was ₱2M | Excess ₱1.5M→FP; if FP=₱0, inofficious |

---

## Narrative Templates

### Template 1: Basic Collation (Donation Within Legitime)

> **{HeirName} ({relationship})** receives **₱{from_estate} from the estate** (plus ₱{donation_value} previously received as a donation, for a total of ₱{total}). Under Art. 1061 of the Civil Code, the ₱{donation_value} inter vivos donation must be collated (added back) into the estate for computation purposes. The collation-adjusted estate is ₱{e_adj}. {Heir}'s {testate:"legitime is" | intestate:"share is"} ₱{gross_entitlement}. Under Art. 909, the donation is charged against {heir}'s {legitime | share}, leaving ₱{from_estate} to be received from the actual estate.

### Template 2: Donation Exceeds Share (No Return Needed)

> **{HeirName} ({relationship})** receives **₱0 from the estate**, having already received ₱{donation_value} as a donation exceeding {heir}'s ₱{gross_entitlement} {legitime | share}. Under Art. 909, the excess of ₱{excess} is charged to the free portion. {HeirName}'s total inheritance (donation + estate) is ₱{donation_value}.

### Template 3: Inofficious Donation (Return Required)

> **{HeirName} ({relationship})** must **return ₱{return_amount} to the estate**. The ₱{donation_value} inter vivos donation exceeds {heir}'s share of ₱{gross_entitlement} by ₱{excess}. Under Arts. 909 and 911, donations that impair co-heirs' legitimes are inofficious and must be reduced. After returning ₱{return_amount}, {heir}'s net inheritance is ₱{net_total}.

### Template 4: Representation Collation (Art. 1064)

> **{GrandchildName} (grandchild, by representation)** receives **₱{from_estate} from the estate**. Under Art. 1064, grandchildren inheriting by representation must collate donations their parent would have been obliged to bring. {ParentName} received ₱{parent_donation} during the decedent's lifetime. The collation-adjusted estate is ₱{e_adj}, giving {parent}'s line ₱{line_share}. After deducting the ₱{parent_donation} donation, ₱{net_line_share} remains, divided among {count} grandchildren at ₱{per_gc} each.

### Template 5: Donor-Exempt Donation (Art. 1062)

> **{HeirName} ({relationship})** receives **₱{from_estate} from the estate** plus ₱{donation_value} as a non-collatable donation. The decedent expressly exempted this donation from collation under Art. 1062. The donation is treated as a gift from the free portion and is NOT deducted from {heir}'s share. {heir}'s total inheritance is ₱{total}, which is {more/less} than co-heirs' shares — this inequality reflects the decedent's expressed intent.

---

## Pipeline Integration

Collation is integrated into the engine pipeline at **two points**:

### Point 1: Estate Base Computation (Step 2.5, before legitime computation)

```
Step 1:    Classify heirs
Step 1.5:  Build representation lines
Step 2:    Determine concurrence scenario
Step 2.5:  COLLATION — compute collation-adjusted estate (Art. 908)
           Input: net_estate_at_death, all_donations, heirs
           Output: collation_adjusted_estate (E_adj)
           This E_adj is used for ALL subsequent computations
Step 3:    Compute each heir's legitime (using E_adj)
Step 4:    Compute free portion (using E_adj)
```

### Point 2: Distribution Adjustment (Step 6.5, after distribution)

```
Step 5:    Distribute free portion (testate) or intestate shares
Step 6:    Compute gross per-heir amounts
Step 6.5:  COLLATION IMPUTATION — adjust for donations already received
           Input: gross_per_heir, donations_by_heir
           Output: net_per_heir_from_estate, inofficious_flags
           For each heir: from_estate = max(0, gross_entitlement - donations_received)
           Check: sum(from_estate) <= net_estate_at_death (must hold)
           If inofficious: trigger donation reduction (Art. 911)
Step 7:    Generate per-heir narrative explanations (include collation context)
```

### Key Constraint

The collation-adjusted estate (E_adj) must be used consistently throughout the pipeline. Any step that uses "the estate" must use E_adj, not net_estate_at_death. The actual net_estate_at_death is only used at the final partition step to determine how much cash/property is actually available.

---

*Analysis based on Civil Code Arts. 908-912, 1061-1077. Cross-references: free-portion-rules (Art. 908 estate base, Art. 911 reduction), legitime-table (fraction computation on E_adj), heir-concurrence-rules (who must collate), representation-rights (Art. 1064 grandchild collation), intestate-order (intestate collation), testate-validation (inofficiousness detection).*
