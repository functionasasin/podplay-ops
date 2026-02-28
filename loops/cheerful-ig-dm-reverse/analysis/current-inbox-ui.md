# Current Inbox UI — Analysis

**Aspect**: `current-inbox-ui`
**Wave**: 2 (Internal Landscape)
**Goal**: Catalog what is hardcoded to email in the mail inbox UI and what is channel-agnostic; identify changes needed to display DM threads alongside email threads.

---

## Key Files

| File | Role |
|------|------|
| `apps/webapp/app/(mail)/mail/components/mail.tsx` | Layout shell: split panel, view state, `GmailThread[]` props |
| `apps/webapp/app/(mail)/mail/components/mail-list.tsx` | Thread list: items, filters, tabs, search (2,200+ lines) |
| `apps/webapp/app/(mail)/mail/components/mail-display.tsx` | Thread detail + reply composer (2,300+ lines) |
| `apps/webapp/app/(mail)/mail/components/message-content.tsx` | Message body renderer (HTML/plain text) |
| `apps/webapp/app/(mail)/mail/components/collapsed-message.tsx` | Collapsed chat bubble |
| `apps/webapp/app/utils/gmail-types.ts` | Core type: `GmailThread`, `GmailMessage`, `Attachment` |
| `apps/webapp/lib/threads-adapters.ts` | Backend → `GmailThread` transformation |
| `apps/webapp/app/(mail)/mail/hooks/use-mail-queries.ts` | TanStack Query hooks: pending/sent/ignored threads |

---

## Data Model — Frontend Thread Representation

The frontend's universal thread type is `GmailThread` (defined in `gmail-types.ts`):

```typescript
// apps/webapp/app/utils/gmail-types.ts
export interface GmailMessage {
  id: string;          // Gmail API message ID
  threadId: string;    // Gmail thread ID
  name: string;        // Sender display name
  email: string;       // Sender email address  ← EMAIL-SPECIFIC
  subject: string;     // Message subject        ← EMAIL-SPECIFIC
  text: string;        // Plain-text body
  bodyHtml?: string;   // HTML body              ← EMAIL-SPECIFIC
  date: string;
  read: boolean;
  labels: string[];    // Gmail labels           ← EMAIL-SPECIFIC (but app uses app-level labels too)
  attachments: Attachment[];
  to: string[];        // Recipient emails        ← EMAIL-SPECIFIC
  cc: string[];        // CC recipients           ← EMAIL-SPECIFIC
  messageIdHeader?: string; // RFC 2822 header   ← EMAIL-SPECIFIC
}

export interface GmailThread {
  id: string;            // Gmail thread ID        ← EMAIL-SPECIFIC (naming)
  subject: string;       // Thread subject         ← EMAIL-SPECIFIC
  senderEmail: string;   // Last sender email      ← EMAIL-SPECIFIC
  senderName: string;    // Last sender name
  accountEmail?: string; // Connected Gmail account ← EMAIL-SPECIFIC
  labels: string[];      // Gmail labels
  messages: GmailMessage[];
  snippet: string;
  lastMessageDate: string;
  isUnread: boolean;
  campaignId?: string;
  gmail_thread_state_id?: string; // ← EMAIL-SPECIFIC (naming)
  giftingStatus?: string;
  paidPromotionStatus?: string;
  flags?: ThreadFlags;
}
```

**Email-specific fields**: `subject`, `senderEmail`, `accountEmail`, `gmail_thread_state_id` (naming). Every `GmailMessage` has `email`, `subject`, `bodyHtml`, `to`, `cc`, `messageIdHeader` — none applicable to DMs.

**Transformation layer** (`threads-adapters.ts:92-143`): Backend `ThreadWithMessages` → `GmailThread`. All fields named with "gmail" prefix (`gmail_thread_id`, `gmail_thread_state_id`). The transformation has no concept of channel.

---

## Thread List — `mail-list.tsx`

### Layout

