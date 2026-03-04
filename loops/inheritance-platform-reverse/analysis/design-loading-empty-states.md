# Analysis: design-loading-empty-states
**Wave**: 3 — Design Modernization Audit
**Date**: 2026-03-04
**Method**: Read every route and component with data-fetching; catalog every loading state and empty state; identify missing ones; propose skeleton/spinner patterns and empty-state designs with exact file paths and exact changes.

---

## Summary

The app has **14 loading state locations** (most use a bare Loader2 spinner with no skeleton shimmer), **4 plain-text loading strings** that are visually wrong, and **6 missing loading states** where data-fetch operations leave the UI frozen or blank. For empty states, **8 empty-state conditions are missing entirely** and the **4 that exist are plain-text-only** with no icon, illustration, or CTA. There is no `<Skeleton>` component in `components/ui/`.

---

## Part 1: Existing Loading State Audit

### LS-001 — Dashboard auth check
- **File**: `routes/index.tsx:16-21`
- **Current**: Custom border-spinner div using Tailwind `animate-spin border-t-transparent`; does NOT use `Loader2` from lucide
- **Gap**: Inconsistent with other routes that use `Loader2`; no skeleton for dashboard content
- **Rating**: WEAK

### LS-002 — Clients list auth check
- **File**: `routes/clients/index.tsx:50-57`
- **Current**: `<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />`
- **Gap**: None — spinner pattern is correct
- **Rating**: OK

### LS-003 — Clients list data loading
- **File**: `components/clients/ClientList.tsx:60`
- **Current**: `{loading && <div data-testid="client-list-loading">Loading...</div>}`
- **Gap**: Plain text. Renders above the empty table. Should be 5 skeleton rows replacing the table.
- **Rating**: BAD

### LS-004 — Settings auth check
- **File**: `routes/settings/index.tsx:21-28`
- **Current**: `<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />`
- **Rating**: OK

### LS-005 — Settings profile loading
- **File**: `routes/settings/index.tsx:83-90`
- **Current**: `<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />`
- **Gap**: Spinner covers the whole content area. Should be a skeleton form (label+input pairs stacked) so the page layout doesn't jump.
- **Rating**: WEAK

### LS-006 — Deadlines auth check
- **File**: `routes/deadlines.tsx:155-162`
- **Current**: `<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />`
- **Rating**: OK

### LS-007 — Deadlines data loading
- **File**: `routes/deadlines.tsx:202-204`
- **Current**: `<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />`
- **Gap**: No skeleton. 2-3 skeleton deadline cards would prevent layout shift.
- **Rating**: WEAK

### LS-008 — Case editor loading phase
- **File**: `routes/cases/$caseId.tsx:86-89`
- **Current**: Custom border-spinner div `animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full` — hand-rolled, not using `Loader2`
- **Gap**: Inconsistent; no skeleton for case content area.
- **Rating**: BAD (inconsistent)

### LS-009 — Case computation phase
- **File**: `routes/cases/$caseId.tsx:96-103`
- **Current**: Custom border spinner + `<p>Computing distribution...</p>` text
- **Gap**: Conceptually good. Should use `Loader2` instead of hand-rolled spinner. Add a pulsing step label.
- **Rating**: OK (minor polish needed)

### LS-010 — Shared case loading
- **File**: `routes/share/$token.tsx:53-63`
- **Current**: Card with `<p className="text-muted-foreground">Loading shared case...</p>` — no spinner at all
- **Gap**: Card is present (good), but no spinner. User sees static text and may not know it's loading.
- **Rating**: BAD (missing spinner)

### LS-011 — Client detail loading
- **File**: `routes/clients/$clientId.tsx:37-44`
- **Current**: `<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />`
- **Gap**: Should be skeleton dl rows matching the detail page layout.
- **Rating**: WEAK

### LS-012 — Document checklist loading
- **File**: `components/case/DocumentChecklist.tsx:44-45`
- **Current**: `<div data-testid="document-checklist-loading">Loading documents...</div>`
- **Gap**: Plain text. Should be skeleton rows.
- **Rating**: BAD

