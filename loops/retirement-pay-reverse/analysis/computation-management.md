# Analysis: Computation Management — CRUD, Auto-Save, Status Workflow

**Wave:** 5 — Frontend Data Model + UI Design
**Aspect:** computation-management
**Date:** 2026-03-06
**Depends on:** database-migrations.md (computations + batch_computations tables), route-table.md, typescript-types.md, wizard-steps.md, results-view.md

---

## Overview

Computation management covers the full lifecycle of a saved single-employee computation:
1. **Create** — Draft auto-saved when wizard opens
2. **Compute** — WASM runs on final wizard submit, output saved, status → `computed`
3. **Read** — Dashboard grid of cards; single results page
4. **Update** — Re-run via "Edit" button (pre-populated wizard)
5. **Delete** — With confirmation dialog
6. **Share** — Status transitions to `shared` when a share link is created (see `sharing` aspect)

Batch computations follow a simpler lifecycle (no wizard, no draft phase) and are covered in section 10.

---

## 1. TypeScript Interfaces

Defined in `src/types/computation.ts`. These extend the interfaces from `database-migrations.md`.

```typescript
// src/types/computation.ts

import type { RetirementInput, RetirementOutput } from './engine'

export type ComputationStatus = 'draft' | 'computed' | 'shared'

export interface ComputationRecord {
  id: string                        // UUID
  userId: string                    // UUID — auth.users.id
  organizationId: string | null     // UUID or null for personal computations
  title: string                     // User-editable. Empty string → auto-display as "${employeeName} — ${retirementDate}"
  input: RetirementInput            // Full WASM input struct, stored as JSONB
  output: RetirementOutput | null   // Full WASM output struct; null for status='draft'
  status: ComputationStatus
  createdAt: string                 // ISO 8601
  updatedAt: string                 // ISO 8601
}

export interface BatchComputationRecord {
  id: string                        // UUID
  userId: string                    // UUID
  organizationId: string | null     // UUID or null
  title: string                     // User-editable
  input: BatchInput                 // Full batch input (array of RetirementInput)
  output: BatchOutput | null        // Full batch output; null while status='processing'
  rowCount: number                  // Denormalized from CSV parse
  errorCount: number                // Rows that failed computation
  status: 'processing' | 'completed' | 'failed'
  createdAt: string                 // ISO 8601
  updatedAt: string                 // ISO 8601
}

// Helper: derive display title when title field is empty
export function getComputationDisplayTitle(record: ComputationRecord): string {
  if (record.title.trim().length > 0) return record.title
  const name = record.input.employeeName ?? 'Employee'
  const date = record.input.retirementDate ?? 'Unknown Date'
  return `${name} — ${date}`
}

export function getBatchDisplayTitle(record: BatchComputationRecord): string {
  if (record.title.trim().length > 0) return record.title
  return `Batch (${record.rowCount} employees)`
}
```

---

## 2. `useComputations()` Hook

Lists all computations for the current user (filtered by active org when an org is selected).

**File:** `src/hooks/useComputations.ts`

```typescript
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toComputationRecord } from '@/lib/mappers'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganization } from '@/contexts/OrgContext'
import type { ComputationRecord } from '@/types/computation'

export function useComputations() {
  const { user } = useAuth()
  const { activeOrg } = useOrganization()
  const [computations, setComputations] = useState<ComputationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchComputations = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    let query = supabase
      .from('computations')
      .select('*')
      .order('updated_at', { ascending: false })

    if (activeOrg) {
      // Show org computations (all members' computations in this org)
      query = query.eq('organization_id', activeOrg.id)
    } else {
      // Show only personal computations (no org)
      query = query.eq('user_id', user.id).is('organization_id', null)
    }

    const { data, error: fetchError } = await query

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    setComputations((data ?? []).map(toComputationRecord))
    setLoading(false)
  }, [user, activeOrg])

  useEffect(() => {
    fetchComputations()
  }, [fetchComputations])

  const deleteComputation = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('computations')
      .delete()
      .eq('id', id)

    if (error) return false

    setComputations(prev => prev.filter(c => c.id !== id))
    return true
  }

  const updateTitle = async (id: string, title: string): Promise<boolean> => {
    const { error } = await supabase
      .from('computations')
      .update({ title })
      .eq('id', id)

    if (error) return false

    setComputations(prev =>
      prev.map(c => c.id === id ? { ...c, title } : c)
    )
    return true
  }

  return {
    computations,
    loading,
    error,
    refresh: fetchComputations,
    deleteComputation,
    updateTitle,
  }
}
```

