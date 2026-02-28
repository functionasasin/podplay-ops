# Backend Services Audit

**Aspect**: `audit-backend-services`
**Date**: 2026-02-28
**Source**: `../../projects/cheerful/apps/backend/src/services/`

---

## Directory Structure

```
src/services/
├── __init__.py                    # Global lazy-loaded service container
├── text_utils.py                  # html_to_plain_text, etc.
├── composio_adapter.py
├── ai/
│   ├── claude_agent.py            # ClaudeAgentService
│   ├── embedding.py               # EmbeddingService
│   ├── features/
│   ├── llm.py                     # LlmService (multi-provider)
│   ├── rag.py                     # RagService + RagResult
│   ├── reply_sanitizer.py         # ReplySanitizer
│   ├── structured_output_parser.py
│   ├── structured_output_validator.py
│   └── thread_summarizer.py       # ThreadSummarizer
├── campaign/
│   ├── queue_populator.py
│   ├── queue_single_recipient.py
│   └── summary_generator.py
├── creator/
│   ├── creator_list_service.py
│   ├── creator_service.py
│   └── enrichment_service.py
├── csv/
├── email/
│   ├── batch.py
│   ├── draft_recipients.py        # EmailDraftRecipientsService
│   ├── loader.py                  # EmailLoaderService
│   ├── normalization.py
│   ├── personalization.py
│   ├── processor.py               # Message processing functions
│   ├── reply.py                   # Reply header functions
│   ├── smtp_draft_recipients.py   # SmtpDraftRecipientsService
│   └── storage.py                 # EmailStorageService (attachment upload)
├── external/
│   ├── apify.py
│   ├── bio_link_apify.py
│   ├── firecrawl.py
│   ├── gmail.py                   # GmailService
│   ├── gsheet.py
│   ├── influencer_club.py
│   ├── shopify_proxy.py
│   ├── slack_service.py
│   ├── smtp_email.py              # SmtpEmailService
│   └── youtube_apify.py
├── post_tracking/
├── processing/
│   └── attachment_extract.py      # NOTE: No "processing coordinator" service here
├── storage/
├── tools/
├── utils/
└── workflow/
    ├── executor.py                # WorkflowExecutor
    └── formatter.py              # format_executions_for_llm()
```

**Key finding**: The thread processing coordinator is a **Temporal workflow**, not a service.
It lives at: `src/temporal/workflow/thread_processing_coordinator_workflow.py`

---

## Global Service Container

**File**: `src/services/__init__.py`
**Pattern**: Lazy-loaded singletons via global variables + factory functions

```python
# Module-level globals (None until first call)
_llm_service: LlmService | None = None
_supabase_client: Client | None = None
# etc.

def get_llm_service() -> LlmService: ...          # OpenAI + Anthropic + Langfuse clients
def get_supabase_client() -> Client: ...           # Supabase storage client
def get_storage_service() -> StorageService: ...
def get_email_storage_service() -> EmailStorageService: ...
def get_apify_service() -> ApifyService: ...
def get_firecrawl_service() -> FirecrawlService: ...
def get_youtube_apify_service() -> YoutubeApifyService: ...
def get_influencer_club_service() -> InfluencerClubService: ...
def get_creator_image_service() -> CreatorImageService: ...
```

---

## External Services

### GmailService

**File**: `src/services/external/gmail.py`
**Purpose**: Thin wrapper around the Gmail API v1

