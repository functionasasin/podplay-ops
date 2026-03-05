# Analysis: Explainer Format — Plain-English Explainer Section Template

**Aspect**: explainer-format
**Wave**: 5 — Synthesis
**Date Analyzed**: 2026-02-25
**Depends On**: ALL Wave 2–4 analysis files; computation-pipeline.md; regime-detection.md; test-vectors.md; filing-rules.md

---

## Purpose

This document defines the complete template for the **plain-English explainer section** that accompanies every engine output. The explainer is shown alongside (or below) the BIR Form 1801 / ETAR computation, and explains in non-expert language:

- Why these specific tax rules apply to this estate
- What each computation step means
- Why each deduction is or is not available
- What the final number means and what happens next

**Target audience**: A Filipino heir or executor who has never filed an estate tax return and may not have legal or accounting training. The explainer must be usable without any other reference material.

**Design principles**:
1. **Active, direct voice** — "The law requires..." not "It is required by law..."
2. **No unexplained acronyms** — NIRC (the National Internal Revenue Code), BIR (Bureau of Internal Revenue), etc. are spelled out on first use
3. **Concrete numbers** — Every explanation references the actual numbers from the computation
4. **"Why it matters" framing** — Each step explains what would be different if the rule were otherwise
5. **Section skipping** — If a deduction is zero or unavailable, the template provides a short "why not" explanation rather than omitting the section entirely
6. **Parameterizable** — All `{{variable}}` placeholders are filled with actual computed values at render time

---

## Template Architecture

The explainer is composed of **eight sections**, rendered in order. Each section is optional (skipped with a "why skipped" one-liner) except Sections 1, 6, and 7 which are always rendered.

```
Section 1: Which Tax Rules Apply                  [ALWAYS]
Section 2: What Counts as the Estate              [ALWAYS]
  2A: Exempt Transfers (if any)
  2B–2G: Gross Estate Components
  2H: Property Regime Note
  2I: Total Gross Estate
Section 3: Ordinary Deductions                    [ALWAYS — show $0 items with reason]
Section 4: Additional Standard Deductions         [ALWAYS]
Section 5: The Surviving Spouse's Share           [ALWAYS — show ₱0 with reason if single/separated]
Section 6: The Tax Computation                    [ALWAYS]
Section 7: Your Summary                           [ALWAYS]
Section 8: What To Do Next                        [ALWAYS]
```

---

## Section 1: Which Tax Rules Apply

**Purpose**: Explain the regime selection in plain English. This is the most important orientation for the user.

### Template 1A: TRAIN-Era (death on/after Jan 1, 2018, no amnesty)

```
─────────────────────────────────────────────────────────────────────
WHICH TAX RULES APPLY TO THIS ESTATE
─────────────────────────────────────────────────────────────────────

{{decedent.name}} passed away on {{decedent.dateOfDeath | format:"MMMM D, YYYY"}}.

Because the date of death falls on or after January 1, 2018, this estate
is governed by the TRAIN Law (Republic Act No. 10963), which simplified
Philippine estate tax significantly.

Under the TRAIN Law:
  • The estate tax rate is a flat 6% — the same rate regardless of how
    large or small the taxable estate is.
  • There is a generous automatic ₱5,000,000 standard deduction (or
    ₱500,000 for non-resident aliens), meaning most modest estates owe
    little or no tax.
  • Funeral expenses and court costs are no longer deductible (these
    were removed by the TRAIN Law).

This computation shows the base estate tax only. It does not include
surcharges, interest, or penalties for late filing. If filing is
overdue, additional amounts will apply — consult a lawyer or accountant.
─────────────────────────────────────────────────────────────────────
```

### Template 1B: Pre-TRAIN (death before Jan 1, 2018, no amnesty)

```
─────────────────────────────────────────────────────────────────────
WHICH TAX RULES APPLY TO THIS ESTATE
─────────────────────────────────────────────────────────────────────

{{decedent.name}} passed away on {{decedent.dateOfDeath | format:"MMMM D, YYYY"}}.

Because the date of death falls before January 1, 2018, this estate is
governed by the NIRC (National Internal Revenue Code) as it existed
before the TRAIN Law — the older, pre-TRAIN rules.

Under the pre-TRAIN rules:
  • The estate tax uses a graduated scale: larger estates are taxed at
    higher rates, ranging from 0% (for taxable estates of ₱200,000 or
    less) up to 20% (for taxable estates over ₱10,000,000).
  • The automatic standard deduction is ₱1,000,000 (lower than the
    TRAIN-era ₱5,000,000).
  • Funeral expenses (up to 5% of the gross estate) and documented
    court and administrative costs are deductible.
  • The family home deduction is capped at ₱1,000,000 (versus the
    TRAIN-era ₱10,000,000).
  • The return was due within 6 months of death (versus 1 year under
    TRAIN).

{{#if suggestion_amnesty_available}}
NOTE: This estate's unpaid tax may have been eligible for the Estate
Tax Amnesty (RA 11213, as extended by RA 11956). The amnesty offered a
flat 6% rate with a ₱5,000 minimum, which can be lower than the
graduated pre-TRAIN rate for larger estates. The amnesty filing window
closed on June 14, 2025. Select "Compute Amnesty Path" to see what
the amnesty computation would have shown.
{{/if}}

This computation shows the base estate tax only — no surcharges or
interest.
─────────────────────────────────────────────────────────────────────
```

### Template 1C: Amnesty (RA 11213, pre-2018 death, user elected amnesty)

```
─────────────────────────────────────────────────────────────────────
WHICH TAX RULES APPLY TO THIS ESTATE — ESTATE TAX AMNESTY
─────────────────────────────────────────────────────────────────────

{{decedent.name}} passed away on {{decedent.dateOfDeath | format:"MMMM D, YYYY"}}.

⚠ HISTORICAL COMPUTATION ONLY: The Estate Tax Amnesty filing window
  closed on June 14, 2025. This computation shows what the amnesty
  would have produced. Actual availment is no longer possible unless
  Congress enacts a further extension.

What the Estate Tax Amnesty was:

The Estate Tax Amnesty (Republic Act No. 11213, as amended by RA 11569
and RA 11956) was a one-time program that allowed estates with unpaid
or unsettled estate taxes to settle at a flat 6% rate on the net
estate, with all surcharges, interest, and penalties waived. The
program covered deaths up to May 31, 2022.

For this estate:
  • Amnesty rate: flat 6% (0.06) on the net taxable estate
  • Minimum amnesty tax: ₱5,000
  • Deductions used: the full set of deductions applicable at the time
    of death (pre-TRAIN rules, since {{decedent.name}} died before
    January 1, 2018) — including funeral expenses and court costs.
  • Amnesty Track: {{#if track == "TRACK_A"}}Track A (no prior estate
    tax return was filed — the full net estate is the amnesty
    base){{else}}Track B (a prior estate tax return was filed — only
    the additional, previously undeclared net estate is taxed under
    the amnesty){{/if}}

{{#if displayDualPath}}
This report also shows the regular pre-TRAIN graduated-rate
computation for comparison. Both results are shown so you can see
what the amnesty saved.
{{/if}}
─────────────────────────────────────────────────────────────────────
```

### Template 1D: Amnesty (TRAIN-era death 2018–2022, rate parity notice)

```
─────────────────────────────────────────────────────────────────────
WHICH TAX RULES APPLY TO THIS ESTATE — ESTATE TAX AMNESTY (TRAIN ERA)
─────────────────────────────────────────────────────────────────────

{{decedent.name}} passed away on {{decedent.dateOfDeath | format:"MMMM D, YYYY"}}.

⚠ HISTORICAL COMPUTATION ONLY: The amnesty filing window closed June
  14, 2025.

For estates of decedents who died between January 1, 2018 and May 31,
2022 (the "TRAIN era" covered by RA 11956), the amnesty rate (6%) is
IDENTICAL to the regular TRAIN estate tax rate (6%), and the same TRAIN
deduction rules apply. The base tax is the same either way.

The only practical benefit of the amnesty for this estate would have
been the waiver of accrued surcharges and interest on any overdue
amount — amounts this engine does not compute.

This computation shows the regular TRAIN estate tax, which equals what
the amnesty would have produced.
─────────────────────────────────────────────────────────────────────
```

