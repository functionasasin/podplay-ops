# Stage 2: Creator Discovery

## What Happens

With the campaign configured, the Mama Sita's brand rep needs to build a target list of 50+ micro food creators on Instagram. These are creators in the 5K-50K follower range who make Filipino food content, home cooking videos, or Southeast Asian recipe content.

Discovery happens in four passes:

1. **Keyword search pass** — Search Influencer Club for Filipino food-relevant keywords: "Filipino food", "sinigang recipe", "Filipino recipes", "lutong bahay". Each search returns 10 results/page; paginate through 4-6 pages per keyword to surface 150-200 raw candidates.
2. **Similar-creator pass** — Seed from known Filipino food Instagram handles (e.g., @panlasangpinoy, @yummy.ph, @angsarap.net) to find creators with similar audience profiles. Generates 30-60 additional candidates.
3. **Pool creation** — All candidates are staged into a single creator list: "Mama Sita's Discovery Pool Q1 2026". This list holds all raw discovery results before vetting in Stage 3.
4. **Count check** — Verify the pool has 80+ candidates (buffer to survive Stage 3 vetting which will cut ~40% for engagement rate, follower count, content fit, and inactive accounts).

Concrete example: Searching "Filipino food" on IC returns @lutongpinoy (12K followers), @siniganglover (8K), @filipinakitchen (22K), @batangenyo_cooks (6K), etc. Each result with followers in the 5K-50K range and food content in bio gets added to the pool.

---

## Cheerful Feature Mapping

