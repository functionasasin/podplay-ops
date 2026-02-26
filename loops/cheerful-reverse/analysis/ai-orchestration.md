# AI Orchestration — Comprehensive Map

**Aspect:** `ai-orchestration`
**Source:** Wave 1 analyses: ai-features, context-engine-core, context-engine-mcp-tools, temporal-workflows, backend-services
**Scope:** Every place Claude/AI is used across the Cheerful stack, prompt strategies, model selection logic, and how the two AI systems (backend pipeline + context engine) orchestrate their work.

---

## Two Distinct AI Systems

Cheerful has two completely separate AI systems with different models, architectures, and purposes:

| System | Model | Pattern | Purpose |
|--------|-------|---------|---------|
| **Backend AI Pipeline** | GPT-4.1 family, Claude Opus/Haiku, o3 | Sequential DAG + agentic subgraph | Email automation at scale |
| **Context Engine** | claude-opus-4-6 | Agentic loop (discover → execute) | Internal team productivity via Slack |

They share no code, no MCP servers, and no prompt infrastructure. The Context Engine accesses the backend *as an external API client* via Cheerful MCP tools.

---

## System 1: Backend AI Pipeline

### Entry Point: Temporal Workflow DAG

All backend AI is invoked through **Temporal activities** inside `ThreadProcessingCoordinatorWorkflow`. The coordinator is the central orchestrator — every AI step is an activity with its own timeout, retry policy, and Langfuse observability.

The overall AI call sequence for an **inbound email thread**:

```
Gmail/SMTP Message Received
        │
        ▼
[ThreadProcessingCoordinatorWorkflow]
        │
        ├─1─ [ThreadAttachmentExtractWorkflow] ─────────── OCR/vision attachments
        ├─2─ [ThreadAssociateToCampaignWorkflow] ──────── Campaign association LLM
        ├─3─ execute_campaign_workflows ──────────────── Workflow classification + Claude Agent
        ├─4─ extract_campaign_creator ────────────────── 3-phase creator extraction LLM
        ├─5─ extract_thread_flags ────────────────────── Flag extraction LLM
        ├─6─ check_domain_and_classify ───────────────── Opt-in/out classification LLM
        ├─7─ [ThreadExtractMetricsWorkflow] ──────────── Metrics extraction LLM (conditional)
        ├─8─ [ThreadResponseDraftWorkflow] ──────────── Draft generation (RAG + review)
        │       └─ ingest_sent_reply_as_example ──────── RAG index (post-send)
        ├─9─ check_if_thread_is_done ─────────────────── Thread completion LLM
        └─10─ schedule_follow_up ──────────────────────── [ThreadFollowUpDraftWorkflow]
                                                                └─ Follow-up draft LLM
```

### AI Call Inventory (Backend)

#### Step 1: Attachment Content Extraction

**Service**: `services/processing/attachment_extract.py`
**Workflow**: `ThreadAttachmentExtractWorkflow` → `extract_attachment` activity
**When**: Gmail only; skipped for SMTP

**What it does**: Fetches email attachment bytes (PDFs, images, media kits) and extracts text content using Claude's vision API.

**Feature**: `features/ocr.py` → `extract_text_from_image(img_base64)`
- **Model**: `gpt-4.1` (vision-capable)
- **Prompt strategy**: Direct instruction — "Extract all text from this image accurately. Preserve formatting, tables, and structure."
- **Input format**: Base64-encoded JPEG as `input_image` content block
- **Output**: Raw string or `None` (if no text detected)
- **Storage**: Written to `email_attachment.llm_extracted_content` for later prompt injection

**User problem solved**: Creators send rate cards, media kits, and content screenshots as image attachments. Without OCR, these are invisible to the AI drafting pipeline.

---

#### Step 2: Campaign Association (Two-Phase LLM)

**Service**: `features/campaign_association.py`
**Workflow**: `ThreadAssociateToCampaignWorkflow` → `handle_thread_no_campaign` activity
**When**: Only when thread has no existing campaign DB association

**Phase 1 — Primary Matching**: `maybe_find_campaign_association()`
- **Model**: `gpt-4.1-mini`
- **Langfuse prompt**: `campaign-association`
- **Input**: List of active campaigns (goal + rules + key context) + thread XML
- **Output schema**: `CampaignAssociationResult{campaign_exists: bool, campaign_id: str | None, confidence_score: float | None, reasoning: str}`

