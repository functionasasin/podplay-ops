# Filing Rules — Sec. 90 (Estate Tax Return) and Sec. 91 (Payment)

**Aspect**: `filing-rules`
**Date**: 2026-02-24
**Wave**: 2 (TRAIN-era, with cross-regime differences documented)

---

## Legal Basis

**NIRC Section 90** (as amended by TRAIN Law / RA 10963):
> "The executor, or the administrator, or any of the legal heirs of the decedent shall file in all cases of transfer subject to the tax imposed by Section 84, or where though exempt from tax, the gross estate of the decedent consists of registered or registrable property (real property, motor vehicle, shares of stock, etc.) for which BIR clearance is required for transfer."

**NIRC Section 91** (Payment of Tax):
> "The estate tax imposed shall be paid at the time the return is filed."

**Pre-TRAIN Section 89** (now repealed by TRAIN):
Notice of death requirement — repealed effective January 1, 2018.

---

## Rule (Pseudocode)

```
function computeFilingInfo(decedent, regime, grossEstate):
    // 1. Filing deadline
    if regime == TRAIN:
        deadline_months = 12
    elif regime == PRE_TRAIN or regime == AMNESTY_TRACK:
        deadline_months = 6         // 6-month deadline applied at time of death
    deadline = decedent.dateOfDeath + deadline_months

    // 2. Extension (all regimes, meritorious cases only)
    max_extension_days = 30         // Commissioner discretion; not automatic

    // 3. CPA certification threshold
    if regime == TRAIN:
        cpa_threshold = 5_000_000
    elif regime == PRE_TRAIN:
        cpa_threshold = 2_000_000
    elif regime == AMNESTY_TRACK:
        cpa_threshold = null        // No CPA requirement specified in RA 11213;
                                    // BIR practice varies — flag for professional advice

    cpa_required = grossEstate > cpa_threshold

    // 4. Filing location
    if decedent.hasPhilippineDomicile:
        filing_venue = rdo_at_last_domicile_of_decedent
    else:                           // NRA or no PH legal residence
        filing_venue = "RDO No. 39, South Quezon City"

    // 5. Notice of death (pre-TRAIN only, now repealed)
    notice_of_death_required =
        regime == PRE_TRAIN and grossEstate > 20_000
        // Sec. 89 repealed by TRAIN — not applicable for TRAIN deaths

    // 6. Amnesty program status
    if regime == AMNESTY_TRACK:
        amnesty_window_closed = true    // Closed June 14, 2025
        // Engine computes historical amnesty tax only; availment no longer possible

    return FilingInfo {
        deadline: deadline,
        max_extension_days: max_extension_days,
        cpa_required: cpa_required,
        cpa_threshold: cpa_threshold,
        filing_venue: filing_venue,
        notice_of_death_required: notice_of_death_required,
    }

function computePaymentInfo(regime, estate_settled_judicially):
    // Standard: pay at time return is filed (Sec. 91(A))
    // Extensions:
    if estate_settled_judicially:
        max_extension_years = 5         // Sec. 91(B): judicial settlement
    else:
        max_extension_years = 2         // Sec. 91(B): extrajudicial settlement

    // Installment (Sec. 91(C)):
    // Within 2 years from statutory due date — no civil penalty or interest
    // Default on one installment → entire unpaid balance immediately due with penalties

    // Liability chain (Sec. 91(D)):
    // Primary: executor or administrator
    // Secondary: each beneficiary, limited to their proportionate distributive share

    // NOTE: Engine does NOT compute surcharges, interest, or penalties.
    // Engine produces base tax only (Item 44). Installment payment tracking
    // (Item 21, prior payments) is OUT OF SCOPE — filer enters prior payments
    // on the actual return.
```

---

## Conditions

### Who Must File (Sec. 90(A))

Any one of the following persons may file:
1. Executor (testate estate)
2. Administrator (intestate estate)
3. Any of the legal heirs

Filing is required in ALL cases where:
- A transfer is subject to estate tax (Sec. 84), OR
- The gross estate includes registered or registrable property (real property, motor vehicle, shares of stock, or other property requiring BIR clearance for transfer) — **even if the estate is otherwise tax-exempt**

**Engine implication**: The engine should note that even a zero-tax-due result does not eliminate the filing obligation if the estate contains registrable property.

### CPA Certification (Sec. 90(A))

