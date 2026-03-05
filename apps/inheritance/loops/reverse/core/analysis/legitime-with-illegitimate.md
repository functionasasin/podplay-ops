# Legitime with Illegitimate Children — Half-Share Computation Deep Dive

**Aspect**: legitime-with-illegitimate
**Wave**: 3 (Legitime Computation)
**Primary Legal Basis**: Art. 895 (Civil Code), Art. 176 (Family Code), Arts. 888, 892, 897, 983, 999
**Depends On**: compulsory-heirs-categories, heir-concurrence-rules, illegitimate-children-rights, legitime-table

---

## Overview

This analysis is the **definitive computation reference** for every scenario where legitimate and illegitimate children concur. It builds on:
- `legitime-table`: the 15 testate scenario fractions (T4, T5a, T5b)
- `illegitimate-children-rights`: the half-share rule, cap rule, and intestate ratio method

This document synthesizes those into a single **computation algorithm** that handles every sub-case, with worked examples at every combination of `n` (legitimate child lines) and `m` (illegitimate children), and a formal comparison of testate vs. intestate outcomes.

---

## Legal Basis

### The Half-Share Rule

**FC Art. 176** (superseding Civil Code Art. 895 ¶¶1-2):
> "The legitime of each illegitimate child shall consist of one-half of the legitime of a legitimate child."

This single sentence governs all computations. No distinction is made between types of illegitimate children.

### The Cap Rule

**Art. 895 ¶3** (still in force):
> "The legitime of the illegitimate children shall be taken from the portion of the estate at the free disposal of the testator, provided that in no case shall the total legitime of such illegitimate children exceed that free portion, and that the legitime of the surviving spouse must first be fully satisfied."

Three constraints encoded:
1. **Source**: Illegitimate children's legitime comes from the **free portion**, not from the legitimate children's ½
2. **Cap**: Total illegitimate legitime ≤ remaining free portion
3. **Priority**: Surviving spouse's legitime is satisfied **first** from the free portion

### Intestate Equivalents

| Article | Rule |
|---------|------|
| **Art. 983** | "If illegitimate children survive with legitimate children, the shares of the former shall be in the proportions prescribed by Article 895." |
| **Art. 999** | "When the widow or widower survives with legitimate children or descendants and illegitimate children or their descendants... such widow or widower shall be entitled to the same share as that of a legitimate child." |

**Key**: In intestate, Art. 983 references Art. 895's **ratio** (1:2) but NOT the cap rule. The cap is a testate-only constraint because intestate succession distributes the **entire estate** proportionally — there is no free portion concept.

---

## The Two Computation Regimes

### Regime 1: Testate (Cap Rule Applies)

When legitimate and illegitimate children concur in testate succession:

```
INPUTS:
  E     = net distributable estate
  n     = count of legitimate child lines (including represented lines)
  m     = count of illegitimate children
  has_S = whether surviving spouse is present

STEP 1: Legitimate children's collective legitime
  L_collective = E × ½                    // Art. 888: always ½, never reduced
  L_per_child  = L_collective / n          // Equal division among lines

STEP 2: Free portion
  FP = E - L_collective = E × ½           // Always ½ when descendants present

STEP 3: Spouse's legitime (if present), charged to FP
  if has_S:
    if n == 1:
      S = E × ¼                           // Art. 892 ¶1
    else:  // n ≥ 2
      S = L_per_child                      // Art. 892 ¶2 + Art. 897
  else:
    S = 0

STEP 4: Remaining FP after spouse
  FP_remaining = FP - S

STEP 5: Compute illegitimate children's uncapped legitime
  IC_per_child_uncapped = L_per_child × ½   // FC Art. 176: half of one legitimate child's share
  IC_total_uncapped     = m × IC_per_child_uncapped

STEP 6: Apply cap rule (Art. 895 ¶3)
  if IC_total_uncapped > FP_remaining:
    IC_total  = FP_remaining               // CAPPED
    IC_per_child = FP_remaining / m
    cap_applied = true
  else:
    IC_total  = IC_total_uncapped          // UNCAPPED
    IC_per_child = IC_per_child_uncapped
    cap_applied = false

STEP 7: Final free portion (disposable by will)
  FP_disposable = FP_remaining - IC_total

OUTPUT:
  { L_per_child, S, IC_per_child, FP_disposable, cap_applied }
```

### Regime 2: Intestate (Ratio Method, No Cap)

When legitimate and illegitimate children concur in intestate succession:

