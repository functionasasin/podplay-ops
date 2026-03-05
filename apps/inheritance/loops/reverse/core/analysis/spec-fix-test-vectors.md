# Spec Fix: Missing Test Vectors

**Aspect**: spec-fix-test-vectors
**Wave**: 6 (Spec Fixes)
**Priority**: High (identified by spec-review)
**Depends On**: ALL Wave 1-5 aspects + spec-fix-mixed-succession, spec-fix-collateral-algorithm, spec-fix-fideicommissary

---

## Gap Identified by spec-review

The spec's 13 test vectors (TV-01 through TV-13) cover 10 scenarios and 16 features, but leave 10 important scenarios/features untested:

1. **Mixed succession** — will covers only part of FP, remainder distributes intestate
2. **Collateral distribution** — siblings with full/half blood weighting (I13)
3. **Articulo mortis** — T12 spouse ½→⅓ reduction (Art. 900 ¶2)
4. **IC-only** — illegitimate children as sole heirs (I7)
5. **Escheat** — no heirs at all, estate to State (I15)
6. **Total renunciation** — Art. 969, all nearest-degree renounce → next degree
7. **Iron Curtain** — Art. 992, illegitimate decedent with collateral filtering
8. **Fideicommissary** — Art. 863 substitution with legitime-burden partial validity
9. **Representation collation** — Art. 1064, grandchildren collate parent's donation
10. **Ascendant-only** — ascendants as sole heirs, no spouse (I5)

This fix adds TV-14 through TV-23 to close these gaps.

---

## TV-14: Mixed Succession — Will Covers Part of Free Portion

**Category**: Mixed succession (testate + intestate)
**Scenario**: T3 → MIXED
**Exercises**: Art. 960(2) undisposed FP passes intestate, share merging, mixed detection

### Inputs

```
EngineInput {
    net_distributable_estate: ₱10,000,000,
    decedent: {
        name: "Andres Lim",
        date_of_death: "2026-03-10",
        is_married: true,
        is_illegitimate: false,
    },
    family_tree: [
        { id: "LC1", name: "Belen Lim", relationship: LEGITIMATE_CHILD, is_alive: true },
        { id: "LC2", name: "Cesar Lim", relationship: LEGITIMATE_CHILD, is_alive: true },
        { id: "S", name: "Diana Lim", relationship: SURVIVING_SPOUSE, is_alive: true },
    ],
    will: {
        institutions: [
            { heir_ref: "LC1", share: EQUAL_WITH_CO_HEIRS },
            { heir_ref: "LC2", share: EQUAL_WITH_CO_HEIRS },
            { heir_ref: "CHARITY_A", share: FIXED(1_000_000), scope: FREE_PORTION },
        ],
        legacies: [],
        devises: [],
        disinheritances: [],
        substitutions: [],
    },
    donations: [],
    config: { retroactive_ra_11642: false },
}
```

### Step 1 — Classify Heirs

| Person | Category | Compulsory? |
|--------|----------|-------------|
| Belen (LC1) | LEGITIMATE_CHILD | Yes (Art. 887(1)) |
| Cesar (LC2) | LEGITIMATE_CHILD | Yes (Art. 887(1)) |
| Diana (S) | SURVIVING_SPOUSE | Yes (Art. 887(3)) |
| Charity A | VOLUNTARY | No |

### Step 2 — Build Lines

Counts: n = 2 legitimate child lines, m = 0, spouse = yes.

### Step 3 — Succession Type & Scenario

- Will exists → initially TESTATE
- 2 legitimate children + spouse → Scenario T3

### Step 5 — Compute Legitimes (Arts. 888, 892)

- Children's collective legitime = E × ½ = ₱5,000,000
- Per legitimate child = ₱5,000,000 / 2 = ₱2,500,000
- Spouse's legitime = one child's share = E / (2n) = ₱10,000,000 / 4 = ₱2,500,000 (Art. 892 ¶2, from FP)
- FP_gross = E × ½ = ₱5,000,000
- FP_after_spouse = ₱5,000,000 − ₱2,500,000 = ₱2,500,000
- FP_disposable = ₱2,500,000 (no IC)

### Mixed Succession Detection (Art. 960(2))

- Will testamentary FP dispositions: Charity A = ₱1,000,000
- FP_disposable = ₱2,500,000
- Will disposes ₱1,000,000 < ₱2,500,000 → **MIXED SUCCESSION**
- Undisposed FP = ₱2,500,000 − ₱1,000,000 = ₱1,500,000

### Step 6 — Testate Validation

