# Mama Sita's Gifting Campaign — Hero User Journey

> **End-to-end case study**: Filipino food brand Mama Sita's gifts 50+ micro food creators (5K–50K followers) with Oyster Sauce + Sinigang Mix, acquiring UGC at ₱296/piece and 169K estimated impressions — all managed by a single brand rep through Cheerful's Context Engine (Slack bot), with zero frontend or client-comms overhead.

---

## Campaign At A Glance

| Parameter | Value |
|-----------|-------|
| Brand | Mama Sita's |
| Products | Oyster Sauce (350mL) + Sinigang Mix Sampalok (50g × 6 sachets) |
| Campaign type | Gifting — no payment, no promo codes |
| Primary channel | Instagram DM (outbound: manual; inbound: Cheerful-automated) |
| Creator profile | Micro food creators, 5K–50K followers, Filipino food content |
| Target count | 50+ opted-in creators |
| Primary user | Brand rep = developer (solo, self-serve, no agency) |
| Interface | Cheerful CE via Slack — no webapp interaction |
| Campaign duration | 49 days (Day 0: setup → Day 49: ROI report) |
| **Outcome** | 62 contacted → 32 opted-in (51.6%) → 25 posted (78.1%) → 67 total content pieces → ~169K estimated impressions → ₱296/UGC piece |

---

## Campaign Timeline

```
Day 0         Day 1         Day 2-4       Day 5-14      Day 15-17
│             │             │             │             │
Stage 1       Stage 3       Stage 4       Stage 5+6     Stage 7
Setup         Vetting       Outreach      Responses +   Ship
 + Stage 2                  (manual DMs)  Negotiation   Packages
 Discovery

Day 17→47     Day 0→49      Day 47-49
│             │             │
Stage 8       Stage 9       Stage 10
Content       UGC           ROI Report +
Tracking      Capture       Campaign Close
(daily cron)  (real-time)
```

---

## Day 0 — Campaign Setup (Stage 1)

**Duration**: ~90 minutes for a first-time user; ~30 minutes after initial Meta OAuth setup.

The brand rep opens Slack and begins a conversation with the Cheerful CE bot in `#mamasitas`. There is no webapp login, no wizard UI — it's a natural-language conversation with a bot that has full platform access.

### Step 1: Connect @mamasitasmanila to Cheerful

```
Brand rep → Slack:
"Let's start a new gifting campaign for Mama Sita's. First, connect our
Instagram account @mamasitasmanila."

CE → cheerful_connect_ig_account()
→ Returns Meta OAuth URL (expires in 10 minutes)

CE → Slack:
"Open this link to authorize Cheerful to use @mamasitasmanila's DMs:
[Meta OAuth URL]
This link expires in 10 minutes."

[Brand rep clicks link, grants permissions in browser]

CE → Slack:
"@mamasitasmanila connected successfully. Ready to send and receive
Instagram DMs. Webhook subscribed."
```

**What's happening under the hood**: Cheerful exchanges the OAuth code for a permanent Page Access Token, subscribes to Instagram webhook events (messages, message_echoes), and starts `IgDmInitialSyncWorkflow` to backfill any existing conversation history. The `user_ig_dm_account` record is live.

**⚠️ Prerequisite (one-time)**: Meta App Review must be approved before this works with non-test accounts. The brand rep submitted the App Review request before Day 0. Budget 2–7 business days. See Stage 1 spec for full Meta Developer setup checklist.

### Step 2: Create the products

```
Brand rep → Slack:
"Create two products: Mama Sita's Oyster Sauce 350mL, and Mama Sita's
Sinigang Mix Sampalok 50g (pack of 6)."

CE → cheerful_create_product("Mama Sita's Oyster Sauce 350mL", ...)
CE → cheerful_create_product("Mama Sita's Sinigang Mix Sampalok 50g (Pack of 6)", ...)

CE → Slack:
"Products created:
1. Mama Sita's Oyster Sauce 350mL (ID: prod-uuid-oyster)
2. Mama Sita's Sinigang Mix Sampalok 50g (Pack of 6) (ID: prod-uuid-sinigang)"
```

### Step 3: Create the gifting campaign

```
Brand rep → Slack:
"Create a gifting campaign: 'Mama Sita's Micro Creator Gifting — Q1 2026'.
Use both products. IG account: @mamasitasmanila. Goal: gift Filipino food
creators, collect at least 1 UGC post per creator."

CE → cheerful_create_campaign(
  name="Mama Sita's Micro Creator Gifting — Q1 2026",
  campaign_type="gifting",
  body_template="Hi {name}! 👋 I'm with Mama Sita's — we make authentic
    Filipino sauces and mixes used by families across the Philippines for
    generations. We love your food content and would love to send you a
    gift pack: our Oyster Sauce (350mL) + Sinigang Mix (pack of 6 sachets)
    to try in your kitchen. No strings attached — just hoping you enjoy them!
    If you'd like the gift pack, just reply here with your shipping address
    and we'll send it right over. 🇵🇭",
  product_id="prod-uuid-oyster",
  product_ids=["prod-uuid-sinigang"],
  senders=[{"ig_dm_account_id": "uuid-ig-acct"}],
  goal_for_llm="Gift Filipino food creators (5K-50K followers) with Oyster
    Sauce + Sinigang Mix. Collect UGC: at least 1 post per creator.",
  rules_for_llm="Keep tone warm and Filipino-friendly. Don't promise payment.",
  slack_channel_id="C0MAMASITAS"
)

CE → Slack:
"Campaign 'Mama Sita's Micro Creator Gifting — Q1 2026' created (ID:
campaign-uuid-mamasitas). Status: draft. Ready for creator discovery."
```

