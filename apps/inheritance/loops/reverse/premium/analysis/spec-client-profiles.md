# Feature Spec: Client Profiles (CRM)

**Aspect:** spec-client-profiles
**Wave:** 2 — Per-Feature Specifications
**Date:** 2026-03-01
**Reads:** crm-law-firm-patterns, auth-persistence-patterns
**Depends on:** spec-auth-persistence (cases.client_id FK already defined there)

---

## 1. Overview

Client Profiles give a Philippine estate lawyer a lightweight CRM layer on top of their
case management: a canonical record for each client that links across all their cases.

**Why a PH estate lawyer needs this:**
- A single client often has multiple matters: intestate estate of a parent, estate planning
  for themselves, donation to children. Without a client record, these are disconnected cases.
- Philippine-specific fields (TIN, PhilSys ID, civil status) are needed on government
  filings. Capture them once on the client; every case inherits them.
- Lawyers need a quick client overview: "Show me all of Maria Reyes's active matters."
- Conflict-of-interest screening (spec-conflict-check) requires a searchable client pool.
- BIR Form 1801 requires the decedent's TIN; the administering heir's TIN is often the
  same client. Single capture → multiple uses.

**Scope of this spec:**
- Client CRUD (create, read, update, soft-delete)
- Client list page with search / filter / sort
- Client detail page showing all linked cases
- "New case for this client" flow
- Linking a client to an existing case (from case editor)
- PH-specific field validation (TIN format)
- RLS: clients are scoped to the owning user (single-user tier); firm-scoped clients
  addressed in spec-multi-seat.

---

## 2. Data Model

### 2.1 clients Table (full DDL)

Extends the minimal `clients` table from `auth-persistence-patterns` with the full
field set from `crm-law-firm-patterns`. The `cases.client_id` FK already exists.

```sql
-- Drop the minimal version defined in auth-persistence-patterns and replace with this.
-- (Migration: ALTER TABLE clients ADD COLUMN ... for each new column.)

CREATE TABLE clients (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Identity
  full_name         TEXT        NOT NULL,
  nickname          TEXT,                              -- display shorthand
  date_of_birth     DATE,
  place_of_birth    TEXT,
  nationality       TEXT        NOT NULL DEFAULT 'Filipino',
  civil_status      TEXT        CHECK (civil_status IN (
                      'single', 'married', 'widowed',
                      'legally_separated', 'annulled'
                    )),

  -- Contact
  email             TEXT,
  phone_mobile      TEXT,
  phone_landline    TEXT,
  address_street    TEXT,
  address_city      TEXT,
  address_province  TEXT,
  address_zip       TEXT,
  preferred_contact TEXT        CHECK (preferred_contact IN ('email','phone','sms'))
                                DEFAULT 'email',

  -- Philippine identifiers
  tin               TEXT,           -- format: XXX-XXX-XXX (individual)
  gov_id_type       TEXT,           -- see PHGovernmentIdType enum below
  gov_id_number     TEXT,

  -- Case context
  status            TEXT        NOT NULL DEFAULT 'active'
                                CHECK (status IN ('prospect','active','inactive','former')),
  intake_date       DATE        NOT NULL DEFAULT CURRENT_DATE,
  referral_source   TEXT,
  conflict_cleared  BOOLEAN     NOT NULL DEFAULT FALSE,
  conflict_notes    TEXT,

  -- General notes (not case-specific; case-specific notes live in case_notes)
  notes             TEXT,

  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_clients_user_id       ON clients(user_id);
CREATE INDEX idx_clients_full_name     ON clients(user_id, full_name);
CREATE INDEX idx_clients_status        ON clients(user_id, status);
CREATE INDEX idx_clients_created_at    ON clients(user_id, created_at DESC);
-- Full-text search index for name search
CREATE INDEX idx_clients_name_fts      ON clients USING gin(to_tsvector('simple', full_name));

-- RLS: user sees only their own clients
CREATE POLICY "clients_all_own" ON clients
  FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK(auth.uid() = user_id);
```

