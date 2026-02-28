# TikTok Messaging & Comments API

## Summary

TikTok's messaging and comments capabilities are fragmented across three distinct API surfaces — each with different access requirements, account type constraints, and regional restrictions. The critical finding for Cheerful: **there is no official TikTok API to programmatically send DMs to creators for outreach**, and reading comments on arbitrary creators' videos requires the Research API which prohibits commercial use. Comment management APIs exist but are scoped to ad content or limited to business-owned organic content.

---

## API Surface 1: Research API — Video Comment Read

### Purpose
Read comments from any public TikTok video. The only official path to access comments on other creators' content.

### Authentication
- **Type**: Client credentials (no user authorization required)
- **Token**: `clt.` prefix, 2-hour lifetime, auto-refresh via client_key + client_secret
- **Scope**: `research.data.basic`
- **Endpoint**: `POST https://open.tiktokapis.com/v2/oauth/token/` (client credentials grant)

### Endpoints

#### Simple Comment List
```
POST https://open.tiktokapis.com/v2/research/video/comment/list/
Authorization: Bearer {client_access_token}
Content-Type: application/json
```

**Query params**: `fields=id,video_id,text,like_count,reply_count,parent_comment_id,create_time`

**Body**:
```json
{
  "video_id": 7101234567890123456,
  "max_count": 100,
  "cursor": 0
}
```

**Response fields per comment**:
| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Comment ID |
| `video_id` | string | Parent video ID |
| `text` | string | Comment text (PII redacted) |
| `like_count` | int | Likes on comment |
| `reply_count` | int | Number of replies |
| `parent_comment_id` | string | Populated for nested replies |
| `create_time` | int | Unix timestamp |

**Pagination**: cursor-based (`has_more` + `cursor` in response)

**Privacy**: Phone numbers, emails, credit card data automatically redacted from comment text

#### Task-Based Query API (VCE — Volume Comment Export)
For bulk comment extraction, a separate task-based system exists:

```
POST https://open.tiktokapis.com/v2/research/video/comment/query/
```

Flow: `create_query_task` → `check_query_task_status` → `get_query_task_result` → `cancel_query_task`

Additional field available: **commenter display_name** (not in simple list endpoint)

Supports logical operators (AND, OR, NOT) and numeric comparisons (GT, GTE, LT, LTE) on fields.

**Throughput**:
| Phase | Default records | Max records |
|-------|----------------|-------------|
| Testing | 100 | 5,000/day |
| Execution (approved) | 1,000 | 100,000/day |

### Rate Limits
- **Simple list**: ~30 requests/min per user access token
- **Combined Research API**: 1,000 requests/day, 100 records/request, 100K records/day total (shared with video + follower queries)

### Access Requirements
- **Eligibility**: US and EU/UK/CH academic institutions ONLY
- **Application**: ~4-week review process
- **Commercial use**: **Explicitly prohibited** by data use agreement
- **⚠️ CRITICAL**: Cheerful cannot legally use Research API comment data in production

---

## API Surface 2: Business API — Comment Management (Ad & Organic)

### Overview
TikTok's Business API (base: `business-api.tiktok.com`) includes a Comment API suite, documented in the official [Python SDK](https://github.com/tiktok/tiktok-business-api-sdk). These endpoints are primarily documented in the context of ad comment management but extend to some organic comment operations.

### Authentication
- **Type**: OAuth 2.0 via API for Business portal
- **Token exchange**: `POST https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/`
- **Params**: `app_id`, `secret`, `auth_code`
- **Token lifetime**: Long-lived (no expiry unless revoked)
- **App review**: 5–7 business days

### Endpoints

| Endpoint | Operation | Notes |
|----------|-----------|-------|
| `Comment List` | GET comments on content | Works for ad comments; organic content requires Organic API |
| `Comment Post` | Reply to a comment | Post a reply under a comment |
| `Comment Reference` | Get related/nested comments | Thread hierarchy |
| `Comment Status Update` | Toggle hide/unhide | Change comment visibility from public ↔ hidden |
| `Comment Delete` | Remove a comment | Permanent deletion |
| `Comment Task Create` | Initiate bulk comment export | Async job |
| `Comment Task Check` | Poll export job status | Returns status + results when done |
| `Blockedword List` | List blocked keywords | Auto-hide comments containing these words |
| `Blockedword Create` | Add keywords to block list | |
| `Blockedword Delete` | Remove keywords | |
| `Blockedword Check` | Check if word is blocked | |

### Access Context
- These endpoints are available through the Marketing API / API for Business
- Primarily designed for **ad comment moderation** (comments on promoted posts)
- Applicable to brands managing their own TikTok Business Account content
- **Not** a way to read or moderate comments on arbitrary creators' content

---

## API Surface 3: Organic API — Mentions (Open Beta, March 2025)

### Purpose
Track @mentions of a brand in TikTok video captions, comments, and replies. Designed for brand reputation monitoring, not reading all comments.

