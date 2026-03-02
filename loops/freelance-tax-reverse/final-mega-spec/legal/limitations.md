# Limitations — What TaxKlaro Does NOT Cover

**Status:** COMPLETE
**Last updated:** 2026-03-02
**Cross-references:**
- Full disclaimer text: [legal/disclaimers.md](disclaimers.md)
- Engine scope: [engine/pipeline.md](../engine/pipeline.md)
- Manual review flags (things engine can partially handle): [domain/manual-review-flags.md](../domain/manual-review-flags.md)
- Scenarios covered: [domain/scenarios.md](../domain/scenarios.md)

---

## Purpose

This document enumerates, exhaustively, every tax obligation, filing type, income type, taxpayer class, and situation that TaxKlaro explicitly does NOT handle. It serves three purposes:

1. **Scope boundary for the forward loop:** Prevents the engine from being extended in directions not intended.
2. **Legal protection:** Explicit scope exclusions reduce liability for situations outside the tool's design.
3. **User communication:** The "What This Tool Doesn't Cover" section of the UI reads from this document.

A limitation is "explicit" when the engine will either (a) return an `ERR_OUT_OF_SCOPE` error for that input, (b) display an in-app notice that the scenario is not supported, or (c) refer the user to a professional. The type of response is specified for each limitation below.

---

## Part 1: Tax Types Not Covered

TaxKlaro computes only **Philippine individual income tax under NIRC Section 24(A)** for self-employed persons, professionals, and sole proprietors. The following taxes are outside scope:

### 1.1 Value-Added Tax (VAT) — 12%

**Not covered.** TaxKlaro determines whether the user has crossed the ₱3,000,000 VAT registration threshold and displays an obligation notice (see `domain/decision-trees.md § DT-11`). However, it does NOT compute:
- Output VAT on sales
- Input VAT credits
- VAT returns (BIR Form 2550M, 2550Q)
- VAT refund claims
- VAT on importation
- Zero-rated VAT transactions (export services, PEZA locators)

**Engine response when user reports VAT-registered status:** Engine continues to compute income tax under Paths A and B (Path C blocked — see `domain/decision-trees.md § DT-05`). Displays notice: "VAT computation is not supported. Use BIR eBIRForms or a VAT-capable accounting tool (e.g., Taxumo, JuanTax) to compute your VAT obligations separately."

### 1.2 Percentage Tax — 3% (Form 2551Q)

**Partially covered — determination and amount only; not filing.** TaxKlaro computes the quarterly percentage tax amount (3% of gross quarterly sales/receipts under NIRC Sec. 116 as amended) and includes it in the total tax cost comparison for Path A and Path B. It does NOT:
- Generate or prefill BIR Form 2551Q
- Handle ATC codes for all business types beyond PT-010 (sale of services/products by persons exempt from VAT)
- Compute percentage tax for specific industries covered by other PT ATC codes (PT-020 through PT-160)
- Handle percentage tax under NIRC Sec. 117–127 (domestic carriers, international carriers, banks, insurance, overseas dispatch, etc.)

**Engine response for special percentage tax schedules:** Displays notice: "Your business type may be subject to a specialized percentage tax schedule under NIRC Sections 117–127 (e.g., domestic carriers, banks, franchise holders). TaxKlaro uses the general 3% rate under Sec. 116. Verify the applicable rate with a CPA or your Revenue District Office."

### 1.3 Capital Gains Tax

**Not covered.** TaxKlaro does NOT compute:
- 6% capital gains tax on sale of real property classified as capital asset (NIRC Sec. 24[D][1])
- 15% capital gains tax on net capital gain from sale of unlisted shares of stock (NIRC Sec. 24[C])
- Capital gains tax on sale of listed shares (0.6% stock transaction tax under Sec. 127[A])
- Ordinary gain treatment for assets used in trade (which would be part of gross income — this IS included in gross receipts if the taxpayer reports it)

**Engine response:** If user categorizes income as "capital gains from real property" or "capital gains from shares," engine displays: "Capital gains tax is not computed by TaxKlaro. Capital gains from real property are taxed at 6% of gross selling price or zonal value (whichever is higher) under NIRC Sec. 24(D)(1) and are reported on BIR Form 1706. Capital gains from unlisted shares are taxed at 15% under NIRC Sec. 24(C). Consult a CPA or BIR for these computations."

