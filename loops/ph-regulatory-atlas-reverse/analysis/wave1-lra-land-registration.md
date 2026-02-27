# Wave 1 Analysis: LRA Land Registration
**Aspect:** `lra-land-registration`
**Date:** 2026-02-27
**Status:** Complete

---

## Governing Law & Agency

| Item | Detail |
|------|--------|
| Primary statute | PD 1529 (Property Registration Decree, 1978) |
| Tax statute | NIRC Sec. 24(D) [CGT], Sec. 196 [DST], RA 7160 Sec. 135 [LGU Transfer Tax] |
| Tax procedure | RR 3-2019 (eCAR system), RMO 23-2010 (CAR revalidation), BIR Form 1706/2000-OT |
| Regulatory bodies | Land Registration Authority (LRA) / Registries of Deeds; BIR; LGU Treasurer; Notary Public |
| PD 1529 late fee | Sec. 117: double basic registration fee if instrument presented >1 year after notarization |
| CAR/eCAR validity | 2 years from issuance (NIRC Sec. 58(E)); expired = new ONETT required |

---

## The ONETT Pipeline: What Actually Happens

A Philippine real property transfer is not one computation — it is a **sequential multi-agency pipeline**, each step gating the next:

```
Deed of Sale (Notarized)
        │
        ▼  [30-day deadline]
   BIR ONETT Filing
   ├── CGT: 6% × max(GSP, BIR Zonal Value, Assessor's FMV)    [NIRC Sec. 24(D)]
   ├── DST: 1.5% × same base                                    [NIRC Sec. 196]
   └── BIR Form 1706 (individual seller) / 1707 (corporate)    [5-day DST deadline]
        │
        ▼  [15–30 working days processing]
   eCAR + Tax Clearance Certificate issued
        │
        ▼  [<2 years from eCAR issuance or re-file]
   LGU Treasurer — Transfer Tax
   └── 0.5% (provinces) to 0.75% (Metro Manila/chartered cities) × same base
        │
        ▼
   City/Municipal Assessor — Tax Declaration Transfer
   └── RPT Clearance (no unpaid real property taxes)
        │
        ▼
   Registry of Deeds (LRA) — New Title Registration
   ├── Entry Fee: ₱50/instrument
   ├── Registration Fee: 17-tier graduated table (≈ 0.25–0.50% of property value)
   ├── Annotation Fee: ₱20 per line item
   ├── Owner's Duplicate: ₱330
   └── DOUBLE FEE if >1 year since notarization (PD 1529 Sec. 117)
```

**Total cost:** 8–13% of property value across all taxes and fees.
**Typical timeline:** 2–4 months assuming complete documents and no disputes.

---

## Domains Identified

### Domain 1: Title Transfer Master Pipeline Calculator + Deadline Engine
**Score: ~3.75**

**What it computes:**
- Inputs: transaction type (sale / donation / estate / foreclosure / partition), property type (land / house+lot / condo), gross selling price, BIR zonal value (from lookup), assessor's FMV, date of notarization, LGU of property
- Outputs:
  - CGT computation (6% × base) + 30-day deadline + late penalty meter (25% surcharge + 12%/yr interest)
  - DST computation (1.5% × base) + 5-day month-end deadline + late penalty
  - LGU transfer tax (rate by LGU) + due date
  - LRA registration fee (17-tier graduated table)
  - PD 1529 Sec. 117 double-fee check (days since notarization)
  - eCAR 2-year validity countdown
  - Agency-by-agency checklist and sequence

**Governing sections:**
- NIRC Sec. 24(D): CGT rate and base
- NIRC Sec. 196: DST rate and base
- NIRC Sec. 248–250: late penalty (25% surcharge + 12%/yr interest)
- RA 7160 Sec. 135: local transfer tax authority (LGU rate-setting)
- PD 1529 Sec. 117: registration fee + double-fee penalty
- RR 3-2019: eCAR system and 2-year validity
- BIR Revenue Regulations: zonal valuation updates (by city/municipality)

**Who currently does this:** Real estate brokers / lawyers (₱5K–₱50K), processing services / runners (₱20K Metro Manila; ₱30K outside MM), fixers (₱5K–₱15K). Total professional assistance market: well-established informal economy around a mandated government process.

**Pain indicators:**
- Multi-agency: 4 agencies (BIR, LGU, Assessor, LRA) each with separate queues
- Strict deadlines: CGT within 30 days of notarization; DST within 5 days after month end. Miss either → 25% surcharge + 12%/year interest (₱192K CGT on ₱3.2M property grows to ₱235K+ after 1 year of delay)
- BIR zonal value lookup: published as PDFs per city/municipality (zonal.bir.gov.ph), no unified searchable database — the single biggest information asymmetry in the process
- Expired eCAR: if BIR processing delay causes eCAR to expire (2 years), the entire ONETT must be refiled
- PD 1529 Sec. 117 double-fee trap: parties who delay going to the RD >1 year after notarization pay double the registration fee — a poorly-known rule
- Fake title fraud: BIR and LRA verifications are the gatekeeping mechanism that exposes fraudulent titles