---

## Section 2: What Counts as the Estate

**Purpose**: Walk through the gross estate components. Each sub-section corresponds to Items 29–34 (Form 1801) plus Sec. 87 pre-exclusions.

### Template 2A: Section 87 Exempt Transfers (shown only if any exist)

```
─────────────────────────────────────────────────────────────────────
STEP 1: ASSETS EXCLUDED BEFORE WE START
─────────────────────────────────────────────────────────────────────

Before counting the estate, the law (NIRC Section 87) requires us to
remove certain assets that are legally exempt from estate tax entirely.
These are not deductions — they are simply excluded from the calculation
as if they were never part of the estate.

{{#each sec87_exclusions}}

  {{description}} — excluded under NIRC Sec. 87({{subsection}})
    Value excluded: ₱{{fmv | number}}
    Reason: {{reason_plain_text}}

{{/each}}

  Total excluded before computation: ₱{{total_sec87_excluded | number}}

These excluded assets are NOT counted in the gross estate figures below.

{{#if sec87_exclusions.length == 0}}
  No assets were excluded under Section 87 for this estate.
{{/if}}
─────────────────────────────────────────────────────────────────────
```

**Reason text templates for each Sec. 87 sub-section**:

| Sub-section | Plain-English Reason |
|-------------|---------------------|
| 87(a) — personal usufruct | "{{decedent.name}}'s right to use this property for life ended automatically at death. No property actually passed to anyone — it simply ceased to exist. The law does not tax an asset that disappears at death." |
| 87(b) — fiduciary heir | "This property was received from a prior estate as a fiduciary heir — meaning {{decedent.name}} held it temporarily and was required to pass it to a final recipient at death. Because the prior estate already paid tax on it, this pass-through is not taxed again." |
| 87(c) — fideicommissary | "This is a fideicommissary transmission — a form of trust under Philippine law where property passes through an intermediate holder to an ultimate recipient. The law exempts this transmission from estate tax." |
| 87(d) — private charitable institution | "This property was bequeathed to {{institution_name}}, a qualifying private charitable, educational, or religious institution with no profit inuring to individuals, and with administrative costs not exceeding 30% of receipts. Under NIRC Section 87(d), such bequests are excluded from the estate entirely." |

### Template 2B: Real Property (Item 29 / Schedule 1)

```
─────────────────────────────────────────────────────────────────────
STEP 2A: REAL PROPERTY (Land, Houses, Condominiums)
─────────────────────────────────────────────────────────────────────

Real property includes land, houses, condominium units, and other
immovable assets. Estate tax uses the fair market value (FMV) — the
price a willing buyer and seller would agree on.

{{#each real_property_assets}}

  {{description}}
    Location: {{location}}
    Fair market value: ₱{{fmv | number}}
    Ownership: {{#if ownership == "exclusive"}}Exclusive property of
      {{decedent.name}} → counted in Column A{{else}}Conjugal /
      communal property (shared with spouse) → full value counted in
      Column B. {{decedent.name}}'s share (50%) will be removed later
      when we compute the surviving spouse's deduction.{{/if}}

{{/each}}

  Real property subtotal:
    Exclusive (Column A):   ₱{{item29.colA | number}}
    Conjugal (Column B):    ₱{{item29.colB | number}}
    Total (Column C):       ₱{{item29.colC | number}}

{{#if item29.colC == 0}}
  No real property in this estate.
{{/if}}
─────────────────────────────────────────────────────────────────────
```

### Template 2C: Family Home (Item 30 / Schedule 1A)

```
─────────────────────────────────────────────────────────────────────
STEP 2B: FAMILY HOME
─────────────────────────────────────────────────────────────────────

The law lists the family home separately because it receives its own
special deduction later (Step 4B). The family home is the house and
lot where {{decedent.name}} actually lived at the time of death.

{{#if familyHome != null}}

  {{familyHome.description}}
    Fair market value (full): ₱{{familyHome.fmv | number}}
    Ownership: {{familyHome.ownership}}

  This value is included in the estate at its full fair market value
  now. Later, in Step 4B, we will subtract a deduction for it (capped
  at ₱{{familyHomeCap | number}} under {{regimeLabel}}).

{{else}}

  No family home was designated for this estate.

  {{#if decedent.isNonResidentAlien}}
  NOTE: The family home deduction is not available for non-resident
  aliens (NIRC Section 86(A)(5) applies to citizens and residents only).
  {{/if}}

{{/if}}
─────────────────────────────────────────────────────────────────────
```

### Template 2D: Personal Property (Items 31 / Schedules 2 & 2A)

```
─────────────────────────────────────────────────────────────────────
STEP 2C: PERSONAL PROPERTY (Cash, Investments, Vehicles, Jewelry, Etc.)
─────────────────────────────────────────────────────────────────────

Personal property covers everything that is not real estate. This
includes bank accounts, stocks, bonds, mutual funds, vehicles,
jewelry, and other movable assets.

Financial assets:
{{#each personal_property_financial}}
  {{description}}   ₱{{fmv | number}}   ({{ownership_label}})
{{/each}}
  Financial subtotal:   ₱{{financial_subtotal | number}}

Tangible assets:
{{#each personal_property_tangible}}
  {{description}}   ₱{{fmv | number}}   ({{ownership_label}})
{{/each}}
  Tangible subtotal:   ₱{{tangible_subtotal | number}}

  Personal property subtotal:
    Exclusive (Column A):   ₱{{item31.colA | number}}
    Conjugal (Column B):    ₱{{item31.colB | number}}
    Total (Column C):       ₱{{item31.colC | number}}
─────────────────────────────────────────────────────────────────────
```

### Template 2E: Taxable Transfers (Item 32 / Schedule 3)

```
─────────────────────────────────────────────────────────────────────
STEP 2D: PROPERTY TRANSFERRED BEFORE DEATH (TAXABLE TRANSFERS)
─────────────────────────────────────────────────────────────────────

Sometimes the law requires us to "pull back" property that the
decedent transferred while alive and include it in the estate. This
prevents estate tax avoidance through last-minute gifts.

{{#if taxable_transfers.length == 0}}

  No taxable transfers were identified for this estate.
  (The most common types are gifts made within 3 years of death
  with no real payment, transfers the decedent could take back,
  property passing under a power of appointment in the will, and
  life insurance proceeds payable to the estate.)

{{else}}

  {{#each taxable_transfers}}

  {{description}} — {{transfer_type_label}}
    Value counted: ₱{{fmv | number}}
    Why included: {{reason_plain_text}}

  {{/each}}

  Taxable transfers subtotal:
    Exclusive (Column A):   ₱{{item32.colA | number}}
    Conjugal (Column B):    ₱{{item32.colB | number}}
    Total (Column C):       ₱{{item32.colC | number}}

{{/if}}
─────────────────────────────────────────────────────────────────────
```

**Transfer-type reason templates**:

| Type | Plain-English Reason |
|------|---------------------|
| CONTEMPLATION_OF_DEATH | "This property was transferred within 3 years before death and the transfer was made without full payment, suggesting the purpose was to pass the asset at death rather than for genuine consideration." |
| REVOCABLE_TRANSFER | "{{decedent.name}} had the power to take this property back (or gave up that power within 3 years of death), so the law treats it as still part of the estate." |
| GPA_BY_WILL | "The will exercised a general power of appointment over this property — meaning {{decedent.name}} had the power to direct where this property goes at death, so it is treated as owned by the estate." |
| LIFE_INSURANCE | "The life insurance proceeds were payable to the estate directly (or to a beneficiary who could be changed). Life insurance payable to an irrevocably-named private beneficiary would NOT be included." |
| INSUFFICIENT_CONSIDERATION | "This property was sold for ₱{{consideration | number}}, which is less than its fair market value of ₱{{fmv | number}} at the time of death. The difference of ₱{{excess | number}} is treated as a gift from the estate." |

### Template 2F: Business Interests (Item 33 / Schedule 4)