**Phase 2 — Verification**: `double_check_campaign_association()`
- **Model**: `gpt-4.1-mini`
- **Langfuse prompt**: `classification`
- **Input**: Specific campaign goal/rules + thread XML
- **Output schema**: `IsEmailAssociatedToCampaignResult{is_ignored: bool, confidence_score: float, reasoning: str}`
- **Purpose**: Prevents false positives — a second call confirms the Phase 1 match before writing to DB

**User problem solved**: Gmail accounts often manage multiple simultaneous campaigns. Without LLM matching, every reply would require manual routing.

---

#### Step 3: User-Defined Workflow Execution (Claude Agent Subgraph)

**Service**: `services/ai/claude_agent.py` → `execute_workflows_with_agent()`
**Activity**: `execute_campaign_workflows` in `ThreadProcessingCoordinatorWorkflow`
**When**: Gmail + has campaign; triggered for every processed inbound thread

This is the most complex AI invocation — an **agentic loop** within the larger pipeline:

**Step 3a — Workflow Classification**:
- **Feature**: `features/workflow_classification.py` → `classify_applicable_workflows()`
- **Model**: `gpt-4.1-mini`
- **Langfuse prompt**: `classify_downstream_workflows`
- **Input**: Thread context XML + list of campaign-configured workflows (name + instructions) + previous execution history
- **Output schema**: `WorkflowClassificationResult{applicable_workflow_ids: list[str], reasoning: str}`
- **Returns**: List of workflow UUIDs that should execute for this thread

**Step 3b — Claude Agent Execution** (if applicable workflows found):

```python
execute_workflows_with_agent(
    workflows,             # Only the classified-applicable ones
    thread_context,        # XML email thread
    mcp_server_config,     # Per-campaign MCP server (GoAffPro, Apify, etc.)
    workflow_configs,      # Per-workflow runtime config dicts
)
```

**Model**: `claude-opus-4-20250514` (Opus for complex multi-tool reasoning)
**Langfuse prompt**: `execute_user_workflows`

**Agent setup**:
- Permission mode: `bypassPermissions` (no sandboxing)
- Disallowed tools: `["Read", "Write", "Edit"]` (filesystem tools blocked)
- Allowed tools: `[f"mcp__{server_name}__{slug}" for wf in workflows for slug in wf.tool_slugs]`
- MCP server contains campaign-specific tools (GoAffPro, Apify media, etc.)

**Tool categories available to campaign workflows**:
| Category | Tools |
|----------|-------|
| GoAffPro | `goaffpro_create_affiliate`, `goaffpro_create_discount`, `goaffpro_search_affiliate` |
| Instagram | `apify_get_instagram_profile`, `apify_get_instagram_posts`, `apify_find_similar_profiles` |
| Media | `download_media_file`, `extract_audio_from_video`, `convert_image_to_base64`, `transcribe_audio`, `analyze_video_custom` |
| Scraping | `apify_scrape_instagram_hashtags`, `apify_scrape_instagram_mentions` |

**Prompt structure**:
- System: "Execute the following user-defined workflows given the thread context"
- Thread context injected as XML
- Per-workflow: description, ID, instructions, output schema
- Previous executions formatted with recency labels ("just now", "2 days ago")
- Output format: `WORKFLOW_OUTPUT_{uuid}` JSON blocks

**Response parsing**:
- `ClaudeAgentService` streams messages from Claude SDK
- Collects `TextBlock` (narrative) and `ToolUseBlock` (tool calls)
- `StructuredOutputParser` extracts `WORKFLOW_OUTPUT_{uuid}` JSON from text
- Returns `ClaudeAgentExecutionResult{status, workflows_executed, messages, tool_calls, structured_outputs}`

**User problem solved**: Campaigns have unique automation needs (e.g., "when creator accepts gifting, look up their IG stats and post to GoAffPro"). Hardcoding these would require platform changes for every client. User-defined workflows + Claude agent = unlimited automation without code changes.

---

#### Step 4: Creator Extraction (Three-Phase LLM)

