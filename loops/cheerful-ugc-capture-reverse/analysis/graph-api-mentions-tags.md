# Instagram Graph API: `mentioned_media` + `tags` Endpoints

**Aspect**: `graph-api-mentions-tags`
**Wave**: 1 — External Landscape
**Date**: 2026-02-28

---

## Overview

The Instagram Graph API exposes two complementary endpoints for discovering brand-relevant content created by other users — without requiring those creators to opt in or grant any permissions. Both operate using the **brand's own access token**, making them the most accessible UGC discovery mechanism:

| Endpoint | What It Finds | How Triggered |
|----------|--------------|---------------|
| `GET /{ig-user-id}/tags` | Posts where brand is **photo-tagged** (tagged in image) | Polled directly |
| `GET /{ig-user-id}/mentioned_media` | Posts where brand is **@mentioned** in caption or comment | Webhook-first (requires `media_id`) |

**Critical architectural insight**: Both use the brand's own token — **zero creator participation required**. A brand can discover and retrieve UGC at any time, regardless of whether the creator has installed Cheerful or connected to any integration.

---

## 1. `/tags` Endpoint — Photo-Tagged Media

### What It Is

When an Instagram user creates a post and tags the brand's Instagram account in the **image or video itself** (photo tag — the kind that appears in the "Tagged" tab of a profile), that media becomes accessible via this endpoint.

### Endpoint

```
GET https://graph.facebook.com/v22.0/{ig-user-id}/tags
    ?fields=id,caption,media_type,media_url,timestamp,permalink,like_count,comments_count,owner
    &limit=50
    &access_token={BRAND_PAGE_ACCESS_TOKEN}
```

### Required Permissions

| Permission | Access Level | Notes |
|-----------|-------------|-------|
| `instagram_basic` | Standard | Base access to IG account |
| `instagram_manage_comments` | Advanced (App Review) | Required to read tagged media |
| `pages_show_list` | Advanced | Connect IG account to Page |

**App Review required** for production access to `instagram_manage_comments`.

### Fields Available on Tagged Media Objects

| Field | Description |
|-------|-------------|
| `id` | IG Media ID |
| `caption` | Post caption text |
| `media_type` | `IMAGE`, `VIDEO`, `CAROUSEL_ALBUM` |
| `media_url` | Direct URL to media (image/video) |
| `timestamp` | ISO 8601 post creation time |
| `permalink` | Public Instagram URL to the post |
| `like_count` | Number of likes |
| `comments_count` | Number of comments |
| `owner` | Object with `id` of the posting account |
| `username` | Username of the poster (if accessible) |
| `children` | For carousels: array of child media IDs |

**Note**: `media_url` for videos may require a separate request to get the CDN URL, and CDN URLs for media have expiry — download promptly.

### Content Types Covered

| Content Type | Supported | Notes |
|-------------|-----------|-------|
| Feed photos (single image) | ✅ | Full metadata available |
| Feed videos | ✅ | Full metadata available |
| Carousels (album posts) | ✅ | Parent + children |
| Reels (tagged) | ❌ | Not returned by `/tags` |
| Stories (tagged) | ❌ | Separate system (Messaging API) |
| Promoted/sponsored posts | ❌ | Explicitly excluded |
| Shopping-tagged posts | ❌ | Explicitly excluded |
| Branded content posts | ❌ | Explicitly excluded |
| Private account posts | ❌ | Only public content |

### Pagination

- **Type**: Cursor-based (no time-based pagination)
- **Default page size**: ~25 results
- **Max `limit` parameter**: ~100 per request
- **Maximum total results**: ~10,000 most recently created media
- **Response includes**: `paging.cursors.before`, `paging.cursors.after`, `paging.next`

```json
{
  "data": [
    {
      "id": "17896130370026312",
      "caption": "Loving my new look with @brandname products!",
      "media_type": "IMAGE",
      "media_url": "https://scontent.cdninstagram.com/...",
      "timestamp": "2026-02-20T14:23:00+0000",
      "permalink": "https://www.instagram.com/p/ABC123/",
      "like_count": 847,
      "comments_count": 32
    }
  ],
  "paging": {
    "cursors": {
      "before": "cursor_before_string",
      "after": "cursor_after_string"
    },
    "next": "https://graph.facebook.com/..."
  }
}
```

### Rate Limits

