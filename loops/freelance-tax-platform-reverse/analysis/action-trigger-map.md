# Action Trigger Map — TaxKlaro

**Wave:** 5 (Component Wiring + UI)
**Status:** COMPLETE
**Date:** 2026-03-06
**Depends on:** component-wiring-map, computation-management, sharing, org-model, supabase-migrations

---

## Summary

Every action-triggered feature (non-navigation) specified with exact button text, icon, parent component, handler body, loading state, toast messages, error handling, and premium gating. This prevents the inheritance failure where entire PDF infrastructure was built but no trigger button existed.

**Total action-triggered features: 23**

---

## 1. ActionsBar — Computation Detail Page

`ActionsBar` is the toolbar rendered inside `ComputationPageHeader` at the top of `/computations/$compId`. It is the primary trigger surface for computation lifecycle actions.

### Location and Props

```typescript
// src/components/computation/ActionsBar.tsx

interface ActionsBarProps {
  computation: ComputationRow;
  canShare: boolean;         // org.plan !== 'FREE'
  canExportPdf: boolean;     // org.plan === 'PRO' || org.plan === 'ENTERPRISE'
  onCompute: () => Promise<void>;
  onFinalize: () => Promise<void>;
  onUnlock: () => Promise<void>;
  onExportPdf: () => Promise<void>;
  onShareOpen: () => void;   // opens Sheet — sync, no async needed
  onArchive: () => Promise<void>;
  onDelete: () => void;      // opens DeleteComputationDialog — sync
}
```

### Button Visibility Matrix

| Button | Shown When | Disabled When |
|--------|-----------|---------------|
| "Compute" (primary) | `status === 'draft'` | `isComputing === true` |
| "Re-compute" | `status === 'computed'` | `isComputing === true` |
| "Finalize" | `status === 'computed'` | — |
| "Unlock" | `status === 'finalized'` | — |
| "Export PDF" | `status === 'computed' \| 'finalized'` | `!canExportPdf` (grayed + tooltip: "Upgrade to PRO") |
| "Share" | `status === 'computed' \| 'finalized'` | `!canShare` (grayed + tooltip: "Upgrade to PRO") |
| "Archive" (dropdown) | `status !== 'archived'` | — |
| "Delete" (dropdown) | Always | — |

### More Actions Dropdown

The `MoreHorizontal` icon button opens a `<DropdownMenu>`:
- "Archive" (Archive icon) — conditional (not shown for archived)
- Separator
- "Delete" (Trash2 icon, destructive variant, red text)

---

## 2. Feature Specifications

### 2.1 Run Computation

**Button:** "Compute" (blue primary) with `Zap` icon
**Parent:** `ActionsBar`
**Shown:** `status === 'draft'`

```typescript
// src/routes/computations/$compId.tsx — handleCompute

async function handleCompute() {
  if (!computation || !computation.inputJson) {
    toast.error('Please complete the input form before computing.');
    return;
  }

  setIsComputing(true);
  try {
    // 1. Parse and validate input
    const parseResult = TaxpayerInputSchema.safeParse(computation.inputJson);
    if (!parseResult.success) {
      toast.error('Input validation failed. Please review the form.');
      setValidationErrors(parseResult.error.flatten().fieldErrors);
      setActiveTab('input');   // switch to Input tab to show errors
      return;
    }

    // 2. Call WASM engine via bridge
    const result = await compute(parseResult.data);  // from useCompute() hook

    if (result.type === 'error') {
      // Validation errors from engine
      toast.error(result.errors[0]?.message ?? 'Computation failed. Please review inputs.');
      return;
    }

    // 3. Save output to Supabase
    await saveComputationOutput(computation.id, result.output);

    // 4. Update local state
    setComputation(prev => prev ? {
      ...prev,
      status: 'computed',
      outputJson: result.output,
      updatedAt: new Date().toISOString()
    } : prev);

    // 5. Switch to Results tab
    setActiveTab('results');

    toast.success('Computation complete!');
  } catch (err) {
    console.error('Compute error:', err);
    toast.error('An unexpected error occurred. Please try again.');
  } finally {
    setIsComputing(false);
  }
}
```

