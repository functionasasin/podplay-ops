# Meta Graph API — Conversation Endpoints Capability Analysis

**Wave**: 1 — External Landscape
**Aspect**: `meta-graph-api-conversations`
**Status**: Complete

---

## Overview

The Instagram Graph API exposes a **read-oriented conversation layer** (`/conversations`, `/messages` endpoints) that complements the real-time Send API / Messenger Platform. These two subsystems are different faces of the same underlying infrastructure:

| Subsystem | Role | Trigger Model |
|-----------|------|---------------|
| **Messenger Platform / Send API** | Send messages; receive events via webhooks | Event-driven (push) |
| **Graph API `/conversations` endpoints** | Read existing conversation history; list threads | On-demand polling (pull) |

They share the same authentication model, the same `instagram_manage_messages` permission, and the same account prerequisites — but serve different operational needs. Understanding their differences is essential for choosing an ingestion strategy for Cheerful.

---

## Account Prerequisites

The `/conversations` endpoints carry the same account prerequisites as the Messaging API:

| Requirement | Old Path (pre-July 2024) | New Path (Instagram Login, July 2024+) |
|-------------|--------------------------|----------------------------------------|
| Account type | Instagram Professional (Business or Creator) | Same |
| Facebook Page linked | **Required** — `{page-id}` is the anchor | **Not required** for some scopes; status unclear for DM endpoints (see below) |
| Facebook App type | "Business" type | Same |
| Auth token | Page Access Token | May use Instagram-specific token |

### The New Instagram Login API (July 2024) — Ambiguity for DMs

Meta launched the **Instagram API with Instagram Login** in July 2024, which allows:
- Direct Instagram OAuth without connecting a Facebook Page
- No Facebook Login requirement
- Simplified App Review (Instagram-only permissions, not Facebook + Instagram)

**Critical caveat**: The new flow is well-documented for **content publishing** (posts, stories, reels). Its support for DM/messaging endpoints is **not clearly documented** in current available sources. The `/conversations` endpoint appears to still use `page_id` as its anchor in existing documentation. Teams building on the new Instagram Login should verify explicitly whether `instagram_manage_messages` is available in the new flow before assuming they can drop the Facebook Page requirement for DM access.

---

## Endpoint Reference

### List All Conversations

```
GET /{page-id}/conversations
  ?platform=instagram
  &access_token={page_access_token}
```

**Response**:
```json
{
  "data": [
    {
      "id": "t_1234567890",
      "updated_time": "2024-10-15T12:00:00+0000"
    },
    ...
  ],
  "paging": {
    "cursors": {
      "before": "...",
      "after": "..."
    }
  }
}
```

**Key fields**:
- `id` — `conversation_id` (used to fetch messages)
- `updated_time` — last activity timestamp; sort key for detecting new conversations

### Get Conversations for a Specific User

```
GET /{page-id}/conversations
  ?platform=instagram
  &user_id={igsid}
  &access_token={page_access_token}
```

Returns the conversation(s) between the Page's Instagram account and the specified IGSID. This enables looking up a specific creator's thread by their IGSID.

### Get Messages in a Conversation

```
GET /{conversation-id}/messages
  ?fields=id,created_time,from,to,message
  &access_token={page_access_token}
```

**Response**:
```json
{
  "data": [
    {
      "id": "m_9876543210",
      "created_time": "2024-10-15T11:00:00+0000",
      "from": { "id": "123456789", "username": "creator_handle" },
      "to": { "data": [{ "id": "17841405309211844" }] },
      "message": "Hello, I'd love to collaborate"
    },
    ...
  ]
}
```

**Fields available** (not exhaustive):
- `id` — Message ID (globally unique)
- `created_time` — Message timestamp
- `from` — Sender object (IGSID or Page ID + username if available)
- `to` — Recipient(s)
- `message` — Text content (may be redacted for some message types)
- `attachments` — Media attachments (if present)

### Get a Specific Message

```
GET /{message-id}
  ?fields=id,created_time,from,to,message,attachments
  &access_token={page_access_token}
```

---

## Comparison: `/conversations` Polling vs Messaging API Webhooks

| Dimension | `/conversations` (Polling) | Messaging API (Webhooks) |
|-----------|---------------------------|--------------------------|
| **Latency** | Minutes to hours (depends on poll interval) | 1–5 seconds typical |
| **Rate cost** | Each poll consumes API quota | No cost per message — push delivery |
| **Coverage** | All historical messages, including before integration | Only messages after webhook subscription |
| **Reliability** | High — data persists on Meta's servers | At-least-once; events can be lost if webhook is down |
| **Setup complexity** | Low — simple HTTP GET calls | Higher — endpoint must be HTTPS, verified, subscribed |
| **Real-time** | No | Yes |
| **Best use** | Initial sync, historical backfill, recovery | Primary ingestion path |