### 2.2 TIN Constraint (server-side)

```sql
-- TIN format: XXX-XXX-XXX (individual) or XXX-XXX-XXX-XXX (corporate branch)
ALTER TABLE clients
  ADD CONSTRAINT clients_tin_format
  CHECK (tin IS NULL OR tin ~ '^\d{3}-\d{3}-\d{3}(-\d{3})?$');
```

### 2.3 Relationship to cases

The `cases` table (defined in spec-auth-persistence) already has:
```sql
client_id UUID REFERENCES clients(id) ON DELETE SET NULL
```

**Semantics:**
- One client → many cases (one-to-many)
- A case may have `client_id = NULL` (anonymous or unlinked)
- Deleting a client sets `cases.client_id = NULL` (no orphan cases)
- A case cannot reference a client belonging to a different user (enforced by RLS on both tables)

### 2.4 Government ID Type Enum (TypeScript)

```typescript
// Keep as a const record rather than a DB enum — easier to extend without migrations
export const PH_GOV_ID_TYPES = {
  PHILSYS:    'Philippine National ID (PhilSys)',
  PASSPORT:   'Philippine Passport',
  DRIVERS:    "Driver's License (LTO)",
  PRC_ID:     'PRC Professional ID',
  IBP_ID:     'IBP Identification Card',
  VOTER_ID:   "COMELEC Voter's ID",
  SSS_ID:     'SSS ID',
  GSIS_ID:    'GSIS ID',
  POSTAL_ID:  'Postal ID',
  SENIOR_ID:  'Senior Citizen ID',
  COMPANY_ID: 'Company ID (notarized)',
} as const

export type PHGovernmentIdType = keyof typeof PH_GOV_ID_TYPES
```

### 2.5 TIN Validation (TypeScript)

```typescript
// Matches XXX-XXX-XXX or XXX-XXX-XXX-XXX
export const TIN_REGEX = /^\d{3}-\d{3}-\d{3}(-\d{3})?$/

export function validateTIN(tin: string): boolean {
  return TIN_REGEX.test(tin.trim())
}

export function formatTIN(raw: string): string {
  // Auto-format as user types: strip non-digits, insert hyphens
  const digits = raw.replace(/\D/g, '').slice(0, 12)
  return digits
    .replace(/^(\d{3})(\d)/, '$1-$2')
    .replace(/^(\d{3}-\d{3})(\d)/, '$1-$2')
    .replace(/^(\d{3}-\d{3}-\d{3})(\d)/, '$1-$2')
}
```

### 2.6 Zod Schema

```typescript
import { z } from 'zod'

export const ClientSchema = z.object({
  full_name:         z.string().min(2, 'Name is required'),
  nickname:          z.string().optional(),
  date_of_birth:     z.string().optional(),   // ISO date string
  place_of_birth:    z.string().optional(),
  nationality:       z.string().default('Filipino'),
  civil_status:      z.enum(['single','married','widowed','legally_separated','annulled']).optional(),

  email:             z.string().email().optional().or(z.literal('')),
  phone_mobile:      z.string().optional(),
  phone_landline:    z.string().optional(),
  address_street:    z.string().optional(),
  address_city:      z.string().optional(),
  address_province:  z.string().optional(),
  address_zip:       z.string().optional(),
  preferred_contact: z.enum(['email','phone','sms']).default('email'),

  tin:               z.string().refine(
                       v => !v || validateTIN(v),
                       { message: 'TIN must be in XXX-XXX-XXX format' }
                     ).optional(),
  gov_id_type:       z.string().optional(),
  gov_id_number:     z.string().optional(),

  status:            z.enum(['prospect','active','inactive','former']).default('active'),
  intake_date:       z.string().optional(),
  referral_source:   z.string().optional(),
  conflict_cleared:  z.boolean().default(false),
  conflict_notes:    z.string().optional(),
  notes:             z.string().optional(),
})

export type ClientFormData = z.infer<typeof ClientSchema>
```

---

## 3. UI Design

### 3.1 Routes

