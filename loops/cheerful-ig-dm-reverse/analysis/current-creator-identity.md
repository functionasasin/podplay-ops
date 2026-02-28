# Analysis: Current Creator Identity & Instagram DM Sender Resolution

**Aspect**: `current-creator-identity`
**Wave**: 2 — Internal Landscape
**Date**: 2026-02-28

---

## 1. Overview

Cheerful uses a **two-layer creator identity model**: a global `creator` registry (platform-agnostic, keyed by handle) and a per-campaign `campaign_creator` CRM record (keyed by email for outreach). These two layers are decoupled — there is no foreign key between them.

For email outreach, the identity anchor is unambiguous: **email address** is both the sending target and the reply-from address, making it trivially matchable. For Instagram DMs, the sender arrives as an opaque **Instagram Scoped ID (IGSID)** — a platform-specific numeric identifier that requires an additional API call to resolve to a username. This document maps out the full identity chain and its gaps.

---

## 2. The Global `creator` Table

**File**: `projects/cheerful/apps/backend/src/models/database/creator.py`
**Spec**: `spec-data-model.md` §4.6

### Schema

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `platform` | text NOT NULL | `"instagram"`, `"youtube"`, `"tiktok"`, etc. |
| `handle` | text NOT NULL | Platform username (e.g., `"janedoe"` for `@janedoe`) |
| `email` | text nullable | Discovered via enrichment waterfall |
| `follower_count` | integer | |
| `is_verified` | boolean | |
| `location` | text | |
| `keywords` | text[] | Content categories |
| `profile_data` | jsonb | Platform-specific blob (bio, post count, URLs, etc.) |
| `snapshots` | jsonb[] | Historical profile snapshots |
| `profile_image_path` | text | Supabase Storage path |
| `source` | text | `"apify"`, `"enrichment"`, `"manual"`, etc. |

**Unique constraint**: `(platform, handle)` — one row per platform handle globally.

### Key Observations

1. **Not user-scoped**: All authenticated users share the same creator table. It's a global registry.
2. **Keyed by handle, not ID**: The natural key is the Instagram username string, not a platform-native numeric ID.
3. **No IGSID stored**: Cheerful does not store Instagram's numeric account ID (`IGSID` / `user.id` from the Graph API). The Apify scraper returns profile data but not the IGSID.
4. **Email is optional**: Email comes from the enrichment waterfall (Apify public email → bio link crawl → Influencer Club API). Many creators have no email in the table.
5. **Instagram profile data blob**: `profile_data` for Instagram creators includes `full_name`, `bio`, `profile_pic_url`, `category`, `bio_links`, `latest_posts`, etc. (see `creator_service.py:37–62`) — but NOT the IGSID.

### Instagram Creator Upsert Flow

`creator_service.py:17–74` — `save_creator_from_instagram()`:
- Input: `ApifyInstagramProfile` (from Apify scraper)
- Upsert key: `(platform="instagram", handle=profile.username)`
- Email: populated from `profile.public_email` or `profile.business_email`
- On conflict: updates follower count, profile data, appends snapshot — but **preserves existing email** if new value is None (`COALESCE` in upsert)

---

## 3. The `campaign_creator` CRM Record

**File**: `projects/cheerful/apps/backend/src/models/database/campaign_creator.py`
**Spec**: `spec-data-model.md` §4.5

### Schema (creator-identity-relevant columns)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `campaign_id` | uuid NOT NULL | FK → campaign(id) |
| `email` | text nullable | Primary outreach anchor |
| `name` | text nullable | Display name |
| `social_media_handles` | jsonb NOT NULL DEFAULT '[]' | `[{platform, handle, url}]` — LLM-extracted |
| `source_gmail_thread_id` | text | Origin thread — second matching signal |
| `role` | text | `creator`, `talent_manager`, `agency_staff`, `internal`, `unknown` |
| `enrichment_status` | text | `pending`, `enriching`, `enriched`, `no_email_found` |
| `confidence_score` | float | LLM extraction confidence 0.0–1.0 |
| `manually_verified` | boolean | |

### Key Observations

1. **No FK to `creator` table**: `campaign_creator` and `creator` are completely separate systems. A creator who exists in the global registry may have zero, one, or many `campaign_creator` rows (in different campaigns, or none at all).
2. **Handles stored as JSONB array**: `social_media_handles` is a JSONB column (`[{"platform": "instagram", "handle": "janedoe", "url": null}]`). There is no separate indexed column for the Instagram handle.
3. **Primary identity anchor is email**: The campaign outreach model assumes email is the reply medium. Creator matching prioritizes `email` (exact match) over everything else.
4. **No IGSID stored**: Same as the global registry — nowhere in Cheerful's schema is the IGSID stored.

---

## 4. How Creator Identity Resolution Works Today (Email Path)

**File**: `projects/cheerful/apps/backend/src/temporal/activity/extract_campaign_creator_activity.py`

When an inbound email arrives on a campaign thread, the `extract_campaign_creator_activity` Temporal activity runs and:

