# Inheritance Engine — Testate Test Results

20 test cases with various will configurations run through the Philippine Inheritance Distribution Engine.
All amounts in Philippine Pesos. Engine uses exact rational arithmetic internally.

---
**Results: 20 passed, 0 failed out of 20 cases**


## Case 1: Will entire FP to charity (2 LC)

| Field | Value |
|-------|-------|
| **Estate** | P10,000,000.00 |
| **Scenario** | T1 |
| **Succession Type** | Testate |
| **Will** | 3 institution(s) |
| **Validation** | PASS |

### Last Will and Testament

```
LAST WILL AND TESTAMENT
OF CARMEN DELA CRUZ

I, CARMEN DELA CRUZ, of legal age, Filipino, single, and a resident of
Quezon City, Metro Manila, being of sound and disposing mind, do hereby
declare this to be my Last Will and Testament, revoking all prior wills
and codicils previously made by me.

ARTICLE I — INSTITUTION OF HEIRS

I hereby institute as my heirs, in equal shares, my beloved children:

    1. DANIEL DELA CRUZ
    2. EVA DELA CRUZ

ARTICLE II — DISPOSITION OF FREE PORTION

Whatever remains of my estate after satisfaction of the legitimes of
my compulsory heirs, constituting the free portion, I bequeath to the
PHILIPPINE RED CROSS, to be used for its humanitarian operations.

IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
June 2025, in the City of Quezon City, Philippines.

                                [Signed]
                                CARMEN DELA CRUZ
                                Testatrix
```

### Will Configuration (engine input)

**Institutions:**
- Daniel Dela Cruz (family): EqualWithOthers
- Eva Dela Cruz (family): EqualWithOthers
- Red Cross (stranger): Residuary (residuary)

### Distribution

| Heir | Category | Net From Estate | Donations | Total | Mode |
|------|----------|-----------------|-----------|-------|------|
| Daniel Dela Cruz | LegitimateChild | P2,500,000.00 | - | P2,500,000.00 | OwnRight |
| Eva Dela Cruz | LegitimateChild | P2,500,000.00 | - | P2,500,000.00 | OwnRight |
| Red Cross | LegitimateChild | P5,000,000.00 | - | P5,000,000.00 | OwnRight |

### Narratives

> **Daniel Dela Cruz (legitimate child)** receives **₱2,500,000**. The decedent left a valid will. As a legitimate child (Art. 887 of the Civil Code), Daniel Dela Cruz is a compulsory heir.

> **Eva Dela Cruz (legitimate child)** receives **₱2,500,000**. The decedent left a valid will. As a legitimate child (Art. 887 of the Civil Code), Eva Dela Cruz is a compulsory heir.

> **Red Cross (beneficiary)** receives **₱5,000,000**.

---

## Case 2: Fractional institutions (1/3 + 2/3 of FP)

| Field | Value |
|-------|-------|
| **Estate** | P12,000,000.00 |
| **Scenario** | T2 |
| **Succession Type** | IntestateByPreterition |
| **Will** | 2 institution(s) |
| **Validation** | PASS |

### Last Will and Testament

```
LAST WILL AND TESTAMENT
OF PEDRO REYES

I, PEDRO REYES, of legal age, Filipino, married to ROSA REYES, and
a resident of Makati City, Metro Manila, being of sound and disposing
mind, do hereby declare this to be my Last Will and Testament.

ARTICLE I — DISPOSITION OF FREE PORTION

Out of the disposable free portion of my estate, I direct as follows:

    1. One-third (1/3) thereof to FOUNDATION A, a duly registered
       non-profit organization, for its educational programs;

    2. Two-thirds (2/3) thereof to FOUNDATION B, a duly registered
       charitable institution, for its medical mission activities.

The legitimes of my compulsory heirs shall be respected in accordance
with law.

IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
June 2025, in Makati City, Philippines.

                                [Signed]
                                PEDRO REYES
                                Testator
```

### Will Configuration (engine input)

**Institutions:**
- Foundation A (stranger): 1/3
- Foundation B (stranger): 2/3

### Distribution

| Heir | Category | Net From Estate | Donations | Total | Mode |
|------|----------|-----------------|-----------|-------|------|
| Ana Reyes | LegitimateChild | P6,000,000.00 | - | P6,000,000.00 | OwnRight |
| Rosa Reyes | SurvivingSpouse | P6,000,000.00 | - | P6,000,000.00 | OwnRight |

### Narratives

> **Ana Reyes (legitimate child)** receives **₱6,000,000**. The decedent died intestate (without a valid will). As a legitimate child (Art. 887 of the Civil Code), Ana Reyes is a compulsory heir.

> **Rosa Reyes (surviving spouse)** receives **₱6,000,000**. The decedent died intestate (without a valid will). As a surviving spouse (Art. 887 of the Civil Code), Rosa Reyes is a compulsory heir.

---

## Case 3: Preterition: omit LC2 from will

| Field | Value |
|-------|-------|
| **Estate** | P8,000,000.00 |
| **Scenario** | T1 |
| **Succession Type** | IntestateByPreterition |
| **Will** | 1 institution(s) |
| **Validation** | PASS |

### Last Will and Testament

```
LAST WILL AND TESTAMENT
OF DIEGO SANTOS

I, DIEGO SANTOS, of legal age, Filipino, single, and a resident of
Cebu City, Cebu, being of sound and disposing mind, do hereby declare
this to be my Last Will and Testament.

ARTICLE I — INSTITUTION OF SOLE HEIR

I hereby institute as my sole and universal heir my daughter,
LIZA SANTOS, to receive the entirety of my estate, both real and
personal, wherever situated.

I make no other institution of heirs.

IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
June 2025, in Cebu City, Philippines.

                                [Signed]
                                DIEGO SANTOS
                                Testator

[NOTE: The testator's son MARCO SANTOS is not mentioned anywhere
 in this instrument.]
```

### Will Configuration (engine input)

**Institutions:**
- Liza Santos (family): EntireEstate

### Distribution

| Heir | Category | Net From Estate | Donations | Total | Mode |
|------|----------|-----------------|-----------|-------|------|
| Liza Santos | LegitimateChild | P4,000,000.00 | - | P4,000,000.00 | OwnRight |
| Marco Santos | LegitimateChild | P4,000,000.00 | - | P4,000,000.00 | OwnRight |

### Narratives

> **Liza Santos (legitimate child)** receives **₱4,000,000**. The decedent died intestate (without a valid will). As a legitimate child (Art. 887 of the Civil Code), Liza Santos is a compulsory heir.

> **Marco Santos (legitimate child)** receives **₱4,000,000**. The decedent died intestate (without a valid will). As a legitimate child (Art. 887 of the Civil Code), Marco Santos is a compulsory heir.

---

## Case 4: Disinheritance with grandchild representation

