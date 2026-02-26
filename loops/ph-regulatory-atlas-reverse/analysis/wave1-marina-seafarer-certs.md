# Wave 1 Analysis: MARINA Seafarer Certifications

**Aspect:** `marina-seafarer-certs`
**Governing Law:** PD 474 (creating MARINA), RA 9295 (Domestic Shipping Development Act of 2004), RA 10635 (MARINA Act of 2014), RA 12021 (Magna Carta of Filipino Seafarers, 2024), STCW Convention 1978 as amended (2010 Manila Amendments), MARINA MC GC-2026-01 (Omnibus Schedule of Fees and Charges)
**Regulatory Agency:** Maritime Industry Authority (MARINA); MARINA STCW Administration Office (SAO)
**Date Analyzed:** 2026-02-26

---

## Summary

MARINA governs the certification of ~576,600+ annually deployed Filipino seafarers — the Philippines supplies roughly 30% of the world's merchant seafarers. The STCW Convention defines a pyramid of certification levels (ratings → officers → management level) each gated by specific sea service thresholds (12–36 months by rank and tonnage class), mandatory training courses (BST, ATFF, PSCRB, GMDSS, ECDIS, MLC, Security), and 5-year revalidation cycles. Every certificate has a fee, and the 2026 Omnibus Fee Schedule (MC GC-2026-01) covers 622 line items. The total cost of becoming and remaining a certified seafarer involves dozens of interdependent computations over a career. Currently, seafarers navigate MARINA's MISMO portal, multiple training centers, and a patchwork of circulars — with no tool that integrates the full certification pathway, eligibility checking, and cost estimation. Four automation-ready domains emerge.

---

## Market Size

- **576,600–578,600** Filipino seafarers deployed in 2023 (all-time high per DMW/Department of Migrant Workers)
- Philippines has been the world's primary seafarer supplier since 1987
- **~30% of the world's merchant fleet officers** are Filipino
- MARINA maintains the Seafarer Certification System (SCS) for ~500K+ active registered seafarers
- Annual MARINA certification transactions (COC + COP issuances + revalidations): estimated **300,000–500,000** per year across all certificate types
- Seafarer remittances: **$6.71 billion in 2022** (~1.66% of GDP), confirming economic scale
- **~50,000–100,000** seafarers are in promotion-track (seeking new or higher COC) at any given time
- **~26,000+ MARINA-accredited** training slots per year across multiple training centers

---

## Governing Statutory Sections

### PD 474 (Creating MARINA, 1974)
- **Section 3** — MARINA mandate: integrate development, promotion, and regulation of the maritime industry
- **Section 4(d)** — Authority to establish, prescribe, and collect fees and charges for maritime services
- **Section 4(j)** — Authority to issue, cancel, suspend, or revoke certificates of competency

### RA 10635 (MARINA Act of 2014)
- **Section 4** — Expanded mandate: issue certificates of competency/proficiency, regulate maritime training institutions, register seafarers
- **Section 5(g)** — Authority to prescribe qualifications and standards for seafarers in accordance with STCW Convention
- **Section 5(h)** — Authority to fix and collect fees consistent with STCW and Republic Act 11032 (EODB Act)

### RA 9295 (Domestic Shipping Development Act of 2004)
- **Section 10(1)** — Vessel registration requirements and fees
- **Annex E** — Schedule of fees and charges for vessel registration, ATF computation (Annual Tonnage Fee)
- MARINA MC 2013-02 — Revised Rules for Registration, Documentation and Deletion of Ships; ship classification A–I

