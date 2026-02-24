# Wave 1 Analysis: nirc-other-taxes

**Source**: NIRC Title III (Sec. 98–104), Title IV (Sec. 105–115), Title V (Sec. 116–127), Title VI (Sec. 129–172), Title VII (Sec. 173–201); as amended by TRAIN Law (RA 10963), CREATE Act (RA 11534), EOPT Act (RA 11976)
**Forms**: BIR 1800, 2550Q, 2550M, 2551Q, 2000, 2000-OT
**Analysis Date**: 2026-02-24

---

## Overview

NIRC Titles III–VII cover a wide swath of taxes beyond income tax: donor's tax, VAT, percentage tax, excise tax, and documentary stamp tax. Several of these are computation-heavy and involve large populations of filers. This analysis identifies five distinct domains with automation potential.

**Note**: Estate tax (NIRC Title III, Sec. 84–97) is excluded — already covered by the `estate-tax-reverse` loop.

---

## Domain 1: Donor's Tax (BIR Form 1800)

### Governing Law
- NIRC Sec. 98–104 (Title III — Transfer Taxes), as amended by TRAIN Law (RA 10963)
- Revenue Regulations No. 12-2018 (implementing rules for TRAIN donor's tax)
- BIR Form 1800

### Computation Rules (Fully Deterministic)

Post-TRAIN, donor's tax is a flat 6% on cumulative net gifts exceeding ₱250,000 in a calendar year:

```
Step 1: Determine Fair Market Value of donated property at time of donation
Step 2: Deduct encumbrances assumed by donee (if any)
Step 3: Net Gift for this donation = FMV − encumbrances
Step 4: Cumulative Net Gifts (YTD) = sum of all net gifts in the calendar year so far
Step 5: Taxable Net Gift = max(0, Cumulative Net Gifts − ₱250,000 exemption)
Step 6: Total Donor's Tax Due = Taxable Net Gift × 6%
Step 7: Tax Payable Now = Total Donor's Tax Due − Donor's Tax Previously Paid (earlier donations same year)
```

Key inputs: FMV of asset (land = higher of BIR zonal value or assessed value), assumed liabilities, prior donations in same calendar year.

Special rule: Donor's tax paid is creditable against estate tax if donor dies within 5 years — tapering credit from 100% (year 1) to 20% (year 5) per NIRC Sec. 86(E).

### Who Currently Does This
- Tax lawyers or CPAs prepare donor's tax returns for real property donations
- Notary public required for Deed of Donation (separate step)
- BIR RDO processes the Certificate Authorizing Registration (CAR) needed before RD will transfer title
- Multi-agency workflow: donor → notary → BIR RDO → Registry of Deeds

### Market Size
- Inter-family real property transfers are extremely common in the Philippines — children receiving land from parents, grandparents transferring barangay lots, etc.
- Rough proxy: BIR 2021 annual report shows transfer taxes (estate + donor's combined) at ~₱15–20B, implying hundreds of thousands of transactions
- PSA data shows ~600K property titles transferred annually; a significant fraction involve donation or part-donation (especially with nominal consideration)
- Estimated annual donor's tax filers: 50,000–200,000 per year

### Professional Fee Range
- Lawyer/CPA preparation of BIR Form 1800: ₱5,000–₱25,000 depending on value
- Notarization of Deed of Donation: ₱200–₱5,000 + 1–2% of property value for high-value items
- Registry of Deeds registration: 0.25% of FMV (minimum ₱100)
- Total professional cost for a mid-value donation (₱2M property): ₱20,000–₱80,000
- The computation itself (donor's tax = 6% × excess over ₱250K) takes minutes; professionals charge for "guidance" and multi-agency navigation

### Pain Indicators
- 30-day filing deadline from date of donation — many Filipinos unaware until title transfer is blocked
- Cannot transfer title at Registry of Deeds without BIR CAR — creates forced compliance at time of sale
- Common confusion: "we already paid estate tax" when the transfer is inter-vivos (donation), not inheritance
- Confusion between "donation" and "sale at undervalue" — BIR can recharacterize if consideration is below FMV
- Large penalty exposure: 25% surcharge + 12% annual interest for late filing

### Computability Assessment
**Fully deterministic.** The statute defines: FMV → encumbrance deduction → 6% × excess over ₱250K. No human judgment required for the computation itself. The only judgment call is FMV determination for non-real-property assets, but for real property the BIR zonal value schedule provides the floor.

### Automation Opportunity Score (Preliminary)
- Market size: 3 (50K–200K annual filers)
- Moat depth: 4 (requires lawyer + notary + BIR CAR; ₱20K–₱80K professional cost)
- Computability: 5 (fully deterministic)
- Pain: 4 (multi-agency, 30-day deadline, title transfer blocked without compliance)
- **Composite**: Strong candidate — similar to inheritance engine but for lifetime transfers

---

## Domain 2: Value-Added Tax (VAT) Computation (BIR Forms 2550Q/2550M)

### Governing Law
- NIRC Sec. 105–115 (Title IV), as amended by TRAIN Law and EOPT Act
- Revenue Regulations No. 3-2024 (EOPT implementation of VAT rules)
- BIR Forms 2550M (monthly) and 2550Q (quarterly VAT return)

### Computation Rules (Fully Deterministic for standard cases)

```
Output VAT = 12% × Gross Sales/Receipts (taxable transactions)
Input VAT = VAT paid on purchases directly attributable to VAT-taxable sales
VAT Payable = Output VAT − Input VAT (if positive → remit; if negative → carry-forward or refund claim)
```

Key rules:
- Zero-rated sales (NIRC Sec. 106(A)(2), 108(B)): generate input VAT credits but 0% output VAT → refund eligible
- VAT-exempt transactions (NIRC Sec. 109): no output VAT, no input VAT credit
- Input VAT allocation: when taxpayer has mixed taxable/zero-rated/exempt sales, input must be allocated proportionally
- Government transactions: 5% final withholding VAT on all government procurement (Sec. 114)
- Transitional input tax (Sec. 111(A)): 2% of beginning inventory on transition to VAT registration

Output VAT computation is simple (12% × gross). The complexity lies in input tax allocation, distinguishing zero-rated vs. exempt vs. taxable, and tracking input tax carry-forward across quarters.

### Who Currently Does This
- VAT-registered businesses are legally required to file — larger ones have in-house accounting
- SMEs (₱3M–₱50M revenues) typically outsource to bookkeeping firms or CPAs
- Common errors: wrong rate application, missing input tax invoices, incorrect zero-rating classification
- BIR audits focus heavily on VAT compliance — it is the most-audited tax type

### Market Size
- BIR collected ~₱475B in VAT revenues in 2023 — largest single tax type after income tax
- Estimated 500,000–700,000 VAT-registered businesses in the Philippines
- All must file quarterly (some still monthly) — generating ~2–3 million VAT return filings per year
- Every business above the ₱3M threshold is a mandatory filer

### Professional Fee Range
- Bookkeeping with monthly VAT filing: ₱3,000–₱15,000/month (₱36K–₱180K/year)
- CPA firm VAT return preparation (quarterly only): ₱3,000–₱10,000 per quarter
- For businesses with complex mixed transactions: ₱20,000+/quarter
- Total annual compliance cost for a simple VAT-registered SME: ₱36,000–₱120,000

### Pain Indicators
- Quarterly filing deadline (25th day after quarter end for 2550Q) + monthly for some
- Input VAT carry-forward tracking — errors cause over-remittance or under-remittance
- Mixed transaction allocation — statute requires proportional input tax allocation (Sec. 110(B))
- VAT refund claims (Sec. 112) are complex and backlogged — BIR has history of slow processing
- New 12% VAT on digital services (Oct 2024) added compliance complexity for businesses using foreign SaaS

### Computability Assessment
**Mostly deterministic** (score: 4). Standard output/input computation is fully algorithmic. Complications arise in mixed-use input allocation, cross-border digital services, and transitional rules — but these add complexity to the software, not fundamental unresolvability. The statute defines all the rules; no judgment required for the standard case.

### Automation Opportunity Score (Preliminary)
- Market size: 5 (500K+ VAT-registered businesses, millions of return filings)
- Moat depth: 3 (bookkeepers/CPAs, ₱36K–₱180K/year professional cost)
- Computability: 4 (mostly deterministic; input allocation adds complexity)
- Pain: 4 (quarterly filings, audits, input tracking)
- **Composite**: High-volume market, but existing tools (JuanTax, Taxumo) have partial coverage

---

## Domain 3: VAT Refund Claims (Section 112)

### Governing Law
- NIRC Sec. 112 (Title IV), as amended by TRAIN Law and EOPT Act
- Revenue Regulations No. 14-2020 (VAT refund processing)
- BIR Form 1914 (Application for Tax Refund/TCC)

### Computation Rules (Moderately Deterministic)

```
Refundable Input VAT = Total Input VAT directly attributable to zero-rated sales
Filing Deadline = within 2 years after close of taxable quarter when zero-rated sales were made
Required Documentation: VAT invoices, BIR-registered books, export documents (for export sales)
BIR processing: 90-day decision period (post-EOPT Act)
```

The computation of refundable amounts is deterministic. The complexity is in:
1. Attribution rules — which input VAT is "directly attributable" to zero-rated vs. taxable
2. Documentation assembly — voluminous invoice matching

### Who Currently Does This
- Tax lawyers and Big 4 / large CPA firms handle VAT refund claims
- Specialty: few firms have expertise; large refund claims require litigation experience
- Process is notoriously slow — historically 2–5 years, now 90 days post-EOPT

### Market Size
- All exporters, BPO/IT-BPO companies, ecozones locators are zero-rated and eligible for refunds
- IT-BPO sector alone: ~1.3M employees, $30B+ revenues — all zero-rated for VAT
- Estimated refund applications: 10,000–50,000 per year

### Professional Fee Range
- Large CPA/law firms: 3–10% of refund amount claimed as success fee, or ₱200K–₱2M+ flat for large claims
- Significant opportunity for a computation tool to build the refund application package

### Pain Indicators
- Historically backlogged BIR — Pilipinas Shell case (2016) and many others took years
- Documentation requirements are burdensome — invoice-by-invoice matching
- 2-year prescriptive period — missing it forfeits the claim permanently

### Computability Assessment
**Mostly deterministic** (score: 3). The attribution computation is defined by statute. The documentation assembly is the real pain point, not the math. A tool that tracks input VAT by transaction code and generates the attribution schedule would be high-value.

### Automation Opportunity Score (Preliminary)
- Market size: 2 (10K–50K applications/year, but high-value per application)
- Moat depth: 5 (requires specialist firms, ₱200K–₱2M per engagement)
- Computability: 3 (moderately deterministic)
- Pain: 5 (multi-year delays, forfeiture risk, backlog)
- **Composite**: Niche but high-value per engagement; strong moat disruption potential

---

## Domain 4: Percentage Tax / OPT (BIR Form 2551Q)

### Governing Law
- NIRC Sec. 116–127 (Title V), as amended by TRAIN Law and CREATE Act
- BIR Form 2551Q (Quarterly Percentage Tax Return)

### Computation Rules (Fully Deterministic)

```
Standard OPT (Sec. 116) = 3% × Quarterly Gross Sales or Receipts
Special OPT rates (other Sec. 116 categories): varies by industry
No input tax deduction — OPT is computed on gross, no offsets
```

Special rates (selected):
- Domestic carriers and keepers of garages (Sec. 117): 3% of gross receipts
- International carriers (Sec. 118): 3% of gross receipts from Philippine sources
- Franchise grantees of radio/TV (Sec. 119): 3%
- Banks and non-bank financial intermediaries (Sec. 122): 5% of gross receipts
- Life insurance companies (Sec. 123): 2% of gross premiums

Who qualifies: businesses with annual gross sales/receipts ≤ ₱3M, not VAT-registered.
Exception: individuals who chose the 8% flat income tax option are exempt from OPT filing.

### Who Currently Does This
- Many micro/small business owners file this themselves or through a bookkeeper
- Simplest tax computation in the BIR portfolio — widely understood
- JuanTax, Taxumo, and other platforms already automate this for their users

### Market Size
- Millions of registered micro and small businesses below the VAT threshold
- PSA: ~1.06 million micro enterprises, ~100K small enterprises as of 2022
- Perhaps 500K–1M quarterly OPT filers

### Professional Fee Range
- Simple OPT filing: ₱500–₱2,000 per quarter
- Often bundled with basic bookkeeping retainer (₱1,500–₱5,000/month)

### Pain Indicators
- Low pain — computation is trivially simple (3% × gross)
- Main confusion: when to shift from OPT to VAT as business grows, and the 8% income tax option interaction

### Computability Assessment
**Fully deterministic** (score: 5). But the market is low-value and mostly already served by existing tools.

### Automation Opportunity Score (Preliminary)
- Market size: 5 (500K–1M filers)
- Moat depth: 1 (very DIY-able; online calculators exist)
- Computability: 5 (trivially simple)
- Pain: 1 (simple computation, low penalty exposure)
- **Composite**: Low opportunity — too simple, moat is nearly nonexistent. Exclude from ranked shortlist.

---

## Domain 5: Documentary Stamp Tax (DST) (BIR Form 2000 / 2000-OT)

### Governing Law
- NIRC Sec. 173–201 (Title VII), as amended by TRAIN Law and EOPT Act
- Revenue Regulations No. 4-2024 (EOPT implementation)
- BIR Forms 2000 (monthly DST declaration) and 2000-OT (one-time transactions)

### Computation Rules (Fully Deterministic)

DST is a rate per instrument applied to the face value, consideration, or par value — fully computable from the rate table:

| Instrument | DST Rate |
|---|---|
| Loan agreements / promissory notes (Sec. 179) | ₱1.50 per ₱200 face value (0.75%) |
| Deed of Sale — real property (Sec. 196) | ₱15.00 per ₱1,000 (1.5%) |
| Original issuance of shares (Sec. 174) | ₱2.00 per ₱200 par value (1%) |
| Sale/transfer of shares not listed (Sec. 175) | ₱1.50 per ₱200 par value (0.75%) |
| Lease agreements (Sec. 194) | ₱3.00 for first ₱2,000; ₱1.00 per ₱1,000 thereafter |
| Mortgages (Sec. 195) | ₱40 for first ₱5,000; ₱20 per ₱5,000 thereafter |
| Powers of attorney (Sec. 188) | ₱5.00 flat |
| Certificates (Sec. 188) | ₱15.00 flat |

For real property transactions: DST base = higher of selling price or BIR zonal value / assessed value.
For installment sales: DST computed on full contract price at time of execution (BIR Ruling OT-028-2024).

```
DST on Loan = (Loan Amount ÷ 200) × 1.50
DST on Real Property Sale = (max(Selling Price, Zonal Value) ÷ 1,000) × 15
DST on Shares (original) = (Par Value × Shares ÷ 200) × 2.00
```

Filing: within 5 days after close of month when document was executed.

### Who Currently Does This
- Real estate transactions: real estate brokers, lawyers, notaries compute DST as part of closing costs
- Loan transactions: banks compute automatically; individuals with private loans often miss DST
- Share issuance: corporate secretary / CPA computes DST on subscription
- High error rate: BIR Ruling OT-028-2024 was needed to clarify installment sale DST basis — indicating widespread confusion

### Market Size
- Real property transactions: PSA reports ~600K property title transfers annually → 600K DST computations
- Loan transactions: BangkoSentral ng Pilipinas (BSP) reports millions of loan accounts — but banks self-compute; the gap is private/informal loans
- Share issuances: SEC records ~50K–100K new incorporations per year, each triggering DST on subscription
- Lease agreements: millions of lease contracts executed annually

### Professional Fee Range
- DST computation for real property sale: bundled into real estate transaction fees (lawyers charge ₱10,000–₱50,000 for the full conveyancing package, DST computation included)
- DST computation for private loan: often not computed at all → penalty exposure
- DST error penalty: 25% surcharge + 12% annual interest + document rendered inadmissible in court (Sec. 201)

### Pain Indicators
- Per-document computation required; different rates per instrument type
- 5-day filing deadline after month of execution — extremely tight
- Common error: computing DST on installment payments rather than full contract price
- Private loans between individuals: most parties unaware of DST obligation
- Inadmissibility penalty is severe — courts cannot admit unstamped documents

### Computability Assessment
**Fully deterministic** (score: 5). The NIRC provides the exact rate for each instrument type. Input is the transaction value; output is the DST amount. No judgment required.

### Automation Opportunity Score (Preliminary)
- Market size: 5 (millions of DST-triggering documents annually)
- Moat depth: 3 (typically bundled into larger transaction services; dedicated DST expertise is uncommon)
- Computability: 5 (fully deterministic rate schedule)
- Pain: 3 (moderate — tight deadlines, inadmissibility penalty, but often absorbed by transaction professionals)
- **Composite**: High volume, strong computability. Good candidate as a feature within a broader conveyancing or corporate compliance tool.

---

## Domain 6: Excise Tax on Sin Products (NIRC Sec. 129–172)

### Governing Law
- NIRC Sec. 129–172 (Title VI), as amended by Sin Tax Reform Acts (RA 10351, RA 11346, RA 11467)
- Applicable to: distilled spirits, wines, fermented liquors (beer), cigarettes, cigars, heated tobacco products, vapor products

### Computation Rules (Fully Deterministic)

2024 rates:
- Beer/fermented liquor (Sec. 143): ₱43.00/liter (increases 6%/year)
- Wines (Sec. 142): ~₱63.12/liter (increases 6%/year)
- Distilled spirits (Sec. 141): 22% of NRP + ₱66.00/proof liter
- Cigarettes (Sec. 145): ₱63.00/pack (increases 5%/year)
- Vapor products: 5% increase annually from 2023 base of ₱52.00/mL

Annual rate adjustments are mandated by statute (6% for alcohol, 5% for tobacco starting 2024).

### Who Currently Does This
- Manufacturers and importers of alcohol/tobacco — large organized entities with dedicated tax departments
- BOC (Bureau of Customs) levies excise on imports at port of entry
- Market is small (dozens of large manufacturers) — highly specialized
- BIR Revenue Memorandum Orders govern monthly excise returns

### Market Size
- ~20–50 major domestic manufacturers of alcohol and tobacco products
- Small-scale breweries, craft distilleries, vape manufacturers: growing segment but still hundreds, not millions
- Not a mass-market compliance problem

### Pain Indicators
- Annual rate increases must be programmed every January — ERP/system updates required
- Distilled spirits: dual tax (ad valorem + specific) creates complexity
- Vape and HTP products: relatively new, regulatory uncertainty

### Computability Assessment
**Fully deterministic** (score: 5). The statute specifies exact rates per unit with fixed annual escalators. Trivially computable once the rate schedule is known.

### Automation Opportunity Score (Preliminary)
- Market size: 1 (<10K affected entities — primarily large manufacturers)
- Moat depth: 2 (manufacturers have in-house tax teams; not a professional services moat)
- Computability: 5 (fully deterministic)
- Pain: 2 (organized entities; primary pain is annual rate updates)
- **Composite**: Low opportunity — market too small, no significant professional moat.

---

## Summary of Domains Found

| # | Domain | Governing Sections | Computability | Market Signal | Priority |
|---|--------|-------------------|---------------|---------------|----------|
| 1 | Donor's Tax | NIRC Sec. 98–104 | Fully deterministic | 50K–200K filers/yr; ₱20K–₱80K prof cost | **HIGH** |
| 2 | VAT Computation | NIRC Sec. 105–115 | Mostly deterministic | 500K+ businesses; ₱36K–₱180K/yr | **HIGH** |
| 3 | VAT Refund Claims | NIRC Sec. 112 | Mostly deterministic | 10K–50K apps/yr; ₱200K–₱2M prof cost | **MEDIUM** |
| 4 | Percentage Tax | NIRC Sec. 116–127 | Fully deterministic | 500K–1M filers/yr; ₱500–₱2K/filing | LOW |
| 5 | Documentary Stamp Tax | NIRC Sec. 173–201 | Fully deterministic | Millions of docs/yr; bundled in transactions | **MEDIUM-HIGH** |
| 6 | Excise Tax (sin products) | NIRC Sec. 129–172 | Fully deterministic | <10K affected entities | LOW |

---

## New Aspects to Add to Frontier

None identified — the primary sub-domains within this source are already covered by existing Wave 1 aspects (withholding tax → `nirc-income-tax`, VAT → this aspect, DST → `bir-forms-catalog` will cross-reference). **VAT Refund Claims** (Sec. 112) is a distinct enough sub-domain that the scorer should evaluate it separately from general VAT computation.
