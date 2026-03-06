# Analysis: Sharing — Token-Based Read-Only Computation Sharing

**Wave:** 5 — Frontend Data Model + UI Design
**Aspect:** sharing
**Date:** 2026-03-06
**Sources:** database-migrations.md, route-table.md, computation-management.md, results-view.md

---

## Overview

Sharing allows an authenticated user to generate a public link that lets anyone — without
signing in — view a single computation's results. The link is:

```
https://retirementpay.app/share/550e8400-e29b-41d4-a716-446655440000
```

The token is a UUID stored in the `shared_links.token` column. The public page fetches the
computation via the `get_shared_computation(p_token UUID)` RPC, which bypasses RLS via
`SECURITY DEFINER` and is granted to the `anon` Supabase role.

**Critical inheritance lesson applied:** The RPC parameter is `UUID` type (not `TEXT`). The
frontend passes a UUID string. Type mismatch causes silent empty results — this spec explicitly
prevents it by typing both sides as UUID.

---

## 1. User Flow

### 1a. Creating a Share Link (Owner Flow)

1. User is on `/compute/$id/results` (authenticated)
2. User clicks "Share" button in `ResultsActionsRow`
3. `ShareDialog` opens (a shadcn `<Dialog>`)
4. Dialog shows a spinner while checking for an existing share link
5. If no existing link: shows "Generate Share Link" primary button
6. User clicks "Generate Share Link":
   a. Frontend inserts row into `shared_links` table via Supabase client
   b. Frontend updates the computation `status` from `'computed'` to `'shared'`
   c. Dialog shows the full share URL in a read-only input
   d. "Copy Link" button copies to clipboard
   e. Toast: "Link copied to clipboard" (success variant)
7. If existing link: shows the URL immediately (from the `shared_links` row)
8. "Revoke Link" button deletes the `shared_links` row and sets computation `status` back to `'computed'`

### 1b. Accessing a Shared Computation (Recipient Flow)

1. Recipient opens `https://retirementpay.app/share/<UUID>`
2. `SharedResultsPage` mounts (no auth required)
3. Page calls `supabase.rpc('get_shared_computation', { p_token: token })` (as `anon` role)
4. If data returned: renders `SharedResultsView` with full computation breakdown
5. If null returned: renders `InvalidShareLinkView` ("This link is invalid or has been revoked")
6. Page header shows logo + "Create Your Own Computation" link → `/auth/sign-up`

---

## 2. Database Layer

The `shared_links` table and `get_shared_computation` RPC are fully specified in
`database-migrations.md`. Key details:

```sql
CREATE TABLE IF NOT EXISTS public.shared_links (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  computation_id   UUID NOT NULL REFERENCES public.computations(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token            UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (computation_id)  -- One share link per computation; creating a new one revokes the old
);
```

**RPC** (anon-accessible via `GRANT EXECUTE TO anon`):
```sql
CREATE OR REPLACE FUNCTION public.get_shared_computation(p_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
```

**Critical:** `shared_links.token` is `UUID` type. The RPC parameter `p_token` is `UUID`. The
frontend extracts the token from the URL as a string and passes it directly — Supabase converts
UUID strings automatically when the parameter type is declared `UUID`.

---

## 3. TypeScript Types

```typescript
// src/lib/types/sharing.ts

interface SharedLink {
  id: string              // UUID
  computationId: string   // UUID
  userId: string          // UUID
  token: string           // UUID — used as the URL token
  createdAt: string       // ISO 8601
}

interface SharedComputationData {
  id: string                    // UUID — computation id
  title: string
  input: RetirementInput        // parsed from JSONB
  output: RetirementOutput      // always present (null would indicate invalid state)
  status: 'shared'              // always 'shared' for valid shared computations
  createdAt: string             // ISO 8601
  updatedAt: string             // ISO 8601
}
```

---

## 4. Zod Schemas

```typescript
// src/lib/schemas/sharing.ts
import { z } from 'zod'
import { RetirementInputSchema } from './retirement'
import { RetirementOutputSchema } from './retirement'

export const SharedLinkSchema = z.object({
  id: z.string().uuid(),
  computationId: z.string().uuid(),
  userId: z.string().uuid(),
  token: z.string().uuid(),
  createdAt: z.string().datetime(),
}).strict()

export const SharedComputationDataSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  input: RetirementInputSchema,
  output: RetirementOutputSchema,
  status: z.literal('shared'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).strict()

export type SharedLink = z.infer<typeof SharedLinkSchema>
export type SharedComputationData = z.infer<typeof SharedComputationDataSchema>
```