### STCW Convention 1978 (as amended, with 2010 Manila Amendments)
- **Regulation II/1** (Table A-II/1) — OIC-NW: 12 months structured onboard training (cadet/trainee) OR 36 months deck department service on ships ≥500 GT
- **Regulation II/2** (Table A-II/2) — Chief Mate: 12 months as OIC-NW on ships ≥500 GT; Master: 36 months as OIC-NW OR 12 months OIC-NW + 12 months Chief Mate
- **Regulation III/1** (Table A-III/1) — OIC-EW: 12 months as engineer trainee on ships ≥750 kW OR 36 months engine department service
- **Regulation III/2** (Table A-III/2) — Second Engineer: 12 months as OIC-EW; Chief Engineer: 36 months OIC-EW OR 12 months OIC-EW + 12 months as 2/E
- **Regulation I/11** — Revalidation every 5 years; requires recent sea service (3 months in last 5 years for operational level; 12 months in last 5 years for management level, or completion of approved refresher/updating course)
- **Regulation VI/1** (Table A-VI/1) — Basic Safety Training: PST + FPFF + EFA + PSSR (10 days, mandatory for ALL seafarers)
- **Regulation VI/3** (Table A-VI/3) — Advanced Fire Fighting (ATFF): 36 training hours, required for officers designated for firefighting duties
- **Regulation III/4 / Table A-VI/2** — PSCRB (Proficiency in Survival Craft and Rescue Boats): required for deck officers and crew with lifeboat duties; refresher every 5 years
- **Regulation IV/2** — GMDSS Radio Operator Certificate: required for Master and OIC-NW on international voyages
- **Regulation II/1 + II/2** (Table A-II/1) — ECDIS (Electronic Chart Display): required for Master, Chief Mate, and OIC-NW since 2017
- **MLC 2006 (Maritime Labour Convention)** — Medical fitness: valid PEME (Pre-Employment Medical Examination) from DOH-accredited clinic required; full MLC training for Management level; MLC Updating for legacy OICs

### MARINA Memorandum Circulars
- **MC GC-2026-01** — Omnibus MARINA Schedule of Fees and Charges (622 line items: COC ₱530/₱780 expedited; COP ₱200; SID+SRB ₱800–₱2,000; vessel registration; training institution fees; etc.)
- **MC SC-2022-02** — Revised fees for COC (₱530 from ₱1,000) and COP, per EODB Act (RA 11032)
- **MC 2008-05 / MC 2008-07** — Annual Tonnage Fee schedule for domestic vessel operators
- **MC 2013-02** — Revised Rules for vessel registration and deletion; ship classes A–I
- **STCW Circular 2017-__ / 2018-02** — Lists of mandatory STCW training courses (Annex I); training center accreditation requirements
- **RA 12021 (Magna Carta of Filipino Seafarers, 2024)** — Empowers MARINA to set maximum/minimum STCW training fees for the first time; changes to minimum wage provisions for seafarers

---

## Domains Identified

### Domain 1: STCW Certification Pathway & Sea Service Eligibility Calculator

**Description:** A tool that, given a seafarer's current rank, certificates held, and sea service record (months by rank + ship tonnage/power), determines which COC level they are eligible to apply for next, what sea service months they still need, and what training courses are required before they can apply.

**Computation sketch:**

```
Inputs:
  - Current rank held (None/Rating → OIC-NW/OIC-EW → Chief Mate/2E → Master/CE)
  - Sea service log: list of {rank, ship_GT_or_kW, months} entries
  - STCW training COPs held: [BST, ATFF, PSCRB, GMDSS, ECDIS, MLC, ECDIS, SSO, tanker endorsements...]
  - Cadet/structured training completed (Y/N)
  - Target COC level

Eligibility Computations (per STCW Table A-II/1, A-II/2, A-III/1, A-III/2):
  For OIC-NW target:
    option_A: cadet_training_flag AND ship_GT ≥ 500 AND months_as_trainee ≥ 12
    option_B: sum(months where rank ∈ deck_dept AND ship_GT ≥ 500) ≥ 36
    eligible_OIC_NW ← option_A OR option_B
    missing_months_A ← max(0, 12 - months_cadet_on_500GT+)
    missing_months_B ← max(0, 36 - total_deck_months_on_500GT+)

  For Master target:
    option_A: months_as_OIC_NW ≥ 36
    option_B: months_as_OIC_NW ≥ 12 AND months_as_chief_mate ≥ 12
    eligible_Master ← option_A OR option_B
    [similar for Chief Engineer with kW thresholds]

Training Course Gap Computation:
  required_courses ← lookup(target_COC_level)
  # OIC-NW: BST, PSCRB, ATFF, GMDSS, ECDIS, SSBT, MLC-Full or Updating Course Part A
  # Master: same + OIC-Updating Course Part B + full MLC
  missing_courses ← required_courses - held_COPs
  expired_courses ← {c for c in held_COPs if age(c) > validity_years[c]}
  all_gaps ← missing_courses ∪ expired_courses

Outputs:
  - Eligible for target COC? (Y/N)
  - Missing sea service: X months as [rank] on ships ≥ [tonnage] GT
  - Best-case next eligible date
  - Required training courses not yet completed/not yet expired
  - Estimated training cost range (₱/course × number of missing courses)
  - Recommended sequence (some courses prerequisite for others)
```

