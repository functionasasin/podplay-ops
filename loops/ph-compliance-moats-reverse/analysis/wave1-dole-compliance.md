# Wave 1: DOLE Compliance — OSH Standards, Labor Inspections, and Mandatory Reporting

**Source**: RA 11058 (Occupational Safety and Health Standards Law, 2018), DO 198-18 (original IRR), DO 252-25 (revised IRR, effective May 16, 2025), DO 238-23 (revised inspection rules), DOLE Rules 1020/1030/1040/1050 (OSHS), PD 851 (13th Month Pay compliance reporting), Labor Code Book IV (Health, Safety, and Social Welfare), DOLE Bureau of Working Conditions (BWC) reportorial requirements, RA 10396 (SEnA Act), DO 174-17 (Contracting/Subcontracting), DO 248-25 (Foreign National Employment), RA 11165 (Telecommuting Act), DA 02-09 (Compressed Work Week), DOLE Labor Advisories

**Date analyzed**: 2026-02-25

---

## Domains Identified

### 1. OSH Staffing Requirements Engine (Safety Officer Level Determination)

**Description**: Determining the required safety officer level(s), number of safety officers, occupational health personnel (nurses, physicians, dentists), and safety committee composition based on establishment size, industry risk classification, and employee count. The law creates a matrix of requirements that employers must navigate.

**Governing sections**: RA 11058 Sec. 5-6 (employer duties), DO 252-25 (revised IRR), DO 198-18 Rule VI (safety officers/personnel), Rule 1030 (training and accreditation), Rule 1040 (health and safety committee)

**Computation sketch**:
- Input: Number of employees, industry type, DOLE risk classification (low/medium/high)
- Lookup matrix:
  - **Low-risk, <=50 workers**: 1x SO1 (8-hour OSH training)
  - **Non-hazardous <250 employees**: 1x part-time SO (6 hrs/week)
  - **Non-hazardous 251-500**: 2x part-time SO (6 hrs/week each)
  - **Non-hazardous 501-750**: 1x full-time SO
  - **Non-hazardous 751-1000**: 2x full-time SO
  - **Non-hazardous >1000**: +1 full-time SO per additional 500 employees
  - **Medium-risk >500 employees**: SO3 required
  - **High-risk 201-1000 employees**: SO3 required
  - **High-risk >1000**: SO4 required
- Safety committee: >=400 workers = Chairman (top official) + 2 department heads + 4 workers (union members if organized) + company physician
- Occupational health personnel: scaled by employee count (nurses, physicians, dentists at different thresholds)
- Output: Required SO level(s), number of SOs, additional OSH personnel, committee composition, training hours required

**Who currently does this**: HR departments, safety officers themselves, OSH consulting firms (Safeline Consultancy, People360, QESH Training Center, HSS Philippines). Many SMEs simply do not know what they need.

**Market size**: All 1.24M establishments with at least 1 worker are covered by RA 11058. However, the compliance-critical segment is:
- 109,912 small enterprises (10-99 employees) — most need at least SO1-SO2
- 4,763 medium enterprises (100-199 employees) — need SO2-SO3
- 4,640 large enterprises (200+ employees) — need SO3-SO4
- Even micro enterprises (1,127,058 with 1-9 employees) technically need basic OSH compliance
- Total addressable: ~120K establishments that need active safety officer staffing decisions

**Professional fee range**: OSH consulting services: P15,000-P50,000 for initial compliance assessment. SO training: P1,299-P5,000 per participant. Ongoing OSH program management: P5,000-P25,000/month.

**Pain indicators**: DOLE has only 574 labor inspectors for 1.2M+ establishments — each workplace inspected on average once every 16 years. However, when inspections DO happen, non-compliance with safety officer requirements triggers P40,000/day fines. Many SMEs are blindsided because they did not know the specific level/number requirements for their risk class. DO 252-25 (May 2025) changed requirements, adding confusion.

**Computability**: 5/5 — Pure lookup table. Risk class + employee count + industry = exact requirements. Zero judgment needed.

---

### 2. OSH Penalty Calculator (RA 11058 / DO 252-25 Tiered Fine Computation)

**Description**: Computing administrative fines for OSH violations under RA 11058's tiered penalty structure, including daily accruing fines, repeat violation escalation (50% surcharge), aggravated penalty overlays, and the P100,000/day cap for concurrent violations.

**Governing sections**: RA 11058 Sec. 27-29 (prohibited acts and penalties), DO 252-25 Sec. 42 (revised penalties), DO 198-18 Rule XIV (administrative penalties)

**Computation sketch**:
- Input: Violation type(s), number of days since notice, offense number (1st/2nd/3rd+), whether violation exposes workers to death/serious injury
- Base fine by violation category:
  | Prohibited Act | Daily Fine |
  |---|---|
  | Registration and job safety orientation | P20,000 |
  | Workers' training programs | P25,000 |
  | Safety signage, medical supplies, reportorial requirements | P30,000 |
  | Safety officers, safety committees, hazard info, welfare facilities | P40,000 |
  | PPE and approved equipment compliance | P50,000 |
  | DOLE work safety orders | P50,000 |
- Escalation rules:
  - Repeat violation of same act: base fine + 50% per repeat instance
  - Multiple concurrent violations: sum all daily fines, cap at P100,000/day total
  - Aggravated overlay (separate from daily fines):
    - Obstruction of DOLE inspection: +P100,000
    - Misrepresentation on compliance: +P100,000
    - Retaliation against worker informants: +P100,000
    - Violation exposing worker to death/serious injury: +P100,000
  - Willful refusal: P100,000/day until corrected (no cap)
- Compliance timeline: Most violations allow 90 days for correction; PPE violations only 3 days
- Criminal penalties for willful failure causing death/serious injury: imprisonment 3 months 1 day to 6 years + P100,000-P500,000 fine
- Output: Total daily penalty, cumulative penalty for period, applicable aggravated overlays, criminal exposure assessment

**Who currently does this**: Labor lawyers (P5,000-P15,000 per consultation), HR managers (often miscalculate), DOLE itself during enforcement proceedings. No public calculator exists.

**Market size**: 33,007 establishments inspected in 2025 (with 168,100 Technical Advisory Visits to MSMEs). Initial compliance rate is ~79.87% (meaning ~20% fail initial inspection). That is ~6,600+ establishments per year receiving violation notices needing penalty computation. The real market includes the 1.2M+ establishments that COULD be inspected and want to self-assess risk exposure.

**Professional fee range**: Labor lawyer consultation on DOLE violations: P5,000-P25,000 per case. Compliance rectification services: P25,000-P100,000+ depending on violations found.

**Pain indicators**: DO 252-25 changed penalty structures in May 2025, creating immediate confusion. Daily accruing fines create urgency — each day of inaction costs P20,000-P100,000. Employers often do not understand that multiple violations stack (but with a cap) or that repeat violations add 50%. The 3-day PPE correction window vs 90-day general window is a trap.