```
─────────────────────────────────────────────────────────────────────
STEP 2E: BUSINESS INTERESTS
─────────────────────────────────────────────────────────────────────

Business interests include shares of stock (in corporations), capital
contributions (in partnerships), and the net assets of sole
proprietorships.

{{#if business_interests.length == 0}}
  No business interests in this estate.
{{else}}
  {{#each business_interests}}
  {{description}} ({{business_type_label}})
    Fair market value: ₱{{fmv | number}}   {{#if floored_to_zero}}
    Note: Entered value was negative; floored to ₱0 (estates cannot
    have negative business interest value for tax purposes).{{/if}}
  {{/each}}

  Business interests subtotal:
    Exclusive (Column A):   ₱{{item33.colA | number}}
    Conjugal (Column B):    ₱{{item33.colB | number}}
    Total (Column C):       ₱{{item33.colC | number}}
{{/if}}
─────────────────────────────────────────────────────────────────────
```

### Template 2G: Property Regime Note (always shown for married decedents)

```
─────────────────────────────────────────────────────────────────────
NOTE ON PROPERTY OWNERSHIP — THE MARITAL PROPERTY REGIME
─────────────────────────────────────────────────────────────────────

{{decedent.name}} was married to {{spouse.name}} under the
{{propertyRegime_label}} regime. Here is what that means for this
computation:

{{#if propertyRegime == "ACP"}}

  ABSOLUTE COMMUNITY OF PROPERTY (ACP) — Default for marriages on
  or after August 3, 1988

  Under ACP, almost everything owned at the time of marriage AND
  acquired during the marriage belongs to both spouses equally (the
  "community"). This includes income, savings, and property purchased
  during the marriage.

  Exceptions (exclusively {{decedent.name}}'s property):
    • Property inherited or received as a gift during the marriage
      (unless the giver explicitly said it should be shared)
    • Items for exclusive personal use (but NOT jewelry — jewelry is
      always community property under ACP)
    • Property that {{decedent.name}} owned before the marriage AND
      where {{decedent.name}} has children from a prior marriage

  In this computation: community property is listed in Column B at
  its full value. Later (Step 5), we will subtract {{spouse.name}}'s
  50% share, so that only {{decedent.name}}'s 50% is ultimately taxed.

{{else if propertyRegime == "CPG"}}

  CONJUGAL PARTNERSHIP OF GAINS (CPG) — Default for marriages before
  August 3, 1988

  Under CPG, property owned before the marriage remains separately
  owned by each spouse. Only the gains and income earned DURING the
  marriage are shared (the "conjugal partnership").

  Key rule: income, profits, and fruits of ANY property earned during
  the marriage are conjugal — even if the underlying asset is
  separately owned. For example, rent collected from a building
  {{decedent.name}} owned before the marriage is conjugal property.

  In this computation: conjugal property is listed in Column B at its
  full value. Later (Step 5), we subtract {{spouse.name}}'s 50% share.

{{else if propertyRegime == "SEPARATION"}}

  COMPLETE SEPARATION OF PROPERTY

  {{decedent.name}} and {{spouse.name}} had a prenuptial agreement
  establishing complete separation of property. Under this regime,
  each spouse owns their own property exclusively — there is no
  community or conjugal pool.

  As a result:
    • All property in this estate is exclusively {{decedent.name}}'s
      (Column A).
    • There is no conjugal Column B.
    • The surviving spouse deduction (Step 5) will be ₱0 — there is
      no shared pool to deduct.

{{/if}}
─────────────────────────────────────────────────────────────────────
```

**Note for NRA decedents (suppress property regime section)**:
> `{{decedent.name}} was not married, or the marital property regime does not apply to this non-resident alien estate. All assets are treated as exclusively owned by the decedent (Column A).`

**Note for single decedents (suppress property regime section)**:
> `{{decedent.name}} was not married at the time of death. All property is exclusively owned (Column A). There is no surviving spouse share to deduct.`

### Template 2I: Total Gross Estate (Item 34)

```
─────────────────────────────────────────────────────────────────────
STEP 2F: TOTAL GROSS ESTATE (Before Any Deductions)
─────────────────────────────────────────────────────────────────────

Adding up all the categories above gives us the gross estate — the
total value of everything {{decedent.name}} left behind, before we
apply any deductions.

  Real property (Step 2A):              ₱{{item29.colC | number}}
  Family home (Step 2B):                ₱{{item30.colC | number}}
  Personal property (Step 2C):          ₱{{item31.colC | number}}
  Taxable transfers (Step 2D):          ₱{{item32.colC | number}}
  Business interests (Step 2E):         ₱{{item33.colC | number}}
  ─────────────────────────────────────────────────────────────────
  GROSS ESTATE (Item 34):               ₱{{item34.colC | number}}

  Of which:
    Exclusively {{decedent.name}}'s (Col A):   ₱{{item34.colA | number}}
    {{#if has_spouse}}Shared with {{spouse.name}} (Col B):   ₱{{item34.colB | number}}{{/if}}
─────────────────────────────────────────────────────────────────────
```

---

## Section 3: Ordinary Deductions (Schedule 5 / Item 35)

**Purpose**: Explain each ordinary deduction, why it applies or does not, and what the law requires to claim it.

### Template 3-Intro

```
─────────────────────────────────────────────────────────────────────
STEP 3: DEDUCTIONS — REDUCING THE ESTATE
─────────────────────────────────────────────────────────────────────

Not all of the gross estate belongs to the heirs. The law allows us
to subtract certain obligations and losses. These are called
"deductions," and they reduce the taxable value of the estate.

We apply two types of deductions in sequence:
  (A) Ordinary deductions — debts, losses, and specific allowances
      (Steps 3A–3H below)
  (B) Special deductions — the standard deduction, family home,
      medical bills, and employer death benefits (Step 4 below)
─────────────────────────────────────────────────────────────────────
```

### Template 3A: Claims Against the Estate (Schedule 5A)

```
STEP 3A: DEBTS AND OBLIGATIONS OF THE ESTATE (Schedule 5A)

The estate must pay the decedent's debts before anything goes to
the heirs. These are ordinary debts like loans, credit cards, or
unpaid bills — documented, legally valid obligations that existed
before death.

  Requirements: The debt must have existed before death, be supported
  by a notarized document or official record, and have been incurred
  for genuine consideration (not to artificially reduce the estate).

{{#if claims_against_estate.length > 0}}
  {{#each claims_against_estate}}
  {{description}}
    Creditor: {{creditor}}
    Amount claimed: ₱{{amount | number}}
    Deducted in: Column {{column}} ({{column_reason}})
  {{/each}}

  Claims against estate total:
    Column A: ₱{{5A.colA | number}}
    Column B: ₱{{5A.colB | number}}
    Total:    ₱{{5A.colC | number}}
{{else}}
  No debts or claims were entered for this estate. If there are
  outstanding loans or obligations, they should be included here.
{{/if}}
```

### Template 3B: Claims vs. Insolvent Persons (Schedule 5B)

```
STEP 3B: RECEIVABLES FROM PEOPLE WHO CANNOT PAY (Schedule 5B)

If the decedent was owed money by someone who cannot pay (an insolvent
debtor), those receivables still appear in the estate's assets — but the
law allows a matching deduction for the uncollectible amount.

Important: The receivable must first be listed as an asset (in personal
property). You cannot deduct something that was never counted as an asset.

{{#if claims_vs_insolvent.length > 0}}
  {{#each claims_vs_insolvent}}
  {{description}}
    Gross receivable (in personal property): ₱{{gross_receivable | number}}
    Uncollectible amount deducted: ₱{{uncollectible_amount | number}}
    Why uncollectible: {{reason}}
  {{/each}}

  Claims vs. insolvent total:   ₱{{5B.colC | number}}
{{else}}
  No claims against insolvent persons were entered.
{{/if}}
```

### Template 3C: Unpaid Mortgages and Taxes (Schedule 5C)

