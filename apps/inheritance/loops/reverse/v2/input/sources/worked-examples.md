# Worked Examples — Philippine Inheritance Distribution Engine (v2)

**Source**: Consolidated from `loops/inheritance-reverse/analysis/test-vectors.md` and
`loops/inheritance-reverse/analysis/spec-fix-test-vectors.md`
**Total**: 23 test vectors (TV-01 through TV-23)
**Scenarios covered**: 17 distinct scenarios (I1, I2, I3, I5, I6, I7, I11, I13, I15, I-ID,
T1, T2, T3, T5a, T5b, T12-AM, MIXED)

---

## Notation

- `E` = net distributable estate
- `E_adj` = collation-adjusted estate (E + collatable donations)
- `n` = number of legitimate child lines
- `m` = number of illegitimate children
- All monetary values in Philippine Pesos (₱)
- Article references = Civil Code unless prefixed (FC = Family Code, RA = Republic Act)

---

## TV-01 — Simple Intestate: Single Legitimate Child, No Spouse

**Scenario**: I1 | **Key Features**: Single-heir case, Art. 980

**Inputs**:
- Estate: ₱5,000,000 | Will: null | Decedent: unmarried, legitimate
- Heirs: `LC1` (Maria Cruz, legitimate child, alive)

**Distribution**:
| Heir | Share | Amount | Basis |
|------|-------|--------|-------|
| LC1 | 1/1 | ₱5,000,000 | Art. 980 |

**Verification**: Sum = E ✓

---

## TV-02 — Standard Intestate: 3 Legitimate Children + Spouse

**Scenario**: I2 | **Key Features**: Art. 996 spouse-equal-to-child

**Inputs**:
- Estate: ₱12,000,000 | Will: null | Decedent: married, legitimate
- Heirs: `LC1` Ana, `LC2` Ben, `LC3` Carlos, `S` Rosa (all alive)

