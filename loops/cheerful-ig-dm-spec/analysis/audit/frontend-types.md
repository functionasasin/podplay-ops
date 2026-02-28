# Audit: Frontend TypeScript Types

**Aspect:** `audit-frontend-types`
**Wave:** 1 — Codebase Audit
**Status:** Complete

---

## Summary

The Cheerful webapp uses a two-layer type system:

1. **Hand-authored frontend types** in `app/utils/gmail-types.ts` — the canonical UI types consumed by all components.
2. **Orval-generated API types** in `lib/api/generated/schemas/` — auto-generated from the FastAPI OpenAPI spec, used primarily for campaign/creator endpoints.

Thread/message types sit outside the generated layer — they use hand-authored `ThreadWithMessages` / `GmailThread` adapters. The only channel discriminator currently is an **optional field presence check** (either `gmail_thread_state_id` or `smtp_thread_state_id` is populated). There is no explicit `channel` string field on thread objects.

---

## 1. Primary Thread Types

### 1a. `GmailThread` — canonical frontend thread type

**File:** `apps/webapp/app/utils/gmail-types.ts` (lines 45–61)

```typescript
export interface GmailThread {
  id: string;                        // gmail_thread_id from backend
  subject: string;
  snippet: string;
  lastMessageDate: string;           // ISO8601, from latest_internal_date
  senderName: string;
  senderEmail: string;
  isUnread: boolean;
  labels: string[];
  messages: GmailMessage[];          // sorted chronologically, oldest first
  accountEmail?: string;             // gmail account this thread belongs to
  campaignId?: string;
  gmail_thread_state_id?: string;    // UUID from gmail_thread_state table
  giftingStatus?: string;            // NEW | OPTED_IN | OPTED_OUT | ORDER_SENT
  paidPromotionStatus?: string;
  flags?: ThreadFlags;
}
```

**Note:** `smtp_thread_state_id` is NOT in this type — SMTP threads use the same `GmailThread` type but populated from SMTP source data. The `gmail_thread_state_id` field is used as the channel discriminator at send time.

### 1b. `GmailMessage` — canonical frontend message type

**File:** `apps/webapp/app/utils/gmail-types.ts` (lines 19–34)

```typescript
export interface GmailMessage {
  id: string;           // Gmail API message ID
  messageIdHeader?: string;  // Message-ID header value
  threadId: string;
  name: string;         // sender display name
  email: string;        // sender email
  subject: string;
  text: string;         // plain text body
  bodyHtml?: string;
  date: string;
  read: boolean;
  labels: string[];
  attachments: Attachment[];
  to: string[];
  cc: string[];
}
```

### 1c. `ThreadFlags`

**File:** `apps/webapp/app/utils/gmail-types.ts` (lines 36–43)

```typescript
export interface ThreadFlags {
  wants_paid: boolean;
  wants_paid_reason?: string;
  has_question: boolean;
  has_question_reason?: string;
  has_issue: boolean;
  has_issue_reason?: string;
}
```

### 1d. `Attachment`

**File:** `apps/webapp/app/utils/gmail-types.ts` (lines 4–17)

```typescript
export interface Attachment {
  id?: string;           // Database UUID
  dbMessageId?: string;  // DB UUID for message (for download URL)
  filename: string;
  mimeType: string;
  size: number;
  // Legacy fields for Gmail API fallback:
  attachmentId: string;
  messageId: string;
}
```

---

## 2. Backend Response DTO Types (Adapter Layer)

**File:** `apps/webapp/lib/threads-adapters.ts`

These are the raw backend response shapes before transformation to frontend types.

### 2a. `ThreadWithMessages` (backend DTO)

```typescript
export interface ThreadWithMessages {
  gmail_thread_id: string;
  gmail_thread_state_id: string;
  status: string;
  latest_internal_date: string;
  latest_direction: string;          // 'inbound' | 'outbound'
  snippet: string;
  sender_email: string;
  sender_name: string;
  subject: string | null;
  campaign_id: string | null;
  preferences__is_hidden: boolean;
  account_email: string;
  is_unread: boolean;
  labels: string[];
  messages: MessageInThread[];
  gifting_status?: string | null;
  paid_promotion_status?: string | null;
  flags?: ThreadFlags | null;
}
```

