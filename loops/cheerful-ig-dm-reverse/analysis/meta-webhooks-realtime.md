# Meta Webhook Infrastructure for Instagram Messaging

**Aspect:** `meta-webhooks-realtime`
**Wave:** 1 — External Landscape
**Date:** 2026-02-28

---

## Overview

Meta's webhook system is the **primary real-time delivery mechanism** for Instagram DM events. When combined with the Messenger Platform (Instagram Messaging API), webhooks push message events to a developer-registered HTTPS endpoint the moment they occur, eliminating polling entirely.

This analysis documents the full webhook architecture as it applies to Instagram messaging: event types, payload formats, verification flow, delivery guarantees, subscription setup, test/production modes, and operational constraints.

---

## 1. Webhook Subscription Architecture

### 1.1 Object Hierarchy

Meta webhooks are organized around **objects** and **fields**. For Instagram DMs:

- **Object**: `instagram`
- **Key fields**: `messages`, `messaging_postbacks`, `message_echoes`, `message_deliveries`, `message_reads`, `messaging_referrals`, `messaging_handovers`, `messaging_optins`, `messaging_optouts`, `standby`

The webhook subscription is registered at the **app level** via the Meta Developer Dashboard or programmatically:

```http
POST https://graph.facebook.com/{APP_ID}/subscriptions
  ?object=instagram
  &callback_url=https://your-server.com/webhooks/instagram
  &fields=messages,messaging_postbacks,message_echoes
  &verify_token=YOUR_VERIFY_TOKEN
  &access_token={APP_ID}|{APP_SECRET}
```

Then, each connected **Facebook Page** (linked to the Instagram Professional account) must be subscribed at the page level:

```http
POST /{PAGE_ID}/subscribed_apps
  ?access_token={PAGE_ACCESS_TOKEN}
  &subscribed_fields=messages,messaging_postbacks
```

### 1.2 Facebook Page Requirement

A key architectural constraint: Instagram Professional accounts must be **linked to a Facebook Page** for webhook delivery. The webhook subscription is page-scoped — there is no way to receive Instagram DM webhooks without a connected FB Page using the Messenger Platform API.

> **Note:** The new "Instagram API with Instagram Login" (July 2024) may eventually remove this FB Page requirement, but DM webhook support under that API is not yet confirmed.

---

## 2. Two-Phase Verification Flow

### Phase 1: Endpoint Verification (One-time)

When subscribing, Meta sends a `GET` request to the callback URL:

```
GET https://your-server.com/webhooks/instagram
  ?hub.mode=subscribe
  &hub.verify_token=YOUR_VERIFY_TOKEN
  &hub.challenge=CHALLENGE_STRING
```

The server must respond with `HTTP 200` and the raw `hub.challenge` value in the body. Failure to return the challenge within ~5 seconds causes subscription to fail.

**Implementation (FastAPI/Python):**
```python
@router.get("/webhooks/instagram")
async def webhook_verify(
    hub_mode: str = Query(alias="hub.mode"),
    hub_verify_token: str = Query(alias="hub.verify_token"),
    hub_challenge: str = Query(alias="hub.challenge"),
):
    if hub_mode == "subscribe" and hub_verify_token == settings.WEBHOOK_VERIFY_TOKEN:
        return PlainTextResponse(hub_challenge)
    raise HTTPException(status_code=403)
```

### Phase 2: Payload Signature Verification (Per-delivery)

Every webhook POST includes two signature headers:
- `X-Hub-Signature`: HMAC-SHA1 of body (legacy, still sent)
- `X-Hub-Signature-256`: HMAC-SHA256 of body (**recommended**)

Format: `sha256=<hex-digest>`

Verification:
```python
import hmac
import hashlib

def verify_webhook_signature(payload: bytes, signature_header: str, app_secret: str) -> bool:
    expected = hmac.new(
        app_secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    received = signature_header.split("=", 1)[1]
    return hmac.compare_digest(expected, received)
```

> **Security note:** Use `hmac.compare_digest` (constant-time comparison) to prevent timing attacks. Reject any requests without valid signatures.

---

## 3. Event Types and Payload Formats

### 3.1 Top-Level Envelope

All Instagram webhook payloads share the same envelope:

```json
{
  "object": "instagram",
  "entry": [
    {
      "id": "17841405309211844",
      "time": 1504902988,
      "messaging": [
        { /* event object */ }
      ]
    }
  ]
}
```

**Key fields:**
- `entry[].id`: Instagram Professional Account ID (IGPID)
- `entry[].time`: Unix timestamp
- `entry[].messaging[]`: Array of individual event objects

> **Important:** Multiple events may be **batched** into a single webhook delivery (multiple items in `entry[]` or `messaging[]`). This is not guaranteed — some deliveries contain exactly one event. Implementations must handle both cases.

### 3.2 Inbound Message Event (`messages` field)

The primary event for Cheerful's inbound-first use case:

```json
{
  "sender": { "id": "123456789" },
  "recipient": { "id": "17841405309211844" },
  "timestamp": 1504902988,
  "message": {
    "mid": "mid.$cAAE1QiBYk6pr6s_1PdB5jvfmMwca",
    "text": "Hello, I'd love to collaborate!",
    "attachments": [
      {
        "type": "image",
        "payload": {
          "url": "https://example.com/image.jpg"
        }
      }
    ],
    "reply_to": {
      "story": {
        "id": "story_id",
        "url": "https://www.instagram.com/stories/..."
      }
    },
    "is_echo": false,
    "is_deleted": false,
    "is_unsupported": false
  }
}
```

**Key fields:**
- `sender.id`: Instagram-Scoped ID (IGSID) — a per-app identifier for the user
- `recipient.id`: The Instagram Professional Account ID (your account)
- `message.mid`: Globally unique message ID (use for deduplication)
- `message.text`: Message text (absent for pure media messages)
- `message.attachments[]`: Array of attachments (see types below)
- `message.reply_to`: Present when the message is a reply; can be a `story` or `message`
- `message.is_echo`: `true` for messages sent by your page — **must be filtered out**
- `message.is_deleted`: `true` for deleted messages
- `message.is_unsupported`: `true` for message types not exposed via API (e.g., Reels replies)

### 3.3 Supported Attachment Types

| Type | Description | Notes |
|------|-------------|-------|
| `image` | Photo DM | URL to image (ephemeral) |
| `video` | Video DM | URL to video (ephemeral) |
| `audio` | Audio message | Limited availability |
| `file` | File attachment | Rare in DMs |
| `template` | Quick reply template | Sent by business |
| `story` (via `reply_to`) | Story reply | Payload has `id` + `url` |

> **Media URL lifetime:** Attachment URLs from webhooks are **ephemeral** — they expire. If storing message content, download and store media immediately upon receipt.

### 3.4 Story Reply Events

When a user replies to one of your Stories:

```json
{
  "sender": { "id": "123456789" },
  "recipient": { "id": "17841405309211844" },
  "timestamp": 1504902988,
  "message": {
    "mid": "mid.xxxxx",
    "text": "This is so cool!",
    "reply_to": {
      "story": {
        "id": "17858893269000001",
        "url": "https://www.instagram.com/stories/username/17858893269000001/"
      }
    }
  }
}
```

### 3.5 Story Mention Events (`mention` field)

When a user mentions your account in their Story (different from a reply):

```json
{
  "sender": { "id": "123456789" },
  "recipient": { "id": "17841405309211844" },
  "timestamp": 1504902988,
  "mention": {
    "media_id": "17858893269000002",
    "media_type": "story"
  }
}
```

### 3.6 Postback Events (`messaging_postbacks` field)

When a user taps a quick reply button or template button:

```json
{
  "sender": { "id": "123456789" },
  "recipient": { "id": "17841405309211844" },
  "timestamp": 1504902988,
  "postback": {
    "mid": "mid.xxxxx",
    "title": "Yes",
    "payload": "YES_PAYLOAD"
  }
}
```

### 3.7 Message Echo Events (`message_echoes` field)

Messages sent **from** your account — important to filter when building inbox:

```json
{
  "sender": { "id": "17841405309211844" },
  "recipient": { "id": "123456789" },
  "timestamp": 1504902988,
  "message": {
    "mid": "mid.xxxxx",
    "text": "Thanks for reaching out!",
    "is_echo": true
  }
}
```

Echos are useful for tracking outbound message state and correlating replies.

