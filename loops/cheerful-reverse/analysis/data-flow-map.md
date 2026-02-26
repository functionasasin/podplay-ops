# Analysis: data-flow-map

**Aspect**: `data-flow-map`
**Wave**: 2 — Cross-Cutting Analysis
**Dependencies**: All Wave 1 aspects
**Date**: 2026-02-26

---

## Overview

This document traces the complete lifecycle of each major data entity in the Cheerful platform — from the moment of creation, through processing and storage, to display and eventual archival. For each entity, the lifecycle is broken into phases with precise references to the code that governs each transition.

### Major Entities Traced

| Entity | Tables | Lifecycle Complexity |
|--------|--------|----------------------|
| Campaign | `campaign`, `campaign_sender`, `campaign_recipient`, `campaign_outbox_queue`, `campaign_follow_up_outbox_queue`, `campaign_thread` | High (multi-phase launch) |
| Creator | `creator`, `creator_enrichment_attempt`, `campaign_creator`, `creator_list`, `creator_list_item` | Medium (enrichment waterfall) |
| Email Thread | `gmail_thread_state` / `smtp_thread_state`, `campaign_thread`, `thread_flag`, `gmail_thread_llm_draft`, `gmail_thread_ui_draft` | Very High (central pipeline) |
| Email Message | `gmail_message` / `smtp_message`, `email_attachment`, `email_attachment_llm_extracted_content`, `latest_gmail_message_per_thread` | High (ingestion + storage) |
| Product | `product`, `campaign_product` | Low (scrape + link) |
| Draft (AI + Human) | `gmail_thread_llm_draft`, `gmail_thread_ui_draft` | Medium (two-stage review) |

---

## 1. Campaign Lifecycle

### 1.1 Phase: Creation (Wizard Input)

**Entry Point**: User navigates to `/campaigns/new`
**Store**: `apps/webapp/stores/campaign-wizard-store.ts`

The campaign does NOT exist in the database during wizard steps 0–6. All state is held in the Zustand `campaign-wizard-store`. This is a deliberate choice — partial campaigns don't pollute the database, and the user can abandon without cleanup.

**Exception — Draft save**: If the user explicitly saves a draft, a `POST /campaigns/draft` call serializes the entire Zustand store to JSON and stores it in the `campaign` table with `status='draft'`. This allows re-loading via `GET /campaigns/draft/{draft_id}`.

```
[Zustand Store]
  campaignName: string
  selectedCampaignType: 'seeding' | 'paid' | 'sales' | 'creator'
  selectedEmailAccounts: string[]
  productName, productDescription, productUrl
  initialEmailSubject, initialEmailBody
  followUpTemplates[]
  recipients[] (from CSV or search)
  automationLevel: 'FULL_AUTOMATION' | 'SEMI_AUTOMATION' | 'MANUAL'
  ...70+ additional fields
```

**Data collected per wizard step:**
- Step 1: Campaign name, type, sender email accounts
- Step 2: Product info OR creator persona info
- Step 3: Recipients (CSV upload, creator search, list import)
- Step 3b (paid only): Deliverables configuration
- Step 4: Email templates (initial + follow-ups), opt-in/out rules, signature
- Step 5: Goals and FAQs (seeding) OR deliverables (paid)
- Step 6: Integrations (Google Sheets URL, Shopify store, Slack channel)
- Step 7: Review → Launch

### 1.2 Phase: Launch (API + Database Creation)

**Trigger**: User clicks "Launch" in Step 7
**API**: `POST /campaigns/{campaign_id}/launch` (if pre-created) or `POST /campaigns/launch` (creates + launches in one call)
**File**: `apps/backend/src/api/route/campaign_launch.py`

**Sequence:**
```
1. API receives CampaignLaunchRequest (campaign_type, recipient_data[], sender_accounts[],
   email templates, follow_up_templates[], integration config)

2. DB writes (synchronous, before Temporal):
   a. INSERT campaign → sets status='active'
   b. INSERT campaign_sender[] → one row per sender email account
      - gmail_account_id OR smtp_account_id (not both)
      - Idempotent: ON CONFLICT DO NOTHING on (campaign_id, account_id)
   c. INSERT campaign_recipient[] → one row per target creator email
      - Dedup key: (campaign_id, email)
      - Bulk upsert via PostgreSQL UNNEST + ON CONFLICT UPDATE
   d. INSERT product / campaign_product (if product provided)
   e. INSERT email_signature (if custom signature provided)
   f. INSERT campaign_workflow[] (if AI workflow rules configured)

3. Queue population (synchronous service call):
   CampaignService.populate_queue_for_campaign():
   a. Load all senders + recipients
   b. Round-robin assignment: recipient[i] → sender[i % len(senders)]
   c. Personalize: replace {name}, {email}, {custom_field} in subject/body templates
   d. Validate: no unreplaced {placeholders} → raises ValueError on failure
   e. INSERT campaign_outbox_queue[] → one row per (sender, recipient) pair
      - Idempotent: ON CONFLICT DO NOTHING on (campaign_sender_id, campaign_recipient_id)
   f. If follow_up_templates present: INSERT campaign_follow_up_outbox_queue[]

4. Temporal workflow start (fire-and-forget):
   temporal_client.start_workflow(
     "SendCampaignWorkflow",
     args=[SendCampaignParams(campaign_id=...)],
     id=f"send-campaign-{campaign_id}",
     task_queue="main"
   )

5. Response: {status: "launched", workflow_id: "send-campaign-{campaign_id}"}
```

