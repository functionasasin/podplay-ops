# Meta Instagram Messaging API — Capability Map

**Wave**: 1 — External Landscape
**Aspect**: `meta-instagram-messaging-api`
**Status**: Complete

---

## Overview

The Instagram Messaging API is not a standalone product. It is a capability layer built on top of the **Meta Messenger Platform** infrastructure. Businesses interact with Instagram DMs using the same Graph API endpoints, webhooks, and access token model used for Facebook Messenger. The API became generally available (no follower minimums) in mid-2021.

**Official entrypoint**: `https://graph.facebook.com/v{version}/me/messages`
**Webhook object type**: `instagram`
**Documentation base**: `https://developers.facebook.com/docs/messenger-platform/instagram`

---

## Account Requirements

| Requirement | Details |
|-------------|---------|
| **Account type** | Instagram Professional account (Business or Creator) — personal accounts are excluded |
| **Facebook Page link** | The Instagram account must be linked to a Facebook Page. This is mandatory — no Page = no API access |
| **Business App** | Must create a "Business" type Meta App in the Developer Dashboard |
| **Follower minimum** | None (removed mid-2021) |

---

## Authentication & Access Tokens

The auth flow uses **OAuth 2.0 via Meta Login**:

1. User authorizes the app via Facebook Login (Instagram-linked Page owner)
2. App receives a **User Access Token** (short-lived, valid ~1 hour)
3. Exchange for a **Long-Lived User Access Token** (~60 days)
4. Generate a **Page Access Token** from the User Access Token
5. The Page Access Token is what's used for all API calls

**Token management**: Page Access Tokens can be made permanent ("never expire") by exchanging through specific Graph API calls. This is critical for production integrations that need persistent access.

```
GET /{page-id}?fields=access_token&access_token={user-long-lived-token}
```

---

## Required Permissions

| Permission | Access Level | Purpose |
|-----------|-------------|---------|
| `instagram_basic` | Standard (no review needed) | Read basic profile info |
| `instagram_manage_messages` | **Advanced Access required** | Read/write DMs |
| `pages_manage_metadata` | Advanced Access required | Subscribe to webhooks |
| `pages_show_list` | Advanced Access required | List connected pages |
| `pages_messaging` | Advanced Access required | Send messages on behalf of page |
| `business_management` | Advanced Access required | Access user profile pictures/names |

**Critical**: `instagram_manage_messages` with Advanced Access is **NOT** available by default. It requires Meta App Review approval. In Development mode, only users explicitly added as App Roles can test DM features.

---

## App Review Process

### What's Required

1. **Screencast video** demonstrating how each permission is used (one per permission)
2. **Documented use case** explaining why each permission is necessary
3. **Privacy policy** hosted at a publicly accessible URL (must load quickly)
4. **App in Live mode** (not Development mode) for production access

### Timeline

- Standard review: **2–7 business days**
- Rejection and resubmission: adds **3–5 days per attempt**
- Complex use cases can extend to **10+ business days**

### Common Rejection Reasons

- Requesting permissions not strictly necessary ("just in case")
- Screencast that doesn't clearly demonstrate permission use
- Privacy policy missing or slow-loading
- Unclear explanation of the app's purpose

### Testing Before Approval

During Development mode, all DM features are fully functional but **only for users with assigned App Roles** (Admin, Developer, or Tester roles on the Meta app). This allows end-to-end testing without production approval.

---

## Webhook Architecture

### Subscription Setup

1. Add **Webhooks product** to the Meta App
2. Select **Instagram** as the webhook object
3. Provide a **Callback URL** (HTTPS required)
4. Provide a **Verify Token** (arbitrary string; verified on subscribe)
5. Select **field subscriptions** (which event types to receive)

### Webhook Verification Flow

```
Meta → GET {callback_url}?hub.mode=subscribe&hub.verify_token={token}&hub.challenge={random}
App  → respond with hub.challenge value (plain text, 200 OK)
```

### Signing / Security

All webhook payloads are signed with `X-Hub-Signature-256` header:
```
HMAC-SHA256(app_secret, raw_body)
```
Apps **must** validate this signature before processing any payload.

---

## Webhook Event Types

### `messages` — Inbound DM

Fires when a user sends a message to the business's Instagram account.

```json
{
  "object": "instagram",
  "entry": [
    {
      "id": "17841405309211844",
      "time": 1504902988,
      "messaging": [
        {
          "sender": { "id": "123456789" },
          "recipient": { "id": "17841405309211844" },
          "timestamp": 1504902988,
          "message": {
            "mid": "mid.$cAAE1QiBYk6pr6s_1PdB5jvfmMwca",
            "text": "Hello, I'd love to collaborate"
          }
        }
      ]
    }
  ]
}
```

**Key fields**:
- `entry[].id` — Instagram Business Account ID (the receiving account)
- `messaging[].sender.id` — Instagram-Scoped User ID (IGSID) of the DM sender
- `messaging[].recipient.id` — Same as `entry[].id`
- `message.mid` — Unique Message ID (globally unique across all of Meta)
- `message.text` — Message text content

