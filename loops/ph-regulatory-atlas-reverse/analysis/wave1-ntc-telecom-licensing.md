# Wave 1 Analysis: NTC Telecom Licensing

**Aspect:** ntc-telecom-licensing
**Regulatory Body:** National Telecommunications Commission (NTC)
**Enabling Law:** Republic Act No. 7925 (Public Telecommunications Policy Act), Executive Order No. 546 (1979), Republic Act No. 3846 (Radio Control Law)
**Analysis Date:** 2026-02-27

---

## Agency Overview

The NTC is the sole regulator for all telecommunications services, radio stations, and spectrum management in the Philippines. Its compliance obligations fall into four distinct tiers by market size:

1. **Major telecom carriers** (CMTS, IXC, IGF) — CPCNs, spectrum assignments, annual spectrum user fees
2. **Private and specialized radio operators** — businesses and individuals operating land mobile, maritime, aviation, amateur, and short-range radio
3. **Equipment importers and manufacturers** — type acceptance/approval certificates for all radio equipment
4. **Broadcast stations** (AM, FM, TV) — CPCN plus annual station license fees

---

## Source Texts Reviewed

- RA 7925 (Public Telecommunications Policy Act of the Philippines, 1995)
- EO 546 (1979, creating NTC and defining its mandate)
- RA 3846 (Radio Control Law)
- NTC MC No. 10-10-97 (Spectrum User Fee framework)
- NTC MC No. 19-12-2000 (Revised Schedule of Administrative Fees and Charges)
- NTC MC No. 75-10 (Prescribing new rates for radio station construction permits, licenses, and other fees)
- NTC MC No. 1-1-98 (Short Range Radio Service licensing)
- NTC MC No. 02-01-2001 (Type Approval/Acceptance procedures)
- NTC FAQ — Licensing and Telecommunications

---

## Domain 1: Spectrum User Fee (SUF) Calculator

### Computation Sketch

**Governing:** NTC MC No. 10-10-97 (as amended by MC No. 19-12-2000)

The annual Spectrum User Fee (SUF) is fully deterministic:

```
SUF = Bandwidth (KHz) × Rate per KHz × Area Tier
```

**Rate table (illustrative from MC 10-10-97):**

| Service Type | Metro Manila | Highly Urbanized | Other Areas |
|---|---|---|---|
| CMTS 800/900 MHz | ₱10.00/KHz | ₱5.00/KHz | ₱2.50/KHz |
| Private Mobile Radio (Non-repeatered) | ₱20.00/KHz | ₱10.00/KHz | ₱5.00/KHz |
| Private Mobile Radio (Repeatered) | ₱50.00/KHz | ₱25.00/KHz | ₱12.50/KHz |
| Public Radio Paging | ₱5.00/KHz | ₱2.50/KHz | ₱1.25/KHz |
| In-House Radio Paging | ₱20.00/KHz | ₱10.00/KHz | ₱5.00/KHz |
| Trunked Radio Services | ₱5.00/KHz | ₱2.50/KHz | ₱1.25/KHz |
| Private Trunked Radio | Varies by band (10–20 GHz vs. 20+ GHz) |

**Special conditions:**
- 50% reduction for trunked channels with ≤12.5 KHz bandwidth
- 75% reduction for CMTS channels exceeding standard requirement based on 20 milli-erlang traffic
- New stations granted after June 30 pay 50% of annual amount
- Late payment penalty: **25% of SUF due + 1%/month of principal**
- Default for 1 year → immediate transfer of frequencies

**Inputs:** Assigned bandwidth (KHz per frequency) + service type + covered areas by economic tier
**Output:** Annual SUF, due by January 31

### Who Currently Does This
Telco compliance teams, specialized telecommunications regulatory lawyers, and consultants. For major carriers (DITO, Smart/PLDT, Globe), this is handled in-house by regulatory affairs departments. Smaller private trunked radio operators (security firms, utilities, mining companies) may use outside consultants.

### Market Size
- ~3 major CMTS carriers (Globe, PLDT/Smart, DITO)
- ~18+ satellite/VSAT providers
- ~1,000–5,000 private trunked radio and PMRS operators
- ~100+ cable TV, broadcast, fixed wireless operators
- Total spectrum-holding entities: estimated 2,000–8,000

### Professional Fee Range
- Telecommunications regulatory consultants: ₱15,000–₱80,000/year per company for compliance management
- Law firms with telecom practice: ₱50,000–₱300,000/year for major carriers

