# Master Domain List — Philippine Regulatory Atlas
## Wave 2: Deduplicate and Merge

**Produced by:** ph-regulatory-atlas-reverse — Wave 2 `deduplicate-and-merge`
**Date:** 2026-02-27
**Source:** Consolidation of 27 Wave 1 analyses across all HIGH and MEDIUM priority agencies

---

## Deduplication Notes

### Cross-Loop Overlaps (with ph-compliance-moats-reverse)

| Domain | This Loop | Sibling Loop | Resolution |
|--------|-----------|--------------|------------|
| SSS/PhilHealth/Pag-IBIG contribution computation | SSS-A7, PHI-A9, HDMF-A14 | D7 (Mandatory Government Contributions — employer payroll) | **KEEP** — sibling D7 is employer/labor-law framing; this loop adds member-type granularity (OFW, self-employed, voluntary, kasambahay special rules) |
| LGU Local Business Tax | DTI-J3 | F2 (Local Business Tax + Business Permit) | **KEEP with note** — sibling F2 covers the LBT computation; this loop's J3 repackages in DTI sole-proprietor context; sibling version is more comprehensive |
| CGT Real Property | LRA-G1/G2 (ONETT pipeline + deadline) | A3 (6% CGT Real Property) + C5 (Property Transfer Tax Bundler) | **KEEP as extension** — sibling covers CGT/DST computations; this loop adds LRA registration fee + multi-agency orchestration under PD 1529; G3 (LRA fee) is fully new |
| ONETT late penalty | LRA-G2 | B2 (BIR Penalty & Interest Calculator) | **KEEP as extension** — sibling B2 covers BIR penalties generically; this loop integrates into property-transfer-specific orchestration |

### Internal Duplicates (within this loop)

| Overlap | Source Aspects | Resolution |
|---------|---------------|------------|
| OWWA Benefits Navigator | dmw-ofw-compliance D4 + owwa-membership D1 | **MERGED → B4 (OWWA Benefits Navigator)** — both aspects identified OWWA eligibility computation; owwa-membership D1 adds post-deployment detail (8 programs, 14-grade disability schedule, scholarship matrix) |

### Excluded Domains (Below 2.75 threshold OR too narrow)

| Domain | Score | Reason |
|--------|-------|--------|
| SSS Funeral Benefit | 2.55 | Low moat (₱12K–₱60K sliding scale is simple table lookup; SSS staff computes on request) |
| DAR SAC Filing Decision Tool | 2.65 | Requires significant judgment; not purely deterministic |
| OWWA BPBH Grant Calculator | 2.65 | 3-tier lookup only; low market (returnee OFWs) |
| DHSUD HOA Registration Tracker | 2.50 | Low computability; process-heavy not formula-heavy |
| DHSUD PD 957 Buyer Protection | 2.25 | Overlaps Maceda Law (sibling loop); judgment-heavy |
| CAAP AMT/ATC License Renewal Tracker | 2.50 | Narrow market (3K–5K maintainers) |
| NTC Broadcast Station License Fee | 2.35 | Very narrow market (~1,800 stations); pure B2B table lookup |

---

## Master Domain List

**Total unique domains: 107**
*(After deduplication of 1 internal merge, 7 exclusions, and noting 4 cross-loop overlaps)*

---

### CATEGORY A: SOCIAL INSURANCE — SSS (7 domains)

**Agency:** Social Security System | **Governing Law:** RA 11199 (Social Security Act of 2018), RA 11210 (EML)

| ID | Domain | Market | Moat | Comp | Pain | Score |
|----|--------|--------|------|------|------|-------|
| A-SSS-1 | Monthly Retirement Pension (BMP): 3-formula system (0.025×RAMC×PPP or 0.40×AMSC or ₱1,000 floor); Option 1 vs. Option 2 NPV comparison | 5 | 3 | 5 | 4 | **4.35** |
| A-SSS-2 | Maternity Benefit: 100% ADSC × leave credits (60/90/105 days by delivery type); daily credit = (12-month payroll ÷ 180); salary differential employer obligation | 5 | 3 | 4 | 4 | **4.05** |
| A-SSS-3 | Contribution Computation & Remittance: monthly MSC table lookup + 14/4/2% employer/EE/self-employed split; kasambahay special rule; 3%/month penalty; ~1M+ employer accounts *(partial overlap sibling D7)* | 5 | 3 | 5 | 5 | **4.55** |
| A-SSS-4 | Sickness Benefit: 90% ADSC × sick leave days (max 120 days/year); 3-in-6 eligibility gate; SSS vs. employer advance determination | 5 | 2 | 4 | 4 | **3.75** |
| A-SSS-5 | Death Benefit / Survivor's Pension: BMP formula if ≥36 contributions else lump sum; dependent child pension (10% BMP + ₱250 per child, max 5) | 4 | 3 | 4 | 4 | **3.75** |
| A-SSS-6 | Unemployment Benefit: 50% AMSC × 2 months; 36-contribution eligibility; 1-claim/3-year limit | 3 | 2 | 5 | 4 | **3.55** |
| A-SSS-7 | Disability Benefit: PTD = BMP lifetime; PPD = BMP÷30 × disability percentage; gradings table (RA 11199 Sec. 13) | 4 | 3 | 3 | 4 | **3.50** |

---

### CATEGORY B: SOCIAL INSURANCE — PHILHEALTH (4 domains)

**Agency:** Philippine Health Insurance Corporation | **Governing Law:** RA 11223 (Universal Health Care Act)

