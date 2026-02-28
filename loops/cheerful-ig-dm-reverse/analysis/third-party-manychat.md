# ManyChat as Instagram DM Relay — Capability Assessment

**Wave**: 1 — External Landscape
**Aspect**: `third-party-manychat`
**Status**: Complete

---

## Overview

ManyChat is a Meta-certified Business Partner that provides a visual chatbot/automation builder for Instagram DMs, Facebook Messenger, WhatsApp, SMS, and Email. It wraps the Meta Messenger Platform API (same API documented in `meta-instagram-messaging-api.md`) in a no-code/low-code interface, adding automation logic, subscriber management, and CRM-style contact tracking on top.

The core question for Cheerful: **Can ManyChat act as a relay — receiving Instagram DMs and forwarding them (including message content) to Cheerful's backend for thread mapping, creator resolution, and AI drafting?**

The answer is: **partially, with significant limitations**. ManyChat can forward the *most recent message text* from an inbound DM to an external webhook, but it cannot expose full conversation history, does not provide a real-time inbound push (without flow configuration), and introduces a vendor dependency layer between Instagram and Cheerful.

---

## How ManyChat Connects to Instagram

ManyChat uses the same underlying Meta API as a direct integration:
- Uses Instagram Messaging API (Messenger Platform) under the hood
- Requires: Instagram Professional account (Business or Creator) linked to a Facebook Page
- Requires the creator to grant ManyChat access via **Settings → Messages and story replies → Message controls → Connected tools → Allow access to messages**
- ManyChat holds the `instagram_manage_messages` permission and handles webhook subscription itself

ManyChat's App Review with Meta is already done — this is a key advantage over building a direct integration where Cheerful would need its own Meta App Review approval.

---

## What ManyChat Can Do (Relevant to Cheerful)

### Inbound DM Detection & Processing

ManyChat detects inbound Instagram DMs via Meta webhooks and can route them through automation flows. Flows can be triggered by:
- Any incoming message (Default Reply)
- Keyword match (e.g., DM contains "hello")
- Story reply
- Post comment reply

### External Request — Forwarding DM Content to Cheerful

The primary relay mechanism is ManyChat's **External Request** action (Pro plan, DevTools feature). When triggered in a flow:

1. ManyChat receives an inbound DM
2. The flow fires an **External Request** (HTTP POST/GET/PUT/DELETE) to a Cheerful-controlled URL
3. The payload can include contact data and `{{last_input_text}}` — the most recent message text

**Payload structure (via Dynamic Block mechanism)**:
```json
{
  "id": "subscriber_id",
  "key": "user:13245647xxxxxxxxx",
  "page_id": "fb_page_id",
  "status": "active",
  "first_name": "Jane",
  "last_name": "Creator",
  "name": "Jane Creator",
  "profile_pic": "https://...",
  "locale": "en_US",
  "language": "English",
  "timezone": "-5",
  "live_chat_url": "https://manychat.com/...",
  "last_input_text": "Hey, thanks for reaching out!",
  "last_interaction": 1704067200,
  "last_seen": 1704067200,
  "subscribed": 1700000000,
  "custom_fields": { ... }
}
```

The `last_input_text` field contains the most recent DM text that triggered the flow. This is **the only message content available** — no history, no thread context.

### API-Side: Sending Replies

ManyChat's API (`api.manychat.com`) allows sending messages to a subscriber via `POST /fb/sending/sendContent`, specifying `"type": "instagram"` in the content block. This allows Cheerful to trigger a reply DM back to the creator after an AI draft is approved.

```
POST https://api.manychat.com/fb/sending/sendContent
Authorization: Bearer {api_key}
{
  "subscriber_id": "...",
  "data": {
    "version": "v2",
    "content": {
      "messages": [
        { "type": "text", "text": "AI-drafted reply here" }
      ]
    }
  }
}
```

---

## Capability Matrix

| Capability | Available | Notes |
|------------|-----------|-------|
| Receive inbound DMs | ✅ | Via ManyChat flow Default Reply or keyword trigger |
| Forward DM text to Cheerful | ✅ | Via External Request with `last_input_text` |
| Forward sender identity (name, profile pic) | ✅ | Full contact data in payload |
| Forward sender's Instagram handle/ID | ⚠️ Partial | ManyChat subscriber ID, not native IGSID; Instagram username may be in profile_pic URL or custom fields |
| Full message history / thread | ❌ | Not available via External Request or public API |
| Webhook push per message (real-time) | ⚠️ Conditional | Only fires if DM matches a configured flow trigger; messages not matching any trigger are NOT forwarded |
| Reply via API (send DM back) | ✅ | Via `sendContent` API endpoint |
| Message type support (images, video) | ⚠️ Partial | `last_input_text` is text-only; non-text media types don't populate this field |
| Thread/conversation ID | ❌ | ManyChat uses subscriber IDs, not native conversation IDs |
| Message deduplication ID | ❌ | No `mid` equivalent exposed |
| Bulk read existing conversations | ❌ | No batch/history endpoint exposed |
| Multi-account support | ✅ | Each ManyChat account connects one IG account |