- **BUC (Business Use Case) rate limit**: 200 API calls per brand Instagram account per rolling 1-hour window
- **Rate limit header**: `X-Business-Use-Case-Usage` in response headers
- **429 response**: Returned when limit exceeded, includes `Retry-After`
- **Implication for polling**: At 200 calls/hour, a brand can poll `/tags` approximately every 18 seconds continuously — far more frequent than needed for UGC capture

### Tag Approval Settings

Instagram users control whether tags appear automatically or require approval (in account privacy settings). If a creator has "Add Automatically" disabled, their tags require brand account approval before appearing via the API. This is a potential gap: brands see fewer tags than actually exist.

---

## 2. `mentioned_media` Endpoint — Caption/Comment @Mentions

### What It Is

When an Instagram user writes a post caption or comment that includes `@brandname`, the brand can fetch that media object. Unlike `/tags` which returns a collection, `mentioned_media` **requires a specific `media_id`** — it's a detail fetch, not a discovery endpoint.

This makes it **webhook-first by design**: the discovery mechanism is the `mention` webhook event (or the `mentions` Graph API webhook field), which delivers the `media_id`. Then `mentioned_media` is used to fetch full media details.

### Endpoint

```
GET https://graph.facebook.com/v22.0/{ig-user-id}/mentioned_media
    ?fields=id,caption,media_type,media_url,timestamp,permalink,like_count,comments_count,owner
    &media_id={THE_MEDIA_ID}
    &access_token={BRAND_PAGE_ACCESS_TOKEN}
```

**`media_id` is required** — this endpoint does NOT paginate through a collection.

### Companion: `mentioned_comment`

For @mentions in comments (rather than captions):

```
GET https://graph.facebook.com/v22.0/{ig-user-id}/mentioned_comment
    ?fields=text,timestamp,from
    &comment_id={THE_COMMENT_ID}
    &access_token={BRAND_PAGE_ACCESS_TOKEN}
```

### Required Permissions

| Permission | Access Level |
|-----------|-------------|
| `instagram_basic` | Standard |
| `instagram_manage_comments` | Advanced (App Review) |
| `pages_show_list` | Advanced |

Same permissions as `/tags`.

### Webhook Integration (Critical)

`mentioned_media` is designed to be used **after** receiving a `mention` webhook event:

**Webhook subscription**: Subscribe to the `mentions` field on the `instagram` webhook object:

```http
POST https://graph.facebook.com/{APP_ID}/subscriptions
  ?object=instagram
  &callback_url=https://your-server.com/webhooks/instagram
  &fields=mentions
  &verify_token=YOUR_TOKEN
  &access_token={APP_ID}|{APP_SECRET}
```

**Webhook payload** (when brand is @mentioned in a caption or comment):

```json
{
  "object": "instagram",
  "entry": [{
    "id": "17841405309211844",
    "time": 1580000000,
    "changes": [{
      "field": "mentions",
      "value": {
        "media_id": "17858893269000123",
        "comment_id": null
      }
    }]
  }]
}
```

**Then fetch full media details**:

```
GET /{ig-user-id}/mentioned_media?media_id=17858893269000123&fields=id,caption,...
```

This is a separate webhook object/field from the Messaging API webhooks — the `mentions` field uses **`changes`** (Graph API webhooks), not **`messaging`** (Messenger Platform webhooks). These are two different webhook systems.

### Content Types Covered

| Content Type | Supported | Notes |
|-------------|-----------|-------|
| Feed photos (caption @mention) | ✅ | Full metadata |
| Feed videos (caption @mention) | ✅ | Full metadata |
| Carousels (caption @mention) | ✅ | Full metadata |
| Comment @mentions | ✅ | Via `mentioned_comment` |
| Reels (caption @mention) | Partial | May be returned; documentation inconsistent |
| Stories (caption @mention via DM) | ❌ | Entirely separate — Messaging API `story_mention` event |
| Private account posts | ❌ | Only public content |

### Polling Alternative

Without webhooks, you cannot poll for new mentions — there is no `GET /{ig-user-id}/mentions` collection endpoint. However, the brand can poll `/tags` for photo-tags (which is a collection). For @mentions, webhooks are essentially mandatory.

---

## 3. Capability Map: What Each Endpoint Covers

```
Brand UGC Content Universe
├── Public feed posts (images, videos, carousels)
│   ├── Photo-tagged by creator → /tags endpoint ✅ (polling)
│   └── @mentioned in caption → mentioned_media ✅ (webhook-first)
│
├── Reels
│   ├── Photo-tagged → /tags ❌ (not supported)
│   └── @mentioned in caption → mentioned_media ⚠️ (uncertain)
│
├── Stories
│   ├── @mentioned in Story → story_mention event (Messaging API) ← separate system
│   └── Not @mentioned → NOT capturable via Graph API
│
└── Comments (on any public post)
    └── @mentioned in comment → mentioned_comment endpoint ✅ (webhook-first)
```