---

## 3. `useComputation(id)` Hook

Fetches a single computation by ID. Used by results page, edit page, NLRC worksheet page.

**File:** `src/hooks/useComputation.ts`

```typescript
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toComputationRecord } from '@/lib/mappers'
import type { ComputationRecord } from '@/types/computation'

export function useComputation(id: string) {
  const [computation, setComputation] = useState<ComputationRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetch = async () => {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('computations')
        .select('*')
        .eq('id', id)
        .single()

      if (cancelled) return

      if (fetchError || !data) {
        setError(fetchError?.message ?? 'Computation not found')
        setLoading(false)
        return
      }

      setComputation(toComputationRecord(data))
      setLoading(false)
    }

    fetch()
    return () => { cancelled = true }
  }, [id])

  const refetch = async () => {
    const { data, error: fetchError } = await supabase
      .from('computations')
      .select('*')
      .eq('id', id)
      .single()

    if (!fetchError && data) {
      setComputation(toComputationRecord(data))
    }
  }

  return { computation, loading, error, refetch }
}
```

**Error handling:**
- `fetchError.code === 'PGRST116'` (not found or RLS blocked): display `ComputationNotFoundState`
- Other errors: display generic error alert with retry button

---

## 4. Auto-Save Architecture

Auto-save runs during the wizard **at draft stage only**. The pattern:

1. User opens `/compute/new`
2. `NewComputationPage` creates a draft record **on mount** (empty input, status `draft`)
3. Draft ID is stored in component state and used for the Supabase URL (navigate to `/compute/$id/edit` keeps the ID)
4. As the user fills wizard steps, auto-save triggers after **1500ms debounce** from last change
5. On final submit: run WASM, save output, set status → `computed`, navigate to `/compute/$id/results`

**Implementation in `NewComputationPage`:**

**File:** `src/pages/compute/NewComputationPage.tsx`

```typescript
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganization } from '@/contexts/OrgContext'
import { computeSingle } from '@/lib/engine'
import { WizardContainer } from '@/components/wizard/WizardContainer'
import { toast } from 'sonner'
import type { RetirementInput } from '@/types/engine'

export function NewComputationPage() {
  const { user } = useAuth()
  const { activeOrg } = useOrganization()
  const navigate = useNavigate()
  const [draftId, setDraftId] = useState<string | null>(null)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Create draft on mount
  useEffect(() => {
    if (!user) return

    const createDraft = async () => {
      const { data, error } = await supabase
        .from('computations')
        .insert({
          user_id: user.id,
          organization_id: activeOrg?.id ?? null,
          title: '',
          input: {} as RetirementInput,  // Empty input for draft
          status: 'draft',
        })
        .select('id')
        .single()

      if (error || !data) {
        toast.error('Failed to initialize computation. Please try again.')
        return
      }

      setDraftId(data.id)
    }

    createDraft()
  }, [user, activeOrg])

  // Auto-save partial input (debounced 1500ms)
  const handleWizardChange = useCallback((partialInput: Partial<RetirementInput>) => {
    if (!draftId) return

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      await supabase
        .from('computations')
        .update({ input: partialInput })
        .eq('id', draftId)
      // Silent auto-save: no toast, no state update needed
    }, 1500)
  }, [draftId])

  // Final submit: run WASM, save output
  const handleWizardComplete = useCallback(async (input: RetirementInput) => {
    if (!draftId) return

    // Clear any pending auto-save
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    // Run WASM computation
    let output
    try {
      output = await computeSingle(input)
    } catch (err) {
      toast.error('Computation failed. Please check your inputs.')
      return
    }

    // Derive auto-title if no user title provided
    const autoTitle = ''  // Empty: UI derives display title from input data

    // Save result
    const { error } = await supabase
      .from('computations')
      .update({
        input,
        output,
        title: autoTitle,
        status: 'computed',
      })
      .eq('id', draftId)

    if (error) {
      toast.error('Failed to save computation. Please try again.')
      return
    }

    toast.success('Computation saved.')
    navigate({ to: '/compute/$id/results', params: { id: draftId } })
  }, [draftId, navigate])

  if (!draftId) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-slate-500 text-sm">Initializing...</p>
      </div>
    )
  }

  return (
    <WizardContainer
      onChange={handleWizardChange}
      onComplete={handleWizardComplete}
    />
  )
}
```

