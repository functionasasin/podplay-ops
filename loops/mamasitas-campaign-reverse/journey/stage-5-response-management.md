# Stage 5: Response Management

## What Happens

Creators who received the Mama Sita's gifting DM begin replying. Some say yes immediately and share an address. Some ask clarifying questions ("What products will you send?"). Some decline politely. Many say nothing for 5 days.

The brand rep manages all of these conversations through Cheerful CE via Slack. When @filipinafoodie replies "Hi! I'd love to try these! Here's my address — Unit 3B, 45 Kalayaan Ave, Quezon City 1101, Philippines", the Meta webhook fires, `IgDmIngestWorkflow` ingests the message, Slack receives a proactive notification, the AI generates a draft reply (thanking her and confirming receipt), and the brand rep approves the draft within 24 hours. For the 30-40 non-responders on Day 5, the brand rep generates a follow-up list from CE and repeats the manual send process (same constraint as Stage 4 — cold DMs cannot be automated).

This stage spans roughly Day 1 through Day 14 of the campaign, covering the full response wave.

**Concrete Mama Sita's scale**: Of 62 creators DM'd, expect:
- 25–40 respond within Day 1–7 (40–65% response rate for free gifting DMs)
- Of responders: ~85–90% interested (gifting is free, no payment required)
- ~5–10% decline politely
- ~5% have questions requiring back-and-forth
- 22–37 non-responders get one follow-up DM on Day 5

---

## Cheerful Feature Mapping

| Action | CE Tool / Feature | Status | Source |
|--------|------------------|--------|--------|
| Receive Slack notification: new DM from creator | `ig_dm_notify_activity(NEW_INBOUND)` → Slack Block Kit push | spec'd (not built) | `../../cheerful-ig-dm-spec/analysis/spec/ce-ig-dm-notifications.md` §5.1 |
| List all pending creator DM responses | `cheerful_list_ig_dm_threads` | spec'd (not built) | `../../cheerful-ig-dm-spec/analysis/spec/ce-ig-dm-tools.md` §Tool 1 |
| Read a creator's full DM conversation | `cheerful_get_ig_dm_thread` | spec'd (not built) | `../../cheerful-ig-dm-spec/analysis/spec/ce-ig-dm-tools.md` §Tool 2 |
| Receive Slack notification: AI draft ready | `ig_dm_notify_activity(DRAFT_READY)` → Slack Block Kit push | spec'd (not built) | `../../cheerful-ig-dm-spec/analysis/spec/ce-ig-dm-notifications.md` §5.2 |
| Approve AI-generated draft reply (with or without edit) | `cheerful_approve_ig_dm_draft` | spec'd (not built) | `../../cheerful-ig-dm-spec/analysis/spec/ce-ig-dm-tools.md` §Tool 4 |
| Send custom reply (bypassing AI draft) | `cheerful_send_ig_dm_reply` | spec'd (not built) | `../../cheerful-ig-dm-spec/analysis/spec/ce-ig-dm-tools.md` §Tool 3 |
| Get campaign-level response summary | `cheerful_ig_dm_campaign_summary` | spec'd (not built) | `../../cheerful-ig-dm-spec/analysis/spec/ce-ig-dm-tools.md` §Tool 8 |
| Search for a specific creator's DM thread | `cheerful_search_ig_dms` | spec'd (not built) | `../../cheerful-ig-dm-spec/analysis/spec/ce-ig-dm-tools.md` §Tool 5 |
| Receive Slack alert: reply window closing (< 2h left) | `ig_dm_notify_activity(WINDOW_EXPIRING)` via `IgDmReconciliationWorkflow` cron | spec'd (not built) | `../../cheerful-ig-dm-spec/analysis/spec/ce-ig-dm-notifications.md` §5.4 |
| Receive Slack alert: reply window expired without response | `ig_dm_notify_activity(WINDOW_EXPIRED)` via reconciliation cron | spec'd (not built) | `../../cheerful-ig-dm-spec/analysis/spec/ce-ig-dm-notifications.md` §5.4 |
| Resolve UNMATCHED thread to campaign creator | Manual via `cheerful_list_ig_dm_threads(status="UNMATCHED")` | workaround (Gap 26) | `../../cheerful-ig-dm-spec/analysis/spec/creator-resolution.md` |
| Update creator status after response (interested / declined) | `cheerful_update_campaign_creator` (if exists) | **GAP** | No status-from-DM flow spec'd |
| Parse and store shipping address from DM text | Manual extraction (no tool) | **GAP** | No address extraction tool |
| Auto-categorize responses (interested / declined / questions) | No tool | **GAP** | No existing spec |
| Generate follow-up list for non-responders (Day 5) | `cheerful_list_campaign_creators` with `dm_sent=true, replied=false` filter | **GAP** (requires Gap 24 `cheerful_mark_dm_sent` first) | Depends on Gap 24 |

