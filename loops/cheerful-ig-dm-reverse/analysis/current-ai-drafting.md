# Analysis: `current-ai-drafting`

**Aspect:** AI Draft Generation — adaptation requirements for Instagram DMs
**Wave:** 2 — Internal Landscape
**Sources:** `loops/cheerful-reverse/analysis/ai-features.md`, `loops/cheerful-reverse/analysis/synthesis/spec-integrations.md`, Cheerful codebase

---

## Summary

Cheerful's AI drafting system is email-first in its assumptions, but its infrastructure layer is largely channel-agnostic. The specific adaptations needed for Instagram DMs fall into five categories: format changes (no subject, shorter body, plain text only), tone/prompt variants, RAG pipeline extension, thread context XML format, and Langfuse observability wiring. The core LLM infrastructure (`LlmService`, `EmbeddingService`, `ClaudeAgentService`) requires zero changes. Several classification features are already channel-agnostic. The highest-effort change is extending the RAG system to support a DM-specific training corpus.

---

## 1. AI Infrastructure Layer

All infrastructure is channel-agnostic and requires no changes for DM support:

| Component | File | Channel-agnostic? | Notes |
|-----------|------|-------------------|-------|
| `LlmService` | `services/ai/llm.py` | ✅ Yes | Routes by model name prefix; no email assumptions |
| `EmbeddingService` | `services/ai/embedding.py` | ✅ Yes | Pure text→vector; no channel awareness |
| `StructuredOutputParser` | `services/ai/structured_output_parser.py` | ✅ Yes | Parses JSON blocks; format-agnostic |
| `ClaudeAgentService` | `services/ai/claude_agent.py` | ✅ Yes | MCP tool execution; no email-specific logic |
| `ThreadSummarizer` | `services/ai/thread_summarizer.py` | ⚠️ Partial | Prompt says "email thread XML" implicitly; conceptually channel-agnostic, but prompt text would return slightly better results with DM-aware framing |
| `ReplySanitizer` | `services/ai/reply_sanitizer.py` | ⚠️ Partial | Scrubs email PII patterns (promo codes, dates, names); DM-specific PII patterns (handles, links) would need extension |
| `RagService` | `services/ai/rag.py` | ❌ No | Queries `email_reply_examples` table; query format assumes email context; `inbound_email_text` field; entirely email-specific schema |

---

## 2. Feature Catalog — Channel Specificity Assessment

### Draft Generation Features (email-specific)

#### Feature 1: `generate_draft()` — `features/response_drafting.py`

**Email-specific elements:**
- `ResponseDraftResult{subject: str, body_text: str}` — includes a `subject` field meaningless for DMs
- Hardcoded system prompt: `"You are an expert at writing emails... Write only email body text (no subject, no markdown)"`
- All four Langfuse prompts (`drafting/reply-drafting-{paid_promotion,gifting,sales,general}`) are written for email context (salutation, closing, formal register)
- Campaign-type prompt routing is preserved (same 4 types), but DM variants of each prompt are needed
- `previous_workflow_executions` context is channel-agnostic; injected verbatim regardless of channel

**What changes:**
- Response schema: `draft_subject` field → `None` or removed for DM paths
- System prompt: Replace "write only email body text" with "write a short, casual Instagram DM reply (1-4 sentences, plain text only)"
- Langfuse prompt variants: 4 new `drafting/dm-reply-{type}` prompts
- No breaking changes to campaign variable injection (goals, FAQs, rules, product info all remain relevant)

#### Feature 2: `generate_draft_with_rag()` — `features/response_drafting_with_rag.py`

**Email-specific elements:**
- Fetches from `email_reply_examples` (pgvector table with `inbound_email_text`, `sent_reply_text`, `sanitized_reply_text` columns)
- RAG query builder: `f"Context: {summary}\n\nEmail to reply to: {email_body[:4000]}"` — hardcoded "Email to reply to"
- 4 Langfuse RAG prompt variants are email-framed (`drafting/reply-drafting-v13-rag-{type}`)
- XML formatter produces `<their_email>` / `<human_reply>` tags — email semantic naming

