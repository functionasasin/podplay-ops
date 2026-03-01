# Spec: AI Drafting — Instagram DM Adaptation

**Aspect**: `spec-ai-drafting`
**Wave**: 3 — Component Implementation Specs
**Date**: 2026-03-01
**Input files**:
- `analysis/audit/ai-drafting.md` — exact current AI pipeline state, class/method signatures, Langfuse prompt catalog, RAG schema
- `../cheerful-ig-dm-reverse/analysis/current-ai-drafting.md` — DM adaptation requirements analysis
- `analysis/spec/db-migrations.md` — `ig_dm_reply_example`, `ig_dm_llm_draft` tables
- `analysis/spec/pydantic-models.md` — `Candidate`, `IgDmLlmDraft` models
- `analysis/spec/temporal-interfaces.md` — workflow/activity signatures

---

## Files

### New Files

| Action | Path |
|--------|------|
| CREATE | `apps/backend/src/services/ai/ig_dm_loader.py` |
| CREATE | `apps/backend/src/services/ai/features/ig_dm_drafting.py` |
| CREATE | `apps/backend/src/models/llm/ig_dm_draft.py` |
| CREATE | `apps/backend/src/models/database/ig_dm_llm_draft.py` |
| CREATE | `apps/backend/src/models/temporal/ig_dm_reply_example.py` |
| CREATE | `apps/backend/src/repositories/ig_dm_reply_example.py` |
| CREATE | `apps/backend/src/temporal/activity/ig_dm_thread_response_draft_activity.py` |
| CREATE | `apps/backend/src/temporal/activity/ig_dm_llm_draft.py` |
| CREATE | `apps/backend/src/temporal/activity/ingest_ig_dm_reply_examples_activity.py` |
| CREATE | `apps/backend/src/temporal/workflow/ig_dm_thread_response_draft_workflow.py` |

### Modified Files

| Action | Path | What Changes |
|--------|------|-------------|
| MODIFY | `apps/backend/src/services/ai/rag.py` | Add `IgDmRagService` class (or factory dispatch); keep `RagService` unchanged |
| MODIFY | `apps/backend/src/temporal/workflow/thread_response_draft_workflow.py` | Add `is_ig_dm` branch in `ThreadResponseDraftWorkflow.run()` |
| MODIFY | `apps/backend/src/temporal/activity/gmail_thread_llm_draft.py` | Add `maybe_get_draft_by_ig_dm_thread_state_id_activity` |
| MODIFY | `apps/backend/src/temporal/workflow/__init__.py` | Export `IgDmThreadResponseDraftWorkflow` |
| MODIFY | `apps/backend/src/temporal/activity/__init__.py` | Export all new IG DM draft/RAG activities |

### External (Langfuse UI — no code files)

| Action | Prompt Name |
|--------|------------|
| CREATE | `drafting/ig-dm-drafting-paid-promotion` |
| CREATE | `drafting/ig-dm-drafting-gifting` |
| CREATE | `drafting/ig-dm-drafting-sales` |
| CREATE | `drafting/ig-dm-drafting-general` |
| CREATE | `drafting/ig-dm-drafting-v1-rag-paid-promotion` |
| CREATE | `drafting/ig-dm-drafting-v1-rag-gifting` |
| CREATE | `drafting/ig-dm-drafting-v1-rag-sales` |
| CREATE | `drafting/ig-dm-drafting-v1-rag-general` |
| CREATE | `drafting/ig-dm-window-reopener` |

---

## Design Principles

### Channel-Agnostic Infrastructure — No Changes Required

The following components require **zero changes** for IG DM support:

| Component | File | Reason |
|-----------|------|--------|
| `LlmService` | `services/ai/llm.py` | Provider-agnostic; routes by model name prefix; no email assumptions |
| `EmbeddingService` | `services/ai/embedding.py` | Pure text→vector; no channel awareness |
| `ThreadSummarizer` | `services/ai/thread_summarizer.py` | Takes generic `thread_context: str`; DM XML works as-is |
| `format_rag_examples_xml()` | `services/ai/rag.py` | Generic XML structure; reusable for DM examples |
| `ResponseDraftReviewResult` | `models/llm/response_draft.py` | Review fields are channel-neutral |
| `ClaudeAgentService` | `services/ai/claude_agent.py` | MCP tool execution; no email-specific logic |
| Opt-in / completion / flag classifiers | `services/ai/features/` | Pure intent detection; channel-agnostic |

### Parallel Tables (not unified channel discriminator)

Following the same parallel-tables architecture decision (see `analysis/spec/db-migrations.md`), the RAG table for IG DM is `ig_dm_reply_example` — a clean parallel to `email_reply_example`. This avoids:
- Migrating existing email RAG rows
- Cross-contaminating email and DM training data (different tone/length expectations)
- Any risk to the live email drafting pipeline

### Draft Model Simplification

Email drafts return `ResponseDraftResult(subject: str, body_text: str)`. IG DMs have **no subject**. New `IgDmDraftResult(body_text: str)` eliminates the field entirely — no nullable workaround needed.

### 24-Hour Window in Drafting Context