**Loading state:** Button shows `<Loader2 className="animate-spin" />` + "Computing..." text while `isComputing === true`. Button is disabled.

**Error states:**
- No input: toast.error "Please complete the input form before computing."
- Validation errors from Zod: switches to Input tab, highlights field errors
- WASM engine error: toast.error with engine's first error message
- Network/Supabase error: toast.error "An unexpected error occurred"

---

### 2.2 Re-compute

**Button:** "Re-compute" (outline variant) with `RefreshCw` icon
**Parent:** `ActionsBar`
**Shown:** `status === 'computed'`

Same handler as `handleCompute()` — clears `output_json` first before re-running, then sets status back to `computed` with new output.

```typescript
// Additional step at start of handler when status === 'computed':
await supabase.from('computations')
  .update({ output_json: null, status: 'draft' })
  .eq('id', computation.id);
setComputation(prev => prev ? { ...prev, status: 'draft', outputJson: null } : prev);
// Then proceed with normal compute flow
```

---

### 2.3 Finalize

**Button:** "Finalize" (outline variant) with `Lock` icon
**Parent:** `ActionsBar`
**Shown:** `status === 'computed'`

```typescript
async function handleFinalize() {
  setIsFinalizingOrUnlocking(true);
  try {
    await supabase.from('computations')
      .update({ status: 'finalized', updated_at: new Date().toISOString() })
      .eq('id', computation.id)
      .eq('status', 'computed');  // optimistic concurrency check

    setComputation(prev => prev ? { ...prev, status: 'finalized' } : prev);
    toast.success('Computation finalized. Locked for editing.');
  } catch (err) {
    toast.error('Failed to finalize. Please try again.');
  } finally {
    setIsFinalizingOrUnlocking(false);
  }
}
```

**Loading state:** Button shows spinner.
**Post-action:** `WizardForm` becomes `readOnly={true}`, showing "Locked — Unlock to edit" banner.

---

### 2.4 Unlock

**Button:** "Unlock" (ghost variant) with `LockOpen` icon
**Parent:** `ActionsBar`
**Shown:** `status === 'finalized'`

```typescript
async function handleUnlock() {
  setIsFinalizingOrUnlocking(true);
  try {
    await supabase.from('computations')
      .update({ status: 'computed', updated_at: new Date().toISOString() })
      .eq('id', computation.id);

    setComputation(prev => prev ? { ...prev, status: 'computed' } : prev);
    toast.success('Computation unlocked for editing.');
  } catch (err) {
    toast.error('Failed to unlock. Please try again.');
  } finally {
    setIsFinalizingOrUnlocking(false);
  }
}
```

---

### 2.5 Export PDF

**Button:** "Export PDF" with `Download` icon
**Parent:** `ActionsBar`
**Shown:** `status === 'computed' || status === 'finalized'`
**Disabled:** `!canExportPdf` (non-PRO/ENTERPRISE)
**Tooltip when disabled:** "Upgrade to PRO to export PDF"

```typescript
// src/routes/computations/$compId.tsx — handleExportPdf
// This is the TRIGGER. TaxComputationDocument is the PDF component.

async function handleExportPdf() {
  if (!computation?.outputJson) {
    toast.error('No computation results to export. Please compute first.');
    return;
  }

  setIsExportingPdf(true);
  const toastId = toast.loading('Preparing PDF...');

  try {
    // Dynamic import — prevents eager loading of @react-pdf/renderer (large bundle)
    const { pdf } = await import('@react-pdf/renderer');
    const { TaxComputationDocument } = await import('@/components/pdf/TaxComputationDocument');

    // Fetch firm profile for branding
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user!.id)
      .single();

    const doc = React.createElement(TaxComputationDocument, {
      result: computation.outputJson as TaxComputationResult,
      firmProfile: profile,
      computation: computation,
    });

    const blob = await pdf(doc).toBlob();

    // Build filename: tax-computation-{name}-{year}.pdf
    const taxpayerName = (computation.inputJson as TaxpayerInput)
      ?.taxpayerProfile?.fullName?.replace(/\s+/g, '-').toLowerCase()
      ?? 'taxpayer';
    const taxYear = computation.taxYear ?? new Date().getFullYear() - 1;
    const filename = `tax-computation-${taxpayerName}-${taxYear}.pdf`;

    // Trigger browser download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('PDF downloaded!', { id: toastId });
  } catch (err) {
    console.error('PDF export error:', err);
    toast.error('PDF export failed. Please try again.', { id: toastId });
  } finally {
    setIsExportingPdf(false);
  }
}
```

