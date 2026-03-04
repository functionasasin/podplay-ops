# Test Vectors — Philippine Inheritance Engine v2
*Wave 3 — Engine Design*
*Depends on: rust-types, pipeline-design, algorithms, heir-concurrence, legitime-fractions,
intestate-distribution, testate-validation, collation, vacancy-resolution, multiple-disinheritance-fix*

---

## Overview

This document specifies **27 test vectors** for the v2 inheritance engine, covering all 30 scenario
codes (T1–T15, I1–I15). Vectors TV-01 through TV-23 are inherited from the original analysis
(see `input/sources/worked-examples.md`). Vectors TV-MD-01 through TV-MD-05 cover BUG-001
(multiple disinheritance; see `analysis/multiple-disinheritance-fix.md`). This document adds
**vectors TV-N01 through TV-N27** for gap scenarios not previously covered.

### Coverage Map

| Scenario | Vector(s) | Status |
|----------|-----------|--------|
| **I1** | TV-01, TV-22 | ✓ existing |
| **I2** | TV-02, TV-07 (post-preterition), TV-10 | ✓ existing |
| **I3** | TV-03 | ✓ existing |
| **I4** | **TV-N01** | ✓ new |
| **I5** | TV-19, TV-23 | ✓ existing |
| **I6** | TV-05 | ✓ existing |
| **I7** | TV-17 | ✓ existing |
| **I8** | **TV-N02** | ✓ new |
| **I9** | **TV-N03** | ✓ new |
| **I10** | **TV-N04** | ✓ new |
| **I11** | TV-04 | ✓ existing |
| **I12** | **TV-N05** | ✓ new |
| **I13** | TV-15 | ✓ existing |
| **I14** | **TV-N06** | ✓ new |
| **I15** | TV-18 | ✓ existing |
| **T1** | TV-06, TV-21 | ✓ existing |
| **T2** | TV-12 | ✓ existing |
| **T3** | TV-07, TV-08, TV-09, TV-14 | ✓ existing |
| **T4** | **TV-N07** | ✓ new |
| **T5a** | TV-13 | ✓ existing |
| **T5b** | TV-11 | ✓ existing |
| **T6** | **TV-N08** | ✓ new |
| **T7** | **TV-N09** | ✓ new |
| **T8** | **TV-N10** | ✓ new |
| **T9** | **TV-N11** | ✓ new |
| **T10** | **TV-N12** | ✓ new |
| **T11** | **TV-N13** | ✓ new |
| **T12** | **TV-N14** | ✓ new |
| **T12-AM** | TV-16 | ✓ existing |
| **T13** | **TV-N15** | ✓ new |
| **T14** | **TV-N16** | ✓ new |
| **T15** | **TV-N17** | ✓ new |
| **BUG-001** | TV-MD-01 to TV-MD-05 | ✓ dedicated file |
| **Hare-Niemeyer** | **TV-N18** | ✓ new |
| **Collation debt** | **TV-N19** | ✓ new |

---

## Notation

- `E` = net distributable estate (centavos internally; pesos in this document)
- `E_adj` = collation-adjusted estate
- `n` = number of legitimate child lines
- `m` = number of illegitimate children
- `→ centavos` = exact integer centavos after Hare-Niemeyer rounding
- All monetary values in Philippine Pesos (₱) unless labelled `centavos`

---

## New Test Vectors

---

### TV-N01 — Intestate I4: n LC + m IC + Spouse

**Scenario**: I4 | **Key Mechanism**: Arts. 999, 983 — unit ratio: LC=2 units, IC=1 unit, Spouse=2 units. No cap in intestate.

**Inputs**:
- Estate: ₱12,000,000 | Will: null | Decedent: married, legitimate
- Heirs: `LC1` Ana, `LC2` Ben (legitimate), `IC1` Carmen (birth cert), `S` Diana

**Unit computation** (Art. 999: spouse = 2 units, same as LC; Art. 983: IC = 1 unit):
- Total units = 2 + 2 + 1 + 2 = 7
- Per unit (exact): ₱12,000,000 / 7 = ₱1,714,285.714285...
- Per unit in centavos: 1,200,000,000 / 7 = 171,428,571.4286...

**Hare-Niemeyer** (1,200,000,000 centavos total):
- LC1 exact = 2/7 × 1,200,000,000 = 342,857,142.857... → floor 342,857,142, remainder **6/7**
- LC2 exact = same → floor 342,857,142, remainder **6/7**
- IC1 exact = 1/7 × 1,200,000,000 = 171,428,571.428... → floor 171,428,571, remainder **3/7**
- S exact = 2/7 × 1,200,000,000 = 342,857,142.857... → floor 342,857,142, remainder **6/7**
- Sum of floors = 342,857,142 × 3 + 171,428,571 = 1,028,571,426 + 171,428,571 = 1,199,999,997
- Deficit = 1,200,000,000 − 1,199,999,997 = **3**
- Top 3 remainders: LC1 (6/7), LC2 (6/7), S (6/7) — all tied at 6/7; IC1 is 3/7
- Tie-break by input order: LC1 +1, LC2 +1, S +1

**Distribution**:
| Heir | Centavos | Pesos |
|------|----------|-------|
| LC1 | 342,857,143 | ₱3,428,571.43 |
| LC2 | 342,857,143 | ₱3,428,571.43 |
| IC1 | 171,428,571 | ₱1,714,285.71 |
| S | 342,857,143 | ₱3,428,571.43 |
| **Total** | **1,200,000,000** | **₱12,000,000.00** |

