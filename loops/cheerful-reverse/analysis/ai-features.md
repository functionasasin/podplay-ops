# AI Features Analysis

## Purpose
Cheerful uses AI/LLM throughout its core workflows to automate the work that would otherwise require human operators for every creator conversation: drafting replies, classifying emails, extracting structured data from threads, and generating campaign reports. The AI layer is the product's core differentiator — without it, the platform is just a bulk email tool.

## Infrastructure Layer

### LlmService (`services/ai/llm.py`)
The single entrypoint for all structured LLM calls. Provider-agnostic: routes to OpenAI or Anthropic based on model name prefix (`claude` → Anthropic, everything else → OpenAI).

```python
class LlmService:
    openai_client: OpenAI
    anthropic_client: Anthropic | None
    langfuse_client: Langfuse

    def parse_structured(model, prompt, response_model: type[T], instructions, max_tokens) -> T
    def retry_block(fn: Callable)  # 3 attempts, exponential backoff via tenacity
```

**OpenAI path** (`_parse_with_openai`): Uses `client.responses.parse(text_format=response_model)` — the OpenAI Structured Outputs API, which guarantees schema-valid JSON.

**Anthropic path** (`_parse_with_anthropic`): Uses `client.beta.messages.parse(betas=["structured-outputs-2025-11-13"], output_format=response_model)` — Claude's equivalent structured outputs beta.

**Retry**: All AI calls in features use `llm_service.retry_block(fn)` → tenacity `stop_after_attempt(3)` + `wait_exponential()`. If all retries fail, exception propagates to the calling Temporal activity which has its own retry policy.

**Observability**: All calls tracked via Langfuse generations with input, output, model, and prompt version.

### EmbeddingService (`services/ai/embedding.py`)
```python
EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIMENSIONS = 1536

def embed_text(text: str) -> list[float]
def embed_batch(texts: list[str]) -> list[list[float]]  # max 2048 per batch
```
Used exclusively by `RagService` to embed RAG queries against the `email_reply_examples` pgvector table.

### ThreadSummarizer (`services/ai/thread_summarizer.py`)
```python
MODEL = "claude-haiku-4-5-20251001"
MAX_TOKENS = 200

def summarize(thread_context: str) -> str  # 1-2 sentence summary
```
**Purpose**: Converts a full email thread XML dump into a 1-2 sentence summary focused on stage, topics, and relationship tone. Used as the semantic "query seed" for RAG retrieval so the embedding captures situational meaning rather than raw email text.

**Prompt strategy** (hardcoded, not Langfuse):
```
Focus on: conversation stage, key topics (campaign details, payment, content), relationship/tone
→ Respond with ONLY the summary, no preamble
```

### ReplySanitizer (`services/ai/reply_sanitizer.py`)
```python
MODEL = "claude-opus-4-20250514"

def sanitize(reply_text: str) -> str       # Removes creator-specific PII
def summarize(reply_text: str) -> str      # Action-type label
def process(reply_text: str) -> SanitizedReply
```
**Purpose**: After a human operator edits/sends an email reply, this service converts it into a reusable RAG training example by scrubbing creator-specific details (promo codes, dates, names, negotiated amounts) while preserving campaign-level tone and structure.

**Sanitize prompt strategy** (hardcoded):
- REMOVE: promo codes → [CODE], tracking IDs → [ID], agreed dates → [DATE], other names → [NAME], non-standard amounts → [NEGOTIATED_AMOUNT]
- KEEP: standard campaign rates, deliverable specs, campaign deadlines, tone

**Summarize prompt** (hardcoded): Classifies reply into exactly one of 8 action labels:
`brief acceptance | brief decline | brief counter-offer | brief follow-up question | brief confirmation | brief scheduling | brief thanks | brief update`

Uses Claude Opus (highest quality) because sanitized examples become training data for future RAG generations — quality here multiplies forward.