**CRITICAL:** `TaxComputationDocument` is dynamically imported inside this handler. The orphan scan will not find it via static import analysis. The forward loop must add a comment in `ActionsBar.tsx`:
```typescript
// Dynamic import trigger: @/components/pdf/TaxComputationDocument
// Loaded inside handleExportPdf() in the parent ComputationDetailPage
```

**Loading state:** Button shows spinner. Toast shows "Preparing PDF..." until complete or error.
**PDF filename format:** `tax-computation-{kebab-case-name}-{tax-year}.pdf`

---

### 2.6 Open Share Panel

**Button:** "Share" with `Share2` icon (outline variant)
**Parent:** `ActionsBar`
**Shown:** `status === 'computed' || status === 'finalized'`
**Disabled:** `!canShare` (FREE plan)
**Tooltip when disabled:** "Upgrade to PRO to share computations"

```typescript
// Sync — just opens the Sheet
function handleShareOpen() {
  setSharePanelOpen(true);
}
```

**The `ShareToggle` component lives inside a `<Sheet>` in `ComputationDetailPage`, NOT inside `ActionsBar`.**

```typescript
// src/routes/computations/$compId.tsx — layout structure

return (
  <>
    <AppLayout>
      <ComputationPageHeader
        computation={computation}
        actionsBar={
          <ActionsBar
            onShareOpen={handleShareOpen}
            // ... other handlers
          />
        }
      />
      {/* Tabs: Input | Results | Quarterly | Notes | Deadlines */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* ... tab content ... */}
      </Tabs>
    </AppLayout>

    {/* Share Sheet — sibling of AppLayout content, NOT inside ActionsBar */}
    <Sheet open={sharePanelOpen} onOpenChange={setSharePanelOpen}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Share Computation</SheetTitle>
        </SheetHeader>
        <ShareToggle
          computationId={computation.id}
          shareToken={computation.shareToken}
          shareEnabled={computation.shareEnabled}
          onShareChange={(enabled, token) => {
            setComputation(prev => prev ? { ...prev, shareEnabled: enabled, shareToken: token } : prev);
          }}
        />
      </SheetContent>
    </Sheet>

    {/* Delete Dialog */}
    <DeleteComputationDialog
      open={deleteDialogOpen}
      computation={computation}
      onConfirm={handleDelete}
      onCancel={() => setDeleteDialogOpen(false)}
    />
  </>
);
```

---

### 2.7 Toggle Share On

**Control:** `<Switch>` toggled to ON
**Parent:** `ShareToggle` (inside Sheet)

```typescript
// src/components/computation/ShareToggle.tsx — handleToggle(true)

async function handleToggle(enabled: boolean) {
  setIsToggling(true);
  try {
    await supabase.from('computations')
      .update({ share_enabled: enabled })
      .eq('id', computationId);

    onShareChange(enabled, shareToken);

    if (enabled) {
      toast.success('Sharing enabled! Anyone with the link can view.');
    } else {
      toast.info('Share link disabled.');
    }
  } catch (err) {
    toast.error('Failed to update sharing. Please try again.');
    // Revert optimistic update
  } finally {
    setIsToggling(false);
  }
}
```

**UI when enabled:** URL input (read-only) + "Copy" button appear below the Switch.
**UI when disabled:** URL input and Copy button are hidden.

---

### 2.8 Copy Share URL

**Button:** "Copy" with `Copy` icon (ghost variant)
**Parent:** `ShareToggle`
**Shown when:** `shareEnabled === true`

