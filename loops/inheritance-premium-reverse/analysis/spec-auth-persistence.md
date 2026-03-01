# Spec: Authentication & Case Persistence

**Aspect:** spec-auth-persistence
**Wave:** 2 — Per-Feature Specification
**Date:** 2026-03-01
**Reads:** auth-persistence-patterns, codebase-audit

---

## 1. Overview

The current calculator is entirely ephemeral: every page refresh destroys all work. A PH estate lawyer computing the distribution for the Estate of Juan dela Cruz cannot save, revisit, or share that result without copying everything manually.

This feature adds an **additive persistence layer** on top of the existing calculator. Key design constraint: the anonymous, zero-auth computation path must continue to work exactly as it does today. Persistence activates only when the user chooses to log in and save.

**What lawyers get:**
- Sign in once, access all cases from any device
- Cases auto-save as input changes and when computation completes
- Dashboard listing all cases with decedent name, DOD, estate value, status
- Open a saved case and resume editing or re-compute
- Case lifecycle states: draft → computed → finalized → archived

---

## 2. Data Model

### 2.1 Tables & DDL

```sql
-- ============================================================
-- User Profiles (extends Supabase auth.users)
-- ============================================================
CREATE TABLE user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  firm_name     TEXT,
  counsel_name  TEXT,        -- e.g., "Atty. Maria L. Reyes"
  address       TEXT,
  phone         TEXT,
  email         TEXT,
  logo_url      TEXT,        -- Supabase Storage URL for firm logo
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON user_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_upsert_own" ON user_profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Trigger: keep updated_at current
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Clients (scoped per user — used by spec-client-profiles)
-- ============================================================
CREATE TABLE clients (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT NOT NULL,
  alias        TEXT,
  tin          TEXT,          -- Philippine TIN: NNN-NNN-NNN-NNN
  id_type      TEXT           CHECK (id_type IN ('PhilSys', 'SSS', 'GSIS', 'Passport', 'DL', 'Voters', 'Other')),
  id_number    TEXT,
  email        TEXT,
  phone        TEXT,
  address      TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_full_name ON clients(user_id, full_name);

CREATE POLICY "clients_all_own" ON clients
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Cases (core persistence entity)
-- ============================================================
CREATE TABLE cases (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id        UUID REFERENCES clients(id) ON DELETE SET NULL,

  -- Display label (editable by user)
  title            TEXT NOT NULL DEFAULT 'Untitled Case',

  -- Engine I/O (full serialized JSON)
  input_json       JSONB,       -- EngineInput type
  output_json      JSONB,       -- EngineOutput type (null until first computation)
  tax_input_json   JSONB,       -- EstateTaxInput (populated by BIR 1801 feature)
  tax_output_json  JSONB,       -- EstateTaxOutput (populated after tax computation)

  -- Denormalized for dashboard display + sorting/filtering (avoids JSONB scan)
  decedent_name    TEXT,
  date_of_death    DATE,
  gross_estate     BIGINT,      -- Net distributable estate in centavos

  -- Case lifecycle state
  status           TEXT NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft', 'computed', 'finalized', 'archived')),

  -- Sharing (populated by spec-shareable-links)
  share_token      TEXT UNIQUE, -- NULL = not shared; token = anyone with URL can read
  share_enabled    BOOLEAN NOT NULL DEFAULT FALSE,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

-- Performance indexes
CREATE INDEX idx_cases_user_id     ON cases(user_id);
CREATE INDEX idx_cases_client_id   ON cases(client_id);
CREATE INDEX idx_cases_status      ON cases(user_id, status);
CREATE INDEX idx_cases_updated_at  ON cases(user_id, updated_at DESC);
CREATE INDEX idx_cases_dod         ON cases(user_id, date_of_death DESC);
CREATE INDEX idx_cases_share_token ON cases(share_token) WHERE share_token IS NOT NULL;

-- RLS: owner sees own cases
CREATE POLICY "cases_select_own" ON cases
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cases_insert_own" ON cases
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cases_update_own" ON cases
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cases_delete_own" ON cases
  FOR DELETE USING (auth.uid() = user_id);

-- RLS: public read via share token (no auth required)
CREATE POLICY "cases_select_shared" ON cases
  FOR SELECT USING (share_enabled = TRUE AND share_token IS NOT NULL);

CREATE TRIGGER cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Case Notes (populated by spec-case-notes)
-- ============================================================
CREATE TABLE case_notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id    UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE case_notes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_case_notes_case_id ON case_notes(case_id);

CREATE POLICY "notes_all_own" ON case_notes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### 2.2 Status State Machine

```
draft ──► computed ──► finalized ──► archived
  ▲           │              │
  └───────────┘              └─► (cannot un-finalize via UI; admin DB edit only)
  (re-edit resets to draft)
