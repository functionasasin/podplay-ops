# API Rate Limiting — Philippine Freelance & Self-Employed Income Tax Optimizer

**Status:** COMPLETE
**Last updated:** 2026-03-02
**Cross-references:**
- Tier definitions and feature limits: [premium/tiers.md](../premium/tiers.md)
- Endpoint listing and overview rate limit table: [api/endpoints.md §4](endpoints.md)
- Auth model (session/API key structure): [api/auth.md](auth.md)
- Deployment infrastructure (Upstash Redis): [deployment/infrastructure.md](../deployment/infrastructure.md)
- Environment variables: [deployment/environment.md](../deployment/environment.md)
- Monitoring alerts: [deployment/monitoring.md](../deployment/monitoring.md)

---

## Table of Contents

1. [Overview and Algorithm Choice](#1-overview-and-algorithm-choice)
2. [Tier Rate Limit Reference Table](#2-tier-rate-limit-reference-table)
3. [Endpoint Groups](#3-endpoint-groups)
4. [Sliding Window Log Algorithm](#4-sliding-window-log-algorithm)
5. [Multi-Window Check for COMPUTE Group](#5-multi-window-check-for-compute-group)
6. [Burst Allowances (COMPUTE group sub-window)](#6-burst-allowances-compute-group-sub-window)
7. [Per-Endpoint Overrides](#7-per-endpoint-overrides)
8. [Rate Limit Response Headers](#8-rate-limit-response-headers)
9. [429 Response Body](#9-429-response-body)
10. [Identifier Resolution](#10-identifier-resolution)
11. [Tier Resolution for Rate Limiting](#11-tier-resolution-for-rate-limiting)
12. [Redis Key Naming Convention](#12-redis-key-naming-convention)
13. [Implementation: Upstash @upstash/ratelimit](#13-implementation-upstash-upstashratelimit)
14. [Middleware Integration Order](#14-middleware-integration-order)
15. [Admin Bypass](#15-admin-bypass)
16. [Multi-Datacenter and Edge Considerations](#16-multi-datacenter-and-edge-considerations)
17. [Redis Failure Behavior](#17-redis-failure-behavior)
18. [Rate Limit Monitoring and Alerts](#18-rate-limit-monitoring-and-alerts)
19. [Canonical Rate Limit Reference Table](#19-canonical-rate-limit-reference-table)

---

## 1. Overview and Algorithm Choice

### 1.1 Algorithm

**Sliding window log** using Redis sorted sets. Each request event is stored as a member in a sorted set keyed by the rate limit window. The score is the request timestamp in milliseconds. On each request, events older than the window are removed, the count is checked, and the new event is added if within limit.

This algorithm provides exact rate limiting with no boundary artifacts (unlike fixed-window counters, which can allow 2× the limit at window boundaries). It uses the `@upstash/ratelimit` npm package's `Ratelimit.slidingWindow()` method, which implements this algorithm.

### 1.2 Infrastructure

| Component | Technology |
|-----------|-----------|
| Rate limit store | Upstash Redis (Serverless Redis, REST API) |
| Client library | `@upstash/ratelimit` v2.0.0+ |
| Redis library | `@upstash/redis` v1.34.0+ |
| Primary Redis region | `us-east-1` (AWS US East, North Virginia) |
| Read replicas | Global (Upstash edge POPs for read latency reduction) |

### 1.3 Canonical Value Note

This file is the **authoritative source** for all rate limit values. `premium/tiers.md §5` contains the Anonymous tier values `10/hour, 30/day, 20/min` which were set before this spec was written. The canonical values are those in this file: **15/hour, 50/day, 30/min for Anonymous**. All other tier values match across both files. `api/endpoints.md §4` also reflects the canonical values from this file.

---

## 2. Tier Rate Limit Reference Table

Five tiers exist for rate limiting purposes. All limits are enforced independently: a request is blocked if ANY applicable window limit is exceeded.

| Tier | Identifier basis | `POST /compute` per hour | `POST /compute` per day | All other endpoints per minute | Notes |
|------|-----------------|--------------------------|------------------------|--------------------------------|-------|
| `ANONYMOUS` | IP address | 15 | 50 | 30 | No auth cookie or API key present |
| `FREE` | user_id | 30 | 100 | 60 | Registered account, plan = `'FREE'` or expired subscription |
| `PRO` | user_id | 200 | 1,000 | 120 | Active plan = `'PRO'` |
| `ENTERPRISE_SESSION` | user_id | 500 | 5,000 | 300 | Active plan = `'ENTERPRISE'`, browser session auth |
| `ENTERPRISE_KEY` | api_key_id | 1,000 | 10,000 | 600 | Active plan = `'ENTERPRISE'`, API key auth |
| `ADMIN` | user_id | Unlimited | Unlimited | Unlimited | role = `'ADMIN'`; all checks bypassed |

**"Unlimited"** for ADMIN means the rate limit middleware returns immediately without making any Redis calls.

---

## 3. Endpoint Groups

Every request is classified into exactly one endpoint group. The group determines which rate limit windows and keys apply.

| Group name | Routes included | Windows applied | Notes |
|------------|-----------------|-----------------|-------|
| `COMPUTE` | `POST /compute`, `POST /computations/:id/rerun` | burst-10s + hourly + daily | Three windows checked in sequence; all must pass |
| `AUTH_SENSITIVE` | `POST /auth/register`, `POST /auth/login`, `POST /auth/password-reset`, `POST /auth/resend-verification` | per-minute + per-hour | Always IP-based regardless of auth status; overrides GENERAL |
| `BATCH_SUBMIT` | `POST /batch/computations` | per-hour + concurrency counter | Hourly sliding window + atomic concurrency counter |
| `PDF_EXPORT` | `POST /computations/:id/exports` | per-minute (GENERAL) + per-day (PDF-specific) | Both windows checked; per-day is additional PDF-specific gate |
| `WEBHOOK_REGISTER` | `POST /webhooks` | per-hour | ENTERPRISE only; resource count check is separate (DB-level) |
| `HEALTH` | `GET /health`, `GET /health/db`, `GET /health/ready` | None | Health checks never rate limited |
| `GENERAL` | All routes not in another group | per-minute | Single window per tier |

**Group classification pseudocode:**

```
function classify_endpoint_group(method: string, path: string) -> EndpointGroup:
  if method == "POST" and path matches "^/v1/compute$":
    return COMPUTE
  if method == "POST" and path matches "^/v1/computations/[^/]+/rerun$":
    return COMPUTE
  if method == "POST" and path == "/v1/auth/register":
    return AUTH_SENSITIVE
  if method == "POST" and path == "/v1/auth/login":
    return AUTH_SENSITIVE
  if method == "POST" and path == "/v1/auth/password-reset":
    return AUTH_SENSITIVE
  if method == "POST" and path == "/v1/auth/resend-verification":
    return AUTH_SENSITIVE
  if method == "POST" and path == "/v1/batch/computations":
    return BATCH_SUBMIT
  if method == "POST" and path matches "^/v1/computations/[^/]+/exports$":
    return PDF_EXPORT
  if method == "POST" and path == "/v1/webhooks":
    return WEBHOOK_REGISTER
  if path matches "^/v1/health":
    return HEALTH
  return GENERAL
```

---

## 4. Sliding Window Log Algorithm

### 4.1 Core Algorithm Pseudocode

```
struct RateLimitResult:
  allowed:    boolean
  limit:      integer       # The configured limit for this window
  remaining:  integer       # Requests remaining after this one (0 if blocked)
  reset_at:   integer       # Unix timestamp (seconds) when oldest event expires
  retry_after: integer|null # Seconds until retry allowed (null if allowed)
  window:     string        # "10s", "1m", "1h", "1d"

function sliding_window_check(
  key:            string,
  limit:          integer,
  window_seconds: integer,
  window_label:   string    # "10s", "1m", "1h", "1d"
) -> RateLimitResult:
  # key format: rl:{group}:{tier}:{identifier}:{window}
  # e.g.: rl:compute:pro:usr:01ABCDEF:hourly

  now_ms = current_unix_timestamp_milliseconds()
  window_start_ms = now_ms - (window_seconds * 1000)

  # Generate a unique member name to handle concurrent requests at same ms
  member = "{now_ms}:{random_4_bytes_hex()}"

  # Atomic pipeline: remove stale, count, add new, set TTL
  pipe = redis.pipeline()
  pipe.ZREMRANGEBYSCORE(key, 0, window_start_ms)   # Remove expired events
  pipe.ZCARD(key)                                   # Count events before adding
  pipe.ZADD(key, now_ms, member)                    # Add current request event
  pipe.EXPIRE(key, window_seconds + 10)             # TTL with 10s buffer for clock skew

  results = pipe.execute()
  current_count_before_add = results[1]   # ZCARD result

  if current_count_before_add >= limit:
    # Limit exceeded: remove the event we just added
    redis.ZREM(key, member)

    # Compute retry_after: when oldest event in window will slide out
    oldest = redis.ZRANGE(key, 0, 0, WITHSCORES)
    if oldest is empty:
      # All events expired between pipeline execution and now — retry immediately
      retry_after = 1
      reset_at = floor(now_ms / 1000) + 1
    else:
      oldest_score_ms = oldest[0].score
      window_end_ms = oldest_score_ms + (window_seconds * 1000)
      retry_after = max(1, ceil((window_end_ms - now_ms) / 1000))
      reset_at = floor(window_end_ms / 1000)

    return RateLimitResult(
      allowed=false,
      limit=limit,
      remaining=0,
      reset_at=reset_at,
      retry_after=retry_after,
      window=window_label
    )

  # Allowed: compute remaining and reset_at
  remaining = max(0, limit - current_count_before_add - 1)

  # reset_at is when the oldest event in the window expires
  oldest = redis.ZRANGE(key, 0, 0, WITHSCORES)
  if oldest is empty:
    reset_at = floor((now_ms + window_seconds * 1000) / 1000)
  else:
    reset_at = floor((oldest[0].score + window_seconds * 1000) / 1000)

  return RateLimitResult(
    allowed=true,
    limit=limit,
    remaining=remaining,
    reset_at=reset_at,
    retry_after=null,
    window=window_label
  )
```

### 4.2 Atomicity Guarantee

The `ZREMRANGEBYSCORE + ZCARD + ZADD + EXPIRE` pipeline executes as a single Redis transaction. The count check happens after stale removal but before the new event is added. This means:

- **True count** at decision time = `current_count_before_add`
- **After pipeline** = `current_count_before_add + 1` (if allowed) or `current_count_before_add` (if blocked and ZREM succeeds)
- **Race condition window**: Two concurrent requests that both read `current_count_before_add == limit - 1` may both be allowed, temporarily exceeding the limit by 1. This is a known characteristic of sorted-set sliding windows without Lua scripts. Acceptable at the target traffic volume (≤1,000 compute/hour at launch). If strict enforcement is required at higher traffic, replace pipeline with a Lua script (see §4.3).

### 4.3 Strict Enforcement Lua Script (for high-traffic future use)

```lua
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window_ms = tonumber(ARGV[2])
local now_ms = tonumber(ARGV[3])
local member = ARGV[4]
local window_start_ms = now_ms - window_ms

redis.call("ZREMRANGEBYSCORE", key, 0, window_start_ms)
local count = redis.call("ZCARD", key)

if count >= limit then
  return {0, count, 0}  -- not allowed, current count, no add
end

redis.call("ZADD", key, now_ms, member)
redis.call("EXPIRE", key, math.ceil(window_ms / 1000) + 10)
return {1, count + 1, 1}  -- allowed, new count, added
```

This Lua script executes atomically (Redis single-threaded). Deploy via `redis.eval()` when concurrent traffic on a single key exceeds 100 requests/second.

---

## 5. Multi-Window Check for COMPUTE Group

`POST /compute` is subject to three windows in sequence: burst (10s), hourly, daily. All three must pass.

```
function compute_rate_check(
  identifier: string,
  tier:       RateLimitTier
) -> RateLimitResult:

  # Step 1: Burst check (fastest to fail if abusive)
  if tier != ADMIN:
    burst_result = sliding_window_check(
      key   = f"rl:compute:{tier_slug(tier)}:{identifier}:burst",
      limit = BURST_LIMITS[tier],    # see §6
      window_seconds = 10,
      window_label = "10s"
    )
    if not burst_result.allowed:
      return burst_result  # Hourly/daily not incremented

  # Step 2: Hourly check
  hourly_result = sliding_window_check(
    key   = f"rl:compute:{tier_slug(tier)}:{identifier}:hourly",
    limit = HOURLY_COMPUTE_LIMITS[tier],
    window_seconds = 3600,
    window_label = "1h"
  )
  if not hourly_result.allowed:
    # burst was already incremented — undo it
    undo_burst_increment(identifier, tier)
    return hourly_result

  # Step 3: Daily check
  daily_result = sliding_window_check(
    key   = f"rl:compute:{tier_slug(tier)}:{identifier}:daily",
    limit = DAILY_COMPUTE_LIMITS[tier],
    window_seconds = 86400,
    window_label = "1d"
  )
  if not daily_result.allowed:
    # undo both burst and hourly increments
    undo_burst_increment(identifier, tier)
    undo_hourly_increment(identifier, tier)
    return daily_result

  # All three passed — return the most restrictive window's info
  most_restrictive = min_by_remaining([burst_result, hourly_result, daily_result])
  return RateLimitResult(
    allowed=true,
    limit=most_restrictive.limit,
    remaining=most_restrictive.remaining,
    reset_at=min(burst_result.reset_at, hourly_result.reset_at, daily_result.reset_at),
    retry_after=null,
    window=most_restrictive.window
  )

function undo_burst_increment(identifier: string, tier: RateLimitTier):
  # Remove the most recent member added to the burst sorted set
  # Use ZRANGE key -1 -1 (last member by index) and ZREM
  key = f"rl:compute:{tier_slug(tier)}:{identifier}:burst"
  members = redis.ZRANGE(key, -1, -1)
  if members is not empty:
    redis.ZREM(key, members[0])

function undo_hourly_increment(identifier: string, tier: RateLimitTier):
  key = f"rl:compute:{tier_slug(tier)}:{identifier}:hourly"
  members = redis.ZRANGE(key, -1, -1)
  if members is not empty:
    redis.ZREM(key, members[0])

function tier_slug(tier: RateLimitTier) -> string:
  switch tier:
    case ANONYMOUS:          return "anon"
    case FREE:               return "free"
    case PRO:                return "pro"
    case ENTERPRISE_SESSION: return "ent_session"
    case ENTERPRISE_KEY:     return "ent_key"
    case ADMIN:              return "admin"
```

### 5.1 Limit Constants

```
HOURLY_COMPUTE_LIMITS = {
  ANONYMOUS:          15,
  FREE:               30,
  PRO:                200,
  ENTERPRISE_SESSION: 500,
  ENTERPRISE_KEY:     1000,
}

DAILY_COMPUTE_LIMITS = {
  ANONYMOUS:          50,
  FREE:               100,
  PRO:                1000,
  ENTERPRISE_SESSION: 5000,
  ENTERPRISE_KEY:     10000,
}

GENERAL_PER_MINUTE_LIMITS = {
  ANONYMOUS:          30,
  FREE:               60,
  PRO:                120,
  ENTERPRISE_SESSION: 300,
  ENTERPRISE_KEY:     600,
}
```

---

## 6. Burst Allowances (COMPUTE group sub-window)

A 10-second sub-window prevents the full hourly quota from being exhausted in the first seconds of the window. This does not reduce the hourly quota — it only limits how fast the hourly quota can be consumed.

### 6.1 Burst Limits

| Tier | 10-second burst limit | Rationale |
|------|-----------------------|-----------|
| `ANONYMOUS` | 3 | Prevents automated scraping tools that fire many requests rapidly |
| `FREE` | 5 | Allows copy-paste-adjust-recompute workflow (paste values, try a few variants) |
| `PRO` | 20 | Allows rapid regime comparison iteration during a filing session |
| `ENTERPRISE_SESSION` | 30 | CPA switching between client computations quickly |
| `ENTERPRISE_KEY` | 50 | Programmatic client that processes items sequentially without full batch API |
| `ADMIN` | Unlimited | No burst limit; admin requests bypass all checks |

```
BURST_LIMITS = {
  ANONYMOUS:          3,
  FREE:               5,
  PRO:                20,
  ENTERPRISE_SESSION: 30,
  ENTERPRISE_KEY:     50,
}
```

### 6.2 Burst Window Behavior

The burst window is **not** a separate quota — it is a sub-window check on the same compute group. A PRO user with 200 hourly requests is still limited to 20 of those in any 10-second window.

Example: A PRO user cannot send 50 requests in 1 second even though they have 200/hour. They can send 20 requests in any 10-second window, then must wait until the 10-second window slides forward before sending more.

After 10 seconds from the first burst request, the window slides and all 20 burst slots are freed. The user can burst again.

---

## 7. Per-Endpoint Overrides

### 7.1 AUTH_SENSITIVE Group

Auth endpoints have stricter limits than the GENERAL group. These limits apply to **all tiers** including ENTERPRISE and ADMIN. They are always keyed by **IP address**, not user_id.

| Endpoint | Per-minute limit (IP) | Per-hour limit (IP) |
|----------|----------------------|---------------------|
| `POST /auth/register` | 3 | 10 |
| `POST /auth/login` | 5 | 20 |
| `POST /auth/password-reset` | 3 | 5 |
| `POST /auth/resend-verification` | 2 | 5 |

**Why always IP-based:** These endpoints are used before the user is authenticated. Using IP prevents credential stuffing, mass registration, and email enumeration attacks regardless of authentication state.

**Rate limit check for AUTH_SENSITIVE:**
```
function auth_sensitive_check(
  endpoint_slug: string,   # "register", "login", "pwreset", "verify"
  ip:            string
) -> RateLimitResult:

  permin_result = sliding_window_check(
    key   = f"rl:auth:{endpoint_slug}:permin:{sanitize_ip(ip)}",
    limit = AUTH_PERMIN_LIMITS[endpoint_slug],
    window_seconds = 60,
    window_label = "1m"
  )
  if not permin_result.allowed:
    return permin_result

  hourly_result = sliding_window_check(
    key   = f"rl:auth:{endpoint_slug}:hourly:{sanitize_ip(ip)}",
    limit = AUTH_HOURLY_LIMITS[endpoint_slug],
    window_seconds = 3600,
    window_label = "1h"
  )
  if not hourly_result.allowed:
    undo_auth_permin_increment(endpoint_slug, ip)
    return hourly_result

  return hourly_result  # Report hourly as most relevant for auth

AUTH_PERMIN_LIMITS  = { "register": 3, "login": 5, "pwreset": 3, "verify": 2 }
AUTH_HOURLY_LIMITS  = { "register": 10, "login": 20, "pwreset": 5, "verify": 5 }
```

**429 response for auth endpoints** does NOT include account-specific information (prevents enumeration). The message is generic:

```json
{
  "error": {
    "code": "ERR_RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again after 37 seconds.",
    "details": {
      "limit": 5,
      "window": "1m",
      "retry_after": 37,
      "tier": "AUTH_IP",
      "upgrade_available": false
    }
  }
}
```

`tier` is `"AUTH_IP"` (not the user's subscription tier) to signal this is a security limit, not a plan limit.

### 7.2 BATCH_SUBMIT Group

`POST /batch/computations` is ENTERPRISE-only. Two separate limits apply:

**Hourly sliding window (how many batch jobs can be submitted per hour):**

| Tier | Batch submissions per hour |
|------|---------------------------|
| `ENTERPRISE_SESSION` | 20 |
| `ENTERPRISE_KEY` | 50 |

Redis key: `rl:batch:{tier_slug}:{identifier}:hourly`

**Concurrent batch counter (how many batch jobs can run simultaneously):**

| Tier | Max concurrent batches |
|------|------------------------|
| `ENTERPRISE_SESSION` | 5 |
| `ENTERPRISE_KEY` | 5 |

The concurrency limit is enforced with a Redis counter (INCR/DECR), not a sliding window:

```
function batch_concurrency_check(identifier: string) -> ConcurrencyResult:
  counter_key = f"rl:batch_concurrent:{identifier}"
  current = redis.GET(counter_key)
  if current is null: current = 0
  if int(current) >= 5:
    return ConcurrencyResult(allowed=false, active=int(current), limit=5)
  return ConcurrencyResult(allowed=true, active=int(current), limit=5)

function batch_concurrency_increment(identifier: string):
  counter_key = f"rl:batch_concurrent:{identifier}"
  redis.INCR(counter_key)
  redis.EXPIRE(counter_key, 86400)  # 24h safety TTL (batch jobs never run this long)

function batch_concurrency_decrement(identifier: string):
  counter_key = f"rl:batch_concurrent:{identifier}"
  # Only decrement if > 0 (avoid negative counts from edge cases)
  lua_script = """
    local val = redis.call("GET", KEYS[1])
    if val and tonumber(val) > 0 then
      return redis.call("DECR", KEYS[1])
    end
    return 0
  """
  redis.eval(lua_script, [counter_key])
```

`batch_concurrency_decrement()` must be called when a batch job completes (status changes to `COMPLETED` or `FAILED`) in the batch job processor.

**429 response for concurrent batch limit:**
```json
{
  "error": {
    "code": "ERR_BATCH_CONCURRENCY_EXCEEDED",
    "message": "Maximum 5 concurrent batch jobs active. Wait for a batch to complete before submitting another.",
    "details": {
      "active_batches": 5,
      "limit": 5,
      "retry_after": null
    }
  }
}
```

HTTP status: `429 Too Many Requests`. `Retry-After` header is **not set** (no fixed window; user must poll batch status). The response body `details.retry_after` is `null` to signal "no fixed window".

### 7.3 PDF_EXPORT Group

`POST /computations/:id/exports` has two limits:

1. **GENERAL per-minute limit** (same as all endpoints for the tier)
2. **PDF-specific per-day limit** (additional gate):

| Tier | PDF exports per day |
|------|---------------------|
| `FREE` | 0 (returns 403 `ERR_REQUIRES_PRO` — not a 429, gate check before rate check) |
| `PRO` | 50 |
| `ENTERPRISE_SESSION` | 500 |
| `ENTERPRISE_KEY` | 1,000 |

Check order for `POST /computations/:id/exports`:
1. Feature gate check: FREE → return 403 `ERR_REQUIRES_PRO` immediately
2. GENERAL per-minute sliding window (same as §2)
3. PDF per-day sliding window (additional check)

Redis key for PDF daily limit: `rl:pdf:{tier_slug}:{identifier}:daily`

If the PDF daily limit is reached (but GENERAL per-minute is fine), returns 429 with the daily reset time.

### 7.4 WEBHOOK_REGISTER Group

`POST /webhooks` (ENTERPRISE only) has a per-hour registration limit:

| Tier | New webhooks per hour |
|------|----------------------|
| `ENTERPRISE_SESSION` | 5 |
| `ENTERPRISE_KEY` | 5 |

**Note:** The maximum total webhooks per account (10) is enforced at the database level as a CHECK constraint (`webhook_count_per_user <= 10`), returning `409 ERR_WEBHOOK_LIMIT_EXCEEDED` when reached. This is separate from the per-hour rate limit.

Redis key: `rl:webhook:{tier_slug}:{identifier}:hourly`

---

## 8. Rate Limit Response Headers

### 8.1 Headers Included on Every Response

All API responses (including successful 200 responses) include the following headers:

| Header | Type | Description | Example |
|--------|------|-------------|---------|
| `X-RateLimit-Limit` | integer | The configured limit for the reported window | `200` |
| `X-RateLimit-Remaining` | integer | Requests remaining in the reported window after this request | `197` |
| `X-RateLimit-Reset` | integer | Unix timestamp (seconds UTC) when oldest event in window expires | `1741913400` |
| `X-RateLimit-Window` | string | The window this limit report applies to | `1h` |

**Window label values:** `10s` (burst), `1m` (per-minute), `1h` (hourly), `1d` (daily).

**Which window is reported in headers:**
- For COMPUTE group requests: the window with the fewest `remaining` requests (the most constraining)
- For GENERAL group requests: the per-minute window
- For AUTH_SENSITIVE group requests: the per-minute window
- For PDF_EXPORT group requests: if PDF daily limit is more constrained than GENERAL per-minute, report daily; otherwise report per-minute

### 8.2 Header Computation

```
X-RateLimit-Limit     = result.limit
X-RateLimit-Remaining = result.remaining
X-RateLimit-Reset     = result.reset_at
X-RateLimit-Window    = result.window
```

`X-RateLimit-Remaining` counts from the perspective of the current request. If the request is the 50th in a 200/hour window, `remaining = 150` (200 - 50 = 150 more allowed).

### 8.3 Additional 429-Only Headers

When a rate limit is exceeded (HTTP 429), additionally include:

| Header | Type | Description | Example |
|--------|------|-------------|---------|
| `Retry-After` | integer | Seconds until the blocking window frees one slot | `37` |

`Retry-After` is computed as:
```
oldest_event_ms = ZRANGE(key, 0, 0, WITHSCORES)[0].score
window_expiry_ms = oldest_event_ms + (window_seconds * 1000)
retry_after = max(1, ceil((window_expiry_ms - now_ms) / 1000))
```

This is the exact time until the oldest request slides out of the window, freeing one slot. Minimum value: 1 second.

`X-RateLimit-Remaining` is always `0` on a 429 response.

---

## 9. 429 Response Body

```json
{
  "error": {
    "code": "ERR_RATE_LIMIT_EXCEEDED",
    "message": "Hourly compute limit reached (200 requests/hour on PRO plan). Retry after 37 seconds.",
    "details": {
      "limit": 200,
      "window": "1h",
      "retry_after": 37,
      "tier": "PRO",
      "upgrade_available": true
    }
  }
}
```

### 9.1 Field Definitions

| Field | Type | Description |
|-------|------|-------------|
| `error.code` | string | Always `"ERR_RATE_LIMIT_EXCEEDED"` except batch concurrency (`"ERR_BATCH_CONCURRENCY_EXCEEDED"`) |
| `error.message` | string | Human-readable message with dynamic retry_after value. Template varies by window (see §9.2) |
| `error.details.limit` | integer | The limit for this window and tier |
| `error.details.window` | string | Window type: `"10s"`, `"1m"`, `"1h"`, `"1d"` |
| `error.details.retry_after` | integer or null | Seconds until retry allowed. `null` only for batch concurrency limit |
| `error.details.tier` | string | Rate limit tier applied: `"ANONYMOUS"`, `"FREE"`, `"PRO"`, `"ENTERPRISE"`, `"AUTH_IP"`, `"ADMIN"` |
| `error.details.upgrade_available` | boolean | `true` if a higher plan increases this limit |

**`tier` value mapping:**
- Session auth with plan `PRO` → `"PRO"`
- Session auth with plan `ENTERPRISE` → `"ENTERPRISE"`
- Session auth with plan `FREE` → `"FREE"`
- No auth → `"ANONYMOUS"`
- API key auth → `"ENTERPRISE"`
- AUTH_SENSITIVE endpoint (IP-based) → `"AUTH_IP"`

### 9.2 Message Templates by Window Type

| Window | tier | Message template |
|--------|------|-----------------|
| `10s` | any | `"Too many requests in a short time. Please slow down and retry after {retry_after} seconds."` |
| `1h` | ANONYMOUS | `"Hourly compute limit reached. Create a free account for a higher limit, or retry after {retry_after} seconds."` |
| `1h` | FREE | `"Hourly compute limit reached (30 requests/hour on Free plan). Upgrade to Pro for 200/hour, or retry after {retry_after} seconds."` |
| `1h` | PRO | `"Hourly compute limit reached (200 requests/hour on Pro plan). Upgrade to Professional for 500/hour, or retry after {retry_after} seconds."` |
| `1h` | ENTERPRISE | `"Hourly compute limit reached (500 requests/hour). Retry after {retry_after} seconds."` |
| `1d` | ANONYMOUS | `"Daily compute limit reached. Create a free account for a higher limit, or retry after {retry_after} seconds."` |
| `1d` | FREE | `"Daily compute limit reached (100 requests/day on Free plan). Upgrade to Pro for 1,000/day, or retry after {retry_after} seconds."` |
| `1d` | PRO | `"Daily compute limit reached (1,000 requests/day on Pro plan). Upgrade to Professional for 5,000/day, or retry after {retry_after} seconds."` |
| `1d` | ENTERPRISE | `"Daily compute limit reached (5,000 requests/day). Retry after {retry_after} seconds."` |
| `1m` | any (GENERAL) | `"Rate limit exceeded. You can retry after {retry_after} seconds."` |
| `1m` | AUTH_IP | `"Too many requests. Please try again after {retry_after} seconds."` |
| `1d` | PRO (PDF) | `"Daily PDF export limit reached (50/day on Pro plan). Limit resets after {retry_after} seconds."` |
| `1d` | ENTERPRISE (PDF) | `"Daily PDF export limit reached (500/day). Limit resets after {retry_after} seconds."` |

### 9.3 `upgrade_available` Logic

```
function compute_upgrade_available(tier: string, group: EndpointGroup) -> boolean:
  # Security/auth limits are never upgradeable
  if tier == "AUTH_IP": return false
  # Admin already at maximum
  if tier == "ADMIN": return false
  # Enterprise is the highest tier
  if tier == "ENTERPRISE": return false
  # All other tiers can upgrade
  return true
```

---

## 10. Identifier Resolution

### 10.1 IP Address (Anonymous Requests)

For requests with no valid auth cookie or API key, the client IP is the identifier.

```
function resolve_ip(request: Request) -> string:
  # Cloudflare sets CF-Connecting-IP with the real client IP for all requests
  # through taxklaro.ph (all traffic must pass through Cloudflare per deployment config)
  ip = request.headers["CF-Connecting-IP"]

  if ip is null or ip is empty:
    # Fallback: non-Cloudflare traffic (local dev, staging behind Fly.io direct)
    forwarded = request.headers["X-Forwarded-For"]
    if forwarded is not null:
      ip = forwarded.split(",")[0].trim()

  if ip is null or ip is empty:
    ip = request.connection.remoteAddress

  if ip is null:
    ip = "unknown"

  return sanitize_ip_for_redis_key(ip)

function sanitize_ip_for_redis_key(ip: string) -> string:
  # Replace colons in IPv6 with hyphens to avoid Redis key ambiguity
  # e.g., "2001:db8::1" → "2001-db8--1"
  return ip.replace(":", "-")
```

### 10.2 Authenticated Requests

```
function resolve_identifier(request: Request, auth_result: AuthResult) -> string:
  if auth_result.method == "session":
    return f"usr:{auth_result.user_id}"    # ULID format: "usr:01JDXXXXXXXXXXXXXX"
  if auth_result.method == "api_key":
    return f"key:{auth_result.api_key_id}" # ULID format: "key:01JZXXXXXXXXXXXXXX"
  # Should never reach here (anonymous handled separately)
  raise EngineAssertionError("resolve_identifier called with unauthenticated request")
```

---

## 11. Tier Resolution for Rate Limiting

```
function resolve_rate_limit_tier(request: Request, auth_result: AuthResult) -> RateLimitTier:
  # Anonymous
  if auth_result.is_authenticated == false:
    return ANONYMOUS

  # API key auth is always ENTERPRISE_KEY (API keys require ENTERPRISE subscription)
  if auth_result.method == "api_key":
    return ENTERPRISE_KEY

  # Session auth: check user role first (admin bypasses all)
  if auth_result.user.role == "ADMIN":
    return ADMIN

  # Resolve plan from Redis cache (TTL: 5 minutes, per auth.md §6.3)
  plan = resolve_plan_from_cache_or_db(auth_result.user_id)

  switch plan:
    case "ENTERPRISE": return ENTERPRISE_SESSION
    case "PRO":        return PRO
    case "FREE":       return FREE
    default:           return FREE  # expired/cancelled subscriptions fall to FREE
```

---

## 12. Redis Key Naming Convention

All rate limit keys follow this pattern:

```
rl:{group}:{tier}:{identifier}:{window}
```

| Component | Allowed values | Example |
|-----------|---------------|---------|
| Prefix | `rl:` (constant) | `rl:` |
| `{group}` | `compute`, `general`, `auth`, `batch`, `pdf`, `webhook` | `compute` |
| `{tier}` | `anon`, `free`, `pro`, `ent_session`, `ent_key`, `admin` | `pro` |
| `{identifier}` | `usr:{user_id}`, `key:{api_key_id}`, `{sanitized_ip}` | `usr:01JDXXXXXXXXXXXXXX` |
| `{window}` | `burst`, `permin`, `hourly`, `daily` | `hourly` |

**Complete key examples:**

```
rl:compute:anon:203.112.82.14:burst
rl:compute:anon:203.112.82.14:hourly
rl:compute:anon:203.112.82.14:daily
rl:compute:free:usr:01JDXXXXXXXXXXXXXX:burst
rl:compute:free:usr:01JDXXXXXXXXXXXXXX:hourly
rl:compute:free:usr:01JDXXXXXXXXXXXXXX:daily
rl:compute:pro:usr:01JDXXXXXXXXXXXXXX:burst
rl:compute:pro:usr:01JDXXXXXXXXXXXXXX:hourly
rl:compute:pro:usr:01JDXXXXXXXXXXXXXX:daily
rl:compute:ent_session:usr:01JDXXXXXXXXXXXXXX:burst
rl:compute:ent_session:usr:01JDXXXXXXXXXXXXXX:hourly
rl:compute:ent_session:usr:01JDXXXXXXXXXXXXXX:daily
rl:compute:ent_key:key:01JZXXXXXXXXXXXXXX:burst
rl:compute:ent_key:key:01JZXXXXXXXXXXXXXX:hourly
rl:compute:ent_key:key:01JZXXXXXXXXXXXXXX:daily
rl:general:anon:203.112.82.14:permin
rl:general:free:usr:01JDXXXXXXXXXXXXXX:permin
rl:general:pro:usr:01JDXXXXXXXXXXXXXX:permin
rl:general:ent_session:usr:01JDXXXXXXXXXXXXXX:permin
rl:general:ent_key:key:01JZXXXXXXXXXXXXXX:permin
rl:auth:register:permin:203.112.82.14
rl:auth:register:hourly:203.112.82.14
rl:auth:login:permin:203.112.82.14
rl:auth:login:hourly:203.112.82.14
rl:auth:pwreset:permin:203.112.82.14
rl:auth:pwreset:hourly:203.112.82.14
rl:auth:verify:permin:203.112.82.14
rl:auth:verify:hourly:203.112.82.14
rl:pdf:pro:usr:01JDXXXXXXXXXXXXXX:daily
rl:pdf:ent_session:usr:01JDXXXXXXXXXXXXXX:daily
rl:pdf:ent_key:key:01JZXXXXXXXXXXXXXX:daily
rl:batch:ent_session:usr:01JDXXXXXXXXXXXXXX:hourly
rl:batch:ent_key:key:01JZXXXXXXXXXXXXXX:hourly
rl:batch_concurrent:usr:01JDXXXXXXXXXXXXXX
rl:batch_concurrent:key:01JZXXXXXXXXXXXXXX
rl:webhook:ent_session:usr:01JDXXXXXXXXXXXXXX:hourly
rl:webhook:ent_key:key:01JZXXXXXXXXXXXXXX:hourly
```

**IPv6 key example:**
```
# IPv6: 2001:db8::1  →  sanitized: 2001-db8--1
rl:compute:anon:2001-db8--1:hourly
```

---

## 13. Implementation: Upstash @upstash/ratelimit

### 13.1 Package Version and Installation

```bash
npm install @upstash/ratelimit@^2.0.0 @upstash/redis@^1.34.0
```

The `@upstash/ratelimit` v2.x package is required. v1.x does not support the `slidingWindow` algorithm with the `prefix` option for key isolation.

### 13.2 Ratelimiter Initialization

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Single Redis instance shared across all rate limiters
const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL,   // from deployment/environment.md
  token: process.env.UPSTASH_REDIS_REST_TOKEN, // from deployment/environment.md
});

// ── COMPUTE group: burst (10-second window) ──────────────────────────────────
export const computeBurstLimiters: Record<string, Ratelimit> = {
  anon:         new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3,   "10 s"), prefix: "rl:compute:anon:burst"        }),
  free:         new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5,   "10 s"), prefix: "rl:compute:free:burst"        }),
  pro:          new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20,  "10 s"), prefix: "rl:compute:pro:burst"         }),
  ent_session:  new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30,  "10 s"), prefix: "rl:compute:ent_session:burst" }),
  ent_key:      new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(50,  "10 s"), prefix: "rl:compute:ent_key:burst"     }),
};

// ── COMPUTE group: hourly (1-hour window) ────────────────────────────────────
export const computeHourlyLimiters: Record<string, Ratelimit> = {
  anon:         new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(15,   "1 h"), prefix: "rl:compute:anon:hourly"        }),
  free:         new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30,   "1 h"), prefix: "rl:compute:free:hourly"        }),
  pro:          new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(200,  "1 h"), prefix: "rl:compute:pro:hourly"         }),
  ent_session:  new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(500,  "1 h"), prefix: "rl:compute:ent_session:hourly" }),
  ent_key:      new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(1000, "1 h"), prefix: "rl:compute:ent_key:hourly"     }),
};

