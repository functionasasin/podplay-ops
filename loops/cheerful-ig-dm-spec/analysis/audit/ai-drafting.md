# Audit: AI Drafting Pipeline

**Aspect**: `audit-ai-drafting`
**Date**: 2026-02-28
**Source files read**:
- `apps/backend/src/services/ai/llm.py`
- `apps/backend/src/services/ai/rag.py`
- `apps/backend/src/services/ai/embedding.py`
- `apps/backend/src/services/ai/thread_summarizer.py`
- `apps/backend/src/services/ai/features/response_drafting.py`
- `apps/backend/src/services/ai/features/response_drafting_with_rag.py`
- `apps/backend/src/services/ai/features/response_drafting_with_corrections.py`
- `apps/backend/src/services/ai/features/follow_up_drafting.py`
- `apps/backend/src/services/email/loader.py`
- `apps/backend/src/models/llm/response_draft.py`
- `apps/backend/src/models/dto/domain/email_thread.py`
- `apps/backend/src/models/temporal/email_reply_example.py`
- `apps/backend/src/repositories/email_reply_example.py`
- `apps/backend/src/temporal/activity/gmail_thread_llm_draft.py`
- `apps/backend/src/temporal/activity/thread_response_draft_with_rag_activity.py`
- `apps/backend/src/temporal/activity/ingest_email_reply_examples_activity.py`
- `apps/backend/src/temporal/workflow/thread_response_draft_workflow.py`
- `apps/backend/src/models/database/gmail_thread_llm_draft.py`
- `supabase/migrations/20251210000000_create_email_reply_example_vector.sql`
- `supabase/migrations/20251212000000_email_reply_example_campaign_id_fk.sql`
- `supabase/migrations/20251221000000_add_sanitized_reply_columns.sql`

---

## 1. LlmService

**File**: `apps/backend/src/services/ai/llm.py`

```python
class LlmService:
    def __init__(
        self,
        openai_client: OpenAI,
        langfuse_client: Langfuse,
        anthropic_client: Anthropic | None = None,
    ): ...

    def parse_structured(
        self,
        model: str,
        prompt: str,
        response_model: type[T],
        instructions: str | None = None,
        max_tokens: int = 1024,
    ) -> T: ...

    @staticmethod
    def retry_block(fn: Callable): ...  # Retries 3x with exponential backoff
```

**Provider routing**: model name prefix determines provider:
- `"claude"` prefix → `self.anthropic_client.beta.messages.parse()` (Anthropic structured outputs, beta `"structured-outputs-2025-11-13"`)
- All other prefixes (`gpt-*`, `o3`, etc.) → `self.openai_client.responses.parse()`

**Channel-agnostic**: Completely provider/channel-agnostic. No email-specific logic. No changes needed for IG DM.

---

## 2. EmbeddingService

**File**: `apps/backend/src/services/ai/embedding.py`

```python
EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIMENSIONS = 1536

class EmbeddingService:
    def __init__(self, client: OpenAI | None = None): ...
    def embed_text(self, text: str) -> list[float]: ...
    def embed_batch(self, texts: list[str]) -> list[list[float]]: ...
```

**Channel-agnostic**: Completely infrastructure-level. No changes needed for IG DM.

---

## 3. ThreadSummarizer

**File**: `apps/backend/src/services/ai/thread_summarizer.py`

```python
HAIKU_MODEL = "claude-haiku-4-5-20251001"

class ThreadSummarizer:
    def __init__(self, client: anthropic.Anthropic | None = None): ...
    def summarize(self, thread_context: str) -> str: ...
    def summarize_batch(self, thread_contexts: list[str]) -> list[str]: ...
```

**Summarize prompt** focuses on: conversation stage, key topics discussed, relationship/tone. Returns 1-2 sentences max (200 tokens).

**Channel-agnostic**: Takes generic `thread_context` string. If DM context XML is well-structured, the same summarizer works. No changes needed.

---

## 4. RagService

**File**: `apps/backend/src/services/ai/rag.py`