### 3.8 Read Receipt Events (`message_reads` field)

```json
{
  "sender": { "id": "123456789" },
  "recipient": { "id": "17841405309211844" },
  "timestamp": 1504902988,
  "read": {
    "watermark": 1504902988000
  }
}
```

### 3.9 Delivery Events (`message_deliveries` field)

```json
{
  "sender": { "id": "123456789" },
  "recipient": { "id": "17841405309211844" },
  "timestamp": 1504902988,
  "delivery": {
    "mids": ["mid.xxxxx"],
    "watermark": 1504902988000
  }
}
```

### 3.10 Not Supported via Webhooks

| Event | Status |
|-------|--------|
| Voice message replies | Not exposed |
| Reels DM replies | `is_unsupported: true` |
| Group DMs | Not accessible |
| `messaging_seen` field | Not a valid subscription field (OAuthException if attempted) |
| New follower DMs | Not a separate event type |

---

## 4. Delivery Guarantees and Reliability

### 4.1 Delivery Model: At-Least-Once

Meta webhooks use an **at-least-once delivery model**:
- Duplicate deliveries are possible (same `message.mid` in multiple webhook POSTs)
- Implementations MUST be idempotent, using `mid` as a deduplication key
- Events are NOT guaranteed to arrive in order

### 4.2 Timeout Requirements

- Server must respond with `HTTP 200` within **5–10 seconds**
- Responses >10s cause the delivery to be treated as failed
- **Critical pattern**: Return `200` immediately, then process asynchronously (queue-based)

```python
@router.post("/webhooks/instagram")
async def webhook_receive(request: Request, background_tasks: BackgroundTasks):
    # Verify signature synchronously (fast)
    body = await request.body()
    sig = request.headers.get("X-Hub-Signature-256", "")
    if not verify_webhook_signature(body, sig, settings.APP_SECRET):
        raise HTTPException(status_code=403)

    payload = await request.json()
    # Enqueue for async processing — respond immediately
    background_tasks.add_task(process_instagram_webhook, payload)
    return Response(status_code=200)
```

### 4.3 Retry Behavior

When Meta receives a non-2xx response or timeout:
- Meta retries with **exponential backoff** over ~24 hours
- Exact retry schedule not publicly documented; estimated 3–7 retries
- After exhausting retries, the event is **dropped permanently**

Implications for Cheerful:
- Webhook receiver must be highly available (no downtime during DM-heavy periods)
- Queue-backed processing protects against temporary downstream failures
- Dead-letter queue recommended for failed processing after successful receipt

### 4.4 Idempotency Strategy for Cheerful

```sql
-- Deduplication table
CREATE TABLE ig_webhook_events (
    mid TEXT PRIMARY KEY,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    payload JSONB NOT NULL
);
```

On receipt: insert `mid` with `ON CONFLICT DO NOTHING`. On processing: update `processed_at`.

---

## 5. Subscription Setup — Step-by-Step

### 5.1 Prerequisites

1. Meta App with "Instagram" product added
2. Facebook Page linked to Instagram Professional Account
3. App permissions: `instagram_manage_messages`, `instagram_basic`, `pages_manage_metadata`, `pages_show_list`, `pages_messaging`
4. HTTPS endpoint with valid SSL certificate (no self-signed certs)
5. App in **Live Mode** (not Development Mode)

### 5.2 Dashboard Setup

1. Meta Developer Dashboard → App → Webhooks product → Add Product
2. Select "Instagram" as the object
3. Enter callback URL + verify token → "Verify and Save"
4. Check `messages`, `messaging_postbacks`, `message_echoes` (minimum for DMs)
5. Optionally add `message_deliveries`, `message_reads`, `messaging_referrals`

### 5.3 Per-Page Subscription (Programmatic)

After a user connects their Instagram account via OAuth, subscribe the page:

```python
async def subscribe_page_to_instagram_webhooks(
    page_id: str,
    page_access_token: str,
    fields: list[str] = None,
):
    if fields is None:
        fields = ["messages", "messaging_postbacks", "message_echoes"]

    response = await httpx_client.post(
        f"https://graph.facebook.com/v21.0/{page_id}/subscribed_apps",
        params={
            "access_token": page_access_token,
            "subscribed_fields": ",".join(fields),
        }
    )
    response.raise_for_status()
```

