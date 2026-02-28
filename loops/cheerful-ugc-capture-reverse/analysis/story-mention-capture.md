# Instagram Story Mention Capture — Messaging API `mention` Events

**Aspect**: `story-mention-capture`
**Wave**: 1 — External Landscape
**Date**: 2026-02-28

---

## Overview

Instagram Story @mentions are the most valuable — and most technically constrained — UGC content type to capture. Stories expire after 24 hours, making automated real-time capture the only viable approach. Without automation, brands miss Story content permanently.

The capture mechanism is fundamentally different from all other UGC types:

| UGC Type | Delivery Mechanism | API System |
|----------|-------------------|------------|
| Feed post caption @mention | `mentions` webhook → `changes[]` | Graph API webhooks |
| Feed post photo-tag | Poll `/tags` endpoint | Graph API |
| Comment @mention | `mentions` webhook → `changes[]` | Graph API webhooks |
| **Story @mention** | **`mention` event → `messaging[]`** | **Messaging API (Messenger Platform)** |

**The critical architectural insight**: Story @mentions arrive through the **same Messaging API webhook** used for Instagram DMs. This means Story capture is structurally entangled with the IG DM integration that Cheerful is already building — the two features share webhook infrastructure.

---

## 1. Delivery Mechanism: Messaging API Webhook

### 1.1 How It Works

When a creator posts an Instagram Story that includes `@brandname` in the Story (via the mention sticker or typing @mention), a `mention` event fires on the **Messaging API webhook**. This is the Messenger Platform infrastructure — the same system that delivers DMs.

The event arrives in the `entry[].messaging[]` array (not `entry[].changes[]` like Graph API mention events):

```json
{
  "object": "instagram",
  "entry": [
    {
      "id": "17841405309211844",
      "time": 1580000000,
      "messaging": [
        {
          "sender": { "id": "123456789" },
          "recipient": { "id": "17841405309211844" },
          "timestamp": 1580000000,
          "mention": {
            "media_id": "17858893269000002",
            "media_type": "story"
          }
        }
      ]
    }
  ]
}
```

**Key payload fields**:

| Field | Value | Meaning |
|-------|-------|---------|
| `entry[].id` | Instagram Business Account ID | The brand that was mentioned |
| `messaging[].sender.id` | IGSID | Instagram-Scoped User ID of the creator who mentioned the brand |
| `messaging[].timestamp` | Unix timestamp | When the Story was posted |
| `messaging[].mention.media_id` | String | Instagram Media ID for the Story content |
| `messaging[].mention.media_type` | `"story"` | Confirms this is a Story mention (not DM) |

### 1.2 Distinguishing Story Mentions from DMs

Within the webhook handler, the routing key is the event object type:

```python
async def route_messaging_event(event: dict):
    if "message" in event:
        # Inbound DM (text, media attachment, etc.)
        await handle_dm_message(event)
    elif "mention" in event:
        # Story @mention — creator mentioned brand in their Story
        await handle_story_mention(event)
    elif "postback" in event:
        # Quick reply button tap
        await handle_postback(event)
    # Filter: skip echoes, reads, deliveries
```

The `mention` key is mutually exclusive with `message` in any given messaging event object. No disambiguation beyond key presence is needed.

### 1.3 Webhook Subscription Field

Story mentions are received by subscribing to the `mention` field (singular, distinct from the Graph API `mentions` field):

```python
# Page-level subscription (called during brand Instagram OAuth)
subscribed_fields = [
    # IG DM integration:
    "messages",
    "messaging_postbacks",
    "message_echoes",
    # Story mention capture (ADD THIS):
    "mention",
]

await httpx_client.post(
    f"https://graph.facebook.com/v22.0/{page_id}/subscribed_apps",
    params={
        "access_token": page_access_token,
        "subscribed_fields": ",".join(subscribed_fields),
    }
)
```

**Critical**: `mention` (singular) = Story mentions via Messaging API. `mentions` (plural) = caption/comment @mentions via Graph API webhooks. They are different fields in different systems.