### 1.3 Phase: Outreach Sending (Temporal)

**Workflow**: `SendCampaignWorkflow`
**File**: `apps/backend/src/temporal/workflow/send_campaign_workflow.py`

```
SendCampaignWorkflow
  └── send_campaign_outbox_activity (one email per invocation)
        ├── Reads: campaign_outbox_queue WHERE status='PENDING' LIMIT 1 FOR UPDATE SKIP LOCKED
        ├── Sets:  status → 'PROCESSING'
        ├── Sends: Gmail API (GmailService.send_message) OR SMTP (smtplib)
        ├── On success: status → 'SENT', records gmail_thread_id / email_thread_id
        ├── On failure: status → 'FAILED', increments retry_count
        └── On crash recovery: status='PROCESSING' AND sent_at < 30min ago → reset to 'PENDING'
```

**Rate control**: One email per account per activity execution. The Temporal schedule drives frequency (typically every 30–60 seconds). This prevents sending bursts that trigger spam filters.

### 1.4 Phase: Thread Association

**When**: After any email in the campaign thread is ingested (inbound reply or outbound sent)
**Trigger**: `ThreadSyncWorkflow` → `ThreadProcessingCoordinatorWorkflow` → `ThreadAssociateToCampaignWorkflow`

```
campaign_thread INSERT:
  campaign_id: from matched campaign
  gmail_thread_id OR email_thread_id: from thread being processed
  Unique constraint: one campaign_thread per (campaign_id, thread_id type)
```

This is the JOIN table that connects email threads to campaigns. Once created, subsequent ingestion of messages in that thread will automatically re-associate via DB lookup (no LLM needed on repeat).

### 1.5 Phase: Archival/Completion

**Status transitions** (field: `campaign.status`):
```
'draft' → 'active' (on launch)
'active' → 'paused' (manual PATCH by user)
'paused' → 'active' (manual re-enable)
'active' → 'completed' (manual PATCH by user)
```

No automatic completion — the brand manager decides when outreach is done. Completed campaigns are retained in DB indefinitely; no hard delete in normal operation.

**Soft cleanup**: DELETE endpoints exist for campaigns, senders, recipients — these cascade to associated records. In practice, deletion is rare; status changes are preferred.

---

## 2. Creator Lifecycle

### 2.1 Phase: Discovery/Import

Three entry paths:

**Path A: CSV Upload**
```
User uploads CSV in wizard Step 3
→ POST /campaigns/{id}/recipients/from-csv
→ Backend: parse CSV, extract (email, name, handle, platform)
→ INSERT campaign_recipient[] (email-only records)
→ INSERT campaign_creator[] (handle + platform for future enrichment)
   enrichment_status = 'pending' if no email, 'done' if email present
```

**Path B: Creator Search (Apify-powered)**
```
User searches by handle/platform in wizard Step 3
→ POST /v1/creators/search {platform, query}
→ Backend: Apify actor call → ApifyInstagramProfile[] or YouTubeChannelFinderResult[]
→ CreatorService.save_creator_from_instagram/youtube()
→ UPSERT creator ON CONFLICT (platform, handle) DO UPDATE
→ Returns creator list to frontend (not yet added to campaign)

User selects creators → "Add to campaign"
→ campaign_creator INSERT (enrichment_status determined by email presence)
→ campaign_recipient INSERT (if email known)
```

**Path C: Creator List Import**
```
User selects existing creator list in wizard Step 3
→ POST /campaigns/{id}/creators/from-list {list_id, creator_ids[]}
→ CreatorListService.add_creators_to_campaign():
   - Creators WITH email → campaign_recipient + campaign_creator (enrichment_status='done')
   - Creators WITHOUT email → campaign_creator (enrichment_status='pending')
→ Returns {queued_count, needs_enrichment_count, campaign_creator_ids[]}
```

