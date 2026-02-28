# Third-Party Social Management Platforms — TikTok Integration Survey

## Summary

Nine social media management platforms were assessed for TikTok API exposure, developer API availability, analytics depth, and Cheerful applicability. The findings reveal that these platforms are primarily scheduling and analytics tools, not data pipelines: they require users to connect their own TikTok accounts and then operate within the same TikTok API constraints as direct integration. None solve the creator discovery problem (no platform can look up arbitrary public TikTok profiles via its API). The key differentiators are analytics depth, historical data retention, and whether they expose a developer-accessible API.

**Platforms surveyed**: Hootsuite, Sprout Social, Later, Buffer, Planoly, Loomly, SocialBee, Metricool, Agorapulse.

**Critical universal constraints** (apply to all platforms equally — TikTok API limitations):
- No DM outreach to arbitrary creators
- No trending audio/music (only Commercial Music Library for Business accounts)
- No custom thumbnails via API (some platforms work around this via UI selection)
- No editing/deleting published posts
- No video Saves metric (not exposed by TikTok API)
- No social listening on arbitrary public TikTok content
- No livestream comment management
- Posting rate: 2 videos/min, 20 posts/day per connected account

---

## Platform Profiles

### 1. Hootsuite

**Website**: hootsuite.com
**Type**: Enterprise social media management
**TikTok Marketing Partner**: Yes
**Developer API**: Yes (gated — requires Developer account approval)
**Starting price**: $99/month (annual)
**Business account required**: Yes (for scheduling; DMs limited to non-EEA/CH/UK)

#### TikTok Features

**Publishing:**
- Auto-publishing with scheduling window beyond TikTok's native 10-day limit
- Bulk scheduling
- Custom thumbnail upload (added October 2025)
- Content approval workflows (Team plan+)
- Best time to post (follower activity heatmap)

**Engagement:**
- Comment management via unified inbox
- DM management — Business accounts only, **not available in EEA/Switzerland/UK** (TikTok API restriction; this is the only major platform with any DM support)

**Analytics — Account-level:**
- Video views, reached audience, profile views
- Total followers, net new followers
- Follower demographics: gender, age, location
- Follower activity heatmap (when followers are online)

**Analytics — Post-level:**
- Views, likes, comments, shares, favorites
- Total play time, average watch time
- Full video completion rate, retention rate
- Traffic sources (how viewers found the video)
- New followers gained from video
- Viewer types (new/returning, followers/non-followers)
- Viewer demographics per video: gender, age, location

**AI / Competitive:**
- OwlyWriter: AI-generated captions, hashtag suggestions
- OwlyGPT: real-time TikTok trend analysis
- Competitor benchmarking: up to 20 TikTok profiles

#### Developer API

REST API at `apidocs.hootsuite.com`. Requires a separate Developer account (approval-gated, not self-serve). TikTok access is handled through general publishing and analytics endpoints — not broken out as a dedicated TikTok endpoint. Inbox 2.0 API available. Terms of use restrict use cases.

#### Pricing

| Plan | Annual | Users | Social Accounts |
|------|--------|-------|----------------|
| Professional | $99/month | 1 | 10 |
| Team | $249/month | 3 | 20 |
| Enterprise | Custom | 5+ | 50+ |

30-day free trial. No free tier. TikTok available on all plans.

#### Cheerful Relevance

LOW. Hootsuite is a brand/agency tool for managing their own connected TikTok accounts. Its developer API does not enable creator discovery or outreach to arbitrary profiles. The partial DM support (non-EEA Business accounts) is the only unique capability — and it does not solve Cheerful's core outreach use case (initiating contact with unclaimed creators). Competitor benchmarking for up to 20 profiles could supplement manual creator research but is not programmatically useful.

---

### 2. Sprout Social

**Website**: sproutsocial.com
**Type**: Enterprise social media management + analytics
**TikTok Marketing Partner**: Yes
**Developer API**: Yes (Advanced plan required, $399/seat/month)
**Starting price**: $199/seat/month (annual)
**Business account required**: Strongly recommended (Personal accounts supported but limited)