**Invariants**: Sum = E ✓; IC_units = ½ × LC_units ✓; no cap applies (intestate) ✓

---

### TV-N02 — Intestate I8: m IC + Spouse

**Scenario**: I8 | **Key Mechanism**: Art. 998 — spouse gets ½; IC split remaining ½ equally.

**Inputs**:
- Estate: ₱10,000,000 | Will: null | No G1, no G2
- Heirs: `IC1` Efren, `IC2` Flor, `IC3` Gardo, `S` Helena

**Distribution** (Art. 998 explicit formula — NOT unit ratio):
- S = E/2 = ₱5,000,000 (500,000,000 centavos, exact)
- IC_total = E/2 = 500,000,000 centavos
- Per IC exact = 500,000,000 / 3 = 166,666,666.666...

**Hare-Niemeyer** (IC pool = 500,000,000):
- IC1 floor = 166,666,666, remainder = **2/3**
- IC2 floor = 166,666,666, remainder = **2/3**
- IC3 floor = 166,666,666, remainder = **2/3**
- Sum of floors = 499,999,998; deficit = 2
- Tie-break by input order: IC1 +1, IC2 +1

**Distribution**:
| Heir | Centavos | Pesos |
|------|----------|-------|
| IC1 | 166,666,667 | ₱1,666,666.67 |
| IC2 | 166,666,667 | ₱1,666,666.67 |
| IC3 | 166,666,666 | ₱1,666,666.66 |
| S | 500,000,000 | ₱5,000,000.00 |
| **Total** | **1,000,000,000** | **₱10,000,000.00** |

**Note**: Art. 998 uses explicit fractions (½/½), not the unit ratio of Art. 999. Engine must use
the direct formula for I8, not `distribute_by_units()`.

---

### TV-N03 — Intestate I9: Legitimate Ascendants + m IC

**Scenario**: I9 | **Key Mechanism**: Art. 991 — ½ to ascendants, ½ to illegitimate children. Art. 986: parents equal.

**Inputs**:
- Estate: ₱8,000,000 | Will: null | No descendants, no spouse
- Heirs: `F` Ignacio (father), `M` Julia (mother), `IC1` Kevin, `IC2` Luisa

**Distribution**:
- Ascendants collective = ½ × ₱8M = ₱4,000,000
  - F = ₱2,000,000 (Art. 986: equal); M = ₱2,000,000
- IC collective = ½ × ₱8M = ₱4,000,000
  - IC1 = IC2 = ₱2,000,000 each (Art. 991: equal among IC)

**Distribution**:
| Heir | Share | Amount |
|------|-------|--------|
| F | ¼ | ₱2,000,000 |
| M | ¼ | ₱2,000,000 |
| IC1 | ¼ | ₱2,000,000 |
| IC2 | ¼ | ₱2,000,000 |
| **Total** | | **₱8,000,000** |

**No rounding** (all exact quarters). Iron Curtain Rule: Art. 992 does NOT apply here because the
decedent is legitimate and IC1/IC2 are the decedent's own illegitimate children.

---

### TV-N04 — Intestate I10: Legitimate Ascendants + m IC + Spouse

**Scenario**: I10 | **Key Mechanism**: Art. 1000 — ½ ascendants; ¼ IC (total); ¼ spouse.

**Inputs**:
- Estate: ₱12,000,000 | Will: null | No descendants
- Heirs: `F` Marcos (sole surviving ascendant), `IC1` Nena, `S` Oscar

**Distribution** (Art. 1000):
- F = ½ × ₱12M = ₱6,000,000 (sole ascendant → gets entire ascendant ½)
- IC collective = ¼ × ₱12M = ₱3,000,000; IC1 = ₱3,000,000 (only one IC)
- S = ¼ × ₱12M = ₱3,000,000

**Distribution**:
| Heir | Share | Amount |
|------|-------|--------|
| F | ½ | ₱6,000,000 |
| IC1 | ¼ | ₱3,000,000 |
| S | ¼ | ₱3,000,000 |
| **Total** | | **₱12,000,000** |

---

### TV-N05 — Intestate I12: Spouse + Siblings (Full/Half Blood Mix)

**Scenario**: I12 | **Key Mechanism**: Art. 1001 — spouse concurs with collaterals; spouse = ½,
siblings = ½ with 2:1 full/half blood ratio (Art. 1006).

**Inputs**:
- Estate: ₱10,000,000 | Will: null | No primary heirs (no descendants, no ascendants, no IC)
- Heirs: `S` Petra, `SIB1` Quinton (full blood), `SIB2` Rosa (half blood)

**Distribution** (Art. 1001):
- S = ½ × ₱10M = ₱5,000,000 (500,000,000 centavos, exact)
- Sibling pool = ½ × ₱10M = ₱5,000,000
  - Units: SIB1=2 (full), SIB2=1 (half); total = 3
  - Per unit (exact): 500,000,000 / 3 centavos

**Hare-Niemeyer** (sibling pool = 500,000,000):
- SIB1 exact = 2/3 × 500,000,000 = 333,333,333.333... → floor 333,333,333, remainder **1/3**
- SIB2 exact = 1/3 × 500,000,000 = 166,666,666.666... → floor 166,666,666, remainder **2/3**
- Sum of floors = 499,999,999; deficit = 1
- SIB2 has higher remainder (2/3 > 1/3) → SIB2 +1

