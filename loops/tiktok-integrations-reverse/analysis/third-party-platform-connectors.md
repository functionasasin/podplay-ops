# Third-Party Platform Connectors — TikTok Integration

> Platform connectors (iPaaS / automation tools) that expose TikTok as a built-in integration: Composio, Zapier, Make.com, n8n.

---

## Summary

| Platform | TikTok Support | Depth | Cheerful Relevance |
|----------|----------------|-------|-------------------|
| **Composio** | 12 tools, 0 triggers | Content posting + user stats | HIGH — already in use; easiest TikTok path |
| **Make.com** | 4 modules (Campaign Mgmt, Audiences, Lead Forms, Conversions) | Primarily ads-focused | MEDIUM — ads automation only |
| **Zapier** | 2 apps (Lead Gen, Conversions) | Thin — ads lead capture only | LOW — no creator/content use case |
| **n8n** | Community node only (no official) | Content posting + user profile | LOW-MEDIUM — only if Cheerful self-hosts n8n |

**Key finding:** These platforms are mostly **ads-plumbing tools** (lead capture, conversion tracking, campaign management). None of them expose the full TikTok Display API or Research API surface. For creator data enrichment and content tracking — Cheerful's primary use cases — Apify actors remain superior. Composio is the exception because Cheerful already integrates with it, and it wraps the Content Posting API cleanly.

---

## 1. Composio

### Overview
Composio is an AI agent toolkit / MCP server that provides managed OAuth connections and tool definitions for 500+ apps. **Cheerful already uses Composio** (identified in Wave 3 prerequisite — see `spec-integrations.md`). Adding TikTok to Composio requires no new infrastructure — just connecting a TikTok account and enabling the tools.

### Available TikTok Tools (12 total, 0 triggers)

#### Content Management (5 tools)
| Tool | Description | Underlying API |
|------|-------------|----------------|
| `TIKTOK_UPLOAD_VIDEO` | Initialize + execute single-part video upload to get a `publish_id` | Content Posting API — `/v2/post/publish/video/init/` |
| `TIKTOK_UPLOAD_VIDEOS_BATCH` | Concurrent multi-video upload (parallel init + upload per file) | Content Posting API (batch) |
| `TIKTOK_POST_PHOTO` | Create photo/carousel post (1–35 images); DIRECT_POST or MEDIA_UPLOAD modes | Content Posting API — `/v2/post/publish/content/init/` |
| `TIKTOK_PUBLISH_VIDEO_FROM_INBOX` | Finalize and publish a previously uploaded video from creator inbox using `publish_id` | Content Posting API — publish endpoint |
| `TIKTOK_LIST_VIDEOS` | Retrieve authenticated user's video catalog with pagination | Display API — `/v2/video/list/` |

#### User Data Access (3 tools)
| Tool | Description | Data Fields |
|------|-------------|------------|
| `TIKTOK_GET_USER_BASIC_INFO` | Authenticated user basic details | `open_id`, `union_id`, `avatar_url`, `display_name`, `is_verified` |
| `TIKTOK_GET_USER_PROFILE_INFO` | Extended profile data | bio_description, profile_deep_link, username |
| `TIKTOK_GET_USER_STATS` | Engagement metrics | `follower_count`, `following_count`, `likes_count`, `video_count` |

#### Advertising & Business APIs (4 tools)
| Tool | Description | Note |
|------|-------------|------|
| `TIKTOK_GET_ACTION_CATEGORIES` | Retrieve action categories from Marketing API (for conversion tracking) | Marketing API |
| `TIKTOK_GET_TERMS` | Access advertiser or agency terms documentation | Marketing API |
| `TIKTOK_FETCH_PUBLISH_STATUS` | Monitor video/photo post processing status | Rate: 30 req/min |
| `TIKTOK_LIST_GMV_MAX_CUSTOM_SHOP_ADS` | Check occupied custom shop ads for campaigns | Shop/Marketing API |

### Rate Limits (Composio-enforced)
- Photo post init: **6 req/min per user token**
- Publish status check: **30 req/min per user token**
- Unaudited apps: restricted to `SELF_ONLY` privacy level (creator must have approved app)

### Authentication
- OAuth2 — Composio manages the token lifecycle, refresh, and scoping
- Cheerful connects a TikTok account once → Composio handles auth automatically
- All TikTok scopes must be approved in the TikTok developer app (same app review requirements apply)

### Pricing

