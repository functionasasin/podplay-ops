# Wave 1 Analysis: NPC Data Privacy Compliance
**Aspect:** `npc-data-privacy-compliance`
**Agency:** National Privacy Commission (NPC)
**Governing Law:** Republic Act No. 10173 (Data Privacy Act of 2012) + IRR (August 2016) + NPC Circular No. 2022-04 + NPC Circular No. 2023-01 + NPC Circular No. 2023-06

---

## Regulatory Overview

The NPC administers the Data Privacy Act of 2012 (DPA), which imposes a multi-layered compliance framework on all organizations that process personal data of Filipinos. Enforcement has been accelerating: NPC conducts privacy sweeps, issues compliance orders, and imposes administrative penalties up to ₱5M. Criminal prosecution (up to 7 years imprisonment) is a real deterrent. The compliance universe is large — banks, hospitals, schools, BPOs, retailers, insurance companies, and government agencies all process personal data at scale.

---

## Computation-Heavy Sections Identified

### Domain 1: NPC Registration Eligibility Screener + Compliance Calendar
**Governing Provisions:** RA 10173 Sec. 13 (NPC creation); NPC Circular No. 2022-04 (5 December 2022, effective 11 January 2023); NPC Circular No. 2023-01 (effective 8 June 2023, fees implemented 1 October 2024)

**Who Must Register:**
NPC Circular 2022-04 triggers mandatory registration for PICs or PIPs if ANY of the following conditions are met:
1. Employs **250 or more persons**
2. Processes **Sensitive Personal Information (SPI) of 1,000 or more individuals** — SPI includes: race/ethnicity, health/medical, religious beliefs, sexual life, government-issued IDs, financial/credit records, biometric data
3. Processes data that **will likely pose a risk** to the rights and freedoms of data subjects

**Registration Mechanics (Computation Sketch):**
```
INPUT: number of employees + types of data processed + volume of SPI records + nature of core business
→ Threshold check (any of 3 triggers = mandatory registration)
→ DPO appointment → 20-day registration window starts
→ DPS inventory (list all data processing systems)
→ Annual renewal: certificate valid 1 year; renewal notification 30 days before expiry
→ New DPS implemented: register within 20 days
→ Major amendments (name change, address): notify NPC within 30 days
→ Minor amendments (DPS modifications, DPO change): notify within 10 days
→ Non-mandatory entities: submit Sworn Declaration and Undertaking (SDAU) for exemption
```

**Registration Fees (NPC Circular 2023-01, implemented 1 October 2024):**
Fees apply per DPS registration (initial and renewal). Exact peso table is in NPC portal (image-based table, not machine-readable). Administrative fine for failure to register: **₱50,000–₱200,000**. Fee for NPCRS account recovery: ₱5,000.

**Who Currently Does This:** Law firms (Baker McKenzie, SyCip Salazar, Gorriceta) and data privacy consultants (KAT-C, RT&Co./RSM Philippines, InCorp, FilePino). Full compliance program setup typically requires legal counsel + IT security consultant.

**Rough Market Size:**
- PSA 2022 ASPBI: **4,118 large establishments** (200+ employees) → ~3,500–4,000 at 250+ threshold
- Plus: hospitals (1,800+), schools/universities (1,700+), banks and non-bank financial institutions (700+), insurance companies (150+), BPO companies (hundreds, each processing millions of customer records for foreign clients), government agencies (thousands)
- Conservative estimate of mandatory registrants: **15,000–30,000 entities**
- Actual compliance rate: likely very low — the NPC issued the Sworn Declaration option to handle the flood of non-compliant entities
- Annual ASIR reporters: **all PICs and PIPs** regardless of registration — universe likely **50,000–100,000 organizations**

**Professional Fee Range:** ₱50,000–₱500,000 per engagement (full compliance program: PMP development + PIA + DPO training + NPC registration). Outsourced DPO retainer: est. ₱20,000–₱100,000/month. Law firm engagement for compliance audit: ₱150,000–₱500,000+.

**Pain Indicators:**
- 3-part eligibility test confuses SMEs — "1,000 individuals" threshold is easy to hit unknowingly (payroll + customers + vendors)
- "Likely to pose a risk" is undefined → organizations don't know if they qualify
- 20-day registration window from DPS commencement is almost universally missed
- Annual renewal tracked manually; NPC system only sends 30-day advance notification if already in NPCRS
- SDAU exemption option added Oct 2024 but submission process still confusing

**Computability:** FULLY DETERMINISTIC for the threshold check and calendar mechanics. Partially deterministic for the "risk" category (requires judgment). Overall: **4/5 computability** — the core eligibility check and compliance calendar are fully deterministic; "risk" assessment is a checklist with mostly objective criteria.

