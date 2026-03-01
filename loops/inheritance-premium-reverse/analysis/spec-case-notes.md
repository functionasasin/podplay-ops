# Spec: Case Notes & Annotations

**Aspect:** spec-case-notes
**Wave:** 2 — Per-Feature Specification
**Date:** 2026-03-01
**Reads:** spec-auth-persistence, codebase-audit
**Depends on:** spec-auth-persistence (completed)

---

## 1. Overview

A PH estate lawyer manages a case from initial client consultation through BIR filing and eventual distribution — a process that can span 12 to 24 months. During that time, countless small decisions, phone call notes, client instructions, and procedural reminders accumulate. Without a structured annotation system, these end up as sticky notes, WhatsApp messages, and scattered email threads.

Case notes provide a **chronological, timestamped annotation layer** attached to every saved case. Notes are plain working documents — internal to the lawyer — and are never shown in the public shared-link view. They support markdown formatting so a lawyer can write checklists, bold key facts, and structure multi-point reminders.

**Concrete use cases for PH estate lawyers:**
- `"Client called — confirmed DOD is **Jan 15, 2025**, not Jan 5. BIR deadline recalculated to Jan 15, 2026."`
- `"- [ ] Get PSA certified death certificate (₱365 each × 3 copies)\n- [ ] Secure TCT No. T-12345 from Makati RD"`
- `"BIR officer at Makati RDO (Atty. De Guzman) says to attach Schedule 1A for each RPT property."`
- `"Heir #3 (Carlos) contests the imputed donation of ₱500,000. Advise client of Art. 1062 implications."`
- `"Newspaper publication done: *Philippine Daily Inquirer*, Nov 3–24, 2025. Affidavit from publisher needed."`

**What lawyers get:**
- A timestamped notes feed on every saved case
- Markdown rendering (bold, italic, lists, task checkboxes, code)
- Notes survive across sessions — always visible when case is reopened
- Optional PDF section "Attorney Notes" for formal documentation
- Delete capability (no editing — append-only for audit integrity)
- Note count badge on case list view

**Why append-only (no editing):**
Legal practice demands an accurate record. Allowing silent edits to timestamped notes undermines the evidentiary value of the record. If a correction is needed, the lawyer deletes the old note and adds a corrected one — the correction itself becomes visible in the audit trail. This matches how law firms treat handwritten notes.

---

## 2. Data Model

### 2.1 DDL

The `case_notes` table was pre-specified in `spec-auth-persistence.md`. It is reproduced here for completeness, with no changes required:

```sql
-- ============================================================
-- Case Notes (per-case attorney annotations)
-- ============================================================
CREATE TABLE case_notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id    UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL
                   CHECK (char_length(content) BETWEEN 1 AND 10000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- No updated_at: notes are append-only (delete and recreate to correct)

ALTER TABLE case_notes ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_case_notes_case_id      ON case_notes(case_id);
CREATE INDEX idx_case_notes_user_id      ON case_notes(user_id);
CREATE INDEX idx_case_notes_case_created ON case_notes(case_id, created_at DESC);

-- RLS: owner sees/creates/deletes own notes only
CREATE POLICY "notes_select_own" ON case_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notes_insert_own" ON case_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notes_delete_own" ON case_notes
  FOR DELETE USING (auth.uid() = user_id);

-- No UPDATE policy — notes are immutable once written
```

**Constraint notes:**
- `content` must be 1–10,000 characters (prevents blank submissions and unreasonably large blobs)
- `ON DELETE CASCADE` on `case_id`: deleting a case removes all its notes
- `ON DELETE CASCADE` on `user_id`: deleting a user account removes all their notes

### 2.2 TypeScript Type

```typescript
// types/db.ts — add to existing type definitions

export interface CaseNoteRow {
  id: string
  case_id: string
  user_id: string
  content: string           // raw markdown string
  created_at: string        // ISO 8601 timestamp
}

// Partial type for list display (same fields — no heavy output_json)
export type CaseNoteListItem = CaseNoteRow
```

### 2.3 Relationship Diagram