**What changes (substantial):**
- New table required: `ig_reply_examples` with `ig_message_text`, `sent_ig_reply_text`, `sanitized_ig_reply_text`, `embedding` columns — OR unified `reply_examples` with `channel` discriminator
- New RAG query format: `"Context: {summary}\n\nDM to reply to: {message_text[:4000]}"`
- 4 new Langfuse DM RAG prompts with DM-appropriate few-shot XML format (`<their_dm>` / `<human_reply>`)
- `RagService` needs channel-aware dispatch: `fetch_email_examples()` vs `fetch_dm_examples()` — or a factory
- Training data ingestion: `ReplySanitizer` → `ig_reply_examples` path needs to exist after operators send DM replies

#### Feature 3: `generate_draft_with_corrections()` — `features/response_drafting_with_corrections.py`

**Email-specific elements:**
- Correction examples from JSONL files (`{thread_context, original_draft, sent_email}`) — field named `sent_email`
- XML injection uses `<correction_examples>` wrapping — generic but examples are email-derived
- Uses same Langfuse email prompts

**What changes:** Minimal — JSONL format adapts trivially; this feature is correction-injection at the prompt level and would work with DM prompts once prompts are updated

#### Feature 4: `generate_follow_up_draft()` — `features/follow_up_drafting.py`

**Special case for DMs:**
- The 24-hour messaging window means *outbound-first* follow-ups cannot be sent via Instagram DM after window expires — only the creator can re-open the window by DMing first
- Follow-up drafts for DM campaigns require a different channel strategy: either (a) send follow-up via email if email is known, (b) send via DM only within 24h of last inbound message, or (c) use Instagram's "Recurring Notifications" opt-in feature
- `follow_up_number` parameter and escalating tone logic remain valid but the delivery mechanism is fundamentally different
- **Implication:** DM follow-up prompt needs "window closed" scenario instruction — the prompt may need to generate an email-based follow-up rather than a DM follow-up

### Classification Features (mostly channel-agnostic)

| Feature | File | Channel-agnostic? | Notes |
|---------|------|-------------------|-------|
| Opt-In Classification | `opt_in_classification.py` | ✅ Yes | Intent detection; `is_opt_in`, `asked_questions` are universally applicable |
| Workflow Classification | `workflow_classification.py` | ✅ Yes | Pure intent matching against workflow descriptions |
| Thread Completion Check | `thread_completion_check.py` | ✅ Yes | Checks if campaign goal achieved; no channel logic |
| Thread Flag Extraction | `thread_flag_extraction.py` | ✅ Yes | `wants_paid`, `has_question`, `has_issue` are channel-agnostic signals |
| Campaign Association | `campaign_association.py` | ❌ No | Matches based on Gmail account → campaign; DMs need `ig_account` → campaign mapping at ingestion time, not AI classification |

### Other Features

| Feature | Channel-agnostic? | Notes |
|---------|-------------------|-------|
| Creator Extraction | ⚠️ Partial | Phase 1 (identify creators from thread) unnecessary for DMs — sender is unambiguous (IGSID → username). Phase 2 extraction schema includes `email` field — must become nullable for DM-sourced creators |
| Creator Note Generation | ✅ Yes | Prose summary; works on any `thread_context` XML |
| Client Summary Generation | ✅ Yes | Aggregates creator rows; no email-specific logic |
| Metrics Extraction | ✅ Yes | Campaign-specific, not channel-specific |
| OCR | ✅ Yes | Gains additional utility: DM image attachments (screenshots, photos from creators) become extractable |

---

## 3. Thread Context XML Format — DM Adaptations

All AI features receive `thread_context_for_llm` as XML. The current format assumes email fields:

**Current email XML (inferred):**
```xml
<thread>
  <gmail_thread_id>T123</gmail_thread_id>
  <subject>Re: Collaboration opportunity</subject>
  <messages>
    <message>
      <from>creator@gmail.com</from>
      <to>brand@company.com</to>
      <cc></cc>
      <bcc></bcc>
      <sent_at>2026-02-15T10:00:00Z</sent_at>
      <body>Hi, I'd love to work together...</body>
    </message>
  </messages>
</thread>
```

**Required DM XML adaptation:**
```xml
<thread>
  <ig_conversation_id>17841234567890</ig_conversation_id>
  <channel>instagram_dm</channel>
  <creator_username>@fitness_influencer</creator_username>
  <messages>
    <message>
      <sender>creator</sender>
      <sent_at>2026-02-15T10:00:00Z</sent_at>
      <body>Hey! I saw your DM - love the brand!</body>
      <message_type>text</message_type>
    </message>
    <message>
      <sender>brand</sender>
      <sent_at>2026-02-15T10:05:00Z</sent_at>
      <body>Thanks for your interest! Here's what we're offering...</body>
      <message_type>text</message_type>
    </message>
  </messages>
  <window_expires_at>2026-02-16T10:00:00Z</window_expires_at>
</thread>
```