### RagService (`services/ai/rag.py`)
```python
def fetch_examples(thread_context, inbound_email_body, campaign_id, limit=5, min_similarity=0.3) -> RagResult
```
**4-step RAG pipeline:**
1. **Summarize**: `ThreadSummarizer.summarize(thread_context)` → 1-2 sentence summary
2. **Build query**: `f"Context: {summary}\n\nEmail to reply to: {email_body[:4000]}"` — matches indexed document format
3. **Embed**: `EmbeddingService.embed_text(query)` → 1536-dim vector
4. **Search**: `EmailReplyExampleRepository.search_similar(...)` — pgvector cosine similarity against campaign-scoped examples

**Result format**: `RagResult{examples: list[EmailReplyExample], summary: str, query: str}`

**XML formatter** (`format_rag_examples_xml`):
```xml
<similar_examples>
  <example>
    <situation>Thread summary</situation>
    <action_type>brief acceptance</action_type>
    <their_email>inbound text</their_email>
    <human_reply>sanitized reply text</human_reply>
  </example>
</similar_examples>
```
Uses sanitized replies (`use_sanitized=True`) by default to prevent hallucinating creator-specific details.

### StructuredOutputParser (`services/ai/structured_output_parser.py`)
Parses `WORKFLOW_OUTPUT_{uuid}` JSON blocks from Claude Agent SDK text responses:
```
WORKFLOW_OUTPUT_<uuid>
```json
{"field": "value"}
```
```
Used by `ClaudeAgentService` to extract structured outputs when Claude cannot return structured output directly through the tool call mechanism.

Also provides `parse_json_string_as_dict()`: strips control chars (`\x00-\x1f\x7f`), validates non-empty, parses JSON, asserts dict type.

### ClaudeAgentService (`services/ai/claude_agent.py`)
**Purpose**: Executes user-defined campaign workflows (custom automation steps configured per campaign) by running Claude as an autonomous agent with access to MCP tools.

```python
async def execute_workflows_with_agent(
    workflows: list[CampaignWorkflow],
    thread_context: str,             # XML email thread
    mcp_server_config: dict,          # Which MCP server to connect to
    workflow_configs: dict,           # Per-workflow runtime config
    langfuse_session_id, langfuse_user_id,
) -> ClaudeAgentExecutionResult
```

**Execution flow:**
1. Build tool allowlist: `[f"mcp__{server_name}__{slug}" for wf in workflows for slug in wf.tool_slugs]`
2. Configure `ClaudeAgentOptions(permission_mode="bypassPermissions", disallowed_tools=["Read","Write","Edit"])`
3. Build prompt from Langfuse `execute_user_workflows` with: thread context, workflow descriptions/IDs, per-workflow configs, output schemas
4. Execute via `ClaudeSDKClient.query(prompt)` + stream `receive_response()`
5. Collect `TextBlock` (narrative) and `ToolUseBlock` (tool calls) messages
6. Parse `WORKFLOW_OUTPUT_{uuid}` JSON blocks from text using `StructuredOutputParser`
7. Return `ClaudeAgentExecutionResult{status, workflows_executed, messages, tool_calls, structured_outputs}`

**Why**: User-defined workflows let campaigns automate actions like "look up Shopify order status when creator asks about their gift" without hardcoding those integrations into the core platform. The MCP tool layer provides the connectors; Claude decides which tools to use based on natural language workflow instructions.

---

## Feature Catalog

### Feature 1: Response Drafting (`features/response_drafting.py`)

**User problem solved**: Operators spend hours manually writing replies to hundreds of creator emails. AI drafting generates a contextually appropriate draft in seconds, which operators review or auto-send.

#### `generate_draft()`
Campaign-type-specific prompt routing:

| Campaign Type | Langfuse Prompt | Default Model |
|--------------|-----------------|---------------|
| PAID_PROMOTION | `drafting/reply-drafting-paid-promotion` | gpt-4.1 |
| GIFTING | `drafting/reply-drafting-gifting` | gpt-4.1 |
| SALES | `drafting/reply-drafting-sales` | gpt-4.1 |
| OTHER/CREATOR | `drafting/reply-drafting-general` | gpt-4.1 |
| Legacy (no FAQs/samples) | `reply-drafting` | gpt-5-mini |

