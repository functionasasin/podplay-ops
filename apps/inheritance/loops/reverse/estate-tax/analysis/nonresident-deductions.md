# Deductions — Non-Resident Aliens (Sec. 86(B), (C), (D))
## NIRC Sec. 86(B): NRA Deduction Package + Proportional ELIT Formula

**Aspect**: `nonresident-deductions`
**Wave**: 2 (TRAIN-Era Rule Extraction)
**Analyzed**: 2026-02-24
**Depends on**: `legal-source-fetch`, `form-1801-field-mapping`, `gross-estate-nonresident`, `deduction-elit`, `deduction-standard`, `deduction-vanishing`, `deduction-public-transfers`, `surviving-spouse-share`

---

## Legal Basis

**NIRC Section 86(B)** — Non-Resident Non-Citizens:

> "For the purpose of the tax imposed in Section 84, the value of the net estate of a nonresident of the Philippines not a citizen thereof shall be determined by deducting from the value of that part of his gross estate which at the time of his death is situated in the Philippines:
>
> (1) Standard Deduction: ₱500,000
>
> (2) That proportion of the deductions specified in paragraphs (1) and (3) of Subsection (A) of this Section which the value of such part bears to the value of his entire gross estate wherever situated:
>
>   [ELIT proportional deduction formula]
>
> (3) Property previously taxed, as specified in paragraph (2) of Subsection (A) of this Section, provided such prior transfers are situated in the Philippines.
>
> (4) Transfers for public use, as specified in paragraph (3) of Subsection (A) of this Section, provided such transfers are to the Philippine government or its political subdivisions."

**NIRC Section 86(C)** — Share of Surviving Spouse:

> "The net share of the surviving spouse in the conjugal partnership property as diminished by the obligations properly chargeable to such property shall, for the purpose of this Section, be deducted from the net estate of the decedent."

*Applies to all decedents (citizen, resident, NRA) who have conjugal/community property.*

**NIRC Section 86(D)** — Foreign Tax Credit:

> "A credit for estate taxes paid to foreign countries shall be allowed to citizens and residents of the Philippines only."

*Explicitly limited to citizens and residents — NOT available to NRAs.*

---

## Complete NRA Deduction Availability Matrix

This matrix summarizes every possible deduction for all decedents and flags NRA status. This is the authoritative NRA-vs-citizen comparison.

| Deduction | Legal Basis | Citizens/Residents | Non-Resident Aliens | Notes |
|-----------|-------------|-------------------|--------------------:|-------|
| Standard deduction | Sec. 86(A)(4) / 86(B)(1) | ₱5,000,000 | **₱500,000** | Different cap; see `deduction-standard` |
| ELIT — claims against estate | Sec. 86(A)(1)(a) / 86(B)(2) | Full amount | **Proportional only** | Core focus of this aspect |
| ELIT — insolvent persons | Sec. 86(A)(1)(b) / 86(B)(2) | Full amount | **Proportional only** | Core focus of this aspect |
| ELIT — unpaid mortgages | Sec. 86(A)(1)(c) / 86(B)(2) | Full amount | **Proportional only** | Core focus of this aspect |
| ELIT — casualty losses | Sec. 86(A)(1)(e) / 86(B)(2) | Full amount | **Proportional only** | Core focus of this aspect |
| Vanishing deduction | Sec. 86(A)(2) / 86(B)(3) | Full formula | **PH-situs property only** | Same formula; see `deduction-vanishing` |
| Transfers for public use | Sec. 86(A)(3) / 86(B)(4) | Full amount | **PH government only** | Same rule; see `deduction-public-transfers` |
| Family home | Sec. 86(A)(5) | Up to ₱10M | **NOT AVAILABLE** | Citizens/residents only |
| Medical expenses | Sec. 86(A)(6) | Up to ₱500K | **NOT AVAILABLE** | Not in Sec. 86(B) |
| RA 4917 death benefits | Sec. 86(A)(7) | Full amount | **NOT AVAILABLE** | Not in Sec. 86(B) |
| Surviving spouse share | Sec. 86(C) | Full conjugal share | **PH-situs conjugal only** | See `surviving-spouse-share` |
| Foreign estate tax credit | Sec. 86(D) | Available | **NOT AVAILABLE** | Explicitly limited to citizens/residents |