```
STEP 3C: UNPAID MORTGAGES AND PROPERTY TAXES (Schedule 5C)

If the estate includes mortgaged property, the outstanding mortgage
balance is deducted — because the heir effectively inherits both the
property and the debt. Similarly, property taxes that were due before
death but not yet paid are deducted here.

Note: Estate tax itself is NOT deducted here. Only pre-existing
property taxes owed by the decedent at the time of death qualify.

{{#if unpaid_mortgages_and_taxes.length > 0}}
  {{#each unpaid_mortgages_and_taxes}}
  {{description}}
    Amount: ₱{{amount | number}}
    Type: {{type_label}} ({{column_note}})
  {{/each}}

  Unpaid mortgages and taxes total:
    Column A: ₱{{5C.colA | number}}
    Column B: ₱{{5C.colB | number}}
    Total:    ₱{{5C.colC | number}}

  {{#if has_conjugal_mortgage}}
  NOTE: Conjugal mortgages appear in full under Column B. The share
  owed by the estate and the share owed by the spouse are separated
  later on the Schedule 6A worksheet.
  {{/if}}
{{else}}
  No unpaid mortgages or pre-death property taxes were entered.
{{/if}}
```

### Template 3D: Casualty Losses (Schedule 5D)

```
STEP 3D: LOSSES DURING ESTATE SETTLEMENT (Schedule 5D)

If assets are damaged or destroyed after the decedent's death but
before the estate is settled — due to fire, flood, theft, or other
similar events — the net loss (after any insurance recovery) can be
deducted. The event must have been beyond anyone's control.

{{#if casualty_losses.length > 0}}
  {{#each casualty_losses}}
  {{description}}
    Type of loss: {{loss_type}}
    Property affected: {{affected_property}}
    Gross loss: ₱{{gross_loss | number}}
    Insurance recovery: ₱{{insurance_recovery | number}}
    Net deductible loss: ₱{{net_loss | number}}
  {{/each}}

  Casualty losses total:   ₱{{5D.colC | number}}
{{else}}
  No casualty losses during settlement were entered.
{{/if}}
```

### Template 3E: Vanishing Deduction / Previously Taxed Property (Schedule 5E)

```
STEP 3E: PROPERTY THAT WAS ALREADY TAXED RECENTLY (Vanishing Deduction)

This is one of the more technical deductions. If the estate includes
property that was previously taxed — meaning it was received from
another estate within the last 5 years and estate tax (or donor's tax)
was paid on it then — the law allows an extra deduction to prevent the
same property from being taxed heavily in rapid succession.

The deduction "vanishes" over time: the longer ago the prior tax was
paid, the smaller the deduction:
  • Within 1 year of prior taxable event: 100% deduction
  • 1–2 years:  80%
  • 2–3 years:  60%
  • 3–4 years:  40%
  • 4–5 years:  20%
  • More than 5 years: no deduction

How the deduction is calculated (5 steps):
  1. Initial Value = min(prior taxable value, current fair market value)
     (You get the benefit of the lower figure.)
  2. Net Value = Initial Value minus any mortgage on the property
  3. Ratio = (Gross Estate minus ordinary debts) ÷ Gross Estate
     (This proportionately adjusts for debts.)
  4. Percentage = from the table above, based on years elapsed
  5. Vanishing Deduction = Percentage × Net Value × Ratio

{{#if vanishing_deductions.length > 0}}
  {{#each vanishing_deductions}}
  {{description}}
    Prior taxable value: ₱{{prior_value | number}}
    Current FMV:         ₱{{current_fmv | number}}
    Step 1 — Initial Value (lower of the two): ₱{{initial_value | number}}
    Step 2 — Net Value (less mortgage of ₱{{mortgage | number}}): ₱{{net_value | number}}
    Step 3 — Ratio ((₱{{gross_estate | number}} − ₱{{elit_total | number}}) ÷ ₱{{gross_estate | number}}): {{ratio | percent}}
    Step 4 — Percentage ({{years_elapsed}} year(s) elapsed → {{percentage | percent}}):
    Step 5 — Vanishing Deduction: ₱{{net_value | number}} × {{percentage | percent}} × {{ratio | percent}} = ₱{{vd_amount | number}}

    Deducted in: Column {{column}}
  {{/each}}

  Vanishing deduction total:
    Column A: ₱{{5E.colA | number}}
    Column B: ₱{{5E.colB | number}}
    Total:    ₱{{5E.colC | number}}
{{else}}
  No previously taxed property (vanishing deduction) was entered.
  (If the decedent inherited property from another estate within the
  last 5 years and estate tax was paid on that prior estate, this
  deduction may apply.)
{{/if}}
```

### Template 3F: Transfers to the Government (Schedule 5F)

```
STEP 3F: PROPERTY LEFT TO THE GOVERNMENT (Schedule 5F)

If the decedent left property to the Philippine national government,
a local government unit (province, city, municipality, barangay), or
a government agency, and the purpose was exclusively for public use,
the full value of that bequest is deductible. There is no cap.

This deduction is only for government recipients. Private charitable
institutions are handled differently (Sec. 87(d) exclusion — see
Step 1 above, if applicable).

{{#if public_transfers.length > 0}}
  {{#each public_transfers}}
  {{description}}
    Recipient: {{recipient_name}}
    Purpose: {{purpose}}
    Amount: ₱{{amount | number}}
    {{#if decedent.isNonResidentAlien}}
    Note: For this non-resident alien estate, the deductible amount
    is proportionally adjusted: ₱{{amount | number}} × {{proportional_factor | percent}}
    (Philippine assets ÷ worldwide assets) = ₱{{deductible_amount | number}}.
    {{/if}}
  {{/each}}

  Transfers for public use total:   ₱{{5F.colC | number}}
{{else}}
  No bequests to the government were entered.
{{/if}}
```

### Template 3G: Funeral Expenses (Schedule 5G — pre-TRAIN only)

```
STEP 3G: FUNERAL AND BURIAL EXPENSES (Schedule 5G) [PRE-TRAIN RULES ONLY]

{{#if deductionRules == "PRE_TRAIN"}}

  Under the pre-TRAIN rules (applicable because {{decedent.name}} died
  before January 1, 2018), reasonable funeral and burial expenses are
  deductible. The deductible amount is the lower of:
    (A) The actual amount spent on funeral and burial, OR
    (B) 5% of the total gross estate (Item 34)

  5% of the gross estate:   ₱{{item34.colC | number}} × 5% = ₱{{funeral_5pct_limit | number}}
  Actual funeral expenses:  ₱{{funeral_actual | number}}
  Deductible amount (lower): ₱{{funeral_deductible | number}}

  {{#if funeral_actual > funeral_5pct_limit}}
  NOTE: The actual funeral expenses (₱{{funeral_actual | number}}) exceeded
  5% of the gross estate. Only ₱{{funeral_5pct_limit | number}} is deductible.
  {{/if}}

{{else}}

  Funeral expenses are NOT deductible under the TRAIN Law (applicable
  because {{decedent.name}} died on or after January 1, 2018). The TRAIN
  Law removed this deduction effective January 1, 2018.

{{/if}}
```

### Template 3H: Judicial and Administrative Expenses (Schedule 5H — pre-TRAIN only)

```
STEP 3H: COURT AND ADMINISTRATIVE COSTS (Schedule 5H) [PRE-TRAIN RULES ONLY]

{{#if deductionRules == "PRE_TRAIN"}}

  Under the pre-TRAIN rules, reasonable judicial (court) and
  administrative costs incurred in settling the estate are deductible.
  These include court filing fees, attorney's fees for estate
  proceedings, and administrator's commissions. There is no cap — the
  full documented amount is deductible.

  Judicial and administrative expenses:   ₱{{judicial_admin_expenses | number}}

{{else}}

  Court and administrative expenses are NOT deductible under the TRAIN
  Law (applicable because {{decedent.name}} died on or after January 1,
  2018). The TRAIN Law removed this deduction effective January 1, 2018.

{{/if}}
```

### Template 3-Subtotal: Total Ordinary Deductions and Net Estate After Ordinary Deductions