**Day 0 outcome**: The campaign infrastructure is live. Three CE calls, three minutes of interaction, one browser OAuth step. The campaign ID `campaign-uuid-mamasitas` becomes the anchor for all subsequent operations.

---

## Day 0 — Creator Discovery (Stage 2)

**Duration**: ~2 hours of CE interactions + overnight enrichment processing.

### Building the discovery pool

The brand rep uses the CE to run four targeted keyword searches and two similar-creator searches against the Influencer Club (IC) database to surface micro food creators in the Filipino food niche.

```
Brand rep → Slack:
"Search for Filipino food creators with 5K-50K followers on Instagram.
Keywords: Filipino food, Pinoy recipes, home cooking, Filipino recipes."

CE → cheerful_search_creators_by_keyword("Filipino food", platform="instagram",
  min_followers=5000, max_followers=50000, limit=30)
→ 30 results: @filipinafoodie (12.4K), @sabawculture (22K), ...

CE → cheerful_search_creators_by_keyword("Pinoy recipes", ...)
→ 30 results with ~50% overlap removed by CE deduplication

CE → cheerful_search_creators_by_keyword("home cooking Philippines", ...)
→ 30 results

CE → cheerful_search_creators_by_keyword("Filipino recipes sinigang adobo", ...)
→ 30 results

CE → cheerful_search_similar_creators(seed_ig_handle="@panlasangpinoy",
  min_followers=5000, max_followers=50000)
→ 20 results: creators similar to the flagship Filipino recipe account

CE → cheerful_search_similar_creators(seed_ig_handle="@mga.simpleng.lutuin", ...)
→ 20 results
```

**Discovery pool**: ~112 unique creator profiles across all 6 searches (after deduplication). CE creates a creator list and stores it as "Mama Sita's Discovery Pool" for Stage 3 vetting.

### ✨ Wow moment #1: IC integration compresses a 2-week manual research task to minutes

What would take a freelance VA 2 weeks of spreadsheet-based Instagram research — scrolling hashtags, checking follower counts, compiling handles — is done in minutes through CE. The brand rep has 112 qualified candidates before lunch.

---

## Day 1 — Creator Vetting (Stage 3)

**Duration**: ~3 hours active (batch enrichment runs async while brand rep does other work).

### The vetting funnel: 112 → 62 approved creators

The brand rep applies four passes to filter the discovery pool:

**Pass 1 — Bulk Apify enrichment**: Cheerful calls the Apify Instagram Profile Scraper for all 112 creator profiles to get verified follower counts, average engagement rates, and recent post thumbnails.

```
CE → cheerful_start_creator_enrichment(creator_ids=[all 112 UUIDs])
→ "Enrichment started for 112 creators. Estimated completion: 8-12 minutes."

[8 minutes later — async, brand rep does other work]

CE → cheerful_list_creator_enrichments(status="completed")
→ 112 profiles enriched with live follower counts and engagement rates
```

**Pass 2 — Engagement rate filter (≥3%)**: CE filters the list. 112 → ~87 creators at or above the 3% ER threshold. Low-ER accounts (often purchased followers) are removed.

**Pass 3 — Content quality check**: Brand rep reviews the 87 remaining creators via `cheerful_get_creator_profile`, scanning for food content relevance, authentic Filipino content, recent posting activity (last post within 30 days). ~15 accounts filtered: general lifestyle creators whose food content is incidental, inactive accounts, and accounts with brand conflicts.

**Pass 4 — Activity check**: 72 remaining. Further filter for recency: creators who haven't posted in 30+ days dropped. Final approved pool: **62 creators**.

```
Brand rep → Slack:
"Create a shortlist campaign list from the 62 approved creators and
add them all to the Mama Sita's campaign."

CE → cheerful_create_creator_list("Mama Sita's Approved Q1 2026")
CE → cheerful_add_list_creators_to_campaign(
  list_id="list-uuid-mamasitas",
  campaign_id="campaign-uuid-mamasitas"
)
→ "62 creators added to campaign. Gifting status: CONTACTED for all."
```

**The 62 approved creators include**:
- @filipinafoodie — 12.4K followers, 3.9% ER, recipe-focused
- @sabawculture — 22K followers, 4.2% ER, Filipino comfort food
- @kutsaranimelinda — 8.7K followers, 3.8% ER, lutong bahay content
- @lutongpinoyni_grace — 18K followers, 3.2% ER, adobo + sinigang content
- @panlasangpinoylife — 31K followers, 2.9% ER, Filipino cooking inspiration
- ... 57 more creators across the Filipino food niche

