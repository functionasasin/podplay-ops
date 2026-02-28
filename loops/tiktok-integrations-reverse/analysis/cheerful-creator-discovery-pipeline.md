# Cheerful Creator Discovery Pipeline — TikTok Integration Analysis

**Aspect:** `cheerful-creator-discovery-pipeline`
**Wave:** 3 (Cheerful Architecture Analysis)
**Generated:** 2026-02-28

---

## Summary

Cheerful currently supports Instagram and YouTube creator discovery via Apify actors. The architecture is platform-agnostic at the data model layer (the `Creator` table uses a `platform` text column), but the discovery and enrichment code is largely Instagram/YouTube-specific. Adding TikTok requires three new components: a TikTok Apify service, a `save_creator_from_tiktok()` helper, and a new enrichment branch — all following the exact patterns already established.

---

## Current Discovery Architecture

### Platforms Supported Today

| Platform | Discovery Method | Enrichment Method | Status |
|----------|-----------------|-------------------|--------|
| Instagram | Apify lookalike search + keyword search | Apify profile scraper → bio-link crawl → Influencer Club | Production |
| YouTube | Apify channel scraper → LLM keywords → Apify channel finder | Description parse → bio-link crawl → Apify email extractor | Production |
| TikTok | ❌ None | ❌ None | Not implemented |

---

## File-by-File: Current Discovery Pipeline

### Layer 1: External Service Adapters

#### Instagram Apify Service
**File:** `apps/backend/src/services/external/apify.py`

Two discovery modes:
1. **Lookalike search** (`get_lookalike_creators(instagram_username, max_results=40)`)
   - Calls private actor via `APIFY_CREATOR_SEARCH_ACTOR_ID_1` env var
   - Input: `{inputs: [username], type: "similar_users", profileEnriched: True, maxItem: 40}`
   - Returns: `ApifyActorResult(profiles=[ApifyInstagramProfile, ...], run_id, seed_username)`

2. **Keyword search** (`search_creators_by_keyword(keyword, max_results=100)`)
   - Uses public actor `apify/instagram-scraper`
   - Input: `{search: keyword, searchType: "user", searchLimit: 100, resultsType: "details"}`
   - Returns: same `ApifyActorResult` shape

Both methods handle error classification: rate limit (retryable) vs auth/invalid input (non-retryable) via `ApplicationError(non_retryable=...)`.

**Data fields extracted from Apify Instagram profiles:**
```
username, full_name, biography, follower_count (edge_followed_by),
profile_pic_url, profile_pic_url_hd, is_verified, external_url,
category, public_email, media_count, following_count, city_name,
contact_phone_number, business_email, is_business_account,
bio_links (list), latest_posts (list of 6)
```

#### YouTube Apify Service
**File:** `apps/backend/src/services/external/youtube_apify.py`

Three-step pipeline wrapped in `get_lookalike_channels()`:

1. **Step 1** — `get_channel_details(channel_url)` → `streamers/youtube-channel-scraper` actor
   - Fetches recent 10 videos for LLM keyword extraction
   - Returns: `YouTubeChannelDetails` + `YouTubeVideoInfo` list

2. **Step 1b** — `extract_channel_email(channel_id, channel_handle, description, description_links)`
   - Tier 1: Regex on description text (free, instant)
   - Tier 1.5: HTTP scrape of bio-link pages (free, ~5s max)
   - Tier 2: `endspec/youtube-channel-contacts-extractor` Apify actor ($0.005/result)

3. **Step 2** — `_extract_keywords_with_llm(channel, llm_service)` → `gpt-4.1-mini`
   - Prompt analyzes: channel name, description, subscriber count, recent video titles
   - Returns: 2-3 YouTube search queries for finding lookalike channels

4. **Step 3** — `find_similar_channels_fast(keywords, max_results=50)` → `apidojo/youtube-channel-information-scraper`
   - Falls back to `coregent/youtube-channel-finder` if apidojo not configured
   - Returns: `list[YouTubeChannelFinderResult]`