**Required permissions** (same as IG DMs — no additional App Review needed):
- `instagram_manage_messages` (Advanced Access — App Review required)
- `pages_manage_metadata`
- `pages_messaging`
- `pages_show_list`

---

## 2. Fetching Story Media Content

### 2.1 Media Retrieval via `mentioned_media`

After receiving the `mention` event, the `media_id` can be used to fetch the Story's media content. The `mentioned_media` endpoint on the Graph API supports Story media IDs:

```
GET https://graph.facebook.com/v22.0/{ig-user-id}/mentioned_media
    ?media_id={story_media_id}
    &fields=id,media_type,media_url,timestamp
    &access_token={BRAND_PAGE_ACCESS_TOKEN}
```

This returns a media object for the Story:

```json
{
  "id": "17858893269000002",
  "media_type": "IMAGE",
  "media_url": "https://lookaside.fbsbx.com/ig_messaging_cdn/?asset_id=ABC123&signature=XYZ...",
  "timestamp": "2026-02-28T14:23:00+0000"
}
```

**Note**: `media_type` for Stories is either `IMAGE` (photo Story) or `VIDEO` (video Story). The CDN URL serves the static frame or video file.

### 2.2 CDN URL Format

Story media is served from Instagram's messaging CDN:
```
https://lookaside.fbsbx.com/ig_messaging_cdn/?asset_id={ASSET_ID}&signature={SIG}
```

This is different from the CDN used for feed post media (`scontent.cdninstagram.com`). The messaging CDN:
- Is "privacy-aware" — URL becomes invalid when Story expires
- Expires after **24 hours** from Story creation (not from when the URL was fetched)
- Requires no auth headers to download (authentication is embedded in the signature)
- Supports both image and video payloads

### 2.3 Fields Available for Story Mentions

| Field | Available | Notes |
|-------|-----------|-------|
| `id` | ✅ | Story media ID |
| `media_type` | ✅ | IMAGE or VIDEO |
| `media_url` | ✅ | CDN URL (expires 24h) |
| `timestamp` | ✅ | When Story was posted |
| `caption` | ❌ | Stories don't have captions in the same way |
| `permalink` | ❌ | Stories don't have public permalinks |
| `like_count` | ❌ | Not exposed via API |
| `owner` | ❌ | Creator identity comes from `sender.id` (IGSID) in webhook |
| `username` | ❌ | Must resolve IGSID to username via separate call |

**Identity resolution**: The creator's identity in the webhook is an IGSID (Instagram-Scoped User ID), not a username or public profile ID. To link to a Cheerful creator record, resolve via:
```
GET https://graph.facebook.com/v22.0/{igsid}
    ?fields=name,username,profile_pic
    &access_token={PAGE_ACCESS_TOKEN}
```

---

## 3. CDN URL Expiry and the Media Storage Problem

### 3.1 The 24-Hour Problem

Story content disappears after 24 hours — this is the core reason Story capture is difficult. The timeline:

```
T+0h:  Creator posts Story with @brand mention
T+0h:  Messaging API fires story_mention webhook event
T+0h:  Cheerful receives mention; calls mentioned_media → gets CDN URL
T+1h:  Brand team wants to see the Story in their UGC library
T+24h: Story expires on Instagram; CDN URL returns 404
T+48h: Creator checks their archive — their own Story content is gone
```

If Cheerful stores only the CDN URL and does NOT download the media:
- The UGC library can display the Story for up to 24 hours after posting
- After 24 hours, the CDN URL is dead — the Story is permanently gone from Cheerful's system

This fundamentally limits the usefulness of Story capture for a UGC library unless media is downloaded and stored.

### 3.2 Meta TOS on Story Media Storage: The Core Tension

Meta's Platform Terms and the Instagram Messaging API documentation contain an explicit restriction:

> **"It is not allowed to download, retain, or otherwise store the media content sent or made accessible by any user (or enable any third party to do so), and you must not do anything to circumvent expiration and/or removal of any link to such media content."**
> — Instagram Messaging API developer guidelines (via CM.com / third-party API platforms)