### `messages` — Attachment

```json
{
  "message": {
    "mid": "m_6RK4gK9eklpa6uPCNFvNEvgf...",
    "attachments": [
      {
        "type": "image",
        "payload": { "url": "https://..." }
      }
    ]
  }
}
```

Attachment types: `image`, `video`, `audio` (plus `is_unsupported: true` for Reels, IGTV, voice memos, GIPHYs, and media from private accounts).

### `messages` — Echo (Outbound)

When the business sends a DM via API, an echo is delivered back:
```json
{
  "message": {
    "mid": "...",
    "is_echo": true,
    "text": "..."
  }
}
```
**Must filter**: Apps must check `is_echo: true` and skip processing these.

### `messages` — Story Reply

When a user replies to one of the business's Stories:
```json
{
  "message": {
    "mid": "...",
    "text": "...",
    "reply_to": {
      "story": {
        "id": "...",
        "url": "..."
      }
    }
  }
}
```

### `messages` — Delete

When a user deletes a message they sent:
```json
{
  "message": {
    "mid": "...",
    "is_deleted": true
  }
}
```

### `messaging_postbacks`

Fires when a user taps a button in a generic template or quick reply:
```json
{
  "messaging": [{
    "sender": { "id": "..." },
    "recipient": { "id": "..." },
    "timestamp": 1504902988,
    "postback": {
      "payload": "BUTTON_PAYLOAD_STRING",
      "title": "Button Label"
    }
  }]
}
```

### `messaging_optins`

Fires when a user opts into marketing messages (notification opt-in flow).

### `messaging_referrals`

Fires when a user enters a conversation via an ad or referral link.

---

## Supported Message Types (Outbound)

| Type | Description | Constraints |
|------|------------|-------------|
| Text | Plain UTF-8 text | Max 1,000 characters |
| Image | Inline or URL-referenced | PNG/JPEG/GIF, max 8MB |
| Audio | URL-referenced | AAC/M4A/WAV/MP4, max 25MB |
| Video | URL-referenced | MP4/OGG/AVI/MOV/WEBM, max 25MB |
| Quick Replies | Text + optional image chips | Max 13 per message, 20 chars per label |
| Generic Template (Rich Card) | Title + subtitle + image + buttons | Max 3 buttons per card |
| Generic Carousel | 2–10 Generic Templates chained | — |
| Ice Breakers | FAQ-style welcome prompts | Max 4 questions, shown on first contact |

---

## Thread / Conversation Model

The API uses a **per-sender thread model**, not an explicit thread object. Each unique `sender.id` (IGSID) represents one conversation thread with the business account.

