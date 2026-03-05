# Gross Estate — Non-Resident Aliens (Sec. 85, NIRC)

**Aspect**: `gross-estate-nonresident`
**Wave**: 2 (TRAIN-Era Rule Extraction)
**Analyzed**: 2026-02-23
**Depends on**: `legal-source-fetch`, `form-1801-field-mapping`, `gross-estate-citizens`

---

## Legal Basis

**NIRC Section 85 (general rule — applies to all decedents):**

> "The value of the gross estate of the decedent shall be determined by including the value at the time of his death of all property, real or personal, tangible or intangible, wherever situated."

**Section 85 — NRA carve-out (second paragraph):**

> "In the case of a nonresident decedent who at the time of his death was not a citizen of the Philippines, only that part of the entire gross estate which is situated in the Philippines shall be included in his taxable estate."

**Section 85 — Reciprocity clause for intangibles:**

> "Intangible personal property [of a nonresident non-citizen] — with situs in the Philippines — shall not be included in the gross estate of such nonresident, if:
> (1) the decedent at the time of his death was a resident of a foreign country which at the time of his death did not impose a transfer tax or death tax of any character in respect of intangible personal property of citizens of the Philippines not residing in that foreign country; or
> (2) the laws of the foreign country of which the decedent was a resident, at the time of his death, allow a similar exemption from transfer taxes or death taxes of every character in respect of intangible personal property owned by citizens of the Philippines not residing in that foreign country."

**Section 84 (rate rule confirming NRA is subject to PH estate tax):**

> "…a tax at the rate of six percent (6%) based on the value of such net estate [of] every decedent, **whether resident or nonresident** of the Philippines…"

---

## Who This Rule Applies To

- **Non-resident aliens (NRAs)**: individuals who are neither citizens of the Philippines nor habitually residing in the Philippines at the time of death.
- Determined by `decedent.isNonResidentAlien == true` (user-declared input, Boolean).

**Not covered here**: Citizens and resident aliens (see aspect `gross-estate-citizens` — worldwide scope applies to them).

---

## Core Rule: Philippine-Situs Only

For NRAs, gross estate includes **only** property with **Philippine situs**. Foreign-situs property is excluded entirely.

### Situs Rules by Property Type

| Property Type | Philippine Situs? | Included in NRA Gross Estate? |
|---|---|---|
| Real property located in PH | Yes | Yes |
| Real property located outside PH | No | No |
| Tangible personal property physically in PH | Yes | Yes |
| Tangible personal property physically outside PH | No | No |
| Intangible personal property with PH situs | Conditional | See Reciprocity Rule below |
| Franchise exercised in PH | Yes | Yes (unless reciprocity) |
| Shares of stock issued by PH corporation | Yes | Yes (unless reciprocity) |
| Obligations of PH resident / PH government | Yes | Yes (unless reciprocity) |
| Bonds issued by PH domestic corporation | Yes | Yes (unless reciprocity) |
| Shares of foreign corporation (≥85% PH operations) | Yes | Yes (unless reciprocity) |

**Note**: The "≥85% PH operations" threshold for foreign corporations is a general PH tax situs principle. User declares situs; engine applies it.

---

## Reciprocity Rule for Intangible Personal Property

### Default position (no reciprocity agreement):

NRA's **Philippine-situs intangible personal property IS included** in the gross estate.

### Exemption applies when:

The NRA's country of domicile **either**:
1. Does **not** impose any death/transfer tax on intangible personal property owned by Filipino citizens not residing in that country, **OR**
2. Grants an equivalent exemption to Filipino citizens on intangible personal property.

When the exemption applies: **Philippine-situs intangible personal property is EXCLUDED** from the NRA's gross estate.

### Engine implementation:

```
// Input: user declares whether reciprocity applies
decedent.reciprocityExemptionApplies  // Boolean, user-declared

// Apply during gross estate collection:
for each asset in decedent.assets:
    if asset.propertyType == "intangible_personal":
        if decedent.isNonResidentAlien == true AND decedent.reciprocityExemptionApplies == true:
            EXCLUDE asset from gross estate
            // Do not add to any Item (29–33)
        else:
            INCLUDE asset (as part of Item 31 personal property)
```

**Engine does NOT verify reciprocity status** for the NRA's home country. The user asserts `reciprocityExemptionApplies`. The engine trusts this input.

---

## Rule (Pseudocode)