`window_expires_at` from `ig_dm_thread_state` is included in the DM thread XML. When `window_expires_at - now() < 2 hours`, the drafting activity routes to the **window-reopener prompt** instead of the standard reply prompt. The CE notification system handles alerting (see `analysis/spec/ce-ig-dm-notifications.md`).

---

## 1. DM Context XML: `IgDmLoaderService`

**File**: `apps/backend/src/services/ai/ig_dm_loader.py`

**Purpose**: Parallels `EmailLoaderService` (`services/email/loader.py`). Loads IG DM message rows from the database and serializes them to XML for LLM consumption.

```python
class IgDmLoaderService:
    def __init__(self, db_session: Session) -> None: ...

    def get_complete_thread(
        self,
        ig_conversation_id: str,
        ig_dm_account_id: uuid.UUID,
        message_limit: int = 10,
        before_timestamp: datetime | None = None,
    ) -> IgDmThreadView:
        """
        Loads the most recent `message_limit` messages from `ig_dm_message`
        for the given `ig_conversation_id`, ordered by `sent_at ASC`.
        If `before_timestamp` is set, excludes messages at or after that timestamp
        (used for high-water-mark windowing during drafting, parallel to
        `internal_date_high_water_mark` in EmailLoaderService).

        Returns: IgDmThreadView with messages list and window_expires_at from
        the latest ig_dm_thread_state row for this conversation.
        """

    def convert_thread_to_xml(
        self,
        thread: IgDmThreadView,
    ) -> str:
        """
        Serializes an IgDmThreadView to XML string using xmltodict.unparse()
        with pretty=True, full_document=False.

        Output format (see XML Schema section below).
        """

    def get_thread_context_for_llm(
        self,
        ig_conversation_id: str,
        ig_dm_account_id: uuid.UUID,
        message_limit: int = 10,
        before_timestamp: datetime | None = None,
    ) -> str:
        """
        Convenience wrapper: get_complete_thread() -> convert_thread_to_xml().
        Returns XML string ready for LLM injection.
        """
```

### Domain View Models

**File**: `apps/backend/src/services/ai/ig_dm_loader.py` (same file, or move to `models/dto/domain/ig_dm_thread.py`)

```python
from dataclasses import dataclass
from datetime import datetime
import uuid

@dataclass
class IgDmMessageView:
    id: uuid.UUID
    mid: str                    # Meta message ID
    direction: str              # "INBOUND" | "OUTBOUND"
    from_handle: str            # @username (resolved via ig_igsid_cache) or IGSID fallback
    body_text: str | None       # None if media-only message
    media_type: str             # "text" | "image" | "video" | "audio" | "story_mention" | "unsupported"
    media_url: str | None       # Supabase Storage URL (already downloaded from ephemeral Meta URL)
    sent_at: datetime

@dataclass
class IgDmThreadView:
    ig_conversation_id: str
    ig_dm_account_id: uuid.UUID
    messages: list[IgDmMessageView]
    total_message_count: int
    window_expires_at: datetime | None  # From latest ig_dm_thread_state; None if no inbound messages yet

    @property
    def last_inbound_message(self) -> IgDmMessageView | None:
        """Returns most recent INBOUND message (used as drafting target)."""
        ...

    @property
    def is_window_expiring_soon(self) -> bool:
        """Returns True if window_expires_at is within 2 hours of now()."""
        ...
```

### DM Thread Context XML Schema

The XML format produced by `convert_thread_to_xml()`:

```xml
<ig_dm_thread
    id="{ig_conversation_id}"
    total_messages="{n}"
    channel="instagram_dm"
    window_expires_at="2026-03-01T10:00:00+00:00"
>
  <message id="1" direction="INBOUND" timestamp="2026-03-01T09:00:00+00:00">
    <from_handle>@fitness_influencer</from_handle>
    <body>Hey! I saw your campaign and I'm really interested in collabing!</body>
    <media_type>text</media_type>
  </message>
  <message id="2" direction="OUTBOUND" timestamp="2026-03-01T09:05:00+00:00">
    <from_handle>@brandname</from_handle>
    <body>Thanks for reaching out! We'd love to work with you.</body>
    <media_type>text</media_type>
  </message>
  <message id="3" direction="INBOUND" timestamp="2026-03-01T09:10:00+00:00">
    <from_handle>@fitness_influencer</from_handle>
    <body>[IMAGE]</body>
    <media_type>image</media_type>
    <media_url>https://supabase.storage.../ig-dm-media/...</media_url>
  </message>
</ig_dm_thread>
```

**Key differences from email XML** (`<email_thread ...>`):
- Root element: `<ig_dm_thread>` (not `<email_thread>`)
- Root attributes include `channel` and `window_expires_at`
- No `<subject>`, `<to>`, `<cc>`, `<bcc>` elements
- `<from_handle>` replaces `<from>` (Instagram @username, not email address)
- `<media_type>` added to every message
- `<media_url>` present when media_type is not `"text"`
- `window_expires_at` on root tag so LLM sees window constraint immediately

**Media-only messages**: When `body_text` is None (image/video DMs), `<body>` contains `[IMAGE]`, `[VIDEO]`, `[AUDIO]`, or `[STORY_MENTION]` as a placeholder so the LLM understands the content type.

---

