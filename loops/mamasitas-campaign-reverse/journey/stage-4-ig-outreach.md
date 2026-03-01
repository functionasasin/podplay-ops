# Stage 4: IG Outreach

## What Happens

Mama Sita's brand rep is ready to send the gifting pitch to 62 vetted creators (from Stage 3). The channel is Instagram DM via @mamasitasmanila. This stage has **two distinct phases** with fundamentally different execution models:

**Phase A — Initial cold outreach (manual):** The brand rep sends the personalized outreach DM to each creator from the Instagram app or web (instagram.com). This is manual because **Meta's Messaging API does not support cold outbound DMs** — you can only send via the API to creators who have previously messaged your IG Business Account within the last 24 hours. The API is reply-only. Cheerful's role here is to generate the personalized message queue and provide the send checklist.

**Phase B — Tracking opens + preparing for replies (CE-assisted):** As creators respond, Meta delivers the inbound messages as webhook events to Cheerful's backend. Cheerful ingests each inbound DM, creates an `ig_dm_thread` record, matches it to the campaign creator, and queues an AI draft reply. The brand rep monitors new threads via CE and is poised to respond (Stage 5).

**Concrete Mama Sita's example**: The brand rep opens Instagram web, pastes the personalized version of:
> "Hi Maria! 👋 I'm with Mama Sita's — we make authentic Filipino sauces and mixes used by families across the Philippines for generations. We love your food content and would love to send you a gift pack..."

...into DM with @filipinafoodie (12K followers), then repeats this for all 62 creators. Cheerful cannot automate this send but CAN generate the full personalized list and check replies as they come in.

---

## Cheerful Feature Mapping

| Action | CE Tool / Feature | Status | Source |
|--------|------------------|--------|--------|
| Verify @mamasitasmanila IG account is connected and webhook-active | `cheerful_list_ig_accounts` | spec'd (not built) | `../../cheerful-ig-dm-spec/analysis/spec/ce-ig-dm-tools.md` §Tool 7 |
| Get the list of 62 approved creators with IG handles | `cheerful_list_campaign_creators` | exists | `../../cheerful-ce-parity-reverse/specs/campaigns.md` |
| Get individual creator IG handle + first name for personalization | `cheerful_get_campaign_creator` | exists | `../../cheerful-ce-parity-reverse/specs/campaigns.md` |
| Generate personalized DM messages for all 62 creators | `cheerful_generate_outreach_list` | **GAP** | No existing spec |
| Send cold outbound DM to creator via Meta API | `cheerful_send_ig_dm_outbound` | **GAP (fundamental)** | Meta API limitation — not possible |
| Mark that a DM was manually sent to track progress | `cheerful_mark_dm_sent` | **GAP** | No existing spec |
| Check if any creators have already responded | `cheerful_list_ig_dm_threads` | spec'd (not built) | `../../cheerful-ig-dm-spec/analysis/spec/ce-ig-dm-tools.md` §Tool 1 |
| Get overall campaign DM status (total sent, replied, pending) | `cheerful_ig_dm_campaign_summary` | spec'd (not built) | `../../cheerful-ig-dm-spec/analysis/spec/ce-ig-dm-tools.md` §Tool 8 |
| Receive inbound DM webhook from creator reply | Webhook ingest + `IgDmIngestWorkflow` | spec'd (not built) | `../../cheerful-ig-dm-spec/analysis/spec/ingest-workflow.md` |
| Auto-match inbound DM to campaign creator | `IgDmIngestWorkflow` creator resolution activity | spec'd (not built) | `../../cheerful-ig-dm-spec/analysis/spec/creator-resolution.md` |
| Generate AI draft reply for each inbound response | AI drafting in `IgDmIngestWorkflow` | spec'd (not built) | `../../cheerful-ig-dm-spec/analysis/spec/ai-drafting.md` |

---

## Detailed Flow

### Phase A: Pre-Outreach Setup (CE-assisted)

Before the brand rep starts manually sending DMs, use CE to verify readiness and generate the send queue.

#### Step A1 — Verify IG account connection

```
User → Slack: "Check that the Mama Sita's IG account is connected and ready"
CE: cheerful_list_ig_accounts()
```