**Distribution**:
| Heir | Blood | Units | Centavos | Pesos |
|------|-------|-------|----------|-------|
| S | — | — | 500,000,000 | ₱5,000,000.00 |
| SIB1 | Full | 2 | 333,333,333 | ₱3,333,333.33 |
| SIB2 | Half | 1 | 166,666,667 | ₱1,666,666.67 |
| **Total** | | 3 | **1,000,000,000** | **₱10,000,000.00** |

**Note**: Rounding bonus goes to SIB2 (half blood), not SIB1 (full blood), because SIB2 has the
larger fractional remainder. The engine must not assume full-blood heirs always get rounding bonuses.

---

### TV-N06 — Intestate I14: Other Collaterals (First Cousins)

**Scenario**: I14 | **Key Mechanism**: Arts. 1009-1010 — other collaterals inherit; nearer degree excludes more remote; equal within same degree; no blood ratio beyond nephews (Art. 1008).

**Inputs**:
- Estate: ₱6,000,000 | Will: null | No descendants, no ascendants, no spouse, no IC, no siblings
- Heirs: `C1` Salome (1st cousin, degree 4), `C2` Tirso (1st cousin, degree 4), `C3` Ursula (1st cousin, degree 4)

**Distribution** (Art. 1009: all inherit; Art. 1010: equal within same degree; no blood ratio at degree 4):
- Each = ₱6,000,000 / 3 = ₱2,000,000 (exact, no rounding)

**Distribution**:
| Heir | Degree | Amount |
|------|--------|--------|
| C1 | 4 | ₱2,000,000 |
| C2 | 4 | ₱2,000,000 |
| C3 | 4 | ₱2,000,000 |
| **Total** | | **₱6,000,000** |

**Note**: Art. 1008 applies the full/half blood ratio only to "brothers' children" (nephews/nieces,
degree 3). At degree 4 (first cousins), equal distribution applies regardless of blood type.

---

### TV-N07 — Testate T4: n LC + m IC, No Spouse, Cap Triggered

**Scenario**: T4 | **Key Mechanism**: Art. 895 cap triggered (m > 2n). FP_disposable = ₱0.

**Inputs**:
- Estate: ₱8,000,000 | Decedent: unmarried, legitimate
- Heirs: `LC1` Vera, `LC2` Waldo (n=2); `IC1` Ximena, `IC2` Yosef, `IC3` Zara, `IC4` Aldo, `IC5` Bella (m=5)
- Will: all heirs = LEGITIME_ONLY; no testamentary dispositions

**Legitime computation** (T4, n=2, m=5):
- G1 collective = ½ × ₱8M = ₱4,000,000; per LC = ₱4M/2 = ₱2,000,000
- FP_gross = ₱4,000,000; no spouse → FP_after_spouse = ₱4,000,000
- Per IC uncapped = ½ × ₱2M = ₱1,000,000; total uncapped = ₱5,000,000
- ₱5,000,000 > ₱4,000,000 → **CAP BITES** (m=5 > 2n=4)
- Per IC actual = ₱4,000,000 / 5 = ₱800,000; FP_disposable = ₱0

**Distribution**:
| Heir | Amount | Basis |
|------|--------|-------|
| LC1 | ₱2,000,000 | Art. 888 |
| LC2 | ₱2,000,000 | Art. 888 |
| IC1 | ₱800,000 | Art. 895 (capped) |
| IC2 | ₱800,000 | Art. 895 (capped) |
| IC3 | ₱800,000 | Art. 895 (capped) |
| IC4 | ₱800,000 | Art. 895 (capped) |
| IC5 | ₱800,000 | Art. 895 (capped) |
| **Total** | **₱8,000,000** | |

**No rounding needed** (all values exact). FP_disposable = ₱0 means any testamentary FP
disposition would be immediately inofficious.

**Comparison**: Cap threshold for T4 is m > 2n = 4. With m=5, cap is triggered. If m=4: each
IC uncapped = ₱2M × ½ = ₱1M × 4 = ₱4M = FP → cap borderline (₱1M each, FP_disposable=₱0).
If m=3: each IC = ₱750K, FP_disposable = ₱4M − ₱2.25M = ₱1.75M.

---

### TV-N08 — Testate T6: Ascendants Only

**Scenario**: T6 | **Key Mechanism**: Art. 889 — ascendants get ½; FP = ½.

**Inputs**:
- Estate: ₱10,000,000 | Decedent: unmarried, no descendants
- Heirs: `F` Carlos Sr. (father), `M` Dolores (mother), `FOUNDATION_Z` (voluntary)
- Will: F=EQUAL_WITH_CO_HEIRS; M=EQUAL_WITH_CO_HEIRS; FOUNDATION_Z=REMAINDER(FP)

**Legitimes** (T6: G2 collective = ½; Art. 986: parents equal):
- F = ½ × ½ × ₱10M = ₱2,500,000
- M = ₱2,500,000
- FP_disposable = ½ × ₱10M = ₱5,000,000

