# Computation Management — TaxKlaro

**Wave:** 4 (Platform Layer)
**Status:** COMPLETE
**Date:** 2026-03-06
**Depends on:** supabase-migrations, frontend-state-management, typescript-types, route-table

---

## Summary

Computations are the core entity of TaxKlaro — the equivalent of "cases" in the inheritance app. This document specifies all CRUD operations, status workflow, auto-save pattern, ComputationCard component, and the list/detail page data flow. Modeled after `apps/inheritance/frontend/src/lib/cases.ts` and `hooks/useAutoSave.ts`.

---

## 1. Database Reference

Computations are stored in the `computations` table (defined in `supabase/migrations/001_initial_schema.sql`):

```
computations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  client_id        UUID REFERENCES clients(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,
  status           computation_status NOT NULL DEFAULT 'draft',
  input_json       JSONB,        -- TaxpayerInput (camelCase fields)
  output_json      JSONB,        -- TaxComputationResult (camelCase fields)
  tax_year         INTEGER,      -- e.g. 2024
  regime_selected  TEXT,         -- e.g. 'PATH_A_OSD_GRADUATED'
  share_token      UUID NOT NULL DEFAULT gen_random_uuid(),
  share_enabled    BOOLEAN NOT NULL DEFAULT false,
  notes_count      INTEGER NOT NULL DEFAULT 0,
  deleted_at       TIMESTAMPTZ,  -- NULL = active, set = soft-deleted
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
)
```

---

## 2. Status Workflow

```
draft -> computed -> finalized -> archived
  ^                              |
  |____________ restore ________|  (archived -> draft, admin only)
```

| Status | Meaning | Allowed Transitions |
|--------|---------|---------------------|
| `draft` | Input in progress, no output yet | -> `computed` (after WASM compute) |
| `computed` | Output available, still editable | -> `finalized`, -> `draft` (re-edit) |
| `finalized` | Locked for editing, ready for filing | -> `archived`, -> `computed` (unlock) |
| `archived` | Soft-hidden from default list view | -> `draft` (admin only) |

**Status rules:**
- Re-editing inputs on a `computed` computation automatically transitions it back to `draft` (output cleared on save)
- `finalized` computations show a "Locked" badge; editing requires explicit "Unlock" click
- `archived` computations excluded from default list query (show only when `?status=archived` filter active)

**TypeScript status type** (from `types/common.ts`):
```typescript
export const COMPUTATION_STATUSES = ['draft', 'computed', 'finalized', 'archived'] as const;
export type ComputationStatus = typeof COMPUTATION_STATUSES[number];

export const VALID_STATUS_TRANSITIONS: Record<ComputationStatus, ComputationStatus[]> = {
  draft:     ['computed'],
  computed:  ['finalized', 'draft'],
  finalized: ['archived', 'computed'],
  archived:  ['draft'],
};
```

---

## 3. TypeScript Types

```typescript
// src/types/computation.ts

import type { TaxpayerInput, TaxComputationResult } from './engine-types';
import type { ComputationStatus } from './common';

/** Full row returned from Supabase — all columns */
export interface ComputationRow {
  id: string;
  orgId: string;
  userId: string;
  clientId: string | null;
  title: string;
  status: ComputationStatus;
  inputJson: TaxpayerInput | null;
  outputJson: TaxComputationResult | null;
  taxYear: number | null;
  regimeSelected: string | null;
  shareToken: string;      // UUID as string from Supabase
  shareEnabled: boolean;
  notesCount: number;
  deletedAt: string | null; // ISO datetime
  createdAt: string;        // ISO datetime
  updatedAt: string;        // ISO datetime
}

/** Minimal shape for list view — selected columns only (not full JSONB) */
export interface ComputationListItem {
  id: string;
  title: string;
  status: ComputationStatus;
  taxYear: number | null;
  regimeSelected: string | null;
  clientId: string | null;
  notesCount: number;
  shareEnabled: boolean;
  updatedAt: string;  // ISO datetime
}

/** Note attached to a computation */
export interface ComputationNote {
  id: string;
  computationId: string;
  userId: string;
  content: string;
  createdAt: string;
}

/** Deadline derived from a computation */
export interface ComputationDeadline {
  id: string;
  computationId: string;
  milestoneKey: string;   // e.g. 'Q1_PAYMENT', 'ANNUAL_FILING'
  label: string;          // human-readable
  dueDate: string;        // ISO date "YYYY-MM-DD"
  completedDate: string | null;
  createdAt: string;
}
```