```python
class GmailService:
    def __init__(self, gmail_service: Any, email_address: str)

    @classmethod
    def for_user(cls, email_address: str, db: Session) -> "GmailService"
    # Fetches UserGmailAccount, decrypts refresh_token via crypto_service.decrypt(),
    # builds google.oauth2.credentials.Credentials, calls credentials.refresh(Request()),
    # builds service via googleapiclient.discovery.build("gmail", "v1", credentials=...)

    def get_history(self, start_history_id: str) -> GmailApiHistoryResponse
    # historyTypes=["messageAdded"], returns GmailApiHistoryResponse

    def get_message(self, message_id: str) -> GmailApiMessage
    # format="raw" always; raises on non-404 errors, re-raises 404

    def get_messages_batch(self, message_ids: list[str]) -> list[GmailApiMessage]
    # Sequential calls; silently skips 404s

    def get_messages_in_chunks(
        self, message_ids: Iterator[str], chunk_size: int = 50
    ) -> Iterator[list[GmailApiMessage]]
    # Uses BatchProcessor.chunked()

    def list_messages(
        self, query: str | None = None, max_results: int = 500
    ) -> Iterator[str]
    # Paginated; yields message IDs; max_results capped at 500

    def get_attachment(self, message_id: str, attachment_id: str) -> bytes
    # Returns raw attachment bytes (base64url-decoded)

    def get_message_using_rfc822_message_id(
        self, rfc822_message_id: str
    ) -> GmailApiMessage
    # Queries Gmail with rfc822msgid:, then fetches full message

    def get_thread(self, thread_id: str) -> GmailApiThread
    # format="minimal"

    def list_send_as(self) -> GmailApiSendAsListResponse
    # Lists send-as aliases for the authenticated user

    def create_draft(
        self,
        from_email_address: str,
        to_email_addresses: list[str],
        cc_email_addresses: list[str] | None,
        bcc_email_addresses: list[str] | None,
        in_reply_to_header: str | None,
        references_header: str | None,
        subject: str,
        body_text: str,
        thread_id: str | None = None,
    ) -> GmailApiDraft
    # Validates from == authenticated user, builds MIME, POSTs to Gmail drafts API
```

**Module-level helpers** (not class methods):
```python
def _build_mime_message(
    subject: str,
    from_email: str,
    to_email_addresses: list[str],
    cc_email_addresses: list[str] | None,
    bcc_email_addresses: list[str] | None,
    body_text: str,
    in_reply_to_header: str | None,
    references_header: str | None,
) -> str  # base64url-encoded RFC 2822 message

def _create_draft_body(raw_message: str, thread_id: str | None = None) -> dict[str, Any]
```

**Credential pattern**:
- Refresh token stored encrypted in `user_gmail_account.refresh_token`
- Decrypted with `crypto_service.decrypt()` at service creation
- Token refreshed eagerly via `credentials.refresh(Request())` if not valid
- Scopes: `gmail.modify`, `gmail.send`, `gmail.labels`

---

### SmtpEmailService

**File**: `src/services/external/smtp_email.py`
**Purpose**: Send email via SMTP + manage drafts via IMAP

```python
class SmtpEmailService:
    def __init__(
        self,
        email_address: str,
        display_name: str | None,
        smtp_host: str,
        smtp_port: int,
        smtp_username: str,
        smtp_password: str,            # Already decrypted
        smtp_use_tls: bool,
        imap_host: str | None = None,
        imap_port: int = 993,
        imap_username: str | None = None,
        imap_password: str | None = None,  # Already decrypted
        imap_use_ssl: bool = True,
    )

    @classmethod
    def for_user(cls, email_address: str, db: Session) -> "SmtpEmailService"
    # Fetches UserSmtpAccount, decrypts smtp_password + imap_password

    @classmethod
    def for_account(cls, account) -> "SmtpEmailService"
    # From pre-fetched account model (same decryption)

    def _get_imap_connection(self) -> imaplib.IMAP4_SSL | imaplib.IMAP4
    # Creates authenticated IMAP connection (caller must logout())

    def create_draft(
        self,
        to_email_addresses: list[str],
        cc_email_addresses: list[str] | None,
        subject: str,
        body_text: str,
        in_reply_to_header: str | None = None,
        references_header: str | None = None,
    ) -> SmtpDraft  # SmtpDraft(uid: str, message_id: str)
    # Creates MIME message, appends to IMAP Drafts folder with \Draft \Seen flags
    # Parses APPENDUID from IMAP response for UID

    def delete_draft(self, draft_id: str) -> None
    # Sets \Deleted flag on IMAP UID, then expunge; no-op if not found

    def send_draft(self, draft_id: str) -> str
    # Fetches draft from IMAP by UID, sends via SMTP, deletes from Drafts folder
    # Returns Message-ID (stripped of angle brackets)
    # Raises ApplicationError (non_retryable) if draft not found
```

---

## Email Services

### EmailLoaderService

**File**: `src/services/email/loader.py`
**Purpose**: Reconstruct complete email threads from DB; format as XML for LLM