```
─────────────────────────────────────────────────────────────────────
STEP 3 SUBTOTAL: ORDINARY DEDUCTIONS AND ADJUSTED ESTATE VALUE
─────────────────────────────────────────────────────────────────────

Adding up all ordinary deductions:

  3A  Debts and claims:                     ₱{{5A.colC | number}}
  3B  Uncollectible receivables:            ₱{{5B.colC | number}}
  3C  Unpaid mortgages and property taxes:  ₱{{5C.colC | number}}
  3D  Casualty losses:                      ₱{{5D.colC | number}}
  3E  Previously taxed property:            ₱{{5E.colC | number}}
  3F  Government bequests:                  ₱{{5F.colC | number}}
  {{#if deductionRules == "PRE_TRAIN"}}
  3G  Funeral expenses:                     ₱{{5G.colC | number}}
  3H  Court and admin costs:                ₱{{5H.colC | number}}
  {{/if}}
  ─────────────────────────────────────────────────────────────────
  TOTAL ORDINARY DEDUCTIONS (Item 35):      ₱{{item35.colC | number}}

  Gross Estate (Item 34):                   ₱{{item34.colC | number}}
  Less ordinary deductions (Item 35):       ₱{{item35.colC | number}}
  ─────────────────────────────────────────────────────────────────
  NET ESTATE AFTER ORDINARY DEDUCTIONS (Item 36):  ₱{{item36.colC | number}}

  {{#if item36.colC == 0 and item34.colC > 0}}
  NOTE: The ordinary deductions have already reduced the estate to
  zero. No further tax computation is needed — the estate tax due
  is ₱0. However, you are still required to file a return if the
  estate has real property or other registrable assets.
  {{/if}}
─────────────────────────────────────────────────────────────────────
```

---

## Section 4: Additional Standard Deductions (Item 37 / Schedule 6)

**Purpose**: Explain the special deductions — standard, family home, medical, RA 4917.

### Template 4A: Standard Deduction (Schedule 6A / Item 37A)

```
─────────────────────────────────────────────────────────────────────
STEP 4A: AUTOMATIC STANDARD DEDUCTION (Item 37A)
─────────────────────────────────────────────────────────────────────

Every estate automatically receives a standard deduction. No
documentation is required — it is deducted from every estate
regardless of what was actually spent. Think of it as the law's
built-in allowance to ease the burden on smaller estates.

  Standard deduction for this estate:   ₱{{standard_deduction | number}}

  {{#if decedent.isNonResidentAlien}}
  Because {{decedent.name}} was a non-resident alien (not a Filipino
  citizen or Philippine resident), the standard deduction is
  ₱500,000 — lower than the ₱{{standard_deduction_citizen | number}}
  available to citizens and residents.
  {{else if deductionRules == "PRE_TRAIN"}}
  Under the pre-TRAIN rules (death before January 1, 2018), the
  standard deduction is ₱1,000,000. (Under the TRAIN Law, it would
  have been ₱5,000,000.)
  {{else}}
  Under the TRAIN Law (death on or after January 1, 2018), the
  standard deduction for Filipino citizens and residents is
  ₱5,000,000.
  {{/if}}
─────────────────────────────────────────────────────────────────────
```

### Template 4B: Family Home Deduction (Schedule 6B / Item 37B)

```
STEP 4B: FAMILY HOME DEDUCTION (Item 37B)

{{#if familyHome != null}}

  The family home receives a special deduction in addition to the
  standard deduction. This recognizes that the surviving family should
  not be forced to sell their home just to pay estate taxes.

  Family home fair market value: ₱{{familyHome.fmv | number}}

  {{#if familyHome.ownership == "conjugal" or familyHome.ownership == "communal"}}
  Because the family home is {{propertyRegime_label}} property (shared
  with {{spouse.name}}), only {{decedent.name}}'s share applies here.
  Decedent's share: ₱{{familyHome.fmv | number}} × 50% = ₱{{familyHome.fmv_half | number}}
  ({{spouse.name}}'s 50% share will be removed at Step 5 — the
  surviving spouse deduction.)
  {{/if}}

  Deduction cap under {{regimeLabel}}: ₱{{familyHomeCap | number}}
  Applicable amount: ₱{{family_home_deduction | number}}
  {{#if family_home_deduction < familyHome_applicable_fmv}}
  (Capped at ₱{{familyHomeCap | number}}; actual value of
  ₱{{familyHome_applicable_fmv | number}} exceeds the cap.)
  {{/if}}

  Requirements: barangay certification of residency, and the property
  must have been the decedent's actual home at the time of death.

{{else}}

  No family home deduction was claimed.
  {{#if decedent.isNonResidentAlien}}
  The family home deduction is not available to non-resident aliens.
  {{/if}}

{{/if}}
```

### Template 4C: Medical Expenses (Schedule 6C / Item 37C)

```
STEP 4C: MEDICAL EXPENSES (Item 37C)

{{#if decedent.isNonResidentAlien}}
  Medical expenses are not deductible for non-resident alien estates.
{{else}}

  Medical expenses incurred during the last year of the decedent's
  life — from {{one_year_before_death | format:"MMMM D, YYYY"}} through
  {{decedent.dateOfDeath | format:"MMMM D, YYYY"}} — are deductible, up
  to a maximum of ₱500,000. Official receipts are required.

  {{#if medical_expenses > 0}}
  Total qualifying medical expenses:   ₱{{total_medical_expenses | number}}
  Maximum allowed:                     ₱500,000
  Medical expense deduction:           ₱{{medical_deduction | number}}
  {{#if total_medical_expenses > 500_000}}
  (Capped at ₱500,000; actual expenses of ₱{{total_medical_expenses | number}} exceeded the cap.)
  {{/if}}
  {{else}}
  No medical expenses within the qualifying 1-year window were entered.
  {{/if}}

{{/if}}
```

### Template 4D: RA 4917 Death Benefits (Schedule 6D / Item 37D)

```
STEP 4D: EMPLOYER DEATH BENEFITS UNDER RA 4917 (Item 37D)

{{#if ra4917_benefits > 0}}

  Death benefits received from a qualifying private employer retirement
  plan (a BIR-approved Tax Qualified Plan under RA 4917) are included
  in the estate but then deducted in full. The net effect is that these
  benefits pass to the heirs without estate tax.

  How this works: The benefit amount of ₱{{ra4917_benefits | number}}
  is counted as an asset in Schedule 2 (personal property), and then
  the identical amount is deducted here. The result is a net estate
  impact of ₱0 for this benefit.

  RA 4917 death benefit deduction:   ₱{{ra4917_benefits | number}}

{{else}}

  No RA 4917 employer death benefits were entered.
  (These apply only to benefits from private-sector employer plans
  approved by the BIR under RA 4917. Government benefits such as GSIS
  are handled differently and are generally excluded from the estate.)

{{/if}}
```

### Template 4-Subtotal

```
─────────────────────────────────────────────────────────────────────
STEP 4 SUBTOTAL: AFTER STANDARD DEDUCTIONS
─────────────────────────────────────────────────────────────────────

  4A  Standard deduction:          ₱{{item37A | number}}
  4B  Family home deduction:       ₱{{item37B | number}}
  4C  Medical expenses:            ₱{{item37C | number}}
  4D  RA 4917 benefits:            ₱{{item37D | number}}
  ─────────────────────────────────────────────────────────────────
  TOTAL SPECIAL DEDUCTIONS (Item 37): ₱{{item37_total | number}}

  Net after ordinary deductions (Item 36):    ₱{{item36.colC | number}}
  Less special deductions (Item 37):          ₱{{item37_total | number}}
  ─────────────────────────────────────────────────────────────────
  NET AFTER ALL DEDUCTIONS (Item 38):         ₱{{item38 | number}}
─────────────────────────────────────────────────────────────────────
```

---

## Section 5: The Surviving Spouse's Share (Item 39)

**Purpose**: Explain the most conceptually difficult deduction — why the spouse's share is removed and how it is computed.

### Template 5A: Surviving Spouse Share (married decedent with community property)

