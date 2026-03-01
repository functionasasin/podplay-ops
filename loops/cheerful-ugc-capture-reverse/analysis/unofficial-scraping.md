# Unofficial Scraping — UGC Monitoring

**Aspect**: `unofficial-scraping`
**Wave**: 1 — External Landscape
**Status**: Analyzed

---

## Overview

Unofficial approaches use third-party scrapers, private API libraries, or browser automation to access Instagram data outside of Meta's official APIs. These approaches can capture content that official APIs don't expose — but at the cost of Terms of Service compliance, account risk, and operational fragility.

This analysis covers three main categories:
1. **Apify Instagram actors** — managed scraping infrastructure with dedicated UGC actors
2. **instagrapi / private API libraries** — direct interaction with Instagram's mobile private API
3. **Browser automation** — Playwright/Puppeteer-based Instagram scraping

**Critical context**: Cheerful already uses Apify for Instagram profile scraping and post tracking (not for UGC mention monitoring). This existing relationship significantly lowers the marginal risk and operational overhead of extending Apify usage to UGC mention monitoring.

---

## 1. Apify Instagram Actors

### What Apify Is

Apify is a managed web scraping and automation platform. Actors are serverless scraping programs that Apify hosts and executes on its infrastructure. Cheerful already has an active Apify account and `APIFY_API_TOKEN` in production.

### Current Cheerful Apify Usage

Cheerful already uses Apify extensively:

| Actor | Purpose | File |
|-------|---------|------|
| Custom lookalike actor (`APIFY_LOOKALIKE_ACTOR_ID`) | Find similar Instagram profiles | `src/services/external/apify.py` |
| `apify/instagram-scraper` | Keyword search for creators | `src/services/external/apify.py` |
| `apify/instagram-profile-scraper` | Fetch recent posts (resultsLimit=1) | `src/services/post_tracking/apify_posts.py` |
| `streamers/youtube-channel-scraper` | YouTube channel data | `src/services/external/youtube_apify.py` |

Notably, Cheerful has already written a test script (`scripts/analysis-tools/test_16_apify_scrape_instagram_mentions.py`) that uses `apify/instagram-scraper` with `resultsType='mentions'` — explicitly exploring UGC mention monitoring. This indicates the team has already investigated this path.

### Relevant UGC-Focused Apify Actors

#### A. `apify/instagram-scraper` with `resultsType='mentions'`

The general-purpose Instagram scraper supports a `mentions` mode:

```python
actor_input = {
    "directUrls": ["https://www.instagram.com/brandname/"],
    "resultsType": "mentions",
    "resultsLimit": 50,
}
run = client.actor("apify/instagram-scraper").call(run_input=actor_input)
```

**Data returned**: caption, media URLs, likes count, ownerUsername, timestamp, hashtags, post URL, tagged users
**Content types**: Feed posts, Reels (where brand is @mentioned in caption/comments)
**Does NOT return**: Stories (ephemeral), private account posts
**Pricing**: Included in Apify platform pricing; roughly $0.50–$2.70 per 1,000 results depending on plan
**Already tested by Cheerful**: Yes — `test_16_apify_scrape_instagram_mentions.py`

#### B. `apify/instagram-tagged-scraper`

Dedicated actor specifically for posts where a profile is photo-tagged (tagged in the image, not just @mentioned in caption):

```
Input: Instagram username(s)
Output: Posts where brand account appears as a tagged user in the media
```

**Data returned**: post caption, media_url, thumbnail_url, timestamp, likes, comments, ownerUsername, tagged_users
**Content types**: Feed posts, Reels with photo tags
**Limitation**: Captures photo-tagged posts only — does NOT capture caption @mentions
**Pricing**: Standard Apify compute (~$2–5 per 1,000 results depending on run time)

#### C. `powerful_bachelor/instagram-tagged-mentions-posts-scraper`

Community-maintained actor combining both @mentions and photo tags in one run. The pay-per-result variant is deprecated; the base actor is still active.

**Key features**: Identifies paid partnerships and sponsored posts, bulk username input, JSON/CSV/Excel export
**Reliability concern**: Community actors have no SLA and may break when Instagram changes its internal API

#### D. `apify/instagram-hashtag-scraper`

Scrapes posts by hashtag without the 30-hashtag limitation imposed by the official Instagram Hashtag API.

**Pricing**: $0.016 per hashtag + $0.0004 per additional post beyond 60
**Key difference from official API**: No 30-hashtag/7-day limit — can monitor unlimited hashtags
**Limitation**: Still only captures public posts; no Stories

#### E. `apify/instagram-search-scraper`