**Expected response shape**:
```xml
<ig-accounts count="1">
  <ig-account id="uuid-ig-acct">
    <ig-handle>@mamasitasmanila</ig-handle>
    <ig-business-account-id>17841400000999888</ig-business-account-id>
    <status>active</status>
    <webhook>subscribed</webhook>
    <token-expires>2026-05-01T00:00:00Z</token-expires>
    <connected-at>2026-03-01T10:00:00Z</connected-at>
  </ig-account>
</ig-accounts>
```

**Brand rep checks**: `<status>active</status>` and `<webhook>subscribed</webhook>`. If webhook is not subscribed, inbound replies will not be captured — this is a P0 blocker.

#### Step A2 — Get the approved creator list

```
User → Slack: "List all creators in the Mama Sita's campaign"
CE: cheerful_list_campaign_creators(campaign_id="campaign-uuid-mamasitas", status="approved", limit=50, offset=0)
```

Repeat with `offset=50` to get creators 51–62.

**Expected response shape** (example):
```xml
<campaign-creators count="50" total="62">
  <creator id="creator-uuid-001">
    <ig-handle>@filipinafoodie</ig-handle>
    <name>Maria Santos</name>
    <status>approved</status>
    <follower-count>12400</follower-count>
  </creator>
  <creator id="creator-uuid-002">
    <ig-handle>@kutsaranimelinda</ig-handle>
    <name>Melinda Cruz</name>
    <status>approved</status>
    <follower-count>8700</follower-count>
  </creator>
  <!-- ... 48 more -->
</campaign-creators>
```

#### Step A3 — Generate personalized outreach messages [GAP]

**This step requires a tool that doesn't exist yet.** The brand rep needs a formatted list of:
- Creator IG handle (to open DM)
- Personalized message text (with `{name}` resolved)
- A checkbox to track which DMs have been sent

Without `cheerful_generate_outreach_list`, the workaround is:

**Workaround**: The CE agent processes all 62 creators in sequence (via multiple `cheerful_get_campaign_creator` calls) and formats the output as a Slack message block with creator handle + personalized message. The brand rep copies each message and sends manually.

Example CE output (as formatted Slack message):
```
OUTREACH QUEUE — 62 creators (send in order):

1. @filipinafoodie → "Hi Maria! 👋 I'm with Mama Sita's..."
2. @kutsaranimelinda → "Hi Melinda! 👋 I'm with Mama Sita's..."
3. @pinoyrecipes2026 → "Hi Jo! 👋 I'm with Mama Sita's..."
...
```

**Rate**: Brand rep sends ~10-15 DMs per session to avoid Instagram's manual send limits (Instagram may rate-limit accounts that send many DMs to non-followers in a short time window). Target: 2-3 sessions over 2 days to complete 62 outreach DMs.

### Phase B: Outreach Execution (manual)

**No CE tools involved.** The brand rep:
1. Opens `instagram.com/direct` or the Instagram mobile app
2. Searches for each creator handle from the queue
3. Pastes the personalized message
4. Sends

**Practical notes for @mamasitasmanila**:
- Instagram may prompt "This person doesn't follow you — send request?" for some creators. The DM will appear in the creator's "Message Requests" folder, not their main inbox. Creators must accept the request for the conversation to be active.
- If a creator has DMs restricted to followers only, the message cannot be sent — mark as "blocked" and skip.
- Expect ~5-10% of DMs to fail delivery (private accounts, DM restrictions).

**Send tracking workaround** (no `cheerful_mark_dm_sent` tool):
- Brand rep maintains a simple spreadsheet or Notion checklist: creator handle | sent (Y/N) | sent date
- OR: After each send, adds a note to the creator's Cheerful record via `cheerful_update_campaign_creator` note field (if this tool exists — also a gap, check CE campaigns spec)

### Phase C: Monitoring Inbound Responses (CE-assisted, automatic)

Once a creator receives the DM request, taps "Accept," and replies — or directly replies if they already follow @mamasitasmanila — the Meta webhook fires.

#### Automatic webhook flow (no CE action required):

