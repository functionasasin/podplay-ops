# Premium Tiers — Philippine Freelance & Self-Employed Income Tax Optimizer

**Status:** COMPLETE
**Last updated:** 2026-03-02
**Cross-references:**
- API permission matrix: [api/auth.md §6.3](../api/auth.md)
- Subscription database schema: [database/schema.md §5](../database/schema.md)
- Rate limits per tier: [api/endpoints.md §5](../api/endpoints.md)
- Pricing copy: [frontend/copy.md §3.4, §12](../frontend/copy.md)
- Billing API endpoints: [api/endpoints.md §13](../api/endpoints.md)
- Professional features (B2B detail): [premium/professional-features.md](professional-features.md)
- Pricing rationale and billing cycles: [premium/pricing.md](pricing.md)
- Feature matrix (cross-reference table): [premium/features-by-tier.md](features-by-tier.md)

---

## Table of Contents

1. [Tier Overview](#1-tier-overview)
2. [Free Tier — Exact Features](#2-free-tier--exact-features)
3. [Pro Tier — Exact Features](#3-pro-tier--exact-features)
4. [Enterprise (Professional) Tier — Exact Features](#4-enterprise-professional-tier--exact-features)
5. [Quantified Limits Per Tier](#5-quantified-limits-per-tier)
6. [API-Level Gate Enforcement](#6-api-level-gate-enforcement)
7. [Frontend Gate Behavior](#7-frontend-gate-behavior)
8. [Plan Resolution Algorithm](#8-plan-resolution-algorithm)
9. [Trial Logic](#9-trial-logic)
10. [Upgrade and Downgrade Rules](#10-upgrade-and-downgrade-rules)
11. [Subscription State Transitions](#11-subscription-state-transitions)
12. [Grace Period and Lapse Behavior](#12-grace-period-and-lapse-behavior)
13. [Billing Cycle Definitions](#13-billing-cycle-definitions)
14. [Payment Providers](#14-payment-providers)
15. [30-Day Money-Back Guarantee](#15-30-day-money-back-guarantee)
16. [Enterprise Contact-Sales Flow](#16-enterprise-contact-sales-flow)
17. [Validation Invariants](#17-validation-invariants)

---

## 1. Tier Overview

Three subscription tiers exist: **FREE**, **PRO**, and **ENTERPRISE**. The tiers are cumulative: PRO includes everything in FREE, and ENTERPRISE includes everything in PRO.

| Property | FREE | PRO | ENTERPRISE |
|----------|------|-----|------------|
| Internal enum value | `FREE` | `PRO` | `ENTERPRISE` |
| Display name | Free | Pro | Professional |
| Monthly price | ₱0 | ₱200 | ₱1,499 |
| Annual price | ₱0 | ₱1,999 | ₱14,999 |
| Trial | None | 14 days | 7 days |
| Target user | Individual freelancer (one-time compute) | Freelancer who files quarterly or wants records | CPA, bookkeeper, multi-client professional |
| Sign-up flow | Anonymous compute allowed; free account optional | Upgrade from Free or start trial at registration | Contact sales or upgrade from Pro; CPA role required for client features |
| Requires CPA role | No | No | No (for API/batch/white-label); Yes (for `/clients/*` endpoints) |

**Important: "FREE" does not mean "guest-only".** A registered user with no paid subscription has `plan = 'FREE'`. An anonymous user (not logged in) is also subject to FREE-tier rate limits. The distinction between "anonymous FREE" and "authenticated FREE" matters only for compute rate limits and the 10-save-per-month limit (see §5).

---

## 2. Free Tier — Exact Features

### 2.1 Core Tax Computation Engine

All three computation paths (A: Graduated + Itemized, B: Graduated + OSD, C: 8% Flat Rate) are available with no restriction. The computation engine is fully available to all users including anonymous users. No features of the tax math engine are gated behind a paid tier.

| Feature | Available on FREE? | Notes |
|---------|-------------------|-------|
| Path A (Graduated + Itemized Deductions) computation | Yes | Full engine, all 19 deduction categories |
| Path B (Graduated + OSD) computation | Yes | Full engine |
| Path C (8% Flat Rate) computation | Yes | Full engine including eligibility check |
| All-three-regime comparison with recommendation | Yes | Core differentiator — never gated |
| Annual mode (Form 1701 / 1701A) | Yes | |
| Quarterly mode (Form 1701Q / 2551Q) | Yes | |
| Penalty computation (late filing, surcharges, interest, compromise) | Yes | |
| Mixed-income earner computation | Yes | |
| VAT-registered taxpayer computation | Yes | |
| CWT offset computation (Form 2307 entries) | Yes | Up to 10 entries (see §5) |
| Prior quarterly payments input | Yes | Up to 3 quarterly payment entries |
| Regime comparison savings display (₱X saved vs next-best path) | Yes | |
| Manual Review Flag display | Yes | |
| BIR form recommendation (which form to file) | Yes | |
| Filing deadline display | Yes | |
| EOPT taxpayer tier classification display | Yes | |
| Anonymous compute (no account required) | Yes | Rate-limited by IP |

### 2.2 Account and Persistence Features

| Feature | Available on FREE? | Notes |
|---------|-------------------|-------|
| Create account | Yes | Email/password or Google OAuth |
| Save computation to account | Yes, limited | Max 10 saves per calendar month (see §5.4) |
| View saved computation history | Yes, limited | View last 3 saved computations only |
| Delete saved computations | Yes | Can delete any of the 3 visible |
| Re-run saved computation with new inputs | Yes | |
| PDF export of computation summary | No | PRO feature |
| Share computation URL (read-only link) | Yes | Links expire in 7 days for FREE (30 days for PRO, 365 days for ENTERPRISE) |
| Email notifications for BIR deadlines | Yes | 7-day advance email for all quarterly and annual deadlines; preference toggleable |
| Multiple device access | Yes | Session-based; login from any device |

### 2.3 What FREE Does NOT Include

The following features are explicitly unavailable on FREE and show an upgrade prompt when accessed:

- Full computation history (beyond last 3 saves)
- PDF export of computation summary
- Quarterly tracking dashboard (deadline tracker with per-quarter status)
- Form 2307 CWT manager (persistent list; free users enter CWT inline in the wizard only, not as a saved manager)
- More than 10 Form 2307 entries per computation
- Batch computation (multiple clients in one session)
- API key access for programmatic integration
- White-label PDF exports
- CPA client management (even with CPA role)
- Priority support

---

## 3. Pro Tier — Exact Features

PRO includes everything in FREE plus the following additions.

### 3.1 Persistence and History

| Feature | PRO Behavior |
|---------|-------------|
| Save computation to account | Unlimited saves (no monthly limit) |
| View computation history | Full unlimited history; all saved computations visible |
| Filter history by tax year | Yes (all years) |
| Sort history (recent / oldest / highest tax / lowest tax) | Yes |
| Delete computations | Yes (any; with confirmation) |
| Re-run any historical computation | Yes |
| Year-over-year comparison view | Yes (comparison of tax across years for same regime) |

### 3.2 PDF Export

| Property | Value |
|----------|-------|
| Feature availability | PRO and above only |
| Export trigger | `POST /computations/:id/exports` |
| Export types available | `SUMMARY`, `FORM_1701_PREFILL`, `FORM_1701A_PREFILL`, `FORM_1701Q_PREFILL`, `CWT_SCHEDULE` |
| Download link expiry | 30 days from export generation |
| Branding on PDF | TaxOptimizer PH logo and footer. Enterprise-only option to replace with white-label logo. |
| File format | PDF (A4 portrait) |
| Multiple exports per computation | Yes; each export creates a new `pdf_exports` row |
| Storage | Stored in object storage (Cloudflare R2); accessible via signed URL |

**PDF export types detail:**

| Type code | Display name | Contents |
|-----------|-------------|----------|
| `SUMMARY` | Tax Computation Summary | Full regime comparison table, recommended path, tax due, credits breakdown, balance payable/refundable, filing instructions, disclaimer |
| `FORM_1701_PREFILL` | Form 1701 Pre-fill | BIR Form 1701 fields pre-populated from computation output. User still files via eBIRForms or BIR portal; this is a reference document. |
| `FORM_1701A_PREFILL` | Form 1701A Pre-fill | BIR Form 1701A fields pre-populated (for 8% or OSD filers) |
| `FORM_1701Q_PREFILL` | Form 1701Q Pre-fill | BIR Form 1701Q fields for the relevant quarter |
| `CWT_SCHEDULE` | Form 2307 Schedule | Tabulated list of all Form 2307 entries with ATC, payor, amount, and withholding tax; formatted for BIR SAWT submission reference |

### 3.3 Quarterly Tracking and Reminders

| Feature | PRO Behavior |
|---------|-------------|
| Quarterly tracking dashboard | Yes; shows all four quarters + annual status for each tax year |
| Per-quarter filing status (Not Filed / Filed / Payment Confirmed) | Yes; user-updatable |
| Days-until-deadline countdown | Yes; per-quarter, per-form type |
| Email reminder 7 days before deadline | Yes (all forms: 1701Q, 2551Q, 1701A) |
| Email reminder 1 day before deadline | Yes |
| Payment tracking (mark as paid with reference number) | Yes |
| Dashboard computation timeline (quarterly → annual chain) | Yes |

### 3.4 Form 2307 CWT Manager

| Property | FREE | PRO |
|----------|------|-----|
| CWT entry input in wizard | Up to 10 entries | Up to 50 entries |
| Persistent CWT manager (outside wizard) | No | Yes |
| Saved CWT entries per account | 0 (wizard only, not saved separately) | Unlimited (associated with computations) |
| Bulk import CWT entries | No | No (manual entry only; see ENTERPRISE for batch) |
| Export CWT schedule as PDF | No | Yes (CWT_SCHEDULE export type) |

**CWT manager behavior:** In PRO, the CWT manager is a persistent list of Form 2307 entries associated with a saved computation. When the user runs a new computation, they can import CWT entries from a prior computation or start fresh. The manager shows: payor name, TIN, period covered, ATC code, income payment amount, tax withheld amount, withholding tax type (IT or PT), and the derived quarterly credit amounts.

### 3.5 Rate Limits on PRO

| Endpoint group | PRO limit |
|---------------|-----------|
| `POST /compute` per hour | 200 |
| `POST /compute` per day | 1,000 |
| All other endpoints per minute | 120 |

---

## 4. Enterprise (Professional) Tier — Exact Features

ENTERPRISE includes everything in PRO plus the following additions.

### 4.1 Batch Computation

| Property | Value |
|----------|-------|
| Endpoint | `POST /batch/computations` |
| Max items per batch | 50 |
| Max concurrent batches per account | 5 |
| Batch processing mode | Asynchronous; returns `batch_id` immediately |
| Poll for status | `GET /batch/:batch_id` |
| Retrieve results | `GET /batch/:batch_id/results` (cursor-paginated, max 100 items per page) |
| Result retention | 30 days from completion |
| Failed-item handling | Items that fail engine validation are reported in results with `status: "FAILED"` and the full error list; other items continue processing |
| Batch labeling | `label_prefix` applied to auto-generated labels; each item can have its own `label` and `external_id` |

### 4.2 API Key Access

| Property | Value |
|----------|-------|
| API key issuance | `POST /api-keys` (ENTERPRISE only) |
| Max active API keys per account | 5 |
| API key format | `tok_` prefix + 32 random bytes, base64url-encoded |
| Scopes available | `compute:read`, `compute:write`, `pdf:export`, `clients:read`, `clients:write`, `batch:submit`, `batch:read`, `webhooks:manage` |
| Rate limit | 1,000 `/compute` per hour per key; 10,000 per day per key; 600 all-other per minute per key |
| Key expiry | API keys do not expire automatically; user revokes them manually via `DELETE /api-keys/:id` |
| CSRF requirement | None (API keys exempt from CSRF) |
| Storage | BLAKE2b-256 hash stored; raw key shown once at creation |

### 4.3 White-Label PDF Exports

| Property | Value |
|----------|-------|
| Feature trigger | `white_label_logo_url` parameter on `POST /computations/:id/exports` |
| Logo requirements | HTTPS URL; PNG or JPG; max 1 MB; recommended dimensions 300px × 100px |
| Placement | Top-left corner of PDF, replacing TaxOptimizer PH branding |
| Footer | "Powered by TaxOptimizer PH" retained in small text (required by license) |
| Download expiry | 365 days (vs. 30 days for PRO) |
| Per-export white-label scope | White-label is per-export, not per-account global setting. A CPA can white-label some exports and use default branding on others. |

### 4.4 CPA Client Management

CPA client management requires BOTH (a) `plan = 'ENTERPRISE'` AND (b) `role = 'CPA'`. Having ENTERPRISE subscription alone does NOT grant access to `/clients/*` endpoints without CPA role.

| Property | Value |
|----------|-------|
| Endpoints | `GET /clients`, `POST /clients`, `GET /clients/:id`, `PATCH /clients/:id`, `DELETE /clients/:id`, `GET /clients/:id/computations`, `POST /clients/:id/computations` |
| Max clients per CPA account | Unlimited |
| Client fields | `name`, `tin`, `email`, `phone`, `notes` |
| Client computation storage | Each client can have unlimited saved computations |
| Data isolation | CPA can only access their own clients (not other CPAs' clients) |
| Client deletion | Soft-delete removes from `/clients` list; computations retained in DB for 90 days |
| How to get CPA role | Admin grants or user requests via `POST /users/me/request-cpa-role` (1 business day approval) |

### 4.5 Rate Limits on ENTERPRISE

| Endpoint group | ENTERPRISE (session auth) | ENTERPRISE (API key auth) |
|---------------|--------------------------|--------------------------|
| `POST /compute` per hour | 500 | 1,000 per key |
| `POST /compute` per day | 5,000 | 10,000 per key |
| All other endpoints per minute | 300 | 600 per key |
| Concurrent batches | 5 batches | 5 batches |

### 4.6 Priority Support

| Property | Value |
|----------|-------|
| Support channel | Dedicated email: enterprise@taxoptimizer.ph |
| Response time SLA | 1 business day (Philippine Standard Time, Mon–Fri 8am–6pm) |
| Standard (FREE/PRO) support response time | 3 business days |
| Issue escalation | Enterprise accounts can request a scheduled 30-minute support call via email |

### 4.7 CWT Entries on ENTERPRISE

| Property | Value |
|----------|-------|
| CWT entries per computation | Unlimited (no cap; PRO cap is 50) |
| Bulk import | Via batch API (each `BatchComputationItem` can include unlimited `form_2307_entries`) |

---

## 5. Quantified Limits Per Tier

The following table captures every numerical limit that differs by tier. All limits must be enforced at the API layer. The frontend must display upgrade prompts when users approach or reach limits.

| Limit | Anonymous (no auth) | FREE (authenticated) | PRO | ENTERPRISE |
|-------|---------------------|----------------------|-----|------------|
| POST /compute per hour | 10 (IP-based) | 30 | 200 | 500 session / 1,000 API key |
| POST /compute per day | 30 (IP-based) | 100 | 1,000 | 5,000 session / 10,000 API key |
| All other endpoints per minute | 20 (IP-based) | 60 | 120 | 300 session / 600 API key |
| Saved computations (visible in history) | 0 (not saved) | Last 3 only | Unlimited | Unlimited |
| Saves per calendar month | 0 | 10 | Unlimited | Unlimited |
| PDF exports | 0 | 0 | Unlimited | Unlimited |
| PDF download link expiry | N/A | N/A | 30 days | 365 days |
| Form 2307 (CWT) entries per computation | 10 | 10 | 50 | Unlimited |
| Prior quarterly payment entries per computation | 3 | 3 | 3 | Unlimited |
| Active API keys | 0 | 0 | 0 | 5 |
| Batch items per batch | 0 | 0 | 0 | 50 |
| Concurrent batch jobs | 0 | 0 | 0 | 5 |
| CPA clients | 0 | 0 | 0 | Unlimited (with CPA role) |
| Computation share link expiry (days) | 7 | 7 | 30 | 365 |
| White-label PDF exports | No | No | No | Yes |

### 5.1 Monthly Save Limit (FREE authenticated users)

- The `computations` table includes `created_at` timestamp.
- On every `POST /compute` by a FREE authenticated user, the server counts rows in `computations` where `user_id = $1 AND created_at >= DATE_TRUNC('month', NOW())`.
- If count ≥ 10, the computation is still performed (engine runs), but the result is NOT saved to the database. The API response includes a field `saved: false` and `save_limit_reached: true`.
- The frontend shows a toast: "Computation complete. Monthly save limit reached (10/10). Upgrade to Pro to save this result." with CTA "Upgrade to Pro".
- The API response still returns the full `TaxComputationResult` — the user can view it for the current session but cannot retrieve it later.

### 5.2 History Visibility (FREE authenticated users)

- `GET /computations` for FREE users: the API returns only the 3 most recent computations, ordered by `created_at DESC`. The response includes `meta.plan_limited: true` and `meta.total_count: N` (actual total) and `meta.visible_count: 3`.
- The frontend shows a "View Full History — Pro Feature" prompt below the 3 visible computations, showing how many additional computations exist.
- The 3 visible computations are fully accessible (re-run, view details, delete).

### 5.3 CWT Entry Limit

- FREE / Anonymous: maximum 10 `Form2307Entry` objects in `TaxpayerInput.form_2307_entries`.
- PRO: maximum 50 entries.
- ENTERPRISE: no maximum enforced (practical limit: engine processes all entries).
- The API validates the count in PL-01 (input validation step). If exceeded, returns `400` with error code `ERR_CWT_ENTRY_LIMIT_EXCEEDED`.
- The frontend shows the upgrade prompt before the user even submits when the count crosses the threshold.

**ERR_CWT_ENTRY_LIMIT_EXCEEDED error response:**
```json
{
  "error": "ERR_CWT_ENTRY_LIMIT_EXCEEDED",
  "message": "Your plan allows up to 10 Form 2307 entries. You have 11. Upgrade to Pro for up to 50 entries.",
  "details": {
    "current_count": 11,
    "plan_limit": 10,
    "upgrade_plan": "PRO"
  }
}
```

### 5.4 Prior Quarterly Payment Entries

- FREE / PRO: maximum 3 `QuarterlyPayment` objects in `TaxpayerInput.prior_quarterly_payments`. This covers Q1, Q2, Q3 for a standard tax year — all quarters a taxpayer would have paid before filing the annual return. Three is the maximum needed for any legitimate use case (there is no Q4 prior quarterly payment; the annual return IS the Q4 reconciliation).
- ENTERPRISE: the same logical maximum of 3 applies (no tax year has more than 3 prior quarterly payments before the annual). The "unlimited" in the table reflects that no software-enforced limit is applied, though the engine will still validate that period values are Q1/Q2/Q3 and not duplicated.

---

## 6. API-Level Gate Enforcement

Every gate is enforced at the API layer regardless of what the frontend shows. The backend does NOT trust frontend-side gate checks.

### 6.1 Gate Check Sequence (per request)

```
function check_feature_gate(request, required_plan):
  1. Resolve authenticated user from session cookie or API key.
     If anonymous and required_plan != 'FREE': return 401 ERR_UNAUTHENTICATED.
  2. Resolve active plan from Redis cache (key: plan:{user_id}).
     If cache miss: query subscriptions table, compute plan, write to cache (TTL: 5 minutes).
  3. Plan hierarchy: FREE < PRO < ENTERPRISE.
     If user's resolved plan < required_plan:
       If required_plan == 'PRO': return 403 ERR_REQUIRES_PRO
       If required_plan == 'ENTERPRISE': return 403 ERR_REQUIRES_ENTERPRISE
  4. If required_plan includes role check (CPA endpoints):
     If user.role != 'CPA': return 403 ERR_REQUIRES_CPA_ROLE
  5. Pass: proceed with request.
```

### 6.2 Gate Mapping by Endpoint

| Endpoint | Required Plan | Additional Role Check |
|----------|--------------|----------------------|
| `POST /compute` | FREE (anonymous OK) | None |
| `GET /computations` | PRO | None (FREE users get limited results per §5.2) |
| `GET /computations/:id` | PRO | Ownership check |
| `PATCH /computations/:id` | PRO | Ownership check |
| `DELETE /computations/:id` | PRO | Ownership check |
| `POST /computations/:id/exports` | PRO | Ownership check; ENTERPRISE for `white_label_logo_url` |
| `GET /computations/:id/exports/:export_id` | PRO | Ownership check |
| `GET /clients` | ENTERPRISE | CPA role |
| `POST /clients` | ENTERPRISE | CPA role |
| `GET /clients/:id` | ENTERPRISE | CPA role + owns client |
| `PATCH /clients/:id` | ENTERPRISE | CPA role + owns client |
| `DELETE /clients/:id` | ENTERPRISE | CPA role + owns client |
| `GET /clients/:id/computations` | ENTERPRISE | CPA role + owns client |
| `POST /clients/:id/computations` | ENTERPRISE | CPA role + owns client |
| `POST /batch/computations` | ENTERPRISE | CPA role |
| `GET /batch/:batch_id` | ENTERPRISE | CPA role + owns batch |
| `GET /batch/:batch_id/results` | ENTERPRISE | CPA role + owns batch |
| `GET /api-keys` | ENTERPRISE | None |
| `POST /api-keys` | ENTERPRISE | None |
| `DELETE /api-keys/:id` | ENTERPRISE | Ownership check |
| `GET /webhooks` | ENTERPRISE | None |
| `POST /webhooks` | ENTERPRISE | None |
| `DELETE /webhooks/:id` | ENTERPRISE | Ownership check |
| `GET /billing/subscription` | FREE | None |
| `POST /billing/checkout` | FREE | None |
| `POST /billing/portal` | PRO | None |
| `GET /billing/invoices` | PRO | None |

### 6.3 White-Label Special Gate

The `white_label_logo_url` field in `POST /computations/:id/exports` is an ENTERPRISE-only parameter. If a PRO user sends `white_label_logo_url` with any non-null value, the API returns `403 ERR_REQUIRES_ENTERPRISE` for that field only (the export itself is still created without white-label if the rest of the request is valid and the user is PRO).

**Implementation:**
```
if request.body.white_label_logo_url IS NOT NULL:
  if resolved_plan != 'ENTERPRISE': return 403 ERR_REQUIRES_ENTERPRISE
  # else: validate URL and process white-label
```

### 6.4 GET /computations History Gate for FREE

For FREE users, `GET /computations` does NOT return `403`. Instead, it returns `200 OK` with a limited result set and a plan-limit indicator:

```json
{
  "data": [ /* last 3 computations */ ],
  "meta": {
    "total_count": 47,
    "visible_count": 3,
    "plan_limited": true,
    "upgrade_prompt": "Upgrade to Pro to access all 47 computations."
  }
}
```

The `cursor` pagination parameter is ignored for FREE users (always returns the top 3 most recent).

---

## 7. Frontend Gate Behavior

When a user attempts to access a gated feature, the frontend shows an upgrade prompt before making an API call (where possible). The API is the authoritative gate; the frontend gate is UX optimization only.

### 7.1 Upgrade Prompt Display Rules

| User state | Feature attempted | Prompt shown |
|-----------|-------------------|-------------|
| Anonymous | Save computation result | "Save Your Computations — Free Account Required": "Create a free account to save your computations and access them from any device." CTAs: "Create Free Account" / "Log in to existing account →" |
| FREE (auth'd) | View history beyond last 3 | "Full History — Pro Feature": "Access your full computation history. Pro accounts store unlimited computations with year-over-year comparison." CTA: "Upgrade to Pro" |
| FREE (auth'd) | PDF export | "Download PDF — Pro Feature": "Export a formatted PDF of your tax computation summary — useful for sharing with your CPA or keeping for your records." CTAs: "Upgrade to Pro — ₱200/month" / "See what's included in Pro →" / "Not now" |
| FREE (auth'd) | Add 11th Form 2307 entry | "Pro required for more than 10 Form 2307 entries": "You have {count} Form 2307 entries. The free plan supports up to 10. Upgrade to Pro for up to 50 entries." CTA: "Upgrade to Pro" |
| FREE (auth'd) | Quarterly tracking dashboard | Pro gate: "Quarterly Tracking — Pro Feature": "Track your filing status, deadlines, and payments across all quarters in one place." CTA: "Upgrade to Pro" |
| PRO | Add 51st Form 2307 entry | "Enterprise required for more than 50 Form 2307 entries": "You have {count} Form 2307 entries. Pro supports up to 50. Upgrade to Professional for unlimited entries." CTA: "See Professional Plan" |
| PRO | Access batch processing | "Batch Processing — Professional Feature": "Process multiple client returns in a single session. Available on the Professional plan for CPAs and bookkeepers." CTA: "See Professional Plan" |
| PRO | Access API keys | "API Access — Professional Feature": "Integrate TaxOptimizer's computation engine into your own software via REST API." CTA: "See Professional Plan" |
| PRO | White-label PDF export | "White-Label PDFs — Professional Feature": "Replace TaxOptimizer branding with your own logo on all exported PDFs." CTA: "See Professional Plan" |
| FREE (auth'd) | Monthly save limit reached (10th save) | Toast (amber): "You've used {count}/10 computations on the free plan this month. Your result was computed but not saved. Upgrade to Pro to save unlimited computations." CTA in toast: "Upgrade to Pro" |

### 7.2 Upgrade Modal Structure

Upgrade prompts are displayed as modals (centered overlay, max-width 480px) or as inline cards depending on context:

- **Modal:** Used when the user actively clicks a gated feature (e.g., PDF export button).
- **Inline card:** Used when the user is in a flow and encounters a limit mid-step (e.g., adding the 11th CWT entry in the wizard — the input is disabled and a yellow card appears below the list).
- **Toast:** Used for non-blocking limit notifications (e.g., save limit reached after computation).

The upgrade modal always includes:
1. Lock icon (SVG) or feature-specific icon
2. Heading (from the copy table above)
3. Body text (from the copy table above)
4. Primary CTA button (redirects to `/upgrade` with `?source={feature_code}` query param for analytics tracking)
5. Secondary link (optional, where defined)
6. "Not now" dismiss link (optional, where defined)

`source` values for analytics:
- `pdf_export` — PDF export gate
- `history_full` — Full history gate
- `cwt_limit_free` — CWT limit (FREE → PRO)
- `cwt_limit_pro` — CWT limit (PRO → ENTERPRISE)
- `quarterly_tracking` — Quarterly tracking gate
- `batch_processing` — Batch processing gate
- `api_access` — API key gate
- `white_label` — White-label gate
- `save_limit` — Monthly save limit reached

---

## 8. Plan Resolution Algorithm

The server resolves the active plan on every authenticated request. This logic is the authoritative source; all other plan-checking code must call this function.

```
function resolve_plan(user_id: UUID): 'FREE' | 'PRO' | 'ENTERPRISE'

  # Step 1: Check Redis cache
  cached_plan = redis.get("plan:" + user_id)
  if cached_plan is not null:
    return cached_plan  # 'FREE', 'PRO', or 'ENTERPRISE'

  # Step 2: Query database
  row = db.query_one("""
    SELECT plan, status, trial_ends_at, current_period_end
    FROM subscriptions
    WHERE user_id = $1
  """, user_id)

  if row is null:
    # No subscription row: treat as FREE (should not happen after registration)
    plan = 'FREE'
  else:
    now = UTC_NOW()

    if row.status == 'TRIALING':
      if row.trial_ends_at > now:
        plan = row.plan  # 'PRO' or 'ENTERPRISE' — full features during trial
      else:
        plan = 'FREE'  # Trial expired; webhook should have updated status, but fallback here
    elif row.status == 'ACTIVE':
      plan = row.plan
    elif row.status == 'PAST_DUE':
      # Grace period: 3 calendar days from current_period_end
      grace_end = row.current_period_end + INTERVAL '3 days'
      if now <= grace_end:
        plan = row.plan  # Full features during grace period
      else:
        plan = 'FREE'  # Grace expired; treat as FREE
    elif row.status == 'CANCELLED':
      if row.current_period_end > now:
        plan = row.plan  # Access until period ends
      else:
        plan = 'FREE'
    elif row.status == 'EXPIRED':
      plan = 'FREE'
    else:
      plan = 'FREE'  # Defensive default for unknown status

  # Step 3: Cache result in Redis (5-minute TTL)
  redis.set("plan:" + user_id, plan, ex=300)

  return plan
```

**Cache invalidation:** The cache is invalidated (deleted) immediately when a Stripe or PayMongo webhook updates the subscription row. The webhook handler calls `redis.del("plan:" + user_id)` as part of its transaction before returning `200 OK` to the payment provider. This ensures the next request after a plan change gets the fresh plan.

---

## 9. Trial Logic

### 9.1 PRO Trial

| Property | Value |
|----------|-------|
| Duration | 14 calendar days |
| Trigger | User clicks "Start Free 14-Day Trial" on upgrade page and enters payment details |
| Payment captured | Not until trial ends. PayMongo/Stripe stores payment method; charges occur at trial end. |
| Credit card required | Yes — user must enter a valid payment method to start trial. Card is verified with a ₱0 authorization (not charged). |
| Cancel before trial ends | User may cancel at any time via billing portal (`POST /billing/portal`). If cancelled before trial end, no charge is made. Subscription moves to `CANCELLED` and then `EXPIRED` at `trial_ends_at`. |
| Trial-to-paid conversion | At `trial_ends_at`, payment provider charges the monthly price (₱200) or annual price (₱1,999) depending on what the user selected. Subscription status moves from `TRIALING` to `ACTIVE`. |
| Trial re-entry | A user who has previously trialed PRO cannot start another PRO trial. The trial CTA becomes "Upgrade to Pro" (no "free trial" mention) after a prior trial is detected. Detection: `subscriptions.trial_started_at IS NOT NULL` for that plan. |
| Feature access during trial | Full PRO features from the moment `trial_starts_at` is set. |
| In-app banner (3 days before expiry) | Amber: "Your Pro trial expires in 3 days. Add a payment method to keep your Pro features." CTA: "Add payment method" |
| In-app banner (day of expiry) | Orange: "Your Pro trial expires today. Add a payment method before midnight to avoid losing access." CTA: "Upgrade now" |
| Post-expiry banner | Red: "Your Pro trial has ended. You've been moved to the Free plan. Upgrade to restore Pro features." CTA: "Upgrade to Pro" |
| Email reminder schedule | Email sent at: trial start (welcome), trial day 10 (3 days before free trial ends if 14-day), trial expiry day (day of), 3 days after expiry (retention) |

### 9.2 ENTERPRISE Trial

| Property | Value |
|----------|-------|
| Duration | 7 calendar days |
| Trigger | User requests upgrade to ENTERPRISE via `POST /billing/checkout` with `plan: 'ENTERPRISE'` |
| Payment captured | Not until trial ends |
| Credit card required | Yes |
| Cancel before trial ends | Same as PRO: no charge, moved to CANCELLED then EXPIRED |
| Trial-to-paid conversion | At `trial_ends_at`, charge ₱1,499 (monthly) or ₱14,999 (annual) |
| Trial re-entry | Not allowed if prior ENTERPRISE trial detected |
| Feature access during trial | Full ENTERPRISE features immediately |
| Trial email schedule | Trial start (welcome), day 5 (2 days left), trial expiry day, 3 days after expiry |

### 9.3 Database Fields Used for Trial

| Column | Purpose |
|--------|---------|
| `subscriptions.status = 'TRIALING'` | Identifies in-trial status |
| `subscriptions.trial_started_at` | When trial began; non-null means user has had a trial |
| `subscriptions.trial_ends_at` | When trial ends; after this timestamp, `status` should be updated by webhook |
| `subscriptions.plan` | `'PRO'` or `'ENTERPRISE'` during trial |

**Trial re-entry detection query:**
```sql
SELECT COUNT(*) FROM subscriptions
WHERE user_id = $1
  AND trial_started_at IS NOT NULL
  AND plan = $2  -- 'PRO' or 'ENTERPRISE'
```
If count > 0: show "Upgrade" CTA without trial mention.
If count = 0: show "Start Free N-Day Trial" CTA.

---

## 10. Upgrade and Downgrade Rules

### 10.1 Upgrade (FREE → PRO)

1. User visits `/upgrade` page.
2. User selects billing cycle: monthly (₱200/month) or annual (₱1,999/year).
3. User clicks "Upgrade to Pro" (or "Start Free 14-Day Trial" if trial-eligible).
4. Frontend calls `POST /billing/checkout` with `{ plan: 'PRO', billing_cycle: 'MONTHLY' | 'ANNUAL' }`.
5. API creates PayMongo/Stripe checkout session and returns `{ checkout_url: "https://..." }`.
6. Frontend redirects to checkout URL.
7. User enters payment details on provider-hosted checkout page.
8. Provider sends webhook to `POST /webhooks/paymongo` or `POST /webhooks/stripe`.
9. Webhook handler updates `subscriptions` row: `plan = 'PRO'`, `status = 'TRIALING'` (if trial) or `status = 'ACTIVE'` (if direct upgrade), sets `current_period_start`, `current_period_end`, `billing_cycle`.
10. Cache invalidation: `redis.del("plan:" + user_id)`.
11. User is redirected to success page at `https://taxoptimizer.ph/upgrade/success?plan=PRO`.

### 10.2 Upgrade (PRO → ENTERPRISE)

Same flow as above with `plan: 'ENTERPRISE'`. If user is mid-period on PRO, the unused PRO days are prorated and credited:
- Proration formula: `credit = (remaining_days / period_days) × monthly_price`
- For monthly PRO: `credit = (days_left_in_month / 30) × 200`
- Credit applied as payment provider credit to the user's account, reducing the first ENTERPRISE invoice.

### 10.3 Downgrade (PRO → FREE)

Users may downgrade by cancelling their PRO subscription. Downgrade behavior:
- User clicks "Cancel Plan" in billing settings → opens PayMongo/Stripe customer portal.
- Cancellation is set to take effect at `current_period_end` (not immediately).
- `status` moves to `CANCELLED`; `plan` remains `'PRO'` until `current_period_end`.
- At `current_period_end`: payment provider sends webhook → `status = 'EXPIRED'`, `plan = 'FREE'`.
- User retains PRO features until the period ends. In-app banner: "Your Pro plan is cancelled. You'll have access until {date}. Your saved computations remain accessible."
- After downgrade: saved computations remain in the database but the user can only view the 3 most recent (per §5.2). The data is not deleted.

### 10.4 Downgrade (ENTERPRISE → PRO)

Same as PRO → FREE but the user downgrade target is `'PRO'`. ENTERPRISE features cease at `current_period_end`. CPA clients remain in the database; the user just cannot access `/clients/*` endpoints until they re-upgrade.

### 10.5 Downgrade (ENTERPRISE → FREE)

Must cancel ENTERPRISE, then separately ensure PRO is not active. The user can downgrade two levels at once by cancelling ENTERPRISE; the system sets the post-expiry plan to FREE (no auto-PRO insertion).

### 10.6 Immediate Plan Change (Admin-Initiated)

Admin may set any user's plan to any value via `PATCH /admin/users/:id/subscription`. This takes effect immediately (not at period end). Cache is invalidated on save.

---

## 11. Subscription State Transitions

The `subscriptions.status` field follows this state machine:

```
States: ACTIVE, TRIALING, PAST_DUE, CANCELLED, EXPIRED

Initial state (on user registration): ACTIVE with plan='FREE'

Transitions:
  ACTIVE (FREE) + start trial  → TRIALING (PRO or ENTERPRISE)
  ACTIVE (FREE) + direct pay   → ACTIVE (PRO or ENTERPRISE)
  TRIALING + trial_ends + paid → ACTIVE (PRO or ENTERPRISE)
  TRIALING + trial_ends + no payment method → EXPIRED (FREE)
  TRIALING + user cancels      → CANCELLED (access until trial_ends_at)
  ACTIVE + payment success     → ACTIVE (renews current_period_end)
  ACTIVE + payment fails       → PAST_DUE
  PAST_DUE + within 3-day grace + retry success → ACTIVE
  PAST_DUE + grace expires     → EXPIRED (FREE features only)
  ACTIVE + user cancels        → CANCELLED (access until current_period_end)
  CANCELLED + period_end       → EXPIRED (FREE features only)
  EXPIRED + user re-subscribes → TRIALING or ACTIVE (per upgrade flow)
```

| From Status | Event | To Status | Plan After |
|-------------|-------|-----------|-----------|
| ACTIVE (FREE) | User starts PRO trial | TRIALING | PRO |
| ACTIVE (FREE) | User pays PRO directly | ACTIVE | PRO |
| ACTIVE (PRO) | User pays ENTERPRISE | ACTIVE | ENTERPRISE |
| TRIALING (PRO) | Trial ends, payment collected | ACTIVE | PRO |
| TRIALING (PRO) | Trial ends, no valid payment method | EXPIRED | FREE |
| TRIALING (PRO) | User cancels before trial ends | CANCELLED | PRO (until trial_ends_at), then EXPIRED (FREE) |
| ACTIVE (PRO/ENT) | Renewal payment succeeds | ACTIVE | Same plan |
| ACTIVE (PRO/ENT) | Renewal payment fails | PAST_DUE | Same plan (3-day grace) |
| PAST_DUE | Retry payment succeeds (within 3 days) | ACTIVE | Same plan |
| PAST_DUE | Grace period expires | EXPIRED | FREE |
| ACTIVE (PRO/ENT) | User cancels | CANCELLED | Same plan (until current_period_end) |
| CANCELLED | current_period_end passes | EXPIRED | FREE |
| EXPIRED | User re-subscribes | TRIALING or ACTIVE | PRO or ENTERPRISE |

---

## 12. Grace Period and Lapse Behavior

### 12.1 PAST_DUE Grace Period

- Duration: 3 calendar days from `subscriptions.current_period_end`.
- During grace: full plan features continue.
- Payment provider retries the charge automatically within the grace window (provider handles retry logic — up to 3 retries over 3 days for PayMongo; Stripe Smart Retries are enabled).
- In-app banner during grace period (amber): "Payment failed for your {plan} subscription. We'll retry within 3 days. Update your payment method to avoid service interruption." CTA: "Update Payment Method" (→ billing portal).
- Email sent: "Your payment failed. Update your payment method within 3 days to keep your Pro features."

### 12.2 EXPIRED State (Plan Lapse)

After expiry:
- All PRO features are immediately unavailable.
- Saved computations are NOT deleted. The user can view the 3 most recent (per §5.2 FREE limit).
- API keys (for ENTERPRISE lapse) are immediately suspended (not deleted). Key rows remain in `api_keys` table with `last_used_at` preserved. If the user re-upgrades to ENTERPRISE, their existing keys resume working.
- CPA client data is retained but not accessible until re-upgrade.
- The subscriptions table row is updated to `plan = 'FREE'`.

### 12.3 Data Retention After Downgrade

Computation history, CWT entries, quarterly payment entries, and PDF export records are retained for 90 days after the subscription lapses. After 90 days, a scheduled cleanup job purges computations belonging to EXPIRED users older than the retention window. See [database/retention.md](../database/retention.md) for the full retention policy.

---

## 13. Billing Cycle Definitions

| Cycle | DB enum value | Description | Price |
|-------|--------------|-------------|-------|
| Monthly | `MONTHLY` | Billing every calendar month. `current_period_end = current_period_start + 1 month`. | PRO: ₱200/month; ENTERPRISE: ₱1,499/month |
| Annual | `ANNUAL` | Billing every 12 months. `current_period_end = current_period_start + 12 months`. | PRO: ₱1,999/year; ENTERPRISE: ₱14,999/year |

**Annual plan savings:**
- PRO: ₱200 × 12 = ₱2,400 (monthly) vs ₱1,999 (annual). Savings: ₱401/year (16.7% discount).
- ENTERPRISE: ₱1,499 × 12 = ₱17,988 (monthly) vs ₱14,999 (annual). Savings: ₱2,989/year (16.6% discount).

**Annual plan refund rule:** Annual plans have a 30-day money-back guarantee (see §15). After 30 days, annual plans are non-refundable.

**Monthly plan cancellation:** Pro-rated refunds are not issued for monthly plan cancellations. The user retains access until the end of the paid monthly period.

---

## 14. Payment Providers

Two payment providers are integrated. The system uses PayMongo as the primary provider for Philippine users and Stripe as the secondary provider for international users or as failover.

| Property | PayMongo | Stripe |
|----------|---------|--------|
| Primary use | Philippine users (GCash, Maya, bank debit, credit card) | International users or fallback |
| Currency | PHP | PHP (Stripe supports PHP) |
| Subscription billing | PayMongo Subscriptions API | Stripe Subscriptions API |
| Webhook endpoint | `POST /webhooks/paymongo` | `POST /webhooks/stripe` |
| Handled webhook events (PayMongo) | `payment.paid`, `payment.failed`, `subscription.created`, `subscription.updated`, `subscription.deleted` | — |
| Handled webhook events (Stripe) | — | `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`, `checkout.session.completed` |
| Payment methods | GCash, Maya, credit/debit cards (Visa/Mastercard), BancNet, e-wallets | Credit/debit cards, Link |
| ₱ amount in provider API | Centavos (integer): ₱200.00 = `20000` | Centavos: ₱200.00 = `20000` |
| PH user preference | PayMongo preferred; GCash and Maya displayed first in checkout | Credit card only |

**Provider selection logic (on `POST /billing/checkout`):**
- If `payment_method` in request body is `gcash`, `maya`, `bancnet`, or `e-wallet`: route to PayMongo.
- If `payment_method` is `credit_card` or omitted (user selects on checkout): route to Stripe by default, with PayMongo as backup if Stripe checkout fails.
- The `checkout_url` in the response is the provider-hosted checkout URL.

---

## 15. 30-Day Money-Back Guarantee

Annual PRO and annual ENTERPRISE plans include a 30-day money-back guarantee:

- **Eligible plans:** Annual PRO (₱1,999) and annual ENTERPRISE (₱14,999) only. Monthly plans are not eligible.
- **Claim window:** Within 30 calendar days of the annual payment date (i.e., within 30 days of `invoices.invoice_date`).
- **Process:** User emails support@taxoptimizer.ph with subject "Refund Request" and their account email. Support processes the refund within 5 business days.
- **Refund amount:** Full amount of the annual payment (₱1,999 or ₱14,999). No pro-rata deduction.
- **After refund:** Subscription status is set to `EXPIRED` immediately. Plan reverts to `FREE`. API keys are suspended. Saved computations retained per the 90-day retention policy.
- **One refund per account:** A user who has received a refund may not claim another refund on a future annual plan purchase.

---

## 16. Enterprise Contact-Sales Flow

The ENTERPRISE plan CTA on the pricing page is "Contact Sales" (vs. "Upgrade to Pro" for PRO which is self-serve).

### 16.1 Contact Sales Flow

1. User clicks "Upgrade to Professional" on the pricing page.
2. User is taken to `/upgrade/enterprise` — a contact form with fields:
   - Name (required)
   - Email (required; pre-filled if logged in)
   - Company/practice name (required)
   - Number of clients (select: 1–10 / 11–50 / 51–200 / 200+)
   - Message (optional)
3. On submit, the form data is sent to `POST /contact/sales` (no auth required).
4. The API creates a row in an internal `sales_leads` table (not in the public schema) and sends an email notification to enterprise@taxoptimizer.ph.
5. The user receives an acknowledgment email: "We received your inquiry. Our team will respond within 1 business day."
6. Sales follow-up: manual by a team member; provisioning ENTERPRISE access is done via admin panel (`PATCH /admin/users/:id/subscription`).

### 16.2 Self-Serve ENTERPRISE Option

For users who do not want to go through sales (e.g., an individual CPA upgrading directly):
- If the user is already logged in, the `/upgrade` page also shows a "Upgrade Now — No Sales Call Required" link below the "Contact Sales" button.
- This link leads to the self-serve Stripe/PayMongo checkout flow with `plan: 'ENTERPRISE'` and the 7-day trial.
- The contact-sales flow is the recommended path for organizations with 10+ clients.

---

## 17. Validation Invariants

The following invariants must always hold. Any code that modifies subscription state must verify these after every mutation.

| ID | Invariant |
|----|-----------|
| TIER-V01 | A user has exactly one row in `subscriptions` at all times (created on registration). |
| TIER-V02 | `plan = 'FREE'` always has `billing_cycle IS NULL` and `current_period_start IS NULL` and `current_period_end IS NULL`. |
| TIER-V03 | `plan != 'FREE'` always has `billing_cycle IS NOT NULL` (either `MONTHLY` or `ANNUAL`). |
| TIER-V04 | `status = 'TRIALING'` always has `trial_started_at IS NOT NULL` and `trial_ends_at IS NOT NULL` and `trial_ends_at > trial_started_at`. |
| TIER-V05 | `status = 'TRIALING'` implies `trial_ends_at > NOW()` (if the trial has ended, the status must have been updated to `ACTIVE` or `EXPIRED` by webhook). The plan resolution algorithm handles the fallback when the webhook has not yet fired. |
| TIER-V06 | A PRO annual subscription charging ₱1,999 has `current_period_end = current_period_start + INTERVAL '12 months'` within ±1 day (provider billing may shift by up to 1 day due to payment timing). |
| TIER-V07 | A user with `plan = 'ENTERPRISE'` and `role = 'CPA'` is the only type that can have rows in `cpa_clients`. |
| TIER-V08 | A user with `plan != 'ENTERPRISE'` must have `COUNT(api_keys WHERE revoked_at IS NULL) = 0`. Existing keys are suspended (not deleted) on downgrade from ENTERPRISE. |
| TIER-V09 | The Redis cache value `plan:{user_id}` is always one of `'FREE'`, `'PRO'`, `'ENTERPRISE'`. It is never stale for more than 5 minutes. |
| TIER-V10 | The `X-Subscription-Plan` response header on every authenticated API response matches the value returned by `resolve_plan(user_id)` at request time. |
| TIER-V11 | For FREE users, `GET /computations` never returns more than 3 items in the `data` array. |
| TIER-V12 | For FREE users, `POST /compute` with auth succeeds (200 OK) even when the monthly save limit is reached; only the `saved` field in the response is `false`. The computation is never blocked by a save-limit check. |
| TIER-V13 | Annual savings are exactly: PRO = ₱200 × 12 − ₱1,999 = ₱401; ENTERPRISE = ₱1,499 × 12 − ₱14,999 = ₱2,989. These figures are hardcoded in the pricing display and never computed dynamically. |
| TIER-V14 | The 30-day money-back guarantee applies only to annual plans. A request for a refund on a monthly plan is declined with explanation. |
| TIER-V15 | Trial eligibility: `trial_started_at IS NULL` in the current subscription row for the relevant plan. A subscription row reset (e.g., after EXPIRED + re-subscribe) preserves the original `trial_started_at` (not nullified) to prevent trial re-use. |
