# Auth Model — Philippine Freelance & Self-Employed Income Tax Optimizer

**Status:** COMPLETE
**Last updated:** 2026-03-02
**Cross-references:**
- API endpoints (login, register, OAuth, logout): [api/endpoints.md](endpoints.md)
- Rate limiting per tier: [api/rate-limiting.md](rate-limiting.md)
- Database schema (users, user_sessions, oauth_accounts, api_keys tables): [database/schema.md](../database/schema.md)
- Premium tiers (subscription gating): [premium/tiers.md](../premium/tiers.md)

---

## Table of Contents

1. [Authentication Methods Overview](#1-authentication-methods-overview)
2. [Session Cookie Authentication](#2-session-cookie-authentication)
   - 2.1 Session Token Generation
   - 2.2 Session Validation (Per-Request)
   - 2.3 Session Rotation
   - 2.4 Session Expiry
   - 2.5 Session Revocation
   - 2.6 CSRF Protection
3. [Google OAuth 2.0 Authentication](#3-google-oauth-20-authentication)
   - 3.1 OAuth Flow Overview
   - 3.2 Authorization Request
   - 3.3 Callback Processing
   - 3.4 Account Linking Logic
   - 3.5 Email Verification via OAuth
4. [API Key Authentication](#4-api-key-authentication)
   - 4.1 API Key Structure and Format
   - 4.2 API Key Validation Per-Request
   - 4.3 API Key Scopes
   - 4.4 API Key Rate Limiting
5. [Password Security](#5-password-security)
   - 5.1 Argon2id Hashing Parameters
   - 5.2 Password Validation Rules
   - 5.3 Password Reset Flow
6. [Role-Based Access Control](#6-role-based-access-control)
   - 6.1 Roles
   - 6.2 Role Assignment
   - 6.3 Permission Matrix
7. [Subscription-Based Feature Gating](#7-subscription-based-feature-gating)
8. [Email Verification](#8-email-verification)
   - 8.1 What Email Verification Gates
   - 8.2 Verification Token Mechanics
9. [Security Headers](#9-security-headers)
10. [Account Lifecycle](#10-account-lifecycle)
    - 10.1 Registration
    - 10.2 Login
    - 10.3 Account Suspension (Admin)
    - 10.4 Soft Deletion (User-Initiated)
    - 10.5 Hard Deletion (Scheduled)
11. [Token Storage Security Specifications](#11-token-storage-security-specifications)
12. [Environment Variables for Auth](#12-environment-variables-for-auth)

---

## 1. Authentication Methods Overview

Two authentication methods are supported. They are mutually exclusive per request — a request is authenticated by exactly one method or is anonymous.

| Method | Cookie | Header | Who Uses It | CSRF Required |
|--------|--------|--------|------------|---------------|
| Session cookie | `tax_session=<raw_token>` | — | Browser clients (frontend app) | Yes (for state-mutating requests) |
| API key | — | `Authorization: ApiKey <raw_key>` | Enterprise programmatic clients | No |

**Anonymous requests:** Requests with no valid authentication are treated as anonymous. Anonymous users may call `POST /compute` (rate-limited by IP) and read-only endpoints that do not require authentication. Anonymous users may NOT access any endpoint that requires `auth required: yes` in [endpoints.md](endpoints.md).

**Authentication resolution order (per request):**
1. Check for `Authorization: ApiKey <key>` header. If present, validate as API key. If valid: authenticated as the owning user with ENTERPRISE role context. If invalid: return `401 ERR_API_KEY_INVALID`.
2. Else, check for `tax_session` cookie. If present, validate as session token. If valid: authenticated as the session user. If expired or revoked: return `401 ERR_SESSION_EXPIRED`.
3. Else: anonymous request. If endpoint requires auth, return `401 ERR_UNAUTHENTICATED`.

If BOTH an API key header AND a session cookie are present in the same request, the API key takes precedence and the session cookie is ignored.

---

## 2. Session Cookie Authentication

### 2.1 Session Token Generation

On successful login (`POST /auth/login`) or successful OAuth callback (`GET /auth/oauth/google/callback`):

1. Generate 32 cryptographically random bytes using the platform's CSPRNG (`crypto.getRandomValues` in Node.js runtime, or `crypto.randomBytes(32)` in Node.js).
2. Base64url-encode the 32 bytes to produce the raw session token (43 characters, no padding). Example raw token: `aB3xZ9qT2mK7pR1nV5wY0cF8sL4uE6jH_Qn`.
3. Compute BLAKE2b-256 hash of the raw token (as UTF-8 bytes). Store the hex-encoded hash in `user_sessions.session_token_hash`.
4. Set the HTTP response cookie:
   ```
   Set-Cookie: tax_session=<raw_token>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000
   ```
   `Max-Age=2592000` = 30 days in seconds.
5. Generate a CSRF token: 32 cryptographically random bytes, base64url-encoded (separate from session token). Return in JSON response body as `csrf_token` field. The CSRF token is NOT stored server-side — it is derived from the session token via HMAC-SHA256(session_token, APPLICATION_SECRET_KEY), computed fresh on each request for comparison. See §2.6 for CSRF validation.

**Session row inserted into `user_sessions`:**

| Column | Value |
|--------|-------|
| `id` | `gen_random_uuid()` |
| `user_id` | Authenticated user's UUID |
| `session_token_hash` | BLAKE2b-256 hex hash of raw token |
| `created_at` | `NOW()` |
| `expires_at` | `NOW() + INTERVAL '30 days'` |
| `last_used_at` | `NOW()` |
| `ip_address` | `X-Forwarded-For` header value (first IP if comma-separated) or `REMOTE_ADDR` |
| `user_agent` | `User-Agent` request header, truncated to 512 characters |
| `revoked_at` | `NULL` |

### 2.2 Session Validation (Per-Request)

On every request that uses session cookie authentication:

```
function validateSession(cookieHeader: string | null, db: Database): SessionResult
  1. If cookieHeader is null or does not contain 'tax_session=', return { ok: false, error: 'ERR_UNAUTHENTICATED' }
  2. Extract raw_token = value of 'tax_session' cookie
  3. Compute token_hash = BLAKE2b-256(raw_token as UTF-8)
  4. Query:
       SELECT s.*, u.*
       FROM user_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.session_token_hash = $token_hash
         AND s.revoked_at IS NULL
         AND s.expires_at > NOW()
         AND u.deleted_at IS NULL
         AND u.is_active = TRUE
  5. If no row found:
       - If session exists but revoked_at IS NOT NULL → return { ok: false, error: 'ERR_UNAUTHENTICATED' }
       - If session exists but expires_at ≤ NOW() → return { ok: false, error: 'ERR_SESSION_EXPIRED' }
       - If user.is_active = FALSE → return { ok: false, error: 'ERR_ACCOUNT_DISABLED' }
       - Else → return { ok: false, error: 'ERR_UNAUTHENTICATED' }
  6. Update last_used_at and extend expiry:
       UPDATE user_sessions
       SET last_used_at = NOW(), expires_at = NOW() + INTERVAL '30 days'
       WHERE id = $session_id
       (Only update if last_used_at < NOW() - INTERVAL '1 hour', to avoid write amplification on every request)
  7. Return { ok: true, user: row.user, session: row.session }
```

**Why `SameSite=Lax` (not `Strict`):** Strict would break OAuth redirect flows and "open in new tab" navigation that arrives as a cross-site GET. Lax allows GET navigation while blocking cross-site form submissions (POST). Combined with CSRF tokens for all state-mutating requests, Lax provides sufficient protection.

### 2.3 Session Rotation

Sessions are NOT rotated on every request (this would break parallel tab usage). Sessions are rotated in one scenario only: **when the user changes their email address**. On email change:

1. Generate a new session token and session row (same procedure as §2.1).
2. Revoke all other sessions for this user (`UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = $uid AND id != $new_session_id`).
3. Return new `tax_session` cookie and new `csrf_token` in response.

This is necessary because the old session was authenticated against the old email, which may have belonged to a different person if the email was reused.

### 2.4 Session Expiry

Sessions have two expiry mechanisms:

| Mechanism | Duration | Behavior |
|-----------|----------|----------|
| Rolling inactivity | 30 days | `expires_at` is extended by 30 days on every request (if `last_used_at < NOW() - 1 hour`). A session kept active through regular use never expires. |
| Absolute maximum | 365 days | Session is hard-expired after 365 days from `created_at`, regardless of activity. Enforced by: `expires_at` is capped at `created_at + INTERVAL '365 days'` at creation. The 30-day rolling update does NOT extend past the absolute maximum. |

**Maximum session age enforcement at creation:**
```
expires_at = MIN(NOW() + INTERVAL '30 days', created_at + INTERVAL '365 days')
```
Since `created_at = NOW()` at creation, this simplifies to `expires_at = NOW() + INTERVAL '30 days'` at creation.

**Max-Age cookie and absolute expiry:** The `Max-Age=2592000` cookie attribute (30 days) is renewed on each authenticated request by reissuing the `Set-Cookie` header with updated `Max-Age`. This keeps the browser's cookie in sync with the server's `expires_at`.

**Cleanup job:** A daily cron job runs:
```sql
DELETE FROM user_sessions
WHERE expires_at < NOW() - INTERVAL '7 days'
   OR revoked_at < NOW() - INTERVAL '7 days';
```
Expired and revoked sessions are retained for 7 days post-expiry/revocation for security audit purposes, then hard-deleted.

### 2.5 Session Revocation

Sessions are revoked (set `revoked_at = NOW()`) in the following scenarios:

| Trigger | Sessions Revoked | Endpoint |
|---------|-----------------|---------|
| User logs out | Current session only | `POST /auth/logout` |
| User changes password | ALL sessions for user | `POST /users/me/change-password` |
| User resets password (forgot-password flow) | ALL sessions for user | `POST /auth/reset-password` |
| Admin suspends account | ALL sessions for user | `PATCH /admin/users/:id` (`is_active = false`) |
| Admin impersonates user (end impersonation) | Impersonation session only | `POST /admin/users/:id/impersonate/end` |
| User requests session list and revokes one | That specific session | `DELETE /users/me/sessions/:session_id` |
| User requests "log out everywhere" | ALL sessions except current | `POST /users/me/sessions/revoke-all` |

### 2.6 CSRF Protection

CSRF tokens protect all state-mutating requests made with session cookie authentication. API key requests do NOT require CSRF tokens (API keys cannot be set by attacker sites via cross-origin forms).

**CSRF token derivation:**

The CSRF token is NOT stored server-side. It is derived deterministically from the session token:

```
csrf_token = base64url(HMAC-SHA256(raw_session_token, APPLICATION_SECRET_KEY))
```

`APPLICATION_SECRET_KEY` is a 32-byte secret stored in the environment (see §12). This means the CSRF token is unique per session and changes when the session token changes.

**CSRF token lifecycle:**
- Issued: In the JSON body of `POST /auth/login` (field: `csrf_token`) and OAuth callback redirects (as a query parameter: `?csrf_token=<token>` on the redirect destination URL, consumed and stored by the SPA).
- Storage: Client must store in JavaScript memory or `sessionStorage`. Must NOT be stored in `localStorage` (accessible to XSS). Must NOT be stored in a cookie.
- Sent: As `X-CSRF-Token: <token>` header on every POST, PATCH, PUT, DELETE request.
- Validated: Server computes expected CSRF token from the session token in the cookie, compares with `X-CSRF-Token` header value using `crypto.timingSafeEqual`. Mismatch → `403 ERR_CSRF_MISMATCH`.

**Endpoints exempt from CSRF check (because they are GET or have no session auth):**
- All GET/HEAD endpoints
- `POST /auth/register` (no session yet)
- `POST /auth/login` (no session yet)
- `POST /auth/forgot-password` (no session yet)
- `POST /auth/reset-password` (no session yet; uses reset token instead)
- `POST /auth/verify-email` (no session yet; uses verification token instead)
- `GET /auth/oauth/google` (no session yet; redirects)
- `GET /auth/oauth/google/callback` (no session yet; uses state param for CSRF)
- All endpoints authenticated via API key (not session cookie)

---

## 3. Google OAuth 2.0 Authentication

### 3.1 OAuth Flow Overview

```
Browser                    API Server                  Google OAuth
   |                           |                            |
   |-- GET /auth/oauth/google ->|                            |
   |                           |-- Generate state param      |
   |                           |   Store state in Redis      |
   |<-- 302 → Google auth URL--|   (30-min TTL, keyed by state UUID)
   |                           |                            |
   |-- Follow redirect ------->|<-- Authorization request -->|
   |                           |                            |
   |<-- Google consent page ---|                            |
   |                           |                            |
   |-- User grants consent ---->|                           |
   |                           |<-- code + state param ------|
   |<-- GET /auth/oauth/google/callback?code=...&state=...
   |                           |                            |
   |                           |-- Validate state param     |
   |                           |-- POST /token to Google -->|
   |                           |<-- id_token + access_token |
   |                           |-- Validate id_token        |
   |                           |-- Account link/create      |
   |                           |-- Create session           |
   |<-- 302 → redirect_after --|   (Set-Cookie: tax_session) |
```

### 3.2 Authorization Request

`GET /auth/oauth/google` constructs and redirects to a Google OAuth authorization URL with the following parameters:

| Parameter | Value |
|-----------|-------|
| `client_id` | `GOOGLE_CLIENT_ID` environment variable |
| `redirect_uri` | `https://api.taxklaro.ph/v1/auth/oauth/google/callback` (must be registered in Google Cloud Console) |
| `response_type` | `code` |
| `scope` | `openid email profile` |
| `state` | A UUID generated for this OAuth session (stored in Redis with 30-minute TTL). Also encodes `redirect_after` URL base64url-encoded: `<uuid>:<base64url(redirect_after)>` |
| `access_type` | `offline` (to obtain refresh token, for potential future use) |
| `prompt` | `select_account` (forces Google account picker even if user is already signed in) |

**Redirect validation:** The `redirect_after` URL parameter (provided by the browser's initial GET) must match `^https://taxklaro\.ph(/.*)?$` (regex). Any value that does not match is rejected with `400 ERR_VALIDATION_FAILED` and the flow is aborted before redirecting to Google. This prevents open redirect vulnerabilities.

### 3.3 Callback Processing

`GET /auth/oauth/google/callback` processes the callback from Google:

**Step 1: Validate state parameter**
```
1. Extract state from query string.
2. Look up state in Redis: GET oauth_state:{state}
3. If not found or TTL expired: redirect to /login?error=csrf (ERR_OAUTH_STATE_MISMATCH)
4. Delete the state key from Redis (one-time use).
5. Extract redirect_after from state value.
```

**Step 2: Exchange authorization code for tokens**
```
POST https://oauth2.googleapis.com/token
Content-Type: application/x-www-form-urlencoded

code=<code>
&client_id=<GOOGLE_CLIENT_ID>
&client_secret=<GOOGLE_CLIENT_SECRET>
&redirect_uri=https://api.taxklaro.ph/v1/auth/oauth/google/callback
&grant_type=authorization_code
```

Response fields used:
- `id_token`: JWT containing user identity claims
- `access_token`: Used only during this flow (not stored by default)
- `refresh_token`: Stored encrypted in `oauth_accounts.refresh_token_encrypted` (AES-256-GCM)

If Google returns an error response (non-200 or `error` field in body): redirect to `/login?error=oauth_failed`.

**Step 3: Validate Google ID token**
```
1. Decode id_token (JWT) and verify:
   a. Signature using Google's public keys from https://www.googleapis.com/oauth2/v3/certs
      (cached with ETag for up to 1 hour)
   b. aud claim = GOOGLE_CLIENT_ID
   c. iss claim ∈ { 'accounts.google.com', 'https://accounts.google.com' }
   d. exp claim > NOW() (not expired)
2. Extract claims:
   - sub: Google's unique user identifier (string, up to 255 chars)
   - email: User's Google email address
   - email_verified: boolean (must be true; reject if false)
   - given_name: First name
   - family_name: Last name
   - name: Full display name (fallback if given_name/family_name absent)
```

If any validation step fails: redirect to `/login?error=oauth_failed`.

**Step 4: Account link or create (see §3.4)**

**Step 5: Create session and redirect**
```
1. Create session via §2.1 procedure (same as login).
2. Set Set-Cookie: tax_session=<token>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000
3. Compute csrf_token = base64url(HMAC-SHA256(raw_token, APPLICATION_SECRET_KEY))
4. Redirect 302 to: {redirect_after}?csrf_token={csrf_token}
   The SPA at redirect_after extracts csrf_token from URL, stores in sessionStorage, removes from URL.
```

### 3.4 Account Linking Logic

After validating the Google ID token (claims: `sub`, `email`, `email_verified`, `given_name`, `family_name`):

```
function linkOrCreateOAuthAccount(sub, email, given_name, family_name):

  Case 1: Existing OAuth link found
    Query: SELECT user_id FROM oauth_accounts WHERE provider = 'google' AND provider_user_id = sub
    → Row found:
      Load user by user_id.
      If user.deleted_at IS NOT NULL: redirect to /login?error=account_deleted
      If user.is_active = FALSE: redirect to /login?error=account_disabled
      Update oauth_accounts SET access_token_encrypted = <new>, token_expires_at = <new>
      → Proceed to session creation with this user.

  Case 2: No OAuth link, but email matches existing user
    Query: SELECT id FROM users WHERE email = lower(email) AND deleted_at IS NULL
    → Row found:
      Existing password-based account with same email.
      If existing user has password_hash IS NOT NULL:
        → redirect to /login?error=email_taken
        (User must log in with password and then link Google from profile settings)
      If existing user has password_hash IS NULL (was already an OAuth-only account via different future provider):
        → Proceed with creating google OAuth link and returning that user.

  Case 3: No OAuth link, no matching email — new user
    INSERT INTO users:
      id = gen_random_uuid()
      email = lower(email)
      email_verified = TRUE  ← Google has verified the email
      password_hash = NULL   ← OAuth-only account; no password until user sets one
      role = 'TAXPAYER'
      first_name = given_name (max 50 chars, truncated if longer)
      last_name = family_name (max 50 chars, truncated if longer)
      created_at = NOW()
    INSERT INTO oauth_accounts:
      user_id = new_user.id
      provider = 'google'
      provider_user_id = sub
      access_token_encrypted = AES-256-GCM(access_token, APPLICATION_SECRET_KEY)
      refresh_token_encrypted = AES-256-GCM(refresh_token, APPLICATION_SECRET_KEY) (if present)
      token_expires_at = NOW() + INTERVAL '1 hour' (standard Google access token lifetime)
    → Proceed to session creation with new user.
```

### 3.5 Email Verification via OAuth

When a user registers via Google OAuth:
- `users.email_verified` is set to `TRUE` immediately (Google has already verified the email).
- No verification email is sent.
- The user can immediately access all features that require email verification.

---

## 4. API Key Authentication

### 4.1 API Key Structure and Format

API keys are issued only to Enterprise subscribers. Each key:
- Is generated as 32 cryptographically random bytes, base64url-encoded (43 characters).
- Has a fixed prefix `tok_` prepended for identification. Full key: `tok_<43 base64url chars>` (47 chars total).
- Is stored in `api_keys.key_hash` as the BLAKE2b-256 hash of the full `tok_<key>` string.
- The first 8 characters of the raw key (after `tok_`) are stored in `api_keys.key_prefix` for display purposes (e.g., showing `tok_aB3xZ9...` in the UI with the rest masked as `••••••••`).
- The raw key is shown to the user EXACTLY ONCE at creation (`POST /api-keys`) and never again. If lost, the user must revoke and recreate.

**Example key:**
```
tok_aB3xZ9qT2mK7pR1nV5wY0cF8sL4uE6jH_Qn2pL8
```
(47 characters total including the `tok_` prefix)

### 4.2 API Key Validation Per-Request

On every request with `Authorization: ApiKey <key>` header:

```
function validateApiKey(authHeader: string, db: Database): ApiKeyResult
  1. Extract raw_key = authHeader.substring('ApiKey '.length)
  2. Verify raw_key starts with 'tok_'. If not: return { ok: false, error: 'ERR_API_KEY_INVALID' }
  3. Compute key_hash = BLAKE2b-256(raw_key as UTF-8)
  4. Query:
       SELECT k.*, u.*
       FROM api_keys k
       JOIN users u ON u.id = k.user_id
       WHERE k.key_hash = $key_hash
         AND k.revoked_at IS NULL
         AND (k.expires_at IS NULL OR k.expires_at > NOW())
         AND u.deleted_at IS NULL
         AND u.is_active = TRUE
  5. If no row found: return { ok: false, error: 'ERR_API_KEY_INVALID' }
  6. Check scope:
       If requested endpoint's required_scope is not contained in k.scopes array:
         return { ok: false, error: 'ERR_API_KEY_INSUFFICIENT_SCOPE' }
  7. Update last_used_at:
       UPDATE api_keys SET last_used_at = NOW() WHERE id = $key_id
  8. Return { ok: true, user: row.user, api_key: row.api_key }
```

### 4.3 API Key Scopes

Each API key is created with one or more scopes. Scopes are stored as a PostgreSQL `TEXT[]` array in `api_keys.scopes`.

| Scope | Description | Endpoints Covered |
|-------|-------------|-------------------|
| `compute:read` | Submit computations and read computation results | `POST /compute`, `GET /computations`, `GET /computations/:id` |
| `compute:write` | Save and modify computations (label, notes) | `PATCH /computations/:id`, `DELETE /computations/:id` |
| `pdf:export` | Export computations as PDFs | `POST /computations/:id/exports` |
| `clients:read` | Read CPA client list and their computations | `GET /clients`, `GET /clients/:id`, `GET /clients/:id/computations` |
| `clients:write` | Create, update, delete CPA clients | `POST /clients`, `PATCH /clients/:id`, `DELETE /clients/:id` |
| `batch:submit` | Submit batch computation jobs | `POST /batch/jobs` |
| `batch:read` | Read batch job status and results | `GET /batch/jobs/:id` |
| `webhooks:manage` | Create and delete webhook subscriptions | `POST /webhooks`, `DELETE /webhooks/:id` |

**Default scopes at creation:** `compute:read`, `compute:write`. Additional scopes must be explicitly requested at creation time.

**Scope validation:** If a request to an endpoint requires scope `pdf:export` and the API key has scopes `['compute:read', 'compute:write']`, the server returns `403 ERR_API_KEY_INSUFFICIENT_SCOPE`. The error response body identifies the missing scope:
```json
{
  "error": {
    "code": "ERR_API_KEY_INSUFFICIENT_SCOPE",
    "message": "This API key does not have the 'pdf:export' scope. Create a new key with the required scope.",
    "details": null
  }
}
```

### 4.4 API Key Rate Limiting

API keys have separate rate limit buckets from session-based requests, as defined in [api/rate-limiting.md](rate-limiting.md). Rate limit state is stored in Redis keyed by `rate:{key_id}:{endpoint_group}`.

| Tier | `/compute` per hour | `/compute` per day | All other per minute |
|------|---------------------|--------------------|-----------------------|
| Enterprise (API key) | 1,000 | 10,000 | 600 |

Rate limit headers are returned on all requests:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 997
X-RateLimit-Reset: 1741917000
```

---

## 5. Password Security

### 5.1 Argon2id Hashing Parameters

All passwords are hashed using **Argon2id** (RFC 9106 recommended variant) with the following parameters:

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| `m` (memory) | 65536 KiB (64 MiB) | Exceeds OWASP 2023 minimum of 19456 KiB. Adequate for server-side hashing. |
| `t` (iterations) | 3 | Three passes over memory. OWASP recommends ≥1 iteration with 64 MiB memory. |
| `p` (parallelism) | 4 | Four parallel lanes. Match to available CPU threads on production server. |
| `salt` | 16 bytes, cryptographically random, unique per hash | Generated fresh for each password hash. |
| `hash length` | 32 bytes | Standard output length. |
| Output format | PHC string format: `$argon2id$v=19$m=65536,t=3,p=4$<salt_b64>$<hash_b64>` | Self-describing format; parameters embedded in stored hash. |

**Timing:** Password hashing takes approximately 100–300 ms on the production server. This is intentional for security. The API will not apply timeouts shorter than 5 seconds to password-processing endpoints.

**Verification timing safety:** Use `argon2.verify(stored_hash, candidate_password)` which performs timing-safe comparison. Do NOT extract and compare hash components manually.

**Database storage:** `users.password_hash TEXT NULL`. Max length: 128 characters (PHC format output is ≤80 chars with above parameters). `NULL` for Google OAuth users who have not set a password.

### 5.2 Password Validation Rules

Applied at both registration and password change/reset. Validation is done server-side; client-side validation is informational only (see [frontend/validation-rules.md](../frontend/validation-rules.md)).

| Rule | Constraint | Error Code | Error Message |
|------|-----------|------------|---------------|
| Minimum length | ≥ 8 characters | `ERR_PASSWORD_TOO_SHORT` | "Password must be at least 8 characters long." |
| Maximum length | ≤ 128 characters | `ERR_PASSWORD_TOO_LONG` | "Password must not exceed 128 characters." |
| Uppercase letter | At least 1 ASCII uppercase letter (A–Z) | `ERR_PASSWORD_MISSING_UPPERCASE` | "Password must contain at least one uppercase letter." |
| Lowercase letter | At least 1 ASCII lowercase letter (a–z) | `ERR_PASSWORD_MISSING_LOWERCASE` | "Password must contain at least one lowercase letter." |
| Digit | At least 1 ASCII digit (0–9) | `ERR_PASSWORD_MISSING_DIGIT` | "Password must contain at least one number." |
| Breached password check | Not in HIBP (Have I Been Pwned) top 10,000 most commonly breached passwords list (embedded as a static hash set in the server) | `ERR_PASSWORD_BREACHED` | "This password appears in data breaches and is not allowed. Please choose a different password." |

**Note on HIBP check implementation:** The server embeds a static SHA-1 prefix list of the top 10,000 breached passwords from HIBP. This list is embedded at build time (not a live API call per request), updated quarterly. The check hashes the candidate password with SHA-1 and looks up the first 5 hex characters in the embedded set.

**What is NOT required:** Numbers or symbols at specific positions, periodic password rotation, knowledge-based security questions.

### 5.3 Password Reset Flow

**Full flow specification:**

```
Step 1: POST /auth/forgot-password { email: "user@example.com" }
  Server side:
    a. Look up users WHERE email = lower(input_email) AND deleted_at IS NULL
    b. If NOT found: return 200 OK with generic message (no side effects). Prevents email enumeration.
    c. If found:
       - Check rate limit: ≤ 3 reset requests per email per hour (Redis counter, key: reset_rate:{email})
         If exceeded: return 429 ERR_RATE_LIMIT_EXCEEDED
       - Generate raw_reset_token = base64url(32 random bytes)
       - token_hash = BLAKE2b-256(raw_reset_token)
       - DELETE FROM password_reset_tokens WHERE user_id = $user_id AND used_at IS NULL
         (Invalidate any existing unused token for this user)
       - INSERT INTO password_reset_tokens:
           user_id, token_hash, expires_at = NOW() + INTERVAL '1 hour'
       - Send transactional email to user.email:
           Subject: "Reset Your TaxKlaro Password"
           Body: Contains link https://taxklaro.ph/reset-password?token={raw_reset_token}
           Link expires in 1 hour.
    d. Return 200 OK: { "message": "If an account exists for this email, a password reset link has been sent." }

Step 2: User clicks link → frontend navigates to /reset-password?token=<raw_token>
  Frontend extracts token from URL query string, displays new-password form.

Step 3: POST /auth/reset-password { token: "<raw_token>", new_password: "<new>" }
  Server side:
    a. Validate new_password per §5.2 rules. If invalid: 400 ERR_VALIDATION_FAILED with details.
    b. Compute token_hash = BLAKE2b-256(input_token)
    c. Query: SELECT * FROM password_reset_tokens
              WHERE token_hash = $hash AND used_at IS NULL AND expires_at > NOW()
       If not found: return 400 ERR_INVALID_RESET_TOKEN
       { "error": { "code": "ERR_INVALID_RESET_TOKEN",
         "message": "This password reset link is invalid or has expired. Please request a new one." }}
    d. Hash new password with Argon2id (§5.1 parameters)
    e. BEGIN TRANSACTION:
       UPDATE users SET password_hash = $new_hash WHERE id = $user_id
       UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $token_id
       UPDATE user_sessions SET revoked_at = NOW()
         WHERE user_id = $user_id AND revoked_at IS NULL
    f. COMMIT TRANSACTION
    g. Return 200 OK: { "message": "Password successfully updated. Please log in with your new password." }
    (Note: no session cookie is set here; user must log in fresh with POST /auth/login)
```

---

## 6. Role-Based Access Control

### 6.1 Roles

Three roles exist, assigned at the `users.role` column (type: `user_role_enum`).

| Role | Who | Default | Can Escalate To |
|------|-----|---------|----------------|
| `TAXPAYER` | Individual freelancer or professional. | Yes (all new registrations start here). | `CPA` (admin-granted or via CPA upgrade flow). |
| `CPA` | Accountant or bookkeeper managing multiple clients. Unlocks `/clients/*` endpoints. | No. | Cannot self-escalate to `ADMIN`. |
| `ADMIN` | Internal operations staff. Full read access to all data, can impersonate users. | No. | N/A (highest role). |

**Role assignment rules:**
- `TAXPAYER`: Set automatically at `POST /auth/register` and Google OAuth registration. Cannot be self-changed.
- `CPA`: Set by admin via `PATCH /admin/users/:id { "role": "CPA" }` OR automatically when user subscribes to the Enterprise plan with CPA intent (controlled by the `cpa_upgrade` query param at checkout).
- `ADMIN`: Set only by direct database update by a pre-existing admin. No API endpoint for this (prevents privilege escalation attacks).

### 6.2 Role Assignment

**Self-service CPA upgrade:**

A `TAXPAYER` subscriber with an active Enterprise plan may self-request CPA role via `POST /users/me/request-cpa-role`. This creates an internal review ticket and is approved by admin within 1 business day. During review, the user's role remains `TAXPAYER` but they have access to CPA features as an Enterprise subscriber (subscription-gated separately from role).

**Why this distinction matters:** CPA role grants access to `/clients/*` at the data model level (seeing OTHER users' computations). This requires verification that the person is actually a professional. Subscription alone does not grant this access.

### 6.3 Permission Matrix

For each endpoint, the required authentication and minimum role/subscription are defined. "Auth" column: `N` = No auth required; `S` = Session or API key; `A` = ADMIN only.

| Endpoint | Auth | Min Role | Min Subscription | Notes |
|----------|------|----------|-----------------|-------|
| `POST /auth/register` | N | — | — | |
| `POST /auth/login` | N | — | — | |
| `POST /auth/logout` | S | TAXPAYER | FREE | |
| `POST /auth/forgot-password` | N | — | — | |
| `POST /auth/reset-password` | N | — | — | |
| `POST /auth/verify-email` | N | — | — | |
| `POST /auth/resend-verification` | S | TAXPAYER | FREE | |
| `GET /auth/oauth/google` | N | — | — | |
| `GET /auth/oauth/google/callback` | N | — | — | |
| `GET /auth/me` | S | TAXPAYER | FREE | |
| `GET /users/me` | S | TAXPAYER | FREE | |
| `PATCH /users/me` | S | TAXPAYER | FREE | |
| `POST /users/me/change-password` | S | TAXPAYER | FREE | |
| `DELETE /users/me` | S | TAXPAYER | FREE | Soft-delete. |
| `GET /users/me/sessions` | S | TAXPAYER | FREE | |
| `DELETE /users/me/sessions/:id` | S | TAXPAYER | FREE | |
| `POST /users/me/sessions/revoke-all` | S | TAXPAYER | FREE | |
| `POST /compute` | N or S | — | FREE | Anonymous allowed; auth enables saving. |
| `GET /computations` | S | TAXPAYER | PRO | History requires PRO. |
| `GET /computations/:id` | S | TAXPAYER | PRO | |
| `PATCH /computations/:id` | S | TAXPAYER | PRO | |
| `DELETE /computations/:id` | S | TAXPAYER | PRO | |
| `POST /computations/:id/exports` | S | TAXPAYER | PRO | PDF export requires PRO. |
| `GET /clients` | S | CPA | ENTERPRISE | |
| `POST /clients` | S | CPA | ENTERPRISE | |
| `GET /clients/:id` | S | CPA | ENTERPRISE | |
| `PATCH /clients/:id` | S | CPA | ENTERPRISE | |
| `DELETE /clients/:id` | S | CPA | ENTERPRISE | |
| `GET /clients/:id/computations` | S | CPA | ENTERPRISE | |
| `POST /batch/jobs` | S | CPA | ENTERPRISE | |
| `GET /batch/jobs/:id` | S | CPA | ENTERPRISE | |
| `GET /api-keys` | S | TAXPAYER | ENTERPRISE | |
| `POST /api-keys` | S | TAXPAYER | ENTERPRISE | |
| `DELETE /api-keys/:id` | S | TAXPAYER | ENTERPRISE | |
| `GET /billing/subscription` | S | TAXPAYER | FREE | |
| `POST /billing/checkout` | S | TAXPAYER | FREE | |
| `POST /billing/portal` | S | TAXPAYER | PRO | |
| `GET /billing/invoices` | S | TAXPAYER | PRO | |
| `GET /webhooks` | S | TAXPAYER | ENTERPRISE | |
| `POST /webhooks` | S | TAXPAYER | ENTERPRISE | |
| `DELETE /webhooks/:id` | S | TAXPAYER | ENTERPRISE | |
| `GET /health/live` | N | — | — | |
| `GET /health/ready` | N | — | — | |
| `GET /admin/users` | A | ADMIN | — | |
| `PATCH /admin/users/:id` | A | ADMIN | — | |
| `POST /admin/users/:id/impersonate` | A | ADMIN | — | |

**Ownership check:** For all endpoints accessing user-specific resources (`/computations/:id`, `/clients/:id`, etc.), the server verifies that `resource.user_id = authenticated_user.id`. Admin users may access any resource regardless of ownership. CPAs may access computations belonging to their registered clients (`cpa_clients` table).

---

## 7. Subscription-Based Feature Gating

Subscription plan is checked after role verification. The active subscription is determined at request time by querying:

```sql
SELECT s.plan, s.status, s.period_end
FROM subscriptions s
WHERE s.user_id = $user_id
  AND s.status IN ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED')
ORDER BY s.created_at DESC
LIMIT 1;
```

**Active subscription logic:**

| DB Status | Plan | Feature Access | Notes |
|-----------|------|---------------|-------|
| `TRIALING` | PRO or ENTERPRISE | Full plan features | Trial in progress. |
| `ACTIVE` | PRO or ENTERPRISE | Full plan features | Paid subscription current. |
| `PAST_DUE` | PRO or ENTERPRISE | Full plan features (3-day grace) | Payment failed. Grace period: 3 days from `period_end`. After grace: treated as `EXPIRED`. |
| `CANCELLED` | PRO or ENTERPRISE | Full plan features until `period_end` | User cancelled. Access until period ends. |
| `EXPIRED` | — | FREE features only | No active subscription. |
| No row | — | FREE features only | Never subscribed. |

**Subscription plan cache:** To avoid a database query on every request, the resolved plan (`FREE`/`PRO`/`ENTERPRISE`) is cached in Redis for 5 minutes per user. Key: `plan:{user_id}`. Cache is invalidated immediately on subscription webhook receipt from PayMongo/Stripe.

**Returning the resolved plan:** Every authenticated response includes a `X-Subscription-Plan: FREE|PRO|ENTERPRISE` response header. The frontend uses this to update subscription state without a separate API call.

---

## 8. Email Verification

### 8.1 What Email Verification Gates

Email verification (`users.email_verified = TRUE`) is required for:

| Feature | Verification Required | Why |
|---------|----------------------|-----|
| Saving computations to history | Yes | Ensures user can be contacted and their account is genuine. |
| PDF export | Yes | Pro feature; requires verified account. |
| CWT management | Yes | Sensitive financial data; requires verified identity. |
| Subscribing to paid plans | Yes | PayMongo/Stripe require valid email for receipts. |
| CPA client management | Yes | Regulatory requirement; CPAs must have verified identity. |
| API key creation | Yes | API access to Enterprise features requires verified account. |
| Batch computation submission | Yes | Pro/Enterprise feature. |

Email verification is NOT required for:
- Anonymous computation (`POST /compute` without auth)
- Authenticated computation (saving is blocked but computation itself runs)
- Reading profile (`GET /users/me`)
- Viewing existing computations (if Pro-gated and email is verified; if email gets unverified (edge case: email change), history remains viewable but no new saves until re-verified)

**Frontend behavior for unverified users:** After login, if `email_verified = false`, the frontend displays a yellow banner: "Please verify your email address to save your results. [Resend verification email]". The banner is not dismissible.

### 8.2 Verification Token Mechanics

```
Token generation (at registration or on POST /auth/resend-verification):
  1. raw_token = base64url(32 random bytes)
  2. token_hash = BLAKE2b-256(raw_token)
  3. DELETE FROM email_verification_tokens WHERE user_id = $user_id
     (Invalidate previous unused tokens for this user)
  4. INSERT INTO email_verification_tokens:
       user_id, token_hash, expires_at = NOW() + INTERVAL '24 hours'
  5. Send email with link: https://taxklaro.ph/verify-email?token={raw_token}

Token validation (at POST /auth/verify-email { token }):
  1. Compute hash = BLAKE2b-256(input_token)
  2. SELECT * FROM email_verification_tokens
     WHERE token_hash = $hash AND expires_at > NOW()
  3. If not found: 400 ERR_INVALID_VERIFICATION_TOKEN
     { "error": { "code": "ERR_INVALID_VERIFICATION_TOKEN",
       "message": "This verification link is invalid or has expired. Please request a new one." }}
  4. BEGIN TRANSACTION:
       UPDATE users SET email_verified = TRUE WHERE id = $user_id
       DELETE FROM email_verification_tokens WHERE id = $token_id
     COMMIT
  5. Return 200 OK: { "message": "Email address verified successfully." }
```

**Token expiry:** 24 hours. After expiry, user must click "Resend verification email" to get a new token.

**Rate limit on resend:** Maximum 3 resend requests per user per hour. Redis counter: `verify_resend_rate:{user_id}`.

---

## 9. Security Headers

All API responses include the following HTTP security headers:

| Header | Value | Purpose |
|--------|-------|---------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Forces HTTPS for 1 year. |
| `X-Frame-Options` | `DENY` | Prevents clickjacking. |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME type sniffing. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer info to same origin. |
| `Content-Security-Policy` | `default-src 'none'; frame-ancestors 'none'` | API-only CSP (no HTML content served). |
| `Permissions-Policy` | `geolocation=(), camera=(), microphone=()` | Denies sensitive browser APIs. |
| `Cache-Control` | `no-store` (for auth endpoints) | Prevents caching of auth responses. |
| `X-RateLimit-Limit` | `<limit>` | Current endpoint rate limit. |
| `X-RateLimit-Remaining` | `<remaining>` | Requests remaining in current window. |
| `X-RateLimit-Reset` | `<unix_timestamp>` | When the rate limit window resets. |
| `X-Request-Id` | `<uuid>` | Unique ID for this request (for support tracing). |

**CORS configuration:**
```
Allowed origins: https://taxklaro.ph, https://www.taxklaro.ph, https://staging.taxklaro.ph
                 (localhost:3000, localhost:5173 in development mode only)
Allowed methods: GET, POST, PATCH, PUT, DELETE, OPTIONS
Allowed headers: Content-Type, X-CSRF-Token, Authorization, Idempotency-Key, Accept-Language
Expose headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-Request-Id, X-Subscription-Plan
Allow credentials: true (required for session cookie)
Max age: 86400 (24 hours — preflight cache duration)
```

CORS preflight (OPTIONS) responses return `204 No Content` with the above headers and no body.

**API key requests from non-browser origins:** API key requests are not subject to CORS (non-browser clients don't send CORS preflight). All origins are accepted for API key requests.

---

## 10. Account Lifecycle

### 10.1 Registration

**Email + password registration (`POST /auth/register`):**
1. Validate input (all fields per §5.2 and endpoint spec).
2. Hash email to lowercase; check for uniqueness.
3. Hash password with Argon2id (§5.1).
4. Insert `users` row.
5. Generate email verification token and send verification email.
6. Return `201 Created` with user object. No session cookie. User must login separately.

**Google OAuth registration (first-time callback):**
1. OAuth callback validates state, exchanges code, validates ID token.
2. Insert `users` row (email_verified = TRUE) + `oauth_accounts` row.
3. Create session immediately (no separate login step).
4. Return `302 Found` to `redirect_after` with session cookie set.

### 10.2 Login

**Email + password login (`POST /auth/login`):**
1. Look up user by email (case-insensitive). If not found: return `401 ERR_INVALID_CREDENTIALS`.
2. If `password_hash IS NULL` (OAuth-only account): return `401 ERR_INVALID_CREDENTIALS`. (Do not reveal that the account uses OAuth.)
3. Verify password with `argon2.verify(password_hash, input_password)`. If invalid: return `401 ERR_INVALID_CREDENTIALS`.
4. If `is_active = FALSE`: return `403 ERR_ACCOUNT_DISABLED`.
5. Create session (§2.1).
6. Update `users.last_login_at = NOW()`.
7. Return `200 OK` with user object + CSRF token + cookie.

**Timing attack prevention:** Steps 1-3 are designed so that a non-existent user and an existing user with wrong password both take approximately the same time. Specifically: if the user is not found, the server still runs `argon2.verify` against a pre-computed dummy hash (to normalize timing). The dummy hash is `ARGON2ID_DUMMY_HASH` environment variable (pre-computed at startup).

### 10.3 Account Suspension (Admin)

Admin action: `PATCH /admin/users/:id { "is_active": false }`

1. Sets `users.is_active = FALSE`.
2. Revokes ALL active sessions for the user (UPDATE user_sessions SET revoked_at = NOW()).
3. Existing API keys remain in database but `user.is_active = FALSE` check in validation blocks them.
4. Subscriptions are NOT automatically cancelled (admin may re-activate the account).

Suspended user receives `403 ERR_ACCOUNT_DISABLED` on any authenticated request.

### 10.4 Soft Deletion (User-Initiated)

User action: `DELETE /users/me`

1. Sets `users.deleted_at = NOW()`.
2. Revokes ALL active sessions.
3. Cancels any active subscription via PayMongo/Stripe API (immediate cancellation at period end).
4. Anonymizes PII: sets `users.email` to `deleted-{uuid}@deleted.invalid`, clears `tin`, `rdo_code`, `psic_code`, `contact_number`, `birthday`, `registered_address`, `business_name`.
5. Returns `204 No Content`.

Soft-deleted users cannot log in. Their computation records are retained for 90 days (for tax compliance audit) then purged. See [database/retention.md](../database/retention.md).

### 10.5 Hard Deletion (Scheduled)

A daily cron job (see [deployment/ci-cd.md](../deployment/ci-cd.md)) runs:
```sql
-- Hard-delete records for users deleted more than 90 days ago
DELETE FROM computations WHERE user_id IN (
  SELECT id FROM users WHERE deleted_at < NOW() - INTERVAL '90 days'
);
DELETE FROM users WHERE deleted_at < NOW() - INTERVAL '90 days';
```
`ON DELETE CASCADE` handles all dependent tables (`user_sessions`, `oauth_accounts`, `computations`, `computation_cwt_entries`, `computation_quarterly_payments`, `subscriptions`, `invoices`, `cpa_clients`, `api_keys`, `audit_logs`, `pdf_exports`).

---

## 11. Token Storage Security Specifications

| Token Type | Length | Generation | Storage (server) | Storage (client) | Expiry |
|------------|--------|------------|-----------------|-----------------|--------|
| Session token | 32 bytes (43 chars base64url) | `crypto.randomBytes(32)` | BLAKE2b-256 hash in `user_sessions.session_token_hash` | HTTP-only Secure SameSite=Lax cookie `tax_session` | 30-day rolling, 365-day absolute |
| CSRF token | Derived from session | HMAC-SHA256(session_token, SECRET_KEY) → base64url | Not stored (derived on-demand) | JavaScript memory or `sessionStorage` (NOT cookies, NOT localStorage) | Same lifetime as session |
| Password reset token | 32 bytes (43 chars base64url) | `crypto.randomBytes(32)` | BLAKE2b-256 hash in `password_reset_tokens.token_hash` | Email link only (one-time) | 1 hour |
| Email verification token | 32 bytes (43 chars base64url) | `crypto.randomBytes(32)` | BLAKE2b-256 hash in `email_verification_tokens.token_hash` | Email link only (one-time) | 24 hours |
| API key | `tok_` + 32 bytes (47 chars total) | `'tok_' + base64url(randomBytes(32))` | BLAKE2b-256 hash in `api_keys.key_hash` | Shown once at creation. User stores securely. | Never (unless revoked or `expires_at` set) |
| OAuth state param | UUID | `crypto.randomUUID()` + base64url(redirect_after) | Redis: `oauth_state:{uuid}` with 30-min TTL | URL query parameter (single-use) | 30 minutes |

**Why BLAKE2b-256 (not bcrypt/scrypt) for tokens:** Session, reset, and API key tokens are already cryptographically random 32-byte values — they have effectively infinite entropy. Bcrypt is for low-entropy secrets (passwords). BLAKE2b-256 is appropriate here: fast, non-malleable, no timing issues, and the random token provides the entropy that bcrypt would compensate for. Argon2id is reserved for passwords.

---

## 12. Environment Variables for Auth

All auth-related environment variables. Values shown are examples or format descriptions; real values are in the secret management system (see [deployment/environment.md](../deployment/environment.md)).

| Variable | Required | Format | Description |
|----------|----------|--------|-------------|
| `APPLICATION_SECRET_KEY` | Yes | 32 bytes, hex-encoded (64 hex chars) | Master secret for CSRF token derivation (HMAC-SHA256 key) and OAuth token encryption (AES-256-GCM key). Rotated by: (1) generate new key, (2) update env, (3) deploy, (4) all existing sessions will produce new CSRF tokens; old sessions expire within 30 days. |
| `GOOGLE_CLIENT_ID` | Yes | String (e.g., `123456789-abc.apps.googleusercontent.com`) | Google OAuth 2.0 client ID from Google Cloud Console → APIs & Services → Credentials. |
| `GOOGLE_CLIENT_SECRET` | Yes | String (40 chars, e.g., `GOCSPX-AbCdEfGhIjKlMnOpQrStUv12345`) | Google OAuth 2.0 client secret. Keep secret; never expose to client. |
| `GOOGLE_REDIRECT_URI` | Yes | URL string | Must match exactly: `https://api.taxklaro.ph/v1/auth/oauth/google/callback`. Also registered in Google Cloud Console. |
| `ARGON2ID_DUMMY_HASH` | Yes | PHC string | Pre-computed Argon2id hash of a dummy password (e.g., "dummypassword123"). Used for timing normalization when user not found. Generate at startup if not set. |
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:password@host:5432/taxklaro?sslmode=require` |
| `REDIS_URL` | Yes | Redis connection string | `rediss://user:password@host:6379` (TLS enforced in production). |
| `SESSION_COOKIE_DOMAIN` | Yes | Domain string | `taxklaro.ph`. Cookie is set for this domain (covers api.taxklaro.ph and taxklaro.ph). |
| `CORS_ALLOWED_ORIGINS` | Yes | Comma-separated URLs | `https://taxklaro.ph,https://www.taxklaro.ph,https://staging.taxklaro.ph` |
| `EMAIL_FROM_ADDRESS` | Yes | Email address | `noreply@taxklaro.ph`. Used in From header for all transactional emails. |
| `EMAIL_FROM_NAME` | Yes | String | `TaxKlaro.ph`. Display name for transactional emails. |
| `RESEND_API_KEY` | Yes | String (Resend.com API key format: `re_...`) | API key for Resend.com transactional email provider. |
| `NODE_ENV` | Yes | `production`, `staging`, or `development` | Controls CORS localhost allowlist, cookie Secure flag, and log verbosity. |
