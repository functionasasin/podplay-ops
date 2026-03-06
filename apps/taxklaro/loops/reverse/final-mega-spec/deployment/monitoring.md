# Monitoring — Philippine Freelance & Self-Employed Income Tax Optimizer

**Status:** COMPLETE
**Last updated:** 2026-03-02
**Cross-references:**
- Infrastructure (services, components): [deployment/infrastructure.md](infrastructure.md)
- CI/CD pipeline: [deployment/ci-cd.md](ci-cd.md)
- Environment variables: [deployment/environment.md](environment.md)
- API endpoints: [api/endpoints.md](../api/endpoints.md)
- Database schema: [database/schema.md](../database/schema.md)

---

## Table of Contents

1. [Health Check Endpoints](#1-health-check-endpoints)
2. [Uptime Monitoring — BetterUptime](#2-uptime-monitoring--betteruptime)
3. [Log Aggregation — Axiom](#3-log-aggregation--axiom)
4. [Error Tracking Alerts — Sentry](#4-error-tracking-alerts--sentry)
5. [Infrastructure Metrics — Fly.io](#5-infrastructure-metrics--flyio)
6. [Database Monitoring — Supabase](#6-database-monitoring--supabase)
7. [Payment Monitoring](#7-payment-monitoring)
8. [Business Metrics Dashboard](#8-business-metrics-dashboard)
9. [Status Page](#9-status-page)
10. [Alert Routing and Escalation](#10-alert-routing-and-escalation)
11. [Incident Severity Definitions](#11-incident-severity-definitions)
12. [Runbooks](#12-runbooks)

---

## 1. Health Check Endpoints

The API server exposes three health check endpoints. All three are implemented in `src/routes/health.ts`.

### 1.1 Liveness Probe — `GET /v1/health/live`

**Purpose:** Indicates the process is running and not deadlocked. Used by Fly.io `[checks]` in `fly.toml` and by BetterUptime uptime monitors. Does NOT check external dependencies (database, cache, etc.) — only that the process is alive and the event loop is responsive.

**Authentication:** None required.

**Headers accepted:** `X-Health-Check: fly-internal` (logged but not required).

**Response 200 OK:**
```json
{
  "status": "ok",
  "service": "taxklaro-api",
  "timestamp": "2026-03-02T10:00:00.000Z"
}
```

**Response 503 Service Unavailable (only if process is in shutdown/drain mode):**
```json
{
  "status": "draining",
  "service": "taxklaro-api",
  "timestamp": "2026-03-02T10:00:00.000Z"
}
```

**Expected response time:** < 50 ms (no I/O).

**Implementation:**
```typescript
router.get('/live', (_req, res) => {
  if (process.env.DRAINING === 'true') {
    return res.status(503).json({
      status: 'draining',
      service: 'taxklaro-api',
      timestamp: new Date().toISOString(),
    });
  }
  return res.status(200).json({
    status: 'ok',
    service: 'taxklaro-api',
    timestamp: new Date().toISOString(),
  });
});
```

### 1.2 Readiness Probe — `GET /v1/health/ready`

**Purpose:** Indicates the server is ready to accept traffic. Used by Fly.io health checks after deployment (grace period: 10s). Checks that the database connection pool can acquire a connection. If the DB is down, returns 503 to prevent Fly from routing traffic to this instance.

**Authentication:** None required.

**Headers accepted:** `X-Health-Check: fly-internal` (logged but not required).

**Response 200 OK (database reachable):**
```json
{
  "status": "ready",
  "service": "taxklaro-api",
  "timestamp": "2026-03-02T10:00:00.000Z",
  "checks": {
    "database": "ok",
    "database_latency_ms": 12
  }
}
```

**Response 503 Service Unavailable (database unreachable):**
```json
{
  "status": "not_ready",
  "service": "taxklaro-api",
  "timestamp": "2026-03-02T10:00:00.000Z",
  "checks": {
    "database": "error",
    "database_error": "Connection timeout after 3000ms"
  }
}
```

**Expected response time:** < 5000 ms (DB connection check with 3s timeout).

**Implementation:**
```typescript
router.get('/ready', async (_req, res) => {
  const start = Date.now();
  try {
    await db.execute(sql`SELECT 1`); // Drizzle ORM with 3s timeout
    const latency = Date.now() - start;
    return res.status(200).json({
      status: 'ready',
      service: 'taxklaro-api',
      timestamp: new Date().toISOString(),
      checks: { database: 'ok', database_latency_ms: latency },
    });
  } catch (err) {
    const latency = Date.now() - start;
    return res.status(503).json({
      status: 'not_ready',
      service: 'taxklaro-api',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'error',
        database_error: String((err as Error).message).substring(0, 200),
        database_latency_ms: latency,
      },
    });
  }
});
```

### 1.3 Detailed Diagnostic — `GET /v1/health/detailed`

**Purpose:** Comprehensive health check for manual diagnostic use. Checks all downstream dependencies. NOT exposed to public internet — requires internal authentication header.

**Authentication:** Required. Header: `X-Internal-Key: <INTERNAL_API_SECRET>`. Returns 403 if missing or incorrect.

**Checks performed:**
1. Database (`SELECT 1` with 3s timeout)
2. R2 reachability (HEAD request to R2 bucket endpoint with 5s timeout)
3. Resend API reachability (GET `https://api.resend.com/emails` with 5s timeout, expects 200 or 401)

**Response 200 OK (all checks pass):**
```json
{
  "status": "healthy",
  "service": "taxklaro-api",
  "timestamp": "2026-03-02T10:00:00.000Z",
  "version": "1.0.0",
  "git_sha": "a1b2c3d4",
  "checks": {
    "database": { "status": "ok", "latency_ms": 12 },
    "r2_storage": { "status": "ok", "latency_ms": 45 },
    "resend_email": { "status": "ok", "latency_ms": 120 }
  }
}
```

**Response 200 OK (some checks fail — still returns 200 because the API is not wholly unavailable):**
```json
{
  "status": "degraded",
  "service": "taxklaro-api",
  "timestamp": "2026-03-02T10:00:00.000Z",
  "version": "1.0.0",
  "git_sha": "a1b2c3d4",
  "checks": {
    "database": { "status": "ok", "latency_ms": 12 },
    "r2_storage": { "status": "error", "error": "Connection timeout after 5000ms", "latency_ms": 5001 },
    "resend_email": { "status": "ok", "latency_ms": 120 }
  }
}
```

**Response 403 Forbidden (missing/wrong internal key):**
```json
{ "error": "Forbidden" }
```

**Expected response time:** < 10000 ms.

### 1.4 Smoke Test — `GET /v1/health/smoke`

**Purpose:** Verifies the tax computation engine is producing correct output. Runs a deterministic test computation with hardcoded inputs and validates the result against the expected value. Used by synthetic uptime monitor (BetterUptime Heartbeat or POST check).

**Authentication:** Required. Header: `Authorization: Bearer <MONITORING_API_KEY>`. Returns 403 if missing or incorrect. `MONITORING_API_KEY` is a 64-character hex string stored in Fly.io secrets.

**Fixed test input (hardcoded in implementation):**
- Scenario code: SC-PURE-01-SERVICE-8PCT (see engine/test-vectors/basic.md)
- `gross_receipts`: 500000.00
- `business_type`: `"SERVICE"`
- `expense_method_override`: `null` (let engine optimize)
- `compensation_income`: 0
- `quarterly_payments`: []
- `cwt_credits`: []
- `tax_year`: 2025
- `computation_scope`: `"ANNUAL"`

**Expected output (verified against test vector TV-B-01):**
- `recommended_path`: `"PATH_C"`
- `path_c.net_taxable_income`: 250000.00
- `path_c.tax_due_before_credits`: 20000.00
- `path_c.tax_due_after_credits`: 20000.00

**Response 200 OK (engine output matches expected):**
```json
{
  "status": "ok",
  "service": "taxklaro-api",
  "timestamp": "2026-03-02T10:00:00.000Z",
  "test": "SC-PURE-01-smoke",
  "computation_ms": 4,
  "expected": { "recommended_path": "PATH_C", "tax_due_after_credits": 20000.00 },
  "actual": { "recommended_path": "PATH_C", "tax_due_after_credits": 20000.00 },
  "match": true
}
```

**Response 503 Service Unavailable (engine output does not match expected):**
```json
{
  "status": "engine_mismatch",
  "service": "taxklaro-api",
  "timestamp": "2026-03-02T10:00:00.000Z",
  "test": "SC-PURE-01-smoke",
  "computation_ms": 4,
  "expected": { "recommended_path": "PATH_C", "tax_due_after_credits": 20000.00 },
  "actual": { "recommended_path": "PATH_B", "tax_due_after_credits": 24000.00 },
  "match": false,
  "diff": "recommended_path: expected PATH_C got PATH_B; tax_due_after_credits: expected 20000.00 got 24000.00"
}
```

**Response 503 Service Unavailable (engine threw an exception):**
```json
{
  "status": "engine_error",
  "service": "taxklaro-api",
  "timestamp": "2026-03-02T10:00:00.000Z",
  "test": "SC-PURE-01-smoke",
  "error": "ERR_ASSERT_PATH_C_EXCEEDS_GROSS"
}
```

**Expected response time:** < 500 ms.

---

## 2. Uptime Monitoring — BetterUptime

### 2.1 Service Selection and Plan

- **Service:** BetterUptime (betterstack.com/better-uptime)
- **Plan:** Free tier — 30 monitors, 3-minute check interval, 1 status page, unlimited team members, phone call + SMS + email alerts
- **Account email:** `ops@taxklaro.ph`
- **Team workspace name:** `TaxKlaro`

The BetterUptime free plan is sufficient for MVP (30 monitors, 3-minute minimum interval). If requirements exceed free plan limits, upgrade to Starter ($24/month) for 1-minute intervals and heartbeat monitors.

### 2.2 Monitor Configuration (Production)

All monitors are configured via BetterUptime Dashboard → Monitors → New Monitor.

**Monitor 1: API Server — Liveness**
| Field | Value |
|-------|-------|
| Name | `API Server — Liveness` |
| URL | `https://api.taxklaro.ph/v1/health/live` |
| Method | `GET` |
| Check interval | 3 minutes |
| Request timeout | 10 seconds |
| Expected HTTP status | `200` |
| Expected response body | `"status":"ok"` (substring match) |
| Alert after | 2 consecutive failures (= 6 minutes of downtime) |
| Recovery confirmation | 1 successful check |
| Team | All team members |
| Components | API (for status page) |
| Regions | New York, Amsterdam, Singapore (3 locations) |

**Monitor 2: API Server — Readiness**
| Field | Value |
|-------|-------|
| Name | `API Server — Readiness (DB check)` |
| URL | `https://api.taxklaro.ph/v1/health/ready` |
| Method | `GET` |
| Check interval | 3 minutes |
| Request timeout | 15 seconds |
| Expected HTTP status | `200` |
| Expected response body | `"status":"ready"` (substring match) |
| Alert after | 2 consecutive failures |
| Recovery confirmation | 1 successful check |
| Team | All team members |
| Components | API, Database (for status page) |
| Regions | New York, Amsterdam, Singapore |

**Monitor 3: Frontend — Home Page**
| Field | Value |
|-------|-------|
| Name | `Frontend — Home Page` |
| URL | `https://taxklaro.ph/` |
| Method | `GET` |
| Check interval | 3 minutes |
| Request timeout | 10 seconds |
| Expected HTTP status | `200` |
| Expected response body | `TaxKlaro` (substring match in HTML title) |
| Alert after | 2 consecutive failures |
| Recovery confirmation | 1 successful check |
| Team | All team members |
| Components | Frontend (for status page) |
| Regions | New York, Amsterdam, Singapore |

**Monitor 4: Frontend — Pricing Page**
| Field | Value |
|-------|-------|
| Name | `Frontend — Pricing Page` |
| URL | `https://taxklaro.ph/pricing` |
| Method | `GET` |
| Check interval | 5 minutes |
| Request timeout | 10 seconds |
| Expected HTTP status | `200` |
| Expected response body | `PRO` (substring match — pricing tiers should be on page) |
| Alert after | 2 consecutive failures |
| Recovery confirmation | 1 successful check |
| Team | All team members |
| Components | Frontend (for status page) |
| Regions | New York, Amsterdam, Singapore |

**Monitor 5: Engine Smoke Test**
| Field | Value |
|-------|-------|
| Name | `Engine Smoke Test — SC-PURE-01` |
| URL | `https://api.taxklaro.ph/v1/health/smoke` |
| Method | `GET` |
| Request headers | `Authorization: Bearer <MONITORING_API_KEY>` |
| Check interval | 5 minutes |
| Request timeout | 30 seconds |
| Expected HTTP status | `200` |
| Expected response body | `"match":true` (substring match) |
| Alert after | 2 consecutive failures |
| Recovery confirmation | 1 successful check |
| Team | All team members |
| Components | API (for status page) |
| Regions | Singapore only (single region — computation determinism check, not geo check) |

### 2.3 Alert Notification Configuration

Configure in BetterUptime Dashboard → Team → Notification Channels.

| Channel | Type | Destination | Used For |
|---------|------|-------------|----------|
| Slack Production Alerts | Slack | `#production-alerts` in `taxklaro-team.slack.com` | All monitor failures |
| Ops Email | Email | `ops@taxklaro.ph` | P1 (down) incidents only |

**Slack webhook setup:**
1. In Slack: Apps → BetterUptime → Add to Slack → Select `#production-alerts`
2. In BetterUptime: Team → Notification Channels → New → Slack → paste webhook URL

**Alert message format (BetterUptime default — no customization needed):**
- Down: `🔴 [Monitor Name] is DOWN — [URL] — Check started at [time]`
- Up: `✅ [Monitor Name] is UP again after [duration]`

### 2.4 Monitor Configuration (Staging)

Staging monitors are identical to production except:
- URLs use `staging.taxklaro.ph` and `api.staging.taxklaro.ph`
- Alert channel: `#staging-alerts` in Slack (not `#production-alerts`)
- No phone/SMS alerts (staging failures are not on-call events)
- Check interval: 5 minutes (less critical)

| Monitor Name (Staging) | URL |
|------------------------|-----|
| `[Staging] API Liveness` | `https://api.staging.taxklaro.ph/v1/health/live` |
| `[Staging] API Readiness` | `https://api.staging.taxklaro.ph/v1/health/ready` |
| `[Staging] Frontend` | `https://staging.taxklaro.ph/` |

---

## 3. Log Aggregation — Axiom

### 3.1 Service Selection and Plan

- **Service:** Axiom (axiom.co)
- **Plan:** Free — 500 GB ingestion/month, 30-day retention, unlimited queries
- **Account email:** `ops@taxklaro.ph`
- **Organization name:** `taxklaro-ph`
- **Dataset name:** `taxklaro-production`
- **Staging dataset name:** `taxklaro-staging`

### 3.2 Log Drain Setup

Fly.io machines stream logs via `stdout`/`stderr`. Axiom ingests them via a Fly.io log drain (HTTP endpoint).

**One-time setup commands:**

```bash
# 1. Create Axiom API token (in Axiom Dashboard → Settings → API Tokens → New)
#    Name: fly-log-drain-production
#    Permissions: ingest:taxklaro-production
#    → Copy token value

# 2. Create Fly.io log drain for API server
flyctl log-drains create \
  --type https \
  --url "https://cloud.axiom.co/api/v1/datasets/taxklaro-production/ingest" \
  --header "Authorization=Bearer <axiom-ingest-token>" \
  --header "Content-Type=application/x-ndjson" \
  -a taxklaro-api

# 3. Create log drain for PDF worker
flyctl log-drains create \
  --type https \
  --url "https://cloud.axiom.co/api/v1/datasets/taxklaro-production/ingest" \
  --header "Authorization=Bearer <axiom-ingest-token>" \
  --header "Content-Type=application/x-ndjson" \
  -a taxklaro-pdf

# 4. Create log drain for Batch worker
flyctl log-drains create \
  --type https \
  --url "https://cloud.axiom.co/api/v1/datasets/taxklaro-production/ingest" \
  --header "Authorization=Bearer <axiom-ingest-token>" \
  --header "Content-Type=application/x-ndjson" \
  -a taxklaro-batch

# 5. Verify drain is active
flyctl log-drains list -a taxklaro-api
```

The Axiom ingest token is stored in Fly.io secrets for reference but is not consumed by the application — it is used only in the `flyctl log-drains create` command above.

### 3.3 Structured Log Format

All application logs use structured JSON via the `pino` library. Every log line written to `stdout` follows this schema:

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | ISO 8601 string | Log timestamp in UTC |
| `level` | `"debug"` \| `"info"` \| `"warn"` \| `"error"` \| `"fatal"` | Log severity |
| `service` | `"api"` \| `"pdf"` \| `"batch"` | Which component emitted the log |
| `request_id` | UUID v4 string | Unique per HTTP request (generated from `X-Request-ID` header if present, else generated) |
| `method` | `"GET"` \| `"POST"` \| `"PUT"` \| `"PATCH"` \| `"DELETE"` | HTTP method (request logs only) |
| `path` | string | URL path without query string (request logs only) |
| `status_code` | integer | HTTP response status (response logs only) |
| `duration_ms` | number | Request duration in milliseconds (response logs only) |
| `user_id` | UUID string \| null | Authenticated user ID (null for unauthenticated requests) |
| `ip` | string | Requester's IP address (from `X-Forwarded-For` first entry) |
| `msg` | string | Human-readable log message |
| `error` | string \| undefined | Error message (error/fatal logs only) |
| `stack` | string \| undefined | Stack trace (error/fatal logs only, server-side only — never emitted for client-visible errors) |
| `computation_id` | UUID string \| undefined | Present on computation-related logs |
| `batch_job_id` | UUID string \| undefined | Present on batch job logs |
| `pdf_template` | string \| undefined | Present on PDF generation logs |

**Example request log entry:**
```json
{
  "timestamp": "2026-03-02T10:00:00.123Z",
  "level": "info",
  "service": "api",
  "request_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "method": "POST",
  "path": "/v1/compute",
  "status_code": 200,
  "duration_ms": 42,
  "user_id": "f1e2d3c4-b5a6-9780-0def-123456789abc",
  "ip": "123.456.789.012",
  "msg": "POST /v1/compute 200 42ms"
}
```

**Example error log entry:**
```json
{
  "timestamp": "2026-03-02T10:00:01.456Z",
  "level": "error",
  "service": "api",
  "request_id": "b2c3d4e5-f6a7-8901-bcde-f01234567891",
  "method": "POST",
  "path": "/v1/compute",
  "status_code": 500,
  "duration_ms": 103,
  "user_id": null,
  "ip": "98.76.54.32",
  "msg": "Unhandled error in POST /v1/compute",
  "error": "ERR_ASSERT_NTI_CANNOT_BE_NEGATIVE: net_taxable_income is -5000.00, input gross_receipts=495000 expenses=500000",
  "stack": "Error: ERR_ASSERT_NTI_CANNOT_BE_NEGATIVE...\n    at assertNtiNonNegative (dist/engine/assertions.js:45:11)\n..."
}
```

### 3.4 Pino Logger Setup (API Server)

**`src/lib/logger.ts`:**
```typescript
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
  base: { service: 'api' },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'body.password',
      'body.new_password',
      'body.current_password',
    ],
    censor: '[REDACTED]',
  },
});
```

**Request logging middleware (`src/middleware/request-logger.ts`):**
```typescript
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../lib/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const requestId = (req.headers['x-request-id'] as string) ?? uuidv4();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      request_id: requestId,
      method: req.method,
      path: req.path,
      status_code: res.statusCode,
      duration_ms: duration,
      user_id: req.user?.id ?? null,
      ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.ip,
      msg: `${req.method} ${req.path} ${res.statusCode} ${duration}ms`,
    });
  });

  next();
};
```

### 3.5 Key Axiom Queries

These queries are saved as named queries in Axiom Dashboard → Starred Queries.

**Query 1: Error rate per hour (last 24 hours)**
```
| where service == "api"
| where status_code >= 500
| summarize errors = count() by bin(timestamp, 1h)
| sort by timestamp asc
```

**Query 2: p50/p95/p99 latency for /v1/compute (last 24 hours)**
```
| where service == "api"
| where path == "/v1/compute"
| where method == "POST"
| summarize
    p50 = percentile(duration_ms, 50),
    p95 = percentile(duration_ms, 95),
    p99 = percentile(duration_ms, 99)
  by bin(timestamp, 1h)
| sort by timestamp asc
```

**Query 3: Unique users per hour (last 7 days)**
```
| where service == "api"
| where user_id != ""
| summarize users = dcount(user_id) by bin(timestamp, 1h)
| sort by timestamp asc
```

**Query 4: 4xx errors by path (last 24 hours)**
```
| where service == "api"
| where status_code >= 400 and status_code < 500
| summarize count() by path, status_code
| sort by count_ desc
```

**Query 5: Batch job errors (last 7 days)**
```
| where service == "batch"
| where level == "error"
| project timestamp, msg, error, batch_job_id
| sort by timestamp desc
```

**Query 6: PDF generation latency (last 7 days)**
```
| where service == "pdf"
| where msg startswith "PDF generated"
| project timestamp, duration_ms, pdf_template
| summarize avg(duration_ms) by pdf_template
```

---

## 4. Error Tracking Alerts — Sentry

Sentry projects are already configured in `infrastructure.md §10`. This section defines the alert rules within Sentry.

### 4.1 API Server Alert Rules

Configure in: Sentry Dashboard → `taxklaro-ph-api` project → Alerts → Alert Rules

**Rule 1: High API Error Volume**
| Setting | Value |
|---------|-------|
| Rule name | `High API Error Volume` |
| Metric | `Number of errors in 5-minute window` |
| Threshold | Warning: > 20 errors; Critical: > 100 errors |
| Environment | `production` |
| Action (Warning) | Notify Slack `#production-alerts`: `⚠️ High error volume on taxklaro-api: {count} errors in 5 minutes` |
| Action (Critical) | Notify Slack `#production-alerts` AND email `ops@taxklaro.ph` |
| Resolve threshold | < 5 errors in 5-minute window |

**Rule 2: API Performance Regression — Compute Endpoint**
| Setting | Value |
|---------|-------|
| Rule name | `Compute Endpoint Slow (p95 > 2s)` |
| Transaction | `POST /v1/compute` |
| Metric | `p95(transaction.duration) in 30-minute window` |
| Threshold | Warning: > 2000ms; Critical: > 5000ms |
| Environment | `production` |
| Action (Warning) | Notify Slack `#production-alerts`: `⚠️ /v1/compute p95 is {value}ms — investigate DB or engine performance` |
| Action (Critical) | Notify Slack `#production-alerts` AND email `ops@taxklaro.ph` |

**Rule 3: API Performance Regression — General**
| Setting | Value |
|---------|-------|
| Rule name | `API Latency Regression (p95 > 3s all routes)` |
| Metric | `p95(transaction.duration) for all transactions in 30-minute window` |
| Threshold | Warning: > 3000ms |
| Environment | `production` |
| Action | Notify Slack `#production-alerts` |

**Rule 4: New Error Type Detected**
| Setting | Value |
|---------|-------|
| Rule name | `New Error Type in Production` |
| Condition | `A new issue is created` (first time a new error fingerprint appears) |
| Environment | `production` |
| Action | Notify Slack `#production-alerts`: `🆕 New error in production: {issue.title} — {issue.url}` |

**Rule 5: Unhandled Promise Rejections**
| Setting | Value |
|---------|-------|
| Rule name | `Unhandled Promise Rejection` |
| Condition | `Error contains "UnhandledPromiseRejectionWarning"` OR `Error type is UnhandledRejection` |
| Environment | `production` |
| Action | Notify Slack `#production-alerts` AND email `ops@taxklaro.ph` |

**Rule 6: Assertion Failures (Engine Internal Errors)**
| Setting | Value |
|---------|-------|
| Rule name | `Engine Assertion Failure` |
| Condition | `Error message contains "ERR_ASSERT_"` |
| Environment | `production` |
| Action | Notify Slack `#production-alerts` AND email `ops@taxklaro.ph`: `🚨 Engine assertion failure — indicates a computation bug: {error.message}` |

### 4.2 Frontend Alert Rules

Configure in: Sentry Dashboard → `taxklaro-ph-frontend` project → Alerts → Alert Rules

**Rule 7: High Frontend Error Volume**
| Setting | Value |
|---------|-------|
| Rule name | `High Frontend JS Error Volume` |
| Metric | `Number of errors in 10-minute window` |
| Threshold | Warning: > 50 errors; Critical: > 200 errors |
| Environment | `production` |
| Action (Warning) | Notify Slack `#production-alerts` |
| Action (Critical) | Notify Slack `#production-alerts` AND email `ops@taxklaro.ph` |

**Rule 8: Frontend Performance (Core Web Vitals)**
| Setting | Value |
|---------|-------|
| Rule name | `Frontend LCP Regression` |
| Metric | `p75(measurements.lcp) in 1-hour window` |
| Threshold | Warning: > 2500ms (Google "Needs Improvement" threshold) |
| Environment | `production` |
| Action | Notify Slack `#production-alerts` |

### 4.3 Batch Worker Alert Rules

Configure in: Sentry Dashboard → `taxklaro-ph-batch` project → Alerts → Alert Rules

**Rule 9: Batch Job Failure Spike**
| Setting | Value |
|---------|-------|
| Rule name | `Batch Job Failures` |
| Metric | `Number of errors in 15-minute window` |
| Threshold | Warning: > 5 errors |
| Environment | `production` |
| Action | Notify Slack `#production-alerts` |

### 4.4 Sentry Issue Assignment

All production Sentry projects use auto-assignment based on code ownership (`CODEOWNERS` file in repository):

```
# .github/CODEOWNERS
src/engine/         @taxklaro-ph/engineering
src/api/routes/     @taxklaro-ph/engineering
src/frontend/       @taxklaro-ph/engineering
src/workers/        @taxklaro-ph/engineering
```

---

## 5. Infrastructure Metrics — Fly.io

### 5.1 Built-in Fly.io Metrics

Fly.io provides built-in metrics accessible at: `fly.io/apps/<app-name>/metrics`

**Access:** Log in to fly.io → Select organization `taxklaro` → Navigate to each app → Metrics tab.

**Key metrics to review in the Fly.io dashboard (no alert configuration available on pay-as-you-go — monitoring via BetterUptime and Sentry):**

| Metric | Dashboard Location | Warning Threshold | Action |
|--------|-------------------|-------------------|--------|
| CPU utilization | Apps → `taxklaro-api` → Metrics → CPU | > 85% sustained for 10 min | Scale to 3 machines or investigate hot path |
| Memory utilization | Apps → `taxklaro-api` → Metrics → Memory | > 90% | Increase VM memory or investigate memory leak |
| Machine restarts | Apps → `taxklaro-api` → Metrics → Restarts | > 3 in 1 hour | Investigate crash logs in Axiom |
| HTTP request rate | Apps → `taxklaro-api` → Metrics → Requests | Informational only | N/A |
| HTTP error rate | Apps → `taxklaro-api` → Metrics → Errors | > 5% of requests | Investigate Sentry |
| PDF Worker CPU | Apps → `taxklaro-pdf` → Metrics → CPU | > 95% (Chromium is CPU-intensive) | Queue PDF requests; scale to 2 instances |
| Batch Worker memory | Apps → `taxklaro-batch` → Metrics → Memory | > 80% | Check for Bull queue accumulation |

### 5.2 Fly.io Machine Health Checks

The Fly.io `[checks]` configuration in `fly.toml` runs the health probe from INSIDE the Fly network:

```toml
[checks]
  [checks.api_health]
    grace_period = "10s"
    interval = "15s"
    method = "GET"
    path = "/v1/health/live"
    port = 3001
    timeout = "5s"
    type = "http"
    [checks.api_health.headers]
      X-Health-Check = "fly-internal"
```

- **Grace period:** 10s — health check does not start until 10 seconds after machine start (allows app to initialize)
- **Interval:** 15s — checks every 15 seconds
- **Timeout:** 5s — if no response within 5 seconds, check fails
- **Failure behavior:** After 1 failed check, Fly marks the machine as unhealthy and removes it from the load balancer. After 3 consecutive failures, Fly restarts the machine. The other machine (minimum 2 running) continues handling traffic.

### 5.3 Fly.io Alerts via Sentry (Proxy Method)

Fly.io does not natively send alerts via webhook on CPU/memory thresholds on the pay-as-you-go plan. Infrastructure alerts beyond what BetterUptime covers are surfaced through Sentry (application-level errors that indicate infrastructure problems) and Axiom log queries.

For Fly.io machine restart events specifically, the following Axiom query detects abnormal restarts and an Axiom Monitor fires on detection:

**Axiom Monitor: Fly Machine Restart Detection**

In Axiom Dashboard → Monitors → New Monitor:
```
| where msg contains "Starting worker"
| where service == "api"
| summarize cold_starts = count() by bin(timestamp, 10m)
| where cold_starts > 3
```
- **Trigger:** cold_starts > 3 per 10-minute window (indicates machines are restarting frequently)
- **Alert action:** Axiom webhook → Slack `#production-alerts`
- **Alert message:** `⚠️ API server may be crash-looping: {cold_starts} cold starts in 10 minutes`

---

## 6. Database Monitoring — Supabase

### 6.1 Supabase Built-in Dashboard

Access: `supabase.com/dashboard/project/<project-ref>` → Reports

**Weekly review checklist (review every Monday 09:00 PHT):**

| Report | Location | Check |
|--------|----------|-------|
| Database size | Reports → Database → Database size | Must be < 7 GB (alert at 7 GB, Pro plan limit 8 GB — upgrade before exhaustion) |
| Cache hit rate | Reports → Database → Cache hit rate | Must be ≥ 98% (below this = table scans are reading from disk, not buffer cache) |
| Active connections | Reports → Database → Active connections | Must be < 25 (hard limit before PgBouncer exhausts connection slots) |
| Slow queries | Reports → Database → Slow query log | Investigate any query > 500ms |
| Index usage | Reports → Database → Index efficiency | Any table with < 90% index hit rate needs new index |
| Deadlocks | Reports → Database → Deadlocks | Must be 0 (any deadlock requires immediate code investigation) |

### 6.2 pg_stat_statements Queries (Monthly)

These queries run manually in Supabase SQL Editor once per month to spot performance regressions:

**Top 10 slowest queries by total execution time:**
```sql
SELECT
  LEFT(query, 100) AS query_preview,
  calls,
  ROUND(total_exec_time::numeric, 2) AS total_exec_time_ms,
  ROUND(mean_exec_time::numeric, 2) AS mean_exec_time_ms,
  ROUND(stddev_exec_time::numeric, 2) AS stddev_exec_time_ms,
  rows
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

**Queries with highest variance (potential for optimization):**
```sql
SELECT
  LEFT(query, 100) AS query_preview,
  calls,
  ROUND(mean_exec_time::numeric, 2) AS mean_ms,
  ROUND(stddev_exec_time::numeric, 2) AS stddev_ms,
  ROUND((stddev_exec_time / NULLIF(mean_exec_time, 0) * 100)::numeric, 1) AS cv_percent
FROM pg_stat_statements
WHERE calls > 100
ORDER BY cv_percent DESC
LIMIT 10;
```

**Table bloat check:**
```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname || '.' || tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename) - pg_relation_size(schemaname || '.' || tablename)) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;
```

### 6.3 Connection Count Alert

Add the following trigger function to the database (run in Supabase SQL Editor during initial setup):

```sql
-- Alert when connection count approaches 25 (connection limit)
-- This does not send an alert directly but records a warning in the application_events table
-- The API server reads this table on startup and emits a warning log

CREATE OR REPLACE FUNCTION check_connection_count()
RETURNS void AS $$
DECLARE
  active_count INTEGER;
BEGIN
  SELECT count(*) INTO active_count
  FROM pg_stat_activity
  WHERE state = 'active';

  IF active_count > 23 THEN
    INSERT INTO application_events (event_type, details, created_at)
    VALUES (
      'HIGH_DB_CONNECTION_COUNT',
      jsonb_build_object('active_connections', active_count, 'threshold', 23),
      NOW()
    );
  END IF;
END;
$$ LANGUAGE plpgsql;
```

The `application_events` table is defined in `database/schema.md`. The batch worker queries this table every 5 minutes and emits a structured log warning if a `HIGH_DB_CONNECTION_COUNT` event was recorded in the past 5 minutes.

### 6.4 Database Backup Verification

**Automated backup:** Supabase Pro creates a daily backup at approximately 01:00 UTC (09:00 PHT). Backups are retained for 7 days.

**Monthly backup verification procedure (run on the 1st of each month):**
```bash
# 1. In Supabase Dashboard → Project → Database → Backups
#    Confirm today's backup shows status "Completed"

# 2. Download the most recent backup file
#    Click "Restore" on the latest backup → copy the download URL
#    wget -O backup-verify.dump "<download-url>"

# 3. Verify the backup file is readable and contains expected tables
pg_restore --list backup-verify.dump | grep -E "TABLE|SEQUENCE" | head -20

# 4. Confirm the backup contains at least these tables:
#    users, sessions, computations, quarterly_records, cwt_credits,
#    batch_jobs, batch_job_items, subscriptions, audit_logs, application_events

# 5. Delete the local backup file
rm backup-verify.dump

# 6. Record verification in ops log: "Backup verified on YYYY-MM-DD — all expected tables present"
```

---

## 7. Payment Monitoring

### 7.1 PayMongo Webhook Health

PayMongo sends webhooks to `POST https://api.taxklaro.ph/v1/billing/webhooks/paymongo`. Webhook delivery failures mean subscription state changes are not processed.

**PayMongo Webhook Monitoring (manual, weekly check):**
1. Log in to dashboard.paymongo.com
2. Navigate to Developers → Webhooks
3. Click the webhook for `api.taxklaro.ph/v1/billing/webhooks/paymongo`
4. Review the "Recent Deliveries" tab
5. Any failed deliveries (status ≠ 200) must be investigated and replayed manually

**Automated detection of missed webhooks:**

The API server records every webhook receipt in the `payment_webhook_logs` table (see `database/schema.md`). The following Axiom query runs as a Monitor to detect extended webhook silence:

```
| where service == "api"
| where path == "/v1/billing/webhooks/paymongo"
| where method == "POST"
| summarize last_webhook = max(timestamp) by bin(timestamp, 1h)
```

If no webhook has been received for 24 hours AND the current time is between 08:00–22:00 PHT (active hours), a monitor fires. 24-hour silence during business hours indicates PayMongo webhook delivery failure.

**Axiom Monitor: PayMongo Webhook Silence**
- **Query:** Count of `POST /v1/billing/webhooks/paymongo` in past 24 hours
- **Threshold:** `count < 1` during 08:00–22:00 PHT (12:00–14:00 UTC offset 8h = 00:00–14:00 UTC)
- **Alert:** Slack `#production-alerts`: `⚠️ No PayMongo webhooks received in 24 hours — check PayMongo dashboard for delivery failures`

### 7.2 Stripe Webhook Health

Stripe automatically retries failed webhooks for 72 hours (up to 15 attempts with exponential backoff).

**Manual check (weekly):**
1. Log in to dashboard.stripe.com
2. Navigate to Developers → Webhooks
3. Click endpoint for `api.taxklaro.ph/v1/billing/webhooks/stripe`
4. Review "Recent Events" — all should show green checkmarks
5. Any red failures: click "Resend" to replay

### 7.3 Revenue Anomaly Detection (Weekly)

The following SQL query runs manually every Monday in Supabase SQL Editor to verify revenue is consistent with subscriber count:

```sql
-- Weekly revenue sanity check
WITH subscription_counts AS (
  SELECT
    plan_type,
    billing_cycle,
    COUNT(*) AS active_count
  FROM subscriptions
  WHERE status = 'ACTIVE'
  GROUP BY plan_type, billing_cycle
),
expected_revenue AS (
  SELECT
    plan_type,
    billing_cycle,
    active_count,
    CASE
      WHEN plan_type = 'PRO' AND billing_cycle = 'MONTHLY' THEN active_count * 29900  -- ₱299/month in centavos
      WHEN plan_type = 'PRO' AND billing_cycle = 'ANNUAL' THEN active_count * 249900 / 12  -- ₱2,499/year ÷ 12
      WHEN plan_type = 'ENTERPRISE' AND billing_cycle = 'MONTHLY' THEN active_count * 99900
      WHEN plan_type = 'ENTERPRISE' AND billing_cycle = 'ANNUAL' THEN active_count * 899900 / 12
      ELSE 0
    END AS expected_monthly_revenue_centavos
  FROM subscription_counts
)
SELECT
  plan_type,
  billing_cycle,
  active_count,
  ROUND(expected_monthly_revenue_centavos / 100.0, 2) AS expected_monthly_revenue_php
FROM expected_revenue
ORDER BY plan_type, billing_cycle;
```

Compare the expected revenue figure against PayMongo and Stripe dashboard MRR. A > 10% discrepancy indicates a missed subscription creation or cancellation webhook.

---

## 8. Business Metrics Dashboard

### 8.1 Purpose

A read-only admin dashboard at `https://taxklaro.ph/admin/metrics` displays key business metrics. Access is restricted by `X-Admin-Key` header matching the `ADMIN_API_KEY` environment variable. The page is a Next.js server component that fetches from a dedicated read-only API endpoint `GET /v1/admin/metrics`.

### 8.2 Metrics Tracked (Daily Snapshot)

The `daily_metrics_snapshots` table (see `database/schema.md`) stores one row per calendar day in Asia/Manila timezone:

| Metric | Column | Source |
|--------|--------|--------|
| Total computations run today | `computations_count` | COUNT from `computations` WHERE DATE(created_at) = today |
| New user registrations today | `new_registrations` | COUNT from `users` WHERE DATE(created_at) = today |
| Free-to-PRO conversions today | `conversions_to_pro` | COUNT from `subscriptions` WHERE plan_type='PRO' AND DATE(created_at) = today |
| Active PRO subscribers | `active_pro_subscribers` | COUNT from `subscriptions` WHERE status='ACTIVE' AND plan_type='PRO' |
| Active Enterprise subscribers | `active_enterprise_subscribers` | COUNT from `subscriptions` WHERE status='ACTIVE' AND plan_type='ENTERPRISE' |
| PDF exports generated today | `pdf_exports` | COUNT from `computation_pdfs` WHERE DATE(created_at) = today |
| Monthly Recurring Revenue (PHP) | `mrr_php` | SUM of normalized monthly revenue from active subscriptions (see §8.3) |
| Compute engine recommendation split | `path_a_pct`, `path_b_pct`, `path_c_pct` | % of today's computations recommending each path |
| Median computation duration (ms) | `median_compute_ms` | PERCENTILE_CONT(0.5) from `computation_logs.duration_ms` |

### 8.3 MRR Calculation

```sql
-- Monthly Recurring Revenue in PHP (exact centavos / 100)
SELECT
  ROUND(SUM(
    CASE
      WHEN plan_type = 'PRO' AND billing_cycle = 'MONTHLY' THEN 29900
      WHEN plan_type = 'PRO' AND billing_cycle = 'ANNUAL' THEN ROUND(249900.0 / 12)
      WHEN plan_type = 'ENTERPRISE' AND billing_cycle = 'MONTHLY' THEN 99900
      WHEN plan_type = 'ENTERPRISE' AND billing_cycle = 'ANNUAL' THEN ROUND(899900.0 / 12)
      ELSE 0
    END
  ) / 100.0, 2) AS mrr_php
FROM subscriptions
WHERE status = 'ACTIVE';
```

### 8.4 Snapshot Generation

A cron job in the batch worker runs at 23:55 PHT (15:55 UTC) daily to compute and store the snapshot for the current day. The batch worker uses `node-cron`:

```typescript
// In src/batch-server.ts
import cron from 'node-cron';

// Run at 23:55 PHT (15:55 UTC) daily
cron.schedule('55 15 * * *', async () => {
  logger.info({ msg: 'Running daily metrics snapshot job' });
  await generateDailyMetricsSnapshot();
}, { timezone: 'UTC' });
```

### 8.5 Admin Dashboard UI

URL: `https://taxklaro.ph/admin/metrics`
Auth: Basic HTTP auth with `ADMIN_API_KEY` as password and `admin` as username (handled by Cloudflare Access rule in production, not the Next.js layer).

Cloudflare Access setup (one-time):
1. Cloudflare Dashboard → Zero Trust → Access → Applications → Add
2. Application name: `TaxKlaro Admin`
3. Application domain: `taxklaro.ph/admin/*`
4. Identity providers: One-time PIN (email `ops@taxklaro.ph`)
5. Policy: Allow emails matching `ops@taxklaro.ph`

The `/admin/metrics` Next.js page does NOT implement its own auth — it relies entirely on Cloudflare Access blocking unauthenticated requests before they reach Vercel.

---

## 9. Status Page

### 9.1 Configuration

- **URL:** `https://status.taxklaro.ph`
- **Provider:** BetterUptime (same account as monitors in §2)
- **DNS:** CNAME record in Cloudflare: `status.taxklaro.ph` → `statuspage.betteruptime.com`

**DNS record (add in Cloudflare Dashboard → DNS → Records):**

| Type | Name | Target | Proxy | TTL |
|------|------|--------|-------|-----|
| CNAME | `status` | `statuspage.betteruptime.com` | DNS only (not proxied — orange cloud OFF) | Auto |

### 9.2 Status Page Components

Configure in BetterUptime → Status Pages → Components:

| Component Name | Description | Monitor Linked |
|----------------|-------------|----------------|
| `API` | Tax computation API | Monitor 1 (API Liveness) + Monitor 2 (Readiness) |
| `Frontend` | Website and calculator interface | Monitor 3 (Frontend Home) |
| `Database` | Data storage | Monitor 2 (Readiness includes DB check) |
| `Payment Processing` | GCash, Maya, card payments | Manual — no automated monitor |
| `Email Notifications` | Account and billing emails | Manual — no automated monitor |

A component shows as "Operational" when all linked monitors are passing. It shows "Partial Outage" or "Major Outage" automatically when linked monitors are failing.

### 9.3 Incident Communication

When BetterUptime detects a monitor failure and auto-creates an incident:
1. BetterUptime posts incident to `#production-alerts` Slack: `🔴 Incident created: [Monitor Name] is down`
2. Operator opens BetterUptime → Incidents → the auto-created incident
3. Operator adds incident update: "Investigating" within 15 minutes of detection
4. Operator adds incident update: "Identified — [brief description of cause]" within 1 hour
5. Operator marks incident as resolved when all monitors pass

**Incident template responses (copy-paste into BetterUptime incident updates):**

| Stage | Template |
|-------|----------|
| Investigating | `We are investigating reports of issues with [Component]. Our team has been notified and is looking into the cause. We will post an update as soon as we have more information.` |
| Identified — API down | `We have identified that the API server is not responding. The cause is [brief cause]. We are working on a fix and expect to restore service within [estimate] minutes.` |
| Identified — DB issue | `We have identified a database connectivity issue. We are working with Supabase support to restore the connection. Tax computations are temporarily unavailable.` |
| Resolved | `This incident has been resolved. The service is fully operational. We apologize for the disruption. Total downtime: [X] minutes.` |

---

## 10. Alert Routing and Escalation

### 10.1 Notification Channels

| Channel | Type | Who Receives | Used For |
|---------|------|-------------|----------|
| Slack `#production-alerts` | Team channel | All engineers | All alerts (primary) |
| Email `ops@taxklaro.ph` | Email | Operator | P1 (critical) alerts only |
| BetterUptime SMS | SMS | Operator phone number | P1 (service down) only |
| BetterUptime Phone Call | Voice call | Operator phone number | P1 (service down) only |

### 10.2 Alert Sources and Their Channels

| Alert Source | Alert Type | Channel |
|-------------|-----------|---------|
| BetterUptime monitor DOWN | P1 | Slack + Email + SMS + Phone |
| BetterUptime monitor UP (recovery) | Recovery | Slack |
| Sentry Critical (error rate > 100/5min) | P1 | Slack + Email |
| Sentry Warning (error rate > 20/5min) | P2 | Slack |
| Sentry New error type | P3 | Slack |
| Sentry Engine assertion failure (ERR_ASSERT_*) | P1 | Slack + Email |
| Sentry Compute p95 > 5s | P1 | Slack + Email |
| Sentry Compute p95 > 2s | P2 | Slack |
| Axiom Monitor: Fly machine cold starts | P2 | Slack |
| Axiom Monitor: PayMongo webhook silence | P2 | Slack |
| Batch job failure spike (Sentry) | P2 | Slack |
| Frontend error rate spike | P2 | Slack |
| Frontend LCP > 2.5s | P3 | Slack |

### 10.3 BetterUptime On-Call Configuration

Configure in BetterUptime → On-Call → Schedules.

**On-Call Schedule: Default (7 days/week)**
- **Escalation layer 1:** Slack notification (immediate, all monitors)
- **Escalation layer 2:** SMS to operator phone number (after 5 minutes with no acknowledgement)
- **Escalation layer 3:** Phone call to operator phone number (after 10 minutes with no acknowledgement)

At MVP stage with a solo operator, there is one on-call person. As the team grows, add rotation members.

**Acknowledgement SLA:**
- Acknowledge in BetterUptime within 15 minutes of phone call
- If not acknowledged, BetterUptime repeats the phone call every 10 minutes for up to 3 attempts

---

## 11. Incident Severity Definitions

### P1 — Critical (Service Down or Data-Corrupting Bug)

**Definition:** Any of:
- Frontend returning non-200 for 2+ consecutive BetterUptime checks (≥ 6 minutes of downtime)
- API returning non-200 on liveness for 2+ consecutive checks (≥ 6 minutes)
- API readiness failing (database unreachable for ≥ 6 minutes)
- Engine producing wrong computation results (smoke test failing)
- Engine assertion failures in production (ERR_ASSERT_* errors in Sentry)
- Payment webhooks completely failing (PayMongo or Stripe not delivering for > 1 hour)
- Database approaching storage limit (< 500 MB free)

**Response SLA:** Acknowledge within 15 minutes. Resolve or produce status update within 1 hour.

**Response steps:**
1. Acknowledge alert in BetterUptime
2. Post "Investigating" to status page
3. Diagnose using runbooks in §12
4. Fix or mitigate (rollback, scale, restart)
5. Post "Resolved" to status page
6. Write 1-paragraph post-mortem in `ops/incidents/YYYY-MM-DD-<slug>.md`

### P2 — Warning (Degraded Performance)

**Definition:** Any of:
- API compute endpoint p95 > 2000ms sustained for 30+ minutes
- API error rate > 20 errors in 5 minutes sustained
- Fly.io machines crash-looping (> 3 cold starts in 10 minutes)
- Batch jobs failing repeatedly
- PayMongo webhook silence for > 24 hours during business hours

**Response SLA:** Review within 1 hour during business hours (09:00–22:00 PHT). Resolve within 4 hours.

**Response steps:**
1. Check Sentry for root cause
2. Check Axiom logs for patterns
3. Check Fly.io metrics for infrastructure saturation
4. Fix or schedule fix in next working session

### P3 — Low (Non-urgent)

**Definition:** Any of:
- New error type appearing in Sentry (not causing high volume)
- Slow query detected in Supabase (> 500ms but not user-visible)
- Frontend Core Web Vitals regression
- Individual batch job failure (not systemic)
- Storage approaching 7 GB

**Response SLA:** Review next working day.

---

## 12. Runbooks

### 12.1 Runbook: API Server Down (P1)

**Trigger:** BetterUptime Monitor 1 (API Liveness) fires — 2 consecutive failures.

**Step 1: Check Fly.io machine status**
```bash
flyctl status -a taxklaro-api
```
Expected output shows 2 machines in state `started`. If state is `failed` or `stopped` for any machine:
```bash
# Check recent logs for crash reason
flyctl logs -a taxklaro-api --no-tail | tail -100

# Restart the crashed machine
flyctl machine restart <machine-id> -a taxklaro-api
```

**Step 2: If both machines are stopped (auto-stop fired at wrong time)**
```bash
# Start machines manually
flyctl machine start <machine-id-1> -a taxklaro-api
flyctl machine start <machine-id-2> -a taxklaro-api
```

**Step 3: If machines are running but health check fails (deployment issue)**
```bash
# Get list of recent deployments
flyctl releases list -a taxklaro-api

# Rollback to previous release
flyctl deploy --image registry.fly.io/taxklaro-api:<previous-version> -a taxklaro-api
```

**Step 4: Verify recovery**
```bash
curl -s https://api.taxklaro.ph/v1/health/live | jq .
# Expected: { "status": "ok", ... }
```

### 12.2 Runbook: Database Unreachable (P1)

**Trigger:** BetterUptime Monitor 2 (API Readiness) fires — DB check failing.

**Step 1: Check Supabase status**
- Open `status.supabase.com` in browser
- If there is an active incident for `ap-southeast-1` → follow Supabase status page for updates. No action needed from our side; wait for Supabase to resolve.

**Step 2: If Supabase is healthy, check connection string**
```bash
# Verify DATABASE_URL secret is correctly set
flyctl secrets list -a taxklaro-api | grep DATABASE_URL
# Should show the secret name (not the value)

# Verify the connection works from a local machine
psql "$DATABASE_DIRECT_URL" -c "SELECT version();"
```

**Step 3: If connection string is correct, check PgBouncer connection count**
- Open Supabase Dashboard → Project → Reports → Active Connections
- If count is ≥ 28 (PgBouncer Pro limit): all connection slots are occupied
  ```bash
  # Restart API machines to reset connection pools
  flyctl machine restart <machine-id-1> -a taxklaro-api
  flyctl machine restart <machine-id-2> -a taxklaro-api
  ```

**Step 4: Verify recovery**
```bash
curl -s https://api.taxklaro.ph/v1/health/ready | jq .
# Expected: { "status": "ready", "checks": { "database": "ok" }, ... }
```

### 12.3 Runbook: Engine Smoke Test Failing (P1)

**Trigger:** BetterUptime Monitor 5 (Engine Smoke Test) fires.

This is the most serious alert — it indicates the tax computation engine is producing wrong results, potentially affecting real user computations.

**Step 1: Confirm the failure manually**
```bash
curl -s -H "Authorization: Bearer $MONITORING_API_KEY" \
  https://api.taxklaro.ph/v1/health/smoke | jq .
```

If `"match": false`: Engine is producing wrong output. Check the `diff` field for which values are wrong.

If `"status": "engine_error"`: Engine is throwing an assertion error. Check Sentry for the ERR_ASSERT_* error.

**Step 2: Check recent deployments**
```bash
flyctl releases list -a taxklaro-api
```
If the failure correlates with a recent deployment:
```bash
# Immediate rollback
flyctl deploy --image registry.fly.io/taxklaro-api:<previous-version> -a taxklaro-api

# Verify smoke test passes after rollback
curl -s -H "Authorization: Bearer $MONITORING_API_KEY" \
  https://api.taxklaro.ph/v1/health/smoke | jq .
```

**Step 3: If not a deployment issue, investigate in Sentry**
- Open Sentry → `taxklaro-ph-api` project → Issues → filter by `ERR_ASSERT_`
- Find the specific assertion failure and note the input that triggered it
- This is a computation bug and requires a code fix

**Step 4: If the engine bug cannot be fixed immediately, disable the compute endpoint**
```bash
# Set COMPUTE_DISABLED=true in Fly.io secrets
flyctl secrets set COMPUTE_DISABLED=true -a taxklaro-api
```
The API server checks this env variable in `POST /v1/compute` and returns `503` with a user-friendly message: `"Tax computation is temporarily unavailable for maintenance. Please try again in a few minutes."` This prevents users from receiving wrong results.

### 12.4 Runbook: High API Error Rate (P1/P2)

**Trigger:** Sentry Alert Rule 1 fires (> 100 errors in 5-minute window for P1, > 20 for P2).

**Step 1: Open Sentry Issues tab**
- Navigate to Sentry → `taxklaro-ph-api` → Issues
- Sort by "Events" descending
- Identify the top error type driving the spike

**Step 2: Common causes and fixes**

| Error pattern | Cause | Fix |
|---------------|-------|-----|
| `ERR_DB_CONNECTION` | Database connectivity issue | Follow Runbook 12.2 |
| `ERR_ASSERT_*` | Engine assertion failure | Follow Runbook 12.3 |
| `TypeError: Cannot read properties of undefined` | Null reference in new code | Rollback deployment |
| `ECONNREFUSED :3002` | PDF worker is down | `flyctl machine restart -a taxklaro-pdf` |
| `ECONNREFUSED :3003` | Batch worker is down | `flyctl machine restart -a taxklaro-batch` |
| `PaymentError: signature mismatch` | Webhook secret rotated | Update `PAYMONGO_WEBHOOK_SECRET` in Fly.io secrets |

**Step 3: Check Axiom logs for the specific request pattern**
```
| where service == "api"
| where status_code >= 500
| where timestamp > ago(30m)
| project timestamp, path, error, request_id
| sort by timestamp desc
| limit 50
```

**Step 4: If no immediate fix, roll back to previous deployment**
```bash
flyctl releases list -a taxklaro-api
flyctl deploy --image registry.fly.io/taxklaro-api:<previous-stable-version> -a taxklaro-api
```

### 12.5 Runbook: Frontend Down (P1)

**Trigger:** BetterUptime Monitor 3 (Frontend Home Page) fires.

**Step 1: Check Vercel deployment status**
- Open `vercel.com/taxklaro-ph/taxklaro-ph/deployments`
- Check if the latest production deployment shows "Ready" or "Error"

**Step 2: If latest Vercel deployment is in "Error" state**
```bash
# Promote the previous working deployment to production
# (Vercel Dashboard → Deployments → find last "Ready" deployment → kebab menu → Promote to Production)

# Or via CLI:
vercel rollback [previous-deployment-url] --scope taxklaro-ph
```

**Step 3: If Vercel is healthy, check Cloudflare**
- Open Cloudflare Dashboard → `taxklaro.ph` → DNS
- Verify the CNAME or A record for `taxklaro.ph` is pointing to Vercel
- Check Cloudflare status at `cloudflarestatus.com`

**Step 4: If Cloudflare is experiencing issues**
- This is a Cloudflare incident — monitor `cloudflarestatus.com` and wait
- No action can be taken; post "Investigating upstream provider issue" to status page

**Step 5: Verify recovery**
```bash
curl -s -o /dev/null -w "%{http_code}" https://taxklaro.ph/
# Expected: 200
```

### 12.6 Runbook: Fly Machine Crash-Looping (P2)

**Trigger:** Axiom Monitor fires (> 3 cold starts in 10 minutes).

**Step 1: Get crash logs**
```bash
flyctl logs -a taxklaro-api --no-tail | grep -E "(Error|FATAL|crash|OOM)" | tail -50
```

**Step 2: Common crash causes**

| Log pattern | Cause | Fix |
|-------------|-------|-----|
| `Killed` (no other context) | OOM (out of memory) | Scale VM memory: `flyctl scale memory 4096 -a taxklaro-api` |
| `FATAL ERROR: Reached heap limit` | Node.js heap OOM | Increase `--max-old-space-size`: add `ENV NODE_OPTIONS="--max-old-space-size=1536"` to Dockerfile |
| `Error: ENOTFOUND db.*.supabase.co` | DNS resolution failure for Supabase | Usually transient; if persistent, check Supabase status |
| `Error: listen EADDRINUSE :3001` | Port conflict (should not happen on Fly) | Force restart: `flyctl machine restart <id> -a taxklaro-api` |

**Step 3: If cause is unclear, deploy with debug logging**
```bash
flyctl secrets set LOG_LEVEL=debug -a taxklaro-api
flyctl deploy --remote-only -a taxklaro-api
# Wait 5 minutes, check logs, then restore
flyctl secrets set LOG_LEVEL=info -a taxklaro-api
```

### 12.7 Runbook: Database Storage Approaching Limit (P3→P1)

**Trigger:** Manual weekly check shows > 7 GB used.

**Step 1: Check table sizes (Supabase SQL Editor)**
```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS total_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;
```

**Step 2: Identify and prune the largest tables**

The most likely large tables:
- `audit_logs` — purge rows older than 90 days: `DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days'`
- `computation_logs` — purge rows older than 180 days: `DELETE FROM computation_logs WHERE created_at < NOW() - INTERVAL '180 days'`
- `sessions` — expired sessions already cleaned by cron job; manually trigger: `DELETE FROM sessions WHERE expires_at < NOW()`

**Step 3: If pruning is insufficient, upgrade Supabase plan**
- In Supabase Dashboard → Settings → Billing → Change Plan
- Pro plan includes 8 GB, then $0.125/GB additional
- Alternatively, upgrade to Team plan ($599/month, includes 100 GB) — only justified above ~50K MAU

---

*End of monitoring.md*