| Field | Value |
|-------|-------|
| **Estate** | P15,000,000.00 |
| **Scenario** | T3 |
| **Succession Type** | Testate |
| **Will** | 2 institution(s), 1 disinheritance(s) |
| **Validation** | PASS |

### Last Will and Testament

```
LAST WILL AND TESTAMENT
OF HECTOR VILLANUEVA

I, HECTOR VILLANUEVA, of legal age, Filipino, married to
NORA VILLANUEVA, and a resident of Davao City, being of sound
and disposing mind, do hereby declare this to be my Last Will
and Testament.

ARTICLE I — DISINHERITANCE

For just cause, I hereby DISINHERIT my daughter KAREN VILLANUEVA,
pursuant to Article 919(6) of the Civil Code, on the ground that
she has been guilty of maltreatment of the testator by word or
deed. Specifically, Karen has repeatedly subjected me to verbal
abuse and physical threats over the course of several years, as
can be attested to by members of our household.

ARTICLE II — INSTITUTION OF HEIRS

I hereby institute as my heir my daughter IRENE VILLANUEVA, to
receive her share in equal proportion with other instituted heirs.

ARTICLE III — RESIDUARY ESTATE

Whatever remains of the disposable portion of my estate, after
the foregoing dispositions, I bequeath to CHARITY B, INC.

IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
June 2025, in Davao City, Philippines.

                                [Signed]
                                HECTOR VILLANUEVA
                                Testator
```

### Will Configuration (engine input)

**Institutions:**
- Irene Villanueva (family): EqualWithOthers
- Charity B (stranger): Residuary (residuary)

**Disinheritances:**
- Karen Villanueva: ChildMaltreatment

### Distribution

| Heir | Category | Net From Estate | Donations | Total | Mode |
|------|----------|-----------------|-----------|-------|------|
| Irene Villanueva | LegitimateChild | P3,750,000.00 | - | P3,750,000.00 | OwnRight |
| Karen Villanueva | LegitimateChild | P0.00 | - | P0.00 | OwnRight |
| Luis Villanueva | LegitimateChild | P1,875,000.00 | - | P1,875,000.00 | Repr (lc2) |
| Marta Villanueva | LegitimateChild | P1,875,000.00 | - | P1,875,000.00 | Repr (lc2) |
| Nora Villanueva | SurvivingSpouse | P3,750,000.00 | - | P3,750,000.00 | OwnRight |
| Charity B | LegitimateChild | P3,750,000.00 | - | P3,750,000.00 | OwnRight |

### Narratives

> **Irene Villanueva (legitimate child)** receives **₱3,750,000**. The decedent left a valid will. As a legitimate child (Art. 887 of the Civil Code), Irene Villanueva is a compulsory heir.

> **Karen Villanueva (legitimate child)** receives **₱0**. The decedent left a valid will. As a legitimate child (Art. 887 of the Civil Code), Karen Villanueva is a compulsory heir.

> **Luis Villanueva (grandchild, by representation)** receives **₱1,875,000**. The decedent left a valid will. As a legitimate child (Art. 887 of the Civil Code), Luis Villanueva is a compulsory heir. Luis Villanueva inherits by right of representation (Art. 970 of the Civil Code) in place of lc2.

> **Marta Villanueva (grandchild, by representation)** receives **₱1,875,000**. The decedent left a valid will. As a legitimate child (Art. 887 of the Civil Code), Marta Villanueva is a compulsory heir. Marta Villanueva inherits by right of representation (Art. 970 of the Civil Code) in place of lc2.

> **Nora Villanueva (surviving spouse)** receives **₱3,750,000**. The decedent left a valid will. As a surviving spouse (Art. 887 of the Civil Code), Nora Villanueva is a compulsory heir.

> **Charity B (beneficiary)** receives **₱3,750,000**.

---

## Case 5: Legacy P1M to friend, 2 LC + spouse

| Field | Value |
|-------|-------|
| **Estate** | P20,000,000.00 |
| **Scenario** | T3 |
| **Succession Type** | Mixed |
| **Will** | 1 legacy/legacies |
| **Validation** | PASS |

### Last Will and Testament

```
LAST WILL AND TESTAMENT
OF ALBERTO MENDOZA

I, ALBERTO MENDOZA, of legal age, Filipino, married to
BEATRIZ MENDOZA, and a resident of Pasig City, Metro Manila,
being of sound and disposing mind, do hereby declare this to be
my Last Will and Testament.

ARTICLE I — LEGACY

I give and bequeath to my dear friend MIGUEL RAMOS, of legal
age, Filipino, and a resident of Mandaluyong City, the sum of
ONE MILLION PESOS (P1,000,000.00), in recognition of his
unwavering friendship and support throughout my life.

ARTICLE II — RESIDUARY ESTATE

All the rest, residue, and remainder of my estate, I leave to
be distributed among my compulsory heirs in accordance with law.

IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
June 2025, in Pasig City, Philippines.

                                [Signed]
                                ALBERTO MENDOZA
                                Testator
```

### Will Configuration (engine input)

**Legacies:**
- Friend Miguel: P1,000,000.00

### Distribution

| Heir | Category | Net From Estate | Donations | Total | Mode |
|------|----------|-----------------|-----------|-------|------|
| Cesar Mendoza | LegitimateChild | P6,333,333.34 | - | P6,333,333.34 | OwnRight |
| Dolores Mendoza | LegitimateChild | P6,333,333.33 | - | P6,333,333.33 | OwnRight |
| Beatriz Mendoza | SurvivingSpouse | P6,333,333.33 | - | P6,333,333.33 | OwnRight |
| Friend Miguel | LegitimateChild | P1,000,000.00 | - | P1,000,000.00 | OwnRight |

### Narratives

> **Cesar Mendoza (legitimate child)** receives **₱6,333,333.34**. The decedent left a will that does not dispose of the entire estate. As a legitimate child (Art. 887 of the Civil Code), Cesar Mendoza is a compulsory heir.

> **Dolores Mendoza (legitimate child)** receives **₱6,333,333.33**. The decedent left a will that does not dispose of the entire estate. As a legitimate child (Art. 887 of the Civil Code), Dolores Mendoza is a compulsory heir.

> **Beatriz Mendoza (surviving spouse)** receives **₱6,333,333.33**. The decedent left a will that does not dispose of the entire estate. As a surviving spouse (Art. 887 of the Civil Code), Beatriz Mendoza is a compulsory heir.

> **Friend Miguel (beneficiary)** receives **₱1,000,000**.

---

## Case 6: Inofficious legacy P8M on P10M estate (1 LC + spouse)

| Field | Value |
|-------|-------|
| **Estate** | P10,000,000.00 |
| **Scenario** | T2 |
| **Succession Type** | Testate |
| **Will** | 1 legacy/legacies |
| **Validation** | PASS |

