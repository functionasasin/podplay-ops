# Spec Patch: Test Vectors — 19 Untested Scenarios

**Aspect**: spec-patch-test-vectors
**Wave**: 5 (Synthesis — Spec Patch)
**Depends On**: test-vectors, legitime-table, intestate-order, spec-draft, spec-patch-narratives
**Purpose**: Add minimal test vectors for 19 scenarios that had zero coverage in the original 13 test vectors (TV-01 through TV-13).

---

## Gap Summary

Original 13 test vectors covered:
- Intestate: I1, I2, I3, I6, I11 (direct) + I2 again (representation in TV-10)
- Testate: T1, T2, T3, T5a, T5b (plus preterition/disinheritance/adoption/collation variants)

**Missing testate scenarios**: T4, T6, T7, T8, T9, T10, T11, T12, T14, T15 (10 scenarios)
**Missing intestate scenarios**: I4, I7, I8, I9, I10, I12, I13, I14, I15 (9 scenarios)

Total gap: 19 scenarios without any reference computation.

---

## New Test Vectors (TV-14 through TV-32)

### Format

Each vector specifies: estate, heir list with categories, scenario code, key fractions (source legal article), final per-heir amounts, and sum invariant check. Narrative provided for TV-18 (testate batch) and TV-28 (intestate batch).

---

## TESTATE BATCH (T4, T6–T12, T14–T15)

### TV-14: T4 — Legitimate Children + Illegitimate Child (No Spouse, Uncapped)

| Field | Value |
|-------|-------|
| Estate | ₱12,000,000 |
| Heirs | Alma, Bruno (LC); Cita (IC, filiation by judgment); Friend F (voluntary) |
| Will | FP to Friend F |
| Scenario | T4 (n=2, m=1) |
| Cap check | m=1 ≤ 2n=4 → **NOT CAPPED** |

**Legitimes** (Art. 888, Art. 895):
- Each LC = E × ½ / n = ₱12M × ½ / 2 = **₱3,000,000** (fraction: ¼)
- IC (uncapped) = ½ × LC share = ½ × ₱3M = **₱1,500,000** (fraction: 1/8)
- FP_gross = ½ = ₱6,000,000; FP after IC = ₱6M − ₱1.5M = ₱4,500,000
- FP_disposable = **₱4,500,000** (fraction: 3/8)

| Heir | Legitime | FP | Total | Fraction |
|------|---------|-----|-------|---------|
| Alma (LC) | ₱3,000,000 | — | ₱3,000,000 | ¼ |
| Bruno (LC) | ₱3,000,000 | — | ₱3,000,000 | ¼ |
| Cita (IC) | ₱1,500,000 | — | ₱1,500,000 | ⅛ |
| Friend F | — | ₱4,500,000 | ₱4,500,000 | 3/8 |

**Invariant checks**:
- Sum: ₱3M + ₱3M + ₱1.5M + ₱4.5M = ₱12,000,000 = E ✓
- IC = ½ × LC: ₱1.5M = ½ × ₱3M ✓
- Σ(IC legitimes) ≤ FP_gross: ₱1.5M ≤ ₱6M ✓ (not capped)
- Legitime floor: Alma ≥ ₱3M ✓; Bruno ≥ ₱3M ✓; Cita ≥ ₱1.5M ✓

---

### TV-15: T6 — Legitimate Ascendants Only (Testate)

| Field | Value |
|-------|-------|
| Estate | ₱8,000,000 |
| Heirs | Ernesto (father), Felisa (mother); Charity C (voluntary) |
| Will | FP to Charity C |
| Scenario | T6 |

**Legitimes** (Art. 889):
- Ascendants (collective) = E × ½ = **₱4,000,000**
- Both parents alive → equal shares (Art. 986): each **₱2,000,000**
- FP = E × ½ = **₱4,000,000**

