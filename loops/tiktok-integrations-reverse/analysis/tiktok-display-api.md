# TikTok Display API — Analysis

## Overview

The TikTok Display API is a set of HTTP APIs that allows third-party platforms to display a TikTok creator's profile and videos within their own application. It is a **user-context API** — all calls require an OAuth access token from the specific user whose data is being accessed. This means it is only useful when creators (or brand accounts) have explicitly connected their TikTok account to your app via OAuth (Login Kit).

**Status**: Generally Available (GA)
**Authentication**: OAuth 2.0 user access tokens (via Login Kit — prerequisite)
**Base URL**: `https://open.tiktokapis.com/v2/`
**Official Docs**: https://developers.tiktok.com/doc/display-api-overview

---

## Critical Constraint: User-Context Only

> **The Display API cannot be used to look up arbitrary creators.** You can only access data for users who have explicitly authorized your app via OAuth.

This is the most important limitation for Cheerful's creator discovery use case. The Display API answers: "What is the data for the creator who just logged into my app?" — not "Tell me about @someCreator."

For arbitrary creator lookup, see:
- **Research API** (restricted academic/commercial access, not per-user OAuth)
- **Apify TikTok actors** (third-party scraping)
- **Third-party data providers** (HypeAuditor, Modash, etc.)

---

## Endpoints

### 1. `POST /v2/user/info/`

Returns profile information for the authenticated user.

**Request**:
```http
GET https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,bio_description,profile_deep_link,is_verified,username,follower_count,following_count,likes_count,video_count
Authorization: Bearer {access_token}
```

**Available Fields by Scope**:

| Scope | Fields |
|-------|--------|
| `user.info.basic` (default) | `open_id`, `union_id`, `avatar_url`, `avatar_url_100`, `avatar_large_url`, `display_name` |
| `user.info.profile` (review req.) | `bio_description`, `profile_deep_link`, `is_verified`, `username` |
| `user.info.stats` (review req.) | `follower_count`, `following_count`, `likes_count`, `video_count` |

**Sample Response**:
```json
{
  "data": {
    "user": {
      "open_id": "OPEN_ID_STRING",
      "union_id": "UNION_ID_STRING",
      "avatar_url": "https://...",
      "display_name": "Creator Name",
      "bio_description": "Bio text here",
      "profile_deep_link": "https://www.tiktok.com/@username",
      "is_verified": false,
      "username": "creatorhandle",
      "follower_count": 125000,
      "following_count": 312,
      "likes_count": 2100000,
      "video_count": 87
    }
  },
  "error": { "code": "ok", "message": "" }
}
```

---

### 2. `POST /v2/video/list/`

Returns paginated list of the authenticated user's public videos, sorted by `create_time` descending.

**Request**:
```http
POST https://open.tiktokapis.com/v2/video/list/?fields=id,title,video_description,duration,cover_image_url,embed_link,share_url,view_count,like_count,comment_count,share_count
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "max_count": 20,
  "cursor": 1701388800
}
```

**Pagination Parameters**:

| Parameter | Type | Notes |
|-----------|------|-------|
| `cursor` | int64 | Unix timestamp — fetch videos before this timestamp; omit for most recent |
| `max_count` | int32 | Default: 10, Max: 20 |

**Response includes**:
- `cursor` — pass back to get next page
- `has_more` — boolean indicating additional pages exist

**Available Video Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | TikTok video ID |
| `title` | string | Video title |
| `video_description` | string | Caption/description |
| `duration` | int | Length in seconds |
| `cover_image_url` | string | Thumbnail URL (expires — use video/query to refresh) |
| `embed_link` | string | Embeddable player URL |
| `share_url` | string | Shareable video URL |
| `view_count` | int | Total view count |
| `like_count` | int | Total like count |
| `comment_count` | int | Total comment count |
| `share_count` | int | Total share count |
| `favorites_count` | int | Total favorites/bookmarks |
| `create_time` | int64 | Unix timestamp of upload |

**Required Scope**: `video.list`

---

### 3. `POST /v2/video/query/`

Returns video metadata for specific video IDs belonging to the authenticated user. Also used to **refresh expired `cover_image_url` TTLs**.

**Request**:
```http
POST https://open.tiktokapis.com/v2/video/query/?fields=id,title,like_count,comment_count,share_count,view_count
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "filters": {
    "video_ids": ["VIDEO_ID_1", "VIDEO_ID_2"]
  }
}
```

**Constraints**:
- Max **20 video IDs** per request
- Videos must belong to the authenticated user (endpoint verifies ownership)

**Required Scope**: `video.list`

---

## Required Scopes Summary

| Scope | Data Access | Additional Review Required |
|-------|-------------|---------------------------|
| `user.info.basic` | open_id, union_id, avatar, display_name | No — added by default with Login Kit |
| `user.info.profile` | bio, username, profile link, is_verified | Yes |
| `user.info.stats` | follower_count, following_count, likes_count, video_count | Yes |
| `video.list` | All video fields (list + query endpoints) | Yes |