**Changes from email XML:**
- Remove: `<subject>`, `<to>`, `<cc>`, `<bcc>`, `<gmail_thread_id>`
- Add: `<ig_conversation_id>`, `<channel>`, `<creator_username>`, `<message_type>`, `<window_expires_at>`
- `<from>` → `<sender>` with role-based values (`creator` / `brand`)

**Impact:** Prompts referencing email-specific XML fields (subject, from/to) would need updated system prompt context. Classification prompts (`opt_in_classification`, `thread_completion_check`, etc.) are field-agnostic and would work without change.

---

## 4. RAG System Extension Requirements

The RAG pipeline is the most substantial change needed for DM drafting quality. Current architecture:

```
Sent email reply
    → ReplySanitizer (Claude Opus): scrub email PII → sanitized_reply_text
    → ThreadSummarizer (Claude Haiku): summarize email thread → 1-2 sentences
    → Store in email_reply_examples (pgvector)

New thread arrives
    → ThreadSummarizer: summarize → seed
    → EmbeddingService: embed "Context: {summary}\n\nEmail to reply to: {body}"
    → pgvector similarity search → top-5 examples
    → Inject as XML into draft prompt
```

**DM RAG extension options:**

**Option A: Parallel DM table**
```sql
CREATE TABLE ig_reply_examples (
    id uuid PRIMARY KEY,
    campaign_id uuid REFERENCES campaigns(id),
    ig_conversation_id text NOT NULL,
    ig_message_text text NOT NULL,             -- the inbound DM
    sent_ig_reply_text text NOT NULL,          -- what was actually sent
    sanitized_ig_reply_text text,              -- scrubbed version
    reply_summary text,                         -- action label
    thread_summary text,                        -- seed summary
    embedding vector(1536),
    created_at timestamptz DEFAULT now()
);
```
- Mirrors `email_reply_examples` schema exactly
- `RagService` gains `fetch_dm_examples()` method alongside `fetch_email_examples()`
- Zero impact on existing email RAG; isolated evolution

**Option B: Unified table with channel discriminator**
```sql
CREATE TABLE reply_examples (
    id uuid PRIMARY KEY,
    campaign_id uuid REFERENCES campaigns(id),
    channel text NOT NULL CHECK (channel IN ('gmail', 'smtp', 'instagram_dm')),
    thread_id text NOT NULL,                   -- gmail_thread_id or ig_conversation_id
    inbound_text text NOT NULL,
    sent_reply_text text NOT NULL,
    sanitized_reply_text text,
    reply_summary text,
    thread_summary text,
    embedding vector(1536),
    created_at timestamptz DEFAULT now()
);
```
- Enables cross-channel RAG (could learn from email patterns for DM context if similar situations)
- Requires migrating existing `email_reply_examples` rows
- `RagService.fetch_examples(channel=...)` filters by channel; embedding query still identical

**Recommendation for catalog:** Option A is lower risk (no migration, no cross-contamination of email/DM style), Option B enables future cross-channel learning.

**ReplySanitizer adaptation for DMs:**
- Remove email-specific PII scrubbers: `To:`, `CC:`, thread-IDs
- Add DM-specific PII scrubbers: Instagram @handles → `[HANDLE]`, DM image links → `[MEDIA]`
- Action label set (8 labels) applies unchanged to DMs: `brief acceptance | brief decline | brief counter-offer | brief follow-up question | brief confirmation | brief scheduling | brief thanks | brief update`

---

## 5. New Prompt Variants Required