---

## Days 2–4 — IG DM Outreach (Stage 4)

**Duration**: 4 days × 15-20 manual DM sends/day.

### ⚠️ The cold outbound wall — the one place Cheerful steps aside

This is the most important architectural fact of this campaign: **Meta's Messaging API does not support cold outbound DMs**. The API only allows replies within a 24-hour window after a creator messages the brand first. For the initial outreach to 62 creators who have never DMed @mamasitasmanila, there is no API path — this send must be done manually from the Instagram app.

**Cheerful's role shifts**: Instead of sending, Cheerful prepares a complete personalized send queue and positions the brand rep for immediate reply capture the moment creators start responding.

### Phase A: Generate the send queue

```
Brand rep → Slack:
"Generate my outreach message list for all 62 creators in the Mama
Sita's campaign. I'll send manually from Instagram."

CE → [iterates cheerful_get_campaign_creator × 62, resolves {name} merge tag]

CE → Slack (formatted message queue):
"OUTREACH QUEUE — 62 creators (send 15-20/day over 4 days):

Day 1 sends (suggested order — highest ER first):
1. @sabawculture → 'Hi Sab! 👋 I'm with Mama Sita's...'
2. @filipinafoodie → 'Hi Maria! 👋 I'm with Mama Sita's...'
3. @kutsaranimelinda → 'Hi Melinda! 👋 I'm with Mama Sita's...'
...
[62 entries with personalized name + full message text]"
```

### Phase B: Manual send execution

The brand rep opens `instagram.com/direct`, searches each creator handle from the queue, pastes the personalized message, sends. Repeat 15-20 times per session across 4 days to complete the 62 outreach DMs.

**Practical notes**:
- Some DMs go to creator "Message Requests" (not yet followers of @mamasitasmanila) — creators must accept before conversation is active
- Safe rate: 15-20/day to avoid Instagram manual-send rate limits
- Blocked accounts (DM restricted): skip, mark as unable to reach

### Phase C: Webhook capture begins immediately

The moment any creator accepts a DM request and replies, the Meta webhook fires and Cheerful's automated pipeline engages.

```
Creator @filipinafoodie replies (Day 2, 6 hours after first send):
"Hi! I'd love to try these! Here's my address: [address]"

Meta → POST /webhooks/instagram/ (messages event)
    ↓
Cheerful: IgDmIngestWorkflow auto-triggered
  1. Parse webhook → extract mid, IGSID, text, timestamp
  2. Store in ig_dm_message table
  3. Resolve creator: IGSID → @filipinafoodie → campaign creator record
  4. Set status=WAITING_FOR_DRAFT_REVIEW, window_expires_at = now() + 24h
  5. Generate AI draft reply (using campaign goal_for_llm + rules_for_llm)

Cheerful → Slack #mamasitas:
"📩 New DM from @filipinafoodie (Mama Sita's Gifting Q1 2026):
 'Hi! I'd love to try these! Here's my address: [address]'
 Reply window: open until 2026-03-18T14:23:00Z (23h 59m)
 AI draft: ready for review"
```

**Day 2–4 outcome**: 62 outreach DMs sent manually. Webhook pipeline confirmed working. First responses arriving and being auto-captured in Cheerful.

---

## Days 2–10 — Response Management (Stage 5)

**Duration**: Ongoing — the brand rep monitors Slack and reviews AI drafts as they arrive.

### ✨ Wow moment #2: AI drafts in Mama Sita's brand voice

Every creator reply triggers an AI-generated draft response. The draft system uses the campaign's `goal_for_llm` and `rules_for_llm` to write in Mama Sita's voice — warm, Filipino-friendly, never promising payment — and routes it to Slack for brand rep approval.

```
Brand rep → Slack:
"Show me new DMs in the Mama Sita's campaign."

CE → cheerful_list_ig_dm_threads(
  campaign_id="campaign-uuid-mamasitas",
  status="PENDING",
  window_open=true
)

CE → Slack:
"7 active threads (24h window open):

1. @filipinafoodie — 'Hi! I'd love to try these!' — 23h 59m remaining
   [AI draft ready]
2. @sabawculture — 'Sounds great! Can I have both products?' — 22h 14m
   [AI draft ready]
3. @kutsaranimelinda — 'What hashtags should I use?' — 20h 01m
   [AI draft ready]
..."

Brand rep → Slack:
"Show me the draft for @filipinafoodie."

CE → cheerful_get_ig_dm_thread(thread_id="17841234567890")

CE → Slack:
"Thread: @filipinafoodie
Last message: 'Hi! I'd love to try these! Here's my address: 123 Kalayaan Ave, Quezon City 1100'

AI Draft (not sent):
'Hi Maria! Great news! We're so happy to send you a Mama Sita's gift pack.
I'll get the Oyster Sauce (350mL) + Sinigang Mix (pack of 6 sachets) out to
you shortly. Your address is confirmed. Thank you for supporting authentic
Filipino cooking! 🇵🇭 Looking forward to seeing what you create!

— Mama Sita's Team'

Reply window: 23h 59m remaining
[Approve / Edit / Reject]"

Brand rep → Slack: "Approve"

CE → cheerful_approve_ig_dm_draft(thread_id="17841234567890")
→ IgDmSendReplyWorkflow sends via Meta API
→ @filipinafoodie receives reply within 2 seconds
→ gifting_status: CONTACTED → READY_TO_SHIP
```