| Path | Component | Guard |
|------|-----------|-------|
| `/clients` | `ClientsPage` | `RequireAuth` |
| `/clients/new` | `NewClientPage` | `RequireAuth` |
| `/clients/:id` | `ClientDetailPage` | `RequireAuth` |
| `/clients/:id/edit` | `EditClientPage` | `RequireAuth` |

### 3.2 Client List Page (`/clients`)

```
┌───────────────────────────────────────────────────────────────────────┐
│ ← Dashboard          Clients                        [+ New Client]    │
├───────────────────────────────────────────────────────────────────────┤
│  [🔍 Search clients by name…]    Status [Active ▼]   Sort [Name ▼]   │
├───────────────────────────────────────────────────────────────────────┤
│  NAME                   CASES    LAST ACTIVITY    STATUS              │
├───────────────────────────────────────────────────────────────────────┤
│  Reyes, Maria Santos      3      Feb 25, 2026     ● Active            │
│  Santos, Juan dela Cruz   1      Feb 20, 2026     ● Active            │
│  Cruz, Ana Marie          2      Jan 15, 2026     ● Active            │
│  Bautista, Jose           1      Dec 10, 2025     ○ Inactive          │
│  Villanueva, Pedro        0      —                ◌ Prospect          │
├───────────────────────────────────────────────────────────────────────┤
│                                              Page 1 of 3   [<] [>]   │
└───────────────────────────────────────────────────────────────────────┘
```