**Opportunity Score Estimate:**
- Market: 3/5 (15K–30K mandatory + much broader universe for ASIR)
- Moat: 3/5 (law firms and consultants consulted, but DIY-able by compliance officer with tool)
- Computability: 4/5 (mostly deterministic threshold checks)
- Pain: 3/5 (confusing thresholds, missed deadlines, annual renewal burden)
- **Score: (3×0.25) + (3×0.25) + (4×0.30) + (3×0.20) = 0.75 + 0.75 + 1.20 + 0.60 = 3.30**

---

### Domain 2: 72-Hour Breach Notification Protocol
**Governing Provisions:** RA 10173 Sec. 20(f) (notification duty); NPC Circular 16-03 (Personal Data Breach Management, 15 December 2016); NPC DBNMS (online reporting system)

**Computation Sketch:**
```
INPUT: breach discovery time + type of data involved + number of affected data subjects
→ STEP 1: Harm Assessment — is breach "likely to result in harm"? (binary: SPI involved OR identity fraud risk)
→ If YES: 72-hour clock starts immediately from "knowledge" of breach
→ Notification targets: NPC AND all affected data subjects simultaneously
→ 100+ data subjects affected? → Maximum penalty applies under Sec. 35
→ STEP 2: Breach classification (29 categories in ASIR: theft, hacking, malicious code, human error, etc.)
→ STEP 3: Notification content checklist (breach description, data types, affected count, measures taken, contact point)
→ STEP 4: Within 5 days of initial notification → full breach report submitted to NPC
→ STEP 5: DBNMS system entry (mandatory platform, paper/email not accepted)
→ STEP 6: ASIR entry — breach recorded in annual incident log (March 31 deadline)

DELAY RULES (binary checklist):
- May delay IF: scope determination ongoing OR restoring system integrity
- May NOT delay IF: 100+ data subjects affected → notify within 72h with available info
- May NOT delay to conceal a breach (Sec. 30 penalty: 18 months–5 years + ₱500K–₱1M)
```

**Who Currently Does This:** In-house legal teams + IT security departments. External counsel (law firms) called in for high-profile breaches. No standardized tool exists for Philippine-specific 72-hour protocol computation.

**Rough Market Size:** Every covered organization faces breach risk. DBNMS received thousands of breach reports since 2022 launch. The NPC publishes aggregate ASIR statistics showing breach trends. Est. 1,000–3,000 breach notification events per year requiring the 72-hour protocol.

**Professional Fee Range:** Incident response retainer: ₱100,000–₱500,000 (law firm + cybersecurity firm). Ad hoc breach response: ₱50,000–₱200,000 per incident.

**Pain Indicators:**
- "Knowledge" trigger is ambiguous — organizations don't know when the 72-hour clock starts (discovery vs. confirmation?)
- Simultaneous NPC + data subject notification requirement is operationally complex
- Concealment penalty (Sec. 30) is severe: imprisonment 18 months–5 years + ₱500K–₱1M fine
- 100+ data subject threshold triggers maximum penalty exposure under Sec. 35
- DBNMS is the only accepted submission channel; many organizations are not registered on it

**Computability:** MOSTLY DETERMINISTIC — the trigger assessment has some judgment ("likely to result in harm"), but notification timeline and content are fully rule-based. **4/5 computability.**

**Opportunity Score Estimate:**
- Market: 3/5 (breach events per year: 1K–3K requiring protocol)
- Moat: 3/5 (lawyers and IR firms consulted under pressure)
- Computability: 4/5 (mostly deterministic timeline + content rules)
- Pain: 4/5 (72-hour pressure, concealment = criminal liability, multi-stakeholder coordination)
- **Score: (3×0.25) + (3×0.25) + (4×0.30) + (4×0.20) = 0.75 + 0.75 + 1.20 + 0.80 = 3.50**

---

### Domain 3: Annual Security Incident Report (ASIR) Filing Tool
**Governing Provisions:** NPC Circular 16-03 Sec. 7 (ASIR requirement); DBNMS platform; NPC Circular 2022-04 (universal applicability regardless of registration status)

