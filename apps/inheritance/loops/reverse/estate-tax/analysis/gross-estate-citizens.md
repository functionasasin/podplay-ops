# Gross Estate — Citizens and Residents (Sec. 85, NIRC)

**Aspect**: `gross-estate-citizens`
**Wave**: 2 (TRAIN-Era Rule Extraction)
**Analyzed**: 2026-02-23
**Depends on**: `legal-source-fetch`, `form-1801-field-mapping`

---

## Legal Basis

**NIRC Section 85 (as amended by TRAIN, RA 10963 — applies to deaths on/after Jan 1, 2018):**

> "The value of the gross estate of the decedent shall be determined by including the value at the time of his death of **all property, real or personal, tangible or intangible, wherever situated**."
>
> **For Nonresident Non-Citizens**: Only property **situated in the Philippines** is included. (Nonresident aliens are covered in aspect `gross-estate-nonresident`.)

**Section 85(A) — Decedent's Interest:**

> "All property to the extent of the **interest therein of the decedent** at the time of death."

**Section 88(B) — Valuation rule:**

> "Property shall be appraised at its **fair market value as of the time of death**."

---

## Who This Rule Applies To

- **Citizens of the Philippines** (resident or non-resident)
- **Resident aliens** (non-citizens living in the Philippines)

**Not covered here**: Non-resident aliens (see aspect `gross-estate-nonresident`).

**Determining citizenship/residency** is an input to the engine — the user declares it via `decedent.isNonResidentAlien` (Boolean). If `false`, this rule applies.

---

## Rule (Pseudocode)

```
// Step 1: Determine scope
if decedent.isNonResidentAlien == false:
    scope = WORLDWIDE  // all property regardless of location

// Step 2: Collect all gross estate items at FMV at date of death
grossEstate.realProperty = sum of all real property FMVs
    EXCLUDING the designated family home (reported separately in Item 30)

grossEstate.familyHome = FMV of the designated family home (if any)
    // Cap of ₱10M is applied on deduction side (Item 37B), NOT here

grossEstate.personalProperty = sum of:
    - Cash on hand
    - Cash in bank / deposits
    - Accounts receivable
    - Notes receivable
    - Shares of stock (listed: closing price at date of death)
    - Shares of stock (unlisted: book value per share)
    - Bonds and debentures
    - Mutual funds (NAV at date of death)
    - Motor vehicles
    - Jewelry
    - Other tangible personal property

grossEstate.taxableTransfers = sum of:
    - Transfers in contemplation of death (Sec. 85B)
    - Revocable transfers (Sec. 85C)
    - Property under general power of appointment (Sec. 85D)
    - Life insurance included in estate (Sec. 85E — estate/revocable beneficiary)
    - Transfers for insufficient consideration (Sec. 85G — only excess over consideration)
    // See aspect gross-estate-inclusions for full detail on each sub-type

grossEstate.businessInterest = sum of:
    - Net equity in sole proprietorships (assets − liabilities, floor at 0)
    - Net equity in partnership interests (assets − liabilities, floor at 0)

// Step 3: Compute totals for each category (3 columns: exclusive, conjugal, total)
for each item in [realProperty, familyHome, personalProperty, taxableTransfers, businessInterest]:
    item.exclusive = sum of all assets tagged ownership = "exclusive"
    item.conjugal  = sum of all assets tagged ownership = "conjugal" or "communal"
    item.total     = item.exclusive + item.conjugal

// Step 4: Total gross estate
grossEstate.total.exclusive = sum of all item.exclusive values
grossEstate.total.conjugal  = sum of all item.conjugal values
grossEstate.total.total     = grossEstate.total.exclusive + grossEstate.total.conjugal

// Step 5: Valuation rule (engine takes pre-valued FMV as input — no zonal lookup)
// For real property:
//   asset.fmv = max(asset.fmvTaxDeclaration, asset.fmvBir)
// For all other assets:
//   asset.fmv = user-provided FMV (pre-valued)
```

---

## Property Categories in Detail

### 1. Real Property (Items 29 and 30)

All real estate (land, buildings, improvements) wherever situated (PH and foreign).

**Split by type**:
- **Schedule 1**: All real property EXCEPT the designated family home → Item 29
- **Schedule 1A**: The designated family home only → Item 30

**Valuation rule for real property** (Sec. 88B):
```
asset.fmv = max(asset.fmvTaxDeclaration, asset.fmvBir)
```
Both values are provided by the user as pre-valued inputs. Engine selects the higher of the two. Engine does NOT look up zonal values.

**Ownership classification** (determines Column A vs. Column B):
- Each asset tagged as `exclusive` or `conjugal` by the user
- Rules for ownership classification are defined in the property regime aspects (`property-regime-acp`, `property-regime-cpg`, `property-regime-separation`)