| ID | Domain | Market | Moat | Comp | Pain | Score |
|----|--------|--------|------|------|------|-------|
| B-PHI-1 | Case Rate Benefit Application: ~9,000 fixed case rates (PC2024-0037) → compute PhilHealth share + patient out-of-pocket before hospitalization; no patient-facing tool exists anywhere | 5 | 1 | 5 | 5 | **4.00** |
| B-PHI-2 | Premium Contribution Computation: 5% × BMS; floor ₱500/ceiling ₱5,000/month; employer 50%/employee 50% split; different rules for self-employed, voluntary, OFW, kasambahay; 3%/month compounded penalty *(partial overlap sibling D7)* | 5 | 2 | 5 | 3 | **3.85** |
| B-PHI-3 | Benefit Eligibility Determination: contribution-count gates by member category (3-in-6 employed; 9-in-12 self-employed; 120 months lifetime for direct contributors); membership validation matrix | 5 | 2 | 4 | 4 | **3.75** |
| B-PHI-4 | OFW PhilHealth Contribution Portability: 5% × OFW salary (declared); voluntary membership continuity on return; lapse consequences; remittance channel matrix | 4 | 2 | 4 | 4 | **3.50** |

---

### CATEGORY C: SOCIAL INSURANCE — PAG-IBIG / HDMF (5 domains)

**Agency:** Home Development Mutual Fund | **Governing Law:** RA 9679

| ID | Domain | Market | Moat | Comp | Pain | Score |
|----|--------|--------|------|------|------|-------|
| C-HDMF-1 | Housing Loan Eligibility & Amortization: 35% HLAR income cap; LTV by property value; 3-tier interest rate (3% affordable / 5.375–10.5% regular); age+term ≤70 cap; MRI + fire insurance premiums; Affordable Housing Program chronically underutilized | 5 | 3 | 4 | 4 | **4.00** |
| C-HDMF-2 | MPL & Calamity Loan Computation: 80% TAV formula; ₱1M MPL + ₱1M calamity combined ceiling; 10.75% MPL / 5.95% calamity annuity; 1/20 of 1%/day penalty; 3.2M+ borrowers/year | 5 | 2 | 5 | 3 | **3.65** |
| C-HDMF-3 | Mandatory Savings Contribution: graduated table (1%/2% of MBC up to ₱5K/month); OFW/kasambahay rules; 1/10 of 1%/day late penalty *(partial overlap sibling D7)* | 5 | 2 | 5 | 3 | **3.65** |
| C-HDMF-4 | MP2 Savings Growth Projection: 5-year lock-in; 7.10% 2024 dividend; terminal payout vs. annual dividend computation | 4 | 1 | 5 | 2 | **2.85** |
| C-HDMF-5 | TAV Accumulation & Refund: total contributions + annual compounded dividend; qualifying grounds checklist; loan offset computation | 4 | 1 | 4 | 2 | **2.80** |

---

### CATEGORY D: SOCIAL INSURANCE — GSIS (6 domains)

**Agency:** Government Service Insurance System | **Governing Law:** RA 8291, RA 660, RA 1616, PD 1146, RA 7699

| ID | Domain | Market | Moat | Comp | Pain | Score |
|----|--------|--------|------|------|------|-------|
| D-GSIS-1 | BMP Retirement Pension + Option 1/2 NPV Decision: 0.025 × (AMC + ₱700) × PPP; max 90% of AMC; Option 1 (60× lump sum) vs. Option 2 (18× cash + immediate pension) — irreversible election; 100K–150K annual retirees | 4 | 3 | 5 | 4 | **4.00** |
| D-GSIS-2 | Legacy Law Selection (RA 660/1616/PD 1146/RA 8291): eligibility tree by service entry date; RA 660 "Magic 87" / RA 1616 "Take All" / RA 8291 default; 200K+ pre-1997 employees face irreversible benefit-maximization choice worth ₱5K–₱20K/month differential | 3 | 4 | 4 | 4 | **3.80** |
| D-GSIS-3 | Portability Totalization (RA 7699): pro-rata pension by own PPP÷total PPP; many government-private switchers forfeit benefits from ignorance; 2M+ potentially affected | 2 | 4 | 4 | 4 | **3.50** |
| D-GSIS-4 | Contribution Computation & Employer Remittance: 21% total (9% EE + 12% employer); criminal liability for agency heads; 2,000+ government agencies | 4 | 2 | 5 | 3 | **3.40** |
| D-GSIS-5 | Survivorship & Death Benefit: 50% BMP pension to surviving spouse; dependent child pension; cash options by contribution tier; ₱30K funeral | 3 | 3 | 4 | 3 | **3.30** |
| D-GSIS-6 | Disability Benefit: PTD = BMP for life + 18× BMP if ≥180 contributions; PPD = BMP÷30 × LWOP days; TTD = 75% daily salary (floor ₱70/ceiling ₱340) | 3 | 3 | 3 | 3 | **3.00** |

---

### CATEGORY E: OFW & OVERSEAS WORK (6 domains)

**Agency:** DMW, OWWA | **Governing Law:** RA 8042, RA 10022, RA 11641, RA 10801