### 1.4 Donor's Tax

**Not covered.** TaxKlaro does not compute donor's tax under NIRC Sec. 98–104 (as amended by TRAIN, now 6% flat rate above ₱250,000 per calendar year).

### 1.5 Estate Tax

**Not covered.** TaxKlaro does not compute estate tax under NIRC Sec. 84–97 (as amended by TRAIN, now 6% flat rate of net estate above ₱5,000,000 standard deduction).

### 1.6 Documentary Stamp Tax (DST)

**Not covered.** TaxKlaro does not compute DST under NIRC Sec. 173–201 on loan agreements, deeds of sale, certificates, promissory notes, and other taxable documents.

### 1.7 Excise Tax

**Not covered.** TaxKlaro does not compute excise tax under NIRC Sec. 129–172 on alcohol, tobacco, petroleum products, minerals, automobiles, non-essential goods, and cosmetic procedures.

### 1.8 Local Business Tax (LGU)

**Not covered.** Local business taxes imposed by Local Government Units (LGU) under the Local Government Code (RA 7160) are not computed. These vary by LGU and business type and can range from 0.5% to 2% of gross sales. Freelancers registered in certain cities may owe LBT in addition to national taxes.

### 1.9 Real Property Tax (RPT)

**Not covered.** TaxKlaro does not compute Real Property Tax imposed by LGUs.

### 1.10 Community Tax / Cedula

**Not covered.** The community tax certificate (cedula) fee computation is outside scope.

---

## Part 2: Taxpayer Types Not Covered

### 2.1 Corporations and Partnerships

**Not covered.** TaxKlaro is designed exclusively for **individual** taxpayers (natural persons). It does NOT compute:
- Regular corporate income tax (RCIT) — 25% or 20% for small corps
- Minimum Corporate Income Tax (MCIT)
- Improperly Accumulated Earnings Tax (IAET)
- Partnership income tax (except where partners receive distributive shares as individual income — see 2.2 below)
- One-Person Corporation (OPC) tax (same RCIT rates as regular corps)

**Engine response:** If user identifies as a corporation or registered OPC, engine returns `ERR_OUT_OF_SCOPE` with message: "TaxKlaro computes tax for individual self-employed persons, professionals, and sole proprietors only. Corporations, One-Person Corporations (OPCs), and partnerships file different tax returns and pay corporate income tax. Use BIR eBIRForms (Form 1702) or consult a CPA for corporate tax computation."

### 2.2 Partners in a General Professional Partnership (GPP)

**Partially covered.** Individual partners of a GPP receive a distributive share of GPP net income, which is treated as professional income for the individual and is subject to individual income tax. TaxKlaro CAN compute the individual partner's income tax on their GPP distributive share, but it does NOT:
- Compute the GPP's own income tax liability (GPPs pay 0% at the GPP level)
- Allocate GPP income among partners
- Handle the GPP's informational return (Form 1702)

**Engine behavior:** The user enters their GPP distributive share as professional income (gross receipts). The engine treats it like any other professional income. A manual review flag (MRF-025) is displayed advising the user that GPP income is not reduced by the GPP-level partnership tax (there is none) and that their share includes proportional deductible expenses from the GPP books.

### 2.3 Non-Resident Alien Individuals (NRAI)

**Not covered.** TaxKlaro does not compute income tax for:
- Non-resident alien individuals engaged in trade or business in the Philippines (taxed at graduated rates under Sec. 24[A][1] + flat 25% on passive income under Sec. 25[A])
- Non-resident alien individuals not engaged in trade or business (taxed at 25% final flat rate on gross income under Sec. 25[B])

### 2.4 Non-Resident Filipino Citizens

**Partially covered.** Filipino citizens residing abroad (including OFWs) are taxed only on income derived from Philippine sources. TaxKlaro can compute tax on Philippine-source self-employment or professional income for non-resident citizens, but it does NOT:
- Determine residency status or sourcing rules
- Handle the foreign tax credit under Sec. 34(C)(3)
- Compute tax on income earned abroad (which is exempt for non-resident citizens)

**Engine behavior:** Manual review flag MRF-017 is triggered when user indicates foreign-source income, directing them to a CPA for proper sourcing analysis.

### 2.5 Aliens Employed by Regional Headquarters / Offshore Banking Units

**Not covered.** Special 15% preferential income tax for certain alien employees under Sec. 25(C), (D), (E) is not computed.