### The 24-hour window — what happens at the edge

When a thread's window drops below 2 hours, `IgDmReconciliationWorkflow` (runs every 30 minutes) fires an alert:

```
Cheerful → Slack #mamasitas:
"⚠️ WINDOW EXPIRING: @pinoyrecipes2026 reply window closes in 1h 47m.
 Open thread to respond before it expires."
```

If the window expires before the brand rep replies, the conversation is frozen — no further API sends until the creator messages again. This is a structural Instagram API constraint with no workaround.

### Response categorization by Day 5

After the 5-day initial outreach window:
- **32 creators**: replied with shipping address, status → READY_TO_SHIP
- **10 creators**: replied with questions (handled via AI drafts in Stage 6)
- **20 creators**: no response after initial DM + Day 5 follow-up

---

## Days 3–14 — Negotiation & Address Collection (Stage 6)

**Duration**: Concurrent with Stage 5 — ongoing until all READY_TO_SHIP creators confirmed.

### Content brief delivery via AI

The AI draft system doesn't just handle logistics — it communicates the content ask. When a creator agrees to the gift, the AI draft system includes content requirements in the confirmation reply:

```
AI Draft (for @sabawculture after accepting the gift offer):
"Hi Sab! Excellent! We're sending your gift pack: Mama Sita's Oyster Sauce
(350mL) + Sinigang Mix (pack of 6 sachets).

When the package arrives, we'd love to see what you cook! No pressure on
format — a feed post, Reel, or Story featuring the products would mean the
world to us. If you'd like to tag us: @mamasitasmanila + #MamaSitas.

What's the best shipping address for you? 🙏"
```

### The three conversation patterns

**Pattern A — One-leg (address in first reply, ~20 creators)**:
Creator provides address immediately. One reply from brand rep (confirmation + content brief). Total DM exchange: 2 messages.

**Pattern B — Two-leg (~15 creators)**:
Creator accepts but doesn't give address. Brand rep asks (via AI draft). Creator replies with address. Total: 4 messages across 2 24h windows.

**Pattern C — Multi-leg (~5 creators)**:
Creator asks about content requirements, exclusivity, or product details before committing. 3+ exchange rounds. HUMAN_AGENT tag (when built) would extend window to 7 days — without it, each leg must fit within 24 hours of the creator's last message.

### Address storage

The 32 opted-in creators' addresses are stored in Cheerful via `cheerful_update_campaign_creator` (gifting_address field) and gifting_status is updated to READY_TO_SHIP.

```
CE → cheerful_update_campaign_creator(
  campaign_id="campaign-uuid-mamasitas",
  creator_id="creator-uuid-filipinafoodie",
  gifting_address={
    "name": "Maria Santos",
    "line1": "123 Kalayaan Ave",
    "city": "Quezon City",
    "province": "NCR",
    "postal_code": "1100",
    "country": "PH"
  },
  gifting_status="READY_TO_SHIP"
)
```

**Day 14 outcome**: 32 creators at READY_TO_SHIP status with confirmed addresses and content brief delivered. Google Sheets backup maintained as fallback for the 8 creators whose addresses were collected via DM text (pre-Gap 31 workaround).

---

## Day 15–17 — Shipping Export (Stage 7)

**Duration**: ~1 hour for manifest pull + logistics coordination.

### ✨ Wow moment #3: One CE call generates the complete shipping manifest

```
Brand rep → Slack:
"Pull the shipping list for Mama Sita's — all READY_TO_SHIP creators
with addresses."

CE → cheerful_list_campaign_recipients(
  campaign_id="campaign-uuid-mamasitas",
  status=["READY_TO_SHIP"],
  has_address=true,
  include_all_contacts=true,
  limit=100
)

CE → Slack (formatted table):
"Shipping manifest — 32 creators:

| # | Creator         | Address                              | Bundle           |
|---|-----------------|--------------------------------------|------------------|
| 1 | Maria Santos    | 123 Kalayaan Ave, Quezon City 1100   | Oyster Sauce + Sinigang Mix 6-pk |
| 2 | Sab Cruz        | 456 Katipunan Rd, Marikina 1801      | Oyster Sauce + Sinigang Mix 6-pk |
| 3 | Melinda Cruz    | 789 Roxas Blvd, Pasay 1300           | Oyster Sauce + Sinigang Mix 6-pk |
...
[32 rows total]

Metro Manila: 21 creators (J&T Express, ₱150/package)
Provincial: 11 creators (LBC, ₱220/package)
Total shipping cost: ₱5,540"
```

Brand rep copies the manifest to the Mama Sita's fulfilment team (or into a Google Sheet for the warehouse). Packages are dispatched on Day 17.