// ── COMPUTE group: daily (24-hour window) ────────────────────────────────────
export const computeDailyLimiters: Record<string, Ratelimit> = {
  anon:         new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(50,    "1 d"), prefix: "rl:compute:anon:daily"        }),
  free:         new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(100,   "1 d"), prefix: "rl:compute:free:daily"        }),
  pro:          new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(1000,  "1 d"), prefix: "rl:compute:pro:daily"         }),
  ent_session:  new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5000,  "1 d"), prefix: "rl:compute:ent_session:daily" }),
  ent_key:      new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10000, "1 d"), prefix: "rl:compute:ent_key:daily"     }),
};

// ── GENERAL group: per-minute window ─────────────────────────────────────────
export const generalLimiters: Record<string, Ratelimit> = {
  anon:         new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30,  "1 m"), prefix: "rl:general:anon"         }),
  free:         new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60,  "1 m"), prefix: "rl:general:free"         }),
  pro:          new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(120, "1 m"), prefix: "rl:general:pro"          }),
  ent_session:  new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(300, "1 m"), prefix: "rl:general:ent_session"  }),
  ent_key:      new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(600, "1 m"), prefix: "rl:general:ent_key"      }),
};

// ── AUTH_SENSITIVE group: per-minute (IP-based, same for all tiers) ──────────
export const authPerMinLimiters: Record<string, Ratelimit> = {
  register:  new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, "1 m"), prefix: "rl:auth:register:permin" }),
  login:     new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "1 m"), prefix: "rl:auth:login:permin"    }),
  pwreset:   new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, "1 m"), prefix: "rl:auth:pwreset:permin"  }),
  verify:    new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(2, "1 m"), prefix: "rl:auth:verify:permin"   }),
};