**Empty state (no clients yet):**
```
┌───────────────────────────────────────────────────────────┐
│                                                           │
│       👤  No clients yet                                  │
│                                                           │
│   Add clients to link them to cases, track their          │
│   Philippine IDs, and manage your practice.               │
│                                                           │
│                   [+ Add First Client]                    │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

**Filter options:**
- Status dropdown: All / Prospect / Active / Inactive / Former
- Sort dropdown: Name (A–Z) / Name (Z–A) / Last Activity / Intake Date

**Behavior:**
- Search uses debounced full-text search (300ms) — queries `full_name` with ILIKE `%query%`
- "CASES" column shows count from JOIN (not denormalized); "—" if count = 0
- "LAST ACTIVITY" = max `updated_at` of linked cases (or `—` if no cases)
- Clicking a row navigates to `/clients/:id`
- Pagination: 25 rows per page, server-side

### 3.3 Client Detail Page (`/clients/:id`)

```
┌───────────────────────────────────────────────────────────────────────┐
│ ← Clients     Maria Santos Reyes                [Edit]  [+ New Case] │
├──────────────────────────────────┬────────────────────────────────────┤
│ CONTACT INFO                     │ IDENTIFIERS                        │
│ maria.reyes@email.com            │ TIN: 123-456-789                   │
│ Mobile: +63 917 123 4567         │ PhilSys: 1234-5678-9012-3456       │
│ Makati City, Metro Manila        │ Civil status: Widowed              │
│ Preferred: Email                 │ Date of birth: Jan 15, 1960        │
│                                  │ Place of birth: Cebu City          │
│ Intake: Feb 1, 2026              │ Nationality: Filipino              │
│ Referred by: Atty. Cruz          │ Conflict cleared: ✓                │
├──────────────────────────────────┴────────────────────────────────────┤
│ CASES (3)                                                             │
│ ┌──────────────────────────────────────────────────────────────────┐  │
│ │ Estate of Pedro Reyes           ● Active      Feb 25, 2026      │  │
│ │ Donation to Children (Planning) ○ Draft       Jan 10, 2026      │  │
│ │ Estate Planning (Self)          ✓ Finalized   Nov 5, 2025       │  │
│ └──────────────────────────────────────────────────────────────────┘  │
├───────────────────────────────────────────────────────────────────────┤
│ NOTES                                                                 │
│ Prefers morning appointments. Has 3 children (Juan, Ana, Jose).      │
│ Landline unreachable. Best to contact via email.                     │
│                                                                       │
│ [Edit notes]                                                          │
└───────────────────────────────────────────────────────────────────────┘
```

**Case row statuses:** color-coded badges using shadcn/ui `Badge` variants:
- `draft` → gray badge
- `computed` → blue badge
- `finalized` → green badge
- `archived` → muted badge

**Notes section:** editable textarea with auto-save (1500ms debounce, same pattern as case notes). This is the general client-level notes field, distinct from per-case `case_notes` rows.

### 3.4 New / Edit Client Form

Rendered as a page (`/clients/new`, `/clients/:id/edit`) rather than a modal — the form
is long enough that a modal would scroll awkwardly on mobile.

```
┌───────────────────────────────────────────────────────────────────────┐
│ ← Clients          New Client                                         │
├───────────────────────────────────────────────────────────────────────┤
│ IDENTITY                                                              │
│ Full legal name *   [___________________________________]             │
│ Nickname / alias    [___________________________________]             │
│ Date of birth       [___________]  Place of birth  [_______________] │
│ Civil status        [Select ▼]                                        │
│ Nationality         [Filipino________________________]                │
├───────────────────────────────────────────────────────────────────────┤
│ CONTACT                                                               │
│ Email               [___________________________________]             │
│ Mobile phone        [___________________________________]             │
│ Landline            [___________________________________]             │
│ Preferred contact   [Email ▼]                                         │
│ Address             [___________________________________]             │
│ City                [________________]  Province  [________________]  │
│ ZIP                 [______]                                          │
├───────────────────────────────────────────────────────────────────────┤
│ PHILIPPINE IDENTIFIERS                                                │
│ TIN *               [___-___-___]  (format: XXX-XXX-XXX)             │
│ Government ID type  [Select ▼]                                        │
│ ID number           [___________________________________]             │
├───────────────────────────────────────────────────────────────────────┤
│ INTAKE                                                                │
│ Status              [Active ▼]                                        │
│ Intake date         [___________]                                     │
│ Referred by         [___________________________________]             │
│ Conflict cleared    [ ] Yes — mark after screening                    │
│ Conflict notes      [___________________________________]             │
├───────────────────────────────────────────────────────────────────────┤
│ NOTES                                                                 │
│ [_________________________________________________________________]  │
│ [_________________________________________________________________]  │
│ [_________________________________________________________________]  │
├───────────────────────────────────────────────────────────────────────┤
│                              [Cancel]  [Save Client]                  │
└───────────────────────────────────────────────────────────────────────┘
```

**Field notes:**
- `Full legal name` — required; used in PDF headers and legal documents; prompt: "as it appears on government ID"
- `TIN` — masked input with auto-hyphen formatter (`formatTIN()`)
- `Civil status` — determines property regime implications shown as a tooltip hint
- `Conflict cleared` — checkbox with note field; pre-populated from conflict check result (spec-conflict-check)

### 3.5 Client Picker Component (in Case Editor)

A combobox that appears in the case editor to associate an existing client:

```
┌────────────────────────────────────────────────────────────┐
│ Client                                                     │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 🔍 Search clients…                                   │   │
│ │ ─────────────────────────────────────────────────── │   │
│ │ Maria Santos Reyes                                   │   │
│ │ Juan dela Cruz Santos                                │   │
│ │ Ana Marie Cruz                                       │   │
│ │ ─────────────────────────────────────────────────── │   │
│ │ + Create new client                                  │   │
│ └──────────────────────────────────────────────────────┘   │
│ Or leave unlinked                                          │
└────────────────────────────────────────────────────────────┘
```

- Appears in case editor toolbar / sidebar (not the wizard)
- Search debounced 300ms
- "Create new client" opens `/clients/new?returnTo=/cases/:id` — after creation, redirects back and auto-links
- "Or leave unlinked" keeps `client_id = NULL`

---

## 4. API / Data Layer

### 4.1 Supabase Client Functions

```typescript
// lib/api/clients.ts
import { supabase } from '@/lib/supabase'
import type { ClientFormData } from '@/types'

// ─── Create ────────────────────────────────────────────────────────────────

