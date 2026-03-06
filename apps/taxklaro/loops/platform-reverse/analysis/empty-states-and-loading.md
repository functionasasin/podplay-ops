# Empty States and Loading — TaxKlaro

**Wave:** 5 (Component Wiring + UI)
**Status:** COMPLETE
**Date:** 2026-03-06
**Depends on:** component-wiring-map, route-table, computation-management, visual-verification-checklist

---

## Summary

Every async page in TaxKlaro must have three states beyond "loaded with data": skeleton loader (data in-flight), error state (data fetch failed), and empty state (data loaded but zero items). This file specifies all three for every applicable page/component, with exact shadcn/ui wrappers, Tailwind classes, lucide-react icons, messages, and CTA actions.

**Shared EmptyState component:** `src/components/shared/EmptyState.tsx` — used across all pages with configurable props (no per-page duplicates).

---

## 1. Shared EmptyState Component Spec

### `EmptyState.tsx`

```typescript
interface EmptyStateProps {
  icon: LucideIcon;              // lucide-react icon component
  title: string;                 // bold heading
  description: string;           // muted subtext
  ctaLabel?: string;             // primary button label
  onCta?: () => void;            // primary button handler
  secondaryCtaLabel?: string;    // optional secondary link text
  onSecondaryCta?: () => void;   // secondary button handler
  className?: string;
}
```

**Structure:**
```tsx
<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
    <Icon className="w-8 h-8 text-muted-foreground" />
  </div>
  <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
  <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
  {ctaLabel && (
    <Button onClick={onCta} className="mb-2">{ctaLabel}</Button>
  )}
  {secondaryCtaLabel && (
    <Button variant="ghost" onClick={onSecondaryCta}>{secondaryCtaLabel}</Button>
  )}
</div>
```

**Minimum class check:** PASS (6+ Tailwind classes on root element).

---

## 2. Shared ErrorState Component Spec

### `ErrorState.tsx`

```typescript
interface ErrorStateProps {
  title?: string;                // defaults to "Something went wrong"
  message?: string;              // optional specific error message
  onRetry?: () => void;          // retry button handler
  className?: string;
}
```

**Structure:**
```tsx
<Alert variant="destructive" className="my-6">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>{title ?? 'Something went wrong'}</AlertTitle>
  <AlertDescription className="mt-2">
    {message ?? 'Unable to load data. Please check your connection and try again.'}
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry} className="mt-3 block">
        Try again
      </Button>
    )}
  </AlertDescription>
</Alert>
```

**Minimum class check:** PASS (shadcn Alert handles visual design; `my-6` + `mt-2` + `mt-3` + `block` = 4 classes).

---

## 3. Page-by-Page Specification

### 3.1 Dashboard Page (`/`)

**Component:** `DashboardPage.tsx`
**Async data:** Recent computations (last 5) + upcoming deadlines (next 3)

#### Skeleton
Three skeleton cards in a grid:
```tsx
// RecentComputationsSkeleton
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {Array.from({ length: 3 }).map((_, i) => (
    <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  ))}
</div>
```

Two skeleton deadline rows:
```tsx
// UpcomingDeadlinesSkeleton
<div className="space-y-2">
  {Array.from({ length: 2 }).map((_, i) => (
    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  ))}
</div>
```

#### Error State
```
icon: AlertCircle (destructive)
title: "Unable to load dashboard"
message: "Could not fetch your recent computations. Please refresh the page."
onRetry: () => window.location.reload()
```

#### Empty States

**No computations yet:**
```
icon: Calculator
title: "No computations yet"
description: "Start by creating your first tax computation for a client."
ctaLabel: "New Computation"
onCta: () => navigate({ to: '/computations/new' })
```

**No upcoming deadlines:**
```
icon: Calendar
title: "No upcoming deadlines"
description: "Deadlines will appear here as you finalize computations."
ctaLabel: undefined (no CTA)
```

---

### 3.2 Computations List Page (`/computations`)