```
MailList
├── Header
│   ├── Collapse toggle
│   ├── View tabs (Pending Approvals | Outbox | Ignored)
│   ├── Filter row (Search | Campaign filter | Account filter | Sort)
│   └── Expandable search bar
└── ScrollArea
    └── Thread items (for each GmailThread)
        ├── Avatar (initials, gradient)
        ├── Row 1: Sender name | Flag icons | Status badge
        ├── Row 2: Subject line                    ← EMAIL-SPECIFIC
        ├── Row 3: Snippet/body preview
        └── Footer: Campaign name | Timestamp | Hide button
```

### Email-Specific Elements in Thread List Items

| Element | Location | Code Reference | DM Impact |
|---------|----------|----------------|-----------|
| **Subject line** | Row 2 of thread item | `mail-list.tsx:1104-1108` — `{item.subject}` | DMs have no subject; field would be empty/meaningless |
| **Email address display** | `title` tooltip | `mail-list.tsx:725` — `${displayName \|\| displayEmail}\n${item.subject}` | Tooltip shows email; DMs use IG username instead |
| **Account filter** | Filter row | `TopAccountFilter` filters by `accountEmail` (Gmail accounts) | Would need IG account filter alongside Gmail filter |
| **Search placeholder** | Expanded search | "Search emails..." (line 212) | Minor copy issue |
| **`displayEmail`** | Sender identification | `getConversationPartnerInfo` returns `senderEmail` | DMs: would contain IG username or empty (IGSID opaque) |

### Channel-Agnostic Elements in Thread List Items

- Avatar (initials from name, gradient) — works for any channel
- Sender display name — works if IG username is populated
- Snippet/body preview — works for DM text
- `lastMessageDate` — timestamp, channel-agnostic
- Flag icons (`wants_paid`, `has_question`, `has_issue`) — AI-detected from text, channel-agnostic
- Status badge (`WAITING_FOR_DRAFT_REVIEW`, `DRAFT`, etc.) — state machine labels, channel-agnostic
- Campaign name/image — campaign-linked, channel-agnostic
- Hide/ignore button — thread management, channel-agnostic
- View tabs (Pending | Outbox | Ignored) — applies to any channel

---

## Thread Detail — `mail-display.tsx`

### Layout

```
MailDisplay
├── Thread header (partner avatar + name + email + subject)  ← PARTIALLY EMAIL-SPECIFIC
├── Message list (scrollable)
│   └── Per message: chat bubble layout
│       ├── Avatar (received) or right-align (sent)
│       ├── Sender name
│       └── MessageContent (HTML or plain text)              ← PARTIALLY EMAIL-SPECIFIC
└── Reply composer
    ├── Reply/Reply-All toggle                               ← EMAIL-SPECIFIC
    ├── TO/CC recipient editor                               ← EMAIL-SPECIFIC
    ├── EmailRichTextEditor (Tiptap HTML editor)             ← EMAIL-SPECIFIC
    ├── Cheerify actions (shorten/expand/tone)               ← MOSTLY AGNOSTIC
    ├── Attachment upload                                    ← EMAIL-SPECIFIC (different for DM)
    ├── Schedule send dropdown                               ← EMAIL-SPECIFIC
    └── Send button                                         ← AGNOSTIC
```

### Email-Specific Elements in Thread Detail Header

**Thread header** (`mail-display.tsx:1768-1863`):

```tsx
// Line 1789-1811
<div className="flex flex-col gap-0.5 min-w-0">
  <div className="text-sm flex items-center gap-1">
    <span className="font-semibold">{partnerName}</span>
    <span className="text-muted-foreground text-xs">&lt;{partnerEmail}&gt;</span>  {/* ← EMAIL-SPECIFIC */}
    <button onClick={() => navigator.clipboard.writeText(partnerEmail)}>  {/* ← EMAIL-SPECIFIC */}
      <Copy />
    </button>
  </div>
  <div className="text-xs text-muted-foreground truncate">{currentMail.subject}</div>  {/* ← EMAIL-SPECIFIC */}
</div>
```

