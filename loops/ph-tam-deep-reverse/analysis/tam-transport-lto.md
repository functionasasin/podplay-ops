# TAM: Transport / LTO Tools (G-LTO-1, G-LTO-2, J-CAP-1)

**Score:** G-LTO-1: 72 | G-LTO-2: 68 | J-CAP-1: 58 (from regulatory-atlas ranked-shortlist)
**Loop source:** regulatory-atlas

---

## Tool Definitions

| Tool ID | Tool Name | Core Function |
|---------|-----------|---------------|
| G-LTO-1 | MVUC Registration Cost Calculator | Calculates total LTO registration cost (MVUC + inspection + CTPL + plate fees) by vehicle type, weight, and model year |
| G-LTO-2 | Late Registration Penalty Calculator | Computes 50% MVUC surcharge + stacked yearly penalties for delinquent vehicles |
| J-CAP-1 | RPAS/Drone Compliance Calculator | Navigates CAAP certificate requirements + registration fees for commercial/large recreational drones |

---

## G-LTO-1: MVUC Registration Cost Calculator

### Consumer Segment

**Who:** Private motor vehicle owners in the Philippines who need to calculate their annual LTO registration renewal cost (MVUC + inspection fee + CTPL insurance + plate fees).

**Population:**
- **14,270,000** total registered motor vehicles — Source: PSA, "Gasoline-powered Vehicles Increased by 2.5 Percent in 2023," Philippine Statistics Authority, 2024 (citing LTO CY2023 data) — Confidence: OFFICIAL
  - Gasoline-powered: 11,230,000 (78.7%)
  - Diesel-powered: 3,030,000 (21.3%)
  - Electric: ~1,360 | Hybrid: ~6,160
- **8,470,000** motorcycles, tricycles, and non-conventional motorcycles registered Jan–Sep 2023 alone — Source: LTO via Statista, 2023 — Confidence: OFFICIAL (partial year)
- **1,270,000** registered private cars (full year 2022) — Source: LTO via Statista, 2023 — Confidence: OFFICIAL
- **5,460,301** registered vehicles excluding motorcycles (end-2022) — Source: CEIC Data (citing LTO), December 2022 — Confidence: OFFICIAL
- **10,900,000** vehicles already migrated to LTO LTMS database out of 13,900,000 registered (as of January 1, 2023) — Source: LTO press release via PNA, January 2023 — Confidence: OFFICIAL
- **~38,000,000** total vehicles including unregistered — Source: LTO estimate, various media reports 2022–2023 — Confidence: ESTIMATED (LTO internal working figure, not formally published)

**Vehicle type composition (DERIVED from above, CY2022 baseline):**
- Motorcycles/tricycles: ~9.7–10 million (dominant segment, extrapolated from Jan–Sep 2023 figure of 8.47 million)
- SUVs/MUVs/MPVs: ~2.58 million MUVs + 965,000 SUVs (end-2022, AAA/FOURIN data)
- Private passenger cars: ~1.31 million (end-2022)
- Buses: ~33,000 (end-2022)
- Trucks/commercial: remainder of diesel-powered stock (~2–3 million)

**Addressable fraction:** 73% internet penetration among Filipinos 18+ (DataReportal 2024); vehicle owners skew urban/semi-urban — applying **70%** as the digitally reachable fraction of private vehicle owners. Note: motorcycles (the largest segment) are predominantly owned by lower-income urban and rural workers, so digital tool adoption rate for this segment is lower (~40%). For car/SUV/truck owners, digital adoption is higher (~80%). Blended estimate: **55%** of all registered vehicle owners would actively use a digital MVUC calculator vs. walking up to an LTO counter or using a fixer.

**Addressable consumer population:** 14,270,000 × 55% = **~7,848,500**

**Current professional cost:** LTO fixers/processors charge ₱200–₱1,500 above official fees for facilitation. No self-service calculator exists officially; consumers rely on fixers, insurance agents, or trial-and-error at LTO counters.

**Our consumer price:** ₱29/month (single-use calculator, freemium access) or ₱99/year subscription covering registration calculator + renewal reminders.

**Consumer TAM (using ₱99/year):** 7,848,500 × ₱99 = **~₱776.9M/year**
**Consumer TAM (using ₱29/transaction, 1 renewal/year):** 7,848,500 × ₱29 = **~₱227.6M/year**

*Use ₱29 per-use as conservative TAM floor; ₱99/year subscription ceiling.*

---

### Professional Segment