1. **LLM extracts creator signals** from the email thread: `email`, `name`, `social_media_handles[]`.
2. **Priority 1 — Exact email match**: `find_by_campaign_and_email(campaign_id, extracted_creator.email)` → direct DB lookup.
3. **Priority 2 — Thread + name match**: `find_by_campaign_and_source_thread(campaign_id, gmail_thread_id)` → checks if this thread already has a linked creator, then matches by name.
4. **Priority 3 — Signal candidates**: `find_candidates_by_signals(campaign_id, email, name, handles)` → builds OR conditions:
   - `lower(email) == lower(extracted_email)`
   - `lower(name) == lower(extracted_name)`
   - `cast(social_media_handles as text) ILIKE '%"handle": "janedoe"%'` (escaped) — **text scan of JSONB column, no index**
5. **Priority 4 — LLM matching**: If signal candidates found, pass them to Claude for fuzzy deduplication.

### Handle Matching Implementation

`repositories/campaign_creator.py:108`:
```python
cast(CampaignCreator.social_media_handles, String).ilike(
    f'%"handle": "{_h}"%',
    escape="\\",
)
```
This is a **full-table text scan** on the JSONB column cast to string. Works for small campaigns, but unindexed. For a DM-sender-to-campaign-creator lookup across potentially all campaigns, this would be problematic at scale.

---

## 5. Enrichment Waterfall

**File**: `projects/cheerful/apps/backend/src/services/creator/enrichment_service.py`

When a `campaign_creator` row lacks an email, `enrich_single_creator` runs:

1. **Cache check**: If `creator.email` already set → use it.
2. **Apify Instagram scraper** (`apify/instagram-profile-scraper`): Fetches `publicEmail` / `businessEmail` from Instagram profile.
3. **Bio link crawl**: Follows Linktree, Beacons, etc. links from the profile to scrape contact emails.
4. **Influencer Club API**: Paid third-party email database lookup.

This waterfall finds **email from Instagram handle** — the reverse of what DM integration needs (finding **Instagram handle from email**).

---

## 6. The Instagram DM Identity Problem

### 6.1 What a DM Webhook Delivers

A Meta webhook for `messages` on Instagram delivers:

```json
{
  "sender": { "id": "17841400000123456" },  // IGSID — opaque numeric
  "recipient": { "id": "123456789" },         // Your Business Account IG ID
  "timestamp": 1234567890,
  "message": { "mid": "...", "text": "Hello!" }
}
```

The `sender.id` is the **Instagram Scoped ID (IGSID)** — a numeric string, NOT a username. It is stable per user per business, but it is not the username that Cheerful's system uses as its identity key.

### 6.2 Resolving IGSID → Username

To get the username, you must call:
```
GET /{igsid}?fields=name,username&access_token={page_access_token}
```

Response:
```json
{
  "name": "Jane Doe",
  "username": "janedoe",
  "id": "17841400000123456"
}
```

This is a **synchronous Graph API call per DM event** — it adds latency and consumes rate limit quota. Rate limits for the Messaging API are 200 calls/hour per user (for Standard Access) or higher for Advanced Access.

### 6.3 Matching DM Sender → campaign_creator

Given the resolved username (`"janedoe"`), the matching chain would be:

**Option A: Via global `creator` registry**
```sql
SELECT * FROM creator WHERE platform = 'instagram' AND handle = 'janedoe';
```
→ Then need to find the corresponding `campaign_creator` row. But there is **no FK** between the two tables. Would need a separate lookup: find `campaign_creator` rows where `social_media_handles @> [{"platform":"instagram","handle":"janedoe"}]`.

**Option B: Direct JSONB search on `campaign_creator`**
```sql
SELECT * FROM campaign_creator
WHERE social_media_handles @> '[{"platform":"instagram","handle":"janedoe"}]'::jsonb;
```
→ Requires a GIN index on `social_media_handles` for this to be efficient. Currently no such index exists — only the `cast to text ILIKE` pattern (full scan).

**Option C: Via email (reverse enrichment)**
1. Resolve IGSID → username
2. Lookup `creator.email` where `(platform, handle) = ('instagram', 'janedoe')`
3. Match `campaign_creator.email = creator.email`

This works only if the creator has been enriched (has email in global registry) AND the same email is stored on `campaign_creator`.

### 6.4 The Outbound-First Problem

Cheerful's DM integration is **inbound-first** — captures creator replies to email outreach. But Instagram DM sender matching requires knowing which campaign the creator belongs to. Since Cheerful sends outreach by email (not DM), there is no "outbound DM thread ID" to match against. The match must be done by:

1. **Handle match**: Creator replied via DM using their Instagram account, and that handle appears in their `campaign_creator.social_media_handles`.
2. **User-campaign scope**: Narrow by the specific Cheerful user's campaigns (since `campaign_creator` is not global — it's scoped per user's campaigns).
3. **Ambiguity**: A creator could be in multiple campaigns for the same user. The DM could be a reply to any of them.

---

