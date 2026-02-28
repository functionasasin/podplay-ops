# Cheerful Campaign Workflow Touchpoints — TikTok Integration Map

**Aspect:** `cheerful-campaign-workflow-touchpoints`
**Wave:** 3 (Cheerful Architecture Analysis)
**Generated:** 2026-02-28

---

## Summary

Cheerful's campaign lifecycle is orchestrated by 24 Temporal workflows spanning creator discovery, outreach, thread processing, opt-in handling, content tracking, and reporting. This analysis maps every touchpoint in that lifecycle to TikTok integration opportunities — both where TikTok fits naturally into existing activity slots and where new workflows would be needed.

**Key finding:** TikTok integrations can enter Cheerful at 9 distinct touchpoints across the campaign lifecycle. The first 4 (discovery, enrichment, content tracking, metrics) slot into existing workflow slots with minimal new infrastructure. The remaining 5 (paid amplification via Spark Ads, TikTok DM outreach, creator-connected OAuth, shop/commerce, campaign-branded hashtag/sound tracking) require new workflow patterns or external platform integrations.

---

## Campaign Lifecycle Overview

Cheerful's campaign lifecycle follows this high-level arc:

```
1. Campaign Setup     → configure discovery, product, messaging templates
2. Creator Discovery  → CampaignDiscoveryWorkflow (weekly scheduler)
3. Enrichment         → EnrichForCampaignWorkflow (email discovery)
4. Outreach           → SendCampaignOutboxWorkflow (email sends)
5. Follow-ups         → SendCampaignFollowUpsWorkflow / TriggerThreadFollowUpDraftWorkflow
6. Reply Processing   → ThreadProcessingCoordinatorWorkflow (AI pipeline)
7. Opt-in Handling    → execute_campaign_workflows → GoAffPro/Shopify + post-opt-in emails
8. Content Tracking   → PostTrackingSchedulerWorkflow (48h cadence)
9. Metrics/Reporting  → ThreadExtractMetricsWorkflow + Google Sheets + SlackOrderDigest
10. Lookalike Ramp    → generate_lookalikes_for_opt_in (auto-find similar creators at opt-in)
```

---

## Touchpoint 1: Campaign Discovery

### Current State

**Workflows:**
- `CampaignDiscoverySchedulerWorkflow` → weekly cron → spawns `CampaignDiscoveryWorkflow` per campaign
- `CampaignDiscoveryWorkflow` → `discover_creators_for_campaign_activity` (10 min, 3 retries) → `populate_outbox_for_new_recipients_activity`

**Current activity:** `discover_creators_for_campaign_activity`
- **File:** `apps/backend/src/temporal/activity/campaign_discovery_activity.py`
- **Method:** Instagram-only (Apify lookalike search from seed profiles)
- **Config fields used:** `discovery_config.seed_profiles` (list of Instagram handles)
- **Output:** Inserts into `campaign_recipient` table (creators with email)

### TikTok Integration Points

#### 1A. Apify Keyword/Hashtag Search (Quick Win — 1-2 weeks)

**Integration:** Add `platform == "tiktok"` branch to `discover_creators_for_campaign_activity`.

```python
# campaign_discovery_activity.py — new dispatch branch
elif platform == "tiktok":
    return _discover_tiktok_creators(params, config)

def _discover_tiktok_creators(params, config):
    keywords = config.get("keywords", [])      # e.g. ["skincare", "beauty"]
    hashtags = config.get("hashtags", [])       # e.g. ["#skincareroutine"]
    seed_profiles = config.get("seed_profiles", [])  # TikTok handles for enrichment
    follower_min = config.get("follower_min", 1000)
    follower_max = config.get("follower_max", 10_000_000)
```

**Actor used:** `clockworks/free-tiktok-scraper`
- Keyword search: `{searchQueries: ["skincare"], searchSection: "/user", maxItems: 50}`
- Hashtag search: `{hashtags: ["#skincareroutine"], maxItems: 100}`

**No new Temporal infrastructure needed** — this is a new branch in the existing activity.

#### 1B. TikTok Research API — User Search (Medium term — requires API access)

**Integration:** Alternative discovery backend when Research API access is granted.

**Endpoint:** `POST https://open.tiktokapis.com/v2/research/user/search/`
```json
{
  "query": {
    "and": [
      {"field_name": "username", "field_values": ["keywordmatch"]},
      {"field_name": "bio", "field_values": ["skincare"]}
    ]
  }
}
```