| ID | Domain | Market | Moat | Comp | Pain | Score |
|----|--------|--------|------|------|------|-------|
| E-OFW-1 | OFW Placement Fee Legality Checker: destination country on no-fee list? → zero; HSW/seafarer/direct-hire? → zero; else cap = 1× basic salary; binary tree from RA 10022 Sec. 6 + DMW-DC-01-2023 Sec. 49–54; 500K+ new deployments/year; illegal fees ₱45K–₱200K/victim | 5 | 3 | 5 | 5 | **4.35** |
| E-OFW-2 | OFW Total Pre-Departure Cost Calculator: OWWA USD 25 + OFW Pass ₱100 + PhilHealth 5% BMS + Pag-IBIG ₱100/month + NBI/PSA/passport/medical; new hire vs. balik-manggagawa paths; 1.7M+ annual deployments | 5 | 2 | 5 | 4 | **3.80** |
| E-OFW-3 | OWWA Benefits Eligibility Navigator: death ₱100K–₱200K+₱20K burial; disability ₱2.5K–₱100K by 14-grade impediment schedule (MOI No. 004 S. 1996); MEDplus ₱50K; 72-hour claim window; 80%+ benefit underutilization confirmed *(merged from DMW-D4 + OWWA-D1)* | 5 | 3 | 4 | 3 | **3.55** |
| E-OFW-4 | OFW Documentary Requirements Matrix Generator: worker type × destination country × job category → customized documentary checklist; 500K+ new applications/year | 5 | 2 | 4 | 3 | **3.55** |
| E-OFW-5 | OWWA Scholarship Program Selector: 8-program matrix (EDSP ₱60K, ODSP ₱20K w/ ≤USD 600 salary threshold, SESP ₱14.5K, SUP ₱7.5K, ELAP, Maritime Cadetship ₱30K, Congressional ₱100K); 5M+ OFW-dependent children eligible | 4 | 3 | 4 | 3 | **3.55** |
| E-OFW-6 | OWWA Rebate Eligibility & Amount Calculator: (N–5)×₱100×loyalty_multiplier (1.0/1.1/1.2 for <15/15–19/≥20 years); ≥10-year gate; 556K identified beneficiaries | 3 | 2 | 5 | 3 | **3.10** |

---

### CATEGORY F: TRADE, CUSTOMS & EXCISE (5 domains)

**Agency:** Bureau of Customs | **Governing Law:** RA 10863 (CMTA), RA 10963 (TRAIN), RA 8752/8800/8751

| ID | Domain | Market | Moat | Comp | Pain | Score |
|----|--------|--------|------|------|------|-------|
| F-BOC-1 | Landed Cost Calculator: CIF × AHTN duty rate + 12% VAT on landed cost + brokerage (₱1,300–₱5,300+0.125%) + IPF + de minimis check (₱10K FOB); millions of e-commerce importers + 100K+ SMEs | 5 | 3 | 4 | 4 | **4.20** |
| F-BOC-2 | PCA Compliance Checker & PDP Advisor: 3-year lookback; penalty = 125%/600% × deficiency + 20%/year interest; ₱2.71B PCAG collections 2024; growing ₱3.5B target | 3 | 3 | 4 | 5 | **3.90** |
| F-BOC-3 | Automobile Excise Tax Transparency Calculator: NMISP × rate table (4%/10%/20%/50%); hybrid 50% of applicable rate; EV exempt; 400K+ new cars/year | 4 | 3 | 5 | 3 | **3.85** |
| F-BOC-4 | FTA Rate Optimizer (ATIGA/AKFTA/AIFTA vs. MFN): rate differential computation + ROO compliance check; large import volume × small % savings = material impact for SMEs | 4 | 3 | 3 | 3 | **3.35** |
| F-BOC-5 | Petroleum/Alcohol/Tobacco Excise (Import): specific rates per liter/pack/unit from TRAIN; duty + excise + VAT stacking; fully deterministic but narrow B2B market | 2 | 3 | 5 | 2 | **3.00** |

---

### CATEGORY G: TRANSPORTATION & MOTOR VEHICLES (4 domains)

**Agency:** Land Transportation Office | **Governing Law:** RA 4136, RA 8794, RA 10930, AO-VDM-2024-046

| ID | Domain | Market | Moat | Comp | Pain | Score |
|----|--------|--------|------|------|------|-------|
| G-LTO-1 | MVUC + Total Annual Registration Cost Calculator: graduated MVUC table (motorcycle ₱240 → heavy car ₱8,000); 30%/15% EV/hybrid discount; 50% late surcharge; full-bill aggregation with emission test + plate + sticker + CTPL; 14M+ annual transactions | 5 | 3 | 5 | 4 | **4.40** |
| G-LTO-2 | Late Registration Penalty Calculator: 50% MVUC surcharge; per-year multi-year computation; inherited penalties for used-car buyers | 4 | 3 | 5 | 3 | **3.90** |
| G-LTO-3 | Vehicle Transfer of Ownership Cost Estimator: LTO ₱530–₱680 + HPG ₱500 + notarization ₱300–₱1,500 + chattel release; AO-VDM-2024-046 ₱5,000 penalty (5-day seller / 20-day buyer deadlines); 200K–500K used-vehicle sales/year | 3 | 3 | 4 | 4 | **3.75** |
| G-LTO-4 | Driver's License Cost & Timeline Calculator: enumerated LTO fee schedule (₱317–₱910 by type); re-exam trigger for >2-year expired license | 4 | 2 | 5 | 2 | **3.40** |

---

### CATEGORY H: PROFESSIONAL LICENSING — PRC (4 domains)

**Agency:** Professional Regulation Commission | **Governing Law:** RA 8981, RA 10912

| ID | Domain | Market | Moat | Comp | Pain | Score |
|----|--------|--------|------|------|------|-------|
| H-PRC-1 | CPD Compliance Eligibility & Unit Gap Calculator: 43 profession-specific requirements (15 or 45 units/3 years); OFW exemption; senior/PWD reduction; newly-licensed exemption; SDL cap 30% per PRC Res. 1197 s.2019; carryover stacking; 4M+ licensed professionals | 4 | 3 | 5 | 4 | **4.00** |
| H-PRC-2 | PRC License Renewal Total Cost Calculator: base fee ₱420–₱450; 50% late surcharge; CPD seminar cost range ₱1K–₱3K/unit (unregulated); 1.3M–1.6M renewals/year | 5 | 2 | 5 | 3 | **3.85** |
| H-PRC-3 | CPD Seminar Cost Optimizer: SDL cap optimization + provider comparison; 45-unit professions face ₱45K–₱135K in seminar costs over 3 years; no cost minimizer exists | 5 | 3 | 4 | 3 | **3.75** |
| H-PRC-4 | Board Exam Application Eligibility & Fee Calculator: 43 professions × first-timer/repeater/conditioned rules; ₱450–₱2,200 fees; 507K exam applications FY2024 | 4 | 2 | 3 | 3 | **3.20** |