5. **Step 3b** — Parallel email extraction for all found channels
   - `ThreadPoolExecutor(max_workers=min(10, len(channels)))`
   - Channels with emails sorted first

### Layer 2: Creator Service — Storage Functions

**File:** `apps/backend/src/services/creator/creator_service.py`

Two storage functions mapping platform-specific data to the generic `Creator` model:

```python
save_creator_from_instagram(db, profile: ApifyInstagramProfile, source: str) -> Creator
save_creator_from_youtube(db, channel: YouTubeChannelFinderResult | ApidojoChannelFinderResult, source: str) -> Creator
```

Both call `CreatorRepository.upsert(creator)` which is a PostgreSQL `INSERT ... ON CONFLICT (platform, handle) DO UPDATE`.

### Layer 3: Enrichment Service

**File:** `apps/backend/src/services/creator/enrichment_service.py`

`enrich_single_creator(db, creator)` — 4-step waterfall for creators without email:

```
Step 1: Cache check (already has email) → short-circuit
Step 2: Apify scrape (platform-specific branch)
   - instagram: apify/instagram-profile-scraper
   - youtube: YouTubeApifyService.extract_channel_email()
   [tiktok: not implemented]
Step 3: Bio link crawl (scrape Linktree, Beacons, etc.)
Step 4: Influencer Club API fallback
```

Results recorded in `creator_enrichment_attempt` table.

### Layer 4: Creator List Service

**File:** `apps/backend/src/services/creator/creator_list_service.py`

`add_creators_to_campaign(db, list_id, campaign_id, creator_ids)` — moves creators from discovery lists into campaign:
- Creators with email → `campaign_recipient` + `campaign_creator` (ready for outreach)
- Creators without email → `campaign_creator` with `enrichment_status='pending'` (async enrichment)

### Layer 5: Temporal Workflows

#### Discovery Workflow
**File:** `apps/backend/src/temporal/workflow/campaign_discovery_workflow.py`

```
CampaignDiscoveryWorkflow.run(CampaignDiscoveryParams)
  → discover_creators_for_campaign_activity  [10 min timeout, 3 retries]
  → populate_outbox_for_new_recipients_activity (if added_count > 0)  [5 min, 3 retries]
```

#### Discovery Activity
**File:** `apps/backend/src/temporal/activity/campaign_discovery_activity.py`

Currently Instagram-only:
1. Reads `seed_profiles` (list of Instagram usernames) from campaign `discovery_config`
2. Runs Apify lookalike search for each seed
3. Filters: must have email, follower range check, dedup against existing recipients
4. Inserts into `campaign_recipient` table

**Key limitation:** Hardcoded to Instagram. No platform dispatch.

#### Enrichment Workflow
**File:** `apps/backend/src/temporal/workflow/enrich_for_campaign_workflow.py`

```
EnrichForCampaignWorkflow.run(EnrichForCampaignParams)
  → fan out: enrich_creator_for_campaign_activity per creator  [5 min, 1 attempt each]
  → gather all results
```

---

## Data Model: Creator Table

**File:** `apps/backend/src/models/database/creator.py`

```sql
CREATE TABLE creator (
  id UUID PRIMARY KEY,
  platform TEXT NOT NULL,          -- "instagram", "youtube", "tiktok"
  handle TEXT NOT NULL,            -- @username or channel handle
  email TEXT,
  follower_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  location TEXT,
  keywords TEXT[],                 -- searchable tags
  profile_data JSONB,              -- platform-specific fields
  snapshots JSONB,                 -- historical metric snapshots
  profile_image_path TEXT,
  profile_image_etag TEXT,
  first_seen_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ,
  source TEXT,                     -- "apify_instagram_lookalike", "enrichment", etc.
  UNIQUE (platform, handle)
);
```

**Key design:** `profile_data` JSONB stores all platform-specific fields. This means TikTok-specific fields (e.g., `tiktok_user_id`, `unique_id`, `digg_count`, `heart_count`, `video_count`) can be stored without schema changes.

---

## Where TikTok Slots Into the Current Architecture

### Integration Point 1: New External Service Adapter

**Target file:** `apps/backend/src/services/external/tiktok_apify.py` *(new file)*

