# Wave 2 — Professional Fees Validation
## ph-regulatory-atlas-reverse

**Produced by:** Wave 2 `professional-fees-validation`
**Date:** 2026-02-27
**Source:** WebSearch across top 15 scoring domains in `analysis/scored-domains.md`

---

## Purpose

Validate that the moat ratings in `scored-domains.md` reflect actual professional service pricing in the Philippines market. Where pricing evidence contradicts initial moat estimates, scores are updated. This pass covers Ranks #1–#17 (all domains scoring ≥ 4.00) plus select domains in the 3.80–3.95 band.

---

## Methodology

For each domain, I searched for:
1. Actual professional service fees (lawyers, CPAs, brokers, fixers)
2. Existence of public/free tools that reduce the moat
3. Government self-service portals that disintermediate professionals
4. Market pricing for the specific professional type gatekeeping the domain

Moat scale reminder:
- 1 = DIY-able, 2 = online tools exist, 3 = needs CPA/bookkeeper, 4 = needs lawyer/specialist, 5 = specialist + ₱50K+ fees required

---

## Domain-by-Domain Findings

### Rank 1–2: A-SSS-3 (SSS Contribution) — Moat=3 ✅ CONFIRMED

**Evidence:** Payroll/bookkeeping services in the Philippines charge ₱3,000–₱6,000/month for basic services, ₱10,000–₱15,000+/month for full payroll + SSS/PhilHealth/Pag-IBIG compliance. Sources: loft.ph, AYP Group, Flat World Solutions (2025 data).

**Finding:** SSS contribution computation is bundled into payroll compliance, which most employers with even 1–5 employees outsource to a bookkeeper or CPA. The penalty for non-remittance (3%/month + criminal liability) makes self-service risky for non-experts. Moat=3 accurately captures the CPA/bookkeeper dependency.

**Verdict:** Moat=3 CONFIRMED. Score 4.50 unchanged.

---

### Rank 1–2: E-OFW-1 (OFW Placement Fee Legality Checker) — Moat=3 ✅ CONFIRMED

**Evidence:** Illegal placement fees documented at ₱28,000–₱358,400 per worker (Migrant Forum in Asia data via PIDS/Inquirer). Specific case: domestic worker paid ₱45,000 (category that is entirely exempt). POEA GBR 05-2024 raised agency escrow requirements, signaling ongoing enforcement challenge. DMW actively monitors but information asymmetry persists — OFWs do not know whether their category is zero-fee or 1×salary cap.

**Finding:** The moat here is pure information asymmetry — workers do not know the rules. The "specialist" gatekeeping is the recruitment agency itself, which exploits the information gap. No online tool exists for workers to instantly verify legality of fees for their specific job category + destination country combination.

**Verdict:** Moat=3 CONFIRMED. Score 4.50 unchanged.

---

### Rank 3–7 (tied 4.30): A-SSS-1 (SSS Retirement Pension / BMP) — Moat=3 ✅ CONFIRMED

**Evidence:** SSS provides a free Pension Calculator at sss.gov.ph/pension-calculator and a My.SSS Retirement Calculator. However, the free tools do not model: (a) the 3-formula BMP comparison, (b) Option 1 vs Option 2 NPV decision, (c) impacts of continuing contributions as voluntary member, or (d) interaction with MySSS Pension Booster (MPF). No professional consultant industry found specifically for SSS benefit advice — SSS branches provide free guidance.

**Finding:** The SSS calculator covers basic computation but misses the Option 1 (60-month advance lump sum) vs. Option 2 (18-month + immediate pension) NPV analysis, which is the highest-value decision. At 2.2M current pensioners + 42M future retirees, even a small fraction needing decision support represents a huge market. The moat is not professional fees but decision complexity (irreversible, multi-variable, mortality-adjusted).

**Verdict:** Moat=3 maintained (complexity of BMP/Option NPV decision warrants CPA/advisor consultation even though basic calculation tools exist). Score 4.30 unchanged.

---

### Rank 3–7 (tied 4.30): G-LTO-1 (MVUC + Total Registration Cost) — Moat 3→**2** ⬇️ DOWNGRADED

**Evidence:**
- LTO has its own LTMS portal for online renewal
- Official LTO registration guides exist at multiple consumer finance sites (moneymax, carmudi, topgear, philkotse)
- Fixer/third-party agent fees are explicitly **illegal** under RA 10930 (₱20,000 penalty + 2-year ban)
- LTO itself warns motorists against fixers
- No professional "LTO compliance advisor" market exists; the market is informal fixers who are legally prohibited