After dispatch:

```
Brand rep → Slack:
"Mark all 32 READY_TO_SHIP creators as ORDERED (dispatched today)."

CE → [32 sequential cheerful_update_campaign_creator calls or bulk variant]
→ All 32 creators: READY_TO_SHIP → ORDERED
```

**Note**: Shipping notifications to creators via DM are blocked for 27 of 32 creators whose 24h windows have long since closed. A manual notification via Instagram app to the top 5 highest-value creators is worth the extra effort; the rest receive no dispatch notification (common for gifting campaigns).

**Day 17 outcome**: 32 bundles in transit. Cheerful's gifting pipeline shows 32 ORDERED, 20 OPTED_OUT, 10 CONTACTED (no response).

---

## Day 17–47 — Content Tracking (Stage 8)

**Duration**: Passive, automated — no brand rep action required for the first 30 days.

### Cheerful's PostTrackingWorkflow runs silently every day

The `PostTrackingSchedulerWorkflow` (Temporal cron, runs daily) identifies all creators in active campaigns with participating statuses and fires `PostTrackingWorkflow` for each:

1. Calls Apify Instagram Profile Scraper for the creator's profile
2. Compares each post caption to known product names ("oyster sauce", "sinigang mix", "mama sita")
3. If caption matches: stores post in `creator_post` table with engagement metrics
4. If caption doesn't match: runs Claude Sonnet vision analysis on thumbnail to detect product presence
5. Updates `campaign_creator.post_count` with confirmed product posts

**The brand rep never manually checks creator profiles.** Cheerful does it daily for all 32 opted-in creators.

### Monitoring content roll-in

Starting around Day 22 (when Metro Manila packages arrive), creators start posting:

```
Brand rep → Slack (Day 25):
"How many Mama Sita's creators have posted so far?"

CE → cheerful_list_campaign_recipients(
  campaign_id="campaign-uuid-mamasitas",
  status=["ORDERED"],
  sort_by="post_count",
  sort_dir="desc",
  limit=100
)

CE → Slack:
"Content tracking — Day 25:

Posted (post_count > 0):  12 creators  [38% of 32 shipped]
Not yet posted:           20 creators

Top posters so far:
@sabawculture — 2 posts [Oyster Sauce stir-fry + Sinigang Reel]
@filipinafoodie — 1 post [Sinigang Recipe Reel — 8.4K views]
@kutsaranimelinda — 1 post [Oyster Sauce adobo recipe]
...
PostTrackingWorkflow last ran: 4 hours ago"
```

### ✨ Wow moment #4: Product detection via AI vision

When @lutongpinoyni_grace posts a recipe video with the caption "Simple weeknight sinigang 🍲" — no explicit brand mention — Cheerful's Claude Sonnet vision analysis sees the Mama Sita's orange Sinigang Mix sachet on the counter in the thumbnail and flags it as a product post. No hashtag required for detection.

---

## Day 0–49 (concurrent) — UGC Capture (Stage 9)

**Duration**: Always-on, from campaign Day 0 to campaign close.

### Two parallel capture systems

**Layer 1A — Story @mentions (highest value, time-critical)**:
When a creator posts an Instagram Story mentioning @mamasitasmanila, the Instagram Messaging API fires a `story_mention` event to Cheerful's webhook (same endpoint as DM webhooks). Cheerful's `StoryMentionWorkflow` downloads the Story media file within minutes — before Instagram's CDN purges it after 24 hours.

```
Day 28: @filipinafoodie posts Story: "Cooking sinigang tonight with this! 🙌"
  [photo of Mama Sita's Sinigang Mix sachet being poured into pot]
  [tags @mamasitasmanila]

Meta → webhook story_mention event
Cheerful → StoryMentionWorkflow:
  1. Download story media (image/video) to storage
  2. Create ugc_content record: { capture_source: "story_mention",
     creator_ig_handle: "filipinafoodie", posted_at: now, media_url: "stored" }

Cheerful → Slack:
"📸 Story mention captured from @filipinafoodie (Mama Sita's Gifting Q1 2026).
 Media saved before 24h expiry. UGC library: 6 Stories so far."
```

**Layer 1B — Feed @mentions (real-time)**:
Graph API webhook fires when any creator posts a feed post or Reel mentioning @mamasitasmanila. Even non-campaign creators who discover the products organically are captured.

**Layer 2 — Hashtag monitoring**:
`HashtagMonitoringWorkflow` queries Instagram hashtags `#MamaSitas`, `#SinigangRecipe`, `#LutongPinoy` every 15 minutes, capturing organic creator posts from people outside the gifting campaign. These are unpaid brand advocates.

**Expected UGC library at Day 49** (with all Stage 9 layers built):
- 9 Stories (captured before expiry)
- 18 feed @mentions via webhook
- 10 photo-tagged posts via polling
- 10 organic hashtag posts (non-campaign creators)
- **Total: 47 UGC pieces** in addition to Stage 8's 48 opted-in creator posts

---

## Day 49 — ROI Report (Stage 10)

