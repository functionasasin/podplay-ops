# Architecture Overview — Philippine Inheritance Premium Platform

## Purpose

Cross-cutting architecture document synthesizing all 23 Wave 2 feature specifications into a unified blueprint: full data model ERD, complete Supabase DDL, React component hierarchy, API layer design, implementation dependency graph, and migration strategy.

---

## 1. Entity-Relationship Diagram (ASCII)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         PHILIPPINE INHERITANCE PREMIUM — FULL ERD                    │
└─────────────────────────────────────────────────────────────────────────────────────┘

  auth.users (Supabase managed)
       │ 1
       │────────────── 1 ──────── user_profiles
       │                          id, email, full_name,
       │                          firm_name, firm_address, firm_phone, firm_email,
       │                          counsel_name, counsel_email, counsel_phone,
       │                          ibp_roll_no, ptr_no, mcle_compliance_no,
       │                          logo_url, letterhead_color, secondary_color
       │
       │ N                 N
       └──── organization_members ──── organizations
              org_id, user_id, role    id, name, slug, plan, seat_limit

                          │
                          │ 1 (org_id)
             ┌────────────┼─────────────────────────────────────────┐
             │            │                                         │
             N            N                                         N
          clients      cases                               organization_invitations
          id           id                                  org_id, email, role,
          org_id       org_id, user_id (created_by)        token, status, expires_at
          full_name    client_id (FK → clients, nullable)
          tin          title, status
          gov_id_*     input_json (EngineInput)
          civil_status output_json (EngineOutput)
          ...          tax_input_json (EstateTaxInput)
                       tax_output_json (EstateTaxOutput)
                       comparison_input_json, comparison_output_json
                       share_token, share_enabled
                       notes_count
                │ 1
                │─────────────────────────────────────┐
                │                                     │
       ┌────────┴─────────────────────────┐           │
       │ N            │ N    │ N          │ N          │ N
  case_notes    case_deadlines  case_documents  conflict_check_log
  id            id              id              id
  case_id       case_id         case_id         org_id, user_id
  user_id       user_id         user_id         client_id (FK, nullable)
  content       milestone_key   document_key    checked_name, checked_tin
  created_at    due_date        category        result_json, outcome
                completed_date  is_obtained
                legal_basis     obtained_date
```

**Cardinality Summary:**
- 1 organization → N members (auth.users via junction)
- 1 organization → N clients
- 1 organization → N cases
- 1 client → N cases (optional; cases.client_id nullable)
- 1 case → N case_notes (append-only)
- 1 case → N case_deadlines (up to ~9 EJS or ~4 probate milestones + custom)
- 1 case → N case_documents (15–35 per case depending on complexity)
- 1 organization → N conflict_check_log entries

---

## 2. Supabase Schema DDL

### 2.1 Extensions Required

```sql
-- Trigram similarity for conflict-check name search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### 2.2 Enumerated Types

```sql
CREATE TYPE case_status AS ENUM (
  'draft',       -- input saved, not computed
  'computed',    -- WASM computation run, output stored
  'finalized',   -- attorney signed off; no edits
  'archived'     -- closed; visible but read-only
);

CREATE TYPE client_status AS ENUM (
  'active',      -- current client
  'former'       -- soft-deleted / no longer active
);

CREATE TYPE org_role AS ENUM (
  'admin',       -- full firm management + all cases/clients
  'attorney',    -- create/edit own cases; view all firm cases
  'paralegal',   -- edit cases; cannot finalize or delete
  'readonly'     -- view-only access to all firm data
);

CREATE TYPE invitation_status AS ENUM (
  'pending',             -- awaiting acceptance
  'accepted',            -- user joined org
  'expired',             -- past expires_at
  'revoked'              -- admin cancelled before acceptance
);

CREATE TYPE conflict_outcome AS ENUM (
  'clear',               -- no matches found
  'flagged',             -- matches found; blocked pending review
  'cleared_after_review',-- attorney reviewed and confirmed no conflict
  'skipped'              -- attorney chose to skip screening
);

CREATE TYPE gov_id_type AS ENUM (
  'philsys_id',
  'passport',
  'drivers_license',
  'sss',
  'gsis',
  'prc',
  'voters_id',
  'postal_id',
  'senior_citizen_id',
  'umid',
  'nbi_clearance'
);
```

### 2.3 Organizations

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

