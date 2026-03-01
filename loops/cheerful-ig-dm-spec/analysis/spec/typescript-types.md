# Spec: TypeScript Types — Instagram DM Support

**Aspect**: `spec-typescript-types`
**Wave**: 2 — Schema & Interface Design
**Date**: 2026-03-01
**Input files**:
- `analysis/audit/frontend-types.md` — exact current TypeScript types, adapter layer, TanStack hooks
- `analysis/audit/frontend-components.md` — component props, hardcoded email elements, DM mount points
- `analysis/spec/pydantic-models.md` — backend shapes driving frontend DTO types
- `../cheerful-ig-dm-reverse/analysis/current-inbox-ui.md` — inbox architecture reference

---

## Files

### New Files

| Action | Path |
|--------|------|
| CREATE | `apps/webapp/app/utils/ig-dm-types.ts` |
| CREATE | `apps/webapp/lib/ig-dm-adapters.ts` |
| CREATE | `apps/webapp/lib/ig-dm-api-client.ts` |
| CREATE | `apps/webapp/app/(mail)/mail/hooks/use-ig-dm-queries.ts` |
| CREATE | `apps/webapp/app/(mail)/mail/hooks/use-ig-dm-account.ts` |

### Modified Files

| Action | Path | What Changes |
|--------|------|-------------|
| MODIFY | `apps/webapp/app/utils/gmail-types.ts` | Add `channel` field to `GmailThread`; export `Channel` type |
| MODIFY | `apps/webapp/lib/threads-adapters.ts` | Add `IgDmThreadWithMessages` backend DTO type + `transformIgDmThreadToFrontend()` transformer |

---

## Conventions Used (From Existing Codebase)

All types follow these conventions confirmed in the audit:

- **Frontend canonical types** (`app/utils/`) — `camelCase` field names (e.g. `lastMessageDate`, `senderEmail`)
- **Backend DTO types** (`lib/`) — `snake_case` field names matching FastAPI JSON output (e.g. `latest_internal_date`, `sender_email`)
- **Orval-generated types** (`lib/api/generated/schemas/`) — auto-generated from OpenAPI spec, `snake_case`
- **Nullable fields**: `field: Type | null` (not `Optional<Type>`)
- **Optional fields**: `field?: Type` for truly optional (may be absent from response)
- **Hook return type**: `UseQueryResult<T>` plus `isLoadingOrFetching: boolean` spread
- **Mutation hook return type**: `UseMutationResult<TData, Error, TVariables>`
- **Query key factory**: nested object returning `readonly` tuples via `as const`
- **API client pattern**: async function, gets Supabase session for Bearer token, calls backend URL from `process.env.NEXT_PUBLIC_BACKEND_URL`

---

## 1. `Channel` Type — New Discriminator

**File**: `apps/webapp/app/utils/gmail-types.ts`

Add at the top of the file (before `Attachment` interface):

```typescript
// Channel discriminator — identifies the messaging protocol of a thread
export type Channel = 'gmail' | 'smtp' | 'instagram_dm';
```

---

## 2. Modified `GmailThread` — Add `channel` Field

**File**: `apps/webapp/app/utils/gmail-types.ts` (lines 45–61)

Add `channel` field to the existing `GmailThread` interface:

```typescript
export interface GmailThread {
  id: string;
  subject: string;
  snippet: string;
  lastMessageDate: string;
  senderName: string;
  senderEmail: string;
  isUnread: boolean;
  labels: string[];
  messages: GmailMessage[];
  accountEmail?: string;
  campaignId?: string;
  gmail_thread_state_id?: string;
  giftingStatus?: string;
  paidPromotionStatus?: string;
  flags?: ThreadFlags;
  channel?: Channel;          // NEW — 'gmail' | 'smtp' | undefined (existing threads default to email)
}
```

**Behavior**: `channel` is optional to maintain backward compatibility with existing threads that predate this field. Components check `thread.channel === 'instagram_dm'` to branch DM-specific rendering. Absent/undefined `channel` is treated as email.

---

## 3. New: `apps/webapp/app/utils/ig-dm-types.ts`

