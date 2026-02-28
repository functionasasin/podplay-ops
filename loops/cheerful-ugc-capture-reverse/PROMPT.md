# Cheerful Instagram UGC Auto-Capture — Reverse Ralph Loop

You are an analysis agent in a ralph loop. Each time you run, you do ONE unit of work, then exit.

You are running in `--print` mode. You MUST output text describing what you are doing. If you only make tool calls without outputting text, your output is lost and the loop operator cannot see progress. Always:
1. Start by printing which aspect you detected and what you're about to do
2. Print progress as you work
3. End with a summary of what you did and whether you committed

## Your Working Directory

You are running from `loops/cheerful-ugc-capture-reverse/`. All paths below are relative to this directory.

## Your Goal

Produce an exhaustive **options catalog** for adding zero-signup Instagram UGC auto-capture to the Cheerful platform. The focus is capturing brand-relevant content created by influencers — tagged mentions, photo tags, Story mentions, hashtag content, and AI-detected untagged brand appearances — without requiring creators to sign up or opt in.

The catalog must explore every viable approach at both the **API/method level** (official Meta APIs, AI detection, third-party services) and **architecture level** (how each approach integrates with Cheerful's existing infrastructure). For each approach, document trade-offs, constraints, effort estimates, and compatibility with Cheerful's existing architecture.

**Do NOT pick a winner.** The output is a comprehensive options catalog that enumerates all approaches with honest pros/cons.

### Key Context

Cheerful is simultaneously building Instagram DM support (see `../cheerful-ig-dm-spec/`). The DM integration uses the Instagram Messaging API with webhook infrastructure. **Story mention capture uses the same Messaging API webhook** — `story_mention` events arrive on the same endpoint as DM messages. This overlap is a critical architectural insight that must be explored.

Archive (archive.com) is the market leader in UGC auto-capture with 50K+ brands. They claim 100% Instagram and 98% TikTok content capture, including ephemeral Stories. Their "Archive Radar" uses AI to detect untagged brand mentions in video/audio. Understanding Archive's approach (and limitations) informs what Cheerful should build.

### Reference Material

- **Cheerful IG DM spec loop**: `../cheerful-ig-dm-spec/` — Messaging API webhook infrastructure being spec'd
- **IG DM reverse analysis**: `../cheerful-ig-dm-reverse/analysis/` — Meta API research, especially:
  - `meta-instagram-messaging-api.md` — Messaging API capabilities
  - `meta-webhooks-realtime.md` — Meta webhook infrastructure
  - `current-thread-model.md` — Cheerful's current data model
- **Cheerful reverse spec**: `../cheerful-reverse/analysis/synthesis/` — especially:
  - `spec-data-model.md` — current ER diagram, creator_post table
  - `spec-integrations.md` — external services
  - `spec-workflows.md` — Temporal workflow patterns
- **Cheerful codebase**: `../../projects/cheerful/` (READ-ONLY)
- **Hero features loop**: `../cheerful-hero-features/analysis/archive.md` — Archive competitor deep-dive

### Tech Stack Reference

| Layer | Technologies |
|-------|-------------|
| Backend API | FastAPI, Python, Pydantic, SQLAlchemy Core |
| Workflows | Temporal.io (durable execution) |
| Database | Supabase (PostgreSQL + RLS + Auth) |
| Frontend | Next.js, React, TypeScript, TanStack Query, Zustand |
| AI/LLM | Claude API, structured outputs |
| Media Storage | Supabase Storage |
| External Services | Instagram Graph API, Instagram Messaging API, Meta Webhooks, Apify |
| Deployment | Fly.io (backend), Vercel (frontend), Docker (local dev) |

### Output

An options catalog in `analysis/synthesis/`:
- One file per aspect in `analysis/`
- A final `analysis/synthesis/options-catalog.md` that cross-references everything into a comparison matrix
- Each option must include: description, how it works, constraints/limitations, effort estimate (relative), compatibility with existing architecture, risks

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
6. **Commit**: `git add -A && git commit -m "loop(cheerful-ugc-capture-reverse): {aspect-name}"`
7. **Exit**

## Analysis Methods

### Wave 1: External Landscape — Instagram UGC Capture Methods

Research every way to programmatically capture Instagram content that mentions or features a brand. For each approach, document: how it works, permissions/setup required, capabilities, rate limits, constraints, and cost.

#### `graph-api-mentions-tags`

1. Research the Instagram Graph API endpoints for brand content discovery:
   - `GET /{ig-user-id}/mentioned_media` — posts where brand is @mentioned in caption/comments
   - `GET /{ig-user-id}/tags` — posts where brand is photo-tagged (tagged in the image)
2. Document for each: required permissions, fields returned (media_url, caption, timestamp, permalink, engagement), rate limits, pagination
3. Note: these work with the brand's own token — NO creator opt-in needed
4. Document what content types are covered (feed posts, Reels, carousels) and what's missing (Stories, DMs, live)
5. Use `WebSearch` and `WebFetch` to get current Meta documentation (APIs change frequently)
6. Produce: complete API capability map for tagged/mentioned content discovery

#### `webhooks-mentions`

1. Research the Instagram webhook `mentions` field for real-time push notifications
2. Document: webhook subscription setup (`POST /app/subscriptions`, object=`instagram`, field=`mentions`), payload format (`comment_id`, `media_id`), delivery guarantees
3. Compare: webhook push vs polling `mentioned_media`/`tags` endpoints — latency, reliability, rate limit implications
4. Note: how this integrates with the Meta webhook infrastructure already researched in `../cheerful-ig-dm-reverse/analysis/meta-webhooks-realtime.md`
5. Produce: webhook-based mention detection capability assessment

#### `hashtag-monitoring`

1. Research the Instagram Hashtag API:
   - `GET /ig_hashtag_search` — hashtag ID lookup
   - `GET /{ig-hashtag-id}/recent_media` — recent posts using hashtag
   - `GET /{ig-hashtag-id}/top_media` — top posts using hashtag
2. Document the critical constraints: **30 unique hashtags per 7-day rolling window**, 30 posts per query
3. Assess: is this viable for UGC discovery at scale? What's the effective coverage?
4. Note: hashtag monitoring catches content where creator uses a branded hashtag but doesn't @mention or tag the brand
5. Document: permissions required, rate limits, field availability, content types covered
6. Produce: hashtag monitoring capability assessment with constraint analysis

#### `story-mention-capture`

1. Research how Instagram Story mentions are delivered:
   - Story @mentions trigger a `story_mention` event via the Instagram Messaging API (NOT the Graph API)
   - The event arrives as a message type on the Messaging API webhook
   - The payload includes a CDN URL to the Story media
2. Document: CDN URL expiry (24 hours), media download requirements, supported media types (image, video)
3. Critical: this uses the **same Messaging API webhook** as the IG DM integration. Document the overlap with `../cheerful-ig-dm-spec/`
4. Note: Meta's TOS on storing Story media — grey area vs explicit prohibition
5. Document: what Story content is capturable (mentions only) vs what's not (Stories without @mention)
6. Produce: Story capture capability assessment with IG DM integration overlap analysis

#### `ai-visual-detection`

1. Research computer vision approaches for detecting brand logos/products in Instagram content:
   - Logo detection: YOLO v8+, DETR, fine-tuned on brand assets
   - Product recognition: CLIP embeddings + vector similarity search (FAISS, Qdrant)
   - OCR: detecting brand names in on-screen text/captions within images/video
   - Frame sampling: 2-4 fps for video analysis, cost/accuracy trade-offs
2. Document: accuracy benchmarks, compute cost per image/video, training data requirements
3. Note: this is for detecting brand appearances in content that was NOT tagged or @mentioned
4. Research existing services: Google Cloud Vision, Amazon Rekognition, Roboflow — for logo detection without building from scratch
5. Produce: visual detection capability assessment with build-vs-buy analysis

#### `ai-audio-detection`

1. Research audio-based brand mention detection in Instagram video content:
   - Speech-to-text: OpenAI Whisper (free, 134+ languages), Google Speech-to-Text, Amazon Transcribe
   - Brand mention extraction: NER, keyword/regex matching on transcripts
   - Accuracy: handling accents, background music, casual pronunciation of brand names
2. Document: cost per minute of audio, accuracy by language/noise level, latency
3. Note: Whisper is open-source and can run self-hosted vs API
4. Produce: audio detection capability assessment

#### `ai-candidate-discovery`

1. Research how to build a candidate content pool for AI analysis (you can't scan all of Instagram):
   - Hashtag expansion: monitor category hashtags (#skincare, #fashion) relevant to brand's niche
   - Follower graph: monitor content from accounts that follow the brand or frequently engage
   - Creator network: if Creator A tagged the brand before, monitor A's future untagged content
   - Engagement signals: likes/comments from brand-adjacent accounts
2. Document: API endpoints needed, rate limit budget per strategy, expected candidate volume
3. Assess: what percentage of untagged brand content can realistically be discovered?
4. This is the hardest problem — the AI itself is commodity, but feeding it is the bottleneck
5. Produce: candidate discovery strategy assessment

#### `third-party-ugc-platforms`

1. Research UGC capture platforms that could serve as intermediaries or architectural inspiration:
   - **Archive** (archive.com): 50K brands, $308/mo Pro, zero-signup, Story capture, Radar AI, Shopify integration
   - **Pixlee/Emplifi**: UGC collection + rights management, enterprise-focused
   - **TINT**: UGC aggregation across platforms, visual commerce
   - **Bazaarvoice**: UGC + ratings/reviews, Walmart/Sephora scale
   - **Dash Hudson**: Visual intelligence + UGC, AI content predictions
   - **Stackla** (now Nosto): UGC aggregation, rights management
2. For each: pricing, API availability, can Cheerful use it as a service vs building natively?
3. Focus on: which platforms expose APIs/webhooks that Cheerful could ingest UGC from?
4. Produce: third-party UGC platform survey with buy-vs-build assessment

#### `unofficial-scraping`

1. Research unofficial/scraping approaches for UGC monitoring:
   - Apify Instagram actors: can they monitor brand mentions? Content scraping vs. mention detection
   - instagrapi (private API library): direct inbox/feed access for mention detection
   - Browser automation: monitoring brand's tagged content page
2. Document: capabilities, reliability, TOS risks, rate limits
3. Note: Cheerful already uses Apify for Instagram profile scraping (public data) — different risk category than UGC monitoring
4. Produce: unofficial approach risk/capability assessment

### Wave 2: Internal Landscape — Cheerful's Current Architecture

Analyze Cheerful's existing content tracking and media infrastructure to understand what "adding UGC auto-capture" requires.

#### `current-post-tracking`

1. Read `../cheerful-reverse/analysis/synthesis/spec-data-model.md` — `creator_post` table and related schema
2. Read `../cheerful-reverse/analysis/synthesis/spec-workflows.md` — `PostTrackingWorkflow`
3. Read the actual codebase: `../../projects/cheerful/supabase/migrations/` for `creator_post` table definition
4. Document: what the current post tracking captures, how it's triggered (opt-in), what fields exist, how posts link to campaigns/creators
5. Identify: what's reusable for UGC auto-capture vs what needs new tables
6. Produce: current post tracking analysis with UGC extension opportunities

#### `current-ig-dm-overlap`

1. Read `../cheerful-ig-dm-spec/PROMPT.md` and `../cheerful-ig-dm-spec/frontier/aspects.md`
2. Read `../cheerful-ig-dm-reverse/analysis/meta-webhooks-realtime.md`
3. Document: the Messaging API webhook infrastructure being built for IG DMs
4. Map exactly which webhook events serve DMs vs Story mentions vs both
5. Identify: what Story capture gets "for free" from the IG DM integration vs what's new work
6. Produce: IG DM infrastructure overlap analysis with shared-component inventory

#### `current-media-storage`

1. Read the Cheerful codebase for media/asset storage patterns:
   - How are email attachments stored? (Supabase Storage?)
   - How are creator profile images stored?
   - Any existing media download/processing pipeline?
2. Document: storage patterns, bucket structure, access control, CDN configuration
3. Identify: what UGC media storage requires (images, videos, Stories — potentially large volume)
4. Produce: media storage analysis for UGC requirements

#### `current-campaign-ugc-link`

1. Read `../cheerful-reverse/analysis/synthesis/spec-data-model.md` — campaign/creator relationships
2. Document: how captured UGC would link back to campaigns and creators
3. Identify: attribution model — if a post mentions the brand but no specific campaign, how is it routed?
4. Note: brand-level vs campaign-level UGC (some content mentions the brand generally, not a specific campaign)
5. Produce: UGC attribution and campaign linking analysis

### Wave 3: Options Cross-Product

For each viable capture method from Wave 1, combined with architectural insights from Wave 2, document the full integration path.

#### `option-official-api-capture`

1. Read Wave 1 `graph-api-mentions-tags` + `webhooks-mentions` + `hashtag-monitoring` + `story-mention-capture` + all Wave 2 analyses
2. Design the full official API integration:
   - Webhook handler for `mentions` events (shared with IG DM webhook endpoint)
   - Story mention handler on Messaging API webhook (shared with IG DM)
   - Polling fallback for `mentioned_media`/`tags` endpoints
   - Hashtag monitoring cron (within 30-hashtag budget)
   - UGC storage pipeline: detect → download media → store → link to campaign/creator
   - New tables: `ugc_content`, `ugc_mention`, `ugc_hashtag_config`
3. Document: end-to-end architecture, effort estimate, constraints, what's shared with IG DM integration
4. Produce: complete option writeup

#### `option-ai-radar`

1. Read Wave 1 `ai-visual-detection` + `ai-audio-detection` + `ai-candidate-discovery` + all Wave 2 analyses
2. Design the full AI detection pipeline:
   - Candidate content discovery (how content enters the pipeline)
   - Visual analysis: frame extraction → logo/product detection → confidence scoring
   - Audio analysis: audio extraction → Whisper STT → brand mention matching
   - OCR: text extraction from images/video frames
   - Deduplication with official API captures (avoid double-counting tagged content)
   - Infrastructure: compute requirements, batch vs real-time, cost model
3. Document: accuracy expectations, compute cost, build-vs-buy for each AI component
4. Produce: complete option writeup

#### `option-third-party-service`

1. Read Wave 1 `third-party-ugc-platforms` + all Wave 2 analyses
2. Design the buy-not-build approach:
   - Use Archive or best-fit third-party as the UGC capture engine
   - Cheerful integrates via API/webhook to ingest captured content
   - Document: what the third-party handles vs what Cheerful handles
   - Cost analysis: third-party subscription vs engineering time to build
3. Document: vendor dependency trade-offs, data ownership, migration path if switching later
4. Produce: complete option writeup

#### `option-hybrid-layered`

1. Read all Wave 1 and Wave 2 analyses + all other Wave 3 options
2. Design the layered approach:
   - **Layer 1** (free, high-confidence): Official API tagged content + Story mentions — shared with IG DM infra
   - **Layer 2** (cheap, medium-confidence): Hashtag monitoring within API limits
   - **Layer 3** (expensive, lower-confidence): AI Radar for untagged detection — optional add-on
3. Document: each layer independently deployable, cumulative coverage estimates, incremental cost/effort
4. This is likely the most practical approach — document why
5. Produce: complete option writeup with layered deployment strategy

### Wave 4: Synthesis

Read ALL Wave 1, 2, and 3 analysis files before starting any Wave 4 aspect.

#### `synthesis-options-catalog`

1. Read every analysis file
2. Build the master options catalog:
   - **Capture method options**: each approach with capability matrix (what content types each catches)
   - **Coverage estimates**: tagged mentions (Layer 1), Stories (Layer 1), hashtags (Layer 2), untagged (Layer 3) — % of total UGC each captures
   - **Architecture options**: how each integrates with Cheerful (shared IG DM infra vs new infra)
   - **IG DM integration overlap**: what's shared, what's incremental
   - **Combination matrix**: which methods work together
   - **Constraint summary**: API rate limits, 30-hashtag cap, CDN URL expiry, Meta TOS
   - **Effort estimates**: per-layer effort, cumulative
   - **Cost analysis**: API costs (free), AI compute costs, third-party subscription costs
   - **Risk register**: per-option risks and mitigations
   - **Buy-vs-build recommendation framework**: when to use third-party vs build natively
3. Write to `analysis/synthesis/options-catalog.md`
4. Produce: the definitive UGC capture options reference document

## Rules

- Do ONE aspect per run, then exit.
- Check dependencies: all Wave 1 before Wave 2, all Wave 2 before Wave 3, all Wave 3 before Wave 4.
- Write findings in markdown with specifics — API endpoint URLs, payload examples, code references.
- When researching APIs, use `WebSearch` and `WebFetch` to get current documentation. APIs change frequently.
- When analyzing Cheerful code, reference specific file paths and line numbers.
- When you discover a new viable approach not covered by existing aspects, add it to the appropriate Wave.
- Keep analysis files focused. One aspect = one file.
- Do NOT modify any files in `../../projects/cheerful/`. The codebase is read-only.
- Do NOT pick a "recommended" option. Present all options neutrally with honest trade-offs.
- For third-party services, include pricing information where available.
- Every option must assess compatibility with Cheerful's existing Temporal workflow patterns.
- Explicitly document the overlap with the IG DM integration for every relevant option — this is the key architectural insight.