### Pain Indicators
- Frequency holders must manually calculate SUF across multiple frequency assignments, area tiers, and service types
- Multi-band operators (different frequencies in different regions) face multiplicative complexity
- Late payment results in 25% + 1%/month — serious for smaller operators
- No public SUF calculator exists; formulas buried in 1997 memorandum circular
- DICT is reviewing SUF rates for major bands (610–790, 790–960, 1710–2025 MHz), suggesting ongoing uncertainty

### Computability Assessment: **Fully deterministic** (5/5)
Every input is defined by statute: bandwidth from frequency assignment, rate from MC 10-10-97 table, area tier from NTC license condition.

### Scores
- Market size: 2/5 (2,000–8,000 entities — narrow B2B, not mass consumer)
- Moat depth: 3/5 (needs telecom regulatory consultant; specialized but not ₱50K+ for simple calculations)
- Computability: 5/5 (fully deterministic from table × KHz × zone)
- Pain/friction: 3/5 (confusing for multi-band operators, penalty cliff real)
- **Opportunity Score: (2×0.25)+(3×0.25)+(5×0.30)+(3×0.20) = 0.50+0.75+1.50+0.60 = 3.35**

---

## Domain 2: Private Radio Station License & Renewal Cost Calculator

### Computation Sketch

**Governing:** NTC MC No. 75-10; MC No. 19-12-2000; RA 3846

Private radio station fees depend on:
- **Service type**: Fixed, Land Mobile, Maritime Mobile, Aeronautical, Amateur, Short Range
- **Transmitter power**: Effective Radiated Power (ERP in watts)
- **Mode**: Simplex vs. duplex (duplex = 2× simplex fee)
- **Validity period**: Annual renewal

**Indicative fee structure (from NTC renewal forms and MC 75-10):**
- Private radio station license: ₱120–₱156/year per station (basic tier)
- Construction Permit: Varies by service class and ERP
- Permit to Purchase/Possess: ₱180/unit filing + ₱156–₱216/unit upon approval
- Short Range Radio Service (SRRS) Special Permit: Lower tier

**Complexity factors for fleet operators:**
- Large fleets (e.g., 100-station security network): must compute per-station fees × mode × service type
- Frequency modification triggers Construction Permit re-computation
- Amateur radio license: 3-year term; Lifetime License at age 60 with 15+ years as Class A

**Late renewal penalty:** Application becomes null and void if pending admin cases not resolved; must refile.

### Who Currently Does This
Companies with large radio fleets (security agencies, logistics, shipping, mining, utilities) manage this via HR/admin departments or outsource to fixers who navigate NTC regional offices. NTC processes are paper-heavy and region-specific.

### Market Size
- Private radio stations: PSA and NTC data not publicly aggregated, but:
  - ~500 licensed security agencies (RA 5487) × average 50-200 radio units = 25,000–100,000 radios
  - ~200+ domestic shipping companies with marine radio requirements
  - ~10,000+ amateur radio operators (PARA membership estimate)
  - Corporate (transport, logistics, BPO, utilities): 50,000–200,000 radios
- Estimated total private radio stations: **200,000–500,000**
- Annual renewal cycle: same population

### Professional Fee Range
- Fixers at NTC regional offices: ₱500–₱2,000 per station for expedited processing
- Compliance consultants for fleet operators: ₱5,000–₱25,000/year flat fee for renewal management
- Total per-transaction cost low, but aggregate across large fleets is significant

### Pain Indicators
- Paper-based application process at NTC regional offices (no fully online system)
- Different fee schedules across service types (land mobile vs. maritime vs. amateur)
- Fleet managers lack a unified calculator to project annual renewal costs
- Permit to Purchase validity only 180 days — tight window for procurement
- No central online registry to track expiry dates across a multi-station fleet

### Computability Assessment: **Mostly deterministic** (4/5)
Fee formula is table-based (service type × ERP × mode). Edge cases: modification triggers → Construction Permit re-computation, but this is also table-based.

### Scores
- Market size: 3/5 (200K–500K stations, fleet operators significant)
- Moat depth: 2/5 (fixers exist but fees are low; no ₱10K+ specialist needed for simple renewals)
- Computability: 4/5 (mostly table-based; some decision tree for construction permits)
- Pain/friction: 2/5 (low per-station cost, primarily a tracking/calendar pain)
- **Opportunity Score: (3×0.25)+(2×0.25)+(4×0.30)+(2×0.20) = 0.75+0.50+1.20+0.40 = 2.85**

---