Scrapes posts from keyword search results on Instagram.

**UGC use case**: Find posts using brand name as a keyword search term (catches untagged posts that mention brand in caption)
**Limitation**: Instagram search is not comprehensive; results are curated by Instagram's algorithm

### What Apify Scraping Can Capture vs. Official API

| Content Type | Official Graph API | Apify Scrapers |
|---|---|---|
| @mention in caption (feed post) | ✅ `mentioned_media` | ✅ `resultsType='mentions'` |
| Photo-tagged in feed post | ✅ `/tags` endpoint | ✅ `instagram-tagged-scraper` |
| Hashtag posts | ✅ (30-hashtag limit) | ✅ (no hashtag limit) |
| Story mentions | ✅ (Messaging API webhook) | ❌ Ephemeral, not scrapable |
| Reel @mentions | ✅ | ✅ |
| Carousel @mentions | ✅ | ✅ |
| Private account posts | ❌ | ❌ |
| DM mentions | ❌ | ❌ |
| Untagged brand appearances | ❌ | ❌ (AI needed) |

**Key insight**: Apify and the official Graph API have nearly identical coverage for public feed content. The main advantage of Apify over the official API is:
1. No hashtag monitoring limit (unlimited hashtags vs. 30/7-day)
2. Simpler OAuth setup (no brand account Graph API token required)
3. Existing infrastructure already in place at Cheerful

### Apify UGC Monitoring Architecture

A Cheerful Temporal workflow for Apify-based UGC polling:

```
PeriodicApifyUGCScan (Temporal cron, e.g., every 4 hours)
  ├── For each brand's Instagram handle:
  │   ├── apify/instagram-scraper (resultsType='mentions', last N results)
  │   ├── apify/instagram-tagged-scraper (photo tags)
  │   └── apify/instagram-hashtag-scraper (brand hashtags)
  └── Deduplicate against existing ugc_content table
  └── Store new UGC content → link to creator/campaign
```

**Rate limit**: Apify imposes no specific rate limit on Instagram scraping (they handle proxy rotation internally), but scraping too aggressively increases the chance of getting the scraped account temporarily blocked.

**Polling interval**: Every 4–6 hours is reasonable. Real-time is not possible with polling; official webhooks provide real-time push.

### TOS and Legal Risk — Apify

Apify scrapes public Instagram data using proxy rotation and browser fingerprint spoofing. This is a gray area:

- **Legal precedent (2024)**: Meta dropped its lawsuit against Bright Data (a scraping/proxy company) after losing a key claim. Courts have generally allowed scraping of **publicly accessible data**.
- **TOS violation**: Instagram's TOS prohibits automated data collection. Violation can result in IP blocks, temporary account lockout for the brand account being monitored, or platform-wide access restrictions.
- **Cheerful's existing precedent**: Cheerful already uses Apify for Instagram profile scraping and post tracking in production. Extending this to UGC mention monitoring represents **incremental risk**, not a new category of risk.
- **Key distinction**: Apify scrapes **public content** — posts that anyone can see without being logged in. This is lower risk than scraping private/authenticated data.

**Risk level**: **Low-medium** (same category as existing Cheerful Apify usage; public data only)

---

## 2. instagrapi — Private API Library

### What It Is