**Who:** Fleet managers at corporations and logistics companies; motor vehicle dealerships handling initial registration for buyers; transport cooperatives (jeepney/tricycle operators associations); LTO-accredited processing agents. Note: informal "fixers" are illegal (RA 9485, RA 10930) and are the disintermediation target — the tool replaces their information advantage, not their physical processing role.

**Population:**
- **70+** LTO-accredited CTPL insurance companies — Source: LTO portal, ltoportal.ph, 2023 — Confidence: OFFICIAL (approximate; exact list maintained by Insurance Commission)
- **Fleet operators:** PSA 2019 CPBI shows ~13,000 enterprises in "transportation and storage" sector employing 20+ workers; fleet managers in logistics companies are a target segment — Confidence: DERIVED
- **Transport network operators:** LTFRB data shows registered TNVs (transport network vehicles) exceeding 130,000 as of 2023 (Grab, inDrive, etc.) — each TNC has fleet compliance staff — Confidence: ESTIMATED
- **Auto dealerships:** CAMPI (Chamber of Automotive Manufacturers of the Philippines) member network includes ~600+ franchised dealerships that handle new vehicle registration — Confidence: ESTIMATED

**Clients per professional per year:** A fleet manager at a logistics company may handle 50–500 vehicle renewals per year. An insurance agent may process 100–2,000 MVUC-linked CTPL policies annually.

**B2B price per seat:** ₱999/month for fleet/professional tier (unlimited registrations, bulk MVUC calculation, renewal calendar export)

**Professional TAM (fleet managers + dealerships):**
- Fleet managers: ~13,000 fleet operator firms × ₱999/mo = ₱155.8M/year
- Dealerships: ~600 dealerships × ₱999/mo = ₱7.2M/year
- Total professional TAM: **~₱163M/year**

---

## G-LTO-2: Late Registration Penalty Calculator

### Consumer Segment

**Who:** Vehicle owners with lapsed (delinquent) LTO registration who need to calculate accumulated penalties before renewal. Applies to:
1. Owners who missed their renewal month (50% MVUC surcharge after 1 month)
2. Owners who haven't registered in multiple years (50% MVUC per missed year, compounding)
3. Vehicles apprehended while unregistered (₱10,000 fine + impound + MVUC penalties)

**Population:**
- **~23,730,000** estimated unregistered vehicles in Philippines — DERIVED from LTO estimate of ~38 million total vehicles minus 14.27 million registered (2023) — Confidence: ESTIMATED (LTO public figure for total vs. registered gap)
- **Annual delinquent renewal attempts:** No official count published. DERIVED estimate: LTO processes ~8–10 million renewals per year (LTMS database migration: 10.9M registered with digital records). A conservative 15% delinquency rate among annual renewals = **~1.5–2.1 million delinquent renewal transactions per year** — Confidence: ESTIMATED (methodology: 14.27M registered ÷ average 1-year registration term × 15% delinquency rate)

**Addressable fraction:** 55% (same as G-LTO-1; people with delinquent registration are slightly more likely to seek calculator help because the penalty math is opaque)

**Addressable consumer population:** 2,100,000 × 55% = **~1,155,000 annual users**

**Current professional cost:** Fixers charge ₱500–₱3,000 to compute and process a delinquent registration. Official LTO counters often provide inconsistent quotes. Zero published official online calculator exists.

**Our consumer price:** ₱49/transaction (one-time penalty calculation + itemized breakdown)

**Consumer TAM:** 1,155,000 × ₱49 = **~₱56.6M/year**

---

### Professional Segment

**Who:** Insurance agents, LTO-accredited motor vehicle inspectors, and legal aid practitioners who help clients with delinquent vehicles. Also applicable to court-appointed vehicle auction managers (impounded vehicle processing).

**Population:** Same professional base as G-LTO-1 (~13,000 fleet operators + 600 dealerships + transport operators)

**Professional TAM (at ₱999/mo, bundled with G-LTO-1):** No incremental uplift; covered in G-LTO-1 professional segment above.

---

## J-CAP-1: RPAS/Drone Compliance Calculator

### Consumer Segment

**Who:** Philippine residents who own or operate drones/Remotely Piloted Aircraft Systems (RPAS) for:
1. Commercial operations (aerial photography, survey/mapping, agriculture, drone shows) — must obtain RPA Controller Certificate + RPAS Operator Certificate + RPA Registration Certificate from CAAP
2. Non-commercial large RPAs (≥7 kg gross weight) — must register even for hobby use
3. Recreational drones (>250g, <7 kg) — required to register with CAAP since CAAP amended regulations