```typescript
async function handleCopy() {
  const shareUrl = `${import.meta.env.VITE_APP_URL}/share/${shareToken}`;
  try {
    await navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied to clipboard!');
  } catch (err) {
    // Fallback for clipboard API failure
    toast.error('Could not copy. Please copy the URL manually.');
  }
}
```

---

### 2.9 Rotate Share Link

**Button:** "Rotate link" (ghost, small, text-muted) with `RefreshCw` icon
**Parent:** `ShareToggle`
**Shown when:** `shareEnabled === true`
**Purpose:** Invalidates the current link by generating a new `share_token` UUID.

```typescript
async function handleRotate() {
  setIsRotating(true);
  try {
    const { data, error } = await supabase
      .from('computations')
      .update({ share_token: crypto.randomUUID() })
      .eq('id', computationId)
      .select('share_token')
      .single();

    if (error) throw error;

    onShareChange(true, data.share_token);
    toast.success('Share link rotated. Previous link is now invalid.');
  } catch (err) {
    toast.error('Failed to rotate link. Please try again.');
  } finally {
    setIsRotating(false);
  }
}
```

---

### 2.10 Archive Computation

**Menu Item:** "Archive" in `MoreHorizontal` dropdown with `Archive` icon
**Parent:** `ActionsBar` dropdown
**Shown when:** `status !== 'archived'`

```typescript
async function handleArchive() {
  // No confirmation dialog needed for archive (reversible)
  setIsArchiving(true);
  try {
    await supabase.from('computations')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', computation.id);

    toast.success('Computation archived.');
    navigate({ to: '/computations' });  // return to list
  } catch (err) {
    toast.error('Failed to archive. Please try again.');
  } finally {
    setIsArchiving(false);
  }
}
```

---

### 2.11 Delete Computation

**Menu Item:** "Delete" in `MoreHorizontal` dropdown with `Trash2` icon (red/destructive)
**Parent:** `ActionsBar` dropdown OR `ComputationCard` overflow menu

```typescript
// Step 1: Opens DeleteComputationDialog (sync)
function handleDeleteClick() {
  setDeleteDialogOpen(true);
}

// Step 2: Called from DeleteComputationDialog onConfirm
async function handleDelete() {
  setIsDeleting(true);
  try {
    // Soft delete
    await supabase.from('computations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', computation.id);

    toast.success('Computation deleted.');
    navigate({ to: '/computations' });
  } catch (err) {
    toast.error('Failed to delete. Please try again.');
  } finally {
    setIsDeleting(false);
    setDeleteDialogOpen(false);
  }
}
```

**DeleteComputationDialog:**
```typescript
// src/components/computation/DeleteComputationDialog.tsx
// Uses shadcn AlertDialog (not Dialog) for destructive confirmation

interface DeleteComputationDialogProps {
  open: boolean;
  computation: { title: string };
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

// Renders:
// Title: "Delete computation?"
// Description: "This will permanently delete "{computation.title}". This action cannot be undone."
// Cancel button: "Cancel" (outline)
// Confirm button: "Delete" (destructive variant, red)
```

---

### 2.12 Edit Title Inline

**Trigger:** Click on `<h1>` title text in `ComputationPageHeader` (cursor-text style)
**Parent:** `ComputationPageHeader`

```typescript
// src/components/computation/ComputationPageHeader.tsx

const [isEditingTitle, setIsEditingTitle] = useState(false);
const [titleValue, setTitleValue] = useState(computation.title);
const titleInputRef = useRef<HTMLInputElement>(null);

function handleTitleClick() {
  if (computation.status === 'finalized') return;  // no edit when finalized
  setIsEditingTitle(true);
  setTimeout(() => titleInputRef.current?.select(), 0);
}

async function handleTitleSave() {
  const trimmed = titleValue.trim();
  if (!trimmed || trimmed === computation.title) {
    setIsEditingTitle(false);
    setTitleValue(computation.title);
    return;
  }
  try {
    await supabase.from('computations')
      .update({ title: trimmed })
      .eq('id', computation.id);
    setIsEditingTitle(false);
    onTitleSave(trimmed);  // updates parent state
    // No toast for title save — too noisy
  } catch (err) {
    toast.error('Failed to save title.');
    setIsEditingTitle(false);
    setTitleValue(computation.title);
  }
}

// When editing: renders <Input ref={titleInputRef} onBlur={handleTitleSave} onKeyDown={e => e.key === 'Enter' && handleTitleSave()} />
// When not editing: renders <h1 onClick={handleTitleClick} className="cursor-text hover:text-blue-600">{titleValue}</h1>
// When finalized: renders <h1 className="cursor-default">{titleValue}</h1> (no pointer cursor, no click handler)
```

