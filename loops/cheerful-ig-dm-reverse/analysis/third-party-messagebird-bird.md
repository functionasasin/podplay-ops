# Bird (formerly MessageBird) as Instagram DM Relay — Assessment

**Wave**: 1 — External Landscape
**Aspect**: `third-party-messagebird-bird`
**Status**: Complete

---

## Overview

Bird (rebranded from MessageBird in 2023) is a developer-first omnichannel communications platform that provides a unified API for messaging across WhatsApp, Instagram, Facebook Messenger, SMS, Email, LINE, Telegram, and others. Unlike ManyChat (a no-code chatbot builder), Bird is an **API-first middleware layer** — it sits between the raw Meta APIs and Cheerful's backend, handling the webhook subscription, Instagram Business account management, and message routing behind a cleaner unified interface.

The core question for Cheerful: **Can Bird act as a relay — receiving Instagram DMs from creators and forwarding them to Cheerful via webhooks, while also allowing Cheerful to send DM replies?**

The answer is: **yes, and more completely than ManyChat**. Bird provides real-time webhook delivery of all inbound messages (not just flow-matched ones), proper message content and sender identity, bidirectional send/receive, and an API that maps cleanly to Cheerful's event-sourced architecture. The trade-offs are per-message cost, a vendor dependency layer, and the same underlying Instagram platform constraints (24-hour window, business account requirement).

---

## How Bird Connects to Instagram

Bird is a Meta Business Partner and has completed its own Meta App Review for Instagram messaging access. The connection flow:

1. **Business registers with Bird** — create a Bird account, get API credentials
2. **Connect Instagram Business/Creator account** — through Bird's dashboard (Channel setup flow), which triggers a Meta OAuth connecting the Instagram Professional account to a Facebook Page and then to Bird's Meta App
3. **Bird receives Meta webhooks** — Bird's infrastructure subscribes to the Instagram messaging webhooks on behalf of your channel; inbound DMs flow into Bird's platform
4. **Bird forwards to Cheerful** — via Bird's Channels API webhooks, configured to push to Cheerful's endpoint URL

This means Cheerful does **not** need its own Meta App Review for the Instagram Messaging API. Bird handles that layer. However, Cheerful still needs a Bird account (and incurs per-message costs).

---

## API Architecture: Two Layers

Bird offers two API layers relevant to this use case:

### 1. Channels API (Newer, Recommended)

The modern Bird API. Provides:
- `POST /channels/{channelId}/messages` — send a message on a specific channel
- Webhook subscriptions on the Bird workspace level receiving all inbound events
- Supports channel-specific webhooks (max 10) and generic workspace webhooks (max 5)
- Unified event structure across all channels with channel-specific type hints

**Inbound webhook event** (Instagram DM received):
```json
{
  "type": "instagram.inbound",
  "channelId": "...",
  "contact": {
    "id": "...",
    "identifierValue": "instagram_scoped_user_id",
    "displayName": "Creator Name"
  },
  "message": {
    "id": "bird_message_id",
    "body": {
      "type": "text",
      "text": { "text": "Hey thanks for reaching out!" }
    },
    "status": "delivered",
    "createdAt": "2025-02-28T12:00:00Z"
  },
  "conversation": {
    "id": "bird_conversation_id"
  }
}
```

**Outbound send** (Cheerful → creator reply):
```http
POST https://api.bird.com/workspaces/{workspaceId}/channels/{channelId}/messages
Authorization: AccessKey {api_key}
Content-Type: application/json

{
  "receiver": {
    "contacts": [{ "identifierValue": "instagram_scoped_user_id" }]
  },
  "body": {
    "type": "text",
    "text": { "text": "Thanks for your response! We'd love to collaborate..." }
  }
}
```

### 2. Conversations API (MessageBird-era, Legacy Path)

The older API, still functional. Provides a unified conversation thread model:
- `GET /v1/conversations` — list all conversations
- `GET /v1/conversations/{id}/messages` — get message history for a conversation
- `POST /conversations/start` — start new conversation
- `POST /v1/conversations/{id}/messages` — send reply

This API explicitly models conversations as thread objects, which aligns well with Cheerful's thread model. However, Bird is migrating customers toward the Channels API.

**Authentication**: `Authorization: AccessKey {accessKey}` header for both APIs.

---

## Capability Matrix

