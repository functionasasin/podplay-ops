# Webapp State Stores Analysis

**Aspect**: `webapp-state-stores`
**Wave**: 1 — Layer-by-Layer Extraction
**Source paths**: `apps/webapp/stores/`, `apps/webapp/app/(mail)/mail/stores/`, `apps/webapp/app/(mail)/search/stores/`, `apps/webapp/app/onboarding/stores/`, `apps/webapp/app/(mail)/mail/hooks/`, `apps/webapp/components/campaigns/hooks/`

---

## Architecture Overview

Cheerful uses a **layered state management strategy** with three distinct layers:

| Layer | Technology | What lives here |
|-------|------------|-----------------|
| **Client UI state** | Zustand (no persist) | Modal open/close, active tab, transient selection |
| **Cross-session state** | Zustand + `persist` middleware → localStorage | Layout prefs, selected filters, email drafts |
| **Server cache** | TanStack Query (React Query v5) | Threads, counts, accounts, campaigns from API |
| **URL state** | `useSearchParams` / `next/navigation` | Active account, current mail view |

Stores are colocated near the feature they serve. The global `/stores/` directory holds app-wide state; feature-specific stores live adjacent to the feature routes.

---

## Store Inventory

### 1. `useCampaignWizardStore`
**File**: `stores/campaign-wizard-store.ts`
**Pattern**: Zustand (ephemeral, no persist)
**Purpose**: Holds all state for the multi-step campaign creation wizard. This is the largest store in the app — it's essentially the full in-progress campaign form, kept in memory while the wizard is open.

#### State Sections

| Section | Key Fields | Purpose |
|---------|-----------|---------|
| **Navigation** | `currentStep: number \| '3b'`, `selectedUserType`, `selectedCampaignType`, `editingFromConfirmation` | Tracks which wizard step is active; step `'3b'` is a paid-campaign-specific interstitial |
| **Products** | `products: ProductCard[]`, `expandedProductId` | Multi-product support; each `ProductCard` has source (new/existing), input method (ai/manual), URL, name, description |
| **Campaign content** | `campaignName`, `campaignGoal`, `campaignRules`, `campaignFaqs`, `campaignImage` | Core campaign metadata; rules and FAQs are arrays of `{id, text, isIgnored?}` |
| **Email** | `subjectLine`, `emailBody`, `followUpTemplates`, `csvFile`, `parsedCsvData`, `ccEmails`, `suggestedEmails` | Full email configuration including follow-up sequence and CSV upload state |
| **Email provider** | `emailProvider: 'cheerful' \| 'external'`, `selectedAccounts` | Choice between Cheerful-managed sending or external Gmail accounts |
| **Integrations** | `integrationSettings`, `googleSheetUrl`, `trackingRules`, `shopifyDiscountEnabled`, `shopifyProducts` | Optional Google Sheets tracking and Shopify discount/order integrations |
| **AI generation flags** | `isGeneratingCampaignSettings`, `isGeneratingEmailContent`, `isGeneratingTrackingRules` | Loading states while AI generates content |
| **Signature** | `emailSignature`, `emailSignatureEnabled`, `isRewritingSignature` | Per-wizard email signature management |

#### Step Navigation Logic (`stores/campaign-wizard-store.ts:401-457`)
```
Step 0 → Select user type (advertiser/creator/salesperson)
Step 1 → Select campaign type (seeding/paid/sales/creator)
  [creator/salesperson skip step 1: 0 → 2]
Step 2 → Product details
Step 3 → Campaign content (rules, FAQs, goal)
  [paid campaigns: 3 → '3b' → 4]
Step '3b' → Paid-specific configuration
Step 4 → Integration settings
Step 5 → Email template
Step 6 → Email sequence / follow-ups
Step 7 → Creator targeting (CSV upload or search)
Step 8 → Email accounts selection
Step 9 → Review & submit
```

`getStepConfig()` returns different `totalSteps` per user type:
- `advertiser` → 10 steps
- `salesperson` → 9 steps
- `creator` → 3 steps

#### FAQ storage pattern
FAQs are stored as `CampaignRule` objects with `text: "${question}|||${answer}"` — the separator `|||` is used to pack two fields into one. This is a pragmatic shortcut to avoid changing the shared `CampaignRule` interface.

#### Email suggestion caching
`fetchEmailSuggestions()` (line 653) is an async action embedded in the store that:
1. Deduplicates concurrent requests with `isFetchingSuggestions` flag
2. Queues pending requests in `pendingSuggestionName`
3. After completion, recursively processes the queued request
4. Calls `/api/suggest-campaign-emails` (Next.js API route → Claude)

