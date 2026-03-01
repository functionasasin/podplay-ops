# Stage 3: Creator Vetting

## What Happens

The 112-creator discovery pool from Stage 2 needs to be cut to 55-65 campaign-ready creators. Vetting applies four filters:

1. **Engagement rate** ≥ 3.0% — gifting ROI depends on creator engagement, not just reach. A 15K-follower creator with 6% ER is worth more than one with 1.5% ER.
2. **Live follower count** 5K-50K — IC search filter isn't always accurate. Apify confirms actual count.
3. **Content relevance** — latest posts must contain food content (Filipino food, recipes, cooking). A "Filipino food" creator who pivoted to lifestyle travel is a miss.
4. **Account activity** — last post within 30 days. Dormant accounts produce no UGC.

Additionally, creators without an email address get a batch enrichment pass to find contact info before outreach.

**Concrete example**: @batangenyo_cooks (6,700 followers, 5.8% ER from IC search) — passes ER filter. Apify profile fetch shows 8 of 12 latest posts contain sinigang or adobo recipes. Last post 4 days ago. Email not in IC search result → batch enrichment finds `batangenyo@gmail.com`. Approved and added to shortlist.

**Counter-example**: @lutongpinoy_diaspora (18,200 followers, 1.4% ER from IC search) — fails ER filter. Removed from pool. Also: @filipinafoodie_chicago (11,500 followers, 3.8% ER) — recent posts are mostly US restaurant reviews, no home cooking. Fails content relevance. Removed.

---

## Cheerful Feature Mapping

| Action | CE Tool / Feature | Status | Source |
|--------|------------------|--------|--------|
| List all 112 creators in pool (paginated) | `cheerful_list_creator_list_items` | spec'd | `../../cheerful-ce-parity-reverse/specs/creators.md` §Creator List Items |
| Get live follower count + recent posts for a creator | `cheerful_get_creator_profile` | spec'd | `../../cheerful-ce-parity-reverse/specs/creators.md` §Creator Search & Discovery |
| Batch email enrichment for creators without email | `cheerful_start_creator_enrichment` | spec'd | `../../cheerful-ce-parity-reverse/specs/creators.md` §Standalone Creator Enrichment |
| Poll enrichment status until complete | `cheerful_get_enrichment_workflow_status` | spec'd | `../../cheerful-ce-parity-reverse/specs/creators.md` §Standalone Creator Enrichment |
| Sync enrich a single creator (ER + email in one call) | `cheerful_enrich_creator` | spec'd | `../../cheerful-ce-parity-reverse/specs/creators.md` §Creator Search & Discovery |
| Remove rejected creator from pool list | `cheerful_remove_creator_from_list` | spec'd | `../../cheerful-ce-parity-reverse/specs/creators.md` §Creator List Items |
| Create "Mama Sita's Shortlist Q1 2026" list | `cheerful_create_creator_list` | spec'd | `../../cheerful-ce-parity-reverse/specs/creators.md` §Creator Lists — CRUD |
| Bulk add approved creators to shortlist | `cheerful_add_creators_to_list` | spec'd | `../../cheerful-ce-parity-reverse/specs/creators.md` §Creator List Items |
| Transfer shortlist creators to Mama Sita's campaign | `cheerful_add_list_creators_to_campaign` | spec'd | `../../cheerful-ce-parity-reverse/specs/creators.md` §Creator List → Campaign Transfer |
| Filter pool list by engagement rate | **NO TOOL** | gap | ER not stored in Creator table from IC search import |
| Bulk remove rejected creators from list | **NO TOOL** | gap | `cheerful_remove_creator_from_list` is single-creator only |
| Auto-assess content relevance (food vs. non-food) | **NO TOOL** | gap | No AI content analysis tool in CE |
| View engagement rate computed from Apify post data | **NO TOOL** | gap | `cheerful_get_creator_profile` returns post data but CE does not compute ER |

---

## Detailed Flow

### Step 1: Paginate Through the Discovery Pool

Get all 112 creators' IDs and engagement metadata (what's available).

