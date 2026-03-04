# Analysis: catalog-lib-hooks

**Wave**: 1 — Source Acquisition
**Date**: 2026-03-04
**Source**: `loops/inheritance-frontend-forward/app/src/lib/` and `app/src/hooks/`

---

## lib/ — 18 files (13 source + 5 test subdirs)

### supabase.ts
**Path**: `lib/supabase.ts`
**Exports**: `supabase` (Supabase client singleton)
**Gap — CRITICAL**: Lines 6–11 throw `new Error(...)` at module initialization if `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` are unset. This crashes the entire application at startup — no error boundary catches it, no setup instructions shown. The app just white-screens with an uncaught Error in console.

---

### auth.ts
**Path**: `lib/auth.ts`
**Exports**: `signIn`, `signUp`, `signOut`, `signInWithGoogle`, `signInWithMagicLink`, `onAuthStateChange`, `getProfile`
**Status**: Functionally complete.
**Gaps**:
- `signInWithGoogle` (OAuth redirect) and `signInWithMagicLink` (OTP) are implemented but not exposed via `useAuth` hook and no UI component calls them.
- No `resetPassword` / `updatePassword` functions — password reset flow is entirely absent from the lib layer.
- `getProfile` reads from `user_profiles` table, returns `null` on error (no throw). No onboarding trigger if profile row doesn't exist.

---

### cases.ts
**Path**: `lib/cases.ts`
**Exports**: `createCase`, `loadCase`, `updateCaseInput`, `updateCaseOutput`, `updateCaseStatus`, `isValidStatusTransition`, `listCases`, `deleteCase`
**Status**: Functionally complete.
**Gaps**:
- `listCases` selects `notes_count` (line 101) — this must be a computed column or view column on the `cases` table. If missing from DB schema, query will silently omit it or error.
- No `archiveCase` or soft-delete. `deleteCase` is hard-delete.
- No pagination in `listCases`. For firms with 100+ cases this will be slow.

---

### clients.ts
**Path**: `lib/clients.ts`
**Exports**: `createClient`, `loadClient`, `updateClient`, `listClients`, `deleteClient`
**Status**: Functionally complete.
**Gaps**:
- `listClients` selects `conflict_cleared` and `case_count` (line 53) — both are likely computed columns. If absent from DB, query silently omits them.
- No pagination in `listClients`.
- No `archiveClient`. `deleteClient` is hard-delete.

---

### organizations.ts
**Path**: `lib/organizations.ts`
**Exports**: `getOrganization`, `getUserOrganization`, `listMembers`, `inviteMember`, `revokeInvitation`, `listPendingInvitations`, `acceptInvitation`, `removeMember`, `updateMemberRole`, `canPerformAction`, `getSeatUsage`
**Status**: Comprehensive and complete.
**Gaps**:
- `acceptInvitation` calls `supabase.rpc('accept_invitation', { p_token: token })` — requires a Supabase RPC function `accept_invitation` to exist in DB. Must be verified in migrations.
- No `createOrganization` function — new user sign-up has nowhere to create an org. This is a critical onboarding gap.
- `getUserOrganization` uses `.limit(1).single()` — if user has no org membership, Supabase returns error code PGRST116 ("no rows"). The `if (error || !data) return null` handles it, but silently. No way to distinguish "no org" from "DB error".

---

### intake.ts
**Path**: `lib/intake.ts`
**Exports**: `createInitialIntakeState`, `mapDecedentInfoToDecedent`, `mapHeirEntryToPerson`, `mapFamilyToPersons`, `mapIntakeToEngineInput`, `mapIntakeToClientData`, `mapIntakeToIntakeData`, `getSettlementMilestones`, `isStepComplete`
**Status**: Complete with one crash risk.
**Gaps**:
- Line 222: `state.settlementTrack.track!` — non-null assertion. If a user reaches step 5 (Review) without completing Settlement Track step, this crashes at runtime.
- `mapIntakeToEngineInput` sets `net_distributable_estate: { centavos: 0 }` — intentional placeholder but means computation with intake-mapped input will always show ₱0 estate until tax bridge runs.
- EJS milestones: 9 milestones indexed 0-8. JUDICIAL milestones: 4 milestones indexed 0-3. Timeline.ts stage definitions assume these exact indices (milestone keys like `ejs-0`, `ejs-1`).

---