The operationally stated guidance is:
> **"If your app requires continued access to the media made available via the Instagram Messaging API, you must only store the privacy-aware CDN URL in your system."**

**Implication**: Following the TOS strictly means:
- Store CDN URL only, not the actual image/video bytes
- After 24 hours when CDN URL expires: Story is permanently gone from Cheerful's library
- A "permanent" UGC library of Stories is **not TOS-compliant**

### 3.3 The Grey Area: What Archive.com Appears to Do

Archive.com explicitly claims "100% capture of Instagram Stories" with a "library" that persists indefinitely. If they were strictly following Meta's CDN-only storage rule, Stories would disappear from their library after 24 hours — contradicting their product claims.

Archive's likely approach (unverified, inferred from their product):
1. Receive the `mention` event webhook
2. Immediately fetch the CDN URL via `mentioned_media`
3. **Download and store the media bytes** to their own storage
4. Serve the media from their own CDN in perpetuity

This appears to violate Meta's explicit prohibition. However:
- Meta has not publicly enforced this against UGC platforms operating at scale
- The spirit of the restriction may be protecting user DM media (private communications), not content that was explicitly directed at a brand via a public Story @mention
- Story @mentions are intentional public-adjacent actions (the creator chose to tag the brand) — different from private DM attachments
- Major brands and their legal teams review Archive's contracts; the lack of enforcement concern suggests either Meta tolerance or TOS ambiguity

**Three interpretive positions**:

| Position | Argument | Risk |
|----------|----------|------|
| **TOS-strict**: Store CDN URL only | CDN URL expires; Story gone after 24h | No TOS risk; library is ephemeral |
| **Good-faith download**: Download Story media when @mentioned | Creator explicitly directed content at brand; downloading before expiry preserves the consent-implied content | Low perceived risk; what Archive does |
| **Legal grey area**: Download and store indefinitely | Same as above | Moderate risk if Meta changes enforcement posture |

**For Cheerful's decision**: The TOS restriction likely targets DM media (private user communications), not Story mentions (which are public-ish content intentionally addressed to a brand account). The `mentioned_media` endpoint was explicitly designed to let brands access this content. The 24-hour window is Instagram's data retention policy, not necessarily a prohibition on brands archiving content directed at them. But this is legal judgment, not technical fact.

---

## 4. Content Coverage: What Is and Is Not Capturable

### 4.1 Stories Captured

| Story Type | Captured? | Mechanism | Notes |
|-----------|-----------|-----------|-------|
| Public account Story with @brand mention | ✅ | Messaging API `mention` event | Primary use case |
| Creator account Story with @brand mention | ✅ | Same | Creator accounts work same as Business |
| Private account Story with @brand mention | ⚠️ Only if brand follows creator | Messaging API `mention` event | Private accounts: webhook only fires if brand follows them |
| Story with @mention from private account who doesn't follow brand | ❌ | No webhook | Missed permanently |

### 4.2 Stories NOT Captured via Messaging API