```

| Status | Meaning | Transitions |
|--------|---------|-------------|
| `draft` | Input entered, computation not yet saved (or re-edited after compute) | → `computed` on save-after-compute |
| `computed` | Engine ran, `output_json` populated | → `finalized`, → `draft` (on re-edit) |
| `finalized` | Lawyer has reviewed and locked the case | → `archived` |
| `archived` | Closed, hidden from main list | (terminal; restore requires explicit action) |

### 2.3 Key Type Definitions (TypeScript)

```typescript
// types/db.ts
export interface CaseRow {
  id: string
  user_id: string
  client_id: string | null
  title: string
  input_json: EngineInput | null
  output_json: EngineOutput | null
  tax_input_json: object | null
  tax_output_json: object | null
  decedent_name: string | null
  date_of_death: string | null    // ISO date: 'YYYY-MM-DD'
  gross_estate: number | null     // centavos
  status: 'draft' | 'computed' | 'finalized' | 'archived'
  share_token: string | null
  share_enabled: boolean
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  full_name: string | null
  firm_name: string | null
  counsel_name: string | null
  address: string | null
  phone: string | null
  email: string | null
  logo_url: string | null
  created_at: string
  updated_at: string
}

// Dashboard list item (partial select)
export interface CaseListItem {
  id: string
  title: string
  decedent_name: string | null
  date_of_death: string | null
  gross_estate: number | null
  status: CaseRow['status']
  updated_at: string
  client_id: string | null
}
```

---

## 3. UI Design

### 3.1 Auth Flow UI

#### Sign-In / Sign-Up Modal

Triggered when anonymous user clicks "Save Case" or "Export PDF":

```
┌─────────────────────────────────────────────────────────────┐
│                     Save Your Case                          │
│  ─────────────────────────────────────────────────────────  │
│  Sign in to save, revisit, and share this computation.      │
│                                                             │
│  [  Continue with Google  ]  ← primary CTA                 │
│                                                             │
│  ─────────────── or ───────────────────────────────────     │
│                                                             │
│  Email address                                              │
│  [________________________________]                         │
│                                                             │
│  Password                                                   │
│  [________________________________]  [Show]                 │
│                                                             │
│  [Sign In]                    [Create Account]              │
│                                                             │
│  Forgot password? → Send magic link                         │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  [Continue without saving]  ← always visible, never hidden  │
└─────────────────────────────────────────────────────────────┘
```

**Behavior after sign-up:**
- Redirect back to current results view
- Immediately create case with `input_json` and `output_json` from current state
- Show save status indicator (Saved ✓) in top-right
- Case status set to `computed`

#### Signed-In Top Bar

Once authenticated, top-right area of the app shows:

```
┌───────────────────────────────────────────────────────────────┐
│  Philippine Inheritance Calculator         [Dashboard]  [Atty. │
│                                            Maria Reyes ▾]     │
└───────────────────────────────────────────────────────────────┘
```

User menu dropdown:
```
┌──────────────────────────┐
│  Atty. Maria Reyes       │
│  atty@reyeslaw.ph        │
│  ─────────────────────── │
│  Dashboard               │
│  Firm Settings           │
│  ─────────────────────── │
│  Sign Out                │
└──────────────────────────┘
```

### 3.2 Save Status Indicator

Displayed in the top-right of ResultsView when a case is active:

```
[Saving…]   — gray spinner + "Saving…" text (during debounce write)
[✓ Saved]   — green check + "Saved" (fades to idle after 2s)
[✗ Error · Retry]  — red X + link to retry
[○ Unsaved] — gray dot when dirty but debounce not fired yet
```

### 3.3 Dashboard (Case List)

Route: `/dashboard`

```
┌─────────────────────────────────────────────────────────────────────┐
│  My Cases                                         [+ New Case]       │
│                                                                      │
│  [Search cases…]    [Status ▾]    [Sort: Last updated ▾]            │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Estate of Juan dela Cruz                           computed  │   │
│  │  Date of Death: 15 Jan 2025 · Estate: ₱12,500,000           │   │
│  │  Last updated: 2 hours ago                     [Open] [···]  │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │  Estate of Lourdes Santos                          finalized  │   │
│  │  Date of Death: 03 Nov 2024 · Estate: ₱4,200,000            │   │
│  │  Last updated: 5 Jan 2025                      [Open] [···]  │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │  Untitled Case                                       draft   │   │
│  │  Date of Death: —                                            │   │
│  │  Last updated: yesterday                       [Open] [···]  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  Archived cases   [Show archived ▾]                                  │
└─────────────────────────────────────────────────────────────────────┘
```

**[···] kebab menu per case:**
```
┌─────────────────────┐
│  Rename             │
│  Finalize           │
│  Export PDF         │
│  Archive            │
│  ─────────────────  │
│  Delete             │
└─────────────────────┘
```

**Status badge colors:**
- `draft` — gray
- `computed` — blue
- `finalized` — green
- `archived` — light gray (italic)

**Search:** Client-side filter on `title + decedent_name` (list is max 50 records per page). For firms with many cases, server-side search with Supabase `ilike` or `pg_trgm`.

**Sort options:**
- Last updated (default, descending)
- Date of death (descending)
- Estate value (descending)
- Title (A-Z)

### 3.4 Case Detail View

Route: `/cases/:id`

The existing ResultsView is reused almost unchanged. Additions:

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Dashboard       Estate of Juan dela Cruz     ✓ Saved         │
│  [Rename]          Status: computed             [Finalize]       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [ResultsView — unchanged]                                       │
│  ├── ResultsHeader                                               │
│  ├── DistributionSection                                         │
│  ├── NarrativePanel                                              │
│  ├── WarningsPanel                                               │
│  ├── ComputationLog                                              │
│  └── ActionsBar                                                  │
│       Edit Input | Export JSON | Copy Narratives | Save | Share  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**"Edit Input" behavior:**
- Returns to wizard in `computed` or `finalized` state
- Prompt: "Re-editing will reset status to draft. Continue?" (if finalized)
- On confirm: set `status = 'draft'`, clear `output_json`

**"Finalize" behavior:**
- Shows modal: "Finalize this case? Finalized cases cannot be edited without resetting to draft."
- [Confirm] → set `status = 'finalized'`
- UI shows lock icon next to status badge

### 3.5 New Case Flow

Two entry points for authenticated users:

**1. From Dashboard:** Click `[+ New Case]`
- Navigates to `/?new=true` (existing calculator with fresh state)
- After computation, "Save Case" creates new record

**2. From existing case:** Click `[New Case]` in ActionsBar
- Same as above, but first confirms "Start a new case? Current case is saved."

---

## 4. API / Data Layer

### 4.1 Supabase Client Setup

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'  // generated by supabase gen types

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
  // autoRefreshToken: true (default)
  // persistSession: true (default — localStorage)
)
```

