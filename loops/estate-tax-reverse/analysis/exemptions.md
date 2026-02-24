# Analysis: Sec. 87 — Exempt Transfers

**Aspect**: exemptions
**Wave**: 2 (TRAIN-era, but provision unchanged by TRAIN)
**Date**: 2026-02-24
**Legal Basis**: NIRC Sec. 87 (not amended by RA 10963/TRAIN)

---

## Legal Basis

**NIRC Section 87** — Exemptions:

> "The following shall not be taxed:"
>
> **(a)** The merger of usufruct in the owner of the naked title;
>
> **(b)** The transmission or delivery of the inheritance or legacy by the fiduciary heir or legatee to the fideicommissary;
>
> **(c)** The transmission from the first heir, legatee, or donee in favor of another beneficiary, in accordance with the desire of the predecessor; and
>
> **(d)** All bequests, devises, legacies, or transfers to social welfare, cultural and charitable institutions, no part of the net income of which inures to the benefit of any individual: Provided, however, that not more than 30% of the said bequests, devises, legacies, or transfers shall be used by such institutions for administration purposes.

**Regime applicability**: TRAIN did NOT amend Sec. 87. All four exemptions apply identically across TRAIN-era, pre-TRAIN, and (by implication) estate tax amnesty regimes.

---

## Critical Distinction: Exemptions vs. Deductions

Sec. 87 exemptions are **categorically different** from Sec. 86 deductions.

| Feature | Sec. 86 Deductions | Sec. 87 Exemptions |
|---|---|---|
| **Property in gross estate?** | YES — included, then deducted | NO — excluded from computation |
| **Appears in Form 1801 schedules?** | YES (Schedules 1–6) | NO — pre-computation exclusion |
| **Takes a deduction line?** | YES (Items 35, 37) | NO |
| **Example** | Govt transfer — Sched 5F → Item 35 | Usufruct merger — not in form at all |

The NIRC language "shall not be taxed" means these transmissions are outside the estate tax computation entirely. Form 1801 (January 2018 ENCS) has no schedule or line item for Sec. 87 exemptions, confirming they are pre-computation exclusions rather than deductions.

**Key contrast with Sec. 86(A)(3)**: Government transfers (bequests to the Philippine government) ARE included in gross estate and then deducted via Schedule 5F. Private charitable transfers under Sec. 87(d) are NOT included in the gross estate computation at all.

---

## The Four Exemptions — Analysis and Engine Contract

### Exemption (a): Merger of Usufruct

**Legal concept**: A usufruct is the right to use property and enjoy its fruits, while a separate person (the naked owner) holds the title. Under Philippine law, a personal usufruct terminates upon the death of the usufructuary, at which point it "merges" back into the naked owner's full ownership.

**What is exempt**: The act of transmission/merger itself — i.e., the reconstitution of full ownership in the naked owner upon the usufructuary's death.

**Why**: Because the property does not pass to the decedent's heirs. It reverts to the naked owner by operation of law. There is no taxable estate transmission.

**Engine rule**:
```
if (asset.type == "usufruct_right" && asset.usufructType == "personal") {
  // Personal usufruct terminates at death — no transmission to heirs
  // EXCLUDE from gross estate entirely
  asset.includeInGrossEstate = false
  asset.exemptionBasis = "Sec. 87(a) — merger of usufruct"
}

if (asset.type == "usufruct_right" && asset.usufructType == "fixed_term") {
  // Fixed-term usufruct may continue after death (passes to heirs for remaining term)
  // INCLUDE in gross estate at actuarial value (Sec. 88(A))
  asset.includeInGrossEstate = true
  asset.fmv = computeUsufructActuarialValue(
    annualValue: asset.annualValue,
    remainingYears: asset.remainingTermYears,
    discountRate: lookupMortalityTable()  // Basic Standard Mortality Table (Sec. 88(A))
  )
}
```