```
INPUTS:
  E     = net distributable estate
  n     = count of legitimate child lines
  m     = count of illegitimate children
  has_S = whether surviving spouse is present

STEP 1: Assign units
  legitimate_unit  = 2    // Base unit
  illegitimate_unit = 1   // Art. 895/983: ½ of legitimate
  spouse_unit = 2 if has_S else 0  // Art. 999: same as legitimate child

STEP 2: Total units
  total_units = (n × legitimate_unit) + (m × illegitimate_unit) + spouse_unit
              = (2n) + m + (2 if has_S else 0)

STEP 3: Per-unit value
  per_unit = E / total_units

STEP 4: Per-heir shares
  L_per_child  = per_unit × 2    // Each legitimate line gets 2 units
  IC_per_child = per_unit × 1    // Each illegitimate child gets 1 unit
  S            = per_unit × 2    // Spouse gets 2 units (if present)

VERIFICATION:
  IC_per_child / L_per_child = 1/2  ✓  (half-share ratio preserved)
  S / L_per_child = 1               ✓  (spouse = one legitimate child)

OUTPUT:
  { L_per_child, S, IC_per_child }
  // No FP_disposable — entire estate distributed
```

---

## Complete Worked Examples: Every Sub-Scenario

### Sub-Scenario A: n=2, m=1, no spouse (T4, uncapped)

**Estate**: ₱10,000,000

**Testate**:
| Step | Computation | Result |
|------|------------|--------|
| L_collective | ₱10M × ½ | ₱5,000,000 |
| L_per_child | ₱5M / 2 | ₱2,500,000 |
| FP | ₱10M × ½ | ₱5,000,000 |
| IC_uncapped | ₱2.5M × ½ | ₱1,250,000 |
| Cap check | ₱1.25M ≤ ₱5M | No cap |
| FP_disposable | ₱5M - ₱1.25M | ₱3,750,000 |

| Heir | Amount | Basis |
|------|--------|-------|
| LC1 | ₱2,500,000 | Art. 888 |
| LC2 | ₱2,500,000 | Art. 888 |
| IC1 | ₱1,250,000 | FC Art. 176, Art. 895 |
| FP | ₱3,750,000 | Disposable |
| **Total** | **₱10,000,000** | |

**Intestate**:
| Step | Computation | Result |
|------|------------|--------|
| Units | 2(2) + 1 = 5 | 5 units |
| Per unit | ₱10M / 5 | ₱2,000,000 |
| L_per_child | ₱2M × 2 | ₱4,000,000 |
| IC_per_child | ₱2M × 1 | ₱2,000,000 |

| Heir | Amount | Basis |
|------|--------|-------|
| LC1 | ₱4,000,000 | Art. 980, 983 |
| LC2 | ₱4,000,000 | Art. 980, 983 |
| IC1 | ₱2,000,000 | Art. 983, 895 |
| **Total** | **₱10,000,000** | |

**Ratio check**: IC1 intestate ₱2M = ½ of LC1 intestate ₱4M ✓

---

### Sub-Scenario B: n=2, m=1, with spouse (T5b, uncapped)

**Estate**: ₱10,000,000

**Testate**:
| Step | Computation | Result |
|------|------------|--------|
| L_collective | ₱10M × ½ | ₱5,000,000 |
| L_per_child | ₱5M / 2 | ₱2,500,000 |
| FP | ₱10M × ½ | ₱5,000,000 |
| S | = L_per_child (n≥2) | ₱2,500,000 |
| FP_after_S | ₱5M - ₱2.5M | ₱2,500,000 |
| IC_uncapped | ₱2.5M × ½ | ₱1,250,000 |
| Cap check | ₱1.25M ≤ ₱2.5M | No cap |
| FP_disposable | ₱2.5M - ₱1.25M | ₱1,250,000 |

| Heir | Amount | Basis |
|------|--------|-------|
| LC1 | ₱2,500,000 | Art. 888 |
| LC2 | ₱2,500,000 | Art. 888 |
| Spouse | ₱2,500,000 | Art. 892 ¶2, Art. 897 |
| IC1 | ₱1,250,000 | FC Art. 176, Art. 895 |
| FP | ₱1,250,000 | Disposable |
| **Total** | **₱10,000,000** | |

**Intestate** (units: 2+2+1+2 = 7):
| Heir | Units | Amount | Basis |
|------|-------|--------|-------|
| LC1 | 2 | ₱2,857,143 | Art. 980, 983, 999 |
| LC2 | 2 | ₱2,857,143 | Art. 980, 983, 999 |
| S | 2 | ₱2,857,143 | Art. 999 |
| IC1 | 1 | ₱1,428,571 | Art. 983 |
| **Total** | 7 | **₱10,000,000** | |

