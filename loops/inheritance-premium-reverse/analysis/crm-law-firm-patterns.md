# CRM Law Firm Patterns — Analysis

## Overview

Research into CRM features, client data models, and UX patterns relevant to solo and small Philippine estate law practices. Covers top tools (Clio, MyCase, PracticePanther, Lawmatics), common patterns, PH-specific fields, and pricing models.

---

## 1. Feature Matrix — Top Legal CRM Tools

| Feature | Clio | MyCase | PracticePanther | Lawmatics | Bigin/Zoho |
|---------|------|--------|-----------------|-----------|------------|
| Client intake forms | ✅ (Clio Grow) | ✅ Custom fields | ✅ Custom fields | ✅ Best-in-class | ✅ Basic |
| Conflict of interest check | ✅ Across all data | ✅ | ✅ | ✅ | ❌ |
| Lead/pipeline management | ✅ (Grow) | ✅ | ✅ | ✅ Advanced | ✅ |
| Document automation | ✅ Templates | ✅ | ✅ | ✅ | Limited |
| E-signatures | ✅ Unlimited (Advanced+) | ✅ | ✅ | ✅ | ❌ |
| Time tracking | ✅ | ✅ | ✅ | ❌ | Limited |
| Billing & invoicing | ✅ | ✅ | ✅ PantherPayments | ❌ | ✅ |
| Client portal | ✅ | ✅ | ✅ | ✅ | ❌ |
| Marketing automation | ❌ (needs Grow) | ❌ | ❌ | ✅ Best-in-class | ❌ |
| Appointment booking | ✅ | ✅ | ✅ | ✅ | ❌ |
| Reporting & analytics | ✅ Business intelligence | ✅ Real-time | ⚠️ Limited | ✅ | ✅ |
| 250+ integrations | ✅ | Limited | ✅ Broad | Limited | ✅ |
| AI features | ✅ Clio Duo | ❌ | ❌ | Limited | ❌ |
| Mobile app | ✅ | ✅ | ✅ | ✅ | ✅ |

**Pricing (per seat/month, annual billing):**

| Tool | Solo Entry | Professional | Enterprise |
|------|-----------|-------------|------------|
| Clio Manage | $39 | $79–$109 | $139 |
| Clio Grow (CRM add-on) | $49 | $49 | $49 |
| MyCase | $39 | $79 | $99 |
| PracticePanther | $49 | $69 | $89 |
| Lawmatics | ~$99 (contact) | custom | custom |
| Bigin/Zoho | $7–$15 | $23 | $40 |

**Market intelligence:**
- 78% of law firms have CRM software; only 7% actively use it
- 60% of law firms never answer email inquiries — enormous response-time gap
- 95% of legal software buyers prefer integrated suites over point solutions
- 26% of firms actively integrating gen AI (2025 Thomson Reuters survey, up from 14% in 2024)

---

## 2. Common Client Data Model

Based on Clio, MyCase, and estate-planning-specific tools (DecisionVault, Estateably, Just Vanilla):

```sql
-- Core client entity
CREATE TABLE clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id         UUID NOT NULL REFERENCES firms(id),

  -- Identity
  full_name       TEXT NOT NULL,
  nickname        TEXT,
  date_of_birth   DATE,
  place_of_birth  TEXT,
  nationality     TEXT DEFAULT 'Filipino',
  civil_status    TEXT CHECK (civil_status IN ('single','married','widowed','legally_separated','annulled')),

  -- Contact
  email           TEXT,
  phone_mobile    TEXT,
  phone_landline  TEXT,
  address_street  TEXT,
  address_city    TEXT,
  address_province TEXT,
  address_zip     TEXT,
  preferred_contact TEXT CHECK (preferred_contact IN ('email','phone','sms')) DEFAULT 'email',

  -- Philippine-specific
  tin             TEXT,           -- XXX-XXX-XXX format
  philsys_id      TEXT,           -- PhilSys national ID
  passport_no     TEXT,
  drivers_license TEXT,
  sss_gsis_no     TEXT,           -- SSS or GSIS number

  -- Professional context
  occupation      TEXT,
  employer        TEXT,

  -- Intake metadata
  referral_source TEXT,
  intake_date     DATE DEFAULT CURRENT_DATE,
  conflict_cleared BOOLEAN DEFAULT FALSE,
  conflict_notes  TEXT,

  -- Relationship
  spouse_name     TEXT,           -- Denormalized for quick display

  -- Timestamps
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Government ID types for PH lawyers
-- Accepted IDs: PhilSys, Passport, Driver's License, PRC ID, IBP ID,
-- COMELEC Voter's ID, SSS/GSIS ID, Postal ID, Senior Citizen ID
```

