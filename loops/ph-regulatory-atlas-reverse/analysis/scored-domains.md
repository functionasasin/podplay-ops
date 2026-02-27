# Scored Domains — Philippine Regulatory Atlas
## Wave 2: Score-Domains

**Produced by:** ph-regulatory-atlas-reverse — Wave 2 `score-domains`
**Date:** 2026-02-27
**Source:** `analysis/master-domain-list.md` — 107 domains across 20 categories

---

## Scoring Methodology

**Formula:** `Opportunity Score = (Market × 0.25) + (Moat × 0.25) + (Computability × 0.30) + (Pain × 0.20)`

| Dimension | Scale | Description |
|-----------|-------|-------------|
| **Market** | 1–5 | 1 = <10K affected/yr; 2 = 10K–100K; 3 = 100K–500K; 4 = 500K–1M; 5 = >1M |
| **Moat** | 1–5 | 1 = DIY-able; 2 = online tools exist; 3 = needs CPA/bookkeeper; 4 = needs lawyer/specialist; 5 = specialist + ₱50K+ fees required |
| **Computability** | 1–5 | 1 = significant judgment; 2 = mostly judgment; 3 = rule-heavy/some judgment; 4 = mostly deterministic with edge cases; 5 = fully deterministic from statute |
| **Pain** | 1–5 | 1 = simple/fast; 2 = mildly annoying; 3 = confusing/multi-step; 4 = multi-agency + penalties; 5 = multi-agency + high penalties + long timelines |

> **Note on scores:** Wave 1 analyses pre-assigned opportunity scores using a heuristic weighting. This pass applies the formula consistently for all 107 domains, producing slight adjustments to some Wave 1 figures. All dimension scores (M/Mo/C/P) are drawn from `master-domain-list.md`.

---

## Full Ranked List (107 Domains)