**Summary**: NRAs have a stripped-down deduction package — standard deduction (smaller amount), proportional ELIT, vanishing deduction (PH-situs), public transfers (PH government), and surviving spouse share (PH-situs conjugal). Six categories are unavailable.

---

## Core Rule: Proportional ELIT Deduction

### Formula

For NRAs, ELIT deductions are NOT fully deductible. Only the proportionate share corresponding to the Philippine gross estate is deductible:

```
proportional_factor = PH_gross_estate / total_worldwide_gross_estate

NRA_ELIT_deduction = proportional_factor × total_worldwide_ELIT
```

Where:
- **`PH_gross_estate`** = Item 34.C — total Philippine-situs gross estate (computed by engine from user-provided PH assets)
- **`total_worldwide_gross_estate`** = `decedent.totalWorldwideGrossEstate` — user-provided; includes PH assets + all foreign assets
- **`total_worldwide_ELIT`** = `decedent.totalWorldwideELIT` — user-provided; total of all ELIT obligations worldwide (not limited to PH-related debts)

### Required Additional Inputs for NRA

The engine requires two additional inputs that are not needed for citizen/resident decedents:

| Input Field | Type | Description | Required? |
|-------------|------|-------------|-----------|
| `decedent.totalWorldwideGrossEstate` | Decimal ≥ 0 | Total gross estate worldwide (PH + foreign) at FMV | **Required if NRA has any ELIT** |
| `decedent.totalWorldwideELIT` | Object | Total ELIT per sub-category (worldwide) | **Required if NRA has any ELIT** |

**`decedent.totalWorldwideELIT` sub-fields**:
```
{
  claimsAgainstEstate: Decimal ≥ 0,    // 5A worldwide
  claimsVsInsolvent:   Decimal ≥ 0,    // 5B worldwide
  unpaidMortgages:     Decimal ≥ 0,    // 5C worldwide
  casualtyLosses:      Decimal ≥ 0     // 5D worldwide
  // Note: Funeral and judicial/admin expenses excluded from TRAIN ELIT
}
```

**Why worldwide totals are needed**: The proportional formula requires worldwide ELIT in the numerator to compute what fraction of total worldwide ELIT is allocable to the PH estate. If only PH-situs ELIT were used, the denominator ratio would not properly capture the full economic burden.

**Engine caveat (not a computation)**: The user asserts worldwide ELIT and worldwide gross estate. The engine trusts these inputs. It does NOT independently verify foreign asset values or foreign obligations.

### Pseudocode

```
// Proportional ELIT deduction for NRAs
// Sec. 86(B)(2): applies to paragraphs (1) and (3) of Sec. 86(A)
// — i.e., ELIT sub-items 5A through 5D

function computeNRA_ELIT(decedent, grossEstate):

  // Validate NRA status
  assert decedent.isNonResidentAlien == true

  // Step 1: Compute proportional factor
  // PH_gross_estate = Item 34.C (already computed from NRA gross estate rules)
  PH_gross_estate = grossEstate.total.total   // Item 34.C

  if decedent.totalWorldwideGrossEstate == 0:
    // Edge case: worldwide estate is zero (or user omitted)
    // PH estate must also be zero (validated separately)
    proportional_factor = 0.0
  else:
    proportional_factor = PH_gross_estate / decedent.totalWorldwideGrossEstate

  // Step 2: Apply proportional factor per ELIT sub-item
  // TRAIN: No funeral expenses, no judicial/admin expenses
  W = decedent.totalWorldwideELIT  // worldwide ELIT object

  prorated_5A = proportional_factor × W.claimsAgainstEstate
  prorated_5B = proportional_factor × W.claimsVsInsolvent
  prorated_5C = proportional_factor × W.unpaidMortgages
  prorated_5D = proportional_factor × W.casualtyLosses

  // Step 3: Determine column (A/B) for each prorated item
  // For NRAs, the conjugal/exclusive split WITHIN the proportional ELIT:
  // User must also declare what proportion of worldwide ELIT relates to
  // conjugal vs. exclusive PH property. Engine recommendation:
  //   - For simplicity, apply same proportional factor to each sub-item
  //     and let user tag resulting amounts as exclusive/conjugal
  //   - OR: require user to provide worldwide ELIT split by ownership type

  // Simplest implementation (recommended):
  // User provides worldwide ELIT per sub-item + ownership flag per item
  // Engine applies proportional factor, then applies ownership flag
  // (ownership split follows same rules as for citizens — see deduction-elit)

  // Step 4: Total NRA ELIT (Schedule 5 aggregate)
  total_NRA_ELIT = prorated_5A + prorated_5B + prorated_5C + prorated_5D

  // Step 5: Validation
  // Sanity check: PH gross estate ≤ worldwide gross estate
  if PH_gross_estate > decedent.totalWorldwideGrossEstate:
    RAISE ERROR: "Philippine gross estate (₱X) exceeds declared worldwide gross estate (₱Y). Verify worldwide estate input."

  // proportional_factor must be between 0 and 1
  assert 0.0 ≤ proportional_factor ≤ 1.0

  return {
    proportional_factor: proportional_factor,
    claimsAgainstEstate: prorated_5A,    // Schedule 5A (proportional)
    claimsVsInsolvent:   prorated_5B,    // Schedule 5B (proportional)
    unpaidMortgages:     prorated_5C,    // Schedule 5C (proportional)
    casualtyLosses:      prorated_5D,    // Schedule 5D (proportional)
    total:               total_NRA_ELIT  // Feeds Item 35
  }
```