```
// Step 1: Confirm NRA status
if decedent.isNonResidentAlien == false:
    EXIT — use gross-estate-citizens rules instead

scope = PHILIPPINE_SITUS_ONLY

// Step 2: Filter assets to PH-situs only
phSitusAssets = []
for each asset in decedent.assets:
    if asset.situs == "PH":
        if asset.propertyType == "intangible_personal":
            if decedent.reciprocityExemptionApplies == true:
                SKIP  // reciprocity exemption excludes PH intangibles
            else:
                phSitusAssets.append(asset)
        else:
            // Real property and tangible personal property: include if PH situs
            phSitusAssets.append(asset)
    // Foreign-situs assets: ignored entirely

// Step 3: Categorize into Form 1801 items (same structure as citizens)
grossEstate.realProperty = sum of FMV for phSitusAssets where category == "real_property"
    and isDesignatedFamilyHome == false
    // Note: Family home deduction NOT available to NRAs (Sec. 86(A)(5) — residents only)
    // But family home's FMV is still part of realProperty if PH-situs
    // Since NRAs can't claim the deduction, no need for Schedule 1A segregation
    // Engine may still report Item 30 = 0 for NRAs

grossEstate.personalProperty = sum of FMV for phSitusAssets where category in:
    ["cash", "bank_deposit", "accounts_receivable", "notes_receivable",
     "shares_stock_listed", "shares_stock_unlisted", "bonds", "mutual_funds",
     "motor_vehicle", "jewelry", "other_tangible"]

grossEstate.taxableTransfers = sum of FMV for phSitusAssets where category in:
    ["transfer_contemplation_of_death", "revocable_transfer",
     "general_power_appointment", "life_insurance_included",
     "transfer_insufficient_consideration"]
    // Only PH-situs transfers are included

grossEstate.businessInterest = sum of max(0, netEquity) for phSitusAssets where category in:
    ["sole_proprietorship", "partnership"]
    // Only PH-registered/operated businesses

// Step 4: Ownership columns (same A/B/C structure)
// NRAs may have conjugal property under PH law if married to a Philippine citizen
// or if married before moving abroad under PH civil law rules
// User declares ownership (exclusive vs. conjugal) as for citizens
for each item in [realProperty, personalProperty, taxableTransfers, businessInterest]:
    item.exclusive = sum of assets tagged ownership = "exclusive"
    item.conjugal  = sum of assets tagged ownership = "conjugal"
    item.total     = item.exclusive + item.conjugal

// Step 5: Total gross estate (NRA)
grossEstate.total.exclusive = Item29.A + Item30.A + Item31.A + Item32.A + Item33.A
grossEstate.total.conjugal  = Item29.B + Item30.B + Item31.B + Item32.B + Item33.B
grossEstate.total.total     = grossEstate.total.exclusive + grossEstate.total.conjugal

// Item 30 (family home): report as 0 for NRAs (deduction not available anyway)
// Even if NRA has PH real property used as family home, include in Item 29
Item30 = {A: 0, B: 0, C: 0}
```

---

## Key Differences vs. Citizens/Residents

| Rule | Citizens/Residents | Non-Resident Aliens |
|---|---|---|
| Geographic scope | Worldwide | PH-situs only |
| Intangible personal property | Always included | Excluded if reciprocity applies |
| Family home deduction | Available (up to ₱10M) | NOT available |
| Standard deduction | ₱5,000,000 | ₱500,000 |
| ELIT deductions | Full amount | Proportional (PH value / worldwide value) |
| Gross estate form items | Items 29–34 (worldwide) | Items 29–34 (PH-situs only) |

---

## Situs Determination Inputs

The engine requires the user to declare the situs of each asset. The engine does NOT auto-determine situs. User provides:

| Input Field | Type | Description |
|---|---|---|
| `asset.situs` | `"PH"` or `"foreign"` | Where the asset is situated |
| `asset.propertyType` | enum | "real_property", "tangible_personal", "intangible_personal" |
| `decedent.reciprocityExemptionApplies` | Boolean | Whether the NRA's home country grants reciprocal exemption for PH intangibles |

---

## Form 1801 Mapping

The NRA uses the **same Part IV and Part V structure** as a citizen, but only PH-situs values are entered. Item 30 will be zero (family home deduction not available to NRAs).

| Gross Estate Component | Form 1801 Item | Schedule | NRA Note |
|---|---|---|---|
| Real property (excl. family home) | Item 29 | Schedule 1 | PH-situs real property only |
| Family home | Item 30 | Schedule 1A | Always 0 for NRAs |
| Personal property | Item 31 | Schedules 2 + 2A | PH-situs tangibles + intangibles (if no reciprocity) |
| Taxable transfers | Item 32 | Schedule 3 | PH-situs transfers only |
| Business interest | Item 33 | Schedule 4 | PH-registered businesses only |
| **Gross Estate Total** | **Item 34** | — | **PH-situs total only** |

**Item 34 formula** (same as citizens):
```
Item34.A = Item29.A + Item30.A + Item31.A + Item32.A + Item33.A
Item34.B = Item29.B + Item30.B + Item31.B + Item32.B + Item33.B
Item34.C = Item34.A + Item34.B
```

---

## Conditions Summary

| Condition | Value |
|---|---|
| Who qualifies | `decedent.isNonResidentAlien == true` |
| Property scope | Philippine situs only |
| Intangible personal property | Excluded if `reciprocityExemptionApplies == true` |
| Valuation date | Date of death |
| Valuation basis | FMV (user-provided, pre-valued) |
| Family home reported | Item 30 = 0 (deduction not available) |
| Business interest floor | 0 (same as citizens) |
| Ownership columns | Same A/B/C structure; user-declared |

---

## Edge Cases

