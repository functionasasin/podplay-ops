# Option: Third-Party Service — Buy-Not-Build UGC Capture

**Aspect**: `option-third-party-service`
**Wave**: 3 — Options Cross-Product
**Date**: 2026-03-01
**Inputs**:
- `analysis/third-party-ugc-platforms.md` — Platform survey: Archive, Pixlee/Emplifi, TINT, Bazaarvoice, Dash Hudson, Stackla/Nosto
- `analysis/current-post-tracking.md` — Existing `creator_post` table, `PostTrackingWorkflow`, Apify pipeline
- `analysis/current-ig-dm-overlap.md` — Shared IG DM webhook infrastructure inventory
- `analysis/current-media-storage.md` — `post-media` Supabase Storage bucket, volume analysis
- `analysis/current-campaign-ugc-link.md` — Attribution algorithm, `ugc_content` schema, handle normalization
- `analysis/option-official-api-capture.md` — Official API option (comparison baseline)
- `analysis/option-ai-radar.md` — AI Radar option (comparison baseline)

---

## 1. Option Summary

**The Third-Party Service option** uses an external UGC capture platform — primarily Archive.com or Stackla/Nosto — as the underlying capture engine. Cheerful does not build its own Meta API integrations for UGC discovery; instead, it relies on the third-party platform to ingest brand-relevant content, then ingests that captured UGC into Cheerful via the platform's API or webhooks.

This option exists in three materially different variants with different cost, dependency, and data ownership profiles:

| Variant | Description | Feasibility |
|---------|-------------|-------------|
| **A: Archive as Primary Engine** | Cheerful uses Archive exclusively for all UGC capture. Every Cheerful brand gets an Archive workspace; Cheerful polls Archive's GraphQL API + receives webhooks. | Requires Enterprise reseller arrangement (no public program). Commercially problematic: Archive is a direct competitor. |
| **B: Additive Archive Integration** | Cheerful offers an optional "Connect Archive" feature. Brands that already pay for Archive can link it to Cheerful. Cheerful pulls captured UGC from Archive's API to enrich campaign tracking. Native capture (official API, option-official-api-capture) is the primary path. | Most viable near-term. Clean integration without wholesale dependency. |
| **C: Stackla/Nosto as Engine** | Use Stackla's `TILE_INGESTED` webhook + REST API as the capture layer instead of or alongside Archive. Less suited due to enterprise pricing, ToS history, and Nosto's eCommerce platform focus. | Viable architecturally, but commercially worse than Archive (no disclosed pricing, less focused product). |