## Domain 3: NTC Type Acceptance/Approval Fee Calculator & Import Compliance Screener

### Computation Sketch

**Governing:** NTC MC No. 02-01-2001; MC No. 1-04-88; MC No. 04-04-2004 (as amended)

**Two-track decision:**
- **Type Approval** — for Customer Premises Equipment (CPE) that connects to the public telecom network (telephones, modems, DSL equipment, PABX)
- **Type Acceptance** — for Radio Communications Equipment (RCE) not connected to the public network (Wi-Fi devices, Bluetooth equipment, IoT devices, walkie-talkies, drones with radio)

**Fee structure (from MC 04-04-2004 as amended):**
- Type Acceptance: ₱5,000–₱20,000 per model (based on complexity)
- Laboratory testing: ₱2,000–₱15,000 per test
- Type Approval for CPE: Filing ₱150 + Laboratory ₱5,000 + Certificate ₱1,200 (MC 1-1-98 reference)
- Dealer's Permit: ₱10,000 initial / ₱5,000 renewal
- Import Permit: ₱180/unit filing + ₱156–₱216/unit upon approval

**Decision tree inputs:**
1. Does equipment connect to public telecom network? → Type Approval
2. Does equipment emit radio frequency? → Type Acceptance
3. Both? → Both certificates
4. Government agency? → Exemption possible

**Process time:** 4–8 weeks; some models require local lab testing

### Who Currently Does This
Specialized certification agents/consultants (e.g., CSI Associates, IB Lenhardt Philippines, Appluslaboratories) who coordinate with NTC and accredited labs. Growing e-commerce importers increasingly encounter type acceptance requirements as NTC enforcement expands.

### Market Size
- ~10,000–30,000 new product/model applications per year (estimated from import volumes)
- E-commerce surge: Lazada/Shopee sellers importing Wi-Fi routers, Bluetooth speakers, IoT devices face type acceptance requirement (many unknowingly non-compliant)
- ~500+ registered distributors/importers of radio equipment
- Growing drone/RPAS segment (cross-referenced with CAAP analysis)

### Professional Fee Range
- Certification agents: ₱15,000–₱80,000 per product model (end-to-end service including lab coordination, NTC filing, follow-up)
- DIY attempt: ₱5,000–₱35,000 in direct fees but high failure rate without expert guidance

### Pain Indicators
- Most small importers don't know they need type acceptance until customs hold-up
- Confusion between Type Approval vs. Type Acceptance — different process, different fees
- Lab testing adds 2–4 weeks; no online status tracking for applications
- Non-compliant equipment subject to seizure and ₱500,000–₱2M fine
- No clear public decision tree: "does my product need NTC certification?"

### Computability Assessment: **Mostly deterministic** (3/5)
Decision tree (TA vs. Type Acceptance) is logic-based; fee computation is table-based. However, equipment complexity classification requires some judgment.

### Scores
- Market size: 2/5 (10K–30K models/year — growing but still specialized)
- Moat depth: 3/5 (certification agents charge ₱15K–₱80K; specialized knowledge needed)
- Computability: 3/5 (rule-heavy decision tree with some judgment for complexity classification)
- Pain/friction: 3/5 (seizure risk for non-compliance; confusing dual-track system; no public tool)
- **Opportunity Score: (2×0.25)+(3×0.25)+(3×0.30)+(3×0.20) = 0.50+0.75+0.90+0.60 = 2.75**

---

## Domain 4: Broadcast Station License Fee Calculator (AM/FM/TV)

### Computation Sketch

**Governing:** NTC MC No. 75-10; MC No. 19-12-2000; RA 3846; EO 546; EO 205 (CATV)

**Broadcast station fees structured by:**
- Station type: AM, FM, TV, CATV, Digital Terrestrial Television (DTT)
- Power: Effective Radiated Power (ERP) in watts — tiered thresholds
- CATV: 3% franchise tax on gross receipts (in lieu of LGU taxes)
- Auxiliary stations (STL, remote pickup): Fixed/Land Mobile fee table applies

**Additional broadcast obligations:**
- CPCN application: ₱330,981 nationwide (quasi-judicial process)
- Annual station license renewal: ERP-based from MC 75-10 tables
- Annual Spectrum User Fee (Domain 1 above, also applies to broadcast)
- Translator/relay stations: Separate license per station

### Who Currently Does This
Broadcast company regulatory departments, often with law firm support for CPCN applications (which require congressional franchise first). Smaller community radio stations may use fixers.