// ── AUTH_SENSITIVE group: per-hour (IP-based) ────────────────────────────────
export const authHourlyLimiters: Record<string, Ratelimit> = {
  register:  new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "1 h"), prefix: "rl:auth:register:hourly" }),
  login:     new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "1 h"), prefix: "rl:auth:login:hourly"    }),
  pwreset:   new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5,  "1 h"), prefix: "rl:auth:pwreset:hourly"  }),
  verify:    new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5,  "1 h"), prefix: "rl:auth:verify:hourly"   }),
};

// ── PDF_EXPORT group: per-day ─────────────────────────────────────────────────
export const pdfDailyLimiters: Record<string, Ratelimit> = {
  pro:          new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(50,   "1 d"), prefix: "rl:pdf:pro:daily"         }),
  ent_session:  new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(500,  "1 d"), prefix: "rl:pdf:ent_session:daily" }),
  ent_key:      new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(1000, "1 d"), prefix: "rl:pdf:ent_key:daily"     }),
};

// ── BATCH_SUBMIT group: per-hour ─────────────────────────────────────────────
export const batchHourlyLimiters: Record<string, Ratelimit> = {
  ent_session:  new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "1 h"), prefix: "rl:batch:ent_session:hourly" }),
  ent_key:      new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(50, "1 h"), prefix: "rl:batch:ent_key:hourly"     }),
};