```
User: List all creators in the discovery pool

CE (calls cheerful_list_creator_list_items):
  list_id: "list-uuid-discovery-pool"
  limit: 100
  offset: 0

  → GET /api/service/lists/list-uuid-discovery-pool/creators?limit=100&offset=0
  ← Response: {
      items: [
        {
          id: "item-uuid-1",
          creator_id: "creator-uuid-lutongpinoy",
          platform: "instagram",
          handle: "lutongpinoy",
          email: null,
          email_status: "no_email",
          follower_count: 12300,
          is_verified: false,
          location: null,
          profile_data: {"profile_pic_url": "...", "profile_url": "https://instagram.com/lutongpinoy", "full_name": "Luto ng Pinoy"},
          profile_image_url: "https://supabase.co/storage/v1/object/public/creator-images/instagram/lutongpinoy.jpg",
          added_at: "2026-03-01T11:30:00Z"
        },
        {
          id: "item-uuid-2",
          creator_id: "creator-uuid-filipinakitchen",
          platform: "instagram",
          handle: "filipinakitchen",
          email: "collab@filipinakitchen.com",
          email_status: "has_email",
          follower_count: 22100,
          ...
        },
        ... (98 more)
      ],
      total: 112
    }
  → Slack: "Pool has 112 creators. Page 1: 100 shown. 78 without email, 34 with email."

CE (calls cheerful_list_creator_list_items):
  list_id: "list-uuid-discovery-pool"
  limit: 100
  offset: 100

  ← Response: { items: [...12 more...], total: 112 }
  → Slack: "Fetched remaining 12 creators."

# User action: Extract all 112 creator_ids and handles for subsequent steps
# Creator IDs with no_email: ~78 (need enrichment)
# Creator IDs with has_email: ~34 (skip enrichment)
```

> **Limitation**: The list item response includes `follower_count` (from IC search) and `email_status`, but NOT `engagement_rate`. Engagement rate from the original IC search results was not stored when creators were added to the pool via `cheerful_add_search_creators_to_list`. To filter by ER, either re-enrich via IC (`cheerful_enrich_creator`) or compute from Apify post data.

---

### Step 2: Batch Email Enrichment

Run email enrichment on the 78 creators without email. This is asynchronous via Temporal.

```
User: Enrich email for all creators without email (pass the 78 creator IDs without emails)

CE (calls cheerful_start_creator_enrichment):
  creator_ids: [
    "creator-uuid-lutongpinoy",
    "creator-uuid-siniganglover",
    "creator-uuid-batangenyo_cooks",
    ... (75 more)
  ]   # 78 total — must stay under 500 limit ✓

  → POST /api/service/enrich-creators
  ← Response: {
      "workflow_id": "enrich-user-user-uuid-a1b2c3d4"
    }
  → Slack: "Started enrichment for 78 creators. I'll check progress shortly."

# Wait ~3-5 minutes for Temporal workflow to complete

CE (calls cheerful_get_enrichment_workflow_status):
  workflow_id: "enrich-user-user-uuid-a1b2c3d4"

  → GET /api/service/enrich-creators/enrich-user-user-uuid-a1b2c3d4/status
  ← Response: { "status": "running", "results": null }
  → Slack: "Enrichment still running..."

# [Poll every 10s via Slack interaction until complete]

CE (calls cheerful_get_enrichment_workflow_status):
  workflow_id: "enrich-user-user-uuid-a1b2c3d4"

  ← Response: {
      "status": "completed",
      "results": [
        {
          "creator_id": "creator-uuid-lutongpinoy",
          "handle": "lutongpinoy",
          "platform": "instagram",
          "status": "success",
          "email": "lutongpinoy@gmail.com",
          "source": "apify"
        },
        {
          "creator_id": "creator-uuid-siniganglover",
          "handle": "siniganglover",
          "platform": "instagram",
          "status": "success",
          "email": "hello@siniganglover.com",
          "source": "influencer_club"
        },
        {
          "creator_id": "creator-uuid-batangenyo_cooks",
          "handle": "batangenyo_cooks",
          "platform": "instagram",
          "status": "success",
          "email": "batangenyo@gmail.com",
          "source": "bio_crawl"                # Found email in bio link
        },
        {
          "creator_id": "creator-uuid-simplylutong",
          "handle": "simplylutong",
          "platform": "instagram",
          "status": "no_email_found",
          "email": null,
          "source": null
        },
        ... (74 more)
      ]
    }
  → Slack: "Enrichment complete: 46 emails found, 32 not found. Sources: 18 via Apify bio crawl, 16 via Influencer Club, 12 via cache."
```

