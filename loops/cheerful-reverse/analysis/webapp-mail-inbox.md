# Analysis: webapp-mail-inbox

**Aspect**: webapp-mail-inbox
**Wave**: 1 — Layer-by-Layer Extraction
**Source**: `projects/cheerful/apps/webapp/app/(mail)/mail/`

---

## Purpose

The mail inbox is the **operational heart of Cheerful** — the interface where campaign operators monitor, respond to, and manage creator communications at scale. Users may manage 60+ Gmail accounts across dozens of campaigns. The inbox consolidates all threads into a unified view with AI-assisted reply drafting, rule-based automation, and campaign-level filtering.

---

## Directory Structure

```
app/(mail)/mail/
├── page.tsx                          # Next.js entry point
├── mail.tsx                          # Top-level wrapper
├── mail-client.tsx                   # Core client component
├── mail-client-wrapper.tsx           # Server-side auth/bootstrap wrapper
├── use-mail.ts                       # Global selection/layout state hook
├── data.tsx                          # Demo data and account initialization
├── window.d.ts                       # TypeScript global window declarations
├── components/
│   ├── mail.tsx                      # Main split-panel layout
│   ├── mail-list.tsx                 # Thread list (~1290 lines)
│   ├── mail-display.tsx              # Thread detail viewer (120KB+)
│   ├── message-content.tsx           # HTML/text message renderer
│   ├── collapsed-message.tsx         # Collapsed message mini-preview
│   ├── mail-display-skeleton.tsx     # Loading placeholder
│   ├── mail-list-status-badge.tsx    # Thread status badges
│   ├── thread-flag-icons.tsx         # Flag icons (wants_paid, has_question, etc.)
│   ├── empty-states.tsx              # Empty state UI
│   ├── search-by-email.tsx           # Thread search/filter
│   ├── top-account-filter.tsx        # Gmail account selector
│   ├── bulk-edit-action-bar.tsx      # Bulk operations toolbar
│   ├── add-recipients-modal.tsx      # Add recipients dialog
│   ├── email-selection-modal.tsx     # Email selector dialog
│   ├── ai-assistant-panel.tsx        # AI assistant sidebar
│   ├── faq-editor.tsx                # FAQ content editor
│   ├── rule-suggestions-toast.tsx    # Rule suggestion notifications
│   ├── custom-datetime-picker.tsx    # Schedule date/time picker
│   ├── csv-file-preview.tsx          # CSV file preview
│   ├── data-instructions-editor.tsx  # Data instructions editor
│   ├── column-instructions-list.tsx  # Instructions list
│   ├── email-settings/
│   │   ├── email-settings-modal.tsx  # Email settings dialog
│   │   ├── signature-form.tsx        # Signature editor
│   │   └── signature-list.tsx        # Signature list
│   ├── demo-email/
│   │   ├── demo-email-display.tsx    # Demo email viewer
│   │   ├── demo-email-list-item.tsx  # Demo email list entry
│   │   ├── demo-email-data.ts        # Demo content
│   │   ├── system-message.tsx        # System message display
│   │   ├── animated-gradient-border.tsx # Gradient border animation
│   │   └── connect-email-overlay.tsx # Gmail connection prompt
│   └── creator/
│       ├── table.tsx                 # Creator/campaign data table
│       ├── components/
│       │   ├── atomic/               # Atomic UI components
│       │   ├── molecule/             # Composite components
│       │   └── organism/             # Complex sections
│       └── hooks/
│           ├── use-campaign-select.ts
│           ├── use-creator-table.ts
│           ├── use-enrichment-polling.ts
│           └── use-lookalike-suggestions.ts
├── hooks/
│   ├── use-mail-queries.ts           # React Query thread fetching
│   ├── use-mail-bootstrap.ts         # Initial auth/account setup
│   ├── use-gmail-accounts.ts         # Gmail accounts query
│   ├── use-auth-cache.ts             # Auth state caching
│   ├── use-account-url-sync.ts       # URL ↔ account state sync
│   ├── use-message-expansion.ts      # Message expand/collapse
│   ├── use-reply-recipients.ts       # Reply recipient calculation
│   ├── use-email-send.ts             # Email sending logic
│   ├── use-email-schedule.ts         # Email scheduling
│   ├── use-schedule-email-actions.ts # Schedule action handlers
│   ├── use-cheerify.ts               # AI text improvement (streaming)
│   ├── use-rule-suggestions.ts       # Auto rule generation
│   ├── use-thread-visibility.ts      # Hide/unhide threads
│   ├── use-bulk-edit.ts              # Bulk editing operations
│   ├── use-campaign-images.ts        # Campaign image loading
│   ├── use-demo-email.ts             # Demo email state
│   ├── use-relevant-campaigns.ts     # Campaign filtering
│   ├── use-scheduled-emails.ts       # Scheduled email state
│   ├── use-scheduled-emails-list.ts  # Scheduled email list
│   ├── use-team-context.ts           # Team context info
│   └── use-connected-emails.ts       # Connected email accounts
└── stores/
    ├── mail-store.ts                 # Primary Zustand mail state
    ├── mail-draft-store.ts           # Draft persistence
    ├── campaign-draft-store.ts       # Campaign draft storage
    ├── account-store.ts              # Account state
    ├── campaign-preferences-store.ts # Per-campaign preferences
    └── email-settings-store.ts       # Email settings state
```