---

### CATEGORY I: MARITIME — MARINA / SEAFARERS (4 domains)

**Agency:** Maritime Industry Authority | **Governing Law:** PD 474, RA 9295, RA 10635, RA 12021, STCW Convention

| ID | Domain | Market | Moat | Comp | Pain | Score |
|----|--------|--------|------|------|------|-------|
| I-MAR-1 | Total STCW Certification Cost Calculator: MC GC-2026-01 (622-line Omnibus Fee Schedule); COC/COP fees + training center costs (BST ₱5K–₱8K, GMDSS ₱15K–₱25K, ECDIS ₱8K–₱15K); 115K+ revalidations/year; missed deployment = direct income loss | 5 | 3 | 5 | 4 | **4.10** |
| I-MAR-2 | STCW Certification Pathway & Sea Service Eligibility Calculator: STCW Tables A-II/1, A-III/1 exact sea service thresholds; training prerequisites per COC level; 50K+ promotion-seeking seafarers/year; 576K deployed (2023 all-time high) | 5 | 3 | 5 | 4 | **4.05** |
| I-MAR-3 | COC/COP Revalidation Document Checklist Generator: rank-specific conditional lookup; MISMO rejections = weeks-long deployment delays = income loss; 300K–500K transactions/year | 5 | 2 | 5 | 3 | **3.80** |
| I-MAR-4 | Annual Tonnage Fee (ATF) Calculator for Vessel Operators: graduated rate schedule (MC 2008-05/07); fleet aggregation; late penalty per MC 120; 5K–10K domestic vessel operators | 3 | 3 | 5 | 3 | **3.20** |

---

### CATEGORY J: AVIATION (3 domains)

**Agency:** Civil Aviation Authority of the Philippines | **Governing Law:** RA 9497, PCAR Parts 2/4/11

| ID | Domain | Market | Moat | Comp | Pain | Score |
|----|--------|--------|------|------|------|-------|
| J-CAP-1 | RPAS/Drone Compliance Suite: fully deterministic 3-cert stack (commercial any weight → controller ₱3,360 + registration ₱1,680 + operator cert; recreational ≥7kg → registration; <7kg = exempt); ₱20K–₱100K penalty; 2K–5K commercial operators growing 15–20%/yr | 3 | 3 | 5 | 4 | **3.50** |
| J-CAP-2 | Aircraft Airworthiness & Registration Fee Calculator: MTOW-based 4-class structure (MC 018-2023); USD-denominated fees; CofA 12-month renewal; ₱20K–₱80K import legal fees; ~500–1K civil aircraft | 2 | 4 | 4 | 3 | **3.00** |
| J-CAP-3 | Pilot License Pathway Eligibility & Cost Calculator: PPL 40hr/CPL 150hr/ATPL 1,500hr minimums; exam subjects/fees fully enumerated; SPL→PPL→CPL→ATPL pathway deterministic; 300–500 new CPL candidates/year | 2 | 3 | 4 | 3 | **2.75** |

---

### CATEGORY K: TELECOMMUNICATIONS (3 domains)

**Agency:** National Telecommunications Commission | **Governing Law:** RA 7925, EO 546, MC 10-10-97

| ID | Domain | Market | Moat | Comp | Pain | Score |
|----|--------|--------|------|------|------|-------|
| K-NTC-1 | Spectrum User Fee Calculator: bandwidth (KHz) × rate/KHz × area tier (CMTS ₱10/₱5/₱2.50; PMRS ₱20–₱50); 2K–8K spectrum holders; 25% + 1%/month late penalty | 2 | 3 | 5 | 3 | **3.35** |
| K-NTC-2 | Private Radio Fleet License Manager: station fee by service type × ERP × mode; 200K–500K private stations (security, logistics, shipping); renewal calendar pain | 3 | 2 | 4 | 3 | **2.85** |
| K-NTC-3 | NTC Type Acceptance/Approval Import Screener: TA vs. TAC decision tree (CPE vs. RCE) + fee computation (₱5K–₱20K/model + lab testing); certification agents charge ₱15K–₱80K; 10K–30K models/year | 2 | 3 | 3 | 3 | **2.75** |

---

### CATEGORY L: SKILLS & VOCATIONAL CERTIFICATION (4 domains)

**Agency:** TESDA | **Governing Law:** RA 7796, RA 8545 (PESFA), RA 7685 (TWSP)

| ID | Domain | Market | Moat | Comp | Pain | Score |
|----|--------|--------|------|------|------|-------|
| L-TES-1 | NC Expiry Tracker & Re-assessment Reminder: NC/COC valid exactly 5 years; 935K+ certifications/year → ~4M–5M active NCs; ~800K–1M expiries/year; no TESDA notification system; expired NC discovered at job application = income risk | 5 | 2 | 5 | 3 | **3.60** |
| L-TES-2 | TESDA Assessment Cost & Qualification Finder: ₱400–₱3,723 by qualification title (9× fee range; only in PDFs); + ₱35 processing; 935K assessments/year | 4 | 1 | 5 | 3 | **3.40** |
| L-TES-3 | TESDA Scholarship Eligibility & Benefit Calculator: PESFA income ≤₱300K + age ≥15; TWSP age ≥18; TSF = ₱160/day × days (2-tranche); overlapping programs (TWSP/PESFA/STEP/UAQTEA) | 4 | 1 | 4 | 3 | **3.30** |
| L-TES-4 | UTPRAS Institution Registration Navigator: ₱1K application + ₱1K/program; ₱2K–₱10K penalty + 2yr imprisonment for unregistered operation; 14K+ registered programs | 2 | 2 | 4 | 3 | **2.80** |