**Post-enrichment state**: 34 (pre-existing from IC search) + 46 (newly found) = **80 creators with email**, 32 still without. The 32 without email are only contactable via IG DM direct outreach (no email fallback needed — IG DM is the primary channel anyway).

---

### Step 3: Engagement Rate Vetting (Spot-Check Pass)

Engagement rate is not stored on Creator records. To vet ER, use `cheerful_enrich_creator` for spot-checks, or compute from Apify post data (Step 4). Given 112 creators, the practical approach is to spot-check suspicious profiles and do full ER computation during the Apify pass.

```
# Spot-check a creator suspected of low engagement (e.g., follower count is suspiciously round — bought followers)
User: Check profile for @mamasrecipes_ph — are they engaging well?

CE (calls cheerful_enrich_creator):
  handle: "mamasrecipes_ph"
  platform: "instagram"

  → POST /api/service/creator-search/enrich
  ← Response: {
      "handle": "mamasrecipes_ph",
      "platform": "instagram",
      "email": "hello@mamasrecipes.ph",
      "full_name": "Mama's Recipes PH",
      "biography": "Traditional Filipino recipes for every occasion",
      "follower_count": 17300,
      "following_count": 4200,
      "profile_pic_url": "...",
      "is_verified": false,
      "category": "Food",
      "city_name": "Manila",
      "external_url": "https://mamasrecipes.ph",
      "engagement_rate": 1.8     # ← FAILS threshold (< 3.0%)
    }
  → Slack: "@mamasrecipes_ph — 17.3K followers, 1.8% ER. BELOW threshold (need ≥ 3%). Recommend removing."
```

```
# Remove rejected creator from pool
User: Remove @mamasrecipes_ph from the discovery pool

CE (calls cheerful_remove_creator_from_list):
  list_id: "list-uuid-discovery-pool"
  creator_id: "creator-uuid-mamasrecipes_ph"

  → DELETE /api/service/lists/list-uuid-discovery-pool/creators/creator-uuid-mamasrecipes_ph
  ← 204 No Content
  → Slack: "Removed @mamasrecipes_ph from pool."
```

> **Practical workflow note**: Calling `cheerful_enrich_creator` 112 times would generate 112 IC API calls. This is slow (~30s at 3 calls/second) and may hit IC rate limits. The recommended pattern is:
> 1. First use Apify profile data (Step 4) to compute ER from post metrics for ALL creators.
> 2. Use `cheerful_enrich_creator` only for creators where ER is uncertain (e.g., follower count seems inflated) or where a fresh IC read is needed.
> 3. **Gap**: There is no batch ER check tool.

---

### Step 4: Content Quality Check via Apify Profile Fetch

For each creator passing initial ER screening, fetch their Apify profile to:
- Verify live follower count (vs. IC-reported count)
- Check last post date (account activity)
- Read latest post captions for food content signals

Mama Sita's food content signals: keywords `sinigang`, `adobo`, `Filipino`, `lutong`, `Pinoy`, `recipe`, `masarap`, `ulam`, `Mama Sita`, `#SinigangRecipe`.