#### TikTok Features

**Publishing:**
- Auto-publishing scheduled over a year in advance
- Optimal Send Times recommendations
- Message approval workflows + Campaign organization
- AI content tools

**Engagement:**
- Smart Inbox: comment reply, like, assign to team members
- Automated rules on comments: auto-hide, auto-reply by keyword
- Saved replies + Inbox Macros (Advanced plan)
- Custom Inbox views
- TikTok Listening (Connected Profile @mentions; NOT arbitrary public social listening)

**Analytics — Account/Profile Report:**
- Published posts, shares, profile views, impressions, total engagements
- Received messages (comment count)
- Follower growth: net only ("Audience Gained" and "Audience Lost" NOT available — only net)
- Audience by Country, Gender (only for users who set pronouns)

**Analytics — Post Performance Report:**
- Reach (unique users)
- Engagements, reactions, comments, shares, video views
- Impression breakdown (origin of video views)
- Engagement Rate per Impression

**Data retention**: Unlimited historical storage after account connect. TikTok native = ~60 days. First connect: 24-hour delay + up to 60-day backfill.

#### Developer API

Published at `api.sproutsocial.com/docs`. OAuth 2.0 or Account-scoped tokens. **Requires Advanced plan ($399/seat/month)**. Supports:
- Publishing TikTok posts
- Reading TikTok analytics (profile and post level)
- Demographic data from TikTok Profiles Reports
- TikTok Listening data
- Reading TikTok messages/comments

Limitation: `clickthrough_link` not supported for TikTok posts via API.

#### Pricing

| Plan | Annual (per seat) | Social Profiles |
|------|------------------|----------------|
| Standard | $199/month | 5 |
| Professional | $299/month | Unlimited |
| Advanced | $399/month | Unlimited |
| Enterprise | Custom | Custom |

Premium Analytics add-on: ~$2,400–$4,800/year. API access: Advanced plan only.

#### Cheerful Relevance

LOW-MEDIUM. Sprout Social's **unlimited historical data storage** is the one genuinely differentiating feature for Cheerful: it could back-fill TikTok metrics going further than 60 days for any creator who connects their account. The developer API (behind the Advanced plan wall) lets Cheerful pull that stored analytics data programmatically. However, this still requires creator OAuth — Sprout cannot look up arbitrary public creator profiles. The cost ($399+/seat) makes it non-competitive vs direct TikTok API integration for Cheerful's own data pipeline. The TikTok Listening integration (connected profile mentions only) is not broad enough to replace dedicated listening tools.

**One interesting data point**: The ChatGPT Plus/Pro/Enterprise connector (November 2025) allows natural language querying of connected TikTok publishing data — potentially useful for non-technical client reporting.

---

### 3. Later

**Website**: later.com
**Type**: Visual social media planning + scheduling
**Developer API**: No (internal GraphQL; no public API)
**Starting price**: $18.75/month (annual)
**Business account required**: No (Personal supported with reduced analytics)

#### TikTok Features

**Publishing:**
- Auto-publishing with no hard scheduling limit
- Bulk scheduling
- Cross-platform repurposing: TikTok → Instagram Reels, Pinterest, YouTube Shorts
- Notification publishing (for trending audio / native features)

**Engagement:**
- Comment moderation via Conversations tool (Growth plan+): reply, like, hide, delete
- Link in Bio page (mini-website for TikTok traffic)

**Analytics:**
- Follower demographics and audience growth
- When followers are online
- Post performance per video
- Custom Analytics dashboard (Scale plan)
- Post tagging by campaign with performance tracking

**AI / Trends:**
- Best time to post (Growth/Scale/Enterprise)
- **Future Trends**: AI-powered predictions of upcoming TikTok hashtags and content trends over next 2 weeks (Growth/Scale/Enterprise) — unique feature