### What "Proportional" Means in Practice

**Example**: NRA decedent with total worldwide estate ₱20M (₱5M in PH + ₱15M in USA). Total worldwide debts = ₱2M (₱500K mortgage on PH property + ₱1.5M mortgage on US property).

```
proportional_factor = ₱5M / ₱20M = 0.25 (25%)
NRA_ELIT_deduction = 0.25 × ₱2M = ₱500,000

Note: Even though ₱500K of debts directly relate to PH property,
      the formula gives the same ₱500K in this example.
      But if PH debts were ₱1M and foreign debts were ₱1M:
      NRA_ELIT_deduction = 0.25 × ₱2M = ₱500K (not ₱1M for PH-specific debts)
      — the formula ignores which debts are "PH-related"; it prorates all.
```

**Key insight**: The proportional formula may give a different result from simply deducting PH-situs debts directly. The formula always allocates a fraction of *all* worldwide ELIT, not just the PH-related portion.

---

## Vanishing Deduction for NRAs (Sec. 86(B)(3))

### Rule

The vanishing deduction applies to NRAs under the **same formula** as for citizens (see `analysis/deduction-vanishing.md`), with one restriction:

**The prior property must be situated in the Philippines.**

```
// Same 5-step formula from deduction-vanishing.md
// Additional condition:
assert prior_property.situs == "PH"
assert current_property.situs == "PH"

// If prior property was foreign-situs → vanishing deduction NOT available
// Even if prior decedent paid PH estate tax on worldwide estate, only PH-situs
// property qualifies for NRA vanishing deduction
```

### What Does NOT Change

- Percentage table (100%/80%/60%/40%/20%) — same as citizens
- 5-year window — same as citizens
- Initial Value formula (min of prior FMV, current FMV) — same as citizens
- Ratio formula using ELIT — same as citizens
- Form 1801 mapping (Schedule 5E) — same as citizens

### What DOES Change

- Only PH-situs property qualifies
- The ELIT used in the vanishing deduction ratio (`(GE − ELIT) / GE`) should use the **proportional NRA ELIT** (computed above), not the worldwide ELIT

```
// For vanishing deduction ratio when decedent is NRA:
// GE = PH gross estate (Item 34.C)
// ELIT used in ratio = total_NRA_ELIT (proportional ELIT, computed above)
// NOT the worldwide ELIT

vanishing_ratio = (PH_gross_estate - total_NRA_ELIT) / PH_gross_estate
```

---

## Transfers for Public Use — NRA Application (Sec. 86(B)(4))

### Rule

Same as citizens (see `analysis/deduction-public-transfers.md`), with restriction:

**The transfer must be to the Philippine national government or a Philippine political subdivision.**

