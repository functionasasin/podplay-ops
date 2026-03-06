# Toast Catalog — TaxKlaro

**Wave:** 5 (Component Wiring + UI)
**Status:** COMPLETE
**Date:** 2026-03-06
**Depends on:** action-trigger-map, computation-management, sharing, org-model, supabase-auth-flow

---

## Summary

Every user action that produces a toast notification, with exact message text, Sonner variant, and triggering context. Toast library: **Sonner** (`import { toast } from 'sonner'`).

**Total toast types: 42** (success: 22, error: 15, info: 2, loading+update: 3)

---

## Installation and Setup

```typescript
// src/main.tsx — add Toaster to root
import { Toaster } from 'sonner';

// Inside the React tree (outside router), after <RouterProvider>:
<Toaster
  position="bottom-right"
  richColors
  closeButton
  duration={4000}
/>
```

```json
// package.json dependency
"sonner": "^1.5.0"
```

---

## 1. Computation Actions

### 1.1 Compute — Success
```typescript
toast.success('Computation complete!');
```
- **Trigger:** `handleCompute()` success path in `routes/computations/$compId.tsx`
- **Shown after:** WASM engine returns result + `output_json` saved to Supabase

### 1.2 Compute — No Input Error
```typescript
toast.error('Please complete the input form before computing.');
```
- **Trigger:** `handleCompute()` when `computation.inputJson` is null/empty

### 1.3 Compute — Validation Error (Zod)
```typescript
toast.error('Input validation failed. Please review the form.');
```
- **Trigger:** `handleCompute()` when `TaxpayerInputSchema.safeParse()` fails
- **Additional effect:** Switches to Input tab, highlights per-field errors

### 1.4 Compute — Engine Error
```typescript
toast.error(result.errors[0]?.message ?? 'Computation failed. Please review inputs.');
```
- **Trigger:** `handleCompute()` when WASM returns `{ type: 'error' }`
- **Note:** Uses engine's first error message verbatim. May include human-readable field-specific text from engine error codes.

### 1.5 Compute — Unexpected Error
```typescript
toast.error('An unexpected error occurred. Please try again.');
```
- **Trigger:** `handleCompute()` catch block (network/Supabase failure)

### 1.6 Finalize — Success
```typescript
toast.success('Computation finalized. Locked for editing.');
```
- **Trigger:** `handleFinalize()` success in `routes/computations/$compId.tsx`

### 1.7 Finalize — Error
```typescript
toast.error('Failed to finalize. Please try again.');
```
- **Trigger:** `handleFinalize()` catch block

### 1.8 Unlock — Success
```typescript
toast.success('Computation unlocked for editing.');
```
- **Trigger:** `handleUnlock()` success in `routes/computations/$compId.tsx`

### 1.9 Unlock — Error
```typescript
toast.error('Failed to unlock. Please try again.');
```
- **Trigger:** `handleUnlock()` catch block

### 1.10 Archive — Success
```typescript
toast.success('Computation archived.');
```
- **Trigger:** `handleArchive()` success (from ActionsBar or ComputationCard overflow)

### 1.11 Archive — Error
```typescript
toast.error('Failed to archive. Please try again.');
```
- **Trigger:** `handleArchive()` catch block

### 1.12 Delete — Success
```typescript
toast.success('Computation deleted.');
```
- **Trigger:** `handleDelete()` success after user confirms in `DeleteComputationDialog`

### 1.13 Delete — Error
```typescript
toast.error('Failed to delete. Please try again.');
```
- **Trigger:** `handleDelete()` catch block

### 1.14 Edit Title — Error
```typescript
toast.error('Failed to save title.');
```
- **Trigger:** `handleTitleSave()` catch block in `ComputationPageHeader`
- **Note:** No success toast for title save — too noisy. The visible title update is the feedback.

### 1.15 Add Note — Success
```typescript
toast.success('Note added.');
```
- **Trigger:** `handleAddNote()` success in `AddNoteForm`

