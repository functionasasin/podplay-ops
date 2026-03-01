# Stage 8: Content Tracking

## What Happens

Products have been dispatched (~Day 17). Metro Manila creators receive their Mama Sita's Oyster Sauce (350mL) + Sinigang Mix Sampalok (6-pk) bundle in 5-7 business days (~Day 22-24). Provincial addresses arrive in 7-14 days (~Day 24-31).

The brand rep's goal for the next 30 days: track which of the 32 opted-in creators have posted content featuring the products. Success is measured by content ROI — every post counts.

**Content production timeline** (from product receipt):
- Day 0 (receipt) to Day 14: typical first post window for food creators
- Day 30: informal deadline per Stage 6 brief ("within 30 days of receiving")
- Day 32 (from dispatch, ~Day 49 of campaign): hard cut-off for this tracking stage

Cheerful's `PostTrackingWorkflow` (daily, 24h cadence) automatically monitors opted-in creators' public Instagram profiles for content matching "Oyster Sauce" or "Sinigang Mix" — by caption keyword or Claude Sonnet vision analysis. This runs as a background Temporal workflow; no manual trigger needed.

**Concrete content examples expected**:
- `@filipinafoodie` posts a Reel: "Niluto ko ng Sinigang using Mama Sita's Sinigang Mix Sampalok — super sarap! 🍲 #SinigangRecipe #MamaSitas #HomeCooking" — 8.4K views, 412 likes
- `@kutsaranimelinda` posts a carousel: "Making pancit with homemade oyster sauce glaze 👩‍🍳 Sponsored by @MamaSitasOfficial" — but caption says "homemade oyster sauce" with no product name — caption match FAILS; LLM vision checks thumbnail → detects bottle in frame → `match_method: llm`
- `@pinoyrecipes2026` posts a Story: "unboxing time!! [shows package]" — Stories are NOT captured (Apify profile scraper limitation; see §Gaps)

**Target by end of Stage 8**: 22-28 of 32 creators post content (69-88% posting rate — typical for unpaid micro-creator gifting).

---

## Cheerful Feature Mapping

| Action | CE Tool / Feature | Status | Source |
|--------|------------------|--------|--------|
| Enable post tracking on campaign | `cheerful_update_campaign(post_tracking_enabled=true)` | spec'd (not built) | `../../cheerful-ce-parity-reverse/specs/campaigns.md` §Campaign CRUD |
| Verify tracking is enabled and active | `cheerful_get_campaign(campaign_id)` → check `post_tracking_enabled` | spec'd (not built) | `../../cheerful-ce-parity-reverse/specs/campaigns.md` §`cheerful_get_campaign` |
| See all campaign posts (post library view) | `cheerful_list_posts(limit=100, sort="desc")` | spec'd (not built) | `../../cheerful-ce-parity-reverse/specs/creators.md` §`cheerful_list_posts` |
| See per-creator post status in participant table | `cheerful_list_campaign_recipients(post_status=["has_posts"])` — `post_count`, `post_last_checked_at` fields | spec'd (not built) | `../../cheerful-ce-parity-reverse/specs/campaigns.md` §`cheerful_list_campaign_recipients` |
| View all posts for a specific creator | `cheerful_list_creator_posts(campaign_id, creator_id)` | spec'd (not built) | `../../cheerful-ce-parity-reverse/specs/creators.md` §`cheerful_list_creator_posts` |
| Manually refresh specific creator posts | `cheerful_refresh_creator_posts(campaign_id, creator_id)` | spec'd (not built) | `../../cheerful-ce-parity-reverse/specs/creators.md` §`cheerful_refresh_creator_posts` |
| Remove false-positive posts | `cheerful_delete_post(campaign_id, post_id)` | spec'd (not built) | `../../cheerful-ce-parity-reverse/specs/creators.md` §`cheerful_delete_post` |
| Track who has NOT posted yet (non-posters) | `cheerful_list_campaign_recipients(status=["ORDERED"], sort_by="post_count", sort_dir="asc")` → `post_count=0` rows | spec'd (not built) — no direct filter; must sort+scan | `../../cheerful-ce-parity-reverse/specs/campaigns.md` §`cheerful_list_campaign_recipients` |
| Mark creator as "posted" in gifting pipeline | **GAP** — no `POSTED` status in gifting enum | gap | Gap 43 (new gap) — gifting enum: `CONTACTED/UNRESPONSIVE/PENDING_DETAILS/READY_TO_SHIP/ORDERED/DECLINED`; no POSTED |
| Automated alert when creator posts | **GAP** — no push notification for new post detection | gap | Gap 44 (new gap) — Cheerful detects posts on 24h cycle; no Slack notification sent when post appears |
| Track overdue non-posters (30-day missed) | **GAP** — no deadline tracking field or alert workflow | gap | Gap 45 (new gap) |
| Capture Story content | **GAP** — Apify profile scraper does not return Stories | gap | `../../cheerful-ugc-capture-reverse/analysis/current-post-tracking.md` §8 |
| Dashboard view: posts collected vs target | `cheerful_get_dashboard_analytics()` → `gifting_pipeline.ordered` count | exists (NEW — needs service route) | `../../cheerful-ce-parity-reverse/specs/analytics.md` |

