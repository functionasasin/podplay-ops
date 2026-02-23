# Spec Fix: Mixed Succession Algorithm

**Aspect**: spec-fix-mixed-succession
**Wave**: 6 (Spec Fixes)
**Priority**: Critical (C1 from spec-review)
**Depends On**: computation-pipeline, free-portion-rules, intestate-order, testate-validation

---

## Gap Identified by spec-review

The spec lists "Mixed succession (partial will)" as in-scope (§1.2), defines `SuccessionType.MIXED` (§3.6), and references mixed succession in Step 3's detection. But the spec provides **no pseudocode** for:

1. How to detect that a will disposes of only part of the estate
2. How to compute the undisposed free portion
3. How to distribute the undisposed remainder intestate
4. How to combine testate and intestate shares for heirs who appear in both

This fix adds a complete mixed succession sub-section to spec §7.

---

## Legal Basis

| Article | What It Governs |
|---------|----------------|
| **Art. 960(2)** | "Legal succession takes place... when the will does not institute an heir to, or dispose of all the property belonging to the testator. In such case, legal succession shall take place only with respect to the property of which the testator has not disposed." |
| **Art. 851** | "If the testator fails to dispose of all his property, the portion not disposed of shall pass to his legal heirs." |
| **Art. 842** | Testator may dispose of "all his estate or any part of it" |

---

## When Mixed Succession Arises

Mixed succession occurs when a valid will exists but does **not** dispose of the entire estate. Specifically:

1. The will institutes heirs and/or makes legacies/devises that consume **less than the full free portion**
2. The remaining undisposed free portion passes intestate (Art. 960(2))
3. Compulsory heirs receive their legitime from the testate portion AND may participate in the intestate portion

**Key distinction**: Mixed succession is about the *will not covering the whole estate*, not about having both testate and intestate heirs. A will that leaves the entire FP to a single person is testate, not mixed.

---

## Detection Algorithm

### How to Determine `will.disposes_of_entire_estate`

```
function determine_will_coverage(
    will: Will,
    estate_base: Money,
    legitime_result: LegitimeResult
) -> WillCoverage {

    // Step 1: Compute the disposable free portion
    fp_disposable = legitime_result.fp_disposable

    // Step 2: Sum all testamentary dispositions that draw from the FP
    //   - Institutions of voluntary heirs (non-compulsory)
    //   - Legacies and devises
    //   - Institutions of compulsory heirs ABOVE their legitime
    //     (the excess above legitime is from FP)
    total_will_dispositions = Money(0)

    for inst in will.institutions:
        heir = resolve_heir(inst.heir)
        if heir.is_compulsory:
            // Compulsory heir: only the EXCESS above legitime comes from FP
            institution_value = compute_institution_value(inst, estate_base)
            heir_legitime = get_heir_legitime(heir, legitime_result)
            fp_portion = max(institution_value - heir_legitime, 0)
            total_will_dispositions += fp_portion
        else:
            // Voluntary heir: entire share comes from FP
            total_will_dispositions += compute_institution_value(inst, estate_base)

    for legacy in will.legacies:
        total_will_dispositions += compute_legacy_value(legacy)

    for devise in will.devises:
        total_will_dispositions += compute_devise_value(devise)

    // Step 3: Check if will has a residuary clause
    //   Art. 851: a residuary institution ("the rest to X") captures
    //   any undisposed portion → makes it fully testate
    has_residuary = any(inst.is_residuary for inst in will.institutions)

    if has_residuary:
        return WillCoverage {
            disposes_of_entire_estate: true,
            total_will_from_fp: fp_disposable,
            undisposed_fp: Money(0),
        }

    // Step 4: Determine coverage
    undisposed_fp = max(fp_disposable - total_will_dispositions, Money(0))

    return WillCoverage {
        disposes_of_entire_estate: undisposed_fp == Money(0),
        total_will_from_fp: total_will_dispositions,
        undisposed_fp: undisposed_fp,
    }
}

struct WillCoverage {
    disposes_of_entire_estate: bool,
    total_will_from_fp: Money,
    undisposed_fp: Money,        // Passes intestate if > 0
}
```