### 1.16 Add Note — Error
```typescript
toast.error('Failed to add note.');
```
- **Trigger:** `handleAddNote()` catch block

---

## 2. PDF Export

### 2.1 PDF Export — Loading
```typescript
const toastId = toast.loading('Preparing PDF...');
```
- **Trigger:** `handleExportPdf()` start, before dynamic import and rendering
- **Persists** until replaced by success or error toast

### 2.2 PDF Export — Success
```typescript
toast.success('PDF downloaded!', { id: toastId });
```
- **Trigger:** `handleExportPdf()` after browser download triggered
- **Replaces** the loading toast via shared `toastId`

### 2.3 PDF Export — No Results Error
```typescript
toast.error('No computation results to export. Please compute first.');
```
- **Trigger:** `handleExportPdf()` when `computation.outputJson` is null

### 2.4 PDF Export — Error
```typescript
toast.error('PDF export failed. Please try again.', { id: toastId });
```
- **Trigger:** `handleExportPdf()` catch block
- **Replaces** the loading toast via shared `toastId`

---

## 3. Sharing

### 3.1 Share Enabled — Success
```typescript
toast.success('Sharing enabled! Anyone with the link can view.');
```
- **Trigger:** `handleToggle(true)` success in `ShareToggle`

### 3.2 Share Disabled — Info
```typescript
toast.info('Share link disabled.');
```
- **Trigger:** `handleToggle(false)` success in `ShareToggle`
- **Variant:** `toast.info` (blue, not green)

### 3.3 Share Toggle — Error
```typescript
toast.error('Failed to update sharing. Please try again.');
```
- **Trigger:** `handleToggle()` catch block

### 3.4 Copy Link — Success
```typescript
toast.success('Link copied to clipboard!');
```
- **Trigger:** `handleCopy()` success in `ShareToggle`

### 3.5 Copy Link — Clipboard Error
```typescript
toast.error('Could not copy. Please copy the URL manually.');
```
- **Trigger:** `handleCopy()` catch block (clipboard API denied/unavailable)

### 3.6 Rotate Share Link — Success
```typescript
toast.success('Share link rotated. Previous link is now invalid.');
```
- **Trigger:** `handleRotate()` success in `ShareToggle`

### 3.7 Rotate Share Link — Error
```typescript
toast.error('Failed to rotate link. Please try again.');
```
- **Trigger:** `handleRotate()` catch block

---

## 4. Deadlines

### 4.1 Mark Deadline Complete — Error
```typescript
toast.error('Failed to mark deadline complete.');
```
- **Trigger:** `handleCompleteDeadline()` catch block in `DeadlineCard`
- **Note:** No success toast for marking complete — the checked checkbox visual is the feedback.

---

## 5. Team Management

### 5.1 Send Invitation — Success
```typescript
toast.success(`Invitation sent to ${data.email}`);
```
- **Trigger:** `handleInvite()` success in `InviteMemberForm`
- **Interpolation:** Includes the invited email address

### 5.2 Send Invitation — Generic Error
```typescript
toast.error('Failed to send invitation. Please try again.');
```
- **Trigger:** `handleInvite()` catch block or unknown RPC error
- **Note:** Email-already-member and already-invited errors are shown as inline field errors, NOT toasts

### 5.3 Remove Team Member — Success
```typescript
toast.success('Team member removed.');
```
- **Trigger:** `handleRemove()` success in `MembersTable`

### 5.4 Remove Team Member — Error
```typescript
toast.error('Failed to remove team member.');
```
- **Trigger:** `handleRemove()` catch block

### 5.5 Revoke Invitation — Success
```typescript
toast.success('Invitation revoked.');
```
- **Trigger:** `handleRevoke()` success in `PendingInvitationsTable`

### 5.6 Revoke Invitation — Error
```typescript
toast.error('Failed to revoke invitation.');
```
- **Trigger:** `handleRevoke()` catch block

---