**Distribution**:
| Heir | Amount | Basis |
|------|--------|-------|
| F | ₱2,500,000 | Art. 889 |
| M | ₱2,500,000 | Art. 889 |
| FOUNDATION_Z | ₱5,000,000 | Will (FP) |
| **Total** | **₱10,000,000** | |

---

### TV-N09 — Testate T7: Ascendants + Spouse

**Scenario**: T7 | **Key Mechanism**: Art. 889 (ascendants ½), Art. 893 (spouse ¼ from FP).

**Inputs**:
- Estate: ₱12,000,000 | Decedent: married, no descendants, no IC
- Heirs: `F` Emmanuel (sole ascendant), `S` Fabia, `CHARITY_B` (voluntary)
- Will: F=LEGITIME_ONLY; S=LEGITIME_ONLY; CHARITY_B=REMAINDER(FP)

**Legitimes** (T7):
- F = ½ × ₱12M = ₱6,000,000 (sole ascendant)
- S = ¼ × ₱12M = ₱3,000,000 (Art. 893, charged to FP)
- FP_gross = ½ × ₱12M = ₱6,000,000
- FP_disposable = ₱6M − ₱3M = ₱3,000,000

**Distribution**:
| Heir | Legitime | FP | Total |
|------|----------|----|-------|
| F | ₱6,000,000 | — | ₱6,000,000 |
| S | ₱3,000,000 | — | ₱3,000,000 |
| CHARITY_B | — | ₱3,000,000 | ₱3,000,000 |
| **Total** | | | **₱12,000,000** |

---

### TV-N10 — Testate T8: Ascendants + m IC (Regime B, Flat ¼ for IC)

**Scenario**: T8 | **Key Mechanism**: Art. 896 — IC get **flat ¼** (not the cap rule from Regime A).
No per-IC cap arithmetic; simply divide ¼ equally among m IC.

**Inputs**:
- Estate: ₱8,000,000 | Decedent: unmarried, no descendants, no spouse
- Heirs: `F` Gregorio (father), `M` Herminia (mother), `IC1` Iris, `IC2` Julio (m=2)
- Will: all = LEGITIME_ONLY; remainder to UNIVERSITY_U

**Legitimes** (T8: Regime B):
- G2 (ascendants) collective = ½ × ₱8M = ₱4,000,000; F = M = ₱2,000,000 each
- G4 (IC) collective = **¼** × ₱8M = ₱2,000,000 (Art. 896, flat fraction)
  - IC1 = IC2 = ₱2M / 2 = ₱1,000,000 each
- FP_disposable = ½ − ¼ = ¼ × ₱8M = ₱2,000,000

**Distribution**:
| Heir | Amount | Basis |
|------|--------|-------|
| F | ₱2,000,000 | Art. 889 |
| M | ₱2,000,000 | Art. 889 |
| IC1 | ₱1,000,000 | Art. 896 (flat ¼/m) |
| IC2 | ₱1,000,000 | Art. 896 (flat ¼/m) |
| UNIVERSITY_U | ₱2,000,000 | Will (FP) |
| **Total** | **₱8,000,000** | |

**Critical distinction from Regime A**: Art. 895 cap rule does NOT apply here. IC get exactly ¼
regardless of count m. If m=10, each IC would get ₱200,000 (¼/10). No cap threshold exists in
Regime B — only in Regime A (T4/T5).

---

### TV-N11 — Testate T9: Ascendants + m IC + Spouse (Most Constrained)

**Scenario**: T9 | **Key Mechanism**: Art. 899 — G2=½, G4=¼, G3=⅛; FP_disposable=⅛. The most
constrained scenario in Philippine succession.

**Inputs**:
- Estate: ₱16,000,000 | Decedent: married, no G1 descendants
- Heirs: `F` Karlo (sole ascendant), `IC1` Lina, `IC2` Mico, `IC3` Nora (m=3), `S` Oswald, `FRIEND_R`
- Will: all = LEGITIME_ONLY; FRIEND_R = REMAINDER(FP)

**Legitimes** (T9: Regime B):
- G2 collective = ½ × ₱16M = ₱8,000,000; F (sole) = ₱8,000,000
- G4 collective = ¼ × ₱16M = ₱4,000,000; per IC = ₱4M/3 = ₱1,333,333.33...
- G3 = ⅛ × ₱16M = ₱2,000,000 (S)
- FP_disposable = ⅛ × ₱16M = ₱2,000,000

**Hare-Niemeyer** (IC pool = 400,000,000 centavos):
- Per IC exact = 400,000,000 / 3 = 133,333,333.333...
- IC1, IC2, IC3 floor = 133,333,333; sum = 399,999,999; deficit = 1
- Tie-break by input order: IC1 +1

**Distribution**:
| Heir | Centavos | Pesos | Basis |
|------|----------|-------|-------|
| F | 800,000,000 | ₱8,000,000.00 | Art. 889 |
| IC1 | 133,333,334 | ₱1,333,333.34 | Art. 899 (rounded up) |
| IC2 | 133,333,333 | ₱1,333,333.33 | Art. 899 |
| IC3 | 133,333,333 | ₱1,333,333.33 | Art. 899 |
| S | 200,000,000 | ₱2,000,000.00 | Art. 899 |
| FRIEND_R | 200,000,000 | ₱2,000,000.00 | Will (FP) |
| **Total** | **1,600,000,000** | **₱16,000,000.00** | |