```
# Profile check for a promising creator
User: Get Instagram profile for @batangenyo_cooks

CE (calls cheerful_get_creator_profile):
  handle: "batangenyo_cooks"
  platform: "instagram"
  refresh: false

  → POST /api/service/creator-search/profile
  ← Response: {
      "handle": "batangenyo_cooks",
      "platform": "instagram",
      "full_name": "Batangas Home Cook",
      "biography": "Home cook from Batangas 🥘 | Sinigang specialist | lutong bahay every day",
      "follower_count": 6900,       # Live count from Apify — IC had 6700, now 6900 (good sign, growing)
      "following_count": 1200,
      "media_count": 89,
      "is_verified": false,
      "is_business": false,
      "email": "batangenyo@gmail.com",
      "bio_links": [],
      "latest_posts": [
        {
          "id": "post-1",
          "shortcode": "C5xZ789",
          "url": "https://www.instagram.com/p/C5xZ789/",
          "caption": "Sinigang na bangus for today's merienda 🍲 My version uses kamias for extra sour! #sinigang #lutongbahay #filipinofood",
          "post_type": "post",
          "like_count": 412,
          "comment_count": 38,
          "view_count": null,
          "timestamp": "2026-02-28T08:30:00Z",    # 2 days ago — ACTIVE ✓
          "is_sponsored": false
        },
        {
          "id": "post-2",
          "shortcode": "C5tZ012",
          "caption": "Adobong manok with pork belly 😋 My lola's secret: coconut milk in the last 5 minutes #adobo #pinoyfood",
          "post_type": "reel",
          "like_count": 678,
          "comment_count": 52,
          "view_count": 4200,
          "timestamp": "2026-02-25T14:00:00Z",
          "is_sponsored": false
        },
        ... (10 more posts, all food content)
      ],
      "source": "apify"
    }

# User computes ER from latest posts:
# Avg likes across 12 posts: (412 + 678 + ...) / 12 ≈ 390
# Avg comments: (38 + 52 + ...) / 12 ≈ 38
# ER = (390 + 38) / 6900 * 100 ≈ 6.2%

# Content check: 12/12 posts are Filipino food. Last post: 2 days ago. ACTIVE.
# VERDICT: APPROVED for shortlist. Ideal Mama Sita's Sinigang Mix creator.

  → Slack: "@batangenyo_cooks — 6.9K followers, last post 2 days ago. All 12 recent posts are Filipino food (sinigang, adobo, lutong bahay). Estimated ER: 6.2% (from post metrics). STRONG candidate."
```

```
# Profile check for a failing creator
User: Get Instagram profile for @filipinafoodie_chicago

CE (calls cheerful_get_creator_profile):
  handle: "filipinafoodie_chicago"
  platform: "instagram"
  refresh: false

  ← Response: {
      "follower_count": 11800,
      "latest_posts": [
        {"caption": "Chicago pizza tour this weekend 🍕 #foodie #chicago", "timestamp": "2026-02-27T..."},
        {"caption": "Best Vietnamese pho in Logan Square! #pho #chicago", "timestamp": "2026-02-20T..."},
        {"caption": "NYC trip recap — so many amazing restaurants 🗽", "timestamp": "2026-02-10T..."},
        # Only 3 of 12 posts contain Filipino content — rest are general foodie/restaurant reviews
        ...
      ]
    }
  → Slack: "@filipinafoodie_chicago — content check: 3/12 recent posts are Filipino food (25%). Most content is Chicago restaurant reviews. NOT ideal for Mama Sita's home cooking campaign."
  # VERDICT: REJECTED (insufficient Filipino home cooking content relevance)
```

---

### Step 5: Create Shortlist and Add Approved Creators

After reviewing all 112 creators (spot-check ER pass + Apify content check), build the shortlist.

**Expected vetting outcomes** (from 112 pool):
- ~20 rejected for low ER (< 3.0%)
- ~15 rejected for irrelevant content (restaurant reviewers, lifestyle pivots, etc.)
- ~10 rejected for inactive accounts (last post > 30 days)
- ~5 removed for other (private accounts, account deleted, >50K live count)
- **~62 approved** for the shortlist (target: ≥ 50 for outreach)

```
User: Create a shortlist for approved creators

CE (calls cheerful_create_creator_list):
  title: "Mama Sita's Shortlist Q1 2026"

  → POST /api/service/lists
  ← Response: {
      "id": "list-uuid-shortlist",
      "user_id": "user-uuid",
      "title": "Mama Sita's Shortlist Q1 2026",
      "created_at": "2026-03-01T14:00:00Z",
      "updated_at": "2026-03-01T14:00:00Z"
    }
  → Slack: "Created shortlist 'Mama Sita's Shortlist Q1 2026'."

User: Add approved creators to the shortlist (pass all 62 approved creator_ids)

CE (calls cheerful_add_creators_to_list):
  list_id: "list-uuid-shortlist"
  creator_ids: [
    "creator-uuid-batangenyo_cooks",
    "creator-uuid-lutongpinoy",
    "creator-uuid-siniganglover",
    "creator-uuid-pinoysoupkitchen",
    "creator-uuid-atsaynakain",
    "creator-uuid-filipinakitchen",
    ... (56 more)
  ]   # 62 total

  → POST /api/service/lists/list-uuid-shortlist/creators
  ← Response: { "added_count": 62, "skipped_count": 0 }
  → Slack: "Added 62 creators to shortlist. 0 duplicates. Shortlist ready for campaign transfer."
```