```python
class EmailLoaderService:
    def __init__(self, db_session: Session)
    # Lazily imports get_email_storage_service() to avoid circular imports

    def get_complete_thread(
        self,
        gmail_thread_id: str,
        internal_date_high_water_mark: datetime | None = None,
    ) -> EmailThreadView
    # Queries GmailMessageRepository.get_sorted_thread_before_high_water_mark()
    # Fetches attachment content via AttachmentRepository.batch_get_llm_extracted_content_by_gmail_message_ids()
    # Returns EmailThreadView(gmail_thread_id, messages: list[EmailThreadMessageView], total_message_count)

    def convert_thread_to_xml(
        self, thread: EmailThreadView, max_number_of_emails: int
    ) -> str
    # Takes last max_number_of_emails messages; builds xmltodict structure; unparses to XML string
    # XML structure: <email_thread id="..." total_messages="...">
    #   <message id="N" direction="..." timestamp="...">
    #     <from>, <to>, <cc>, <bcc>, <subject>, <body>

    def get_thread_context_for_llm(
        self,
        gmail_thread_id: str,
        max_number_of_emails: int,
        internal_date_high_water_mark: datetime | None = None,
    ) -> str
    # Convenience: get_complete_thread() + convert_thread_to_xml()

    def _get_full_email_body_text(self, email: GmailMessage) -> str | None
    # Strips quoted replies from body:
    # - If body_text: uses EmailReplyParser (plaintext quote stripping)
    # - If body_html only: strips HTML quote elements (blockquote, gmail_quote div),
    #   then converts to plaintext via html_to_plain_text()
    # Returns None if all content was quoted

    @staticmethod
    def _strip_quoted_replies__html(body: str) -> str | None
    # Removes <blockquote>, gmail_quote divs, Apple Mail/Outlook/Thunderbird quote elements
    # Returns None if all content was quoted
```

**Thread XML format** (from `convert_thread_to_xml`):
```xml
<email_thread id="{gmail_thread_id}" total_messages="{N}">
  <message id="1" direction="inbound" timestamp="2026-01-15T10:30:00+00:00">
    <from>creator@example.com</from>
    <to>brand@cheerful.com</to>
    <cc/>
    <bcc/>
    <subject>RE: Campaign Partnership</subject>
    <body>Hi, I'd love to participate...</body>
  </message>
</email_thread>
```

**Multi-language quote header patterns** (stripped before LLM):
- English: `On ... wrote:`
- Dutch: `Op ... schreef ...`
- French: `Le ... a écrit :`
- Spanish: `El ... escribió :`
- German: `Am ... schrieb ...`

---

### Email Reply Headers

**File**: `src/services/email/reply.py`

```python
def create_reply_header__in_reply_to_header(gmail_message: GmailMessage) -> str | None
# Returns gmail_message.message_id_header

def create_reply_header__references_header(gmail_message: GmailMessage) -> str
# Returns f"{gmail_message.references_header or ''} {gmail_message.message_id_header or ''}"
# Used for Gmail API threading
```

---

### EmailDraftRecipientsService

**File**: `src/services/email/draft_recipients.py`
**Purpose**: Calculate To/CC addresses for Gmail draft creation

**Key logic**:
- **Response draft** (latest message is INBOUND): reply-all (exclude own email from To, include original To in CC)
- **Follow-up draft** (latest message is OUTBOUND): copy previous To/CC recipients

---

### SmtpDraftRecipientsService

**File**: `src/services/email/smtp_draft_recipients.py`
**Purpose**: Same as `EmailDraftRecipientsService` but uses `SmtpMessageRepository`

---

### Email Processor Functions

**File**: `src/services/email/processor.py`
**Purpose**: Convert Gmail API message objects to database records (`GmailMessage` model)

**Constants**:
- `MAX_BODY_TEXT_LENGTH = 64 * 1024` (64KB cap for searchable text)
- `MAX_BODY_HTML_LENGTH = 256 * 1024` (256KB cap for HTML)

**Module-level functions** (not a class):
```python
def _safe_formataddr(pair: tuple[str, str]) -> str | None
def _strip_nul_chars(text: str | None) -> str | None
# (plus message processing functions that parse Gmail API message format)
```

---

## AI Services

### LlmService

**File**: `src/services/ai/llm.py`
**Purpose**: Multi-provider LLM with structured output support

```python
class LlmService:
    def __init__(
        self,
        openai_client: OpenAI,
        langfuse_client: Langfuse,
        anthropic_client: Anthropic | None = None,
    )

    def parse_structured(
        self,
        model: str,
        prompt: str,
        response_model: type[T],
        instructions: str | None = None,
        max_tokens: int = 1024,
    ) -> T
    # Routes: model.startswith("claude") -> Anthropic, else -> OpenAI
    # Anthropic: uses beta.messages.parse() with betas=["structured-outputs-2025-11-13"]
    # OpenAI: uses responses.parse()

    @staticmethod
    def retry_block(fn: Callable)
    # tenacity: stop_after_attempt(3), wait_exponential(), reraise=True
```