```
auth.users
    │ (user_id FK)
    ▼
cases ──────────────────────────────────────► case_notes
  (id PK)          case_id FK, ON DELETE CASCADE
  │
  │ Notes are scoped to both a case AND a user.
  │ In multi-seat scenario (spec-multi-seat), a firm member
  │ can only see their own notes, not notes from other attorneys.
  │ (Shared notes across attorneys is a future enhancement.)
```

---

## 3. UI Design

### 3.1 Panel Location

The `CaseNotesPanel` lives **below the ActionsBar** in the Case Detail View (`/cases/:id`). It is always visible when the case is open and the user is authenticated.

The panel is **not shown**:
- In the anonymous calculator view (no `case_id` → no notes)
- In the shared read-only view (`/share/:token` → no notes — private to owner)
- In the print/PDF output unless explicitly included

### 3.2 Main Panel Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│  Case Notes                                          [3 notes]   │
│  ──────────────────────────────────────────────────────────────  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Add a note (supports **Markdown**)                         │  │
│  │                                                            │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│  Markdown supported · [Preview]                  [Add Note]      │
│                                                                  │
│  ── Today ─────────────────────────────────────────────────────  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 2:34 PM                                              [Delete]│ │
│  │                                                            │  │
│  │ Client called — confirmed DOD is **Jan 15, 2025**, not     │  │
│  │ January 5. Need to recalculate BIR deadline.               │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 10:05 AM                                             [Delete]│ │
│  │                                                            │  │
│  │ • Verify TIN of surviving spouse (Josefina)                │  │
│  │ • Get certified copy of TCT No. T-12345 from Makati RD     │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ── Feb 28, 2026 ──────────────────────────────────────────────  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 10:15 AM                                             [Delete]│ │
│  │                                                            │  │
│  │ Heir #3 (Carlos) contests the ₱500,000 donation            │  │
│  │ imputation. Advise client re: Art. 1062 NCC.               │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 3.3 Markdown Preview Toggle

When the note input textarea has content, a `[Preview]` button renders the markdown in a read-only div below the textarea. This allows the lawyer to verify formatting before posting.

```
┌───────────────────────────────────────────────┐
│ [Write] [Preview]                              │  ← tabs
├───────────────────────────────────────────────┤
│ **Important:** Client confirmed DOD is         │  ← rendered markdown
│ **January 15, 2025**.                          │
│                                               │
│ • Recalculate BIR deadline                    │
│ • Notify heirs by March 31                    │
└───────────────────────────────────────────────┘
```

Implemented via a simple `<Tabs>` component (shadcn Tabs already in use):
- "Write" tab: raw `<textarea>`
- "Preview" tab: `<ReactMarkdown>` rendering of current textarea value

### 3.4 Delete Confirmation Dialog

Clicking `[Delete]` on a note shows a confirmation dialog:

```
┌──────────────────────────────────────────────┐
│  Delete this note?                            │
│                                               │
│  "Client called — confirmed DOD is Jan 15..." │
│                                               │
│  This cannot be undone.                       │
│                                               │
│  [Cancel]                    [Delete Note]    │
└──────────────────────────────────────────────┘
```

- "Delete Note" button is destructive red (`variant="destructive"`)
- Note text is truncated at 100 chars in the dialog for context

### 3.5 Case List Badge (Dashboard)

On the Dashboard case card, a small notes count badge appears:

```
┌────────────────────────────────────────────────────────────────┐
│  Estate of Juan dela Cruz                           computed   │
│  Date of Death: 15 Jan 2025 · Estate: ₱12,500,000             │
│  3 notes · Last updated: 2 hours ago             [Open] [···] │
└────────────────────────────────────────────────────────────────┘
```

Notes count is a denormalized column on the `cases` table, updated by a Postgres trigger on `case_notes` insert/delete (see §4.3).

### 3.6 PDF "Include Notes" Toggle

In the ActionsBar, the "Export PDF" flow presents an options sheet before generating:

```
┌──────────────────────────────────────────────┐
│  Export PDF Options                           │
│  ─────────────────────────────────────────── │
│  ☑  Include computation log                  │
│  ☑  Include heir narratives                  │
│  ☐  Include attorney notes          ← toggle │
│                                               │
│                          [Cancel] [Export]    │
└──────────────────────────────────────────────┘
```

Off by default (notes are private working documents). When enabled, a "Attorney Notes" section is appended at the end of the PDF.

### 3.7 Component Hierarchy

```
CaseEditor (/cases/:id)
└── CaseNotesPanel
    ├── CaseNotesPanelHeader
    │   └── Note count badge
    ├── NoteInput
    │   ├── Tabs (Write | Preview)
    │   │   ├── [Write] textarea (shadcn Textarea)
    │   │   └── [Preview] ReactMarkdown render
    │   ├── Markdown hint link
    │   └── AddNoteButton
    └── NotesFeed
        ├── DateGroupHeader (per unique date)
        └── NoteCard (one per note, desc order)
            ├── NoteTimestamp (time only, tooltip with full datetime)
            ├── NoteContent (ReactMarkdown)
            └── DeleteNoteButton → DeleteNoteDialog
```

---

## 4. API / Data Layer

### 4.1 Notes CRUD Functions

```typescript
// lib/notes.ts
import { supabase } from './supabase'
import type { CaseNoteRow } from '@/types/db'

// CREATE — called when lawyer clicks "Add Note"
export async function addNote(
  caseId: string,
  userId: string,
  content: string
): Promise<CaseNoteRow> {
  const trimmed = content.trim()
  if (trimmed.length === 0) throw new Error('Note content cannot be empty')
  if (trimmed.length > 10_000) throw new Error('Note exceeds 10,000 character limit')

  const { data, error } = await supabase
    .from('case_notes')
    .insert({ case_id: caseId, user_id: userId, content: trimmed })
    .select()
    .single()

  if (error) throw error
  return data as CaseNoteRow
}

// READ — load all notes for a case (desc order: newest first)
export async function listNotes(caseId: string): Promise<CaseNoteRow[]> {
  const { data, error } = await supabase
    .from('case_notes')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as CaseNoteRow[]
}

// DELETE — called when lawyer confirms delete dialog
export async function deleteNote(noteId: string): Promise<void> {
  const { error } = await supabase
    .from('case_notes')
    .delete()
    .eq('id', noteId)

  if (error) throw error
}
```

### 4.2 Notes Hook

```typescript
// hooks/useCaseNotes.ts
import { useState, useEffect, useCallback } from 'react'
import { addNote, listNotes, deleteNote } from '@/lib/notes'
import type { CaseNoteRow } from '@/types/db'

export function useCaseNotes(caseId: string | null, userId: string | null) {
  const [notes, setNotes] = useState<CaseNoteRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load notes on mount / caseId change
  useEffect(() => {
    if (!caseId || !userId) return
    setLoading(true)
    listNotes(caseId)
      .then(setNotes)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [caseId, userId])

  // Optimistic add
  const add = useCallback(async (content: string): Promise<void> => {
    if (!caseId || !userId) return
    const optimistic: CaseNoteRow = {
      id: `optimistic-${Date.now()}`,
      case_id: caseId,
      user_id: userId,
      content,
      created_at: new Date().toISOString()
    }
    setNotes(prev => [optimistic, ...prev])
    try {
      const persisted = await addNote(caseId, userId, content)
      // Replace optimistic entry with real one
      setNotes(prev => prev.map(n => n.id === optimistic.id ? persisted : n))
    } catch (e: unknown) {
      // Rollback on failure
      setNotes(prev => prev.filter(n => n.id !== optimistic.id))
      setError(e instanceof Error ? e.message : 'Failed to save note')
    }
  }, [caseId, userId])

  // Optimistic delete
  const remove = useCallback(async (noteId: string): Promise<void> => {
    const snapshot = notes
    setNotes(prev => prev.filter(n => n.id !== noteId))
    try {
      await deleteNote(noteId)
    } catch (e: unknown) {
      setNotes(snapshot)  // Rollback
      setError(e instanceof Error ? e.message : 'Failed to delete note')
    }
  }, [notes])

  return { notes, loading, error, add, remove }
}
```