**Distribution** (Art. 996: spouse = one child's share; total shares = n+1 = 4):
| Heir | Share | Amount | Basis |
|------|-------|--------|-------|
| LC1 | ¼ | ₱3,000,000 | Arts. 980, 996 |
| LC2 | ¼ | ₱3,000,000 | Arts. 980, 996 |
| LC3 | ¼ | ₱3,000,000 | Arts. 980, 996 |
| S | ¼ | ₱3,000,000 | Art. 996 |
| **Total** | | **₱12,000,000** | |

---

## TV-03 — Illegitimate Mix: 2 LC + 1 IC, No Spouse, No Will

**Scenario**: I3 | **Key Features**: 2:1 unit ratio (Art. 983), NO cap in intestate

**Inputs**:
- Estate: ₱10,000,000 | Will: null | Decedent: unmarried, legitimate
- Heirs: `LC1` Elena, `LC2` Felix, `IC1` Gloria (filiation: birth certificate)

**Distribution** (units: 2+2+1=5; per unit = ₱2,000,000):
| Heir | Units | Share | Amount | Basis |
|------|-------|-------|--------|-------|
| LC1 | 2 | 2/5 | ₱4,000,000 | Art. 983 |
| LC2 | 2 | 2/5 | ₱4,000,000 | Art. 983 |
| IC1 | 1 | 1/5 | ₱2,000,000 | Arts. 983, 895 |
| **Total** | 5 | | **₱10,000,000** | |

**Note**: IC = ½ × LC share. Cap rule does NOT apply in intestate.

---

## TV-04 — Surviving Spouse Only

**Scenario**: I11 | **Key Features**: Art. 995 sole spouse inherits all

**Inputs**:
- Estate: ₱8,000,000 | Will: null | Decedent: married, no descendants, no ascendants
- Heirs: `S` Lucia (alone)

**Distribution**: Spouse inherits entire estate (Art. 995). Amount: ₱8,000,000.

---

## TV-05 — Ascendant + Spouse: No Children

**Scenario**: I6 | **Key Features**: Art. 997 ½/½ split, Art. 986 parent equal division

**Inputs**:
- Estate: ₱10,000,000 | Will: null | Decedent: married, no descendants
- Heirs: `S` Teresa, `F` Manuel (father), `M` Dolores (mother)

**Distribution** (Art. 997: spouse ½, ascendants ½; Art. 986: parents equal):
| Heir | Share | Amount | Basis |
|------|-------|--------|-------|
| S | ½ | ₱5,000,000 | Art. 997 |
| F | ¼ | ₱2,500,000 | Arts. 997, 986 |
| M | ¼ | ₱2,500,000 | Arts. 997, 986 |
| **Total** | | **₱10,000,000** | |

---

## TV-06 — Testate Simple: Will Leaves FP to Charity

**Scenario**: T1 | **Key Features**: Art. 888 legitime, valid FP disposition

**Inputs**:
- Estate: ₱10,000,000 | Decedent: unmarried, legitimate
- Heirs: `LC1` Daniel, `LC2` Eva, `CHARITY_C` (voluntary)
- Will: LC1 + LC2 = EQUAL_WITH_CO_HEIRS; CHARITY_C = REMAINDER (FP)

**Legitimes** (Art. 888): Children's collective = E × ½ = ₱5,000,000; per child = ₱2,500,000; FP = ₱5,000,000.

**Distribution**:
| Heir | Legitime | FP | Total | Basis |
|------|----------|----|-------|-------|
| LC1 | ₱2,500,000 | — | ₱2,500,000 | Art. 888 |
| LC2 | ₱2,500,000 | — | ₱2,500,000 | Art. 888 |
| CHARITY_C | — | ₱5,000,000 | ₱5,000,000 | Will |
| **Total** | | | **₱10,000,000** | |

---

## TV-07 — Preterition: Will Omits a Legitimate Child

**Scenario**: T3 → preterition → I2 | **Key Features**: Art. 854 total annulment

**Inputs**:
- Estate: ₱12,000,000 | Decedent: married, legitimate
- Heirs: `LC1` Bea, `LC2` Cris, `LC3` Dina (omitted), `S` Flora
- Will: institutes only LC1 (½) + LC2 (½); LC3 completely omitted

**Preterition trigger**: LC3 is compulsory heir in the direct line, totally omitted (no institution, no legacy, no devise, not disinherited). Art. 854 annuls ALL institutions. No legacies/devises → entire estate intestate.

**Post-annulment intestate** (I2 scenario, Art. 996):
| Heir | Share | Amount |
|------|-------|--------|
| LC1 | ¼ | ₱3,000,000 |
| LC2 | ¼ | ₱3,000,000 |
| LC3 | ¼ | ₱3,000,000 |
| S | ¼ | ₱3,000,000 |

**Key rule**: Spouse omission ≠ preterition (Art. 854 limited to direct line).

---

## TV-08 — Valid Disinheritance with Representation

**Scenario**: T3 | **Key Features**: Arts. 919/923, per stirpes, rounding

**Inputs**:
- Estate: ₱16,000,000 | Decedent: married, legitimate
- Heirs: `LC1` Irene, `LC2` Jorge, `LC3` Karen (DISINHERITED), `GC1` Luis (child of LC3), `GC2` Marta (child of LC3), `S` Nora, `FRIEND_F` (voluntary)
- Will: LC1+LC2 = EQUAL_WITH_CO_HEIRS; FRIEND_F = REMAINDER(FP); disinherits LC3 (Art. 919(6) maltreatment, proven, no reconciliation)

**Lines** (n=3): Line1=LC1; Line2=LC2; Line3=GC1+GC2 (represent LC3, Art. 923)

**Legitimes** (Art. 888, 892):
- Children collective = E × ½ = ₱8,000,000; per line = ₱8,000,000/3 = ₱2,666,666.67
- GC1 + GC2 each = ₱2,666,666.67 / 2 = ₱1,333,333.33 (per stirpes, Art. 974)
- Spouse = one child-line = ₱2,666,666.67 (Art. 892 ¶2, from FP)
- FP_disposable = ₱16M − ₱8M − ₱2,666,666.67 = ₱5,333,333.33

**Distribution**:
| Heir | Total | Basis |
|------|-------|-------|
| LC1 | ₱2,666,666.67 | Art. 888 |
| LC2 | ₱2,666,666.67 | Art. 888 |
| GC1 | ₱1,333,333.33 | Arts. 923, 970, 974 |
| GC2 | ₱1,333,333.33 | Arts. 923, 970, 974 |
| S | ₱2,666,666.67 | Art. 892 |
| FRIEND_F | ₱5,333,333.33 | Will |
| **Total** | **₱16,000,000** | |

**Rounding note**: Per-child-line = 16,000,000/6 = irrational → use Hare-Niemeyer to ensure sum = E exactly.

---

## TV-09 — Adopted Child Concurring with Biological Legitimate Children

**Scenario**: T3 | **Key Features**: RA 8552 Sec. 17 adopted = legitimate

**Inputs**:
- Estate: ₱15,000,000 | Decedent: married, legitimate
- Heirs: `LC1` Quentin, `LC2` Rita, `AC1` Sam (adopted, RA 8552, decree 2010-03-15, not rescinded), `S` Victor, `UNIVERSITY_U` (voluntary)
- Will: LC1+LC2+AC1 = EQUAL; UNIVERSITY_U = REMAINDER(FP)

**Key rule**: AC1 (Sam) is treated identically to LC1 and LC2 under RA 8552 Sec. 17. n=3 (counting AC1).

**Legitimes** (Art. 888, 892):
- Collective = ₱15M × ½ = ₱7,500,000; per child = ₱2,500,000
- Spouse = one child = ₱2,500,000 (Art. 892 ¶2, from FP)
- FP = ₱15M − ₱7,500,000 − ₱2,500,000 = ₱5,000,000

**Distribution**: LC1=₱2,500,000; LC2=₱2,500,000; AC1=₱2,500,000; S=₱2,500,000; UNIVERSITY_U=₱5,000,000. Sum=₱15,000,000.

**Invariant**: Any code producing AC1.share ≠ LC1.share is a bug.

---

## TV-10 — Representation: Predeceased Child with 3 Grandchildren

**Scenario**: I2 | **Key Features**: Arts. 970-974 per stirpes, line counting

**Inputs**:
- Estate: ₱20,000,000 | Will: null | Decedent: married, legitimate
- Heirs: `LC1` Faye, `LC2` Gil (predeceased 2025-06-01), `LC3` Helen, `GC1` Ian (child of LC2), `GC2` Joy (child of LC2), `GC3` Ken (child of LC2), `S` Lorna

**Lines** (n=3): Line1=LC1; Line2=GC1+GC2+GC3 (represent LC2); Line3=LC3

**Distribution** (Art. 996: total shares=3+1=4; per share=₱5,000,000; Line2 per stirpes):
| Heir | Share | Amount |
|------|-------|--------|
| LC1 | ¼ | ₱5,000,000 |
| GC1 | 1/12 | ₱1,666,666.67 |
| GC2 | 1/12 | ₱1,666,666.67 |
| GC3 | 1/12 | ₱1,666,666.67 |
| LC3 | ¼ | ₱5,000,000 |
| S | ¼ | ₱5,000,000 |
| **Total** | | **₱20,000,000** | |

**Key rule**: Lines (not heads) are counted. n=3 lines, not 5 surviving heirs.

---

## TV-11 — Complex: 2 LC + 1 IC + Spouse + Will + Collation

**Scenario**: T5b | **Key Features**: Art. 895 ¶3 cap (not triggered), Art. 1061 collation, Art. 911 inofficiousness

**Inputs**:
- Estate: ₱18,000,000 | Decedent: married, legitimate
- Heirs: `LC1` Pilar, `LC2` Ramon, `IC1` Sofia (filiation: judgment), `S` Tina, `FRIEND_G`
- Will: LC1+LC2=EQUAL_WITH_CO_HEIRS; IC1+S=LEGITIME_ONLY; FRIEND_G=FIXED(₱3,000,000)
- Donations: ₱2,000,000 to LC1 (advance on inheritance, 2020)

**Collation**: E_adj = ₱18M + ₱2M = ₱20,000,000

**Legitimes on E_adj** (Scenario T5b, n=2, m=1):
- LC per child = E_adj × ½ / 2 = ₱5,000,000
- IC1 uncapped = ½ × ₱5,000,000 = ₱2,500,000
- Spouse = E_adj / (2n) = ₱20M/4 = ₱5,000,000 (Art. 892 ¶2, from FP)
- FP_gross = ₱10,000,000; after spouse = ₱5,000,000; IC total (₱2,500,000) ≤ ₱5,000,000 → cap NOT triggered
- FP_disposable = ₱2,500,000

**Inofficiousness check**: FRIEND_G asked ₱3,000,000 > FP_disposable ₱2,500,000 → reduce to ₱2,500,000 (Art. 911)

**Distribution from actual estate (₱18,000,000)**:
| Heir | Total Entitlement | Already Received | From Estate | Basis |
|------|-------------------|-----------------|-------------|-------|
| LC1 | ₱5,000,000 | ₱2,000,000 | ₱3,000,000 | Arts. 888, 1061 |
| LC2 | ₱5,000,000 | — | ₱5,000,000 | Art. 888 |
| IC1 | ₱2,500,000 | — | ₱2,500,000 | Art. 895 |
| S | ₱5,000,000 | — | ₱5,000,000 | Art. 892 |
| FRIEND_G | ₱2,500,000 | — | ₱2,500,000 | Will (reduced) |
| **Total** | **₱20,000,000** | **₱2,000,000** | **₱18,000,000** | |

---

## TV-12 — Inofficious Will: Legacy Exceeds FP

**Scenario**: T2 | **Key Features**: Art. 911 reduction, Art. 855 underprovision

**Inputs**:
- Estate: ₱10,000,000 | Decedent: married, legitimate
- Heirs: `LC1` Wes, `S` Xena (not mentioned in will), `FRIEND_H` (legatee: ₱6,000,000)
- Will: LC1=LEGITIME_ONLY; legacy to FRIEND_H=₱6,000,000

**Legitimes** (Art. 888, 892): LC1=₱5,000,000 (½); S=₱2,500,000 (¼, from FP); FP=₱2,500,000.

**Checks**:
- Spouse omission ≠ preterition (not in direct line); remedy = Art. 855 underprovision recovery
- FRIEND_H ₱6,000,000 > FP ₱2,500,000 → INOFFICIOUS by ₱3,500,000 → reduce to ₱2,500,000 (Art. 911)

**Distribution**:
| Heir | Total | Basis |
|------|-------|-------|
| LC1 | ₱5,000,000 | Art. 888 |
| S | ₱2,500,000 | Art. 892 (via Art. 855) |
| FRIEND_H | ₱2,500,000 | Will (reduced per Art. 911) |
| **Total** | **₱10,000,000** | |

---

## TV-13 — Cap Rule Triggered: Many IC with Spouse

**Scenario**: T5a | **Key Features**: Art. 895 ¶3 cap triggered, spouse FP priority

**Inputs**:
- Estate: ₱20,000,000 | Decedent: married, legitimate
- Heirs: `LC1` Bianca, `IC1` Carlo (filiation: open possession), `IC2` Dante (birth cert), `IC3` Elisa (private document), `S` Fiona
- Will: all heirs = LEGITIME_ONLY

**Legitimes** (T5a, n=1, m=3):
- LC1 = E × ½ = ₱10,000,000
- FP_gross = ₱10,000,000; spouse = E × ¼ = ₱5,000,000 (Art. 892 ¶1); FP_remaining = ₱5,000,000
- Each IC uncapped = ½ × ₱10,000,000 = ₱5,000,000 × 3 = ₱15,000,000 total
- ₱15,000,000 > ₱5,000,000 → **CAP TRIGGERED**
- Each IC (capped) = ₱5,000,000 / 3 = ₱1,666,666.67; FP_disposable = ₱0

**Distribution**:
| Heir | Total | Basis |
|------|-------|-------|
| LC1 | ₱10,000,000 | Art. 888 |
| IC1 | ₱1,666,666.67 | Art. 895 (capped) |
| IC2 | ₱1,666,666.67 | Art. 895 (capped) |
| IC3 | ₱1,666,666.67 | Art. 895 (capped) |
| S | ₱5,000,000 | Art. 892 |
| **Total** | **₱20,000,000** | |

**Comparison (intestate I4)**: No cap → units: LC1=2, IC×3=3, S=2 → total=7 → each IC = ₱2,857,142.86 (71% more than testate).

---

## TV-14 — Mixed Succession: Will Covers Part of FP

**Scenario**: T3 → MIXED | **Key Features**: Art. 960(2) undisposed FP intestate

**Inputs**:
- Estate: ₱10,000,000 | Decedent: married, legitimate
- Heirs: `LC1` Belen, `LC2` Cesar, `S` Diana, `CHARITY_A` (voluntary)
- Will: LC1+LC2=EQUAL; CHARITY_A=FIXED(₱1,000,000) (FP scope)

**Legitimes** (T3 scenario, n=2): Children collective = ₱5,000,000; per child = ₱2,500,000; S = ₱2,500,000 (Art. 892 ¶2); FP_disposable = ₱2,500,000.

**Mixed detection**: Will testamentary FP = ₱1,000,000 < FP_disposable ₱2,500,000 → MIXED; undisposed FP = ₱1,500,000.

**3-Phase distribution**:
- Phase 1 (legitimes): LC1=₱2,500,000; LC2=₱2,500,000; S=₱2,500,000
- Phase 2 (will): CHARITY_A=₱1,000,000
- Phase 3 (intestate FP): ₱1,500,000 / 3 shares = ₱500,000 each (Art. 996: n+1 shares)

**Final**:
| Heir | Total | Basis |
|------|-------|-------|
| LC1 | ₱3,000,000 | Arts. 888, 960(2) |
| LC2 | ₱3,000,000 | Arts. 888, 960(2) |
| S | ₱3,000,000 | Arts. 892, 960(2) |
| CHARITY_A | ₱1,000,000 | Will |
| **Total** | **₱10,000,000** | |

---

## TV-15 — Collateral: Full/Half-Blood Siblings

**Scenario**: I13 | **Key Features**: Art. 1006 full:half = 2:1

**Inputs**:
- Estate: ₱10,000,000 | Will: null | No descendants, no ascendants, no spouse, no IC
- Heirs: `SIB1` Flora (full), `SIB2` Gino (full), `SIB3` Hilda (half)

**Distribution** (units: 2+2+1=5; per unit=₱2,000,000):
| Heir | Blood | Units | Amount |
|------|-------|-------|--------|
| SIB1 | Full | 2 | ₱4,000,000 |
| SIB2 | Full | 2 | ₱4,000,000 |
| SIB3 | Half | 1 | ₱2,000,000 |
| **Total** | | 5 | **₱10,000,000** |

---

## TV-16 — Articulo Mortis: Spouse Sole Heir, ½→⅓ Reduction

**Scenario**: T12-AM | **Key Features**: Art. 900 ¶2, 3-condition check

**Inputs**:
- Estate: ₱9,000,000 | Decedent: married 2026-04-01, died 2026-05-20 (49 days)
- `marriage_solemnized_in_articulo_mortis: true`; `was_ill_at_marriage: true`; `illness_caused_death: true`; `years_of_cohabitation: 1`
- Heirs: `S` Julia, `NEPHEW_N` (voluntary)

**Art. 900 ¶2 check**: (1) articulo mortis ✓ (2) died within 3 months (49 days) ✓ (3) < 5 yrs cohabitation ✓ → ALL met → **spouse legitime = ⅓ (NOT ½)**

**Legitimes**: S = ₱9M × ⅓ = ₱3,000,000; FP = ₱6,000,000 (vs normal ½: FP would be ₱4,500,000).

**Distribution**: S=₱3,000,000; NEPHEW_N=₱6,000,000. Sum=₱9,000,000.

---

## TV-17 — IC-Only: Illegitimate Children as Sole Heirs

**Scenario**: I7 | **Key Features**: Art. 988, equal division, no cap, filiation gate

**Inputs**:
- Estate: ₱6,000,000 | Will: null | No LC, no ascendants, no spouse
- Heirs: `IC1` Lara (birth cert), `IC2` Marco (judgment), `IC3` Nina (public document)

**Distribution** (Art. 988 — equal when no LC present): ₱6,000,000 / 3 = ₱2,000,000 each.

**Note**: No 2:1 ratio needed (no LC); no cap (not in FP context).

---

## TV-18 — Escheat: No Heirs, Estate to State

**Scenario**: I15 | **Key Features**: Art. 1011 State as heir of last resort

**Inputs**:
- Estate: ₱5,000,000 | Will: null | family_tree: []

**Distribution**: Republic of the Philippines receives ₱5,000,000 (Art. 1011). Procedural requirements (Arts. 1012-1014, Rules of Court) are out of scope for the engine.

---

## TV-19 — Total Renunciation: All Children Renounce, Parents Inherit

**Scenario**: I2 → total renunciation → I5 | **Key Features**: Art. 969, Art. 977

**Inputs**:
- Estate: ₱12,000,000 | Will: null
- Heirs: `LC1` Queenie (renounced), `LC2` Rafael (renounced), `F` Santiago (father), `M` Teresa (mother)

**Art. 969 / 977 logic**:
- All nearest-degree heirs renounced → Art. 977: renouncing heirs CANNOT be represented
- Art. 969: next degree inherits in own right (not by representation, not by accretion)
- Scenario re-evaluated: LC1 + LC2 removed → F + M → **I5**

**Distribution** (Art. 986: parents equal):
| Heir | Share | Amount |
|------|-------|--------|
| F | ½ | ₱6,000,000 |
| M | ½ | ₱6,000,000 |

---

## TV-20 — Iron Curtain: Illegitimate Decedent

**Scenario**: I-ID | **Key Features**: Art. 992 bilateral barrier, Art. 903

**Inputs**:
- Estate: ₱8,000,000 | Will: null | **Decedent is_illegitimate: true**
- Heirs: `F` Victor (illegitimate parent), `SIB1` Wendy (legitimate half-sibling), `SIB2` Xavier (illegitimate half-sibling)

**Iron Curtain filter (Art. 992)**:
- Wendy: legitimate half-sibling → BLOCKED (legitimate relative of parent cannot inherit from illegitimate child)
- Xavier: illegitimate half-sibling → NOT blocked (same side)
- Victor: parent → Exception (Art. 903 always allows parents)

**Art. 903 exclusion**: Parent present → excludes ALL collaterals (including Xavier).

**Distribution**: Victor = ₱8,000,000. Wendy = ₱0 (Art. 992). Xavier = ₱0 (Art. 903).

---

## TV-21 — Fideicommissary Substitution: Art. 863 with Legitime Burden

**Scenario**: T1 | **Key Features**: Art. 863 4-condition validity, Art. 872 legitime immunity

**Inputs**:
- Estate: ₱10,000,000 | Decedent: unmarried
- Heirs: `LC1` Zara, `LC2` Adam, `GC1` Bella (child of LC1)
- Will: LC1+LC2=EQUAL; substitution: fideicommissary LC1→GC1 (ALL of LC1's share, express)

**Fideicommissary validation (Art. 863)**:
1. One-degree limit: LC1 → GC1 (parent → child) ✓
2. Both alive at testator's death ✓
3. Express in will ✓
4. Art. 872 — cannot burden legitime: obligation applies to ENTIRE share (incl. legitime) → **partial valid** → strip from legitime, apply only to FP portion

**Legitimes**: n=2; per child = ₱5,000,000; FP = ₱5,000,000.

**Distribution**:
| Heir | Legitime | FP | Total | Fideicommissary? |
|------|----------|----|-------|-----------------|
| LC1 (Zara) | ₱2,500,000 | ₱2,500,000 | ₱5,000,000 | ₱2,500,000 FP only (Art. 872 strips legitime portion) |
| LC2 (Adam) | ₱2,500,000 | ₱2,500,000 | ₱5,000,000 | None |
| GC1 (Bella) | — | — | ₱0 now | Expectancy on ₱2,500,000 (upon LC1's death) |

---

## TV-22 — Representation Collation: Grandchildren Collate Parent's Donation (Art. 1064)

**Scenario**: I1 with collation | **Key Features**: Art. 1064, Art. 908

**Inputs**:
- Estate: ₱9,000,000 | Will: null
- Heirs: `LC1` David (alive), `LC2` Elena (predeceased), `GC1` Faye (child of LC2), `GC2` Gabriel (child of LC2)
- Donations: ₱3,000,000 to LC2 (advance on inheritance, 2022)

**Collation**: E_adj = ₱9M + ₱3M = ₱12,000,000 (Art. 908)

**Lines**: Line1=LC1; Line2=GC1+GC2 (represent LC2). n=2 → per line = ₱6,000,000.

**Art. 1064**: GC1+GC2 must collate what LC2 would have collated (₱3,000,000), even though grandchildren never received it.

**Line 2 settlement**: ₱6,000,000 − ₱3,000,000 = ₱3,000,000 from actual estate; per grandchild = ₱1,500,000.

**Final distribution from actual estate (₱9,000,000)**:
| Heir | Total Entitlement | Already Received | From Estate |
|------|-------------------|-----------------|-------------|
| LC1 | ₱6,000,000 | — | ₱6,000,000 |
| GC1 | ₱3,000,000 | ₱0 | ₱1,500,000 |
| GC2 | ₱3,000,000 | ₱0 | ₱1,500,000 |
| **Total** | **₱12,000,000** | **₱3,000,000** | **₱9,000,000** |

---

## TV-23 — Ascendant-Only: Parents as Sole Heirs

**Scenario**: I5 | **Key Features**: Arts. 985-986, no representation in ascending line (Art. 972)

**Inputs**:
- Estate: ₱8,000,000 | Will: null | No descendants, no IC, no spouse
- Heirs: `F` Ismael (father), `M` Josefa (mother)

**Distribution** (Art. 986: equal shares): F=₱4,000,000; M=₱4,000,000. Sum=₱8,000,000.

---

## Master Summary Matrix

| # | Scenario | Name | Key Mechanisms |
|---|----------|------|----------------|
| TV-01 | I1 | Simple intestate | Single heir |
| TV-02 | I2 | 3 LC + spouse | Art. 996 spouse=child |
| TV-03 | I3 | 2 LC + 1 IC | 2:1 ratio, no cap |
| TV-04 | I11 | Spouse only | Art. 995 |
| TV-05 | I6 | Ascendants + spouse | Art. 997 ½/½ |
| TV-06 | T1 | Simple testate | Art. 888, FP to charity |
| TV-07 | T3→I2 | Preterition | Art. 854 annulment |
| TV-08 | T3 | Disinheritance | Art. 923 representation |
| TV-09 | T3 | Adopted child | RA 8552 Sec. 17 |
| TV-10 | I2 | Representation | Arts. 970-974 per stirpes |
| TV-11 | T5b | Complex testate | Cap (not triggered), collation, Art. 911 |
| TV-12 | T2 | Inofficious will | Art. 911, Art. 855 |
| TV-13 | T5a | Cap rule triggered | Art. 895 ¶3, spouse priority |
| TV-14 | MIXED | Mixed succession | Art. 960(2) undisposed FP |
| TV-15 | I13 | Collateral siblings | Art. 1006 full:half 2:1 |
| TV-16 | T12-AM | Articulo mortis | Art. 900 ¶2, ½→⅓ |
| TV-17 | I7 | IC-only | Art. 988, no cap |
| TV-18 | I15 | Escheat | Art. 1011 State |
| TV-19 | I5 | Total renunciation | Arts. 969, 977 |
| TV-20 | I-ID | Iron Curtain | Art. 992, Art. 903 |
| TV-21 | T1 | Fideicommissary | Art. 863, Art. 872 |
| TV-22 | I1+collation | Representation collation | Art. 1064 |
| TV-23 | I5 | Ascendant-only | Arts. 985-986 |

---

## Test Invariants (Apply to All Vectors)

1. **Sum invariant**: Σ(per_heir_from_estate) = net_distributable_estate
2. **Total entitlement invariant**: Σ(total_entitlement) = E_adj (collated estate)
3. **Legitime floor**: For every compulsory heir h (testate): h.total ≥ h.legitime
4. **Art. 895 ratio**: In testate, IC_share ≤ ½ × LC_share (before cap; exact ½ in intestate)
5. **Cap invariant**: In testate, Σ(IC_legitimes) ≤ FP_remaining_after_spouse
6. **Representation invariant**: Σ(representatives_in_line) = line_ancestor_share (per stirpes)
7. **Adoption invariant**: adopted_child.share == biological_legitimate_child.share (always)
8. **Preterition invariant**: If preterition → ALL institutions annulled → entire estate intestate
9. **Disinheritance invariant**: Validly disinherited heir gets ₱0; descendants may represent (Art. 923)
10. **Scenario consistency**: The scenario code matches the surviving heir combination after eligibility gates

---

## Scenario Coverage Map

| Scenario | Vectors | Notes |
|----------|---------|-------|
| I1 | TV-01, TV-22 | |
| I2 | TV-02, TV-07 (post-preterition), TV-10 | |
| I3 | TV-03 | |
| I5 | TV-19 (via renunciation), TV-23 | |
| I6 | TV-05 | |
| I7 | TV-17 | IC sole heirs |
| I11 | TV-04 | |
| I13 | TV-15 | Collateral siblings |
| I15 | TV-18 | Escheat |
| I-ID | TV-20 | Illegitimate decedent |
| T1 | TV-06, TV-21 | |
| T2 | TV-12 | |
| T3 | TV-07, TV-08, TV-09, TV-14 | |
| T5a | TV-13 | |
| T5b | TV-11 | |
| T12-AM | TV-16 | Articulo mortis |
| MIXED | TV-14 | |

---

*Source: v1 analysis files (inheritance-reverse/analysis/). 23 test vectors spanning 17 scenarios and 26 features.*