export async function createClient(data: ClientFormData) {
  const { data: client, error } = await supabase
    .from('clients')
    .insert({ ...data, user_id: (await supabase.auth.getUser()).data.user?.id })
    .select('id, full_name, status')
    .single()
  return { client, error }
}

// ─── Read ──────────────────────────────────────────────────────────────────

export async function listClients(params: {
  search?: string
  status?: string
  sort?: 'name_asc' | 'name_desc' | 'last_activity' | 'intake_date'
  page?: number
  pageSize?: number
}) {
  const { search, status, sort = 'name_asc', page = 1, pageSize = 25 } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('clients')
    .select(`
      id, full_name, status, intake_date, created_at,
      cases(id, status, updated_at)
    `, { count: 'exact' })

  if (search) {
    query = query.ilike('full_name', `%${search}%`)
  }
  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  // Sort
  const sortMap = {
    name_asc:      ['full_name', { ascending: true }],
    name_desc:     ['full_name', { ascending: false }],
    last_activity: ['updated_at', { ascending: false }],
    intake_date:   ['intake_date', { ascending: false }],
  } as const
  const [col, opts] = sortMap[sort]
  query = query.order(col, opts)

  query = query.range(from, to)
  return query
}

export async function getClient(clientId: string) {
  return supabase
    .from('clients')
    .select(`
      *,
      cases(id, title, decedent_name, status, updated_at, date_of_death)
    `)
    .eq('id', clientId)
    .single()
}

// ─── Update ────────────────────────────────────────────────────────────────

export async function updateClient(clientId: string, data: Partial<ClientFormData>) {
  return supabase
    .from('clients')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', clientId)
    .select('id')
    .single()
}

// ─── Soft Delete ───────────────────────────────────────────────────────────

export async function archiveClient(clientId: string) {
  // Soft delete: set status = 'former', do NOT delete row
  // Cases retain their records; client_id FK remains intact
  return supabase
    .from('clients')
    .update({ status: 'former', updated_at: new Date().toISOString() })
    .eq('id', clientId)
}

// Hard delete is available but only accessible from a confirmation dialog
// that warns: "This will unlink [N] cases from this client."
export async function deleteClient(clientId: string) {
  return supabase
    .from('clients')
    .delete()
    .eq('id', clientId)
  // ON DELETE SET NULL on cases.client_id handles unlinking automatically
}

// ─── Link to Case ──────────────────────────────────────────────────────────

export async function linkClientToCase(caseId: string, clientId: string | null) {
  return supabase
    .from('cases')
    .update({ client_id: clientId, updated_at: new Date().toISOString() })
    .eq('id', caseId)
}

// ─── Search (for ClientPicker combobox) ────────────────────────────────────