```
─────────────────────────────────────────────────────────────────────
STEP 5: THE SURVIVING SPOUSE'S SHARE (Item 39)
─────────────────────────────────────────────────────────────────────

{{decedent.name}} was married to {{spouse.name}}. Under Philippine
family law, spouses who own community or conjugal property each own
50% of that shared pool. The estate only includes {{decedent.name}}'s
half — not {{spouse.name}}'s half.

We have already listed the full value of community/conjugal property
in Column B to properly track the debts that are owed from that pool.
Now we subtract {{spouse.name}}'s share.

How {{spouse.name}}'s share is calculated:

  Start with:   Total community/conjugal property (Column B gross estate)
  Less:         The actual financial obligations paid from the community
                pool (the Column B debts from Step 3A–3D above)
  Multiply by:  50% — {{spouse.name}}'s half

  Column B gross estate (Item 34, Col B):              ₱{{item34.colB | number}}
  Less Column B ordinary debts (5A+5B+5C+5D, Col B):  ₱{{colB_obligations | number}}
  ──────────────────────────────────────────────────────
  Net community/conjugal pool available:               ₱{{net_community_pool | number}}
  Multiply by 50%:
  ──────────────────────────────────────────────────────
  SURVIVING SPOUSE'S SHARE (Item 39):                  ₱{{item39 | number}}

Note: The vanishing deduction and government bequests (Steps 3E–3F)
are not subtracted from the pool here — only actual financial
obligations (debts, mortgages, taxes, losses) reduce the pool.

  Net after all deductions (Item 38):     ₱{{item38 | number}}
  Less surviving spouse's share (Item 39): ₱{{item39 | number}}
  ──────────────────────────────────────────────────────────────
  NET TAXABLE ESTATE (Item 40):            ₱{{item40 | number}}

  This is the amount on which the estate tax is computed.
─────────────────────────────────────────────────────────────────────
```

### Template 5B: No Spouse Share (single decedent or separation of property)

```
─────────────────────────────────────────────────────────────────────
STEP 5: SURVIVING SPOUSE'S SHARE (Item 39)
─────────────────────────────────────────────────────────────────────

{{#if decedent.maritalStatus == "single" or decedent.maritalStatus == "widowed"}}
  {{decedent.name}} was not married at the time of death. There is no
  surviving spouse share to deduct.
{{else if propertyRegime == "SEPARATION"}}
  {{decedent.name}} and {{spouse.name}} had a complete separation of
  property (prenuptial agreement). Under this regime, there is no
  shared community or conjugal pool, so {{spouse.name}}'s share is ₱0.
{{/if}}

  Surviving spouse's share (Item 39):   ₱0

  Net after all deductions (Item 38):   ₱{{item38 | number}}
  Less surviving spouse's share:        ₱0
  ──────────────────────────────────────────────────────────────
  NET TAXABLE ESTATE (Item 40):         ₱{{item40 | number}}
─────────────────────────────────────────────────────────────────────
```

---

## Section 6: The Tax Computation (Items 41–44)

**Purpose**: Explain how the tax is calculated from the net taxable estate.

### Template 6A: TRAIN flat rate

```
─────────────────────────────────────────────────────────────────────
STEP 6: COMPUTING THE ESTATE TAX
─────────────────────────────────────────────────────────────────────

Under the TRAIN Law, the estate tax is simple: a flat 6% of the net
taxable estate. No matter how large or small the net taxable estate,
the rate is always 6%.

  Net taxable estate (Item 40):         ₱{{item40 | number}}
  × Estate tax rate:                    6% (0.06)
  ──────────────────────────────────────────────────────────────
  ESTATE TAX DUE (Item 42):            ₱{{item42 | number}}

{{#if foreign_tax_credit > 0}}
  Less foreign estate tax credit (Item 43):  ₱{{item43 | number}}
  ──────────────────────────────────────────────────────────────
  NET ESTATE TAX DUE (Item 44):        ₱{{item44 | number}}

  (The foreign tax credit reduces the Philippine estate tax by the
  amount of estate tax already paid to another country on property
  located there. Only Filipino citizens and Philippine residents are
  eligible for this credit.)
{{else}}
  No foreign estate tax credit applies.
  ──────────────────────────────────────────────────────────────
  NET ESTATE TAX DUE (Item 44):        ₱{{item44 | number}}
{{/if}}

{{#if item40 == 0}}
RESULT: The net taxable estate is ₱0 — the estate tax due is ₱0.
You are still required to file BIR Form 1801 if the estate has real
property or other registrable assets.
{{/if}}
─────────────────────────────────────────────────────────────────────
```

### Template 6B: Pre-TRAIN graduated rate

```
─────────────────────────────────────────────────────────────────────
STEP 6: COMPUTING THE ESTATE TAX (PRE-TRAIN GRADUATED RATES)
─────────────────────────────────────────────────────────────────────

Under the pre-TRAIN rules, the estate tax uses a graduated scale.
Larger estates are taxed at higher rates. The scale works in brackets
— like income tax brackets — so only the portion of the estate within
each bracket is taxed at that bracket's rate.

The pre-TRAIN estate tax schedule:
  ₱0 – ₱200,000:            0%  (no tax)
  ₱200,001 – ₱500,000:      5%
  ₱500,001 – ₱2,000,000:    8%
  ₱2,000,001 – ₱5,000,000: 11%
  ₱5,000,001 – ₱10,000,000: 15%
  Over ₱10,000,000:         20%

  Net taxable estate (Item 40):   ₱{{item40 | number}}

  Bracket-by-bracket computation:
  {{#each graduated_brackets}}
    {{bracket_label}}: ₱{{taxable_in_bracket | number}} × {{rate | percent}}
      = ₱{{bracket_tax | number}}
  {{/each}}
  ──────────────────────────────────────────────────────────────
  ESTATE TAX DUE (Item 42):       ₱{{item42 | number}}

{{#if foreign_tax_credit > 0}}
  Less foreign estate tax credit (Item 43):  ₱{{item43 | number}}
  NET ESTATE TAX DUE (Item 44):   ₱{{item44 | number}}
{{else}}
  NET ESTATE TAX DUE (Item 44):   ₱{{item44 | number}}
{{/if}}

{{#if item40 <= 200_000}}
RESULT: The net taxable estate of ₱{{item40 | number}} is at or below
₱200,000. Under the pre-TRAIN rules, estates this size are not taxed.
Estate tax due: ₱0. A return may still be required.
{{/if}}
─────────────────────────────────────────────────────────────────────
```

### Template 6C: Amnesty computation

```
─────────────────────────────────────────────────────────────────────
STEP 6: THE ESTATE TAX AMNESTY COMPUTATION
─────────────────────────────────────────────────────────────────────

⚠ HISTORICAL REFERENCE: The amnesty window closed June 14, 2025.

Under the estate tax amnesty (RA 11213), the tax is a flat 6% of the
amnesty tax base — with a minimum of ₱5,000 always applying.

{{#if track == "TRACK_A"}}

  TRACK A — No prior estate tax return was filed.

  The full net taxable estate is the amnesty base. No portion is
  excluded because no prior payment was made.

  Net taxable estate:          ₱{{item40 | number}}
  Amnesty base (Track A):      ₱{{amnesty_base | number}}

{{else}}

  TRACK B — A prior estate tax return WAS filed.

  Only the additional, previously undeclared portion of the estate
  is covered by the amnesty. The portion already declared and paid
  is not re-taxed.

  Net taxable estate:                      ₱{{item40 | number}}
  Less previously declared net estate:     ₱{{previously_declared | number}}
  ──────────────────────────────────────────────────────────────
  Amnesty base (Track B undeclared):       ₱{{amnesty_base | number}}

  {{#if amnesty_base == 0}}
  NOTE: The previously declared net estate (₱{{previously_declared | number}})
  equals or exceeds the currently computed net estate. The amnesty
  tax base is ₱0 — but the ₱5,000 minimum applies.
  {{/if}}

{{/if}}

  Amnesty base:                ₱{{amnesty_base | number}}
  × Amnesty rate:              6% (0.06)
  ──────────────────────────────────────────────────────────────
  Computed amnesty tax:        ₱{{computed_amnesty_tax | number}}
  Minimum amnesty tax:         ₱5,000
  ──────────────────────────────────────────────────────────────
  AMNESTY TAX DUE:             ₱{{amnesty_tax_due | number}}
  {{#if minimum_applied}}
  (The ₱5,000 minimum was applied because the computed amount of
  ₱{{computed_amnesty_tax | number}} was below the minimum.)
  {{/if}}

  No foreign tax credit is available under the amnesty.

  Amnesty tax due:             ₱{{amnesty_tax_due | number}}
─────────────────────────────────────────────────────────────────────
```

### Template 6D: Dual-path comparison (pre-TRAIN + amnesty)

