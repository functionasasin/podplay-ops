# Master TAM Table — All 148 Philippine Compliance Tools

**Generated:** 2026-03-03
**Sources:** 25 per-tool/cluster TAM files in `analysis/tam-*.md`
**Coverage:** ph-compliance-moats-reverse (41 tools) + ph-regulatory-atlas-reverse (107 tools)

---

## Methodology Notes

### TAM Figures Used
- **Total TAM** = Consumer TAM + Professional TAM (at stated price × addressable population × 12 months or × event volume)
- **SAM (Serviceable Addressable Market)** = Total TAM × digital-adoption / awareness fraction (as stated per file; typically 20–30% of Total TAM)
- **SOM Y1** = SAM × 1%; **SOM Y3** = SAM × 5%
- Per-tool data used where available; for O-LRA cluster (4 tools), figures are proportional allocations noted with *(est)*

### Double-Counting Warning
Many tools share the same consumer base:
- All BIR business-compliance tools (B1–B7, C2–C4) target the same 1.7–2.5M VAT/withholding-registered taxpayers
- All payroll tools (D1, D2, D7, D8) target the same ~420K employers
- PhilHealth + Pag-IBIG tools target the same ~11–15M contributing workers

The **SAM** column is more useful for portfolio planning as it applies a correction for addressability and digital adoption. The **Total TAM** figures are theoretical maxima if every eligible person paid every tool's full price independently.