**Who currently does this:** Manning agencies, maritime school career counselors, experienced seafarers guiding junior colleagues. No official MARINA tool or third-party app covers the full eligibility calculation. Seafarers read STCW tables themselves (dense convention text) or ask in Facebook groups (e.g., "Pinoy Seafarers" with 500K+ members).

**Market size:** ~576,600 deployed seafarers; ~50,000–100,000 per year seeking promotion to next COC level. All new maritime school graduates (BSMT/BSMarE programs: ~20,000–30,000 graduates/year) need this to plan their cadet-to-officer pathway.

**Professional cost:** Manning agencies and maritime law consultants charge ₱2,000–₱10,000 for career pathway guidance. Some training centers bundle this as a "career assessment" service.

**Pain indicators:**
- Sea service thresholds are defined in raw STCW convention tables — not in any Philippine-language summary tool
- OIC-NW applicants commonly submit wrong sea service format (rank listed incorrectly, tonnage class unverified)
- MISMO rejections for sea service documents lead to months-long delays
- Facebook maritime groups have thousands of posts asking "am I eligible yet?"
- Tanker endorsement requirements (oil/chemical/gas tanker) add another layer of course prerequisites that many seafarers miss

**Computability:** Fully deterministic — sea service thresholds are exact numbers in STCW Tables A-II/1, A-II/2, A-III/1, A-III/2. Tonnage/power thresholds are fixed (500 GT for deck; 750 kW for engine). Training course requirements per COC level are enumerated in STCW circulars.

**Opportunity score estimate: 4.05**
- Market (5): 576K+ seafarers; 20K+ new graduates/year; 50K+ promotion-seeking annually
- Moat (3): No official tool; human advisors/manning agencies informally gate access
- Computability (5): Fully deterministic from STCW tables and MARINA circulars
- Pain (4): MISMO rejections for wrong sea service documentation cause deployment delays — literal income loss

---

### Domain 2: Total STCW Certification Cost Calculator (New Entrant & Revalidation)

**Description:** A tool that computes the full cost of entering the seafaring profession at a target rank, OR revalidating an existing certificate set. Covers official MARINA fees + training center fees + ancillary costs. Addresses the 622-line fee schedule opacity.

**Computation sketch:**

