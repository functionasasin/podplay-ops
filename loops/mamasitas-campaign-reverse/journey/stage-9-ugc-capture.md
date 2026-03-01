# Stage 9: UGC Capture

## What Happens

By Day 25, creators are posting. Stage 8's `PostTrackingWorkflow` already knows that `@filipinafoodie` posted a Reel and `@kutsaranimelinda` posted a carousel — it scraped their public profiles via Apify and matched the posts by caption keyword or LLM vision.

But the brand rep also wants:
1. **The actual media files** — Mama Sita's marketing team wants to reshare the Reel on @MamaSitasOfficial Stories; they need the video file or at minimum a download URL that doesn't expire.
2. **Story content** — `@pinoyrecipes2026` posted an unboxing Story on Day 23 that Stage 8 completely missed. Stories are the most common format for food creator product reveals and expire in 24 hours.
3. **Hashtag-based discovery** — `@sabawculture` (22K followers) posted a Sinigang recipe reel using `#MamaSitas` and `#SinigangMix` but forgot to @mention the account. Stage 8 won't find them (they weren't in the campaign's opted-in creator list); hashtag monitoring would.
4. **Real-time push** — Stage 8's Apify poller runs every 24 hours. When `@filipinafoodie` posts on Tuesday at 2pm, the brand rep doesn't find out until Wednesday at 2am. UGC capture via Instagram webhooks would surface the content within 60 seconds.

UGC Capture (Stage 9) is the **official-API complement** to Stage 8's Apify polling. Both stages write to separate tables and serve different purposes:

| Stage | Mechanism | Table | What It Knows |
|-------|-----------|-------|---------------|
| Stage 8 | Apify profile scraper (daily poll) | `creator_post` | Which opted-in creators posted; engagement counts |
| Stage 9 | Official Instagram API (push + poll) | `ugc_content` | Brand-tagged/mentioned content with media files; Stories before expiry |

For Mama Sita's concretely: when `@filipinafoodie` (Maria Santos, 12K) posts her Reel captioning "Sinigang sa Sampalok with Mama Sita's Sinigang Mix 🍲 @MamaSitasOfficial", the Messaging API `mentions` webhook fires within seconds and Cheerful stores the media URL for download. Her unboxing Story from Day 23 — "@MamaSitasOfficial sent me the most amazing care package!!" — was also caught by the Story `mention` event on the Messaging API webhook. Both pieces of content are now in the Mama Sita's UGC library with media files attached.

**Coverage comparison for Mama Sita's campaign:**