Pattern from: `apify.py` (Instagram) and `youtube_apify.py` (YouTube)

```python
class TikTokApifyService:
    """Service for TikTok creator discovery via Apify actors."""

    def __init__(self, api_token: str, profile_scraper_actor_id: str, ...):
        self.client = ApifyClient(token=api_token)
        ...

    def search_creators_by_keyword(self, keyword: str, max_results=50) -> TikTokActorResult:
        # Use: clockworks/free-tiktok-scraper or similar
        # Actor input: {searchQueries: [keyword], resultsPerPage: max_results}
        ...

    def get_creator_profile(self, username: str) -> TikTokProfile:
        # Use: apify/tiktok-scraper or nba1rst/tiktok-profile-scraper
        # For enrichment of known handles
        ...

    def get_hashtag_creators(self, hashtag: str, max_results=50) -> TikTokActorResult:
        # Search by hashtag rather than keyword
        ...

    def extract_email(self, username: str, bio: str, bio_link: str | None) -> str | None:
        # Tier 1: Regex on bio
        # Tier 1.5: bio-link crawl (same scrape_emails_from_url() used for YouTube)
        # TikTok rarely exposes email via API — bio crawl is primary method
        ...
```

**Primary Apify actors to use** (from `third-party-apify-tiktok` analysis):
- `clockworks/free-tiktok-scraper` — keyword/hashtag search, profile data
- `nba1rst/tiktok-profile-scraper` — single profile enrichment
- `apify/tiktok-scraper` — comprehensive multi-mode scraper

**TikTok profile fields to extract:**
```
username (uniqueId), displayName (nickname), bio (signature),
follower_count (followerCount), following_count (followingCount),
video_count (videoCount), heart_count (heartCount), digg_count (diggCount),
is_verified (verified), bio_link (bioLink.link),
avatar_url (avatarLarger), region (region)
```

### Integration Point 2: Creator Storage Function

**Target file:** `apps/backend/src/services/creator/creator_service.py` *(add function)*

```python
def save_creator_from_tiktok(
    db: Session,
    profile: TikTokProfile,  # new Pydantic model
    source: str,
) -> Creator:
    creator = Creator(
        platform="tiktok",
        handle=profile.unique_id,  # @username without @
        email=profile.public_email,
        follower_count=profile.follower_count,
        is_verified=profile.verified,
        location=profile.region,
        keywords=[],
        profile_data={
            "tiktok_user_id": profile.user_id,
            "display_name": profile.nickname,
            "bio": profile.signature,
            "avatar_url": profile.avatar_url,
            "bio_link": profile.bio_link,
            "video_count": profile.video_count,
            "heart_count": profile.heart_count,
            "digg_count": profile.digg_count,
            "following_count": profile.following_count,
        },
        source=source,
    )
    repo = CreatorRepository(db)
    return repo.upsert(creator)
```

### Integration Point 3: Enrichment Service — New Platform Branch

**Target file:** `apps/backend/src/services/creator/enrichment_service.py` *(add elif branch)*

```python
# In enrich_single_creator(), Step 2:
elif creator.platform == "tiktok":
    bio = creator.profile_data.get("bio", "")
    bio_link = creator.profile_data.get("bio_link")

    # Tier 1: Bio text regex
    email = extract_email_from_text(bio)
    if email:
        source = "bio_text"

    # Tier 1.5: Bio link crawl
    if not email and bio_link:
        email = _crawl_bio_link_for_email_tiktok(bio_link)
        if email:
            source = "bio_crawl"

    # Tier 2: Re-scrape with Apify (profile may have been updated)
    if not email:
        tiktok_service = get_tiktok_apify_service()
        profile = tiktok_service.get_creator_profile(creator.handle)
        email = profile.public_email or extract_email_from_text(profile.bio)
        if email:
            source = "apify_rescrape"

    # Tier 3: Influencer Club (may support TikTok)
    if not email:
        email = _enrich_via_influencer_club("tiktok", creator.handle)
        if email:
            source = "influencer_club"
```