```
// Condition for NRA public transfers deduction:
transfer.recipient.isPhilippineGovernment == true  // national or LGU
transfer.purpose == "exclusively_public"

// NOT proportional — the full value is deductible
// Consistent with Sec. 86(B)(4) which does not apply the proportional formula
// Only ELIT-type deductions (Sec. 86(B)(2)) are proportional
```

**Note**: Public transfers to foreign governments do not qualify even though the property might be foreign-situs (and would in any case be excluded from NRA gross estate).

---

## Surviving Spouse Share — NRA Application (Sec. 86(C))

### Rule

Applies to NRAs with conjugal/community property in the Philippines. Same formula as for citizens (see `analysis/surviving-spouse-share.md`), but limited to:

- PH-situs conjugal/community assets (Column B amounts)
- PH-situs conjugal liabilities (from proportional ELIT, Column B portion)

```
// For NRAs:
// Column B = PH-situs conjugal property only
// Obligations chargeable to Column B = proportional NRA ELIT × conjugal portion
// (Not worldwide conjugal obligations)

spouse_share = max(0, (Column_B_gross_estate - Column_B_NRA_ELIT)) × 0.50
```

**Regime applicability**: The three property regimes (ACP, CPG, Separation) still apply to NRAs who married under Philippine law or whose marriage is governed by Philippine law. User declares the applicable regime.

---

## Foreign Estate Tax Credit — NOT Available to NRAs (Sec. 86(D))

### Rule

Sec. 86(D) explicitly states the foreign tax credit applies **only to citizens and residents of the Philippines**.

```
// Engine logic:
if decedent.isNonResidentAlien == true:
    foreignTaxCredit = 0.0
    // Do not prompt user for foreign estate tax paid
    // Even if NRA paid estate tax in home country on PH property,
    // no credit is available against PH estate tax
```

**Consequence**: NRAs may face double taxation — paying estate tax in their home country on worldwide estate (which includes PH property) AND paying PH estate tax on PH property, with no credit mechanism in the NIRC.

**Note**: This is a Philippine domestic law position. The NRA's home country may offer a credit for PH estate tax paid. The engine only computes Philippine estate tax liability.

---

## Complete NRA Net Estate Computation — Pseudocode

