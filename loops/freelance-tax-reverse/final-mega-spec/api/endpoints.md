# API Endpoints — Philippine Freelance & Self-Employed Income Tax Optimizer

**Status:** COMPLETE
**Last updated:** 2026-03-02
**Cross-references:**
- Auth model details: [api/auth.md](auth.md)
- Rate limiting details: [api/rate-limiting.md](rate-limiting.md)
- Webhook retry policy: [api/webhooks.md](webhooks.md)
- Engine data model (type definitions): [engine/data-model.md](../engine/data-model.md)
- Database schema: [database/schema.md](../database/schema.md)
- Premium tier gating: [premium/tiers.md](../premium/tiers.md)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Conventions](#2-conventions)
3. [Error Format](#3-error-format)
4. [Rate Limits](#4-rate-limits)
5. [Auth Endpoints (`/auth/*`)](#5-auth-endpoints)
6. [User Profile Endpoints (`/users/me`)](#6-user-profile-endpoints)
7. [Core Compute Endpoint (`/compute`)](#7-core-compute-endpoint)
8. [Computation History (`/computations/*`)](#8-computation-history)
9. [PDF Export (`/computations/:id/exports`)](#9-pdf-export)
10. [CPA Client Management (`/clients/*`)](#10-cpa-client-management)
11. [Batch API (`/batch/*`)](#11-batch-api)
12. [API Key Management (`/api-keys/*`)](#12-api-key-management)
13. [Billing (`/billing/*`)](#13-billing)
14. [Webhooks (`/webhooks/*`)](#14-webhooks)
15. [Health Checks (`/health/*`)](#15-health-checks)

---

## 1. Overview

### 1.1 Base URLs

| Environment | Base URL |
|-------------|----------|
| Production | `https://api.taxoptimizer.ph/v1` |
| Staging | `https://api.staging.taxoptimizer.ph/v1` |
| Local development | `http://localhost:3001/v1` |

All routes below are relative to the base URL. Example: `POST /auth/register` → `POST https://api.taxoptimizer.ph/v1/auth/register`.

### 1.2 Versioning

The URL prefix `/v1` is the API version. Breaking changes (removed fields, changed response shapes) increment the version to `/v2`. Additive changes (new optional fields) do NOT increment the version.

### 1.3 Authentication Methods

Two authentication methods are supported:

**Session Cookie (browser clients):**
- HTTP-only cookie named `tax_session`
- Set by `POST /auth/login` and OAuth callback responses
- Cookie attributes: `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000` (30 days)
- For CSRF protection: all state-mutating requests (POST, PATCH, DELETE, PUT) must include the `X-CSRF-Token` header matching the CSRF token returned at login
- See [api/auth.md](auth.md) for session management details

**API Key (Enterprise programmatic access):**
- Header: `Authorization: ApiKey <raw_api_key>`
- API keys are created via `POST /api-keys` (requires active Enterprise subscription)
- API key auth bypasses CSRF requirement (keys are not in cookies)
- API key rate limits are separate from browser session limits

### 1.4 Content Types

All request bodies: `Content-Type: application/json` (UTF-8).
All response bodies: `Content-Type: application/json` (UTF-8), except PDF downloads (`application/pdf`).
Requests with wrong `Content-Type` receive `415 Unsupported Media Type`.

### 1.5 Monetary Values in JSON

All Philippine Peso amounts in JSON are transmitted as **JSON strings** formatted as decimal numbers with exactly 2 decimal places. Examples: `"1250.00"`, `"0.00"`, `"3000000.50"`. This avoids JavaScript IEEE 754 floating-point precision loss for large peso amounts.

**Receiving:** API accepts both string and number in request bodies. String `"1250"`, `"1250.0"`, and `"1250.00"` are all valid and are normalized to `"1250.00"`. Number `1250` is also accepted. Numbers with more than 2 decimal places (`1250.001`) return `400 BAD_REQUEST`.

**Sending:** API always responds with exactly 2 decimal places (`"1250.00"`).

No scientific notation (`1.25e3`) is accepted or returned.

### 1.6 Timestamps

All timestamps are ISO 8601 UTC strings. Example: `"2026-03-02T14:30:00.000Z"`. Date-only values (tax year, deadlines) use `"YYYY-MM-DD"` format.

---

## 2. Conventions

### 2.1 Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type: application/json` | Yes (for POST/PATCH/PUT) | All request bodies must be JSON |
| `X-CSRF-Token: <token>` | Yes (for POST/PATCH/DELETE by session-auth) | CSRF token from login response. Not required for API key auth. |
| `Authorization: ApiKey <key>` | Yes (for API key auth) | Enterprise programmatic access. Replaces session cookie. |
| `Accept-Language: en` | No | Language for error messages. Only `en` (English) and `fil` (Filipino) are supported. Default: `en`. |

### 2.2 Response Envelope

**Single resource response:** The resource object directly (no outer envelope).

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "maria@example.com",
  "role": "TAXPAYER"
}
```

**List response:**

```json
{
  "data": [ /* array of resource objects */ ],
  "meta": {
    "total_count": 47,
    "cursor_next": "eyJpZCI6IjU1MGU4NDAwIn0",
    "cursor_prev": null
  }
}
```

`cursor_next` is an opaque base64-encoded string. Pass it as the `cursor` query parameter on the next request to get the next page. `null` means no further pages exist in that direction. `total_count` is the total number of matching records (not just the current page).

**Successful deletion:** `204 No Content` with empty body.

**Async operation started:** `202 Accepted` with body `{ "job_id": "<uuid>" }`.

### 2.3 Pagination Parameters

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `cursor` | string | (none) | — | Opaque pagination cursor from previous response `meta.cursor_next` |
| `limit` | integer | 20 | 100 | Number of items per page |

### 2.4 Idempotency

`POST /compute` and `POST /computations` accept an optional `Idempotency-Key: <uuid>` header. If two requests with the same idempotency key arrive within 24 hours, the second returns the cached response of the first (HTTP 200 with body from the first request). Idempotency keys are scoped per user (anonymous requests use IP + key).

---

## 3. Error Format

All error responses use a consistent envelope:

```json
{
  "error": {
    "code": "ERR_VALIDATION_FAILED",
    "message": "One or more input fields failed validation.",
    "details": [
      {
        "field": "gross_receipts",
        "code": "ERR_NEGATIVE_GROSS_RECEIPTS",
        "message": "Gross receipts cannot be negative."
      },
      {
        "field": "tax_year",
        "code": "ERR_TAX_YEAR_OUT_OF_RANGE",
        "message": "Tax year must be between 2018 and 2030."
      }
    ]
  }
}
```

`details` is an array (may contain multiple errors — engine runs collect-all validation). `details` is `null` for single-error responses (auth failures, not-found, etc.).

### 3.1 HTTP Status Codes

| Status | When Used |
|--------|-----------|
| `200 OK` | Successful GET, PATCH, or POST returning a resource |
| `201 Created` | Resource successfully created (POST that creates a new record) |
| `202 Accepted` | Async job started (batch computations) |
| `204 No Content` | Successful DELETE |
| `400 Bad Request` | Malformed request body (invalid JSON, wrong field types, monetary format error) |
| `401 Unauthorized` | No valid session or API key. Must authenticate. |
| `403 Forbidden` | Authenticated but insufficient permissions (e.g., accessing another user's data, feature requires Pro tier) |
| `404 Not Found` | Resource does not exist or is not accessible to the caller |
| `409 Conflict` | Duplicate resource (email already registered, idempotency conflict) |
| `415 Unsupported Media Type` | Wrong Content-Type header |
| `422 Unprocessable Entity` | Valid JSON but fails engine validation rules (tax computation input errors). Contains `details` array. |
| `429 Too Many Requests` | Rate limit exceeded. Includes `Retry-After: <seconds>` header. |
| `500 Internal Server Error` | Engine assertion failure or unexpected server error |
| `503 Service Unavailable` | Database or external dependency unreachable. Health check failing. |

### 3.2 Error Code Reference

**Auth errors:**

| Code | HTTP | Description |
|------|------|-------------|
| `ERR_UNAUTHENTICATED` | 401 | No valid session or API key provided |
| `ERR_SESSION_EXPIRED` | 401 | Session token expired (>30 days since creation or last rotation) |
| `ERR_INVALID_CREDENTIALS` | 401 | Email/password combination not found |
| `ERR_EMAIL_NOT_VERIFIED` | 403 | Account exists but email not yet verified. Must verify before using save/export features. |
| `ERR_ACCOUNT_DISABLED` | 403 | Account has been disabled by admin |
| `ERR_OAUTH_PROVIDER_ERROR` | 502 | Google OAuth returned an error; user must retry |
| `ERR_OAUTH_STATE_MISMATCH` | 400 | CSRF state parameter mismatch in OAuth callback |
| `ERR_INVALID_RESET_TOKEN` | 400 | Password reset token invalid, expired, or already used |
| `ERR_INVALID_VERIFICATION_TOKEN` | 400 | Email verification token invalid or expired |
| `ERR_CSRF_MISMATCH` | 403 | X-CSRF-Token header missing or does not match session |

**Authorization errors:**

| Code | HTTP | Description |
|------|------|-------------|
| `ERR_FORBIDDEN` | 403 | Authenticated but action not allowed (ownership or role check) |
| `ERR_REQUIRES_PRO` | 403 | Feature requires Pro or Enterprise subscription |
| `ERR_REQUIRES_ENTERPRISE` | 403 | Feature requires Enterprise subscription |
| `ERR_REQUIRES_CPA_ROLE` | 403 | Feature requires user role = CPA |
| `ERR_API_KEY_INVALID` | 401 | API key not found or revoked |
| `ERR_API_KEY_INSUFFICIENT_SCOPE` | 403 | API key lacks permission for this endpoint |

**Resource errors:**

| Code | HTTP | Description |
|------|------|-------------|
| `ERR_NOT_FOUND` | 404 | Resource not found or inaccessible |
| `ERR_DUPLICATE_EMAIL` | 409 | Email address already registered |
| `ERR_DUPLICATE_API_KEY_NAME` | 409 | API key with this name already exists for this user |

**Input/validation errors:**

| Code | HTTP | Description |
|------|------|-------------|
| `ERR_MALFORMED_JSON` | 400 | Request body is not valid JSON |
| `ERR_INVALID_FIELD_TYPE` | 400 | Field has wrong type (e.g., string where number expected) |
| `ERR_MISSING_REQUIRED_FIELD` | 400 | Required field is absent from request body |
| `ERR_MONETARY_FORMAT` | 400 | Monetary string has more than 2 decimal places or invalid format |
| `ERR_VALIDATION_FAILED` | 422 | Engine input validation failed. `details` array has one entry per failed rule. |
| `ERR_ENGINE_ASSERTION` | 500 | Internal engine invariant violated. Should never happen in production. |

**Rate limit errors:**

| Code | HTTP | Description |
|------|------|-------------|
| `ERR_RATE_LIMIT_EXCEEDED` | 429 | Rate limit for this endpoint/tier exceeded. See `Retry-After` header. |

---

## 4. Rate Limits

Rate limits apply per endpoint group, per user tier. Limits are enforced via token bucket in Redis (Upstash). Response headers always include current limit state:

```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 47
X-RateLimit-Reset: 1741913400
```

`X-RateLimit-Reset` is a Unix timestamp (seconds) when the window resets.

| Tier | `/compute` (per hour) | `/compute` (per day) | All other endpoints (per min) |
|------|-----------------------|---------------------|-------------------------------|
| Anonymous (IP-based) | 15 | 50 | 30 |
| Free (authenticated) | 30 | 100 | 60 |
| Pro (authenticated) | 200 | 1,000 | 120 |
| Enterprise (session auth) | 500 | 5,000 | 300 |
| Enterprise (API key auth) | 1,000 per key | 10,000 per key | 600 per key |
| Admin | Unlimited | Unlimited | Unlimited |

See [api/rate-limiting.md](rate-limiting.md) for full rate limiting spec including burst handling and retry policy.

---

## 5. Auth Endpoints

### 5.1 `POST /auth/register`

Create a new user account with email and password.

**Authentication required:** No.

**Request body:**

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `email` | string | Yes | Valid email format. Max 254 chars. Case-insensitive (normalized to lowercase). Must not already exist in `users` table. |
| `password` | string | Yes | Min 8 chars, max 128 chars. Must contain at least one uppercase letter, one lowercase letter, and one digit. |
| `first_name` | string | Yes | Max 50 chars. Non-empty after trimming. |
| `last_name` | string | Yes | Max 50 chars. Non-empty after trimming. |
| `middle_name` | string | No | Max 50 chars. Empty string `""` accepted. Default: `""`. |

**Example request:**
```json
{
  "email": "maria.santos@gmail.com",
  "password": "Secure123",
  "first_name": "Maria",
  "last_name": "Santos",
  "middle_name": "Cruz"
}
```

**Response: `201 Created`**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "maria.santos@gmail.com",
  "email_verified": false,
  "first_name": "Maria",
  "last_name": "Santos",
  "middle_name": "Cruz",
  "role": "TAXPAYER",
  "created_at": "2026-03-02T14:30:00.000Z"
}
```

**Side effects:**
- Creates row in `users` table with `email_verified = false`
- Creates row in `email_verification_tokens` table
- Sends verification email to `email` address with link: `https://taxoptimizer.ph/verify-email?token=<raw_token>`
- Does NOT create a session. User must call `POST /auth/login` after registering.

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 400 | `ERR_MISSING_REQUIRED_FIELD` | `email`, `password`, `first_name`, or `last_name` absent |
| 400 | `ERR_INVALID_FIELD_TYPE` | Any field is wrong type |
| 400 | `ERR_VALIDATION_FAILED` | Email format invalid, password too weak, names exceed max length |
| 409 | `ERR_DUPLICATE_EMAIL` | Email already registered |

---

### 5.2 `POST /auth/login`

Authenticate with email and password. Creates a session.

**Authentication required:** No.

**Request body:**

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `email` | string | Yes | Valid email format |
| `password` | string | Yes | Non-empty |

**Example request:**
```json
{
  "email": "maria.santos@gmail.com",
  "password": "Secure123"
}
```

**Response: `200 OK`**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "maria.santos@gmail.com",
    "email_verified": true,
    "first_name": "Maria",
    "last_name": "Santos",
    "middle_name": "Cruz",
    "role": "TAXPAYER",
    "has_active_subscription": true,
    "subscription_plan": "PRO",
    "created_at": "2026-02-01T08:00:00.000Z"
  },
  "csrf_token": "abc123def456ghi789",
  "session_expires_at": "2026-04-01T14:30:00.000Z"
}
```

**Side effects:**
- Creates row in `user_sessions` table
- Sets `tax_session` HTTP-only cookie in response: `Set-Cookie: tax_session=<raw_token>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`
- The `csrf_token` must be stored by the client (e.g., in sessionStorage or memory) and sent as `X-CSRF-Token` header on all subsequent state-mutating requests
- Updates `user.last_login_at` in `users` table

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 400 | `ERR_MISSING_REQUIRED_FIELD` | `email` or `password` absent |
| 401 | `ERR_INVALID_CREDENTIALS` | Email not found OR password incorrect (same error to avoid enumeration) |
| 403 | `ERR_ACCOUNT_DISABLED` | Account has been disabled by admin |

---

### 5.3 `POST /auth/logout`

Invalidate the current session.

**Authentication required:** Session cookie.

**Request body:** Empty (`{}`).

**Response: `204 No Content`**

**Side effects:**
- Deletes row from `user_sessions` where `session_token_hash` matches the submitted cookie
- Sets `Set-Cookie: tax_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0` to clear cookie

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 401 | `ERR_UNAUTHENTICATED` | No session cookie present or session not found |

---

### 5.4 `POST /auth/forgot-password`

Send a password reset email.

**Authentication required:** No.

**Request body:**

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `email` | string | Yes | Valid email format |

**Example request:**
```json
{ "email": "maria.santos@gmail.com" }
```

**Response: `200 OK`**

```json
{
  "message": "If an account exists for this email, a password reset link has been sent."
}
```

**Note:** Response is identical whether the email exists or not (prevents enumeration attacks).

**Side effects (only if email exists in `users` table):**
- Deletes any existing unexpired password reset tokens for this email
- Creates row in `password_reset_tokens` table (expires after 1 hour)
- Sends email with link: `https://taxoptimizer.ph/reset-password?token=<raw_token>`

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 400 | `ERR_MISSING_REQUIRED_FIELD` | `email` absent |
| 400 | `ERR_VALIDATION_FAILED` | Email format invalid |
| 429 | `ERR_RATE_LIMIT_EXCEEDED` | More than 3 reset requests for same email in 1 hour |

---

### 5.5 `POST /auth/reset-password`

Reset password using a token from the reset email.

**Authentication required:** No.

**Request body:**

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `token` | string | Yes | Raw token from reset email link |
| `new_password` | string | Yes | Min 8 chars, max 128 chars. At least one uppercase, one lowercase, one digit. |

**Example request:**
```json
{
  "token": "abc123xyz789",
  "new_password": "NewSecure456"
}
```

**Response: `200 OK`**

```json
{ "message": "Password successfully updated. Please log in with your new password." }
```

**Side effects:**
- Verifies token exists in `password_reset_tokens`, is not used, and has not expired
- Updates `users.password_hash` with Argon2id hash of `new_password`
- Marks token as used (`used_at = NOW()`)
- Invalidates ALL existing sessions for this user (deletes all rows in `user_sessions` for this `user_id`)

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 400 | `ERR_MISSING_REQUIRED_FIELD` | `token` or `new_password` absent |
| 400 | `ERR_INVALID_RESET_TOKEN` | Token not found, expired (>1 hour), or already used |
| 400 | `ERR_VALIDATION_FAILED` | New password does not meet strength requirements |

---

### 5.6 `POST /auth/verify-email`

Verify email address using a token from the verification email.

**Authentication required:** No.

**Request body:**

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `token` | string | Yes | Raw token from verification email link |

**Example request:**
```json
{ "token": "verif_abc123xyz789" }
```

**Response: `200 OK`**

```json
{ "message": "Email address verified successfully." }
```

**Side effects:**
- Verifies token exists and has not expired (24-hour validity)
- Sets `users.email_verified = true` for the associated user
- Deletes the token from `email_verification_tokens`

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 400 | `ERR_MISSING_REQUIRED_FIELD` | `token` absent |
| 400 | `ERR_INVALID_VERIFICATION_TOKEN` | Token not found or expired (>24 hours) |

---

### 5.7 `POST /auth/resend-verification`

Resend the email verification link to the current user's email.

**Authentication required:** Session cookie (for authenticated but unverified users).

**Request body:** Empty (`{}`).

**Response: `200 OK`**

```json
{ "message": "Verification email sent." }
```

**Side effects:**
- Deletes any existing unused verification tokens for this user
- Creates new token in `email_verification_tokens` (24-hour validity)
- Sends verification email

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 401 | `ERR_UNAUTHENTICATED` | Not logged in |
| 409 | `ERR_CONFLICT` | Email already verified (no action needed) |
| 429 | `ERR_RATE_LIMIT_EXCEEDED` | More than 3 resend requests in 1 hour |

---

### 5.8 `GET /auth/oauth/google`

Initiate Google OAuth 2.0 authorization flow.

**Authentication required:** No.

**Query parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `redirect_after` | string | No | URL to redirect to after successful OAuth. Default: `https://taxoptimizer.ph/dashboard`. Must be on `taxoptimizer.ph` domain (validated server-side). |

**Response: `302 Found`**

Redirects browser to Google's OAuth authorization URL with `scope=openid email profile` and a CSRF `state` parameter stored server-side.

**Note:** No JSON body. Browser clients should navigate to this URL directly (not via `fetch`).

---

### 5.9 `GET /auth/oauth/google/callback`

Google OAuth 2.0 callback handler. Called by Google after user authorizes.

**Authentication required:** No.

**Query parameters (from Google):**

| Parameter | Type | Description |
|-----------|------|-------------|
| `code` | string | Authorization code from Google |
| `state` | string | CSRF state parameter (validated against server-side stored state) |

**Response: `302 Found`**

On success: Redirects to `redirect_after` URL (from original OAuth initiation) with session cookie set.

On failure: Redirects to `https://taxoptimizer.ph/login?error=oauth_failed`.

**Side effects on success:**
- Exchanges code for Google ID token via Google token endpoint
- Extracts `sub` (Google user ID), `email`, `name` from ID token
- Looks up `oauth_accounts` table for existing `(provider='google', provider_user_id=sub)` row
  - If found: loads existing user, creates new session
  - If not found: creates new `users` row (with `email_verified = true` since Google verified it), creates `oauth_accounts` row, creates new session
- Sets `tax_session` cookie (same as `POST /auth/login`)

**Errors:**

| HTTP | Code | Redirect |
|------|------|---------|
| 302 | `ERR_OAUTH_STATE_MISMATCH` | `https://taxoptimizer.ph/login?error=csrf` |
| 302 | `ERR_OAUTH_PROVIDER_ERROR` | `https://taxoptimizer.ph/login?error=oauth_failed` |
| 302 | `ERR_DUPLICATE_EMAIL` | `https://taxoptimizer.ph/login?error=email_taken` (email from Google already registered with password) |

---

### 5.10 `GET /auth/me`

Get the currently authenticated user's identity. Lightweight — useful for "am I still logged in?" checks.

**Authentication required:** Session cookie or API key.

**Request body:** None.

**Response: `200 OK`**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "maria.santos@gmail.com",
  "email_verified": true,
  "first_name": "Maria",
  "last_name": "Santos",
  "role": "TAXPAYER",
  "has_active_subscription": true,
  "subscription_plan": "PRO",
  "subscription_status": "ACTIVE"
}
```

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 401 | `ERR_UNAUTHENTICATED` | No valid session or API key |
| 401 | `ERR_SESSION_EXPIRED` | Session cookie present but expired |

---

## 6. User Profile Endpoints

### 6.1 `GET /users/me`

Get the full profile of the authenticated user.

**Authentication required:** Session cookie or API key.

**Response: `200 OK`**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "maria.santos@gmail.com",
  "email_verified": true,
  "first_name": "Maria",
  "last_name": "Santos",
  "middle_name": "Cruz",
  "role": "TAXPAYER",
  "tin": "123-456-789-000",
  "rdo_code": "044",
  "business_name": "Santos Freelance Consulting",
  "psic_code": "620000",
  "registered_address": "123 Makati Ave, Makati City",
  "zip_code": "1200",
  "contact_number": "09171234567",
  "birthday": "1990-05-15",
  "citizenship": "Filipino",
  "civil_status": "Single",
  "has_active_subscription": true,
  "subscription_plan": "PRO",
  "subscription_status": "ACTIVE",
  "subscription_period_end": "2027-03-02T00:00:00.000Z",
  "created_at": "2026-02-01T08:00:00.000Z",
  "updated_at": "2026-03-01T10:00:00.000Z"
}
```

**Field descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Permanent unique identifier |
| `email` | string | Login email address |
| `email_verified` | boolean | Whether email has been verified |
| `first_name` | string | Given name |
| `last_name` | string | Family name |
| `middle_name` | string | Middle name (empty string if none) |
| `role` | string | `"TAXPAYER"`, `"CPA"`, or `"ADMIN"` |
| `tin` | string or null | TIN in format `"XXX-XXX-XXX"` or `"XXX-XXX-XXX-XXXX"`. null if not entered. |
| `rdo_code` | string or null | 3-digit Revenue District Office code. null if not entered. |
| `business_name` | string | Registered business/professional name. Empty string if not entered. |
| `psic_code` | string or null | Philippine Standard Industry Classification code (4–6 digits). null if not entered. |
| `registered_address` | string | BIR-registered address. Empty string if not entered. |
| `zip_code` | string or null | 4-digit postal code. null if not entered. |
| `contact_number` | string | Mobile/phone. Empty string if not entered. |
| `birthday` | string or null | ISO 8601 date (`"YYYY-MM-DD"`). null if not entered. |
| `citizenship` | string | Default `"Filipino"`. |
| `civil_status` | string or null | `"Single"`, `"Married"`, `"Widow/Widower"`, `"Legally Separated"`, or null. |
| `has_active_subscription` | boolean | true if subscription status is `TRIALING`, `ACTIVE`, or `CANCELLED` (within period). |
| `subscription_plan` | string | `"FREE"`, `"PRO"`, or `"ENTERPRISE"`. |
| `subscription_status` | string | `"TRIALING"`, `"ACTIVE"`, `"PAST_DUE"`, `"CANCELLED"`, `"EXPIRED"`, or `"NONE"` (no subscription record). |
| `subscription_period_end` | string or null | ISO 8601 UTC timestamp when current subscription period ends. null for FREE users. |
| `created_at` | string | Account creation timestamp |
| `updated_at` | string | Last profile update timestamp |

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 401 | `ERR_UNAUTHENTICATED` | Not logged in |

---

### 6.2 `PATCH /users/me`

Update the authenticated user's profile. Only provided fields are updated (partial update / JSON merge patch).

**Authentication required:** Session cookie or API key.

**Request body (all fields optional):**

| Field | Type | Validation |
|-------|------|-----------|
| `first_name` | string | Max 50 chars. Non-empty after trimming if provided. |
| `last_name` | string | Max 50 chars. Non-empty after trimming if provided. |
| `middle_name` | string | Max 50 chars. Empty string allowed. |
| `tin` | string or null | If provided: format `"XXX-XXX-XXX"` or `"XXX-XXX-XXX-XXXX"`. Digits + dashes only. null clears it. |
| `rdo_code` | string or null | 3-digit string (e.g., `"044"`). Must be 3 numeric digits. null clears it. |
| `business_name` | string | Max 200 chars. |
| `psic_code` | string or null | 4–6 digit numeric string. null clears it. |
| `registered_address` | string | Max 500 chars. |
| `zip_code` | string or null | 4-digit numeric string (e.g., `"1200"`). null clears it. |
| `contact_number` | string | Max 15 chars. Digits, spaces, `+`, `-`, `(`, `)` allowed. |
| `birthday` | string or null | ISO 8601 date `"YYYY-MM-DD"`. Must be in the past. null clears it. |
| `citizenship` | string | Max 50 chars. Non-empty after trimming. |
| `civil_status` | string or null | Must be one of: `"Single"`, `"Married"`, `"Widow/Widower"`, `"Legally Separated"`. null clears it. |

**Note:** `email`, `password_hash`, `role`, and subscription fields cannot be changed via this endpoint. Email change requires a separate email-change flow (not in v1). Password change uses `POST /users/me/change-password`.

**Example request:**
```json
{
  "tin": "123-456-789-000",
  "rdo_code": "044",
  "business_name": "Santos Consulting"
}
```

**Response: `200 OK`**

Returns the complete updated user profile (same shape as `GET /users/me`).

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 400 | `ERR_VALIDATION_FAILED` | Any field fails validation rule |
| 401 | `ERR_UNAUTHENTICATED` | Not logged in |

---

### 6.3 `POST /users/me/change-password`

Change the authenticated user's password.

**Authentication required:** Session cookie (NOT API key — API keys cannot change passwords).

**Request body:**

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `current_password` | string | Yes | Must match current stored password hash |
| `new_password` | string | Yes | Min 8 chars, max 128 chars. At least one uppercase, lowercase, digit. Must differ from `current_password`. |

**Example request:**
```json
{
  "current_password": "Secure123",
  "new_password": "NewSecure456"
}
```

**Response: `200 OK`**

```json
{ "message": "Password updated successfully." }
```

**Side effects:**
- Verifies `current_password` matches stored Argon2id hash
- Updates `users.password_hash`
- Invalidates all OTHER sessions for this user (keeps the current session active)

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 400 | `ERR_MISSING_REQUIRED_FIELD` | `current_password` or `new_password` absent |
| 400 | `ERR_VALIDATION_FAILED` | New password doesn't meet strength requirements OR matches current password |
| 401 | `ERR_INVALID_CREDENTIALS` | `current_password` is incorrect |
| 401 | `ERR_UNAUTHENTICATED` | Not logged in |

---

### 6.4 `DELETE /users/me`

Soft-delete the authenticated user's account.

**Authentication required:** Session cookie (NOT API key).

**Request body:**

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `password` | string | Yes (if account has password) | Must match stored password. Required for accounts with `password_hash != null`. |
| `confirmation` | string | Yes | Must equal the exact string `"DELETE MY ACCOUNT"` |

**Example request:**
```json
{
  "password": "Secure123",
  "confirmation": "DELETE MY ACCOUNT"
}
```

**Response: `204 No Content`**

**Side effects:**
- Sets `users.deleted_at = NOW()` (soft delete)
- Cancels any active subscription (via payment provider API)
- Invalidates all sessions (deletes all `user_sessions` rows)
- Schedules data purge job: user's computations and associated data deleted after 90 days
- Clears `tax_session` cookie

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 400 | `ERR_VALIDATION_FAILED` | `confirmation` does not equal `"DELETE MY ACCOUNT"` |
| 401 | `ERR_INVALID_CREDENTIALS` | `password` incorrect (for password accounts) |
| 401 | `ERR_UNAUTHENTICATED` | Not logged in |

---

## 7. Core Compute Endpoint

### 7.1 `POST /compute`

Compute income tax optimization without saving. Works for anonymous and authenticated users. Returns the full `TaxComputationResult`.

**Authentication required:** No (anonymous allowed). If a session cookie or API key is present, the user's identity is logged for analytics, but the result is NOT saved to the database.

**Idempotency:** `Idempotency-Key` header accepted. Cached for 5 minutes (not 24 hours like save endpoint).

**Request body:** The complete `TaxpayerInput` structure.

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `taxpayer_type` | string | Yes | Must be `"PURELY_SE"`, `"MIXED_INCOME"`, or `"COMPENSATION_ONLY"` |
| `tax_year` | integer | Yes | 2018–2030 inclusive |
| `filing_period` | string | Yes | Must be `"Q1"`, `"Q2"`, `"Q3"`, or `"ANNUAL"` |
| `is_vat_registered` | boolean | Yes | |
| `is_bmbe_registered` | boolean | Yes | |
| `subject_to_sec_117_128` | boolean | Yes | |
| `is_gpp_partner` | boolean | Yes | |
| `gross_receipts` | string (peso) | Yes | ≥ `"0.00"` |
| `sales_returns_allowances` | string (peso) | Yes | ≥ `"0.00"` AND ≤ `gross_receipts` |
| `non_operating_income` | string (peso) | Yes | ≥ `"0.00"` |
| `fwt_income` | string (peso) | Yes | ≥ `"0.00"` |
| `cost_of_goods_sold` | string (peso) | Yes | ≥ `"0.00"` |
| `taxable_compensation` | string (peso) | Yes | ≥ `"0.00"`. Must be `"0.00"` for `PURELY_SE`. |
| `compensation_cwt` | string (peso) | Yes | ≥ `"0.00"`. Must be `"0.00"` for `PURELY_SE`. |
| `itemized_expenses` | object | Yes | See §7.1.1 below. Zero-fill all fields for non-itemized scenarios. |
| `elected_regime` | string or null | No | `"ELECT_EIGHT_PCT"`, `"ELECT_OSD"`, `"ELECT_ITEMIZED"`, or `null` (optimizer mode). Default: `null`. |
| `prior_quarterly_payments` | array | Yes | Array of `QuarterlyPayment` objects (see §7.1.2). Empty array `[]` is valid. Max 3 items. |
| `cwt_2307_entries` | array | Yes | Array of `Form2307Entry` objects (see §7.1.3). Empty array `[]` is valid. Max 100 items. |
| `prior_year_excess_cwt` | string (peso) | Yes | ≥ `"0.00"` |
| `actual_filing_date` | string or null | No | ISO 8601 date `"YYYY-MM-DD"`, or `null` for on-time filing assumption. Default: `null`. |
| `return_type` | string | Yes | `"ORIGINAL"` or `"AMENDED"` |
| `prior_payment_for_return` | string (peso) | Yes | ≥ `"0.00"`. Must be `"0.00"` for `ORIGINAL`. |

#### 7.1.1 `itemized_expenses` Object

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `salaries_and_wages` | string (peso) | Yes | ≥ `"0.00"` |
| `sss_philhealth_pagibig_employer_share` | string (peso) | Yes | ≥ `"0.00"` |
| `rent` | string (peso) | Yes | ≥ `"0.00"` |
| `utilities` | string (peso) | Yes | ≥ `"0.00"` |
| `communication` | string (peso) | Yes | ≥ `"0.00"` |
| `office_supplies` | string (peso) | Yes | ≥ `"0.00"` |
| `professional_fees_paid` | string (peso) | Yes | ≥ `"0.00"` |
| `travel_transportation` | string (peso) | Yes | ≥ `"0.00"` |
| `insurance_premiums` | string (peso) | Yes | ≥ `"0.00"` |
| `interest_expense` | string (peso) | Yes | ≥ `"0.00"` |
| `final_taxed_interest_income` | string (peso) | Yes | ≥ `"0.00"` |
| `taxes_and_licenses` | string (peso) | Yes | ≥ `"0.00"` |
| `casualty_theft_losses` | string (peso) | Yes | ≥ `"0.00"` |
| `bad_debts` | string (peso) | Yes | ≥ `"0.00"` |
| `is_accrual_basis` | boolean | Yes | |
| `depreciation_entries` | array | Yes | Array of `DepreciationEntry` objects (see §7.1.4). Empty array `[]` is valid. Max 50 items. |
| `charitable_contributions` | string (peso) | Yes | ≥ `"0.00"` |
| `charitable_accredited` | boolean | Yes | |
| `research_development` | string (peso) | Yes | ≥ `"0.00"` |
| `entertainment_representation` | string (peso) | Yes | ≥ `"0.00"` |
| `home_office_expense` | string (peso) | Yes | ≥ `"0.00"` |
| `home_office_exclusive_use` | boolean | Yes | |
| `nolco_entries` | array | Yes | Array of `NolcoEntry` objects (see §7.1.5). Empty array `[]` is valid. Max 3 items. |

#### 7.1.2 `QuarterlyPayment` Object

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `quarter` | integer | Yes | 1, 2, or 3 |
| `amount_paid` | string (peso) | Yes | ≥ `"0.00"` |
| `date_paid` | string or null | No | ISO 8601 date `"YYYY-MM-DD"`. null if date unknown. |
| `form_1701q_period` | string | Yes | `"Q1"`, `"Q2"`, or `"Q3"`. Must match `quarter` field. |

#### 7.1.3 `Form2307Entry` Object

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `payor_name` | string | Yes | Non-empty. Max 200 chars. |
| `payor_tin` | string | Yes | Format: `"XXX-XXX-XXX"` or `"XXX-XXX-XXX-XXXX"`. Digits and dashes only. |
| `atc_code` | string | Yes | Non-empty. Max 10 chars. See [lookup-tables/cwt-ewt-rates.md](../domain/lookup-tables/cwt-ewt-rates.md) for valid codes. Unknown codes accepted (trigger MRF-021 warning in result). |
| `income_payment` | string (peso) | Yes | ≥ `"0.00"` |
| `tax_withheld` | string (peso) | Yes | ≥ `"0.00"` AND ≤ `income_payment` |
| `period_from` | string | Yes | ISO 8601 date `"YYYY-MM-DD"` |
| `period_to` | string | Yes | ISO 8601 date `"YYYY-MM-DD"`. Must be ≥ `period_from`. |
| `quarter_of_credit` | integer or null | No | 1, 2, or 3, or `null` (credit on annual return). |

#### 7.1.4 `DepreciationEntry` Object

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `asset_name` | string | Yes | Non-empty. Max 200 chars. |
| `asset_cost` | string (peso) | Yes | ≥ `"0.00"` |
| `salvage_value` | string (peso) | Yes | ≥ `"0.00"` AND ≤ `asset_cost` |
| `useful_life_years` | integer | Yes | 1–50 inclusive |
| `acquisition_date` | string | Yes | ISO 8601 date `"YYYY-MM-DD"` |
| `method` | string | Yes | `"STRAIGHT_LINE"` or `"DECLINING_BALANCE"` |
| `prior_accumulated_depreciation` | string (peso) | Yes | ≥ `"0.00"` |

#### 7.1.5 `NolcoEntry` Object

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `year_incurred` | integer | Yes | 2018–(tax_year − 1). Must be prior to the current `tax_year`. |
| `original_loss` | string (peso) | Yes | > `"0.00"` |
| `applied_prior_years` | string (peso) | Yes | ≥ `"0.00"` AND ≤ `original_loss` |

**Full example request body:**
```json
{
  "taxpayer_type": "PURELY_SE",
  "tax_year": 2025,
  "filing_period": "ANNUAL",
  "is_vat_registered": false,
  "is_bmbe_registered": false,
  "subject_to_sec_117_128": false,
  "is_gpp_partner": false,
  "gross_receipts": "1200000.00",
  "sales_returns_allowances": "0.00",
  "non_operating_income": "0.00",
  "fwt_income": "0.00",
  "cost_of_goods_sold": "0.00",
  "taxable_compensation": "0.00",
  "compensation_cwt": "0.00",
  "itemized_expenses": {
    "salaries_and_wages": "0.00",
    "sss_philhealth_pagibig_employer_share": "0.00",
    "rent": "60000.00",
    "utilities": "24000.00",
    "communication": "12000.00",
    "office_supplies": "5000.00",
    "professional_fees_paid": "0.00",
    "travel_transportation": "15000.00",
    "insurance_premiums": "0.00",
    "interest_expense": "0.00",
    "final_taxed_interest_income": "0.00",
    "taxes_and_licenses": "3000.00",
    "casualty_theft_losses": "0.00",
    "bad_debts": "0.00",
    "is_accrual_basis": false,
    "depreciation_entries": [
      {
        "asset_name": "MacBook Pro 14-inch 2023",
        "asset_cost": "120000.00",
        "salvage_value": "10000.00",
        "useful_life_years": 5,
        "acquisition_date": "2023-01-15",
        "method": "STRAIGHT_LINE",
        "prior_accumulated_depreciation": "22000.00"
      }
    ],
    "charitable_contributions": "0.00",
    "charitable_accredited": false,
    "research_development": "0.00",
    "entertainment_representation": "0.00",
    "home_office_expense": "0.00",
    "home_office_exclusive_use": false,
    "nolco_entries": []
  },
  "elected_regime": null,
  "prior_quarterly_payments": [
    {
      "quarter": 1,
      "amount_paid": "8000.00",
      "date_paid": "2025-05-14",
      "form_1701q_period": "Q1"
    },
    {
      "quarter": 2,
      "amount_paid": "12000.00",
      "date_paid": "2025-08-13",
      "form_1701q_period": "Q2"
    },
    {
      "quarter": 3,
      "amount_paid": "10000.00",
      "date_paid": "2025-11-14",
      "form_1701q_period": "Q3"
    }
  ],
  "cwt_2307_entries": [
    {
      "payor_name": "Acme Corp",
      "payor_tin": "001-234-567",
      "atc_code": "WI010",
      "income_payment": "500000.00",
      "tax_withheld": "25000.00",
      "period_from": "2025-01-01",
      "period_to": "2025-12-31",
      "quarter_of_credit": null
    }
  ],
  "prior_year_excess_cwt": "0.00",
  "actual_filing_date": null,
  "return_type": "ORIGINAL",
  "prior_payment_for_return": "0.00"
}
```

**Response: `200 OK`**

```json
{
  "input_summary": {
    "taxpayer_type": "PURELY_SE",
    "tax_year": 2025,
    "filing_period": "ANNUAL",
    "gross_receipts": "1200000.00",
    "net_gross_receipts": "1200000.00",
    "taxable_compensation": "0.00",
    "is_vat_registered": false,
    "is_bmbe_registered": false,
    "elected_regime": null
  },
  "comparison": [
    {
      "path": "PATH_C",
      "income_tax_due": "76000.00",
      "percentage_tax_due": "0.00",
      "total_tax_burden": "76000.00",
      "label": "8% Flat Rate",
      "requires_documentation": false,
      "effective_rate": "0.0633"
    },
    {
      "path": "PATH_B",
      "income_tax_due": "97000.00",
      "percentage_tax_due": "36000.00",
      "total_tax_burden": "133000.00",
      "label": "Graduated + OSD (40%)",
      "requires_documentation": false,
      "effective_rate": "0.1108"
    },
    {
      "path": "PATH_A",
      "income_tax_due": "103500.00",
      "percentage_tax_due": "36000.00",
      "total_tax_burden": "139500.00",
      "label": "Graduated + Itemized Deductions",
      "requires_documentation": true,
      "effective_rate": "0.1163"
    }
  ],
  "recommended_regime": "PATH_C",
  "using_locked_regime": false,
  "savings_vs_worst": "63500.00",
  "savings_vs_next_best": "57000.00",
  "selected_path": "PATH_C",
  "selected_income_tax_due": "76000.00",
  "selected_percentage_tax_due": "0.00",
  "selected_total_tax": "76000.00",
  "path_a_details": {
    "eligible": true,
    "pt_deduction_applied": "36000.00",
    "biz_nti": "959000.00",
    "total_nti": "959000.00",
    "income_tax_due": "103500.00",
    "deduction_method": "ITEMIZED",
    "path_label": "Path A — Graduated + Itemized Deductions"
  },
  "path_b_details": {
    "eligible": true,
    "biz_nti": "720000.00",
    "total_nti": "720000.00",
    "income_tax_due": "97000.00",
    "osd_amount": "480000.00",
    "deduction_method": "OSD",
    "path_label": "Path B — Graduated + OSD (40%)"
  },
  "path_c_details": {
    "eligible": true,
    "ineligible_reasons": [],
    "exempt_amount": "250000.00",
    "taxable_base": "950000.00",
    "income_tax_due": "76000.00",
    "compensation_it": "0.00",
    "total_income_tax": "76000.00",
    "pt_waived": true,
    "deduction_method": "NONE",
    "path_label": "Path C — 8% Flat Rate"
  },
  "gross_aggregates": {
    "net_gross_receipts": "1200000.00",
    "gross_income": "1200000.00",
    "threshold_base": "1200000.00",
    "eight_pct_base": "1200000.00",
    "graduated_income_base": "1200000.00",
    "pt_quarterly_base": "1200000.00",
    "taxpayer_class": "SERVICE_PROVIDER"
  },
  "total_it_credits": "55000.00",
  "cwt_credits": "25000.00",
  "quarterly_payments": "30000.00",
  "prior_year_excess": "0.00",
  "compensation_cwt": "0.00",
  "balance": "21000.00",
  "disposition": "BALANCE_PAYABLE",
  "overpayment": "0.00",
  "installment_eligible": true,
  "installment_first_due": "10500.00",
  "installment_second_due": "10500.00",
  "pt_result": {
    "pt_applies": false,
    "pt_rate": "0.03",
    "pt_base": "0.00",
    "pt_due": "0.00",
    "form_2551q_required": false,
    "filing_deadline": null,
    "reason": "8% flat rate elected: percentage tax waived per NIRC Sec. 24(A)(2)(b)."
  },
  "form_type": "FORM_1701A",
  "form_output": { /* Form1701AOutput — full struct as defined in engine/data-model.md §5.1 */ },
  "pt_form_output": null,
  "required_attachments": [
    "Photocopies of BIR Form 2307 (Certificate of Creditable Withholding Tax)",
    "Summary Alphalist of Withholding Taxes (SAWT) — DAT file"
  ],
  "penalties": null,
  "manual_review_flags": [],
  "warnings": [],
  "engine_version": "1.0.0",
  "computed_at": "2026-03-02T14:30:00.000Z"
}
```

**Note on `form_output`:** The `form_output` object contains the fully populated BIR form struct. The response body will contain the full struct inline (not a reference). The `Form1701AOutput`, `Form1701Output`, and `Form1701QOutput` shapes are defined in [engine/data-model.md](../engine/data-model.md) §5.1–§5.3. Every field from those structs is serialized as-is (monetary fields as strings, booleans as JSON boolean, dates as ISO 8601 strings).

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 400 | `ERR_MALFORMED_JSON` | Request body is not valid JSON |
| 400 | `ERR_MISSING_REQUIRED_FIELD` | Any required field is absent |
| 400 | `ERR_INVALID_FIELD_TYPE` | Field has wrong type |
| 400 | `ERR_MONETARY_FORMAT` | Monetary string has invalid format |
| 415 | (standard) | Wrong Content-Type |
| 422 | `ERR_VALIDATION_FAILED` | Engine validation failed. `details` array contains one entry per validation error with `field`, `code`, and `message`. See [engine/error-states.md](../engine/error-states.md) for all 28 validation error codes. |
| 429 | `ERR_RATE_LIMIT_EXCEEDED` | Rate limit exceeded. `Retry-After` header included. |
| 500 | `ERR_ENGINE_ASSERTION` | Internal engine invariant violated. Indicates a bug. |

---

## 8. Computation History

Requires Pro or Enterprise subscription. Free users who call these endpoints receive `403 ERR_REQUIRES_PRO`.

### 8.1 `POST /computations`

Compute tax AND save the result to the database. Requires authentication.

**Authentication required:** Session cookie or API key. Requires Pro or Enterprise subscription.

**Request body:** Identical to `POST /compute` (§7.1), with two additional optional fields:

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `label` | string | No | Max 200 chars. Custom name for this saved computation. Default: auto-generated as `"<filing_period> <tax_year> — Tax Optimization"` (e.g., `"ANNUAL 2025 — Tax Optimization"`). |
| `notes` | string | No | Max 2000 chars. Free-text notes. Default: `""`. |

**Response: `201 Created`**

```json
{
  "id": "comp_uuid_here",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "label": "ANNUAL 2025 — Tax Optimization",
  "notes": "",
  "tax_year": 2025,
  "filing_period": "ANNUAL",
  "taxpayer_type": "PURELY_SE",
  "gross_receipts": "1200000.00",
  "recommended_path": "PATH_C",
  "selected_path": "PATH_C",
  "status": "COMPLETE",
  "created_at": "2026-03-02T14:30:00.000Z",
  "updated_at": "2026-03-02T14:30:00.000Z",
  "result": { /* full TaxComputationResult as in POST /compute response */ }
}
```

**Errors:** Same as `POST /compute`, plus:

| HTTP | Code | Condition |
|------|------|-----------|
| 401 | `ERR_UNAUTHENTICATED` | Not logged in |
| 403 | `ERR_REQUIRES_PRO` | User is on Free tier |

---

### 8.2 `GET /computations`

List the authenticated user's saved computations. Paginated.

**Authentication required:** Session cookie or API key. Requires Pro or Enterprise.

**Query parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `cursor` | string | (none) | Pagination cursor from previous response |
| `limit` | integer | 20 | Items per page. Max 100. |
| `tax_year` | integer | (none) | Filter by tax year (e.g., `2025`) |
| `filing_period` | string | (none) | Filter by filing period: `"Q1"`, `"Q2"`, `"Q3"`, or `"ANNUAL"` |
| `recommended_path` | string | (none) | Filter by recommended path: `"PATH_A"`, `"PATH_B"`, or `"PATH_C"` |
| `sort` | string | `"created_at_desc"` | Sort order. Options: `"created_at_desc"`, `"created_at_asc"`, `"tax_year_desc"`, `"gross_receipts_desc"` |

**Response: `200 OK`**

```json
{
  "data": [
    {
      "id": "comp_uuid_here",
      "label": "ANNUAL 2025 — Tax Optimization",
      "notes": "",
      "tax_year": 2025,
      "filing_period": "ANNUAL",
      "taxpayer_type": "PURELY_SE",
      "gross_receipts": "1200000.00",
      "recommended_path": "PATH_C",
      "selected_path": "PATH_C",
      "selected_total_tax": "76000.00",
      "savings_vs_worst": "63500.00",
      "status": "COMPLETE",
      "created_at": "2026-03-02T14:30:00.000Z",
      "updated_at": "2026-03-02T14:30:00.000Z"
    }
  ],
  "meta": {
    "total_count": 12,
    "cursor_next": "eyJpZCI6ImNvbXBfdXVpZCJ9",
    "cursor_prev": null
  }
}
```

**Note:** List response does NOT include `result` (full `TaxComputationResult`). Use `GET /computations/:id` to retrieve the full result for a specific computation.

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 400 | `ERR_VALIDATION_FAILED` | Invalid query parameter value |
| 401 | `ERR_UNAUTHENTICATED` | Not logged in |
| 403 | `ERR_REQUIRES_PRO` | Free tier user |

---

### 8.3 `GET /computations/:id`

Get the full details of a single saved computation, including the complete `TaxComputationResult`.

**Authentication required:** Session cookie or API key. Must be owner of the computation (or CPA with client relationship, or Admin).

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string (UUID) | Computation ID |

**Response: `200 OK`**

```json
{
  "id": "comp_uuid_here",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "label": "ANNUAL 2025 — Tax Optimization",
  "notes": "",
  "tax_year": 2025,
  "filing_period": "ANNUAL",
  "taxpayer_type": "PURELY_SE",
  "gross_receipts": "1200000.00",
  "recommended_path": "PATH_C",
  "selected_path": "PATH_C",
  "status": "COMPLETE",
  "created_at": "2026-03-02T14:30:00.000Z",
  "updated_at": "2026-03-02T14:30:00.000Z",
  "result": { /* full TaxComputationResult */ }
}
```

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 401 | `ERR_UNAUTHENTICATED` | Not logged in |
| 403 | `ERR_FORBIDDEN` | Computation belongs to another user and no CPA relationship exists |
| 403 | `ERR_REQUIRES_PRO` | Free tier user |
| 404 | `ERR_NOT_FOUND` | Computation not found |

---

### 8.4 `PATCH /computations/:id`

Update the label or notes on a saved computation. Does NOT recompute.

**Authentication required:** Session cookie or API key. Must be owner.

**Request body (all fields optional):**

| Field | Type | Validation |
|-------|------|-----------|
| `label` | string | Max 200 chars |
| `notes` | string | Max 2000 chars |

**Response: `200 OK`**

Returns the updated computation summary (same shape as list item in `GET /computations`, without `result`).

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 401 | `ERR_UNAUTHENTICATED` | Not logged in |
| 403 | `ERR_FORBIDDEN` | Not the owner |
| 403 | `ERR_REQUIRES_PRO` | Free tier user |
| 404 | `ERR_NOT_FOUND` | Computation not found |

---

### 8.5 `DELETE /computations/:id`

Permanently delete a saved computation and all associated exports.

**Authentication required:** Session cookie or API key. Must be owner.

**Response: `204 No Content`**

**Side effects:**
- Hard-deletes `computations` row
- Cascades to `computation_cwt_entries` and `computation_quarterly_payments`
- Cascades to `pdf_exports` (deletes export records; underlying S3 objects purged by nightly cleanup job)

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 401 | `ERR_UNAUTHENTICATED` | Not logged in |
| 403 | `ERR_FORBIDDEN` | Not the owner |
| 404 | `ERR_NOT_FOUND` | Computation not found |

---

## 9. PDF Export

Requires Pro or Enterprise subscription.

### 9.1 `POST /computations/:id/exports`

Generate a PDF export of a saved computation.

**Authentication required:** Session cookie or API key. Must be owner (or Enterprise CPA with client relationship). Requires Pro or Enterprise subscription.

**Request body:**

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `export_type` | string | Yes | `"SUMMARY"`, `"FORM_1701"`, `"FORM_1701A"`, `"FORM_1701Q"`, or `"FORM_2551Q"` |
| `white_label_logo_url` | string or null | No | HTTPS URL of a PNG/JPG logo to embed. Max 1MB. Null uses default TaxOptimizer branding. Enterprise only. |

**Validation rules:**
- `"FORM_1701"` is only valid if computation's `form_type == "FORM_1701"`. Returns `422 ERR_VALIDATION_FAILED` with message `"FORM_1701 export not applicable for this computation. This computation uses Form 1701A."` otherwise.
- `"FORM_1701A"` is only valid if computation's `form_type == "FORM_1701A"`.
- `"FORM_1701Q"` is only valid if computation's `filing_period` is `"Q1"`, `"Q2"`, or `"Q3"`.
- `"FORM_2551Q"` is only valid if computation's `pt_result.form_2551q_required == true`.
- `white_label_logo_url` is only accepted for Enterprise users. Pro users sending this field receive `403 ERR_REQUIRES_ENTERPRISE`.

**Example request:**
```json
{
  "export_type": "SUMMARY",
  "white_label_logo_url": null
}
```

**Response: `202 Accepted`**

```json
{
  "export_id": "export_uuid_here",
  "status": "PENDING",
  "export_type": "SUMMARY",
  "created_at": "2026-03-02T14:31:00.000Z",
  "estimated_ready_seconds": 5
}
```

PDF generation is asynchronous (typical latency: 2–8 seconds). Poll `GET /computations/:id/exports/:export_id` to check status.

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 401 | `ERR_UNAUTHENTICATED` | Not logged in |
| 403 | `ERR_REQUIRES_PRO` | Free tier user |
| 403 | `ERR_REQUIRES_ENTERPRISE` | `white_label_logo_url` set but not Enterprise user |
| 403 | `ERR_FORBIDDEN` | Not the owner of the computation |
| 404 | `ERR_NOT_FOUND` | Computation not found |
| 422 | `ERR_VALIDATION_FAILED` | `export_type` not applicable for this computation |

---

### 9.2 `GET /computations/:id/exports/:export_id`

Check the status of a pending export, or download the completed PDF.

**Authentication required:** Session cookie or API key. Must be owner.

**Behavior by export status:**

- `status == "PENDING"` or `status == "PROCESSING"`: Returns `200 OK` with JSON body:
  ```json
  {
    "export_id": "export_uuid_here",
    "status": "PENDING",
    "export_type": "SUMMARY",
    "created_at": "2026-03-02T14:31:00.000Z"
  }
  ```

- `status == "COMPLETE"`: Returns `302 Found` redirect to a signed S3 URL for the PDF file. The signed URL is valid for 60 minutes. Header: `Location: https://s3.ap-southeast-1.amazonaws.com/taxoptimizer-exports/...?X-Amz-Signature=...`. The client follows the redirect to download the PDF directly from S3.

- `status == "FAILED"`: Returns `200 OK` with JSON body:
  ```json
  {
    "export_id": "export_uuid_here",
    "status": "FAILED",
    "export_type": "SUMMARY",
    "error_message": "PDF generation failed: template rendering error. Please retry.",
    "created_at": "2026-03-02T14:31:00.000Z"
  }
  ```

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 401 | `ERR_UNAUTHENTICATED` | Not logged in |
| 403 | `ERR_FORBIDDEN` | Not the owner |
| 404 | `ERR_NOT_FOUND` | Export or computation not found |

---

### 9.3 `GET /computations/:id/exports`

List all PDF exports for a computation.

**Authentication required:** Session cookie or API key. Must be owner.

**Response: `200 OK`**

```json
{
  "data": [
    {
      "export_id": "export_uuid_here",
      "export_type": "SUMMARY",
      "status": "COMPLETE",
      "file_size_bytes": 85432,
      "created_at": "2026-03-02T14:31:00.000Z",
      "completed_at": "2026-03-02T14:31:07.000Z"
    }
  ],
  "meta": {
    "total_count": 1,
    "cursor_next": null,
    "cursor_prev": null
  }
}
```

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 401 | `ERR_UNAUTHENTICATED` | Not logged in |
| 403 | `ERR_FORBIDDEN` | Not the owner |
| 404 | `ERR_NOT_FOUND` | Computation not found |

---

## 10. CPA Client Management

Requires CPA role (`users.role == 'CPA'`) and Enterprise subscription.

### 10.1 `GET /clients`

List all clients under the authenticated CPA.

**Authentication required:** Session cookie or API key. Requires CPA role + Enterprise subscription.

**Query parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `cursor` | string | (none) | Pagination cursor |
| `limit` | integer | 20 | Max 100 |
| `search` | string | (none) | Filter by client name or email (substring, case-insensitive) |
| `sort` | string | `"created_at_desc"` | `"created_at_desc"`, `"created_at_asc"`, `"name_asc"`, `"name_desc"` |

**Response: `200 OK`**

```json
{
  "data": [
    {
      "client_id": "cpa_client_uuid_here",
      "client_user_id": "550e8400-e29b-41d4-a716-446655440001",
      "display_name": "Juan dela Cruz",
      "email": "juan@example.com",
      "tin": "234-567-890",
      "notes": "Freelance graphic designer, 8% filer",
      "computation_count": 8,
      "latest_computation_at": "2026-03-01T10:00:00.000Z",
      "created_at": "2025-06-15T08:00:00.000Z"
    }
  ],
  "meta": {
    "total_count": 15,
    "cursor_next": null,
    "cursor_prev": null
  }
}
```

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 401 | `ERR_UNAUTHENTICATED` | Not logged in |
| 403 | `ERR_REQUIRES_CPA_ROLE` | User role is not CPA |
| 403 | `ERR_REQUIRES_ENTERPRISE` | Not Enterprise subscriber |

---

### 10.2 `POST /clients`

Add a client to the CPA's roster. The client must have a registered TaxOptimizer account.

**Authentication required:** Session cookie or API key. Requires CPA role + Enterprise.

**Request body:**

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `client_email` | string | Yes | Email of existing TaxOptimizer account. Must not already be in this CPA's client list. |
| `display_name` | string | No | Custom display name for this client in CPA dashboard. Max 200 chars. Default: client's registered full name. |
| `notes` | string | No | Free-text notes about this client. Max 2000 chars. Default: `""`. |

**Example request:**
```json
{
  "client_email": "juan.delacruz@gmail.com",
  "display_name": "Juan dela Cruz",
  "notes": "Freelance graphic designer. Files annually. 8% filer."
}
```

**Response: `201 Created`**

```json
{
  "client_id": "cpa_client_uuid_here",
  "client_user_id": "550e8400-e29b-41d4-a716-446655440001",
  "display_name": "Juan dela Cruz",
  "email": "juan.delacruz@gmail.com",
  "tin": "234-567-890",
  "notes": "Freelance graphic designer. Files annually. 8% filer.",
  "created_at": "2026-03-02T14:30:00.000Z"
}
```

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 400 | `ERR_VALIDATION_FAILED` | Email format invalid or `display_name` too long |
| 401 | `ERR_UNAUTHENTICATED` | Not logged in |
| 403 | `ERR_REQUIRES_CPA_ROLE` | Not a CPA user |
| 403 | `ERR_REQUIRES_ENTERPRISE` | Not Enterprise |
| 404 | `ERR_NOT_FOUND` | No registered user found with `client_email` |
| 409 | `ERR_CONFLICT` | Client already in this CPA's roster |

---

### 10.3 `GET /clients/:client_id`

Get details for a specific client.

**Authentication required:** Session cookie or API key. Must be the owning CPA. Enterprise only.

**Response: `200 OK`**

Same shape as a single item from `GET /clients`, with an added `computations_preview` array (last 5 computations):

```json
{
  "client_id": "cpa_client_uuid_here",
  "client_user_id": "550e8400-e29b-41d4-a716-446655440001",
  "display_name": "Juan dela Cruz",
  "email": "juan.delacruz@gmail.com",
  "tin": "234-567-890",
  "notes": "Freelance graphic designer. Files annually.",
  "computation_count": 8,
  "latest_computation_at": "2026-03-01T10:00:00.000Z",
  "created_at": "2025-06-15T08:00:00.000Z",
  "computations_preview": [
    {
      "id": "comp_uuid_here",
      "label": "ANNUAL 2025 — Tax Optimization",
      "tax_year": 2025,
      "filing_period": "ANNUAL",
      "recommended_path": "PATH_C",
      "selected_total_tax": "76000.00",
      "created_at": "2026-03-01T10:00:00.000Z"
    }
  ]
}
```

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 401 | `ERR_UNAUTHENTICATED` | Not logged in |
| 403 | `ERR_REQUIRES_CPA_ROLE` | Not a CPA |
| 403 | `ERR_REQUIRES_ENTERPRISE` | Not Enterprise |
| 403 | `ERR_FORBIDDEN` | Client belongs to a different CPA |
| 404 | `ERR_NOT_FOUND` | Client ID not found |

---

### 10.4 `PATCH /clients/:client_id`

Update display name or notes for a client.

**Authentication required:** Session cookie or API key. Owning CPA only. Enterprise only.

**Request body (all fields optional):**

| Field | Type | Validation |
|-------|------|-----------|
| `display_name` | string | Max 200 chars |
| `notes` | string | Max 2000 chars |

**Response: `200 OK`**

Returns updated client object (same shape as `GET /clients/:client_id` without `computations_preview`).

**Errors:** Same as `GET /clients/:client_id`.

---

### 10.5 `DELETE /clients/:client_id`

Remove a client from the CPA's roster. Does NOT delete the client's TaxOptimizer account or computations.

**Authentication required:** Session cookie or API key. Owning CPA only. Enterprise only.

**Response: `204 No Content`**

**Side effects:**
- Deletes `cpa_clients` row
- Deletes all `cpa_client_computations` rows linking this CPA to this client
- Client retains full access to their own computations; CPA loses access

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 401 | `ERR_UNAUTHENTICATED` | Not logged in |
| 403 | `ERR_FORBIDDEN` | Client belongs to different CPA |
| 404 | `ERR_NOT_FOUND` | Client ID not found |

---

### 10.6 `GET /clients/:client_id/computations`

List computations for a specific client. Returns the same shape as `GET /computations` but for the client's computations.

**Authentication required:** Session cookie or API key. Owning CPA. Enterprise only.

**Query parameters:** Same as `GET /computations` (§8.2).

**Response: `200 OK`**

Same shape as `GET /computations` response. Computations are the client's saved computations that the CPA has access to via `cpa_client_computations` table.

**Errors:** Same as `GET /clients/:client_id`.

---

### 10.7 `POST /clients/:client_id/computations`

Compute and save a computation on behalf of a client.

**Authentication required:** Session cookie or API key. Owning CPA. Enterprise only.

**Request body:** Same as `POST /computations` (§8.1).

**Response: `201 Created`**

Same shape as `POST /computations` response, but `user_id` is the client's user ID (not the CPA's). A `cpa_client_computations` row is also created linking this computation to the CPA.

**Errors:** Same as `POST /computations`, plus errors from `GET /clients/:client_id`.

---

## 11. Batch API

Requires Enterprise subscription. API key authentication strongly recommended for batch use.

### 11.1 `POST /batch/computations`

Submit a batch of up to 50 tax computations for asynchronous processing.

**Authentication required:** Session cookie or API key. Enterprise only.

**Request body:**

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `computations` | array | Yes | Array of `BatchComputationItem` objects. Min 1, max 50 items. |
| `label_prefix` | string | No | Prefix applied to auto-generated labels. Max 50 chars. Default: `"Batch"`. |

Each `BatchComputationItem` object:

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `external_id` | string | No | Caller-supplied identifier for correlating results. Max 100 chars. Returned in results. |
| `label` | string | No | Label for this computation. Max 200 chars. |
| `input` | object | Yes | Full `TaxpayerInput` JSON object (same fields as `POST /compute` §7.1) |

**Example request:**
```json
{
  "label_prefix": "AY2025 Batch",
  "computations": [
    {
      "external_id": "client_001",
      "label": "Juan dela Cruz — AY2025",
      "input": { /* TaxpayerInput */ }
    },
    {
      "external_id": "client_002",
      "label": "Maria Santos — AY2025",
      "input": { /* TaxpayerInput */ }
    }
  ]
}
```

**Response: `202 Accepted`**

```json
{
  "batch_id": "batch_uuid_here",
  "status": "QUEUED",
  "total_items": 2,
  "queued_at": "2026-03-02T14:30:00.000Z",
  "estimated_completion_seconds": 30
}
```

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 400 | `ERR_VALIDATION_FAILED` | Batch array empty or exceeds 50 items |
| 400 | `ERR_MALFORMED_JSON` | Malformed JSON |
| 401 | `ERR_UNAUTHENTICATED` | Not logged in |
| 403 | `ERR_REQUIRES_ENTERPRISE` | Not Enterprise subscriber |
| 429 | `ERR_RATE_LIMIT_EXCEEDED` | Max concurrent batches (5) for this account exceeded |

---

### 11.2 `GET /batch/:batch_id`

Check the status of a batch job.

**Authentication required:** Session cookie or API key. Must be owner. Enterprise only.

**Response: `200 OK`**

```json
{
  "batch_id": "batch_uuid_here",
  "status": "PROCESSING",
  "total_items": 50,
  "completed_items": 23,
  "failed_items": 1,
  "queued_at": "2026-03-02T14:30:00.000Z",
  "started_at": "2026-03-02T14:30:05.000Z",
  "completed_at": null
}
```

`status` values: `"QUEUED"` (waiting to start), `"PROCESSING"` (running), `"COMPLETE"` (all items done), `"PARTIAL_FAILURE"` (done with some failures).

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 401 | `ERR_UNAUTHENTICATED` | Not logged in |
| 403 | `ERR_FORBIDDEN` | Batch belongs to another user |
| 403 | `ERR_REQUIRES_ENTERPRISE` | Not Enterprise |
| 404 | `ERR_NOT_FOUND` | Batch not found |

---

### 11.3 `GET /batch/:batch_id/results`

Get results for a completed batch. Available when `status == "COMPLETE"` or `"PARTIAL_FAILURE"`.

**Authentication required:** Session cookie or API key. Must be owner. Enterprise only.

**Query parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `cursor` | string | (none) | Pagination cursor |
| `limit` | integer | 20 | Max 100 |
| `status_filter` | string | (none) | `"SUCCESS"` or `"FAILED"` to filter results |

**Response: `200 OK`**

```json
{
  "data": [
    {
      "item_index": 0,
      "external_id": "client_001",
      "label": "Juan dela Cruz — AY2025",
      "status": "SUCCESS",
      "computation_id": "comp_uuid_here",
      "recommended_path": "PATH_C",
      "selected_total_tax": "76000.00",
      "savings_vs_worst": "63500.00"
    },
    {
      "item_index": 1,
      "external_id": "client_002",
      "label": "Maria Santos — AY2025",
      "status": "FAILED",
      "computation_id": null,
      "error_code": "ERR_VALIDATION_FAILED",
      "error_message": "gross_receipts exceeds ₱3,000,000 but is_vat_registered is false.",
      "error_details": [
        {
          "field": "gross_receipts",
          "code": "ERR_EXCEEDS_VAT_THRESHOLD_NOT_REGISTERED",
          "message": "gross_receipts exceeds ₱3,000,000 but is_vat_registered is false. If taxpayer is VAT-registered, set is_vat_registered = true."
        }
      ]
    }
  ],
  "meta": {
    "total_count": 50,
    "cursor_next": "eyJpZGV4IjoyfQ",
    "cursor_prev": null
  }
}
```

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 400 | `ERR_VALIDATION_FAILED` | Batch not yet complete (still `PROCESSING` or `QUEUED`) |
| 401 | `ERR_UNAUTHENTICATED` | Not logged in |
| 403 | `ERR_FORBIDDEN` | Not owner |
| 403 | `ERR_REQUIRES_ENTERPRISE` | Not Enterprise |
| 404 | `ERR_NOT_FOUND` | Batch not found |

---

## 12. API Key Management

Requires Enterprise subscription.

### 12.1 `GET /api-keys`

List API keys for the authenticated user.

**Authentication required:** Session cookie ONLY (API keys cannot list other API keys). Enterprise only.

**Response: `200 OK`**

```json
{
  "data": [
    {
      "key_id": "apikey_uuid_here",
      "name": "Production Integration",
      "prefix": "tax_live_ab",
      "scopes": ["compute", "computations:read", "computations:write", "batch"],
      "last_used_at": "2026-03-01T10:00:00.000Z",
      "expires_at": null,
      "created_at": "2026-01-15T08:00:00.000Z",
      "is_active": true
    }
  ],
  "meta": {
    "total_count": 2,
    "cursor_next": null,
    "cursor_prev": null
  }
}
```

**Field descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `key_id` | string (UUID) | Permanent identifier for the key |
| `name` | string | Human-readable label |
| `prefix` | string | First 8 characters of the raw key (for identification). Full key is never returned after creation. |
| `scopes` | array | Permission scopes granted to this key (see below) |
| `last_used_at` | string or null | Timestamp of last API request using this key. null if never used. |
| `expires_at` | string or null | Expiry timestamp. null for non-expiring keys. |
| `created_at` | string | Creation timestamp |
| `is_active` | boolean | false if revoked via DELETE |

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 401 | `ERR_UNAUTHENTICATED` | Not logged in |
| 403 | `ERR_REQUIRES_ENTERPRISE` | Not Enterprise |

---

### 12.2 `POST /api-keys`

Create a new API key.

**Authentication required:** Session cookie ONLY. Enterprise only.

**Request body:**

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `name` | string | Yes | Max 100 chars. Non-empty. Must be unique among this user's active keys. |
| `scopes` | array | Yes | Array of scope strings (see table below). Min 1 scope. |
| `expires_at` | string or null | No | ISO 8601 UTC timestamp. Must be in the future. null for non-expiring keys. |

**Available scopes:**

| Scope | Permissions |
|-------|-------------|
| `compute` | Access to `POST /compute` (anonymous compute, no save) |
| `computations:read` | Access to `GET /computations`, `GET /computations/:id` |
| `computations:write` | Access to `POST /computations`, `PATCH /computations/:id`, `DELETE /computations/:id` |
| `exports:read` | Access to `GET /computations/:id/exports`, `GET /computations/:id/exports/:id` |
| `exports:write` | Access to `POST /computations/:id/exports` |
| `clients:read` | Access to `GET /clients`, `GET /clients/:id`, `GET /clients/:id/computations` |
| `clients:write` | Access to `POST /clients`, `PATCH /clients/:id`, `DELETE /clients/:id`, `POST /clients/:id/computations` |
| `batch` | Access to all `/batch/*` endpoints |

**Example request:**
```json
{
  "name": "Production Integration",
  "scopes": ["compute", "computations:write", "batch"],
  "expires_at": null
}
```

**Response: `201 Created`**

```json
{
  "key_id": "apikey_uuid_here",
  "name": "Production Integration",
  "raw_key": "tax_live_ab12cd34ef56gh78ij90kl12mn34op56qr78st90uv12wx34yz",
  "prefix": "tax_live_ab",
  "scopes": ["compute", "computations:write", "batch"],
  "expires_at": null,
  "created_at": "2026-03-02T14:30:00.000Z"
}
```

**IMPORTANT:** The `raw_key` is returned **once only** at creation and never again. Store it securely. The API stores only the BLAKE2b-256 hash of the key.

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 400 | `ERR_MISSING_REQUIRED_FIELD` | `name` or `scopes` absent |
| 400 | `ERR_VALIDATION_FAILED` | Invalid scope string, `expires_at` in the past, or max 10 active keys exceeded |
| 401 | `ERR_UNAUTHENTICATED` | Not logged in |
| 403 | `ERR_REQUIRES_ENTERPRISE` | Not Enterprise |
| 409 | `ERR_DUPLICATE_API_KEY_NAME` | A key with this name already exists for this user |

---

### 12.3 `DELETE /api-keys/:key_id`

Revoke an API key. Immediately deactivates the key — in-flight requests using the key will fail after this completes.

**Authentication required:** Session cookie ONLY. Must be owner. Enterprise only.

**Response: `204 No Content`**

**Side effects:**
- Sets `api_keys.revoked_at = NOW()` and `is_active = false`
- Key is immediately rejected on next use
- Row is retained for 90 days for audit log purposes, then deleted

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 401 | `ERR_UNAUTHENTICATED` | Not logged in |
| 403 | `ERR_FORBIDDEN` | Key belongs to different user |
| 403 | `ERR_REQUIRES_ENTERPRISE` | Not Enterprise |
| 404 | `ERR_NOT_FOUND` | Key not found or already revoked |

---

## 13. Billing

### 13.1 `GET /billing/subscription`

Get the current user's subscription details.

**Authentication required:** Session cookie or API key.

**Response: `200 OK`**

```json
{
  "plan": "PRO",
  "status": "ACTIVE",
  "billing_cycle": "MONTHLY",
  "current_period_start": "2026-03-01T00:00:00.000Z",
  "current_period_end": "2026-04-01T00:00:00.000Z",
  "trial_end": null,
  "cancel_at_period_end": false,
  "monthly_price_peso": "299.00",
  "next_billing_date": "2026-04-01T00:00:00.000Z",
  "payment_method": {
    "type": "card",
    "brand": "visa",
    "last4": "4242",
    "exp_month": 12,
    "exp_year": 2028
  }
}
```

For users with no subscription record (`plan == "FREE"`):
```json
{
  "plan": "FREE",
  "status": "NONE",
  "billing_cycle": null,
  "current_period_start": null,
  "current_period_end": null,
  "trial_end": null,
  "cancel_at_period_end": false,
  "monthly_price_peso": "0.00",
  "next_billing_date": null,
  "payment_method": null
}
```

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 401 | `ERR_UNAUTHENTICATED` | Not logged in |

---

### 13.2 `POST /billing/checkout`

Create a Stripe Checkout session to subscribe or upgrade.

**Authentication required:** Session cookie. Email must be verified.

**Request body:**

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `plan` | string | Yes | `"PRO"` or `"ENTERPRISE"`. Cannot subscribe to `"FREE"` (that's the default). |
| `billing_cycle` | string | Yes | `"MONTHLY"` or `"ANNUAL"` |
| `success_url` | string | Yes | HTTPS URL on `taxoptimizer.ph` domain to redirect after successful payment |
| `cancel_url` | string | Yes | HTTPS URL on `taxoptimizer.ph` domain to redirect if user cancels checkout |

**Example request:**
```json
{
  "plan": "PRO",
  "billing_cycle": "MONTHLY",
  "success_url": "https://taxoptimizer.ph/dashboard?subscription=success",
  "cancel_url": "https://taxoptimizer.ph/pricing?subscription=cancelled"
}
```

**Response: `200 OK`**

```json
{
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_live_...",
  "session_id": "cs_live_..."
}
```

**Side effects:**
- Creates a Stripe Checkout Session via Stripe API
- Checkout session expires after 30 minutes if uncompleted
- On payment success: Stripe sends webhook to `POST /webhooks/stripe`; the webhook creates/updates the `subscriptions` row

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 400 | `ERR_VALIDATION_FAILED` | Invalid plan or billing cycle |
| 401 | `ERR_UNAUTHENTICATED` | Not logged in |
| 403 | `ERR_EMAIL_NOT_VERIFIED` | Email not verified; cannot subscribe |
| 409 | `ERR_CONFLICT` | User already has an active subscription of this plan. Use `POST /billing/portal` to manage. |

---

### 13.3 `POST /billing/portal`

Create a Stripe Customer Portal session. Allows user to manage billing: update payment method, cancel subscription, download invoices.

**Authentication required:** Session cookie. Must have or have had a subscription (a Stripe `customer_id` must exist).

**Request body:**

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `return_url` | string | Yes | HTTPS URL on `taxoptimizer.ph` to redirect when user exits portal |

**Example request:**
```json
{ "return_url": "https://taxoptimizer.ph/settings/billing" }
```

**Response: `200 OK`**

```json
{
  "portal_url": "https://billing.stripe.com/p/session/..."
}
```

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 401 | `ERR_UNAUTHENTICATED` | Not logged in |
| 404 | `ERR_NOT_FOUND` | No Stripe customer ID exists for this user (never subscribed) |

---

### 13.4 `GET /billing/invoices`

List invoices for the authenticated user.

**Authentication required:** Session cookie or API key.

**Query parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `cursor` | string | (none) | Pagination cursor |
| `limit` | integer | 20 | Max 100 |

**Response: `200 OK`**

```json
{
  "data": [
    {
      "invoice_id": "inv_uuid_here",
      "stripe_invoice_id": "in_1ABC...",
      "status": "PAID",
      "amount_peso": "299.00",
      "billing_cycle": "MONTHLY",
      "plan": "PRO",
      "period_start": "2026-03-01T00:00:00.000Z",
      "period_end": "2026-04-01T00:00:00.000Z",
      "paid_at": "2026-03-01T08:00:00.000Z",
      "invoice_pdf_url": "https://invoice.stripe.com/..."
    }
  ],
  "meta": {
    "total_count": 3,
    "cursor_next": null,
    "cursor_prev": null
  }
}
```

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 401 | `ERR_UNAUTHENTICATED` | Not logged in |

---

## 14. Webhooks

Webhook endpoints are called by third-party services (Stripe, PayMongo). They are NOT authenticated via session or API key. Instead, they verify signatures.

### 14.1 `POST /webhooks/stripe`

Stripe webhook handler. Stripe calls this URL when payment events occur.

**Authentication:** Stripe-Signature header is verified using `STRIPE_WEBHOOK_SECRET` environment variable (HMAC-SHA256). Requests with invalid signatures return `400`.

**Request body:** Stripe event JSON (passed through unchanged from Stripe).

**Handled event types:**

| Stripe Event | Action |
|-------------|--------|
| `checkout.session.completed` | Create/update `subscriptions` row; set status to `ACTIVE` or `TRIALING`. Update `users` table with `stripe_customer_id`. |
| `customer.subscription.updated` | Update `subscriptions.status`, `plan`, `billing_cycle`, `period_start`, `period_end`. |
| `customer.subscription.deleted` | Set `subscriptions.status = 'EXPIRED'`. Downgrade user features. |
| `invoice.payment_succeeded` | Create `invoices` row with status `PAID`. |
| `invoice.payment_failed` | Update `subscriptions.status = 'PAST_DUE'`. Trigger dunning email. |
| `invoice.finalized` | Create `invoices` row with status `OPEN`. |

**Response: `200 OK`**

```json
{ "received": true }
```

Any error during processing returns `500` (causing Stripe to retry up to 3 times over 72 hours).

**Errors:**

| HTTP | Condition |
|------|-----------|
| 400 | Invalid or missing `Stripe-Signature` header, or payload cannot be parsed |
| 500 | Internal error during event processing (Stripe will retry) |

---

### 14.2 `POST /webhooks/paymongo`

PayMongo webhook handler for Philippine-domiciled payment processing (GCash, Maya, etc.). Alternative to Stripe for Philippine users.

**Authentication:** `paymongo-signature` header verified using `PAYMONGO_WEBHOOK_SECRET` (HMAC-SHA256, base64-encoded).

**Handled event types:**

| PayMongo Event | Action |
|---------------|--------|
| `payment.paid` | Mark subscription active; create invoice row. |
| `payment.failed` | Set subscription to `PAST_DUE`. |
| `payment_intent.payment_failed` | Trigger dunning email. |

**Response: `200 OK`**

```json
{ "received": true }
```

---

## 15. Health Checks

### 15.1 `GET /health`

Basic liveness probe. Returns `200` if the process is running.

**Authentication required:** No.

**Response: `200 OK`**

```json
{
  "status": "ok",
  "timestamp": "2026-03-02T14:30:00.000Z",
  "version": "1.0.0"
}
```

**Errors:**
- If the process is not responding: no response (Kubernetes/load balancer marks instance as dead).

---

### 15.2 `GET /health/ready`

Readiness probe. Returns `200` only if all dependencies are reachable. Used by Kubernetes `readinessProbe`.

**Authentication required:** No.

**Response: `200 OK` (when all dependencies healthy):**

```json
{
  "status": "ready",
  "timestamp": "2026-03-02T14:30:00.000Z",
  "checks": {
    "database": "ok",
    "redis": "ok",
    "engine": "ok"
  }
}
```

**Response: `503 Service Unavailable` (when any dependency is unhealthy):**

```json
{
  "status": "not_ready",
  "timestamp": "2026-03-02T14:30:00.000Z",
  "checks": {
    "database": "error: connection refused",
    "redis": "ok",
    "engine": "ok"
  }
}
```

**Check details:**

| Check | How It's Verified |
|-------|------------------|
| `database` | `SELECT 1` query with 1-second timeout against PostgreSQL primary |
| `redis` | `PING` command with 500ms timeout against Upstash Redis |
| `engine` | Call `compute_tax()` with a minimal valid `TaxpayerInput` (hardcoded: `PURELY_SE`, AY2025, `gross_receipts = 500000`). Verify result completes with `recommended_regime = "PATH_C"` within 200ms. |