**The core structural problem with all variants**: Every UGC capture platform is designed as **direct-to-brand SaaS** — the brand connects their Instagram account to the platform and pays per account. No platform currently offers a multi-tenant reseller API for platform builders. Cheerful as a SaaS platform needs to either:
- (A) Pay Archive wholesale on behalf of all brands (requires enterprise partnership Cheerful must negotiate)
- (B) Ask each brand to also pay Archive separately (ruins Cheerful's value proposition)
- (C) Offer additive integration only for brands that already pay Archive independently

None of these is as clean as building natively.

---

## 2. IG DM Integration Overlap

Third-party service integration has **minimal direct overlap** with the IG DM infrastructure. Since the third party handles all Meta API interaction, Cheerful's DM webhook endpoint is not involved in the capture path.

However, the IG DM integration's impact on this option is strategic rather than technical:

- **If IG DM integration is built**: Story mention capture comes for free on the shared webhook (see `current-ig-dm-overlap.md`) — eliminating Archive's primary competitive advantage (Story capture). The "unique value" of buying Archive diminishes significantly when Cheerful can capture Stories natively.
- **If IG DM integration is NOT built**: Archive's Story capture capability (which Cheerful cannot replicate without the Messaging API webhook) becomes much more valuable as a buy-not-build reason.

**The IG DM timing creates a decision trigger**: If the IG DM integration ships before the UGC decision is made, the native build path becomes more attractive and the buy path less justified. If UGC needs to ship before IG DM infrastructure exists, a third-party may bridge the gap.

For the additive integration variant (Variant B), the IG DM webhook is **irrelevant** to the integration design — Cheerful ingests from Archive's GraphQL API, not from Meta directly.

---

## 3. Platform Candidate Analysis

### 3.1 Archive — The Only Realistic Primary Engine Candidate

Archive is the only platform with a documented, programmatic API (GraphQL + webhooks) that Cheerful could realistically build on top of.

**Archive Partner API (`app.archive.com/api/v2`)**:

```
Endpoint: POST https://app.archive.com/api/v2
Auth: Authorization: Bearer {token} + WORKSPACE-ID header
Schema: GraphQL (single endpoint)
Pagination: Relay-style cursor (after / pageInfo.endCursor)
```

**Key queries Cheerful would use**:

```graphql
# Pull new UGC items from Archive
query GetNewItems($workspaceId: ID!, $after: String, $since: DateTime) {
  items(
    workspaceId: $workspaceId
    filter: {
      providers: [INSTAGRAM]
      types: [POST, REEL, STORY, CAROUSEL]
      capturedAfter: $since
    }
    first: 50
    after: $after
  ) {
    edges {
      node {
        id
        externalId          # Instagram post ID
        type                # POST | REEL | STORY | YOUTUBE_SHORT
        contentType         # IMAGE | VIDEO
        permalink
        caption
        postedAt
        capturedAt
        creator {
          handle
          displayName
          socialProfile { followersCount }
        }
        mediaContents {
          url
          contentType
        }
        transcriptions {    # Archive Radar AI output
          transcript
          detectedBrands
        }
        engagementHistory(last: 1) {
          likeCount
          viewCount
          commentCount
        }
        viralityScore
      }
    }
    pageInfo { endCursor hasNextPage }
  }
}
```

**Archive webhooks** (new item notification):
```
POST https://cheerful-api.fly.dev/webhooks/archive
Event: item_captured
Payload: { workspace_id, item_id, item_type, captured_at, creator_handle, ... }
```

**Ingest pipeline triggered by webhook**:
```
Archive webhook → Cheerful FastAPI handler → Temporal UGCArchiveIngestWorkflow
  → query Archive GraphQL for full item details
  → download media from Archive's CDN (or their asset URLs)
  → upsert ugc_content row
  → attribute_ugc_to_campaign_activity
```

**What Archive captures that Cheerful would receive**:
- Tagged feed posts (@mentions, photo-tags)
- Story @mentions (Archive downloads within 24h window)
- Hashtag-monitored posts
- Archive Radar: untagged visual/audio brand appearances (if Archive Radar is in the plan tier)

**API access gate**: Enterprise tier only. No self-service. No disclosed pricing. Estimated $1,000–5,000/month per workspace (each workspace = one brand account). Multi-brand requires either per-brand workspaces or a single enterprise account with multiple workspace slots.

---

### 3.2 Stackla/Nosto — Alternative Engine with Worse Fit

Stackla (now Nosto Visual UGC) has the most developer-accessible API of the non-Archive platforms. Its `TILE_INGESTED` webhook pattern is directly analogous to what Cheerful needs.

**Stackla `TILE_INGESTED` webhook**:
```
POST https://cheerful-api.fly.dev/webhooks/stackla
Headers: X-Stackla-Webhook-Signature: HMAC-SHA256 signature
Payload: {
  type: "TILE_INGESTED",
  tile: {
    id: "abc123",
    network: "instagram",
    image: "https://cdn.stackla.com/...",
    message: "Post caption",
    external_id: "IG_POST_ID",
    user: { handle: "creatorhandle", name: "Creator Name" },
    created_at: 1234567890
  }
}
```

**Stackla REST API** (content pull):
```
GET https://api.stackla.com/api/v2/stacks/{stack_id}/tiles?network=instagram&status=published
Authorization: OAuth2 token
```

**Stackla vs Archive comparison for Cheerful**:

| Attribute | Archive | Stackla/Nosto |
|-----------|---------|---------------|
| Instagram UGC capture quality | Best (market leader) | Good |
| Story capture | ✅ Yes | Uncertain (had ToS issues with Instagram) |
| AI radar (untagged detection) | ✅ Archive Radar | ❌ No equivalent |
| API quality | GraphQL, well-documented | REST, basic documentation |
| Webhook events | Yes | Yes (11 event types) |
| Pricing transparency | No (Enterprise) | No (demo required) |
| eCommerce focus | No (marketing focus) | Yes (Nosto is eCommerce CX) |
| ToS violation history | No documented issues | ⚠️ Was cut off from Instagram API previously |

Stackla's primary product is eCommerce personalization (Nosto acquired it for that); UGC capture is a secondary capability. The ToS violation history with Instagram is a reliability risk. Archive is the better-fit platform for Cheerful's use case in every relevant dimension.

---

## 4. Architecture: Variant B (Additive Archive Integration) — The Most Viable Path

Variant B (additive integration for brands already on Archive) is architecturally the cleanest and commercially the most defensible.

### 4.1 Brand Connection Flow

```
Brand Manager UI:
  Settings → Integrations → "Connect Archive"
  → Enter Archive API token + Workspace ID
  → Cheerful validates: GET Archive /api/v2?query={ workspace { id name } }
  → Store credentials in new table: archive_integration
  → Register Cheerful webhook URL with Archive
  → Show: "Archive integration active — UGC from Archive will appear in your campaigns"
```

### 4.2 New Table: `archive_integration`

```sql
CREATE TABLE archive_integration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Archive credentials
    archive_api_token TEXT NOT NULL,   -- Encrypted at rest
    archive_workspace_id TEXT NOT NULL,

    -- Integration state
    is_active BOOLEAN NOT NULL DEFAULT true,
    webhook_registered BOOLEAN NOT NULL DEFAULT false,
    last_synced_at TIMESTAMPTZ,
    last_sync_cursor TEXT,            -- GraphQL cursor for incremental pulls

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT unique_archive_per_user UNIQUE (user_id, archive_workspace_id)
);
```

**Note**: No sensitive brand IG credentials stored — the brand's Instagram is connected directly to Archive, not to Cheerful. Cheerful only needs Archive API credentials.

### 4.3 Ingest Architecture

Two ingest paths run in parallel:

```
Path 1: Archive Webhook (push, near-real-time)
  Archive → POST /webhooks/archive/ (new endpoint, ~10 lines)
  → Enqueue Temporal UGCArchiveIngestWorkflow(item_id, workspace_id)
  → Workflow: fetch full item from Archive GraphQL
  → Workflow: download media from Archive CDN URLs
  → Workflow: upsert ugc_content (capture_source='archive_integration')
  → Workflow: attribute_ugc_to_campaign_activity (REUSED from option-official-api-capture)

Path 2: Periodic Catch-Up Poll (pull, every 1 hour)
  UGCArchivePollWorkflow → query Archive GraphQL for items since last_sync_cursor
  → batch upsert ugc_content rows (skip existing by instagram_post_id dedup)
  → update last_synced_at, last_sync_cursor in archive_integration table
```

### 4.4 ugc_content Integration Points

Archive-ingested UGC writes to the **same `ugc_content` table** designed for native capture (see `option-official-api-capture.md`, `current-campaign-ugc-link.md`). The `capture_source` column accommodates this:

```sql
-- Add to capture_source enum:
'archive_integration'  -- Content ingested from Archive Partner API

-- The same attribution algorithm applies:
attribute_ugc_to_campaign_activity(
    creator_ig_handle=item.creator.handle,
    brand_user_id=brand.user_id,
    instagram_post_id=item.externalId
)
```

**Deduplication with native capture**: If Cheerful later builds native capture (option-official-api-capture) alongside the Archive integration, the same post would be captured twice — once by Archive's system, once by Cheerful's webhook. The `(user_ig_dm_account_id, instagram_post_id)` unique index in `ugc_content` prevents duplicate rows. The first capture wins; subsequent ones are ignored via `ON CONFLICT DO NOTHING`.

### 4.5 What Archive Handles vs What Cheerful Handles

| Responsibility | Archive | Cheerful |
|---------------|---------|---------|
| Meta API integration (OAuth, webhook subscription) | ✅ | ❌ |
| Brand IG account connection | ✅ | ❌ |
| App Review (Meta) | ✅ (already approved) | ❌ |
| @mention detection (feed posts) | ✅ | ❌ |
| Photo-tag detection | ✅ | ❌ |
| Story @mention capture + download | ✅ | ❌ |
| Hashtag monitoring | ✅ | ❌ |
| AI Radar (untagged visual/audio detection) | ✅ | ❌ |
| UGC storage (CDN/media hosting) | ✅ | Mirrors to Supabase Storage |
| Campaign attribution | ❌ | ✅ |
| Creator-campaign linking | ❌ | ✅ |
| Campaign performance tracking | ❌ | ✅ |
| Rights management workflow | ✅ (limited) | ❌ (future) |
| Brand UGC library UI | ✅ (Archive dashboard) | ✅ (Cheerful UI — additive) |
| Influencer CRM | ❌ | ✅ |
| DM/outreach automation | ❌ | ✅ |

**What Cheerful adds that Archive doesn't have**: Campaign attribution (linking UGC to specific campaigns), influencer CRM integration, DM automation, and campaign performance tracking. Cheerful positions as the campaign management layer on top of Archive's capture layer.

---

## 5. Cost Analysis

### 5.1 Variant A: Archive as Primary Engine (Wholesale)

Requires Cheerful to pay Archive on behalf of all brands — a wholesale reseller arrangement.

| Component | Cost | Basis |
|-----------|------|-------|
| Archive Enterprise per workspace | ~$1,000–5,000/month (estimated) | No public pricing; Enterprise tier only |
| At 100 brands | $100,000–500,000/month | Per-brand cost model |
| Engineering to build integration | ~2–3 engineer-weeks | GraphQL client, webhook handler, ingest workflow |
| Ongoing maintenance | Low | |

**This pricing model does not work for Cheerful**. At $1,000–5,000/month per brand, Archive would consume the entire margin on each Cheerful subscription and then some. Cheerful would need to charge brands $2,000–10,000/month just to break even on the Archive cost — far above market rate for influencer marketing platforms.

**Unless Archive offers a discounted platform/reseller tier** (not publicly documented), Variant A is commercially unviable.

### 5.2 Variant B: Additive Integration (Brands Already on Archive)

| Component | Cost | Basis |
|-----------|------|-------|
| Archive API calls (GraphQL) | $0 per call (rate limits TBD) | Archive Enterprise is subscription-based |
| Engineering to build integration | ~2–3 engineer-weeks | Webhook handler + GraphQL client + Temporal workflow |
| Storage for mirrored media | $0.021/GB (Supabase overage) | Same as native capture |
| Archive subscription (paid by brand) | $308/month (Pro) to Enterprise | Brand's own cost; not Cheerful's |

**Cheerful's cost for Variant B**: ~2–3 engineer-weeks of build time + negligible ongoing storage. The brand pays Archive separately. This is financially sustainable.

**Business model implication**: The integration is a feature that helps Archive customers get more value from Cheerful. It creates a partnership narrative ("Cheerful + Archive") rather than a dependency narrative. Cheerful does not resell Archive; it integrates with it.

### 5.3 Build vs. Buy for Native Capture

| Approach | Build Cost | Ongoing Cost | Coverage |
|----------|------------|-------------|---------|
| Build native (option-official-api-capture) | ~4–6 eng-weeks (w/ DM infra) | $10–200/month (storage) | 60–75% of UGC |
| Build native + AI Radar (option-ai-radar) | +8–16 eng-weeks | $50–500/month (compute + storage) | 85–95% of UGC |
| Archive as primary (Variant A) | ~2–3 eng-weeks (integration) | $100K+/month (at 100 brands) | ~100% Archive claims |
| Additive Archive integration (Variant B) | ~2–3 eng-weeks | Negligible | Additive (brands that already pay Archive) |

**Conclusion**: Native build is dramatically more cost-effective at multi-brand scale. The economics of Variant A are prohibitive. Variant B is complementary, not a replacement.

---

## 6. Vendor Dependency Trade-offs

### 6.1 Data Ownership

| Scenario | Who Owns the UGC Data? | Cheerful's Access If Vendor Leaves |
|----------|----------------------|------------------------------------|
| Archive as primary (Variant A) | Archive (media + metadata) | API access revoked; historical data inaccessible |
| Additive integration (Variant B) | Archive for capture; Cheerful mirrors metadata + media to Supabase Storage | Cheerful retains mirrored copy; no new captures after departure |
| Native build | Cheerful entirely | Full ownership; no dependency |

For Variant A, if Archive is acquired, raises prices, or changes its API, Cheerful loses its entire UGC capture capability. For Variant B, Cheerful retains what it has mirrored (metadata + downloaded media), but new captures stop.

**Mitigation for Variant B**: Mirror media to Supabase Storage at ingestion time (same as native capture). Store full `ugc_content` rows with all metadata. If the Archive integration is terminated, historical content remains in Cheerful; only net-new captures are affected.

### 6.2 Competitive Risk

Archive is a **direct competitor** in the creator marketing space. It manages influencer relationships, tracks UGC, and is building CRM features. Building Cheerful on top of Archive's infrastructure means:

- Archive can see all of Cheerful's brands and their UGC data (privacy concern)
- Archive can terminate the Enterprise API relationship to harm Cheerful
- Archive can raise prices knowing Cheerful is dependent
- Archive's own product roadmap may develop features that compete with Cheerful's differentiation

**This competitive risk is real and material for Variant A**. For Variant B (additive integration), the risk is lower — Archive has incentive to maintain the integration as it brings Cheerful brands into Archive's ecosystem (mutual benefit).

### 6.3 API Stability

Archive's GraphQL API is documented for Enterprise partners. It has presumably been stable for its partners (50K brands rely on Archive). However:
- No public SLA commitment
- No versioning documentation found publicly
- No SDK provided; Cheerful would build its own GraphQL client
- Rate limits not publicly disclosed (must ask `partnerships@archive.com`)

For comparison, Meta's official Graph API has clear versioning, deprecation windows, and documented rate limits — more predictable than an undisclosed Enterprise API.

### 6.4 Lock-in and Migration Path

**Migrating away from Archive (Variant A)** requires:
1. Build native capture infrastructure (4–6 eng-weeks assuming DM infra exists)
2. Coordinate cutover: native capture begins; Archive polling stops
3. Historical content: already mirrored in Supabase Storage; no re-migration needed
4. Missing content (if Archive captured things native cannot): accept gap

**Lock-in risk level for Variant A**: HIGH — migration requires significant engineering effort while maintaining an expensive Archive contract.
**Lock-in risk level for Variant B**: LOW — Archive is additive; migration means brands lose the Archive-sourced UGC enrichment but native Cheerful capture continues.

---

## 7. Temporal Workflow Compatibility

Third-party integration follows Cheerful's existing Temporal patterns cleanly.

### 7.1 New Workflows

```python
# File: apps/backend/src/temporal/workflow/ugc_archive_ingest_workflow.py

@workflow.defn
class UGCArchiveIngestWorkflow:
    """Webhook-triggered: ingest one Archive item into Cheerful ugc_content."""
    @workflow.run
    async def run(self, params: ArchiveIngestWorkflowInput) -> str | None:
        # Input: { archive_item_id, archive_workspace_id, user_id }

        # Step 1: Fetch full item from Archive GraphQL
        item = await workflow.execute_activity(
            fetch_archive_item_activity,
            params,
            start_to_close_timeout=timedelta(seconds=30),
        )

        # Step 2: Deduplicate against ugc_content
        existing = await workflow.execute_activity(
            check_ugc_exists_activity,
            {"user_ig_dm_account_id": params.user_ig_dm_account_id, "instagram_post_id": item.externalId},
            start_to_close_timeout=timedelta(seconds=10),
        )
        if existing:
            return existing

        # Step 3: Download media from Archive CDN → Supabase Storage
        storage_paths = await workflow.execute_activity(
            download_archive_media_activity,
            {"media_urls": item.mediaContents, ...},
            start_to_close_timeout=timedelta(minutes=5),
        )

        # Step 4: Upsert ugc_content row
        ugc_id = await workflow.execute_activity(
            upsert_ugc_content_activity,
            {...item, "capture_source": "archive_integration", "storage_paths": storage_paths},
            start_to_close_timeout=timedelta(seconds=30),
        )

        # Step 5: Campaign attribution (REUSED activity from native capture)
        await workflow.execute_activity(
            attribute_ugc_to_campaign_activity,
            {"ugc_id": ugc_id, "creator_ig_handle": item.creator.handle, ...},
            start_to_close_timeout=timedelta(minutes=1),
        )
        return ugc_id
```

```python
# File: apps/backend/src/temporal/workflow/ugc_archive_poll_workflow.py

@workflow.defn
class UGCArchivePollSchedulerWorkflow:
    """Perpetual cron: hourly catch-up poll from Archive GraphQL API."""
    @workflow.run
    async def run(self) -> None:
        await workflow.execute_child_workflow(UGCArchivePollWorkflow.run, ...)
        await workflow.sleep(timedelta(hours=1))
        workflow.continue_as_new()  # Prevent unbounded history
```

**Pattern**: Identical to `PostTrackingSchedulerWorkflow` — sleep + `continue_as_new`. Zero deviation from established Cheerful patterns.

### 7.2 New Activities

```python
# File: apps/backend/src/temporal/activity/ugc_archive_activity.py

@activity.defn
async def fetch_archive_item_activity(params: ArchiveItemFetchParams) -> ArchiveItem:
    """GraphQL query to Archive Partner API for a single item."""

@activity.defn
async def download_archive_media_activity(params: ArchiveMediaDownloadParams) -> list[str]:
    """Download Archive CDN URLs → Supabase Storage. Returns list of storage paths."""
    # Same pattern as download_and_store_media_sync (existing)
    # Archive CDN URLs may or may not expire; treat as ephemeral and download immediately

@activity.defn
async def poll_archive_items_activity(params: ArchivePollParams) -> ArchivePollResult:
    """Paginated GraphQL query for items captured since last_sync_cursor."""
```

The `attribute_ugc_to_campaign_activity` is **shared** with native capture — same attribution algorithm, same JSONB handle lookup, same multi-campaign fanout. This is the key code reuse point.

---

## 8. New FastAPI Endpoints

```
# Archive webhook receiver
POST /webhooks/archive/
  → verify Archive webhook signature (HMAC-SHA256 or shared secret; consult Archive docs)
  → background_tasks.add_task: route_archive_webhook(payload)

# Brand Archive integration setup
POST /integrations/archive       → create archive_integration row; validate API token
GET  /integrations/archive       → list connected Archive workspaces for this brand
DELETE /integrations/archive/{id} → disconnect Archive integration
```

**Webhook authentication**: Archive's webhook delivery mechanism requires validation. The exact mechanism (HMAC-SHA256, Bearer token, or IP allowlist) is not publicly documented — Enterprise partners need to contact `partnerships@archive.com`. Cheerful must implement whichever verification method Archive provides.

---

## 9. Capability Matrix

### 9.1 Content Type Coverage (Variant B: Additive Archive Integration)

Coverage depends on what the brand's Archive account captures. If on Archive Pro ($308/month), coverage includes everything except Archive Radar (AI untagged detection, which requires Enterprise).

| Content Type | Archive Pro | Archive Enterprise + Radar |
|-------------|-------------|--------------------------|
| Feed @mention (caption) | ✅ | ✅ |
| Photo-tagged feed post | ✅ | ✅ |
| Story @mention | ✅ | ✅ |
| Branded hashtag posts | ✅ | ✅ |
| Reel (caption @mention) | ✅ (if Archive captures) | ✅ |
| Reel photo-tag | ✅ (if Archive captures) | ✅ |
| Untagged visual appearance | ❌ | ✅ (Radar) |
| Untagged audio mention | ❌ | ✅ (Radar) |
| Private accounts | ❌ | ❌ |

### 9.2 What Cheerful Adds on Top

Archive provides content discovery and raw media. Cheerful provides:
- Campaign attribution (which campaign does this UGC belong to?)
- Creator-campaign linking (is this creator in a campaign?)
- Campaign performance reporting (engagement benchmarks, content ROI)
- UGC promotion workflow (add discovered creator to a campaign)
- Combined view: opt-in campaign posts (creator_post) + zero-signup UGC (ugc_content)

---

## 10. Effort Estimates

### 10.1 Variant B: Additive Archive Integration

| Component | Effort | Notes |
|-----------|--------|-------|
| `archive_integration` table migration | Tiny (0.5 day) | Simple credential store |
| Archive GraphQL client | Small (1–2 days) | HTTP client + GraphQL query builder; no SDK |
| Archive webhook handler (`POST /webhooks/archive/`) | Small (1 day) | Route + signature verification |
| `UGCArchiveIngestWorkflow` + activities | Small–Medium (3–4 days) | Reuses `attribute_ugc_to_campaign_activity` and `download_and_store_media` |
| `UGCArchivePollWorkflow` (hourly catch-up) | Small (1–2 days) | Standard scheduler pattern |
| UI: Archive integration connect/disconnect | Small (1–2 days) | Settings page component |
| `ugc_content` table (if not already built by native capture) | Small (1 day) | Shared with option-official-api-capture |
| Archive Enterprise negotiation | External (weeks–months) | Required for API access |

**Total engineering effort**: ~2–3 engineer-weeks (assumes `ugc_content` table already exists from native capture)

### 10.2 Variant A: Archive as Primary Engine

| Component | Effort | Notes |
|-----------|--------|-------|
| All Variant B components | ~2–3 weeks | |
| Enterprise partnership negotiation | External (1–3 months) | Required first; blocks all work |
| Multi-workspace account management | Medium (1–2 weeks) | Provision Archive workspace per Cheerful brand |
| Brand onboarding: Archive account connect | Medium (1 week) | UI for brand to connect their Archive workspace to Cheerful-managed account |
| Cost integration (tracking Archive costs per brand) | Medium (1 week) | For billing/margin tracking |

**Total engineering effort for Variant A**: ~4–6 engineer-weeks + months of business development.

---

## 11. Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Archive refuses Enterprise partnership / API access | High (for Variant A) | High | Cheerful is a direct competitor; Archive has strong incentive to refuse. Build natively. |
| Archive terminates API at will (Variant A) | Medium | Critical | Maintain native capture fallback as parallel track; never go single-vendor for core feature |
| Archive raises pricing after dependency established | High (for Variant A) | High | Negotiate multi-year rate lock; contractual API access guarantee |
| Archive is acquired (strategic competitor buys it) | Low–Medium | High (Variant A) | Maintain native build capability |
| Archive API changes break Cheerful integration | Low | Medium | Pin API version where supported; monitor Archive developer changelog |
| Brand's Archive workspace API rate limits | Unknown | Medium | Not documented publicly; must be negotiated in Enterprise contract |
| Archive data privacy: brand UGC visible to Archive | Always | Medium | Review Archive privacy policy and DPA; inform brands |
| `ugc_content` dedup conflict: Archive + native capture same post | Low–Medium | Low | `ON CONFLICT DO NOTHING` handles gracefully; first capture wins |
| Archive webhook validation not documented | Certain | Low | Email `partnerships@archive.com` before building; use shared secret fallback |
| Stackla/Nosto ToS issues with Instagram | Medium | High | Avoid Stackla as primary engine due to historical reliability risk |

---

## 12. Constraints Summary

| Constraint | Detail |
|-----------|--------|
| Archive API access | Enterprise tier only; no self-service API sign-up; no disclosed pricing |
| Competitive relationship | Archive is a direct competitor to Cheerful in creator marketing |
| No reseller programs | No white-label or reseller API documented for any UGC platform |
| Per-brand cost model | All platforms price per brand account, not per-platform (SaaS pricing mismatch) |
| Data ownership ambiguity | Primary media hosted by Archive; Cheerful mirrors but does not own original |
| Webhook auth unknown | Archive webhook signature scheme not publicly documented |
| Rate limits unknown | Archive Partner API rate limits not disclosed publicly |
| App Review | Not required (Archive handles Meta API; Cheerful needs no Meta permissions for Variant B) |

---

## 13. Comparison to Native Build Options

| Attribute | Native Official API (option-official-api-capture) | AI Radar (option-ai-radar) | Archive Primary (Variant A) | Archive Additive (Variant B) |
|-----------|--------------------------------------------------|--------------------------|---------------------------|------------------------------|
| Coverage (% of UGC) | 60–75% | +15–20% additive | ~100% (Archive claims) | Additive (brands on Archive) |
| Creator opt-in | No | No | No | No |
| Meta App Review needed | Yes (2 reviews) | No (uses existing) | No | No |
| Build cost | ~4–6 eng-weeks | +8–16 eng-weeks | ~2–3 eng-weeks | ~2–3 eng-weeks |
| Ongoing cost | $10–200/mo | $50–500/mo | $100K+/mo at scale | Negligible |
| IG DM overlap | High (shared infra) | Medium | None | None |
| Data ownership | Full (Cheerful) | Full (Cheerful) | Shared (Archive primary) | Partial (Cheerful mirrors) |
| Vendor dependency | None (Meta APIs) | None | Critical | Low (additive) |
| Competitive risk | None | None | High (Archive is competitor) | Low |
| Temporal compatibility | Full | Full | Full | Full |
| Commercially viable at scale | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes (additive only) |

---

## 14. The Recommended Decision Framework (For Reference — Not a Selection)

Based on this analysis, the decision factors that determine when third-party makes sense:

**Third-party (Variant B: additive) makes sense if**:
1. Cheerful brands already use Archive and want Cheerful to track campaign performance against Archive-captured UGC
2. UGC capture needs to ship within 4–6 weeks before the IG DM integration is complete (Archive covers the gap)
3. Cheerful wants to reduce Meta App Review dependency for an MVP

**Third-party (Variant A: primary engine) does NOT make sense if**:
1. Cheerful is building a multi-brand SaaS at any meaningful scale (per-brand Archive cost is prohibitive)
2. Archive refuses a reseller arrangement (likely given competitive relationship)
3. The IG DM integration is already planned (Story capture comes for free)

**Native build is preferred if**:
1. IG DM integration is on the roadmap (Story capture gets shared infrastructure)
2. Cheerful expects to grow to 50+ brands (Archive cost at scale outweighs build cost within ~12 months)
3. Data ownership and competitive independence matter more than speed-to-market

---

## 15. Key Findings

1. **No viable primary engine exists on commercially acceptable terms**. Archive is the only platform with a usable API, but it prices per brand account (~$1,000–5,000/month estimated for Enterprise), is a direct competitor, and has no documented reseller program. Variant A is commercially untenable at any meaningful scale.

2. **Additive Archive integration (Variant B) is the only commercially viable third-party path**. It requires brands to already have their own Archive subscription. Cheerful acts as a campaign management layer on top of Archive's capture, not as a reseller. Cost to Cheerful is 2–3 engineer-weeks + negligible ongoing costs.

3. **The IG DM integration eliminates Archive's primary UGC competitive advantage**. Archive's claim to fame is zero-signup Story capture — achieved via the Messaging API `story_mention` event. If Cheerful builds the IG DM integration, Story capture comes for free on the same webhook. The "buy vs. build" calculus tilts heavily toward build once the DM infrastructure exists.

4. **Stackla/Nosto is architecturally viable but commercially and strategically worse than Archive** for Cheerful's use case. The prior ToS violation with Instagram and Nosto's eCommerce-first focus make it a distant second choice if a third-party engine is required.

5. **The `attribute_ugc_to_campaign_activity` is the key shared component**. Regardless of capture source (Archive webhook, Meta webhook, polling), the same attribution algorithm applies: look up creator handle in `campaign_creator.social_media_handles`, fan out to matching campaigns, write `ugc_content` rows. Third-party integration reuses this directly.

6. **Third-party integration and native capture are not mutually exclusive**. Variant B can coexist with native capture — both write to the same `ugc_content` table with different `capture_source` values. Deduplication via `ON CONFLICT DO NOTHING` handles overlap. A brand could use both: native capture handles most content, Archive integration handles brands that happen to already pay for Archive (or for Archive Radar's untagged detection).

7. **If considering any third-party path, start with Variant B**. It's the fastest to build, cheapest to operate, and least risky. It also creates a proof-of-concept for how third-party data ingestion works in Cheerful's architecture — valuable if another platform or data source becomes relevant later.

---

## Sources

- `analysis/third-party-ugc-platforms.md` — Archive, Pixlee/Emplifi, TINT, Bazaarvoice, Dash Hudson, Stackla/Nosto surveys
- `analysis/current-post-tracking.md` — Existing `creator_post`, `PostTrackingWorkflow`, media_storage service
- `analysis/current-ig-dm-overlap.md` — Shared webhook infrastructure, `user_ig_dm_account` table spec
- `analysis/current-media-storage.md` — `post-media` bucket, `download_and_store_media`, volume analysis
- `analysis/current-campaign-ugc-link.md` — Attribution algorithm, `ugc_content` schema, `archive_integration` table concept
- `analysis/option-official-api-capture.md` — Native capture baseline for cost/coverage comparison
- `analysis/option-ai-radar.md` — AI Radar baseline for coverage comparison
