# Analysis: journey-return-visit
**Wave**: 2 — User Journey Audit
**Date**: 2026-03-04
**Rating**: BROKEN

Walk: user returns days later → dashboard → case list → opens existing case → edits → recomputes. Is the dashboard useful?

---

## Sub-journey A: Return User Hits Dashboard

### Entry point: `/` (DashboardPage)
**Component**: `routes/index.tsx`

```tsx
// routes/index.tsx:52-69 (authenticated branch)
return (
  <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
    <p className="text-muted-foreground mb-4">
      Welcome back. Use "New Case" to start an inheritance computation.
    </p>
    <Link to="/cases/new">
      <Button className="gap-2"><FilePlus className="h-4 w-4" />New Case</Button>
    </Link>
  </div>
);
```

**Gap JRV-001 — CRITICAL: Dashboard shows no case list.**
`listCases(orgId)` is implemented in `lib/cases.ts:95-111`, accepts `orgId` and `statusFilter`, returns sorted `CaseListItem[]`. It is never called from the Dashboard. The authenticated landing page offers only a "New Case" button with static instructional text — no recent cases, no activity summary, no deadline alerts.

**Gap JRV-002 — CRITICAL: No `/cases` list route exists.**
`router.ts` registers 10 routes. There is no `casesListRoute` or `/cases` path. No `CasesListPage` component exists anywhere in `src/`. `listCases()` has no consumer UI.

**Gap JRV-003 — HIGH: No "Cases" nav item in AppLayout.**
`AppLayout.tsx:13-19` defines `navItems` with 5 entries: Dashboard, New Case, Clients, Deadlines, Settings. There is no entry for a cases list. A return user has no obvious navigation path to their existing cases.

---

## Sub-journey B: Finding Existing Cases

The only path to an existing case is through the Deadlines page.

### Deadlines page (`/deadlines`)
**Component**: `routes/deadlines.tsx`

The DeadlinesPage:
- Fetches `cases` for the user: `supabase.from('cases').select().eq('user_id', user.id)` (line 79)
- Fetches `case_deadlines` for those cases (line 105)
- Each deadline renders a `<Link to="/cases/$caseId">Open Case</Link>` (lines 246-253)

This is the only path to a saved case for a return user. It works if the case has deadlines, but:

**Gap JRV-004 — MEDIUM: Deadlines fetches by `user_id`, not `org_id` (deadlines.tsx:79).**
In a multi-seat org, `user_id` only returns cases created by the current user. Team members' cases won't appear. The `cases` table has `org_id` for org-level visibility. Fix: join through `org_id` using `useOrganization`.

**Gap JRV-005 — HIGH: No path to case list for users with no deadlines.**
If a user has cases but no pending deadlines (e.g., all computed but no `date_of_death` set), the Deadlines page shows "No pending deadlines." There is no other UI to list cases. The user is stuck.

---

## Sub-journey C: Opening Existing Case at `/cases/$caseId`

**Component**: `routes/cases/$caseId.tsx` (CaseEditorPage)

### Loading phase
```tsx
// $caseId.tsx:86-90
{state.phase === 'loading' && (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
)}
```
✓ Loading state uses `<Loader2>` spinner — consistent with Settings page.

### Case hydration from DB
```tsx
// $caseId.tsx:40-51
if (row.output_json) {
  setState({ phase: 'results', input: row.input_json, output: row.output_json });
} else if (row.input_json) {
  setState({ phase: 'wizard', input: row.input_json });
} else {
  setState({ phase: 'wizard', input: null });
}
```
✓ Correctly branches: computed case → ResultsView, input-only case → wizard with pre-fill.

### Error state
```tsx
// $caseId.tsx:114-125
{state.phase === 'error' && (
  <Alert variant="destructive">
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>{state.message}</AlertDescription>
    <Button variant="destructive" onClick={handleEditInput}>Back to Editor</Button>
  </Alert>
)}
```
✓ Error state is handled.

---

## Sub-journey D: Editing Existing Case