**Note**: With FP_disposable = only ₱2,000,000, FRIEND_R receives at most ₱2M regardless of what
the will says. Any legacy exceeding ₱2M would trigger Art. 911 inofficiousness reduction.

---

### TV-N12 — Testate T10: Spouse + m IC Only (Regime C)

**Scenario**: T10 | **Key Mechanism**: Art. 894 — G3=⅓, G4=⅓, FP=⅓. No primary heirs.

**Inputs**:
- Estate: ₱9,000,000 | Decedent: married, no G1, no G2
- Heirs: `IC1` Priya, `IC2` Quentin (m=2), `S` Renata, `FIRM_F` (voluntary)
- Will: IC1+IC2+S = LEGITIME_ONLY; FIRM_F = FIXED(₱3,000,000)

**Legitimes** (T10: Regime C):
- G3 (spouse) = ⅓ × ₱9M = ₱3,000,000
- G4 (IC) collective = ⅓ × ₱9M = ₱3,000,000; per IC = ₱1,500,000 each (exact)
- FP_disposable = ⅓ × ₱9M = ₱3,000,000

**Inofficiousness check**: FIRM_F = ₱3,000,000 = FP_disposable → exactly equal, no reduction.

**Distribution**:
| Heir | Legitime | FP | Total |
|------|----------|----|-------|
| IC1 | ₱1,500,000 | — | ₱1,500,000 |
| IC2 | ₱1,500,000 | — | ₱1,500,000 |
| S | ₱3,000,000 | — | ₱3,000,000 |
| FIRM_F | — | ₱3,000,000 | ₱3,000,000 |
| **Total** | | | **₱9,000,000** |

---

### TV-N13 — Testate T11: IC Only (No Primary Heirs, No Spouse)

**Scenario**: T11 | **Key Mechanism**: Art. 901 — IC collective = ½; FP = ½.

**Inputs**:
- Estate: ₱10,000,000 | Decedent: unmarried, no G1, no G2
- Heirs: `IC1` Stella, `IC2` Tomas, `IC3` Ursula (m=3), `FRIEND_H` (voluntary)
- Will: IC1+IC2+IC3 = LEGITIME_ONLY; FRIEND_H = REMAINDER(FP)

**Legitimes** (T11):
- G4 collective = ½ × ₱10M = ₱5,000,000; per IC = ₱5M/3 = ₱1,666,666.67...
- FP_disposable = ₱5,000,000

**Hare-Niemeyer** (IC pool = 500,000,000 centavos):
- Per IC exact = 166,666,666.666... centavos
- IC1, IC2, IC3 floor = 166,666,666; sum = 499,999,998; deficit = 2
- Tie-break by input order: IC1 +1, IC2 +1

**Distribution**:
| Heir | Centavos | Pesos |
|------|----------|-------|
| IC1 | 166,666,667 | ₱1,666,666.67 |
| IC2 | 166,666,667 | ₱1,666,666.67 |
| IC3 | 166,666,666 | ₱1,666,666.66 |
| FRIEND_H | 500,000,000 | ₱5,000,000.00 |
| **Total** | **1,000,000,000** | **₱10,000,000.00** |

---

### TV-N14 — Testate T12: Spouse Only (Normal, Art. 900¶1)

**Scenario**: T12 | **Key Mechanism**: Art. 900¶1 — spouse = ½; FP = ½. Contrast with TV-16 (T12-AM).

**Inputs**:
- Estate: ₱8,000,000 | Decedent: married, no G1, no G2, no G4
- `S` Vilma (spouse, married 10 years, NOT articulo mortis), `NEPHEW_X` (voluntary)
- Will: S = LEGITIME_ONLY; NEPHEW_X = FIXED(₱4,000,000)

**Articulo mortis check** (Art. 900¶2): marriage_solemnized_in_articulo_mortis = false → ¶2 does NOT apply → standard ½.

**Legitimes** (T12):
- S = ½ × ₱8M = ₱4,000,000
- FP_disposable = ½ × ₱8M = ₱4,000,000

**Inofficiousness**: NEPHEW_X = ₱4,000,000 = FP → exactly equal, no reduction.

**Distribution**:
| Heir | Amount |
|------|--------|
| S | ₱4,000,000 |
| NEPHEW_X | ₱4,000,000 |
| **Total** | **₱8,000,000** |

**Key invariant**: T12 (normal) gives spouse ½; T12-AM (articulo mortis, < 3 months, < 5yr
cohabitation) gives spouse ⅓. Always check all three Art. 900¶2 conditions before applying ⅓.

---

### TV-N15 — Testate T13: No Compulsory Heirs (Entire Estate Disposable)

**Scenario**: T13 | **Key Mechanism**: Art. 842 — no legitime obligation; testator may dispose
of the entire estate by will.

**Inputs**:
- Estate: ₱5,000,000 | Decedent: unmarried, no descendants, no ascendants
- No compulsory heirs of any kind; `FOUNDATION_A` (voluntary legatee), `CHURCH_B` (voluntary)
- Will: FOUNDATION_A = FIXED(₱3,000,000); CHURCH_B = REMAINDER

**Computation** (T13):
- No legitimes to compute; FP_disposable = entire estate = ₱5,000,000
- FOUNDATION_A = ₱3,000,000; CHURCH_B = ₱2,000,000

