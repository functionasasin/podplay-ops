# Integration Points Analysis

## Overview

Cheerful integrates with **13 external services** across 4 categories:
1. **Email** — Gmail API, SMTP/IMAP
2. **Social Data & Creator Discovery** — Apify (Instagram + YouTube), Influencer Club, Bio Link Scraper
3. **Productivity & Analytics** — Google Sheets, PostHog, Langfuse, Slack
4. **Commerce & Fulfillment** — Shopify (via GoAffPro proxy)
5. **Infrastructure & AI** — Anthropic Claude API, OpenAI, Firecrawl, Composio

All external service adapters live in `apps/backend/src/services/external/`. The context engine has its own parallel set of integrations exposed as MCP tools in `apps/context-engine/app/src_v2/mcp/tools/`.

---

## Integration 1: Gmail API

**File:** `apps/backend/src/services/external/gmail.py`

**User Problem Solved:** Campaign outreach is run from real Gmail accounts. Operators don't use a proprietary mailer — their brand's Gmail inbox IS the system of record. Gmail API provides read/send/draft capabilities over these real accounts.

### Auth Method

- **OAuth 2.0** with offline access (refresh tokens stored in `user_gmail_account.refresh_token`, encrypted at rest via `crypto_service.decrypt()`)
- **Scopes:** `gmail.modify`, `gmail.send`, `gmail.labels`
- **Credential refresh:** `google.oauth2.credentials.Credentials` auto-refreshes via `credentials.refresh(Request())` if expired
- **Client ID/Secret:** `settings.GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (env vars)

### Data Exchanged

| Direction | Data |
|-----------|------|
| Inbound (read) | Raw RFC 2822 messages via `format='raw'`, history deltas via `startHistoryId`, thread metadata, send-as aliases |
| Outbound (send) | Base64url-encoded MIME multipart messages (`multipart/alternative` with text+HTML parts) |

### Key Operations

```python
GmailService.for_user(email)           # Create auth'd client from stored OAuth
get_history(start_history_id)          # Poll for new messages since last checkpoint
get_message(message_id)                # Fetch full RFC 2822 message
get_messages_batch(ids)                # Sequential batch fetch (skips 404s)
get_messages_in_chunks(ids, size=50)   # Iterator for large batches
list_messages(query, max_results=500)  # Paginated query (for historical migration)
create_draft(...)                      # Create Gmail draft (returns GmailApiDraft)
delete_draft(draft_id)                 # Delete draft (no-op if already gone)
send_draft(draft_id)                   # Atomically send draft → returns thread_id
send_message_direct(...)               # Send without draft (for initial outreach)
get_profile()                          # Account profile (historyId, email)
list_send_as()                         # Aliases for direction detection
```

### Threading

RFC 2822 threading headers are explicitly managed:
- `In-Reply-To: <message-id>` — identifies parent message
- `References: <chain of IDs>` — full thread chain
- `threadId` parameter on send — groups into existing thread

### Failure Modes

| Error | Strategy |
|-------|----------|
| Token refresh failure | Propagates to Temporal activity → retry with exponential backoff |
| 404 on message fetch | Silently skipped (`is_gmail_404_error()`) — message may have been deleted |
| Gmail API quota exceeded | `ErrorHandler.handle_gmail_api_error()` → Temporal retry |
| `From` email mismatch | Non-retryable `ApplicationError` — prevents sending from wrong account |

### Error Classification

All Gmail errors route through `ErrorHandler.handle_gmail_api_error()` which maps HTTP status codes to `ApplicationError(non_retryable=True/False)`. The Temporal worker interprets `non_retryable=True` as no-retry.

### Unicode Edge Case

`send_message_direct()` applies RFC 2047 encoding (`=?UTF-8?B?...?=`) to subjects containing emojis — required by Gmail API for non-ASCII characters.

---

## Integration 2: SMTP / IMAP

**File:** `apps/backend/src/services/external/smtp_email.py`

**User Problem Solved:** Not all campaign senders use Gmail. SMTP support allows any email server (Outlook, custom domains, G Suite via app passwords) to participate in campaigns. IMAP is used to store/retrieve drafts from the actual email server's Drafts folder (ensuring operator sees drafts in their normal email client).

### Auth Method

- **SMTP credentials:** Username + password stored in `user_smtp_account`, encrypted at rest
- **TLS mode:** Port 465 → implicit SSL (`SMTP_SSL`); other ports → STARTTLS if `smtp_use_tls=True`
- **IMAP credentials:** Separate username/password (may differ from SMTP), SSL via `IMAP4_SSL`

### Data Exchanged

| Direction | Data |
|-----------|------|
| SMTP send | MIME multipart message bytes |
| IMAP draft write | `APPEND` to "Drafts" folder with `\Draft \Seen` flags |
| IMAP draft read | `UID FETCH` → RFC 2822 bytes |
| IMAP draft delete | `UID STORE` `+FLAGS \\Deleted` + `EXPUNGE` |

### Draft Lifecycle

1. `create_draft()` → IMAP APPEND → returns `SmtpDraft{uid, message_id}`
2. `send_draft(uid)` → IMAP FETCH RFC822 → parse recipients → SMTP send → IMAP delete
3. `delete_draft(uid)` → IMAP UID STORE \Deleted + EXPUNGE

**Key difference from Gmail:** SMTP draft IDs are IMAP UIDs (server-assigned integers); Gmail draft IDs are Google-assigned strings. The `send_draft()` flow retrieves the draft from IMAP then sends via SMTP — ensuring send matches exactly what operator sees in their Drafts folder.

### APPENDUID Parsing

Server response to IMAP APPEND returns `[APPENDUID <uidvalidity> <uid>]`. The service parses this to capture the UID for later operations. Falls back to `"unknown"` if server doesn't support `APPENDUID` capability.

### Failure Modes

| Error | Strategy |
|-------|----------|
| SMTP auth failure | `smtplib.SMTPAuthenticationError` propagates → Temporal retry |
| SMTP connection failure | `smtplib.SMTPConnectError` propagates → Temporal retry |
| Draft UID not found | Non-retryable `ApplicationError` (draft deleted externally) |
| IMAP connection issues | Exception propagates from `_get_imap_connection()` → retry |

---

## Integration 3: Apify (Instagram)

**File:** `apps/backend/src/services/external/apify.py`

**User Problem Solved:** Brands need to discover Instagram creators similar to ones they've worked with, and search by niche keyword. Apify runs browser automation at scale to scrape Instagram data that isn't available via official API.

### Auth Method

- **Apify API token** — `Authorization: Bearer {token}` via `ApifyClient` SDK
- Token stored as env var, injected into service at construction

### Actors Used

| Actor | ID | Purpose |
|-------|----|---------|
| Lookalike finder | Custom (configurable `actor_id`) | Finds similar Instagram profiles to a seed user |
| Instagram Scraper | `apify/instagram-scraper` (hardcoded) | Keyword search for users |

### Data Exchanged

**Lookalike search** (`get_lookalike_creators`):
- Input: `{inputs: [username], type: "similar_users", profileEnriched: true, maxItem: N}`
- Output: `ApifyActorResult{profiles: list[ApifyInstagramProfile], run_id, seed_username}`
- Profile fields: `username, full_name, biography, follower_count, profile_pic_url, is_verified, external_url, category, public_email, media_count, following_count, city_name`

**Keyword search** (`search_creators_by_keyword`):
- Input: `{search: keyword, searchType: "user", searchLimit: N, resultsType: "details"}`
- Output: Same `ApifyActorResult` format but with camelCase field mapping from instagram-scraper

### Execution Model

Synchronous actor run: `client.actor(id).call(run_input)` — blocks until actor completes. For lookalike searches this can take 30-120 seconds. Wrapped in Temporal activities with `schedule_to_close_timeout` to prevent indefinite hangs.

### Failure Modes

| Error | `non_retryable` | Trigger |
|-------|----------------|---------|
| Rate limit / quota | `False` (retry) | "rate limit", "quota", "too many requests" in message |
| Auth failure | `True` | "unauthorized", "forbidden", "401", "403" |
| Invalid input / 404 | `True` | "invalid", "not found", "404" |
| Actor returns `None` | `True` | Run call returned None (actor crash) |
| No dataset ID | `True` | Dataset not created (actor setup failure) |
| Unknown error | `False` (retry) | All other exceptions |

All errors wrapped in `ApplicationError` with `type=ErrorTypes.APIFY` for structured error tracking in Rollbar.

---

## Integration 4: Apify (YouTube)

**File:** `apps/backend/src/services/external/youtube_apify.py`

**User Problem Solved:** YouTube creators are increasingly important for brand campaigns. This service discovers YouTube channels with audience overlap to a given seed channel, then finds their contact emails for outreach.

### Auth Method

Same Apify API token as Instagram integration.

### Actors Used

| Actor | ID Source | Purpose |
|-------|-----------|---------|
| Channel scraper | `channel_scraper_actor_id` (configurable) | `streamers/youtube-channel-scraper` — fetch channel details + recent videos |
| Channel finder (slow) | `channel_finder_actor_id` (configurable) | `coregent/youtube-channel-finder` — keyword search |
| Channel finder (fast) | `apidojo_finder_actor_id` (configurable) | `apidojo/youtube-channel-information-scraper` — 166 channels/second |
| Email extractor | `email_extractor_actor_id` (configurable) | `endspec/youtube-channel-contacts-extractor` — extract contact emails |

### Full Pipeline (`get_lookalike_channels`)

```
Step 1: get_channel_details(channel_url)
    → Channel scraper actor → YouTubeChannelDetails{channel_id, name, description, subscriber_count, recent_videos}
    → extract_channel_email() for seed channel