### deadlines.ts
**Path**: `lib/deadlines.ts`
**Exports**: `computeDeadlineStatus`, `generateAndSaveDeadlines`, `markDeadlineComplete`, `addCustomDeadline`, `listDeadlines`, `getCaseDeadlineSummaries`
**Status**: Complete.
**Gaps**:
- `getCaseDeadlineSummaries` calls `supabase.rpc('get_case_deadline_summaries', { p_case_ids })` — requires RPC function in DB. Must verify in migrations.
- `computeDeadlineStatus` is pure client-side — no stored status column. DeadlineTimeline component must call this function for every deadline on render.

---

### documents.ts
**Path**: `lib/documents.ts`
**Exports**: `seedDocuments`, `checkOffDocument`, `markNotApplicable`, `listDocuments`, `computeProgress`
**Status**: Complete as data layer. UI layer (DocumentChecklist component) is a known stub.
**Gaps**:
- Line 7: `import { getApplicableDocuments } from '@/data/document-templates'` — depends on a data file at `src/data/document-templates.ts` (not in lib/). This file must be verified to exist and be non-empty.
- No `reorderDocuments` or custom document creation from UI.

---

### share.ts
**Path**: `lib/share.ts`
**Exports**: `SharedCaseData` (interface), `toggleShare`, `getSharedCase`
**Status**: Complete.
**Gaps**:
- `getSharedCase` calls `supabase.rpc('get_shared_case', { p_token })` — requires RPC function. Must verify in migrations.
- `toggleShare` does not generate the token — the DB must generate `share_token` via default or trigger. This must be verified.

---

### pdf-export.ts
**Path**: `lib/pdf-export.ts`
**Exports**: `PDFExportOptions`, `DEFAULT_PDF_OPTIONS`, `slugifyName`, `buildPDFFilename`, `generatePDF`, `downloadPDF`
**Status**: Complete. Lazy-loads `@react-pdf/renderer` and `components/pdf/EstatePDF` for code splitting.
**Gaps**:
- Depends on `../components/pdf/EstatePDF` — must verify this component is not a stub.
- `generatePDF` signature accepts `profile: FirmProfile | null` but `EstatePDF` component must handle null profile gracefully (use default header or omit firm section).
- No error handling in `downloadPDF` — if PDF generation throws, caller must catch.

---

### export-zip.ts
**Path**: `lib/export-zip.ts`
**Exports**: `ZipMetadata`, `buildZipFilename`, `formatNotesAsText`, `exportCaseZip`
**Status**: Complete. Lazy-loads `jszip` and `pdf-export`.
**Gaps**:
- Calls `generatePDF(input, output, null)` — always generates PDF with null profile (no firm header). This is intentional for ZIP export but means firm branding never appears in ZIP.
- No error handling in `exportCaseZip` — if zip generation throws, caller must catch.

---

### tax-bridge.ts
**Path**: `lib/tax-bridge.ts`
**Exports**: `EstateTaxEngineOutput`, `EstateTaxScheduleSummary`, `TaxBridgeState`, `TaxBridgeResult`, `computeNetDistributableEstate`, `buildBridgedInput`, `runTaxBridge`, `saveTaxOutput`, `buildBridgeNoteText`
**Status**: Complete. `runTaxBridge` lazy-loads `@/wasm/bridge`.
**Gaps**:
- `saveTaxOutput` updates `cases.tax_output_json` column — must verify this column exists in DB schema.

---

### firm-profile.ts
**Path**: `lib/firm-profile.ts`
**Exports**: `FirmProfile`, constants, `defaultFirmProfile`, `rowToFirmProfile`, `firmProfileToRow`, `loadFirmProfile`, `saveFirmProfile`, `validateLogoFile`, `uploadLogo`, `deleteLogo`
**Status**: Complete.
**Gaps**:
- `loadFirmProfile` and `saveFirmProfile` operate on `user_profiles` table (not a separate `firm_profiles` table). Firm profile fields are mixed with auth user fields in one table. This is a design limitation — org-level firm profile sharing is impossible with this schema.
- `uploadLogo` returns `data.path` (storage path) but callers must then call `saveFirmProfile({ logoUrl: path })` — this two-step is fragile.
- Logo bucket `firm-logos` must exist in Supabase Storage — not verified in migrations.

---