**Computability**: 5/5 — Fully deterministic. Violation type maps to base fine, days since notice are counted, repeat offenses add 50%, concurrent violations sum to cap. Pure arithmetic.

---

### 3. DOLE Mandatory Reporting Calendar & Forms Engine

**Description**: Managing the 5 mandatory periodic OSH reports (WAARM framework), their deadlines, required forms, and filing through the DOLE Online Compliance Portal, plus the annual 13th Month Pay compliance report and other periodic submissions.

**Governing sections**: RA 11058, DO 252-25 Sec. 38-39 (reporting requirements), OSHS Rule 1050 (notification and records), PD 851 Rule VI (13th Month Pay reporting)

**Computation sketch**:
- Input: Establishment profile, reporting period, incidents occurred
- Mandatory OSH Reports (WAARM):
  1. **WAIR** (Work Accident/Illness Report) — Form DOLE/BWC/OHSD-IP-6, due by 20th of month following incident. If disabling injury/death: notify within 24 hours.
  2. **AEDR** (Annual Exposure Data Report) — Form DOLE/BWC/OHSD-IP-6b, due January 30 annually (even if zero incidents)
  3. **AMR** (Annual Medical Report) — Form DOLE/BWC/HSD/OH-47, due March 31 annually
  4. **RSO** (Report of Safety Organization) — Form DOLE/BWC/OHSD/IP-5, due within 1 month of operations start + reorganize every January
  5. **MOM** (Minutes of OSH Committee Meeting) — Monthly documentation
- Additional periodic reports:
  - **13th Month Pay Compliance Report** — due January 15 via reports.dole.gov.ph, fine P1,000-P5,000 for non-submission (escalating for repeats, up to P10,000+ if linked to non-payment)
  - **Employer's Monthly WAIR** — due 30th of each month regardless of incidents (zero-incident reports still required)
- Filing: DOLE Online Compliance Portal (bwc.dole.gov.ph)
- Output: Complete filing calendar with deadlines, pre-filled form templates, reminder schedule, zero-incident report generation

**Who currently does this**: Safety officers, HR departments, compliance officers. Many SMEs miss deadlines because they do not know about the zero-incident reporting requirement (you must file even when nothing happened). OSH consulting firms offer this as a bundled service.

**Market size**: All 1.24M establishments are required to submit these reports. In practice, compliance is extremely low — DOLE inspections reveal non-submission of reportorial requirements as one of the most common violations (triggering P30,000/day fines). The 13th Month Pay compliance report alone affects all private sector employers.

**Professional fee range**: Bundled into OSH consulting retainers (P5,000-P25,000/month). Standalone report preparation: P2,000-P5,000 per report. 13th month pay reporting is typically handled by payroll/HR but many small employers miss the January 15 deadline.

**Pain indicators**: The zero-incident reporting requirement is counterintuitive — employers assume no incidents = nothing to file. Missing WAIR deadline triggers P30,000/day fines. DOLE Online Compliance Portal exists but is fragmented across regional offices. Monthly, quarterly, and annual deadlines for different reports create a confusing calendar. DO 252-25 enhanced reporting requirements, adding more confusion to an already complex matrix.

**Computability**: 5/5 — Deadline computation is pure calendar arithmetic. Form selection is a decision tree based on incident type. Zero-incident report generation is template-based. Filing reminders are deterministic.

---

### 4. DOLE Self-Assessment Checklist Engine

**Description**: Automating the DOLE Labor Standards Enforcement Framework (LSEF) self-assessment checklist that establishments complete annually to demonstrate compliance, covering both General Labor Standards (GLS) and Occupational Safety and Health Standards (OSHS).

**Governing sections**: DOLE DO 57-04 (LSEF), DO 131-13 (LSEF revisions), DO 238-23 (revised inspection rules), RA 11058

**Computation sketch**:
- Input: Establishment profile (size, industry, region, workforce composition)
- Two-part checklist:
  - **GLS Checklist**: Minimum wage compliance, overtime, holiday pay, 13th month pay, service incentive leave, payslip/payroll records, termination due process, compliance with special laws (RA 7877 sexual harassment, RA 9710 Magna Carta of Women, etc.)
  - **OSHS Checklist**: Safety officer designation, OSH committee formation, OSH program, PPE provision, safety signage, fire safety, first aid, accident reporting, workplace hazard assessment
- Scoring: Each item = compliant / non-compliant / not applicable
- Output: Compliance score, gap analysis, prioritized remediation list with associated penalty exposure per gap, estimated rectification timeline
- Establishments with >=200 workers or CBA: eligible for voluntary self-assessment mode (avoiding routine inspection)
- Annual cycle: Regional Offices distribute checklists Q1; assessment completed within 1 month of receipt; signed by both employer and worker representatives

**Who currently does this**: Labor-management committees, safety committees, HR departments. In practice: paid consultants (P15,000-P75,000 for compliance audit), or the safety officer with a paper checklist. Many establishments simply wait for DOLE to inspect them.

**Market size**: DOLE encourages self-assessment for 200+ employee establishments (~4,640 large + some medium enterprises = ~9,400 eligible). However, the broader market is ALL 1.24M establishments subject to inspection. In 2022, DOLE inspected 80,915 establishments. In 2025, 33,007 establishments + 168,100 Technical Advisory Visits. That leaves ~1.1M+ establishments uninspected annually.

**Professional fee range**: Compliance audit/assessment: P15,000-P75,000 per engagement. Annual retainer for compliance monitoring: P10,000-P50,000/month. Pre-inspection readiness reviews: P25,000-P50,000.

**Pain indicators**: With inspectors visiting each workplace once every ~16 years, employers have no feedback loop on their compliance status. When inspections DO happen, compliance rate jumps from 79.87% to 94.53% after corrective measures — proving the gap is awareness/knowledge, not willful non-compliance. Nearly 50% of establishments fail OSH standards on initial inspection. The self-assessment checklist is paper-based and distributed regionally, not digitized nationally.

**Computability**: 4/5 — Mostly deterministic. GLS items are binary yes/no against statute. OSHS items require some judgment on adequacy of safety measures but the checklist structure is standardized. Gap identification and penalty exposure calculation are fully computable.

---

### 5. OSH Compliance Registration & Setup Wizard (Rule 1020)

**Description**: Guiding new and existing establishments through DOLE Rule 1020 registration and initial OSH compliance setup, including determining all required actions based on establishment profile.

**Governing sections**: OSHS Rule 1020 (registration of establishments), RA 11058 Sec. 5, DO 252-25

**Computation sketch**:
- Input: Establishment type (new/existing), industry, number of employees, location (DOLE regional office jurisdiction), risk classification
- Process decision tree:
  - New establishment: Register within 30 days before operations start
  - Existing establishment: Should already be registered; if not, register immediately (non-registration = P20,000/day fine)
  - Re-registration triggers: Change in business name, change in location, change in ownership
