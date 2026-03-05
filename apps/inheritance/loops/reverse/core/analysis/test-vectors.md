# Test Vectors — Complete Test Cases for the Inheritance Distribution Engine

**Aspect**: test-vectors
**Wave**: 5 (Synthesis)
**Depends On**: ALL Wave 1-4 aspects + computation-pipeline + data-model

---

## Overview

This document provides **13 complete test cases** that exercise every major pathway through the inheritance distribution engine. Each test case specifies:

1. **Inputs**: All `EngineInput` fields (estate, decedent, family tree, will, donations, config)
2. **Heir classification**: Step 1 output (categories, eligibility)
3. **Succession type & scenario**: Step 3 output (T1-T15, I1-I15, or MIXED)
4. **Legitime computation**: Step 5 output (per-heir legitime fractions and peso amounts)
5. **Free portion / distribution**: Steps 6-7 output
6. **Final per-heir amounts**: Step 10 output
7. **Expected narrative**: At least one heir's complete narrative explanation
8. **Verification**: Sum invariant and legitime floor checks

### Notation

- `E` = net distributable estate
- `n` = number of legitimate child lines
- `m` = number of illegitimate children
- All fractions shown as both Unicode (½) and decimal (0.5)
- All monetary values in Philippine Pesos (₱)
- Article references to Civil Code unless prefixed (FC = Family Code, RA = Republic Act)

---

## TV-01: Simple Intestate — Single Legitimate Child, No Spouse

**Category**: Intestate, minimal scenario
**Scenario**: I1
**Exercises**: Basic intestate distribution, single-heir case

### Inputs

```
EngineInput {
    net_distributable_estate: ₱5,000,000,
    decedent: {
        name: "Juan Cruz",
        date_of_death: "2026-01-15",
        is_married: false,
        is_illegitimate: false,
    },
    family_tree: [
        { id: "LC1", name: "Maria Cruz", relationship: LEGITIMATE_CHILD, is_alive: true }
    ],
    will: null,
    donations: [],
    config: { retroactive_ra_11642: false },
}
```

### Step 1 — Classify Heirs

| Person | Category | Compulsory? | Eligible? |
|--------|----------|-------------|-----------|
| Maria Cruz (LC1) | LEGITIMATE_CHILD | Yes (Art. 887(1)) | Yes |

### Step 2 — Build Lines

| Line | Mode | Heir(s) |
|------|------|---------|
| Line 1 | OWN_RIGHT | LC1 |

Counts: n = 1 legitimate child line, m = 0 illegitimate, no spouse, no ascendants.

### Step 3 — Succession Type & Scenario

- Will: null → **INTESTATE**
- Surviving heirs: 1 legitimate child only → **Scenario I1**

### Step 5 — Legitime (informational only — intestate distributes entire estate)

Not applicable for intestate — entire estate distributes per statutory rules.

### Step 7 — Distribution (Art. 980)

- Single legitimate child inherits the entire estate.

| Heir | Share Fraction | Amount |
|------|---------------|--------|
| LC1 (Maria Cruz) | 1/1 (1.0) | ₱5,000,000 |
| **Total** | | **₱5,000,000** |

### Verification

- Sum: ₱5,000,000 = E ✓
- Single heir takes all ✓

### Expected Narrative (LC1)

> **Maria Cruz (legitimate child)** receives **₱5,000,000**.
> As the sole legitimate child of the decedent, Maria inherits the entire net distributable estate under intestate succession. Under Art. 980 of the Civil Code, children of the deceased inherit in their own right, dividing the inheritance in equal shares. With no other surviving heirs, Maria receives the full ₱5,000,000.

---

## TV-02: Standard Intestate — Married with 3 Legitimate Children

**Category**: Intestate, common family scenario
**Scenario**: I2
**Exercises**: Spouse equal-share rule (Art. 996), multi-child equal division

### Inputs

```
EngineInput {
    net_distributable_estate: ₱12,000,000,
    decedent: {
        name: "Pedro Santos",
        date_of_death: "2026-02-01",
        is_married: true,
        is_illegitimate: false,
    },
    family_tree: [
        { id: "LC1", name: "Ana Santos", relationship: LEGITIMATE_CHILD, is_alive: true },
        { id: "LC2", name: "Ben Santos", relationship: LEGITIMATE_CHILD, is_alive: true },
        { id: "LC3", name: "Carlos Santos", relationship: LEGITIMATE_CHILD, is_alive: true },
        { id: "S", name: "Rosa Santos", relationship: SURVIVING_SPOUSE, is_alive: true },
    ],
    will: null,
    donations: [],
    config: { retroactive_ra_11642: false },
}
```

### Step 1 — Classify Heirs

| Person | Category | Compulsory? | Eligible? |
|--------|----------|-------------|-----------|
| Ana (LC1) | LEGITIMATE_CHILD | Yes (Art. 887(1)) | Yes |
| Ben (LC2) | LEGITIMATE_CHILD | Yes (Art. 887(1)) | Yes |
| Carlos (LC3) | LEGITIMATE_CHILD | Yes (Art. 887(1)) | Yes |
| Rosa (S) | SURVIVING_SPOUSE | Yes (Art. 887(3)) | Yes |

### Step 2 — Build Lines

| Line | Mode | Heir(s) |
|------|------|---------|
| Line 1 | OWN_RIGHT | LC1 |
| Line 2 | OWN_RIGHT | LC2 |
| Line 3 | OWN_RIGHT | LC3 |

Counts: n = 3, m = 0, spouse = yes.

### Step 3 — Succession Type & Scenario

- Will: null → **INTESTATE**
- Surviving heirs: legitimate children + spouse → **Scenario I2**

### Step 7 — Distribution (Arts. 994, 996)

Art. 996: "The surviving spouse has in the succession the same share as that of each of the children."

- Total shares = n + 1 = 3 + 1 = 4
- Per share = ₱12,000,000 / 4 = ₱3,000,000

| Heir | Share Fraction | Amount | Legal Basis |
|------|---------------|--------|-------------|
| LC1 (Ana) | ¼ (0.25) | ₱3,000,000 | Art. 980, 996 |
| LC2 (Ben) | ¼ (0.25) | ₱3,000,000 | Art. 980, 996 |
| LC3 (Carlos) | ¼ (0.25) | ₱3,000,000 | Art. 980, 996 |
| S (Rosa) | ¼ (0.25) | ₱3,000,000 | Art. 996 |
| **Total** | | **₱12,000,000** | |

### Verification

- Sum: ₱3M × 4 = ₱12M = E ✓
- Spouse share = one child's share ✓ (Art. 996)

### Expected Narrative (S)

> **Rosa Santos (surviving spouse)** receives **₱3,000,000**.
> Under intestate succession (Art. 996 of the Civil Code), the surviving spouse is entitled to a share equal to that of each legitimate child. With 3 legitimate children, there are 4 equal shares totaling ₱12,000,000. Rosa's share is ₱3,000,000 (¼ of the estate).

---

## TV-03: Illegitimate Mix — 2 Legitimate Children + 1 Illegitimate Child, No Will

**Category**: Intestate, illegitimate child concurrence
**Scenario**: I3
**Exercises**: 2:1 unit ratio method (Art. 983 + Art. 895), NO cap rule in intestate

### Inputs

```
EngineInput {
    net_distributable_estate: ₱10,000,000,
    decedent: {
        name: "Diego Reyes",
        date_of_death: "2026-03-01",
        is_married: false,
        is_illegitimate: false,
    },
    family_tree: [
        { id: "LC1", name: "Elena Reyes", relationship: LEGITIMATE_CHILD, is_alive: true },
        { id: "LC2", name: "Felix Reyes", relationship: LEGITIMATE_CHILD, is_alive: true },
        { id: "IC1", name: "Gloria Reyes", relationship: ILLEGITIMATE_CHILD, is_alive: true,
          filiation_proof: BIRTH_CERTIFICATE },
    ],
    will: null,
    donations: [],
    config: { retroactive_ra_11642: false },
}
```