```
─────────────────────────────────────────────────────────────────────
COMPARISON: ESTATE TAX AMNESTY vs. REGULAR PRE-TRAIN TAX
─────────────────────────────────────────────────────────────────────

Both the amnesty and the regular pre-TRAIN computation are shown
below for comparison. Note: the amnesty window closed June 14, 2025.

                                    AMNESTY         PRE-TRAIN
                                    (RA 11213)      (Graduated)
  ─────────────────────────────────────────────────────────────
  Net Taxable Estate:               ₱{{amnesty_result.item40 | number}} [same for both]
  Tax Rate:                         Flat 6%         See brackets below
  Tax Due:                          ₱{{amnesty_tax_due | number}}     ₱{{pretrain_tax_due | number}}

  {{#if amnesty_tax_due < pretrain_tax_due}}
  ✓ In this case, the amnesty would have resulted in a lower base
    tax: ₱{{savings | number}} less than the regular pre-TRAIN tax.
    (Crossover point: estates above ₱1,250,000 net taxable estate
    generally pay less under the amnesty flat rate than under the
    graduated scale.)
  {{else}}
  ✗ In this case, the regular pre-TRAIN tax is lower than the
    amnesty computation would have been. For small estates
    (particularly below ₱1,250,000 net taxable), the graduated
    pre-TRAIN scale is more favorable than the flat 6% amnesty rate.
  {{/if}}

  IMPORTANT: Even when the base tax favors the pre-TRAIN path,
  the amnesty may still have been beneficial because it waived all
  accrued surcharges and interest on overdue amounts — which this
  engine does not compute. Consult a tax professional for the full
  picture including late-payment penalties.
─────────────────────────────────────────────────────────────────────
```

---

## Section 7: Your Summary

**Purpose**: A clean recap of the entire computation in one view.

```
─────────────────────────────────────────────────────────────────────
YOUR ESTATE TAX COMPUTATION SUMMARY
─────────────────────────────────────────────────────────────────────

Estate of: {{decedent.name}}
Date of death: {{decedent.dateOfDeath | format:"MMMM D, YYYY"}}
Tax rules applied: {{regimeLabel}}
Applicable form: {{formLabel}}

  GROSS ESTATE                                  ₱{{item34.colC | number}}
  Less ordinary deductions (debts, losses)    − ₱{{item35.colC | number}}
                                              ──────────────────────────
  Net after ordinary deductions               = ₱{{item36.colC | number}}
  Less standard deductions (auto + specific)  − ₱{{item37_total | number}}
                                              ──────────────────────────
  Net after all deductions                    = ₱{{item38 | number}}
  Less surviving spouse's share               − ₱{{item39 | number}}
                                              ──────────────────────────
  NET TAXABLE ESTATE                          = ₱{{item40 | number}}
  × Estate tax rate ({{rate_label}})
                                              ──────────────────────────
  ESTATE TAX DUE                              = ₱{{item42 | number}}
  Less foreign tax credit                     − ₱{{item43 | number}}
                                              ══════════════════════════
  NET ESTATE TAX DUE                          = ₱{{item44 | number}}

  {{#if regime == "AMNESTY"}}
  (This is a historical amnesty computation. The amount above reflects
  what would have been due under the amnesty as of the filing deadline
  of June 14, 2025. Actual amounts owed may differ.)
  {{/if}}
─────────────────────────────────────────────────────────────────────
```

---

## Section 8: What To Do Next

**Purpose**: Non-expert guide to filing requirements, deadlines, and payment. Informational only — no computation.

```
─────────────────────────────────────────────────────────────────────
WHAT TO DO NEXT — FILING AND PAYMENT GUIDE
─────────────────────────────────────────────────────────────────────

This computation is for reference only. You are still required to file
an estate tax return with the Bureau of Internal Revenue (BIR) even if
the tax due is ₱0, if the estate includes real property or other
assets requiring clearance.

FILING DEADLINE
  {{#if regime == "TRAIN" or (regime == "AMNESTY" and deductionRules == "TRAIN")}}
  Under the TRAIN Law, the estate tax return is due within ONE YEAR
  of the date of death ({{deadline | format:"MMMM D, YYYY"}}).
  {{else}}
  Under the pre-TRAIN rules, the estate tax return was due within SIX
  MONTHS of the date of death ({{deadline | format:"MMMM D, YYYY"}}).
  {{/if}}

  If the deadline has passed, additional surcharges and interest apply.
  This engine does not compute late-filing penalties.

  Extensions: The BIR may grant up to 30 days for filing. Payment
  extensions may be granted for up to 5 years (if estate proceedings
  are court-supervised) or 2 years (if extrajudicial settlement).

CERTIFIED PUBLIC ACCOUNTANT (CPA) REQUIREMENT
  {{#if item34.colC > cpa_threshold}}
  Because the gross estate exceeds ₱{{cpa_threshold | number}}, this
  return must be accompanied by a statement certified by a CPA
  (a licensed Certified Public Accountant).
  {{else}}
  The gross estate is below ₱{{cpa_threshold | number}}, so a CPA
  certification is not required, although professional assistance
  is recommended.
  {{/if}}

  {{#if regime == "TRAIN" or (regime == "AMNESTY" and deductionRules == "TRAIN")}}
  (CPA required for gross estates exceeding ₱5,000,000 under the
  TRAIN Law.)
  {{else}}
  (Under the pre-TRAIN rules, the CPA threshold was ₱2,000,000.)
  {{/if}}

WHERE TO FILE
  {{#if decedent.isNonResidentAlien}}
  For non-resident alien decedents: file at Revenue District Office
  (RDO) No. 39, South Quezon City.
  {{else}}
  File at the BIR Revenue District Office (RDO) with jurisdiction over
  the decedent's last place of residence. If the decedent had no
  Philippine residence, file at the RDO where the property is located.
  {{/if}}

HOW TO PAY
  Payment is due at the time of filing. You may pay:
    • At the BIR's Authorized Agent Banks (AABs)
    • At BIR's online payment facilities (eBIRForms, GCash, etc.)

  If the estate cannot pay in full at filing, you may request an
  installment arrangement: pay in two equal installments within
  2 years, with no interest — provided you are on schedule.

WHAT THIS COMPUTATION DOES NOT COVER
  This engine computes the base estate tax only. It does NOT compute:
    × Surcharges for late filing (25% or 50%)
    × Interest for late payment (12% per year)
    × Compromise penalties
    × Documentary Stamp Tax on transfers
    × Capital Gains Tax on sale of inherited assets
    × Transfer fees for land registration

  If the filing deadline has passed, consult a tax lawyer or accountant
  to determine the total amount due including penalties.

NEXT STEPS
  1. Gather supporting documents (titles, bank certificates, receipts)
  2. Complete BIR {{formLabel}}
  3. File and pay at the appropriate RDO or authorized bank
  4. Obtain the BIR's Certificate Authorizing Registration (CAR)
     to transfer ownership of real property and other assets
─────────────────────────────────────────────────────────────────────
```

---

## Special Cases and Conditional Content

### Non-Resident Alien Notice (rendered in relevant sections)

```
NRA NOTICE: Because {{decedent.name}} was a non-resident alien at the
time of death, this computation includes only Philippine-situated
property. Foreign assets are not subject to Philippine estate tax.

The following adjustments apply:
  • Standard deduction: ₱500,000 (not ₱{{standard_deduction_citizen | number}})
  • Family home deduction: not available
  • Medical expenses deduction: not available
  • RA 4917 death benefits: not available
  • Ordinary deductions (debts, losses, etc.): proportionally adjusted
    — only the fraction equal to Philippine assets ÷ total worldwide
    assets is deductible
  • Foreign tax credit: not available
  • Reciprocity: intangible personal property is excluded if the
    decedent's home country exempts Filipinos from estate tax there.
```

### Sec. 87(d) vs. Sec. 86(A)(3) Distinction Notice