**Duration**: ~15-20 minutes to run CE calls and compile the report.

The campaign's 30-day posting window has closed for Metro Manila creators (received packages Day 22-24, 30-day window ended Day 52-54). Provincial creators have a few more days. This is the natural reporting point.

### The 5-call ROI workflow

```
Brand rep → Slack:
"I need the final ROI report for Mama Sita's Gifting Q1 2026."
```

**Call 1 — Pipeline summary**:
```
CE → cheerful_get_dashboard_analytics()
→ gifting_pipeline: {contacted: 10, ordered: 32, opted_out: 20, total: 62}
→ opt_in_rate: 51.6%  ← outperforms typical 20-35% gifting benchmark
```

**Call 2 — Posting rate**:
```
CE → cheerful_list_campaign_recipients(
  campaign_id="campaign-uuid-mamasitas",
  status=["ORDERED"],
  sort_by="post_count", sort_dir="desc",
  limit=100
)
→ 32 rows; 25 have post_count > 0 (78.1% posting rate)
→ 7 non-posters identified for follow-up
```

**Call 3 — Engagement aggregation**:
```
CE → cheerful_list_posts(limit=100, sort="desc")
→ filter to campaign "Mama Sita's Gifting 2026": 48 posts
→ CE agent computes:
  - 28 Reels + 20 feed posts
  - total likes: 12,450
  - total comments: 847
  - total Reel views: 156,000
  - avg likes/post: 259
  - avg ER (posting creators): 3.7%
```

**Call 4 — UGC library** (Stage 9 built):
```
CE → cheerful_list_ugc_content(campaign_id="campaign-uuid-mamasitas")
→ total: 47 (story_mention: 9, mention_webhook: 18, tags_polling: 10, hashtag: 10)
```

**Call 5 — Close campaign**:
```
CE → cheerful_update_campaign(campaign_id="campaign-uuid-mamasitas",
  status="completed")
→ Campaign removed from active dashboard
→ PostTrackingWorkflow: continues until tracking_ends_at window closes
```

### The final report

```
╔══════════════════════════════════════════════════════════╗
║   Mama Sita's Gifting Campaign Q1 2026 — Final Report   ║
╚══════════════════════════════════════════════════════════╝

📦 OUTREACH & CONVERSION
  Creators contacted (IG DM):        62
  Opted in (ORDERED status):         32  (51.6%)  ✅ target: 50+
  Products shipped:                  32 bundles
  Cost of products + shipping:       ₱19,840

🎥 CONTENT PRODUCED
  Posting creators:                  25 of 32 (78.1%)
  Feed posts + Reels (opted-in):     48
    ├── Reels:                        28
    └── Feed posts:                   20
  Stories captured (Layer 1A):        9  ← real-time, pre-expiry
  Organic hashtag posts (Layer 2):   10  ← unpaid brand advocates
  ──────────────────────────────────────
  Total content touchpoints:         67  (48 without Stage 9)

📊 ENGAGEMENT
  Total likes:                   12,450
  Total comments:                   847
  Total Reel views:             156,000
  Avg likes per post:               259
  Avg engagement rate:             3.7%  ← above 3% micro-creator benchmark

🌐 ESTIMATED REACH
  Reel views (exact):           156,000
  Feed post estimated reach:    ~13,200  (20% of creator followers)
  Total estimated impressions: ~169,200

💰 CAMPAIGN ECONOMICS
  Cost per UGC piece (full):     ~₱296  (67 pieces)
  Cost per UGC piece (S8 only):  ~₱413  (48 pieces)
  Cost per 1,000 impressions:    ~₱117
  Cost per engaged impression:    ~₱0.12

🏆 TOP CREATORS
  1. @sabawculture (22K)         — 2 posts, 4.2% ER, 67K Reel views
  2. @filipinafoodie (12K)       — 3 posts, 3.9% ER, 19.6K Reel views
  3. @lutongpinoyni_grace (18K)  — 2 posts, 3.2% ER, 34K Reel views

🌱 ORGANIC DISCOVERY (Stage 9 Layer 2)
  Non-campaign creators using #MamaSitas: 8 unique handles
  → Candidates for Mama Sita's Gifting Q2 2026 (already brand-warm)
```

---

## End-to-End CE Interaction Summary