This file is the canonical frontend type definition for all IG DM entities. Parallel to `app/utils/gmail-types.ts`.

```typescript
import type { Channel } from './gmail-types';

// ─── Attachment / Media ─────────────────────────────────────────────────────

export type IgDmMediaType = 'image' | 'video' | 'audio' | 'file' | 'story_reply';

export interface IgDmAttachment {
  mediaType: IgDmMediaType;
  storageUrl: string;             // Supabase Storage public URL (permanent)
  originalUrl: string | null;     // Meta CDN URL (may be expired; for reference only)
}

// ─── Message ────────────────────────────────────────────────────────────────

export interface IgDmMessage {
  id: string;                     // ig_dm_message.id (UUID string)
  mid: string;                    // Meta message ID (used for keying + reply threading)
  igConversationId: string;       // Meta conversation ID

  senderIgsid: string;            // Opaque IGSID of sender
  senderUsername: string | null;  // @handle; null until resolved via IGSID cache
  recipientIgsid: string;

  direction: 'inbound' | 'outbound';
  isEcho: boolean;                // true = outbound echo from Meta webhook

  bodyText: string | null;        // null for media-only messages
  messageType: IgDmMediaType | 'text' | 'unsupported';
  attachments: IgDmAttachment[];  // empty array if no media

  sentAt: string;                 // ISO8601 from Meta webhook timestamp
  receivedAt: string;             // ISO8601 when Cheerful stored this message

  replyToMid: string | null;      // MID of the message this replies to
}

// ─── Thread ─────────────────────────────────────────────────────────────────

export interface IgDmThread {
  // Thread identity
  id: string;                         // = igConversationId (used as universal thread ID by UI)
  igConversationId: string;           // Meta conversation ID
  igDmThreadStateId: string;          // Latest ig_dm_thread_state.id (UUID string)
  igDmAccountId: string;              // user_ig_dm_account.id (UUID string)
  igAccountUsername: string;          // The IG Business Account @username (from user_ig_dm_account)

  // Channel discriminator (always 'instagram_dm' for this type)
  channel: Extract<Channel, 'instagram_dm'>;

  // Thread state (same status enum as GmailThread)
  status: string;                     // GmailThreadStatus string value
  lastMessageDate: string;            // ISO8601, from latest ig_dm_message.sent_at
  latestDirection: 'inbound' | 'outbound';

  // Sender / creator identity
  senderIgsid: string;
  senderUsername: string | null;      // @handle of DM partner; null if not yet resolved
  snippet: string;                    // Truncated body_text (~150 chars) for list preview

  // Campaign association
  campaignId: string | null;

  // 24-hour messaging window
  windowExpiresAt: string | null;     // ISO8601; null if no active window
  windowIsActive: boolean;            // true iff windowExpiresAt is set AND in the future

  // Creator status (from campaign_creator, if resolved)
  giftingStatus: string | null;
  paidPromotionStatus: string | null;

  // Messages (populated when include_messages=true or in thread detail view)
  messages: IgDmMessage[];

  // AI draft (from ig_dm_llm_draft for the current ig_dm_thread_state_id)
  llmDraft: string | null;
}

// ─── Account ─────────────────────────────────────────────────────────────────

export interface IgDmAccount {
  id: string;                             // user_ig_dm_account.id (UUID string)
  instagramBusinessAccountId: string;     // Meta numeric string
  facebookPageId: string;
  igUsername: string;                     // @username of the business account
  tokenType: string;                      // 'page' | 'user'
  accessTokenExpiresAt: string;           // ISO8601

  // Webhook subscription state
  webhookSubscribed: boolean;
  webhookSubscribedAt: string | null;     // ISO8601; null if not subscribed

  // Initial sync / backfill
  initialSyncCompleted: boolean;

  // Account health
  isActive: boolean;
  lastVerifiedAt: string | null;          // ISO8601; null if never verified
  verificationError: string | null;

  createdAt: string;                      // ISO8601
}

// ─── Reply ──────────────────────────────────────────────────────────────────

export interface IgDmReplyPayload {
  igConversationId: string;
  messageText: string | null;
  mediaUrl: string | null;            // Supabase Storage URL for media (pre-uploaded)
}

export interface IgDmReplyResult {
  sentMid: string;                    // MID of the sent message (from Meta API)
  storedMessageId: string;            // ig_dm_message.id (UUID string)
}

// ─── Filter Params ───────────────────────────────────────────────────────────

export interface FetchIgDmThreadsOptions {
  statusFilter?: string;              // GmailThreadStatus value
  campaignIds?: string[];
  igDmAccountIds?: string[];
  showHidden?: boolean;
  search?: string | null;
  limit?: number;
  offset?: number;
}

// ─── Connect / Disconnect ─────────────────────────────────────────────────────

export interface IgDmConnectPayload {
  code: string;                       // Meta OAuth authorization code
  redirectUri: string;                // Must match the URI used in initiation
}
```