### Confidence Scoring
- **HIGH** = ≥60% of key population numbers are OFFICIAL (agency's own published data)
- **MEDIUM** = 30–60% OFFICIAL, remainder DERIVED or ESTIMATED
- **LOW** = <30% OFFICIAL; primarily ESTIMATED from proxies

---

## Master Table — Sorted by Total TAM (Descending)

| Rank | Tool ID | Tool Name | Loop | Consumer Pop (Addressable) | C-TAM ₱M | Prof Pop | P-TAM ₱M | **Total TAM ₱M** | **SAM ₱M** | SOM Y1 ₱M | SOM Y3 ₱M | Confidence |
|------|---------|-----------|------|---------------------------|----------|----------|----------|-----------------|-----------|-----------|-----------|------------|
| 1 | B-PHI-2 | PhilHealth Premium Calculator | atlas | 11,400,000 workers | 27,216 | 55,000 HR officers | 659 | **27,875** | 1,394 | 13.9 | 69.6 | HIGH |
| 2 | F1 | RPT + SEF Calculator | moats | 7,552,050 property owners | 18,032 | 20,000 RE lawyers/appraisers | 240 | **18,272** | 1,200 | 12.0 | 60.0 | MEDIUM |
| 3 | B-PHI-3 | PhilHealth Eligibility Navigator | atlas | 5,400,000 members | 12,888 | 65,000 HR/benefits officers | 779 | **13,667** | 683 | 6.8 | 34.2 | HIGH |
| 4 | C-HDMF-2 | Pag-IBIG MPL Calculator | atlas | 4,250,000 active members | 10,148 | 40,000 HR officers | 480 | **10,628** | 531 | 5.3 | 26.6 | HIGH |
| 5 | C-HDMF-3 | Pag-IBIG Mandatory Savings | atlas | 3,200,000 contributors | 7,642 | 55,000 HR officers | 659 | **8,301** | 415 | 4.2 | 20.8 | HIGH |
| 6 | B3 | BIR Compliance Calendar | moats | 2,437,500 registered taxpayers | 5,822 | 35,000 bookkeepers/CPAs | 419 | **6,241** | 1,872 | 18.7 | 93.6 | MEDIUM |
| 7 | C-HDMF-1 | Pag-IBIG Housing Loan Calculator | atlas | 2,790,000 borrower-eligible | 6,663 | 50,000 HR/benefits officers | 599 | **7,262** | 363 | 3.6 | 18.2 | HIGH |
| 8 | F2 | Local Business Tax + BP Calculator | moats | 2,400,000 LGU permit holders | 5,731 | 6,500 tax/compliance officers | 78 | **5,809** | 580 | 5.8 | 29.0 | MEDIUM |
| 9 | B1 | BIR Form Navigator | moats | 1,787,500 registered taxpayers | 4,268 | 35,000 bookkeepers/CPAs | 419 | **4,687** | 1,407 | 14.1 | 70.4 | MEDIUM |
| 10 | F4 | Maceda Law CSV Calculator | moats | 1,650,000 installment buyers | 3,940 | 23,000 RE brokers/lawyers | 276 | **4,216** | 422 | 4.2 | 21.0 | MEDIUM |
| 11 | A1 | Self-Employed IT Optimizer (1701/1701A) | moats | 1,640,000 BIR self-employed filers | 3,920 | 30,000 CPAs (individual tax) | 360 | **4,280** | 1,285 | 12.9 | 64.3 | MEDIUM |
| 12 | B6 | BIR 2307 Tracker | moats | 1,500,000 withholding agents | 3,582 | 35,000 bookkeepers/CPAs | 419 | **4,001** | 1,200 | 12.0 | 60.0 | MEDIUM |
| 13 | G5 | Life Insurance CSV Calculator | moats | 1,418,909 individual life policies | 3,388 | 15,000 insurance brokers/CPAs | 180 | **3,568** | 180 | 1.8 | 9.0 | HIGH |
| 14 | B5 | Quarterly IT (1701Q) Engine | moats | 1,180,000 quarterly IT filers | 2,817 | 35,000 bookkeepers/CPAs | 419 | **3,236** | 971 | 9.7 | 48.6 | MEDIUM |
| 15 | A-SSS-3 | SSS Contribution Remittance Calculator | atlas | 940,000 SSS-registered employers | 2,245 | 50,000 HR officers | 599 | **2,844** | 284 | 2.8 | 14.2 | HIGH |
| 16 | D2 | 13th Month Pay Calculator | moats | 420,000 employers w/ regular employees | 1,003 | 68,000 HR + payroll professionals | 815 | **1,818** | 546 | 5.5 | 27.3 | MEDIUM |
| 17 | D7 | Mandatory Govt Contributions (SSS/PHI/HDMF) | moats | 420,000 employers | 1,003 | 68,000 HR + payroll professionals | 815 | **1,818** | 364 | 3.6 | 18.2 | MEDIUM |
| 18 | B4 | Withholding Agent (BIR 1601-C/E/F) | moats | 610,000 withholding agents | 1,456 | 40,000 bookkeepers/CPAs | 479 | **1,935** | 581 | 5.8 | 29.1 | MEDIUM |
| 19 | G2 | Prescriptive Periods Calculator | moats | 500,000 litigants/lawyers | 1,194 | 50,000 litigation lawyers | 599 | **1,793** | 358 | 3.6 | 17.9 | MEDIUM |
| 20 | B7 | eBIRForms Companion | moats | 550,000 BIR filers | 1,313 | 35,000 bookkeepers/CPAs | 419 | **1,732** | 346 | 3.5 | 17.3 | MEDIUM |
| 21 | B2 | BIR Penalty Calculator | moats | 500,000 delinquent taxpayers | 1,194 | 44,000 CPAs/tax practitioners | 528 | **1,722** | 517 | 5.2 | 25.9 | MEDIUM |
| 22 | A5 | Compensation IT (Form 1700) | moats | 3,000,000 non-substituted filers | 1,497 | 8,000 tax practitioners | 96 | **1,593** | 477 | 4.8 | 23.9 | MEDIUM |
| 23 | D1 | Multi-Factor Payroll Premium Computation | moats | 420,000 employers | 1,003 | 38,000 HR practitioners | 455 | **1,458** | 437 | 4.4 | 21.9 | MEDIUM |
| 24 | C2 | VAT Engine (1601C / 2550M / 2550Q) | moats | 390,000 VAT-registered taxpayers | 931 | 30,000 VAT practitioners | 360 | **1,291** | 387 | 3.9 | 19.4 | MEDIUM |
| 25 | A2 | Corporate IT (RCIT vs. MCIT Engine) | moats | 430,200 active corporations | 1,027 | 20,000 CPAs (corporate tax) | 240 | **1,267** | 381 | 3.8 | 19.1 | MEDIUM |
| 26 | G1 | Legal Interest Rate Calculator | moats | 360,000 litigants/debtors | 860 | 30,000 litigation lawyers | 360 | **1,220** | 305 | 3.1 | 15.2 | MEDIUM |
| 27 | D8 | Minimum Wage Compliance Checker | moats | 294,000 employers | 702 | 38,000 HR practitioners | 455 | **1,157** | 231 | 2.3 | 11.6 | MEDIUM |
| 28 | R-DTI-1 | Annual Regulatory Compliance Calendar | atlas | 1,300,000 sole proprietors | 310 | 25,000 compliance officers | 300 | **610** | 244 | 2.4 | 12.2 | MEDIUM |
| 29 | E4 | AFS Filing Wizard | moats | 370,000 AFS-obligated corps | 740 | incl. in E1/E2 | — | **740** | 222 | 2.2 | 11.1 | HIGH |
| 30 | A-SSS-1 | SSS Retirement BMP Calculator | atlas | ~1,000,000 pre-retirees | 199 | 43,000 HR + labor consultants | 515 | **714** | 71 | 0.71 | 3.6 | HIGH |
| 31 | D3 | Final Pay Computation (30-day rule) | moats | 585,000 separation events/yr | 116 | 44,000 HR + labor lawyers | 527 | **643** | 193 | 1.9 | 9.6 | MEDIUM |
| 32 | B-PHI-1 | PhilHealth Case Rate Calculator | atlas | 1,580,000 hospitalization events/yr | 156 | 40,000 HR/benefits officers | 480 | **636** | 127 | 6.4 | 31.8 | HIGH |
| 33 | C4 | DST Engine (Forms 2000 / 2000-OT) | moats | 240,000 DST filers | 281 | 27,000 CPAs/bookkeepers | 324 | **605** | 181 | 1.8 | 9.1 | MEDIUM |
| 34 | D5 | Separation Pay Calculator (Authorized Causes) | moats | 296,000 annual separation events | 59 | 45,000 HR + labor lawyers | 539 | **598** | 179 | 1.8 | 9.0 | MEDIUM |
| 35 | Q-ERC-1 | Electricity Bill Verification (ERC) | atlas | 2,943,160 addressable consumers | 473 | 1,100 utilities + ESCO | 120 | **593** | 237 | 2.4 | 11.9 | MEDIUM |
| 36 | A-SSS-5 | SSS Death + Survivor Benefit | atlas | ~99,000 annual death events | 20 | 45,000 HR + labor consultants | 539 | **559** | 56 | 0.56 | 2.8 | HIGH |
| 37 | A-SSS-2 | SSS Maternity Benefit Calculator | atlas | 622,000 maternity claims/yr | 124 | 35,000 HR officers | 419 | **543** | 54 | 0.54 | 2.7 | HIGH |
| 38 | D-GSIS-4 | GSIS Contribution + Employer Remittance | atlas | 222,636 individual GSIS members | 22 | 14,469 AAOs (agency acct officers) | 521 | **543** | 109 | 5.4 | 27.1 | HIGH |
| 39 | A-SSS-4 | SSS Sickness Benefit Calculator | atlas | 360,000 sickness claims/yr | 72 | 35,000 HR officers | 419 | **491** | 49 | 0.49 | 2.5 | HIGH |
| 40 | R-BOI-1 | BOI/PEZA SCIT vs. EDR Calculator | atlas | 1,450,000 SMEs registrable | 216 | 2,000 investment lawyers/CPAs | 240 | **456** | 182 | 1.8 | 9.1 | MEDIUM |
| 41 | F3 | RPVARA Amnesty Navigator | moats | 2,000,000 delinquent RPT owners | 398 | 10,000 RE lawyers | 40 | **438** | 44 | 4.4 | 60.0* | HIGH |
| 42 | D4 | Retirement Pay Calculator (RA 7641) | moats | 69,000 annual retirement events | 14 | 43,000 HR + labor lawyers | 516 | **529** | 159 | 1.6 | 7.9 | MEDIUM |
| 43 | E1 | SEC Navigator (Registration + Amendment) | moats | 527,710 active corporations | — | bundled w/ corps | 527 | **527** | 158 | 1.6 | 7.9 | HIGH |
| 44 | E2 | SEC Lifecycle Manager | moats | 527,710 active corporations | — | bundled w/ corps | 527 | **527** | 158 | 1.6 | 7.9 | HIGH |
| 45 | D-GSIS-1 | GSIS BMP Pension + Option NPV | atlas | 333,200 pre-retirees | 199 | 14,469 AAOs | 174 | **372** | 74 | 3.7 | 18.6 | HIGH |
| 46 | H-PRC-1 | PRC License Renewal Navigator | atlas | 2,940,000 PRC-registered professionals | 291 | 2,000 institutions/schools | 72 | **363** | 109 | 3.6 | 18.2 | HIGH |
| 47 | E6 | OSH Staffing Calculator (DOLE) | moats | 119,313 establishments ≥10 workers | — | bundled w/ corps | 358 | **358** | 107 | 1.1 | 5.4 | HIGH |
| 48 | O-LRA-3 | ONETT Zonal Value Lookup | atlas | *(cluster: 150K transactions/yr)* | 30*(est)* | 12,000 brokers + lawyers | 120*(est)* | **150** *(est)* | 45 | 0.45 | 2.3 | MEDIUM |
| 49 | O-LRA-1 | ONETT Deadline Calculator | atlas | *(cluster: 150K transactions/yr)* | 22*(est)* | 8,000 ONETT processors | 80*(est)* | **102** *(est)* | 31 | 0.31 | 1.5 | MEDIUM |
| 50 | O-LRA-2 | ONETT Pipeline Checklist | atlas | *(cluster: 150K transactions/yr)* | 15*(est)* | 7,000 ONETT processors | 70*(est)* | **85** *(est)* | 26 | 0.26 | 1.3 | MEDIUM |
| 51 | E-OFW-3 | OWWA Benefits Navigator | atlas | 486,000 OFWs (OWWA-enrolled) | 290 | bundled w/ agencies | 18 | **308** | 92 | 3.1 | 15.4 | HIGH |
| 52 | A3 | CGT: Real Property (Form 1706) | moats | 127,500 annual transactions | 64 | 19,000 brokers + lawyers + CPAs | 228 | **292** | 88 | 0.9 | 4.4 | MEDIUM |
| 53 | D9 | SEnA Request Navigator | moats | 54,493 annual RFA filers | 11 | 22,000 labor lawyers + HR | 264 | **275** | 82 | 0.82 | 4.1 | HIGH |
| 54 | N-BFP-2 | FSIC Calendar + Fire Permit Tracker | atlas | 840,000 LGU permit holders | 201 | 6,000 BFP compliance officers | 72 | **272** | 109 | 1.1 | 5.5 | MEDIUM |
| 55 | L-TES-1 | TESDA NC Assessment Pathway | atlas | 2,005,000 TVET graduates/yr (addressable) | 241 | 200 TESDA-accredited AOs | 24 | **265** | 106 | 1.1 | 5.3 | MEDIUM |
| 56 | E3 | HARBOR (SEC e-Submission) | moats | 527,710 active corporations (mandatory) | 263 | bundled w/ corps | — | **263** | 79 | 0.79 | 3.9 | HIGH |
| 57 | E5 | SEC Capital Changes Filing | moats | 52,000 corporate events/yr | 260 | bundled w/ corps | — | **260** | 78 | 0.78 | 3.9 | HIGH |
| 58 | G3 | Marital Property Regime Calculator | moats | 45,000 annual annulment/separation cases | 108 | 12,000 family law lawyers | 144 | **252** | 50 | 0.5 | 2.5 | MEDIUM |
| 59 | G-LTO-1 | MVUC + Registration Cost Calculator | atlas | 7,848,500 registered motor vehicles | 228 | 13,600 processing firms | 163 | **391** | 117 | 1.2 | 5.9 | HIGH |
| 60 | E-OFW-2 | Pre-Departure Cost Estimator | atlas | 1,960,000 annual OFW deployments | 194 | bundled w/ agencies | 18 | **212** | 63 | 2.1 | 10.6 | HIGH |
| 61 | M-FDA-1 | FDA CPR + LTO Registration | atlas | 24,000 product registration events/yr | 144 | 350 regulatory consultants | 42 | **186** | 75 | 0.75 | 3.7 | MEDIUM |
| 62 | F-BOC-1 | Landed Cost + Customs Duties Calculator | atlas | 32,500 commercial importers | 78 | 9,000 licensed customs brokers | 108 | **186** | 74 | 0.74 | 3.7 | MEDIUM |
| 63 | N-BFP-1 | Fire Safety Requirements Checklist | atlas | 720,000 LGU permit holders | 107 | 6,000 BFP compliance officers | 72 | **179** | 72 | 0.72 | 3.6 | MEDIUM |
| 64 | G-LTO-2 | Late Registration Penalty Calculator | atlas | 1,155,000 lapsed registrations/yr | 57 | bundled w/ G-LTO-1 | — | **57** | 17 | 0.17 | 0.9 | HIGH |
| 65 | P-IPO-1 | IPOPHL IP Portfolio Tracker | atlas | 44,588 annual trademark applications | 100 | 450 IP lawyers/agents | 54 | **154** | 62 | 0.62 | 3.1 | HIGH |
| 66 | D-GSIS-2 | GSIS Legacy Law Selection (RA 660/1616 vs RA 8291) | atlas | 140,000 pre-1997 govt employees | 56 | 7,200 AAOs | 86 | **142** | 28 | 1.4 | 7.1 | HIGH |
| 67 | C5 | Property Transfer Tax Bundler | moats | 106,000 annual property transfers | 21 | 19,000 brokers/lawyers/CPAs | 114 | **135** | 40 | 0.4 | 2.0 | MEDIUM |
| 68 | C1 | Donor's Tax Calculator (Form 1800) | moats | 25,000 annual gift transactions | 13 | 9,000 CPAs + estate lawyers | 108 | **121** | 36 | 0.4 | 1.8 | MEDIUM |
| 69 | G4 | Loss of Earning Capacity Calculator | moats | 5,250 annual tort/personal injury cases | 1 | 10,000 litigation lawyers | 120 | **121** | 24 | 0.24 | 1.2 | MEDIUM |
| 70 | R-BOI-2 | BOI/PEZA ITH Duration Calculator | atlas | 900,000 SME applicants | 108 | bundled w/ R-BOI-1 | — | **108** | 43 | 0.43 | 2.2 | MEDIUM |
| 71 | C3 | VAT Refund Claim Navigator | moats | 7,500 zero-rated VAT filers | 90 | 500 VAT refund specialists | 18 | **108** | 54 | 1.1 | 5.4 | MEDIUM |
| 72 | A4 | CGT: Unlisted Shares (Form 1707) | moats | 14,000 annual share transfers | 14 | 7,000 corporate lawyers/CPAs | 84 | **98** | 29 | 0.3 | 1.5 | MEDIUM |
| 73 | D-GSIS-3 | GSIS Portability + Totalization (RA 7699) | atlas | 100,000 mixed-sector employees | 40 | 4,300 AAOs | 52 | **92** | 18 | 0.9 | 4.6 | MEDIUM |
| 74 | D6 | Back Wages Estimator (Illegal Dismissal) | moats | 11,275 annual NLRC cases | 2 | 7,000 NLRC labor lawyers | 84 | **86** | 26 | 0.26 | 1.3 | MEDIUM |
| 75 | H-PRC-2 | PRC Board Exam Prep Navigator | atlas | 615,750 examinees/yr | 61 | 2,000 review centers | 24 | **85** | 26 | 0.9 | 4.3 | HIGH |
| 76 | E-OFW-1 | OFW Placement Fee Calculator | atlas | 531,000 new hire + change-employer OFWs | 53 | 1,500 licensed agencies | 18 | **71** | 21 | 0.7 | 3.6 | HIGH |
| 77 | D-GSIS-5 | GSIS Survivorship + Death Benefit | atlas | 73,000 annual death/survivor events | 7 | 5,000 AAOs + lawyers | 60 | **67** | 13 | 0.7 | 3.4 | HIGH |
| 78 | J-CAP-1 | RPAS/Drone Compliance (CAAP) | atlas | 100,900 registered drones | 50 | 400 drone operators + consultants | 10 | **60** | 18 | 0.18 | 0.9 | MEDIUM |
| 79 | R-CDA-1 | Cooperative Registration + Compliance | atlas | 9,800 registered cooperatives | 23 | 3,000 CDA compliance officers | 36 | **59** | 24 | 0.24 | 1.2 | MEDIUM |
| 80 | F-BOC-3 | Excise Tax + BOC Compliance | atlas | 272,760 e-commerce importers | 27 | 2,500 customs brokers | 30 | **57** | 23 | 0.23 | 1.1 | MEDIUM |
| 81 | R-PCAB-1 | PCAB ACP Score Calculator | atlas | 33,800 PCAB-licensed contractors | 22 | 2,000 PCAB compliance officers | 24 | **46** | 19 | 0.18 | 0.9 | HIGH |
| 82 | S-BSP-1 | Pawnshop Loan Cost Calculator | atlas | 19,800 BSP-licensed pawnshops | 24 | 1,425 pawnshop managers | 17 | **41** | 16 | 0.16 | 0.8 | HIGH |
| 83 | M-FDA-2 | FDA License Renewal Calendar | atlas | 32,900 FDA-registered products | 39 | bundled w/ M-FDA-1 | — | **39** | 16 | 0.16 | 0.8 | MEDIUM |
| 84 | T-NPC-1 | NPC Personal Data Breach Notification | atlas | 143,350 NPC-registered PICs | 29 | 750 DPOs + privacy lawyers | 9 | **38** | 15 | 0.15 | 0.75 | MEDIUM |
| 85 | I-MAR-4 | MARINA Tonnage Fee Calculator | atlas | 5,000 vessel operators | 30 | 500 marine compliance officers | 6 | **36** | 11 | 0.4 | 1.8 | MEDIUM |
| 86 | K-NTC-1 | NTC Spectrum Fee Calculator | atlas | 2,000 telecom + ISP licensees | 10 | 2,000 telecom counsel | 24 | **34** | 14 | 0.14 | 0.7 | MEDIUM |
| 87 | H-PRC-3 | CPD Units Compliance Optimizer | atlas | 262,500 PRC professionals in CPD cycle | 26 | 200 CPD providers | 7 | **33** | 10 | 0.3 | 1.7 | HIGH |
| 88 | F-BOC-2 | Post-Clearance Audit (PCA) Compliance | atlas | 4,500 post-clearance audit targets | 2 | 2,500 customs brokers | 30 | **32** | 13 | 0.13 | 0.6 | MEDIUM |
| 89 | I-MAR-2 | STCW Certification Pathway Planner | atlas | 112,500 seafarers seeking upgrades | 22 | bundled w/ I-MAR-1 | 7 | **29** | 9 | 0.3 | 1.5 | MEDIUM |
| 90 | I-MAR-1 | STCW Training Cost Calculator | atlas | 200,000 annual cert events | 20 | 600 manning agencies + MTIs | 7 | **27** | 8 | 0.3 | 1.4 | MEDIUM |
| 91 | I-MAR-3 | STCW COC Revalidation Checklist | atlas | 31,200 revalidation events/yr | 15 | 500 manning agencies | 6 | **21** | 6 | 0.2 | 1.1 | MEDIUM |
| 92 | O-LRA-4 | LRA Fees + Registration Cost | atlas | *(cluster: see O-LRA-3)* | 8*(est)* | 3,000 LRA processors | 30*(est)* | **38** *(est)* | 11 | 0.11 | 0.6 | MEDIUM |
| 93 | P-IPO-2 | IPOPHL Trademark Fee Calculator | atlas | 9,800 trademark applicants/yr | 5 | bundled w/ P-IPO-1 | — | **5** | 2 | 0.02 | 0.1 | HIGH |
| 94 | D-GSIS-6 | GSIS Disability Benefit Calculator | atlas | ~1,120 disability events/yr | 1.3 | bundled w/ D-GSIS-4 | — | **1** | 0.3 | 0.003 | 0.015 | HIGH |

---

## Cluster / Bundle Rollup Table

For tools sharing the same professional subscriber base, bundled TAMs are more realistic than summing individual tools.

| Bundle Name | Tools Included | Shared Consumer Base | Bundle Consumer TAM | Bundle Prof TAM | **Bundle Total TAM** | **SAM** | SOM Y1 | SOM Y3 |
|-------------|---------------|---------------------|--------------------|-----------------|--------------------|---------|--------|--------|
| **BIR Tax Suite** (B1+B3+B5+B6+B7) | Form Navigator, Compliance Cal, Quarterly IT, 2307 Tracker, eBIRForms | ~2.4M registered taxpayers | ₱5,822M (non-additive) | ₱419M (one seat) | **₱6,241M** | ₱1,872M | ₱18.7M | ₱93.6M |
| **BIR Full Suite** (+B2+B4) | + Penalty, Withholding Agent | same base + 610K WHAs | +₱2,672M | +₱1,007M | **₱9,920M** | ₱2,976M | ₱29.8M | ₱149M |
| **Payroll Suite** (D1+D2+D7+D8) | Premium, 13th Month, Contributions, Min Wage | ~420K employers | ₱1,003M (non-additive) | ₱815M (one seat) | **₱1,818M** | ₱546M | ₱5.5M | ₱27.3M |
| **Payroll Full** (+D3) | + Final Pay | +585K events | +₱643M | — | **₱2,461M** | ₱738M | ₱7.4M | ₱37M |
| **Labor Separation Suite** (D4+D5+D6+D9) | Retirement, Sep Pay, Back Wages, SEnA | ~350K events/yr | ₱86M (total events) | ₱540M (one seat) | **₱1,706M** | ₱445M | ₱4.5M | ₱22.3M |
| **SEC Corporate Suite** (E1+E2+E3+E4+E5+E6) | Navigator, Lifecycle, HARBOR, AFS, Capital, OSH | ~527K active corps | ₱2,523M | bundled | **₱2,523M** | ₱757M | ₱7.6M | ₱37.8M |
| **SSS Benefits Suite** (A-SSS-1 to -5) | Retirement, Maternity, Contributions, Sickness, Death | ~940K employers + 40M members | ₱2,660M | ₱599M (one seat 50K) | **₱3,259M** | ₱326M | ₱3.3M | ₱16.3M |
| **PhilHealth Suite** (B-PHI-1+2+3) | Case Rate, Premium, Eligibility | ~15M contributing members | ₱40,260M (non-additive) | ₱779M | **₱27,875M** *(B-PHI-2 dominates)* | ₱2,204M | ₱22M | ₱110M |
| **Pag-IBIG Suite** (C-HDMF-1+2+3) | Housing Loan, MPL, Savings | ~5M active contributors | ₱24,453M (non-additive) | ₱599M | **₱10,628M** *(C-HDMF-2 dominates)* | ₱1,309M | ₱13.1M | ₱65.5M |
| **GSIS Suite** (D-GSIS-1 to -6) | BMP, Legacy, Portability, Contributions, Survivor, Disability | ~2.1M active GSIS members | ₱325M (non-additive) | ₱521M (D-GSIS-4 AAO seat) | **₱846M** | ₱242M | ₱12.1M | ₱60.8M |
| **OFW Suite** (E-OFW-1+2+3) | Placement Fee, Pre-Departure, OWWA | ~2.6M OFW deployments/yr | ₱537M (non-additive) | ₱18M (one seat) | **₱555M** | ₱167M | ₱5.6M | ₱27.7M |
| **ONETT Suite** (O-LRA-1 to -4) | Deadline, Pipeline, Zonal Value, LRA Fees | ~150K ONETT transactions/yr | ₱75M | ₱300M | **₱375M** | ₱113M | ₱1.1M | ₱5.6M |
| **Maritime Suite** (I-MAR-1 to -4) | STCW Cost, Pathway, COC Reval, Tonnage | ~450K seafarers in cert cycle | ₱87M | ₱13M (non-additive) | **₱100M** | ₱30M | ₱1.0M | ₱5.0M |
| **BOC Customs Suite** (F-BOC-1+2+3) | Landed Cost, PCA, Excise Tax | ~300K importers | ₱107M | ₱168M | **₱275M** | ₱110M | ₱1.1M | ₱5.5M |
| **Business Licensing Suite** (R-DTI-1+N-BFP-1+N-BFP-2+R-CDA-1) | DTI Calendar, Fire Safety, FSIC, Cooperative | ~1.3M DTI registrants + 840K permit holders | ₱642M | ₱479M | **₱1,121M** | ₱448M | ₱4.5M | ₱22.4M |
| **VAT Suite** (C2+C3) | VAT Engine + Refund | ~390K VAT-registered | ₱1,021M | ₱378M | **₱1,399M** | ₱441M | ₱5.0M | ₱24.8M |
| **Property Civil Suite** (F1+F2+F3+F4+G1+G2+G3+G4+G5) | RPT, LBT, RPVARA, Maceda, Legal Interest, Prescriptive, Marital, LEC, Life Insurance | 7.5M property owners + 500K litigants | ₱35,689M | ₱3,163M | **₱35,689M raw; SAM-adjusted ₱3,163M** | ₱3,163M | ₱37.2M | ₱182.7M |
| **Regulatory Specialty Suite** (12 tools) | IPO, ERC, BSP, FDA, TESDA, BOI, PCAB, NPC, NTC | mixed bases | ₱1,411M | ₱554M | **₱1,965M** | ₱786M | ₱7.9M | ₱39.3M |
| **PRC Professional Suite** (H-PRC-1+2+3) | License Renewal, Exam Prep, CPD | ~2.94M PRC-registered professionals | ₱378M | ₱96M | **₱363M** *(bundled)* | ₱109M | ₱3.6M | ₱18.2M |

---

## SAM-Based Ranking (Top 30 — More Actionable Than Total TAM)

*SAM corrects for digital adoption rates and addressability. This ranking is a better guide to revenue priority.*

| SAM Rank | Tool ID | Tool Name | Total TAM | **SAM** | Key Population Driver |
|----------|---------|-----------|-----------|---------|----------------------|
| 1 | B3 | BIR Compliance Calendar | ₱6,241M | **₱1,872M** | 2.4M BIR-registered taxpayers |
| 2 | B1 | BIR Form Navigator | ₱4,687M | **₱1,407M** | 1.8M registered taxpayers |
| 3 | A1 | Self-Employed IT Optimizer | ₱4,280M | **₱1,285M** | 1.64M BIR self-employed filers |
| 4 | B6 | 2307 Tracker | ₱4,001M | **₱1,200M** | 1.5M withholding agents |
| 5 | F1 | RPT+SEF Calculator | ₱18,272M | **₱1,200M** | 7.55M property tax payers |
| 6 | B-PHI-2 | PhilHealth Premium Calculator | ₱27,875M | **₱1,394M** | 11.4M workers; SAM #2 in strict sense |
| 7 | B4 | Withholding Agent | ₱1,935M | **₱581M** | 610K withholding agents |
| 8 | D2 | 13th Month Pay | ₱1,818M | **₱546M** | 420K employers |
| 9 | B5 | Quarterly IT | ₱3,236M | **₱971M** | 1.18M quarterly filers |
| 10 | A5 | Compensation IT | ₱1,593M | **₱477M** | 3M non-substituted filers |
| 11 | D1 | Payroll Premium | ₱1,458M | **₱437M** | 420K employers |
| 12 | F2 | LBT + BP Calculator | ₱5,809M | **₱580M** | 2.4M LGU permit holders |
| 13 | B2 | BIR Penalty Calculator | ₱1,722M | **₱517M** | 500K delinquent taxpayers |
| 14 | A2 | Corporate IT | ₱1,267M | **₱381M** | 430K active corporations |
| 15 | C2 | VAT Engine | ₱1,291M | **₱387M** | 390K VAT registrants |
| 16 | G2 | Prescriptive Periods | ₱1,793M | **₱358M** | 500K litigants |
| 17 | D7 | Govt Contributions | ₱1,818M | **₱364M** | 420K employers |
| 18 | B7 | eBIRForms Companion | ₱1,732M | **₱346M** | 550K BIR filers |
| 19 | Q-ERC-1 | Electricity Bill Verification | ₱593M | **₱237M** | 2.9M electricity consumers |
| 20 | R-DTI-1 | DTI Compliance Calendar | ₱610M | **₱244M** | 1.3M sole proprietors |
| 21 | D8 | Minimum Wage Checker | ₱1,157M | **₱231M** | 294K employers |
| 22 | E4 | AFS Filing Wizard | ₱740M | **₱222M** | 370K AFS-obligated corps |
| 23 | D3 | Final Pay | ₱643M | **₱193M** | 585K separation events |
| 24 | R-BOI-1 | BOI/PEZA SCIT/EDR | ₱456M | **₱182M** | 1.45M SMEs |
| 25 | D5 | Separation Pay | ₱598M | **₱179M** | 296K separation events |
| 26 | A-SSS-3 | SSS Contributions | ₱2,844M | **₱284M** | 940K employers |
| 27 | B-PHI-3 | PhilHealth Eligibility | ₱13,667M | **₱683M** | 5.4M members |
| 28 | G1 | Legal Interest Calculator | ₱1,220M | **₱305M** | 360K litigants |
| 29 | C4 | DST Engine | ₱605M | **₱181M** | 240K DST filers |
| 30 | D4 | Retirement Pay (RA 7641) | ₱529M | **₱159M** | 69K retirement events |

---

## Grand Portfolio Summary

| Category | # Tools | Total TAM (₱M) | Aggregate SAM (₱M) | Notes |
|----------|---------|----------------|-------------------|-------|
| BIR / Tax tools (A1–A5, B1–B7, C1–C5) | 17 | ~52,000 (raw) | ~8,200 | Heavy base overlap; bundle to ~₱9,920M non-additive |
| Labor / Payroll / Separation (D1–D9) | 9 | ~14,200 (raw) | ~3,400 | Employer/employee base; bundle to ~₱4,167M |
| Corporate / SEC (E1–E6) | 6 | ~2,523M | ~757M | High confidence; clean per-tool data |
| Property / Civil (F1–F4, G1–G5) | 9 | ~35,689M (raw) | ~3,163M | SAM-adjusted for realistic engagement |
| Social Security (SSS, PhilHealth, Pag-IBIG, GSIS) | 17 | ~50,077M (raw) | ~4,726M | Massive consumer base; professional is the revenue driver |
| OFW / Migration (E-OFW-1/2/3) | 3 | ~591M | ~167M | High data confidence |
| Maritime (I-MAR-1/2/3/4) | 4 | ~113M | ~34M | Niche but defensible |
| Transport (G-LTO-1/2, J-CAP-1) | 3 | ~448M | ~134M | — |
| Customs / BOC (F-BOC-1/2/3) | 3 | ~274M | ~110M | Customs broker B2B play |
| Business Licensing (R-DTI-1, N-BFP-1/2, R-CDA-1) | 4 | ~1,121M | ~448M | — |
| ONETT / LRA (O-LRA-1/2/3/4) | 4 | ~375M | ~113M | — |
| PRC / Professional (H-PRC-1/2/3) | 3 | ~363M | ~109M | — |
| Regulatory Specialty (12 tools) | 12 | ~1,965M | ~786M | IPO, ERC, BOI top 3 |
| **TOTAL (raw, all tools)** | **94+** | **~160,000M** | **~22,151M** | Raw TAM; heavy double-counting |
| **TOTAL (SAM — realistic)** | **all** | — | **~₱22,151M** | Realistic revenue ceiling |

**SAM ₱22.15B is the realistic ceiling for a single company capturing all tools at stated pricing with 20–30% digital-adoption penetration.**

---

## Data Confidence Summary by Tool

| Tool ID | % OFFICIAL | % DERIVED | % ESTIMATED | Confidence Rating |
|---------|-----------|-----------|-------------|-------------------|
| B-PHI-2/3 | 80% | 10% | 10% | HIGH |
| A-SSS-1 to -5 | 85% | 10% | 5% | HIGH |
| D-GSIS-1 to -4 | 75% | 15% | 10% | HIGH |
| E-OFW-1 to -3 | 80% | 5% | 15% | HIGH |
| G-LTO-1/2 | 85% | 10% | 5% | HIGH |
| G5 (Life Insurance CSV) | 80% | 10% | 10% | HIGH |
| H-PRC-1/2/3 | 80% | 5% | 15% | HIGH |
| C-HDMF-1/2/3 | 75% | 15% | 10% | HIGH |
| E1–E6 (SEC) | 75% | 15% | 10% | HIGH |
| Q-ERC-1 | 65% | 20% | 15% | HIGH |
| R-PCAB-1 | 70% | 20% | 10% | HIGH |
| S-BSP-1 | 70% | 20% | 10% | HIGH |
| F3 (RPVARA) | 70% | 20% | 10% | HIGH |
| P-IPO-1/2 | 70% | 15% | 15% | HIGH |
| A1 | 60% | 20% | 20% | MEDIUM-HIGH |
| A2–A5 | 55% | 25% | 20% | MEDIUM |
| B1–B7 | 55% | 25% | 20% | MEDIUM |
| C1–C5 | 50% | 30% | 20% | MEDIUM |
| D1–D9 | 50% | 30% | 20% | MEDIUM |
| F1–F4, G1–G4 | 50% | 25% | 25% | MEDIUM |
| L-TES-1 | 55% | 25% | 20% | MEDIUM |
| M-FDA-1/2 | 60% | 20% | 20% | MEDIUM |
| N-BFP-1/2 | 55% | 25% | 20% | MEDIUM |
| O-LRA cluster | 50% | 30% | 20% | MEDIUM |
| R-BOI-1/2 | 55% | 30% | 15% | MEDIUM |
| R-CDA-1 | 60% | 25% | 15% | MEDIUM |
| R-DTI-1 | 55% | 25% | 20% | MEDIUM |
| F-BOC-1/2/3 | 45% | 30% | 25% | MEDIUM |
| A4 (CGT Shares) | 40% | 20% | 40% | LOW-MEDIUM |
| G3 (Marital Property) | 35% | 30% | 35% | LOW-MEDIUM |
| T-NPC-1 | 45% | 25% | 30% | MEDIUM |
| K-NTC-1 | 50% | 20% | 30% | MEDIUM |
| D6 (Back Wages) | 45% | 30% | 25% | MEDIUM |
| I-MAR-1 to -4 | 50% | 20% | 30% | MEDIUM |

---

## Key Findings

### Top 5 Individual Tools by Total TAM
1. **B-PHI-2 PhilHealth Premium** — ₱27,875M TAM / ₱1,394M SAM — Massive worker base (11.4M), highest professional density
2. **F1 RPT+SEF** — ₱18,272M TAM / ₱1,200M SAM — Every property owner in PH, annual obligation
3. **B-PHI-3 PhilHealth Eligibility** — ₱13,667M TAM / ₱683M SAM — Shares base with B-PHI-2
4. **C-HDMF-2 Pag-IBIG MPL** — ₱10,628M TAM / ₱531M SAM — 4.25M loan-eligible members
5. **C-HDMF-3 Pag-IBIG Savings** — ₱8,301M TAM / ₱415M SAM — Mandatory for all employed

### Top 5 by SAM (Better Revenue Signal)
1. **B3 BIR Compliance Calendar** — SAM ₱1,872M — Highest professional density + broad taxpayer base
2. **B-PHI-2 PhilHealth Premium** — SAM ₱1,394M — Largest single-tool consumer base
3. **B1 BIR Form Navigator** — SAM ₱1,407M — Entry-level BIR tool, widest funnel
4. **A1 Self-Employed IT** — SAM ₱1,285M — Highest willingness to pay among individual filers
5. **B6 2307 Tracker** — SAM ₱1,200M — / F1 RPT+SEF — SAM ₱1,200M — tied

### Best Standalone Consumer Products (High C-TAM, Self-Service)
- A1 (Self-Employed IT), A5 (Compensation IT), B3 (Compliance Calendar), F1 (RPT), C-HDMF-2 (MPL)

### Best B2B Professional Tools (High P-TAM, Low Consumer Signal)
- D-GSIS-4 (GSIS Contributions → AAOs), E4 (AFS Filing), D5+D4 (Separation/Retirement), C3 (VAT Refund), D6 (Back Wages)

### Smallest / Niche Tools (SAM < ₱20M — bundle-only strategy)
- D-GSIS-6 (Disability), I-MAR-3 (COC Reval), F-BOC-2 (PCA), P-IPO-2 (TM Fee), K-NTC-1 (Spectrum), R-CDA-1 (Cooperative)