#### Selector hooks for optimized re-renders
The store exports named selector hooks using `useShallow` from Zustand:
- `useWizardNavigation()` — navigation state + actions
- `useProductState()` — product list + CRUD actions
- `useCampaignContentState()` — campaign metadata + rule actions
- `useIntegrationState()` — Google Sheets/Shopify configuration
- `useEmailState()` — email template + CSV + signature
- `useRuleEditingState()` — in-place rule editor state
- `useWizardReset()` — reset action only

Components import domain-specific selectors rather than the full store to prevent unnecessary re-renders.

---

### 2. `useCampaignUIStore`
**File**: `stores/campaign-ui-store.ts`
**Pattern**: Zustand (ephemeral)
**Purpose**: Thin store for campaign list page UI — tracks whether the "Create Campaign" modal is open and provides a `refreshKey` counter that components can watch to know when to re-fetch campaign data.

```typescript
interface CampaignUIState {
  isModalOpen: boolean
  refreshKey: number
  openModal(): void
  closeModal(): void
  triggerRefresh(): void  // increments refreshKey
}
```

**Why this exists**: Decouples the modal open trigger (which can come from sidebar nav, campaign list button, etc.) from the wizard component tree.

---

### 3. `useEnrichmentStore`
**File**: `stores/enrichment-store.ts`
**Pattern**: Zustand (ephemeral), polling loop runs outside React lifecycle
**Purpose**: Manages the creator email enrichment flow — finding email addresses for creators who don't have one before adding them to a campaign.

#### State machine
```
closed → expanded (user selects creators without emails)
expanded → minimized (user minimizes panel while enrichment runs)
minimized → expanded (user restores)
expanded/minimized → closed (user confirms or cancels)
```

#### Key state
```typescript
interface EnrichmentStore {
  visualState: 'expanded' | 'minimized' | 'closed'
  creators: CreatorInListResponse[]          // Input creators needing enrichment
  rows: RowState[]                           // Per-creator: result, checked, manualEmail
  results: EnrichmentResult[]               // Polled from backend
  isEnriching: boolean
  isComplete: boolean
  onConfirmCallback: (creators: EnrichedCreator[]) => void  // Callback to campaign wizard
}
```

#### Polling architecture
The `startPolling()` function (line 221) runs **outside React** — it's a plain async function that uses `set`/`get` directly. This is a deliberate Zustand pattern to avoid stale closures. The abort flag (`abortFlag`) is also module-level, not store state.

Flow:
1. `POST /api/v1/enrich-creators` → returns `workflow_id` (Temporal workflow)
2. Poll `GET /api/v1/enrich-creators/{workflow_id}/status` every 2s
3. Max 180 attempts (6 minutes)
4. On completion, updates `rows` with results, auto-checks creators with found emails
5. `confirm()` maps checked rows to `EnrichedCreator[]` and calls `onConfirmCallback`

---

### 4. `useNotificationsStore`
**File**: `stores/notifications-store.ts`
**Pattern**: Zustand (ephemeral)
**Purpose**: Badge notifications on sidebar nav items and campaign-specific warnings.

```typescript
interface NotificationsState {
  notifications: Record<string, boolean>   // route → has notification dot
  warnings: Record<string, boolean>        // route → has warning dot
  campaignWarnings: CampaignWarning[]      // {campaignId, campaignName, errorType}
}
```

**Usage pattern**: Search store calls `useNotificationsStore.getState().showNotification('/search')` directly (store-to-store communication without component involvement). Campaign warnings (e.g., email sending errors) set a warning badge on `/campaigns`.

---

### 5. `useMailStore`
**File**: `app/(mail)/mail/stores/mail-store.ts`
**Pattern**: Zustand + `persist` middleware
**Persisted key**: `'mail-storage'`
**Purpose**: Central state for the mail inbox view — thread selection, layout, active view tab, and filter state.

#### State categories

| Category | Persisted | Fields |
|----------|-----------|--------|
| **Selection** | No | `selectedMailId`, `lastSelectionTime` |
| **Layout** | Yes | `layout: number[]` (panel widths), `isCollapsed`, `isMailListCollapsed` |
| **Active view** | No | `activeView: MailView \| SecondaryView` |
| **Accounts** | No | `selectedAccounts: string[]` |
| **Filters** | Yes | `selectedCampaigns`, `knownCampaignIds`, `sortOrder`, `includeUncategorized` |
| **User identity** | Yes | `lastUserId` — detects impersonation session changes |
| **Drafting** | No | `draftingThreadIds`, `draftingThreadData`, `draftingThreadTimestamps` |