All scopes require:
1. TikTok app review approval to request the scope
2. Each end user must individually grant the scope via OAuth consent

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /v2/user/info/` | 600 requests | 1-minute sliding window |
| `POST /v2/video/list/` | 600 requests | 1-minute sliding window |
| `POST /v2/video/query/` | 600 requests | 1-minute sliding window |

**Exceeding limits**: HTTP 429 with error code `rate_limit_exceeded`.
**Higher limits**: Contact TikTok support — reviewed case by case.

---

## Authentication Requirements

1. **Login Kit setup** (see `tiktok-login-kit.md`) — prerequisite for all Display API calls
2. **OAuth flow** — user must explicitly authorize your app
3. **Scopes requested** at OAuth time determine which fields are accessible
4. **Access token** (`act.` prefix, 24-hour TTL) required in `Authorization: Bearer` header
5. **Refresh tokens** (365-day TTL) used to obtain new access tokens without re-prompting user

---

## App Review Process

The Display API requires standard TikTok app review (same process as Login Kit):

1. **Sandbox** — Test with up to 10 target users, no review required
2. **Production Review** — Submit demo video showing complete integration, ~3-4 day timeline
3. **Scope-specific review** — `user.info.profile`, `user.info.stats`, and `video.list` each require explicit review approval
4. **Post-approval changes** — Any changes to scope requests require re-review

**Requirement**: App must be live and externally accessible (not a beta/dev version) to be approved.

---

## Data Freshness & Limitations

- **`cover_image_url` expires** — Use `/v2/video/query/` to refresh
- **Pagination limit**: Max 20 videos per request via video/list
- **Only public videos** — Private or friends-only videos are not returned
- **Only own videos** — Cannot query another user's videos via Display API (their access token, their data only)
- **No audience demographics** — follower age/gender/location not available in any Display API endpoint
- **No video analytics beyond basic counts** — No completion rate, watch time, traffic source, etc.
- **No revenue data** — Creator Fund / Creativity Program earnings inaccessible
- **No historical data beyond what's available** — TikTok doesn't provide time-series metrics through this API (snapshot only)

---

## What Display API Does NOT Provide

| Data Type | Available? | Alternative |
|-----------|-----------|-------------|
| Audience demographics (age, gender, geo) | ❌ | Business API (requires Business account) |
| Video completion rate / watch time | ❌ | TikTok Creator tools (in-app only) |
| Revenue / Creator Fund earnings | ❌ | None via API |
| Follower growth over time | ❌ | Third-party analytics (Pentos, etc.) |
| Hashtag/sound analytics | ❌ | Research API |
| Competitor/arbitrary creator lookup | ❌ | Research API, Apify, third-party |
| DM access | ❌ | No TikTok API provides this |
| Comment write/reply | ❌ | Separate Comments API (if available) |

---

## Relationship to Other TikTok APIs

```
Login Kit (OAuth)
└── Display API ← This document
    ├── /v2/user/info/ — profile + stats for authorized user
    ├── /v2/video/list/ — recent videos with metrics
    └── /v2/video/query/ — specific video metrics, refresh image TTLs

Research API (separate — client_credentials, not user OAuth)
└── /v2/research/video/query/ — query ANY public video with metrics
    └── More powerful but restricted access (academic/commercial approval required)
```

**Key distinction**: Display API = data about your own authorized users. Research API = data about any public TikTok content.

---

## Cheerful Applicability

### Relevance: **Medium — Connected Creator Workflow Only**

The Display API is highly relevant IF Cheerful builds a "connect your TikTok" flow where creators explicitly authorize their accounts. Less useful for passive discovery of creators who haven't opted in.

| Cheerful Workflow | Display API Role | Notes |
|-------------------|-----------------|-------|
| **Creator Discovery** | ❌ Cannot discover arbitrary creators | Only works for creators who connect via OAuth |
| **Creator Enrichment** | ✅ Rich profile data for connected creators | follower_count, video_count, is_verified, username |
| **Content Tracking** | ✅ Poll campaign video metrics for connected creators | view_count, like_count, comment_count, share_count per video |
| **Outreach** | ⚠️ Not applicable (Display API is read-only) | Outreach is email/DM-based |
| **Campaign Management** | ✅ Track content performance for opted-in creators | Periodic polling of video metrics |
| **Reporting** | ✅ Video engagement metrics for reporting dashboards | Snapshot metrics (not time-series) |

### Two Use Case Paths for Cheerful

**Path A — Creator connects their TikTok** (Direct Display API):
- Creator clicks "Connect TikTok" in Cheerful
- OAuth flow with scopes: `user.info.basic,user.info.profile,user.info.stats,video.list`
- Cheerful stores access token + refresh token per creator
- Periodic Temporal workflow polls `/v2/video/list/` for their campaign content
- Access to: full profile, all public video metrics

**Path B — Discovery-first, no OAuth** (Apify / Research API):
- Cheerful discovers creator profiles without their participation
- No access to Display API (requires user auth)
- Metrics via third-party scraping (Apify) or Research API
- Invite creator to connect later for direct API access

### Implementation Considerations

1. **Token management**: Temporal cron job to refresh `act.` tokens before 24-hour expiry
2. **Scope strategy**: Request all four scopes upfront (`user.info.basic`, `user.info.profile`, `user.info.stats`, `video.list`)
3. **Polling cadence**: `/v2/video/list/` at 600 req/min rate limit — easily handles large creator pool
4. **Video ID storage**: Store video IDs in DB, use `/v2/video/query/` for metric refreshes
5. **cover_image_url refresh**: Must re-call `/v2/video/query/` when thumbnails expire

---

## Key Takeaways

1. **Display API = consent-gated** — only accessible for creators who OAuth into your app
2. **Sufficient for influencer performance tracking** — view_count, like_count, comment_count, share_count, follower_count all available
3. **Not a discovery tool** — cannot browse/search arbitrary creators
4. **Rate limits are generous** — 600 req/min easily supports a large influencer management platform
5. **Engagement metrics confirmed available** via `/v2/video/query/` — critical for campaign performance measurement
6. **`user.info.stats` scope** provides follower count needed for creator vetting (requires separate review approval)
7. **cover_image_url has TTL** — implement refresh logic for thumbnail caching