### 4.3 Notes Count Denormalization

To avoid a JOIN or subquery on every dashboard page load, the `cases` table tracks a `notes_count` column updated by a trigger:

```sql
-- Add column to cases (migration addendum to 001_initial_schema.sql)
ALTER TABLE cases ADD COLUMN notes_count INTEGER NOT NULL DEFAULT 0;

-- Trigger function: keep cases.notes_count synchronized
CREATE OR REPLACE FUNCTION sync_notes_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE cases SET notes_count = notes_count + 1 WHERE id = NEW.case_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE cases SET notes_count = GREATEST(notes_count - 1, 0) WHERE id = OLD.case_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER case_notes_count_sync
  AFTER INSERT OR DELETE ON case_notes
  FOR EACH ROW EXECUTE FUNCTION sync_notes_count();
```

**Why not use a COUNT subquery?**
Dashboard queries load up to 50 cases per page. A subquery for notes count per case adds 50 extra COUNT queries or a slow LATERAL JOIN. The trigger-maintained column is O(1) per insert/delete and O(1) per read.

### 4.4 PDF Notes Section (Integration Contract)

The `generatePdf()` function in `spec-pdf-export` accepts an optional `notes` parameter:

```typescript
// types/pdf.ts — extend existing PdfOptions type
export interface PdfOptions {
  includedSections: {
    computationLog: boolean
    narratives: boolean
    warnings: boolean
    caseNotes: boolean   // NEW — added by spec-case-notes
  }
  firmProfile: FirmProfile | null
}

// generatePdf signature update
export function generatePdf(
  input: EngineInput,
  output: EngineOutput,
  options: PdfOptions,
  notes?: CaseNoteRow[]   // NEW — passed only if includedSections.caseNotes = true
): Promise<Uint8Array>
```

**PDF notes section layout (described for spec-pdf-export implementer):**

```
ATTORNEY NOTES
─────────────────────────────────────────────────────────
[Mar 1, 2026, 2:34 PM]
Client called — confirmed DOD is January 15, 2025, not
January 5. Need to recalculate BIR deadline.

[Mar 1, 2026, 10:05 AM]
• Verify TIN of surviving spouse (Josefina)
• Get certified copy of TCT No. T-12345 from Makati RD

[Feb 28, 2026, 10:15 AM]
Heir #3 (Carlos) contests the ₱500,000 donation
imputation. Advise client re: Art. 1062 NCC.
─────────────────────────────────────────────────────────
Notes are private attorney working documents.
```

**Markdown in PDF:**
`@react-pdf/renderer` does not support HTML or markdown natively. Notes content is converted before passing to PDF:

```typescript
// lib/markdownToPdfNodes.ts
// Converts markdown to @react-pdf/renderer <Text> children
// Supported: bold (**text**), italic (*text*), bullet lists (- item)
// Unsupported (rendered as-is): tables, code blocks, checkboxes

export function markdownToPdfText(markdown: string): string {
  // MVP: strip markdown markers → plain text
  // Bold: **text** → text
  // Italic: *text* → text
  // Links: [text](url) → text (url)
  // Headings: ## text → TEXT
  return markdown
    .replace(/\*\*(.+?)\*\*/g, '$1')       // bold → plain
    .replace(/\*(.+?)\*/g, '$1')            // italic → plain
    .replace(/\[(.+?)\]\((.+?)\)/g, '$1 ($2)')  // link → text (url)
    .replace(/^#{1,6}\s+/gm, '')            // remove heading markers
    .replace(/^[-*+] /gm, '• ')             // bullets → •
    .trim()
}
```

A future enhancement can render bold/italic via `@react-pdf/renderer`'s `fontWeight`/`fontStyle`, but plain text is acceptable for the MVP.

---

## 5. Integration Points

### 5.1 CaseEditor (Case Detail View)

The `CaseNotesPanel` is added below the `ActionsBar` in the case detail view:

```typescript
// pages/CaseEditor.tsx — modified to include notes panel
function CaseEditor({ caseId }: { caseId: string }) {
  const { user } = useAuth()
  const { notes, loading, add, remove } = useCaseNotes(caseId, user?.id ?? null)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <ResultsView
        input={caseData.input_json}
        output={caseData.output_json}
        onEditInput={handleEdit}
      />
      <CaseNotesPanel
        notes={notes}
        loading={loading}
        onAdd={add}
        onDelete={remove}
      />
    </div>
  )
}
```

### 5.2 PDF Export (spec-pdf-export)

When "Export PDF" is triggered from `ActionsBar` on a saved case, the options sheet asks whether to include notes. If yes:
1. Fetch notes from Supabase (`listNotes(caseId)`)
2. Pass `notes` array to `generatePdf(input, output, { ...options, includedSections: { caseNotes: true } }, notes)`
3. Notes section appended after computation log in PDF output

### 5.3 Dashboard Case List (spec-auth-persistence)

The `CaseListItem` type is extended with `notes_count`:

```typescript
// types/db.ts — extend CaseListItem
export interface CaseListItem {
  id: string
  title: string
  decedent_name: string | null
  date_of_death: string | null
  gross_estate: number | null
  status: CaseRow['status']
  updated_at: string
  client_id: string | null
  notes_count: number          // NEW — added by spec-case-notes
}
```

The dashboard query already uses a partial select — add `notes_count` to the select list:

```typescript
const { data } = await supabase
  .from('cases')
  .select('id, title, decedent_name, date_of_death, gross_estate, status, updated_at, client_id, notes_count')
  // ...
```

### 5.4 Shared Read-Only View (spec-shareable-links)

The shared case view (`/share/:token`) renders the `ResultsView` only. It **does not** fetch or render `case_notes`. The RLS policy on `case_notes` already ensures unauthenticated requests are blocked:

```sql
-- No public SELECT policy on case_notes
-- Unauthenticated reads return empty result (no error, no data)
```

### 5.5 Multi-Seat (spec-multi-seat — future)

In the current spec, notes are **private to the user who created them** (`user_id` scoped RLS). When firm accounts are implemented:
- Option A: Keep notes private per-attorney (each member sees only their own notes)
- Option B: Share notes across all firm members who have access to the case

Option B requires adding a `visible_to_firm BOOLEAN DEFAULT TRUE` column and updating RLS. This is deferred to `spec-multi-seat`.

---

## 6. Edge Cases

### 6.1 Input Validation

| Scenario | Handling |
|----------|----------|
| Blank/whitespace-only note | "Add Note" button disabled; client-side guard; DB `CHECK` constraint as backup |
| Note exceeds 10,000 chars | Character counter shown below textarea (green → yellow at 8,000 → red at 10,000); button disabled at limit |
| Paste of 100,000 chars | Textarea `maxLength={10000}` attribute prevents pasting beyond limit |
| HTML in note content | `react-markdown` with `rehype-sanitize` strips dangerous HTML before rendering (XSS prevention) |
| Note with only markdown symbols (e.g., `***`) | Renders as empty — allowed, no validation needed |

### 6.2 State Edge Cases

| Scenario | Handling |
|----------|----------|
| Case not yet saved (no `case_id`) | `CaseNotesPanel` not rendered; notes are only for persisted cases |
| Case is finalized | Notes still allowed — annotations don't change computation, only the output data is locked |
| Case is archived | Notes panel shown as read-only (no add/delete) — archived cases are closed records |
| Draft case with no `output_json` | Notes panel shown — lawyer may add notes before running computation |
| User deletes account | `ON DELETE CASCADE` on `user_id` FK removes all notes automatically |
| Case deleted from dashboard | `ON DELETE CASCADE` on `case_id` FK removes all notes automatically |

### 6.3 Network & Async Edge Cases

| Scenario | Handling |
|----------|----------|
| Add note fails (network error) | Optimistic entry rolled back; red toast: "Failed to save note. Try again." |
| Delete note fails (network error) | Note restored to list; red toast: "Failed to delete note. Try again." |
| Notes load fails | Error message in panel: "Could not load notes. [Retry]" |
| Slow connection — add note takes >2s | Optimistic entry shows immediately; no spinner needed; persisted silently |
| Two browser tabs open on same case | Each tab independently fetches notes on load; no real-time sync in MVP. If Tab A adds a note, Tab B does not update until refresh. (Acceptable for solo user model.) |

