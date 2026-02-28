# Audit: Frontend Components

**Aspect:** `audit-frontend-components`
**Wave:** 1 — Codebase Audit
**Status:** Complete

---

## Summary

The Cheerful inbox UI is a two-panel master/detail layout built around `GmailThread[]` as the universal thread type. All thread-related components are tightly coupled to email concepts: subject lines, email addresses, rich-text composition, Gmail OAuth, and To/CC recipients. There is no channel discriminator, no channel badge, and no conditional rendering path for a non-email channel.

The inbox is accessed at `/mail` and rendered via `Mail` → `MailList` (left panel) + `MailDisplay` (right panel). Settings live at `/settings`.

---

## 1. `Mail` Component — Top-Level Inbox Orchestrator

**File:** `apps/webapp/app/(mail)/mail/components/mail.tsx`

### Props Interface

```typescript
interface MailProps {
  accounts: { label: string; email: string; icon: React.ReactNode }[]
  mails: GmailThread[]
  pendingApprovalMails?: GmailThread[]
  sentMails?: GmailThread[]
  ignoredMails?: GmailThread[]
  defaultLayout: number[] | undefined
  defaultCollapsed?: boolean
  navCollapsedSize: number
  onConnectEmail?: () => void
  loadMoreEmails?: () => Promise<void>
  nextPageToken?: string
  loadingMoreEmails?: boolean
  totalInboxCount?: number
  totalPendingApprovalCount?: number
  totalIgnoredCount?: number
  totalSentCount?: number
  isMailLoading?: boolean
  isPendingApprovalLoading?: boolean
  isSentLoading?: boolean
  isIgnoredLoading?: boolean
  updateThreadInList?: (updatedThread: GmailThread) => void
  refreshPendingApprovals?: () => void
  onSilentRefresh?: () => Promise<void>
  onSelectedAccountsChange?: (accounts: string[]) => void
  hasTeamAccess?: boolean
  isMobile?: boolean
}
```

### Layout

Two-panel flex layout with optional collapse:
- Left panel: `w-[500px]` (expanded) or `w-[72px]` (collapsed at `<1200px`), contains `MailList`
- Right panel: `flex-1`, contains `MailDisplay`
- Mobile: full-screen panel toggle (list or detail, not both)

### View State

- 3 primary views: `MailView.Pending`, `MailView.Sent`, `MailView.Ignored`
- 2 secondary views: `SecondaryView.Drafts`, `SecondaryView.Creators`
- URL-driven: `?view=pending|sent|ignored`
- Synced between URL, local state, and Zustand store (`useMailStore`)

### Hardcoded Email Elements

- Top bar heading: `"Inbox"` (text only, no icon or channel label)
- "Email Settings" button → `openEmailSettings()` → `EmailSettingsModal`
- All `mails`, `pendingApprovalMails`, `sentMails`, `ignoredMails` typed as `GmailThread[]`
- **No channel filter dropdown** (no "All / Email / Instagram DM" selector)
- `CreatorTable` rendered for `SecondaryView.Creators` — separate from thread lists

---

## 2. `MailList` Component — Thread List Panel

**File:** `apps/webapp/app/(mail)/mail/components/mail-list.tsx`
**Lines:** 1290

### Props Interface

```typescript
interface MailListProps {
  items: GmailThread[]
  onConnectEmail?: () => void
  loadMoreEmails?: () => Promise<void>
  hasMoreEmails?: boolean
  loadingMoreEmails?: boolean
  accounts: { label: string; email: string; icon: React.ReactNode }[]
  activeView: string                              // 'pending' | 'sent' | 'ignored'
  isLoading?: boolean
  currentUserEmail?: string
  onSilentRefresh?: () => Promise<void>
  selectedAccounts?: string[]
  emailSearchQuery?: string
  onSearchQueryChange?: (query: string) => void
  selectedCampaigns?: string[]
  knownCampaignIds?: string[]
  onMailSelect?: (threadId: string) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  campaigns?: Campaign[]
  onSelectedCampaignsChange?: (campaigns: string[]) => void
  onKnownCampaignIdsChange?: (ids: string[]) => void
  onSelectedAccountsChange?: (accounts: string[]) => void
  hasTeamAccess?: boolean
  includeUncategorized?: boolean
  onIncludeUncategorizedChange?: (include: boolean) => void
}
```