**Meta's explicit recommendation**: Do NOT use polling as a primary ingestion strategy. Use webhooks for real-time delivery and the `/conversations` endpoint only for:
1. **Historical sync** — loading past messages when a user first connects their account
2. **Recovery/backfill** — catching missed events after a webhook outage
3. **Verification** — confirming what was actually received vs. what webhooks delivered

---

## Rate Limits on the `/conversations` Endpoint

The `/conversations` and `/messages` endpoints are subject to **Business Use Case (BUC) rate limits**, not the separate Send API limits:

| Limit Type | Value | Notes |
|------------|-------|-------|
| BUC limits | Unique per (app, user) pair | Not publicly quantified; enforced dynamically |
| General Graph API | ~200 calls / hour typical default | Applies to all Graph endpoints |
| Messaging-specific limits | 200 DMs/hour | For Send API; separate from read quotas |

**Practical implications for polling**:
- Polling 100 accounts every minute = 6,000 calls/hour — almost certainly rate-limited
- Polling 100 accounts every 5 minutes = 1,200 calls/hour — borderline
- Polling 10 accounts every 5 minutes = 120 calls/hour — likely acceptable

For Cheerful's use case (supporting multiple brand accounts), polling-as-primary is not a viable architecture at scale.

---

## Data Access Constraints

### 30-Day Inactivity Cutoff (Requests Folder)

When a DM sender is not followed by the Instagram account, their message lands in the **"Requests" folder**. If such a conversation remains **inactive for more than 30 days**, it becomes **inaccessible via the Graph API**. This is a hard constraint with no workaround.

**Impact for Cheerful**: Creators who DM a brand account for the first time (non-followers) and don't receive a response within 30 days will have their messages inaccessible via API. For an inbound-capture use case, this is low risk as long as the system processes incoming messages promptly.

### No Folder Differentiation

The API does **not** expose whether a conversation is in the "Primary" inbox or "General" inbox folder. All conversations are returned together, without folder metadata.

### Message Content Limitations

Some message types return **incomplete or redacted content** via the conversations endpoint:
- Standard text messages: full content accessible
- Media attachments: metadata (type, URL) accessible but URLs may expire
- Voice messages, Reels shares, GIPHYs: may appear as unsupported types

### Conversation Scope

The `/conversations` endpoint only returns conversations involving the **authenticated Instagram account**. You cannot read conversations between two other users (no third-party read access).

---

## Deprecation Status

The `/conversations` and `/{conversation-id}/messages` endpoints are **not deprecated** as of early 2026. What *has* been deprecated:

| Deprecated | Date | Replacement |
|------------|------|-------------|
| Instagram Basic Display API | December 4, 2024 | Instagram Graph API / Instagram Login |
| Messaging Events API (v21+) | September 2025 | Conversion API (different use case — ad measurement) |
| Graph API v15 | November 20, 2024 | Use v16+ |
| Graph API v16 | May 14, 2025 | Use v17+ |
| Several Insights metrics | January 8, 2025 | No direct replacement for some |

**The Messaging Events API deprecation** is often misread as "messaging is deprecated." It is not. The Messaging Events API was specifically for **ad conversion events** (e.g., "user clicked an ad and then sent a DM"). The DM read/send APIs remain active.

---

## Facebook Page Relationship

The legacy architecture requires:
```
Instagram Professional Account
       ↓ (linked)
   Facebook Page
       ↓ (used as)
    page_id  → GET /{page-id}/conversations?platform=instagram
```

This means:
1. Every Cheerful customer who wants DM integration must have their Instagram linked to a Facebook Page
2. Cheerful's OAuth flow must request a **Page Access Token** (not just a User Access Token)
3. The user must grant Cheerful permission to their connected Page (not just their Instagram account directly)

The **July 2024 Instagram Login API** may relax this in some contexts, but DM-specific endpoints may still require the Page linkage. This is an architectural risk — if Cheerful builds on the assumption that the new Instagram Login removes the Facebook Page requirement for DMs, and Meta later clarifies it does not (or vice versa), the integration may need rework.

**Safe assumption**: Design for Facebook Page requirement; test whether Instagram Login API supports DM endpoints when implementing.

---

## Role in a Cheerful Integration

The `/conversations` endpoint is not a primary integration path — it is a supporting tool:

### Use Case 1: Initial Account Sync

When a Cheerful customer first connects their Instagram account:
1. Call `GET /{page-id}/conversations?platform=instagram` to list all conversations
2. For each conversation, call `GET /{conversation-id}/messages` to load history
3. Match each sender IGSID against existing creator records
4. Ingest into `ig_dm_thread` / `ig_dm_message` tables

