# Spec: External Integrations

**Synthesized from:** `integration-points`, `ai-orchestration`, `context-engine-mcp-tools`, `backend-services`, `temporal-workflows`

**Purpose:** Implementation-ready specification for every external integration in Cheerful — what each service does, why it's needed, how it's authenticated, what data flows through it, how failures are handled, and how to build or replace it.

---

## Integration Catalog at a Glance

| # | Service | Category | Auth Method | Direction | Critical Path? |
|---|---------|----------|-------------|-----------|----------------|
| 1 | Gmail API | Email | OAuth 2.0 (per user) | Read + Write | Yes |
| 2 | SMTP/IMAP | Email | Username/Password (per user) | Read + Write | Yes |
| 3 | Apify (Instagram) | Creator Discovery | API Token | Outbound | Yes |
| 4 | Apify (YouTube) | Creator Discovery | API Token | Outbound | Yes |
| 5 | Bio Link Scraper | Creator Enrichment | None | Outbound (HTTP) | No (fallback tier 1) |
| 6 | Influencer Club | Creator Enrichment | Bearer Token | Outbound | No (fallback tier 4) |
| 7 | Firecrawl | Product Scraping | API Key | Outbound | No (campaign setup UX) |
| 8 | Google Sheets | Reporting | Service Account | Read + Write | No (metrics export) |
| 9 | Shopify (GoAffPro) | Order Fulfillment | GoAffPro Token | Outbound | No (gifting campaigns) |
| 10 | Slack (Operations) | Workflow Approval | Bot Token | Outbound | No (gifting campaigns) |
| 11 | PostHog | Product Analytics | API Key | Outbound | No |
| 12 | Langfuse | LLM Observability | Secret+Public Key | Outbound | No (graceful degrade) |
| 13 | Anthropic Claude API | AI Provider | API Key | Outbound | Yes |
| 14 | OpenAI | AI Provider | API Key | Outbound | Yes |
| 15 | Composio | Action Platform | API Key + User ID | Outbound | No (optional workflows) |
| 16 | Slack (Context Engine) | Team Productivity | Bot+User+App Token | Inbound + Outbound | No |
| 17 | Fly.io (via MCP) | Dev Infra | API Token | Outbound | No |
| 18 | Clarify | Meeting Transcripts | DB-backed | Outbound | No |
| 19 | ACP (Anthropic) | Multi-agent | HTTP to Fly | Outbound | No |
| 20 | Onyx | Knowledge Base | API Key | Outbound | No |

---

## 1. Gmail / SMTP Email Pipeline

**User problem:** Campaign outreach and replies flow through the operators' own email accounts — not a proprietary mailer. The system must transparently proxy real Gmail and SMTP inboxes, maintaining full email fidelity (headers, threads, attachments) while enabling AI automation on top.

### 1.1 Gmail API

**File:** `apps/backend/src/services/external/gmail.py`

#### Authentication

```
OAuth 2.0 (offline access, per-user refresh tokens)
Scopes: gmail.modify, gmail.send, gmail.labels
Credentials: GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET (env vars)
Storage: user_gmail_account.refresh_token (AES-encrypted at rest via crypto_service)
Refresh: google.oauth2.credentials.Credentials auto-refreshes via credentials.refresh(Request())
```

**Auth flow:**
1. User visits `/auth/google` — webapp redirects to Google OAuth consent screen
2. Google redirects back with authorization code
3. Backend exchanges code for `access_token` + `refresh_token` via `google-auth` library
4. `refresh_token` encrypted + stored in `user_gmail_account`
5. Every `GmailService.for_user(email)` call: decrypt token → construct `Credentials` → build `googleapiclient.discovery.build('gmail', 'v1')`

#### Data Exchanged

| Direction | Format | Content |
|-----------|--------|---------|
| Inbound (read) | RFC 2822 raw bytes via `format='raw'` | Full email with headers, MIME body, attachments |
| History delta | `startHistoryId` → history list | Message IDs added/removed since last poll |
| Outbound (send) | Base64url-encoded `multipart/alternative` | HTML + plaintext parts; RFC 2047 subject for non-ASCII |
| Drafts | Gmail Draft API | Create → send atomically or delete |

#### Operations Contract

```python
GmailService.for_user(email: str) -> GmailService
    # Factory: decrypt token → build authenticated client

get_profile() -> GmailProfile{email, messages_total, history_id}
    # Called at gmail account registration and inbox startup

list_send_as() -> list[str]
    # Returns all email aliases for the account; used for inbound direction detection

get_history(start_history_id: str) -> list[HistoryEntry]
    # Poll for new messages since last checkpoint; returns message IDs to fetch

get_message(message_id: str) -> GmailMessage{id, thread_id, payload, ...}
    # Fetch full RFC 2822 message; raises on 404

get_messages_batch(ids: list[str]) -> list[GmailMessage]
    # Sequential fetch; silently skips 404 (message deleted externally)

get_messages_in_chunks(ids: list[str], chunk_size=50) -> Iterator[list[GmailMessage]]
    # Iterator for historical backfill of large batches

list_messages(query: str, max_results=500) -> list[str]
    # Paginated search (used only for initial historical migration)

create_draft(subject, body_text, body_html, to, from_, reply_to?, in_reply_to?, references?, thread_id?) -> GmailApiDraft
    # Creates draft in Gmail; returns {id, message_id}

delete_draft(draft_id: str) -> None
    # Deletes draft; no-op if already deleted (404 swallowed)

send_draft(draft_id: str) -> GmailSendResult{thread_id, message_id}
    # Atomically sends draft → message becomes permanent in Gmail

send_message_direct(subject, body_text, body_html, to, from_, reply_to?, in_reply_to?, references?, thread_id?) -> GmailSendResult
    # Send without draft lifecycle; used for initial outreach emails
```

#### Thread Header Management

Gmail uses RFC 2822 headers to group messages into threads. The service explicitly sets:
```
In-Reply-To: <{parent_message_id}>
References: <{chain_of_all_prior_message_ids}>
threadId: {gmail_thread_id}  # provided to send API
```
If headers are omitted, Gmail creates a new thread instead of continuing the conversation.

#### Error Handling