```python
@dataclass
class RagResult:
    examples: list[EmailReplyExample]
    summary: str
    query: str

def build_rag_query(summary: str, inbound_email_body: str, max_email_chars: int = 4000) -> str:
    """Returns f"Context: {summary}\n\nEmail to reply to: {truncated_email}" """

def format_rag_examples_xml(
    examples: list[EmailReplyExample],
    use_sanitized: bool = True,
    include_action_type: bool = True,
) -> str:
    """Returns <similar_examples><example><situation>...</situation><action_type>...</action_type><their_email>...</their_email><human_reply>...</human_reply></example>...</similar_examples>"""

class RagService:
    def __init__(
        self,
        db_session,
        embedding_service: EmbeddingService | None = None,
        thread_summarizer: ThreadSummarizer | None = None,
    ): ...

    def fetch_examples(
        self,
        thread_context: str,
        inbound_email_body: str,
        campaign_id: uuid.UUID,
        limit: int = 5,
        min_similarity: float = 0.3,
    ) -> RagResult:
        """Steps: summarize thread → build query → embed → search email_reply_example table"""
```

**Email-specific**: `fetch_examples` queries `email_reply_example` table directly (hardcoded in `EmailReplyExampleRepository`). For IG DM, a parallel `IgDmRagService` will query `ig_dm_reply_example` instead, OR `RagService` can be parameterized with a repository. **Easiest path**: create `IgDmRagService` that wraps `RagService` logic but uses `IgDmReplyExampleRepository`.

The `format_rag_examples_xml` function is channel-agnostic (generic XML structure), reusable as-is. The function signature uses `EmailReplyExample` type — new `IgDmReplyExample` dataclass will need same fields.

---

## 5. EmailReplyExample RAG Table

**Migration files**:
1. `20251210000000_create_email_reply_example_vector.sql` — initial creation
2. `20251212000000_email_reply_example_campaign_id_fk.sql` — replaced `campaign_name TEXT` with `campaign_id UUID FK`
3. `20251221000000_add_sanitized_reply_columns.sql` — added `sanitized_reply_text`, `reply_summary`

**Current schema** (after all migrations):

```sql
CREATE TABLE email_reply_example (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id       TEXT NOT NULL,
    campaign_id     UUID NOT NULL REFERENCES campaign(id) ON DELETE CASCADE,
    thread_summary  TEXT NOT NULL,          -- Claude Haiku summary
    inbound_email_text TEXT NOT NULL,       -- The email being replied to
    sent_reply_text TEXT NOT NULL,          -- Human-sent reply
    embedding       vector(1536),           -- HNSW cosine index
    sanitized_reply_text TEXT,              -- PII-scrubbed reply
    reply_summary   TEXT,                   -- e.g. "brief decline", "counter-offer"
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE UNIQUE INDEX idx_email_reply_example_unique_pair
    ON email_reply_example (campaign_id, thread_id, md5(inbound_email_text), md5(sent_reply_text));
CREATE INDEX idx_email_reply_example_embedding
    ON email_reply_example USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_email_reply_example_campaign ON email_reply_example(campaign_id);
CREATE INDEX idx_email_reply_example_thread ON email_reply_example(thread_id);

-- RLS (via campaign ownership)
ALTER TABLE email_reply_example ENABLE ROW LEVEL SECURITY;
CREATE POLICY email_reply_example_select_own ON email_reply_example
    FOR SELECT USING (EXISTS (SELECT 1 FROM campaign WHERE campaign.id = email_reply_example.campaign_id AND campaign.user_id = auth.uid()));
CREATE POLICY email_reply_example_insert_own ON email_reply_example
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM campaign WHERE campaign.id = email_reply_example.campaign_id AND campaign.user_id = auth.uid()));
CREATE POLICY email_reply_example_delete_own ON email_reply_example
    FOR DELETE USING (EXISTS (SELECT 1 FROM campaign WHERE campaign.id = email_reply_example.campaign_id AND campaign.user_id = auth.uid()));
```