---

### Step 6: Transfer Shortlist to Mama Sita's Campaign

```
User: Add all shortlist creators to the Mama Sita's campaign

CE (calls cheerful_add_list_creators_to_campaign):
  list_id: "list-uuid-shortlist"
  campaign_id: "campaign-uuid-mamasitas"
  creator_ids: []    # Empty = add ALL creators in shortlist

  → POST /api/service/lists/list-uuid-shortlist/add-to-campaign
  ← Response: {
      "added_count": 62,
      "skipped_count": 0,
      "skipped_creators": [],
      "campaign_id": "campaign-uuid-mamasitas",
      "enrichment_pending_count": 12    # 12 creators without email → Temporal enrichment queued
    }
  → Slack: "Added 62 creators to 'Mama Sita's Gifting Q1 2026'. 50 have emails ready for outreach. 12 need enrichment (emails being found automatically). 0 duplicates."
```

> **Important side effect**: `cheerful_add_list_creators_to_campaign` automatically starts a Temporal enrichment workflow for the 12 email-less creators. The brand rep does not need to manually enrich them again. However, for these 12 creators, IG DM is the only outreach channel available until email enrichment completes.

---

### CE Tool Calls (exact)

#### `cheerful_list_creator_list_items` (paginate pool)

```python
# Tool: cheerful_list_creator_list_items
# Source: loops/cheerful-ce-parity-reverse/specs/creators.md §Creator List Items
# Status: NEW — new service route needed: GET /api/service/lists/{list_id}/creators

# Page 1 (creators 1-100)
cheerful_list_creator_list_items(
  list_id="list-uuid-discovery-pool",
  limit=100,
  offset=0
)
# Expected: {items: [...100 creators...], total: 112}

# Page 2 (creators 101-112)
cheerful_list_creator_list_items(
  list_id="list-uuid-discovery-pool",
  limit=100,
  offset=100
)
# Expected: {items: [...12 creators...], total: 112}

# User action: Collect all creator_ids and segment by email_status
# - creator_ids_with_email: [ids where email_status == "has_email"] → ~34
# - creator_ids_without_email: [ids where email_status == "no_email"] → ~78
```

#### `cheerful_start_creator_enrichment` (batch email finding)

```python
# Tool: cheerful_start_creator_enrichment
# Source: loops/cheerful-ce-parity-reverse/specs/creators.md §Standalone Creator Enrichment
# Status: NEW — new service route needed: POST /api/service/enrich-creators

cheerful_start_creator_enrichment(
  creator_ids=[
    "creator-uuid-lutongpinoy",
    "creator-uuid-siniganglover",
    # ... all 78 creator_ids without email
  ]
)
# Expected response: {"workflow_id": "enrich-user-{user_id}-{hex8}"}
# Poll with cheerful_get_enrichment_workflow_status until status == "completed"
# Expected results: ~46 success, ~32 no_email_found (55-60% email discovery rate)
```

#### `cheerful_get_creator_profile` (Apify profile + post check)

```python
# Tool: cheerful_get_creator_profile
# Source: loops/cheerful-ce-parity-reverse/specs/creators.md §Creator Search & Discovery
# Status: NEW — new service route needed: POST /api/service/creator-search/profile
# Cost note: Each call triggers Apify Instagram scrape if no 24h cache exists.
#   First batch: 112 Apify runs. Subsequent runs within 24h use cache (free).

# Single creator profile check
cheerful_get_creator_profile(
  handle="batangenyo_cooks",
  platform="instagram",
  refresh=False    # Use 24h cache if available
)
# Expected response: full profile + 12 latest posts with captions, likes, comments
# User computes ER: (avg_likes + avg_comments) / follower_count * 100
# User checks content relevance: keyword scan on captions for Filipino food terms
```

#### `cheerful_remove_creator_from_list` (reject from pool)

