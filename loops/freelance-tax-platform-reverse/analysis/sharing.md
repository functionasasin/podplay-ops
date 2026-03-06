# Sharing — TaxKlaro

**Wave:** 4 (Platform Layer)
**Status:** COMPLETE
**Date:** 2026-03-06
**Depends on:** supabase-migrations, computation-management, route-table

---

## Summary

Token-based read-only sharing for computations. A firm can generate a shareable link that allows any recipient (unauthenticated) to view the computation results without logging in. The link is based on a UUID `share_token` column, protected by a `SECURITY DEFINER` RPC that bypasses RLS for the specific public-access query. The `/share/$token` route renders a read-only ResultsView with no AppLayout chrome (no sidebar, no auth controls).

All database schema elements (`share_token`, `share_enabled`, `get_shared_computation` RPC) are already defined in `analysis/supabase-migrations.md`. This document specifies the frontend implementation: the `lib/share.ts` library, `ShareToggle` component, `/share/$token` route, `SharedComputationView` component, and clipboard integration.

---

## 1. Database Reference (from supabase-migrations.md)

Relevant columns on the `computations` table:
```
share_token   UUID NOT NULL DEFAULT gen_random_uuid()
share_enabled BOOLEAN NOT NULL DEFAULT false
```

Key points:
- `share_token` is UUID type, NOT TEXT — the RPC parameter must also be UUID.
- Every computation gets a `share_token` generated at creation time. The token is permanent — disabling sharing does NOT rotate the token. Re-enabling sharing re-uses the same token. To invalidate a leaked link, the user must manually rotate the token (see Section 7).
- `share_enabled = false` is the default. The RPC filters `AND share_enabled = true` so disabled links return no rows.

RPC (from `003_rpc_functions.sql`, already defined):
```sql
CREATE OR REPLACE FUNCTION get_shared_computation(p_token UUID)
RETURNS TABLE(
  id               UUID,
  title            TEXT,
  input_json       JSONB,
  output_json      JSONB,
  tax_year         INTEGER,
  regime_selected  TEXT,
  created_at       TIMESTAMPTZ
)
LANGUAGE SQL SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT c.id, c.title, c.input_json, c.output_json,
         c.tax_year, c.regime_selected, c.created_at
  FROM computations c
  WHERE c.share_token = p_token       -- UUID = UUID: no type mismatch
    AND c.share_enabled = true
    AND c.deleted_at IS NULL
  LIMIT 1;
$$;

-- CRITICAL: anon must be granted; SECURITY DEFINER alone is not enough for unauthenticated access
GRANT EXECUTE ON FUNCTION get_shared_computation(UUID) TO anon, authenticated;
```

---

## 2. TypeScript Type — Shared Computation

```typescript
// src/types/computation.ts (addition to existing file)

/** Shape returned by get_shared_computation RPC */
export interface SharedComputationData {
  id: string;              // UUID as string
  title: string;
  inputJson: TaxpayerInput | null;
  outputJson: TaxComputationResult | null;
  taxYear: number | null;
  regimeSelected: string | null;
  createdAt: string;       // ISO datetime
}
```

Supabase returns the RPC result in snake_case. Map immediately on load:

```typescript
// src/lib/share.ts

function mapSharedComputation(row: {
  id: string;
  title: string;
  input_json: unknown;
  output_json: unknown;
  tax_year: number | null;
  regime_selected: string | null;
  created_at: string;
}): SharedComputationData {
  return {
    id:             row.id,
    title:          row.title,
    inputJson:      row.input_json as TaxpayerInput | null,
    outputJson:     row.output_json as TaxComputationResult | null,
    taxYear:        row.tax_year,
    regimeSelected: row.regime_selected,
    createdAt:      row.created_at,
  };
}
```

---

## 3. Library — `src/lib/share.ts`