export async function searchClients(query: string, limit = 10) {
  return supabase
    .from('clients')
    .select('id, full_name, status, tin')
    .ilike('full_name', `%${query}%`)
    .in('status', ['active', 'prospect'])  // exclude inactive/former from picker
    .order('full_name')
    .limit(limit)
}
```

### 4.2 Case Count Computation (No Denormalization)

Case count displayed in the client list comes from the nested `cases` join in `listClients()`.
Client-side: `client.cases.length`.

**Do not add a `case_count` column to `clients`** — it would go stale. The join is cheap for
25 clients per page.

### 4.3 "Last Activity" Computation

From the join result: `Math.max(...client.cases.map(c => new Date(c.updated_at).getTime()))`.
If no cases, display "—".

---

## 5. Integration Points

| Feature | Integration |
|---------|------------|
| **spec-auth-persistence** | `cases.client_id FK → clients.id`; both tables share the `user_id` RLS pattern |
| **spec-pdf-export** | PDF report optionally includes "Prepared for: [client.full_name]" in the header block; client TIN may appear in BIR schedules |
| **spec-firm-branding** | Settings page and client list share the same authenticated route layout |
| **spec-conflict-check** | Conflict check queries the `clients` table + `case_heirs` (if implemented); result pre-populates `conflict_cleared` on the client form |
| **spec-intake-form** | Intake form creates or updates a `clients` row; creates a linked `cases` row on submission |
| **spec-bir-1801-integration** | Client TIN (`clients.tin`) auto-populates into the estate tax input form; decedent's TIN is stored separately on the case itself |
| **spec-multi-seat** | In firm mode, `user_id` column is replaced by `firm_id`; shared client pool means all firm members see all clients (RLS updates in spec-multi-seat) |
| **spec-case-notes** | Case-level notes live in `case_notes` table; client-level notes live in `clients.notes` (one-liner general field) |

---

## 6. Component Hierarchy

```
pages/
  ClientsPage
    ClientListHeader           ← title + "New Client" button
    ClientSearchBar            ← search input + status filter + sort dropdown
    ClientTable                ← shadcn/ui Table
      ClientTableRow[]         ← name, case count, last activity, status badge
      ClientTableEmpty         ← shown when no results
    Pagination                 ← shadcn/ui Pagination

  ClientDetailPage
    ClientDetailHeader         ← name, back button, Edit + New Case buttons
    ClientContactCard          ← contact info grid
    ClientIdentifiersCard      ← TIN, gov ID, civil status, DOB, nationality
    ClientIntakeCard           ← intake date, referral, conflict status
    ClientCasesSection         ← list of linked cases (CaseRow[] component)
    ClientNotesEditor          ← textarea with auto-save

  NewClientPage / EditClientPage
    ClientForm                 ← react-hook-form + zod
      IdentitySection
      ContactSection
      IdentifiersSection       ← TIN with formatTIN() mask
      IntakeSection
      NotesSection
    FormActions                ← Cancel + Save Client buttons

components/
  ClientPicker                 ← searchable combobox for case editor
  ClientStatusBadge            ← colored badge for status
  TINInput                     ← masked input with auto-formatter
```

---

## 7. Edge Cases

### Deletion with Linked Cases

When user clicks "Delete" on a client with cases:

```
┌────────────────────────────────────────────────────────┐
│ Delete Maria Santos Reyes?                             │
│                                                        │
│ This client has 3 cases. Deleting will unlink them     │
│ but the cases themselves will not be deleted.          │
│                                                        │
│ Consider archiving instead to keep the record.         │
│                                                        │
│  [Archive Client]  [Delete Anyway]  [Cancel]           │
└────────────────────────────────────────────────────────┘
```

- **Archive Client** → sets `status = 'former'` (recommended)
- **Delete Anyway** → hard DELETE; `cases.client_id` → NULL via ON DELETE SET NULL
- **Cancel** → dismiss

### TIN Validation

- Real-time format validation on blur
- Error message: "TIN must be in XXX-XXX-XXX format (e.g., 123-456-789)"
- Auto-hyphen: as user types `123456789` → displays `123-456-789`
- Accept blank TIN (not all clients have one at intake; lawyers add it later)

### Duplicate Client Warning

Before saving a new client, check for exact `full_name` match (case-insensitive):

```typescript
// Warn only — do not block creation (different people can have same name)
const duplicates = await supabase
  .from('clients')
  .select('id, full_name, date_of_birth')
  .ilike('full_name', data.full_name)
  .limit(3)

