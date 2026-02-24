# Inheritance Engine — Test Results

20 test cases run through the Philippine Inheritance Distribution Engine.
All amounts in Philippine Pesos (₱). Engine uses exact rational arithmetic internally.

---

## Case 1: Single legitimate child (entire estate)

| Field | Value |
|-------|-------|
| **Estate** | ₱1,000,000.00 |
| **Scenario** | I1 |
| **Succession Type** | Intestate |

### Distribution

| Heir | Category | Total | From Legitime | From FP | From Intestate | Donations Imputed |
|------|----------|-------|---------------|---------|----------------|-------------------|
| Maria | LegitimateChild | ₱1,000,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |

### Narratives

> **Maria (legitimate child)** receives **₱1,000,000**. The decedent died intestate (without a valid will). As a legitimate child (Art. 887 of the Civil Code), Maria is a compulsory heir.

---

## Case 2: Married with 3 legitimate children + spouse

| Field | Value |
|-------|-------|
| **Estate** | ₱6,000,000.00 |
| **Scenario** | I2 |
| **Succession Type** | Intestate |

### Distribution

| Heir | Category | Total | From Legitime | From FP | From Intestate | Donations Imputed |
|------|----------|-------|---------------|---------|----------------|-------------------|
| Ana | LegitimateChild | ₱1,500,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |
| Ben | LegitimateChild | ₱1,500,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |
| Carlos | LegitimateChild | ₱1,500,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |
| Rosa | SurvivingSpouse | ₱1,500,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |

### Narratives

> **Ana (legitimate child)** receives **₱1,500,000**. The decedent died intestate (without a valid will). As a legitimate child (Art. 887 of the Civil Code), Ana is a compulsory heir.

> **Ben (legitimate child)** receives **₱1,500,000**. The decedent died intestate (without a valid will). As a legitimate child (Art. 887 of the Civil Code), Ben is a compulsory heir.

> **Carlos (legitimate child)** receives **₱1,500,000**. The decedent died intestate (without a valid will). As a legitimate child (Art. 887 of the Civil Code), Carlos is a compulsory heir.

> **Rosa (surviving spouse)** receives **₱1,500,000**. The decedent died intestate (without a valid will). As a surviving spouse (Art. 887 of the Civil Code), Rosa is a compulsory heir.

---

## Case 3: 2 legitimate children + 1 illegitimate child

| Field | Value |
|-------|-------|
| **Estate** | ₱3,000,000.00 |
| **Scenario** | I3 |
| **Succession Type** | Intestate |

### Distribution

| Heir | Category | Total | From Legitime | From FP | From Intestate | Donations Imputed |
|------|----------|-------|---------------|---------|----------------|-------------------|
| Liza | LegitimateChild | ₱1,200,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |
| Marco | LegitimateChild | ₱1,200,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |
| Nora | IllegitimateChild | ₱600,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |

### Narratives

> **Liza (legitimate child)** receives **₱1,200,000**. The decedent died intestate (without a valid will). As a legitimate child (Art. 887 of the Civil Code), Liza is a compulsory heir.

> **Marco (legitimate child)** receives **₱1,200,000**. The decedent died intestate (without a valid will). As a legitimate child (Art. 887 of the Civil Code), Marco is a compulsory heir.

> **Nora (illegitimate child)** receives **₱600,000**. The decedent died intestate (without a valid will). As a illegitimate child (Art. 176, Family Code) (Art. 887 of the Civil Code), Nora is a compulsory heir.

---

## Case 4: Surviving spouse only

| Field | Value |
|-------|-------|
| **Estate** | ₱5,000,000.00 |
| **Scenario** | I11 |
| **Succession Type** | Intestate |

### Distribution

| Heir | Category | Total | From Legitime | From FP | From Intestate | Donations Imputed |
|------|----------|-------|---------------|---------|----------------|-------------------|
| Felipe | SurvivingSpouse | ₱5,000,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |

### Narratives

> **Felipe (surviving spouse)** receives **₱5,000,000**. The decedent died intestate (without a valid will). As a surviving spouse (Art. 887 of the Civil Code), Felipe is a compulsory heir.

---

## Case 5: Parents and surviving spouse

| Field | Value |
|-------|-------|
| **Estate** | ₱4,000,000.00 |
| **Scenario** | I6 |
| **Succession Type** | Intestate |

### Distribution

