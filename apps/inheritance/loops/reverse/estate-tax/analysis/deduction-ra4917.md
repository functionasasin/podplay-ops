# Analysis: Deduction — Amounts Received Under RA 4917
## NIRC Section 86(A)(7) [TRAIN-era numbering]

**Aspect**: `deduction-ra4917`
**Wave**: 2 (TRAIN-Era Rule Extraction)
**Date Analyzed**: 2026-02-23
**Depends On**: `gross-estate-citizens`, `form-1801-field-mapping`, `deduction-standard`

---

## Legal Basis

**NIRC Section 86(A)(7)** (as amended by TRAIN Law, RA 10963):

> "Any amount received by the heirs from the decedent's employer as a consequence of the death of the decedent-employee in accordance with Republic Act No. 4917."

**Republic Act No. 4917** (enacted 1967):
*"An Act Providing That Retirement Benefits of Employees of Private Firms Shall Not be Subject to Attachment, Levy, Execution, or Any Tax Whatsoever."*

RA 4917 authorizes private employers to establish Tax Qualified Plans (TQPs) — BIR-approved private retirement benefit plans. These plans typically include a death benefit provision payable to heirs when a participating employee dies.

**Cross-reference**: NIRC Section 32(B)(6)(a) — income tax exemption for qualifying retirement benefits (the income tax conditions do not apply to the estate tax deduction; see Conditions section below).

**TRAIN change**: This provision was **NOT changed by TRAIN**. It existed identically under pre-TRAIN NIRC. The sub-section number may differ between pre-TRAIN and TRAIN-era versions due to renumbering (pre-TRAIN: 86(A)(8) in some references; TRAIN-era: 86(A)(7)).

---

## Nature of the Deduction — The "Pass-Through" Rule

The RA 4917 deduction has a **unique dual treatment**: the same amount is both **included in** and **deducted from** the gross estate. Net effect on net taxable estate = **zero**.

The deduction exists to make explicit that RA 4917 benefits, though passing through the estate, are exempt from estate tax burden. The BIR requires both entries to appear on Form 1801 for transparency and audit trail.

```
Gross estate includes: ra4917_benefit_amount
Special deductions includes: ra4917_benefit_amount (same amount)
Net contribution to net taxable estate: 0
```

---

## Rule (Pseudocode)

```
// === STEP 1: Determine eligibility ===
ra4917_eligible = (
  decedent.employmentType == PRIVATE         // RA 4917 applies to private firms only
  AND employer.hasBIRApprovedTQP == true     // Employer must have Tax Qualified Plan
  AND benefit.paidDueToDeathOfEmployee == true  // Payment must be because of death
  AND benefit.receivedByHeirs == true        // Must be paid to heirs (not estate policy)
)

// === STEP 2: Determine amount ===
// The deduction equals the actual amount received by heirs from the employer.
// There is NO monetary cap.
ra4917_deduction_amount = if ra4917_eligible
  then sum(ra4917_benefit.amountReceived for each ra4917_benefit in ra4917_benefits)
  else 0

// === STEP 3: Gross estate inclusion (required prerequisite) ===
// The amount must FIRST be included in the gross estate.
// It appears in gross estate as personal property, Column A (Exclusive).
// Include in Schedule 2 (Personal Properties).
grossEstate.personalProperty.columnA += ra4917_deduction_amount
// → feeds Item 31 (Personal Properties), Column A

// === STEP 4: Apply special deduction ===
// Same amount deducted at Item 37D / Schedule 6D.
// No A/B column split for this deduction — single amount.
specialDeductions.ra4917 = ra4917_deduction_amount
// → feeds Item 37D, contributes to Item 37 (Total Special Deductions)
```

**Order of application**: RA 4917 deduction is a special deduction (Schedule 6D / Item 37D), applied after ordinary deductions (Item 35) and alongside other special deductions (standard deduction 37A, family home 37B, medical expenses 37C). All special deductions sum to Item 37. Item 38 = max(0, Item 36 − Item 37).

---

## Conditions

### Conditions on the Employer

| Condition | Detail |
|---|---|
| Private firm | RA 4917 covers employees of **private firms only**. Government employees are covered by GSIS retirement laws (RA 8291), not RA 4917. |
| BIR-approved plan | The employer must have a **Tax Qualified Plan (TQP)** registered with and approved by the BIR (Certificate of Tax Qualification). |
| Reasonable private benefit plan | The plan must be established in good faith and maintained for the benefit of employees, not primarily for tax avoidance. |