if (duplicates.data?.length) {
  // Show warning toast: "A client named [name] already exists. Are you sure?"
  // With option to view existing or proceed
}
```

### Empty Client List (First-Time User)

Show onboarding CTA explaining clients:
- "Add your first client to link cases, track IDs, and manage your practice."
- Button: "+ Add First Client" → `/clients/new`

### Client With No Cases

Detail page `CASES` section:
```
┌──────────────────────────────────────────────────────────┐
│ CASES (0)                                                │
│                                                          │
│  No cases yet. Start a new case for this client.         │
│                                    [+ New Case]          │
└──────────────────────────────────────────────────────────┘
```

### Anonymous User Accessing `/clients`

`RequireAuth` HOC redirects to `/` with a `?next=/clients` query param. After login,
user is redirected to `/clients`. Anonymous users never see the client list — no client
data is created or accessed without auth.

### Pagination Edge Case

If `count` from Supabase returns 0 after a search → show "No clients match your search."
with a "Clear search" link. Do not show the empty-state onboarding CTA in this case.

### "New Case for Client" Navigation

From client detail page, "+ New Case" button:
1. Creates a new case row: `INSERT INTO cases (user_id, client_id, title, status) VALUES (..., clientId, 'Draft', 'draft')`
2. Redirects to `/cases/:newCaseId` — the case editor pre-loads with this client linked
3. Case editor shows: "Client: Maria Santos Reyes  [Change]"

---

## 8. Dependencies

| Dependency | Reason |
|-----------|--------|
| **spec-auth-persistence** | `cases.client_id` FK already defined; `user_id` auth pattern; Supabase client setup; `RequireAuth` HOC |
| **Supabase** | Database + auth + RLS |
| **react-hook-form + zod** | Already in `package.json`; used for `ClientForm` |
| **shadcn/ui** | `Table`, `Badge`, `Input`, `Select`, `Combobox`, `Pagination`, `Dialog` components |

**No new npm packages required.** All dependencies already exist in the frontend stack.

---

## 9. Acceptance Criteria

### Core CRUD
- [ ] Can create a client with required fields only (full_name); all other fields optional
- [ ] Can create a client with all fields; TIN validated to XXX-XXX-XXX format
- [ ] Invalid TIN (e.g., "12345") shows inline error; form does not submit
- [ ] Can view client list; default sort: Name A–Z; 25 per page
- [ ] Can search clients by name; search debounced 300ms; ILIKE matching
- [ ] Can filter clients by status (active / prospect / inactive / former / all)
- [ ] Can sort clients by: Name A–Z, Name Z–A, Last Activity, Intake Date
- [ ] Client detail page loads all fields and linked cases
- [ ] Can edit any client field; changes saved on "Save Client"
- [ ] Client-level notes auto-save with 1500ms debounce

### Case Linking
- [ ] "New Case for [Client]" creates a draft case with `client_id` set and redirects to case editor
- [ ] Case editor shows a `ClientPicker` combobox to link/unlink a client
- [ ] Searching the picker returns only active + prospect clients
- [ ] "Create new client" from picker navigates to `/clients/new?returnTo=/cases/:id`; after creation, redirects back and links the new client
- [ ] Unlinking a client (selecting "none") sets `cases.client_id = NULL`

### Deletion
- [ ] Archive client sets `status = 'former'`; client still appears in "Former" filter
- [ ] Hard delete shows confirmation dialog warning about linked cases
- [ ] After hard delete, linked cases have `client_id = NULL` (not deleted)
- [ ] Soft-deleted (former) clients do not appear in `ClientPicker` combobox

### Security
- [ ] Client data is user-scoped: user A cannot read, write, or delete user B's clients
- [ ] Anonymous users see no client data; `/clients` redirects to login
- [ ] RLS policy verified: direct Supabase query with a different `user_id` returns empty

### Philippine-Specific
- [ ] TIN input auto-formats to XXX-XXX-XXX as user types
- [ ] TIN field accepts blank (optional)
- [ ] Government ID type dropdown lists all 11 PH ID types
- [ ] Civil status dropdown includes all 5 PH statuses
- [ ] `place_of_birth` and `nationality` fields present on form

### UX
- [ ] Empty state (no clients) shows onboarding CTA
- [ ] "No results" state (search returned 0) shows "Clear search" link; not the onboarding CTA
- [ ] Duplicate name warning shown as toast before save (non-blocking)
- [ ] Client detail page shows "—" for last activity if client has no cases
- [ ] All currency and phone number fields accept PH formats (+63, ₱)

---

## Sources

- `analysis/crm-law-firm-patterns.md` — client data model, CRM feature matrix, PH-specific fields, intake workflow, UI patterns
- `analysis/auth-persistence-patterns.md` — cases table schema with `client_id` FK, RLS policy patterns, auto-save hook, migration strategy
- `docs/plans/inheritance-engine-spec.md` — InheritanceShare types (TIN usage in BIR filings)