### 4.2 Auth Hook

```typescript
// hooks/useAuth.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // CRITICAL: synchronous callback (no async/await inside)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        if (event === 'SIGNED_OUT') setUser(null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}
```

### 4.3 Case CRUD Functions

```typescript
// lib/cases.ts
import { supabase } from './supabase'
import type { CaseRow, CaseListItem, EngineInput, EngineOutput } from '@/types'

// CREATE — called on first save after computation
export async function createCase(
  userId: string,
  input: EngineInput,
  output: EngineOutput
): Promise<{ id: string; error: Error | null }> {
  const { data, error } = await supabase
    .from('cases')
    .insert({
      user_id: userId,
      title: `Estate of ${input.decedent?.name ?? 'Unknown'}`,
      decedent_name: input.decedent?.name ?? null,
      date_of_death: input.decedent?.date_of_death ?? null,
      gross_estate: input.net_distributable_estate ?? null,
      input_json: input as unknown as Json,
      output_json: output as unknown as Json,
      status: 'computed'
    })
    .select('id')
    .single()

  return { id: data?.id ?? '', error: error as Error | null }
}

// READ ONE — load case into editor
export async function loadCase(caseId: string): Promise<CaseRow | null> {
  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .eq('id', caseId)
    .single()

  if (error) throw error
  return data
}

// LIST — dashboard query
export async function listCases(
  userId: string,
  filter: 'active' | 'archived' = 'active',
  limit = 50
): Promise<CaseListItem[]> {
  const statuses = filter === 'active'
    ? ['draft', 'computed', 'finalized']
    : ['archived']

  const { data, error } = await supabase
    .from('cases')
    .select('id, title, decedent_name, date_of_death, gross_estate, status, updated_at, client_id')
    .eq('user_id', userId)
    .in('status', statuses)
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as CaseListItem[]
}

// UPDATE input (auto-save trigger)
export async function updateCaseInput(
  caseId: string,
  input: EngineInput
): Promise<void> {
  const { error } = await supabase
    .from('cases')
    .update({
      input_json: input as unknown as Json,
      decedent_name: input.decedent?.name ?? null,
      date_of_death: input.decedent?.date_of_death ?? null,
      gross_estate: input.net_distributable_estate ?? null,
      status: 'draft'       // re-editing resets to draft
    })
    .eq('id', caseId)

  if (error) throw error
}

// UPDATE output (save after computation)
export async function updateCaseOutput(
  caseId: string,
  output: EngineOutput
): Promise<void> {
  const { error } = await supabase
    .from('cases')
    .update({
      output_json: output as unknown as Json,
      status: 'computed'
    })
    .eq('id', caseId)

  if (error) throw error
}

// UPDATE status (finalize / archive)
export async function updateCaseStatus(
  caseId: string,
  status: CaseRow['status']
): Promise<void> {
  const { error } = await supabase
    .from('cases')
    .update({ status })
    .eq('id', caseId)

  if (error) throw error
}

// UPDATE title (rename)
export async function renameCaseName(
  caseId: string,
  title: string
): Promise<void> {
  const { error } = await supabase
    .from('cases')
    .update({ title: title.trim() || 'Untitled Case' })
    .eq('id', caseId)

  if (error) throw error
}

// DELETE (only draft or archived cases)
export async function deleteCase(caseId: string): Promise<void> {
  const { error } = await supabase
    .from('cases')
    .delete()
    .eq('id', caseId)

  if (error) throw error
}
```