**Philippine-specific required fields for estate cases:**
- TIN: `XXX-XXX-XXX` (9 digits, no letters) — required for BIR Form 1801
- PhilSys National ID — new primary ID since 2021 Philippine Identification System Act
- Civil status — determines property regime (ACP vs. CPG)
- Place of birth — used in affidavits and court filings

---

## 3. Client Intake Workflow for Estate Cases

### Stage 1: Pre-Engagement (Conflict Check)
```
1. Capture: full name, DOB, relationship to decedent
2. Run conflict check against all existing clients/heirs
3. If conflict → flag and refer out
4. If clear → proceed to full intake
```

### Stage 2: Full Intake Form
Estate planning-specific sections (beyond generic contact info):

```
Section A: Client Information
  - Full legal name (as on government ID)
  - Government ID type + number
  - TIN
  - Civil status + date/place of marriage (if married)
  - Property regime (ACP / CPG / Conjugal / Separation of property)
  - Contact info

Section B: Decedent Information (for estate settlement)
  - Full name of decedent
  - Date and place of death
  - Certificate of death number
  - TIN of decedent
  - Civil status at time of death
  - Last known address
  - Was a will executed? (Yes/No)
  - If yes: Where is the will? Notarial? Holographic?

Section C: Family Composition
  - Surviving spouse (name, TIN, DOB)
  - Children (list: name, DOB, legitimate/illegitimate)
  - Predeceased children (with their own children?)
  - Parents (if no children)
  - Siblings (if no parents, no children)

Section D: Estate Assets (preliminary)
  - Real property (TCT/OCT number, location, estimated value)
  - Personal property (vehicles, bank accounts, investments)
  - Business interests
  - Foreign assets
  - Debts and obligations (mortgages, loans)

Section E: Prior Planning
  - Existing will? (yes/no)
  - Prior extrajudicial settlements?
  - Prior BIR filings?
  - Prior probate proceedings?

Section F: Engagement
  - Scope of engagement
  - Fee agreement
  - Initial retainer amount
```

### Stage 3: Case Creation
- Create new case linked to client
- Assign case type: Testate / Intestate / Estate Planning
- Set preliminary status: Consultation / Engaged / Active / Pending BIR / Pending Court / Settled
- Schedule follow-up

---

## 4. Relationship Modeling: Client ↔ Cases ↔ Heirs

The key insight for estate law: **a person can be both a client AND an heir in different cases.**

```
Client A (retaining lawyer) ──── pays, instructs
      |
      └── Case #001 (Estate of Decedent X)
            |
            ├── Heir: Client A (also the surviving spouse)
            ├── Heir: Juan dela Cruz (not a client, just a person)
            ├── Heir: Maria Cruz (heir who has her OWN case at this firm)
            └── Heir: Jose Cruz (minor, represented by guardian Client A)

Client B (same firm, different matter)
      └── Case #002 (Estate Planning)
            └── Beneficiary: Maria Cruz (same person as heir above)
```

**Data model pattern:**
```sql
-- Persons (contact pool, not clients per se)
CREATE TABLE persons (
  id          UUID PRIMARY KEY,
  firm_id     UUID REFERENCES firms(id),
  full_name   TEXT NOT NULL,
  tin         TEXT,
  dob         DATE,
  -- ... contact fields
);

-- Clients are persons who have engaged the firm
CREATE TABLE clients (
  id          UUID PRIMARY KEY,
  person_id   UUID REFERENCES persons(id),
  firm_id     UUID REFERENCES firms(id),
  intake_date DATE,
  status      TEXT -- prospect, active, inactive, former
);

-- Cases link to clients; heirs are resolved against persons pool
CREATE TABLE cases (
  id          UUID PRIMARY KEY,
  client_id   UUID REFERENCES clients(id),
  -- ... case fields
);

-- Heirs in a case are matched to persons where possible
CREATE TABLE case_heirs (
  id          UUID PRIMARY KEY,
  case_id     UUID REFERENCES cases(id),
  person_id   UUID REFERENCES persons(id), -- NULL if unknown/not in system
  heir_name   TEXT,   -- always stored directly too (from engine input)
  role        TEXT,   -- 'heir', 'executor', 'administrator'
);
```

**Important:** For the PH inheritance calculator, the `family_tree` input already captures heirs. The CRM layer should allow optionally linking these to `persons` in the contact pool for richer cross-case visibility.

---

## 5. Client List UI Patterns

