# Stage 10: ROI Measurement

## What Happens

It's Day 49 of the campaign (~April 18). Products were dispatched on Day 17 (February 15). Metro Manila creators received their bundles around Day 22-24; provincial creators around Day 31. The 30-day informal posting deadline passed ~Day 47 for the first group of recipients.

Stage 8 has been running `PostTrackingWorkflow` daily for 30+ days. Stage 9 (if built) has been capturing Story mentions and feed @mentions in real-time. The brand rep now needs to close the loop: **what did this campaign actually produce?**

The success metrics for Mama Sita's gifting campaign are content ROI metrics:
1. **UGC count** — total content pieces (feed posts, Reels, Stories) produced
2. **Engagement** — total likes, comments, views across all posts
3. **Estimated impressions/reach** — how many people were exposed to Mama Sita's content
4. **Per-creator ranking** — which creators performed best (highest engagement, most posts)
5. **Campaign summary** — opt-in rate, posting rate, cost per UGC piece

This is NOT a revenue attribution stage — Mama Sita's gifting campaign has no promo codes, no Shopify integration, no affiliate tracking (those would require Feature 003: Revenue Attribution Engine, which is not built). Success is measured purely by content output and engagement.

**Concrete numbers expected at Day 49**:

| Metric | Target | Realistic Range |
|--------|--------|-----------------|
| Creators contacted (IG DM outreach) | 62 | 62 (fixed) |
| Opted-in creators | 32+ | 28-35 |
| Creators who posted content | 25+ | 22-28 |
| Feed posts + Reels captured (Stage 8) | 48 | 40-80 |
| Stories captured (Stage 9 Layer 1A) | 9 | 6-15 |
| Organic hashtag posts (Stage 9 Layer 2) | 10 | 5-20 |
| Total unique content touchpoints | ~67 | 55-100 |
| Total likes across all feed posts | ~12,500 | 8,000-20,000 |
| Total Reel views | ~160,000 | 80,000-300,000 |
| Estimated reach (25% of posting creator followers) | ~72,000 | 50,000-120,000 |

**The reporting workflow is entirely manual aggregation from CE queries.** Cheerful does not have a "generate campaign report" tool. The brand rep (who is the developer) runs several CE tool calls, collects the numbers, and compiles a summary — either in Slack or exported to Google Sheets.

---

## Cheerful Feature Mapping

| Action | CE Tool / Feature | Status | Source |
|--------|------------------|--------|--------|
| Get campaign pipeline counts (opted-in, contacted, ordered totals) | `cheerful_get_dashboard_analytics()` → `gifting_pipeline` + `active_campaigns[Mama Sita's]` | spec'd (NEW — service route needed) | `../../cheerful-ce-parity-reverse/specs/analytics.md` §Dashboard Analytics |
| Get per-creator post counts for all shipped creators | `cheerful_list_campaign_recipients(campaign_id=..., status=["ORDERED"], sort_by="post_count", sort_dir="desc")` | spec'd (not built) | `../../cheerful-ce-parity-reverse/specs/campaigns.md` §`cheerful_list_campaign_recipients` |
| Get full post library with engagement metrics | `cheerful_list_posts(limit=100, sort="desc")` | spec'd (not built) | `../../cheerful-ce-parity-reverse/specs/creators.md` §Posts |
| Get per-creator posts with individual engagement | `cheerful_list_creator_posts(campaign_id, creator_id)` | spec'd (not built) | `../../cheerful-ce-parity-reverse/specs/creators.md` §Posts |
| Get UGC library counts by capture source | `cheerful_list_ugc_content(campaign_id=..., limit=100)` → `by_source` breakdown | **gap** | Gap 47 — `ugc_content` table does not exist; Stage 9 entirely blocked |
| Get Story count and media URLs | `cheerful_list_ugc_content(campaign_id=..., capture_source="story_mention")` | **gap** | Gap 47 — no ugc_content table |
| Get organic creator count via hashtag monitoring | `cheerful_list_ugc_content(campaign_id=null, capture_source="hashtag")` | **gap** | Gap 47 — no ugc_content table; Gap 52 — HashtagMonitoringWorkflow not built |
| Compute aggregate engagement (sum likes + comments across all posts) | CE agent computes client-side from `cheerful_list_posts` response | exists via computation — no dedicated tool | Manual aggregation |
| Compute per-creator engagement rate (ER) | CE agent computes: `(likes + comments) / followers` from `cheerful_list_creator_posts` + `cheerful_get_creator_profile` | **gap** — follower count not on `creator_post` row; requires extra lookup | Gap 63 (new) |
| Get estimated reach / impressions | **gap** — no impressions field on `creator_post`; Insights API not integrated | **gap** | Gap 59 (new) — must estimate from follower count × algorithm factor |
| Get saves count per post | **gap** — Apify profile scraper does not expose saves | **gap** | Gap 61 (new) — not available via public profile scraping |
| Get Story engagement (views, exits, replies) | **gap** — Messaging API delivers Story media but no Story Insights | **gap** | Gap 62 (new) — Story Insights require Creator Account and `instagram_manage_insights` |
| Generate campaign summary report | **gap** — no `cheerful_generate_campaign_report` tool exists | **gap** | Gap 60 (new) — brand rep manually compiles from multiple CE queries |
| Export final report to Google Sheets | `cheerful_export_to_sheet(campaign_id, sheet_url)` | **gap** | Gap 39 from Stage 7 — no export CE tool exists |
| Rank creators by engagement for next campaign targeting | CE agent sorts `cheerful_list_campaign_recipients` results by post_count, then cross-references engagement from `cheerful_list_posts` | partial — requires multiple calls + client-side sort | Manual multi-step CE workflow |
| Mark campaign as complete | `cheerful_update_campaign(campaign_id, status="completed")` | spec'd (not built) | `../../cheerful-ce-parity-reverse/specs/campaigns.md` §`cheerful_update_campaign` |