| Action | CE Tool / Feature | Status | Source |
|--------|------------------|--------|--------|
| Create staging creator list | `cheerful_create_creator_list` | spec'd | `../../cheerful-ce-parity-reverse/specs/creators.md` §Creator Lists — CRUD |
| Keyword search: "Filipino food" | `cheerful_search_creators_by_keyword` | spec'd | `../../cheerful-ce-parity-reverse/specs/creators.md` §Creator Search & Discovery |
| Keyword search: "sinigang recipe" | `cheerful_search_creators_by_keyword` | spec'd | `../../cheerful-ce-parity-reverse/specs/creators.md` §Creator Search & Discovery |
| Keyword search: "Filipino home cooking" | `cheerful_search_creators_by_keyword` | spec'd | `../../cheerful-ce-parity-reverse/specs/creators.md` §Creator Search & Discovery |
| Keyword search: "lutong bahay" | `cheerful_search_creators_by_keyword` | spec'd | `../../cheerful-ce-parity-reverse/specs/creators.md` §Creator Search & Discovery |
| Similar-creator search from @panlasangpinoy | `cheerful_search_similar_creators` | spec'd | `../../cheerful-ce-parity-reverse/specs/creators.md` §Creator Search & Discovery |
| Similar-creator search from @angsarap.net | `cheerful_search_similar_creators` | spec'd | `../../cheerful-ce-parity-reverse/specs/creators.md` §Creator Search & Discovery |
| Add keyword search results to pool list | `cheerful_add_search_creators_to_list` | spec'd | `../../cheerful-ce-parity-reverse/specs/creators.md` §Creator List Items |
| Paginate search results (page 2, 3, …) | `cheerful_search_creators_by_keyword` page param | spec'd | `../../cheerful-ce-parity-reverse/specs/creators.md` §Creator Search & Discovery |
| View pool list count | `cheerful_list_creator_lists` | spec'd | `../../cheerful-ce-parity-reverse/specs/creators.md` §Creator Lists — CRUD |
| Search via hashtag (#MamaSitas, #SinigangRecipe) | **NO TOOL** | gap | No IC hashtag search feature |
| Filter by Tagalog-language content | **PARTIAL** — `profile_language` filter available but unreliable for Tagalog | gap | `../../cheerful-ce-parity-reverse/specs/creators.md` §cheerful_search_creators_by_keyword |

---

## Detailed Flow

### Step 1: Create the Discovery Pool List

Before running any searches, create a staging list to collect raw candidates.

```
User: Create a creator list called "Mama Sita's Discovery Pool Q1 2026"

CE (calls cheerful_create_creator_list):
  title: "Mama Sita's Discovery Pool Q1 2026"

  → POST /api/service/lists
  ← Response: {id: "list-uuid-discovery-pool", title: "Mama Sita's Discovery Pool Q1 2026", ...}
  → Slack: "Created list 'Mama Sita's Discovery Pool Q1 2026' (ID: `list-uuid-discovery-pool`). Ready to add creators."
```

---

### Step 2: Keyword Search — "Filipino food"

This is the broadest and highest-yield query. Target: 5K-50K followers on Instagram. Paginate through pages 1-5 to surface ~50 raw candidates.

```
User: Search for Instagram creators about "Filipino food" with 5K to 50K followers, 5 pages

[Page 1]
CE (calls cheerful_search_creators_by_keyword):
  keyword: "Filipino food"
  platform: "instagram"
  page: 1
  followers: {"min": 5000, "max": 50000}
  sort_by: "relevancy"
  sort_order: "desc"

  → POST /api/service/creator-search/keyword
  ← Response: {
      creators: [
        {id: "ic-1001", username: "lutongpinoy", full_name: "Luto ng Pinoy", follower_count: 12300, engagement_rate: 4.8, biography: "Authentic Filipino recipes from the heart of Manila 🇵🇭", email: null},
        {id: "ic-1002", username: "filipinakitchen", full_name: "Filipina Kitchen", follower_count: 22100, engagement_rate: 3.1, biography: "Home cooking recipes | adobo, sinigang, kare-kare", email: "collab@filipinakitchen.com"},
        ... (8 more creators)
      ],
      total: 87,
      provider: "influencer_club",
      page: 1,
      has_more: true
    }
  → Slack: "Found 87 total. Showing page 1 of 9. @lutongpinoy — 12.3K followers, 4.8% ER. @filipinakitchen — 22.1K followers, 3.1% ER. [... 8 more]"

[Add page 1 results to pool]
CE (calls cheerful_add_search_creators_to_list):
  list_id: "list-uuid-discovery-pool"
  creators: [
    {platform: "instagram", handle: "lutongpinoy", name: "Luto ng Pinoy", email: null, follower_count: 12300, is_verified: false, avatar_url: "..."},
    {platform: "instagram", handle: "filipinakitchen", name: "Filipina Kitchen", email: "collab@filipinakitchen.com", follower_count: 22100, is_verified: false, avatar_url: "..."},
    ... (8 more)
  ]
  → POST /api/service/lists/list-uuid-discovery-pool/creators/from-search
  ← Response: {added_count: 10, skipped_count: 0}
  → Slack: "Added 10 creators from page 1 to discovery pool."

[Pages 2-5: repeat with page: 2, 3, 4, 5 — same pattern]
→ Total from "Filipino food" query: ~45-50 creators added to pool (last pages may have reduced relevancy)
```

---

### Step 3: Keyword Search — "sinigang recipe"

More focused query — creators who specifically make sinigang content are prime targets for Mama Sita's Sinigang Mix.

```
User: Search "sinigang recipe" on Instagram, 5K to 50K followers, 3 pages

[Pages 1-3, same pattern as above]

Representative results:
  @siniganglover — 8,200 followers, 6.2% ER, bio: "Filipino sour soup lover 🍲 | Weekly sinigang experiments"
  @pinoysoupkitchen — 14,500 followers, 4.4% ER, bio: "Sinigang, bulalo, nilaga — all the Filipino soups"
  @batangenyo_cooks — 6,700 followers, 5.8% ER, bio: "Home cook from Batangas | sinigang specialist"

→ Total from "sinigang recipe" query: ~25-30 creators (smaller niche)
→ Some overlap with "Filipino food" results — cheerful_add_search_creators_to_list skips_count handles duplicates
```

---

### Step 4: Keyword Search — "Filipino home cooking" and "lutong bahay"

Two additional queries to catch creators who use Filipino-language terms in their bio or content description.

```
User: Search "Filipino home cooking" and "lutong bahay" on Instagram, 5K to 50K followers, 2 pages each

"Filipino home cooking" results (page 1-2, ~20 creators):
  @atsaynakain — 9,800 followers, 5.1% ER, bio: "Everyday Filipino home cooking | lutong bahay vibes"
  @mamasrecipes_ph — 17,300 followers, 3.8% ER, bio: "My mother's Filipino recipes, preserved forever"

"lutong bahay" results (page 1-2, ~15 creators):
  @lutongbahay_momma — 11,200 followers, 4.9% ER
  @simplylutong — 7,600 followers, 6.3% ER

→ Total from these two queries: ~30-35 creators
```

---

### Step 5: Similar-Creator Search — Seed from Known Filipino Food Accounts

Use established Filipino food accounts as seeds to find similar micro-creators in the same niche.

```
User: Find creators similar to @panlasangpinoy on Instagram, 5K to 50K followers, 3 pages

CE (calls cheerful_search_similar_creators):
  handle: "panlasangpinoy"
  platform: "instagram"
  page: 1
  followers: {"min": 5000, "max": 50000}

  → POST /api/service/creator-search/similar
  ← Response: {
      creators: [
        {id: "ic-2001", username: "panlasangpinoy_meaty", full_name: null, follower_count: 18900, engagement_rate: 4.2, biography: "Meat dishes inspired by PanlasangPinoy", email: null},
        {id: "ic-2002", username: "yummykitchenph", full_name: "Yummy Kitchen PH", follower_count: 31200, engagement_rate: 2.8, biography: "Quick Filipino recipes for busy families", email: "hello@yummykitchenph.com"},
        ... (8 more)
      ],
      total: 64,
      provider: "influencer_club",
      page: 1,
      has_more: true
    }

→ Add pages 1-3 to pool: ~28 creators

User: Find creators similar to @angsarap.net on Instagram, 5K to 50K followers, 2 pages

→ 15-20 additional creators

Total from similar-creator searches: ~45 creators (with dedup)
```

---

### Step 6: Verify Pool Size

```
User: Show me my creator lists

CE (calls cheerful_list_creator_lists):
  → GET /api/service/lists
  ← Response: {
      items: [{
        id: "list-uuid-discovery-pool",
        title: "Mama Sita's Discovery Pool Q1 2026",
        creator_count: 112,
        creators_without_email_count: 78,
        created_at: "2026-03-01T11:00:00Z"
      }],
      total: 1
    }
  → Slack: "Discovery pool: 112 creators, 78 without email (34 have email from IC search enrichment)."
```

**112 total candidates** is the expected pool size after 7 search queries with pagination. This is 2.2x the 50-creator target — sufficient buffer for Stage 3 vetting.

---

### CE Tool Calls (exact)

#### `cheerful_create_creator_list`

```python
# Tool: cheerful_create_creator_list
# Source: loops/cheerful-ce-parity-reverse/specs/creators.md §Creator Lists — CRUD
# Status: NEW — new service route needed: POST /api/service/lists

cheerful_create_creator_list(
  title="Mama Sita's Discovery Pool Q1 2026"
)

# Expected response:
{
  "id": "list-uuid-discovery-pool",
  "user_id": "user-uuid",
  "title": "Mama Sita's Discovery Pool Q1 2026",
  "created_at": "2026-03-01T11:00:00Z",
  "updated_at": "2026-03-01T11:00:00Z"
}
# User action: Note the list_id for all subsequent add operations
```

#### `cheerful_search_creators_by_keyword` (primary query)

```python
# Tool: cheerful_search_creators_by_keyword
# Source: loops/cheerful-ce-parity-reverse/specs/creators.md §Creator Search & Discovery (Influencer Club)
# Status: NEW — new service route needed: POST /api/service/creator-search/keyword
# Note: IC_API_KEY env var must be configured

# Query 1: "Filipino food" — broad niche targeting
cheerful_search_creators_by_keyword(
  keyword="Filipino food",
  platform="instagram",
  page=1,                        # Repeat for pages 1-5
  followers={"min": 5000, "max": 50000},
  sort_by="relevancy",
  sort_order="desc"
)

# Query 2: "sinigang recipe" — product-specific niche
cheerful_search_creators_by_keyword(
  keyword="sinigang recipe",
  platform="instagram",
  page=1,                        # Repeat for pages 1-3
  followers={"min": 5000, "max": 50000},
  sort_by="relevancy",
  sort_order="desc"
)

# Query 3: "Filipino home cooking"
cheerful_search_creators_by_keyword(
  keyword="Filipino home cooking",
  platform="instagram",
  page=1,                        # Repeat for pages 1-2
  followers={"min": 5000, "max": 50000},
  sort_by="relevancy",
  sort_order="desc"
)

# Query 4: "lutong bahay"
cheerful_search_creators_by_keyword(
  keyword="lutong bahay",
  platform="instagram",
  page=1,                        # Repeat for pages 1-2
  followers={"min": 5000, "max": 50000},
  sort_by="relevancy",
  sort_order="desc"
)

# Expected response shape (same for all keyword queries):
{
  "creators": [
    {
      "id": "ic-1001",
      "username": "lutongpinoy",
      "full_name": "Luto ng Pinoy",
      "profile_pic_url": "https://cdn.influencers.club/profiles/lutongpinoy.jpg",
      "follower_count": 12300,
      "is_verified": false,
      "biography": "Authentic Filipino recipes from the heart of Manila 🇵🇭",
      "email": null,
      "engagement_rate": 4.8
    }
    // ... 9 more creators
  ],
  "total": 87,        # May be null for some IC queries
  "provider": "influencer_club",
  "page": 1,
  "has_more": true
}
# User action: Pass all 10 creators to cheerful_add_search_creators_to_list, then request page+1 if has_more=true
```

#### `cheerful_search_similar_creators` (seed-based discovery)

```python
# Tool: cheerful_search_similar_creators
# Source: loops/cheerful-ce-parity-reverse/specs/creators.md §Creator Search & Discovery (Influencer Club)
# Status: NEW — new service route needed: POST /api/service/creator-search/similar

# Seed 1: @panlasangpinoy (large Filipino food account, good similarity anchor)
cheerful_search_similar_creators(
  handle="panlasangpinoy",
  platform="instagram",
  page=1,                        # Repeat for pages 1-3
  followers={"min": 5000, "max": 50000}
)

# Seed 2: @angsarap.net (Filipino cooking blog creator)
cheerful_search_similar_creators(
  handle="angsarap.net",
  platform="instagram",
  page=1,                        # Repeat for pages 1-2
  followers={"min": 5000, "max": 50000}
)

# Expected response shape: same as cheerful_search_creators_by_keyword
```

#### `cheerful_add_search_creators_to_list` (stage results into pool)

```python
# Tool: cheerful_add_search_creators_to_list
# Source: loops/cheerful-ce-parity-reverse/specs/creators.md §Creator List Items
# Status: NEW — new service route needed: POST /api/service/lists/{list_id}/creators/from-search
# Key behavior: PostgreSQL UPSERT on (platform, handle) — no duplicate Creator records
# Key behavior: Profile image downloaded and stored in Supabase Storage (ETag dedup)
# Key behavior: skipped_count = creators already in this list (not duplicates in Creator table)

cheerful_add_search_creators_to_list(
  list_id="list-uuid-discovery-pool",
  creators=[
    {
      "platform": "instagram",
      "handle": "lutongpinoy",
      "name": "Luto ng Pinoy",
      "email": None,                                              # null if IC didn't return email
      "follower_count": 12300,
      "is_verified": False,
      "avatar_url": "https://cdn.influencers.club/profiles/lutongpinoy.jpg",
      "profile_url": "https://www.instagram.com/lutongpinoy/"
    },
    {
      "platform": "instagram",
      "handle": "filipinakitchen",
      "name": "Filipina Kitchen",
      "email": "collab@filipinakitchen.com",                    # email from IC enrichment
      "follower_count": 22100,
      "is_verified": False,
      "avatar_url": "https://cdn.influencers.club/profiles/filipinakitchen.jpg",
      "profile_url": "https://www.instagram.com/filipinakitchen/"
    }
    # ... up to 10 per page (all creators from one search page)
  ]
)

# Expected response:
{
  "added_count": 10,    # or fewer if some were already in the list from a prior search
  "skipped_count": 0    # increments when the same @handle appears in multiple search queries
}
# User action: Repeat for each page of each search query
```

---

### IG-Specific Considerations

**Why IG-only discovery**: IC's similar-creator and keyword search operates on Instagram by default (`platform="instagram"`). The Mama Sita's campaign targets Instagram food creators, so no YouTube search is needed. If a creator has both IG and YouTube, the IG handle is the relevant one for DM outreach.

**IC follower count accuracy**: IC follower counts may lag actual Instagram counts by 24-72 hours. The `followers={"min": 5000, "max": 50000}` filter may include some creators outside this range. Stage 3 (vetting) uses `cheerful_get_creator_profile` with Apify scrape for live follower count verification.

**Location filter for Filipino diaspora**: The `location` parameter accepts a list of location strings. Using `location=["Philippines"]` narrows to Philippines-based creators but misses the large Filipino diaspora creator community in the US, Canada, Australia, UAE. Recommendation: run one unfiltered pass (global) and one `location=["Philippines"]` pass to compare niche relevance.

```python
# Philippines-specific search pass
cheerful_search_creators_by_keyword(
  keyword="Filipino food",
  platform="instagram",
  page=1,
  followers={"min": 5000, "max": 50000},
  location=["Philippines"]
)
```

**Hashtag-based discovery (gap)**: For Mama Sita's, hashtags like `#SinigangRecipe`, `#LutongPinoy`, `#FilipinoFood`, and `#MamaSitas` would be highly targeted discovery vectors. The Instagram Graph API supports hashtag search (`GET /{hashtag-id}/top_media`) but requires a connected IG Business Account. **Cheerful has no CE tool for hashtag-based creator discovery.** This is a gap — see Gap #8.

---

## Gaps & Workarounds

| Gap | Impact | Workaround | Build Priority |
|-----|--------|------------|---------------|
| `cheerful_search_creators_by_keyword` not built (new service route needed: POST /api/service/creator-search/keyword) | Cannot run keyword-based creator discovery via CE. Entire discovery stage is manual without this. | Direct API call to existing main route: `POST /v1/creator-search/keyword` with Bearer token. Requires knowing the route exists. | P0 |
| `cheerful_search_similar_creators` not built (new service route needed: POST /api/service/creator-search/similar) | Cannot run similarity-based discovery via CE. | Direct API call to `POST /v1/creator-search/similar` with Bearer token. | P0 |
| `cheerful_add_search_creators_to_list` not built (new service route needed: POST /api/service/lists/{list_id}/creators/from-search) | Cannot stage search results into a creator list via CE. Must manually construct creator records. | Direct API call to `POST /v1/lists/{list_id}/creators/from-search` with Bearer token. | P0 |
| `cheerful_create_creator_list` and `cheerful_list_creator_lists` not built | Cannot create or view creator lists via CE. | Direct API calls: `POST /v1/lists/` and `GET /v1/lists/`. | P0 |
| `INFLUENCER_CLUB_API_KEY` env var required — if not configured, all IC search tools return 503 | Discovery completely blocked without IC API key | Configure `INFLUENCER_CLUB_API_KEY` in backend env. IC API key must be provisioned from Influencer Club dashboard. | P0 (infra/config, not code) |
| No hashtag-based creator discovery | Cannot find creators by hashtag (e.g., #SinigangRecipe). IC API does not support hashtag search. | Manual: Search hashtags directly on Instagram → note creator handles → manually add to discovery pool via `cheerful_add_creators_to_list`. Budget 30-60 minutes per hashtag for manual discovery. | P1 |
| IC results may not cover niche Filipino food micro-creators | Coverage gaps for micro-creators (5K-15K followers) in the Philippines on IC. Less-known creators may not be indexed. | Supplement IC discovery with manual search on Instagram using search terms and hashtags. Add manually discovered creators via `cheerful_add_creators_to_list`. | P1 |
| IC `total` count may be null for some queries | CE agent cannot calculate total pages reliably. Must paginate blindly until `has_more=false`. | Iterate pages until `has_more=false` OR until pool reaches 100+ candidates (sufficient buffer). | P2 |
| Tagalog-language content filter not available | Cannot filter for creators posting in Filipino/Tagalog. IC `profile_language` filter is for profile bio language, not content language. | Use keywords in Filipino ("lutong bahay", "masarap", "lutuin") as a proxy for Tagalog-content creators. | P2 |
| IC search page size hardcoded at 10 | Must make many API calls to get 100+ candidates (10+ calls per query). | Batch pagination: agent auto-paginates through all pages of each query, collecting all results. Each `cheerful_add_search_creators_to_list` call handles one page's worth of results. | P2 |
| No deduplication check across search queries before adding to list | Running multiple search queries adds same creator multiple times via IC → `skipped_count` grows, but each add call still hits the API | `cheerful_add_search_creators_to_list` UPSERT on (platform, handle) handles Creator table dedup. List dedup tracked via `skipped_count`. No pre-check tool needed. | P2 (mitigated by existing behavior) |

---

## Success Criteria

- [ ] Creator list "Mama Sita's Discovery Pool Q1 2026" created with ID noted
- [ ] At minimum 4 keyword searches completed: "Filipino food" (5 pages), "sinigang recipe" (3 pages), "Filipino home cooking" (2 pages), "lutong bahay" (2 pages)
- [ ] At minimum 2 similar-creator searches completed: seeding from @panlasangpinoy (3 pages), @angsarap.net (2 pages)
- [ ] Pool list contains **80+ creators** (comfortable buffer for Stage 3 vetting → 50+ qualified)
- [ ] Pool list contains at least 30 creators with email addresses already (partial IC enrichment from search results)
- [ ] All creators in pool have follower counts in `5,000-50,000` range (IC filter applied during search)
- [ ] `cheerful_list_creator_lists` confirms pool size and email coverage
- [ ] No IC rate limit errors encountered (if hit, waited and retried with pagination continued)

---

## Dependencies

| Dependency | Required For | Status |
|------------|-------------|--------|
| Stage 1 complete: campaign created, IG account connected | Campaign context for downstream stages; list eventually feeds into campaign | Stage 1 complete |
| `INFLUENCER_CLUB_API_KEY` env var configured | All IC search tools | Infra config — must be provisioned |
| All 4 new discovery service routes deployed | CE tools: `cheerful_search_creators_by_keyword`, `cheerful_search_similar_creators`, `cheerful_add_search_creators_to_list`, `cheerful_create_creator_list` | Not yet built — spec complete in `specs/creators.md` |
| Supabase Storage configured for profile image download | `cheerful_add_search_creators_to_list` downloads profile images | Backend infra — already configured if other features using Storage work |
| IC API coverage for Filipino food niche | Quality of keyword/similar results | External — IC data quality varies by niche |
| Stage 3 (Creator Vetting) | Needed before any creator is added to the actual campaign | Pending |