### comparison.ts
**Path**: `lib/comparison.ts`
**Exports**: `ComparisonState`, `ComparisonDiffEntry`, `buildAlternativeInput`, `calculateDiffs`, `computeComparison`, `saveComparisonResults`
**Status**: Complete.
**Gap — CRITICAL**: Line 8: `import { compute } from '@/wasm/bridge'` — **static top-level import**. All other wasm imports in the codebase are lazy (`await import('@/wasm/bridge')`). This means importing `comparison.ts` will immediately load the entire WASM module synchronously, blocking the UI thread during bundle parse. Should be converted to lazy import like tax-bridge.ts.
- `saveComparisonResults` updates `cases.comparison_input_json`, `cases.comparison_output_json`, `cases.comparison_ran_at` — these columns must exist in DB.

---

### case-notes.ts
**Path**: `lib/case-notes.ts`
**Exports**: `addNote`, `deleteNote`, `listNotes`
**Status**: Complete.
**Gaps**:
- No `updateNote` function — notes cannot be edited after creation.
- No pagination in `listNotes` — for cases with many notes, all are loaded at once.

---

### conflict-check.ts
**Path**: `lib/conflict-check.ts`
**Exports**: `ConflictOutcome`, `ConflictMatch`, `ConflictCheckResult`, `getSimilarityColor`, `runConflictCheck`
**Status**: Complete.
**Gaps**:
- `getSimilarityColor` returns raw Tailwind class strings (`bg-red-100 text-red-800 border-red-300`) — bypasses the Navy+Gold design system. These Tailwind classes are not part of the official palette and may conflict with future Tailwind purging.
- `runConflictCheck` calls `supabase.rpc('run_conflict_check', { p_name, p_tin? })` — requires RPC function in DB.

---

### timeline.ts
**Path**: `lib/timeline.ts`
**Exports**: `StageStatus`, `TimelineStage`, `TimelineData`, `StageDef`, `EJS_STAGES`, `JUDICIAL_STAGES`, `getStageDefinitions`, `computeStageStatus`, `buildTimelineData`
**Status**: Complete, pure (no DB access).
**Gaps**:
- `buildTimelineData` filters deadlines by `milestone_key.startsWith(prefix)` — the key format `ejs-0`, `ejs-1` must match exactly what `generateAndSaveDeadlines` inserts. Both files use the same format so this is consistent.
- Custom deadlines (with `milestone_key: custom-{timestamp}`) will never match any stage prefix, so they appear in no stage — they're invisible in the timeline view.

---

### utils.ts
**Path**: `lib/utils.ts`
**Exports**: `cn` (clsx + tailwind-merge)
**Status**: Complete. Single utility function.

---

## hooks/ — 5 hooks

### useAuth.ts
**Path**: `hooks/useAuth.ts`
**Exports**: `UseAuthReturn`, `useAuth`
**Status**: Functional but missing key behaviors.
**Gaps**:
- **No error state returned** — `signIn` and `signUp` throw on error but `UseAuthReturn` has no `error` field. Callers must use try/catch in the UI. This means auth form error display is entirely the UI's responsibility with no hook support.
- **No initial session hydration loading** — `loading` starts `true` and becomes `false` on first `onAuthStateChange` callback. But if Supabase has no session, the callback fires quickly. This is correct behavior but there's a flash-of-unauth-content before `loading` resolves.
- **No `signInWithGoogle` or `signInWithMagicLink`** exposed — these exist in `lib/auth.ts` but are not surfaced in the hook.
- **No redirect-after-auth logic** — the hook does not redirect to dashboard after sign-in. The route component must handle this.

---

### useOrganization.ts
**Path**: `hooks/useOrganization.ts`
**Exports**: `UseOrganizationReturn`, `useOrganization`
**Status**: Comprehensive.
**Gaps**:
- `inviteMember` calls `refreshMembers()` after invitation but does NOT update the pending invitations list — callers must separately call `listPendingInvitations` if they want to show pending invites.
- No `createOrganization` action in the hook — new users with no org have no path to create one. This is the same gap as in organizations.ts.
- `error` state is set but never cleared — once an error occurs, it persists even after successful subsequent actions.

---

### useAutoSave.ts
**Path**: `hooks/useAutoSave.ts`
**Exports**: `UseAutoSaveReturn`, `useAutoSave`
**Status**: Functional.
**Gaps**:
- **No `isDirty` flag** — components cannot show "unsaved changes" indicator.
- **No forced flush on unmount** — if user navigates away during 1500ms debounce window, the save is lost.
- **Status never resets to 'idle'** — after a successful save, status stays 'saved' forever. Components must manually handle this (e.g., fade out "Saved" text after 2s) but the hook doesn't help.

