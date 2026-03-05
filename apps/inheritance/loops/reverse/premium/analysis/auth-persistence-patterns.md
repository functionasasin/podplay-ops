# Auth & Persistence Patterns — Analysis

**Aspect:** auth-persistence-patterns
**Wave:** 1 — Domain Research
**Date:** 2026-02-28

---

## 1. Authentication Provider Recommendation

### Options Evaluated

| Method | Security | UX | Best For |
|--------|----------|-----|----------|
| Email + Password | ⭐⭐⭐ | ⭐⭐⭐ | Universal fallback |
| Magic Link (OTP) | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Low-friction B2B SaaS |
| Google OAuth | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Fast onboarding |
| Combined + MFA | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Enterprise clients |

### Recommendation for PH Estate Lawyers

**Primary: Email + Password with Magic Link fallback.**

Rationale:
- PH law firms operate in a **professional context** where controlled, verifiable credentials are expected. Google OAuth may not cover all PH lawyers (some use Outlook/Apple).
- Magic Links are excellent UX but require reliable email delivery — risk with PH mobile ISPs and some corporate email servers blocking marketing-tagged links.
- Email + Password is the safest universal baseline that all lawyers can use.
- Offer **Google OAuth as an opt-in convenience** at sign-up (covers lawyers with Gmail).
- **Magic Link** as the "forgot password" / passwordless option.
- **MFA via TOTP** (Google Authenticator) for firm admin accounts.

### Implementation (Supabase)

```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'atty.reyes@reyeslaw.ph',
  password: 'securepassword123',
  options: {
    data: { full_name: 'Atty. Maria Reyes' }
  }
})

// Sign in with password
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'atty.reyes@reyeslaw.ph',
  password: 'securepassword123'
})

// Magic Link (OTP) — passwordless
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'atty.reyes@reyeslaw.ph',
  options: { shouldCreateUser: false }  // don't auto-create on first magic link
})

// Google OAuth
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: `${window.location.origin}/auth/callback` }
})
```

---

## 2. Row-Level Security Policies

### Critical Security Context

83% of exposed Supabase databases involve RLS misconfigurations (CVE-2025-48757, January 2025). **Every table that stores case data MUST have RLS enabled.** The service_role key must never touch client code.

### Core Principle

Every query is automatically filtered to the current user's `auth.uid()`. Users can never read or write rows belonging to other users.

### RLS Policy Templates

```sql
-- Enable RLS on all user-owned tables
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_notes ENABLE ROW LEVEL SECURITY;

-- Cases: user sees only their own cases
CREATE POLICY "cases_select_own" ON cases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "cases_insert_own" ON cases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cases_update_own" ON cases
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cases_delete_own" ON cases
  FOR DELETE USING (auth.uid() = user_id);

-- Public read access for shared cases (via share_token)
CREATE POLICY "cases_select_shared" ON cases
  FOR SELECT USING (
    share_token IS NOT NULL
    AND share_token = current_setting('app.share_token', true)
  );
```

**Performance note:** Always index RLS columns:
```sql
CREATE INDEX idx_cases_user_id ON cases(user_id);
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_case_notes_case_id ON case_notes(case_id);
```

---

## 3. Cases Table Schema

### Full DDL