#### Pricing

| Plan | Annual | Social Sets | Notes |
|------|--------|-------------|-------|
| Starter | $18.75/month | 1 | 60 posts/month |
| Growth | $37.50/month | 1 | Unlimited posts, comment mgmt |
| Scale | $82.50/month | 3 | Custom analytics, Future Trends |
| Enterprise | Custom | Custom | |

#### Cheerful Relevance

LOW. No public developer API means no programmatic integration path. Later's primary differentiation is visual planning and the Future Trends feature (AI hashtag/trend predictions 2 weeks out) — interesting for content strategy but not for Cheerful's discovery/outreach/tracking workflows. The comment moderation tool and link-in-bio are client-facing features. Cannot be used to discover or enrich arbitrary creator profiles.

---

### 4. Buffer

**Website**: buffer.com
**Type**: Simple social scheduling
**Developer API**: No (private/internal only — explicitly documented as such)
**Starting price**: Free; paid from $6/month/channel
**Business account required**: No (Personal accounts fully supported)

#### TikTok Features

**Publishing:**
- Auto-publishing to Business and Personal accounts
- Custom video cover (frame slider or custom image upload)
- Cross-posting in one step: TikTok + Instagram Reels + YouTube Shorts simultaneously
- Browser extension for quick queuing
- Drafts and team approvals
- Notification publishing

**Analytics — Very limited:**
- Likes, Views, Follower counts only
- Buffer explicitly states: "TikTok advanced analytics are unavailable within Analyze due to limitations with TikTok's API" — this is a policy/effort choice, not an actual API limitation

**What is NOT available:**
- No comment management or inbox for TikTok
- No DM management
- No best time to post for TikTok
- No demographic data
- Buffer-published posts cannot use TikTok Promote feature

#### Pricing

| Plan | Monthly | Channels | Posts/channel |
|------|---------|----------|--------------|
| Free | $0 | 3 | 10 |
| Essentials | $6/month/channel | Unlimited | 2,000 |
| Team | $12/month/channel | Unlimited | 2,000 |

**Lowest price point of any platform assessed.**

#### Cheerful Relevance

NONE. No public API, minimal analytics, no engagement features. Buffer's only notable characteristic is the ability to schedule to Personal TikTok accounts without Business conversion — useful for individual creator clients but not relevant to Cheerful's B2B workflows. The private developer API is explicitly unavailable to external developers.

---

### 5. Planoly

**Website**: planoly.com
**Type**: Visual content planning (Instagram-first, TikTok added)
**Developer API**: No
**Starting price**: Free (5 TikTok uploads/month); paid from $14/month
**Business account required**: No

#### TikTok Features

**Publishing:**
- Auto-publishing and scheduling
- Cross-platform repurposing: TikTok → Instagram Reels, Pinterest Video Pins, YouTube Shorts
- Notification publishing

**Content planning:**
- Ideas tab: save TikTok audio/video URLs for later repurposing
- Weekly Trends: browsable trending audio, hashtags, video transitions — built into planning UI
- Hashtag manager
- AI-generated captions

**Analytics:**
- Available but "significantly less comprehensive" than competitors; primarily Instagram-focused
- No detailed public breakdown of TikTok metric fields available

#### Pricing

| Plan | Annual | Social Sets | Notes |
|------|--------|-------------|-------|
| Free | $0 | 1 | 5 TikTok posts/month |
| Starter | $14/month | 1 | 60 posts/month |
| Pro | $36.50/month | 2 | Unlimited posts |

#### Cheerful Relevance

NONE. No developer API. Weak analytics. Primary value is the visual-first planning interface and the Trends browser — useful for content creators managing their own accounts, not for Cheerful's influencer marketing platform. The Ideas tab (save TikTok audio URLs for repurposing) is a UX feature, not a data pipeline.

---

### 6. Loomly