```
NOTE ON CHARITABLE DEDUCTIONS:

There are two different ways the law handles transfers to charitable or
public-benefit recipients:

  (1) Transfers to PRIVATE charitable, educational, or religious
      institutions → excluded from the estate ENTIRELY before any
      computation (Section 87(d)). Shown in Step 1 above.

  (2) Transfers to the PHILIPPINE GOVERNMENT or government units →
      counted in the estate first, then DEDUCTED in Step 3F.

This distinction matters: private charity bequests are not counted in
the gross estate (Step 2) at all. Government bequests are counted in
the gross estate and then deducted.
```

### RA 4917 Pass-Through Notice

```
NOTE ON RA 4917 EMPLOYER DEATH BENEFITS:

The RA 4917 death benefit of ₱{{ra4917_benefits | number}} appears
twice in this computation:
  • INCLUDED in personal property (Step 2C): ₱{{ra4917_benefits | number}}
  • DEDUCTED as a special deduction (Step 4D): ₱{{ra4917_benefits | number}}

Net estate impact: ₱0. This is intentional — the law requires the
amount to flow through the estate (so it is disclosed to the BIR)
while granting an equivalent deduction so no tax is imposed on it.
```

---

## Rendering Rules for the Spec

The following rules govern how the explainer is rendered by the engine:

1. **Zero-value deductions**: Every deduction sub-section (3A–3H, 4B–4D) is always rendered. If the value is ₱0, the section shows "₱0" and one sentence explaining why (not claimed, not applicable, not available for this regime/residency type).

2. **Format numbers**: All peso amounts are formatted with commas and no decimals (e.g., `₱1,234,567`). The `₱` symbol always precedes the number. No "PHP" abbreviation in the explainer.

3. **Format percentages**: All percentages are written as "X%" in prose and "X% (0.XX)" on the first mention per section, just once — e.g., "6% (0.06)".

4. **Regime label strings** (used throughout as `{{regimeLabel}}`):
   - TRAIN: `"TRAIN Law (RA 10963)"`
   - PRE_TRAIN: `"Pre-TRAIN Rules (NIRC as enacted by RA 8424)"`
   - AMNESTY: `"Estate Tax Amnesty (RA 11213, as amended by RA 11956)"`

5. **Form label strings** (used as `{{formLabel}}`):
   - TRAIN: `"BIR Form 1801 (January 2018 revision)"`
   - PRE_TRAIN: `"BIR Form 1801 (June 2006 revision)"`
   - AMNESTY: `"Estate Tax Amnesty Return (ETAR) + Acceptance Payment Form (APF)"`

6. **CPA threshold**: ₱5,000,000 for TRAIN; ₱2,000,000 for PRE_TRAIN/AMNESTY with pre-TRAIN deduction rules.

7. **Filing deadline label**: Display as fully spelled-out date (e.g., "March 15, 2023") not ISO format.

8. **Amnesty filing-window-closed notice**: Must appear in Section 1 template and in Section 6 template, both times the amnesty is discussed. Never omit this notice on amnesty output.

9. **Dual-path comparison**: Rendered between Sections 6 and 7, only when `displayDualPath = true`.

10. **Graduated bracket table**: In Section 6B, always show all applicable brackets, even those with ₱0 taxable amount (to show the full scale). Example:
    ```
    ₱0 – ₱200,000:         ₱0 taxable × 0% = ₱0
    ₱200,001 – ₱500,000:   ₱300,000 taxable × 5% = ₱15,000
    ₱500,001 – ₱2,000,000: ₱1,500,000 taxable × 8% = ₱120,000
    ₱2,000,001 – ₱5,000,000: ₱150,000 taxable × 11% = ₱16,500
    (Brackets 5 and 6 not reached — net taxable estate ₱1,950,000)
    ```

---

## Test Implications

| Test ID | Scenario | Key Explainer Requirement |
|---------|---------|--------------------------|
| EX-01 | TV-01: Simple TRAIN, single | Section 1A rendered; Section 5B (no spouse) rendered; Section 6A with flat 6% |
| EX-02 | TV-02: TRAIN married ACP | Section 2G ACP regime note; Section 4B with ₱10M cap; Section 5A spouse share |
| EX-03 | TV-03: TRAIN CPG vanishing | Section 2G CPG regime note; Section 3E full 5-step vanishing deduction breakdown |
| EX-04 | TV-04: TRAIN NRA | NRA notice rendered in Sections 2, 3, 4; proportional deduction explanation; ₱500K standard |
| EX-05 | TV-05: Zero tax TRAIN | Section 6A shows ₱0; note rendered that filing still required |
| EX-06 | TV-06: Deductions exceed GE | Item 36 floor note rendered; tax = ₱0 |
| EX-07 | TV-07: Pre-TRAIN simple | Section 1B pre-TRAIN; Section 3G funeral template; Section 6B graduated table |
| EX-08 | TV-08: Pre-TRAIN CPG | All pre-TRAIN templates; Section 3G+3H both active; Section 2G CPG note |
| EX-09 | TV-09: Amnesty Track A | Section 1C amnesty; 6C amnesty computation; dual-path comparison (Section 6D) |
| EX-10 | TV-10: 100% vanishing deduction | Section 3E with 100% percentage, ratio=1.0 |
| EX-11 | Any estate with RA 4917 | Pass-through notice rendered; both inclusion and deduction shown |
| EX-12 | Any estate with Sec. 87 exclusions | Section 2A rendered with exclusion details |
| EX-13 | NRA with reciprocity exemption | Reciprocity note in Section 2D (personal property) |
| EX-14 | TRAIN-era amnesty (rate parity) | Section 1D rendered; rate-parity notice prominent |

---

## Edge Cases

### EC-EX-01: All deductions result in zero net estate before standard deduction

The explainer must show ₱0 at Item 36 and note: "All debts and deductions have already reduced the estate to zero. The standard deduction and other special deductions still appear but have no additional effect. Estate tax due: ₱0."

### EC-EX-02: Amnesty minimum ₱5,000 applied

Section 6C must clearly show: "Computed tax: ₱{{computed}}. Because this is below the ₱5,000 minimum required by law, the amnesty tax due is ₱5,000."

### EC-EX-03: Foreign tax credit equals estate tax

Show: "The foreign estate tax credit (₱{{credit}}) fully offsets the estate tax due (₱{{item42}}). Net estate tax payable to the BIR: ₱0." A return is still required.

### EC-EX-04: No deductions claimed at all

Render all deduction sections with ₱0 and brief "why not" explanations. The standard deduction (4A) still applies automatically and must be shown.

### EC-EX-05: Track B — previously declared amount > current net estate

Show: "Your previously declared net estate (₱{{previously_declared}}) equals or exceeds the net estate computed here (₱{{item40}}). The Track B undeclared portion is ₱0. The amnesty minimum of ₱5,000 applies."

### EC-EX-06: Single decedent with family home (no halving)

For exclusive-owned family home, deduction = min(FMV, cap) — no halving. Explainer explicitly: "Because the family home was exclusively {{decedent.name}}'s (not community property), the full fair market value is used for the deduction formula."

### EC-EX-07: Conjugal family home exceeding both the cap and the halved-value cap

Show both the halving calculation and the cap enforcement. Example: "Fair market value: ₱12,000,000. Decedent's share (50%): ₱6,000,000. Deduction cap: ₱10,000,000. Deductible amount: ₱6,000,000 (the lower of the two)."

---

## Summary

The explainer-format defines eight template sections covering every computation phase from regime selection through filing guidance. Key design properties:

- **Always-rendered sections**: 1 (regime), 2I (gross estate total), 3-subtotal, 4-subtotal, 5 (spouse share), 6 (tax computation), 7 (summary), 8 (next steps)
- **Conditionally rendered**: Sec. 87 exclusions (2A), individual deduction items 3A–3H, individual special deductions 4B–4D, dual-path comparison, NRA notices
- **Zero-value sections**: Shown with brief explanation, never silently omitted
- **Template variables**: All `{{variable}}` placeholders map to engine output fields in `data-model.md` (specifically `EngineOutput`, `Form1801Output`, `ETAROutput`, `ExplainerData`)
- **Regime-aware**: Every template has conditional blocks for TRAIN, PRE_TRAIN, and AMNESTY differences
- **Non-expert language**: No unexplained legal citations, no abbreviations without expansion, concrete numbers throughout
- **Filing guidance (Section 8)**: Provides actionable next steps without overstating legal advice