| Heir | Legitime | FP | Total | Fraction |
|------|---------|-----|-------|---------|
| Ernesto (father) | ₱2,000,000 | — | ₱2,000,000 | ¼ |
| Felisa (mother) | ₱2,000,000 | — | ₱2,000,000 | ¼ |
| Charity C | — | ₱4,000,000 | ₱4,000,000 | ½ |

**Invariant checks**:
- Sum: ₱2M + ₱2M + ₱4M = ₱8,000,000 = E ✓
- Parents receive equal shares ✓ (Art. 986)
- Ascendants excluded by no surviving descendants ✓

---

### TV-16: T7 — Legitimate Ascendants + Surviving Spouse (Testate)

| Field | Value |
|-------|-------|
| Estate | ₱10,000,000 |
| Heirs | Gilberto (father, mother predeceased); Herminia (spouse); Foundation F (voluntary) |
| Will | FP to Foundation F |
| Scenario | T7 |

**Legitimes** (Art. 889, Art. 893):
- Ascendants (½): ₱5,000,000 — all to Gilberto (sole surviving parent, Art. 986 ¶2)
- Spouse (¼, from FP, Art. 893): **₱2,500,000**
- FP = ¼ = **₱2,500,000**

| Heir | Legitime | Source | Total | Fraction |
|------|---------|--------|-------|---------|
| Gilberto (father) | ₱5,000,000 | Art. 889 | ₱5,000,000 | ½ |
| Herminia (spouse) | ₱2,500,000 | Art. 893 (from FP) | ₱2,500,000 | ¼ |
| Foundation F | — | FP_disposable | ₱2,500,000 | ¼ |

**Invariant checks**:
- Sum: ₱5M + ₱2.5M + ₱2.5M = ₱10,000,000 = E ✓
- Ascendants = ½ ✓ (Art. 889); Spouse = ¼ ✓ (Art. 893); FP = ¼ ✓
- Testate vs intestate note: In intestate I6, spouse would receive ½ = ₱5M instead of ¼ = ₱2.5M

---

### TV-17: T8 — Legitimate Ascendants + Illegitimate Children (Testate)

| Field | Value |
|-------|-------|
| Estate | ₱12,000,000 |
| Heirs | Ignacio (father), Juliana (mother); Katrina, Leon (IC, proven by birth certificate); Friend G (voluntary) |
| Will | FP to Friend G |
| Scenario | T8 (Regime B — flat ¼ for IC group) |

**Legitimes** (Art. 889, Art. 896):
- Ascendants (½): ₱6,000,000 → each parent **₱3,000,000**
- IC (¼ flat collective, Art. 896): ₱3,000,000 → each IC **₱1,500,000**
- FP = ¼ = **₱3,000,000**

**Key Regime B distinction**: Art. 896 gives illegitimate children a FLAT ¼ as a group (not derived from per-LC share). No cap rule applies — the fractions sum exactly to 1 regardless of IC count.

| Heir | Legitime | FP | Total | Fraction |
|------|---------|-----|-------|---------|
| Ignacio (father) | ₱3,000,000 | — | ₱3,000,000 | ¼ |
| Juliana (mother) | ₱3,000,000 | — | ₱3,000,000 | ¼ |
| Katrina (IC) | ₱1,500,000 | — | ₱1,500,000 | ⅛ |
| Leon (IC) | ₱1,500,000 | — | ₱1,500,000 | ⅛ |
| Friend G | — | ₱3,000,000 | ₱3,000,000 | ¼ |

**Invariant checks**:
- Sum: ₱3M + ₱3M + ₱1.5M + ₱1.5M + ₱3M = ₱12,000,000 ✓
- Ascendants = ½ ✓; IC collective = ¼ ✓; FP = ¼ ✓
- No cap rule in Regime B ✓ (IC fraction fixed by Art. 896, not derived from Art. 888)

---

### TV-18: T9 — Ascendants + Illegitimate Children + Surviving Spouse (Testate)

| Field | Value |
|-------|-------|
| Estate | ₱16,000,000 |
| Heirs | Marcos (father, both parents alive? — no, mother predeceased); Nina, Otto (2 IC, proven by public document); Perla (spouse); NGO N (voluntary) |
| Will | FP to NGO N |
| Scenario | T9 (most constrained scenario — FP = ⅛) |