**Supabase column naming note:** Supabase returns columns in snake_case from the DB. When selecting with `.select('*')` the JS client returns camelCase keys if using the auto-generated types, but with raw queries returns snake_case. **Use explicit column aliases in select() or rely on the generated DB types.** In TaxKlaro, all Supabase selects use the auto-generated DB type client (from `supabase gen types typescript`), so column names come back as-is (snake_case). Map to camelCase immediately via a `mapComputation()` helper:

```typescript
// src/lib/computations.ts — mapping helper

function mapComputation(row: Database['public']['Tables']['computations']['Row']): ComputationRow {
  return {
    id:              row.id,
    orgId:           row.org_id,
    userId:          row.user_id,
    clientId:        row.client_id,
    title:           row.title,
    status:          row.status as ComputationStatus,
    inputJson:       row.input_json as TaxpayerInput | null,
    outputJson:      row.output_json as TaxComputationResult | null,
    taxYear:         row.tax_year,
    regimeSelected:  row.regime_selected,
    shareToken:      row.share_token,
    shareEnabled:    row.share_enabled,
    notesCount:      row.notes_count,
    deletedAt:       row.deleted_at,
    createdAt:       row.created_at,
    updatedAt:       row.updated_at,
  };
}

function mapComputationListItem(
  row: Pick<Database['public']['Tables']['computations']['Row'],
    'id' | 'title' | 'status' | 'tax_year' | 'regime_selected' | 'client_id' | 'notes_count' | 'share_enabled' | 'updated_at'>
): ComputationListItem {
  return {
    id:              row.id,
    title:           row.title,
    status:          row.status as ComputationStatus,
    taxYear:         row.tax_year,
    regimeSelected:  row.regime_selected,
    clientId:        row.client_id,
    notesCount:      row.notes_count,
    shareEnabled:    row.share_enabled,
    updatedAt:       row.updated_at,
  };
}
```

---

## 4. CRUD Operations — `src/lib/computations.ts`