**Important note:** TikTok creators very rarely put email in their bio directly. The primary discovery path for email is: bio-link (Linktree/Beacons) → crawl. The `bio_link_apify.py`'s `is_bio_link_url()` + `scrape_emails_from_url()` already supports common link-in-bio services and can be reused without modification.

### Integration Point 4: Discovery Activity — Platform Dispatch

**Target file:** `apps/backend/src/temporal/activity/campaign_discovery_activity.py` *(extend)*

Currently this activity is Instagram-specific. Needs refactoring to platform dispatch:

```python
@activity.defn
def discover_creators_for_campaign_activity(
    params: CampaignDiscoveryParams,
) -> CampaignDiscoveryResult:
    config = params.discovery_config
    platform = config.get("platform", "instagram")  # NEW: platform field

    if platform == "instagram":
        return _discover_instagram_creators(params, config)
    elif platform == "youtube":
        return _discover_youtube_creators(params, config)
    elif platform == "tiktok":
        return _discover_tiktok_creators(params, config)  # NEW
    ...

def _discover_tiktok_creators(params, config):
    """TikTok creator discovery via Apify."""
    seed_profiles = config.get("seed_profiles", [])
    keywords = config.get("keywords", [])
    hashtags = config.get("hashtags", [])
    follower_min = config.get("follower_min", 1000)
    follower_max = config.get("follower_max", 10_000_000)

    tiktok = _get_tiktok_apify_service()

    all_profiles = []

    # Keyword search
    for kw in keywords:
        result = tiktok.search_creators_by_keyword(kw, max_results=50)
        all_profiles.extend(result.profiles)

    # Hashtag search
    for hashtag in hashtags:
        result = tiktok.get_hashtag_creators(hashtag, max_results=50)
        all_profiles.extend(result.profiles)

    # ... filter, dedup, insert (same pattern as Instagram)
```

### Integration Point 5: CSV Import — TikTok Handle Column

**File:** `apps/backend/src/services/csv/social_profile_utils.py`

This file handles platform detection from social URLs and handles in CSV imports. TikTok URLs need to be recognized:
- `https://www.tiktok.com/@username` → `{platform: "tiktok", handle: "username"}`

Currently, this file likely handles Instagram/YouTube only. TikTok URL parsing needs to be added.

### Integration Point 6: Official TikTok API Path (Display API)

This is an additional enrichment path that doesn't exist yet for any platform — using TikTok's **official Display API** when a creator has connected their TikTok account through TikTok Login Kit.

```
Creator connects TikTok account via OAuth
→ Cheerful stores access_token in user_social_account table (new)
→ Enrichment service: access Display API for connected creators
  GET /v2/user/info/ → real follower count, video list, profile data
→ Periodic metric refresh via Display API (not Apify scraping)
```

This would require:
1. New table: `user_social_account` or extending existing creator auth storage
2. TikTok OAuth flow implementation (Login Kit)
3. Display API calls for enrichment and metric updates

**Priority:** This is a "deep integration" path, not a quick win. Start with Apify.

---

## Summary: TikTok Discovery Integration Gap Analysis

| Gap | Current State | Required Change | Effort |
|-----|--------------|----------------|--------|
| TikTok Apify service | ❌ None | New file `tiktok_apify.py` | Medium |
| TikTok creator model | ✅ Creator table works (JSONB handles fields) | None needed | None |
| `save_creator_from_tiktok()` | ❌ None | New function in `creator_service.py` | Small |
| Enrichment branch for TikTok | ❌ None | New `elif` in `enrichment_service.py` | Small |
| Discovery activity: platform dispatch | ❌ Instagram-only | Refactor + add TikTok branch | Medium |
| CSV import: TikTok URL detection | ❌ Likely not supported | Add TikTok URL parsing | Small |
| TikTok Pydantic models | ❌ None | New models in `models/api/tiktok.py` | Small |
| Official Display API enrichment | ❌ None (no platform has OAuth yet) | New auth flow + API client | Large |
| Email extraction for TikTok | ✅ `bio_link_apify.py` already handles link-in-bio | Reuse existing code | None |

