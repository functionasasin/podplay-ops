# TikTok Integration Atlas — Reverse Ralph Loop

You are an analysis agent in a ralph loop. Each time you run, you do ONE unit of work, then exit.

## Your Working Directory

You are running from `loops/tiktok-integrations-reverse/`. All paths below are relative to this directory.

## Your Goal

Produce an exhaustive **TikTok integration atlas** — a complete map of every way to programmatically interact with TikTok, covering official APIs, third-party services, and unofficial methods. Leave no stone unturned.

Then produce a **Cheerful applicability layer** that maps each integration to Cheerful's influencer outreach workflows (creator discovery, enrichment, outreach, content tracking, campaign management).

### Scope

Every integration domain:
- **Data access**: Creator profiles, video metrics, audience demographics, trending content, hashtags, sounds
- **Content**: Posting, scheduling, managing videos, drafts
- **Messaging & comments**: DMs, comment threads, comment moderation
- **Commerce**: TikTok Shop, affiliate programs, product catalogs, order management
- **Ads**: Campaign management, audience targeting, reporting, creative tools
- **Creator marketplace**: Discovery, collaboration, campaign briefs
- **Live**: Live streams, gifts, events
- **Sounds & music**: Sound library, trending sounds, usage tracking
- **Webhooks & events**: Real-time notifications, event subscriptions
- **Embeds & widgets**: oEmbed, embedded players, share integrations
- **Anything else discovered during research**

### Reference Material

- **Cheerful codebase**: `../../projects/cheerful/`
- **Cheerful reverse spec** (converged): `../cheerful-reverse/analysis/` — especially:
  - `synthesis/spec-data-model.md` — current data model
  - `synthesis/spec-integrations.md` — existing external integrations (Gmail, Apify, YouTube, etc.)
  - `synthesis/spec-workflows.md` — Temporal workflow patterns
  - `synthesis/spec-backend-api.md` — API surface

### Cheerful Tech Stack

| Layer | Technologies |
|-------|-------------|
| Backend API | FastAPI, Python, Pydantic, SQLAlchemy Core |
| Workflows | Temporal.io (durable execution) |
| Database | Supabase (PostgreSQL + RLS + Auth) |
| Frontend | Next.js, React, TypeScript, TanStack Query, Zustand |
| AI/LLM | Claude API, structured outputs, RAG |
| External Services | Gmail API, SMTP, Apify, Shopify, YouTube, Slack, PostHog |

### Output

- Per-aspect analysis files in `analysis/`
- Synthesis files in `analysis/synthesis/`:
  - `tiktok-integration-atlas.md` — master reference of every TikTok integration point
  - `cheerful-applicability-matrix.md` — each integration mapped to Cheerful workflows

## What To Do This Iteration

1. **Read the frontier**: Open `frontier/aspects.md`
2. **Find the first unchecked `- [ ]` aspect** in dependency order (Wave 1 before Wave 2 before Wave 3 before Wave 4)
   - If ALL aspects are checked `- [x]`: write convergence summary to `status/converged.txt` and exit
3. **Analyze that ONE aspect** using the appropriate method (see below)
4. **Write findings** to `analysis/{aspect-name}.md`
5. **Update the frontier**:
   - Mark the aspect as `- [x]`
   - Update Statistics (increment Analyzed, decrement Pending, update Convergence %)
   - If you discovered new aspects, add them to the appropriate Wave
   - Add a row to `frontier/analysis-log.md`
6. **Commit**: `git add -A && git commit -m "loop(tiktok-integrations-reverse): {aspect-name}"`
7. **Exit**

## Analysis Methods

### Wave 1: Official TikTok APIs

Deep dive into each official TikTok API product. For each, document: purpose, authentication method, available endpoints/operations, rate limits, data accessible, required permissions/scopes, app review process, pricing (if any), and current status (GA, beta, deprecated).

#### `tiktok-login-kit`
1. Research TikTok Login Kit (OAuth 2.0 for TikTok)
2. Document: auth flow, scopes available, token management, user data accessible at login
3. Note: relationship between Login Kit and other API products (prerequisite for most)
4. Produce: Login Kit capability map — what it unlocks, auth architecture

#### `tiktok-display-api`
1. Research TikTok Display API (formerly TikTok API v2 / Content Display)
2. Document: user info endpoints, video list endpoints, video queries
3. Note: what creator data is accessible (profile info, video metadata, metrics)
4. Document: rate limits, data freshness, pagination
5. Produce: Display API capability map for creator discovery and content tracking