### 2b. `MessageInThread` (backend DTO)

```typescript
export interface MessageInThread {
  id: string;
  db_message_id: string | null;
  thread_id: string;
  sender_name: string;
  sender_email: string;
  recipient_emails: string[];
  cc_emails: string[];
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  date: string;
  labels: string[];
  is_read: boolean;
  is_draft: boolean;
  message_id_header: string | null;
  attachments: AttachmentInMessage[];
}
```

### 2c. `AttachmentInMessage` (backend DTO)

```typescript
export interface AttachmentInMessage {
  id: string;
  gmail_message_id: string;
  filename: string | null;
  mime_type: string;
  size: number;
}
```

### 2d. Transformer function

**File:** `apps/webapp/lib/threads-adapters.ts` (lines 92–143)

```typescript
export function transformThreadWithMessagesToGmailThread(
  thread: ThreadWithMessages
): GmailThread
```

Maps `ThreadWithMessages` → `GmailThread`:
- `thread.gmail_thread_id` → `id`
- `thread.latest_internal_date` → `lastMessageDate`
- `thread.sender_email` → `senderEmail`
- `thread.messages[]` → `messages[]` (via per-message mapping)
- Calls `normalizeWhitespace(msg.body_text || extractTextFromHtml(msg.body_html))`

Also exports:
```typescript
export function transformThreadSummaryToGmailThread(summary: ThreadSummary): GmailThread
export function normalizeWhitespace(text: string): string
export function filterPendingApprovals(threads: GmailThread[]): GmailThread[]
```

---

## 3. Orval-Generated Types (API Schemas)

Located in `apps/webapp/lib/api/generated/schemas/`. Generated by orval from the FastAPI OpenAPI spec. Do not edit manually.

### 3a. `GmailThreadStatus` enum

**File:** `lib/api/generated/schemas/gmailThreadStatus.ts`

```typescript
export const GmailThreadStatus = {
  READY_FOR_ATTACHMENT_EXTRACTION: "READY_FOR_ATTACHMENT_EXTRACTION",
  READY_FOR_CAMPAIGN_ASSOCIATION: "READY_FOR_CAMPAIGN_ASSOCIATION",
  READY_FOR_RESPONSE_DRAFT: "READY_FOR_RESPONSE_DRAFT",
  WAITING_FOR_DRAFT_REVIEW: "WAITING_FOR_DRAFT_REVIEW",
  WAITING_FOR_INBOUND: "WAITING_FOR_INBOUND",
  IGNORE: "IGNORE",
  DONE: "DONE",
  NOT_LATEST: "NOT_LATEST",
} as const;
export type GmailThreadStatus = (typeof GmailThreadStatus)[keyof typeof GmailThreadStatus];
```

### 3b. `GmailMessageDirection` enum

**File:** `lib/api/generated/schemas/gmailMessageDirection.ts`

```typescript
export const GmailMessageDirection = {
  inbound: "inbound",
  outbound: "outbound",
} as const;
export type GmailMessageDirection = (typeof GmailMessageDirection)[keyof typeof GmailMessageDirection];
```

### 3c. `ThreadSummary` (generated)

**File:** `lib/api/generated/schemas/threadSummary.ts`

```typescript
export interface ThreadSummary {
  gmail_thread_id: string;
  gmail_thread_state_id: string;
  status: GmailThreadStatus;
  latest_internal_date: string;
  latest_direction: GmailMessageDirection;
  snippet: string;
  sender_email: string;
  subject: ThreadSummarySubject;        // string | null nullable alias
  campaign_id: ThreadSummaryCampaignId; // string | null nullable alias
  preferences__is_hidden: boolean;
  gifting_status?: ThreadSummaryGiftingStatus;
  paid_promotion_status?: ThreadSummaryPaidPromotionStatus;
  flags?: ThreadFlags;
}
```