```typescript
import { supabase } from './supabase';
import type { SharedComputationData } from '@/types/computation';

// ===== FETCH SHARED COMPUTATION =====

/**
 * Fetch a computation by share token. Works without authentication.
 * Returns null if the token is invalid or sharing is disabled.
 *
 * CRITICAL: token is passed as UUID (::uuid cast via Supabase RPC params).
 * Supabase JS client sends typed params — passing a string here is fine;
 * the client encodes it as UUID for the RPC call.
 */
export async function getSharedComputation(
  token: string,
): Promise<SharedComputationData | null> {
  const { data, error } = await supabase.rpc('get_shared_computation', {
    p_token: token,   // Supabase JS client sends this as UUID type via RPC
  });

  if (error) {
    console.error('getSharedComputation error:', error);
    return null;
  }

  // RPC returns an array (RETURNS TABLE) — take first row
  const rows = data as Array<{
    id: string;
    title: string;
    input_json: unknown;
    output_json: unknown;
    tax_year: number | null;
    regime_selected: string | null;
    created_at: string;
  }>;

  if (!rows || rows.length === 0) return null;
  return mapSharedComputation(rows[0]);
}

// ===== TOGGLE SHARING =====

/**
 * Enable or disable sharing for a computation.
 * Requires authentication and org membership (enforced by RLS).
 */
export async function setShareEnabled(
  computationId: string,
  enabled: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('computations')
    .update({ share_enabled: enabled })
    .eq('id', computationId);

  if (error) throw error;
}

// ===== ROTATE SHARE TOKEN =====

/**
 * Generates a new share_token, invalidating any existing shared links.
 * Used when a share link has been leaked or user wants to revoke access.
 * Requires: user must be org member with admin or accountant role.
 */
export async function rotateShareToken(
  computationId: string,
): Promise<{ newToken: string }> {
  // Use Supabase RPC to atomically generate a new UUID and return it
  const { data, error } = await supabase.rpc('rotate_share_token', {
    p_computation_id: computationId,
  });

  if (error) throw error;
  return { newToken: data as string };
}

// ===== SHARE URL BUILDER =====

/**
 * Build the full share URL from a token.
 * Uses VITE_APP_URL from environment config.
 */
export function buildShareUrl(token: string): string {
  const appUrl = import.meta.env.VITE_APP_URL ?? window.location.origin;
  return `${appUrl}/share/${token}`;
}

// ===== CLIPBOARD =====

/**
 * Copy share URL to clipboard.
 * Returns true on success, false on failure (e.g., permissions denied).
 */
export async function copyShareUrl(token: string): Promise<boolean> {
  const url = buildShareUrl(token);
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}
```

### Additional RPC: `rotate_share_token`

Add to `supabase/migrations/003_rpc_functions.sql`:

```sql
-- ===== rotate_share_token =====
-- Generates a new share_token for a computation, invalidating old links.
-- Requires org membership (verified via RLS on computations table).
-- Returns the new token as TEXT (UUID string representation).

CREATE OR REPLACE FUNCTION rotate_share_token(p_computation_id UUID)
RETURNS TEXT
LANGUAGE plpgsql SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_new_token UUID;
BEGIN
  v_new_token := gen_random_uuid();

  UPDATE computations
  SET share_token = v_new_token
  WHERE id = p_computation_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Computation not found or access denied';
  END IF;

  RETURN v_new_token::TEXT;
END;
$$;

-- Authenticated only: only org members rotate tokens
GRANT EXECUTE ON FUNCTION rotate_share_token(UUID) TO authenticated;
```

Note: `SECURITY INVOKER` (not DEFINER) — the RLS policy on `computations` enforces that only org members can UPDATE. No DEFINER bypass needed here.

---

## 4. ShareToggle Component — `src/components/computation/ShareToggle.tsx`

**Location in UI:** Inside `ActionsBar` in `ComputationPage` (defined in `computation-management.md` Section 8). Visible only when `status === 'computed' || status === 'finalized'`.

**Props:**
```typescript
interface ShareToggleProps {
  computationId: string;
  shareToken: string;
  shareEnabled: boolean;
  onShareChange: (enabled: boolean, newToken?: string) => void;
}
```

**Visual spec:**
```
┌─────────────────────────────────────────────────┐
│  Share Results                                  │
│  [Switch: OFF/ON]  "Share a read-only link"     │
│                                                 │
│  [when enabled]                                 │
│  ┌──────────────────────────────────┐  [Copy]  │
│  │ https://taxklaro.ph/share/abc... │           │
│  └──────────────────────────────────┘           │
│  [Rotate Link] (small, destructive-outline)     │
└─────────────────────────────────────────────────┘
```