**Legacy vs Modern detection**: If `campaign__frequently_asked_questions_for_llm` or `campaign__sample_emails_for_llm` is None → legacy path. Modern campaigns have both.

**Key prompt variables** (modern):
- `goals`, `faqs`, `rules_for_llm`, `thread_specific_rules`
- `thread_context`, `previous_workflow_executions`
- `sample_emails` (few-shot examples), `agent_name`
- `product_name/description/url`, `products_info` (JSON array for multi-product)

**Hardcoded instruction** (system prompt):
```
You are an expert at writing emails. FORBIDDEN: em-dash (—). Write only email body text (no subject, no markdown).
```

**Output schema**: `ResponseDraftResult{subject: str, body_text: str}`

#### `review_intention_alignment()`
Reviews draft for strategic alignment with campaign goals. Prompt: `review/intention-alignment`.
**Output**: `ResponseDraftReviewResult{needs_revision: bool, reasoning: str}`

#### `review_content_accuracy()`
Reviews draft for factual accuracy (rates, deadlines, details). Prompt: `review/content-accuracy`.
**Output**: Same `ResponseDraftReviewResult`

#### `revise_draft_content()`
Given a draft + list of review results, produces an improved version. Prompt: `email-revision`. Default model: `o3` (most powerful, used for final quality revision).
**Output**: `ResponseDraftRevisionResult{revised_subject: str, revised_body_text: str}`

---

### Feature 2: RAG-Enhanced Draft (`features/response_drafting_with_rag.py`)

**User problem solved**: Base drafting may not match the human tone/style the brand has established. RAG drafting learns from past human-written replies to replicate exact phrasing and structure.

```python
generate_draft_with_rag(
    campaign_type, campaign_id,
    ...,  # same campaign/thread params as generate_draft
    rag_example_limit=5,
    rag_min_similarity=0.3,
) -> ResponseDraftResult
```

**Model**: `claude-opus-4-5-20251101` (Claude Opus 4.5 — highest quality for this critical use case)

**Campaign-type-specific prompts** (V13 RAG series):
| Campaign Type | Langfuse Prompt |
|--------------|-----------------|
| PAID_PROMOTION | `drafting/reply-drafting-v13-rag` |
| GIFTING | `drafting/reply-drafting-v13-rag-gifting` |
| SALES | `drafting/reply-drafting-v13-rag-sales` |
| CREATOR/OTHER | `drafting/reply-drafting-v13-rag-general` |

**RAG injection**: Fetches up to 5 similar examples from pgvector, formats as XML, prepends with:
```
=== SIMILAR SITUATIONS WITH HUMAN-WRITTEN REPLIES ===
IMPORTANT: If any <their_email> below closely matches the email you need to reply to,
USE THAT <human_reply> AS YOUR TEMPLATE. Copy the structure and phrasing exactly...
```

**Failure mode**: If RAG fetch fails (e.g., pgvector unavailable), logs warning and continues without examples — graceful degradation.

---

### Feature 3: Correction-Injected Draft (`features/response_drafting_with_corrections.py`)

**User problem solved**: When operators consistently correct AI drafts in similar ways, injecting past correction examples teaches the model those patterns without fine-tuning.

```python
generate_draft_with_corrections(
    ...,
    correction_examples: list[CorrectionExample],
    include_thread_context_in_examples: bool = False,
) -> ResponseDraftResult
```

**Data source**: JSONL files in `scripts/draft-rework/data/`, named `{campaign_name}_campaign.jsonl`. Each record: `{thread_context, original_draft, sent_email}`.

**Injection format**:
```xml
<correction_examples>
  <instructions>Learn from these examples of AI drafts and how humans corrected them...</instructions>
  <example id="1">
    <ai_draft>original draft text</ai_draft>
    <human_sent>what was actually sent</human_sent>
  </example>
</correction_examples>
```
Prepended to `thread_context` before prompt compilation.

**Uses same Langfuse prompts** as `generate_draft()` — the correction examples arrive as context, not as separate prompt configuration.

---

### Feature 4: Follow-Up Drafting (`features/follow_up_drafting.py`)