---

### Sub-Scenario C: n=1, m=1, with spouse (T5a, uncapped boundary)

**Estate**: ₱10,000,000

**Testate**:
| Step | Computation | Result |
|------|------------|--------|
| L_per_child | ₱10M × ½ | ₱5,000,000 |
| FP | ₱10M × ½ | ₱5,000,000 |
| S | ₱10M × ¼ (n=1) | ₱2,500,000 |
| FP_after_S | ₱5M - ₱2.5M | ₱2,500,000 |
| IC_uncapped | ₱5M × ½ | ₱2,500,000 |
| Cap check | ₱2.5M ≤ ₱2.5M | No cap (exactly fills) |
| FP_disposable | ₱2.5M - ₱2.5M | ₱0 |

| Heir | Amount | Basis |
|------|--------|-------|
| LC1 | ₱5,000,000 | Art. 888 |
| Spouse | ₱2,500,000 | Art. 892 ¶1 |
| IC1 | ₱2,500,000 | FC Art. 176, Art. 895 |
| FP | ₱0 | |
| **Total** | **₱10,000,000** | |

**Critical observation**: With n=1, m=1, and a spouse, the free portion is **exactly consumed**. One more illegitimate child and the cap bites.

---

### Sub-Scenario D: n=1, m=3, with spouse (T5a, CAP APPLIES)

**Estate**: ₱10,000,000

**Testate**:
| Step | Computation | Result |
|------|------------|--------|
| L_per_child | ₱10M × ½ | ₱5,000,000 |
| FP | ₱10M × ½ | ₱5,000,000 |
| S | ₱10M × ¼ (n=1) | ₱2,500,000 |
| FP_after_S | ₱5M - ₱2.5M | ₱2,500,000 |
| IC_uncapped (each) | ₱5M × ½ | ₱2,500,000 |
| IC_uncapped (total) | 3 × ₱2.5M | ₱7,500,000 |
| Cap check | ₱7.5M > ₱2.5M | **CAP APPLIES** |
| IC_per_child (capped) | ₱2.5M / 3 | ₱833,333 |
| FP_disposable | ₱0 | |

| Heir | Uncapped | Capped | Reduction |
|------|----------|--------|-----------|
| IC1 | ₱2,500,000 | ₱833,333 | -66.7% |
| IC2 | ₱2,500,000 | ₱833,333 | -66.7% |
| IC3 | ₱2,500,000 | ₱833,333 | -66.7% |

| Heir | Amount | Basis |
|------|--------|-------|
| LC1 | ₱5,000,000 | Art. 888 |
| Spouse | ₱2,500,000 | Art. 892 ¶1 |
| IC1 | ₱833,333 | Art. 895 ¶3 (capped) |
| IC2 | ₱833,333 | Art. 895 ¶3 (capped) |
| IC3 | ₱833,333 | Art. 895 ¶3 (capped) |
| **Total** | **₱10,000,000** | |

**Intestate** (same family, units: 2+1+1+1+2 = 7):
| Heir | Units | Amount |
|------|-------|--------|
| LC1 | 2 | ₱2,857,143 |
| S | 2 | ₱2,857,143 |
| IC1 | 1 | ₱1,428,571 |
| IC2 | 1 | ₱1,428,571 |
| IC3 | 1 | ₱1,428,571 |
| **Total** | 7 | **₱10,000,000** |

**Testate vs. Intestate comparison** (n=1, m=3, with spouse):

| Heir | Testate | Intestate | Difference |
|------|---------|-----------|------------|
| LC1 | ₱5,000,000 | ₱2,857,143 | +₱2,142,857 |
| Spouse | ₱2,500,000 | ₱2,857,143 | -₱357,143 |
| Each IC | ₱833,333 | ₱1,428,571 | -₱595,238 |

**Key insight**: In testate, the legitimate child gets 75% more than in intestate; each illegitimate child gets 42% less. The cap rule dramatically favors legitimate children when there are many illegitimate children.

---

### Sub-Scenario E: n=3, m=5, with spouse (T5b, CAP APPLIES)

**Estate**: ₱12,000,000