**Auto-save notes:**
- Draft records with empty `input: {}` appear on the dashboard but are filtered out by the `ComputationCardGrid` (it hides `status === 'draft'` items by default, showing only computed + shared)
- If the user navigates away without completing the wizard, the draft persists in the DB. A future cleanup job or dashboard UI can offer "Continue drafts" — but for MVP, drafts are silently discarded
- `computeSingle` in `src/lib/engine.ts` initializes the WASM module and calls `compute_single_json`

---

## 5. Edit Computation Flow

**File:** `src/pages/compute/EditComputationPage.tsx`

Re-runs the computation with pre-populated wizard data. Updates the existing record.

```typescript
import { useCallback } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { useComputation } from '@/hooks/useComputation'
import { computeSingle } from '@/lib/engine'
import { WizardContainer } from '@/components/wizard/WizardContainer'
import { toast } from 'sonner'
import type { RetirementInput } from '@/types/engine'

export function EditComputationPage() {
  const { id } = useParams({ from: '/_authenticated/compute/$id/edit' })
  const { computation, loading, error } = useComputation(id)
  const navigate = useNavigate()

  const handleComplete = useCallback(async (input: RetirementInput) => {
    let output
    try {
      output = await computeSingle(input)
    } catch {
      toast.error('Computation failed. Please check your inputs.')
      return
    }

    const { error: updateError } = await supabase
      .from('computations')
      .update({
        input,
        output,
        status: 'computed',
        // If status was 'shared', reverts to 'computed' (share link still exists but
        // computation data has changed — the share link now shows updated data)
      })
      .eq('id', id)

    if (updateError) {
      toast.error('Failed to save changes. Please try again.')
      return
    }

    toast.success('Computation updated.')
    navigate({ to: '/compute/$id/results', params: { id } })
  }, [id, navigate])

  if (loading) return <WizardSkeleton />

  if (error || !computation) {
    return <ComputationNotFoundState />
  }

  return (
    <WizardContainer
      initialData={computation.input}
      onComplete={handleComplete}
    />
  )
}
```

**Status after edit:** If the computation was `shared`, editing it keeps `status: 'computed'` (not re-shared automatically). The share link still exists in `shared_links` and still returns the updated data via `get_shared_computation`. The status badge in the dashboard will show `computed` until the user re-enables sharing.

---

## 6. Delete Computation Flow

Delete is triggered from the `ComputationResultsPage` and the dashboard `ComputationCard` context menu.

**Pattern:** Always show a confirmation dialog before deleting.

```typescript
// DeleteComputationDialog — used in ComputationResultsPage and ComputationCard
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface DeleteComputationDialogProps {
  computationId: string
  displayTitle: string
  onDeleted?: () => void   // If provided: called after delete (for in-page refresh)
  navigateAfter?: string   // If provided: navigate to this path after delete
}

export function DeleteComputationDialog({
  computationId,
  displayTitle,
  onDeleted,
  navigateAfter,
}: DeleteComputationDialogProps) {
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)

    const { error } = await supabase
      .from('computations')
      .delete()
      .eq('id', computationId)

    setDeleting(false)

    if (error) {
      toast.error('Failed to delete computation. Please try again.')
      return
    }

    toast.success('Computation deleted.')

    if (onDeleted) onDeleted()
    if (navigateAfter) navigate({ to: navigateAfter })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete computation?</AlertDialogTitle>
          <AlertDialogDescription>
            "{displayTitle}" will be permanently deleted. This cannot be undone.
            Any share links for this computation will also stop working.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleting ? 'Deleting...' : 'Delete permanently'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

**Usage in `ComputationResultsPage`:**
```typescript
<DeleteComputationDialog
  computationId={computation.id}
  displayTitle={getComputationDisplayTitle(computation)}
  navigateAfter="/dashboard"
