# Stage 1: Campaign Setup

## What Happens

Before reaching out to a single creator, the Mama Sita's brand representative (who is also the Cheerful developer) configures the campaign infrastructure. This is a one-time-per-campaign setup: connecting the brand's Instagram Business Account, registering the products, and creating the gifting campaign record that all future stages will reference.

Specifically:
1. **IG Account connection** — Connect @mamasitasmanila's Instagram Business Account to Cheerful via Meta OAuth. This creates the `user_ig_dm_account` record that allows Cheerful to send and receive DMs on behalf of the brand.
2. **Product registration** — Create two product records: Mama Sita's Oyster Sauce (350mL) and Mama Sita's Sinigang Mix Sampalok (50g × 6 sachets). These become the gift items tracked throughout the campaign.
3. **Campaign creation** — Create a `gifting` campaign named "Mama Sita's Micro Creator Gifting — Q1 2026" with both products attached and the IG account set as the sender. The DM outreach template is stored as the campaign's `body_template`.
4. **Verification** — Confirm the campaign is correctly configured and ready for creator discovery.

---

## Cheerful Feature Mapping

| Action | CE Tool / Feature | Status | Source |
|--------|------------------|--------|--------|
| Connect Mama Sita's IG Business Account | `cheerful_connect_ig_account` | spec'd | `loops/cheerful-ig-dm-spec/PROMPT.md` (spec-ce-ig-dm-tools, pending) |
| Verify IG account connection | `cheerful_list_ig_accounts` | spec'd | `loops/cheerful-ig-dm-spec/PROMPT.md` (spec-ce-ig-dm-tools, pending) |
| Create Oyster Sauce product record | `cheerful_create_product` | spec'd | `loops/cheerful-ce-parity-reverse/specs/campaigns.md` §Products |
| Create Sinigang Mix product record | `cheerful_create_product` | spec'd | `loops/cheerful-ce-parity-reverse/specs/campaigns.md` §Products |
| Verify both products created | `cheerful_list_products` | spec'd | `loops/cheerful-ce-parity-reverse/specs/campaigns.md` §Products |
| Create gifting campaign | `cheerful_create_campaign` | spec'd | `loops/cheerful-ce-parity-reverse/specs/campaigns.md` §Campaign Core CRUD |
| Link IG account as campaign sender | `cheerful_create_campaign` → senders `[{ig_dm_account_id}]` | gap | Schema extended in `loops/cheerful-ig-dm-spec/analysis/spec/db-migrations.md` §Section 1; `CampaignSenderCreate` not yet updated |
| Verify campaign configuration | `cheerful_get_campaign` | spec'd | `loops/cheerful-ce-parity-reverse/specs/campaigns.md` §Campaign Core CRUD |

---

## Detailed Flow

### Step 0: Meta App Prerequisite (One-Time, Manual)

Before `cheerful_connect_ig_account` can work, the developer must complete a one-time Meta Developer setup:

1. Create a **Business-type** Meta App at developers.facebook.com
2. Add the **Instagram** product (Messenger Platform path — NOT "Instagram API with Instagram Login")
3. Request **Advanced Access** for: `instagram_manage_messages`, `pages_manage_metadata`, `pages_show_list`, `pages_messaging`, `business_management`
4. Submit for **Meta App Review** — takes 2–7 business days (requires screencast video, written justification, privacy policy at HTTPS URL, and Live Mode)
5. Link @mamasitasmanila's Instagram Business Account to a Facebook Page (Meta-side requirement)
6. Configure the Cheerful backend webhook in Meta Dashboard: `https://api.cheerful.app/webhooks/instagram/`, subscribe fields: `messages`, `message_echoes`
7. Set env vars: `META_APP_ID`, `META_APP_SECRET`, `META_WEBHOOK_VERIFY_TOKEN`

**During development/testing**: App Review is NOT required. Add the brand rep's personal Facebook account as an App Role Tester in the Meta Developer Dashboard. Only that account can complete OAuth and test DMs.

Source: `loops/cheerful-ig-dm-spec/analysis/spec/meta-oauth.md` §1.3, §8

---

### Step 1: Connect Mama Sita's IG Business Account

