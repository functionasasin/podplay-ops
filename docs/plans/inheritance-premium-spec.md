# Philippine Inheritance Premium Platform — Master Specification

**Version:** 1.0
**Date:** 2026-03-01
**Status:** Complete
**Synthesized from:** 33 analysis files across 2 research waves

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Data Model](#3-data-model)
4. [Feature Specifications](#4-feature-specifications)
   - 4.1 [PDF Export](#41-pdf-export)
   - 4.2 [Auth & Persistence](#42-auth--persistence)
   - 4.3 [Client Profiles](#43-client-profiles)
   - 4.4 [Firm Branding](#44-firm-branding)
   - 4.5 [Statute Citations UI](#45-statute-citations-ui)
   - 4.6 [Case Notes](#46-case-notes)
   - 4.7 [Print Layout](#47-print-layout)
   - 4.8 [Scenario Comparison](#48-scenario-comparison)
   - 4.9 [BIR Form 1801 Integration](#49-bir-form-1801-integration)
   - 4.10 [Shareable Links](#410-shareable-links)
   - 4.11 [Multi-Seat Firm Accounts](#411-multi-seat-firm-accounts)
   - 4.12 [Share Breakdown Panel](#412-share-breakdown-panel)
   - 4.13 [Decedent Header](#413-decedent-header)
   - 4.14 [Representation Display](#414-representation-display)
   - 4.15 [Donation Summary in Results](#415-donation-summary-in-results)
   - 4.16 [Case Export ZIP](#416-case-export-zip)
   - 4.17 [Conflict of Interest Check](#417-conflict-of-interest-check)
   - 4.18 [Guided Client Intake Form](#418-guided-client-intake-form)
   - 4.19 [Family Tree Visualizer](#419-family-tree-visualizer)
   - 4.20 [Deadline Tracker](#420-deadline-tracker)
   - 4.21 [Timeline Report](#421-timeline-report)
   - 4.22 [Document Checklist](#422-document-checklist)
   - 4.23 [Estate Tax Inputs Wizard](#423-estate-tax-inputs-wizard)
5. [Implementation Order](#5-implementation-order)
6. [Tech Stack & Dependencies](#6-tech-stack--dependencies)
7. [Migration Strategy](#7-migration-strategy)
8. [Acceptance Criteria](#8-acceptance-criteria)

---

## 1. Executive Summary

The Philippine Inheritance Premium Platform transforms a standalone Philippine inheritance distribution WASM calculator into a full-featured professional estate planning and settlement platform for Filipino estate lawyers.

### Target User

Solo estate lawyers and small PH law firms (1–5 attorneys) handling estate settlement matters under the Philippine Civil Code and TRAIN Law. Primary workflows: client intake → inheritance computation → BIR Form 1801 preparation → extrajudicial settlement → title transfer.

### Core Value Proposition

- **Computation accuracy**: Rust WASM engine handles all 15+ intestate and testate succession scenarios correctly (legitime, preterition, representation, disinheritance, collateral succession)
- **Professional output**: PDF reports with firm letterhead, NCC statute citations, distribution tables, per-heir breakdowns, and computation narratives — court-presentable quality
- **Compliance tracking**: Automatic BIR deadline calendar from date of death, document checklist, settlement timeline for clients
- **Estate tax integration**: BIR Form 1801 inputs wizard + `max(0, Item40 − Item44)` bridge to inheritance computation
- **Practice management**: Client CRM with conflict-of-interest screening (CPRA Canon III §14), case management, case notes, multi-attorney firm accounts

### What Already Exists (Not Re-specified Here)

- Rust inheritance engine (`docs/plans/inheritance-engine-spec.md`) — correct, battle-tested
- React 19 + Vite frontend with wizard + results view (`loops/inheritance-frontend-forward/app/src/`)
- WASM bridge: `compute_json(json: string) => string`
- All 7 `getResultsLayout()` distribution variants
- Existing `EngineInput` / `EngineOutput` TypeScript types

### What This Spec Adds

23 premium features across 5 categories, all specified at implementation level with complete DDL, TypeScript types, API contracts, component hierarchies, and acceptance criteria.

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    React 19 SPA (Vite)                          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  Wizard      │  │  Results     │  │  Case Management      │  │
│  │  (existing)  │  │  (extended)  │  │  (new: §4.2–4.23)     │  │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬───────────┘  │
│         │                 │                       │              │
│  ┌──────┴─────────────────┴───────────────────────┴───────────┐  │
│  │                  App State Machine                          │  │
│  │    wizard | computing | results | loading-case | error      │  │
│  └──────────────────────────────┬──────────────────────────────┘  │
└─────────────────────────────────┼───────────────────────────────┘
                                  │
          ┌───────────────────────┴───────────────────────┐
          │                                               │
   ┌──────┴──────┐                              ┌─────────┴────────┐
   │  WASM Bridge │                              │  Supabase Client │
   │  compute_json│                              │  (JS SDK v2)     │
   └──────┬──────┘                              └─────────┬────────┘
          │                                               │
   ┌──────┴──────┐                  ┌────────────────────┬┴──────────────┐
   │ Rust Engine │                  │   PostgreSQL       │   Storage     │
   │   (WASM)    │                  │   (RLS-secured)    │  firm-logos   │
   └─────────────┘                  └────────────────────┴───────────────┘
```

### 2.2 AppState Machine

```typescript
type AppState =
  | { phase: 'wizard'; input: Partial<EngineInput> }
  | { phase: 'computing' }
  | { phase: 'results'; input: EngineInput; output: EngineOutput; caseId?: string }
  | { phase: 'loading-case'; caseId: string }
  | { phase: 'error'; message: string }
```

### 2.3 Route Structure

```
/                    → Dashboard (case list) — requires auth
/auth                → Login/signup
/cases/new           → Wizard (anonymous or authenticated)
/cases/:id           → Case editor + results + all premium panels
/cases/:id/tax       → Estate tax inputs wizard (§4.23)
/clients             → Client list — requires auth
/clients/new         → Conflict check → client details (§4.17 + §4.3)
/clients/:id         → Client detail page
/deadlines           → All-cases deadline summary (§4.20)
/settings            → Firm profile + branding (§4.4)
/settings/team       → Seat management + invitations (§4.11)
/share/:token        → Read-only shared case view (§4.10)
```

### 2.4 Key Data Flow

```
EngineInput (wizard form state)
     ↓
WASM: compute_json(JSON.stringify(input)) → JSON.parse(result) → EngineOutput
     ↓
ResultsView renders:
  - DistributionSection (extended with §4.5, §4.12, §4.13, §4.14, §4.15)
  - FamilyTreeTab (§4.19)
  - NarrativePanel
  - ComputationLog + WarningsPanel
  - ActionsBar (PDF §4.1, Print §4.7, Save §4.2, Share §4.10, ZIP §4.16, Compare §4.8)
     ↓
Supabase: cases.input_json + output_json (auto-saved, §4.2)
     ↓
Estate Tax Wizard (§4.23) → EstateTaxEngineInput → cases.tax_input_json
     ↓
Estate Tax WASM → EstateTaxEngineOutput → cases.tax_output_json
     ↓
Bridge: net_distributable_estate = max(0, Item40 − Item44) → re-run inheritance engine (§4.9)
```

---

## 3. Data Model

### 3.1 Entity-Relationship Diagram

```
  auth.users (Supabase managed)
       │ 1
       ├──────── 1 ──────── user_profiles
       │                    (firm branding, credentials)
       │ N                N
       └──── organization_members ──── organizations
              org_id, user_id, role    id, name, slug, plan, seat_limit
                          │
                          │ 1
             ┌────────────┼──────────────────────────────┐
             │            │                              │
             N            N                              N
          clients      cases                   organization_invitations
          (per org)    (per org)                (token, email, role)
             │            │
             └──── FK ────┘ (client_id nullable)
                          │
            ┌─────────────┼─────────────────────┐
            │             │             │        │
            N             N             N        N
       case_notes  case_deadlines  case_documents  conflict_check_log
       (append-only) (milestones)  (checklist)     (per org + client)
```

**Cardinality:**
- 1 organization → N members, N clients, N cases, N invitations
- 1 client → N cases (client_id nullable on cases)
- 1 case → N case_notes, N case_deadlines, N case_documents
- 1 organization → N conflict_check_log entries

### 3.2 PostgreSQL Extensions

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- trigram fuzzy search (conflict-check)
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- UUID generation
```

### 3.3 Enumerated Types

```sql
CREATE TYPE case_status AS ENUM ('draft', 'computed', 'finalized', 'archived');
CREATE TYPE client_status AS ENUM ('active', 'former');
CREATE TYPE org_role AS ENUM ('admin', 'attorney', 'paralegal', 'readonly');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');
CREATE TYPE conflict_outcome AS ENUM (
  'clear', 'flagged', 'cleared_after_review', 'skipped'
);
CREATE TYPE gov_id_type AS ENUM (
  'philsys_id', 'passport', 'drivers_license', 'sss', 'gsis', 'prc',
  'voters_id', 'postal_id', 'senior_citizen_id', 'umid', 'nbi_clearance'
);
```

### 3.4 Organizations Table

```sql
CREATE TABLE organizations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  slug        TEXT        NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9\-]{3,60}$'),
  plan        TEXT        NOT NULL DEFAULT 'solo'
                          CHECK (plan IN ('solo', 'team', 'firm')),
  seat_limit  INT         NOT NULL DEFAULT 1 CHECK (seat_limit >= 1),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Plans: solo=1 seat, team=5 seats, firm=unlimited (seat_limit=9999)
```

### 3.5 Organization Members Table

```sql
CREATE TABLE organization_members (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       org_role    NOT NULL DEFAULT 'attorney',
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (org_id, user_id)
);

CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX idx_org_members_org_id  ON organization_members(org_id);
```

### 3.6 Organization Invitations Table

```sql
CREATE TABLE organization_invitations (
  id          UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID              NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email       TEXT              NOT NULL,
  role        org_role          NOT NULL DEFAULT 'attorney',
  token       UUID              NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  status      invitation_status NOT NULL DEFAULT 'pending',
  invited_by  UUID              NOT NULL REFERENCES auth.users(id),
  expires_at  TIMESTAMPTZ       NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invitations_token  ON organization_invitations(token);
CREATE INDEX idx_invitations_email  ON organization_invitations(email);
CREATE INDEX idx_invitations_org_id ON organization_invitations(org_id, status);
```

### 3.7 User Profiles Table (includes Firm Branding)

```sql
CREATE TABLE user_profiles (
  id                   UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                TEXT        NOT NULL,
  full_name            TEXT,
  firm_name            TEXT        CHECK (char_length(firm_name) <= 200),
  firm_address         TEXT        CHECK (char_length(firm_address) <= 500),
  firm_phone           TEXT,
  firm_email           TEXT,
  counsel_name         TEXT,
  counsel_email        TEXT,
  counsel_phone        TEXT,
  ibp_roll_no          TEXT,       -- IBP Roll No. 123456
  ptr_no               TEXT,       -- Professional Tax Receipt number
  mcle_compliance_no   TEXT,       -- MCLE Compliance No. VII-0012345
  logo_url             TEXT,       -- Supabase Storage path in "firm-logos" bucket
  letterhead_color     TEXT        NOT NULL DEFAULT '#1E3A5F',
  secondary_color      TEXT        NOT NULL DEFAULT '#C9A84C',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_profiles_own" ON user_profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
```

### 3.8 Clients Table

```sql
CREATE TABLE clients (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name         TEXT         NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 200),
  nickname          TEXT,
  date_of_birth     DATE,
  place_of_birth    TEXT,
  email             TEXT,
  phone             TEXT,
  address           TEXT,
  tin               TEXT         CHECK (tin IS NULL OR tin ~ '^\d{3}-\d{3}-\d{3}(-\d{3})?$'),
  gov_id_type       gov_id_type,
  gov_id_number     TEXT,
  civil_status      TEXT         CHECK (civil_status IN (
                                   'single', 'married', 'widowed',
                                   'legally_separated', 'annulled')),
  status            client_status NOT NULL DEFAULT 'active',
  intake_date       DATE          NOT NULL DEFAULT CURRENT_DATE,
  referral_source   TEXT,
  conflict_cleared  BOOLEAN,     -- NULL=not checked, TRUE=cleared, FALSE=skipped/flagged
  conflict_notes    TEXT,
  created_by        UUID         REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_clients_org_id    ON clients(org_id);
CREATE INDEX idx_clients_status    ON clients(org_id, status);
CREATE INDEX idx_clients_name_trgm ON clients USING gin(full_name gin_trgm_ops);
CREATE INDEX idx_clients_tin       ON clients(tin) WHERE tin IS NOT NULL;

CREATE POLICY "clients_org_member" ON clients
  FOR ALL USING (
    org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
  ) WITH CHECK (
    org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
  );
```

### 3.9 Cases Table

```sql
CREATE TABLE cases (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                 UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id                UUID        NOT NULL REFERENCES auth.users(id),
  client_id              UUID        REFERENCES clients(id) ON DELETE SET NULL,
  title                  TEXT        NOT NULL DEFAULT 'Untitled Case'
                                     CHECK (char_length(title) <= 300),
  status                 case_status NOT NULL DEFAULT 'draft',
  input_json             JSONB,      -- EngineInput type
  output_json            JSONB,      -- EngineOutput type
  tax_input_json         JSONB,      -- EstateTaxWizardState (§4.23)
  tax_output_json        JSONB,      -- EstateTaxEngineOutput
  comparison_input_json  JSONB,      -- EngineInput with will: null (§4.8)
  comparison_output_json JSONB,      -- EngineOutput (intestate result)
  comparison_ran_at      TIMESTAMPTZ,
  decedent_name          TEXT,       -- mirrors input_json->decedent->name
  date_of_death          DATE,       -- mirrors input_json->decedent->date_of_death
  gross_estate           NUMERIC(16,2), -- mirrors tax_input_json total gross estate
  share_token            UUID        UNIQUE DEFAULT gen_random_uuid(),
  share_enabled          BOOLEAN     NOT NULL DEFAULT FALSE,
  notes_count            INT         NOT NULL DEFAULT 0,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_cases_org_id      ON cases(org_id);
CREATE INDEX idx_cases_user_id     ON cases(user_id);
CREATE INDEX idx_cases_client_id   ON cases(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_cases_status      ON cases(org_id, status);
CREATE INDEX idx_cases_updated_at  ON cases(org_id, updated_at DESC);
CREATE INDEX idx_cases_share_token ON cases(share_token) WHERE share_enabled = TRUE;
CREATE INDEX idx_cases_dod         ON cases(date_of_death) WHERE date_of_death IS NOT NULL;

CREATE POLICY "cases_org_member" ON cases
  FOR ALL USING (
    org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
  ) WITH CHECK (
    org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
  );
```

### 3.10 Case Notes Table

```sql
CREATE TABLE case_notes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id    UUID        NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id),
  content    TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 10000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- No updated_at: append-only; UPDATE not permitted via RLS
);

ALTER TABLE case_notes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_case_notes_case_id ON case_notes(case_id, created_at DESC);

CREATE POLICY "case_notes_select" ON case_notes
  FOR SELECT USING (
    case_id IN (SELECT id FROM cases WHERE org_id IN (
      SELECT org_id FROM organization_members WHERE user_id = auth.uid()
    ))
  );
CREATE POLICY "case_notes_insert" ON case_notes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    case_id IN (SELECT id FROM cases WHERE org_id IN (
      SELECT org_id FROM organization_members WHERE user_id = auth.uid()
    ))
  );
CREATE POLICY "case_notes_delete" ON case_notes
  FOR DELETE USING (auth.uid() = user_id);
-- No UPDATE policy: append-only

CREATE OR REPLACE FUNCTION fn_sync_notes_count() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE cases SET notes_count = notes_count + 1 WHERE id = NEW.case_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE cases SET notes_count = GREATEST(0, notes_count - 1) WHERE id = OLD.case_id;
  END IF;
  RETURN NULL;
END; $$;

CREATE TRIGGER trg_sync_notes_count
  AFTER INSERT OR DELETE ON case_notes
  FOR EACH ROW EXECUTE FUNCTION fn_sync_notes_count();
```

### 3.11 Case Deadlines Table

```sql
CREATE TABLE case_deadlines (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id          UUID        NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL REFERENCES auth.users(id),
  milestone_key    TEXT        NOT NULL,
  label            TEXT        NOT NULL,
  description      TEXT        NOT NULL,
  due_date         DATE        NOT NULL,
  completed_date   DATE,
  legal_basis      TEXT        NOT NULL,
  is_auto          BOOLEAN     NOT NULL DEFAULT TRUE,
  note             TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (case_id, milestone_key)
);

ALTER TABLE case_deadlines ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_deadlines_case_id  ON case_deadlines(case_id);
CREATE INDEX idx_deadlines_user_id  ON case_deadlines(user_id);
CREATE INDEX idx_deadlines_due_date ON case_deadlines(due_date) WHERE completed_date IS NULL;

CREATE POLICY "deadlines_all_own" ON case_deadlines
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

**EJS Milestone Keys (offset from DOD):**

| milestone_key | Days | Legal Basis |
|---|---|---|
| ejs_estate_tin | +30 | BIR RR 12-2018 §3 |
| ejs_bir_notice | +60 | NIRC §89(A) |
| ejs_deed_execute | +90 | Rule 74, Rules of Court |
| ejs_publication_start | +90 | Rule 74 §1 |
| ejs_publication_complete | +111 | Rule 74 §1 (3-week requirement) |
| ejs_bir_filing | +365 | TRAIN Law §86; BIR RR 12-2018 §6 |
| ejs_ecar_receipt | +395 | BIR RMO 15-2003 |
| ejs_lgu_transfer_tax | +420 | Local Government Code §135 |
| ejs_rd_registration | +450 | PD 1529 §53 |

**Probate Milestone Keys:**

| milestone_key | Days | Legal Basis |
|---|---|---|
| probate_estate_tin | +30 | BIR RR 12-2018 §3 |
| probate_petition_filing | +30 | Rule 73 §2 |
| probate_inventory | +150 | Rule 83 §1 (3-month rule) |
| probate_bir_filing | +365 | TRAIN Law §86 |

### 3.12 Case Documents Table

```sql
CREATE TABLE case_documents (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id          UUID        NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL REFERENCES auth.users(id),
  document_key     TEXT        NOT NULL,
  label            TEXT        NOT NULL,
  category         TEXT        NOT NULL,  -- 'death_registration', 'identity', 'property', etc.
  description      TEXT        NOT NULL,
  required_when    TEXT        NOT NULL,  -- human-readable conditional
  is_obtained      BOOLEAN     NOT NULL DEFAULT FALSE,
  is_not_applicable BOOLEAN    NOT NULL DEFAULT FALSE,
  obtained_date    DATE,
  note             TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (case_id, document_key)
);

ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_case_documents_case_id ON case_documents(case_id);

CREATE POLICY "case_documents_own" ON case_documents
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### 3.13 Conflict Check Log Table

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE conflict_check_log (
  id              UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID              NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id       UUID              REFERENCES clients(id) ON DELETE SET NULL,
  checked_name    TEXT              NOT NULL,
  checked_tin     TEXT,
  result_json     JSONB             NOT NULL DEFAULT '{}',
  match_count     INT               NOT NULL DEFAULT 0,
  outcome         conflict_outcome  NOT NULL DEFAULT 'clear',
  outcome_notes   TEXT,
  checked_at      TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

ALTER TABLE conflict_check_log ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_conflict_log_user    ON conflict_check_log(user_id);
CREATE INDEX idx_conflict_log_client  ON conflict_check_log(client_id);
CREATE INDEX idx_conflict_log_outcome ON conflict_check_log(user_id, outcome);

CREATE POLICY "conflict_log_own" ON conflict_check_log
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### 3.14 Supabase Storage Buckets

| Bucket | Access | Max Size | Allowed Types |
|---|---|---|---|
| `firm-logos` | Public (read) / Authenticated (write) | 2 MB | PNG, JPG, SVG |

### 3.15 Shared Utility Functions and Triggers

```sql
-- Reusable updated_at trigger function (used by multiple tables)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

-- Apply to: organizations, clients, cases, case_deadlines, case_documents, user_profiles
-- Example:
CREATE TRIGGER cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## 4. Feature Specifications

### 4.1 PDF Export

**Package:** `@react-pdf/renderer` v4.x
**Trigger:** "Export PDF" button in ActionsBar
**Format:** A4, portrait
**Margins:** 38mm left, 25mm right, 30mm top, 25mm bottom

**PDF Sections (in order):**

1. **Firm Header** — logo (if set), firm name, address, counsel credentials (IBP Roll No., PTR No., MCLE No.)
2. **Case Summary** — "Estate of [decedent name]", date of death, date of report, case title
3. **Distribution Table** — heirs, relationship, inheritance mode (Direct/Representation), net share in ₱
4. **Per-Heir Breakdown** — for each heir: from_legitime, from_free_portion, from_intestate, legitime_fraction, donations_imputed, gross_entitlement, net_from_estate; NCC statute citations per heir
5. **Narratives Section** — verbatim `EngineOutput.narratives[]`
6. **Computation Log** — verbatim `EngineOutput.computation_log[]`
7. **Warnings Panel** — if any `EngineOutput.warnings[]`
8. **Family Tree** — optional SVG embed via `FamilyTreeTab.getSVGString()` (§4.19)
9. **Settlement Deadline Summary** — optional milestone table from `case_deadlines` (§4.20)
10. **Document Checklist Appendix** — optional from `case_documents` (§4.22)
11. **Disclaimer** — "This report was generated for informational purposes. Consult a licensed attorney for final estate settlement advice."

**NCC Article Descriptions:** All statute citations in the PDF use the `NCC_ARTICLE_DESCRIPTIONS` static map (60+ articles from Art. 774 through FC Art. 179).

**Firm Branding Integration:** If `user_profiles.logo_url` is set, the logo is fetched from Supabase Storage and embedded. `letterhead_color` is used for the firm header bar.

**Component Hierarchy:**
```
EstatePDF (Document)
├── FirmHeaderPage (Page 1 header)
├── CaseSummarySection
├── DistributionTableSection
├── PerHeirBreakdownSection
│   └── HeirBreakdownRow[] (one per heir)
├── NarrativesSection
├── ComputationLogSection
├── WarningsSection (conditional)
├── FamilyTreeSection (optional, SVG)
├── SettlementDeadlineTable (optional, §4.20)
├── DocumentChecklistAppendix (optional, §4.22)
└── DisclaimerSection (last page)
```

**Export Options Modal (before download):**
- Include firm header: checkbox (default on)
- Include family tree diagram: checkbox (default on if tree rendered)
- Include settlement deadlines: checkbox (default on if deadlines exist)
- Include document checklist: checkbox (default on if checklist exists)

---

### 4.2 Auth & Persistence

**Auth Providers:** Google OAuth, email/password, magic link
**Auto-save:** 1500ms debounce on any input change
**Case Status State Machine:** `draft → computed → finalized → archived`

**TypeScript Types:**

```typescript
interface CaseRow {
  id: string
  org_id: string
  user_id: string
  client_id: string | null
  title: string
  status: 'draft' | 'computed' | 'finalized' | 'archived'
  input_json: EngineInput | null
  output_json: EngineOutput | null
  tax_input_json: EstateTaxWizardState | null
  tax_output_json: object | null
  comparison_input_json: EngineInput | null
  comparison_output_json: EngineOutput | null
  comparison_ran_at: string | null
  decedent_name: string | null
  date_of_death: string | null
  share_token: string
  share_enabled: boolean
  notes_count: number
  created_at: string
  updated_at: string
}

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  firm_name: string | null
  firm_address: string | null
  firm_phone: string | null
  firm_email: string | null
  counsel_name: string | null
  ibp_roll_no: string | null
  ptr_no: string | null
  mcle_compliance_no: string | null
  logo_url: string | null
  letterhead_color: string
  secondary_color: string
}
```

**Core API Functions (lib/cases.ts):**
- `createCase(userId, orgId, input, output): Promise<{id: string}>`
- `loadCase(caseId): Promise<CaseRow>`
- `updateCaseInput(caseId, input): Promise<void>` — debounced 1500ms
- `updateCaseOutput(caseId, output): Promise<void>`
- `updateCaseStatus(caseId, status): Promise<void>`
- `listCases(orgId): Promise<CaseListItem[]>`
- `deleteCase(caseId): Promise<void>`

**useAutoSave Hook:**
```typescript
function useAutoSave(caseId: string | null, input: EngineInput) {
  // Debounces 1500ms; shows "Saving..." / "Saved" / "Error saving" status
  // Calls updateCaseInput on every change after initial save
}
```

**Anonymous (Zero-Auth) Computation Flow:**

Adding authentication is an opt-in layer — the existing computation-only experience is preserved:

1. Unauthenticated user visits `/cases/new` → runs the wizard → gets results (existing behavior, no change)
2. Results are held in React component state only (no Supabase write, no localStorage persistence by default)
3. ActionsBar shows `[Sign in to Save]` button in place of the auto-save indicator
4. On sign-in from this prompt: current `EngineInput` + `EngineOutput` are immediately saved as a new case row → user is redirected to `/cases/:id` with full premium features available
5. Without sign-in: user can still Export PDF (§4.1), Print (§4.7), Export JSON — all client-side features work without auth
6. RLS: all Supabase tables require `auth.uid()` — no anonymous database access

This means the core WASM computation remains zero-friction for anonymous users.

**Dashboard Layout:**
- Case cards with: decedent name, date of death, estate value, last updated, status badge, deadline urgency chip (§4.20)
- Tabs: All / Draft / Computed / Finalized / Archived
- [+ New Case] → wizard
- Search by decedent name or case title

---

### 4.3 Client Profiles

**Route:** `/clients`, `/clients/new`, `/clients/:id`
**Depends on:** auth & persistence (cases table for heir search in conflict check)

**Client List:**
- Columns: Name, TIN (masked), Status, Intake Date, Conflict Status, # Cases
- Sort by: name, intake date, status
- Search by name (debounced, 300ms)
- Status filter: All / Active / Former
- Conflict filter: Cleared / Not Cleared / Not Checked

**Client Detail Page Sections:**
1. IDENTITY — name, nickname, DOB, place of birth
2. CONTACT — email, phone, address
3. LEGAL IDs — TIN (formatted XXX-XXX-XXX), government ID type + number, civil status
4. INTAKE — intake date, referral source, conflict cleared status + [Run Conflict Check]
5. CASES — list of linked cases with [Open] links
6. CONFLICT CHECK LOG — expandable history panel (§4.17)

**PH-Specific Fields:**
- TIN format: `XXX-XXX-XXX` (or `XXX-XXX-XXX-XXX` for 12-digit)
- `formatTIN(raw: string): string` — auto-inserts hyphens on input
- 11 government ID types enum: `philsys_id`, `passport`, `drivers_license`, `sss`, `gsis`, `prc`, `voters_id`, `postal_id`, `senior_citizen_id`, `umid`, `nbi_clearance`
- Civil status: `single`, `married`, `widowed`, `legally_separated`, `annulled`

**Client Form Fields (react-hook-form + Zod):**
- `full_name`: required, 2–200 chars, Zod `.min(2).max(200)`
- `tin`: optional, regex `^\d{3}-\d{3}-\d{3}(-\d{3})?$`
- `email`: optional, Zod `.email()`
- `intake_date`: required, default today

**Client List Page Wireframe:**
```
┌───────────────────────────────────────────────────────────────────────┐
│ ← Dashboard          Clients                        [+ New Client]    │
├───────────────────────────────────────────────────────────────────────┤
│  [🔍 Search clients by name…]    Status [All ▼]   Sort [Name A-Z ▼]  │
├───────────────────────────────────────────────────────────────────────┤
│  NAME                      TIN              CASES    STATUS           │
├───────────────────────────────────────────────────────────────────────┤
│  Santos, Maria Cristina    123-456-789        3      ● Active         │
│  dela Cruz, Juan Roberto   456-789-012        1      ● Active         │
│  Cruz, Ana Marie           —                  2      ● Active         │
│  Bautista, Jose Antonio    789-012-345        1      ○ Former         │
├───────────────────────────────────────────────────────────────────────┤
│                                         Showing 4 of 4    [<]  [>]   │
└───────────────────────────────────────────────────────────────────────┘
```

---

### 4.4 Firm Branding

**Route:** `/settings`
**Storage Bucket:** `firm-logos`
**Depends on:** auth & persistence (user_profiles table)

**Settings Page Layout:**
```
Firm Profile
├── Firm Name, Address, Phone, Email
├── Counsel Name, Email, Phone
├── IBP Roll No., PTR No., MCLE Compliance No.
│
Logo Upload
├── Upload PNG/JPG/SVG (max 2MB)
├── Current logo preview
│
Brand Colors
├── Letterhead Color picker (default #1E3A5F)
├── Secondary Color picker (default #C9A84C)
│
PDF Preview Panel (live preview of firm header)
```

**`FirmProfileProvider` React Context:**
```typescript
interface FirmProfile {
  firmName: string | null
  firmAddress: string | null
  firmPhone: string | null
  firmEmail: string | null
  counselName: string | null
  counselEmail: string | null
  counselPhone: string | null
  ibpRollNo: string | null
  ptrNo: string | null
  mcleComplianceNo: string | null
  logoUrl: string | null
  letterheadColor: string  // default '#1E3A5F'
  secondaryColor: string   // default '#C9A84C'
}
```

**Logo Upload Flow:**
1. User selects file → validate type (PNG/JPG/SVG) and size (≤2MB)
2. Upload to `firm-logos/{userId}/logo.{ext}` in Supabase Storage
3. On success, update `user_profiles.logo_url` with the storage path
4. Previous logo is deleted from storage before new upload
5. To remove logo: set `logo_url = null`, delete from storage

---

### 4.5 Statute Citations UI

**Component:** Expandable row in `DistributionSection`
**Data source:** `EngineOutput.per_heir_shares[].legal_basis: string[]`

**`NCC_ARTICLE_DESCRIPTIONS` Map (60+ entries, partial list):**
```typescript
const NCC_ARTICLE_DESCRIPTIONS: Record<string, string> = {
  "Art.887":  "Compulsory heirs in the direct descending line (Art. 887 NCC)",
  "Art.970":  "Right of representation (Art. 970 NCC)",
  "Art.971":  "Representatives shall inherit in the manner prescribed for representation (Art. 971 NCC)",
  "Art.972":  "Right of representation in the collateral line (Art. 972 NCC)",
  "Art.980":  "Children of the deceased shall always inherit from him (Art. 980 NCC)",
  "Art.981":  "Grandchildren and descendants shall inherit by right of representation (Art. 981 NCC)",
  "Art.985":  "In the absence of legitimate children, ascending line inherits (Art. 985 NCC)",
  "Art.988":  "Surviving spouse in intestate succession (Art. 988 NCC)",
  "Art.996":  "Surviving spouse with legitimate children (Art. 996 NCC)",
  "Art.1001": "Surviving spouse with legitimate parents (Art. 1001 NCC)",
  "Art.1006": "Full and half-blood siblings (Art. 1006 NCC)",
  "Art.1011": "Escheat to the State (Art. 1011 NCC)",
  "Art.1061": "Collation of donations inter vivos (Art. 1061 NCC)",
  "Art.1032": "Grounds for incapacity/unworthiness (Art. 1032 NCC)",
  "Art.1041": "Renunciation of inheritance (Art. 1041 NCC)",
  // General succession
  "Art.774":  "Inheritance defined — transmission of decedent's property, rights, and obligations",
  "Art.776":  "Inheritance includes all property, rights, and obligations not extinguished by death",
  "Art.777":  "Rights to succession transmitted from the moment of the decedent's death",
  "Art.782":  "Legatee/devisee — one receiving a specific legacy or devise by will",
  "Art.838":  "No will shall pass property without being probated",
  "Art.840":  "Institution of heir — act giving a person part of the estate by will",
  "Art.854":  "Preterition — omission of a compulsory heir in the direct line annuls institution of heirs",
  // Legitime provisions
  "Art.886":  "Legitime — portion reserved by law that testator cannot freely dispose of",
  "Art.888":  "Legitimate children's legitime = 1/2 of estate shared equally among all",
  "Art.889":  "Legitimate parents' or ascendants' legitime = 1/2 of estate",
  "Art.890":  "Ascendants' legitime when illegitimate children also survive = 1/4 of estate",
  "Art.892":  "Surviving spouse's legitime concurring with legitimate children",
  "Art.893":  "Surviving spouse's legitime concurring with legitimate ascendants = 1/4",
  "Art.894":  "Surviving spouse's legitime concurring with illegitimate children = 1/3 each",
  "Art.895":  "Illegitimate children's legitime = 1/2 of each legitimate child's share",
  "Art.896":  "When no legitimate children: illegitimate children's legitime = 1/4 of estate",
  "Art.899":  "LC + IC + SS combined: LC=1/2, SS=1/4, IC splits remaining",
  "Art.900":  "Surviving spouse alone: legitime = 1/2 of estate",
  "Art.901":  "Illegitimate children alone: collective legitime = 1/2 of estate",
  "Art.903":  "Parents of illegitimate decedent: their legitime = 1/2 of estate",
  "Art.908":  "Gross estate for legitime = net estate plus collatable donations from heirs",
  "Art.911":  "Order of reduction: voluntary institutions, then non-preferred, then preferred",
  // Disinheritance
  "Art.916":  "Disinheritance can only be made through a valid will",
  "Art.917":  "Disinheritance must state a legal cause expressly in the will",
  "Art.918":  "Invalid disinheritance treated as if not made — heir reinstated",
  "Art.919":  "Grounds for disinheriting a child or descendant (8 enumerated causes)",
  "Art.920":  "Grounds for disinheriting a parent or ascendant (8 enumerated causes)",
  "Art.921":  "Grounds for disinheriting a spouse (6 enumerated causes)",
  "Art.923":  "Children of disinherited heir may represent parent in the legitime",
  // Intestate succession
  "Art.960":  "Intestate succession opens: no will, void will, or heir repudiates",
  "Art.962":  "Order: children → parents → siblings → other relatives → state",
  "Art.966":  "Degree of relationship: each generation = one degree",
  "Art.974":  "Representation in collateral line: only to nephews/nieces",
  "Art.975":  "Children of a repudiating heir may represent the parent",
  "Art.977":  "Heirs who repudiate cannot be represented",
  "Art.982":  "Grandchildren represent predeceased legitimate children",
  "Art.987":  "Relatives of same degree inherit in equal shares",
  "Art.991":  "Illegitimate children may be represented by their descendants",
  "Art.992":  "Iron Curtain Rule — illegitimate child cannot inherit ab intestato from legitimate relatives",
  "Art.995":  "Surviving spouse with legitimate children: spouse takes one LC share",
  "Art.997":  "Surviving spouse with legitimate ascendants: each takes 1/2 of estate",
  "Art.998":  "Surviving spouse with illegitimate children: spouse = 1/3, IC collectively = 1/3",
  "Art.1000": "Illegitimate children with legitimate ascendants: 1/2 each",
  "Art.1002": "Guilty spouse in legal separation not entitled to intestate share",
  "Art.1004": "Collateral relatives of same degree inherit in equal shares",
  "Art.1005": "Brothers and sisters may be represented by nephews and nieces",
  "Art.1006": "Full blood siblings receive twice the share of half blood siblings",
  "Art.1007": "Half blood siblings take 1/2 of full blood sibling share",
  "Art.1008": "Nephews and nieces by representation take only what parent would have taken",
  "Art.1009": "No other collateral relative: estate goes to surviving spouse",
  "Art.1010": "No surviving spouse or collateral: estate escheats to municipal/city government",
  // Accretion
  "Art.1016": "Accretion — vacant portion accretes to co-heirs in same proportion",
  "Art.1021": "Vacant legitime accretes to co-compulsory heirs in own right",
  // Collation
  "Art.1062": "Collation not required if donor expressly exempts the donation",
  "Art.1067": "Exempt from collation: support, education, medical, emergency, customary gifts",
  "Art.1071": "Collation is made at value of donation at time of gift",
  // Family Code
  "FC172":    "Filiation of legitimate children — established by birth certificate or final judgment",
  "FC176":    "Illegitimate children entitled to support and legitime; use surname of mother",
}
```

**Helper Functions:**
```typescript
function parseArticleKey(legalBasis: string): string | null
function getArticleDescription(key: string): string
```

**UI Behavior:**
- Each heir row in DistributionSection has an expandable disclosure panel
- Panel contains: `ShareBreakdownSection` (§4.12) + `StatuteCitationsSection`
- `StatuteCitationsSection`: renders `legal_basis[]` as chips; on hover/click shows full article text
- `forcedExpanded?: boolean` prop: set to `true` when printing (§4.7)
- `expandedRows: Set<string>` state tracks which heir rows are open

**UI Wireframe — Expanded Heir Row with Statute Citations:**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Name             │ Category    │ Net from Estate │ Legal Basis        │  [⌄] │
├──────────────────┼─────────────┼─────────────────┼────────────────────┼──────┤
│ Maria Santos     │ Legit Child │    ₱1,000,000   │ [Art.887][Art.980] │  [⌃] │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │  Statutory Basis for Maria Santos's Share                            │    │
│  │  ──────────────────────────────────────────────────────────────────  │    │
│  │  Art. 887, New Civil Code                                            │    │
│  │  Compulsory heirs in the direct descending line. Legitimate          │    │
│  │  children, legitimate parents, surviving spouse, illegitimate        │    │
│  │  children.                                                           │    │
│  │                                                                      │    │
│  │  Art. 980, New Civil Code                                            │    │
│  │  Children of the deceased shall always inherit from him in their     │    │
│  │  own right. Division is equal among all legitimate children.         │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
├──────────────────┼─────────────┼─────────────────┼────────────────────┼──────┤
│ Jose Santos      │ Legit Child │    ₱1,000,000   │ [Art.887][Art.980] │  [⌄] │
└──────────────────┴─────────────┴─────────────────┴────────────────────┴──────┘
```

---

### 4.6 Case Notes

**Component:** Collapsible notes panel in Case Editor
**Packages:** `react-markdown`, `remark-gfm`, `rehype-sanitize`

**Note Types:** Free-form timestamped notes per case. Append-only (no editing after save).

**UI:**
```
Case Notes                                     [+ Add Note]
─────────────────────────────────────────────────────────
Write | Preview                  (tabs on new note input)
[________________________________]
[________________________________]  Supports **markdown**
                          [Cancel]  [Save Note]
─────────────────────────────────────────────────────────
Mar 1, 2026 2:15 PM · Atty. Cruz
Filed BIR Form 1904 at RDO 40. TIN: 123-456-789.
─────────────────────────────────────────────────────────
Feb 28, 2026 4:00 PM · Atty. Cruz
Client confirmed **3 real properties** in Makati.
```

**Optimistic Updates:** Add optimistically to list immediately; rollback on error.
**Delete:** Optimistic removal; only note author can delete (RLS: `auth.uid() = user_id`).
**Shared View:** Notes panel is hidden in the read-only shareable link view (§4.10).
**Markdown Sanitization:** `rehype-sanitize` with default schema — no `<script>` or `<iframe>`.

---

### 4.7 Print Layout

**Implementation:** `src/styles/print.css` with `@media print` rules
**Format:** A4 via `@page { size: A4; margin: 25mm 20mm; }`
**Font:** Times New Roman 12pt for print (professional legal appearance)

**Elements hidden on print:**
- Navigation bar, sidebar, ActionsBar buttons
- Wizard panels, tab controls
- All `class="no-print"` elements

**Elements shown only on print:**
- `PrintHeader` component (firm name, case title, page number)
- All expanded accordions (via `usePrintExpand` hook)

**`usePrintExpand` Hook:**
```typescript
function usePrintExpand(accordionRefs: RefObject<HTMLElement>[]) {
  useEffect(() => {
    const expand = () => accordionRefs.forEach(ref => ref.current?.setAttribute('data-state', 'open'))
    const collapse = () => accordionRefs.forEach(ref => ref.current?.setAttribute('data-state', 'closed'))
    window.addEventListener('beforeprint', expand)
    window.addEventListener('afterprint', collapse)
    return () => { window.removeEventListener('beforeprint', expand); window.removeEventListener('afterprint', collapse) }
  }, [])
}
```

**Print Support:** Ctrl+P (Windows/Linux), Cmd+P (Mac) triggers browser print with correct A4 layout.

---

### 4.8 Scenario Comparison

**Purpose:** Side-by-side testate vs. intestate comparison for estate planning conversations.
**Trigger:** "Compare Scenarios" button in ActionsBar (only shown when `input.will` is not null)

**How it works:**
1. `buildAlternativeInput(input: EngineInput): EngineInput` — strips `will: null` from current input
2. Run WASM engine on alternative input
3. Show side-by-side table: Current scenario | Intestate scenario | Difference

**TypeScript:**
```typescript
type ComparisonState = 'idle' | 'loading' | 'error' | 'ready'

interface ComparisonDiffEntry {
  heir_id: string
  heir_name: string
  current_centavos: bigint
  alternative_centavos: bigint
  delta_centavos: bigint
  delta_pct: number  // positive = gain under current will, negative = loss
}
```

**Visual Rules:**
- `delta_centavos > 0`: emerald highlight ("heir gains under will")
- `delta_centavos < 0`: red highlight ("heir loses under will")
- `delta_centavos = 0`: muted (no change)

**Persistence:** `cases.comparison_input_json`, `cases.comparison_output_json`, `cases.comparison_ran_at`

**UI Wireframe — Comparison Panel:**
```
┌────────────────────────────────────────────────────────────────────────────┐
│  ⑃  TESTATE vs. INTESTATE COMPARISON                         [▲ Collapse]  │
│  ──────────────────────────────────────────────────────────────────────    │
│  Same family tree and estate value (₱5,000,000.00) computed under two       │
│  succession regimes. Testate: per will dated 2023-07-01 (Scenario T3).     │
│  Intestate: without any will (Scenario I3), per Arts. 960–1016, NCC.        │
├────────────────────────────────────────────────────────────────────────────┤
│  HEIR                      WITH WILL (T3)      NO WILL (I3)      Δ         │
│  ──────────────────────────────────────────────────────────────────────    │
│  Maria dela Cruz           ₱1,250,000.00       ₱1,666,666.67   ▲ +₱416K   │
│  Legitimate Child          (legitime only)      (intestate)      +33%      │
│  ──────────────────────────────────────────────────────────────────────    │
│  Jose dela Cruz            ₱1,250,000.00       ₱1,666,666.67   ▲ +₱416K   │
│  Legitimate Child          (legitime only)      (intestate)      +33%      │
│  ──────────────────────────────────────────────────────────────────────    │
│  Cora Reyes                ₱1,250,000.00       ₱1,666,666.66   ▲ +₱416K   │
│  Surviving Spouse          (legitime)           (intestate)      +33%      │
│  ──────────────────────────────────────────────────────────────────────    │
│  Fundacion Sampaloc        ₱1,250,000.00              ₱0.00    ▼ −₱1.25M  │
│  Testamentary Legatee      (free portion)       (not an heir)   −100%      │
└────────────────────────────────────────────────────────────────────────────┘
```
- Emerald rows: heir gains more under the will
- Red rows: heir receives less under the will
- Muted rows: no change between scenarios

---

### 4.9 BIR Form 1801 Integration

**Purpose:** Combined inheritance + estate tax workflow, integrated into one case.
**Depends on:** §4.23 (Estate Tax Inputs Wizard) which produces `EstateTaxEngineInput`

**Bridge Formula:**
```typescript
// After estate tax engine runs, update inheritance net distributable estate:
const net_distributable_estate = Math.max(
  0,
  estateOutput.item40_gross_estate - estateOutput.item44_total_deductions
)
// Re-run inheritance engine with this value
const bridgedInput: EngineInput = {
  ...inheritanceInput,
  estate: { net_distributable_estate }
}
```

**Workflow:**
```
[Inheritance Wizard] → run inheritance engine → [Results View]
        ↓
[Estate Tax button] → [Estate Tax Inputs Wizard, §4.23] → run estate tax engine
        ↓
bridge formula: net_distributable_estate = max(0, Item40 − Item44)
        ↓
re-run inheritance engine with bridged value → [Updated Results View]
        ↓
[Combined PDF] — inheritance distribution + estate tax schedules in one document
```

**Combined PDF Additional Sections:**
- Estate Tax Summary (net estate, tax due, surcharges)
- BIR Form 1801 Schedule Summary (Schedules 1–6 totals)
- Note: "Estate tax net distributable estate of ₱X has been applied to the inheritance computation."

**Integration with cases table:**
- `cases.tax_input_json` → EstateTaxWizardState
- `cases.tax_output_json` → EstateTaxEngineOutput
- Inheritance engine is re-run whenever `tax_output_json` changes

---

### 4.10 Shareable Links

**Purpose:** Read-only case URLs for sharing with clients or co-counsel
**Route:** `/share/:token`

**Database Fields (already on cases table):**
- `share_token UUID UNIQUE DEFAULT gen_random_uuid()`
- `share_enabled BOOLEAN NOT NULL DEFAULT FALSE`

**Supabase RPC (SECURITY DEFINER):**
```sql
CREATE OR REPLACE FUNCTION get_shared_case(p_token TEXT)
RETURNS TABLE (
  title TEXT,
  status TEXT,
  input_json JSONB,
  output_json JSONB,
  decedent_name TEXT,
  date_of_death DATE
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT c.title, c.status::TEXT, c.input_json, c.output_json,
         c.decedent_name, c.date_of_death
  FROM cases c
  WHERE c.share_token = p_token::UUID AND c.share_enabled = TRUE;
END; $$;
```

**Share UI:**
```
Share Case                                              [✕]
──────────────────────────────────────────────────────────
Share link:
[https://inh.ph/share/550e8400-e29b-41d4-a716-446655440000]  [Copy] [QR]

⚠ Anyone with this link can view the full distribution
   including heir names and share amounts.

Sharing: ● Enabled                       [Disable Sharing]
──────────────────────────────────────────────────────────
```

**QR Code:** `qrcode.react` component generates scannable QR for mobile sharing
**Privacy Warning:** Shown every time dialog opens (not dismissible)
**Read-Only View:** All edit controls, case notes, and admin panels are hidden on `/share/:token`

---

### 4.11 Multi-Seat Firm Accounts

**Plans:** solo (1 seat), team (5 seats), firm (unlimited)

**Roles:**

| Role | Permissions |
|---|---|
| `admin` | Full firm management: add/remove members, manage clients/cases, billing |
| `attorney` | Create/edit/finalize own cases; view all firm cases and clients |
| `paralegal` | Edit cases and clients; cannot finalize or delete |
| `readonly` | View-only: all firm cases and clients |

**Invitation Flow:**
1. Admin enters email + role → creates `organization_invitations` row with 7-day expiry token
2. Email sent (via Supabase Edge Function or app service): invite link `/invite/{token}`
3. Invitee clicks link → sign in or create account → POST to `/api/accept-invite?token={token}`
4. On accept: create `organization_members` row; update invitation status to `accepted`
5. Expired/revoked invitations: clicking link shows "Invitation expired or revoked"

**Seat Management UI (`/settings/team`):**
```
Team Members                                    [Invite Member]
───────────────────────────────────────────────────────────────
Atty. Maria Santos   admin@firm.ph   admin      [···]
Atty. Jose Cruz      jose@firm.ph    attorney   [···]
Paralegal Ana Reyes  ana@firm.ph     paralegal  [···]

Pending Invitations (1)
───────────────────────────────────────────────────────────────
new@firm.ph          attorney        Invited 2h ago   [Revoke]
```

**RLS Policy Changes for Multi-Seat:**
- All RLS policies use `org_id` not `user_id` (clients and cases are org-scoped)
- `conflict_check_log`: uses `org_id` scope when firm mode is active (all attorneys share one conflict pool)
- Role-gated actions: finalize (admin/attorney), delete (admin only), invite (admin only)

---

### 4.12 Share Breakdown Panel

**Purpose:** Show per-heir split of how their share was constructed
**Location:** Expanded row in DistributionSection (first section in expandable panel)

**`ShareBreakdownSection` Component:**

Fields shown per heir (with conditional visibility):

| Field | Show When |
|---|---|
| From Legitime | `from_legitime.centavos > 0` |
| From Free Portion | `from_free_portion.centavos > 0` |
| From Intestate | `from_intestate.centavos > 0` |
| Legitime Fraction | heir is a compulsory heir |
| Donations Imputed | `donations_imputed.centavos > 0` |
| Gross Entitlement | always |
| Net from Estate | always (= final share after all adjustments) |

**Data Source:** `EngineOutput.per_heir_shares[]` — fields `from_legitime`, `from_free_portion`, `from_intestate`, `legitime_fraction` are already computed by the engine but were not previously rendered.

**UI Wireframe — Expanded Heir Row with Share Breakdown:**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Name           │ Category    │ Net from Estate │ Legal Basis         │  [⌄]  │
├────────────────┼─────────────┼─────────────────┼─────────────────────┼───────┤
│ Maria Santos   │ Legit Child │    ₱575,000.00  │ [Art.887][Art.980]  │  [⌃]  │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │  Share Computation — Maria Santos                                    │    │
│  │  ──────────────────────────────────────────────────────────────────  │    │
│  │  Legitime Fraction:            1/4 of net distributable estate       │    │
│  │                                                                      │    │
│  │  From Legitime:                            ₱500,000.00              │    │
│  │  From Free Portion:                        ₱125,000.00              │    │
│  │  From Intestate:                                 ₱0.00              │    │
│  │  ──────────────────────────────────────────────────────             │    │
│  │  Gross Entitlement:                        ₱625,000.00              │    │
│  │  Less: Advances on Inheritance (collated donation): − ₱50,000.00   │    │
│  │  ──────────────────────────────────────────────────────             │    │
│  │  Net from Estate:                          ₱575,000.00              │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### 4.13 Decedent Header

**Change:** `ResultsHeader` h1 changes from "Philippine Inheritance Distribution" to professional estate identity.

**Before:**
```html
<h1>Philippine Inheritance Distribution</h1>
```

**After:**
```html
<h1>Estate of {decedentName}</h1>
<p>Date of Death: {formatDateOfDeath(dateOfDeath)}</p>
```

**`formatDateOfDeath` Function:**
```typescript
function formatDateOfDeath(dod: string): string {
  // Use string splitting to avoid timezone issues (not new Date())
  const [year, month, day] = dod.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun',
                  'Jul','Aug','Sep','Oct','Nov','Dec']
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`
}
```

**Props Added to ResultsHeader:**
```typescript
interface ResultsHeaderProps {
  decedentName: string       // from EngineInput.decedent.name
  dateOfDeath: string        // ISO date from EngineInput.decedent.date_of_death
  scenarioCode: string       // existing
  scenarioLabel: string      // existing
  netDistributableEstate: Money  // existing
}
```

---

### 4.14 Representation Display

**Purpose:** Show "representing [deceased parent name]" label under heir name when inheriting by representation.

**`getRepresentedName` Helper:**
```typescript
function getRepresentedName(
  share: InheritanceShare,
  persons: Person[]
): string | null {
  if (share.inherits_by !== 'Representation') return null
  if (share.represents === null) return 'representing deceased heir'
  const parent = persons.find(p => p.id === share.represents)
  return parent ? `representing ${parent.name}` : 'representing deceased heir'
}
```

**UI:** Sub-label under heir name in distribution table, styled in muted text (text-sm text-muted-foreground), preceded by "→" or "↳" glyph.

**Data Source:** `EngineOutput.per_heir_shares[].inherits_by === 'Representation'` and `.represents: PersonId | null`

**UI Wireframe — Distribution Table with Representation Sub-Labels:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Name                          │ Category    │ Inherits By         │ Net      │
├───────────────────────────────┼─────────────┼─────────────────────┼──────────┤
│ Maria Santos                  │ Legit Child │ By Representation   │ ₱500,000 │
│ ↳ representing Juan Santos    │             │                     │          │
├───────────────────────────────┼─────────────┼─────────────────────┼──────────┤
│ Ana Santos                    │ Legit Child │ By Representation   │ ₱500,000 │
│ ↳ representing Juan Santos    │             │                     │          │
├───────────────────────────────┼─────────────┼─────────────────────┼──────────┤
│ Rosa Cruz                     │ Legit Child │ Direct succession   │₱1,000,000│
└───────────────────────────────┴─────────────┴─────────────────────┴──────────┘
```
Sub-label styled `text-sm text-muted-foreground`; "↳" glyph visually indents the representative.

---

### 4.15 Donation Summary in Results

**Purpose:** Display the input donations list in results view for advances on inheritance transparency.

**`DonationsSummaryPanel` Component:**
- Positioned between DistributionSection and NarrativePanel
- Only shown when `EngineInput.donations` is non-empty

**Per-Donation Row:**
- Donor name (maps to heir ID)
- Amount (formatted ₱)
- Donation type chip: "Collatable" (emerald) / "Exempt: [type]" (gray) / "Stranger" (muted)
- NCC citation for the exemption type

**`getDonationCollationStatus` Function:**
```typescript
type CollationStatus = 'collatable' | 'exempt' | 'stranger'

function getDonationCollationStatus(
  donation: Donation,
  persons: Person[]
): { status: CollationStatus; exemptionType?: string; article?: string }
```

**12 Exemption Types** (Art. 1062–1070 NCC): education expenses, medical expenses, wedding gifts, periodic family allowances, etc.

**Footer:** Total collatable amount, total exempt amount, total stranger donations.

**UI Wireframe — Donations Summary Panel:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│  ↙ Advances on Inheritance (Donations Subject to Collation)              │
│  Art. 1061 NCC — Compulsory heirs must collate inter-vivos donations.    │
├────┬─────────────────────┬────────────┬──────────────┬───────────────────┤
│ #  │ Recipient           │ Date       │ Value        │ Status            │
├────┼─────────────────────┼────────────┼──────────────┼───────────────────┤
│ 1  │ Remedios Santos     │ 2018-03-15 │ ₱500,000     │ ● Collatable      │
│    │ (Legitimate Child)  │            │ Imputed: −₱500K│ Art. 1061 NCC  │
│    │ "Land in Batangas"  │            │              │                   │
├────┼─────────────────────┼────────────┼──────────────┼───────────────────┤
│ 2  │ Juan dela Cruz Jr.  │ 2020-06-01 │ ₱200,000     │ ○ Exempt          │
│    │ (Legitimate Child)  │            │              │ Support/Education │
│    │ "Tuition fees"      │            │              │ Art. 1067 NCC     │
├────┼─────────────────────┼────────────┼──────────────┼───────────────────┤
│    │ Totals:             │            │ ₱700,000     │ Collatable: ₱500K │
│    │ 2 donations         │            │              │ Exempt:    ₱200K  │
└────┴─────────────────────┴────────────┴──────────────┴───────────────────┘
```

---

### 4.16 Case Export ZIP

**Package:** `jszip@3.10.1` (browser-side ZIP generation)
**Trigger:** "Export Archive" in ActionsBar (requires authenticated + saved case)

**ZIP Contents:**
```
estate-{decedent-name-slug}-{YYYY-MM-DD}.zip
├── report.pdf          (generated by §4.1)
├── input.json          (cases.input_json, pretty-printed)
├── output.json         (cases.output_json, pretty-printed)
├── notes.txt           (optional: case_notes in plain text, if any)
└── metadata.json       (export timestamp, format version, case ID)
```

**`ZipMetadata` Interface:**
```typescript
interface ZipMetadata {
  export_format_version: "1.0"
  case_id: string
  decedent_name: string | null
  date_of_death: string | null
  exported_at: string  // ISO datetime
  exported_by_user_id: string
}
```

**`exportCaseZip` Function:**
```typescript
async function exportCaseZip(
  caseId: string,
  input: EngineInput,
  output: EngineOutput,
  notes: CaseNoteRow[]
): Promise<void>  // triggers browser download
```

**Legal Basis:** CPR Canon 16 (file retention), BIR RR 17-2013 (10-year document retention), RA 9470 (National Archives Act).

---

### 4.17 Conflict of Interest Check

**Basis:** 2023 CPRA Canon III §§13–16 — mandatory conflict screening before accepting PH estate matters.
**Depends on:** §4.3 (client profiles), §4.2 (cases.input_json for heir search)

**`run_conflict_check` Supabase RPC:**
```sql
CREATE OR REPLACE FUNCTION run_conflict_check(
  p_name TEXT,
  p_tin  TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  -- 1. Search existing clients by trigram name similarity (threshold 0.35)
  -- 2. Search heir names embedded in cases.input_json->family_tree->heirs (threshold 0.35)
  -- 3. TIN exact match regardless of name similarity
  -- Returns: { client_matches[], heir_matches[], total_matches, outcome }
END; $$;
```

**Similarity Threshold:** 0.35 (intentionally broad — false positives acceptable, false negatives are professional liability)
**Similarity Score Visual Coding:** ≥1.00 = red "Exact", ≥0.70 = amber "High", ≥0.50 = yellow "Moderate", <0.50 = gray "Low"

**Trigger Points:**
1. `/clients/new?step=conflict-check` — Step 1 before client creation form (full page)
2. Client detail page → "Re-run Check" button (dialog modal)
3. Case editor client picker → "Check Conflict" before linking

**Outcomes:**
- `clear`: No matches → auto-clear, log entry, pre-populate `conflict_cleared = true`
- `flagged`: Matches found → attorney reviews; notes required + checkbox to proceed
- `cleared_after_review`: Attorney confirmed no conflict after review
- `skipped`: Attorney explicitly skipped (client flagged as not cleared)

**Case Finalization Guard:** If linked client has `conflict_cleared = false` when finalizing, show non-blocking reminder dialog.

**UI Wireframe — Pre-Intake Conflict Check Screen (`/clients/new?step=conflict-check`):**
```
┌──────────────────────────────────────────────────────────────────────┐
│ ← Clients          New Client — Step 1 of 2: Conflict Check          │
├──────────────────────────────────────────────────────────────────────┤
│  Screen for conflicts of interest before accepting this matter.       │
│  Required under Canon III §14 of the 2023 CPRA.                      │
│                                                                       │
│  Prospective client name *                                            │
│  [______________________________________________]                     │
│  Enter name as it will appear on government ID                        │
│                                                                       │
│  TIN (optional — enables exact-match check)                           │
│  [___-___-___]                                                        │
│                                                                       │
│  [  Run Conflict Check  ]                                             │
│  (enabled once name ≥ 2 characters)                                   │
│                                                                       │
│  ─────────────────────────────────────────────────────────────────   │
│  ✓ CLEAR — No conflicts found for "Maria Santos Reyes"               │
│    No existing clients or case heirs match this name.                 │
│    [Continue to Client Details →]                                     │
│  ─────────────────────────────────────────────────────────────────   │
│  ⚠ FLAGGED — 2 potential matches found for "Juan dela Cruz"          │
│    High similarity (0.82): Juan dela Cruz Santos — existing client    │
│    Moderate similarity (0.51): Juan C. dela Cruz — heir in Case #143 │
│    [_________________________________] Notes required before proceeding│
│    ☐ I have reviewed the matches and confirmed no conflict of interest│
│    [Proceed After Review] (disabled until notes ≥ 5 chars + checkbox) │
│  ─────────────────────────────────────────────────────────────────   │
│  [Skip — Create Client Without Check]                                 │
│  Skipping marks this client as conflict not cleared.                  │
└──────────────────────────────────────────────────────────────────────┘
```

---

### 4.18 Guided Client Intake Form

**Purpose:** Multi-step guided interview that pre-populates the case wizard and creates the client record simultaneously.
**Depends on:** §4.3 (clients), §4.17 (conflict check as step 1)

**Steps:**
1. Conflict Check (§4.17) — mandatory gate
2. Client Details — lawyer's client info (executor/heir)
3. Decedent Information — name, DOD, citizenship, address, civil status, property regime
4. Family Composition — heirs (drives inheritance wizard pre-population)
5. Asset Summary — real properties count/total, cash, vehicles (drives document checklist seeding §4.22)
6. Settlement Track — EJS or Judicial (drives deadline generation §4.20)
7. Review & Save

**What the intake form creates:**
1. `clients` row — the lawyer's client (usually the executor or primary heir)
2. `cases` row with `input_json` pre-populated from intake data
3. `cases.intake_data JSONB` — additional fields not in EngineInput (decedent TIN, asset category flags, will status)

**Pre-population Mapping:**
- Decedent info → `EngineInput.decedent` (name, date_of_death, is_married, marital_regime)
- Family composition → `EngineInput.family_tree` (each heir with relationship, alive status)
- "Has will" flag → `EngineInput.will: null | {}` (conditional testate wizard fields shown)
- Asset summary → seeding conditions for document checklist (§4.22)
- DOD + track → `generateAndSaveDeadlines()` (§4.20)

**UI Wireframe — 6-Step Guided Intake Form:**
```
┌──────────────────────────────────────────────────────────────────────┐
│  New Estate Case — Guided Intake                                      │
│  Step 2 of 6                                                         │
│  ●━━━━━●━━━━━○━━━━━○━━━━━○━━━━━○                                     │
│  Client  Decedent  Track  Family  Assets  Review                     │
│                              [Save Draft]  [Cancel]                  │
├──────────────────────────────────────────────────────────────────────┤
│  Step 2: About the Decedent                                           │
│  ─────────────────────────────────────────────────────────────────── │
│  Full name *           [_______________________________________]      │
│                         As it appears on the PSA death certificate    │
│  Date of death *       [  2024-03-15  ]   (YYYY-MM-DD)              │
│  Place of death        [_______________________________________]      │
│  Last known address    [_______________________________________]      │
│                         City/municipality determines BIR RDO          │
│  Civil status at death  ◉ Single  ○ Married  ○ Widowed               │
│                         ○ Legally Separated  ○ Annulled               │
│  Has a will?            ◉ No (intestate)  ○ Yes (testate)            │
│                                                                       │
│  Property regime [shows when Married selected]                        │
│  ◉ Absolute Community (ACP)  ○ Conjugal Partnership (CPG)            │
│  ○ Complete Separation                                                │
│                                                                       │
│  Citizenship at death   [  Filipino                         ]        │
│                                                                       │
│  [← Back: Client]                   [Next: Settlement Track →]       │
└──────────────────────────────────────────────────────────────────────┘
```

Step 1 (Client Linkage): search existing clients or create new; relationship to decedent dropdown (surviving spouse / child / executor / administrator / other heir / third-party buyer); conflict check gate.
Step 3 (Settlement Track): EJS or Judicial radio; generates deadline milestones on selection (§4.20).
Step 4 (Family Composition): add heir rows — name, relationship, alive/predeceased; pre-populates `EngineInput.family_tree`.
Step 5 (Asset Summary): real properties count, cash accounts, vehicles; drives document checklist seeding (§4.22).
Step 6 (Review & Save): summary table, [Create Case] button creates `clients` row + `cases` row + `case_deadlines` rows + `case_documents` rows.

---

### 4.19 Family Tree Visualizer

**Package:** `react-d3-tree` v3.6.x (~85KB gzip, MIT)
**Location:** New "Family Tree" tab in ResultsView
**Lazy loaded:** `const FamilyTreeTab = lazy(() => import('./visualizer/FamilyTreeTab'))`
**No new database tables** — all data from existing `EngineInput` and `EngineOutput`

**Node Roles and Colors:**

| Role | Border | Background | Label |
|---|---|---|---|
| `decedent` | slate-800 | slate-100 | † symbol |
| `active-heir` | green-600 | green-50 | Share amount |
| `surviving-spouse` | violet-600 | violet-50 | Share amount |
| `predeceased` | slate-400 | slate-50 | "Predeceased" |
| `disinherited` | red-600 | red-50 | "Disinherited" |
| `unworthy` | orange-600 | orange-50 | "Unworthy" |
| `renounced` | yellow-600 | yellow-50 | "Renounced" |
| `zero-share` | slate-300 | slate-50 | "Excluded" |
| `testamentary-only` | sky-600 | sky-50 | "Legatee" |

**Edge Types:**
- Parent-child: solid gray 1.5px
- Marriage: dashed violet double-line 2px (#7c3aed)
- Representation: dashed gray 1px (Art. 970 NCC)

**Spouse Overlay:** Rendered as SVG `foreignObject` at same Y-level as decedent, offset 200px right.

**Controls:** [−] Zoom Out | [+] Zoom In | [Fit to Screen] | [Download SVG]

**PDF Integration:** `FamilyTreeTab` exposes `getSVGString()` via `useImperativeHandle` for PDF embedding (§4.1).

**Tab Restructure:** `ResultsView` gains 4 tabs: Distribution (default) | Family Tree | Narratives | Computation Log

**`DISINHERITANCE_CAUSE_LABELS` map:** 24 entries covering Art. 919 (child causes), Art. 920 (parent causes), Art. 921 (spouse causes).

**UI Wireframe — Family Tree Tab (Intestate, Spouse + 3 Legitimate Children):**
```
┌──────────────────────────────────────────────────────────────────────────┐
│  Distribution ▼  │  Family Tree ▼  │  Narratives ▼  │  Computation Log  │
├──────────────────────────────────────────────────────────────────────────┤
│  [−] [+] [Fit to Screen] [Download SVG]                                  │
│                                                                           │
│                    ┌─────────────────┐                                   │
│                    │  † Juan dela Cruz│══════════════╗                   │
│                    │   (Decedent)     │              ║ (marriage)        │
│                    └────────┬────────┘       ┌───────╨────────┐         │
│                             │                │  Ana dela Cruz  │         │
│              ┌──────────────┼──────────────┐ │ Surviving Spouse│         │
│              │              │              │ │   ₱1,200,000    │         │
│   ┌──────────┴──┐  ┌────────┴────┐  ┌─────┴──────┐└────────────┘        │
│   │ Maria Cruz  │  │  Jose Cruz  │  │ Pedro Cruz  │                      │
│   │ Legit Child │  │ Legit Child │  │ Legit Child │                      │
│   │ ₱1,200,000  │  │ ₱1,200,000  │  │ ₱1,200,000  │                      │
│   └─────────────┘  └─────────────┘  └─────────────┘                      │
│                                                                           │
│  Legend: ■ Active heir  □ Predeceased  ✕ Disinherited  → By representation│
└──────────────────────────────────────────────────────────────────────────┘
```

---

### 4.20 Deadline Tracker

**Purpose:** Automatic settlement deadline calendar computed from date of death.
**Depends on:** §4.2 (cases table)
**Route:** `/deadlines` (all-cases cross-view)

**Status Computation (client-side, not stored):**
```typescript
type DeadlineStatus = 'done' | 'overdue' | 'urgent' | 'upcoming' | 'future'

function computeDeadlineStatus(dueDate: string, completedDate: string | null): DeadlineStatus {
  if (completedDate !== null) return 'done'
  const daysUntil = Math.floor((new Date(dueDate) - new Date()) / 86_400_000)
  if (daysUntil < 0)   return 'overdue'   // past due, not done
  if (daysUntil <= 14) return 'urgent'    // red — ≤14 days
  if (daysUntil <= 30) return 'upcoming'  // yellow — 15–30 days
  return 'future'                          // green — >30 days
}
```

**Auto-Generation:** `generateAndSaveDeadlines(caseId, userId, dateOfDeath, track)` called on `createCase()` and whenever `date_of_death` changes. Upsert preserves `completed_date` and `note` when recalculating `due_date`.

**Case-Level Timeline Panel:** Collapsible panel in Case Editor. Vertical timeline, one row per milestone, color-coded by status. "Mark Done" → date picker modal defaulting to today. "Add Custom Deadline" → label, date, description, legal basis form.

**Dashboard Summary (on case cards):**
- Most urgent pending deadline label + countdown
- Progress: "5 of 9 milestones complete"

**`/deadlines` All-Cases View:** Sections: OVERDUE | DUE THIS WEEK | URGENT | DUE SOON | UPCOMING. Each item: milestone label, case title, decedent name, days until/overdue, [Open Case] link.

**`get_case_deadline_summaries` RPC:** Returns urgency summary for N cases at once (used in dashboard to avoid N+1 queries).

---

### 4.21 Timeline Report

**Purpose:** Client-facing progress tracker answering "Where are we? When will this be done?"
**Depends on:** §4.20 (case_deadlines as data source)
**Audience:** Heirs and clients (external); language is plain, jargon-free

**7 Settlement Stages (EJS track):**
1. Registration & Notification (estate TIN, BIR notice)
2. Document Preparation (death cert, property docs, heir IDs)
3. Deed Drafting & Signing (deed of EJS execution)
4. Publication (3-week newspaper run)
5. BIR Filing & Payment (Form 1801 + estate tax payment)
6. eCAR & Transfer Tax (BIR clearance + LGU transfer tax)
7. Title Transfer (Register of Deeds registration)

**Stage Status Rules:**
- `complete`: All milestones in stage have `completed_date` set
- `in-progress`: At least one milestone is done; at least one is pending
- `upcoming`: No milestones done; all due in future
- `overdue`: At least one milestone is overdue and not done

**Layout:** Horizontal progress bar at top (% stages complete). Below: stage cards with status chip, completion date (if done), "current step" indicator for the first in-progress stage.

**Sharing:** Timeline report URL = `/share/{token}?view=timeline` — accessible from the shareable link (§4.10). Also printable as a standalone A4 document.

**PDF Page:** Timeline report generates a standalone PDF page using `@react-pdf/renderer` with stage cards laid out vertically (no horizontal bar in PDF; bar doesn't translate to static layout).

**UI Wireframe — Settlement Timeline Panel (Case Editor):**
```
┌──────────────────────────────────────────────────────────────────────────┐
│  Settlement Timeline                             [Client View]  [▲]      │
│  Track: Extrajudicial Settlement                                          │
├──────────────────────────────────────────────────────────────────────────┤
│  Overall Progress: ████████████░░░░░░░░░░░░  43% — Stage 3 of 7         │
│                                                                           │
│  ①       ②          ③              ④           ⑤          ⑥       ⑦    │
│  [DONE]  [DONE]  [IN PROGRESS]  [UPCOMING]  [UPCOMING]  [UPCOMING]  [UPCOMING]│
│                                                                           │
│  Registration  Documents   Computation   BIR Filing   Deed &    eCAR &  Title│
│  & TIN         Gathering                             Publication  Tax   Transfer│
│                                                                           │
│  ──────────────────────────────────────────────────────────────────      │
│  Current Stage: Inheritance Computation                                   │
│  Case status: computed · Distribution computed 1 Mar 2026                │
│                                                                           │
│  Next: BIR Estate Tax Filing — Due 15 Jan 2026 (319 days)                │
│  Estimated Settlement Completion: 10 Apr 2026  [Edit ✎]                  │
│                                                                           │
│  [Copy Timeline Link]   [Export Timeline PDF]                             │
└──────────────────────────────────────────────────────────────────────────┘
```

**Client-Facing Shared Timeline (via `/share/:token?view=timeline`):**
```
┌──────────────────────────────────────────────────────────────────────────┐
│  REYES & ASSOCIATES LAW OFFICE                                            │
│  Atty. Maria L. Reyes  ·  Quezon City, Metro Manila  ·  (02) 8888-1234   │
│                                                                           │
│  Estate of Juan Roberto dela Cruz                                         │
│  Date of Death: 15 January 2025 · Settlement: Extrajudicial              │
│  ──────────────────────────────────────────────────────────────────      │
│  SETTLEMENT PROGRESS                                     43% Complete     │
│  ████████████░░░░░░░░░░░░░░░░░░                                           │
│  ──────────────────────────────────────────────────────────────────      │
│  ✓  Stage 1: Case Opened                               Completed          │
│     Your attorney has opened the estate case.                             │
│  ✓  Stage 2: Gathering Documents                       Completed 28 Jan 2025│
│     Required documents have been collected.                               │
│  ◉  Stage 3: Computing Shares                  ← Currently Here           │
│     Computing the legal inheritance share of each heir.                   │
│  ○  Stage 4: BIR Tax Filing                    Estimated 15 Jan 2026      │
│     Estate tax return (BIR Form 1801) will be filed.                      │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### 4.22 Document Checklist

**Purpose:** Per-case document checklist seeded from case intake data, check-off tracking.
**Depends on:** §4.2 (cases table)

**Smart Seeding Rules (on case creation / intake):**

| Document | Required When |
|---|---|
| PSA Death Certificate (authenticated) | Always |
| PSA Birth Certificates (all heirs) | Always |
| PSA Marriage Certificate (decedent) | `is_married = true` |
| BIR Form 1904 (Estate TIN) | Always |
| BIR Form 1949 (Notice of Death) | Always |
| TCT/CCT (per real property) | Any real property in estate |
| Tax Declaration (per property) | Any real property in estate |
| Zonal Value Certification (per property) | Any real property in estate |
| Bank Certificate of Balance | Any bank account in estate |
| Deed of Extrajudicial Settlement | EJS track |
| Affidavit of Publication | EJS track |
| SPA (per overseas heir) | Any heir with address abroad |
| Court-Appointed Administrator | Probate track |
| Inventory and Appraisal | Probate track |
| Business Permit / Incorporation Docs | Any business interest in estate |

**Checklist UI (Case Editor panel):**
```
Documents                          [8 of 14 obtained (57%)]   [▼]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[✓] PSA Death Certificate           Obtained: Feb 1, 2026
[✓] PSA Birth Cert (all heirs)      Obtained: Feb 5, 2026
[ ] TCT — Lot 123 (Makati)          Due: before BIR filing
[ ] Bank Certificate (BDO)          Due: before BIR filing
[N/A] SPA for overseas heirs        Marked not applicable
```

**Per-Item Actions:** Check off (with optional date + note), mark Not Applicable, add note.
**Progress Bar:** Counts obtained / (total − not_applicable).
**PDF Appendix:** Included optionally in PDF export (§4.1) as case appendix.

---

### 4.23 Estate Tax Inputs Wizard

**Purpose:** Multi-tab form building `EstateTaxWizardState` stored in `cases.tax_input_json`.
**8 Tabs:**

| Tab | Content |
|---|---|
| 1 — Decedent Details | Name (pre-pop), DOD (pre-pop), citizenship, NRA flag, address, marital status (pre-pop), property regime, worldwide ELIT (NRA only) |
| 2 — Executor | Name, TIN, contact, email |
| 3 — Real Properties | Title/TCT numbers, tax dec no., location, lot/improvement area, classification, FMV (tax dec vs BIR zonal — engine takes max), ownership, family home flag, barangay cert |
| 4 — Personal Properties | Financial (cash, bank, receivables, shares, bonds), Tangible (vehicles, jewelry, other) — subtype, description, FMV, ownership |
| 5 — Other Assets | Taxable transfers (CONTEMPLATION_OF_DEATH, REVOCABLE, POWER_OF_APPOINTMENT, LIFE_INSURANCE, INSUFFICIENT_CONSIDERATION), Business interests, Sec. 87 exempt assets |
| 6 — Ordinary Deductions | Claims against estate, claims vs insolvent, unpaid mortgages, unpaid taxes, casualty losses, vanishing deduction, public use transfers, funeral (PRE_TRAIN only), judicial admin expenses (PRE_TRAIN only) |
| 7 — Special Deductions | Medical expenses (within 1 year of DOD), RA 4917 benefits, foreign tax credits, standard deduction (₱5M — auto-applied by engine), family home deduction (auto from Tab 3) |
| 8 — Filing & Amnesty | Amnesty election toggle, amnesty deduction mode (standard vs narrow), filing flags (amended, extension, installment, judicial settlement), disqualifying flags (PCGG, RA 3019, RA 9160 violations) |

**Pre-population from Inheritance Wizard:**
- `decedent.name` ← `EngineInput.decedent.name`
- `decedent.dateOfDeath` ← `EngineInput.decedent.date_of_death`
- `decedent.maritalStatus` ← derived from `EngineInput.decedent.is_married`
- `decedent.propertyRegime` ← default ACP if marriage ≥ 1988-08-03, else CPG
- `decedent.isNonResidentAlien` ← `EngineInput.decedent.citizenship !== 'Filipino'`

**Auto-save:** 1500ms debounce to `cases.tax_input_json` (same pattern as inheritance auto-save).

**Tab Validation Summary:**

| Tab | Required Fields |
|---|---|
| 1 | name, dateOfDeath, address, citizenship, maritalStatus |
| 2 | executor.name |
| 3–8 | None required (empty = valid); per-row validation if rows added |

**Conditional Fields:**
- Funeral expenses tab section: only visible when `deductionRules === 'PRE_TRAIN'` (DOD < 2018-01-01)
- NRA worldwide fields: only visible when `isNonResidentAlien = true`
- Amnesty deduction mode: only visible when `userElectsAmnesty = true`

**UI Wireframe — Estate Tax Wizard Tab Navigation + Tab 1 (Decedent Details):**
```
┌────────────────────────────────────────────────────────────────────────────┐
│  ← Back to Inheritance Results         Estate Tax — Estate of Juan Cruz    │
│  Auto-saved 3s ago                                                          │
├────────────────────────────────────────────────────────────────────────────┤
│ [✓ 1 Decedent] [✓ 2 Executor] [● 3 Real Props] [4 Personal] [5 Other]     │
│ [6 Deductions] [7 Spec. Ded.] [8 Filing]                  Step 3 of 8      │
├────────────────────────────────────────────────────────────────────────────┤
│  TAB 1 — DECEDENT DETAILS                                                   │
│  ─────────────────────────────────────────────────────────────────────     │
│  Some fields have been pre-filled from your inheritance computation.        │
│                                                                              │
│  Full Name (Last, First, Middle)           [pre-filled, editable]           │
│  [  Dela Cruz, Juan Andres Santos         ]                                 │
│                                                                              │
│  Date of Death *                           [pre-filled, editable]           │
│  [  2024-03-15  ]  (YYYY-MM-DD)                                            │
│                                                                              │
│  Citizenship    [  Filipino               ]  default: Filipino               │
│                                                                              │
│  ☐ Non-Resident Alien (NRA)                                                 │
│     Only Philippine-situs assets included in gross estate when checked.     │
│                                                                              │
│  Address at Time of Death *                                                  │
│  [  14 Mabini St., Barangay San Antonio, Makati City, Metro Manila         ]│
│                                                                              │
│  Marital Status  ◉ Single  ○ Married  ○ Widowed  ○ Legally Sep.  ○ Annulled│
│                  [pre-selected from inheritance wizard is_married field]    │
│                                                                              │
│  Property Regime [visible when Married]                                      │
│  ◉ Absolute Community (ACP — default if married ≥ 3 Aug 1988)               │
│  ○ Conjugal Partnership of Gains (CPG — default if married < 3 Aug 1988)    │
│  ○ Complete Separation of Property                                           │
│                                                                              │
│  ── FOR NRA DECEDENTS ONLY ─────────────────────────────────────────       │
│  Total Worldwide Gross Estate (₱)                                            │
│  [  ________________________  ]  Required if any ELIT declared in Tab 6     │
├────────────────────────────────────────────────────────────────────────────┤
│  [← Back]                                     [Save Draft]  [Next: Executor →]│
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Implementation Order

Dependencies define the order. Build in this sequence:

### Phase 1: Foundation (no dependencies)
1. **Auth & Persistence** (§4.2) — Supabase schema, login/signup, dashboard, auto-save
2. **Decedent Header** (§4.13) — ResultsHeader change, zero dependencies
3. **Representation Display** (§4.14) — DistributionSection change, zero dependencies
4. **Share Breakdown Panel** (§4.12) — expandable row, zero dependencies
5. **Statute Citations UI** (§4.5) — `NCC_ARTICLE_DESCRIPTIONS` map + expandable panel
6. **Print Layout** (§4.7) — CSS only, zero dependencies
7. **Donation Summary** (§4.15) — frontend only, zero dependencies

### Phase 2: Core Features (depends on Phase 1)
8. **Firm Branding** (§4.4) — depends on §4.2 (user_profiles table)
9. **PDF Export** (§4.1) — depends on §4.4 (firm header), §4.5 (citations), §4.12–4.15 (data)
10. **Case Notes** (§4.6) — depends on §4.2 (cases table)
11. **Shareable Links** (§4.10) — depends on §4.2 (share_token on cases)
12. **Case Export ZIP** (§4.16) — depends on §4.1 (PDF), §4.2 (case data)
13. **Scenario Comparison** (§4.8) — depends on §4.2 (comparison columns on cases)
14. **Family Tree Visualizer** (§4.19) — depends on Phase 1 (EngineInput/Output in state); no DB

### Phase 3: CRM (depends on Phase 1 + 2)
15. **Client Profiles** (§4.3) — depends on §4.2 (org/user scope)
16. **Conflict Check** (§4.17) — depends on §4.3 (clients table)
17. **Guided Intake Form** (§4.18) — depends on §4.3, §4.17

### Phase 4: Compliance Features (depends on Phase 1)
18. **Deadline Tracker** (§4.20) — depends on §4.2 (cases.date_of_death)
19. **Document Checklist** (§4.22) — depends on §4.2 (cases table)
20. **Timeline Report** (§4.21) — depends on §4.20 (case_deadlines as data source)

### Phase 5: Estate Tax (depends on Phase 1 + 4)
21. **Estate Tax Inputs Wizard** (§4.23) — depends on §4.2 (cases.tax_input_json)
22. **BIR Form 1801 Integration** (§4.9) — depends on §4.23 + §4.1 (combined PDF)

### Phase 6: Multi-Seat (depends on all above)
23. **Multi-Seat Firm Accounts** (§4.11) — depends on §4.2–4.3 (org_id migration on all tables)

---

## 6. Tech Stack & Dependencies

### 6.1 Existing (in package.json, no changes)

| Package | Purpose |
|---|---|
| `react@19` | UI framework |
| `vite` | Build tool |
| `typescript` | Types |
| `tailwindcss@4` | CSS (CSS-first config — no tailwind.config.js) |
| `@shadcn/ui` | Component library (Button, Dialog, Tabs, Badge, Tooltip, Accordion, Drawer, etc.) |
| `zod` | Schema validation |
| `react-hook-form` | Form state management |
| `recharts` | Charts (scenario comparison diff chart) |
| `@supabase/supabase-js@2` | Supabase client |

### 6.2 New Packages to Add

| Package | Version | Purpose | Feature |
|---|---|---|---|
| `@react-pdf/renderer` | `^4.x` | PDF generation | §4.1 |
| `jszip` | `^3.10.1` | ZIP archive | §4.16 |
| `react-markdown` | `^9.x` | Markdown rendering | §4.6 |
| `remark-gfm` | `^4.x` | GFM tables/strikethrough | §4.6 |
| `rehype-sanitize` | `^6.x` | HTML sanitization | §4.6 |
| `qrcode.react` | `^3.x` | QR code component | §4.10 |
| `react-d3-tree` | `^3.6.x` | SVG tree visualization | §4.19 |

**Total new bundle impact:** ~350KB gzip (PDF renderer ~200KB, d3-tree ~85KB — both lazy-loaded; other packages ~65KB total)

### 6.3 Supabase Services Used

| Service | Usage |
|---|---|
| Auth | Google OAuth, email/password, magic link |
| PostgreSQL | All tables with RLS |
| Storage | `firm-logos` bucket |
| Edge Functions | Invitation email delivery (optional) |
| Realtime | Not used (polling with React Query instead) |

---

## 7. Migration Strategy

Numbered SQL migration files in `supabase/migrations/`:

| File | Content |
|---|---|
| `001_initial_schema.sql` | Extensions, enum types, `organizations`, `organization_members`, `organization_invitations`, `user_profiles`, `clients`, `cases` (base columns), `case_notes` + trigger, `update_updated_at()` function |
| `002_firm_branding_fields.sql` | Add `ibp_roll_no`, `ptr_no`, `mcle_compliance_no`, `logo_url`, `letterhead_color`, `secondary_color` to `user_profiles` |
| `003_comparison_columns.sql` | Add `comparison_input_json`, `comparison_output_json`, `comparison_ran_at` to `cases` |
| `004_shared_case_rpc.sql` | `get_shared_case(p_token TEXT)` SECURITY DEFINER RPC |
| `005_case_deadlines.sql` | `case_deadlines` table, indexes, RLS, `get_case_deadline_summaries` RPC |
| `006_case_documents.sql` | `case_documents` table, indexes, RLS |
| `007_conflict_check.sql` | `pg_trgm` extension, `conflict_check_log` table, `run_conflict_check` RPC |
| `008_estate_tax_columns.sql` | Add `tax_input_json`, `tax_output_json`, `gross_estate` to `cases` |
| `009_cases_intake_data.sql` | Add `intake_data JSONB` to `cases` for guided intake metadata |
| `010_rls_org_scope.sql` | Update all RLS policies from `user_id` scoping to `org_id` scoping (multi-seat migration) |

**Rollback strategy:** Each migration is additive (ADD COLUMN, CREATE TABLE) where possible. Non-additive changes (RLS policy updates in `010`) have corresponding down migration files.

**Seeding `organizations` for existing users:**
```sql
-- Run after 001: create solo org for every existing user
INSERT INTO organizations (name, slug, plan, seat_limit)
SELECT
  COALESCE(up.firm_name, 'Solo Practice'),
  'user-' || substr(u.id::text, 1, 8),
  'solo',
  1
FROM auth.users u
LEFT JOIN user_profiles up ON up.id = u.id
ON CONFLICT (slug) DO NOTHING;

-- Link each user to their org
INSERT INTO organization_members (org_id, user_id, role)
SELECT o.id, u.id, 'admin'
FROM auth.users u
JOIN organizations o ON o.slug = 'user-' || substr(u.id::text, 1, 8);

-- Update cases and clients to reference org_id
UPDATE cases c SET org_id = (
  SELECT org_id FROM organization_members WHERE user_id = c.user_id LIMIT 1
);
UPDATE clients cl SET org_id = (
  SELECT org_id FROM organization_members WHERE user_id = cl.created_by LIMIT 1
);
```

---

## 8. Acceptance Criteria

### Global Acceptance Criteria (All Features)

- All UI components are accessible (WCAG 2.1 AA minimum): keyboard navigation, ARIA labels, focus management in modals
- All Supabase queries use RLS-scoped policies; no query returns cross-user data
- No secrets (API keys, service role key) in client-side code
- All monetary amounts rendered in Philippine Peso (₱) with comma-formatted centavo display: `₱1,234,567.89`
- All Philippine Civil Code citations use format "Art. XXX NCC" matching engine output
- All dates use Philippine locale display: "15 Jan 2026" (dd MMM YYYY) in UI; ISO date (YYYY-MM-DD) in storage

### Feature-Specific Acceptance Criteria

#### §4.1 PDF Export
- PDF renders in A4 portrait, margins 38mm/25mm/30mm/25mm
- Firm logo appears when `user_profiles.logo_url` is set
- All NCC citations in per-heir section include full article description text
- PDF file name: `estate-{decedent-name-slug}-{YYYY-MM-DD}.pdf`
- Download completes in < 5 seconds for standard 10-heir case

#### §4.2 Auth & Persistence
- Google OAuth, email/password, and magic link all complete sign-in
- Auto-save fires 1500ms after last input change; "Saved" status indicator appears
- Case loads within 2 seconds on returning to a saved case
- Status state machine enforced: cannot transition `archived → draft`; cannot edit `finalized` case

#### §4.3 Client Profiles
- TIN input auto-formats to `XXX-XXX-XXX` as user types
- Client search debounces 300ms; returns results within 1 second
- Civil status field enforces valid PH values

#### §4.4 Firm Branding
- Logo upload validates file type (PNG/JPG/SVG) and size (≤2MB) before upload
- Live PDF preview panel updates within 1 second after any settings change
- `letterhead_color` default `#1E3A5F`; `secondary_color` default `#C9A84C`

#### §4.5 Statute Citations UI
- Every article in `legal_basis[]` array has a human-readable description from `NCC_ARTICLE_DESCRIPTIONS`
- Unknown articles (not in map) display the raw key without error
- `forcedExpanded = true` expands all rows for print

#### §4.6 Case Notes
- Markdown renders correctly: bold, italic, lists, code blocks
- All HTML injection attempts are sanitized (script tags, iframes)
- Notes are hidden in shareable link view

#### §4.7 Print Layout
- `@media print` CSS hides nav, buttons, wizard panels
- Accordion rows expand before printing via `usePrintExpand`
- A4 margins correct when printed from Chrome and Firefox

#### §4.8 Scenario Comparison
- "Compare Scenarios" button only shown when `input.will !== null`
- Comparison runs WASM engine client-side within 2 seconds
- Delta values correctly calculated: positive = heir gains under will, negative = heir loses
- Results persisted to `cases.comparison_*` columns

#### §4.9 BIR Form 1801 Integration
- Bridge formula: `net_distributable_estate = max(0, estate_tax_output.item40 - estate_tax_output.item44)`
- Inheritance engine re-runs automatically when `tax_output_json` changes
- Combined PDF includes both inheritance and estate tax sections

#### §4.10 Shareable Links
- `/share/:token` loads case without authentication
- Notes, edit controls, and admin panels are hidden on shared view
- Privacy warning dialog shown every time share dialog opens (not dismissible)
- Token is UUID v4; cannot be guessed by enumeration
- `get_shared_case` RPC returns nothing when `share_enabled = FALSE`

#### §4.11 Multi-Seat Firm Accounts
- Invitation token expires after 7 days; expired links show error
- Role restrictions enforced: paralegal cannot finalize/delete; readonly cannot edit
- Seat limit enforced: cannot add members beyond `organizations.seat_limit`
- All RLS policies use `org_id` scope after migration

#### §4.12 Share Breakdown Panel
- `from_legitime`, `from_free_portion`, `from_intestate` shown only when > 0
- `legitime_fraction` shown only for compulsory heirs
- All amounts formatted in ₱ with proper centavo display

#### §4.13 Decedent Header
- `ResultsHeader` h1 shows "Estate of [decedent name]"
- DOD formatted as "15 Jan 2026" using string-split method (no timezone offset)

#### §4.14 Representation Display
- "representing [parent name]" sub-label shown under heir name when `inherits_by === 'Representation'`
- Falls back to "representing deceased heir" when parent name not found

#### §4.15 Donation Summary
- `DonationsSummaryPanel` appears only when `EngineInput.donations` is non-empty
- Each donation shows collation status chip with correct NCC citation
- Total rows correctly sum collatable and exempt amounts

#### §4.16 Case Export ZIP
- ZIP downloads as `estate-{slug}-{YYYY-MM-DD}.zip`
- `input.json` and `output.json` are valid JSON (parseable with `JSON.parse`)
- `metadata.json` includes `export_format_version: "1.0"`
- Notes included as `notes.txt` only when case has at least one note

#### §4.17 Conflict of Interest Check
- Name input requires minimum 2 characters before "Run" button enables
- Trigram search threshold 0.35; results include both clients and case heir names
- TIN exact match included regardless of name similarity
- Every check run saves a `conflict_check_log` row
- Notes textarea required when flagged; proceed button disabled until notes ≥ 5 chars and checkbox checked
- `run_conflict_check` RPC only returns data for `auth.uid()`

#### §4.18 Guided Client Intake Form
- All 7 steps navigate forward/backward without data loss
- Intake form creates exactly one `clients` row and one `cases` row
- `EngineInput.family_tree` is pre-populated from Step 4 family composition
- Deadline generation fires from Step 6 track selection

#### §4.19 Family Tree Visualizer
- "Family Tree" tab is the 2nd tab (after Distribution); default tab remains Distribution
- Decedent node shows "†" symbol; spouse node connected by violet dashed line
- Representation edges are dashed gray
- `[Download SVG]` downloads file with decedent name and DOD in filename
- Lazy-loaded: react-d3-tree does not appear in initial bundle
- All 7 getResultsLayout() variants render correctly in Distribution tab after restructure

#### §4.20 Deadline Tracker
- BIR filing deadline is exactly 365 days after `date_of_death`
- Publication complete is +111 days (deed execute + 21 days)
- "Mark Done" modal defaults to today; validates completion date not before DOD
- Custom deadlines show "Added manually" indicator; auto deadlines cannot be deleted
- `/deadlines` route shows all pending deadlines across active cases, grouped by urgency

#### §4.21 Timeline Report
- 7 stages mapped from case_deadlines milestone completion state
- Stage status (complete/in-progress/upcoming/overdue) correctly derived
- Timeline report accessible via `/share/{token}?view=timeline` (no auth required)

#### §4.22 Document Checklist
- Smart seeding: TCT items only appear when `realProperties.length > 0`
- SPA items only appear when any heir has an overseas address
- Progress bar: obtained / (total − not_applicable) × 100
- "Not Applicable" items excluded from progress count

#### §4.23 Estate Tax Inputs Wizard
- 8 tabs navigable with forward/back; tab completion indicators show progress
- Pre-population: name, DOD, marital status, property regime from inheritance wizard on first open
- Funeral expenses section hidden when DOD ≥ 2018-01-01 (POST_TRAIN rules)
- Auto-save fires 1500ms after any field change to `cases.tax_input_json`
- Tab 1 validation requires: name (non-empty), dateOfDeath (valid ISO ≤ today), address (non-empty)

---

*Spec generated: 2026-03-01 by Philippine Inheritance Premium Features Reverse Ralph Loop, Wave 3.*