/>
```

**Usage in `ComputationCard` context menu:**
```typescript
<DeleteComputationDialog
  computationId={record.id}
  displayTitle={getComputationDisplayTitle(record)}
  onDeleted={() => { /* remove card from local state */ }}
/>
```

---

## 7. Status Workflow

```
[draft] ──────────────────────────────────────────────────────────────────────→ deleted
  │
  │ Wizard complete (WASM ran, output saved)
  ▼
[computed] ──────────────────────────────────────────────────────────────────→ deleted
  │                        ▲
  │ Share link created      │ Share link deleted (revoked)
  ▼                        │
[shared] ────────────────────────────────────────────────────────────────────→ deleted
  │
  │ User edits computation (re-runs WASM)
  ▼
[computed]  (share link still exists; status reverts to computed until shared again)
```

**Status badge colors:**
- `draft` → Badge variant `outline` with text "Draft" — shown only in dashboard draft filter
- `computed` → Badge variant `secondary` (slate) with text "Computed"
- `shared` → Badge variant `default` (blue) with text "Shared"

**Dashboard default view:** Shows `computed` and `shared` computations only. Draft filter is a tab or toggle labeled "Drafts (N)" where N is the count of draft records.

---

## 8. `ComputationCard` Component

Displays a single computation in the dashboard grid.

**File:** `src/components/computation/ComputationCard.tsx`

```typescript
import { Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, FileText, Edit, Trash2, Share2 } from 'lucide-react'
import { DeleteComputationDialog } from './DeleteComputationDialog'
import { getComputationDisplayTitle } from '@/types/computation'
import { formatCurrency } from '@/lib/format'
import type { ComputationRecord } from '@/types/computation'

// Status badge variant map
const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'outline'> = {
  draft: 'outline',
  computed: 'secondary',
  shared: 'default',
}

interface ComputationCardProps {
  record: ComputationRecord
  onDeleted: (id: string) => void
}

export function ComputationCard({ record, onDeleted }: ComputationCardProps) {
  const displayTitle = getComputationDisplayTitle(record)
  const retirementPay = record.output?.retirementPay ?? null
  const employeeName = record.input?.employeeName ?? '—'
  const companyName = record.input?.companyName ?? '—'
  const retirementDate = record.input?.retirementDate ?? '—'

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <Link
          to="/compute/$id/results"
          params={{ id: record.id }}
          className="flex-1 min-w-0"
        >
          <h3 className="font-semibold text-sm text-slate-900 truncate hover:underline">
            {displayTitle}
          </h3>
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={STATUS_BADGE[record.status]}>
            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to="/compute/$id/results" params={{ id: record.id }}>
                  <FileText className="mr-2 h-4 w-4" />
                  View results
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/compute/$id/edit" params={{ id: record.id }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              {record.status === 'computed' && (
                <DropdownMenuItem asChild>
                  <Link to="/compute/$id/results" params={{ id: record.id }}
                    search={{ action: 'share' }}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <div onClick={e => e.stopPropagation()}>
                <DeleteComputationDialog
                  computationId={record.id}
                  displayTitle={displayTitle}
                  onDeleted={() => onDeleted(record.id)}
                  trigger={
                    <DropdownMenuItem
                      onSelect={e => e.preventDefault()}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  }
                />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-1 pt-0">
        <p className="text-xs text-slate-500 truncate">{companyName}</p>
        <p className="text-xs text-slate-500">Retirement: {retirementDate}</p>
        {retirementPay !== null ? (
          <p className="text-base font-semibold text-slate-900 mt-2">
            {formatCurrency(retirementPay)}
          </p>
        ) : (
          <p className="text-sm text-slate-400 italic mt-2">Draft — not computed</p>
        )}
      </CardContent>
    </Card>
  )
}
```

**`formatCurrency(centavos: number): string`:**

```typescript
// src/lib/format.ts
export function formatCurrency(centavos: number): string {
  const pesos = centavos / 100
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(pesos)
}

// Output: "₱150,750.00"
```

---

## 9. `ComputationCardGrid` Component

Renders the list of `ComputationCard` components with tabs for filtering by status.

**File:** `src/components/computation/ComputationCardGrid.tsx`

```typescript
import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ComputationCard } from './ComputationCard'
import { EmptyComputationsState } from './EmptyComputationsState'
import type { ComputationRecord } from '@/types/computation'