```
User: Connect our Instagram account @mamasitasmanila to Cheerful

CE (calls cheerful_connect_ig_account):
  → GET /api/v1/ig-dm-accounts/oauth-url
  ← Returns: oauth_url (Meta Facebook Login URL), state UUID, expires_in: 600
  → Presents URL in Slack: "Open this link to authorize Cheerful to use @mamasitasmanila's DMs: [Meta OAuth URL]"

User: Opens URL in browser, logs in with the Facebook account linked to the Mama Sita's Page, grants all requested permissions

Meta: Redirects to /api/v1/ig-dm-accounts/callback with code + state

Backend (automatic, happens in callback):
  1. Validates CSRF state
  2. Exchanges code → short-lived user token (~1h)
  3. Exchanges short-lived → long-lived user token (60 days)
  4. Fetches Mama Sita's Facebook Page + linked Instagram Business Account ID
  5. Fetches permanent Page Access Token (non-expiring)
  6. Subscribes page to Instagram webhooks (messages, message_echoes)
  7. Creates user_ig_dm_account record: {id: uuid, ig_username: "mamasitasmanila", ig_business_account_id: "17841400...", is_active: true}
  8. Starts IgDmInitialSyncWorkflow (backfills any existing conversation history)

CE (after OAuth completion):
  → Returns to Slack: "@mamasitasmanila connected successfully. Ready to send and receive Instagram DMs."
```

### Step 2: Verify IG Account Connection

```
User: Show me connected Instagram accounts

CE (calls cheerful_list_ig_accounts):
  → GET /api/v1/ig-dm-accounts/
  ← Response: [{id: "uuid-ig-acct", username: "mamasitasmanila", is_active: true, webhook_subscribed: true, token_health: "ok"}]
  → Slack: "Connected Instagram accounts:\n1. @mamasitasmanila — active ✓ (webhook subscribed, token healthy)"
```

### Step 3: Create Products

#### 3a. Oyster Sauce

```
User: Create a product for Mama Sita's Oyster Sauce 350mL

CE (calls cheerful_create_product):
  name: "Mama Sita's Oyster Sauce 350mL"
  description: "Authentic Filipino oyster sauce made with real oyster extract. 350mL bottle. Ideal for stir-fries, marinades, and dipping sauces. Shelf life 24 months."
  url_to_scrape: null

  → POST /products/
  ← Response: {id: "prod-uuid-oyster", user_id: "user-uuid", name: "Mama Sita's Oyster Sauce 350mL", description: "...", created_at: "..."}
  → Slack: "Product *Mama Sita's Oyster Sauce 350mL* created (ID: `prod-uuid-oyster`)."
```

#### 3b. Sinigang Mix

```
User: Create a product for Mama Sita's Sinigang Mix Sampalok

CE (calls cheerful_create_product):
  name: "Mama Sita's Sinigang Mix Sampalok 50g (Pack of 6)"
  description: "Classic Filipino sour soup base mix made from tamarind (sampalok). 50g sachets, pack of 6. Each sachet makes one pot of sinigang for 4-6 servings."
  url_to_scrape: null

  → POST /products/
  ← Response: {id: "prod-uuid-sinigang", user_id: "user-uuid", name: "Mama Sita's Sinigang Mix Sampalok 50g (Pack of 6)", ...}
  → Slack: "Product *Mama Sita's Sinigang Mix Sampalok 50g (Pack of 6)* created (ID: `prod-uuid-sinigang`)."
```

### Step 4: Verify Products

```
User: List my products

CE (calls cheerful_list_products):
  → GET /products/
  ← Response: [
      {id: "prod-uuid-oyster", name: "Mama Sita's Oyster Sauce 350mL", description: "..."},
      {id: "prod-uuid-sinigang", name: "Mama Sita's Sinigang Mix Sampalok 50g (Pack of 6)", description: "..."}
    ]
  → Slack: "Your products:\n1. *Mama Sita's Oyster Sauce 350mL* (ID: `prod-uuid-oyster`)\n2. *Mama Sita's Sinigang Mix Sampalok 50g (Pack of 6)* (ID: `prod-uuid-sinigang`)"
```

### Step 5: Create Gifting Campaign