---

### CATEGORY M: HEALTHCARE PRODUCTS (4 domains)

**Agency:** Food and Drug Administration | **Governing Law:** RA 9711, AO 50 s. 2001, AO 2024-0016 (suspended)

| ID | Domain | Market | Moat | Comp | Pain | Score |
|----|--------|--------|------|------|------|-------|
| M-FDA-1 | FDA CPR + LTO Total Registration Cost Calculator: LTO by establishment type (drug mfg ₱27.5K–₱56K; distributor ₱8K; drugstore ₱3K) + CPR per product (food supplement ₱1K; medical device Class D ₱58.5K); 70% renewal rate; 30K–80K regulated entities | 3 | 3 | 5 | 4 | **3.80** |
| M-FDA-2 | Multi-Product Renewal Compliance Calendar: portfolio of 10–500 CPRs; cliff date tracking; annual renewal cash flow forecasting; consultants charge ₱50K–₱300K/year | 3 | 3 | 5 | 4 | **3.80** |
| M-FDA-3 | Product Classification & Regulatory Pathway Screener: 4-center decision tree (CDRR/CFRR/CCRR/CDRRHR) + risk class; misclassification = wasted fees + months of rework | 3 | 4 | 3 | 4 | **3.45** |
| M-FDA-4 | Late Renewal Surcharge & 120-Day Cliff Calculator: 2×R + 10%×R×months (max 4 months = 240%×R); beyond 120 days = full new-application restart (24–36-month review); est. 2,500–3,750 late events/year | 2 | 3 | 5 | 4 | **3.40** |

---

### CATEGORY N: FIRE SAFETY COMPLIANCE (4 domains)

**Agency:** Bureau of Fire Protection | **Governing Law:** RA 9514 (Fire Code), RIRR 2019, BFP MC-2021-020

| ID | Domain | Market | Moat | Comp | Pain | Score |
|----|--------|--------|------|------|------|-------|
| N-BFP-1 | Fire Safety Equipment Requirements Screener: IRR Rule 10 Div.6–21 occupancy-specific thresholds (11 types × floor area × building height × sprinkler); ~170K failures/year = immediate closure; pre-inspection diagnostic tool eliminates FSP moat (₱10K–₱50K/engagement) | 4 | 3 | 3 | 5 | **4.15** |
| N-BFP-2 | FSIC Compliance Calendar + FSMR Tracker: annual FSIC deadline tracking + FSMR submission + fire drill records + extinguisher maintenance; January 20 crunch; 1.2M+ businesses | 4 | 3 | 5 | 4 | **4.05** |
| N-BFP-3 | FSIC Annual Fee Pre-Calculator: 10% of LGU permit fees (floor ₱500); Fire Code Realty Tax 0.10% × assessed value; 3M+ annual inspections | 4 | 2 | 4 | 3 | **3.65** |
| N-BFP-4 | FSEC Fee Calculator: 0.10% × construction cost (max ₱50K); 196,571 FSECs/year; low standalone pain | 3 | 2 | 5 | 2 | **2.95** |

---

### CATEGORY O: LAND, PROPERTY & AGRARIAN REFORM (9 domains)

**Agencies:** LRA, DAR, DHSUD | **Governing Laws:** PD 1529, RA 6657/9700, RA 11201/PD 957

| ID | Domain | Market | Moat | Comp | Pain | Score |
|----|--------|--------|------|------|------|-------|
| O-LRA-1 | ONETT Deadline & Late Penalty Calculator: 30-day CGT + 5-day DST deadlines; 25% surcharge + 12%/yr interest (NIRC Sec. 248–250); date arithmetic with multi-agency sequencing *(extends sibling B2/A3)* | 5 | 3 | 5 | 4 | **3.80** |
| O-LRA-2 | ONETT Pipeline Calculator: CGT 6% + DST 1.5% + LGU transfer tax 0.5–0.75% + LRA registration fee (17-tier graduated) + PD 1529 Sec. 117 double-fee check; multi-agency (BIR→LGU→Assessor→LRA); processing services ₱20K–₱30K *(extends sibling C5/A3)* | 5 | 3 | 4 | 4 | **3.75** |
| O-LRA-3 | BIR Zonal Value Lookup Tool: gating input for all real property transfer computations; currently scattered across PDF bulletins; no unified searchable tool | 4 | 2 | 5 | 4 | **3.60** |
| O-LRA-4 | LRA Registration Fee & Annotation Fee Calculator: 17-tier graduated scale; annotation ₱20/line; entry ₱50/instrument; PD 1529 Sec. 117 double-fee if >365 days since notarization; LRA's own ERCF tool under maintenance | 4 | 2 | 5 | 3 | **3.40** |
| O-DAR-1 | CARP Just Compensation Estimator: LV = (CNI×0.6)+(CS×0.3)+(MV×0.1); CNI = [(AGP×SP)−CO]÷0.12 (12% cap rate); verifies LBP's Memorandum of Valuation; LBP typically offers 20–50% below SAC-awarded; ≥2,400 contested cases; 15-day SAC filing deadline | 3 | 3 | 4 | 4 | **3.50** |
| O-DHSUD-1 | Balanced Housing Requirement Calculator: 4 compliance modes (self-develop 15%/5%; JV 25% of socialized cost; bond subscription recoverable; LGU cash 3.75%/1.25% non-recoverable); NPV comparison material; ₱1M–₱5M penalty; lawyers ₱50K–₱150K/opinion | 2 | 3 | 5 | 4 | **3.50** |
| O-DAR-2 | CARP Coverage & Retention Area Calculator: retention = 5ha + (3ha × children ≤3) = max 14ha; coverage test by land area/classification/use | 3 | 3 | 3 | 3 | **3.00** |
| O-DHSUD-2 | CR/LTS Processing Fee + Performance Bond Calculator: ₱17.30/sqm residential + ₱36/sqm commercial + ₱1,500/ha inspection; bond = 20% of unfinished cost; 642 LTS projects/year | 2 | 3 | 4 | 3 | **3.00** |
| O-DAR-3 | ARB Amortization Schedule Generator: 6%/30yr annuity with 5%-of-AGP initial cap; reduced relevance post-RA 11953 condonation but 134K new CLOAs/year (SPLIT project) | 2 | 2 | 5 | 2 | **2.90** |