### 2.2 Phase: Enrichment (Email Discovery)

**Trigger**: `campaign_creator.enrichment_status = 'pending'` rows detected
**Workflow**: `EnrichCampaignCreatorsWorkflow` → `enrich_campaign_creator_activity`
**File**: `apps/backend/src/services/creator/enrichment_service.py`

```
For each creator with enrichment_status='pending':

Step 1: Cache check
  creator.email IS NOT NULL → return immediately
  → UPDATE campaign_creator SET enrichment_status='done'

Step 2: Apify scrape
  Instagram: apify/instagram-profile-scraper → publicEmail field
  YouTube: YouTube channel info extractor → businessEmail field
  If found:
    → UPDATE creator SET email=discovered_email
    → record CreatorEnrichmentAttempt (source='apify', success=True)

Step 3: Bio link crawl (if Step 2 found no email but returned bio_links)
  Crawl Linktree / Beacons / other link-in-bio pages via Firecrawl
  Extract email addresses from page content using regex
  If found:
    → UPDATE creator SET email=discovered_email
    → record CreatorEnrichmentAttempt (source='bio_link_crawl', success=True)

Step 4: Influencer Club API (paid, final fallback)
  POST to Influencer Club with handle/platform
  If found:
    → UPDATE creator SET email=discovered_email
    → record CreatorEnrichmentAttempt (source='influencer_club', success=True)

On any success:
  → CampaignService.queue_enriched_creator():
     INSERT campaign_recipient (the new email)
     Call populate_queue_for_campaign() → adds to outbox (idempotent)
  → UPDATE campaign_creator SET enrichment_status='done'

On exhausted waterfall (no email found):
  → UPDATE campaign_creator SET enrichment_status='failed'
  → record CreatorEnrichmentAttempt (source='all', success=False)
```

**Audit trail**: Every enrichment attempt (including failures) writes a `creator_enrichment_attempt` row with source, timestamp, and success boolean.

### 2.3 Phase: Campaign Interaction Tracking

**Trigger**: After every inbound/outbound message in a thread that has a linked campaign
**Activity**: `update_creator_latest_interaction_activity`

```
→ UPDATE campaign_creator SET latest_interaction_at = now()
   WHERE campaign_id = ? AND (email = ? OR handles ILIKE ?)
```

**Creator post tracking**: When creator posts campaign content:
```
CreatorPost INSERT:
  campaign_id
  campaign_creator_id
  platform: 'instagram' | 'youtube' | 'tiktok'
  post_url
  metrics: {views, likes, comments, reach}
  posted_at
```

### 2.4 Phase: Archival

Creators in `creator` table persist indefinitely (global shared table, not user-scoped).
`campaign_creator` rows persist with the campaign.
`creator_enrichment_attempt` is append-only — never deleted.

---

## 3. Email Thread Lifecycle

This is the most complex entity lifecycle in the system, driven by the `ThreadProcessingCoordinatorWorkflow`.

### 3.1 Phase: Detection (Polling)

**Gmail Path:**
```
AllPollHistoryWorkflow (infinite loop, continue_as_new)
  └── ProcessAccountMessagesWorkflow (per account)
        ├── poll_history_activity → Gmail History API delta since last_poll_history_id
        ├── ingest_single_message_activity (per new message ID)
        └── update_history_id_activity → advances checkpoint (only on full success)
```

**SMTP Path:**
```
BatchSmtpInboxSyncWorkflow (cron-triggered)
  └── smtp_inbox_sync_activity (per SMTP account)
        ├── IMAP UID-based incremental sync (tracks last_sync_uid + UIDVALIDITY)
        └── SmtpMessageRepository.idempotent_batch_insert()
```

### 3.2 Phase: State Creation

**Trigger**: New messages ingested → `ThreadSyncWorkflow` or `SmtpThreadSyncWorkflow`

```
Gmail path:
  batch_insert_latest_state_and_get_candidates_activity
  → GmailThreadStateRepository.idempotent_batch_insert_latest_state()
  → For each thread with new messages:
       Check if gmail_thread_state row already exists
       If new: INSERT gmail_thread_state {gmail_thread_id, status='NEW', direction=...}
       If existing + new messages: UPDATE to bump version/timestamp
       Returns Candidate objects for threads needing processing

SMTP path: identical via SmtpThreadStateRepository
```

**Thread state table** (`gmail_thread_state`) is append-only — each processing cycle creates a new row. The "current" state is always the latest row by `created_at`. The full history provides an audit trail of state transitions.

### 3.3 Phase: Processing Pipeline

**Triggered by**: Candidate objects returned from state creation
**Workflow**: `ThreadProcessingCoordinatorWorkflow` (fire-and-forget via ABANDON parent_close_policy)