### LS-013 — Team settings loading
- **File**: `routes/settings/team.tsx:33-35`
- **Current**: `<div className="p-6"><p>Loading...</p></div>` — plain text, no spinner
- **Gap**: Plain text, not using Loader2, no skeleton.
- **Rating**: BAD

### LS-014 — Conflict check running
- **File**: `components/intake/ConflictCheckStep.tsx:115-120`
- **Current**: Button text changes to `'Checking...'` + `disabled={loading}`. Button goes into disabled/muted state while API call runs.
- **Gap**: None — this pattern is correct and sufficient for a button-triggered operation.
- **Rating**: GOOD

---

## Part 2: Missing Loading States

### GLS-001 — Case creation post-submit
- **File**: `routes/cases/new.tsx` (currently just renders `<GuidedIntakeForm>`)
- **Missing**: When `onComplete` fires and the app navigates, there is no transition state. `GuidedIntakeForm.tsx:55-106` sets `isSubmitting=true` but only passes it to `IntakeReviewStep` for the button. The page itself shows no full-screen loading indicator while the 2 Supabase inserts are in flight.
- **Exact fix**: In `components/intake/IntakeReviewStep.tsx`, when `isSubmitting` is true, replace the full card content with a centered `<Loader2 className="h-8 w-8 animate-spin text-primary" />` plus `<p>Creating case...</p>`. This prevents the "Create Case" button from being double-clicked and communicates progress.

### GLS-002 — FirmProfileForm save indicator
- **File**: `components/settings/FirmProfileForm.tsx`
- **Missing**: The component receives `saving: boolean` prop but the submit button text never changes and has no spinner icon.
- **Exact fix**: In `FirmProfileForm.tsx`, change the submit button to: `<Button type="submit" disabled={saving}>{saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : 'Save Changes'}</Button>`

### GLS-003 — Note save indicator
- **File**: `components/case/CaseNotesPanel.tsx:32-58`
- **Missing**: `setSaving(true)` is called but no UI element reflects the saving state. The NoteEditor receives `saving` prop but the "Save" button text/state is not shown in `NoteEditor.tsx`.
- **Exact fix**: In `components/case/NoteEditor.tsx`, on the save button: `<Button type="submit" disabled={saving}>{saving ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Saving...</> : 'Save'}</Button>`

### GLS-004 — InviteMemberDialog submit
- **File**: `components/settings/InviteMemberDialog.tsx`
- **Missing**: The submit button has no loading state while the invite API call runs.
- **Exact fix**: Add `const [inviting, setInviting] = useState(false)` to the dialog. Wrap `onInvite` call: `setInviting(true); try { await onInvite(email, role); onOpenChange(false); } finally { setInviting(false); }`. Apply to submit button: `disabled={inviting}` + spinner when `inviting`.

### GLS-005 — Logo upload progress
- **File**: `components/settings/LogoUpload.tsx`
- **Missing**: (Status unknown from catalog — needs verification during spec-draft). Add an `uploading` state with a Loader2 overlay on the upload button.

### GLS-006 — Share toggle in ShareDialog
- **File**: `components/case/ShareDialog.tsx`
- **Missing**: (Status unknown). The share enable/disable toggle makes an async call; while in flight the toggle should be in a pending/loading state to prevent double-clicks.

---

## Part 3: Existing Empty State Audit

### ES-001 — Dashboard unauthenticated (GOOD)
- **File**: `routes/index.tsx:24-49`
- **Current**: Max-width centered card with heading "Inheritance Calculator", description, Sign In + Create Account buttons.
- **Rating**: GOOD — serves as a landing page

### ES-002 — Dashboard authenticated, no cases (WEAK)
- **File**: `routes/index.tsx:52-70`
- **Current**: Text "Welcome back. Use 'New Case' to start an inheritance computation." + New Case button. No icon, no cases list, no stats.
- **Gap**: No icon. No cases list. The entire value of the dashboard ("at-a-glance status") is absent.
- **Rating**: WEAK

### ES-003 — Deadlines page, no deadlines (BAD)
- **File**: `routes/deadlines.tsx:206-208`
- **Current**: `<p className="text-muted-foreground text-sm py-8 text-center">No pending deadlines across your active cases.</p>`
- **Gap**: Plain text, no icon. When there are no deadlines this is actually a success state ("you're all caught up") but it looks like an error.
- **Rating**: BAD