### Last Will and Testament

```
LAST WILL AND TESTAMENT
OF VIVIAN AQUINO

I, VIVIAN AQUINO, of legal age, Filipino, married to XENA AQUINO,
and a resident of Manila, being of sound and disposing mind, do
hereby declare this to be my Last Will and Testament.

ARTICLE I — LEGACY TO EDUCATIONAL INSTITUTION

I give and bequeath to my beloved ALMA MATER, the University of
the Philippines, the sum of EIGHT MILLION PESOS (P8,000,000.00),
to be used as scholarship fund for deserving students from
low-income families.

ARTICLE II — RESIDUARY ESTATE

All the rest, residue, and remainder of my estate shall pass to
my compulsory heirs in accordance with law.

IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
June 2025, in Manila, Philippines.

                                [Signed]
                                VIVIAN AQUINO
                                Testator
```

### Will Configuration (engine input)

**Legacies:**
- Alma Mater: P8,000,000.00

### Distribution

| Heir | Category | Net From Estate | Donations | Total | Mode |
|------|----------|-----------------|-----------|-------|------|
| Wes Aquino | LegitimateChild | P5,000,000.00 | - | P5,000,000.00 | OwnRight |
| Xena Aquino | SurvivingSpouse | P2,500,000.00 | - | P2,500,000.00 | OwnRight |
| Alma Mater | LegitimateChild | P2,500,000.00 | - | P2,500,000.00 | OwnRight |

### Narratives

> **Wes Aquino (legitimate child)** receives **₱5,000,000**. The decedent left a valid will. As a legitimate child (Art. 887 of the Civil Code), Wes Aquino is a compulsory heir.

> **Xena Aquino (surviving spouse)** receives **₱2,500,000**. The decedent left a valid will. As a surviving spouse (Art. 887 of the Civil Code), Xena Aquino is a compulsory heir.

> **Alma Mater (beneficiary)** receives **₱2,500,000**.

---

## Case 7: Three legacies totaling P3M on P12M estate

| Field | Value |
|-------|-------|
| **Estate** | P12,000,000.00 |
| **Scenario** | T1 |
| **Succession Type** | Mixed |
| **Will** | 3 legacy/legacies |
| **Validation** | PASS |

### Last Will and Testament

```
LAST WILL AND TESTAMENT
OF SANTIAGO GARCIA

I, SANTIAGO GARCIA, of legal age, Filipino, single, and a
resident of Iloilo City, being of sound and disposing mind, do
hereby declare this to be my Last Will and Testament.

ARTICLE I — LEGACIES

I give and bequeath the following sums from the disposable free
portion of my estate:

    1. To the SAN AGUSTIN CHURCH OF ILOILO, the sum of
       ONE MILLION PESOS (P1,000,000.00), for the restoration
       of its historic facade;

    2. To the ILOILO CENTRAL SCHOOL, the sum of ONE MILLION
       PESOS (P1,000,000.00), for the construction of a new
       science laboratory;

    3. To the WESTERN VISAYAS MEDICAL CENTER, the sum of
       ONE MILLION PESOS (P1,000,000.00), for the purchase
       of diagnostic equipment.

ARTICLE II — RESIDUARY ESTATE

All the rest, residue, and remainder of my estate I leave to
my compulsory heirs in accordance with law.

IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
June 2025, in Iloilo City, Philippines.

                                [Signed]
                                SANTIAGO GARCIA
                                Testator
```

### Will Configuration (engine input)

**Legacies:**
- Church: P1,000,000.00
- School: P1,000,000.00
- Hospital: P1,000,000.00

### Distribution

| Heir | Category | Net From Estate | Donations | Total | Mode |
|------|----------|-----------------|-----------|-------|------|
| Teresa Garcia | LegitimateChild | P4,500,000.00 | - | P4,500,000.00 | OwnRight |
| Ulises Garcia | LegitimateChild | P4,500,000.00 | - | P4,500,000.00 | OwnRight |
| Church | LegitimateChild | P1,000,000.00 | - | P1,000,000.00 | OwnRight |
| School | LegitimateChild | P1,000,000.00 | - | P1,000,000.00 | OwnRight |
| Hospital | LegitimateChild | P1,000,000.00 | - | P1,000,000.00 | OwnRight |

### Narratives

> **Teresa Garcia (legitimate child)** receives **₱4,500,000**. The decedent left a will that does not dispose of the entire estate. As a legitimate child (Art. 887 of the Civil Code), Teresa Garcia is a compulsory heir.

> **Ulises Garcia (legitimate child)** receives **₱4,500,000**. The decedent left a will that does not dispose of the entire estate. As a legitimate child (Art. 887 of the Civil Code), Ulises Garcia is a compulsory heir.

> **Church (beneficiary)** receives **₱1,000,000**.

> **School (beneficiary)** receives **₱1,000,000**.

> **Hospital (beneficiary)** receives **₱1,000,000**.

---

## Case 8: Institution to charity + legacy to friend

| Field | Value |
|-------|-------|
| **Estate** | P16,000,000.00 |
| **Scenario** | T2 |
| **Succession Type** | IntestateByPreterition |
| **Will** | 1 institution(s), 1 legacy/legacies |
| **Validation** | PASS |

### Last Will and Testament

```
LAST WILL AND TESTAMENT
OF GLORIA LIM

I, GLORIA LIM, of legal age, Filipino, married to IRMA LIM,
and a resident of Taguig City, Metro Manila, being of sound
and disposing mind, do hereby declare this to be my Last Will
and Testament.

ARTICLE I — LEGACY

I give and bequeath to my lifelong friend and confidante,
referred to herein as OLD FRIEND, the sum of ONE MILLION PESOS
(P1,000,000.00), with my deepest gratitude for decades of
loyal friendship.

ARTICLE II — DISPOSITION OF RESIDUARY FREE PORTION

After satisfaction of the above legacy and the legitimes of my
compulsory heirs, I give, devise, and bequeath the entire
residue and remainder of the disposable free portion of my
estate to WWF PHILIPPINES, INC., to be used for the
conservation of Philippine marine biodiversity.

IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
June 2025, in Taguig City, Philippines.

                                [Signed]
                                GLORIA LIM
                                Testatrix
```

### Will Configuration (engine input)

**Institutions:**
- WWF Philippines (stranger): Residuary (residuary)

**Legacies:**
- Old Friend: P1,000,000.00

### Distribution

| Heir | Category | Net From Estate | Donations | Total | Mode |
|------|----------|-----------------|-----------|-------|------|
| Hugo Lim | LegitimateChild | P8,000,000.00 | - | P8,000,000.00 | OwnRight |
| Irma Lim | SurvivingSpouse | P8,000,000.00 | - | P8,000,000.00 | OwnRight |

