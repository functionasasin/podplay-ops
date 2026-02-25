# Backend Services & Repositories Analysis

## Overview

The backend business logic is organized into two tiers:
1. **Services** — business logic, orchestration, external calls
2. **Repositories** — typed database access layer wrapping SQLAlchemy Core queries

Services are grouped by domain; repositories follow a 1-per-table pattern with a `BaseRepository[Model]` generic base class.

---

## Repository Architecture

### Base Pattern

**File**: `src/repositories/base.py`

```python
class BaseRepository(Generic[Model]):
    def __init__(self, db: Session, model: type[Model]):
        self.db = db
        self.model = model
```

Every repository takes a `Session` dependency-injected at call time. No singletons — fresh per request or Temporal activity. This prevents cross-request state leakage.

### Idempotency Convention

Repositories use PostgreSQL `INSERT ... ON CONFLICT DO NOTHING` for all operations that can be retried. Returns the row count (1 = inserted, 0 = already existed). This is the bedrock of making Temporal activity retries safe.

```python
def idempotent_insert(self, ...) -> int:
    stmt = insert(Model).values(...).on_conflict_do_nothing(...)
    result = self.db.execute(stmt)
    return result.rowcount
```

### Repository Inventory

| Repository | Table | Key Methods | Purpose |
|-----------|-------|-------------|---------|
| `CampaignRepository` | `campaign` | `get_by_id`, `get_by_gmail_thread_id`, `get_by_gmail_account_id` | Lookup campaigns; also tracks Google Sheet error state |
| `CampaignRecipientRepository` | `campaign_recipient` | `idempotent_insert`, `get_by_campaign_id`, `delete_by_campaign_id` | Manages recipients; email dedup key is `(campaign_id, email)` |
| `CampaignSenderRepository` | `campaign_sender` | `idempotent_insert`, `get_details_with_counts_by_campaign_id` | Supports Gmail & SMTP senders; handles mixed union queries |
| `CampaignOutboxQueueRepository` | `campaign_outbox_queue` | `idempotent_insert`, `get_summary_data` | Pre-personalized outbound queue; idempotent key is `(campaign_sender_id, campaign_recipient_id)` |
| `CampaignFollowUpOutboxQueueRepository` | `campaign_follow_up_outbox_queue` | `idempotent_insert` | Follow-up email queue linked to parent outbox item |
| `CampaignCreatorRepository` | `campaign_creator` | `idempotent_insert_by_email`, `find_by_handles_in_campaign` | Tracks creator-campaign enrollment with enrichment state |
| `CampaignThreadRepository` | `campaign_thread` | - | Links campaign to email thread once first email sent |
| `GmailMessageRepository` | `gmail_message` | `idempotent_batch_insert`, `get_sorted_thread_before_high_water_mark` | Stores parsed Gmail messages; batch insert is the sync hot path |
| `GmailThreadStateRepository` | `gmail_thread_state` | `idempotent_batch_insert_latest_state`, `batch_get_ready_for_follow_up_ids`, `get_candidates_from_ids` | Versioned state machine for thread processing — most complex repo |
| `GmailThreadLlmDraftRepository` | `gmail_thread_llm_draft` | - | AI-generated draft pending human approval |
| `GmailThreadUiDraftRepository` | `gmail_thread_ui_draft` | - | Human-edited draft before sending |
| `GmailThreadPreferencesRepository` | `gmail_thread_preferences` | - | Per-thread user prefs (hidden, follow-up behavior) |
| `GmailThreadStateFollowUpScheduleRepository` | `gmail_thread_state_follow_up_schedule` | - | Scheduled follow-up timestamps per thread state |
| `CreatorRepository` | `creator` | `upsert` | Platform creator profile; upsert key is `(platform, handle)` |
| `CreatorListRepository` / `CreatorListItemRepository` | `creator_list*` | `get_creators_by_list_id` | Curated creator lists with campaign integration |
| `CreatorEnrichmentAttemptRepository` | `creator_enrichment_attempt` | `record_attempt` | Audit log of email enrichment attempts per creator |
| `EmailDispatchQueueRepository` | `email_dispatch_queue` | - | SMTP send queue tracking |
| `SmtpMessageRepository` | `smtp_message` | `get_sorted_thread_before_high_water_mark` | SMTP inbox messages (mirror of gmail_message for non-Gmail accounts) |
| `SmtpThreadStateRepository` | `smtp_thread_state` | - | SMTP equivalent of gmail_thread_state |
| `ProductRepository` | `product` | - | Shopify product catalog linked to campaigns |
| `UserGmailAccountRepository` | `user_gmail_account` | - | Gmail OAuth credentials per user |
| `UserSmtpAccountRepository` | `user_smtp_account` | - | SMTP credentials per user |
| `TeamRepository` | `team` | - | Team membership and settings |
| `ThreadFlagRepository` | `thread_flag` | - | Custom labels/flags on email threads |
| `UnifiedRecipientRepository` | (cross-table) | - | Cross-channel recipient queries |
| `AttachmentRepository` | `email_attachment` | `batch_get_llm_extracted_content_by_gmail_message_ids` | Email attachment metadata and extracted content |
| `EmailReplyExampleRepository` | `email_reply_example` | - | RAG examples for response drafting |
| `EmailSignatureRepository` | `email_signature` | - | HTML signatures per account |