---

## 4. New: `apps/webapp/lib/ig-dm-adapters.ts`

Backend DTO types (snake_case) and transformer functions. Parallel to `lib/threads-adapters.ts`.

```typescript
import type { IgDmThread, IgDmMessage, IgDmAttachment, IgDmAccount } from '../app/utils/ig-dm-types';

// ─── Backend DTO Types (snake_case — match FastAPI JSON output) ──────────────

/**
 * Raw backend response for a single IG DM message.
 * Matches IgDmMessageResponse Pydantic model (src/models/api/ig_dm_message.py).
 */
export interface IgDmMessageRaw {
  id: string;
  mid: string;
  ig_conversation_id: string;
  sender_igsid: string;
  sender_username: string | null;
  recipient_igsid: string;
  direction: 'inbound' | 'outbound';
  is_echo: boolean;
  body_text: string | null;
  message_type: string;
  media_storage_paths: string[] | null;
  media_original_urls: string[] | null;
  sent_at: string;
  received_at: string;
  reply_to_mid: string | null;
}

/**
 * Raw backend response for a DM thread summary (inbox list item).
 * Matches IgDmThreadSummary Pydantic model (src/models/api/ig_dm_message.py).
 */
export interface IgDmThreadSummaryRaw {
  ig_conversation_id: string;
  ig_dm_thread_state_id: string;
  ig_dm_account_id: string;
  status: string;
  latest_message_sent_at: string;
  latest_direction: 'inbound' | 'outbound';
  snippet: string;
  sender_igsid: string;
  sender_username: string | null;
  campaign_id: string | null;
  window_expires_at: string | null;
  gifting_status: string | null;
  paid_promotion_status: string | null;
}

/**
 * Raw backend response for a DM thread with all messages.
 * Matches IgDmThreadView Pydantic model (src/models/api/ig_dm_message.py).
 */
export interface IgDmThreadViewRaw {
  ig_conversation_id: string;
  ig_dm_thread_state_id: string;
  ig_dm_account_id: string;
  ig_username: string;
  status: string;
  latest_message_sent_at: string;
  latest_direction: 'inbound' | 'outbound';
  snippet: string;
  sender_igsid: string;
  sender_username: string | null;
  campaign_id: string | null;
  window_expires_at: string | null;
  window_is_active: boolean;
  messages: IgDmMessageRaw[];
  llm_draft: string | null;
  gifting_status: string | null;
  paid_promotion_status: string | null;
}

/**
 * Raw backend response for a connected IG DM account.
 * Matches IgDmAccountResponse Pydantic model (src/models/api/ig_dm_account.py).
 */
export interface IgDmAccountRaw {
  id: string;
  instagram_business_account_id: string;
  facebook_page_id: string;
  ig_username: string;
  token_type: string;
  access_token_expires_at: string;
  webhook_subscribed: boolean;
  webhook_subscribed_at: string | null;
  initial_sync_completed: boolean;
  is_active: boolean;
  last_verified_at: string | null;
  verification_error: string | null;
  created_at: string;
}

// ─── Transformers ────────────────────────────────────────────────────────────

/**
 * Transform a raw IgDmMessageRaw (snake_case) to IgDmMessage (camelCase).
 *
 * Converts media_storage_paths + media_original_urls arrays into
 * IgDmAttachment[] array (one entry per media item).
 * Behavior: zip storage_paths and original_urls; missing original URL defaults to null.
 */
export function transformIgDmMessage(raw: IgDmMessageRaw): IgDmMessage;

/**
 * Transform an IgDmThreadViewRaw (full thread with messages) to IgDmThread.
 *
 * Used for the thread detail view (right panel in MailDisplay).
 * Sets channel = 'instagram_dm' and id = ig_conversation_id.
 * Maps messages array via transformIgDmMessage().
 */
export function transformIgDmThreadView(raw: IgDmThreadViewRaw): IgDmThread;

/**
 * Transform an IgDmThreadSummaryRaw (inbox list item) to IgDmThread.
 *
 * Used for the thread list view (left panel in MailList).
 * messages is set to [] (not fetched in list view).
 * llmDraft is set to null (not fetched in list view).
 * Sets channel = 'instagram_dm' and id = ig_conversation_id.
 */
export function transformIgDmThreadSummary(raw: IgDmThreadSummaryRaw): IgDmThread;

/**
 * Transform an IgDmAccountRaw (snake_case) to IgDmAccount (camelCase).
 */
export function transformIgDmAccount(raw: IgDmAccountRaw): IgDmAccount;
```