**Langfuse integration**: `langfuse_client.get_prompt(name, label=DeployEnvironment.for_prompt_version())`
- Labels control prompt version (dev vs prod)
- `prompt_from_langfuse.compile(**variables)` for variable substitution

---

### EmbeddingService

**File**: `src/services/ai/embedding.py`

```python
EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIMENSIONS = 1536

class EmbeddingService:
    def __init__(self, client: OpenAI | None = None)
    def embed_text(self, text: str) -> list[float]  # Single embedding
    def embed_batch(self, texts: list[str]) -> list[list[float]]  # Batch, max 2048
```

---

### RagService

**File**: `src/services/ai/rag.py`
**Purpose**: Retrieve similar email examples for RAG-enhanced draft generation

```python
@dataclass
class RagResult:
    examples: list[EmailReplyExample]
    summary: str
    query: str

class RagService:
    def __init__(
        self,
        db_session,
        embedding_service: EmbeddingService | None = None,
        thread_summarizer: ThreadSummarizer | None = None,
    )

    def fetch_examples(
        self,
        thread_context: str,
        inbound_email_body: str,
        campaign_id: uuid.UUID,
        limit: int = 5,
        min_similarity: float = 0.3,
    ) -> RagResult
    # Step 1: ThreadSummarizer.summarize(thread_context)
    # Step 2: build_rag_query(summary, inbound_email_body)
    # Step 3: EmbeddingService.embed_text(query)
    # Step 4: EmailReplyExampleRepository.search_similar(embedding, campaign_id, limit, min_similarity)
    # Returns: RagResult(examples, summary, query)
```

**Module-level functions**:
```python
def build_rag_query(
    summary: str, inbound_email_body: str, max_email_chars: int = 4000
) -> str
# Returns f"Context: {summary}\n\nEmail to reply to: {truncated_email}"
# Matches indexed document format for consistent embedding space

def format_rag_examples_xml(
    examples: list[EmailReplyExample],
    use_sanitized: bool = True,
    include_action_type: bool = True,
) -> str
# Returns XML like:
# <similar_examples>
#   <example>
#     <situation>...</situation>
#     <action_type>...</action_type>  (if include_action_type and reply_summary exists)
#     <their_email>...</their_email>
#     <human_reply>...</human_reply>  (sanitized_reply_text if available and use_sanitized)
#   </example>
# </similar_examples>
```

**RAG repository**: `EmailReplyExampleRepository` (from `src/repositories/email_reply_example`)
- Table: `email_reply_example` (confirmed in db-schemas audit)
- Search method: `search_similar(query_embedding, campaign_id, limit, min_similarity)`

---

### ThreadSummarizer

**File**: `src/services/ai/thread_summarizer.py`

```python
HAIKU_MODEL = "claude-haiku-4-5-20251001"

class ThreadSummarizer:
    def __init__(self, client: anthropic.Anthropic | None = None)
    def summarize(self, thread_context: str) -> str  # 200 max_tokens
    def summarize_batch(self, thread_contexts: list[str]) -> list[str]  # Sequential
```

**System prompt focus**: Stage of conversation, key topics, relationship/tone

---

### ReplySanitizer

**File**: `src/services/ai/reply_sanitizer.py`
**Purpose**: Sanitize human replies for RAG ingestion (remove creator-specific details)

```python
OPUS_MODEL = "claude-opus-4-20250514"

@dataclass
class SanitizedReply:
    sanitized_text: str
    summary: str

class ReplySanitizer:
    def __init__(self, client: anthropic.Anthropic | None = None)

    def sanitize(self, reply_text: str) -> str
    # Replaces with placeholders: promo codes -> [CODE], IDs -> [ID],
    # dates -> [DATE], names -> [NAME], negotiated amounts -> [NEGOTIATED_AMOUNT]
    # Keeps: standard rates, deliverable specs, deadlines, terms, tone

    def summarize(self, reply_text: str) -> str
    # Returns action-type label: "brief acceptance", "brief decline",
    # "brief counter-offer", "brief follow-up question", etc.

    def process(self, reply_text: str) -> SanitizedReply
    # sanitize() + summarize() combined
```