#### View enum
```typescript
enum MailView { Pending = 'pending', Sent = 'sent', Ignored = 'ignored' }
enum SecondaryView { Campaigns = 'campaigns', Creators = 'creators', Inbox = 'inbox', Drafts = 'drafts' }
```

#### Session isolation
`checkAndResetForUser(currentUserId)` (line 150): If the persisted `lastUserId` differs from the current user, clears campaign filters. This handles the case where an admin impersonates different users — the mail view resets to neutral state automatically.

#### Draft tracking state
When a user un-ignores a thread, the UI marks it as "drafting" via `markThreadDrafting()`. Components watch `draftingThreadIds` to show a spinner while the Temporal workflow generates an AI draft. `clearThreadDrafting()` is called when the draft appears. Timestamps track when drafting started to show elapsed time.

#### Persist migration
Uses a custom `merge` function to handle users with old localStorage state missing newer fields (e.g., `includeUncategorized` defaults to `true` if absent).

---

### 6. `useMailDraftStore`
**File**: `app/(mail)/mail/stores/mail-draft-store.ts`
**Pattern**: Zustand + `persist`
**Persisted key**: `'mail-draft-storage'`
**Purpose**: Preserves unsent reply drafts when the user switches between threads. Without this, typing a draft reply then clicking another thread would lose the text.

```typescript
// Per-thread draft
interface MailDraft {
  text: string          // HTML content from TipTap editor
  isReplyAll: boolean
  lastUpdated: number   // Unix ms timestamp for expiry
}
drafts: Record<threadId, MailDraft>
```

**7-day expiry**: `getDraft()` checks `Date.now() - draft.lastUpdated > DRAFT_EXPIRY_MS` and auto-deletes stale drafts. Prevents localStorage bloat from accumulating old drafts.

---

### 7. `useAccountStore`
**File**: `app/(mail)/mail/stores/account-store.ts`
**Pattern**: Zustand + `persist`
**Persisted key**: `'account-storage'`
**Purpose**: Remembers which Gmail account the user last selected, so they don't have to re-select on every page load.

```typescript
interface AccountState {
  accounts: Account[]              // {label, email}
  selectedAccountEmail: string | null
}
```

Only `selectedAccountEmail` is persisted (not `accounts` — those are re-fetched from server).

---

### 8. `useCampaignDraftStore`
**File**: `app/(mail)/mail/stores/campaign-draft-store.ts`
**Pattern**: Zustand + `persist`
**Persisted key**: `'campaign-draft-storage'`
**Purpose**: Saves in-progress campaign creation across modal close/reopen and browser refresh.

```typescript
interface CampaignDraft {
  campaignName, campaignGoal, campaignRules, campaignFaqs
  productName, productDescription, productUrl
  emailSubject, emailBody, ccEmails
}
```

`hasDraft()` returns `true` if any meaningful field is non-empty — used to show "Resume draft?" prompts.

**Note**: This is distinct from `useCampaignWizardStore` — the wizard store holds full in-flight state (including File objects, AI generation state), while the draft store holds only serializable data that survives localStorage.

---

### 9. `useCampaignPreferencesStore`
**File**: `app/(mail)/mail/stores/campaign-preferences-store.ts`
**Pattern**: Zustand + `persist`
**Persisted key**: `'campaign-preferences-storage'`
**Purpose**: Remembers the user's preferred email style choices to pre-fill wizard defaults.

```typescript
interface CampaignPreferencesState {
  emailTone: string      // e.g., 'professional', 'casual'
  emailStyle: string     // e.g., 'concise', 'detailed'
  emailProvider: 'cheerful' | 'external'
  defaultUpdateGoogleSheet: boolean
  defaultShowCcField: boolean
}
```

These preferences pre-populate the email generation prompts, giving AI-generated emails a consistent style that matches the user's past choices.

---

### 10. `useEmailSettingsStore`
**File**: `app/(mail)/mail/stores/email-settings-store.ts`
**Pattern**: Zustand (ephemeral)
**Purpose**: Controls the Email Settings modal (signatures and connected accounts). Allows deep-linking into the modal from different surfaces (e.g., "Add signature" from wizard opens modal in create mode).

```typescript
interface EmailSettingsState {
  isOpen: boolean
  activeTab: 'signatures' | 'accounts'
  signatureMode: 'create' | null
  openModal(tab?, options?): void  // Can open directly to create-signature mode
}
```

---

### 11. `useSearchStore`
**File**: `app/(mail)/search/stores/search-store.ts`
**Pattern**: Zustand (ephemeral)
**Purpose**: Manages creator search state — query, results, pagination, filters, selection, and the "add to list" modal.