---

## Detailed Flow

### Phase A: Inbound Response Handling (Days 1–10, continuous)

The brand rep monitors Slack for IG DM notifications as creators reply. This is a continuous asynchronous process — not a single step.

#### Step A1 — Proactive Slack notification arrives

When @filipinafoodie replies to the Mama Sita's DM:

```
Meta webhook → POST /webhooks/instagram/ (Cheerful backend)
    ↓
IgDmIngestWorkflow (automated):
    1. ig_dm_parse_webhook_activity: extract mid, IGSID, body, timestamp
    2. ig_dm_store_message_activity: stored in ig_dm_message
    3. ig_dm_thread_state inserted: status=READY_FOR_CAMPAIGN_ASSOCIATION,
       window_expires_at = 2026-03-16T14:23:00Z + 24h = 2026-03-17T14:23:00Z
    4. IgIsidResolutionWorkflow: IGSID → @filipinafoodie → creator-uuid-001 ✓
    5. Slack notification fires:

📨 New Instagram DM
@filipinafoodie · Campaign: Mama Sita's Micro Creator Gifting — Q1 2026
Message: Hi! I'd love to try your products! Here's my shipping address...
⏳ Reply window open — expires 2026-03-17T14:23:00Z (24h)
💬 To view: `@Cheerful get IG DM thread: 17841200000111222`
```

A few minutes later, a second notification:

```
🤖 AI Draft Ready — Instagram DM
@filipinafoodie · Mama Sita's Micro Creator Gifting — Q1 2026
> Hi Maria! So excited you're joining us! We'll get your gift pack shipped out...
✅ To approve: `@Cheerful approve IG DM draft: 17841200000111222`
👁 To review first: `@Cheerful get IG DM thread: 17841200000111222`
```

#### Step A2 — Review pending threads (morning triage)

Brand rep's daily routine: start the day by checking all new responses.

```
User → Slack: "Show me new DMs in the Mama Sita's campaign"
CE: cheerful_list_ig_dm_threads(
    campaign_id="campaign-uuid-mamasitas",
    status="PENDING",
    window_open=true,
    limit=50
)
```

**Expected response** (day 3 of outreach, 14 replies in):

```xml
<dm-threads count="14" total="14">
  <dm-thread id="17841200000111222">
    <ig-handle>@filipinafoodie</ig-handle>
    <creator-name>Maria Santos</creator-name>
    <campaign>Mama Sita's Micro Creator Gifting — Q1 2026</campaign>
    <status>PENDING</status>
    <last-message-at>2026-03-16T14:23:00Z</last-message-at>
    <snippet>Hi! I'd love to try your products! Here's my shipping...</snippet>
    <reply-window>open (expires 2026-03-17T14:23:00Z)</reply-window>
    <has-draft>true</has-draft>
  </dm-thread>
  <dm-thread id="17841200000222333">
    <ig-handle>@kutsaranimelinda</ig-handle>
    <creator-name>Melinda Cruz</creator-name>
    <campaign>Mama Sita's Micro Creator Gifting — Q1 2026</campaign>
    <status>PENDING</status>
    <last-message-at>2026-03-16T16:45:00Z</last-message-at>
    <snippet>Uy! Sige naman! Anong address ang ibibigay ko?</snippet>
    <reply-window>open (expires 2026-03-17T16:45:00Z)</reply-window>
    <has-draft>true</has-draft>
  </dm-thread>
  <dm-thread id="17841200000333444">
    <ig-handle>@pinoyrecipes2026</ig-handle>
    <creator-name>Jo Mendez</creator-name>
    <campaign>Mama Sita's Micro Creator Gifting — Q1 2026</campaign>
    <status>PENDING</status>
    <last-message-at>2026-03-16T20:11:00Z</last-message-at>
    <snippet>Anong products ang ipapadala? Interested ako sa oyster sauce...</snippet>
    <reply-window>open (expires 2026-03-17T20:11:00Z)</reply-window>
    <has-draft>true</has-draft>
  </dm-thread>
  <!-- ... 11 more -->
</dm-threads>
```