### Conditions on the Benefit

| Condition | Detail |
|---|---|
| Paid as a consequence of death | The payment must be triggered specifically by the **death of the employee**. Post-separation severance or other benefits do not qualify. |
| Received by heirs | The beneficiaries must be the **heirs** (or estate) of the decedent-employee. |
| Included in gross estate first | The amount must appear in the gross estate declaration before it can be deducted. If not included in gross estate, deduction is disallowed. |

### Conditions NOT Required for Estate Tax Deduction

The income tax exemption under RA 4917 has additional conditions (age ≥ 50, service ≥ 10 years, one-time availment). These conditions apply to **living employees voluntarily retiring**, NOT to **death benefits**. For estate tax deduction purposes, the age and service conditions **do not apply** — the deduction is available whenever a qualifying death benefit is paid to heirs under a BIR-approved plan, regardless of the employee's age or length of service at death.

---

## Form 1801 Mapping

| Form Location | Field | Value |
|---|---|---|
| Schedule 2 (Personal Properties) | Column A (Exclusive) | `ra4917_deduction_amount` — included in gross estate |
| Item 31 (Personal Properties) | Column A total | Includes ra4917_deduction_amount |
| Schedule 6D (Special Deductions) | Amounts under RA 4917 | `ra4917_deduction_amount` |
| Item 37D | Less: Amounts under RA 4917 | `ra4917_deduction_amount` |
| Item 37 (Total Special Deductions) | Sum of 37A + 37B + 37C + 37D | Includes ra4917_deduction_amount |

**Column classification note**: The RA 4917 death benefit is classified as **Column A (Exclusive)** property when included in gross estate. The benefit arises from the decedent's employment contract — it is personal to the decedent, not jointly owned with the spouse during the marriage. Even under ACP or CPG, employer death benefits under RA 4917 are not conjugal/communal property (similar to SSS/GSIS death benefits, which are exclusive).

**No A/B column split for the deduction line** (Item 37D): The deduction is entered as a single amount without a column split (same convention as other special deductions: standard deduction, medical expenses).

---

## Regime Applicability

| Regime | Available? | Notes |
|---|---|---|
| TRAIN-era (death ≥ 2018-01-01) | Yes | NIRC Sec. 86(A)(7). No cap. |
| Pre-TRAIN (death < 2018-01-01) | Yes | Same provision pre-dated TRAIN. Sub-section may be numbered 86(A)(8) in some pre-TRAIN references. No cap. |
| Estate Tax Amnesty | Yes (if applicable at time of death) | Amnesty uses deductions applicable at time of death. Since RA 4917 existed before 2018, it's available for pre-2018 deaths under amnesty path. Conservative interpretation: flag for professional advice. |

---

## Edge Cases

### EC-1: Government Employee
**Scenario**: Decedent was a government employee receiving GSIS death benefits.
**Rule**: GSIS benefits are NOT under RA 4917. RA 4917 applies to **private firms only**. GSIS benefits have separate treatment.
**Engine behavior**: `ra4917_eligible = false`. GSIS death benefits: include in gross estate as personal property but no RA 4917 deduction. Note: GSIS benefits may have a separate exemption or treatment, but that is outside this deduction's scope.

### EC-2: No BIR-Approved Plan
**Scenario**: Employer had a private retirement plan but it was NOT registered with BIR as a Tax Qualified Plan.
**Rule**: Deduction disallowed without BIR certificate of tax qualification.
**Engine behavior**: `ra4917_eligible = false`. Amount still included in gross estate (if received), but deduction not taken. Flag for user: verify BIR TQP status.

### EC-3: Multiple Employers / Multiple Plans
**Scenario**: Decedent worked at multiple employers during career, each with a TQP. Two employers pay death benefits.
**Rule**: Each qualifying benefit from each employer is separately deductible. No interaction between them.
**Engine behavior**: Sum all qualifying `ra4917_benefit.amountReceived` from all eligible employers.

### EC-4: Benefit Received but Amount Uncertain at Filing
**Scenario**: Death occurred but RA 4917 benefit amount is still being processed by the employer at time of filing.
**Rule**: Only amounts actually received or receivable (legally determined) at time of filing can be deducted. Contingent amounts: include at FMV in gross estate; deduct same amount if plan qualifies.
**Engine behavior**: User inputs amount received. If uncertain, engine cannot compute; user defers filing or files provisional return.

