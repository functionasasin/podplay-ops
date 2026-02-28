# TikTok Shop API — Analysis

## Overview

TikTok Shop is TikTok's integrated e-commerce layer, enabling merchants to sell products directly through TikTok videos, LIVE streams, and storefronts — the full browse-to-buy journey without leaving the app. The developer surface is the **TikTok Shop Open Platform** (aka Partner API v2), accessed via the **Partner Center** at `partner.tiktokshop.com`.

**Base URL (Partner API v2):** `https://open-api.tiktokglobalshop.com`

**US-specific auth URL:** `https://services.us.tiktokshop.com/open/authorize?service_id=<Application ID>`

**Status:** Generally Available (v2). V1 was sunset — build exclusively on v2.

**Key portal:** `https://partner.tiktokshop.com/docv2/`

---

## Regional Availability

TikTok Shop is live in **17 countries** as of early 2026:

| Region | Countries |
|--------|-----------|
| North America | United States, Mexico |
| Europe | United Kingdom, Germany, France, Italy, Spain, Ireland |
| Asia-Pacific | Japan, Singapore, Indonesia, Malaysia, Thailand, Vietnam, Philippines |
| South America | Brazil |

**Expansion targets:** India, Hungary, Peru, Kenya (timelines uncertain).

**Cross-border selling:** Some Chinese-based sellers can apply to sell in Southeast Asia; some Asian sellers can apply for US/Latin America access. Subject to logistics compliance.

**Notable regional restriction:** The TikTok **Data Portability API** (separate from Shop API) is EEA/UK only — does not affect core Shop integration.

**API registration:** Two portals exist — US Partner Portal and Global Partner Portal. Merchants must have a registered business in a supported country with a tax ID and identity verification.

---

## Shop Types

| Type | Description |
|------|-------------|
| **Seller Shop** | Traditional merchant storefront; list and sell products directly |
| **Creator Shop** | Creators sell products to their own audience |
| **Affiliate Program** | Creators earn commissions promoting other sellers' products |

The Affiliate APIs (GA as of 2024) specifically bridge the seller ↔ creator relationship and are the most relevant for influencer workflow integrations.

---

## Authentication

**Method:** OAuth 2.0 + mandatory request signing (HmacSHA256)

**Credentials required:**
- `App Key`
- `App Secret`
- `Service ID`
(All obtained after app registration in Partner Center)

**Token endpoint:**
```
POST https://open.tiktokapis.com/v2/oauth/token/
Content-Type: application/x-www-form-urlencoded

client_key=CLIENT_KEY
client_secret=CLIENT_SECRET
code=CODE
grant_type=authorization_code
redirect_uri=REDIRECT_URI
```

**Token response:**
```json
{
  "access_token": "act.example12345Example12345Example",
  "expires_in": 86400,
  "refresh_expires_in": 31536000,
  "refresh_token": "rft.example12345Example12345Example",
  "scope": "shop.basic,orders.read,products.write",
  "token_type": "Bearer"
}
```

**Access token lifetime:** 24 hours. Must be refreshed via background job using refresh token (valid 1 year).

**Request signing (HmacSHA256):** Every API call must include a computed signature. Parameters include:
- `app_key`
- `timestamp` (Unix ms)
- `sign_method: "HmacSHA256"`
- Sorted query/body parameters concatenated with the app secret

Unsigned or incorrectly signed calls fail outright. This is a non-negotiable requirement — unlike the developer-facing REST APIs which use Bearer token only.

---

## API Surface: Endpoint Groups

All endpoints share base: `https://open-api.tiktokglobalshop.com`

### 1. Products API
**Overview:** `partner.tiktokshop.com/docv2/page/products-api-overview`

Operations:
- Create product with SKU variants
- Update product details (title, description, images, price)
- Get product by ID / list products
- Sync product from external catalog
- Manage product categories
- Manage inventory stock levels per SKU
- Deactivate / delete products

**Rate limits:**
- Default: 100 product uploads/day (probation period)
- After probation: 1,000 product uploads/day
- Can request increase via Support

**Data fields:** Product ID, title, description, category, images, price, currency, SKU variants, stock quantity, status.

---

### 2. Orders API
**Overview:** `partner.tiktokshop.com/docv2/page/650b1b4bbace3e02b76d1011`

Operations:
- List orders (with filters: date range, status, shop)
- Get order details by ID
- Update order status
- Cancel order
- Confirm payment received

**Order statuses:** Pending payment → Awaiting shipment → Shipped → Delivered → Completed → Cancelled → Return/Refund in progress.

**Data fields:** Order ID, items (SKU, qty, price), buyer info, shipping address, payment method, logistics tracking, total amount, commission data (for affiliate orders).

---

### 3. Fulfillment / Logistics API
**Overview:** `partner.tokopedia.com/docv2/page/650b2044f1fd3102b93c9178`