### Step 1 — Classify Heirs

| Person | Category | Compulsory? | Eligible? |
|--------|----------|-------------|-----------|
| Elena (LC1) | LEGITIMATE_CHILD | Yes (Art. 887(1)) | Yes |
| Felix (LC2) | LEGITIMATE_CHILD | Yes (Art. 887(1)) | Yes |
| Gloria (IC1) | ILLEGITIMATE_CHILD | Yes (Art. 887(5)) | Yes (filiation proven) |

### Step 2 — Build Lines

| Line | Mode | Heir(s) |
|------|------|---------|
| Line 1 (legit) | OWN_RIGHT | LC1 |
| Line 2 (legit) | OWN_RIGHT | LC2 |
| Line 3 (illegit) | OWN_RIGHT | IC1 |

Counts: n = 2, m = 1, no spouse.

### Step 3 — Succession Type & Scenario

- Will: null → **INTESTATE**
- Surviving heirs: legitimate children + illegitimate child → **Scenario I3**

### Step 7 — Distribution (Arts. 983, 895)

2:1 unit ratio method (NO cap in intestate):
- Each legitimate child = 2 units
- Each illegitimate child = 1 unit
- Total units = (2 × 2) + (1 × 1) = 5
- Per unit = ₱10,000,000 / 5 = ₱2,000,000

| Heir | Units | Share Fraction | Amount | Legal Basis |
|------|-------|---------------|--------|-------------|
| LC1 (Elena) | 2 | 2/5 (0.4) | ₱4,000,000 | Art. 983 |
| LC2 (Felix) | 2 | 2/5 (0.4) | ₱4,000,000 | Art. 983 |
| IC1 (Gloria) | 1 | 1/5 (0.2) | ₱2,000,000 | Arts. 983, 895 |
| **Total** | **5** | | **₱10,000,000** | |

### Verification

- Sum: ₱4M + ₱4M + ₱2M = ₱10M = E ✓
- IC share = ½ × LC share: ₱2M = ½ × ₱4M ✓ (Art. 895)
- No cap applied (intestate) ✓

### Expected Narrative (IC1)

> **Gloria Reyes (illegitimate child)** receives **₱2,000,000**.
> As an illegitimate child whose filiation is proven by birth certificate (Art. 172, Family Code), Gloria is a compulsory heir entitled to a share in the inheritance. Under Art. 983 of the Civil Code, when illegitimate children survive with legitimate children, the shares of the illegitimate children are in the proportion prescribed by Art. 895 — that is, one-half (½) of that of a legitimate child. With 2 legitimate children receiving ₱4,000,000 each (2 units), Gloria receives ₱2,000,000 (1 unit). Note: in intestate succession, the Art. 895 ¶3 cap rule does not apply.

---

## TV-04: Surviving Spouse Only — No Children, No Ascendants

**Category**: Intestate, spouse-only
**Scenario**: I11
**Exercises**: Spouse inherits entire estate when sole heir (Art. 995)

### Inputs

```
EngineInput {
    net_distributable_estate: ₱8,000,000,
    decedent: {
        name: "Mario Lim",
        date_of_death: "2026-01-20",
        is_married: true,
        is_illegitimate: false,
    },
    family_tree: [
        { id: "S", name: "Lucia Lim", relationship: SURVIVING_SPOUSE, is_alive: true },
    ],
    will: null,
    donations: [],
    config: { retroactive_ra_11642: false },
}
```

### Step 1 — Classify Heirs

| Person | Category | Compulsory? | Eligible? |
|--------|----------|-------------|-----------|
| Lucia (S) | SURVIVING_SPOUSE | Yes (Art. 887(3)) | Yes |

No descendants, no ascendants, no illegitimate children, no collaterals.

### Step 3 — Succession Type & Scenario

- Will: null → **INTESTATE**
- Surviving heirs: spouse only → **Scenario I11**

### Step 7 — Distribution (Art. 995)

> "In the absence of legitimate descendants and ascendants, and illegitimate children and their descendants, whether legitimate or illegitimate, the surviving spouse shall inherit the entire estate..." — Art. 995

| Heir | Share Fraction | Amount | Legal Basis |
|------|---------------|--------|-------------|
| S (Lucia) | 1/1 (1.0) | ₱8,000,000 | Art. 995 |
| **Total** | | **₱8,000,000** | |

### Verification

- Sum: ₱8M = E ✓
- Sole heir takes all ✓

### Expected Narrative (S)

> **Lucia Lim (surviving spouse)** receives **₱8,000,000**.
> As the sole surviving heir of the decedent, with no descendants, ascendants, or illegitimate children surviving, Lucia inherits the entire net distributable estate under Art. 995 of the Civil Code. The surviving spouse is entitled to the whole estate in the absence of all other classes of heirs.

---

## TV-05: Ascendant Succession — No Children, Surviving Parents + Spouse

**Category**: Intestate, ascendant concurrence
**Scenario**: I6
**Exercises**: ½/½ split between ascendants and spouse (Art. 997), ascendant division (Art. 986)

### Inputs

```
EngineInput {
    net_distributable_estate: ₱10,000,000,
    decedent: {
        name: "Roberto Garcia",
        date_of_death: "2026-04-10",
        is_married: true,
        is_illegitimate: false,
    },
    family_tree: [
        { id: "S", name: "Teresa Garcia", relationship: SURVIVING_SPOUSE, is_alive: true },
        { id: "F", name: "Manuel Garcia", relationship: LEGITIMATE_PARENT, is_alive: true, line: PATERNAL },
        { id: "M", name: "Dolores Garcia", relationship: LEGITIMATE_PARENT, is_alive: true, line: MATERNAL },
    ],
    will: null,
    donations: [],
    config: { retroactive_ra_11642: false },
}
```

### Step 1 — Classify Heirs

| Person | Category | Compulsory? | Eligible? |
|--------|----------|-------------|-----------|
| Teresa (S) | SURVIVING_SPOUSE | Yes (Art. 887(3)) | Yes |
| Manuel (F) | LEGITIMATE_PARENT | Yes (Art. 887(2)) | Yes |
| Dolores (M) | LEGITIMATE_PARENT | Yes (Art. 887(2)) | Yes |

No descendants present → ascendants NOT excluded.

### Step 3 — Succession Type & Scenario

- Will: null → **INTESTATE**
- Surviving heirs: legitimate ascendants + spouse → **Scenario I6**

### Step 7 — Distribution (Art. 997)

Art. 997: ½ to surviving spouse, ½ to ascendants.

- Spouse share: ₱10,000,000 × ½ = ₱5,000,000
- Ascendants share: ₱10,000,000 × ½ = ₱5,000,000
  - Both parents alive → equal split (Art. 986): ₱2,500,000 each

| Heir | Share Fraction | Amount | Legal Basis |
|------|---------------|--------|-------------|
| S (Teresa) | ½ (0.5) | ₱5,000,000 | Art. 997 |
| F (Manuel) | ¼ (0.25) | ₱2,500,000 | Arts. 997, 986 |
| M (Dolores) | ¼ (0.25) | ₱2,500,000 | Arts. 997, 986 |
| **Total** | | **₱10,000,000** | |

### Verification

- Sum: ₱5M + ₱2.5M + ₱2.5M = ₱10M = E ✓
- Spouse ½, ascendants ½ ✓ (Art. 997)
- Parents equal shares ✓ (Art. 986)

### Testate comparison (T7):
- In testate, spouse would get only ¼ (Art. 893) vs ½ intestate — spouse gets **double** in intestate.

### Expected Narrative (F)

> **Manuel Garcia (legitimate parent)** receives **₱2,500,000**.
> Under intestate succession (Art. 997 of the Civil Code), when the surviving spouse concurs with legitimate parents or ascendants, the spouse receives one-half (½) of the estate and the parents receive the other half. The ascendants' ½ share (₱5,000,000) is divided equally between both surviving parents (Art. 986), giving Manuel ₱2,500,000.

---

