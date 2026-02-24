# Wave 1: DOLE Compliance — OSH Standards, Labor Inspections, and Mandatory Reporting

**Source**: RA 11058 (Occupational Safety and Health Standards Law, 2018), DO 198-18 (original IRR), DO 252-25 (revised IRR, effective May 16, 2025), DO 238-23 (revised inspection rules), DOLE Rules 1020/1030/1040/1050 (OSHS), PD 851 (13th Month Pay compliance reporting), Labor Code Book IV (Health, Safety, and Social Welfare), DOLE Bureau of Working Conditions (BWC) reportorial requirements

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

## Cross-Domain Observations

### The DOLE Compliance Inspection Gap as Market Signal

The most striking finding is the structural enforcement gap: 574 inspectors for 1.24M establishments = average inspection interval of ~16 years. The ILO recommends the Philippines should have ~2,852 inspectors. This 5:1 gap means:

1. **Self-service compliance tools fill a government capacity gap** — DOLE literally cannot inspect most establishments. The 168,100 Technical Advisory Visits in 2025 (vs 33,007 full inspections) show DOLE is already shifting toward lighter-touch engagement for MSMEs.

2. **Compliance awareness is the bottleneck, not willful non-compliance** — Compliance rates jump from 79.87% to 94.53% after corrective measures from inspections. Employers WANT to comply; they just do not know what is required.

3. **DO 252-25 (May 2025) created a fresh compliance confusion event** — Revised IRR changes requirements, penalty structures, and adds PhilHealth integration. Every establishment's compliance status needs reassessment.

### Integration Potential

Domains 1-5 and 7-8 combine naturally into a single **"DOLE Compliance Engine"** covering:
- Initial setup (Rule 1020 registration wizard)
- Staffing requirements (SO level determination)
- Reporting calendar (WAARM + 13th month)
- Self-assessment (inspection readiness)
- Penalty exposure (risk quantification)
- Training management (SO/worker training tracker)

Domain 6 (mandatory contributions) overlaps with payroll and connects to the labor-code-wages analysis.

### Key Differentiator from Existing Market

Current OSH consulting firms (Safeline, People360, QESH, HSS Philippines) sell consulting services and training courses. There is NO self-service tool that:
- Takes establishment profile inputs
- Outputs complete compliance requirements
- Computes penalty exposure for gaps
- Generates filing calendar
- Tracks ongoing compliance

The equivalent gap is what Taxumo filled for BIR filing — but for DOLE/OSH compliance, no equivalent platform exists.

### Comparison to Inheritance Engine Thesis

The inheritance engine proved: "Philippine succession law is 100% computable, yet Filipinos pay P50K-200K for lawyers to do arithmetic the Civil Code already defines."

DOLE compliance proves: "Philippine OSH law is 100% computable, yet Filipino employers pay P15,000-P200,000+ for consultants to do lookup-table queries that RA 11058 and its IRR already define — and the 90% who cannot afford consultants simply do not comply."

The pain multiplier is larger than inheritance: ~1.24M establishments (vs ~300K estates/year), with daily accruing penalties (vs one-time estate tax), and the enforcement gap creates a self-service opportunity that does not exist in the tax compliance space (BIR at least has e-filing infrastructure).