```
Phase 3a: Pre-processing
  ensure_complete_thread_ingested_activity (Gmail only)
  → Compares DB messages vs Gmail API full thread
  → Backfills any missing historical messages

Phase 3b: Campaign Association
  ThreadAssociateToCampaignWorkflow
  → Priority 1: force_campaign_id set → use it directly
  → Priority 2: DB lookup: campaign_thread WHERE gmail_thread_id=? → existing association
  → Priority 3: LLM matching: compare thread subject/participants against campaign senders
     Model: claude-haiku (fast, cheap)
     Output: CampaignAssociationResult {campaign_id, confidence}
  → On match: INSERT campaign_thread (campaign_id, gmail_thread_id)
  → On no match: thread marked as non-campaign; still processes for flag extraction

Phase 3c: Attachment Extraction (Gmail only, if campaign associated)
  ThreadAttachmentExtractWorkflow
  → For each attachment in thread:
       Fetch attachment bytes from Gmail API
       Store in Supabase Storage (key: attachments/{user_id}/{message_id}/{filename})
       INSERT email_attachment (metadata only; bytes in object storage)
       If PDF/image: extract text via LLM → INSERT email_attachment_llm_extracted_content

Phase 3d: Campaign Workflow Execution (Gmail + has campaign)
  execute_campaign_workflows_activity
  → Loads campaign_workflow[] for this campaign
  → For each workflow: Claude Agent SDK + MCP tools
  → Outputs: structured CampaignWorkflowOutput[] (creator verified, order created, post found, etc.)
  → INSERT campaign_workflow_execution (workflow_id, thread_id, output, timestamp)

Phase 3e: Creator Extraction (Gmail + has campaign)
  extract_campaign_creator_activity
  → Analyzes sender email + thread content
  → Checks creator table for matching handle/email
  → If found: UPDATE campaign_creator SET email=? (if not already set)
  → Optionally triggers lookalike generation for opted-in creators

Phase 3f: Flag Extraction (inbound + has campaign)
  extract_thread_flags_activity
  → LLM classifies thread for flags: wants_paid, has_question, has_issue
  → Model: gpt-4.1-mini (speed/cost tradeoff)
  → INSERT/UPDATE thread_flag {gmail_thread_id, flag_type, value}
  → Rule suggestion: if operator manually edited flags, generates campaign-wide rule suggestion
     INSERT campaign_rule_suggestion_analytics

Phase 3g: Status Classification (inbound only)
  check_domain_and_classify_activity
  → Model: claude-haiku
  → Classifies: OPT_IN | OPT_OUT | UNRELATED | UNKNOWN
  → On OPT_OUT: auto-send opt-out response (if domain behavior configured) OR mark IGNORE
  → On OPT_IN: proceed to draft generation
  → UPDATE gmail_thread_state.status (READY_FOR_RESPONSE_DRAFT | IGNORE | AUTO_REPLIED)

Phase 3h: Draft Generation (inbound OPT_IN)
  ThreadResponseDraftWorkflow
  → Three strategies based on campaign configuration:
     a) Base LLM: claude-sonnet → structured EmailDraftOutput
     b) RAG-enhanced: ThreadSummarizer → EmbeddingService → pgvector search → claude-opus-4-5
     c) Corrections-injected: loads campaign_rule_suggestion JSONL → injects as few-shot examples
  → INSERT gmail_thread_llm_draft (status='pending', thread_id, campaign_id, draft_body)
  → Staleness guard: if operator already manually replied, skip (dedup by latest message timestamp)

Phase 3i: RAG Ingestion (outbound)
  ingest_sent_reply_as_example_activity
  → Sanitizes sent reply via ReplySanitizer (removes PII/creator-specific data)
  → Generates embedding via EmbeddingService
  → INSERT email_reply_example (campaign_id, sanitized_text, embedding, action_type)
  → This row becomes available for future RAG retrievals in this campaign

Phase 3j: Follow-up Scheduling (outbound WAITING_FOR_INBOUND)
  schedule_follow_up_activity
  → Checks: campaign.follow_up_templates present?
  → Reads: campaign_follow_up_outbox_queue for this sender/recipient pair
  → Computes: follow-up send datetime (based on configured delay from initial send)
  → INSERT gmail_thread_state_follow_up_schedule {thread_state_id, scheduled_at}
  → Separate AllFollowUpWorkflow watches this table and sends at scheduled_at
```

### 3.4 Phase: Operator Review (UI Display)

**Path**: Thread appears in `/mail` inbox when `gmail_thread_state.status = 'READY_FOR_RESPONSE_DRAFT'` with an LLM draft available.