**Legitimes** (Art. 899):
- Ascendants (½): ₱8,000,000 — all to Marcos (sole surviving parent)
- IC (¼ collective): ₱4,000,000 → each IC **₱2,000,000**
- Spouse (⅛, Art. 899): **₱2,000,000**
- FP = ⅛ = **₱2,000,000**

| Heir | Legitime | FP | Total | Fraction |
|------|---------|-----|-------|---------|
| Marcos (father) | ₱8,000,000 | — | ₱8,000,000 | ½ |
| Nina (IC) | ₱2,000,000 | — | ₱2,000,000 | ⅛ |
| Otto (IC) | ₱2,000,000 | — | ₱2,000,000 | ⅛ |
| Perla (spouse) | ₱2,000,000 | — | ₱2,000,000 | ⅛ |
| NGO N | — | ₱2,000,000 | ₱2,000,000 | ⅛ |

**Invariant checks**:
- Sum: ₱8M + ₱2M + ₱2M + ₱2M + ₱2M = ₱16,000,000 ✓
- ½ + ¼ + ⅛ + ⅛ = 4/8 + 2/8 + 1/8 + 1/8 = 1 ✓
- T9 is most constrained: FP = ⅛ ✓

**Narrative (Perla — spouse in T9)**:
> **Perla Garces (surviving spouse)** receives **₱2,000,000**. The decedent left a valid will. As the surviving spouse (Art. 887(3) of the Civil Code), Perla is a compulsory heir. Under Art. 899 of the Civil Code, when the surviving spouse concurs with legitimate ascendants and illegitimate children — and no legitimate descendants survive — the spouse is entitled to one-eighth (⅛) of the estate as legitime. The net distributable estate is ₱16,000,000, so Perla's legitime is ₱16,000,000 × ⅛ = ₱2,000,000. Art. 899 is the most constrained testate scenario: ascendants claim ½, illegitimate children claim ¼, and the spouse and the testator's free portion each receive ⅛, leaving the testator with the minimum freedom to dispose of the estate. Perla's share of ₱2,000,000 comes directly from the estate (not from the free portion in this Regime B scenario).

---

### TV-19: T10 — Illegitimate Children + Surviving Spouse (Testate, Regime C)

| Field | Value |
|-------|-------|
| Estate | ₱9,000,000 |
| Heirs | Queenie, Renato (2 IC, proven by open continuous possession); Sonia (spouse); Friend H (voluntary) |
| Will | FP to Friend H |
| Scenario | T10 (Regime C — no legitimate descendants or ascendants) |

**Legitimes** (Art. 894):
- IC (⅓ collective): ₱3,000,000 → each IC **₱1,500,000**
- Spouse (⅓): **₱3,000,000**
- FP = ⅓ = **₱3,000,000**

| Heir | Legitime | FP | Total | Fraction |
|------|---------|-----|-------|---------|
| Queenie (IC) | ₱1,500,000 | — | ₱1,500,000 | ⅙ |
| Renato (IC) | ₱1,500,000 | — | ₱1,500,000 | ⅙ |
| Sonia (spouse) | ₱3,000,000 | — | ₱3,000,000 | ⅓ |
| Friend H | — | ₱3,000,000 | ₱3,000,000 | ⅓ |

**Invariant checks**:
- Sum: ₱1.5M + ₱1.5M + ₱3M + ₱3M = ₱9,000,000 ✓
- ⅓ + ⅓ + ⅓ = 1 ✓ (Art. 894)
- Regime C: no LC, no ascendants → flat ⅓/⅓/⅓ distribution ✓

---

### TV-20: T11 — Illegitimate Children Only (Testate, Regime C)