| Regime | CPA Required When |
|--------|-------------------|
| TRAIN | Gross estate > ₱5,000,000 |
| Pre-TRAIN | Gross estate > ₱2,000,000 |
| Amnesty | Not specified in RA 11213 (flag for professional advice) |

The CPA-certified statement must contain: detailed listing of assets, deductions, and tax due.

### Contents of Return (Sec. 90(A))

The return must include:
1. Value of gross estate at time of death (or PH-situs gross estate for NRAs)
2. All deductions claimed from gross estate
3. Other information to establish the correct tax (schedules, supporting data)

### Filing Deadline (Sec. 90(B))

| Regime | Deadline |
|--------|---------|
| TRAIN (death ≥ Jan 1, 2018) | **1 year** from date of death |
| Pre-TRAIN (death < Jan 1, 2018) | **6 months** from date of death |
| Amnesty | Window closed June 14, 2025 (historical only) |

### Extension (Sec. 90(C))

- Commissioner may grant extension ≤ **30 days** in meritorious cases
- Not automatic; requires application
- Applies to both TRAIN and pre-TRAIN regimes
- Extension does NOT eliminate interest on late payment

### Place of Filing (Sec. 90(D))

| Scenario | Where to File |
|----------|--------------|
| Decedent had PH domicile | AAB (Authorized Agent Bank) at RDO with jurisdiction over decedent's last domicile |
| Decedent had no PH legal residence (NRA) | Revenue District Office No. 39, South Quezon City |

### Amnesty-Specific Filing Rules (RA 11213, Sec. 6)

The Amnesty path uses different forms and process:
- **Form**: Estate Tax Amnesty Return (ETAR), not BIR Form 1801
- **Acceptance Payment Form (APF)**: Secure from RDO before payment
- **Filing location**: RDO with jurisdiction over decedent's last residence
- **Certificate of Availment**: Issued within 15 calendar days of complete submission
- **Program status**: CLOSED June 14, 2025 — engine models this as a historical computation

Required documents for amnesty (in addition to ETAR):
1. Certified true copy of Death Certificate
2. Deed of Extra-Judicial Settlement or court order (if applicable)
3. Sworn Declaration of all estate properties
4. Certificate of Registration for motor vehicles
5. Latest Tax Declaration or Zonal Value of real properties
6. Bank certificates for financial assets

---

## Pre-TRAIN Differences Summary

| Item | Pre-TRAIN | TRAIN |
|------|-----------|-------|
| Filing deadline | 6 months from death | 1 year from death |
| Extension | ≤ 30 days (meritorious) | ≤ 30 days (meritorious) |
| CPA threshold | Gross estate > ₱2,000,000 | Gross estate > ₱5,000,000 |
| Notice of death | Required (Sec. 89): within 2 months of death, if estate > ₱20,000 | **NOT required** (Sec. 89 repealed by TRAIN) |
| Payment extension (judicial) | Up to 5 years | Up to 5 years |
| Payment extension (extrajudicial) | Up to 2 years | Up to 2 years |
| Filing form | BIR Form 1801 (older edition) | BIR Form 1801 (Jan 2018 edition) |

---

## Form 1801 Mapping

Filing rules are **informational** — they feed the engine's explainer output, not computed values in Part IV/V.

| Relevant Form 1801 Field | Relationship to Filing Rules |
|--------------------------|------------------------------|
| Part I: Date of Death | Determines filing deadline (6 months or 1 year) |
| Part I: RDO Code | Identifies filing venue |
| Part I: Name of Executor/Administrator | Identifies primary filer |
| Part I: Gross Estate (Item 34) | Triggers CPA certification requirement |
| Item 42: Estate Tax Due | Amount payable at time of filing |
| Item 44/20: Net Estate Tax Due | Final tax payable; payment must accompany return |

**No dedicated "filing rules" line item exists** in Form 1801. These are procedural requirements, not computational inputs.

**Engine output contract**: The engine's explainer section must include a "Filing Requirements" block containing:
- Computed filing deadline (date of death + statutory period)
- CPA certification: required/not required (with gross estate amount)
- Filing venue (RDO jurisdiction)
- Payment obligations (amount and due date)

---

## Payment Rules (Sec. 91)

### Standard Rule: Pay at Filing

Estate tax is due and payable at the time the return is filed. No separate payment deadline.

### Payment Extension (Sec. 91(B))