**Full component:**
```tsx
// src/components/computation/ShareToggle.tsx

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, RefreshCw, Link } from 'lucide-react';
import { toast } from 'sonner';
import { setShareEnabled, copyShareUrl, rotateShareToken, buildShareUrl } from '@/lib/share';

interface ShareToggleProps {
  computationId: string;
  shareToken: string;
  shareEnabled: boolean;
  onShareChange: (enabled: boolean, newToken?: string) => void;
}

export function ShareToggle({
  computationId,
  shareToken,
  shareEnabled,
  onShareChange,
}: ShareToggleProps) {
  const [toggling, setToggling] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [currentToken, setCurrentToken] = useState(shareToken);
  const [isEnabled, setIsEnabled] = useState(shareEnabled);

  const shareUrl = buildShareUrl(currentToken);

  async function handleToggle(checked: boolean) {
    setToggling(true);
    try {
      await setShareEnabled(computationId, checked);
      setIsEnabled(checked);
      onShareChange(checked);
      if (checked) {
        toast.success('Sharing enabled', {
          description: 'Anyone with the link can view the results.',
        });
      } else {
        toast.info('Share link disabled');
      }
    } catch {
      toast.error('Failed to update sharing', {
        description: 'Please try again.',
      });
    } finally {
      setToggling(false);
    }
  }

  async function handleCopy() {
    const success = await copyShareUrl(currentToken);
    if (success) {
      toast.success('Link copied to clipboard');
    } else {
      toast.error('Failed to copy link', {
        description: 'Please copy the URL manually.',
      });
    }
  }

  async function handleRotate() {
    setRotating(true);
    try {
      const { newToken } = await rotateShareToken(computationId);
      setCurrentToken(newToken);
      onShareChange(isEnabled, newToken);
      toast.success('Share link rotated', {
        description: 'The old link is now invalid.',
      });
    } catch {
      toast.error('Failed to rotate link');
    } finally {
      setRotating(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center gap-3">
        <Link className="h-4 w-4 text-muted-foreground" />
        <Label htmlFor="share-toggle" className="flex-1 cursor-pointer">
          <span className="font-medium">Share Results</span>
          <span className="block text-sm text-muted-foreground">
            Share a read-only link with your client
          </span>
        </Label>
        <Switch
          id="share-toggle"
          checked={isEnabled}
          onCheckedChange={handleToggle}
          disabled={toggling}
          aria-label="Toggle sharing"
        />
      </div>

      {isEnabled && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              value={shareUrl}
              readOnly
              className="flex-1 font-mono text-xs bg-background"
              aria-label="Share URL"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="shrink-0"
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRotate}
            disabled={rotating}
            className="self-start text-xs text-muted-foreground hover:text-destructive"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${rotating ? 'animate-spin' : ''}`} />
            Rotate link
          </Button>
        </div>
      )}
    </div>
  );
}
```

**Wiring in ComputationPage:** The `ShareToggle` lives inside a `Popover` or collapsible panel triggered by the "Share" button in `ActionsBar`. When `onShareChange` is called, the parent `ComputationPage` updates its local computation state with the new `shareEnabled` and `shareToken` values (no refetch needed).

```tsx
// Inside ComputationPage ActionsBar:
<Button
  variant="outline"
  size="sm"
  disabled={computation.status === 'draft'}
  onClick={() => setSharePanelOpen(true)}
>
  <Share2 className="h-4 w-4 mr-2" />
  Share
</Button>

// SharePanel is a Sheet (slide-in from right) containing ShareToggle
<Sheet open={sharePanelOpen} onOpenChange={setSharePanelOpen}>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Share Computation</SheetTitle>
      <SheetDescription>
        Generate a read-only link to share these results.
      </SheetDescription>
    </SheetHeader>
    <div className="mt-6">
      <ShareToggle
        computationId={computation.id}
        shareToken={computation.shareToken}
        shareEnabled={computation.shareEnabled}
        onShareChange={(enabled, newToken) => {
          setComputation(prev => ({
            ...prev,
            shareEnabled: enabled,
            shareToken: newToken ?? prev.shareToken,
          }));
          if (!enabled) setSharePanelOpen(false);
        }}
      />
    </div>
  </SheetContent>
</Sheet>
```

---

## 5. Share Route — `src/routes/share/$token.tsx`

**Public route** — no auth required. No AppLayout wrapper (no sidebar, no nav). Renders a branded read-only view of the computation results.

```typescript
// src/routes/share/$token.tsx