### 3d. `ThreadWithMessagesOutput` (generated)

**File:** `lib/api/generated/schemas/threadWithMessagesOutput.ts`

```typescript
export interface ThreadWithMessagesOutput {
  gmail_thread_id: string;
  gmail_thread_state_id: string;
  status: GmailThreadStatus;
  latest_internal_date: string;
  latest_direction: GmailMessageDirection;
  snippet: string;
  sender_email: string;
  sender_name: string;
  subject: ThreadWithMessagesOutputSubject;
  campaign_id: ThreadWithMessagesOutputCampaignId;
  preferences__is_hidden: boolean;
  account_email: string;
  is_unread: boolean;
  labels: string[];
  messages: MessageInThread[];
  gifting_status?: ThreadWithMessagesOutputGiftingStatus;
  paid_promotion_status?: ThreadWithMessagesOutputPaidPromotionStatus;
  flags?: ThreadFlags;
}
```

### 3e. `SmtpAccountResponse` (generated)

**File:** `lib/api/generated/schemas/smtpAccountResponse.ts`

```typescript
export interface SmtpAccountResponse {
  id: string;
  email_address: string;
  display_name: SmtpAccountResponseDisplayName;  // string | null
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_use_tls: boolean;
  imap_host: string;
  imap_port: number;
  imap_username: string;
  imap_use_ssl: boolean;
  is_active: boolean;
  last_verified_at: SmtpAccountResponseLastVerifiedAt;  // string | null
  verification_error: SmtpAccountResponseVerificationError;  // string | null
  created_at: string;
}
```

**Note:** `SmtpAccountResponse` is the DIRECT template for `IgDmAccountResponse`. It has no sensitive credential fields (passwords excluded from response model).

### 3f. `ListThreadsApiThreadsGetParams` (generated, query params)

**File:** `lib/api/generated/schemas/listThreadsApiThreadsGetParams.ts`

```typescript
export type ListThreadsApiThreadsGetParams = {
  status_filter?: GmailThreadStatus[] | null;
  direction_filter?: GmailMessageDirection | null;
  campaign_id?: string | null;
  campaign_ids?: string[] | null;
  gmail_account_ids?: string[] | null;
  show_hidden?: boolean;
  limit?: number;   // 1–100
  offset?: number;  // >=0
  search?: string | null;
  include_messages?: boolean;
  include_uncategorized?: boolean;
  only_uncategorized?: boolean;
};
```

### 3g. List Response Union

**File:** `lib/api/generated/schemas/listThreadsApiThreadsGet200.ts`

```typescript
export type ListThreadsApiThreadsGet200 =
  | ThreadSummary[]
  | ThreadWithMessagesOutput[];
```

Discriminated by `include_messages` parameter value.

---

## 4. API Client Functions

### 4a. Backend threads direct fetch

**File:** `apps/webapp/lib/backend-threads-client.ts`

```typescript
export async function fetchThreadsFromBackend(
  options: FetchThreadsOptions = {}
): Promise<ThreadSummary[]>
```

- Gets Supabase session, sends Bearer token
- Calls `${NEXT_PUBLIC_BACKEND_URL}/api/threads/?${params}`
- Returns `ThreadSummary[]`

### 4b. Primary fetch-and-enrich (used by all hooks)

**File:** `apps/webapp/app/(mail)/mail/hooks/use-mail-queries.ts` (lines 88–219)

```typescript
async function fetchAndEnrichThreads(
  session: Session,
  allAccounts: GmailAccount[],
  options: FetchThreadsOptions = {}
): Promise<GmailThread[]>
```

- Calls Next.js route `/api/threads/list` (not backend directly)
- Passes `gmail_account_ids[]`, `include_messages=true`, optional filters
- Calls `deduplicateThreads()` then `transformThreadWithMessagesToGmailThread()` per thread
- Returns `GmailThread[]`

