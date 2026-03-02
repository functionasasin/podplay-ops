# Features by Tier — Philippine Freelance & Self-Employed Income Tax Optimizer

**Status:** COMPLETE
**Last updated:** 2026-03-02
**Cross-references:**
- Tier definitions and gating rules: [premium/tiers.md](tiers.md)
- Pricing and billing cycles: [premium/pricing.md](pricing.md)
- Professional B2B features: [premium/professional-features.md](professional-features.md)
- API permission matrix: [api/auth.md §6.3](../api/auth.md)
- Rate limits per tier: [api/endpoints.md §5](../api/endpoints.md)

---

## Table of Contents

1. [Feature Matrix — Complete](#1-feature-matrix--complete)
2. [Computation Engine Features](#2-computation-engine-features)
3. [Persistence and History Features](#3-persistence-and-history-features)
4. [PDF Export Features](#4-pdf-export-features)
5. [Filing Tracking and Reminders](#5-filing-tracking-and-reminders)
6. [Form 2307 CWT Management](#6-form-2307-cwt-management)
7. [B2B Professional Features](#7-b2b-professional-features)
8. [Rate Limits by Tier](#8-rate-limits-by-tier)
9. [Support and SLA](#9-support-and-sla)
10. [Data and Content Access](#10-data-and-content-access)
11. [Gating Rule Summary (API enforcement codes)](#11-gating-rule-summary-api-enforcement-codes)

---

## 1. Feature Matrix — Complete

The following table lists every feature in the product and its availability per tier. "Anonymous" refers to unauthenticated users (IP-rate-limited). FREE refers to registered users with no paid subscription. PRO and ENTERPRISE are paid tiers.

| Feature | Anonymous | FREE | PRO | ENTERPRISE |
|---------|-----------|------|-----|------------|
| **COMPUTATION ENGINE** | | | | |
| Path A — Graduated + Itemized Deductions | ✓ | ✓ | ✓ | ✓ |
| Path B — Graduated + OSD (40%) | ✓ | ✓ | ✓ | ✓ |
| Path C — 8% Flat Rate | ✓ | ✓ | ✓ | ✓ |
| All-three-regime comparison with recommendation | ✓ | ✓ | ✓ | ✓ |
| Annual mode (Form 1701 / 1701A) | ✓ | ✓ | ✓ | ✓ |
| Quarterly mode (Form 1701Q / 2551Q) | ✓ | ✓ | ✓ | ✓ |
| Mixed-income earner (compensation + business) | ✓ | ✓ | ✓ | ✓ |
| VAT-registered taxpayer computation | ✓ | ✓ | ✓ | ✓ |
| Penalty computation (surcharge, interest, compromise) | ✓ | ✓ | ✓ | ✓ |
| CWT offset computation (Form 2307 entries — up to 10) | ✓ | ✓ | — | — |
| CWT offset computation (Form 2307 entries — up to 50) | — | — | ✓ | — |
| CWT offset computation (Form 2307 entries — unlimited) | — | — | — | ✓ |
| Prior quarterly payments input (up to 3 entries) | ✓ | ✓ | ✓ | ✓ |
| EOPT taxpayer tier classification | ✓ | ✓ | ✓ | ✓ |
| BIR form recommendation (which form to file) | ✓ | ✓ | ✓ | ✓ |
| Filing deadline display | ✓ | ✓ | ✓ | ✓ |
| Regime comparison savings display | ✓ | ✓ | ✓ | ✓ |
| Manual Review Flag display | ✓ | ✓ | ✓ | ✓ |
| Itemized deductions: all 19 categories | ✓ | ✓ | ✓ | ✓ |
| NOLCO carry-forward tracking | ✓ | ✓ | ✓ | ✓ |
| Depreciation computation | ✓ | ✓ | ✓ | ✓ |
| Percentage tax (3%) computation and Form 2551Q | ✓ | ✓ | ✓ | ✓ |
| **ACCOUNT AND PERSISTENCE** | | | | |
| Create account | — | ✓ | ✓ | ✓ |
| Anonymous computation (no account) | ✓ | — | — | — |
| Save computation to account | — | ✓ (10/month) | ✓ (unlimited) | ✓ (unlimited) |
| View computation history (# of visible computations) | — | Last 3 | All | All |
| Re-run saved computation with new inputs | — | ✓ | ✓ | ✓ |
| Delete saved computations | — | ✓ | ✓ | ✓ |
| Year-over-year comparison view | — | — | ✓ | ✓ |
| Filter history by tax year | — | — | ✓ | ✓ |
| Sort history (recent / oldest / highest / lowest tax) | — | — | ✓ | ✓ |
| Share computation URL (read-only) — expires in 7 days | ✓ | ✓ | — | — |
| Share computation URL (read-only) — expires in 30 days | — | — | ✓ | — |
| Share computation URL (read-only) — expires in 365 days | — | — | — | ✓ |
| **PDF EXPORT** | | | | |
| PDF export: SUMMARY (full computation summary) | — | — | ✓ | ✓ |
| PDF export: FORM_1701_PREFILL (Form 1701 pre-fill) | — | — | ✓ | ✓ |
| PDF export: FORM_1701A_PREFILL (Form 1701A pre-fill) | — | — | ✓ | ✓ |
| PDF export: FORM_1701Q_PREFILL (Form 1701Q pre-fill) | — | — | ✓ | ✓ |
| PDF export: CWT_SCHEDULE (Form 2307 schedule) | — | — | ✓ | ✓ |
| PDF download link valid for 30 days | — | — | ✓ | — |
| PDF download link valid for 365 days | — | — | — | ✓ |
| White-label PDF exports (custom logo) | — | — | — | ✓ |
| TaxOptimizer PH branded PDF exports | — | — | ✓ | ✓ |
| **FILING TRACKING AND REMINDERS** | | | | |
| Deadline reminder email (7 days before) | — | ✓ | ✓ | ✓ |
| Deadline reminder email (1 day before) | — | — | ✓ | ✓ |
| Quarterly tracking dashboard | — | — | ✓ | ✓ |
| Per-quarter filing status (Not Filed / Filed / Confirmed) | — | — | ✓ | ✓ |
| Payment tracking (mark as paid, reference number) | — | — | ✓ | ✓ |
| Days-until-deadline countdown | — | — | ✓ | ✓ |
| Annual computation timeline (quarterly → annual chain) | — | — | ✓ | ✓ |
| **FORM 2307 CWT MANAGEMENT** | | | | |
| CWT entries in wizard (inline, max 10) | ✓ | ✓ | — | — |
| CWT entries in wizard (inline, max 50) | — | — | ✓ | — |
| CWT entries in wizard (unlimited) | — | — | — | ✓ |
| Persistent CWT manager (saved per computation) | — | — | ✓ | ✓ |
| Import CWT entries from prior computation | — | — | ✓ | ✓ |
| Export CWT schedule as PDF (CWT_SCHEDULE type) | — | — | ✓ | ✓ |
| **B2B PROFESSIONAL FEATURES** | | | | |
| CPA role assignment | — | — | — | ✓ (requires admin approval) |
| CPA client management (/clients/* endpoints) | — | — | — | ✓ (requires CPA role) |
| Unlimited clients per CPA account | — | — | — | ✓ |
| Per-client computation storage (unlimited) | — | — | — | ✓ |
| Batch computation (POST /batch/computations) | — | — | — | ✓ |
| Batch size: max 50 items per batch | — | — | — | ✓ |
| Concurrent batches: max 5 simultaneous | — | — | — | ✓ |
| API key issuance (up to 5 keys) | — | — | — | ✓ |
| API key scopes: compute:read, compute:write | — | — | — | ✓ |
| API key scopes: pdf:export | — | — | — | ✓ |
| API key scopes: clients:read, clients:write | — | — | — | ✓ |
| API key scopes: batch:submit, batch:read | — | — | — | ✓ |
| API key scopes: webhooks:manage | — | — | — | ✓ |
| Webhook management (POST /webhooks) | — | — | — | ✓ |
| **RATE LIMITS (per hour for POST /compute)** | | | | |
| POST /compute per hour | 10 (IP) | 30 | 200 | 500 session / 1,000 API key |
| POST /compute per day | 30 (IP) | 100 | 1,000 | 5,000 session / 10,000 API key |
| All other endpoints per minute | 20 (IP) | 60 | 120 | 300 session / 600 API key |
| **SUPPORT** | | | | |
| Community documentation (self-serve) | ✓ | ✓ | ✓ | ✓ |
| Email support | — | ✓ (3 business day SLA) | ✓ (3 business day SLA) | ✓ (1 business day SLA) |
| Priority support email address | — | — | — | enterprise@taxoptimizer.ph |
| Scheduled support call (30 min) | — | — | — | ✓ (on request) |

**Legend:** ✓ = available; — = not available; values in parentheses indicate limits or conditions.

---

## 2. Computation Engine Features

All computation engine features are available across all tiers including anonymous users. The tax computation is the core public utility — never gated behind payment. This is a deliberate product decision to maximize free-tier utility and word-of-mouth growth.

| Feature | All Tiers | Notes |
|---------|----------|-------|
| Path A — Graduated + Itemized | ✓ | All 19 expense categories per CR-027 |
| Path B — Graduated + OSD | ✓ | OSD = 40% of gross receipts per CR-024 |
| Path C — 8% Flat Rate | ✓ | Includes eligibility check per DT-02 |
| Regime comparison + recommendation | ✓ | Best path selected per CR-028 |
| Annual ITR (1701 / 1701A mode) | ✓ | Mode = 'ANNUAL' |
| Quarterly ITR (1701Q mode) | ✓ | Mode = 'Q1' | 'Q2' | 'Q3' |
| Mixed income (comp + business) | ✓ | Requires `has_compensation = true` |
| VAT-registered computation | ✓ | Requires `vat_registered = true` |
| Penalty computation | ✓ | Penalty components: surcharge, interest, compromise |
| EOPT taxpayer tier classification | ✓ | MICRO/SMALL/MEDIUM/LARGE per CR-019 |
| BIR form recommendation | ✓ | Output field `recommended_form` |
| Filing deadline display | ✓ | Output field `filing_deadlines` per CR-018 |
| Savings vs next-best path | ✓ | Output field `savings_vs_next_best_php` |
| Manual Review Flags | ✓ | MRF-001 through MRF-019; displayed as amber cards |
| Form 2307 CWT offset | ✓ (limited) | Limit varies by tier (10/50/unlimited) |
| Percentage tax (Form 2551Q) | ✓ | Applies when `vat_registered = false` and mode is quarterly or annual |
| NOLCO carry-forward | ✓ | Input: `nolco_entries` array |
| Depreciation (SLM/DB methods) | ✓ | Computed in PL-03 (itemized deductions) |

**What is NOT gated in the computation engine:**

Every scenario type — from the simplest pure-8% freelancer to a mixed-income VAT-registered sole proprietor with NOLCO carry-forwards — is computed fully for all users. There is no "basic" vs "advanced" engine mode.

---

## 3. Persistence and History Features

### 3.1 Save Limits

| Tier | Saves per month | Visible history |
|------|----------------|----------------|
| Anonymous | 0 (not saved) | 0 |
| FREE | 10 | Last 3 computations |
| PRO | Unlimited | All |
| ENTERPRISE | Unlimited | All |

### 3.2 FREE History Limitation Details

When `GET /computations` is called by a FREE user:
- The API returns only the 3 most recent computations (ordered by `created_at DESC`).
- The response includes `meta.plan_limited: true`, `meta.total_count: N` (actual total in DB), and `meta.visible_count: 3`.
- The frontend renders the 3 computations normally, then displays below them: "You have {total_count} saved computations. Upgrade to Pro to see all of them." with a CTA "Upgrade to Pro".
- The FREE user can re-run, view details, and delete any of the 3 visible computations.
- Computations beyond the visible 3 are retained in the database and become accessible again if the user upgrades to PRO.

### 3.3 Monthly Save Cap Enforcement (FREE)

The 10-save-per-month cap is enforced at the API layer:
- The computation always runs (no blocking of the engine).
- Only the save is blocked when the count reaches 10.
- The API response for a save-blocked computation includes `saved: false` and `save_limit_reached: true` alongside the full `TaxComputationResult`.
- The count resets at midnight UTC on the 1st of each calendar month.

### 3.4 PRO History Features (Beyond Basic Save)

| Feature | Description |
|---------|-------------|
| Year-over-year comparison | Compare the same taxpayer's tax across multiple years. Frontend renders a bar chart with one bar per year per regime. The recommended regime for each year is highlighted. |
| Filter by tax year | Dropdown on history page: "All years", "2026", "2025", etc. Filters `computations` by `tax_year` field. |
| Sort options | "Newest first" (default), "Oldest first", "Highest tax due", "Lowest tax due". Sort is applied on the server-side query. |
| History search | Frontend text search over `computations.label` and `computations.notes` fields. Client-side filtering of the returned list. |

---

## 4. PDF Export Features

### 4.1 Export Types Available to PRO and ENTERPRISE

| Export type code | Display name | Contents | Notes |
|----------------|-------------|----------|-------|
| `SUMMARY` | Tax Computation Summary | Full regime comparison table, recommended path, tax due per regime, tax credits, balance payable/refundable, BIR form recommendation, filing deadline, disclaimer | Most commonly used export |
| `FORM_1701_PREFILL` | Form 1701 Pre-fill Guide | BIR Form 1701 fields pre-populated from computation output. Printed as a reference; user still files via eBIRForms or BIR Online. Includes all Schedule 1 (itemized) or Schedule OSD rows depending on recommended path. | Only generated when mode = ANNUAL and recommended_form = '1701' |
| `FORM_1701A_PREFILL` | Form 1701A Pre-fill Guide | BIR Form 1701A fields pre-populated for 8% or OSD simplified filers | Only generated when recommended_form = '1701A' |
| `FORM_1701Q_PREFILL` | Form 1701Q Pre-fill Guide | BIR Form 1701Q fields for the relevant quarter | Only generated when mode = Q1, Q2, or Q3 |
| `CWT_SCHEDULE` | Form 2307 / SAWT Schedule | Tabulated list of all Form 2307 entries: payor name, TIN, period covered, ATC code, income payment amount, CWT amount, withholding type. Formatted for SAWT submission reference. | Generated for any computation with at least one form_2307_entry |

### 4.2 PDF Generation Details

- **Engine:** PDFKit (Node.js) server-side rendering. No browser-based PDF generation.
- **Paper size:** A4 (210mm × 297mm), portrait orientation.
- **Fonts:** IBM Plex Sans (headers), IBM Plex Mono (numeric fields), sourced from Google Fonts CDN at build time (embedded in PDF for offline rendering).
- **Color scheme:** Matches the design system (see [ui/design-system.md](../ui/design-system.md)) — primary color headers, gray table backgrounds, red for amounts due, green for amounts refundable.
- **Generation endpoint:** `POST /computations/:id/exports`
- **Storage:** Cloudflare R2 bucket `taxoptimizer-exports`, path `{user_id}/{computation_id}/{export_id}.pdf`
- **Signed URL expiry:** 30 days (PRO), 365 days (ENTERPRISE)
- **Re-generation:** Each call to `POST /computations/:id/exports` with the same `type` creates a new export row. Old export rows for the same type and computation are retained but marked `superseded: true`.

### 4.3 White-Label (ENTERPRISE Only)

| Property | Value |
|----------|-------|
| Trigger | `white_label_logo_url` parameter on POST /computations/:id/exports |
| Logo format | PNG or JPEG; HTTPS URL; max 1 MB; recommended 300px × 100px |
| Placement | Top-left corner, replacing TaxOptimizer PH logo |
| Footer retention | "Powered by TaxOptimizer PH" retained in 8pt gray text at bottom of every page |
| Per-export scope | White-label is per-export, not a global account setting |
| Logo fetching | Server fetches the logo URL at PDF generation time; cached for 24 hours per URL |
| Error handling | If logo URL is unreachable (HTTP 4xx/5xx or timeout > 5s), PDF is generated without logo and `export.white_label_status = 'LOGO_FETCH_FAILED'` is set. No error returned to client — the export still succeeds. |

---

## 5. Filing Tracking and Reminders

### 5.1 Deadline Reminder Emails (All Tiers)

FREE users receive 7-day advance email reminders for:
- Form 1701Q Q1 (deadline: April 15)
- Form 1701Q Q2 (deadline: August 15)
- Form 1701Q Q3 (deadline: November 15)
- Form 1701A / 1701 Annual (deadline: April 15)
- Form 2551Q Q1 (deadline: April 25)
- Form 2551Q Q2 (deadline: July 25)
- Form 2551Q Q3 (deadline: October 25)
- Form 2551Q Q4 (deadline: January 25)

Reminders are sent only if:
- The user has at least one saved computation in the relevant tax year
- The user's email reminder preference is `true` (default)
- The deadline has not passed

### 5.2 Additional 1-Day Reminder (PRO and ENTERPRISE)

PRO and ENTERPRISE users also receive a 1-day-before reminder email in addition to the 7-day reminder. The email uses the same template as the 7-day reminder with urgency language adjusted:

| Days before | Subject line |
|-------------|-------------|
| 7 days | "BIR filing due in 7 days — {form_name} for Q{quarter} {year}" |
| 1 day | "Final reminder: BIR {form_name} due TOMORROW — {date}" |

### 5.3 Quarterly Tracking Dashboard (PRO and ENTERPRISE)

The quarterly tracking dashboard is accessible at `/dashboard/tracking` (PRO and ENTERPRISE only; FREE users see an upgrade prompt).

**Dashboard layout:** One section per tax year (current year shown by default; previous years accessible via dropdown).

**Per-year content:**

| Column | Values | Notes |
|--------|--------|-------|
| Period | Q1, Q2, Q3, Q4/Annual | Q4 for purposes of this dashboard = Annual filing |
| Form | 1701Q (Q1/Q2/Q3), 1701A or 1701 (Annual) | Derived from user's last computation for that period |
| 2551Q | Yes / No | Shown only if user has OPT-liable computations |
| Deadline | Date string (e.g., "April 15, 2026") | Color-coded: green if >7 days away, amber if 1–7 days, red if tomorrow or past |
| Status | Not Filed / Filed / Payment Confirmed | User-editable dropdown |
| Amount Due | ₱{amount} | From the most recent computation for that period. "N/A" if no computation saved yet. |
| Action | "Compute" or "View" button | "Compute" if no computation saved; "View" links to the saved computation |

**Status update endpoint:** `PATCH /computations/:id/filing_status`
```json
{
  "filing_status": "NOT_FILED" | "FILED" | "PAYMENT_CONFIRMED",
  "filed_at": "2026-04-14",
  "payment_reference": "BIR-eFPS-20260414-XXXXX"
}
```

---

## 6. Form 2307 CWT Management

### 6.1 CWT Entry Limits by Tier

| Tier | Max entries per computation | Persistent manager |
|------|---------------------------|-------------------|
| Anonymous | 10 | No |
| FREE | 10 | No |
| PRO | 50 | Yes |
| ENTERPRISE | Unlimited | Yes |

### 6.2 Persistent CWT Manager (PRO and ENTERPRISE)

The CWT manager is a separate UI component accessible at `/cwt-manager` and within each saved computation's detail view.

**Manager features:**
- List of all Form 2307 entries associated with a saved computation
- Fields per entry: payor_name, payor_tin, period_covered_from, period_covered_to, atc_code, income_payment_php, tax_withheld_php, withholding_type ('IT' or 'PT')
- Import from prior computation: pull CWT entries from any prior saved computation into the current one
- Add entry manually
- Delete entry (confirmation required)
- Edit entry in-line
- Export as PDF (CWT_SCHEDULE type)

**CWT import algorithm:** When importing from a prior computation, the user selects a source computation from their history. All `form_2307_entries` from the source are copied into the current computation's entry list. Duplicate detection: if an entry with the same `payor_tin + period_covered_from + period_covered_to + atc_code` already exists in the target computation, the import skips that entry and reports it as a duplicate (shown in a "Skipped duplicates" section of the import result).

---

## 7. B2B Professional Features

### 7.1 Summary (ENTERPRISE Only)

B2B features are exclusively on the ENTERPRISE tier. An additional role check is required for CPA client management (the user must have `role = 'CPA'` in addition to `plan = 'ENTERPRISE'`).

| Feature | Plan Required | Role Required |
|---------|--------------|--------------|
| API key issuance | ENTERPRISE | None |
| Webhook management | ENTERPRISE | None |
| Batch computation | ENTERPRISE | CPA |
| CPA client management | ENTERPRISE | CPA |
| White-label PDF exports | ENTERPRISE | None |

See [premium/professional-features.md](professional-features.md) for full specification of each B2B feature including API contracts, data schemas, and CPA onboarding flow.

### 7.2 CPA Role Acquisition

The CPA role is not self-granted. Process:
1. User calls `POST /users/me/request-cpa-role` with `{ reason: string, license_number: string }`.
2. An internal notification is sent to admin@taxoptimizer.ph.
3. Admin approves via `PATCH /admin/users/:id/role` within 1 business day.
4. User receives email: "Your CPA role has been approved. You can now access client management features."
5. Session cache is invalidated; user must re-login for the role to take effect (or wait up to 5 minutes for cache expiry).

---

## 8. Rate Limits by Tier

The following rate limits are enforced at the API layer using a sliding window algorithm backed by Redis. Limits are per-user (authenticated) or per-IP (anonymous).

| Endpoint Group | Anonymous (IP) | FREE | PRO | ENTERPRISE (session) | ENTERPRISE (API key) |
|---------------|---------------|------|-----|---------------------|---------------------|
| `POST /compute` — per hour | 10 | 30 | 200 | 500 | 1,000 |
| `POST /compute` — per day | 30 | 100 | 1,000 | 5,000 | 10,000 |
| `POST /batch/computations` — per hour | N/A | N/A | N/A | 50 | 50 |
| All other endpoints — per minute | 20 | 60 | 120 | 300 | 600 |
| Concurrent batch jobs | 0 | 0 | 0 | 5 | 5 |

**Rate limit exceeded response (HTTP 429):**
```json
{
  "error": "ERR_RATE_LIMIT_EXCEEDED",
  "message": "Rate limit exceeded. You can make 200 requests per hour on your current plan.",
  "details": {
    "limit": 200,
    "window": "1h",
    "retry_after_seconds": 1847
  }
}
```

**Rate limit response headers (on every request):**
```
X-RateLimit-Limit: 200
X-RateLimit-Remaining: 147
X-RateLimit-Reset: 1741234567
X-Subscription-Plan: PRO
```

---

## 9. Support and SLA

| Tier | Channel | SLA | Additional |
|------|---------|-----|-----------|
| Anonymous | Documentation only (taxoptimizer.ph/docs) | None | No ticket submission |
| FREE | Email: support@taxoptimizer.ph | 3 Philippine business days response | Support hours: Mon–Fri 8am–6pm PST |
| PRO | Email: support@taxoptimizer.ph | 3 Philippine business days response | Support hours: Mon–Fri 8am–6pm PST |
| ENTERPRISE | Email: enterprise@taxoptimizer.ph | 1 Philippine business day response | + Scheduled 30-minute call on request |

**Philippine business days:** Monday through Friday, 8:00 AM to 6:00 PM Philippine Standard Time (UTC+8). Excludes Philippine national holidays.

**Philippine national holidays excluded from SLA:** New Year's Day (Jan 1), People Power Anniversary (Feb 25), Maundy Thursday, Good Friday, Black Saturday, Araw ng Kagitingan (Apr 9), Labor Day (May 1), Independence Day (Jun 12), Ninoy Aquino Day (Aug 21), National Heroes Day (last Mon of Aug), All Saints' Day (Nov 1), Bonifacio Day (Nov 30), Feast of the Immaculate Conception (Dec 8), Christmas Eve (Dec 24), Christmas Day (Dec 25), Rizal Day (Dec 30), New Year's Eve (Dec 31).

---

## 10. Data and Content Access

### 10.1 Computation Data Ownership

All computation data belongs to the user who created it. CPAs who create computations under a client's profile (via `/clients/:id/computations`) have data access rights controlled by:
- The CPA can access all computations for their own clients.
- The CPA cannot access computations created under other CPAs' clients.
- The client (if they have their own account) does not automatically see computations created by their CPA unless the CPA explicitly shares a computation URL with them.

### 10.2 Data Retention After Tier Change

| Event | Computation data | PDF exports | API keys | CPA clients |
|-------|----------------|-------------|---------|------------|
| PRO → FREE (cancellation) | Retained; FREE limit (3 visible) applies | Retained but not accessible without PRO plan | N/A | N/A |
| ENTERPRISE → PRO | Retained; accessible on PRO | Retained; accessible | Suspended (revoked_at set) | Retained; not accessible without ENTERPRISE |
| ENTERPRISE → FREE | Retained; FREE limit applies | Retained but not accessible | Suspended | Retained; not accessible |
| Account deletion | Purged within 30 days per retention policy | Purged from R2 within 30 days | Deleted | Purged |
| 90-day post-expiry cleanup | Purged for EXPIRED users | Purged for EXPIRED users | Deleted | Soft-deleted records purged |

See [database/retention.md](../database/retention.md) for the complete data retention policy and cleanup job specifications.

---

## 11. Gating Rule Summary (API Enforcement Codes)

The following error codes are returned when a user attempts to access a gated feature. These codes are referenced in the error states specification ([engine/error-states.md](../engine/error-states.md)) and the API endpoints specification ([api/endpoints.md](../api/endpoints.md)).

| Error Code | HTTP Status | Trigger |
|-----------|------------|---------|
| `ERR_UNAUTHENTICATED` | 401 | Anonymous user accesses endpoint requiring authentication |
| `ERR_REQUIRES_PRO` | 403 | FREE user accesses PRO-only endpoint (e.g., `GET /computations/:id`) |
| `ERR_REQUIRES_ENTERPRISE` | 403 | PRO user accesses ENTERPRISE-only endpoint (e.g., `POST /api-keys`) |
| `ERR_REQUIRES_CPA_ROLE` | 403 | ENTERPRISE user without CPA role accesses `/clients/*` or `/batch/*` |
| `ERR_CWT_ENTRY_LIMIT_EXCEEDED` | 400 | CWT entries exceed tier limit (>10 for FREE/Anonymous, >50 for PRO) |
| `ERR_RATE_LIMIT_EXCEEDED` | 429 | Request rate exceeds tier limit |
| `ERR_SAVE_LIMIT_REACHED` | Not an error (200 OK) | FREE user hits 10-save monthly cap; `saved: false` in response body |
| `ERR_HISTORY_PLAN_LIMITED` | Not an error (200 OK) | FREE user's `GET /computations` returns limited set; `meta.plan_limited: true` |
| `ERR_BATCH_REQUIRES_CPA` | 403 | ENTERPRISE user without CPA role calls `POST /batch/computations` |
| `ERR_WHITE_LABEL_REQUIRES_ENTERPRISE` | 403 | PRO user sends `white_label_logo_url` on export request |

**Gate check order (per-request):**
1. Rate limit check (before auth check; applies to anonymous too)
2. Authentication check (session or API key)
3. Plan resolution (from Redis cache or DB)
4. Role check (if required by endpoint)
5. Resource ownership check (if applicable)
6. Quota/limit checks (CWT count, save count, etc.)