Operations:
- Sync shipping methods
- Create shipment / generate waybill
- Update tracking number
- Get shipment status
- Reverse logistics / return shipment management

---

### 4. Affiliate Seller API (High Relevance for Cheerful)
**Overview:** `partner.tiktokshop.com/docv2/page/6697960798b0a502f89e3d00`

**GA'd in 2024.** This is the surface for brands/sellers to manage creator-brand relationships at scale.

Operations:
- **Create affiliate campaign** — define open collaboration (any eligible creator can join) or targeted collaboration (invite specific creators)
- **Search creators** — filter by GMV performance, follower count, demographics, category keywords
- **Get creator profile** — follower count, GMV history, content niches, engagement metrics
- **Invite creator to targeted collaboration** — send invite with commission rate and campaign brief
- **Manage collaboration settings** — edit open campaign parameters, commission structure
- **Generate affiliate product promotion links** — per-creator trackable links
- **Search affiliate orders** — retrieve orders attributed to specific creators/campaigns
- **Track creator performance** — GMV, orders, commission earned per creator

**Key data available on creators via Affiliate API:**
- Creator handle / profile
- Follower count
- GMV (gross merchandise value generated)
- Category/niche tags
- Demographics (where available)
- Commission history

**Access requirement:** Seller account with approved Partner app + Affiliate API scope.

---

### 5. Finance / Settlement API

Operations:
- Get settlement reports
- Get transaction history
- View fee breakdowns (platform fees, affiliate commissions, logistics)
- Download financial statements

---

### 6. Shop Management API

Operations:
- Get authorized shops linked to account
- Get shop info (name, region, status, rating)
- Manage shop connection/disconnection (webhook trigger on shop auth/deauth)

**Research API endpoint for shop data (no auth required for public data):**
```
GET https://open.tiktokapis.com/v2/research/tts/shop/
Authorization: Bearer {token}
```
Fields: `shop_name`, `shop_rating`, `shop_review_count`, `item_sold_count`, `shop_id`, `shop_performance_value`

---

## Webhooks

TikTok Shop emits real-time webhook events. Webhooks are configured in the Developer Portal (callback URL, HTTPS required).

**Delivery guarantee:** Best-effort "at least once" — idempotent handling required.

**Verification:** Signature check using app client secret.

**Known webhook categories:**

| Category | Events |
|----------|--------|
| Orders | New order, order status change, cancellation, refund |
| Products | Product approval, product update, stock change |
| Shop | Shop connected, shop deauthorized |
| Affiliate | New collaboration request, creator accepted, order attributed |
| Logistics | Shipment created, tracking updated, delivery confirmed |
| Creator Marketplace | Campaign order status (via Business API webhooks) |

**Payload structure (deauth example):**
```json
{
  "client_key": "app_key_value",
  "event": "user.deauthorized",
  "create_time": 1700000000,
  "user_openid": "openid_value",
  "content": {}
}
```

**Architecture recommendation:** Webhook → durable queue (SQS/Pub/Sub) → stateless workers → deduplicate → upsert. Run scheduled polling to reconcile state + heal missed events.

---

## Rate Limits

| Limit Type | Value |
|-----------|-------|
| General request rate | 50 requests/second per endpoint |
| Rate limit window | 1-minute sliding window |
| Product upload (probation) | 100/day |
| Product upload (post-probation) | 1,000/day |
| Error code for exceeded limit | HTTP 429, `rate_limit_exceeded` |

Rate limits are enforced both at **app level** (across all clients) and **per unique seller account**. Higher limits available via request to TikTok support.

---

## App Registration & Access Requirements

**Process:**
1. Register on Partner Center (US or Global portal depending on target market)
2. Create app → set name, category, logo, target market, redirect URL
3. Receive App Key, App Secret, Service ID
4. Enable specific API scopes (Shop Authorized Information, Order Information, Affiliate, etc.)
5. Implement OAuth + HmacSHA256 signing
6. Submit for app review (scope-dependent)

**App types:**
- **Public app:** Listed on TikTok Shop App Store; accessible to any seller
- **Custom app:** For internal use by a single seller/organization

Both types use the same OAuth 2.0 authentication method.

**Testing:**
- Sandbox environment provided (test product creation, fake orders)
- API Testing Tool in Partner Center's Development Kits section
- Postman quickstart available
- Generate test access token page in portal

**Zero listing fees** on TikTok Shop App Store for new developers.

---

## Related Integrations

### Shopify
Official TikTok Shop app in Shopify App Store. Syncs product catalog, inventory, orders bidirectionally. Most sellers use this path rather than raw API.

### WooCommerce
TikTok for WooCommerce plugin — same catalog/order sync.

### Magento / Others
Third-party connectors (API2Cart, Pipe17) provide unified API over TikTok Shop + other platforms.