Meritorious cases may receive extended time to pay (note: interest accrues during extension period):
- **Judicial settlement** (estate settled through courts): up to **5 years**
- **Extrajudicial settlement**: up to **2 years**

### Installment Payment (Sec. 91(C))

- Available within **2 years** from statutory due date
- **No civil penalty and no interest** during the installment period
- **Default rule**: If any installment is missed, the entire unpaid balance becomes immediately due, with penalties applied
- Engine output: note the installment option in the explainer section; do NOT compute installment schedules (out of scope)

### Liability Chain (Sec. 91(D))

```
Primary liability:   executor or administrator
Secondary liability: each beneficiary, up to the amount of their
                     pro-rata distributive share of the estate
```

---

## Edge Cases

1. **Zero-tax estate still requires return**: If net taxable estate = ₱0, the estate still must file Form 1801 if it contains registered or registrable property (real property, shares, motor vehicles). Engine must flag this.

2. **CPA threshold straddling**: If gross estate is exactly at the threshold (₱5M for TRAIN, ₱2M for pre-TRAIN), CPA certification is NOT required (threshold is "exceeds," not "equals or exceeds"). Engine: `cpa_required = grossEstate > threshold` (strict inequality).

3. **Extension vs. payment extension**: Sec. 90(C) extension is for *filing* (≤30 days). Sec. 91(B) extension is for *payment* (up to 5 years for judicial settlement). These are independent and can be combined. Engine must distinguish clearly in explainer.

4. **NRA filing venue**: Non-resident aliens have no PH domicile → always file at RDO No. 39, South Quezon City. Engine must detect NRA status and specify this venue.

5. **Pre-TRAIN notice of death**: Notice was required under old Sec. 89 within 2 months of death if estate > ₱20,000. This is now moot for TRAIN deaths (Sec. 89 repealed). For pre-TRAIN computations, the engine should note this historical obligation in the explainer (purely informational — no computation impact).

6. **Amnesty window closed**: Filing for amnesty is no longer possible (window closed June 14, 2025). If user's inputs would qualify for amnesty, the engine must: (a) still compute the amnesty tax amount, (b) clearly note "the amnesty filing window closed June 14, 2025; this is a historical computation only."

7. **Both executor and heirs**: Multiple parties can file. Engine need not capture all filers; just note that any one qualified person may file on behalf of the estate.

8. **Partial payment / installment tracking**: Item 21 of Form 1801 ("Tax Paid in Return Previously Filed") is OUT OF SCOPE for the engine. The filer enters prior payments manually on the actual form.

9. **Estate exceeds ₱5M after deductions but CPA threshold is on gross**: CPA requirement is triggered by **gross estate** (before deductions), not net taxable estate. Even if deductions bring net estate to zero, CPA certification is still required if gross estate > threshold.

10. **Amnesty CPA requirement**: RA 11213 does not explicitly state a CPA certification threshold for the Estate Tax Amnesty Return (ETAR). BIR practice may apply similar thresholds, but the engine should flag this as requiring professional advice rather than auto-determining.

---

## Test Implications

1. **TRAIN deadline**: For date of death 2020-06-15, filing deadline = 2021-06-15 (exactly 1 year). Engine must handle day-precision date arithmetic.

2. **Pre-TRAIN deadline**: For date of death 2015-03-31, filing deadline = 2015-09-30 (exactly 6 months).

3. **CPA TRAIN threshold**: Gross estate ₱5,000,001 → CPA required. Gross estate ₱5,000,000 → NOT required.

4. **CPA pre-TRAIN threshold**: Gross estate ₱2,000,001 → CPA required. Gross estate ₱2,000,000 → NOT required.

5. **NRA venue**: Decedent was NRA → filing venue = "RDO No. 39, South Quezon City" (regardless of PH asset location).

6. **Zero-tax with registrable property**: Net estate = ₱0, but estate includes real property → engine flags filing obligation.

7. **Amnesty closed-window flag**: Date of death 2010-01-01, amnesty path selected → engine computes amnesty tax AND displays "amnesty window closed June 14, 2025; historical computation only."

8. **Installment explainer**: Any tax-due result → engine notes 2-year installment option with zero interest in the explainer section.

9. **Payment extension**: Judicial settlement → engine notes up to 5-year payment extension available (with interest); extrajudicial → up to 2 years.

10. **CPA on gross, not net**: Gross estate ₱6M, net taxable estate ₱0 (deductions exceed gross estate) → CPA certification still required; engine flags this in explainer.
