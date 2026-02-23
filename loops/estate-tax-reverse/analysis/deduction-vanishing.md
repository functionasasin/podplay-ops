# Deduction: Property Previously Taxed (Vanishing Deduction)
## NIRC Sec. 86(A)(2) — Ordinary Deductions (Citizens, Residents, and Non-Resident Aliens)

**Aspect**: deduction-vanishing
**Wave**: 2 (TRAIN-era rule extraction)
**Analyzed**: 2026-02-23
**Source**: `input/legal-sources/nirc-title-iii.md`, Sec. 86(A)(2); `input/legal-sources/commentary-samples.md`, Sample 7

---

## Legal Basis

**NIRC Section 86(A)(2)** (TRAIN-era, as amended by RA 10963; percentage table and formula unchanged by TRAIN):

> "Property Previously Taxed — An amount equal to the value specified below of any property forming part of the gross estate situated in the Philippines of any person who died within five (5) years prior to the death of the decedent, or transferred to the decedent by gift within five (5) years prior to his death, where such property can be identified as having been received by the decedent from the donor or the prior decedent, where the estate tax or donor's tax on such prior transfer has been finally determined and paid by or on behalf of such donor or the estate of such prior decedent."

**Also known as**: "Vanishing Deduction" (PH tax practice informal name), "Property Previously Taxed" (formal statutory name).

**TRAIN Change**: None. The percentage table and the vanishing deduction formula were NOT changed by TRAIN. The deduction is available under all three regimes (TRAIN, pre-TRAIN, and Estate Tax Amnesty), subject to the same rules.

**NRA Application (Sec. 86(B))**: Non-resident aliens may also claim the vanishing deduction, but only for Philippine-situated property that was previously taxed.

**Form 1801 mapping**: Schedule 5, Line 5E (Property Previously Taxed); feeds Item 35 (Total Ordinary Deductions). Columns A (exclusive) and B (conjugal/communal).

---

## Eligibility Conditions (ALL must be satisfied)

For each property item claimed as a vanishing deduction:

1. **Within 5-year window**: The property was transferred to the current decedent either:
   - By inheritance from a prior decedent who died **within 5 years** of the current decedent's date of death; OR
   - By gift (inter vivos donation) **within 5 years** of the current decedent's date of death.

2. **Prior tax was paid**: The estate tax (if inherited) or donor's tax (if received as a gift) on the prior transfer was **finally determined and paid**. Unpaid or disputed prior taxes disqualify the deduction.

3. **Property is identifiable**: The specific property must be traceable as having been received from the prior decedent or donor. Commingled cash that cannot be identified as the specific prior transfer does not qualify.

4. **Property is in current gross estate**: The property must be included in the current decedent's gross estate (it was not subsequently sold, donated, or transferred before the current decedent's death). Only property still forming part of the gross estate at the time of the current decedent's death qualifies.

5. **Situs (NRA only)**: For non-resident alien decedents, the property must be situated in the Philippines.

---

## Percentage Table (Time Since Prior Transfer → Current Decedent's Death)