### Edit trigger
```tsx
// $caseId.tsx:79-82
const handleEditInput = () => {
  const input = state.phase === 'results' ? state.input : null;
  setState({ phase: 'wizard', input });
};
```

ResultsView renders `<ActionsBar onEditInput={handleEditInput} ...>` which passes through to `ActionsBar.tsx`'s "Edit Input" button.

✓ Edit transition works.

**Gap JRV-006 — MEDIUM: No "Back to Results" shortcut when editing a computed case.**
When a user clicks "Edit Input" on a computed case and enters the wizard, there is no "Cancel" or "Return to Results" button. The user must re-submit the wizard (re-run computation) to see results again. If they just wanted to look at inputs and return to results, they cannot without re-running the engine.
Fix: In CaseEditorPage wizard phase, if `caseRow.output_json !== null`, show a "Back to Results" link that transitions back to `results` phase without recomputing.

### Auto-save (imported but unused)
```tsx
// $caseId.tsx:12
import { useAutoSave } from '@/hooks/useAutoSave';
```

`useAutoSave` is imported but never called anywhere in `CaseEditorPage`. The hook (hooks/useAutoSave.ts) is fully implemented: debounced 1500ms save, `status: AutoSaveStatus` indicator. There is no `useAutoSave(caseId, input)` call and no auto-save status indicator anywhere in the wizard phase.

**Gap JRV-007 — HIGH: `useAutoSave` imported but never called in CaseEditorPage ($caseId.tsx:12).**
The auto-save hook is implemented (hooks/useAutoSave.ts:12-52) but dead. Fix: call `useAutoSave(caseId, currentInput)` during the wizard phase; display `status` badge ("Saving...", "Saved", "Save failed") near the wizard nav bar.

---

## Sub-journey E: Recomputing

### Compute + save flow
```tsx
// $caseId.tsx:66-77
const handleSubmit = async (data: EngineInput) => {
  setState({ phase: 'computing', input: data });
  try {
    await updateCaseInput(caseId, data);   // ✓ saves input
    const output = await compute(data);     // WASM
    await updateCaseOutput(caseId, output); // ✓ saves output
    setState({ phase: 'results', input: data, output });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Computation failed';
    setState({ phase: 'error', message });
  }
};
```

✓ Saves both input and output to DB. Error state is handled.

**Gap JRV-008 — LOW: Computing phase uses raw CSS spinner (line 99).**
```tsx
<div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
```
Inconsistent with loading phase which uses `<Loader2>`. (Same as JFC-007 from journey-first-case.)

**Gap JRV-009 — LOW: No success toast on recompute.**
Transition from `computing` → `results` is silent. No "Computation complete" toast. (Same as JFC-016.)

---

## Sub-journey F: Settings → Firm Profile

### Settings page (`/settings`)
**Component**: `routes/settings/index.tsx`

The SettingsPage renders FirmProfileForm, LogoUpload, ColorPickers sections.
Loading state uses `<Loader2>` ✓.
Auth guard shows "Sign in to manage your firm settings." for unauthenticated users ✓.

**Gap JRV-010 — MEDIUM: Logo upload uses `window.location.reload()` as a hack.**
```tsx
// settings/index.tsx:67-74
const handleLogoUpload = async (file: File) => {
  const { user } = await import('@/lib/supabase').then(m => m.supabase.auth.getUser()).then(r => r.data);
  if (!user) return;
  await uploadLogo(user.id, file);
  // Refresh profile to get new logo URL
  window.location.reload();  // ← full page reload
};
```
After uploading a logo, the page does a full reload to see the new logo URL. This discards all React state, flashes the page, and is incorrect. Fix: expose a `refresh()` or `refetchProfile()` function from `FirmProfileContext`, call it after `uploadLogo()` to update the logo URL reactively.

**Gap JRV-011 — MEDIUM: Settings page has no link to Team settings.**
SettingsContent (`settings/index.tsx:54-129`) shows three sections (Firm Profile, Firm Logo, Brand Colors) but has no navigation to `/settings/team`. There is no tab, sidebar link, or breadcrumb pointing to the team management page.