---

## Service Domain Inventory

### 1. Campaign Domain — `src/services/campaign/`

**Purpose**: Orchestrate the campaign outbox pipeline.

#### `queue_populator.py` — `populate_queue_for_campaign()`

**User problem solved**: When a user launches a campaign, every recipient needs a personalized email pre-generated and ready to send. The queue acts as a send buffer.

**Algorithm** (Round-Robin):
1. Load all senders (Gmail/SMTP accounts) for campaign
2. Load all recipients ordered by `created_at`
3. For each recipient at index `i`, assign sender `senders[i % len(senders)]`
4. Personalize `subject_template` and `body_template` using recipient's `{name}`, `{email}`, and any custom fields
5. Validate no unreplaced `{placeholder}` tags remain — raises `ValueError` if missing
6. `idempotent_insert` into `CampaignOutboxQueue`
7. If campaign has `follow_up_templates`, create linked `CampaignFollowUpOutboxQueue` entries

**Idempotency**: The outbox insert uses `ON CONFLICT DO NOTHING` on `(campaign_sender_id, campaign_recipient_id)`. Re-running is safe.

**Example distribution**: 3 senders [A, B, C] + 7 recipients:
- Recipient 0 → Sender A, Recipient 1 → Sender B, Recipient 2 → Sender C
- Recipient 3 → Sender A (wraps), ...

#### `queue_single_recipient.py` — `queue_enriched_creator()`

**User problem solved**: After async email enrichment succeeds (creator had no email, Apify/Influencer Club found one), the creator needs to be added to the outbox pipeline without re-running the whole campaign.

**Flow**:
1. Idempotent-insert `CampaignRecipient` with the discovered email
2. Copy `cc_emails` from any existing outbox entry for the campaign
3. Call `populate_queue_for_campaign()` — only creates entries for new recipients (idempotent)

Returns `True` if new entry created, `False` if already queued.

#### `summary_generator.py` — Campaign Summary

**User problem solved**: Campaign manager wants a dashboard view of all creators in a campaign showing their status, notes, and whether they replied.

**Functions**:
- `get_creator_summary_rows()` — joins `campaign_outbox_queue + campaign_recipient + creator` to build `CreatorSummaryRow` objects. Display status logic: `gifting_status` (from creator entity) takes priority over `outbox_status`.
- `load_thread_contexts_for_creators()` — loads XML-formatted email thread for each creator that has a `gmail_thread_id`. Used as LLM context.
- `compute_stats()` — aggregates sent/pending/failed/with_notes counts.

---

### 2. Creator Domain — `src/services/creator/`

#### `creator_service.py` — Platform Creator Persistence

**User problem solved**: Save discovered Instagram or YouTube creators into the unified creator database regardless of how they were found.

**Functions**:
- `save_creator_from_instagram(db, profile: ApifyInstagramProfile, source)` — Maps Apify Instagram profile fields to `Creator` model; stores bio links, latest posts, follower count, verification status. Source tag enables provenance tracking.
- `save_creator_from_youtube(db, channel, source)` — Handles both `YouTubeChannelFinderResult` and `ApidojoChannelFinderResult` (two different Apify actors with different schemas). Maps to unified Creator model.

Both call `CreatorRepository.upsert()` which uses `ON CONFLICT DO UPDATE` on `(platform, handle)`.

#### `creator_list_service.py` — List-to-Campaign Integration

**User problem solved**: A brand manager has a curated list of creators they want to run a campaign for. They need to add all or selected creators to a campaign in one operation.