#### State sections
```typescript
// Search params
query: string
selectedPlatform: Platform   // 'instagram' | 'youtube'
searchMode: SearchMode       // 'similar' | 'keyword'

// Results
creators: SearchedCreator[]
youtubeChannels: YouTubeSimilarChannelResponse[]

// Pagination (IC keyword search only)
currentPage: number
totalResults: number | null
hasMore: boolean
pageCache: Map<number, SearchedCreator[]>  // Client-side page cache

// Filters (IC only)
followersFilter: { min, max } | null
engagementFilter: { min, max } | null

// UI
sortBy: 'followers' | 'relevance' | 'engagement'
sortOrder: 'asc' | 'desc'
selectedIds: Set<string>    // Multi-selection for batch operations
viewingCreatorId: string | null   // Opens creator detail sheet
isAddToListModalOpen: boolean
savedIds: Set<string>       // Locally saved (not persisted)
```

#### Platform/mode switching side effects
`setSelectedPlatform()` and `setSearchMode()` both reset pagination, selection, filters, and cache. This prevents stale results when the user switches search context.

#### Store-to-store notification
```typescript
setCreators: (creators) => {
  if (creators.length > 0) {
    useNotificationsStore.getState().showNotification('/search')
  }
  set({ creators })
}
```
Triggers a notification badge on the Search nav item when results arrive.

---

### 12. `useOnboardingStore`
**File**: `app/onboarding/stores/onboarding-store.ts`
**Pattern**: Zustand + `persist`
**Persisted key**: `'onboarding-storage'`
**Purpose**: Preserves onboarding selections (role, referral source) if the user navigates away during onboarding.

```typescript
enum OnboardingStep { WELCOME, CONNECT, DESCRIBE, PRODUCT, ROLE, REFERRAL }
// Role options: brand-agency, creator-agency, creator, sales, other
// Referral options: google, social-media, friend, linkedin, other
```

---

## Key Custom Hooks

### `useAuthCache` (`hooks/use-auth-cache.ts`)
**Purpose**: Initializes Supabase auth once and caches it in component state. Prevents the mail inbox from making redundant `getSession()`/`getUser()` calls in every query.

```typescript
// Returns: { session, user, isInitialized }
// Queries are gated on isInitialized === true to prevent race conditions
```

**Why necessary**: TanStack Query runs `queryFn` on mount, and without cached auth, every query would independently call Supabase auth, creating N auth network requests per page load.

---

### `useMailQueries` (`hooks/use-mail-queries.ts`)

Core TanStack Query hooks for thread data. Key design decisions:

**Query key factory**:
```typescript
mailKeys = {
  pending: (accountId, campaignIds?, search?) => [...],
  sent: (accountId, campaignIds?, search?) => [...],
  ignored: (accountId, campaignIds?, search?, includeUncategorized?) => [...],
  counts: (accountId) => [...],
  thread: (threadId) => [...],
}
```

**Consolidated request**: `fetchAndEnrichThreads()` (line 88) sends **one request with all account IDs** (using `gmail_account_ids` repeated params) rather than N parallel requests per account. Comment notes this reduced 122 requests (61 accounts × 2 tabs) to 2 requests.

**Hooks**:
- `usePendingMails()` — threads with `status_filter=WAITING_FOR_DRAFT_REVIEW`
- `useSentMails()` — threads with `direction_filter=outbound`
- `useIgnoredMails()` — threads with `status_filter=IGNORE`, supports `includeUncategorized`
- `useMailCounts()` — sidebar badge counts
- `useInvalidateMailQueries()` — returns invalidation functions for post-mutation refresh

**401 handling**: On 401, hooks refresh the Supabase session and retry the request once before throwing (lines 160-194).

**Stale time**: 30 seconds for thread lists, 60 seconds for counts.

---

### `useMailBootstrap` (`hooks/use-mail-bootstrap.ts`)
**Purpose**: Checks whether the user has Gmail credentials configured. Used as a gating check before rendering the mail inbox — if `hasCredentials=false`, shows the setup screen.

**Retry strategy**: Uses a custom `CredentialsNotReadyError` to retry up to 3 times with 500ms delay. This handles the race condition where credentials were just created during onboarding but the server action hasn't seen them yet.

**Fallback chain**:
1. Try server action `getMailBootstrap()`
2. If no credentials: check React Query cache for gmail accounts
3. If cache miss: query Supabase directly
4. If still nothing: throw `CredentialsNotReadyError` → retry

---