```
MODE A — New Entrant Cost Calculator:
  Inputs:
    - Target entry rank: Rating vs. OIC-NW vs. OIC-EW
    - Number of COPs already held (from maritime school training)

  Computations:
    Documents:
      SID fee ← ₱XXX (from MC GC-2026-01)
      SRB fee ← ₱XXX (from MC GC-2026-01)
      SIRB (if applicable) ← ₱XXX
      Medical PEME ← ₱2,000–₱5,000 (DOH-accredited clinic; not fixed by MARINA)
      Passport (if new) ← ₱950–₱1,200 (DFA fee, not MARINA)
      NBI Clearance ← ₱130

    MARINA certification fees (from MC GC-2026-01):
      COC ← ₱530 (regular) or ₱780 (expedited)
      COP per certificate ← ₱200 each
      Number of COPs needed ← count(mandatory_courses) - count(already_held)
      Total COP fees ← count_needed × ₱200

    Training center fees (variable, regulated from 2024 per RA 12021):
      For each missing mandatory course:
        BST ← ₱5,000–₱8,000 estimated (10-day course, includes materials)
        ATFF ← ₱4,000–₱6,000 (5-day)
        PSCRB ← ₱3,000–₱5,000
        GMDSS ← ₱15,000–₱25,000 (specialized radio operator exam)
        ECDIS ← ₱8,000–₱15,000 (generic model)
        MLC Training (Full) ← ₱3,000–₱6,000
        OIC-Updating Part A or B ← ₱5,000–₱10,000
      Total training ← sum of applicable courses

    Total cost ← sum(documents + MARINA fees + training)
    Monthly savings needed ← total_cost ÷ months_until_eligible

MODE B — Revalidation Cost Calculator:
  Inputs:
    - COC type held (OIC-NW / Chief Mate / Master / OIC-EW / 2E / CE)
    - COC issue date → days until 5-year expiry
    - Sea service in last 5 years: total months
    - COPs held and issue dates

  Computations:
    Sea service sufficiency:
      if months_sea_service_last_5_years ≥ 3 (operational) or ≥ 12 (management):
        sea_service_OK ← True (STCW Reg. I/11 requirement)
      else:
        refresher_course_required ← True

    Expired COPs (5-year validity):
      expired ← {c for c in held_COPs if (today - issue_date(c)).years ≥ 5}
      refresher_courses_needed ← refresher_versions_of(expired)

    Fee computation:
      COC revalidation fee ← ₱530 (or ₱780 expedited)
      refresher_courses_cost ← sum(refresher fees for each expired COP)
        # Refresher BST: 2 days ≈ ₱2,000–₱4,000
        # Refresher ATFF: 1–2 days ≈ ₱2,000–₱3,500
        # Refresher PSCRB: 1.5 days ≈ ₱2,000–₱3,000
      PEME medical renewal ← ₱2,000–₱5,000
      SRB re-issuance if pages used up ← ₱XXX

    Total revalidation cost ← MARINA_fee + refreshers + PEME
    Urgency flag ← if days_until_expiry < 180: URGENT (pre-departure MARINA window closing)
```

**Who currently does this:** Manning company crew managers coordinate document expiry tracking. Individual seafarers track via spreadsheet or memory. No consumer-facing tool exists. Training centers informally advise their own enrollees. MISMO shows certificate status but does not compute what's expiring and what it costs.

**Market size:** 576,600 deployed seafarers × 5-year revalidation cycle = ~115,000 revalidations per year minimum. Plus entry-level: ~20,000–30,000 maritime graduates/year entering the process.

**Professional cost:** Manning agencies include pre-employment documentation coordination in their service (which is charged to the shipowner), but individual seafarers between contracts self-manage at real cost. Seafarers pay ₱500–₱2,000 to fixers/documentation services to arrange training slots and appointments.

**Pain indicators:**
- MARINA MISMO appointment slots fill up quickly, especially pre-holiday season
- Seafarers "miss their ship" (deployment date) because COC revalidation is late — literal $500–$1,500 penalty per delayed deployment
- 622-line Omnibus Fee Schedule is not consumer-friendly — seafarers cannot easily compute their total cost
- New entrants receive no official cost estimate; maritime schools don't systematically compute post-graduation certification cost

**Computability:** Fully deterministic — official MARINA fees from MC GC-2026-01 are fixed by circular; training course requirements per COC level from STCW circulars; 5-year validity and sea service sufficiency rules from STCW Reg. I/11. Training center fees are variable but range-estimable.

**Opportunity score estimate: 4.10**
- Market (5): 576K+ seafarers; 115K+ revalidations/year; 20K+ new entrants/year
- Moat (3): No comprehensive tool exists; manning agencies informally do this for contracted crew only
- Computability (5): Fully deterministic for official fees; range-estimable for training costs
- Pain (4): Missed deployment = direct income loss; 622-line fee schedule inaccessible to ordinary seafarers