Brand rep scans the list and prioritizes by **window expiry** (most urgent first).

#### Step A3 — Read full conversation for a thread

```
User → Slack: "Get IG DM thread: 17841200000111222"
CE: cheerful_get_ig_dm_thread(ig_conversation_id="17841200000111222")
```

**Expected response**:

```xml
<dm-thread-detail>
  <ig-conversation-id>17841200000111222</ig-conversation-id>
  <ig-handle>@filipinafoodie</ig-handle>
  <creator id="creator-uuid-001">
    <name>Maria Santos</name>
    <campaign>Mama Sita's Micro Creator Gifting — Q1 2026</campaign>
  </creator>
  <status>PENDING</status>
  <reply-window>open (expires 2026-03-17T14:23:00Z)</reply-window>
  <messages count="2">
    <message id="m_outbound_001" direction="OUTBOUND">
      <from>you (@mamasitasmanila)</from>
      <sent-at>2026-03-15T10:00:00Z</sent-at>
      <body>Hi Maria! 👋 I'm with Mama Sita's — we make authentic Filipino sauces and mixes used by families across the Philippines for generations. We love your food content and would love to send you a gift pack: our Oyster Sauce (350mL) + Sinigang Mix Sampalok (pack of 6 sachets) to try in your kitchen. No strings attached — just hoping you enjoy them! If you'd like the gift pack, just reply here with your shipping address and we'll send it right over. 🇵🇭</body>
    </message>
    <message id="m_inbound_002" direction="INBOUND">
      <from>@filipinafoodie</from>
      <sent-at>2026-03-16T14:23:00Z</sent-at>
      <body>Hi! I'd love to try your products! Here's my shipping address: Maria Santos, Unit 3B 45 Kalayaan Ave, Quezon City, Metro Manila 1101, Philippines. Excited to cook with Mama Sita's!</body>
    </message>
  </messages>
  <ai-draft id="draft-uuid-001">
    <draft-text>Hi Maria! So excited you're joining the Mama Sita's family! 🎉 We'll get your gift pack — Oyster Sauce (350mL) + Sinigang Mix Sampalok — shipped to you at Kalayaan Ave, Quezon City. You'll receive it in 3-5 business days. Can't wait to see what you create! 🇵🇭 #MamaSitas</draft-text>
    <generated-at>2026-03-16T14:25:30Z</generated-at>
    <status>PENDING</status>
  </ai-draft>
</dm-thread-detail>
```

**Brand rep assessment**: Maria provided her address and the AI draft looks great. Approve as-is.

#### Step A4a — Approve AI draft (interested creator with address)

```
User → Slack: "Approve IG DM draft: 17841200000111222"
CE: cheerful_approve_ig_dm_draft(
    ig_conversation_id="17841200000111222",
    edited_text=None  # send as-is
)
```

**What happens internally**:
- CE fetches thread → gets `draft_id="draft-uuid-001"`, `draft_text`
- CE calls `cheerful_send_ig_dm_reply` with `message_text=draft_text, draft_id="draft-uuid-001"`
- Backend: `IgDmSendReplyWorkflow` → window check (open ✓) → Meta API send → `ig_dm_store_message` → thread state → `WAITING_FOR_INBOUND`

**CE response**:
```xml
<ig-dm-draft-approved mid="m_sent_003" draft_id="draft-uuid-001" edited="false"
    sent_at="2026-03-16T14:47:00Z" />
```

Brand rep notes: Maria's address needs to be added to the shipping export. **This is a manual step** — see Gap 31.

#### Step A4b — Edit AI draft before approving (question response)

@pinoyrecipes2026 ("Jo Mendez") asked "Anong products ang ipapadala?" — the AI may not know the exact product specs to list. Brand rep reviews the AI draft, edits it with the correct product details.

```
User → Slack: "Get IG DM thread: 17841200000333444"
[Reviews AI draft — draft says correct products but wrong quantities]
User → Slack: "Approve IG DM draft: 17841200000333444 with edit: Hi Jo! We'll be sending you 1 bottle of Mama Sita's Oyster Sauce (350mL) and 1 pack of Sinigang Mix Sampalok (6 sachets). Interested in receiving the gift pack? Just send us your shipping address! 🇵🇭"
CE: cheerful_approve_ig_dm_draft(
    ig_conversation_id="17841200000333444",
    edited_text="Hi Jo! We'll be sending you 1 bottle of Mama Sita's Oyster Sauce (350mL) and 1 pack of Sinigang Mix Sampalok (6 sachets). Interested in receiving the gift pack? Just send us your shipping address! 🇵🇭"
)
```