### 4.4 Auto-Save Hook

```typescript
// hooks/useAutoSave.ts
import { useEffect, useRef, useState } from 'react'
import { updateCaseInput, updateCaseOutput } from '@/lib/cases'
import type { EngineInput, EngineOutput } from '@/types'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value)
  useEffect(() => {
    const h = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(h)
  }, [value, delay])
  return debounced
}

// Auto-save EngineInput changes (debounced 1500ms)
export function useInputAutoSave(
  caseId: string | null,
  input: EngineInput | null,
  enabled: boolean
): SaveStatus {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const debouncedInput = useDebounce(input, 1500)
  const isFirst = useRef(true)

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return }
    if (!enabled || !caseId || !debouncedInput) return

    setStatus('saving')
    updateCaseInput(caseId, debouncedInput)
      .then(() => {
        setStatus('saved')
        setTimeout(() => setStatus('idle'), 2000)
      })
      .catch(() => setStatus('error'))
  }, [debouncedInput, caseId, enabled])

  return status
}

// Immediate save on computation result (no debounce)
export async function saveComputationResult(
  caseId: string,
  output: EngineOutput,
  setStatus: (s: SaveStatus) => void
): Promise<void> {
  setStatus('saving')
  try {
    await updateCaseOutput(caseId, output)
    setStatus('saved')
    setTimeout(() => setStatus('idle'), 2000)
  } catch {
    setStatus('error')
  }
}
```