---

## Detailed Flow

### Phase A: Campaign Pipeline Summary (Day 49)

The brand rep starts with a top-level view of how the campaign performed across all pipeline stages.

```
User → Slack: "Give me the Mama Sita's campaign summary — opted in, ordered, posted"
```

**A1 — Dashboard analytics (cross-campaign context)**:

```
CE: cheerful_get_dashboard_analytics()
→ Returns:
  gifting_pipeline:
    new: 0          ← no more uncontacted creators
    contacted: 10   ← creators who received DM but never replied
    opted_in: 0     ← legacy status (unused in this campaign flow)
    pending_details: 0
    ready_to_ship: 0
    ordered: 32     ← all confirmed creators at ORDERED (shipped)
    opted_out: 20   ← declined + no response after follow-up
    total: 62       ← matches outreach count

  active_campaigns: [
    {
      "name": "Mama Sita's Gifting 2026",
      "campaign_type": "gifting",
      "status": "active",
      "total_creators": 62,
      "opted_in_count": 32,
      "opted_out_count": 20,
      "replied_count": 32
    }
  ]
  opt_in_rate: 51.6    ← 32/62 — strong for gifting (typical: 20-35%)
```

**Important caveat**: `cheerful_get_dashboard_analytics` is cross-campaign aggregated. If the brand has other campaigns, the gifting pipeline numbers reflect ALL gifting campaigns. For a single-campaign view, the brand rep should use `cheerful_list_campaign_recipients` with count queries. The `active_campaigns` list gives per-campaign breakdowns — the brand rep reads the Mama Sita's row specifically.

**A2 — Per-campaign recipient count breakdown**:

```
CE: cheerful_list_campaign_recipients(
    campaign_id="campaign-uuid-mamasitas",
    status=["ORDERED"],
    include_all_contacts=true,
    limit=1
)
→ total: 32    ← shipped creator count

CE: cheerful_list_campaign_recipients(
    campaign_id="campaign-uuid-mamasitas",
    include_all_contacts=true,
    limit=1
)
→ total: 62    ← all creators in campaign (outreach denominator)
```

CE agent presents pipeline summary:
```
*Mama Sita's Gifting Campaign 2026 — Pipeline Summary*

Outreach: 62 creators contacted via IG DM
Opted in: 32 (51.6%) ✅ — outperforms typical 20–35% for gifting
Declined/no response: 20 (32.3%)
Non-replies: 10 (16.1%)
Products shipped: 32 packages (Oyster Sauce 350mL + Sinigang Mix 6-pk bundle)
```