```
User: Create a gifting campaign called "Mama Sita's Micro Creator Gifting — Q1 2026" for those two products, using our Instagram account

CE (calls cheerful_create_campaign):
  name: "Mama Sita's Micro Creator Gifting — Q1 2026"
  campaign_type: "gifting"
  subject_template: "[IG DM Campaign]"        ← placeholder (no email; see Gap #3)
  body_template: |
    "Hi {name}! 👋 I'm with Mama Sita's — we make authentic Filipino sauces and mixes used by families across the Philippines for generations.

    We love your food content and would love to send you a gift pack: our Oyster Sauce (350mL) + Sinigang Mix (pack of 6 sachets) to try in your kitchen. No strings attached — just hoping you enjoy them!

    If you'd like the gift pack, just reply here with your shipping address and we'll send it right over. 🇵🇭"
  product_id: "prod-uuid-oyster"
  product_ids: ["prod-uuid-sinigang"]
  senders: [{"ig_dm_account_id": "uuid-ig-acct"}]   ← GAP: not yet supported by CampaignSenderCreate
  status: "draft"
  is_external: true                                    ← workaround: true = no email recipients required
  agent_name_for_llm: "Mama Sita's Team"
  goal_for_llm: "Gift Filipino food creators with Oyster Sauce + Sinigang Mix. Collect UGC: at least 1 Instagram post or Reel per creator featuring the product."
  slack_channel_id: "C0MAMASITAS"

  → POST /campaigns/
  ← Response: {id: "campaign-uuid-mamasitas", name: "Mama Sita's Micro Creator Gifting — Q1 2026", campaign_type: "gifting", status: "draft", product_id: "prod-uuid-oyster", ...}
  → Slack: "Campaign *Mama Sita's Micro Creator Gifting — Q1 2026* created (ID: `campaign-uuid-mamasitas`). Status: draft."
```

### Step 6: Verify Campaign

```
User: Show me the campaign details

CE (calls cheerful_get_campaign):
  campaign_id: "campaign-uuid-mamasitas"

  → GET /campaigns/campaign-uuid-mamasitas
  ← Full CampaignResponse with all fields
  → Slack:
    "*Mama Sita's Micro Creator Gifting — Q1 2026* (gifting, draft)
    Products: Mama Sita's Oyster Sauce 350mL + Mama Sita's Sinigang Mix Sampalok 50g (Pack of 6)
    IG Account: @mamasitasmanila
    Goal: Gift Filipino food creators, collect UGC
    Status: draft — ready for creator discovery"
```

---

### CE Tool Calls (exact)

#### `cheerful_connect_ig_account`

```python
# Tool: cheerful_connect_ig_account
# Parameters: none (user_id injected via RequestContext)
# Source: loops/cheerful-ig-dm-spec/PROMPT.md (spec-ce-ig-dm-tools, pending build)

# Expected response shape:
{
  "oauth_url": "https://www.facebook.com/v21.0/dialog/oauth?client_id=...",
  "state": "550e8400-e29b-41d4-a716-446655440000",
  "expires_in": 600,
  "message": "Open this URL in your browser to authorize Cheerful to access @mamasitasmanila's Instagram DMs. This link expires in 10 minutes."
}
# User action: Open URL, complete Meta OAuth flow. CE polls for connection completion (or user confirms via Slack).
```

#### `cheerful_create_product` (Oyster Sauce)

```python
# Tool: cheerful_create_product
# Source: loops/cheerful-ce-parity-reverse/specs/campaigns.md §Products
cheerful_create_product(
  name="Mama Sita's Oyster Sauce 350mL",
  description="Authentic Filipino oyster sauce made with real oyster extract. 350mL bottle. Shelf life 24 months."
)

# Expected response:
{
  "id": "prod-uuid-oyster",
  "user_id": "user-uuid",
  "name": "Mama Sita's Oyster Sauce 350mL",
  "description": "Authentic Filipino oyster sauce...",
  "url_to_scrape": null,
  "created_at": "2026-03-01T10:00:00Z"
}
```

#### `cheerful_create_product` (Sinigang Mix)