**Finding:** The moat for LTO registration fee computation is **weaker than initially assessed**. While information fragmentation across MVUC + CTPL + emission + delinquency penalties creates confusion, multiple free guides and the LTMS portal disintermediate the need for professional help. The fixer market is illegal and shrinking due to LTMS digitization. Moat=2 (online tools exist) is more accurate than Moat=3.

**Score adjustment:** Moat 3→2 → Score = (5×0.25)+(2×0.25)+(5×0.30)+(4×0.20) = 1.25+0.50+1.50+0.80 = **4.05** (was 4.30)

---

### Rank 3–7 (tied 4.30): I-MAR-1 (Total STCW Certification Cost) — Moat=3 ✅ CONFIRMED

**Evidence:** STCW Basic Training costs ~₱3,500 at individual training centers (TMTCP), but prices vary significantly across 100+ MARINA-accredited institutions. Manning agencies charge employers ~USD 150/seafarer but CANNOT charge seafarers. MARINA's 622-line fee schedule (MC GC-2026-01) plus training center fee variation plus STCW 2024/2026 amendments = complex total cost computation that no single seafarer can easily navigate.

**Finding:** The moat is information fragmentation — not professional gatekeeping. But the consequence of under-budgeting is deployment delay (direct income loss), validating the pain score. STCW 2024 amendments (mandatory SASH refresher by 2026) will force mass revalidations. Moat=3 is accurate: navigating the 622-item fee schedule requires specialist knowledge.

**Verdict:** Moat=3 CONFIRMED. Score 4.30 unchanged.

---

### Rank 3–7 (tied 4.30): I-MAR-2 (STCW Pathway Eligibility) — Moat=3 ✅ CONFIRMED

**Finding:** Same domain logic as I-MAR-1. Complex conditional sea service thresholds (Tables A-II/1, A-III/1) with rank-specific requirements and MARINA 2024 course overhaul (deck: 425→193 hours, engine: 565→311 hours). No public decision-tree tool. Moat=3 CONFIRMED.

---

### Rank 3–7 (tied 4.30): O-LRA-1 (ONETT Deadline & Late Penalty) — Moat 3→**4** ⬆️ UPGRADED

**Evidence:**
- Notary/conveyancing lawyer fees: 0.5%–1.5% of property price = ₱50,000–₱150,000 on a ₱10M property
- Title transfer processing service fees: ₱5,000–₱15,000 (liaison/runner) to ₱20,000–₱50,000 for full-service
- Average title transfer service charge: ₱20,000 (Metro Manila) to ₱30,000 (outside MM)
- Lawyers charge ₱3,000–₱6,000/hour (₱25,000/hour for established firms)
- LRA's own ERCF tool is under maintenance; no reliable public tool for deadlines + penalties

**Finding:** ONETT property transfer firmly requires a lawyer or licensed processor. Service fees of ₱20,000–₱50,000 per transaction are well above the ₱50K+ threshold for Moat=5, but since not ALL transactions reach ₱50K+, and many mid-range transactions use liaison services at ₱15,000–₱30,000, Moat=4 ("needs lawyer/specialist") is the correct classification. The 30-day CGT / 5-day DST deadline pressure plus multi-agency sequencing (BIR → LGU → LRA) is the core pain point.

**Score adjustment:** Moat 3→4 → Score = (5×0.25)+(4×0.25)+(5×0.30)+(4×0.20) = 1.25+1.00+1.50+0.80 = **4.55** (was 4.30)

---

### Rank 8: D-GSIS-1 (GSIS BMP Retirement + Option 1/2 Decision) — Moat=3 ✅ CONFIRMED

**Evidence:** No private consultant market found specifically for GSIS benefit advice. GSIS provides free retirement processing through branches and the GSIS Touch App. HR departments at government agencies assist employees. However, the Option 1/2 NPV decision (irreversible, mortality-adjusted, ₱5K–₱20K/month pension differential over decades) is genuinely complex and GSIS's own tools do not model the NPV comparison.

**Finding:** The moat is decision complexity + irreversibility rather than professional fees. Legacy law selection (RA 660/RA 1616/PD 1146/RA 8291) for pre-1997 employees adds further complexity beyond GSIS's free tools. Moat=3 confirmed.

