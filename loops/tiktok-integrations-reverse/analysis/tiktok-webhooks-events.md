# TikTok Webhooks & Events — Analysis

## Summary

TikTok has **three distinct webhook/event systems** that must not be conflated:

1. **Developer Platform Webhooks** (`developers.tiktok.com`) — app-level lifecycle events (4 event types)
2. **TikTok Shop Webhooks** (`partner.tiktokshop.com`) — commerce order/product events
3. **Events API** (`business-api.tiktok.com`) — outbound conversion data sent *to* TikTok (not inbound notifications)

Additionally, the **Business API** (Marketing/TCM) supports webhooks for ad-review status, leads, and Creator Marketplace orders — these appear to be under the same Developer Platform webhook infrastructure with expanded event types for connected Business accounts.

**Critical gap identified**: Only 4 event types exist on the core developer webhook platform. There are NO webhook events for new comments, new followers, video metrics updates, or profile changes. TikTok's real-time event surface is extremely narrow.

---

## System 1: Developer Platform Webhooks

**Documentation**: https://developers.tiktok.com/doc/webhooks-overview/
**Events reference**: https://developers.tiktok.com/doc/webhooks-events/

### Setup

1. Add "Webhooks" product to your app in the Developer Portal (may require Login Kit to be added first)
2. Register an HTTPS callback URL under the Webhooks section
3. By default, you are subscribed to **all available events** when a URL is configured (no selective subscription)
4. App must respond `200 OK` immediately upon receipt

### Supported Event Types (Complete List)

| Event | Trigger | Relevant API Product |
|-------|---------|---------------------|
| `authorization.removed` | User deauthorizes app, account deleted/banned/suspended, age change, or developer revokes | All (Login Kit) |
| `video.upload.failed` | Video uploaded via Content Posting API fails to upload | Content Posting API |
| `video.publish.completed` | Video uploaded via Content Posting API is published | Content Posting API |
| `portability.download.ready` | Data export via Data Portability API reaches "downloading" state | Data Portability API |

**Note from prior analysis**: The messaging/comments analysis confirmed there are NO webhook events for new comments, DMs, followers, live events, or metrics changes.

### Standard Payload Structure

All events share this base JSON envelope:

```json
{
  "client_key": "bwo2m45353a6k85",
  "event": "authorization.removed",
  "create_time": 1615338610,
  "user_openid": "act.example12345Example12345Example",
  "content": "{\"reason\": 1}"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `client_key` | string | Your app's client key (unique partner identifier) |
| `event` | string | Event name (e.g., `video.publish.completed`) |
| `create_time` | int64 | UTC epoch timestamp in seconds |
| `user_openid` | string | TikTok user's app-scoped identifier |
| `content` | string | **JSON-encoded string** (must be parsed after outer JSON parse) |

### Per-Event `content` Payloads

**`authorization.removed`**:
```json
{ "reason": 1 }
```
Reason codes:
- `0` = Unknown
- `1` = User disconnects from TikTok app
- `2` = User's account deleted
- `3` = User's age changed
- `4` = User's account banned
- `5` = Developer revoked authorization

**`video.upload.failed`**:
```json
{ "share_id": "video.6974245311675353080.VDCxrcMJ" }
```

**`video.publish.completed`**:
```json
{ "share_id": "video.6974245311675353080.VDCxrcMJ" }
```

**`portability.download.ready`**: `content` is a JSON object marshalled as a string (specific fields not publicly documented).

### Delivery Guarantees

| Property | Value |
|----------|-------|
| Delivery semantics | **At-least-once** (duplicates possible) |
| Retry window | **72 hours** |
| Retry strategy | Exponential backoff |
| Post-72h behavior | Notification permanently discarded |
| Idempotency required | Yes — must design for duplicate events |
| Protocol | HTTPS only (HTTP rejected) |

---

## System 2: Webhook Signature Verification

**Documentation**: https://developers.tiktok.com/doc/webhooks-verification

### Mechanism

TikTok uses **HMAC-SHA256** with your app's `client_secret` as the signing key. A `TikTok-Signature` header is included in every webhook request.

### Signature Header Format

```
TikTok-Signature: t=1633174587,s=18494715036ac4416a1d0a673871a2edbcfc94d94bd88ccd2c5ec9b3425afe66
```

- `t` = Unix timestamp (seconds) — included in signed payload to prevent replay attacks
- `s` = HMAC-SHA256 hex digest

### Verification Algorithm

```python
import hmac
import hashlib