---

## Capability Matrix

| Capability | Available | Notes |
|-----------|-----------|-------|
| Product CRUD | ✅ | Full lifecycle |
| Inventory management | ✅ | Per-SKU stock levels |
| Order retrieval | ✅ | Full order details incl. affiliate attribution |
| Order management | ✅ | Status updates, cancellation |
| Fulfillment / shipping | ✅ | Waybill, tracking, returns |
| Affiliate campaign creation | ✅ | Open + targeted collaborations |
| Creator search/discovery | ✅ | GMV, keywords, demographics filters |
| Creator performance tracking | ✅ | GMV, orders, commissions per creator |
| Affiliate link generation | ✅ | Per-creator trackable links |
| Financial settlement | ✅ | Fee breakdowns, reports |
| Real-time webhooks | ✅ | Orders, products, shop, affiliate events |
| Shop info (public research) | ✅ | Via Research API endpoint |
| DMs / messaging | ❌ | Not in Shop API scope |
| Content posting | ❌ | Separate Content Posting API |
| Live commerce metrics | ⚠️ | Via Seller Center; API access limited |
| Analytics dashboard data | ⚠️ | Seller Center only; not directly API-accessible |

---

## Cheerful Applicability

### High-Value Touchpoints

1. **Affiliate Campaign Management (Highest value)**
   - Cheerful could use the Affiliate Seller API to programmatically create open or targeted affiliate campaigns on behalf of brand clients
   - Search creators by GMV and niche — overlaps with Cheerful's creator discovery workflow
   - Track creator-attributed orders — direct campaign ROI measurement without manual tracking

2. **Creator Discovery via Affiliate API**
   - The creator search endpoint (filter by GMV, demographics, category) complements Display API profile data
   - GMV data is not available in any other official TikTok API — this is exclusive to the Shop Affiliate API
   - For e-commerce clients, GMV is the most predictive metric for influencer selection

3. **Revenue Attribution / Campaign Reporting**
   - Affiliate orders API provides ground-truth conversion data (orders, GMV, commission)
   - Maps directly to Cheerful's campaign tracking and reporting workflows

4. **Webhook-Driven Campaign Updates**
   - Affiliate webhooks can notify Cheerful when a creator accepts/declines collaboration
   - Order webhooks can update real-time campaign performance dashboards

### Limitations for Cheerful

- **Requires seller account context:** The Affiliate API requires a Shop seller account — Cheerful would need to either (a) operate as an agency on behalf of seller clients, or (b) connect each client's seller account via OAuth
- **Commerce-only:** Only relevant for Cheerful clients who sell products on TikTok Shop; not applicable for brand awareness campaigns without a shop
- **App review required:** Getting Affiliate API scope approved requires Partner Center app registration and review
- **Regional scope:** Only 17 countries; not globally applicable

### Integration Complexity

**Medium-High.** Requires:
- OAuth flow per seller client
- HmacSHA256 request signing implementation (non-trivial; must match exact parameter ordering)
- Webhook infrastructure for real-time updates
- New data model entities: `tiktok_shop`, `affiliate_campaign`, `shop_creator_attribution`

### Recommended Approach

For Cheerful clients who are TikTok Shop sellers: implement the Affiliate Seller API as the **primary campaign management layer** for TikTok. This gives creator discovery, campaign creation, performance tracking, and revenue attribution in one surface — far more actionable than the Display API for commerce-oriented influencer programs.

---

## Sources

- [TikTok Shop Partner Center API Docs](https://partner.tiktokshop.com/docv2/)
- [TikTok Shop Affiliate APIs Launch Blog](https://developers.tiktok.com/blog/2024-tiktok-shop-affiliate-apis-launch-developer-opportunity)
- [Affiliate Seller API Overview](https://partner.tiktokshop.com/docv2/page/affiliate-seller-api-overview)
- [Affiliate Integration Guide](https://partner.tiktokshop.com/docv2/page/affiliate-integration)
- [Products API Overview](https://partner.tiktokshop.com/docv2/page/products-api-overview)
- [Order API Overview](https://partner.tiktokshop.com/docv2/page/650b1b4bbace3e02b76d1011)
- [Sign Your API Request](https://partner.tiktokshop.com/docv2/page/sign-your-api-request)
- [TikTok Shop Countries 2026](https://dpl.company/countries-with-access-to-tiktok-shop-seller-center/)
- [TikTok Shop Data API 2026](https://www.echotik.live/blog/tiktok-shop-data-api-access-endpoints-metrics-and-analytics-2026/)
- [API Rate Limit Policy](https://partner.tiktokshop.com/docv2/page/64f1991d64ed2e0295f3d2c0)
- [TikTok Webhooks Overview](https://developers.tiktok.com/doc/webhooks-overview/)