### 2.6 Cooperatives and Non-Profit Organizations

**Not covered.** Cooperatives duly registered with the Cooperative Development Authority (CDA) and non-stock, non-profit organizations (NPOs) may be entitled to income tax exemptions under NIRC Sec. 30. TaxKlaro does not evaluate or apply these exemptions.

---

## Part 3: Income Types Not Covered or Partially Covered

### 3.1 Compensation Income (Employee Salary)

**Computation: NOT covered.** TaxKlaro does not compute the withholding tax on compensation that an employer must remit on behalf of an employee. However, for **mixed-income earners** (compensation + self-employment income), TaxKlaro accepts the user's total taxable compensation as an input (net of non-taxable benefits, de minimis, personal exemption equivalents) and incorporates it into the combined income tax computation for the annual return only.

**What this means:** For the compensation component, the user must input the total taxable compensation figure from their BIR Form 2316 (Certificate of Compensation Payment/Tax Withheld). TaxKlaro does not break down the compensation into salary, allowances, bonuses, de minimis benefits, or compute the employer's tax withheld.

### 3.2 Passive Income Subject to Final Tax

**Not covered.** The following passive income categories are subject to final withholding tax at source and are NOT included in individual income tax under Sec. 24(A). TaxKlaro does NOT compute these, and users should NOT include them in gross receipts:
- Interest income from bank deposits (20% final tax, or 15% for long-term instruments ≥5 years, or 7.5% for FCDU deposits)
- Dividends from domestic corporations (10% final tax)
- Royalties (10% final tax on books/literary/musical works; 20% on other royalties)
- Prizes over ₱10,000 (20% final tax)
- Winnings from PCSO and lotto over ₱10,000 (20% final tax)
- Rent from real property (this IS ordinary income — treated as gross receipts if it is the taxpayer's primary business activity)

**Engine behavior:** The income type selection screen (Wizard Step WS-02) includes a "Final Tax Income" option that, when selected, redirects the user with: "Income subject to final withholding tax (interest, dividends, royalties, prizes) is taxed at source and is not included in your income tax return under NIRC Sec. 24(A). TaxKlaro does not compute final withholding taxes. Contact your income payor or a CPA for these."

### 3.3 Income Under Tax Treaties

**Not covered.** The Philippines has tax treaties with 43 countries that may reduce or eliminate Philippine withholding tax on income paid to residents of treaty partners (e.g., dividend WHT reduced from 25% to 15% under the RP-US Tax Treaty). TaxKlaro does NOT apply treaty benefits. Manual review flag MRF-017 is triggered for foreign-source income.

### 3.4 Income from Illegal Sources

**Not covered and not applicable.** Income from illegal sources is technically taxable under NIRC but TaxKlaro makes no provision for this. All income input is treated as lawfully earned.

---

## Part 4: Special Tax Incentive Regimes

### 4.1 PEZA Locator Income Tax Incentives

**Not covered.** Persons registered with the Philippine Economic Zone Authority (PEZA) as ecozone locators may be entitled to income tax holiday (ITH) and subsequent 5% Special Corporate Income Tax (SCIT) on gross income. These incentives are specific to PEZA-registered entities and are not applicable to individual self-employed filers under standard NIRC Sec. 24(A).

**Engine response:** If user indicates PEZA registration, engine displays: "PEZA-registered businesses are subject to special income tax incentives (Income Tax Holiday and 5% Special Corporate Income Tax) that are outside the scope of TaxKlaro. Consult a CPA specializing in PEZA tax incentives."

### 4.2 BOI-Registered Enterprises

**Not covered.** Entities registered with the Board of Investments (BOI) under the Omnibus Investments Code (EO 226) or the CREATE Act (RA 11534) for fiscal incentives (ITH, Enhanced Deductions) are outside scope. Individual self-employed persons with BOI-registered activities should consult a CPA.

### 4.3 BMBE (Barangay Micro Business Enterprise) Exemption

**Partially handled via manual review flag.** Under RA 9178 (BMBE Act of 2002), barangay micro business enterprises with total assets not exceeding ₱3,000,000 are exempt from income tax. TaxKlaro does NOT automatically apply this exemption because BMBE registration must be verified with the LGU.

**Engine behavior:** When user reports total business assets ≤ ₱3,000,000 and indicates awareness of BMBE, manual review flag MRF-029 is triggered: "If your business is registered as a Barangay Micro Business Enterprise (BMBE) with your Local Government Unit, you may be exempt from income tax under RA 9178. TaxKlaro cannot verify your BMBE registration status and has NOT applied this exemption. Show your BMBE Certificate of Authority to a CPA or BIR examiner to confirm your exemption."

### 4.4 TIEZA Tourism Enterprises

**Not covered.** Tourism enterprises accredited by the Tourism Infrastructure and Enterprise Zone Authority (TIEZA) are outside scope.

### 4.5 CREATE Act Fiscal Incentives for Registered Business Enterprises (RBEs)

**Not covered.** The special tax incentives available to Registered Business Enterprises under RA 11534 (CREATE Act) — including ITH, Enhanced Deductions, and Special Corporate Income Tax — require corporate registration and are not available to individual self-employed filers under Sec. 24(A).

---

## Part 5: Filing Procedures Not Supported

### 5.1 Actual Filing with BIR

**Not covered.** TaxKlaro does not integrate with BIR eBIRForms, the BIR Electronic Filing and Payment System (eFPS), or any authorized eTSP to file returns. The tool produces computations and planning documents; the user must manually file using:
- BIR eBIRForms offline package (download at bir.gov.ph)
- eFPS (for eFPS-enrolled taxpayers)
- An authorized eTSP (JuanTax, Taxumo, etc.)

### 5.2 Tax Payment Processing

**Not covered.** TaxKlaro does not process tax payments. Users pay through: BIR-accredited bank payment channels, GCash, Maya, Land Bank LinkBiz Portal, or BIR eBIRForms integrated payment.

### 5.3 BIR Registration (TIN Application)

**Not covered.** TaxKlaro does not register users with the BIR or process TIN applications. Users who are not yet BIR-registered must file BIR Form 1901 at their RDO.

### 5.4 BIR Audit Response or Tax Protest

**Not covered.** TaxKlaro does not assist with BIR audit response, Formal Letter of Demand (FLD) reply, Protest of Assessment, Appeal to Court of Tax Appeals (CTA), or any other administrative or judicial tax proceeding. Users who receive a BIR audit notice must consult a CPA or tax attorney.

### 5.5 Bookkeeping and Official Receipts

**Not covered.** TaxKlaro does not maintain books of account, generate official receipts, or provide accounting records that would satisfy BIR record-keeping requirements under NIRC Sec. 232–235 and EOPT Act provisions.

### 5.6 BIR Form 1902 (Employee Registration) and Form 1904

**Not covered.** Registration forms for new employees and one-time taxpayers are outside scope.

---

## Part 6: Other Specific Exclusions

### 6.1 Foreign Tax Credit

**Not covered.** The foreign tax credit under NIRC Sec. 34(C)(3) — available to resident citizens and domestic corporations on income taxed abroad — is not computed by TaxKlaro. Manual review flag MRF-017 is triggered when foreign income is detected.

### 6.2 Tax Deductions Available Only to Corporations

The following deductions are available only to corporations and NOT to individuals:
- Charitable contributions above the NIRC Sec. 34(H) ceiling for individuals (only accredited NGO contributions are fully deductible for individuals; other contributions are capped)
- Depletion of oil and gas wells and mines under Sec. 34(G) — treated as available for individual sole proprietors engaged in mining/oil (rare edge case, MRF-030 flagged)
- Research and development under Sec. 34(I)(2) capitalized over 60 months (available to individuals as well — this IS included in itemized deductions in TaxKlaro)

### 6.3 Retirement Benefits Exclusion

**Partially handled.** Retirement benefits from BIR-qualified private pension plans (RA 4917) received by employees upon retirement (age 50+ with 10+ years of service) are excluded from gross income. TaxKlaro does NOT compute the retirement exclusion because it is relevant for employees (not self-employed) and requires plan qualification documentation. If a mixed-income earner receives a qualifying retirement benefit, they should exclude it from taxable compensation before entering figures in TaxKlaro.

### 6.4 13th Month Pay and Other Benefits Exemption

**Not applicable for self-employed; noted for mixed income users.** The ₱90,000 exclusion for 13th month pay and other benefits under NIRC Sec. 32(B)(7)(e) applies to compensation income only. For mixed-income earners using TaxKlaro, the user must enter their taxable compensation net of the ₱90,000 exclusion (i.e., only the amount exceeding ₱90,000 in 13th month + other benefits is taxable compensation). TaxKlaro does NOT perform the ₱90,000 exclusion computation — the user must do this before entering their taxable compensation amount.

### 6.5 DOLE-Mandated Benefits and SSS/PhilHealth/HDMF Contributions

**Not applicable.** SSS, PhilHealth, and Pag-IBIG/HDMF contributions by self-employed individuals are NOT deductible from gross income for income tax purposes (unlike the employer's share, which is deductible as a business expense). Voluntary contributions to SSS, PhilHealth, or HDMF by self-employed persons are personal and not deductible. TaxKlaro does not include these as deductions.

**Exception:** An employer who hires employees may deduct the employer's share of SSS/PhilHealth/HDMF as a business expense under NIRC Sec. 34(A). This IS included in TaxKlaro's itemized deductions (see `domain/lookup-tables/itemized-deductions.md § 1.16`).

### 6.6 Excess Quarterly Tax Payments from Prior Year

**Not covered.** If a taxpayer had an overpayment or excess CWT in a prior taxable year that was elected to be carried over (rather than refunded), TaxKlaro does not automatically import the prior year carryover. The user must manually include the carryover amount as an additional CWT credit in the current year's computation.

### 6.7 Tax on Alien Income from Abroad

**Not covered.** Income of aliens (resident or non-resident) earned from abroad is either exempt or covered by special rules. TaxKlaro serves Filipino citizens and registered taxpayers in the Philippines.

### 6.8 Agricultural and Fisheries Income Special Rules

**Not covered.** Income from farming and fishing activities may qualify for special deductions and exclusions. If such income is the user's primary business, TaxKlaro's standard self-employment computation may not be accurate. Manual review flag MRF-031 is triggered for agricultural income indicators.

### 6.9 Income from Mining Operations

**Not covered.** Mining contractors and mine operators are subject to specialized taxation under NIRC and the Mining Act. TaxKlaro is not designed for mining income. If the user identifies as a mining operator, engine displays out-of-scope notice.

---

## Part 7: UI Disclosure — "What This Tool Doesn't Cover"

**Placement:** Static page at `/about#limitations` and linked from the onboarding disclaimer (Section 3 of `disclaimers.md`). Also available via footer link: "Scope & Limitations."

**Page heading:** What TaxKlaro Does (and Doesn't) Cover

**Page subheading:** TaxKlaro is designed specifically for one thing: helping Filipino freelancers, self-employed professionals, and sole proprietors find the lowest legal income tax regime under NIRC Section 24(A).

**Section: What we compute**
- Income tax for self-employed individuals and professionals (BIR Form 1701 / 1701A filers)
- Comparison of all three regimes: 8% Flat Rate, Graduated + OSD, Graduated + Itemized Deductions
- Quarterly income tax (Form 1701Q) using the cumulative method
- Percentage tax (3%, Form 2551Q) for non-VAT taxpayers
- Creditable withholding tax credits from BIR Form 2307
- Mixed income: salary + self-employment combined annual return
- Penalty estimates for late filing

**Section: What we do not compute**
- Value-Added Tax (VAT) returns — use BIR eBIRForms or Taxumo/JuanTax for VAT
- Corporate income tax — TaxOptimizer is for individuals only
- Capital gains tax on real property (6%) or shares (15%)
- Donor's tax, estate tax, documentary stamp tax, excise tax
- Local business taxes imposed by LGUs
- Income subject to final withholding tax (interest, dividends, royalties, prizes)
- Special incentive regimes: PEZA, BOI, BMBE, TIEZA (partial notice provided)
- Actual BIR filing or tax payment processing
- BIR audit defense or protest proceedings
- Foreign tax credits or tax treaty benefits

**Section: When you need a CPA (not just this tool)**
- Filing for the first time as a self-employed individual
- Claiming itemized deductions over ₱500,000
- Dealing with a BIR notice, assessment, or audit
- Operating across PEZA, BOI, or other special economic zones
- Reporting income from foreign clients or foreign-based platforms
- Managing a business with employees and payroll
- Switching your tax regime from a prior year's election

**CTA:** [Compute my income tax now →](/compute)

---

## Part 8: Limitation Version History

| Version | Effective Date | Changes |
|---------|---------------|---------|
| 1.0 | 2026-03-01 | Initial version — product launch |