### Detection in Step 3

```
function determine_succession_type(will, coverage):
    if will == null OR will.is_empty:
        return INTESTATE
    elif coverage.disposes_of_entire_estate:
        return TESTATE
    else:
        return MIXED
```

**Important**: The `WillCoverage` computation requires knowing `fp_disposable`, which is computed in Step 5. Therefore, the definitive MIXED detection happens **after** Step 5. Step 3's initial classification may be refined:

- Step 3 (preliminary): `will != null → TESTATE (tentative)`
- Step 5 (after legitime computation): recheck will coverage → may upgrade to MIXED

---

## Distribution Algorithm

### Mixed Succession Distribution (Step 7)

```
function distribute_mixed_succession(
    net_estate: Money,
    estate_base: Money,
    will: Will,
    heirs: List<Heir>,
    lines: LineResult,
    legitime_result: LegitimeResult,
    validation: ValidationResult,
    will_coverage: WillCoverage,
    testate_scenario: String,      // T1-T15
    intestate_scenario: String     // I1-I15
) -> DistributionResult {

    shares = Map<Heir, HeirShare>()

    // === PHASE 1: Allocate compulsory heirs' legitimes ===
    // Identical to testate distribution Step 7a
    for heir in compulsory_heirs(heirs):
        legitime = get_heir_legitime(heir, legitime_result, lines)
        shares[heir] = HeirShare {
            from_legitime: legitime,
            from_free_portion: Money(0),
            from_intestate: Money(0),
            basis: get_legitime_basis(heir, testate_scenario),
        }

    // === PHASE 2: Distribute testamentary FP dispositions ===
    // The will's dispositions consume part of the FP
    will_dispositions = get_effective_dispositions(will, validation)
    fp_consumed = Money(0)

    for disp in will_dispositions:
        recipient = resolve_heir(disp.heir)
        amount = compute_disposition_value(disp, estate_base, validation)

        if recipient in shares:
            shares[recipient].from_free_portion += amount
        else:
            shares[recipient] = HeirShare {
                from_legitime: Money(0),
                from_free_portion: amount,
                from_intestate: Money(0),
            }
        fp_consumed += amount

    // === PHASE 3: Distribute undisposed FP intestate ===
    // Art. 960(2): "legal succession shall take place only with respect
    // to the property of which the testator has not disposed"
    undisposed_fp = will_coverage.undisposed_fp

    if undisposed_fp > Money(0):
        // Distribute the undisposed portion using intestate rules
        // The SAME heirs who received legitime also participate here
        intestate_shares = compute_intestate_distribution(
            undisposed_fp,
            heirs,
            lines
        )

        // Merge intestate shares into existing shares
        for (heir, intestate_amount) in intestate_shares:
            if heir in shares:
                shares[heir].from_intestate += intestate_amount
            else:
                shares[heir] = HeirShare {
                    from_legitime: Money(0),
                    from_free_portion: Money(0),
                    from_intestate: intestate_amount,
                }

    return DistributionResult {
        shares: shares,
        succession_type: MIXED,
        testate_scenario: testate_scenario,
        intestate_scenario: intestate_scenario,
        fp_consumed_by_will: fp_consumed,
        fp_passed_intestate: undisposed_fp,
    }
}
```

### Share Merging Rules

When a compulsory heir appears in both the testate and intestate portions:

1. Their **legitime** is fixed (from Step 5) — always the testate fraction
2. Their **testamentary FP share** (if any) is from the will
3. Their **intestate share** of the undisposed FP is computed using intestate rules on just the undisposed amount
4. **Total** = legitime + testamentary FP + intestate share

```
struct HeirShare {
    from_legitime: Money,           // Step 5 (testate computation)
    from_free_portion: Money,       // Will dispositions
    from_intestate: Money,          // Undisposed FP distributed intestate
    total: Money,                   // Sum of all three
    basis: List<String>,            // Legal citations for each component
}
```

### Which Intestate Scenario Governs the Undisposed FP?

The intestate scenario for the undisposed FP is determined by the **same heir pool** that determines the testate scenario. The concurrence of heirs doesn't change — only the amount being distributed changes.