---

## Layout Architecture

The inbox uses a three-panel split layout:

```
┌────────────────────────────────────────────────────────────────┐
│ Top Bar: Account Selector | Campaign Filter | View Tabs        │
├────────────┬───────────────────────────────────────────────────┤
│ Thread     │ Thread Detail / Mail Display                       │
│ List       │                                                    │
│ (mail-     │  ┌─ Message 1 (collapsed) ─────────────────────┐  │
│  list.tsx) │  ├─ Message 2 (expanded) ──────────────────────┤  │
│            │  │  Full HTML body + quoted content             │  │
│ Status     │  └──────────────────────────────────────────────┘  │
│ badges     │                                                    │
│ Flag icons │  ┌─ Reply Compose Box ───────────────────────────┐ │
│            │  │  TipTap Editor | Cheerify | Schedule          │ │
│            │  └───────────────────────────────────────────────┘ │
└────────────┴───────────────────────────────────────────────────┘
```

Panels are resizable via `react-resizable-panels`. Layout widths are persisted to `localStorage` via `mail-store.ts`.

---

## Thread List (`mail-list.tsx`, ~1290 lines)

### Purpose
Displays all email threads for the selected account(s) and campaign filters, allowing operators to quickly scan incoming creator responses.

### Views (Tabs)
| Tab | Content | Filter Logic |
|-----|---------|--------------|
| Pending | Threads needing attention | All non-sent, non-hidden threads |
| Sent | Outgoing messages | Direction=sent |
| Ignored | Hidden/archived threads | `is_hidden=true` |
| Drafts | Unsent drafts | Status=WAITING_FOR_DRAFT_REVIEW |
| Creators | Campaign creator table | Separate creator table view |

### Thread Item Display
Each thread item shows:
- **Subject line** (truncated)
- **Sender name and email**
- **Last message timestamp** (relative: "2 hours ago")
- **Campaign image** (loaded via `use-campaign-images.ts`)
- **Status badge**: `DRAFT`, `WAITING_FOR_REVIEW`, etc.
- **Flag icons**: `wants_paid` (💰 amber), `has_question` (❓ blue), `has_issue` (⚠️ red)
- **Unread indicator** dot

### Thread Selection
- Click to select thread → shows in detail panel
- Keyboard navigation (up/down arrows)
- Auto-selects first thread when account switches
- Blocks auto-select for `lastSelectionTime` window to prevent flicker
- `selectedMailId` persisted in `mail-store.ts`

### Filtering
- **By campaign**: Multi-select campaign filter chips
- **By account**: Top account filter dropdown
- **By status**: View tabs
- **By search**: Client-side text search (400ms debounce, limited to 50 threads per account)
- **Uncategorized toggle**: Include threads not assigned to any campaign

### Performance Optimization
The thread list fetches ALL accounts in a single API request (`fetchAndEnrichThreads`) rather than N parallel requests per account. For 61 accounts, this reduces 122 requests (pending + sent tabs) to just 2.

---

## Thread Detail Viewer (`mail-display.tsx`, 120KB+)

### Purpose
The main workspace where operators read full email conversations and craft replies — the most complex component in the webapp.

### Message Rendering (`message-content.tsx`)
- **HTML emails**: Rendered via `dangerouslySetInnerHTML` with DOMPurify sanitization
- **Plain text**: Rendered with whitespace preservation (`whitespace-pre-wrap`)
- **Links**: Force-opened in new tab (`target="_blank" rel="noopener noreferrer"`)
- **Images**: Constrained to `max-width: 100%`

