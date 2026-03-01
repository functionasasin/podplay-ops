# Frontier — Cheerful Instagram UGC Auto-Capture

## Statistics

| Metric | Value |
|--------|-------|
| Total aspects | 18 |
| Analyzed | 18 |
| Pending | 0 |
| Convergence | 100% |

---

## Wave 1: External Landscape — Instagram UGC Capture Methods

- [x] `graph-api-mentions-tags` — Graph API `mentioned_media` + `tags` endpoints: permissions, fields, rate limits, content types covered
- [x] `webhooks-mentions` — Instagram webhook `mentions` field: real-time push, payload format, comparison with polling
- [x] `hashtag-monitoring` — Hashtag API: `ig_hashtag_search` + `recent_media`/`top_media`, 30-hashtag/7-day limit, viability at scale
- [x] `story-mention-capture` — Messaging API `story_mention` events: CDN URL expiry, media download, IG DM webhook overlap
- [x] `ai-visual-detection` — Logo/product detection (YOLO/DETR/CLIP), OCR, frame sampling, build-vs-buy (Cloud Vision, Rekognition, Roboflow)
- [x] `ai-audio-detection` — Whisper STT + brand mention NER/keyword matching: cost, accuracy, self-hosted vs API
- [x] `ai-candidate-discovery` — Candidate content pool: hashtag expansion, follower graphs, creator networks, coverage estimates
- [x] `third-party-ugc-platforms` — Archive, Pixlee/Emplifi, TINT, Bazaarvoice, Dash Hudson: pricing, APIs, buy-vs-build assessment
- [x] `unofficial-scraping` — Apify actors, instagrapi for UGC monitoring: capabilities, TOS risks, existing Cheerful Apify usage

## Wave 2: Internal Landscape — Cheerful's Current Architecture

- [x] `current-post-tracking` — `creator_post` table, `PostTrackingWorkflow`: current opt-in model, fields, reusable components
- [x] `current-ig-dm-overlap` — IG DM Messaging API webhook shared infrastructure: what Story capture gets for free vs new work
- [x] `current-media-storage` — Media/asset storage patterns (Supabase Storage), bucket structure, UGC volume requirements
- [x] `current-campaign-ugc-link` — UGC attribution: how captured content links to campaigns/creators, brand-level vs campaign-level

## Wave 3: Options Cross-Product

- [x] `option-official-api-capture` — Full official API integration: mentions webhook + tags polling + Story capture (shared IG DM infra)
- [x] `option-ai-radar` — AI detection pipeline: vision + audio + OCR + candidate discovery, compute cost model
- [x] `option-third-party-service` — Buy-not-build: use Archive or similar as managed UGC engine, API/webhook ingestion
- [x] `option-hybrid-layered` — Layered approach: Layer 1 (official API, free) + Layer 2 (hashtags) + Layer 3 (AI radar, optional)

## Wave 4: Synthesis

- [x] `synthesis-options-catalog` — Master catalog: capability matrix, coverage estimates, IG DM overlap, effort/cost, combination matrix, risk register