### 5.4 Long-Lived Page Access Tokens

Short-lived user access tokens expire. For production:
1. Exchange short-lived user token → long-lived user token (60-day expiry)
2. Exchange long-lived user token → long-lived Page access token (non-expiring)

```python
# Step 1: Long-lived user token
GET https://graph.facebook.com/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id={APP_ID}
  &client_secret={APP_SECRET}
  &fb_exchange_token={SHORT_LIVED_TOKEN}

# Step 2: Long-lived page token
GET https://graph.facebook.com/{PAGE_ID}
  ?fields=access_token
  &access_token={LONG_LIVED_USER_TOKEN}
```

Page access tokens obtained via this flow typically **do not expire** as long as the user doesn't revoke app permissions.

---

## 6. Development vs. Production Mode

### Development Mode Constraints

| Constraint | Detail |
|------------|--------|
| Webhook events | Only fired for users who are **App Roles** members (admin, developer, tester) |
| Real users | Silently ignored — no webhook events, no errors |
| Test delivery | Dashboard "Test" button sends synthetic payloads |
| Rate limits | Same as production |

### Live Mode Requirements

To transition:
1. Complete **App Review** for `instagram_manage_messages` (Advanced Access)
2. Set app to "Live" in Meta Developer Dashboard
3. Webhooks fire for **all** connected Instagram Professional accounts

### Testing Workflow

During development, webhooks can only be tested with:
- Accounts added as Testers in App Roles → App Settings → Roles
- The dashboard's built-in "Send to My Server" test button
- Tools like ngrok for local HTTPS tunneling

---

## 7. Operational Requirements

### 7.1 Infrastructure Requirements