**Data available:** `display_name`, `bio_description`, `is_verified`, `follower_count`, `following_count`, `likes_count`, `video_count`, `profile_deep_link`

**Benefit vs Apify:** Higher reliability, official data, no anti-bot risk. Requires Research API application approval.

#### 1C. TikTok Creator Marketplace (TCM) Search (Long term — partner program access)

**Integration:** If Cheerful gains TCM API access, creator discovery becomes extremely high quality — TCM provides audience demographics, niche tags, engagement rates, and past collaboration history.

**TCM discovery endpoint:** No public REST API exists; TCM operates through a Partner portal. For platform access at scale, TikTok requires a Marketing Partner or MCN relationship.

**Workaround path:** Third-party data providers (HypeAuditor, Modash) with TikTok creator databases offer comparable search capability via REST APIs:
- **Modash:** `GET /v1/tiktok/search` → filter by follower range, engagement rate, niche, country, gender
- **HypeAuditor:** `POST /api/tiktok/profiles/search` → same type of structured filtering
- **Pricing:** Modash from $99/mo; HypeAuditor from ~$299/mo

**New config fields needed on `campaign`:**
```python
discovery_config = {
    "platform": "tiktok",
    "keywords": ["skincare"],            # keyword search
    "hashtags": ["#skincareroutine"],    # hashtag search
    "seed_profiles": ["@seedhandle"],    # for LLM lookalike extraction
    "follower_min": 10000,
    "follower_max": 1000000,
    "niche": "beauty",                   # for Modash/HypeAuditor filtering
    "region": "US",                      # TikTok is region-specific
}
```

---

## Touchpoint 2: Creator Enrichment

### Current State

**Workflow:** `EnrichForCampaignWorkflow`
- Triggered: API call when creators added to campaign without email
- Activity: `enrich_creator_for_campaign_activity` (5 min, NO_RETRY per creator)
- Method: 4-tier waterfall — cache → Apify rescrape → bio-link crawl → Influencer Club

**File:** `apps/backend/src/services/creator/enrichment_service.py`

### TikTok Integration Points

#### 2A. Bio-link Crawl (Immediately Available — Reuses Existing Code)

**Integration:** The existing `bio_link_apify.py` crawler already handles Linktree, Beacons, and similar link-in-bio services. TikTok creators predominantly use these for email exposure. **No new code needed** — add `elif creator.platform == "tiktok"` branch that calls the existing crawl infrastructure.

#### 2B. Apify TikTok Profile Rescrape (Quick Win)

```python
elif creator.platform == "tiktok":
    bio_link = creator.profile_data.get("bio_link")
    bio = creator.profile_data.get("bio", "")

    # Tier 1: regex on bio text
    email = extract_email_from_text(bio)

    # Tier 1.5: bio-link crawl (reuses existing infrastructure)
    if not email and bio_link:
        email = _crawl_bio_link_for_email(bio_link)

    # Tier 2: Apify rescrape (profile may have been updated)
    if not email:
        service = get_tiktok_apify_service()
        profile = service.get_creator_profile(creator.handle)
        email = extract_email_from_text(profile.bio)
        if profile.bio_link and not email:
            email = _crawl_bio_link_for_email(profile.bio_link)
```

**Actor for Tier 2 rescrape:** `nba1rst/tiktok-profile-scraper` ($0.001/result)

#### 2C. TikTok Display API Enrichment (Deep Integration — requires Login Kit)

When a creator connects their TikTok via OAuth (Login Kit), Cheerful can enrich them via the official Display API:

**Endpoint:** `GET https://open.tiktokapis.com/v2/user/info/`
**Fields:** `display_name`, `bio_description`, `avatar_url`, `follower_count`, `following_count`, `likes_count`, `video_count`, `is_verified`, `profile_deep_link`

**Auth:** Creator's OAuth `access_token` (not brand's token)

**New table required:** `creator_social_auth` (see `cheerful-data-model-extensions` aspect)

#### 2D. Third-Party Data Provider Enrichment

For creators discovered without email via the Modash/HypeAuditor path:

- **Modash:** `GET /v1/tiktok/profile/{username}` → returns contact email if in their database (~30% hit rate for mid-tier creators)
- **HypeAuditor:** `POST /api/tiktok/profiles/email_lookup` → similar hit rate
- **Pricing:** Both require paid tiers; included in base plan costs

**Integration point:** Add as Tier 3 before Influencer Club in the enrichment waterfall.

---

## Touchpoint 3: Outreach (Initial Email)