| Field | Value |
|-------|-------|
| Estate | ₱6,000,000 |
| Heirs | Tomas, Ursula, Vicente (3 IC, proven by recognition in will); Foundation F (voluntary) |
| Will | FP to Foundation F |
| Scenario | T11 (Regime C — IC alone, no LC, no ascendants, no spouse) |

**Legitimes** (Art. 901):
- IC (½ collective): ₱3,000,000 → each IC **₱1,000,000**
- FP = ½ = **₱3,000,000**

| Heir | Legitime | FP | Total | Fraction |
|------|---------|-----|-------|---------|
| Tomas (IC) | ₱1,000,000 | — | ₱1,000,000 | ⅙ |
| Ursula (IC) | ₱1,000,000 | — | ₱1,000,000 | ⅙ |
| Vicente (IC) | ₱1,000,000 | — | ₱1,000,000 | ⅙ |
| Foundation F | — | ₱3,000,000 | ₱3,000,000 | ½ |

**Invariant checks**:
- Sum: ₱1M + ₱1M + ₱1M + ₱3M = ₱6,000,000 ✓
- IC collective = ½ ✓ (Art. 901); FP = ½ ✓

---

### TV-21: T12 — Surviving Spouse Only (Testate, Regime C)

| Field | Value |
|-------|-------|
| Estate | ₱10,000,000 |
| Heirs | Wilma (spouse, normal marriage — no articulo mortis); Orphanage O (voluntary) |
| Will | FP to Orphanage O |
| Scenario | T12 (normal case: spouse sole heir) |

**Legitimes** (Art. 900):
- Spouse (½, normal): **₱5,000,000**
- FP = ½ = **₱5,000,000**

| Heir | Legitime | FP | Total | Fraction |
|------|---------|-----|-------|---------|
| Wilma (spouse) | ₱5,000,000 | — | ₱5,000,000 | ½ |
| Orphanage O | — | ₱5,000,000 | ₱5,000,000 | ½ |

**Articulo mortis sub-case**: If `decedent.marriage_in_articulo_mortis = true` AND died within 3 months AND cohabitation < 5 years (Art. 900 ¶2), spouse's legitime is ⅓ = ₱3,333,333.33 and FP = ⅔ = ₱6,666,666.67.

**Invariant checks**:
- Sum: ₱5M + ₱5M = ₱10,000,000 ✓
- Spouse = ½ ✓ (Art. 900); FP = ½ ✓

---

### TV-22: T14 — Parents of Illegitimate Decedent, No Descendants or Spouse (Testate)

| Field | Value |
|-------|-------|
| Estate | ₱8,000,000 |
| Decedent | Xavier (illegitimate; no children, no spouse) |
| Heirs | Yolanda (mother), Zandro (father); Church C (voluntary) |
| Will | FP to Church C |
| Scenario | T14 |

**Legitimes** (Art. 903 ¶1):
- Parents of illegitimate decedent (½): ₱4,000,000 → each parent **₱2,000,000**
- FP = ½ = **₱4,000,000**

| Heir | Legitime | FP | Total | Fraction |
|------|---------|-----|-------|---------|
| Yolanda (mother) | ₱2,000,000 | — | ₱2,000,000 | ¼ |
| Zandro (father) | ₱2,000,000 | — | ₱2,000,000 | ¼ |
| Church C | — | ₱4,000,000 | ₱4,000,000 | ½ |

**Prerequisite**: Decedent is illegitimate. If decedent had children (legitimate or illegitimate), parents would receive NOTHING (Art. 903 ¶2).

**Invariant checks**:
- Sum: ₱2M + ₱2M + ₱4M = ₱8,000,000 ✓
- Parents (collective) = ½ ✓; FP = ½ ✓
- `decedent.is_illegitimate = true` required to trigger T14 ✓

---

### TV-23: T15 — Parents of Illegitimate Decedent + Surviving Spouse (Testate)

| Field | Value |
|-------|-------|
| Estate | ₱8,000,000 |
| Decedent | Aling Ana (illegitimate; no children) |
| Heirs | Benedicto (father; mother predeceased); Carmen (spouse); University U (voluntary) |
| Will | FP to University U |
| Scenario | T15 |