### 4.5 Route Guard

```typescript
// components/RequireAuth.tsx
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="flex h-screen items-center justify-center">
    <Spinner />
  </div>

  if (!user) return <Navigate to="/" state={{ from: location, showAuthModal: true }} replace />

  return <>{children}</>
}
```

### 4.6 LocalStorage Draft Cache (Offline Fallback)

```typescript
// lib/draftCache.ts
const DRAFT_KEY = 'inh-active-draft'
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

interface DraftEntry {
  caseId: string | null
  inputJson: EngineInput
  savedAt: number
}

export function saveDraft(inputJson: EngineInput, caseId: string | null = null) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify({ caseId, inputJson, savedAt: Date.now() }))
}

export function loadDraft(): DraftEntry | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const entry: DraftEntry = JSON.parse(raw)
    if (Date.now() - entry.savedAt > DRAFT_TTL_MS) {
      localStorage.removeItem(DRAFT_KEY)
      return null
    }
    return entry
  } catch {
    return null
  }
}

export function clearDraft() {
  localStorage.removeItem(DRAFT_KEY)
}
```

---

## 5. Integration Points

### 5.1 App.tsx Changes

```typescript
// App.tsx — modified to support auth + persistence
type AppState =
  | { phase: 'wizard' }
  | { phase: 'computing' }
  | { phase: 'results'; input: EngineInput; output: EngineOutput }
  | { phase: 'loading-case' }   // NEW: fetching saved case from DB
  | { phase: 'error'; message: string }

function App() {
  const { user, loading: authLoading } = useAuth()
  const [state, setState] = useState<AppState>({ phase: 'wizard' })
  const [caseId, setCaseId] = useState<string | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)

  // Auto-save input changes
  const saveStatus = useInputAutoSave(
    caseId,
    state.phase === 'wizard' ? currentInput : null,  // hook into form state
    !!user && !!caseId
  )

  // Handle "Save Case" click
  async function handleSaveCase() {
    if (!user) {
      setShowAuthModal(true)
      return
    }
    if (state.phase !== 'results') return
    const { id, error } = await createCase(user.id, state.input, state.output)
    if (!error) {
      setCaseId(id)
      // Now auto-save is active (caseId is set)
    }
  }

  // After engine computation completes
  async function handleComputationComplete(input: EngineInput, output: EngineOutput) {
    setState({ phase: 'results', input, output })
    // If already tracking a case, save the new output immediately
    if (user && caseId) {
      await saveComputationResult(caseId, output, setSaveStatus)
    }
  }
}
```

### 5.2 Downstream Feature Dependencies

This feature is a **prerequisite** for:
- `spec-client-profiles` — clients table references auth.users
- `spec-firm-branding` — firm settings stored in user_profiles
- `spec-case-notes` — case_notes references cases table
- `spec-bir-1801-integration` — tax_input_json / tax_output_json columns on cases
- `spec-shareable-links` — share_token / share_enabled columns on cases
- `spec-multi-seat` — org membership scoped to users
- `spec-case-export-zip` — requires case_id to bundle files
- `spec-deadline-tracker` — deadlines reference case_id
- `spec-document-checklist` — checklist items reference case_id
- `spec-timeline-report` — timeline data references case_id

### 5.3 Integration With PDF Export (`spec-pdf-export`)

When generating a PDF for a saved case:
- Load `input_json` + `output_json` from `cases` row
- Load `user_profiles` for firm header (name, address, counsel_name, logo_url)
- Inject all into `generatePdf(input, output, firmProfile)` function
- No additional API calls needed

### 5.4 Integration With Shared Links (`spec-shareable-links`)

