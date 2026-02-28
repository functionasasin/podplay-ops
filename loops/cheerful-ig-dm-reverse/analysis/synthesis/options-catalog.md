# Instagram DM Integration — Options Catalog

**Aspect**: `synthesis-options-catalog`
**Wave**: 4 — Synthesis
**Date**: 2026-02-28
**Input files**: All Wave 1, Wave 2, and Wave 3 analysis files

---

## Introduction

This document is the definitive reference for adding Instagram DM support to the Cheerful platform. It synthesizes all 14 prior analysis files into a structured comparison of every viable approach at both the API access level and the data architecture level.

**Scope**: Inbound-first DM capture — creator DM replies are received into Cheerful and routed through the existing thread/campaign/creator model. Outbound DMs (Cheerful user replies sent back to creators) are included as an extension; outreach still originates via email.

**What this document is not**: A recommendation. All options are presented neutrally with honest trade-offs. The right choice depends on team priorities (speed vs. cost vs. future-proofing vs. operational simplicity) that vary by context.

---

## Structure of This Catalog

The options space has **two orthogonal dimensions**:

1. **API/Access option** — *How do DMs arrive in Cheerful?* Five distinct approaches (six if counting polling sub-variants separately).
2. **Architecture pattern** — *How are DMs stored and processed once they arrive?* Two distinct patterns with sub-strategies.

Any API option can be combined with any architecture pattern. The combination matrix (§6) shows which combinations make most sense.

---

## Part 1: API/Access Options

### 1.1 Option: Direct Meta API (Webhook-First)

**Source**: `analysis/option-direct-meta-api.md`

#### How It Works

Cheerful registers its own Meta App, completes Instagram Messenger API App Review, and OAuth-connects each user's Instagram Business Account. Meta delivers DM events via HTTPS webhooks in real time. Cheerful hosts a FastAPI webhook endpoint (`POST /webhooks/instagram`) that verifies Meta's HMAC-SHA256 signature and triggers a Temporal `IgDmIngestWorkflow` per event.

```
Creator sends DM
    ↓ (~1–2s)
Meta platform processes + signs webhook payload
    ↓ (~50–200ms)
POST /webhooks/instagram (FastAPI)
    ↓ (immediate 200 response; BackgroundTask)
IgDmIngestWorkflow (Temporal)
    ├─ ig_dm_ingest_activity       → store to ig_dm_message
    ├─ ig_igsid_resolution_activity → IGSID → username → campaign_creator
    └─ IgDmThreadSyncWorkflow
        └─ ThreadProcessingCoordinatorWorkflow → AI draft → inbox
```

#### Authentication

- Cheerful-hosted Meta OAuth callback endpoint
- Page Access Token stored in Cheerful's Supabase (`user_ig_dm_account.page_access_token`, encrypted)
- Token type: permanent Page Access Token (no expiry if correct permissions requested)
- Facebook Login v2 flow: user → Meta OAuth → Cheerful callback → webhook subscription

#### Webhook Infrastructure Required

- HTTPS endpoint publicly accessible (`POST /webhooks/instagram`)
- GET endpoint for Meta's hub.challenge verification
- HMAC-SHA256 signature verification with `X-Hub-Signature-256` header
- Response within 5 seconds (process async via Temporal)
- App-level webhook subscription on the Meta App dashboard (one-time)
- Per-account webhook field subscription on page token (per Cheerful user)

#### Capabilities

| Capability | Supported | Notes |
|---|---|---|
| Inbound text DMs | ✅ | Via `messages` webhook field |
| Inbound image/video DMs | ✅ | URLs expire ~1h; must download immediately |
| Story replies | ✅ | `messaging_referrals` + `messaging_story_mention` |
| Quick reply buttons | ✅ (receive) | Creator-selected responses |
| Postback events | ✅ | Via `messaging_postbacks` field |
| Real-time delivery | ✅ | ~1–3s end-to-end |
| Read receipts | ✅ | `messaging_seen` field |
| Outbound DM reply | ✅ | `POST /{ig-user-id}/messages` |
| Message history (pre-connection) | Via Graph API polling (Variant C) | Not in webhook stream |
| Typing indicators | ✅ (send) | `sender_actions` |
| Voice messages | ❌ | `is_unsupported=true` in webhook; no content |
| Reactions | ✅ | `messaging_reaction` field (2024+) |

#### Constraints and Limitations

- **Meta App Review required**: `instagram_manage_messages` at **Advanced Access** (not just Standard). App Review timeline: 2–10 business days with complete submission; can take weeks if rejected and resubmitted. Testing possible with Developer Mode (app team members only, ≤100 testers) before approval.
- **Instagram Professional Account only**: Creators must have Business or Creator accounts, linked to a Facebook Page. Personal Instagram accounts are blocked at the API level.
- **24-hour messaging window**: Cheerful can only send outbound DMs while the creator has messaged in the last 24 hours. After 24 hours of creator inactivity, outbound messages are rejected by Meta. The "Human Agent" tag can extend this to 7 days per conversation (requires additional permission).
- **Facebook Page dependency**: All current API paths require an Instagram Business Account linked to a Facebook Page. Meta is actively developing the Instagram Login API (`instagram_business_account_type` parameter) to eventually decouple this, but the independent path is not yet production-available (as of Feb 2026).
- **No conversation ID in basic webhook**: The webhook payload does not include an explicit conversation ID. Thread identity is derived as `(ig_dm_account_id, sender_igsid)`. The explicit `t_...` conversation ID requires a separate Graph API call.
- **Rate limits (outbound)**: 200 automated messages/hour per Instagram account (Standard Access). Advanced Access may grant higher limits.

#### Effort Estimate

**Total**: ~6–8 weeks (20–28 engineering days) + Meta App Review calendar time (calendar-blocked; cannot be parallelized for production).

| Component | Effort |
|---|---|
| Meta OAuth setup + `user_ig_dm_account` table | 3–4 days |
| FastAPI webhook endpoint + HMAC verification | 2–3 days |
| DB migrations (6 new tables, 3 modified) | 2–3 days |
| `IgDmIngestWorkflow` + ingest activity | 3–4 days |
| IGSID resolution + `ig_igsid_cache` + GIN index | 3–4 days |
| `IgDmThreadSyncWorkflow` + Candidate extension | 2–3 days |
| `ThreadProcessingCoordinatorWorkflow` IG DM branch | 2–3 days |
| AI drafting adaptations | 2–3 days |
| Inbox UI changes + DmComposer | 4–5 days |
| Initial account sync + recovery polling (Variant C+B) | 3–4 days |
| Testing + end-to-end validation | 3–4 days |