### Narratives

> **Hugo Lim (legitimate child)** receives **₱8,000,000**. The decedent died intestate (without a valid will). As a legitimate child (Art. 887 of the Civil Code), Hugo Lim is a compulsory heir.

> **Irma Lim (surviving spouse)** receives **₱8,000,000**. The decedent died intestate (without a valid will). As a surviving spouse (Art. 887 of the Civil Code), Irma Lim is a compulsory heir.

---

## Case 9: Cap rule: 1 LC + 3 IC + spouse, all instituted

| Field | Value |
|-------|-------|
| **Estate** | P24,000,000.00 |
| **Scenario** | T5a |
| **Succession Type** | Testate |
| **Will** | 5 institution(s) |
| **Validation** | PASS |

### Last Will and Testament

```
LAST WILL AND TESTAMENT
OF ALMA BAUTISTA

I, ALMA BAUTISTA, of legal age, Filipino, married to
FIONA BAUTISTA, and a resident of San Juan City, Metro Manila,
being of sound and disposing mind, do hereby declare this to be
my Last Will and Testament.

ARTICLE I — INSTITUTION OF HEIRS

It is my wish that my entire estate be divided equally among the
following persons, in equal shares:

    1. BIANCA BAUTISTA, my legitimate daughter;
    2. CARLO BAUTISTA, my acknowledged child;
    3. DANTE BAUTISTA, my acknowledged child;
    4. ELISA BAUTISTA, my acknowledged child;
    5. FIONA BAUTISTA, my beloved spouse.

I direct that each of the above-named shall receive an equal
portion, subject to the limitations imposed by law.

IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
June 2025, in San Juan City, Philippines.

                                [Signed]
                                ALMA BAUTISTA
                                Testatrix
```

### Will Configuration (engine input)

**Institutions:**
- Bianca Bautista (family): EqualWithOthers
- Carlo Bautista (family): EqualWithOthers
- Dante Bautista (family): EqualWithOthers
- Elisa Bautista (family): EqualWithOthers
- Fiona Bautista (family): EqualWithOthers

### Distribution

| Heir | Category | Net From Estate | Donations | Total | Mode |
|------|----------|-----------------|-----------|-------|------|
| Bianca Bautista | LegitimateChild | P12,000,000.00 | - | P12,000,000.00 | OwnRight |
| Fiona Bautista | SurvivingSpouse | P6,000,000.00 | - | P6,000,000.00 | OwnRight |
| Carlo Bautista | IllegitimateChild | P2,000,000.00 | - | P2,000,000.00 | OwnRight |
| Dante Bautista | IllegitimateChild | P2,000,000.00 | - | P2,000,000.00 | OwnRight |
| Elisa Bautista | IllegitimateChild | P2,000,000.00 | - | P2,000,000.00 | OwnRight |

### Narratives

> **Bianca Bautista (legitimate child)** receives **₱12,000,000**. The decedent left a valid will. As a legitimate child (Art. 887 of the Civil Code), Bianca Bautista is a compulsory heir.

> **Fiona Bautista (surviving spouse)** receives **₱6,000,000**. The decedent left a valid will. As a surviving spouse (Art. 887 of the Civil Code), Fiona Bautista is a compulsory heir.

> **Carlo Bautista (illegitimate child)** receives **₱2,000,000**. The decedent left a valid will. As a illegitimate child (Art. 176, Family Code) (Art. 887 of the Civil Code), Carlo Bautista is a compulsory heir.

> **Dante Bautista (illegitimate child)** receives **₱2,000,000**. The decedent left a valid will. As a illegitimate child (Art. 176, Family Code) (Art. 887 of the Civil Code), Dante Bautista is a compulsory heir.

> **Elisa Bautista (illegitimate child)** receives **₱2,000,000**. The decedent left a valid will. As a illegitimate child (Art. 176, Family Code) (Art. 887 of the Civil Code), Elisa Bautista is a compulsory heir.

---

## Case 10: Mixed: charity gets 1/10, rest intestate

| Field | Value |
|-------|-------|
| **Estate** | P10,000,000.00 |
| **Scenario** | T3 |
| **Succession Type** | Mixed |
| **Will** | 3 institution(s) |
| **Validation** | PASS |

### Last Will and Testament

```
LAST WILL AND TESTAMENT
OF ANDRES LIM

I, ANDRES LIM, of legal age, Filipino, married to DIANA LIM,
and a resident of Muntinlupa City, Metro Manila, being of sound
and disposing mind, do hereby declare this to be my Last Will
and Testament.

ARTICLE I — INSTITUTION OF HEIRS

I hereby institute as my heirs, in equal shares, my children:

    1. BELEN LIM
    2. CESAR LIM

ARTICLE II — CHARITABLE BEQUEST

I give and bequeath to CHARITY X, INC., a duly registered
non-profit, one-tenth (1/10) of my entire estate, to be
charged against the disposable free portion.

ARTICLE III — RESIDUARY ESTATE

I make no further disposition of the remainder of my estate,
which shall pass according to the rules of intestate succession.

IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
June 2025, in Muntinlupa City, Philippines.

                                [Signed]
                                ANDRES LIM
                                Testator
```

### Will Configuration (engine input)

**Institutions:**
- Belen Lim (family): EqualWithOthers
- Cesar Lim (family): EqualWithOthers
- Charity X (stranger): 1/10

### Distribution

| Heir | Category | Net From Estate | Donations | Total | Mode |
|------|----------|-----------------|-----------|-------|------|
| Belen Lim | LegitimateChild | P3,000,000.00 | - | P3,000,000.00 | OwnRight |
| Cesar Lim | LegitimateChild | P3,000,000.00 | - | P3,000,000.00 | OwnRight |
| Diana Lim | SurvivingSpouse | P3,000,000.00 | - | P3,000,000.00 | OwnRight |
| Charity X | LegitimateChild | P1,000,000.00 | - | P1,000,000.00 | OwnRight |

### Narratives

> **Belen Lim (legitimate child)** receives **₱3,000,000**. The decedent left a will that does not dispose of the entire estate. As a legitimate child (Art. 887 of the Civil Code), Belen Lim is a compulsory heir.

> **Cesar Lim (legitimate child)** receives **₱3,000,000**. The decedent left a will that does not dispose of the entire estate. As a legitimate child (Art. 887 of the Civil Code), Cesar Lim is a compulsory heir.

> **Diana Lim (surviving spouse)** receives **₱3,000,000**. The decedent left a will that does not dispose of the entire estate. As a surviving spouse (Art. 887 of the Civil Code), Diana Lim is a compulsory heir.

> **Charity X (beneficiary)** receives **₱1,000,000**.

---

## Case 11: Articulo mortis: spouse + stranger