---

## Sub-journey G: Settings → Team Management

**Component**: `routes/settings/team.tsx` (TeamSettingsPage)

### Critical: Route not registered
`router.ts` (line 1-27) imports and registers `settingsRoute` but NOT any team route:
```tsx
import { settingsRoute } from './routes/settings/index';
// routes/settings/team.tsx is not imported
```

`settings/team.tsx` exports `TeamSettingsPage` as a named function component — **not** a `createRoute` wrapper. There is no `getParentRoute` or `createRoute` call. This component cannot be mounted by the router.

**Gap JRV-012 — CRITICAL: `/settings/team` route is not registered.**
`TeamSettingsPage` exists but is unreachable. No user can navigate to it. Fix:
1. Wrap `TeamSettingsPage` with `createRoute` in routes/settings/team.tsx: `export const settingsTeamRoute = createRoute({ getParentRoute: () => rootRoute, path: '/settings/team', component: TeamSettingsPage })`
2. Import `settingsTeamRoute` in router.ts and add to routeTree
3. Add "Team" link in AppLayout navItems or as a sub-nav in SettingsPage

### TeamSettingsPage component audit

**Gap JRV-013 — HIGH: Loading state shows raw `<p>Loading...</p>` (team.tsx:34).**
No spinner, no styled state. Fix: replace with `<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />`.

**Gap JRV-014 — HIGH: TeamMemberList always shows UUID instead of member name.**
```tsx
// settings/team.tsx:100-109
<TeamMemberList
  members={members}
  pendingInvitations={pendingInvitations}
  currentUserId={user?.id ?? ''}
  currentUserRole={currentRole ?? 'readonly'}
  onRemoveMember={removeMember}
  onUpdateRole={updateMemberRole}
  onRevokeInvitation={handleRevokeInvitation}
  // memberProfiles prop is NOT passed
/>
```
`TeamMemberList` accepts `memberProfiles?: Record<string, { full_name: string | null; email: string }>`. When absent (default `{}`), it falls back to `member.user_id` (the UUID) as the display name (TeamMemberList.tsx:39: `profile?.full_name ?? member.user_id`). Fix: fetch user profiles for members after loading them in `useOrganization` (or in TeamSettingsPage), build a `memberProfiles` map, pass it to `TeamMemberList`.

**Gap JRV-015 — HIGH: InviteMemberDialog is an unstyled raw HTML div, not a proper modal.**
```tsx
// settings/InviteMemberDialog.tsx:70-128
return (
  <div role="dialog" aria-modal="true">  // ← raw div, no overlay, no positioning
    <h2>Invite Member</h2>
    <input ... />
    <button>Cancel</button>
    <button type="submit">Invite</button>
  </div>
);
```
No modal backdrop, no positioning classes, no shadow, no animation. The dialog just renders inline in the DOM. Fix: Wrap with shadcn/ui `Dialog` (`@/components/ui/dialog`): `<Dialog open={open} onOpenChange={onOpenChange}><DialogContent>...</DialogContent></Dialog>`.

**Gap JRV-016 — MEDIUM: TeamMemberList role dropdown missing.**
`TeamMemberList` renders a role badge `<span>{member.role}</span>` (line 49) but has no role-change UI. `onUpdateRole` is wired but never called from the rendered markup — the "···" action menu (lines 62-77) only has a "Remove" option, not a "Change Role" option. Fix: add "Change Role" to the action dropdown, showing a sub-menu or inline select for `['admin', 'attorney', 'paralegal', 'readonly']`.

---

## Journey Rating

| Phase | Status | Reason |
|-------|--------|--------|
| Return to dashboard | BROKEN | No case list; only static "New Case" CTA |
| Find existing cases | BROKEN | No `/cases` route; no nav item; Deadlines only indirect path |
| Open case at `/cases/$caseId` | PARTIAL | Loads correctly, hydrates state, but no back-to-results shortcut |
| Edit case | PARTIAL | Works but auto-save is dead code; no Cancel→return-to-results |
| Recompute | WORKING | Saves input+output correctly; raw spinner inconsistency |
| Settings — firm profile | PARTIAL | Works but logo upload uses full-page reload hack |
| Settings — team | BROKEN | Route unregistered; component unreachable; raw HTML dialog; UUIDs shown as names |