---

### 2.13 Add Note

**Button:** "Add Note" with `Send` icon (primary)
**Parent:** `AddNoteForm`

```typescript
// src/components/computation/AddNoteForm.tsx

async function handleAddNote(e: React.FormEvent) {
  e.preventDefault();
  const content = noteContent.trim();
  if (!content) return;

  setIsSubmitting(true);
  try {
    await supabase.from('computation_notes').insert({
      computation_id: computationId,
      user_id: userId,
      content,
    });
    setNoteContent('');
    onAdded();  // triggers parent to refetch notes list
    toast.success('Note added.');
  } catch (err) {
    toast.error('Failed to add note.');
  } finally {
    setIsSubmitting(false);
  }
}
```

**Note:** Notes are append-only. There are no edit or delete buttons on `NotesList` items.

---

### 2.14 Mark Deadline Complete

**Control:** Checkbox in `DeadlineCard`
**Parent:** `DeadlineCard` (used in both `DeadlinesList` in detail page and `DeadlinesPage`)

```typescript
// src/components/deadlines/DeadlineCard.tsx — onComplete prop

// Called from DeadlinesPage and DeadlinesList:
async function handleCompleteDeadline(deadlineId: string) {
  try {
    await supabase.from('computation_deadlines')
      .update({ completed_date: new Date().toISOString() })
      .eq('id', deadlineId);

    // Optimistic update in parent: update deadlines list state
    onComplete(deadlineId);
    // No toast — checkbox visual feedback is sufficient
  } catch (err) {
    toast.error('Failed to mark deadline complete.');
  }
}
```

**Visual:** When `completed_date !== null`, DeadlineCard shows checked checkbox + strikethrough text + `text-muted-foreground`.

---

### 2.15 Send Team Invitation

**Button:** "Send Invitation" with `UserPlus` icon (primary)
**Parent:** `InviteMemberForm` (inside `TeamSettingsPage`)

```typescript
// src/components/settings/InviteMemberForm.tsx

interface InviteMemberFormProps {
  orgId: string;
  canInvite: boolean;   // org.members.length < org.seatLimit
  onInvited: () => void;
}

async function handleInvite(e: React.FormEvent) {
  e.preventDefault();
  const data = { email: email.trim().toLowerCase(), role };
  const validation = InviteMemberSchema.safeParse(data);
  if (!validation.success) {
    setErrors(validation.error.flatten().fieldErrors);
    return;
  }

  setIsInviting(true);
  try {
    const { error } = await supabase.rpc('invite_member', {
      p_org_id: orgId,
      p_email: data.email,
      p_role: data.role,
      p_invited_by: user!.id,
    });

    if (error) {
      if (error.message.includes('already a member')) {
        setErrors({ email: ['This person is already a team member.'] });
      } else if (error.message.includes('already invited')) {
        setErrors({ email: ['An invitation has already been sent to this email.'] });
      } else {
        toast.error('Failed to send invitation. Please try again.');
      }
      return;
    }

    toast.success(`Invitation sent to ${data.email}`);
    setEmail('');
    setRole('staff');
    onInvited();  // triggers parent to refetch pending invitations
  } catch (err) {
    toast.error('Failed to send invitation. Please try again.');
  } finally {
    setIsInviting(false);
  }
}
```