#### Risks

| Risk | Severity | Likelihood |
|---|---|---|
| App Review rejected / prolonged | High (blocks entire option) | Medium |
| Facebook Page dependency removed/required in new way | Medium | Low |
| Token compromise (stored in DB) | High (creator account access) | Low with encryption |
| Webhook delivery failure during Cheerful downtime | Medium (missed DMs) | Medium → mitigated by recovery poll |
| 24-hour window enforced unexpectedly | Medium | Low if tracked |
| Handle → creator match fails for many DMs | Medium | High initially |

---

### 1.2 Option: Graph API Polling (Three Variants)

**Source**: `analysis/option-graph-api-polling.md`

#### Overview

Rather than receiving Meta webhooks, Cheerful periodically queries the Instagram Graph API `/conversations` endpoint to detect new DM activity. Three variants with different use cases:

- **Variant A**: Pure polling as primary ingest (limited scale)
- **Variant B**: Polling as recovery/backfill supplement to webhooks (hybrid)
- **Variant C**: One-time initial account sync (loads history at connection time)

#### Variant A: Pure Polling (Primary Ingest)

**Architecture**: A perpetual `AllIgDmPollWorkflow` mirrors the existing `AllPollHistoryWorkflow` (Gmail) pattern. Per-account poll activity queries `GET /{page-id}/conversations?platform=instagram`, filters by `updated_time > last_poll_timestamp`, and fetches new messages.

**Rate limit ceiling**:

| Accounts | Poll Interval | Viable? |
|---|---|---|
| 1–5 | 5 min | Yes (~2.5 min avg lag) |
| 5–15 | 10 min | Marginal (~5 min avg lag) |
| 15–30 | 15 min | Poor UX (~7.5 min avg lag) |
| 50+ | N/A | Not viable — rate limits exceeded |

**Key constraints**: Same `instagram_manage_messages` Advanced Access and App Review requirements as webhooks. No reduction in auth complexity. Provides no real-time capability.

**Best for**: Prototyping before App Review completes; very small deployments (≤5 accounts).

#### Variant B: Hybrid (Recovery/Backfill)

The most practically important sub-variant. Webhooks handle real-time delivery; a scheduled `IgDmRecoveryWorkflow` polls every 30–60 minutes to backfill messages missed during Cheerful downtime. At 30-minute intervals, even 50+ accounts stay well within rate limits.

**This variant should be treated as a required component of any webhook-based option**, not a standalone choice. Every production deployment of the direct Meta API option should include this recovery loop.

#### Variant C: Initial Account Sync

One-time polling when a user connects their Instagram account. Loads historical conversation context that predates the webhook subscription. Required by all webhook-based approaches; no architectural alternative exists.

**Coverage**: All conversations updated within the last 30 days (inactive "Requests" folder messages older than 30 days are inaccessible).

#### Effort Estimate

| Variant | Effort | Notes |
|---|---|---|
| Variant A only | 15–20 days | No webhook infra needed; saves ~3–5 days vs direct |
| Variant B (add-on to webhooks) | +3–5 days | Recommended mandatory component |
| Variant C (add-on to any webhook option) | +2–3 days | Required for historical context |

---

### 1.3 Option: Composio Relay (Polling-Based)

**Source**: `analysis/option-composio-relay.md`, `analysis/third-party-composio.md`

#### How It Works

Cheerful uses **Composio** (which Cheerful already uses for other workflow automation) as the intermediary for Instagram API access. Composio hosts the Meta OAuth flow and manages access tokens. Cheerful polls Composio's Instagram actions (`INSTAGRAM_LIST_DM_CONVERSATIONS`, `INSTAGRAM_LIST_DM_MESSAGES`) on a schedule via a Temporal perpetual poll workflow.

**Fundamental constraint**: Composio has **zero Instagram DM triggers** (as of Feb 2026). This makes the Composio relay structurally a polling architecture. There is no real-time path available via Composio.

```
IgDmPollWorkflow (perpetual, Temporal)
    └─ IgDmBatchPollWorkflow (per batch of accounts)
        └─ ig_dm_poll_account_activity (per user account)
            ├─ composio.execute("INSTAGRAM_LIST_DM_CONVERSATIONS", entity_id=user_id)
            ├─ composio.execute("INSTAGRAM_LIST_DM_MESSAGES", entity_id=user_id, ...)
            ├─ watermark: ig_dm_watermark.last_message_id (per conversation)
            └─ INSERT ig_dm_message ON CONFLICT DO NOTHING
    └─ IgDmThreadSyncWorkflow → ThreadProcessingCoordinatorWorkflow
```

#### What Composio Handles vs. What Cheerful Handles

| Responsibility | Composio | Cheerful |
|---|---|---|
| Meta OAuth / token storage | ✅ Composio-hosted | — |
| Token refresh lifecycle | ✅ Composio manages | — |
| Instagram API call execution | ✅ Via action slugs | — |
| Outbound send | ✅ `INSTAGRAM_SEND_TEXT_MESSAGE` | — |
| Poll orchestration / scheduling | — | ✅ Temporal workflows |
| Watermark / cursor management | — | ✅ `ig_dm_watermark` table |
| Message deduplication | — | ✅ `ON CONFLICT DO NOTHING` |
| Thread state / creator matching | — | ✅ Existing coordinator |

#### Composio Composio-Specific Constraints

- **No real-time inbound**: Structural limitation — no DM triggers available.
- **Meta App Review still required**: Composio uses `instagram_manage_messages` Advanced Access. Composio does not bypass Meta's approval process.
- **Rate limits by Composio tier**:

  | Scale | Calls/hr needed | Tier required |
  |---|---|---|
  | 1 user, 50 convos, 5-min poll | ~600/hr | Free |
  | 5 users, 50 convos each, 5-min poll | ~3,000/hr | Paid (~$100/mo) |
  | 10 users, 100 convos each, 5-min poll | ~12,000/hr | Paid (near ceiling) |
  | 20 users, 100 convos each | ~24,000/hr | Enterprise |

- **Composio as single point of failure**: All Instagram access routes through Composio. If Composio is unavailable, Instagram channel stops — email channels unaffected.
- **Vendor lock-in**: Polling architecture is hard to upgrade to real-time without switching away from Composio. Webhook-based real-time requires self-managing tokens, incompatible with Composio's token model.
- **Credential isolation**: Composio uses `entity_id` (= Cheerful user email) for per-user credential scoping — matches existing Cheerful Composio adapter pattern.