**Note on NIRC overlap:** CGT (NIRC Sec. 24(D)) and DST (NIRC Sec. 196) are individually covered by ph-compliance-moats-reverse. However, the integrated ONETT pipeline — combining BIR ONETT + LGU Transfer Tax + LRA Registration Fee + multi-agency deadline management — is a distinct product scope anchored in PD 1529 and LRA operations, not analyzed in the sibling loop.

---

### Domain 2: BIR Zonal Value Lookup Tool
**Score: ~3.60**

**What it computes:**
- Input: property address (street, barangay, city/municipality)
- Output: current BIR zonal value per square meter for that zone
- Governing: BIR zonal valuations issued via Revenue Regulations by district (RDO), updated periodically
- Computability: 5/5 fully deterministic — pure table lookup; data IS published, just inaccessible

**Why this matters:** Zonal value is the gating input for CGT, DST, and LGU transfer tax. Parties who underestimate zonal value underpay taxes → BIR assessment + penalties. The BIR publishes zonal value tables as PDFs by city/municipality (many hundreds of pages), with no unified, address-searchable public interface. Private services (propertyresearch.ph, etc.) have started building this but no authoritative free tool exists.

**Who currently does this:** Parties either (a) visit their BIR RDO to inquire, (b) hire a real estate broker to look it up, or (c) guess wrong and face assessment findings. Real estate lawyers charge partly for this lookup service.

---

### Domain 3: LRA Registration Fee & Annotation Fee Calculator
**Score: ~3.40**

**What it computes:**
- Input: property value (higher of GSP or zonal value), instrument type (absolute sale, mortgage, lease, adverse claim, etc.), date of notarization
- Output: registration fee (17-tier graduated table), annotation fee (₱20/line item), entry fee (₱50/instrument), owner's duplicate (₱330), double-fee flag (PD 1529 Sec. 117 if >1 year since notarization)
- Computability: 5/5 fully deterministic from published LRA fee schedule

**Why this is limited:** The LRA itself provides an ERCF (Estimate Registration Computation Fees) online calculator at lra.gov.ph/ercf/ — currently under maintenance but shows awareness of need. This domain is best as a COMPONENT of Domain 1 rather than standalone product. Annotation fees are also charged when encumbrances are inscribed on the title (mortgage, lease, adverse claim, notice of lis pendens) — useful for developers, banks, and lawyers managing portfolios.

---

### Domain 4: ONETT Deadline & Late Penalty Calculator
**Score: ~3.80**

**What it computes:**
- Inputs: date of notarization, transaction date, tax amounts (CGT, DST)
- Outputs:
  - CGT deadline: date of notarization + 30 calendar days
  - DST deadline: 5 days after end of month of notarization
  - Late penalty: 25% surcharge + 12%/year interest (NIRC Sec. 248–250) per day past deadline
  - Days remaining warning system
  - PD 1529 Sec. 117: whether double-fee threshold (1 year) has been crossed at RD filing
- Computability: 5/5 fully deterministic

**Why this is high pain:** Real estate transactions often have date mismatches — deed is notarized, then parties wait for "best conditions" to file. 30-day CGT deadline is frequently missed. Once missed, the penalty grows daily. Borrowers also sometimes let their eCAR expire (2-year validity) by delaying the RD registration step. A simple deadline tracker with warning system prevents substantial penalties.

---

## Market Size Assessment

