# Feature Spec: Conflict of Interest Check

**Aspect:** spec-conflict-check
**Wave:** 2 — Per-Feature Specifications
**Date:** 2026-03-01
**Reads:** crm-law-firm-patterns, spec-client-profiles
**Depends on:** spec-client-profiles (clients table, conflict_cleared + conflict_notes columns)

---

## 1. Overview

The conflict-of-interest check is a mandatory pre-intake screening step that runs before a
Philippine estate lawyer accepts a new client or matter. It searches the firm's existing
client pool and heir names across all open cases to identify any person who might represent
a conflicting interest.

**Why a PH estate lawyer needs this:**

Under the 2023 Code of Professional Responsibility and Accountability (CPRA) of the
Philippines, lawyers have mandatory obligations on conflict screening:

- **Canon III, Section 13** — "A lawyer shall not represent conflicting interests unless
  all clients concerned give their informed written consent."
- **Canon III, Section 14** — "Before accepting representation, a lawyer shall ascertain
  whether the prospective engagement would conflict with any existing or past
  client relationship."
- **Canon III, Section 16** — "A lawyer who has formerly represented a client in a matter
  shall not, without consent, represent another person in the same or a substantially
  related matter where that person's interests are materially adverse to the former client."

In estate practice, conflict scenarios arise constantly:
- The same person appears as an heir in one case and as a prospective client in another
  case where their interests might diverge (e.g., a legitimate child from one estate
  becomes adverse to a surviving spouse in a different but related estate)
- Two siblings from the same family want to hire the same attorney, but one contests the
  will while the other supports it
- A former client is now a creditor claiming against an estate the attorney is settling

**What this feature does:**

1. Presents a conflict check gate before creating a new client
2. Searches `clients` table (fuzzy name + TIN) and heir names embedded in `cases.input_json`
3. Returns CLEAR (no matches) or FLAGGED (one or more matches)
4. Records every check in `conflict_check_log` for professional compliance auditing
5. Feeds the result into `clients.conflict_cleared` and `clients.conflict_notes`

**What this feature does NOT do:**

- It does not block the lawyer from proceeding after reviewing flagged results — it is a
  professional decision tool, not an enforcement gate
- It does not check for conflicts with opposing parties outside the system (heirs not yet
  entered, external creditors) — those require manual attorney judgment
- It does not replace attorney ethical judgment; it informs it

---

## 2. Data Model

### 2.1 conflict_check_log Table