| Heir | Category | Total | From Legitime | From FP | From Intestate | Donations Imputed |
|------|----------|-------|---------------|---------|----------------|-------------------|
| Father | LegitimateAscendant | ₱1,000,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |
| Mother | LegitimateAscendant | ₱1,000,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |
| Hector | SurvivingSpouse | ₱2,000,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |

### Narratives

> **Father (legitimate parent)** receives **₱1,000,000**. The decedent died intestate (without a valid will). As a legitimate parent (Art. 887 of the Civil Code), Father is a compulsory heir.

> **Mother (legitimate parent)** receives **₱1,000,000**. The decedent died intestate (without a valid will). As a legitimate parent (Art. 887 of the Civil Code), Mother is a compulsory heir.

> **Hector (surviving spouse)** receives **₱2,000,000**. The decedent died intestate (without a valid will). As a surviving spouse (Art. 887 of the Civil Code), Hector is a compulsory heir.

---

## Case 6: Testate: free portion to charity

| Field | Value |
|-------|-------|
| **Estate** | ₱10,000,000.00 |
| **Scenario** | T1 |
| **Succession Type** | IntestateByPreterition |

### Distribution

| Heir | Category | Total | From Legitime | From FP | From Intestate | Donations Imputed |
|------|----------|-------|---------------|---------|----------------|-------------------|
| Jose | LegitimateChild | ₱10,000,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |

### Narratives

> **Jose (legitimate child)** receives **₱10,000,000**. The decedent died intestate (without a valid will). As a legitimate child (Art. 887 of the Civil Code), Jose is a compulsory heir.

---

## Case 7: 5 legitimate children, large estate (₱50M)

| Field | Value |
|-------|-------|
| **Estate** | ₱50,000,000.00 |
| **Scenario** | I1 |
| **Succession Type** | Intestate |

### Distribution

| Heir | Category | Total | From Legitime | From FP | From Intestate | Donations Imputed |
|------|----------|-------|---------------|---------|----------------|-------------------|
| Child 1 | LegitimateChild | ₱10,000,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |
| Child 2 | LegitimateChild | ₱10,000,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |
| Child 3 | LegitimateChild | ₱10,000,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |
| Child 4 | LegitimateChild | ₱10,000,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |
| Child 5 | LegitimateChild | ₱10,000,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |

### Narratives

> **Child 1 (legitimate child)** receives **₱10,000,000**. The decedent died intestate (without a valid will). As a legitimate child (Art. 887 of the Civil Code), Child 1 is a compulsory heir.

> **Child 2 (legitimate child)** receives **₱10,000,000**. The decedent died intestate (without a valid will). As a legitimate child (Art. 887 of the Civil Code), Child 2 is a compulsory heir.

> **Child 3 (legitimate child)** receives **₱10,000,000**. The decedent died intestate (without a valid will). As a legitimate child (Art. 887 of the Civil Code), Child 3 is a compulsory heir.

> **Child 4 (legitimate child)** receives **₱10,000,000**. The decedent died intestate (without a valid will). As a legitimate child (Art. 887 of the Civil Code), Child 4 is a compulsory heir.

> **Child 5 (legitimate child)** receives **₱10,000,000**. The decedent died intestate (without a valid will). As a legitimate child (Art. 887 of the Civil Code), Child 5 is a compulsory heir.

---

## Case 8: Parents only (no children, no spouse)

| Field | Value |
|-------|-------|
| **Estate** | ₱2,000,000.00 |
| **Scenario** | I5 |
| **Succession Type** | Intestate |

### Distribution

| Heir | Category | Total | From Legitime | From FP | From Intestate | Donations Imputed |
|------|----------|-------|---------------|---------|----------------|-------------------|
| Father | LegitimateAscendant | ₱1,000,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |
| Mother | LegitimateAscendant | ₱1,000,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |

### Narratives

> **Father (legitimate parent)** receives **₱1,000,000**. The decedent died intestate (without a valid will). As a legitimate parent (Art. 887 of the Civil Code), Father is a compulsory heir.

> **Mother (legitimate parent)** receives **₱1,000,000**. The decedent died intestate (without a valid will). As a legitimate parent (Art. 887 of the Civil Code), Mother is a compulsory heir.

---

## Case 9: 3 illegitimate children only

| Field | Value |
|-------|-------|
| **Estate** | ₱2,400,000.00 |
| **Scenario** | I7 |
| **Succession Type** | Intestate |

### Distribution