---

## 4. Authentication: Brand Token, No Creator Opt-In

Both endpoints use **the brand's own Page Access Token** (not the creator's token). This is the key property that enables zero-signup UGC capture:

```
Brand connects Instagram → Cheerful stores Page Access Token
→ Cheerful polls /tags or receives mention webhooks
→ Cheerful fetches UGC metadata
→ Zero interaction with creator required
```

**Token lifecycle**:
1. Brand completes OAuth flow connecting their Instagram account to Cheerful
2. Cheerful exchanges for long-lived Page Access Token (non-expiring)
3. All UGC discovery uses this token — no per-creator tokens needed

**Contrast with creator-based approaches**: APIs that need the creator's permission (e.g., requesting creator's media insights) require each creator to individually authorize — not viable for passive UGC monitoring.

---

## 5. Rate Limit Analysis for Cheerful

### Per-Brand Budget

**200 calls/hour per brand Instagram account.**

For a brand monitoring their UGC continuously:

| Use Pattern | Calls/Hour | Feasible? |
|------------|-----------|-----------|
| Poll `/tags` every 5 min | 12/hr | ✅ Easy |
| Poll `/tags` every 1 min | 60/hr | ✅ Fine |
| Poll `/tags` every 10 sec | 360/hr | ❌ Exceeds limit |
| Receive 100 webhook events + fetch details | 100 calls | ✅ Fine |
| Receive 200 webhook events + fetch details | 200 calls | ⚠️ At limit |

**Practical implication**: For most brands, polling `/tags` every 5-15 minutes consumes ~12-24 calls/hour, leaving 176-188 calls/hour budget for other API operations. This is very comfortable at normal UGC volumes.

### Multi-Brand Scaling (Cheerful Platform)

Rate limits are **per brand Instagram account**, not per Cheerful app. So 1,000 brands × 200 calls/hour = 200,000 calls/hour total capacity across the platform. Each brand's budget is independent.

**No shared rate limit concern**: Adding more brands does not consume a shared pool.

---

## 6. Constraints and Limitations

### What These Endpoints Cannot Do

| Gap | Implication |
|-----|-------------|
| No Stories | Stories with @mentions require Messaging API `story_mention` events — entirely separate integration path |
| No Reels (tags) | Branded Reels tagged in image cannot be captured via `/tags` |
| No untagged content | If creator doesn't tag or @mention, neither endpoint fires |
| No private accounts | Content from private accounts is invisible to these APIs |
| No historical bulk fetch | Cannot retroactively get all mentions; max ~10,000 most recent |
| @mentions require webhooks | No way to poll for new @mentions; must maintain live webhook subscription |
| Tag approval dependency | If brand has tag approval enabled, some tags are never visible until approved |
| Reels @mentions uncertain | Documentation inconsistent on whether Reels are returned by `mentioned_media` |

### Meta API Deprecation Risk

Meta has a history of deprecating and restricting API access:
- Instagram Basic Display API: deprecated Dec 4, 2024
- Various Insights metrics: deprecated Jan 8, 2025
- Rate limits reduced from 5,000 to 200 calls/hour (2024)

These endpoints (`/tags`, `mentioned_media`) have been stable, but any future Meta policy change could reduce capability. Building on official APIs is still far safer than unofficial scraping.

---

## 7. Integration with Cheerful Architecture

### New Components Required

**1. Brand Instagram OAuth onboarding**
- Brand connects their Instagram Business/Creator account via Meta OAuth
- Cheerful stores: `ig_account_id`, `page_id`, `page_access_token` (encrypted)
- Same flow needed for IG DM integration — these are shared infrastructure

**2. UGC polling worker (for `/tags`)**
```
Temporal workflow: UGCTagPollingWorkflow
  - Schedule: every 10-15 minutes per brand
  - Activity: GET /{ig-user-id}/tags (cursor-paginated)
  - Activity: deduplicate against existing ugc_content records
  - Activity: store new tagged media + trigger downstream processing
```

**3. Mention webhook handler**
- Subscribe to `mentions` field (Graph API webhook — separate from Messaging API)
- Handler: `POST /webhooks/instagram/mentions`
- Receive `media_id` → enqueue fetch → call `mentioned_media`
- Distinct from `POST /webhooks/instagram` (Messaging API endpoint for DMs/Story mentions)