```python
ErrorHandler.handle_gmail_api_error(error: HttpError) -> ApplicationError
    # Maps HTTP status to retryable/non-retryable:
    # 429, 503: non_retryable=False (retry with backoff)
    # 401, 403: non_retryable=True (auth failure — stop retrying)
    # 404: silently skipped in batch fetch; raises ApplicationError in single fetch
    # From-mismatch: ApplicationError(non_retryable=True)  # prevents wrong-account send
```

All Gmail errors propagate as `ApplicationError` to Temporal activities, which interpret `non_retryable=True` as immediate failure (no retry).

#### Unicode Edge Case

Subjects containing emojis or non-ASCII characters are encoded via RFC 2047:
```python
=?UTF-8?B?{base64(subject.encode('utf-8'))}?=
```
Gmail API rejects non-ASCII subjects without this encoding.

---

### 1.2 SMTP / IMAP

**File:** `apps/backend/src/services/external/smtp_email.py`

#### Authentication

```
SMTP: username + password (per user, AES-encrypted at rest)
IMAP: separate username + password (may differ from SMTP)
TLS: Port 465 → SMTP_SSL; other ports → STARTTLS if smtp_use_tls=True
IMAP SSL: always IMAP4_SSL
```

#### Why IMAP for Drafts?

Gmail has a Drafts API. SMTP does not. To allow operators to see AI-generated drafts in their normal email client (Outlook, Apple Mail, etc.), the system uses IMAP APPEND to write drafts directly to the server's Drafts folder. This means the operator's mail client shows the draft without any special integration.

#### Draft Lifecycle (IMAP)

```
create_draft(to, from_, subject, body_text, body_html, reply_to?, in_reply_to?, references?) -> SmtpDraft{uid, message_id}
    ↓ IMAP APPEND to "Drafts" folder with flags: \Draft \Seen
    ↓ Server responds with [APPENDUID <validity> <uid>] — parsed to capture UID
    ↓ Returns SmtpDraft{uid: str, message_id: str}

send_draft(uid: str) -> SmtpSendResult{thread_id, message_id}
    ↓ IMAP UID FETCH {uid} (RFC822) — retrieve full draft bytes
    ↓ Parse recipients from MIME message
    ↓ SMTP SENDMAIL with draft bytes
    ↓ IMAP UID STORE {uid} +FLAGS \Deleted
    ↓ IMAP EXPUNGE

delete_draft(uid: str) -> None
    ↓ IMAP UID STORE {uid} +FLAGS \Deleted + EXPUNGE
    ↓ Non-retryable ApplicationError if UID not found (draft deleted externally)
```

**Key difference from Gmail:** SMTP draft IDs are IMAP UIDs (server-assigned integers). Gmail draft IDs are Google-assigned opaque strings. The `send_draft()` flow retrieves bytes from IMAP then sends via SMTP — ensuring the sent message matches exactly what the operator sees in their Drafts folder.

#### APPENDUID Parsing

```python
# Server response format: "OK [APPENDUID <uidvalidity> <uid>] ..."
# Regex: r'\[APPENDUID \d+ (\d+)\]'
# Falls back to "unknown" if server doesn't support APPENDUID capability
```

#### Error Handling

| Error | Non-retryable | Cause |
|-------|---------------|-------|
| `SMTPAuthenticationError` | False (Temporal retries) | Wrong credentials |
| `SMTPConnectError` | False | Server unreachable |
| IMAP UID not found | True (`ApplicationError`) | Draft deleted externally |
| IMAP connection failure | False | Propagates from `_get_imap_connection()` |

---

### 1.3 Email Pipeline Architecture

The dual Gmail/SMTP path is a core architectural decision. From the worker's perspective, all email operations are unified via the `Candidate` dataclass:

```
┌──────────────────────────────────────────────────────────────┐
│                    Email Pipeline                             │
│                                                              │
│  Detection Layer (perpetual loops)                           │
│    GmailInboxWatcher → get_history() → delta-based fetch    │
│    SmtpInboxWatcher  → IMAP IDLE or polling                 │
│                                                              │
│  Unified Representation                                      │
│    Candidate{provider: gmail|smtp, thread_id, messages}     │
│                                                              │
│  Processing Layer (ThreadProcessingCoordinatorWorkflow)      │
│    AI pipeline identical for both providers                  │
│                                                              │
│  Draft Generation                                            │
│    Gmail: create_draft() → GmailApiDraft                    │
│    SMTP: create_draft() → IMAP APPEND → SmtpDraft           │
│                                                              │
│  Send Layer                                                  │
│    Gmail: send_draft(draft_id) → Gmail API                  │
│    SMTP:  send_draft(uid) → IMAP FETCH → SMTP SENDMAIL      │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Creator Discovery & Enrichment

**User problem:** Finding relevant creators for a campaign (and their contact emails) is the most time-intensive part of influencer marketing. The system automates discovery via platform scraping and email enrichment via a multi-tier waterfall.

### 2.1 Creator Email Enrichment Waterfall

The waterfall is the universal strategy for finding a creator's business email, used during both discovery (proactive enrichment) and thread processing (identifying new creators). Each tier is attempted in order; short-circuit on first success:

```
Tier 1: Bio Link Scraper (FREE)
    → Check external_url for linktr.ee, beacons.ai, bio.link, stan.store, link.me
    → HTTP GET → extract mailto: links + NEXT_DATA JSON + regex scan
    → Cost: $0 (direct HTTP, no API)
    → Time: ~1-3 seconds

Tier 2: Apify Actor (CHEAP ~$0.001/profile)
    → Instagram: instagram-scraper actor → biography field email scan
    → YouTube: youtube-channel-contacts-extractor actor ($0.005/result)
    → Cost: Apify compute units
    → Time: 10-60 seconds

Tier 3: Platform Profile Scraping
    → YouTube: regex email from channel description
    → YouTube: scrape link-in-bio pages from channel's website
    → Cost: Apify compute units for channel scraper
    → Time: 30-120 seconds

Tier 4: Influencer Club (EXPENSIVE, subscription API)
    → POST /public/v1/creators/enrich/handle/full/ with email_required: "must_have"
    → Only for handles not found via free tiers
    → Cost: subscription fee per enriched profile
    → Time: ~5-10 seconds