#### Key Advantage vs. Direct Meta API

- OAuth flow is Composio-hosted (no FastAPI OAuth callback endpoint, no token storage in Cheerful's DB)
- Faster to get first DM flowing (~1 week saved on auth infrastructure)
- Reuses existing `composio_adapter.py`

#### Effort Estimate

**Total**: ~5–7 weeks (28–39 days)

| Component | Effort |
|---|---|
| Composio Connect Link + `user_ig_dm_account` | 2–3 days |
| DB migrations | 2–3 days |
| `IgDmPollWorkflow` + batch poll workflow | 3–4 days |
| `ig_dm_poll_account_activity` | 4–5 days |
| IGSID resolution + creator matching | 3–4 days |
| Thread state activity + Candidate extension | 2–3 days |
| Coordinator IG DM branch | 2–3 days |
| `IgDmSendReplyActivity` (outbound) | 1–2 days |
| AI drafting adaptations | 2–3 days |
| Inbox UI | 4–5 days |
| Testing | 3–4 days |

---

### 1.4 Option: Bird (formerly MessageBird) Relay (Webhook-Based)

**Source**: `analysis/option-third-party-relay.md`, `analysis/third-party-messagebird-bird.md`

#### How It Works

Cheerful registers a **Bird** workspace and connects each creator's Instagram Business account as a Bird channel. Bird has already completed Meta App Review — Cheerful inherits this approval. Bird receives Meta webhooks and delivers normalized events to Cheerful's webhook endpoint in real time.

```
Creator sends DM
    ↓ (Meta webhook → Bird platform, ~50ms)
Bird normalizes to Channels API event format
    ↓ (Bird webhook → Cheerful, ~100ms)
POST /webhooks/bird-ig-dm
    ↓ (immediate 200; BackgroundTask)
IgDmIngestWorkflow (Temporal)
    ├─ resolve sender (IGSID → username → campaign_creator)
    ├─ upsert ig_dm_thread (keyed by bird_conversation_id)
    ├─ INSERT ig_dm_message
    └─ ThreadProcessingCoordinatorWorkflow → AI draft → inbox
```

#### Key Advantage: No Meta App Review Required for Cheerful

Bird holds the Meta `instagram_manage_messages` Advanced Access permission on its own Meta App. Cheerful does not need its own App Review. Creators authorize Bird's Meta App during OAuth — not Cheerful's. This is the most significant differentiator.

#### Auth Flow

- Cheerful backend → Bird: create Instagram channel → Bird returns OAuth URL (pointing to Meta's authorization page, under Bird's Meta App)
- Creator completes standard Meta OAuth → Instagram account connected as a Bird "channel"
- Cheerful stores only `bird_channel_id` — no raw Meta access token in Cheerful's DB
- Bird manages token refresh lifecycle

#### Capabilities

| Capability | Supported | Notes |
|---|---|---|
| Real-time inbound DMs | ✅ | Via Bird webhook delivery |
| Text messages | ✅ | |
| Image/video media | ✅ | Bird delivers; Cheerful downloads |
| 24-hour window | Enforced by Meta (Bird relays error) | Same constraint |
| Outbound reply | ✅ | `POST api.bird.com/workspaces/{wId}/channels/{chId}/messages` |
| Message history | Via Bird Conversations API | |
| Native Meta message IDs | ✅ | `contact.identifierValue` = IGSID; Bird does not obscure |
| Multi-channel future | ✅ | Bird supports WhatsApp, SMS, Email (single integration) |

#### Cost

**$0.005 per message** (sent or received via Bird).

| Scale | Messages/Month | Monthly Cost |
|---|---|---|
| 500 creators × 4 msg avg | 2,000 | $10 |
| 5,000 creators × 4 msg avg | 20,000 | $100 |
| 10,000 creators × 4 msg avg | 40,000 | $200 |
| 50,000 creators × 4 msg avg | 200,000 | $1,000 |

This is the primary ongoing trade-off vs. direct Meta API (which is free). At Cheerful's expected scale (inbound-first, short exchanges), costs remain low and predictable.

#### Constraints

- **Per-message cost**: Ongoing operational cost with no equivalent in direct Meta API option.
- **Bird ID ≠ Meta native IDs**: `bird_conversation_id` is Bird's internal ID. If Cheerful ever migrates away from Bird, conversation IDs must be remapped. The native IGSID (`sender_igsid`) is preserved in `ig_dm_thread`, enabling re-keying on migration.
- **Bird as SPOF**: Bird platform outage degrades Instagram channel. Mitigated by Temporal retry + reconciliation cron (queries Bird Conversations API hourly for gap fill).
- **Data residency**: Creator DM content passes through Bird's infrastructure. Acceptable for most use cases; document in privacy policy.
- **Instagram Professional Account still required**: Bird cannot bypass Meta's Professional Account requirement for creators. Personal accounts cannot be connected.
- **API versioning**: Bird is migrating from legacy Conversations API to Channels API. This option uses the Channels API (forward-compatible).

#### Effort Estimate

**Total**: Medium — faster than direct Meta API primarily because App Review is bypassed.

| Component | Effort |
|---|---|
| Bird workspace setup + webhook config | XS (hours) |
| `ig_dm_account` OAuth UI flow | S (1–2 days) |
| DB migrations (5 new tables, 3 modified) | M (2–3 days) |
| Webhook handler (FastAPI) | S (1–2 days) |
| `IgDmIngestWorkflow` (Temporal) | M (3–4 days) |
| Creator resolution + `ig_identity` cache | M (3–4 days) |
| Candidate + Coordinator extension | S (1–2 days) |
| AI draft adaptation | S (1–2 days) |
| Reply sending via Bird API | S (1 day) |
| Inbox UI changes | M (4–5 days) |
| Settings UI | S (1 day) |
| Reconciliation cron | S (1 day) |
| Testing | M (3–4 days) |
| **Total** | **~22–31 days (~4.5–6 weeks)** |

---

### 1.5 Option: ManyChat Relay

**Source**: `analysis/third-party-manychat.md`

#### Assessment

ManyChat is a marketing automation platform that enables Instagram DM flows. It is **not suitable as a DM relay to Cheerful** for the following structural reasons:

| Problem | Detail |
|---|---|
| Flow-gated forwarding | Only DMs matching configured keyword triggers are forwarded; other messages are silently dropped |
| No raw message access | ManyChat uses its own subscriber IDs; native IGSID not exposed |
| Text-only content | Media messages, story replies, and reactions are inaccessible |
| Creator onboarding friction | Creators must opt in via ManyChat, conflicting with passive capture |
| HTTP webhook format incompatible | Payload is ManyChat's own schema; Thread ID mapping not possible |
| Limited export | No API to pull historical conversations |

**Verdict**: Rejected. ManyChat is a destination platform for chatbots and flows, not a transparent DM relay. The filter-gated, text-only, subscriber-ID-based model is incompatible with Cheerful's passive DM capture requirement.

---

### 1.6 Option: Unofficial / Scraping Approaches

**Source**: `analysis/unofficial-approaches.md`

#### Approaches Evaluated

| Approach | Summary |
|---|---|
| **Apify Instagram DM actors** | Browser automation; scrapes the Instagram web app DM interface |
| **Custom browser automation (Playwright/Selenium)** | Headless browser driving instagram.com/direct |
| **Mobile API emulation** | Reverse-engineered Instagram app API endpoints |
| **Session cookie theft** | Reuse creator's session cookie in automated requests |

#### Capability Assessment

| Capability | Unofficial Approaches |
|---|---|
| Read DMs | ✅ (fragile) |
| Real-time webhooks | ❌ (polling only) |
| Send DMs | ✅ (fragile, rate-limited) |
| No App Review required | ✅ |
| Media access | ✅ (fragile) |
| Works with all account types | ✅ (including personal) |

#### Risk Assessment

| Risk | Detail |
|---|---|
| Terms of Service violation | Meta explicitly prohibits automated access via unofficial means; account ban risk |
| Instagram detection | Instagram actively detects automation patterns; 2FA challenges, CAPTCHAs, bans |
| Breakage on UI changes | Any Instagram web redesign breaks scraping |
| Creator credential exposure | Requires creator login credentials or session cookies |
| Legal exposure | Violates Meta's CFAA-adjacent ToS; potential legal liability |
| Reliability | Apify actors have availability issues; no SLA |

**Verdict**: **Not recommended for production**. The TOS risk alone is disqualifying for a B2B SaaS tool managing client creator relationships. The Apify actor path may be acceptable for one-off data enrichment (Cheerful already uses Apify for profile scraping), but not for ongoing DM ingestion.

**One legitimate use**: Apify's Instagram scraping could support **initial account sync** (fetching historical DM context before App Review completes) in a sandboxed, short-lived capacity with explicit creator consent, though this remains TOS-risky.

---

### 1.7 Other Third-Party Services

**Source**: `analysis/third-party-others.md`

The following platforms were evaluated as potential DM relay candidates:

| Platform | Verdict | Reason Rejected |
|---|---|---|
| **Sendbird** | ❌ Not viable | Destination platform (in-app chat SDK); no transparent relay to external systems |
| **Twilio** | ❌ Not viable | No official Instagram DM channel; does WhatsApp and SMS only |
| **Zendesk Sunshine Conversations** | ❌ Not viable | Ticketing system; DMs ingested into Zendesk data store, not relayable |
| **Intercom** | ❌ Not viable | Support desk destination; no API to relay DMs out |
| **Freshdesk** | ❌ Not viable | Same as Zendesk — support ticketing, not a relay |
| **Chatwoot** | ❌ Not viable | Open-source support desk; ingests into its own store; relay possible but requires self-hosting Chatwoot |
| **Trengo** | ❌ Not viable | Support inbox; same pattern as Zendesk |

**Conclusion**: Bird is the only platform in the third-party landscape designed as a transparent relay (developer-first API, per-message webhook delivery, native IGSID exposed). All other platforms are support desk / ticketing destinations.

---

## Part 2: Architecture Pattern Options

Architecture patterns are **orthogonal to API access options**. Any API option can be implemented with either pattern. The pattern determines how DM data is stored, named, and processed once it arrives in Cheerful.

### 2.1 Parallel Tables Architecture

**Source**: `analysis/option-parallel-tables.md`

#### Premise

Repeat the pattern used when SMTP was added to a Gmail-only codebase: create new `ig_dm_*` tables that mirror existing per-channel tables, extend shared join tables with a third channel column (and a 3-way mutual-exclusivity CHECK constraint), and add a third `elif` branch to `ThreadProcessingCoordinatorWorkflow`.

This is the "natural" approach — it is what happens when Instagram DMs are added without deliberate architectural investment.

#### New Tables Required

| Table | Mirrors | Purpose |
|---|---|---|
| `user_ig_dm_account` | `user_gmail_account` | Per-user IG account credentials/state |
| `ig_dm_message` | `gmail_message` / `smtp_message` | Individual DM messages |
| `ig_dm_thread_state` | `gmail_thread_state` / `smtp_thread_state` | Event-sourced thread state |
| `ig_igsid_cache` | (no parallel) | IGSID → username resolution cache |
| `latest_ig_dm_message_per_thread` | `latest_gmail_message_per_thread` | Trigger-maintained denormalization |

#### Modified Existing Tables

| Table | Change |
|---|---|
| `campaign_thread` | Add `ig_dm_conversation_id` + 3-way mutual exclusivity CHECK constraint |
| `campaign_sender` | Add `ig_dm_account_id` + 3-way CHECK constraint |
| `thread_flag` | Add `ig_dm_conversation_id` + 3-way CHECK constraint |
| `gmail_thread_llm_draft` | Option A: extend with IG DM columns (easy, naming debt grows). Option B: create separate `ig_dm_llm_draft` table (clean isolation) |

#### The Draft Table Dilemma

The `gmail_thread_llm_draft` table was extended for SMTP (despite the Gmail-specific name). For IG DMs:

- **Option A (extend existing)**: Follows precedent. `gmail_thread_llm_draft` now stores drafts for 3 channels. `draft_subject` and `gmail_draft_id` columns become irrelevant for DM rows. Naming debt grows further.
- **Option B (new table)**: `ig_dm_llm_draft` stores DM drafts separately. Cleaner isolation, no spurious columns. Does not fix the existing SMTP naming debt.

#### Coordinator Changes

Single new `elif` branch in `ThreadProcessingCoordinatorWorkflow`:

```python
elif candidate.ig_dm_account_id is not None:
    # IG DM path — skip attachment extraction, check 24h window
    ...
```

| Step | Gmail | SMTP | IG DM |
|---|---|---|---|
| `ensure_complete_thread_ingested` | ✅ | ❌ Skip | ❌ Skip |
| `ThreadAttachmentExtractWorkflow` | ✅ | ❌ Skip | ❌ Skip (media at ingest) |
| 24h window check | ❌ N/A | ❌ N/A | ✅ New |
| Campaign association | ✅ | ✅ | ✅ |
| AI draft generation | ✅ | ✅ | ✅ |
| Send draft | Gmail API | SMTP relay | IG Messaging API |

#### Strengths and Weaknesses

**Strengths**:
- Proven precedent — SMTP was added this way and works
- Near-zero migration risk (purely additive)
- Full FK referential integrity on all tables
- RLS policies are additive
- Channel isolation — IG DM bugs cannot affect email paths
- Zero extra overhead vs "just implement the feature"

**Weaknesses**:
- Naming debt: `GmailThreadStatus` now for 3 channels; `gmail_thread_llm_draft` (if extended) serves 3 channels
- 3-way CHECK constraint verbose; 4-way for WhatsApp would be worse
- No improvement to existing email-path naming confusion
- Future developers inherit the confusion that SMTP already introduced

---

### 2.2 Channel Abstraction Architecture

**Source**: `analysis/option-channel-abstraction.md`

#### Premise

Make the implicit channel abstraction (the `Candidate` object and shared coordinator) explicit and complete — extending it downward into DB schema and upward into frontend types. Each channel implements a defined interface rather than adding more parallel tables and `elif` branches.

This is a **refactoring investment**. The IG DM feature ships alongside or shortly after the abstraction work, but the abstraction benefits all channels.

#### Three Sub-Strategies (Configurable Investment)

**Strategy 1: Big Bang Refactor** (+8–12 days)
- Rename all email-specific tables/types to channel-agnostic names
- Polymorphic `thread` registry table replaces per-channel thread ID columns
- Unified `thread_state` and `thread_llm_draft` tables
- Full Python adapter protocol + frontend discriminated union type
- Result: maximum consistency; significant migration risk

**Strategy 2: Façade Pattern** (+3–5 days) ← *recommended if abstraction is chosen*
- Keep existing tables unchanged; define `ChannelAdapter` Protocol on top
- Wrap existing Gmail/SMTP services in thin adapter classes
- `InstagramDmAdapter` is the first native implementation
- Coordinator uses `ADAPTER_REGISTRY[candidate.channel_type]` instead of `elif` chain
- Frontend: add `channel` discriminator to existing types; add `IgDmThread` type
- Result: clean interface for new code; legacy naming remains until cleaned up later

**Strategy 3: Incremental Rename** (+1–2 days)
- Rename `GmailThreadStatus` → `ThreadStatus`, `GmailMessageDirection` → `MessageDirection`
- Add `channel_type` to `Candidate` (inferred from existing account_id fields)
- Add `channel` field to `GmailThread` frontend type (additive)
- IG DM added as parallel path (same as parallel-tables)
- Result: slightly cleaner naming; no true abstraction achieved

#### Python ChannelAdapter Protocol (Strategy 2)

```python
@runtime_checkable
class ChannelAdapter(Protocol):
    channel_type: str  # 'gmail' | 'smtp' | 'instagram_dm'

    async def ingest_raw_message(self, raw_payload: Any) -> str: ...
    async def create_thread_state(self, channel_thread_id: str, account_id: UUID, user_id: UUID) -> Candidate: ...
    async def load_thread_context(self, channel_thread_id: str, account_id: UUID) -> ThreadView: ...
    async def send_reply(self, channel_thread_id: str, account_id: UUID, body: str, **kwargs: Any) -> None: ...
    def build_thread_xml(self, thread: ThreadView) -> str: ...
```

#### Database Sub-Options (Strategy 1 only)

**Sub-option 1A: Polymorphic `thread` table**
- Single `thread` table with `channel` discriminator + `channel_thread_id` text column
- Unified `thread_state` and `thread_llm_draft` tables
- ✅ Extensible, no CHECK constraint growth
- ❌ Loses FK referential integrity (polymorphic FK not supported in PostgreSQL)
- ❌ Requires data migration + complex RLS

**Sub-option 1B: Union view over parallel tables**
- Keep all per-channel tables; add `CREATE VIEW all_thread_states AS UNION ALL`
- ✅ Zero migration risk; FK integrity preserved; ships with parallel-tables at near-zero cost
- ❌ Not a true abstraction; code still branches on channel type

#### Strengths and Weaknesses

**Strengths**:
- Clean interface: 4th channel (WhatsApp, LinkedIn) adds a new adapter class, not more branching
- Eliminates `GmailThreadStatus`/`GmailThread` naming confusion
- Type-safe channel discrimination in frontend (TypeScript discriminated union)
- Reduces cognitive load for future developers

**Weaknesses**:
- Upfront investment before shipping the feature
- Risk of premature generalization (if no 4th channel is planned)
- Strategy 1 has migration risk and FK integrity trade-offs
- Temporal adapter injection pattern requires careful design

---

## Part 3: Constraint Summary

These constraints apply regardless of API or architecture choice.

### 3.1 Meta App Review

**Affects**: Direct Meta API option, Composio relay, Graph API polling — all official API approaches.

| Item | Detail |
|---|---|
| Permission required | `instagram_manage_messages` at Advanced Access (not Standard) |
| Who submits | Direct Meta API: Cheerful. Composio relay: Composio (already approved? — unclear). Bird relay: Bird (already approved). |
| Typical timeline | 2–10 business days for first review if complete; can take weeks if rejected |
| Developer Mode | Available for testing (limited to app team members + up to 100 testers); DMs from outside testers do not work |
| Rejection risk | High if submission incomplete; Meta's criteria for `instagram_manage_messages` include business justification and a privacy policy |
| Bird bypasses this | Bird holds Advanced Access; Cheerful inherits approval via Bird's platform |
| Composio bypasses this | **No** — Composio uses its own Meta App; Cheerful must configure Composio with Cheerful's own Meta App credentials or share Composio's approval |

### 3.2 Instagram Professional Account Requirement

**Affects**: All options (including unofficial approaches, which technically work with personal accounts but at TOS risk).

- Creators must have **Business or Creator** account type (not Personal)
- Account must be linked to a **Facebook Page** (current requirement; Instagram Login API may change this)
- Creators without Professional accounts cannot use this feature — this is an onboarding gate
- Cheerful can check professional account type during Apify-based creator research (existing enrichment)

### 3.3 24-Hour Messaging Window

**Affects**: All options that support outbound replies.

- After a creator DMs, Cheerful has **24 hours** to reply via DM
- After 24 hours of creator inactivity, outbound DM sends are rejected by Meta with `Error 10` or equivalent
- The "Human Agent" tag extends the window to **7 days** (available via `pages_messaging_tag` permission for registered businesses; requires additional approval)
- No template message bypass exists for Instagram DMs (unlike WhatsApp Business API)
- Cheerful must:
  - Track `window_expires_at` in thread state (`latest_message_at + 24h`)
  - Check window before generating AI draft
  - Surface window status in inbox UI ("DM window closes in 3h")
  - Gracefully handle expired window: "Respond via email" fallback

### 3.4 Rate Limits

| Context | Limit | Notes |
|---|---|---|
| Outbound DM sends (Messaging API) | 200/hour per IG account (Standard Access) | Advanced Access: higher limits available |
| Graph API `/conversations` | ~200 calls/hour per (app_id, user_id) pair | Shared across all IG accounts for same Cheerful user |
| IGSID resolution (`GET /{igsid}`) | Same Graph API limits | Cached by `ig_igsid_cache` |
| Meta webhook delivery | No rate limit (push) | But delivery not guaranteed — recovery poll needed |
| Bird API (write) | 50 RPS (Standard), 500 RPS (Enterprise) | Not a bottleneck at Cheerful's scale |
| Composio (free tier) | 1,000 premium calls/hour | Paid: 10,000/hour |

### 3.5 IGSID Resolution

Every inbound DM carries the sender's **Instagram Scoped User ID (IGSID)** — an opaque numeric string like `17841400000123456`. Mapping this to a creator's `campaign_creator` record requires:

1. **IGSID → username** resolution via `GET /{igsid}?fields=name,username` (Graph API call, rate-limited)
2. **username → `campaign_creator`** lookup via GIN index on `campaign_creator.social_media_handles` (JSONB containment query)
3. Caching the resolution in `ig_igsid_cache` to avoid repeat API calls

**Initial match rate challenge**: Cheerful's creator records may not have Instagram handles populated for all creators (if outreach happened via email only). Pre-seeding handles during email outreach flow or via Apify enrichment would improve match rates. Unmatched DMs surface as "Unknown Creator DM" in the inbox for manual attribution.

### 3.6 Media Content

Instagram DMs support images, videos, audio, voice messages, GIFs, reactions, and story replies. Key constraints:

- **Text messages**: Full access via all official API options
- **Images/videos**: URL expires within ~1 hour of webhook delivery; Cheerful must download to Supabase Storage immediately upon ingestion
- **Voice messages**: Delivered as `is_unsupported=true` webhook with no audio content accessible
- **Reels shares**: Inaccessible (`is_unsupported=true`)
- **Story replies**: Accessible via `messaging_referrals` webhook field; story may have expired by the time Cheerful processes it
- **Reactions**: Available via `messaging_reaction` webhook field (2024+ API versions)

---

## Part 4: Combination Matrix

Both API and architecture choices are independent. Any combination is technically viable.

### 4.1 API Option × Architecture Pattern

| API Option | Parallel Tables | Channel Abstraction (Façade) | Channel Abstraction (Incremental) |
|---|---|---|---|
| **Direct Meta API** | ✅ Natural fit — the `option-direct-meta-api` analysis already uses parallel tables implicitly | ✅ `InstagramDmAdapter` wraps Meta Messaging API | ✅ Add `channel_type` field + Meta-specific webhook path |
| **Graph API Polling (A)** | ✅ Polling loop stores to `ig_dm_*` tables; no structural difference | ✅ Polling activity calls `adapter.ingest_raw_message()` | ✅ Same as above |
| **Graph API Polling (B/C)** | ✅ Recovery/sync loop is a component, not the primary pattern | ✅ | ✅ |
| **Composio Relay** | ✅ Watermark cursor in `ig_dm_watermark` supplements parallel tables | ✅ `InstagramDmAdapter` delegates to `composio_adapter.py` | ✅ |
| **Bird Relay** | ✅ `bird_conversation_id` maps to `ig_conversation_id` in tables | ✅ `InstagramDmAdapter` translates Bird webhook payloads | ✅ |

### 4.2 Recommended Combinations by Priority

| Priority | API Option | Architecture Pattern | Rationale |
|---|---|---|---|
| **Speed to ship** | Bird Relay | Parallel Tables + Strategy 3 (Incremental) | Bird bypasses App Review; parallel tables is zero extra overhead |
| **Production-grade, lowest ongoing cost** | Direct Meta API + Variant B recovery | Parallel Tables | Webhooks + recovery = durable; no Bird cost; parallel tables follows SMTP precedent |
| **Future-proof (multi-channel roadmap)** | Direct Meta API | Channel Abstraction (Façade) | Clean interface for WhatsApp/LinkedIn/SMS channels later |
| **MVP before App Review** | Composio Relay → migrate to Direct Meta API | Parallel Tables | Fastest to a working prototype; migrate ingest path after App Review |
| **Prototype / internal test** | Graph API Polling (A) | Parallel Tables | Simplest architecture; mirrors email polling; upgrade to webhooks after App Review |

---

## Part 5: Effort Estimate Matrix

### 5.1 By API Option

| API Option | Engineering Days | Calendar Time |
|---|---|---|
| Direct Meta API (webhook) | 20–28 days | 4–6 weeks + App Review wait |
| Graph API Polling (Variant A, pure polling) | 15–20 days | 3–4 weeks + App Review wait |
| Composio Relay | 28–39 days | 5.5–8 weeks + App Review wait |
| Bird Relay | 22–31 days | 4.5–6 weeks, **no App Review wait** |

### 5.2 Architecture Pattern Overhead (added on top of API option)

| Architecture Pattern | Additional Days |
|---|---|
| Parallel Tables | +0 (no overhead — the "natural" path) |
| Channel Abstraction: Strategy 3 (Incremental) | +1–2 days |
| Channel Abstraction: Strategy 2 (Façade) | +3–5 days |
| Channel Abstraction: Strategy 1 (Big Bang) | +8–12 days |

### 5.3 Combined Estimates for Most Likely Combinations

| Combination | Total Engineering Days | Notes |
|---|---|---|
| Bird + Parallel Tables | 22–31 days | Fastest path to production |
| Direct Meta API + Parallel Tables | 20–28 days | No per-message cost; blocked by App Review |
| Direct Meta API + Façade Abstraction | 23–33 days | Future-proof; blocked by App Review |
| Composio Relay + Parallel Tables | 28–39 days | Simplest auth; polling latency trade-off |
| Graph API Polling + Parallel Tables | 15–20 days | MVP prototype; limited scale |

---

## Part 6: Risk Register

### 6.1 API-Level Risks

| Risk | Severity | Likelihood | Affected Options | Mitigation |
|---|---|---|---|---|
| Meta App Review rejected or prolonged | High (blocks entire option) | Medium | Direct Meta API, Composio Relay, Graph API Polling | Submit complete application with business justification + privacy policy; have Bird relay as fallback while waiting |
| Facebook Page dependency change | Medium (auth break) | Low | All official API options | Monitor Meta developer announcements; Instagram Login API is the coming alternative |
| Creator personal account (cannot connect) | Medium (adoption blocker) | Medium | All options | Clear onboarding messaging; filter creators by account type during enrichment |
| Composio outage blocks all Instagram DMs | Medium (channel down) | Low-Medium | Composio Relay | Health checks; alert on consecutive failures; email channels unaffected |
| Bird platform outage | Medium (channel down) | Low | Bird Relay | Temporal retry + hourly reconciliation cron |
| Bird pricing changes | Low | Low | Bird Relay | Contract terms; minimal cost at Cheerful's scale |
| Rate limit exhaustion (polling) | High (ingest stops) | Medium at scale | Graph API Polling, Composio Relay | Move to webhook-first architecture; short-term: reduce poll frequency |
| Meta webhook delivery gaps (downtime) | Medium (missed DMs) | Medium | Direct Meta API, Bird Relay | Mandatory recovery polling (Variant B) |
| Media URL expiry before download | Medium (lost attachments) | Medium (slow poll) | Graph API Polling | Download immediately on ingestion |

### 6.2 Architecture-Level Risks

| Risk | Severity | Likelihood | Affected Patterns | Mitigation |
|---|---|---|---|---|
| `campaign_thread` 3-way CHECK constraint bug | High (data integrity) | Low | Parallel Tables | Migration test; verify all 3 channel combinations |
| `gmail_thread_llm_draft` Option A creates inconsistent rows | Medium | Medium | Parallel Tables (Option A) | Add partial index or CHECK on draft table; consider Option B |
| Naming confusion causes bugs | Medium | Low | Parallel Tables | Code review; rename enums (`GmailThreadStatus` → `ThreadStatus`) |
| Abstraction scope creep | High (delays) | Medium | Channel Abstraction | Timebox; define abstraction boundary before starting |
| Premature generalization (no 4th channel ever planned) | Medium (wasted effort) | Medium | Channel Abstraction (Strategy 1) | Choose Strategy 2 (Façade) or 3 (Incremental) instead |
| Polymorphic FK loses referential integrity | Medium | Definite (if Strategy 1) | Channel Abstraction (1A) | Enforce in application layer; periodic integrity check |
| Migration regression (Strategy 1) | High | Medium | Channel Abstraction (Strategy 1) | Feature flags; parallel-run; comprehensive integration tests |

### 6.3 Creator Identity Resolution Risks

These risks are shared across all options — the IGSID → creator matching problem is the same regardless of API or architecture choice.

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| Low initial handle match rate | Medium | High (initially) | Pre-seed handles during email outreach; manual assignment UI |
| IGSID resolution rate limit exhaustion | High | Medium (high DM volume) | `ig_igsid_cache` reduces API calls to first-time-seen only |
| Handle stored in wrong format in `campaign_creator.social_media_handles` | Medium | Medium | Normalize handles (lowercase, strip @) at write time; GIN index query must match format |
| Multiple creators with same handle (DM from wrong campaign) | Low | Low | Campaign scope filtering in match query (`WHERE campaign_id IN (...)`) |
| Creator changes Instagram handle after matching | Low | Low | Re-resolve on cache expiry; `ig_igsid` FK on `campaign_creator` allows forward lookup |

---

## Part 7: Existing Architecture Compatibility

### 7.1 Temporal Workflow Compatibility

| Concern | Direct Meta API | Graph API Polling | Composio Relay | Bird Relay |
|---|---|---|---|---|
| Ingest trigger | Webhook → `start_workflow` | Perpetual poll loop | Perpetual poll loop | Webhook → `start_workflow` |
| Existing workflow pattern | New (event-driven); recovery loop mirrors Gmail | Mirrors `AllPollHistoryWorkflow` exactly | Mirrors SMTP poll pattern | Same as Direct Meta API |
| `continue_as_new` needed | No (short-lived workflows per DM) | Yes (perpetual loop) | Yes (perpetual loop) | No |
| Activity deduplication | Workflow ID = `ig-dm-ingest-{mid}` | `ON CONFLICT DO NOTHING` + timestamp checkpoint | `ON CONFLICT DO NOTHING` + watermark | Workflow ID = `ig-dm-ingest-{bird_message_id}` |
| Coordinator changes | New branch in `ThreadProcessingCoordinatorWorkflow` | Same | Same | Same |

### 7.2 Event-Sourced Thread State Compatibility

All options preserve the append-only thread state invariant:
- `ig_dm_thread_state` follows identical pattern to `gmail_thread_state` / `smtp_thread_state`
- Unique constraint on `(ig_dm_account_id, ig_conversation_id, latest_message_at)` prevents duplicates
- `NOT_LATEST` status marks superseded rows
- Existing `GmailThreadStatus` enum values are semantically valid for DMs (no new statuses needed; `READY_FOR_ATTACHMENT_EXTRACTION` is simply never set for DMs)

### 7.3 AI Drafting Compatibility

All options require these AI drafting adaptations:

| Current (email) | Required for DMs |
|---|---|
| `<subject>` in XML context | Omit (DMs have no subject) |
| Long-form email formatting | Short-form, conversational tone |
| HTML body | Plain text only |
| `draft_subject` field in LLM draft | NULL or omitted |
| Thread XML includes CC/BCC | Omit for DMs |
| Prompt: "Write a professional email reply" | Prompt: "Write a concise Instagram DM reply" |
| No window constraint | Include `window_expires_at` context |

### 7.4 Inbox UI Compatibility

Current email inbox components require these additions for DM support:

| Change | Effort | Priority |
|---|---|---|
| Thread type indicator (email icon vs DM icon) | S | P0 |
| Thread list UNION across channels | M | P0 |
| No subject line for DM threads | S | P0 |
| `DmComposer` component (plain text, no HTML, 1000 char limit) | M | P0 |
| 24-hour window indicator in DM thread | S | P0 |
| Instagram handle as sender instead of email address | S | P0 |
| Media message display (images/video) | M | P1 |
| Story reply context display | S | P1 |
| Creator IG profile picture | S | P2 |

---

## Part 8: Decision Framework

This catalog does not recommend a specific option. The following questions help map priorities to options:

### 8.1 Speed vs. Cost

**"We need Instagram DM support in the product in 4–6 weeks regardless of ongoing cost"**
→ **Bird Relay + Parallel Tables**. No App Review wait; predictable $0.005/message cost; proven relay architecture.

**"We want zero ongoing per-message cost; we'll wait for App Review"**
→ **Direct Meta API + Parallel Tables**. Free at any scale; direct dependency on Meta only; App Review required.

### 8.2 Architecture Investment

**"We plan to add WhatsApp or LinkedIn as additional channels within 12 months"**
→ **Channel Abstraction (Strategy 2: Façade)** combined with any API option. The 4th channel becomes a new adapter class, not more branching.

**"We ship first, refactor later if needed"**
→ **Parallel Tables**. Zero overhead; follows SMTP precedent. Naming debt is the cost.

### 8.3 Operational Complexity

**"We want minimal new infrastructure to maintain"**
→ **Composio Relay** (no Meta OAuth endpoint, no token management) or **Bird Relay** (no Meta approval, minimal config). Both add a vendor dependency.

**"We want minimal vendor dependencies"**
→ **Direct Meta API**. Only Meta as a dependency; no intermediary service cost or failure mode.

### 8.4 Prototype vs. Production Timeline

**"We need something working before App Review completes (for demos, testing)"**
→ **Graph API Polling (Variant A)** as interim; migrate to webhooks after App Review. Or use **Bird Relay** which doesn't require Cheerful's App Review at all.

### 8.5 Creator Reach

**"Our creators are micro-influencers, may not all have Business accounts"**
→ No clean solution within official API options. Consider: outreach to prompt creators to upgrade to Professional accounts. Unofficial approaches (Apify) work but carry TOS risk.

---

## Appendix A: API Capability Matrix

| Capability | Direct Meta API | Graph API Polling | Composio Relay | Bird Relay | Unofficial (Apify) |
|---|---|---|---|---|---|
| Real-time inbound | ✅ Webhooks | ❌ Minutes latency | ❌ Minutes latency | ✅ Webhooks (via Bird) | ❌ |
| Outbound reply | ✅ | ✅ | ✅ (Composio action) | ✅ (Bird API) | ✅ (fragile) |
| App Review required (Cheerful) | ✅ Required | ✅ Required | ✅ Required | ❌ Bird holds approval | ❌ |
| Text messages | ✅ | ✅ | ✅ | ✅ | ✅ |
| Image messages | ✅ | ✅ | Unclear | ✅ | ✅ |
| Voice messages | ❌ (`is_unsupported`) | ❌ | ❌ | ❌ | ❌ |
| Story replies | ✅ | ✅ (via /messages) | Unclear | ✅ | ✅ |
| Message history (pre-connection) | ✅ (Graph API call) | ✅ | ✅ | ✅ (Bird Conversations API) | ✅ |
| Personal accounts supported | ❌ | ❌ | ❌ | ❌ | ✅ (TOS risk) |
| Per-message cost | Free | Free | Composio tier cost | $0.005/message | Apify compute cost |
| Token managed by Cheerful | ✅ | ✅ | ❌ Composio | ❌ Bird | N/A |
| Vendor SPOF | Meta only | Meta only | Composio + Meta | Bird + Meta | Apify |
| TOS compliant | ✅ | ✅ | ✅ | ✅ | ❌ |
| Production-viable at 50+ accounts | ✅ | ❌ Rate limits | ❌ Rate limits / cost | ✅ | ❌ Reliability |

---

## Appendix B: Data Model Summary (Shared Across Options)

Regardless of API or architecture choice, these new data structures are required in some form:

```
New tables (all options):
  user_ig_dm_account      — per-user IG account credentials/state
  ig_dm_message           — individual DM messages
  ig_dm_thread_state      — event-sourced thread state (append-only)
  ig_igsid_cache          — IGSID → username resolution cache
  latest_ig_dm_message_*  — trigger-maintained denormalization

Modified tables (all options):
  campaign_thread         — add IG DM thread reference + 3-way CHECK
  campaign_sender         — add ig_dm_account_id + 3-way CHECK
  thread_flag             — add IG DM reference + 3-way CHECK
  campaign_creator        — add ig_igsid column + GIN index on social_media_handles

New backend code (all options):
  InstagramDmService      — API client for chosen access method
  IgDmIngestActivity      — store incoming DM to DB
  IgIgsidResolutionActivity — resolve IGSID → creator
  IgDmThreadStateActivity — create thread state, return Candidate
  IgDmSendReplyActivity   — send outbound DM reply
  Candidate extension     — add ig_dm_account_id, ig_conversation_id fields
  ThreadProcessingCoordinatorWorkflow — new IG DM branch

New frontend code (all options):
  DmComposer              — plain-text reply composer with window indicator
  Thread type indicator   — email icon vs DM icon
  Settings: Instagram connect UI

IG DM-specific new concept (all options):
  24h window tracking     — window_expires_at in thread state
  Media download on ingest — before ephemeral URLs expire
```

---

## Appendix C: Key File References

| Topic | Reference File |
|---|---|
| Meta Instagram Messaging API | `analysis/meta-instagram-messaging-api.md` |
| Meta Graph API conversations | `analysis/meta-graph-api-conversations.md` |
| Meta webhooks | `analysis/meta-webhooks-realtime.md` |
| ManyChat assessment | `analysis/third-party-manychat.md` |
| Bird assessment | `analysis/third-party-messagebird-bird.md` |
| Composio assessment | `analysis/third-party-composio.md` |
| Other third-party survey | `analysis/third-party-others.md` |
| Unofficial approaches | `analysis/unofficial-approaches.md` |
| Cheerful thread model | `analysis/current-thread-model.md` |
| Cheerful email pipeline | `analysis/current-email-pipeline.md` |
| Creator identity resolution | `analysis/current-creator-identity.md` |
| Inbox UI analysis | `analysis/current-inbox-ui.md` |
| AI drafting analysis | `analysis/current-ai-drafting.md` |
| Direct Meta API design | `analysis/option-direct-meta-api.md` |
| Graph API polling design | `analysis/option-graph-api-polling.md` |
| Composio relay design | `analysis/option-composio-relay.md` |
| Bird relay design | `analysis/option-third-party-relay.md` |
| Channel abstraction design | `analysis/option-channel-abstraction.md` |
| Parallel tables design | `analysis/option-parallel-tables.md` |
