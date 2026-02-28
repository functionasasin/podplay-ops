# Third-Party Survey: Other Instagram DM Integration Options

**Wave**: 1 — External Landscape
**Aspect**: `third-party-others`
**Status**: Complete

---

## Overview

This file surveys platforms not covered by dedicated aspects (`meta-*`, `third-party-manychat`, `third-party-messagebird-bird`, `third-party-composio`). Each platform is assessed for its viability as an **Instagram DM relay** for Cheerful's inbound-first use case: capturing creator DM replies programmatically and mapping them to Cheerful's thread/campaign/creator model.

The core question for each: **can it deliver all inbound DMs to Cheerful via API or webhook, with sufficient message context (sender identity, message body, thread ID), at a reasonable cost?**

Platforms evaluated:
1. **Sendbird** — in-app chat / communications platform with Desk support product
2. **Twilio** — programmable messaging (SMS/WhatsApp/Messenger; no native IG DM)
3. **Zendesk Sunshine Conversations** — omnichannel conversation API (formerly Smooch)
4. **Intercom** — customer messaging platform with Instagram app
5. **Freshdesk / Freshworks** — customer support suite with native IG DM support
6. **Chatwoot** — open-source, self-hosted customer engagement platform
7. **Trengo** — omnichannel inbox with developer API

---

## 1. Sendbird

### What It Is
Sendbird is a developer-facing communications platform (in-app chat SDK + APIs). It also offers **Sendbird Desk**, a customer support product that can connect an Instagram Business account and convert incoming DMs into support tickets.

### Instagram DM Capability
- **Integration type**: Ticket-based (Sendbird Desk), not a raw API relay
- **Connection model**: Connects Instagram Business account via Meta OAuth through Sendbird Dashboard
- **What it captures**: Instagram DMs → Desk tickets; story replies; story mentions; shared posts
- **API access**: Sendbird has a platform API for managing channels, messages, and users — but this is the in-app chat API, not Instagram DMs. There is no documented API endpoint to receive Instagram DM payloads programmatically external to Sendbird Desk
- **Outbound**: Agents reply from Sendbird Desk UI; API-driven reply to Instagram DMs is not clearly exposed for external consumption