| Capability | Available | Notes |
|------------|-----------|-------|
| Receive all inbound DMs (real-time) | ✅ | Via Bird webhook subscription; fires for every message |
| Forward full message content to Cheerful | ✅ | Full text body in webhook payload |
| Forward sender identity (Instagram user) | ✅ | Contact object with `identifierValue` (IGSID-equivalent) |
| Forward Instagram Scoped User ID (IGSID) | ✅ | Via `identifierValue` in contact object |
| Thread/conversation ID | ✅ | Bird assigns `conversation.id` per thread |
| Message ID (deduplication) | ✅ | Bird `message.id` |
| Message history (read historical DMs) | ✅ | Via Conversations API `GET /messages` |
| Story reply DMs | ✅ | Captured as standard inbound messages |
| Comments channel | ✅ | Separate channel type from DMs |
| Mentions channel | ✅ | Separate channel type |
| Rich message types (image, file) | ✅ | Text, Image, File, List, Carousel, Reply actions |
| Emoji reactions | ✅ | Interaction events (`user has reacted with emoji`) |
| Read receipts / delivery status | ✅ | `sent`, `delivered`, `read`, `failed` lifecycle |
| Reply via API (send DM back) | ✅ | Via Channels API `POST /messages` |
| Real-time webhook delivery | ✅ | HTTP POST to configured endpoint |
| Webhook signing / verification | ✅ | Authorization header with signing key |
| Multi-account (multiple creators) | ✅ | Each creator is a separate channel in Bird workspace |

---

## Instagram-Specific Constraints (Still Apply via Bird)

Bird abstracts the Meta API complexity but **cannot bypass Meta's platform rules**:

### 24-Hour Messaging Window
- After a creator sends an inbound DM, a 24-hour window opens where Cheerful can send unlimited reply messages
- Every creator reply resets the clock
- **After 24 hours of inactivity, outbound messages are blocked** at the Meta level
- Exception: "Human Agent" tag extends window to **7 days** from last user message
- No template message workaround exists for Instagram (unlike WhatsApp)
- **Impact for Cheerful**: If a creator doesn't respond quickly, Cheerful cannot follow up via DM after the window closes

### Business/Creator Account Requirement
- Only Instagram **Professional accounts** (Business or Creator type) connected to a Facebook Page can use the messaging API
- Personal Instagram accounts cannot be connected
- **Impact for Cheerful**: Creators without Professional accounts cannot be onboarded

### Rate Limits
- **200 automated messages per hour** per Instagram account (Meta-level hard limit)
- At scale, this is not a bottleneck for Cheerful's use case (outreach is email-based; DM is reply channel)
- Bird platform-level write limit: 50 RPS for standard accounts, 500 RPS for Enterprise
- **1 automated DM per user per 24 hours** for comment/story triggers (does not apply to reply-in-conversation path)

### Meta App Review (Handled by Bird)
Bird has already completed Meta App Review for `instagram_manage_messages` and related permissions. Cheerful benefits from this — no Cheerful-specific App Review required for the Instagram channel. However:
- Cheerful's Bird account must configure a channel and connect an Instagram account through Bird's dashboard
- This requires a Facebook Business Manager account and an approved Instagram Professional account

---

## Integration Architecture for Cheerful

```
Creator's Instagram DM
        |
        ↓ (Meta webhook, managed by Bird)
   Bird Platform
   (Channels API layer)
        |
        ↓ (Bird webhook → HTTP POST)
Cheerful Backend API
(POST /webhooks/bird-ig-dm)
        |
        ↓
Parse Bird event → Extract sender ID, conversation ID, message body
        |
        ↓
Thread matching via conversation ID → Creator resolution via sender ID
        |
        ↓
Temporal workflow: ig_dm_received → update ig_dm_thread_state → AI draft
        |
        ↓
Human review in Cheerful inbox → Approve reply
        |
        ↓ (POST api.bird.com/channels/{channelId}/messages)
   Bird Platform
        |
        ↓ (Instagram Messaging API)
Creator's Instagram DM ← Cheerful reply
```

### Data Flow Per Inbound Message (Channels API)
- `contact.identifierValue` → Instagram Scoped User ID → maps to `creator.instagram_scoped_user_id` in Cheerful DB
- `conversation.id` → Bird conversation ID → maps to `ig_dm_thread.bird_conversation_id` in Cheerful DB
- `message.body.text.text` → message content → stored in `ig_dm_message` table
- `message.id` → Bird message ID → deduplication key
- `message.createdAt` → timestamp → used for ordering

### Webhook Handler (Python/FastAPI skeleton)
```python
@router.post("/webhooks/bird-ig-dm")
async def bird_ig_dm_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    # Verify signing key
    signature = request.headers.get("Authorization")
    if not verify_bird_signature(signature, await request.body()):
        raise HTTPException(status_code=401)

    payload = await request.json()

    if payload["type"] == "instagram.inbound":
        sender_id = payload["contact"]["identifierValue"]
        conversation_id = payload["conversation"]["id"]
        message_body = payload["message"]["body"]["text"]["text"]
        message_id = payload["message"]["id"]
        created_at = payload["message"]["createdAt"]

        # Match thread → creator → trigger Temporal workflow
        await handle_ig_dm_received(
            db=db,
            sender_id=sender_id,
            conversation_id=conversation_id,
            message_body=message_body,
            message_id=message_id,
            created_at=created_at,
        )

    return {"status": "ok"}
```