```sql
-- User profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  firm_name   TEXT,
  counsel_name TEXT,        -- e.g., "Atty. Maria L. Reyes"
  address     TEXT,
  phone       TEXT,
  email       TEXT,
  logo_url    TEXT,         -- Supabase Storage URL
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON user_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_upsert_own" ON user_profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Clients table
CREATE TABLE clients (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT NOT NULL,
  alias        TEXT,
  tin          TEXT,          -- Philippine TIN
  id_type      TEXT,          -- e.g., 'SSS', 'GSIS', 'PhilSys', 'Passport'
  id_number    TEXT,
  email        TEXT,
  phone        TEXT,
  address      TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_clients_user_id ON clients(user_id);

CREATE POLICY "clients_all_own" ON clients
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Cases table (core entity)
CREATE TABLE cases (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id     UUID REFERENCES clients(id) ON DELETE SET NULL,

  -- Display
  title         TEXT NOT NULL DEFAULT 'Untitled Case',

  -- Case content (JSONB — stores complete engine I/O)
  input_json    JSONB,         -- EngineInput (family_tree, donations, will, gross_estate)
  output_json   JSONB,         -- EngineOutput (per_heir_shares, narrative, etc.)
  tax_input_json  JSONB,       -- EstateTaxInput (additional fields for BIR 1801)
  tax_output_json JSONB,       -- EstateTaxOutput (computed tax amounts, Form 1801)

  -- Metadata
  decedent_name TEXT,          -- Denormalized for quick display
  date_of_death DATE,          -- Denormalized for quick display
  gross_estate  BIGINT,        -- In centavos, denormalized for sorting/filtering

  -- Case state
  status        TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'computed', 'finalized', 'archived')),

  -- Sharing
  share_token   TEXT UNIQUE,   -- NULL = not shared; set = anyone with token can read
  share_enabled BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_cases_user_id ON cases(user_id);
CREATE INDEX idx_cases_client_id ON cases(client_id);
CREATE INDEX idx_cases_status ON cases(user_id, status);
CREATE INDEX idx_cases_updated_at ON cases(user_id, updated_at DESC);
CREATE INDEX idx_cases_share_token ON cases(share_token) WHERE share_token IS NOT NULL;

CREATE POLICY "cases_select_own" ON cases
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cases_insert_own" ON cases
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cases_update_own" ON cases
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cases_delete_own" ON cases
  FOR DELETE USING (auth.uid() = user_id);

-- Shared case read access (no auth required — token-based)
CREATE POLICY "cases_select_shared" ON cases
  FOR SELECT USING (
    share_enabled = TRUE
    AND share_token IS NOT NULL
  );

-- Case notes
CREATE TABLE case_notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id    UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE case_notes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_case_notes_case_id ON case_notes(case_id);

CREATE POLICY "notes_all_own" ON case_notes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### Status State Machine

```
draft ──► computed ──► finalized ──► archived
  ▲           │
  └───────────┘  (re-edit resets to draft)
```

- **draft** — Input entered but computation not yet saved
- **computed** — Engine has run, output_json is populated
- **finalized** — Lawyer has reviewed and locked the case
- **archived** — Closed, not shown in main list

---

## 4. Auto-Save Strategy

### Recommendation: Debounced Auto-Save (1500ms) + Explicit Save Button

**Why both:**
- Debounce ensures no work is lost if the user closes tab unexpectedly
- Explicit save gives lawyers a sense of control and completion
- Show save status indicator (Saving… / Saved / Error) top-right

### Custom Hook Implementation

```typescript
// hooks/useAutoSave.ts
import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function useAutoSave(
  caseId: string | null,
  formData: Partial<CaseRow>,
  enabled: boolean = true
) {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const debouncedData = useDebounce(formData, 1500)
  const isFirstRender = useRef(true)

  useEffect(() => {
    // Skip the first render to avoid saving on mount
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (!enabled || !caseId) return

    setStatus('saving')
    supabase
      .from('cases')
      .update({ ...debouncedData, updated_at: new Date().toISOString() })
      .eq('id', caseId)
      .then(({ error }) => {
        setStatus(error ? 'error' : 'saved')
        if (!error) setTimeout(() => setStatus('idle'), 2000)
      })
  }, [debouncedData, caseId, enabled])

  return status
}
```

### Save Status UI Component

```
┌─────────────────────────────────────────────┐
│  [Case Title]                    ● Saving…  │
│                                             │
│  [Case Title]                    ✓ Saved    │
│                                             │
│  [Case Title]                    ✗ Error    │
└─────────────────────────────────────────────┘
```

- **Saving…** — Gray spinner + text
- **Saved** — Green checkmark, fades after 2 seconds
- **Error** — Red X with "Retry" link

### When to Auto-Save vs. Explicit Save

| Trigger | Action | Debounce |
|---------|--------|----------|
| User types in any input | Auto-save `input_json` | 1500ms |
| Engine computes | Auto-save `output_json` | Immediate (on computation) |
| User clicks "Save" | Explicit save all fields | None |
| User clicks "Finalize" | Set `status = finalized` | None |
| User navigates away | Flush debounce immediately | None (flush) |

---

## 5. Offline Considerations

### Recommendation: Minimal Offline Support (IndexedDB Draft Cache)

Full offline-first is over-engineered for this tool's current scope. However, two specific offline scenarios matter for PH lawyers:

1. **Courthouse with poor signal** — Lawyer needs to view a computed case
2. **Flight mode during consultation** — Lawyer is demonstrating the tool offline

### Implementation: LocalStorage Draft Cache (Simple)

```typescript
// lib/draftCache.ts
// Simple localStorage cache for the active case draft
// (not full offline-first — just prevents losing work on bad connections)

const DRAFT_KEY = 'inh-active-draft'