## 2. Draft Result Model

**File**: `apps/backend/src/models/llm/ig_dm_draft.py`

```python
from pydantic import BaseModel, Field

class IgDmDraftResult(BaseModel):
    """LLM output schema for IG DM reply drafts. No subject field (DMs have none)."""
    body_text: str = Field(
        description="The Instagram DM reply text. Plain text only, 1-4 sentences, max 1000 characters. No markdown, no emoji unless campaign rules allow."
    )

class IgDmDraftReviewResult(BaseModel):
    """Output schema for IG DM draft review step (if enabled)."""
    needs_revision: bool
    reasoning: str

class IgDmDraftRevisionResult(BaseModel):
    """Output schema for IG DM draft revision step."""
    revised_body_text: str
```

**Note**: `ResponseDraftResult` (email) has `subject: str` and `body_text: str`. `IgDmDraftResult` has only `body_text: str`. The `draft_subject` column on `ig_dm_llm_draft` is intentionally absent (see `analysis/spec/db-migrations.md`).

---

## 3. Draft Storage ORM Model

**File**: `apps/backend/src/models/database/ig_dm_llm_draft.py`

```python
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, String, Text
from datetime import datetime
import uuid
from src.models.database.base import Base

class IgDmLlmDraft(Base):
    __tablename__ = "ig_dm_llm_draft"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, server_default="gen_random_uuid()")
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("auth.users.id", ondelete="CASCADE"), nullable=False)
    ig_dm_account_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("user_ig_dm_account.id", ondelete="CASCADE"), nullable=False)
    ig_dm_thread_state_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ig_dm_thread_state.id", ondelete="SET NULL"), nullable=True)
    ig_conversation_id: Mapped[str] = mapped_column(String, nullable=False)  # ig_dm_message.ig_conversation_id
    draft_body_text: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String, nullable=False, default="pending")  # "pending" | "approved" | "sent" | "rejected"
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default="now()")
    updated_at: Mapped[datetime] = mapped_column(nullable=False, server_default="now()", onupdate="now()")
```

**Status lifecycle**: `pending` → `approved` (CE tool `cheerful_approve_ig_dm_draft`) → `sent` (after `IgDmSendReplyWorkflow`) or `rejected`.

**Relationship**: `ig_dm_thread_state_id` is nullable (SET NULL on delete) to survive thread state pruning.

---

## 4. `ig_dm_reply_example` RAG Table (SQL Reference)

Exact SQL is defined in `analysis/spec/db-migrations.md`. Reproduced here for drafting context:

```sql
-- Table (from db-migrations.md Section)
CREATE TABLE ig_dm_reply_example (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id             UUID NOT NULL REFERENCES campaign(id) ON DELETE CASCADE,
    ig_conversation_id      TEXT NOT NULL,
    thread_summary          TEXT NOT NULL,
    inbound_dm_text         TEXT NOT NULL,
    sent_reply_text         TEXT NOT NULL,
    sanitized_reply_text    TEXT,
    reply_summary           TEXT,
    embedding               vector(1536),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Uniqueness: prevent duplicate ingestion
CREATE UNIQUE INDEX idx_ig_dm_reply_example_unique
    ON ig_dm_reply_example (campaign_id, ig_conversation_id, md5(inbound_dm_text), md5(sent_reply_text));

-- Vector similarity search
CREATE INDEX idx_ig_dm_reply_example_embedding
    ON ig_dm_reply_example USING hnsw (embedding vector_cosine_ops);

CREATE INDEX idx_ig_dm_reply_example_campaign ON ig_dm_reply_example(campaign_id);
```

**Key column difference from `email_reply_example`**:
- `inbound_dm_text` replaces `inbound_email_text`
- No `thread_id` / `gmail_thread_id` — uses `ig_conversation_id` instead

---

## 5. `IgDmReplyExampleRepository`

**File**: `apps/backend/src/repositories/ig_dm_reply_example.py`

Parallels `EmailReplyExampleRepository` (`repositories/email_reply_example.py`) exactly. Same method signatures, same query patterns, different table.

```python
from dataclasses import dataclass
import uuid

@dataclass
class IgDmReplyExample:
    """Domain object matching ig_dm_reply_example table row."""
    id: uuid.UUID
    campaign_id: uuid.UUID
    ig_conversation_id: str
    thread_summary: str
    inbound_dm_text: str
    sent_reply_text: str
    sanitized_reply_text: str | None
    reply_summary: str | None
    created_at: datetime

class IgDmReplyExampleRepository:
    def __init__(self, db_session: Session) -> None: ...

    def search_similar(
        self,
        query_embedding: list[float],
        campaign_id: uuid.UUID,
        limit: int = 5,
        min_similarity: float | None = None,
    ) -> list[IgDmReplyExample]:
        """
        pgvector cosine similarity search on `ig_dm_reply_example.embedding`.
        Query: SELECT *, 1 - (embedding <=> :query_vec) AS similarity
               FROM ig_dm_reply_example
               WHERE campaign_id = :campaign_id
               ORDER BY embedding <=> :query_vec
               LIMIT :limit
        If min_similarity set: filters WHERE 1 - (embedding <=> :query_vec) >= min_similarity.
        """

    def insert(
        self,
        ig_conversation_id: str,
        campaign_id: uuid.UUID,
        thread_summary: str,
        inbound_dm_text: str,
        sent_reply_text: str,
        embedding: list[float],
        sanitized_reply_text: str | None = None,
        reply_summary: str | None = None,
    ) -> uuid.UUID:
        """
        Upsert on unique constraint (campaign_id, ig_conversation_id, md5(inbound_dm_text), md5(sent_reply_text)).
        ON CONFLICT DO NOTHING. Returns the row id.
        """

    def count_by_campaign(self, campaign_id: uuid.UUID) -> int: ...
    def delete_by_campaign(self, campaign_id: uuid.UUID) -> int: ...
```