---

## 5. Supabase Client Operations

### 5a. Check for Existing Share Link

```typescript
// src/lib/sharing.ts

export async function getShareLink(computationId: string): Promise<SharedLink | null> {
  const { data, error } = await supabase
    .from('shared_links')
    .select('*')
    .eq('computation_id', computationId)
    .maybeSingle()

  if (error) throw new Error(`Failed to fetch share link: ${error.message}`)
  if (!data) return null

  return {
    id: data.id,
    computationId: data.computation_id,
    userId: data.user_id,
    token: data.token,
    createdAt: data.created_at,
  }
}
```

### 5b. Create Share Link

```typescript
export async function createShareLink(
  computationId: string,
  userId: string
): Promise<SharedLink> {
  // Insert into shared_links (UNIQUE on computation_id — replaces any existing row)
  const { data: linkData, error: linkError } = await supabase
    .from('shared_links')
    .insert({ computation_id: computationId, user_id: userId })
    .select()
    .single()

  if (linkError) throw new Error(`Failed to create share link: ${linkError.message}`)

  // Update computation status to 'shared'
  const { error: updateError } = await supabase
    .from('computations')
    .update({ status: 'shared' })
    .eq('id', computationId)
    .eq('user_id', userId)

  if (updateError) throw new Error(`Failed to update computation status: ${updateError.message}`)

  return {
    id: linkData.id,
    computationId: linkData.computation_id,
    userId: linkData.user_id,
    token: linkData.token,
    createdAt: linkData.created_at,
  }
}
```

### 5c. Revoke Share Link

```typescript
export async function revokeShareLink(
  computationId: string,
  userId: string
): Promise<void> {
  // Delete the share link row
  const { error: deleteError } = await supabase
    .from('shared_links')
    .delete()
    .eq('computation_id', computationId)
    .eq('user_id', userId)

  if (deleteError) throw new Error(`Failed to revoke share link: ${deleteError.message}`)

  // Reset computation status to 'computed'
  const { error: updateError } = await supabase
    .from('computations')
    .update({ status: 'computed' })
    .eq('id', computationId)
    .eq('user_id', userId)

  if (updateError) throw new Error(`Failed to update computation status: ${updateError.message}`)
}
```

### 5d. Fetch Shared Computation (Anon/Public)

```typescript
export async function fetchSharedComputation(
  token: string
): Promise<SharedComputationData | null> {
  const { data, error } = await supabase.rpc('get_shared_computation', {
    p_token: token,  // UUID string — matches UUID parameter type in RPC
  })

  if (error) throw new Error(`Failed to fetch shared computation: ${error.message}`)
  if (!data) return null  // null = token not found, revoked, or computation not 'shared'

  // Validate and parse the returned JSONB
  const parsed = SharedComputationDataSchema.safeParse(data)
  if (!parsed.success) throw new Error('Invalid shared computation data from server')
  return parsed.data
}
```

---

## 6. Hook: `useSharing`

```typescript
// src/hooks/useSharing.ts
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { getShareLink, createShareLink, revokeShareLink } from '@/lib/sharing'
import type { SharedLink } from '@/lib/types/sharing'

interface UseSharingReturn {
  shareLink: SharedLink | null
  shareUrl: string | null
  isLoading: boolean
  isCreating: boolean
  isRevoking: boolean
  createLink: () => Promise<void>
  revokeLink: () => Promise<void>
  copyLink: () => void
}

export function useSharing(computationId: string, userId: string): UseSharingReturn {
  const [shareLink, setShareLink] = useState<SharedLink | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isRevoking, setIsRevoking] = useState(false)

  // Derive full URL from token
  const shareUrl = shareLink
    ? `${window.location.origin}/share/${shareLink.token}`
    : null

  // Load existing share link on mount
  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    getShareLink(computationId)
      .then((link) => { if (!cancelled) setShareLink(link) })
      .catch(() => { if (!cancelled) toast.error('Failed to check share status') })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [computationId])

  const createLink = useCallback(async () => {
    setIsCreating(true)
    try {
      const link = await createShareLink(computationId, userId)
      setShareLink(link)
      toast.success('Share link created')
    } catch {
      toast.error('Failed to create share link')
    } finally {
      setIsCreating(false)
    }
  }, [computationId, userId])

  const revokeLink = useCallback(async () => {
    setIsRevoking(true)
    try {
      await revokeShareLink(computationId, userId)
      setShareLink(null)
      toast.success('Share link revoked')
    } catch {
      toast.error('Failed to revoke share link')
    } finally {
      setIsRevoking(false)
    }
  }, [computationId, userId])

  const copyLink = useCallback(() => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    toast.success('Link copied to clipboard')
  }, [shareUrl])

  return { shareLink, shareUrl, isLoading, isCreating, isRevoking, createLink, revokeLink, copyLink }
}
```