---

### Phase B: Content Count Report (Day 49)

**B1 — Pull all posts with engagement**:

```
User → Slack: "How many posts did we collect for Mama Sita's? Show me the breakdown."
CE: cheerful_list_posts(
    limit=100,
    sort="desc"
)
→ Returns all posts from all campaigns; CE agent filters campaign_name="Mama Sita's Gifting 2026"
→ Expected: 48 posts total (25 posting creators × avg 1.9 posts each)
```

CE agent aggregates from filtered results:
```python
# CE agent computation from cheerful_list_posts response
posts = [p for p in response["posts"] if p["campaign_name"] == "Mama Sita's Gifting 2026"]
reels = [p for p in posts if p["post_type"] == "reel"]
feed_posts = [p for p in posts if p["post_type"] == "post"]

total_posts = len(posts)           # 48
total_reels = len(reels)           # 28 (Reels dominate food creator output)
total_feed = len(feed_posts)       # 20
total_likes = sum(p["like_count"] for p in posts)             # 12,450
total_comments = sum(p["comment_count"] for p in posts)       # 847
total_views = sum(p["view_count"] for p in reels if p["view_count"])  # 156,000
avg_likes = total_likes / total_posts                         # 259.4
```

**B2 — Check how many creators posted** (cross-reference with recipient list):

```
CE: cheerful_list_campaign_recipients(
    campaign_id="campaign-uuid-mamasitas",
    status=["ORDERED"],
    include_all_contacts=true,
    sort_by="post_count",
    sort_dir="desc",
    limit=100
)
→ 32 rows; CE agent counts rows where post_count > 0
```

Expected result: 25 of 32 (78.1%) posted at least 1 piece of feed/Reel content.

---

### Phase C: UGC Library Count (Day 49 — Requires Stage 9 Build)

In the fully-built state:

```
User → Slack: "How many UGC pieces total, including Stories and hashtag posts?"
CE: cheerful_list_ugc_content(
    campaign_id="campaign-uuid-mamasitas",
    limit=100
)
→ total: 47
→ by_source: { story_mention: 9, mention_webhook: 18, tags_polling: 10, hashtag: 10 }
```

**In the current gap state** (Stage 9 entirely not built): `cheerful_list_ugc_content` does not exist. The brand rep can only see Stage 8's `creator_post` records (feed posts and Reels from opted-in creators). Stories (9 expected), photo-tags (10 expected), and organic hashtag posts (10 expected) are all invisible.

**Gap impact on ROI numbers**:
- Without Stage 9: total content count = 48 (feed/Reels only)
- With Stage 9 fully built: total content count = ~67 (48 feed/Reels + 9 Stories + 10 organic hashtag posts)
- The difference is ~40% more content — significant for the ROI report to Mama Sita's marketing team

---

### Phase D: Per-Creator Performance Ranking (Day 49)

The brand rep wants to know which creators performed best — both for this campaign's final report and to inform which creators to invite back for the next Mama Sita's campaign.

**D1 — Get all post data for ranking**:

```
CE: cheerful_list_posts(limit=100, sort="desc")
→ Filter to Mama Sita's campaign
→ Group by creator_name

# CE agent computes per-creator aggregate:
creator_stats = {}
for post in mamasitas_posts:
    handle = post["creator_name"]  # use as key; ideally creator_id
    if handle not in creator_stats:
        creator_stats[handle] = {"posts": 0, "likes": 0, "comments": 0, "views": 0}
    creator_stats[handle]["posts"] += 1
    creator_stats[handle]["likes"] += post["like_count"]
    creator_stats[handle]["comments"] += post["comment_count"]
    creator_stats[handle]["views"] += post.get("view_count") or 0

# Sort by total engagement (likes + comments + views/10)
ranked = sorted(
    creator_stats.items(),
    key=lambda x: x[1]["likes"] + x[1]["comments"] + x[1]["views"] // 10,
    reverse=True
)
```

**D2 — Get follower counts for ER computation** (requires extra calls — gap for automation):

```
# For each top creator, get follower count:
CE: cheerful_list_campaign_recipients(
    campaign_id="campaign-uuid-mamasitas",
    include_all_contacts=true,
    limit=100
)
→ Each row includes social_media_handles with follower_count (if enriched via Stage 3)
```