| Plan | Price | API Calls/Month | Notes |
|------|-------|----------------|-------|
| Hobby | Free | 5,000–20,000 | Rate: 100 tool calls/min |
| Starter | $99/mo | 100,000 | Rate: 5,000 tool calls/min |
| Growth | $199/mo | 500,000 | — |
| Enterprise | Custom | Custom | VPC, SLA, SOC 2 |

Annual discounts + pay-as-you-go available.

### What Composio Does NOT Expose
- **No triggers/webhooks** — Composio is action-only for TikTok; polling must be implemented separately
- No Research API access
- No creator search / discovery (only authenticated user's own data)
- No audience demographics
- No comment read/write
- No Live API

### Cheerful Integration Path
Composio is the **lowest-friction TikTok integration point** for Cheerful:
1. Add TikTok OAuth scopes (`video.list`, `user.info.stats`, `user.info.profile`, `video.publish`, `video.upload`) to the existing TikTok developer app
2. Add Composio TikTok connection flow in Cheerful UI (same pattern as existing Composio connections)
3. Use `TIKTOK_LIST_VIDEOS` + `TIKTOK_GET_USER_STATS` for post-level content tracking for connected creators
4. Use `TIKTOK_UPLOAD_VIDEO` / `TIKTOK_PUBLISH_VIDEO_FROM_INBOX` for content management workflows
5. **Limitation**: only works for creators who have connected their TikTok to Cheerful — not for discovery of arbitrary creators

---

## 2. Zapier

### Overview
Zapier is a general-purpose workflow automation platform (trigger → action chains). TikTok support is narrow and entirely **ads-focused** — no creator discovery, no content tracking, no engagement data.

### Available TikTok Apps on Zapier

#### App 1: TikTok Lead Generation
- **Trigger**: `New Lead` (instant) — fires when a new lead is submitted via a TikTok Instant Form ad
- **Required**: TikTok Ads Manager account with admin access + at least one Instant Form
- **Data**: Lead form field values (name, email, phone, custom questions), advertiser account, lead source
- **Use case**: Route ad leads into CRM (HubSpot, Salesforce, Sheets, Mailchimp, etc.)

#### App 2: TikTok Conversions
- **Action**: `Send Lead Event` — posts server-side conversion data to TikTok for ad attribution
- **Free**: TikTok Conversions actions **do not count toward Zapier task usage** (up to 100K events/account)
- **Use case**: Close-the-loop attribution for TikTok ads; not influencer-related

### What Is Not Available on Zapier
- No creator data (profiles, metrics, follower counts)
- No video content access or posting
- No comment or DM access
- No campaign creation/management
- No TikTok Shop/affiliate data
- No hashtag/sound research

### Pricing

| Plan | Price | Tasks/Month | Notes |
|------|-------|-------------|-------|
| Free | $0 | 100 | 2-step Zaps only; 15-min polling |
| Professional | $29.99/mo | 750 + overages | Multi-step Zaps, webhooks |
| Team | $103.50/mo | 50,000 | 25 users, SAML SSO |
| Enterprise | Custom | Custom | Unlimited users, advanced permissions |

Overages billed at 1.25× per-task rate (max 3× plan limit before stopping).

### Cheerful Applicability
**Very low.** Zapier's TikTok footprint is ads lead capture only. The `New Lead` trigger could theoretically route TikTok ad leads from brand clients into Cheerful campaigns, but this is an edge case far outside the influencer outreach core workflow. Not recommended for Cheerful integration.

---

## 3. Make.com

### Overview
Make.com (formerly Integromat) is a visual automation platform with four dedicated TikTok modules. Coverage is primarily **ads/campaign management** with some legacy video post functionality. Requires TikTok for Business account + API access approval from TikTok.

### Available TikTok Modules (4)

#### Module 1: TikTok Campaign Management
*Prerequisite: TikTok for Business account + API access approval at ads.tiktok.com*

**Triggers (Instant)**
| Trigger | Description |
|---------|-------------|
| Watch Ads | Fires when a new ad is created or an existing ad is updated |
| Watch New Ad Groups | Fires when a new ad group is added |
| Watch New Campaigns | Fires when a new campaign is created |
| Watch New Video Post | Fires when a new TikTok video post is uploaded (legacy) |

**Actions**
| Action | Description |
|--------|-------------|
| Get a Campaign | Retrieve campaign details by ID |
| Update a Campaign | Modify campaign settings |
| Update a Campaign Status | Change campaign status (active/paused/deleted) |
| Get an Ad Group | Retrieve ad group details |
| Update an Ad Group Budget | Adjust ad group spend cap |
| Update an Ad Group Status | Pause/activate/remove ad group |
| Get an Ad | Retrieve ad details |
| Update an Ad's Status | Pause/activate/remove ad |
| Get Video Info / Get Embedded Video | Return embed code and video metadata (legacy) |
| List TikTok Video Posts | Retrieve public video posts (legacy) |
| Make an API Call | Arbitrary Marketing API call with auth handled |

**Searches**
| Search | Description |
|--------|-------------|
| Search Campaigns | Filter campaigns by criteria |
| Search Ads | Filter ads |
| Search Ad Groups | Filter ad groups |

#### Module 2: TikTok Audiences
Dedicated module for custom audience creation:
- Engagement Audience (video viewers, profile visitors, ad interactors)
- App Activity Audience
- Website Traffic Audience (Pixel-based)
- Lead Generation Audience
- Shop Activity Audience
- Business Account Audience

#### Module 3: TikTok Lead Forms
- **Trigger**: `Watch New Lead` — fires when a lead submits a TikTok Instant Form
- Same as Zapier's Lead Generation trigger; routes lead data to downstream apps

#### Module 4: TikTok Conversions
- **Action**: `Send TikTok Events` — posts conversion events for one or more TikTok App IDs
- Same function as Zapier's TikTok Conversions action; used for ad attribution

### Legacy Modules (Deprecated/Obsolete)
- `Upload a Sound` — marked obsolete
- `List Ad Reports` — marked legacy
- `Watch TikTok Video Posts` — marked legacy (polling-based video monitoring)

### Account Requirements
- TikTok for Business account required for all modules
- API access approval required — manual review at ads.tiktok.com
- Standard TikTok API rate limits apply (underlying calls hit the Marketing API)

### Pricing

| Plan | Price (annual) | Credits/Month | Notes |
|------|---------------|--------------|-------|
| Free | $0 | 1,000 | 15-min min interval |
| Core | $10.59/mo | 10,000 | Unlimited active scenarios |
| Pro | $18.82/mo | ~20,000+ | Priority execution, full-text exec search |
| Teams | $34.12/mo | Higher | Team roles, reusable templates |
| Enterprise | Custom | Custom | AI agents, SSO/SCIM, audit logs |

*Switched from "operations" to "credits" on August 27, 2025. Most actions = 1 credit. AI modules may cost more.*

Extra credits: 25% additional charge on overage.

### What Make.com Does NOT Expose
- No creator profile search or discovery
- No video content metrics (views, likes, comments) outside of ad reporting
- No TikTok Shop/affiliate data
- No comment or DM access
- No audience demographics
- No hashtag/sound research
- No Research API surface

### Cheerful Applicability
**Medium for ads-heavy workflows.** If Cheerful manages client TikTok ad campaigns (Spark Ads boosting creator content), Make.com could handle campaign lifecycle automation:
- Watch for new campaign → update tracking spreadsheet
- New lead from TikTok ad → create deal in CRM
- Performance threshold alert → pause ad group automatically

However, Cheerful's backend is FastAPI + Temporal — these workflows would be implemented natively, not delegated to Make.com. Make.com adds no value for the core influencer discovery/enrichment/outreach loop.

---

## 4. n8n

### Overview
n8n is a self-hostable workflow automation tool (Node.js). There is **no official TikTok node** in n8n as of 2026. The community has attempted to fill this gap with a partial, unofficial node.

### Official TikTok Support
**None.** A request has been open in the n8n community forum (`Add TIkTok node` — community.n8n.io/t/add-tiktok-node/30048) since at least 2023. The TikTok integration page on n8n.io historically returned broken links.

### Community Node: `@igabm/n8n-nodes-tiktok`

Available on npm: `npm install @igabm/n8n-nodes-tiktok`
Source: `github.com/igabm/n8n-nodes-tiktok` | `github.com/bsormagec/n8n-nodes-tiktok`

**Supported Operations:**
| Operation | Description |
|-----------|-------------|
| Video Post | Upload video via URL or file |
| Photo Post | Upload 1+ photos from verified URLs (direct post or draft) |
| Post Status | Check publishing status using `publish_id` |
| User Profile | Retrieve authenticated user profile info and stats |

**Auth required:** OAuth2 (TikTok developer app with `video.upload`, `video.publish`, `user.info.basic`, `user.info.profile`, `user.info.stats` scopes approved)

**Warnings:**
- Community node — no guarantees of maintenance or API compatibility
- v1.1.0 introduced breaking change to default OAuth scopes (requires reauthorization)
- Photo URLs must originate from TikTok-verified domains (same restriction as native API)

### Workaround Approaches

#### 1. HTTP Request Node (Native n8n)
Use n8n's built-in HTTP Request node with manual TikTok API calls:
- Auth: OAuth2 credential type → configure with TikTok app credentials
- Any TikTok REST endpoint accessible (Marketing API, Display API, Content Posting API)
- More work to configure but no dependency on community node stability

#### 2. Third-Party Publishing Services
Several n8n workflow templates use intermediary services to post to TikTok:
- **Blotato** — multi-platform publisher (TikTok, YouTube, Instagram, etc.); n8n → Blotato API → TikTok
- **Postiz** — social media scheduler with AI caption generation; n8n → Postiz → TikTok
- Both introduce additional cost and dependency; Blotato pricing ~$29–49/mo

### n8n Pricing

| Edition | Price | Notes |
|---------|-------|-------|
| Community (self-host) | Free | Full features; self-managed infra |
| Starter (cloud) | $20/mo | 5 active workflows, 10K executions/mo |
| Pro (cloud) | $50/mo | 15 active workflows, 50K executions/mo |
| Enterprise | Custom | Unlimited, SSO, audit logs |

### Cheerful Applicability
**Low-Medium, conditional.** Cheerful's tech stack does not include n8n — it uses Temporal.io for workflow orchestration. There is no reason to add n8n to the stack for TikTok specifically. However, if Cheerful ever exposes a no-code automation layer for brand clients (similar to Zapier/Make), n8n self-hosted could be a foundation. For current Cheerful use cases, n8n brings nothing that isn't better served by direct TikTok API calls or Apify.

---

## Capability Comparison Matrix

| Capability | Composio | Zapier | Make.com | n8n |
|-----------|---------|--------|----------|-----|
| Creator profile data | Own user only | ✗ | ✗ | Own user only |
| Creator video list | Own user only | ✗ | Own user only (legacy) | Own user only |
| Creator follower stats | Own user only | ✗ | ✗ | Own user only |
| Creator discovery (arbitrary) | ✗ | ✗ | ✗ | ✗ |
| Video upload / post | ✓ | ✗ | ✗ | ✓ (community node) |
| Photo/carousel post | ✓ | ✗ | ✗ | ✓ (community node) |
| Campaign management | Partial (GMV ads) | ✗ | ✓ Full | ✗ (HTTP request) |
| Custom audiences | ✗ | ✗ | ✓ | ✗ |
| Lead form capture | ✗ | ✓ | ✓ | ✗ |
| Conversion tracking | ✗ | ✓ (free) | ✓ | ✗ |
| Comment access | ✗ | ✗ | ✗ | ✗ |
| DM / messaging | ✗ | ✗ | ✗ | ✗ |
| Webhook triggers | ✗ | ✗ | ✓ (ad events) | ✗ |
| TikTok Shop / affiliate | Partial (GMV ads) | ✗ | ✗ | ✗ |
| Research API | ✗ | ✗ | ✗ | ✗ |
| Arbitrary API call | ✗ | ✗ | ✓ | ✓ (HTTP node) |

---

## Key Findings for Cheerful

### Priority 1: Composio (Immediate)
Cheerful already integrates with Composio. Adding TikTok requires:
1. Adding TikTok to Composio account config — no new infrastructure
2. Connecting creator TikTok accounts via OAuth (same flow as other platforms)
3. Using `TIKTOK_LIST_VIDEOS` + `TIKTOK_GET_USER_STATS` for content tracking of **connected** creators
4. Using `TIKTOK_UPLOAD_VIDEO` / `TIKTOK_PUBLISH_VIDEO_FROM_INBOX` for any posting workflows

**Critical limitation**: Composio (like all these platforms) only exposes the creator's own authorized data — it does **not** solve the creator discovery problem for arbitrary public profiles.

### Priority 2: None (Zapier, Make, n8n — skip)
- **Zapier**: Ads lead capture only. No influencer use case.
- **Make.com**: Useful for brand clients who need ads campaign automation, but Cheerful builds that natively in Temporal. No net value to add Make as a dependency.
- **n8n**: Not in Cheerful's stack. Community TikTok node is too fragile for production.

### Discovery Gap (All Platforms)
None of these platform connectors solve TikTok creator **discovery** for arbitrary creators. They all require the creator to have authenticated. For discovery of the TikTok ecosystem, the path remains:
- **Apify** actors (Wave 2: `third-party-apify-tiktok`) — no auth required, public profile scraping
- **TikTok Research API** (Wave 1: `tiktok-research-api`) — academic only, commercial prohibited
- **TikTok Creator Marketplace / TTO API** (Wave 1: `tiktok-creator-marketplace-api`) — official but TCM-registered pool only