---

## 7. Component: `ShareDialog`

**File:** `src/components/sharing/ShareDialog.tsx`
**Parent:** `ResultsActionsRow` in `ComputationResultsPage`
**Trigger:** "Share" button (variant="outline", icon: `Share2` from lucide-react)

```typescript
// src/components/sharing/ShareDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Share2, Copy, Trash2, Loader2, LinkIcon } from 'lucide-react'
import { useSharing } from '@/hooks/useSharing'
import { useAuth } from '@/contexts/AuthContext'

interface ShareDialogProps {
  computationId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShareDialog({ computationId, open, onOpenChange }: ShareDialogProps) {
  const { user } = useAuth()
  const { shareLink, shareUrl, isLoading, isCreating, isRevoking, createLink, revokeLink, copyLink } = useSharing(computationId, user!.id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Computation
          </DialogTitle>
          <DialogDescription>
            Anyone with the link can view this computation result (read-only, no login required).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : shareUrl ? (
            <>
              <Alert variant="default" className="border-emerald-200 bg-emerald-50">
                <LinkIcon className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-emerald-700">
                  Share link is active. Anyone with this link can view the results.
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="font-mono text-sm bg-slate-50"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyLink}
                  aria-label="Copy link"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <Alert variant="default" className="border-slate-200">
              <Share2 className="h-4 w-4 text-slate-500" />
              <AlertDescription className="text-slate-600">
                No share link yet. Generate one to share this computation.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {shareUrl ? (
            <>
              <Button
                variant="outline"
                onClick={revokeLink}
                disabled={isRevoking}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                {isRevoking ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Revoke Link
              </Button>
              <Button onClick={copyLink}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
            </>
          ) : (
            <Button
              onClick={createLink}
              disabled={isCreating}
              className="w-full sm:w-auto"
            >
              {isCreating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="mr-2 h-4 w-4" />
              )}
              Generate Share Link
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

**State in parent `ComputationResultsPage`:**
```typescript
const [shareDialogOpen, setShareDialogOpen] = useState(false)

// In ResultsActionsRow:
<Button variant="outline" onClick={() => setShareDialogOpen(true)}>
  <Share2 className="mr-2 h-4 w-4" />
  Share
</Button>
<ShareDialog
  computationId={computation.id}
  open={shareDialogOpen}
  onOpenChange={setShareDialogOpen}
/>
```

---

## 8. Page: `SharedResultsPage`

**File:** `src/pages/share/SharedResultsPage.tsx`
**Route:** `/share/$token`
**Auth:** None (public)
**Layout:** `SharedLayout` — minimal header with logo + "Create Your Own" CTA

```typescript
// src/pages/share/SharedResultsPage.tsx
import { useParams } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { fetchSharedComputation } from '@/lib/sharing'
import type { SharedComputationData } from '@/lib/types/sharing'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { SharedResultsView } from '@/components/sharing/SharedResultsView'
import { InvalidShareLinkView } from '@/components/sharing/InvalidShareLinkView'
import { LoadingView } from '@/components/ui/LoadingView'