The `share_token` and `share_enabled` columns are already defined on `cases`. The shared-links feature will:
- Generate a UUID v4 token and write it to `share_token`
- Set `share_enabled = TRUE`
- The RLS policy `cases_select_shared` allows unauthenticated reads when both conditions are true

---

## 6. Edge Cases

### 6.1 Authentication Edge Cases

| Scenario | Handling |
|----------|----------|
| User closes auth modal without signing in | `showAuthModal = false`, computation still intact, work not lost |
| Google OAuth popup blocked by browser | Show fallback email/password form; display "Allow popups" helper text |
| Magic link not received | Link to "Resend magic link"; note spam folder; retry after 60s |
| Token expires during a long session (> 1 hour) | Supabase auto-refreshes silently; lawyer doesn't see any interruption |
| User signs out while editing | Auto-save flushes immediately; state clears; redirect to `/` |
| Session invalid on case load | `loadCase()` throws; show "Session expired, please sign in" and redirect |

### 6.2 Auto-Save Edge Cases

| Scenario | Handling |
|----------|----------|
| Network drops during auto-save | `SaveStatus = 'error'`; retry on next keystroke (next debounce fires) |
| User closes tab mid-debounce | `saveDraft()` is called synchronously on `beforeunload` event to flush to localStorage |
| Two tabs open on same case | Last-write-wins (Supabase `updated_at` is the tie-breaker); acceptable for solo-user model |
| Auto-save fires on finalized case | Guard: if `status === 'finalized'`, skip auto-save; return early in hook |
| Input changes from WASM re-run (e.g., edit after compute) | Reset `status → 'draft'` on `updateCaseInput()`; `output_json` retained but stale (shown as "Stale — re-compute to update") |

### 6.3 Case Load Edge Cases