**Component:** `ComputationsPage.tsx`
**Async data:** All computations for current org, filtered by status + tax year

#### Skeleton
`ComputationCardSkeleton.tsx` — used while loading:
```tsx
<div className="rounded-lg border bg-card p-4 space-y-3 animate-pulse">
  <div className="flex items-start justify-between">
    <Skeleton className="h-5 w-2/3" />
    <Skeleton className="h-5 w-16 rounded-full" />
  </div>
  <Skeleton className="h-4 w-1/2" />
  <div className="flex gap-2 mt-2">
    <Skeleton className="h-4 w-20" />
    <Skeleton className="h-4 w-16" />
  </div>
</div>
```

Grid of 6 skeleton cards rendered while loading:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {Array.from({ length: 6 }).map((_, i) => (
    <ComputationCardSkeleton key={i} />
  ))}
</div>
```

**Minimum class check:** PASS (`rounded-lg border bg-card p-4 space-y-3 animate-pulse` = 6 classes).

#### Error State
```
title: "Unable to load computations"
message: "There was a problem fetching your computations. Please try again."
onRetry: () => refetch()
```
Rendered inside `<ErrorState>` below the `FilterBar`.

#### Empty States

**No computations (no filters applied):**
```
icon: FileText
title: "No computations yet"
description: "Create a computation to get BIR-compliant tax analysis for any freelancer or self-employed client."
ctaLabel: "New Computation"
onCta: () => navigate({ to: '/computations/new' })
```

**No computations matching current filter:**
```
icon: SearchX
title: "No results"
description: "No computations match the selected filters. Try adjusting your status or tax year filters."
ctaLabel: "Clear filters"
onCta: () => { setStatusFilter('all'); setTaxYearFilter('all'); }
```

---

### 3.3 Computation Detail Page (`/computations/$compId`)

**Component:** `ComputationDetailPage.tsx`
**Async data:** Single computation (input + output JSON, notes, deadlines)

#### Skeleton
Full-page skeleton while computation loads:
```tsx
<div className="space-y-6">
  {/* Header skeleton */}
  <div className="flex items-center justify-between">
    <div className="space-y-2">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-40" />
    </div>
    <Skeleton className="h-9 w-32" />
  </div>
  {/* Tab skeleton */}
  <div className="flex gap-2 border-b pb-0">
    <Skeleton className="h-9 w-24" />
    <Skeleton className="h-9 w-24" />
    <Skeleton className="h-9 w-24" />
  </div>
  {/* Content skeleton — matches ResultsView layout */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="rounded-lg border bg-card p-5 space-y-3">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
      </div>
    ))}
  </div>
</div>
```

#### Error State
**Computation not found (404):**
```tsx
<EmptyState
  icon={FileQuestion}
  title="Computation not found"
  description="This computation doesn't exist or you don't have access to it."
  ctaLabel="Back to computations"
  onCta={() => navigate({ to: '/computations' })}
/>
```

**Load error:**
```
<ErrorState
  title="Unable to load computation"
  message="There was a problem loading this computation."
  onRetry={() => refetch()}
/>
```

#### Empty States

**No results yet (status = 'draft'):**
Computation detail tabs when output_json is null — shown in the Results tab:
```tsx
<EmptyState
  icon={Calculator}
  title="Not computed yet"
  description="Fill in the wizard inputs and click 'Compute' to see the tax analysis."
  ctaLabel="Edit inputs"
  onCta={() => setActiveTab('inputs')}
/>
```

**No notes yet:**
```tsx
<EmptyState
  icon={MessageSquare}
  title="No notes yet"
  description="Add notes to track decisions, client discussions, or BIR instructions."
  ctaLabel={undefined}
/>
```

**No deadlines yet:**
```tsx
<EmptyState
  icon={Calendar}
  title="No deadlines set"
  description="Deadlines are calculated based on the computation's tax year and filing type."
  ctaLabel={undefined}