| Field | Value |
|-------|-------|
| **Estate** | P9,000,000.00 |
| **Scenario** | T12 |
| **Succession Type** | Testate |
| **Will** | 2 institution(s) |
| **Validation** | PASS |

### Last Will and Testament

```
LAST WILL AND TESTAMENT
OF IGNACIO BELLO

I, IGNACIO BELLO, of legal age, Filipino, married to
JULIA BELLO, and a resident of Baguio City, being of sound
and disposing mind, though presently suffering from illness,
do hereby declare this to be my Last Will and Testament.

ARTICLE I — INSTITUTION OF HEIRS

I hereby institute as my heir my beloved wife, JULIA BELLO,
to receive her rightful share of my estate.

ARTICLE II — RESIDUARY ESTATE

Whatever remains of the disposable portion of my estate after
satisfaction of all legitimes and prior dispositions, I give and
bequeath to my nephew, herein referred to as NEPHEW, who has
been like a son to me and has cared for me during my illness.

IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
June 2025, in Baguio City, Philippines.

                                [Signed]
                                IGNACIO BELLO
                                Testator

[NOTE: Marriage to Julia Bello was solemnized on April 1, 2026,
 while testator was suffering from illness. Testator died on
 January 15, 2026. They had cohabited for approximately one
 year prior to the marriage.]
```

### Will Configuration (engine input)

**Institutions:**
- Julia Bello (family): EqualWithOthers
- Nephew (stranger): Residuary (residuary)

### Distribution

| Heir | Category | Net From Estate | Donations | Total | Mode |
|------|----------|-----------------|-----------|-------|------|
| Julia Bello | SurvivingSpouse | P3,000,000.00 | - | P3,000,000.00 | OwnRight |
| Nephew | LegitimateChild | P6,000,000.00 | - | P6,000,000.00 | OwnRight |

### Narratives

> **Julia Bello (surviving spouse)** receives **₱3,000,000**. The decedent left a valid will. As a surviving spouse (Art. 887 of the Civil Code), Julia Bello is a compulsory heir.

> **Nephew (beneficiary)** receives **₱6,000,000**.

---

## Case 12: Collation: LC1 got P2M donation, legacy to museum

| Field | Value |
|-------|-------|
| **Estate** | P18,000,000.00 |
| **Scenario** | T5b |
| **Succession Type** | Testate |
| **Will** | 2 institution(s), 1 legacy/legacies |
| **Validation** | PASS |

### Last Will and Testament

```
LAST WILL AND TESTAMENT
OF OSCAR NAVARRO

I, OSCAR NAVARRO, of legal age, Filipino, married to
TINA NAVARRO, and a resident of Quezon City, being of sound and
disposing mind, do hereby declare this to be my Last Will and
Testament.

ARTICLE I — INSTITUTION OF HEIRS

I hereby institute as my heirs, in equal shares, my legitimate
children:

    1. PILAR NAVARRO
    2. RAMON NAVARRO

ARTICLE II — LEGACY

I give and bequeath to the NATIONAL MUSEUM OF THE PHILIPPINES
the sum of THREE MILLION PESOS (P3,000,000.00), to support the
acquisition of works by contemporary Filipino artists.

ARTICLE III — ACKNOWLEDGMENT OF PRIOR DONATIONS

I acknowledge that during my lifetime, I donated to my daughter
PILAR NAVARRO properties valued at TWO MILLION PESOS
(P2,000,000.00) as an advance on her inheritance. Said donation
shall be subject to collation in the settlement of my estate.

IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
June 2025, in Quezon City, Philippines.

                                [Signed]
                                OSCAR NAVARRO
                                Testator
```

### Will Configuration (engine input)

**Institutions:**
- Pilar Navarro (family): EqualWithOthers
- Ramon Navarro (family): EqualWithOthers

**Legacies:**
- Museum: P3,000,000.00

**Donations (collation):**
- lc1: P2,000,000.00

### Distribution

| Heir | Category | Net From Estate | Donations | Total | Mode |
|------|----------|-----------------|-----------|-------|------|
| Pilar Navarro | LegitimateChild | P3,000,000.00 | P2,000,000.00 | P5,000,000.00 | OwnRight |
| Ramon Navarro | LegitimateChild | P5,000,000.00 | - | P5,000,000.00 | OwnRight |
| Tina Navarro | SurvivingSpouse | P5,000,000.00 | - | P5,000,000.00 | OwnRight |
| Sofia Navarro | IllegitimateChild | P2,500,000.00 | - | P2,500,000.00 | OwnRight |
| Museum | LegitimateChild | P2,500,000.00 | - | P2,500,000.00 | OwnRight |

### Narratives

> **Pilar Navarro (legitimate child)** receives **₱3,000,000 from the estate** (plus ₱2,000,000 previously received as a donation, for a total of ₱5,000,000). The decedent left a valid will. As a legitimate child (Art. 887 of the Civil Code), Pilar Navarro is a compulsory heir.

> **Ramon Navarro (legitimate child)** receives **₱5,000,000**. The decedent left a valid will. As a legitimate child (Art. 887 of the Civil Code), Ramon Navarro is a compulsory heir.

> **Tina Navarro (surviving spouse)** receives **₱5,000,000**. The decedent left a valid will. As a surviving spouse (Art. 887 of the Civil Code), Tina Navarro is a compulsory heir.

> **Sofia Navarro (illegitimate child)** receives **₱2,500,000**. The decedent left a valid will. As a illegitimate child (Art. 176, Family Code) (Art. 887 of the Civil Code), Sofia Navarro is a compulsory heir.

> **Museum (beneficiary)** receives **₱2,500,000**.

---

## Case 13: Spouse as sole instituted heir, parents alive

| Field | Value |
|-------|-------|
| **Estate** | P6,000,000.00 |
| **Scenario** | T7 |
| **Succession Type** | IntestateByPreterition |
| **Will** | 1 institution(s) |
| **Validation** | PASS |

### Last Will and Testament

```
LAST WILL AND TESTAMENT
OF ELENA TORRES

I, ELENA TORRES, of legal age, Filipino, married to
FELIPE TORRES, and a resident of Paranaque City, being of sound
and disposing mind, do hereby declare this to be my Last Will
and Testament.

ARTICLE I — INSTITUTION OF SOLE HEIR

I hereby institute my beloved husband, FELIPE TORRES, as my
sole and universal heir, to receive the entirety of my estate,
both real and personal, wherever situated.

It is my expressed wish that my husband receive everything that
the law permits me to freely dispose of.

IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
June 2025, in Paranaque City, Philippines.

                                [Signed]
                                ELENA TORRES
                                Testatrix

[NOTE: The testatrix's parents are both living at the time of
 execution. They are compulsory heirs under Philippine law.]
```

### Will Configuration (engine input)

**Institutions:**
- Felipe Torres (family): EntireEstate