```
// Full NRA computation flow (TRAIN-era, death ≥ Jan 1, 2018)

function computeNRANetEstate(decedent, assets, deductions):

  assert decedent.isNonResidentAlien == true
  assert decedent.dateOfDeath >= DATE("2018-01-01")  // TRAIN regime

  // ─── GROSS ESTATE ─────────────────────────────────────────────────────
  // (From gross-estate-nonresident rules — PH-situs only)
  // Item 29: PH real property (excl. family home)
  // Item 30: 0 (family home deduction not available to NRAs)
  // Item 31: PH personal property (intangibles excluded if reciprocity)
  // Item 32: PH taxable transfers
  // Item 33: PH business interests
  Item34 = {
    A: sum(exclusive PH assets),
    B: sum(conjugal PH assets),
    C: Item34.A + Item34.B
  }

  // ─── ORDINARY DEDUCTIONS (Schedule 5) ────────────────────────────────
  // 5A: Claims against estate (proportional)
  // 5B: Claims vs. insolvent persons (proportional)
  // 5C: Unpaid mortgages (proportional)
  // 5D: Casualty losses (proportional)
  // 5E: Vanishing deduction (PH-situs property only, same formula)
  // 5F: Transfers for public use (PH government only, full amount)

  elit_result = computeNRA_ELIT(decedent, Item34)
  // proportional_factor = Item34.C / decedent.totalWorldwideGrossEstate

  vanishing = computeVanishingDeduction(phSitusAssets, elit_result.total, Item34.C)
  // (Same formula; only PH-situs prior properties eligible)

  public_transfers = sum(transfer.fmv for transfer in publicTransfers)
  // (PH government only, full value, not proportional)

  total_ordinary_deductions = {
    A: elit_result.A + vanishing.A + public_transfers.A,
    B: elit_result.B + vanishing.B + public_transfers.B,
    C: total_ordinary_deductions.A + total_ordinary_deductions.B
  }
  Item35 = total_ordinary_deductions  // Per column

  // ─── ESTATE AFTER ORDINARY DEDUCTIONS ────────────────────────────────
  Item36 = {
    A: max(0, Item34.A - Item35.A),
    B: max(0, Item34.B - Item35.B),
    C: Item36.A + Item36.B
  }

  // ─── SPECIAL DEDUCTIONS (Schedule 6) ─────────────────────────────────
  // 6A: Surviving spouse share (computed from Column B; see below)
  // 6B: Standard deduction: ₱500,000 (NRA amount)
  // 6C: Family home: NOT AVAILABLE → ₱0
  // 6D: Medical expenses: NOT AVAILABLE → ₱0
  // 6E: RA 4917 benefits: NOT AVAILABLE → ₱0

  standard_deduction = 500_000.00  // NRA standard deduction
  family_home_deduction = 0        // Not available to NRAs
  medical_deduction = 0            // Not available to NRAs
  ra4917_deduction = 0             // Not available to NRAs

  total_special_deductions = standard_deduction  // Only SD for NRAs
  Item37 = total_special_deductions
  // Note: Item 37A (standard deduction), 37B = 0, 37C = 0, 37D = 0

  // ─── NET ESTATE ───────────────────────────────────────────────────────
  Item38 = max(0, Item36.C - Item37)

  // ─── SURVIVING SPOUSE SHARE ──────────────────────────────────────────
  // (From surviving-spouse-share rules, applied to PH-situs conjugal only)
  // Obligations = proportional NRA ELIT charged to Column B
  net_conjugal = max(0, Item34.B - elit_result.B)  // Column B only
  spouse_share = net_conjugal × 0.50
  Item39 = spouse_share

  // ─── NET TAXABLE ESTATE ──────────────────────────────────────────────
  Item40 = max(0, Item38 - Item39)

  // ─── TAX COMPUTATION ─────────────────────────────────────────────────
  estate_tax_due = Item40 × 0.06  // Item 42: 6% flat rate (TRAIN)
  Item41 = estate_tax_due
  Item42 = estate_tax_due

  // Foreign tax credit: NOT available to NRAs
  foreign_tax_credit = 0.0
  Item43 = foreign_tax_credit

  Item44 = max(0, Item42 - Item43)  // = Item 42 for NRAs (credit is 0)
  net_estate_tax_due = Item44       // = Item 20

  return {
    grossEstate: Item34,
    ordinaryDeductions: Item35,
    afterOrdinary: Item36,
    specialDeductions: Item37,
    netEstate: Item38,
    spouseShare: Item39,
    netTaxableEstate: Item40,
    estateTaxDue: Item41,
    foreignCredit: Item43,
    netEstateTaxDue: Item44
  }
```

---

## Form 1801 Mapping

For NRAs, the same Items 29–44/20 are used as for citizens, but:

| Item | Label | NRA Treatment |
|------|-------|--------------|
| Item 29 | Real Property | PH-situs real property only |
| Item 30 | Family Home | Always ₱0 for NRAs |
| Item 31 | Personal Property | PH-situs tangibles; intangibles subject to reciprocity |
| Item 32 | Taxable Transfers | PH-situs only |
| Item 33 | Business Interests | PH-registered businesses only |
| Item 34 | Gross Estate | PH-situs total |
| Schedule 5A | Claims Against Estate | Proportional amount (worldwide × factor) |
| Schedule 5B | Claims vs. Insolvent | Proportional amount |
| Schedule 5C | Unpaid Mortgages | Proportional amount |
| Schedule 5D | Casualty Losses | Proportional amount |
| Schedule 5E | Vanishing Deduction | PH-situs prior property only; same formula |
| Schedule 5F | Transfers for Public Use | PH government only; full amount (not proportional) |
| Item 35 | Total Ordinary Deductions | Sum of Schedules 5A–5F |
| Item 36 | After Ordinary Deductions | max(0, Item34.C − Item35) per column |
| Item 37A | Standard Deduction | **₱500,000** (NRA) — not ₱5,000,000 |
| Item 37B | Family Home | **₱0** — not available |
| Item 37C | Medical Expenses | **₱0** — not available |
| Item 37D | RA 4917 | **₱0** — not available |
| Item 38 | Net Estate | max(0, Item36.C − Item37.total) |
| Item 39 | Surviving Spouse Share | PH-situs conjugal only |
| Item 40 | Net Taxable Estate | max(0, Item38 − Item39) |
| Item 41 | Estate Tax Due | Item40 × 0.06 |
| Item 42 | Estate Tax Before Credit | = Item 41 |
| Item 43 | Foreign Tax Credit | **₱0** — not available to NRAs |
| Item 44/20 | Net Estate Tax Due | = Item 42 (no credit reduction) |