### Thread List Item Rendering (lines 1043–1171)

Each `GmailThread` item renders as a card with these visual sections:
1. **Avatar** (lines 1072–1083): Gradient circle with initials from `displayName` or `displayEmail`
2. **Primary row** (lines 1088–1101): `displayName || displayEmail || 'Unknown Sender'` — largest text, gradient on selection
3. **Subject line** (lines 1104–1108): Bold, truncated at 55 chars — `item.subject`
4. **Snippet** (lines 1110–1125): `item.snippet` or last non-draft message text, 2-line clamp
5. **Footer row** (lines 1128–1165): campaign name, relative time, hide/unhide button

**Key: subject is a distinct visual element** — not part of snippet, not optional. DM threads have no subject and must hide this row.

### `getConversationPartnerInfo` Helper (line 616)

```typescript
const getConversationPartnerInfo = (thread: GmailThread): { name: string, email: string } => {
  const threadAccountEmail = thread.accountEmail || actualCurrentUserEmail;
  if (thread.senderEmail !== threadAccountEmail && thread.senderName !== CURRENT_USER_NAME) {
    return { name: thread.senderName, email: thread.senderEmail };
  }
  for (let i = thread.messages.length - 1; i >= 0; i--) {
    const message = thread.messages[i];
    if (message.email !== threadAccountEmail && message.name !== CURRENT_USER_NAME) {
      return { name: message.name, email: message.email };
    }
  }
  return { name: thread.senderName, email: thread.senderEmail };
};
```

This function is **email-centric**: it identifies the non-account-owner participant by comparing `email` addresses. For DM threads, the equivalent check would use IGSID/username instead.

### Tab Strip (lines 772–818)

Three hardcoded tabs with sliding indicator:
```
[ Pending Approvals | Outbox | Ignored ]
```
No channel dimension exists. Adding a channel filter would need a new filter row (not a 4th tab).

### Hardcoded Email Elements

- Search placeholder: `"Search emails..."` (line 212)
- Connect prompt: `"Connect Gmail"` with `Link2` icon
- `SetupModal` imported for Gmail OAuth
- Tab labels: "Pending Approvals", "Outbox", "Ignored" — none are DM-specific

---

## 3. `MailDisplay` Component — Thread Detail + Reply Area

**File:** `apps/webapp/app/(mail)/mail/components/mail-display.tsx`
**Lines:** 2849

### Props Interface

```typescript
interface MailDisplayProps {
  allMails: GmailThread[]
  isLoading?: boolean
  updateThreadInList?: (updatedThread: GmailThread) => void
  currentUserEmail?: string | null
  refreshPendingApprovals?: () => void
  onSilentRefresh?: () => Promise<void>
  mailListLoaded?: boolean
  selectedMailId?: string | null           // mobile override
  hasTeamAccess?: boolean
  isMobile?: boolean
  onBack?: () => void
}
```

### Thread Header (lines 1768–1811)

```tsx
<Avatar>...</Avatar>                                    // initials from partnerName
<span className="font-semibold">{partnerName}</span>   // display name
<span>&lt;{partnerEmail}&gt;</span>                    // email address in angle brackets
<Copy icon onClick={() => navigator.clipboard.writeText(partnerEmail)} />
<div>{currentMail.subject}</div>                       // subject as subtitle
```

**Email-hardcoded:** `partnerEmail` in angle brackets (email format), `currentMail.subject` as subtitle, copy-email button. For DM threads: `@handle` replaces `<email>`, no subject, no copy-email.

### Message History Rendering (lines 1749–1763)

- Filters out draft messages: `!message.labels.includes("draft")`
- Each message passed to `MessageContent` component
- `isSentByCurrentUser()` helper uses email comparison
- `CollapsedMessage` for older messages in a thread

### Reply Composer Area (lines 2183–2224)