**4. New database tables (proposed)**
```sql
CREATE TABLE ugc_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id),
    ig_media_id TEXT NOT NULL,
    capture_source TEXT NOT NULL, -- 'tags_polling', 'mention_webhook', 'story_mention'
    media_type TEXT, -- IMAGE, VIDEO, CAROUSEL_ALBUM
    media_url TEXT, -- download promptly; CDN URLs expire
    caption TEXT,
    permalink TEXT,
    like_count INTEGER,
    comments_count INTEGER,
    creator_ig_account_id TEXT, -- from owner.id field
    posted_at TIMESTAMPTZ,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(brand_id, ig_media_id)
);
```

**5. Media download pipeline**
- `media_url` from Graph API may expire — must download to Supabase Storage
- Temporal activity: download → store in `ugc-media` bucket → update `ugc_content.stored_media_url`

### Overlap with IG DM Integration

**Shared components**:
- Brand Meta OAuth flow (same setup: Instagram account → Facebook Page → access token)
- Long-lived page access token storage (`user_instagram_account` table)
- Facebook Page linkage requirement

**Separate components**:
- `mentions` webhook field (Graph API webhooks, `changes` envelope) vs. Messaging API webhooks (`messaging` envelope) — **different webhook systems**
- `/tags` polling is entirely independent
- `mentioned_media` fetch is separate from DM/Story handling

The webhook endpoint URL can be the same HTTPS endpoint, but the event routing logic must distinguish between:
- Messaging API events: `entry[].messaging[]` array
- Graph API change events: `entry[].changes[]` array

---

## 8. Effort Estimate

| Component | Effort | Notes |
|-----------|--------|-------|
| Brand OAuth + token storage | Small | Shared with IG DM integration |
| `mentions` webhook subscription | Small | Add field to existing webhook setup |
| `mentions` webhook handler | Small–Medium | New handler for `changes` envelope |
| `/tags` polling workflow (Temporal) | Medium | New workflow + cursor pagination |
| `mentioned_media` fetch activity | Small | Simple API call after webhook |
| `ugc_content` table + deduplication | Medium | Schema + upsert logic |
| Media download + Supabase Storage | Medium | New pipeline; CDN expiry handling |

**Total**: Medium effort. The API itself is straightforward; the infrastructure (polling scheduling, deduplication, media storage) is the main work.

---

## 9. Summary: Capability Assessment

| Attribute | Value |
|-----------|-------|
| Creator opt-in required | **No** — brand's own token |
| Real-time capability | Partial — `/tags` requires polling; `mentions` via webhook |
| Content types | Feed posts (image, video, carousel), caption @mentions |
| Stories | **Not covered** (Messaging API required) |
| Reels | **Not covered** (tags), uncertain for mentions |
| Rate limits | 200 calls/hr/brand — comfortable for normal volumes |
| Permissions required | `instagram_manage_comments` (App Review needed) |
| Reliability | Official API — high reliability; meta deprecation risk exists |
| Cost | Free (no per-API-call cost) |
| Historical data | Max ~10,000 most recent tagged media; no bulk backfill |

**Bottom line**: `/tags` + `mentioned_media` together provide the **highest-confidence, zero-cost, zero-creator-opt-in** UGC capture layer for branded feed content. They are the correct foundation for any Cheerful UGC strategy. The two critical gaps are (1) Stories (handled by Messaging API) and (2) Reels tagged by creators (may require alternative approaches).

---

## Sources

- Meta Developer Documentation: Instagram Graph API (instagram-api reference)
- [Instagram Graph API Complete Developer Guide 2026 — Elfsight](https://elfsight.com/blog/instagram-graph-api-complete-developer-guide-for-2026/)
- [Instagram Graph API Phyllo Guide](https://www.getphyllo.com/post/instagram-graph-api-use-cases-in-2025-iv)
- [Navigating Instagram API Rate Limit Errors — Phyllo](https://www.getphyllo.com/post/navigating-instagram-api-rate-limit-errors-a-comprehensive-guide)
- [Instagram Pagination Implementation — Phyllo](https://www.getphyllo.com/post/how-to-implement-pagination-with-the-instagram-api)
- [Meta API Pricing & Rate Limits — AgentsAPIs](https://agentsapis.com/meta-api/pricing/)
- [Meta Webhooks Realtime — IG DM Reverse Analysis](../cheerful-ig-dm-reverse/analysis/meta-webhooks-realtime.md) ← prior analysis from this monorepo