| Requirement | Detail |
|-------------|--------|
| HTTPS | Valid SSL certificate (Let's Encrypt acceptable) |
| Response time | <5 seconds (aim for <1s) |
| High availability | Meta drops events after retry exhaustion |
| IP allowlisting | Meta does not publish fixed IP ranges; cannot allowlist |

### 7.2 Webhook Handler Best Practices

1. **Verify signature first** — reject invalid signatures with 403 before any processing
2. **Return 200 immediately** — enqueue payload, process async
3. **Deduplicate by `mid`** — use upsert/idempotency keys
4. **Filter echoes** — check `is_echo: true` and skip
5. **Filter unsupported** — check `is_unsupported: true` and handle gracefully
6. **Handle batched events** — iterate all `entry[]` and `messaging[]` items
7. **Ephemeral media** — download attachment URLs immediately; don't store URLs
8. **Log raw payloads** — store `JSONB` for debugging/replay

### 7.3 Temporal Workflow Integration

For Cheerful's Temporal-based architecture, the webhook handler should:
1. Receive webhook POST → verify → ACK 200
2. Write raw event to a durable queue (e.g., Supabase table, Redis, or directly signal a Temporal workflow)
3. Temporal activity picks up event, processes it (creator matching, thread upsert, AI draft trigger)

This aligns with the existing email pipeline pattern where SMTP/Gmail events trigger Temporal workflow activities.

---

## 8. Complete Subscription Field Reference

| Field | Description | Use for Cheerful |
|-------|-------------|-----------------|
| `messages` | Inbound messages from users | **Required** — core DM ingestion |
| `messaging_postbacks` | Quick reply / button taps | Optional — if using IG bot buttons |
| `message_echoes` | Outbound messages from your account | Optional — for sent-message tracking |
| `message_deliveries` | Delivery receipts | Optional — for analytics |
| `message_reads` | Read receipts | Optional — for analytics |
| `messaging_referrals` | Referral source tracking | Optional |
| `messaging_handovers` | Handover protocol events | Only if using multiple apps |
| `messaging_optins` | Opt-in events | Optional |
| `messaging_optouts` | Opt-out events | Optional |
| `standby` | Standby channel events | Only if using handover protocol |
| `mention` | Story mentions of your account | Optional — for outreach discovery |

**Minimum viable subscription for Cheerful**: `messages`, `message_echoes`

---

## 9. Constraints and Limitations

| Constraint | Detail |
|------------|--------|
| No fixed IP ranges | Cannot allowlist Meta's IPs; must be public endpoint |
| No guaranteed ordering | Events may arrive out of order; use `timestamp` for sequencing |
| At-least-once delivery | Duplicates possible; must deduplicate by `mid` |
| Ephemeral media URLs | Download immediately; attachments expire |
| Development mode | Only tester accounts trigger events until App Review |
| App Review required | Production access takes 2–10 business days |
| FB Page required | Cannot receive DM webhooks without linked FB Page (current API) |
| No `messaging_seen` | Instagram does not support this field subscription |
| Unsupported types | Voice, Reels replies return `is_unsupported: true` |
| Webhook test limitation | Dashboard test button sends synthetic data only |
| No replay mechanism | Meta provides no built-in webhook replay/history API |

---

## 10. Architecture Requirements for Cheerful

### New Components Required

1. **`POST /webhooks/instagram` endpoint** (FastAPI)
   - Verify token (GET) + signature (POST)
   - Return 200 immediately
   - Enqueue to processing pipeline

2. **Idempotency store**
   - Track `mid` → processed status
   - Prevent double-processing of batched/retried events

3. **Page subscription manager**
   - Called during Instagram OAuth completion
   - Subscribes each connected page to `messages` + `message_echoes`
   - Manages long-lived page access token storage

4. **Media downloader**
   - Background task triggered on attachment receipt
   - Downloads to object storage before URLs expire

5. **Temporal workflow trigger**
   - Converts raw webhook payload → structured `InstagramMessageEvent`
   - Signals or starts Temporal workflow for thread processing

### Token Storage (new table needed)

```sql
CREATE TABLE user_instagram_account (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    instagram_page_id TEXT NOT NULL UNIQUE,
    instagram_account_id TEXT NOT NULL,
    page_access_token TEXT NOT NULL,  -- encrypted at rest
    token_expires_at TIMESTAMPTZ,     -- NULL = non-expiring page token
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Summary

Meta's webhook system is **technically sound** for Cheerful's inbound-first use case. It provides real-time push delivery of Instagram DMs, with adequate reliability (at-least-once + retry), standard HMAC signature verification, and a well-documented integration path.

**Key requirements that affect Cheerful's architecture:**
1. Public HTTPS endpoint with <5s response time (already true on Fly.io)
2. App Review for `instagram_manage_messages` Advanced Access (2–10 days; blocking)
3. FB Page linkage per connected creator account (additional OAuth step)
4. Idempotent event processing (new `mid`-keyed deduplication)
5. Async processing pattern (aligns with existing Temporal workflow model)
6. Long-lived page access token management (new infra concern)
7. Ephemeral media download pipeline (new concern)

The webhook infrastructure itself is **not a blocker** — it's well-established and follows standard patterns Cheerful already uses (FastAPI, async background tasks, Temporal workflows). The primary blockers are the App Review process and FB Page requirement.

---

## Sources

- [Meta for Developers – Instagram Webhooks](https://developers.facebook.com/docs/instagram-platform/webhooks) *(official docs)*
- [Setup Meta Webhooks for Instagram Messaging – Medium](https://innocentanyaele.medium.com/setup-meta-webhooks-for-instagram-messaging-and-respond-to-message-4575bc95c7a2)
- [Instagram Webhooks – ngrok documentation](https://ngrok.com/docs/integrations/webhooks/instagram-webhooks)
- [How to build an Instagram for Business API integration – Rollout](https://rollout.com/integration-guides/instagram-for-business/quick-guide-to-implementing-webhooks-in-instagram-for-business)
- [Webhook event messaging_seen issue – RestFB GitHub](https://github.com/restfb/restfb/issues/1210)
- [Chatwoot Instagram integration issues – GitHub](https://github.com/chatwoot/chatwoot/issues/8333)
- [Instagram DMs webhooks work only in test mode – n8n Community](https://community.n8n.io/t/instagram-dms-webhooks-work-only-in-test-mode/176851)
- [Best Practices: Handling Facebook API Webhook Failures – MoldStud](https://moldstud.com/articles/p-best-practices-for-developers-handling-facebook-api-webhook-failures-effectively)
- [go-meta-webhooks package – pkg.go.dev](https://pkg.go.dev/github.com/pnmcosta/go-meta-webhooks)