---

### CATEGORY P: INTELLECTUAL PROPERTY (4 domains)

**Agency:** IPOPHL | **Governing Law:** RA 8293 (IP Code), MC 16-012, MC 2023-001, MC 2024-023

| ID | Domain | Market | Moat | Comp | Pain | Score |
|----|--------|--------|------|------|------|-------|
| P-IPO-1 | IP Portfolio Compliance Dashboard: unified calendar for trademark DAU (year 3+5) + trademark renewal (year 10) + patent annuity (years 5–20) across all asset types; 200K–400K active marks + 20K–45K active patents; IP firms charge ₱10K–₱20K/year retainer; enterprise docketing software prices out SMEs | 3 | 4 | 4 | 5 | **4.05** |
| P-IPO-2 | Trademark Total Fee Calculator + DAU Tracker: filing (₱1,200–₱2,592/class) + issuance + publication + DAU (₱900–₱2,400) + renewal (₱3,100–₱6,600/class); 42K+ new filings/year; 50% surcharge for late DAU | 3 | 3 | 5 | 4 | **3.80** |
| P-IPO-3 | Patent Annuity Calendar & Cost Projector: 16-row escalating fee table (₱1,550 year 5 → ₱65,160 year 20); grace-period 50% surcharge; 4,500 patent + 1,847 UM applications/year; 84% non-resident filers | 2 | 3 | 5 | 4 | **3.55** |
| P-IPO-4 | Trademark Classification & Filing Cost Estimator: Nice Classification lookup + fee computation; partial judgment for class determination | 3 | 2 | 3 | 3 | **2.75** |

---

### CATEGORY Q: ENERGY (4 domains)

**Agency:** Energy Regulatory Commission | **Governing Law:** RA 9136 (EPIRA), RA 11552, RA 9513

| ID | Domain | Market | Moat | Comp | Pain | Score |
|----|--------|--------|------|------|------|-------|
| Q-ERC-1 | Electricity Bill Verification & Total Cost Estimator: 12+ unbundled ERC-published line items (generation + transmission + system loss + distribution + supply + metering + UC sub-components + FIT-All + lifeline rate + VAT + franchise tax); 18M+ billed households | 5 | 2 | 4 | 4 | **3.75** |
| Q-ERC-2 | Lifeline Rate Eligibility & Savings Calculator: binary eligibility (4Ps/below PSA poverty line); 0–50kWh=100%/51–70kWh=35%/71–100kWh=20% discount (ERC Res. 02 S. 2026); 4.5M eligible vs. 330K enrolled (7.3%); 93% gap = ₱30B+ unclaimed annual subsidies | 4 | 1 | 5 | 4 | **3.55** |
| Q-ERC-3 | Net Metering Credit & Solar Payback Calculator: exported kWh × DU blended generation rate; unlimited credit banking post-DC2024; 17K users growing; solar investment NPV computation | 2 | 2 | 5 | 3 | **3.10** |
| Q-ERC-4 | FIT Revenue & Annual Rate Adjustment Calculator: ERC Res. 16 S. 2010 CPI/FX adjustment formula; 84 FIT plants; B2B niche | 2 | 4 | 3 | 2 | **2.90** |

---

### CATEGORY R: BUSINESS REGISTRATION & COMPLIANCE (15 domains)

**Agencies:** DTI, PCAB, CDA, BOI/PEZA | **Governing Laws:** RA 3883, RA 7160, RA 4566, RA 9520, RA 11534/12066