---

### ClaudeAgentService

**File**: `src/services/ai/claude_agent.py`
**Purpose**: Execute user-defined CampaignWorkflows via Claude Agent SDK with MCP tools

```python
class ClaudeAgentService:
    def __init__(self, llm_service: LlmService | None = None)

    @langfuse.observe()
    async def execute_workflows_with_agent(
        self,
        workflows: list[CampaignWorkflow],
        thread_context: str,
        mcp_server_config: dict[str, Any],
        workflow_configs: dict[str, dict[str, Any]],
        langfuse_session_id: str | None = None,
        langfuse_user_id: str | None = None,
    ) -> ClaudeAgentExecutionResult
    # Uses ClaudeSDKClient with mcp_servers, allowed_tools (mcp__{server}__{slug})
    # Gets prompt from Langfuse "execute_user_workflows", compiles with variables
    # Parses structured outputs from Claude's text responses
    # Returns ClaudeAgentExecutionResult(status, workflows_executed, messages, tool_calls, structured_outputs)
```

---

## Creator Services

### CreatorService

**File**: `src/services/creator/creator_service.py`
**Purpose**: Save/update creator records from Instagram and YouTube sources

Key functions (module-level, not a class):
- Functions for saving creators with Instagram handles and YouTube channel data
- Used during enrichment workflows

### EnrichmentService

**File**: `src/services/creator/enrichment_service.py`
**Purpose**: Multi-step email enrichment for creators (find email addresses via external sources)

### CreatorListService

**File**: `src/services/creator/creator_list_service.py`
**Purpose**: Creator list management operations

---

## Workflow Services

### WorkflowExecutor

**File**: `src/services/workflow/executor.py`

```python
class WorkflowExecutor:
    def select_tools_for_workflows(
        self, workflows: list[CampaignWorkflow]
    ) -> set[str]
    # Returns deduplicated set of tool_slugs across all workflows
```

### Workflow Formatter

**File**: `src/services/workflow/formatter.py`

```python
def format_executions_for_llm(
    executions: list[CampaignWorkflowExecution],
) -> str
# Returns JSON string with recency labels (just now/today/yesterday/N days ago)
# Sorts by executed_at descending
```

---

## The `Candidate` Object

**File**: `src/models/temporal/gmail_thread_state.py`
**Purpose**: Data transfer object encapsulating complete context about a thread ready for Temporal processing

```python
class Candidate(BaseModel):
    gmail_thread_id: str                           # Thread identifier (same field for Gmail AND SMTP threads)
    gmail_account_id: uuid.UUID | None = None      # Gmail account (one of gmail/smtp required)
    smtp_account_id: uuid.UUID | None = None       # SMTP account (one of gmail/smtp required)
    user_id: uuid.UUID
    state__id: uuid.UUID                           # GmailThreadState or SmtpThreadState row ID
    state__latest_internal_date: datetime          # Timestamp of latest message
    state__latest_gmail_message_id: uuid.UUID      # Latest message row ID
    latest_gmail_message__direction: GmailMessageDirection  # INBOUND or OUTBOUND
    user__email: str | None = None
    gmail_account__email: str | None = None        # Sending account email
    force_reply: bool = False                      # Bypass campaign goal/rule checks (set by unhide)
    force_campaign_id: uuid.UUID | None = None     # Skip LLM campaign association
```

**Note**: Despite the field being named `gmail_thread_id`, it's also used for SMTP threads. This is a naming artifact of the SMTP precedent — SMTP threads reuse the same `Candidate` model.

**Populated by**:
- `GmailThreadStateRepository.get_candidates_from_ids()` (line ~391 in `repositories/gmail_thread_state.py`)
- `SmtpThreadStateRepository.get_candidates_from_ids()` (line ~159 in `repositories/smtp_thread_state.py`)

**IG DM extension needed**: Add `ig_dm_account_id: uuid.UUID | None = None` and `ig_conversation_id: str | None = None` fields (parallel to `gmail_account_id`/`smtp_account_id`).

---

## Dependency Injection Patterns

### 1. Lazy-Loaded Singletons (`services/__init__.py`)
Used for heavy, global services (LLM clients, storage, external APIs):
```python
_llm_service: LlmService | None = None

def get_llm_service() -> LlmService:
    global _llm_service
    if _llm_service is None:
        _llm_service = LlmService(...)
    return _llm_service
```