**Note**: Follower count is only on the recipient list if the creator was enriched during Stage 3 (creator vetting). If `cheerful_start_creator_enrichment` was not run for all creators (likely, given Gap 15), some creators may have `follower_count: null` and ER cannot be computed.

**CE agent presents per-creator ranking**:
```
*Mama Sita's — Top 5 Creators by Total Engagement*

| # | Handle               | Followers | Posts | Likes  | Views   | ER    |
|---|----------------------|-----------|-------|--------|---------|-------|
| 1 | @sabawculture        | 22K       | 2     | 2,112  | 67,000  | 4.2%  |
| 2 | @filipinafoodie      | 12K       | 3     | 1,333  | 19,600  | 3.9%  |
| 3 | @lutongpinoyni_grace | 18K       | 2     | 987    | 34,000  | 3.2%  |
| 4 | @panlasangpinoylife  | 31K       | 1     | 847    | 22,500  | 2.9%  |
| 5 | @kutsaranimelinda    | 8.5K      | 2     | 411    | 0       | 3.7%  |

ER = (likes + comments) / followers × 100
Views: Reels only — feed posts show N/A
```

---

### Phase E: Estimated Reach and Impressions (Day 49 — Partial)

Instagram does not expose Insights API data (reach, impressions) for posts on creator accounts. The brand rep can only estimate:

**Estimation formula**:
```
Estimated organic reach = Sum(posting_creator_follower_count × 0.25)

Reel impression estimate = Sum(view_count for all Reels)

Feed post reach estimate = Sum(feed_post_creator_follower_count × 0.20)
```

In practice:
```
Posting creators: 25
Their combined followers: ~287,500 (based on 5K-50K range, avg ~11,500)

Reel views (exact from Apify): 156,000 views
Feed post estimated reach: 7 feed creators × avg 9,400 followers × 0.20 = ~13,200

Total estimated impressions: 156,000 + 13,200 = ~169,200
```

**The brand rep asks CE to compute this**:

```
User → Slack: "Estimate total reach for Mama Sita's campaign"
CE: [no single tool; agent chains multiple calls]

1. cheerful_list_campaign_recipients(campaign_id=..., status=["ORDERED"], post_count_min=1)
   → get follower counts for posting creators

2. cheerful_list_posts(limit=100) → filter to campaign → sum view_counts for Reels

3. CE agent computes: Reel views (exact) + feed post reach estimate (followers × 0.20)
   → Presents: "Estimated reach: ~169,000 (156K Reel views + ~13K feed post reach)"
```

**Gap 59 makes this imprecise**: Without real Insights API integration, the estimate could be 30-50% off. The actual `reach` metric (unique accounts that saw the post) is not available via Apify profile scraping.

---

### Phase F: Final ROI Report Compilation (Day 49)

The brand rep compiles the final Slack report block, which can be shared with Mama Sita's marketing team or exported to Google Sheets.

**Full CE interaction sequence to build the report**:

```
Step 1: cheerful_get_dashboard_analytics()
        → pipeline summary, opt-in rate

Step 2: cheerful_list_campaign_recipients(
            campaign_id="campaign-uuid-mamasitas",
            status=["ORDERED"],
            include_all_contacts=true,
            sort_by="post_count",
            sort_dir="desc",
            limit=100
        )
        → 32 creators; count post_count > 0 → posting rate

Step 3: cheerful_list_posts(limit=100, sort="desc")
        → filter to Mama Sita's; aggregate likes, comments, views

Step 4: cheerful_list_ugc_content(campaign_id="campaign-uuid-mamasitas")
        [GAP: if not built, skip this step; UGC count = 0 Stories, 0 organic hashtag]

Step 5: CE agent compiles and formats
```

**Final report output (Day 49)**:

```
╔══════════════════════════════════════════════════════╗
║   Mama Sita's Gifting Campaign 2026 — Final Report  ║
╚══════════════════════════════════════════════════════╝

📦 OUTREACH & CONVERSION
  Creators contacted (IG DM):    62
  Opted in:                      32  (51.6%)  ✅ target: 50+
  Products shipped:              32 bundles (Oyster Sauce 350mL + Sinigang Mix 6-pk)

🎥 CONTENT PRODUCED
  Posting creators:              25 of 32  (78.1%)
  Feed posts + Reels captured:   48
  └── Feed posts:                20
  └── Reels:                     28
  Stories captured (Layer 1A):   9  ← requires Stage 9 build; 0 without
  Hashtag posts (organic):       10 ← requires Stage 9 Layer 2; 0 without
  ─────────────────────────────────
  Total content touchpoints:     67  (48 without Stage 9)

📊 ENGAGEMENT (Feed Posts + Reels)
  Total likes:                   12,450
  Total comments:                   847
  Total Reel views:             156,000
  Avg likes/post:                   259
  Avg ER (posting creators):       3.7%  ← above 3% micro-creator benchmark

🌐 ESTIMATED REACH
  Reel views (exact):           156,000
  Feed post estimated reach:    ~13,200  (20% of posting creator followers)
  Total estimated impressions: ~169,000

💰 CAMPAIGN ECONOMICS
  Product cost per bundle:       ~₱450 (Oyster Sauce + Sinigang Mix)
  Shipping per package (Metro):  ~₱150 / Provincial: ~₱220
  Total product + shipping cost: ~₱19,840
  Cost per UGC piece (full):     ~₱296 (67 pieces)
  Cost per UGC piece (Stage 8 only): ~₱413 (48 pieces)
  Cost per engaged impression:   ~₱0.12

🏆 TOP CREATORS (by engagement)
  1. @sabawculture (22K)       — 2 posts, 2,112 likes, 67K views, 4.2% ER
  2. @filipinafoodie (12K)     — 3 posts, 1,333 likes, 19.6K views, 3.9% ER
  3. @lutongpinoyni_grace (18K)— 2 posts, 987 likes, 34K views, 3.2% ER

❌ NON-POSTERS (post_count = 0 after 30 days)
  7 creators — to be followed up via IG DM (manual)
  Note: some may have posted Stories only (not captured by Stage 8)
```

---

### Phase G: Mark Campaign Complete

```
User → Slack: "Mark the Mama Sita's campaign as completed"
CE: cheerful_update_campaign(
    campaign_id="campaign-uuid-mamasitas",
    status="completed"
)
→ Campaign.status: "active" → "completed"
→ PostTrackingWorkflow: still runs for remaining tracking_ends_at window
   (workflow checks campaign.status != COMPLETED — see Stage 8 notes)
```

**Note**: Setting campaign to `completed` stops the `PostTrackingSchedulerWorkflow` from picking it up on subsequent runs. Brand rep should wait until Day 49+ (after 30-day posting window) before marking complete to avoid cutting off tracking prematurely.

---

## CE Tool Calls (Exact)

### `cheerful_get_dashboard_analytics` — campaign pipeline view

```
Tool: cheerful_get_dashboard_analytics()
Parameters: (none required; optional recent_optins_days=60 to see all opted-in during campaign)

Key fields used for ROI report:
  gifting_pipeline.contacted:    integer  (DM sent, no response after follow-up)
  gifting_pipeline.ordered:      integer  (shipped = 32)
  gifting_pipeline.opted_out:    integer  (declined)
  gifting_pipeline.total:        integer  (total in campaign = 62)
  active_campaigns[].opted_in_count   → for per-campaign opted_in
  active_campaigns[].replied_count    → for per-campaign replied
  opt_in_rate:                   float   (cross-campaign; use per-campaign calc instead)

What user does:
  Read gifting_pipeline to get pipeline stage counts
  Compute campaign opt-in rate: ordered / total = 32/62 = 51.6%
  Note: if other gifting campaigns exist, gifting_pipeline is aggregate
  Use active_campaigns[].opted_in_count for per-campaign breakdown
```

### `cheerful_list_campaign_recipients` — per-creator post status and posting rate