---

## 5. New: `apps/webapp/lib/ig-dm-api-client.ts`

Direct backend API client functions for IG DM endpoints. Parallel to `lib/backend-threads-client.ts`.

Each function:
1. Gets the current Supabase session via `createClientComponentClient()`
2. Attaches `Authorization: Bearer {session.access_token}` header
3. Calls `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ig-dm/...`
4. Returns parsed JSON (typed) or throws on non-2xx

```typescript
import type { IgDmThreadSummaryRaw, IgDmThreadViewRaw, IgDmAccountRaw } from './ig-dm-adapters';
import type { FetchIgDmThreadsOptions, IgDmConnectPayload } from '../app/utils/ig-dm-types';

/**
 * List IG DM thread summaries for the current user.
 *
 * Calls: GET /api/ig-dm/threads
 * Query params: status_filter, campaign_ids[], ig_dm_account_ids[], show_hidden, search, limit, offset
 * Returns: IgDmThreadSummaryRaw[]
 */
export async function fetchIgDmThreads(
  options?: FetchIgDmThreadsOptions
): Promise<IgDmThreadSummaryRaw[]>;

/**
 * Fetch all messages for a specific DM thread (full thread view).
 *
 * Calls: GET /api/ig-dm/threads/{igConversationId}/messages
 * Returns: IgDmThreadViewRaw
 */
export async function fetchIgDmThreadMessages(
  igConversationId: string
): Promise<IgDmThreadViewRaw>;

/**
 * Send a DM reply to a thread.
 *
 * Calls: POST /api/ig-dm/threads/{igConversationId}/reply
 * Body: { message_text: string | null, media_url: string | null }
 * Returns: { sent_mid: string, stored_message_id: string }
 * Throws: error with message "DM window expired" if 24h window has closed
 */
export async function sendIgDmReply(
  igConversationId: string,
  payload: { messageText: string | null; mediaUrl: string | null }
): Promise<{ sentMid: string; storedMessageId: string }>;

/**
 * List all connected Instagram DM accounts for the current user.
 *
 * Calls: GET /api/ig-dm/accounts
 * Returns: IgDmAccountRaw[]
 */
export async function fetchIgDmAccounts(): Promise<IgDmAccountRaw[]>;

/**
 * Complete the Meta OAuth flow and connect a new Instagram account.
 *
 * Calls: POST /api/ig-dm/accounts
 * Body: { code: string, redirect_uri: string }
 * Returns: IgDmAccountRaw (the newly connected account)
 */
export async function connectIgDmAccount(
  payload: IgDmConnectPayload
): Promise<IgDmAccountRaw>;

/**
 * Disconnect (deactivate) a connected Instagram account.
 *
 * Calls: DELETE /api/ig-dm/accounts/{accountId}
 * Returns: void on success
 */
export async function disconnectIgDmAccount(accountId: string): Promise<void>;
```