**Population:**
- **1,432** active RPA Controller Certificate and Remote Pilot License holders nationwide — Source: CAAP press release, "CAAP highlights drone safety and regulatory oversight at Drone Warfare Summit 2025," October 2025 — Confidence: OFFICIAL (2025 figure, most recent published)
- **Data gap:** CAAP does not publish annual aggregate counts of registered drones or RPAS Operator Certificate holders. No 2022–2023 specific figure is publicly available. FOI requests to CAAP would be required for precise counts.
- **DERIVED estimate for CY2023 registered commercial operators:** ~800–1,000 (applying backward projection from 1,432 in Oct 2025, assuming ~20% annual growth) — Confidence: ESTIMATED
- **Recreational drone owners (>250g):** No official count. DERIVED proxy: DJI Philippines market share suggests significant consumer sales. PSA importation data shows camera/photography drone imports (HS code 8806). Global industry benchmark: ~1–2 drones per 1,000 population in developing markets with active registration enforcement → Philippines (population 113 million) = **~113,000–226,000** recreational drone owners — Confidence: ESTIMATED (global ratio applied to PH)
- **Key caveat:** The regulatory perimeter is actively expanding. House Bill 05260 (filed 2022) proposes stricter RPAS regulation, which would expand the registration-required universe.

**Addressable fraction (recreational):** Only drone owners facing compliance decisions (registration, airspace restrictions, certificate requirements) would use a compliance calculator. Estimate **60%** of recreational owners with drones >250g need to navigate CAAP rules = **~67,800–135,600 addressable users**.

**Addressable consumer population:**
- Commercial operators: ~900 (near 100% addressable — these are businesses)
- Recreational (needing compliance guidance): ~100,000 (mid-estimate)
- **Total: ~100,900**

**Current professional cost:** Commercial drone certification training costs ₱40,000–₱60,000 (training provider fees, cited by multiple CAAP-registered training centers). Navigating CAAP requirements without a calculator/guide: 5–10 hours of research + consultant fees ₱5,000–₱20,000.

**Our consumer price:** ₱499/year (compliance calendar, fee calculator, airspace map integration, CAAP form checklist)

**Consumer TAM:** 100,900 × ₱499 = **~₱50.3M/year**

---

### Professional Segment

**Who:** Commercial RPAS service providers (aerial photography firms, agricultural drone services, survey companies) and CAAP-accredited RPAS training centers.

**Population:**
- **RPAS Operator Certificate holders (businesses):** No published aggregate count. ESTIMATED ~300–500 active RPAS Operator Certificates as of 2023 (derived from 1,432 controller certificates; operator certificates apply to companies, not individuals) — Confidence: ESTIMATED
- **CAAP-accredited RPAS training centers:** No published list count, but multiple providers known (Philippine Drone Network, DOST-ASTI programs, private aviation schools)

**B2B price per seat:** ₱1,999/month for RPAS Operator Certificate holders managing multiple pilots and drones

**Professional TAM (RPAS operators):** 400 firms × ₱1,999/mo × 12 = **~₱9.6M/year**

---

## Total TAM — G-LTO-1 + G-LTO-2 + J-CAP-1

| Tool | Segment | Population | Price | Annual TAM |
|------|---------|-----------|-------|-----------|
| G-LTO-1 MVUC Calculator | Consumer (direct) | ~7,848,500 addressable | ₱29/use | ₱227.6M |
| G-LTO-1 MVUC Calculator | Professional (fleet/dealer B2B) | ~13,600 firms | ₱999/mo | ₱163.0M |
| G-LTO-2 Late Penalty Calculator | Consumer (direct) | ~1,155,000 annual delinquent | ₱49/use | ₱56.6M |
| G-LTO-2 (bundled professional) | — | — | See G-LTO-1 | — |
| J-CAP-1 RPAS Compliance | Consumer (direct) | ~100,900 | ₱499/yr | ₱50.3M |
| J-CAP-1 RPAS Compliance | Professional (operators) | ~400 firms | ₱1,999/mo | ₱9.6M |
| **Total TAM** | | | | **₱507.1M** |

**Notes on price assumptions:**
- G-LTO-1 uses ₱29/transaction (conservative; subscription model at ₱99/year yields ₱776.9M TAM ceiling)
- G-LTO-2 is standalone per-use; in practice it would be bundled into G-LTO-1 subscription

**SAM (Serviceable):** ₱150M — rationale: urban/semi-urban vehicle owners with smartphone access, aware of digital tools; RPAS market is nascent; professional adoption requires trust-building. Apply 30% serviceable fraction to total TAM.