## 6. Settings

### 6.1 Save Settings — Success
```typescript
toast.success('Settings saved.');
```
- **Trigger:** `handleSave()` success in any settings section (PersonalInfoSection, FirmBrandingSection, BirInfoSection)

### 6.2 Save Settings — Error
```typescript
toast.error('Failed to save settings. Please try again.');
```
- **Trigger:** `handleSave()` catch block

### 6.3 Logo Upload — Loading
```typescript
const toastId = toast.loading('Uploading logo...');
```
- **Trigger:** `handleLogoUpload()` start in `FirmBrandingSection`

### 6.4 Logo Upload — Success
```typescript
toast.success('Logo uploaded!', { id: toastId });
```
- **Trigger:** `handleLogoUpload()` success, after `logo_url` saved to `user_profiles`

### 6.5 Logo Upload — Not Image Error
```typescript
toast.error('Please upload an image file.');
```
- **Trigger:** `handleLogoUpload()` when `!file.type.startsWith('image/')`
- **Note:** Early validation, no loading toast created yet

### 6.6 Logo Upload — Too Large Error
```typescript
toast.error('Logo must be under 2MB.');
```
- **Trigger:** `handleLogoUpload()` when `file.size > 2 * 1024 * 1024`
- **Note:** Early validation, no loading toast created yet

### 6.7 Logo Upload — Storage Error
```typescript
toast.error('Logo upload failed. Please try again.', { id: toastId });
```
- **Trigger:** `handleLogoUpload()` catch block

---

## 7. Auth and Onboarding

### 7.1 Accept Invitation — Success
```typescript
toast.success('Welcome to the team!');
```
- **Trigger:** `handleAccept()` success in `routes/invite/$token.tsx`
- **Post-action:** Navigate to `/`

### 7.2 Accept Invitation — Generic Error
```typescript
toast.error('Failed to accept invitation. Please try again.');
```
- **Trigger:** `handleAccept()` catch block
- **Note:** `expired` and `already-accepted` states are shown as page-level states (not toasts)

### 7.3 Accept Invitation — Unexpected Error
```typescript
toast.error('An unexpected error occurred.');
```
- **Trigger:** `handleAccept()` outer catch block

### 7.4 Create Organization — Error
```typescript
toast.error('Failed to create firm. Please try again.');
```
- **Trigger:** `handleSubmit()` in `OnboardingForm` on generic RPC error
- **Note:** `slug already taken` is an inline field error on the slug input, NOT a toast

### 7.5 Create Organization — Unexpected Error
```typescript
toast.error('An unexpected error occurred.');
```
- **Trigger:** `handleSubmit()` outer catch block in `OnboardingForm`

---

## 8. Auto-save

Auto-save uses Sonner's update-by-id pattern with a persistent indicator, not individual toasts.

```typescript
// src/hooks/useAutoSave.ts — pattern

// Approach: No toast for auto-save success (too noisy for 1.5s debounce)
// Instead: SaveStatusIndicator component shows inline status
// Only show toast on auto-save ERROR

// On auto-save failure only:
toast.error('Error saving computation. Check your connection.');
```