### Distribution

| Heir | Category | Net From Estate | Donations | Total | Mode |
|------|----------|-----------------|-----------|-------|------|
| Father | LegitimateAscendant | P1,500,000.00 | - | P1,500,000.00 | OwnRight |
| Mother | LegitimateAscendant | P1,500,000.00 | - | P1,500,000.00 | OwnRight |
| Felipe Torres | SurvivingSpouse | P3,000,000.00 | - | P3,000,000.00 | OwnRight |

### Narratives

> **Father (legitimate parent)** receives **₱1,500,000**. The decedent died intestate (without a valid will). As a legitimate parent (Art. 887 of the Civil Code), Father is a compulsory heir.

> **Mother (legitimate parent)** receives **₱1,500,000**. The decedent died intestate (without a valid will). As a legitimate parent (Art. 887 of the Civil Code), Mother is a compulsory heir.

> **Felipe Torres (surviving spouse)** receives **₱3,000,000**. The decedent died intestate (without a valid will). As a surviving spouse (Art. 887 of the Civil Code), Felipe Torres is a compulsory heir.

---

## Case 14: Will to strangers only, 1 LC exists (preterition)

| Field | Value |
|-------|-------|
| **Estate** | P5,000,000.00 |
| **Scenario** | T1 |
| **Succession Type** | IntestateByPreterition |
| **Will** | 2 institution(s) |
| **Validation** | PASS |

### Last Will and Testament

```
LAST WILL AND TESTAMENT
OF MANUEL CRUZ

I, MANUEL CRUZ, of legal age, Filipino, single, and a resident
of Las Pinas City, being of sound and disposing mind, do hereby
declare this to be my Last Will and Testament.

ARTICLE I — INSTITUTION OF HEIRS

I hereby institute the following as my heirs, to divide my
entire estate between them equally:

    1. My BEST FRIEND, to receive one-half (1/2) of my estate,
       in gratitude for a lifetime of brotherhood;

    2. My GODCHILD, to receive one-half (1/2) of my estate,
       in the hope that it may help secure a better future.

I make no other disposition of my estate.

IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
June 2025, in Las Pinas City, Philippines.

                                [Signed]
                                MANUEL CRUZ
                                Testator

[NOTE: The testator's legitimate daughter NINA CRUZ is
 completely omitted from this will.]
```

### Will Configuration (engine input)

**Institutions:**
- Best Friend (stranger): 1/2
- Godchild (stranger): 1/2

### Distribution

| Heir | Category | Net From Estate | Donations | Total | Mode |
|------|----------|-----------------|-----------|-------|------|
| Nina Cruz | LegitimateChild | P5,000,000.00 | - | P5,000,000.00 | OwnRight |

### Narratives

> **Nina Cruz (legitimate child)** receives **₱5,000,000**. The decedent died intestate (without a valid will). As a legitimate child (Art. 887 of the Civil Code), Nina Cruz is a compulsory heir.

---

## Case 15: Disinherit 1 of 3 children, FP to sibling

| Field | Value |
|-------|-------|
| **Estate** | P30,000,000.00 |
| **Scenario** | T3 |
| **Succession Type** | IntestateByPreterition |
| **Will** | 1 institution(s), 1 disinheritance(s) |
| **Validation** | PASS |

### Last Will and Testament

```
LAST WILL AND TESTAMENT
OF ROBERTO RAMOS

I, ROBERTO RAMOS, of legal age, Filipino, married to
VICTOR RAMOS, and a resident of Mandaluyong City, being of
sound and disposing mind, do hereby declare this to be my
Last Will and Testament.

ARTICLE I — DISINHERITANCE

For just cause, I hereby DISINHERIT my daughter URSELA RAMOS,
pursuant to Article 919(2) of the Civil Code, on the ground
that she has made groundless accusations of a crime against
the testator, specifically filing a baseless criminal complaint
for estafa in 2023, which was subsequently dismissed by the
Office of the City Prosecutor.

ARTICLE II — DISPOSITION OF FREE PORTION

I hereby give, devise, and bequeath the entirety of the
disposable free portion of my estate to my daughter
SANDRA RAMOS, in recognition of her devotion, loyalty, and
care for our family.

ARTICLE III — COMPULSORY HEIRS

The legitimes of my remaining compulsory heirs shall be
respected and distributed in accordance with law.

IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
June 2025, in Mandaluyong City, Philippines.

                                [Signed]
                                ROBERTO RAMOS
                                Testator
```

### Will Configuration (engine input)

**Institutions:**
- Sandra Ramos (family): EntireFreePort

**Disinheritances:**
- Ursela Ramos: ChildGroundlessAccusation

### Distribution

| Heir | Category | Net From Estate | Donations | Total | Mode |
|------|----------|-----------------|-----------|-------|------|
| Sandra Ramos | LegitimateChild | P7,500,000.00 | - | P7,500,000.00 | OwnRight |
| Tomas Ramos | LegitimateChild | P7,500,000.00 | - | P7,500,000.00 | OwnRight |
| Ursela Ramos | LegitimateChild | P0.00 | - | P0.00 | OwnRight |
| Wendy Ramos | LegitimateChild | P7,500,000.00 | - | P7,500,000.00 | Repr (lc3) |
| Victor Ramos | SurvivingSpouse | P7,500,000.00 | - | P7,500,000.00 | OwnRight |

### Narratives

> **Sandra Ramos (legitimate child)** receives **₱7,500,000**. The decedent died intestate (without a valid will). As a legitimate child (Art. 887 of the Civil Code), Sandra Ramos is a compulsory heir.

> **Tomas Ramos (legitimate child)** receives **₱7,500,000**. The decedent died intestate (without a valid will). As a legitimate child (Art. 887 of the Civil Code), Tomas Ramos is a compulsory heir.

> **Ursela Ramos (legitimate child)** receives **₱0**. The decedent died intestate (without a valid will). As a legitimate child (Art. 887 of the Civil Code), Ursela Ramos is a compulsory heir.

> **Wendy Ramos (grandchild, by representation)** receives **₱7,500,000**. The decedent died intestate (without a valid will). As a legitimate child (Art. 887 of the Civil Code), Wendy Ramos is a compulsory heir. Wendy Ramos inherits by right of representation (Art. 970 of the Civil Code) in place of lc3.

> **Victor Ramos (surviving spouse)** receives **₱7,500,000**. The decedent died intestate (without a valid will). As a surviving spouse (Art. 887 of the Civil Code), Victor Ramos is a compulsory heir.

---

## Case 16: Massive legacy P50M on P20M estate

| Field | Value |
|-------|-------|
| **Estate** | P20,000,000.00 |
| **Scenario** | T1 |
| **Succession Type** | Testate |
| **Will** | 1 legacy/legacies |
| **Validation** | PASS |