This gives Cheerful historical context on existing conversations before webhooks start delivering real-time events.

### Use Case 2: Webhook Recovery

If Cheerful's webhook endpoint is down for a period:
1. On restart, query `GET /{page-id}/conversations` filtered by `updated_time > last_processed_time`
2. Fetch messages for any conversations updated during the outage
3. Deduplicate by `message.id` against already-processed messages

This prevents event loss from webhook downtime.

### Use Case 3: Thread Reconciliation

Periodically verify webhook delivery by comparing:
- Messages received via webhooks
- Messages returned by `GET /{conversation-id}/messages`

Identify any gaps (missed deliveries) and backfill as needed.

---

## Capability Matrix

| Capability | Available via `/conversations` | Notes |
|-----------|-------------------------------|-------|
| List all conversations | ✅ | Paginated, sortable by `updated_time` |
| Filter by user (IGSID) | ✅ | `user_id` param |
| Read message history | ✅ | Per conversation, paginated |
| Read message text | ✅ | Full content for standard messages |
| Read media metadata | ✅ (partial) | URLs may expire |
| Real-time notifications | ❌ | Polling only; use webhooks |
| Send messages | ❌ | Send API only |
| Read "Requests" folder status | ❌ | Not exposed |
| Read inbox folder (Primary/General) | ❌ | Not differentiated |
| Read deleted messages | ❌ | Once deleted, inaccessible |
| Access 30d+ inactive request conversations | ❌ | Hard cutoff |
| Pagination | ✅ | Cursor-based |

---

## Constraints & Limitations for Cheerful

1. **Not a viable real-time inbound path**: Polling latency (minutes at best, given rate limits) is unacceptable for inbound DM capture at production scale. This endpoint supports a webhooks-first architecture, not a polling-first one.

2. **Rate limit pressure at scale**: Supporting 50+ connected Instagram accounts with reasonable poll intervals will exceed Graph API rate limits. Each account requires its own poll cycle with its own tokens.

3. **Facebook Page ambiguity with new Instagram Login**: The new (July 2024) Instagram Login simplification may or may not apply to DM endpoints — unclear from current documentation. Requires direct testing.

4. **Historical sync is bounded**: On initial sync, conversations inactive for 30+ days (in Requests) are inaccessible. Cannot recover all DM history.

5. **Same permission requirements**: Requires `instagram_manage_messages` at Advanced Access level, same as the Messenger Platform approach. No reduced barrier for read-only access.

---

## Effort Estimate

| Task | Effort | Notes |
|------|--------|-------|
| Implement initial account sync via `/conversations` | Small–Medium | Straightforward pagination; one-time per account connection |
| Implement webhook recovery via `/conversations` | Small | Query by `updated_time`, deduplicate by message ID |
| Implement polling-as-primary (not recommended) | Large | Rate limit management, scheduler, dedup — not worth it |

---

## Summary

The Graph API `/conversations` endpoint is a **complementary read layer** to the Messenger Platform webhook system, not an alternative to it. For Cheerful:

- **Do not** use it as the primary DM ingestion path (rate limits, latency, complexity)
- **Do** use it for initial historical sync when an account is first connected
- **Do** use it for recovery/backfill after webhook outages
- The Facebook Page requirement ambiguity (vs. new Instagram Login) must be resolved before finalizing the auth architecture
- All permissions and approval requirements are identical to the Messenger Platform approach — there is no simpler access path for read-only DM data

---

## References

- Meta Graph API v21.0 release (October 2024), via PPC Land
- Instagram Basic Display API EOL, December 2024, via multiple sources
- Messaging Events API deprecation (v21+), September 2025
- [Getting All Instagram Conversations via Facebook Graph API](https://medium.com/@ritikkhndelwal/getting-all-the-instagram-conversations-and-messages-using-facebook-graph-api-3993fde3d6a) — Medium tutorial (2023)
- [Instagram API with Instagram Login launch](https://web.swipeinsight.app/posts/new-instagram-api-with-instagram-login-9186) — Swipe Insight (July 2024)
- [Postly: Instagram Direct Access Without Facebook](https://blog.postly.ai/instagrams-new-api-allows-direct-access-without-facebook-revolutionizing-social-media-integration-for-tools-like-postly/)
- [Elfsight: Instagram Graph API Developer Guide 2026](https://elfsight.com/blog/instagram-graph-api-complete-developer-guide-for-2026/)
- [CreatorFlow: Instagram API Rate Limits Explained](https://creatorflow.so/blog/instagram-api-rate-limits-explained/)
- [Instagram API Rate Limits and Setup Tips](https://www.interakt.shop/instagram-automation/api-limitations-setup-tips/)