**User problem solved**: When creators don't reply, operators need contextually appropriate follow-up messages that escalate appropriately (follow-up #1 vs #3 has very different tone).

```python
generate_follow_up_draft(
    campaign__goal_for_llm, campaign__system_rules_for_llm,
    campaign__agent_name_for_llm, thread_context_for_llm,
    follow_up_number: int,
) -> ResponseDraftResult
```

**Langfuse prompt**: `follow-up-generation`
**Default model**: `gpt-5-mini`
**Key variable**: `follow_up_number` — prompt uses this to adjust urgency/tone (e.g., first follow-up is gentle reminder, third is final notice).

---

### Feature 5: Opt-In/Out Classification (`features/opt_in_classification.py`)

**User problem solved**: Determines automatically whether a creator's reply represents acceptance or rejection of the campaign offer, enabling auto-routing (opt-ins get drafted responses; opt-outs close the thread).

```python
classify_opt_in_or_out(thread_context_for_llm) -> OptInClassificationResult
```

**Output schema**:
```python
OptInClassificationResult:
    is_opt_in: bool      # True = interested/proceeding, False = declining/unsubscribing
    asked_questions: bool # True = has questions → route to draft review instead of auto-send
    reasoning: str
```

**Langfuse prompt**: `classification/opt-in-out`
**Default model**: `gpt-4.1-mini`

**Routing impact**: `asked_questions=True` prevents auto-sending the response — forces operator review since the reply needs to address specific creator questions.

---

### Feature 6: Workflow Classification (`features/workflow_classification.py`)

**User problem solved**: Campaigns can have many user-defined workflows (e.g., "log to Shopify when creator provides address", "send contract when creator accepts"). This AI classifier determines which workflows are triggered by the current thread state.

```python
classify_applicable_workflows(
    thread_context_for_llm: str,
    available_workflows: list[CampaignWorkflow],
    previous_workflow_executions: str | None,
) -> list[str]  # workflow UUID strings
```

**LLM input**: Structured list of available workflows with their `name` and `instructions`, plus thread context and prior execution history.
**Langfuse prompt**: `classify_downstream_workflows`
**Default model**: `gpt-4.1-mini`
**Output schema**: `WorkflowClassificationResult{applicable_workflow_ids: list[str], reasoning: str}`

---

### Feature 7: Thread Completion Check (`features/thread_completion_check.py`)

**User problem solved**: The system needs to know when to stop processing a thread (no more replies needed, campaign goal achieved or creator declined). This prevents wasted follow-up efforts.

```python
is_thread_done(thread_context_for_llm, campaign__goal_for_llm, campaign__rules_for_llm) -> IsThreadDoneResult
```

**Output schema**: `IsThreadDoneResult{is_thread_done: bool, reasoning: str}`
**Langfuse prompt**: `classification-follow-up`
**Default model**: `gpt-4.1-mini`

---

### Feature 8: Thread Flag Extraction (`features/thread_flag_extraction.py`)

**User problem solved**: Gives operators at-a-glance signal indicators for each creator conversation — allowing them to prioritize which threads need immediate attention (creator wants paid, has open question, reported an issue).

```python
extract_thread_flags(thread_context_for_llm, campaign_details_for_llm) -> ExtractThreadFlagsResult
```

**Output schema**:
```python
ExtractThreadFlagsResult:
    wants_paid: bool          # Creator requesting payment / only does paid collabs
    wants_paid_reason: str | None
    has_question: bool        # Creator asked a question / needs clarification
    has_question_reason: str | None
    has_issue: bool           # Creator reported a problem / blocker
    has_issue_reason: str | None
```

**Langfuse prompt**: `thread-flags/extract`
**Default model**: `gpt-4.1-nano` (cheapest — runs on every thread update)

---

### Feature 9: Campaign Association (`features/campaign_association.py`)

**User problem solved**: When a new email arrives in a monitored Gmail account, the system needs to know which campaign it belongs to before processing. This is especially important for accounts managing multiple campaigns simultaneously.

#### `maybe_find_campaign_association()`
Primary association step: given a list of active campaigns and the thread, returns the best match.