```tsx
<div className="relative w-full">
  {/* Overlay shown while AI is generating */}
  {isDraftingReply && <DraftingOverlay />}

  <EmailRichTextEditor
    className="w-full"
    minHeight="192px"
    placeholder={isDraftingReply ? 'Drafting reply...' : `Reply to ${partnerName}...`}
    value={draftText}
    onChange={(newValue) => setDraftText(newValue)}
    key={currentMail.id}
    disabled={isSending || isCheerifyLoading || isDraftingReply}
    showCheerify={!!getTextContent(draftText).trim()}
    onCheerifyAction={handleCheerifyAction}
    isCheerifyLoading={isCheerifyLoading}
    onPropagateEdit={isBulkEditEnabled ? handlePropagateEdit : undefined}
    isPropagating={bulkEditState.isClassifying}
    attachments={hasTeamAccess ? undefined : attachments}
    onAttachmentsChange={hasTeamAccess ? undefined : setAttachments}
    onSend={handleSend}
    isSending={isSending || isDraftingReply}
    showScheduleDropdown={showScheduleDropdown}
    onScheduleDropdownChange={isScheduleEmailEnabled ? handleDropdownOpenChange : undefined}
    disableSchedule={!isScheduleEmailEnabled || !!hasTeamAccess}
    renderScheduleDropdownContent={...}
  />
</div>
```

**Critical: `EmailRichTextEditor` is HTML/rich-text based** (contenteditable div), not a `<textarea>`. DM threads must render a different composer (`DmComposer`) — plain text, 1000 char limit, no HTML formatting, no schedule dropdown, no Cheerify, with 24h window indicator.

### State Managed in `MailDisplay`

All of this is email-specific and would NOT apply to DM composer:
- `draftText: string` — HTML string from rich text editor
- `originalDraftText: string` — for detecting edits vs AI draft
- `attachments: File[]` — email attachments
- `isReplyAll: boolean` — email reply-all toggle
- `toRecipients`, `ccRecipients` — from `useReplyRecipients` hook
- `isEditingRecipients` — inline To/CC editing
- `scheduledTime`, `selectedOption` — from `useScheduleEmailActions`
- `suggestedRules`, `isGeneratingRule` — from `useRuleSuggestions`
- Shopify order drafting state — 15+ state vars

### Hooks Called

| Hook | Email-specific? |
|------|----------------|
| `useEmailSend` | Yes — Gmail/SMTP send |
| `useEmailSchedule` | Yes — schedule send |
| `useCheerify` | Yes (but LLM-agnostic) |
| `useReplyRecipients` | Yes — To/CC calculation |
| `useRuleSuggestions` | Yes — email rule learning |
| `useBulkEdit` | Yes — email bulk edit |
| `useMailDraftStore` | Yes — email draft persistence |

---

## 4. `EmailRichTextEditor` Component — Reply Composer

**File:** `components/ui/email-rich-text-editor.tsx`

### Props Interface

```typescript
interface EmailRichTextEditorProps {
  value: string;                                          // HTML string
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minHeight?: string;
  showCheerify?: boolean;
  onCheerifyAction?: (action: string) => void;
  isCheerifyLoading?: boolean;
  onSend?: () => void;
  isSending?: boolean;
  showScheduleDropdown?: boolean;
  onScheduleDropdownChange?: (open: boolean) => void;
  renderScheduleDropdownContent?: () => React.ReactNode;
  disableSchedule?: boolean;
  attachments?: File[];
  onAttachmentsChange?: (files: File[]) => void;
  onPropagateEdit?: () => void;
  isPropagating?: boolean;
}
```

### Toolbar Icons

`Bold, Italic, Underline, Link, Sparkles (Cheerify), Scissors, FileText, Smile, Briefcase, Coffee, X, Edit3, Wand2, Send, CalendarIcon, Loader2, PenLine, Paperclip, Layers`

### Implementation