## TV-06: Testate Simple — Will Leaving Free Portion to Charity

**Category**: Testate, legitime-respecting will
**Scenario**: T1
**Exercises**: Legitime computation (Art. 888), free portion allocation, will validation (no reduction needed)

### Inputs

```
EngineInput {
    net_distributable_estate: ₱10,000,000,
    decedent: {
        name: "Carmen Dela Cruz",
        date_of_death: "2026-05-01",
        is_married: false,
        is_illegitimate: false,
    },
    family_tree: [
        { id: "LC1", name: "Daniel Dela Cruz", relationship: LEGITIMATE_CHILD, is_alive: true },
        { id: "LC2", name: "Eva Dela Cruz", relationship: LEGITIMATE_CHILD, is_alive: true },
    ],
    will: {
        institutions: [
            { heir_ref: "LC1", share: EQUAL_WITH_CO_HEIRS },
            { heir_ref: "LC2", share: EQUAL_WITH_CO_HEIRS },
            { heir_ref: "CHARITY_C", share: REMAINDER, scope: FREE_PORTION },
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
| Daniel (LC1) | LEGITIMATE_CHILD | Yes (Art. 887(1)) |
| Eva (LC2) | LEGITIMATE_CHILD | Yes (Art. 887(1)) |
| Charity C | VOLUNTARY (stranger) | No |

### Step 3 — Succession Type & Scenario

- Will exists, disposes of entire estate → **TESTATE**
- Surviving compulsory heirs: 2 legitimate children only → **Scenario T1**

### Step 5 — Compute Legitimes (Art. 888)

- Children's collective legitime = E × ½ = ₱5,000,000
- Per child = ₱5,000,000 / 2 = ₱2,500,000
- Free portion = E − ₱5,000,000 = ₱5,000,000

### Step 6 — Testate Validation

- No preterition (both children instituted) ✓
- No disinheritance ✓
- No underprovision (children get at least their legitime) ✓
- Charity C gets free portion (₱5,000,000) — does not impair any legitime ✓

### Step 7 — Distribution

| Heir | Legitime | Free Portion | Total | Legal Basis |
|------|----------|-------------|-------|-------------|
| LC1 (Daniel) | ₱2,500,000 | — | ₱2,500,000 | Art. 888 |
| LC2 (Eva) | ₱2,500,000 | — | ₱2,500,000 | Art. 888 |
| Charity C | — | ₱5,000,000 | ₱5,000,000 | Will disposition |
| **Total** | **₱5,000,000** | **₱5,000,000** | **₱10,000,000** | |

### Verification

- Sum: ₱2.5M + ₱2.5M + ₱5M = ₱10M = E ✓
- Each child ≥ legitime (₱2.5M ≥ ₱2.5M) ✓
- FP = ₱5M fully allocated to Charity C ✓

### Expected Narrative (LC1)

> **Daniel Dela Cruz (legitimate child)** receives **₱2,500,000**.
> As a legitimate child (Art. 887(1)), Daniel is a compulsory heir entitled to a legitime. Under Art. 888 of the Civil Code, the legitime of legitimate children is one-half (½) of the estate. With 2 legitimate children, the collective legitime of ₱5,000,000 is divided equally, giving Daniel ₱2,500,000. The remaining free portion (₱5,000,000) is validly disposed by the testator's will to Charity C.

---

## TV-07: Testate with Preterition — Will Omits a Legitimate Child

**Category**: Testate → converts to intestate via Art. 854
**Scenario**: T3 → preterition → I2
**Exercises**: Preterition detection, total annulment of institution, intestate fallback

### Inputs

```
EngineInput {
    net_distributable_estate: ₱12,000,000,
    decedent: {
        name: "Alberto Ramos",
        date_of_death: "2026-06-01",
        is_married: true,
        is_illegitimate: false,
    },
    family_tree: [
        { id: "LC1", name: "Bea Ramos", relationship: LEGITIMATE_CHILD, is_alive: true },
        { id: "LC2", name: "Cris Ramos", relationship: LEGITIMATE_CHILD, is_alive: true },
        { id: "LC3", name: "Dina Ramos", relationship: LEGITIMATE_CHILD, is_alive: true },
        { id: "S", name: "Flora Ramos", relationship: SURVIVING_SPOUSE, is_alive: true },
    ],
    will: {
        institutions: [
            { heir_ref: "LC1", share: FRACTION(1/2) },
            { heir_ref: "LC2", share: FRACTION(1/2) },
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

Note: LC3 (Dina) is completely omitted from the will — not instituted, not disinherited, no legacy/devise.

### Step 1 — Classify Heirs

| Person | Category | Compulsory? | In Direct Line? |
|--------|----------|-------------|----------------|
| Bea (LC1) | LEGITIMATE_CHILD | Yes | Yes |
| Cris (LC2) | LEGITIMATE_CHILD | Yes | Yes |
| Dina (LC3) | LEGITIMATE_CHILD | Yes | Yes |
| Flora (S) | SURVIVING_SPOUSE | Yes | No (affinity) |

### Step 3 — Succession Type & Scenario

- Will exists → initially TESTATE (would be T3: 3 children + spouse)

### Step 6 — Testate Validation: Preterition Check (Art. 854)

1. LC3 (Dina) is a compulsory heir **in the direct line** (legitimate child)
2. LC3 is **totally omitted** — no institution, no legacy, no devise, no disinheritance
3. **PRETERITION DETECTED** → Art. 854 applies
4. Effect: ALL institutions are **ANNULLED**
5. No legacies/devises exist → nothing to preserve
6. **Entire estate distributes intestate**

Note: Flora (spouse) is also not mentioned in the will, but spouse omission is NEVER preterition (Art. 854 is limited to heirs "in the direct line"). Flora's remedy would be Art. 855 underprovision, but since preterition already annuls the entire will, this is moot.

### Post-Preterition: Intestate Distribution (Scenario I2)

- 3 legitimate children + spouse, all intestate
- Art. 996: spouse = one child's share
- Total shares = 4
- Per share = ₱12,000,000 / 4 = ₱3,000,000

| Heir | Share Fraction | Amount | Legal Basis |
|------|---------------|--------|-------------|
| LC1 (Bea) | ¼ (0.25) | ₱3,000,000 | Art. 854 (annulment), Art. 996 |
| LC2 (Cris) | ¼ (0.25) | ₱3,000,000 | Art. 854 (annulment), Art. 996 |
| LC3 (Dina) | ¼ (0.25) | ₱3,000,000 | Art. 854 (annulment), Art. 996 |
| S (Flora) | ¼ (0.25) | ₱3,000,000 | Art. 854 (annulment), Art. 996 |
| **Total** | | **₱12,000,000** | |

### Verification

- Sum: ₱3M × 4 = ₱12M = E ✓
- Preterition correctly detected (LC3 totally omitted, direct line) ✓
- All institutions annulled ✓
- Intestate shares follow Art. 996 ✓

### Expected Narrative (LC3)

> **Dina Ramos (legitimate child)** receives **₱3,000,000**.
> Dina, a compulsory heir in the direct line, was completely omitted from the testator's will. Under Art. 854 of the Civil Code, the preterition (total omission) of a compulsory heir in the direct line annuls the institution of heirs. Since the will contained no separate legacies or devises, the entire estate distributes under intestate succession rules. Under Art. 996, the surviving spouse receives a share equal to each legitimate child. With 3 children and 1 spouse, there are 4 equal shares of ₱3,000,000 each.

---

## TV-08: Disinheritance — Will Disinherits a Child for Valid Cause

**Category**: Testate, valid disinheritance with representation
**Scenario**: T3 (3 child lines + spouse, one line by representation)
**Exercises**: Disinheritance validity (Art. 919), representation by descendants (Art. 923), per stirpes distribution

### Inputs

```
EngineInput {
    net_distributable_estate: ₱16,000,000,
    decedent: {
        name: "Hector Villanueva",
        date_of_death: "2026-07-01",
        is_married: true,
        is_illegitimate: false,
    },
    family_tree: [
        { id: "LC1", name: "Irene Villanueva", relationship: LEGITIMATE_CHILD, is_alive: true },
        { id: "LC2", name: "Jorge Villanueva", relationship: LEGITIMATE_CHILD, is_alive: true },
        { id: "LC3", name: "Karen Villanueva", relationship: LEGITIMATE_CHILD, is_alive: true },
        { id: "GC1", name: "Luis Villanueva", relationship: LEGITIMATE_GRANDCHILD,
          is_alive: true, parent: "LC3" },
        { id: "GC2", name: "Marta Villanueva", relationship: LEGITIMATE_GRANDCHILD,
          is_alive: true, parent: "LC3" },
        { id: "S", name: "Nora Villanueva", relationship: SURVIVING_SPOUSE, is_alive: true },
    ],
    will: {
        institutions: [
            { heir_ref: "LC1", share: EQUAL_WITH_CO_HEIRS },
            { heir_ref: "LC2", share: EQUAL_WITH_CO_HEIRS },
            { heir_ref: "FRIEND_F", share: REMAINDER, scope: FREE_PORTION },
        ],
        legacies: [],
        devises: [],
        disinheritances: [
            {
                heir_ref: "LC3",
                cause_code: ART_919_6,  // maltreatment by deed or word
                cause_proven: true,
                reconciliation_occurred: false,
            }
        ],
        substitutions: [],
    },
    donations: [],
    config: { retroactive_ra_11642: false },
}
```

### Step 1 — Classify Heirs

| Person | Category | Compulsory? |
|--------|----------|-------------|
| Irene (LC1) | LEGITIMATE_CHILD | Yes |
| Jorge (LC2) | LEGITIMATE_CHILD | Yes |
| Karen (LC3) | LEGITIMATE_CHILD → **DISINHERITED** | Removed |
| Luis (GC1) | LEGITIMATE_GRANDCHILD | Yes (represents LC3, Art. 923) |
| Marta (GC2) | LEGITIMATE_GRANDCHILD | Yes (represents LC3, Art. 923) |
| Nora (S) | SURVIVING_SPOUSE | Yes |
| Friend F | VOLUNTARY | No |

### Disinheritance Validation (Arts. 916-918)

1. In a will? Yes ✓
2. Cause specified? Yes (Art. 919(6): maltreatment) ✓
3. Cause proven? Yes (input: cause_proven = true) ✓
4. No reconciliation? Yes (input: reconciliation_occurred = false) ✓
5. **VALID disinheritance** — LC3 excluded from inheritance

### Step 2 — Build Lines (Art. 923)

LC3 is disinherited but has descendants → GC1 and GC2 represent LC3.

| Line | Mode | Heir(s) |
|------|------|---------|
| Line 1 | OWN_RIGHT | LC1 |
| Line 2 | OWN_RIGHT | LC2 |
| Line 3 | REPRESENTATION (of LC3) | GC1, GC2 |

Counts: n = 3 legitimate child lines, m = 0, spouse = yes.

### Step 3 — Succession Type & Scenario

- Will exists → TESTATE
- 3 child lines + spouse → **Scenario T3**

### Step 5 — Compute Legitimes (Arts. 888, 892)

- Children's collective legitime = E × ½ = ₱8,000,000
- Per child-line = ₱8,000,000 / 3 = ₱2,666,666.67
  - LC1: ₱2,666,666.67
  - LC2: ₱2,666,666.67
  - LC3 line (GC1 + GC2): ₱2,666,666.67 → ₱1,333,333.33 each (per stirpes, Art. 974)
- Spouse's legitime = one child-line's share = ₱2,666,666.67 (Art. 892 ¶2, from FP)
- Free portion = ₱16,000,000 − ₱8,000,000 − ₱2,666,666.67 = ₱5,333,333.33
- Will directs FP to Friend F

### Step 6 — Testate Validation

- No preterition: LC3 was disinherited (addressed in will, not omitted) ✓
- Disinheritance valid ✓
- Spouse not mentioned in institution but gets her legitime ✓
- FP allocation (₱5,333,333.33 to Friend F) does not impair any legitime ✓

### Step 7 — Distribution

| Heir | Legitime | Free Portion | Total | Legal Basis |
|------|----------|-------------|-------|-------------|
| LC1 (Irene) | ₱2,666,666.67 | — | ₱2,666,666.67 | Art. 888 |
| LC2 (Jorge) | ₱2,666,666.67 | — | ₱2,666,666.67 | Art. 888 |
| GC1 (Luis) | ₱1,333,333.33 | — | ₱1,333,333.33 | Arts. 923, 970, 974 |
| GC2 (Marta) | ₱1,333,333.33 | — | ₱1,333,333.33 | Arts. 923, 970, 974 |
| S (Nora) | ₱2,666,666.67 | — | ₱2,666,666.67 | Art. 892 |
| Friend F | — | ₱5,333,333.33 | ₱5,333,333.33 | Will disposition |
| **Total** | **₱10,666,666.67** | **₱5,333,333.33** | **₱16,000,000** | |

### Step 10 — Rounding (exact rational → centavos)

Using rational arithmetic: per-child-line = Fraction(16_000_000, 6) = Fraction(8_000_000, 3).

Rounding at centavo precision with largest-remainder method:
- LC1: ₱2,666,666.67
- LC2: ₱2,666,666.67
- GC1: ₱1,333,333.33
- GC2: ₱1,333,333.33
- S: ₱2,666,666.67
- Friend F: ₱5,333,333.33
- Sum: ₱16,000,000.00 ✓

### Verification

- Sum: ₱16,000,000 = E ✓
- GC1 + GC2 = ₱2,666,666.67 = one child-line's share ✓ (Art. 923)
- LC3 receives ₱0 (validly disinherited) ✓
- LC3 has no usufruct/administration over GC1/GC2's inheritance (Art. 923 ¶2) ✓

### Expected Narrative (GC1)

> **Luis Villanueva (grandchild, by representation)** receives **₱1,333,333.33**.
> Luis's parent Karen (LC3) was validly disinherited by the testator for maltreatment under Art. 919(6) of the Civil Code. Under Art. 923, the children of a disinherited heir take the disinherited heir's place and preserve the rights of compulsory heirs with respect to the legitime. The collective legitime of the legitimate children is ½ of the estate (₱8,000,000), divided into 3 lines of ₱2,666,666.67 each. Luis and Marta share Karen's line equally by right of representation (Art. 970), receiving ₱1,333,333.33 each. Note: Karen has no right of usufruct or administration over Luis's inheritance (Art. 923).

---

## TV-09: Adopted Child — Concurring with Biological Legitimate Children

**Category**: Testate, adoption equivalence
**Scenario**: T3 (3 children + spouse)
**Exercises**: RA 8552 Sec. 17 (adopted = legitimate), equal treatment verification

### Inputs

```
EngineInput {
    net_distributable_estate: ₱15,000,000,
    decedent: {
        name: "Patricia Torres",
        date_of_death: "2026-08-01",
        is_married: true,
        is_illegitimate: false,
    },
    family_tree: [
        { id: "LC1", name: "Quentin Torres", relationship: LEGITIMATE_CHILD, is_alive: true },
        { id: "LC2", name: "Rita Torres", relationship: LEGITIMATE_CHILD, is_alive: true },
        { id: "AC1", name: "Sam Torres", relationship: ADOPTED_CHILD, is_alive: true,
          adoption: { regime: RA_8552, decree_date: "2010-03-15", is_rescinded: false } },
        { id: "S", name: "Victor Torres", relationship: SURVIVING_SPOUSE, is_alive: true },
    ],
    will: {
        institutions: [
            { heir_ref: "LC1", share: EQUAL_WITH_CO_HEIRS },
            { heir_ref: "LC2", share: EQUAL_WITH_CO_HEIRS },
            { heir_ref: "AC1", share: EQUAL_WITH_CO_HEIRS },
            { heir_ref: "UNIVERSITY_U", share: REMAINDER, scope: FREE_PORTION },
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

| Person | Raw Relationship | Effective Category | Compulsory? |
|--------|-----------------|-------------------|-------------|
| Quentin (LC1) | LEGITIMATE_CHILD | LEGITIMATE_CHILD | Yes (Art. 887(1)) |
| Rita (LC2) | LEGITIMATE_CHILD | LEGITIMATE_CHILD | Yes (Art. 887(1)) |
| Sam (AC1) | ADOPTED_CHILD | **LEGITIMATE_CHILD** (RA 8552 Sec. 17) | Yes |
| Victor (S) | SURVIVING_SPOUSE | SURVIVING_SPOUSE | Yes (Art. 887(3)) |
| University U | — | VOLUNTARY | No |

**Key rule**: Under RA 8552 Sec. 17, "The adoptee shall be considered the legitimate son/daughter of the adopter(s) for all intents and purposes." Sam is treated identically to Quentin and Rita for ALL computation purposes.

### Step 3 — Succession Type & Scenario

- Will exists → TESTATE
- 3 legitimate children (including adopted) + spouse → **Scenario T3**

### Step 5 — Compute Legitimes (Arts. 888, 892)

- n = 3 (Quentin, Rita, Sam — all counted as legitimate children)
- Children's collective legitime = ₱15,000,000 × ½ = ₱7,500,000
- Per child = ₱7,500,000 / 3 = ₱2,500,000
- Spouse's legitime = one child's share = ₱2,500,000 (Art. 892 ¶2, from FP)
- Total legitime = ₱7,500,000 + ₱2,500,000 = ₱10,000,000
- Free portion = ₱15,000,000 − ₱10,000,000 = ₱5,000,000

### Step 6 — Testate Validation

- No preterition (all compulsory heirs addressed) ✓
- No disinheritance ✓
- FP (₱5,000,000) to University U — does not impair legitime ✓

### Step 7 — Distribution

| Heir | Legitime | Free Portion | Total | Legal Basis |
|------|----------|-------------|-------|-------------|
| LC1 (Quentin) | ₱2,500,000 | — | ₱2,500,000 | Art. 888 |
| LC2 (Rita) | ₱2,500,000 | — | ₱2,500,000 | Art. 888 |
| AC1 (Sam) | ₱2,500,000 | — | ₱2,500,000 | Art. 888, RA 8552 Sec. 17 |
| S (Victor) | ₱2,500,000 | — | ₱2,500,000 | Art. 892 |
| University U | — | ₱5,000,000 | ₱5,000,000 | Will disposition |
| **Total** | **₱10,000,000** | **₱5,000,000** | **₱15,000,000** | |

### Verification

- Sum: ₱15M = E ✓
- AC1 share = LC1 share = LC2 share (adopted = legitimate) ✓
- Each child ≥ legitime ✓
- Any code that produces a DIFFERENT share for AC1 than for LC1 or LC2 is **a bug** per RA 8552 Sec. 17

### Expected Narrative (AC1)

> **Sam Torres (adopted child)** receives **₱2,500,000**.
> Under RA 8552 (Domestic Adoption Act), Sec. 17, an adopted child is considered the legitimate child of the adopter for all intents and purposes, including succession. Sam therefore has the same successional rights as the biological legitimate children Quentin and Rita. Under Art. 888 of the Civil Code, the collective legitime of the legitimate children is ½ of the estate (₱7,500,000), divided equally among 3 children. Sam's legitime is ₱2,500,000 — identical to each biological child's share.

---

## TV-10: Representation — Predeceased Child with Grandchildren

**Category**: Intestate, representation
**Scenario**: I2
**Exercises**: Right of representation (Arts. 970-972), per stirpes distribution (Art. 974), line-based counting

### Inputs

```
EngineInput {
    net_distributable_estate: ₱20,000,000,
    decedent: {
        name: "Ernesto Mendoza",
        date_of_death: "2026-09-01",
        is_married: true,
        is_illegitimate: false,
    },
    family_tree: [
        { id: "LC1", name: "Faye Mendoza", relationship: LEGITIMATE_CHILD, is_alive: true },
        { id: "LC2", name: "Gil Mendoza", relationship: LEGITIMATE_CHILD,
          is_alive: false, date_of_death: "2025-06-01" },
        { id: "LC3", name: "Helen Mendoza", relationship: LEGITIMATE_CHILD, is_alive: true },
        { id: "GC1", name: "Ian Mendoza", relationship: LEGITIMATE_GRANDCHILD,
          is_alive: true, parent: "LC2" },
        { id: "GC2", name: "Joy Mendoza", relationship: LEGITIMATE_GRANDCHILD,
          is_alive: true, parent: "LC2" },
        { id: "GC3", name: "Ken Mendoza", relationship: LEGITIMATE_GRANDCHILD,
          is_alive: true, parent: "LC2" },
        { id: "S", name: "Lorna Mendoza", relationship: SURVIVING_SPOUSE, is_alive: true },
    ],
    will: null,
    donations: [],
    config: { retroactive_ra_11642: false },
}
```

### Step 1 — Classify Heirs

| Person | Category | Compulsory? | Notes |
|--------|----------|-------------|-------|
| Faye (LC1) | LEGITIMATE_CHILD | Yes | Inherits in own right |
| Gil (LC2) | LEGITIMATE_CHILD | — | Predeceased → represented |
| Helen (LC3) | LEGITIMATE_CHILD | Yes | Inherits in own right |
| Ian (GC1) | LEGITIMATE_GRANDCHILD | Yes | Represents LC2 |
| Joy (GC2) | LEGITIMATE_GRANDCHILD | Yes | Represents LC2 |
| Ken (GC3) | LEGITIMATE_GRANDCHILD | Yes | Represents LC2 |
| Lorna (S) | SURVIVING_SPOUSE | Yes | Art. 887(3) |

### Step 2 — Build Lines

| Line | Mode | Original Heir | Heir(s) in Line |
|------|------|---------------|----------------|
| Line 1 | OWN_RIGHT | LC1 (Faye) | LC1 |
| Line 2 | REPRESENTATION | LC2 (Gil, predeceased) | GC1, GC2, GC3 |
| Line 3 | OWN_RIGHT | LC3 (Helen) | LC3 |

Counts: n = 3 legitimate child lines, m = 0, spouse = yes.

### Step 3 — Succession Type & Scenario

- Will: null → **INTESTATE**
- 3 legitimate child lines + spouse → **Scenario I2**

### Step 7 — Distribution (Arts. 996, 970, 974, 981)

Art. 996: spouse = one child-line's share.
- Total shares = 3 lines + 1 spouse = 4
- Per share = ₱20,000,000 / 4 = ₱5,000,000

Line 2 (Gil's line) distributes per stirpes (Art. 974):
- GC1, GC2, GC3 split ₱5,000,000 equally = ₱1,666,666.67 each

| Heir | Share | Amount | Legal Basis |
|------|-------|--------|-------------|
| LC1 (Faye) | ¼ | ₱5,000,000 | Art. 980, 996 |
| GC1 (Ian) | 1/12 | ₱1,666,666.67 | Arts. 970, 974, 981 |
| GC2 (Joy) | 1/12 | ₱1,666,666.67 | Arts. 970, 974, 981 |
| GC3 (Ken) | 1/12 | ₱1,666,666.67 | Arts. 970, 974, 981 |
| LC3 (Helen) | ¼ | ₱5,000,000 | Art. 980, 996 |
| S (Lorna) | ¼ | ₱5,000,000 | Art. 996 |
| **Total** | | **₱20,000,000** | |

### Verification

- Sum: ₱5M + ₱1,666,666.67×3 + ₱5M + ₱5M = ₱5M + ₱5M + ₱5M + ₱5M = ₱20M ✓
- GC1 + GC2 + GC3 = ₱5,000,000 = one child-line's share ✓ (per stirpes)
- Spouse = one child-line = ₱5,000,000 ✓ (Art. 996)
- Lines counted (not heads): 3 lines + spouse, NOT 5 heirs + spouse ✓

### Expected Narrative (GC1)

> **Ian Mendoza (grandchild, by representation)** receives **₱1,666,666.67**.
> Ian's parent Gil (LC2) predeceased the decedent. Under Arts. 970 and 981 of the Civil Code, the children of a predeceased heir inherit by right of representation, stepping into their parent's place. Gil's line receives the same share as any other legitimate child line (₱5,000,000). Under Art. 974, this share is distributed per stirpes — equally among the 3 grandchildren (Ian, Joy, Ken), giving each ₱1,666,666.67. The surviving spouse Lorna receives an equal share to each child line under Art. 996.

---

## TV-11: Complex — Legitimate + Illegitimate Children + Surviving Spouse + Will + Collation

**Category**: Testate, complex multi-factor scenario
**Scenario**: T5b (2 LC + IC + spouse, with collation)
**Exercises**: Cap rule (Art. 895 ¶3), collation (Art. 1061), spouse priority in FP, inofficiousness check

### Inputs

```
EngineInput {
    net_distributable_estate: ₱18,000,000,
    decedent: {
        name: "Oscar Navarro",
        date_of_death: "2026-10-01",
        is_married: true,
        is_illegitimate: false,
    },
    family_tree: [
        { id: "LC1", name: "Pilar Navarro", relationship: LEGITIMATE_CHILD, is_alive: true },
        { id: "LC2", name: "Ramon Navarro", relationship: LEGITIMATE_CHILD, is_alive: true },
        { id: "IC1", name: "Sofia Navarro", relationship: ILLEGITIMATE_CHILD, is_alive: true,
          filiation_proof: JUDGMENT },
        { id: "S", name: "Tina Navarro", relationship: SURVIVING_SPOUSE, is_alive: true },
    ],
    will: {
        institutions: [
            { heir_ref: "LC1", share: EQUAL_WITH_CO_HEIRS },
            { heir_ref: "LC2", share: EQUAL_WITH_CO_HEIRS },
            { heir_ref: "IC1", share: LEGITIME_ONLY },
            { heir_ref: "S", share: LEGITIME_ONLY },
            { heir_ref: "FRIEND_G", share: FIXED(3_000_000) },
        ],
        legacies: [],
        devises: [],
        disinheritances: [],
        substitutions: [],
    },
    donations: [
        {
            id: "D1",
            donee: "LC1",
            value_at_donation: 2_000_000,
            date: "2020-05-01",
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

| Person | Category | Compulsory? |
|--------|----------|-------------|
| Pilar (LC1) | LEGITIMATE_CHILD | Yes |
| Ramon (LC2) | LEGITIMATE_CHILD | Yes |
| Sofia (IC1) | ILLEGITIMATE_CHILD | Yes (filiation proven by judgment) |
| Tina (S) | SURVIVING_SPOUSE | Yes |
| Friend G | VOLUNTARY | No |

### Step 2 — Build Lines

Counts: n = 2 legitimate child lines, m = 1 illegitimate child, spouse = yes.

### Step 3 — Succession Type & Scenario

- Will exists → TESTATE
- Descendants + IC + spouse → **Scenario T5b** (n = 2, m = 1)

### Step 4 — Compute Estate Base (Art. 908, Collation)

- Net estate at death: ₱18,000,000
- Collatable donations: ₱2,000,000 (donation D1 to LC1, valued at donation time per Art. 1071)
- **Estate base** (E_adj) = ₱18,000,000 + ₱2,000,000 = ₱20,000,000

### Step 5 — Compute Legitimes on Collated Estate

**Scenario T5b with n=2, m=1:**

Per the legitime table:
- Children's collective legitime = E_adj × ½ = ₱10,000,000
- Per legitimate child = ₱10,000,000 / 2 = ₱5,000,000
- Per illegitimate child (uncapped) = ½ × ₱5,000,000 = ₱2,500,000

**Free Portion computation:**
- FP_gross = E_adj × ½ = ₱10,000,000

**Spouse's legitime** (Art. 892 ¶2, from FP):
- Spouse = one legitimate child's share = E_adj / (2n) = ₱20,000,000 / 4 = ₱5,000,000
- But wait: with n=2, spouse = 1/(2×2) = ¼ of E_adj = ₱5,000,000

**Art. 895 ¶3 cap rule — spouse satisfied FIRST from FP:**
- FP_gross = ₱10,000,000
- After spouse: FP_remaining = ₱10,000,000 − ₱5,000,000 = ₱5,000,000
- IC uncapped total = 1 × ₱2,500,000 = ₱2,500,000
- Cap check: ₱2,500,000 ≤ ₱5,000,000 → **NOT capped** (m=1 ≤ 2(n-1) = 2)
- FP_disposable = ₱5,000,000 − ₱2,500,000 = ₱2,500,000

**Summary of legitimes (on collated estate E_adj = ₱20,000,000):**

| Heir | Legitime Fraction | Legitime Amount | Source |
|------|------------------|----------------|--------|
| LC1 (Pilar) | ¼ (0.25) | ₱5,000,000 | Art. 888 (from estate) |
| LC2 (Ramon) | ¼ (0.25) | ₱5,000,000 | Art. 888 (from estate) |
| IC1 (Sofia) | ⅛ (0.125) | ₱2,500,000 | Art. 895 (from FP) |
| S (Tina) | ¼ (0.25) | ₱5,000,000 | Art. 892 (from FP) |
| **Total Legitime** | | **₱17,500,000** | |
| **FP_disposable** | | **₱2,500,000** | |

### Step 6 — Testate Validation

- No preterition (all compulsory heirs mentioned) ✓
- No disinheritance ✓
- Will gives Friend G ₱3,000,000 but FP_disposable = ₱2,500,000
  - **INOFFICIOUS by ₱500,000** (Art. 911)
  - Reduce Friend G's disposition to ₱2,500,000

### Step 7 — Distribution (on actual estate ₱18,000,000)

**Collation imputation (Art. 1073):**
- LC1 already received ₱2,000,000 as donation
- LC1's share from actual estate: LC1's total entitlement − donation = ₱5,000,000 − ₱2,000,000 = ₱3,000,000

| Heir | Total Entitlement | Already Received | From Estate | Legal Basis |
|------|------------------|-----------------|-------------|-------------|
| LC1 (Pilar) | ₱5,000,000 | ₱2,000,000 (donation) | ₱3,000,000 | Arts. 888, 1061 |
| LC2 (Ramon) | ₱5,000,000 | — | ₱5,000,000 | Art. 888 |
| IC1 (Sofia) | ₱2,500,000 | — | ₱2,500,000 | Art. 895 |
| S (Tina) | ₱5,000,000 | — | ₱5,000,000 | Art. 892 |
| Friend G | ₱2,500,000 | — | ₱2,500,000 | Will (reduced per Art. 911) |
| **Total** | **₱20,000,000** | **₱2,000,000** | **₱18,000,000** | |

### Verification

- From-estate sum: ₱3M + ₱5M + ₱2.5M + ₱5M + ₱2.5M = ₱18M = net estate ✓
- Total entitlement sum: ₱20M = E_adj (collated estate) ✓
- Each compulsory heir ≥ legitime ✓
- IC share (₱2,500,000) = ½ × LC share (₱5,000,000) ✓
- Cap NOT triggered (m=1 ≤ 2(n-1)=2) ✓
- Friend G reduced from ₱3M to ₱2.5M (inofficious reduction) ✓
- Donation correctly imputed against LC1's share ✓

### Expected Narrative (IC1)

> **Sofia Navarro (illegitimate child)** receives **₱2,500,000**.
> As an illegitimate child whose filiation is proven by court judgment (Art. 172, Family Code), Sofia is a compulsory heir entitled to a legitime. Under Art. 895 of the Civil Code, an illegitimate child's legitime is one-half (½) that of a legitimate child. Each legitimate child's legitime is ₱5,000,000 (computed on the collation-adjusted estate of ₱20,000,000 per Art. 908), so Sofia's legitime is ₱2,500,000. This amount comes from the free portion (Art. 895 ¶3), after satisfying the surviving spouse's share of ₱5,000,000. The Art. 895 ¶3 cap does not apply here because the total illegitimate children's claim (₱2,500,000) does not exceed the remaining free portion (₱5,000,000).

### Expected Narrative (LC1 — collation)

> **Pilar Navarro (legitimate child)** receives **₱3,000,000 from the estate** (plus ₱2,000,000 previously received as a donation, for a total of ₱5,000,000).
> Under Art. 1061 of the Civil Code, the ₱2,000,000 donation to Pilar must be collated (fictitiously added back) to the estate for computing legitime. The collation-adjusted estate is ₱20,000,000 (Art. 908). Pilar's legitime is ₱5,000,000 (¼ of the adjusted estate per Art. 888). Since Pilar already received ₱2,000,000 as an advance, her share from the actual estate is reduced to ₱3,000,000 (Art. 1073).

---

## TV-12: Inofficious Will — Legacy Exceeds Free Portion (Art. 911 Reduction)

**Category**: Testate, inofficiousness with 1 child + spouse
**Scenario**: T2
**Exercises**: Art. 911 reduction algorithm, spouse not preterited (Art. 855), FP computation

### Inputs

```
EngineInput {
    net_distributable_estate: ₱10,000,000,
    decedent: {
        name: "Vivian Aquino",
        date_of_death: "2026-11-01",
        is_married: true,
        is_illegitimate: false,
    },
    family_tree: [
        { id: "LC1", name: "Wes Aquino", relationship: LEGITIMATE_CHILD, is_alive: true },
        { id: "S", name: "Xena Aquino", relationship: SURVIVING_SPOUSE, is_alive: true },
    ],
    will: {
        institutions: [
            { heir_ref: "LC1", share: LEGITIME_ONLY },
        ],
        legacies: [
            { id: "LEG1", beneficiary: "FRIEND_H", amount: 6_000_000 },
        ],
        devises: [],
        disinheritances: [],
        substitutions: [],
    },
    donations: [],
    config: { retroactive_ra_11642: false },
}
```

Note: Spouse (Xena) is NOT mentioned in the will at all.

### Step 1 — Classify Heirs

| Person | Category | Compulsory? |
|--------|----------|-------------|
| Wes (LC1) | LEGITIMATE_CHILD | Yes (Art. 887(1)) |
| Xena (S) | SURVIVING_SPOUSE | Yes (Art. 887(3)) |
| Friend H | VOLUNTARY (legatee) | No |

### Step 3 — Succession Type & Scenario

- Will exists → TESTATE
- 1 legitimate child + spouse → **Scenario T2**

### Step 5 — Compute Legitimes (Arts. 888, 892)

- LC1's legitime = E × ½ = ₱5,000,000 (Art. 888, 1 child)
- Spouse's legitime = E × ¼ = ₱2,500,000 (Art. 892 ¶1, from FP)
- Total legitime = ₱7,500,000
- Free portion = ₱10,000,000 − ₱7,500,000 = ₱2,500,000

### Step 6 — Testate Validation

**Preterition check:**
- Spouse omitted? Yes, but spouse is NOT in the direct line → **NOT preterition** (Art. 854 limited to direct line)
- Spouse remedy: Art. 855 underprovision recovery

**Inofficiousness check:**
- Will gives Friend H ₱6,000,000 as legacy
- Free portion = ₱2,500,000
- **Legacy INOFFICIOUS by ₱3,500,000** (Art. 911)
- Reduce legacy to ₱2,500,000

**Underprovision check:**
- Spouse is not mentioned → receives ₱0 from will
- Spouse's legitime = ₱2,500,000
- Underprovision = ₱2,500,000
- Art. 855 waterfall:
  1. Undisposed estate: will disposes only of LC1's legitime + Friend H's legacy → remainder exists
  2. Spouse recovers her legitime from this remainder

### Step 7 — Distribution

After reducing Friend H's legacy to ₱2,500,000 (the FP):

| Heir | Legitime | Free Portion | Total | Legal Basis |
|------|----------|-------------|-------|-------------|
| LC1 (Wes) | ₱5,000,000 | — | ₱5,000,000 | Art. 888 |
| S (Xena) | ₱2,500,000 | — | ₱2,500,000 | Art. 892 (recovered via Art. 855) |
| Friend H | — | ₱2,500,000 | ₱2,500,000 | Will legacy (reduced per Art. 911) |
| **Total** | **₱7,500,000** | **₱2,500,000** | **₱10,000,000** | |

### Verification

- Sum: ₱5M + ₱2.5M + ₱2.5M = ₱10M = E ✓
- LC1 ≥ legitime (₱5M ≥ ₱5M) ✓
- Spouse ≥ legitime (₱2.5M ≥ ₱2.5M) ✓
- Spouse omission ≠ preterition (correctly treated as Art. 855 underprovision) ✓
- Friend H reduced from ₱6M to ₱2.5M ✓

### Expected Narrative (Friend H)

> **Friend H (legatee, voluntary heir)** receives **₱2,500,000**.
> The testator's will provided a legacy of ₱6,000,000 to Friend H. However, under Art. 911 of the Civil Code, testamentary dispositions that impair the legitime of compulsory heirs must be reduced. The total legitime of the compulsory heirs (Wes at ₱5,000,000 + Xena at ₱2,500,000 = ₱7,500,000) leaves a free portion of only ₱2,500,000. Friend H's legacy is therefore reduced from ₱6,000,000 to ₱2,500,000 to respect the compulsory heirs' legitimes. Note: Xena (surviving spouse) was omitted from the will but this is not preterition under Art. 854, as the spouse is not in the direct line. Xena recovers her legitime under Art. 855.

---

## TV-13: Cap Rule Triggered — Many Illegitimate Children with Spouse

**Category**: Testate, Art. 895 ¶3 cap rule in action
**Scenario**: T5a (n = 1, m = 3, spouse)
**Exercises**: Cap rule computation, spouse priority in FP, IC share reduction

### Inputs

```
EngineInput {
    net_distributable_estate: ₱20,000,000,
    decedent: {
        name: "Alma Bautista",
        date_of_death: "2026-12-01",
        is_married: true,
        is_illegitimate: false,
    },
    family_tree: [
        { id: "LC1", name: "Bianca Bautista", relationship: LEGITIMATE_CHILD, is_alive: true },
        { id: "IC1", name: "Carlo Bautista", relationship: ILLEGITIMATE_CHILD, is_alive: true,
          filiation_proof: OPEN_POSSESSION },
        { id: "IC2", name: "Dante Bautista", relationship: ILLEGITIMATE_CHILD, is_alive: true,
          filiation_proof: BIRTH_CERTIFICATE },
        { id: "IC3", name: "Elisa Bautista", relationship: ILLEGITIMATE_CHILD, is_alive: true,
          filiation_proof: PRIVATE_DOCUMENT },
        { id: "S", name: "Fiona Bautista", relationship: SURVIVING_SPOUSE, is_alive: true },
    ],
    will: {
        institutions: [
            { heir_ref: "LC1", share: LEGITIME_ONLY },
            { heir_ref: "IC1", share: LEGITIME_ONLY },
            { heir_ref: "IC2", share: LEGITIME_ONLY },
            { heir_ref: "IC3", share: LEGITIME_ONLY },
            { heir_ref: "S", share: LEGITIME_ONLY },
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

### Step 3 — Succession Type & Scenario

- Will exists → TESTATE
- 1 legitimate child + 3 illegitimate children + spouse → **Scenario T5a** (n=1, m=3)

### Step 5 — Compute Legitimes (Art. 895 ¶3 Cap Rule)

**Scenario T5a (n = 1):**

- LC1's legitime = E × ½ = ₱10,000,000 (Art. 888)
- FP_gross = E × ½ = ₱10,000,000
- Spouse's legitime = E × ¼ = ₱5,000,000 (Art. 892 ¶1, from FP)

**FP after spouse:**
- FP_remaining = ₱10,000,000 − ₱5,000,000 = ₱5,000,000

**Uncapped IC share:**
- Each IC uncapped = ½ × LC1's per-child share = ½ × ₱10,000,000 = ₱5,000,000
- Total uncapped = 3 × ₱5,000,000 = ₱15,000,000

**Cap check (Art. 895 ¶3):**
- ₱15,000,000 > ₱5,000,000 (FP_remaining) → **CAP TRIGGERED** (m = 3 > 1)
- Each IC (capped) = ₱5,000,000 / 3 = ₱1,666,666.67
- FP_disposable = ₱0 (entire FP consumed by spouse + capped IC)

**Comparison — uncapped vs capped:**

| IC | Uncapped Legitime | Capped Legitime | Reduction |
|----|------------------|----------------|-----------|
| IC1 | ₱5,000,000 | ₱1,666,666.67 | −66.7% |
| IC2 | ₱5,000,000 | ₱1,666,666.67 | −66.7% |
| IC3 | ₱5,000,000 | ₱1,666,666.67 | −66.7% |

### Step 7 — Distribution

| Heir | Legitime | Free Portion | Total | Legal Basis |
|------|----------|-------------|-------|-------------|
| LC1 (Bianca) | ₱10,000,000 | — | ₱10,000,000 | Art. 888 |
| IC1 (Carlo) | ₱1,666,666.67 | — | ₱1,666,666.67 | Art. 895 (capped) |
| IC2 (Dante) | ₱1,666,666.67 | — | ₱1,666,666.67 | Art. 895 (capped) |
| IC3 (Elisa) | ₱1,666,666.67 | — | ₱1,666,666.67 | Art. 895 (capped) |
| S (Fiona) | ₱5,000,000 | — | ₱5,000,000 | Art. 892 |
| **Total** | **₱20,000,000** | **₱0** | **₱20,000,000** | |

### Verification

- Sum: ₱10M + ₱1,666,666.67×3 + ₱5M = ₱10M + ₱5M + ₱5M = ₱20M ✓
- Cap correctly triggered (m=3 > 1) ✓
- Spouse satisfied FIRST from FP (Art. 895 ¶3 priority) ✓
- FP_disposable = ₱0 (all consumed) ✓
- IC share (₱1,666,666.67) ≠ ½ × LC share (₱5,000,000) due to cap — this is correct ✓

### Intestate comparison (I4, same family):

Under intestate, no cap applies:
- Units: LC1 = 2, IC1 = IC2 = IC3 = 1 each, S = 2 → total = 7
- Per unit = ₱20M / 7 = ₱2,857,142.86
- Each IC intestate = ₱2,857,142.86 vs testate ₱1,666,666.67 → **ICs get 71% more intestate**

### Expected Narrative (IC1)

> **Carlo Bautista (illegitimate child)** receives **₱1,666,666.67**.
> As an illegitimate child whose filiation is proven by open and continuous possession of the status of an illegitimate child (Art. 172, Family Code), Carlo is a compulsory heir. Under Art. 895, an illegitimate child's legitime is one-half (½) of a legitimate child's share. The sole legitimate child's share is ₱10,000,000, making the uncapped illegitimate share ₱5,000,000 each. However, Art. 895 ¶3 provides that the total legitime of illegitimate children cannot exceed the free portion. The free portion (₱10,000,000) is first applied to the surviving spouse's share of ₱5,000,000 (per Art. 892), leaving only ₱5,000,000 for all 3 illegitimate children. Carlo's capped share is therefore ₱5,000,000 ÷ 3 = ₱1,666,666.67.

---

## Summary Matrix

| # | Name | Scenario | Key Features Tested |
|---|------|----------|-------------------|
| TV-01 | Simple intestate | I1 | Single heir, entire estate |
| TV-02 | Standard intestate | I2 | Art. 996 spouse-equal-to-child |
| TV-03 | Illegitimate mix | I3 | 2:1 unit ratio, no cap in intestate |
| TV-04 | Spouse only | I11 | Art. 995 sole surviving spouse |
| TV-05 | Ascendant + spouse | I6 | Art. 997 ½/½ split, Art. 986 parent division |
| TV-06 | Testate simple | T1 | Art. 888 legitime, FP to charity |
| TV-07 | Preterition | T3→I2 | Art. 854 total annulment, intestate fallback |
| TV-08 | Disinheritance | T3 | Arts. 919/923, representation, per stirpes |
| TV-09 | Adopted child | T3 | RA 8552 Sec. 17, equal treatment |
| TV-10 | Representation | I2 | Arts. 970-974, per stirpes, line counting |
| TV-11 | Complex testate | T5b | Cap rule, collation, inofficiousness, Art. 911 |
| TV-12 | Inofficious will | T2 | Art. 911 reduction, Art. 855 spouse underprovision |
| TV-13 | Cap rule | T5a | Art. 895 ¶3, spouse FP priority, IC reduction |

### Scenario Coverage

| Scenario | Test Vector(s) | Testate? | Intestate? |
|----------|---------------|----------|------------|
| I1 | TV-01 | | ✓ |
| I2 | TV-02, TV-07 (post-preterition), TV-10 | | ✓ |
| I3 | TV-03 | | ✓ |
| I6 | TV-05 | | ✓ |
| I11 | TV-04 | | ✓ |
| T1 | TV-06 | ✓ | |
| T2 | TV-12 | ✓ | |
| T3 | TV-08, TV-09 | ✓ | |
| T5a | TV-13 | ✓ | |
| T5b | TV-11 | ✓ | |

### Feature Coverage

| Feature | Test Vector(s) |
|---------|---------------|
| Intestate distribution | TV-01, TV-02, TV-03, TV-04, TV-05, TV-10 |
| Testate legitime | TV-06, TV-08, TV-09, TV-11, TV-12, TV-13 |
| Free portion allocation | TV-06, TV-08, TV-09, TV-11, TV-12, TV-13 |
| Art. 895 ¶3 cap rule | TV-13 (triggered), TV-11 (not triggered) |
| Collation (Art. 1061) | TV-11 |
| Inofficiousness (Art. 911) | TV-11, TV-12 |
| Preterition (Art. 854) | TV-07 |
| Disinheritance (Arts. 915-923) | TV-08 |
| Representation (Arts. 970-974) | TV-08, TV-10 |
| Adopted child (RA 8552) | TV-09 |
| Spouse equal-share intestate | TV-02, TV-05, TV-10 |
| Spouse underprovision (Art. 855) | TV-12 |
| Spouse FP priority | TV-13 |
| 2:1 unit ratio (intestate) | TV-03 |
| Ascendant division (Art. 986) | TV-05 |
| Rounding (rational → centavos) | TV-08, TV-10, TV-13 |

---

## Test Invariants

Every test vector must satisfy these invariants (from data-model validation rules):

1. **Sum invariant**: Σ(per_heir_amounts) = net_distributable_estate (for amounts from estate only; total entitlements = collated estate)
2. **Legitime floor**: For every compulsory heir h, h.total ≥ h.legitime (in testate)
3. **Art. 895 ratio**: If legitimate and illegitimate children concur, IC_share ≤ ½ × LC_share (testate only; intestate uses exact ½)
4. **Cap invariant**: Σ(IC_legitimes) ≤ FP_remaining_after_spouse (testate only)
5. **Representation invariant**: Σ(representatives_in_line) = line_ancestor_share (per stirpes)
6. **Adoption invariant**: adopted_child.share == legitimate_child.share (always)
7. **Preterition invariant**: If preterition detected, ALL institutions annulled → entire estate intestate
8. **Disinheritance invariant**: If valid, disinherited heir gets ₱0 but descendants may represent
9. **Collation invariant**: estate_base = net_estate + Σ(collatable_donations); from_estate_sum = net_estate
10. **Scenario consistency**: The scenario code matches the surviving heir combination

---

*13 test vectors covering 10 scenarios, 16 features, and 10 invariants. Each vector is fully deterministic and independently verifiable.*
