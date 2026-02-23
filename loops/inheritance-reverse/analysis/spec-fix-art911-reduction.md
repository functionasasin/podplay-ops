# Spec Fix: Art. 911 Three-Phase Reduction Pseudocode

**Aspect**: spec-fix-art911-reduction
**Wave**: 6 (Spec Fixes)
**Gap**: C3 from spec-review — §9 described Art. 911 reduction phases as a bullet list but provided no pseudocode
**Source Analyses**: `analysis/testate-validation.md` (complete algorithm), `analysis/free-portion-rules.md` (reduction priority and Art. 912)

---

## Problem

The spec's §9 Check 4 (Inofficiousness) contained only a brief outline:

```
Art. 911 three-phase reduction:
- Phase 1a: Non-preferred legacies/devises (pro rata)
- Phase 1b: Preferred legacies/devises (testator-designated)
- Phase 2: Voluntary institutions (pro rata)
- Phase 3: Donations (reverse chronological, most recent first)

Art. 912 indivisible realty: When a devise must be partially reduced:
- If reduction < ½ of property value → devisee keeps property
- If reduction ≥ ½ → compulsory heirs take property
```

A developer implementing testate validation would not know:
1. How to detect inofficiousness (what inputs, what comparison)
2. The exact pro rata calculation within each phase (ratio formula, iteration)
3. The critical distinction between pro rata (Phases 1-2) and sequential (Phase 3) reduction
4. When to stop (remaining excess tracking)
5. What "preferred" means (Art. 911 ¶2 testator-designated preference)
6. The exact ½ threshold semantics for Art. 912 (inclusive on which side?)
7. How cash reimbursement is distributed among multiple compulsory heirs
8. The Art. 911 ¶3 usufruct/annuity option and when to flag for manual review

## Fix Applied

Replaced the brief outline in §9 Check 4 with:

### 1. Inofficiousness Detection

Added the triggering condition with variable definitions:
- `excess = total_testamentary_dispositions + total_collatable_donations - FP_disposable`
- Defined what each term means (sum of legacies + devises + voluntary institutions, collatable donations at donation-time value, FP after all legitimes)

### 2. §9.1 — `reduce_inofficious()` Function (Art. 911)

Complete pseudocode (~80 lines) with:

- **Phase 1a**: Separate non-preferred legacies/devises, compute `ratio = min(remaining / non_pref_total, 1)`, reduce each pro rata
- **Phase 1b**: Only entered if non-preferred fully consumed (`remaining > 0`), same pro rata logic on preferred dispositions
- **Phase 2**: Filter voluntary institutions (non-compulsory heirs), reduce pro rata
- **Phase 3**: Sort donations by date DESCENDING, reduce sequentially (NOT pro rata — each donation fully consumed before moving to next)
- **Result**: `ReductionResult` with reductions list, total reduced, unresolved excess, phases used

Inline comments quote Art. 911 ¶1 and ¶2 text for legal traceability.

### 3. Phase Summary Table

| Phase | What | Method | Basis |
|-------|------|--------|-------|
| 1a | Non-preferred legacies/devises | Pro rata | Art. 911 ¶2 |
| 1b | Preferred legacies/devises | Pro rata (after 1a exhausted) | Art. 911 ¶2 |
| 2 | Voluntary institutions | Pro rata | Art. 911 ¶1 |
| 3 | Inter vivos donations | Reverse chronological (sequential) | Art. 911 ¶1 |

### 4. Critical Distinctions Section

Documented:
- Pro rata vs sequential reduction difference
- Early termination when remaining = 0
- Full annulment indicator (remaining_amount = 0)
- Insolvency edge case (unresolved_excess > 0 → MANUAL_REVIEW flag)
- Preferred vs non-preferred definition (testator's express direction per Art. 911 ¶2)
- Art. 911 ¶3 usufruct/annuity option → USUFRUCT_ANNUITY_OPTION manual review flag

### 5. §9.2 — `resolve_indivisible_realty()` Function (Art. 912)

Complete pseudocode (~30 lines) with:
- ½-value threshold computation
- `reduction_amount < half_value` → devisee keeps, reimburses in cash
- `reduction_amount ≥ half_value` (inclusive) → compulsory heirs take, reimburse devisee
- Cash reimbursement distributed pro rata by legitime share among multiple compulsory heirs
- Independent resolution per devise

### 6. Data Structures

Added to §9:
- `Reduction` struct (target, phase, original/reduction/remaining amounts, legal basis)
- `ReductionPhase` enum (PHASE_1A, PHASE_1B, PHASE_2, PHASE_3)
- `ReductionResult` struct (reductions list, total reduced, unresolved excess, phases used)
- `IndivisibleRealtyResult` struct (property awarded to whom, cash reimbursement)
- `CashReimbursement` struct (payer, payees, amount)

## Worked Example

Estate = ₱10,000,000. Two legitimate children (LC1, LC2). Will leaves:
- Legacy A (non-preferred) to friend: ₱2,000,000
- Legacy B (preferred) to cousin: ₱1,500,000
- Institution of charity (voluntary heir): ₱1,000,000

Total compulsory legitimes: LC1 = ₱2,500,000, LC2 = ₱2,500,000 → total = ₱5,000,000
FP_disposable = ₱10,000,000 - ₱5,000,000 = ₱5,000,000
Total dispositions = ₱2,000,000 + ₱1,500,000 + ₱1,000,000 = ₱4,500,000
Excess = ₱4,500,000 - ₱5,000,000 = -₱500,000 → **no inofficiousness** (FP covers all dispositions)

Now change: add a donation to stranger of ₱3,000,000 (collatable).
Adjusted estate base (Art. 908) = ₱10,000,000 + ₱3,000,000 = ₱13,000,000
Total legitimes = ₱6,500,000. FP_disposable = ₱6,500,000.
Testamentary dispositions = ₱4,500,000. Donations = ₱3,000,000. Total = ₱7,500,000.
Excess = ₱7,500,000 - ₱6,500,000 = ₱1,000,000.

**Phase 1a**: Non-preferred Legacy A = ₱2,000,000. Ratio = min(₱1,000,000 / ₱2,000,000, 1) = 0.5.
- Legacy A reduced by ₱1,000,000 → remaining ₱1,000,000.
- Remaining excess = ₱0. **STOP**.

Legacy B (preferred) untouched at ₱1,500,000. Charity untouched at ₱1,000,000. Donation untouched.

## Verification

- [ ] Complete pseudocode with types for all function parameters and returns: **YES**
- [ ] Inline legal citations (article + paragraph): **YES** (Art. 911 ¶1, ¶2, ¶3; Art. 912)
- [ ] Phase separation logic with explicit stopping condition: **YES** (`remaining <= 0`)
- [ ] Pro rata vs sequential distinction documented: **YES** (critical distinctions section)
- [ ] Art. 912 ½ threshold boundary behavior specified: **YES** (≥ ½ → compulsory heirs take, inclusive)
- [ ] Data structures fully defined: **YES** (Reduction, ReductionPhase, ReductionResult, IndivisibleRealtyResult, CashReimbursement)
- [ ] Manual review flags for non-deterministic scenarios: **YES** (USUFRUCT_ANNUITY_OPTION, insolvency)