---

## Detailed Flow

### Phase A: Activate Post Tracking (Day 16 — Before or At Shipping)

Post tracking must be explicitly enabled on the campaign. Default is `post_tracking_enabled=false`. The brand rep must enable this before (or at) shipping — the 90-day tracking window starts when each creator hits a participating status (`READY_TO_SHIP` or `ORDERED`), not when tracking is enabled. Enabling tracking after creators are already `ORDERED` still works — the system will check them on the next 24h cycle.

**Critical**: If `post_tracking_enabled` remains `false`, the `PostTrackingWorkflow` skips the campaign entirely. No posts will ever be captured.

```
User → Slack: "Enable post tracking for Mama Sita's campaign"
CE: cheerful_update_campaign(
    campaign_id="campaign-uuid-mamasitas",
    post_tracking_enabled=true
)
→ Campaign.post_tracking_enabled: false → true ✓
```

**What happens next (automated)**:
- Next run of `PostTrackingSchedulerWorkflow` (~every 24h) picks up the campaign
- `get_trackable_creators_activity` finds all creators with:
  - `post_tracking_ends_at > now()` (set when creator hit `READY_TO_SHIP`/`ORDERED` — ~Days 12-16)
  - Instagram handle in `social_media_handles`
  - `campaign.product_id` set (Oyster Sauce product row, or Sinigang Mix — campaigns.md requires single product_id)
  - Campaign status is NOT `COMPLETED`

**Prerequisite**: `campaign.product_id` must be set. If products were added at campaign creation (Stage 1), this is already satisfied. If not, brand rep must set it via `cheerful_update_campaign` before tracking activates.

**Note**: The `PostTrackingWorkflow` uses the product name (`"Oyster Sauce"` or `"Sinigang Mix"`) as the match term. For this campaign, both products are in scope — but the workflow matches against a single `product_id`. If the campaign has only one `product_id`, posts mentioning the other product may be missed by caption match (LLM vision can still catch them).

---

### Phase B: Monitor Content Roll-In (Days 25-49)

Starting ~Day 25, posts should begin appearing. The brand rep monitors via two CE entry points.

**B1 — Cross-campaign post library view**:

```
User → Slack: "How many posts have we collected for Mama Sita's so far?"
CE: cheerful_list_posts(
    limit=100,
    sort="desc"
)
→ Returns all posts from all campaigns; brand rep filters by campaign_name="Mama Sita's Gifting 2026"
```

**Note**: `cheerful_list_posts` is cross-campaign and has no `campaign_id` filter parameter. To see only Mama Sita's posts, the CE agent filters by `campaign_name` in the response. At 32 creators, total post count is manageable (expected 22-80 posts total across 30 days).

**B2 — Per-creator status with post counts**:

```
User → Slack: "Show me all shipped creators and how many posts they've collected"
CE: cheerful_list_campaign_recipients(
    campaign_id="campaign-uuid-mamasitas",
    status=["ORDERED"],
    include_all_contacts=true,
    sort_by="post_count",
    sort_dir="desc",
    limit=100
)
→ Returns all 32 ORDERED creators sorted by post_count descending
→ Rows include: post_count, post_last_checked_at, post_tracking_ends_at
```

**Example response fragment (Day 30, ~half have posted)**:

```json
{
  "rows": [
    {
      "name": "Maria Santos",
      "social_media_handles": [{"platform": "instagram", "handle": "filipinafoodie"}],
      "gifting_status": "ORDERED",
      "post_count": 3,
      "post_last_checked_at": "2026-03-29T02:00:00Z",
      "post_tracking_ends_at": "2026-06-15T00:00:00Z"
    },
    {
      "name": "Jo Reyes",
      "social_media_handles": [{"platform": "instagram", "handle": "pinoyrecipes2026"}],
      "gifting_status": "ORDERED",
      "post_count": 1,
      "post_last_checked_at": "2026-03-29T02:00:00Z",
      "post_tracking_ends_at": "2026-06-16T00:00:00Z"
    },
    {
      "name": "Melinda Cruz",
      "social_media_handles": [{"platform": "instagram", "handle": "kutsaranimelinda"}],
      "gifting_status": "ORDERED",
      "post_count": 0,
      "post_last_checked_at": "2026-03-29T02:00:00Z",
      "post_tracking_ends_at": "2026-06-15T00:00:00Z"
    }
    // ... 29 more rows
  ],
  "total": 32
}
```

CE agent renders as Slack table:
```
*Mama Sita's — Post Status (Day 30)*
32 creators shipped — *15 have posted*, 17 haven't yet

| Handle              | Name            | Posts | Last Checked       |
|---------------------|-----------------|-------|--------------------|
| @filipinafoodie     | Maria Santos    | 3     | 2026-03-29 02:00   |
| @pinoyrecipes2026   | Jo Reyes        | 1     | 2026-03-29 02:00   |
| @kutsaranimelinda   | Melinda Cruz    | 0     | 2026-03-29 02:00   |
| ...                 | ...             | ...   | ...                |

15 creators with posts | 17 still at 0 posts
Tracking ends: Jun 15–16 (90 days from ship date)
```

---

### Phase C: View Specific Creator's Posts

When the brand rep wants to review the actual content a creator posted:

```
User → Slack: "Show me @filipinafoodie's posts"
CE agent: first resolves creator_id from handle via cheerful_list_campaign_recipients search
CE: cheerful_list_creator_posts(
    campaign_id="campaign-uuid-mamasitas",
    creator_id="creator-uuid-filipinafoodie"
)
→ Returns all 3 matched posts with URLs, engagement metrics, match method
```

**Expected response for `@filipinafoodie` (Maria Santos, 12K followers)**:
```json
{
  "posts": [
    {
      "id": "post-uuid-001",
      "post_type": "reel",
      "post_url": "https://www.instagram.com/reel/DaB1c2d3/",
      "caption": "Sinigang sa Sampalok with Mama Sita's Sinigang Mix — perfect para sa malamig na gabi! Recipe in bio 🍲 #MamaSitas #Sinigang #HomeCooking #LutongPinoy",
      "like_count": 412,
      "view_count": 8400,
      "comment_count": 47,
      "posted_at": "2026-03-26T14:30:00Z",
      "matched_at": "2026-03-27T02:15:00Z",
      "match_method": "caption",
      "match_reason": "Product name 'Sinigang Mix' found in caption"
    },
    {
      "id": "post-uuid-002",
      "post_type": "post",
      "post_url": "https://www.instagram.com/p/DbC2d3e4/",
      "caption": "Oyster sauce stir-fry, napakasarap! Gamit ko ang Mama Sita's Oyster Sauce para mas masarap ang lasa 🥢",
      "like_count": 287,
      "view_count": null,
      "comment_count": 23,
      "posted_at": "2026-04-02T10:00:00Z",
      "matched_at": "2026-04-03T02:08:00Z",
      "match_method": "caption",
      "match_reason": "Product name 'Oyster Sauce' found in caption"
    },
    {
      "id": "post-uuid-003",
      "post_type": "reel",
      "post_url": "https://www.instagram.com/reel/DcD3e4f5/",
      "caption": "Quick weeknight dinner 🍜 #EasyRecipe #PinoyFood",
      "like_count": 634,
      "view_count": 11200,
      "comment_count": 58,
      "posted_at": "2026-04-08T16:45:00Z",
      "matched_at": "2026-04-09T02:20:00Z",
      "match_method": "llm",
      "match_reason": "YES - The image shows a bottle of Mama Sita's Oyster Sauce prominently displayed next to the cooking pan."
    }
  ],
  "total": 3,
  "last_checked_at": "2026-04-09T02:20:00Z",
  "tracking_ends_at": "2026-06-15T00:00:00Z"
}
```