**Distribution**:
| Heir | Amount |
|------|--------|
| FOUNDATION_A | ₱3,000,000 |
| CHURCH_B | ₱2,000,000 |
| **Total** | **₱5,000,000** |

**Warning**: Even in T13, Art. 911 inofficiousness still applies if total dispositions > estate.
The constraint is not on a *fraction* but on the absolute estate value.

---

### TV-N16 — Testate T14: Parents of Illegitimate Decedent, No Descendants, No Spouse

**Scenario**: T14 | **Key Mechanism**: Art. 903¶1 — when decedent is illegitimate and leaves no
descendants, parents are compulsory heirs at ½.

**Inputs**:
- Estate: ₱6,000,000 | **Decedent is_illegitimate = true** | no children/descendants, no spouse
- Heirs: `F` Armando (father), `M` Beatriz (mother), `FOUNDATION_C`
- Will: F=LEGITIME_ONLY; M=LEGITIME_ONLY; FOUNDATION_C=REMAINDER(FP)

**Prerequisite check**: Decedent is illegitimate ✓; no children/descendants ✓ → T14 applies.

**Legitimes** (T14: Art. 903¶1):
- Parents collective = ½ × ₱6M = ₱3,000,000
  - F = ½ × ₱3M = ₱1,500,000 (Art. 986: equal if both alive)
  - M = ₱1,500,000
- FP_disposable = ½ × ₱6M = ₱3,000,000

**Distribution**:
| Heir | Amount | Basis |
|------|--------|-------|
| F | ₱1,500,000 | Art. 903¶1 |
| M | ₱1,500,000 | Art. 903¶1 |
| FOUNDATION_C | ₱3,000,000 | Will (FP) |
| **Total** | **₱6,000,000** | |

**Iron Curtain**: Art. 992 blocks legitimate relatives from inheriting from an illegitimate
decedent's estate in the *intestate* context. T14 is the testate analog of this protection:
only the IC decedent's own parents can exercise this compulsory heir right.

---

### TV-N17 — Testate T15: Parents of Illegitimate Decedent + Spouse

**Scenario**: T15 | **Key Mechanism**: Art. 903¶2 — parents ¼ total, spouse ¼; FP = ½.

**Inputs**:
- Estate: ₱8,000,000 | **Decedent is_illegitimate = true** | no children/descendants
- Heirs: `F` Claro (father), `M` Dolores (mother), `S` Ernesto (spouse)
- Will: all = LEGITIME_ONLY; ASSOCIATE_D = REMAINDER(FP)

**Legitimes** (T15: Art. 903¶2):
- Parents collective = ¼ × ₱8M = ₱2,000,000; F = M = ₱1,000,000 each
- S (spouse) = ¼ × ₱8M = ₱2,000,000
- FP_disposable = ½ × ₱8M = ₱4,000,000

**Distribution**:
| Heir | Amount | Basis |
|------|--------|-------|
| F | ₱1,000,000 | Art. 903¶2 |
| M | ₱1,000,000 | Art. 903¶2 |
| S | ₱2,000,000 | Art. 903¶2 |
| ASSOCIATE_D | ₱4,000,000 | Will (FP) |
| **Total** | **₱8,000,000** | |

---

### TV-N18 — Hare-Niemeyer: Three-Way Tie on Remainder

**Scenario**: I1 | **Key Mechanism**: Tests tie-breaking behavior when multiple heirs have identical
fractional remainders.

**Inputs**:
- Estate: ₱10,000,000 | Will: null | No spouse
- Heirs: `LC1` Fred, `LC2` Grace, `LC3` Hugo (n=3 equal shares)

**Distribution** (Art. 980: equal intestate shares):
- Per heir (exact): 1,000,000,000 / 3 = 333,333,333.333... centavos
- Floor = 333,333,333 each; sum = 999,999,999; deficit = 1
- All three have identical remainder = 1/3
- **Tie-break rule**: Input order (LC1 first) → LC1 gets +1

**Distribution**:
| Heir | Centavos | Pesos |
|------|----------|-------|
| LC1 | 333,333,334 | ₱3,333,333.34 |
| LC2 | 333,333,333 | ₱3,333,333.33 |
| LC3 | 333,333,333 | ₱3,333,333.33 |
| **Total** | **1,000,000,000** | **₱10,000,000.00** |

**Expected RoundingAdjustment log entry**:
```json
{
  "step": 10,
  "heir_id": "LC1",
  "adjustment_centavos": 1,
  "tie_break_applied": true,
  "tie_break_position": 0
}
```

**Invariant**: The RoundingAdjustment log must identify when a tie-break was applied (to alert
the user that a ₱0.01 difference is not an error but an arithmetic necessity).

---

### TV-N19 — Collation Debt: Donation Exceeds Heir's Computed Share

**Scenario**: I1 with collation | **Key Mechanism**: Art. 1073–1077 — when collation deduction
exceeds heir's gross share, heir owes a debt to the estate. Engine clamps to ₱0 and emits
`CollationDebt` warning.

**Inputs**:
- Estate: ₱3,000,000 | Will: null
- Heirs: `LC1` Ida, `LC2` Jose (equal lines)
- Donations: ₱4,000,000 to LC1 (advance on inheritance, 2023)