```
Thread list load:
  GET /v1/threads/gmail?view=pending
  → Backend: JOIN gmail_thread_state + latest_gmail_message_per_thread + campaign_thread + thread_flag
  → Response: ThreadSummary[] {thread_id, subject, sender, latest_message_preview, status, flags[]}

Thread detail load:
  GET /v1/threads/gmail/{thread_id}
  → Backend: EmailLoaderService.get_complete_thread()
     - Loads all gmail_message rows for thread
     - Strips quoted replies (email-reply-parser + BeautifulSoup)
     - Attaches extracted attachment content
  → Response: EmailThreadView {messages[], campaign_info, creator_info}

LLM draft load:
  GET /v1/threads/gmail/{thread_id}/draft
  → Returns latest gmail_thread_llm_draft (status='pending')

Operator edits draft → saves UI draft:
  POST /v1/threads/gmail/{thread_id}/ui-draft
  → INSERT gmail_thread_ui_draft (body, subject, thread_id, user_id)
  → Local TipTap editor also saves to localStorage (7-day TTL)

Operator sends reply:
  POST /v1/threads/gmail/{thread_id}/send {body, subject, draft_id}
  → GmailService.send_reply() → Gmail API
  → gmail_message INSERT (direction='outbound')
  → gmail_thread_llm_draft UPDATE status='sent'
  → gmail_thread_ui_draft DELETE (cleanup)
  → Triggers ingest_sent_reply_as_example_activity (async, RAG training)
```

### 3.5 Phase: Follow-Up Processing

```
AllFollowUpWorkflow (infinite loop, continue_as_new)
  └── send_post_opt_in_follow_ups_activity
        ├── SELECT from gmail_thread_state_follow_up_schedule WHERE scheduled_at <= now()
        ├── Checks: thread has NOT received reply (still WAITING_FOR_INBOUND)
        ├── Sends: follow-up email via GmailService
        ├── Cancels: schedule entry after send
        └── Rate: one follow-up per account per execution

cancel_follow_ups_on_reply_activity
  → Triggered when thread receives inbound reply
  → DELETE gmail_thread_state_follow_up_schedule WHERE thread_state_id=?
  → Prevents follow-up from firing after creator already replied
```

### 3.6 Phase: Thread Completion

```
check_if_thread_is_done_activity
  → Called after each outbound send
  → Conditions for DONE:
     - Campaign workflow output indicates gifting_status='confirmed'
     - Creator has posted required content
     - Negotiation outcome detected by LLM
  → UPDATE gmail_thread_state.status → 'DONE'
  → UI: thread moves from Pending to completed view
```

---

## 4. Email Message Lifecycle

### 4.1 Phase: Ingestion

**Source**: Gmail History API delta or IMAP UID sync
**File**: `apps/backend/src/temporal/activity/ingest_single_message_activity.py`

```
1. Gmail API: fetch full message (format='raw')
2. EmailProcessor.create_gmail_message_from_raw():
   a. base64url decode → raw RFC 2822 bytes
   b. Python stdlib email parser (policy=policy.default)
   c. Content cap: body_text ≤ 64KB, body_html ≤ 256KB
   d. Direction determination: sender ∈ account_aliases → OUTBOUND, else INBOUND
   e. NUL character stripping (PostgreSQL TEXT incompatibility)
   f. Returns GmailMessage ORM object (not yet persisted)

3. Deduplication:
   GmailMessageRepository.idempotent_batch_insert()
   → INSERT ON CONFLICT DO NOTHING on (gmail_account_id, gmail_message_id)
   → Returns {inserted_count, skipped_count}

4. Two-tier storage:
   a. Body text/HTML: stored in gmail_message.body_text / body_html (capped)
   b. Raw MIME bytes: uploaded to Supabase Storage
      Key pattern: raw-emails/{user_id}/{gmail_message_id}
      Stored in: storage_key_gmail_raw column

5. Trigger fires: update_latest_gmail_message_per_thread
   → UPSERT latest_gmail_message_per_thread
   → Updates {gmail_message_id, internal_date, direction} for the thread
   → Used for efficient thread list sorting/filtering without full message scan
```

### 4.2 Phase: Attachment Handling

```
email_attachment rows: metadata only
  - part_id, filename, mime_type, size
  - gmail_attachment_id (for lazy fetch from Gmail API)
  - storage_key → Supabase Storage path
  - sha256 → deduplication

Attachment content extraction (PDF/image):
  email_attachment_llm_extracted_content:
  - attachment_id FK
  - extracted_text: LLM-extracted content
  - extraction_model: model name used
  - created_at

Lazy fetch strategy:
  Attachments are not fetched eagerly on message ingestion.
  ThreadAttachmentExtractWorkflow fetches and stores bytes only when
  thread processing begins and campaign association exists.
```