**CE response**:
```xml
<ig-dm-draft-approved mid="m_sent_007" draft_id="draft-uuid-003" edited="true"
    sent_at="2026-03-16T15:03:00Z" />
```

#### Step A4c — Send custom reply (declined creator)

@baguiofoodies politely declined: "Thanks for the offer! I only work with paid partnerships, but appreciate you reaching out!" AI draft generates a standard "no problem" reply; brand rep approves it or customizes.

```
User → Slack: "Approve IG DM draft: 17841200000444555"
[AI draft: "Thanks for letting us know! Totally understand. Feel free to reach out anytime if you change your mind. 🙏"]
[Draft looks good — approve as-is]
CE: cheerful_approve_ig_dm_draft(ig_conversation_id="17841200000444555", edited_text=None)
```

**Gap note**: Cheerful has no way to automatically mark @baguiofoodies's creator record as "declined" — this must be done manually (Gap 30).

### Phase B: Window Management (Continuous, Hours 0–24 after each reply)

The 24h window is the operational pressure point of this stage. A campaign with 30+ simultaneous threads, each with its own 24h clock, creates real urgency.

#### Window expiry alert (automated)

`IgDmReconciliationWorkflow` runs every 30 minutes. When @kutsaranimelinda's window hits < 2 hours:

```
⚠️ Reply Window Closing — 87 minutes left
@kutsaranimelinda · Mama Sita's Micro Creator Gifting — Q1 2026
AI draft is ready. Approve now to send before the window closes.
✅ Approve draft: `@Cheerful approve IG DM draft: 17841200000222333`
```

Brand rep immediately approves:

```
User → Slack: "Approve IG DM draft: 17841200000222333"
CE: cheerful_approve_ig_dm_draft(ig_conversation_id="17841200000222333", edited_text=None)
```

#### Expired window (no reply sent in time)

If the brand rep misses a window:

```
🔒 Reply Window Closed — Instagram DM
@foodph.triplets · Mama Sita's Micro Creator Gifting — Q1 2026
Window closed at 2026-03-17T09:15:00Z without a reply.
The creator must send another message to re-open the window.
```

**Manual workaround**: Brand rep must open Instagram app and send a manual DM (same constraint as cold outreach). This re-opens the window when the creator replies. Note: this second manual DM is essentially another cold outreach attempt — it still cannot be sent via the API.

### Phase C: Campaign Status Check (Daily)

```
User → Slack: "What's the overall DM status for the Mama Sita's campaign?"
CE: cheerful_ig_dm_campaign_summary(campaign_id="campaign-uuid-mamasitas")
```

**Expected response (Day 7)**:

```xml
<ig-dm-campaign-summary id="campaign-uuid-mamasitas">
  <campaign>Mama Sita's Micro Creator Gifting — Q1 2026</campaign>
  <total-threads>34</total-threads>           <!-- 34 creators have replied -->
  <pending-threads>6</pending-threads>         <!-- replied, not yet responded to -->
  <replied-threads>26</replied-threads>        <!-- brand replied, waiting for next creator message -->
  <unmatched-threads>2</unmatched-threads>     <!-- replied but not in campaign creator list -->
  <window-open-count>6</window-open-count>
  <window-expiring-soon-count>2</window-expiring-soon-count>  <!-- < 2 hours -->
  <pending-drafts-count>6</pending-drafts-count>
</ig-dm-campaign-summary>
```

Brand rep tracks: 34/62 replied in 7 days (55% response rate). Of the 34: ~28 interested, ~4 declined, ~2 questions outstanding.

### Phase D: Non-Responder Follow-Up (Day 5, Manual)

28 creators haven't replied after 5 days. The brand rep needs to identify them and send a follow-up DM.

#### Step D1 — Generate follow-up list [GAP]

This requires knowing which creators were DM'd (requires `cheerful_mark_dm_sent` from Gap 24) and which haven't replied (requires `replied=false` filter).