// ── WEBHOOK_REGISTER group: per-hour ─────────────────────────────────────────
export const webhookHourlyLimiters: Record<string, Ratelimit> = {
  ent_session:  new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "1 h"), prefix: "rl:webhook:ent_session:hourly" }),
  ent_key:      new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "1 h"), prefix: "rl:webhook:ent_key:hourly"     }),
};
```

### 13.3 Calling the Limiters

The `@upstash/ratelimit` `limit(identifier)` call returns:
```typescript
interface RatelimitResponse {
  success:   boolean;    // true = allowed
  limit:     number;     // window limit
  remaining: number;     // remaining after this request
  reset:     number;     // Unix timestamp (ms) when window resets
  pending:   Promise<unknown>;  // background cleanup promise (can ignore)
}
```

**Usage example (COMPUTE group, PRO user):**
```typescript
const tier_slug = "pro";
const identifier = `usr:${user_id}`;

// Burst check
const burst = await computeBurstLimiters[tier_slug].limit(identifier);
if (!burst.success) {
  return build_429_response({
    limit: burst.limit,
    remaining: 0,
    reset_at: Math.floor(burst.reset / 1000),
    window: "10s",
    retry_after: Math.max(1, Math.ceil((burst.reset - Date.now()) / 1000)),
    tier: "PRO",
  });
}