**Naked owner perspective**: If the decedent is the NAKED OWNER (not the usufructuary), the property was already in their gross estate at its encumbered (naked-ownership) value. Upon the usufructuary's death (if that is the event triggering the merger), it is the usufructuary's estate — not the naked owner's — that benefits from Sec. 87(a). The naked owner would include the full unencumbered value in their own gross estate upon their own death.

**Sec. 88(A) interaction**: When a usufruct right IS includable (fixed-term, passes to heirs), Sec. 88(A) governs valuation:
```
// Valuation of usufruct using Basic Standard Mortality Table
// For a usufruct measured by another person's life (not already terminated):
// actuarial_value = present_value(annual_fruits, life_expectancy_of_measuring_life)
// Engine note: Sec. 88(A) valuation is complex; flag for professional appraiser
```

---

### Exemption (b): Fiduciary Heir Transmitting to Fideicommissary

**Legal concept**: A fideicommissary substitution is a testamentary disposition where the testator leaves property to a first heir (the fiduciary heir or legatee), with instructions to transmit it to a second beneficiary (the fideicommissary) upon a certain event (typically the fiduciary heir's death). The property is taxed in the original decedent's estate when received by the fiduciary heir. When the fiduciary heir dies and transmits the property to the fideicommissary, Sec. 87(b) exempts that second transmission.

**What is exempt**: The SECOND transmission — from the fiduciary heir/legatee to the fideicommissary — upon the fiduciary heir's death.

**Why**: The property was already taxed once (in the estate of the original testator). A second estate tax on the same property passing to the intended ultimate beneficiary would constitute double taxation of property already subject to the testator's testamentary scheme.

**Engine rule**:
```
if (asset.heldAsFiduciaryHeir == true && asset.fiduciaryBeneficiary != null) {
  // Property held under fideicommissary substitution
  // Transmission to fideicommissary upon decedent's death is EXEMPT under Sec. 87(b)
  // EXCLUDE from gross estate
  asset.includeInGrossEstate = false
  asset.exemptionBasis = "Sec. 87(b) — fiduciary transmission to fideicommissary"

  // Required supporting documentation:
  // - Will of original testator showing fideicommissary substitution
  // - Proof that property was received as fiduciary heir
  // - Identity of fideicommissary beneficiary
}
```

---

### Exemption (c): Transmission from First Heir to Another Beneficiary per Predecessor's Desire

**Legal concept**: This is closely related to (b) — it covers transmission made by the first heir, legatee, or donee to another beneficiary, in accordance with the wishes of the original predecessor. This broadens the fideicommissary exemption to cover testamentary substitutions where the first recipient transmits to a subsequent beneficiary as directed.

**Distinction from (b)**: Exemption (b) is the specific fideicommissary case; exemption (c) is the general case covering any similar "pass-through" transmission at the predecessor's direction (including simple substitutions and conditional bequests).

**Engine rule**:
```
if (asset.heldPerPredecessorInstructions == true) {
  // First heir transmitting property per predecessor's testamentary instructions
  // EXCLUDE from gross estate of the transmitting heir
  asset.includeInGrossEstate = false
  asset.exemptionBasis = "Sec. 87(c) — transmission per predecessor's desire"

  // Required: evidence of predecessor's instructions (will, trust deed, similar instrument)
}
```

**Practical note**: Exemptions (b) and (c) are nearly identical in engine treatment. They differ in legal framing but both result in exclusion from the transmitting decedent's gross estate. The engine can treat them as a single combined flag: `asset.passThruFiduciaryTransmission = true`.

---

### Exemption (d): Charitable Bequests to Private Social Welfare / Cultural / Charitable Institutions

**Legal concept**: Property bequeathed, devised, or transferred to qualifying private (non-government) social welfare, cultural, or charitable institutions is not subject to estate tax, provided:
1. **Income test**: No part of the net income of the institution inures to the benefit of any individual (i.e., it must be a genuine non-profit organization), AND
2. **Administration cap**: Not more than **30%** of the transferred amount shall be used by the institution for administration purposes.

**What is exempt**: The entire amount transferred to the qualifying institution.

**Critical distinction from Sec. 86(A)(3)**:
- Sec. 86(A)(3): Transfers to **Philippine government** or political subdivisions → included in gross estate → deducted via Schedule 5F
- Sec. 87(d): Transfers to **private charitable institutions** → excluded from gross estate entirely → no deduction line needed

**Engine rule**:
```
if (beneficiary.type == "charitable_institution"
    && beneficiary.sec87dQualified == true) {

  // Qualification check (user-declared):
  // □ No individual receives net income of the institution
  // □ Administration use ≤ 30% of transferred amount

  // EXCLUDE the bequeathed property from gross estate
  asset.includeInGrossEstate = false
  asset.exemptionBasis = "Sec. 87(d) — charitable bequest"

  // If the decedent owned the entire asset and bequeathed it all to charity:
  // → entire asset excluded from gross estate

  // If the decedent split the asset (part to heirs, part to charity):
  // → only the charity-allocated portion is excluded
  // → remaining portion (going to heirs) is included in gross estate
  charityExcludedValue = asset.fmv × (bequestToCharityFraction)
  heirIncludedValue = asset.fmv × (1 - bequestToCharityFraction)
}

// Validation: if sec87dQualified == true, engine should warn:
// "Verify institution is registered with SEC/BIR as non-profit and meets the
//  30% admin cost condition. This exemption requires proper documentation."
```

**Non-qualifying transfers** (Sec. 87(d) does NOT apply):
- Transfers to private for-profit entities (even if socially beneficial)
- Transfers to foreign charitable institutions
- Transfers to institutions where net income inures to any individual
- Transfers to institutions using more than 30% of the bequest for administration
- For non-qualifying private institutions, no deduction is available (unlike Sec. 86(A)(3) which is government-only)

---

## Form 1801 Mapping

**Sec. 87 exemptions have NO dedicated Form 1801 schedule or line item.** They are pre-computation exclusions — the exempt property never enters the gross estate computation.

| Exemption | Form 1801 Treatment | Explanation |
|---|---|---|
| 87(a) Usufruct merger | Not entered in any schedule | No transmission to heirs; nothing to report |
| 87(b) Fiduciary to fideicommissary | Not entered in any schedule | Pass-through exempt transmission |
| 87(c) Per predecessor's desire | Not entered in any schedule | Same as (b) |
| 87(d) Charitable bequest | NOT entered in Schedules 1–6 | Excluded from gross estate, unlike Sec. 86(A)(3) govt transfers |

**Engine output contract**:
- The engine's gross estate computation (Items 29–34) must exclude all Sec. 87 exempt assets.
- The engine should produce a **separate Sec. 87 Exclusions Summary** outside of Form 1801 proper, listing:
  - Asset description
  - FMV of excluded asset
  - Applicable exemption subsection (a/b/c/d)
  - Conditions declared by user (for 87(d))
- This summary is part of the plain-English explainer output but not a Form 1801 line item.

---

## Regime Applicability

| Regime | Sec. 87 Applies? | Notes |
|---|---|---|
| TRAIN-era (death ≥ Jan 1, 2018) | **YES** | All four exemptions apply |
| Pre-TRAIN (death < Jan 1, 2018) | **YES** | Sec. 87 was not changed by TRAIN |
| Estate Tax Amnesty (RA 11213) | **YES (implied)** | Amnesty uses "allowable deductions under the NIRC" which includes Sec. 87 framework; exempt transmissions are not part of the net estate |

**Amnesty note**: Under amnesty, Sec. 87(d) charitable bequests reduce the gross estate before computing the 6% amnesty tax, because they are never part of the taxable estate. Similarly, usufruct rights held by the decedent that terminated at death are excluded. This is consistent with the amnesty law's reference to NIRC provisions.

---

## Pseudocode — Pre-Computation Exclusion Filter

```
function applySection87Exclusions(assets: Asset[]): {
  includedAssets: Asset[],
  excludedAssets: ExcludedAsset[]
} {
  included = []
  excluded = []

  for each asset in assets:
    exemption = checkSec87Exemption(asset)
    if exemption != null:
      excluded.push({
        asset: asset,
        exemptionType: exemption,
        fmvExcluded: computeExcludedFMV(asset)
      })
    else:
      included.push(asset)

  return { includedAssets: included, excludedAssets: excluded }
}

function checkSec87Exemption(asset: Asset): string | null {
  // (a) Merger of usufruct
  if asset.type == "usufruct_right" && asset.usufructType == "personal":
    return "Sec. 87(a)"

  // (b)/(c) Fiduciary/fideicommissary transmission
  if asset.heldAsFiduciaryHeir == true || asset.heldPerPredecessorInstructions == true:
    return "Sec. 87(b)/(c)"

  // (d) Charitable bequest
  if asset.allocatedToBeneficiary != null:
    beneficiary = asset.allocatedToBeneficiary
    if beneficiary.type == "charitable_institution" && beneficiary.sec87dQualified == true:
      return "Sec. 87(d)"

  return null  // not exempt; include in gross estate
}

function computeExcludedFMV(asset: Asset): Decimal {
  if asset.allocatedToBeneficiary != null:
    // Partial bequest: only the charity-allocated fraction is excluded
    return asset.fmv × asset.allocatedToBeneficiary.fractionOfAsset
  else:
    return asset.fmv  // full asset excluded
}
```

---

## Edge Cases

1. **Partial charitable bequest**: Decedent bequeaths 40% of land to a qualifying charity and 60% to heirs. Only 40% of FMV is excluded; 60% enters gross estate. Engine must support fractional allocation.

2. **Mixed beneficiary (qualifying vs. non-qualifying charity)**: If part of a bequest goes to a Sec. 87(d)-qualified institution and part to an institution that doesn't qualify (e.g., inures income to individuals), only the qualifying portion is exempt. The non-qualifying portion enters gross estate (no deduction available — Sec. 86 does not cover private charitable transfers).

3. **30% administration condition — time of transfer vs. ongoing**: The 30% admin cap refers to use of the transferred amount, not the institution's general operating ratio. Engine should display a warning that this condition is verified by the user, not by the engine.

4. **Fixed-term usufruct (not personal)**: A usufruct set for a 10-year term does NOT merge upon the usufructuary's death — it continues and passes to heirs. Include in gross estate at actuarial value. Do NOT apply Sec. 87(a) exemption.

5. **Decedent is naked owner (not usufructuary)**: When a usufruct encumbers the decedent's property, the decedent's interest is the NAKED OWNERSHIP, not the usufruct right. Include naked ownership value in gross estate (full FMV minus actuarial value of usufruct). Sec. 87(a) does NOT apply to the naked owner's estate.

6. **Fiduciary property commingled with personal assets**: If the fiduciary heir commingled the fideicommissary property with their own, only the identifiable fideicommissary property is exempt. Engine must allow per-asset flagging.

7. **Government-affiliated charitable institution**: A GOCC or government-linked institution might qualify as both a Sec. 86(A)(3) recipient (government entity) and Sec. 87(d) institution. In practice, a pure government entity transfer uses Sec. 86(A)(3) as a deduction. Sec. 87(d) is for PRIVATE institutions. Engine should require user to specify which provision applies and warn if ambiguous.

8. **Sec. 87(d) institution later loses non-profit status**: The exemption is assessed at the time of death/transfer. If the institution subsequently loses its non-profit status, this does not retroactively eliminate the estate tax exemption.

9. **Non-resident alien decedent and charitable bequests**: If NRA decedent bequeaths PH-situs property to a qualifying PH charitable institution, Sec. 87(d) applies (no geographic restriction in Sec. 87). The property is excluded from the NRA's PH gross estate.

10. **Amnesty track with fiduciary property**: Under amnesty, if the decedent held fiduciary property, that property should be excluded from the amnesty net estate computation. The amnesty applies to the decedent's own estate; fiduciary property is not the decedent's estate.

11. **Usufruct valued but then exempted**: Engine must not include a terminated personal usufruct in gross estate. If user erroneously enters a usufruct right that terminated at death, engine should flag the Sec. 87(a) exemption and exclude it.

12. **Charitable bequest in favor of foreign institution**: A bequest to a foreign charitable institution (e.g., a US-registered charity) does NOT qualify for Sec. 87(d) exemption (the provision is interpreted as applying to PH-registered institutions). The transfer would be part of the gross estate with no deduction.

---

## Conditions and Documentation

| Exemption | User-Declared Inputs | Recommended Documentation |
|---|---|---|
| 87(a) Usufruct | `usufructType = "personal"` | Usufruct agreement showing it is personal (non-transferable) |
| 87(b)/(c) Fiduciary | `heldAsFiduciaryHeir = true` | Original testator's will showing fideicommissary substitution |
| 87(d) Charitable | `beneficiary.sec87dQualified = true` | SEC registration, BIR exemption certificate, institution's charter |
| 87(d) Admin cap | `adminCostPercent ≤ 0.30` | User-declared; engine warns to verify |

Engine takes all conditions as **user-declared inputs**. The engine does not verify institution registrations or usufruct agreements. Warnings are generated for conditions that require professional verification.

---

## Test Implications

1. **Test 87(a) basic**: Decedent held personal usufruct over sibling's house (FMV ₱2M). Gross estate should be ₱0 from this usufruct (excluded). If decedent also owned other property worth ₱8M, gross estate = ₱8M.

2. **Test 87(a) fixed-term**: Decedent held 5-year fixed-term usufruct, 3 years remaining. Include at actuarial present value in gross estate. Apply Sec. 87(a) exemption = false.

3. **Test 87(d) full bequest**: Decedent leaves ₱5M to a qualifying orphanage (Sec. 87(d)). That ₱5M is excluded from gross estate. If gross estate otherwise ₱10M, taxable gross estate = ₱10M (if ₱5M was from the ₱10M, it means the ₱5M charity portion is excluded → gross estate used for tax = ₱10M - ₱5M = ₱5M).

4. **Test 87(d) partial bequest**: Decedent bequeaths 30% of land (FMV ₱6M total) to qualifying charity → ₱1.8M excluded; ₱4.2M in gross estate.

5. **Test 87(d) non-qualifying**: Bequest to a social club that distributes surplus income to members → does NOT qualify under Sec. 87(d) → full FMV in gross estate, no deduction.

6. **Test 87(b) fiduciary**: Decedent was fiduciary heir holding ₱3M in property for fideicommissary per parent's will. Personal assets: ₱7M. Gross estate = ₱7M (fiduciary property excluded). Engine shows Sec. 87(b) exclusion summary.

7. **Test contrast Sec. 86(A)(3) vs. Sec. 87(d)**: Bequest ₱2M to City Government of Manila → included in gross estate (₱2M shows in Schedule 1/2), then deducted at Schedule 5F. Bequest ₱2M to qualifying orphanage → excluded from gross estate (₱2M never shows in Schedule 1/2).

8. **Test NRA + Sec. 87(d)**: NRA decedent with PH-situs property ₱4M, bequeathed fully to PH-registered qualified charity → PH gross estate = ₱0 (excluded). No estate tax.

9. **Test amnesty + fiduciary**: Death 2010, fiduciary property ₱5M, personal property ₱3M. Amnesty net estate computed on ₱3M only (fiduciary excluded). Amnesty tax = 6% × (3M − standard deduction).

10. **Test 87(d) admin cap breach**: User declares institution uses 40% of bequest for admin → Sec. 87(d) does NOT apply → full amount enters gross estate. Engine generates warning: "Admin cost exceeds 30% limit; exemption cannot be claimed."
