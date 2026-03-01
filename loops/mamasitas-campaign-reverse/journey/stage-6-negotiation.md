# Stage 6: Negotiation

## What Happens

After an interested creator replies "yes" to the Mama Sita's outreach DM (Stage 5), the brand rep moves into a short negotiation phase. The goal is twofold:

1. **Collect the shipping address** (for creators who didn't include it in their first reply)
2. **Communicate content requirements** — what Mama Sita's expects in exchange for the free product

This is not a hard negotiation (no payment, no contracts). It's a friendly clarification loop — the brand confirms what the gift includes, explains what it hopes to see (a post featuring the products), and asks where to ship. Most creators complete this in one additional DM exchange. Some need two.

**Content requirements Mama Sita's communicates at this stage**:

| Requirement | Value |
|------------|-------|
| Products being sent | Mama Sita's Oyster Sauce (350mL) + Sinigang Mix Sampalok (6 sachets) |
| Content type expected | 1 Instagram post (feed post or Reel preferred; Story acceptable as bonus) |
| Required hashtags | `#MamaSitas` (required) + one of `#SinigangRecipe`, `#OysterSauce`, or `#LutongBahay` |
| Required mention | `@mamasitasmanila` in caption or Story tag |
| Timeline | Post within 30 days of receiving products |
| Nature | Gifting — no payment, no contract, no forced post; hope they enjoy and share |

**Concrete example**: @filipinafoodie replied "Hi! I'd love to try your products! Here's my shipping address: Maria Santos, Unit 3B 45 Kalayaan Ave, Quezon City, Metro Manila 1101, Philippines. Excited to cook with Mama Sita's!"

In her case, Stage 6 is a single confirmation DM: "Hi Maria! So excited! We'll send your Oyster Sauce (350mL) + Sinigang Mix Sampalok. When your package arrives, we'd love a post featuring your dish with `#MamaSitas` and tag `@mamasitasmanila` — but no pressure, just enjoy! 🇵🇭 Shipping in 5–7 business days." The address is already collected. Status moves directly to `READY_TO_SHIP`.

**But for @kutsaranimelinda who replied "Uy! Sige naman! Anong address ang ibibigay ko?"** — Stage 6 is a two-leg process: (1) Brand sends address request DM with content brief, (2) Melinda replies with address, (3) Brand sends confirmation DM. Three DMs total; two windows to manage.

**Scale**: Of the ~30–40 creators who responded interested, Stage 6 involves:
- ~20 creators: single-leg (address included in first "yes" reply from Stage 5)
- ~15 creators: two-leg (brand must ask for address; creator replies with it)
- ~5 creators: two-to-three-leg (had product questions before agreeing to provide address)
- Total Cheerful interactions: ~50–60 DM sends for this stage across all interested creators

---

## Cheerful Feature Mapping

| Action | CE Tool / Feature | Status | Source |
|--------|------------------|--------|--------|
| View DM thread to assess negotiation stage | `cheerful_get_ig_dm_thread` | spec'd (not built) | `../../cheerful-ig-dm-spec/analysis/spec/ce-ig-dm-tools.md` §Tool 2 |
| Send address-request + content brief DM | `cheerful_approve_ig_dm_draft` (if AI draft correct) | spec'd (not built) | `../../cheerful-ig-dm-spec/analysis/spec/ce-ig-dm-tools.md` §Tool 4 |
| Send address-request DM (custom, overriding draft) | `cheerful_send_ig_dm_reply` | spec'd (not built) | `../../cheerful-ig-dm-spec/analysis/spec/ce-ig-dm-tools.md` §Tool 3 |
| AI draft: content brief with address request | `ThreadProcessingCoordinatorWorkflow` + LLM draft from `rules_for_llm` / `goal_for_llm` | spec'd — AI uses campaign rules | `../../cheerful-ig-dm-spec/analysis/spec/ingest-workflow.md` §coordinator |
| Send shipment confirmation DM (after address received) | `cheerful_approve_ig_dm_draft` | spec'd (not built) | `../../cheerful-ig-dm-spec/analysis/spec/ce-ig-dm-tools.md` §Tool 4 |
| Read address from DM thread body | `cheerful_get_ig_dm_thread` → `messages[last].body` (manual copy) | workaround (Gap 31) | Gap 31 — no auto-extraction |
| Store shipping address on creator record | `cheerful_update_campaign_creator(gifting_address=...)` | **GAP** | Gap 30/36 — tool not built |
| Update gifting_status: PENDING_DETAILS → READY_TO_SHIP | `cheerful_update_campaign_creator(gifting_status="READY_TO_SHIP")` | **GAP** | Gap 30 — tool not built |
| Update gifting_status: initial → PENDING_DETAILS | `cheerful_update_campaign_creator(gifting_status="PENDING_DETAILS")` | **GAP** | Gap 30 — tool not built |
| Track which creators have confirmed (full negotiation list) | `cheerful_list_campaign_recipients(status=["PENDING_DETAILS", "READY_TO_SHIP"])` | spec'd — gifting_status filter | `../../cheerful-ce-parity-reverse/specs/campaigns.md` §`cheerful_list_campaign_recipients` |
| Track content agreement per creator (hashtags, timeline, mention) | No field | **GAP** | No existing spec — `campaign_creator` has no `content_agreed_at` or `requirements_sent_at` field |
| Get overall confirmation status (how many READY_TO_SHIP) | `cheerful_list_campaign_recipients(status=["READY_TO_SHIP"])` | spec'd — filter by gifting_status | `../../cheerful-ce-parity-reverse/specs/campaigns.md` §Status Enum Values |
| Bulk update status for batch-confirmed creators | No tool | **GAP** | No existing spec — `cheerful_update_campaign_creator` doesn't support `creator_ids[]` bulk |
| Flag window-expiry risk during multi-leg negotiation | `ig_dm_notify_activity(WINDOW_EXPIRING)` via `IgDmReconciliationWorkflow` | spec'd (not built) | `../../cheerful-ig-dm-spec/analysis/spec/ce-ig-dm-notifications.md` §5.4 |

---

## Detailed Flow

### Phase A: Creators Who Provided Address in First Reply (Single-Leg)

~20 creators are like @filipinafoodie — they replied "yes" AND included their address in one message. Stage 5 handled their first reply (brand sent AI draft confirmation). Stage 6 for this group is **complete immediately**: the confirmation DM from Stage 5 IS the negotiation DM — if `rules_for_llm` includes content requirements, the AI draft will have already mentioned hashtags and timeline.

**Critical dependency**: The AI draft at Stage 5 Step A4a must include the content requirements. This requires the campaign config to have `rules_for_llm` and `goal_for_llm` filled with the negotiation brief.

**Campaign config must include** (set during campaign setup, Stage 1):
```
rules_for_llm: "When confirming receipt of a creator's shipping address, always include:
(1) what products they'll receive (Oyster Sauce 350mL + Sinigang Mix Sampalok 6 sachets),
(2) content expectation: we hope you'll share a post with #MamaSitas and tag @mamasitasmanila
when you cook with the products — no pressure, just enjoy!,
(3) shipping timeline: 3-7 business days for Metro Manila / 7-14 days for provincial."

goal_for_llm: "Get the creator excited about receiving Mama Sita's products and gently
set expectations for a social media post featuring the products."
```

With this config, the AI draft at Stage 5 Step A4a already covers the negotiation. These creators move directly to `READY_TO_SHIP` — but **only if** the brand rep can update `gifting_status` (Gap 30).

**Workaround** (Gap 30): Brand rep manually records in Google Sheets:
```
| Handle            | Address Received | Status         | Products      |
| @filipinafoodie   | ✓ (Unit 3B, QC) | READY_TO_SHIP  | Oyster+Sinig  |
```

### Phase B: Creators Who Said "Yes" But No Address (Two-Leg)

~15 creators replied interested but didn't include an address (e.g., @kutsaranimelinda replied "Uy! Sige naman! Anong address ang ibibigay ko?"). Stage 6 has two legs for this group.

#### Leg B1 — Send Address-Request DM with Content Brief

The inbound "yes" from Stage 5 triggers an AI draft. The AI draft should be: "Amazing, Melinda! 🎉 We'll be sending you our Oyster Sauce (350mL) + Sinigang Mix Sampalok (6 sachets) to try in your kitchen! We just ask that when you cook with them, share a post with `#MamaSitas` and tag `@mamasitasmanila` — we'd love to see your creation! 🇵🇭 Could you share your full shipping address? (Name, street address, barangay, city, province, postal code)"

This AI draft fires automatically from `ThreadProcessingCoordinatorWorkflow`. Brand rep approves:

```
User → Slack: "Show me pending DMs in Mama Sita's campaign"
CE: cheerful_list_ig_dm_threads(
    campaign_id="campaign-uuid-mamasitas",
    status="PENDING",
    limit=50
)
→ Shows 15 threads in PENDING state (creators who said yes, awaiting address-request DM)
```

```
User → Slack: "Approve IG DM draft: 17841200000222333"
CE: cheerful_approve_ig_dm_draft(
    ig_conversation_id="17841200000222333",
    edited_text=None  # or with edit if AI missed something
)
→ Sends: "Amazing, Melinda! 🎉 We'll be sending you our Oyster Sauce..."
→ Window now at WAITING_FOR_INBOUND — Melinda has 24h to reply with address
```

**Brand rep routine**: Approve all 15 address-request drafts in one Slack session. Takes ~10 minutes (15 × 40-second cycles of review + approve).

**Gap 36 flag**: After approving, brand rep should also update @kutsaranimelinda's gifting_status to `PENDING_DETAILS` to indicate "address requested, awaiting". Without `cheerful_update_campaign_creator`, this cannot be done via CE. The brand rep notes this in the Google Sheets tracker.

#### Leg B2 — Receive Address Reply

When Melinda replies: "Melinda Cruz, 12 Maharlika St, Pasig City, Metro Manila 1600 Philippines", Meta webhook fires → `IgDmIngestWorkflow` → new `ig_dm_thread_state` with fresh 24h window → AI draft generated:

```
AI draft: "Perfect, Melinda! Got your address ✅ We'll ship your Mama Sita's gift pack
(Oyster Sauce + Sinigang Mix Sampalok) to Pasig City in 3-7 business days.
Can't wait to see what you cook! 🇵🇭 #MamaSitas @mamasitasmanila"
```

```
User → Slack: [gets notification: new DM + AI draft ready for @kutsaranimelinda]
"Get IG DM thread: 17841200000222333"
CE: cheerful_get_ig_dm_thread(ig_conversation_id="17841200000222333")
→ Shows full conversation: outbound address-request + inbound address reply + pending draft

[brand rep reads address from messages[last].body → copies to Google Sheets]
[brand rep reviews AI draft — looks good]

"Approve IG DM draft: 17841200000222333"
CE: cheerful_approve_ig_dm_draft(
    ig_conversation_id="17841200000222333",
    edited_text=None
)
→ Sends shipment confirmation + content brief
→ Melinda's negotiation complete
```

**Address copy step (manual, Gap 31)**: Brand rep reads the address from the DM thread body and pastes it into the Google Sheets shipping table. With Gap 31 fixed (`cheerful_extract_address_from_ig_dm`), this would be automated: the tool would parse the address and store it to `campaign_creator.gifting_address`.

### Phase C: Creators With Product Questions (Two-to-Three Leg)

~5 creators had questions first (e.g., @pinoyrecipes2026 "Anong products ang ipapadala?"). After Stage 5 answered the product question ("1 bottle Oyster Sauce 350mL + 1 pack Sinigang Mix Sampalok"), the creator agrees and NOW needs to provide address — triggering the same two-leg flow as Phase B but with one more leg already completed.

These conversations are the most complex. The AI draft at each leg must draw from:
- `rules_for_llm` — content requirements
- `frequently_asked_questions_for_llm` — product specs ("Q: What size? A: Oyster Sauce 350mL. Q: How many sachets? A: 6 sachets in a pack.")
- Earlier conversation context (the LLM has access to the thread messages)

Cheerful's `ThreadProcessingCoordinatorWorkflow` passes the full thread history to the LLM when generating each draft. This means the AI draft for leg 3 ("please provide your address") doesn't repeat product specs already answered in leg 2 — it contextually picks up where the conversation left off.

**This is a "wow moment"**: The AI draft is conversation-aware. Compared to managing 5 separate multi-leg WhatsApp threads manually, Cheerful's AI draft system delivers consistently on-brand, contextually appropriate replies to 5 creators simultaneously with one approve-per-leg in Slack.

### Phase D: Status Check — Who Has Confirmed?

At any point during the negotiation phase, the brand rep checks overall progress:

```
User → Slack: "How many Mama Sita's creators have confirmed their address?"
CE: cheerful_list_campaign_recipients(
    campaign_id="campaign-uuid-mamasitas",
    status=["READY_TO_SHIP", "PENDING_DETAILS"],
    limit=100,
    include_all_contacts=true
)
```

**Expected response (Day 10 of campaign, negotiation phase mid-progress)**:

```xml
<campaign-recipients total="62">
  <status-summary>
    <count status="READY_TO_SHIP">22</count>   <!-- address collected, confirmed -->
    <count status="PENDING_DETAILS">8</count>  <!-- waiting for address reply -->
    <count status="CONTACTED">20</count>       <!-- DM'd, haven't replied yet -->
    <count status="UNRESPONSIVE">7</count>     <!-- no reply after follow-up -->
    <count status="DECLINED">5</count>         <!-- politely declined -->
  </status-summary>
  ...
</campaign-recipients>
```

**Critical gap**: This status distribution only reflects reality IF `cheerful_update_campaign_creator` has been called to update each creator's gifting_status. Without that tool, all creators remain in their default state (`CONTACTED` from Stage 4) regardless of negotiation progress. The status check becomes meaningless without Gap 30 resolved.

---

## CE Tool Calls (Exact)

### `cheerful_list_ig_dm_threads` — identify pending negotiations

```
Parameters:
  campaign_id: "campaign-uuid-mamasitas"
  status: "PENDING"
  window_open: true
  limit: 50

What user does: Reviews which threads need the address-request DM approved (Leg B1)
   vs. which threads have received address replies (Leg B2)
Key distinction: look at snippet — if snippet mentions an address, it's Leg B2;
   if snippet is "Sige naman!" / "Yes!", it's Leg B1
```

### `cheerful_get_ig_dm_thread` — read conversation + copy address

```
Parameters:
  ig_conversation_id: "17841200000222333"  # kutsaranimelinda

Key fields used:
  messages[*].body: full conversation to determine negotiation stage
  messages[last].body: where the address will be (Leg B2)
  ai_draft.draft_text: proposed confirmation/address-request DM

What user does:
  1. Read last inbound message — is it an address? A question? A yes?
  2. If address: COPY the address text, paste to shipping spreadsheet
  3. Review AI draft — does it correctly confirm the address and set expectations?
  4. Approve, edit, or write custom reply
```

### `cheerful_approve_ig_dm_draft` — send negotiation DM

```
# Leg B1: address-request with content brief
Parameters:
  ig_conversation_id: "17841200000222333"
  edited_text: None  # if AI draft includes address request + content brief correctly
  -- OR --
  edited_text: "Hi Melinda! So excited! 🎉 We'll send you Oyster Sauce (350mL)
                + Sinigang Mix Sampalok (6 sachets). When you cook with them,
                we'd love a post with #MamaSitas and tag @mamasitasmanila 🇵🇭
                Could you share your shipping address? (Name, street, barangay, city, province, ZIP)"

# Leg B2: shipment confirmation after address received
Parameters:
  ig_conversation_id: "17841200000222333"
  edited_text: None  # AI draft correctly confirms address and sets expectations
```

### `cheerful_send_ig_dm_reply` — custom negotiation DM (bypass draft)

```
# Used when AI draft misses the content brief or includes wrong product details
Parameters:
  ig_conversation_id: "17841200000555666"
  message_text: "Hi Jo! 🎉 We'll send you 1 Oyster Sauce (350mL) + 1 Sinigang Mix
                Sampalok (6 sachets). When you cook with them, share a post with
                #MamaSitas + #SinigangRecipe and tag @mamasitasmanila — we'd love
                to see your creation! 🇵🇭 What's your shipping address?
                (Name, complete address with postal code)"

Key constraint: 1000 characters — the above is ~370 chars, well within limit
```

### `cheerful_list_campaign_recipients` — negotiation progress check

```
Parameters:
  campaign_id: "campaign-uuid-mamasitas"
  status: ["PENDING_DETAILS", "READY_TO_SHIP", "CONTACTED", "DECLINED"]
  include_all_contacts: true
  limit: 100
  sort_by: "created_at"

Key fields monitored:
  gifting_status: current pipeline stage per creator
  gifting_address: populated = address received (if Gap 30 fixed)
  name, social_media_handles: identify which creator each row is

LIMITATION (Gap 30): All creators show CONTACTED unless brand rep has manually
  updated each via cheerful_update_campaign_creator — which doesn't exist yet.
  Without this tool, this query is unreliable for negotiation tracking.
```

### `cheerful_update_campaign_creator` — update status + address [GAP]

```
# Does NOT exist yet. This is what needs to be built.
# Expected signature (designed for this stage):

Parameters:
  campaign_id: "campaign-uuid-mamasitas"
  creator_id: "creator-uuid-001"  # @filipinafoodie
  gifting_status: "READY_TO_SHIP"
  gifting_address: "Maria Santos, Unit 3B 45 Kalayaan Ave, Quezon City, Metro Manila 1101, Philippines"

Parameters:
  campaign_id: "campaign-uuid-mamasitas"
  creator_id: "creator-uuid-002"  # @kutsaranimelinda
  gifting_status: "PENDING_DETAILS"  # address requested, not yet received
  gifting_address: null  # not yet

# After address received:
Parameters:
  campaign_id: "campaign-uuid-mamasitas"
  creator_id: "creator-uuid-002"
  gifting_status: "READY_TO_SHIP"
  gifting_address: "Melinda Cruz, 12 Maharlika St, Pasig City, Metro Manila 1600 Philippines"

# Maps to: PATCH /api/service/campaigns/{campaign_id}/creators/{creator_id}
# Fields: gifting_status, gifting_address, notes (optional)
```

---

## IG-Specific Considerations

### Multi-Leg Conversations and the 24h Window

Stage 6 is uniquely exposed to the 24h window constraint because it involves multi-leg conversations (2–3 rounds of DM exchange per creator). Each inbound DM from the creator resets the window, so the risk compounds:

```
Day 8, 10:00 AM  → @kutsaranimelinda replies "Sige naman! Anong address?"
Day 8, 10:05 AM  → AI draft ready (address-request + content brief)
Day 8, 11:00 AM  → Brand approves → sends address-request DM → window set to WAITING_FOR_INBOUND

Day 9, 2:00 PM   → @kutsaranimelinda replies with her address (28h after brand's DM)
                   ↳ Window resets: new window_expires_at = Day 10, 2:00 PM
Day 9, 2:03 PM   → AI draft ready (shipment confirmation)
Day 9, 3:00 PM   → Brand approves → sends confirmation DM → negotiation complete ✓
```

Timing is favorable here: Melinda's 28-hour gap between her "yes" and her address reply doesn't cause a problem because the window only matters for the BRAND's reply — and the brand approved the address-request DM within 1 hour of Melinda's first "yes". When Melinda provides her address on Day 9, a fresh 24h window opens for the brand to send the confirmation DM.

**Risk scenario**: @kutsaranimelinda provides her address on Day 8 at 11:55 PM. The brand rep is asleep. Window expires Day 9 at 11:55 PM. If brand doesn't respond by Day 9 at 11:55 PM, the window closes. The `IgDmReconciliationWorkflow` alerts at < 2h remaining (9:55 PM). Brand rep must respond that evening or lose the window.

**Mitigation**: The `HUMAN_AGENT` tag (7-day window, not in MVP per Gap 32) would eliminate this risk entirely for the confirmation DM. With HUMAN_AGENT, a multi-leg negotiation could safely span days without the 24h pressure.

### Content Brief Length Constraint

The negotiation DM must fit within Meta's 1,000 character limit. The full content brief (products, hashtags, timeline) + address request can approach this limit:

```
"Hi Melinda! So excited! 🎉 We'll send you Mama Sita's Oyster Sauce (350mL) +
Sinigang Mix Sampalok (6 sachets) to try in your kitchen! 🇵🇭

When you cook with them, we'd love it if you shared a post on Instagram with:
📌 #MamaSitas (required)
📌 One of: #SinigangRecipe, #OysterSauce, or #LutongBahay
📌 Tag us: @mamasitasmanila

No pressure — just enjoy the products! If you do post, within 30 days of receiving works great.

Could you share your shipping address? (Name, street, barangay, city, province, postal code)"
```

Character count: ~560 characters — safely under 1,000. The AI draft must be configured to keep replies concise.

### IGSID Resolution During Multi-Leg Conversations

Creators who send multiple messages in the same conversation thread use the same `ig_conversation_id`. IGSID resolution (from Stage 4 / Stage 5) is a one-time operation — once @kutsaranimelinda's IGSID is resolved to her creator record, all subsequent messages in the same thread are automatically associated. No re-resolution needed for Legs B1, B2, B3.

This means the `ThreadProcessingCoordinatorWorkflow` has full context for multi-leg conversations: it sees all prior messages in the thread and the creator's campaign record.

---

## Gaps & Workarounds

| # | Gap | Impact | Workaround | Build Priority |
|---|-----|--------|------------|----------------|
| 30 | `cheerful_update_campaign_creator` not built — cannot update `gifting_status` (PENDING_DETAILS → READY_TO_SHIP) per creator in Cheerful | Campaign status dashboard shows all ~30 interested creators as `CONTACTED` forever; shipping export (Stage 7) cannot be generated from Cheerful | Google Sheets: manual columns for gifting_status, address_received (Y/N), address_text, confirmed_date | P0 — blocks automated pipeline tracking; shipping export (Stage 7) cannot be built without this |
| 36 | `cheerful_update_campaign_creator` not built — cannot store `gifting_address` from DM thread on creator record | Shipping addresses exist only in conversation threads and Google Sheets; export (Stage 7) must use Sheets not Cheerful | Brand rep copies address from `cheerful_get_ig_dm_thread` → messages[last].body → pastes to Google Sheets shipping table | P0 — same tool as Gap 30; `gifting_address` field EXISTS in `campaign_creator` schema (verified: `cheerful_list_campaign_recipients` returns it) but no write path |
| 37 | No content agreement tracking field on `campaign_creator` — no `requirements_sent_at`, `hashtags_agreed_at`, or `content_brief_accepted` boolean | Cannot verify at Stage 8 (content tracking) whether a creator was formally briefed on requirements; cannot distinguish "received product but not briefed" from "fully briefed and agreed" | Brand rep adds a "Briefed (Y/N)" column to Google Sheets; assumes all creators who received the confirmation DM were briefed | P2 — operational assurance; content tracking in Stage 8 is based on actual post verification, not agreement record |
| 38 | No bulk `cheerful_update_campaign_creator` — if Gap 30 is built as single-creator tool, updating 22 READY_TO_SHIP creators after a batch day = 22 CE tool calls | Tedious; on Day 10 when 22 addresses are all received, running 22 updates in Slack takes significant time | Accept one-by-one; run in end-of-day batch using `cheerful_list_ig_dm_threads` to identify all resolved conversations; update 5–10 at a time | P1 — once Gap 30 exists, add `creator_ids[]` array + `gifting_status` to support bulk updates; same pattern as Gap 28 (bulk mark_dm_sent) |
| 31 | No address extraction from DM text (already documented in Stage 5 gap matrix) — brand rep must manually copy address from `cheerful_get_ig_dm_thread` response | Manually copying 30+ addresses from Slack messages to Google Sheets is error-prone and time-consuming; typos in address = failed delivery | Read `messages[last].body` from thread → copy → paste to Google Sheets shipping table | P0 — primary data collection goal of Stage 6; `cheerful_extract_address_from_ig_dm` tool (Gap 31 from Stage 5) would auto-parse + store to `campaign_creator.gifting_address` |

---

## Success Criteria

At the end of Stage 6, "100% hero journey" means:

1. **All interested creators briefed**: Every creator who said "yes" (all ~30–35) has received the content brief DM — products confirmed, hashtags communicated, `@mamasitasmanila` mention requested, 30-day timeline set
2. **All addresses collected**: 30+ shipping addresses collected and recorded (target: match the number of interested creators from Stage 5). Stored in Google Sheets (workaround) or `campaign_creator.gifting_address` (if Gap 30/36 resolved)
3. **Status correctly reflects reality**: `cheerful_list_campaign_recipients` shows 30+ creators as `READY_TO_SHIP` (requires Gap 30 resolved; if not, Google Sheets is the source of truth)
4. **No missed windows**: 0 multi-leg negotiation conversations expired mid-flow (brand rep responded to all address replies within 24h)
5. **5+ creators enrolled as content-briefed**: Even if Google Sheets is the address tracker, at least an informal record exists of which creators agreed to the content expectations
6. **AI draft accuracy**: At least 80% of negotiation drafts approved as-is (AI draft correctly includes content brief and address request each time)

**Measurable target by Day 12**:
- 22+ single-leg confirmations complete (address in first reply)
- 10+ two-leg negotiations complete (address collected in second reply)
- Total: 32+ creators with `READY_TO_SHIP` status (in Cheerful if Gap 30 resolved; in Sheets if not)
- Google Sheets has 32+ rows with full address data ready for Stage 7 (shipping export)

---

## Dependencies

| Dependency | Required By | Status |
|-----------|------------|--------|
| Stage 5 complete: ~30–35 interested creators identified, first "yes" reply received by brand | Phase A, B, C — all negotiation starts from Stage 5 interest | Spec'd — must be built |
| `cheerful_get_ig_dm_thread` CE tool | Phase B Leg B2 — reading address from thread | Spec'd — must be built |
| `cheerful_approve_ig_dm_draft` CE tool | Phase B Legs B1 + B2 — all negotiation DM sends | Spec'd — must be built |
| `cheerful_send_ig_dm_reply` CE tool | Phase B + C — custom reply when AI draft wrong | Spec'd — must be built |
| `ThreadProcessingCoordinatorWorkflow` with `rules_for_llm` context | AI draft includes content brief automatically | Spec'd — must be built |
| Campaign config: `rules_for_llm`, `goal_for_llm`, `frequently_asked_questions_for_llm` populated | AI draft accuracy for content brief DMs | Operational — set in Stage 1 |
| `IgDmReconciliationWorkflow` (cron, 30 min) | Window expiry alerts during multi-leg conversations | Spec'd — must be built |
| Google Sheets shipping tracker (external) | Gap 30/31 workaround — address storage | Manual setup — not a Cheerful dependency |
| `cheerful_update_campaign_creator` CE tool (Gap 30) | gifting_status updates + gifting_address storage | **GAP — not built** — Stage 7 (shipping export) is severely degraded without this |