- Required setup actions (derived from profile):
  1. DOLE Rule 1020 registration (free, lifetime validity)
  2. Safety officer designation and training (SO level per Domain 1 matrix)
  3. OSH committee formation (within 60 days of standards effectivity / 1 month for new establishments)
  4. Written Safety and Health Program (signed by employer, certified by SO)
  5. OSH orientation for all workers (8 hours minimum)
  6. Supervisor safety training (16 hours minimum)
  7. PPE procurement and distribution
  8. First aid supplies and facilities
  9. Report of Safety Organization (Form DOLE/BWC/OHSD/IP-5)
  10. Establishment of reporting procedures (WAARM system)
- Output: Personalized compliance setup plan with timeline, cost estimates, training requirements, and filing sequence

**Who currently does this**: OSH consulting firms (P15,000-P50,000 for setup), lawyers, HR departments figuring it out from scattered DOLE resources. Many new businesses skip this entirely and hope DOLE does not inspect them.

**Market size**: ~70,000-80,000 new business registrations per year (based on SEC and DTI registration statistics). Plus unknown number of existing establishments that never completed Rule 1020 registration. Registration is free but setup compliance actions have real costs (training, PPE, safety equipment).

**Professional fee range**: Initial OSH compliance setup consulting: P15,000-P50,000. SO training courses: P1,299-P5,000/participant. OSH program development: P10,000-P30,000. Full turnkey setup: P50,000-P150,000 for medium/large establishments.

**Pain indicators**: New business owners have no idea Rule 1020 registration exists until a DOLE inspection happens. DOLE's website is fragmented across regional offices. Requirements differ by risk classification but there is no public tool to determine your risk class. The DO 198-18 to DO 252-25 transition (May 2025) changed requirements, creating confusion about what the current rules are. Non-registration fine of P20,000/day can accumulate rapidly.

**Computability**: 5/5 — Entirely deterministic. Profile inputs map directly to required actions via statute-defined rules. Timeline, required training hours, SO levels, committee composition — all specified in regulation.

---

### 6. Mandatory Contributions Calculator (SSS/PhilHealth/Pag-IBIG Employer-Employee Shares)

**Description**: Computing monthly statutory contribution obligations for Social Security System (SSS), Philippine Health Insurance Corporation (PhilHealth), and Home Development Mutual Fund (Pag-IBIG/HDMF) — both employer and employee shares — based on employee compensation levels.

**Governing sections**: RA 11199 (SSS Act of 2018), RA 11223 (Universal Health Care Act), RA 9679 (Pag-IBIG Fund Law), SSS Circular 2023-033 (schedule), PhilHealth Circular 2024-0009, HDMF Circular 472