| Content Type | Stage 8 (Apify) | Stage 9 (Official API) | Notes |
|-------------|-----------------|----------------------|-------|
| Feed posts (@mention in caption) | ✅ caption match | ✅ mentions webhook | Stage 9 is real-time (60s vs 24h) |
| Reels | ✅ caption + LLM vision | ⚠️ uncertain in mentions webhook | Stage 8 is stronger for Reels |
| Carousels | ✅ (first image only) | ✅ full carousel metadata | Stage 9 has all children |
| Stories (@mention) | ❌ not captured | ✅ story_mention event | Stage 9 exclusive |
| Photo-tagged posts | ⚠️ LLM vision only | ✅ /tags polling | Stage 9 is authoritative |
| Hashtag posts (#MamaSitas) | ❌ (only opted-in creators) | ✅ Hashtag API | Stage 9 exclusive |
| Opted-in creator feed posts (no mention) | ✅ Apify + LLM | ❌ no API event fires | Stage 8 exclusive |

**Target by Day 49 of campaign**: UGC library populated with:
- All feed posts where creators @mentioned @MamaSitasOfficial (Layer 1B)
- All Stories where creators mentioned @MamaSitasOfficial (Layer 1A) — real-time, before 24h expiry
- All posts where @MamaSitasOfficial was photo-tagged (Layer 1C)
- Posts from non-campaign creators using #MamaSitas or #SinigangRecipe (Layer 2)

---

## Cheerful Feature Mapping

| Action | CE Tool / Feature | Status | Source |
|--------|------------------|--------|--------|
| Enable UGC capture on brand IG account | `cheerful_enable_ugc_capture(ig_account_id, layers=["story", "mentions", "tags", "hashtags"])` | **gap** | Gap 46 — no UGC enable tool; `ugc_content` table does not exist |
| View UGC library for this campaign | `cheerful_list_ugc_content(campaign_id="campaign-uuid-mamasitas", limit=100)` | **gap** | Gap 47 — no `ugc_content` table; no CE tool |
| View a specific UGC piece with media URL | `cheerful_get_ugc_item(ugc_id)` | **gap** | Gap 47 |
| Link unattributed UGC to campaign | `cheerful_attribute_ugc_to_campaign(ugc_id, campaign_id)` | **gap** | Gap 48 — no attribution tool |
| View Story mentions (before 24h expiry) | `cheerful_list_ugc_content(capture_source="story_mention", captured_since="2026-03-17T00:00:00Z")` | **gap** | Gap 47 + Gap 46 |
| Subscribe `mention` field for Story events | Backend: add `"mention"` to page subscription `subscribed_fields` | **gap** | `../../cheerful-ugc-capture-reverse/analysis/story-mention-capture.md` §5.3 — 1-line change; requires IG DM infra first |
| Subscribe `mentions` field for feed caption @mentions | Backend: Graph API webhook field subscription | **gap** | `../../cheerful-ugc-capture-reverse/analysis/graph-api-mentions-tags.md` §2 — separate webhook system (`changes[]`); new handler |
| Poll `/tags` for photo-tagged posts | Backend: `UGCTagPollingWorkflow` (Temporal, every 15min per brand) | **gap** | `../../cheerful-ugc-capture-reverse/analysis/graph-api-mentions-tags.md` §1 |
| Monitor #MamaSitas, #SinigangRecipe hashtags | Backend: `HashtagMonitoringWorkflow` (Temporal, every 2–4hr) | **gap** | `../../cheerful-ugc-capture-reverse/analysis/hashtag-monitoring.md`; requires `instagram_public_content_access` App Review |
| Receive real-time Story mention event | Backend: `StoryMentionWorkflow` (Temporal); webhook routing branch | **gap** | `../../cheerful-ugc-capture-reverse/analysis/story-mention-capture.md` §5 |
| Download Story media before 24h CDN expiry | Backend: `capture_story_media_activity` → Supabase Storage | **gap** | `../../cheerful-ugc-capture-reverse/analysis/story-mention-capture.md` §6.3 |
| Download feed post media for UGC library | Backend: `download_and_store_media` (reusable from IG DM infra) | **gap (reuse)** | `../../cheerful-ugc-capture-reverse/analysis/synthesis/options-catalog.md` §12 |
| Deduplicate UGC across Stage 8 (Apify) and Stage 9 (official API) | Backend: UNIQUE index `(user_ig_dm_account_id, instagram_post_id)` | **gap** | `../../cheerful-ugc-capture-reverse/analysis/synthesis/options-catalog.md` §6 |
| App Review: `instagram_manage_comments` (Layer 1B/1C) | External: Meta review process (2–4 weeks) | **gap (external)** | `../../cheerful-ugc-capture-reverse/analysis/synthesis/options-catalog.md` §7 |
| App Review: `instagram_public_content_access` (Layer 2 hashtags) | External: Meta review process (4–6 weeks) | **gap (external)** | `../../cheerful-ugc-capture-reverse/analysis/synthesis/options-catalog.md` §7 |

---

## Detailed Flow

### Architecture: Hybrid Layered for Mama Sita's Campaign

The UGC capture loop recommends **Option D: Hybrid Layered** as the correct Cheerful architecture. For the Mama Sita's campaign specifically, the relevant layers are:

```
Layer 1A: Story @mentions   ← rides on IG DM Messaging API webhook (nearly free)
Layer 1B: Feed @mentions    ← Graph API mentions webhook (changes[] routing branch)
Layer 1C: Photo-tag polling ← /tags polling workflow (15min cadence)
Layer 2:  Hashtag monitoring ← #MamaSitas, #SinigangRecipe, #LutongPinoy polling
[Layer 3: AI Radar]         ← not needed: Stage 8 Apify+LLM already covers opted-in creators
```

All layers write to `ugc_content` table with `capture_source` field. Stage 8's `creator_post` table remains separate — the two tables serve different roles (creator-campaign tracking vs brand UGC library).

**What the brand rep experiences (fully-built state)**:

```
Brand rep → Slack: "How many UGC pieces have we collected for Mama Sita's?"
CE: cheerful_list_ugc_content(
    campaign_id="campaign-uuid-mamasitas",
    limit=100
)
→ Returns 47 UGC pieces:
  - 38 feed posts (12 @caption mentions, 16 photo-tags, 10 hashtag-only posts from non-campaign creators)
  - 9 Stories (all captured real-time before 24h expiry)
```

---

### Phase A: Pre-Campaign — Enable UGC Capture (Day 0, alongside Campaign Setup)

UGC capture must be configured when the brand connects their Instagram account. Since Mama Sita's developer is the brand rep, this happens at Stage 1 alongside the IG account connection.

In the fully-built Cheerful system:

```
User → Slack: "Enable full UGC capture for @MamaSitasOfficial"
CE: cheerful_enable_ugc_capture(
    ig_account_id="ig-account-uuid-mamasitas",
    layers=["story_mention", "feed_mention", "photo_tag", "hashtag"],
    hashtags=["#MamaSitas", "#SinigangRecipe", "#LutongPinoy", "#HomeCooking"],
    campaign_id="campaign-uuid-mamasitas"
)
→ Activates:
  - Layer 1A: "mention" field added to page subscription → StoryMentionWorkflow ready
  - Layer 1B: "mentions" Graph API webhook subscription → FeedMentionWorkflow ready
  - Layer 1C: UGCTagPollingWorkflow scheduled (every 15min for this brand)
  - Layer 2: HashtagMonitoringWorkflow scheduled (4-slot budget for 4 hashtags, every 2h)
→ Response: { layers_active: ["story_mention", "feed_mention", "photo_tag", "hashtag"], hashtag_slots_used: 4 }
```

**In the current gap state**: `cheerful_enable_ugc_capture` does not exist. `ugc_content` table does not exist. No Temporal workflows for UGC exist. Stage 8's `PostTrackingWorkflow` is the only active content monitor. All UGC capture infrastructure is a gap. See §Gaps.

---

### Phase B: Story Mention Capture (Real-Time, Days 25-49)

Layer 1A operates on the same Messaging API webhook that handles IG DMs. The routing branch is:

```python
# POST /webhooks/instagram — existing handler
async def route_instagram_webhook(payload: dict):
    for entry in payload.get("entry", []):
        for event in entry.get("messaging", []):
            if "message" in event and not event["message"].get("is_echo"):
                await trigger_dm_workflow(event)          # existing DM flow
            elif "mention" in event:
                await trigger_story_mention_workflow(event)  # NEW: Story capture
```

**Concrete example — Day 26, 11:14am Manila time**:

`@pinoyrecipes2026` (Jo Reyes, 31K followers) posts an Instagram Story: a video of her opening the Mama Sita's package, @mentioning `@MamaSitasOfficial` with the mention sticker.

```
T+0s:   Story posted by @pinoyrecipes2026 with @MamaSitasOfficial mention sticker
T+4s:   Messaging API fires mention event on POST /webhooks/instagram
T+4s:   Cheerful returns 200; enqueues StoryMentionWorkflow via Temporal

StoryMentionWorkflow activities:
  1. capture_story_media_activity:
       media_id = "17858893269000099"
       igsid = "123456789"  (Jo Reyes's IGSID)
       → GET /{ig-user-id}/mentioned_media?media_id=17858893269000099
         → media_url: "https://lookaside.fbsbx.com/ig_messaging_cdn/?asset_id=XYZ&signature=..."
         → media_type: "VIDEO"
       → Download 4.2MB video file immediately (before 24h CDN expiry)
       → Upload to Supabase Storage: "ugc-stories/ig-account-uuid-mamasitas/17858893269000099.mp4"
       → Insert ugc_content row:
           brand_id: "brand-uuid-mamasitas"
           ig_media_id: "17858893269000099"
           capture_source: "story_mention"
           media_type: "VIDEO"
           cdn_url: "https://lookaside.fbsbx.com/..."  (for reference; expires T+24h)
           stored_media_path: "ugc-stories/.../17858893269000099.mp4"  (permanent)
           creator_igsid: "123456789"
           posted_at: "2026-03-25T03:14:00Z"
           campaign_id: "campaign-uuid-mamasitas"  (auto-attributed via active campaign)

  2. resolve_igsid_activity (shared with DM infra):
       igsid "123456789" → resolved to creator_id "creator-uuid-pinoyrecipes2026"
       → Update ugc_content.creator_id

  3. link_to_campaign_activity:
       creator "creator-uuid-pinoyrecipes2026" is in campaign "campaign-uuid-mamasitas"
       → Confirm campaign_id attribution
       → Update creator_post stats if needed
```

**Slack notification (if Gap 44 is also built)**:
```
📱 New Story mention captured!
@pinoyrecipes2026 (31K) mentioned @MamaSitasOfficial in a Story
Video Story — captured before expiry ✅
[View in UGC library] [View creator profile]
```

**24h window**: The CDN URL expires 24 hours after the Story was posted — NOT after Cheerful received the webhook. Temporal's `start_to_close_timeout` for `capture_story_media_activity` is set to `timedelta(hours=20)` to give a 4-hour safety margin. If the activity fails, retry within the 20-hour window.

---

### Phase C: Feed @Mention Capture (Real-Time, Days 25-49)

Layer 1B fires when a creator writes `@MamaSitasOfficial` in their caption. This uses the Graph API `mentions` webhook — a different system from the Messaging API:

```
Creator posts: "Sinigang sa Sampalok using Mama Sita's Sinigang Mix 🍲 @MamaSitasOfficial ..."
→ Graph API fires webhook on POST /webhooks/instagram (changes[] envelope):
{
  "entry": [{
    "changes": [{
      "field": "mentions",
      "value": { "media_id": "17858893999000123", "comment_id": null }
    }]
  }]
}
→ FeedMentionWorkflow:
  1. GET /{ig-user-id}/mentioned_media?media_id=17858893999000123
     → caption: "Sinigang sa Sampalok using Mama Sita's Sinigang Mix..."
     → media_type: "IMAGE"
     → permalink: "https://www.instagram.com/p/DaB1c2d3/"
     → like_count: 412
     → comments_count: 47
     → owner.id: (creator's numeric IG user ID)
  2. Download thumbnail to Supabase Storage (permanent copy)
  3. Insert ugc_content row (capture_source: "mention_webhook")
  4. Attribute to campaign via creator handle lookup
```

**For Mama Sita's campaign context**: In Stage 6 (Negotiation), creators were asked to `@mention @MamaSitasOfficial` in their caption. Creators who follow this brief will trigger Layer 1B in real-time. Creators who use `#MamaSitas` only (no @mention) will be caught by Layer 2 (hashtag), not Layer 1B.

**Estimated trigger rate**: ~60-70% of the 25 expected posting creators will @mention the brand (per Stage 6 brief adherence). That's ~15-18 feed mention events.

---

### Phase D: Photo-Tag Polling (Every 15 Minutes, Days 25-49)

Layer 1C polls the `/tags` endpoint every 15 minutes. Unlike `mentioned_media` (webhook-first), `/tags` returns a collection:

```
UGCTagPollingWorkflow (Temporal, scheduled):
  Every 15 minutes per brand:
  → GET /{ig-user-id}/tags
      ?fields=id,caption,media_type,media_url,permalink,like_count,comments_count,owner,timestamp
      &limit=50
  → Cursor-paginated until no more results or last seen cursor reached
  → For each new media_id: INSERT INTO ugc_content ON CONFLICT DO NOTHING
```

**Photo-tag vs @mention**: When `@kutsaranimelinda` posts a carousel and physically tags @MamaSitasOfficial in the image (the label that appears on the image itself — the "tag someone" feature, not the @mention in caption), that fires `/tags` but NOT the `mentions` webhook. These are separate actions a creator can take.

**Reels gap**: Per `../../cheerful-ugc-capture-reverse/analysis/graph-api-mentions-tags.md` §1, Reels photo-tags are NOT returned by the `/tags` endpoint. This is a confirmed Instagram API gap. Reels with captions mentioning @MamaSitasOfficial are caught by Layer 1B; Reels where the brand is photo-tagged in the video itself are not caught by any official API path. Stage 8's LLM vision is the only coverage for untagged Reels.

---

### Phase E: Hashtag Monitoring — #MamaSitas + Filipino Food Tags (Days 0-49)

Layer 2 catches content from creators who weren't in the gifting campaign but post about Mama Sita's organically.

**For Mama Sita's, the hashtag config** (using `cheerful_enable_ugc_capture` hashtags param):
```
Primary:   #MamaSitas         (brand hashtag)
Secondary: #SinigangRecipe    (product recipe tag)
Category:  #LutongPinoy       (Filipino home cooking)
Category:  #HomeCooking       (broader food content)
```

**30-hashtag constraint**: The Instagram Hashtag API caps brands at 30 unique hashtags in a 7-day rolling window. With 4 hashtags for Mama Sita's, this is well within budget (other brands on the platform share the same per-account limit, but limits are per Instagram account).

**Discovery of organic creators**: Layer 2 will surface creators like `@sabawculture` (22K) who posted a Sinigang recipe using `#MamaSitas` without being in the gifting campaign. These are brand advocates who can be added to future campaigns.

**Hashtag API limitations**: Only catches public feed photos and image carousels. Reels are excluded. Stories are excluded. So Layer 2 is complementary to Layer 1, not a replacement.

---

### Phase F: Viewing the UGC Library via CE

In the fully-built state, the brand rep checks the UGC library:

```
User → Slack: "Show me all UGC we've collected for Mama Sita's campaign"
CE: cheerful_list_ugc_content(
    campaign_id="campaign-uuid-mamasitas",
    limit=100,
    sort="captured_at_desc"
)
→ Returns ugc_content records:

{
  "items": [
    {
      "id": "ugc-uuid-001",
      "capture_source": "story_mention",
      "media_type": "VIDEO",
      "stored_media_path": "ugc-stories/ig-account-uuid-mamasitas/17858893269000099.mp4",
      "creator_handle": "pinoyrecipes2026",
      "creator_name": "Jo Reyes",
      "posted_at": "2026-03-25T03:14:00Z",
      "captured_at": "2026-03-25T03:14:04Z",  ← 4s latency!
      "permalink": null,  ← Stories have no public permalink
      "like_count": null  ← Stories don't expose likes via API
    },
    {
      "id": "ugc-uuid-002",
      "capture_source": "mention_webhook",
      "media_type": "IMAGE",
      "permalink": "https://www.instagram.com/p/DaB1c2d3/",
      "media_url": "https://scontent.cdninstagram.com/...",
      "stored_media_path": "ugc-media/ig-account-uuid-mamasitas/17858893999000123.jpg",
      "creator_handle": "filipinafoodie",
      "creator_name": "Maria Santos",
      "caption": "Sinigang sa Sampalok with Mama Sita's Sinigang Mix 🍲 @MamaSitasOfficial...",
      "like_count": 412,
      "comments_count": 47,
      "posted_at": "2026-03-26T14:30:00Z",
      "captured_at": "2026-03-26T14:30:08Z"
    },
    {
      "id": "ugc-uuid-003",
      "capture_source": "hashtag",
      "media_type": "IMAGE",
      "permalink": "https://www.instagram.com/p/DbX9q2r1/",
      "creator_handle": "sabawculture",
      "creator_name": null,  ← hashtag API may not return username
      "caption": "Sinigang na baboy! Used #MamaSitas mix — super authentic ang lasa...",
      "like_count": 872,
      "posted_at": "2026-03-28T09:15:00Z",
      "captured_at": "2026-03-28T10:02:00Z",
      "campaign_id": null   ← organic creator, not in campaign
    }
  ],
  "total": 47,
  "by_source": {
    "story_mention": 9,
    "mention_webhook": 18,
    "tags_polling": 10,
    "hashtag": 10
  }
}
```

CE renders in Slack:
```
*Mama Sita's UGC Library — 47 pieces captured*

By type:
  📱 Stories: 9  (captured before expiry)
  📸 Feed @mentions: 18  (real-time)
  🏷️ Photo-tags: 10  (15min polling)
  #️⃣ Hashtag posts: 10  (organic, non-campaign creators)

Most recent:
  @filipinafoodie — Feed post — 412 likes, 47 comments — Mar 26
  https://instagram.com/p/DaB1c2d3/

  @pinoyrecipes2026 — Story (VIDEO, 31K) — Mar 25 ✅ saved

  @sabawculture — Hashtag post — 872 likes — Mar 28 (organic)
  https://instagram.com/p/DbX9q2r1/
```

---

### Phase G: UGC-Campaign Attribution

The `ugc_content` table stores `campaign_id` when the creator is a campaign participant. For hashtag-captured organic creators (like `@sabawculture`), `campaign_id` is NULL initially. The brand rep can attribute these:

```
User → Slack: "Link @sabawculture's post to the Mama Sita's campaign"
CE: cheerful_attribute_ugc_to_campaign(
    ugc_id="ugc-uuid-003",
    campaign_id="campaign-uuid-mamasitas"
)
→ Updates ugc_content.campaign_id
→ Optionally: creates a creator record for @sabawculture in Cheerful
```

**Attribution algorithm (automated)**: When UGC arrives via webhook or polling, `link_to_campaign_activity` checks whether `owner.username` or resolved handle matches any creator in active campaigns. If yes: auto-attribute. If no: `campaign_id = NULL` (brand-level UGC). This is the same attribution algorithm spec'd in `../../cheerful-ugc-capture-reverse/analysis/current-campaign-ugc-link.md`.

---

## CE Tool Calls (Exact)

### `cheerful_enable_ugc_capture` — activate UGC monitoring

```
Parameters:
  ig_account_id: "ig-account-uuid-mamasitas"
  layers: ["story_mention", "feed_mention", "photo_tag", "hashtag"]
  hashtags: ["#MamaSitas", "#SinigangRecipe", "#LutongPinoy", "#HomeCooking"]
  campaign_id: "campaign-uuid-mamasitas"  ← optional; enables auto-attribution

Expected response:
  layers_active: ["story_mention", "feed_mention", "photo_tag", "hashtag"]
  hashtag_slots_used: 4
  hashtag_slots_remaining: 26
  warnings: []  ← would warn if App Review not yet approved for instagram_manage_comments

What user does:
  Verify all 4 layers are active
  Note hashtag slots used (budget 30/7-day rolling window)
  Run at Stage 1 (campaign setup) or immediately before Stage 8 (content tracking)
```

### `cheerful_list_ugc_content` — browse UGC library

```
Parameters:
  campaign_id: "campaign-uuid-mamasitas"  ← filter to campaign (NULL = all brand UGC)
  capture_source: null  ← optional filter: "story_mention"|"mention_webhook"|"tags_polling"|"hashtag"
  limit: 100
  offset: 0
  sort: "captured_at_desc"

Expected response shape:
  items[*].id:                UUID
  items[*].capture_source:    "story_mention" | "mention_webhook" | "tags_polling" | "hashtag"
  items[*].media_type:        "IMAGE" | "VIDEO"
  items[*].permalink:         Instagram URL | null (Stories have no permalink)
  items[*].stored_media_path: Supabase Storage path (permanent)
  items[*].media_url:         CDN URL (may be expired for Stories; use stored_media_path)
  items[*].caption:           Caption text | null (Stories may not have captions)
  items[*].like_count:        integer | null
  items[*].comments_count:    integer | null
  items[*].creator_handle:    "@handle" | null
  items[*].creator_id:        UUID | null (null if creator not in Cheerful yet)
  items[*].posted_at:         ISO 8601
  items[*].captured_at:       ISO 8601
  items[*].campaign_id:       UUID | null
  total: integer
  by_source: { story_mention: N, mention_webhook: N, tags_polling: N, hashtag: N }

What user does:
  Assess total UGC count by source
  Filter by capture_source="story_mention" to see Story content specifically
  Note permalink for feed posts → share with Mama Sita's marketing team
  Note that Stories have no permalink; access via stored_media_path (Supabase URL)
```

### `cheerful_get_ugc_item` — view single UGC piece with download link

```
Parameters:
  ugc_id: "ugc-uuid-001"

Expected response:
  id: "ugc-uuid-001"
  capture_source: "story_mention"
  media_type: "VIDEO"
  stored_media_url: "https://supabase-project.supabase.co/storage/v1/object/sign/ugc-stories/.../mp4?token=..."
    ← signed URL (temporary) to the permanent Supabase Storage copy
  cdn_url: "https://lookaside.fbsbx.com/..." (may be expired)
  creator: { handle: "pinoyrecipes2026", name: "Jo Reyes", followers: 31000 }
  posted_at: "2026-03-25T03:14:00Z"
  captured_at: "2026-03-25T03:14:04Z"
  campaign_id: "campaign-uuid-mamasitas"
  rights_status: null  ← rights management not in MVP; future feature

What user does:
  Use stored_media_url to download the Story video for resharing
  Pass permalink to Mama Sita's marketing team for engagement (feed posts)
  Note rights_status is null — brand rep must follow up with creator for formal rights grant
```

### `cheerful_attribute_ugc_to_campaign` — link organic UGC to campaign

```
Parameters:
  ugc_id: "ugc-uuid-003"
  campaign_id: "campaign-uuid-mamasitas"

Expected response: { ugc_id: "ugc-uuid-003", campaign_id: "campaign-uuid-mamasitas", updated: true }

What user does:
  Run when organic creators (hashtag-captured, not in campaign) produce relevant content
  Allows Stage 10 (ROI measurement) to count organic UGC toward campaign totals
```

---

## IG-Specific Considerations

### Two Webhook Systems — One Endpoint

The Mama Sita's campaign uses two different Instagram webhook flows that both hit `POST /webhooks/instagram`:

```
SAME endpoint, DIFFERENT envelope:

Messaging API (DMs + Story mentions):
  payload.entry[].messaging[]  ← "message" for DMs; "mention" for Stories

Graph API webhooks (feed caption @mentions):
  payload.entry[].changes[]   ← field="mentions" for caption @mentions

Routing logic:
  if "messaging" in entry → check for "message" or "mention"
  if "changes" in entry → check field == "mentions"
```

The two webhook systems require separate subscriptions:
- **Messaging API** `mention` field: subscribed via `/{PAGE_ID}/subscribed_apps` (same call that enables DMs)
- **Graph API** `mentions` field: subscribed via `/{APP_ID}/subscriptions?object=instagram&fields=mentions`

Both require `instagram_manage_messages` (for Story mentions) or `instagram_manage_comments` (for feed mentions) at Advanced Access level — meaning App Review must be completed before production use.

### Story CDN URL Expiry — Hard Constraint

Every Story mention event fires a 24-hour countdown. If Cheerful's webhook is down:
- DMs: the creator's message is still in the thread; Cheerful can replay from Message Management API
- Story mentions: **permanently lost** — no replay mechanism, no polling fallback

For Mama Sita's campaign (32 opted-in creators, ~10-15 expected Story posters), downtime risk is manageable. But the operational SLA matters: any webhook downtime >24h during the campaign window means Story content is gone forever. The brand would see 0 Story captures for the downtime period.

### Photo-Tag Approval Setting

If Mama Sita's Instagram account has "Manually Approve Tags" enabled in Instagram settings, all photo-tags from creators require the brand to approve them before they appear in the `/tags` API response. Brand rep should verify this setting is set to "Add Automatically" before the campaign starts.

### Hashtag API — Not Retroactive

The Hashtag API returns up to 50 recent public posts. If a creator posted `#MamaSitas` before `HashtagMonitoringWorkflow` was activated, that post may not be returned by subsequent polls (depends on recency). Layer 2 should be enabled at campaign launch (Day 0) to maximize coverage — not after creators start posting.

### Meta App Review Timing

For Mama Sita's campaign (launching on Day 0 / early March):
- `instagram_manage_comments` App Review: must be started in parallel with campaign setup; takes 2-4 weeks
- `instagram_public_content_access` App Review: must be started simultaneously; takes 4-6 weeks; **will likely miss the Day 0-25 window entirely**

**Realistic timeline for this campaign**:
- Day 0-14 (if App Reviews not complete): Only Layer 1A (Story mentions) is available — it shares permissions with IG DM (`instagram_manage_messages`)
- Day 14-21 (if `instagram_manage_comments` approved): Layer 1B and 1C come online
- Day 35+ (if `instagram_public_content_access` approved): Layer 2 hashtag monitoring comes online

App Reviews must begin before campaign launch for full UGC coverage from Day 1.

### Deduplication: Stage 8 + Stage 9

When `@filipinafoodie` posts a feed post:
- Stage 8's `PostTrackingWorkflow` detects it via Apify and creates a `creator_post` record
- Stage 9's `FeedMentionWorkflow` detects the @mention and creates a `ugc_content` record

These are two different records in two different tables describing the same Instagram post. They can be linked via the `instagram_post_id` field (`ig_media_id` in `ugc_content`, `instagram_post_id` in `creator_post`). This deduplication is not currently spec'd — both tables exist in parallel for their respective purposes.

**When brand rep asks "how many posts did we collect?"**: The answer differs by system:
- Stage 8 answer: N creator_post records (opted-in creators only; Apify-polled)
- Stage 9 answer: M ugc_content records (all @mentions + photo-tags + hashtag posts; official API)
- Deduplicated answer: Stage 9 M + Stage 8 records not in Stage 9 (opted-in creator posts without @mention or photo-tag)

---

## Gaps & Workarounds

| # | Gap | Impact | Workaround | Build Priority |
|---|-----|--------|------------|---------------|
| 46 | `ugc_content` table does not exist — no schema, no storage layer for official API UGC | Entire Stage 9 is structurally blocked; all official API capture has nowhere to write | Stage 8's `creator_post` table partially fills the gap (Apify-based, no Stories) | P0 — foundational; spec in `ugc-capture-reverse/analysis/graph-api-mentions-tags.md` §7 |
| 47 | `cheerful_list_ugc_content`, `cheerful_get_ugc_item`, `cheerful_enable_ugc_capture` CE tools do not exist | Brand rep cannot access UGC library via CE; cannot enable capture via Slack | No CE workaround; direct Supabase query or webapp (not built either) | P0 — 3 new CE tools; requires Gap 46 first |
| 48 | `cheerful_attribute_ugc_to_campaign` CE tool does not exist — no way to link organic UGC to a campaign | Organic creator content (hashtag-discovered, not in campaign) cannot be attributed to Mama Sita's campaign for ROI | Manual tracking in Google Sheets; note `instagram_post_id` and attribute manually | P1 — useful for organic UGC discovery; requires Gap 46 first |
| 49 | `StoryMentionWorkflow` not built — Story mentions never captured | Stories are permanently lost; ~9 expected Story posts from 32 creators are invisible to Cheerful | Manual: brand rep follows each creator on Instagram; Screenshots Stories manually. No automated path | P0 — Story capture is the highest-value differentiated feature; incremental cost is small if IG DM infra is built |
| 50 | `FeedMentionWorkflow` not built — feed @mentions arrive in webhook but are not routed | @mentions in creator captions are silently dropped; real-time feed capture unavailable | Stage 8's Apify polling (24h lag) partially covers; no workaround for caption-only match | P1 — complements Stage 8; requires `instagram_manage_comments` App Review |
| 51 | `UGCTagPollingWorkflow` not built — brand's /tags endpoint never polled | Photo-tagged posts (where creator tags brand IN the image) are never captured | Stage 8 LLM vision partially fills; but cannot detect photo-tags from non-campaign creators | P1 — requires `instagram_manage_comments` App Review (same as Gap 50) |
| 52 | `HashtagMonitoringWorkflow` not built — #MamaSitas, #SinigangRecipe not monitored | Organic creators using campaign hashtags are invisible; ~10 expected hashtag-only posts missed | Periodic manual Instagram hashtag search; note handles; add manually to creator list | P1 — requires `instagram_public_content_access` App Review (4-6 weeks); longest lead time |
| 53 | `instagram_manage_comments` App Review not submitted — Layer 1B/1C blocked in production | Feed @mention capture and photo-tag polling cannot run against production accounts; sandbox-only | Test in Development Mode with App Role accounts; submit review before campaign | P0 (timeline) — submit simultaneously with DM App Review |
| 54 | `instagram_public_content_access` App Review not submitted — Layer 2 hashtag monitoring blocked | Hashtag monitoring (`HashtagMonitoringWorkflow`) cannot run in production | No hashtag coverage; accept 10 hashtag-only posts as missed; submit App Review for future campaigns | P0 (timeline for future campaigns) — submit immediately; 4-6 week wall-clock |
| 55 | Story media download TOS grey area — Meta's Platform Terms technically prohibit downloading Story CDN content | Legal risk if Meta enforces against Cheerful; Archive.com appears to violate same restriction at scale | Store CDN URL only (stories disappear after 24h from library); OR take Archive's approach and download | Organizational decision — not a technical blocker; recommended: download on receipt (industry norm) |
| 56 | No rights management tool — `ugc_content` has no `rights_status` field or rights request workflow | Mama Sita's marketing team cannot reshare UGC content without confirming creator rights; current `rights_status: null` | Brand rep manually DMs creators via IG app to ask for reshare permission | P2 — rights management is a full product feature; out of scope for hero journey v1 |
| 57 | No cross-table deduplication between `creator_post` (Stage 8) and `ugc_content` (Stage 9) for the same Instagram post | Brand rep gets two different post counts depending on which CE tool they query; no unified "all posts for this campaign" view | Accept duplication; use Stage 8 for "who posted" and Stage 9 for "UGC library with media"; document in brand rep workflow | P2 — add `instagram_post_id` cross-reference on both tables; surface unified count in `cheerful_list_ugc_content` |
| 58 | Reels photo-tag API gap — Instagram API does not expose Reels in the `/tags` endpoint | Reels where creator physically tags @MamaSitasOfficial in the video frame are invisible to Layer 1C | Stage 8 LLM vision catches these if creator is in opted-in list; organic Reel taggers are missed | P2 (unresolvable) — confirmed Instagram API limitation; document as known coverage gap |

---

## Success Criteria

At the end of Stage 9, "100% hero journey" means:

1. **Layer 1A active**: `mention` field in `subscribed_fields` for @MamaSitasOfficial page; `StoryMentionWorkflow` running; all Story @mentions from opted-in creators captured within 60 seconds and permanently stored
2. **Layer 1B active**: Graph API `mentions` webhook subscription active; `FeedMentionWorkflow` routing in place; feed @mentions trigger real-time capture
3. **Layer 1C active**: `UGCTagPollingWorkflow` running every 15min; photo-tagged posts captured
4. **Layer 2 active**: `HashtagMonitoringWorkflow` running every 2h for #MamaSitas, #SinigangRecipe, #LutongPinoy, #HomeCooking
5. **`ugc_content` populated**: At least 40 records by Day 49 (9 Stories + 18 feed @mentions + 10 photo-tags + some hashtag posts)
6. **Media stored**: All Story media downloaded to Supabase Storage before 24h CDN expiry; 0 expired Stories in library
7. **Campaign attribution**: All 32 opted-in creator UGC pieces linked to `campaign_id="campaign-uuid-mamasitas"`
8. **Organic discovery**: At least 5 organic creator posts discovered via Layer 2 hashtag monitoring
9. **CE access**: Brand rep can query `cheerful_list_ugc_content(campaign_id=...)` and see 40+ items; can view specific Story videos via `cheerful_get_ugc_item` with Supabase signed URL

**Measurable targets by Day 49**:
- Total `ugc_content` records: ≥40 (target: 47)
- Story captures: ≥8 (of ~10-12 creators expected to post Stories; some may not @mention)
- Hashtag-discovered organic creators: ≥3 (new brand advocates not in campaign)
- Webhook latency: all captures within 60 seconds of posting (feed @mentions, Story mentions)
- 0 expired Story media URLs in UGC library (all Stories have `stored_media_path` set)

---

## Dependencies

| Dependency | Required By | Status |
|-----------|------------|--------|
| IG DM webhook infrastructure (Stage 4 / ig-dm-spec) | Layer 1A (Story capture) rides on same `POST /webhooks/instagram` endpoint and page subscription | Spec'd in `../../cheerful-ig-dm-spec/`; ~50% built per loop status |
| `ugc_content` table (Gap 46) | All Layers; `cheerful_list_ugc_content` and `cheerful_get_ugc_item` CE tools | Not built; P0 prerequisite |
| `instagram_manage_comments` App Review approved (Gap 53) | Layer 1B (feed @mentions) and Layer 1C (photo-tag polling) | Not submitted; 2-4 week wall-clock once submitted |
| `instagram_public_content_access` App Review approved (Gap 54) | Layer 2 (hashtag monitoring) | Not submitted; 4-6 week wall-clock — longest lead time in entire campaign |
| Stage 8 complete (PostTrackingWorkflow running) | Stage 9 is complementary; `creator_post` records from Stage 8 are input for Stage 10 (ROI) | Depends on Gap CE-update (`cheerful_update_campaign`) and Gap post-tools being built |
| `download_and_store_media` service (reuse from IG DM infra) | Story media download; feed post media download | Exists in Cheerful (`media_storage.py`); reuse with new storage path prefix |
| Stage 10 (ROI Measurement): input from Stage 9 | ROI report needs UGC counts, engagement, and impression aggregates | Stage 9 `ugc_content` records are the input; Stage 8 `creator_post` records also feed into ROI |