### 2. FastAPI Dependencies (`api/dependencies/`)

**`auth.py`** - JWT authentication:
```python
async def get_current_user(token: str = Depends(...)) -> AuthUser
# Validates Supabase JWT (HS256 or ES256 via JWKS)
# Supports dev impersonation via get_optional_user + impersonation header

async def get_optional_user(...) -> AuthUser | None
```

**`service_auth.py`** - Service-to-service auth:
```python
async def verify_service_api_key(x_service_api_key: str = Header(...)) -> None
# Validates X-Service-Api-Key header against settings.SERVICE_API_KEY
```

**`impersonation.py`** - Dev-only impersonation:
- Only active in `development` environment
- Looks up user by email from `user_gmail_account` table

### 3. Constructor Injection
Services receive dependencies as constructor arguments:
```python
RagService(db_session, embedding_service=EmbeddingService(), thread_summarizer=ThreadSummarizer())
EmailLoaderService(db_session)  # Gets storage service lazily
```

### 4. `@classmethod for_user()` Factory Pattern
User-scoped services with credential management:
```python
GmailService.for_user(email_address, db)
SmtpEmailService.for_user(email_address, db)
```

---

## Credential Storage Pattern

Both Gmail and SMTP use the same pattern:
1. OAuth/password tokens stored **encrypted** in database columns
2. Decrypted at service creation time via `crypto_service.decrypt()`
3. **Never stored in plaintext** in any repository

```python
# Gmail
decrypted_token = crypto_service.decrypt(account.refresh_token)
credentials = Credentials(token=None, refresh_token=decrypted_token, ...)

# SMTP
decrypted_smtp_password = crypto_service.decrypt(account.smtp_password)
decrypted_imap_password = crypto_service.decrypt(account.imap_password)
```

**IG DM will need**: Encrypt access_token and long-lived_token before storing in `user_ig_dm_account`. Use same `crypto_service.decrypt()` pattern at service creation.

---

## Key Takeaways for IG DM Integration

1. **New `IgDmService`** should follow `GmailService` pattern:
   - `__init__(ig_service_client: Any, ig_account_id: str)`
   - `@classmethod for_account(account_id: uuid.UUID, db: Session) -> "IgDmService"`
   - Decrypts tokens via `crypto_service.decrypt()`

2. **`Candidate` model** needs 3rd account type field: `ig_dm_account_id: uuid.UUID | None = None`

3. **Thread context XML** will need a parallel `IgDmLoaderService` that produces:
   ```xml
   <ig_dm_thread id="{ig_conversation_id}" channel="instagram_dm">
     <message id="1" direction="inbound" timestamp="...">
       <from_igsid>...</from_igsid>
       <from_username>...</from_username>
       <body>...</body>
       <media_type>image</media_type>
       <media_url>...</media_url>
     </message>
   </ig_dm_thread>
   ```

4. **RAG service is channel-agnostic** (`RagService` takes any `thread_context` string) — only the template/repo need to change for IG DM.

5. **LlmService is channel-agnostic** — prompt name changes drive behavior differences.

6. **`get_llm_service()`** can be reused directly for IG DM drafting — no changes needed.

---

## Files

- Audited: `src/services/external/gmail.py`
- Audited: `src/services/external/smtp_email.py`
- Audited: `src/services/email/loader.py`
- Audited: `src/services/email/reply.py`
- Audited: `src/services/email/processor.py` (partial)
- Audited: `src/services/email/draft_recipients.py`
- Audited: `src/services/email/smtp_draft_recipients.py`
- Audited: `src/services/email/storage.py` (partial)
- Audited: `src/services/ai/llm.py`
- Audited: `src/services/ai/embedding.py`
- Audited: `src/services/ai/rag.py`
- Audited: `src/services/ai/thread_summarizer.py`
- Audited: `src/services/ai/reply_sanitizer.py`
- Audited: `src/services/ai/claude_agent.py`
- Audited: `src/services/workflow/executor.py`
- Audited: `src/services/workflow/formatter.py`
- Audited: `src/services/__init__.py`
- Audited: `src/models/temporal/gmail_thread_state.py` (Candidate class)
- Audited: `src/api/dependencies/auth.py`
- Audited: `src/api/dependencies/service_auth.py`
- Audited: `src/api/dependencies/impersonation.py`