- **Thread identity**: `(ig_account_id, igsid)` tuple — implicitly the conversation
- **No explicit thread ID** in the basic messaging API (unlike email's `thread_id`)
- **Conversation history**: Accessible via `GET /{ig-account-id}/conversations?user_id={igsid}` which returns a conversation object with message IDs
- **Thread continuity**: Maintained by the IGSID — same user always maps to same thread

### IGSID vs Public Instagram ID

The `sender.id` in webhook payloads is an **Instagram-Scoped User ID (IGSID)** — a per-app, per-user identifier. It is:
- Consistent across messages from the same user to the same business
- NOT the public Instagram user ID visible in profile URLs
- Resolve to profile info via `GET /{igsid}?fields=name,profile_pic`

---

## 24-Hour Messaging Window

This is the most significant operational constraint for Cheerful's use case.

| Scenario | Ability to Send |
|----------|----------------|
| Within 24h of user's last message | Unlimited messages, including promotional |
| After 24h without user reply | **Cannot send promotional content** |
| HUMAN_AGENT tag | Can send up to **7 days** after user's last message |
| Marketing Messages (opt-in) | Daily notifications after user opts in |
| One-Time Notifications | Single message outside window after user request |

**For Cheerful's use case** (creator DM replies → inbound capture):
- The window constraint only affects **outbound** messaging from Cheerful
- Inbound DMs from creators can be received at any time regardless of window
- If Cheerful wants to send AI-drafted replies back via DM, the 24-hour window applies
- If a creator DMs at any time, the window opens (or resets), enabling a reply

---

## Rate Limits

| Limit | Value | Notes |
|-------|-------|-------|
| Outbound DMs | 200/hour × number of active conversations | E.g., 2 active convos = 400/hr |
| Graph API calls | Varies by endpoint; typically Business Use Case limits | Standard BUC limits |
| Message sends | ~100 calls/sec per professional account (in some contexts) | Not confirmed for all cases |

**October 2024 change**: Meta reduced the base rate from 5,000 to 200 DMs/hour. This was a significant reduction that impacted automation tools.

At Cheerful's scale (creator outreach platform), 200/hr is unlikely to be a bottleneck for inbound capture, but could matter for outbound response at scale.

---

## Delivery Guarantees & Reliability

| Aspect | Details |
|--------|---------|
| Webhook delivery latency | 1–5 seconds typical; 30–60 seconds during high traffic |
| Retry behavior | Meta retries failed webhook deliveries (non-2xx responses) |
| At-least-once delivery | Meta may deliver the same event multiple times — apps must deduplicate by `message.mid` |
| No guaranteed ordering | Events for same thread can arrive out of order |
| Missed events | If webhook is down for extended period, events may be lost (not caught up automatically) |

**Deduplication key**: `message.mid` is globally unique across Meta's messaging system.

---

## Capability Matrix Summary

| Capability | Supported | Notes |
|-----------|-----------|-------|
| Receive inbound DMs | ✅ | Via `messages` webhook |
| Send outbound DMs | ✅ | Within 24h window |
| Real-time webhooks | ✅ | `messages` field subscription |
| Story replies | ✅ | Included in `messages` events |
| Message deletes | ✅ | `is_deleted` flag |
| Media attachments | ✅ (receive) | Images, video, audio |
| Voice messages | ❌ | Delivered as `is_unsupported: true` |
| Reels/IGTV shares | ❌ | `is_unsupported: true` |
| GIPHYs | ❌ | `is_unsupported: true` |
| Group DMs | ❌ | API is strictly 1:1 |
| Personal account DMs | ❌ | Business/Creator accounts only |
| Polling (no webhooks) | ❌ (limited) | Graph API `/conversations` exists but not for real-time |
| Read receipts | ✅ | Available as webhook event |
| Typing indicators | ✅ | Can send; receive not well-documented |
| Ice Breakers (welcome prompts) | ✅ | Up to 4 FAQ prompts on first contact |
| Marketing messages | ✅ | Requires opt-in flow |
| HUMAN_AGENT tag | ✅ | 7-day window extension |

---

## Constraints & Limitations for Cheerful

### Critical Constraints

1. **Facebook Page required**: Every Cheerful customer whose Instagram DMs are to be integrated must have their Instagram account linked to a Facebook Page. This adds friction to the onboarding flow — users must complete this Meta-side setup.

2. **App Review required**: Cheerful must undergo Meta App Review to get Advanced Access for `instagram_manage_messages`. This is a multi-week process involving screencasts, documentation, and potential rejection cycles.

3. **24-hour window**: If Cheerful's product includes sending AI-drafted replies back via DM, the 24-hour window is a hard constraint. Inbound-only capture is not affected.

4. **IGSID vs email**: Creator identity resolution is more complex — the `sender.id` (IGSID) is a per-app opaque ID. Matching an IGSID to an existing Cheerful `creator` record requires storing the IGSID or resolving it to the Instagram username/handle.

5. **One-app-per-integration**: Each Cheerful user's Instagram account requires OAuth authorization through Cheerful's Meta App. Users must grant permissions explicitly — this is a standard OAuth flow but adds onboarding steps.

6. **Development mode testing**: Until App Review approval, only App Role users can test. This constrains beta testing to internal team members.

7. **October 2024 rate reduction**: The 200 DM/hour limit (vs prior 5,000) reduces the viability of high-volume automated outreach (not Cheerful's use case for inbound, but relevant if outbound DM sending is ever added).

### Non-Critical Constraints

- Webhook downtime = missed events (must implement recovery strategy)
- Out-of-order event delivery requires timestamp-based sorting
- Echo messages require client-side filtering
- Unsupported media types (voice, Reels) arrive as `is_unsupported: true` — graceful degradation needed

---

## Effort Estimate (for Cheerful integration)

| Phase | Effort | Notes |
|-------|--------|-------|
| Meta App creation & configuration | Small | 1–2 days, mostly setup |
| OAuth flow for user auth | Medium | New OAuth flow; similar pattern to Gmail OAuth |
| Webhook handler endpoint | Medium | New FastAPI endpoint, HMAC validation, dedup |
| App Review submission | Small–Medium | Docs + screencast; waiting time out of hands |
| IGSID → creator resolution | Medium | Need to decide: store IGSID, or resolve via username match |
| Thread ingestion pipeline | Large | New ig_dm tables or channel abstraction layer |
| UI changes for DM threads | Medium–Large | Inbox needs to display DM threads |

**Total estimate**: Medium–Large; the API integration itself is straightforward, but the broader threading model and UI changes add significant scope.

---

## References

- Meta Instagram Messaging API overview (via search results)
- [Instagram API rate limits and setup tips](https://www.interakt.shop/instagram-automation/api-limitations-setup-tips/)
- [The Instagram DM API guide](https://www.bot.space/blog/the-instagram-dm-api-your-ultimate-guide-to-automation-sales-and-customer-loyalty-svpt5)
- [CM.com Instagram Messaging docs](https://developers.cm.com/messaging/docs/instagram-messaging)
- [Meta App Review guide](https://www.saurabhdhar.com/blog/meta-app-approval-guide)
- [Instagram webhook setup (ngrok)](https://ngrok.com/docs/integrations/webhooks/instagram-webhooks)
- [Unipile Instagram Messaging API](https://www.unipile.com/instagram-messaging-api/)
