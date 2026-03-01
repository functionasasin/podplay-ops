# Stage 7: Shipping Export

## What Happens

After Stage 6 (Negotiation), Mama Sita's has ~32 creators who:
- Replied "yes" to the gifting offer
- Confirmed their shipping address via IG DM
- Were briefed on content requirements (hashtags, timeline, @mention)

Now the brand rep needs to physically ship the products. This requires a **shipping manifest** — a structured list of every opted-in creator with their full shipping address and the products to include. This manifest is handed to whoever fulfills the shipment (in Mama Sita's case, either an in-house logistics team or a third-party fulfillment partner in the Philippines).

**Products in every package**:

| Product | SKU/Variant | Quantity |
|---------|------------|----------|
| Mama Sita's Oyster Sauce | 350mL bottle | 1 |
| Mama Sita's Sinigang Mix Sampalok | 6-sachet pack | 1 |

All creators receive the same bundle. No per-creator product customization.

**Concrete example — shipping manifest row**:
```
@filipinafoodie  |  Maria Santos  |  Unit 3B 45 Kalayaan Ave, Quezon City, Metro Manila 1101 PH  |  Oyster Sauce (350mL) × 1 + Sinigang Mix (6-pk) × 1
@kutsaranimelinda  |  Melinda Cruz  |  12 Maharlika St, Pasig City, Metro Manila 1600 PH  |  Oyster Sauce (350mL) × 1 + Sinigang Mix (6-pk) × 1
@pinoyrecipes2026  |  Jo Reyes  |  87 Mabini St, Barangay Poblacion, Makati City 1210 PH  |  Oyster Sauce (350mL) × 1 + Sinigang Mix (6-pk) × 1
... × 29 more rows
```

**After shipping**, the brand rep:
1. Marks each creator as `ORDERED` (dispatched) in Cheerful (requires Gap 30 resolved)
2. Optionally records tracking numbers (Gap 40 — no field in Cheerful for this)
3. Optionally sends a shipping notification DM to each creator via Stage 6's DM flow

**Two paths depending on whether Gap 30/36 is resolved**:

| Path | Gap 30/36 | Address Source | Status Tracking |
|------|----------|----------------|-----------------|
| **Happy path** | Resolved | `campaign_creator.gifting_address` in Cheerful | Cheerful: READY_TO_SHIP → ORDERED |
| **Workaround path** | Not resolved | Google Sheets (manual, Stage 6 workaround) | Google Sheets: "Shipped (Y/N)" column |

**Scale**: ~32 addresses exported in one operation. Products shipped to Philippines domestic addresses (Metro Manila majority, some provincial). Timeline: products dispatched by Day 16 of campaign (4 days after Stage 6 closes).

---

## Cheerful Feature Mapping

| Action | CE Tool / Feature | Status | Source |
|--------|------------------|--------|--------|
| Query all READY_TO_SHIP creators with addresses | `cheerful_list_campaign_recipients(status=["READY_TO_SHIP"], has_address=true)` | spec'd (not built) | `../../cheerful-ce-parity-reverse/specs/campaigns.md` §`cheerful_list_campaign_recipients` |
| Get full creator detail (name, handle, address) | `cheerful_list_campaign_recipients` — all fields in one response | spec'd (not built) | `../../cheerful-ce-parity-reverse/specs/campaigns.md` — return schema: `gifting_address`, `social_media_handles`, `name` |
| Filter to address-confirmed creators only | `has_address=true` param on `cheerful_list_campaign_recipients` | spec'd (not built) | `../../cheerful-ce-parity-reverse/specs/campaigns.md` §Parameters |
| Format creator list as shipping manifest | CE agent formats JSON response as Slack table | CE agent behavior | No dedicated tool — agent-rendered output |
| Export manifest to CSV / Google Sheets | **GAP** — no export CE tool | gap | Gap 39 — `cheerful_list_campaign_recipients` returns JSON only |
| Assign product bundle to creator | Campaign-level: products set at campaign creation (product_ids) | exists (campaign-level only) | `../../cheerful-ce-parity-reverse/specs/campaigns.md` §`product_ids` |
| Per-creator product variant assignment | **GAP** — no per-creator product field | gap | Gap 42 — all creators get campaign default product bundle |
| Mark creator as shipped (ORDERED status) | `cheerful_update_campaign_creator(gifting_status="ORDERED")` | **GAP** | Gap 30 — tool not built; `ORDERED` status value EXISTS in enum |
| Bulk mark 32 creators as ORDERED | **GAP** — no bulk update tool | gap | Gap 30 + Gap 38 — single-creator update prerequisite |
| Record shipping tracking number per creator | **GAP** — no tracking number field on `campaign_creator` | gap | Gap 40 — new gap discovered at Stage 7 |
| Send shipping notification DM to creator | `cheerful_send_ig_dm_reply` (if 24h window open) | spec'd (not built) | `../../cheerful-ig-dm-spec/analysis/spec/ce-ig-dm-tools.md` §Tool 3 |
| Track who has received packages (DELIVERED) | **GAP** — no DELIVERED gifting status | gap | Gap 41 — `ORDERED` is terminal; no DELIVERED/RECEIVED state |

---

## Detailed Flow

### Phase A: Pull the Shipping Manifest (Happy Path — Gap 30/36 Resolved)

The brand rep queries the campaign for all opted-in creators with confirmed addresses. This is a single CE call that returns everything needed for the manifest.

```
User → Slack: "Give me the shipping manifest for Mama Sita's campaign"
CE: cheerful_list_campaign_recipients(
    campaign_id="campaign-uuid-mamasitas",
    status=["READY_TO_SHIP"],
    has_address=true,
    include_all_contacts=true,
    sort_by="name",
    sort_dir="asc",
    limit=100
)
→ Returns 32 rows (if Gap 30/36 resolved — addresses stored in Cheerful)
```

**Expected response (2 example rows)**:
```json
{
  "rows": [
    {
      "name": "Maria Santos",
      "social_media_handles": [{"platform": "instagram", "handle": "filipinafoodie"}],
      "gifting_address": "Maria Santos, Unit 3B 45 Kalayaan Ave, Quezon City, Metro Manila 1101, Philippines",
      "gifting_status": "READY_TO_SHIP",
      "gifting_discount_code": null,
      "email": null
    },
    {
      "name": "Melinda Cruz",
      "social_media_handles": [{"platform": "instagram", "handle": "kutsaranimelinda"}],
      "gifting_address": "Melinda Cruz, 12 Maharlika St, Pasig City, Metro Manila 1600 Philippines",
      "gifting_status": "READY_TO_SHIP",
      "gifting_discount_code": null,
      "email": "melinda@example.com"
    }
    // ... 30 more rows
  ],
  "total": 32
}
```

**CE agent formats this as Slack table**:
```
Shipping manifest: *32 creators ready to ship*

| Handle            | Name           | Address                              |
|-------------------|----------------|--------------------------------------|
| @filipinafoodie   | Maria Santos   | Unit 3B 45 Kalayaan Ave, QC 1101     |
| @kutsaranimelinda | Melinda Cruz   | 12 Maharlika St, Pasig City 1600     |
| @pinoyrecipes2026 | Jo Reyes       | 87 Mabini St, Makati City 1210       |
... (32 rows total)

All packages: Oyster Sauce (350mL) × 1 + Sinigang Mix (6-pk) × 1
```

**Brand rep action**: Copies Slack table → pastes to Google Sheets → sends to logistics team.

**Gap 39 friction**: No direct "export to CSV" or "write to Google Sheets" CE tool. The brand rep manually copies the Slack table. With 32 rows this takes ~3 minutes. At 200+ creators, this would be a significant bottleneck.

---

### Phase B: Pull Shipping Manifest (Workaround Path — Gap 30/36 NOT Resolved)

Without `cheerful_update_campaign_creator`, no addresses are stored in Cheerful. The `has_address=true` filter returns 0 results. The brand rep falls back to the Google Sheets tracker built in Stage 6.

```
User → Slack: "How many creators are ready to ship in Mama Sita's campaign?"
CE: cheerful_list_campaign_recipients(
    campaign_id="campaign-uuid-mamasitas",
    include_all_contacts=true,
    status=["CONTACTED"],   ← all creators look like CONTACTED (status not updated)
    limit=100
)
→ Returns all 62 creators with status=CONTACTED (no meaningful segmentation)
```

**Workaround**: CE output is useless for manifest generation. Brand rep opens the Stage 6 Google Sheets tracker instead:

| IG Handle | Creator Name | Address | Status |
|-----------|-------------|---------|--------|
| @filipinafoodie | Maria Santos | Unit 3B, 45 Kalayaan Ave, QC 1101 | READY |
| @kutsaranimelinda | Melinda Cruz | 12 Maharlika St, Pasig City 1600 | READY |
| ... | ... | ... | ... |

The Google Sheets tracker IS the shipping manifest. Cheerful is bypassed entirely for this phase.

**Impact**: The primary value of Cheerful (single source of truth, at-a-glance status) is lost. Brand rep maintains two systems simultaneously.

---

### Phase C: Products Dispatched — Status Update

After shipping, brand rep updates each creator's status from `READY_TO_SHIP` to `ORDERED` (the "dispatched" status in the gifting pipeline).

**With Gap 30 resolved (single-creator update)**:
```
User → Slack: "Mark @filipinafoodie as shipped in Mama Sita's campaign"
CE: cheerful_update_campaign_creator(
    campaign_id="campaign-uuid-mamasitas",
    creator_id="creator-uuid-001",
    gifting_status="ORDERED"
)
→ @filipinafoodie: READY_TO_SHIP → ORDERED ✓
```

Running this for 32 creators = 32 sequential Slack interactions. At ~30 seconds each, ~16 minutes.

**With Gap 38 also resolved (bulk update)**:
```
User → Slack: "Mark all READY_TO_SHIP creators as shipped in Mama Sita's campaign"
CE: cheerful_update_campaign_creator(
    campaign_id="campaign-uuid-mamasitas",
    creator_ids=["uuid-001", "uuid-002", ..., "uuid-032"],   ← all 32 at once
    gifting_status="ORDERED"
)
→ 32 creators: READY_TO_SHIP → ORDERED ✓ (single operation)
```

This is the ideal flow: one command dispatches the status update for all shipped creators.

**Without Gap 30**: Status never updates. All creators remain `CONTACTED` or `READY_TO_SHIP` forever in Cheerful. Post-shipping tracking (Stage 8: Content Tracking) cannot distinguish between "product shipped, awaiting content" vs. "still in negotiation."

---

### Phase D: Status Verification

After marking all creators as ORDERED, brand rep verifies the campaign state:

```
User → Slack: "Show me Mama Sita's campaign shipping summary"
CE: cheerful_list_campaign_recipients(
    campaign_id="campaign-uuid-mamasitas",
    include_all_contacts=true,
    limit=100
)
```

**Expected distribution (Day 17, all packages dispatched, Gap 30 resolved)**:
```xml
<campaign-summary campaign="Mama Sita's Gifting 2026">
  <status-counts total="62">
    <count status="ORDERED">32</count>     <!-- shipped -->
    <count status="DECLINED">12</count>    <!-- not interested -->
    <count status="UNRESPONSIVE">10</count><!-- no reply at all -->
    <count status="CONTACTED">8</count>   <!-- replied but fell off -->
  </status-counts>
  <shipping-progress>
    <shipped>32</shipped>
    <pending>0</pending>
    <target>50+</target>
    <note>Consider second outreach wave to reach 50+ target (see Stage 4)</note>
  </shipping-progress>
</campaign-summary>
```

---

### Phase E: Optional — Shipping Notification DM

After packages are dispatched, a brief "your package is on its way!" DM to creators is a high-engagement touch that:
1. Re-opens the IG DM conversation window (creator may not have messaged since Stage 6)
2. Creates excitement — reminds creators to watch for delivery
3. Gently anchors the 30-day posting window ("you should have it in 5-7 days!")

**However**: Sending this DM via Cheerful's IG DM tools requires an open 24h window. In most cases, the Stage 6 conversation window closed days ago. The brand rep CANNOT send a proactive notification without either:
- The creator sending a fresh inbound DM (re-opens window)
- The `HUMAN_AGENT` tag (7-day window, Gap 32 — not in MVP)

**Workaround**: Brand rep sends the shipping notification manually from Instagram app. Cheerful cannot facilitate this.

**Shipping notification DM text** (sent from IG app):
```
Hi [Name]! 🎉 Your Mama Sita's gift pack is on its way — Oyster Sauce (350mL)
+ Sinigang Mix Sampalok should arrive in 5-7 days (Metro Manila) or 7-14 days
(provincial). Can't wait to see what you cook! 🇵🇭
```
Character count: ~230 — well within 1,000 limit.

---

## CE Tool Calls (Exact)

### `cheerful_list_campaign_recipients` — pull shipping manifest

```
Parameters:
  campaign_id: "campaign-uuid-mamasitas"
  status: ["READY_TO_SHIP"]
  has_address: true
  include_all_contacts: true
  sort_by: "name"
  sort_dir: "asc"
  limit: 100          ← captures all 32; set to 100 to be safe

Expected response shape:
  rows[*].name:                       Creator display name (from enrichment)
  rows[*].social_media_handles[0]:    {platform: "instagram", handle: "filipinafoodie"}
  rows[*].gifting_address:            Full shipping address string
  rows[*].gifting_status:             "READY_TO_SHIP"
  rows[*].gifting_discount_code:      null (no discount codes in this campaign)
  total: 32

What user does:
  1. CE agent renders as formatted Slack table
  2. Brand rep copies table → Google Sheets "Shipping Manifest" tab
  3. Adds column: "Products" (same for all: "OS 350mL + SM 6pk")
  4. Sends Google Sheets link to logistics team
```

### `cheerful_update_campaign_creator` — mark as ORDERED [GAP 30]

```
# Per-creator call — run once per creator after package dispatched
Parameters:
  campaign_id: "campaign-uuid-mamasitas"
  creator_id: "creator-uuid-001"   # @filipinafoodie
  gifting_status: "ORDERED"

Expected response:
  gifting_status: "ORDERED"
  updated_at: "2026-03-17T..."

# After bulk resolution (Gap 38):
Parameters:
  campaign_id: "campaign-uuid-mamasitas"
  creator_ids: ["uuid-001", "uuid-002", ..., "uuid-032"]   # all 32 at once
  gifting_status: "ORDERED"
```

### `cheerful_list_campaign_recipients` — post-shipping verification

```
Parameters:
  campaign_id: "campaign-uuid-mamasitas"
  include_all_contacts: true
  limit: 100

What user does:
  Verify all 32 shipped creators show "ORDERED"
  Confirm counts: ORDERED: 32, DECLINED: 12, UNRESPONSIVE: 10, CONTACTED: 8
  Flag if any show unexpected status (e.g., READY_TO_SHIP remaining = not yet shipped)
```

---

## IG-Specific Considerations

### Shipping Notification DM and the 24h Window

The 24h window closes shortly after Stage 6 ends (when the brand sends the shipment confirmation DM). By Stage 7 (2+ days later), all windows are closed. This means Cheerful's IG DM tools **cannot** be used for shipping notifications.

**Timeline**:
```
Day 12  → @kutsaranimelinda's final negotiation DM sent (Stage 6, Leg B2 confirmation)
         → Window: WAITING_FOR_INBOUND (24h from brand's send)
Day 13  → Window expires (Melinda didn't reply after confirmation)
         → Status: WINDOW_CLOSED in ig_dm_thread_state

Day 16  → Products dispatched; brand wants to send "on its way!" DM
         → cheerful_send_ig_dm_reply: FAILS — window closed
         → Must use Instagram app manually
```

**Exception**: If any creator replied after the Stage 6 confirmation DM (e.g., "Thanks so much! Can't wait!" on Day 14), the window resets and Cheerful CAN send the shipping notification. Typically ~5 of 32 creators will have done this — the other 27 require manual IG app messages.

### No Inbound Webhook for Delivery Confirmation

When a creator receives and opens their package, there is no IG webhook or API event. Cheerful cannot detect package receipt. The only signal is when the creator posts content (Stage 8: Content Tracking, Stage 9: UGC Capture).

**This creates a tracking gap between Stage 7 (shipped) and Stage 8 (posted)**: Cheerful can show 32 creators as `ORDERED`, but has no way to distinguish "package delivered, creator hasn't posted yet" from "package lost in transit." Brand rep must track delivery status externally (via shipping carrier tracking numbers — also not stored in Cheerful, Gap 40).

---

## Gaps & Workarounds

| # | Gap | Impact | Workaround | Build Priority |
|---|-----|--------|------------|----------------|
| 30 | `cheerful_update_campaign_creator` not built — cannot set `gifting_status="ORDERED"` after shipping | All creators remain `READY_TO_SHIP` in Cheerful after packages dispatched; Stage 8 (Content Tracking) cannot distinguish "shipped, awaiting post" from "still in negotiation" | Google Sheets: add "Shipped (Y/N)" + "Ship Date" columns; Stage 8 uses this as the baseline for "creator has received product" | P0 — same tool as Gap 30/36; resolving Gap 30 unblocks Stages 7, 8, and 9 together |
| 36 | `cheerful_update_campaign_creator` not built — `gifting_address` not stored in Cheerful | `cheerful_list_campaign_recipients(has_address=true)` returns 0 rows; Cheerful cannot produce the shipping manifest; Stage 7 requires external Sheets workaround | Google Sheets shipping tracker (built in Stage 6) is the address source; CE generates creator list, Sheets provides addresses | P0 — same tool as Gap 30; the `gifting_address` field EXISTS in schema, needs write path |
| 38 | No bulk `cheerful_update_campaign_creator` — marking 32 creators as ORDERED = 32 sequential CE calls | ~16 minutes of Slack interactions at end of Stage 7 to update all shipping statuses; tedious and error-prone | Accept sequential updates; batch at end of shipping day; do 10-15 at a time | P1 — once Gap 30 exists, add `creator_ids[]` array to support bulk update; resolves in same PR as Gap 30 |
| 39 | No CSV/sheet export CE tool — `cheerful_list_campaign_recipients` returns JSON; no `cheerful_export_shipping_manifest` tool | Brand rep must manually copy CE's formatted Slack table to Google Sheets; at 32 creators takes ~3 minutes; at 200+ creators, this is a real bottleneck | Copy-paste from Slack table to Google Sheets; tolerable at 50-creator scale | P1 — build `cheerful_export_to_sheet(campaign_id, status=["READY_TO_SHIP"], sheet_url)` — uses existing Google Sheets integration to write manifest rows directly to a Sheet |
| 40 | No shipping tracking number field on `campaign_creator` — after dispatch, cannot store per-creator tracking number in Cheerful | Brand rep cannot check "has this package been delivered?" from Cheerful; if a creator claims non-receipt, brand rep must consult external shipping tracker | Record tracking numbers in Google Sheets (Column: "Tracking No."); or use shipping carrier portal for delivery confirmation | P2 — add `shipping_tracking_number: string | null` and `shipped_at: datetime | null` to `campaign_creator` schema; expose via `cheerful_update_campaign_creator` |
| 41 | No `SHIPPED` or `DELIVERED` gifting status — `ORDERED` is the terminal status after `READY_TO_SHIP`; semantically ambiguous | `ORDERED` could mean "placed an order for products" OR "products dispatched to creator" — confusing in status table; no `DELIVERED` to mark once creator receives; Cheerful has no way to express "creator has the product in hand" | Accept `ORDERED` = "dispatched" by convention; document this meaning in campaign notes; use Google Sheets for delivery confirmation | P2 — add `SHIPPED` (dispatched to carrier) and `DELIVERED` (creator confirmed receipt) to gifting status enum; update all status-display components |
| 42 | No per-creator product assignment — all creators get campaign-level product bundle | In this Mama Sita's campaign, all creators get the same package (OK). For future campaigns with variant products, cannot assign "Creator A gets XL, Creator B gets standard" | N/A for this campaign (same bundle for all) | P2 — add `campaign_creator_product` junction table; out of scope for Mama Sita's gifting |
| 32 | HUMAN_AGENT tag not in MVP — shipping notification DM cannot be sent via Cheerful because 24h window is closed | ~27 of 32 creators will not receive a shipping notification DM via Cheerful; brand rep must use Instagram app manually | Manual DM from IG app: "Your package is on its way! 🎉" copy-paste to each creator (~27 messages) | P1 — same Gap 32 from Stage 5; adding HUMAN_AGENT tag to send-reply payload enables proactive DMs outside 24h window |

---

## Success Criteria

At the end of Stage 7, "100% hero journey" means:

1. **Complete shipping manifest exported**: 32 creator rows with full name + IG handle + address extracted from Cheerful (if Gap 30/36 resolved) or Google Sheets (workaround). Zero missing addresses.
2. **All packages dispatched**: 32 gift packages (Oyster Sauce 350mL + Sinigang Mix Sampalok 6-pk) dispatched to 32 addresses. Metro Manila: 5-7 business days. Provincial: 7-14 days.
3. **Campaign status updated in Cheerful**: All 32 creators show `ORDERED` in `cheerful_list_campaign_recipients` (requires Gap 30 resolved; else tracked in Google Sheets)
4. **Dispatch record exists**: Either in Cheerful (via `gifting_status=ORDERED` + `shipped_at` timestamp, Gap 40 resolved) or in Google Sheets (Ship Date column) — brand knows when each package was sent
5. **Stage 8 baseline set**: The list of `ORDERED` creators is the input to Stage 8 (Content Tracking) — these are the creators who have product and should post within 30 days

**Measurable target by Day 17 of campaign**:
- 32 packages dispatched (100% of opted-in, address-confirmed creators)
- 32 creators in `ORDERED` status (in Cheerful if Gap 30 resolved; in Sheets if not)
- Google Sheets "Shipping Manifest" tab: 32 rows, all complete
- Shipping notification DMs sent to all creators (27 via IG app manually + up to 5 via Cheerful if windows still open)

---

## Dependencies

| Dependency | Required By | Status |
|-----------|------------|--------|
| Stage 6 complete: ~32 creators with confirmed addresses | Shipping manifest has data to export | Spec'd — addresses in Google Sheets (workaround) or Cheerful (if Gap 30/36 resolved) |
| `cheerful_list_campaign_recipients` CE tool with `has_address` and `status` filters | Happy-path manifest pull (Phase A) | Spec'd — must be built (`../../cheerful-ce-parity-reverse/specs/campaigns.md`) |
| `campaign_creator.gifting_address` populated (Gap 30/36 prerequisite) | `has_address=true` filter returns results | **GAP** — Gap 30/36 must be resolved; field exists in schema, needs write path |
| `cheerful_update_campaign_creator` CE tool (Gap 30) | Marking creators as `ORDERED` after shipping | **GAP** — P0 — blocks shipping status tracking in Cheerful |
| Physical product inventory: ≥32 units each of Oyster Sauce (350mL) and Sinigang Mix (6-pk) | Actual shipping | Operational — outside Cheerful scope |
| Philippines domestic shipping service / fulfillment partner | Package dispatch | Operational — outside Cheerful scope |
| Google Sheets shipping tracker (Stage 6 workaround) | Workaround path — address source and status tracking | Manual setup — not a Cheerful dependency; already exists from Stage 6 |
| Stage 8 (Content Tracking) input: list of `ORDERED` creators with dispatch dates | Content tracking can define "30-day window starts from dispatch date" | Downstream — Stage 8 is blocked from starting if no dispatch record exists |
