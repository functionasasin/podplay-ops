# Analysis: Deduction — Transfers for Public Use

**Aspect**: `deduction-public-transfers`
**NIRC Section**: Sec. 86(A)(3) [citizens/residents] and Sec. 86(B)(4) [non-resident aliens]
**Date Analyzed**: 2026-02-23
**Wave**: 2 (TRAIN-Era Rule Extraction)
**Form 1801 Location**: Schedule 5, Line 5F → Part IV, Item 35

---

## Legal Basis

### Primary Text — NIRC Sec. 86(A)(3) (TRAIN-era, unchanged from pre-TRAIN)

> "The amount of all bequests, legacies, devises, or transfers to or for the use of the **Government of the Philippines**, or any **political subdivision** thereof, for **exclusively public purposes**."

### NRA Extension — NIRC Sec. 86(B)(4)

> "Transfers for Public Use: Same as Section 86(A)(3), limited to Philippine government."

Non-resident aliens receive this same deduction for transfers to the Philippine government, applied to Philippine-situated property only.

### Relation to Sec. 87(d) — Charitable Bequests (Different Provision)

Sec. 87(d) covers transfers to **private** social welfare, cultural, and charitable institutions. That is a separate exemption mechanism and is analyzed in the `exemptions` aspect. These two provisions are mutually exclusive by recipient type:

| Recipient | Mechanism | Form Treatment |
|---|---|---|
| Philippine Government or political subdivision | Sec. 86(A)(3) — **deduction** from gross estate | Schedule 5F (ordinary deduction) |
| Private charitable/cultural/social welfare institution | Sec. 87(d) — **exemption** (excluded from gross estate) | Not shown on Form 1801 |

---

## Rule (Pseudocode)

```
# Inputs
# Each publicTransfer has:
#   description: string
#   recipient: string (name of government entity)
#   recipientIsPhGovernmentOrPoliticalSubdivision: boolean
#   purposeIsExclusivelyPublic: boolean
#   fmvAtDeath: Peso (user-provided; matches gross estate entry for this property)
#   ownershipType: EXCLUSIVE | CONJUGAL_COMMUNAL

function computeTransfersForPublicUse(publicTransfers):
  schedule5F_columnA = 0  # Exclusive property transfers
  schedule5F_columnB = 0  # Conjugal/communal property transfers
  qualifyingTransfers = []

  for transfer in publicTransfers:
    # Eligibility check 1: Recipient must be PH government or political subdivision
    if NOT transfer.recipientIsPhGovernmentOrPoliticalSubdivision:
      disqualify(transfer, reason="Recipient not Philippine government or political subdivision")
      continue

    # Eligibility check 2: Purpose must be exclusively public
    if NOT transfer.purposeIsExclusivelyPublic:
      disqualify(transfer, reason="Purpose not exclusively public")
      continue

    # Eligible: accumulate into correct column
    if transfer.ownershipType == EXCLUSIVE:
      schedule5F_columnA += transfer.fmvAtDeath
    else:  # CONJUGAL_COMMUNAL
      schedule5F_columnB += transfer.fmvAtDeath

    qualifyingTransfers.append(transfer)

  return {
    schedule5F: {
      columnA: schedule5F_columnA,
      columnB: schedule5F_columnB,
      total: schedule5F_columnA + schedule5F_columnB
    },
    qualifyingTransfers: qualifyingTransfers
  }

# This result feeds into the ordinary deductions total:
# ordinaryDeductions.transfersPublicUse = result.schedule5F.total
# Item 35 accumulates all ordinary deductions including this one
```

### Value Rule

The deduction amount equals the **FMV of the property at time of death** — the same value used when the property was entered into the gross estate schedules (Item 29, 30, 31, 32, or 33). There is **no cap** on this deduction.

---

## Conditions

### Who/What Qualifies as the Recipient

| Recipient Type | Qualifies? | Notes |
|---|---|---|
| Republic of the Philippines (national government) | Yes | Direct transfers to NG |
| Province | Yes | Political subdivision |
| City | Yes | Political subdivision |
| Municipality | Yes | Political subdivision |
| Barangay | Yes | Lowest political subdivision; qualifies |
| Government agency / bureau (e.g., DepEd, DOH) | Yes | Arms of the national government |
| State university (UP, PNU, Visayas State, etc.) | Yes (conditional) | If established by law as a government instrumentality; verify charter |
| Government-Owned and Controlled Corporation (GOCC) | Uncertain | Must verify exclusively public purpose; commercial GOCCs may not qualify |
| Foreign government | **No** | Only Philippine government or its political subdivisions |
| Private charitable institution | **No** | Use Sec. 87(d) analysis instead |
| Private foundation | **No** | Even if serving public purpose; not government |

### Purpose Requirement

- The transfer must be **for exclusively public purposes** — no private benefit to individuals
- Mixed-use conditions (e.g., "for a school that also serves private students") may disqualify
- The purpose is assessed based on the **testamentary instruction** and the **nature of the recipient**
- The BIR may require documentation showing the public-use condition (e.g., deed of donation, will language)