export function saveDraft(caseId: string, inputJson: EngineInput) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify({ caseId, inputJson, savedAt: Date.now() }))
}

export function loadDraft(): { caseId: string; inputJson: EngineInput } | null {
  const raw = localStorage.getItem(DRAFT_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    // Expire drafts older than 7 days
    if (Date.now() - parsed.savedAt > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(DRAFT_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function clearDraft() {
  localStorage.removeItem(DRAFT_KEY)
}
```

**Why not IndexedDB:**
- LocalStorage is synchronous, simpler, and sufficient for single-case draft caching
- The WASM engine runs client-side anyway — computation works offline
- Full IndexedDB + sync (PouchDB/CouchDB) is appropriate only if offline multi-case browsing becomes a requirement

### Anonymous Usage + Offline (No Auth Path)

The existing app is entirely ephemeral (no persistence). The anonymous usage path MUST continue to work:
- WASM engine loads and computes without any auth
- No Supabase calls are made until user logs in
- No prompts or gates block anonymous computation
- "Save case" becomes available only when authenticated

---

## 6. Session Management & Token Refresh

### Browser Behavior (Supabase Default)

Supabase's JS client **automatically refreshes tokens** in the browser. No manual intervention needed:

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
  // autoRefreshToken: true is the default
)
```

### Auth State Listener (CRITICAL: Must Be Synchronous)

```typescript
// CORRECT — synchronous callback
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') setUser(session?.user ?? null)
  if (event === 'SIGNED_OUT') setUser(null)
  if (event === 'TOKEN_REFRESHED') setUser(session?.user ?? null)
})

// WRONG — async callback causes deadlock on token refresh
supabase.auth.onAuthStateChange(async (event, session) => {  // ❌
  const { data } = await supabase.auth.getUser()             // ❌ deadlock risk
})
```

### Trusted User Verification

```typescript
// For sensitive operations (save, delete), always verify via server
const { data: { user }, error } = await supabase.auth.getUser()
// Not: supabase.auth.getClaims() — local only, doesn't verify server-side logout

if (!user || error) {
  // Session invalid — redirect to login
}
```

### Session Config Recommendations

```
Access token expiry: 3600s (1 hour) — default, good balance
Refresh token: Never expires, single-use rotation
Session duration: 604800s (7 days) default — keep at default
Inactivity timeout: Disabled (lawyers may leave tab open overnight)
```

---

## 7. Migration Strategy: Ephemeral → Persisted

### Constraint

The current app has ZERO authentication or persistence. The migration must be:
1. **Non-breaking** — Anonymous users continue to compute without auth
2. **Additive** — Auth/save is an overlay, not a replacement
3. **Gradual** — Users can try the tool before signing up

### Migration Architecture

```
Current app state:
  URL: /
  State: React in-memory (EngineInput, EngineOutput)
  Persistence: None

Target state:
  URL: / (anonymous) or /cases/:id (authenticated)
  State: React in-memory + Supabase cases table
  Persistence: Auto-save on authenticated routes
```

### User Flow

```
Anonymous User
  │
  ├─ Computes inheritance (works, no auth)
  │
  ├─ Clicks "Save Case" or "Export PDF"
  │   └─► Modal: "Create a free account to save cases"
  │         [Sign up with Google]  [Sign up with email]
  │         [Continue without saving] ←── always available
  │
  └─ Signs up → redirected back to current computation
       └─► Case automatically saved as their first case

Returning Authenticated User
  │
  ├─ Visits / → redirected to /dashboard (cases list)
  ├─ Opens a saved case → /cases/:id (auto-loads input_json)
  └─ Computes → auto-saves output_json (status: computed)
```

### Code Architecture

```typescript
// App.tsx — gating pattern
function App() {
  const { user, loading } = useSupabaseAuth()

  // Routes available to EVERYONE (anonymous + authenticated)
  // /          → Calculator (ephemeral mode if no auth)
  // /shared/:token → Read-only shared case view

  // Routes only for authenticated users
  // /dashboard  → Case list
  // /cases/:id  → Saved case editor
  // /settings   → Firm profile

  return (
    <Routes>
      <Route path="/" element={<Calculator user={user} />} />
      <Route path="/shared/:token" element={<SharedCaseView />} />
      <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/cases/:id" element={<RequireAuth><CaseEditor /></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
    </Routes>
  )
}

// Calculator passes user to enable/disable save
function Calculator({ user }: { user: User | null }) {
  const [caseId, setCaseId] = useState<string | null>(null)
  const saveStatus = useAutoSave(caseId, inputData, !!user && !!caseId)

  // "Save" button: if no user → trigger auth modal
  // if user → create case in DB, set caseId → triggers auto-save
}
```

---

## 8. Key Supabase Client Patterns

### Upsert Case on First Save

```typescript
async function saveCase(userId: string, inputJson: EngineInput, outputJson: EngineOutput) {
  const { data, error } = await supabase
    .from('cases')
    .insert({
      user_id: userId,
      title: `Estate of ${inputJson.decedent?.name ?? 'Unknown'}`,
      decedent_name: inputJson.decedent?.name,
      date_of_death: inputJson.decedent?.date_of_death,
      input_json: inputJson,
      output_json: outputJson,
      status: 'computed'
    })
    .select('id')
    .single()

  return { id: data?.id, error }
}
```

### Load Case

```typescript
async function loadCase(caseId: string) {
  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .eq('id', caseId)
    .single()

  if (error) throw error
  return data
}
```

### List Cases for Dashboard

```typescript
async function listCases(userId: string, filter: 'active' | 'archived' = 'active') {
  const statuses = filter === 'active'
    ? ['draft', 'computed', 'finalized']
    : ['archived']

  const { data, error } = await supabase
    .from('cases')
    .select('id, title, decedent_name, date_of_death, gross_estate, status, updated_at, client_id')
    .eq('user_id', userId)
    .in('status', statuses)
    .order('updated_at', { ascending: false })
    .limit(50)

  return { cases: data ?? [], error }
}
```

---

## 9. Discovered Features (Not in Initial Spec)

During this research, the following features emerged that PH estate lawyers would value:

1. **`spec-case-export-zip`** — Export all case files (input JSON, output JSON, PDF) as a single ZIP for offline archival. Lawyers often need to archive completed estate cases. *(Discovered from offline considerations)*

2. **`spec-session-timeout-warning`** — Show "Your session will expire in 5 minutes" warning with one-click extend. Estate lawyers may spend long sessions reviewing documents. *(Discovered from session management research)*

These should be evaluated against the threshold: *would a PH estate lawyer pay for this?*
- `spec-case-export-zip` — YES, archival is a legal obligation
- `spec-session-timeout-warning` — Nice-to-have, but not paywall-worthy; include in core

---

## 10. Summary Recommendations

| Topic | Decision |
|-------|----------|
| Primary auth | Email + Password |
| Secondary auth | Google OAuth (opt-in), Magic Link (passwordless) |
| MFA | TOTP for firm admin (optional) |
| RLS strategy | `user_id = auth.uid()` on all tables |
| Auto-save | Debounced (1500ms) + explicit save button |
| Save indicator | Saving… / Saved / Error (top-right) |
| Offline support | LocalStorage draft cache only (not full PWA) |
| Anonymous usage | Always preserved — no auth gate on computation |
| Session refresh | Supabase auto-refresh (synchronous callback) |
| Token trust | Always use `getUser()` for sensitive operations |
| Migration | Additive overlay — auth triggers on "Save" action |

---

## Sources

- [Row Level Security | Supabase Docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Row Level Security (RLS): Complete Guide 2026 | DesignRevision](https://designrevision.com/blog/supabase-row-level-security)
- [Enforcing Row Level Security in Supabase: Multi-Tenant Architecture - DEV Community](https://dev.to/blackie360/-enforcing-row-level-security-in-supabase-a-deep-dive-into-lockins-multi-tenant-architecture-4hd2)
- [How to Design ER Diagrams for Legal Case Management Systems - GeeksforGeeks](https://www.geeksforgeeks.org/dbms/how-to-design-er-diagrams-for-legal-case-management-systems/)
- [Smarter Forms in React: Building a useAutoSave Hook with Debounce and React Query | Medium](https://darius-marlowe.medium.com/smarter-forms-in-react-building-a-useautosave-hook-with-debounce-and-react-query-d4d7f9bb052e)
- [Offline-first frontend apps in 2025: IndexedDB and SQLite in the browser and beyond - LogRocket Blog](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/)
- [Passwordless email logins | Supabase Docs](https://supabase.com/docs/guides/auth/auth-email-passwordless)
- [Auth | Supabase Docs](https://supabase.com/docs/guides/auth)
- [User sessions | Supabase Docs](https://supabase.com/docs/guides/auth/sessions)
- [Password-based Auth | Supabase Docs](https://supabase.com/docs/guides/auth/passwords)