```typescript
import { supabase } from './supabase';
import type { TaxpayerInput, TaxComputationResult } from '@/types/engine-types';
import type { ComputationRow, ComputationListItem, ComputationStatus } from '@/types/computation';
import { VALID_STATUS_TRANSITIONS } from '@/types/common';

// ===== TITLE GENERATION =====

/**
 * Auto-generate a title from the input data.
 * Falls back to "Untitled Computation" if no name available.
 */
function generateTitle(input: TaxpayerInput | null): string {
  if (!input) return 'Untitled Computation';
  const name = input.taxpayerName?.trim();
  const year = input.taxYear;
  if (name && year) return `${name} — AY ${year}`;
  if (name)         return `${name} — Tax Computation`;
  if (year)         return `AY ${year} — Tax Computation`;
  return 'Untitled Computation';
}

// ===== CREATE =====

export async function createComputation(
  userId: string,
  orgId: string,
  input: TaxpayerInput | null,
  clientId?: string,
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('computations')
    .insert({
      user_id:    userId,
      org_id:     orgId,
      client_id:  clientId ?? null,
      title:      generateTitle(input),
      status:     'draft',
      input_json: input,
      tax_year:   input?.taxYear ?? null,
    })
    .select('id')
    .single();

  if (error) throw error;
  return { id: data.id };
}

// ===== READ =====

export async function loadComputation(computationId: string): Promise<ComputationRow> {
  const { data, error } = await supabase
    .from('computations')
    .select('*')
    .eq('id', computationId)
    .is('deleted_at', null)
    .single();

  if (error) throw error;
  return mapComputation(data);
}

export async function listComputations(
  orgId: string,
  options?: {
    statusFilter?: ComputationStatus;
    clientId?: string;
    taxYear?: number;
    includeArchived?: boolean;
  }
): Promise<ComputationListItem[]> {
  let query = supabase
    .from('computations')
    .select('id, title, status, tax_year, regime_selected, client_id, notes_count, share_enabled, updated_at')
    .eq('org_id', orgId);

  // Exclude archived unless explicitly requested
  if (!options?.includeArchived) {
    query = query.neq('status', 'archived');
  }

  // Exclude soft-deleted
  query = query.is('deleted_at', null);

  if (options?.statusFilter) {
    query = query.eq('status', options.statusFilter);
  }
  if (options?.clientId) {
    query = query.eq('client_id', options.clientId);
  }
  if (options?.taxYear) {
    query = query.eq('tax_year', options.taxYear);
  }

  const { data, error } = await query.order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapComputationListItem);
}

// ===== UPDATE INPUT =====

/**
 * Save wizard input. If computation was 'computed', transitions back to 'draft'
 * and clears output (re-editing invalidates prior result).
 */
export async function updateComputationInput(
  computationId: string,
  input: TaxpayerInput,
  currentStatus: ComputationStatus,
): Promise<void> {
  const patch: Record<string, unknown> = {
    input_json: input,
    title:      generateTitle(input),
    tax_year:   input.taxYear ?? null,
  };

  // Re-editing a computed result resets to draft + clears output
  if (currentStatus === 'computed') {
    patch.status     = 'draft';
    patch.output_json = null;
    patch.regime_selected = null;
  }

  const { error } = await supabase
    .from('computations')
    .update(patch)
    .eq('id', computationId);

  if (error) throw error;
}

// ===== SAVE OUTPUT =====

/**
 * Save computation result. Transitions to 'computed' status.
 */
export async function saveComputationOutput(
  computationId: string,
  output: TaxComputationResult,
): Promise<void> {
  const { error } = await supabase
    .from('computations')
    .update({
      output_json:      output,
      status:           'computed',
      regime_selected:  output.recommendation?.recommendedPath ?? null,
    })
    .eq('id', computationId);

  if (error) throw error;
}

// ===== UPDATE STATUS =====

export function isValidStatusTransition(from: ComputationStatus, to: ComputationStatus): boolean {
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export async function updateComputationStatus(
  computationId: string,
  currentStatus: ComputationStatus,
  newStatus: ComputationStatus,
): Promise<void> {
  if (!isValidStatusTransition(currentStatus, newStatus)) {
    throw new Error(`Invalid status transition: ${currentStatus} -> ${newStatus}`);
  }

  const { error } = await supabase
    .from('computations')
    .update({ status: newStatus })
    .eq('id', computationId);

  if (error) throw error;
}

// ===== SOFT DELETE =====

/**
 * Soft delete: sets deleted_at timestamp. Excluded from all list queries.
 * Hard delete is not exposed in the UI — data retained for 90 days then purged by cron.
 */
export async function deleteComputation(computationId: string): Promise<void> {
  const { error } = await supabase
    .from('computations')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', computationId);

  if (error) throw error;
}

// ===== NOTES =====

export async function addComputationNote(
  computationId: string,
  userId: string,
  content: string,
): Promise<void> {
  // Validate content
  const trimmed = content.trim();
  if (!trimmed) throw new Error('Note content cannot be empty');
  if (trimmed.length > 2000) throw new Error('Note cannot exceed 2000 characters');

  const { error } = await supabase
    .from('computation_notes')
    .insert({ computation_id: computationId, user_id: userId, content: trimmed });

  if (error) throw error;

  // Increment notes_count on computation (denormalized for list performance)
  await supabase.rpc('increment_notes_count', { p_computation_id: computationId });
}

export async function listComputationNotes(computationId: string): Promise<ComputationNote[]> {
  const { data, error } = await supabase
    .from('computation_notes')
    .select('id, computation_id, user_id, content, created_at')
    .eq('computation_id', computationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(row => ({
    id:             row.id,
    computationId:  row.computation_id,
    userId:         row.user_id,
    content:        row.content,
    createdAt:      row.created_at,
  }));
}
```

**Additional RPC needed in `003_rpc_functions.sql`:**
```sql
-- Increment notes_count atomically to avoid race conditions
CREATE OR REPLACE FUNCTION increment_notes_count(p_computation_id UUID)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  UPDATE computations
  SET notes_count = notes_count + 1
  WHERE id = p_computation_id
    AND deleted_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION increment_notes_count(UUID) TO authenticated;
```