```
Tool: cheerful_list_campaign_recipients
Parameters:
  campaign_id: "campaign-uuid-mamasitas"
  status: ["ORDERED"]
  include_all_contacts: true
  sort_by: "post_count"
  sort_dir: "desc"
  limit: 100

Key fields for ROI:
  rows[*].name:                  Creator display name
  rows[*].social_media_handles:  [{platform, handle}]
  rows[*].post_count:            integer (0-N; the primary "posted vs not" signal)
  rows[*].post_last_checked_at:  datetime (verify tracking ran)

What user does:
  Count rows where post_count > 0 → posting creator count
  Sum all post_count values → total posts (cross-check vs cheerful_list_posts total)
  Identify rows with post_count=0 → non-poster list for follow-up
  Sort descending → top posters are at the top for recognition
```

### `cheerful_list_posts` — aggregate engagement data

```
Tool: cheerful_list_posts
Parameters:
  limit: 100
  sort: "desc"

Expected response fields for ROI computation:
  posts[*].campaign_id:     UUID  ← filter to "campaign-uuid-mamasitas"
  posts[*].campaign_name:   string ← filter to "Mama Sita's Gifting 2026"
  posts[*].post_type:       "post" | "reel"
  posts[*].like_count:      integer
  posts[*].comment_count:   integer
  posts[*].view_count:      integer | null  (Reels only)
  posts[*].creator_name:    string  (for per-creator aggregation)
  posts[*].posted_at:       ISO 8601

CE agent computes (client-side):
  total_posts = count where campaign_name matches
  total_likes = sum like_count
  total_comments = sum comment_count
  total_views = sum view_count (Reels only)
  avg_likes = total_likes / total_posts
  posting_creators = len(set(posts[*].creator_name))

Note: cheerful_list_posts is cross-campaign; filter by campaign_name or campaign_id
Note: if total_posts > 100, adjust limit or paginate via offset
```

### `cheerful_list_creator_posts` — per-creator detail for ranking

```
Tool: cheerful_list_creator_posts
Parameters:
  campaign_id: "campaign-uuid-mamasitas"
  creator_id: "creator-uuid-{N}"  ← must iterate per creator (no bulk variant)

Expected response for per-creator ranking:
  posts[*].like_count:    integer
  posts[*].comment_count: integer
  posts[*].view_count:    integer | null
  total:                  integer (per-creator post count)

What user does:
  Run for top 10 creators only (by post_count from Phase B)
  Sum per-creator: total_likes, total_comments, total_views
  Compute ER if follower count available:
    er = (total_likes + total_comments) / (follower_count × total_posts)
  Sort by composite engagement score → create top-performer ranking
  Note: this requires N sequential calls for N creators; tedious without bulk tool
```

### `cheerful_list_ugc_content` — UGC library count (GAP — documents what will be possible)

```
Tool: cheerful_list_ugc_content  [NOT BUILT — Gap 47]
Parameters (when built):
  campaign_id: "campaign-uuid-mamasitas"
  limit: 100

Expected response shape (when built):
  total: integer  (total UGC pieces attributed to this campaign)
  by_source: {
    story_mention: integer,    ← Stories before expiry (exclusive to Stage 9)
    mention_webhook: integer,  ← real-time feed @mentions
    tags_polling: integer,     ← photo-tagged posts
    hashtag: integer           ← organic hashtag posts
  }
  items[*].like_count:         integer | null  (null for Stories)
  items[*].comments_count:     integer | null
  items[*].capture_source:     string
  items[*].posted_at:          ISO 8601

What user does (when built):
  Add total UGC items to content count
  Separate Stories from feed posts (Stories have no like_count)
  Note organic hashtag creators for future campaign outreach
  Cross-reference campaign_id attribution on organic UGC items
```

---

## IG-Specific Considerations

### Insights API Is Not Available for Creator Posts

Instagram's Insights API (`/{media_id}/insights`) requires the posting account to be a Business or Creator Account and the requester to be the owner. Since the brand rep does not own `@filipinafoodie`'s account, they cannot fetch real impressions, reach, or saves data via API.

**What this means for Mama Sita's ROI**:
- `like_count` and `comment_count` are scraped by Apify from the public profile — **available**
- `view_count` for Reels is visible on public profiles — **available** (scraped by Apify)
- `reach` (unique accounts) — **not available** (Insights API only)
- `impressions` (total views, including repeat) — **not available**
- `saves` count — **not available** (profile scraper limitation)
- `shares` count — **not available**

