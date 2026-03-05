# Journey Audit: Settings → Team — journey-settings-team

**Wave**: 2
**Date**: 2026-03-04
**Overall Rating**: BROKEN
**Gaps found**: 17 (4 CRITICAL, 5 HIGH, 5 MEDIUM, 3 LOW)

---

## Journey Steps Traced

### Step 1: User navigates to Settings (`/settings`)

- Route `/settings` is registered — component renders.
- "Settings" nav item appears in sidebar (AppLayout line 18).
- Page shows Firm Profile, Logo, and Brand Colors — three sections only.
- **Gap JST-004**: No sub-navigation within Settings (no tabs, no sidebar) to reach Team, Billing, or other sub-pages. Team settings is entirely undiscoverable from the running app.

---

### Step 2: Update firm profile

**Source**: `routes/settings/index.tsx:54-129`, `components/settings/FirmProfileForm.tsx`

- FirmProfileForm renders 10 fields (firmName, firmAddress, firmPhone, firmEmail, counselName, counselEmail, counselPhone, ibpRollNo, ptrNo, mcleComplianceNo) using shadcn Input/Label.
- Save button disables during save via `saving` prop.
- `handleSave` in SettingsContent calls `updateProfile(form)` — writes to Supabase via FirmProfileContext.
- **Status: PARTIAL**
- **Gap JST-010** (MEDIUM): No success toast/notification when save completes. Button re-enables silently. User has no confirmation.
- **Gap JST-015** (LOW): No "unsaved changes" warning if user navigates away mid-edit.

---

### Step 3: Upload logo

**Source**: `routes/settings/index.tsx:67-74`, `components/settings/LogoUpload.tsx`

- LogoUpload validates file type (PNG/JPG/SVG) and size (≤2 MB) before calling onUpload.
- `handleLogoUpload` in SettingsContent (line 67-74) calls `uploadLogo(user.id, file)` then `window.location.reload()`.
- **Gap JST-012** (MEDIUM): `window.location.reload()` at `routes/settings/index.tsx:73` is a crude hack. It loses unsaved form state, resets scroll position, and causes a full page flash. Fix: call `updateProfile({ logoUrl: newUrl })` directly after upload completes — `uploadLogo` in `lib/firm-profile.ts` returns the public URL; pass it to `updateProfile` to refresh profile state without a reload.
- **Status: PARTIAL**

---

### Step 4: Update brand colors

**Source**: `routes/settings/index.tsx:117-126`, `components/settings/ColorPickers.tsx`

- ColorPickers renders two color inputs (native `<input type="color">` + shadcn Input for hex).
- Color changes fire `updateProfile()` **on every keystroke / drag event** — no debounce.
- **Gap JST-011** (MEDIUM): No debounce on color change. At `routes/settings/index.tsx:123`, `onLetterheadChange={(color) => updateProfile({ letterheadColor: color })}` fires a Supabase UPDATE on every color picker tick. A single drag can fire 50+ calls.
- **Status: PARTIAL**

---

### Step 5: Navigate to Team Settings

**Source**: `routes/settings/team.tsx`, `router.ts`

- `TeamSettingsPage` function exists at `routes/settings/team.tsx:9`.
- **Gap JST-001** (CRITICAL): No `createRoute` call in `routes/settings/team.tsx`. File is not imported in `router.ts`. The route `/settings/team` does not exist in the running app. Any URL navigation to it returns a 404/not-found.
- **Gap JST-004** (CRITICAL): Even if the route were registered, there is no link to it in the Settings page, no tab bar, no navigation element. It would still be unreachable from the UI without typing the URL manually.

**Sub-steps if the route were reachable:**

#### Loading state
- At `routes/settings/team.tsx:33-35`: `<div className="p-6"><p>Loading...</p></div>` — bare unstyled text.
- **Gap JST-013** (MEDIUM): Should use `<Loader2 className="h-5 w-5 animate-spin">` pattern matching settings/index.tsx loading state.

#### No organization state
- At `routes/settings/team.tsx:41-47`: If user has no org, shows "No organization found. Create or join an organization to manage team members." — no action button.
- **Gap JST-014** (MEDIUM): No path to create an organization from here. New users who land here are stuck.

#### Member list rendering
- `TeamMemberList` is called at line 101-109 **without the `memberProfiles` prop**.
- **Gap JST-007** (HIGH): `memberProfiles` prop is never passed from `TeamSettingsPage`. The prop defaults to `{}` (empty object).
- **Gap JST-006** (HIGH): Because `memberProfiles` is empty, `TeamMemberList.tsx:39` renders `profile?.full_name ?? member.user_id` — the raw UUID (e.g., `550e8400-e29b-41d4-a716-446655440000`) for every team member. Member names are invisible in the list.
- Fix: In TeamSettingsPage, after loading members, fetch user profiles via Supabase auth admin or a `profiles` table query and pass the result as `memberProfiles`.