---

## 5. Auto-Save Hook — `src/hooks/useAutoSave.ts`

Exact pattern from `apps/inheritance/frontend/src/hooks/useAutoSave.ts`, adapted for TaxKlaro `TaxpayerInput` type:

```typescript
import { useState, useEffect, useRef, useCallback } from 'react';
import type { TaxpayerInput } from '@/types/engine-types';
import type { ComputationStatus } from '@/types/computation';
import type { AutoSaveStatus } from '@/types/wizard';
import { updateComputationInput } from '@/lib/computations';

const DEBOUNCE_MS = 1500;

export interface UseAutoSaveReturn {
  status: AutoSaveStatus;  // 'idle' | 'saving' | 'saved' | 'error'
  triggerSave: () => void; // manual save (e.g., on "Continue" click)
}

export function useAutoSave(
  computationId: string | null,
  input: TaxpayerInput,
  currentStatus: ComputationStatus,
): UseAutoSaveReturn {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevInputRef = useRef<TaxpayerInput>(input);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const doSave = useCallback(async () => {
    if (!computationId) return;
    setStatus('saving');
    try {
      await updateComputationInput(computationId, input, currentStatus);
      if (mountedRef.current) setStatus('saved');
    } catch {
      if (mountedRef.current) setStatus('error');
    }
  }, [computationId, input, currentStatus]);

  useEffect(() => {
    if (!computationId) return;
    if (prevInputRef.current === input) return;
    prevInputRef.current = input;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(doSave, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [computationId, input, doSave]);

  return { status, triggerSave: doSave };
}
```

**Auto-save status indicator** — displayed in wizard header and computation page header:
```typescript
// src/components/shared/AutoSaveIndicator.tsx
// Props: status: AutoSaveStatus
// Renders:
//   idle:   nothing (blank)
//   saving: "Saving..." (muted text, Loader2 icon spinning)
//   saved:  "Saved" (muted text, Check icon, fades out after 3s)
//   error:  "Save failed" (destructive text, AlertCircle icon, with retry button)
```

---

## 6. useCompute Hook — `src/hooks/useCompute.ts`

Handles the WASM computation lifecycle:

```typescript
import { useState, useCallback } from 'react';
import { compute } from '@/wasm/bridge';
import type { TaxpayerInput, TaxComputationResult } from '@/types/engine-types';
import type { ComputeStatus } from '@/types/wizard';

export interface UseComputeReturn {
  status: ComputeStatus;  // 'idle' | 'computing' | 'ready' | 'error'
  result: TaxComputationResult | null;
  error: string | null;
  runCompute: (input: TaxpayerInput) => Promise<void>;
}

export function useCompute(): UseComputeReturn {
  const [status, setStatus] = useState<ComputeStatus>('idle');
  const [result, setResult] = useState<TaxComputationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runCompute = useCallback(async (input: TaxpayerInput) => {
    setStatus('computing');
    setError(null);
    try {
      const output = await compute(input);
      setResult(output);
      setStatus('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Computation failed');
      setStatus('error');
    }
  }, []);

  return { status, result, error, runCompute };
}
```

---

## 7. Computation List Page — `src/routes/computations/index.tsx`

### Data loading

```typescript
// beforeLoad: verifies auth (throws redirect to /auth if no user)
// loader: loads computations list for the org

export const Route = createFileRoute('/computations/')({
  beforeLoad: ({ context }) => {
    if (!context.auth.user) throw redirect({ to: '/auth' });
  },
  loader: async ({ context }) => {
    const orgId = context.org?.id;
    if (!orgId) throw redirect({ to: '/onboarding' });
    return await listComputations(orgId);
  },
  component: ComputationsPage,
});
```

### Component layout

```
ComputationsPage
├── PageHeader
│   ├── Title: "Computations"
│   └── Button: "New Computation" (Plus icon, navigates to /computations/new)
├── FilterBar (optional — tax year dropdown, status filter tabs)
│   ├── Tabs: All | Draft | Computed | Finalized
│   └── Select: Tax Year (2024 | 2023 | 2022 | All Years)
├── ComputationGrid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4)
│   ├── [for each computation] ComputationCard
│   └── EmptyState (if no computations)
└── LoadingSkeleton (during refetch)
```