### Current State

**Workflows:** `SendCampaignOutboxWorkflow` (initial), `SendCampaignFollowUpsWorkflow` (follow-up 1+)
- Both emit via Gmail API (operator's Gmail account)
- Rate-limited: one email per Gmail account per execution
- **File:** `apps/backend/src/temporal/workflow/campaign_outbox_workflow.py`

### TikTok Integration Points

TikTok outreach is email-first in Cheerful's architecture. Email remains the primary channel. However, two new outreach channels become available:

#### 3A. TikTok DM Outreach (New Workflow Required)

**TikTok API surface:** No public DM API is available to third-party apps. DMs via TikTok are only accessible through:
- The in-app mobile interface
- TikTok Creator Marketplace portal (for official collaborations)
- Brand Partner programs (enterprise access only)

**Assessment:** TikTok DM outreach cannot be automated via official API at this time. Options:
1. **PhantomBuster TikTok DM Phantom** (~$69/mo) — unofficial, TOS violation risk
2. **Composio + TikTok** — no DM capability documented in Composio's TikTok connector
3. **Creator Marketplace collaboration request** — official but requires TCM portal integration

**New workflow pattern (future):** If DM API becomes available:
```
TikTokOutreachWorkflow:
  → send_tiktok_dm_activity(creator_handle, message_template)
  → poll_tiktok_dm_reply_activity() [webhook preferred]
  → ThreadProcessingCoordinatorWorkflow (process inbound reply)
```

#### 3B. Creator Marketplace Collaboration Request (Portal-Based)

**Integration:** Through the TCM portal (not API-automatable), submit a campaign brief to specific creators. This is manual-operator workflow, not automatable without enterprise TCM API access.

**Recommendation:** For now, email remains the sole Cheerful outreach channel for TikTok creators. TikTok DM is a future integration gate-kept by API availability.

---

## Touchpoint 4: Reply Processing (Thread Intelligence)

### Current State

**Workflow:** `ThreadProcessingCoordinatorWorkflow` (20-step pipeline)
- Entry via Gmail poll or SMTP sync
- Activities of interest:
  - `extract_campaign_creator` — extracts creator's social handles from email thread (LLM)
  - `extract_thread_flags` — detects opt_in, opt_out, has_question, is_auto_reply
  - `generate_lookalikes_for_opt_in` — when creator opts in, finds lookalike creators
  - `ThreadExtractMetricsWorkflow` — extracts engagement metrics from email text

### TikTok Integration Points

#### 4A. TikTok Handle Extraction in `extract_campaign_creator`

**File:** `apps/backend/src/temporal/activity/post_tracking_activity.py` (and the LLM extraction prompt)

When a TikTok creator replies to an outreach email, the LLM extraction prompt needs to recognize TikTok handles:

```python
# LLM prompt addition:
"Extract the TikTok handle from the email if present.
TikTok profiles are at tiktok.com/@username or referenced as @username on TikTok."
```

**Output:** `social_media_handles = [..., {platform: "tiktok", handle: "username", url: "..."}]`

The `campaign_creator.social_media_handles` JSONB already explicitly supports `"tiktok"` as a valid platform (confirmed in `cheerful-content-tracking-model` analysis, line 681 of that doc).

#### 4B. TikTok Metrics Extraction in `ThreadExtractMetricsWorkflow`

Currently, `extract_metrics_from_thread_using_llm_activity` extracts follower count and engagement rate from email text (creators sometimes self-report their stats).

**TikTok-specific metric extraction additions:**
- TikTok follower count (in emails, creators may include "X TikTok followers")
- TikTok engagement rate
- Average views per video

**Existing LLM prompt extension only** — no new infrastructure needed.

#### 4C. TikTok-Aware Flag Extraction in `extract_thread_flags`

When creators opt in to TikTok campaigns, the reply may include:
- A TikTok video URL (content submitted)
- A TikTok creator code (for Spark Ads authorization)
- TikTok shop affiliate acceptance

**LLM prompt additions:**
- `has_tiktok_video_url`: creator submitted a video link
- `has_spark_ads_code`: creator provided a Spark Ads authorization code
- `has_tiktok_shop_acceptance`: creator accepted affiliate terms

These flags enable new downstream automation branches.

---

## Touchpoint 5: Opt-in Processing

### Current State

When `opt_in` flag is detected in `extract_thread_flags`, `execute_campaign_workflows` runs:
- **Gifting campaigns:** GoAffPro order creation + Shopify order → physical product fulfillment
- **Paid promotion:** Status update to `AGREED`/`CONTENT_SUBMITTED`

Post-opt-in: `SendPostOptInFollowUpsWorkflow` sends follow-up emails (shipping confirmation, next steps).

### TikTok Integration Points

#### 5A. TikTok Creator Connected via Login Kit (New Flow)

**New workflow:** `TikTokCreatorAuthWorkflow`

When a creator opts in and Cheerful wants to enable Display API enrichment + Spark Ads:

```
Creator opts in via email
  ↓ Cheerful sends "connect TikTok" link in post-opt-in email
  ↓ Creator clicks → TikTok OAuth (Login Kit)
  ↓ Cheerful receives auth code → exchanges for access_token
  ↓ Stores in creator_social_auth table
  ↓ Unlocks: Display API enrichment, direct video metrics, Spark Ads eligibility
```

**New infrastructure required:**
- TikTok OAuth callback endpoint (`/auth/tiktok/callback`)
- `creator_social_auth` table (creator_id + platform + access_token + refresh_token)
- `TikTokApiClient` service using the creator's access token

#### 5B. Spark Ads Authorization (New Integration)

When a creator posts a TikTok video for the campaign, they can authorize Cheerful/brand to boost it:

**Flow:**
1. Creator posts TikTok video organically
2. Creator generates a Spark Ads code in their TikTok Creator Center
3. Creator shares code in email reply
4. Cheerful's `has_spark_ads_code` flag triggers new activity
5. `create_spark_ad_activity` → TikTok Marketing API → boost the video

**New activity:** `create_spark_ad_activity`
```python
# Marketing API endpoint
POST https://business-api.tiktok.com/open_api/v1.3/tt_video/auth/
{
  "advertiser_id": "...",  # Cheerful's TikTok ad account
  "video_auth_token": "SPARK_CODE_FROM_CREATOR"
}
# Then create ad with the authorized video
POST https://business-api.tiktok.com/open_api/v1.3/ad/create/
```

**Prerequisites:**
- TikTok Marketing API access (business account + app review)
- TikTok ad account connected to Cheerful
- New `campaign` field: `tiktok_ad_account_id`

#### 5C. TikTok Shop Affiliate Order Tracking

For gifting campaigns where creators are TikTok Shop affiliates:

**TikTok Shop Open API flow:**
```
Product added to TikTok Shop catalog
→ Creator receives affiliate link in post-opt-in email
→ Creator promotes product via TikTok video with product link
→ TikTok Shop webhook: order.created event
→ Cheerful records affiliate order → triggers Slack digest / fulfillment approval
```

**Webhook event:** `ORDER_STATUS_CHANGE` from TikTok Shop
**New workflow:** `TikTokShopOrderWorkflow` (parallel to existing `SlackOrderDigestWorkflow`)

This would require:
- TikTok Shop seller account connection
- New `campaign_creator` field: `tiktok_affiliate_link`
- Webhook handler for TikTok Shop order events

---

## Touchpoint 6: Post-Opt-in Creator Communication

### Current State

`SendPostOptInFollowUpsWorkflow` sends automated follow-up emails for gifting campaigns at defined intervals:
- Shipping confirmation (product sent)
- Next steps reminder (post the content)
- Content submission reminder

**File:** `apps/backend/src/temporal/workflow/post_opt_in_follow_up_send_workflow.py`

### TikTok Integration Points

#### 6A. TikTok Video Submission Request in Follow-up

Post-opt-in emails for TikTok campaigns need platform-specific content:

**Additional email content variants for TikTok:**
- "How to generate a Spark Ads code" → direct link to TikTok Creator Center
- "Use this hashtag in your video: `#[CampaignHashtag]`"
- "Tag `@[BrandTikTok]` in your post"
- "Join our TikTok Shop affiliate program: [link]"

**Implementation:** Extend `PostOptInEmailTemplate` with TikTok-specific sections. The existing follow-up infrastructure handles sending — only template variations needed.

#### 6B. Creator Login Kit OAuth Invite

As a dedicated step in the post-opt-in sequence:

```
Post-opt-in email #2:
  "Connect your TikTok for direct content tracking"
  → [Connect TikTok Account] button → Login Kit OAuth URL
```

This enables Cheerful to skip Apify polling and use the Display API directly for opted-in creators — better data, no anti-bot risk.

---

## Touchpoint 7: Content Tracking

### Current State

**Workflows:**
- `PostTrackingSchedulerWorkflow` → runs every 48 hours → spawns `PostTrackingWorkflow`
- `PostTrackingWorkflow`:
  - `get_trackable_creators_activity` → queries `campaign_creator WHERE post_tracking_ends_at > now`; extracts Instagram handles (currently skips ALL non-Instagram creators)
  - `process_creator_posts_activity` × N (sequential, per-creator `try/except`)

**Tracking trigger:** Creator's status transitions to "participating" (e.g., SHIPPED, DELIVERED, POSTED for gifting; AGREED, CONTENT_LIVE for paid)

**Window:** 90 days from participation start

### TikTok Integration Points

#### 7A. Apify Polling — TikTok Videos (Quick Win, ~1 week)

**Same 48h cadence.** Add TikTok branch to `process_creator_posts_activity`:

```python
elif creator.platform == "tiktok":
    posts = fetch_tiktok_posts(creator.platform_handle, max_posts=10)
    # fetch_tiktok_posts uses clockworks/free-tiktok-scraper
```

**What Apify returns per video:** video ID, URL, caption (text), thumbnail, like count (diggCount), play count, share count, comment count, collect count, hashtags[], duet_from_id, stitch_from_id, music_id, created timestamp

**Gap:** Must update `get_trackable_creators_activity` to NOT skip TikTok creators:
```python
# Current (Instagram-only):
instagram_handle = extract_instagram_handle(creator.social_media_handles)
if not instagram_handle: continue

# Required (platform-aware):
for platform in ["instagram", "tiktok"]:
    handle = extract_handle_for_platform(creator.social_media_handles, platform)
    if handle: ...
```

#### 7B. TikTok Research API — Video Query (Medium term)

When Research API access is granted, replace Apify polling for opted-in creators with Research API queries:

**Endpoint:** `POST https://open.tiktokapis.com/v2/research/video/query/`
```json
{
  "query": {
    "and": [
      {"field_name": "username", "field_values": ["creatorhandle"]},
      {"field_name": "create_date", "field_values": ["20260101", "20260228"]}
    ]
  },
  "fields": "id,create_time,username,video_description,like_count,comment_count,share_count,view_count,hashtag_names"
}
```

**Benefit:** Official data, no anti-bot risk, higher rate limits (1000 requests/day per user).

#### 7C. TikTok Display API — Creator Video List (Deep Integration)

For creators who have connected via Login Kit:

**Endpoint:** `GET https://open.tiktokapis.com/v2/video/list/`
- **Auth:** Creator's OAuth `access_token`
- **Fields:** `id`, `title`, `video_description`, `embed_link`, `like_count`, `comment_count`, `share_count`, `view_count`, `create_time`
- **Benefit:** First-party data; no scraping

**Integration:** Add platform branch in `process_creator_posts_activity`:
```python
elif creator.platform == "tiktok" and creator_has_oauth_token(creator):
    posts = fetch_tiktok_display_api_videos(creator)  # uses stored access_token
else:
    posts = fetch_tiktok_posts(creator.platform_handle)  # Apify fallback
```

#### 7D. Hashtag Campaign Tracking (New Activity)

**Unique to TikTok.** Beyond per-creator polling, Cheerful can monitor a campaign-specific hashtag:

**New activity:** `track_tiktok_hashtag_activity(hashtag: str, campaign_id: UUID)`

```python
# Apify hashtag scan
client.actor("clockworks/free-tiktok-scraper").call(run_input={
    "hashtags": ["#BrandXChallenge"],
    "resultsPerPage": 100,
})
# For each video found: check if creator is in campaign_creator table
# If yes: attribute as campaign content
# If no: add to "organic UGC" pool for potential follow-up outreach
```

**New campaign field:** `tiktok_campaign_hashtag` (string)

**New trigger:** Add to `PostTrackingWorkflow` — after per-creator polling, also run hashtag scan if campaign has `tiktok_campaign_hashtag` set.

#### 7E. Sound/Music Campaign Tracking (New Activity)

If brand creates a custom TikTok sound:

**New activity:** `track_tiktok_sound_activity(sound_id: str, campaign_id: UUID)`

```python
client.actor("clockworks/free-tiktok-scraper").call(run_input={
    "sounds": ["https://www.tiktok.com/music/Brand-Sound-7234000000000000000"],
    "resultsPerPage": 100,
})
```

**New campaign field:** `tiktok_campaign_sound_id` (string)

#### 7F. Duet/Stitch Attribution (New Detection Logic)

When tracking TikTok posts, `duet_from_id` and `stitch_from_id` enable campaign attribution without caption matching:

```python
# In analyze_tiktok_post():
if post.duet_from_id and post.duet_from_id == campaign.tiktok_hero_video_id:
    return AnalysisResult(
        matches=True,
        method="duet_from_brand",
        reason=f"Creator duetted brand hero video {post.duet_from_id}"
    )
```

**New campaign field:** `tiktok_hero_video_id` (string)

This enables automatic attribution of duet/stitch content to campaigns without requiring caption keyword matching.

---

## Touchpoint 8: Metrics & Reporting

### Current State

**Workflow:** `ThreadExtractMetricsWorkflow`
- `extract_metrics_from_thread_using_llm_activity` → extracts follower count, engagement rate, niche from email text (self-reported by creator)
- `update_sheet_with_metrics_activity` → writes to Google Sheets (serial, rate-limited)

**Workflow:** `SlackOrderDigestWorkflow` — daily Slack message with order approval requests

**Reporting surface:** Google Sheets (current), PostHog (frontend analytics)

### TikTok Integration Points

#### 8A. TikTok Video Metrics in Google Sheets

The existing Google Sheets export workflow (`update_sheet_with_metrics_activity`) needs new TikTok-specific columns:

| New Column | Source | TikTok Equivalent |
|-----------|--------|-------------------|
| TikTok Plays | `creator_post.view_count` | `playCount` |
| TikTok Likes | `creator_post.like_count` | `diggCount` |
| TikTok Shares | `creator_post.platform_metrics.share_count` | `shareCount` |
| TikTok Saves | `creator_post.platform_metrics.collect_count` | `collectCount` |
| TikTok Comments | `creator_post.comment_count` | `commentCount` |
| Share Rate | shares / plays | Computed |
| Save Rate | saves / plays | Computed |

**Implementation:** Extend the Google Sheets activity's column mapping with platform-aware logic.

#### 8B. Spark Ads Performance Reporting

When Spark Ads are running (Touchpoint 5B), their metrics are available via Marketing API:

**Endpoint:** `POST https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/`
```json
{
  "advertiser_id": "...",
  "dimensions": ["ad_id"],
  "metrics": ["impressions", "clicks", "spend", "video_play_actions", "reach"],
  "data_level": "AUCTION_AD"
}
```

**New Google Sheets columns:** Spark Ad Impressions, Paid Reach, Spend, CPM, CPV

**New workflow (optional):** `TikTokAdsReportingWorkflow` — polls Marketing API daily, writes to Sheets

#### 8C. Third-Party Analytics for Audience Demographics

For opted-in creators, third-party providers (Modash, HypeAuditor, Pentos) provide richer audience data:

- Audience demographics (age, gender, country split)
- Engagement rate benchmarks
- Follower authenticity score
- Content category classification

**API:** Modash `GET /v1/tiktok/profile/{username}/audience` ($0.20/lookup)

**Integration:** Add as optional enrichment step in `enrich_creator_for_campaign_activity` — only run when campaign requires demographic reporting.

---

## Touchpoint 9: Lookalike Discovery (Post Opt-in)

### Current State

**Activity:** `generate_lookalikes_for_opt_in` in `ThreadProcessingCoordinatorWorkflow`
- Triggered when: Gmail + campaign + opt-in detected + creators found in thread
- Currently: Instagram-specific Apify lookalike search from creator's Instagram handle

### TikTok Integration Points

#### 9A. TikTok Lookalike Search at Opt-in

When a TikTok creator opts in, trigger TikTok-specific lookalike discovery:

```python
elif campaign.platform == "tiktok":
    # Use the opting-in creator as seed
    seed_profile = tiktok_service.get_creator_profile(tiktok_handle)
    # LLM extracts niche keywords from profile (same as YouTube pattern)
    keywords = extract_keywords_with_llm(seed_profile)
    # Search for similar creators by keyword
    lookalikes = tiktok_service.search_creators_by_keyword(keywords)
    # Save and add to campaign's creator list
```

**Pattern:** Mirrors YouTube's LLM keyword extraction pipeline (`youtube_apify.py:_extract_keywords_with_llm`)

**New config:** `discovery_config.auto_lookalike = true` → when creator opts in, auto-search for similar TikTok creators

#### 9B. HypeAuditor/Modash Audience Overlap Discovery

Third-party providers can find creators with similar audience demographics to an opted-in creator:

- **Modash:** `GET /v1/tiktok/lookalike/{username}` → creators with similar audience profile
- **HypeAuditor:** Similar endpoint

**Benefit:** More accurate similarity than keyword matching alone — accounts for audience geography, age, interests.

---

## Integration Map: Workflow × TikTok API

| Campaign Lifecycle Stage | Workflow | Current (Instagram) | TikTok: Quick Win | TikTok: Medium | TikTok: Deep |
|--------------------------|----------|---------------------|-------------------|----------------|--------------|
| Creator Discovery | `CampaignDiscoveryWorkflow` | Apify lookalike | Apify keyword/hashtag | Research API user search | TCM partner portal |
| Creator Enrichment | `EnrichForCampaignWorkflow` | Apify rescrape + bio-link | Bio-link (reuse) + Apify TikTok scrape | Modash/HypeAuditor API | Display API (Login Kit) |
| Outreach | `SendCampaignOutboxWorkflow` | Gmail email | Gmail email (same) | — | TikTok DM (future API) |
| Handle Extraction | `ThreadProcessingCoordinatorWorkflow` | LLM: Instagram handles | LLM: add TikTok handles | — | — |
| Opt-in Handling | `execute_campaign_workflows` | GoAffPro + Shopify | Email with TikTok hashtag/sound instructions | Spark Ads code extraction | Login Kit OAuth + TikTok Shop affiliate |
| Post-opt-in Follow-up | `SendPostOptInFollowUpsWorkflow` | Shipping + next steps | TikTok-specific templates | Login Kit invite email | — |
| Content Tracking | `PostTrackingWorkflow` | Apify Instagram posts | Apify TikTok videos | Research API video query | Display API video list |
| Campaign Hashtag Tracking | — (new) | N/A | Apify hashtag actor | Research API hashtag | TikTok webhooks |
| Sound/Duet/Stitch Tracking | — (new) | N/A | Apify sound/duet | — | — |
| Lookalike Discovery | `generate_lookalikes_for_opt_in` | Apify lookalike | Apify keyword + LLM | Modash lookalike API | TCM audience match |
| Metrics Reporting | `ThreadExtractMetricsWorkflow` + Sheets | LLM from email text + Sheets | TikTok metrics to Sheets | Spark Ads reporting | Modash audience demographics |
| Commerce | `SlackOrderDigestWorkflow` | GoAffPro/Shopify | — | TikTok Shop affiliate tracking | TikTok Shop webhook + order workflow |
| Paid Amplification | — (new) | N/A | — | Spark Ads creation | Marketing API full campaign |

---

## New Workflows Required

Beyond extending existing workflows, TikTok introduces 4 net-new workflow patterns:

### W1: `TikTokHashtagTrackingWorkflow`

```
PostTrackingWorkflow
  → (existing creator polling)
  → [NEW] track_tiktok_hashtag_activity(hashtag, campaign_id)
       → Apify hashtag scan
       → For each video: match to campaign_creator OR flag as organic UGC
       → Save matched videos to creator_post with campaign attribution
```

**Trigger:** Same 48h scheduler as PostTrackingWorkflow; additional step for campaigns with `tiktok_campaign_hashtag`.

### W2: `TikTokCreatorAuthWorkflow`

```
Creator clicks "Connect TikTok" link
  → GET /auth/tiktok → redirect to TikTok Login Kit OAuth
  → POST /auth/tiktok/callback → exchange code for tokens
  → store_tiktok_creator_auth_activity(creator_id, access_token, refresh_token)
  → trigger_display_api_enrichment_activity(creator_id)
```

**Trigger:** HTTP callback from TikTok OAuth redirect.

### W3: `SparkAdsWorkflow`

```
Thread flag: has_spark_ads_code = true
  → extract_spark_ads_code_from_thread_activity
  → authorize_spark_ad_activity(code, video_handle)
     → Marketing API: POST /tt_video/auth
  → create_spark_ad_activity(authorized_video_id, campaign_ad_group_id)
     → Marketing API: POST /ad/create
  → monitor_spark_ad_activity(ad_id)  [periodic]
     → Marketing API: GET /report
     → update creator_post with paid metrics
```

**Trigger:** `has_spark_ads_code` flag in `extract_thread_flags` activity.

### W4: `TikTokShopOrderWorkflow`

```
TikTok Shop webhook: ORDER_STATUS_CHANGE event
  → ingest_tiktok_shop_order_activity(webhook_payload)
  → match_order_to_campaign_creator_activity(affiliate_link → creator_id)
  → post_tiktok_order_to_slack_activity
  → update_campaign_creator_order_status_activity
```

**Trigger:** Incoming TikTok Shop webhook (new HTTP endpoint needed).

---

## Dependency Chain

TikTok integrations have a clear dependency ordering:

```
Level 0 (no deps): Bio-link crawl reuse (already works)
Level 0 (no deps): TikTok handle extraction in LLM prompts
Level 0 (no deps): TikTok Apify service (tiktok_apify.py)

Level 1 (depends on Apify service):
  → Creator discovery (Apify keyword/hashtag search)
  → Creator enrichment (Apify profile scrape)
  → Content tracking (Apify video polling)
  → Hashtag campaign tracking

Level 2 (depends on Level 1 stable):
  → Research API (requires separate application + access grant)
  → HypeAuditor/Modash (requires paid API subscription)

Level 3 (depends on Level 1 + new OAuth infrastructure):
  → TikTok Login Kit OAuth flow
  → Display API enrichment (requires Level 3 auth)
  → Display API video tracking (requires Level 3 auth)

Level 4 (depends on Level 3 + Marketing API access):
  → Spark Ads workflow (requires Level 3 for creator video ID + Marketing API)
  → Marketing API campaign reporting

Level 5 (separate track — requires TikTok Shop seller account):
  → TikTok Shop affiliate tracking
  → TikTok Shop order webhook
```

---

## Effort Sizing by Integration

| Integration | New Files | Modified Files | New Workflows | Effort |
|------------|-----------|----------------|---------------|--------|
| Apify keyword/hashtag discovery | `tiktok_apify.py` | `campaign_discovery_activity.py` | None | 1 week |
| TikTok content tracking (Apify) | `apify_tiktok_posts.py` | `post_tracking_activity.py` × 2 | None | 1 week |
| TikTok handle extraction | None | LLM prompts + `social_profile_utils.py` | None | 2 days |
| Hashtag campaign tracking | `hashtag_tracking_activity.py` | `post_tracking_workflow.py` | Extend existing | 3 days |
| TikTok post type + metrics in Sheets | None | `update_sheet_activity.py` | None | 2 days |
| Research API discovery | `tiktok_research_api.py` | `campaign_discovery_activity.py` | None | 1 week |
| Login Kit OAuth + Display API | `tiktok_auth.py`, `tiktok_display_api.py` | Auth routes, enrichment service | `TikTokCreatorAuthWorkflow` | 2 weeks |
| Spark Ads workflow | `spark_ads_activity.py` | `thread_processing_coordinator.py` | `SparkAdsWorkflow` | 2 weeks |
| TikTok Shop order workflow | `tiktok_shop_webhook.py` | Webhook router | `TikTokShopOrderWorkflow` | 2 weeks |
| Duet/stitch attribution | None | `analyzer.py`, `post_processor.py` | None | 2 days |
| Sound tracking | `tiktok_sound_activity.py` | `post_tracking_workflow.py` | Extend existing | 3 days |

---

## Key Architectural Observations

1. **Temporal's platform-agnostic design works in Cheerful's favor.** Activity-level platform dispatch (same pattern as Instagram/YouTube split in discovery) handles TikTok with minimal workflow changes.

2. **The `PostTrackingWorkflow` sequential-per-creator approach handles TikTok well.** TikTok Apify actors have comparable latency to Instagram scraping (~30-120s). The 5 min per-creator timeout is sufficient.

3. **The biggest new workflow complexity is Spark Ads.** It introduces a multi-step external approval loop (creator generates code → sends via email → Cheerful reads thread → calls Marketing API) that doesn't fit existing workflow patterns cleanly. A dedicated `SparkAdsWorkflow` with signal-based coordination (Temporal signal when code extracted) may be the cleanest design.

4. **TikTok hashtag/sound tracking is genuinely novel.** Instagram has no equivalent of campaign-branded sounds. This is a TikTok-native feature that could be a significant product differentiator for Cheerful.

5. **Email remains the primary outreach channel.** Until TikTok opens a public DM API, Cheerful's email-first model doesn't need to change. The integration is about TikTok as a *content platform* (discovery, tracking, amplification) rather than a *communication channel*.

6. **Login Kit is the unlock for premium integrations.** Display API + Spark Ads both require creator authentication via TikTok Login Kit. Building this OAuth flow unlocks a tier of integrations unavailable to competitors who rely on scraping alone.