| Story Type | Why Not Capturable | Alternative |
|-----------|-------------------|-------------|
| Story without any @mention of brand | No API event fires | AI visual detection (untagged) |
| Story using branded hashtag only | No Messaging API event for hashtags | Hashtag API doesn't cover Stories |
| Story that photo-tags brand (not @mention) | Photo-tags in Stories don't trigger Messaging API | No standard API coverage |
| Story from private account (if brand doesn't follow) | Webhook silent | No API mitigation |
| Story from account that blocked brand | No visibility | No API mitigation |
| Expired Story (retroactive) | Content deleted before capture | Time-bound: must be live at capture time |

**Critical coverage gap**: The Messaging API `mention` event only captures Stories where the creator uses the @mention sticker or types @brand. Stories that feature the brand via:
- Brand logo (no text mention)
- Product visible but not tagged
- Video content with brand name spoken but not typed

...are **completely invisible** to the Messaging API approach. These require AI visual/audio detection (separate aspect `ai-visual-detection`, `ai-audio-detection`).

### 4.3 Coverage Estimate

Among all Stories that mention a brand in any way:
- Stories with explicit @mention from public accounts: ~60–80% of brand-relevant Stories (estimated — creators mostly @mention when they want brands to notice)
- Stories from private accounts (brand follows them): +5–15% additional
- Untagged brand Stories: ~20–40% (these require AI detection)

For a typical influencer marketing brand:
- **Tagged Stories (capturable)**: likely 65–85% of total brand Story mentions
- **Untagged Stories**: remaining 15–35% (only Archive Radar / AI detection)

---

## 5. IG DM Integration Overlap — The Critical Architectural Insight

This is the most important finding for Cheerful's architecture planning.

### 5.1 Shared Infrastructure

Story mention capture and IG DM messaging use **exactly the same webhook infrastructure**:

```
SHARED between Story Capture and IG DM integration:
├── HTTPS webhook endpoint URL (POST /webhooks/instagram)
├── GET /webhooks/instagram (webhook verification / hub.challenge)
├── X-Hub-Signature-256 HMAC verification code
├── entry[].messaging[] array iteration
├── Brand Facebook Page requirement
├── Long-lived Page Access Token storage
├── App-level webhook subscription (/{APP_ID}/subscriptions, object=instagram)
├── Page-level subscription (/{PAGE_ID}/subscribed_apps)
├── Required permissions: instagram_manage_messages (App Review)
└── pages_messaging, pages_manage_metadata, pages_show_list
```

### 5.2 What Story Capture Adds Incrementally

```
INCREMENTAL work for Story capture (beyond IG DM infra):
├── Add "mention" to subscribed_fields in page-level subscription (+1 line)
├── "mention" routing branch in webhook dispatcher (~10 lines)
├── mentioned_media API call to fetch CDN URL from media_id
├── Media download activity (download CDN URL before 24h expiry)
├── Supabase Storage: store Story media bytes
├── ugc_content row creation for Story content
├── IGSID → creator resolution (also needed for DMs; may be shared)
└── Deduplication: (brand_id, ig_media_id) uniqueness
```

### 5.3 Subscription Field Map

| Webhook Field | Purpose | Shared? |
|--------------|---------|---------|
| `messages` | Inbound DMs | IG DM only |
| `messaging_postbacks` | Button taps | IG DM only |
| `message_echoes` | Outbound DM tracking | IG DM only |
| **`mention`** | **Story @mentions** | **Story capture only** |
| `mentions` (Graph API, different system) | Feed caption @mentions | UGC capture only |

### 5.4 Temporal Webhook Handler with Story Mention Routing

```python
@router.post("/webhooks/instagram")
async def instagram_webhook(request: Request, background_tasks: BackgroundTasks):
    body = await request.body()
    verify_signature(body, request.headers.get("X-Hub-Signature-256"))
    background_tasks.add_task(route_instagram_webhook, json.loads(body))
    return Response(status_code=200)

async def route_instagram_webhook(payload: dict):
    for entry in payload.get("entry", []):
        # Messaging API events (DMs + Story mentions share this path)
        for event in entry.get("messaging", []):
            if "message" in event and not event["message"].get("is_echo"):
                # Route 1: Inbound DM → DM processing workflow
                await trigger_dm_workflow(event)
            elif "mention" in event:
                # Route 2: Story @mention → UGC capture workflow
                await trigger_story_mention_workflow(event)

        # Graph API change events (@mentions in captions/comments)
        for change in entry.get("changes", []):
            if change["field"] == "mentions":
                # Route 3: Feed post mention → UGC capture
                await trigger_feed_mention_workflow(change["value"])
```

**Key property**: When a brand enables IG DM integration, Story mention capture is **automatically available** — it arrives on the same webhook. The incremental work is routing + storage, not infrastructure.

### 5.5 Story Capture = Free Rider on DM Integration

If Cheerful builds the IG DM integration first (per `cheerful-ig-dm-spec/`), Story mention capture requires:

1. Add `"mention"` to the page subscription call (1 line change)
2. Add a routing branch in the webhook handler (~10 lines)
3. New Temporal workflow: `StoryMentionWorkflow` (new work)
4. Story media download + Supabase Storage pipeline (new work — but identical pattern to DM media download, which is also needed)
5. `ugc_content` table row creation (new work shared with feed mention capture)

**Estimated incremental effort if IG DM infrastructure is built**: Small–Medium. The bottleneck is the media storage pipeline and TOS decision (whether to download), not the webhook infrastructure.

---

## 6. Delivery Constraints and Reliability

### 6.1 Same Guarantees as DM Webhooks

Since Story mentions use the same Messaging API webhook:
- **At-least-once delivery**: Duplicate `mention` events possible; deduplicate by `media_id`
- **Retry behavior**: Meta retries failed deliveries ~24 hours; after exhaustion, event dropped
- **Latency**: 1–60 seconds from Story post to webhook receipt (typical 1–5 seconds)
- **No replay mechanism**: Missed events are permanently lost; no backfill API

### 6.2 The Timing Criticality

Unlike DMs (where the content persists in the inbox), Story mention content has a hard 24-hour deadline:

```
Story posted → webhook fires → Cheerful receives event → fetch CDN URL → download media
← all of this must happen within 24 hours →
```

If Cheerful's webhook is down for >24 hours, any Story mentions during that window are **permanently unrecoverable**. No polling fallback exists — there is no endpoint to discover past Story mentions.

**Operational implication**: The webhook receiver must have high availability (99.9%+) because any downtime directly translates to permanent Story content loss.

### 6.3 24-Hour Download Window

If Cheerful downloads Story media (TOS grey area, but necessary for a permanent archive):
- Must download within 24 hours of Story creation (not within 24 hours of webhook receipt)
- The CDN URL might still be valid for the full 24h from Story creation regardless of when the webhook arrived
- Safe implementation: download within the same Temporal activity that processes the mention event

```python
@activity.defn
async def capture_story_media(
    brand_id: str,
    media_id: str,
    igsid: str,
    timestamp: int,
    page_access_token: str,
) -> str | None:
    """Fetch and store Story media within 24h window."""

    # Step 1: Get CDN URL via mentioned_media endpoint
    response = await graph_api_get(
        f"/{ig_user_id}/mentioned_media",
        params={
            "media_id": media_id,
            "fields": "id,media_type,media_url,timestamp",
        },
        access_token=page_access_token,
    )
    if not response or "media_url" not in response:
        return None

    cdn_url = response["media_url"]
    media_type = response["media_type"]  # IMAGE or VIDEO

    # Step 2: Download media before CDN URL expires
    content = await download_media(cdn_url)
    if content is None:
        return None

    # Step 3: Store to Supabase Storage
    ext = "jpg" if media_type == "IMAGE" else "mp4"
    storage_path = f"ugc-stories/{brand_id}/{media_id}.{ext}"
    await supabase_storage_upload(storage_path, content)

    # Step 4: Insert ugc_content record
    ugc_id = await upsert_ugc_content(
        brand_id=brand_id,
        ig_media_id=media_id,
        capture_source="story_mention",
        media_type=media_type,
        cdn_url=cdn_url,           # Store for reference
        stored_media_path=storage_path,  # Permanent copy
        creator_igsid=igsid,
        posted_at=datetime.fromtimestamp(timestamp, tz=timezone.utc),
    )
    return ugc_id
```

---

## 7. Meta TOS Summary and Risk Analysis

| Approach | TOS Compliance | Story Library Permanence | Precedent |
|----------|---------------|------------------------|-----------|
| **Store CDN URL only** | ✅ Compliant | ❌ Stories gone after 24h | TOS-safe but useless for UGC library |
| **Download on receipt, store permanently** | ⚠️ Grey area | ✅ Permanent archive | What Archive.com appears to do |
| **Screen-capture / scrape Stories** | ❌ Violates TOS | ✅ Permanent | Third-party scrapers; significant risk |

**The practical reality**: The entire UGC Story capture market appears to operate in the grey area. Archive's business model only works if they store Story media beyond CDN URL expiry. If Meta enforced TOS strictly against this use case, Archive's product would break.

The argument for the grey area interpretation:
1. The `mentioned_media` endpoint exists specifically for brands to access content where they're tagged
2. A creator @mentioning a brand is an intentional act of directing content at the brand
3. The TOS restriction is most defensible for DM media (private communications); Story @mentions are more public
4. No known enforcement action against UGC platforms storing Story mention content

**Recommended approach for Cheerful**: Take the same position as Archive — download and store Story media on receipt. Add language to Cheerful's privacy policy and brand terms noting this behavior. Monitor for any Meta policy changes.

---

## 8. Comparison: Story Mentions vs Other UGC Capture Methods

| Attribute | Story Mentions | Feed @Mentions | Photo Tags |
|-----------|---------------|---------------|------------|
| API system | Messaging API | Graph API webhooks | Graph API polling |
| Webhook field | `mention` | `mentions` | N/A (poll only) |
| Payload location | `messaging[]` | `changes[]` | N/A |
| Real-time? | Yes (1–60s) | Yes (1–60s) | No (5–15 min poll) |
| Creator opt-in? | No | No | No |
| Time pressure? | **24h deadline** | None (CDN URLs persist) | None |
| Polling fallback? | **No** | No | **Yes** |
| IG DM infra overlap | **100% shared** | Partial | None |
| Private accounts | Only if brand follows | Not accessible | Not accessible |
| Incremental effort | Small–Medium | Small | Medium |

---

## 9. Integration with Cheerful Architecture

### 9.1 New Components Required

| Component | Effort | Dependency on IG DM Integration |
|-----------|--------|--------------------------------|
| Add `mention` to subscribed_fields | Tiny | Requires IG DM infrastructure to exist |
| Story mention routing branch | Small | Built on existing webhook handler |
| `mentioned_media` Graph API call | Small | Same graph API client as DMs |
| Story media download activity | Medium | Same pattern as DM media download |
| Supabase Storage bucket for Stories | Small | Storage infra likely exists |
| `ugc_content` table + Story row | Medium | Shared with feed mention capture |
| IGSID → creator resolution | Small–Medium | Shared with IG DM creator matching |
| Deduplication by `(brand_id, ig_media_id)` | Small | New index on ugc_content |

### 9.2 Proposed `ugc_content` table entry for Stories

```sql
-- Extends existing ugc_content table (defined in graph-api-mentions-tags.md)
-- Story mentions add:
-- - cdn_url (may expire but store for reference)
-- - stored_media_path (permanent Supabase Storage copy)
-- - capture_source = 'story_mention'
-- - media_type = 'IMAGE' or 'VIDEO'
-- - posted_at set from webhook timestamp

INSERT INTO ugc_content (
    brand_id,
    ig_media_id,
    capture_source,
    media_type,
    cdn_url,           -- ephemeral; stored for reference/debugging
    stored_media_path, -- permanent copy in Supabase Storage
    creator_igsid,
    posted_at,
    captured_at
) VALUES (
    $brand_id,
    $media_id,
    'story_mention',
    $media_type,
    $cdn_url,
    $storage_path,
    $igsid,
    $posted_at,
    NOW()
)
ON CONFLICT (brand_id, ig_media_id) DO NOTHING;
```

### 9.3 Temporal Workflow Pattern

```
Instagram Story @mention posted by creator
→ Messaging API fires mention event on webhook
→ POST /webhooks/instagram (FastAPI, existing endpoint)
→ Return 200 immediately (signature verified)
→ background_tasks.add_task: route_instagram_webhook(payload)
→ Detect "mention" key → trigger StoryMentionWorkflow via Temporal
→ Temporal: capture_story_media_activity
    → GET /{ig_user_id}/mentioned_media?media_id=...
    → Download CDN URL (within 24h window)
    → Upload to Supabase Storage
    → Upsert ugc_content row
→ Temporal: resolve_creator_activity (IGSID → creator record)
→ Temporal: link_to_campaign_activity (optional: match to active campaign)
```

---

## 10. Effort Estimate

| Component | Effort | Notes |
|-----------|--------|-------|
| Story mention routing in webhook handler | Tiny | 1 if-branch; shared endpoint |
| `mention` field in page subscription | Tiny | 1 extra string in existing API call |
| `mentioned_media` API call activity | Small | Simple Graph API GET; same pattern as feed mentions |
| Media download + Supabase Storage | Medium | New pipeline; CDN URL → bytes → Storage |
| `StoryMentionWorkflow` (Temporal) | Medium | New workflow; pattern mirrors DM workflow |
| IGSID resolution | Small–Medium | Likely shared with DM integration |
| `ugc_content` table for Stories | Small | Reuses schema from feed mentions |
| Monitoring + alerting for 24h window | Medium | Alert if mention processing is delayed |
| TOS compliance decision + policy | Organizational | Not a technical blocker |

**Overall**: If IG DM webhook infrastructure is already built, Story mention capture is **Small–Medium additional effort**. The main work is the media download pipeline and Temporal workflow, not the webhook infrastructure.

If IG DM infrastructure is **not yet built**, Story mentions require building the full Messaging API infrastructure first — making the effort Large (but most of it serves DMs too).

---

## 11. Summary: Story Mention Capture Capability Assessment

| Attribute | Value |
|-----------|-------|
| **Delivery mechanism** | Messaging API `mention` event in `messaging[]` array |
| **Webhook field to subscribe** | `mention` (Messaging API) |
| **Content types capturable** | Photo Stories, Video Stories (both image and video @mentions) |
| **Content NOT capturable** | Untagged Stories, Stories from blocked accounts, Stories without @mention |
| **Private accounts** | Only if brand follows the creator |
| **Real-time?** | Yes (1–60s from post to webhook receipt) |
| **24-hour deadline** | Must download media within 24h of Story creation |
| **Polling fallback?** | **None** — if webhook misses it, content is gone |
| **Creator opt-in?** | **No** — brand's Page Access Token handles everything |
| **Permissions required** | `instagram_manage_messages` (App Review) — same as DMs |
| **Meta TOS on media storage** | Grey area — explicit prohibition on downloading; practical industry norm is to download |
| **IG DM infrastructure overlap** | **Highest possible overlap** — shares webhook endpoint, handler, subscription, token, permissions |
| **Incremental effort (if DM infra built)** | Small–Medium |
| **Key risk** | Webhook downtime = permanent content loss (no recovery); TOS uncertainty on media storage |
| **Archive.com approach** | Downloads and stores Story media permanently — the grey area position |

**Bottom line**: Story mention capture is the **lowest-incremental-cost, highest-business-value** addition Cheerful can make to its IG DM integration. If the brand connects Instagram for DMs, Story capture is nearly "free" — only the download pipeline and Temporal workflow are new. The 24-hour ephemeral nature makes automated capture essential (no manual recovery possible), which is also what makes it the most compelling differentiator vs. manual workflows.

---

## Sources

- `../cheerful-ig-dm-reverse/analysis/meta-webhooks-realtime.md` — Meta webhook architecture (prior analysis)
- `../cheerful-ig-dm-reverse/analysis/meta-instagram-messaging-api.md` — Messaging API capabilities (prior analysis)
- `analysis/graph-api-mentions-tags.md` — Graph API mentions endpoints (prior aspect)
- `analysis/webhooks-mentions.md` — Graph API mentions webhook (prior aspect)
- `../cheerful-hero-features/analysis/competitors/archive.md` — Archive competitor deep-dive
- [Instagram Messaging Inbound — CM.com API Docs](https://developers.cm.com/messaging/docs/instagram-messaging-inbound)
- [Instagram Message Support | Conversation API | Sinch](https://developers.sinch.com/docs/conversation/channel-support/instagram/message-support)
- [go-meta-webhooks package — Go Packages](https://pkg.go.dev/github.com/pnmcosta/go-meta-webhooks)
- [Archive.com Shopify App Store listing](https://apps.shopify.com/archive-app-ugc-instagram-stories-tiktok)
- [Instagram Story Scraper: Theory, Reality, and Alternatives — Data365.co](https://data365.co/blog/instagram-story-scraper)
- [Archive Instagram API Docs](https://app.archive.com/api/v2/docs)