Changes needed:
- `<email@domain.com>` display → `@ig_username` for DMs
- Copy email button → irrelevant for DMs (no email to copy)
- Subject line → empty/hidden for DMs

### Email-Specific Elements in Reply Composer

**Recipient area** (`mail-display.tsx:2029-2182`):

```tsx
// Reply/Reply-All toggle (line 2029-2042)
<DropdownMenu>
  Reply | Reply All   // ← EMAIL-SPECIFIC (DMs reply to one person always)
</DropdownMenu>

// TO/CC editor (line 2044-2127)
{isEditingRecipients ? (
  <div>
    <span>To</span>  // ← EMAIL-SPECIFIC
    {editableToRecipients.map(email => <chip>{email}</chip>)}
    <input type="email" />  // ← EMAIL-SPECIFIC

    <span>Cc</span>  // ← EMAIL-SPECIFIC
    {editableCcRecipients.map(email => <chip>{email}</chip>)}
  </div>
) : (
  <span>{partnerEmail}</span>  // ← EMAIL-SPECIFIC
)}
```

For DMs: The reply target is always the same IGSID that sent the DM. There are no TO/CC fields, no Reply-All concept. The entire recipient editor block would be replaced by a simple static label: `Replying to @username`.

**Email editor** (`mail-display.tsx:2194-2224`):
```tsx
<EmailRichTextEditor
  placeholder={`Reply to ${partnerName}...`}
  // Tiptap with Bold/Italic/Underline/Link/Image/FontFamily
  // Attachments, Cheerify, Schedule, Send
/>
```

DM replies are **plain text only** (Instagram DMs do not support HTML formatting). The full Tiptap rich-text editor with font controls, link embeds, and HTML would be replaced by a plain textarea or a stripped-down text input.

**Schedule send** — Instagram DMs can be sent any time during the 24-hour window; there's no equivalent "send at 9 AM tomorrow" scheduling rationale for DMs.

**Attachments** — Email uses arbitrary file attachments. Instagram DMs support images and videos but NOT arbitrary file types. Attachment UI would need to be restricted to image/video.

### Email-Specific Elements in Message Rendering

**`message-content.tsx`**:

```tsx
// Quoted content detection (email-specific patterns)
const quotedPatterns = [
  /\n\s*On .+wrote:\s*$/m,         // "On [date], [person] wrote:"
  /\n\s*----+ Original Message ----+/m,
  /\n\s*>+ /m,
  /\n\s*From: .+\nSent: .+\nTo: .+\nSubject: /m,  // Outlook style
]

// Gmail HTML-specific split
const gmailQuoteMatch = html.search(/<div[^>]*class="[^"]*gmail_quote[^"]*"[^>]*/i)

// HTML rendering with DOMPurify (email-specific, line 82-108)
const clean = DOMPurify.sanitize(html, {
  ALLOWED_TAGS: ['p','br','div','span','a','img','table','td',...],
  ...
})
```

Instagram DMs are **plain text only** (no HTML). The `bodyHtml` branch, DOMPurify sanitization, and quoted content detection are entirely email-specific. A DM message renderer would use the `whitespace-pre-wrap` plain text path only. No quoted reply collapsing needed (DM replies are individual messages in a chat thread, not embedded in each other).

**Collapsed message** (`collapsed-message.tsx`) — shows sender name + snippet + timestamp. This is already channel-agnostic. No changes needed.

---

## Filter and Account System

### `TopAccountFilter` (filter bar in mail-list.tsx)

The account filter renders connected Gmail accounts for inbox switching. For IG DMs, a parallel `TopIgAccountFilter` would be needed — or the filter would need to show both Gmail and IG accounts grouped by type.

**`mail.tsx:136`**: `const currentAccount = useAccountUrlSync(accounts)` — syncs selected Gmail account to URL. IG DMs would need `ig_account_id` in URL params instead.

### `accounts` prop shape

```typescript
// mail.tsx:27-31
interface MailProps {
  accounts: {
    label: string
    email: string   // ← Gmail address; IG would need account identifier
    icon: React.ReactNode
  }[]
```