import { createFileRoute } from '@tanstack/react-router';
import { getSharedComputation } from '@/lib/share';
import { SharedComputationView } from '@/components/shared-computation/SharedComputationView';
import { SharedComputationNotFound } from '@/components/shared-computation/SharedComputationNotFound';

export const Route = createFileRoute('/share/$token')({
  // No beforeLoad auth guard — public route
  loader: async ({ params }) => {
    const data = await getSharedComputation(params.token);
    // Return null if not found — component handles the empty state
    return { data };
  },
  component: SharePage,
});

function SharePage() {
  const { data } = Route.useLoaderData();

  if (!data || !data.outputJson) {
    return <SharedComputationNotFound />;
  }

  return <SharedComputationView computation={data} />;
}
```

**Route registration** (in `src/router.ts`): `shareTokenRoute` is already listed. The route file uses `$token` as the dynamic segment.

---

## 6. SharedComputationView — `src/components/shared-computation/SharedComputationView.tsx`

Read-only results page with minimal chrome. No AppLayout, no sidebar. Includes TaxKlaro branding header and a "Get your own computation" CTA.

**Visual layout:**
```
┌─────────────────────────────────────────────────────┐
│  [TaxKlaro logo]           taxklaro.ph              │
│  Professional Tax Computation by TaxKlaro           │
├─────────────────────────────────────────────────────┤
│  {title}                                            │
│  AY {taxYear}  ·  {regimeLabel}  ·  Shared {date}  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [RegimeSummaryCard — read-only ResultsView]        │
│  [RecommendationBanner]                             │
│  [TaxBreakdownTable]                                │
│  [QuarterlySummary — if applicable]                 │
│  [ManualReviewFlags — if any]                       │
│                                                     │
├─────────────────────────────────────────────────────┤
│  ─────────── Computed with TaxKlaro ───────────     │
│  [Button: "Compute your own taxes →"]               │
│  Free for self-employed professionals in PH         │
│                                                     │
│  [Legal disclaimer text]                            │
└─────────────────────────────────────────────────────┘
```

**Component:**
```tsx
// src/components/shared-computation/SharedComputationView.tsx

import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ResultsView } from '@/components/computation/ResultsView';
import { REGIME_LABELS } from '@/lib/regime-labels';
import type { SharedComputationData } from '@/types/computation';
import { formatDate } from '@/lib/date-utils';

interface SharedComputationViewProps {
  computation: SharedComputationData;
}

export function SharedComputationView({ computation }: SharedComputationViewProps) {
  const regimeLabel = computation.regimeSelected
    ? (REGIME_LABELS[computation.regimeSelected] ?? computation.regimeSelected)
    : 'Not specified';

  return (
    <div className="min-h-screen bg-background">
      {/* Branding header */}
      <header className="border-b bg-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* TaxKlaro wordmark — same as AppLayout header */}
          <span className="font-bold text-primary text-lg">TaxKlaro</span>
          <Badge variant="outline" className="text-xs">Shared View</Badge>
        </div>
        <a
          href="/"
          className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
        >
          taxklaro.ph
          <ExternalLink className="h-3 w-3" />
        </a>
      </header>

      {/* Computation identity */}
      <div className="border-b bg-muted/20 px-4 py-4 md:px-8">
        <h1 className="text-xl font-semibold mb-1">{computation.title}</h1>
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          {computation.taxYear && (
            <span>AY {computation.taxYear}</span>
          )}
          <span>·</span>
          <span>{regimeLabel}</span>
          <span>·</span>
          <span>Shared {formatDate(computation.createdAt)}</span>
        </div>
      </div>

      {/* Results — read-only ResultsView */}
      <main className="px-4 py-6 md:px-8 max-w-4xl mx-auto">
        {computation.outputJson ? (
          <ResultsView
            result={computation.outputJson}
            readOnly={true}
          />
        ) : (
          <p className="text-muted-foreground">No results available.</p>
        )}
      </main>

      {/* CTA footer */}
      <footer className="border-t mt-8 px-4 py-8 md:px-8 text-center">
        <Separator className="mb-8" />
        <p className="text-sm text-muted-foreground mb-3">
          Computed with TaxKlaro — Philippine freelance tax computation
        </p>
        <Button asChild className="mb-3">
          <a href="/computations/new">
            Compute your own taxes
          </a>
        </Button>
        <p className="text-xs text-muted-foreground mt-3 max-w-md mx-auto">
          This computation is provided for informational purposes only and does not
          constitute tax advice. Results are based on BIR regulations applicable at
          the time of computation. Consult a licensed CPA for professional advice.
        </p>
      </footer>
    </div>
  );
}
```

**`ResultsView` `readOnly` prop:** The existing `ResultsView` component (defined in Wave 5) must accept a `readOnly?: boolean` prop. When `readOnly={true}`:
- Hide all action buttons (Export PDF, Share, Finalize)
- Show results data normally (regime comparison, breakdown, quarterly, flags)
- This prop is optional and defaults to `false` for the authenticated computation detail page

---

## 7. SharedComputationNotFound — `src/components/shared-computation/SharedComputationNotFound.tsx`

Shown when the token is invalid, sharing is disabled, or the computation is deleted.

```tsx
// src/components/shared-computation/SharedComputationNotFound.tsx