**Output**: `CampaignAssociationResult{campaign_exists: bool, campaign_id: str | None, confidence_score: float | None, reasoning: str}`
**Langfuse prompt**: `campaign-association`
**Default model**: `gpt-4.1-mini`

#### `double_check_campaign_association()`
Verification step: given a specific campaign's goal/rules and the thread, confirms whether the thread actually belongs to that campaign. Returns `IsEmailAssociatedToCampaignResult{is_ignored: bool, confidence_score: float, reasoning: str}`.
**Langfuse prompt**: `classification`

---

### Feature 10: Metrics Extraction (`features/metrics_extraction.py`)

**User problem solved**: Brands track campaign outcomes (views, engagement, links posted, etc.) across creator threads. This feature reads email conversations and extracts structured metrics for Google Sheets reporting, eliminating manual data entry.

#### `extract_metrics_from_thread()`
```python
extract_metrics_from_thread(
    campaign__google_sheet_data_instructions: str,  # What metrics to extract and how
    thread_context_for_llm: str,
    google_sheet_header_names_for_llm: str,          # Column names to populate
    previous_failed_attempts_for_llm: str,           # Retry context if prior extraction failed
    previous_workflow_executions: str | None,
) -> ExtractMetricsFromThreadResult
```

**Tricky output schema**: `Metrics{metrics_json_dump: str, reasoning: str}` — metrics returned as JSON string inside structured output (because OpenAI Structured Outputs doesn't support dynamic dict schemas). Then parsed via `StructuredOutputParser.parse_json_string_as_dict()` with control-char sanitization.

**Final type**: `ExtractMetricsFromThreadResult{metrics: dict[str, Any], reasoning: str}`
**Langfuse prompt**: `metrics-extraction`
**Default model**: `gpt-4.1`

#### `review_metrics_extraction()`
Quality review pass on extracted metrics — validates each field individually.

**Output**: `ReviewMetricsExtractionResult{reasoning_per_field: list[MetricsReasoning{is_accurate, field_name, reasoning}]}`
**Langfuse prompt**: `metrics-review`
**Default model**: `gpt-4.1`

---

### Feature 11: Campaign Creator Extraction (`features/campaign_creator_extraction.py`)

**User problem solved**: As email conversations progress, the system needs to track who the creator is (name, email, social handles) and their current campaign status. This feature reads threads and extracts/updates structured creator records.

**Two-phase extraction**:

#### Phase 1: `_identify_creators_from_thread()`
Identifies unique creator identifiers (names/emails) present in the thread.
**Langfuse prompt**: `creator-extraction/identify-creators`
**Output**: `UniqueIdentifiersResult{unique_identifiers: list[str]}`
**Default model**: `gpt-4.1-mini`

#### Phase 2: `_extract_creator_details_from_thread()` (per creator)
Extracts full details for each identified creator. Campaign-type-specific schemas:

- **GIFTING**: `ExtractCampaignCreatorResultGiftingWithRole{email, name, social_media_handles, gifting_status, gifting_address, role_info}`
  - `gifting_status`: CONTACTED → UNRESPONSIVE → PENDING_DETAILS → READY_TO_SHIP → SHIPPED → DELIVERED → DECLINED
- **PAID_PROMOTION**: `ExtractCampaignCreatorResultPaidPromotionWithRole{..., paid_promotion_status, paid_promotion_rate, role_info}`
  - `paid_promotion_status`: NEW → NEGOTIATING → AWAITING_CONTRACT → CONTRACT_SIGNED → CONTENT_IN_PROGRESS → AWAITING_REVIEW → CHANGES_REQUESTED → CONTENT_APPROVED → POSTED → AWAITING_PAYMENT → PAID → DECLINED
- **Generic**: `ExtractCampaignCreatorResultWithRole{email, name, social_media_handles, role_info}`

**Role classification** (all types): `ExtractedContactRole{role: creator|talent_manager|agency_staff|internal|unknown, confidence_score: float, role_reasoning: str, talent_manager_name?, talent_manager_email?, talent_agency?}`

**Langfuse prompt**: `creator-extraction/extract-details`
**Default model**: `gpt-5.1` (powerful — creator record accuracy is critical)

#### `match_creator_with_existing_rows()`
Fuzzy-matches a newly extracted creator against existing DB records (batched XML format) to prevent duplicates.
**Langfuse prompt**: `creator-extraction/match-existing`
**Output**: `MaybeFindMatchFromBatchedCampaignCreatorRowsResult{matched_social_media_creator_number: int | None, reasoning: str}`
**Default model**: `gpt-4.1-mini`

---

### Feature 12: Creator Note Generation (`features/creator_note_generation.py`)

**User problem solved**: Operators need a quick text summary of each creator's situation without reading the entire email thread. The system auto-generates and updates these notes as conversations evolve.

```python
generate_creator_note(
    thread_context, campaign_details,
    existing_note: str | None,
) -> GenerateCreatorNoteResult
```

**Output schema**: `GenerateCreatorNoteResult{note: str (max 500 chars), should_update: bool}`
`should_update=False` → skip DB write if only minor wording changes (cost/noise optimization)

**Langfuse prompt**: `creator-notes/generate` (with hardcoded fallback if Langfuse unavailable)
**Model**: `gpt-4o-mini` (legacy naming, cost-efficient)

---

### Feature 13: Client Summary Generation (`features/client_summary_generation.py`)

**User problem solved**: Account managers need to send regular status updates to brand clients summarizing the state of all creators across their campaign. This feature generates professional, ready-to-send summaries from raw creator data.

```python
generate_client_summary_text(
    campaign_name: str,
    creator_rows: list[CreatorSummaryRow],
    thread_contexts: dict[str, str],  # gmail_thread_id → XML context
) -> str  # plain text markdown
```

**Model**: `claude-haiku-4-5-20251001` (fast, readable prose)
**Langfuse prompt**: `client-summary/generate` (with extensive hardcoded fallback)

**LLM responsibility**: Unlike other features, the LLM is given raw unstructured data and told to intelligently categorize. The system prompt defines category headers with emojis:
- ⚠️ Video and scripts needing review / ⏳ Getting final touches / 🔄 Changes requested
- 📹 Waiting on videos / ✅ Video Approved / 📝 Awaiting contract
- 🎁 Awaiting Shipping Details / 📬 Shipped / 👀 Awaiting Response / ❌ Not Participating

Returns plain text markdown (not structured JSON) — uses Anthropic client's `messages.create()` directly.

---

### Feature 14: OCR (`features/ocr.py`)

**User problem solved**: Creators sometimes send screenshots or images containing contract terms, content metrics, or other information that needs to be extracted as text for processing.

```python
extract_text_from_image(img_base64: str) -> str | None
```

**Model**: `gpt-4.1` with vision
**Prompt**: "Extract all text from this image accurately. Preserve formatting, tables, and structure."
**Input format**: Base64-encoded JPEG embedded as `input_image` content block

---

## Model Selection Summary

| Model | Used For | Reasoning |
|-------|----------|-----------|
| `claude-opus-4-20250514` | Reply sanitization | Training data quality multiplies forward |
| `claude-opus-4-5-20251101` | RAG draft generation | Highest quality for flagship feature |
| `claude-haiku-4-5-20251001` | Thread summarization, client summary | Fast, cost-efficient for prose tasks |
| `gpt-4.1` | Base draft generation, metrics extraction, OCR | Reliable structured outputs, multimodal |
| `gpt-5.1` | Creator detail extraction | Complex structured extraction with high accuracy needs |
| `o3` | Draft revision | Maximum reasoning for final quality pass |
| `gpt-4.1-mini` | Most classifiers | Good enough for binary/enum decisions |
| `gpt-4.1-nano` | Thread flag extraction | Cheapest, runs on every thread |
| `gpt-4o-mini` | Creator note generation | Legacy model name, cost-efficient |
| `gpt-5-mini` | Legacy draft path, follow-up | Intermediate quality |

## Prompt Management Architecture

All prompts stored in **Langfuse** with label-based versioning:
- `DeployEnvironment.for_prompt_version()` returns environment label (`production`/`staging`/`development`)
- Prompt fetched by name + label, then compiled with template variables
- Each feature has a hardcoded `default_model` fallback if `prompt.config["model"]` absent
- Some features (creator note, client summary) have full hardcoded fallback system prompts if Langfuse unavailable

**Prompt namespace pattern**:
```
drafting/reply-drafting-{campaign_type}       # Draft generation
drafting/reply-drafting-v13-rag-{type}        # RAG draft generation
review/intention-alignment                     # Draft review
review/content-accuracy                        # Draft review
email-revision                                 # Draft revision
follow-up-generation                           # Follow-up drafting
classification/opt-in-out                      # Opt-in classification
classification-follow-up                       # Thread done check
classification                                 # Campaign association check
campaign-association                           # Campaign association
classify_downstream_workflows                  # Workflow routing
thread-flags/extract                           # Flag extraction
creator-extraction/identify-creators           # Creator ID phase 1
creator-extraction/extract-details             # Creator ID phase 2
creator-extraction/match-existing              # Creator dedup
metrics-extraction                             # Metrics extraction
metrics-review                                 # Metrics review
creator-notes/generate                         # Creator notes
client-summary/generate                        # Client summary
execute_user_workflows                         # Claude Agent orchestration
```

## Observability Pattern

Every AI feature function is decorated with `@langfuse.observe(as_type="span", capture_input=False)`. Inside, LLM calls use `langfuse_client.start_as_current_generation(...)` context manager with:
- `name`: function name for the specific call
- `model`: which model was used
- `input`: compiled prompt
- `prompt`: Langfuse prompt object (links to prompt version)
- `version`: environment label

Session/user attribution (`langfuse_session_id` = Gmail thread ID, `langfuse_user_id` = user email) enables full tracing across all LLM calls within a single thread processing run.

## RAG Architecture Summary

```
Sent Reply
    ↓
ReplySanitizer.process()
    ├── Anthropic Opus: sanitize PII → sanitized_reply_text
    └── Anthropic Opus: classify action → reply_summary
    ↓
Store in email_reply_examples (pgvector table)
    ├── thread_summary (from ThreadSummarizer)
    ├── inbound_email_text
    ├── sent_reply_text (original)
    ├── sanitized_reply_text
    ├── reply_summary (action label)
    └── embedding (1536-dim vector of query format)

─────────────────────────────────────────────

New Thread Processing
    ↓
RagService.fetch_examples()
    ├── ThreadSummarizer (Haiku): summarize thread → 1-2 sentences
    ├── build_rag_query(): "Context: {summary}\n\nEmail to reply to: {body[:4000]}"
    ├── EmbeddingService: embed query → vector
    └── pgvector similarity search (campaign-scoped, threshold 0.3, top-5)
    ↓
format_rag_examples_xml() → XML block
    ↓
Injected into generate_draft_with_rag() prompt as {rag_examples}
    ↓
Claude Opus 4.5: draft email using human reply as template
```

## Key Design Decisions

1. **No auto-send for questions**: `opt_in_classification.asked_questions=True` forces draft review even for opt-ins — prevents AI from guessing at creator questions.

2. **Graceful RAG degradation**: `generate_draft_with_rag()` catches all RAG exceptions and continues without examples rather than failing the draft.

3. **Two-phase creator extraction**: Identify first (cheap, finds all relevant emails), then extract per-creator (expensive, only run once per unique creator). Prevents paying for extraction on irrelevant emails.

4. **`should_update` optimization**: Creator note generation returns `False` if content is substantively the same — avoids unnecessary DB writes and preserves note history cleanliness.

5. **Metrics as JSON string**: OpenAI Structured Outputs can't handle dynamic dict schemas, so metrics are returned as a JSON string inside a fixed schema field, then re-parsed server-side.

6. **XML thread context format**: All AI features receive thread context as XML (not plain text) — consistent structure helps models reliably identify message boundaries, senders, and timestamps without training.

7. **Campaign-type-specific prompts**: Different prompt variants for PAID_PROMOTION/GIFTING/SALES/GENERAL — each campaign type has fundamentally different terminology and negotiation patterns that warrant specialized prompts.