**Quoted Content Detection** (collapse patterns):
```
"On [date], [person] wrote:"
"---- Original Message ----"
Lines starting with ">"
Outlook-style headers
Gmail quoted reply wrappers (blockquote with class)
```
Detected quoted sections are rendered collapsed with an expand toggle.

### Message Expand/Collapse
- Each message starts collapsed (shows sender, time, snippet)
- Click to expand full body
- `use-message-expansion.ts` tracks expanded IDs in a `Set`
- "Expand all" / "Collapse all" controls
- Latest message auto-expanded on thread open

### Reply Composer

**Recipient Calculation** (`use-reply-recipients.ts`, ~380 lines):
1. Detect which Gmail account the thread belongs to (the "self")
2. For **simple reply**: `TO = the conversation partner` (last message sender if not self, else first non-self sender)
3. For **reply-all**: `TO = last message sender + all original TO/CC` minus self
4. Parse `"Name <email>"` format with fallback to raw email
5. User can override TO/CC via inline editing (save/cancel pattern)

**Rich Text Editor** (`tiptap-email-editor.tsx`, ~500 lines):
- Built on Tiptap (ProseMirror wrapper)
- Extensions: Bold, Italic, Underline, Link, Image, Font Family, MergeTagHighlight
- **Merge tags**: `{first_name}`, `{brand_name}`, etc., highlighted in editor
- **Angle bracket conversion**: `<Name>` → `{name}` on paste
- **HTML paste normalization**: Standardize paragraph structure
- **Signature insertion**: Appended below reply content
- Draft auto-saved to `mail-draft-store.ts` on every keystroke (debounced)

**Draft Persistence** (`mail-draft-store.ts`):
- Keyed by `threadId`
- Auto-expires after 7 days
- Survives navigation and page refresh
- Recovered on thread re-open

### AI Email Improvement — "Cheerify" (`use-cheerify.ts`)

**Purpose**: Operators can improve draft quality with one click rather than rewriting manually.

**Actions Available**:
| Action | Effect |
|--------|--------|
| `shorten` | Make email shorter |
| `expand` | Make email longer |
| `friendly` | Friendlier tone |
| `professional` | More formal |
| `casual` | More casual |
| `custom:[feedback]` | Custom instruction (user types feedback) |

**Implementation**:
- Calls `POST /api/improve-email-content-stream-send-textbox`
- Response is Server-Sent Events (SSE) stream
- Text updates in real-time as tokens arrive
- **Undo**: Restores previous draft text
- **Operation history**: Tracks cheerify actions used (sent to rule suggestion generator)

### Rule Suggestions (`use-rule-suggestions.ts`, ~350 lines)

**Purpose**: Learn from manual edits to automate future replies. After an operator edits a draft, the system generates rules like "When the creator mentions rates, always add our rate card link."

**Flow**:
1. Operator edits draft text manually
2. `use-rule-suggestions.ts` detects diff between original and final
3. Calls `POST /api/rules-suggestion` with original, edited text, and cheerify actions used
4. Backend generates 1–3 rule suggestions
5. Rules shown as dismissable toast notifications
6. Accepted rules saved to user profile for future auto-application

### Email Scheduling (`use-email-schedule.ts`)

**Purpose**: Send emails at optimal times or coordinate send timing across team members.

- Date/time picker via `custom-datetime-picker.tsx`
- Calls `POST /api/threads/{threadId}/schedule`
- Scheduled emails displayed in thread with countdown
- Cancel schedule option

### Email Send (`use-email-send.ts`, ~400 lines)

**Send sequence**:
1. Build recipient list (TO/CC)
2. Construct `In-Reply-To` header from last message ID
3. Construct `References` header from all message IDs in thread
4. Convert attachments to base64 data URIs
5. Call `POST /api/send-email`
6. Delete draft from `mail-draft-store.ts`
7. Optionally trigger rule suggestion generation
8. Silent background refresh of thread list
9. Cancel scheduled emails if a manual send occurs

### Thread Hide/Unhide (`use-thread-visibility.ts`)

**Purpose**: Operators can remove resolved or irrelevant threads from the inbox to keep the pending list manageable.

- `hideThread(threadId)` → `PATCH /api/threads/{threadId}/hide`
- `unhideThread(threadId, campaignId?)` → `PATCH /api/threads/{threadId}/unhide`
- Confirmation dialog for hide (destructive action)
- Auto-selects next thread after hiding
- Hidden threads appear in "Ignored" tab