| Scenario | Handling |
|----------|----------|
| Case not found (wrong ID / deleted) | 404 page: "Case not found" with `[← Back to Dashboard]` |
| Case belongs to different user | RLS blocks SELECT; same 404 page (don't reveal case exists) |
| `output_json` is null (draft never computed) | Load wizard with `input_json`; bypass results phase; status = 'draft' |
| `input_json` is null (corrupt record) | Show warning: "Case input data is missing. Start a new case?" |
| Very large JSONB (many heirs, many donations) | JSONB max size is effectively unlimited in Postgres; no issue expected for <100 heirs |

### 6.4 Validation Rules

| Field | Rule |
|-------|------|
| `title` | Max 255 chars; trimmed; defaults to "Untitled Case" if empty |
| `decedent_name` | Denormalized from `input_json.decedent.name`; no separate validation |
| `date_of_death` | Must be a valid date; cannot be in the future |
| `gross_estate` | Integer centavos; must be ≥ 0; ≤ 999,999,999,999,999 (PHP 10 billion ceiling) |
| `status` | DB CHECK constraint enforces valid values |
| `share_token` | DB UNIQUE constraint; generated by `gen_random_uuid()` |

### 6.5 Permissions

| Action | Permission |
|--------|------------|
| Compute (anonymous) | Always allowed — no auth required |
| Save case | Requires auth |
| View saved case | Requires auth + case ownership (via RLS) OR valid share_token |
| Finalize case | Requires auth + case ownership |
| Delete case | Requires auth + case ownership + status ∈ {'draft', 'archived'} |
| Edit finalized case | Requires auth + case ownership + explicit confirmation modal |

---

## 7. Dependencies

This feature has **no upstream feature dependencies** — it is the first Wave 2 feature because everything else builds on top of it.

**Must install before implementing:**
```bash
npm install @supabase/supabase-js
npm install react-router-dom  # if not already installed
```

**Environment variables required:**
```
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
```

**Supabase setup steps:**
1. Create Supabase project
2. Run DDL migration (all tables above, in order)
3. Enable Google OAuth provider in Supabase Auth settings
4. Configure email templates (confirm signup, magic link)
5. Generate TypeScript types: `supabase gen types typescript --project-id [ref] > src/lib/database.types.ts`

---

## 8. Acceptance Criteria

### Auth
- [ ] Anonymous user can compute inheritance without any auth prompt or gate
- [ ] Clicking "Save Case" from anonymous state triggers auth modal
- [ ] "Continue without saving" in modal dismisses it and preserves current computation
- [ ] Sign up with email+password creates account and returns to results view with case auto-saved
- [ ] Sign in with Google OAuth works (popup flow)
- [ ] Magic link "forgot password" flow sends email and signs in on click
- [ ] Signed-in user sees user menu (name, Dashboard link, Settings link, Sign Out)
- [ ] Sign out clears session and returns to anonymous calculator

### Dashboard
- [ ] Dashboard shows all non-archived cases sorted by `updated_at DESC`
- [ ] Case cards show: title, decedent name, date of death, formatted estate value, status badge
- [ ] "+" button navigates to fresh calculator
- [ ] Clicking a case card navigates to `/cases/:id`
- [ ] Search filters case list by title or decedent name
- [ ] Status filter shows only selected statuses
- [ ] Kebab menu: Rename, Finalize, Archive, Export PDF, Delete
- [ ] Delete is disabled for `computed` and `finalized` cases (must archive first)
- [ ] "Show archived" toggle reveals archived cases in a separate section

### Case CRUD
- [ ] Opening a saved `computed` case loads `input_json` and `output_json`; results view shown immediately
- [ ] Opening a saved `draft` case loads `input_json` and shows wizard pre-filled
- [ ] Editing input auto-saves after 1500ms debounce; status resets to `draft`
- [ ] Re-running computation saves `output_json` immediately; status becomes `computed`
- [ ] Renaming a case updates `title` in DB and in dashboard list
- [ ] Finalizing sets `status = 'finalized'`; "Edit Input" requires confirmation
- [ ] Archiving sets `status = 'archived'`; case disappears from main list
- [ ] Case not owned by current user returns 404 (no data leakage)

### Auto-Save UX
- [ ] Save status indicator shows: idle / saving / saved / error states
- [ ] "Saved ✓" message fades after 2 seconds
- [ ] "Error · Retry" shows and retries on next debounce
- [ ] On `beforeunload`, draft is written to localStorage as fallback
- [ ] On app reload, if localStorage draft exists for current caseId, no work is lost

### Security
- [ ] RLS prevents any user from reading another user's cases (verify via Supabase query with wrong user_id)
- [ ] Shared cases (share_enabled=TRUE) are readable without auth
- [ ] Non-shared cases (share_enabled=FALSE) are NOT readable without auth, even with token
- [ ] `service_role` key is never in client code (verify `.env` only contains anon key)
- [ ] Auth state listener is synchronous (no async/await inside callback)

---

## 9. File Changes Required

| File | Change |
|------|--------|
| `package.json` | Add `@supabase/supabase-js`, `react-router-dom` |
| `src/lib/supabase.ts` | NEW — Supabase client singleton |
| `src/lib/cases.ts` | NEW — Case CRUD functions |
| `src/lib/draftCache.ts` | NEW — LocalStorage fallback |
| `src/lib/database.types.ts` | NEW — Generated Supabase types |
| `src/hooks/useAuth.ts` | NEW — Auth state hook |
| `src/hooks/useAutoSave.ts` | NEW — Debounced auto-save hook |
| `src/types/db.ts` | NEW — CaseRow, UserProfile, CaseListItem types |
| `src/components/RequireAuth.tsx` | NEW — Route guard wrapper |
| `src/components/AuthModal.tsx` | NEW — Sign in / sign up modal |
| `src/components/SaveStatusIndicator.tsx` | NEW — Save status pill |
| `src/pages/Dashboard.tsx` | NEW — Case list page |
| `src/pages/CaseEditor.tsx` | NEW — Wraps ResultsView with caseId context |
| `src/App.tsx` | MODIFY — Add routes, auth state, caseId state, save logic |
| `.env.local` | NEW (not committed) — VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY |
| `supabase/migrations/001_initial_schema.sql` | NEW — Full DDL migration |