---

## Data Flow — How Email Threads Reach the UI

```
MailClientWrapper (server) → Gmail accounts from Supabase
  ↓ allAccounts[] (GmailAccount[])
use-mail-queries.ts: fetchAndEnrichThreads()
  → GET /api/threads?account_ids=…&include_messages=true
  → returns ThreadWithMessages[]
  → transformThreadWithMessagesToGmailThread() → GmailThread[]
  ↓ filteredMails: GmailThread[]
mail.tsx: filteredMails passed to MailList + MailDisplay
```

For IG DMs, an analogous path would be needed:
- `use-ig-dm-queries.ts` fetching from a different endpoint
- `transformIgDmThreadToGmailThread()` (if reusing type) or `IgDmThread` type
- Passed alongside or instead of email threads in `mail.tsx`

---

## What Is Hardcoded to Email (Summary)

| Component | Email-Hardcoded Element | DM Equivalent |
|-----------|------------------------|----------------|
| `GmailThread` type | `subject`, `senderEmail`, `accountEmail`, `gmail_thread_id` naming | No subject; `senderHandle`, `igAccountId`, `ig_dm_thread_id` |
| `GmailMessage` type | `email`, `subject`, `bodyHtml`, `to`, `cc`, `messageIdHeader` | No `subject`/`to`/`cc`/`bodyHtml`; `senderHandle` instead of `email` |
| Thread list item | Subject line row (line 1104-1108) | Omit or show IG thread indicator |
| Thread detail header | `<partnerEmail>` + copy button (line 1791) | `@username` + IG icon |
| Thread detail header | `currentMail.subject` subtitle (line 1811) | Omit |
| Reply composer | TO/CC recipient editor (lines 2044-2127) | "Replying to @username" label only |
| Reply composer | Reply/Reply-All toggle (lines 2029-2042) | Remove |
| Reply composer | `EmailRichTextEditor` (HTML Tiptap) (line 2194) | Plain text textarea |
| Reply composer | Attachment upload (arbitrary files) (line 2221-2222) | Image/video only or omit |
| Reply composer | Schedule send (lines 2225-2280) | Remove or repurpose for 24-hour warning |
| Message renderer | `bodyHtml` HTML rendering + DOMPurify (lines 82-108) | Skip; plain text only |
| Message renderer | Quoted content detection (email patterns) (lines 18-43) | Not needed for DMs |
| Label system | `cheerful-human-review`, `cheerful-ignore`, `draft` Gmail labels | DB-state-based flags instead |
| Account filter | `TopAccountFilter` filtering by `accountEmail` | Would need IG account filter |
| Bootstrap | `MailClientWrapper` fetches Gmail accounts | Would need IG accounts bootstrap |
| Type naming | `GmailThread`, `GmailMessage`, `gmail_thread_state_id` | Renaming or aliasing needed |

---

## What Is Already Channel-Agnostic

| Element | Notes |
|---------|-------|
| Chat bubble layout (WhatsApp-style) | Already abstracted; actually fits DMs better than email |
| Avatar (initials + gradient) | Works for any sender name |
| Sender display name | Works if IG username is populated |
| Snippet / body preview | Plain-text works for DMs |
| Timestamp (`RelativeTime`) | Channel-agnostic |
| Campaign image/name badges | Campaign-linked, not channel-specific |
| Flag icons (`wants_paid`, `has_question`, `has_issue`) | AI-detected from text content |
| Status badge state machine | `WAITING_FOR_DRAFT_REVIEW`, `DRAFT`, `IGNORED` labels |
| View tabs (Pending / Outbox / Ignored) | Thread state concepts, not email-specific |
| Hide/unhide thread | Thread management |
| Campaign filter dropdown | Campaign-linked, channel-agnostic |
| Sort order (Newest/Oldest) | Channel-agnostic |
| `Cheerify` actions (tone/length) | Could apply to DM replies |
| Thread flag AI analysis | Works on any text content |
| Draft persistence (`mail-draft-store.ts`) | Keyed by thread ID, channel-agnostic |

