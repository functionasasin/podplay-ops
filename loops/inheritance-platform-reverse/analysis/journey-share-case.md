# Journey Audit — journey-share-case

**Status: BROKEN**
**Gaps found: 9 (2 CRITICAL, 3 HIGH, 2 MEDIUM, 2 LOW)**

---

## Journey Description

Two-sided flow:
- **Sender**: authenticated user opens a computed case, enables sharing, copies the link
- **Recipient**: anyone opens `/share/$token`, views read-only results

---

## Sender Side: Creating a Share Link

### Entry: `/cases/$caseId` → results phase → Share button

**Step 1**: User has computed results visible in `CaseEditorPage` (results phase).
`src/routes/cases/$caseId.tsx:105-112`

**Step 2**: User looks for a Share button.

**JSC-001: CRITICAL — No Share button in ActionsBar. ShareDialog is unreachable.**

`src/components/results/ActionsBar.tsx` only has three buttons:
- Edit Input (`onEditInput`)
- Export JSON (downloads `inheritance-{date}-both.json`)
- Copy Narratives (copies to clipboard)

There is NO Share button. `ShareDialog.tsx` exists at `src/components/case/ShareDialog.tsx` and is fully
built (toggle sharing, copy link, QR code, privacy warning), but nothing in the app ever opens it.

`toggleShare()` in `src/lib/share.ts:13-26` is never called from any UI component.

**JSC-004: HIGH — `caseId` prop passed to `ResultsView` is silently dropped.**

`src/routes/cases/$caseId.tsx:110`:
```tsx
<ResultsView
  input={state.input}
  output={state.output}
  onEditInput={handleEditInput}
  caseId={caseId}          // ← passed here
/>
```

`src/components/results/ResultsView.tsx:13-17` — `ResultsViewProps` interface:
```ts
export interface ResultsViewProps {
  input: EngineInput;
  output: EngineOutput;
  onEditInput: () => void;
  // caseId is NOT in this interface
}
```

`caseId` is silently dropped. Even if a Share button were added to ActionsBar, it would receive no `caseId`
because the prop chain is broken.

**JSC-005: HIGH — No share state in CaseEditorPage.**

`CaseEditorPage` loads `caseRow` (which has `share_token` and `share_enabled` from migration 001), but
never reads or stores these fields. There is no `shareToken` or `shareEnabled` useState, no `onToggleShare`
handler.

`src/routes/cases/$caseId.tsx:29-30`:
```tsx
const [state, setState] = useState<PageState>({ phase: 'loading' });
const [caseRow, setCaseRow] = useState<CaseRow | null>(null);
// Missing: const [shareToken, setShareToken] = useState<string>('');
// Missing: const [shareEnabled, setShareEnabled] = useState<boolean>(false);
```

**Database fields that exist but are never surfaced in UI:**
- `cases.share_token` — UUID, auto-generated (migration 001 line 185)
- `cases.share_enabled` — BOOLEAN, defaults FALSE (migration 001 line 186)
- `get_shared_case(p_token TEXT)` RPC — exists in migration 004, bypasses RLS for anonymous access

---

## Recipient Side: Viewing a Shared Link

### Entry: `/share/$token`

**Step 1**: Recipient opens the URL. `SharedCasePage` in `src/routes/share/$token.tsx:25` calls
`getSharedCase(token)` which calls supabase RPC `get_shared_case`.

**Step 2 (Loading)**: Shows text "Loading shared case..." — basic state exists.

**Step 3a (Invalid token)**: Shows "Case Not Found" card with explanation — reasonable. ✓

**Step 3b (Valid token)**:

**JSC-002: CRITICAL — Results are a TODO comment. Recipient sees only title and decedent name.**

`src/routes/share/$token.tsx:97-101`:
```tsx
<p className="text-muted-foreground">
  Estate of {caseData.decedent_name}
</p>
{/* Results will be rendered here in implementation phase */}
{/* No ActionsBar, no CaseNotesPanel, no share button in shared view */}
```