---

## 6. `IgDmRagService`

**File**: `apps/backend/src/services/ai/rag.py` (add class to existing file, keep `RagService` unchanged)

```python
def build_ig_dm_rag_query(summary: str, inbound_dm_text: str, max_dm_chars: int = 1000) -> str:
    """Returns f"Context: {summary}\n\nDM to reply to: {truncated_dm_text}" """

class IgDmRagService:
    """
    Parallel to RagService but queries ig_dm_reply_example table.
    Reuses ThreadSummarizer and EmbeddingService unchanged.
    """
    def __init__(
        self,
        db_session: Session,
        embedding_service: EmbeddingService | None = None,
        thread_summarizer: ThreadSummarizer | None = None,
    ) -> None: ...

    def fetch_examples(
        self,
        thread_context: str,       # DM thread XML from IgDmLoaderService.get_thread_context_for_llm()
        inbound_dm_text: str,      # The specific DM being replied to (last INBOUND message body_text)
        campaign_id: uuid.UUID,
        limit: int = 5,
        min_similarity: float = 0.3,
    ) -> RagResult:
        """
        Steps:
        1. thread_summarizer.summarize(thread_context) → summary
        2. build_ig_dm_rag_query(summary, inbound_dm_text) → rag_query
        3. embedding_service.embed_text(rag_query) → query_embedding
        4. IgDmReplyExampleRepository.search_similar(query_embedding, campaign_id, limit, min_similarity)
        5. Return RagResult(examples=results, summary=summary, query=rag_query)

        Note: RagResult.examples is typed as list[EmailReplyExample] in RagService.
        IgDmRagService returns list[IgDmReplyExample]. The return type annotation
        uses a new @dataclass IgDmRagResult or overloads RagResult via generics.
        Simplest: return a new IgDmRagResult dataclass.
        """

@dataclass
class IgDmRagResult:
    examples: list[IgDmReplyExample]
    summary: str
    query: str
```

**`format_rag_examples_xml` reuse**: The existing `format_rag_examples_xml(examples, use_sanitized, include_action_type)` in `rag.py` uses field names from `EmailReplyExample`. For IG DM, a new `format_ig_dm_rag_examples_xml()` produces the same structure with DM semantic tags:

```python
def format_ig_dm_rag_examples_xml(
    examples: list[IgDmReplyExample],
    use_sanitized: bool = True,
    include_action_type: bool = True,
) -> str:
    """
    Returns:
    <similar_examples>
      <example>
        <situation>{example.thread_summary}</situation>
        <action_type>{example.reply_summary}</action_type>
        <their_dm>{sanitized_reply_text or inbound_dm_text}</their_dm>
        <human_reply>{example.sent_reply_text}</human_reply>
      </example>
      ...
    </similar_examples>

    Key change vs email version: <their_email> → <their_dm>.
    """
```

---

## 7. `generate_ig_dm_draft()` Feature Function

**File**: `apps/backend/src/services/ai/features/ig_dm_drafting.py`

Parallels `response_drafting_with_rag.py` (primary path) and `response_drafting.py` (fallback when RAG has < 3 examples or campaign has no DM examples yet).