-- Plan capacities: solo=1, team=5, firm=unlimited (seat_limit=9999)
```

### 2.4 Organization Members

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

### 2.5 Organization Invitations

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

### 2.6 User Profiles (includes Firm Branding)

```sql
CREATE TABLE user_profiles (
  -- Identity
  id                   UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                TEXT        NOT NULL,
  full_name            TEXT,

  -- Firm identity (spec-firm-branding)
  firm_name            TEXT        CHECK (char_length(firm_name) <= 200),
  firm_address         TEXT        CHECK (char_length(firm_address) <= 500),
  firm_phone           TEXT,
  firm_email           TEXT,

  -- Counsel credentials (printed on PDF; required for finalized cases)
  counsel_name         TEXT,
  counsel_email        TEXT,
  counsel_phone        TEXT,
  ibp_roll_no          TEXT,       -- e.g. "IBP Roll No. 123456"
  ptr_no               TEXT,       -- Professional Tax Receipt number
  mcle_compliance_no   TEXT,       -- e.g. "MCLE Compliance No. VII-0012345"

  -- Logo (stored in Supabase Storage bucket "firm-logos")
  logo_url             TEXT,       -- Storage path, not public URL

  -- Brand colors for PDF/print letterhead
  letterhead_color     TEXT        NOT NULL DEFAULT '#1E3A5F',
  secondary_color      TEXT        NOT NULL DEFAULT '#C9A84C',

  -- Timestamps
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.7 Clients

```sql
CREATE TABLE clients (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Identity
  full_name         TEXT         NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 200),
  nickname          TEXT,
  date_of_birth     DATE,
  place_of_birth    TEXT,

  -- Contact
  email             TEXT,
  phone             TEXT,
  address           TEXT,

  -- Philippine-specific identifiers
  tin               TEXT         CHECK (tin IS NULL OR tin ~ '^\d{3}-\d{3}-\d{3}(-\d{3})?$'),
  gov_id_type       gov_id_type,
  gov_id_number     TEXT,
  civil_status      TEXT         CHECK (civil_status IN (
                                   'single', 'married', 'widowed',
                                   'legally_separated', 'annulled'
                                 )),

  -- CRM lifecycle
  status            client_status NOT NULL DEFAULT 'active',
  intake_date       DATE          NOT NULL DEFAULT CURRENT_DATE,
  referral_source   TEXT,

  -- Conflict check state (from spec-conflict-check)
  conflict_cleared  BOOLEAN,     -- NULL=not yet checked, TRUE=cleared, FALSE=skipped/still flagged
  conflict_notes    TEXT,

  -- Audit
  created_by        UUID         REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clients_org_id    ON clients(org_id);
CREATE INDEX idx_clients_status    ON clients(org_id, status);
CREATE INDEX idx_clients_name_trgm ON clients USING gin(full_name gin_trgm_ops);
CREATE INDEX idx_clients_tin       ON clients(tin) WHERE tin IS NOT NULL;
```

### 2.8 Cases

```sql
CREATE TABLE cases (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                 UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id                UUID        NOT NULL REFERENCES auth.users(id),   -- created by
  client_id              UUID        REFERENCES clients(id) ON DELETE SET NULL,
  title                  TEXT        NOT NULL DEFAULT 'Untitled Case'
                                     CHECK (char_length(title) <= 300),
  status                 case_status NOT NULL DEFAULT 'draft',

  -- Inheritance computation (spec-auth-persistence)
  input_json             JSONB,      -- EngineInput type
  output_json            JSONB,      -- EngineOutput type

  -- Estate tax computation (spec-bir-1801-integration)
  tax_input_json         JSONB,      -- EstateTaxInput type (from spec-estate-tax-inputs-wizard)
  tax_output_json        JSONB,      -- EstateTaxOutput type

  -- Testate vs. intestate comparison (spec-scenario-comparison)
  comparison_input_json  JSONB,      -- EngineInput with will: null
  comparison_output_json JSONB,      -- EngineOutput (intestate result)
  comparison_ran_at      TIMESTAMPTZ,

  -- Denormalized fast-access fields (maintained via trigger or app layer)
  decedent_name          TEXT,       -- mirrors input_json->decedent->name
  date_of_death          DATE,       -- mirrors input_json->decedent->date_of_death
  gross_estate           NUMERIC(16,2), -- mirrors tax_input_json total gross estate

  -- Sharing (spec-shareable-links)
  share_token            UUID        UNIQUE DEFAULT gen_random_uuid(),
  share_enabled          BOOLEAN     NOT NULL DEFAULT FALSE,

  -- Denormalized counters (maintained by triggers)
  notes_count            INT         NOT NULL DEFAULT 0,

  -- Timestamps
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cases_org_id      ON cases(org_id);
CREATE INDEX idx_cases_user_id     ON cases(user_id);
CREATE INDEX idx_cases_client_id   ON cases(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_cases_status      ON cases(org_id, status);
CREATE INDEX idx_cases_updated_at  ON cases(org_id, updated_at DESC);
CREATE INDEX idx_cases_share_token ON cases(share_token) WHERE share_enabled = TRUE;
CREATE INDEX idx_cases_dod         ON cases(date_of_death) WHERE date_of_death IS NOT NULL;
```

### 2.9 Case Notes

```sql
CREATE TABLE case_notes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id    UUID        NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id),
  content    TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 10000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- No updated_at: append-only; no UPDATE permitted via RLS
);

CREATE INDEX idx_case_notes_case_id ON case_notes(case_id, created_at DESC);

-- Maintain cases.notes_count denormalization
CREATE OR REPLACE FUNCTION fn_sync_notes_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE cases SET notes_count = notes_count + 1 WHERE id = NEW.case_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE cases SET notes_count = GREATEST(0, notes_count - 1) WHERE id = OLD.case_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_sync_notes_count
  AFTER INSERT OR DELETE ON case_notes
  FOR EACH ROW EXECUTE FUNCTION fn_sync_notes_count();
```

### 2.10 Case Deadlines

```sql
CREATE TABLE case_deadlines (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id          UUID        NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL REFERENCES auth.users(id),
  milestone_key    TEXT        NOT NULL,  -- e.g. 'ejs_bir_filing', 'probate_inventory'
  label            TEXT        NOT NULL,  -- e.g. 'BIR Estate Tax Filing'
  description      TEXT        NOT NULL,  -- e.g. 'File BIR Form 1801 with payment'
  due_date         DATE        NOT NULL,
  completed_date   DATE,
  legal_basis      TEXT        NOT NULL,  -- e.g. 'TRAIN Law §86; BIR RR 12-2018 §6'
  is_auto          BOOLEAN     NOT NULL DEFAULT TRUE,  -- FALSE for custom deadlines
  note             TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (case_id, milestone_key)
);

CREATE INDEX idx_deadlines_case_id  ON case_deadlines(case_id);
CREATE INDEX idx_deadlines_due_date ON case_deadlines(due_date)
  WHERE completed_date IS NULL;
```

**Milestone Keys and Rules:**

| Track | milestone_key | Offset from DOD | Legal Basis |
|-------|---------------|-----------------|-------------|
| EJS | ejs_estate_tin | +30 days | BIR RR 12-2018 §3 |
| EJS | ejs_bir_notice | +60 days | NIRC §89(A) |
| EJS | ejs_deed_execute | +90 days | Rule 74, Rules of Court |
| EJS | ejs_publication_start | +90 days | Rule 74 §1 |
| EJS | ejs_publication_complete | +111 days | Rule 74 §1 (3-week requirement) |
| EJS | ejs_bir_filing | +365 days | TRAIN Law §86; BIR RR 12-2018 §6 |
| EJS | ejs_ecar_receipt | +395 days | BIR RMO 15-2003 |
| EJS | ejs_lgu_transfer_tax | +420 days | Local Government Code §135 |
| EJS | ejs_rd_registration | +450 days | PD 1529 §53 |
| Probate | probate_estate_tin | +30 days | BIR RR 12-2018 §3 |
| Probate | probate_petition_filing | +30 days | Rule 73 §2 |
| Probate | probate_inventory | +150 days | Rule 83 §1 (3-month rule) |
| Probate | probate_bir_filing | +365 days | TRAIN Law §86 |

### 2.11 Case Documents Checklist

```sql
CREATE TABLE case_documents (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id           UUID        NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id           UUID        NOT NULL REFERENCES auth.users(id),
  document_key      TEXT        NOT NULL,  -- e.g. 'psa_death_cert', 'tct_property_1'
  category          TEXT        NOT NULL
                                CHECK (category IN (
                                  'identity', 'real_property', 'financial',
                                  'business', 'tax', 'court', 'overseas'
                                )),
  label             TEXT        NOT NULL,  -- e.g. 'PSA-certified Death Certificate'
  description       TEXT        NOT NULL DEFAULT '',
  is_obtained       BOOLEAN     NOT NULL DEFAULT FALSE,
  obtained_date     DATE,
  notes             TEXT,
  is_not_applicable BOOLEAN     NOT NULL DEFAULT FALSE,
  is_auto           BOOLEAN     NOT NULL DEFAULT TRUE,  -- FALSE for custom items
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (case_id, document_key)
);

CREATE INDEX idx_case_docs_case_id ON case_documents(case_id);
```

**Auto-seeded document keys by category:**

| category | document_key | label | Condition |
|----------|-------------|-------|-----------|
| identity | psa_death_cert | PSA-certified Death Certificate (original) | always |
| identity | psa_birth_cert_heirs | PSA Birth Certificates of all heirs | always |
| identity | psa_marriage_cert | PSA-certified Marriage Certificate | if married decedent |
| identity | govt_id_heirs | Valid Government IDs of all heirs | always |
| real_property | tct_property | Transfer Certificate of Title (TCT) | if real property in input |
| real_property | tax_dec_property | Tax Declaration (most recent) | if real property in input |
| real_property | bv_property | BIR-approved Zonal Value / BIR Certification | if real property |
| financial | bank_cert_deposits | Bank Certification of deposits as of DOD | if financial assets |
| financial | stock_cert | Stock Certificate / Broker Statement | if stocks in input |
| financial | car_or | Certificate of Registration + OR (motor vehicle) | if vehicle assets |
| tax | itr_last3 | Income Tax Returns (last 3 years before DOD) | always |
| tax | bir_form_1901 | BIR TIN of estate / BIR Form 1901 | always |
| court | spa_heirs | Special Power of Attorney (overseas heirs) | if overseas heirs |
| court | will_notarized | Notarized Last Will and Testament | if testate case |
| business | business_papers | Business Registration / Articles of Incorporation | if business assets |

### 2.12 Conflict Check Log

```sql
CREATE TABLE conflict_check_log (
  id            UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID             NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id       UUID             NOT NULL REFERENCES auth.users(id),
  client_id     UUID             REFERENCES clients(id) ON DELETE SET NULL,
  checked_name  TEXT             NOT NULL,
  checked_tin   TEXT,
  result_json   JSONB            NOT NULL DEFAULT '[]',
  -- result_json: Array<{ match_type: 'client'|'heir', name: string, similarity: number,
  --                       client_id?: string, case_id?: string, role: string }>
  match_count   INT              NOT NULL DEFAULT 0,
  outcome       conflict_outcome NOT NULL DEFAULT 'clear',
  outcome_notes TEXT,
  checked_at    TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conflict_log_org_id    ON conflict_check_log(org_id, checked_at DESC);
CREATE INDEX idx_conflict_log_client_id ON conflict_check_log(client_id)
  WHERE client_id IS NOT NULL;
```

---

## 3. Row-Level Security (RLS) Policies

### 3.1 RLS Helper Functions

```sql
-- Returns the org_id of the current authenticated user
CREATE OR REPLACE FUNCTION auth.current_org_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT org_id
  FROM   organization_members
  WHERE  user_id = auth.uid()
  LIMIT  1;
$$;

-- Returns the org role of the current authenticated user
CREATE OR REPLACE FUNCTION auth.current_org_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role::text
  FROM   organization_members
  WHERE  user_id = auth.uid()
  LIMIT  1;
$$;

-- Returns TRUE if current user has one of the given roles
CREATE OR REPLACE FUNCTION auth.has_role(VARIADIC roles TEXT[])
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = auth.uid()
      AND role::text = ANY(roles)
  );
$$;
```

### 3.2 organizations RLS

```sql
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_select_member ON organizations FOR SELECT
  USING (id = auth.current_org_id());

CREATE POLICY org_update_admin ON organizations FOR UPDATE
  USING (id = auth.current_org_id() AND auth.current_org_role() = 'admin');
```

### 3.3 organization_members RLS

```sql
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY members_select ON organization_members FOR SELECT
  USING (org_id = auth.current_org_id());

CREATE POLICY members_insert_admin ON organization_members FOR INSERT
  WITH CHECK (org_id = auth.current_org_id() AND auth.current_org_role() = 'admin');

CREATE POLICY members_delete_admin ON organization_members FOR DELETE
  USING (org_id = auth.current_org_id() AND auth.current_org_role() = 'admin'
         AND user_id != auth.uid());  -- cannot remove self
```

### 3.4 user_profiles RLS

```sql
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own ON user_profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY profiles_upsert_own ON user_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update_own ON user_profiles FOR UPDATE
  USING (id = auth.uid());
```

### 3.5 clients RLS

```sql
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY clients_select_org ON clients FOR SELECT
  USING (org_id = auth.current_org_id());

CREATE POLICY clients_insert_org ON clients FOR INSERT
  WITH CHECK (org_id = auth.current_org_id()
              AND auth.has_role('admin', 'attorney', 'paralegal'));

CREATE POLICY clients_update_org ON clients FOR UPDATE
  USING (org_id = auth.current_org_id()
         AND auth.has_role('admin', 'attorney', 'paralegal'));

CREATE POLICY clients_delete_admin ON clients FOR DELETE
  USING (org_id = auth.current_org_id() AND auth.current_org_role() = 'admin');
```

### 3.6 cases RLS

```sql
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

-- Org members can read all firm cases
CREATE POLICY cases_select_org ON cases FOR SELECT
  USING (org_id = auth.current_org_id());

-- Public read via share_token (no auth required)
CREATE POLICY cases_select_shared ON cases FOR SELECT
  USING (share_enabled = TRUE AND share_token IS NOT NULL);

CREATE POLICY cases_insert_org ON cases FOR INSERT
  WITH CHECK (org_id = auth.current_org_id()
              AND auth.has_role('admin', 'attorney', 'paralegal'));

CREATE POLICY cases_update_org ON cases FOR UPDATE
  USING (org_id = auth.current_org_id()
         AND auth.has_role('admin', 'attorney', 'paralegal')
         AND status != 'finalized');

CREATE POLICY cases_delete_admin ON cases FOR DELETE
  USING (org_id = auth.current_org_id() AND auth.current_org_role() = 'admin');
```

### 3.7 case_notes RLS

```sql
ALTER TABLE case_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY notes_select_org ON case_notes FOR SELECT
  USING (case_id IN (SELECT id FROM cases WHERE org_id = auth.current_org_id()));

CREATE POLICY notes_insert_org ON case_notes FOR INSERT
  WITH CHECK (case_id IN (SELECT id FROM cases WHERE org_id = auth.current_org_id())
              AND auth.has_role('admin', 'attorney', 'paralegal'));

-- No UPDATE policy: append-only design
CREATE POLICY notes_delete_own ON case_notes FOR DELETE
  USING (user_id = auth.uid() OR auth.current_org_role() = 'admin');
```

### 3.8 case_deadlines, case_documents, conflict_check_log RLS

```sql
-- Pattern: same org-scoped policies applied to all three tables
-- case_deadlines
ALTER TABLE case_deadlines ENABLE ROW LEVEL SECURITY;
CREATE POLICY deadlines_select_org ON case_deadlines FOR SELECT
  USING (case_id IN (SELECT id FROM cases WHERE org_id = auth.current_org_id()));
CREATE POLICY deadlines_insert_org ON case_deadlines FOR INSERT
  WITH CHECK (case_id IN (SELECT id FROM cases WHERE org_id = auth.current_org_id())
              AND auth.has_role('admin', 'attorney', 'paralegal'));
CREATE POLICY deadlines_update_org ON case_deadlines FOR UPDATE
  USING (case_id IN (SELECT id FROM cases WHERE org_id = auth.current_org_id())
         AND auth.has_role('admin', 'attorney', 'paralegal'));
CREATE POLICY deadlines_delete_org ON case_deadlines FOR DELETE
  USING (case_id IN (SELECT id FROM cases WHERE org_id = auth.current_org_id())
         AND (user_id = auth.uid() OR auth.current_org_role() = 'admin'));

-- case_documents (same pattern)
ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY docs_select_org ON case_documents FOR SELECT
  USING (case_id IN (SELECT id FROM cases WHERE org_id = auth.current_org_id()));
CREATE POLICY docs_insert_org ON case_documents FOR INSERT
  WITH CHECK (case_id IN (SELECT id FROM cases WHERE org_id = auth.current_org_id())
              AND auth.has_role('admin', 'attorney', 'paralegal'));
CREATE POLICY docs_update_org ON case_documents FOR UPDATE
  USING (case_id IN (SELECT id FROM cases WHERE org_id = auth.current_org_id())
         AND auth.has_role('admin', 'attorney', 'paralegal'));

-- conflict_check_log
ALTER TABLE conflict_check_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY conflict_select_org ON conflict_check_log FOR SELECT
  USING (org_id = auth.current_org_id());
CREATE POLICY conflict_insert_org ON conflict_check_log FOR INSERT
  WITH CHECK (org_id = auth.current_org_id()
              AND auth.has_role('admin', 'attorney', 'paralegal'));
-- No UPDATE or DELETE: immutable audit log
```

### 3.9 Supabase Storage Buckets

```sql
-- Firm logos (private; accessed via signed URLs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'firm-logos',
  'firm-logos',
  FALSE,
  2097152,  -- 2MB limit
  ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
);

-- Storage RLS: user can read/write their own logo
CREATE POLICY logo_select ON storage.objects FOR SELECT
  USING (bucket_id = 'firm-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY logo_insert ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'firm-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY logo_update ON storage.objects FOR UPDATE
  USING (bucket_id = 'firm-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 4. React Component Hierarchy

### 4.1 Application Routes

```
App (React Router v6)
├── / (public)                      — EphemeralApp (existing wizard → results)
├── /auth                           — AuthPage (sign in / sign up)
├── /invite/:token                  — InviteAcceptPage
├── /share/:token                   — SharedCaseView (read-only, no auth)
└── /app (authenticated, requires AuthGuard)
    ├── /app                        → redirect to /app/dashboard
    ├── /app/dashboard              — Dashboard (case list)
    ├── /app/cases/new              — NewCasePage (new case wizard)
    ├── /app/cases/:id              — CaseEditorPage
    │   ├── CaseEditorLayout
    │   │   ├── CaseHeader (title, status, client name, actions)
    │   │   ├── CaseTabs
    │   │   │   ├── [tab: compute]   — InheritanceWizard + ResultsView
    │   │   │   ├── [tab: tax]       — EstateTaxWizard + TaxResultsView
    │   │   │   ├── [tab: notes]     — CaseNotesPanel
    │   │   │   ├── [tab: deadlines] — DeadlineTrackerPanel
    │   │   │   ├── [tab: documents] — DocumentChecklistPanel
    │   │   │   └── [tab: share]     — ShareLinkPanel
    │   │   └── ComparisonDrawer (testate vs. intestate diff)
    ├── /app/clients                — ClientListPage
    ├── /app/clients/new            — ClientIntakePage
    │   ├── ConflictCheckStep
    │   ├── ClientInfoStep
    │   └── DecedentInfoStep
    ├── /app/clients/:id            — ClientDetailPage
    │   ├── ClientInfoCard
    │   └── ClientCasesList
    ├── /app/deadlines              — AllDeadlinesPage (cross-case deadline calendar)
    └── /app/settings
        ├── /app/settings/firm      — FirmBrandingPage
        └── /app/settings/members  — MembersPage (admin only)
```

### 4.2 Feature Component Tree

```
EphemeralApp (preserved for anonymous usage)
├── InheritanceWizard
│   ├── WizardProgress
│   ├── DecedentStep
│   ├── SpouseStep
│   ├── DescendantsStep
│   ├── AscendantsStep
│   ├── CollateralsStep
│   ├── DonationsStep
│   └── ReviewStep
├── ResultsView                            ← extended by multiple specs
│   ├── ResultsHeader                      ← spec-decedent-header
│   │   ├── DecedentTitle ("Estate of …")
│   │   └── DateOfDeathSubtitle
│   ├── DistributionSection                ← 7 layout variants
│   │   ├── DistributionTable
│   │   │   ├── HeirRow
│   │   │   │   ├── RepresentsLabel        ← spec-represents-display
│   │   │   │   ├── LegalBasisCell         ← spec-statute-citations-ui
│   │   │   │   │   └── ArticleTooltip
│   │   │   │   └── ShareBreakdownExpander ← spec-share-breakdown-panel
│   │   │   └── TotalsRow
│   │   └── PieChart (Recharts)
│   ├── DonationsSummaryPanel              ← spec-donation-summary-in-results
│   │   ├── DonationRow
│   │   └── CollationStatusBadge
│   ├── ComparisonPanel                    ← spec-scenario-comparison
│   │   ├── ComparisonDiffTable
│   │   └── HeirDeltaBadge
│   ├── NarrativePanel
│   ├── ComputationLog
│   ├── WarningsPanel
│   └── ActionsBar                         ← extended by specs
│       ├── EditButton
│       ├── ExportJsonButton
│       ├── CopyNarrativesButton
│       ├── PrintButton                    ← spec-print-layout
│       ├── ExportPdfButton                ← spec-pdf-export
│       ├── SaveCaseButton                 ← spec-auth-persistence
│       ├── ShareButton                    ← spec-shareable-links
│       └── CompareScenarioButton          ← spec-scenario-comparison

CaseEditorPage
├── CaseHeader
│   ├── CaseTitleInput
│   ├── StatusBadge
│   ├── ClientNameTag
│   └── CaseActions (finalize, archive, delete, export ZIP)   ← spec-case-export-zip
├── CaseTabs
│   ├── ComputeTab → ResultsView (above)
│   ├── TaxTab
│   │   ├── EstateTaxWizard                ← spec-estate-tax-inputs-wizard
│   │   │   ├── Tab1_DecedentExecutor
│   │   │   ├── Tab2_Schedule1_RealProperty
│   │   │   ├── Tab3_Schedule1A_Revaluation
│   │   │   ├── Tab4_Schedule2_Donations
│   │   │   ├── Tab5_Schedules3to5_Other
│   │   │   ├── Tab6_Deductions
│   │   │   ├── Tab7_Settings
│   │   │   └── Tab8_Review
│   │   └── TaxResultsView                 ← spec-bir-1801-integration
│   │       ├── TaxSummaryCard
│   │       ├── Form1801ScheduleTable
│   │       └── NetDistributableEstateCard
│   ├── NotesTab → CaseNotesPanel          ← spec-case-notes
│   │   ├── NoteComposer (markdown textarea)
│   │   ├── NotesList
│   │   └── NoteCard (timestamp, content, delete)
│   ├── DeadlinesTab → DeadlineTrackerPanel ← spec-deadline-tracker
│   │   ├── TrackSelector (EJS / Probate)
│   │   ├── DeadlineTimeline
│   │   │   └── MilestoneRow (label, due, status, mark-done button)
│   │   └── AddCustomDeadlineButton
│   ├── DocumentsTab → DocumentChecklistPanel ← spec-document-checklist
│   │   ├── CategorySection (identity, real_property, etc.)
│   │   │   └── DocumentRow (checkbox, obtained_date, notes, N/A toggle)
│   │   └── ProgressBar
│   └── ShareTab → ShareLinkPanel          ← spec-shareable-links
│       ├── ShareUrlDisplay
│       ├── CopyLinkButton
│       ├── QrCodeDisplay
│       ├── EnableShareToggle
│       └── RevokeButton

FamilyTreeVisualizerPanel                  ← spec-family-tree-visualizer
  ├── SVGCanvas (D3-driven)
  │   ├── PersonNode (circle + name + status badge)
  │   └── RelationshipEdge (line + label)
  └── ExportPngButton

TimelineReportPanel                        ← spec-timeline-report
  ├── GanttChart (Recharts or custom SVG)
  └── MilestoneRow (milestone_key → label, due_date, status color)
```

### 4.3 Authentication Components

```
AuthProvider (context: session, user, org, role)
├── SupabaseClient (singleton)
├── AuthGuard (redirects unauthenticated to /auth)
└── OrgInitializer (creates personal org on first sign-in)

AuthPage
├── SignInForm (email + password)
├── MagicLinkForm
└── GoogleOAuthButton

InviteAcceptPage
├── InviteDetailsCard (from token lookup)
└── AcceptInviteButton
```

---

## 5. API Layer Design

### 5.1 Supabase Client Pattern

All data access uses the typed Supabase client generated via:
```bash
supabase gen types typescript --project-id <project-ref> > src/types/supabase.ts
```

All queries are in `src/lib/api/` modules, one file per entity:
- `src/lib/api/cases.ts`
- `src/lib/api/clients.ts`
- `src/lib/api/case-notes.ts`
- `src/lib/api/case-deadlines.ts`
- `src/lib/api/case-documents.ts`
- `src/lib/api/organizations.ts`
- `src/lib/api/conflict-check.ts`

### 5.2 Core API Contracts

#### Cases API (`src/lib/api/cases.ts`)

```typescript
// Create a new draft case
createCase(title: string, clientId?: string): Promise<CaseRow>
// POST equivalent: INSERT INTO cases (org_id, user_id, title, client_id) VALUES (...)
// Returns: CaseRow with id

// Save inheritance computation
saveComputation(caseId: string, input: EngineInput, output: EngineOutput): Promise<void>
// UPDATE cases SET input_json=$1, output_json=$2, status='computed',
//   decedent_name=..., date_of_death=..., updated_at=NOW()
// WHERE id=$3 AND org_id=auth.current_org_id()

// Auto-save (debounced 1500ms; called on every wizard field change)
autoSaveInput(caseId: string, input: EngineInput): Promise<void>
// UPDATE cases SET input_json=$1, status='draft', updated_at=NOW() WHERE id=$2

// Load a case for editing
loadCase(caseId: string): Promise<CaseRow>
// SELECT * FROM cases WHERE id=$1 AND org_id=auth.current_org_id()

// List all cases for org
listCases(filter: {
  status?: CaseStatus;
  clientId?: string;
  page?: number;       // default 1
  pageSize?: number;   // default 25
  sort?: 'updated_at' | 'decedent_name' | 'created_at'; // default updated_at DESC
}): Promise<{ data: CaseRow[]; count: number }>
// SELECT * FROM cases WHERE org_id=auth.current_org_id() [AND status=$1] ...

// Finalize a case (status → 'finalized'; no further edits)
finalizeCase(caseId: string): Promise<void>
// UPDATE cases SET status='finalized', updated_at=NOW()
// Only admin or attorney role permitted (RLS enforces)

// Save estate tax data
saveTaxData(caseId: string, input: EstateTaxInput, output: EstateTaxOutput): Promise<void>
// UPDATE cases SET tax_input_json=$1, tax_output_json=$2,
//   gross_estate=$3, updated_at=NOW()

// Save comparison results
saveComparison(caseId: string, altInput: EngineInput, altOutput: EngineOutput): Promise<void>
// UPDATE cases SET comparison_input_json=$1, comparison_output_json=$2,
//   comparison_ran_at=NOW()

// Enable/disable share link
setShareEnabled(caseId: string, enabled: boolean): Promise<{ share_token: string }>
// UPDATE cases SET share_enabled=$1 WHERE id=$2

// Load case via share token (no auth required)
loadSharedCase(shareToken: string): Promise<Pick<CaseRow, 'output_json' | 'input_json' | 'decedent_name' | 'date_of_death' | 'title'>>
// SELECT ... FROM cases WHERE share_token=$1 AND share_enabled=TRUE

// Archive a case
archiveCase(caseId: string): Promise<void>
// UPDATE cases SET status='archived', updated_at=NOW()

// Delete a case (admin only)
deleteCase(caseId: string): Promise<void>
// DELETE FROM cases WHERE id=$1 AND org_id=auth.current_org_id()
```

#### Clients API (`src/lib/api/clients.ts`)

```typescript
createClient(data: ClientCreate): Promise<ClientRow>
// INSERT INTO clients (org_id, full_name, tin, ...) VALUES (...)

getClient(clientId: string): Promise<ClientRow>
// SELECT * FROM clients WHERE id=$1 AND org_id=auth.current_org_id()

listClients(filter: {
  status?: ClientStatus;  // default 'active'
  search?: string;        // searches full_name via pg_trgm
  page?: number;
  pageSize?: number;
}): Promise<{ data: ClientRow[]; count: number }>

updateClient(clientId: string, data: Partial<ClientCreate>): Promise<ClientRow>

archiveClient(clientId: string): Promise<void>
// UPDATE clients SET status='former', updated_at=NOW()

getClientCases(clientId: string): Promise<CaseRow[]>
// SELECT * FROM cases WHERE client_id=$1 AND org_id=auth.current_org_id()
//   ORDER BY updated_at DESC
```

#### Case Notes API (`src/lib/api/case-notes.ts`)

```typescript
addNote(caseId: string, content: string): Promise<CaseNoteRow>
// INSERT INTO case_notes (case_id, user_id, content) VALUES (...)

listNotes(caseId: string): Promise<CaseNoteRow[]>
// SELECT * FROM case_notes WHERE case_id=$1 ORDER BY created_at DESC

deleteNote(noteId: string): Promise<void>
// DELETE FROM case_notes WHERE id=$1 AND (user_id=auth.uid() OR org_role='admin')
```

#### Deadlines API (`src/lib/api/case-deadlines.ts`)

```typescript
// Seed milestones from date_of_death
seedDeadlines(caseId: string, dateOfDeath: string, track: 'ejs' | 'probate'): Promise<void>
// UPSERT INTO case_deadlines (case_id, milestone_key, label, due_date, ...)
// Computes all due_dates from offset table

listDeadlines(caseId: string): Promise<CaseDeadlineRow[]>
// SELECT * FROM case_deadlines WHERE case_id=$1 ORDER BY due_date ASC

markComplete(deadlineId: string, completedDate: string, note?: string): Promise<void>
// UPDATE case_deadlines SET completed_date=$1, note=$2, updated_at=NOW()
//   WHERE id=$3 AND case_id IN (SELECT id FROM cases WHERE org_id=auth.current_org_id())

addCustomDeadline(caseId: string, data: {
  milestone_key: string;  // auto-generated: 'custom_' + ulid()
  label: string;
  description: string;
  due_date: string;       // ISO 8601 date
  legal_basis: string;
  note?: string;
}): Promise<CaseDeadlineRow>

deleteCustomDeadline(deadlineId: string): Promise<void>
// Only for is_auto=FALSE deadlines

// Aggregate: all open deadlines across all cases in org
listAllPendingDeadlines(filter: {
  urgencyDays?: number;  // default: show all pending
}): Promise<Array<CaseDeadlineRow & { case_title: string; client_name: string | null }>>
// SELECT d.*, c.title as case_title, cl.full_name as client_name
//   FROM case_deadlines d JOIN cases c ON d.case_id=c.id
//   LEFT JOIN clients cl ON c.client_id=cl.id
//   WHERE c.org_id=auth.current_org_id() AND d.completed_date IS NULL
//   ORDER BY d.due_date ASC
```

#### Conflict Check RPC (`src/lib/api/conflict-check.ts`)

```typescript
runConflictCheck(params: {
  name: string;
  tin?: string;
}): Promise<ConflictCheckResult>
// Calls Supabase RPC: run_conflict_check(p_name TEXT, p_tin TEXT)

// SQL RPC (SECURITY DEFINER to access cases.input_json):
// CREATE OR REPLACE FUNCTION run_conflict_check(p_name TEXT, p_tin TEXT DEFAULT NULL)
// RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
// DECLARE
//   result JSONB := '[]';
//   org UUID := auth.current_org_id();
// BEGIN
//   -- Search clients by name similarity
//   SELECT json_agg(json_build_object(
//     'match_type', 'client',
//     'name', c.full_name,
//     'similarity', similarity(c.full_name, p_name),
//     'client_id', c.id,
//     'tin_match', (p_tin IS NOT NULL AND c.tin = p_tin)
//   ))
//   INTO result
//   FROM clients c
//   WHERE c.org_id = org
//     AND similarity(c.full_name, p_name) > 0.35;
//
//   -- Also search heir names in cases.input_json (jsonb → family_tree persons)
//   -- ... (further implementation details in spec-conflict-check.md)
//   RETURN COALESCE(result, '[]');
// END; $$;
```

#### Organizations API (`src/lib/api/organizations.ts`)

```typescript
getOrg(): Promise<OrgRow>
// SELECT * FROM organizations WHERE id=auth.current_org_id()

updateOrg(data: Partial<OrgUpdate>): Promise<OrgRow>

listMembers(): Promise<OrgMemberWithProfile[]>
// SELECT om.*, up.full_name, up.email FROM organization_members om
//   JOIN user_profiles up ON om.user_id=up.id
//   WHERE om.org_id=auth.current_org_id()

inviteMember(email: string, role: OrgRole): Promise<void>
// INSERT INTO organization_invitations (org_id, email, role, invited_by)
// Triggers: send Supabase Auth invite email with token URL

updateMemberRole(userId: string, role: OrgRole): Promise<void>
// UPDATE organization_members SET role=$1 WHERE org_id=... AND user_id=$2

removeMember(userId: string): Promise<void>
// DELETE FROM organization_members WHERE org_id=... AND user_id=$1

acceptInvitation(token: string): Promise<void>
// Validate token not expired, INSERT into organization_members, UPDATE status='accepted'
```

### 5.3 WASM Bridge (unchanged from existing)

```typescript
// src/wasm/bridge.ts — existing, no changes needed
compute(input: EngineInput): Promise<EngineOutput>

// Estate tax WASM (new — from estate-tax-engine-spec)
computeTax(input: EstateTaxInput): Promise<EstateTaxOutput>
```

### 5.4 PDF Generation API

```typescript
// src/lib/pdf/generate.ts
generateInheritancePdf(
  input: EngineInput,
  output: EngineOutput,
  options: {
    firmProfile?: FirmProfile;
    caseNotes?: CaseNoteRow[];
    deadlines?: CaseDeadlineRow[];
    comparisonOutput?: EngineOutput;
    includedSections: {
      narratives: boolean;      // default true
      computationLog: boolean;  // default true
      warnings: boolean;        // default true
      caseNotes: boolean;       // default false
      deadlineSummary: boolean; // default false
      comparison: boolean;      // default false
    };
  }
): Promise<Blob>
// Returns PDF blob; caller triggers browser download

generateCombinedPdf(
  input: EngineInput,
  output: EngineOutput,
  taxInput: EstateTaxInput,
  taxOutput: EstateTaxOutput,
  options: PdfOptions
): Promise<Blob>
// Combined inheritance + BIR Form 1801 summary PDF
```

### 5.5 Auto-Save Hook

```typescript
// src/hooks/useAutoSave.ts
function useAutoSave(
  caseId: string | null,
  input: EngineInput | null,
  debounceMs: number = 1500
): { status: 'idle' | 'saving' | 'saved' | 'error'; error: Error | null }
// Debounces writes to cases.input_json
// Shows toast on error; silently updates on success
// Does nothing if caseId is null (ephemeral mode)
```

---

## 6. Implementation Dependency Graph

Dependencies listed as "must be complete before starting":

```
Phase 0 — Pure Frontend (no backend; zero dependencies)
  spec-decedent-header
  spec-represents-display
  spec-donation-summary-in-results
  spec-statute-citations-ui
  spec-share-breakdown-panel
  spec-print-layout

Phase 1 — Foundation (enables all persistence features)
  spec-auth-persistence
    ← requires: Supabase project, organizations table, user_profiles,
                cases table, basic RLS

Phase 2 — Persistence-Dependent Features (parallel after Phase 1)
  spec-case-notes            ← requires: spec-auth-persistence
  spec-shareable-links       ← requires: spec-auth-persistence
  spec-deadline-tracker      ← requires: spec-auth-persistence
  spec-document-checklist    ← requires: spec-auth-persistence
  spec-case-export-zip       ← requires: spec-auth-persistence

Phase 3 — PDF Export (requires auth for firm profile; Phase 1 + 2 stable)
  spec-pdf-export            ← requires: spec-auth-persistence, @react-pdf/renderer
  spec-scenario-comparison   ← requires: spec-auth-persistence (for persisted comparison)

Phase 4 — Firm Customization (requires PDF to render)
  spec-firm-branding         ← requires: spec-pdf-export, spec-auth-persistence

Phase 5 — CRM (requires auth, then sequential)
  spec-client-profiles       ← requires: spec-auth-persistence
  spec-conflict-check        ← requires: spec-client-profiles
  spec-intake-form           ← requires: spec-client-profiles, spec-conflict-check

Phase 6 — Estate Tax (largest feature chain; requires persistence + PDF)
  spec-estate-tax-inputs-wizard  ← requires: spec-auth-persistence
  spec-bir-1801-integration      ← requires: spec-estate-tax-inputs-wizard, spec-pdf-export

Phase 7 — Visualization (can be built after Phase 0 data is stable)
  spec-family-tree-visualizer    ← requires: spec-auth-persistence (for case context)
  spec-timeline-report           ← requires: spec-deadline-tracker

Phase 8 — Multi-Seat (schema migration; build last)
  spec-multi-seat
    ← requires: ALL Phase 1–7 complete (adds org_id, updates all RLS)
```

**Dependency matrix (X = row requires column):**

|                         | auth | clients | pdf | firm | notes | deadlines | docs | tax-wizard | multi-seat |
|-------------------------|------|---------|-----|------|-------|-----------|------|------------|------------|
| spec-case-notes         |  X   |         |     |      |       |           |      |            |            |
| spec-shareable-links    |  X   |         |     |      |       |           |      |            |            |
| spec-deadline-tracker   |  X   |         |     |      |       |           |      |            |            |
| spec-document-checklist |  X   |         |     |      |       |           |      |            |            |
| spec-case-export-zip    |  X   |         |  X  |      |       |           |      |            |            |
| spec-pdf-export         |  X   |         |     |      |       |           |      |            |            |
| spec-firm-branding      |  X   |         |  X  |      |       |           |      |            |            |
| spec-scenario-comparison|  X   |         |     |      |       |           |      |            |            |
| spec-client-profiles    |  X   |         |     |      |       |           |      |            |            |
| spec-conflict-check     |  X   |    X    |     |      |       |           |      |            |            |
| spec-intake-form        |  X   |    X    |     |      |       |           |      |            |            |
| spec-estate-tax-wizard  |  X   |         |     |      |       |           |      |            |            |
| spec-bir-1801           |  X   |         |  X  |      |       |           |      |     X      |            |
| spec-family-tree-viz    |  X   |         |     |      |       |           |      |            |            |
| spec-timeline-report    |  X   |         |     |      |       |    X      |      |            |            |
| spec-multi-seat         |  X   |    X    |  X  |  X   |  X    |    X      |  X   |     X      |            |

---

## 7. Tech Stack Decisions (Final)

| Layer | Technology | Version | Decision Rationale |
|-------|-----------|---------|-------------------|
| Frontend framework | React | 19.2.4 | Already in use; concurrent features for WASM |
| Language | TypeScript | 5.x | Already in use; strict mode |
| Build tool | Vite | 6.x | Already in use; WASM plugin configured |
| UI components | shadcn/ui | Latest | Already in use; Radix primitives |
| Styling | Tailwind CSS | v4.2.1 | Already in use; CSS-first config |
| Forms | react-hook-form + Zod | Already in use | No change |
| Charts | Recharts | Already in use | Distribution pie; Gantt timeline |
| Routing | React Router v6 | New addition | Client-side routing for /app/* routes |
| PDF generation | @react-pdf/renderer | v4.3.2 | JSX-based; handles tables; ESM compatible |
| Family tree | D3.js | v7.x | SVG manipulation; force-directed layout |
| Markdown in notes | remark + remark-gfm | Latest | Render case note markdown |
| Backend | Supabase | Latest | Auth + PostgreSQL + RLS + Storage |
| Authentication | Supabase Auth | — | Email/password (primary); Magic Link (fallback) |
| Database | PostgreSQL 15 via Supabase | — | JSONB for computation snapshots |
| Storage | Supabase Storage | — | Firm logos; max 2MB |
| Computation | Rust WASM | Existing | Inheritance engine; estate tax engine |
| ZIP export | JSZip | v3.x | Client-side ZIP assembly for case export |
| QR codes | qrcode.react | v3.x | QR for share links; no server needed |

**No additional packages needed for:**
- Print layout (Tailwind `print:` variant + CSS `@media print`)
- Scenario comparison (second WASM call client-side)
- Statute citations UI (static lookup map in TypeScript)
- Decedent header / represents label / share breakdown panel (all use existing EngineOutput types)

---

## 8. Migration Strategy: Ephemeral → Persisted

### Phase A — Zero-Config Anonymous Mode (Preserved)

The existing app at `/` continues to work identically:
- No auth required
- WASM computation runs client-side
- Results displayed, exportable as JSON
- No Supabase calls

**How:** App.tsx checks `isAuthenticated` from AuthProvider. If false, renders `EphemeralApp` (existing component tree). If true, renders `AuthenticatedApp` (new route structure).

### Phase B — Auth Overlay (Non-Breaking)

A "Save Case" button appears in ActionsBar for both ephemeral and authenticated users:
- **Anonymous user clicks Save:** Auth modal opens; user signs in or signs up
- **On successful auth:** Auto-creates personal organization (slug = user UUID prefix)
- **Case data migrated:** `input_json` and `output_json` in localStorage transferred to new `cases` row
- **Redirect:** User lands at `/app/cases/:newId` with case loaded

No existing functionality is removed. Anonymous users who never click Save have zero UX change.

### Phase C — Data Backfill for Existing Supabase Users (if applicable)

If any early users exist with `user_id`-scoped data before `org_id` was introduced:
```sql
-- One-time migration: create personal org for each existing user
INSERT INTO organizations (name, slug, plan, seat_limit)
SELECT
  COALESCE(up.firm_name, up.full_name, 'My Firm') AS name,
  LEFT(REPLACE(up.id::text, '-', ''), 40) AS slug,
  'solo',
  1
FROM user_profiles up
ON CONFLICT (slug) DO NOTHING;

-- Link existing users to their personal org
INSERT INTO organization_members (org_id, user_id, role)
SELECT o.id, up.id, 'admin'
FROM user_profiles up
JOIN organizations o ON o.slug = LEFT(REPLACE(up.id::text, '-', ''), 40);

-- Update existing cases with org_id
UPDATE cases c
SET org_id = om.org_id
FROM organization_members om
WHERE c.user_id = om.user_id
  AND c.org_id IS NULL;
```

### Phase D — Multi-Seat Addition (Additive, No Breaking Changes)

When `spec-multi-seat` is implemented:
1. `org_id` is already on all tables (added in Phase B)
2. Admin creates a firm org (new org with seat_limit > 1)
3. Admin invites team members via email
4. All existing cases transfer to new firm org (admin chooses to migrate or keep personal)
5. RLS policies updated to use `auth.current_org_id()` helper (already using it from Phase B)

The personal org created in Phase B becomes obsolete for users who upgrade to a firm org. The old personal org is soft-deleted (plan='archived') but data is never deleted.

---

## 9. Cross-Feature Data Flow Diagram

```
User Input (InheritanceWizard)
        │
        ▼ EngineInput
  ┌─────────────────┐
  │  WASM Engine    │ ← compute(input): EngineOutput
  └─────────────────┘
        │
        ▼ EngineOutput
  ┌──────────────────────────────────────────────────┐
  │  ResultsView                                      │
  │  ├── ResultsHeader (decedent_name, date_of_death)│
  │  ├── DistributionTable                           │
  │  │   ├── legal_basis[] → ArticleTooltip          │
  │  │   ├── represents → RepresentsLabel            │
  │  │   ├── from_legitime/from_free → Breakdown     │
  │  ├── DonationsSummaryPanel (input.donations[])  │
  │  ├── ComparisonPanel (alt_output if computed)   │
  │  ├── NarrativePanel                             │
  │  ├── ComputationLog                             │
  │  └── ActionsBar                                 │
  └──────────────────────────────────────────────────┘
        │ (if authenticated)
        ▼ autoSave (1500ms debounce)
  ┌──────────────────────────────────────────────────┐
  │  Supabase: cases row                             │
  │  ├── input_json (EngineInput)                   │
  │  ├── output_json (EngineOutput)                 │
  │  ├── tax_input_json (EstateTaxInput)            │
  │  ├── tax_output_json (EstateTaxOutput)          │
  │  ├── comparison_input_json / comparison_output  │
  │  └── share_token (for shareable link)           │
  └──────────────────────────────────────────────────┘
        │
        ├── → case_notes (append-only text)
        ├── → case_deadlines (milestone rows seeded from date_of_death)
        ├── → case_documents (document checklist seeded from input_json)
        ├── → conflict_check_log (read at intake; written at check)
        └── → PDF generation (all above merged into @react-pdf/renderer document)

EstateTaxWizard (tab in CaseEditorPage)
        │
        ▼ EstateTaxInput
  ┌─────────────────────────┐
  │  Estate Tax WASM        │ ← computeTax(input): EstateTaxOutput
  └─────────────────────────┘
        │
        ▼ net_distributable_estate = max(0, Item40 - Item44)
        │
        └──→ Inheritance Engine re-run with updated net_distributable_estate
                  │
                  ▼ Final EngineOutput (tax-adjusted)
                  └──→ cases.output_json updated
```

---

## 10. Security Considerations

| Concern | Mitigation |
|---------|-----------|
| Case data isolation | RLS on all tables: `org_id = auth.current_org_id()` |
| Share link privacy | Cases readable via token only when `share_enabled = TRUE` |
| Paralegal cannot finalize | RLS policy on UPDATE checks `auth.has_role('admin', 'attorney')` for `status='finalized'` |
| Admin cannot impersonate | No `service_role` key in client code; all access via JWT |
| TIN in plaintext | TIN is non-sensitive under PH law (public tax identifier); no encryption needed |
| Conflict check log retention | 7-year append-only retention per Philippine bar ethics rules |
| Logo upload size cap | 2MB limit in Supabase Storage bucket policy |
| PDF generated client-side | No server receives computation data; PDF assembly is local |
| Auto-save race condition | Last-write-wins with `updated_at` optimistic check; debounce prevents concurrent writes |
| Invitation token expiry | 7-day TTL; expired tokens rejected by `acceptInvitation` function |

---

## 11. Supabase Storage Structure

```
firm-logos/
  {user_id}/
    logo.{png|jpg|svg|webp}   ← uploaded via storage SDK; replaced in-place

case-exports/                  ← temporary; cleaned up after download
  {case_id}/
    {case_id}-{timestamp}.zip ← assembled client-side via JSZip; no server upload needed
```

Note: Case export ZIPs are assembled entirely in the browser (JSZip). No server-side storage is needed for exports; the ZIP is streamed directly to browser download. The `case-exports/` bucket is referenced for documentation purposes only — the actual implementation uses `URL.createObjectURL()` on the client.

---

## 12. Performance Targets

| Operation | Target | Strategy |
|-----------|--------|----------|
| WASM inheritance computation | < 100ms | Existing; already meets target |
| WASM estate tax computation | < 150ms | Same Rust pipeline pattern |
| PDF generation (15 heirs) | < 800ms | @react-pdf/renderer client-side; no network |
| Case load from Supabase | < 300ms | Single SELECT; JSONB columns indexed |
| Dashboard case list (25 rows) | < 400ms | Index on (org_id, updated_at DESC) |
| Conflict check (trigram) | < 200ms | pg_trgm GIN index on clients.full_name |
| Auto-save write | < 100ms | UPDATE single row by PK; debounced |
| Family tree SVG render (20 nodes) | < 300ms | D3 v7 force layout; incremental |