- No preterition (all compulsory heirs addressed — spouse's omission from institution is NOT preterition) ✓
- Charity A ₱1,000,000 ≤ FP_disposable ₱2,500,000 → NOT inofficious ✓
- Spouse underprovision: spouse not mentioned in will, but receives legitime ₱2,500,000 from FP → recoverable via Art. 855 ✓

### Step 7 — Distribution (3-Phase Mixed Algorithm)

**Phase 1 — Legitimes (testate)**:
- LC1: ₱2,500,000 (Art. 888)
- LC2: ₱2,500,000 (Art. 888)
- S: ₱2,500,000 (Art. 892, from FP)

**Phase 2 — Testamentary FP dispositions**:
- Charity A: ₱1,000,000 (per will)

**Phase 3 — Undisposed FP distributes intestate** (₱1,500,000):
- Heir pool for intestate: LC1, LC2, S (same as compulsory heirs in I2)
- Art. 996: spouse = one child's share
- Total shares = n + 1 = 3
- Per share = ₱1,500,000 / 3 = ₱500,000

**Final Distribution (merged)**:

| Heir | Legitime | From Will (FP) | From Intestate | Total | Legal Basis |
|------|----------|---------------|----------------|-------|-------------|
| LC1 (Belen) | ₱2,500,000 | — | ₱500,000 | ₱3,000,000 | Arts. 888, 960(2) |
| LC2 (Cesar) | ₱2,500,000 | — | ₱500,000 | ₱3,000,000 | Arts. 888, 960(2) |
| S (Diana) | ₱2,500,000 | — | ₱500,000 | ₱3,000,000 | Arts. 892, 960(2) |
| Charity A | — | ₱1,000,000 | — | ₱1,000,000 | Will disposition |
| **Total** | **₱7,500,000** | **₱1,000,000** | **₱1,500,000** | **₱10,000,000** | |

### Verification

- Sum: ₱3M + ₱3M + ₱3M + ₱1M = ₱10M = E ✓
- Each compulsory heir ≥ legitime ✓
- Undisposed FP (₱1.5M) distributed intestate per Art. 960(2) ✓
- Mixed succession correctly detected (will < full FP) ✓

### Expected Narrative (LC1)

> **Belen Lim (legitimate child)** receives **₱3,000,000**.
> As a legitimate child (Art. 887(1)), Belen's legitime is one-half (½) of the estate divided equally among the legitimate children (Art. 888), giving her ₱2,500,000. The testator's will disposed of only ₱1,000,000 of the ₱2,500,000 free portion (to Charity A), leaving ₱1,500,000 undisposed. Under Art. 960(2) of the Civil Code, the undisposed portion passes by intestate succession. Per Art. 996, the surviving spouse receives a share equal to each child, so the ₱1,500,000 is divided into 3 equal shares of ₱500,000. Belen's total inheritance is ₱2,500,000 (legitime) + ₱500,000 (intestate share) = ₱3,000,000.

---

## TV-15: Collateral Distribution — Siblings with Full/Half Blood

**Category**: Intestate, collateral heirs
**Scenario**: I13
**Exercises**: Art. 1006 full/half blood 2:1 ratio, per capita siblings, 5th-degree limit

### Inputs

```
EngineInput {
    net_distributable_estate: ₱10,000,000,
    decedent: {
        name: "Eduardo Tan",
        date_of_death: "2026-04-15",
        is_married: false,
        is_illegitimate: false,
    },
    family_tree: [
        { id: "SIB1", name: "Flora Tan", relationship: SIBLING, is_alive: true,
          blood_type: FULL },
        { id: "SIB2", name: "Gino Tan", relationship: SIBLING, is_alive: true,
          blood_type: FULL },
        { id: "SIB3", name: "Hilda Reyes", relationship: SIBLING, is_alive: true,
          blood_type: HALF },
    ],
    will: null,
    donations: [],
    config: { retroactive_ra_11642: false },
}
```

Note: No descendants, no ascendants, no spouse, no illegitimate children. Collaterals inherit.

### Step 1 — Classify Heirs

| Person | Category | Compulsory? |
|--------|----------|-------------|
| Flora (SIB1) | COLLATERAL (sibling, full blood) | No |
| Gino (SIB2) | COLLATERAL (sibling, full blood) | No |
| Hilda (SIB3) | COLLATERAL (sibling, half blood) | No |

No compulsory heirs survive.

### Step 3 — Succession Type & Scenario

- Will: null → **INTESTATE**
- No descendants, ascendants, IC, or spouse → collateral relatives → **Scenario I13**

### Step 7 — Distribution (Arts. 1004, 1006)

Art. 1006: "Should brothers and sisters of the full blood survive together with brothers and sisters of the half blood, the former shall be entitled to a share double that of the latter."

2:1 unit method:
- Each full-blood sibling = 2 units
- Each half-blood sibling = 1 unit
- Total units = (2 × 2) + (1 × 1) = 5
- Per unit = ₱10,000,000 / 5 = ₱2,000,000

| Heir | Blood | Units | Share Fraction | Amount | Legal Basis |
|------|-------|-------|---------------|--------|-------------|
| SIB1 (Flora) | Full | 2 | 2/5 (0.4) | ₱4,000,000 | Arts. 1004, 1006 |
| SIB2 (Gino) | Full | 2 | 2/5 (0.4) | ₱4,000,000 | Arts. 1004, 1006 |
| SIB3 (Hilda) | Half | 1 | 1/5 (0.2) | ₱2,000,000 | Arts. 1004, 1006 |
| **Total** | | **5** | | **₱10,000,000** | |

### Verification

- Sum: ₱4M + ₱4M + ₱2M = ₱10M = E ✓
- Full-blood share = 2 × half-blood share (₱4M = 2 × ₱2M) ✓ (Art. 1006)
- No compulsory heirs → no legitime computation needed ✓

### Expected Narrative (SIB3)

> **Hilda Reyes (half-blood sibling)** receives **₱2,000,000**.
> With no descendants, ascendants, illegitimate children, or surviving spouse, the estate passes to the decedent's collateral relatives under intestate succession. Under Art. 1006 of the Civil Code, siblings of the full blood receive a share double that of siblings of the half blood. With 2 full-blood siblings (Flora and Gino) at 2 units each and 1 half-blood sibling (Hilda) at 1 unit, the total is 5 units. Each unit is worth ₱2,000,000. As a half-blood sibling, Hilda receives 1 unit (₱2,000,000).

---

## TV-16: Articulo Mortis — Spouse Sole Heir, Marriage at Point of Death

**Category**: Testate, articulo mortis
**Scenario**: T12-AM (Art. 900 ¶2)
**Exercises**: Articulo mortis 3-condition check, spouse ½→⅓ reduction, increased FP

### Inputs

```
EngineInput {
    net_distributable_estate: ₱9,000,000,
    decedent: {
        name: "Ignacio Bello",
        date_of_death: "2026-05-20",
        is_married: true,
        is_illegitimate: false,
        date_of_marriage: "2026-04-01",
        marriage_solemnized_in_articulo_mortis: true,
        was_ill_at_marriage: true,
        illness_caused_death: true,
        years_of_cohabitation: 1,
    },
    family_tree: [
        { id: "S", name: "Julia Bello", relationship: SURVIVING_SPOUSE, is_alive: true },
    ],
    will: {
        institutions: [
            { heir_ref: "S", share: LEGITIME_ONLY },
            { heir_ref: "NEPHEW_N", share: REMAINDER, scope: FREE_PORTION },
        ],
        legacies: [],
        devises: [],
        disinheritances: [],
        substitutions: [],
    },
    donations: [],
    config: { retroactive_ra_11642: false },
}
```

### Step 1 — Classify Heirs

| Person | Category | Compulsory? |
|--------|----------|-------------|
| Julia (S) | SURVIVING_SPOUSE | Yes (Art. 887(3)) |
| Nephew N | VOLUNTARY | No |

No descendants, no ascendants, no illegitimate children.

### Step 3 — Succession Type & Scenario

- Will exists → TESTATE
- Spouse is sole compulsory heir → **Scenario T12**

### Articulo Mortis Check (Art. 900 ¶2)

1. Marriage solemnized in articulo mortis? **Yes** ✓
2. Decedent died within 3 months of marriage? Date of marriage: 2026-04-01, date of death: 2026-05-20 → 49 days → **Yes** ✓
3. NOT living together 5+ years before marriage? Cohabitation = 1 year < 5 → **Yes** ✓

All 3 conditions met → **ARTICULO MORTIS APPLIES** → Spouse's legitime reduced from ½ to ⅓.

### Step 5 — Compute Legitimes (Art. 900 ¶2)

- Spouse's legitime = E × ⅓ = ₱9,000,000 × ⅓ = ₱3,000,000
- Free portion = E − ₱3,000,000 = ₱6,000,000

Compare: without articulo mortis, spouse would get ½ = ₱4,500,000 and FP = ₱4,500,000.

### Step 6 — Testate Validation

- No preterition (spouse instituted) ✓
- Nephew N receives FP (₱6,000,000) — no impairment of legitime ✓

### Step 7 — Distribution

| Heir | Legitime | Free Portion | Total | Legal Basis |
|------|----------|-------------|-------|-------------|
| S (Julia) | ₱3,000,000 | — | ₱3,000,000 | Art. 900 ¶2 |
| Nephew N | — | ₱6,000,000 | ₱6,000,000 | Will disposition |
| **Total** | **₱3,000,000** | **₱6,000,000** | **₱9,000,000** | |

### Verification

- Sum: ₱3M + ₱6M = ₱9M = E ✓
- Spouse gets ⅓ (not ½) due to articulo mortis ✓ (Art. 900 ¶2)
- 3 conditions all verified ✓
- FP increased from ₱4.5M to ₱6M due to reduced spouse legitime ✓

### Expected Narrative (S)

> **Julia Bello (surviving spouse)** receives **₱3,000,000**.
> As the sole compulsory heir, Julia's legitime would normally be one-half (½) of the estate under Art. 900 ¶1 of the Civil Code. However, the marriage was solemnized in articulo mortis, the decedent died within 3 months of the marriage (49 days), and the couple had not lived together as husband and wife for more than 5 years. Under Art. 900 ¶2, when all three conditions are met, the surviving spouse's legitime is reduced from one-half (½) to one-third (⅓). Julia therefore receives ₱3,000,000 (⅓ of ₱9,000,000). The remaining free portion of ₱6,000,000 passes to the testator's designated heir (Nephew N) per the will.

---

## TV-17: IC-Only — Illegitimate Children as Sole Heirs

**Category**: Intestate, illegitimate children only
**Scenario**: I7
**Exercises**: Art. 988 equal distribution among illegitimate children, no cap in intestate, filiation gate

### Inputs

```
EngineInput {
    net_distributable_estate: ₱6,000,000,
    decedent: {
        name: "Kevin Ramos",
        date_of_death: "2026-06-10",
        is_married: false,
        is_illegitimate: false,
    },
    family_tree: [
        { id: "IC1", name: "Lara Ramos", relationship: ILLEGITIMATE_CHILD, is_alive: true,
          filiation_proof: BIRTH_CERTIFICATE },
        { id: "IC2", name: "Marco Ramos", relationship: ILLEGITIMATE_CHILD, is_alive: true,
          filiation_proof: JUDGMENT },
        { id: "IC3", name: "Nina Ramos", relationship: ILLEGITIMATE_CHILD, is_alive: true,
          filiation_proof: PUBLIC_DOCUMENT },
    ],
    will: null,
    donations: [],
    config: { retroactive_ra_11642: false },
}
```

### Step 1 — Classify Heirs

| Person | Category | Compulsory? | Filiation Proven? |
|--------|----------|-------------|-------------------|
| Lara (IC1) | ILLEGITIMATE_CHILD | Yes (Art. 887(5)) | Yes (birth certificate, FC Art. 172(1)) |
| Marco (IC2) | ILLEGITIMATE_CHILD | Yes (Art. 887(5)) | Yes (judgment, FC Art. 172(2)) |
| Nina (IC3) | ILLEGITIMATE_CHILD | Yes (Art. 887(5)) | Yes (public document, FC Art. 172(3)) |

No legitimate descendants, no ascendants, no spouse.

### Step 3 — Succession Type & Scenario

- Will: null → **INTESTATE**
- Only illegitimate children survive → **Scenario I7**

### Step 7 — Distribution (Art. 988)

Art. 988: "In the absence of legitimate descendants or ascendants, the illegitimate children shall succeed to the entire estate."

Equal division among illegitimate children (no legitimate children → no 2:1 ratio needed):
- Per IC = ₱6,000,000 / 3 = ₱2,000,000

| Heir | Share Fraction | Amount | Legal Basis |
|------|---------------|--------|-------------|
| IC1 (Lara) | ⅓ (0.333...) | ₱2,000,000 | Art. 988 |
| IC2 (Marco) | ⅓ (0.333...) | ₱2,000,000 | Art. 988 |
| IC3 (Nina) | ⅓ (0.333...) | ₱2,000,000 | Art. 988 |
| **Total** | | **₱6,000,000** | |

### Verification

- Sum: ₱2M × 3 = ₱6M = E ✓
- All ICs receive equal shares (no LC present → no 2:1 ratio) ✓
- No cap rule in intestate ✓
- Each IC's filiation independently proven ✓

### Expected Narrative (IC1)

> **Lara Ramos (illegitimate child)** receives **₱2,000,000**.
> As an illegitimate child whose filiation is proven by birth certificate (Art. 172(1), Family Code), Lara is a compulsory heir. With no legitimate descendants, ascendants, or surviving spouse, the illegitimate children inherit the entire estate under Art. 988 of the Civil Code, dividing it equally. With 3 illegitimate children, each receives one-third (⅓) of ₱6,000,000 = ₱2,000,000.

---

## TV-18: Escheat — No Heirs, Estate to State

**Category**: Intestate, escheat
**Scenario**: I15
**Exercises**: Art. 1011 (State as heir of last resort), Arts. 1012-1014 (procedure)

### Inputs

```
EngineInput {
    net_distributable_estate: ₱5,000,000,
    decedent: {
        name: "Oscar Cruz",
        date_of_death: "2026-07-01",
        is_married: false,
        is_illegitimate: false,
    },
    family_tree: [],
    will: null,
    donations: [],
    config: { retroactive_ra_11642: false },
}
```

### Step 1 — Classify Heirs

No persons in family tree → no heirs of any class.

### Step 3 — Succession Type & Scenario

- Will: null → **INTESTATE**
- No descendants, ascendants, IC, spouse, or collaterals within 5th degree → **Scenario I15 (Escheat)**

### Step 7 — Distribution (Arts. 1011-1014)

Art. 1011: "In default of persons entitled to succeed in accordance with the provisions of the preceding Sections, the State shall inherit the whole estate."

| Heir | Share Fraction | Amount | Legal Basis |
|------|---------------|--------|-------------|
| State (Republic of the Philippines) | 1/1 (1.0) | ₱5,000,000 | Art. 1011 |
| **Total** | | **₱5,000,000** | |

Art. 1012 notes: "In order that the State may take possession of the property mentioned in the preceding article, the pertinent provisions of the Rules of Court must be observed." The engine produces the distribution; the procedural requirements (Art. 1012-1014) are out of scope.

### Verification

- Sum: ₱5M = E ✓
- No heirs of any class → escheat ✓ (Art. 1011)
- State inherits entire estate ✓

### Expected Narrative (State)

> **Republic of the Philippines (State)** receives **₱5,000,000**.
> The decedent has no surviving descendants (legitimate or illegitimate), ascendants, spouse, or collateral relatives within the fifth degree of consanguinity. Under Art. 1011 of the Civil Code, in default of all persons entitled to succeed, the State inherits the whole estate. The procedural requirements for the State to take possession are governed by Arts. 1012-1014 and the Rules of Court.

---

## TV-19: Total Renunciation — All Children Renounce, Parents Inherit

**Category**: Intestate, Art. 969 total renunciation
**Scenario**: I2 → total renunciation → re-evaluate → I5
**Exercises**: Art. 969 (next degree in own right), scenario re-evaluation, Art. 977 (no representation for renunciation)

### Inputs

```
EngineInput {
    net_distributable_estate: ₱12,000,000,
    decedent: {
        name: "Pablo Dela Rosa",
        date_of_death: "2026-08-01",
        is_married: false,
        is_illegitimate: false,
    },
    family_tree: [
        { id: "LC1", name: "Queenie Dela Rosa", relationship: LEGITIMATE_CHILD, is_alive: true,
          has_renounced: true },
        { id: "LC2", name: "Rafael Dela Rosa", relationship: LEGITIMATE_CHILD, is_alive: true,
          has_renounced: true },
        { id: "F", name: "Santiago Dela Rosa", relationship: LEGITIMATE_PARENT, is_alive: true,
          line: PATERNAL },
        { id: "M", name: "Teresa Dela Rosa", relationship: LEGITIMATE_PARENT, is_alive: true,
          line: MATERNAL },
    ],
    will: null,
    donations: [],
    config: { retroactive_ra_11642: false },
}
```

### Step 1 — Classify Heirs

| Person | Category | Compulsory? | Notes |
|--------|----------|-------------|-------|
| Queenie (LC1) | LEGITIMATE_CHILD | Yes → **RENOUNCED** | Art. 977: cannot be represented |
| Rafael (LC2) | LEGITIMATE_CHILD | Yes → **RENOUNCED** | Art. 977: cannot be represented |
| Santiago (F) | LEGITIMATE_PARENT | Yes (Art. 887(2)) | Available |
| Teresa (M) | LEGITIMATE_PARENT | Yes (Art. 887(2)) | Available |

### Art. 969 Total Renunciation Analysis

- ALL nearest-degree heirs (Class 1: legitimate children) have renounced
- Art. 977: Renouncing heirs CANNOT be represented (unlike predecease/disinheritance)
- Art. 969: When all heirs of the nearest degree renounce, the next degree inherits **in their own right** (not by representation, not by accretion)
- Next class: legitimate ascendants (parents)

### Scenario Re-evaluation

- Remove LC1 and LC2 from heir pool (renounced)
- Remaining: F (father) + M (mother) → **Scenario I5** (ascendants only)

### Step 7 — Distribution (Arts. 985, 986)

Art. 985: "In default of legitimate children and descendants of the deceased, his parents and ascendants shall inherit..."
Art. 986: "The father and mother, if living, shall inherit in equal shares."

| Heir | Share Fraction | Amount | Legal Basis |
|------|---------------|--------|-------------|
| F (Santiago) | ½ (0.5) | ₱6,000,000 | Arts. 969, 985, 986 |
| M (Teresa) | ½ (0.5) | ₱6,000,000 | Arts. 969, 985, 986 |
| **Total** | | **₱12,000,000** | |

### Verification

- Sum: ₱6M + ₱6M = ₱12M = E ✓
- Both children renounced → cannot be represented (Art. 977) ✓
- Total renunciation → Art. 969 next-degree in own right ✓
- Parents inherit equally (Art. 986) ✓
- Scenario correctly re-evaluated from I1/I2 → I5 ✓

### Expected Narrative (F)

> **Santiago Dela Rosa (legitimate parent)** receives **₱6,000,000**.
> Both legitimate children of the decedent (Queenie and Rafael) renounced their inheritance. Under Art. 977 of the Civil Code, a person who renounces an inheritance cannot be represented — their descendants do not step in. When all heirs of the nearest degree renounce (Art. 969), the next degree of heirs inherits in their own right. The decedent's parents (Santiago and Teresa) are the next class of heirs. Under Art. 986, both parents inherit in equal shares, receiving ₱6,000,000 each.

---

## TV-20: Iron Curtain — Illegitimate Decedent with Collateral Filtering

**Category**: Intestate, illegitimate decedent
**Scenario**: I-ID (illegitimate decedent special case)
**Exercises**: Art. 992 bilateral barrier, Art. 993 parents inherit, collateral filtering

### Inputs

```
EngineInput {
    net_distributable_estate: ₱8,000,000,
    decedent: {
        name: "Ulises Reyes",
        date_of_death: "2026-09-01",
        is_married: false,
        is_illegitimate: true,
    },
    family_tree: [
        { id: "F", name: "Victor Reyes", relationship: ILLEGITIMATE_PARENT, is_alive: true },
        { id: "SIB1", name: "Wendy Reyes", relationship: SIBLING, is_alive: true,
          blood_type: HALF, legitimacy: LEGITIMATE },
        { id: "SIB2", name: "Xavier Santos", relationship: SIBLING, is_alive: true,
          blood_type: HALF, legitimacy: ILLEGITIMATE },
    ],
    will: null,
    donations: [],
    config: { retroactive_ra_11642: false },
}
```

Note: Decedent (Ulises) is himself an illegitimate child. Victor is his father. Wendy is a legitimate half-sibling (Victor's legitimate child with another woman). Xavier is an illegitimate half-sibling (Victor's illegitimate child with yet another woman).

### Step 1 — Classify Heirs with Iron Curtain Filter

| Person | Relationship | Iron Curtain (Art. 992)? | Eligible? |
|--------|-------------|-------------------------|-----------|
| Victor (F) | Parent of illegitimate decedent | **Exception**: parents always eligible (Art. 903) | Yes |
| Wendy (SIB1) | Legitimate half-sibling | **BLOCKED** — Art. 992 bars legitimate relatives of parent | No |
| Xavier (SIB2) | Illegitimate half-sibling | Not blocked (also illegitimate) | Yes |

Art. 992: "An illegitimate child has no right to inherit ab intestato from the legitimate children and relatives of his father or mother; nor shall such children or relatives inherit in the same manner from the illegitimate child."

The Iron Curtain bars Wendy (legitimate child of Victor) from inheriting from Ulises (illegitimate child of Victor). Xavier (illegitimate child of Victor) is NOT blocked — they share the same side of the curtain.

### Step 3 — Succession Type & Scenario

- Will: null → **INTESTATE**
- Decedent is illegitimate → Art. 903 / Iron Curtain rules apply
- Surviving parent (Victor) present → parent inherits per Art. 903

### Step 7 — Distribution (Art. 903)

Art. 903: "The parents of an illegitimate child... shall inherit from such child to the exclusion of collateral relatives."

Father present → excludes all collateral relatives (including Xavier who survived the Iron Curtain filter).

| Heir | Share Fraction | Amount | Legal Basis |
|------|---------------|--------|-------------|
| F (Victor) | 1/1 (1.0) | ₱8,000,000 | Art. 903 |
| SIB1 (Wendy) | — | ₱0 | Blocked by Art. 992 (Iron Curtain) |
| SIB2 (Xavier) | — | ₱0 | Excluded by Art. 903 (parent present) |
| **Total** | | **₱8,000,000** | |

### Verification

- Sum: ₱8M = E ✓
- Iron Curtain correctly blocks Wendy (legitimate half-sibling) ✓
- Iron Curtain does NOT block Xavier (illegitimate half-sibling) ✓
- Parent excludes collaterals per Art. 903 ✓
- Father inherits entire estate ✓

### Expected Narrative (F)

> **Victor Reyes (parent of illegitimate decedent)** receives **₱8,000,000**.
> The decedent Ulises was an illegitimate child. Under Art. 992 of the Civil Code (the Iron Curtain Rule), an illegitimate child's legitimate relatives cannot inherit from them and vice versa. This bars Wendy (Victor's legitimate child) from inheriting. Xavier (Victor's illegitimate child) survives the Iron Curtain filter but is excluded by Art. 903, which provides that parents of an illegitimate child inherit to the exclusion of collateral relatives. Victor therefore inherits the entire estate of ₱8,000,000.

---

## TV-21: Fideicommissary Substitution — Art. 863 with Legitime Burden

**Category**: Testate, fideicommissary substitution
**Scenario**: T1 (2 legitimate children)
**Exercises**: Art. 863 4-condition validity, Art. 872 legitime immunity, partial validity

### Inputs

```
EngineInput {
    net_distributable_estate: ₱10,000,000,
    decedent: {
        name: "Yolanda Cruz",
        date_of_death: "2026-10-15",
        is_married: false,
        is_illegitimate: false,
    },
    family_tree: [
        { id: "LC1", name: "Zara Cruz", relationship: LEGITIMATE_CHILD, is_alive: true },
        { id: "LC2", name: "Adam Cruz", relationship: LEGITIMATE_CHILD, is_alive: true },
        { id: "GC1", name: "Bella Cruz", relationship: LEGITIMATE_GRANDCHILD,
          is_alive: true, parent: "LC1" },
    ],
    will: {
        institutions: [
            { heir_ref: "LC1", share: EQUAL_WITH_CO_HEIRS },
            { heir_ref: "LC2", share: EQUAL_WITH_CO_HEIRS },
        ],
        legacies: [],
        devises: [],
        disinheritances: [],
        substitutions: [
            {
                type: FIDEICOMMISSARY,
                fiduciary: "LC1",
                fideicommissary: "GC1",
                property_scope: ALL_OF_FIDUCIARY_SHARE,
                is_express: true,
            }
        ],
    },
    donations: [],
    config: { retroactive_ra_11642: false },
}
```

### Step 1 — Classify Heirs

| Person | Category | Compulsory? |
|--------|----------|-------------|
| Zara (LC1) | LEGITIMATE_CHILD | Yes (Art. 887(1)) — fiduciary |
| Adam (LC2) | LEGITIMATE_CHILD | Yes (Art. 887(1)) |
| Bella (GC1) | LEGITIMATE_GRANDCHILD | — (fideicommissary) |

### Fideicommissary Validation (Art. 863)

1. **One-degree limit**: LC1 (parent) → GC1 (child) = one generation → **PASS** ✓
2. **Both alive at testator's death**: LC1 alive, GC1 alive → **PASS** ✓
3. **Express**: Will explicitly creates fideicommissary substitution → **PASS** ✓
4. **Cannot burden legitime (Art. 872)**: Will leaves LC1 her entire share (legitime + FP portion). The fideicommissary obligation covers ALL of LC1's share, but this includes her legitime. → **PARTIAL VALID**

Under Art. 872, conditions (including preservation obligations) on the legitime are deemed not imposed. The fideicommissary obligation is **stripped from the legitime portion** and applies only to LC1's free portion share (if any).

### Step 3 — Succession Type & Scenario

- Will exists → TESTATE
- 2 legitimate children only → **Scenario T1**

### Step 5 — Compute Legitimes (Art. 888)

- Children's collective legitime = E × ½ = ₱5,000,000
- Per child = ₱5,000,000 / 2 = ₱2,500,000
- Free portion = ₱5,000,000

### Step 7 — Distribution

Will institutions: LC1 and LC2 EQUAL_WITH_CO_HEIRS → each gets ½ of estate.

- LC1 total: ₱5,000,000 (₱2,500,000 legitime + ₱2,500,000 FP)
- LC2 total: ₱5,000,000 (₱2,500,000 legitime + ₱2,500,000 FP)

### Fideicommissary Obligation (post-distribution metadata)

- LC1's legitime (₱2,500,000): **UNCONDITIONAL** — Art. 872 strips the fideicommissary charge
- LC1's FP share (₱2,500,000): **carries fideicommissary obligation** — must be preserved and transmitted to Bella (GC1) upon LC1's death

| Heir | Legitime | Free Portion | Total | Fideicommissary? | Legal Basis |
|------|----------|-------------|-------|-------------------|-------------|
| LC1 (Zara) | ₱2,500,000 | ₱2,500,000 | ₱5,000,000 | ₱2,500,000 FP only (Art. 863/872) | Art. 888, 863 |
| LC2 (Adam) | ₱2,500,000 | ₱2,500,000 | ₱5,000,000 | None | Art. 888 |
| GC1 (Bella) | — | — | ₱0 (now) | Expectancy on ₱2,500,000 | Art. 863 |
| **Total** | **₱5,000,000** | **₱5,000,000** | **₱10,000,000** | | |

### Verification

- Sum: ₱5M + ₱5M = ₱10M = E ✓
- LC1 = LC2 in share amounts ✓
- Fideicommissary obligation limited to FP portion (Art. 872) ✓
- One-degree condition met (parent→child) ✓
- Both alive at testator's death ✓
- Bella currently receives ₱0 — she has an expectancy, not a current share ✓

### Expected Narrative (LC1)

> **Zara Cruz (legitimate child, fiduciary)** receives **₱5,000,000**.
> As a legitimate child (Art. 887(1)), Zara's legitime is one-half (½) of the estate divided among 2 children (Art. 888), giving her ₱2,500,000. The testator's will also allocates ₱2,500,000 from the free portion to Zara. The will creates a fideicommissary substitution (Art. 863), charging Zara to preserve and transmit her share to Bella (her daughter). However, under Art. 872, conditions imposed on the legitime are deemed not written. The fideicommissary obligation therefore applies only to Zara's free portion share of ₱2,500,000, which must be preserved and transmitted to Bella upon Zara's death. Zara's legitime of ₱2,500,000 is unconditional.

---

## TV-22: Representation Collation — Grandchildren Collate Parent's Donation (Art. 1064)

**Category**: Intestate with collation, representation
**Scenario**: I1 (with collation)
**Exercises**: Art. 1064 (grandchildren collate parent's donations), Art. 908 (estate base), per stirpes representation

### Inputs

```
EngineInput {
    net_distributable_estate: ₱9,000,000,
    decedent: {
        name: "Carmen Aquino",
        date_of_death: "2026-11-01",
        is_married: false,
        is_illegitimate: false,
    },
    family_tree: [
        { id: "LC1", name: "David Aquino", relationship: LEGITIMATE_CHILD, is_alive: true },
        { id: "LC2", name: "Elena Aquino", relationship: LEGITIMATE_CHILD,
          is_alive: false, date_of_death: "2025-01-15" },
        { id: "GC1", name: "Faye Aquino", relationship: LEGITIMATE_GRANDCHILD,
          is_alive: true, parent: "LC2" },
        { id: "GC2", name: "Gabriel Aquino", relationship: LEGITIMATE_GRANDCHILD,
          is_alive: true, parent: "LC2" },
    ],
    will: null,
    donations: [
        {
            id: "D1",
            donee: "LC2",
            value_at_donation: 3_000_000,
            date: "2022-06-01",
            is_advance_on_inheritance: true,
            donor_exempt: false,
            is_support_education: false,
            is_wedding_gift: false,
        }
    ],
    config: { retroactive_ra_11642: false },
}
```

### Step 1 — Classify Heirs

| Person | Category | Compulsory? | Notes |
|--------|----------|-------------|-------|
| David (LC1) | LEGITIMATE_CHILD | Yes | Own right |
| Elena (LC2) | LEGITIMATE_CHILD | — | Predeceased → represented |
| Faye (GC1) | LEGITIMATE_GRANDCHILD | Yes | Represents LC2 |
| Gabriel (GC2) | LEGITIMATE_GRANDCHILD | Yes | Represents LC2 |

### Step 2 — Build Lines

| Line | Mode | Heir(s) |
|------|------|---------|
| Line 1 | OWN_RIGHT | LC1 |
| Line 2 | REPRESENTATION (of LC2) | GC1, GC2 |

Counts: n = 2 legitimate child lines, m = 0, no spouse.

### Step 3 — Succession Type & Scenario

- Will: null → **INTESTATE**
- 2 child lines → **Scenario I1**

### Step 4 — Compute Estate Base (Art. 908, Collation)

- Net estate at death: ₱9,000,000
- Donation D1 to LC2: ₱3,000,000 (collatable — advance on inheritance, valued at donation time per Art. 1071)
- **Estate base** (E_adj) = ₱9,000,000 + ₱3,000,000 = ₱12,000,000

### Step 7 — Distribution on Collated Estate

- Per line = E_adj / 2 = ₱12,000,000 / 2 = ₱6,000,000
  - LC1 (Line 1): ₱6,000,000
  - LC2's line (Line 2): ₱6,000,000

### Step 8 — Collation Adjustment (Art. 1064)

Art. 1064: "When grandchildren, who survive with their uncles and aunts, inherit from their grandparents in representation of their father or mother, they shall bring to collation all that their parents, if alive, would have been obliged to bring, even though such grandchildren have not inherited the property."

- LC2's line share: ₱6,000,000
- LC2's donation to collate: ₱3,000,000
- Net line share from estate: ₱6,000,000 − ₱3,000,000 = ₱3,000,000
- Per grandchild (per stirpes): ₱3,000,000 / 2 = ₱1,500,000

**Final Distribution from actual estate (₱9,000,000)**:

| Heir | Total Entitlement | Already Received | From Estate | Legal Basis |
|------|------------------|-----------------|-------------|-------------|
| LC1 (David) | ₱6,000,000 | — | ₱6,000,000 | Art. 980 |
| GC1 (Faye) | ₱3,000,000 | ₱0 (parent's donation) | ₱1,500,000 | Arts. 970, 1064 |
| GC2 (Gabriel) | ₱3,000,000 | ₱0 (parent's donation) | ₱1,500,000 | Arts. 970, 1064 |
| **Total** | **₱12,000,000** | **₱3,000,000** | **₱9,000,000** | |

### Verification

- From-estate sum: ₱6M + ₱1.5M + ₱1.5M = ₱9M = net estate ✓
- Total entitlement sum: ₱12M = E_adj (collated estate) ✓
- Art. 1064: grandchildren collate parent's donation even though they never received it ✓
- Line 2 total from estate (₱3M) = line share (₱6M) − parent's donation (₱3M) ✓
- LC1 line (₱6M) > LC2 line from estate (₱3M) — inequality is correct per collation rules ✓

### Expected Narrative (GC1)

> **Faye Aquino (grandchild, by representation)** receives **₱1,500,000 from the estate**.
> Faye's parent Elena (LC2) predeceased the decedent. Under Arts. 970 and 981, Faye and Gabriel inherit by right of representation, stepping into Elena's place. Under Art. 1064 of the Civil Code, grandchildren who inherit by representation must bring to collation all that their parent would have been obliged to collate, even though the grandchildren never received the donated property. Elena received a ₱3,000,000 donation (valued at donation time per Art. 1071), which is added to the estate base under Art. 908, making the collation-adjusted estate ₱12,000,000. Elena's line share is ₱6,000,000, reduced by the ₱3,000,000 donation, leaving ₱3,000,000 from the actual estate. Divided per stirpes between Faye and Gabriel, each receives ₱1,500,000.

---

## TV-23: Ascendant-Only — Parents as Sole Heirs

**Category**: Intestate, ascendant-only
**Scenario**: I5
**Exercises**: Arts. 985-987 ascendant succession, parent equal division, no representation in ascending line (Art. 972)

### Inputs

```
EngineInput {
    net_distributable_estate: ₱8,000,000,
    decedent: {
        name: "Hannah Villanueva",
        date_of_death: "2026-12-01",
        is_married: false,
        is_illegitimate: false,
    },
    family_tree: [
        { id: "F", name: "Ismael Villanueva", relationship: LEGITIMATE_PARENT, is_alive: true,
          line: PATERNAL },
        { id: "M", name: "Josefa Villanueva", relationship: LEGITIMATE_PARENT, is_alive: true,
          line: MATERNAL },
    ],
    will: null,
    donations: [],
    config: { retroactive_ra_11642: false },
}
```

No descendants (legitimate or illegitimate), no spouse, no collaterals needed.

### Step 1 — Classify Heirs

| Person | Category | Compulsory? |
|--------|----------|-------------|
| Ismael (F) | LEGITIMATE_PARENT | Yes (Art. 887(2)) |
| Josefa (M) | LEGITIMATE_PARENT | Yes (Art. 887(2)) |

### Step 3 — Succession Type & Scenario

- Will: null → **INTESTATE**
- No descendants, no IC, no spouse → only ascendants → **Scenario I5**

### Step 7 — Distribution (Arts. 985, 986)

Art. 985: "In default of legitimate children and descendants of the deceased, his parents and ascendants shall inherit..."
Art. 986: "The father and mother, if living, shall inherit in equal shares."

| Heir | Share Fraction | Amount | Legal Basis |
|------|---------------|--------|-------------|
| F (Ismael) | ½ (0.5) | ₱4,000,000 | Arts. 985, 986 |
| M (Josefa) | ½ (0.5) | ₱4,000,000 | Arts. 985, 986 |
| **Total** | | **₱8,000,000** | |

### Verification

- Sum: ₱4M + ₱4M = ₱8M = E ✓
- Parents inherit in equal shares (Art. 986) ✓
- No representation in ascending line (Art. 972) — rule noted, not exercised here ✓

### Expected Narrative (F)

> **Ismael Villanueva (legitimate parent)** receives **₱4,000,000**.
> With no surviving descendants (legitimate or illegitimate) or surviving spouse, the estate passes to the decedent's parents under Art. 985 of the Civil Code. Under Art. 986, both parents inherit in equal shares, each receiving one-half (½) of the estate. Ismael receives ₱4,000,000.

---

## Summary Matrix (TV-14 through TV-23)

| # | Name | Scenario | Key Features Tested |
|---|------|----------|-------------------|
| TV-14 | Mixed succession | T3 → MIXED | Art. 960(2), undisposed FP intestate, share merging |
| TV-15 | Collateral siblings | I13 | Art. 1006 full/half blood 2:1, per capita |
| TV-16 | Articulo mortis | T12-AM | Art. 900 ¶2, 3-condition check, ½→⅓ |
| TV-17 | IC-only | I7 | Art. 988 equal division, filiation gate |
| TV-18 | Escheat | I15 | Art. 1011, State as heir of last resort |
| TV-19 | Total renunciation | I2→I5 | Art. 969, Art. 977, scenario re-evaluation |
| TV-20 | Iron Curtain | I-ID | Art. 992, Art. 903, collateral filtering |
| TV-21 | Fideicommissary | T1 | Art. 863, Art. 872, partial validity |
| TV-22 | Representation collation | I1 | Art. 1064, Art. 908, ₱0-from-estate possible |
| TV-23 | Ascendant-only | I5 | Arts. 985-987, parent equal division |

### New Scenario Coverage

| Scenario | Test Vector(s) | Notes |
|----------|---------------|-------|
| I5 | TV-19 (via renunciation), TV-23 | Ascendant-only |
| I7 | TV-17 | IC-only |
| I13 | TV-15 | Collateral siblings |
| I15 | TV-18 | Escheat |
| I-ID | TV-20 | Illegitimate decedent |
| T12-AM | TV-16 | Articulo mortis |
| MIXED | TV-14 | Mixed succession |

### New Feature Coverage

| Feature | Test Vector(s) |
|---------|---------------|
| Mixed succession (Art. 960(2)) | TV-14 |
| Full/half blood siblings (Art. 1006) | TV-15 |
| Articulo mortis (Art. 900 ¶2) | TV-16 |
| IC sole heirs (Art. 988) | TV-17 |
| Escheat (Art. 1011) | TV-18 |
| Total renunciation (Art. 969) | TV-19 |
| Iron Curtain (Art. 992) | TV-20 |
| Fideicommissary substitution (Art. 863) | TV-21 |
| Representation collation (Art. 1064) | TV-22 |
| Ascendant-only (Arts. 985-987) | TV-23 |

### Combined Coverage (TV-01 through TV-23)

- **Total test vectors**: 23
- **Scenarios covered**: 17 (I1, I2, I3, I5, I6, I7, I11, I13, I15, I-ID, T1, T2, T3, T5a, T5b, T12-AM, MIXED)
- **Features covered**: 26
- **Invariants**: 10 (all applicable to new vectors)
- **Special mechanisms**: renunciation, articulo mortis, Iron Curtain, fideicommissary, collation by representation

---

*10 additional test vectors closing all gaps identified by spec-review. Each is fully deterministic and independently verifiable against the 10 test invariants.*