### 4.3 Phase: Display

```
EmailLoaderService.get_complete_thread():
  1. GmailMessageRepository.get_sorted_thread_before_high_water_mark()
     → All messages for thread, ordered by internal_date ASC
  2. For each message:
     a. Strip quoted replies (email-reply-parser → multi-language regex → HTML BeautifulSoup)
     b. AttachmentRepository.batch_get_llm_extracted_content_by_gmail_message_ids()
        → Attach extracted text for any PDF/image attachments
  3. convert_thread_to_xml() → XML string for LLM consumption

Frontend thread list:
  Uses latest_gmail_message_per_thread view for preview text
  GIN trigram index on body_text enables ILIKE search across all messages
```

### 4.4 Phase: RAG Training (Outbound Messages Only)

```
ingest_sent_reply_as_example_activity:
  1. Load thread context (XML) + sent message body
  2. ReplySanitizer.sanitize() → scrub PII/creator-specific data
  3. ReplySanitizer.summarize() → action_type classification
  4. EmbeddingService.embed_text() → 1536-dim vector (text-embedding-3-small)
  5. INSERT email_reply_example {
       campaign_id,
       their_email_body: inbound_text,
       human_reply: sanitized_reply,
       action_type: "brief acceptance" | ...,
       embedding: vector(1536)
     }
  6. Available for cosine similarity search in future RAG retrievals
```

---

## 5. Product Lifecycle

### 5.1 Phase: Discovery (Shopify Scraping)

**Trigger**: User provides Shopify store URL in campaign wizard (Step 6) or product input
**File**: `apps/backend/src/services/external/shopify_service.py`

```
1. User provides: product URL or Shopify store domain
2. Backend: scrape product page (via Apify or direct HTTP)
   - Extracts: name, description, images, price, variants
3. INSERT product {
     user_id, name, description, url,
     image_url, price, currency
   }
4. INSERT campaign_product {campaign_id, product_id}
   ON CONFLICT DO NOTHING on (campaign_id, product_id)
```

### 5.2 Phase: Campaign Integration

```
Campaign sees linked products via:
  GET /campaigns/{id}/products → lists campaign_product join
  Campaign wizard Step 2: product details flow into email template personalization
  Merge tags: {product_name}, {product_description}, {product_url} available in email templates

Shopify order creation (via campaign workflow):
  CampaignWorkflow with "create_shopify_order" tool
  → MCP tool: shopify:create_order
  → Creates Shopify draft order for creator
  → INSERT campaign_workflow_execution (records order ID)
```

### 5.3 Phase: Archival

Products persist indefinitely — associated with `user_id` not deleted on campaign delete.
`campaign_product` junction rows are deleted when campaign is deleted (CASCADE).

---

## 6. Draft Lifecycle (AI + Human)

### 6.1 Phase: AI Draft Generation

**File**: `apps/backend/src/temporal/activity/generate_draft_activity.py`

```
Strategy selection (per campaign configuration):
  - corrections_enabled AND campaign has correction examples → CORRECTIONS strategy
  - use_rag=True AND campaign has email_reply_examples → RAG strategy
  - default → BASE strategy

BASE strategy:
  1. Load thread context XML (EmailLoaderService)
  2. Load campaign config (product, goals, tone)
  3. Langfuse prompt fetch (label='production', prompt_name='generate_draft')
  4. LlmService.parse_structured(model='claude-sonnet-4-6', response_model=EmailDraftOutput)
  5. EmailDraftOutput {subject, body, confidence_score, reasoning}

RAG strategy:
  1. ThreadSummarizer → 1-2 sentence thread summary
  2. EmbeddingService → embed summary + latest inbound email
  3. pgvector cosine search → top-5 similar email_reply_examples (threshold: 0.3)
  4. Format examples as XML (format_rag_examples_xml)
  5. LlmService.parse_structured(model='claude-opus-4-5', response_model=EmailDraftOutput)
     with RAG examples injected into system prompt

CORRECTIONS strategy:
  1. Load correction examples JSONL (campaign-specific, curated by operator)
  2. Inject as few-shot examples in system prompt
  3. LlmService.parse_structured(model='claude-opus-4-5', response_model=EmailDraftOutput)

On completion:
  Staleness check: has a human already replied since this draft was queued?
    → If yes: SKIP insert (guard against stale draft after fast human reply)
  INSERT gmail_thread_llm_draft {
    thread_state_id, campaign_id, user_id,
    subject, body, strategy_used, confidence_score,
    status='pending'
  }
```

### 6.2 Phase: Human Review + Edit