**Website**: loomly.com
**Type**: Brand-focused social scheduling with workflow management
**Developer API**: No
**Starting price**: $32/month (annual, up to 10 accounts, 2 users)
**Business account required**: Yes (TikTok API requirement)

#### TikTok Features

**Publishing:**
- Auto-publishing via web and mobile app
- Content approval workflows
- Post labels for campaign categorization
- Calendar Groups (Q4 2024)

**Engagement:**
- TikTok Interactions (Q4 2024): reply to comments, manage engagement — one of the few mid-market platforms with comment management

**Content controls on publish:**
- Select cover photo, allow/disallow comments, stitches, duets

**Analytics:**
- Follower growth, audience engagement and demographic shifts
- Post performance: views, engagement per post
- Campaign-level performance via labels
- Click tracking via built-in URL shortener

#### Pricing

| Plan | Annual | Accounts |
|------|--------|----------|
| Base | $32/month | 10, 2 users |
| Standard | $60/month | 20, 6 users |
| Advanced | $119/month | 35, 14 users |
| Premium | $175/month | 50, unlimited users |
| Enterprise | Custom | Custom |

Note: 2025 pricing update significantly increased costs; negatively received by smaller users.

#### Cheerful Relevance

NONE. No developer API. TikTok Interactions (comment management) is the strongest feature relative to cost, but this is a brand/agency tool for managing connected accounts — not a data API for arbitrary creator profiles. The Calendar Groups and campaign labels could be useful for Cheerful clients managing their TikTok presence, but Cheerful would not integrate with Loomly.

---

### 7. SocialBee

**Website**: socialbee.com
**Type**: Content category-based scheduling with evergreen recycling
**Developer API**: No
**Starting price**: $40.80/month (annual)
**Business account required**: Recommended; Personal accounts supported with limited analytics

#### TikTok Features

**Publishing:**
- Auto-publish: single MP4/MOV under 3 minutes and 50 MB
- Reminder publishing: multiple files, image slideshows
- Content categories with rotation and evergreen recycling — **unique feature**: automatically repost top-performing content on a schedule
- Content expiry dates
- Custom cover frame or custom thumbnail upload
- TikTok slideshow creation (photos + music + effects)
- AI caption generation with TikTok-specific formatting

**Analytics:**
- Posts, profile growth, followers
- Likes, comments, engagement rate per post
- Category metrics: performance by content category
- Follower demographics: age, gender, country, language
- Audience growth rate and best-performing posts
- Daily engagement heat/bubble maps (when audience interacts by day/hour)
- Data retention: up to 2 years on Accelerate plan — **unique**

#### Pricing

| Plan | Annual | Social Profiles | Users |
|------|--------|----------------|-------|
| Accelerate | $40.80/month | 10 | 1 |
| Pro | $82.50/month | 25 | 3 |
| Enterprise | Custom | Custom | Custom |

#### Cheerful Relevance

NONE. No developer API. The **2-year analytics retention** and **evergreen content recycling** are differentiated features but serve client-facing content management, not Cheerful's data pipeline. SocialBee is the strongest option for brands with large content libraries needing automated rotation. No engagement/inbox features for TikTok.

---

### 8. Metricool

**Website**: metricool.com
**Type**: Analytics-first scheduling platform + public API
**Developer API**: Yes (Advanced plan, ~$53/month) — **most accessible developer API in this category**
**Starting price**: Free
**Business account required**: Recommended; Personal accounts supported with reduced data

#### TikTok Features

**Publishing:**
- Auto-publishing with native scheduling
- **Music integration**: add popular TikTok songs to Business account posts directly within Metricool — unique among all platforms assessed
- Hashtag generator (keyword → popular hashtags + view counts)
- Predictive analytics: best times to post

**Competitive intelligence:**
- Competitor tracking: up to 5 competitors (free) or 100 (paid)
- Competitor metrics: follower count/growth, post volume, likes, comments, shares, total interactions, publishing frequency

**Analytics — Most Granular Breakdown Found:**