```
Creator @filipinafoodie replies: "Hi! I'd love to try these! Here's my address..."
    ↓
Meta sends POST to /webhooks/instagram/ with messages event
    ↓
Cheerful backend: IgDmIngestWorkflow triggered
    1. ig_dm_parse_webhook_activity: Extracts mid, IGSID, text, timestamp
    2. ig_dm_store_message_activity: Stores in ig_dm_message table
    3. ig_dm_resolve_creator_activity: Matches IGSID → creator @filipinafoodie → campaign creator record
    4. ig_dm_update_thread_state_activity: Sets status=WAITING_FOR_DRAFT_REVIEW,
       window_expires_at = now() + 24h
    5. ig_dm_generate_draft_activity: AI generates draft reply (handled in Stage 5)
    ↓
Slack notification to #mamasitas channel:
    "📩 New DM from @filipinafoodie (campaign: Mama Sita's Gifting Q1 2026):
     'Hi! I'd love to try these! Here's my address...'
     Reply window: open until 2026-03-16T14:23:00Z (23h 59m)
     AI draft: ready for review — use cheerful_get_ig_dm_thread to view"
```

#### Step C1 — Monitor inbound threads

```
User → Slack: "Show me new DMs in the Mama Sita's campaign"
CE: cheerful_list_ig_dm_threads(campaign_id="campaign-uuid-mamasitas", status="PENDING", window_open=true)
```

**Expected response**:
```xml
<dm-threads count="7" total="7">
  <dm-thread id="17841234567890">
    <ig-handle>@filipinafoodie</ig-handle>
    <creator-name>Maria Santos</creator-name>
    <campaign>Mama Sita's Micro Creator Gifting — Q1 2026</campaign>
    <status>PENDING</status>
    <last-message-at>2026-03-16T14:23:00Z</last-message-at>
    <snippet>Hi! I'd love to try these! Here's my address...</snippet>
    <reply-window>open (expires 2026-03-17T14:23:00Z)</reply-window>
    <has-draft>true</has-draft>
  </dm-thread>
  <!-- ... 6 more -->
</dm-threads>
```

#### Step C2 — Campaign-level status check

```
User → Slack: "What's the overall DM status for the Mama Sita's campaign?"
CE: cheerful_ig_dm_campaign_summary(campaign_id="campaign-uuid-mamasitas")
```

**Expected response**:
```xml
<ig-dm-campaign-summary id="campaign-uuid-mamasitas">
  <campaign>Mama Sita's Micro Creator Gifting — Q1 2026</campaign>
  <total-threads>12</total-threads>
  <pending-threads>7</pending-threads>      <!-- replied, waiting for brand response -->
  <replied-threads>3</replied-threads>     <!-- brand has replied -->
  <unmatched-threads>2</unmatched-threads> <!-- creator replied but not matched to campaign -->
  <window-open-count>7</window-open-count>
  <window-expiring-soon-count>1</window-expiring-soon-count>  <!-- < 2 hours -->
  <pending-drafts-count>7</pending-drafts-count>
</ig-dm-campaign-summary>
```

### CE Tool Calls (exact)