**Computation Sketch:**
```
INPUT: all security incidents over previous calendar year (January–December)
→ Classify each incident into 15 standard categories:
   [theft, identity fraud, sabotage/physical damage, malicious code, hacking, misuse of resources,
   hardware failure, software failure, communication failure, natural disaster, design error,
   user error, operations error, software maintenance error, third-party service, other]
→ Sub-classify incidents into: mandatory breach notifications vs. voluntary breach notifications
→ Tally incident counts by category
→ Submit via DBNMS between January 1 – March 31 of the following year
→ Zero incidents: still required (enter "0" in all fields)
→ Error correction: cannot edit after submission; must email NPC to delete and resubmit

DEADLINE: March 31 annually (2025 ASIR due March 31, 2026; 2026 ASIR due March 31, 2027)
PLATFORM: DBNMS (dbnms.privacy.gov.ph)
PENALTY FOR NON-FILING: up to ₱50,000 administrative fine + compliance order
```

**Who Currently Does This:** Compliance officers, DPOs, or external data privacy consultants. Many organizations miss the March 31 deadline because no automated reminder system exists outside NPCRS (which only notifies registered entities).

**Rough Market Size:** All PICs and PIPs in the Philippines — potentially **50,000–100,000 organizations**. The NPC applies the ASIR requirement universally, including to entities not subject to mandatory DPS registration.

**Professional Fee Range:** Annual compliance packages including ASIR preparation: ₱30,000–₱100,000/year. Ad hoc ASIR assistance: ₱5,000–₱20,000 per filing.

**Pain Indicators:**
- ASIR required for ALL PICs/PIPs, regardless of registration status — many don't know they must file
- No automated reminder for non-NPCRS-registered entities
- Cannot edit after submission → high-stakes one-time filing
- 15-category incident classification system is non-intuitive
- Penalty for non-filing: ₱50,000

**Computability:** FULLY DETERMINISTIC — incident classification categories are exhaustively defined; deadline is fixed at March 31. **5/5 computability.**

**Opportunity Score Estimate:**
- Market: 3/5 (50K–100K potential filers, but many are unaware)
- Moat: 2/5 (DBNMS provides the filing platform; moat is awareness/classification support)
- Computability: 5/5 (fully deterministic categories + fixed deadline)
- Pain: 3/5 (confusing categories, cannot edit after submission, penalty for non-filing)
- **Score: (3×0.25) + (2×0.25) + (5×0.30) + (3×0.20) = 0.75 + 0.50 + 1.50 + 0.60 = 3.35**

---

### Domain 4: Privacy Impact Assessment (PIA) Trigger Screener
**Governing Provisions:** NPC Circular 2016-01 (PIA guidelines, mandatory for government agencies); NPC Circular 2023-06 (security requirements, effective 30 March 2024, compliance deadline 30 March 2025); RA 10173 IRR Sec. 19 (PIA recommendation for high-risk processing)

**Computation Sketch:**
```
INPUT: organization type (government vs. private) + data processing activities + system type
→ Government agencies: PIA mandatory for each program, process, or measure involving personal data
→ Private sector: PIA triggered when processing is:
   - Large scale (1,000+ individuals) OR
   - Sensitive categories (health, financial, biometric, minor data) OR
   - Automated decision-making with significant effects OR
   - Cross-border data transfers OR
   - New technologies
→ PIA scope: (a) data inventory, (b) risk assessment, (c) control framework, (d) privacy officer sign-off
→ Minimum security measures (Circular 2023-06): access controls, encryption, retention policy, incident management
```

**Who Currently Does This:** External consultants (RSM Philippines/RT&Co., KAT-C, law firms). PIA methodologies are bespoke and organization-specific. NPC provides standard PIA templates but outcomes require expert judgment.

**Rough Market Size:** ~1,700 government agencies (mandatory PIA for new systems) + large private sector (~10,000 entities processing 1,000+ SPI). Est. 5,000–15,000 PIA exercises per year.

**Professional Fee Range:** PIA consulting: ₱50,000–₱300,000 per PIA engagement. Government agencies often use in-house or contracted consultants.

**Pain Indicators:**
- "High-risk" classification requires judgment → lawyers and consultants needed
- NPC circular templates are generic; bespoke PIAs require expertise
- Circular 2023-06 new security requirements added 30 March 2024 compliance deadline

**Computability:** MOSTLY DETERMINISTIC for trigger assessment (checklist-based); REQUIRES JUDGMENT for the actual PIA content and risk rating. **3/5 computability** — trigger checker is automatable, full PIA is not.

**Opportunity Score Estimate:**
- Market: 2/5 (~5K–15K PIA exercises/year — narrower than full PIC/PIP universe)
- Moat: 4/5 (consultants and law firms dominate; significant expertise required)
- Computability: 3/5 (trigger screener is deterministic; PIA content requires judgment)
- Pain: 3/5 (complexity, deadline pressure, consultant cost)
- **Score: (2×0.25) + (4×0.25) + (3×0.30) + (3×0.20) = 0.50 + 1.00 + 0.90 + 0.60 = 3.00**