| Years Elapsed (from prior transfer date to current decedent's date of death) | Deductible Percentage |
|---|---|
| ≤ 1 year | 100% (1.00) |
| > 1 year and ≤ 2 years | 80% (0.80) |
| > 2 years and ≤ 3 years | 60% (0.60) |
| > 3 years and ≤ 4 years | 40% (0.40) |
| > 4 years and ≤ 5 years | 20% (0.20) |
| > 5 years | 0% (disqualified; no deduction) |

**Elapsed time measurement**: From the **prior transfer date** (prior decedent's date of death, or donation date) to the **current decedent's date of death**. Use calendar years (or fraction thereof). Boundary cases: exactly 1 year = ≤ 1 year = 100%. Exactly 2 years = > 1 year and ≤ 2 years = 80%. Etc.

---

## The Vanishing Deduction Formula

### Step-by-Step Computation

**Given (per previously-taxed property item)**:
- `prior_fmv` — FMV of the property at the time of the prior transfer (at prior decedent's death, or at gift date)
- `current_fmv` — FMV of the property at the **current decedent's date of death**
- `mortgage_on_property` — Outstanding unpaid mortgage or lien specifically on this property (as of current decedent's date of death). This mortgage must also appear in Schedule 5C (ELIT) as an unpaid mortgage. If no mortgage, this is 0.
- `elapsed_years` — Years from prior transfer date to current decedent's date of death
- `gross_estate_total` — Total gross estate (Item 34, Column C)
- `elit_total` — Total ELIT deductions (5A + 5B + 5C + 5D) already computed; does NOT include VD itself or Public Use Transfers

**Formula**:

```
// Step 1: Initial Value
iv = min(prior_fmv, current_fmv)
// Use the LOWER value. If the property appreciated, only the prior (lower) value is allowed.
// If the property depreciated, only the current (lower) value is allowed.

// Step 2: Net Value (deduct mortgage specifically encumbering this property)
nv = iv - mortgage_on_property
nv = max(0, nv)  // cannot be negative

// Step 3: Compute adjustment ratio
// This ratio prevents the vanishing deduction from "double-counting" with other
// ordinary deductions already taken. The idea: as ELIT deductions absorb more of
// the estate, the VD should be proportionally reduced.
if gross_estate_total == 0:
  ratio = 0
else:
  ratio = (gross_estate_total - elit_total) / gross_estate_total
  ratio = max(0, ratio)   // ratio floored at 0 if ELIT > gross estate

// Step 4: Determine applicable percentage
elapsed_years = (current_decedent_date_of_death - prior_transfer_date) in fractional years
if elapsed_years <= 1:
  pct = 1.00
elif elapsed_years <= 2:
  pct = 0.80
elif elapsed_years <= 3:
  pct = 0.60
elif elapsed_years <= 4:
  pct = 0.40
elif elapsed_years <= 5:
  pct = 0.20
else:
  pct = 0.00  // disqualified (> 5 years); do not include this property in VD

// Step 5: Vanishing Deduction for this property
vd_item = pct × nv × ratio
vd_item = max(0, vd_item)
```

### Multiple Previously-Taxed Properties

When there are multiple previously-taxed properties, compute VD for each item separately, then sum. The `elit_total` used in Step 3 is the **same** shared ELIT total for all VD items (the ratio is computed once against the aggregate estate).

```
function computeVanishingDeduction(properties, gross_estate_total, elit_total):
  total_exclusive = 0
  total_conjugal  = 0

  for each property in properties:
    // Eligibility check
    elapsed_years = yearsBetween(property.prior_transfer_date, decedent.date_of_death)
    if elapsed_years > 5:
      continue  // no deduction; skip this property
    if not property.prior_tax_was_paid:
      continue  // disqualified; prior estate/donor's tax unpaid

    // Step 1: Initial Value
    iv = min(property.prior_fmv, property.current_fmv)

    // Step 2: Net Value
    nv = max(0, iv - property.mortgage_on_property)

    // Step 3: Adjustment ratio (computed once, shared across all VD items)
    if gross_estate_total == 0:
      ratio = 0
    else:
      ratio = max(0, (gross_estate_total - elit_total) / gross_estate_total)

    // Step 4: Percentage
    if elapsed_years <= 1:
      pct = 1.00
    elif elapsed_years <= 2:
      pct = 0.80
    elif elapsed_years <= 3:
      pct = 0.60
    elif elapsed_years <= 4:
      pct = 0.40
    else:  // <= 5
      pct = 0.20

    // Step 5: Item VD
    vd_item = max(0, pct × nv × ratio)

    // Accumulate by ownership
    if property.ownership == "exclusive":
      total_exclusive += vd_item
    elif property.ownership == "conjugal":
      total_conjugal += vd_item

  return {
    exclusive: total_exclusive,
    conjugal:  total_conjugal,
    total:     total_exclusive + total_conjugal
  }

// Schedule 5E, Columns A and B:
deductions.vanishingDeduction = computeVanishingDeduction(
  input.previouslyTaxedProperties,
  grossEstate.total.total,   // Item 34 Column C
  deductions.elitTotal.total  // Schedule 5A+5B+5C+5D Column C total
)
```

---

## Input Data Model (Per Previously-Taxed Property)

```
PreviouslyTaxedProperty {
  description:           string      // e.g., "House and lot at 123 Main St"
  prior_transfer_type:   "inheritance" | "gift"  // how decedent received it
  prior_transfer_date:   date        // prior decedent's date of death, or donation date
  prior_fmv:             number      // FMV at time of prior transfer (from prior estate return or BIR-assessed gift value)
  current_fmv:           number      // FMV at current decedent's date of death (user-provided)
  mortgage_on_property:  number      // outstanding unpaid mortgage specifically on THIS property (0 if none)
  prior_tax_was_paid:    boolean     // estate or donor's tax was finally determined and paid
  ownership:             "exclusive" | "conjugal"  // how current decedent held this property
}
```

---

## Illustrated Examples

### Example A — 100% (within 1 year, no mortgage, no other ELIT)

**Facts**: GE = ₱10,000,000; inherited property: prior FMV = ₱3,000,000, current FMV = ₱3,200,000; elapsed 6 months; no mortgage; no ELIT deductions.

```
iv = min(3,000,000, 3,200,000) = 3,000,000
nv = 3,000,000 - 0 = 3,000,000
ratio = (10,000,000 - 0) / 10,000,000 = 1.00
pct = 1.00 (≤ 1 year)
VD = 1.00 × 3,000,000 × 1.00 = 3,000,000
```

(Validated against commentary Sample 7.)

---

### Example B — 80% (18 months, with mortgage and other ELIT)

**Facts**: GE = ₱15,000,000; inherited property: prior FMV = ₱4,000,000, current FMV = ₱5,000,000; elapsed 18 months; mortgage on property = ₱500,000 (also in ELIT 5C); other claims against estate = ₱300,000; total ELIT = ₱800,000.

```
iv = min(4,000,000, 5,000,000) = 4,000,000
nv = 4,000,000 - 500,000 = 3,500,000
ratio = (15,000,000 - 800,000) / 15,000,000 = 14,200,000 / 15,000,000 = 0.9467
pct = 0.80 (> 1 year and ≤ 2 years)
VD = 0.80 × 3,500,000 × 0.9467 = 0.80 × 3,313,333 = 2,650,667
```

---

### Example C — 20% (5 years exactly, no mortgage, with ELIT)

**Facts**: GE = ₱8,000,000; received by gift: gift FMV = ₱2,500,000, current FMV = ₱2,000,000; elapsed exactly 5 years (donor transferred on same calendar date 5 years ago); ELIT = ₱500,000; no mortgage.

```
iv = min(2,500,000, 2,000,000) = 2,000,000  // current death value is lower
nv = 2,000,000 - 0 = 2,000,000
ratio = (8,000,000 - 500,000) / 8,000,000 = 7,500,000 / 8,000,000 = 0.9375
pct = 0.20 (> 4 years, ≤ 5 years)
VD = 0.20 × 2,000,000 × 0.9375 = 375,000
```

---

### Example D — Disqualified (> 5 years)

**Facts**: Prior decedent died 5 years and 1 day before current decedent. Elapsed > 5 years.

```
pct = 0.00 (disqualified)
VD = 0
```

Property is excluded from VD computation entirely. (Engine: log a note "Property [X] disqualified from vanishing deduction: elapsed time > 5 years.")

---

## Form 1801 Mapping

| Schedule Line | Description | Engine Field | Column Structure |
|---|---|---|---|
| **5E** | Property Previously Taxed (Vanishing Deduction) | `deductions.vanishingDeduction` | Column A (exclusive) + Column B (conjugal) |
| Item 35 (5H) | Total Ordinary Deductions | includes vanishing deduction | Columns A + B + C |

**Computation sequence** (the order in which computations must occur):
1. Compute gross estate (Items 29–34) — needed for `gross_estate_total`
2. Compute ELIT (Schedule 5, Lines 5A–5D) — needed for `elit_total` (ratio denominator)
3. **Compute Vanishing Deduction (Schedule 5E)** — uses outputs from steps 1 and 2
4. Compute Transfers for Public Use (Schedule 5F) — parallel to step 3
5. Sum all ordinary deductions → Item 35 (includes 5A–5G)

---

## TRAIN vs. Pre-TRAIN vs. Amnesty: Regime Differences for VD

The vanishing deduction formula (Steps 1–5) is **identical** across all three regimes. However, the `elit_total` used in the adjustment ratio differs because pre-TRAIN ELIT includes funeral and judicial expenses:

| Regime | `elit_total` for VD Ratio |
|---|---|
| TRAIN (death ≥ 2018-01-01) | 5A + 5B + 5C + 5D (no funeral, no judicial) |
| Pre-TRAIN (death < 2018-01-01) | 5A + 5B + 5C + 5D + funeral + judicial/admin |
| Amnesty (RA 11213/11569) | VD is **NOT available** under amnesty; amnesty computation uses a simplified deduction set (standard deduction + surviving spouse share only). |

**Amnesty Note**: Under RA 11213/11569, the amnesty computation does not allow the full set of deductions. The vanishing deduction is not available for the amnesty path. If an estate uses the amnesty path, `VD = 0`. (See `analysis/amnesty-computation.md` for the amnesty deduction rules.)

---

## Conditions Summary

| Condition | Rule | Validation |
|---|---|---|
| Within 5-year window | Prior transfer date to current death ≤ 5 years | Compare dates; compute elapsed years |
| Prior tax paid | Estate or donor's tax was finally determined and paid | User-affirmed boolean |
| Property identifiable | Can trace specific property to prior transfer | User-affirmed; engine accepts user declaration |
| Property in current gross estate | Must also appear in Schedule 1/2/3/4 | Cross-reference: `property.current_fmv > 0` and included in gross estate |
| NRA situs | For NRAs: only PH-situs property qualifies | Filter: `property.isPhilippineSitus == true` (for NRA estates) |

---

## Edge Cases

1. **Property appreciated in value**: Prior FMV = ₱3M; current FMV = ₱5M. Use the **lower** (prior) value: IV = ₱3M. The estate tax is not inflated by the appreciation.

2. **Property depreciated in value**: Prior FMV = ₱5M; current FMV = ₱2M. Use the **lower** (current) value: IV = ₱2M. The deduction cannot exceed the current estate value of the property.

3. **No prior tax paid (disputed or pending)**: The prior estate or donor's tax was NOT finally determined and paid. The property is **disqualified entirely** from vanishing deduction. Engine: `if not property.prior_tax_was_paid: skip (VD = 0 for this property)`.

4. **Property partly sold before current decedent's death**: If the inherited/gifted property was partially disposed of (e.g., inherited 1,000 sqm but only 600 sqm remains in estate at death), only the **remaining portion** qualifies. Engine: `current_fmv` represents only the remaining portion; user must provide the current FMV of only the remaining part.

5. **Mortgage exceeds initial value**: In theory, if `mortgage_on_property > iv`, then `nv < 0` → floor at 0. VD = 0 for this property. (Highly unlikely in practice but must be handled.)

6. **ELIT exceeds gross estate (ratio ≤ 0)**: If ELIT deductions exceed gross estate, `ratio = (GE - ELIT) / GE < 0` → floor at 0. VD = 0. The ordinary ELIT deductions have already absorbed the entire estate; vanishing deduction adds nothing further.

7. **Property received by gift (donor's tax context)**: `prior_fmv` = FMV declared in the donor's tax return (gift date value). `prior_transfer_date` = date of donation. Otherwise, the same formula applies.

8. **Conjugal property previously taxed**: If the inherited/gifted property entered the conjugal pool (e.g., decedent inherited it during marriage and it became conjugal under ACP), `ownership = "conjugal"`. The VD amount goes in Column B. The `current_fmv` should be the FULL conjugal FMV of the property (not halved — the halving happens in Schedule 6A for the spouse share computation, not here).

9. **Multiple previously-taxed properties with different percentages**: Compute each property's VD separately using its own elapsed time and percentage. Sum them in Columns A and B. The ratio denominator (`elit_total`) is the shared aggregate ELIT, not per-property.

10. **Property transferred more than once in 5-year window**: e.g., A → B (3 years ago), then B → current decedent (2 years ago). Only the **most recent** prior transfer is relevant. Elapsed time = time from B's death to current decedent's death. `prior_fmv` = FMV at B's death. (The chain of prior transfers does not compound.)

11. **NRA: reciprocity exemption and VD interaction**: If a non-resident alien's intangible personal property was excluded from gross estate under the reciprocity rule (Sec. 85, NRA), that excluded property cannot be claimed for VD (property not in gross estate). Only PH-situs property included in the gross estate qualifies.

12. **Vanishing deduction for amnesty path**: Do NOT apply VD for estates using the amnesty computation. Amnesty has its own simplified net estate formula that does not include VD.

---

## Test Implications

1. **100% VD, no mortgage, no ELIT**: Elapsed ≤ 1 year, no debts. VD = 100% × min(prior, current). Ratio = 1.0. Validates basic formula.

2. **80% VD with ELIT**: Elapsed 18 months. ELIT > 0. VD = 80% × NV × ratio. Ratio < 1.0. Validates ratio adjustment.

3. **Depreciated property**: Current FMV < prior FMV. IV = current FMV (lower). VD uses current, not prior.

4. **Appreciated property**: Prior FMV < current FMV. IV = prior FMV (lower). VD uses prior.

5. **VD disqualified (> 5 years)**: Prior death > 5 years before current death. VD = 0. Item 5E = 0.

6. **Prior tax not paid**: `prior_tax_was_paid = false`. VD = 0 regardless of elapsed time.

7. **Mortgage on property reduces NV**: mortgage_on_property = ₱500K. NV = IV − 500K. VD is lower than without mortgage.

8. **Multiple VD items, mixed percentages**: Two properties: one at 100%, one at 60%. Compute separately, sum into Column A/B totals.

9. **ELIT > GE (ratio = 0)**: ELIT deductions exceed gross estate. Ratio = 0. VD = 0. Item 36 = 0, Item 5E = 0.

10. **Conjugal VD**: Inherited property became conjugal. VD enters Column B. Accumulates with other conjugal deductions.

11. **Amnesty path**: Estate uses amnesty computation. VD = 0 (not available under amnesty). Engine conditionally excludes VD from amnesty path computation.

12. **NRA estate, PH-situs property VD**: NRA decedent with previously-taxed Philippine real property. VD is allowable (PH-situs property qualifies). Uses same formula; Column B (if conjugal) or A (if exclusive).