### 6.4 Display Edge Cases

| Scenario | Handling |
|----------|----------|
| No notes yet | Empty state: illustrated icon + "No notes yet. Add your first annotation above." |
| Single note | No date group header needed (just the note card) |
| 100+ notes | Virtual scrolling not required (notes panel is not paginated in MVP; list grows vertically); consider pagination at >50 notes in future |
| Note with very long unbroken URL | CSS `word-break: break-all` on note content container |
| Note created exactly at midnight | Displayed in the earlier date group (UTC+8 Philippine time used for grouping) |

### 6.5 Timezone Handling

All timestamps are stored as UTC in PostgreSQL. The frontend converts to **Philippine Standard Time (UTC+8)** for display:

```typescript
// lib/formatters.ts
export function formatNoteTime(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleTimeString('en-PH', {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
  // Returns: "2:34 PM"
}

export function formatNoteDateGroup(iso: string): string {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const dateStr = date.toLocaleDateString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })

  const isToday = date.toDateString() === today.toDateString()
  const isYesterday = date.toDateString() === yesterday.toDateString()

  if (isToday) return 'Today'
  if (isYesterday) return 'Yesterday'
  return dateStr   // "Mar 1, 2026"
}
```

### 6.6 Permissions Matrix

| Action | Permission |
|--------|------------|
| View notes | Requires auth + case ownership |
| Add note | Requires auth + case ownership + case NOT archived |
| Delete own note | Requires auth + note ownership (user_id match) |
| Delete another user's note | Blocked by RLS (`user_id` policy) |
| View notes in shared link | Blocked — notes never shown in shared view |
| Include notes in PDF | Opt-in — lawyer explicitly toggles on |

---

## 7. Dependencies

### 7.1 Must Be Built First

- **spec-auth-persistence** ✅ (completed) — provides `cases` table, `case_id`, `user_id`, `useAuth()` hook, Supabase client

### 7.2 New npm Packages Required

```bash
npm install react-markdown remark-gfm rehype-sanitize
```

| Package | Version | Purpose |
|---------|---------|---------|
| `react-markdown` | ^9.0.0 | Render markdown in note feed and preview |
| `remark-gfm` | ^4.0.0 | GitHub Flavored Markdown (tables, checkboxes, strikethrough) |
| `rehype-sanitize` | ^6.0.0 | Strip dangerous HTML from markdown (XSS prevention) |

Note: `react-markdown` v9 is ESM-only and compatible with Vite.

### 7.3 Database Migration

Run as migration `002_case_notes_count.sql` (following `001_initial_schema.sql` from spec-auth-persistence):

```sql
-- Migration 002: Add notes_count to cases, add trigger
ALTER TABLE cases ADD COLUMN IF NOT EXISTS notes_count INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION sync_notes_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE cases SET notes_count = notes_count + 1 WHERE id = NEW.case_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE cases SET notes_count = GREATEST(notes_count - 1, 0) WHERE id = OLD.case_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER case_notes_count_sync
  AFTER INSERT OR DELETE ON case_notes
  FOR EACH ROW EXECUTE FUNCTION sync_notes_count();

-- Backfill existing rows (if any)
UPDATE cases c
SET notes_count = (
  SELECT COUNT(*) FROM case_notes n WHERE n.case_id = c.id
);
```

---

## 8. Acceptance Criteria

### Notes CRUD
- [ ] Authenticated user sees `CaseNotesPanel` below `ActionsBar` on any saved case page
- [ ] Unauthenticated user does not see `CaseNotesPanel` (panel is not rendered)
- [ ] Textarea is focused when the panel loads (good UX for quick note-taking)
- [ ] "Add Note" button is disabled when textarea is empty or whitespace-only
- [ ] Clicking "Add Note" with valid content appends note to feed immediately (optimistic) and saves to Supabase
- [ ] Saved note persists across page refreshes and browser restarts
- [ ] Failed save rolls back optimistic note and shows error toast
- [ ] Character count displayed; red at 10,000 chars; button disabled at limit
- [ ] Delete button on a note opens confirmation dialog showing truncated note content
- [ ] Confirming delete removes note from feed immediately (optimistic) and deletes from Supabase
- [ ] Failed delete restores the note and shows error toast