**Testate**:
| Step | Computation | Result |
|------|------------|--------|
| L_collective | ₱12M × ½ | ₱6,000,000 |
| L_per_child | ₱6M / 3 | ₱2,000,000 |
| FP | ₱12M × ½ | ₱6,000,000 |
| S | = L_per_child (n≥2) | ₱2,000,000 |
| FP_after_S | ₱6M - ₱2M | ₱4,000,000 |
| IC_uncapped (each) | ₱2M × ½ | ₱1,000,000 |
| IC_uncapped (total) | 5 × ₱1M | ₱5,000,000 |
| Cap check | ₱5M > ₱4M | **CAP APPLIES** |
| IC_per_child (capped) | ₱4M / 5 | ₱800,000 |
| FP_disposable | ₱0 | |

Cap threshold for T5b with n=3: m > 2(n-1) = 4 → bites at m=5 ✓

| Heir | Amount | Basis |
|------|--------|-------|
| LC1 | ₱2,000,000 | Art. 888 |
| LC2 | ₱2,000,000 | Art. 888 |
| LC3 | ₱2,000,000 | Art. 888 |
| Spouse | ₱2,000,000 | Art. 892 ¶2, Art. 897 |
| IC1-IC5 | ₱800,000 each | Art. 895 ¶3 (capped) |
| **Total** | **₱12,000,000** | |

---

### Sub-Scenario F: n=1, m=5, no spouse (T4, CAP APPLIES)

**Estate**: ₱10,000,000

**Testate**:
| Step | Computation | Result |
|------|------------|--------|
| L_per_child | ₱10M × ½ | ₱5,000,000 |
| FP | ₱10M × ½ | ₱5,000,000 |
| S | 0 | |
| FP_after_S | ₱5,000,000 | |
| IC_uncapped (each) | ₱5M × ½ | ₱2,500,000 |
| IC_uncapped (total) | 5 × ₱2.5M | ₱12,500,000 |
| Cap check | ₱12.5M > ₱5M | **CAP APPLIES** |
| IC_per_child (capped) | ₱5M / 5 | ₱1,000,000 |
| FP_disposable | ₱0 | |

Cap threshold for T4 with n=1: m > 2n = 2 → bites at m=3 ✓

| Heir | Amount | Basis |
|------|--------|-------|
| LC1 | ₱5,000,000 | Art. 888 |
| IC1-IC5 | ₱1,000,000 each | Art. 895 ¶3 (capped) |
| **Total** | **₱10,000,000** | |

**Compare intestate** (units: 2+1+1+1+1+1 = 7):
| Heir | Testate | Intestate | Ratio |
|------|---------|-----------|-------|
| LC1 | ₱5,000,000 | ₱2,857,143 | 1.75x |
| Each IC | ₱1,000,000 | ₱1,428,571 | 0.70x |

---

## Cap Rule Behavior: Complete Analysis

### Cap Threshold Formulas

The cap bites when the total uncapped illegitimate legitime exceeds the remaining free portion after the spouse is satisfied:

```
m × (L_per_child / 2) > FP - S
```

Expanding for each sub-case:

**T4 (no spouse)**:
```
m × E/(4n) > E/2
→ m > 2n
```

**T5a (n=1, with spouse)**:
```
m × E/4 > E/2 - E/4 = E/4
→ m × E/4 > E/4
→ m > 1
```

**T5b (n≥2, with spouse)**:
```
m × E/(4n) > E/2 - E/(2n) = E(n-1)/(2n)
→ m/(4n) > (n-1)/(2n)
→ m > 2(n-1) = 2n - 2
```

### Cap Threshold Table

| Scenario | n | Spouse? | Cap threshold (m >) | First m that triggers |
|----------|---|---------|--------------------|-----------------------|
| T4 | 1 | No | 2 | 3 |
| T4 | 2 | No | 4 | 5 |
| T4 | 3 | No | 6 | 7 |
| T4 | 5 | No | 10 | 11 |
| T5a | 1 | Yes | 1 | 2 |
| T5b | 2 | Yes | 2 | 3 |
| T5b | 3 | Yes | 4 | 5 |
| T5b | 4 | Yes | 6 | 7 |
| T5b | 5 | Yes | 8 | 9 |

**Pattern**: The spouse's presence makes the cap trigger much sooner. With n=1 and a spouse, **any more than 1 illegitimate child triggers the cap**. Without a spouse, it takes 3.

### Cap Impact Severity

When the cap applies, each illegitimate child's actual share as a fraction of their uncapped share:

```
actual/uncapped = FP_remaining / (m × IC_per_child_uncapped)
               = FP_remaining / IC_total_uncapped
```

**T5a severity** (n=1, spouse present, E=₱10M):