```
Operator opens thread in inbox:
  GET /v1/threads/gmail/{thread_id}/draft
  → Returns latest gmail_thread_llm_draft (status='pending')
  → Frontend: TipTap editor pre-populated with draft body

Operator edits (auto-save after 2s debounce):
  POST /v1/threads/gmail/{thread_id}/ui-draft {body, subject}
  → INSERT gmail_thread_ui_draft (user_id, thread_id, body, subject, created_at)
  → Also persisted to localStorage under key draft:{thread_id} (7-day TTL)

"Cheerify" (AI improvement):
  User clicks "Cheerify" button
  → POST /v1/threads/{thread_id}/cheerify {body}
  → SSE streaming response (text/event-stream)
  → Model: claude-sonnet → rewrites body for brand voice
  → Frontend: streams tokens into TipTap editor in real-time
```

### 6.3 Phase: Send

```
Operator clicks "Send":
  POST /v1/threads/gmail/{thread_id}/send {body, subject, ui_draft_id}

  Backend:
  1. GmailService.send_reply() → Gmail API (creates gmail_message)
  2. gmail_thread_llm_draft UPDATE status='sent' (audit trail)
  3. gmail_thread_ui_draft DELETE (cleanup; localStorage cleared by frontend)
  4. gmail_thread_state UPDATE status='WAITING_FOR_INBOUND'
  5. Async trigger: ingest_sent_reply_as_example (background, non-blocking)
  6. Async trigger: schedule_follow_up (if campaign has follow-up templates)
```

### 6.4 Phase: Discard

```
Operator clicks "Ignore thread":
  POST /v1/threads/gmail/{thread_id}/ignore
  → gmail_thread_state UPDATE status='IGNORED'
  → gmail_thread_llm_draft UPDATE status='discarded'
  → Thread moves from Pending view to Ignored view
  → No email sent; follow-up NOT scheduled
```

---

## 7. Cross-Cutting Data Flow Patterns

### Pattern A: Two-Tier Content Storage

Every email message uses a split storage strategy:

| Tier | What | Where | Access Pattern |
|------|------|-------|----------------|
| Database | Parsed body (capped at 64KB text / 256KB HTML), structured metadata | `gmail_message.body_text` | Fast reads for display + search |
| Object Storage | Full raw MIME bytes, full HTML | Supabase Storage (`raw-emails/...`) | Audit trail, re-processing, legal holds |

This prevents PostgreSQL bloat from multi-MB emails while keeping query-time data in the DB.

### Pattern B: Append-Only State with Latest-View Materialization

`gmail_thread_state` is append-only (never UPDATE, only INSERT). Each processing cycle creates a new row. The "current" state is always MAX(id) or MAX(created_at) per thread.

The `latest_gmail_message_per_thread` table is a trigger-maintained materialization:
```sql
TRIGGER update_latest_gmail_message_per_thread
  AFTER INSERT ON gmail_message
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_latest_gmail_message_per_thread();
```
This avoids expensive GROUP BY + MAX queries on the hot path of thread list rendering.

### Pattern C: Idempotency as the Universal Safety Net

Every write path that can be retried (Temporal activities, enrichment waterfalls, queue population) uses `INSERT ... ON CONFLICT DO NOTHING`. The row counts (1 = inserted, 0 = already existed) are returned and used by callers for conditional logic without raising errors.

This design choice means Temporal can retry any activity 3–5 times without consequence — the DB is the idempotency layer.

### Pattern D: Fire-and-Forget Processing with ABANDON Policy

`ThreadProcessingCoordinatorWorkflow` is launched with `parent_close_policy=ABANDON`. This means:
- The parent (`ThreadSyncWorkflow`) can complete and be garbage collected
- The coordinator runs to completion independently
- Even if the parent crashes, the coordinator is unaffected

This prevents cascading failures in the ingestion pipeline from blocking thread processing.

### Pattern E: Personalization at Queue Time (Not Send Time)

Email templates are personalized (merge tags replaced) when the outbox queue is populated — not when the email is sent. This means:
- The `campaign_outbox_queue.body` column already contains the fully personalized email
- Sending activity just reads and dispatches — no template rendering at send time
- Late changes to the campaign template do NOT retroactively affect already-queued emails

### Pattern F: Event Chain from Message Ingestion to Draft

```
Gmail API (poll)
  → gmail_message INSERT
  → trigger: latest_gmail_message_per_thread UPSERT
  → ThreadSyncWorkflow: gmail_thread_state INSERT + Candidate creation
  → ThreadProcessingCoordinatorWorkflow: full pipeline
  → gmail_thread_llm_draft INSERT
  → UI: thread appears in Pending inbox with draft pre-loaded
```