Account/community metrics:
- Follower count, growth
- Daily followers gained (`daily_new_followers`) — Business accounts, since Sept 29, 2025
- Daily followers lost (`daily_lost_followers`) — Business accounts, since Sept 29, 2025
- Profile views, post views, likes, comments, shares

Demographics (Business accounts only):
- Gender distribution
- Follower location

Post-level metrics:
- Engagement, total interactions, engagement rate
- Average reach per post, total reach
- **View sources breakdown**: "For You" page, Following feed, Profile visits, Search/Discover — granular impression source data
- **Watch time**: average watch time, video length
- **Full video completion percentage**
- Best-performing posts

**Note**: TikTok posts filtered for copyright violations are excluded (TikTok API doesn't return them). Posts inactive 7+ days may lack reach data.

#### Developer API

**Base URL**: `https://app.metricool.com/api`
**Auth**: `userToken` header (`X-Mc-Auth`), `userId`, and `blogId` parameters
**Documentation**: `app.metricool.com/resources/apidocs/index.html` + downloadable PDF
**Access level**: Advanced plan ($53/month)
**Orientation**: Read-only, data export

Supported BI connectors: Power BI, Tableau, Google Sheets, BigQuery, Snowflake, Redshift, Looker Studio. Also supports Zapier and Make integrations. White-label integration available.

TikTok-specific data accessible via API: all metrics listed above, including view source breakdown, completion rate, daily follower gain/loss, demographics.

#### Pricing

| Plan | Annual | Brands | Notes |
|------|--------|--------|-------|
| Free | $0 | 1 | 50 posts/month |
| Starter | From $20/month | Up to 10 | Unlimited scheduling, PDF/PPT reports |
| Advanced | From $53/month | Up to 25 | + API, Looker Studio |
| Custom/Enterprise | Custom | 50+ | White-label |

**TikTok included at no extra cost on all plans** (unlike X/Twitter which costs €5/account extra).

#### Cheerful Relevance

LOW-MEDIUM. Metricool is the **only platform in this category with an accessible public API at a reasonable price point** ($53/month). For Cheerful clients who connect their TikTok Business accounts, Metricool could serve as a data aggregator — pulling Metricool's stored analytics (view source breakdown, completion rate, daily follower gain/loss) via their API into Cheerful's database. This is most useful for enriching data on Cheerful-managed creators' owned accounts.

However, this still requires creator OAuth to Metricool (or direct TikTok connection). Cannot discover arbitrary public creator profiles. The view source breakdown (For You / Following / Profile / Search) and daily follower gain/loss are the two metrics most differentiated from what TikTok's Display API provides directly — worth considering if those signals drive campaign decisions.

**Music integration** (adding TikTok songs within the scheduling UI) is a unique posting-side feature for Cheerful clients who want to leverage trending audio on Business accounts.

---

### 9. Agorapulse

**Website**: agorapulse.com
**Type**: Social media management with CRM-like inbox features
**Developer API**: Yes (Custom/Enterprise plan only — read-only Analytics Open API)
**Starting price**: ~$49/month/user (annual)
**Business account required**: Yes (explicitly required for TikTok; Personal accounts not supported)

#### TikTok Features

**Publishing:**
- Video scheduling and auto-publishing
- Notification publishing for trending audio / native features
- Content calendar (daily/weekly/monthly views), content labels

**Engagement:**
- Comment management: reply, assign to team members, bookmark
- Saved Replies for faster responses
- Multi-step approval workflows (Custom plan)
- **Ad comment monitoring** (Professional plan+): manage comments on TikTok ad campaigns — unique in this set

**Analytics:**

Post Performance Report (per post):
- Views (impressions)
- Engagement (likes + comments + shares, Agorapulse-calculated)
- Engagement Rate per Impressions
- Engagement Rate per Reach

Audience Report:
- Follower growth, key engagement trends, user activity patterns

Community Management Report:
- Team response time, inbox action metrics per team member

**Demographics explicitly not available in Agorapulse for TikTok.**

**Data source note**: Some metrics are Agorapulse's own calculations and may not match TikTok's native dashboard exactly.

**AI capabilities:**
- Optimal posting schedule recommendations
- Metric summaries and trend highlights
- Context-aware AI reply generation maintaining brand voice

**ROI reports** (Advanced plan): tie TikTok activity to business outcomes via UTM tracking.

#### Developer API (Analytics Open API)

Launched March 25, 2024. **Read-only**. **Custom subscription plan only** (not publicly priced).
Rate limit: 500 requests per 30 minutes.
Supported platforms: Facebook, Instagram, LinkedIn, TikTok, YouTube.
Data accessible: Audience Report, Content Performance Report, Community Management Report — including TikTok.
Export targets: Looker Studio, Power BI, Tableau, custom BI tools.

**Agorapulse publishes the most detailed public list of TikTok API limitations (27 documented)** — making it the most transparent platform about what is and is not possible.

#### Pricing

| Plan | Annual (per user) | Notes |
|------|------------------|-------|
| Standard | ~$49/month | Basic |
| Professional | ~$119/month | + approval workflows, ad comment monitoring |
| Advanced | ~$149/month | + ROI reports, advanced analytics |
| Custom | Custom | + Open API, SSO, dedicated manager |

Per-user pricing makes teams expensive: 5 users on Professional = ~$745/month.

#### Cheerful Relevance

LOW. The **Ad Comment Monitoring** feature (managing comments on TikTok ad campaigns) is uniquely relevant if Cheerful's clients run Spark Ads — it allows monitoring comments on paid amplification of creator content, which is a real workflow gap in TikTok's native Ads Manager. However, this is a client-facing feature, not a data pipeline. The Open API (Custom plan only) is too expensive and read-only to be useful as a Cheerful data source. Business account requirement means no use for Personal account creators.

---

## Cross-Platform Comparison

| Feature | Hootsuite | Sprout Social | Later | Buffer | Planoly | Loomly | SocialBee | Metricool | Agorapulse |
|---------|-----------|---------------|-------|--------|---------|--------|-----------|-----------|------------|
| Auto-publish | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Comment management | Yes | Yes | Growth+ | No | No | Yes | No | No | Yes |
| DM management | Partial* | No | No | No | No | No | No | No | No |
| Ad comment monitoring | No | No | No | No | No | No | No | No | Yes |
| Analytics depth | Deep | Deep | Moderate | Minimal | Weak | Moderate | Moderate | Deep | Moderate |
| View source breakdown | No | No | No | No | No | No | No | Yes | No |
| Historical data retention | Standard | Unlimited | Standard | Standard | Standard | Standard | 2 years | Standard | Standard |
| Competitor tracking | 20 profiles | Listening | No | No | No | No | No | 5–100 | No |
| Public developer API | Yes (gated) | Advanced plan | No | No (private) | No | No | No | Advanced plan | Custom plan |
| TikTok music add | No | No | No | No | No | No | No | Yes | No |
| Business acct required | Yes | Rec. | No | No | No | Yes | Rec. | Rec. | Yes |
| Personal acct supported | No | Yes | Yes | Yes | Yes | No | Limited | Limited | No |
| Evergreen recycling | No | No | No | No | No | No | Yes | No | No |
| AI trend predictions | No | No | Yes | No | No | No | No | No | No |
| Starting price | $99/mo | $199/seat | $18.75/mo | $6/mo/ch | $14/mo | $32/mo | $40.80/mo | Free | $49/user |

\* Hootsuite DM: Business accounts only, not available in EEA/CH/UK.

---

## Key Findings

### 1. None solve creator discovery
Every platform in this category requires connecting your own TikTok account via OAuth. They operate within the connected account's data scope. None can look up arbitrary public creator profiles via their developer API. This is a fundamental architectural constraint — they are account management tools, not data access tools.

### 2. Three platforms expose developer APIs
- **Hootsuite**: Publishing + analytics API; gated developer account approval; most expensive tier
- **Sprout Social**: Comprehensive API (publishing + analytics + listening + messages); requires $399/seat/month Advanced plan
- **Metricool**: Read-only analytics API at $53/month — the only accessible price point; includes TikTok view source breakdown, completion rate, daily follower metrics
- **Agorapulse**: Read-only Analytics Open API; Custom plan only (unpriced); TikTok included

### 3. Metricool is the standout for analytics granularity + API access
Metricool uniquely exposes:
- **View source breakdown** (For You / Following / Profile / Search) — no other platform or official API at this price point
- **Daily follower gain/loss** (Business accounts, since Sept 2025)
- **Full video completion percentage**
- A documented public API at $53/month

### 4. Sprout Social's unlimited historical retention is uniquely valuable
TikTok's native API provides ~60 days of post analytics. Sprout Social stores unlimited history after account connect. For campaigns needing long-term TikTok performance data on connected creator accounts, Sprout is the only path without custom database work.

### 5. Hootsuite is the only platform with any DM capability
Hootsuite supports DM management for Business accounts outside EEA/CH/UK. This is the closest any platform gets to TikTok outreach — but it supports inbound DMs from fans, not proactive outreach to unclaimed creators. Still not a solution to Cheerful's creator outreach gap.

### 6. SocialBee's evergreen recycling is unique for content management clients
The automatic reposting of top-performing TikTok content is not available elsewhere. Relevant for Cheerful clients who want content amplification automation — though this is not a Cheerful-core workflow.

### 7. Agorapulse documents API limitations most transparently
27 explicitly documented TikTok limitations make Agorapulse the best source of ground-truth about what the TikTok Business API does and does not support — useful for planning Cheerful's own integration scope.

---

## Cheerful Applicability Assessment

### Direct integration candidate: None
No platform in this category should be integrated into Cheerful as a data source for creator discovery, enrichment, or campaign tracking. All require creator OAuth to the third-party platform (not to Cheerful), and none expose arbitrary public TikTok profiles.

### Indirect applicability: Metricool API
If Cheerful wants to expose **richer analytics for connected creator accounts** (post-onboarding enrichment), Metricool's API at $53/month could pull view source breakdown and completion rate data. However, this requires creators to also connect their TikTok to Metricool — adding friction. Direct TikTok Display API integration is simpler and faster.

### Client-facing recommendation: Provide Metricool or Sprout Social guidance
For Cheerful clients who want to manage their TikTok presence beyond what Cheerful provides (advanced scheduling, analytics dashboards, team workflows), the best recommendations are:
- **Metricool**: Best analytics + accessible price + TikTok music integration
- **Sprout Social**: Best for enterprise clients needing unlimited historical data and deep inbox management
- **Hootsuite**: Best for enterprise clients needing the broadest feature set including partial DM support

### Agorapulse Ad Comment Monitoring: niche applicability
If Cheerful adds Spark Ads management as a feature (boosting creator content), Agorapulse's ad comment monitoring could be a recommended companion tool for managing comment threads on those paid promotions.

---

## Decision: Skip as Cheerful Integration Layer

Social management platforms are **consumer-of-TikTok-API**, not **TikTok-API-alternatives**. They cannot bypass TikTok's constraints. For Cheerful's influencer marketing use cases:

| Need | Solution (NOT social management platforms) |
|------|------------------------------------------|
| Creator discovery | Apify `clockworks/tiktok-user-search-scraper` or Modash Discovery API |
| Profile enrichment | Apify `clockworks/tiktok-profile-scraper` + Phyllo for demographics |
| Content tracking | Direct TikTok Display API (for connected creators) or Apify `clockworks/tiktok-video-scraper` |
| Campaign management | Native Cheerful + TikTok Marketing API (Spark Ads) |
| Outreach | Email (Gmail API) + TikTok Creator Marketplace order-based flow |