export function SharedResultsPage() {
  const { token } = useParams({ from: '/share/$token' })
  const [data, setData] = useState<SharedComputationData | null | undefined>(undefined)
  // undefined = loading, null = not found, object = success

  useEffect(() => {
    fetchSharedComputation(token)
      .then(setData)
      .catch(() => setData(null))
  }, [token])

  return (
    <SharedLayout>
      {data === undefined && <LoadingView message="Loading computation..." />}
      {data === null && <InvalidShareLinkView />}
      {data !== null && data !== undefined && <SharedResultsView data={data} />}
    </SharedLayout>
  )
}
```

---

## 9. Component: `SharedLayout`

**File:** `src/components/layout/SharedLayout.tsx`

```typescript
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Scale } from 'lucide-react'

export function SharedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold text-slate-800">
            <Scale className="h-5 w-5 text-emerald-600" />
            RetirementPay.ph
          </Link>
          <Button asChild size="sm">
            <Link to="/auth/sign-up">Create Your Own</Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        {children}
      </main>
    </div>
  )
}
```

---

## 10. Component: `SharedResultsView`

**File:** `src/components/sharing/SharedResultsView.tsx`

Renders the computation results in read-only mode — same data as `ComputationResultsPage`
but without the edit/share/delete action buttons.

```typescript
import type { SharedComputationData } from '@/lib/types/sharing'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PayBreakdownCard } from '@/components/results/PayBreakdownCard'
import { EligibilityCard } from '@/components/results/EligibilityCard'
import { TaxTreatmentAlert } from '@/components/results/TaxTreatmentAlert'
import { SeparationPayCard } from '@/components/results/SeparationPayCard'
import { ComparisonCard } from '@/components/results/ComparisonCard'
import { formatMoney } from '@/lib/format'

interface SharedResultsViewProps {
  data: SharedComputationData
}

export function SharedResultsView({ data }: SharedResultsViewProps) {
  const { input, output } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {data.title || `${input.employeeName} — Retirement Computation`}
            </h1>
            <p className="text-slate-500 mt-1">
              Shared computation · RA 7641 Retirement Pay · Read-only
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">Shared</Badge>
        </div>
      </div>

      {/* Eligibility */}
      <EligibilityCard result={output.eligibility} />

      {/* If ineligible, show reason and stop */}
      {!output.eligibility.isEligible && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <p className="text-amber-700">{output.eligibility.ineligibilityReason}</p>
          </CardContent>
        </Card>
      )}

      {/* If eligible, show full breakdown */}
      {output.eligibility.isEligible && (
        <>
          {/* Headline amount */}
          <Card className="border-emerald-200 bg-emerald-50">
            <CardHeader>
              <CardTitle className="text-emerald-700">Total Retirement Pay</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-emerald-700">
                {formatMoney(output.retirementPay)}
              </p>
              <p className="text-sm text-emerald-600 mt-1">
                {output.creditedYears} credited years × {formatMoney(output.halfMonthSalary)} per year
              </p>
            </CardContent>
          </Card>

          <PayBreakdownCard output={output} />
          <TaxTreatmentAlert taxTreatment={output.taxTreatment} />
          <SeparationPayCard comparison={output.separationPayComparison} />
          {output.companyPlanGap && <ComparisonCard gap={output.companyPlanGap} />}
        </>
      )}

      {/* 15-day vs 22.5-day comparison visual */}
      <ComparisonCard
        title="Common Employer Error"
        leftLabel="15-Day Computation (Incorrect)"
        leftAmount={output.commonMiscalculation}
        rightLabel="22.5-Day Computation (Correct RA 7641)"
        rightAmount={output.retirementPay}
        highlightRight
      />

      {/* Legal notice */}
      <Card className="border-slate-200">
        <CardContent className="pt-4 pb-4">
          <p className="text-xs text-slate-500">
            This computation is based on RA 7641 (Retirement Pay Law) and assumes the 22.5-day
            formula confirmed in <em>Elegir v. Philippine Airlines, Inc.</em> (G.R. No. 181995,
            July 16, 2012). For legal advice, consult a labor law practitioner.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 11. Component: `InvalidShareLinkView`

**File:** `src/components/sharing/InvalidShareLinkView.tsx`

```typescript
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { LinkOff } from 'lucide-react'

export function InvalidShareLinkView() {
  return (
    <Card className="border-red-200">
      <CardContent className="pt-8 pb-8 text-center space-y-4">
        <div className="flex justify-center">
          <LinkOff className="h-12 w-12 text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-slate-700">
          This link is invalid or has been revoked
        </h2>
        <p className="text-slate-500 max-w-sm mx-auto">
          The share link may have expired or the owner may have revoked access.
          Contact the person who shared it with you for a new link.
        </p>
        <Button asChild variant="outline">
          <Link to="/auth/sign-up">Create Your Own Computation</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
```