**Workaround**: CE agent calls `cheerful_list_campaign_creators(campaign_id="campaign-uuid-mamasitas", status="approved")` to get all 62 creators, then cross-references against `cheerful_ig_dm_campaign_summary` thread count to identify non-responders. This is approximate — it doesn't account for creators whose DM was never sent (e.g., blocked accounts from Stage 4).

```
User → Slack: "Which Mama Sita's creators haven't replied yet? I need to send follow-ups."
CE: [agent logic]
    1. cheerful_list_campaign_creators(campaign_id="...", status="approved") → 62 creators
    2. cheerful_list_ig_dm_threads(campaign_id="...", limit=50) → 34 threads with replies
    3. Diff: 62 creators - 34 thread matches = ~28 no-reply creators
    4. Format as follow-up queue with the follow-up DM template
```

**CE output**:
```
FOLLOW-UP QUEUE — Day 5 (28 creators, no reply yet):

1. @baguioathome → "Hi Jo! Just following up on my message about the Mama Sita's gift pack..."
2. @tagatagalog_recipes → "Hi Ana! Just following up..."
[... 26 more ...]
```

#### Step D2 — Send follow-up DMs (manual)

Same as Stage 4 Phase B: brand rep opens Instagram app, pastes the follow-up template, sends to each non-responder. CE cannot automate this.

**Rate**: 28 follow-ups, same 15-20/day limit → ~2 days (Day 5–6 of campaign).

---

## CE Tool Calls (Exact)

### `cheerful_list_ig_dm_threads` — morning triage

```
Parameters:
  campaign_id: "campaign-uuid-mamasitas"
  status: "PENDING"
  window_open: true
  limit: 50
  offset: 0

Key fields used:
  ig_handle (who to reply to)
  snippet (quick preview of what creator said)
  reply_window (urgency: expires when?)
  has_draft (is AI draft ready?)

What user does: Sorts by window_expires_at (most urgent first), reads each thread in priority order
```

### `cheerful_get_ig_dm_thread` — read full conversation

```
Parameters:
  ig_conversation_id: "17841200000111222"

Key fields used:
  messages[*].body (full conversation history)
  messages[*].direction (INBOUND vs OUTBOUND)
  ai_draft.draft_text (proposed reply)
  reply_window (confirm still open)

What user does: Assess response type (interested / declined / questions), decide to approve/edit/custom-reply
```

### `cheerful_approve_ig_dm_draft` — send draft (standard flow)

```
Parameters:
  ig_conversation_id: "17841200000111222"
  edited_text: None   # approve as-is
  -- OR --
  edited_text: "Custom edited version of the reply text (max 1000 chars)"

Calls internally:
  GET /api/service/ig-dm/threads/{id}   → fetch draft_id + draft_text
  POST /api/service/ig-dm/threads/{id}/reply  → send via Meta API

Error handling:
  24h window closed → "Cannot send — 24h reply window has closed. The creator must message first to re-open the window."
  No pending draft → "No pending AI draft for this thread. Use cheerful_send_ig_dm_reply for a custom message."

What user does: Confirms send; notes shipping address (if provided in inbound) for manual tracking
```

### `cheerful_send_ig_dm_reply` — custom reply (bypass AI draft)

```
Parameters:
  ig_conversation_id: "17841200000444555"
  message_text: "Thanks for letting us know! Totally understand. Feel free to reach out anytime! 🙏"

Key constraint: max 1000 characters
Error: 24h window closed → ToolError

What user does: Used when AI draft is wrong, no draft was generated, or response is simple
```

### `cheerful_ig_dm_campaign_summary` — daily status check

```
Parameters:
  campaign_id: "campaign-uuid-mamasitas"

Key fields monitored:
  pending_threads (need responses today)
  window_expiring_soon_count (URGENT — respond in < 2 hours)
  unmatched_threads (need manual association)

What user does: Prioritizes work; escalates if window_expiring_soon_count > 0
```

### `cheerful_search_ig_dms` — find a specific creator

```
Parameters:
  query: "filipinafoodie"
  campaign_id: "campaign-uuid-mamasitas"
  limit: 5

What user does: Quick lookup when creator DMs outside normal triage; "Just got a DM from @filipinafoodie"
```

---

## IG-Specific Considerations

### The 24-Hour Window as Operational Pressure

With 30–40 simultaneous threads, each with a 24h reply window, the brand rep must respond to all pending threads within 24h of each creator's reply. This is the core operational challenge of Stage 5.