`SharedCaseData` type includes `input_json: EngineInput | null` and `output_json: EngineOutput | null`,
both loaded from the RPC — but neither is rendered. The recipient sees:
- Case title
- "Estate of {decedent_name}" text
- "Read Only" badge
- Nothing else

The purpose of sharing — showing the distribution to a recipient — is completely unimplemented.

**JSC-003: HIGH — AppLayout wraps `/share/$token`. Recipient sees full sidebar chrome.**

`src/routes/__root.tsx` wraps ALL routes (including `/share/$token`) in `AppLayout` which renders the full
sidebar and nav header. A recipient who has no account sees the full firm-scoped UI chrome with navigation
links to `/clients`, `/deadlines`, `/settings`, etc.

Fix requires route-level layout isolation, not a per-component fix.

---

## Secondary Gaps

**JSC-006: MEDIUM — Copy link has no success feedback.**

`src/components/case/ShareDialog.tsx:39-41`:
```tsx
const handleCopy = async () => {
  await navigator.clipboard.writeText(shareUrl);
};
```
No feedback after copy. Button stays "Copy" with no visual confirmation that the clipboard was updated.

**JSC-007: MEDIUM — Loading state has no spinner.**

`src/routes/share/$token.tsx:54-62` — loading card shows only:
```tsx
<p className="text-muted-foreground">Loading shared case...</p>
```
No `Loader2` icon, no skeleton pattern.

**JSC-008: LOW — `qrcode.react` may not be installed.**

`src/components/case/ShareDialog.tsx:9` imports `{ QRCodeSVG } from 'qrcode.react'`.
Per `analysis/read-premium-spec.md`, `qrcode.react` was listed in the premium spec as a required package
and was not confirmed installed. If the package is absent, `ShareDialog` fails at import time.

**JSC-009: LOW — No product CTA in shared view.**

Recipients who don't use the platform get no context about what tool generated this report, and no
invitation to sign up. A "Powered by / Create your own analysis" CTA is standard practice for
link-share features and supports user acquisition.

---

## Fix Specifications

### FIX JSC-001 + JSC-004 + JSC-005: Wire share state through component tree

**File: `src/routes/cases/$caseId.tsx`**

Add share state after existing state declarations (after line 30):
```tsx
const [shareToken, setShareToken] = useState<string>('');
const [shareEnabled, setShareEnabled] = useState<boolean>(false);
```

In `fetchCase()`, after `setCaseRow(row)` (after line 39), initialize share state:
```tsx
setShareToken(row.share_token ?? '');
setShareEnabled(row.share_enabled ?? false);
```

Add handler after `handleEditInput` (after line 82):
```tsx
const handleToggleShare = async (enabled: boolean) => {
  const result = await toggleShare(caseId, enabled);
  setShareEnabled(result.shareEnabled);
  setShareToken(result.shareToken);
};
```

Add import at top: `import { toggleShare } from '@/lib/share';`

Update ResultsView call (line 106-112):
```tsx
<ResultsView
  input={state.input}
  output={state.output}
  onEditInput={handleEditInput}
  caseId={caseId}
  shareToken={shareToken}
  shareEnabled={shareEnabled}
  onToggleShare={handleToggleShare}
/>
```

**File: `src/components/results/ResultsView.tsx`**

Add to `ResultsViewProps` interface (after line 16):
```ts
caseId?: string;
shareToken?: string;
shareEnabled?: boolean;
onToggleShare?: (enabled: boolean) => Promise<void>;
```

Pass through to ActionsBar (update line 55-59):
```tsx
<ActionsBar
  input={input}
  output={output}
  onEditInput={onEditInput}
  caseId={caseId}
  shareToken={shareToken}
  shareEnabled={shareEnabled}
  onToggleShare={onToggleShare}
/>
```

**File: `src/components/results/ActionsBar.tsx`**