Exact annual LRA transaction volumes are not publicly indexed (LRA's property transaction statistics page has downloadable data not accessible via search). Proxies:

| Proxy | Figure |
|-------|--------|
| Pag-IBIG housing loans released 2023 | 90,616 (₱129.73B) |
| Building permits issued 2024 | 116,427 residential |
| Real estate sector GVA 2023 | ₱564B |
| Bank residential RE loans | Large portfolio (BSP-tracked) |
| Metro Manila condo stock | 162,510 units (growing) |
| Philippine titled properties (rough estimate) | ~50M titles total |

Conservative estimate: **400K–800K total real property transfer transactions per year** across all transaction types (sale, estate, donation, partition, foreclosure). Each transaction requires at minimum 2–4 agency filings. The universe of people who need the ONETT pipeline each year is likely **well above 500K**.

---

## Professional Fee Validation

| Service Provider | Fee Range |
|-----------------|-----------|
| Processing service (Metro Manila) | ₱20,000 flat |
| Processing service (outside MM) | ₱30,000 flat |
| Liaison/runner | ₱5,000–₱15,000 |
| Real estate lawyer (full handling) | ₱5,000–₱50,000 |
| Notarial fee for Deed of Sale | ₱1,000–₱10,000 (≈1% for large deals) |
| Real estate broker commission (separate) | 3–5% of selling price |

**Moat assessment:** Processing services at ₱20K–₱30K per transaction (flat fee) is a **real but accessible moat** — not a Big-4 accounting firm monopoly, but not DIY-able for most Filipinos given multi-agency complexity. Moat depth: **3/5** (needs bookkeeper/broker level knowledge, not lawyer-exclusive).

---

## Summary Scores

| Domain | Market | Moat | Computability | Pain | **Opportunity** |
|--------|--------|------|---------------|------|----------------|
| 1. ONETT Pipeline Calculator | 4 | 3 | 4 | 4 | **3.75** |
| 2. BIR Zonal Value Lookup | 5 | 1 | 5 | 3 | **3.60** |
| 3. LRA Registration Fee Calc | 4 | 2 | 5 | 2 | **3.40** |
| 4. ONETT Deadline & Penalty | 4 | 2 | 5 | 4 | **3.80** |

_Formula: (Market×0.25) + (Moat×0.25) + (Computability×0.30) + (Pain×0.20)_

---

## Top Opportunity: "Transfer PH" — ONETT Pipeline + Deadline Engine

**Combined Domains 1 + 4 (+ 2 as data layer, + 3 as component)**

**What it is:** A property transfer orchestration tool that:
1. Accepts deal parameters (transaction type, property details, location, GSP, date of notarization)
2. Looks up BIR zonal value for the address (Domain 2 as data layer)
3. Computes all ONETT taxes: CGT, DST, LGU transfer tax, LRA registration fee (Domains 1 + 3)
4. Sets deadline calendar with live countdown for 30-day CGT and 5-day DST deadlines (Domain 4)
5. Checks PD 1529 Sec. 117 double-fee threshold and eCAR 2-year expiry
6. Generates per-agency document checklist (by transaction type)

**"Inheritance engine equivalent":** This is like the inheritance calculator (estate tax computation + estate settlement workflow) but for INTER VIVOS real property transfers — the other major life event requiring property title issuance.

**Why it's automatable:** Every computation is statutory:
- CGT: 6% × max(GSP, BIR Zonal, Assessor's FMV) — one formula
- DST: 1.5% × same base — one formula
- LGU Transfer Tax: lookup table by LGU (finite set, ~150+ LGUs with published rates)
- LRA Registration Fee: 17-tier graduated table — published in LRA circular
- Late penalties: 25% surcharge + 12%/yr daily interest — NIRC Sec. 248–250, one formula
- PD 1529 Sec. 117 double-fee: date arithmetic (days since notarization > 365)
- eCAR expiry: date arithmetic (2 years from issuance)

**What moat it disrupts:** ₱20K–₱30K flat fee per transaction from processing services; ₱5K–₱50K from lawyers. With 500K+ transactions/year, the total addressable market for professional assistance alone is **₱10B–₱25B+/year** in the informal service economy around a mandated government process.

**Key competitive edge over LRA's own ERCF:** LRA's ERCF (currently under maintenance) only covers the LRA registration fee — not CGT, not DST, not transfer tax, not deadlines, not checklists. The gap is the integrated multi-agency view.

---

## Sources

- PD 1529 Property Registration Decree (Sec. 117 — registration fees, double-fee penalty)
- NIRC Sec. 24(D) (CGT on real property), Sec. 196 (DST), Sec. 248–250 (penalties)
- RA 7160 Sec. 135 (LGU transfer tax authority)
- RR 3-2019 (eCAR system implementation)
- LRA ERCF: https://lra.gov.ph/ercf/ (under maintenance as of 2026-02-27)
- LRA Property Transaction Statistics: https://lra.gov.ph/property-transaction-statistics/
- ForeclosurePhilippines.com: https://www.foreclosurephilippines.com/how-to-compute-registration-fees/
- Respicio & Co: https://www.respicio.ph/commentaries/estimated-cost-of-land-title-registration-in-the-philippines
- Lamudi cost guide: https://www.lamudi.com.ph/journal/qa-how-much-does-it-cost-to-transfer-a-land-title-in-the-philippines/
- FileDocsPhil guide: https://www.filedocsphil.com/transfer-land-title-in-the-philippines-a-complete-guide/
- KeyRealty cost breakdown: https://keyrealty.ph/how-much-does-a-title-transfer-cost-in-the-philippines/