// Hourly check
const hourly = await computeHourlyLimiters[tier_slug].limit(identifier);
if (!hourly.success) {
  return build_429_response({
    limit: hourly.limit,
    remaining: 0,
    reset_at: Math.floor(hourly.reset / 1000),
    window: "1h",
    retry_after: Math.max(1, Math.ceil((hourly.reset - Date.now()) / 1000)),
    tier: "PRO",
  });
}

// Daily check
const daily = await computeDailyLimiters[tier_slug].limit(identifier);
if (!daily.success) {
  return build_429_response({
    limit: daily.limit,
    remaining: 0,
    reset_at: Math.floor(daily.reset / 1000),
    window: "1d",
    retry_after: Math.max(1, Math.ceil((daily.reset - Date.now()) / 1000)),
    tier: "PRO",
  });
}

// All passed — set headers and continue
set_rate_limit_headers(response, {
  limit: hourly.limit,
  remaining: Math.min(burst.remaining, hourly.remaining, daily.remaining),
  reset_at: Math.min(
    Math.floor(burst.reset / 1000),
    Math.floor(hourly.reset / 1000),
    Math.floor(daily.reset / 1000)
  ),
  window: "1h",
});
```

---

## 14. Middleware Integration Order

Rate limiting middleware runs in the following order within the request pipeline. Each step must complete before the next starts.

```
REQUEST ARRIVES
     │
     ▼
