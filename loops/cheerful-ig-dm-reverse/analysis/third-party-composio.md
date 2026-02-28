# Composio Instagram Integration — Assessment

**Aspect:** `third-party-composio`
**Wave:** 1 — External Landscape
**Date:** 2026-02-28

---

## Overview

Composio is an AI-native integration platform that exposes 500+ app integrations as MCP-compatible tools for AI agents. **Cheerful already uses Composio** as an action platform: the backend wraps Composio actions via `composio_adapter.py` and exposes them through MCP server to Claude Agent SDK during campaign workflow execution.

The question: can Composio serve as a relay or enabler for Instagram DM support, leveraging the existing integration?

---

## Composio's Existing Role in Cheerful

**Files:**
- `apps/backend/src/services/composio_adapter.py` — schema conversion + tool wrapper
- `apps/backend/src/core/config/definition.py:74` — `COMPOSIO_API_KEY` (single app-level key)
- `apps/backend/src/mcp/server.py` — MCP server factory that merges Composio + native tools

**How it works today:**
- Single `COMPOSIO_API_KEY` authenticates Cheerful's account with Composio
- Per-user `user_id` (lowercased email) scopes credential isolation at action-execution time
- `composio_to_mcp_schema()` converts Composio's JSON Schema → MCP tool format
- `create_composio_tool_wrapper()` wraps each Composio action as an async MCP handler
- Used for: Google Sheets writes, GoAffPro actions, and other campaign-workflow side effects
- **Pattern: outbound action execution only** — no inbound event handling

---

## Instagram Capabilities in Composio

### Available Actions (36 total)

| Category | Actions |
|----------|---------|
| **Direct Messaging** | Send Text DM (`INSTAGRAM_SEND_TEXT_MESSAGE`), Send Image via DM (`INSTAGRAM_SEND_IMAGE`), List All Conversations (`INSTAGRAM_LIST_DM_CONVERSATIONS`), Get Conversation (`INSTAGRAM_GET_DM_CONVERSATION`), List All Messages (`INSTAGRAM_LIST_DM_MESSAGES`), Mark Seen (`INSTAGRAM_MARK_SEEN`) |
| **Content Publishing** | Create Media Container, Create Carousel Container, Create Post, Schedule Post, Post IG User Media |
| **Media Management** | Get IG User Media, Get Instagram Media, Get IG Media Children, Get IG User Stories, Get IG User Tags |
| **Engagement** | Get/Post IG Media Comments, Get/Post IG Comment Replies, Like Post, Comment on Post, Reply to IG User Mentions, Delete Comment |
| **Analytics** | Get IG Media Insights, Get User Insights, Get Post Insights, Get Content Publishing Limit |
| **Account** | Get User Info, Get Messenger Profile, Update Messenger Profile, Delete Messenger Profile, Get Page Conversations |

### Available Triggers

| Trigger | Count |
|---------|-------|
| **Instagram-specific triggers** | **0** |
| New Post (available) | 1 |
| Post Reach Milestone (available) | 1 |

**Critical finding: No `INSTAGRAM_NEW_DM` or `INSTAGRAM_MESSAGE_RECEIVED` trigger exists.** The two available triggers are for outgoing post analytics — not inbound DM events.

---

## The Core Problem: No Inbound DM Triggers

Composio's trigger system supports inbound events via webhooks or WebSockets for apps like Gmail, Slack, and GitHub. However, **Instagram has 0 DM-related triggers** in the Composio catalog.

This means:
- Composio **cannot push a notification to Cheerful when a creator sends a DM**
- The primary requirement (inbound-first: capturing creator DM replies) **cannot be met by Composio's trigger system**
- Any Composio-based approach must rely on polling Composio's read actions

This is not a Composio limitation per se — it reflects the underlying constraint that Meta's Instagram Messaging API requires app review and webhook subscription directly with Meta. Composio's Instagram actions likely use the same Graph API conversations endpoints that also require `instagram_manage_messages` Advanced Access.

---

## Authentication Model

### How Composio Manages Instagram Auth