---

### Domain 3: COC/COP Revalidation Document Checklist Generator

**Description:** A rank-specific, MARINA-circular-compliant checklist generator that outputs exactly which documents must be submitted for a specific COC application type (issuance vs. revalidation; management vs. operational level), flagging common errors that cause MISMO rejections.

**Computation sketch:**

```
Inputs:
  - Application type: Issuance (new) vs. Revalidation
  - Target rank: OIC-NW / OIC-EW / Chief Mate / Master / 2E / Chief Engineer
  - Current certification set held

Checklist Computation (per STCW Circular on documentary requirements):

  Common base requirements (all applications):
    [ ] Valid SIRB or SRB+SID
    [ ] Valid Passport (minimum 6 months validity)
    [ ] Valid Medical Certificate (PEME format, DOH-accredited clinic)
    [ ] Company Sea Service Certificate / Continuous Discharge Certificate
    [ ] Recent 2×2 passport photo (collared shirt, shoulder board per rank)
    [ ] Completed MISMO online application (SRN obtained)

  COC Issuance — Management Level (Master/Chief Engineer):
    [ ] Theoretical Examination results + verification stamp from EAD
    [ ] Practical Assessment results + verification stamp from EAD
    [ ] Last issued COC/COE
    [ ] COP: Basic Training (current, ≤5 years)
    [ ] COP: PSCRB/SCRB (current, ≤5 years)
    [ ] COP: ATFF (current, ≤5 years)
    [ ] COP: MEFA (current, ≤5 years)
    [ ] COP: GMDSS (Master/Chief Mate only)
    [ ] Training Certificate: ECDIS generic (Master/Chief Mate only)
    [ ] Training Certificate: OIC-Updating Course Part B (if upgrading from OIC)
    [ ] Training Certificate: Full MLC (if no prior MLC) OR MLC Updating (if licensed under 1995 amendment)
    [ ] Sea Service: meets rank-specific STCW threshold [computed from Domain 1]

  COC Revalidation — Operational Level (OIC-NW / OIC-EW):
    [ ] Existing COC
    [ ] Proof of sea service: ≥3 months in last 5 years [verified from service records]
      OR: Completion of approved refresher/updating course (if sea service insufficient)
    [ ] All COPs still valid (not expired beyond 5 years)
    [ ] ECDIS training refresher (if last training > 5 years ago)

  Flag common errors:
    - Photo without proper shoulder board (most common rejection at OIC level)
    - Sea service certificate not company-issued with authorized signatory
    - PEME medical certificate from non-accredited clinic
    - GMDSS expired (5-year rule often missed by non-navigational officers)
    - "For Board Exam Purposes" TOR submitted instead of regular TOR (maritime school error)

Output:
  - Complete ranked checklist (required vs. optional vs. not-applicable to this rank)
  - Flagged likely errors based on inputs
  - Estimated total MARINA fees payable
  - Link to current MARINA MC circular for verification
```

**Who currently does this:** MARINA's MISMO portal lists requirements per certificate type, but it is not interactive or rank-specific in an actionable way. Maritime schools provide generic guidance. Reddit/Facebook maritime groups field thousands of "is this required for OIC-NW?" questions.

**Market size:** ~300,000–500,000 MARINA certification transactions/year (COC + COP issuances + revalidations).

**Professional cost:** Documentation preparers and manning company "crew coordinators" charge ₱500–₱2,000/application to compile and verify documents.

**Pain indicators:**
- MISMO rejections for incorrect documents → lost appointment slots → re-queuing delay (weeks)
- Photo non-conformity (wrong shoulder boards per rank) is documented as a top rejection reason
- Documentary requirements differ significantly by rank — a single wrong check costs a seafarer 2–4 weeks

**Computability:** Fully deterministic — MARINA circulars enumerate every required document per certificate type. The checklist is a structured conditional lookup table.

