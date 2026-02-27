# Feature Category: Creator Discovery & Search

**Wave 1 Analysis — Feature Category Research**
**Date:** 2026-02-27

---

## Market Overview

Creator/influencer discovery is the **primary acquisition point** for every influencer marketing workflow. Brands spend 30–60 minutes per creator in manual research (Statista 2025); discovery platforms compress that to seconds. In 2026, 72% of brands identify discovery as their top influencer marketing challenge (Influencer Marketing Hub 2026 Report).

The market has bifurcated into two architectures:

1. **Pre-indexed database** — index millions of public profiles continuously, serve instant filtered results (Modash, HypeAuditor, CreatorIQ, Sprout Social Influencer)
2. **On-demand scraping** — fetch profiles at search time via platform APIs/scrapers (most SMB tools, Cheerful's current model)

### Database Scale by Platform

| Platform | Creator Database Size | Platforms Covered | Notes |
|----------|----------------------|-------------------|-------|
| Modash | 350M+ | Instagram, TikTok, YouTube | Every public profile >1K followers |
| HypeAuditor | 218.9M+ | Instagram, TikTok, YouTube, X, Twitch | 200+ data points per creator |
| Sprout Social Influencer | 250M+ | Multi-platform | Acquired Tagger 2023 |
| Brandwatch | 50M+ | Multi-platform | Via Klear acquisition |
| CreatorIQ | Undisclosed (enterprise) | Multi-platform | AI-powered recommendations |
| Favikon | Not disclosed | 9 platforms | LinkedIn-first, B2B strength |
| Heepsy | 11M+ | Instagram, YouTube, TikTok, Twitch | SMB-focused |

Sources:
- [Modash Influencer Discovery](https://www.modash.io/features/influencer-discovery)
- [HypeAuditor Discovery — 218.9M+ Creators](https://hypeauditor.com/discovery/)
- [Best Influencer Discovery Tools 2026 — InfluenceFlow](https://influenceflow.io/resources/best-influencer-discovery-tools-for-brands-complete-2026-guide/)
- [Top 12 Influencer Marketing Tools 2026 — Sprout Social](https://sproutsocial.com/insights/influencer-marketing-tools/)

---

## Market Feature Inventory

### 1. Search & Filtering

The baseline in 2026 is **30–40+ filters** combining creator-level and audience-level signals:

**Creator-level filters:**
- Platform (Instagram, TikTok, YouTube, LinkedIn, Twitch, X, Pinterest, Substack, Snapchat)
- Follower count ranges (nano, micro, mid, macro, mega)
- Engagement rate (min/max)
- Growth rate (follower growth %)
- Content category / niche (keyword-based or taxonomy)
- Location (country, city, region)
- Language
- Gender
- Posting frequency / recency
- Bio keywords
- Account age
- Estimated cost per post
- Verified account status

**Audience-level filters:**
- Audience age distribution
- Audience gender split
- Audience location (country, city)
- Audience language
- Audience interests
- Audience brand affinity (what brands audience follows)
- Fake follower % / authenticity score
- Audience quality score

HypeAuditor offers 35 audience quality metrics including engagement quality, suspicious follower %, comment authenticity, and growth anomaly detection — with 98.3% fraud detection accuracy across their 218.9M+ creator index (source: [HypeAuditor](https://hypeauditor.com/discovery/)).

Modash allows filtering by location, niche, audience demographics, engagement metrics, and lookalikes — all on 350M+ profiles with results in seconds, not minutes (source: [Modash](https://www.modash.io/features/influencer-discovery)).

### 2. AI-Powered Natural Language Search

In 2026, the top tier of platforms has moved beyond filter dropdowns to AI-driven intent matching:

- **Favikon**: Describe your ideal creator as a message; Favikon creates all filters automatically. Understands context and intent beyond keywords. (source: [Favikon](https://www.favikon.com/))
- **Modash**: Natural language query → AI analyzes bios, captions, and visuals to surface matching profiles in seconds. Can upload an image to find creators matching a visual aesthetic.
- **CreatorIQ**: AI-powered profile recommendations; learns from past successful campaigns to suggest creators.
- **Upfluence**: "Jaice" AI co-pilot finds creators matching a brand's style and values.

### 3. Fraud Detection & Authenticity Verification

Fake follower inflation grew 42% YoY through 2024 (insightIQ 2025). This is now a table-stakes feature:

- **HypeAuditor**: 98.3% accuracy, 35 audience quality metrics, AI-generated fraud reports per creator.
- **Favikon**: 5-dimension analysis: follower quality, engagement quality, AI content share, content quality, expertise. Instant authenticity flag.
- **Heepsy**: Fraud detection built into discovery; performance metrics including authenticity scores and follower growth trends.
- **Modash**: Machine learning pattern recognition — detects fake comments, purchased followers, engagement pods.

Source: [Best Influencer Discovery Platforms 2025 — insightIQ](https://www.insightiq.ai/blog/best-influencer-discovery-platforms)

### 4. Lookalike Discovery

All top platforms offer "find similar creators" seeded from a known profile. This is a primary discovery workflow:

- **HypeAuditor**: Lookalike search across 218.9M+ indexed profiles — returns results instantly.
- **Modash**: Lookalike from any discovered creator; connected to filtering for further refinement.
- **Traackr**: Lookalike plus trending topic/conversation participation detection — finds creators already talking about your brand's space.

### 5. Brand Affinity & Mention Detection

A premium feature emerging in 2025–2026: find creators who already organically engage with your brand:

- **Modash "Influential Fans"**: Discovers creators who already follow or engage with your brand's social accounts.
- **HypeAuditor**: Brand mention search — find creators who have mentioned your product/brand in their content.
- **Traackr**: Identifies influencers actively engaging with relevant topics, trends, and conversations across platforms.

These represent **extremely high-intent creators** — they're already fans, dramatically reducing cold outreach friction.

### 6. Multi-Platform Simultaneous Search

- **Favikon**: 9 platforms searched in one query (Instagram, YouTube, TikTok, LinkedIn, Twitter, Substack, Pinterest, Twitch, Snapchat).
- **HypeAuditor**: 5 platforms (Instagram, TikTok, YouTube, X, Twitch) — can compare creator cross-platform presence.
- **Sprout Social Influencer**: "Searching one platform isn't enough anymore" — multi-network simultaneous search is a listed differentiation.

### 7. Workflow Integration from Discovery

Best-in-class platforms connect discovery directly to outreach — no copy/paste between tools:

- **Modash**: Discovery → outreach pipeline built in; lists sync to campaign management.
- **Upfluence**: Discovery → campaign → Shopify attribution in one platform — no tool switching.
- **GRIN**: First-party creator pool + deep Shopify/Klaviyo integrations.

Source: [Top Influencer Search Tools 2026 — insense.pro](https://insense.pro/blog/influencer-search-tools)

---

## Cheerful Current State

Cheerful has a **live creator discovery feature** at `/search` (spec-webapp.md §creator discovery). Key components:

### What Exists

| Capability | Implementation | Notes |
|-----------|----------------|-------|
| AI-powered search UI | `/search` route, `SearchPageClient` component | Sidebar search icon animates during active search |
| Instagram keyword search | Apify `apify/instagram-scraper` actor — `{search: keyword, searchType: "user"}` | 20-60s per search, returns username, bio, follower count, category |
| Instagram lookalike | Custom Apify actor — `{inputs: [username], type: "similar_users"}` | 30-120s, "Find similar" from any result |
| YouTube discovery | 4-actor Apify pipeline: Channel Finder → Channel Scraper → Email Extractor | Complex pipeline, 60-180s |
| Email enrichment waterfall | Tier 1: bio scraper → Tier 2: Apify → Tier 3: profile scraping → Tier 4: Influencer Club API | `CreatorEnrichmentService`, spec-integrations.md §2.1 |
| Creator lists | `/lists` route, `creator_list` + `creator_list_item` tables | Saved segments; import into campaigns |
| Global creator database | `creator` table — cross-user shared database | Caches enrichment results; avoids re-scraping |
| Campaign wizard integration | Step 3: CSV / search / import | Discovery flows directly into campaign creation |
| `EnrichForCampaignWorkflow` | Temporal workflow — parallel enrichment post-campaign-launch | spec-workflows.md §EnrichForCampaignWorkflow |
| Enrichment overlay | `EnrichmentOverlay` — global overlay showing in-progress enrichment | Real-time feedback during search |

Sources: `spec-webapp.md` §Creator Discovery, `spec-integrations.md` §2.2–2.3, `spec-user-stories.md` US-2.5, US-2.6, US-3.1–3.5

### Architecture

Cheerful uses **on-demand Apify scraping** rather than a pre-indexed database. Every search triggers a live Apify actor run:
- Instagram keyword: `apify/instagram-scraper` — 20-60s
- Instagram lookalike: custom actor — 30-120s
- YouTube: 4-actor pipeline — 60-180s

The `creator` table functions as a **cache**, so re-searches for known creators skip Apify. But first searches are slow vs competitors with instant indexed results.

---

## Feature Gaps

These are things competitors offer that Cheerful currently lacks:

### Critical Gaps

| Gap | Competitor Benchmark | Impact |
|-----|---------------------|--------|
| **No TikTok discovery** | Modash, HypeAuditor, Favikon all have TikTok; it's the #1 growth platform | Customers running TikTok campaigns can't use Cheerful for discovery |
| **No pre-indexed database** | Modash: 350M+ instant; Cheerful: 20-120s per search | Discovery UX is 10–100x slower; Apify costs scale linearly with usage |
| **No fraud/authenticity scoring** | HypeAuditor: 98.3% fraud accuracy; 35 quality metrics | No way to vet creator authenticity before outreach |
| **No audience demographic filters** | All top competitors | Can't filter by who the audience is — biggest factor in campaign fit |
| **No engagement rate filter at search time** | All top competitors | Can't distinguish high-engagement micro from low-engagement macro |
| **No multi-platform simultaneous search** | Favikon (9 platforms), HypeAuditor (5 platforms) | Must run separate searches per platform |

### Significant Gaps

| Gap | Competitor Benchmark | Impact |
|-----|---------------------|--------|
| **No brand mention/affinity search** | Modash "Influential Fans", HypeAuditor, Traackr | Missing highest-intent creator signal |
| **No LinkedIn discovery** | Favikon, LinkedIn native | B2B influencer campaigns not supported |
| **No creator analytics at discovery** | HypeAuditor: 200+ data points per creator | Limited profile depth before adding to campaign |
| **No content style matching** | Modash: image upload for visual aesthetic matching | Premium discovery feature |
| **Limited filter set** | Competitors: 30–40 filters; Cheerful: keyword + platform only | Can't narrow pool precisely enough |
| **No credibility/authenticity score per creator** | HypeAuditor, Favikon, Heepsy | No signal quality for outreach decisions |

---

## Workflow Integration Potential

Creator discovery is the **gateway action** for every influencer campaign. It sits at the head of the entire workflow chain:

```
Discovery → Outreach → Response → Campaign Management → Analytics
```

Every decision made at discovery time (which creators, which platforms, which audience) cascades through all downstream work. Platforms that own discovery own the **workflow entry point** — and everything flows from there.

Cheerful's native discovery-to-campaign integration (search at `/search` → add to campaign wizard step 3 → automatic enrichment workflow) is already a strong pattern. The opportunity is **deepening the discovery layer** to make it the platform where teams spend serious time building creator rosters — not just a pass-through to Apify.

---

## Top 3 Hero Feature Candidates

### 1. Creator Intelligence Profiles (Pre-Indexed + Scored)

**What**: Build Cheerful's own incrementally-indexed creator database with quality scores, audience demographics, and fraud indicators — seeded from Apify results and enriched over time through campaign activity.

**Stickiness rationale**: The database **accumulates irreplaceable data** as teams run more campaigns. Engagement history, past collaboration data, response rates, and audience quality scores all compound. Switching platforms means losing this institutional knowledge. Score: HIGH (Data Accumulation dimension).

**Cheerful advantage**: Combine third-party enrichment data (HypeAuditor API, Apify) with first-party campaign outcome data (response rates, opt-ins, GMV) — no competitor has both signals.

### 2. TikTok Discovery + Multi-Platform Roster Builder

**What**: Add TikTok creator search (via TikTok Creator Marketplace API or Apify), then allow cross-platform simultaneous search with a unified creator roster view showing all their platforms side-by-side.

**Stickiness rationale**: Teams building creator rosters across platforms do this work **daily**. A multi-platform roster builder that persists across campaigns becomes the team's **creator intelligence hub** — referenced for every new campaign. Score: HIGH (Workflow Frequency + Team Dependency).

**Cheerful advantage**: Cheerful already owns the downstream outreach layer. Discovery + outreach in one place eliminates the #1 workflow break (exporting from a discovery tool, importing into an outreach tool).

### 3. Brand Affinity Discovery (Influential Fans + Brand Mentions)

**What**: Find Instagram/TikTok/YouTube creators who already organically mention your brand, follow your accounts, or show high audience overlap with your existing customer base.

**Stickiness rationale**: Once a brand connects their social accounts (or Shopify customer data) to power brand affinity discovery, that connection is **deeply embedded** in their workflow. Disconnecting means losing their highest-signal creator signal. Score: HIGH (Integration Depth + Switching Pain).

**Cheerful advantage**: Shopify integration already exists (spec-integrations.md §Shopify/GoAffPro). Customer purchase data → creator audience overlap is a natural extension — no competitor currently combines e-commerce purchase data with creator audience affinity for discovery.
