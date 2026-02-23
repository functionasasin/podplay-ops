# Estate Tax Amnesty — Legal Provisions
## RA 11213 (Tax Amnesty Act), RA 11569, and RA 11956

**Sources**: lawphil.net (RA 11213 full text), saklawph.com, PwC Philippines, arceotandoc.com, BIR official materials

---

## Legislative History

| Law | Enacted | Key Change |
|---|---|---|
| **RA 11213** | February 14, 2019 | Original Estate Tax Amnesty Act. Covered deaths on/before Dec 31, 2017. Filing window: 2 years from IRR effectivity (June 15, 2019 → June 14, 2021) |
| **RA 11569** | July 25, 2021 | Extended filing deadline to **June 14, 2023**. Coverage unchanged (deaths on/before Dec 31, 2017) |
| **RA 11956** | August 5, 2023 | Extended filing deadline to **June 14, 2025**. Expanded coverage to deaths on/before **May 31, 2022** |

**Status (as of 2026)**: The estate tax amnesty filing window **closed on June 14, 2025**. No further extension has been enacted as of February 2026. The engine should model this as a closed program (historical computation only).

---

## Section 3 — Definitions (RA 11213)

**"Basic tax assessed"**: The latest amount of tax assessment issued by the BIR against the taxpayer, exclusive of interest, penalties, and surcharges.

**"Net estate"**: The gross estate minus allowable deductions under the NIRC of 1997, as amended.

**"Net undeclared estate"**: The difference between the total net estate valued at the time of death and the net estate previously declared with the BIR, if any.

---

## Section 4 — Coverage and Eligibility

### Who Qualifies (as amended by RA 11956)

Estates of decedents who:
1. Died **on or before May 31, 2022** (original RA 11213: on/before December 31, 2017)
2. With **or without** prior BIR assessments
3. Whose estate taxes have remained **unpaid or accrued** as of May 31, 2022

### Exclusions (Section 9)

The amnesty does **not** cover estates where:
- The decedent's estate is subject to Presidential Commission on Good Government (PCGG) jurisdiction
- The estate involves violations of RA 3019 (Anti-Graft and Corrupt Practices Act)
- The estate involves violations of RA 9160 (Anti-Money Laundering Act)
- Pending cases under the Tax Code involving cases filed in court prior to the Tax Amnesty Act
- Violations involving unexplained wealth (RA 1379)
- Felonies under the Revised Penal Code

---

## Section 5 — Amnesty Tax Rate and Computation

### Rate

**6% (0.06)** of the decedent's total net estate at the time of death.

### Two Computation Tracks

#### Track A: No Prior Estate Tax Return Filed

```
Amnesty Tax = 6% × Net Estate
```

Where Net Estate = Gross Estate − Allowable Deductions

**Allowable Deductions under Amnesty**:
- The deductions remain those **applicable at the time of the death** of the decedent (not necessarily the current TRAIN deductions)
- Standard deduction applicable at time of death
- Surviving spouse's share in conjugal/community property
- All other deductions allowed under the NIRC at the time of death

**Important**: Some BIR guidance and legal commentary interpret "allowable deductions" under amnesty more narrowly — only the standard deduction and surviving spouse's share. The conservative interpretation limits deductions to:
- Standard deduction (₱1M for pre-2018 deaths → pre-TRAIN standard deduction applies)
- Surviving spouse share

*Engine should implement the full deduction set applicable at time of death (aligned with the law text "deductions applicable at the time of death"), but flag this as an area requiring professional tax advice.*

#### Track B: Prior Estate Tax Return Was Filed

```
Amnesty Tax = 6% × Net Undeclared Estate
```

Where:
```
Net Undeclared Estate = Total Net Estate − Previously Declared Net Estate
```

If Net Undeclared Estate ≤ 0, minimum payment rule applies.

### Minimum Payment Rule

If allowable deductions exceed the gross estate (resulting in zero or negative net estate):

```
Amnesty Tax = ₱5,000 (minimum)
```

---

## Section 6 — Filing Requirements

### Who Files

The executor, administrator, or any of the legal heirs, transferees, or beneficiaries of the estate.

### Filing Location

Revenue District Office (RDO) with jurisdiction over the **last residence** of the decedent at the time of death.

### Documents Required

1. **Estate Tax Amnesty Return (ETAR)** — Sworn statement
2. **Acceptance Payment Form (APF)** — BIR-issued form for payment acceptance
3. **Certified true copy** of Death Certificate
4. **Deed of Extra-Judicial Settlement** (if applicable) or court order (if judicially settled)
5. **Sworn Declaration** of all properties of the estate
6. Certificate of Registration of motor vehicles (if included)
7. Latest Tax Declaration or Zonal Value of real properties
8. Bank certificates for financial assets