### ES-004 — Clients page, not signed in (WEAK)
- **File**: `routes/clients/index.tsx:60-74`
- **Current**: Page header + `<p className="text-muted-foreground">Sign in to manage your clients.</p>`
- **Rating**: WEAK

### ES-005 — Settings page, not signed in (WEAK)
- **File**: `routes/settings/index.tsx:31-45`
- **Current**: Same pattern — page header + muted text
- **Rating**: WEAK

### ES-006 — Deadlines page, not signed in (WEAK)
- **File**: `routes/deadlines.tsx:165-178`
- **Current**: Same pattern
- **Rating**: WEAK

### ES-007 — Shared case not found (OK)
- **File**: `routes/share/$token.tsx:65-79`
- **Current**: Card with "Case Not Found" title + description
- **Rating**: OK

### ES-008 — Team page, no organization (BAD)
- **File**: `routes/settings/team.tsx:41-46`
- **Current**: `<p>No organization found. Create or join an organization to manage team members.</p>` — plain paragraph, no Card, no CTA
- **Rating**: BAD

---

## Part 4: Missing Empty States

### GES-001 — Clients list empty (clients=[])
- **File**: `components/clients/ClientList.tsx` + `routes/clients/index.tsx`
- **Missing**: When `clients.length === 0` and `loading === false`, the component renders an empty `<tbody>` with no message.
- **Impact**: User sees table headers but no content — looks broken.

### GES-002 — Case notes empty (notes=[])
- **File**: `components/case/CaseNotesPanel.tsx:103-131`
- **Missing**: When `notes.length === 0`, the `<div data-testid="notes-list">` renders nothing.
- **Impact**: Panel content is blank below the "Case Notes" header.

### GES-003 — Team members empty (members=[])
- **File**: `components/settings/TeamMemberList.tsx:31-81`
- **Missing**: When `members.length === 0`, the component renders nothing (`.map()` on empty array).
- **Impact**: Team settings page looks broken with no content.

### GES-004 — Document checklist empty (documents=[])
- **File**: `components/case/DocumentChecklist.tsx:65-111`
- **Missing**: When `documents.length === 0`, shows "0 of 0 obtained (0%)" progress bar and empty list.
- **Impact**: Confusing — user sees 0% progress bar but no documents to action.

### GES-005 — Deadline timeline empty (deadlines=[])
- **File**: `components/case/DeadlineTimeline.tsx:59-67`
- **Missing**: When `deadlines.length === 0`, renders "0 of 0 milestones complete" and empty `<div className="space-y-3">`.
- **Impact**: Confusing — 0/0 header with empty content.

### GES-006 — Client detail: no linked cases
- **File**: `routes/clients/$clientId.tsx:135-138`
- **Current**: `<p className="text-sm text-muted-foreground">Linked cases will appear here.</p>`
- **Gap**: This is a stub, not a real empty state. No CTA to create a case for this client.

### GES-007 — Shared case: no results content
- **File**: `routes/share/$token.tsx:99-101`
- **Current**: Comment `{/* Results will be rendered here in implementation phase */}`
- **Gap**: The shared view renders a card with just the decedent name and nothing else. This is a stub. Entire results section is absent.

### GES-008 — ConflictCheckDialog: no prior checks
- **File**: `components/clients/ConflictCheckDialog.tsx`
- **Missing**: (Status unknown — not fully read in Wave 1). Likely has no empty state when no matches are found or when the dialog first opens.

---

## Part 5: Modernization Proposals with Exact Fixes

### MOD-DLES-001 — Add Skeleton Component

**File to create**: `app/src/components/ui/skeleton.tsx`
**Contents**:
```tsx
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
```
**CSS in `index.css`**: No additional CSS needed — `animate-pulse` is built into Tailwind.

---

### MOD-DLES-002 — Replace ClientList Loading State with Skeleton Rows

**File**: `app/src/components/clients/ClientList.tsx`
**Current** (line 60): `{loading && <div data-testid="client-list-loading">Loading...</div>}`