| Prompt Name | Purpose | Differences from Email Equivalent |
|-------------|---------|----------------------------------|
| `drafting/dm-reply-paid-promotion` | Base DM draft for paid campaigns | Casual tone, 1-4 sentences, no subject, plain text, no em-dash |
| `drafting/dm-reply-gifting` | Base DM draft for gifting campaigns | Same adaptations; gifting logistics in plain text |
| `drafting/dm-reply-sales` | Base DM draft for sales campaigns | Same adaptations |
| `drafting/dm-reply-general` | Base DM draft general | Same adaptations |
| `drafting/dm-reply-v1-rag-paid-promotion` | RAG DM draft for paid | DM few-shot format (`<their_dm>` / `<human_reply>`) |
| `drafting/dm-reply-v1-rag-gifting` | RAG DM draft for gifting | Same |
| `drafting/dm-reply-v1-rag-sales` | RAG DM draft for sales | Same |
| `drafting/dm-reply-v1-rag-general` | RAG DM draft general | Same |
| `drafting/dm-window-reopener` | **New:** Template DM to re-open expired 24h window | Ultra-brief (1 sentence); designed to elicit a response |

Total: 9 new Langfuse prompt objects (vs 8 existing email prompt objects for the two draft pathways).

---

## 6. Langfuse Observability Wiring

Currently, session attribution in AI calls uses:
- `langfuse_session_id = gmail_thread_id` (email thread ID)
- `langfuse_user_id = user_email` (operator email)

For DM threads:
- `langfuse_session_id = ig_conversation_id` — direct substitution, no structural change
- `langfuse_user_id` — unchanged

The `@langfuse.observe()` decorator pattern and generation tracking require no changes — only the ID values differ.

---

## 7. Cost Model Comparison

| Metric | Email Drafts | DM Drafts | Delta |
|--------|-------------|-----------|-------|
| Avg tokens (context) | ~3,000 (full email thread) | ~800 (short DM thread) | −73% |
| Avg tokens (output) | ~300 (email paragraph) | ~80 (1-4 sentences) | −73% |
| Model used (base) | `gpt-4.1` | `gpt-4.1` (same) | No change |
| Model used (RAG) | `claude-opus-4-5-20251101` | `claude-opus-4-5-20251101` (same) | No change |
| Cost per draft (base) | ~$0.02 | ~$0.005 | −75% |
| Cost per draft (RAG) | ~$0.30 | ~$0.08 | −73% |

DM drafts are materially cheaper per turn due to shorter inputs/outputs.

---

## 8. Summary: What Changes vs What Stays

### No Changes Required
- `LlmService`, `EmbeddingService`, `ClaudeAgentService`, `StructuredOutputParser`
- Opt-in classification, workflow classification, thread completion check, thread flag extraction
- Creator note generation, client summary generation, metrics extraction, OCR
- Langfuse observability pattern (only IDs differ)
- Retry logic, graceful degradation patterns

### Minor Changes (adapt existing)
- `ThreadSummarizer` — prompt addition: note channel is DM not email
- `ReplySanitizer` — add DM PII patterns; same action label taxonomy
- `generate_draft_with_corrections()` — works unchanged once base prompt is updated
- Creator extraction Phase 2 — `email` field becomes nullable for DM-sourced creators
- `ResponseDraftResult.subject` — becomes `None`/optional for DM threads

### New Components Required
1. **8–9 new Langfuse prompt objects** — DM-specific drafting prompts (base + RAG × 4 campaign types + window-reopener)
2. **DM RAG table** — `ig_reply_examples` (or unified `reply_examples` with channel discriminator)
3. **DM RAG training path** — ingestion flow from sent DM replies → sanitize → embed → store
4. **DM thread context XML format** — standard XML schema for IG DM threads used across all AI features
5. **Follow-up strategy** — 24-hour window constraint means DM follow-ups require a separate delivery mechanism (email fallback or window-reopener template)

### Campaign Association
- Email path: Gmail/SMTP account → campaign (determined at account setup)
- DM path: IG account → campaign mapping must be determined at ingestion time (not via AI), parallel to how Gmail accounts are campaign-scoped

---

## 9. Compatibility with Existing Architecture

| Concern | Assessment |
|---------|------------|
| Temporal workflow compatibility | Compatible — AI feature functions are pure Python activities called from Temporal workflows; adding DM variants follows the same pattern as existing email activities |
| Event-sourced state | Compatible — `ig_dm_thread_llm_draft` table (append-only) follows same pattern as `gmail_thread_llm_draft`; `draft_subject` column becomes nullable |
| Pydantic schema changes | Minimal — `ResponseDraftResult.subject` → `Optional[str]`; all other types unchanged |
| Langfuse prompt management | Compatible — new prompt names follow existing namespace convention |
| Multi-model routing | Compatible — DM drafts can use any model; no new model tier required |
| RAG pgvector | Compatible — additional table or discriminator column; existing email RAG unaffected |