### Proportional Factor — Supplemental Worksheet

The engine must produce a supplemental computation showing:

```
SUPPLEMENTAL: NRA Proportional ELIT Worksheet
PH Gross Estate (Item 34.C):                  ₱___________
Total Worldwide Gross Estate (user-provided):  ₱___________
Proportional Factor:                              _____._____%

Worldwide ELIT by Category:
  5A Claims Against Estate:                    ₱___________
  5B Claims vs. Insolvent:                     ₱___________
  5C Unpaid Mortgages:                         ₱___________
  5D Casualty Losses:                          ₱___________
  TOTAL Worldwide ELIT:                        ₱___________

Proportional ELIT Deduction (Factor × Worldwide ELIT):
  5A (proportional):                           ₱___________
  5B (proportional):                           ₱___________
  5C (proportional):                           ₱___________
  5D (proportional):                           ₱___________
  TOTAL Proportional ELIT (→ Schedule 5):      ₱___________
```

This worksheet must be attached to the Form 1801 output as a supporting computation.

---

## Conditions Summary

| Condition | Value |
|-----------|-------|
| Applies to | `decedent.isNonResidentAlien == true` only |
| ELIT deduction method | Proportional: (PH gross estate / worldwide gross estate) × worldwide ELIT |
| Standard deduction | ₱500,000 (not ₱5,000,000) |
| Family home | Not available |
| Medical expenses | Not available |
| RA 4917 benefits | Not available |
| Foreign tax credit | Not available |
| Vanishing deduction | Available; PH-situs prior property only |
| Transfers for public use | Available; PH government only; full amount (not proportional) |
| Surviving spouse share | Available; PH-situs conjugal only |

---

## Edge Cases

1. **Worldwide estate = 0 (or not provided)**: If `decedent.totalWorldwideGrossEstate == 0`, the proportional factor is undefined (0/0). Engine should: (a) validate that if NRA has ELIT, worldwide gross estate must be provided; (b) if worldwide estate is intentionally zero (NRA with zero total assets), set proportional_factor = 0 and ELIT deduction = 0. Must prevent division by zero.

2. **PH gross estate > worldwide gross estate (data error)**: Engine must validate that Item 34.C ≤ `decedent.totalWorldwideGrossEstate`. If violated, raise an error: the Philippine portion cannot exceed the whole. This indicates a data entry error.

3. **NRA with 100% PH estate (all assets in Philippines)**: Proportional factor = PH/worldwide = PH/PH = 1.0. Full worldwide ELIT is deductible. But NRA must still use the ₱500K standard deduction (not ₱5M) and cannot claim family home, medical, or RA 4917 deductions.

4. **NRA with only PH-related ELIT**: If all of the decedent's debts relate to PH property (e.g., PH mortgage), the user provides worldwide ELIT = PH ELIT. The proportional factor allocates a fraction of that PH ELIT, potentially resulting in a smaller deduction than the actual PH-related debt. This is the statutory result — the proportional formula does not carve out "PH-related" debts for full deduction.

5. **No ELIT whatsoever**: Common case for NRAs with simple PH assets (e.g., land and no debts). All worldwide ELIT fields = 0. Proportional ELIT = 0. No supplemental worksheet needed. Engine should still prompt for worldwide gross estate if any ELIT is declared.

6. **NRA married to Filipino citizen under ACP or CPG**: NRA may have conjugal PH assets. Column B is populated. Proportional ELIT in Column B flows into the spouse share computation. Engine applies the same property-regime rules (ACP/CPG/Separation) from the property-regime analyses — the regime applies to the PH-situs conjugal property.

7. **NRA with vanishing deduction AND proportional ELIT**: The vanishing deduction formula requires `(GE − ELIT) / GE` ratio. For NRAs, use:
   - GE = Item 34.C (PH gross estate)
   - ELIT = total proportional NRA ELIT (not worldwide ELIT)
   The ratio must be computed AFTER proportional ELIT is determined, so vanishing deduction depends on proportional ELIT (order of operations matters).