---

## Summary: Domains Identified

| # | Domain | Governing Sections | Computability | Estimated Opportunity Score |
|---|--------|-------------------|---------------|---------------------------|
| 1 | NPC Registration Eligibility Screener + Compliance Calendar | RA 10173 Sec. 13; NPC Circular 2022-04; NPC Circular 2023-01 | 4/5 mostly deterministic | **3.30** |
| 2 | 72-Hour Breach Notification Protocol | RA 10173 Sec. 20(f); NPC Circular 16-03; DBNMS | 4/5 mostly deterministic | **3.50** |
| 3 | Annual Security Incident Report (ASIR) Filing Tool | NPC Circular 16-03 Sec. 7; DBNMS | 5/5 fully deterministic | **3.35** |
| 4 | Privacy Impact Assessment (PIA) Trigger Screener | NPC Circular 2016-01; NPC Circular 2023-06; RA 10173 IRR Sec. 19 | 3/5 partially deterministic | **3.00** |

---

## Top Opportunity: "DPA Compliance Engine" (Domains 1 + 2 + 3 combined)

**Concept:** A unified Data Privacy Act compliance platform covering three fully automatable sub-domains:

1. **Eligibility Screener** — 3-question decision tree (employee count + SPI volume + risk processing) → immediate determination: mandatory registrant / voluntary / SDAU exemption → registration checklist generated

2. **Compliance Calendar** — deadline tracker: DPS renewal dates (annual), new DPS registration windows (20-day), ASIR filing period (Jan 1–Mar 31), amendment notification windows (10 or 30 days), Circular 2023-06 security compliance deadline

3. **Breach Response Protocol** — "72-hour countdown clock": breach type → harm assessment → notification requirement determination → notification content generator → DBNMS submission checklist → 5-day full report reminder

**Why This Is Automatable:**
- Registration eligibility: three binary thresholds, no judgment required
- Compliance calendar: all deadlines are statutory or circular-defined, fully deterministic
- Breach notification: notification trigger is binary (harm likely or not), timeline is exactly 72 hours, content requirements are enumerated in NPC Circular 16-03
- ASIR classification: 15 enumerated categories covering all possible incident types

**What Moat It Disrupts:** Law firms and data privacy consultants currently charge ₱50,000–₱500,000 for compliance program setup. A tool covering eligibility + calendar + breach protocol replaces the most mechanical portion of their engagement — the compliance checklist work — leaving the judgment-heavy parts (PIA, policy drafting) for the professional.

**The Professional Moat Disrupted:**
- DPO outsourcing retainer: ₱20,000–₱100,000/month
- Compliance setup fee: ₱50,000–₱500,000 per organization
- Annual compliance management: ₱30,000–₱150,000/year

**Rough Comparable:** "This is like the SSS Contribution Calculator, but for Data Privacy — replacing the consultant who checks your registration thresholds and tracks your breach notification deadlines."

**Market Size:**
- Mandatory registrants: 15,000–30,000 organizations
- ASIR reporters: 50,000–100,000 organizations
- Many SMEs — pharmacies, clinics, dental offices, school registrars, HR departments — process 1,000+ SPI records unknowingly and should be registered but have never been

---

## Key Sources

- [RA 10173 Data Privacy Act of 2012](https://privacy.gov.ph/data-privacy-act/)
- [NPC IRR (August 2016)](https://privacy.gov.ph/implementing-rules-regulations-data-privacy-act-2012)
- [NPC Circular No. 2022-04 (DPS and DPO Registration)](https://privacy.gov.ph/wp-content/uploads/2023/05/Circular-2022-04-1.pdf)
- [NPC Circular 16-03 (Personal Data Breach Management)](https://privacy.gov.ph/wp-content/uploads/2022/01/sgd-npc-circular-16-03-personal-data-breach-management.pdf)
- [NPC: Registration Fee Implementation (October 2024)](https://privacy.gov.ph/npc-implements-registration-fees-and-charges-and-submission-of-sworn-declaration-and-undertaking-for-exemption-from-data-processing-system-registration/)
- [PSA 2022 ASPBI Preliminary Results](https://psa.gov.ph/content/2021-annual-survey-philippine-business-and-industry-aspbi-all-establishments-employment)
- [DLA Piper: Philippines Data Protection Registration](https://www.dlapiperdataprotection.com/?t=registration&c=PH)
- [ASIR 2025 Deadline - Lexology](https://www.lexology.com/library/detail.aspx?g=b5cb34ba-d220-45e7-b889-aaaf66b4d022)