**`add_creators_to_campaign(db, list_id, campaign_id, creator_ids=None)`**:
1. Load creators from list (optionally filtered by `creator_ids`)
2. For creators **with email**: create `CampaignRecipient` + `CampaignCreator` (both idempotent)
3. For creators **without email**: create `CampaignCreator` with `enrichment_status='pending'` — async enrichment will run later

Returns `AddCreatorsToCampaignResult` with counts and the list of `campaign_creator_id`s needing enrichment.

**Duplicate detection**: The `_find_existing_campaign_creator_by_handle` function uses ILIKE on JSONB cast to text to detect handle duplicates. LIKE wildcards (`%`, `_`) in handle names are properly escaped.

#### `enrichment_service.py` — Multi-Step Email Discovery Waterfall

**User problem solved**: Creator influencers often don't list their business email publicly. Campaigns need email addresses to send outreach. This service finds them via a cascade of techniques.

**`enrich_single_creator(db, creator)` — 4-step waterfall**:

| Step | Method | Description |
|------|--------|-------------|
| 1 | Cache check | Creator already has `email` → return immediately |
| 2 | Apify scrape | For Instagram: calls `apify/instagram-profile-scraper` actor. For YouTube: calls YouTube channel info extractor. Extracts `publicEmail` / `businessEmail` fields. |
| 3 | Bio link crawl | If step 2 found no email but returned `bio_links`: crawl Linktree/Beacons/etc pages to find email addresses |
| 4 | Influencer Club | Paid third-party API for email lookup as final fallback |

Short-circuits on first success. Records every attempt in `CreatorEnrichmentAttemptRepository` with source and outcome.

---

### 3. Email Domain — `src/services/email/`

#### `processor.py` — Raw Gmail Message Parsing

**User problem solved**: Gmail API returns raw RFC 2822 email bytes. These need to be parsed into structured database records for display, AI processing, and thread reconstruction.