| Rank | ID | Domain | M | Mo | C | P | **Score** |
|------|----|--------|---|----|----|---|-----------|
| 1 | A-SSS-3 | SSS Contribution Computation & Remittance (monthly MSC table; kasambahay/OFW special rules; 3%/month penalty; criminal liability for officers) | 5 | 3 | 5 | 5 | **4.50** |
| 2 | E-OFW-1 | OFW Placement Fee Legality Checker (binary tree: no-fee country? → zero; HSW/direct-hire? → zero; else 1× salary cap; RA 10022 Sec. 6) | 5 | 3 | 5 | 5 | **4.50** |
| 3 | A-SSS-1 | SSS Monthly Retirement Pension / BMP (3-formula system; Option 1 vs. Option 2 NPV decision; 2.2M pensioners + 42M future) | 5 | 3 | 5 | 4 | **4.30** |
| 4* | G-LTO-1 | MVUC + Total Annual Registration Cost Calculator (graduated table; 30%/15% EV discount; 50% late surcharge; full-bill aggregation; 14M+ annual transactions) | 5 | **2** | 5 | 4 | **4.05** ▼ |
| 5 | I-MAR-1 | Total STCW Certification Cost Calculator (MC GC-2026-01; 622-line fee schedule; training costs BST/GMDSS/ECDIS; 115K+ revalidations/yr) | 5 | 3 | 5 | 4 | **4.30** |
| 6 | I-MAR-2 | STCW Certification Pathway & Sea Service Eligibility Calculator (Tables A-II/1, A-III/1; exact sea service thresholds; 50K+ promotion-seeking seafarers/yr) | 5 | 3 | 5 | 4 | **4.30** |
| 7* | O-LRA-1 | ONETT Deadline & Late Penalty Calculator (30-day CGT + 5-day DST; 25% surcharge + 12%/yr interest; date arithmetic with multi-agency sequencing) | 5 | **4** | 5 | 4 | **4.55** ▲ |
| 8 | D-GSIS-1 | GSIS BMP Retirement Pension + Option 1/2 NPV Decision (0.025 × AMC+₱700 × PPP; max 90% AMC; Option 1 60× vs. Option 2 18× + pension; irreversible) | 4 | 3 | 5 | 4 | **4.05** |
| 9 | E-OFW-2 | OFW Total Pre-Departure Cost Calculator (OWWA USD25 + OFW Pass + PhilHealth + Pag-IBIG + NBI/PSA/passport/medical; new hire vs. balik paths; 1.7M+ deployments/yr) | 5 | 2 | 5 | 4 | **4.05** |
| 10 | H-PRC-1 | PRC CPD Compliance Eligibility & Unit Gap Calculator (43 profession-specific requirements; OFW/senior/PWD exemptions; SDL cap; carryover; 4M+ licensed professionals) | 4 | 3 | 5 | 4 | **4.05** |
| 11 | N-BFP-2 | FSIC Compliance Calendar + FSMR Tracker (annual FSIC deadline + FSMR submission + fire drill records + extinguisher maintenance; January 20 crunch; 1.2M+ businesses) | 4 | 3 | 5 | 4 | **4.05** |
| 12 | A-SSS-2 | SSS Maternity Benefit (100% ADSC × 60/90/105 days by delivery type; daily credit = 12-mo payroll ÷ 180; salary differential employer obligation) | 5 | 3 | 4 | 4 | **4.00** |
| 13 | B-PHI-1 | PhilHealth Case Rate Benefit Application (~9,000 fixed case rates per PC2024-0037; PhilHealth share + patient OOP; no patient-facing tool exists) | 5 | 1 | 5 | 5 | **4.00** |
| 14* | C-HDMF-1 | Pag-IBIG Housing Loan Eligibility & Amortization (35% HLAR cap; LTV; 3-tier interest; age+term ≤70; MRI + fire insurance; Affordable Housing 3% track) | 5 | **2** | 4 | 4 | **3.75** ▼ |
| 15 | F-BOC-1 | BOC Landed Cost Calculator (CIF × AHTN duty + 12% VAT + brokerage + IPF + de minimis check; millions of e-commerce importers + 100K+ SMEs) | 5 | 3 | 4 | 4 | **4.00** |
| 16* | O-LRA-2 | ONETT Pipeline Calculator (CGT 6% + DST 1.5% + LGU transfer tax + LRA 17-tier fee + PD 1529 Sec. 117 double-fee check; multi-agency; ₱20K–₱30K processing services) | 5 | **4** | 4 | 4 | **4.25** ▲ |
| 17 | R-DTI-1 | Annual Business Compliance Calendar (DTI 5-yr expiry + LGU Jan 20 deadline + quarterly LBT installments + BIR filing calendar + mandated benefits; 5M+ sole proprietors) | 5 | 3 | 4 | 4 | **4.00** |
| 18 | P-IPO-1 | IP Portfolio Compliance Dashboard (trademark DAU year 3+5 + renewal year 10 + patent annuity years 5–20; 200K–400K active marks; IP firm retainers ₱10K–₱20K/yr) | 3 | 4 | 4 | 5 | **3.95** |
| 19 | B-PHI-2 | PhilHealth Premium Contribution Computation (5% × BMS; floor ₱500/ceiling ₱5K; 50/50 employer/EE split; self-employed/OFW/kasambahay rules; 3%/month compounded) | 5 | 2 | 5 | 3 | **3.85** |
| 20 | C-HDMF-2 | Pag-IBIG MPL & Calamity Loan Computation (80% TAV formula; ₱1M+₱1M combined ceiling; 10.75%/5.95% annuity; 1/20 of 1%/day penalty; 3.2M+ borrowers/yr) | 5 | 2 | 5 | 3 | **3.85** |
| 21 | C-HDMF-3 | Pag-IBIG Mandatory Savings Contribution (graduated table 1%/2% of MBC up to ₱5K; OFW/kasambahay rules; 1/10 of 1%/day late penalty; 16.58M members) | 5 | 2 | 5 | 3 | **3.85** |
| 22 | F-BOC-3 | Automobile Excise Tax Transparency Calculator (NMISP × rate table 4%/10%/20%/50%; hybrid 50% of rate; EV exempt; 400K+ new cars/yr) | 4 | 3 | 5 | 3 | **3.85** |
| 23* | G-LTO-2 | LTO Late Registration Penalty Calculator (50% MVUC surcharge; multi-year computation; inherited penalties for used-car buyers) | 4 | **2** | 5 | 3 | **3.60** ▼ |
| 24 | H-PRC-2 | PRC License Renewal Total Cost Calculator (base fee ₱420–₱450; 50% late surcharge; CPD seminar ₱1K–₱3K/unit unregulated; 1.3–1.6M renewals/yr) | 5 | 2 | 5 | 3 | **3.85** |
| 25 | I-MAR-3 | COC/COP Revalidation Document Checklist Generator (rank-specific conditional lookup; MISMO rejections = weeks-long deployment delays; 300K–500K transactions/yr) | 5 | 2 | 5 | 3 | **3.85** |
| 26 | L-TES-1 | TESDA NC Expiry Tracker & Re-assessment Reminder (NC valid exactly 5 years; ~4M–5M active NCs; ~800K–1M expiries/yr; no TESDA notification system) | 5 | 2 | 5 | 3 | **3.85** |
| 27 | S-BSP-1 | Pawnshop Loan Cost Transparency Tool (principal × monthly_rate × months + service charge; 20M–40M annual transactions; consumer financial inclusion) | 5 | 2 | 5 | 3 | **3.85** |
| 28 | E-OFW-3 | OWWA Benefits Eligibility Navigator (death ₱100K–₱200K; disability by 14-grade schedule; 8 programs; 80%+ underutilization; 2.5M+ active OFWs) | 5 | 3 | 4 | 3 | **3.80** |
| 29 | H-PRC-3 | PRC CPD Seminar Cost Optimizer (SDL cap optimization; 45-unit professions face ₱45K–₱135K over 3 yrs; no cost minimizer exists; 5M+ professionals) | 5 | 3 | 4 | 3 | **3.80** |
| 30 | J-CAP-1 | RPAS/Drone Compliance Suite (commercial any weight → 3-cert stack ₱3,360+₱1,680+operator; recreational ≥7kg → registration; <7kg exempt; ₱20K–₱100K penalty) | 3 | 3 | 5 | 4 | **3.80** |
| 31 | M-FDA-1 | FDA CPR + LTO Total Registration Cost Calculator (LTO by establishment type + CPR per product; 70% renewal rate; 30K–80K regulated entities) | 3 | 3 | 5 | 4 | **3.80** |
| 32 | M-FDA-2 | FDA Multi-Product Renewal Compliance Calendar (portfolio of 10–500 CPRs; cliff date tracking; consultants charge ₱50K–₱300K/yr) | 3 | 3 | 5 | 4 | **3.80** |
| 33 | O-LRA-3 | BIR Zonal Value Lookup Tool (gating input for all ONETT computations; currently scattered PDF bulletins; no unified searchable tool; 400K–800K transactions/yr) | 4 | 2 | 5 | 4 | **3.80** |
| 34 | P-IPO-2 | Trademark Total Fee Calculator + DAU Tracker (filing + issuance + DAU + renewal; 50% late surcharge; 42K+ new filings/yr + 200K–400K active marks) | 3 | 3 | 5 | 4 | **3.80** |
| 35 | R-BOI-2 | BOI ITH Period Calculator + Tax Savings NPV (Tier 1/2/3 × NCR/adjacent/other = 4–7yr; +2yr conflict; +3yr NCR relocation; fully deterministic lookup) | 2 | 4 | 5 | 4 | **3.80** |
| 36 | R-PCAB-1 | PCAB ACP Score Calculator & Category Eligibility Screener (FC+EC+FE+STE all pure arithmetic; 70K+ contractors; 51.5K annual applications; non-refundable fees) | 3 | 3 | 5 | 4 | **3.80** |
| 37 | A-SSS-4 | SSS Sickness Benefit (90% ADSC × sick leave days; max 120 days/yr; 3-in-6 eligibility gate; SSS vs. employer advance determination) | 5 | 2 | 4 | 4 | **3.75** |
| 38 | A-SSS-5 | SSS Death Benefit / Survivor's Pension (BMP if ≥36 contributions else lump sum; dependent child 10% BMP + ₱250 per child max 5) | 4 | 3 | 4 | 4 | **3.75** |
| 39 | B-PHI-3 | PhilHealth Benefit Eligibility Determination (contribution-count gates by category; 3-in-6 employed; 9-in-12 self-employed; 120 months lifetime) | 5 | 2 | 4 | 4 | **3.75** |
| 40 | D-GSIS-2 | GSIS Legacy Law Selection (RA 660/1616/PD 1146/RA 8291 eligibility tree; "Magic 87"/"Take All"; 200K+ pre-1997 employees; ₱5K–₱20K/month pension differential) | 3 | 4 | 4 | 4 | **3.75** |
| 41 | Q-ERC-1 | Electricity Bill Verification & Total Cost Estimator (12+ unbundled line items; all rates ERC-published; 18M+ billed households) | 5 | 2 | 4 | 4 | **3.75** |
| 42 | R-BOI-1 | BOI/PEZA SCIT vs. EDR Election Analysis Tool (SCIT 5%×GIE vs. EDR 20% CIT + deductions; irrevocable; Big 4 only ₱200K–₱500K/engagement) | 2 | 5 | 4 | 4 | **3.75** |
| 43 | F-BOC-2 | BOC PCA Compliance Checker & PDP Advisor (3-year lookback; penalty 125%/600% × deficiency + 20%/yr interest; ₱2.71B PCAG collections 2024) | 3 | 3 | 4 | 5 | **3.70** |
| 44 | N-BFP-1 | Fire Safety Equipment Requirements Screener (IRR Rule 10 Div.6–21; 11 occupancy types; ~170K failures/yr = immediate closure; FSP moat ₱10K–₱50K) | 4 | 3 | 3 | 5 | **3.65** |
| 45 | D-GSIS-4 | GSIS Contribution Computation & Employer Remittance (21% total: 9% EE + 12% employer; criminal liability for agency heads; 2,000+ government agencies) | 4 | 2 | 5 | 3 | **3.60** |
| 46 | I-MAR-4 | MARINA Annual Tonnage Fee (ATF) Calculator (graduated rate schedule MC 2008-05/07; fleet aggregation; late penalty per MC 120; 5K–10K domestic vessel operators) | 3 | 3 | 5 | 3 | **3.60** |
| 47 | O-LRA-4 | LRA Registration Fee & Annotation Fee Calculator (17-tier graduated scale; annotation ₱20/line; entry ₱50/instrument; PD 1529 Sec. 117 double-fee if >365 days) | 4 | 2 | 5 | 3 | **3.60** |
| 48 | R-CDA-2 | CDA Net Surplus Distribution Compliance Checker (Reserve ≥10%; Education ≤10%; CDA Fund ≥3%; PR ≥30%; ₱10M reserves cliff; ~12K–14K cooperative AGA cycles/yr) | 3 | 3 | 5 | 3 | **3.60** |
| 49 | R-CDA-3 | CDA Annual Compliance Calendar + Penalty Estimator (AGA +90 days; AFS +120 days; BIR April 15; CTE renewal −60 days; revocation → retroactive back-tax liability) | 3 | 3 | 5 | 3 | **3.60** |
| 50 | R-PCAB-2 | PCAB Renewal Compliance Calendar (staggered windows by license number last digit; APF ₱5K + ALF ₱10K after June 30; 41K+ renewals/yr) | 3 | 3 | 5 | 3 | **3.60** |
| 51 | T-NPC-2 | NPC Annual Security Incident Report (ASIR) Filing Tool (15-category classification; fixed March 31 deadline; all PICs/PIPs; ~50K–100K organizations; zero-incident required) | 3 | 3 | 5 | 3 | **3.60** |
| 52 | A-SSS-6 | SSS Unemployment Benefit (50% AMSC × 2 months; 36-contribution eligibility; 1-claim/3-year limit; ~10M qualified workers) | 3 | 2 | 5 | 4 | **3.55** |
| 53 | E-OFW-4 | OFW Documentary Requirements Matrix Generator (worker type × destination × job category → customized checklist; 500K+ new applications/yr) | 5 | 2 | 4 | 3 | **3.55** |
| 54 | E-OFW-5 | OWWA Scholarship Program Selector (8-program matrix: EDSP ₱60K, ODSP ₱20K, SESP ₱14.5K; USD 600 salary threshold; 5M+ OFW-dependent children) | 4 | 3 | 4 | 3 | **3.55** |
| 55 | M-FDA-4 | FDA Late Renewal Surcharge & 120-Day Cliff Calculator (2×R + 10%×R×months max 4 = 240%×R; beyond 120 days = full new-application restart; ~3,750 events/yr) | 2 | 3 | 5 | 4 | **3.55** |
| 56 | O-DHSUD-1 | DHSUD Balanced Housing Requirement Calculator (4 compliance modes: self-develop 15%/5% vs. JV 25% vs. bond 15%/5% vs. LGU cash 3.75%; NPV comparison; ₱1M–₱5M penalty) | 2 | 3 | 5 | 4 | **3.55** |
| 57 | P-IPO-3 | IPOPHL Patent Annuity Calendar & Cost Projector (16-row escalating fee table ₱1,550 yr5 → ₱65,160 yr20; 50% grace surcharge; 4,500 patent + 1,847 UM apps/yr) | 2 | 3 | 5 | 4 | **3.55** |
| 58 | Q-ERC-2 | ERC Lifeline Rate Eligibility & Savings Calculator (4Ps/below PSA poverty threshold; 0–50kWh=100%/51–70kWh=35%/71–100kWh=20%; 4.5M eligible vs. 330K enrolled) | 4 | 1 | 5 | 4 | **3.55** |
| 59 | B-PHI-4 | OFW PhilHealth Contribution Portability (5% × OFW declared salary; voluntary continuity on return; lapse consequences; remittance channel matrix; 2.19M OFWs) | 4 | 2 | 4 | 4 | **3.50** |
| 60 | D-GSIS-3 | GSIS Portability Totalization (RA 7699 pro-rata pension by own PPP÷total PPP; 2M+ government-private switchers; many forfeit benefits from ignorance) | 2 | 4 | 4 | 4 | **3.50** |
| 61 | G-LTO-3 | Vehicle Transfer of Ownership Cost Estimator (LTO ₱530–₱680 + HPG ₱500 + notarization + AO-VDM-2024-046 ₱5,000 penalty; 200K–500K used-vehicle sales/yr) | 3 | 3 | 4 | 4 | **3.50** |
| 62 | O-DAR-1 | CARP Just Compensation Estimator (LV = CNI×0.6 + CS×0.3 + MV×0.1; CNI at 12% cap rate; verifies LBP Memorandum of Valuation; ≥2,400 contested cases) | 3 | 3 | 4 | 4 | **3.50** |
| 63 | R-CDA-1 | CDA Tax Exemption (CTE) Eligibility Checker + Navigator (Category A/B/C classification; 60-day initial window; 5-year CTE; CPAs charge ₱8K–₱50K/event; ~6K events/yr) | 3 | 3 | 4 | 4 | **3.50** |
| 64 | S-BSP-3 | BSP OPS/EMI/VASP Capital Requirement & Classification Screener (capital tiers by txn volume; EMI ₱100M–₱200M; VASP ₱10M–₱50M; law firm moat ₱500K–₱2M) | 1 | 5 | 4 | 4 | **3.50** |
| 65 | T-NPC-1 | NPC 72-Hour Breach Notification Protocol (harm assessment → countdown → notification generator → DBNMS checklist → 5-day report; concealment = 18mo–5yr + ₱500K–₱1M) | 3 | 3 | 4 | 4 | **3.50** |
| 66 | A-SSS-7 | SSS Disability Benefit (PTD = BMP lifetime; PPD = BMP÷30 × disability percentage; gradings table RA 11199 Sec. 13) | 4 | 3 | 3 | 4 | **3.45** |
| 67 | M-FDA-3 | FDA Product Classification & Regulatory Pathway Screener (4-center decision tree CDRR/CFRR/CCRR/CDRRHR + risk class; misclassification = wasted fees + months rework) | 3 | 4 | 3 | 4 | **3.45** |
| 68 | R-DTI-2 | LGU Local Business Tax (LBT) Estimator (gross receipts × LGU rate; max 0.5%–2% by type; city=municipal×150%; 1.2–1.5M renewals; 25%+2%/month penalty) | 4 | 3 | 3 | 4 | **3.45** |
| 69 | G-LTO-4 | Driver's License Cost & Timeline Calculator (enumerated fee schedule ₱317–₱910; re-exam trigger for >2-year expired; 4M+ licensed drivers) | 4 | 2 | 5 | 2 | **3.40** |
| 70 | E-OFW-6 | OWWA Rebate Eligibility & Amount Calculator ((N–5)×₱100×loyalty multiplier 1.0/1.1/1.2; ≥10-year gate; 556K identified beneficiaries) | 3 | 2 | 5 | 3 | **3.35** |
| 71 | K-NTC-1 | NTC Spectrum User Fee Calculator (KHz × rate/KHz × area tier; CMTS ₱10/₱5/₱2.50; 25% + 1%/month late; 2K–8K spectrum holders) | 2 | 3 | 5 | 3 | **3.35** |
| 72 | L-TES-2 | TESDA Assessment Cost & Qualification Finder (₱400–₱3,723 by qualification title; + ₱35 processing; 9× fee range; only in PDFs; 935K assessments/yr) | 4 | 1 | 5 | 3 | **3.35** |
| 73 | D-GSIS-5 | GSIS Survivorship & Death Benefit (50% BMP to surviving spouse; dependent child pension; cash options by contribution tier; ₱30K funeral) | 3 | 3 | 4 | 3 | **3.30** |
| 74 | J-CAP-2 | CAAP Aircraft Airworthiness & Registration Fee Calculator (MTOW-based 4-class structure MC 018-2023; USD-denominated; CofA 12-month renewal; ₱20K–₱80K import fees) | 2 | 4 | 4 | 3 | **3.30** |
| 75 | N-BFP-3 | BFP FSIC Annual Fee Pre-Calculator (10% of LGU permit fees floor ₱500; Fire Code Realty Tax 0.10% × assessed value; 3M+ annual inspections) | 4 | 2 | 4 | 3 | **3.30** |
| 76 | F-BOC-4 | BOC FTA Rate Optimizer (ATIGA/AKFTA/AIFTA vs. MFN rate differential; ROO compliance check; large import volume × small % savings = material SME impact) | 4 | 3 | 3 | 3 | **3.25** |
| 77 | S-BSP-2 | BSP MSB/Pawnshop AMLA Compliance Calendar (CTR ₱500K+ triggers; STR 5-day deadline; Circular 1206 Dec 2024 reclassification; AMLA penalty ₱500K–₱1M/violation) | 2 | 3 | 4 | 4 | **3.25** |
| 78 | S-PGC-1 | PAGCOR Casino AML/CTR Compliance Tracker (CTR ≥₱5M/patron/gaming day; STR no threshold; ₱500K–₱1M/violation; 174+ operators; e-games +165% GGR) | 2 | 3 | 4 | 4 | **3.25** |
| 79 | R-DTI-3 | New Business Startup Cost Navigator (DTI + barangay + mayor's permit + BIR ₱0; multi-agency aggregation; 929K new registrations/yr) | 4 | 2 | 3 | 4 | **3.20** |
| 80 | C-HDMF-4 | Pag-IBIG MP2 Savings Growth Projection (5-year lock-in; 7.10% 2024 dividend; terminal payout vs. annual dividend computation) | 4 | 1 | 5 | 2 | **3.15** |
| 81 | F-BOC-5 | Petroleum/Alcohol/Tobacco Excise (Import) (specific rates per liter/pack/unit from TRAIN; duty + excise + VAT stacking; B2B only) | 2 | 3 | 5 | 2 | **3.15** |
| 82 | N-BFP-4 | BFP FSEC Fee Calculator (0.10% × construction cost; max ₱50K; 196,571 FSECs/yr; low standalone pain) | 3 | 2 | 5 | 2 | **3.15** |
| 83 | R-DTI-4 | DTI Business Name Registration Fee + Renewal Tracker (4-tier table + ₱30 DST + 50% surcharge; 5-year validity; 1.056M transactions in 2024) | 4 | 1 | 5 | 2 | **3.15** |
| 84 | Q-ERC-3 | Net Metering Credit & Solar Payback Calculator (exported kWh × DU blended generation rate; DC2024 unlimited banking; 17K users growing) | 2 | 2 | 5 | 3 | **3.10** |
| 85 | J-CAP-3 | CAAP Pilot License Pathway Eligibility & Cost Calculator (PPL 40hr/CPL 150hr/ATPL 1,500hr; exam subjects + fees; SPL→PPL→CPL→ATPL; 8K+ licensed pilots) | 2 | 3 | 4 | 3 | **3.05** |
| 86 | K-NTC-2 | NTC Private Radio Fleet License Manager (station fee by type × ERP × mode; 200K–500K private stations; renewal calendar) | 3 | 2 | 4 | 3 | **3.05** |
| 87 | L-TES-3 | TESDA Scholarship Eligibility & Benefit Calculator (PESFA income ≤₱300K; TWSP age ≥18; TSF = ₱160/day; overlapping programs TWSP/PESFA/STEP/UAQTEA) | 4 | 1 | 4 | 3 | **3.05** |
| 88 | O-DHSUD-2 | DHSUD CR/LTS Fee + Performance Bond Calculator (₱17.30/sqm residential + ₱36/sqm commercial + ₱1,500/ha inspection; bond = 20% of unfinished cost) | 2 | 3 | 4 | 3 | **3.05** |
| 89 | R-BOI-3 | BOI Annual GIE Compliance Tracker (quarterly 5% SCIT with LGU split; annual performance reports; employment commitment tracking) | 2 | 3 | 4 | 3 | **3.05** |
| 90 | R-PCAB-3 | PCAB ARCC Project Eligibility Checker (contractor category → ARCC range + RA 9184 Sec. 23.11.2 "50% restriction"; bid rejection trap) | 2 | 3 | 4 | 3 | **3.05** |
| 91 | T-NPC-3 | NPC Registration Eligibility Screener + Compliance Calendar (3-threshold check: 250+ employees / 1,000+ SPI / high-risk; 15K–30K mandatory registrants) | 2 | 3 | 4 | 3 | **3.05** |
| 92 | D-GSIS-6 | GSIS Disability Benefit (PTD = BMP + 18× BMP if ≥180 contributions; PPD = BMP÷30 × LWOP days; TTD = 75% daily salary floor ₱70/ceiling ₱340) | 3 | 3 | 3 | 3 | **3.00** |
| 93 | H-PRC-4 | PRC Board Exam Application Eligibility & Fee Calculator (43 professions × first-timer/repeater/conditioned rules; ₱450–₱2,200 fees; 507K applications FY2024) | 4 | 2 | 3 | 3 | **3.00** |
| 94 | O-DAR-2 | CARP Coverage & Retention Area Calculator (retention = 5ha + 3ha × children ≤3 = max 14ha; coverage test by area/classification/use) | 3 | 3 | 3 | 3 | **3.00** |
| 95 | S-PGC-3 | PAGCOR GGR License Fee Dashboard (GGR × rate 30%/25%/15%; MGF floor ₱9M/month from Apr 2026; multi-segment reconciliation; ~174 operators) | 1 | 3 | 4 | 4 | **3.00** |
| 96 | S-PGC-2 | PAGCOR Gaming vs. Non-Gaming Income Tax Classifier (gaming → 5% franchise tax; non-gaming → 25% CIT + 12% VAT; RMC 132-2024; misclassification on ₱1B = ₱200M+ tax gap) | 1 | 4 | 3 | 4 | **2.95** |
| 97 | O-DAR-3 | CARP ARB Amortization Schedule Generator (6%/30yr annuity; 5%-of-AGP initial cap; reduced relevance post-RA 11953 condonation; 134K new CLOAs/yr) | 2 | 2 | 5 | 2 | **2.90** |
| 98 | S-BSP-4 | BSP Annual Supervision Fee (ASF) Calculator (per-office rate × office count by MSB type; ~2,151 entities; BSP proactively bills; low pain) | 2 | 2 | 5 | 2 | **2.90** |
| 99 | C-HDMF-5 | Pag-IBIG TAV Accumulation & Refund (contributions + compounded dividend; qualifying grounds checklist; loan offset computation) | 4 | 1 | 4 | 2 | **2.85** |
| 100 | L-TES-4 | TESDA UTPRAS Institution Registration Navigator (₱1K application + ₱1K/program; ₱2K–₱10K penalty + 2yr imprisonment; 14K+ programs) | 2 | 2 | 4 | 3 | **2.80** |
| 101 | Q-ERC-4 | ERC FIT Revenue & Annual Rate Adjustment Calculator (CPI/FX adjustment formula; 84 FIT plants; B2B niche; low volume) | 2 | 4 | 3 | 2 | **2.80** |
| 102 | S-PGC-4 | PAGCOR Junket Revenue Model Comparator (rolling chip 1.25% vs. revenue share 40–50% GGR; ~100–200 junket operators) | 1 | 3 | 4 | 3 | **2.80** |
| 103 | K-NTC-3 | NTC Type Acceptance/Approval Import Screener (TA vs. TAC decision tree + fee; certification agents ₱15K–₱80K/model; 10K–30K models/yr) | 2 | 3 | 3 | 3 | **2.75** |
| 104 | P-IPO-4 | IPOPHL Trademark Classification & Filing Cost Estimator (Nice Classification lookup + fee computation; partial judgment for class determination) | 3 | 2 | 3 | 3 | **2.75** |
| 105 | R-BOI-4 | BOI SIPP Activity Pre-Screener & BOI vs. PEZA Eligibility Checker (SIPP activity list lookup + PEZA SEZ location + export % requirements) | 2 | 3 | 3 | 3 | **2.75** |
| 106 | R-PCAB-4 | PCAB Joint Venture Special License Fee & Category Estimator (dominant equity partner's category assigned; separate license required; criminal penalty) | 2 | 3 | 3 | 3 | **2.75** |
| 107 | T-NPC-4 | NPC Privacy Impact Assessment (PIA) Trigger Screener (NPC Circular 2016-01; mandatory for government agencies; trigger checklist) | 2 | 3 | 3 | 3 | **2.75** |

---

## Score Distribution Summary

*Updated after Wave 2 professional-fees-validation pass (2026-02-27). Rows marked ▲/▼ above have been adjusted.*

| Score Range | Count (original) | Count (after validation) | Δ |
|-------------|-----------------|--------------------------|---|
| 4.50–5.00 (Elite) | 2 | **3** | +1 (O-LRA-1 rises to 4.55) |
| 4.00–4.49 (Top Tier) | 15 | **13** | −2 (C-HDMF-1 drops; O-LRA-1 rises) |
| 3.50–3.99 (Strong) | 42 | **44** | +2 (C-HDMF-1 + G-LTO-2 join) |
| 3.00–3.49 (Moderate) | 36 | 36 | 0 |
| 2.75–2.99 (Marginal) | 12 | 12 | 0 |
| **Total** | **107** | **107** | — |

---

## Top 25 by Score (Post-Validation)

*Rankings updated after Wave 2 professional-fees-validation pass. O-LRA-1 and O-LRA-2 moats upgraded to 4; G-LTO-1, G-LTO-2, C-HDMF-1 moats downgraded to 2.*

| Rank | ID | Domain | Score |
|------|----|--------|-------|
| 1 | O-LRA-1 | ONETT Deadline & Late Penalty Calculator | **4.55** ▲ |
| 2 | A-SSS-3 | SSS Contribution Computation & Remittance | **4.50** |
| 3 | E-OFW-1 | OFW Placement Fee Legality Checker | **4.50** |
| 4 | O-LRA-2 | ONETT Pipeline Calculator | **4.25** ▲ |
| 5 | A-SSS-1 | SSS Monthly Retirement Pension (BMP) | **4.30** |
| 6 | I-MAR-1 | Total STCW Certification Cost Calculator | **4.30** |
| 7 | I-MAR-2 | STCW Pathway & Sea Service Eligibility Calculator | **4.30** |
| 8 | D-GSIS-1 | GSIS BMP Retirement Pension + Option 1/2 Decision | **4.05** |
| 9 | E-OFW-2 | OFW Total Pre-Departure Cost Calculator | **4.05** |
| 10 | G-LTO-1 | MVUC + Total Annual Registration Cost Calculator | **4.05** ▼ |
| 11 | H-PRC-1 | PRC CPD Compliance Eligibility & Unit Gap Calculator | **4.05** |
| 12 | N-BFP-2 | FSIC Compliance Calendar + FSMR Tracker | **4.05** |
| 13 | A-SSS-2 | SSS Maternity Benefit Computation | **4.00** |
| 14 | B-PHI-1 | PhilHealth Case Rate Benefit Application | **4.00** |
| 15 | F-BOC-1 | BOC Landed Cost Calculator | **4.00** |
| 16 | R-DTI-1 | Annual Business Compliance Calendar | **4.00** |
| 17 | P-IPO-1 | IP Portfolio Compliance Dashboard | **3.95** |
| 18–25 | *(8 domains tied)* | B-PHI-2, C-HDMF-2, C-HDMF-3, F-BOC-3, H-PRC-2, I-MAR-3, L-TES-1, S-BSP-1 | **3.85** |

---

## Score Adjustments vs. Wave 1 Estimates

The following domains have **material score changes** (±0.10+) when applying the formula consistently vs. Wave 1 heuristic estimates:

| ID | Wave 1 Score | Formula Score | Δ | Reason |
|----|-------------|---------------|---|--------|
| N-BFP-1 | 4.15 | **3.65** | −0.50 | Computability = 3 (not 5) — equipment requirement rules require occupancy-type judgment; not fully deterministic |
| A-SSS-3 | 4.55 | **4.50** | −0.05 | Minor rounding |
| G-LTO-1 | 4.40 | **4.30** | −0.10 | Pain = 4 (not 5) — well-established LTO process, just confusing; not multi-agency with long timelines |
| C-HDMF-4 | 2.85 | **3.15** | +0.30 | Formula correctly weights Computability=5 at 0.30; Wave 1 assigned lower composite |
| N-BFP-2 | 4.05 | **4.05** | 0 | Confirmed |
| I-MAR-1 | 4.10 | **4.30** | +0.20 | Formula correctly weights Market=5 + Comp=5 combination |
| B-PHI-1 | 4.00 | **4.00** | 0 | Confirmed — unusual profile (Market=5, Moat=1, Comp=5, Pain=5); moat is information asymmetry not professional |

> **Key reordering:** N-BFP-1 (Fire Equipment Screener) drops from Wave 1 rank #6 to formula rank #44. N-BFP-2 (FSIC Calendar) remains stable at rank #11. BFP is still a strong cluster but N-BFP-1 was previously overscored on computability — the equipment requirement rules involve occupancy classification judgment.

---

## Score Adjustments from Wave 2 Professional Fees Validation

*Applied 2026-02-27. See full analysis in `analysis/wave2-professional-fees-validation.md`.*

| ID | Domain | Moat Old | Moat New | Score Before | Score After | Δ | Evidence |
|----|--------|----------|----------|-------------|------------|---|----------|
| O-LRA-1 | ONETT Deadline & Late Penalty Calculator | 3 | **4** | 4.30 | **4.55** ▲ | +0.25 | Processing services ₱20K–₱50K confirmed; lawyers 0.5%–1.5% of property price; notarization prerequisite |
| O-LRA-2 | ONETT Pipeline Calculator | 3 | **4** | 4.00 | **4.25** ▲ | +0.25 | Same professional market as O-LRA-1; full-service property transfer requires specialist |
| G-LTO-1 | MVUC + Total Registration Cost | 3 | **2** | 4.30 | **4.05** ▼ | −0.25 | LTMS portal + multiple free guides + fixer market explicitly illegal; no real professional moat |
| C-HDMF-1 | Pag-IBIG Housing Loan Eligibility & Amortization | 3 | **2** | 4.00 | **3.75** ▼ | −0.25 | Multiple online calculators confirmed (Nook, omnicalculator, myhousingloancal, Globe); Pag-IBIG Virtual portal |
| G-LTO-2 | LTO Late Penalty Calculator | 3 | **2** | 3.85 | **3.60** ▼ | −0.25 | Same reasoning as G-LTO-1; simple 50% MVUC formula, multiple free guides |

**Key insights from validation:**
- **ONETT is the most underrated domain:** Confirmed ₱20K–₱50K service fees per transaction upgrade the ONETT cluster to the top tier (4.55/4.25). Property transfer is the highest-moat domain with real professional gatekeeping.
- **LTO tools already exist:** The LTMS portal, multiple consumer guides, and the illegal status of fixers mean the LTO moat was overstated. Still high-market-size but reduced moat.
- **Pag-IBIG calculator market is served:** Three independent online calculators already exist for Pag-IBIG housing loan computation, reducing the unmet tool need.
- **BOI SCIT election Moat=5 confirmed:** Big 4 advisory confirmed as "indispensable, not optional" for CREATE MORE irrevocable elections.
- **PhilHealth case rate Moat=1 confirmed:** Hospital processes it directly; patient-facing transparency is the opportunity, not professional displacement.

---

## Category Champions

| Category | Champion Domain | Score | Why It Leads |
|----------|----------------|-------|-------------|
| A — SSS | A-SSS-3 (Contribution) | 4.50 | Maximum market × penalty severity |
| B — PhilHealth | B-PHI-1 (Case Rate) | 4.00 | 9,000 fixed rates; no patient-facing tool anywhere |
| C — Pag-IBIG | C-HDMF-1 (Housing Loan) | 4.00 | Multi-step computation + broker moat |
| D — GSIS | D-GSIS-1 (BMP Pension) | 4.05 | Fully deterministic formula; irreversible financial decision |
| E — OFW | E-OFW-1 (Fee Shield) | 4.50 | Pure information asymmetry; illegal fees ₱45K–₱200K/victim |
| F — Customs | F-BOC-1 (Landed Cost) | 4.00 | Millions of importers; no unified tool |
| G — LTO | G-LTO-1 (MVUC) | **4.05** ▼ | 14M annual transactions; moat downgraded (LTMS portal exists, multiple free guides, fixers illegal) |
| H — PRC | H-PRC-1 (CPD) | 4.05 | 4M professionals; 43 professions; 3-year renewal crunch |
| I — MARINA | I-MAR-1+2 (STCW) | 4.30 | 576K seafarers; missed certs = direct income loss |
| J — CAAP | J-CAP-1 (RPAS) | 3.80 | Fastest-growing segment; ₱20K–₱100K penalty |
| K — NTC | K-NTC-1 (Spectrum) | 3.35 | Narrow but fully deterministic |
| L — TESDA | L-TES-1 (NC Expiry) | 3.85 | 4–5M active NCs; no notification system |
| M — FDA | M-FDA-1/2 (CPR+Calendar) | 3.80 | Dual: cost transparency + renewal cliff |
| N — BFP | N-BFP-2 (FSIC Calendar) | 4.05 | 1.2M businesses; January 20 crunch |
| O — Land | O-LRA-1 (ONETT Deadline) | **4.55** ▲ | 400K–800K transactions; multi-agency; ₱20K–₱50K processing service market confirmed |
| P — IPOPHL | P-IPO-1 (IP Dashboard) | 3.95 | 200K–400K marks; IP firm retainer moat |
| Q — ERC | Q-ERC-1 (Bill Verify) | 3.75 | 18M households; 12+ line items |
| R — Business | R-DTI-1 (Biz Calendar) | 4.00 | 5M sole proprietors; multi-deadline engine |
| S — BSP/PAGCOR | S-BSP-1 (Pawnshop) | 3.85 | 20M–40M transactions; financial inclusion |
| T — NPC | T-NPC-2 (ASIR) | 3.60 | 50K–100K organizations; fixed deadline |

---

## Clusters for Product Bundling

Several domains naturally bundle into single product experiences:

| Bundle | Domains | Combined Score | Concept |
|--------|---------|----------------|---------|
| SSS Suite | A-SSS-1, A-SSS-2, A-SSS-3, A-SSS-4 | 4.50 anchor | Philippine Social Insurance Calculator |
| STCW Lifecycle | I-MAR-1, I-MAR-2, I-MAR-3 | 4.30 anchor | Seafarer Certification Lifecycle Dashboard |
| ONETT / Transfer | O-LRA-1, O-LRA-2, O-LRA-3, O-LRA-4 | **4.55** anchor ▲ | Transfer PH — Property Transfer Orchestrator; moat confirmed ₱20K–₱50K/transaction |
| OFW Shield | E-OFW-1, E-OFW-2, E-OFW-4 | 4.50 anchor | OFW Fee Shield + Pre-Departure Planner |
| FireReady PH | N-BFP-1, N-BFP-2, N-BFP-3 | 4.05 anchor | Pre-inspection diagnostic + compliance calendar |
| PRC Compliance | H-PRC-1, H-PRC-2, H-PRC-3 | 4.05 anchor | PRC Renewal & CPD Navigator |
| Negosyo Calc | R-DTI-1, R-DTI-2, R-DTI-3 | 4.00 anchor | Business Compliance Suite for 5M sole proprietors |
| LTO Fee Calc | G-LTO-1, G-LTO-2, G-LTO-3 | 4.30 anchor | Total Vehicle Cost & Compliance Tool |