**Replace the entire return block** to:
1. Import `Skeleton` from `@/components/ui/skeleton`
2. When `loading && clients.length === 0`, render 5 skeleton rows inside the table:
```tsx
if (loading) {
  return (
    <div data-testid="client-list">
      {/* controls stay visible during reload */}
      <div data-testid="client-list-controls">
        {/* ... same controls ... */}
      </div>
      <table data-testid="client-list-table">
        <thead>/* same header */</thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i}>
              <td><Skeleton className="h-4 w-32" /></td>
              <td><Skeleton className="h-4 w-20" /></td>
              <td><Skeleton className="h-4 w-8" /></td>
              <td><Skeleton className="h-4 w-16" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```
**Result**: Table layout is maintained during load; content fades in without layout shift.

---

### MOD-DLES-003 — Replace DocumentChecklist Loading State

**File**: `app/src/components/case/DocumentChecklist.tsx`
**Current** (line 44-45): `<div data-testid="document-checklist-loading">Loading documents...</div>`

**Replace with**:
```tsx
if (loading) {
  return (
    <div data-testid="document-checklist-loading">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-2 w-full rounded-full mb-4" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

### MOD-DLES-004 — Replace TeamSettingsPage Loading State

**File**: `app/src/routes/settings/team.tsx`
**Current** (line 33-35): `<div className="p-6"><p>Loading...</p></div>`

**Replace with**:
```tsx
if (loading) {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-10 w-20" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between py-2 border-b">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div>
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <Skeleton className="h-6 w-16 rounded" />
        </div>
      ))}
    </div>
  )
}
```

---

### MOD-DLES-005 — Fix SharedCasePage Loading State

**File**: `app/src/routes/share/$token.tsx`
**Current** (line 53-63): Card with static text "Loading shared case..."

**Replace `CardContent` inner content**:
```tsx
<CardContent className="py-12 text-center">
  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-3" />
  <p className="text-muted-foreground text-sm">Loading shared case...</p>