**`create_gmail_message_from_raw()`**:
1. Validates `message.raw` is present (format='raw' required)
2. Decodes base64url → raw bytes
3. Uses Python stdlib `email.message_from_bytes(policy=policy.default)` for RFC-compliant parsing
4. Skips test emails (`X-Cheerful-Test-Email` header)
5. Extracts body (text + HTML) with content capping: text ≤ 64KB, HTML ≤ 256KB
6. Determines direction (INBOUND/OUTBOUND) by comparing sender against Gmail account aliases
7. Strips NUL characters (PostgreSQL TEXT fields can't store `\x00`)
8. Returns `GmailMessage` ORM record (not yet saved)

Returns `None` for draft messages (signal to caller to skip).

**Edge cases handled**:
- Non-ASCII email addresses (Unicode in "Mathematical Sans-Serif Italic" for spam evasion) — falls back to raw string construction
- Malformed Date headers — falls back to `datetime.now(UTC)`

#### `loader.py` — Thread Reconstruction Service

**User problem solved**: Email responses exist as individual messages. Users and AI need to see the full conversation in context. This service rebuilds complete threads in chronological order with quoted text stripped.

**`EmailLoaderService`** class:
- `get_complete_thread(gmail_thread_id)` → `EmailThreadView` — loads all messages, strips quoted replies, attaches extracted attachment content
- `convert_thread_to_xml(thread)` → XML string for LLM consumption (xmltodict.unparse)
- `get_thread_context_for_llm(gmail_thread_id, max_emails)` → XML string ready to inject into prompts

**Quote stripping** — two strategies:
1. **Plaintext**: Uses `email-reply-parser` library (by Zapier) first, then regex for multi-language quote headers (English "On ... wrote:", Dutch "Op ... schreef", French "Le ... a écrit", Spanish "El ... escribió", German "Am ... schrieb")
2. **HTML**: BeautifulSoup-based — removes `.gmail_quote`, `#divRplyFwdMsg`, `#OLK_SRC_BODY_SECTION`, `<blockquote type="cite">`, `.moz-cite-prefix`, any remaining `<blockquote>`, terminal `<hr>` tags

Returns `None` if stripping removes ALL content (message was only a quote).

Fully mirrors logic for SMTP threads via `get_complete_thread_smtp()`.

#### `personalization.py` — Template Rendering

**User problem solved**: Campaign emails need personalized greetings and content for each recipient. The template system supports `{name}`, `{email}`, and arbitrary custom fields.

**`personalize_template(template, data)`**:
- Replaces `{key}` placeholders with values
- Empty values collapse surrounding whitespace intelligently: `"Hey {name}!"` with `name=""` → `"Hey!"` (not `"Hey !"`)

**`validate_personalization(text)`**:
- Returns list of any unreplaced `{placeholder}` tags
- Called after personalization to catch missing custom fields

**HTML Utilities**:
- `sanitize_html_for_email(html)` — whitelists email-safe CSS properties, injects list styles for email client compatibility
- `sanitize_signature_html(html)` — full bleach-based sanitization with CSSSanitizer; removes script tags, event handlers, javascript: URLs
- `append_signature_to_body(body, signature)` — appends HTML signature; converts plain text body to HTML first

#### `batch.py` — Gmail Message Batch Processing

**User problem solved**: Polling Gmail for new messages needs to be idempotent and transactionally safe — no orphaned storage files if DB insert fails.

**`process_message_batch()`** — shared by both ongoing sync and historical migration:
1. Parse all messages via `create_gmail_message_from_raw()` (skip drafts)
2. Batch idempotent insert to `gmail_message` table
3. For **newly inserted** messages only: upload raw email to storage + create attachment records
4. Uses `cleanup_storage_on_error` context manager: if any step fails, deletes any already-uploaded storage files before re-raising

**Idempotency**: Message with same `gmail_message_id` is skipped by `ON CONFLICT DO NOTHING`.

#### `storage.py` — Email Raw Storage

**User problem solved**: Full email bodies and attachments need to be stored durably for replay, LLM analysis, and compliance. The DB record has size-capped fields; the full email lives in Supabase Storage.

**`upload_email_to_storage()`**:
1. Decodes raw bytes from `format='raw'` Gmail API response
2. Uploads complete RFC 2822 bytes once to Supabase Storage at path `{user_id}/emails/{message_id}.eml`
3. Parses all MIME parts to find attachments
4. Creates `EmailAttachment` metadata records pointing back to the SAME storage key via `mime_part_index` offset

Key insight: attachments do NOT get separate storage uploads. One storage file per email; attachment content is extracted on-demand by seeking to the MIME part.

#### `reply.py` — RFC 2822 Reply Headers

Tiny utility: extracts `In-Reply-To` and `References` headers needed to thread Gmail replies correctly via the Gmail API.

#### `draft_recipients.py` / `smtp_draft_recipients.py`

Services for managing draft creation with recipient association. SMTP variant mirrors Gmail behavior.

---

### 4. Post Tracking Domain — `src/services/post_tracking/`

**User problem solved**: After an influencer campaign runs, brands want to verify that creators actually posted about the product. This tracks Instagram posts per campaign creator.

#### `analyzer.py` — Two-Phase Post Analysis

**`analyze_post(post_data, product_name, product_description)`**:

**Phase 1 — Caption match (fast, free)**:
- Simple `product_name.lower() in caption.lower()` check
- Returns immediately with `method='caption'` if match found

**Phase 2 — LLM vision analysis (fallback)**:
- Downloads the image from Instagram CDN via httpx
- Encodes as base64
- Calls Claude claude-sonnet-4 with both image and text prompt:
  ```
  Does this post mention, show, or promote [product]?
  Reply with ONLY: YES - [reason] or NO - [reason]
  ```
- Returns `method='llm'` with parsed YES/NO + reason

#### `post_processor.py` — Post Record Creation

`create_creator_post()` assembles a `CreatorPost` database record from raw `InstagramPost` data + analysis result. Stores:
- `instagram_post_id`, `post_type`, `post_url`, caption (truncated to 500 chars)
- `media_urls`, `thumbnail_url`, engagement metrics (likes, views, comments)
- `match_method` ('caption' or 'llm') and `match_reason`

#### `apify_posts.py` — Instagram Post Fetching

Typed Pydantic model `InstagramPost` for Apify's scraped post format. Fetches posts for a specific handle/timeframe via Apify actor.

#### `media_storage.py` — Post Image Storage

Downloads and stores post images in Supabase Storage for archival/offline analysis.

#### `status.py` — Post Tracking Status Reporting

Aggregates post counts and match statistics per campaign.

---

### 5. External Services Domain — `src/services/external/`

Thin adapters over external API SDKs. Each handles auth, error mapping, and data transformation.

| Service | File | Purpose |
|---------|------|---------|
| Gmail | `gmail.py` | Gmail API calls: list messages, fetch raw, send, create draft, watch inbox |
| SMTP | `smtp_email.py` | SMTP sending via smtplib; handles connection pooling |
| Apify | `apify.py` | Generic Apify actor runner — `call()` and iterate dataset |
| Bio Link Apify | `bio_link_apify.py` | Specialized: scrape Linktree/Beacons/etc for email addresses |
| YouTube Apify | `youtube_apify.py` | YouTube channel info and email extraction via Apify |
| Firecrawl | `firecrawl.py` | Web scraping for enrichment; Firecrawl API adapter |
| Shopify Proxy | `shopify_proxy.py` | Proxies Shopify product catalog requests; product sync |
| Slack Service | `slack_service.py` | Slack notifications; sends campaign status updates and error alerts |
| GSheet | `gsheet.py` | Google Sheets read access — imports recipient lists from Google Sheets |
| Influencer Club | `influencer_club.py` | Paid creator email discovery API; used as enrichment fallback |

---

### 6. Storage Domain — `src/services/storage/`

#### `storage.py` — `EmailStorageService`

Wraps Supabase Storage with typed methods:
- `upload_email_raw(user_id, message_id, raw_content)` → returns storage key
- `download_email_raw(storage_key)` → bytes
- `delete_content(storage_key)` → for cleanup

Path scheme: `emails/{user_id}/{message_id}.eml`

#### `creator_image.py`

Downloads creator profile images from Instagram/YouTube CDNs and stores in Supabase Storage for display in the webapp without hitting third-party rate limits.

---

### 7. Processing Domain — `src/services/processing/`

#### `attachment_extract.py`

**User problem solved**: Email attachments (PDFs, images, spreadsheets) may contain useful information — rate cards, media kits, product images. This extracts their content for AI analysis.

Uses Claude's vision API to OCR or analyze attachment content. Results stored in `email_attachment.llm_extracted_content`.

---

### 8. CSV Domain — `src/services/csv/`

#### `parser.py` — Recipient Upload Parsing

**User problem solved**: Campaign managers want to upload a CSV of influencer contacts. Headers may use different conventions (e.g., "Email Address" vs "email").

**`parse_csv_file_with_cleaning()`**:
1. Decodes UTF-8 (with BOM stripping)
2. Normalizes headers: strips whitespace, lowercases, replaces spaces with `_`, maps aliases (`email_address` → `email`, `full_name` → `name`)
3. Validates and cleans each email (removes display names, handles quoted strings)
4. Returns `(headers, valid_rows, skipped_rows)` — skipped rows include reason

**`parse_csv_with_social_validation()`**:
Extended version that also validates Instagram/YouTube URLs in additional columns. Used when uploading creator lists (not just email-only recipient lists).

#### `email_utils.py` / `social_profile_utils.py`

Email cleaning (handles `"John Doe <john@example.com>"` format) and social URL extraction/normalization.

---

### 9. Workflow Domain — `src/services/workflow/`

#### `executor.py` — `WorkflowExecutor`

**User problem solved**: AI-powered custom workflows (defined per-campaign) need a tool registry to know which capabilities are available.

`select_tools_for_workflows(workflows)` → de-duplicated set of tool slugs needed across all campaign workflows. Used to construct the minimal MCP server for a given execution.

#### `formatter.py` — Execution History Formatting

`format_executions_for_llm(executions)` → JSON string with human-readable recency labels ("just now", "today", "yesterday", "N days ago"). Injected into AI prompt context so LLM knows when workflows last ran and what they found.

---

### 10. Tools Domain — `src/services/tools/`

#### `tool_registry.py` — `ToolRegistry` Singleton

**User problem solved**: User-defined AI workflows can call a variety of tools (GoAffPro, Apify, etc.). The registry makes all available tools discoverable and retrievable by slug for dynamic MCP server construction.

Global singleton initialized lazily. Registered tools:

| Category | Tool Slugs |
|----------|-----------|
| GoAffPro affiliate | `goaffpro_create_affiliate`, `goaffpro_create_discount`, `goaffpro_search_affiliate` |
| Instagram data | `apify_get_instagram_profile`, `apify_get_instagram_posts`, `apify_find_similar_profiles` |
| Media processing | `download_media_file`, `extract_audio_from_video`, `convert_image_to_base64`, `transcribe_audio`, `analyze_video_custom` |
| Instagram scraping | `apify_scrape_instagram_hashtags`, `apify_scrape_instagram_mentions` |

#### `custom_tools_real.py`

Actual implementations of all registered tools. Each is an `async def` decorated with `@tool` from `claude_agent_sdk`, making it directly callable as an MCP tool.

---

### 11. Composio Adapter — `src/services/composio_adapter.py`

**User problem solved**: Composio provides hundreds of pre-built integrations (Google Sheets, GitHub, etc.) that power users want available in AI workflows without custom code.

Two utilities:
1. `composio_to_mcp_schema(composio_schema)` — converts Composio v3 OpenAPI schema format to MCP tool schema format (field mapping: `slug` → `name`, `input_parameters` → `inputSchema`)
2. `create_composio_tool_wrapper(action_name, composio_client, user_id)` → async function matching MCP handler signature; executes Composio action and returns MCP-formatted response; never raises (errors returned in response body)

---

### 12. Utils — `src/services/utils/`

#### `instagram.py`

Handle normalization (strip `@`, lowercase), URL construction for Instagram profiles.

#### `youtube.py`

Channel handle normalization, YouTube URL construction.

#### `text_utils.py`

`html_to_plain_text(html)` — uses BeautifulSoup to convert HTML email bodies to readable plaintext for LLM processing.

---

## Key Architectural Patterns

### 1. Idempotency-First Design

All write operations use `ON CONFLICT DO NOTHING` / `ON CONFLICT DO UPDATE`. This is non-negotiable because:
- Temporal workflows retry on failure
- Multiple concurrent workers may process the same data
- Gmail poll history may return overlapping results

### 2. Dependency Injection via Session

Every service/repository takes `db: Session` as first parameter. No global database state. Makes testing trivial (pass a test session) and Temporal activities clean (each activity gets its own session).

### 3. Repository Pattern Enforces Typed Access

No raw SQL outside repositories. Routes and services import from `src/repositories/` and never call `db.execute()` directly. This keeps query logic co-located and testable.

### 4. Thread State as Event Sourcing

`gmail_thread_state` is append-only — new rows are inserted as messages arrive, never updated. The "current state" is the latest row by `latest_internal_date`. This gives:
- Full audit history of processing state
- Idempotent `INSERT ... ON CONFLICT DO NOTHING` using `(user_id, account_id, thread_id, internal_date)` as unique key
- Ability to replay from any point in time

### 5. Two-Tier Content Storage

DB fields hold size-capped content (text ≤ 64KB, HTML ≤ 256KB) for fast queries. Full content lives in Supabase Storage referenced by `storage_key` columns. The loader service transparently reads from DB for most cases and falls back to storage for capped content.

### 6. Personalization at Queue Time

Email templates are personalized when the outbox queue is populated (launch time), not when sending. This means:
- The LLM/workflow code never deals with templates
- Queue entries contain final, ready-to-send content
- Send failures can retry without re-personalizing

### 7. Enrichment as Async Waterfall

Creator email enrichment is designed as an observable, multi-attempt process:
- Each attempt is logged in `creator_enrichment_attempt`
- Steps short-circuit on first success
- Results feed back into the outbox queue via `queue_enriched_creator()`
- The waterfall order (cache → Apify → bio crawl → Influencer Club) optimizes for cost

---

## Cross-Service Call Map

```
Campaign Launch
  └─ populate_queue_for_campaign()
       ├─ CampaignRepository.get_by_id()
       ├─ CampaignSenderRepository.get_by_campaign_id()
       ├─ CampaignRecipientRepository.get_by_campaign_id()
       ├─ personalize_template() × N recipients
       └─ CampaignOutboxQueueRepository.idempotent_insert() × N

Thread Received (Gmail Poll)
  └─ process_message_batch()
       ├─ create_gmail_message_from_raw() × batch
       ├─ GmailMessageRepository.idempotent_batch_insert()
       ├─ upload_email_to_storage() × new messages
       └─ GmailThreadStateRepository.idempotent_batch_insert_latest_state()

Creator Enrichment
  └─ enrich_single_creator()
       ├─ Step 1: creator.email check
       ├─ Step 2: _fetch_instagram_profile() → Apify API
       ├─ Step 3: _crawl_bio_links_for_email() → Firecrawl/HTTP
       ├─ Step 4: _enrich_via_influencer_club() → Influencer Club API
       └─ CreatorEnrichmentAttemptRepository.record_attempt()

Post Tracking
  └─ analyze_post()
       ├─ caption_matches() → fast path
       └─ analyze_image_with_llm() → Claude vision API
```