### List View (from Clio/MyCase patterns)
```
┌─────────────────────────────────────────────────────────────────┐
│ Clients                                    [+ New Client]       │
│                                                                 │
│ Search: [___________________] Filter: [All ▼] Sort: [Name ▼]   │
│                                                                 │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ NAME             CASES  LAST ACTIVITY    STATUS           │  │
│ ├────────────────────────────────────────────────────────────┤  │
│ │ Reyes, Maria     3      Feb 25, 2026     Active           │  │
│ │ Santos, Juan     1      Feb 20, 2026     Active           │  │
│ │ Cruz, Ana        2      Jan 15, 2026     Pending BIR      │  │
│ │ Bautista, Jose   1      Dec 10, 2025     Settled          │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                           Page 1 of 3  [>]     │
└─────────────────────────────────────────────────────────────────┘
```

**Filter options for estate practice:**
- Status: Active / Pending BIR / Pending Court / Settled / All
- Matter type: Testate / Intestate / Estate Planning
- Date range: intake date or last activity
- Assigned attorney (for multi-seat firms)

### Detail View
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Clients     Maria Santos Reyes                [Edit] [+ Case]│
│                                                                 │
│ CONTACT INFO                    IDENTIFIERS                     │
│ maria.reyes@email.com           TIN: 123-456-789                │
│ +63 917 123 4567                PhilSys: 1234-5678-9012         │
│ Makati City, Metro Manila       Civil status: Widowed           │
│                                                                 │
│ CASES (3)                                                       │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ Case #001 — Estate of Pedro Reyes    Active   Feb 2026     │  │
│ │ Case #002 — Donation to Children     Draft    Jan 2026     │  │
│ │ Case #003 — Estate Planning          Settled  Nov 2025     │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                 │
│ NOTES                                                           │
│ "Client prefers morning appointments. Referred by Atty. Cruz." │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Philippine-Specific Fields & Requirements

### Government ID Types (commonly accepted in PH legal documents)
```typescript
enum PHGovernmentIdType {
  PHILSYS     = "Philippine National ID (PhilSys)",
  PASSPORT    = "Philippine Passport",
  DRIVERS     = "Driver's License (LTO)",
  PRC_ID      = "PRC Professional ID",
  IBP_ID      = "IBP Identification Card",
  VOTER_ID    = "COMELEC Voter's ID",
  SSS_ID      = "SSS ID",
  GSIS_ID     = "GSIS ID",
  POSTAL_ID   = "Postal ID",
  SENIOR_ID   = "Senior Citizen ID",
  COMPANY_ID  = "Company ID with notarized certification",
}
```

### TIN Format Validation
```typescript
// Format: XXX-XXX-XXX (individual) or XXX-XXX-XXX-XXX (corporate branches)
const TIN_REGEX = /^\d{3}-\d{3}-\d{3}(-\d{3})?$/;

function validateTIN(tin: string): boolean {
  return TIN_REGEX.test(tin);
}
```

### Civil Status → Property Regime Implications
```typescript
// Critical for inheritance computation
const PROPERTY_REGIME_MAP = {
  married_before_aug_3_1988: "CPG",  // Conjugal Partnership of Gains
  married_after_aug_3_1988: "ACP",   // Absolute Community of Property (default under FC)
  married_with_prenup_sep: "SPG",    // Separation of Property (prenup)
  married_with_prenup_cpg: "CPG",    // Conjugal by prenup (older marriages)
  widowed: null,                      // Regime ended at death
  single: null,
  separated: null,
};
```

### Philippine Regional Courts (for probate filings)
- **Metro Manila:** Regional Trial Courts (RTCs) in each city (Makati, Pasig, Manila, QC)
- **Probate jurisdiction:** Where decedent resided at time of death
- **Field needed:** `probate_court_branch` — text field for filing reference

---

## 7. UX Patterns Worth Adopting

### From Clio
1. **Conflict check on intake** — search across all clients/heirs before accepting new matter
2. **Document packet automation** — generate intake letter + engagement agreement from template
3. **Automated appointment booking** — client picks slot from lawyer's calendar

### From MyCase
1. **Custom fields by case type** — show different fields for Testate vs. Intestate
2. **Split billing** — useful when multiple heirs share legal costs
3. **Dynamic forms** — adapt intake questions based on answers (e.g., if "has children" → show children section)

### From Lawmatics
1. **Marketing intake funnel** — convert website inquiry to intake form automatically
2. **E-signature on engagement letter** — critical for PH e-commerce-ready lawyers
3. **Intake form abandonment tracking**

### Estate-Specific Patterns (from DecisionVault, Estateably)
1. **Family tree visualizer** — interactive diagram of heirs and relationships
2. **Asset inventory builder** — guided asset input with type categorization
3. **Beneficiary designation tracker** — list all assets + their designated beneficiaries
4. **Fiduciary tracker** — who is executor, trustee, guardian, POA holder