| Stage | Day | CE Tools Called | Manual Steps | Duration |
|-------|-----|----------------|--------------|----------|
| 1: Setup | 0 | `cheerful_connect_ig_account`, `cheerful_create_product` ×2, `cheerful_create_campaign`, `cheerful_get_campaign` | Meta OAuth (browser) | ~90 min |
| 2: Discovery | 0 | `cheerful_search_creators_by_keyword` ×4, `cheerful_search_similar_creators` ×2, `cheerful_create_creator_list` | None | ~30 min active |
| 3: Vetting | 1 | `cheerful_start_creator_enrichment` ×1 (bulk), `cheerful_list_creator_enrichments`, `cheerful_get_creator_profile` ×87 (spot-check), `cheerful_add_list_creators_to_campaign` | Content quality review (manual judgment) | ~3 hr active |
| 4: Outreach | 2-4 | `cheerful_list_ig_accounts`, `cheerful_list_campaign_creators`, `cheerful_generate_outreach_list` (gap), `cheerful_list_ig_dm_threads`, `cheerful_ig_dm_campaign_summary` | 62 manual DM sends (4 days, ~15-20/day) | 4 days |
| 5: Responses | 2-10 | `cheerful_list_ig_dm_threads`, `cheerful_get_ig_dm_thread`, `cheerful_approve_ig_dm_draft`, `cheerful_send_ig_dm_reply` | Window expiry management | Ongoing |
| 6: Negotiation | 3-14 | `cheerful_get_ig_dm_thread`, `cheerful_approve_ig_dm_draft`, `cheerful_update_campaign_creator` ×32 | Address collection backup in Sheets | ~11 days |
| 7: Shipping | 15-17 | `cheerful_list_campaign_recipients`, `cheerful_update_campaign_creator` ×32 (ORDERED) | Physical dispatch, logistics coordination | ~1 hr |
| 8: Content tracking | 17-47 | `cheerful_list_campaign_recipients`, `cheerful_list_posts`, `cheerful_list_creator_posts` | None (PostTrackingWorkflow runs automatically) | 30 min/week monitoring |
| 9: UGC capture | 0-49 | `cheerful_list_ugc_content` | None (webhooks + crons run automatically) | Passive |
| 10: ROI report | 49 | `cheerful_get_dashboard_analytics`, `cheerful_list_campaign_recipients`, `cheerful_list_posts`, `cheerful_list_ugc_content`, `cheerful_update_campaign` | Compile report for sharing | ~20 min |

**Total CE tool calls**: ~150 across the campaign
**Total manual Instagram actions**: 62 initial DMs + ~10 follow-up DMs (cold outbound architectural constraint)
**Days with zero brand-rep action**: Days 17–46 (shipping + content tracking runs automatically)

---

## The 5 "Wow Moments" Where Cheerful Shines

### Wow 1: IC integration compresses weeks of research to minutes (Stage 2)
Finding 112 qualified micro food creators with verified follower counts and engagement rates via 6 CE calls — work that would take a freelance VA 2 weeks of manual Instagram research.

### Wow 2: AI drafts in Mama Sita's brand voice (Stage 5)
Every creator reply gets an AI-generated response written in the brand's warm, Filipino-friendly voice before the brand rep even reads the message. The brand rep reviews and approves in seconds. 32 creators, 100+ message exchanges, most handled in under 2 minutes per thread.

### Wow 3: One-call shipping manifest (Stage 7)
A single `cheerful_list_campaign_recipients(status=["READY_TO_SHIP"], has_address=true)` call returns a complete, address-verified, product-assigned shipping manifest for all 32 creators. What a typical marketing coordinator would spend half a day assembling from DM exports and spreadsheets takes one Slack message.

### Wow 4: Product detection via AI vision (Stage 8)
PostTrackingWorkflow detects Mama Sita's products in creator posts even without hashtags or @mentions — Claude Sonnet vision analysis identifies the product packaging from post thumbnails. No creator action required for tracking.

### Wow 5: Story capture before CDN expiry (Stage 9)
When @filipinafoodie posts a Story @mentioning @mamasitasmanila, Cheerful downloads the media within minutes of the webhook event — before Instagram's 24-hour CDN expiry purges it forever. The brand rep didn't have to screenshot it in time. 9 Stories preserved that would otherwise be lost.

---

## Manual Steps Required (Where Cheerful Cannot Help)

These are the steps the brand rep must take outside of Cheerful CE. They are documented here as the honest limits of the platform:

| Step | Reason | Stage | Workaround |
|------|--------|-------|------------|
| Meta Developer App setup | One-time external configuration | Stage 1 pre-req | Documentation + checklist in Stage 1 spec |
| Meta App Review submission | Required for production use | Stage 1 pre-req | Submit before Day 0; 2-7 day wait |
| 62 initial cold outbound DMs | Meta API cannot send cold DMs | Stage 4 | CE generates personalized send queue; brand rep sends manually |
| ~10 follow-up DMs (Day 5) | Same cold outbound constraint | Stage 4 | CE identifies non-responders; brand rep sends manually |
| Content quality review (vetting) | AI cannot reliably judge content authenticity | Stage 3 | CE surfaces profile thumbnails; brand rep spot-checks ~87 profiles in ~30 min |
| Physical product dispatch | Not a digital action | Stage 7 | CE provides shipping manifest; brand rep coordinates with warehouse |
| Shipping notification DM to creators | Most 24h windows closed | Stage 7 | Manual IG app DMs to top 5 creators only |
| Non-poster follow-up (Day 47+) | Cold outbound constraint + no scheduled sends | Stage 8/10 | CE identifies non-posters; brand rep sends optional nudge manually |

---

## Build-State Dependency Map

For this hero journey to run fully via CE with zero workarounds, the following must be built:

### P0 — Blocks the campaign