def verify_tiktok_webhook(header: str, body: bytes, client_secret: str) -> bool:
    # Parse header
    parts = dict(p.split("=", 1) for p in header.split(","))
    timestamp = parts["t"]
    signature = parts["s"]

    # Construct signed payload: "{timestamp}.{raw_body}"
    signed_payload = f"{timestamp}.{body.decode('utf-8')}"

    # Compute HMAC-SHA256
    expected = hmac.new(
        client_secret.encode("utf-8"),
        signed_payload.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    # Timing-safe comparison
    return hmac.compare_digest(expected, signature)
```

### Security Recommendations

- Always verify signatures before processing events
- Check timestamp recency (reject events older than 5 minutes) to prevent replay attacks
- Use `hmac.compare_digest` (Python) or `crypto.timingSafeEqual` (Node.js) — never `==`
- Store `client_secret` in environment variables or secret manager, never in code

---

## System 3: TikTok Shop Webhooks

**Documentation**: https://partner.tiktokshop.com/docv2/page/tts-webhooks-overview
**Setup guide**: https://partner.tiktokshop.com/docv2/page/650512b42f024f02be19755f

### Overview

Separate webhook system within the TikTok Shop Partner Center. Configured independently from the Developer Portal webhooks. Handles commerce-specific events.

### Supported Event Types

| Event Type | Description |
|-----------|-------------|
| `ORDER_STATUS_CHANGE` | Order transitions to a new status (created → awaiting_shipment → shipped → delivered → completed/cancelled) |
| `RETURN_STATUS_CHANGE` | Return/refund request status changes |
| Product events | Inventory changes, listing approvals/rejections (exact event name not publicly documented) |
| Fulfillment events | Shipping label generation, package handoffs |
| Affiliate events | Affiliate order attribution, commission events |
| Shop management events | Shop verification status, policy violations |

**Note**: TikTok Shop Partner Center documentation requires JavaScript and a logged-in partner account for full event type listings. The above is derived from SDK implementations and community documentation.

### Webhook Management (Shop API)

Webhooks can be managed programmatically:
```
GET /webhooks/list          — list all registered webhooks
POST /webhooks/create       — register a webhook URL for an event_type
DELETE /webhooks/{event_type} — unsubscribe from specific event type
```

Unlike the Developer Platform, Shop webhooks support **selective subscription** (per event type).

### Payload Differences from Developer Platform

Shop webhook payloads have a different structure (not the same `content` string envelope). They include shop-specific identifiers (shop_id, order_id) and use HmacSHA256 request signing (same mandatory signing used by the Shop Open API).

---

## System 4: TikTok Events API (Conversion Tracking — Outbound)

**Documentation**: https://ads.tiktok.com/help/article/events-api
**Getting started**: https://ads.tiktok.com/help/article/getting-started-events-api

### Important Distinction

The Events API is **NOT** an inbound webhook system. It is a **server-to-server outbound API** where advertisers push event data *to TikTok* for ad optimization and conversion attribution. It is the inverse of the webhook pattern.

**Data flow**: Your server → TikTok (Events API)
**vs webhook flow**: TikTok → Your server (Developer Platform webhooks)

### Purpose

Share conversion actions (purchases, sign-ups, leads) from your backend with TikTok's ad platform for:
- Improved ad delivery and audience targeting optimization
- Capturing conversions missed by the browser pixel (ad blockers, iOS ITP)
- CRM and offline conversion import
- More accurate ROAS reporting

### Standard Events (Complete List)

| Event Name | Typical Use Case |
|-----------|-----------------|
| `ViewContent` | Product/page view |
| `AddToCart` | Cart addition |
| `InitiateCheckout` | Checkout started |
| `AddPaymentInfo` | Payment details entered |
| `Purchase` | Completed transaction |
| `CompleteRegistration` | Registration form submitted |
| `Search` | Search action performed |
| `AddToWishlist` | Save/bookmark action |
| `PlaceAnOrder` | Order placed (before payment) |
| `CompletePayment` | Payment confirmed |
| `Subscribe` | Subscription started |
| `Contact` | Contact form / inquiry |
| `DownloadApp` | App install |

### Authentication

Two approaches:
1. **Business-scoped access token** — generated via the Marketing API OAuth flow
2. **Events API-specific token** — generated in TikTok Ads Manager directly

### Payload Requirements

Each event must include **hashed match keys** for attribution (privacy-compliant):

```json
{
  "data": [{
    "event": "Purchase",
    "event_time": 1633174587,
    "user": {
      "email": "hashed_sha256_email",
      "phone": "hashed_sha256_phone",
      "ip": "1.2.3.4",
      "user_agent": "Mozilla/5.0..."
    },
    "properties": {
      "order_id": "order_123",
      "currency": "USD",
      "value": 99.99,
      "content_ids": ["product_sku_1"]
    }
  }]
}
```

### Deduplication with TikTok Pixel

TikTok recommends running **both pixel and Events API simultaneously** with shared `event_id` for deduplication. TikTok automatically deduplicates events that share the same `event_id` within a time window.

---

## System 5: Business/Marketing API — Additional Webhook Events

**Documentation**: https://business-api.tiktok.com/portal
**Context**: Per prior `tiktok-creator-marketplace-api` analysis

The Marketing/Business API extends the Developer Platform webhook system with additional event types for connected Business accounts. The official documentation states webhooks deliver real-time updates for:

- **Lead generation events** — new leads from TikTok Lead Gen Ads
- **Ad review status** — creative approved/rejected/under_review
- **Creator Marketplace (TikTok One) order events** — collaboration order status changes (pending → accepted → content_submitted → completed)

These events appear to use the same webhook infrastructure (HTTPS callback URL, same payload envelope, same HMAC-SHA256 verification) but are only triggered for Business accounts with the relevant products (Lead Gen, Ads, TCM) configured.

**Gap**: Specific event names (e.g., `lead.created`, `ad.review.approved`, `order.status_change`) are not publicly documented in the developer portal — available only after approved app integration.

---

## Consolidated Webhook Capability Map

### By API Product

| API Product | Webhook Events | Notes |
|-------------|---------------|-------|
| Login Kit / Authorization | `authorization.removed` | Fires for any connected app |
| Content Posting API | `video.upload.failed`, `video.publish.completed` | Post status callbacks |
| Data Portability API | `portability.download.ready` | Export lifecycle |
| TikTok Shop API | Order, Return, Product, Fulfillment, Affiliate events | Separate system — Shop Partner Center |
| Marketing API (Ads) | Lead generation, ad review events | Business accounts only |
| Creator Marketplace (TCM/TikTok One) | Order lifecycle events | Beta access |
| Display API | ❌ None | No content metric change events |
| Research API | ❌ None | Batch query only, no push events |
| Messaging / Comments API | ❌ None | No comment or DM events |
| Live API | ❌ None | No official live event API |

### By Event Category

| Category | Available? | Where |
|----------|-----------|-------|
| User auth/deauth | ✅ Yes | Developer Platform |
| Video publish lifecycle | ✅ Yes | Developer Platform |
| Commerce orders | ✅ Yes | Shop Partner Center |
| Ad review status | ✅ Yes (Business accounts) | Business API |
| Lead generation | ✅ Yes (Business accounts) | Business API |
| TCM collaboration orders | ✅ Yes (Beta) | Business API |
| New comments | ❌ No | Not available |
| New followers | ❌ No | Not available |
| Video metrics updates | ❌ No | Not available |
| Live stream events | ❌ No | Not available |
| Profile changes | ❌ No | Not available |
| DMs received | ❌ No | Not available |

---

## Subscription Management

### Developer Platform

- **Configuration**: Developer Portal → App → Webhooks → Callback URL
- **Scope**: Global (all events) — no per-event filtering
- **Prerequisite**: Login Kit must be added first (in some app configurations)
- **Testing**: Developer Portal has built-in test event sender; ngrok recommended for local development

### TikTok Shop

- **Configuration**: Shop Partner Center → Webhook configuration
- **Scope**: Selective (per event_type subscription)
- **Management**: Programmatic via Shop API (`/webhooks/` endpoints)

### Rate Limits / Volume

No documented rate limits on incoming webhook delivery. Practical limits come from your callback server capacity. Events are delivered as they occur (not batched).

---

## Implementation Patterns

### Recommended Endpoint Handler (Python/FastAPI)

```python
from fastapi import FastAPI, Request, HTTPException
import hmac, hashlib

app = FastAPI()

@app.post("/webhooks/tiktok")
async def tiktok_webhook(request: Request):
    # 1. Read raw body (before JSON parsing)
    body = await request.body()

    # 2. Verify signature
    sig_header = request.headers.get("TikTok-Signature", "")
    if not verify_signature(sig_header, body, CLIENT_SECRET):
        raise HTTPException(status_code=401, detail="Invalid signature")

    # 3. Parse and dispatch (return 200 FIRST if processing is slow)
    payload = json.loads(body)
    event_type = payload.get("event")
    content = json.loads(payload.get("content", "{}"))

    # 4. Idempotent processing (check if already processed)
    await dispatch_event(event_type, payload["user_openid"], content)

    return {"status": "ok"}  # Must return 200

def verify_signature(header: str, body: bytes, secret: str) -> bool:
    parts = dict(p.split("=", 1) for p in header.split(","))
    signed = f"{parts['t']}.{body.decode()}"
    expected = hmac.new(secret.encode(), signed.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, parts.get("s", ""))
```

### Async Processing Pattern

For slow event processing, acknowledge immediately (200 OK) and dispatch to a background queue:
```python
# Return 200 immediately, enqueue for processing
background_tasks.add_task(process_event, event_type, content)
return {"status": "accepted"}
```

This matches Cheerful's Temporal workflow architecture — webhook receipt → Temporal activity enqueue → durable processing.

---

## Access Requirements

### Developer Platform Webhooks

| Requirement | Details |
|-------------|---------|
| App registration | Yes — developers.tiktok.com |
| App review | Yes — standard review (3–5 days) |
| Login Kit prerequisite | Yes — required before adding Webhooks product |
| Business verification | No — individual developer apps supported |
| HTTPS required | Yes — HTTP callback URLs rejected |
| Cost | Free |

### TikTok Shop Webhooks

| Requirement | Details |
|-------------|---------|
| Shop seller account | Yes |
| App registration | Via Shop Partner Center (separate from Developer Portal) |
| App review | Yes — Shop-specific review |
| Cost | Free (webhook delivery) |

### Business/Marketing API Webhooks (Leads, Ad Review, TCM)

| Requirement | Details |
|-------------|---------|
| TikTok For Business account | Yes |
| Marketing API access | Yes — 5–7 day review |
| Ad account linked | Yes (for ad review events) |
| TikTok One access | Yes (for TCM order events — gated beta) |

---

## Regional Availability

| System | Regions |
|--------|---------|
| Developer Platform Webhooks | Global |
| TikTok Shop Webhooks | Shop-available countries only (US, UK, DE, FR, IT, ES, IE, JP, SG, ID, MY, TH, VN, PH, MX, BR) |
| Events/Conversion API | Global; some attribution features US/EU-specific |
| Business API Webhooks (Leads) | Global, except where Business Messaging restricted |

---

## Cheerful Applicability

### High Value

| Use Case | Webhook Event | Applicability |
|----------|--------------|---------------|
| Creator deauth detection | `authorization.removed` | Detect when a connected creator disconnects — trigger re-auth workflow |
| Content post confirmation | `video.publish.completed` | Confirm that a campaign post went live; update campaign status |
| Content post failure recovery | `video.upload.failed` | Alert creator/campaign manager; retry logic |
| Campaign content tracking | Shop `ORDER_STATUS_CHANGE` | If Cheerful clients use TikTok Shop, track affiliate order attribution |
| TCM collaboration tracking | TCM order events | Track campaign order progression (accepted → submitted → completed) |

### Medium Value

| Use Case | Webhook Event | Applicability |
|----------|--------------|---------------|
| Lead attribution tracking | Lead generation events | If clients run Lead Gen Ads, real-time lead ingestion |
| Spark Ads creative approval | Ad review events | Know when boosted creator content clears review |

### Low Value / Not Applicable

| Gap | Reason |
|-----|--------|
| Real-time follower/metric tracking | No webhook events exist for this |
| New comment notifications | No webhook events for comments |
| Creator discovery via webhooks | Impossible — push-only for authorized users |

### Integration Architecture for Cheerful

```
TikTok Webhook → FastAPI endpoint (/webhooks/tiktok)
    → Verify HMAC-SHA256 signature
    → Return 200 OK immediately
    → Enqueue to Temporal workflow
        → authorization.removed → mark creator as disconnected, notify outreach team
        → video.publish.completed → fetch video details via Display API, link to campaign
        → video.upload.failed → trigger retry workflow or alert
```

The webhook endpoint would be a thin receiver — doing only verification + queue dispatch. Actual processing happens in Temporal activities, consistent with how Cheerful's existing Apify/Gmail integrations work.

### Missing Capabilities (Not Solvable via Webhooks)

TikTok webhooks cannot substitute for polling in these cases — must use scheduled Display API pulls:
- Periodic video metrics updates (view counts, likes)
- New video detection (creator posted something new)
- Follower count changes
- Profile enrichment updates

---

## Sources

- [TikTok Webhooks Overview](https://developers.tiktok.com/doc/webhooks-overview/)
- [TikTok Webhook Events Reference](https://developers.tiktok.com/doc/webhooks-events/)
- [TikTok Webhook Signature Verification](https://developers.tiktok.com/doc/webhooks-verification)
- [TikTok Shop Partner Center — Webhooks Overview](https://partner.tiktokshop.com/docv2/page/tts-webhooks-overview)
- [TikTok Shop — Order Status Change Webhook](https://partner.tiktokshop.com/docv2/page/1-order-status-change)
- [TikTok Events API (Ads)](https://ads.tiktok.com/help/article/events-api)
- [TikTok Events API — Getting Started](https://ads.tiktok.com/help/article/getting-started-events-api)
- [TikTok Standard Events & Parameters](https://ads.tiktok.com/help/article/standard-events-parameters)
- [TikTok API for Business Portal](https://business-api.tiktok.com/portal)
- [ngrok TikTok Webhooks Integration Guide](https://ngrok.com/docs/integrations/webhooks/tiktok-webhooks)