```

**Implementation:** `apps/backend/src/services/external/` — each tier is a separate service called sequentially by `CreatorEnrichmentService`.

---

### 2.2 Apify (Instagram)

**File:** `apps/backend/src/services/external/apify.py`

#### Authentication

```
Apify API token → ApifyClient(token=APIFY_API_TOKEN)
Authorization: Bearer {token}
```

#### Actors Used

| Actor | Purpose | Input | Typical Duration |
|-------|---------|-------|-----------------|
| Custom lookalike actor (configurable `actor_id`) | Find similar Instagram profiles | `{inputs: [username], type: "similar_users", profileEnriched: true, maxItem: N}` | 30-120s |
| `apify/instagram-scraper` | Keyword search for users | `{search: keyword, searchType: "user", searchLimit: N, resultsType: "details"}` | 20-60s |

#### Output Schema

```python
ApifyActorResult:
  profiles: list[ApifyInstagramProfile]
  run_id: str
  seed_username: str

ApifyInstagramProfile:
  username: str
  full_name: str
  biography: str
  follower_count: int
  profile_pic_url: str
  is_verified: bool
  external_url: str | None    # link-in-bio URL → fed into bio link scraper
  category: str | None
  public_email: str | None    # sometimes populated directly
  media_count: int
  following_count: int
  city_name: str | None
```

#### Execution Model

Synchronous actor run: `client.actor(id).call(run_input)` — blocks until actor completes. Wrapped in Temporal activities with `schedule_to_close_timeout` to prevent indefinite hangs. Actor results fetched via `client.dataset(run['defaultDatasetId']).list_items().items`.

#### Error Classification

```python
# Error type → non_retryable
"rate limit" | "quota" | "too many requests" → False  # Temporal will retry
"unauthorized" | "forbidden" | "401" | "403" → True
"invalid" | "not found" | "404" → True
Actor returns None → True (actor crash)
No dataset ID → True (actor setup failure)
Unknown → False (safe default: retry)
```

All errors wrapped: `ApplicationError(message, type=ErrorTypes.APIFY, non_retryable=...)`.

---

### 2.3 Apify (YouTube)

**File:** `apps/backend/src/services/external/youtube_apify.py`

**User problem:** YouTube creator discovery requires a 4-actor pipeline because no single API provides lookalike discovery + channel details + email extraction together.

#### Actors Used

| Actor | Config Key | ID | Purpose |
|-------|------------|-----|---------|
| Channel Scraper | `channel_scraper_actor_id` | `streamers/youtube-channel-scraper` | Fetch channel details + recent videos |
| Channel Finder (slow) | `channel_finder_actor_id` | `coregent/youtube-channel-finder` | Keyword channel search |
| Channel Finder (fast) | `apidojo_finder_actor_id` | `apidojo/youtube-channel-information-scraper` | 166 channels/second |
| Email Extractor | `email_extractor_actor_id` | `endspec/youtube-channel-contacts-extractor` | Extract contact emails ($0.005/result) |

#### Full Pipeline: `get_lookalike_channels(channel_url, search_pool_size, llm_service)`

```
Step 1: get_channel_details(channel_url)
    → Channel Scraper actor
    → YouTubeChannelDetails{channel_id, name, description, subscriber_count, recent_video_titles}
    → extract_channel_email(seed_channel)  [3-tier email waterfall]

Step 2: _extract_keywords_with_llm(channel, llm_service)
    → gpt-4.1-mini structured output
    → Prompt context: channel name + description + subscriber count + recent video titles
    → Extraction goal: "What a FAN of this channel would search to find MORE channels like it"
    → Output: KeywordExtractionResult{keywords: list[str]}  # 2-3 keywords

Step 3: find_similar_channels_fast(keywords, max_results=search_pool_size)
    → apidojo actor (fast: 166ch/s) if configured, else coregent actor
    → list[YouTubeChannelFinderResult]
    → Filter: remove seed channel by channel_id

Step 3b: extract_channel_email(channel) for each similar channel
    → ThreadPoolExecutor(max_workers=10)
    → Errors: silently logged, channel included without email
    → Sort: channels with emails first