---

## 12. Action Trigger Map for Sharing

| Action | Button | Parent Component | onClick | Feedback |
|--------|--------|-----------------|---------|---------|
| Open share dialog | `<Button variant="outline">Share</Button>` | `ResultsActionsRow` (in `ComputationResultsPage`) | `setShareDialogOpen(true)` | Dialog opens |
| Generate share link | `<Button>Generate Share Link</Button>` | `ShareDialog` | `createLink()` from `useSharing` | Toast: "Share link created", URL appears in dialog |
| Copy share link | `<Button><Copy /></Button>` | `ShareDialog` | `copyLink()` from `useSharing` | Toast: "Link copied to clipboard" |
| Copy link (footer) | `<Button>Copy Link</Button>` | `ShareDialog` (footer) | `copyLink()` from `useSharing` | Toast: "Link copied to clipboard" |
| Revoke share link | `<Button className="text-red-600...">Revoke Link</Button>` | `ShareDialog` | `revokeLink()` from `useSharing` | Toast: "Share link revoked", URL disappears |

---

## 13. `LoadingView` Component (reused)

**File:** `src/components/ui/LoadingView.tsx`

```typescript
import { Loader2 } from 'lucide-react'

interface LoadingViewProps {
  message: string
}

export function LoadingView({ message }: LoadingViewProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      <p className="text-slate-500">{message}</p>
    </div>
  )
}
```

---

## 14. Supabase Anon Role Requirement

This is the single most important gotcha for the sharing feature (from inheritance app Lesson 3):

```sql
-- Without this, get_shared_computation returns empty/null for ALL callers
-- because the anon role has no EXECUTE permission
GRANT EXECUTE ON FUNCTION public.get_shared_computation(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_shared_computation(UUID) TO authenticated;
```

**Verification query (run after migration):**
```sql
SELECT has_function_privilege('anon', 'public.get_shared_computation(uuid)', 'execute');
-- Must return: true
```

If this returns `false`, the `/share/$token` page will always show `InvalidShareLinkView`
even for valid tokens, with no error in the console.

---

## 15. File Locations Summary

```
apps/retirement-pay/frontend/src/
├── lib/
│   ├── sharing.ts                    # getShareLink, createShareLink, revokeShareLink, fetchSharedComputation
│   └── types/
│       └── sharing.ts                # SharedLink, SharedComputationData interfaces
├── hooks/
│   └── useSharing.ts                 # useSharing(computationId, userId): UseSharingReturn
├── components/
│   ├── layout/
│   │   └── SharedLayout.tsx          # Minimal public layout for /share/* pages
│   ├── sharing/
│   │   ├── ShareDialog.tsx           # Dialog opened from ResultsActionsRow
│   │   ├── SharedResultsView.tsx     # Full read-only results display
│   │   └── InvalidShareLinkView.tsx  # Invalid/revoked token error state
│   └── ui/
│       └── LoadingView.tsx           # Spinner + message (reused across app)
└── pages/
    └── share/
        └── SharedResultsPage.tsx     # Route component for /share/$token
```

---

## Summary

The sharing feature is a complete token-based read-only sharing system:

- **Token**: UUID stored in `shared_links.token`, used directly as the URL path segment
- **Database**: `shared_links` table with `UNIQUE (computation_id)` constraint (one link per computation)
- **RPC**: `get_shared_computation(p_token UUID)` — `SECURITY DEFINER`, `anon` role granted `EXECUTE`
- **Frontend**: `useSharing` hook manages all state; `ShareDialog` component for owner; `SharedResultsPage` for recipients
- **Type safety**: Token is `UUID` type end-to-end (DB column → RPC parameter → frontend string)
- **No auth required**: `/share/$token` route is fully public; Supabase called with anon credentials
- **Status sync**: Creating a link sets computation `status = 'shared'`; revoking sets it back to `'computed'`
- **One link per computation**: `UNIQUE (computation_id)` on `shared_links` means generating a new link automatically replaces the old token