---

### Step 6: Invite team member (if team page accessible)

**Source**: `components/settings/InviteMemberDialog.tsx`, `lib/organizations.ts:41-53`

- Invite button at `routes/settings/team.tsx:91-98` only renders if `canPerform('canInviteMembers')` — requires admin role.
- Clicking "Invite" sets `inviteDialogOpen = true`, which renders `InviteMemberDialog`.

#### InviteMemberDialog problems
- **Gap JST-005** (HIGH): `InviteMemberDialog` at line 71 renders `<div role="dialog" aria-modal="true">`. This is **not** a real modal. It has:
  - No backdrop/overlay.
  - No focus trap (Tab key leaves the "dialog").
  - No Escape key handler to close.
  - No portal rendering (renders inline in page DOM).
  - The "dialog" appears in page flow below the Invite button — not a floating overlay.
  - Fix: Replace with shadcn `<Dialog>` component from `@/components/ui/dialog`.

- Raw HTML elements throughout:
  - `<h2>Invite Member</h2>` — unstyled heading
  - `<input id="invite-email">` — raw input, no shadcn Input
  - `<select id="invite-role">` — raw select, no shadcn Select
  - `<button>Cancel</button>` and `<button>Invite</button>` — raw buttons, no shadcn Button
  - Fix: Replace each with shadcn equivalents (Input, Select/SelectContent/SelectItem, Button).

- Email validation (regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) and seat-limit check work correctly.
- Submit handler calls `inviteMember(email, role)` → `orgLib.inviteMember(orgId, email, role, userId)` → inserts into `organization_invitations`.
- On success: closes dialog, refreshes pending invitations via `listPendingInvitations`.

#### Role update missing from member actions menu
- **Gap JST-008** (HIGH): `TeamMemberList.tsx:64-78` dropdown only shows "Remove". The `onUpdateRole` prop is defined and wired in TeamSettingsPage (line 107) but no menu item calls it. Users cannot change a member's role.
- Fix: Add a "Change role" submenu or second action item in the dropdown. On click, show a role picker (shadcn Select) inline or in a small popover.

#### Role badge styling
- **Gap JST-009** (MEDIUM): At `TeamMemberList.tsx:48-50`, role rendered as plain text: `{member.role}` with `bg-muted` class only. No color differentiation between admin/attorney/paralegal/readonly.
- Fix: Map roles to Badge variants: `admin` → gold/primary outline, `attorney` → secondary, `paralegal` → secondary, `readonly` → ghost.

---

### Step 7: Invitation delivery to recipient

**Source**: `lib/organizations.ts:41-53`

- **Gap JST-003** (CRITICAL): `inviteMember()` at `lib/organizations.ts:41` only inserts a row to the `organization_invitations` table. There is no email sent. No Supabase Edge Function is called. No SMTP call is made. The invited user receives no notification. The invitation row has a `token` field (generated by DB), but the token is never surfaced in the UI, never included in a link, and never emailed to the recipient.

---

### Step 8: Member accepts invitation

**Source**: `lib/organizations.ts:75-79`

- **Gap JST-002** (CRITICAL): No invitation acceptance route exists anywhere in the router. `acceptInvitation(token)` function exists at `lib/organizations.ts:75` and calls `supabase.rpc('accept_invitation', { p_token: token })`. The RPC exists. But no component calls this function. No route like `/invite/:token` or `/auth/accept-invite` exists. An invited user who somehow received a token URL would find a 404.
- The entire member-acceptance half of the team invite flow is completely missing from the frontend.

---

### Step 9: Seat limit upgrade

- **Gap JST-016** (LOW): At `InviteMemberDialog.tsx:79`, when seat limit is full, shows "Upgrade your plan to add more members." — no link, no action. `/settings/billing` does not exist. The message is a dead end.

---

## Summary Table