8. **NRA with transfers for public use**: The public transfers deduction is NOT proportional. The full FMV of the bequest to the PH government is deductible. This asymmetry (proportional for ELIT, full for public transfers) is dictated by Sec. 86(B): the proportional formula applies only to "(1) and (3)" of Sec. 86(A) — ELIT and vanishing — while transfers for public use (item (4)) gets full deduction.

   *Wait — correction*: Re-reading Sec. 86(B)(2): "That proportion of the deductions specified in paragraphs (1) and (3) of Subsection (A)". Paragraph (1) = ELIT. Paragraph (3) = Transfers for public use. NOT paragraph (2) (vanishing deduction is paragraph (2)). Paragraph (2) is covered separately in Sec. 86(B)(3) for PH-situs property only.

   **Corrected interpretation**:
   - Sec. 86(B)(2) applies proportional formula to: ELIT (par. 1) AND transfers for public use (par. 3)
   - Sec. 86(B)(3) allows vanishing deduction at full percentage but limited to PH-situs prior property

   This means **both ELIT and transfers for public use are proportional** for NRAs. Vanishing deduction is **not proportional** (uses full percentage table, but PH-situs restriction applies).

   **Revised pseudocode for public transfers**:
   ```
   // For NRAs: transfers for public use are ALSO proportional
   proportional_public_transfers = proportional_factor × worldwide_public_transfers

   // Where worldwide_public_transfers = total bequests to PH government
   // (But since PH government transfers are PH-situs by definition,
   //  and NRA gross estate is already PH-situs only, the effective result:
   //  if 100% of public transfers are in PH (as they must be),
   //  then: proportional_factor × PH_transfers = (PH/worldwide) × PH_transfers
   //  This gives a smaller deduction than full FMV.)
   ```

   **Practical impact**: For NRAs, a bequest to the PH government of ₱1M where PH estate is 25% of worldwide estate gives only ₱250K deduction (vs. ₱1M for a citizen). This is the statutory rule under Sec. 86(B)(2).

9. **TRAIN removal of funeral/judicial expenses for NRAs**: Pre-TRAIN, funeral and judicial/administrative expenses were deductible even for NRAs (proportionally). Under TRAIN (deaths ≥ Jan 1, 2018), these are removed from ELIT entirely. NRAs cannot deduct them either. No special NRA exception re-introduces them.

10. **NRA filing location**: If no legal residence in PH, file with Revenue District Office No. 39 (South Quezon City). Engine should output this RDO code for NRAs when generating the Form 1801 header (Sec. 90(D)). This is an informational output, not a computation.

11. **Reciprocity exemption + ELIT interaction**: If reciprocity applies and some intangible PH assets are excluded from gross estate (Item 31 reduced), this lowers Item 34.C (PH gross estate). The proportional factor decreases accordingly, reducing the allowable ELIT deduction. These two effects are connected: excluding intangibles via reciprocity also reduces ELIT deductions.

---

## Test Implications

| # | Test Case | What to Verify |
|---|-----------|----------------|
| T1 | NRA, PH gross estate ₱5M of ₱20M worldwide, worldwide ELIT ₱2M | Proportional factor = 0.25; ELIT deduction = ₱500K |
| T2 | NRA, PH gross estate = worldwide gross estate (₱5M/₱5M), ELIT ₱1M | Proportional factor = 1.0; full ₱1M ELIT deductible |
| T3 | NRA, no ELIT (all ELIT fields = 0) | Proportional ELIT = 0; no supplemental worksheet |
| T4 | NRA, worldwide gross estate = 0 (user input error) | Engine raises validation error; division by zero prevented |
| T5 | NRA, PH gross estate > worldwide gross estate | Engine raises validation error |
| T6 | NRA with family home claim | Engine rejects family home deduction (₱0); produces warning |
| T7 | NRA with medical expenses claim | Engine rejects medical deduction (₱0); produces warning |
| T8 | NRA with PH conjugal property (ACP) and ELIT | Proportional ELIT split by column; spouse share computed on Column B after proportional ELIT |
| T9 | NRA, vanishing deduction + proportional ELIT | Order of operations: compute proportional ELIT first; use in vanishing ratio |
| T10 | NRA, bequest to PH government ₱1M, worldwide estate ₱10M, PH estate ₱2.5M | Proportional public transfers = 0.25 × ₱1M = ₱250K (not ₱1M) |
| T11 | NRA, reciprocity applies (PH intangibles excluded), then ELIT | Lower Item 34.C → lower proportional factor → less ELIT deductible |
| T12 | NRA, standard deduction ₱500K exceeds net PH estate | Standard deduction of ₱500K cannot exceed PH net estate; result = Item 38 = ₱0 |