Step 1b: extract_channel_email() — 3-tier waterfall
    Tier 1: regex email from description (free, instant)
    Tier 1.5: scrape link-in-bio pages via direct HTTP (bio_link_apify.scrape_emails_from_url)
    Tier 2: endspec/youtube-channel-contacts-extractor Apify actor ($0.005/result)

Step 2: _extract_keywords_with_llm(channel, llm_service)
    → gpt-4.1-mini structured output → KeywordExtractionResult{keywords: list[str] (2-3 items)}
    → Prompt: channel name + description + subscriber count + recent video titles
    → Target: "what a FAN of this channel would search to find MORE channels like it"

Step 3: find_similar_channels_fast(keywords, max_results=search_pool_size)
    → apidojo actor (falls back to coregent if unconfigured) → list[YouTubeChannelFinderResult]
    → Filter out seed channel by channel_id

Step 3b: extract_channel_email() for each similar channel (parallel, max 10 workers)
    → ThreadPoolExecutor, errors silently logged
    → Sort: channels with emails first

Result: YouTubeLookalikeResult{seed_channel, similar_channels (email-sorted), keywords_used}
```

### Field Mapping Complexity

`apidojo` actor uses different field names than `coregent` actor. The service normalizes both to `YouTubeChannelFinderResult` with fields: `ChannelId`, `ChannelName`, `ChannelHandle`, `ChannelURL`, `SubscriberCount`, `VideoCount`, `Description`, `Keywords`, `IsVerified`.

### LLM Integration Point

YouTube discovery is the **only place outside the main AI features** where LLM is called inline (not via Temporal activity). `_extract_keywords_with_llm()` calls `LlmService.parse_structured()` directly within the synchronous actor pipeline. This is acceptable because the whole pipeline runs inside a Temporal activity with its own timeout.

---

## Integration 5: Bio Link Scraper

**File:** `apps/backend/src/services/external/bio_link_apify.py`

**User Problem Solved:** Creators on both Instagram and YouTube often list their business email not on the platform itself but on link-in-bio services (Linktree, Beacons, etc.). This scraper extracts emails from those pages without requiring Apify or any paid API.

### Auth Method

No auth — direct HTTP GET with browser-like User-Agent header.

### Supported Platforms

```python
SUPPORTED_DOMAINS = {"linktr.ee", "beacons.ai", "bio.link", "stan.store", "link.me"}
```

### Extraction Strategy (3-step)

1. **mailto: links** — regex `mailto:([^"'&?\s]+)` in raw HTML
2. **`__NEXT_DATA__` JSON** — Next.js hydration data (used by link.me) parsed recursively for email-looking strings
3. **Raw email regex** — fallback scan of entire HTML for `[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}`

### False Positive Filtering

Emails ending in `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`, `.woff`, `.woff2`, `.ttf`, `.eot` are discarded — these are image/font filenames matched by the regex.

### Failure Modes

HTTP fetch errors are logged and return `[]` (never raises) — the calling code treats empty result as "no email found" and proceeds to next tier.

---

## Integration 6: Influencer Club

**File:** `apps/backend/src/services/external/influencer_club.py`

**User Problem Solved:** Paid third-party creator database as the final fallback in the email enrichment waterfall. When free methods (platform scraping, bio link crawling) fail to find a creator's email, Influencer Club provides a comprehensive database of creator contact information.

### Auth Method

- **Bearer token** — `Authorization: Bearer {api_key}` (env var `INFLUENCER_CLUB_API_KEY`)
- **Base URL:** `https://api-dashboard.influencers.club`
- HTTP client: `httpx.Client` with 60s timeout

### Endpoints Used

| Operation | Method | Path | Purpose |
|-----------|--------|------|---------|
| Similar creator discovery | POST | `/public/v1/discovery/creators/similar/` | Find creators similar to a handle |
| Keyword search | POST | `/public/v1/discovery/` | AI search by keyword |
| Instagram enrichment | POST | `/public/v1/creators/enrich/handle/full/` | Get email + full profile |
| YouTube enrichment | POST | `/public/v1/creators/enrich/handle/full/` | Same endpoint, `platform=youtube` |

### Enrichment Data

Request: `{handle, platform, email_required: "must_have", include_lookalikes: false, include_audience_data: false}`

Response structure quirk: `result.email` is a sibling of `result.<platform>` (not nested inside), so the service manually merges:
```python
creator_data = result_obj.get(platform, {})
if "email" in result_obj:
    creator_data["email"] = result_obj["email"]
```

### Failure Modes

`response.raise_for_status()` — HTTP errors propagate to Temporal activity retry policy. No custom error classification — any HTTP error is treated as retryable by the Temporal retry policy.

---

## Integration 7: Firecrawl

**File:** `apps/backend/src/services/external/firecrawl.py`

**User Problem Solved:** When a campaign is being configured, the operator provides a product URL. Instead of requiring manual copy-paste of product name/description, Firecrawl scrapes the e-commerce page and extracts structured product data for pre-populating campaign fields.

### Auth Method

- **Firecrawl API key** — passed to `AsyncFirecrawl(api_key=...)` SDK
- HTTP via the `firecrawl` Python SDK

### Data Exchanged

Request:
```python
{
    urls: [product_url],
    prompt: "Extract the product information... Focus on the main product being sold.",
    schema: ScrapedProductResponse.model_json_schema(),
    maxAge: 14400000  # 4-hour cache
}
```

Response: `ScrapedProduct{name: str, description: str}` via `AsyncFirecrawl.extract()`

### Caching

`maxAge: 14400000ms` (4 hours) — Firecrawl caches extraction results server-side, so repeated scrapes of the same URL within 4 hours return cached data without a fresh browser render.

### Failure Modes

| Error Category | `non_retryable` | Trigger |
|----------------|----------------|---------|
| Rate limit / 429 | `False` | "rate limit", "429", "quota" |
| Timeout | `False` | "timeout", "timed out" |
| Server errors 5xx | `False` | "500", "502", "503", "504" |
| Auth error 401/403 | `True` | "401", "403", "unauthorized" |
| Invalid URL / 404 | `True` | "invalid", "not found", "404" |
| No data returned | `True` | Empty/missing `data` in response |
| Unknown | `False` (safe default) | All others |

---

## Integration 8: Google Sheets (gspread)

**File:** `apps/backend/src/services/external/gsheet.py`

**User Problem Solved:** Campaign outcome data (creator status, post metrics, content links) needs to flow into brand client reporting. Google Sheets is the industry-standard format for this. The integration:
1. **Reads** sheets for recipient list import (campaign setup)
2. **Writes** extracted email thread metrics into campaign tracking sheets

### Auth Method

- **Service account** — JSON key stored in `settings.GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON`
- `google.oauth2.service_account.Credentials` with scope `https://www.googleapis.com/auth/spreadsheets`
- `gspread.authorize(credentials)` → client
- **Important:** Service account email must be shared on the Google Sheet by the operator during campaign setup

### Data Exchanged

**Read path** (recipient import):
- `worksheet.row_values(1)` → headers
- `worksheet.get_all_records()` → list of row dicts

**Write path** (metrics extraction):
- `HeaderToColumnMap` — maps normalized header names to column letters (A, B, C, ...)
- `CellWrite{range: "B5", values: [["value"]]}` → batch update
- `worksheet.batch_update(cell_writes)` — single API call writes all cells

### Column Normalization

Header names are normalized via `normalize_header_name()`:
```python
header.lower().strip().replace('"', '').replace("'", '').replace(' ', '_').replace('-', '_').replace('?', '').replace('\n', '_')
```

Supported date format: `MM/DD/YY` via `dateutil.parser`. Booleans normalized: `yes/y/true/ok` → `"Yes"`, `no/n/false` → `"No"`.

### Address Guard (Gifting Campaigns)

For GIFTING campaigns creating **new rows** (not updating existing ones): if the sheet has an address column and the extracted metrics don't include a valid address, the row write is **skipped entirely**. This prevents creating partial tracking records for creators who haven't yet provided shipping details.

```python
def should_skip_gifting_campaign_without_address(...) -> bool:
    # Returns True (skip) if: gifting campaign + new row + address column exists + address missing
```

### Failure Modes

`gspread.exceptions.SpreadsheetNotFound` — sheet doesn't exist or service account not shared.
`gspread.exceptions.APIError` — permission denied or quota exceeded.
Both propagate to Temporal's Google Sheets task queue (isolated single-thread executor to prevent write contention).

---

## Integration 9: Shopify (via GoAffPro Proxy)

**File:** `apps/backend/src/services/external/shopify_proxy.py`

**User Problem Solved:** For gifting campaigns, when a creator provides their shipping address, the brand needs to place a Shopify order without giving the AI system direct Shopify admin access. GoAffPro acts as a secure proxy, exposing Shopify's GraphQL API through its own authenticated endpoint.

### Auth Method

- **GoAffPro access token** — `x-goaffpro-access-token` header (stored per campaign in DB)
- Proxies to: `https://api.goaffpro.com/v1/admin/store/system/api`
- GoAffPro then executes the GraphQL against the merchant's Shopify store

### Data Exchanged

**Product catalog fetch** (`get_products`):
```graphql
{ products(first: N) { edges { node { id title variants { edges { node { id title price } } } } } } }
```

**Order creation** (`create_order_from_execution_output`):
- Input: `{email, phone?, shipping_address: {first_name, last_name, address1, address2?, city, province_code, zip, country_code}, line_items: [{variant_id, quantity}]}`
- Variant IDs normalized to Shopify GID format: `gid://shopify/ProductVariant/{id}`
- Country code is a **GraphQL enum** (unquoted in mutation) — province/country codes are uppercased

### Address Normalization

```python
_normalize_country_code("pk") → "PK"
_normalize_province_code("pk-pb") → "PB"  # ISO format stripped of country prefix
```

### Failure Modes

| Error Type | Handler |
|------------|---------|
| HTTP error from GoAffPro | `ShopifyProxyError(message, status_code)` |
| GraphQL errors in response | `ShopifyProxyError` after checking `result.errors[]` |
| Shopify `userErrors` | Returned in response body (validation failures at Shopify layer) |
| Empty order response | `ShopifyProxyError("Shopify returned empty order response")` |

---

## Integration 10: Slack (Operations)

**File:** `apps/backend/src/services/external/slack_service.py`

**User Problem Solved:** For gifting campaigns, when AI-extracted shipping details need human approval before Shopify order creation, the system pushes an interactive digest to Slack. Operators approve, skip, or edit orders directly from Slack without opening the webapp.

### Auth Method

- **Slack Bot token** — `xoxb-*` token, `slack_sdk.WebClient(token=bot_token)`
- Permissions needed: `chat:write`, `views:open`, `views:update`

### Operations

| Method | Slack API | Purpose |
|--------|-----------|---------|
| `post_message(channel, blocks, text)` | `chat.postMessage` | Post order digest with action buttons |
| `update_message(channel, ts, blocks, text)` | `chat.update` | Refresh digest after approval/skip |
| `views_open(trigger_id, view)` | `views.open` | Open edit modal when operator clicks "Edit" |
| `views_update(view_id, view)` | `views.update` | Update modal content |

### Block Kit Structure

Order digest blocks:
```
[Header: "Orders to Approve — {campaign_name}"]
[Section: "{N} pending orders"]
For each order:
  [Divider]
  [Section: creator name · handle\nemail\naddress\nstatus emoji]
  [Actions: [Approve] [Edit] [Skip]]
```

Edit modal: Input blocks for email, phone (optional), first/last name, address, city, province, zip, country.

### Interactive Payload

Action IDs encode creator ID:
- `approve_order_{cc_id}` — triggers Shopify order creation via API endpoint
- `edit_order_{cc_id}` — opens edit modal via `views.open`
- `skip_order_{cc_id}` — marks creator as skipped

The webhook handler (in the route layer) receives Slack interactive payloads, parses `action_id`, and dispatches accordingly.

---

## Integration 11: PostHog (Product Analytics)

**Context:** Used both by the webapp (client-side) and by the context engine MCP tools (query interface).

**User Problem Solved (webapp side):** Track user behavior for product development. PostHog is configured as the analytics provider in the Next.js webapp.

**User Problem Solved (context engine side):** Internal team members can query product analytics from Slack without opening PostHog dashboard.

### Webapp Integration

The webapp uses `posthog-js` with:
- `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` env vars
- Recording paused on `/settings` page
- GrowthBook and PostHog feature flags both used (dual flag system)
- Session recording for user behavior analysis

### Context Engine MCP Tools

**File:** `apps/context-engine/app/src_v2/mcp/tools/posthog/`

Auth: `Authorization: Bearer {posthog_api_key}` to `{posthog_host}/api/projects/{project_id}/`

9 tools:
- `posthog_query` — HogQL (SQL dialect) for custom analytics queries
- `posthog_list_event_definitions` — Available event types + 30-day volumes
- `posthog_list_property_definitions` — Event/person properties + usage
- `posthog_list_sessions` / `posthog_get_session` — Session recordings
- `posthog_list_insights` / `posthog_get_insight` — Saved dashboards/charts
- `posthog_list_annotations` — Deployment markers / incident notes
- `posthog_list_feature_flags` — Feature flag status + rollout %

All return XML strings. All read-only.

---

## Integration 12: Langfuse (LLM Observability)

**File:** `apps/backend/src/services/ai/llm.py` (indirectly via all AI features)

**User Problem Solved:** Every AI call across 14+ features needs to be traced, versioned, and monitorable. Langfuse provides both prompt management (versioned prompts by environment label) and LLM call tracing.

### Auth Method

- **Secret/Public key pair** — `LANGFUSE_SECRET_KEY` + `LANGFUSE_PUBLIC_KEY` + `LANGFUSE_HOST`
- `Langfuse(secret_key, public_key, host)` client initialized in `LlmService`

### Prompt Management

```python
DeployEnvironment.for_prompt_version() → "production" | "staging" | "development"
langfuse_client.get_prompt(name, label=env_label) → compiled prompt
```

Prompts live in Langfuse UI; backend fetches by name + environment label at call time. Includes `prompt.config["model"]` for per-prompt model override. All features have hardcoded fallback system prompts if Langfuse is unavailable.

### Tracing

```python
@langfuse.observe(as_type="span", capture_input=False)
def feature_function(...):
    with langfuse_client.start_as_current_generation(
        name="function_name",
        model=model,
        input=compiled_prompt,
        prompt=langfuse_prompt_object,
        version=env_label,
    ) as generation:
        ...
```

Session/user attribution: `langfuse_session_id` = Gmail thread ID, `langfuse_user_id` = user email — enables full tracing of all LLM calls within one thread processing run.

### Failure Modes

If Langfuse prompt fetch fails at runtime → features with hardcoded fallbacks (creator note, client summary) use them; others propagate exception to Temporal activity retry.

---

## Integration 13: Anthropic Claude API & OpenAI

**File:** `apps/backend/src/services/ai/llm.py`

**User Problem Solved:** The AI features require two LLM providers because different tasks benefit from different model families. The `LlmService` is provider-agnostic, routing by model name prefix.

### Auth Method

- `ANTHROPIC_API_KEY` → `anthropic.Anthropic(api_key=...)` or `anthropic.AsyncAnthropic(...)`
- `OPENAI_API_KEY` → `openai.OpenAI(api_key=...)` (via standard env var)

### Provider Routing

```python
def parse_structured(model, prompt, response_model, ...):
    if model.startswith("claude"):
        return self._parse_with_anthropic(...)
    else:
        return self._parse_with_openai(...)
```

### OpenAI Structured Outputs

`client.responses.parse(text_format=response_model)` — guarantees JSON schema compliance.

### Anthropic Structured Outputs (Beta)

`client.beta.messages.parse(betas=["structured-outputs-2025-11-13"], output_format=response_model)` — Claude's equivalent structured outputs beta.

### Retry Policy

`llm_service.retry_block(fn)` → `tenacity.stop_after_attempt(3)` + `wait_exponential()`. After 3 attempts, exception propagates to Temporal activity which has its own retry policy.

### Async Variant

`ClaudeAgentService` uses `anthropic.AsyncAnthropic` for streaming the Claude Agent SDK loop. All other uses are synchronous via `anthropic.Anthropic` (activities run in thread pool, not async event loop).

---

## Integration 14: Composio

**File:** `apps/backend/src/services/composio_adapter.py`

**User Problem Solved:** Power users want to trigger hundreds of pre-built integrations (Google Sheets, GitHub, email, CRMs) from AI-powered campaign workflows without Cheerful building custom adapters for each. Composio provides a universal connector platform.

### Auth Method

- `COMPOSIO_API_KEY` + user-specific Composio `user_id` (passed at action execution time)
- `composio_client` initialized with API key; actions executed as specific user

### Schema Adaptation

```python
composio_to_mcp_schema(composio_schema):
    # Maps: slug → name, input_parameters → inputSchema
    # Returns MCP-compatible tool definition

create_composio_tool_wrapper(action_name, composio_client, user_id):
    # Returns async MCP handler function
    # Never raises — errors returned in response body
    # Returns: {"success": True/False, "result"/"error": ...}
```

### Usage Context

Used in `CampaignWorkflow` execution pipeline (via `ClaudeAgentService`). When a campaign workflow requires a Composio-backed action, the MCP server is constructed at runtime with the Composio wrapper alongside native tools.

---

## Integration 15: Context Engine — Slack Bot

**File:** `apps/context-engine/app/src_v2/entrypoints/slack_bot.py` (referenced in context-engine-core analysis)

**User Problem Solved:** Team members use Slack as their primary communication tool. The context engine Slack bot lets them query all integrated systems (Cheerful campaign data, analytics, meetings, etc.) conversationally without opening multiple tools.

### Auth Method

- **Bot token** (`xoxb-*`) — for posting messages
- **User token** (`xoxp-*`) — for searching Slack (requires user-level permissions)
- **App-level token** (`xapp-*`) — for Socket Mode (persistent WebSocket connection)
- Socket Mode: no public HTTP endpoint needed, works behind firewalls

### Context Engine → Other Services

The Slack bot routes user messages to Claude, which then selects from the 38 MCP tools across all 7 platforms (Slack, Fly, Clarify, ACP, Onyx, PostHog, Cheerful). All credentials are stored in `ToolContext` and injected at tool invocation time.

### Data Exchanged

- **Read:** Slack messages, threads, channel history, search results
- **Write:** Post/update messages in channels (real-time status updates), open/update modals (via `slack_service.py`)

---

## Integration Map Summary

```
                    ┌─────────────────────────────────────────┐
                    │           External World                  │
                    └─────────────────────────────────────────┘
                              │
    ┌─────────────────────────┼─────────────────────────────────┐
    │                         │                                  │
    ▼                         ▼                                  ▼
┌─────────┐          ┌──────────────┐                  ┌────────────────┐
│ Gmail   │          │ Creator Data │                  │ Analytics/Ops  │
│ API     │          │              │                  │                │
│ SMTP/   │          │ Apify (IG)   │                  │ PostHog        │
│ IMAP    │          │ Apify (YT)   │                  │ Langfuse       │
└────┬────┘          │ Bio Link     │                  │ Slack (ops)    │
     │               │ Influencer   │                  └───────┬────────┘
     │               │ Club         │                          │
     ▼               └──────┬───────┘                         │
┌─────────────────────────────────────────────────────────────▼──────┐
│                    Backend API + Temporal Workflows                  │
│                                                                      │
│  Gmail ─→ Message Ingestion ─→ Thread State ─→ AI Processing       │
│  SMTP ──→ (parallel path)   ─→                                      │
│  Apify ─→ Creator Discovery ─→ Enrichment Waterfall                │
│  IC ────→ (final fallback)                                          │
│                                                                      │
│  AI Drafting ─→ Anthropic/OpenAI via LlmService                    │
│  Prompt Mgmt ─→ Langfuse                                            │
│  GSheets ────→ Metrics extraction write-back                        │
│  Shopify ────→ Order creation (GoAffPro proxy)                     │
│  Slack ──────→ Approval digest for gifting orders                  │
│  Firecrawl ──→ Product page scraping (campaign setup)              │
│  Composio ───→ AI workflow actions (runtime-wired)                 │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────┐
│     Context Engine (Slack Bot)   │
│                                  │
│  MCP Tools → All integrations    │
│  via 38 tools / 7 platforms      │
└─────────────────────────────────┘
```

---

## Integration Design Patterns

### 1. Error Classification: Retryable vs Non-Retryable

All external service errors are wrapped in `ApplicationError(non_retryable=True/False)` before reaching Temporal. This ensures:
- Transient errors (rate limits, timeouts, 5xx) → Temporal retries with backoff
- Permanent errors (auth failures, invalid inputs, not-found) → Fast fail, no wasted retries

Pattern is consistent across: Apify, Firecrawl, SMTP, YouTube Apify.

### 2. Credential Encryption at Rest

All stored credentials (Gmail OAuth tokens, SMTP passwords, IMAP passwords) are encrypted using `crypto_service` before DB storage and decrypted at service construction time. Supabase RLS prevents cross-user access even if crypto layer fails.

### 3. Service Account vs OAuth per Service

| Service | Auth Type | Reason |
|---------|-----------|--------|
| Gmail | OAuth (per user) | Sends as the user's actual Gmail account |
| SMTP | Username/password (per user) | Standard SMTP auth |
| Google Sheets | Service account | Single backend identity writes metrics |
| All others | API keys | Standard SaaS API auth |

### 4. Proxy Pattern for Shopify

Shopify is never called directly — GoAffPro proxies all GraphQL calls. This keeps Shopify credentials scoped to GoAffPro's custody rather than needing full Shopify Admin API credentials in Cheerful's backend. Reduces credential exposure surface.

### 5. Cost Optimization in Enrichment Waterfall

Email enrichment follows strict cost order:
1. Bio link scraping — FREE (direct HTTP)
2. Platform profile scraping via Apify — CHEAP (~$0.001/run)
3. YouTube email extractor via Apify — PAID ($0.005/result)
4. Influencer Club enrichment — MOST EXPENSIVE (subscription API)

Short-circuit on first success ensures minimal API costs.

### 6. Context Engine as Read Layer

The context engine MCP tools provide **read-only** access to all integrated systems (34/38 tools are READ). Write capability is limited to Fly.io session management (4 tools). This design prevents the conversational AI from accidentally mutating campaign data, email drafts, or analytics.

### 7. Async vs Sync Integration Boundary

All external integrations run synchronously within Temporal activities (activity functions are sync, run in thread pool). This is intentional:
- Temporal activities can be retried independently
- Thread pool isolates failures
- No async/sync boundary issues in activity code

Exception: `ShopifyProxyService.execute_graphql()` is `async` — it's called from an async activity wrapper or an async route handler.