- Uses `contenteditable` div (not Tiptap in this file — it's a custom rich text div)
- `value` is an **HTML string** (`<p>`, `<br>`, etc.)
- Has signature insertion support via `useListSignaturesApiEmailSignaturesGet`

**This component is NOT reusable for DM replies.** DM replies must use a plain `<textarea>` with character count.

---

## 5. Settings Page — Email Account Management

**File:** `apps/webapp/app/(mail)/settings/page.tsx`

### Layout

```typescript
export type SettingsTab = "email" | "team"  // from settings-tabs.tsx
```

```
Settings
├── SettingsTabs: "Email" | "Team"
├── [email tab]
│   ├── EmailSettingsCard        — Gmail account list
│   ├── EmailSignaturesCard      — Email signatures
│   └── EmailSettingsModal       — Signature create/edit
└── [team tab]
    └── TeamSettingsContent
```

### `EmailSettingsCard` Component

**File:** `apps/webapp/app/(mail)/settings/components/email-settings-card.tsx`

```typescript
interface EmailSettingsCardProps {
  className?: string
  userEmail?: string | null
  userAvatarUrl?: string | null
}
```

- Left column: User avatar, email address, Change Password, Sign Out
- Right column: list of connected Gmail accounts (from `useEmailSettings`)
- "Add Account" button → `setIsModalOpen(true)` → `SetupModal` → `/api/auth/google/initiate`
- "Delete" button per account → `/api/delete-account` (POST)
- No SMTP section visible (SMTP accounts managed separately — via campaign creation wizard)
- **No Instagram DM account section exists**

### OAuth Entry Point

```typescript
const handleConnectEmail = () => {
  window.location.href = '/api/auth/google/initiate'
}
```

Pattern for IG DM: `window.location.href = '/api/auth/instagram/initiate'` (or popup variant).

---

## 6. Campaign Sender Accounts Section

**File:** `apps/webapp/components/campaigns/sections/sender-accounts-section.tsx`

```typescript
interface SenderAccountsSectionProps {
  isOpen?: boolean
  onToggleOpen?: () => void
  senderAccounts: SenderAccount[]        // from campaign detail
  isLoading: boolean
  isExternal: boolean                    // controls edit permissions
  isEditMode: boolean
  isUpdatingSender: boolean
  isDeletingSender: boolean
  onEditSender: (senderEmail: string) => void
  onDeleteSender: (senderEmail: string) => void
  onAddEmail?: () => void
}
```

- Shows connected email accounts per campaign as pills
- "Add Email" button only for `isExternal && isEditMode`
- Section title: `"Connected Emails"` — email-specific
- **This section is where "Connected Instagram Account" would appear** for DM-enabled campaigns

---

## 7. Hardcoded Email Elements — Complete Inventory

The following are all elements that must be parameterized or conditionally rendered for IG DM support:

### In Thread List Items (`MailList`)

| Element | Current | DM Change |
|---------|---------|-----------|
| Avatar | Initials from `senderName`/`senderEmail` | Initials from `igHandle` or Instagram avatar |
| Primary row | `displayName \|\| displayEmail` | `@igHandle` |
| Subject line (line 1104–1107) | `item.subject` (bold, always shown) | Hidden/omitted (DMs have no subject) |
| Snippet | `item.snippet` | First ~80 chars of message text |
| Footer: time | `item.lastMessageDate` | Same (no change) |
| Footer: hide button | Same (no change) | — |

### In Thread Header (`MailDisplay`)

| Element | Current | DM Change |
|---------|---------|-----------|
| `<partnerEmail>` (line 1791) | `<email@example.com>` in angle brackets | `@igHandle` (no angle brackets) |
| Copy button (line 1795–1809) | Copies email to clipboard | Copies `@handle` (or remove) |
| Subtitle (line 1811) | `currentMail.subject` | Omit; show "Instagram DM" label or channel badge |
| Shopify order button | Show when workflow active | Hide for DM threads |

### In Reply Composer (`MailDisplay`)

| Element | Current | DM Change |
|---------|---------|-----------|
| `EmailRichTextEditor` (line 2194) | Rich text / HTML | Replace with `DmComposer` (plain textarea) |
| To/CC recipients row | Full recipient editing UI | Hide (DM has no To/CC) |
| isReplyAll toggle | Hidden but exists | N/A |
| Attachments | File upload | Replace with media upload (images/videos) |
| Schedule dropdown | Schedule send time | Hide (DM replies send immediately) |
| Cheerify | AI improvement tool | Can reuse (text improvement) |
| 24h window warning | Does not exist | Add countdown/disabled state |

### In Search

| Element | Current | DM Change |
|---------|---------|-----------|
| Placeholder (line 212) | `"Search emails..."` | `"Search conversations..."` |

### In Settings

| Element | Current | DM Change |
|---------|---------|-----------|
| Settings tabs | "Email" \| "Team" | Add "Instagram" tab (or subsection in Email) |
| Email accounts section | Gmail accounts list | Add Instagram DM accounts section |
| Add account button | `/api/auth/google/initiate` | Add "Connect Instagram" button |

---

## 8. Component Tree — Inbox Mount Points

```
app/(mail)/mail/page.tsx
└── mail-client-wrapper.tsx
    └── mail-client.tsx
        └── Mail (mail.tsx)
            ├── [left panel] MailList (mail-list.tsx)
            │   ├── TopCampaignFilter (top-account-filter.tsx)
            │   ├── TopAccountFilter (top-account-filter.tsx)
            │   ├── SortDropdown
            │   └── [thread items] → GmailThread[] only
            └── [right panel] MailDisplay (mail-display.tsx)
                ├── [header] partnerName + partnerEmail + subject
                ├── [messages] CollapsedMessage | MessageContent (message-content.tsx)
                └── [composer] EmailRichTextEditor (email-rich-text-editor.tsx)
```

### Where DM Components Mount

For IG DM, the integration is **conditional rendering inside existing components** (not new routes):

- `MailList`: Add `channel` discriminator check → hide subject row for DM items
- `MailDisplay` header: Check `thread.channel === 'instagram_dm'` → show `@handle` instead of `<email>`
- `MailDisplay` composer: Check `thread.channel === 'instagram_dm'` → render `DmComposer` instead of `EmailRichTextEditor`
- `Mail` top bar: Add channel filter dropdown (new UI element, not a tab)
- `settings/page.tsx`: Add "Instagram" tab or subsection under "Email" tab

---

## 9. Key Implications for IG DM Spec

### Files to MODIFY (existing)

| File | Changes |
|------|---------|
| `app/(mail)/mail/components/mail-list.tsx` | Hide subject row for DM items; add channel badge; update `getConversationPartnerInfo` for DM |
| `app/(mail)/mail/components/mail-display.tsx` | Conditional header (handle vs email); conditional composer (`DmComposer` vs `EmailRichTextEditor`); hide email-specific controls |
| `app/(mail)/mail/components/mail.tsx` | Add `igDmThreads` prop; merge into `filteredMails`; add channel filter UI |
| `app/(mail)/settings/page.tsx` | Add Instagram settings tab or card |
| `app/(mail)/settings/components/email-settings-card.tsx` | Pattern reference for `IgDmSettingsCard` |
| `apps/webapp/components/campaigns/sections/sender-accounts-section.tsx` | Add IG account assignment section |

### Files to CREATE (new)

| File | Purpose |
|------|---------|
| `app/(mail)/mail/components/dm-composer.tsx` | Plain text reply composer for IG DM threads |
| `app/(mail)/settings/components/ig-dm-settings-card.tsx` | Instagram account list, connect/disconnect UI |
| `app/(mail)/mail/hooks/use-ig-dm-queries.ts` | TanStack Query hooks for IG DM threads |
| `app/(mail)/mail/hooks/use-ig-dm-account.ts` | Hook for managing connected IG accounts |
| `app/utils/ig-dm-types.ts` | `IgDmThread`, `IgDmMessage`, `IgDmAttachment` types |

---

## Files Audited

| File | Purpose |
|------|---------|
| `apps/webapp/app/(mail)/mail/components/mail.tsx` | Top-level inbox orchestrator |
| `apps/webapp/app/(mail)/mail/components/mail-list.tsx` | Thread list left panel |
| `apps/webapp/app/(mail)/mail/components/mail-display.tsx` | Thread detail + reply composer |
| `apps/webapp/app/(mail)/mail/components/message-content.tsx` | Individual message rendering |
| `apps/webapp/components/ui/email-rich-text-editor.tsx` | Reply composer (rich text) |
| `apps/webapp/app/(mail)/settings/page.tsx` | Settings page layout |
| `apps/webapp/app/(mail)/settings/components/settings-tabs.tsx` | Settings tab component |
| `apps/webapp/app/(mail)/settings/components/email-settings-card.tsx` | Email account management |
| `apps/webapp/components/campaigns/sections/sender-accounts-section.tsx` | Per-campaign email accounts |