---

## 6. New: `apps/webapp/app/(mail)/mail/hooks/use-ig-dm-queries.ts`

TanStack Query hooks for IG DM thread data. Parallel to `use-mail-queries.ts`.

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import type { IgDmThread } from '../../../../utils/ig-dm-types';
import type { IgDmReplyPayload, IgDmReplyResult } from '../../../../utils/ig-dm-types';

// ─── Query Key Factory ───────────────────────────────────────────────────────

/**
 * Query key factory for IG DM data. Parallel to `mailKeys` in use-mail-queries.ts.
 *
 * Keys are structured to allow targeted invalidation:
 * - igDmKeys.all — invalidate all IG DM data
 * - igDmKeys.threads(accountId) — invalidate thread list for an account
 * - igDmKeys.thread(conversationId) — invalidate a single thread detail
 * - igDmKeys.accounts — invalidate account list
 */
export const igDmKeys = {
  all: ['igDm'] as const,
  threads: (accountId: string, campaignIds?: string[], search?: string) =>
    [...igDmKeys.all, 'threads', accountId, { campaignIds, search }] as const,
  thread: (conversationId: string) =>
    [...igDmKeys.all, 'thread', conversationId] as const,
  accounts: () =>
    [...igDmKeys.all, 'accounts'] as const,
};

// ─── Thread List Hooks ────────────────────────────────────────────────────────

/**
 * Fetch IG DM threads with WAITING_FOR_DRAFT_REVIEW status (pending approval).
 *
 * Parallel to `usePendingMails` in use-mail-queries.ts.
 * staleTime: 30_000ms
 * Returns IgDmThread[] with messages=[] (list view; no message detail).
 */
export function useIgDmPendingThreads(
  accountId: string | null,
  enabled?: boolean,
  campaignIds?: string[],
  search?: string
): UseQueryResult<IgDmThread[]> & { isLoadingOrFetching: boolean };

/**
 * Fetch IG DM threads with outbound latest direction (sent view).
 *
 * Parallel to `useSentMails` in use-mail-queries.ts.
 * staleTime: 30_000ms
 */
export function useIgDmSentThreads(
  accountId: string | null,
  enabled?: boolean,
  campaignIds?: string[],
  search?: string
): UseQueryResult<IgDmThread[]> & { isLoadingOrFetching: boolean };

/**
 * Fetch IG DM threads with IGNORE status (ignored/hidden view).
 *
 * Parallel to `useIgnoredMails` in use-mail-queries.ts.
 * staleTime: 30_000ms
 */
export function useIgDmIgnoredThreads(
  accountId: string | null,
  enabled?: boolean,
  campaignIds?: string[],
  search?: string
): UseQueryResult<IgDmThread[]> & { isLoadingOrFetching: boolean };

// ─── Thread Detail Hook ───────────────────────────────────────────────────────

/**
 * Fetch the full message history for a specific DM thread.
 *
 * Calls fetchIgDmThreadMessages(conversationId) — returns IgDmThread with
 * all messages populated and llmDraft included.
 * Enabled only when conversationId is non-null.
 * staleTime: 15_000ms (messages are more volatile than thread summaries)
 */
export function useIgDmThread(
  conversationId: string | null,
  enabled?: boolean
): UseQueryResult<IgDmThread>;

// ─── Reply Mutation Hook ──────────────────────────────────────────────────────

/**
 * Send a DM reply to a thread.
 *
 * On success: invalidates igDmKeys.thread(conversationId) and igDmKeys.threads(...)
 * to refresh thread list and detail view.
 * On 24h window expiry: returns error with `windowExpired: true` flag for UI
 * to show the "DM window closed" state.
 *
 * Variables type: { igConversationId: string; messageText: string | null; mediaUrl: string | null }
 * Data type: { sentMid: string; storedMessageId: string }
 */
export function useSendIgDmReply(): UseMutationResult<
  { sentMid: string; storedMessageId: string },
  Error & { windowExpired?: boolean },
  { igConversationId: string; messageText: string | null; mediaUrl: string | null }