**SOM Year 1 (1% of SAM):** ₱1.5M
**SOM Year 3 (5% of SAM):** ₱7.5M

---

## Key Data Sources Used

| Data Point | Source | Year | Confidence |
|-----------|--------|------|-----------|
| 14,270,000 total registered vehicles | PSA, "Gasoline-powered Vehicles Increased by 2.5 Percent in 2023" (citing LTO CY2023 data) | 2024 | OFFICIAL |
| 11,230,000 gasoline vehicles; 3,030,000 diesel vehicles | Same PSA source | 2024 | OFFICIAL |
| 8,470,000 motorcycles/tricycles Jan–Sep 2023 | LTO via Statista, 2023 | 2023 | OFFICIAL (partial year) |
| 1,270,000 registered private cars full-year 2022 | LTO via Statista | 2023 | OFFICIAL |
| 5,460,301 registered vehicles excl. motorcycles (end-2022) | CEIC Data (citing LTO) | 2023 | OFFICIAL |
| 10,900,000 vehicles in LTMS database (Jan 1, 2023) | LTO press release via PNA | 2023 | OFFICIAL |
| MVUC fee schedule (motorcycle ₱240; light car ₱1,600; etc.) | RA 8794; LTO MVUC implementing rules | 2000 (unchanged to 2024) | OFFICIAL |
| 50% MVUC surcharge for >1 month late | LTO MC, ltoportal.ph 2023 | 2023 | OFFICIAL |
| 70+ accredited CTPL insurance companies | LTO portal, ltoportal.ph | 2023 | OFFICIAL (approx.) |
| ₱10,000 fine for driving unregistered vehicle | LTO enforcement rules | 2023 | OFFICIAL |
| 1,432 active RPA Controller Certificate holders | CAAP, Drone Warfare Summit 2025 release | Oct 2025 | OFFICIAL |
| ₱1,500 + 12% VAT RPAS registration fee | CAAP website, rpa-registration-2 page | 2024 | OFFICIAL |
| ~38 million total vehicles (incl. unregistered) | LTO working estimate, media reports | 2022–2023 | ESTIMATED |
| ~113,000–226,000 recreational drone owners | DERIVED from 1-2/1,000 global ratio | 2023 | ESTIMATED |
| ~23,730,000 unregistered vehicles | DERIVED: 38M total − 14.27M registered | 2023 | ESTIMATED |

---

## Notes & Caveats

1. **MVUC fee freeze:** RA 8794 MVUC rates have not changed since implementation in 2004, despite sustained inflation. The DOTC/LTO has periodically proposed increases (most recently 2023) but none have been enacted as of 2024. Any rate increase would directly affect MVUC calculator utility and consumer urgency.

2. **5-year registration extension:** In 2023, President Marcos approved a proposal to extend new vehicle registration validity from 3 to 5 years. If enacted, this reduces annual registration transaction volume but does NOT eliminate the complexity calculation (the initial registration and subsequent renewals still require MVUC math). It may reduce G-LTO-1's annual frequency but not addressable universe.

3. **RPAS population uncertainty:** CAAP's registration statistics are not publicly aggregated. The 1,432 controller certificate figure (Oct 2025) is the only official published aggregate. The recreational drone market is substantially larger but enforcement is inconsistent; many recreational operators do not formally register small drones despite the requirement. This makes J-CAP-1 more of an early-market education tool than a direct compliance enforcer.

4. **Drone weight threshold ambiguity:** CAAP rules have evolved — as of 2023, drones >250g require registration (aligning with global CAA standards post-DJI Mini series), but historical rules only required registration for commercial operators or drones ≥7 kg. The expanding registration perimeter creates growing addressable market for J-CAP-1.

5. **Professional "fixer" disintermediation:** The PROMPT.md notes "LTO fixers / processing agents (disintermediation play)" as the professional segment. In practice, fixers are illegal (RA 9485, RA 10930) and cannot be directly sold to. The actual B2B targets are: (a) fleet managers at corporations, (b) car dealerships, (c) transport cooperatives, (d) LTO-adjacent service providers (CTPL insurers, accredited emission testing centers). Estimated 600 dealerships + 13,000 fleet firms is the legitimate professional addressable market.

6. **Data year freshness:** The 14.27 million vehicle figure is from LTO CY2023 data published by PSA. The LTMS database figure (10.9M of 13.9M) is from January 2023. These are sufficiently recent for TAM calculation purposes.