Add to `ActionsBarProps` (after line 13):
```ts
caseId?: string;
shareToken?: string;
shareEnabled?: boolean;
onToggleShare?: (enabled: boolean) => Promise<void>;
```

Add share dialog state before return (after line 26):
```tsx
const [shareOpen, setShareOpen] = useState(false);
```

Add import: `import { useState } from 'react';`
Add import: `import { Share2 } from 'lucide-react';`
Add import: `import { ShareDialog } from '@/components/case/ShareDialog';`

Add Share button inside the flex div (after Copy Narratives button, before closing `</div>`):
```tsx
{caseId && shareToken !== undefined && (
  <Button
    type="button"
    variant="outline"
    onClick={() => setShareOpen(true)}
  >
    <Share2 className="size-4" />
    Share
  </Button>
)}
```

Add ShareDialog before closing `</div>` of the component:
```tsx
{caseId && shareToken !== undefined && onToggleShare && (
  <ShareDialog
    open={shareOpen}
    onOpenChange={setShareOpen}
    shareToken={shareToken ?? ''}
    shareEnabled={shareEnabled ?? false}
    onToggleShare={onToggleShare}
  />
)}
```

---

### FIX JSC-002: Render results in SharedCasePage

**File: `src/routes/share/$token.tsx`**

Add imports at top:
```tsx
import { ResultsHeader } from '@/components/results/ResultsHeader';
import { DistributionSection } from '@/components/results/DistributionSection';
import { NarrativePanel } from '@/components/results/NarrativePanel';
import { WarningsPanel } from '@/components/results/WarningsPanel';
import { ComputationLog } from '@/components/results/ComputationLog';
```

Replace the TODO comment block (lines 97-101) with:
```tsx
{caseData.output_json && caseData.input_json ? (
  <div className="mt-4 space-y-6">
    <ResultsHeader
      scenarioCode={caseData.output_json.scenario_code}
      successionType={caseData.output_json.succession_type}
      netDistributableEstate={caseData.input_json.net_distributable_estate}
      decedentName={caseData.input_json.decedent.name}
      dateOfDeath={caseData.input_json.decedent.date_of_death}
    />
    <DistributionSection
      shares={caseData.output_json.per_heir_shares}
      totalCentavos={
        typeof caseData.input_json.net_distributable_estate.centavos === 'string'
          ? parseInt(caseData.input_json.net_distributable_estate.centavos, 10)
          : caseData.input_json.net_distributable_estate.centavos
      }
      successionType={caseData.output_json.succession_type}
      scenarioCode={caseData.output_json.scenario_code}
      persons={caseData.input_json.family_tree}
    />
    <NarrativePanel
      narratives={caseData.output_json.narratives}
      decedentName={caseData.input_json.decedent.name}
      dateOfDeath={caseData.input_json.decedent.date_of_death}
    />
    <WarningsPanel
      warnings={caseData.output_json.warnings}
      shares={caseData.output_json.per_heir_shares}
    />
    <ComputationLog log={caseData.output_json.computation_log} />
  </div>
) : (
  <p className="mt-4 text-sm text-muted-foreground">
    Results have not been computed for this case yet.
  </p>
)}
```

---

### FIX JSC-003: Isolate `/share/$token` from AppLayout

**File: `src/routes/__root.tsx`**

Create two layout variants. The cleanest TanStack Router approach is a nested route group.

Add `MinimalLayout` component (can be in same file or `src/components/layout/MinimalLayout.tsx`):
```tsx
function MinimalLayout() {
  return (
    <main className="min-h-screen bg-background">
      <Outlet />
    </main>
  );
}
```

Create a public root route that uses MinimalLayout:
```tsx
export const publicRootRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_public',
  component: MinimalLayout,
});
```

Move `shareTokenRoute` to be a child of `publicRootRoute` instead of `rootRoute`:
```tsx
export const shareTokenRoute = createRoute({
  getParentRoute: () => publicRootRoute,  // ← changed from rootRoute
  path: '/share/$token',
  component: SharedCaseRouteComponent,
});
```

