# Campaign Configuration — Mama Sita's Micro Creator Gifting Q1 2026

> Concrete campaign values used throughout all stages of this journey. These are the real parameters, not placeholders.

---

## Campaign Identity

| Field | Value |
|-------|-------|
| Campaign Name | Mama Sita's Micro Creator Gifting — Q1 2026 |
| Campaign Type | `gifting` |
| Brand | Mama Sita's (maker of Filipino food staples since 1953) |
| Brand IG | @mamasitasmanila |
| Campaign Status (initial) | `draft` |
| Target Start Date | 2026-03-15 |
| Target End Date | 2026-04-30 (content deadline) |

---

## Products

| # | Product Name | SKU Description | Quantity per Gift |
|---|-------------|-----------------|-------------------|
| 1 | Mama Sita's Oyster Sauce 350mL | `prod-uuid-oyster` | 1 bottle |
| 2 | Mama Sita's Sinigang Mix Sampalok 50g (Pack of 6) | `prod-uuid-sinigang` | 1 pack (6 sachets) |

**Gift pack contents**: 1× Oyster Sauce 350mL + 1× Sinigang Mix Sampalok pack

---

## Creator Targeting

| Parameter | Value |
|-----------|-------|
| Platform | Instagram |
| Creator type | Micro food creators |
| Follower range | 5,000 – 50,000 |
| Niche | Filipino home cooking, Asian cuisine, recipe creators, food lifestyle |
| Geography | Philippines-based preferred; Filipino diaspora (US, Canada, UAE, UK) acceptable |
| Target count | 50+ opted-in creators |
| Language | Filipino (Tagalog), English, Taglish |
| Content quality bar | Feed posts or Reels with good lighting and food styling; authentic home cooking aesthetic preferred |
| Engagement rate threshold | ≥ 2.5% (likes + comments / followers) |
| Exclude | Creators with sponsored-only feeds, food delivery promos only, or >10 brand posts in last 30 days |

---

## Outbound Channel

| Parameter | Value |
|-----------|-------|
| Primary channel | Instagram DM |
| Fallback channel | Email (only if creator provides email in DM response or bio) |
| Sender account | @mamasitasmanila (Instagram Business Account) |
| Outreach style | Personalized DM — single message, warm and direct |
| Follow-up | One follow-up DM after 5 days if no response |

---

## DM Outreach Template (stored as `body_template`)

```
Hi {name}! 👋 I'm with Mama Sita's — we make authentic Filipino sauces and mixes used by families across the Philippines for generations.

We love your food content and would love to send you a gift pack: our Oyster Sauce (350mL) + Sinigang Mix Sampalok (pack of 6 sachets) to try in your kitchen. No strings attached — just hoping you enjoy them!

If you'd like the gift pack, just reply here with your shipping address and we'll send it right over. 🇵🇭
```

**Merge tags**:
- `{name}` — Creator's first name or @handle (e.g., "Maria" or "@filipinafoodie")

**Character count**: ~390 characters (well under IG DM 1000-char limit)

---

## Follow-Up DM Template

```
Hi {name}! Just following up on my message about the Mama Sita's gift pack. 🙏 No worries if you're not interested — just thought you'd enjoy trying our Oyster Sauce and Sinigang Mix. Let me know! 🇵🇭
```

**Timing**: Sent 5 days after initial DM if no reply. One follow-up maximum.

---

## AI Drafting Config

| Field | Value |
|-------|-------|
| `agent_name_for_llm` | "Mama Sita's Team" |
| `goal_for_llm` | "Gift Filipino food creators (5K-50K followers) with Oyster Sauce + Sinigang Mix. Collect UGC: at least 1 Instagram post, Story, or Reel per creator featuring the product. Target: 50+ opted-in creators." |
| `rules_for_llm` | "Keep tone warm and Filipino-friendly. Mention the heritage (since 1953) and authenticity of the products. Do not promise payment or require posting. Do not send more than 2 total DMs to any creator. When collecting shipping address, ask for: full name, street address, city, province/state, postal code, country." |

---

## Deliverables Required from Creators

| Deliverable | Required | Notes |
|------------|----------|-------|
| Instagram feed post (photo/carousel) | Preferred | Must tag @mamasitasmanila, use #MamaSitas |
| Instagram Reel | Optional bonus | Counts as 1 UGC piece |
| Instagram Story | Optional | Less valuable; no saves after 24h |
| Hashtags | Required if posting | #MamaSitas #HomeCooking #FilipinoFood |
| @mention | Required if posting | @mamasitasmanila in caption or tags |
| Posting timeline | Within 4 weeks of receiving product | Tracked in stage-8-content-tracking |

---

## Shipping Details

| Parameter | Value |
|-----------|-------|
| Ships from | Manila, Philippines |
| Ship-to regions | Philippines (domestic), International (US, Canada, UAE, UK) |
| Fulfillment method | Manual — brand rep prepares and ships packages |
| Tracking | Not provided (gift packages, low value) |
| Address fields collected | Full name, street address, city, province/state, postal code, country |
| Data format for export | CSV with columns: handle, name, address_line1, city, province, postal_code, country, product_1, product_2 |

---

## Success Metrics (ROI)

| Metric | Target | How Measured |
|--------|--------|-------------|
| Creators gifted (opted-in + received product) | ≥ 50 | Campaign creator records |
| UGC pieces collected (any content type) | ≥ 40 | Manual tracking + UGC capture |
| UGC with @mamasitasmanila mention | ≥ 30 | Graph API mention monitoring |
| Average engagement rate on UGC posts | ≥ 3% | Manual or API pull |
| Total impressions (estimated) | ≥ 1,000,000 | Creator avg impressions × post count |
| Content ROI (UGC value ÷ product cost) | Positive | Estimated earned media value vs. COGS of gift packs |

---

## Cheerful Campaign Record IDs (placeholder — populated after Stage 1)

| Entity | ID |
|--------|-----|
| Campaign ID | `campaign-uuid-mamasitas` (assigned on creation) |
| IG Account ID | `uuid-ig-acct` (assigned after OAuth) |
| Product: Oyster Sauce | `prod-uuid-oyster` (assigned on creation) |
| Product: Sinigang Mix | `prod-uuid-sinigang` (assigned on creation) |
| Slack Channel | `C0MAMASITAS` (pre-existing) |