**Overall rating: BROKEN**

---

## Gap Summary

| ID | Severity | Gap | File | Fix |
|----|----------|-----|------|-----|
| JRV-001 | CRITICAL | Dashboard shows no case list | routes/index.tsx | Call `listCases(orgId)` on mount; render recent 5 cases + "View all →" link to `/cases` |
| JRV-002 | CRITICAL | No `/cases` list route | src/routes/ | Add `routes/cases/index.tsx` CasesListPage using `listCases(orgId)`; add to router.ts routeTree |
| JRV-003 | HIGH | No "Cases" nav item in sidebar | AppLayout.tsx:13-19 | Add `{ to: '/cases', label: 'Cases', icon: FolderOpen }` to navItems array |
| JRV-004 | MEDIUM | Deadlines fetches by user_id, not org_id | routes/deadlines.tsx:79 | Wrap in `useOrganization`; query `.eq('org_id', organization.id)` with join on org members' cases |
| JRV-005 | HIGH | No path to cases if user has no deadlines | routes/deadlines.tsx + AppLayout | Resolved by JRV-002 + JRV-003 (Cases list route + nav item) |
| JRV-006 | MEDIUM | No "Back to Results" shortcut in edit mode | routes/cases/$caseId.tsx | When `caseRow.output_json !== null`, show "Cancel Edit → Back to Results" button that calls `setState({ phase: 'results', input: caseRow.input_json, output: caseRow.output_json })` |
| JRV-007 | HIGH | `useAutoSave` imported but never called | routes/cases/$caseId.tsx:12 | Call `const { status: saveStatus } = useAutoSave(caseId, currentInput)` in wizard phase; show `saveStatus` badge in WizardContainer nav bar (pass as prop or via context) |
| JRV-008 | LOW | Raw CSS spinner in computing phase | routes/cases/$caseId.tsx:99 | Replace with `<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />` |
| JRV-009 | LOW | No success toast on recompute | routes/cases/$caseId.tsx:72 | After `setState({ phase: 'results' })`, call `toast.success('Computation complete')` |
| JRV-010 | MEDIUM | Logo upload does full page reload | routes/settings/index.tsx:73 | Add `refresh()` to FirmProfileContext; call after `uploadLogo()` instead of `window.location.reload()` |
| JRV-011 | MEDIUM | No link from Settings to Team page | routes/settings/index.tsx | Add a "Team" tab or sub-section link to `/settings/team` in SettingsPage; add nav item in sidebar or header |
| JRV-012 | CRITICAL | `/settings/team` route not registered | routes/settings/team.tsx + router.ts | Wrap `TeamSettingsPage` with `createRoute`; import and register in router.ts routeTree |
| JRV-013 | HIGH | Team loading state unstyled | routes/settings/team.tsx:34 | Replace `<p>Loading...</p>` with `<div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>` |
| JRV-014 | HIGH | TeamMemberList shows UUID instead of name | routes/settings/team.tsx:100-109 | Fetch `profiles` table for `user_id IN (members.map(m => m.user_id))`; build `memberProfiles` map; pass to `TeamMemberList` |
| JRV-015 | HIGH | InviteMemberDialog is raw HTML div, not modal | components/settings/InviteMemberDialog.tsx:70 | Replace outer `<div role="dialog">` with shadcn/ui `<Dialog open={open} onOpenChange={onOpenChange}><DialogContent>` wrapper |
| JRV-016 | MEDIUM | TeamMemberList action menu missing role change | components/settings/TeamMemberList.tsx:62-77 | Add "Change Role" option to action dropdown; inline role select showing `['admin', 'attorney', 'paralegal', 'readonly']`; calls `onUpdateRole(member.id, newRole)` |