#### `cheerful_list_ig_accounts` — verify connection
- **Parameters**: none (uses calling user's context)
- **Key fields checked**: `<status>active</status>`, `<webhook>subscribed</webhook>`, `<token-expires>` (must be future date)
- **What user does**: Confirms readiness before starting send campaign

#### `cheerful_list_campaign_creators` — build send queue
- **Parameters**: `campaign_id="campaign-uuid-mamasitas"`, `status="approved"`, `limit=50`, `offset=0`
- **Key fields used**: `ig_handle` (where to send DM), `name` (for `{name}` merge tag)
- **What user does**: Takes the list to build the manual outreach queue

#### `cheerful_get_campaign_creator` — personalize each message (×62)
- **Parameters**: `campaign_id="campaign-uuid-mamasitas"`, `creator_id="creator-uuid-NNN"`
- **Key fields used**: `first_name` or `ig_handle` for `{name}` resolution
- **What user does**: CE agent calls this for each creator and formats the personalized message batch

#### `cheerful_list_ig_dm_threads` — monitor inbound responses
- **Parameters**: `campaign_id="campaign-uuid-mamasitas"`, `status="PENDING"`, `window_open=true`, `limit=50`
- **Key fields used**: `ig_handle`, `snippet`, `reply_window`, `has_draft`
- **What user does**: Reviews new inbound threads, prioritizes replies by window expiry

#### `cheerful_ig_dm_campaign_summary` — progress snapshot
- **Parameters**: `campaign_id="campaign-uuid-mamasitas"`
- **Key fields used**: `total_threads`, `pending_threads`, `window_expiring_soon_count`
- **What user does**: Daily check on campaign response rate (e.g., "12/62 replied in day 1")

### IG-Specific Considerations

#### Meta API: No Cold Outbound DMs

The Instagram Messaging API (`POST /{ig_business_account_id}/messages`) only works within an existing 24h conversation window. A conversation window only exists when a creator has messaged @mamasitasmanila first. For the initial cold outreach to 62 creators who have never messaged @mamasitasmanila, **there is no API path**. The Meta Developer docs confirm this constraint:

> "You can only send messages to a user who has sent your business a message within the past 24 hours."

**Practical implication**: Cheerful's `cheerful_send_ig_dm_reply` and `IgDmSendReplyWorkflow` are irrelevant for Stage 4 Phase B. They become relevant in Stage 5 (Response Management) when creators reply and windows open.

**HUMAN_AGENT tag (7-day window)**: This allows replies up to 7 days after the last inbound, but still requires the creator to have messaged first. It does not enable cold DMs.

#### Instagram DM Requests

When @mamasitasmanila DMs a creator who doesn't follow the account, the DM goes to the creator's "Message Requests" folder. Creators must explicitly accept the request. Acceptance is not observable via webhook — Cheerful only learns of it when the creator sends an inbound message (acceptance alone triggers no webhook event).

**Implication**: The time from send to first response includes the creator discovering and accepting the request, which can be 0–72h or never.

#### Rate Limiting (Manual Sends)

Instagram's native app imposes undocumented rate limits on manual DM sends. Accounts sending many DMs to non-followers in a short period may trigger:
- Temporary DM restrictions (24–48h)
- Action blocked warnings
- In extreme cases, account suspension

**Safe practice for @mamasitasmanila**: Send 15–20 DMs per day maximum. With 62 creators, complete outreach over 4 days. Prioritize creators most likely to respond (higher follower counts, Filipino food focus).

#### 24h Window Rule — Stage 4 vs Stage 5

| Phase | Window Status | API Access |
|-------|--------------|------------|
| Stage 4 Phase A (cold outreach) | No window (no prior DM) | Not applicable — manual send only |
| Stage 4 Phase B (manual send, creator has not replied) | No window | Cannot use API |
| Stage 4 Phase C (creator replies inbound) | Window opens: `now + 24h` | `cheerful_send_ig_dm_reply` now available |
| Stage 5 (responding to creator) | Window open (< 24h) | `cheerful_send_ig_dm_reply` or `cheerful_approve_ig_dm_draft` |
| Stage 5 (24h elapsed, creator hasn't replied again) | Window closed | Must wait for creator to re-open |

#### Follow-Up DM (Day 5)

The campaign config specifies one follow-up DM after 5 days if no response. This follow-up faces the same cold outbound constraint — it must also be sent manually from the Instagram app. CE can help by generating a "follow-up send list" (creators who have not replied after 5 days), but it cannot automate the send.

---

## Gaps & Workarounds

| # | Gap | Impact | Workaround | Build Priority |
|---|-----|--------|------------|----------------|
| 22 | Meta API does not support cold outbound DMs — `cheerful_send_ig_dm_outbound` is fundamentally impossible via the Instagram Messaging API | **Blocks all automated initial outreach** — Phase B is entirely manual for all 62 creators | Brand rep manually sends DMs from `instagram.com/direct` or mobile app. Acceptable for 62 creators; does not scale to 500+ | P0 (architectural — not solvable within Meta API constraints) |
| 23 | No `cheerful_generate_outreach_list` CE tool — cannot generate a formatted send queue with personalized messages from a creator list | Brand rep must assemble personalization manually (62 name lookups + message customizations) | CE agent iterates `cheerful_get_campaign_creator` × 62 and formats output as Slack message; copy-paste per creator | P0 for usability — first tool that should be built to make Phase A useful |
| 24 | No `cheerful_mark_dm_sent` CE tool — cannot record that a manual DM was sent for each creator | Cannot track send progress in Cheerful; cannot compute "response rate" accurately (sent count unknown to platform) | External spreadsheet tracking (handle, sent date, sent_by); OR use `cheerful_update_campaign_creator` note field if available | P0 for campaign tracking — ties into Stage 5 follow-up scheduling |
| 25 | No automated follow-up scheduling — Cheerful cannot trigger a "send follow-up DM" action after 5 days | Follow-up send is entirely manual; brand rep must remember to re-DM non-responders | Brand rep manually checks sent-date spreadsheet on day 5 and sends follow-up DMs | P1 — would require `cheerful_mark_dm_sent` (Gap 24) as prerequisite + scheduling CE tool |
| 26 | Creator IGSID resolution depends on creator's IG handle in Cheerful's DB — if a creator's handle doesn't match their IGSID exactly, the inbound DM won't be matched to the campaign creator | ~5-15% of inbound DMs may appear as `UNMATCHED` threads | CE surfaces unmatched threads via `cheerful_list_ig_dm_threads(status="UNMATCHED")`; brand rep manually associates | P1 — `ig_dm_resolve_creator_activity` must implement fallback matching (display name, follower count cross-check) |
| 27 | Instagram "Message Request" acceptance is unobservable via webhook — Cheerful cannot tell if a creator has seen/accepted the DM request | Cannot distinguish "DM delivered but not yet accepted" from "creator ignores" from "DM blocked" | All non-responding creators are treated uniformly after 5 days; follow-up is sent regardless of acceptance status | P2 — would require polling (not possible via API) |
| 28 | No bulk send tracking update — marking 62 creators as "DM sent" individually is 62 CE tool calls | Time-consuming even with a `cheerful_mark_dm_sent` tool | Accept as batch — mark all as sent at end of each session (15-20 per session) | P1 — add `campaign_creator_id[]` array parameter to bulk-update send status |

---

## Success Criteria

At the end of Stage 4, "100% hero journey" means:

1. **Outreach complete**: All 62 approved creators have received the Mama Sita's gifting pitch DM from @mamasitasmanila
2. **Tracking verified**: Cheerful has a record of which creators were DM'd and when (via `cheerful_mark_dm_sent` calls or equivalent)
3. **Webhook live**: At least one creator has responded, and Cheerful has ingested their inbound DM — confirming the webhook pipeline is working end-to-end
4. **Thread monitoring active**: Brand rep has verified `cheerful_list_ig_dm_threads` returns the inbound responses and that each thread is matched to the correct campaign creator
5. **Response rate baseline**: After 48h, at least 10+ threads are visible in Cheerful (indicating ~15-20% early response rate)
6. **No window expirations missed**: `cheerful_ig_dm_campaign_summary` shows `window_expiring_soon_count = 0` (all pending replies are addressed in Stage 5 within their 24h windows)

**Expected outcomes at scale (62 creators, 5-day outreach window)**:
- Outreach completion: Day 1–4 (15-20 DMs/day)
- First responses: Day 1–7 after initial send (some creators check DM requests daily, others weekly)
- Follow-up sends: Day 5–9 for non-responders
- Total expected responses: 25-40 creators (40-65% response rate for warm gifting DMs with no payment ask)

---

## Dependencies

| Dependency | Required By | Status |
|-----------|------------|--------|
| Stage 1: @mamasitasmanila IG account connected + webhook subscribed | Phase A verification, Phase C inbound capture | Spec'd — must be built |
| Stage 3: 62 approved creators in Cheerful campaign with IG handles | Phase A send queue generation | Spec'd — must be built |
| `IgDmIngestWorkflow` deployed and processing webhooks | Phase C — receiving and matching inbound DMs | Spec'd — must be built |
| `cheerful_list_ig_accounts` CE tool | Phase A Step A1 | Spec'd — must be built (`ce-ig-dm-tools.md`) |
| `cheerful_list_ig_dm_threads` CE tool | Phase C monitoring | Spec'd — must be built (`ce-ig-dm-tools.md`) |
| `cheerful_ig_dm_campaign_summary` CE tool | Phase C status | Spec'd — must be built (`ce-ig-dm-tools.md`) |
| Meta App Review (Advanced Access) approved | Production outreach to non-test creators | External process — submit before Day 1 |
| Brand rep has @mamasitasmanila Instagram app access on mobile | Phase B manual DM sends | Operational — not a Cheerful dependency |