1. **NRA with only intangible PH property and reciprocity applies**: Entire gross estate = 0. Tax due = 0. Engine must handle zero gross estate gracefully (not divide by zero in proportional deduction formula).

2. **Reciprocity exemption user input**: Engine trusts `reciprocityExemptionApplies`. Engine should display a warning: "You have declared reciprocity exemption applies. Verify that [decedent's country] does not impose death/transfer tax on Philippine intangible property of Filipino citizens not residing there."

3. **NRA married to a Filipino citizen**: May have conjugal property under PH law. User must classify each PH-situs asset as exclusive or conjugal. Surviving spouse's share (if PH-situs conjugal) is deducted as normal (Sec. 86C applies to NRAs through Sec. 86B exclusion structure — surviving spouse share is NOT listed in Sec. 86B but Sec. 86C states "the net share of the surviving spouse in the conjugal partnership property" which applies to all decedents with conjugal property).

4. **NRA with life insurance proceeds from PH insurer**: If beneficiary is the estate or a revocable beneficiary, the proceeds are PH-situs intangibles. Apply reciprocity rule. If beneficiary is irrevocably designated → excluded regardless.

5. **Shares of stock — PH corporation held by NRA**: PH situs. Subject to reciprocity rule (intangible personal property). If reciprocity applies → excluded. If no reciprocity → included at closing price on date of death (listed) or book value (unlisted).

6. **Real property in PH owned by NRA**: Always included in gross estate regardless of reciprocity (reciprocity only applies to intangible personal property, not real property or tangible personal property).

7. **NRA with PH mortgage (debt secured by PH real property)**: The proportional deduction for NRA (Sec. 86B) applies. Engine must compute: `(PH gross estate / total worldwide gross estate) × total ELIT deductions`. Since engine takes PH-situs inputs only from user, the user must also supply `decedent.totalWorldwideGrossEstate` for the proportional deduction formula.

8. **"Worldwide estate" input required for proportional deduction**: Even though the engine only includes PH-situs assets in the gross estate, the deduction formula for NRAs (Sec. 86B) requires the ratio `PH value / Total worldwide estate`. The engine needs an additional input: `decedent.totalWorldwideGrossEstateForDeductionPurposes`. This is a user-provided value (not computed by the engine).

9. **PH-situs real property only, zero intangibles**: Common scenario. Engine handles normally. Item 31 = 0 if no PH personal property.

10. **NRA with no PH-situs property at all**: Edge case — engine computes gross estate = 0, tax = 0. Still valid to file if required for bank or property clearance purposes.

---

## Test Implications

| # | Test Case | What to Verify |
|---|---|---|
| T1 | NRA with PH real property only (₱8M), no intangibles | Item 29 = ₱8M; Item 30 = 0; Item 31 = 0; Item 34 = ₱8M |
| T2 | NRA with PH shares of stock (₱5M), no reciprocity | Item 31 includes ₱5M (intangibles included) |
| T3 | NRA with PH shares of stock (₱5M), reciprocity applies | Item 31 = 0 (intangibles excluded); gross estate = 0 |
| T4 | NRA with foreign property (₱10M) + PH real property (₱3M) | Only ₱3M included in gross estate; foreign ₱10M ignored |
| T5 | NRA with PH family home (₱6M) | Item 29 includes ₱6M; Item 30 = 0 (no family home deduction); family home included in gross estate under real property |
| T6 | NRA with PH sole proprietorship (assets ₱4M, liabilities ₱1M) | Item 33 = max(0, ₱3M) = ₱3M |
| T7 | NRA, reciprocity applies, only asset is PH cash in bank (tangible?) | Cash in bank is intangible personal property — excluded; gross estate = 0 |
| T8 | NRA, worldwide estate ₱20M, PH estate ₱5M, ELIT deductions ₱2M | Proportional deduction = (5/20) × 2M = ₱500K (Sec. 86B — covered in aspect `nonresident-deductions`) |

---

## Notes for Developer

- The NRA gross estate uses the **same Form 1801 Items (29–34)** as citizens. The difference is in what values are entered (PH-situs FMVs vs. worldwide FMVs).
- **Item 30 = 0** for NRAs. Do not route any NRA real property to Schedule 1A. All NRA real property goes to Item 29 / Schedule 1.
- **Reciprocity is user-declared** (`decedent.reciprocityExemptionApplies`). Display a warning reminding users to verify this with their tax counsel.
- The proportional deduction formula (Sec. 86B) requires `decedent.totalWorldwideGrossEstateForDeductionPurposes` as an additional engine input for NRAs. This is covered in aspect `nonresident-deductions`.
- Engine must validate: if `decedent.isNonResidentAlien == true` and `asset.situs == "foreign"`, reject the asset with an informational message: "Foreign-situs assets are not included in the gross estate of a non-resident alien decedent."
- **Cash in bank** is classified as intangible personal property for reciprocity purposes (it is a chose in action/claim against the bank). PH bank accounts have PH situs. If reciprocity applies, PH bank accounts of an NRA are excluded.
- **Motor vehicles, jewelry, other tangibles physically in PH**: These are tangible personal property, NOT subject to the reciprocity rule. Always included if PH-situs.