1. IP Resolution
   resolve_ip(request) → ip_address

     │
     ▼
2. Auth Resolution
   validate_session_or_api_key(request) → AuthResult{is_authenticated, method, user_id, api_key_id, ...}

     │
     ▼
3. Tier Resolution
   resolve_rate_limit_tier(request, auth_result) → tier

     │
     ▼
4. Endpoint Group Classification
   classify_endpoint_group(request.method, request.path) → group

     │
     ▼
5. Admin Bypass Check
   if tier == ADMIN: skip all rate limit steps → proceed to handler

     │
     ▼
6. Group-Specific Rate Limit Check
   ├── if group == COMPUTE:
   │     burst_check → hourly_check → daily_check (§5)
   ├── if group == AUTH_SENSITIVE:
   │     auth_permin_check → auth_hourly_check (§7.1)
   ├── if group == BATCH_SUBMIT:
   │     batch_hourly_check → batch_concurrency_check (§7.2)
   ├── if group == PDF_EXPORT:
   │     feature_gate_check (403 if FREE) → general_permin_check → pdf_daily_check (§7.3)
   ├── if group == WEBHOOK_REGISTER:
   │     webhook_hourly_check (§7.4)
   └── if group == GENERAL:
         general_permin_check

     │
     ▼ (if any check fails)