Result: YouTubeLookalikeResult{seed_channel, similar_channels, keywords_used}
```

#### Field Mapping Normalization

`apidojo` actor returns different field names than `coregent` actor. Both are normalized to `YouTubeChannelFinderResult`:

| Normalized Field | apidojo Field | coregent Field |
|-----------------|---------------|----------------|
| `ChannelId` | `channelId` | `channelId` |
| `ChannelName` | `channelTitle` | `name` |
| `ChannelHandle` | `customUrl` | `handle` |
| `ChannelURL` | `channelUrl` | `url` |
| `SubscriberCount` | `subscriberCount` | `subscribers` |
| `Description` | `description` | `about` |

#### LLM Integration Note

YouTube discovery is the **only place outside Temporal activities** where LLM is called inline (not via a Temporal activity). `_extract_keywords_with_llm()` calls `LlmService.parse_structured()` directly within the synchronous actor pipeline. This is acceptable because the whole pipeline runs inside a Temporal activity with its own timeout.

---

### 2.4 Bio Link Scraper

**File:** `apps/backend/src/services/external/bio_link_apify.py`

**Authentication:** None — direct HTTP GET with `User-Agent: Mozilla/5.0 ...` browser header.

**Supported Platforms:**
```python
SUPPORTED_DOMAINS = {"linktr.ee", "beacons.ai", "bio.link", "stan.store", "link.me"}
```

**Extraction Strategy (3-step, in order):**

1. `mailto:` links — regex `mailto:([^"'&?\s]+)` in raw HTML
2. `__NEXT_DATA__` JSON — parse Next.js hydration data (used by link.me); recursively scan for email-pattern strings
3. Raw email regex — fallback scan of entire HTML: `[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}`

**False Positive Filtering:**
```python
SKIP_SUFFIXES = {".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".woff", ".woff2", ".ttf", ".eot"}
# Image/font filenames match email regex — discard these
```

**Error Behavior:** HTTP fetch errors are caught and return `[]`. Never raises. Calling code treats empty result as "no email found" and advances to next waterfall tier.

---

### 2.5 Influencer Club

**File:** `apps/backend/src/services/external/influencer_club.py`

**Authentication:**
```
Authorization: Bearer {INFLUENCER_CLUB_API_KEY}
Base URL: https://api-dashboard.influencers.club
HTTP client: httpx.Client(timeout=60)
```

**Endpoints Used:**

| Operation | Method | Path | Request Body |
|-----------|--------|------|-------------|
| Similar creator discovery | POST | `/public/v1/discovery/creators/similar/` | `{handle, platform, limit}` |
| Keyword search | POST | `/public/v1/discovery/` | `{keyword, platform, limit}` |
| Instagram enrichment | POST | `/public/v1/creators/enrich/handle/full/` | `{handle, platform: "instagram", email_required: "must_have", include_lookalikes: false, include_audience_data: false}` |
| YouTube enrichment | POST | `/public/v1/creators/enrich/handle/full/` | `{handle, platform: "youtube", email_required: "must_have", ...}` |

**Response Structure Quirk:**
```python
# result.email is a sibling of result.<platform>, not nested inside
result_obj = response.json()
creator_data = result_obj.get(platform, {})  # instagram or youtube dict
if "email" in result_obj:
    creator_data["email"] = result_obj["email"]  # manual merge required
```

**Error Handling:** `response.raise_for_status()` — all HTTP errors propagate to Temporal activity retry policy. No custom error classification.

---

## 3. Product Scraping: Firecrawl

**File:** `apps/backend/src/services/external/firecrawl.py`

**User problem:** Campaign setup requires product name and description to populate outreach email templates and AI prompts. Firecrawl scrapes the product URL so operators don't need to copy-paste.

**Authentication:**
```python
AsyncFirecrawl(api_key=FIRECRAWL_API_KEY)
```

**Request Schema:**
```python
{
    urls: [product_url],
    prompt: "Extract the product information... Focus on the main product being sold.",
    schema: ScrapedProductResponse.model_json_schema(),
    maxAge: 14400000  # 4-hour server-side cache in milliseconds
}
```

**Response Schema:**
```python
ScrapedProduct:
  name: str          # Product name (e.g. "Premium Whey Protein Powder")
  description: str   # Short marketing description (1-3 sentences)
```

**Caching:** Firecrawl caches extractions server-side for 4 hours via `maxAge` parameter. Repeated scrapes of the same URL within 4 hours return cached data instantly, avoiding redundant browser renders.

**Error Classification:**

| Category | Non-retryable | Trigger Pattern |
|----------|---------------|----------------|
| Rate limit / 429 | False | "rate limit", "429", "quota" |
| Timeout | False | "timeout", "timed out" |
| Server errors 5xx | False | "500", "502", "503", "504" |
| Auth error 401/403 | True | "401", "403", "unauthorized" |
| Invalid URL / 404 | True | "invalid", "not found", "404" |
| No data returned | True | Empty/missing `data` in response |
| Unknown | False | All others (safe default: retry) |

---

## 4. Commerce: Shopify (via GoAffPro Proxy)

**File:** `apps/backend/src/services/external/shopify_proxy.py`

**User problem:** For gifting campaigns, when a creator provides their shipping address, the brand needs to create a Shopify order. Direct Shopify Admin API access would require storing Shopify credentials. Instead, GoAffPro (which brands already use for affiliate management) proxies GraphQL calls, keeping Shopify credentials in GoAffPro's custody.

**Authentication:**
```
x-goaffpro-access-token: {token}  # per-campaign, stored in DB
Target: https://api.goaffpro.com/v1/admin/store/system/api
GoAffPro then executes GraphQL against merchant's Shopify store
```

**Operations:**

#### Fetch Product Catalog
```graphql
{
  products(first: N) {
    edges {
      node {
        id
        title
        variants { edges { node { id title price } } }
      }
    }
  }
}
```
Returns list of `ShopifyProduct{id, title, variants: list[ShopifyVariant{id, title, price}]}`.

#### Create Order
```python
create_order_from_execution_output(
    email: str,
    phone: str | None,
    shipping_address: ShopifyAddress{first_name, last_name, address1, address2?, city, province_code, zip, country_code},
    line_items: list[ShopifyLineItem{variant_id, quantity}]
) -> ShopifyOrder
```

**Normalization Rules:**
```python
variant_id → GID format: "gid://shopify/ProductVariant/{id}"
country_code → uppercase: "pk" → "PK"
province_code → strip country prefix: "pk-pb" → "PB"
country_code in mutation → GraphQL ENUM (no quotes in query string)
```

**Error Types:**
```python
ShopifyProxyError(message: str, status_code: int | None)
    # Raised on: HTTP error from GoAffPro, GraphQL errors[], empty order response
    # Shopify "userErrors" returned in body — caller inspects separately
```

---

## 5. Slack Operations Integration

**File:** `apps/backend/src/services/external/slack_service.py`

**User problem:** For gifting campaigns, AI-extracted shipping details require human approval before Shopify order creation (addresses are unstructured and may have errors). Instead of requiring operators to open the webapp, an interactive Slack digest lets them approve, edit, or skip orders from their existing workflow.

**Authentication:**
```
Bot token: xoxb-* (for posting/updating messages, opening modals)
Permissions: chat:write, views:open, views:update
```

**Operations:**

```python
post_message(channel_id, blocks, text) -> SlackMessage{ts, channel}
    # Post new order digest; returns message timestamp for later updates

update_message(channel_id, ts, blocks, text) -> None
    # Refresh digest after operator action (e.g., "2 approved, 1 pending")

views_open(trigger_id, view) -> None
    # Open address edit modal when operator clicks "Edit"

views_update(view_id, view) -> None
    # Update modal content
```

**Order Digest Block Kit Structure:**
```
[Header block]: "Orders to Approve — {campaign_name}"
[Section block]: "{N} pending orders"
For each pending creator:
  [Divider]
  [Section]: "{creator_name} · @{handle}\n{email}\n{address_line1}, {city}\n{status_emoji}"
  [Actions]: [Approve] [Edit] [Skip]
    Action IDs: "approve_order_{cc_id}", "edit_order_{cc_id}", "skip_order_{cc_id}"
```

**Address Edit Modal Fields:**
- Email (text), Phone (text, optional)
- First Name, Last Name (text)
- Address Line 1, Address Line 2 (optional)
- City, Province/State Code, Zip/Postal Code, Country Code

**Interactive Payload Handling:**
The Slack webhook route (`/api/slack/interactive`) receives action payloads, parses `action_id` to extract `cc_id`, and dispatches:
- `approve_order_{cc_id}` → `ShopifyOrderService.create_order(cc_id)`
- `edit_order_{cc_id}` → `views.open` with edit modal
- `skip_order_{cc_id}` → `CampaignCreatorService.mark_skipped(cc_id)`

---

## 6. Analytics: PostHog

**User problem (webapp):** Track user behavior for product development — feature adoption, funnel drop-off, session recordings.

**User problem (context engine):** Internal team members query product metrics conversationally from Slack without opening the PostHog dashboard.

### 6.1 Webapp Integration

```javascript
// Provider: posthog-js
// Init: NEXT_PUBLIC_POSTHOG_KEY + NEXT_PUBLIC_POSTHOG_HOST env vars
// Features: session recording, feature flags, event capture
// Special: recording paused on /settings page (privacy)
// Dual flag system: GrowthBook + PostHog feature flags both active
```

### 6.2 Context Engine MCP Tools (9 tools)

**Authentication:** `Authorization: Bearer {POSTHOG_API_KEY}` to `{POSTHOG_HOST}/api/projects/{POSTHOG_PROJECT_ID}/`

| Tool | HTTP Endpoint | Purpose |
|------|---------------|---------|
| `posthog_query` | `POST /query/` | HogQL (SQL dialect) for custom analytics |
| `posthog_list_event_definitions` | `GET /event_definitions/` | Available event types + 30-day volumes |
| `posthog_list_property_definitions` | `GET /property_definitions/` | Event/person properties + query usage |
| `posthog_list_sessions` | `GET /session_recordings/` | Session recordings list with filters |
| `posthog_get_session` | `GET /session_recordings/{id}/` | Full session metadata |
| `posthog_list_insights` | `GET /insights/` | Saved dashboards and charts |
| `posthog_get_insight` | `GET /insights/{id}/` | Full insight config + result data |
| `posthog_list_annotations` | `GET /annotations/` | Deployment markers / incident notes |
| `posthog_list_feature_flags` | `GET /feature_flags/` | Feature flag status + rollout % |

All 9 tools: **READ-only**. All return XML strings. Supports `date_from`, `date_to`, `limit`, `offset` filtering where applicable.

**HogQL Example:**
```sql
SELECT event, count() as count
FROM events
WHERE timestamp > now() - interval 7 day
GROUP BY event
ORDER BY count DESC
LIMIT 20
```

---

## 7. LLM Observability: Langfuse

**File:** Referenced in all AI feature files; primary config in `apps/backend/src/services/ai/llm.py`

**User problem:** The system makes 14+ distinct types of AI calls per email thread, across multiple models, with prompts that need versioning per environment. Without tracing, debugging AI quality issues is impossible. Without prompt versioning, deploying prompt changes requires code deploys.

**Authentication:**
```
LANGFUSE_SECRET_KEY + LANGFUSE_PUBLIC_KEY + LANGFUSE_HOST
Langfuse(secret_key, public_key, host)  # initialized in LlmService
```

### 7.1 Prompt Management

```python
# Fetch pattern (every AI feature):
prompt = langfuse_client.get_prompt(
    name="drafting/reply-drafting-v13-rag",
    label=DeployEnvironment.for_prompt_version()
    # "production" | "staging" | "development"
)
model = prompt.config.get("model", fallback_model)  # per-prompt model override
compiled = prompt.compile(**template_variables)
```

**Prompt namespace conventions:**
```
drafting/reply-drafting-{type}            # Base draft (4 type variants: gifting/paid/sales/general)
drafting/reply-drafting-v13-rag-{type}    # RAG draft (4 variants)
review/intention-alignment                 # Draft quality review
review/content-accuracy                    # Draft fact-check
email-revision                             # o3 final revision
follow-up-generation                       # Follow-up email drafts
classification/opt-in-out                  # Opt-in/opt-out classifier
classification-follow-up                   # Thread completion check
classification                             # Campaign association verification
campaign-association                       # Campaign matching (Phase 1)
classify_downstream_workflows              # Workflow routing
thread-flags/extract                       # Flag extraction
creator-extraction/identify-creators       # Creator phase 1 identification
creator-extraction/extract-details         # Creator phase 2 detail extraction
creator-extraction/match-existing          # Creator deduplication
metrics-extraction                         # Campaign metrics extraction
metrics-review                             # Metrics validation
creator-notes/generate                     # Creator note generation
client-summary/generate                    # Campaign status summary
execute_user_workflows                     # Claude Agent SDK system prompt
```

**Fallback strategy:** Features with hardcoded fallback prompts: `creator-notes/generate`, `client-summary/generate`. All other features propagate Langfuse fetch failure to Temporal activity retry.

### 7.2 Tracing Architecture

```python
@langfuse.observe(as_type="span", capture_input=False)
def generate_draft_with_rag(thread_context, campaign_id, ...):
    with langfuse_client.start_as_current_generation(
        name="rag_fetch",
        model="text-embedding-3-small",
        input=rag_query,
        version=env_label,
    ) as gen:
        examples = rag_service.fetch_examples(...)
        gen.update(output=examples)

    with langfuse_client.start_as_current_generation(
        name="draft_generation",
        model=model,
        input=compiled_prompt,
        prompt=langfuse_prompt_obj,
        version=env_label,
    ) as gen:
        result = llm_service.parse_structured(...)
        gen.update(output=result)
```

**Session/user attribution:**
- `langfuse_session_id` = Gmail thread ID — clusters all AI calls within one thread processing run
- `langfuse_user_id` = operator email — enables per-user LLM usage cost tracking

---

## 8. AI Providers: Anthropic Claude + OpenAI

**File:** `apps/backend/src/services/ai/llm.py`

**User problem:** Different AI tasks benefit from different model families. A single provider-agnostic service routes by model name prefix, allowing any feature to use the best model for its task.

**Authentication:**
```
ANTHROPIC_API_KEY → anthropic.Anthropic(api_key=...)  # sync
                  → anthropic.AsyncAnthropic(...)       # async (Claude Agent SDK only)
OPENAI_API_KEY → openai.OpenAI(api_key=...)             # via standard env var
```

### 8.1 Provider Routing

```python
def parse_structured(model: str, prompt: str, response_model: Type[BaseModel], ...):
    if model.startswith("claude"):
        return self._parse_with_anthropic(...)
    else:
        return self._parse_with_openai(...)
```

### 8.2 Structured Outputs

**OpenAI:**
```python
client.responses.parse(text_format=response_model)
# Guarantees JSON schema compliance via structured outputs API
```

**Anthropic (Beta):**
```python
client.beta.messages.parse(
    betas=["structured-outputs-2025-11-13"],
    output_format=response_model
)
# Claude structured outputs beta — equivalent schema compliance
```

### 8.3 Model Selection Strategy

| Tier | Model | Use Case | Per-call Cost |
|------|-------|----------|--------------|
| Ultra-cheap | `gpt-4.1-nano` | Thread flags (runs on every thread) | ~$0.001 |
| Cheap | `gpt-4o-mini`, `gpt-5-mini` | Creator notes, follow-ups | ~$0.005 |
| Mid-tier | `gpt-4.1-mini` | 5+ classifiers (campaign association, opt-in, thread done, workflow routing, creator dedup) | ~$0.01 |
| Standard | `gpt-4.1` | Base draft, metrics, OCR/vision | ~$0.05 |
| Quality prose | `claude-haiku-4-5-20251001` | Thread summarization, client summary | ~$0.01 |
| Premium | `claude-opus-4-5-20251101` | RAG draft generation (flagship feature) | ~$0.30 |
| Complex extraction | `gpt-5.1` | Creator detail extraction (complex schema) | ~$0.50 |
| Max reasoning | `o3` | Draft revision (final quality pass, rarest call) | ~$2.00 |
| Training data prep | `claude-opus-4-20250514` | Reply sanitization (quality compounds into RAG) | ~$0.30 |
| Agent | `claude-opus-4-6` | Context Engine Slack bot, campaign workflow agent | ~$0.30+ |

### 8.4 Retry Policy

```python
# Per-LLM-call: tenacity retry
llm_service.retry_block(fn) → tenacity.stop_after_attempt(3) + wait_exponential()

# Temporal activity level (overrides tenacity for most features):
retry_policy=RetryPolicy(maximum_attempts=1)  # NO_RETRY for LLM activities
# Rationale: LLM failures should surface immediately, not mask errors via retry
```

### 8.5 Embeddings (RAG)

```python
# Provider: OpenAI
EmbeddingService.embed_text(text: str) -> list[float]
    # Model: text-embedding-3-small
    # Dimensions: 1536
    # Used for: RAG index (post-send) and RAG query (pre-draft)
```

---

## 9. Action Platform: Composio

**File:** `apps/backend/src/services/composio_adapter.py`

**User problem:** Power users want campaign workflows to trigger external actions (CRM updates, Google Sheets writes, GitHub issues) without Cheerful building a custom adapter for each. Composio provides 100+ pre-built integrations exposed as MCP-compatible tools.

**Authentication:**
```
COMPOSIO_API_KEY → composio_client (initialized once)
user_id: per-user Composio user ID (passed at action execution time)
```

**Schema Adaptation:**
```python
composio_to_mcp_schema(composio_schema: dict) -> dict:
    # Maps Composio schema to MCP-compatible tool definition
    # slug → name
    # input_parameters → inputSchema

create_composio_tool_wrapper(action_name: str, composio_client, user_id: str) -> AsyncCallable:
    # Returns async MCP handler function
    # Never raises — errors returned in response body:
    # {"success": True, "result": ...} or {"success": False, "error": "..."}
```

**Integration Context:** Composio tools are constructed at runtime in `CampaignWorkflow` execution. When a campaign has Composio-backed actions, the MCP server is built dynamically by merging native tools (GoAffPro, Apify) with Composio wrappers before Claude Agent invocation.

---

## 10. Google Sheets

**File:** `apps/backend/src/services/external/gsheet.py`

**User problem:** Campaign tracking (creator status, post metrics, content links) must flow into client reporting. Google Sheets is the industry standard for campaign reporting. The integration both reads sheets (for bulk creator import during campaign setup) and writes metrics extracted from email threads.

**Authentication:**
```
Service account JSON: GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON env var
google.oauth2.service_account.Credentials(scope: https://www.googleapis.com/auth/spreadsheets)
gspread.authorize(credentials) → client
IMPORTANT: Service account email must be shared on the target Sheet by the operator
```

**Read Path (campaign setup — bulk creator import):**
```python
client.open_by_url(url).worksheet(sheet_name)
headers = worksheet.row_values(1)      # Column names from row 1
rows = worksheet.get_all_records()     # List of {header: value} dicts
```

**Write Path (metrics extraction):**
```python
# Header normalization
normalize_header_name(header: str) -> str:
    header.lower().strip()
    .replace('"', '').replace("'", '')
    .replace(' ', '_').replace('-', '_')
    .replace('?', '').replace('\n', '_')

# HeaderToColumnMap: normalized_name → column_letter (A, B, C, ...)
# CellWrite: {range: "B5", values: [["value"]]}

worksheet.batch_update([CellWrite, ...])  # Single API call for all cells
```

**Data Type Handling:**
- Dates: `dateutil.parser` → `MM/DD/YY` format
- Booleans: `yes/y/true/ok` → `"Yes"`, `no/n/false` → `"No"`
- Numbers: passed through as-is

**Gifting Address Guard:**
```python
def should_skip_gifting_campaign_without_address(
    campaign_type, is_new_row, sheet_has_address_col, extracted_address
) -> bool:
    # Returns True (skip row) if:
    #   campaign_type == GIFTING
    #   AND is_new_row (not updating existing)
    #   AND sheet_has_address_col (sheet expects address)
    #   AND extracted_address is None/empty
    # Prevents creating partial tracking records for unshipped creators
```

**Task Queue Isolation:** Google Sheets operations run on a dedicated Temporal task queue `"google-sheets"` with a **single-thread executor**. This prevents write contention when multiple campaign threads extract metrics simultaneously.

**Error Handling:**
- `SpreadsheetNotFound` → sheet doesn't exist or service account not shared → propagates to Temporal retry
- `APIError` → permission denied or quota exceeded → propagates to Temporal retry (5× exponential)

---

## 11. Context Engine: Platform Integrations (MCP Tools)

The context engine exposes **38 MCP tools** across **7 platform integrations**, all available to the Claude Slack bot via the meta-tool pattern (`discover_tools` + `execute_tool`).

### Architecture

```
ToolRegistry (registry.py)
    ├── register(ToolDef) — validates, stores by name
    ├── list_tools(platforms) — filter by Platform tags
    └── call_tool(name, params, request_context) — validate params → handler

ToolDef:
    description: str
    input_model: Type[BaseModel]   # Pydantic for input validation
    tags: frozenset[Platform | Action]
    handler: async (ToolContext, DatabaseContext, RequestContext, params) -> str

Context Injection (always provided):
    ToolContext: all credentials (Slack tokens, Fly token, API keys, cheerful URL)
    DatabaseContext: SQLAlchemy session factory (optional, Clarify + Fly templates only)
    RequestContext: slack_user_id + cheerful_user_id (optional, identity-aware tools)
```

### Platform Summaries

#### Slack (4 tools — READ-only)
Auth: `slack_bot_token` (messages/channels), `slack_user_token` (search requires xoxp-)
- `slack_read_thread(channel_id, thread_ts)` — full thread XML
- `slack_read_channel(channel_id, limit)` — recent messages XML
- `slack_parse_link(slack_link)` — extract channel_id + message_ts from permalink
- `slack_search_messages(query, count)` — full-text search

#### Fly.io (8 tools — 4 READ + 4 WRITE)
Auth: `fly_api_token` + `fly_org_slug`
- `fly_launch_session(template, region, cpu_kind, cpus, memory_mb)` → WRITE: creates Fly app + machine
- `fly_stop_session(app_name)` → WRITE: deletes Fly app entirely
- `fly_get_session_status(app_name)` → READ: machine state + URLs
- `fly_list_sessions()` → READ: all active cheerful-* sessions
- `fly_list_images()` → READ: available Docker images
- `fly_list_templates(user_id?)` → READ: session templates catalog
- `fly_save_template(slug, name, fly_app, ...)` → WRITE: DB insert/update
- `fly_delete_template(slug, user_id)` → WRITE: DB delete (creator-only)

#### Clarify (4 tools — READ-only)
Auth: DB-backed meeting records (requires DatabaseContext)
- `clarify_list_meetings()` → all meetings XML
- `clarify_get_transcript(meeting_id, max_lines?)` → full transcript
- `clarify_get_summary(meeting_id)` → AI summary
- `clarify_search_transcripts(query, limit)` → keyword search

#### ACP — Anthropic Claude Protocol (4 tools — COMMUNICATION)
Auth: `app_name` routes to Fly.io session, which runs Claude Code
- `acp_health_check(app_name)` → health status
- `acp_list_tools(app_name)` → tools available on remote Claude
- `acp_send_message(app_name, message, timeout)` → delegate message to remote Claude
- `acp_call_tool(app_name, server, tool, params)` → call specific tool on remote session

**Use case:** Context Engine Claude can spawn and direct Claude instances in Fly.io sessions for long-running or compute-intensive tasks.

#### Onyx (2 tools — READ-only)
Auth: `onyx_api_key` + `onyx_base_url`
- `onyx_list_agents()` → available knowledge base agents
- `onyx_query(message, persona_id?)` → RAG answer + 5 cited documents

#### PostHog (9 tools — READ-only)
*Documented in Section 6.2 above.*

#### Cheerful (7 tools — READ-only)
Auth: `X-Service-Api-Key` header to Cheerful backend API
- `cheerful_list_campaigns()` → user's campaigns
- `cheerful_search_emails(campaign_id, query, direction?, limit)` → thread search
- `cheerful_get_thread(gmail_thread_id)` → full thread with all messages
- `cheerful_find_similar_emails(campaign_id, query|thread_id, limit, min_similarity)` → pgvector similarity search
- `cheerful_list_campaign_creators(campaign_id, gifting_status?, role?, limit)` → creators list
- `cheerful_get_campaign_creator(campaign_id, creator_id)` → full creator details
- `cheerful_search_campaign_creators(query, campaign_id?, limit)` → creator search

**User identity resolution:** Tools use `RequestContext.cheerful_user_id` with fallback to hardcoded Slack→UUID mapping in `tools/cheerful/constants.py` (9 users mapped per environment).

### MCP Tool Error Handling

```python
class ToolError(Exception):
    # User-facing error raised by any tool handler
    # Caught by meta-tools → returned as error text to Claude
    # Common triggers:
    #   raise ToolError("Missing credentials for X")
    #   raise ToolError("Database context required")
    #   raise ToolError(f"API returned {status}: {message}")
```

Claude receives `ToolError` messages as tool results and decides whether to retry, use a different approach, or report the failure to the user.

---

## 12. Cross-Cutting Integration Patterns

### Pattern 1: Error Classification (Retryable vs Non-Retryable)

All external service errors are wrapped in `ApplicationError(non_retryable=True/False)` before reaching Temporal. Consistent pattern across Apify, Firecrawl, Gmail, SMTP, and YouTube Apify:

```python
# Retryable (non_retryable=False):
#   Rate limits, quota exceeded, 429, 5xx, timeouts, unknown errors

# Non-retryable (non_retryable=True):
#   Auth failures (401, 403), invalid input, resource not found (404),
#   actor crashes, wrong-account send attempts
```

Temporal interprets `non_retryable=True` as immediate activity failure (no retry). This prevents burning compute on errors that would never succeed on retry.

### Pattern 2: Credential Encryption at Rest

All stored user credentials (Gmail OAuth tokens, SMTP/IMAP passwords) are encrypted before DB storage:
```python
crypto_service.encrypt(plaintext) → ciphertext  # stored in DB
crypto_service.decrypt(ciphertext) → plaintext  # at service construction
```
Supabase RLS provides a second layer: even if crypto layer fails, cross-user credential access is blocked at DB level.

### Pattern 3: Auth Method Selection

| Service | Auth Type | Rationale |
|---------|-----------|-----------|
| Gmail | OAuth 2.0 (per user) | Must send as the user's actual Gmail account |
| SMTP/IMAP | Username/password (per user) | Standard SMTP protocol |
| Google Sheets | Service account | Single backend identity for all clients |
| Apify, Firecrawl, Langfuse, etc. | API keys | Standard SaaS auth |

### Pattern 4: GoAffPro Proxy for Shopify

Shopify is never called directly. GoAffPro acts as a proxy, keeping Shopify credentials in GoAffPro's custody. This reduces Cheerful's credential exposure surface for a payment-sensitive service.

### Pattern 5: Enrichment Waterfall (Cost Optimization)

Email discovery follows strict cost ordering — cheapest tier first, short-circuit on success:
```
Free (bio link HTTP) → Cheap (Apify actor) → Paid ($0.005/result) → Expensive (subscription)
```

### Pattern 6: Context Engine as Read Layer

34 of 38 MCP tools are READ-only. Write capability is limited to 4 Fly.io session management tools. This design prevents the conversational AI from accidentally mutating campaign data, email drafts, or analytics — the context engine can only observe, not act on the core campaign pipeline.

### Pattern 7: Sync Activity Boundary

All external integrations run **synchronously** within Temporal activities (activities run in a thread pool, not async event loop). This is intentional:
- Temporal activities are independently retryable units
- Thread pool isolates failures
- No async/sync boundary complexity in activity code

Exception: `ShopifyProxyService.execute_graphql()` is `async` — it's called from async route handlers or async activity wrappers that bridge into the thread pool.

### Pattern 8: XML Output (Context Engine Tools)

All 38 MCP tools return XML strings rather than JSON or Python dicts:
```xml
<threads count="5">
  <thread id="..." campaign="..." status="pending">
    <subject>Re: Partnership Inquiry</subject>
    <last_message_at>2026-01-15T10:30:00Z</last_message_at>
  </thread>
</threads>
```
Rationale: Claude's training makes XML more effective than JSON for in-context parsing. XML tags serve as semantic markers Claude can reference across complex multi-tool reasoning chains.

---

## 13. Integration Environment Configuration

### Required Environment Variables (Backend)

```bash
# Email
GOOGLE_CLIENT_ID            # Gmail OAuth client
GOOGLE_CLIENT_SECRET        # Gmail OAuth secret

# Creator Discovery
APIFY_API_TOKEN             # Apify platform
APIFY_ACTOR_ID              # Lookalike Instagram actor (configurable)
APIFY_CHANNEL_SCRAPER_ACTOR_ID
APIFY_CHANNEL_FINDER_ACTOR_ID
APIFY_APIDOJO_FINDER_ACTOR_ID
APIFY_EMAIL_EXTRACTOR_ACTOR_ID
INFLUENCER_CLUB_API_KEY     # Paid enrichment fallback

# Product Scraping
FIRECRAWL_API_KEY

# Reporting
GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON  # Full JSON key (not a file path)

# AI Providers
ANTHROPIC_API_KEY
OPENAI_API_KEY

# LLM Observability
LANGFUSE_SECRET_KEY
LANGFUSE_PUBLIC_KEY
LANGFUSE_HOST               # e.g., https://cloud.langfuse.com

# Action Platform
COMPOSIO_API_KEY

# Slack Operations
SLACK_BOT_TOKEN             # xoxb-* for posting
SLACK_SIGNING_SECRET        # For webhook signature verification

# Credential Encryption
CRYPTO_SECRET_KEY           # AES key for Gmail/SMTP credential encryption
```

### Required Environment Variables (Context Engine)

```bash
# Slack Bot
SLACK_BOT_TOKEN             # xoxb-*
SLACK_USER_TOKEN            # xoxp-* (for search)
SLACK_APP_TOKEN             # xapp-* (Socket Mode)

# Fly.io
FLY_API_TOKEN
FLY_ORG_SLUG

# AI
ANTHROPIC_API_KEY

# Analytics
POSTHOG_API_KEY
POSTHOG_PROJECT_ID
POSTHOG_HOST

# Knowledge Base
ONYX_API_KEY
ONYX_BASE_URL

# Cheerful Backend
CHEERFUL_API_URL
CHEERFUL_API_KEY
```

---

## 14. Developer Implementation Notes

### Adding a New External Integration

1. Create service file in `apps/backend/src/services/external/{service}.py`
2. Implement operations as synchronous methods (Temporal activity constraint)
3. Wrap all errors in `ApplicationError(message, non_retryable=True/False, type=ErrorTypes.{SERVICE})`
4. Create Temporal activity in `apps/backend/src/temporal/activity/{domain}/`
5. Register activity in appropriate workflow; add to worker registration in `worker.py`
6. Add env vars to fly.prd.toml `[env]` section and GitHub Variables

### Adding a New Context Engine MCP Tool

1. Create tool file in `apps/context-engine/app/src_v2/mcp/tools/{platform}/`
2. Implement API layer in `api.py`, tool definitions in `tools.py` or `read.py`
3. Use `@tool` decorator with `Platform` and `Action` tags
4. Return XML string from all handlers; raise `ToolError` for user-facing errors
5. Register in `catalog.py` `ALL_TOOLS` list
6. Add credentials to `ToolContext` in `context.py` if new credentials needed

### Replacing an Integration

| Integration | Replacement Considerations |
|-------------|---------------------------|
| Gmail API | Must preserve RFC 2822 threading headers; maintain draft lifecycle |
| Apify (Instagram) | Lookalike actor is custom-built; would need new actor or different platform |
| Apify (YouTube) | 4-actor pipeline; could replace channel finder with YouTube Data API v3 (limited quota) |
| Influencer Club | Any creator database with email enrichment API and handle-based lookup |
| Firecrawl | Any web scraping service with structured extraction (Browserless, Playwright, Jina) |
| Google Sheets | Airtable, Notion databases, or CSV export would require write-path redesign |
| GoAffPro/Shopify | Direct Shopify Admin API (would require storing Shopify credentials) |
| Langfuse | Helicone, Braintrust, or Weights & Biases for LLM observability |
| PostHog | Amplitude, Mixpanel (would require context engine MCP tool rewrite) |