---

### useTaxBridge.ts
**Path**: `hooks/useTaxBridge.ts`
**Exports**: `UseTaxBridgeOptions`, `UseTaxBridgeReturn`, `useTaxBridge`
**Status**: Well-designed. Uses stable key comparison to avoid infinite re-render loops.
**Gaps**:
- None critical. Design is sound.

---

### usePrintExpand.ts
**Path**: `hooks/usePrintExpand.ts`
**Exports**: `usePrintExpand`
**Status**: Complete for its purpose.
**Gaps**:
- Manipulates `data-state` attribute directly — assumes Radix UI accordion pattern. Any non-Radix accordion won't work with this hook.

---

## External Dependencies Referenced from lib/hooks

| Import Path | Used In | Verification Needed |
|-------------|---------|---------------------|
| `@/wasm/bridge` | tax-bridge.ts, comparison.ts, useTaxBridge.ts | Must verify `src/wasm/bridge.ts` exists and exports `compute` |
| `@/data/document-templates` | documents.ts | Must verify `src/data/document-templates.ts` exists and exports `getApplicableDocuments` |
| `../components/pdf/EstatePDF` | pdf-export.ts | Must verify `src/components/pdf/EstatePDF.tsx` is not a stub |
| `@/types` | many | Must verify all imported types exist in `src/types/index.ts` |
| `@/types/client` | clients.ts | Must verify `src/types/client.ts` exists |
| `@/types/intake` | intake.ts | Must verify `src/types/intake.ts` exists |

---

## Required Supabase RPC Functions

These RPC functions are called from lib/ and must exist in migrations:

| RPC Name | Used In | Purpose |
|----------|---------|---------|
| `accept_invitation` | organizations.ts | Accept org invite by token |
| `get_case_deadline_summaries` | deadlines.ts | Batch deadline stats for dashboard |
| `get_shared_case` | share.ts | Fetch shared case by token (bypasses RLS) |
| `run_conflict_check` | conflict-check.ts | Fuzzy name/TIN match across org's data |

---

## Missing Hooks (no hook exists for these lib modules)

| Missing Hook | Lib Module | Impact |
|-------------|------------|--------|
| `useCases` / `useCaseList` | cases.ts | Routes must call `listCases` directly, manage loading/error state manually |
| `useClients` / `useClientList` | clients.ts | Routes must manage loading/error state manually |
| `useDeadlines` | deadlines.ts | DeadlineTimeline component fetches deadlines without a hook |
| `useDocuments` | documents.ts | DocumentChecklist component fetches without a hook |
| `useCaseNotes` | case-notes.ts | Notes panel fetches without a hook |
| `useFirmProfile` | firm-profile.ts | Settings pages fetch directly |
| `useComparison` | comparison.ts | Comparison panel manages state directly |

---

## Critical Gaps Summary

| ID | File | Gap | Severity |
|----|------|-----|----------|
| LH-01 | `lib/supabase.ts` | Throws on missing env vars — app white-screens | CRITICAL |
| LH-02 | `lib/comparison.ts:8` | Static wasm import — blocks UI thread on load | HIGH |
| LH-03 | `lib/organizations.ts` | No `createOrganization` — new users can't create org | CRITICAL |
| LH-04 | `lib/auth.ts` | No `resetPassword` / `updatePassword` — password reset absent | HIGH |
| LH-05 | `lib/intake.ts:222` | Non-null assertion on `track!` — runtime crash if step skipped | HIGH |
| LH-06 | `hooks/useAuth.ts` | No error state — auth form errors need manual try/catch | MEDIUM |
| LH-07 | `hooks/useAutoSave.ts` | No isDirty flag, no flush on unmount | MEDIUM |
| LH-08 | `hooks/useOrganization.ts` | No createOrganization action | CRITICAL |
| LH-09 | `lib/conflict-check.ts` | Raw Tailwind color classes bypass design system | LOW |
| LH-10 | `lib/timeline.ts` | Custom deadlines invisible in timeline stages | MEDIUM |
| LH-11 | External deps | `@/wasm/bridge`, `@/data/document-templates` unverified | HIGH |