### Can It Relay to Cheerful?
**No — not designed as a relay.** Sendbird Desk is a destination, not a middleware. There is no webhook or API mechanism to forward Instagram DMs from Sendbird Desk to an external system (e.g., Cheerful's backend). Sendbird's communications API is for building in-app chat products, not Instagram DM pipelines.

### Pricing
- Developer plan: Free (100 MAU)
- Starter plan: **$399/month** for 5,000 MAU
- Enterprise: Custom

**Conclusion**: Not viable as a relay for Cheerful. Sendbird is a support desk product that happens to support Instagram — Cheerful would need to replicate its own inbox logic inside Sendbird, which defeats the purpose.

---

## 2. Twilio

### What It Is
Twilio is a programmable communications platform (SMS, MMS, WhatsApp, Facebook Messenger, RCS, Voice). It offers the **Conversations API** for multi-party/omnichannel conversation management and a **Custom Channel** concept for non-native channels.

### Instagram DM Capability
- **Native Instagram DM support**: ❌ **Not supported**
- Twilio's supported messaging channels: SMS, MMS, WhatsApp, Facebook Messenger, RCS, Chat (web)
- Instagram DMs are explicitly absent from Twilio's channel list
- **WhatsApp** is supported via Twilio's Messaging API (it holds its own Meta Business Solution Provider status for WhatsApp)
- **Facebook Messenger** is supported — but this is separate from Instagram DMs

### Custom Channel Workaround
Twilio's **Custom Channel** (legacy Autopilot) concept allows routing messages from arbitrary sources into the Conversations API. A hypothetical architecture:
1. Cheerful builds its own Meta webhook endpoint for Instagram DMs
2. For each inbound DM, Cheerful calls `POST /v2/Conversations/{ConversationSid}/Messages` to inject it into Twilio Conversations
3. Twilio Conversations acts as the thread/state store
4. Outbound: Twilio Conversations → Cheerful activity → Meta API send

**Problem**: This is more complex than direct Meta API integration. It adds Twilio as a middleware while still requiring Cheerful to do the Meta OAuth, webhook subscription, and App Review. Twilio's Custom Channel is also not well-documented for Instagram DMs specifically — there is no supported connector.

### Pricing
- Conversations API: $0.05/active user-month + channel costs
- No Instagram-specific pricing (since it's not supported)

**Conclusion**: **Not viable.** Twilio has no native Instagram DM support and no path to it without Cheerful building the Meta integration layer anyway. The Conversations API custom channel approach adds cost and complexity without any corresponding benefit over direct Meta API.

---

## 3. Zendesk Sunshine Conversations (formerly Smooch)

### What It Is
Sunshine Conversations (acquired as Smooch in 2019, now part of Zendesk) is an omnichannel messaging API originally designed as a developer-first conversation platform. It has a REST API for sending/receiving messages across channels, and Instagram Direct is a documented channel type.

### Instagram DM Capability
- **Integration type**: Channels API with Instagram as a supported channel
- **Documented endpoint**: `GET /v2/apps/{appId}/conversations` — list conversations; `GET /v2/apps/{appId}/conversations/{conversationId}/messages` — message history
- **Inbound delivery**: Webhook events when messages arrive
- **Outbound**: `POST /v2/apps/{appId}/conversations/{conversationId}/messages` — send reply
- **Instagram Direct documentation**: Exists at `docs.smooch.io/guide/v1/instagram/` (now migrated to `developer.zendesk.com`)
- **Sender identity**: Exposed in the Sunshine Conversations participant model
- **Authentication**: API key (key ID + secret) or JWT

### Webhook Event Model
Sunshine Conversations delivers events via webhook to a configured URL:
```json
{
  "trigger": "message:appUser",
  "app": { "id": "app_id" },
  "conversation": { "id": "conv_id" },
  "messages": [{
    "type": "text",
    "text": "Hello from creator",
    "role": "appUser",
    "received": 1709000000.0,
    "_id": "msg_id"
  }],
  "appUser": {
    "id": "user_id",
    "externalId": "instagram_user_identifier"
  }
}
```

### Can It Relay to Cheerful?
**Technically yes, but not practically.** Sunshine Conversations does expose an Instagram channel with webhooks and a conversation API. However:

1. **It's a Zendesk product** — full access requires Zendesk Suite pricing or legacy Smooch standalone pricing (not publicly listed post-acquisition; historically $0.10/MAU/month minimum, enterprise-tier now)
2. **Designed for the Zendesk ecosystem** — the API is designed to feed conversations into Zendesk Agent Workspace, not to be used as a standalone relay for external applications
3. **Zendesk Suite pricing**: $55–$115/agent/month (Suite Team to Suite Professional) — making this very expensive for a DM relay
4. **Legacy Smooch standalone API** no longer has clear standalone pricing outside the Zendesk platform
5. **Development friction**: Zendesk is migrating legacy Smooch docs to `developer.zendesk.com`; Python SDK is no longer automatically updated

**Conclusion**: **Not viable as a standalone relay.** Sunshine Conversations technically can do this but is now a Zendesk platform product with enterprise pricing unsuitable for use as a low-cost API relay. If Cheerful's team was already paying for Zendesk Suite, it could be considered — but adopting Zendesk purely for IG DM relay would be disproportionate.

---

## 4. Intercom

### What It Is
Intercom is a customer messaging platform (in-app chat, help desk, support inbox). It offers an **Instagram app** via its App Store that routes Instagram DMs into Intercom's unified inbox.

### Instagram DM Capability
- **Integration type**: Inbox routing (Intercom App Store — free app, requires paid Intercom subscription)
- **Connection model**: Connect Instagram Business account via Facebook Login (Meta OAuth)
- **What it captures**: DMs → Intercom conversations; story replies; story mentions (toggleable)
- **Contact creation**: Each DM sender is auto-created as a lead or user in Intercom
- **Limitation — profile data**: Does not automatically fetch Instagram username; only the name field if set on the user's profile
- **One account per workspace**: An Instagram account can only connect to one Intercom workspace at a time

### Can It Relay to Cheerful?
**No.** Intercom is a destination inbox — there is no outbound webhook API to forward Intercom-received Instagram DMs to an external system. Intercom's API does expose conversations and messages, but polling Intercom's API to pull DMs and relay them to Cheerful would introduce significant latency (not real-time) and rate limits. No real-time event delivery to an external webhook is available.

### Pricing
- Instagram app: Free to install
- Intercom subscription required: starts at approximately **$74/month** (Essential plan) for 2 seats
- AI add-on (Fin): **$0.99 per resolved conversation** — billed separately, can escalate unpredictably
- Agent seats are the primary cost driver

**Conclusion**: **Not viable as a relay.** Intercom is a support destination, not middleware. Like Zendesk, adopting Intercom purely as a DM relay conduit would be disproportionately expensive and architecturally backwards — Cheerful would end up needing to re-implement its thread model inside Intercom.

---

## 5. Freshdesk / Freshworks (Freshdesk Omni)

### What It Is
Freshdesk is a customer support platform (ticketing, helpdesk). **Freshdesk Omni** is Freshworks' upgraded omnichannel offering that natively supports Instagram DM ingestion.

### Instagram DM Capability
- **Integration type**: Ticket-based (same pattern as Zendesk)
- **Connection model**: Connect Instagram Business account via Freshdesk Marketplace app
- **What it captures**: DMs → tickets; story replies and reactions; story mentions
- **API limitations**:
  - Ticket creation from Instagram DMs is restricted via the Public API (creation is internal only)
  - Update and notes on tickets are supported via API
  - Meta-enforced 7-day messaging window for agent replies (not 24-hour; Freshdesk notes this discrepancy from their implementation)
  - Message edits by senders are not reflected
  - Unsend is reflected in tickets (Meta-supported)
- **AI Agents**: Freshdesk Omni can deploy AI agents to manage Instagram DM responses

### Can It Relay to Cheerful?
**No.** Same pattern as Zendesk and Intercom — Freshdesk is a ticketing destination. No mechanism to forward DMs from Freshdesk to an external system in real time. The Public API restriction on ticket creation from Instagram DMs means Cheerful couldn't even inject data back.

### Pricing
- Freshdesk Omni: Not clearly listed standalone; Freshworks bundles pricing; community members report cost similar to Zendesk Suite
- Free tier: Freshdesk has a free plan for basic ticketing, but Instagram DM support requires a paid Omni plan

**Conclusion**: **Not viable as a relay.** Another customer support platform that happens to support Instagram — not designed for programmatic relay use cases.

---

## 6. Chatwoot (Open-Source, Self-Hosted)

### What It Is
Chatwoot is an **open-source, self-hosted** customer engagement platform (Apache 2.0 / EE license). It supports Instagram DMs as a channel type, implementing the Meta webhook and Instagram Graph API integration internally. It can be deployed on any infrastructure (Docker, Kubernetes, Heroku, etc.).

### Instagram DM Capability
- **Integration type**: Self-hosted Meta webhook implementation
- **Connection model**: Meta Business Login or Facebook Login (via app setup in Meta Developer Console)
- **Webhook endpoint**: `{chatwoot_host}/webhooks/instagram` — Chatwoot implements the Instagram webhook receiver
- **What it captures**: DMs, story replies, mentions → Chatwoot conversations
- **API**: Chatwoot has a REST API (`/api/v1/profile`, `/api/v1/accounts/{account_id}/conversations`, etc.) for reading conversations and messages
- **Self-hosted setup**: Requires own Meta App setup, webhook configuration, Instagram Business account — same as direct Meta API integration
- **Known issues (as of v4.1.0, May 2025)**: Webhooks received but conversations not appearing in UI; OAuth exception error in `Webhooks::InstagramEventsJob`; "Instagram" channel option in Add Inbox UI remains disabled — active bug in recent version

### Can It Relay to Cheerful?
**Technically possible, but architecturally inappropriate.** One could:
1. Run a self-hosted Chatwoot instance
2. Configure it to receive Instagram DMs (requires its own Meta App Review)
3. Use Chatwoot's REST API or webhooks (Chatwoot can also send outbound webhooks to external endpoints) to relay conversations to Cheerful

**Problems**:
- Still requires Meta App Review (not a bypass like Bird)
- Introduces an entire additional service to operate and maintain (Ruby on Rails app + Redis + Sidekiq)
- Adds operational complexity without developer experience benefit
- Current version has known Instagram integration bugs (v4.1.0)
- Chatwoot's API doesn't expose raw Instagram Scoped User IDs in a way designed for relay use — it's designed for human agent consumption

### The One Use Case Where Chatwoot Makes Sense
If Cheerful's team already uses Chatwoot for support and wants to handle creator DMs through the same inbox — then IG DM support is free (open-source). But as a DM relay architecture, it's overkill.

### Pricing
- Open-source: **Free** (self-hosted, Apache 2.0)
- Cloud-hosted (chatwoot.com): Starts at **$19/month** (10 agents)
- Operational cost: Infrastructure to run self-hosted (Docker + PostgreSQL + Redis)

**Conclusion**: **Not viable as a relay.** Running Chatwoot solely as a Meta integration shim to relay DMs to Cheerful introduces more operational overhead than direct Meta API integration, with the same App Review requirement. The active v4.1.0 Instagram bug is also a concern.

---

## 7. Trengo

### What It Is
Trengo is a European omnichannel inbox platform with native Instagram DM support. Unlike the pure support desk platforms, Trengo exposes a **developer API** (`developers.trengo.com`) that allows building custom integrations on top of its conversation data.

### Instagram DM Capability
- **Integration type**: Native channel (inbox + API)
- **Connection model**: Connects Instagram Business account; receives DMs via Meta's API
- **Developer API**: `POST /channels/instagram/messages/{messageId}/reply` — reply to a DM; `GET /conversations` — list conversations; webhook delivery to configured endpoints
- **What it captures**: DMs, post comments, story interactions
- **Webhook support**: Trengo can trigger webhook events on new message; Trengo's API allows reading conversations and messages

### Can It Relay to Cheerful?
**Partially — limited relay potential.** Trengo's developer API can read conversations, and it supports webhook triggers. However:
1. Trengo is fundamentally a support inbox — its API is designed for enriching Trengo workflows, not for programmatic relay to external systems
2. No documented direct webhook-per-DM to an external URL (unlike Bird's Channels API which is explicitly designed for this)
3. Trengo targets customer support teams; pricing reflects this

### Pricing
- **Essentials**: ~€113/month for 5 users
- **Boost**: ~€170/month for 5 users
- **Pro**: Custom
- Per-message pricing not available; subscription model

**Conclusion**: **Not viable as a relay.** Higher cost than Bird ($0.005/msg model) without the relay-first design. Trengo is better positioned as a team inbox for managing DMs — not as a programmatic relay for Cheerful's automated thread system.

---

## Summary Capability Matrix

| Platform | Type | Native IG DM | Webhook to External | Sender IGSID | Thread ID | Relay Viable | Cost Model |
|----------|------|-------------|--------------------|----|----|----|-----|
| **Sendbird Desk** | Support desk | ✅ | ❌ | ❌ (internal) | ❌ (ticket) | ❌ | $399+/mo |
| **Twilio** | Programmable messaging | ❌ | N/A | N/A | N/A | ❌ | No IG support |
| **Zendesk / Sunshine Convos** | Support + API platform | ✅ | ⚠️ (legacy API) | ⚠️ (Smooch participant ID) | ✅ | ⚠️ Very expensive | Zendesk Suite $55–115/agent/mo |
| **Intercom** | Customer messaging | ✅ | ❌ | ❌ (Intercom lead ID) | ❌ (conversation) | ❌ | $74+/mo |
| **Freshdesk Omni** | Support desk | ✅ | ❌ | ❌ (ticket) | ❌ (ticket) | ❌ | Not listed; enterprise-tier |
| **Chatwoot** | Open-source inbox | ✅ | ⚠️ (outbound webhooks) | ❌ | ✅ (conversation) | ❌ | Free (self-hosted ops cost) |
| **Trengo** | Omnichannel inbox + API | ✅ | ⚠️ (partial API) | ❌ (internal) | ✅ | ❌ | €113+/mo subscription |

---

## Key Pattern

All platforms in this survey follow the same architectural pattern: they **ingest** Instagram DMs into their own data store (tickets, conversations, inbox items) and are designed for **human agents** to respond via their UI. None are designed as **transparent message relay** infrastructure for an external application.

The only platform in this entire landscape with an explicitly relay-oriented design (webhook forwarding per-message with full sender metadata, developer-first, programmable) is **Bird** (covered separately in `third-party-messagebird-bird`).

**Implication for the options catalog**: For Cheerful, the third-party relay space narrows to:
1. **Bird** — best third-party relay option (see dedicated analysis)
2. **Direct Meta API** — eliminates third-party entirely
3. **ManyChat** — only viable for pre-App-Review prototyping

All other platforms surveyed here are support desk products that would require Cheerful to rebuild its thread/campaign management logic inside a third-party system — architecturally inverted from Cheerful's needs.

---

## Sources

- Sendbird Desk Instagram integration: https://sendbird.com/docs/desk/guide/v1/integrations/instagram
- Sendbird pricing: https://sendbird.com/pricing/chat
- Twilio Messaging Channels (no IG DM): https://www.twilio.com/docs/messaging/channels
- Twilio Conversations API: https://www.twilio.com/docs/conversations/api
- Sunshine Conversations Instagram Direct docs: https://docs.smooch.io/guide/v1/instagram/
- Sunshine Conversations API Reference: https://developer.zendesk.com/api-reference/conversations/
- Zendesk adding/configuring Instagram Direct: https://support.zendesk.com/hc/en-us/articles/4408835013018-Adding-and-configuring-Instagram-Direct
- Zendesk social messaging getting started: https://support.zendesk.com/hc/en-us/articles/4408831648794-Getting-started-with-social-messaging
- Intercom Instagram app: https://www.intercom.com/help/en/articles/6139045-instagram-app
- Intercom community thread (limited profile data): https://community.intercom.com/apps-integrations-25/can-i-add-data-from-instagram-to-the-user-profile-when-someone-is-sending-a-dm-8308
- Freshdesk Omni Instagram connect: https://support.freshdesk.com/support/solutions/articles/50000011280-connect-your-instagram-business-account-with-freshdesk-omni
- Chatwoot Instagram integration: https://www.chatwoot.com/features/instagram-integration/
- Chatwoot developer docs (self-hosted setup): https://developers.chatwoot.com/self-hosted/configuration/features/integrations/instagram-channel-setup
- Chatwoot v4.1.0 Instagram bug: https://github.com/chatwoot/chatwoot/issues/11578
- Trengo API docs: https://developers.trengo.com/docs/welcome
- Trengo Instagram DM API guide: https://trengo.com/blog/instagram-dm-api
- Zendesk overview (eesel): https://www.eesel.ai/blog/zendesk-instagram-integration
- Intercom overview (eesel): https://www.eesel.ai/blog/intercom-instagram