**Legitimes** (Art. 903 ¶2):
- Parents of illegitimate decedent (¼): ₱2,000,000 — all to Benedicto (sole surviving parent)
- Spouse (¼): **₱2,000,000**
- FP = ½ = **₱4,000,000**

| Heir | Legitime | FP | Total | Fraction |
|------|---------|-----|-------|---------|
| Benedicto (father) | ₱2,000,000 | — | ₱2,000,000 | ¼ |
| Carmen (spouse) | ₱2,000,000 | — | ₱2,000,000 | ¼ |
| University U | — | ₱4,000,000 | ₱4,000,000 | ½ |

**Invariant checks**:
- Sum: ₱2M + ₱2M + ₱4M = ₱8,000,000 ✓
- Parents (¼) + Spouse (¼) + FP (½) = 1 ✓ (Art. 903 ¶2)

---

## INTESTATE BATCH (I4, I7–I10, I12–I15)

### TV-24: I4 — Legitimate Children + Illegitimate Child + Surviving Spouse (Intestate)

| Field | Value |
|-------|-------|
| Estate | ₱14,000,000 |
| Heirs | Ana, Berto (LC); Cora (IC, filiation by birth certificate); Delia (spouse) |
| Will | null |
| Scenario | I4 |

**Distribution** (Art. 999 — spouse = one LC's share; 2:1 ratio for LC/IC):
- Units: (2 × 2 for LC) + (1 × 1 for IC) + (2 for spouse) = 7
- Per unit: ₱14M / 7 = **₱2,000,000**

| Heir | Units | Amount | Fraction |
|------|-------|--------|---------|
| Ana (LC) | 2 | ₱4,000,000 | 2/7 |
| Berto (LC) | 2 | ₱4,000,000 | 2/7 |
| Cora (IC) | 1 | ₱2,000,000 | 1/7 |
| Delia (spouse) | 2 | ₱4,000,000 | 2/7 |

**Invariant checks**:
- Sum: ₱4M + ₱4M + ₱2M + ₱4M = ₱14,000,000 ✓
- IC = ½ × LC: ₱2M = ½ × ₱4M ✓ (2:1 ratio)
- Spouse = LC: ₱4M = ₱4M ✓ (Art. 999)
- No cap rule in intestate ✓

---

### TV-25: I7 — Illegitimate Children Only (Intestate)

| Field | Value |
|-------|-------|
| Estate | ₱9,000,000 |
| Heirs | Erna, Fely, Gino (IC, filiation proven) |
| Will | null |
| Scenario | I7 |

**Distribution** (Art. 988 — IC take entire estate equally):
- Per IC: ₱9M / 3 = **₱3,000,000**

| Heir | Amount | Fraction |
|------|--------|---------|
| Erna (IC) | ₱3,000,000 | ⅓ |
| Fely (IC) | ₱3,000,000 | ⅓ |
| Gino (IC) | ₱3,000,000 | ⅓ |

**Invariant checks**:
- Sum: ₱3M × 3 = ₱9,000,000 ✓
- Equal shares among all IC ✓ (Art. 988)
- Prerequisite: no legitimate descendants or ascendants ✓

---

### TV-26: I8 — Illegitimate Children + Surviving Spouse (Intestate)

| Field | Value |
|-------|-------|
| Estate | ₱10,000,000 |
| Heirs | Hugo, Iris (IC, filiation proven); Jun (spouse) |
| Will | null |
| Scenario | I8 |

**Distribution** (Art. 998 — ½ to spouse, ½ to IC):
- Spouse: ½ = **₱5,000,000**
- IC (½ total): ₱5M / 2 = **₱2,500,000** each

| Heir | Amount | Fraction |
|------|--------|---------|
| Hugo (IC) | ₱2,500,000 | ¼ |
| Iris (IC) | ₱2,500,000 | ¼ |
| Jun (spouse) | ₱5,000,000 | ½ |

**Invariant checks**:
- Sum: ₱2.5M + ₱2.5M + ₱5M = ₱10,000,000 ✓
- Spouse = ½ ✓ (Art. 998); IC collective = ½ ✓
- Testate comparison: In T10 (same heirs), each would get ⅓ ≈ ₱3.33M. Intestate gives spouse 50% more (₱5M vs ₱3.33M) and the "freed" amount elevates both IC shares.

---

### TV-27: I9 — Legitimate Ascendants + Illegitimate Children (Intestate)

| Field | Value |
|-------|-------|
| Estate | ₱10,000,000 |
| Heirs | Karen (father), Luz (mother); Marco (IC, filiation proven) |
| Will | null |
| Scenario | I9 |

**Distribution** (Art. 991 — ½ to ascendants, ½ to IC):
- Ascendants (½ total): ₱5,000,000 → each parent **₱2,500,000**
- IC (½ total): **₱5,000,000** (all to Marco, sole IC)

| Heir | Amount | Fraction |
|------|--------|---------|
| Karen (father) | ₱2,500,000 | ¼ |
| Luz (mother) | ₱2,500,000 | ¼ |
| Marco (IC) | ₱5,000,000 | ½ |

**Invariant checks**:
- Sum: ₱2.5M + ₱2.5M + ₱5M = ₱10,000,000 ✓
- Ascendants = ½ ✓; IC = ½ ✓ (Art. 991)
- "Whatever be the number" = ½/½ fixed regardless of counts ✓
- Testate comparison: In T8 (same heirs), Marco would get ¼ = ₱2.5M. Intestate gives IC 100% more.

---

### TV-28: I10 — Legitimate Ascendants + Illegitimate Children + Surviving Spouse (Intestate)

| Field | Value |
|-------|-------|
| Estate | ₱12,000,000 |
| Heirs | Noel (father, mother predeceased); Ofelia, Pedro (IC, filiation proven); Queenie (spouse) |
| Will | null |
| Scenario | I10 |

**Distribution** (Art. 1000 — ascendants ½, IC ¼, spouse ¼):
- Ascendants (½): ₱6,000,000 — all to Noel (sole surviving parent)
- IC (¼ total): ₱3,000,000 → each **₱1,500,000**
- Spouse (¼): **₱3,000,000**

| Heir | Amount | Fraction | Legal Basis |
|------|--------|---------|------------|
| Noel (father) | ₱6,000,000 | ½ | Art. 1000 |
| Ofelia (IC) | ₱1,500,000 | ⅛ | Art. 1000 |
| Pedro (IC) | ₱1,500,000 | ⅛ | Art. 1000 |
| Queenie (spouse) | ₱3,000,000 | ¼ | Art. 1000 |

**Invariant checks**:
- Sum: ₱6M + ₱1.5M + ₱1.5M + ₱3M = ₱12,000,000 ✓
- Ascendants ½ + IC ¼ + Spouse ¼ = 1 ✓ (Art. 1000)

**Narrative (Queenie — spouse in I10)**:
> **Queenie Navarro (surviving spouse)** receives **₱3,000,000**. The decedent died intestate (without a valid will). As the surviving spouse (Art. 887(3) of the Civil Code), Queenie is a compulsory heir. Under Art. 1000 of the Civil Code, when the surviving spouse concurs with legitimate ascendants and illegitimate children, the spouse is entitled to one-fourth (¼) of the estate. With the net distributable estate at ₱12,000,000, Queenie's share is ₱12,000,000 × ¼ = ₱3,000,000. Note: under testate succession with the same family (Scenario T9), Queenie would receive only one-eighth (⅛) = ₱1,500,000 — half the intestate amount. The extra ₱1,500,000 in intestate succession represents the elimination of the free portion, which flows instead to the surviving heirs.

**Testate comparison**: Queenie gets 100% more intestate (₱3M vs ₱1.5M in T9).

---

### TV-29: I12 — Surviving Spouse + Siblings (Intestate, Art. 1001)

| Field | Value |
|-------|-------|
| Estate | ₱8,000,000 |
| Heirs | Romy (spouse); Stella, Tino, Uma (full-blood siblings of decedent) |
| Will | null |
| Scenario | I12 |

**Distribution** (Art. 1001 — ½ to spouse, ½ to siblings):
- Spouse (½): **₱4,000,000**
- Siblings (½ total): ₱4M / 3 = **₱1,333,333.33** each

| Heir | Amount | Fraction |
|------|--------|---------|
| Romy (spouse) | ₱4,000,000 | ½ |
| Stella (sibling) | ₱1,333,333.33 | 1/6 |
| Tino (sibling) | ₱1,333,333.33 | 1/6 |
| Uma (sibling) | ₱1,333,333.33 | 1/6 |

**Rounding**: ₱4M / 3 = ₱1,333,333.333... Use largest-remainder method: ₱1,333,333 + ₱1,333,333 + ₱1,333,334 = ₱4,000,000. Total estate check: ₱4,000,000 + ₱4,000,000 = ₱8,000,000 ✓

**Scope check**: Art. 1001 requires surviving siblings or their children. Remote collaterals (e.g., cousins) do NOT trigger Art. 1001 — in that case, spouse takes all under Art. 995. ✓

---

### TV-30: I13 — Siblings Only (Full + Half Blood)

| Field | Value |
|-------|-------|
| Estate | ₱10,000,000 |
| Heirs | Victor, Willa (full-blood siblings); Ximena (half-blood sibling) |
| Will | null |
| Scenario | I13 |

**Distribution** (Art. 1006 — full blood = 2× half blood):
- Total units: (2 × 2) + (1 × 1) = 5
- Per unit: ₱10M / 5 = **₱2,000,000**

| Heir | Blood | Units | Amount | Fraction |
|------|-------|-------|--------|---------|
| Victor (sibling) | Full | 2 | ₱4,000,000 | 2/5 |
| Willa (sibling) | Full | 2 | ₱4,000,000 | 2/5 |
| Ximena (sibling) | Half | 1 | ₱2,000,000 | 1/5 |

**Invariant checks**:
- Sum: ₱4M + ₱4M + ₱2M = ₱10,000,000 ✓
- Full-blood share = 2 × half-blood share: ₱4M = 2 × ₱2M ✓ (Art. 1006)
- Engine requires `BloodType` field (FULL or HALF) on each sibling heir ✓

---

### TV-31: I14 — Other Collateral Relatives (First Cousins)

| Field | Value |
|-------|-------|
| Estate | ₱6,000,000 |
| Heirs | Yvonne, Zack (first cousins of decedent, 4th degree collateral) |
| Will | null |
| Scenario | I14 |
| Prerequisite | No siblings, no nephews/nieces; no nearer collaterals |

**Distribution** (Art. 1009 — nearest degree, equal shares, no line/blood distinction):
- Degree: first cousins = 4th degree (up 2 to common grandparent, down 2 to cousin)
- Both at same degree → all to them equally
- Per cousin: ₱6M / 2 = **₱3,000,000**

| Heir | Collateral Degree | Amount | Fraction |
|------|-----------------|--------|---------|
| Yvonne (first cousin) | 4th | ₱3,000,000 | ½ |
| Zack (first cousin) | 4th | ₱3,000,000 | ½ |

**Invariant checks**:
- Sum: ₱3M + ₱3M = ₱6,000,000 ✓
- Degree ≤ 5th ✓ (Art. 1010)
- No line or blood distinction applied ✓ (Art. 1009 — unlike Art. 1006 for siblings)

---

### TV-32: I15 — No Heirs (Escheat to State)

| Field | Value |
|-------|-------|
| Estate | ₱5,000,000 |
| Heirs | None within the legal hierarchy |
| Will | null |
| Scenario | I15 |

**Distribution** (Arts. 1011-1013 — entire estate to State):
- State: **₱5,000,000**
- Art. 1013 designation: personal property → municipality/city of last residence; real property → municipality/city where situated; for benefit of public schools and charitable institutions
- Art. 1014: any legitimate heir appearing within 5 years may reclaim

| Heir | Amount | Note |
|------|--------|------|
| State (Republic of the Philippines) | ₱5,000,000 | Art. 1011 |

**Invariant checks**:
- Sum: ₱5,000,000 = E ✓
- No eligible heir within 5th collateral degree ✓ (Art. 1010)
- Engine output should flag HeirCategory = STATE and set escheat_deadline ✓

---

## New Test Invariants (for TV-14 through TV-32)

In addition to the 10 invariants in the original TV-01 through TV-13 section, these new vectors require:

11. **Regime B no-cap invariant**: In Scenarios T6-T9, the Art. 895 ¶3 cap rule does NOT apply. IC share = Art. 896 flat ¼/m (not derived from ½ × LC share). Engine must check regime (A vs B vs C) before applying cap.

12. **Art. 1001 scope invariant**: In I12, only siblings and nephews/nieces of the decedent concur with spouse — not remote collaterals. Engine must filter collateral heirs for Art. 1001 eligibility.

13. **Illegitimate decedent prerequisite**: T14 and T15 activate ONLY when `decedent.is_illegitimate = true`. If decedent has any children (LC or IC), parents receive nothing (Art. 903 ¶2). Engine must check this gate.

14. **BloodType distinction invariant**: In I13, full-blood siblings receive double the share of half-blood siblings. Engine must store and use the `blood_type` field on each sibling collateral.

15. **Escheat output invariant**: In I15, engine output must include: total amount = E, HeirCategory = STATE, and the escheat_deadline computed from decedent.date_of_death + 5 years.

---

## Summary

| ID | Scenario | Category | Estate | Key Rule | Sum ✓ |
|----|---------|---------|--------|---------|-------|
| TV-14 | T4 | Testate | ₱12M | IC = ½ × LC, no cap | ✓ |
| TV-15 | T6 | Testate | ₱8M | Ascendants ½, FP ½ | ✓ |
| TV-16 | T7 | Testate | ₱10M | Ascendants ½, spouse ¼, FP ¼ | ✓ |
| TV-17 | T8 | Testate | ₱12M | Ascendants ½, IC ¼ flat, FP ¼ | ✓ |
| TV-18 | T9 | Testate | ₱16M | Ascendants ½, IC ¼, Spouse ⅛, FP ⅛ | ✓ |
| TV-19 | T10 | Testate | ₱9M | IC ⅓, Spouse ⅓, FP ⅓ | ✓ |
| TV-20 | T11 | Testate | ₱6M | IC ½, FP ½ | ✓ |
| TV-21 | T12 | Testate | ₱10M | Spouse ½, FP ½ | ✓ |
| TV-22 | T14 | Testate | ₱8M | Parents of IC decedent ½, FP ½ | ✓ |
| TV-23 | T15 | Testate | ₱8M | Parents ¼, Spouse ¼, FP ½ | ✓ |
| TV-24 | I4 | Intestate | ₱14M | Unit ratio: LC=2, IC=1, Spouse=2 | ✓ |
| TV-25 | I7 | Intestate | ₱9M | IC take all equally | ✓ |
| TV-26 | I8 | Intestate | ₱10M | Spouse ½, IC ½ | ✓ |
| TV-27 | I9 | Intestate | ₱10M | Ascendants ½, IC ½ | ✓ |
| TV-28 | I10 | Intestate | ₱12M | Ascendants ½, IC ¼, Spouse ¼ | ✓ |
| TV-29 | I12 | Intestate | ₱8M | Spouse ½, Siblings ½ | ✓ |
| TV-30 | I13 | Intestate | ₱10M | Full blood 2×, half blood 1× | ✓ |
| TV-31 | I14 | Intestate | ₱6M | Nearest degree, equal, no blood dist. | ✓ |
| TV-32 | I15 | Intestate | ₱5M | Escheat to State | ✓ |