</CardContent>
```
Import `Loader2` from `lucide-react`. Import `Skeleton` from `@/components/ui/skeleton`.

---

### MOD-DLES-006 — Fix Dashboard Loading State

**File**: `app/src/routes/index.tsx`
**Current** (line 16-21): Hand-rolled border spinner

**Replace with**:
```tsx
if (loading) {
  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border rounded-lg p-4">
            <Skeleton className="h-4 w-40 mb-2" />
            <Skeleton className="h-3 w-24 mb-4" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
```
Import `Skeleton` from `@/components/ui/skeleton`. Remove `Loader2` import (currently uses custom spinner).

---

### MOD-DLES-007 — Fix Case Editor Loading Phase

**File**: `app/src/routes/cases/$caseId.tsx`
**Current** (line 86-89): Hand-rolled border spinner in center

**Replace with**:
```tsx
{state.phase === 'loading' && (
  <div className="space-y-4">
    <div className="flex items-center gap-3 mb-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-6 w-20 ml-auto" />
    </div>
    {/* Wizard-shaped skeleton */}
    <Skeleton className="h-2 w-full rounded-full" />
    <div className="border rounded-xl p-6 space-y-4">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="grid grid-cols-2 gap-4">
        <div><Skeleton className="h-4 w-16 mb-2" /><Skeleton className="h-10 w-full" /></div>
        <div><Skeleton className="h-4 w-16 mb-2" /><Skeleton className="h-10 w-full" /></div>
      </div>
    </div>
  </div>
)}
```

---

### MOD-DLES-008 — Add Empty State Component

**File to create**: `app/src/components/ui/empty-state.tsx`
```tsx
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground/60" />
      </div>
      <h3 className="font-medium text-sm mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-4">{description}</p>
      {action && (
        <Button size="sm" onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  )
}
```

---

### MOD-DLES-009 — Add Empty State to ClientList

**File**: `app/src/components/clients/ClientList.tsx`
**After the loading guard**, in the main return body, replace the empty `<tbody>` rendering:

In the `<tbody>` of the table:
```tsx
{clients.length === 0 ? (
  <tr>
    <td colSpan={4}>
      <EmptyState
        icon={Users}
        title="No clients yet"
        description="Add your first client to start tracking estate cases."
        // No action here — action button is in the parent route header
      />
    </td>
  </tr>
) : clients.map((client) => (
  <tr key={client.id} ...>
    {/* existing row */}
  </tr>
))}
```
Import `EmptyState` from `@/components/ui/empty-state` and `Users` from `lucide-react`.

---

### MOD-DLES-010 — Add Empty State to CaseNotesPanel

**File**: `app/src/components/case/CaseNotesPanel.tsx`
**Location**: Line 103-131, inside `<div data-testid="notes-list">`

Replace empty rendering with:
```tsx
<div data-testid="notes-list">
  {notes.length === 0 && !showEditor ? (
    <EmptyState
      icon={FileText}
      title="No notes yet"
      description="Add notes to track research, decisions, and client communications."
      action={{ label: "Add Note", onClick: () => setShowEditor(true) }}
    />
  ) : notes.map((note) => (
    /* existing note rendering */
  ))}
</div>
```
Import `EmptyState` from `@/components/ui/empty-state` and `FileText` from `lucide-react`.

---

### MOD-DLES-011 — Add Empty State to TeamMemberList

**File**: `app/src/components/settings/TeamMemberList.tsx`
**Location**: Before the `.map()` call on line 31

Replace:
```tsx
{members.map((member) => { ... })}
```
with:
```tsx
{members.length === 0 ? (
  <EmptyState
    icon={Users2}
    title="Just you for now"
    description="Invite colleagues to collaborate on estate cases."
  />
) : members.map((member) => { ... })}
```
Note: The CTA for inviting is in the parent `TeamSettingsPage` (Invite button in header). No action on empty state to avoid duplication. Import `Users2` from `lucide-react`.

---

### MOD-DLES-012 — Fix DocumentChecklist Empty State

**File**: `app/src/components/case/DocumentChecklist.tsx`
**Location**: After the progress bar (line 57-63), when `documents.length === 0`:

```tsx
{documents.length === 0 ? (
  <EmptyState
    icon={FolderOpen}
    title="No documents configured"
    description="Document checklist populates automatically when a case is computed."
  />
) : (
  <div className="space-y-2">
    {documents.map((doc) => ( /* existing */ ))}
  </div>
)}
```
Import `FolderOpen` from `lucide-react`.

---

### MOD-DLES-013 — Fix DeadlineTimeline Empty State

**File**: `app/src/components/case/DeadlineTimeline.tsx`
**Location**: The `<div className="space-y-3">` at line 59-67

Replace:
```tsx
<div className="space-y-3">
  {deadlines.map((d) => ( ... ))}
</div>
```
with:
```tsx
{deadlines.length === 0 ? (
  <EmptyState
    icon={CalendarX}
    title="No deadlines yet"
    description="Settlement deadlines appear automatically after computing the distribution."
  />
) : (
  <div className="space-y-3">
    {deadlines.map((d) => ( ... ))}
  </div>
)}
```
Also fix: remove the "0 of 0 milestones complete" header line when `deadlines.length === 0`. Condition:
```tsx
{deadlines.length > 0 && (
  <span data-testid="deadline-progress" className="text-sm text-muted-foreground">
    {completedCount} of {totalCount} milestones complete
  </span>
)}
```
Import `CalendarX` from `lucide-react`.

---

### MOD-DLES-014 — Fix Deadlines Page Empty State

**File**: `app/src/routes/deadlines.tsx`
**Current** (line 206-208): Plain text paragraph

**Replace with**:
```tsx
<EmptyState
  icon={CheckCircle2}
  title="All caught up"
  description="No pending deadlines across your active cases."
/>
```
Import `CheckCircle2` from `lucide-react` and `EmptyState` from `@/components/ui/empty-state`.

---

### MOD-DLES-015 — Fix Dashboard Authenticated Empty State

**File**: `app/src/routes/index.tsx`
**Current** (line 52-70): Text + single New Case button

**Replace the authenticated empty state**:
```tsx
// When user has no cases (cases list missing — to be added):
<EmptyState
  icon={LayoutDashboard}
  title="No cases yet"
  description="Create your first estate case to start computing inheritance distributions."
  action={{
    label: "Create First Case",
    onClick: () => navigate({ to: '/cases/new' })
  }}
/>
```
Note: The dashboard authenticated view is also missing the cases list entirely (gap from journey-return-visit: JRV-001). This empty state covers the initial state after the cases list feature is added. Import `LayoutDashboard` from `lucide-react`.

---

### MOD-DLES-016 — Fix Team Page No-Organization Empty State

**File**: `app/src/routes/settings/team.tsx`
**Current** (line 41-46): Plain paragraph

**Replace with**:
```tsx
if (!organization) {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <EmptyState
        icon={Building2}
        title="No organization found"
        description="You need an organization to manage team members. Complete your firm profile setup first."
        action={{
          label: "Set Up Firm Profile",
          onClick: () => navigate({ to: '/settings' })
        }}
      />
    </div>
  )
}
```
Import `Building2` from `lucide-react`. Requires `useNavigate` from `@tanstack/react-router`.

---

## Part 6: Computing State Polish

### MOD-DLES-017 — Computing Phase Visual

**File**: `app/src/routes/cases/$caseId.tsx`
**Current** (line 96-103): Hand-rolled border spinner + "Computing distribution..."

**Replace with** (uses Loader2, adds animated step progress):
```tsx
{state.phase === 'computing' && (
  <div className="flex flex-col items-center justify-center py-20">
    <div className="relative mb-6">
      <div className="h-16 w-16 rounded-full border-4 border-muted" />
      <Loader2 className="h-16 w-16 animate-spin text-primary absolute inset-0" />
    </div>
    <p className="font-medium text-sm mb-1">Computing distribution...</p>
    <p className="text-xs text-muted-foreground">Applying Philippine succession law rules</p>
  </div>
)}
```
Import `Loader2` from `lucide-react` (replacing hand-rolled CSS spinner). The outer circle gives a "track" for the spinner to rotate on, matching modern loading animations.

---

## Gap Inventory Summary

### Loading State Gaps

| Gap ID | File | Type | Severity |
|--------|------|------|----------|
| GLS-001 | `components/intake/IntakeReviewStep.tsx` | Missing submitting state | HIGH |
| GLS-002 | `components/settings/FirmProfileForm.tsx` | Missing saving spinner in button | HIGH |
| GLS-003 | `components/case/NoteEditor.tsx` | Missing saving spinner in button | MEDIUM |
| GLS-004 | `components/settings/InviteMemberDialog.tsx` | Missing invite-in-flight state | HIGH |
| LS-003 | `components/clients/ClientList.tsx` | Plain text → skeleton rows | HIGH |
| LS-008 | `routes/cases/$caseId.tsx` | Hand-rolled spinner → skeleton | MEDIUM |
| LS-010 | `routes/share/$token.tsx` | Missing spinner in loading card | MEDIUM |
| LS-012 | `components/case/DocumentChecklist.tsx` | Plain text → skeleton rows | HIGH |
| LS-013 | `routes/settings/team.tsx` | Plain text → skeleton layout | HIGH |

### Empty State Gaps

| Gap ID | File | Empty Trigger | Severity |
|--------|------|---------------|----------|
| GES-001 | `components/clients/ClientList.tsx` | clients=[] | HIGH |
| GES-002 | `components/case/CaseNotesPanel.tsx` | notes=[] | MEDIUM |
| GES-003 | `components/settings/TeamMemberList.tsx` | members=[] | MEDIUM |
| GES-004 | `components/case/DocumentChecklist.tsx` | documents=[] | HIGH |
| GES-005 | `components/case/DeadlineTimeline.tsx` | deadlines=[] | MEDIUM |
| GES-006 | `routes/clients/$clientId.tsx` | No linked cases stub | LOW |
| GES-007 | `routes/share/$token.tsx` | Results content stub | CRITICAL (broken view) |
| GES-008 | `routes/settings/team.tsx` | No organization | MEDIUM |

### New Components Required

| Component | File | Purpose |
|-----------|------|---------|
| `Skeleton` | `components/ui/skeleton.tsx` | Shimmer placeholder for loading states |
| `EmptyState` | `components/ui/empty-state.tsx` | Reusable empty state with icon+text+CTA |