**Repository** (`src/repositories/email_reply_example.py`):
- `search_similar(query_embedding, campaign_id, limit=5, min_similarity=None) -> list[EmailReplyExample]` — pgvector cosine similarity, ordered by `embedding <=>` operator
- `insert(thread_id, campaign_id, thread_summary, inbound_email_text, sent_reply_text, embedding, sanitized_reply_text=None, reply_summary=None) -> uuid.UUID` — upsert on unique constraint
- `count()`, `count_by_campaign(campaign_id)`, `delete_all()`, `delete_by_campaign(campaign_id)`

---

## 6. Langfuse Prompt Templates

All prompt names are hardcoded strings passed to `langfuse_client.get_prompt(name, label=...)`.

### Active Prompts (13 total)

| Prompt Name | Function | Model (default) | Purpose |
|-------------|----------|-----------------|---------|
| `reply-drafting` | `generate_draft()` | `gpt-5-mini` | Legacy: campaigns without FAQs/samples |
| `drafting/reply-drafting-paid-promotion` | `generate_draft()` | `gpt-4.1` | Modern: paid promotion campaigns |
| `drafting/reply-drafting-gifting` | `generate_draft()` | `gpt-4.1` | Modern: gifting campaigns |
| `drafting/reply-drafting-sales` | `generate_draft()` | `gpt-4.1` | Modern: sales campaigns |
| `drafting/reply-drafting-general` | `generate_draft()` | `gpt-4.1` | Modern: default (creator/other) |
| `drafting/reply-drafting-v13-rag` | `generate_draft_with_rag()` | `claude-opus-4-5-20251101` | RAG: paid promotion |
| `drafting/reply-drafting-v13-rag-gifting` | `generate_draft_with_rag()` | `claude-opus-4-5-20251101` | RAG: gifting |
| `drafting/reply-drafting-v13-rag-sales` | `generate_draft_with_rag()` | `claude-opus-4-5-20251101` | RAG: sales |
| `drafting/reply-drafting-v13-rag-general` | `generate_draft_with_rag()` | `claude-opus-4-5-20251101` | RAG: creator/other/default |
| `review/intention-alignment` | `review_intention_alignment()` | `gpt-5-mini` | Review: goal alignment check |
| `review/content-accuracy` | `review_content_accuracy()` | `gpt-5-mini` | Review: accuracy check |
| `email-revision` | `revise_draft_content()` | `o3` | Revision: rewrite based on review |
| `follow-up-generation` | `generate_follow_up_draft()` | `gpt-5-mini` | Follow-up drafts |

### Email-Specific Prompt Parameters

**All modern drafting prompts** (`generate_draft` non-legacy) use these email-specific params:
- `goals`, `faqs`, `rules_for_llm`, `thread_specific_rules`, `thread_context`, `previous_workflow_executions`
- `recipient_name_info` (sender email), `subject`, `from_email`, `body` — **email-specific**
- `sample_emails`, `agent_name`, `product_name`, `product_description`, `product_url`, `products_info`

**RAG drafting prompts** (`generate_draft_with_rag`) use:
- Same as above PLUS `rag_examples`
- Uses `goal` (not `goals`), `rules` (not `rules_for_llm`)

**Review/revision prompts** use:
- `original_subject`, `original_body`, `original_recipient` — **email-specific**

**Follow-up prompt** uses:
- `goal`, `rules`, `follow_up_number`, `thread_context`, `agent_name`
- No direct email-specific fields (context is embedded in thread_context)

### IG DM Prompt Adaptation Requirements