### `useEmailSend` (`hooks/use-email-send.ts`)
**Purpose**: Encapsulates the full email send flow. This hook has two code paths:

**Owner path** (line 259): Uses `/api/send-email` Next.js route → Gmail API. After send:
1. Updates `gmail_thread_state` to `NOT_LATEST` via `/api/threads/state`
2. Removes `cheerful-human-review` labels via `/api/update-thread-labels`
3. Deletes drafts

**Team member path** (line 210): Uses backend API `/api/emails/send` with service role (bypasses RLS). Skips thread state update (backend handles it), skips label update and draft deletion (team members don't own these resources).

**Post-send actions** (both paths):
- Constructs synthetic `GmailMessage` and appends to thread for immediate UI update
- Tracks event via Mixpanel
- Triggers rule suggestion generation (async, fire-and-forget)
- Triggers bulk edit classification (async, fire-and-forget) if draft was edited

---

### `useBulkEdit` (`hooks/use-bulk-edit.ts`)
**Purpose**: After a user edits and sends a draft, classifies the edit to determine if it should be applied to other similar pending drafts in the same campaign.

**Flow**:
1. `classifyEdit()` → POST `/api/classify-edit` (Next.js → Claude)
2. If AI says edit is generalizable (`shouldOffer=true`): shows action bar with count of affected drafts
3. User can `applyBulkEdit(instruction, saveAsRule)` → POST `/api/bulk-draft-edit` → Temporal workflow rewrites N drafts
4. After 5 seconds (workflow grace period), invalidates `mailKeys.all` to refresh thread list

---

### `useCheerify` (`hooks/use-cheerify.ts`)
**Purpose**: AI email improvement operations (tone, length, clarity). Tracks operations used so the rule suggestion system knows whether edits were manual or AI-assisted.

```typescript
// Operations: 'make-shorter', 'make-friendly', 'add-custom-feedback', etc.
improveEmail(action, currentDraftText, onTextUpdate) // Streams updated text
undoLastOperation(onTextUpdate)   // Restores pre-operation text
resetOperations()                  // Called after send
```

---

## State Architecture Summary

### What lives where

```
Zustand (session memory)
├── Campaign wizard form data       → useCampaignWizardStore
├── Campaign list UI (modal)        → useCampaignUIStore
├── Creator enrichment flow         → useEnrichmentStore
├── Sidebar notification badges     → useNotificationsStore
├── Mail view/tab/selection         → useMailStore (partial persist)
├── Email settings modal            → useEmailSettingsStore
└── Creator search results          → useSearchStore

Zustand + localStorage persist
├── Mail layout preferences         → useMailStore (layout, filters)
├── Reply drafts per thread         → useMailDraftStore (7d expiry)
├── Selected Gmail account          → useAccountStore
├── Campaign in-progress draft      → useCampaignDraftStore
├── Email generation preferences    → useCampaignPreferencesStore
└── Onboarding selections           → useOnboardingStore

TanStack Query (server state)
├── Thread lists (pending/sent/ignored)  → usePendingMails, useSentMails, useIgnoredMails
├── Thread counts                        → useMailCounts
├── Gmail accounts                       → useGmailAccounts
├── Mail bootstrap check                 → useMailBootstrap
├── Campaigns list                       → auto-generated from Orval
└── Creators list                        → auto-generated from Orval

URL state (Next.js searchParams)
├── ?account=email@domain.com       → selected Gmail account
└── query params on search page     → platform, mode
```

### Persistence decisions rationale

| Store | Persisted? | Rationale |
|-------|------------|-----------|
| Campaign wizard | No | Contains File objects (non-serializable); form is submitted in one session |
| Mail drafts | Yes, 7 days | Prevent user from losing typed replies when switching threads |
| Mail layout | Yes | Layout is a user preference that should survive refresh |
| Campaign filters | Yes | Users expect their filter selections to persist between sessions |
| Email preferences | Yes | Once a user sets their tone/style, they shouldn't need to re-set it every campaign |
| Search results | No | Stale results are confusing; always re-fetch |
| Enrichment state | No | Enrichment workflow tied to specific creators; not recoverable from localStorage |
| Onboarding | Yes | Allows user to navigate away and resume |

### Inter-store dependencies
- `useSearchStore` → calls `useNotificationsStore.getState()` directly (non-React call pattern)
- `useEnrichmentStore` → calls backend API directly (not via TanStack Query; uses polling loop)
- `useCampaignWizardStore.fetchEmailSuggestions` → calls `/api/suggest-campaign-emails` directly (async action embedded in store)
- `useMailBootstrap` → reads `useGmailAccounts` query cache via `getQueryClient()`