#### `tiktok-content-posting-api`
1. Research TikTok Content Posting API
2. Document: video upload flow (direct post, inbox upload, chunked upload), photo posting
3. Note: content restrictions, review process, scheduling capabilities
4. Document: webhook callbacks for post status
5. Produce: Content Posting API capability map

#### `tiktok-research-api`
1. Research TikTok Research API (academic/commercial)
2. Document: query endpoints (video search, user search, comments), query syntax
3. Note: access requirements (application process, eligibility, data use agreements)
4. Document: rate limits, data scope, historical data availability
5. Produce: Research API capability map — what research-grade data is available

#### `tiktok-shop-api`
1. Research TikTok Shop Open API
2. Document: product catalog management, order management, affiliate management, seller tools
3. Note: shop types (seller, creator, affiliate), regional availability
4. Document: webhook events for orders, products, fulfillment
5. Produce: Shop API capability map — commerce integration surface

#### `tiktok-ads-marketing-api`
1. Research TikTok Marketing API (Ads)
2. Document: campaign management, ad group/ad CRUD, audience targeting, reporting endpoints
3. Note: creative tools (Smart Video, Dynamic Creative), Spark Ads (boosting organic content)
4. Document: Spark Ads specifically — how brands can boost creator content with permission
5. Produce: Marketing API capability map — paid amplification of influencer content

#### `tiktok-creator-marketplace-api`
1. Research TikTok Creator Marketplace (TCM) API or integration methods
2. Document: creator search/discovery, campaign brief creation, collaboration management
3. Note: is there a public API, or is it portal-only? What data is accessible?
4. Document: creator metrics available through TCM vs through Display API
5. Produce: TCM capability map — official creator discovery and collaboration tools

#### `tiktok-messaging-comments-api`
1. Research TikTok's messaging and comments API capabilities
2. Document: comment read/write endpoints, DM access (if any), moderation tools
3. Note: what's available for Business accounts vs Creator accounts
4. Document: any webhook events for new comments or messages
5. Produce: Messaging/comments capability map

#### `tiktok-live-api`
1. Research TikTok Live API capabilities
2. Document: live stream status, viewer metrics, gift/donation tracking
3. Note: RTMP streaming endpoints, live commerce integration
4. Document: what data is accessible about live events after they end
5. Produce: Live API capability map

#### `tiktok-webhooks-events`
1. Research TikTok's webhook/event notification system across all API products
2. Document: available event types per API product, payload formats, delivery guarantees
3. Note: webhook verification, retry behavior, subscription management
4. Produce: consolidated webhook/events reference across all TikTok APIs

#### `tiktok-embed-oembed`
1. Research TikTok embed and oEmbed capabilities
2. Document: embed player, oEmbed endpoint, customization options
3. Note: data extractable from oEmbed responses (without API auth)
4. Produce: embed/oEmbed capability map — zero-auth integration options

### Wave 2: Third-Party & Unofficial Methods

Research every non-official way to interact with TikTok. For each, document: what it provides, how it works, reliability, cost, TOS compliance, and limitations.

#### `third-party-apify-tiktok`
1. Research Apify TikTok actors (scraper, profile scraper, hashtag scraper, etc.)
2. Document: each actor's capabilities, data fields returned, rate limits, pricing
3. Note: Cheerful already uses Apify for Instagram — existing integration pattern
4. Produce: Apify TikTok actor catalog with capabilities per actor

#### `third-party-phantombuster-tiktok`
1. Research PhantomBuster TikTok automations
2. Document: available phantoms (profile scraper, follower extractor, etc.), capabilities, pricing
3. Produce: PhantomBuster TikTok assessment

#### `third-party-platform-connectors`
1. Research platform connectors with TikTok integrations: Composio, Zapier, Make, n8n
2. For each: document available TikTok triggers and actions, data accessible, limitations
3. Note: Cheerful already uses Composio — evaluate TikTok-specific offerings
4. Produce: platform connector survey for TikTok

#### `third-party-data-providers`
1. Research dedicated TikTok data/analytics providers: Pentos, Socialinsider, HypeAuditor, Modash
2. For each: what TikTok data they provide via API, pricing tier, data freshness
3. Produce: third-party TikTok data provider survey