End-to-end latency (typical): 30–90 seconds from email arriving in Gmail to draft appearing in inbox UI (dominated by poll interval + LLM generation time).

---

## 8. Data Flow Diagram (ASCII)

```
EXTERNAL WORLD                 INGESTION                   PROCESSING                    STORAGE                   UI
==============                 =========                   ==========                    =======                   ==

Gmail API ──────────────────→ poll_history_activity ──→ ingest_single_message ──────→ gmail_message (DB)
                               (every ~60s per account)  (per message)               gmail_attachment (DB)
                                                                                      raw MIME (Supabase Storage)
                                                          ↓ trigger
                                                          latest_gmail_message_per_thread (DB, materialized view)

                               batch_insert_state ──────→ gmail_thread_state (DB)

                               ThreadProcessingCoordinator (Temporal, ABANDON)
                                 ├── ThreadAssociateToCampaign ──────────────────→ campaign_thread (DB)
                                 ├── execute_campaign_workflows ─────────────────→ campaign_workflow_execution (DB)
                                 ├── extract_thread_flags ───────────────────────→ thread_flag (DB)
                                 ├── check_domain_and_classify
                                 ├── ThreadResponseDraftWorkflow
                                 │     ├── [BASE] LlmService ─────────────────────→ gmail_thread_llm_draft (DB)
                                 │     ├── [RAG] pgvector search + LlmService ────→ gmail_thread_llm_draft (DB)
                                 │     └── [CORRECTIONS] JSONL + LlmService ──────→ gmail_thread_llm_draft (DB)
                                 └── ingest_sent_reply_as_example
                                       └── EmbeddingService + sanitize ────────→ email_reply_example (DB+vector)

SMTP server ─────────────────→ smtp_inbox_sync_activity ──────────────────────────→ smtp_message (DB)
              (IMAP, per account)                                                    smtp_thread_state (DB)


BRAND MANAGER                  WIZARD                      LAUNCH                      DB WRITES
=============                  ======                      ======                      =========

User fills wizard ───────────→ [Zustand store only]
User clicks Launch ──────────────────────────────────────→ campaign (DB)
                                                           campaign_sender (DB)
                                                           campaign_recipient (DB)
                                                           campaign_outbox_queue (DB, personalized)

                               SendCampaignWorkflow ──────────────────────────────→ Gmail API / SMTP
                               (one email per execution)                             campaign_outbox_queue.status='SENT'


CREATOR DISCOVERY              SEARCH/IMPORT               ENRICHMENT                  DB WRITES
=================              ============                ==========                  =========

Apify scrape ───────────────→ save_creator() ────────────→ creator UPSERT (DB)

creator has no email ────────→ EnrichCreators workflow
                                 ├── Apify re-scrape
                                 ├── bio link crawl
                                 └── Influencer Club API ──────────────────────────→ creator UPDATE
                                                                                     creator_enrichment_attempt (DB)
                                                                                     campaign_recipient INSERT (new)
                                                                                     campaign_outbox_queue INSERT (new)
```

---

## 9. Entity Lifecycle Summary Table

| Entity | Created By | Mutated By | Read By | Never Deleted |
|--------|-----------|------------|---------|---------------|
| `campaign` | API launch endpoint | Status PATCH | Dashboard, wizard draft load | ✓ (soft) |
| `campaign_outbox_queue` | queue_populator on launch | send_activity (status updates) | SendCampaignWorkflow | ✓ |
| `campaign_thread` | ThreadAssociateToCampaign | — (immutable once set) | ThreadProcessingCoordinator, UI | ✓ |
| `gmail_message` | ingest_single_message_activity | — (append-only) | EmailLoaderService, RAG | ✓ |
| `gmail_thread_state` | batch_insert_state_activity | — (append-only) | ThreadProcessingCoordinator | ✓ |
| `gmail_thread_llm_draft` | ThreadResponseDraftWorkflow | send (status=sent), ignore (status=discarded) | Inbox UI | ✓ |
| `gmail_thread_ui_draft` | Operator edit via API | Operator edits | TipTap editor | Deleted on send |
| `creator` | save_creator_from_* service | enrichment updates email field | Campaign creator list | ✓ |
| `creator_enrichment_attempt` | EnrichCreatorWorkflow | — (append-only) | Enrichment status UI | ✓ |
| `email_reply_example` | ingest_sent_reply_as_example | — (append-only) | RagService pgvector search | ✓ |
| `thread_flag` | extract_thread_flags_activity | Manual operator flag edit | Inbox triage, LLM context | ✓ |
| `product` | Shopify scrape / manual entry | — | Campaign wizard, email templates | ✓ |