>;
```

---

## 7. New: `apps/webapp/app/(mail)/mail/hooks/use-ig-dm-account.ts`

Hook for managing connected Instagram DM accounts. Parallel to `use-gmail-accounts.ts`.

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import type { IgDmAccount, IgDmConnectPayload } from '../../../../utils/ig-dm-types';
import { igDmKeys } from './use-ig-dm-queries';

/**
 * List all connected Instagram DM accounts for the current user.
 *
 * Calls fetchIgDmAccounts(). Enabled by default.
 * staleTime: 60_000ms (account data is slow-changing)
 */
export function useIgDmAccounts(
  enabled?: boolean
): UseQueryResult<IgDmAccount[]>;

/**
 * Connect a new Instagram DM account via Meta OAuth callback.
 *
 * Calls connectIgDmAccount(payload).
 * On success: invalidates igDmKeys.accounts() to refresh account list.
 *
 * Variables type: IgDmConnectPayload
 * Data type: IgDmAccount
 */
export function useConnectIgDmAccount(): UseMutationResult<
  IgDmAccount,
  Error,
  IgDmConnectPayload
>;

/**
 * Disconnect (deactivate) a connected Instagram DM account.
 *
 * Calls disconnectIgDmAccount(accountId).
 * On success: invalidates igDmKeys.accounts() and igDmKeys.threads(accountId)
 * to clear all DM thread data for the disconnected account.
 *
 * Variables type: string (accountId)
 * Data type: void
 */
export function useDisconnectIgDmAccount(): UseMutationResult<
  void,
  Error,
  string
>;
```

---

## 8. Modified: `apps/webapp/lib/threads-adapters.ts`

Add the `IgDmThreadWithMessages` DTO type and transformer. These are added to the existing file alongside the existing `ThreadWithMessages` / `GmailThread` adapters.

**New export at end of file** (after existing transformer functions):

```typescript
// ─── IG DM Adapters (added for Instagram DM support) ─────────────────────────

export {
  IgDmMessageRaw,
  IgDmThreadSummaryRaw,
  IgDmThreadViewRaw,
  IgDmAccountRaw,
  transformIgDmMessage,
  transformIgDmThreadView,
  transformIgDmThreadSummary,
  transformIgDmAccount,
} from './ig-dm-adapters';
```

**Note**: The actual types and transformer implementations live in `lib/ig-dm-adapters.ts` (section 4 above). `threads-adapters.ts` re-exports them for consumers that import from the existing adapter location. This minimizes import churn in existing components.

---

## 9. Orval-Generated Type: `igDmAccountResponse.ts`

**File**: `apps/webapp/lib/api/generated/schemas/igDmAccountResponse.ts`
**Note**: This file is generated by orval from the FastAPI OpenAPI spec. It will be auto-generated when the backend adds the IG DM routes and `orval` is run. The spec below documents the expected output so that frontend code can be written before the backend is complete.

```typescript
// AUTO-GENERATED by orval — do not edit manually
// Regenerate with: npm run generate-api (or pnpm run generate-api)

export interface IgDmAccountResponse {
  id: string;
  instagram_business_account_id: string;
  facebook_page_id: string;
  ig_username: string;
  token_type: string;
  access_token_expires_at: string;
  webhook_subscribed: boolean;
  webhook_subscribed_at: string | null;
  initial_sync_completed: boolean;
  is_active: boolean;
  last_verified_at: string | null;
  verification_error: string | null;
  created_at: string;
}
```

**Parallel to**: `lib/api/generated/schemas/smtpAccountResponse.ts`

---

## 10. Discriminated Union: `Thread`

**File**: `apps/webapp/app/utils/ig-dm-types.ts` (append to bottom)