### Last Will and Testament

```
LAST WILL AND TESTAMENT
OF JAIME FLORES

I, JAIME FLORES, of legal age, Filipino, single, and a
resident of Tagaytay City, Cavite, being of sound and
disposing mind, do hereby declare this to be my Last Will
and Testament.

ARTICLE I — LEGACY

I give and bequeath to the MEGA FOUNDATION FOR FILIPINO
EDUCATION, INC. the sum of FIFTY MILLION PESOS
(P50,000,000.00), to be used exclusively for the establishment
of technical-vocational training centers in rural areas.

ARTICLE II — RESIDUARY ESTATE

All the rest of my estate shall pass to my compulsory heirs
in accordance with law.

IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
June 2025, in Tagaytay City, Philippines.

                                [Signed]
                                JAIME FLORES
                                Testator

[NOTE: The testator's net estate at death is only P20,000,000,
 making the P50,000,000 legacy inofficious.]
```

### Will Configuration (engine input)

**Legacies:**
- Mega Foundation: P50,000,000.00

### Distribution

| Heir | Category | Net From Estate | Donations | Total | Mode |
|------|----------|-----------------|-----------|-------|------|
| Karen Flores | LegitimateChild | P5,000,000.00 | - | P5,000,000.00 | OwnRight |
| Luis Flores | LegitimateChild | P5,000,000.00 | - | P5,000,000.00 | OwnRight |
| Mega Foundation | LegitimateChild | P10,000,000.00 | - | P10,000,000.00 | OwnRight |

### Narratives

> **Karen Flores (legitimate child)** receives **₱5,000,000**. The decedent left a valid will. As a legitimate child (Art. 887 of the Civil Code), Karen Flores is a compulsory heir.

> **Luis Flores (legitimate child)** receives **₱5,000,000**. The decedent left a valid will. As a legitimate child (Art. 887 of the Civil Code), Luis Flores is a compulsory heir.

> **Mega Foundation (beneficiary)** receives **₱10,000,000**.

---

## Case 17: Preferred legacy P2M + regular legacy P3M on P10M (1 LC)

| Field | Value |
|-------|-------|
| **Estate** | P10,000,000.00 |
| **Scenario** | T1 |
| **Succession Type** | Testate |
| **Will** | 2 legacy/legacies |
| **Validation** | PASS |

### Last Will and Testament

```
LAST WILL AND TESTAMENT
OF WANDA TAN

I, WANDA TAN, of legal age, Filipino, single, and a resident
of Caloocan City, Metro Manila, being of sound and disposing
mind, do hereby declare this to be my Last Will and Testament.

ARTICLE I — PREFERRED LEGACY

I give and bequeath, with preference over all other legacies
herein, to my FAVORITE CHARITY, INC., the sum of TWO MILLION
PESOS (P2,000,000.00). This legacy shall be satisfied first
before any other testamentary dispositions from the free
portion, should the free portion be insufficient to cover all.

ARTICLE II — LEGACY TO CHURCH

I give and bequeath to the LOCAL CHURCH OF CALOOCAN the sum
of THREE MILLION PESOS (P3,000,000.00), for the renovation of
its parish hall.

ARTICLE III — RESIDUARY ESTATE

All the rest of my estate shall pass to my compulsory heirs
according to law.

IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
June 2025, in Caloocan City, Philippines.

                                [Signed]
                                WANDA TAN
                                Testatrix
```

### Will Configuration (engine input)

**Legacies:**
- Favorite Charity: P2,000,000.00 (preferred)
- Local Church: P3,000,000.00

### Distribution

| Heir | Category | Net From Estate | Donations | Total | Mode |
|------|----------|-----------------|-----------|-------|------|
| Xavier Tan | LegitimateChild | P5,000,000.00 | - | P5,000,000.00 | OwnRight |
| Favorite Charity | LegitimateChild | P2,000,000.00 | - | P2,000,000.00 | OwnRight |
| Local Church | LegitimateChild | P3,000,000.00 | - | P3,000,000.00 | OwnRight |

### Narratives

> **Xavier Tan (legitimate child)** receives **₱5,000,000**. The decedent left a valid will. As a legitimate child (Art. 887 of the Civil Code), Xavier Tan is a compulsory heir.

> **Favorite Charity (beneficiary)** receives **₱2,000,000**.

> **Local Church (beneficiary)** receives **₱3,000,000**.

---

## Case 18: Will with parents + stranger, no children

| Field | Value |
|-------|-------|
| **Estate** | P8,000,000.00 |
| **Scenario** | T6 |
| **Succession Type** | IntestateByPreterition |
| **Will** | 1 institution(s) |
| **Validation** | PASS |

### Last Will and Testament

```
LAST WILL AND TESTAMENT
OF LEO REYES

I, LEO REYES, of legal age, Filipino, single, and a resident
of Antipolo City, Rizal, being of sound and disposing mind, do
hereby declare this to be my Last Will and Testament.

ARTICLE I — DISPOSITION OF FREE PORTION

I hereby give, devise, and bequeath the entirety of the
disposable free portion of my estate to my BUSINESS PARTNER,
with whom I have built a successful enterprise over two decades,
and whose collaboration has been the foundation of my
professional life.

ARTICLE II — COMPULSORY HEIRS

The legitimes of my parents, who are my compulsory heirs under
the law, shall be respected and satisfied in accordance with
the Civil Code of the Philippines.

IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
June 2025, in Antipolo City, Philippines.

                                [Signed]
                                LEO REYES
                                Testator
```

### Will Configuration (engine input)

**Institutions:**
- Business Partner (stranger): EntireFreePort

### Distribution

| Heir | Category | Net From Estate | Donations | Total | Mode |
|------|----------|-----------------|-----------|-------|------|
| Father | LegitimateAscendant | P4,000,000.00 | - | P4,000,000.00 | OwnRight |
| Mother | LegitimateAscendant | P4,000,000.00 | - | P4,000,000.00 | OwnRight |

### Narratives

> **Father (legitimate parent)** receives **₱4,000,000**. The decedent died intestate (without a valid will). As a legitimate parent (Art. 887 of the Civil Code), Father is a compulsory heir.

> **Mother (legitimate parent)** receives **₱4,000,000**. The decedent died intestate (without a valid will). As a legitimate parent (Art. 887 of the Civil Code), Mother is a compulsory heir.

---

## Case 19: LC and IC instituted equal, will enforces ratio

| Field | Value |
|-------|-------|
| **Estate** | P10,000,000.00 |
| **Scenario** | T5a |
| **Succession Type** | Testate |
| **Will** | 3 institution(s) |
| **Validation** | PASS |

### Last Will and Testament