**Disabled:** When `!canInvite` (at seat limit), form renders with a disabled state + "Your plan allows {seatLimit} seats. Upgrade to add more team members."

---

### 2.16 Remove Team Member

**Button:** "Remove" with `UserMinus` icon (destructive ghost)
**Parent:** Each row in `MembersTable`
**Not shown for:** The current user's own row (`member.userId === currentUserId`) or the last admin

```typescript
// src/components/settings/MembersTable.tsx

async function handleRemove(memberId: string, memberEmail: string) {
  // Inline confirmation via AlertDialog — same pattern as delete computation
  if (!window.confirm(`Remove ${memberEmail} from the team?`)) return;
  // NOTE: Replace window.confirm with AlertDialog for production

  try {
    await supabase.from('organization_members')
      .delete()
      .eq('id', memberId);

    onRemove(memberId);  // parent updates member list
    toast.success('Team member removed.');
  } catch (err) {
    toast.error('Failed to remove team member.');
  }
}
```

**Constraint:** Cannot remove the last admin. Show error: "Cannot remove the last admin. Promote another member first."

---

### 2.17 Revoke Invitation

**Button:** "Revoke" with `X` icon (ghost, small)
**Parent:** Each row in `PendingInvitationsTable`

```typescript
async function handleRevoke(invitationId: string) {
  try {
    await supabase.from('organization_invitations')
      .update({ status: 'revoked' })
      .eq('id', invitationId);

    onRevoke(invitationId);  // parent removes row
    toast.success('Invitation revoked.');
  } catch (err) {
    toast.error('Failed to revoke invitation.');
  }
}
```

---

### 2.18 Save Firm/Profile Settings

**Button:** "Save Changes" with `Save` icon (primary)
**Parent:** `PersonalInfoSection`, `FirmBrandingSection`, `BirInfoSection` (each has its own Save button)

```typescript
// Pattern for each settings section

async function handleSave(e: React.FormEvent) {
  e.preventDefault();
  const validation = sectionSchema.safeParse(formData);
  if (!validation.success) {
    setErrors(validation.error.flatten().fieldErrors);
    return;
  }

  setIsSaving(true);
  try {
    await supabase.from('user_profiles')
      .update(validation.data)
      .eq('id', user!.id);

    toast.success('Settings saved.');
  } catch (err) {
    toast.error('Failed to save settings. Please try again.');
  } finally {
    setIsSaving(false);
  }
}
```

**FirmBrandingSection** additionally updates `organizations` table (for `name`, `slug`):
```typescript
await Promise.all([
  supabase.from('user_profiles').update(profileData).eq('id', user!.id),
  supabase.from('organizations').update(orgData).eq('id', orgId),
]);
```

---

### 2.19 Upload Firm Logo

**Button:** "Upload Logo" with `Upload` icon (outline)
**Parent:** `FirmBrandingSection`

```typescript
// src/components/settings/FirmBrandingSection.tsx

async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validate: image, <= 2MB
  if (!file.type.startsWith('image/')) {
    toast.error('Please upload an image file.');
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    toast.error('Logo must be under 2MB.');
    return;
  }

  setIsUploading(true);
  const toastId = toast.loading('Uploading logo...');
  try {
    const ext = file.name.split('.').pop();
    const path = `${user!.id}/logo.${ext}`;

    await supabase.storage
      .from('firm-logos')
      .upload(path, file, { upsert: true });

    const { data: { publicUrl } } = supabase.storage
      .from('firm-logos')
      .getPublicUrl(path);

    await supabase.from('user_profiles')
      .update({ logo_url: publicUrl })
      .eq('id', user!.id);

    setLogoUrl(publicUrl);
    toast.success('Logo uploaded!', { id: toastId });
  } catch (err) {
    toast.error('Logo upload failed. Please try again.', { id: toastId });
  } finally {
    setIsUploading(false);
    // Reset file input
    e.target.value = '';
  }
}
```

**Hidden file input:** `<input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleLogoUpload} />`
**The "Upload Logo" button:** `<Button onClick={() => fileInputRef.current?.click()}>Upload Logo</Button>`

---