```typescript
import type { GmailThread } from './gmail-types';

/**
 * Universal thread type for the inbox UI.
 *
 * Use `thread.channel === 'instagram_dm'` to narrow to IgDmThread.
 * Use `thread.channel === 'gmail' || thread.channel === 'smtp' || !thread.channel`
 * to narrow to GmailThread (email).
 *
 * Example narrowing:
 *   if (isIgDmThread(thread)) {
 *     // thread is IgDmThread here
 *   }
 */
export type Thread = GmailThread | IgDmThread;

/**
 * Type guard to narrow a Thread to IgDmThread.
 */
export function isIgDmThread(thread: Thread): thread is IgDmThread;

/**
 * Type guard to narrow a Thread to GmailThread (email).
 */
export function isEmailThread(thread: Thread): thread is GmailThread;
```

**Note**: `isIgDmThread` and `isEmailThread` are the only functions in this types file. Their implementations are trivial (one-line `channel` checks) and are placed here (not in a utils file) so that all channel-based narrowing is co-located with the type definition.

---

## 11. Summary Table: All New TypeScript Types

### New Frontend Canonical Types (`camelCase`)

| Type/Interface | File | Parallel to |
|----------------|------|-------------|
| `Channel` | `app/utils/gmail-types.ts` | — (new discriminator) |
| `IgDmMediaType` | `app/utils/ig-dm-types.ts` | — |
| `IgDmAttachment` | `app/utils/ig-dm-types.ts` | `Attachment` |
| `IgDmMessage` | `app/utils/ig-dm-types.ts` | `GmailMessage` |
| `IgDmThread` | `app/utils/ig-dm-types.ts` | `GmailThread` |
| `IgDmAccount` | `app/utils/ig-dm-types.ts` | `GmailAccount` (from use-gmail-accounts.ts) |
| `IgDmReplyPayload` | `app/utils/ig-dm-types.ts` | — |
| `IgDmReplyResult` | `app/utils/ig-dm-types.ts` | — |
| `FetchIgDmThreadsOptions` | `app/utils/ig-dm-types.ts` | `FetchThreadsOptions` |
| `IgDmConnectPayload` | `app/utils/ig-dm-types.ts` | — |
| `Thread` | `app/utils/ig-dm-types.ts` | — (discriminated union) |

### New Backend DTO Types (`snake_case`)

| Type/Interface | File | Parallel to |
|----------------|------|-------------|
| `IgDmMessageRaw` | `lib/ig-dm-adapters.ts` | `MessageInThread` |
| `IgDmThreadSummaryRaw` | `lib/ig-dm-adapters.ts` | `ThreadSummary` (generated) |
| `IgDmThreadViewRaw` | `lib/ig-dm-adapters.ts` | `ThreadWithMessages` |
| `IgDmAccountRaw` | `lib/ig-dm-adapters.ts` | `SmtpAccountResponse` (generated) |

### New Transformer Functions

| Function | File | Parallel to |
|----------|------|-------------|
| `transformIgDmMessage` | `lib/ig-dm-adapters.ts` | (no direct parallel) |
| `transformIgDmThreadView` | `lib/ig-dm-adapters.ts` | `transformThreadWithMessagesToGmailThread` |
| `transformIgDmThreadSummary` | `lib/ig-dm-adapters.ts` | `transformThreadSummaryToGmailThread` |
| `transformIgDmAccount` | `lib/ig-dm-adapters.ts` | — |

### New API Client Functions

| Function | File | Endpoint |
|----------|------|----------|
| `fetchIgDmThreads` | `lib/ig-dm-api-client.ts` | GET /api/ig-dm/threads |
| `fetchIgDmThreadMessages` | `lib/ig-dm-api-client.ts` | GET /api/ig-dm/threads/{id}/messages |
| `sendIgDmReply` | `lib/ig-dm-api-client.ts` | POST /api/ig-dm/threads/{id}/reply |
| `fetchIgDmAccounts` | `lib/ig-dm-api-client.ts` | GET /api/ig-dm/accounts |
| `connectIgDmAccount` | `lib/ig-dm-api-client.ts` | POST /api/ig-dm/accounts |
| `disconnectIgDmAccount` | `lib/ig-dm-api-client.ts` | DELETE /api/ig-dm/accounts/{id} |

### New TanStack Query Hooks