## 7. Existing Instagram Handle Storage

### In `campaign_creator.social_media_handles`
- **Populated by**: LLM extraction from email thread content (`extract_campaign_creator_activity`)
- **Format**: `[{"platform": "instagram", "handle": "janedoe", "url": null}]`
- **Coverage**: Only when the creator mentioned their Instagram handle in an email reply. NOT guaranteed — most email threads may not include this.
- **Index**: None — searched via `cast(... as text) ILIKE '%"handle": "janedoe"%'`

### In `creator.handle` (global registry)
- **Populated by**: Apify profile scraper (when creator was discovered via Instagram lookalike or profile search)
- **Coverage**: Only creators who were discovered via Instagram scraping. Email-outreach-only creators who were added via CSV upload may not have a corresponding `creator` row at all.

### In `campaign_creator` without handles
Many `campaign_creator` rows will have:
- `email` set (required for outreach)
- `social_media_handles = []` (empty array — handles not extracted)
- No corresponding `creator` row (if they were added via CSV, not via social discovery)

This means **a significant portion of campaign creators may have no Instagram handle stored anywhere** in the system.

---

## 8. Missing Data for DM Integration

| Needed | Currently Available | Gap |
|--------|--------------------|----|
| IGSID → username resolution | API call required | Not cached/stored |
| IGSID stored per creator | Not stored anywhere | New column needed |
| Instagram handle on `campaign_creator` | Partial (LLM-extracted if mentioned in email) | Not reliable coverage |
| GIN index on `social_media_handles` for handle lookup | Not present | Index migration needed |
| `creator.id` → `campaign_creator.id` linkage | No FK between tables | New join table or FK needed |
| Campaign disambiguation (which campaign the DM is for) | No mechanism | New logic needed |

---

## 9. Identity Resolution Design Options

### Option A: IGSID Cache Table (New)
Add an `ig_identity` table:
```sql
CREATE TABLE ig_identity (
  igsid text PRIMARY KEY,
  username text NOT NULL,
  name text,
  campaign_creator_id uuid REFERENCES campaign_creator(id),
  resolved_at timestamptz NOT NULL DEFAULT now()
);
```
- Resolve IGSID → username on first DM, cache for future DMs from same sender
- Lookup by IGSID → get `campaign_creator_id` directly

### Option B: Add `igsid` Column to `campaign_creator`
```sql
ALTER TABLE campaign_creator ADD COLUMN ig_igsid text;
CREATE INDEX ON campaign_creator(ig_igsid) WHERE ig_igsid IS NOT NULL;
```
- Populated at webhook time when a DM arrives and is matched
- Direct lookup: `WHERE ig_igsid = '17841400000123456'`

### Option C: Add GIN Index + JSONB Query on Existing Schema
```sql
CREATE INDEX idx_campaign_creator_handles_gin
ON campaign_creator USING GIN (social_media_handles);
```
- No schema change; uses existing `social_media_handles` column
- Query: `social_media_handles @> '[{"platform":"instagram","handle":"janedoe"}]'::jsonb`
- Limitation: only works if handle was already stored (coverage gap remains)

### Option D: Match Via Global `creator` Registry
1. Resolve IGSID → username
2. `SELECT * FROM creator WHERE platform='instagram' AND handle='janedoe'`
3. Use `creator.email` → find `campaign_creator.email`
- Works only if creator was enriched AND added to campaign with same email
- Fails for creators with no public email or added via different email

---

## 10. Campaign Disambiguation

For email, campaign association is done via `campaign_thread` (one-to-one thread → campaign). For DMs, there is no thread until the DM conversation starts. Disambiguation strategies:

| Strategy | Mechanism | Trade-offs |
|----------|-----------|-----------|
| Single active campaign per user | Assume DM belongs to most recent active campaign | Fails multi-campaign users |
| Handle pre-seeding | Before sending email outreach, require users to capture creator's IG handle | Extra friction in onboarding |
| User selects campaign | UI prompt when new DM arrives with unknown sender | Manual — breaks automation |
| Handle-to-campaign match | Match sender handle against all campaign_creators across all user's campaigns | May return multiple matches |
| Thread context | If creator references campaign content in DM text, LLM can infer campaign | Unreliable |

---

## 11. Summary: Abstraction Opportunities

| Observation | Implication for DM Integration |
|-------------|-------------------------------|
| Identity anchor is email for email path | DM path needs a new identity anchor: Instagram handle or IGSID |
| `social_media_handles` JSONB is partially populated | Can't reliably look up campaign_creator by handle alone |
| No IGSID stored anywhere | Must resolve IGSID → username at webhook time; caching important |
| `creator` ↔ `campaign_creator` decoupled | Either link them (FK) or add duplicate handle storage |
| Handle search is full-table scan | GIN index needed for any DM-at-scale scenario |
| Campaign disambiguation is unsolved | New logic required before DM can be routed to a campaign thread |
| Enrichment waterfall is IG handle → email | Reverse needed for DM path: email → IG handle lookup |