### Markdown
- [ ] Notes render markdown: `**bold**`, `*italic*`, `- lists`, `1. numbered`, `` `code` ``
- [ ] GFM task checkboxes (`- [ ]` and `- [x]`) render as checkboxes (visual only — not interactive in notes view)
- [ ] `[Preview]` tab renders current textarea content as markdown before posting
- [ ] Markdown with raw HTML tags (e.g., `<script>`) is sanitized — no XSS possible
- [ ] Very long URLs in notes wrap correctly and do not overflow the card

### Date Grouping & Timestamps
- [ ] Notes sorted newest-first within each date group
- [ ] Date group headers show "Today", "Yesterday", or "MMM D, YYYY" in Philippine time (UTC+8)
- [ ] Each note shows time in Philippine Standard Time (e.g., "2:34 PM")
- [ ] Tooltip on timestamp shows full datetime: "March 1, 2026, 2:34:10 PM (PST)"

### Dashboard Integration
- [ ] Case card on Dashboard shows "3 notes" badge when case has notes
- [ ] "0 notes" is not shown (badge hidden when count is zero)
- [ ] `notes_count` updates correctly after add/delete (via DB trigger)

### Shared Link
- [ ] Notes are NOT visible on the shared read-only case view (`/share/:token`)
- [ ] No `case_notes` data is loaded or transmitted when viewing a shared case

### PDF Integration
- [ ] "Export PDF" options sheet includes "Include attorney notes" toggle (default OFF)
- [ ] When toggle is OFF: generated PDF contains no notes section
- [ ] When toggle is ON: generated PDF contains "ATTORNEY NOTES" section with all notes, timestamps, and plain-text content
- [ ] Markdown formatting is converted to plain text in PDF (bold/italic stripped, bullets preserved)

### Archived Cases
- [ ] Notes panel is visible on archived cases but in read-only mode (no add/delete)
- [ ] Visual indicator: "This case is archived — notes are read-only"

### Empty State
- [ ] When case has no notes: empty state shown with hint text "No notes yet. Add your first annotation above."
- [ ] Empty state is replaced by the notes feed as soon as first note is added

---

## 9. File Changes Required

| File | Change |
|------|--------|
| `package.json` | Add `react-markdown`, `remark-gfm`, `rehype-sanitize` |
| `src/lib/notes.ts` | NEW — `addNote()`, `listNotes()`, `deleteNote()` |
| `src/lib/formatters.ts` | MODIFY — add `formatNoteTime()`, `formatNoteDateGroup()` |
| `src/lib/markdownToPdfText.ts` | NEW — strip markdown for PDF rendering |
| `src/hooks/useCaseNotes.ts` | NEW — notes CRUD hook with optimistic updates |
| `src/types/db.ts` | MODIFY — add `CaseNoteRow` type, add `notes_count` to `CaseListItem` |
| `src/types/pdf.ts` | MODIFY — extend `PdfOptions.includedSections` with `caseNotes: boolean` |
| `src/components/CaseNotesPanel.tsx` | NEW — main panel component |
| `src/components/NoteCard.tsx` | NEW — single note display with timestamp, markdown, delete |
| `src/components/NoteInput.tsx` | NEW — textarea with write/preview tabs and add button |
| `src/components/DeleteNoteDialog.tsx` | NEW — confirmation dialog for deletion |
| `src/pages/CaseEditor.tsx` | MODIFY — add `<CaseNotesPanel>` below `<ResultsView>` |
| `src/pages/Dashboard.tsx` | MODIFY — add notes count to `CaseListItem` display |
| `supabase/migrations/002_case_notes_count.sql` | NEW — add `notes_count` column + trigger |