**Consequence**: The ROI report will show:
- Exact: likes, comments, Reel views
- Estimated: reach (~25% of followers per post for micro-creators), total impressions (Reel views + estimated feed reach)
- Missing: saves (high-signal engagement metric for food content), shares, non-follower discovery

For food content, saves are particularly valuable (recipes get saved for later cooking). Their absence is a notable metric gap.

### Story Engagement Data Is Structurally Unavailable

Even when Stage 9 is fully built and Stories are captured, the brand rep cannot get Story performance metrics (views, exits, replies, reach) for creator Stories. The Messaging API delivers:
- Story media file ✅
- Creator's IGSID ✅
- Timestamp ✅
- Story views/reach/exits ❌ — only visible to the story author, not the @mentioned brand

This is a hard Instagram API limitation. The brand can see "9 Stories were posted mentioning us" but cannot quantify how many people saw those Stories.

### Organic Creator Discovery (Hashtag Layer)

The hashtag monitoring layer (Stage 9 Layer 2) surfaces creators who are not in the gifting campaign but used `#MamaSitas` or `#SinigangRecipe`. These creators are brand advocates. For the ROI report, they represent:
- Additional UGC pieces not paid for by the campaign
- Future campaign candidates at no discovery cost (already self-selecting)
- Evidence of organic brand affinity in the Filipino food creator community

The brand rep should note these handles and add them to a "future campaign" creator list for the next Mama Sita's campaign.

### Posting Rate vs. Product Receipt

Not all 32 opted-in creators may have received their packages by Day 49. If provincial shipments took 14+ days (some may have arrived Day 31) and the 30-day posting window runs from receipt, some creators may still be within their legitimate posting window at Day 49. The brand rep should:

1. Cross-reference `post_count=0` creators with their shipping addresses (Metro vs. Provincial)
2. Adjust "overdue" judgment: Metro Manila creators with `post_count=0` after Day 47 are likely non-posters; provincial creators with `post_count=0` after Day 61 (Day 31 receipt + 30 days) are non-posters
3. This nuance is not surfaced by Cheerful — the brand rep must cross-reference the Google Sheets shipping manifest from Stage 7

---

## Gaps & Workarounds

| # | Gap | Impact | Workaround | Build Priority |
|---|-----|--------|------------|----------------|
| 59 | No impressions/reach metric on `creator_post` — Apify profile scraper does not expose Insights API data (reach, impressions, saves) | ROI report must use estimated reach (follower count × 0.25) instead of actual reach; saves metric (high-signal for food content) completely unavailable | Estimate: sum of posting creator followers × 0.25 for reach; use view_count for Reels (exact); accept missing saves metric | P1 — true reach requires creator-side API access (not possible) OR creator-provided screenshots; add `estimated_reach` computed field to `creator_post` based on follower count at match time |
| 60 | No `cheerful_generate_campaign_report` CE tool — brand rep must run 3-5 separate CE calls and manually compile the final report | ROI report takes 15-20 minutes of sequential Slack interactions; no single-command summary | Run 4 CE calls sequentially (dashboard_analytics → list_recipients → list_posts → list_ugc_content), paste numbers into Google Sheets template, compute totals | P1 — high value for brand rep + client-facing demos; new CE tool: `cheerful_generate_campaign_report(campaign_id, include_ugc=true)` → returns pre-computed ROI summary block |
| 61 | No saves count in `creator_post` — Apify's Instagram profile scraper does not return saves | Saves are the highest-signal engagement metric for food content (recipes get saved); their absence understates actual engagement quality | Accept saves as unavailable; note in ROI report as "metric not available via public profile scraping" | P2 (unresolvable without creator account access) — Instagram API does not expose saves on non-owned posts via any public endpoint |
| 62 | No Story engagement data — Messaging API delivers Story media but no view counts, exit rate, or reach for Story mentions | 9 Stories captured but zero engagement data; brand rep cannot quantify Story impression value | Count Stories as "+9 content pieces" in the UGC count; note "Story impressions not measurable via API" in report | P2 (unresolvable) — Story Insights are only available to the Story author via Insights API; @mentioned brands cannot access this data |
| 63 | No per-creator ER computation in a single CE call — follower count not on `creator_post` rows; requires extra `cheerful_list_campaign_recipients` call and client-side join | Cannot produce a ranked creator leaderboard in a single CE interaction; requires 2 calls + CE-side data join | CE agent: (1) `cheerful_list_campaign_recipients` → get follower counts per creator; (2) `cheerful_list_posts` → aggregate engagement per creator; (3) compute ER in-context and rank | P1 — add `follower_count_at_capture` to `creator_post` schema (stored at Apify fetch time); add `cheerful_list_creator_performance(campaign_id, sort_by="er")` CE tool that returns pre-ranked creator performance table |
| 60-bulk | `cheerful_list_posts` has no `campaign_id` filter param — all posts from all campaigns returned; brand rep must filter in-context | With multiple active campaigns, the full post list may exceed 100 results; Mama Sita's posts could be buried or truncated | Use `limit=200` if available; filter by `campaign_name` in CE agent context; may miss posts if total exceeds limit | P1 — add `campaign_id: UUID | null` filter param to `cheerful_list_posts`; critical for multi-campaign users |