| Heir | Category | Total | From Legitime | From FP | From Intestate | Donations Imputed |
|------|----------|-------|---------------|---------|----------------|-------------------|
| Nina | IllegitimateChild | ₱800,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |
| Oscar | IllegitimateChild | ₱800,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |
| Paula | IllegitimateChild | ₱800,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |

### Narratives

> **Nina (illegitimate child)** receives **₱800,000**. The decedent died intestate (without a valid will). As a illegitimate child (Art. 176, Family Code) (Art. 887 of the Civil Code), Nina is a compulsory heir.

> **Oscar (illegitimate child)** receives **₱800,000**. The decedent died intestate (without a valid will). As a illegitimate child (Art. 176, Family Code) (Art. 887 of the Civil Code), Oscar is a compulsory heir.

> **Paula (illegitimate child)** receives **₱800,000**. The decedent died intestate (without a valid will). As a illegitimate child (Art. 176, Family Code) (Art. 887 of the Civil Code), Paula is a compulsory heir.

---

## Case 10: Married: 1 LC + 1 IC + spouse

| Field | Value |
|-------|-------|
| **Estate** | ₱12,000,000.00 |
| **Scenario** | I4 |
| **Succession Type** | Intestate |

### Distribution

| Heir | Category | Total | From Legitime | From FP | From Intestate | Donations Imputed |
|------|----------|-------|---------------|---------|----------------|-------------------|
| Tomas | LegitimateChild | ₱4,800,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |
| Ursela | IllegitimateChild | ₱2,400,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |
| Sandra | SurvivingSpouse | ₱4,800,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |

### Narratives

> **Tomas (legitimate child)** receives **₱4,800,000**. The decedent died intestate (without a valid will). As a legitimate child (Art. 887 of the Civil Code), Tomas is a compulsory heir.

> **Ursela (illegitimate child)** receives **₱2,400,000**. The decedent died intestate (without a valid will). As a illegitimate child (Art. 176, Family Code) (Art. 887 of the Civil Code), Ursela is a compulsory heir.

> **Sandra (surviving spouse)** receives **₱4,800,000**. The decedent died intestate (without a valid will). As a surviving spouse (Art. 887 of the Civil Code), Sandra is a compulsory heir.

---

## Case 11: Collateral siblings (full + half blood)

| Field | Value |
|-------|-------|
| **Estate** | ₱3,600,000.00 |
| **Scenario** | I13 |
| **Succession Type** | Intestate |

### Distribution

| Heir | Category | Total | From Legitime | From FP | From Intestate | Donations Imputed |
|------|----------|-------|---------------|---------|----------------|-------------------|
| Full Brother | Collateral | ₱2,400,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |
| Half Sister | Collateral | ₱1,200,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |

### Narratives

> **Full Brother (sibling)** receives **₱2,400,000**. The decedent died intestate (without a valid will). Full Brother is classified as a sibling (Arts. 1003-1008).

> **Half Sister (sibling)** receives **₱1,200,000**. The decedent died intestate (without a valid will). Half Sister is classified as a sibling (Arts. 1003-1008).

---

## Case 12: Escheat to state (no heirs)

| Field | Value |
|-------|-------|
| **Estate** | ₱1,000,000.00 |
| **Scenario** | I15 |
| **Succession Type** | Intestate |

### Distribution

| Heir | Category | Total | From Legitime | From FP | From Intestate | Donations Imputed |
|------|----------|-------|---------------|---------|----------------|-------------------|
| STATE | LegitimateChild | ₱1,000,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |

### Narratives

> **STATE (beneficiary)** receives **₱1,000,000**.

---

## Case 13: Small estate (₱10,000) — married with 1 child

| Field | Value |
|-------|-------|
| **Estate** | ₱10,000.00 |
| **Scenario** | I2 |
| **Succession Type** | Intestate |

### Distribution

| Heir | Category | Total | From Legitime | From FP | From Intestate | Donations Imputed |
|------|----------|-------|---------------|---------|----------------|-------------------|
| Zara | LegitimateChild | ₱5,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |
| Yolanda | SurvivingSpouse | ₱5,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |

### Narratives

> **Zara (legitimate child)** receives **₱5,000**. The decedent died intestate (without a valid will). As a legitimate child (Art. 887 of the Civil Code), Zara is a compulsory heir.

> **Yolanda (surviving spouse)** receives **₱5,000**. The decedent died intestate (without a valid will). As a surviving spouse (Art. 887 of the Civil Code), Yolanda is a compulsory heir.