| ID | Domain | Market | Moat | Comp | Pain | Score |
|----|--------|--------|------|------|------|-------|
| R-DTI-1 | Annual Business Compliance Calendar: DTI 5-year expiry + LGU January 20 deadline + quarterly LBT installments (Jan/Apr/Jul/Oct 20) + BIR filing calendar + mandated benefits remittance; 5M+ sole proprietors | 5 | 3 | 4 | 4 | **4.00** |
| R-BOI-1 | SCIT vs. EDR Election Analysis Tool (CREATE MORE Act): SCIT = 5% × GIE (Revenue − direct costs; 3%/2% national/LGU split) vs. EDR = 20% CIT + 100% power deduction + 50% labor; irrevocable election; Big 4 only (₱200K–₱500K); 3K–5K active enterprises | 2 | 5 | 4 | 4 | **3.95** |
| R-BOI-2 | ITH Period Calculator + Tax Savings NPV Summary: Tier 1/2/3 × NCR/adjacent/other = 4–7yr base; +2yr conflict/disaster; +3yr NCR relocation; FIRB >₱15B gets 20yr post-ITH; fully deterministic lookup table | 2 | 4 | 5 | 4 | **3.60** |
| R-CDA-1 | CDA Tax Exemption (CTE) Eligibility Checker + Navigator: Category A/B/C classification by member-transaction ratio + reserve threshold; 60-day initial filing window almost universally missed; 5-year CTE; CPAs charge ₱8K–₱50K/event; ~6K CTE events/year | 3 | 3 | 4 | 4 | **3.70** |
| R-DTI-2 | LGU Local Business Tax (LBT) Estimator: gross receipts × LGU rate (RA 7160 max 0.5%–2% by type; city=municipal×150%); 1.2–1.5M annual renewals; 25%+2%/month penalty *(overlap sibling F2 — sibling version more comprehensive)* | 4 | 3 | 3 | 4 | **3.70** |
| R-DTI-3 | New Business Startup Cost Navigator: DTI + barangay + mayor's permit (LBT + FSIC + sanitation) + BIR (₱0 registration); total startup cost aggregation; 929K new registrations/year | 4 | 2 | 3 | 4 | **3.70** |
| R-CDA-2 | CDA Net Surplus Distribution Compliance Checker: statutory allocations (Reserve ≥10%, Education ≤10%, CDA Fund ≥3%, PR ≥30%); ₱10M accumulated reserves cliff triggers CTE status change; ~12K–14K cooperative AGA cycles/year | 3 | 3 | 5 | 3 | **3.55** |
| R-PCAB-1 | PCAB ACP Score Calculator & Category Eligibility Screener: FC_pts = NetWorth÷₱100K + EC_pts = EquipNBV÷₱100K + FE_pts = YearsActive×10+AAVW÷₱100K + STE_pts; 70K+ contractors; 51.5K annual applications; non-refundable fees + downgrade risk | 3 | 3 | 5 | 4 | **3.60** |
| R-CDA-3 | CDA Annual Compliance Calendar + Penalty Estimator: AGA +90 days; AFS to CDA +120 days; BIR April 15; CTE renewal −60 days; revocation → retroactive back-tax liability | 3 | 3 | 5 | 3 | **3.20** |
| R-PCAB-2 | PCAB Renewal Compliance Calendar: staggered renewal windows by license number last digit; APF ₱5K + ALF ₱10K if after June 30; 41K+ renewals/year | 3 | 3 | 5 | 3 | **3.30** |
| R-BOI-3 | Annual GIE Compliance Tracker: quarterly 5% SCIT with LGU split by DBM formula; annual performance reports; employment commitment tracking | 2 | 3 | 4 | 3 | **3.05** |
| R-PCAB-3 | ARCC Project Eligibility Checker: contractor category → ARCC range + RA 9184 Sec. 23.11.2 "50% restriction"; bid rejection trap | 2 | 3 | 4 | 3 | **3.10** |
| R-DTI-4 | DTI Business Name Registration Fee + Renewal Tracker: 4-tier fee table + ₱30 DST + 50% surcharge; 5-year validity; 1.056M transactions in 2024 | 4 | 1 | 5 | 2 | **3.40** |
| R-BOI-4 | SIPP Activity Pre-Screener & BOI vs. PEZA Eligibility Checker: SIPP activity list lookup + PEZA SEZ location + export % requirements | 2 | 3 | 3 | 3 | **3.00** |
| R-PCAB-4 | Joint Venture Special License Fee & Category Estimator: dominant equity partner's category assigned to JV; separate license required; criminal penalty for missing JV license | 2 | 3 | 3 | 3 | **2.80** |

---

### CATEGORY S: FINANCIAL SERVICES & AML (8 domains)

**Agencies:** BSP, PAGCOR | **Governing Laws:** RA 7653, RA 11127, RA 9160 (AMLA), PD 1869, RA 10927

| ID | Domain | Market | Moat | Comp | Pain | Score |
|----|--------|--------|------|------|------|-------|
| S-BSP-1 | Pawnshop Loan Cost Transparency Tool: total cost = principal × monthly_rate × months + service charge; 20M–40M annual pawning transactions; consumer financial inclusion; BSP has basic calculator but UX gap remains | 5 | 2 | 5 | 3 | **3.60** |
| S-BSP-2 | BSP MSB/Pawnshop AMLA Compliance Calendar: CTR threshold triggers (₱500K+); STR 5-day deadline; quarterly reporting; Circular 1206 (Dec 2024) reclassification; AMLA penalty ₱500K–₱1M/violation; 16K+ offices | 2 | 3 | 4 | 4 | **3.50** |
| S-BSP-3 | OPS/EMI/VASP Capital Requirement & Classification Screener: capital tiers by txn volume (EMI ₱100M–₱200M; VASP ₱10M–₱50M; RTC ₱50M); EMI moratorium lifted Dec 2024; law firm moat ₱500K–₱2M | 1 | 5 | 4 | 4 | **3.50** |
| S-PGC-1 | Casino AML/CTR Compliance Tracker (RA 10927): CTR = aggregate ≥₱5M per patron per gaming day; STR = no threshold; PAGCOR PASED + AMLC enforcement; ₱500K–₱1M/violation; 174+ operators; fastest-growing (e-games +165% GGR) = weakest compliance | 2 | 3 | 4 | 4 | **3.50** |
| S-PGC-2 | PAGCOR Gaming vs. Non-Gaming Income Tax Classifier: gaming GGR → 5% franchise tax (in lieu of all taxes per PD 1869 Sec. 13); non-gaming → 25% CIT + 12% VAT; RMC 132-2024; misclassification on ₱1B revenue = ₱200M+ tax difference | 1 | 4 | 3 | 4 | **3.45** |
| S-PGC-3 | PAGCOR GGR License Fee Dashboard: GGR × rate (30% e-games/non-IR; 25% IR online; 15% live sports/junket); MGF floor ₱9M/month from Apr 2026; multi-segment reconciliation | 1 | 3 | 4 | 4 | **3.30** |
| S-BSP-4 | BSP Annual Supervision Fee (ASF) Calculator: per-office rate × office count by MSB type; ~2,151 entities; BSP proactively bills so pain is low | 2 | 2 | 5 | 2 | **2.90** |
| S-PGC-4 | Junket Operator Revenue Model Comparator: rolling chip commission (1.25%) vs. revenue share (40–50% GGR); PAGCOR share ~26.5%; ~100–200 junket operators | 1 | 3 | 4 | 3 | **2.80** |