Also move `authRoute` to `publicRootRoute` to fix the sidebar-on-auth-page issue documented in JSS (journey-signup-signin) and JNV (journey-new-visitor) analyses.

Update `routeTree` in `src/router.ts` to include `publicRootRoute` and its children.

---

### FIX JSC-006: Copy link success feedback

**File: `src/components/case/ShareDialog.tsx`**

Add `copied` state (after line 26):
```tsx
const [copied, setCopied] = useState(false);
```

Update `handleCopy` (lines 39-41):
```tsx
const handleCopy = async () => {
  await navigator.clipboard.writeText(shareUrl);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
};
```

Update Copy button text (line 88):
```tsx
{copied ? 'Copied!' : 'Copy'}
```

---

### FIX JSC-007: Loading spinner in SharedCasePage

**File: `src/routes/share/$token.tsx`**

Add import: `import { Loader2 } from 'lucide-react';`

Replace loading content (lines 56-59):
```tsx
<CardContent className="py-12 flex flex-col items-center gap-3">
  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  <p className="text-muted-foreground text-sm">Loading shared case...</p>
</CardContent>
```

---

### FIX JSC-008: Install qrcode.react

Run from `loops/inheritance-frontend-forward/app/`:
```
npm install qrcode.react
npm install --save-dev @types/qrcode.react
```

Or verify it's in `package.json` first — if absent, the ShareDialog will fail at runtime.

---

### FIX JSC-009: Product CTA in shared view

**File: `src/routes/share/$token.tsx`**

Add after the closing `</Card>` tag (before the outer `</div>`):
```tsx
<p className="mt-6 text-center text-xs text-muted-foreground">
  Generated with{' '}
  <a href="/" className="text-primary hover:underline font-medium">
    Philippine Inheritance Calculator
  </a>{' '}
  —{' '}
  <a href="/auth" className="text-primary hover:underline">
    Create your own analysis
  </a>
</p>
```

---

## Journey Rating

| Phase | Status | Reason |
|-------|--------|--------|
| Sender creates share link | BROKEN | No Share button; ShareDialog unreachable; no share state in CaseEditorPage |
| Recipient loads share URL | BROKEN | Results not rendered (TODO comment); AppLayout chrome shown |
| Recipient sees results | MISSING | `output_json` loaded but never displayed |
| Copy link | PARTIAL | ShareDialog copy works but no success feedback; QR code depends on unconfirmed package |

**Overall: BROKEN — the share feature is stub-complete at the lib layer but has no UI entrypoint and no results rendering.**

---

## Gap Summary

| ID | Severity | File | Description |
|----|----------|------|-------------|
| JSC-001 | CRITICAL | `components/results/ActionsBar.tsx` | No Share button; ShareDialog is unreachable |
| JSC-002 | CRITICAL | `routes/share/$token.tsx:100` | Results are a TODO comment; `output_json` never rendered |
| JSC-003 | HIGH | `routes/__root.tsx` | AppLayout wraps share route; recipient sees sidebar chrome |
| JSC-004 | HIGH | `routes/cases/$caseId.tsx:110`, `components/results/ResultsView.tsx:13` | `caseId` prop silently dropped; type mismatch |
| JSC-005 | HIGH | `routes/cases/$caseId.tsx:29` | No `shareToken`/`shareEnabled` state; no `handleToggleShare` |
| JSC-006 | MEDIUM | `components/case/ShareDialog.tsx:39` | Copy link has no success feedback |
| JSC-007 | MEDIUM | `routes/share/$token.tsx:55` | Loading state has no spinner |
| JSC-008 | LOW | `components/case/ShareDialog.tsx:9` | `qrcode.react` import; package may not be installed |
| JSC-009 | LOW | `routes/share/$token.tsx` | No product CTA for non-user recipients |