import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SharedComputationNotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      {/* Branding */}
      <span className="font-bold text-primary text-xl mb-8">TaxKlaro</span>

      {/* Error content */}
      <div className="flex flex-col items-center gap-4 max-w-sm">
        <Lock className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Link not available</h1>
        <p className="text-muted-foreground text-sm">
          This shared link is invalid, has been disabled, or no longer exists.
          Please ask the sender to share a new link.
        </p>
        <Button asChild variant="outline" className="mt-2">
          <a href="/">Go to TaxKlaro</a>
        </Button>
      </div>
    </div>
  );
}
```

---

## 8. ResultsView `readOnly` Prop Requirement

The `ResultsView` component (to be specified in Wave 5 `component-wiring-map` and `visual-verification-checklist`) MUST accept:

```typescript
interface ResultsViewProps {
  result: TaxComputationResult;
  readOnly?: boolean;  // default: false
}
```

When `readOnly={true}`:
- Omit: `<Button>Export PDF</Button>`
- Omit: `<ShareToggle />`
- Omit: `<Button>Finalize</Button>`
- Show: all data sections (regime comparison, breakdown, quarterly, flags, penalties)

This must be explicitly called out in the `action-trigger-map` (Wave 5) — the readOnly prop is the mechanism that prevents action buttons from appearing in the public view.

---

## 9. Sharing in the ComputationCard Dropdown

The `ComputationCard` dropdown (from `computation-management.md` Section 7) includes a "Share" item:

```
CardFooter DropdownMenu:
  - "View" → /computations/{id}
  - "Archive" → confirm dialog → updateComputationStatus
  - "Delete" → confirm dialog → deleteComputation
  - <Separator />
  - "Share" (only if status === 'computed' || status === 'finalized')
    → navigates to /computations/{id} with sharePanelOpen=true (via search params)
    OR → opens a mini-popover with ShareToggle inline
```

**Decision:** Navigate to the computation detail page with `?share=1` search param, which causes the `SharePanel` Sheet to open on mount. This avoids building a second ShareToggle entry point:

```typescript
// In ComputationCard dropdown "Share" item:
<DropdownMenuItem
  onClick={() => navigate({ to: '/computations/$compId', params: { compId: computation.id }, search: { share: '1' } })}
>
  <Share2 className="h-4 w-4 mr-2" />
  Share
</DropdownMenuItem>

// In ComputationPage, on mount:
const { share } = Route.useSearch();
useEffect(() => {
  if (share === '1') setSharePanelOpen(true);
}, []);
```

---

## 10. Sharing Flow — End-to-End Sequence

```
Firm user:
  1. Opens /computations/{id} (status must be 'computed' or 'finalized')
  2. Clicks "Share" button in ActionsBar → SharePanel Sheet opens
  3. ShareToggle: toggles Switch to ON
  4. setShareEnabled(computationId, true) → Supabase UPDATE
  5. Toast: "Sharing enabled"
  6. Share URL displayed: https://taxklaro.ph/share/{token}
  7. Clicks "Copy" → navigator.clipboard.writeText(url)
  8. Toast: "Link copied to clipboard"
  9. Sends URL to client via email/messaging

Client (unauthenticated):
  1. Opens https://taxklaro.ph/share/{token}
  2. TanStack Router matches /share/$token route
  3. Route loader calls getSharedComputation(token)
  4. Supabase RPC get_shared_computation(token::UUID)
  5. RLS bypassed (SECURITY DEFINER), filters share_enabled=true
  6. Returns computation data
  7. SharedComputationView renders read-only ResultsView
  8. No auth prompts, no sidebar, no action buttons