/>
```

---

### 3.4 Clients List Page (`/clients`)

**Component:** `ClientsPage.tsx`
**Async data:** All clients for current org

#### Skeleton
`ClientRowSkeleton.tsx` — used in the table while loading:
```tsx
<tr className="border-b">
  <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
  <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
  <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
  <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
  <td className="px-4 py-3"><Skeleton className="h-4 w-8" /></td>
</tr>
```

Render 8 skeleton rows inside `<ClientsTable>` while loading.

**Minimum class check:** PASS (`border-b` on tr, `px-4 py-3` on each td — PASS when checking ClientsTable container `rounded-lg border overflow-hidden`).

#### Error State
```
title: "Unable to load clients"
message: "There was a problem fetching your client directory."
onRetry: () => refetch()
```

#### Empty State

**No clients yet:**
```tsx
<EmptyState
  icon={Users}
  title="No clients yet"
  description="Add your first client to start creating computations on their behalf."
  ctaLabel="Add client"
  onCta={() => navigate({ to: '/clients/new' })}
/>
```

**No clients matching search:**
```tsx
<EmptyState
  icon={SearchX}
  title="No clients found"
  description="No clients match your search. Try a different name or TIN."
  ctaLabel="Clear search"
  onCta={() => setSearchQuery('')}
/>
```

---

### 3.5 Client Detail Page (`/clients/$clientId`)

**Component:** `ClientDetailPage.tsx`
**Async data:** Client profile + linked computations

#### Skeleton
```tsx
<div className="space-y-6">
  <div className="rounded-lg border bg-card p-6 space-y-4">
    <Skeleton className="h-6 w-48" />
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
  </div>
  <div className="space-y-2">
    <Skeleton className="h-5 w-40" />
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="rounded-lg border bg-card p-4 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    ))}
  </div>
</div>
```

#### Error State
**Client not found (404):**
```tsx
<EmptyState
  icon={UserX}
  title="Client not found"
  description="This client doesn't exist or you don't have access to their profile."
  ctaLabel="Back to clients"
  onCta={() => navigate({ to: '/clients' })}
/>
```

#### Empty State

**No computations for this client:**
```tsx
<EmptyState
  icon={FileText}
  title="No computations for this client"
  description="Create a computation to analyze this client's tax obligations."
  ctaLabel="New Computation"
  onCta={() => navigate({ to: '/computations/new', search: { clientId: client.id } })}
/>
```

---

### 3.6 Deadlines Page (`/deadlines`)

**Component:** `DeadlinesPage.tsx`
**Async data:** All upcoming/past deadlines across all computations for org

#### Skeleton
```tsx
<div className="space-y-3">
  {Array.from({ length: 5 }).map((_, i) => (
    <div key={i} className="flex items-start gap-4 p-4 rounded-lg border bg-card">
      <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  ))}
</div>
```

#### Error State
```
title: "Unable to load deadlines"
message: "There was a problem fetching your filing deadlines."
onRetry: () => refetch()
```

#### Empty State

**No deadlines:**
```tsx
<EmptyState
  icon={CalendarCheck}
  title="No deadlines yet"
  description="Filing deadlines appear here once computations are finalized. Finalize a computation to generate its deadline schedule."
  ctaLabel="View computations"
  onCta={() => navigate({ to: '/computations' })}
/>
```

---

### 3.7 Settings Page (`/settings`)

**Component:** `SettingsPage.tsx`
**Async data:** User profile + org profile (name, TIN, RDO, firm logo)

#### Skeleton
```tsx
<div className="space-y-6">
  {/* Personal Info section */}
  <div className="rounded-lg border bg-card p-6 space-y-4">
    <Skeleton className="h-5 w-32" />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    </div>
  </div>
  {/* Firm Branding section */}
  <div className="rounded-lg border bg-card p-6 space-y-4">
    <Skeleton className="h-5 w-40" />
    <div className="flex items-center gap-4">
      <Skeleton className="h-20 w-20 rounded-lg" />
      <Skeleton className="h-9 w-32 rounded-md" />
    </div>
  </div>