---

## 8. Pricing Model Recommendations

### Market Benchmarks
- Entry: $30–$50/seat/month
- Professional: $70–$110/seat/month
- Enterprise: $130+/seat/month

### Models Compared for This Platform

| Model | Pros | Cons | Verdict |
|-------|------|------|---------|
| Per-seat | Predictable, simple | Penalizes small solo firms | OK for multi-seat tier |
| Per-case | Scales with work | Unpredictable for high-volume | Good for pay-as-you-go |
| Flat monthly (solo) | Zero friction, best for adoption | Revenue ceiling | Best for solo launch |
| Tiered flat | Easy to understand tiers | Feature gating complexity | Industry standard |

### Recommended Tiered Model for PH Market
```
Free Tier     — ₱0/month
  • 3 cases lifetime
  • Core computation (no auth)
  • Basic PDF export (watermarked)
  • No client CRM

Solo Tier     — ₱999/month (~$17 USD)
  • Unlimited cases
  • Full PDF export (firm-branded)
  • Client profiles (up to 50 clients)
  • Case notes
  • Shareable links
  • 1 user only

Firm Tier     — ₱2,999/month per seat (~$52 USD)
  • Everything in Solo
  • Multi-seat (3+ users)
  • Role-based access
  • Shared client pool
  • Admin dashboard
  • Priority support
```

**Rationale:**
- PH market pricing power is lower than US/EU — $17/month is accessible for solo practitioners
- ₱999 is below the "impulse buy" threshold for professionals (< one billable hour)
- Per-seat at Firm tier aligns with international legal SaaS benchmarks ($50/seat)
- Free tier drives viral growth (shareable links, watermarked PDFs show brand)

---

## 9. Key Findings & Gaps

### What NO competitor offers (moat opportunities)
1. **Philippine Civil Code-native computation** — no tool encodes NCC succession rules
2. **WASM-speed inheritance calculation** — sub-second, privacy-first (no server)
3. **BIR Form 1801 integration** — automatic estate tax computation linked to inheritance shares
4. **PH-specific government ID types** — international tools use SSN/passport only
5. **NCC article citations in output** — legal authority built into every share

### Pain points from competitive research
- International tools (Clio, MyCase) have no Philippine-specific fields or legal frameworks
- PH lawyers currently use Excel for inheritance computation + manual BIR calculations
- No tool generates compliant PH court-ready distribution reports
- No online tool handles the difference between testate and intestate succession under NCC

### Discovered Features (worth adding to Wave 2)
1. **spec-conflict-check** — Search existing clients/heirs before new case intake. PH bar ethics require this.
2. **spec-intake-form** — Guided digital intake form capturing decedent info, family composition, asset summary. Separate from core CRM spec.
3. **spec-family-tree-visualizer** — Interactive heir tree visualization (separate from distribution table). Makes complex succession scenarios understandable at a glance.

---

## Sources

- [Best Law Firm Software for Solo Attorneys 2025 | LegalGPS](https://www.legalgps.com/solo-attorney/best-law-firm-software)
- [Best CRM Software for Law Firms 2025 | MyCase](https://www.mycase.com/blog/client-management/best-crm-for-law-firms/)
- [Clio Legal Software Plans & Pricing](https://www.clio.com/pricing/)
- [Clio Features](https://www.clio.com/features/)
- [PracticePanther vs MyCase | SelectHub](https://www.selecthub.com/legal-software/mycase-vs-practicepanther/)
- [Legal Tech Pricing Models | Legal Tech MG](https://blog.legaltechmg.com/why-saas-doesnt-always-work-in-legal)
- [Law Practice Management Software Costs | RunSensible](https://www.runsensible.com/blog/law-practice-management-software-costs/)
- [Estate Planning CRM | Maximizer CRM](https://www.maximizer.com/solutions/crm-for-estate-planning/)
- [Best Software for Estate Planning Attorneys | MyCase](https://www.mycase.com/blog/legal-case-management/best-estate-planning-attorney-software/)
- [Philippine TIN Format | TaxDo](https://taxdo.com/resources/global-tax-id-validation-guide/philippines)
- [TIN Legal Requirements | Respicio & Co.](https://www.lawyer-philippines.com/articles/clarification-on-the-legal-aspects-and-requirements-of-tax-identification-numbers-tin-in-the-philippines)
- [Client Intake Form Estate Planning | B12](https://www.b12.io/resource-center/client-intake/what-information-should-your-estate-planning-firms-intake-form-require.html)
- [Lawmatics Solo Practitioner CRM](https://www.lawmatics.com/practice-types/solo-practitioner)