**Verdict:** Moat=3 CONFIRMED. Score 4.05 unchanged.

---

### Rank 9: E-OFW-2 (OFW Total Pre-Departure Cost) — Moat=2 ✅ CONFIRMED

**Evidence:** DMW/OWWA websites document the fees. Multiple OFW consumer guides exist (moneymax, etc.). The moat is aggregation across multiple agencies (OWWA ₱25 + OFW Pass + PhilHealth + Pag-IBIG + NBI/PSA/passport/medical) rather than professional gatekeeping.

**Verdict:** Moat=2 already correctly scored. Score 4.05 unchanged.

---

### Rank 10: H-PRC-1 (PRC CPD Compliance & Unit Gap Calculator) — Moat=3 ✅ CONFIRMED

**Evidence:** PRC provides LERIS online portal for renewals. CPD Undertaking extended until June 2026, showing the system's complexity. No professional "CPD advisor" market found with standardized fees. However, 43 profession-specific requirements + OFW exemption rules + SDL cap + carryover tracking = complex enough that professionals are confused (43,000+ petition signatures against old requirements). CPD seminar providers also offer bundled "compliance packages" at ₱1,000–₱3,000/unit.

**Finding:** Moat is information complexity + seminar selection optimization, not traditional professional gatekeeping. But the cost of getting it wrong (late renewal = 50% surcharge + suspended practice) validates Moat=3.

**Verdict:** Moat=3 CONFIRMED. Score 4.05 unchanged.

---

### Rank 11: N-BFP-2 (FSIC Compliance Calendar + FSMR Tracker) — Moat=3 ✅ CONFIRMED

**Evidence:** Only FSPs with Certificate of Competency can prepare and certify FSMR. FSP fees are not publicly standardized but "₱10,000–₱50,000 per engagement" from Wave 1 analysis is consistent with BFP sources confirming "hiring consultants or engineers adds to overall cost." FSIC processing: 2–8 weeks; annual renewal requires FSMR by licensed FSP.

**Finding:** Real professional moat confirmed. The FSMR requirement (mandatory, FSP-only) is the structural barrier. FSIC Compliance Calendar (the tracking/reminder product) does not require an FSP but the underlying FSMR compliance does.

**Verdict:** Moat=3 CONFIRMED. Score 4.05 unchanged.

---

### Rank 12: A-SSS-2 (SSS Maternity Benefit) — Moat=3 ✅ CONFIRMED

**Evidence:** HR outsourcing/payroll services bundle maternity benefit processing with full payroll (₱10K–₱15K+/month packages). Specific maternity-only service pricing not found, but the 30-day advance requirement + ADSC computation + salary differential calculation + DAEM enrollment creates sufficient complexity for HR outsourcing demand. Employer liability cannot be delegated to payroll aggregators.

**Verdict:** Moat=3 CONFIRMED. Score 4.00 unchanged.

---

### Rank 13: B-PHI-1 (PhilHealth Case Rate Benefit Application) — Moat=1 ✅ CONFIRMED

**Evidence:** PhilHealth's case rate system deducts directly from hospital bills before patient discharge — the hospital processes the claim, not the patient. PhilHealth provides a Case Rates Search tool online (philhealth.gov.ph/services/acr/). PC2024-0037 updated ~9,000 case rates. No patient advocate market found for standard case rate application.