### 2. Personal Property (Item 31 = Schedule 2 + 2A)

All movable property. Divided into two sub-schedules:

**Schedule 2 (Financial/Investment)**:
| Asset Type | Valuation Basis |
|---|---|
| Cash on hand | Face value |
| Cash in bank | Balance at date of death |
| Accounts receivable | Face value (if collectible) |
| Notes receivable | Face value |
| Shares of stock — listed | Closing market price on date of death |
| Shares of stock — unlisted | Book value per share |
| Bonds/debentures | FMV at date of death |
| Mutual funds | NAV at date of death |

**Schedule 2A (Tangible)**:
| Asset Type | Valuation Basis |
|---|---|
| Motor vehicles | FMV (user-provided) |
| Jewelry | FMV (user-provided) |
| Other tangibles | FMV (user-provided) |

All valuations are user-provided. Engine sums them and applies ownership tags.

### 3. Taxable Transfers (Item 32 = Schedule 3)

Transfers the law deems still part of the estate even though legal title passed during the decedent's lifetime. See aspect `gross-estate-inclusions` for full extraction of Sec. 85(B)–(G) rules.

**Summary of included types**:
| Type | Legal Basis | Included Amount |
|---|---|---|
| Transfer in contemplation of death | Sec. 85(B) | Full FMV at death |
| Revocable transfer | Sec. 85(C) | Full FMV at death |
| General power of appointment | Sec. 85(D) | Full FMV at death |
| Life insurance — estate/revocable beneficiary | Sec. 85(E) | Proceeds receivable |
| Transfer for insufficient consideration | Sec. 85(G) | FMV at death − consideration received |

**Excluded** (not in gross estate):
- Transfers made for adequate full consideration (bona fide sales)
- Life insurance with irrevocably designated beneficiary (not estate)

### 4. Business Interest (Item 33 = Schedule 4)

Decedent's equity interest in:
- Sole proprietorships
- Partnerships
- Other unincorporated business entities

**Valuation**:
```
businessInterest.netEquity = business.totalAssets − business.totalLiabilities
businessInterest.fmv = max(0, businessInterest.netEquity)
// Negative net equity is floored at 0 (cannot reduce gross estate below 0)
```
User provides `totalAssets` and `totalLiabilities` as pre-computed inputs.

**Note**: Interests in corporations are reported as shares of stock in Schedule 2, NOT here.

---

## Ownership Classification (Column A vs. Column B)

Every asset must be tagged as either **exclusive** (Column A) or **conjugal/communal** (Column B). This determines the surviving spouse's share computation (Schedule 6A). The rules depend on the applicable property regime:

| Property Regime | Assets Acquired During Marriage |
|---|---|
| ACP (default post-Aug 3, 1988) | All → Column B (conjugal/communal), except items excluded by Family Code |
| CPG (default pre-Aug 3, 1988) | Only property acquired from common effort → Column B; all else → Column A |
| Complete Separation | All → Column A (no conjugal property) |

These rules are fully detailed in aspects `property-regime-acp`, `property-regime-cpg`, and `property-regime-separation`.

**Engine input**: The user tags each asset with `ownership: "exclusive"` or `ownership: "conjugal"`. The engine does not auto-determine property regime ownership.

---

## Geographic Scope: Worldwide

For citizens and residents, ALL property is included regardless of where located:
- PH real property → included
- Foreign real property → included
- PH bank accounts → included
- Foreign bank accounts → included
- Foreign shares of stock → included
- Foreign business interests → included

**Key consequence**: A citizen who owns property in the US, Japan, or anywhere else must include those assets in the gross estate. Foreign estate taxes paid on those foreign assets may qualify for tax credit (Sec. 86D, see aspect `tax-credits`).

---

## Form 1801 Mapping

| Gross Estate Component | Form 1801 Item | Schedule | Column(s) |
|---|---|---|---|
| Real property (excl. family home) | Item 29 | Schedule 1 | A, B, C |
| Family home | Item 30 | Schedule 1A | A, B, C |
| Personal property | Item 31 | Schedules 2 + 2A | A, B, C |
| Taxable transfers | Item 32 | Schedule 3 | A, B, C |
| Business interest | Item 33 | Schedule 4 | A, B, C |
| **Gross Estate Total** | **Item 34** | — | **A, B, C** |

**Item 34 formula**:
```
Item34.A = Item29.A + Item30.A + Item31.A + Item32.A + Item33.A
Item34.B = Item29.B + Item30.B + Item31.B + Item32.B + Item33.B
Item34.C = Item34.A + Item34.B
```

All subsequent deductions and computations flow from Item 34.

---

## Conditions Summary