**Collation** (E_adj = ₱3M + ₱4M = ₱7,000,000):
- n=2 lines; per line = ₱7M/2 = ₱3,500,000
- LC1 total entitlement = ₱3,500,000
- LC1 already received: ₱4,000,000 (donation)
- LC1 gross_share from estate = ₱3,500,000 − ₱4,000,000 = **−₱500,000**
- Negative → clamp to ₱0; LC1 owes ₱500,000 collation debt

- LC2 gross_share from estate = ₱3,500,000 (no donation)

**Verification**: LC2 receives ₱3,500,000 from actual estate; LC1 receives ₱0.
But actual estate = ₱3,000,000. If we pay LC2 ₱3,500,000, we need ₱500,000 from LC1's
collation debt to make up the shortfall. This is an Art. 1073 partition matter requiring
manual resolution (outside engine scope).

**Distribution from actual estate**:
| Heir | Total Entitlement | Already Received | From Estate | Debt |
|------|-------------------|-----------------|-------------|------|
| LC1 | ₱3,500,000 | ₱4,000,000 | **₱0** (clamped) | ₱500,000 |
| LC2 | ₱3,500,000 | — | ₱3,000,000* | — |
| **Total** | **₱7,000,000** | **₱4,000,000** | **₱3,000,000** | |

*LC2 gets only ₱3,000,000 (the full actual estate), not ₱3,500,000, because LC1's debt is outside engine scope.

**Engine output**:
```json
{
  "validation_warnings": [
    {
      "type": "CollationDebt",
      "heir_id": "LC1",
      "entitlement_centavos": 350000000,
      "received_centavos": 400000000,
      "debt_centavos": 50000000
    }
  ],
  "manual_review_flags": [
    {
      "type": "CollationDebtRequiresPartition",
      "details": "LC1's donation exceeds their intestate share by ₱500,000. Arts. 1073–1077 partition required."
    }
  ]
}
```

---

## Scenario Gap Analysis: TV-N Vectors Complete All 30

After adding TV-N01 through TV-N19, the 30 scenario codes are fully covered:

**Previously covered** (from `input/sources/worked-examples.md` and `analysis/multiple-disinheritance-fix.md`):
I1, I2, I3, I5, I6, I7, I11, I13, I15, T1, T2, T3, T5a, T5b, T12-AM, plus BUG-001 (TV-MD variants)

**Newly covered** (TV-N01 through TV-N17):
I4, I8, I9, I10, I12, I14, T4, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15

**Special-purpose** (TV-N18, TV-N19):
Hare-Niemeyer tie-breaking, collation debt clamping

---

## Cross-Reference to Existing Vectors

The following existing vectors must also be treated as canonical test cases for the v2 engine:

| Ref | Scenario | Key Feature |
|-----|----------|-------------|
| TV-01 | I1 | Single heir |
| TV-02 | I2 | Art. 996 spouse=child |
| TV-03 | I3 | 2:1 ratio, no cap |
| TV-04 | I11 | Art. 995 spouse sole |
| TV-05 | I6 | Art. 997 ½/½ |
| TV-06 | T1 | Art. 888, FP to charity |
| TV-07 | T3→I2 | Art. 854 preterition annulment |
| TV-08 | T3 | Art. 923 disinheritance representation |
| TV-09 | T3 | RA 8552 adopted = legitimate |
| TV-10 | I2 | Per stirpes 3 grandchildren |
| TV-11 | T5b | Collation + cap not triggered + Art. 911 |
| TV-12 | T2 | Art. 911 reduction + Art. 855 underprovision |
| TV-13 | T5a | Cap triggered, n=1, m=3 |
| TV-14 | MIXED | Art. 960(2) undisposed FP intestate |
| TV-15 | I13 | Art. 1006 full/half 2:1 |
| TV-16 | T12-AM | Art. 900¶2 ⅓ reduction |
| TV-17 | I7 | Art. 988 IC alone, equal, no cap |
| TV-18 | I15 | Art. 1011 State escheat |
| TV-19 | I5 | Arts. 969/977 total renunciation |
| TV-20 | I-ID | Art. 992 Iron Curtain Rule |
| TV-21 | T1 | Art. 863 fideicommissary + Art. 872 |
| TV-22 | I1+collation | Art. 1064 representation collation |
| TV-23 | I5 | Arts. 985-986 parents only |
| TV-MD-01 | BUG-001 | Batch disinheritance, 2 children, no reps |
| TV-MD-02 | BUG-001 | Batch disinheritance, one has reps |
| TV-MD-03 | BUG-001 | Child + spouse disinherited simultaneously |
| TV-MD-04 | BUG-001 | ScenarioCode genuinely changes (different FP) |
| TV-MD-05 | BUG-001 | Cascading disinheritance (parent+child) |

---

## 10 Formal Invariants

These invariants must hold for every valid `(input, output)` pair. The engine test suite should
assert these programmatically for all TV-N and TV-01 through TV-23 vectors.

**INV-1 Sum invariant**:
```
Σ(heir.from_estate_centavos for all heirs) = net_distributable_estate_centavos
```
No centavo is lost or created by the engine.

**INV-2 Total entitlement invariant**:
```
Σ(heir.total_entitlement_centavos for all heirs) = E_adj_centavos
```
When donations are present (collation), total entitlements sum to the collation-adjusted estate.

**INV-3 Legitime floor** (testate only):
```
For every compulsory heir h: h.total_centavos >= h.legitime_centavos
```
The will can give more than the legitime, never less.