7. Return 429 Response
   - Set X-RateLimit-* headers
   - Set Retry-After header (except batch concurrency)
   - Return 429 JSON body (§9)

     │
     ▼ (if all checks pass)
8. Set Rate Limit Headers on Response
   set_rate_limit_headers(response, result_from_step_6)

     │
     ▼
9. Proceed to Request Handler
```

---

## 15. Admin Bypass

Users with `role = 'ADMIN'` bypass all rate limit checks. No Redis calls are made for admin requests.

```typescript
function apply_rate_limiting(request: Request, auth_result: AuthResult): void {
  const tier = resolve_rate_limit_tier(request, auth_result);
  if (tier === "ADMIN") {
    // Set generous placeholder headers so client code doesn't fail on missing headers
    response.setHeader("X-RateLimit-Limit", "unlimited");
    response.setHeader("X-RateLimit-Remaining", "unlimited");
    response.setHeader("X-RateLimit-Reset", String(Math.floor(Date.now() / 1000) + 3600));
    response.setHeader("X-RateLimit-Window", "1h");
    return;  // Skip all Redis calls
  }
  // ... normal rate limit flow
}
```

---

## 16. Multi-Datacenter and Edge Considerations

### 16.1 Request Path

```
User browser / API client
       │
       ▼
Cloudflare CDN (edge, global)
  - DDoS mitigation
  - WAF rules (see §16.3)
  - 1,000 req/min/IP Cloudflare-level block (far above app limits)
       │
       ▼
Fly.io (API server, primary region: sin — Singapore)
  - Application-level rate limiting via Upstash Redis
       │
       ▼
Upstash Redis (primary: us-east-1, replicas: global)
```

### 16.2 Consistency Trade-offs

Upstash Redis "Global" mode: reads from nearest replica, writes to primary. The ZADD + ZCARD pipeline is a write, so it always goes to the primary (us-east-1). Since the API server is in Singapore (`sin`), the round trip to us-east-1 adds approximately 150–200ms per rate limit check.

**Mitigation:** The `@upstash/ratelimit` library batches the ZADD + ZCARD + ZREMRANGEBYSCORE into a single pipeline, minimizing round trips to one per rate limit window checked.

**For COMPUTE group (3 windows):** 3 sequential Redis pipeline calls = approximately 450–600ms total latency overhead on rate limit checks. This is acceptable because `POST /compute` involves heavy tax calculation that takes 50–200ms on its own.

**For GENERAL group (1 window):** 1 Redis pipeline call ≈ 150–200ms latency overhead.

If Upstash adds a Singapore primary region option, the `UPSTASH_REDIS_REST_URL` environment variable should be updated to use the closest primary to minimize latency.

### 16.3 Cloudflare WAF Pre-Rate-Limit Defense

Cloudflare WAF rules (configured in `deployment/domains.md`) provide the first layer of protection before requests reach the application rate limiter:

| Rule | Condition | Action |
|------|-----------|--------|
| Block no-UA POST | `POST /v1/compute` AND `User-Agent` header is missing | Block (403) |
| Block known bad UAs | User-Agent matches bot signatures from Cloudflare threat intel | Block (403) |
| Cloudflare rate limit | More than 1,000 requests per minute from a single IP across all endpoints | Block for 60 seconds |
| Reputation block | IP is on Cloudflare's threat score > 50 | Block (403) |

These Cloudflare limits are in addition to application-level Redis sliding window limits. Legitimate users at normal traffic levels will never hit the Cloudflare limits.

---

## 17. Redis Failure Behavior

If the Upstash Redis connection fails or times out during a rate limit check:

```
function apply_rate_limiting_with_fallback(request, auth_result):
  try:
    result = apply_rate_limiting(request, auth_result)  # normal flow
    return result
  catch RedisConnectionError | RedisTimeoutError as e:
    # Log the error to monitoring (see deployment/monitoring.md)
    logger.error("rate_limit_redis_failure", {
      error: e.message,
      endpoint: request.path,
      tier: resolve_rate_limit_tier(request, auth_result),
      identifier: resolve_identifier(request, auth_result)
    })
    metrics.increment("ratelimit.redis.error", { error_type: e.constructor.name })

    # FAIL OPEN: allow the request rather than blocking all users during Redis outage
    response.setHeader("X-RateLimit-Status", "redis-unavailable")
    response.setHeader("X-RateLimit-Limit", "0")       # 0 signals unknown
    response.setHeader("X-RateLimit-Remaining", "0")   # 0 signals unknown
    response.setHeader("X-RateLimit-Reset", String(Math.floor(Date.now() / 1000) + 60))
    response.setHeader("X-RateLimit-Window", "unknown")
    return ALLOWED  # Proceed to request handler