---

## Success Criteria

At the end of Stage 10, "100% hero journey" means:

1. **Pipeline summary complete**: Brand rep has confirmed opt-in count (32), posting rate (25/32 = 78%), and opted-out count from `cheerful_get_dashboard_analytics` gifting_pipeline
2. **Content count confirmed**: `cheerful_list_posts` returns ≥40 posts for Mama Sita's campaign; CE agent provides total by type (Reels vs. feed posts)
3. **Engagement aggregated**: Total likes, comments, and Reel views computed from `cheerful_list_posts` data; CE agent presents averages and totals
4. **UGC library counted** (if Stage 9 built): `cheerful_list_ugc_content` returns ≥40 records with `by_source` breakdown; Stories confirmed captured before CDN expiry
5. **Per-creator ranking complete**: Top 5 creators identified by engagement (likes + comments + views); ER computed where follower count is available
6. **Reach estimated**: CE agent provides estimated reach with explicit "estimated" label; Reel views presented as exact metric
7. **Campaign marked complete**: `cheerful_update_campaign(status="completed")` called; campaign removed from active dashboard
8. **Report shareable**: Full Slack-formatted report block ready to copy-paste or screenshot for Mama Sita's marketing team

**Measurable targets by Day 49**:
- 5 CE tool calls sufficient to compile full report (pipeline, recipient list, posts, UGC, update status)
- Total content count ≥48 (feed/Reels from Stage 8 only); ≥67 with Stage 9 fully operational
- Total engagement: ≥10,000 likes + ≥600 comments + ≥100,000 Reel views
- At least 3 creators with ER ≥3.5% → strong evidence of micro-creator selection quality
- Campaign cost per UGC piece ≤₱500 (demonstrates gifting campaign economics)

---

## Dependencies

| Dependency | Required By | Status |
|-----------|------------|--------|
| Stage 8 complete: `PostTrackingWorkflow` has run for 30+ days | Feed post + Reel data in `creator_post` table; `post_count` fields populated | Depends on Gap CE-update (`cheerful_update_campaign`) and Gap post-tools |
| All 4 post CE tools built (Gaps 8/post-tools) | `cheerful_list_posts` and `cheerful_list_creator_posts` are the primary ROI data sources | P0 — without these, brand rep has no CE access to engagement data |
| `cheerful_get_dashboard_analytics` service route built | Campaign pipeline summary (opted-in, ordered, opted-out counts) | Spec'd as NEW; main route exists; service route needs build |
| Stage 9 complete (optional but recommended): UGC capture library | Story count, organic hashtag creator count; inflates total UGC from 48 → 67+ | P0 for `ugc_content` table (Gap 46); P0 for CE tools (Gap 47) |
| `cheerful_update_campaign` built | Marking campaign `completed` at end of Stage 10 | Spec'd in campaigns.md; same gap as CE-update from Stages 8/1 |
| Follower count on campaign_creator records | Per-creator ER computation; requires Stage 3 enrichment was run | Gap 63 — enrichment was partial; some creators may lack follower_count |
| Google Sheets shipping manifest from Stage 7 | Cross-referencing non-posters with Metro vs. Provincial addresses (to adjust posting deadline expectations) | Manual spreadsheet from Stage 7 workaround (Gap 39) |
