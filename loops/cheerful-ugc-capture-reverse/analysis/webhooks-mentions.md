# Instagram Webhook `mentions` Field — Real-Time Push Notification for @Mentions

**Aspect**: `webhooks-mentions`
**Wave**: 1 — External Landscape
**Date**: 2026-02-28

---

## Overview

Instagram's webhook infrastructure exposes two **completely separate** mention-notification mechanisms, and confusing them is the most common integration mistake:

| Webhook System | Field | Payload Location | Trigger | Content Types |
|---------------|-------|-----------------|---------|---------------|
| Graph API webhooks | `mentions` (plural) | `entry[].changes[]` | Caption or comment @mention in a public feed post | Feed posts, carousels, comments |
| Messaging API webhooks | `mention` (singular) | `entry[].messaging[]` | @mention of brand's account in a creator's **Story** | Stories only |

This analysis focuses on the **Graph API `mentions` field** (caption/comment @mentions). The Messaging API `mention` field (Story mentions) is documented separately in `story-mention-capture.md` and is architecturally identical to the IG DM webhook already analyzed in `../cheerful-ig-dm-reverse/analysis/meta-webhooks-realtime.md`.

---

## 1. The `mentions` Webhook Field (Graph API)

### 1.1 What It Detects

The `mentions` field fires whenever another Instagram user's **public post caption or comment** contains `@{brand_username}`. It does NOT cover:
- Stories (separate Messaging API event)
- Photo-tags (tagged in the image itself — no webhook; requires polling `/tags`)
- Private account posts
- Stories without explicit @mention

### 1.2 Subscription Setup

Subscribe at the app level (same endpoint, different `fields` parameter):

```http
POST https://graph.facebook.com/{APP_ID}/subscriptions
  ?object=instagram
  &callback_url=https://your-server.com/webhooks/instagram
  &fields=mentions
  &verify_token=YOUR_VERIFY_TOKEN
  &access_token={APP_ID}|{APP_SECRET}
```

Then subscribe each connected page at the page level:

```http
POST https://graph.facebook.com/{PAGE_ID}/subscribed_apps
  ?access_token={PAGE_ACCESS_TOKEN}
  &subscribed_fields=mentions
```

**Required permissions** (Advanced access, App Review required):
- `instagram_basic`
- `instagram_manage_comments`
- `pages_manage_metadata`
- `pages_show_list`
- Potentially `pages_messaging` (undocumented requirement reported by developers)

### 1.3 Webhook Payload Format

The `mentions` event arrives in the `changes[]` array (not `messaging[]`), making it structurally distinct from all Messaging API events:

```json
{
  "object": "instagram",
  "entry": [
    {
      "id": "17841405309211844",
      "time": 1580000000,
      "changes": [
        {
          "field": "mentions",
          "value": {
            "media_id": "17858893269000123",
            "comment_id": null
          }
        }
      ]
    }
  ]
}
```

**Caption mention vs. comment mention** — distinguished by `comment_id`:

| Scenario | `media_id` | `comment_id` | Meaning |
|----------|-----------|-------------|---------|
| @mention in post caption | Present | `null` or absent | Caption of that post contains @brand |
| @mention in a comment | Present | Present | A comment on that post contains @brand |

**Routing logic**:
```python
def handle_mentions_event(value: dict):
    media_id = value.get("media_id")
    comment_id = value.get("comment_id")  # None = caption mention

    if comment_id is None:
        # Caption mention: fetch full media with mentioned_media endpoint
        fetch_mentioned_media(media_id)
    else:
        # Comment mention: fetch comment details with mentioned_comment endpoint
        fetch_mentioned_comment(comment_id, media_id)
```

After receiving the webhook, the details are fetched via:

**Caption mention → fetch media details**:
```
GET /{ig-user-id}/mentioned_media
    ?media_id={media_id}
    &fields=id,caption,media_type,media_url,timestamp,permalink,like_count,comments_count
    &access_token={BRAND_PAGE_ACCESS_TOKEN}
```

**Comment mention → fetch comment details**:
```
GET /{ig-user-id}/mentioned_comment
    ?comment_id={comment_id}
    &fields=text,timestamp,from
    &access_token={BRAND_PAGE_ACCESS_TOKEN}
```