---

## Case 14: Testate with legacy to Church

| Field | Value |
|-------|-------|
| **Estate** | ₱20,000,000.00 |
| **Scenario** | T3 |
| **Succession Type** | Mixed |

### Distribution

| Heir | Category | Total | From Legitime | From FP | From Intestate | Donations Imputed |
|------|----------|-------|---------------|---------|----------------|-------------------|
| Cesar | LegitimateChild | ₱6,000,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |
| Dolores | LegitimateChild | ₱6,000,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |
| Beatriz | SurvivingSpouse | ₱6,000,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |
| Church of Manila | LegitimateChild | ₱2,000,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |

### Narratives

> **Cesar (legitimate child)** receives **₱6,000,000**. The decedent left a will that does not dispose of the entire estate. As a legitimate child (Art. 887 of the Civil Code), Cesar is a compulsory heir.

> **Dolores (legitimate child)** receives **₱6,000,000**. The decedent left a will that does not dispose of the entire estate. As a legitimate child (Art. 887 of the Civil Code), Dolores is a compulsory heir.

> **Beatriz (surviving spouse)** receives **₱6,000,000**. The decedent left a will that does not dispose of the entire estate. As a surviving spouse (Art. 887 of the Civil Code), Beatriz is a compulsory heir.

> **Church of Manila (beneficiary)** receives **₱2,000,000**.

---

## Case 15: Representation: grandchildren via predeceased child

| Field | Value |
|-------|-------|
| **Estate** | ₱9,000,000.00 |
| **Scenario** | I1 |
| **Succession Type** | Intestate |

### Distribution

| Heir | Category | Total | From Legitime | From FP | From Intestate | Donations Imputed |
|------|----------|-------|---------------|---------|----------------|-------------------|
| Alive Child | LegitimateChild | ₱4,500,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |
| Dead Child | LegitimateChild | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |
| Grandchild 1 (repr) | LegitimateChild | ₱2,250,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |
| Grandchild 2 (repr) | LegitimateChild | ₱2,250,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |

### Narratives

> **Alive Child (legitimate child)** receives **₱4,500,000**. The decedent died intestate (without a valid will). As a legitimate child (Art. 887 of the Civil Code), Alive Child is a compulsory heir.

> **Dead Child (legitimate child)** receives **₱0**. The decedent died intestate (without a valid will). As a legitimate child (Art. 887 of the Civil Code), Dead Child is a compulsory heir.

> **Grandchild 1 (grandchild, by representation)** receives **₱2,250,000**. The decedent died intestate (without a valid will). As a legitimate child (Art. 887 of the Civil Code), Grandchild 1 is a compulsory heir. Grandchild 1 inherits by right of representation (Art. 970 of the Civil Code) in place of c2.

> **Grandchild 2 (grandchild, by representation)** receives **₱2,250,000**. The decedent died intestate (without a valid will). As a legitimate child (Art. 887 of the Civil Code), Grandchild 2 is a compulsory heir. Grandchild 2 inherits by right of representation (Art. 970 of the Civil Code) in place of c2.

---

## Case 16: One parent + surviving spouse

| Field | Value |
|-------|-------|
| **Estate** | ₱8,000,000.00 |
| **Scenario** | I6 |
| **Succession Type** | Intestate |

### Distribution

| Heir | Category | Total | From Legitime | From FP | From Intestate | Donations Imputed |
|------|----------|-------|---------------|---------|----------------|-------------------|
| Mother | LegitimateAscendant | ₱4,000,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |
| Hugo | SurvivingSpouse | ₱4,000,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |

### Narratives

> **Mother (legitimate parent)** receives **₱4,000,000**. The decedent died intestate (without a valid will). As a legitimate parent (Art. 887 of the Civil Code), Mother is a compulsory heir.

> **Hugo (surviving spouse)** receives **₱4,000,000**. The decedent died intestate (without a valid will). As a surviving spouse (Art. 887 of the Civil Code), Hugo is a compulsory heir.

---

## Case 17: Adopted child (RA 8552) + biological child

| Field | Value |
|-------|-------|
| **Estate** | ₱6,000,000.00 |
| **Scenario** | I1 |
| **Succession Type** | Intestate |

### Distribution