---

## Pricing Model

| Item | Cost |
|------|------|
| Per message (send or receive) | **$0.005 USD** |
| Account/platform fee | Prepaid credit model (no fixed subscription required) |
| Minimum balance | Not specified; prepaid top-up |
| Enterprise pricing | Custom (volume discounts) |

**Cost estimation for Cheerful**:
- Assume 500 creators, each exchanging an average of 4 messages per DM thread
- 500 × 4 = 2,000 messages/month → **$10/month** at low volume
- At 10,000 creators × 4 messages = 40,000 messages → **$200/month**

The per-message cost is low and predictable. Compare to ManyChat's subscription model (which scales with contacts), Bird's model scales with actual usage — better for bursty/sporadic DM activity.

**Hidden cost consideration**: Bird charges for both **sent AND received** messages, so bidirectional exchanges are billed per-message in each direction.

---

## Comparison: Bird vs. Direct Meta API

| Factor | Bird Relay | Direct Meta API |
|--------|-----------|-----------------|
| Meta App Review required | ❌ Bird handles it | ✅ Cheerful needs Advanced Access |
| Webhook infrastructure | ✅ Bird manages | ✅ Cheerful manages (same effort) |
| Full message content access | ✅ | ✅ |
| Thread/conversation ID | ✅ Bird's own ID | ✅ Native IGSID/thread |
| Real-time inbound | ✅ Every message | ✅ Every message |
| Message history API | ✅ Via Conversations API | ✅ Via Graph API `/conversations` |
| Rich message types | ✅ Text, Image, File, List, Carousel | ✅ Same (underlying Meta capability) |
| Sender IGSID | ✅ As `identifierValue` | ✅ Native |
| 24-hour window bypass | ❌ Meta constraint | ❌ Meta constraint |
| Business account required | ❌ Meta constraint | ❌ Meta constraint |
| Per-message cost | ✅ $0.005/message | ❌ Free |
| Vendor dependency | Medium (Bird) | None |
| Time to first message | Fast (no App Review wait) | Slow (weeks for App Review) |
| Native Instagram thread IDs | ❌ Bird abstracts them | ✅ Raw Meta IDs |
| Implementation effort | Low-Medium (standard REST + webhook) | Medium-High (Meta OAuth, webhook setup) |
| Multi-channel unification | ✅ (WhatsApp, SMS, etc.) | ❌ Instagram only |

---

## Comparison: Bird vs. ManyChat

| Factor | Bird | ManyChat |
|--------|------|---------|
| All DMs captured | ✅ Every message | ⚠️ Only flow-matched messages |
| Thread context / history | ✅ Conversations API | ❌ `last_input_text` only |
| Instagram Scoped User ID | ✅ | ❌ ManyChat internal ID |
| Message deduplication ID | ✅ | ❌ |
| Reliability | High | Medium (URL bug, flow priority issues) |
| Developer experience | API-first | No-code/low-code |
| Pricing model | $0.005/message (pay per use) | $15–$2,000+/mo subscription |
| Creator onboarding friction | Medium (connect IG via Bird dashboard) | High (ManyChat account + IG connect) |
| App Review | ✅ Bird handles it | ✅ ManyChat handles it |

---

## Auth & Onboarding Flow for Creators

For Cheerful to use Bird, each creator would need to connect their Instagram account through **Cheerful's Bird channel setup**. Options:

**Option A: Cheerful manages one Bird workspace, creators connect as channels**
- Each creator's Instagram account = one Bird channel in Cheerful's workspace
- Cheerful builds an onboarding UI that triggers Bird's Instagram channel OAuth flow
- All DMs from all creators flow into Cheerful's Bird workspace
- Single API key manages all creator channels

**Option B: Per-creator Bird accounts**
- Each creator has their own Bird account
- Cheerful integrates via Bird's API using per-creator credentials
- More isolated but much higher operational overhead

**Option A is the viable path**. The creator onboarding step would be:
1. Creator clicks "Connect Instagram" in Cheerful settings
2. Cheerful calls Bird's channel creation API to initiate Instagram OAuth
3. Creator completes Meta OAuth (authorize their Instagram Business account)
4. Bird's channel is registered; Cheerful stores the `channelId` for that creator
5. Inbound DMs from that creator's account now flow via Bird webhook to Cheerful

This is roughly equivalent effort to direct Meta OAuth from the creator's perspective — one OAuth step. Cheerful's backend complexity is lower (no webhook subscription management, no Meta App token refresh).

---

## Risks