---

## Order of Operations for NRA Deduction Computation

Correct sequence (critical — some steps depend on earlier results):

```
1. Compute PH gross estate (Item 34.C) from PH-situs assets
2. Compute proportional_factor = Item34.C / decedent.totalWorldwideGrossEstate
3. Compute proportional ELIT (5A–5D) = proportional_factor × worldwide ELIT sub-items
4. Compute proportional public transfers (5F) = proportional_factor × worldwide public transfers
5. Compute vanishing deduction (5E) using:
     - Only PH-situs prior property
     - ELIT for ratio = total proportional ELIT from step 3
     - GE for ratio = Item 34.C
6. Sum Schedule 5 → Item 35
7. Compute Item 36 = max(0, Item34 − Item35) per column
8. Apply standard deduction ₱500K → Item 37A
9. Apply Item 37B = 0 (family home), 37C = 0 (medical), 37D = 0 (RA4917)
10. Item 38 = max(0, Item36.C − Item37.total)
11. Compute surviving spouse share → Item 39
12. Item 40 = max(0, Item38 − Item39)
13. Item 41/42 = Item40 × 0.06
14. Item 43 = 0 (no foreign tax credit for NRAs)
15. Item 44/20 = Item 42
```

---

## Key Correction: Re-Reading Sec. 86(B)(2) — Proportional Rule Scope

**Critical finding**: The proportional formula in Sec. 86(B)(2) applies to deductions under paragraphs "(1) and (3)" of Sec. 86(A), which are:
- **Paragraph (1)**: ELIT (claims, mortgages, losses, taxes)
- **Paragraph (3)**: Transfers for public use

The vanishing deduction (paragraph (2)) is handled separately in Sec. 86(B)(3) — not subject to the proportional formula. Instead, it applies the same formula as citizens but limited to PH-situs property.

This contradicts the earlier analysis in `deduction-public-transfers.md` which stated NRAs get the full value of public transfers (not proportional). The correct reading: public transfers for NRAs ARE proportional per Sec. 86(B)(2).

**Engine behavior**: Apply proportional factor to BOTH ELIT (5A–5D) and transfers for public use (5F) for NRA decedents.

**Update needed**: `deduction-public-transfers.md` contains a documented error regarding NRA treatment. The spec-draft phase should reconcile this — public transfers for NRAs are proportional, not full-value.

---

## Notes for Developer

- **Two new required inputs for NRAs**: `decedent.totalWorldwideGrossEstate` and `decedent.totalWorldwideELIT` (object with sub-items). Make these required fields in the UI when `decedent.isNonResidentAlien == true` and any ELIT is declared.
- **Order of operations matters**: Proportional ELIT must be computed before vanishing deduction (vanishing uses ELIT in its ratio formula).
- **NRA users are less common but higher stakes**: The proportional computation requires more inputs. Consider a dedicated NRA computation flow in the UI.
- **Display the proportional factor prominently** in the output: "Since X% of worldwide estate is in the Philippines, only X% of worldwide debts/taxes are deductible."
- **Standard deduction warning**: Explicitly flag ₱500,000 (not ₱5,000,000) in the NRA output. Users may assume the higher amount.
- **Suppress unavailable deductions**: When generating Form 1801 output for NRAs, items 37B (family home), 37C (medical), 37D (RA 4917) must all be ₱0. Engine should display informational message: "These deductions are available only to citizens and residents of the Philippines."
- **Correction to deduction-public-transfers.md**: That analysis stated NRAs deduct the full value of public transfers. The correct rule is proportional (Sec. 86(B)(2) includes paragraph (3) of Sec. 86(A) in the proportional formula). Flag for correction in spec-review.