```python
cheerful_create_product(
  name="Mama Sita's Sinigang Mix Sampalok 50g (Pack of 6)",
  description="Classic Filipino sour soup base mix from tamarind. 50g sachets, pack of 6. Each sachet makes one pot of sinigang for 4-6 servings."
)

# Expected response:
{
  "id": "prod-uuid-sinigang",
  "user_id": "user-uuid",
  "name": "Mama Sita's Sinigang Mix Sampalok 50g (Pack of 6)",
  "description": "Classic Filipino sour soup base...",
  "url_to_scrape": null,
  "created_at": "2026-03-01T10:01:00Z"
}
```

#### `cheerful_create_campaign`

```python
# Tool: cheerful_create_campaign
# Source: loops/cheerful-ce-parity-reverse/specs/campaigns.md §Campaign Core CRUD
# GAP: senders[].ig_dm_account_id not yet in CampaignSenderCreate schema
cheerful_create_campaign(
  name="Mama Sita's Micro Creator Gifting — Q1 2026",
  campaign_type="gifting",
  subject_template="[IG DM Campaign]",
  body_template="Hi {name}! 👋 I'm with Mama Sita's — we make authentic Filipino sauces and mixes used by families across the Philippines for generations.\n\nWe love your food content and would love to send you a gift pack: our Oyster Sauce (350mL) + Sinigang Mix (pack of 6 sachets) to try in your kitchen. No strings attached — just hoping you enjoy them!\n\nIf you'd like the gift pack, just reply here with your shipping address and we'll send it right over. 🇵🇭",
  product_id="prod-uuid-oyster",
  product_ids=["prod-uuid-sinigang"],
  senders=[{"ig_dm_account_id": "uuid-ig-acct"}],  # GAP: requires schema extension
  status="draft",
  is_external=True,
  agent_name_for_llm="Mama Sita's Team",
  goal_for_llm="Gift Filipino food creators (5K-50K followers) with Oyster Sauce + Sinigang Mix. Collect UGC: at least 1 Instagram post, Story, or Reel per creator featuring the product. Target: 50+ creators.",
  rules_for_llm="Keep tone warm and Filipino-friendly. Mention the heritage and authenticity of the products. Don't promise payment. Don't send follow-ups more than twice.",
  slack_channel_id="C0MAMASITAS"
)

# Expected response:
{
  "id": "campaign-uuid-mamasitas",
  "name": "Mama Sita's Micro Creator Gifting — Q1 2026",
  "campaign_type": "gifting",
  "status": "draft",
  "product_id": "prod-uuid-oyster",
  "product_ids": ["prod-uuid-sinigang"],
  "is_external": true,
  "body_template": "Hi {name}! ...",
  "goal_for_llm": "Gift Filipino food creators...",
  "sender_emails": [],  # No email senders — IG-only
  "recipient_emails": [],
  "created_at": "2026-03-01T10:05:00Z"
}
```

---

### IG-Specific Considerations

**Meta App Review Blockers (Development vs Production)**:
- In Development Mode: Only Facebook accounts explicitly added as App Roles (Admin, Developer, Tester) can use the IG DM integration. The Mama Sita's developer CAN test with their own account. Real creator DMs will NOT work until App Review is approved.
- In Production Mode (post-Review): Any Instagram Business Account can connect. Outbound DMs to any Instagram user are possible via `POST /{ig_business_account_id}/messages`.
- Review timeline: 2–7 business days (up to 10 for complex cases). Submit materials: screencast video of Cheerful CE + IG DM flow, written purpose statements, privacy policy URL, app in Live Mode.

**Facebook Page Requirement**:
- @mamasitasmanila's Instagram Business Account must be linked to a Facebook Page (not a personal profile). This is a Meta-side configuration step done in Instagram Settings → Linked Accounts.
- If no linked Page exists, `GET /me/accounts?fields=id,name,instagram_business_account` returns 0 pages with IG accounts → OAuth callback returns error.

**Token Lifecycle**:
- Permanent Page Access Token stored in `user_ig_dm_account` (encrypted via AES-256-CBC)
- Long-lived User Token refreshed weekly via `IgDmTokenRefreshWorkflow` (Temporal cron, 6 AM UTC)
- If @mamasitasmanila's Facebook account password changes or app permissions revoked: token invalidated, `is_active=FALSE`, Slack notification sent