**Finding:** Moat=1 correctly scored — the hospital does the work. The opportunity is information transparency (patient doesn't know what the hospital is required to deduct), not professional gatekeeping. The 4.00 score is driven by Market=5 (112M coverage target), Computability=5, and Pain=5 (billing transparency crisis).

**Verdict:** Moat=1 CONFIRMED. Score 4.00 unchanged.

---

### Rank 14: C-HDMF-1 (Pag-IBIG Housing Loan Eligibility & Amortization) — Moat 3→**2** ⬇️ DOWNGRADED

**Evidence:**
- Multiple online Pag-IBIG loan calculators exist: omnicalculator.com/finance/pag-ibig-housing-loan, nook.com.ph, myhousingloancal.ph, Globe blog
- Nook (digital mortgage broker) won Best Mortgage Broker Philippines 2024, described as "first and only mortgage broker" — indicating formal brokerage is nascent
- Official Pag-IBIG processing fees: only ₱1,000–₱2,000 (very low government fee)
- Pag-IBIG has its own online application portal (Virtual Pag-IBIG)

**Finding:** The calculation tools already exist in the market — multiple free online calculators cover the HLAR/LTV/rate-tier computation. The moat was overstated at 3; 2 ("online tools exist") is more accurate. However, the Affordable Housing track and complex eligibility criteria for informal settlers remain underserved.

**Score adjustment:** Moat 3→2 → Score = (5×0.25)+(2×0.25)+(4×0.30)+(4×0.20) = 1.25+0.50+1.20+0.80 = **3.75** (was 4.00)

---

### Rank 15: F-BOC-1 (BOC Landed Cost Calculator) — Moat=3 ✅ CONFIRMED

**Evidence:** Licensed customs broker fee schedule confirmed via BOC CAO:
- Up to ₱10K shipment: ₱1,300 brokerage fee
- ₱100K–₱200K shipment: ₱5,300 brokerage fee
- Above ₱200K: ₱5,050 + 0.125% of excess (e.g., ₱1M shipment = ₱6,300)
- Plus courier parcel brokerage: ₱700/package
- BOC has its own estimator at customs.gov.ph/estimator but it's not comprehensive
- Multiple third-party tools exist (easyship, emerhub) for basic computation

**Finding:** Licensed customs broker is mandatory for formal import entries — not optional. The fee schedule is statutory and confirmed at ₱1,300–₱5,300+ per shipment. For millions of e-commerce importers below the de minimis threshold (₱10,000 FOB), brokerage fees are avoided but HS code classification + VAT computation is still confusing. Moat=3 correctly captures the customs broker requirement for formal entries.

**Verdict:** Moat=3 CONFIRMED. Score 4.00 unchanged.

---

### Rank 16: O-LRA-2 (ONETT Pipeline Calculator) — Moat 3→**4** ⬆️ UPGRADED

**Evidence:** Same professional service market as O-LRA-1. Processing services: ₱20,000–₱50,000 per transaction. Lawyers required for notarization of deed of sale (a prerequisite for ONETT filing). The pipeline version (CGT + DST + LGU transfer tax + LRA fee computation) is the full-service engagement that processing agents provide.

**Score adjustment:** Moat 3→4 → Score = (5×0.25)+(4×0.25)+(4×0.30)+(4×0.20) = 1.25+1.00+1.20+0.80 = **4.25** (was 4.00)

---

### Rank 17: R-DTI-1 (Annual Business Compliance Calendar) — Moat=3 ✅ CONFIRMED

**Evidence:** Full payroll + compliance outsourcing (₱10K–₱15K/month) covers DTI renewal + LGU permit tracking + BIR calendar. The LGU January 20 deadline creates acute pain that CPAs/bookkeepers help manage. No specific "compliance calendar" product found in the market.

**Verdict:** Moat=3 CONFIRMED. Score 4.00 unchanged.

---

### Rank 18: P-IPO-1 (IP Portfolio Compliance Dashboard) — Moat=4 ✅ CONFIRMED

**Evidence:**
- IPOPHL MC 2024-012/013 (August 22, 2024): new mandatory accreditation for trademark agents — confirms formal professional market
- Annual monitoring/docketing services: ₱10K–₱20K/year (Wave 1 estimate)
- IP-Coster, iPNOTE, and other international platforms charge ~$290+ for trademark registration
- IPAP prescribes minimum attorney fees for IP cases
- New 18-month transition period confirms agents need formal recognition to practice

**Finding:** IP firm retainer market is real and well-established. The 2024 accreditation rules formalize and legitimize the professional moat. Moat=4 ("needs lawyer/specialist") is correctly scored.

**Verdict:** Moat=4 CONFIRMED. Score 3.95 unchanged.

---

### Additional Validation: G-LTO-2 (LTO Late Registration Penalty) — Moat 3→**2** ⬇️ DOWNGRADED

**Evidence:** Same finding as G-LTO-1. The 50% MVUC surcharge computation is a simple mathematical formula, and multiple consumer guides explain it clearly. No professional market exists for LTO penalty calculation. LTMS portal is the authoritative source.

**Score adjustment:** Moat 3→2 → Score = (4×0.25)+(2×0.25)+(5×0.30)+(3×0.20) = 1.00+0.50+1.50+0.60 = **3.60** (was 3.85)

---

### Additional Validation: R-BOI-1 (BOI/PEZA SCIT vs. EDR Election) — Moat=5 ✅ CONFIRMED

**Evidence:** Big 4 advisory firms (PwC, KPMG, Deloitte, EY, Forvis Mazars) are the primary advisors for CREATE/CREATE MORE tax incentive optimization. Fee range ₱200K–₱500K per engagement (Wave 1 estimate) is consistent with the complexity described: "professional advisory is indispensable... not optional." CREATE MORE (RA 12066, November 2024) just triggered a new wave of strategy reassessments.

**Verdict:** Moat=5 already correctly scored. Score 3.75 unchanged.

---

## Score Adjustments Summary

| ID | Domain | Moat Old | Moat New | Score Old | Score New | Δ | Reason |
|----|--------|----------|----------|-----------|-----------|---|--------|
| G-LTO-1 | MVUC + Total Registration Cost Calculator | 3 | **2** | 4.30 | **4.05** | −0.25 | LTO LTMS portal + multiple free guides + fixer market illegal; no professional moat |
| G-LTO-2 | LTO Late Registration Penalty Calculator | 3 | **2** | 3.85 | **3.60** | −0.25 | Same reasoning as G-LTO-1; simple 50% MVUC formula, no professional needed |
| C-HDMF-1 | Pag-IBIG Housing Loan Eligibility & Amortization | 3 | **2** | 4.00 | **3.75** | −0.25 | Multiple online calculators confirmed (omnicalculator, Nook, myhousingloancal) |
| O-LRA-1 | ONETT Deadline & Late Penalty Calculator | 3 | **4** | 4.30 | **4.55** | +0.25 | Processing services ₱20K–₱50K; lawyers 0.5%–1.5% of property price confirmed |
| O-LRA-2 | ONETT Pipeline Calculator | 3 | **4** | 4.00 | **4.25** | +0.25 | Same professional service market as O-LRA-1; notarization prerequisite |

**Net effect on score distribution:**
- Elite (≥4.50): 2 → **3** (O-LRA-1 joins A-SSS-3 and E-OFW-1)
- Top (4.00–4.49): 15 → **13** (O-LRA-1 rises out; C-HDMF-1 drops out; O-LRA-2 rises into; G-LTO-1 stays in at 4.05)
- Strong (3.50–3.99): 42 → **44** (C-HDMF-1 joins at 3.75; G-LTO-2 joins at 3.60)
- Moderate/Marginal: unchanged

---

## Key Findings

### 1. ONETT is the Most Underrated Domain Cluster
The property transfer (ONETT) pipeline has the strongest real-world professional moat of any domain analyzed — confirmed processing service fees of ₱20,000–₱50,000 per transaction, with notarization, CGT/DST computation, and multi-agency sequencing all creating genuine specialist dependency. O-LRA-1 now ties at 4.55 with the SSS and OFW domains for the top score.

### 2. LTO Has a Weaker Moat Than Assumed
The LTO registration domain has significant market scale (14M+ transactions/year) but weaker moat than scored. The LTMS portal, numerous consumer guides, and the illegal status of fixers mean no legitimate professional moat exists. The value proposition is information aggregation, not professional displacement.

### 3. PhilHealth Case Rate Has the Unusual Moat=1 / Score=4.00 Profile
B-PHI-1 achieves its 4.00 score on market scale + pain + computability alone — the moat is genuinely low (hospitals process it). The product opportunity is a patient-facing transparency tool to verify what the hospital was required to deduct, not a professional displacement play.

### 4. Pag-IBIG Housing Loan Calculator Market Is Served
Multiple online Pag-IBIG calculators already exist. The remaining opportunity is the Affordable Housing track (3% rate, chronically underutilized) and complex eligibility edge cases, not basic amortization computation.

### 5. IP Attorney Market Well-Established and Formalizing
The 2024 IPOPHL accreditation rules confirm a real, growing professional market for IP docketing and monitoring. The ₱10K–₱20K/year retainer figure from Wave 1 is consistent with the evidence.

### 6. BOI/PEZA SCIT Election: Only Confirmed Moat=5 Domain
The BOI SCIT vs. EDR election at Moat=5 is confirmed — Big 4 advisory is the only practical option for this analysis, and CREATE MORE (November 2024) triggered a new wave of irrevocable elections with ₱200K–₱500K advisory fees.