However, **non-compulsory heirs may also participate** in the intestate portion:
- Collateral relatives (siblings, nephews/nieces) can inherit from the undisposed FP under I12-I14 if the spouse concurs
- If NO compulsory heirs exist at all, the entire estate is FP (T13), and any undisposed portion goes to collaterals or the State

---

## Interaction with Other Pipeline Steps

### Step 6 (Testate Validation) Still Applies

The testate validation pipeline runs on the will's dispositions:
- Preterition check: Still applies — if a compulsory heir is totally omitted from the will, the institution is annulled (Art. 854), and the entire estate distributes intestate. This converts MIXED → INTESTATE_BY_PRETERITION.
- Disinheritance: Still validated per Arts. 915-922
- Inofficiousness: Checked against FP_disposable (not just the disposed portion)
- Underprovision (Art. 855): A compulsory heir given less than their legitime recovers from the undisposed estate first

### Step 8 (Collation) Applies to Full Estate

Collation is based on the full collation-adjusted estate base, not just the testate or intestate portion. Donation imputation works the same way.

### Step 9 (Vacancy Resolution) Applies Normally

If a testamentary heir's share becomes vacant, the resolution priority chain (substitution → representation → accretion → intestate) applies to the testamentary portion. The intestate portion resolves per normal intestate accretion.

---

## Worked Example

### Estate: ₱10,000,000 | 2 LC + Spouse | Will gives ₱1,000,000 to charity

**Step 1-2**: Classify heirs. n=2 legitimate child lines, spouse present.

**Step 3**: Will exists → tentatively TESTATE.

**Step 5**: Compute legitimes (scenario T3, n=2):
| Heir | Fraction | Amount |
|------|----------|--------|
| LC1 | 1/(2×2) = ¼ | ₱2,500,000 |
| LC2 | 1/(2×2) = ¼ | ₱2,500,000 |
| Spouse | 1/(2×2) = ¼ | ₱2,500,000 |
| FP_disposable | (n−1)/(2n) = ¼ | ₱2,500,000 |

**Will coverage**: Will disposes ₱1,000,000 of ₱2,500,000 FP → undisposed ₱1,500,000 → **MIXED**.

**Step 7 — Phase 1** (Legitimes):
| Heir | Legitime |
|------|----------|
| LC1 | ₱2,500,000 |
| LC2 | ₱2,500,000 |
| Spouse | ₱2,500,000 |

**Step 7 — Phase 2** (Testamentary FP):
| Recipient | FP Amount |
|-----------|-----------|
| Charity | ₱1,000,000 |

**Step 7 — Phase 3** (Undisposed FP = ₱1,500,000, intestate I2):
- I2 formula: each gets `₱1,500,000 / (2 + 1) = ₱500,000`

| Heir | Intestate Share |
|------|----------------|
| LC1 | ₱500,000 |
| LC2 | ₱500,000 |
| Spouse | ₱500,000 |

**Final Distribution**:
| Heir | Legitime | Testamentary FP | Intestate | Total |
|------|----------|----------------|-----------|-------|
| LC1 | ₱2,500,000 | — | ₱500,000 | ₱3,000,000 |
| LC2 | ₱2,500,000 | — | ₱500,000 | ₱3,000,000 |
| Spouse | ₱2,500,000 | — | ₱500,000 | ₱3,000,000 |
| Charity | — | ₱1,000,000 | — | ₱1,000,000 |
| **Total** | **₱7,500,000** | **₱1,000,000** | **₱1,500,000** | **₱10,000,000** |

**Verification**: ₱3,000,000 + ₱3,000,000 + ₱3,000,000 + ₱1,000,000 = ₱10,000,000 ✓

### Narrative for LC1

> **LC1 (legitimate child)** receives **₱3,000,000**. As a legitimate child (Art. 887(1)), LC1 is a compulsory heir entitled to an equal share of the collective legitime of one-half (½) of the estate. Under Art. 888 of the Civil Code, the legitime of 2 legitimate child lines is ₱5,000,000, giving each line ₱2,500,000. Additionally, the will does not dispose of the entire free portion — ₱1,500,000 remains undisposed. Under Art. 960(2), this undisposed portion passes by intestate succession, where LC1 receives ₱500,000 as an equal share with the other heir and surviving spouse (Art. 996).

