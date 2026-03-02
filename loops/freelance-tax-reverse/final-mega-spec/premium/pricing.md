# Premium Pricing — Philippine Freelance & Self-Employed Income Tax Optimizer

**Status:** COMPLETE
**Last updated:** 2026-03-02
**Cross-references:**
- Tier feature definitions: [premium/tiers.md](tiers.md)
- Feature matrix: [premium/features-by-tier.md](features-by-tier.md)
- B2B professional features: [premium/professional-features.md](professional-features.md)
- Database billing schema: [database/schema.md §5](../database/schema.md)
- Billing API endpoints: [api/endpoints.md §13](../api/endpoints.md)
- Pricing page copy: [seo-and-growth/landing-page.md](../seo-and-growth/landing-page.md)
- Frontend copy for upgrade modals: [frontend/copy.md §3.4, §12](../frontend/copy.md)

---

## Table of Contents

1. [Price Points](#1-price-points)
2. [Pricing Rationale](#2-pricing-rationale)
3. [Billing Cycles — Detailed Mechanics](#3-billing-cycles--detailed-mechanics)
4. [Trial Logic — Complete Business Rules](#4-trial-logic--complete-business-rules)
5. [Upgrade Flow — Step-by-Step](#5-upgrade-flow--step-by-step)
6. [Downgrade Flow — Step-by-Step](#6-downgrade-flow--step-by-step)
7. [PayMongo Product and Price Configuration](#7-paymongo-product-and-price-configuration)
8. [Stripe Product and Price Configuration](#8-stripe-product-and-price-configuration)
9. [VAT Handling](#9-vat-handling)
10. [Invoice Format](#10-invoice-format)
11. [Promo Codes and Discounts](#11-promo-codes-and-discounts)
12. [Refund Policy — Complete Rules](#12-refund-policy--complete-rules)
13. [Payment Method Routing Logic](#13-payment-method-routing-logic)
14. [Failed Payment and Dunning Sequence](#14-failed-payment-and-dunning-sequence)
15. [Pricing Display Rules (Frontend)](#15-pricing-display-rules-frontend)
16. [Analytics and Conversion Tracking](#16-analytics-and-conversion-tracking)
17. [Database Columns for Pricing State](#17-database-columns-for-pricing-state)
18. [Pricing Invariants](#18-pricing-invariants)

---

## 1. Price Points

### 1.1 Canonical Price Table

All prices are in Philippine Pesos (₱), VAT-inclusive (see §9 for VAT breakdown). These values are the source of truth; the `subscriptions` database table and all payment provider configurations must match exactly.

| Plan | Billing Cycle | Price | Effective Monthly Rate | Annual Savings vs Monthly |
|------|--------------|-------|------------------------|--------------------------|
| FREE | N/A | ₱0 | ₱0/month | N/A |
| PRO | Monthly | ₱200/month | ₱200/month | N/A |
| PRO | Annual | ₱1,999/year | ₱166.58/month | ₱401/year (16.71%) |
| ENTERPRISE | Monthly | ₱1,499/month | ₱1,499/month | N/A |
| ENTERPRISE | Annual | ₱14,999/year | ₱1,249.92/month | ₱2,989/year (16.62%) |

### 1.2 Hardcoded Savings Figures

Per TIER-V13 in tiers.md, annual savings figures are hardcoded — never computed dynamically. The exact values are:

| Plan | Annual Savings | Savings Percentage |
|------|---------------|-------------------|
| PRO | ₱401 | 16.71% (displayed as "17%" in UI rounded to nearest integer) |
| ENTERPRISE | ₱2,989 | 16.62% (displayed as "17%" in UI rounded to nearest integer) |

Both plans display "Save 17%" as the promotional badge on the annual plan option. The precise values (₱401 and ₱2,989) appear in the savings breakdown tooltip.

### 1.3 Amounts in Provider APIs (Centavos)

Philippine payment providers and Stripe represent PHP amounts as integers in centavos (1/100 of ₱1).

| Plan | Billing Cycle | Centavo Amount |
|------|--------------|---------------|
| PRO | Monthly | `20000` |
| PRO | Annual | `199900` |
| ENTERPRISE | Monthly | `149900` |
| ENTERPRISE | Annual | `1499900` |

---

## 2. Pricing Rationale

### 2.1 PRO at ₱200/month

**CPA cost comparison:** Philippine CPAs charge ₱3,000–₱10,000 for annual ITR filing. A freelancer paying ₱200/month (₱2,400/year) or ₱1,999/year replaces the CPA's ₱3,000 minimum cost with a tool that is faster, always-available, and teaches the taxpayer to understand their own tax situation. The effective ROI for the freelancer at the minimum ₱3,000 CPA fee is ₱1,001–₱7,001 in savings per year. At the maximum ₱10,000 CPA fee, the savings are ₱8,001/year.

**Regime optimization savings:** A freelancer earning ₱500,000–₱2,000,000 who mistakenly files under the graduated + itemized path when they qualify for 8% saves ₱15,000–₱60,000 in tax. The ₱200/month subscription cost is less than 0.4% of that savings.

**Price anchoring:** The ₱200/month price point is below the psychological ₱250 threshold (the same ₱250,000 annual exemption that is prominent throughout the tool's output). A freelancer who sees "₱250,000 personal exemption" throughout the tool will not balk at ₱200/month.

**Market positioning:** Taxumo charges ₱2,499–₱4,248/quarter (₱833–₱1,416/month) and does not offer regime comparison. At ₱200/month, TaxKlaro is 4–7× cheaper than Taxumo for equivalent value, and delivers more value (regime comparison is the differentiator).

### 2.2 ENTERPRISE at ₱1,499/month

**CPA economics:** A CPA with 15 clients each paying ₱3,000/year in ITR fees earns ₱45,000/year from filing returns. The CPA also spends 1–2 hours per client on arithmetic that TaxKlaro automates. At ₱1,499/month (₱17,988/year), the tool replaces 60–120 hours of manual computation. Even if the CPA charges only ₱500/hour for this time, the tool pays for itself with 36 client ITR filings.

**Batching premium:** ENTERPRISE's batch computation feature (50 items/batch, 5 concurrent batches) enables a CPA to process an entire practice in minutes. This time-value premium justifies the 7.5× markup over PRO.

**B2B pricing norms:** B2B SaaS tools in the Philippines (JuanTax, Taxumo Business) charge ₱2,000–₱5,000/month for business tier. ₱1,499 is deliberately priced below this range to be accessible to solo CPAs and small bookkeeping practices.

### 2.3 Annual Discount at ~17%

The ~17% annual discount is chosen to:
1. Represent approximately 2 free months (2/12 = 16.7%)
2. Be large enough to motivate cycle switching (under 10% is not compelling; over 25% devalues monthly pricing)
3. Allow "Save 2 months" messaging alongside "Save 17%"

### 2.4 Free Tier (No Time Limit)

The Free tier is permanently available (not a trial). This is deliberate:
- It hooks freelancers who want to "just check" their tax; many will run computations annually and never pay
- The free computation is the product's core marketing — a user who sees ₱40,000 in savings from regime selection is highly motivated to share the tool
- Word-of-mouth acquisition cost is zero
- The Free tier is limited only by persistence (no history beyond 3) and output portability (no PDF export), not by computation quality

---

## 3. Billing Cycles — Detailed Mechanics

### 3.1 Period Boundaries

A billing period is defined by `subscriptions.current_period_start` and `subscriptions.current_period_end`. These are UTC timestamps.

**Monthly period calculation:**
```
current_period_end = current_period_start + INTERVAL '1 month'
```
Example: `current_period_start = 2026-03-15 00:00:00 UTC` → `current_period_end = 2026-04-15 00:00:00 UTC`

**Annual period calculation:**
```
current_period_end = current_period_start + INTERVAL '1 year'
```
Example: `current_period_start = 2026-03-15 00:00:00 UTC` → `current_period_end = 2027-03-15 00:00:00 UTC`

**Leap year handling:** The payment provider handles date arithmetic. For an annual subscription starting 2024-02-29, the period end is 2025-02-28 (provider normalizes to last day of month if the day doesn't exist in the target month).

### 3.2 Period Start on First Payment

- For self-serve checkout (no trial): `current_period_start` = timestamp of successful payment webhook receipt.
- For trial subscriptions: `current_period_start` = timestamp of trial-to-paid conversion (the day the provider charges the card, not the day the trial started).
- `trial_started_at` = timestamp when the trial was initiated (separate from `current_period_start`).

### 3.3 Renewal Timing

- Payment providers charge the card at `current_period_end` UTC.
- On successful renewal: provider sends webhook → `current_period_start` advances to previous `current_period_end`; new `current_period_end` calculated; `status` stays `ACTIVE`.
- On failed renewal: provider sends failure webhook → `status` moves to `PAST_DUE`; grace period begins (3 calendar days from `current_period_end`).

### 3.4 Cycle Switching (Monthly → Annual)

A PRO user on monthly billing who switches to annual billing:
1. User visits billing portal (`POST /billing/portal` → redirect to provider portal).
2. User selects annual plan in provider portal.
3. Provider immediately charges the prorated difference: `annual_price - (remaining_days_in_month / 30) × monthly_price`.
4. Provider sends webhook; `billing_cycle` updated to `ANNUAL`; new `current_period_end` = today + 12 months.
5. Cache invalidated.

Example proration (monthly PRO switching to annual PRO on day 15 of a 30-day month):
- Remaining monthly credit: `(15/30) × ₱200 = ₱100`
- Annual charge: `₱1,999 − ₱100 = ₱1,899` (charged immediately)
- New period: 12 months from today

### 3.5 Cycle Switching (Annual → Monthly)

Not supported mid-period. If a user wants to switch from annual to monthly:
1. The system does not allow the switch until the annual period ends.
2. The user may cancel the annual plan (subject to the 30-day refund policy) and re-subscribe monthly.
3. The billing portal shows: "Switching to monthly billing will take effect at your next renewal on {date}." (Provider schedules the change for next period.)

---

## 4. Trial Logic — Complete Business Rules

### 4.1 PRO Trial — Full Specification

| Property | Value |
|----------|-------|
| Duration | 14 calendar days from `trial_started_at` |
| Trial type | Card-required free trial (not a freemium feature unlock) |
| Card verification | ₱0 authorization hold (card verified, not charged) |
| Billing cycle choice | User selects monthly or annual at trial start; charge at trial end is at the selected cycle price |
| Trial-to-paid conversion day | Day 14 from `trial_started_at` (at the hour of `trial_ends_at`) |
| Cancellation before conversion | Allowed at any time; no charge; `status` → `CANCELLED`; `current_period_end` = `trial_ends_at`; plan reverts to FREE at that time |
| Re-trial eligibility | Not eligible if any prior subscription row exists with `trial_started_at IS NOT NULL AND plan = 'PRO'` (even if the prior trial ended in `EXPIRED`) |
| Features during trial | Full PRO feature set from moment `status = 'TRIALING'` |
| CTA text (trial-eligible) | "Start Free 14-Day Trial" |
| CTA text (trial-ineligible) | "Upgrade to Pro" |

**Trial email sequence (PRO):**

| Day | Trigger | Subject | Body summary |
|-----|---------|---------|-------------|
| Day 0 (trial start) | `trial_started_at` set | "Your Pro trial has started — here's what to explore" | Welcome. Lists the 5 key PRO features with links. Notes when trial ends. |
| Day 10 | `trial_ends_at - INTERVAL '4 days'` background job | "Your Pro trial ends in 4 days" | Reminder. Lists benefits. CTA: "Keep Pro — ₱200/month or ₱1,999/year". Cancel link. |
| Day 14 (trial end) | `trial_ends_at` background job | "Your Pro trial has ended" | Two variants: (a) if card charged successfully — "You've been billed ₱200. Your Pro subscription is active."; (b) if card failed — "We couldn't charge your card. Update your payment method to keep Pro features." |
| Day 17 (3 days post-expiry, if lapsed) | `trial_ends_at + INTERVAL '3 days'` background job | "Don't lose your saved computations" | Notes saved computations are retained but history is now limited. CTA: "Reactivate Pro". |

### 4.2 ENTERPRISE Trial — Full Specification

| Property | Value |
|----------|-------|
| Duration | 7 calendar days from `trial_started_at` |
| Trial type | Card-required free trial |
| Card verification | ₱0 authorization hold |
| Trial-to-paid conversion day | Day 7 from `trial_started_at` |
| Cancellation before conversion | No charge; reverts to PRO (if previously PRO) or FREE (if not) |
| Re-trial eligibility | Not eligible if prior ENTERPRISE trial row exists |
| Features during trial | Full ENTERPRISE feature set immediately |
| CTA text (trial-eligible) | "Start Free 7-Day Trial" |
| CTA text (trial-ineligible) | "Upgrade to Professional" |

**Trial email sequence (ENTERPRISE):**

| Day | Trigger | Subject | Body summary |
|-----|---------|---------|-------------|
| Day 0 (trial start) | `trial_started_at` set | "Your Professional trial has started" | Welcome. Highlights batch processing, API keys, CPA client management, white-label PDFs. How to apply for CPA role. |
| Day 5 | `trial_ends_at - INTERVAL '2 days'` background job | "Your Professional trial ends in 2 days" | Reminder. CTA: "Keep Professional — ₱1,499/month or ₱14,999/year". |
| Day 7 (trial end) | `trial_ends_at` background job | "Your Professional trial has ended" | Two variants: (a) billed — "You've been billed ₱1,499. Professional subscription active."; (b) failed — "Update payment method to keep Professional access." |
| Day 10 (3 days post-expiry, if lapsed) | `trial_ends_at + INTERVAL '3 days'` | "Reconnect with your clients on TaxKlaro" | Notes client data is retained. CTA: "Reactivate Professional". |

### 4.3 Trial Re-Entry Detection Algorithm

```
function is_trial_eligible(user_id: UUID, target_plan: 'PRO' | 'ENTERPRISE'): boolean

  count = db.query_scalar("""
    SELECT COUNT(*) FROM subscriptions
    WHERE user_id = $1
      AND plan = $2
      AND trial_started_at IS NOT NULL
  """, [user_id, target_plan])

  return count == 0
```

This function is called in two places:
1. On `GET /billing/subscription` response: the `trial_eligible_pro` and `trial_eligible_enterprise` boolean fields.
2. On `POST /billing/checkout` when `start_trial: true` is in the request body: if `is_trial_eligible` returns false, the API ignores `start_trial` and creates a direct-pay subscription instead. The response body includes `trial_started: false` and `reason: "TRIAL_ALREADY_USED"`.

### 4.4 In-App Trial Countdown Banners

Banners appear in the app header (below the nav bar) during the trial period. They are dismissible once per session but reappear on next login.

| Days remaining | Banner color | Text |
|---------------|-------------|------|
| > 7 days | Blue (info) | "Pro Trial: {N} days remaining. Your card will be charged ₱{price} on {date} unless you cancel." CTA: "Manage subscription →" |
| 4–7 days | Amber (warning) | "Your Pro trial ends in {N} days. Your card will be charged ₱{price} on {date}." CTA: "Manage subscription →" |
| 2–3 days | Orange (urgent) | "Your Pro trial ends in {N} days. Ensure your payment method is valid to keep Pro features." CTA: "Update payment method →" |
| 1 day | Red (critical) | "Your Pro trial ends TOMORROW. You'll be charged ₱{price} on {date}." CTA: "Cancel trial →" / "Keep Pro →" |
| Trial ended, card charged | Green (success, 24h display only) | "Your Pro subscription is now active. Welcome to Pro!" Dismissible permanently. |
| Trial ended, card failed | Red (persistent until resolved) | "Payment failed. Update your payment method to restore Pro features." CTA: "Update payment method →" |

---

## 5. Upgrade Flow — Step-by-Step

### 5.1 FREE → PRO (Self-Serve, Monthly)

```
Step 1: User visits /upgrade
  - Page shows PRO and ENTERPRISE pricing cards side by side
  - PRO card has "Monthly" / "Annual" toggle (default: Monthly)
  - If trial_eligible_pro = true: primary CTA = "Start Free 14-Day Trial"
  - If trial_eligible_pro = false: primary CTA = "Upgrade to Pro — ₱200/month"

Step 2: User clicks CTA
  - If anonymous: redirect to /auth/register?redirect=/upgrade
  - If authenticated: proceed

Step 3: Frontend calls POST /billing/checkout
  Request body:
    { "plan": "PRO", "billing_cycle": "MONTHLY", "start_trial": true|false }
  start_trial is true only if trial_eligible_pro = true and user intends to trial

Step 4: API creates payment provider checkout session
  - PayMongo: POST https://api.paymongo.com/v1/checkout_sessions
    with line_item referencing price ID pro_monthly_paymongo (see §7)
  - Returns checkout_session.attributes.checkout_url
  Response: { "checkout_url": "https://checkout.paymongo.com/cs_xxx" }

Step 5: Frontend redirects to checkout_url
  - User enters payment details on provider-hosted page
  - For trial: provider shows "₱0 charged today; ₱200 on {trial_end_date}"

Step 6: Provider redirects to success_url
  - success_url = "https://taxklaro.ph/upgrade/success?plan=PRO&session_id={session_id}"

Step 7: Provider sends webhook to POST /webhooks/paymongo or /webhooks/stripe
  - Webhook handler: updates subscriptions row, invalidates plan cache
  - Sets: plan='PRO', status='TRIALING' (or 'ACTIVE'), trial_started_at, trial_ends_at,
    current_period_start, current_period_end, billing_cycle='MONTHLY',
    provider='PAYMONGO', provider_subscription_id, provider_customer_id

Step 8: Success page renders at /upgrade/success
  - Shows: "You're now on Pro!" with feature highlights
  - Shows trial end date if trialing
  - CTA: "Start computing →" (→ /)
```

### 5.2 FREE → PRO (Self-Serve, Annual)

Same as §5.1 with `billing_cycle: "ANNUAL"`. Checkout shows ₱1,999 charge (or deferred for trial).

### 5.3 PRO → ENTERPRISE (Self-Serve)

```
Step 1: User visits /upgrade/enterprise (or clicks "Upgrade to Professional" from billing settings)

Step 2: Page shows:
  - "Upgrade to Professional" header
  - Monthly (₱1,499) / Annual (₱14,999) toggle
  - If trial_eligible_enterprise = true: "Start Free 7-Day Trial" CTA
  - If trial_eligible_enterprise = false: "Upgrade Now" CTA
  - Note about CPA role requirement for /clients endpoints

Step 3: Frontend calls POST /billing/checkout
  Request: { "plan": "ENTERPRISE", "billing_cycle": "MONTHLY"|"ANNUAL", "start_trial": true|false }

Step 4–8: Same as §5.1 with ENTERPRISE price IDs and amounts

Proration of remaining PRO days:
  - If user is mid-period on PRO, provider calculates credit automatically
  - Credit = (remaining_period_seconds / period_total_seconds) × pro_monthly_price
  - This credit is applied as a balance credit on the user's provider account
  - The first ENTERPRISE invoice is reduced by this credit amount
  - If credit > ENTERPRISE monthly price, the difference carries forward to the next invoice
```

### 5.4 ENTERPRISE (Contact Sales Flow)

For organizations preferring a sales conversation (recommended for 10+ clients):

```
Step 1: User visits /upgrade/enterprise
  - "Contact Sales" is the primary CTA
  - "Upgrade Now — No Sales Call Required" is secondary CTA

Step 2: User clicks "Contact Sales" → modal or redirect to /upgrade/enterprise/contact

Step 3: Contact form:
  Fields:
    - name: text, required, max 100 chars
    - email: email, required (pre-filled if logged in), max 200 chars
    - company_name: text, required, max 200 chars
    - client_count: select, required, options:
        "1–10 clients", "11–50 clients", "51–200 clients", "200+ clients"
    - message: textarea, optional, max 1000 chars
  Submit button: "Send Inquiry"

Step 4: POST /contact/sales
  Request: { name, email, company_name, client_count, message }
  Action:
    - Insert into sales_leads table (internal, not public schema)
    - Send email to enterprise@taxklaro.ph with lead details
    - Send acknowledgment email to the user's provided email address:
        Subject: "We received your TaxKlaro Professional inquiry"
        Body: "Thank you, {name}. Our team will respond within 1 Philippine business day
               (Mon–Fri, 8am–6pm PST). In the meantime, you can start a free 7-day trial
               of the Professional plan at: https://taxklaro.ph/upgrade/enterprise"
  Response: { "success": true }

Step 5: Acknowledgment page at /upgrade/enterprise/contact/success
  "Thanks! We'll be in touch within 1 business day."
```

---

## 6. Downgrade Flow — Step-by-Step

### 6.1 PRO → FREE (Cancel PRO)

```
Step 1: User visits /settings/billing
  - Shows current plan, billing cycle, next renewal date, amount
  - "Cancel Plan" link (red, secondary)

Step 2: User clicks "Cancel Plan"
  - Confirmation modal: "Are you sure? You'll keep Pro until {current_period_end}.
    After that, your plan reverts to Free.
    Your saved computations are retained but you'll only see the last 3."
  - CTA: "Yes, cancel my plan" / "Never mind"

Step 3: Frontend calls POST /billing/portal
  - Returns: { "portal_url": "https://billing.paymongo.com/p/xxx" }
  - Redirects to provider-hosted billing portal
  - User completes cancellation in provider portal

Step 4: Provider sends webhook (subscription.updated with cancel_at_period_end = true)
  - Webhook handler: sets subscriptions.status = 'CANCELLED'
  - plan remains 'PRO' until current_period_end
  - Cache invalidated

Step 5: In-app banner appears after redirect back to app:
  "Your Pro plan is cancelled. You'll have Pro access until {date}.
   Your computations won't be deleted."
  CTA: "Reactivate Pro"

Step 6: At current_period_end
  - Provider sends subscription.deleted webhook
  - Webhook handler: sets status = 'EXPIRED', plan = 'FREE'
  - Cache invalidated
  - All PRO-gated features become unavailable
```

### 6.2 ENTERPRISE → FREE or PRO (Cancel ENTERPRISE)

Same as §6.1 with ENTERPRISE-specific messaging. After cancellation:
- API keys are suspended (revoked_at set) when status becomes EXPIRED
- CPA client data is retained but /clients/* endpoints return 403 ERR_REQUIRES_ENTERPRISE
- The user's API keys retain their rows in api_keys table for potential re-activation on re-upgrade

---

## 7. PayMongo Product and Price Configuration

### 7.1 PayMongo Products

PayMongo organizes subscriptions via "billing plans" within the PayMongo Subscriptions API. The following billing plan IDs are used in production.

| Internal key | PayMongo Billing Plan ID | Description | Amount (centavos) | Interval |
|-------------|------------------------|-------------|------------------|---------|
| `pro_monthly_paymongo` | `bpln_taxopt_pro_monthly` | TaxKlaro Pro — Monthly | 20000 | month |
| `pro_annual_paymongo` | `bpln_taxopt_pro_annual` | TaxKlaro Pro — Annual | 199900 | year |
| `enterprise_monthly_paymongo` | `bpln_taxopt_ent_monthly` | TaxKlaro Professional — Monthly | 149900 | month |
| `enterprise_annual_paymongo` | `bpln_taxopt_ent_annual` | TaxKlaro Professional — Annual | 1499900 | year |

**PayMongo Webhook events handled:**

| Event type | Handler action |
|-----------|---------------|
| `payment.paid` | Update invoice row to `PAID`; if linked to subscription, update subscription status |
| `payment.failed` | Update invoice row to `FAILED`; if renewal, set subscription status to `PAST_DUE` |
| `subscription.created` | Create or update subscriptions row; set status, plan, period boundaries |
| `subscription.updated` | Update subscriptions row; handle cancellation, renewal, billing cycle change |
| `subscription.deleted` | Set status to `EXPIRED`, plan to `FREE`; suspend API keys |

**PayMongo Checkout Session creation (for upgrade flow):**

The server calls PayMongo's Create Checkout Session endpoint with these fixed parameters:

```json
{
  "data": {
    "attributes": {
      "billing": {
        "name": "{user.full_name}",
        "email": "{user.email}"
      },
      "line_items": [
        {
          "currency": "PHP",
          "amount": {centavo_amount_for_selected_plan_cycle},
          "name": "{plan_display_name}",
          "quantity": 1
        }
      ],
      "payment_method_types": ["card", "gcash", "maya", "dob", "brankas_landbank", "brankas_eastwest"],
      "success_url": "https://taxklaro.ph/upgrade/success?plan={plan}&session_id={CHECKOUT_SESSION_ID}",
      "cancel_url": "https://taxklaro.ph/upgrade?cancelled=true",
      "metadata": {
        "user_id": "{user.id}",
        "plan": "{plan}",
        "billing_cycle": "{billing_cycle}",
        "start_trial": "{true|false}"
      },
      "description": "TaxKlaro — {plan_display_name}"
    }
  }
}
```

`CHECKOUT_SESSION_ID` is PayMongo's literal template variable; it is replaced in the redirect URL by PayMongo with the actual session ID.

### 7.2 PayMongo Subscription Trial Setup

When `start_trial = true`:
- The checkout session's `metadata.trial_days` is set to `14` (PRO) or `7` (ENTERPRISE).
- PayMongo trial periods are configured on the billing plan via the `trial_period_days` parameter on the billing plan object.
- The PayMongo billing plan for trial-eligible checkouts uses separate plan IDs:

| Internal key | PayMongo Billing Plan ID | Trial days |
|-------------|------------------------|-----------|
| `pro_monthly_trial_paymongo` | `bpln_taxopt_pro_monthly_trial` | 14 |
| `pro_annual_trial_paymongo` | `bpln_taxopt_pro_annual_trial` | 14 |
| `enterprise_monthly_trial_paymongo` | `bpln_taxopt_ent_monthly_trial` | 7 |
| `enterprise_annual_trial_paymongo` | `bpln_taxopt_ent_annual_trial` | 7 |

---

## 8. Stripe Product and Price Configuration

Stripe is the secondary provider used for international users (non-PH billing addresses or user preference).

### 8.1 Stripe Products

| Internal key | Stripe Product ID | Stripe Price ID | Amount (centavos) | Interval |
|-------------|------------------|----------------|------------------|---------|
| `pro_monthly_stripe` | `prod_taxopt_pro` | `price_taxopt_pro_monthly` | 20000 | month |
| `pro_annual_stripe` | `prod_taxopt_pro` | `price_taxopt_pro_annual` | 199900 | year |
| `enterprise_monthly_stripe` | `prod_taxopt_ent` | `price_taxopt_ent_monthly` | 149900 | month |
| `enterprise_annual_stripe` | `prod_taxopt_ent` | `price_taxopt_ent_annual` | 1499900 | year |

Two Stripe products are used (one per plan). Each product has two prices (monthly and annual). Trial-eligible subscriptions use Stripe's built-in `trial_period_days` parameter on subscription creation (not separate price objects).

### 8.2 Stripe Subscription Creation Parameters

For Stripe subscriptions, the server calls Stripe's `POST /v1/subscriptions` or uses a Checkout Session. Checkout Sessions are preferred to avoid storing raw card data on our server.

**Stripe Checkout Session creation:**

```json
{
  "mode": "subscription",
  "line_items": [
    {
      "price": "{stripe_price_id}",
      "quantity": 1
    }
  ],
  "subscription_data": {
    "trial_period_days": 14,
    "metadata": {
      "user_id": "{user.id}",
      "plan": "{plan}",
      "billing_cycle": "{billing_cycle}"
    }
  },
  "customer_email": "{user.email}",
  "success_url": "https://taxklaro.ph/upgrade/success?plan={plan}&session_id={CHECKOUT_SESSION_ID}",
  "cancel_url": "https://taxklaro.ph/upgrade?cancelled=true",
  "metadata": {
    "user_id": "{user.id}"
  }
}
```

`trial_period_days` is omitted (or set to 0) when `start_trial = false`.

### 8.3 Stripe Webhook Events Handled

| Event type | Handler action |
|-----------|---------------|
| `checkout.session.completed` | Create/update subscription row from checkout session metadata |
| `customer.subscription.created` | Update subscriptions row with provider_subscription_id |
| `customer.subscription.updated` | Handle plan change, cancellation, trial conversion |
| `customer.subscription.deleted` | Set status = 'EXPIRED', plan = 'FREE'; suspend API keys |
| `invoice.paid` | Update invoice row to PAID; renew current_period_end |
| `invoice.payment_failed` | Update invoice row to FAILED; set subscription to PAST_DUE |

---

## 9. VAT Handling

### 9.1 VAT Registration Status

TaxKlaro is a Philippine VAT-registered entity. Digital services sold to Philippine consumers are subject to 12% VAT under the NIRC as amended. All listed prices are **VAT-inclusive** (gross price). This is the standard display practice for Philippine B2C digital products.

### 9.2 VAT Breakdown by Plan

| Plan | Billing Cycle | Gross Price (VAT-inclusive) | Net Price (excl. 12% VAT) | VAT Component |
|------|--------------|---------------------------|--------------------------|--------------|
| PRO | Monthly | ₱200.00 | ₱178.57 | ₱21.43 |
| PRO | Annual | ₱1,999.00 | ₱1,784.82 | ₱214.18 |
| ENTERPRISE | Monthly | ₱1,499.00 | ₱1,338.39 | ₱160.61 |
| ENTERPRISE | Annual | ₱14,999.00 | ₱13,392.00 | ₱1,607.00 |

**Formula:** Net = Gross ÷ 1.12; VAT = Gross − Net (rounded to 2 decimal places)

### 9.3 B2B VAT (ENTERPRISE invoices)

For ENTERPRISE subscribers who are themselves VAT-registered businesses:
- The invoice shows the full VAT breakdown (gross, net, VAT amount) for input VAT credit purposes.
- The subscriber's TIN is collected during ENTERPRISE checkout (optional for PRO, required for ENTERPRISE VAT invoice requests).
- TIN field in the checkout session: optional string field `tin` passed in `metadata`.
- If TIN is provided, the invoice PDF renders the TIN field in the billing details section.
- ORs (Official Receipts): TaxKlaro issues electronic ORs via the payment provider's receipt system. For ENTERPRISE subscribers requesting a formal BIR-registered OR, they must email billing@taxklaro.ph. Manual OR issuance takes 3 business days.

### 9.4 Pricing Display (VAT-inclusive Disclosure)

All pricing pages must display:
- "All prices are in Philippine Pesos (₱) and include 12% VAT."
- This text appears below the pricing cards in 12px gray text.
- On invoice documents, the VAT breakdown is shown in the line items section.

---

## 10. Invoice Format

### 10.1 Invoice Number Format

```
INV-{YYYYMMDD}-{6-digit-zero-padded-sequence}
```
Examples:
- `INV-20260315-000001` (first invoice on 2026-03-15)
- `INV-20260401-000047` (47th invoice on 2026-04-01)

The sequence number resets to `000001` each calendar day. The `invoices.invoice_number` column stores this value as a VARCHAR(30).

### 10.2 Invoice Line Items

Every invoice PDF contains these sections in order:

**Header:**
- TaxKlaro logo (top-left)
- "OFFICIAL RECEIPT" label (top-right)
- Invoice number
- Invoice date (YYYY-MM-DD)
- Due date (same as invoice date for prepaid subscriptions)

**Billing Details (left column):**
- Bill To: {user.full_name}
- Email: {user.email}
- TIN: {user.tin if provided, else "Not provided"}
- Address: {user.billing_address if provided, else blank row omitted}

**Seller Details (right column):**
- TaxKlaro
- billing@taxklaro.ph
- {company TIN: registered at time of issuance}
- {company registered address}

**Line Items table:**

| # | Description | Qty | Unit Price | Amount |
|---|-------------|-----|-----------|--------|
| 1 | TaxKlaro — {plan_display_name} ({billing_cycle_label}) | 1 | ₱{net_price} | ₱{net_price} |

Where:
- `plan_display_name` = "Pro" or "Professional"
- `billing_cycle_label` = "Monthly Subscription" or "Annual Subscription"
- `net_price` = VAT-exclusive amount (see §9.2)

**Totals section:**

| | Amount |
|-|--------|
| Subtotal (excl. VAT) | ₱{net_price} |
| VAT (12%) | ₱{vat_component} |
| **Total** | **₱{gross_price}** |
| Amount Paid | ₱{gross_price} |
| Balance Due | ₱0.00 |

**Footer:**
- "This is a system-generated official receipt."
- "For inquiries, contact billing@taxklaro.ph"
- "TaxKlaro is not a tax advisory firm. See taxklaro.ph/legal/disclaimer."

### 10.3 Invoice Delivery

- Invoice is created in the `invoices` table when the payment provider sends a successful payment webhook.
- Invoice PDF is generated and stored in Cloudflare R2 at path: `invoices/{user_id}/{invoice_number}.pdf`
- User can download invoices via `GET /billing/invoices` (lists all invoices) and `GET /billing/invoices/:id/download` (returns signed R2 URL).
- Invoice PDF download link expires after 24 hours; on each `GET /billing/invoices/:id/download` call, a fresh signed URL is generated.
- Invoice email is sent to the user's registered email within 5 minutes of the successful payment webhook.

---

## 11. Promo Codes and Discounts

### 11.1 Promo Code Database Schema

```sql
CREATE TABLE promo_codes (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    code           VARCHAR(30)  NOT NULL UNIQUE,         -- e.g., FREELANCER20
    description    VARCHAR(200) NOT NULL,                -- Internal description only
    discount_type  VARCHAR(10)  NOT NULL                 -- 'PERCENTAGE' or 'FIXED'
                   CHECK (discount_type IN ('PERCENTAGE', 'FIXED')),
    discount_value NUMERIC(10,2) NOT NULL,               -- 20 (for 20%) or 200.00 (for ₱200 off)
    applies_to_plan VARCHAR(20)  NOT NULL                 -- 'PRO', 'ENTERPRISE', or 'ANY'
                   CHECK (applies_to_plan IN ('PRO', 'ENTERPRISE', 'ANY')),
    applies_to_cycle VARCHAR(10) NOT NULL                 -- 'MONTHLY', 'ANNUAL', or 'ANY'
                   CHECK (applies_to_cycle IN ('MONTHLY', 'ANNUAL', 'ANY')),
    max_uses       INTEGER      NOT NULL DEFAULT 0,       -- 0 = unlimited
    current_uses   INTEGER      NOT NULL DEFAULT 0,
    valid_from     TIMESTAMPTZ  NOT NULL,
    valid_until    TIMESTAMPTZ  NOT NULL,
    active         BOOLEAN      NOT NULL DEFAULT true,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

### 11.2 Promo Code Validation Rules

```
function validate_promo_code(code: string, plan: 'PRO' | 'ENTERPRISE', billing_cycle: 'MONTHLY' | 'ANNUAL'): PromoCodeResult

  row = db.query_one("SELECT * FROM promo_codes WHERE code = UPPER($1)", [code])
  if row IS NULL:
    return { valid: false, error: "INVALID_CODE", message: "This promo code is not valid." }

  now = UTC_NOW()
  if NOT row.active:
    return { valid: false, error: "CODE_INACTIVE", message: "This promo code is no longer active." }
  if now < row.valid_from:
    return { valid: false, error: "CODE_NOT_YET_VALID", message: "This promo code is not yet active." }
  if now > row.valid_until:
    return { valid: false, error: "CODE_EXPIRED", message: "This promo code has expired." }
  if row.max_uses > 0 AND row.current_uses >= row.max_uses:
    return { valid: false, error: "CODE_EXHAUSTED", message: "This promo code has reached its maximum use limit." }
  if row.applies_to_plan != 'ANY' AND row.applies_to_plan != plan:
    return { valid: false, error: "CODE_WRONG_PLAN", message: "This promo code is not valid for the {plan} plan." }
  if row.applies_to_cycle != 'ANY' AND row.applies_to_cycle != billing_cycle:
    return { valid: false, error: "CODE_WRONG_CYCLE", message: "This promo code is only valid for {applicable_cycle} billing." }

  # Compute discounted amount
  base_price = PRICE_TABLE[plan][billing_cycle]  # from §1.1
  if row.discount_type == 'PERCENTAGE':
    discount_amount = ROUND(base_price × (row.discount_value / 100), 2)
    discounted_price = base_price - discount_amount
  else:  # FIXED
    discount_amount = MIN(row.discount_value, base_price)  # never discount below ₱0
    discounted_price = base_price - discount_amount

  return {
    valid: true,
    code: row.code,
    discount_type: row.discount_type,
    discount_value: row.discount_value,
    discount_amount: discount_amount,
    discounted_price: discounted_price,
    original_price: base_price
  }
```

### 11.3 Promo Code Application at Checkout

When a promo code is applied:
1. Frontend calls `POST /billing/validate-promo` with `{ code, plan, billing_cycle }` before calling `POST /billing/checkout`. Displays discounted price in UI.
2. On `POST /billing/checkout`, if `promo_code` field is provided, server validates again (server-side) and applies the coupon via the payment provider's API:
   - PayMongo: `coupon_id` parameter on the checkout session
   - Stripe: `coupon` parameter on the checkout session
3. The payment provider handles the discount at checkout; TaxKlaro does not manually adjust invoice amounts.
4. After successful payment, `promo_codes.current_uses` is incremented atomically:
   ```sql
   UPDATE promo_codes SET current_uses = current_uses + 1 WHERE code = $1
   ```

### 11.4 Launch Promo Codes

The following promo codes are configured at launch:

| Code | Type | Value | Applies to | Cycle | Max Uses | Valid Until | Description |
|------|------|-------|-----------|-------|---------|------------|-------------|
| `FREELANCER20` | PERCENTAGE | 20% | ANY | ANNUAL | 500 | 2026-12-31 | 20% off annual plans for first 500 users — launch promo |
| `CPA2026` | PERCENTAGE | 25% | ENTERPRISE | ANY | 100 | 2026-06-30 | 25% off Enterprise for CPAs — H1 2026 launch promo |
| `TRYITOUT` | FIXED | ₱200 | PRO | ANNUAL | 1000 | 2026-12-31 | ₱200 off annual Pro — equivalent to 1 free month |
| `BIRSEASON` | PERCENTAGE | 15% | PRO | MONTHLY | 300 | 2026-04-30 | 15% off monthly Pro during April filing season |

---

## 12. Refund Policy — Complete Rules

### 12.1 30-Day Money-Back Guarantee (Annual Plans Only)

| Property | Value |
|----------|-------|
| Eligible plans | PRO Annual (₱1,999) and ENTERPRISE Annual (₱14,999) only |
| Ineligible plans | PRO Monthly (₱200) and ENTERPRISE Monthly (₱1,499) |
| Claim window | Within 30 calendar days of the invoice date of the annual payment |
| Request channel | Email to support@taxklaro.ph with subject line "Refund Request" and account email in body |
| Response time | 5 Philippine business days |
| Refund amount | Full amount of the annual payment charged. No pro-rata deduction. |
| Refund method | Refunded to the original payment method (card, GCash, Maya) |
| Subscription after refund | Status set to `EXPIRED` immediately; plan reverts to `FREE` |
| Data after refund | Saved computations retained per 90-day retention policy. API keys suspended. |
| One-refund limit | A user who received a money-back refund may not claim another money-back refund on any future annual plan purchase. The `subscriptions` table records `refund_claimed_at` on the refunded row. On subsequent annual purchases, the refund guarantee is not offered. |
| Display in UI | "30-day money-back guarantee" badge on annual plan pricing card. Tooltip: "Not satisfied? Email us within 30 days of purchase for a full refund. Available once per account on annual plans." |

### 12.2 Monthly Plan Refund Policy

Monthly plans are non-refundable. The user retains access until the end of the paid period. This policy is displayed on the pricing page and in the checkout confirmation:

"Monthly subscriptions are non-refundable. You will retain access to Pro features until {end_of_period}."

### 12.3 Trial Cancellation (No Charge)

Cancelling a trial before `trial_ends_at` results in zero charge. This is not a "refund" — no money changes hands. The user is notified:

"Your trial has been cancelled. You will not be charged. You've been moved to the Free plan."

### 12.4 Fraudulent Charge Disputes

If a user files a payment dispute (chargeback) with their bank or payment provider:
- The subscription is immediately suspended (`status = 'PAST_DUE'`).
- TaxKlaro responds to the dispute with the user's purchase record.
- If the dispute is resolved against TaxKlaro (chargeback granted): subscription is set to `EXPIRED`.
- If the dispute is resolved in TaxKlaro's favor: subscription resumes per normal rules.
- Users who file fraudulent chargebacks are flagged in the internal `users.fraud_flag` field and may be banned from re-subscribing.

---

## 13. Payment Method Routing Logic

### 13.1 Provider Selection Algorithm

The server determines which payment provider to use for each checkout session:

```
function select_payment_provider(user: User, payment_method_hint: string | null): 'PAYMONGO' | 'STRIPE'

  # 1. Explicit hint from user (user selected a payment method on the pricing page)
  if payment_method_hint in ['gcash', 'maya', 'dob', 'brankas_landbank', 'brankas_eastwest']:
    return 'PAYMONGO'  # These methods are only available on PayMongo

  # 2. PH billing address or PH phone number → prefer PayMongo
  if user.billing_country == 'PH' OR user.phone_country_code == '+63':
    return 'PAYMONGO'

  # 3. No country signal → default PayMongo (primary for PH market)
  if payment_method_hint IS NULL OR payment_method_hint == 'credit_card':
    return 'PAYMONGO'

  # 4. Explicit Stripe request (international card, international billing address)
  if payment_method_hint == 'stripe_card':
    return 'STRIPE'

  # Default fallback
  return 'PAYMONGO'
```

### 13.2 Payment Methods Available by Provider

| Payment Method | PayMongo | Stripe |
|---------------|---------|--------|
| Visa/Mastercard credit card | Yes | Yes |
| GCash | Yes | No |
| Maya (PayMaya) | Yes | No |
| BancNet debit | Yes (via DOB) | No |
| BDO Online Banking | Yes (via Brankas) | No |
| Landbank Online | Yes (via Brankas) | No |
| East West Bank Online | Yes (via Brankas) | No |
| Apple Pay / Google Pay | No (not yet supported by PayMongo PH) | No (not enabled) |
| PayPal | No | No |
| BNPL (GCredit, BillEase) | No | No |

### 13.3 Payment Method Display on Pricing Page

The pricing page `/upgrade` shows payment method logos below the pricing cards:

```
Accepted payments:
[VISA] [Mastercard] [GCash] [Maya] [BancNet]
```

Text below logos: "Secure checkout via PayMongo. International cards also accepted."

---

## 14. Failed Payment and Dunning Sequence

### 14.1 Initial Payment Failure

When `invoice.payment_failed` (Stripe) or `payment.failed` (PayMongo) webhook is received for a renewal:

1. `subscriptions.status` → `PAST_DUE`
2. `invoices.status` → `FAILED`
3. Grace period begins: `grace_end = current_period_end + INTERVAL '3 days'`
4. Cache invalidated
5. Email sent immediately:

**Email — Payment Failed:**
- Subject: "Payment failed for your TaxKlaro {plan} subscription"
- Body: "We couldn't process your payment of ₱{amount} on {date}. We'll try again within 3 days. Update your payment method at: https://taxklaro.ph/settings/billing. You'll keep full access to {plan} features during this time."

### 14.2 Dunning Retry Schedule

The payment provider handles retries. TaxKlaro configures the following retry logic:

| Retry | Timing | Notes |
|-------|--------|-------|
| Retry 1 | 1 day after initial failure | Provider attempts charge automatically |
| Retry 2 | 2 days after initial failure | Provider attempts charge automatically |
| Retry 3 | 3 days after initial failure (grace period end) | Final retry; if this fails, subscription expires |

### 14.3 Grace Period Expiry

If all retries fail within 3 days:
1. Provider sends `subscription.deleted` or final `payment.failed` webhook.
2. `subscriptions.status` → `EXPIRED`; `subscriptions.plan` → `FREE`
3. Cache invalidated.
4. Email sent:

**Email — Subscription Expired:**
- Subject: "Your TaxKlaro {plan} subscription has ended"
- Body: "We couldn't process payment after 3 attempts. Your subscription has ended and you've been moved to the Free plan. Your saved computations are retained. Reactivate at: https://taxklaro.ph/upgrade"

### 14.4 In-App Dunning Banners

| Status | Banner |
|--------|--------|
| PAST_DUE (day 1) | Amber: "Payment failed. We'll retry in 2 days. Update your payment method to avoid service interruption." CTA: "Update Payment Method" |
| PAST_DUE (day 2) | Orange: "Payment failed. Final retry tomorrow. Update your payment method now." CTA: "Update Payment Method" |
| PAST_DUE (day 3) | Red: "Final payment attempt today. Update your payment method immediately." CTA: "Update Payment Method — Urgent" |
| EXPIRED (from PAST_DUE) | Red: "Your {plan} subscription has ended due to payment failure. Reactivate to restore access." CTA: "Reactivate {plan}" |

---

## 15. Pricing Display Rules (Frontend)

### 15.1 Pricing Page Layout

The pricing page (`/upgrade`) has two sections:
1. **Billing cycle toggle** at top: "Monthly" / "Annual" (pill toggle; default: Monthly). Switching the toggle updates all prices simultaneously with a smooth fade animation (200ms).
2. **Pricing cards** — three cards side by side (on desktop; stacked on mobile):
   - Card 1: FREE
   - Card 2: PRO (highlighted with "Most Popular" badge)
   - Card 3: ENTERPRISE / Professional

**Annual toggle state:** When "Annual" is selected, the PRO and ENTERPRISE cards show:
- Large price: ₱1,999/year (PRO) or ₱14,999/year (ENTERPRISE)
- Small subtext: "₱166/month effective" (PRO) or "₱1,250/month effective" (ENTERPRISE)
- Green badge: "Save 17%"

**Monthly toggle state:**
- Large price: ₱200/month (PRO) or ₱1,499/month (ENTERPRISE)
- No savings badge

### 15.2 Pricing Card Content

**FREE card:**
```
Free
₱0 / month

[Get Started Free]  ← CTA (outline button)

Includes:
✓ All 3 tax regime computations
✓ Regime comparison & recommendation
✓ Quarterly & annual mode
✓ BIR form recommendation
✓ Filing deadline calendar
✓ 10 saves/month
✓ Last 3 computations in history
✓ 7-day share links
─────────────────────────
✗ PDF export
✗ Unlimited history
✗ Quarterly tracking dashboard
✗ CWT manager
```

**PRO card (Most Popular badge, primary color border):**
```
Pro                             [Most Popular]
₱200 / month

[Start Free 14-Day Trial]  ← CTA (filled primary button, if trial eligible)
[Upgrade to Pro — ₱200/month]  ← CTA (if trial ineligible)

Everything in Free, plus:
✓ Unlimited saves
✓ Full computation history
✓ Year-over-year comparison
✓ PDF export (5 types)
✓ Quarterly tracking dashboard
✓ Form 2307 CWT manager (up to 50 entries)
✓ 1-day & 7-day deadline reminders
✓ 30-day share links
─────────────────────────
✗ Batch processing
✗ API access
✗ White-label PDFs
✗ CPA client management

30-day money-back guarantee (annual only)
```

**ENTERPRISE card:**
```
Professional
₱1,499 / month

[Contact Sales]  ← CTA (filled button)
[Upgrade Now]  ← secondary CTA (text link, self-serve option)

Everything in Pro, plus:
✓ Batch processing (50 items/batch)
✓ REST API access (up to 5 API keys)
✓ White-label PDF exports
✓ CPA client management (unlimited clients)
✓ Unlimited Form 2307 entries
✓ Priority support (1 business day SLA)
✓ 365-day share links
✓ 365-day PDF download links

30-day money-back guarantee (annual only)
```

### 15.3 VAT Disclosure Text

Below the pricing cards (12px, gray-500 color):
"All prices are in Philippine Pesos (₱) and include 12% VAT. Annual plans include a 30-day money-back guarantee."

### 15.4 Savings Callout (Annual Toggle Active)

When the annual toggle is active, display a green banner above the pricing cards:
"🎉 Save up to ₱2,989/year on the annual plan — equivalent to 2 months free."

(The ₱2,989 figure is the ENTERPRISE annual savings; this is used as the headline since it's the higher absolute number.)

---

## 16. Analytics and Conversion Tracking

### 16.1 Funnel Events

The following events are fired to the analytics layer (PostHog) at each step of the upgrade funnel. All events include `user_id` (if authenticated), `session_id`, `plan`, `billing_cycle`, and `source` (the upgrade source parameter from §7.2 of tiers.md).

| Event name | When fired | Properties |
|-----------|-----------|-----------|
| `pricing_page_viewed` | User visits /upgrade | `source`, `is_authenticated`, `current_plan` |
| `billing_cycle_toggled` | User clicks Monthly/Annual toggle | `new_cycle`, `old_cycle` |
| `upgrade_cta_clicked` | User clicks a plan CTA button | `plan`, `billing_cycle`, `cta_type` (trial/upgrade/contact_sales), `source` |
| `checkout_started` | `POST /billing/checkout` called successfully | `plan`, `billing_cycle`, `provider`, `start_trial`, `promo_code` |
| `checkout_completed` | Provider success webhook received | `plan`, `billing_cycle`, `provider`, `amount_paid_php`, `trial_started` |
| `checkout_cancelled` | User returns via cancel_url | `plan`, `billing_cycle` |
| `trial_started` | Subscription status set to TRIALING | `plan`, `billing_cycle` |
| `trial_converted` | Trial-to-paid conversion webhook received | `plan`, `billing_cycle`, `amount_php` |
| `trial_cancelled` | User cancels trial before end | `plan`, `days_remaining` |
| `trial_expired_no_conversion` | Trial ends without payment | `plan` |
| `plan_cancelled` | User cancels subscription | `plan`, `billing_cycle`, `days_until_expiry` |
| `plan_expired` | Subscription moves to EXPIRED | `plan`, `reason` (payment_failure/cancellation/trial_no_pay) |
| `plan_reactivated` | Expired user re-subscribes | `plan`, `billing_cycle` |
| `refund_requested` | Support receives refund email | `plan`, `days_since_purchase` |
| `upgrade_modal_shown` | Upgrade modal displayed | `feature`, `user_plan`, `source` |
| `upgrade_modal_dismissed` | User dismisses upgrade modal | `feature`, `user_plan` |
| `promo_code_applied` | Valid promo code applied at checkout | `code`, `discount_type`, `discount_amount` |
| `promo_code_invalid` | Invalid promo code entered | `code`, `error_code` |

### 16.2 Key Conversion Metrics

The following metrics are tracked in the analytics dashboard:

| Metric | Definition | Target (Year 1) |
|--------|-----------|----------------|
| Free → Pro conversion rate | % of registered Free users who upgrade to Pro within 30 days of first use | 8% |
| Pro → Enterprise conversion rate | % of Pro users who upgrade to Enterprise within 90 days | 5% |
| Trial-to-paid conversion rate | % of trial starts that convert to paid subscription | 60% |
| Monthly → Annual conversion rate | % of monthly subscribers who switch to annual within 6 months | 25% |
| Churn rate (monthly) | % of paid subscribers who cancel each month | < 5% |
| MRR (monthly recurring revenue) | Sum of all active monthly charges | ₱500,000 (12 months post-launch target) |
| ARPU (average revenue per user) | MRR / total paid subscribers | ₱350 |
| Payback period | CAC / ARPU | < 3 months |

---

## 17. Database Columns for Pricing State

The `subscriptions` table columns that are specific to pricing and billing:

| Column | Type | Description | Constraint |
|--------|------|-------------|-----------|
| `plan` | VARCHAR(20) | Current plan | NOT NULL; CHECK IN ('FREE','PRO','ENTERPRISE') |
| `billing_cycle` | VARCHAR(10) | Billing cycle | NULL for FREE; CHECK IN ('MONTHLY','ANNUAL') |
| `status` | VARCHAR(20) | Subscription status | NOT NULL; CHECK IN ('ACTIVE','TRIALING','PAST_DUE','CANCELLED','EXPIRED') |
| `monthly_price_php` | NUMERIC(10,2) | Price charged per period in PHP | NULL for FREE; matches §1.1 |
| `current_period_start` | TIMESTAMPTZ | Start of current billing period | NULL for FREE |
| `current_period_end` | TIMESTAMPTZ | End of current billing period | NULL for FREE |
| `trial_started_at` | TIMESTAMPTZ | When trial began | NULL if no trial started |
| `trial_ends_at` | TIMESTAMPTZ | When trial ends | NULL if no trial |
| `cancelled_at` | TIMESTAMPTZ | When user initiated cancellation | NULL if not cancelled |
| `cancel_at_period_end` | BOOLEAN | Whether cancellation takes effect at period end | NOT NULL DEFAULT false |
| `provider` | VARCHAR(20) | Payment provider | NULL for FREE; CHECK IN ('PAYMONGO','STRIPE') |
| `provider_customer_id` | VARCHAR(100) | Provider's customer ID | NULL for FREE |
| `provider_subscription_id` | VARCHAR(100) | Provider's subscription ID | NULL for FREE |
| `promo_code_used` | VARCHAR(30) | Promo code applied at checkout | NULL if none |
| `discount_amount_php` | NUMERIC(10,2) | Discount applied at checkout | NOT NULL DEFAULT 0.00 |
| `refund_claimed_at` | TIMESTAMPTZ | When money-back refund was issued | NULL if never refunded |

See [database/schema.md §5](../database/schema.md) for the full DDL including all columns, constraints, indexes, and foreign keys.

---

## 18. Pricing Invariants

These invariants must hold at all times in the system:

| ID | Invariant |
|----|-----------|
| PRICE-V01 | `monthly_price_php` for PRO monthly = 200.00 exactly. |
| PRICE-V02 | `monthly_price_php` for PRO annual = 1999.00 exactly. |
| PRICE-V03 | `monthly_price_php` for ENTERPRISE monthly = 1499.00 exactly. |
| PRICE-V04 | `monthly_price_php` for ENTERPRISE annual = 14999.00 exactly. |
| PRICE-V05 | `monthly_price_php` for FREE = NULL (no price stored). |
| PRICE-V06 | All centavo amounts sent to payment providers match §1.3 exactly. |
| PRICE-V07 | Annual savings displayed in the UI are hardcoded: PRO = ₱401, ENTERPRISE = ₱2,989. Never computed dynamically from price columns. |
| PRICE-V08 | A trial subscription (`status = 'TRIALING'`) always has `monthly_price_php` set to the amount that will be charged on conversion — not zero. The ₱0 charge at trial start is handled by the provider; the DB records the post-trial price. |
| PRICE-V09 | `promo_codes.current_uses` is incremented atomically in a transaction with the invoice creation. No promo code can be used more than `max_uses` times even under concurrent requests (atomic UPDATE with WHERE clause check). |
| PRICE-V10 | `refund_claimed_at IS NOT NULL` on any subscription row blocks future money-back guarantee eligibility for that user_id. |
| PRICE-V11 | The `discount_amount_php` on the subscriptions row equals the `discount_amount` returned by `validate_promo_code` at checkout time. If no promo code was used, `discount_amount_php = 0.00`. |
| PRICE-V12 | VAT amounts in invoices are computed as: `vat = ROUND(gross / 1.12 × 0.12, 2)`. The net + vat sum equals gross within ±₱0.01 rounding tolerance. |
| PRICE-V13 | An ENTERPRISE subscriber who lapses to FREE has their API keys suspended (not deleted). `api_keys.revoked_at IS NOT NULL` for all their keys after the `EXPIRED` webhook is processed. |
| PRICE-V14 | Promo codes with `discount_type = 'FIXED'` never reduce the price below ₱0.00. The minimum discounted price is ₱0.00 (which would effectively make the period free, though this should not occur in production). |