---

## Critical Limitations for Cheerful's Use Case

### 1. Flow-Gated Forwarding — Not All DMs Captured

**This is the most critical limitation.** ManyChat only forwards DMs to an external system when a DM matches a configured automation flow. If a creator replies to an outreach DM with free-form text that doesn't match any keyword or trigger, ManyChat's **Default Reply** flow must be configured to send it to Cheerful.

Without careful flow configuration, messages can fall through the cracks:
- ManyChat has a flow priority system; if another flow matches first, the Default Reply won't fire
- Story reply DMs are a separate trigger type
- First-time messages vs. reply-in-thread DMs may behave differently

**Mitigation**: Configure a catch-all Default Reply flow that always fires External Request for any unmatched DM. This requires that ManyChat is configured per creator account — each creator must install/authorize ManyChat.

### 2. `last_input_text` Only — No Thread Context

The External Request payload contains only the *most recent* message text. There is no access to:
- Previous messages in the conversation
- The original outreach message Cheerful sent (context for AI drafting)
- Message sequence or thread history

Cheerful would need to reconstruct thread context from its own database (using the creator's subscriber ID as a lookup key) rather than receiving it from ManyChat.

### 3. Known Bug: URLs in `last_input_text` Break Payload

A documented community issue: when an inbound DM contains a URL, ManyChat's External Request throws an "Invalid payload json" error. The `{{last_input_text}}` variable is interpolated into the JSON body without proper escaping. This means creator replies containing links would fail to forward.

**Impact**: Creators often share links (portfolio, collab links, etc.) in DMs — this is a reliability gap.

### 4. Instagram IGSID Not Directly Exposed

ManyChat uses its own internal subscriber ID system. While the Instagram Scoped User ID (IGSID) is what Cheerful would use to uniquely identify a creator's Instagram account, ManyChat may not expose the raw IGSID in the External Request payload. Creator identity resolution in Cheerful would need to use ManyChat's subscriber ID as a proxy key, mapped back to the creator's Instagram username or Cheerful creator record.

### 5. No Read API for Historical Conversations

ManyChat's public API (`api.manychat.com/swagger`) exposes subscriber management, tag management, and message sending — but **no endpoint for reading conversation history**. If Cheerful needs to backfill past DMs when a creator first connects, ManyChat cannot help. This would require a separate direct Graph API call or accepting that pre-integration history is unavailable.

### 6. Sends via ManyChat, Not Cheerful's Sender Identity

When sending reply DMs via ManyChat's `sendContent` API, the message is sent from **ManyChat's platform** on behalf of the Instagram account. This should be transparent to the creator's DM thread, but it means message delivery is routed through ManyChat's infrastructure — adding latency and a third-party dependency on every outbound message.

### 7. 24-Hour Messaging Window Still Applies

ManyChat does not bypass the 24-hour messaging window enforced by Meta. If the creator hasn't messaged within 24 hours, Cheerful cannot send a follow-up DM via the ManyChat API either. This is an Instagram-level constraint, not ManyChat-specific.

### 8. URL Payload Bug (Silent Failures)

A separate known issue: when calling `sendContent` proactively via API to an external trigger (not from within a flow), the API returns `200 OK {"status":"success"}` but the message is never delivered. This silent failure mode makes programmatic reliability difficult to guarantee without test coverage.

---

## Auth & Onboarding Flow for Creators

For Cheerful to use ManyChat as a relay, each creator would need to:

1. Create a ManyChat account (or be added to a shared ManyChat account)
2. Connect their Instagram Professional account to ManyChat
3. Grant "Allow access to messages" in Instagram settings
4. Have ManyChat flows configured to forward DMs to Cheerful

**This is a significant onboarding friction increase.** Instead of Cheerful handling one OAuth flow (as in the direct Meta API approach), creators would need to also sign up for and configure ManyChat — a third-party SaaS product with its own account, pricing, and data practices.

**Alternative model**: Cheerful could operate a single ManyChat account that multiple creator accounts connect to. However, ManyChat's multi-account model (agencies) has its own pricing tier and complexity. More importantly, having all creator DMs flow through a single Cheerful-controlled ManyChat account raises data privacy concerns (all creators' DMs in one ManyChat account).

---

## Pricing Impact

| Plan | Cost | Contacts | API Access |
|------|------|----------|------------|
| Free | $0 | Up to 1,000 total | No API, No External Request |
| Pro | $15–$8,000+/mo | Scales with contacts | ✅ API + External Request |
| Elite | Custom ($800–$2,000+/mo est.) | Enterprise | ✅ + dedicated support |

**Key pricing note**: Pro plan pricing is per number of *contacts* (subscribers in ManyChat). For Cheerful's use case where creators are the accounts and their followers become ManyChat contacts, contact counts could grow quickly.

If Cheerful operates one ManyChat account per creator: each creator's Pro plan is a separate cost (~$15–$145+/mo depending on their follower engagement). Not practical to require creators to pay for ManyChat.