### What It Does
- Monitor TikTok for mentions of your brand via @mentions, hashtags, or keywords in organic video content
- Track brand presence in trending organic videos
- Engage with audiences who mention your brand
- Feed insights to Spark Ads decisions

### Status
- **Open Beta** (launched March 2025 as part of the TikTok Organic API suite)
- Five APIs in the Organic API suite: Accounts, Discovery, Mentions, TikTok One (TTO), Spark Ads Recommendation
- No public endpoint documentation yet; accessed via API for Business portal + partner relationship

### Access Requirements
- Available through TikTok API for Business portal
- Business account required
- App review required
- Partner program may apply

### Scope
- Brand mentions only — not full comment feeds
- Cannot read all comments on a video; only comments that mention your brand handle/hashtag

---

## API Surface 4: Content Posting API — Comment Settings

### Comment Permission Control
The Content Posting API's `creator_info` endpoint returns the `allow_comment` field, which indicates whether the authenticated creator has comments enabled. When posting video via Direct Post, the upload can include an `interaction_ability` object that controls Allow Comment, Duet, and Stitch settings.

```
POST https://open.tiktokapis.com/v2/post/publish/content/init/
```

Comment toggling is input-only at post time — cannot be changed after posting via API.

---

## API Surface 5: Business Messaging API (Direct Messages)

### Purpose
Enables TikTok Business Accounts to exchange Direct Messages with TikTok users through API-integrated platforms. B2C messaging (brands receiving and responding to consumer DMs), **not** B2B or outbound prospecting.

### Authentication
- **Type**: OAuth 2.0 via API for Business portal
- **Required**: TikTok Business Account
- **Documentation**: `business-api.tiktok.com/portal/bm-api/education-hub`

### Capabilities
| Feature | Available |
|---------|-----------|
| Send text messages | ✅ |
| Receive messages | ✅ |
| Automated reply rules | ✅ |
| Welcome messages | ✅ |
| Suggested questions / prompts | ✅ |
| Image attachments | ✅ (market-dependent) |
| Video messages | ❌ (not via third-party integrations) |
| Voice messages | ❌ (not via third-party integrations) |
| Stickers/GIFs | ❌ (not via third-party integrations) |
| Initiate conversation with any user | ❌ (user must message first) |
| Bulk DM / cold outreach | ❌ (anti-spam policy) |

### Messaging Window Constraints
- **48-hour window**: Business can only reply within 48 hours of the user's last message
- **Reset**: Window resets each time the user sends a new message
- **10-message cap**: Max 10 business messages per conversation window; resets on next user message
- **User-initiated only**: Business cannot start a conversation; user must DM the brand first

### Regional Restrictions
- **Available**: Business accounts registered OUTSIDE the United States, EEA, Switzerland, and UK
- **Not Available**: US, EU, EEA, UK, Switzerland
- **Image attachments**: Additional market-specific restrictions apply

### Partner Program
- Messaging integrations typically go through TikTok's **Messaging Partners** program
- Partners (e.g., SleekFlow, Qiscus) access the API and build CRM-style inboxes
- Features partners can enable: multi-agent inbox, conversation labeling, auto-reply, CRM sync (HubSpot, Salesforce, Google Sheets, Zoho)
- Direct API access for non-partners requires Business API portal approval

### What Business Messaging Cannot Do for Cheerful
- **Cannot** cold-message creators for outreach — user must initiate first
- **Cannot** send messages in US/EU (where most Western Cheerful clients and creators operate)
- **Cannot** DM personal accounts, only TikTok users who message the business first
- Not designed for influencer relationship management

---

## API Surface 6: Data Portability API — DM Export

### Purpose
One-time or recurring export of a user's DM history for data portability compliance. Not a real-time messaging API.

### Authentication
- Requires user authorization via Login Kit
- Scopes:
  - `portability.directmessages.single` — One-time DM data export request
  - `portability.directmessages.ongoing` — Recurring DM data export requests

### Flow
1. User grants app the portability scope
2. App requests data export on user's behalf
3. Track request status via Data Portability API
4. Download archive when `portability.download.ready` webhook fires

### Use Case for Cheerful
Allows users to self-export their DM history. No use for Cheerful's outreach workflows — this is user-owned data export, not programmatic messaging.

---

## Webhook Events (Messaging & Comments)

Current TikTok webhook events (from Developer Portal):

| Event | Trigger | Payload Fields |
|-------|---------|----------------|
| `authorization.removed` | User deauthorizes app | `reason` (0–5 code) |
| `video.upload.failed` | Video Kit upload fails | `share_id` |
| `video.publish.completed` | User publishes uploaded video | `share_id` |
| `portability.download.ready` | Data portability archive ready | `request_id` |

**Notable gaps**:
- ❌ No webhook for **new comment on owned video**
- ❌ No webhook for **comment reply/mention received**
- ❌ No webhook for **new DM received** (Business Messaging likely has its own internal webhook separate from the developer portal system; used by messaging partners)
- ❌ No webhook for **comment moderation events**