| Condition | Value |
|---|---|
| Who qualifies | Citizens and resident aliens (`decedent.isNonResidentAlien == false`) |
| Property scope | Worldwide (all property wherever situated) |
| Valuation date | Date of death |
| Valuation basis | FMV (user-provided, pre-valued) |
| Real property FMV rule | Higher of zonal value or assessed value (user inputs both; engine selects max) |
| Family home | Reported in Item 30 (Schedule 1A), deduction capped at ₱10M in Item 37B |
| Business interest floor | 0 (negative net equity = 0, never negative) |
| Multiple family homes | Error — only one property may be designated as family home |

---

## Edge Cases

1. **Foreign property with no FMV**: Engine requires user to provide FMV for every asset. If FMV is missing, engine should reject input for that asset.

2. **Foreign real property**: Included at user-provided FMV. The two-column valuation rule (higher of zonal vs. assessed value) applies to PH real property only. Foreign real property: user provides single FMV.

3. **Accounts receivable deemed uncollectible**: If the receivable is owed by an insolvent person, it should still be included in the gross estate (as a claim against an insolvent person). However, the uncollectible amount is then deducted as an ordinary deduction under Sec. 86(A)(1)(b) / Schedule 5B. Net effect = 0, but BOTH entries must be made.

4. **Shares of stock: listed companies with no trade on date of death**: Use the average of the highest and lowest quoted selling price on the nearest date before and after death on which there were sales.

5. **Business interest negative net equity**: Net equity of sole proprietorship < 0 → report as ₱0 in Schedule 4. Do NOT reduce other gross estate items. Do NOT carry a negative number.

6. **Multiple family homes claimed**: Engine must validate that only one property has `isDesignatedFamilyHome = true`. If multiple, reject input with error message.

7. **No surviving spouse (single/widowed)**: All assets are exclusive (Column A). Item 34.B = 0. Item 39 (surviving spouse share) = 0. Valid configuration — engine must not require conjugal property.

8. **Property co-owned with third parties (not spouse)**: Only the decedent's proportionate interest (fractional share × FMV) is included. User provides the FMV of the decedent's share as the input, not the full property value.

9. **Pre-TRAIN item: Funeral and judicial expenses**: Under TRAIN, these are NOT deductible (TRAIN removed them). They should NOT appear anywhere in the gross estate computation or deductions. If user attempts to input them, engine should display an informational message: "Funeral and judicial/administrative expenses are not deductible under TRAIN (deaths on or after Jan 1, 2018)."

10. **Usufruct rights**: If the decedent held a usufruct right (right to use and enjoy another's property), the value of the usufruct is included in the gross estate per Sec. 88(A), computed using the Basic Standard Mortality Table (outside scope — this is a valuation question; user provides FMV).

---

## Test Implications

| # | Test Case | What to Verify |
|---|---|---|
| T1 | Single Filipino citizen, 3 PH real properties | Item 29 = sum of 3 FMVs; Item 34.B = 0 |
| T2 | Married citizen under ACP, 2 conjugal properties, 1 exclusive property | Item 29.A = exclusive FMV; Item 29.B = sum of conjugal FMVs; Item 34.C = A+B |
| T3 | Citizen with foreign bank account + PH assets | Foreign account included in Schedule 2 (personal property); Item 31 includes foreign asset |
| T4 | Citizen with sole proprietorship net equity = -₱200K | Schedule 4 reports ₱0 (floor at 0), not -₱200K |
| T5 | Family home FMV = ₱15M | Item 30 = ₱15M; Item 37B = ₱10M (cap on deduction side) |
| T6 | Citizen with two properties: one ₱3M family home, one ₱2M family home | Engine error: only one family home may be designated |
| T7 | Life insurance proceeds payable to estate | Included in Item 32 (taxable transfers, Schedule 3) |
| T8 | Life insurance proceeds payable to irrevocably designated beneficiary | NOT included anywhere in gross estate |
| T9 | Real property: zonal value ₱5M, assessed value ₱3M | Engine uses ₱5M (max of the two) |
| T10 | Real property: zonal value ₱2M, assessed value ₱4M | Engine uses ₱4M (max of the two) |

---

## Notes for Developer

- **Engine does NOT determine ownership classification** (exclusive vs. conjugal). The user provides `asset.ownership` for each asset. The engine applies it.
- **Engine does NOT look up zonal values or assessed values**. For real property, the user provides both `asset.fmvBir` (zonal) and `asset.fmvTaxDeclaration` (assessed) as inputs. The engine selects `max(fmvBir, fmvTaxDeclaration)`.
- **Engine does NOT compute business net equity** from financial statements. The user provides `business.netEquity` as a single pre-computed number.
- **All foreign assets are user-provided at FMV**. No currency conversion logic is needed in the engine — user is expected to convert to PHP before inputting.
- The distinction between **Schedule 1** (real property) and **Schedule 1A** (family home) is form-structural. The computation uses the same FMV. The split is purely for BIR reporting purposes.