---

## Edge Cases

### 1. Will With Only Legacies (No Institution of Heirs)

A will that makes only legacies/devises but does not institute heirs → Art. 854 inapplicable (nothing to annul). The legacies are honored from the FP; the remainder is intestate → always MIXED.

### 2. Residuary Clause Captures Everything

If the will has a residuary institution ("I leave the rest of my estate to X"), the entire FP is disposed of → TESTATE, not MIXED. The `determine_will_coverage()` function detects this.

### 3. Will Disposes of Exactly the Full FP

If testamentary dispositions exactly equal FP_disposable → TESTATE (undisposed_fp = 0). Boundary case: no mixed succession.

### 4. Preterition Converts MIXED to Intestate

If preterition is detected in Step 6, all institutions are annulled. The surviving legacies/devises are checked for inofficiousness; the rest distributes intestate. The succession type becomes INTESTATE_BY_PRETERITION (not MIXED).

### 5. Inofficious Disposition in Mixed Succession

If the will's dispositions exceed FP_disposable, the excess must be reduced per Art. 911 before determining the undisposed remainder. After reduction, if any FP remains undisposed → still MIXED.

### 6. Non-Compulsory Heirs in Intestate Portion

Collateral relatives (siblings, nephews/nieces) may participate in the intestate distribution of the undisposed FP if the concurrence rules permit (e.g., I12: spouse + siblings get ½ each of the undisposed FP).

### 7. Empty Will (No Valid Dispositions)

If a will exists but all dispositions are invalid (all lapsed, all conditions failed, etc.), the entire estate distributes intestate → INTESTATE, not MIXED.

---

## Changes to Spec

### §7.5 — New Section: Mixed Succession (Art. 960(2))

Add the detection algorithm, 3-phase distribution algorithm, share-merging rules, and worked example as a new §7.5 after §7.4 (Iron Curtain Rule).

### §2 — Pipeline Architecture Note

Add a note that succession type detection may be refined after Step 5: Step 3 makes a preliminary classification, which is updated to MIXED after Step 5 confirms that the will does not dispose of the full FP.

### §3.6 — InheritanceShare Update

Confirm that `InheritanceShare.from_intestate` field captures the intestate portion in mixed succession. This field already exists in the data model.

---

## Test Implications

| # | Test | E | Heirs | Will | Expected |
|---|------|---|-------|------|----------|
| 1 | Basic mixed | ₱10M | 2 LC + S | ₱1M to charity | MIXED; LC1=₱3M, LC2=₱3M, S=₱3M, Charity=₱1M |
| 2 | Legacy-only will | ₱10M | 1 LC | ₱2M legacy | MIXED; LC=₱8M (₱5M legitime + ₱3M intestate), Legatee=₱2M |
| 3 | Residuary clause | ₱10M | 2 LC + S | ₱1M to charity, rest to friend | TESTATE; friend gets FP−₱1M |
| 4 | Dispositions = FP | ₱10M | 1 LC | ₱5M to friend | TESTATE; LC=₱5M, friend=₱5M |
| 5 | Preterition kills mixed | ₱10M | 2 LC (1 omitted) | ₱3M to charity | INTESTATE_BY_PRETERITION |
| 6 | Inofficious then mixed | ₱10M | 1 LC + S | ₱4M legacy (FP=₱2.5M) | Reduce to ₱2.5M; undisposed=₱0 → TESTATE after reduction |
| 7 | Collaterals get undisposed | ₱10M | S + 2 siblings | ₱2M to charity | MIXED; S=₱5M legitime, charity=₱2M, undisposed ₱3M → S gets ₱1.5M + siblings get ₱1.5M |

---

*Analysis based on Civil Code Arts. 842, 851, 960(2), free-portion-rules analysis (§7: Mixed Succession), computation-pipeline analysis (Step 7c), intestate-order analysis (all 15 scenarios). Cross-references: testate-validation (preterition interaction), collation (full-estate base), accretion-rules (vacancy resolution).*