#### `third-party-social-management`
1. Research social management platforms with TikTok API integrations: Hootsuite, Sprout Social, Later, Buffer
2. Document: what TikTok capabilities they expose via their own APIs (if any)
3. Produce: social management platform TikTok integration survey

#### `unofficial-scraping-methods`
1. Research unofficial TikTok scraping methods and libraries (TikTok-Api Python, Puppeteer approaches)
2. Document: capabilities, anti-bot measures, reliability, legal/TOS risks
3. Note: TikTok's stance on scraping (lawsuits, technical countermeasures)
4. Produce: unofficial methods risk/capability assessment

### Wave 3: Cheerful Architecture Analysis

Analyze Cheerful's existing architecture to understand how TikTok integrations would plug in. Read the cheerful-reverse spec files and the actual codebase.

#### `cheerful-creator-discovery-pipeline`
1. Read `../cheerful-reverse/analysis/synthesis/spec-integrations.md` (Apify, YouTube sections)
2. Read creator-related services in `../../projects/cheerful/apps/backend/src/services/`
3. Document: how creator discovery works today (Instagram via Apify, YouTube), enrichment pipeline
4. Identify: where TikTok creator discovery would slot in, what data model changes are needed
5. Produce: creator discovery pipeline analysis for TikTok integration

#### `cheerful-content-tracking-model`
1. Read `../cheerful-reverse/analysis/synthesis/spec-data-model.md` (creator_post, campaign_creator)
2. Document: how content tracking works today (post detection, metrics, attribution to campaigns)
3. Identify: what TikTok video tracking would require (new fields, new workflows)
4. Produce: content tracking model analysis for TikTok

#### `cheerful-campaign-workflow-touchpoints`
1. Read `../cheerful-reverse/analysis/synthesis/spec-workflows.md`
2. Document: every point in the campaign lifecycle where a social platform integration could add value
3. Map: which TikTok API capabilities from Wave 1/2 match each touchpoint
4. Produce: campaign workflow integration map

#### `cheerful-data-model-extensions`
1. Read `../cheerful-reverse/analysis/synthesis/spec-data-model.md`
2. Based on Wave 1/2 findings: outline what new tables, columns, or relationships would be needed
3. Document: migration strategy, backward compatibility considerations
4. Produce: data model extension blueprint for TikTok

### Wave 4: Synthesis

Read ALL Wave 1, 2, and 3 analysis files before starting any Wave 4 aspect.

#### `synthesis-tiktok-atlas`
1. Read every Wave 1 and Wave 2 analysis file
2. Build the master TikTok integration atlas:
   - **Official APIs**: capability matrix (API product × data type × operation)
   - **Third-party services**: capability matrix with cost/reliability ratings
   - **Unofficial methods**: risk-rated capability summary
   - **Auth requirements**: consolidated auth/permission map across all methods
   - **Rate limits**: consolidated rate limit reference
   - **Access requirements**: app review, business verification, regional restrictions
3. Write to `analysis/synthesis/tiktok-integration-atlas.md`

#### `synthesis-cheerful-applicability`
1. Read every analysis file (all waves)
2. Build the Cheerful applicability matrix:
   - **Per Cheerful workflow** (discovery, enrichment, outreach, content tracking, campaign management, reporting): which TikTok integrations enable or enhance it
   - **Effort estimates**: relative sizing for each integration path
   - **Dependencies**: what must be built first (Login Kit before Display API, etc.)
   - **Quick wins vs deep integrations**: categorize by implementation effort
3. Write to `analysis/synthesis/cheerful-applicability-matrix.md`

## Rules

- Do ONE aspect per run, then exit.
- Check dependencies: all Wave 1 before Wave 2, all Wave 2 before Wave 3, all Wave 3 before Wave 4.
- Write findings in markdown with specifics — API endpoint URLs, payload examples, pricing tiers.
- When researching APIs, use `WebSearch` and `WebFetch` to get current documentation. TikTok's API ecosystem changes frequently.
- When analyzing Cheerful code, reference specific file paths and line numbers.
- When you discover a new API product, service, or method not covered by existing aspects, add it to the appropriate Wave.
- Keep analysis files focused. One aspect = one file.
- Do NOT modify any files in `../../projects/cheerful/`. The codebase is read-only.
- Document EVERYTHING — even APIs that seem irrelevant may have niche uses.
- For third-party services, always include pricing information.
- Note regional availability — TikTok APIs often have region-specific restrictions.
- Distinguish between what's available for Business accounts vs Creator accounts vs regular users.