---

## Discovery Flows: Current vs TikTok (Proposed)

### Instagram Discovery (Current)
```
Campaign.discovery_config.seed_profiles = ["@seedhandle"]
  ↓ CampaignDiscoveryWorkflow
  ↓ discover_creators_for_campaign_activity
    ↓ ApifyService.get_lookalike_creators(seed)
      ↓ Apify actor (private lookalike actor)
    ↓ Filter: email required + follower range
    ↓ Dedup against campaign_recipient
    ↓ INSERT campaign_recipient
  ↓ populate_outbox_for_new_recipients_activity
```

### YouTube Discovery (Current)
```
(Manual via API or webapp UI)
  ↓ YouTubeApifyService.get_lookalike_channels(channel_url, llm_service)
    ↓ Step 1: get_channel_details (streamers/youtube-channel-scraper)
    ↓ Step 2: _extract_keywords_with_llm (gpt-4.1-mini)
    ↓ Step 3: find_similar_channels_fast (apidojo actor)
    ↓ Step 3b: parallel email extraction
  ↓ save_creator_from_youtube()
  ↓ (add to creator list, then add to campaign)
```

### TikTok Discovery (Proposed)
```
Campaign.discovery_config = {platform: "tiktok", keywords: ["skincare"], hashtags: ["#skincareroutine"]}
  ↓ CampaignDiscoveryWorkflow
  ↓ discover_creators_for_campaign_activity
    ↓ platform dispatch → _discover_tiktok_creators()
    ↓ TikTokApifyService.search_creators_by_keyword(keyword)
      ↓ clockworks/free-tiktok-scraper actor
    ↓ TikTokApifyService.get_hashtag_creators(hashtag)
      ↓ same actor
    ↓ For each creator: extract_email (bio regex + bio-link crawl)
    ↓ save_creator_from_tiktok()
    ↓ Filter: follower range + dedup
    ↓ INSERT campaign_recipient (if email) or campaign_creator (enrichment_pending)
  ↓ populate_outbox_for_new_recipients_activity
```

---

## Key Architecture Observations

1. **Platform-agnostic data layer**: The `Creator` table's `UNIQUE(platform, handle)` constraint already handles TikTok at no cost. No migration needed for basic integration.

2. **JSONB profile_data is the right pattern**: TikTok-specific fields (heart_count, digg_count, video_count, unique_id, bio_link) all fit naturally in `profile_data` without schema changes.

3. **Enrichment waterfall is reusable**: The `bio_link_apify.py` bio-link crawler is the most important enrichment step for TikTok, and it already exists. TikTok creators heavily use Linktree, Beacons, and similar link-in-bio services.

4. **Email is the campaign bottleneck**: Cheerful's campaign outreach is email-based. TikTok creators may have lower email discovery rates than Instagram (less professional context) — this is the primary risk. Mitigation: aggressive bio-link crawling + Influencer Club + accepting higher "pending" rates for async enrichment.

5. **No TikTok DM/messaging integration yet**: The current architecture has no concept of direct platform messaging — everything goes through email. A TikTok DM integration would require substantial new workflow design.

6. **YouTube's LLM keyword step could apply to TikTok**: Instead of exact keyword/hashtag input, a similar "give seed TikTok handle → LLM extracts niche keywords → search TikTok for similar creators" pipeline would improve discovery quality.

---

## Recommended Integration Order

1. **Week 1** — Pydantic models for TikTok profiles (`models/api/tiktok.py`)
2. **Week 1** — `TikTokApifyService` with keyword + hashtag search methods
3. **Week 1** — `save_creator_from_tiktok()` function
4. **Week 2** — TikTok URL parsing in CSV import (`social_profile_utils.py`)
5. **Week 2** — Enrichment branch for TikTok in `enrichment_service.py`
6. **Week 2** — Platform dispatch in `campaign_discovery_activity.py`
7. **Week 3+** — LLM-powered lookalike discovery (seed TikTok profile → keywords → Apify search)
8. **Month 2+** — Official TikTok Display API integration (requires TikTok Login Kit OAuth flow)