### Bulk Edit (`use-bulk-edit.ts`)

**Purpose**: Allow operators to take the same action across multiple threads simultaneously.

- Checkbox multi-select on thread list items
- Floating action bar appears when threads selected
- Actions: bulk hide, bulk status change, bulk reassign campaign
- `bulk-edit-action-bar.tsx` renders the floating toolbar

---

## State Management Architecture

### Zustand Stores

**`mail-store.ts`** (Primary UI State)
```typescript
// Persisted to localStorage:
layout: { listWidth: number, detailWidth: number }
isCollapsed: boolean                    // Sidebar collapse
isMailListCollapsed: boolean            // Mobile: list panel collapse
selectedCampaigns: string[]             // Active campaign filters
knownCampaignIds: string[]             // For detecting new campaigns
includeUncategorized: boolean           // Show unassigned threads
lastUserId: string                      // Detect impersonation changes

// NOT persisted (ephemeral):
selectedMailId: string | null          // Active thread ID
lastSelectionTime: number              // Anti-flicker timestamp
activeView: 'pending' | 'sent' | 'ignored' | 'drafts' | 'creators'
selectedAccounts: string[]             // Filtered Gmail accounts
isDemoEmailDismissed: boolean          // Demo overlay state
emailSearchQuery: string               // Current search term
draftingThreadIds: Set<string>         // Threads awaiting AI draft
```

**`mail-draft-store.ts`** (Draft Persistence)
```typescript
drafts: Record<threadId, {
  text: string,          // Current draft HTML
  replyAll: boolean,     // Reply mode
  savedAt: number,       // Timestamp for 7-day expiry
}>
```

**`account-store.ts`** (Gmail Accounts)
```typescript
accounts: GmailAccount[]  // Connected Gmail accounts
selectedAccount: string   // Currently viewed account
```

**`campaign-preferences-store.ts`** (Per-Campaign Settings)
```typescript
preferences: Record<campaignId, {
  sortOrder: 'newest' | 'oldest',
  // other per-campaign preferences
}>
```

**`email-settings-store.ts`** (Email Configuration)
```typescript
signatures: EmailSignature[]   // User's email signatures
defaultSignatureId: string     // Auto-appended signature
```

---

## Query Layer (`use-mail-queries.ts`)

### Query Key Factory
```typescript
mailKeys = {
  pending: (accountId, campaignIds?, search?) => [...],
  sent:    (accountId, campaignIds?, search?) => [...],
  ignored: (accountId, campaignIds?, search?, includeUncategorized?) => [...],
  counts:  (accountId) => [...],
  thread:  (threadId) => [...],
}
```

### Core Fetcher: `fetchAndEnrichThreads()`

**Performance design**: A single API request is made with ALL account IDs rather than one request per account. For 61 accounts with 2 active tabs (pending + sent), this reduces 122 parallel requests to 2.

**Thread deduplication**: When a creator is in multiple campaigns, their thread may appear multiple times with different `campaign_id` associations. The fetcher deduplicates by `gmail_thread_id`, keeping the first occurrence.

**Filtering flags sent to API**:
- `include_messages=true` — Return messages inline (prevents N+1 thread fetching)
- `campaign_ids[]` — Filter to selected campaigns
- `include_uncategorized=true/false` — Include/exclude non-campaign threads
- `only_uncategorized=true/false` — Show ONLY unassigned threads
- `search=query` — Backend search when available

**Cache configuration**:
- `staleTime: 30s` (threads considered fresh for 30 seconds)
- `gcTime: 10m` (unused cache entries live 10 minutes)
- Manual `refetch()` called after hide/send operations

### Thread Data Shape
```typescript
GmailThread {
  id: string                    // Internal DB ID
  gmail_thread_id: string       // Gmail's thread identifier
  subject: string
  senderName: string            // Latest message sender
  senderEmail: string
  messages: GmailMessage[]      // All messages in thread
  labels: string[]              // Gmail labels
  lastMessageDate: string       // ISO timestamp
  accountEmail: string          // Which Gmail account received this
  flags: {
    wants_paid: boolean,        // Creator mentioned payment
    has_question: boolean,      // Message contains question
    has_issue: boolean,         // Issue detected
  }
  status: 'WAITING_FOR_DRAFT_REVIEW' | 'DRAFT' | ...
}
```

---

## Real-Time Update Mechanisms

Cheerful does NOT use WebSockets for the mail inbox. Instead it uses:

### 1. Silent Refresh
After any mutating operation (send, hide, schedule), the thread list is refetched in the background:
- Uses React Query's `refetch()`
- Tracks `silentRefreshCount` to suppress loading skeleton on background updates
- Only shows skeleton on initial load

### 2. Polling (Indirect)
Some backend operations (AI draft generation, bulk edits) are long-running. The UI polls status:
- `use-enrichment-polling.ts` — Polls creator enrichment status
- `use-scheduled-emails-list.ts` — Periodic refetch of scheduled emails

### 3. React Query Automatic Refetch
- Window focus triggers refetch (default React Query behavior)
- Account switch triggers manual refetch
- Campaign filter change triggers refetch

---

## Demo Email Onboarding

When a user has no connected Gmail accounts or no real threads, a demo email experience shows:
- `demo-email-display.tsx` — Simulated email thread with animated gradient border
- `demo-email-list-item.tsx` — Demo thread in the list
- `connect-email-overlay.tsx` — CTA to connect real Gmail account
- Tracks dismissal per user via `isDemoEmailDismissed` in store
- Purpose: Reduce friction during onboarding, show the inbox workflow before any emails exist

---

## Thread Status Badge System (`mail-list-status-badge.tsx`)

| Badge | Meaning |
|-------|---------|
| `WAITING_FOR_DRAFT_REVIEW` | AI draft generated, awaiting human approval before send |
| `DRAFT` | Manual draft in progress |
| `SENT` | Message sent (shown in Sent tab) |
| `IGNORED` | Thread hidden by operator |

---

## Thread Flag System (`thread-flag-icons.tsx`)

Flags are detected by AI analysis of email content and surface key signals:

| Flag | Icon | Color | Signal |
|------|------|-------|--------|
| `wants_paid` | 💰 | Amber | Creator mentioned payment/rates |
| `has_question` | ❓ | Blue | Email contains a question needing answer |
| `has_issue` | ⚠️ | Red | Problem or complaint detected |

These flags let operators triage which threads need attention without opening each one.

---

## Email Signatures

**Storage**: Backend database, fetched via `GET /api/email-signatures`

**Management UI** (`email-settings-modal.tsx`):
- List all signatures (`signature-list.tsx`)
- Create/edit with rich text editor (`signature-form.tsx`)
- Set default signature

**Usage**: Default signature appended below reply compose area. User can switch or remove before sending.

---

## API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/threads/list` | Fetch threads (pending/sent/ignored/drafts) |
| GET | `/api/threads/counts` | Count threads per status |
| GET | `/api/threads/{threadId}` | Fetch single thread |
| PATCH | `/api/threads/{threadId}/hide` | Hide thread |
| PATCH | `/api/threads/{threadId}/unhide` | Unhide thread |
| POST | `/api/send-email` | Send reply |
| POST | `/api/threads/{threadId}/schedule` | Schedule email send |
| POST | `/api/improve-email-content-stream-send-textbox` | Cheerify (SSE streaming) |
| POST | `/api/rules-suggestion` | Generate rule suggestions |
| GET | `/api/email-signatures` | List signatures |
| POST | `/api/email-signatures` | Create signature |
| PUT | `/api/email-signatures/{id}` | Update signature |
| DELETE | `/api/email-signatures/{id}` | Delete signature |
| GET | `/api/accounts` | List Gmail accounts |

---

## Performance Considerations

1. **Batch account fetching** — Single request for all accounts vs N parallel
2. **Client-side search** — 50-thread limit to avoid expensive server search on every keystroke
3. **Silent refresh** — Background refetch suppresses loading skeleton
4. **Draft auto-expiry** — 7-day TTL prevents stale draft accumulation
5. **Debounced search** — 400ms debounce before triggering search
6. **Message lazy expansion** — Only render full HTML body when expanded
7. **Campaign image lazy loading** — Images load on demand

---

## Developer Notes

- `mail-display.tsx` is the largest component at 120KB+ and handles a significant amount of business logic. A future refactor should extract reply composition, rule suggestions, and cheerify into separate components.
- The `use-reply-recipients.ts` hook handles many edge cases (self-email detection, fallback chains, name parsing) and is critical to correct threading behavior.
- The SSE streaming in `use-cheerify.ts` requires careful error handling; the event source must be closed on component unmount.
- Draft expiry (7 days) is enforced client-side only — the backend does not know about local drafts.
- Impersonation mode (dev) is handled in `use-gmail-accounts.ts` by injecting custom headers from localStorage.