```python
# Tool: cheerful_remove_creator_from_list
# Source: loops/cheerful-ce-parity-reverse/specs/creators.md §Creator List Items
# Status: NEW — new service route needed: DELETE /api/service/lists/{list_id}/creators/{creator_id}

# Called once per rejected creator (~50 rejections = 50 individual calls)
cheerful_remove_creator_from_list(
  list_id="list-uuid-discovery-pool",
  creator_id="creator-uuid-mamasrecipes_ph"
)
# 204 No Content
# Note: No bulk remove exists — this is a P1 gap for campaigns at this scale
```

#### `cheerful_add_creators_to_list` (build shortlist)

```python
# Tool: cheerful_add_creators_to_list
# Source: loops/cheerful-ce-parity-reverse/specs/creators.md §Creator List Items
# Status: NEW — new service route needed: POST /api/service/lists/{list_id}/creators

cheerful_add_creators_to_list(
  list_id="list-uuid-shortlist",
  creator_ids=[
    "creator-uuid-batangenyo_cooks",
    "creator-uuid-lutongpinoy",
    "creator-uuid-siniganglover",
    # ... all 62 approved creator_ids
  ]
)
# Expected: {"added_count": 62, "skipped_count": 0}
```

#### `cheerful_add_list_creators_to_campaign` (campaign transfer)

```python
# Tool: cheerful_add_list_creators_to_campaign
# Source: loops/cheerful-ce-parity-reverse/specs/creators.md §Creator List → Campaign Transfer
# Status: NEW — new service route needed: POST /api/service/lists/{list_id}/add-to-campaign
# IMPORTANT: This is NOT just a data copy — triggers queue population and enrichment workflow

cheerful_add_list_creators_to_campaign(
  list_id="list-uuid-shortlist",
  campaign_id="campaign-uuid-mamasitas",
  creator_ids=[]    # Empty = transfer ALL 62 creators from shortlist
)
# Expected: {
#   "added_count": 62,
#   "skipped_count": 0,
#   "skipped_creators": [],
#   "campaign_id": "campaign-uuid-mamasitas",
#   "enrichment_pending_count": 12    # Temporal workflow auto-started for 12 email-less creators
# }
```

---

### IG-Specific Considerations

**Account type check**: `cheerful_get_creator_profile` returns `is_business` (boolean). For IG DM outreach, business accounts require a **connected Facebook Page** and Meta App Review permissions to receive DMs. Personal creator accounts (is_business=false) are preferred for this gifting campaign — they also tend to have more authentic engagement.

If `is_business=true`, the creator may still receive DMs but Cheerful's IG DM flow must use the Meta Conversation API flow (same as for creator accounts). This is not a blocker, just noted.

**Creator IGSID (Instagram Scoped ID)**: At this vetting stage, Cheerful does NOT yet have the IGSID for any creator. The IGSID is resolved at DM-send time in Stage 4 (IG Outreach) via the `GET /{ig_user_id}?fields=name,id` API call using the creator's IG handle. Vetting can proceed without IGSID — handle is sufficient for profile lookups.

---

## Gaps & Workarounds

| Gap | Impact | Workaround | Build Priority |
|-----|--------|------------|---------------|
| Engagement rate not stored on Creator record from `cheerful_add_search_creators_to_list` import | ER filter is unavailable without re-fetching IC data. Must call `cheerful_enrich_creator` per creator (slow, rate-limited) or compute manually from Apify post data | Re-fetch ER via `cheerful_enrich_creator` spot-checks; batch-compute ER from `cheerful_get_creator_profile` post metrics (likes+comments)/followers | P1 |
| No bulk remove from creator list (`cheerful_remove_creator_from_list` is single-creator) | Removing 50 rejected creators = 50 individual API calls → slow, tedious in Slack | Call `cheerful_remove_creator_from_list` in sequence; or skip removal and just build shortlist directly from approvals (abandoning the pool) | P1 |
| No AI content relevance analysis | Cannot automatically detect food content vs. non-food in creator posts — requires manual caption review | Human reviews latest post captions from `cheerful_get_creator_profile` response. Look for keywords: "sinigang", "adobo", "lutong", "Filipino food", "recipe", "#MamaSitas" | P1 |
| No bulk filter on list by ER, follower count, or last-post date | Cannot query "show me all list creators with ER < 3%" — must review each profile individually | Manual review via `cheerful_get_creator_profile` per creator; CE agent can iterate and present sorted results | P1 |
| `cheerful_get_creator_profile` does not return pre-computed engagement rate | Must manually compute ER from post metrics: (avg_likes + avg_comments) / follower_count | CE agent computes this from the `latest_posts` array in the response; documented formula above | P2 |
| No batch Apify profile fetch | Fetching profiles for 112 creators = 112 sequential Apify runs; 24h cache mitigates re-runs | CE agent runs sequentially; first batch takes ~5-10 minutes (112 × ~3s Apify latency); subsequent 24h cache is free | P2 |
| `cheerful_start_creator_enrichment` returns email only — no engagement data | Batch enrichment cannot double as ER fetch; two separate passes needed | Accept as-is: enrichment for email, `cheerful_enrich_creator` spot-checks for ER validation | P2 |
| All vetting CE tools not yet built (8 new service routes required) | All vetting actions require direct API calls during development | Use direct API calls to `/v1/` routes with Bearer token during development; CE tools are the production path | P0 |