**INV-4 Art. 895 ratio** (Regime A testate only):
```
In T4/T5 scenarios: each_ic_legitime_centavos <= (per_lc_legitime_centavos / 2) + 1
```
The `+1` allows for Hare-Niemeyer rounding. Strict inequality uses rational arithmetic.

**INV-5 Cap invariant** (Regime A testate only):
```
Σ(ic_legitime_centavos) <= fp_after_spouse_centavos
```
The aggregate IC legitime does not exceed the FP remaining after the spouse is satisfied.

**INV-6 Representation invariant** (per stirpes):
```
Σ(representative.centavos for representatives of heir H) = H_slot_centavos ± 1
```
The `±1` tolerance is for Hare-Niemeyer rounding within the slot.

**INV-7 Adoption equivalence**:
```
adopted_child.total_centavos == equally-positioned_legitimate_child.total_centavos
```
Under RA 8552 Sec. 17, an adopted child's share must be identical to a biological legitimate child's share in the same positional slot.

**INV-8 Preterition totality**:
```
If preterition_detected then all_testamentary_institutions_annulled == true
AND succession_type == Intestate (or MIXED if devises/legacies remain, Art. 854¶1)
```
Art. 854: preterition annuls ALL institutions. Devises/legacies may survive in MIXED succession.

**INV-9 Disinheritance exclusion**:
```
For every validly disinherited heir d (no reconciliation, valid ground, proven):
  d.from_estate_centavos == 0
  d.exclusion_reason == "ValidDisinheritance"
```
A disinherited heir receives nothing. Representatives may receive the slot (INV-6).

**INV-10 Scenario consistency**:
```
determine_scenario_code(classified_heirs, will) == state.scenario_code
```
After the pipeline completes, the scenario code computed from the final classified heir set must
match the scenario code used in all legitime and distribution computations. Called at most once
after all mutations (BUG-001 fix).

---

## JSON Input Shape (Abbreviated)

All test vectors should be expressible as `ComputationInput` JSON. Example structure for TV-N01:

```json
{
  "decedent": {
    "name": "Test Decedent",
    "date_of_death": "2026-01-01",
    "is_illegitimate": false,
    "marriage_solemnized_in_articulo_mortis": false,
    "was_ill_at_marriage": false,
    "illness_caused_death": false,
    "years_of_cohabitation": null
  },
  "estate": {
    "gross_value_centavos": 1200000000,
    "liabilities_centavos": 0
  },
  "heirs": [
    {
      "id": "LC1",
      "name": "Ana",
      "heir_type": "LegitimateChild",
      "is_alive": true,
      "filiation_proof": null,
      "children": [],
      "is_disinherited": false,
      "disinheritance_ground": null,
      "disinheritance_cause_proven": false,
      "is_reconciled": false,
      "blood_type": null
    },
    {
      "id": "LC2",
      "name": "Ben",
      "heir_type": "LegitimateChild",
      "is_alive": true,
      "filiation_proof": null,
      "children": [],
      "is_disinherited": false,
      "disinheritance_ground": null,
      "disinheritance_cause_proven": false,
      "is_reconciled": false,
      "blood_type": null
    },
    {
      "id": "IC1",
      "name": "Carmen",
      "heir_type": "IllegitimateChild",
      "is_alive": true,
      "filiation_proof": "BirthCertificate",
      "children": [],
      "is_disinherited": false,
      "disinheritance_ground": null,
      "disinheritance_cause_proven": false,
      "is_reconciled": false,
      "blood_type": null
    },
    {
      "id": "S",
      "name": "Diana",
      "heir_type": "Spouse",
      "is_alive": true,
      "filiation_proof": null,
      "children": [],
      "is_disinherited": false,
      "disinheritance_ground": null,
      "disinheritance_cause_proven": false,
      "is_reconciled": false,
      "blood_type": null
    }
  ],
  "donations": [],
  "will": null
}
```

**Expected output** (from TV-N01):
```json
{
  "scenario_code": "I4",
  "succession_type": "Intestate",
  "net_estate_centavos": 1200000000,
  "e_adj_centavos": 1200000000,
  "distributions": [
    { "heir_id": "LC1", "from_estate_centavos": 342857143 },
    { "heir_id": "LC2", "from_estate_centavos": 342857143 },
    { "heir_id": "IC1", "from_estate_centavos": 171428571 },
    { "heir_id": "S",   "from_estate_centavos": 342857143 }
  ],
  "rounding_adjustments": [
    { "heir_id": "LC1", "adjustment_centavos": 1, "tie_break_applied": true },
    { "heir_id": "LC2", "adjustment_centavos": 1, "tie_break_applied": true },
    { "heir_id": "S",   "adjustment_centavos": 1, "tie_break_applied": true }
  ]
}
```

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Existing vectors (TV-01 through TV-23) | 23 |
| BUG-001 vectors (TV-MD-01 through TV-MD-05) | 5 |
| New vectors (TV-N01 through TV-N19) | 19 |
| **Total test vectors** | **47** |
| Scenario codes covered | 30 / 30 (100%) |
| Rounding edge cases | 8 (TV-N01, N02, N05, N11, N13, N18, N19, TV-08) |
| Collation cases | 4 (TV-11, TV-22, TV-N19, TV-07 implied) |
| BUG-001 batch disinheritance | 5 (TV-MD-01 to TV-MD-05) |