```

**Rationale for fail-open:** TaxKlaro is a tax computation service, not a security-critical authentication system. During a brief Redis outage, allowing requests is preferable to blocking all users (especially during peak filing season). The Cloudflare WAF (§16.3) provides abuse protection while Redis is unavailable.

**Redis timeout:** The Upstash client is configured with a 2,000ms timeout. If a rate limit check takes longer than 2,000ms, it is treated as a Redis failure and the request is allowed through.

```typescript
const redis = new Redis({
  url:     process.env.UPSTASH_REDIS_REST_URL,
  token:   process.env.UPSTASH_REDIS_REST_TOKEN,
  retry:   { retries: 0 },      // No retries on rate limit checks (fail fast)
  signal:  AbortSignal.timeout(2000),  // 2-second timeout
});
```

---

## 18. Rate Limit Monitoring and Alerts

### 18.1 Metrics Emitted

The rate limiting middleware emits the following metrics to Axiom (the monitoring system per `deployment/monitoring.md`):

| Metric name | Type | Labels | Description |
|-------------|------|--------|-------------|
| `ratelimit.request.allowed` | Counter | `tier`, `group`, `window` | Count of requests allowed through rate limit check |
| `ratelimit.request.blocked` | Counter | `tier`, `group`, `window` | Count of 429 responses returned |
| `ratelimit.block_rate` | Gauge | `tier`, `group` | `blocked / (allowed + blocked)` per minute, rolling |
| `ratelimit.redis.latency_ms` | Histogram | `operation` | Time in ms for Redis pipeline execution |
| `ratelimit.redis.error` | Counter | `error_type` | Redis operation failures (triggers fail-open) |
| `ratelimit.admin.bypass` | Counter | `endpoint` | Count of admin bypass events (monitoring only) |

**Label values:**
- `tier`: `anon`, `free`, `pro`, `ent_session`, `ent_key`, `admin`
- `group`: `compute`, `general`, `auth`, `batch`, `pdf`, `webhook`
- `window`: `10s`, `1m`, `1h`, `1d`
- `error_type`: `RedisConnectionError`, `RedisTimeoutError`, `UnexpectedError`

### 18.2 Alert Definitions

| Alert name | Condition | Duration | Severity | Notification |
|-----------|-----------|----------|----------|-------------|
| `ratelimit.anon_block_rate_high` | `ratelimit.block_rate{tier=anon} > 0.05` | 5 consecutive minutes | WARNING | Slack `#ops-alerts` |
| `ratelimit.abuse_detected` | `ratelimit.block_rate{group=compute} > 0.20` | 2 consecutive minutes | CRITICAL | PagerDuty + Slack `#ops-alerts` |
| `ratelimit.redis_failure` | `ratelimit.redis.error > 10` within 1 minute | immediate | CRITICAL | PagerDuty + Slack `#ops-alerts` |
| `ratelimit.redis_latency_high` | `ratelimit.redis.latency_ms p99 > 500ms` | 5 consecutive minutes | WARNING | Slack `#ops-alerts` |
| `ratelimit.auth_block_high` | `ratelimit.request.blocked{group=auth} > 100` | within 1 minute | WARNING | Slack `#ops-alerts` — possible credential stuffing |

### 18.3 Rate Limit Dashboard

The Axiom dashboard (defined in `deployment/monitoring.md §5`) includes a "Rate Limiting" panel with:
- Time series: allowed vs blocked per tier over last 24 hours
- Current block rate per tier (gauge)
- Redis latency p50/p95/p99 (time series)
- Top 10 blocked identifiers (table, updated every 5 minutes)

---

## 19. Canonical Rate Limit Reference Table

This is the complete, authoritative table of all rate limits. Any value in another spec file that contradicts a value in this table is superseded by this table.

| Endpoint / Group | Tier | Window | Limit | Redis Key Pattern |
|-----------------|------|--------|-------|-------------------|
| `POST /compute` | ANONYMOUS | 10s burst | 3 | `rl:compute:anon:{ip}:burst` |
| `POST /compute` | FREE | 10s burst | 5 | `rl:compute:free:{user_id}:burst` |
| `POST /compute` | PRO | 10s burst | 20 | `rl:compute:pro:{user_id}:burst` |
| `POST /compute` | ENTERPRISE_SESSION | 10s burst | 30 | `rl:compute:ent_session:{user_id}:burst` |
| `POST /compute` | ENTERPRISE_KEY | 10s burst | 50 | `rl:compute:ent_key:{key_id}:burst` |
| `POST /compute` | ANONYMOUS | 1h | 15 | `rl:compute:anon:{ip}:hourly` |
| `POST /compute` | FREE | 1h | 30 | `rl:compute:free:{user_id}:hourly` |
| `POST /compute` | PRO | 1h | 200 | `rl:compute:pro:{user_id}:hourly` |
| `POST /compute` | ENTERPRISE_SESSION | 1h | 500 | `rl:compute:ent_session:{user_id}:hourly` |
| `POST /compute` | ENTERPRISE_KEY | 1h | 1,000 | `rl:compute:ent_key:{key_id}:hourly` |
| `POST /compute` | ANONYMOUS | 1d | 50 | `rl:compute:anon:{ip}:daily` |
| `POST /compute` | FREE | 1d | 100 | `rl:compute:free:{user_id}:daily` |
| `POST /compute` | PRO | 1d | 1,000 | `rl:compute:pro:{user_id}:daily` |
| `POST /compute` | ENTERPRISE_SESSION | 1d | 5,000 | `rl:compute:ent_session:{user_id}:daily` |
| `POST /compute` | ENTERPRISE_KEY | 1d | 10,000 | `rl:compute:ent_key:{key_id}:daily` |
| All other endpoints | ANONYMOUS | 1m | 30 | `rl:general:anon:{ip}` |
| All other endpoints | FREE | 1m | 60 | `rl:general:free:{user_id}` |
| All other endpoints | PRO | 1m | 120 | `rl:general:pro:{user_id}` |
| All other endpoints | ENTERPRISE_SESSION | 1m | 300 | `rl:general:ent_session:{user_id}` |
| All other endpoints | ENTERPRISE_KEY | 1m | 600 | `rl:general:ent_key:{key_id}` |
| `POST /auth/register` | ALL tiers (IP-based) | 1m | 3 | `rl:auth:register:permin:{ip}` |
| `POST /auth/register` | ALL tiers (IP-based) | 1h | 10 | `rl:auth:register:hourly:{ip}` |
| `POST /auth/login` | ALL tiers (IP-based) | 1m | 5 | `rl:auth:login:permin:{ip}` |
| `POST /auth/login` | ALL tiers (IP-based) | 1h | 20 | `rl:auth:login:hourly:{ip}` |
| `POST /auth/password-reset` | ALL tiers (IP-based) | 1m | 3 | `rl:auth:pwreset:permin:{ip}` |
| `POST /auth/password-reset` | ALL tiers (IP-based) | 1h | 5 | `rl:auth:pwreset:hourly:{ip}` |
| `POST /auth/resend-verification` | ALL tiers (IP-based) | 1m | 2 | `rl:auth:verify:permin:{ip}` |
| `POST /auth/resend-verification` | ALL tiers (IP-based) | 1h | 5 | `rl:auth:verify:hourly:{ip}` |
| `POST /computations/:id/exports` (PDF) | PRO | 1d | 50 | `rl:pdf:pro:{user_id}:daily` |
| `POST /computations/:id/exports` (PDF) | ENTERPRISE_SESSION | 1d | 500 | `rl:pdf:ent_session:{user_id}:daily` |
| `POST /computations/:id/exports` (PDF) | ENTERPRISE_KEY | 1d | 1,000 | `rl:pdf:ent_key:{key_id}:daily` |
| `POST /batch/computations` | ENTERPRISE_SESSION | 1h | 20 | `rl:batch:ent_session:{user_id}:hourly` |
| `POST /batch/computations` | ENTERPRISE_KEY | 1h | 50 | `rl:batch:ent_key:{key_id}:hourly` |
| `POST /batch/computations` (concurrency) | ENTERPRISE | counter | 5 | `rl:batch_concurrent:{identifier}` |
| `POST /webhooks` | ENTERPRISE_SESSION | 1h | 5 | `rl:webhook:ent_session:{user_id}:hourly` |
| `POST /webhooks` | ENTERPRISE_KEY | 1h | 5 | `rl:webhook:ent_key:{key_id}:hourly` |
| Health endpoints (`/health/*`) | ALL | None | Unlimited | (no Redis check) |
| All endpoints | ADMIN | None | Unlimited | (all checks bypassed) |