**Opportunity score estimate: 3.80**
- Market (5): 300K–500K transactions/year
- Moat (2): Self-service checklist possible from MARINA website, but not interactive; information is fragmented across 20+ circulars
- Computability (5): Pure lookup table logic from MARINA circular text
- Pain (3): Moderate — errors cause delays but not permanent loss; fixers serve this market affordably

---

### Domain 4: Annual Tonnage Fee (ATF) Calculator for Domestic Vessel Operators

**Description:** A tool for Philippine domestic shipping operators that computes the Annual Tonnage Fee (ATF) payable to MARINA for their registered fleet, including multi-vessel aggregation and late penalty computation.

**Computation sketch:**

```
Inputs:
  - Fleet list: [{vessel_class, gross_tonnage, registration_date}]
  - Payment date (for late penalty computation)

ATF Computation (per MARINA MC 2008-05 / MC 2008-07):
  total_GT ← sum(vessel.gross_tonnage for each vessel in fleet)
  ATF_base ← lookup_ATF_rate_table(total_GT)
  # Rate table (graduated by GT band):
  #   Up to 500 GT: ₱1.50/GT (minimum)
  #   501–2,000 GT: ₱X.XX/GT
  #   2,001–10,000 GT: ₱Y.YY/GT
  #   Above 10,000 GT: ₱Z.ZZ/GT
  # Exact rates per MC 2008-05; updated by MC GC-2026-01

  late_days ← max(0, payment_date - annual_deadline)
  late_penalty ← if late_days > 0: ATF_base × 0.25 (+ per-day component per MC 120)
  Total_ATF ← ATF_base + late_penalty

  Per vessel CPR renewal fee ← separate computation from MC GC-2026-01

Outputs:
  - Annual tonnage fee per vessel class
  - Fleet aggregate ATF
  - Late penalty (if applicable)
  - CPR/CO renewal fees
  - Total annual MARINA compliance cost
```

**Who currently does this:** MARINA-registered shipping companies compute this manually or via their in-house accounting teams. Small domestic ferry/cargo operators rely on MARINA regional offices for computation. No self-service calculator exists.

**Market size:** ~50,000+ registered domestic vessels (Class A–I across all regions); ~5,000–10,000 commercial vessel operators.

**Professional cost:** Maritime law firms and ship management companies include ATF computation in annual retainer services (₱50,000–₱300,000/year for full compliance management of a small fleet).

**Pain indicators:**
- Operators with mixed fleets (multiple classes, multiple GT bands) face graduated fee computation across multiple vessels
- Late payment penalties add 25%+ to ATF; many small operators miss the annual deadline
- Fleet changes (vessel additions, deletions) require pro-rated ATF computations — no official tool

**Computability:** Fully deterministic — ATF table is a graduated rate schedule from MC 2008-05/2008-07. Late penalty rules are defined in MC 120. All inputs (GT, vessel class, dates) are known quantities.

**Opportunity score estimate: 3.20**
- Market (3): 5,000–10,000 commercial operators (significant but narrower than seafarer-facing domains)
- Moat (3): Ship management companies handle this; no self-service alternative
- Computability (5): Fully deterministic from MC fee tables
- Pain (3): Late penalty is painful; core computation is manageable with a rate table

---

## Cross-Cutting Observations

### The STCW Certification Pathway: A Career-Long Compliance Machine

Filipino seafarers have the most complex certification lifecycle of any professional group in the country: every 5 years, multiple certificates expire concurrently (BST, ATFF, PSCRB, GMDSS), each requiring a different refresher course at a different accredited training center with different scheduling lead times. The COC revalidation adds sea service proof, updated PEME medical, and refreshed photography. A Master Mariner managing this across a career (30+ years) will go through 6+ complete certificate cycles, each triggering 5–10 distinct document submissions. A unified STCW Lifecycle Dashboard combining Domains 1+2+3 is the "inheritance engine equivalent" for maritime compliance:

- Inputs: {current_rank, certificates_held_with_dates, sea_service_log, target_rank, deployment_date}
- Outputs: {eligibility_for_promotion, sea_service_gap, expiring_certificates, required_training_sequence, total_cost, urgency_flags}

### RA 12021 Creates New Pricing Regulation Opportunity

The Magna Carta of Filipino Seafarers (RA 12021, signed 2024) gives MARINA first-time authority to set maximum and minimum STCW training fees. This means training center fees — currently opaque and varying — will become regulated and thus fully deterministic once MARINA issues the implementing rules. This changes Domain 2 from "range-estimable" to "fully deterministic" upon implementation, significantly raising the computability score.

### Pinoy Seafarers' Facebook Communities as Pain Signal

Facebook groups for Filipino seafarers (estimated 500K+ combined membership) are dominated by certification questions: "Am I eligible for Master?", "What courses do I need before I can apply for OIC-NW?", "How much does the whole process cost?". This organic demand, at scale, is unmet by any existing tool — government or commercial.

### Training Center Market Fragmentation

Over 200 MARINA-accredited maritime training institutions exist as of December 2025 (per MARINA's published directory). Each sets its own prices (within RA 12021 forthcoming limits). Training center selection optimization (cost, scheduling, location) is a secondary opportunity within Domain 2.

---

## Sources

- [MARINA STCW Administration Office](https://stcw.marina.gov.ph/)
- [STCW Documentary Requirements for COC](https://stcw.marina.gov.ph/wp-content/uploads/2016/02/DOCUMENTARY-REQUIREMENTS-COC.pdf)
- [STCW Qualification Requirements for Theoretical Examination](https://stcw.marina.gov.ph/wp-content/uploads/2016/02/Qualification-Requirements-for-Theoretical-Examination.pdf)
- [Deck Management Level Qualification Requirements (MARINA)](https://stcw.marina.gov.ph/wp-content/uploads/2016/02/Deck-Management-Level.pdf)
- [RA 9295 (Domestic Shipping Development Act) — lawphil.net](https://lawphil.net/statutes/repacts/ra2004/ra_9295_2004.html)
- [MARINA MC 2013-02 — Revised Rules for Ship Registration](https://marina.gov.ph/wp-content/uploads/2018/06/MC-2013-02.pdf)
- [MARINA Memorandum Circulars Page](https://marina.gov.ph/memorandum-circulars/)
- [MARINA Annex E — Schedule of Fees and Charges (Vessel Registration)](https://marina.gov.ph/wp-content/uploads/2019/08/ANNEX-E-Fees-and-Charges-FPMI-Final-1-converted.pdf)
- [Philippine News Agency — MARINA slashes fees for 2 seafarer certifications](https://www.pna.gov.ph/articles/1174552)
- [Philippine News Agency — Deployment of PH seafarers all-time high in 2023](https://pco.gov.ph/news_releases/deployment-of-ph-seafarers-all-time-high-in-2023-dmw/)
- [MARINA 2023 Statistical Report](https://marina.gov.ph/wp-content/uploads/2024/11/2023-MARINA-Statistical-Report.pdf)
- [PNTC Colleges — STCW Mandatory Training Courses](https://pntc.edu.ph/stcw-courses/)
- [STCW Circular 2018-02 — List of Mandatory Training Courses](https://stcw.marina.gov.ph/wp-content/uploads/2016/02/Annex-I_-List-of-STCW-Mandatory-Training-Courses.pdf)
- [Wallem Maritime — Guide to Securing SID and SRB](https://crewing.wallem.com.ph/articles/your-essential-guide-to-securing-your-sid-and-srb)
- [MARINA SID/SRB Online Appointment System](https://sidsrb.marina.gov.ph/)
- [ITF — Seafarers and illegal recruitment fees (2024 Insights)](https://ihrb-org.files.svdcdn.com/production/assets/uploads/briefings/Seafarers-and-illegal-recruitment-fees-2024-insights.pdf)