### 2.20 Accept Team Invitation

**Button:** "Accept Invitation" with `Check` icon (primary)
**Parent:** `InviteAcceptPage` (`routes/invite/$token.tsx`)

```typescript
// src/routes/invite/$token.tsx

async function handleAccept() {
  setIsAccepting(true);
  try {
    const { error } = await supabase.rpc('accept_invitation', {
      p_token: params.token as string,  // will be cast to UUID in RPC
    });

    if (error) {
      if (error.message.includes('expired')) {
        setPageState('expired');
      } else if (error.message.includes('already accepted')) {
        setPageState('already-accepted');
      } else {
        toast.error('Failed to accept invitation. Please try again.');
      }
      return;
    }

    toast.success('Welcome to the team!');
    navigate({ to: '/' });
  } catch (err) {
    toast.error('An unexpected error occurred.');
  } finally {
    setIsAccepting(false);
  }
}
```

**Page states:**
- `loading` — fetching invitation details (skeleton)
- `valid` — shows invitation details + "Accept Invitation" button
- `expired` — shows error: "This invitation has expired. Ask your team admin to send a new one."
- `already-accepted` — shows info: "You're already a member of this team." + "Go to Dashboard" button
- `not-found` — shows 404: "This invitation link is invalid."
- `requires-auth` — if user is not logged in, shows: "Create an account or sign in to accept this invitation." + sign-in link

---

### 2.21 Create Organization (Onboarding)

**Button:** "Create Firm" (primary, full-width)
**Parent:** `OnboardingForm`

```typescript
// src/components/onboarding/OnboardingForm.tsx

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  const validation = OnboardingFormSchema.safeParse({ firmName, slug: autoSlug(firmName) });
  if (!validation.success) {
    setErrors(validation.error.flatten().fieldErrors);
    return;
  }

  setIsCreating(true);
  try {
    const { error } = await supabase.rpc('create_organization', {
      p_name: validation.data.firmName,
      p_slug: validation.data.slug,
    });

    if (error) {
      if (error.message.includes('slug already taken')) {
        setSlugError('This URL is taken. Try a different name.');
      } else {
        toast.error('Failed to create firm. Please try again.');
      }
      return;
    }

    navigate({ to: '/computations' });
  } catch (err) {
    toast.error('An unexpected error occurred.');
  } finally {
    setIsCreating(false);
  }
}
```

**`autoSlug`:** `firmName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')`

---

### 2.22 Sign Out

**Button:** "Sign Out" with `LogOut` icon (ghost, full-width in sidebar footer)
**Parent:** `SidebarContent`

```typescript
// src/components/layout/SidebarContent.tsx

async function handleSignOut() {
  await supabase.auth.signOut();
  // onAuthStateChange listener in main.tsx will detect session loss
  // and update RouterContext, which triggers beforeLoad guards to redirect to /auth
}
```

No toast for sign out — the router redirect to `/auth` is the feedback.

---

### 2.23 ComputationCard Overflow Actions

**Control:** `MoreHorizontal` dropdown icon on each `ComputationCard`
**Parent:** `ComputationCard`
**Menu items:**
- "View" (default click on card body) — navigate to `/computations/$compId`
- "Archive" (Archive icon) — same as 2.10, but from list context
- "Delete" (Trash2 icon, destructive) — same as 2.11, but from list context

```typescript
// src/components/computation/ComputationCard.tsx

interface ComputationCardProps {
  computation: ComputationListItem;
  onDelete: (id: string, title: string) => void;   // opens DeleteComputationDialog in parent
  onArchive: (id: string) => Promise<void>;         // parent handles Supabase update
}
```

The `DeleteComputationDialog` is managed by `ComputationsPage`, not by `ComputationCard`. The card calls `onDelete(id, title)` which the page uses to open the dialog.

---

## 3. Premium Gating Summary