### ComputationCard component — `src/components/computation/ComputationCard.tsx`

**Props:**
```typescript
interface ComputationCardProps {
  computation: ComputationListItem;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
}
```

**Visual spec:**
- **Wrapper:** `<Card>` (shadcn) with `cursor-pointer hover:shadow-md transition-shadow`
- **Click target:** entire card navigates to `/computations/{id}`
- **CardHeader:** title (truncated to 1 line), status `<Badge>` (see color map below)
- **CardContent:**
  - Tax year: "AY {year}" with Calendar icon, or "No tax year" muted
  - Regime: short label (e.g., "8% Flat Rate") or "Not computed" muted
  - Client: client name if linked, or blank
  - Updated: relative time (e.g., "3 hours ago") using `date-fns/formatDistanceToNow`
  - Notes: if `notesCount > 0`, show MessageSquare icon + count
- **CardFooter:** action menu via DropdownMenu (MoreHorizontal icon)
  - "View" (navigates to /computations/{id})
  - "Archive" (triggers onArchive — confirm dialog first)
  - "Delete" (triggers onDelete — confirm dialog with destructive variant)
  - Separator
  - "Share" (if status === 'computed' or 'finalized', toggles share)

**Status badge color map:**
| Status | Badge variant | Color |
|--------|--------------|-------|
| `draft` | `secondary` | Gray (#6B7280) |
| `computed` | `default` | Blue (#1D4ED8) |
| `finalized` | `success` | Green (#16A34A) |
| `archived` | `outline` | Muted gray |

**Tailwind classes (minimum required — anti-scaffolding check):**
```
<Card className="cursor-pointer hover:shadow-md transition-shadow flex flex-col">
  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
  <CardContent className="flex-1 space-y-2">
  <CardFooter className="pt-2 border-t">
```

---

## 8. Computation Detail Page — `src/routes/computations/$compId.tsx`

### Data loading

```typescript
export const Route = createFileRoute('/computations/$compId')({
  beforeLoad: ({ context }) => {
    if (!context.auth.user) throw redirect({ to: '/auth' });
  },
  loader: async ({ params }) => {
    return await loadComputation(params.compId);
  },
  errorComponent: ({ error }) => <ComputationNotFound error={error} />,
  component: ComputationPage,
});
```

### Component layout

```
ComputationPage
├── ComputationPageHeader
│   ├── Back button ("← Computations" navigates to /computations)
│   ├── Title (editable inline — click to edit)
│   ├── StatusBadge
│   ├── AutoSaveIndicator (status from useAutoSave)
│   └── ActionsBar
│       ├── "Compute" button (Zap icon, blue, shown when status='draft')
│       ├── "Re-compute" button (RefreshCw icon, shown when status='computed')
│       ├── "Finalize" button (Lock icon, shown when status='computed')
│       ├── "Unlock" button (LockOpen icon, shown when status='finalized')
│       ├── "Export PDF" button (Download icon, lazy-loads PDF renderer)
│       ├── ShareToggle (switch + "Copy Link" button, shown when computed/finalized)
│       └── DropdownMenu (MoreHorizontal icon): Archive, Delete
├── Tabs: [Input] [Results] [Notes] [Deadlines]
│   ├── Tab: Input
│   │   └── WizardForm (shows all steps as sections, not paginated, for editing)
│   │       OR WizardForm locked (read-only if status='finalized')
│   ├── Tab: Results (shown only if output_json !== null)
│   │   └── ResultsView (reads computation.outputJson)
│   ├── Tab: Notes
│   │   ├── NotesList (append-only, sorted oldest-first)
│   │   └── AddNoteForm (text area + "Add Note" button)
│   └── Tab: Deadlines
│       └── DeadlinesList (computed from outputJson + tax year)
```

**Critical wiring:** The "Compute" / "Re-compute" button in ActionsBar calls `runCompute(input)` from `useCompute()`, then on success calls `saveComputationOutput(compId, result)` and switches to Results tab.

---

## 9. New Computation Page — `src/routes/computations/new.tsx`

```typescript
export const Route = createFileRoute('/computations/new')({
  beforeLoad: ({ context }) => {
    if (!context.auth.user) throw redirect({ to: '/auth' });
  },
  component: NewComputationPage,
});
```

**Flow:**
1. Page mounts → immediately create a draft computation with null input: `createComputation(userId, orgId, null)` → get `computationId`
2. Render `<WizardPage computationId={computationId} />` (the 14-step wizard)
3. On each step "Continue": `updateComputationInput(computationId, partialInput, 'draft')` (auto-save fires)
4. On final step "See My Results": call `runCompute(finalInput)` → call `saveComputationOutput(computationId, result)` → navigate to `/computations/${computationId}?tab=results`
5. If user closes browser before completing: computation stays as `draft` — recoverable from `/computations` list

**Loading state:** Full-page skeleton while `createComputation` resolves (typically < 200ms). Do not show the wizard until the `computationId` is available.

---

## 10. ComputationCard Grid — Empty States

**No computations (first-time user):**
- Icon: `FileText` (lucide-react, 48px, muted color)
- Title: "No computations yet"
- Description: "Start a new tax computation for your client."
- CTA Button: "New Computation" (Plus icon, primary variant) → navigates to `/computations/new`

**No computations matching filter:**
- Icon: `Search` (lucide-react, 48px, muted color)
- Title: "No results"
- Description: "No computations match the selected filters."
- CTA Button: "Clear Filters" (X icon, secondary variant) → resets filters

---

## 11. Deletion Confirm Dialog

**Triggered by:** "Delete" in ComputationCard dropdown menu or ComputationPage ActionsBar

```
AlertDialog (shadcn)
├── AlertDialogContent
│   ├── AlertDialogTitle: "Delete computation?"
│   ├── AlertDialogDescription: "This will delete '{title}'. This action cannot be undone."
│   └── AlertDialogFooter
│       ├── AlertDialogCancel: "Cancel"
│       └── AlertDialogAction (destructive variant): "Delete"
```

**On confirm:** calls `deleteComputation(id)` (soft delete) → shows toast "Computation deleted" → navigates to `/computations`

---

## 12. Title Editing (Inline)

In `ComputationPageHeader`, the title is an inline-editable field:
- Default: shows title as `<h1>` with `cursor-text hover:underline` hint
- Click: replaces with `<input type="text">` focused, pre-filled with current title
- Blur or Enter: calls `supabase.from('computations').update({ title }).eq('id', computationId)` then shows "Saved" toast
- Escape: cancels edit, reverts to prior title
- Max length: 100 characters
- Empty not allowed: revert to prior title on blur if empty

---

## 13. Critical Traps

1. **Re-editing clears output.** `updateComputationInput` must set `output_json = null` and `status = 'draft'` when current status is `computed`. Forgetting this means stale results are shown after re-editing.

2. **Soft delete filter.** Every `listComputations` and `loadComputation` query MUST include `.is('deleted_at', null)`. Missing this shows deleted computations.

3. **`increment_notes_count` RPC needs GRANT.** The `increment_notes_count` RPC must have `GRANT EXECUTE ... TO authenticated` or note-adding will fail silently.

4. **`computationId` must exist before wizard renders.** Create the computation first, then render the wizard. Do NOT render the wizard with `computationId = null` and rely on auto-save to create it — the auto-save hook skips saves when `computationId` is null.

5. **Status transitions on the client must match DB constraint.** The `updateComputationStatus` function validates using `VALID_STATUS_TRANSITIONS` before calling Supabase. This prevents impossible state transitions that would confuse the UI.

6. **Regime label display.** `regimeSelected` is stored as the engine enum value (e.g., `PATH_A_OSD_GRADUATED`). Map to human-readable label using a `REGIME_LABELS` lookup table in `src/lib/regime-labels.ts` before displaying in ComputationCard.

7. **Archiving vs. deleting.** Archive is a status transition (visible in "archived" filter). Delete is a soft delete (hidden from all views). Do not conflate them. Archive is reversible; delete is not (from the user's perspective — data is retained 90 days server-side).