| ID | Severity | Description | File | Fix |
|----|----------|-------------|------|-----|
| JST-001 | CRITICAL | `/settings/team` route not registered — page completely unreachable | `routes/settings/team.tsx` (no createRoute), `router.ts` (not imported) | Add `createRoute` call; import and register in routeTree |
| JST-002 | CRITICAL | No invitation acceptance route — `acceptInvitation()` never called | No route file exists | Create `/invite/$token` route that calls `acceptInvitation(token)` and redirects to `/settings/team` or `/` on success |
| JST-003 | CRITICAL | No invitation email — `inviteMember()` only inserts DB row, no email sent | `lib/organizations.ts:41-53` | Create Supabase Edge Function `send-invitation-email` triggered by insert on `organization_invitations`; or call it explicitly from `inviteMember()` |
| JST-004 | CRITICAL | No settings sub-navigation — no way to reach Team settings from UI | `routes/settings/index.tsx` (no tabs), `AppLayout.tsx` (no sub-nav) | Add tab navigation to SettingsPage: tabs for "Firm Profile" `/settings` and "Team" `/settings/team` |
| JST-005 | HIGH | InviteMemberDialog is raw `<div>`, not a real modal | `components/settings/InviteMemberDialog.tsx:71` | Replace root `<div>` with shadcn `<Dialog>` + `<DialogContent>`, replace raw inputs with shadcn Input/Select/Button |
| JST-006 | HIGH | TeamMemberList shows UUID as member name | `components/settings/TeamMemberList.tsx:39` | Fix by passing `memberProfiles` prop; see JST-007 |
| JST-007 | HIGH | `memberProfiles` prop never passed to TeamMemberList | `routes/settings/team.tsx:101-109` | Fetch profiles after loading members: `supabase.from('profiles').select('id,full_name,email').in('id', members.map(m=>m.user_id))`; build map and pass as `memberProfiles` |
| JST-008 | HIGH | No role-change action in member dropdown | `components/settings/TeamMemberList.tsx:64-78` | Add "Change role" menu item; on click show inline shadcn `<Select>` for role; call `onUpdateRole(member.id, newRole)` |
| JST-009 | MEDIUM | Role badge unstyled — same `bg-muted` for all roles | `components/settings/TeamMemberList.tsx:48-50` | Use shadcn `<Badge>` with variant map: `admin` → `default` (gold), `attorney` → `secondary`, `paralegal` → `secondary`, `readonly` → `outline` |
| JST-010 | MEDIUM | No success feedback after firm profile save | `routes/settings/index.tsx:58-65`, `components/settings/FirmProfileForm.tsx` | After `updateProfile` resolves, fire a sonner `toast.success('Firm profile saved')` |
| JST-011 | MEDIUM | ColorPickers fire updateProfile on every drag tick — no debounce | `routes/settings/index.tsx:123-125` | Wrap `updateProfile` calls in `useDebouncedCallback(..., 600)` from `use-debounce` package (not yet installed; add to package.json) |
| JST-012 | MEDIUM | Logo upload calls `window.location.reload()` | `routes/settings/index.tsx:73` | Replace: `await uploadLogo(user.id, file)` returns public URL; call `await updateProfile({ logoUrl: publicUrl })` instead of reload |
| JST-013 | MEDIUM | TeamSettingsPage loading state is bare text | `routes/settings/team.tsx:33-35` | Replace with `<div className="max-w-4xl mx-auto py-6 px-4"><div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div></div>` |
| JST-014 | MEDIUM | No org creation from TeamSettingsPage | `routes/settings/team.tsx:41-47` | Show empty state with action: "Your account doesn't belong to an organization yet. [Create Organization]" button that opens a create-org dialog (name field only); calls `createOrganization(name, userId)` from lib |
| JST-015 | LOW | No unsaved-changes warning in FirmProfileForm | `components/settings/FirmProfileForm.tsx` | Track `isDirty` state (compare `form` vs `profile`); show `<Alert>` banner when dirty; use TanStack Router `onBeforeUnload` or browser `beforeunload` event |
| JST-016 | LOW | Seat limit upgrade CTA has no action | `components/settings/InviteMemberDialog.tsx:79` | Add link: "Upgrade your plan" → `<Link to="/settings/billing">` (requires billing page or external billing portal URL via env var `VITE_BILLING_URL`) |
| JST-017 | LOW | `onUpdateRole` prop accepted but never surfaced — dead prop | `components/settings/TeamMemberList.tsx:9` | Resolved by JST-008 fix |

---

## Journey Rating

| Phase | Status |
|-------|--------|
| Settings page navigation | WORKING |
| Firm profile update | PARTIAL (no success feedback, no unsaved warning) |
| Logo upload | PARTIAL (reload hack) |
| Brand colors update | PARTIAL (no debounce) |
| Team settings navigation | BROKEN (route not registered, no sub-nav) |
| Team settings page | BROKEN (UUID display, no profiles fetch, raw loading state) |
| Invite dialog | BROKEN (not a real modal, raw HTML) |
| Invitation delivery | MISSING (no email sent, no token link, no acceptance route) |
| Member role management | MISSING (onUpdateRole never exposed in UI) |

**Overall: BROKEN** — 4 critical blockers prevent the team invite flow from working end-to-end.