### Market Size
- ~1,800+ AM, FM, TV broadcast stations nationwide (KAPISANAN ng mga Brodkaster ng Pilipinas estimate)
- ~3,000+ CATV franchise areas
- Annual renewal: same population
- Not consumer-facing; purely B2B/corporate

### Professional Fee Range
- CPCN application: Law firm fees ₱200,000–₱1,000,000 (quasi-judicial proceeding)
- Annual station license renewal: Managed in-house by broadcast companies
- CATV franchise tax computation: Handled by company accountants

### Pain Indicators
- CPCN process is quasi-judicial — requires NTC hearing and newspaper publication (not just fee computation)
- Power-based fee schedule buried in old memorandum circulars
- Community broadcasters may not know their correct fee tier
- ABS-CBN franchise lapse (2020) highlighted political dimension of broadcast licensing

### Computability Assessment: **Mostly deterministic** (4/5)
Annual renewal fees are ERP-based table lookups. CPCN application is quasi-judicial and NOT automatable (requires legal representation). Fee computation is deterministic; license grant is not.

### Scores
- Market size: 1/5 (~1,800–5,000 entities — narrow B2B)
- Moat depth: 2/5 (annual renewal handled in-house; CPCN applications need lawyers but that's not computability)
- Computability: 4/5 (annual fee = table lookup by ERP tier; fully deterministic for renewal portion)
- Pain/friction: 2/5 (renewal is routine; CPCN is painful but judgment-heavy, not automatable)
- **Opportunity Score: (1×0.25)+(2×0.25)+(4×0.30)+(2×0.20) = 0.25+0.50+1.20+0.40 = 2.35**

---

## Summary Table

| Domain | Description | Computability | Market Size | Moat | Pain | **Score** |
|---|---|---|---|---|---|---|
| 1. Spectrum User Fee Calculator | Annual SUF = KHz × rate × area tier + late penalties | Fully deterministic | 2/5 | 3/5 | 3/5 | **3.35** |
| 2. Private Radio Fleet License Manager | Station fee = type × ERP × mode; renewal calendar | Mostly deterministic | 3/5 | 2/5 | 2/5 | **2.85** |
| 3. Type Acceptance Import Screener | TA vs. TAC decision tree + fee computation | Rule-heavy + some judgment | 2/5 | 3/5 | 3/5 | **2.75** |
| 4. Broadcast Station License Calculator | Annual fee = ERP tier table lookup | Mostly deterministic | 1/5 | 2/5 | 2/5 | **2.35** |

---

## Top Opportunity Assessment

**Domain 1 (Spectrum User Fee) at 3.35** is the highest scorer, but the market is fundamentally B2B and narrow — major telcos handle this in-house, and smaller operators deal with it via regulatory consultants. The formula is textbook deterministic, but the value proposition is limited by market size.

**Domain 2 (Private Radio Fleet)** at 2.85 could be interesting as a fleet management SaaS for security agencies and logistics companies, but the per-station fee is so low (₱120–₱156/year) that the pain is more administrative than financial. This plays more as a compliance calendar feature than a standalone product.

**Key finding:** NTC compliance is **significantly more B2B and narrower in market reach** than other domains in this atlas (e.g., SSS benefits affecting 42M members, LTO registration affecting 14M annual transactions). The professional moat is real but specialized (telecom regulatory lawyers/consultants), making it a viable B2B SaaS opportunity but not a mass-market consumer tool.

**Most defensible niche:** A combined "NTC Compliance Dashboard" for companies with large radio fleets (security agencies, transport companies, shipping) that: (a) tracks 200–500 station renewal dates, (b) computes annual license fees across service types and modes, and (c) flags NTC type acceptance requirements for equipment procurement. This addresses an operational pain (fleet tracking) that scales with company size and commands ₱5,000–₱25,000/year in consultant fees today.

---

## Sources

- NTC MC No. 10-10-97 (Spectrum User Fees) — SC E-Library
- NTC MC No. 19-12-2000 (Revised Administrative Fee Schedule) — NTC Region 7
- NTC MC No. 75-10 (Radio Station Construction Permits, Licenses, and Other Fees) — NTC Region V
- RA 7925 text — chanrobles.com
- Respicio & Co. — Available Telecommunications Service Licenses in the Philippines
- Ib-lenhardt.com — NTC Type Approval and Certification for Philippines
- Lexology — In Brief: Telecoms Regulation in Philippines
- PARA (Philippine Amateur Radio Association) — Getting a Callsign
- PNA — DICT Orders Review of Spectrum Users Fee of Telcos (2018)