### 1.4 What Content Types are Covered

| Content Type | Webhook Fires? | Notes |
|-------------|---------------|-------|
| Feed photo caption @mention | ✅ | Primary use case |
| Feed video caption @mention | ✅ | |
| Carousel caption @mention | ✅ | |
| Reels caption @mention | ⚠️ Uncertain | Documentation inconsistent |
| Comment @mention (on any public post) | ✅ | `comment_id` is populated |
| Story @mention | ❌ | Use Messaging API `mention` field |
| Photo-tag (tagged in image) | ❌ | No webhook; poll `/tags` endpoint |
| Private account posts | ❌ | Not accessible |

---

## 2. Delivery Guarantees

### 2.1 At-Least-Once Delivery

Like all Meta webhooks, the `mentions` field uses **at-least-once delivery**:
- Duplicate events possible (same mention delivered twice if server returned non-2xx or timed out)
- Events NOT guaranteed to arrive in order
- Implementation MUST be idempotent

**Deduplication strategy**: Use `(media_id, comment_id)` as a composite key:
```python
async def process_mention(media_id: str, comment_id: str | None) -> None:
    key = f"{media_id}:{comment_id or 'caption'}"
    # Check/insert into deduplication table with ON CONFLICT DO NOTHING
    if not await dedup_store.try_insert(key):
        return  # Already processed
    # ... continue processing
```

### 2.2 Retry Behavior

Meta retries failed deliveries (non-2xx responses or timeouts >5–10s) with exponential backoff over ~24 hours. After retry exhaustion, the event is permanently dropped.

**Implication**: The webhook receiver must be highly available. Cheerful's Fly.io deployment needs stable uptime during business hours when UGC volume is highest.

### 2.3 Known Production Reliability Issues

Developer communities report several production gaps:

| Issue | Severity | Detail |
|-------|----------|--------|
| Silent failures in Live Mode | High | Webhooks work in dev but silently drop in production — requires full App Review completion, not just approval |
| Story mentions from private accounts | High | Only fire if private-account creator follows the brand |
| Undocumented permission requirements | Medium | `pages_messaging` may be required even for `mentions` subscription |
| Latency under load | Medium | 1–5 seconds typical; up to 30–60 seconds during Meta API congestion |
| No event replay | High | Meta provides no replay API; missed events are lost unless polling catches them |
| Dropped events during downtime | High | If server is down and retries exhaust, event lost permanently |

---

## 3. Webhook vs. Polling Comparison

### 3.1 For @Mentions (Caption/Comment)

| Dimension | Webhook (`mentions` field) | Polling (`mentioned_media`) |
|-----------|--------------------------|----------------------------|
| Latency | Near-real-time (1–60s) | Delayed by poll interval (minutes) |
| Discovery mechanism | Push (Meta detects and notifies) | Pull (requires knowing `media_id` first) |
| Polling viable? | **No** — `mentioned_media` requires a `media_id`; no collection endpoint exists | N/A — you can't poll for unknown mentions |
| Rate limit impact | Minimal (only API calls after receipt) | Consumes BUC quota (200 calls/hr/brand) |
| Reliability | At-least-once with retry; can miss events on downtime | Controlled; always catches up on next poll |
| Event gaps on downtime | **Yes** — events permanently lost after retry exhaustion | **No** — backlog caught on next poll |
| Duplicate handling | Required | Not needed |

**Critical difference from `/tags`**: For photo-tagged posts, you CAN poll the `/tags` endpoint to discover new content. For @mention posts, you **cannot poll** — there is no collection endpoint. `mentioned_media` requires you to already know the `media_id`. This makes the `mentions` webhook **effectively mandatory** for @mention capture; there is no polling fallback for new @mentions.

### 3.2 For Photo Tags

| Dimension | Webhook | Polling (`/tags`) |
|-----------|---------|------------------|
| Webhook available? | **No** — no webhook fires for photo-tags | ✅ Full collection endpoint |
| Recommended approach | N/A | Poll every 5–15 minutes |

### 3.3 Hybrid Strategy (Recommended)

Given the complementary gaps in each approach:

```
Webhook (mentions field)     → Primary: catches @mentions in near-real-time
Polling (/tags)              → Primary: catches photo-tags (no webhook available)
Polling (/tags) on schedule  → Secondary: reconciliation for missed @mentions via
                               tags endpoint (only catches photo-tags, not @mentions)
```

**Important**: Polling `/tags` does NOT provide a fallback for missed @mention webhooks — only the webhook catches @mentions. This means @mention capture has inherent reliability dependence on webhook uptime. Graceful degradation strategy: if webhook processing shows gaps, alert and investigate; cannot be recovered via polling.

---

## 4. Integration with Cheerful / IG DM Infrastructure

### 4.1 Two Webhook Systems, One Endpoint URL

Both webhook types can share the same HTTPS callback URL (`POST /webhooks/instagram`). The payload structure differentiates them:

```python
@router.post("/webhooks/instagram")
async def instagram_webhook(request: Request, background_tasks: BackgroundTasks):
    body = await request.body()
    # Signature verification (same for both systems)
    verify_signature(body, request.headers.get("X-Hub-Signature-256"))

    payload = json.loads(body)
    background_tasks.add_task(route_instagram_webhook, payload)
    return Response(status_code=200)

async def route_instagram_webhook(payload: dict):
    for entry in payload.get("entry", []):
        # Route 1: Messaging API events (DMs, Story mentions, postbacks)
        for messaging_event in entry.get("messaging", []):
            await handle_messaging_event(messaging_event)

        # Route 2: Graph API change events (@mentions in captions/comments)
        for change in entry.get("changes", []):
            if change["field"] == "mentions":
                await handle_caption_comment_mention(change["value"])
```

**Key architectural point**: The `changes[]` and `messaging[]` paths are mutually exclusive in any given payload. A single webhook POST will contain either messaging events OR changes events, not both. The routing is clean.

### 4.2 Subscription Setup Overlap with IG DM Integration

| Subscription Component | IG DM Integration | `mentions` Webhook | Shared? |
|----------------------|-------------------|-------------------|---------|
| App-level subscription (`/{APP_ID}/subscriptions`) | `fields=messages,messaging_postbacks,message_echoes` | `fields=mentions` | Same endpoint; different fields |
| Page-level subscription (`/{PAGE_ID}/subscribed_apps`) | `subscribed_fields=messages,...` | `subscribed_fields=mentions` | Same endpoint; can be combined |
| Callback URL | Same | Same | ✅ Shared |
| Verify token | Same | Same | ✅ Shared |
| HMAC signature verification | `X-Hub-Signature-256` | `X-Hub-Signature-256` | ✅ Shared code |
| Long-lived page access token | Required | Required | ✅ Shared |
| FB Page requirement | Required | Required | ✅ Shared |

**Incremental work to add `mentions`**: Very small. The `mentions` field is simply added to the existing `POST /{PAGE_ID}/subscribed_apps` call's `subscribed_fields` parameter. No new subscription infrastructure needed.

**However**: The app-level subscription requires `instagram_manage_comments` permission in addition to the `instagram_manage_messages` permission needed for DMs. These are separate App Review submissions or can be combined in one submission.

### 4.3 What's Shared vs. New vs. Separate

```
SHARED with IG DM integration:
├── HTTPS webhook endpoint URL
├── Signature verification code
├── Webhook routing boilerplate (entry[] iteration)
├── Long-lived page access token storage
├── FB Page linkage requirement
└── App-level subscription infrastructure

NEW for @mention capture (incremental):
├── `mentions` field added to page-level subscription
├── `changes[]` routing branch in webhook handler
├── `mentioned_media` API call (fetch details after webhook)
├── `mentioned_comment` API call (for comment @mentions)
└── `instagram_manage_comments` App Review permission

SEPARATE from IG DM integration (non-overlapping):
├── `mentions` webhook field vs `messages`/`mention` fields — different event types
└── Payload routing: changes[] vs messaging[] — different code paths
```

---

## 5. Subscription Configuration for Cheerful

### 5.1 Combined Subscription Call

When a brand connects their Instagram account, Cheerful should subscribe to ALL needed fields in a single call:

```python
async def subscribe_instagram_account(
    page_id: str,
    page_access_token: str,
) -> None:
    """Called during brand Instagram OAuth completion."""

    # Subscribe page to all relevant webhook fields
    subscribed_fields = [
        # For IG DM integration:
        "messages",
        "messaging_postbacks",
        "message_echoes",
        # For UGC @mention capture:
        "mentions",
    ]

    response = await httpx_client.post(
        f"https://graph.facebook.com/v22.0/{page_id}/subscribed_apps",
        params={
            "access_token": page_access_token,
            "subscribed_fields": ",".join(subscribed_fields),
        }
    )
    response.raise_for_status()
```

### 5.2 App-Level Subscription (One-Time)

```python
async def configure_app_webhook_subscription(
    app_id: str,
    app_secret: str,
) -> None:
    """One-time setup for the Meta app."""
    response = await httpx_client.post(
        f"https://graph.facebook.com/{app_id}/subscriptions",
        params={
            "object": "instagram",
            "callback_url": "https://api.cheerful.com/webhooks/instagram",
            "fields": "messages,messaging_postbacks,message_echoes,mentions",
            "verify_token": settings.WEBHOOK_VERIFY_TOKEN,
            "access_token": f"{app_id}|{app_secret}",
        }
    )
    response.raise_for_status()
```

---

## 6. Temporal Workflow Integration

### 6.1 Pattern

The `mentions` webhook follows the same async pattern as DM webhooks:

```
Instagram @mention event
→ POST /webhooks/instagram (FastAPI)
→ Return HTTP 200 immediately (after signature verification)
→ Enqueue to async processing
→ Temporal activity: fetch mentioned_media / mentioned_comment details
→ Temporal activity: deduplicate against existing ugc_content records
→ Temporal activity: download media to Supabase Storage
→ Temporal activity: link to brand + creator entity
```

### 6.2 Proposed Temporal Activity

```python
@activity.defn
async def process_mention_webhook_event(
    ig_user_id: str,
    media_id: str,
    comment_id: str | None,
    brand_id: str,
    page_access_token: str,
) -> str | None:
    """Fetch full mention details after receiving webhook."""

    if comment_id is None:
        # Caption mention
        endpoint = f"/{ig_user_id}/mentioned_media"
        params = {"media_id": media_id, "fields": "id,caption,media_type,media_url,timestamp,permalink,like_count,comments_count,owner"}
    else:
        # Comment mention
        endpoint = f"/{ig_user_id}/mentioned_comment"
        params = {"comment_id": comment_id, "fields": "text,timestamp,from"}

    response = await graph_api_get(endpoint, params, page_access_token)
    if response is None:
        return None

    # Upsert into ugc_content table
    ugc_id = await upsert_ugc_content(
        brand_id=brand_id,
        ig_media_id=media_id,
        capture_source="mention_webhook",
        data=response,
    )
    return ugc_id
```

---

## 7. Limitations and Gaps

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| No polling fallback for @mentions | If webhook misses an event, it's gone | Monitor webhook delivery rate; alert on gaps |
| Stories not covered | Major content type missing | Separate `story-mention-capture` via Messaging API |
| Photo-tags not covered | Photo-tag UGC must use `/tags` polling | Covered by separate polling workflow |
| Private account posts invisible | Significant % of creators use private accounts | No API mitigation; accept the gap |
| Reels coverage uncertain | Unknown if Reels @mentions trigger `mentions` webhook | Test empirically during integration |
| App Review required | 2–10 day blocking delay before production | Plan for in launch timeline |
| At-least-once delivery | Duplicate UGC items possible | Deduplication by `(brand_id, ig_media_id)` |
| No event replay | Can't recover lost events | Graceful degradation; log gaps |
| Private-account Story mentions | Story `mention` webhook doesn't fire for private creators who don't follow brand | Accept as platform limitation |

---

## 8. Effort Estimate