**Webhook delivery**:
- HTTPS POST, JSON format
- Must respond 200 immediately
- Retry up to **72 hours** with exponential backoff
- At-least-once delivery (idempotency required)
- No HMAC verification mentioned in public docs (contrast with Shop API which uses HmacSHA256)

---

## Account Type Capability Matrix

| Capability | Personal Account | Creator Account | Business Account |
|-----------|-----------------|-----------------|------------------|
| Read own video comments | ❌ No API | ❌ No API | Organic API Mentions (brand mentions only, beta) |
| Read any creator's comments | ❌ | ❌ | Research API (academic only, commercial prohibited) |
| Reply to comments on own videos | ❌ | ❌ | Business API Comment Post |
| Hide/delete comments on own videos | ❌ | ❌ | Business API Comment Status Update / Delete |
| Keyword-block comments | ❌ | ❌ | Business API Blockedwords |
| Send DMs to other users | ❌ | ❌ | Business Messaging (non-US/EEA only; user must initiate) |
| Receive/respond to DMs via API | ❌ | ❌ | Business Messaging (non-US/EEA only) |
| Export own DM history | Portability API | Portability API | Portability API |
| Comment moderation on ads | ❌ | ❌ | Marketing API Comment endpoints |

---

## Critical Gaps for Influencer Outreach

| Desired Capability | Available? | Notes |
|-------------------|-----------|-------|
| DM creators proactively for outreach | ❌ | Technically impossible via official API |
| Read creator's comment engagement/sentiment | ❌ commercially | Research API only; academic use; no commercial license |
| Monitor brand mentions in creator comments | ✅ (beta) | Organic API Mentions; brand-side perspective only |
| Receive creator DMs on brand account | ✅ (non-US/EEA only) | Business Messaging; user must initiate |
| See comment count on creator videos | ✅ | Display API `comment_count` field; does not return actual comments |
| Respond to brand-tagged comments | Partial | Organic API Mentions + Business API Comment Post combo |

---

## Cheerful Applicability Assessment

### What's Viable
1. **Brand comment monitoring** (non-Cheerful use): If Cheerful's brand clients want to monitor their own TikTok Business account mentions, the Organic API Mentions (beta) is the path.
2. **Ad comment moderation**: For brands running TikTok ads, Marketing API Comment endpoints enable hide/delete/reply — useful for community management features.
3. **Customer support inbox**: Business Messaging API enables CRM-style DM management for non-US/EEA markets.

### What's NOT Viable
1. **Creator DM outreach**: Cannot cold-message creators via API. Any DM outreach to TikTok creators must happen outside TikTok's API (email, other platforms, manual).
2. **Creator comment data for enrichment**: Research API's academic-only restriction blocks commercial comment analysis. Must rely on third-party providers (Wave 2).
3. **Comment sentiment/engagement enrichment on creator content**: No commercial API path. Third-party data providers (Pentos, HypeAuditor, Modash) are the only viable route.

### Recommended Approach for Cheerful
- **Outreach**: TikTok DM outreach is not feasible via API. Cheerful's outreach workflows should use email (Gmail API, already integrated) or the TikTok Creator Marketplace (TCM/TTO API order-based workflow) as the primary channel.
- **Creator enrichment**: For comment data, evaluate Wave 2 third-party providers that repackage Research API data with commercial licenses.
- **Brand-side monitoring**: If Cheerful ever builds a "brand inbox" feature, Business Messaging API (for non-US clients) + Organic API Mentions (beta) is the combination to evaluate.

---

## Sources
- [TikTok Research API — Video Comment List](https://developers.tiktok.com/doc/research-api-specs-query-video-comments)
- [TikTok API Scopes Reference](https://developers.tiktok.com/doc/tiktok-api-scopes)
- [TikTok Webhooks Overview](https://developers.tiktok.com/doc/webhooks-overview/)
- [TikTok Webhook Events](https://developers.tiktok.com/doc/webhooks-events/)
- [TikTok Business Messaging API Education Hub](https://business-api.tiktok.com/portal/bm-api/education-hub)
- [TikTok API for Business Portal](https://business-api.tiktok.com/portal)
- [TikTok Business API SDK (Python)](https://github.com/tiktok/tiktok-business-api-sdk)
- [TikTok Data Portability API](https://developers.tiktok.com/doc/data-portability-api-get-started)
- [TikTok Organic API Launch (Swipe Insight, March 2025)](https://web.swipeinsight.app/posts/tiktok-launches-organic-api-15110)
- [SleekFlow — TikTok Business Messaging Integration](https://sleekflow.io/channels-integrations/tiktok-business-messaging)
- [SleekFlow Help — Business Messaging Channel Overview](https://help.sleekflow.io/en_US/tiktok-business-messaging/tiktok-business-messaging-channel-overview)
- [LinkDM — Is DM Automation Available on TikTok?](https://www.linkdm.com/blog/is-dm-automation-available-on-tiktok)