**Practical mitigation**:
- AI drafts are generated within minutes of inbound DM → minimal review time needed
- `cheerful_approve_ig_dm_draft` is a single Slack command → low friction
- Window expiry alerts fire at `< 2h` remaining → sufficient notice for a final push
- Most gifting DMs will be simple "yes, here's my address" → AI draft accurate ~90% of the time

**Worst case scenario**: Brand rep is unavailable for 24+ hours. 6 open threads' windows expire. Next steps:
1. `cheerful_list_ig_dm_threads(status="PENDING", window_open=false)` → identifies expired threads
2. For each creator: send manual follow-up DM from IG app (re-opens window when creator replies)
3. CE shows expired windows with "WINDOW_EXPIRED" notification in Slack — brand rep can review queue

### HUMAN_AGENT Tag (7-day window) — Not in MVP

Meta's HUMAN_AGENT tag allows replies up to 7 days after the last inbound message. This would completely eliminate the 24h pressure for human-managed gifting conversations (vs. automated campaigns). **Not implemented in the IG DM spec MVP.** A future `IgDmSendReplyInput.message_tag = "HUMAN_AGENT"` parameter would add this.

**Impact on Mama Sita's**: Without HUMAN_AGENT, the brand rep must respond within 24h. With HUMAN_AGENT, the window extends to 7 days — dramatically reducing operational stress. This is a P1 future enhancement.

### UNMATCHED Threads

Some creators who reply via IG may not match the IGSID resolution (Gap 26 from Stage 4). These appear as `status="UNMATCHED"` in the thread list.

```
User → Slack: "Show me unmatched DMs in the Mama Sita's campaign"
CE: cheerful_list_ig_dm_threads(
    campaign_id="campaign-uuid-mamasitas",
    status="UNMATCHED",
    limit=20
)
```

Manual resolution: Brand rep sees @unknowncreator is in the list, looks up their handle in the campaign's creator list, and manually updates the thread (no tool for this — Gap 26).

### Second-Leg Conversations (Address Follow-Up)

Many conversations are two-leg: (1) creator responds yes → (2) brand asks for address → (3) creator provides address → (4) brand confirms. This means the 24h window resets at step (3), and step (4) must be sent within 24h of step (3).

Cheerful handles this correctly: each new inbound message (`direction=INBOUND`) triggers a new `ig_dm_thread_state` row with a fresh `window_expires_at = inbound_timestamp + 24h`. The `IgDmIngestWorkflow` fires again, a new AI draft is generated for step (4), and a new Slack notification fires.

---

## Gaps & Workarounds