| m | Uncapped each | Capped each | Reduction |
|---|---------------|-------------|-----------|
| 1 | ₱2,500,000 | ₱2,500,000 | 0% (no cap) |
| 2 | ₱2,500,000 | ₱1,250,000 | -50% |
| 3 | ₱2,500,000 | ₱833,333 | -66.7% |
| 5 | ₱2,500,000 | ₱500,000 | -80% |
| 10 | ₱2,500,000 | ₱250,000 | -90% |

**T5b severity** (n=3, spouse present, E=₱12M):

| m | Uncapped each | Capped each | Reduction |
|---|---------------|-------------|-----------|
| 1 | ₱1,000,000 | ₱1,000,000 | 0% |
| 4 | ₱1,000,000 | ₱1,000,000 | 0% |
| 5 | ₱1,000,000 | ₱800,000 | -20% |
| 8 | ₱1,000,000 | ₱500,000 | -50% |
| 12 | ₱1,000,000 | ₱333,333 | -66.7% |

---

## Testate vs. Intestate: Systematic Comparison

For the same family, testate (with no free portion disposition) vs. intestate can produce **different per-heir amounts**:

### Why They Differ

**Testate**: Legitimate children's ½ is a **fixed floor**. Illegitimate children and spouse share the other ½. The cap limits illegitimate shares.

**Intestate**: The **entire estate** is distributed proportionally using the 2:1 ratio. No fixed ½ floor for legitimate children. The ratio is preserved but the base is different.

### Comparison for n=2, m=2, with spouse (E=₱10M)

**Testate** (T5b, uncapped):
| Heir | Amount |
|------|--------|
| Each LC | ₱2,500,000 |
| S | ₱2,500,000 |
| Each IC | ₱1,250,000 |
| FP | ₱0 |

**Intestate** (units: 2+2+1+1+2 = 8):
| Heir | Amount |
|------|--------|
| Each LC | ₱2,500,000 |
| S | ₱2,500,000 |
| Each IC | ₱1,250,000 |