```python
from src.services.ai.llm import LlmService
from src.services.ai.rag import IgDmRagService, IgDmRagResult
from src.services.ai.ig_dm_loader import IgDmLoaderService
from src.models.llm.ig_dm_draft import IgDmDraftResult

# Campaign type → Langfuse prompt name mapping
IG_DM_DRAFT_PROMPT_MAP: dict[str, str] = {
    "paid_promotion": "drafting/ig-dm-drafting-paid-promotion",
    "gifting":        "drafting/ig-dm-drafting-gifting",
    "sales":          "drafting/ig-dm-drafting-sales",
    "general":        "drafting/ig-dm-drafting-general",
    "creator":        "drafting/ig-dm-drafting-general",  # alias
}

IG_DM_RAG_PROMPT_MAP: dict[str, str] = {
    "paid_promotion": "drafting/ig-dm-drafting-v1-rag-paid-promotion",
    "gifting":        "drafting/ig-dm-drafting-v1-rag-gifting",
    "sales":          "drafting/ig-dm-drafting-v1-rag-sales",
    "general":        "drafting/ig-dm-drafting-v1-rag-general",
    "creator":        "drafting/ig-dm-drafting-v1-rag-general",
}

WINDOW_REOPENER_PROMPT = "drafting/ig-dm-window-reopener"
IG_DM_DRAFT_MODEL = "gpt-4.1"           # Base path (matches email base path)
IG_DM_RAG_DRAFT_MODEL = "claude-opus-4-6"  # RAG path (matches email RAG path convention)
IG_DM_RAG_MIN_EXAMPLES = 3              # Minimum examples to use RAG path

def generate_ig_dm_draft(
    llm_service: LlmService,
    ig_dm_rag_service: IgDmRagService,
    thread_context: str,        # XML from IgDmLoaderService.get_thread_context_for_llm()
    inbound_dm_text: str,       # Last INBOUND message body_text (drafting target)
    campaign_id: uuid.UUID,
    campaign_type: str,         # "paid_promotion" | "gifting" | "sales" | "general" | "creator"
    campaign_goals: str,
    campaign_faqs: str,
    campaign_rules: str,
    agent_name: str,
    product_name: str,
    product_description: str,
    ig_handle: str,             # Sender's @username (replaces recipient_name_info / from_email)
    window_expires_at: datetime | None,
    previous_workflow_executions: str | None = None,
    force_base_path: bool = False,
) -> IgDmDraftResult:
    """
    Routing logic:
    1. If window_expires_at is within 2 hours of now():
       → Use WINDOW_REOPENER_PROMPT (regardless of RAG availability)
       → Model: IG_DM_DRAFT_MODEL
       → Returns IgDmDraftResult with a brief proactive outreach message

    2. If not force_base_path:
       → Fetch RAG examples via ig_dm_rag_service.fetch_examples()
       → If len(examples) >= IG_DM_RAG_MIN_EXAMPLES:
          → Use IG_DM_RAG_PROMPT_MAP[campaign_type]
          → Model: IG_DM_RAG_DRAFT_MODEL
          → Inject rag_examples XML via format_ig_dm_rag_examples_xml()
          → Returns IgDmDraftResult

    3. Fallback (force_base_path=True or < IG_DM_RAG_MIN_EXAMPLES examples):
       → Use IG_DM_DRAFT_PROMPT_MAP[campaign_type]
       → Model: IG_DM_DRAFT_MODEL
       → No RAG injection
       → Returns IgDmDraftResult

    All paths:
    - Retrieve Langfuse prompt via llm_service.langfuse_client.get_prompt(prompt_name, label=env_label)
    - Call llm_service.parse_structured(model, prompt, IgDmDraftResult, ...)
    - Observability: langfuse_session_id = ig_conversation_id (passed via thread_context), langfuse_user_id = user email
    """
```

---

## 8. Langfuse Prompt Templates

9 new prompt objects created in Langfuse UI. All follow the existing namespace convention (`drafting/` prefix).

### Prompt Naming

| Prompt Name | Purpose | Equivalent Email Prompt |
|-------------|---------|------------------------|
| `drafting/ig-dm-drafting-paid-promotion` | Base draft, paid campaigns | `drafting/reply-drafting-paid-promotion` |
| `drafting/ig-dm-drafting-gifting` | Base draft, gifting campaigns | `drafting/reply-drafting-gifting` |
| `drafting/ig-dm-drafting-sales` | Base draft, sales campaigns | `drafting/reply-drafting-sales` |
| `drafting/ig-dm-drafting-general` | Base draft, default/creator | `drafting/reply-drafting-general` |
| `drafting/ig-dm-drafting-v1-rag-paid-promotion` | RAG draft, paid | `drafting/reply-drafting-v13-rag` |
| `drafting/ig-dm-drafting-v1-rag-gifting` | RAG draft, gifting | `drafting/reply-drafting-v13-rag-gifting` |
| `drafting/ig-dm-drafting-v1-rag-sales` | RAG draft, sales | `drafting/reply-drafting-v13-rag-sales` |
| `drafting/ig-dm-drafting-v1-rag-general` | RAG draft, general | `drafting/reply-drafting-v13-rag-general` |
| `drafting/ig-dm-window-reopener` | 24h window re-opener | *(new, no email equivalent)* |

### Template Parameters (vs Email Prompts)

**Email prompts have** (audit reference: `audit-ai-drafting.md` §6):
- `subject`, `from_email`, `body`, `recipient_name_info` — email-specific fields
- `to`, `cc`, `bcc` in thread XML references — email-specific

**IG DM prompts replace/remove**:

| Removed (email-specific) | Replaced with (DM-specific) |
|--------------------------|----------------------------|
| `subject` | *(omitted)* |
| `from_email` | `ig_handle` (sender's @username) |
| `body` | `dm_text` (the DM message to reply to, max 1000 chars) |
| `recipient_name_info` | *(omitted; use `ig_handle`)* |
| Thread XML `<subject>/<to>/<cc>/<bcc>` | Thread XML `<channel>/<window_expires_at>/<from_handle>/<media_type>` |

**Retained from email prompts** (identical injection):
- `goals`, `faqs`, `rules_for_llm`, `thread_context` (the XML)
- `previous_workflow_executions`
- `agent_name`, `product_name`, `product_description`, `product_url`, `products_info`
- `sample_emails` — renamed to `sample_dms` in DM prompt templates
- `rag_examples` (RAG path only)

### System Prompt Differences

**Email system prompt** (current, from audit):
> "You are an expert at writing emails... Write only email body text (no subject, no markdown)"

**IG DM system prompt** (new):
> "You are an expert at writing Instagram DM replies for influencer marketing campaigns. Write a short, casual DM reply (1–4 sentences, plain text only, maximum 1000 characters). No markdown formatting, no subject line, no signature. Match the tone of a genuine DM conversation."

### Window-Reopener Prompt Design

**Prompt name**: `drafting/ig-dm-window-reopener`

**Purpose**: When the 24-hour reply window is within 2 hours of expiring, generate a brief proactive message designed to re-engage the creator and restart the window clock.

**System prompt**:
> "The 24-hour Instagram DM reply window is about to close. Generate a single, brief (1 sentence) casual message to re-engage the creator. The goal is to prompt a reply that reopens the messaging window. Do not reveal the technical constraint. Sound natural and genuinely interested."

**Parameters**: `ig_handle`, `thread_context` (last few messages), `agent_name`, `product_name`, `goals`

**Output**: `IgDmDraftResult(body_text: str)` — same model as all other DM drafts

**Routing**: Triggered by `generate_ig_dm_draft()` when `thread.is_window_expiring_soon` is `True`. The CE notification system (`spec-ce-ig-dm-notifications.md`) alerts operators when this draft is generated, with a "2h window remaining" badge.

---

## 9. Temporal Activity: `generate_ig_dm_draft_activity`

**File**: `apps/backend/src/temporal/activity/ig_dm_thread_response_draft_activity.py`

```python
from temporalio import activity
from src.models.temporal.ig_dm_ingest import Candidate   # Modified Candidate with ig_dm_account_id
from src.models.llm.ig_dm_draft import IgDmDraftResult

class GenerateIgDmDraftParams(BaseModel):
    candidate: Candidate
    campaign_id: uuid.UUID
    campaign_type: str
    campaign_goals: str
    campaign_faqs: str
    campaign_rules: str
    agent_name: str
    product_name: str
    product_description: str
    ig_handle: str              # Creator's resolved @username
    force_base_path: bool = False

class GenerateIgDmDraftResult(BaseModel):
    draft_body_text: str
    prompt_used: str            # Langfuse prompt name (for observability)
    used_rag: bool
    rag_example_count: int

@activity.defn
async def generate_ig_dm_draft_activity(params: GenerateIgDmDraftParams) -> GenerateIgDmDraftResult:
    """
    1. Instantiate IgDmLoaderService, get thread_context XML for candidate.ig_conversation_id
    2. Extract inbound_dm_text = thread.last_inbound_message.body_text
    3. Call generate_ig_dm_draft() with all campaign params
    4. Return GenerateIgDmDraftResult

    Retry policy: max_attempts=3, initial_interval=2s, backoff_coefficient=2.0, max_interval=30s
    Schedule-to-close timeout: 120s
    """
```

---

## 10. Temporal Activity: `ig_dm_save_draft_to_db_activity`

**File**: `apps/backend/src/temporal/activity/ig_dm_thread_response_draft_activity.py` (same file)

```python
class SaveIgDmDraftParams(BaseModel):
    candidate: Candidate
    draft_body_text: str
    ig_dm_thread_state_id: uuid.UUID

class SaveIgDmDraftResult(BaseModel):
    ig_dm_llm_draft_id: uuid.UUID

@activity.defn
async def ig_dm_save_draft_to_db_activity(params: SaveIgDmDraftParams) -> SaveIgDmDraftResult:
    """
    Upserts an ig_dm_llm_draft row:
    - ON CONFLICT (ig_dm_account_id, ig_conversation_id, ig_dm_thread_state_id)
      DO UPDATE SET draft_body_text = EXCLUDED.draft_body_text, status = 'pending'
    - Sets status = 'pending' (awaiting operator approval via CE tool)
    - Returns the row id

    Retry policy: max_attempts=3, initial_interval=1s, backoff_coefficient=2.0
    Schedule-to-close timeout: 30s
    """
```

---

## 11. Temporal Activity: `maybe_get_draft_by_ig_dm_thread_state_id_activity`

**File**: `apps/backend/src/temporal/activity/ig_dm_llm_draft.py` (new file, parallel to `gmail_thread_llm_draft.py`)

```python
class GetIgDmDraftByStateParams(BaseModel):
    ig_dm_thread_state_id: uuid.UUID
    ig_dm_account_id: uuid.UUID

class GetIgDmDraftByStateResult(BaseModel):
    draft: IgDmLlmDraftModel | None   # None if not found (use IgDmLlmDraft pydantic model from spec-pydantic-models)
    found: bool

@activity.defn
async def maybe_get_draft_by_ig_dm_thread_state_id_activity(
    params: GetIgDmDraftByStateParams,
) -> GetIgDmDraftByStateResult:
    """
    SELECT * FROM ig_dm_llm_draft
    WHERE ig_dm_thread_state_id = :state_id AND ig_dm_account_id = :account_id
    ORDER BY created_at DESC LIMIT 1

    Returns found=True if a draft with status='pending' exists.
    Returns found=False (and draft=None) if no draft exists or latest draft is not 'pending'.

    Used by IgDmThreadResponseDraftWorkflow to skip re-generation if draft already exists
    (parallel to maybe_get_draft_by_thread_state_id_activity in gmail_thread_llm_draft.py).

    Retry policy: max_attempts=3, initial_interval=1s
    Schedule-to-close timeout: 15s
    """
```

---

## 12. `IgDmThreadResponseDraftWorkflow`

**File**: `apps/backend/src/temporal/workflow/ig_dm_thread_response_draft_workflow.py`

```python
from temporalio import workflow
from src.models.temporal.ig_dm_ingest import Candidate

class IgDmThreadResponseDraftResult(BaseModel):
    ig_dm_llm_draft_id: uuid.UUID | None
    skipped: bool
    skip_reason: str | None   # "already_exists" | "window_expired" | "no_inbound_message"

@workflow.defn
class IgDmThreadResponseDraftWorkflow:
    @workflow.run
    async def run(self, candidate: Candidate) -> IgDmThreadResponseDraftResult:
        """
        Steps:
        1. check_is_latest_for_ig_dm_thread_state_activity(candidate)
           → If not latest: return skipped=True, skip_reason="stale_state"
        2. maybe_get_draft_by_ig_dm_thread_state_id_activity(candidate)
           → If found and not force_reply: return skipped=True, skip_reason="already_exists"
        3. generate_ig_dm_draft_activity(params)
           → Includes window-expiry routing (uses WINDOW_REOPENER_PROMPT if < 2h)
        4. ig_dm_save_draft_to_db_activity(params)
        5. Return IgDmThreadResponseDraftResult(ig_dm_llm_draft_id=..., skipped=False)

        Task queue: same as email drafting workflow ("cheerful-task-queue" or equivalent)
        Workflow ID: "ig-dm-draft-{candidate.ig_dm_thread_state_id}"
        Workflow execution timeout: 5 minutes
        """
```

### Modification to `ThreadResponseDraftWorkflow`

**File**: `apps/backend/src/temporal/workflow/thread_response_draft_workflow.py`

Add IG DM branch to existing discriminator logic. Current discriminator (from audit):
```python
is_smtp = candidate.smtp_account_id is not None
```

New discriminator:
```python
is_smtp = candidate.smtp_account_id is not None
is_ig_dm = candidate.ig_dm_account_id is not None   # NEW

if is_ig_dm:
    # Route to IgDmThreadResponseDraftWorkflow (child workflow)
    # OR inline: call generate_ig_dm_draft_activity + ig_dm_save_draft_to_db_activity
    ...
elif is_smtp:
    # Existing SMTP path: generate_draft_using_llm_activity (no RAG)
    ...
else:
    # Gmail path: generate_draft_with_rag_activity + upload_llm_draft_to_gmail_activity
    ...
```

**Preferred approach**: Inline IG DM steps in `ThreadResponseDraftWorkflow` (same pattern as Gmail/SMTP) rather than spawning a child workflow. Keeps the coordinator's interface uniform — it always calls `ThreadResponseDraftWorkflow`.

---

## 13. RAG Ingestion Pipeline: `ingest_ig_dm_reply_examples_activity`

**File**: `apps/backend/src/temporal/activity/ingest_ig_dm_reply_examples_activity.py`

Parallels `ingest_email_reply_examples_activity.py` exactly.

```python
class IgDmReplyExampleInput(BaseModel):
    ig_conversation_id: str
    thread_context: str          # Full DM thread XML
    inbound_dm_text: str         # The DM being replied to
    sent_reply_text: str         # What was actually sent
    sanitized_reply_text: str | None = None
    reply_summary: str | None = None

class IngestIgDmReplyExamplesParams(BaseModel):
    campaign_id: uuid.UUID
    examples: list[IgDmReplyExampleInput]

class IngestIgDmReplyExamplesResult(BaseModel):
    inserted_count: int
    skipped_count: int

@activity.defn
async def ingest_ig_dm_reply_examples_activity(
    params: IngestIgDmReplyExamplesParams,
) -> IngestIgDmReplyExamplesResult:
    """
    For each example in params.examples:
    1. thread_summarizer.summarize(example.thread_context) → thread_summary
    2. build_ig_dm_rag_query(thread_summary, example.inbound_dm_text) → rag_query
    3. embedding_service.embed_text(rag_query) → embedding
    4. ig_dm_reply_example_repository.insert(...) → inserted or skipped (ON CONFLICT DO NOTHING)

    Batch embed optimization: call embedding_service.embed_batch() for all examples at once
    before iterating (same optimization used in email RAG ingestion).

    Retry policy: max_attempts=3, initial_interval=5s, backoff_coefficient=2.0
    Schedule-to-close timeout: 5 minutes (batch may be large)
    """
```

**Trigger**: This activity is NOT automatically triggered on DM receipt. It must be explicitly invoked (same as `ingest_email_reply_examples_activity`). Callers:
1. Manual trigger via backend admin endpoint (to backfill historical DM replies)
2. Future: after operator marks a sent DM reply as "good example" via CE tool

**`reply_summary` values**: Same 8-label taxonomy as email RAG:
`brief acceptance | brief decline | brief counter-offer | brief follow-up question | brief confirmation | brief scheduling | brief thanks | brief update`

---

## 14. Domain Model: `IgDmReplyExample`

**File**: `apps/backend/src/models/temporal/ig_dm_reply_example.py`

```python
from dataclasses import dataclass
from datetime import datetime
import uuid

@dataclass
class IgDmReplyExampleInput(BaseModel):
    """Input model for ingestion activity."""
    ig_conversation_id: str
    thread_context: str
    inbound_dm_text: str
    sent_reply_text: str
    sanitized_reply_text: str | None = None
    reply_summary: str | None = None

class IngestIgDmReplyExamplesParams(BaseModel):
    campaign_id: uuid.UUID
    examples: list[IgDmReplyExampleInput]

class IngestIgDmReplyExamplesResult(BaseModel):
    inserted_count: int
    skipped_count: int
```

---

## 15. Observability Wiring

No structural changes to Langfuse observability. Only ID values differ:

| Observability Field | Email Value | IG DM Value |
|--------------------|-------------|-------------|
| `langfuse_session_id` | `gmail_thread_id` | `ig_conversation_id` |
| `langfuse_user_id` | user email | user email (unchanged) |
| `langfuse_trace_name` | `"email_draft_{campaign_type}"` | `"ig_dm_draft_{campaign_type}"` |

The `@langfuse.observe()` decorator pattern and generation tracking require no changes — only the values differ.

---

## 16. `check_is_latest_for_ig_dm_thread_state_activity`

**File**: `apps/backend/src/temporal/activity/ig_dm_thread_state_activity.py` (see `spec-temporal-interfaces.md`)

Parallels `check_is_latest_for_thread_state_activity` in `gmail_thread_state.py`. Used by `IgDmThreadResponseDraftWorkflow` to skip draft generation if the thread state is stale (a newer message arrived before drafting completed).

```python
class CheckIsLatestIgDmThreadStateParams(BaseModel):
    ig_dm_thread_state_id: uuid.UUID
    ig_conversation_id: str
    ig_dm_account_id: uuid.UUID

class CheckIsLatestIgDmThreadStateResult(BaseModel):
    is_latest: bool

@activity.defn
async def check_is_latest_for_ig_dm_thread_state_activity(
    params: CheckIsLatestIgDmThreadStateParams,
) -> CheckIsLatestIgDmThreadStateResult:
    """
    SELECT id FROM ig_dm_thread_state
    WHERE ig_conversation_id = :convo_id AND ig_dm_account_id = :account_id
    ORDER BY created_at DESC LIMIT 1

    Returns is_latest = (latest_id == params.ig_dm_thread_state_id)
    """
```

---

## Summary of Changes

### New Files (10)

| File | Purpose |
|------|---------|
| `services/ai/ig_dm_loader.py` | Thread context XML generation for IG DMs |
| `services/ai/features/ig_dm_drafting.py` | `generate_ig_dm_draft()` with RAG/base/window-reopener routing |
| `models/llm/ig_dm_draft.py` | `IgDmDraftResult(body_text)`, review/revision models |
| `models/database/ig_dm_llm_draft.py` | SQLAlchemy ORM for `ig_dm_llm_draft` table |
| `models/temporal/ig_dm_reply_example.py` | Input/output models for RAG ingestion activity |
| `repositories/ig_dm_reply_example.py` | pgvector search + insert for `ig_dm_reply_example` |
| `temporal/activity/ig_dm_thread_response_draft_activity.py` | `generate_ig_dm_draft_activity`, `ig_dm_save_draft_to_db_activity` |
| `temporal/activity/ig_dm_llm_draft.py` | `maybe_get_draft_by_ig_dm_thread_state_id_activity` |
| `temporal/activity/ingest_ig_dm_reply_examples_activity.py` | RAG ingestion pipeline |
| `temporal/workflow/ig_dm_thread_response_draft_workflow.py` | `IgDmThreadResponseDraftWorkflow` |

### Modified Files (5)

| File | Change |
|------|--------|
| `services/ai/rag.py` | Add `IgDmRagService`, `IgDmRagResult`, `build_ig_dm_rag_query()`, `format_ig_dm_rag_examples_xml()` |
| `temporal/workflow/thread_response_draft_workflow.py` | Add `is_ig_dm` branch to discriminator |
| `temporal/activity/gmail_thread_llm_draft.py` | Add `maybe_get_draft_by_ig_dm_thread_state_id_activity` (or move to new `ig_dm_llm_draft.py`) |
| `temporal/workflow/__init__.py` | Export `IgDmThreadResponseDraftWorkflow` |
| `temporal/activity/__init__.py` | Export 4 new IG DM draft/RAG activities |

### Unchanged (channel-agnostic, zero modifications)

`LlmService`, `EmbeddingService`, `ThreadSummarizer`, `ClaudeAgentService`, all classification features, Langfuse observability pattern, retry logic.

### External (Langfuse UI — 9 new prompt objects)

`drafting/ig-dm-drafting-{paid-promotion,gifting,sales,general}` (base)
`drafting/ig-dm-drafting-v1-rag-{paid-promotion,gifting,sales,general}` (RAG)
`drafting/ig-dm-window-reopener` (24h window reopener)