Records every conflict check performed. Required for:
- Professional compliance auditing ("We performed a conflict check on [date] and found no
  conflicts before accepting this matter")
- Historical record if a conflict is later discovered ("Check was run; results showed...")
- Firm admin visibility into check history (spec-multi-seat)

```sql
CREATE TABLE conflict_check_log (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id       UUID        REFERENCES clients(id) ON DELETE SET NULL,
  -- NULL when check is run before client is created (pre-intake step)

  checked_name    TEXT        NOT NULL,
  checked_tin     TEXT,       -- optional; exact match check in addition to name similarity

  result_json     JSONB       NOT NULL DEFAULT '{}',
  -- Full result payload from run_conflict_check() RPC
  -- Includes client_matches[], heir_matches[], total_matches, outcome

  match_count     INT         NOT NULL DEFAULT 0,
  -- Denormalized from result_json for quick filtering

  outcome         TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (outcome IN ('clear', 'flagged', 'cleared_after_review', 'skipped')),
  -- clear:                No matches found; automatically cleared
  -- flagged:              Matches found; awaiting attorney review
  -- cleared_after_review: Matches found but attorney confirmed no conflict
  -- skipped:              Attorney chose to skip the check entirely

  outcome_notes   TEXT,
  -- Attorney notes when clearing a flagged result or skipping
  -- Required when outcome = 'cleared_after_review' (enforced client-side)

  checked_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE conflict_check_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_conflict_log_user     ON conflict_check_log(user_id);
CREATE INDEX idx_conflict_log_client   ON conflict_check_log(client_id);
CREATE INDEX idx_conflict_log_outcome  ON conflict_check_log(user_id, outcome);
CREATE INDEX idx_conflict_log_checked  ON conflict_check_log(user_id, checked_at DESC);

CREATE POLICY "conflict_log_own" ON conflict_check_log
  FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK(auth.uid() = user_id);
```

### 2.2 Relationship to clients Table

`spec-client-profiles` already defines these columns on `clients`:
```sql
conflict_cleared  BOOLEAN  NOT NULL DEFAULT FALSE,
conflict_notes    TEXT,
```

The conflict check feature writes to these fields:
- `conflict_cleared = TRUE` when outcome is `clear` or `cleared_after_review`
- `conflict_cleared = FALSE` when outcome is `skipped` or `flagged` (pending review)
- `conflict_notes` = auto-note (CLEAR) or attorney-entered notes (FLAGGED/SKIPPED)

No schema changes to `clients` are needed — the columns are already there.

### 2.3 Supabase RPC: run_conflict_check

The search runs server-side to leverage PostgreSQL's `pg_trgm` trigram similarity
extension for fuzzy name matching. The RPC is SECURITY DEFINER so it can only return rows
belonging to the calling user (via `auth.uid()`).

```sql
-- Prerequisite: pg_trgm extension (enabled by default in Supabase)
-- If not enabled, run once: CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION run_conflict_check(
  p_name  TEXT,
  p_tin   TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid             UUID := auth.uid();
  v_client_matches  JSONB;
  v_heir_matches    JSONB;
  v_total           INT;
BEGIN
  -- ── 1. Search existing clients by trigram name similarity ─────────────────
  SELECT COALESCE(jsonb_agg(m ORDER BY (m->>'similarity')::float DESC), '[]'::jsonb)
  INTO   v_client_matches
  FROM (
    SELECT jsonb_build_object(
      'match_type',   'client',
      'client_id',    c.id::text,
      'name',         c.full_name,
      'status',       c.status,
      'tin',          c.tin,
      'intake_date',  to_char(c.intake_date, 'Mon DD, YYYY'),
      'similarity',   round(similarity(c.full_name, p_name)::numeric, 2)
    ) AS m
    FROM clients c
    WHERE c.user_id = v_uid
      AND (
        similarity(c.full_name, p_name) > 0.35
        OR (p_tin IS NOT NULL AND p_tin <> '' AND c.tin = p_tin)
      )
    ORDER BY similarity(c.full_name, p_name) DESC
    LIMIT 15
  ) sub;

  -- ── 2. Search heir names embedded in cases.input_json ────────────────────
  -- input_json shape (WASM engine input):
  --   { "family_tree": { "heirs": [{ "name": "...", "relationship": "..." }, ...] } }
  SELECT COALESCE(jsonb_agg(m ORDER BY (m->>'similarity')::float DESC), '[]'::jsonb)
  INTO   v_heir_matches
  FROM (
    SELECT jsonb_build_object(
      'match_type',        'heir',
      'case_id',           c.id::text,
      'case_title',        c.title,
      'decedent_name',     c.decedent_name,
      'heir_name',         heir->>'name',
      'heir_relationship', heir->>'relationship',
      'case_status',       c.status,
      'similarity',        round(similarity(heir->>'name', p_name)::numeric, 2)
    ) AS m
    FROM cases c,
      jsonb_array_elements(
        COALESCE(c.input_json #> '{family_tree,heirs}', '[]'::jsonb)
      ) AS heir
    WHERE c.user_id = v_uid
      AND jsonb_typeof(c.input_json #> '{family_tree,heirs}') = 'array'
      AND similarity(heir->>'name', p_name) > 0.35
    ORDER BY similarity(heir->>'name', p_name) DESC
    LIMIT 15
  ) sub;

  v_total := jsonb_array_length(v_client_matches) + jsonb_array_length(v_heir_matches);

  RETURN jsonb_build_object(
    'checked_name',    p_name,
    'checked_tin',     p_tin,
    'client_matches',  v_client_matches,
    'heir_matches',    v_heir_matches,
    'total_matches',   v_total,
    'outcome',         CASE WHEN v_total = 0 THEN 'clear' ELSE 'flagged' END
  );
END;
$$;

-- Grant execute to authenticated users only
REVOKE ALL ON FUNCTION run_conflict_check(text, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION run_conflict_check(text, text) TO authenticated;
```

### 2.4 TypeScript Types

```typescript
// types/conflictCheck.ts

export interface ClientMatch {
  match_type:   'client'
  client_id:    string
  name:         string
  status:       'prospect' | 'active' | 'inactive' | 'former'
  tin:          string | null
  intake_date:  string   // "Feb 01, 2026"
  similarity:   number   // 0.00 – 1.00
}

export interface HeirMatch {
  match_type:        'heir'
  case_id:           string
  case_title:        string
  decedent_name:     string
  heir_name:         string
  heir_relationship: string  // "child", "surviving_spouse", "parent", etc.
  case_status:       string
  similarity:        number  // 0.00 – 1.00
}

export interface ConflictCheckResult {
  checked_name:    string
  checked_tin:     string | null
  client_matches:  ClientMatch[]
  heir_matches:    HeirMatch[]
  total_matches:   number
  outcome:         'clear' | 'flagged'
}

export interface ConflictCheckLogEntry {
  id:            string
  user_id:       string
  client_id:     string | null
  checked_name:  string
  checked_tin:   string | null
  result_json:   ConflictCheckResult
  match_count:   number
  outcome:       'clear' | 'flagged' | 'cleared_after_review' | 'skipped'
  outcome_notes: string | null
  checked_at:    string
}
```

---

## 3. UI Design

### 3.1 Routes and Trigger Points

The conflict check is a modal/step rather than a standalone route. It is triggered from
three locations:

| Trigger | Where | Behavior |
|---------|-------|----------|
| "New Client" button on `/clients` | Step 0 before the new client form | Full-page step (not modal — form is complex) |
| "Re-run Conflict Check" on `/clients/:id` | Client detail page | Opens conflict check dialog; updates client record |
| "Check Conflict" in case editor client picker | `/cases/:id` | Inline dialog before linking a client |

### 3.2 Step 0: Pre-Intake Conflict Check Screen

Displayed as the first step when navigating to `/clients/new`. The URL stays
`/clients/new?step=conflict-check`. On CLEAR or skip, the URL advances to
`/clients/new?step=details`.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Clients          New Client — Step 1 of 2: Conflict Check             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Screen for conflicts of interest before accepting this matter.          │
│  Required under Canon III, Section 14 of the 2023 CPRA.                 │
│                                                                          │
│  Prospective client name *                                               │
│  [____________________________________________]                          │
│  Enter name as it will appear on government ID                           │
│                                                                          │
│  TIN (optional — enables exact-match check)                              │
│  [___-___-___]                                                           │
│                                                                          │
│  [  Run Conflict Check  ]                                                │
│  (requires min. 2 characters in name field)                              │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  [Skip — Create Client Without Check]                                    │
│  Skipping will mark this client as conflict not cleared.                 │
│  You can run the check later from the client detail page.                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Step navigation:**
```
[1: Conflict Check] ──► [2: Client Details]
```

### 3.3 Result: CLEAR (0 matches)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Clients          New Client — Step 1 of 2: Conflict Check             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ✓  No conflicts found for "Pedro Santos Reyes"                          │
│                                                                          │
│  Searched 14 existing clients and 52 heirs across 9 cases.              │
│  No name or TIN matches found above the 35% similarity threshold.       │
│                                                                          │
│  This result will be recorded in the conflict check log.                 │
│                                                                          │
│                        [Continue to Client Details →]                   │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│  [← Search Again]   (go back and change the name if entered incorrectly) │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

On "Continue to Client Details":
- Save log entry: `outcome = 'clear'`, `match_count = 0`
- Pre-populate client form: `conflict_cleared = true`,
  `conflict_notes = 'Conflict check cleared on 2026-03-01: no matches found.'`
- Navigate to client details step

### 3.4 Result: FLAGGED (matches found)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Clients          New Client — Step 1 of 2: Conflict Check             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ⚠  3 potential conflict(s) found for "Pedro Santos"                     │
│                                                                          │
│  Review the matches below. Confirm there is no conflict before           │
│  creating this client. Your notes will be recorded.                      │
│                                                                          │
│  EXISTING CLIENTS ──────────────────────────────────────────────────    │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Pedro Santos dela Cruz                    Status: Active         │   │
│  │ Intake: Jan 10, 2026   TIN: 111-222-333   Match: 82%            │   │
│  │                                           [View Client ↗]        │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  HEIRS IN EXISTING CASES ───────────────────────────────────────────    │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Pedro Santos                                                     │   │
│  │ Heir in: Estate of Maria Santos (Case #CR-2025-001)  ● Active   │   │
│  │ Role: Legitimate child   Match: 91%                              │   │
│  │                                           [View Case ↗]          │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Pedro C. Santos                                                  │   │
│  │ Heir in: Estate of Ramon Cruz (Case #CR-2025-004)    ● Active   │   │
│  │ Role: Surviving spouse   Match: 71%                              │   │
│  │                                           [View Case ↗]          │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│  Conflict assessment notes *                                             │
│  [_________________________________________________________________]    │
│  [_________________________________________________________________]    │
│  Required: explain why this is not a conflict, or note consent obtained. │
│                                                                          │
│  [ ] I have reviewed these matches. There is no conflict of interest,    │
│      or I have obtained written consent from all affected parties.       │
│      (checkbox disabled until notes field is filled)                     │
│                                                                          │
│  [← Search Again]                      [Proceed to Client Details →]    │
│                                         (disabled until box is checked)  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

On "Proceed to Client Details" (after checkbox + notes):
- Save log entry: `outcome = 'cleared_after_review'`, `outcome_notes = attorney notes`
- Pre-populate client form: `conflict_cleared = true`, `conflict_notes = attorney notes`
- Navigate to client details step

### 3.5 Skip Flow

On "Skip — Create Client Without Check":
```
┌─────────────────────────────────────────────────────────────┐
│  Skip conflict check?                                        │
│                                                              │
│  Skipping will mark this client as "conflict not cleared."   │
│  You can run the check later from the client detail page.    │
│                                                              │
│  Reason for skipping (optional):                             │
│  [__________________________________________]                │
│                                                              │
│  [Cancel]                        [Skip Anyway]              │
└─────────────────────────────────────────────────────────────┘
```

On "Skip Anyway":
- Save log entry: `outcome = 'skipped'`, `outcome_notes = reason (if any)`
- Pre-populate client form: `conflict_cleared = false`, `conflict_notes = 'Check skipped: [reason]'`
- Navigate to client details step

### 3.6 Re-run from Client Detail Page

On client detail page (`/clients/:id`), in the INTAKE section:

```
│ INTAKE                                                                  │
│ Intake: Feb 1, 2026    Referred by: Atty. Cruz                         │
│ Conflict cleared: ✗  (Not cleared)  [Run Conflict Check]               │
```

OR when previously cleared:

```
│ Conflict cleared: ✓  (Cleared 2026-03-01)  [Re-run Check]             │
│ Notes: "Conflict check cleared: no matches found."                      │
```

Clicking "Run Conflict Check" or "Re-run Check" opens a dialog (modal) with the same
check UI, pre-filled with `client.full_name` and `client.tin`. On completion, updates
`clients.conflict_cleared` and `clients.conflict_notes` in place, and saves a new
`conflict_check_log` entry with the `client_id`.

### 3.7 Conflict Check History Panel

On client detail page, below the intake section — expandable:

```
│ CONFLICT CHECK LOG                              [▼ Show history]        │
│ ┌──────────────────────────────────────────────────────────────────┐   │
│ │ Mar 01, 2026   Searched: "Pedro Santos Reyes"   ✓ Clear          │   │
│ │ Feb 15, 2026   Searched: "Pedro Santos"         ⚠ 2 matches →   │   │
│ │                Cleared after review              "Not same person"│   │
│ └──────────────────────────────────────────────────────────────────┘   │
```

---

## 4. API / Data Layer

### 4.1 TypeScript API Functions

```typescript
// lib/api/conflictCheck.ts
import { supabase } from '@/lib/supabase'
import type { ConflictCheckResult, ConflictCheckLogEntry } from '@/types/conflictCheck'

// ── Run the conflict check (calls Postgres RPC) ─────────────────────────

export async function runConflictCheck(
  name: string,
  tin?: string
): Promise<{ result: ConflictCheckResult; error: Error | null }> {
  const { data, error } = await supabase.rpc('run_conflict_check', {
    p_name: name.trim(),
    p_tin:  tin?.trim() || null,
  })
  return { result: data as ConflictCheckResult, error: error as Error | null }
}

// ── Save conflict check log entry ───────────────────────────────────────

export async function saveConflictCheckLog(params: {
  clientId:     string | null
  checkedName:  string
  checkedTin:   string | null
  resultJson:   ConflictCheckResult
  outcome:      ConflictCheckLogEntry['outcome']
  outcomeNotes: string | null
}): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('conflict_check_log')
    .insert({
      client_id:     params.clientId,
      checked_name:  params.checkedName,
      checked_tin:   params.checkedTin,
      result_json:   params.resultJson,
      match_count:   params.resultJson.total_matches,
      outcome:       params.outcome,
      outcome_notes: params.outcomeNotes,
    })
  return { error: error as Error | null }
}

// ── Update client conflict fields after check ────────────────────────────

export async function updateClientConflictStatus(
  clientId: string,
  cleared: boolean,
  notes: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('clients')
    .update({
      conflict_cleared: cleared,
      conflict_notes:   notes,
      updated_at:       new Date().toISOString(),
    })
    .eq('id', clientId)
  return { error: error as Error | null }
}

// ── Fetch conflict check history for a client ────────────────────────────

export async function getConflictCheckLog(
  clientId: string
): Promise<{ logs: ConflictCheckLogEntry[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('conflict_check_log')
    .select('*')
    .eq('client_id', clientId)
    .order('checked_at', { ascending: false })
    .limit(20)
  return { logs: (data ?? []) as ConflictCheckLogEntry[], error: error as Error | null }
}
```

### 4.2 React Hook

```typescript
// hooks/useConflictCheck.ts
import { useState } from 'react'
import { runConflictCheck, saveConflictCheckLog, updateClientConflictStatus }
  from '@/lib/api/conflictCheck'
import type { ConflictCheckResult } from '@/types/conflictCheck'

export function useConflictCheck() {
  const [result, setResult]   = useState<ConflictCheckResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function check(name: string, tin?: string) {
    if (name.trim().length < 2) return
    setLoading(true)
    setError(null)
    const { result: r, error: e } = await runConflictCheck(name, tin)
    setLoading(false)
    if (e) { setError(e.message); return }
    setResult(r)
    return r
  }

  async function resolve(params: {
    clientId:     string | null
    outcome:      'clear' | 'cleared_after_review' | 'skipped'
    notes:        string
  }) {
    if (!result) return
    await saveConflictCheckLog({
      clientId:     params.clientId,
      checkedName:  result.checked_name,
      checkedTin:   result.checked_tin,
      resultJson:   result,
      outcome:      params.outcome,
      outcomeNotes: params.notes || null,
    })
    if (params.clientId) {
      await updateClientConflictStatus(
        params.clientId,
        params.outcome !== 'skipped',
        params.notes
      )
    }
  }

  function reset() {
    setResult(null)
    setError(null)
  }

  return { result, loading, error, check, resolve, reset }
}
```

### 4.3 Similarity Threshold Rationale

**Threshold: 0.35 (pg_trgm similarity score)**

| Threshold | Effect | Rationale |
|-----------|--------|-----------|
| 0.20 | Too many false positives | Common PH surnames (Santos, Reyes) would match nearly everything |
| 0.35 | Moderate — catches real near-matches | "Pedro Santos" matches "Pedro C. Santos" (0.71), "Pedro S. Reyes" (0.42) — both worth reviewing |
| 0.50 | Too strict — misses relevant matches | "Juan dela Cruz" vs. "Juan D. Cruz" (0.44) would be missed |
| 0.70 | Near-identical only | Would miss the conflict cases that actually matter |

The 0.35 threshold is intentionally broad. The attorney reviews all flagged results and
decides. False positives are annoying but acceptable. False negatives (missed real
conflicts) are a professional liability.

---

## 5. Integration Points

| Feature | Integration |
|---------|------------|
| **spec-client-profiles** | Reads/writes `clients.conflict_cleared` and `clients.conflict_notes`; conflict check step appears as Step 1 of `/clients/new` flow |
| **spec-auth-persistence** | Searches `cases.input_json` for heir names; all queries are RLS-scoped by `user_id` |
| **spec-intake-form** | Intake form flow: conflict check is always Step 1 (before decedent / family tree entry); intake form result maps to client record |
| **spec-bir-1801-integration** | No direct integration; conflict_cleared status visible in case header for situational awareness |
| **spec-multi-seat** | In firm mode, `run_conflict_check()` searches all cases belonging to the firm (replacing `user_id` filter with `firm_id`); all attorneys in the firm share one conflict pool — see spec-multi-seat for RLS changes |
| **spec-case-notes** | Conflict check log entries are not case notes; they are stored in `conflict_check_log`; however, a summary line ("Conflict check cleared — 2026-03-01") may optionally be added to case notes by the attorney |

---

## 6. Component Hierarchy

```
pages/
  NewClientPage
    ConflictCheckStep              ← Step 1: conflict check gate
      ConflictCheckForm            ← name + TIN inputs + "Run" button
      ConflictCheckResult
        ConflictClearBanner        ← shown when outcome = 'clear'
        ConflictFlaggedPanel       ← shown when outcome = 'flagged'
          ClientMatchCard[]        ← one per client match
          HeirMatchCard[]          ← one per heir match
          ConflictNotesInput       ← textarea for attorney notes
          ConflictAcknowledgement  ← checkbox (disabled until notes filled)
      ConflictSkipButton           ← opens skip confirmation dialog
      SkipConfirmDialog            ← reason input + Skip Anyway button
    ClientDetailsStep              ← Step 2: the actual client form

components/
  ConflictCheckDialog              ← re-run check from client detail page
    (same ConflictCheckForm + ConflictCheckResult + resolve logic)
  ConflictStatusBadge              ← shown in client list / detail
    ● Cleared (green)
    ⚠ Not Cleared (amber)
    ─ Not Checked (gray)
  ConflictCheckHistoryPanel        ← expandable log list on client detail
    ConflictLogRow[]
```

---

## 7. Edge Cases

### Common Philippine Surnames (High False-Positive Rate)

Santos, Reyes, Cruz, Garcia, Torres, Bautista, Ramos, Aquino, Gonzales, Lopez appear in
millions of Filipino families. A name like "Maria Santos" at 0.35 threshold will match
many clients.

**Mitigation:**
- Show similarity score prominently on each match card (e.g., "Match: 38%") so the
  attorney can quickly assess relevance
- Sort matches by score descending — highest-risk matches appear first
- TIN match is shown as a separate indicator: "⚡ TIN match" (more definitive than name)
- "Match: <40%" cards are styled with lower visual weight (muted border) vs. high-score
  matches (amber border)

### Empty Case Input (No Heirs Yet)

Cases where `input_json` is NULL or `family_tree.heirs` is empty (case created but wizard
not yet filled out) are safely skipped by the `COALESCE(... '[]'::jsonb)` in the RPC.

### Re-running Check on Existing Client

When re-run from client detail page:
- The RPC results may include the client themselves (if their name is in the search)
- Filter client-side: exclude matches where `client_id === currentClientId`
- This prevents self-match from being shown as a "conflict"

### pg_trgm Not Enabled

If `pg_trgm` extension is not enabled, `similarity()` will throw an error. The RPC
includes a guard:

```sql
-- At the top of the run_conflict_check function:
IF NOT EXISTS (
  SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'
) THEN
  RAISE EXCEPTION 'pg_trgm extension required. Enable with: CREATE EXTENSION pg_trgm;';
END IF;
```

In practice, Supabase enables pg_trgm by default. Include in migration script:
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### Case Finalization Guard

When a lawyer tries to finalize a case (set `status = 'finalized'`), if the linked
client has `conflict_cleared = FALSE`, show a non-blocking reminder:

```
┌────────────────────────────────────────────────────────────┐
│ ⚠ Conflict check not cleared                               │
│                                                            │
│ The linked client "Maria Reyes" has not had a conflict     │
│ check run, or it was skipped.                              │
│                                                            │
│ [Run Check Now]              [Finalize Anyway]             │
└────────────────────────────────────────────────────────────┘
```

This is a reminder, not a hard block. Attorneys who handle walk-ins or existing
relationships can override.

### No Auth (Anonymous Users)

Anonymous users cannot access `/clients` at all (RequireAuth guard from spec-client-profiles).
Conflict check is only accessible to authenticated users. No anonymous conflict check is
exposed.

### Similarity Score Boundary Cases

- Exact name match: similarity = 1.00 — always shown, styled with red border ("⚡ Exact match")
- TIN exact match with different name: shown regardless of name similarity, labeled
  "⚡ TIN match (name differs)"
- score ≥ 0.70: amber border, "High match"
- 0.50 ≤ score < 0.70: yellow border, "Moderate match"
- 0.35 ≤ score < 0.50: gray border, "Low match"

---

## 8. Dependencies

| Dependency | Reason |
|-----------|--------|
| **spec-client-profiles** | `clients.conflict_cleared`, `clients.conflict_notes` columns; client detail page (re-run trigger); `NewClientPage` step flow |
| **spec-auth-persistence** | `cases.input_json` JSONB column (heir search); `user_id` RLS pattern; Supabase client setup |
| **pg_trgm extension** | PostgreSQL trigram similarity for fuzzy name matching — enabled by default in Supabase |
| **shadcn/ui** | `Dialog` (re-run modal, skip confirm), `Badge` (match score), `Checkbox` (acknowledgement), `Textarea` (notes), `Button` |
| **react-hook-form** | ConflictCheckForm (name + TIN inputs + validation) |

**No new npm packages required.** All UI and form dependencies are already in the stack.

---

## 9. Acceptance Criteria

### Core Search

- [ ] Name input requires minimum 2 characters before "Run Conflict Check" button is enabled
- [ ] Search queries `clients` table with trigram similarity threshold 0.35
- [ ] Search queries heir names from `cases.input_json->'family_tree'->'heirs'` with threshold 0.35
- [ ] TIN provided → also runs exact match on `clients.tin`; TIN-matched results shown
      regardless of name similarity score
- [ ] Results returned in ≤ 2 seconds for databases with up to 200 clients and 500 cases
- [ ] RPC is SECURITY DEFINER and only returns rows belonging to `auth.uid()`

### CLEAR Result

- [ ] CLEAR banner shown when total_matches = 0
- [ ] Banner shows counts: "Searched X clients and Y heirs across Z cases"
- [ ] "Continue to Client Details" button saves log entry with `outcome = 'clear'`
- [ ] New client form pre-populates `conflict_cleared = true` and `conflict_notes =
      'Conflict check cleared on [date]: no matches found.'`

### FLAGGED Result

- [ ] FLAGGED panel shown when total_matches > 0
- [ ] Client matches displayed under "Existing Clients" section; heir matches under
      "Heirs in Existing Cases"
- [ ] Each client match shows: name, status, intake date, TIN (masked), similarity %,
      [View Client] link opening client detail in new tab
- [ ] Each heir match shows: heir name, case title, decedent name, relationship, case status,
      similarity %, [View Case] link opening case in new tab
- [ ] Matches sorted by similarity score descending within each section
- [ ] Similarity score badge styled: red (≥1.00), amber (≥0.70), yellow (≥0.50), gray (<0.50)
- [ ] TIN exact match labeled "⚡ TIN match"
- [ ] Notes textarea required — "Proceed" button disabled when notes is empty
- [ ] Acknowledgement checkbox disabled until notes textarea has ≥ 5 characters
- [ ] "Proceed to Client Details" enabled only after checkbox is checked
- [ ] On proceed: log entry saved with `outcome = 'cleared_after_review'`,
      `outcome_notes = attorney notes`
- [ ] New client form pre-populates `conflict_cleared = true`, `conflict_notes = attorney notes`

### Skip Flow

- [ ] "Skip" opens confirmation dialog with optional reason field
- [ ] On "Skip Anyway": log entry saved with `outcome = 'skipped'`
- [ ] New client form pre-populates `conflict_cleared = false`,
      `conflict_notes = 'Conflict check skipped.'` (or with reason if entered)

### Re-run from Client Detail

- [ ] Client detail page shows conflict status in INTAKE section:
      "✓ Cleared [date]" or "✗ Not Cleared" or "─ Not Checked"
- [ ] "Run Conflict Check" / "Re-run Check" button opens dialog
- [ ] Dialog pre-fills client's current `full_name` and `tin`
- [ ] On completion: `clients.conflict_cleared` and `clients.conflict_notes` updated
- [ ] New log entry saved with `client_id` set to the existing client's ID
- [ ] Self-match filtered: current client is not shown in their own conflict check results

### Log and History

- [ ] Every check run saves a `conflict_check_log` row
- [ ] Log row includes: checked_name, checked_tin, full result_json, match_count, outcome
- [ ] Client detail page shows collapsible conflict check history list
- [ ] History shows: date, searched name, outcome badge, notes (truncated to 80 chars)
- [ ] Log is user-scoped (RLS): user A cannot read user B's conflict logs

### Case Finalization Guard

- [ ] When finalizing a case with a linked client whose `conflict_cleared = false`, show
      reminder dialog with "Run Check Now" and "Finalize Anyway" options
- [ ] "Run Check Now" opens conflict check dialog; on completion, finalizes if cleared
- [ ] "Finalize Anyway" proceeds without changing conflict_cleared status

### Security & Access

- [ ] Anonymous users cannot access any conflict check UI or API
- [ ] `run_conflict_check()` RPC returns only data for the calling `auth.uid()`
- [ ] `conflict_check_log` RLS prevents cross-user access
- [ ] Service role key never used in client-side code

### Philippine-Specific

- [ ] Filipino name formatting: surname-first display ("Santos, Maria") respected in
      match display (heirs stored in input_json may use first-name-first; both orders
      match correctly because trigram similarity is order-independent)
- [ ] TIN input in conflict check search uses same `formatTIN()` auto-hyphen formatter
      from spec-client-profiles

---

## Sources

- `analysis/crm-law-firm-patterns.md` — conflict check workflows (§3 Stage 1, §7 Clio patterns), discovered feature rationale
- `analysis/spec-client-profiles.md` — `clients` table DDL (conflict_cleared, conflict_notes columns), client detail page layout
- `analysis/auth-persistence-patterns.md` — `cases.input_json` JSONB column, RLS policy patterns, user_id scoping
- [2023 Code of Professional Responsibility and Accountability (CPRA) — Supreme Court of the Philippines](https://sc.judiciary.gov.ph/the-code-of-professional-responsibility-and-accountability/)
- [Canon III Sections 13–17 — Duty of Fidelity to Clients and Avoidance of Conflict of Interest](https://sc.judiciary.gov.ph/the-code-of-professional-responsibility-and-accountability/)
- [pg_trgm — PostgreSQL trigram similarity documentation](https://www.postgresql.org/docs/current/pgtrgm.html)
- [Supabase — Using pg_trgm for fuzzy text search](https://supabase.com/docs/guides/database/full-text-search)