**`FetchThreadsOptions` shape** (inferred from usage):
```typescript
interface FetchThreadsOptions {
  statusFilter?: string;
  directionFilter?: string;
  showHidden?: boolean;
  campaignIds?: string[];
  includeUncategorized?: boolean;
  search?: string;
}
```

---

## 5. TanStack Query Hooks

**File:** `apps/webapp/app/(mail)/mail/hooks/use-mail-queries.ts`

### 5a. Query Key Factory

```typescript
export const mailKeys = {
  all: ['mails'] as const,
  pending: (accountId: string, campaignIds?: string[], search?: string) =>
    [...mailKeys.all, 'pending', accountId, { campaignIds, search }] as const,
  sent: (accountId: string, campaignIds?: string[], search?: string) =>
    [...mailKeys.all, 'sent', accountId, { campaignIds, search }] as const,
  ignored: (accountId: string, campaignIds?: string[], search?: string, includeUncategorized?: boolean) =>
    [...mailKeys.all, 'ignored', accountId, { campaignIds, search, includeUncategorized }] as const,
  counts: (accountId: string) => [...mailKeys.all, 'counts', accountId] as const,
  thread: (threadId: string) => [...mailKeys.all, 'thread', threadId] as const,
};
```

### 5b. `usePendingMails`

```typescript
export function usePendingMails(
  accountId: string | null,
  enabled?: boolean,
  cachedSession?: Session | null,
  cachedUser?: User | null,
  gmailAccounts?: GmailAccount[],
  campaignIds?: string[],
  search?: string
): UseQueryResult<GmailThread[]> & { isLoadingOrFetching: boolean }
```

- Queries `status_filter=WAITING_FOR_DRAFT_REVIEW`
- `staleTime: 30_000`

### 5c. `useSentMails`

```typescript
export function useSentMails(
  accountId: string | null,
  enabled?: boolean,
  cachedSession?: Session | null,
  cachedUser?: User | null,
  gmailAccounts?: GmailAccount[],
  campaignIds?: string[],
  search?: string
): UseQueryResult<GmailThread[]> & { isLoadingOrFetching: boolean }
```

- Queries `direction_filter=outbound`

### 5d. `useIgnoredMails`

```typescript
export function useIgnoredMails(
  accountId: string | null,
  enabled?: boolean,
  cachedSession?: Session | null,
  cachedUser?: User | null,
  gmailAccounts?: GmailAccount[],
  campaignIds?: string[],
  search?: string,
  includeUncategorized?: boolean
): UseQueryResult<GmailThread[]> & { isLoadingOrFetching: boolean }
```

- Queries `status_filter=IGNORE`, `show_hidden=true`

### 5e. `useMailCounts`

```typescript
export function useMailCounts(
  accountId: string | null,
  allAccountEmails?: string[],
  enabled?: boolean,
  appUserEmail?: string | null
): UseQueryResult<{ pending: number; sent: number; ignored: number }>
```

- Calls `/api/emails/counts?account={id}`

---

## 6. Channel Discriminator Pattern (Current State)

**No explicit `channel` field exists** on `GmailThread` or any thread response type.

Channel discrimination is done implicitly:
- **Gmail:** `gmail_thread_state_id` is populated
- **SMTP:** thread data sourced from SMTP account — `GmailThread` reused, no SMTP-specific field on the frontend type
- **Channel detection at send time:** `SendEmailRequest` has optional `gmail_thread_state_id?` and `smtp_thread_state_id?` — only one populated

**Implication for IG DM:** A `channel` discriminator field MUST be added to enable:
1. Rendering channel badge (email vs DM)
2. Conditional composer rendering (`DmComposer` vs email editor)
3. API routing (DM send vs email send)

---

## 7. Account Types

### 7a. `GmailAccount` (custom hook type)

**File:** `apps/webapp/app/(mail)/mail/hooks/use-gmail-accounts.ts`

```typescript
export interface GmailAccount {
  id: string;           // Database UUID
  email: string;        // Gmail address
  // (exact fields TBD — read file for complete definition)
}
```