| Risk | Severity | Notes |
|------|----------|-------|
| Per-message billing adds ongoing cost | Low | $0.005/msg is low; scales predictably |
| Bird platform outage affects DM delivery | Medium | Additional SLA dependency; Bird has enterprise SLAs |
| Bird API changes / version deprecation | Medium | Channels API is newer; Conversations API being phased |
| Vendor lock-in for DM channel | Medium | Switching requires re-mapping Bird conversation IDs to native Meta IDs |
| Bird ID ≠ Meta native ID | Low-Medium | Bird assigns own conversation/message IDs; if migrating to direct Meta, ID mapping needed |
| 24-hour window (Meta constraint, not Bird) | Medium | Inbound-first model partially mitigates; creators must initiate |
| Per-message cost at scale | Low | At Cheerful's likely scale, minimal impact |
| Data residency — DMs through Bird's infra | Low-Medium | Creator DM content processed through Bird's servers |
| No bypass for Meta App Review for Cheerful's app | ✅ N/A | Bird handles Meta side |

---

## Compatibility with Cheerful's Architecture

### Temporal Workflow Integration
Bird's webhook delivery maps cleanly to a Temporal workflow trigger:
- Webhook received → validate → enqueue to `ig_dm_received_queue` → Temporal picks up → updates thread state (append-only)
- Outbound send: Temporal activity calls Bird's Channels API to send reply
- Retry handling: if Bird send fails, Temporal's retry policy handles it (matches existing email sending pattern)

### Event-Sourced Thread Model
- Bird's `conversation.id` becomes the `ig_dm_thread.external_id` (analogous to `gmail_thread_id`)
- Each inbound message appends a row to `ig_dm_thread_state` (matching append-only email state pattern)
- Bird's `message.id` = deduplication key (prevents duplicate processing on webhook retry)

### Creator Identity Resolution
- Bird exposes the Instagram Scoped User ID (IGSID) as `contact.identifierValue`
- If Cheerful's `creator` table stores the IGSID, matching is direct
- If not stored (currently), resolution by Instagram username requires lookup — Bird's contact object may include `displayName` (Instagram username) that can be matched against `creator.instagram_handle`

### Data Model Changes Required
New tables (parallel to Gmail pattern):
- `ig_dm_account` — Cheerful's Bird workspace channel config per creator
- `ig_dm_thread` — thread keyed by `bird_conversation_id` + `creator_id` + `campaign_id`
- `ig_dm_thread_state` — append-only state rows (matching `gmail_thread_state` pattern)
- `ig_dm_message` — individual messages with `bird_message_id`, body, direction, timestamp

---

## Verdict for Options Catalog

Bird is the **strongest third-party relay option** for Cheerful's Instagram DM use case. It provides:
- Complete inbound message delivery (no flow-gating like ManyChat)
- Full thread context and message history API
- Native IGSID equivalent for creator identity resolution
- Clean webhook semantics matching Cheerful's existing event patterns
- No Meta App Review wait time (vs. direct integration)
- API-first design that integrates naturally with FastAPI/Temporal

The primary trade-offs are:
- **Per-message cost** ($0.005/message) vs free Meta API
- **Bird ID abstraction** — if Cheerful later migrates to direct Meta API, conversation/message IDs need remapping
- **Vendor dependency** — Bird is an additional operational dependency

**Relative effort**: Bird integration is **Medium effort** — lower than direct Meta API (no App Review, simpler webhook auth) and dramatically higher quality than ManyChat (full message access, proper thread IDs). It is the most viable "quick-to-production" path with production-grade reliability.

---

## Sources

- Bird Instagram DM Integration landing page: https://bird.com/en-us/omnichannel/instagram-direct
- Bird Instagram DM Pricing: https://bird.com/en-us/pricing/instagram ($0.005/message)
- Bird API Reference: https://bird.com/en-us/api-reference
- Bird API Docs — Channels API: https://docs.bird.com/api
- Bird Channels API — Message Status & Interactions: https://docs.bird.com/api/channels-api/message-status-and-interactions
- Bird Webhooks API Reference: https://docs.bird.com/api/notifications-api/api-reference/webhooks
- Bird Instagram Message Types: https://docs.bird.com/applications/channels/channels/supported-channels/instagram-messaging/instagram-message-types
- MessageBird Conversations API (legacy): https://developers.messagebird.com/api/conversations/
- MessageBird: Deploy an Instagram Endpoint (Cognigy guide): https://support.cognigy.com/hc/en-us/articles/4415624757010-MessageBird-Deploy-an-Instagram-Endpoint
- Channels API and Conversations API migration guide: https://docs.bird.com/api/connectivity-platform-migration-guide/channels-api-and-conversations-api
- Instagram API Rate Limits (200/hour): https://creatorflow.so/blog/instagram-api-rate-limits-explained/
- Instagram DM Rules and 24-hour window: https://chatimize.com/instagram-dm-rules/