---

## Gaps & Workarounds

| Gap | Impact | Workaround | Build Priority |
|-----|--------|------------|---------------|
| `cheerful_connect_ig_account` CE tool not built (spec-ce-ig-dm-tools pending) | Cannot connect IG account via CE. Entire IG DM flow blocked. | Developer connects IG account via direct API call or manual DB insert during development. No production workaround. | P0 |
| `cheerful_create_campaign` senders param doesn't support `ig_dm_account_id` | Cannot link IG account to campaign as sender via CE tool. Campaign sender remains blank. | Create campaign with `is_external=true` and no senders. Track IG account association manually (e.g., in campaign `rules_for_llm` or Slack channel). Apply schema extension from ig-dm-spec before building CE tool. | P0 |
| `CampaignSenderCreate` schema not extended for `ig_dm_account_id` | Backend rejects `senders=[{"ig_dm_account_id": "..."}]` with 422 validation error | Skip senders in campaign creation. `campaign_sender` row with `ig_dm_account_id` must be created via direct DB insert or separate API call. | P0 |
| No IG DM message template field on campaign (only email `body_template`) | DM outreach message stored as email body template — naming is misleading, no DM-specific placeholders, CE may prompt user for email context | Use `body_template` as the DM outreach template. Document convention clearly. `{name}` placeholder works for DM personalization (Instagram @handle or first name). | P1 |
| `subject_template` required by `cheerful_create_campaign` but meaningless for DM campaigns | Must pass a placeholder value; confuses CE and user | Pass `"[IG DM Campaign]"` as placeholder. Note: `subject_template` is used for email subject lines only. | P1 |
| Meta App Review required for production use (Advanced Access permissions) | Outbound DMs and inbound webhook delivery blocked in Development Mode for non-test accounts | During development: add brand rep's Facebook account as App Role Tester. After development: submit for App Review before launch. Budget 1-2 weeks. | P0 (timeline blocker, not code) |
| `cheerful_create_product` and `cheerful_list_products` not built yet | Cannot create product records via CE | Use direct API call: `POST /products/` with Bearer token. Products can also be created via the webapp product flow. | P1 |

---

## Success Criteria

A complete Stage 1 looks like this:

- [ ] @mamasitasmanila IG Business Account connected to Cheerful: `user_ig_dm_account` row exists with `is_active=true`, `webhook_subscribed=true`
- [ ] Mama Sita's Oyster Sauce 350mL product created: `product` row with `user_id=brand_rep_user_id`
- [ ] Mama Sita's Sinigang Mix Sampalok 50g (Pack of 6) product created: `product` row with `user_id=brand_rep_user_id`
- [ ] Campaign "Mama Sita's Micro Creator Gifting — Q1 2026" created: `campaign` row with `campaign_type=gifting`, `status=draft`, both products linked, IG account linked as sender
- [ ] DM outreach template stored in `body_template` with `{name}` merge tag
- [ ] `goal_for_llm` set with 50+ creator target and UGC success criteria
- [ ] Slack notification channel configured (`slack_channel_id`)
- [ ] `cheerful_get_campaign` returns complete, correct configuration

---

## Dependencies

| Dependency | Required For | Status |
|------------|-------------|--------|
| Meta App created (Business type) with Instagram product added | IG Account OAuth | Manual one-time setup |
| Meta App Review approved (Advanced Access permissions) | Production IG DM send/receive | External — 2-7 day wait |
| @mamasitasmanila linked to a Facebook Page | Meta OAuth callback success | Meta-side configuration |
| Backend env vars: META_APP_ID, META_APP_SECRET, META_WEBHOOK_VERIFY_TOKEN | MetaGraphService initialization | Infra config |
| ig-dm-spec schema migrations deployed (user_ig_dm_account table, campaign_sender.ig_dm_account_id column) | IG account storage + campaign linkage | spec-ce-ig-dm-tools not yet built |
| `spec-ce-ig-dm-tools` aspect completed in cheerful-ig-dm-spec loop | cheerful_connect_ig_account and cheerful_list_ig_accounts | Pending (ig-dm-spec 63% complete) |
| No prior stages required | This is Stage 1 | — |