```
LAST WILL AND TESTAMENT
OF PATRICIA GOMEZ

I, PATRICIA GOMEZ, of legal age, Filipino, married to
SAM GOMEZ, and a resident of Marikina City, Metro Manila,
being of sound and disposing mind, do hereby declare this
to be my Last Will and Testament.

ARTICLE I — INSTITUTION OF HEIRS

It is my wish and desire that my estate be divided equally
among the following, in equal shares:

    1. QUENTIN GOMEZ, my legitimate son;
    2. RITA GOMEZ, my acknowledged daughter;
    3. SAM GOMEZ, my beloved husband.

I direct that each shall receive an equal share, to the
extent permitted by law.

IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
June 2025, in Marikina City, Philippines.

                                [Signed]
                                PATRICIA GOMEZ
                                Testatrix

[NOTE: The testator wishes equal shares, but the law imposes
 the rule that an illegitimate child's share cannot exceed
 one-half of a legitimate child's share (Art. 895).]
```

### Will Configuration (engine input)

**Institutions:**
- Quentin Gomez (family): EqualWithOthers
- Rita Gomez (family): EqualWithOthers
- Sam Gomez (family): EqualWithOthers

### Distribution

| Heir | Category | Net From Estate | Donations | Total | Mode |
|------|----------|-----------------|-----------|-------|------|
| Quentin Gomez | LegitimateChild | P5,000,000.00 | - | P5,000,000.00 | OwnRight |
| Sam Gomez | SurvivingSpouse | P2,500,000.00 | - | P2,500,000.00 | OwnRight |
| Rita Gomez | IllegitimateChild | P2,500,000.00 | - | P2,500,000.00 | OwnRight |

### Narratives

> **Quentin Gomez (legitimate child)** receives **₱5,000,000**. The decedent left a valid will. As a legitimate child (Art. 887 of the Civil Code), Quentin Gomez is a compulsory heir.

> **Sam Gomez (surviving spouse)** receives **₱2,500,000**. The decedent left a valid will. As a surviving spouse (Art. 887 of the Civil Code), Sam Gomez is a compulsory heir.

> **Rita Gomez (illegitimate child)** receives **₱2,500,000**. The decedent left a valid will. As a illegitimate child (Art. 176, Family Code) (Art. 887 of the Civil Code), Rita Gomez is a compulsory heir.

---

## Case 20: Complex: disinheritance + collation + legacy + representation

| Field | Value |
|-------|-------|
| **Estate** | P25,000,000.00 |
| **Scenario** | T3 |
| **Succession Type** | Mixed |
| **Will** | 2 institution(s), 1 legacy/legacies, 1 disinheritance(s) |
| **Validation** | PASS |

### Last Will and Testament

```
LAST WILL AND TESTAMENT
OF FERNANDO CRUZ

I, FERNANDO CRUZ, of legal age, Filipino, married to
KELLY CRUZ, and a resident of Batangas City, Batangas, being
of sound and disposing mind, do hereby declare this to be my
Last Will and Testament.

ARTICLE I — DISINHERITANCE

For just cause, I hereby DISINHERIT my daughter IVY CRUZ,
pursuant to Article 919(5) of the Civil Code, on the ground
that she has refused without justifiable cause to support me
during my period of need. Despite my repeated requests for
assistance during my prolonged hospitalization from 2022 to
2024, Ivy refused to provide any form of support, financial
or otherwise.

ARTICLE II — INSTITUTION OF HEIRS

I hereby institute as my heirs, in equal shares, my children:

    1. GRACE CRUZ
    2. HENRY CRUZ

ARTICLE III — LEGACY

I give and bequeath to the BAHAY KALINGA ORPHANAGE the sum of
TWO MILLION PESOS (P2,000,000.00), for the care and education
of orphaned children.

ARTICLE IV — ACKNOWLEDGMENT OF PRIOR DONATIONS

I acknowledge that during my lifetime, I donated to my daughter
GRACE CRUZ properties and funds valued at ONE MILLION PESOS
(P1,000,000.00) as an advance on her inheritance. Said donation
shall be collated in the partition of my estate.

ARTICLE V — RESIDUARY ESTATE

All the rest, residue, and remainder of my estate shall pass to
my compulsory heirs in accordance with law.

IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
June 2025, in Batangas City, Philippines.

                                [Signed]
                                FERNANDO CRUZ
                                Testator
```

### Will Configuration (engine input)

**Institutions:**
- Grace Cruz (family): EqualWithOthers
- Henry Cruz (family): EqualWithOthers

**Legacies:**
- Orphanage: P2,000,000.00

**Disinheritances:**
- Ivy Cruz: ChildRefusalToSupport

**Donations (collation):**
- lc1: P1,000,000.00

### Distribution

| Heir | Category | Net From Estate | Donations | Total | Mode |
|------|----------|-----------------|-----------|-------|------|
| Grace Cruz | LegitimateChild | P5,000,000.00 | P1,000,000.00 | P6,000,000.00 | OwnRight |
| Henry Cruz | LegitimateChild | P6,000,000.00 | - | P6,000,000.00 | OwnRight |
| Ivy Cruz | LegitimateChild | P0.00 | - | P0.00 | OwnRight |
| Jack Cruz | LegitimateChild | P6,000,000.00 | - | P6,000,000.00 | Repr (lc3) |
| Kelly Cruz | SurvivingSpouse | P6,000,000.00 | - | P6,000,000.00 | OwnRight |
| Orphanage | LegitimateChild | P2,000,000.00 | - | P2,000,000.00 | OwnRight |

### Narratives

> **Grace Cruz (legitimate child)** receives **₱5,000,000 from the estate** (plus ₱1,000,000 previously received as a donation, for a total of ₱6,000,000). The decedent left a will that does not dispose of the entire estate. As a legitimate child (Art. 887 of the Civil Code), Grace Cruz is a compulsory heir.

> **Henry Cruz (legitimate child)** receives **₱6,000,000**. The decedent left a will that does not dispose of the entire estate. As a legitimate child (Art. 887 of the Civil Code), Henry Cruz is a compulsory heir.

> **Ivy Cruz (legitimate child)** receives **₱0**. The decedent left a will that does not dispose of the entire estate. As a legitimate child (Art. 887 of the Civil Code), Ivy Cruz is a compulsory heir.

> **Jack Cruz (grandchild, by representation)** receives **₱6,000,000**. The decedent left a will that does not dispose of the entire estate. As a legitimate child (Art. 887 of the Civil Code), Jack Cruz is a compulsory heir. Jack Cruz inherits by right of representation (Art. 970 of the Civil Code) in place of lc3.

> **Kelly Cruz (surviving spouse)** receives **₱6,000,000**. The decedent left a will that does not dispose of the entire estate. As a surviving spouse (Art. 887 of the Civil Code), Kelly Cruz is a compulsory heir.

> **Orphanage (beneficiary)** receives **₱2,000,000**.

---