### EC-5: Non-Resident Alien Decedent (PH Employer)
**Scenario**: NRA worked for a Philippine-based private employer with a BIR-approved TQP.
**Rule**: The death benefit arises from PH employment — it is PH-situs personal property. Included in NRA gross estate. RA 4917 deduction applies to citizens/residents under Sec. 86(A). NRA deductions are governed by Sec. 86(B); RA 4917 deduction is NOT listed in Sec. 86(B).
**Engine behavior**: **For NRAs, RA 4917 deduction is NOT available.** Include benefit in NRA gross estate; no corresponding deduction.

### EC-6: Benefit NOT Included in Gross Estate
**Scenario**: Estate executor omits the RA 4917 benefit from the gross estate but tries to claim the deduction.
**Rule**: Deduction only valid if amount is included in gross estate. Both entries are required.
**Engine behavior**: If `ra4917_benefit_in_gross_estate == false`, set `specialDeductions.ra4917 = 0`. Warn user.

### EC-7: Death Benefit vs. Accrued Retirement (Already Vested)
**Scenario**: Employee had already met retirement age and service requirements, had accrued a vested retirement benefit under the TQP, but died before actually retiring. The employer pays the accrued benefit to heirs.
**Rule**: Amount received by heirs from employer "as a consequence of the death" — this still qualifies as an RA 4917 death benefit. The payment trigger is death.
**Engine behavior**: `ra4917_eligible = true`. Treat as qualifying benefit.

### EC-8: Amnesty Path — Pre-2018 Death
**Scenario**: Decedent died in 2014, employer had a BIR-approved TQP, heirs received death benefit.
**Rule**: Under amnesty, deductions applicable at time of death apply. RA 4917 existed and was applicable in 2014. Deduction available.
**Engine behavior**: Include in amnesty computation. Apply same pass-through logic (include in gross estate + deduct).

### EC-9: Zero Amount (No RA 4917 Plan)
**Scenario**: Decedent had no employer or employer had no qualified plan.
**Rule**: No deduction; no gross estate inclusion for this item.
**Engine behavior**: `ra4917_deduction_amount = 0`. Item 37D = 0. Schedule 6D line blank.

---

## Test Implications

1. **Basic pass-through**: `ra4917_amount = X` → `grossEstate.personalProperty.columnA += X`; `specialDeductions.ra4917 = X`; net effect on net estate = 0.
2. **Net estate unchanged**: Verify that adding RA 4917 benefit (with proper inclusion + deduction) does not change the final estate tax due.
3. **Government employee**: `ra4917_eligible = false`; GSIS benefit included in gross estate but no deduction.
4. **No BIR-approved plan**: `ra4917_eligible = false`; amount in gross estate, no deduction.
5. **NRA exclusion**: NRA with PH employer; benefit in gross estate; no Sec. 86(B) deduction available.
6. **Multiple employers**: Sum of benefits from two qualifying plans; both included in gross estate; total deducted at Item 37D.
7. **Zero amount**: No plan; Item 37D = 0; total special deductions unchanged.
8. **Amnesty path**: Pre-2018 death; RA 4917 benefit; included in amnesty gross estate and deducted; net effect = 0 on amnesty computation.
9. **Interaction with standard deduction**: Ensure Item 37 = 37A + 37B + 37C + 37D correctly (RA 4917 does not affect standard deduction amount).

---

## Notes for Spec Synthesis

- **Net economic effect is always zero**: This deduction exists solely to ensure the RA 4917 benefit is excluded from the estate tax base. The engine must show both the gross estate inclusion and the deduction for form completeness, even though the net is always zero.
- **Input required**: User must provide: (a) amount received, (b) employer name, (c) whether employer has BIR-approved TQP (boolean). If TQP status unknown: engine defaults to `ra4917_eligible = false` and warns user.
- **Documentation**: Employer certification that the death benefit was paid under an RA 4917 qualified plan; BIR Certificate of Tax Qualification for the employer's plan.
- **NRA carve-out is important**: NRA decedents with PH employers may attempt to claim this deduction. Engine must block it — Sec. 86(B) does not include this item for NRAs.
- **No cap**: Unlike family home (₱10M cap) or medical expenses (₱500K cap), the RA 4917 deduction has no stated monetary cap. Full amount received is deductible.