### 7b. `SmtpAccountResponse` (generated — template for IgDmAccountResponse)

See section 3e above.

---

## 8. Key Implications for IG DM Spec

### Types to ADD (new files):

| File | Type | Notes |
|------|------|-------|
| `app/utils/ig-dm-types.ts` | `IgDmThread` | Parallel to `GmailThread`; uses `ig_handle` not `senderEmail`, no `subject`, adds `windowExpiresAt`, `igConversationId` |
| `app/utils/ig-dm-types.ts` | `IgDmMessage` | Parallel to `GmailMessage`; text only + optional media URL, no `bodyHtml`, `to`, `cc`, `subject` |
| `app/utils/ig-dm-types.ts` | `IgDmAttachment` | Media attachment: `type: 'image' \| 'video' \| 'audio' \| 'file'`, `url: string`, `storageUrl?: string` |
| `lib/api/generated/schemas/igDmAccountResponse.ts` | `IgDmAccountResponse` | Parallel to `SmtpAccountResponse`; `ig_user_id`, `ig_username`, `page_id`, `token_expires_at`, `is_active` |

### Types to MODIFY (existing files):

| File | Change |
|------|--------|
| `app/utils/gmail-types.ts` | Add `channel?: 'gmail' \| 'smtp' \| 'instagram_dm'` to `GmailThread` — or introduce `Thread = GmailThread \| IgDmThread` union |
| `lib/threads-adapters.ts` | Add `IgDmThreadWithMessages` backend DTO type + `transformIgDmThreadToFrontend()` adapter |

### Hooks to ADD (new files):

| File | Hook | Notes |
|------|------|-------|
| `app/(mail)/mail/hooks/use-ig-dm-queries.ts` | `useIgDmThreads` | Parallel to `usePendingMails`; calls `/api/ig-dm/threads` |
| `app/(mail)/mail/hooks/use-ig-dm-queries.ts` | `useIgDmMessages` | Fetches messages for a DM thread |
| `app/(mail)/mail/hooks/use-ig-dm-queries.ts` | `igDmKeys` | Query key factory, parallel to `mailKeys` |
| `app/(mail)/mail/hooks/use-ig-dm-account.ts` | `useIgDmAccounts` | List/manage connected IG accounts |

### Hooks to MODIFY (existing files):

| File | Change |
|------|--------|
| `app/(mail)/mail/hooks/use-mail-queries.ts` | Extend `mailKeys` with `igDm` variants, or merge IG DM queries into same cache namespace |

---

## Files Audited

| File | Purpose |
|------|---------|
| `apps/webapp/app/utils/gmail-types.ts` | Frontend canonical thread/message types |
| `apps/webapp/lib/threads-adapters.ts` | Backend DTO → frontend type transformers |
| `apps/webapp/lib/backend-threads-client.ts` | Direct backend API fetch functions |
| `apps/webapp/app/(mail)/mail/hooks/use-mail-queries.ts` | TanStack Query hooks for thread data |
| `apps/webapp/lib/api/generated/schemas/gmailThreadStatus.ts` | GmailThreadStatus enum |
| `apps/webapp/lib/api/generated/schemas/gmailMessageDirection.ts` | GmailMessageDirection enum |
| `apps/webapp/lib/api/generated/schemas/threadSummary.ts` | ThreadSummary generated type |
| `apps/webapp/lib/api/generated/schemas/threadWithMessagesOutput.ts` | ThreadWithMessagesOutput generated type |
| `apps/webapp/lib/api/generated/schemas/smtpAccountResponse.ts` | SmtpAccountResponse (template for IgDmAccountResponse) |
| `apps/webapp/lib/api/generated/schemas/listThreadsApiThreadsGetParams.ts` | Thread list query params |
| `apps/webapp/lib/api/generated/schemas/campaignResponse.ts` | CampaignResponse |
| `apps/webapp/lib/api/generated/schemas/campaignCreatorResponse.ts` | CampaignCreatorResponse |