### Transfer Mechanism

The deduction applies to:
- **Bequests** (personal property by will)
- **Legacies** (personal property by will, sometimes distinguished from bequests)
- **Devises** (real property by will)
- **Transfers** (broader term; may include inter vivos transfers includible in gross estate under Sec. 85(B)-(G))

**Key point**: This is a deduction for what IS included in the gross estate. The property must first appear in the gross estate (Items 29-33), then the deduction appears in Schedule 5F.

### Regime Applicability

| Regime | Available? | Notes |
|---|---|---|
| TRAIN-era (death ≥ 2018-01-01) | **Yes** | Sec. 86(A)(3) — unchanged by TRAIN |
| Pre-TRAIN (death < 2018-01-01) | **Yes** | Sec. 86(A)(3) — same provision, same rule |
| Estate Tax Amnesty (RA 11213/11569) | **No** | Amnesty path allows only: standard deduction + surviving spouse share; this deduction is NOT available |
| Non-resident aliens (any regime) | **Yes** | Via Sec. 86(B)(4), limited to PH-situated property and PH government |

**Conclusion**: This deduction is **regime-invariant between TRAIN and pre-TRAIN**. The provision was NOT amended by TRAIN. Only the amnesty path excludes it.

---

## Form 1801 Mapping

```
Transfer FMV (exclusive property)   → Schedule 5, Line 5F, Column A
Transfer FMV (conjugal property)    → Schedule 5, Line 5F, Column B
Schedule 5F total (A + B)           → Feeds Schedule 5H (Total Ordinary Deductions)
Schedule 5H                         → Part IV, Item 35
Item 35                             → Item 36 = Item 34 − Item 35
```

### Column Assignment Logic

```
if transfer.ownershipType == EXCLUSIVE:
  column = A
elif transfer.ownershipType == CONJUGAL_COMMUNAL:
  column = B
```

**Note on conjugal transfers**: When a conjugal asset is transferred to the government, the **full FMV** appears in Column B of both the gross estate (e.g., Schedule 1) and the deduction (Schedule 5F). The surviving spouse's 50% interest in that asset is then handled by Item 39 (surviving spouse share computation). The engine does not halve this deduction amount; the full conjugal property value flows through Column B consistently.

---

## Edge Cases

### EC-1: GOCC Transfer
**Scenario**: Decedent bequeaths property to a GOCC (e.g., Landbank of the Philippines, PhilHealth).

**Engine behavior**: Flag as requiring manual review. Input should include a `requiresManualReview: true` field. GOCCs are government entities, but their commercial operations may mean the property is not used for "exclusively public purposes." The engine cannot resolve this automatically; the executor must determine eligibility and the BIR has final authority.

**Recommendation**: Implement as a user-confirmed input field: `transfer.birConfirmedPublicPurpose: boolean`

### EC-2: State University Transfer
**Scenario**: Bequest to University of the Philippines (a state university established by charter law).

**Engine behavior**: Likely qualifies (government instrumentality, educational purpose = public purpose). Input as qualifying if `recipientIsPhGovernmentOrPoliticalSubdivision = true`. User must confirm.

### EC-3: Conditional Public Bequest That Reverts
**Scenario**: "I bequest land to the City of Manila, for use as a public park. If not used as a park within 10 years, it reverts to my heirs."

**Engine behavior**: The deduction is claimed based on the bequest as written. The conditional nature does not disqualify the deduction at time of filing; the future reversion is a separate legal matter. Deduction: allowed.

### EC-4: Foreign Government Transfer
**Scenario**: Filipino decedent bequeaths PH property to the United States government for use as a US Embassy annex.

**Engine behavior**: **Does NOT qualify** for Sec. 86(A)(3). Only Philippine government or political subdivisions qualify. The transfer is included in the gross estate and not deducted. (May also trigger Sec. 85(B)-(G) analysis if transferred inter vivos.)

### EC-5: Property Already Excluded from Gross Estate
**Scenario**: Decedent's will leaves property to a charity (Sec. 87(d) exempt) AND to the City Government for public use (Sec. 86(A)(3)).

**Engine behavior**:
- Sec. 87(d) charitable transfer: NOT included in gross estate
- Sec. 86(A)(3) government transfer: IS included in gross estate, then deducted in Schedule 5F
- These are separate items; no overlap or double-counting

### EC-6: Full Estate Bequeathed to Government
**Scenario**: Decedent bequeaths entire estate to the Philippine government for a hospital.

**Engine behavior**: Deduction equals full FMV of estate. This creates a situation where:
- Gross estate: ₱X
- Ordinary deductions (Schedule 5F): ₱X
- Estate after ordinary deductions: ₱0
- Net estate: ₱0
- Net taxable estate: ₱0
- Estate tax due: ₱0