| Heir | Category | Total | From Legitime | From FP | From Intestate | Donations Imputed |
|------|----------|-------|---------------|---------|----------------|-------------------|
| Bio Child | LegitimateChild | ₱3,000,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |
| Adopted Child | LegitimateChild | ₱3,000,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |

### Narratives

> **Bio Child (legitimate child)** receives **₱3,000,000**. The decedent died intestate (without a valid will). As a legitimate child (Art. 887 of the Civil Code), Bio Child is a compulsory heir.

> **Adopted Child (adopted child)** receives **₱3,000,000**. The decedent died intestate (without a valid will). As a adopted child (RA 8552 Sec. 17: same rights as legitimate) (Art. 887 of the Civil Code), Adopted Child is a compulsory heir.

---

## Case 18: Illegitimate child + surviving spouse

| Field | Value |
|-------|-------|
| **Estate** | ₱4,000,000.00 |
| **Scenario** | I8 |
| **Succession Type** | Intestate |

### Distribution

| Heir | Category | Total | From Legitime | From FP | From Intestate | Donations Imputed |
|------|----------|-------|---------------|---------|----------------|-------------------|
| Karen | SurvivingSpouse | ₱2,000,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |
| Luis | IllegitimateChild | ₱2,000,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |

### Narratives

> **Karen (surviving spouse)** receives **₱2,000,000**. The decedent died intestate (without a valid will). As a surviving spouse (Art. 887 of the Civil Code), Karen is a compulsory heir.

> **Luis (illegitimate child)** receives **₱2,000,000**. The decedent died intestate (without a valid will). As a illegitimate child (Art. 176, Family Code) (Art. 887 of the Civil Code), Luis is a compulsory heir.

---

## Case 19: Large family: 2LC + 2IC + spouse

| Field | Value |
|-------|-------|
| **Estate** | ₱30,000,000.00 |
| **Scenario** | I4 |
| **Succession Type** | Intestate |

### Distribution

| Heir | Category | Total | From Legitime | From FP | From Intestate | Donations Imputed |
|------|----------|-------|---------------|---------|----------------|-------------------|
| Olivia | LegitimateChild | ₱7,500,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |
| Pablo | LegitimateChild | ₱7,500,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |
| Quennie | IllegitimateChild | ₱3,750,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |
| Ramon | IllegitimateChild | ₱3,750,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |
| Natalia | SurvivingSpouse | ₱7,500,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |

### Narratives

> **Olivia (legitimate child)** receives **₱7,500,000**. The decedent died intestate (without a valid will). As a legitimate child (Art. 887 of the Civil Code), Olivia is a compulsory heir.

> **Pablo (legitimate child)** receives **₱7,500,000**. The decedent died intestate (without a valid will). As a legitimate child (Art. 887 of the Civil Code), Pablo is a compulsory heir.

> **Quennie (illegitimate child)** receives **₱3,750,000**. The decedent died intestate (without a valid will). As a illegitimate child (Art. 176, Family Code) (Art. 887 of the Civil Code), Quennie is a compulsory heir.

> **Ramon (illegitimate child)** receives **₱3,750,000**. The decedent died intestate (without a valid will). As a illegitimate child (Art. 176, Family Code) (Art. 887 of the Civil Code), Ramon is a compulsory heir.

> **Natalia (surviving spouse)** receives **₱7,500,000**. The decedent died intestate (without a valid will). As a surviving spouse (Art. 887 of the Civil Code), Natalia is a compulsory heir.

---

## Case 20: Donation collation: advance on inheritance

| Field | Value |
|-------|-------|
| **Estate** | ₱8,000,000.00 |
| **Scenario** | I1 |
| **Succession Type** | Intestate |

### Distribution

| Heir | Category | Total | From Legitime | From FP | From Intestate | Donations Imputed |
|------|----------|-------|---------------|---------|----------------|-------------------|
| Teresa | LegitimateChild | ₱5,000,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱2,000,000.00 |
| Ulises | LegitimateChild | ₱5,000,000.00 | ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 |

### Narratives

> **Teresa (legitimate child)** receives **₱3,000,000 from the estate** (plus ₱2,000,000 previously received as a donation, for a total of ₱5,000,000). The decedent died intestate (without a valid will). As a legitimate child (Art. 887 of the Civil Code), Teresa is a compulsory heir.

> **Ulises (legitimate child)** receives **₱5,000,000**. The decedent died intestate (without a valid will). As a legitimate child (Art. 887 of the Civil Code), Ulises is a compulsory heir.

---