| # | Gap | Impact | Workaround | Build Priority |
|---|-----|--------|------------|----------------|
| 29 | No `cheerful_categorize_ig_dm_response` tool — cannot auto-label creator responses as "interested", "declined", "questions", "unrelated" | Brand rep must read every thread to categorize; no aggregate view of "interested vs. declined" | Manual reading via `cheerful_get_ig_dm_thread`; CE agent can infer from AI draft type (address-asking draft = interested assumed) | P1 — enables status tracking and skip-list (don't follow up on declined creators) |
| 30 | No `cheerful_update_campaign_creator` tool (or equivalent) to update creator response status in Cheerful from DM response | Can't track "interested", "declined" per creator in the campaign — no way to know which creators need to move to shipping stage | External spreadsheet: columns for reply_status (interested/declined/no-reply), address received (Y/N), date replied | P0 for campaign tracking — without this, the shipping export (Stage 7) cannot be automated |
| 31 | No address extraction from DM text — when a creator provides shipping address in DM body, there's no tool to parse and store it in their Cheerful record | Brand rep must manually copy address from Slack notification to spreadsheet; 100% manual for all 50 addresses | Copy from `cheerful_get_ig_dm_thread` → `messages[last].body` → paste to spreadsheet | P0 for automation — address collection is the primary data collection goal of this stage; manual at 50 creators is painful but feasible |
| 32 | HUMAN_AGENT tag not in MVP — 24h window applies to all replies; brand rep cannot let conversations sit overnight without risk of window expiry | Operational pressure: 30+ simultaneous 24h windows requires near-daily engagement; 1 unavailable day loses all open windows | `IgDmReconciliationWorkflow` alerts at < 2h remaining; brand rep can do a "batch approve" session each morning | P1 — when HUMAN_AGENT supported: `IgDmSendReplyInput.message_tag = "HUMAN_AGENT"` parameter; 7-day window entirely eliminates the pressure |
| 33 | No follow-up non-responder list tool — cannot identify which specific creators from the 62 haven't replied after 5 days | Follow-up list requires a diff between "creators DM'd" and "creators who replied" — neither list is complete in Cheerful without Gap 24 (mark_dm_sent) | CE agent diffs `cheerful_list_campaign_creators` against `cheerful_list_ig_dm_threads` thread count; approximate (doesn't account for blocked sends) | P1 — depends on Gap 24 (`cheerful_mark_dm_sent`); with Gap 24 solved, a simple `cheerful_list_campaign_creators(dm_sent=true, replied=false)` filter would work |
| 34 | No conversation state machine — threads don't have a "stage" field (initial, address-requested, address-received, confirmed) | Can't see at a glance which conversations are in which stage; brand rep must read each thread to know what action to take | `cheerful_list_ig_dm_threads` shows last message snippet — experienced brand rep infers stage from snippet | P2 — nice-to-have; adds a `conversation_stage` enum to `ig_dm_thread_state` |
| 35 | Expired window requires manual IG app re-engagement — if brand rep misses a 24h window, they must manually DM the creator from Instagram app to re-open it | Same constraint as cold outreach (Stage 4 Gap 22) — cannot be automated via API | Brand rep monitors `window_expiring_soon_count` in daily `cheerful_ig_dm_campaign_summary` call; aim for 0 missed windows | P0 (architectural — same Meta API constraint; not solvable) |

---

## Success Criteria

At the end of Stage 5, "100% hero journey" means:

1. **All interested responses handled**: Every creator who replied "yes" has received a brand confirmation DM (AI draft approved) within their 24h window — 0 missed windows from interested creators
2. **All declined responses handled**: Creators who declined received a graceful close DM within 24h; brand rep knows not to follow up with them
3. **Addresses collected**: At least 40+ creators have provided shipping addresses (target: 50+); addresses are stored in an accessible format (even if a spreadsheet, not in Cheerful)
4. **Follow-up sent**: All non-responders after 5 days received the follow-up DM from @mamasitasmanila IG app; 20+ additional responses from follow-up
5. **Campaign summary healthy**: `cheerful_ig_dm_campaign_summary` shows `window_expiring_soon_count = 0` and `pending_threads = 0` (all open conversations addressed) at end of each day
6. **Unmatched threads resolved**: `unmatched_threads = 0` in campaign summary (all incoming DMs associated with campaign creators)

**Expected outcomes by Day 14**:
- 50+ creators have confirmed interest and provided shipping addresses
- ~10 creators declined or non-responsive after follow-up
- ~28–35 AI drafts approved as-is (no edits needed)
- ~5–12 AI drafts edited before sending (product questions, custom responses)

---

## Dependencies

| Dependency | Required By | Status |
|-----------|------------|--------|
| Stage 4: 62 creators DM'd, `IgDmIngestWorkflow` live and processing webhooks | Phase A — receiving inbound DMs | Spec'd — must be built |
| `cheerful_list_ig_dm_threads` CE tool | Phase A Step A2 triage | Spec'd — must be built |
| `cheerful_get_ig_dm_thread` CE tool | Phase A Step A3 thread review | Spec'd — must be built |
| `cheerful_approve_ig_dm_draft` CE tool | Phase A Step A4a/b | Spec'd — must be built |
| `cheerful_send_ig_dm_reply` CE tool | Phase A Step A4c | Spec'd — must be built |
| `cheerful_ig_dm_campaign_summary` CE tool | Phase C daily status | Spec'd — must be built |
| `ig_dm_notify_activity` + `SlackService` block builders | Phase A Step A1 Slack notifications | Spec'd — must be built |
| `IgDmReconciliationWorkflow` (cron, every 30 min) | Phase B window expiry alerts | Spec'd — must be built |
| `ThreadProcessingCoordinatorWorkflow` IG DM branch | AI draft generation | Spec'd — must be built |
| `IG_DM_NOTIFICATION_CHANNEL` env var configured | All Slack notifications | Operational config |
| Brand rep has access to `#mamasitas` Slack channel | Phase A — receiving notifications | Operational |
| External spreadsheet (Google Sheets) for address tracking | Gap 30/31 workaround | Manual setup — not a Cheerful dependency |