---

### CATEGORY T: DATA PRIVACY (4 domains)

**Agency:** National Privacy Commission | **Governing Law:** RA 10173 (Data Privacy Act)

| ID | Domain | Market | Moat | Comp | Pain | Score |
|----|--------|--------|------|------|------|-------|
| T-NPC-1 | 72-Hour Breach Notification Protocol: binary harm assessment → countdown → notification content generator → DBNMS checklist → 5-day full report; concealment = 18mo–5yr imprisonment + ₱500K–₱1M; 1K–3K breach events/year | 3 | 3 | 4 | 4 | **3.50** |
| T-NPC-2 | Annual Security Incident Report (ASIR) Filing Tool: 15-category classification; fixed March 31 deadline; all PICs/PIPs regardless of registration; ~50K–100K organizations; zero-incident reports still required | 3 | 3 | 5 | 3 | **3.35** |
| T-NPC-3 | NPC Registration Eligibility Screener + Compliance Calendar: 3-threshold check (250+ employees OR 1,000+ SPI OR high-risk); 15K–30K mandatory registrants; annual renewal | 2 | 3 | 4 | 3 | **3.30** |
| T-NPC-4 | Privacy Impact Assessment (PIA) Trigger Screener: NPC Circular 2016-01 mandatory for government agencies; Circular 2023-06 security requirements; trigger checklist | 2 | 3 | 3 | 3 | **3.00** |

---

## Summary Statistics

| Category | Domains | Top Score | Top Domain |
|----------|---------|-----------|------------|
| A — SSS Benefits | 7 | 4.55 | Contribution Computation |
| B — PhilHealth | 4 | 4.00 | Case Rate Benefit Application |
| C — Pag-IBIG | 5 | 4.00 | Housing Loan Eligibility |
| D — GSIS | 6 | 4.00 | BMP Pension + Option Decision |
| E — OFW/OWWA | 6 | 4.35 | Placement Fee Legality Checker |
| F — Customs/BOC | 5 | 4.20 | Landed Cost Calculator |
| G — LTO | 4 | 4.40 | MVUC + Total Registration |
| H — PRC | 4 | 4.00 | CPD Compliance Calculator |
| I — MARINA | 4 | 4.10 | STCW Cost Calculator |
| J — CAAP | 3 | 3.50 | RPAS Compliance Suite |
| K — NTC | 3 | 3.35 | Spectrum User Fee |
| L — TESDA | 4 | 3.60 | NC Expiry Tracker |
| M — FDA | 4 | 3.80 | CPR/LTO Cost + Renewal Calendar |
| N — BFP | 4 | 4.15 | Fire Equipment Screener |
| O — Land/Property | 9 | 3.80 | ONETT Deadline Calculator |
| P — IPOPHL | 4 | 4.05 | IP Portfolio Dashboard |
| Q — ERC | 4 | 3.75 | Bill Verification Tool |
| R — Business/BOI | 15 | 4.00 | Annual Compliance Calendar |
| S — BSP/PAGCOR | 8 | 3.60 | Pawnshop Loan Transparency |
| T — NPC | 4 | 3.50 | Breach Notification Protocol |
| **TOTAL** | **107** | **4.55** | **SSS Contribution (A-SSS-3)** |

---

## Top 20 Domains by Score

| Rank | ID | Domain | Score |
|------|----|--------|-------|
| 1 | A-SSS-3 | SSS Contribution Computation & Remittance | **4.55** |
| 2 | G-LTO-1 | MVUC + Total Annual Registration Cost Calculator | **4.40** |
| 3 | E-OFW-1 | OFW Placement Fee Legality Checker | **4.35** |
| 4 | A-SSS-1 | SSS Monthly Retirement Pension (BMP) | **4.35** |
| 5 | F-BOC-1 | BOC Landed Cost Calculator | **4.20** |
| 6 | N-BFP-1 | Fire Safety Equipment Requirements Screener | **4.15** |
| 7 | I-MAR-1 | Total STCW Certification Cost Calculator | **4.10** |
| 8 | I-MAR-2 | STCW Certification Pathway & Sea Service Eligibility | **4.05** |
| 9 | A-SSS-2 | SSS Maternity Benefit Computation | **4.05** |
| 10 | N-BFP-2 | FSIC Compliance Calendar + FSMR Tracker | **4.05** |
| 11 | P-IPO-1 | IP Portfolio Compliance Dashboard | **4.05** |
| 12 | B-PHI-1 | PhilHealth Case Rate Benefit Application | **4.00** |
| 13 | C-HDMF-1 | Pag-IBIG Housing Loan Eligibility & Amortization | **4.00** |
| 14 | D-GSIS-1 | GSIS BMP Retirement Pension + Option 1/2 Decision | **4.00** |
| 15 | H-PRC-1 | PRC CPD Compliance Eligibility & Unit Gap Calculator | **4.00** |
| 16 | R-DTI-1 | Annual Business Compliance Calendar | **4.00** |
| 17 | G-LTO-2 | LTO Late Registration Penalty Calculator | **3.90** |
| 18 | F-BOC-2 | BOC PCA Compliance Checker | **3.90** |
| 19 | R-BOI-1 | BOI/PEZA SCIT vs. EDR Election Analysis Tool | **3.95** |
| 20 | F-BOC-3 | BOC Automobile Excise Tax Calculator | **3.85** |