Firm user revokes:
  1. Opens SharePanel again
  2. Toggles Switch to OFF → setShareEnabled(computationId, false)
  3. OR clicks "Rotate link" → rotateShareToken(computationId) → new UUID generated
  4. Old link now returns 404 (share_enabled=false or token mismatch)
```

---

## 11. Critical Traps

1. **`GRANT TO anon` is REQUIRED for public RPCs.** `SECURITY DEFINER` alone is not sufficient for unauthenticated access. `get_shared_computation` MUST have `GRANT EXECUTE ON FUNCTION ... TO anon, authenticated`. Already included in `003_rpc_functions.sql` — verify it was not accidentally dropped.

2. **p_token type MUST be UUID, not TEXT.** The `share_token` column is `UUID`. If the RPC parameter were `TEXT`, PostgreSQL throws `operator does not exist: uuid = text`. This is the exact failure that broke the inheritance app's share feature. `p_token UUID` is correct — never change to `TEXT`.

3. **Supabase JS client sends RPC params as-is.** When calling `supabase.rpc('get_shared_computation', { p_token: token })` where `token` is a JS string UUID, the Supabase client sends it correctly for `UUID` parameter type. No manual `::uuid` cast needed in the JS call.

4. **`/share/$token` route must NOT be wrapped in AppLayout.** The route renders `SharedComputationView` directly, not inside the authenticated AppLayout. The `__root.tsx` or route tree must not wrap all routes in AppLayout — only authenticated routes. Check that `__root.tsx` conditionally applies AppLayout based on route configuration (e.g., via `context.isPublicRoute` flag or by putting authenticated routes under a layout route).

5. **`readOnly` prop must be forwarded to all action-bearing children of ResultsView.** If `ResultsView` renders `ActionsBar` internally, `readOnly={true}` must suppress the `ActionsBar` entirely. If actions are rendered by the parent route and passed via props, `SharedComputationView` simply does not pass action handlers. Clarify which pattern is used in the `component-wiring-map` wave.

6. **Token rotation must also update local state.** After `rotateShareToken()`, the `ShareToggle` parent (`ComputationPage`) must update `computation.shareToken` in its local state. If it does not, the displayed URL still shows the old (now invalid) token. The `onShareChange(enabled, newToken)` callback handles this — verify the parent updates state on `newToken !== undefined`.

7. **Share URL uses VITE_APP_URL, not hardcoded domain.** `buildShareUrl()` uses `import.meta.env.VITE_APP_URL ?? window.location.origin`. In production, `VITE_APP_URL=https://taxklaro.ph` must be injected as a build arg in the Dockerfile. In local dev, falls back to `window.location.origin` (`http://localhost:5173`). Test that the fallback works correctly in dev.

8. **`get_shared_computation` returns a TABLE, not a single row.** Supabase RPC for `RETURNS TABLE` gives an array, not an object. `lib/share.ts` handles this with `rows[0]`. Do NOT call `.single()` on the result — `.single()` is only for `.from().select()` queries, not `.rpc()` calls.

---

## 12. Sharing and Premium Gating

Sharing (generating shareable links) is a **PRO and ENTERPRISE** feature:

| Tier | Share Link | Rotate Token |
|------|-----------|--------------|
| FREE | No — ShareToggle disabled, shows upgrade prompt | No |
| PRO | Yes | Yes |
| ENTERPRISE | Yes | Yes |

**Gating implementation:** In `ComputationPage`, before rendering the "Share" button in `ActionsBar`:

```typescript
const { org } = useOrganization();
const canShare = org?.plan === 'pro' || org?.plan === 'enterprise';

// In ActionsBar:
{canShare ? (
  <Button variant="outline" size="sm" onClick={() => setSharePanelOpen(true)}>
    <Share2 className="h-4 w-4 mr-2" />
    Share
  </Button>
) : (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="outline" size="sm" disabled>
        <Share2 className="h-4 w-4 mr-2" />
        Share
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Sharing is available on Pro and Enterprise plans.</p>
      <a href="/settings" className="text-primary text-xs">Upgrade →</a>
    </TooltipContent>
  </Tooltip>
)}
```

**Note:** The RLS policy on `computations` (UPDATE) does NOT enforce this — the gating is application-level only. A determined free-tier user with direct Supabase API access could enable sharing, but this is acceptable for v1.