[instagrapi](https://github.com/subzeroid/instagrapi) is a Python library that interacts with Instagram's **private mobile API** — the same API the iOS/Android Instagram app uses. It requires actual Instagram account credentials (username + password).

### Capabilities Relevant to UGC

instagrapi can theoretically:
- Read the brand account's **notification inbox** to detect @mentions and photo tags in real-time
- Monitor **direct message inbox** (including `story_mention` events that arrive as DM messages)
- Fetch posts where an account is mentioned (same underlying data as official API)
- Access content visible to the logged-in account (including followers-only posts from followed accounts)

For UGC use specifically:
```python
from instagrapi import Client

cl = Client()
cl.login("brand_account", "password")

# Get mentions/tags
user_id = cl.user_id_from_username("brandname")
tagged_medias = cl.usertag_medias(user_id)  # Photo-tagged posts
mentioned_in_comments = cl.user_medias_v1(user_id, amount=20)  # Additional data
```

### Critical Risks

1. **Account ban risk**: Instagram actively detects and bans accounts using private API libraries. The instagrapi maintainers themselves state: *"It will be difficult to find good accounts, good proxies, or resolve challenges, and IG will ban your accounts."* They recommend it only for testing/research.

2. **Brand account on the line**: Unlike Apify (which uses Apify's own proxy infrastructure), instagrapi operates under the **brand's own Instagram credentials**. A ban would lock Cheerful's brand client out of their Instagram account — catastrophic for a business that depends on Instagram.

3. **TOS violation**: Using Instagram's private API with a real account clearly violates Meta's Terms of Service:
   > *"You can't attempt to create accounts or access or collect information in unauthorized ways."*

4. **CFAA exposure**: Using an unofficial API to bypass Instagram's technical controls could be framed as a CFAA (Computer Fraud and Abuse Act) violation, even if the underlying data is public.

5. **Operational fragility**: Instagram regularly changes its private API. instagrapi requires constant maintenance and frequently breaks when Meta pushes app updates.

6. **Challenge flows**: Instagram increasingly triggers 2FA challenges, CAPTCHA, and device verification for automated logins. These require human intervention and cannot be automated reliably.

### Why It's Not Viable for Cheerful

The one theoretically unique capability instagrapi offers — accessing `story_mention` events from the DM inbox — is **already available via the official Instagram Messaging API** (`story_mention` webhook events). There is no UGC capability instagrapi provides that isn't either:
- Available via official APIs (Graph API + Messaging API)
- Available via lower-risk Apify scraping

The risk-to-benefit ratio is deeply unfavorable. Using instagrapi risks the brand client's entire Instagram account for marginal capability gains.

**Risk level**: **Critical — not recommended**

---

## 3. Browser Automation (Playwright / Puppeteer)

### What It Is

Browser automation tools control a real browser (Chromium, Firefox) to interact with Instagram's web app (`instagram.com`) as if a human were using it. Combined with stealth plugins (e.g., `playwright-stealth`, `puppeteer-extra-plugin-stealth`), bots can partially evade Instagram's bot detection.

### Capabilities Relevant to UGC

A browser bot could:
- Navigate to `instagram.com/brandname/tagged/` (the photo-tagged posts page) and scrape content
- Navigate to `instagram.com/explore/tags/brandhashag/` and scrape hashtag content
- Monitor notification pages for @mentions

### Why It's Not Viable

1. **Higher complexity than Apify**: Apify's `instagram-scraper` already handles proxy rotation, fingerprint spoofing, and Instagram bot detection — and is available as a ready-to-use service. Building custom Playwright automation would reinvent Apify's wheel.

2. **Detectability**: Instagram employs sophisticated bot detection including:
   - Headless browser fingerprinting (`navigator.webdriver` flag)
   - Mouse movement pattern analysis
   - Behavioral fingerprinting
   Without additional stealth layers, Playwright/Puppeteer are detected almost immediately.

3. **Infrastructure cost**: Running headless browsers requires significant compute (1-2 GB RAM per browser instance) vs. lightweight HTTP requests from Apify actors.

4. **Maintenance burden**: Instagram's web app changes constantly. Selectors break. Login flows change. This requires ongoing engineering maintenance.

5. **No unique capability**: Everything browser automation can scrape from Instagram's public pages, Apify already handles better.

**Risk level**: **High operational risk, no unique capability — not recommended**

---

## Comparative Risk Assessment

| Approach | Legal Risk | Account Risk | Capability | Operational Complexity | Verdict |
|---|---|---|---|---|---|
| Apify (public data) | Low-medium | Low | High (public feed) | Low (existing infra) | **Viable** |
| instagrapi | High | **Critical** (brand account) | Medium | High | **Not recommended** |
| Browser automation | Medium | Medium | Medium | Very high | **Not recommended** |

---

## Apify vs. Official Graph API — Strategic Comparison

| Dimension | Official Graph API | Apify |
|---|---|---|
| Auth complexity | OAuth flow per brand account | Single Apify token (already in Cheerful) |
| Hashtag limit | 30 hashtags / 7 days | Unlimited |
| Mention latency | Poll every N hours OR real-time webhooks | Poll every N hours (no push) |
| Story capture | ✅ Via Messaging API webhook | ❌ Not possible |
| TOS compliance | ✅ Fully compliant | ⚠️ Gray area (public data) |
| Reliability | High (Meta-hosted) | Medium (depends on Instagram anti-scraping) |
| Data freshness | Real-time (webhook) or configurable lag | Polling lag (minimum 1–4 hours practical) |
| Cost | Free (within rate limits) | Compute costs (~$0.50–$5 per 1,000 results) |
| Existing Cheerful infra | Partial (webhook infra via IG DM work) | ✅ Full (`APIFY_API_TOKEN` in prod) |

**Key insight**: Apify offers one significant advantage over the official API — **no hashtag monitoring limit**. The official API caps hashtag monitoring at 30 unique hashtags per 7-day rolling window (see `hashtag-monitoring.md`). With Apify's `instagram-hashtag-scraper`, Cheerful could monitor unlimited brand hashtags (e.g., `#brandname`, `#brandproduct`, `#brandcampaign`) without hitting the cap.

For @mention and photo-tag capture, the official Graph API is strictly superior (real-time webhook, TOS-compliant, free). Apify adds value only when:
- Story capture isn't available via official Messaging API (it is)
- Hashtag monitoring exceeds the 30-hashtag cap (real use case)
- Brand account OAuth setup is too complex for a given brand (unlikely)

---

## Architectural Integration with Cheerful

### Lowest-Effort Integration Path (Apify)

Cheerful already has:
- `ApifyClient` instantiated in `src/services/external/apify.py`
- `APIFY_API_TOKEN` in production config (`src/core/config/definition.py:77`)
- Error handling patterns for Apify failures (`src/core/error_types.py` — `ErrorTypes.APIFY`)
- A test script validating `resultsType='mentions'` already works

Adding UGC capture via Apify requires:
1. New Temporal workflow: `ApifyUGCScanWorkflow` (polling every 4–6 hours per brand)
2. New service method: `apify_service.scan_ugc_mentions(brand_username, limit=50)`
3. Deduplication logic against `ugc_content` table (yet to be created)
4. No new credentials or auth flows

This is the lowest friction path to extending Cheerful's existing Apify infrastructure for UGC capture. It avoids the OAuth complexity of setting up brand-level Graph API tokens (required for official mention tracking).

### Hybrid Role: Apify as Fallback

In a layered architecture:
- **Primary**: Official Graph API webhooks (real-time, TOS-compliant) for @mentions and photo tags
- **Supplemental**: Apify for hashtag monitoring beyond the 30-hashtag cap
- **Fallback**: Apify as a polling fallback if official webhook delivery fails

---

## Constraints and Limitations

1. **No Story capture via scraping**: Stories are ephemeral and not accessible via web scraping. Only the official Messaging API `story_mention` webhook provides Story capture. This is a hard constraint — unofficial approaches cannot fill this gap.

2. **No untagged content detection**: Scraping can only find content where the brand is explicitly named in a URL, @mention, hashtag, or caption keyword. Detecting untagged visual brand appearances requires AI (see `ai-visual-detection.md`).

3. **Private accounts**: Any account with a private profile is inaccessible to scraping. This typically represents 10–20% of Instagram accounts.

4. **Historical depth**: Scrapers can retrieve historical posts (limited by Instagram's pagination). The official API's `mentioned_media` endpoint also returns historical content. Both approaches can backfill, but there's no guarantee of full historical coverage.

5. **Engagement data freshness**: Scraped engagement (likes, comments) reflects the moment of scraping, not real-time. Official API polling has the same limitation.

---

## Conclusion

**Apify-based scraping is viable as a supplemental layer**, primarily for:
- Hashtag monitoring beyond the 30-hashtag/7-day official API cap
- Fallback polling when official webhook delivery is unreliable

Cheerful's existing Apify infrastructure (`APIFY_API_TOKEN`, `ApifyClient`, `ApifyService`, error handling patterns) makes this the lowest-friction unofficial approach. The team has already explored `resultsType='mentions'` in a test script, confirming the capability.

**instagrapi and browser automation are not recommended** — they offer no unique capabilities over official APIs + Apify, while introducing unacceptable account-ban risk for brand clients.

The more strategic investment is the **official Graph API + Messaging API combination** (covered in `webhooks-mentions.md`, `story-mention-capture.md`), which provides real-time capture with full TOS compliance and no cost. Apify fills a narrow gap (hashtag scale), not the main capture path.

---

## References

- Cheerful: `src/services/external/apify.py` — existing ApifyService
- Cheerful: `src/services/post_tracking/apify_posts.py` — existing post tracking via Apify
- Cheerful: `src/core/config/definition.py:77–89` — Apify env vars
- Cheerful: `scripts/analysis-tools/test_16_apify_scrape_instagram_mentions.py` — UGC mention test
- [Apify Instagram Mentions and Tagged Posts Scraper](https://apify.com/apify/instagram-tagged-scraper)
- [Apify Instagram Scraper](https://apify.com/apify/instagram-scraper)
- [instagrapi GitHub](https://github.com/subzeroid/instagrapi)
- [instagrapi Best Practices](https://subzeroid.github.io/instagrapi/usage-guide/best-practices.html)
- [Meta v. Bright Data ruling — Zyte](https://www.zyte.com/blog/california-court-meta-ruling/)
- [Is Instagram Scraping Legal? — SociaVault](https://sociavault.com/blog/instagram-scraping-legal-2025)