**SaveStatusIndicator** (not a toast — it's inline in the UI):
```typescript
// src/components/computation/SaveStatusIndicator.tsx
// Renders one of:
// - <span className="text-muted-foreground text-sm">Saving...</span>  (while debounce pending + Supabase write)
// - <span className="text-muted-foreground text-sm flex items-center gap-1"><Check className="h-3 w-3" /> Saved</span>  (after success)
// - <span className="text-destructive text-sm flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Save failed</span>  (on error)
// Located in: ComputationPageHeader, top-right area near title
```

**Rationale for no success toast on auto-save:** The 1.5s debounce triggers frequently during form editing. Showing a success toast every save would be extremely noisy and distract from data entry.

---

## 9. No-Toast Interactions

The following interactions intentionally produce NO toast (feedback is visual in-place):

| Action | Why No Toast |
|--------|-------------|
| Sign out | Router redirect to `/auth` is the feedback |
| Auto-save success | Inline SaveStatusIndicator is used instead |
| Title inline edit save | Updated title text is immediately visible |
| Mark deadline complete | Checked checkbox + strikethrough text is the feedback |
| Form field validation errors | Inline field-level error messages (not toasts) |
| Already-member invite error | Inline field error on email input |
| Already-invited error | Inline field error on email input |
| Slug-taken error (onboarding) | Inline field error on slug input |
| Expired invitation | Full page state change (not a toast) |
| Already-accepted invitation | Full page state change (not a toast) |

---

## 10. Complete API Reference

All calls use Sonner's functional API. Never use Sonner's `<Toast>` JSX component.

```typescript
import { toast } from 'sonner';

// Simple variants:
toast.success('Message text');
toast.error('Message text');
toast.info('Message text');
toast.warning('Message text');  // not used in TaxKlaro currently

// Loading + update pattern:
const toastId = toast.loading('Loading message...');
// Later:
toast.success('Done!', { id: toastId });       // replaces loading toast
toast.error('Failed!', { id: toastId });       // replaces loading toast

// With interpolation:
toast.success(`Invitation sent to ${email}`);

// Duration override (for longer messages):
toast.success('Share link rotated. Previous link is now invalid.', { duration: 5000 });

// NEVER use:
// toast({ title: '...' })    — this is shadcn/ui's toast, not Sonner
// useToast()                 — shadcn/ui hook, not applicable
```

---

## 11. Sonner Configuration

```typescript
// src/main.tsx
<Toaster
  position="bottom-right"
  richColors           // enables colored variants matching TaxKlaro brand
  closeButton          // adds X button for dismissal
  duration={4000}      // 4 seconds default
  toastOptions={{
    classNames: {
      toast: 'font-sans text-sm',
    },
  }}
/>
```

**`richColors` mapping to TaxKlaro palette:**
- `toast.success` → green (#16A34A background tint)
- `toast.error` → red (#DC2626 background tint)
- `toast.info` → blue (#1D4ED8 background tint)
- `toast.loading` → neutral (spinner animation)

---

## 12. Toast Count Summary

| Category | Success | Error | Info | Loading | Total |
|----------|---------|-------|------|---------|-------|
| Computation actions | 3 | 7 | 0 | 0 | 10 |
| PDF export | 1 | 2 | 0 | 1 | 4 |
| Sharing | 3 | 3 | 1 | 0 | 7 |
| Deadlines | 0 | 1 | 0 | 0 | 1 |
| Team management | 3 | 3 | 0 | 0 | 6 |
| Settings | 2 | 4 | 0 | 1 | 7 |
| Auth / onboarding | 1 | 4 | 0 | 0 | 5 |
| Auto-save error | 0 | 1 | 0 | 0 | 1 |
| **Total** | **13** | **25** | **1** | **2** | **41** |

---

## 13. Forward Loop Instructions

The forward loop must:

1. Install `sonner` as a dependency (not `@radix-ui/react-toast` or shadcn toast)
2. Add `<Toaster />` to `src/main.tsx` (not `src/App.tsx` — it needs to be outside the router)
3. Use `toast.success/error/info/loading` from `'sonner'` exclusively
4. Do NOT install or use the shadcn/ui `toast` component (the `useToast()` hook pattern)
5. For every loading+update flow (PDF export, logo upload), generate a `toastId` with `toast.loading()` and pass `{ id: toastId }` to the replacement call
6. Auto-save uses `SaveStatusIndicator` inline component — NOT a toast for success
7. Inline field errors (validation) are never replaced with toasts — they stay as field-level messages

**Critical trap:** If the forward loop installs shadcn/ui's toast component (`components/ui/toast.tsx`, `hooks/use-toast.ts`), it will conflict with Sonner. Only Sonner should be used. The shadcn/ui toast component must NOT be present.