No minimum tax applies under regular rules (TRAIN or pre-TRAIN).

### EC-7: Amnesty Filer with Public Transfer
**Scenario**: Pre-2018 decedent's estate availing of RA 11213 amnesty has a bequest to city government.

**Engine behavior**: The Sec. 86(A)(3) deduction is **NOT available** under amnesty. The amnesty path allows only (1) standard deduction and (2) surviving spouse share. The property is included in gross estate; no public-transfer deduction is applied. Net effect: higher amnesty tax base than regular pre-TRAIN tax.

### EC-8: Conjugal Property Bequeathed to Government
**Scenario**: Deceased spouse bequeaths conjugal land (FMV = ₱4M) to the municipality.

**Engine behavior**:
- Gross estate Schedule 1, Column B: ₱4M
- Schedule 5F, Column B: ₱4M (full value, no halving)
- Surviving spouse share (Item 39) is computed on remaining conjugal property AFTER this deduction
- Net effect: deduction reduces the pool from which spouse share is calculated

**Interaction note**: The surviving spouse share computation in Item 39 uses the net conjugal/community property. Because the public transfer reduces the estate after ordinary deductions (Item 36), the surviving spouse share is computed on the reduced amount. This is covered in detail in the `surviving-spouse-share` aspect.

### EC-9: Transfer Value Differs from Gross Estate Entry
**Scenario**: Property is entered in gross estate at FMV = ₱5M, but decedent's will specifies the bequest to the government was a partial interest (e.g., only ½ of the property).

**Engine behavior**: The deduction is limited to the **value of the interest actually transferred**. If only 50% interest is bequeathed, the deduction = ₱2.5M (50% × ₱5M FMV). The remaining 50% stays in the estate. The engine should allow partial-property transfers: `transfer.percentageInterestTransferred` → `deductionAmount = fmvAtDeath × percentageInterestTransferred`.

### EC-10: NRA Transferring PH Property to PH Government
**Scenario**: Non-resident alien decedent bequeaths PH real property to a Philippine city.

**Engine behavior**: Qualifies under Sec. 86(B)(4). The NRA deductions use a proportional formula for most items, but transfers for public use appears to be deducted at **full value** (not proportionally), since Sec. 86(B)(4) says "same as Sec. 86(A)(3)" without adding a proportional limitation. This is distinct from the proportional ELIT deductions under Sec. 86(B)(2). Deduction = full FMV of the PH-situated property transferred.

**Note**: This interpretation should be confirmed in the `nonresident-deductions` aspect when it analyzes the Sec. 86(B) framework in full.

---

## Test Implications

1. **Test: Standard government bequest** — Decedent bequeaths exclusive property (FMV = ₱2M) to Philippine government. Schedule 5F Column A = ₱2M; Item 35 increases by ₱2M.

2. **Test: Political subdivision bequest** — Bequest to a municipality. Same result as above; municipality qualifies as "political subdivision."

3. **Test: Full estate to government** — Estate tax = ₱0. No minimum tax.

4. **Test: Conjugal property bequest** — Full conjugal FMV appears in both Schedule 1 Column B (gross estate) and Schedule 5F Column B (deduction). Item 39 uses reduced net estate base.

5. **Test: Foreign government transfer** — Deduction = ₱0. Property remains in taxable estate.

6. **Test: Amnesty path** — Public transfer present, but deduction NOT applied. Amnesty base includes this property.

7. **Test: Pre-TRAIN case** — Same rule applies. Identical computation to TRAIN-era case.

8. **Test: Partial interest transfer** — Only percentage of property transferred; deduction scaled accordingly.

9. **Test: NRA with PH government bequest** — Full value deducted (not proportional), feeds NRA deduction total.

10. **Test: Mixed transfers** — One bequest to charity (Sec. 87, excluded from GE), one to government (Sec. 86(A)(3), included in GE then deducted). No double-counting; separate line items.

---

## Summary for Spec

| Attribute | Value |
|---|---|
| NIRC Section | Sec. 86(A)(3) [citizens/residents]; Sec. 86(B)(4) [NRAs] |
| Deduction Type | Ordinary deduction (Schedule 5, Line 5F) |
| Cap | **None** — unlimited amount |
| Eligible Recipients | PH government; any political subdivision (province, city, municipality, barangay) |
| Purpose Requirement | Exclusively public purposes |
| Property Types | Any property includible in gross estate |
| Regime | **TRAIN-era**: Yes. **Pre-TRAIN**: Yes (identical rule). **Amnesty**: No |
| NRA Availability | Yes (Sec. 86(B)(4)); limited to PH-situated property; full value (not proportional) |
| Column Assignment | Column A (exclusive) or Column B (conjugal/communal) matching gross estate entry |
| Documentation | Will/testament language; government acceptance; deed of donation if applicable |
| Interaction with Sec. 87(d) | Mutually exclusive by recipient type; government → 86(A)(3); private charity → 87(d) |