| Hook | File | Parallel to |
|------|------|-------------|
| `igDmKeys` | `hooks/use-ig-dm-queries.ts` | `mailKeys` |
| `useIgDmPendingThreads` | `hooks/use-ig-dm-queries.ts` | `usePendingMails` |
| `useIgDmSentThreads` | `hooks/use-ig-dm-queries.ts` | `useSentMails` |
| `useIgDmIgnoredThreads` | `hooks/use-ig-dm-queries.ts` | `useIgnoredMails` |
| `useIgDmThread` | `hooks/use-ig-dm-queries.ts` | (single thread detail) |
| `useSendIgDmReply` | `hooks/use-ig-dm-queries.ts` | `useEmailSend` (mutation) |
| `useIgDmAccounts` | `hooks/use-ig-dm-account.ts` | `useGmailAccounts` |
| `useConnectIgDmAccount` | `hooks/use-ig-dm-account.ts` | — |
| `useDisconnectIgDmAccount` | `hooks/use-ig-dm-account.ts` | — |

### Modified Types

| Type | File | Change |
|------|------|--------|
| `GmailThread` | `app/utils/gmail-types.ts` | Add `channel?: Channel` field |
| `Channel` | `app/utils/gmail-types.ts` | New export (`'gmail' \| 'smtp' \| 'instagram_dm'`) |

---

## 12. Design Decisions

### Decision 1: `channel` added to `GmailThread` (not a new union at GmailThread level)

**Options considered**:
- **A**: Add `channel` to `GmailThread` + create `IgDmThread` as separate interface + `Thread = GmailThread | IgDmThread` union ← **chosen**
- **B**: Create `BaseThread` parent interface, `GmailThread` and `IgDmThread` both extend it
- **C**: Single `Thread` interface with all fields optional (channel determines which are set)

**Rationale for A**:
- Minimal disruption to existing consumers of `GmailThread` — adding one optional field doesn't break anything
- `IgDmThread` is cleanly shaped for DM (no `subject`, no `senderEmail`, adds `windowExpiresAt`)
- `Thread` union allows discriminated narrowing in components via `isIgDmThread()` type guard
- Adding a `BaseThread` parent would require retrofitting all existing usages

### Decision 2: `channel` is optional on `GmailThread` (`channel?: Channel`)

**Rationale**: Existing email threads in the system do not have a `channel` field. Making it optional (`?`) ensures that:
- Existing `ThreadSummary[]` / `ThreadWithMessages[]` responses without `channel` are still assignable to `GmailThread`
- UI components check `thread.channel === 'instagram_dm'` (explicit equality) rather than truthiness
- No migration of existing data needed

### Decision 3: New `ig-dm-adapters.ts` file (not extending `threads-adapters.ts`)

**Rationale**: `threads-adapters.ts` is already 143+ lines handling Gmail/SMTP transformers. Adding IG DM types and transformers inline would make it unwieldy. The re-export from `threads-adapters.ts` (Section 8) provides backward compatibility for any future consumer that imports from the legacy location.

### Decision 4: `id` on `IgDmThread` = `igConversationId`

**Rationale**: The inbox UI uses `thread.id` as the universal thread key (URL param, TanStack Query key, Zustand selected mail state). For IG DM threads, `igConversationId` serves this role (the Meta conversation ID). Setting `id = igConversationId` lets all existing `thread.id`-based logic work without change.

### Decision 5: `useIgDmPendingThreads` / `Sent` / `Ignored` (separate hooks, not merged into existing `usePendingMails`)

**Rationale**:
- Avoids modifying existing email hooks (no risk of breaking email flow)
- `Mail` component prop types currently take `mails: GmailThread[]` — adding `igDmThreads: IgDmThread[]` as a separate prop lets the component merge + sort them internally
- Each hook has its own query key namespace (`igDm.*`) for targeted cache invalidation
- Future: if a unified `useAllThreads` hook is desired, it can compose these two

### Decision 6: `Thread = GmailThread | IgDmThread` defined in `ig-dm-types.ts` (not `gmail-types.ts`)

**Rationale**: `gmail-types.ts` is email-specific. The union type lives in `ig-dm-types.ts` which imports `GmailThread`. This keeps the email-only file stable and lets IG DM code import the union from its own module.