| Build Item | Blocks | Source Spec |
|-----------|--------|-------------|
| IG DM CE tools (connect, list accounts, thread tools) | Stages 1, 4, 5, 6 | `loops/cheerful-ig-dm-spec/analysis/spec/ce-ig-dm-tools.md` |
| `IgDmIngestWorkflow` + `IgDmSendReplyWorkflow` | Stages 5, 6 | `loops/cheerful-ig-dm-spec/analysis/spec/ingest-workflow.md` |
| `CampaignSenderCreate.ig_dm_account_id` schema extension | Stage 1 campaign creation | `loops/cheerful-ig-dm-spec/analysis/spec/db-migrations.md` |
| `cheerful_update_campaign_creator` CE tool | Stages 6, 7 (address + status write) | `loops/cheerful-ce-parity-reverse/specs/campaigns.md` |
| Creator search CE tools (keyword + similar) | Stage 2 discovery | `loops/cheerful-ce-parity-reverse/specs/creators.md` |
| Creator list CE tools (create, add, transfer) | Stages 2, 3 | `loops/cheerful-ce-parity-reverse/specs/creators.md` |
| `ugc_content` table + migrations | Stage 9 UGC capture | `loops/cheerful-ugc-capture-reverse/` |
| `StoryMentionWorkflow` (rides on DM infra) | Stage 9 Story capture | `loops/cheerful-ugc-capture-reverse/` |
| Meta App Review: `instagram_manage_messages` | Production IG DM send/receive | External (Meta) |
| Meta App Review: `instagram_public_content_access` | Stage 9 feed mention capture | External (Meta) |
| 4 Post CE tools (list_posts, list_creator_posts, etc.) | Stage 10 ROI reporting | `loops/cheerful-ce-parity-reverse/specs/creators.md` |
| `cheerful_update_campaign` CE tool | Stage 8 tracking enable, Stage 10 close | `loops/cheerful-ce-parity-reverse/specs/campaigns.md` |

### P1 — Degrades experience without blocking

| Build Item | Degrades | Source Spec |
|-----------|---------|-------------|
| `cheerful_generate_outreach_list` CE tool | Stage 4: manual batch message assembly | New spec needed |
| `cheerful_mark_dm_sent` CE tool | Stage 4: no send tracking in Cheerful | New spec needed |
| HUMAN_AGENT tag support in IG DM | Stage 5/6: 24h pressure vs 7-day window | `loops/cheerful-ig-dm-spec/` |
| Response categorization on threads | Stage 5: manual triage | `loops/cheerful-ig-dm-spec/` |
| `FeedMentionWorkflow` + `UGCTagPollingWorkflow` | Stage 9: 29 fewer UGC pieces | `loops/cheerful-ugc-capture-reverse/` |
| `HashtagMonitoringWorkflow` | Stage 9: 10 fewer organic UGC pieces | `loops/cheerful-ugc-capture-reverse/` |
| `cheerful_generate_campaign_report` CE tool | Stage 10: 15-20 min manual compilation → 1 call | New spec needed |
| `campaign_id` filter on `cheerful_list_posts` | Stage 10: must filter all posts in-context | `loops/cheerful-ce-parity-reverse/specs/creators.md` |
| `cheerful_export_to_sheet` CE tool | Stage 7/10: manual copy-paste to Sheets | New spec needed |

---

## Success Criteria: The Full Hero Journey

The Mama Sita's gifting campaign is a complete hero journey when:

- [ ] Brand rep sets up the entire campaign in Cheerful CE in under 2 hours (Stage 1 + 2 + 3)
- [ ] 62 personalized outreach messages generated by CE, manually sent in 4 days (Stage 4)
- [ ] Every creator reply auto-captured and AI draft ready before brand rep reads the message (Stage 5)
- [ ] 32 creators confirm gifting + provide addresses; Cheerful stores all 32 (Stage 6)
- [ ] One CE call produces the complete shipping manifest (Stage 7)
- [ ] Brand rep takes zero actions for 30 days while PostTrackingWorkflow silently monitors all 32 creators (Stage 8)
- [ ] 9+ Stories captured before CDN expiry without brand rep manual action (Stage 9)
- [ ] 5 CE calls produce the complete final ROI report in under 20 minutes (Stage 10)
- [ ] Final metrics: 50+ opted-in, 78%+ posting rate, ₱300/UGC piece or less, ~150K+ impressions

---

## Sources

| Stage | Spec File |
|-------|-----------|
| Campaign CRUD, products, recipients | `loops/cheerful-ce-parity-reverse/specs/campaigns.md` |
| Creator search, lists, posts | `loops/cheerful-ce-parity-reverse/specs/creators.md` |
| Analytics, dashboard | `loops/cheerful-ce-parity-reverse/specs/analytics.md` |
| IG DM tools, webhooks, ingest | `loops/cheerful-ig-dm-spec/analysis/spec/` |
| UGC capture architecture | `loops/cheerful-ugc-capture-reverse/frontier/` |
| Codebase architecture | `loops/cheerful-reverse/` |
| Stage-by-stage specs | `loops/mamasitas-campaign-reverse/journey/stage-{1-10}-*.md` |