DM prompts must replace:
- `subject` → omit (DMs have no subject)
- `from_email` / `recipient_name_info` → `ig_handle` (sender's Instagram username)
- `body` → `dm_text` (DM message text, max 1000 chars)
- Add: `ig_conversation_id`, `channel: "instagram_dm"`, `window_expires_at` (24h window)
- Remove: `to`, `cc`, `bcc` references in thread XML

---

## 7. Thread Context XML Generation

**File**: `apps/backend/src/services/email/loader.py`

### EmailLoaderService

```python
class EmailLoaderService:
    def __init__(self, db_session: Session): ...

    def get_complete_thread(
        self,
        gmail_thread_id: str,
        internal_date_high_water_mark: datetime | None = None,
    ) -> EmailThreadView: ...

    def get_complete_thread_smtp(
        self,
        email_thread_id: str,
        smtp_account_id: uuid.UUID,
        internal_date_high_water_mark: datetime | None = None,
    ) -> EmailThreadView: ...

    def convert_thread_to_xml(
        self, thread: EmailThreadView, max_number_of_emails: int
    ) -> str: ...

    def get_thread_context_for_llm(
        self,
        gmail_thread_id: str,
        max_number_of_emails: int,
        internal_date_high_water_mark: datetime | None = None,
    ) -> str: ...

    def get_thread_context_for_llm_smtp(
        self,
        email_thread_id: str,
        smtp_account_id: uuid.UUID,
        max_number_of_emails: int,
        internal_date_high_water_mark: datetime | None = None,
    ) -> str: ...
```

### XML Output Format (from `convert_thread_to_xml`)

```xml
<email_thread id="{gmail_thread_id}" total_messages="{n}">
  <message id="1" direction="INBOUND" timestamp="2025-12-01T10:00:00">
    <from>creator@gmail.com</from>
    <to>["agency@example.com"]</to>
    <cc>[]</cc>
    <bcc>[]</bcc>
    <subject>Re: Campaign Collaboration</subject>
    <body>Hey, I'm interested in...</body>
  </message>
  <message id="2" direction="OUTBOUND" timestamp="2025-12-01T11:00:00">
    ...
  </message>
</email_thread>
```

**Uses `xmltodict.unparse()`** with `pretty=True, full_document=False`.

**Truncation**: only the last `max_number_of_emails` (default 5) messages are included.

**Email-specific XML fields**: `<from>`, `<to>`, `<cc>`, `<bcc>`, `<subject>` — all email-specific.

### IG DM Context XML (needed)

A new `IgDmLoaderService` (or extension of `EmailLoaderService`) must produce different XML:

```xml
<ig_dm_thread id="{ig_conversation_id}" total_messages="{n}" channel="instagram_dm" window_expires_at="2025-12-02T10:00:00">
  <message id="1" direction="INBOUND" timestamp="2025-12-01T10:00:00">
    <from_handle>@creator_handle</from_handle>
    <body>Hey, I saw your DM...</body>
    <media_type>text</media_type>
  </message>
  <message id="2" direction="OUTBOUND" timestamp="2025-12-01T11:00:00">
    ...
  </message>
</ig_dm_thread>
```

Key differences: no `<to>`, `<cc>`, `<bcc>`, `<subject>`; uses `<from_handle>` (IGSID-resolved @username); adds `<media_type>` for non-text messages; thread root includes `window_expires_at`.

---

## 8. Domain Models

### EmailThreadMessageView (`src/models/dto/domain/email_thread.py`)

```python
class EmailThreadMessageView(BaseModel):
    id: uuid.UUID
    direction: GmailMessageDirection   # INBOUND | OUTBOUND
    subject: str | None
    sender_email: str
    recipient_emails: list[str]
    cc_emails: list[str]
    bcc_emails: list[str]
    body_text: str | None
    timestamp: datetime
    gmail_message_id: str | None
    attachment_content: dict | None

class EmailThreadView(BaseModel):
    gmail_thread_id: str   # Also used for SMTP thread IDs
    messages: list[EmailThreadMessageView]
    total_message_count: int

    @property
    def first_message(self) -> EmailThreadMessageView | None: ...

    @property
    def last_message(self) -> EmailThreadMessageView | None: ...
```

### ResponseDraftResult (`src/models/llm/response_draft.py`)

```python
class ResponseDraftResult(BaseModel):
    subject: str        # Email subject line — NOT needed for IG DM
    body_text: str      # Plain text body — kept for IG DM

class ResponseDraftReviewResult(BaseModel):
    needs_revision: bool
    reasoning: str

class ResponseDraftRevisionResult(BaseModel):
    revised_subject: str    # NOT needed for IG DM
    revised_body_text: str
```

**IG DM implication**: Need `IgDmDraftResult(body_text: str)` — no subject field.

---

## 9. Draft Storage Model

### GmailThreadLlmDraft (`src/models/database/gmail_thread_llm_draft.py`)

```python
class GmailThreadLlmDraft(Base):
    __tablename__ = "gmail_thread_llm_draft"

    id: Mapped[uuid.UUID]                   # PK, gen_random_uuid()
    user_id: Mapped[uuid.UUID]              # FK auth.users.id
    gmail_account_id: Mapped[uuid.UUID | None]  # FK user_gmail_account.id
    smtp_account_id: Mapped[uuid.UUID | None]   # FK user_smtp_account.id
    gmail_thread_id: Mapped[str]            # Both Gmail and SMTP thread IDs stored here
    gmail_thread_state_id: Mapped[uuid.UUID | None]  # FK gmail_thread_state.id
    smtp_thread_state_id: Mapped[uuid.UUID | None]   # FK smtp_thread_state.id
    draft_subject: Mapped[str | None]
    draft_body_text: Mapped[str | None]
    draft_body_html: Mapped[str | None]
    gmail_draft_id: Mapped[str | None]     # External Gmail draft ID (not used by SMTP)
    created_at: Mapped[datetime]
```

**CHECK constraints** (in DB, not in model):
- Exactly one of `gmail_account_id` or `smtp_account_id` must be set
- Exactly one of `gmail_thread_state_id` or `smtp_thread_state_id` must be set

**Draft lookup activities** (`gmail_thread_llm_draft.py`):
- `maybe_get_draft_by_thread_state_id_activity(candidate)` — dispatches to Gmail or SMTP repo branch via `candidate.smtp_account_id is not None`
- `maybe_get_draft_by_thread_id_activity(candidate)` — thread-level (for follow-up check)
- `get_gmail_draft_id_for_state_activity(candidate)` — fetches `gmail_draft_id` for Gmail upload
- IG DM will need `maybe_get_draft_by_ig_dm_thread_state_id_activity(candidate)` querying `ig_dm_llm_draft`

---

## 10. ThreadResponseDraftWorkflow

**File**: `apps/backend/src/temporal/workflow/thread_response_draft_workflow.py`

```python
@workflow.defn
class ThreadResponseDraftWorkflow:
    @workflow.run
    async def run(self, candidate: Candidate) -> ThreadResponseDraftResult:
        # 1. check_is_latest_for_thread_state_activity(candidate)
        # 2. maybe_get_draft_by_thread_state_id_activity(candidate) — skip if force_reply
        # 3. generate_draft_with_rag_activity(candidate)  [Gmail]
        #    OR generate_draft_using_llm_activity(candidate)  [SMTP]
        # 4. upload_llm_draft_to_gmail_activity(...)   [Gmail only]
        # 5. write_llm_draft_to_db_activity(...)
        ...
```

**Discriminator**: `is_smtp = candidate.smtp_account_id is not None`
- Gmail → RAG drafting (`generate_draft_with_rag_activity`) + Gmail upload
- SMTP → Standard drafting (`generate_draft_using_llm_activity`), no Gmail upload

**IG DM**: Will add `is_ig_dm = candidate.ig_dm_account_id is not None` branch:
- IG DM → New `generate_ig_dm_draft_activity`, no Gmail upload, write to `ig_dm_llm_draft`

---

## 11. RAG Ingestion Pipeline

**Activity**: `ingest_email_reply_examples_activity(params: IngestEmailReplyExamplesParams)`
**File**: `apps/backend/src/temporal/activity/ingest_email_reply_examples_activity.py`

```python
class EmailReplyExampleInput(BaseModel):
    thread_id: str
    thread_context: str         # Full thread XML or text
    inbound_email_text: str     # The specific email being replied to
    sent_reply_text: str        # Human-sent reply
    sanitized_reply_text: str | None = None
    reply_summary: str | None = None

class IngestEmailReplyExamplesParams(BaseModel):
    campaign_id: uuid.UUID
    examples: list[EmailReplyExampleInput]

class IngestEmailReplyExamplesResult(BaseModel):
    inserted_count: int
    skipped_count: int
```

**Process**: batch summarize → build RAG queries → batch embed → upsert to `email_reply_example`.

**Triggered explicitly** (not automatic on email receipt). Caller must use `extract_latest_inbound_email()` to get `inbound_email_text`, NOT the first message.

**IG DM parallel**: `ingest_ig_dm_reply_examples_activity` with `IgDmReplyExampleInput` (replaces `inbound_email_text` with `inbound_dm_text`) writing to `ig_dm_reply_example` table.

---

## 12. Key Design Implications for IG DM

### What Changes (New Code Required)

| Component | Change | File |
|-----------|--------|------|
| Thread context XML | New IG DM XML format (no subject/email headers) | `services/ai/ig_dm_loader.py` (new) |
| RAG table | New `ig_dm_reply_example` table | Migration (new) |
| RAG repository | New `IgDmReplyExampleRepository` | `repositories/ig_dm_reply_example.py` (new) |
| Draft model | `IgDmDraftResult(body_text: str)` — no subject | `models/llm/ig_dm_draft.py` (new) |
| Draft storage | New `ig_dm_llm_draft` table | Migration (new) |
| Draft storage model | `IgDmLlmDraft` ORM model | `models/database/ig_dm_llm_draft.py` (new) |
| Drafting function | `generate_ig_dm_draft()` with DM-specific prompt params | `services/ai/features/ig_dm_drafting.py` (new) |
| Langfuse prompts | 4 new DM-variant prompts (paid-promo, gifting, sales, general) | Langfuse UI (external) |
| Draft workflow | New `IgDmThreadResponseDraftWorkflow` | `temporal/workflow/ig_dm_thread_response_draft_workflow.py` (new) |
| Draft activity | New `generate_ig_dm_draft_activity` | `temporal/activity/ig_dm_thread_response_draft_activity.py` (new) |
| Draft lookup activity | New `maybe_get_draft_by_ig_dm_thread_state_id_activity` | `temporal/activity/ig_dm_llm_draft.py` (new) |
| Coordinator | Add `is_ig_dm` branch | `temporal/workflow/thread_processing_coordinator.py` (modify) |
| RAG ingestion | `ingest_ig_dm_reply_examples_activity` | `temporal/activity/ingest_ig_dm_reply_examples_activity.py` (new) |

### What Remains Unchanged (Channel-Agnostic)

| Component | Reason |
|-----------|--------|
| `LlmService` | Provider-agnostic, no email references |
| `EmbeddingService` | Pure text → vector, no email references |
| `ThreadSummarizer` | Takes generic `thread_context` string |
| `format_rag_examples_xml()` | Generic XML structure for any reply examples |
| `ResponseDraftReviewResult` | Review result fields are channel-neutral |
| `DeployEnvironment.for_prompt_version()` | Infrastructure |

### Langfuse Prompt Count for IG DM

Minimum 4 new prompts needed (one per campaign type for DM drafting, following RAG prompt naming pattern):
- `drafting/ig-dm-drafting-paid-promotion`
- `drafting/ig-dm-drafting-gifting`
- `drafting/ig-dm-drafting-sales`
- `drafting/ig-dm-drafting-general`

Optional additions:
- `drafting/ig-dm-window-reopener` — special prompt when 24h window is expiring (proactive outreach)
- `review/ig-dm-intention-alignment` — if review step is added for IG DM

### Draft Subject Handling

Email drafts return `ResponseDraftResult(subject, body_text)`. The `subject` is stored in `gmail_thread_llm_draft.draft_subject` and also uploaded to Gmail.

IG DM drafts have **no subject**. `IgDmDraftResult` will only have `body_text`. `ig_dm_llm_draft.draft_body_text` stores the draft. No Gmail upload step.

### 24-Hour Window in Drafting Context

The `window_expires_at` field from `ig_dm_thread_state` must be included in the DM thread XML context so the LLM knows the window status. The draft prompt should note the window constraint.

Special "window-reopener" prompt: when `window_expires_at` is within 2 hours, use a different prompt that generates a proactive outreach message (story reply, comment mention, etc.) to reset the 24h window.