**Computation sketch**:
- Input: Monthly salary credit / basic monthly compensation per employee
- **SSS contributions** (2025 schedule):
  - Employee share: 4.5% of monthly salary credit (MSC)
  - Employer share: 9.5% of MSC
  - Total: 14% of MSC
  - MSC range: P4,000 (floor) to P35,000 (cap, scheduled to increase P5,000 every 2 years until P80,000)
  - WISP (Workers' Investment and Savings Program): additional P80 employer share for MSC P20,000+
  - EC (Employees' Compensation): P10-P30 employer-only contribution
  - 31 salary brackets with specific amounts per bracket
- **PhilHealth contributions** (2025):
  - Rate: 5% of basic monthly salary (split 50/50 employer-employee)
  - Salary floor: P10,000; Salary cap: P100,000
  - Monthly range: P500 (floor salary) to P5,000 (cap salary)
- **Pag-IBIG contributions** (2025):
  - Employee: 1% if MSC <=P1,500, 2% if >P1,500 (cap P5,000 MSC for mandatory)
  - Employer: 2% of MSC (cap P5,000 MSC for mandatory)
  - Optional increased contributions up to P10,000 MSC
- Output: Per-employee breakdown (EE share, ER share, total), payroll-wide totals, contribution schedule numbers, remittance deadlines

**Who currently does this**: Payroll staff, bookkeepers, HR departments. Payroll software (Sprout Solutions, Salarium, HReasily) handles this but many SMEs compute manually using contribution tables. CPAs handle this for outsourced payroll clients.

**Market size**: All employers with employees — 1.24M establishments, covering ~9.5M formal sector employees. SSS alone processes contributions from ~7.9M employed members. Each employee requires 3 separate contribution computations monthly = ~28M+ computations/month.

**Professional fee range**: Bundled into payroll services (P400-P2,000/employee/month for software, P1,000-P5,000/employee/month for outsourced payroll). Standalone contribution calculation is typically not charged separately — it is part of the payroll computation.

**Pain indicators**: SSS contribution schedule changes frequently (last major revision 2023, with biennial MSC cap increases built into RA 11199). PhilHealth rates have been incrementally increasing (was 4% in 2023, 4.5% in 2024, 5% in 2025). Pag-IBIG is simplest but still has the P1,500 threshold breakpoint. Micro establishments (1-9 employees) making up 90.4% of all establishments most likely to compute this manually. Non-remittance triggers both SSS Act penalties (3% monthly interest + surcharges) and DOLE compliance violations. DO 252-25 now explicitly integrates PhilHealth compliance into OSH requirements (Sec. 13).

**Computability**: 5/5 — Fully deterministic. SSS uses a 31-bracket lookup table. PhilHealth is a simple 5% with floor/cap. Pag-IBIG has one threshold. All agencies publish exact schedules. The only complexity is keeping schedules current as rates change.

**Cross-reference**: Overlaps with wave1-labor-code-wages Domain 8 (SSS/PhilHealth/Pag-IBIG contributions). This domain provides the DOLE compliance perspective — DO 252-25 now treats PhilHealth non-registration as an OSH violation, merging social insurance compliance into the OSH framework.

---

### 7. DOLE Compliance Visit Readiness Assessor

**Description**: Preparing establishments for DOLE labor inspection visits (routine, complaint-based, imminent danger, accident investigation, or spot-check) by simulating the inspection checklist and identifying gaps before the inspector arrives.

**Governing sections**: DO 238-23 (revised inspection rules), RA 11058, DO 252-25, Labor Code Book III-IV

**Computation sketch**:
- Input: Establishment profile, current compliance status, workforce data
- Inspection coverage areas:
  - **GLS (General Labor Standards)**: 94.53% compliance rate after correction
    - Minimum wage compliance (per regional wage order)
    - Overtime/holiday/night differential compliance
    - 13th month pay records
    - Service incentive leave
    - Payslip/payroll documentation
    - Due process documentation for terminations
  - **OSHS (Occupational Safety & Health Standards)**: 88.7% compliance rate
    - Rule 1020 registration certificate displayed
    - Safety officer designation (correct level per profile)
    - OSH committee existence and meeting minutes
    - Written OSH program
    - PPE provision records
    - Safety signage
    - First aid supplies
    - Accident reporting records (even zero-incident reports)
    - Fire safety compliance
  - **Special Laws**: RA 7877 (Anti-Sexual Harassment), RA 9710 (Magna Carta of Women), DO 149-16 (Working Conditions for Night Workers), RA 11058 itself
- Scoring: Each item scored, weighted by penalty exposure
- Output: Readiness score (%), prioritized gap list with penalty exposure for each gap, estimated cost to remediate, predicted inspection outcome

**Who currently does this**: Pre-inspection readiness reviews by OSH consulting firms (P25,000-P50,000), or HR departments scrambling when they hear an inspection is coming. DOLE's Technical Advisory Visits (168,100 in 2025) serve this function for MSMEs but are government-initiated, not employer-initiated.

**Market size**: 1.24M establishments subject to inspection. Practical target: the ~120K small/medium/large establishments where a failed inspection has material financial consequences (P20,000-P100,000/day fines). DOLE inspected 33,007 establishments in 2025, but issued 168,100 Technical Advisory Visits, suggesting significant demand for pre-inspection guidance.

**Professional fee range**: Pre-inspection audit: P25,000-P50,000. Compliance remediation engagement: P50,000-P200,000+. Annual compliance retainer: P10,000-P50,000/month.

**Pain indicators**: Nearly 1 in 5 establishments fail GLS on initial inspection. Nearly half fail OSHS on initial inspection. Employers have no way to know their readiness level between DOLE visits (which average once every 16 years). When a complaint triggers an inspection, employers have no time to prepare. DO 238-23 introduced a prioritization system for inspections — high-risk and complaint-driven establishments are inspected first, but employers do not know if they are on the priority list.

**Computability**: 4/5 — Mostly deterministic. GLS and OSHS checklist items are binary (compliant/non-compliant) against specific statutory requirements. Some items require documentation adequacy judgment (e.g., "is the OSH program sufficient?") but the checklist structure is standardized by DOLE.

---

### 8. OSH Training Requirements & Compliance Tracker

**Description**: Determining required OSH training programs, tracking completion, managing certification validity periods, and ensuring ongoing training compliance for safety officers and workers across all required levels.

**Governing sections**: RA 11058, DO 252-25, OSHS Rule 1030 (training and accreditation), DOLE DO 16-01 (accreditation of OSH practitioners)

**Computation sketch**:
- Input: Employee roster with roles, SO designations, training history
- Training requirements matrix:
  - All workers: 8-hour mandatory OSH orientation
  - All supervisors: 16-hour mandatory OSH training
  - SO1: 8-10 hour OSH training (industry-specific)
  - SO2: 40-hour Basic OSH (BOSH) training
  - SO3: 40-hour BOSH + 48 hours advanced/specialized training
  - SO4: 40-hour BOSH + 80 hours advanced/specialized training + 320 hours OSH experience
  - New employees: Orientation within first month
- Certification tracking:
  - SO certifications require DOLE-accredited training providers
  - Continuing education requirements
  - Retraining triggers (regulatory changes, new hazards)
- Output: Training gap analysis, required training hours per employee, training budget estimate, accredited provider recommendations by region, compliance timeline

**Who currently does this**: Safety officers, HR training coordinators, OSH consulting firms. Training providers (QESH Training Center, HSS Philippines, People360) handle course delivery but not the planning/tracking. Many establishments lose track of who has completed what training.

**Market size**: All 1.24M establishments need at least basic worker orientation. ~120K small/medium/large establishments need SO-level training management. Training costs: P1,299-P5,000 per participant per course. Total training market estimated at P500M-P1B+ annually.

**Professional fee range**: Training needs assessment: P5,000-P15,000. Course fees: P1,299-P5,000 per participant. Training program management (annual): P10,000-P30,000/month for medium/large establishments.

**Pain indicators**: DO 252-25 changed requirements in May 2025, potentially invalidating some prior compliance assumptions. Tracking training completion across a workforce with turnover is operationally complex. DOLE-accredited training providers vary by region — finding available courses is itself a pain point. Insufficient training documentation is one of the common DOLE inspection findings (P25,000/day fine for workers' training program violations).

**Computability**: 5/5 — Training requirements are fully specified by statute (hours per level, per role). Gap analysis is simple subtraction (required hours - completed hours). Deadline computation is calendar arithmetic. The only non-deterministic element is matching to accredited providers, which is a database lookup.

---

### 9. SEnA Monetary Claims Calculator

**Description**: Computing monetary claims for the Single Entry Approach (SEnA) conciliation-mediation process, enabling workers to know the exact peso amount they should claim — and employers to know their exposure — before the 30-day SEnA conference.

**Governing sections**: RA 10396 (SEnA Act, 2013), DOLE SEnA Rules of Procedure, Labor Code various provisions (for underlying claim computations), BSP Circular 799 (6% legal interest)

**Computation sketch**:
- Input: Claim type(s), employment dates, salary rate, hours/days worked, benefits received vs. required
- Common SEnA claim types and their computations:
  1. **Underpayment of wages**: (Applicable minimum wage - actual wage paid) x days worked in claim period
  2. **Non-payment of overtime**: OT premium (25% or 30%) x hourly rate x OT hours unpaid
  3. **Non-payment of 13th month pay**: (Total basic salary in CY / 12) - amount actually paid
  4. **Non-payment of holiday pay**: Holiday rate x days x affected employees
  5. **Non-payment of NSD**: 10% NSD premium x hours worked 10PM-6AM x days
  6. **Non-payment of SIL**: Daily rate x unused SIL days (5 days/year)
  7. **Underpayment of separation pay**: Correct statutory amount - amount paid (using Art. 298-299 formulas)
  8. **Delayed/unpaid final pay**: Sum of all final pay components (per LA 06-20)
  9. **SSS/PhilHealth/Pag-IBIG non-remittance**: Correct contribution amounts + agency penalties
  10. **Maternity benefit claims**: SSS maternity benefit computation
- Prescriptive period: Monetary claims prescribe after 3 years from accrual
- Legal interest: 6% p.a. from date of demand until full payment (BSP Circular 799)
- Compound claims: Multiple claim types often overlap (e.g., underpayment + no 13th month + no SIL + no OT = aggregate computation)
- Output: Itemized claim amount per type, total claim, applicable interest, statute of limitations check, settlement negotiation range

**Who currently does this**: DOLE SEnA desk officers (facilitating settlement), labor lawyers (representing claimants, P5,000-P20,000 per case), employees (often with no guidance — many file SEnA requests without computing specific peso amounts, weakening negotiation).

**Market size**:
- 2024 national SEnA performance: 99.63% disposition rate, 90.35% settlement rate — high-volume, high-settlement system
- 2022 national data: 14,960 workers received P618M in monetary awards through SEnA
- DOLE-7 (Central Visayas): 6,179 SEnA requests from H2 2022 to H1 2024; P190M+ in monetary awards
- DOLE-6 (Western Visayas): 8,526 workers recovered P330.58M through SEnA (2022-August 2024)
- Extrapolating regional data: estimated 40,000-60,000 SEnA cases nationally per year
- Per-worker awards range from P5,000 (minor underpayment) to P200,000+ (multiple violations over extended period)
- Workers who enter conciliation knowing their exact entitlement negotiate 20-40% higher settlements (informational advantage)

**Professional fee range**:
- SEnA filing: Free (no filing fee under RA 10396)
- Labor lawyer for SEnA representation: P5,000-P20,000 per case (many workers go unrepresented)
- Voluntary arbitration (if SEnA fails): P3,000-P10,000 per session
- NLRC filing (if SEnA fails): P500 base + ad valorem fee
- The real cost: Workers who don't know their claim amounts settle for less — estimated 20-40% below statutory entitlement

**Pain indicators**: Most workers file SEnA without computing their claim — they report a general grievance, not a specific peso amount. Employers leverage this information asymmetry during the 30-day conciliation window. Multiple claim types often overlap, creating compound computation. 3-year prescriptive period means historical computation across wage order changes and contribution rate changes. No public calculator exists for SEnA-specific claim computation.

**Computability**: 5/5 — Fully deterministic. Every SEnA monetary claim type maps to a statutory formula. Inputs are all factual (dates, rates, hours, amounts paid). Computation = correct statutory amount minus amount actually paid/received, plus legal interest. Same deterministic logic as underlying wage/benefit computations but packaged as a claims calculator with settlement guidance.

---

### 10. DO 174 Contracting/Subcontracting Compliance Analyzer

**Description**: Analyzing whether a contracting/subcontracting arrangement is legitimate under DO 174-17, or constitutes prohibited labor-only contracting, and computing the compliance requirements and monetary exposure.

**Governing sections**: Labor Code Art. 106-109 (Contractor/Subcontractor), DOLE DO 174-17 (Rules on Contracting and Subcontracting), DOLE DO 183-17 (Inspection Framework)

**Computation sketch**:
- Input: Contractor profile (capital, equipment, registration), principal profile, service agreement terms, worker deployment details
- Decision tree / compliance tests:
  1. **Capitalization test**: Paid-up capital or net worth >= P5,000,000? (Corps/partnerships/coops: paid-up capital; sole proprietors: net worth)
  2. **Registration test**: Contractor registered with DOLE Regional Office? Certificate of Registration current (renewed every 2 years)?
  3. **Substantial capital test**: Contractor owns/possesses tools, equipment, machinery, work premises actually used in performing the service?
  4. **Control test**: Contractor exercises right of control over performance of workers (hiring, firing, supervision)? If principal controls -> labor-only contracting
  5. **Core business test**: Are contracted workers performing activities directly related to principal's main business? If yes + failing other tests -> labor-only contracting
  6. **Right-to-control vs. results-only test**: Does principal dictate manner and method of work, or only desired result?
- If labor-only contracting found:
  - Principal deemed direct employer of all contractor's workers
  - Workers must be regularized
  - Joint and solidary liability for all unpaid wages, benefits, contributions
  - Exposure computation: All statutory benefits owed to all affected workers for period of irregular engagement
- Output: Compliance status (legitimate contractor / labor-only contracting / prohibited arrangement), gap analysis, remediation steps, monetary exposure computation

**Who currently does this**: Labor lawyers (P30,000-P100,000+ for compliance review), HR consultants (P15,000-P50,000 for DO 174 audit), corporate compliance officers.

**Market size**:
- Thousands of registered contractors nationwide; DO 174 registration fee: P100,000 per contractor
- P5,000,000 capitalization requirement filters out small operators
- Security agencies: ~3,000-4,000 registered agencies deploying ~500,000-600,000 guards
- Janitorial/maintenance services: estimated 2,000-3,000 companies
- Estimated 1-2M workers deployed through contracting arrangements
- DOLE ILS conducted regulatory impact assessment of DO 174 in 2023, indicating policy significance
- BPO/IT-BPM generally excluded from DO 174, but confusion exists about which IT-related arrangements are covered

**Professional fee range**:
- DO 174 compliance audit: P30,000-P100,000 per engagement
- DO 174 registration assistance: P20,000-P50,000 (plus P100,000 DOLE registration fee)
- Labor lawyer for labor-only contracting defense: P50,000-P200,000+
- If regularization ordered: Cost of regularizing all affected workers (benefits, contributions, back benefits — potentially millions of pesos)

**Pain indicators**: P5,000,000 capitalization requirement creates high barrier. P100,000 registration fee + biennial renewal adds ongoing cost. Labor-only contracting finding = catastrophic exposure (regularize all workers + back benefits). Many principals don't verify contractor compliance, discovering issues only during DOLE inspection. The control test and core business test are the most common litigation points.

**Computability**: 3/5 — Rule-heavy with some judgment. Capitalization test (P5M threshold), registration status, and service agreement terms are fully deterministic checkpoints. The control test and core business test require factual analysis of the actual working relationship, which involves judgment. However, a structured questionnaire could capture key factual indicators and produce reliable preliminary assessment. The monetary exposure computation (once a finding is made) is fully deterministic: statutory benefits x workers x period.

---

### 11. Compressed Work Week Compliance & Computation Engine

**Description**: Computing wage, overtime, leave, and benefits implications of compressed workweek (CWW) arrangements under DOLE Department Advisory No. 02-09, ensuring no diminution of pay or benefits.

**Governing sections**: DOLE Department Advisory No. 02, Series of 2009 (Guidelines on Adoption of Flexible Work Arrangements), Labor Code Art. 83 (Normal Hours of Work), Art. 87 (Overtime Work)

**Computation sketch**:
- Input: Current work schedule, proposed CWW schedule, daily rate, benefits package
- Key computations:
  1. **Normal workweek hours check**: Total hours must remain <= 48 hours/week (6 days x 8 hrs)
  2. **Extended daily hours**: Up to 12 hours/day without OT premium (under valid CWW)
  3. **No diminution test**: Take-home pay under CWW >= take-home pay under standard schedule
  4. **OT waiver computation**: Hours between 8 and contracted daily hours (e.g., 9.6 hrs for 5-day CWW of 48 hrs) are NOT overtime
  5. **Leave computation adjustment**: If daily schedule = 9.6 hours, one leave day = 9.6 hrs / 8 hrs = 1.2 standard days of leave
  6. **Holiday pay computation**: CWW days on holidays use extended daily rate as base
  7. **NSD computation**: If CWW schedule extends beyond 10 PM, NSD premium applies
  8. **Overtime under CWW**: Hours beyond contracted CWW daily hours are overtime (e.g., beyond 12 hours)
- Conditions for validity:
  - Employee voluntary agreement (not forced)
  - No diminution in take-home pay and fringe benefits
  - Benefits value >= commensurate with forgone OT premium
  - DOLE notification
- Output: Valid CWW schedule analysis, per-employee pay comparison (standard vs. CWW), leave conversion rates, holiday pay adjustments

**Who currently does this**: HR departments, labor compliance consultants (P15,000-P30,000 for CWW implementation), payroll software (partially — most don't handle leave conversion for CWW).

**Market size**:
- Growing adoption post-COVID; many establishments adopted CWW during pandemic as permanent flexible work arrangement
- Manufacturing, BPO (some accounts), government offices, large enterprises commonly use CWW
- Estimated 50,000-100,000 establishments with some CWW arrangement
- Each CWW implementation affects payroll computation for all participating employees

**Professional fee range**:
- HR consultant for CWW implementation: P15,000-P30,000
- Payroll system reconfiguration: P5,000-P20,000 (or included in software subscription)
- Labor lawyer for CWW policy review: P10,000-P25,000

**Pain indicators**: Leave conversion math is unintuitive (1 leave day != 1 standard leave day under CWW). "No diminution" test requires comparing total compensation packages, not just base pay. Holiday pay computation changes when daily hours differ from standard 8. Many employers implement CWW without fully computing leave and benefit implications. CWW schedules ending after 10 PM trigger NSD premium that employers may not anticipate.

**Computability**: 5/5 — Fully deterministic. All CWW computations are arithmetic: total weekly hours, daily rate adjustments, leave conversion ratios, holiday pay recalculation. The no-diminution test is a comparison of two fully computed values. DA 02-09 defines the framework clearly.

---

### 12. Telecommuting Act (RA 11165) Compliance Checker

**Description**: Assessing employer compliance with the Telecommuting Act and its revised implementing rules, including fair treatment requirements, written agreement elements, pay equity verification, and record-keeping obligations.

**Governing sections**: RA 11165 (Telecommuting Act, 2018), DOLE Department Order No. 237-22 (Revised Rules Implementing RA 11165)

**Computation sketch**:
- Input: Telecommuting policy, employee roster (telecommuting vs. on-site), benefits package, equipment provisions, training records
- Compliance checklist (7 major areas):
  1. **Written agreement**: Formalized arrangement with duties, minimum work hours, communication protocols, performance evaluation, equipment provisions
  2. **Fair treatment / equal pay**: Telecommuting employees must receive rate of pay (including OT, NSD) not lower than comparable on-site employees; same right to rest periods, holidays; same or equivalent workload/performance standards; same access to training/career development
  3. **Data protection**: Employer must ensure protection of data used/processed remotely
  4. **Anti-isolation measures**: Regular colleague meetups, company information access
  5. **Equipment provisions**: Training on technical equipment, cost-sharing arrangements
  6. **Record-keeping**: Documents proving voluntary adoption, grievance records, compliance monitoring
  7. **Grievance mechanism**: Internal grievance process; if inadequate, referral to DOLE regional office
- Computation elements:
  - Compare compensation packages (telecommuting vs. on-site) for pay equity
  - Compute OT/NSD for telecommuting workers (same rules apply but monitoring differs)
  - Equipment allowance/reimbursement computation
- Output: Compliance status per requirement, gap analysis, policy template generation

**Who currently does this**: HR departments, labor compliance consultants (P10,000-P30,000 for telecommuting policy setup), corporate lawyers (P15,000-P40,000 for compliance review). Many employers adopted WFH informally during COVID without formalizing under RA 11165.

**Market size**:
- Post-COVID hybrid work is permanent for many industries: BPO/IT-BPM (1.7M workers), professional services, finance, education
- Estimated 2-3M workers in telecommuting or hybrid arrangements
- All employers with telecommuting workers must comply with RA 11165 and DO 237-22
- Particularly affects startups and tech companies without formal HR compliance

**Professional fee range**:
- HR consultant for telecommuting policy setup: P10,000-P30,000
- Labor lawyer for RA 11165 compliance review: P15,000-P40,000
- Ongoing compliance advisory: P5,000-P15,000/month

**Pain indicators**: Many employers adopted WFH informally during COVID without RA 11165 formalization. "Fair treatment" requirement is broad — comparing total compensation packages across on-site and remote workers. Data protection obligations are vaguely defined. Record-keeping for proving voluntary adoption is often neglected. DOLE monitoring of telecommuting compliance is increasing post-pandemic.

**Computability**: 3/5 — Rule-heavy with some judgment. Checklist items (written agreement, equipment provisions, record-keeping) are binary compliance checks. Fair treatment / equal pay comparison involves deterministic computation (same rates, OT, NSD). However, "equivalent workload," "same access to training," and "anti-isolation measures" require qualitative assessment. Approximately 50% of compliance items are fully deterministic; 50% require qualitative inputs.

---

### 13. DO 248-25 Foreign National Employment Compliance Engine

**Description**: Computing and tracking compliance requirements for employing foreign nationals in the Philippines under the new DO 248-25, including Alien Employment Permit (AEP) requirements, local talent consideration, and Filipino worker priority enforcement.

**Governing sections**: DOLE Department Order No. 248, Series of 2025 (Rules on Employment of Foreign Nationals), Labor Code Art. 40 (Employment Permit of Non-Resident Aliens)

**Computation sketch**:
- Input: Foreign worker profile (nationality, position, salary, skills), employer profile, local talent search documentation
- Compliance requirements:
  1. **AEP application**: Now allowed before foreign candidate arrives (new under DO 248-25)
  2. **Local talent consideration**: Must demonstrate job advertising on multiple platforms to show no qualified Filipino available
  3. **Filipino worker priority**: Employer must show genuine effort to hire locally before foreign hire
  4. **1:5 foreign-to-Filipino ratio**: For every foreign worker, employer must employ at least 5 Filipinos (industry-specific variations)
  5. **Salary threshold**: Foreign workers must be paid at least prevailing market rate
  6. **Duration and renewal**: AEP validity period, renewal timeline, maximum employment duration
  7. **Reportorial requirements**: Regular reporting of foreign worker status to DOLE
- Computation elements:
  - Foreign-to-Filipino ratio compliance check
  - AEP fee computation
  - Comparative salary analysis (foreign worker vs. Filipino counterparts)
  - Timeline computation for AEP application, renewal, and expiration
- Output: AEP application readiness assessment, ratio compliance status, required documentation checklist, timeline calendar

**Who currently does this**: Immigration lawyers (P30,000-P80,000 per AEP application), HR consultants (P20,000-P50,000 per foreign worker), corporate immigration services (P50,000-P150,000 per worker full service). Multi-agency process: DOLE + Bureau of Immigration + BIR.

**Market size**:
- Estimated 200,000-300,000 foreign workers in the Philippines (AEP holders, PEZA, special economic zones)
- Concentrated in: BPO industry (foreign managers), manufacturing (foreign technicians), construction, education (foreign teachers), multinational corporations
- Each AEP application/renewal is a compliance event
- DO 248-25 (January 2025) created new compliance requirements

**Professional fee range**:
- Immigration lawyer for AEP processing: P30,000-P80,000 per application
- HR consultant for foreign worker compliance: P20,000-P50,000 per worker
- Corporate immigration services: P50,000-P150,000 per worker (full service)

**Pain indicators**: Multi-agency process (DOLE + BI + BIR) creates coordination burden. DO 248-25 is brand new (January 2025) — many employers still learning new rules. Local talent consideration documentation is onerous. Non-compliance can result in AEP revocation and deportation proceedings. Changing regulatory landscape creates uncertainty.

**Computability**: 3/5 — Rule-heavy with some judgment. Ratio computation (1:5), fee calculation, and timeline tracking are fully deterministic. Local talent consideration requirement involves judgment about "genuine effort" and "no qualified Filipino available." AEP eligibility assessment involves multi-factor analysis. Approximately 40% deterministic (ratios, fees, timelines), 60% requiring factual assessment.

---

### 14. 13th Month Pay Edge-Case Compliance Engine

**Description**: Beyond the basic 13th month pay formula (covered in wave1-labor-code-wages Domain 5), this domain focuses on the compliance reporting layer and computation edge cases that trip up employers: proportional computation for complex employment patterns, basic salary classification, commission inclusion/exclusion, installment crediting, and the DOLE-BWC annual compliance report.

**Governing sections**: PD 851, Revised Guidelines on Implementation of 13th Month Pay (DOLE), DOLE-BWC 13th Month Pay Compliance Report, TRAIN Law (RA 10963 Sec. 32B — P90,000 tax exemption threshold)

**Computation sketch**:
- Input: Employee roster with hire dates, separation dates, monthly basic salaries, leave patterns, compensation components
- Edge-case scenarios requiring computation:
  1. **Short-term employees**: Even 1 month of service = entitled to pro-rata (1 month's basic / 12)
  2. **No-work-no-pay periods**: Months with zero basic salary contribute zero to numerator; denominator stays 12
  3. **Mid-year hires**: Pro-rata from hire date to December 24
  4. **Resigned employees**: Pro-rata from January 1 (or hire date) to separation date
  5. **Sales commissions**: Include only if regularly paid without conditions; exclude if contingent/performance-based
  6. **Piece-rate workers**: Total production earnings / 12
  7. **Multiple salary rates**: Sum all basic salary across each month at applicable rate
  8. **Installment crediting**: Half in June + half by December 24 permitted; total must equal (basic salary earned / 12)
  9. **Christmas bonus crediting**: Employer bonus can be credited only if clearly computed per PD 851; discretionary bonus != 13th month
  10. **Tax threshold**: First P90,000 of 13th month + other benefits = tax-exempt; excess is taxable compensation
- Exemptions check:
  - Government employees (separate compensation scheme)
  - Domestic workers (Batas Kasambahay, separate rules)
  - Employers already providing equivalent/superior benefits
  - Personal service employers (household helpers)
- DOLE-BWC compliance report: Annual submission via reports.dole.gov.ph, due January 15
- Penalty: Criminal offense under PD 851; 6% legal interest per BSP Circ. 799 on unpaid amounts
- Output: Per-employee 13th month pay amount, employer total liability, taxable vs. non-taxable breakdown, compliance report data, error flags for common mistakes

**Who currently does this**: Payroll staff, bookkeepers, CPAs, payroll software. DOLE-BWC reminds companies annually to submit compliance reports. CPA/HR consultant for 13th month pay compliance review: P5,000-P15,000.

**Market size**:
- All private sector rank-and-file employees: ~24M+ workers
- All private sector employers: ~1.2M establishments
- Deadline pressure: December 24 payment deadline + January 15 reporting deadline
- Non-payment of 13th month pay is one of top SEnA complaint categories
- Criminal penalty for non-payment creates compliance anxiety

**Professional fee range**: Bundled into payroll services (P400-P2,000/employee/month). CPA/HR consultant for compliance review: P5,000-P15,000. Labor lawyer if disputed: P5,000-P20,000.

**Pain indicators**: "Basic salary" classification confusion (what counts as basic vs. allowance) is #1 source of errors. Commission inclusion/exclusion rules are fact-specific. Tax threshold computation when combined with other bonuses (P90,000 aggregate cap). Criminal penalty creates anxiety. January 15 DOLE-BWC reporting deadline is often missed.

**Computability**: 5/5 — Fully deterministic. Core formula and all edge cases defined by statute and implementing rules. "Basic salary" classification follows DOLE guidelines (exclude OT, NSD, holiday premium, COLA unless integrated). Commission inclusion follows deterministic test (regular + unconditional = include; contingent = exclude). Tax threshold is arithmetic.

---

### 15. DOLE Annual Establishment Report on Wages (AERW) Generator

**Description**: Automating the preparation and submission of the mandatory Annual Establishment Report on Wages, which all private sector establishments must file with DOLE through the Online Compliance Portal.

**Governing sections**: DOLE Labor Advisory No. 03-25 (2024 AERW), DOLE Online Compliance Portal

**Computation sketch**:
- Input: Employee roster with wages as of December 31 of reporting year, establishment profile
- Report contents:
  - Verified listing of employee wages as of December 31
  - Establishment information (industry, size, location)
  - Wage compliance data (are employees paid at/above minimum wage?)
  - Benefits compliance summary
- Submission window: March 17 to June 30 (for preceding year)
- Submission method: DOLE Online Compliance Portal (electronic upload)
- Output: Completed AERW form ready for portal upload

**Who currently does this**: HR/payroll staff, bookkeepers, compliance officers.

**Market size**: All private sector establishments (~1.2M) must submit AERW. Non-submission may trigger DOLE inspection or penalties. DOLE uses AERW data for minimum wage enforcement.

**Professional fee range**: Bundled into payroll/HR services. Standalone report preparation: P2,000-P10,000 per establishment. Payroll software may auto-generate.

**Pain indicators**: Low. The report is a data extraction exercise. Pain is in maintaining accurate wage records year-round. Deadline awareness (March 17 - June 30) is the main challenge. Small establishments often unaware of this requirement.

**Computability**: 5/5 — Fully deterministic. Data reporting exercise: extract employee wages, fill form, submit.

---

## Summary Table

| # | Domain | Governing Law | Computability | Market Size | Pain |
|---|--------|---------------|---------------|-------------|------|
| 1 | OSH Staffing Requirements Engine | RA 11058, DO 252-25, Rule 1030/1040 | 5/5 | ~120K establishments needing SO decisions | 3/5 |
| 2 | OSH Penalty Calculator | RA 11058 Sec. 27-29, DO 252-25 Sec. 42 | 5/5 | ~6,600+ violation notices/yr; 1.2M at-risk | 4/5 |
| 3 | DOLE Mandatory Reporting Calendar | RA 11058, DO 252-25, PD 851 | 5/5 | 1.24M establishments | 4/5 |
| 4 | DOLE Self-Assessment Checklist Engine | DO 57-04, DO 131-13, DO 238-23 | 4/5 | 1.24M establishments (120K+ active target) | 4/5 |
| 5 | OSH Registration & Setup Wizard | OSHS Rule 1020, RA 11058, DO 252-25 | 5/5 | ~70K-80K new registrations/yr | 3/5 |
| 6 | Mandatory Contributions Calculator | RA 11199, RA 11223, RA 9679 | 5/5 | 1.24M employers, ~9.5M employees | 3/5 |
| 7 | DOLE Compliance Visit Readiness | DO 238-23, RA 11058, DO 252-25 | 4/5 | 1.24M establishments | 4/5 |
| 8 | OSH Training Requirements Tracker | RA 11058, DO 252-25, Rule 1030 | 5/5 | ~120K establishments | 3/5 |
| 9 | SEnA Monetary Claims Calculator | RA 10396, LC various, BSP Circ. 799 | 5/5 | 40K-60K cases/yr, P618M+ awards | 4/5 |
| 10 | DO 174 Contracting Compliance | LC Art. 106-109, DO 174-17 | 3/5 | 1-2M deployed workers, 3K+ contractors | 4/5 |
| 11 | Compressed Work Week Compliance | DA 02-09, LC Art. 83, 87 | 5/5 | 50K-100K establishments | 3/5 |
| 12 | Telecommuting Act Compliance | RA 11165, DO 237-22 | 3/5 | 2-3M workers | 3/5 |
| 13 | Foreign National Employment | DO 248-25, LC Art. 40 | 3/5 | 200K-300K foreign workers | 4/5 |
| 14 | 13th Month Pay Edge-Case Engine | PD 851, TRAIN Law | 5/5 | 24M+ workers, 1.2M employers | 3/5 |
| 15 | AERW Generator | DOLE Labor Advisories | 5/5 | 1.2M establishments | 2/5 |

## Cross-Domain Observations

### The DOLE Compliance Inspection Gap as Market Signal

The most striking finding is the structural enforcement gap: 574 inspectors for 1.24M establishments = average inspection interval of ~16 years. The ILO recommends the Philippines should have ~2,852 inspectors. This 5:1 gap means:

1. **Self-service compliance tools fill a government capacity gap** — DOLE literally cannot inspect most establishments. The 168,100 Technical Advisory Visits in 2025 (vs 33,007 full inspections) show DOLE is already shifting toward lighter-touch engagement for MSMEs.

2. **Compliance awareness is the bottleneck, not willful non-compliance** — Compliance rates jump from 79.87% to 94.53% after corrective measures from inspections. Employers WANT to comply; they just do not know what is required.

3. **DO 252-25 (May 2025) created a fresh compliance confusion event** — Revised IRR changes requirements, penalty structures, and adds PhilHealth integration. Every establishment's compliance status needs reassessment.

### The SEnA Claims Calculator as Worker-Side Opportunity

Domain 9 (SEnA Monetary Claims Calculator) represents a fundamentally different opportunity from the employer-facing domains. It arms the worker side of the equation:
- 40,000-60,000 SEnA cases annually with P618M+ in awards (2022 national data)
- Most workers enter conciliation without knowing their exact entitlement
- Information asymmetry currently favors employers during the 30-day settlement window
- A free, public SEnA claims calculator would be the labor-law equivalent of the inheritance engine — giving workers the ability to compute their exact statutory entitlements before negotiation
- This is the highest-impact single tool because it democratizes access to labor rights computation

### Integration Potential

**Employer-side DOLE Compliance Engine** (Domains 1-8, 11, 14-15 combine):
- Initial setup (Rule 1020 registration wizard)
- Staffing requirements (SO level determination)
- Reporting calendar (WAARM + 13th month + AERW)
- Self-assessment (inspection readiness)
- Penalty exposure (risk quantification)
- Training management (SO/worker training tracker)
- CWW computation (if applicable)
- 13th month pay edge cases (annual crunch)

**Worker-side Claims Engine** (Domain 9 + wave1-labor-code-termination domains):
- SEnA monetary claims computation
- Final pay verification
- Separation pay verification
- Retirement pay verification (22.5-day rule)
- Back wages estimation

**Specialized compliance analyzers** (Domains 10, 12, 13):
- DO 174 contracting compliance (contractor + principal audience)
- Telecommuting compliance (employer with remote workers)
- Foreign national employment (multinational employers)

Domain 6 (mandatory contributions) overlaps with payroll and connects to the labor-code-wages analysis.

### Key Differentiator from Existing Market

**Employer compliance space**: Current OSH consulting firms (Safeline, People360, QESH, HSS Philippines) sell consulting services and training courses. Current HRIS/payroll platforms (Sprout Solutions with 1,000+ clients, GreatDay HR, Payday, HRMSpro) handle payroll computation but NOT:
- Self-assessment against DOLE inspection checklist
- OSH penalty exposure computation
- DO 174 contracting compliance analysis
- Unified multi-agency compliance calendar (DOLE + BIR + SEC + SSS/PhilHealth/Pag-IBIG)

**Worker empowerment space**: No public tool exists for SEnA pre-claim computation. Workers either go unrepresented (settling 20-40% below entitlement) or hire lawyers (P5,000-P20,000 per case). The equivalent gap is what free tax calculators did for individual income tax — but for labor rights, no calculator exists.

The equivalent gap is what Taxumo filled for BIR filing — but for DOLE/OSH compliance, no equivalent platform exists. And there is NO equivalent at all for the worker-side claims computation.

### Comparison to Inheritance Engine Thesis

The inheritance engine proved: "Philippine succession law is 100% computable, yet Filipinos pay P50K-200K for lawyers to do arithmetic the Civil Code already defines."

DOLE compliance proves TWO parallel theses:

**Employer thesis**: "Philippine OSH law is 100% computable, yet Filipino employers pay P15,000-P200,000+ for consultants to do lookup-table queries that RA 11058 and its IRR already define — and the 90% who cannot afford consultants simply do not comply."

**Worker thesis**: "Philippine labor standards are 100% computable, yet Filipino workers entering SEnA conciliation pay P5,000-P20,000 for lawyers to compute statutory entitlements — or more commonly, settle for 20-40% below what the Labor Code and PD 851 explicitly define."

The pain multiplier is larger than inheritance: ~1.24M establishments + ~24M workers (vs ~300K estates/year), with daily accruing penalties (vs one-time estate tax), and the enforcement gap creates a self-service opportunity that does not exist in the tax compliance space (BIR at least has e-filing infrastructure).

### Cross-References with Prior Wave 1 Analyses

| This Analysis Domain | Overlaps With | Merge Action for Wave 2 |
|---|---|---|
| Domain 6 (Mandatory Contributions) | wave1-labor-code-wages Domains 7-9 | Merge — same computation, different compliance angle |
| Domain 9 (SEnA Claims) | wave1-labor-code-wages Domains 1-6, wave1-labor-code-termination Domains 1-3 | Keep separate — SEnA wraps underlying computations into claims framework |
| Domain 14 (13th Month Edge Cases) | wave1-labor-code-wages Domain 5 | Merge — extend existing domain with edge cases and compliance reporting |
| Domain 3 (Reporting Calendar) | wave1-bir-forms-catalog (Compliance Calendar) | Merge candidate — unified multi-agency compliance calendar |
| Domain 4 (Self-Assessment) | wave1-labor-code-termination Domain 7 (DOLE Compliance Order) | Merge — self-assessment is the proactive version of compliance order response |