| Feature | Required Plan | UI when gated |
|---------|--------------|---------------|
| Export PDF | PRO or ENTERPRISE | "Export PDF" button grayed + tooltip "Upgrade to PRO" |
| Share computation | PRO or ENTERPRISE | "Share" button grayed + tooltip "Upgrade to PRO" |
| Invite team members | ENTERPRISE | InviteMemberForm shows upgrade prompt |
| Multiple seats | ENTERPRISE | Seat limit enforced; shows upgrade CTA at limit |
| Client management | PRO or ENTERPRISE | "Clients" sidebar item shown but page shows upgrade prompt for FREE |
| Batch computation (future) | ENTERPRISE | Not in initial release |

**Gating implementation:** Check `org.plan` from `useOrganization()` hook at the component level. Never rely on database-level blocking for UI gating (though database RLS also enforces it as a second layer for sharing/RPC access).

---

## 4. Handler Location Summary

| Handler | Lives In | Called By |
|---------|---------|----------|
| `handleCompute` | `routes/computations/$compId.tsx` | `ActionsBar.onCompute` |
| `handleRecompute` | `routes/computations/$compId.tsx` | `ActionsBar.onCompute` (same handler, detects current status) |
| `handleFinalize` | `routes/computations/$compId.tsx` | `ActionsBar.onFinalize` |
| `handleUnlock` | `routes/computations/$compId.tsx` | `ActionsBar.onUnlock` |
| `handleExportPdf` | `routes/computations/$compId.tsx` | `ActionsBar.onExportPdf` |
| `handleShareOpen` | `routes/computations/$compId.tsx` | `ActionsBar.onShareOpen` |
| `handleToggle(share)` | `ShareToggle.tsx` | Switch `onCheckedChange` |
| `handleCopy` | `ShareToggle.tsx` | "Copy" button `onClick` |
| `handleRotate` | `ShareToggle.tsx` | "Rotate link" button `onClick` |
| `handleArchive` | `routes/computations/$compId.tsx` | `ActionsBar.onArchive` |
| `handleDelete` | `routes/computations/$compId.tsx` | `DeleteComputationDialog.onConfirm` |
| `handleDeleteClick` | `routes/computations/$compId.tsx` | `ActionsBar.onDelete` |
| `handleTitleSave` | `ComputationPageHeader.tsx` | Title `<input>` onBlur/Enter |
| `handleAddNote` | `AddNoteForm.tsx` | Form `onSubmit` |
| `handleCompleteDeadline` | `DeadlineCard.tsx` | Checkbox `onChange` |
| `handleInvite` | `InviteMemberForm.tsx` | Form `onSubmit` |
| `handleRemove` | `MembersTable.tsx` | "Remove" button `onClick` |
| `handleRevoke` | `PendingInvitationsTable.tsx` | "Revoke" button `onClick` |
| `handleSave` (settings) | Each settings section component | Form `onSubmit` |
| `handleLogoUpload` | `FirmBrandingSection.tsx` | File input `onChange` |
| `handleAccept` | `routes/invite/$token.tsx` | "Accept Invitation" button `onClick` |
| `handleSubmit` (onboarding) | `OnboardingForm.tsx` | Form `onSubmit` |
| `handleSignOut` | `SidebarContent.tsx` | "Sign Out" button `onClick` |

---

## 5. Anti-Orphan Verification Points

The forward loop's orphan scan uses static import analysis. The following features are NOT caught by static analysis and must be manually verified:

1. **TaxComputationDocument** — dynamically imported inside `handleExportPdf`. Verification: search for `import('@/components/pdf/TaxComputationDocument')` or `import('@/components/pdf/TaxComputationDocument.tsx')` in `routes/computations/$compId.tsx`.

2. **DeleteComputationDialog** — rendered by `ComputationsPage` (for ComputationCard delete) AND by `routes/computations/$compId.tsx` (for ActionsBar delete). Both imports must exist.

3. **Sheet with ShareToggle** — `ShareToggle` is imported directly by `routes/computations/$compId.tsx`, not by `ActionsBar`. Verify import in the route file.

4. **InviteAcceptPage** — rendered at `/invite/$token`, which is reachable only via email link. Not accessible from sidebar navigation. Still in route table. Forward loop must register `routes/invite/$token.tsx`.