### Process

1. Secure APF from the RDO
2. Pay amnesty tax at the AAB (Authorized Agent Bank)
3. File ETAR with proof of payment at the RDO (submit in triplicate)
4. Receive **Certificate of Availment** within 15 calendar days from complete submission

---

## Section 7 — Conclusiveness

Estate Tax Amnesty Returns shall be:
- **Conclusively presumed** to be true, correct, and final upon filing
- **Deemed complete** upon full payment of the amount due

---

## Section 8 — Immunities and Privileges

Upon full compliance:
- **Immune from payment** of all estate taxes, increments, and additions arising from failure to pay estate taxes for 2017 and prior years (for RA 11213 original coverage)
- All **civil penalties, surcharges, and interest** are waived
- **Civil, criminal, and administrative cases** arising from nonpayment of estate taxes are withdrawn/dismissed

**Limitation**: Properties that were the subject of a separate **taxable donation or sale** remain subject to donor's tax or capital gains tax on that transaction, plus penalties if applicable.

---

## Amnesty vs. Regular Pre-TRAIN Computation

### When to Use Amnesty Path
- Decedent died on or before May 31, 2022
- Estate tax remains unpaid or partially paid
- Executor/heirs elected to avail of the amnesty (filing window: closed June 14, 2025)

### When to Use Regular Pre-TRAIN Path
- Decedent died before January 1, 2018
- Estate tax was already paid under regular rules
- Executor/heirs did not elect amnesty (or amnesty window has closed)

### Key Differences: Amnesty vs. Regular Pre-TRAIN

| Item | Regular Pre-TRAIN | Amnesty |
|---|---|---|
| Tax Rate | Graduated 5%–20% | Flat 6% |
| Deductions | Full set (all NIRC deductions at time of death) | Full set at time of death (some interpret as limited to standard + spouse share) |
| Penalties/Interest | Apply (full) | Waived |
| Filing Window | No deadline per se (but penalties accrue) | Closed June 14, 2025 |
| Prior return filed | Must amend and pay | Can pay only on undeclared portion |

---

## Computation Example: Estate Tax Amnesty

**Given**:
- Decedent died January 15, 2012 (qualifies for amnesty under RA 11956)
- Gross estate (PH properties only): ₱6,000,000
- No prior estate tax return filed

**Applying Amnesty (using deductions applicable at time of death, 2012 = pre-TRAIN rules)**:
```
Gross Estate:                        ₱6,000,000
Less: Standard Deduction (pre-TRAIN):  -₱1,000,000
Less: Family Home (pre-TRAIN cap):      -₱1,000,000
Less: Funeral Expenses (5% = ₱300K):    -₱300,000
Net Estate:                          ₱3,700,000

Amnesty Tax: 6% × ₱3,700,000 = ₱222,000
(Minimum ₱5,000 does not apply since net estate > 0)
```

**Alternative (narrow interpretation — standard + spouse share only)**:
```
Gross Estate:                        ₱6,000,000
Less: Standard Deduction (pre-TRAIN):  -₱1,000,000
(No surviving spouse share — assume single)
Net Estate:                          ₱5,000,000

Amnesty Tax: 6% × ₱5,000,000 = ₱300,000
```

---

## BIR Issuances (Revenue Regulations)

- **RR 6-2019** (June 15, 2019): Implementing Rules and Regulations of RA 11213, set the 2-year availment window starting June 15, 2019
- **RR 17-2021** (August 2021): Implementing rules for RA 11569 extension
- **RR 10-2023**: Implementing rules for RA 11956 extension and coverage expansion to May 31, 2022 deaths

---

## Notes for Engine Implementation

1. **Amnesty as a closed program**: The filing window closed June 14, 2025. Engine should compute the amnesty tax amount (historical) but note that availment is no longer possible.

2. **Track selection**: Engine must ask: "Was a prior estate tax return filed?" to determine Track A vs. Track B.

3. **Deduction ambiguity**: The law says "deductions applicable at the time of death." For pre-2018 deaths, this means pre-TRAIN deduction rules apply. Engine should apply all pre-TRAIN deductions, not just standard + spouse share.

4. **Minimum payment**: Always enforce ₱5,000 minimum even if computed tax is lower.

5. **Coverage check**: Engine must verify date of death is on or before May 31, 2022 for amnesty eligibility.