interface ComputationCardGridProps {
  computations: ComputationRecord[]
  onDeleted: (id: string) => void
}

export function ComputationCardGrid({ computations, onDeleted }: ComputationCardGridProps) {
  const computed = computations.filter(c => c.status === 'computed')
  const shared = computations.filter(c => c.status === 'shared')
  const drafts = computations.filter(c => c.status === 'draft')
  const active = [...computed, ...shared]  // Default view: computed + shared

  return (
    <Tabs defaultValue="active">
      <TabsList>
        <TabsTrigger value="active">
          All ({active.length})
        </TabsTrigger>
        <TabsTrigger value="shared">
          Shared ({shared.length})
        </TabsTrigger>
        {drafts.length > 0 && (
          <TabsTrigger value="drafts">
            Drafts ({drafts.length})
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="active" className="mt-4">
        {active.length === 0 ? (
          <EmptyComputationsState />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {active.map(record => (
              <ComputationCard
                key={record.id}
                record={record}
                onDeleted={onDeleted}
              />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="shared" className="mt-4">
        {shared.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No shared computations. Share a computation from its results page.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shared.map(record => (
              <ComputationCard
                key={record.id}
                record={record}
                onDeleted={onDeleted}
              />
            ))}
          </div>
        )}
      </TabsContent>

      {drafts.length > 0 && (
        <TabsContent value="drafts" className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {drafts.map(record => (
              <ComputationCard
                key={record.id}
                record={record}
                onDeleted={onDeleted}
              />
            ))}
          </div>
        </TabsContent>
      )}
    </Tabs>
  )
}
```

---

## 10. `DashboardPage` Integration

**File:** `src/pages/DashboardPage.tsx`

```typescript
import { useComputations } from '@/hooks/useComputations'
import { ComputationCardGrid } from '@/components/computation/ComputationCardGrid'
import { EmptyComputationsState } from '@/components/computation/EmptyComputationsState'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { Plus, Upload } from 'lucide-react'
import { DashboardSkeleton } from '@/components/computation/DashboardSkeleton'

export function DashboardPage() {
  const { computations, loading, error, deleteComputation } = useComputations()

  const handleDeleted = (id: string) => {
    deleteComputation(id)
    // Local state is updated inside deleteComputation via setComputations
  }

  if (loading) return <DashboardSkeleton />

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-red-600 text-sm">Failed to load computations: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/batch/new">
              <Upload className="mr-2 h-4 w-4" />
              Batch Upload
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/compute/new">
              <Plus className="mr-2 h-4 w-4" />
              New Computation
            </Link>
          </Button>
        </div>
      </div>

      <ComputationCardGrid
        computations={computations}
        onDeleted={handleDeleted}
      />
    </div>
  )
}
```

---

## 11. `EmptyComputationsState` Component

Shown when the active tab has zero computations.

**File:** `src/components/computation/EmptyComputationsState.tsx`

```typescript
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { Calculator, Upload } from 'lucide-react'

export function EmptyComputationsState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
      <Calculator className="h-12 w-12 text-slate-300" />
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-700">No computations yet</h3>
        <p className="text-sm text-slate-500 max-w-xs">
          Compute RA 7641 statutory retirement pay for an employee, or upload a CSV for batch processing.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild size="sm">
          <Link to="/compute/new">
            <Calculator className="mr-2 h-4 w-4" />
            New Computation
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/batch/new">
            <Upload className="mr-2 h-4 w-4" />
            Batch Upload
          </Link>
        </Button>
      </div>
    </div>
  )
}
```

---

## 12. `DashboardSkeleton` Component

Skeleton loader for the dashboard while computations are fetching.

**File:** `src/components/computation/DashboardSkeleton.tsx`

```typescript
import { Skeleton } from '@/components/ui/skeleton'

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-36" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-20" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-6 w-2/5 mt-2" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## 13. `ComputationNotFoundState` Component

Shown by `useComputation` error states (computation not found or RLS blocked).

**File:** `src/components/computation/ComputationNotFoundState.tsx`

```typescript
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { AlertCircle } from 'lucide-react'

export function ComputationNotFoundState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
      <AlertCircle className="h-12 w-12 text-slate-300" />
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-700">Computation not found</h3>
        <p className="text-sm text-slate-500">
          This computation does not exist or you do not have access to it.
        </p>
      </div>
      <Button asChild variant="outline" size="sm">
        <Link to="/dashboard">Back to Dashboard</Link>
      </Button>
    </div>
  )
}
```

---

## 14. Inline Title Editing

From the results page header, the user can edit the computation title inline.

```typescript
// InlineTitleEditor — used in ComputationResultsPage header
import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface InlineTitleEditorProps {
  computationId: string
  currentTitle: string
  displayTitle: string        // Derived title (employeeName — date) if currentTitle is empty
  onSaved: (newTitle: string) => void
}

export function InlineTitleEditor({
  computationId, currentTitle, displayTitle, onSaved
}: InlineTitleEditorProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(currentTitle)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const save = async () => {
    setEditing(false)

    const trimmed = value.trim()
    if (trimmed === currentTitle) return  // No change

    const { error } = await supabase
      .from('computations')
      .update({ title: trimmed })
      .eq('id', computationId)

    if (error) {
      toast.error('Failed to save title.')
      setValue(currentTitle)  // Revert
      return
    }

    onSaved(trimmed)
  }

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={e => {
          if (e.key === 'Enter') save()
          if (e.key === 'Escape') { setValue(currentTitle); setEditing(false) }
        }}
        className="h-8 text-xl font-bold border-0 border-b-2 border-blue-500 rounded-none px-0 focus-visible:ring-0"
        maxLength={120}
        placeholder="Enter a title..."
      />
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="text-xl font-bold text-slate-900 hover:text-blue-600 text-left truncate max-w-lg"
      title="Click to edit title"
    >
      {displayTitle}
    </button>
  )
}
```

---

## 15. Batch Computation Management

Batch computations follow a simpler lifecycle: `processing` → `completed` | `failed`. No wizard, no draft phase.

**`useBatchComputations()` hook — File:** `src/hooks/useBatchComputations.ts`

```typescript
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toBatchComputationRecord } from '@/lib/mappers'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganization } from '@/contexts/OrgContext'
import type { BatchComputationRecord } from '@/types/computation'

export function useBatchComputations() {
  const { user } = useAuth()
  const { activeOrg } = useOrganization()
  const [batches, setBatches] = useState<BatchComputationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBatches = useCallback(async () => {
    if (!user) return

    setLoading(true)

    let query = supabase
      .from('batch_computations')
      .select('*')
      .order('created_at', { ascending: false })

    if (activeOrg) {
      query = query.eq('organization_id', activeOrg.id)
    } else {
      query = query.eq('user_id', user.id).is('organization_id', null)
    }

    const { data, error: fetchError } = await query

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    setBatches((data ?? []).map(toBatchComputationRecord))
    setLoading(false)
  }, [user, activeOrg])

  useEffect(() => {
    fetchBatches()
  }, [fetchBatches])

  const deleteBatch = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('batch_computations')
      .delete()
      .eq('id', id)

    if (error) return false

    setBatches(prev => prev.filter(b => b.id !== id))
    return true
  }

  return { batches, loading, error, refresh: fetchBatches, deleteBatch }
}
```

**`useBatchComputation(id)` hook — File:** `src/hooks/useBatchComputation.ts`

```typescript
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toBatchComputationRecord } from '@/lib/mappers'
import type { BatchComputationRecord } from '@/types/computation'

export function useBatchComputation(id: string) {
  const [batch, setBatch] = useState<BatchComputationRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    supabase
      .from('batch_computations')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error: fetchError }) => {
        if (cancelled) return
        if (fetchError || !data) {
          setError(fetchError?.message ?? 'Batch not found')
        } else {
          setBatch(toBatchComputationRecord(data))
        }
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [id])

  return { batch, loading, error }
}
```

---

## 16. `engine.ts` WASM Wrapper

Single file that initializes the WASM module and exposes typed computation functions.

**File:** `src/lib/engine.ts`

```typescript
import type { RetirementInput, RetirementOutput, BatchInput, BatchOutput, NlrcWorksheetOutput } from '@/types/engine'

// WASM module — loaded lazily on first call
let wasmInitialized = false

async function ensureWasm(): Promise<void> {
  if (wasmInitialized) return

  // Dynamic import for code splitting — WASM only loads when needed
  const wasmModule = await import('@retirement-pay-engine/wasm')
  // init() for browser (async, uses fetch for WASM bytes)
  await wasmModule.default()
  wasmInitialized = true
}

export async function computeSingle(input: RetirementInput): Promise<RetirementOutput> {
  await ensureWasm()
  const { compute_single_json } = await import('@retirement-pay-engine/wasm')
  const result = compute_single_json(JSON.stringify(input))
  const parsed = JSON.parse(result)

  if ('error' in parsed) {
    throw new Error(parsed.error)
  }

  return parsed as RetirementOutput
}

export async function computeBatch(input: BatchInput): Promise<BatchOutput> {
  await ensureWasm()
  const { compute_batch_json } = await import('@retirement-pay-engine/wasm')
  const result = compute_batch_json(JSON.stringify(input))
  const parsed = JSON.parse(result)

  if ('error' in parsed) {
    throw new Error(parsed.error)
  }

  return parsed as BatchOutput
}

export async function generateNlrc(input: RetirementInput, output: RetirementOutput): Promise<NlrcWorksheetOutput> {
  await ensureWasm()
  const { generate_nlrc_json } = await import('@retirement-pay-engine/wasm')
  const result = generate_nlrc_json(JSON.stringify({ input, output }))
  const parsed = JSON.parse(result)

  if ('error' in parsed) {
    throw new Error(parsed.error)
  }

  return parsed as NlrcWorksheetOutput
}
```

---

## 17. Summary of Artifacts

| Artifact | File |
|----------|------|
| Computation TypeScript types | `src/types/computation.ts` |
| `useComputations()` | `src/hooks/useComputations.ts` |
| `useComputation(id)` | `src/hooks/useComputation.ts` |
| `useBatchComputations()` | `src/hooks/useBatchComputations.ts` |
| `useBatchComputation(id)` | `src/hooks/useBatchComputation.ts` |
| WASM engine wrapper | `src/lib/engine.ts` |
| Currency formatter | `src/lib/format.ts` |
| `NewComputationPage` | `src/pages/compute/NewComputationPage.tsx` |
| `EditComputationPage` | `src/pages/compute/EditComputationPage.tsx` |
| `DashboardPage` | `src/pages/DashboardPage.tsx` |
| `ComputationCard` | `src/components/computation/ComputationCard.tsx` |
| `ComputationCardGrid` | `src/components/computation/ComputationCardGrid.tsx` |
| `EmptyComputationsState` | `src/components/computation/EmptyComputationsState.tsx` |
| `DashboardSkeleton` | `src/components/computation/DashboardSkeleton.tsx` |
| `ComputationNotFoundState` | `src/components/computation/ComputationNotFoundState.tsx` |
| `DeleteComputationDialog` | `src/components/computation/DeleteComputationDialog.tsx` |
| `InlineTitleEditor` | `src/components/computation/InlineTitleEditor.tsx` |

---

## 18. Key Design Decisions

1. **Draft created on wizard mount** — Ensures the computation has a DB ID before the user submits. Allows auto-save throughout the wizard without a separate "save as draft" button. Draft IDs are stable (no re-creation if user navigates back).

2. **Auto-save is silent** — No toast, no spinner. User shouldn't be interrupted by save feedback. The status badge showing "Draft" is sufficient indication.

3. **Draft visibility is opt-in** — The "Drafts" tab in the grid only shows when `drafts.length > 0`. Completed computations are the default view. This prevents cluttering the dashboard with abandoned drafts.

4. **`organization_id` set at creation time** — If the user is in an org context when they start a computation, it's scoped to that org. This is set on draft creation, not on final submit. This matches the user's intent (they started the computation while in an org context).

5. **Edit reverts `shared` to `computed`** — When an edited computation is re-saved, the status becomes `computed` even if it was `shared`. The share link in `shared_links` still exists, so the public URL still works. The status badge no longer shows `shared` until the user explicitly re-shares. This is intentional: the user should re-confirm sharing after changing data.

6. **Inline title editing** — Titles are edited inline in the results page header (click-to-edit pattern). No separate settings form. Max 120 chars (matches DB constraint).

7. **`computeSingle` is async + lazy** — WASM is loaded on first call only, not at app startup. This prevents the WASM bundle from blocking initial page load.