| Component | Effort | Notes |
|-----------|--------|-------|
| Add `mentions` to webhook subscription | Tiny | One additional field in existing subscription call |
| `changes[]` routing branch in webhook handler | Small | New `if` branch in existing handler |
| `mentioned_media` / `mentioned_comment` API calls | Small | Simple Graph API GET with brand token |
| Deduplication (vs existing UGC) | Small | Key: `(brand_id, ig_media_id)` |
| `instagram_manage_comments` App Review | External — 2–10 days | Can be combined with `instagram_manage_messages` review |
| Testing/validation in dev mode | Small–Medium | Only tester accounts trigger events |
| Monitoring for missed events | Medium | Alert infrastructure for gap detection |

**Overall incremental effort**: Small. If IG DM webhook infrastructure is already built, adding `mentions` is minimal incremental work — primarily adding a subscription field and a new routing branch in the handler.

---

## 9. Summary: Capability Assessment

| Attribute | Value |
|-----------|-------|
| What it detects | Public feed post caption @mentions, comment @mentions |
| What it misses | Stories, photo-tags, Reels (uncertain), private accounts |
| Real-time? | Yes (1–60s latency typical) |
| Polling fallback for missed events? | **No** — @mentions cannot be polled retroactively |
| Delivery guarantee | At-least-once (duplicates possible, missed events possible on downtime) |
| Creator opt-in required | **No** — uses brand's own token |
| Rate limit impact | Low — webhook receipt is free; only API calls after receipt count |
| Permissions | `instagram_manage_comments` (App Review required) |
| Integration with IG DM infrastructure | **High overlap** — same callback URL, same subscription setup, same token management |
| Incremental effort (if IG DM built) | **Very small** — add one field to subscription, one routing branch |
| Risks | No polling fallback, App Review delay, private account gap |

**Bottom line**: The `mentions` webhook is the **only viable mechanism** for real-time @mention detection — there is no polling alternative. It integrates trivially with the IG DM webhook infrastructure already planned for Cheerful. The primary risk is the at-least-once delivery model with no replay mechanism; missed events during downtime are unrecoverable. Pairing with `/tags` polling (which covers photo-tags) provides complementary coverage for the two main feed-content UGC types.

---

## Sources

- [Meta Developer Docs: Instagram Webhooks Reference](https://developers.facebook.com/docs/graph-api/webhooks/reference/instagram)
- [Instagram Graph API Complete Developer Guide 2026 — Elfsight](https://elfsight.com/blog/instagram-graph-api-complete-developer-guide-for-2026/)
- [Setup Meta Webhooks for Instagram Messaging — Innocent Anyaele, Medium](https://innocentanyaele.medium.com/setup-meta-webhooks-for-instagram-messaging-and-respond-to-message-4575bc95c7a2)
- [Instagram Webhooks — ngrok documentation](https://ngrok.com/docs/integrations/webhooks/instagram-webhooks)
- [How to Build an Instagram for Business API Integration — Rollout](https://rollout.com/integration-guides/instagram-for-business/quick-guide-to-implementing-webhooks-in-instagram-for-business)
- [Monitoring Comment, Caption Mentions on the New Instagram Graph API — Candid](https://www.getcandid.com/blog/2018/04/13/monitoring-comment-caption-mentions-on-the-new-instagram-graph-api/)
- [GitHub: autoGiftCard — Mentions webhook payload example](https://github.com/rachitpareek/autoGiftCard)
- [New IG comments webhook fields — RestFB GitHub Issue #1202](https://github.com/restfb/restfb/issues/1202)
- [Instagram Creator Account – Webhook for Comments Not Firing — n8n Community](https://community.n8n.io/t/instagram-creator-account-webhook-for-comments-not-firing-to-n8n/182907)
- [Instagram DMs Webhooks Work Only in Test Mode — n8n Community](https://community.n8n.io/t/instagram-dms-webhooks-work-only-in-test-mode/176851)
- [Is There a Webhook Available to Watch for 'New Posts' on Instagram? — GitHub Community](https://github.com/orgs/community/discussions/113223)
- [Troubleshooting Common Instagram API Issues — Phyllo](https://www.getphyllo.com/post/troubleshooting-common-issues-with-instagram-api)
- Meta Webhooks Realtime Analysis (prior loop): `../cheerful-ig-dm-reverse/analysis/meta-webhooks-realtime.md`
- Graph API Mentions-Tags Analysis (prior aspect): `analysis/graph-api-mentions-tags.md`