If Cheerful operates one ManyChat account for all creators: a single Pro account with contact counts aggregated across all campaigns. At scale, costs could reach hundreds to thousands per month.

**External Request is a Pro-only feature** — the free plan cannot be used for forwarding DMs to Cheerful.

---

## Architecture Sketch: ManyChat as Relay

```
Creator's Instagram DM
        |
        ↓ (Meta webhook, managed by ManyChat)
   ManyChat Platform
        |
        ↓ (Default Reply flow → External Request)
Cheerful Backend API
(POST /webhooks/manychat-ig-dm)
        |
        ↓
Thread matching → Creator resolution → Temporal workflow trigger
        |
        ↓
AI draft generation → Human review queue → Reply via ManyChat API
        |
        ↓ (POST api.manychat.com/fb/sending/sendContent)
   ManyChat Platform
        |
        ↓ (Instagram Messaging API)
Creator's Instagram DM ← Cheerful reply
```

Data flow per inbound message:
- `subscriber_id`: ManyChat's internal ID → mapped to creator in Cheerful DB
- `last_input_text`: Message body text (text only; URL messages may fail)
- `name`, `profile_pic`: Creator display info
- No `mid`, no thread ID, no message sequence number

---

## ManyChat as Intermediary — Risks

| Risk | Severity | Notes |
|------|----------|-------|
| Flow misconfiguration drops DMs | High | Catch-all Default Reply must be configured precisely |
| URL-in-DM bug causes silent failures | Medium | Known bug; no official fix timeline |
| ManyChat pricing scales with contact growth | Medium | Could become costly at scale |
| Vendor lock-in for DM channel | Medium | Switching away from ManyChat requires full re-integration |
| Creator onboarding friction | High | Each creator must connect to ManyChat |
| ManyChat terms of service changes | Medium | Third-party platform with its own terms |
| No IGSID exposure makes identity harder | Low-Medium | Workaroundable with username matching |
| ManyChat platform outages affect DM delivery | Medium | Adds another availability dependency |
| Data residency / privacy of creator DMs in ManyChat | Medium | All DMs processed through ManyChat's infrastructure |

---

## Comparison: ManyChat vs. Direct Meta API

| Factor | ManyChat Relay | Direct Meta API |
|--------|---------------|-----------------|
| App Review required | ❌ ManyChat already approved | ✅ Cheerful app needs Advanced Access |
| Message content access | ⚠️ `last_input_text` only, text-only | ✅ Full `messaging` webhook payload |
| Thread/conversation ID | ❌ Not exposed | ✅ `mid`, IGSID, thread linkable |
| Real-time inbound | ⚠️ Only if flow triggers | ✅ Every message via webhook |
| Message history | ❌ | ✅ (via `/conversations` Graph API) |
| Onboarding per creator | Heavy (ManyChat + Instagram) | Lighter (Instagram OAuth only) |
| Ongoing cost | $15–$2,000+/mo (ManyChat) | No per-message cost (Meta API free) |
| Implementation effort for Cheerful | Lower (no webhook infra needed) | Higher (webhook handler, auth server, etc.) |
| Reliability | Medium (flow-gated, URL bug) | High (direct Meta webhook) |

---

## Verdict for Options Catalog

ManyChat is viable only for a **narrow scope**: if Cheerful wanted to prototype Instagram DM capture quickly without Meta App Review, ManyChat could serve as a temporary relay for simple text DMs. However, it is **not suitable as a production path** for Cheerful's inbound-first creator DM model because:

1. Flow-gated forwarding means not all DMs are captured reliably
2. No thread context or message history
3. Significant creator onboarding overhead
4. Known reliability bugs (URL payloads)
5. Ongoing vendor cost that scales with usage

The main legitimate use case for ManyChat in Cheerful's architecture is as a **transitional shortcut** to bypass Meta App Review wait time during early testing — with the understanding that it would be replaced by a direct Meta API integration once app approval is obtained.

---

## Sources

- ManyChat Product — Instagram: https://manychat.com/product/instagram
- ManyChat API (Swagger): https://api.manychat.com/swagger
- ManyChat Help — Dev Tools External Request: https://help.manychat.com/hc/en-us/articles/14281285374364-Dev-Tools-External-request
- ManyChat Dynamic Block Docs (GitHub): https://manychat.github.io/dynamic_block_docs/
- ManyChat Community — URL in `last_input_text` Bug: https://community.manychat.com/general-q-a-43/default-reply-not-triggering-when-message-contains-a-url-7675
- ManyChat Pricing: https://manychat.com/pricing
- n8n ManyChat + OpenAI Instagram DM workflow: https://n8n.io/workflows/2718-ai-agent-for-instagram-dminbox-manychat-open-ai-integration/
- Pragnakalp — ManyChat DM Automation guide: https://www.pragnakalp.com/mastering-instagram-automation-with-manychat-dm-amp-story-reply-automation-part-1/
- Featurebase — ManyChat Pricing 2026: https://www.featurebase.app/blog/manychat-pricing