**Feature**: `features/campaign_creator_extraction.py`
**Activity**: `extract_campaign_creator` in `ThreadProcessingCoordinatorWorkflow`
**When**: Gmail + has campaign; non-critical (wrapped in try/except, failure doesn't halt processing)

**Phase 4a — Creator Identification**: `_identify_creators_from_thread()`
- **Model**: `gpt-4.1-mini` (cheap; just finds names/emails present)
- **Langfuse prompt**: `creator-extraction/identify-creators`
- **Output**: `UniqueIdentifiersResult{unique_identifiers: list[str]}`

**Phase 4b — Per-Creator Detail Extraction**: `_extract_creator_details_from_thread()` (run once per identified creator)
- **Model**: `gpt-5.1` (expensive; complex structured extraction with high accuracy needs)
- **Langfuse prompt**: `creator-extraction/extract-details`
- **Output schema — campaign-type-specific**:
  - GIFTING: `{email, name, social_media_handles, gifting_status, gifting_address, role_info}`
    - `gifting_status` enum: CONTACTED → UNRESPONSIVE → PENDING_DETAILS → READY_TO_SHIP → SHIPPED → DELIVERED → DECLINED
  - PAID_PROMOTION: `{..., paid_promotion_status, paid_promotion_rate, role_info}`
    - `paid_promotion_status` enum: NEW → NEGOTIATING → AWAITING_CONTRACT → ... → PAID → DECLINED
  - Generic: `{email, name, social_media_handles, role_info}`
- **Role extraction** (all types): `{role: creator|talent_manager|agency_staff|internal|unknown, confidence_score, talent_manager_name?, talent_manager_email?, talent_agency?}`

**Phase 4c — Deduplication**: `match_creator_with_existing_rows()`
- **Model**: `gpt-4.1-mini`
- **Langfuse prompt**: `creator-extraction/match-existing`
- **Input**: Extracted creator + batched XML of existing DB records
- **Output**: `{matched_social_media_creator_number: int | None, reasoning: str}`

**Why two-phase identification + extraction?** Avoids running expensive extraction (gpt-5.1) on emails where the creator isn't even present. Identification (cheap) screens first.

---

#### Step 5: Thread Flag Extraction

**Feature**: `features/thread_flag_extraction.py` → `extract_thread_flags()`
**Activity**: `extract_thread_flags` in `ThreadProcessingCoordinatorWorkflow`
**Retry policy**: max_attempts=1 (non-critical — missing flags is not a processing failure)

- **Model**: `gpt-4.1-nano` (cheapest available — runs on EVERY processed thread)
- **Langfuse prompt**: `thread-flags/extract`
- **Output schema**:
  ```
  wants_paid: bool          # Creator requesting payment / only does paid collabs
  wants_paid_reason: str | None
  has_question: bool        # Creator asked an unanswered question
  has_question_reason: str | None
  has_issue: bool           # Creator reported a problem / blocker
  has_issue_reason: str | None
  ```

**User problem solved**: Operators managing hundreds of threads can't read each one. Flag extraction gives at-a-glance signal indicators so operators can prioritize attention.

---

#### Step 6: Opt-In / Opt-Out Classification

**Feature**: `features/opt_in_classification.py` → `classify_opt_in_or_out()`
**Activity**: `check_domain_and_classify` in `ThreadProcessingCoordinatorWorkflow`
**When**: INBOUND threads in READY_FOR_RESPONSE_DRAFT state

- **Model**: `gpt-4.1-mini`
- **Langfuse prompt**: `classification/opt-in-out`
- **Output schema**:
  ```
  is_opt_in: bool           # True = interested/proceeding, False = declining
  asked_questions: bool     # True = has specific questions → force human review
  reasoning: str
  ```

**Routing impact**:
- `is_opt_in=False` → route to opt-out auto-response (thread closed)
- `is_opt_in=True, asked_questions=False` → can auto-send if automation level allows
- `is_opt_in=True, asked_questions=True` → ALWAYS force operator review (AI cannot guess answers)

**User problem solved**: Manually classifying opt-ins vs opt-outs across hundreds of replies per day is tedious. Binary classification enables intelligent routing: opt-outs get instant responses, opt-ins get drafted replies.

---

#### Step 7: Metrics Extraction (Two-Phase LLM)

**Feature**: `features/metrics_extraction.py`
**Workflow**: `ThreadExtractMetricsWorkflow`
**When**: INBOUND + campaign has `extract_metrics_from_thread=True` + `google_sheet_data_instructions` configured

**Phase 7a — Extraction**: `extract_metrics_from_thread()`
- **Model**: `gpt-4.1`
- **Langfuse prompt**: `metrics-extraction`
- **Input**: Custom extraction instructions + Google Sheet column names + thread XML + previous failed attempt context
- **Output trick**: Returns `Metrics{metrics_json_dump: str, reasoning: str}` — metrics embedded as JSON string inside structured output because OpenAI Structured Outputs can't handle dynamic dict schemas. Re-parsed via `StructuredOutputParser.parse_json_string_as_dict()` with control-char sanitization.
- **Final output**: `{metrics: dict[str, Any], reasoning: str}`

**Phase 7b — Review**: `review_metrics_extraction()`
- **Model**: `gpt-4.1`
- **Langfuse prompt**: `metrics-review`
- **Output**: `ReviewMetricsExtractionResult{reasoning_per_field: list[MetricsReasoning{is_accurate, field_name, reasoning}]}`

After validation, metrics are written to Google Sheets via `update_sheet_with_metrics` activity (dedicated `"google-sheets"` Temporal task queue with rate-limiting).

**User problem solved**: Campaign ROI tracking (follower counts, engagement rates, post URLs, niche categories) requires reading every email thread. Manual data entry across thousands of creator conversations is intractable.

---

#### Step 8: Draft Generation Pipeline

**Feature**: Multiple draft features
**Workflow**: `ThreadResponseDraftWorkflow`
**When**: INBOUND threads after opt-in classification

This is the **flagship AI feature** — the most expensive, most observed, and most product-differentiating part of the system.

**Draft Path Selection**:
| Condition | Path | Feature |
|-----------|------|---------|
| Gmail + modern campaign | RAG-enhanced draft | `features/response_drafting_with_rag.py` |
| Gmail + corrections workflow | Correction-injected draft | `features/response_drafting_with_corrections.py` |
| SMTP | Base LLM draft | `features/response_drafting.py` |
| Follow-up needed | Follow-up draft | `features/follow_up_drafting.py` |

**Path A — RAG-Enhanced Draft** (primary path, Gmail):

```
Step 1: ThreadSummarizer.summarize(thread_context)
    Model: claude-haiku-4-5-20251001 | MAX_TOKENS=200
    Prompt: "Summarize this thread in 1-2 sentences: conversation stage, topics, tone"
    → "Creator asked about gifting details and seems interested in collaboration"

Step 2: Build RAG query
    query = f"Context: {summary}\n\nEmail to reply to: {email_body[:4000]}"

Step 3: EmbeddingService.embed_text(query)
    Model: text-embedding-3-small | Dimensions: 1536
    → [0.023, -0.045, ...] (1536-dim vector)

Step 4: EmailReplyExampleRepository.search_similar(...)
    pgvector cosine similarity, campaign-scoped, threshold=0.3, top-5
    → [EmailReplyExample, ...] (prior human replies to similar situations)

Step 5: format_rag_examples_xml(examples)
    → <similar_examples>
         <example>
           <situation>Prior thread summary</situation>
           <action_type>brief acceptance</action_type>
           <their_email>Original inbound text</their_email>
           <human_reply>Sanitized human reply</human_reply>
         </example>
       </similar_examples>

Step 6: generate_draft_with_rag()
    Model: claude-opus-4-5-20251101
    Langfuse prompt: drafting/reply-drafting-v13-rag-{campaign_type}
    Prefix: "=== SIMILAR SITUATIONS WITH HUMAN-WRITTEN REPLIES ===
             If any <their_email> closely matches the email to reply to,
             USE THAT <human_reply> AS YOUR TEMPLATE..."
    Variables: goals, faqs, rules_for_llm, thread_context, rag_examples,
               sample_emails, agent_name, product info
    Output: ResponseDraftResult{subject: str, body_text: str}
```

**Path B — Base LLM Draft** (SMTP, or legacy campaigns):
- **Model**: `gpt-4.1` (modern) or `gpt-5-mini` (legacy)
- **Langfuse prompt**: `drafting/reply-drafting-{campaign_type}`
- Campaign-type variants: `paid-promotion` | `gifting` | `sales` | `general`
- Legacy detection: if `campaign__frequently_asked_questions_for_llm` is None → legacy prompt + gpt-5-mini

**Path C — Correction-Injected Draft** (optional A/B path):
- Same prompts as base draft
- Prepends correction examples as XML to thread_context:
  ```xml
  <correction_examples>
    <instructions>Learn from these examples of AI drafts and how humans corrected them...</instructions>
    <example id="1">
      <ai_draft>Original AI text</ai_draft>
      <human_sent>What was actually sent</human_sent>
    </example>
  </correction_examples>
  ```

**Post-Generation Review** (optional, can be chained):
- `review_intention_alignment()`: Langfuse `review/intention-alignment` → `{needs_revision: bool, reasoning}`
- `review_content_accuracy()`: Langfuse `review/content-accuracy` → `{needs_revision: bool, reasoning}`
- `revise_draft_content()`: Langfuse `email-revision` → model: `o3` → `{revised_subject, revised_body_text}`
  - Uses `o3` (maximum reasoning) for final quality pass — most expensive model in the system

**Path D — Follow-Up Draft** (`ThreadFollowUpDraftWorkflow`):
- **Feature**: `features/follow_up_drafting.py`
- **Model**: `gpt-5-mini`
- **Langfuse prompt**: `follow-up-generation`
- **Key variable**: `follow_up_number` (prompt adjusts urgency: gentle for #1, final notice for #3)

**User problem solved**: Writing personalized, contextually appropriate replies to hundreds of creators per campaign is the core manual bottleneck the platform eliminates.

---

#### Step 8b: RAG Index Ingestion (Post-Send)

**Service**: `services/ai/reply_sanitizer.py` + `services/ai/rag.py`
**Activity**: `ingest_sent_reply_as_example`
**When**: OUTBOUND threads (operator sent or auto-sent a reply)

```
Human-sent reply
        │
        ▼
ReplySanitizer.sanitize(reply_text)
    Model: claude-opus-4-20250514
    Prompt: Remove PII (codes→[CODE], dates→[DATE], names→[NAME], negotiated amounts→[NEGOTIATED_AMOUNT])
    Keep: campaign rates, deliverable specs, deadlines, tone
        │
        ▼
ReplySanitizer.summarize(sanitized_text)
    Model: claude-opus-4-20250514
    Classify as one of 8 action labels:
    "brief acceptance | brief decline | brief counter-offer | brief follow-up question |
     brief confirmation | brief scheduling | brief thanks | brief update"
        │
        ▼
ThreadSummarizer.summarize(thread_context)
    Model: claude-haiku-4-5-20251001
    → 1-2 sentence thread summary (context for semantic search)
        │
        ▼
EmbeddingService.embed_text(f"Context: {summary}\n\nEmail: {inbound_body}")
    Model: text-embedding-3-small
    → 1536-dim vector
        │
        ▼
EmailReplyExampleRepository.insert(
    thread_summary, inbound_email_text,
    sent_reply_text, sanitized_reply_text, reply_summary, embedding
)
```

**Why Claude Opus for sanitization?** Quality of training examples multiplies forward — every future draft generated using this example inherits the sanitization quality. Cheap model errors here degrade RAG quality permanently.

---

#### Step 9: Thread Completion Check

**Feature**: `features/thread_completion_check.py` → `is_thread_done()`
**Activity**: `check_if_thread_is_done`
**When**: OUTBOUND threads (after sending a reply)

- **Model**: `gpt-4.1-mini`
- **Langfuse prompt**: `classification-follow-up`
- **Input**: Thread context XML + campaign goal + campaign rules
- **Output**: `IsThreadDoneResult{is_thread_done: bool, reasoning: str}`
- **Effect**: `is_thread_done=True` → no follow-up scheduled; thread marked complete

**User problem solved**: Prevents sending unnecessary follow-ups after threads are naturally complete (creator declined, campaign goal achieved, relationship ended appropriately).

---

#### Other Backend AI Uses

**Post Tracking Vision Analysis** (`services/post_tracking/analyzer.py`):
- **When**: `PostTrackingWorkflow` processes creator Instagram posts
- **Two-phase strategy**:
  1. Fast path: `product_name.lower() in caption.lower()` — if match, done
  2. LLM fallback: Download image → base64 → Claude claude-sonnet-4 vision:
     - Prompt: "Does this post mention, show, or promote [product]? Reply ONLY: YES - [reason] or NO - [reason]"
- **Model**: `claude-sonnet-4` (vision-capable, cost-balanced for daily batch job)

**Creator Note Generation** (API-triggered, after thread processing):
- **Feature**: `features/creator_note_generation.py`
- **Model**: `gpt-4o-mini`
- **Langfuse prompt**: `creator-notes/generate` (with hardcoded fallback)
- **Smart skip**: `should_update=False` → skip DB write if content unchanged (prevents noise)
- **Output**: `GenerateCreatorNoteResult{note: str (max 500 chars), should_update: bool}`

**Client Summary Generation** (API-triggered, on-demand):
- **Feature**: `features/client_summary_generation.py`
- **Model**: `claude-haiku-4-5-20251001` (fast readable prose)
- **Langfuse prompt**: `client-summary/generate` (with extensive hardcoded fallback)
- **Uses Anthropic client directly** (not structured outputs) — free-form prose generation
- **LLM responsibility**: Categorizes creator statuses with emoji headers:
  - ⚠️ Needing review / ⏳ Getting final touches / ✅ Approved / etc.

**Bulk Draft Edit** (`BulkDraftEditWorkflow`):
- `apply_edit_to_draft` activity — applies a natural language edit instruction to a pending draft
- Fans out N parallel LLM calls via `asyncio.gather(..., return_exceptions=True)`
- Up to 10 per-draft errors tracked; workflow continues on individual failures

---

## System 2: Context Engine (Slack Bot)

### Architecture

The Context Engine is an entirely separate service (not part of the backend Temporal pipeline) that runs Claude as an autonomous agent for internal team members via Slack.

```
Slack @mention
        │
        ▼
handlers.handle_message()
        ├── Convert Slack event → Message
        ├── RequestContext(slack_user_id, cheerful_user_id)
        ├── POST placeholder "⏳ Thinking..."
        ├── Fetch thread history (up to 50 prior messages)
        │
        ▼
services.execute_message()
        ├── Load ThreadToolContext from DB (thread persistence)
        ├── Keyword → platform detection (TOOL_FILTERING_ENABLED=False → unused)
        ├── select_prompt(is_routed=False) → base.txt
        │
        ▼
run_claude_agent(claude-opus-4-6)
        │
        │ [Agent reasoning loop]
        ├── Claude receives: conversation history XML + current message
        ├── Claude calls: discover_tools(platforms=["slack"])
        │       → returns formatted list of tool names + descriptions
        ├── Claude calls: execute_tool("slack_search_messages", {query: "..."})
        │       → returns XML results
        ├── Claude synthesizes → TextBlock response
        │
        ▼
Update placeholder → post final response in Slack thread
```

### Meta-Tool Pattern

Claude has access to exactly **2 tools** at the SDK level:
1. `discover_tools(platforms: list[str]) → str` — returns available tool catalog as text
2. `execute_tool(name: str, params: dict) → str` — dispatches to any of 38 platform tools

**Why**: 38 direct tools would consume too many tokens in every prompt. The meta-tool pattern forces Claude to reason about which tools exist before using them, keeps the API footprint minimal, and allows the tool registry to evolve without changing the agent setup.

**Future**: Anthropic's Tool Search Tool will make this pattern unnecessary (tracked in issue #525).

### Tool Selection per Conversation

```python
KEYWORD_PLATFORM_MAP = {
    "slack": Platform.SLACK,           "channel": Platform.SLACK,
    "transcript": Platform.CLARIFY,    "meeting": Platform.CLARIFY,
    "fly": Platform.FLY,               "deploy": Platform.FLY,
    "session": Platform.ACP,           "agent": Platform.ACP,
    "onyx": Platform.ONYX,             "knowledge": Platform.ONYX,
    "posthog": Platform.POSTHOG,       "analytics": Platform.POSTHOG,
    "cheerful": Platform.CHEERFUL,     "campaign": Platform.CHEERFUL,
    ...
}
```
Currently `TOOL_FILTERING_ENABLED = False` — Claude receives all 38 tools regardless.

### Thread Continuity

Each Slack thread gets a `ThreadToolContext` DB record:
- First message → keyword extract → filter tools → create record
- Subsequent messages → load record → merge tool slugs (additive, never removed) → update record
- Session UUID persists for Langfuse session grouping across multi-turn conversations

### Prompt Strategy

**`base.txt` system prompt** (paraphrased structure):
- Identity: "You are Context, a tool-using assistant"
- Protocol: Use `discover_tools` first, then `execute_tool`; infer platform from context
- Format: Slack mrkdwn not Markdown (`*bold*` not `**bold**`, `<url|text>` not `[text](url)`)
- Tone: Direct, no filler, no emojis unless user uses them first
- GitHub: Use `github_run_gh` tool (connects to user's linked GitHub account)

**`routed_client.txt` system prompt** (for external client-facing channels):
- "Answer client questions about the codebase/project by querying Onyx"
- Restricted scope — only knowledge base queries, no direct system access

### Langfuse Integration

Each Slack conversation = one Langfuse session:
- `session_uuid` persists in `ThreadToolContext` across messages
- All tool calls and LLM generations linked to same session
- Live status indicator ("🖋️ slack_search_messages(query=...)") shown to user while agent executes

---

## Cross-System AI Patterns

### Pattern 1: Sequential Pipeline (Thread Processing)

The backend AI pipeline is a **linear DAG** within `ThreadProcessingCoordinatorWorkflow`. Each step:
- Has its own Temporal activity with isolated retry policy
- Writes results to DB before next step (recovery points)
- Is observable independently via Langfuse
- Non-critical steps wrapped in `try/except` (failure = log warning, not halt)

Critical vs. non-critical classification:
| Activity | Critical? | Retry | Rationale |
|----------|-----------|-------|-----------|
| campaign_association | Yes | 1-3 | Thread can't be processed without campaign |
| extract_thread_flags | No | 1 | Missing flags don't prevent draft generation |
| extract_campaign_creator | No | 3 exp | Creator extraction is best-effort enrichment |
| draft_generation | Yes | 1 | Expensive, non-deterministic — surface failures fast |
| metrics_extraction | Yes | 5 exp | Retried heavily because metrics data is high-value |

### Pattern 2: Fan-Out Parallelism (Bulk Operations)

`BulkDraftEditWorkflow` fans out N parallel LLM calls:
```python
results = await asyncio.gather(*[
    workflow.execute_activity(apply_edit_to_draft, item, ...)
    for item in pending_drafts
], return_exceptions=True)
```
Individual failures tallied (up to 10 logged) but don't fail the workflow.

### Pattern 3: Agentic Loop (Claude Agent SDK)

Used in two places: campaign workflow executor and context engine.

**Campaign workflows** (`ClaudeAgentService`):
- Bounded: Claude executes until all specified workflows are done
- Tool allowlist: only tools for applicable workflows
- Output: `WORKFLOW_OUTPUT_{uuid}` JSON blocks parsed from text

**Context Engine** (`run_claude_agent`):
- Unbounded: Claude executes until it has a complete response
- 2 meta-tools: discover + execute (delegates to 38 actual tools)
- Output: final text response to post in Slack

### Pattern 4: RAG (Retrieve-Augment-Generate)

Full RAG cycle for draft generation:

**Index Phase** (post-send, `ingest_sent_reply_as_example`):
```
Human reply → Sanitize (Opus) → Classify action (Opus) → Summarize thread (Haiku) → Embed → Store pgvector
```

**Query Phase** (pre-draft, `generate_draft_with_rag`):
```
Thread → Summarize (Haiku) → Build query → Embed → pgvector search → Format XML → Inject into draft prompt
```

**Key design**: RAG is style transfer, not just retrieval. The prompt explicitly instructs Claude to use retrieved human replies as templates, copying structure and phrasing exactly.

**Failure mode**: If pgvector unavailable, `generate_draft_with_rag` logs warning and continues without examples (degrades gracefully to base LLM draft).

---

## Model Selection Strategy

| Tier | Model | Use Case | Reasoning |
|------|-------|----------|-----------|
| Ultra-cheap | `gpt-4.1-nano` | Thread flags | Runs on every thread; binary output |
| Cheap | `gpt-4o-mini`, `gpt-5-mini` | Creator notes, follow-ups | Cost-efficient for secondary features |
| Mid-tier | `gpt-4.1-mini` | 5+ classifiers | Binary/enum decisions; reliable, affordable |
| Standard | `gpt-4.1` | Base draft, metrics, OCR | Reliable structured outputs, multimodal |
| Quality prose | `claude-haiku-4-5-20251001` | Thread summarization, client summary | Fast, readable prose generation |
| Premium | `claude-opus-4-5-20251101` | RAG drafting | Flagship feature; highest quality |
| Complex extraction | `gpt-5.1` | Creator extraction | Complex structured schema with accuracy needs |
| Max reasoning | `o3` | Draft revision | Final quality pass (rarest, most expensive call) |
| Training data | `claude-opus-4-20250514` | Reply sanitization | Quality multiplies forward into RAG examples |
| Agent | `claude-opus-4-6` | Context Engine, campaign agents | Full agentic reasoning with tool use |

---

## Prompt Management Architecture

All prompts stored in **Langfuse** with label-based versioning:

```python
# Fetch pattern (every feature):
prompt = langfuse_client.get_prompt(
    name="drafting/reply-drafting-v13-rag",
    label=DeployEnvironment.for_prompt_version()  # "production" | "staging" | "development"
)
model = prompt.config.get("model", default_model)
compiled = prompt.compile(**template_variables)
```

**Namespace conventions**:
```
drafting/reply-drafting-{type}          # Base draft (4 variants)
drafting/reply-drafting-v13-rag-{type}  # RAG draft (4 variants)
review/intention-alignment              # Draft review
review/content-accuracy                 # Draft review
email-revision                          # Draft revision
follow-up-generation                    # Follow-up draft
classification/opt-in-out               # Opt-in classification
classification-follow-up                # Thread done check
classification                          # Campaign association verify
campaign-association                    # Campaign matching
classify_downstream_workflows           # Workflow routing
thread-flags/extract                    # Flag extraction
creator-extraction/identify-creators    # Creator phase 1
creator-extraction/extract-details      # Creator phase 2
creator-extraction/match-existing       # Creator dedup
metrics-extraction                      # Metrics extraction
metrics-review                          # Metrics review
creator-notes/generate                  # Creator notes
client-summary/generate                 # Client summary
execute_user_workflows                  # Claude Agent
```

**Fallback strategy**: Creator notes and client summary have full hardcoded system prompts in case Langfuse is unavailable.

---

## Observability Architecture

### Langfuse Tracing Pattern (Backend)

Every AI feature function decorated with `@langfuse.observe(as_type="span", capture_input=False)`:

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

Session/user attribution:
- `langfuse_session_id` = Gmail thread ID (clusters all AI calls for one thread processing run)
- `langfuse_user_id` = user email (enables per-user usage tracking)

### Langfuse Tracing (Context Engine)

Separate Langfuse traces per Slack conversation:
- `session_uuid` persists in `ThreadToolContext` across multi-turn conversations
- Full agent step trace: each tool call + response logged
- `langfuse_logging.py` handles post-execution trace upload

---

## Key AI Design Decisions

1. **XML thread context throughout**: All AI features receive email threads as XML with explicit tags for sender, timestamp, direction. Claude's training on structured data makes XML more reliable than plain text for parsing conversation boundaries.

2. **Campaign-type specialization**: PAID_PROMOTION / GIFTING / SALES / GENERAL each have distinct prompt variants. Each type has fundamentally different negotiation terminology (gifting = address collection, paid = rate negotiation, sales = purchase intent).

3. **No auto-send for questions**: `opt_in_classification.asked_questions=True` forces human review even for clearly interested creators. The system never guesses at creator questions.

4. **Two-phase expensive operations**: Creator extraction (Phase 1: identify cheaply, Phase 2: extract expensively) and campaign association (Phase 1: match, Phase 2: verify) both use cheap initial calls to screen before expensive extraction.

5. **Graceful RAG degradation**: `generate_draft_with_rag()` catches all RAG exceptions and continues without examples. Draft quality degrades but pipeline never fails.

6. **RAG as style transfer, not just retrieval**: The RAG injection prompt explicitly instructs "copy the structure and phrasing exactly" from retrieved examples. This transfers the brand's established communication style to every future draft.

7. **`should_update` cost optimization**: Creator note generation returns `should_update=False` if content unchanged — prevents unnecessary DB writes and preserves note history cleanliness.

8. **Metrics as JSON-in-string**: OpenAI Structured Outputs can't handle dynamic dict schemas. Metrics are returned as a JSON string inside a fixed schema field, then re-parsed server-side with control-char sanitization.

9. **Meta-tool pattern in Context Engine**: 2 meta-tools instead of 38 direct tools. Forces Claude to reason about tool selection. Keeps agent prompt lightweight. Designed as temporary until Anthropic Tool Search Tool ships.

10. **Temporal activity isolation for AI**: Each AI call is a separate Temporal activity. This means:
    - AI failures surface immediately (not hidden inside a service call)
    - Each has its own retry policy (LLM activities: max 1 retry; critical writes: 3)
    - Failed AI calls can be resumed without re-running the entire workflow

11. **Reply sanitization with Opus**: The most expensive model (`claude-opus-4-20250514`) is used for the least user-visible feature (training data preparation). Quality of RAG examples determines quality of all future drafts — this investment compounds.