---

## Success Criteria

- [ ] All 112 pool creators reviewed against 4 vetting criteria: ER ≥ 3.0%, live followers 5K-50K, food content (≥ 5/12 recent posts), account active (last post ≤ 30 days)
- [ ] Batch enrichment completed: `cheerful_get_enrichment_workflow_status` returns `"completed"` with results for all 78 no-email creators
- [ ] Email coverage for shortlist: ≥ 80% of approved creators have a contact email (email OR IG DM contact)
- [ ] Shortlist "Mama Sita's Shortlist Q1 2026" created with **55-70 approved creators**
- [ ] Shortlist has **≥ 50 creators** (minimum for campaign target of 50+ UGC pieces)
- [ ] `cheerful_add_list_creators_to_campaign` succeeds: all shortlist creators now in campaign, `added_count ≥ 55`
- [ ] `cheerful_list_campaign_creators(campaign_id="campaign-uuid-mamasitas")` confirms ≥ 55 creators with `source="list"`
- [ ] At least 10 of the shortlisted creators are specifically strong Sinigang Mix candidates (recent sinigang content in their posts)
- [ ] At least 15 of the shortlisted creators are specifically strong Oyster Sauce candidates (stir-fry, adobo, pancit content)

---

## Dependencies

| Dependency | Required For | Status |
|------------|-------------|--------|
| Stage 2 complete: "Mama Sita's Discovery Pool Q1 2026" list with 80+ creators | Pool to vet | Stage 2 complete |
| `cheerful_list_creator_list_items` CE tool built (new service route: `GET /api/service/lists/{list_id}/creators`) | Enumerate pool | Not yet built |
| `cheerful_start_creator_enrichment` CE tool built (new service route: `POST /api/service/enrich-creators`) | Batch email enrichment | Not yet built |
| `cheerful_get_creator_profile` CE tool built (new service route: `POST /api/service/creator-search/profile`) | Content quality check | Not yet built |
| `cheerful_remove_creator_from_list` CE tool built (new service route: `DELETE /api/service/lists/{list_id}/creators/{creator_id}`) | Reject creators | Not yet built |
| `cheerful_create_creator_list` CE tool built | Create shortlist | Not yet built (also needed Stage 2) |
| `cheerful_add_creators_to_list` CE tool built (new service route: `POST /api/service/lists/{list_id}/creators`) | Build shortlist | Not yet built |
| `cheerful_add_list_creators_to_campaign` CE tool built (new service route: `POST /api/service/lists/{list_id}/add-to-campaign`) | Campaign transfer | Not yet built |
| Apify INSTAGRAM_SCRAPER token configured | `cheerful_get_creator_profile` Apify runs | Backend infra — must be provisioned |
| `INFLUENCER_CLUB_API_KEY` env var configured | `cheerful_enrich_creator`, `cheerful_start_creator_enrichment` | Infra config — must be provisioned |
| Stage 1 complete: Campaign created with campaign_id | `cheerful_add_list_creators_to_campaign` target | Stage 1 complete |
| Stage 4 (IG Outreach) | First creator contact begins | Pending |