**Result**: Identical! (When the cap doesn't apply and FP=0, testate and intestate yield the same amounts.)

### Comparison for n=2, m=1, with spouse (E=₱10M)

**Testate** (T5b, uncapped):
| Heir | Amount |
|------|--------|
| Each LC | ₱2,500,000 |
| S | ₱2,500,000 |
| IC1 | ₱1,250,000 |
| FP | ₱1,250,000 |

**Intestate** (units: 2+2+1+2 = 7):
| Heir | Amount |
|------|--------|
| Each LC | ₱2,857,143 |
| S | ₱2,857,143 |
| IC1 | ₱1,428,571 |

**Result**: Different! In intestate, everyone gets more (the free portion is distributed). The ratio is preserved in both cases. The intestate result is equivalent to the testate result where the testator willed the FP equally per the ratio.

### When Cap Makes a Large Difference: n=1, m=5, with spouse (E=₱10M)

| Heir | Testate (capped) | Intestate | IC difference |
|------|------------------|-----------|--------------|
| LC1 | ₱5,000,000 | ₱1,666,667 | |
| S | ₱2,500,000 | ₱1,666,667 | |
| Each IC | ₱500,000 | ₱833,333 | IC gets 67% more intestate |

This is the most dramatic divergence — the cap protects the legitimate child's ½ at the expense of illegitimate children.

---

## Representation Interaction

### Represented Legitimate Child Line

When a legitimate child (LC2) predeceases and is represented by grandchildren (GC1, GC2):
- Count n = lines, not heads → LC2's line still counts as 1 line
- GC1 and GC2 split LC2's line share per stirpes (Art. 974)
- The illegitimate child's share is still based on L_per_child (the line share), not the individual grandchild's share

**Example**: E=₱12M, n=2 lines (LC1 alive, LC2 predeceased with GC1+GC2), m=1 illegitimate, with spouse

Testate:
- L_collective = ₱6M → per line = ₱3M
- LC1 gets ₱3M
- GC1, GC2 each get ₱1.5M (LC2's line share ÷ 2)
- S = ₱3M (= one child's line share, Art. 892 ¶2)
- IC1 = ₱3M × ½ = ₱1.5M (based on per-line share, not per-grandchild)
- FP = ₱6M - ₱3M - ₱1.5M = ₱1.5M

### Represented Illegitimate Child

When an illegitimate child (IC1) predeceases and is represented by their descendants (Art. 902):
- Count m still includes IC1's line
- IC1's share (½ of legitimate child) goes to IC1's descendants per stirpes
- IC1's descendants inherit the **illegitimate share** — their own legitimacy status does NOT change the share amount

**Example**: E=₱10M, n=2 legitimate, IC1 predeceased with 2 grandchildren (IGC1, IGC2)

Testate (T4, uncapped):
- L_per_child = ₱2.5M
- IC1's computed share = ₱1.25M
- IGC1, IGC2 each get ₱625,000 (per stirpes from IC1's share)
- Their own legitimacy status is irrelevant — they inherit IC1's portion

---

## The Unified Engine Function

This combines all sub-cases into a single function:

```
function compute_shares_legit_plus_illegit(
  estate: Rational,
  legit_lines: int,       // n — at least 1
  illegit_count: int,     // m — at least 1
  has_spouse: bool,
  succession_type: TESTATE | INTESTATE
) -> DistributionResult {

  assert legit_lines >= 1
  assert illegit_count >= 1

  if succession_type == INTESTATE:
    return compute_intestate(estate, legit_lines, illegit_count, has_spouse)
  else:
    return compute_testate(estate, legit_lines, illegit_count, has_spouse)
}

function compute_intestate(E, n, m, has_S) -> DistributionResult {
  // Art. 983, 999: unit ratio method — no cap rule
  spouse_units = if has_S then 2 else 0
  total_units = (2 * n) + m + spouse_units

  per_unit = E / total_units

  return {
    per_legit_child:  per_unit * 2,
    per_illegit_child: per_unit * 1,
    spouse:           per_unit * spouse_units,
    free_portion:     0,          // Entire estate distributed
    cap_applied:      false       // Cap never applies intestate
  }
}

function compute_testate(E, n, m, has_S) -> DistributionResult {
  // Step 1: Fixed legitimate collective (Art. 888)
  legit_collective = E * Rational(1, 2)
  per_legit = legit_collective / n

  // Step 2: Free portion
  fp = E - legit_collective   // = E/2

  // Step 3: Spouse from FP (Art. 892, 897)
  if has_S:
    if n == 1:
      spouse = E * Rational(1, 4)   // Art. 892 ¶1
    else:
      spouse = per_legit             // Art. 892 ¶2 + Art. 897
  else:
    spouse = Rational(0)

  // Step 4: Remaining FP after spouse
  fp_remaining = fp - spouse

  // Step 5: Illegitimate uncapped (FC Art. 176)
  per_illegit_uncapped = per_legit * Rational(1, 2)
  total_illegit_uncapped = per_illegit_uncapped * m

  // Step 6: Cap rule (Art. 895 ¶3)
  if total_illegit_uncapped > fp_remaining:
    per_illegit = fp_remaining / m
    cap_applied = true
  else:
    per_illegit = per_illegit_uncapped
    cap_applied = false

  total_illegit = per_illegit * m
  fp_disposable = fp_remaining - total_illegit

  return {
    per_legit_child:  per_legit,
    per_illegit_child: per_illegit,
    spouse:           spouse,
    free_portion:     fp_disposable,
    cap_applied:      cap_applied
  }
}
```

### Rational Arithmetic Requirement

Every computation must use exact rational arithmetic. Common denominators:

| n | m | Spouse | Key denominator |
|---|---|--------|----------------|
| 1 | 1 | No | 4 |
| 1 | 1 | Yes | 4 |
| 2 | 1 | No | 8 |
| 2 | 1 | Yes | 4n = 8 |
| 3 | 2 | Yes | 12 |
| 1 | 5 | Yes | 20 |

For intestate with units: denominator = total_units.

**Rounding**: Only at the final peso-amount output. Allocate centavo remainder to largest-share heir (see `allocate_rounding_remainder` in legitime-table analysis).

---

## Edge Cases

### 1. m=0 (No Illegitimate Children)

If m=0, this analysis doesn't apply — fall through to T1/T2/T3 (handled in legitime-table). The engine must guard against m=0 to avoid division by zero.

### 2. n=0 (No Legitimate Children)

If n=0, the half-share rule is inapplicable. Different articles govern illegitimate children's shares when no legitimate children are present (Arts. 894, 896, 899, 901). See `legitime-table` scenarios T8-T11.

### 3. Cap Reduces to Zero

If n=1, spouse present, and m is extremely large, each illegitimate child's capped share approaches zero but never reaches it (as long as m is finite). The minimum per-illegitimate-child share is ₱E/(4m), which is always positive.

### 4. One Illegitimate Child Renounces — Effect on Cap

If one of m illegitimate children renounces, they are removed from the computation. The cap is then recalculated with m-1 children. If the cap previously bit, the remaining illegitimate children may now each get a larger capped share.

```
// Before: m=5, FP_remaining=₱2.5M, each IC gets ₱500K (capped)
// IC5 renounces: m=4, FP_remaining=₱2.5M, each IC gets ₱625K (still capped)
// IC4 also renounces: m=3, each IC gets ₱833K (still capped)
// IC3 also renounces: m=2, each IC gets ₱1.25M (still capped for n=1/spouse)
// IC2 also renounces: m=1, IC gets ₱2.5M (uncapped — exactly fills remaining FP)
```

**Engine logic**: Re-run the computation after removing renouncing heirs from the count.

### 5. All Illegitimate Children Renounce

If all m illegitimate children renounce, the scenario changes entirely — it becomes T2/T3 (legitimate children ± spouse). The engine must re-determine the scenario code after filtering out renouncing heirs.

### 6. Illegitimate Child's Share When They Also Represent a Predeceased Legitimate Child

Can an illegitimate child also be a representative of a predeceased legitimate child? In theory, Art. 973 requires the representative to be "capable of succeeding the decedent" — and an illegitimate child of the decedent IS capable. But the illegitimate child's relationship is to the decedent, not to the predeceased legitimate child. The representative must be a descendant of the represented person (Art. 970).

**Rule**: An illegitimate child of the decedent CANNOT represent a predeceased legitimate child of the same decedent. They are siblings (of a sort), not in a descending line. The illegitimate child inherits in their own right as an illegitimate child.

### 7. Adopted + Illegitimate Concurrence

When adopted children (who are in the LEGITIMATE_CHILD_GROUP per RA 8552) concur with illegitimate children, the adopted child counts as a legitimate child for n. The illegitimate child's share is ½ of the adopted child's per-line share — which equals ½ of any legitimate child's share, since adopted = legitimate.

### 8. Testate With Partial Will Disposition

When the testator's will only disposes of part of the free portion, the remainder of the free portion passes intestate (Art. 960(2), mixed succession). The cap rule still applies to the testate portion (it constrains the total illegitimate legitime, not the free portion disposition).

---

## Narrative Templates

### When Uncapped

> **{Name} (illegitimate child)** receives **₱{amount}**.
> As an illegitimate child (Art. 176, Family Code), {Name} is a compulsory heir entitled to a legitime equal to one-half (½) of a legitimate child's legitime. Each legitimate child's legitime is ₱{L_per_child} (½ of the ₱{estate} estate ÷ {n} legitimate children). {Name}'s legitime is therefore ₱{L_per_child} × ½ = ₱{amount}. This share is taken from the free portion of the estate (Art. 895 ¶3).

### When Capped

> **{Name} (illegitimate child)** receives **₱{capped_amount}**.
> As an illegitimate child (Art. 176, Family Code), {Name}'s computed legitime would be ₱{uncapped_amount} (½ of a legitimate child's ₱{L_per_child} legitime). However, Art. 895 ¶3 of the Civil Code provides that the total legitime of all illegitimate children cannot exceed the free portion of the estate after the surviving spouse's legitime is fully satisfied. The free portion is ₱{fp} (½ of ₱{estate}). After satisfying the surviving spouse's legitime of ₱{spouse_amount} (Art. {spouse_art}), ₱{fp_remaining} remains. This is divided equally among {m} illegitimate children, giving {Name} ₱{capped_amount}.

### Intestate Variant

> **{Name} (illegitimate child)** receives **₱{amount}**.
> Under intestate succession (Art. 983), when illegitimate children survive with legitimate children, the share of each illegitimate child is one-half (½) that of each legitimate child. {if_spouse: The surviving spouse receives a share equal to one legitimate child (Art. 999).} Using the proportional unit method (2 units per legitimate child{if_spouse: , 2 units for the spouse}, 1 unit per illegitimate child), the ₱{estate} estate is divided into {total_units} units of ₱{per_unit} each. {Name} receives 1 unit = ₱{amount}.

---

## Test Implications

### Testate Computation Tests

| # | E | n | m | Spouse? | Cap? | Per LC | S | Per IC | FP |
|---|---|---|---|---------|------|--------|---|--------|-----|
| 1 | ₱10M | 1 | 1 | No | No | ₱5M | — | ₱2.5M | ₱2.5M |
| 2 | ₱10M | 2 | 1 | No | No | ₱2.5M | — | ₱1.25M | ₱3.75M |
| 3 | ₱10M | 2 | 2 | No | No | ₱2.5M | — | ₱1.25M | ₱2.5M |
| 4 | ₱10M | 1 | 3 | No | Yes (m>2) | ₱5M | — | ₱1.667M | ₱0 |
| 5 | ₱10M | 2 | 5 | No | Yes (m>4) | ₱2.5M | — | ₱1M | ₱0 |
| 6 | ₱10M | 1 | 1 | Yes | No (exact) | ₱5M | ₱2.5M | ₱2.5M | ₱0 |
| 7 | ₱10M | 1 | 2 | Yes | Yes (m>1) | ₱5M | ₱2.5M | ₱1.25M | ₱0 |
| 8 | ₱10M | 1 | 5 | Yes | Yes | ₱5M | ₱2.5M | ₱500K | ₱0 |
| 9 | ₱12M | 3 | 2 | Yes | No | ₱2M | ₱2M | ₱1M | ₱2M |
| 10 | ₱12M | 3 | 5 | Yes | Yes (m>4) | ₱2M | ₱2M | ₱800K | ₱0 |

### Intestate Computation Tests

| # | E | n | m | Spouse? | Total Units | Per LC | S | Per IC |
|---|---|---|---|---------|-------------|--------|---|--------|
| 11 | ₱10M | 2 | 1 | No | 5 | ₱4M | — | ₱2M |
| 12 | ₱10M | 2 | 1 | Yes | 7 | ₱2,857,143 | ₱2,857,143 | ₱1,428,571 |
| 13 | ₱10M | 1 | 3 | Yes | 7 | ₱2,857,143 | ₱2,857,143 | ₱1,428,571 |
| 14 | ₱14M | 2 | 1 | Yes | 7 | ₱4M | ₱4M | ₱2M |
| 15 | ₱12M | 3 | 2 | Yes | 10 | ₱2.4M | ₱2.4M | ₱1.2M |

### Cap Boundary Tests

| # | n | m | Spouse? | Expected |
|---|---|---|---------|----------|
| 16 | 1 | 2 | No | No cap (m=2n exactly) |
| 17 | 1 | 3 | No | Cap (m>2n) |
| 18 | 1 | 1 | Yes | No cap (exactly fills) |
| 19 | 1 | 2 | Yes | Cap (m>1) |
| 20 | 2 | 4 | No | No cap (m=2n exactly) |
| 21 | 2 | 5 | No | Cap |
| 22 | 2 | 2 | Yes | No cap (m=2(n-1) exactly) |
| 23 | 2 | 3 | Yes | Cap (m>2) |
| 24 | 3 | 4 | Yes | No cap (m=2(n-1) exactly) |
| 25 | 3 | 5 | Yes | Cap |

### Half-Share Ratio Verification Tests

For every test case above, verify: `IC_per_child ≤ L_per_child × ½` (equality when uncapped).

### Testate-vs-Intestate Cross Tests

| # | E | n | m | Spouse? | Testate Per IC | Intestate Per IC | IC gets more in... |
|---|---|---|---|---------|---------------|-----------------|-------------------|
| 26 | ₱10M | 2 | 2 | Yes | ₱1.25M | ₱1.25M | Equal (no cap, FP=0) |
| 27 | ₱10M | 1 | 3 | Yes | ₱833K | ₱1,429K | Intestate (+71%) |
| 28 | ₱10M | 1 | 5 | Yes | ₱500K | ₱833K | Intestate (+67%) |
| 29 | ₱10M | 2 | 1 | Yes | ₱1.25M | ₱1,429K | Intestate (+14%) |

---

## Engine Pipeline Integration

This computation occurs at **Step 3** of the pipeline, within the `compute_all_legitimes` function (see legitime-table). The key decision tree:

```
Step 2 outputs scenario code → T4, T5a, or T5b
  ↓
Step 3: compute_shares_legit_plus_illegit(E, n, m, has_S, TESTATE)
  → Returns per-heir legitime amounts
  → Also returns cap_applied flag (needed for narrative)
  → Also returns FP_disposable (needed for Step 5: free portion distribution)
```

For intestate:
```
Step 2 outputs scenario code → I3, I4
  ↓
Step 3: compute_shares_legit_plus_illegit(E, n, m, has_S, INTESTATE)
  → Returns per-heir amounts (no FP concept)
```

---

*Analysis based on FC Art. 176, Civil Code Arts. 888, 892, 895, 897, 983, 999. Cross-references: legitime-table (T4, T5a, T5b scenarios), illegitimate-children-rights (half-share rule, cap rule, iron curtain), heir-concurrence-rules (scenario determination).*