1. **Auth Config**: OAuth2 via Meta (Instagram's Facebook-backed OAuth). Supports Business and Creator accounts only — Personal accounts not supported.
2. **Connect Link**: Each Cheerful user would need to connect their Instagram account to Composio via a Composio-hosted OAuth URL.
3. **Managed token refresh**: Composio automatically refreshes OAuth tokens, handles expiry detection.
4. **Custom Auth Config option**: Cheerful could use its own Meta App credentials with Composio as the token manager — enables white-labeled OAuth consent screen.

### Implications for Cheerful's Architecture

Cheerful currently manages per-user credentials for Gmail OAuth entirely within its own database (`user_gmail_account` table). Adding Composio for Instagram OAuth would mean:
- Creator accounts are stored in Composio's credential store, not in Cheerful's DB
- `user_id` in Composio = Cheerful user email (existing pattern)
- Additional onboarding step: user must authorize through Composio Connect Link
- Token state now split: Composio holds Instagram tokens; Cheerful's DB holds Gmail/SMTP credentials
- If Composio API is unavailable, Instagram actions fail (availability dependency)

**Vs. direct Meta OAuth** (Cheerful manages tokens in its own DB): Single source of truth, but Cheerful must implement token refresh logic.

---

## Viable Composio Paths

### Path A: Polling via Composio Read Actions

**Approach:** Use a Temporal cron workflow to periodically call `INSTAGRAM_LIST_DM_CONVERSATIONS` → `INSTAGRAM_LIST_DM_MESSAGES` and detect new messages via a stored watermark cursor.

**Data flow:**
```
Temporal cron (e.g., 5-min)
  → composio_client.tools.execute("INSTAGRAM_LIST_DM_CONVERSATIONS", user_id=...)
  → for each conversation: compare message IDs to watermark stored in ig_dm_watermark table
  → new messages: write to ig_dm_message table, trigger AI draft workflow
```

**What Composio handles:** API authentication, token refresh, conversation listing, message pagination.
**What Cheerful handles:** Watermark persistence, new-message detection, thread mapping, creator resolution, AI drafting.

**Constraints:**
- **Latency:** 5-min polling → avg 2.5-min, worst-case 5-min lag between creator DM and Cheerful notification
- **API rate limits:** Both Composio's tool call limits AND Instagram's Graph API rate limits apply
- **Composio free tier:** 1,000 premium tool calls/hour — a user with 50 active DM conversations × 5-min polling = 600 tool calls/hour per user. Near the free tier ceiling; multiple users will exceed it.
- **Paid tier:** 10,000 premium tool calls/hour (5,000/min tool calls) — ample headroom for production scale
- **Cursor management:** Must store per-user, per-conversation `last_seen_message_id` — a new DB table or column outside Cheerful's existing event-sourced pattern
- **Missed messages:** If polling intervals exceed Meta's API pagination defaults or message volume is high, messages could be missed
- **Meta App Review still required:** Composio's Instagram actions still require the underlying Meta app to have `instagram_manage_messages` Advanced Access — Composio does not bypass this

**Compatibility with Cheerful architecture:**
- Temporal workflows: Compatible (new cron activity, fits existing pattern)
- Event-sourced thread state: Watermark cursor is outside the append-only model; requires careful design to avoid re-processing
- Thread mapping: Must resolve IGSID → creator, new complexity not handled by Composio

---

### Path B: Composio for OAuth + Direct Meta API for Webhooks (Hybrid)

**Approach:** Use Composio's managed authentication to simplify Instagram OAuth onboarding, but receive inbound DMs directly via Meta webhooks (bypassing Composio for the inbound path).

**Data flow:**
```
Creator sends DM
  → Meta webhook → Cheerful webhook endpoint (direct)
  → Thread processing pipeline (like Gmail path)

Cheerful sends reply
  → composio_client.tools.execute("INSTAGRAM_SEND_TEXT_MESSAGE", user_id=...)
```

**What Composio handles:** OAuth connect link, token storage, token refresh, outbound DM sending.
**What Cheerful handles:** Webhook endpoint, inbound message processing, thread/creator mapping, AI drafting.

**Constraints:**
- **Token synchronization problem:** Meta webhooks require the access token to be attached to a webhook subscription for a specific IG user. If Composio holds the token but Cheerful's webhook handler needs to make Graph API calls (e.g., to download media), it must either call Composio to get the token or call Meta directly. This creates a split-credential architecture.
- **Composio doesn't expose raw tokens:** Composio's model abstracts credentials; you call Composio to execute actions, you don't retrieve the raw OAuth token. This means Cheerful cannot use Composio auth for direct Meta API calls.
- **Webhook subscription requires access token:** To subscribe to Meta webhooks for a specific Instagram account, Cheerful needs the access token at subscription-creation time. If Composio holds it, this requires a Composio action to subscribe — complex and brittle.
- **Verdict:** This hybrid approach is architecturally incoherent. Composio's auth abstraction is incompatible with the requirement to use credentials directly with Meta's webhook infrastructure.

---

### Path C: Composio for Outbound Replies Only

**Approach:** Cheerful handles everything (direct Meta API, its own OAuth, webhook ingestion, thread mapping). Composio is used only for sending DM replies via `INSTAGRAM_SEND_TEXT_MESSAGE`.

**What Composio handles:** Sending outbound text/image DMs.
**What Cheerful handles:** Everything else (OAuth, webhooks, storage, threading, AI drafting).

**Assessment:** This is the thinnest possible use of Composio. The outbound DM send is a simple HTTP call to Meta's Messenger Platform API — Cheerful already does equivalent calls for Gmail. The marginal value of routing through Composio for just one action is low, adds a vendor dependency and latency, and doesn't leverage Composio's primary value (managed auth, discovery of 100+ integrations). Not recommended on its own.

---

## Leveraging Existing Composio Integration

**Positive factors:**
- `COMPOSIO_API_KEY` already configured in Cheerful's backend
- `composio_adapter.py` and MCP tool wrapper pattern already exists
- Team is familiar with Composio's action execution model
- Adding Instagram actions = registering new tool slugs, no new infrastructure

**Negative factors:**
- Existing usage is outbound-only (actions, not triggers)
- Instagram's lack of Composio triggers means the core use case still requires a new inbound channel
- Composio's auth model is at odds with Cheerful's self-managed credential DB design
- Per-user Composio onboarding adds friction (creators' Instagram accounts owned by Cheerful users, but connected via Composio)

**Net reuse value: Low-to-medium.** The code patterns are reusable; the integration's capabilities don't address the inbound requirement.

---

## Pricing

| Tier | Tool Calls | Premium Tool Calls |
|------|-----------|-------------------|
| Free | 100/min | 1,000/hour |
| Paid | 5,000/min | 10,000/hour |
| Enterprise | Custom | Custom |

- No per-action or per-message fees visible
- Polling approach at 5-min intervals: ~12 polls/hr per conversation × users × conversations = can exhaust free tier quickly
- Paid tier rate limits are unlikely to be the bottleneck vs. Meta's own API limits

---

## Constraint Summary

| Constraint | Detail |
|-----------|--------|
| Account type | Business or Creator only (same as direct Meta) |
| Inbound triggers | None — must poll |
| Polling latency | Minutes-range, not real-time |
| Meta App Review | Still required for `instagram_manage_messages` — Composio does not bypass it |
| 24-hour window | Still applies (Meta constraint, not Composio's) |
| Auth model | Credentials stored in Composio, not Cheerful's DB |
| IGSID resolution | Not abstracted — Cheerful must still resolve sender identity |
| Media download | Composio actions may not handle ephemeral media URL download timing |
| Availability dependency | Composio outage = Instagram actions unavailable |

---

## Effort Estimate

| Path | Relative Effort |
|------|----------------|
| Path A (polling via Composio) | Medium — new Temporal cron workflow, watermark table, message dedup logic; existing Composio wiring accelerates action setup but inbound polling adds significant new complexity |
| Path B (hybrid OAuth + direct webhooks) | High — architecturally incoherent, token synchronization is hard |
| Path C (outbound only) | Low — but near-zero value vs. direct Meta API |

---

## Risks

| Risk | Likelihood | Impact |
|------|-----------|--------|
| Polling misses DMs under high message volume | Medium | Medium — messages lost or delayed |
| Composio outage breaks Instagram send actions | Low-Medium | Medium — degrades reply capability |
| Meta App Review delays even via Composio | High | High — same approval process as direct Meta |
| Composio Instagram actions depend on same Graph API deprecation risks | Medium | Medium |
| Token split between Composio and Cheerful creates maintenance overhead | Medium | Low-Medium |
| Creator onboarding friction (extra OAuth step via Composio) | Medium | Medium |

---

## Conclusion

**Composio is not viable as the primary integration path for Instagram DM ingestion.** The absence of inbound triggers (0 Instagram DM triggers) means Composio cannot deliver real-time or near-real-time DM notifications. Any Composio-based approach reduces to polling, which introduces latency and complexity that could be avoided with a direct Meta webhook integration.

**Where Composio adds marginal value:**
1. Outbound DM sending — leverages existing adapter pattern, but thin value vs. direct API
2. OAuth management if used with a custom auth config — but the credential-split problem makes this architecturally problematic for webhook-based inbound

**The direct Meta Messaging API path (with native Cheerful OAuth management) is architecturally cleaner and eliminates the polling-vs-realtime trade-off.** The existing Composio integration pattern provides no meaningful shortcut for the inbound DM use case.

---

## Sources

- Composio Instagram Toolkit: https://docs.composio.dev/toolkits/instagram
- Composio Instagram Tools List: https://composio.dev/tools/instagram/all
- Composio Instagram MCP: https://mcp.composio.dev/instagram
- Composio Pricing: https://composio.dev/pricing
- Composio Managed Auth: https://docs.composio.dev/docs/managed-authentication
- Cheerful Composio adapter: `apps/backend/src/services/composio_adapter.py`
- Cheerful config: `apps/backend/src/core/config/definition.py:74-75`
- Cheerful integrations spec: `../cheerful-reverse/analysis/synthesis/spec-integrations.md` (§9 Action Platform: Composio)