---

## UI Change Effort Assessment

### Option A: Extend `GmailThread` with channel discriminator

Add `channel: 'email' | 'instagram_dm'` to `GmailThread`. Map DM fields to existing fields where possible. Add conditional rendering throughout components.

**Changes**:
1. `gmail-types.ts` — Add `channel` discriminator, `senderHandle` optional field
2. `threads-adapters.ts` — Add DM transformation function
3. `mail-list.tsx` — Conditional hide of subject line for DMs; show `@username` in tooltip
4. `mail-display.tsx`:
   - Thread header: conditionally show `@username` vs `<email>`; hide subject for DMs
   - Reply composer: replace entire TO/CC + HTML editor block with simple DM reply input when `channel === 'instagram_dm'`
   - Message renderer: skip `bodyHtml` for DMs
5. `mail.tsx` — Accept both email and DM threads in `mails[]`; route account filter by channel

**Effort**: Medium. All changes in existing files; some become large conditionals.

**Risk**: `mail-display.tsx` is already 2,300 lines. Adding DM conditionals could make it unmaintainable.

### Option B: Separate DM inbox page/route

Create `/dm-inbox` (or `/mail?mode=ig`) with its own simplified components that share primitives (avatar, status badge, flag icons) but not the email-specific layout.

**Changes**:
1. New route: `/app/(mail)/dm-inbox/`
2. New `IgDmThread` type (no email-specific fields)
3. New `DmList` component (like `mail-list.tsx` but without subject/account filter)
4. New `DmDisplay` component (like `mail-display.tsx` but with plain text composer, no TO/CC)
5. Extract shared primitives: `ThreadAvatar`, `ThreadStatusBadge`, `ThreadFlagIcons`, `CollapsedMessage`

**Effort**: High upfront. Cleaner architecture. Less conditional complexity.

**Risk**: Code duplication of shared logic (hide/unhide, campaign linking, Cheerify).

### Option C: Minimal shim — render DMs as "email-like" using existing UI

Populate `GmailThread` fields for DMs without type changes:
- `subject` = `""` (empty, let subject row show blank)
- `senderEmail` = IG username (repurposed)
- `accountEmail` = IG account identifier
- Messages: `email` = IG username

No UI changes needed except hiding the `<email@domain.com>` display.

**Effort**: Very low. Ships fastest.

**Risk**: Subject row shows blank (confusing). `<email@domain.com>` syntax on IG username looks broken. Reply composer has TO/CC fields that don't make sense. HTML editor offered for plain text channel. Overall UX is awkward.

---

## New UI Components Needed (Regardless of Option)

1. **24-hour DM window indicator** — shows remaining time in the DM response window per thread (no email equivalent)
2. **Instagram channel badge** — visual indicator on thread item and detail distinguishing DM from email (Instagram logo icon)
3. **Plain-text DM composer** — lightweight text input replacing `EmailRichTextEditor` for DM replies (no formatting toolbar, no attachments, character count if needed)
4. **IG account connection UI** — settings page equivalent for connecting Instagram Business accounts (parallel to Gmail OAuth connect flow)
5. **IGSID → username resolution UX** — fallback display when creator identity hasn't been resolved yet (show "Instagram User" with IGSID until resolved)

---

## Key Architectural Finding

The `mail-display.tsx` reply composer is the largest single blocker. It contains ~400 lines of email-specific TO/CC recipient logic (`use-reply-recipients.ts`), reply-all calculation, and email header construction (`In-Reply-To`, `References`) that is irrelevant for DMs. The `EmailRichTextEditor` Tiptap component provides HTML editing that is incompatible with Instagram's plain-text-only DM format.

The existing **chat bubble message layout** (WhatsApp-style, already present) actually maps naturally to DMs — this is an advantage. The structural change is mostly at the data layer (types, adapter) and the composer layer (replace HTML editor with plain textarea).

The **thread list** changes are minimal — primarily hiding the subject line row and adapting the account filter. This layer is closer to channel-agnostic than the detail/composer layer.