</div>
```

#### Error State
```
title: "Unable to load settings"
message: "There was a problem loading your profile. Please try again."
onRetry: () => refetch()
```

Settings have NO "empty state" — a user always has a profile (created on sign-up). If certain fields are unfilled, show them as empty form fields with placeholder values.

---

### 3.8 Team Settings Page (`/settings/team`)

**Component:** `TeamSettingsPage.tsx`
**Async data:** Organization members list + pending invitations

#### Skeleton — Members Table
```tsx
<div className="rounded-lg border overflow-hidden">
  <table className="w-full text-sm">
    <thead className="bg-muted text-muted-foreground">
      <tr>
        <th className="px-4 py-3 text-left">Member</th>
        <th className="px-4 py-3 text-left">Role</th>
        <th className="px-4 py-3 text-left">Joined</th>
        <th className="px-4 py-3" />
      </tr>
    </thead>
    <tbody className="divide-y">
      {Array.from({ length: 3 }).map((_, i) => (
        <tr key={i}>
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          </td>
          <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
          <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
          <td className="px-4 py-3"><Skeleton className="h-7 w-7 rounded-md" /></td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

#### Skeleton — Pending Invitations
```tsx
<div className="space-y-2">
  {Array.from({ length: 2 }).map((_, i) => (
    <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card">
      <div className="space-y-1">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-7 w-16 rounded-md" />
    </div>
  ))}
</div>
```

#### Error State
```
title: "Unable to load team"
message: "There was a problem fetching your team members."
onRetry: () => refetch()
```

#### Empty State

**No other members (solo org — always has the admin):**
Settings team always shows at least the current user, so this state appears only when plan = FREE (solo):
```tsx
<EmptyState
  icon={UserPlus}
  title="Team features are not available on your plan"
  description="Upgrade to Enterprise to add team members and collaborate on computations."
  ctaLabel="View plans"
  onCta={() => navigate({ to: '/settings', search: { section: 'billing' } })}
/>
```

**No pending invitations:**
No separate empty state — the `PendingInvitationsTable` section is simply hidden when `pendingInvitations.length === 0` (not rendered at all).

---

### 3.9 Shared Computation Page (`/share/$token`)

**Component:** `SharePage.tsx`
**Async data:** Single computation via `get_shared_computation(token)` RPC

#### Loading State
While `get_shared_computation` is in-flight, show results skeleton matching `ComputationDetailPage`:
```tsx
<div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
  <div className="space-y-2">
    <Skeleton className="h-7 w-56" />
    <Skeleton className="h-4 w-40" />
  </div>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="rounded-lg border bg-card p-5 space-y-3">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-8 w-3/4" />
      </div>
    ))}
  </div>
</div>
```

No AppLayout chrome on this page (no sidebar, no nav).

#### Not-Found State
`SharedComputationNotFound.tsx`:
```tsx
<div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
    <LinkOff className="w-8 h-8 text-muted-foreground" />
  </div>
  <h1 className="text-2xl font-bold text-foreground mb-2">Link not found or expired</h1>
  <p className="text-muted-foreground max-w-sm">
    This shared computation link is no longer active or doesn't exist.
    Please ask the sender for a new link.
  </p>
</div>
```

**Minimum class check:** PASS (`flex flex-col items-center justify-center min-h-screen px-4 text-center` = 6 classes).

#### Share-Disabled State
If the RPC returns a result with `shareEnabled: false` (edge case — token exists but owner disabled sharing):
Same `SharedComputationNotFound` component, same message. The RPC returns null in this case (SECURITY DEFINER only returns rows where `share_enabled = true`), so no separate UI needed.

---

### 3.10 Auth Callback Page (`/auth/callback`)

**Component:** `AuthCallbackPage.tsx`
**Async data:** Code exchange (PKCE) — can succeed or fail

#### Loading State
```tsx
<div className="flex flex-col items-center justify-center min-h-screen gap-4">
  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  <p className="text-sm text-muted-foreground">Confirming your email...</p>
</div>
```

#### Error State
```tsx
<div className="flex flex-col items-center justify-center min-h-screen px-4 text-center gap-4">
  <Alert variant="destructive" className="max-w-md">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Email confirmation failed</AlertTitle>
    <AlertDescription>
      The confirmation link has expired or is invalid. Please request a new one.
      <Button variant="outline" size="sm" className="mt-3 block" onClick={() => navigate({ to: '/auth' })}>
        Back to sign in
      </Button>
    </AlertDescription>
  </Alert>
</div>
```

---

### 3.11 Invite Accept Page (`/invite/$token`)

**Component:** `InviteAcceptPage.tsx`
**Async data:** Invitation details from `accept_invitation(token)` RPC

#### Loading State
```tsx
<div className="flex flex-col items-center justify-center min-h-screen gap-4">
  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  <p className="text-sm text-muted-foreground">Loading invitation...</p>
</div>
```

#### Error States

**Invitation expired:**
```tsx
<EmptyState
  icon={Clock}
  title="Invitation expired"
  description="This invitation link has expired (invitations are valid for 7 days). Please ask your admin to send a new invitation."
  ctaLabel="Sign in to TaxKlaro"
  onCta={() => navigate({ to: '/auth' })}
/>
```

**Invitation already accepted:**
```tsx
<EmptyState
  icon={CheckCircle2}
  title="Invitation already accepted"
  description="You've already joined this organization. Sign in to access your account."
  ctaLabel="Sign in"
  onCta={() => navigate({ to: '/auth' })}
/>
```

**Invalid token:**
```tsx
<EmptyState
  icon={LinkOff}
  title="Invalid invitation link"
  description="This invitation link is not valid. Please check the link in your email or ask your admin to resend it."
  ctaLabel="Sign in to TaxKlaro"
  onCta={() => navigate({ to: '/auth' })}
/>
```

---

## 4. Skeleton Component Library

### `Skeleton` primitive (shadcn/ui)
```tsx
// src/components/ui/skeleton.tsx
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}
```

All page-specific skeleton sections above use this `Skeleton` primitive. No per-page skeleton components (they inline the skeleton JSX within the page's loading branch) EXCEPT:
- `ComputationCardSkeleton.tsx` — exported separately because it's used in both the list grid AND the dashboard `RecentComputations` widget
- `ClientRowSkeleton.tsx` — exported separately because `ClientsTable` renders it per-row

All other skeleton layouts are inline JSX in the `isLoading` branch of each page component.

---

## 5. Loading State Pattern

Every async page follows this pattern:

```tsx
function ComputationsPage() {
  const [computations, setComputations] = useState<ComputationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listComputations(org.id);
      setComputations(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [org.id]);

  useEffect(() => { loadData(); }, [loadData]);

  if (isLoading) return <ComputationsSkeletonGrid />;
  if (error) return <ErrorState title="Unable to load computations" onRetry={loadData} />;
  if (computations.length === 0) return <EmptyState ... />;

  return <ComputationsGrid computations={computations} />;
}
```

**Key rules:**
1. `isLoading` starts `true` — skeleton renders on first load, not a flash of empty state
2. `error` is reset before each `loadData()` call
3. Empty state only renders when `!isLoading && !error && data.length === 0`
4. Retry button calls `loadData()` (same function), not `window.location.reload()`
5. NO React Suspense boundaries for data fetching — explicit loading state with useState

---

## 6. lucide-react Icons Used in Empty/Error States

| Page | Empty State Icon | Import |
|------|-----------------|--------|
| Dashboard — computations | `Calculator` | `lucide-react` |
| Dashboard — deadlines | `Calendar` | `lucide-react` |
| Computations list — no data | `FileText` | `lucide-react` |
| Computations list — no filter match | `SearchX` | `lucide-react` |
| Computation detail — not found | `FileQuestion` | `lucide-react` |
| Computation detail — no results | `Calculator` | `lucide-react` |
| Computation detail — no notes | `MessageSquare` | `lucide-react` |
| Computation detail — no deadlines | `Calendar` | `lucide-react` |
| Clients list — no data | `Users` | `lucide-react` |
| Clients list — no search match | `SearchX` | `lucide-react` |
| Client detail — not found | `UserX` | `lucide-react` |
| Client detail — no computations | `FileText` | `lucide-react` |
| Deadlines — no data | `CalendarCheck` | `lucide-react` |
| Team — solo plan | `UserPlus` | `lucide-react` |
| Share — not found | `LinkOff` | `lucide-react` |
| Invite — expired | `Clock` | `lucide-react` |
| Invite — already accepted | `CheckCircle2` | `lucide-react` |
| Invite — invalid token | `LinkOff` | `lucide-react` |
| Error states (all) | `AlertCircle` | `lucide-react` |

All icons are named exports from `lucide-react`. No icon library other than lucide-react is used.

---

## 7. Premium Gating in Empty States

Some empty states have plan-aware CTAs:

**Computations list — FREE tier (5 computation limit reached):**
```tsx
<Alert variant="default" className="mb-4 border-amber-200 bg-amber-50">
  <AlertCircle className="h-4 w-4 text-amber-600" />
  <AlertTitle className="text-amber-800">Computation limit reached</AlertTitle>
  <AlertDescription className="text-amber-700">
    You've used 5/5 computations on the Free plan.{' '}
    <a href="/settings?section=billing" className="underline font-medium">Upgrade to Pro</a>{' '}
    to create unlimited computations.
  </AlertDescription>
</Alert>
```
This `Alert` renders ABOVE the computation grid (not instead of it) when `computations.length >= 5 && org.plan === 'free'`.

**New Computation page — PRO/ENTERPRISE batch feature:**
If org is on FREE and tries to create a 6th computation, `createComputation()` returns a `PLAN_LIMIT_EXCEEDED` error, which triggers:
```tsx
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Computation limit reached</AlertTitle>
  <AlertDescription>
    Upgrade your plan to create more computations.
    <Button variant="outline" size="sm" className="mt-2 block" onClick={() => navigate({ to: '/settings', search: { section: 'billing' } })}>
      View plans
    </Button>
  </AlertDescription>
</Alert>
```

---

## 8. Anti-Scaffolding Verification Points

The forward loop's Phase 7 visual check MUST verify:
1. `EmptyState.tsx` root element has 6+ Tailwind classes — FAIL if fewer
2. `ComputationCardSkeleton.tsx` root element has 6+ Tailwind classes — FAIL if fewer
3. `ClientRowSkeleton.tsx` `tr` element has at least `border-b` — FAIL if bare `<tr>`
4. `SharedComputationNotFound.tsx` root element has 6+ Tailwind classes — FAIL if fewer
5. Every page must render a skeleton before data arrives — test by adding `await new Promise(r => setTimeout(r, 5000))` to the data fetcher and verifying skeleton appears
6. Every page's error state must have a working retry button — test by mocking Supabase to throw and clicking retry

---

## 9. File List

New files created:
- `src/components/shared/EmptyState.tsx` (already in component-wiring-map)
- `src/components/shared/ErrorState.tsx` (new — not in previous wiring map)
- `src/components/computation/ComputationCardSkeleton.tsx` (already in component-wiring-map)
- `src/components/clients/ClientRowSkeleton.tsx` (already in component-wiring-map)
- `src/components/shared-computation/SharedComputationNotFound.tsx` (already in component-wiring-map)

`ErrorState.tsx` must be added to the component-wiring-map addendum:
- **Component:** `ErrorState`
- **Parent:** Every async page (ComputationsPage, ClientsPage, DeadlinesPage, SettingsPage, TeamSettingsPage, ComputationDetailPage, DashboardPage)
- **Trigger:** `error !== null` after data fetch
- **Props source:** error message + onRetry callback from each page