CE agent presents:
```
*@filipinafoodie — 3 posts detected* (tracking until Jun 15)

1. Reel — Mar 26 — 8.4K views, 412 likes, 47 comments
   Caption: "Sinigang sa Sampalok with Mama Sita's Sinigang Mix..." ✅ caption match
   https://instagram.com/reel/DaB1c2d3/

2. Feed post — Apr 2 — 287 likes, 23 comments
   Caption: "...Mama Sita's Oyster Sauce para mas masarap..." ✅ caption match
   https://instagram.com/p/DbC2d3e4/

3. Reel — Apr 8 — 11.2K views, 634 likes, 58 comments
   Caption: "Quick weeknight dinner" (no product name) ✅ LLM vision matched
   Reason: "Mama Sita's Oyster Sauce bottle visible in frame"
   https://instagram.com/reel/DcD3e4f5/
```

---

### Phase D: Manual Refresh for Overdue Creators

On Day 35, brand rep notices `@kutsaranimelinda` still shows `post_count: 0` despite the creator having shared an unboxing Story on Day 24 (not captured) and a feed post on Day 28 (should have been captured in the Day 29 daily run, but wasn't — possible Apify scrape miss). Brand rep triggers a manual refresh:

```
User → Slack: "Refresh posts for @kutsaranimelinda"
CE: cheerful_refresh_creator_posts(
    campaign_id="campaign-uuid-mamasitas",
    creator_id="creator-uuid-kutsaranimelinda"
)
→ Processing: Apify fetch → 10 latest posts → 2-phase analysis
→ Result: posts_found: 1, new_posts: 1, last_checked_at: "2026-04-03T14:30:00Z"
```

This synchronous refresh (10-30 seconds) fetches Melinda's latest 10 posts, analyzes them, and saves the one match (the Day 28 feed post with an oyster sauce bottle in the thumbnail — LLM vision catches it). The unboxing Story remains uncaptured — Stories are not in Apify's profile scraper output.

---

### Phase E: False Positive Removal

On Day 32, `@sinigangsuperfan` posts a carousel about a different sinigang mix brand. The caption includes "sinigang mix" generically and the LLM vision sees a packet in the thumbnail. The system flags this as a match. Brand rep reviews and removes it:

```
User → Slack: "Delete post post-uuid-falsematch — it's a false positive (competitor brand)"
CE: cheerful_delete_post(
    campaign_id="campaign-uuid-mamasitas",
    post_id="post-uuid-falsematch"
)
→ Post deleted (204)
→ creator.post_count decremented in next recipient list call
```

**Expectation**: False positive rate is ~5-10% for generic product names like "sinigang mix" and "oyster sauce." The LLM vision phase is more accurate than caption-only but still makes errors on similar products. Brand rep should do a spot review of all LLM-matched posts (those with `match_method: "llm"`) at least once during the tracking window.

---

### Phase F: Non-Poster Identification (Day 47 — 30-Day Deadline)

On Day 47 (30 days after first Metro Manila deliveries), brand rep checks who hasn't posted:

```
User → Slack: "Who hasn't posted yet in Mama Sita's campaign?"
CE: cheerful_list_campaign_recipients(
    campaign_id="campaign-uuid-mamasitas",
    status=["ORDERED"],
    include_all_contacts=true,
    sort_by="post_count",
    sort_dir="asc",
    limit=100
)
→ Returns 32 rows sorted by post_count ascending
→ Rows with post_count=0 are the non-posters
→ (No direct "post_count=0" filter — CE agent reads and identifies them)
```

CE agent extracts non-posters and presents:
```
*Non-posters — 30-day deadline passed*

8 creators with 0 posts detected:

1. @kutsaranimelinda — Melinda Cruz — shipped Mar 17 — 30 days ago
2. @panlasangpinoy88 — shipped Mar 18 — 29 days ago
3. @kitchenqueen_mnl — shipped Mar 17 — 30 days ago
... (5 more)

Note: Stories are not tracked — some of these may have posted Stories only.
Recommend: send a gentle reminder DM via Instagram app for creators at Day 30+.
```

**Next action**: Brand rep manually sends reminder DMs from IG app (Cheerful cannot send proactive DMs to closed windows — Gap 22/35 from Stages 4/5).

---

## CE Tool Calls (Exact)

### Enable post tracking (prerequisite)

```
cheerful_update_campaign(
  campaign_id: "campaign-uuid-mamasitas"
  post_tracking_enabled: true
)

Expected response:
  post_tracking_enabled: true
  updated_at: "2026-03-17T..."
```

### `cheerful_list_posts` — campaign post library

```
Parameters:
  limit: 100
  offset: 0
  sort: "desc"    ← newest first

Expected response shape:
  posts[*].id:              UUID
  posts[*].post_type:       "post" | "reel"   (never "story" — not captured via Apify)
  posts[*].post_url:        "https://www.instagram.com/reel/..."
  posts[*].caption:         Full caption text (max 500 chars)
  posts[*].like_count:      integer
  posts[*].view_count:      integer | null  (non-null for reels)
  posts[*].comment_count:   integer
  posts[*].posted_at:       ISO 8601 datetime
  posts[*].matched_at:      ISO 8601 datetime (within 24h of posted_at for daily polling)
  posts[*].match_method:    "caption" | "llm"
  posts[*].creator_name:    creator display name
  posts[*].campaign_name:   "Mama Sita's Gifting 2026"
  posts[*].campaign_id:     "campaign-uuid-mamasitas"
  total: integer

What user does:
  CE agent filters where campaign_name contains "Mama Sita's"
  Counts total posts, reels vs feed, avg engagement
  Identifies most-engaged posts for sharing with Mama Sita's marketing team
```

### `cheerful_list_campaign_recipients` — post status dashboard

```
Parameters:
  campaign_id: "campaign-uuid-mamasitas"
  status: ["ORDERED"]
  include_all_contacts: true
  sort_by: "post_count"
  sort_dir: "desc"
  limit: 100

Expected response — key fields per row:
  name:                   Creator display name
  social_media_handles:   [{platform: "instagram", handle: "..."}]
  gifting_status:         "ORDERED"
  post_count:             integer (0-N)
  post_last_checked_at:   datetime (most recent Apify poll)
  post_tracking_ends_at:  datetime (90 days from participating status)

What user does:
  Sort by post_count desc → top posters at top
  Filter post_count=0 rows → non-poster list
  Check post_last_checked_at < 24h → confirm tracking is running
```

### `cheerful_list_creator_posts` — per-creator post detail

```
Parameters:
  campaign_id: "campaign-uuid-mamasitas"
  creator_id: "creator-uuid-{N}"  ← obtained from cheerful_list_campaign_recipients

Expected response:
  posts[*].post_type:     "post" | "reel"
  posts[*].post_url:      Instagram URL
  posts[*].like_count:    integer
  posts[*].view_count:    integer | null
  posts[*].comment_count: integer
  posts[*].match_method:  "caption" | "llm"
  posts[*].match_reason:  explanation string
  total:                  integer
  last_checked_at:        datetime
  tracking_ends_at:       datetime

What user does:
  Review posts for quality and relevance
  Flag LLM-matched posts for manual review (higher false positive rate)
  Note engagement metrics for Stage 9 (ROI measurement)
```

### `cheerful_refresh_creator_posts` — on-demand post check

```
Parameters:
  campaign_id: "campaign-uuid-mamasitas"
  creator_id: "creator-uuid-{N}"

Expected response:
  posts_found:     integer (total posts for creator after refresh)
  new_posts:       integer (newly detected in this run; 0 if already captured)
  last_checked_at: datetime (now)

What user does:
  Use for creators showing post_count=0 despite being known to have posted
  Run before declaring a creator a non-poster at Day 30 deadline check
  Note: synchronous, takes 10-30 seconds per creator
```

### `cheerful_delete_post` — false positive removal

```
Parameters:
  campaign_id: "campaign-uuid-mamasitas"
  post_id:     "post-uuid-{N}"  ← obtained from cheerful_list_posts or cheerful_list_creator_posts

Expected response: 204 No Content

What user does:
  Review all LLM-matched posts (match_method="llm") early in tracking window
  Remove any where the visible product is NOT Mama Sita's (competitor brand, similar packaging)
  Note: deletion is permanent; re-runs of PostTrackingWorkflow will re-detect the same post
  unless the deduplication key (campaign_creator_id, instagram_post_id) is handled differently
```

---

## IG-Specific Considerations

### Apify Profile Scraper — What Is and Isn't Captured

The `PostTrackingWorkflow` uses Apify's `instagram-profile-scraper` actor, which scrapes the creator's public profile page. This means:

**Captured**:
- Feed posts (images, single photo) — yes
- Reels (video content) — yes, `post_type: "reel"` with `view_count`
- Carousel posts (multi-image) — first image only (thumbnail)

**NOT captured**:
- Stories — ephemeral, not on public profile
- Story Highlights containing the product — not captured either
- Comments and comment content
- Saves count (engagement metric)

**Implication for Mama Sita's**: Food creators often post Stories showing products in action (unboxing, cooking process, taste reactions). These Stories expire in 24h and are a major content format for food creators. They are completely invisible to Cheerful. The brand rep cannot quantify Story impressions or reach from this system.

**Workaround**: Brand rep manually watches creators' Stories during the tracking window and screenshots/notes Story posts. Or uses a third-party tool (e.g., Notifluence, Later) that can monitor Stories with a connected account.

### Daily Polling Gap (Up to 23h Detection Latency)

Posts appear in Cheerful within 0-23h of being published (next daily `PostTrackingWorkflow` run). A creator who posts at 11pm gets their post detected at the next 2am run — ~3h latency. A creator who posts at 3am gets detected the following night — ~23h latency.

**Implication**: The brand rep checking Cheerful at noon may see a post published this morning, but not one published 2 hours ago. For real-time monitoring, `cheerful_refresh_creator_posts` bypasses the daily cycle and fetches immediately.

### Creator Profile Privacy Changes

If a creator switches their account to private after being added to the campaign, `fetch_instagram_posts` returns an empty list. `process_creator_posts_activity` sees no posts, updates `post_last_checked_at`, and moves on. The creator will show `post_count=0` forever unless they go public again.

**Detection**: Brand rep notices a creator's `post_last_checked_at` is recent but `post_count` is 0 for an extended period. Manual check on Instagram confirms account is private.

### Product Name Case Sensitivity in Caption Match

Caption match uses simple `product_name.lower() in caption.lower()`. This matches:
- "Mama Sita's Oyster Sauce" → matches "mama sita's oyster sauce", "Mama Sita's Oyster Sauce", etc.
- "Sinigang Mix" → matches "sinigang mix", "Sinigang Mix Sampalok", etc.
- Does NOT match: "MS Oyster Sauce", "#MamaSitas" (no space), "Mama Sitas" (no apostrophe)

**Gap**: Hashtag variants like `#MamaSitas` (common in creator posts, briefed in Stage 6) do not contain a space and won't match "Oyster Sauce" or "Sinigang Mix". The LLM vision fallback must catch these. For Mama Sita's campaign, briefing creators to mention the full product name in caption (not just hashtags) improves caption match rate.

---

## Gaps & Workarounds

| # | Gap | Impact | Workaround | Build Priority |
|---|-----|--------|------------|----------------|
| 43 | No `POSTED` gifting status — gifting pipeline has no content-delivered stage; creators stay `ORDERED` forever even after posting | Cannot distinguish "ordered, has posted" from "ordered, hasn't posted" in Cheerful pipeline views; `gifting_pipeline.ordered` count includes both | Use `post_count > 0` as proxy for "has posted" from `cheerful_list_campaign_recipients` response | P1 — add `CONTENT_POSTED` to gifting status enum (parallel to paid promotion's `POSTED`); add to `GIFTING_OPTED_IN_STATUSES`; allow `cheerful_update_campaign_creator` (Gap 30) to set this status |
| 44 | No Slack notification when a new post is detected — `PostTrackingWorkflow` runs silently; brand rep must poll CE to discover new posts | Brand rep has no push notification that `@filipinafoodie` just posted content; must proactively ask CE for updates | Set a daily Slack reminder to check "show me all posts from last 24 hours" via `cheerful_list_posts` | P1 — add Slack notification dispatch to `process_creator_posts_activity` when `new_posts > 0`; send to brand rep's Slack with post URL and engagement preview |
| 45 | No deadline tracking or overdue alerts — Cheerful has no field for "content expected by date" or alert when creator misses posting window | Brand rep must manually track Day 30 deadline per creator; no automated reminder or flagging of overdue non-posters | Maintain "Expected post by" column in Google Sheets based on package dispatch date + 30 days; check manually | P1 — add `content_deadline_at` field to `campaign_creator`; add alert workflow: Slack summary of overdue creators at deadline + 3 days |
| 8 | All 4 post CE tools not built (`cheerful_list_posts`, `cheerful_list_creator_posts`, `cheerful_refresh_creator_posts`, `cheerful_delete_post`) | Entire CE-based content tracking stage is blocked; brand rep must use webapp or direct API calls | Use webapp `/posts` page for post library; use `GET /v1/campaigns/{id}/creators/{cid}/posts` with Bearer token for per-creator view | P0 — these 4 tools are core to post-shipping campaign monitoring; spec complete in `creators.md`; need service routes built |
| CE-update | `cheerful_update_campaign` not built — cannot enable `post_tracking_enabled` via CE | Post tracking never activates; no posts are ever captured; entire Stage 8 is inert | Webapp: go to Campaign Settings → enable "Post Tracking" toggle; or direct `PATCH /api/campaigns/{id}` call with Bearer token | P0 — enabling post tracking is the first action at this stage; `cheerful_update_campaign` is #10 in campaigns.md tool index; must be built |
| Story | Stories not captured by Apify profile scraper | Any creator who only posts Stories (and not feed/Reel) shows `post_count=0` — counted as non-poster; Story impressions and reach are invisible | Manual monitoring by brand rep; third-party Story monitoring tool | P1 — requires Messaging API `story_mention` webhook (see UGC capture loop `loops/cheerful-ugc-capture-reverse/`); significant infrastructure addition |
| Dedup-delete | Deleting a false-positive post does not permanently suppress re-detection — `PostTrackingWorkflow` uses `UNIQUE (campaign_creator_id, instagram_post_id)` to deduplicate, but if the record is deleted, the constraint is gone and the post will be re-added next daily run | Brand rep deletes a false positive; it reappears the next morning | Accept as known issue; OR re-add the same post with `is_false_positive=true` flag instead of deleting | P2 — add `is_false_positive: boolean` column to `creator_post`; mark instead of delete; exclude from counts and display |
| Bulk-refresh | No bulk `cheerful_refresh_creator_posts` — manually refreshing all 32 creators = 32 individual CE calls | Checking all 32 creators on-demand takes ~10-16 minutes of sequential Slack interactions | Accept and run sequentially; only refresh specific suspected non-posters | P2 — add `creator_ids[]` array param to `cheerful_refresh_creator_posts`; triggers parallel Apify fetches |
| Caption-hashtag | Caption match misses `#MamaSitas` hashtag (no space, no full product name) — common in creator posts | Posts that ONLY use hashtags and show product visually are LLM-only matches; if LLM misses, post is not counted | Brief creators in Stage 6 to include full product name in caption text (not just hashtags); "mention Mama Sita's Oyster Sauce or Sinigang Mix by name in your caption" | P2 — add hashtag list to campaign product matching config; `["#MamaSitas", "mama sitas", "mamasitas"]` additional caption match terms |
| post_count-filter | No `min_post_count`/`max_post_count` filter params on `cheerful_list_campaign_recipients` — cannot directly query "creators with 0 posts" | Must retrieve all ORDERED creators sorted by `post_count` asc, then visually scan to find zero-count rows | CE agent scans sorted list and identifies zero rows; tolerable at 32-creator scale | P2 — add `min_post_count`/`max_post_count` integer filter params to `cheerful_list_campaign_recipients` |

---

## Success Criteria

At the end of Stage 8, "100% hero journey" means:

1. **Post tracking enabled and running**: `campaign.post_tracking_enabled = true`; `post_last_checked_at` is within 25h for all 32 ORDERED creators (confirms daily cycle is running)
2. **Post library populated**: At least 18 posts captured in `cheerful_list_posts` for the Mama Sita's campaign (target: 22-28 creators × 1-3 posts each = 22-80 total)
3. **All creators checked**: All 32 ORDERED creators have `post_last_checked_at` set — no one was skipped by the tracking workflow
4. **False positives reviewed**: Brand rep has reviewed all LLM-matched posts (`match_method: "llm"`); false positives deleted
5. **Non-poster list ready**: Brand rep knows exactly which creators have `post_count=0` after 30 days — the input to the Stage 9 engagement tracking and the list for follow-up DMs

**Measurable targets by Day 47 of campaign** (30 days after first deliveries):
- `post_count > 0` for at least 22 of 32 shipped creators (69% posting rate)
- Total posts captured: 22-80 (average 1-3 per posting creator)
- 0 unresolved false positives in post library
- Non-poster list: ≤10 creators at `post_count=0` (with caveat: may include Story-only posters)

---

## Dependencies

| Dependency | Required By | Status |
|-----------|------------|--------|
| Stage 7 complete: 32 creators in `ORDERED` status | Post tracking triggers on participating status; `get_trackable_creators_activity` only picks up creators with `post_tracking_ends_at > now()` | Depends on Gap 30/41 — if statuses not updated, fewer creators tracked |
| `post_tracking_enabled=true` on campaign | `PostTrackingWorkflow` skips disabled campaigns | Requires `cheerful_update_campaign` (spec'd, not built) — P0 |
| `campaign.product_id` set (Oyster Sauce or Sinigang Mix) | `get_trackable_creators_activity` eligibility check #3 | Should be set at Stage 1; verify with `cheerful_get_campaign` |
| `APIFY_API_TOKEN` env var configured | `fetch_instagram_posts` returns 500 without it | Gap 21 from Stage 3 — must be configured |
| All 4 post CE tools built (Gap 8 from this stage) | CE-native content tracking requires these tools | P0 — build before campaign launch |
| Creators have public Instagram accounts | Apify scrapes public profiles only | Operational — no Cheerful control; brand rep should verify in Stage 3 vetting |
| Stage 9 (UGC Capture): input from Stage 8 | Stage 9 needs the `creator_post` records and the list of non-posters to build the ROI metrics | Stage 8 must complete before Stage 9 begins |
