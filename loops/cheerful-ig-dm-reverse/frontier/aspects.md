# Frontier — Cheerful Instagram DM Integration

## Statistics

| Metric | Value |
|--------|-------|
| Total aspects | 20 |
| Analyzed | 14 |
| Pending | 6 |
| Convergence | 70% |

---

## Wave 1: External Landscape — Instagram DM Access Methods

- [x] `meta-instagram-messaging-api` — Instagram Messaging API (Messenger Platform): webhook events, 24-hour window, permissions, app review
- [x] `meta-graph-api-conversations` — Graph API conversation endpoints: capabilities vs Messaging API, deprecation status
- [x] `meta-webhooks-realtime` — Meta webhook infrastructure: event types, delivery guarantees, verification, payloads
- [x] `third-party-manychat` — ManyChat as DM relay: API, webhooks, pricing, limitations
- [x] `third-party-messagebird-bird` — Bird (MessageBird) Instagram channel: API, webhooks, pricing
- [x] `third-party-composio` — Composio Instagram integration: leverage existing Cheerful integration
- [x] `third-party-others` — Survey: Sendbird, Twilio, Zendesk, Intercom Instagram integrations
- [x] `unofficial-approaches` — Apify actors, browser automation: capabilities, TOS risks, reliability

## Wave 2: Internal Landscape — Cheerful's Current Architecture

- [x] `current-thread-model` — Thread identity, state machine, campaign/creator linking: what's email-specific vs channel-agnostic
- [x] `current-email-pipeline` — Inbound email pipeline end-to-end: abstraction boundaries
- [x] `current-creator-identity` — Creator identification, Instagram handle storage, DM sender → creator matching
- [x] `current-inbox-ui` — Mail inbox UI: what's hardcoded to email vs abstract, changes for DM threads
- [x] `current-ai-drafting` — AI draft generation: adaptation for DMs (shorter, no subject, media, tone)

## Wave 3: Options Cross-Product

- [x] `option-direct-meta-api` — Full integration via Instagram Messaging API + webhooks
- [ ] `option-graph-api-polling` — Polling-based approach via Graph API (or document why not viable)
- [ ] `option-composio-relay` — Composio as DM bridge, leveraging existing integration
- [ ] `option-third-party-relay` — Best third-party candidate as relay (from Wave 1 findings)
- [ ] `option-channel-abstraction` — Architecture pattern: generic channel layer unifying email + DMs
- [ ] `option-parallel-tables` — Architecture pattern: add `ig_dm_*` tables mirroring Gmail/SMTP

## Wave 4: Synthesis

- [ ] `synthesis-options-catalog` — Master catalog: API capability matrix, architecture trade-offs, combination matrix, effort estimates, risk register
